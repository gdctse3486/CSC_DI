#!/usr/bin/env python3
"""Fetch Google News RSS search results and map them to clinical supply chain use cases.
No paid API key is required. All story records retain the original article URL and source.
"""
import json, re, time, hashlib, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from pathlib import Path
from email.utils import parsedate_to_datetime

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "config" / "sources.json").read_text())
OUT = ROOT / "data" / "articles.json"
NOW = datetime.now(timezone.utc)

TECH_RULES = {
 "Agentic AI": ["agentic", "ai agent", "multi-agent"],
 "Artificial intelligence": ["artificial intelligence", "generative ai", "genai", "machine learning", " ai "],
 "Predictive analytics": ["predictive", "forecasting", "forecast", "prediction"],
 "Prescriptive analytics": ["prescriptive", "optimisation", "optimization", "recommendation engine"],
 "Decision intelligence": ["decision intelligence", "decision-making", "decision making", "decision automation"],
 "Digital twins": ["digital twin", "simulation", "scenario modelling", "scenario modeling"],
 "Control towers": ["control tower", "visibility platform", "end-to-end visibility"],
 "Automation and orchestration": ["automation", "orchestration", "autonomous"]
}
STREAM_RULES = {
 "PLAN": ["demand planning","demand forecast","forecasting","inventory","replenishment planning","scenario","s&op","planning","study demand","enrolment","enrollment","randomisation","randomization"],
 "SOURCE": ["supplier","sourcing","procurement","raw material","component","vendor","supplier risk","material availability","capacity sourcing"],
 "MAKE": ["manufactur","production","batch","packaging","labelling","labeling","quality","release","yield","plant","factory"],
 "DELIVER": ["logistics","shipment","shipping","distribution","depot","transport","delivery","last mile","clinical site","site resupply","cold chain","visibility"]
}
USE_CASES = {
 "PLAN": [
  ("Study demand sensing","Use study milestones, enrolment, randomisation and site consumption to anticipate changing clinical material demand."),
  ("Inventory and expiry optimisation","Position inventory across studies and depots while balancing service, shelf life and expiry exposure."),
  ("Scenario and change-impact planning","Translate protocol, country and recruitment changes into downstream supply scenarios.")
 ],
 "SOURCE": [
  ("Supplier and material risk prediction","Predict supplier disruption, component shortages and long-lead material constraints before they affect studies."),
  ("Sourcing and capacity optimisation","Evaluate sourcing options, supplier capacity and material availability against study requirements.")
 ],
 "MAKE": [
  ("Manufacturing and release orchestration","Align batch priorities, production capacity, packaging, labelling, quality review and release commitments."),
  ("Predictive batch and quality intelligence","Identify potential yield, deviation, quality and release delays early enough to intervene.")
 ],
 "DELIVER": [
  ("Predictive site resupply","Anticipate site stock-outs using shipment status, site consumption and patient activity; recommend replenishment actions."),
  ("Shipment and cold-chain risk","Predict delivery disruption and temperature excursions and prioritise interventions for at-risk study materials."),
  ("Depot and distribution optimisation","Recommend inventory allocation, routing and distribution decisions across depots, countries and sites.")
 ]
}
def clean(s):
 return re.sub(r"\s+"," ",(s or "")).strip()
def classify(text):
 t=" "+text.lower()+" "
 tech=[name for name,words in TECH_RULES.items() if any(w in t for w in words)]
 streams=[name for name,words in STREAM_RULES.items() if any(w in t for w in words)]
 if not streams: streams=["PLAN"]
 return tech or ["Supply chain technology"], streams
def clinical_application(streams, title):
 labels={"PLAN":"study demand, inventory positioning and supply scenario planning","SOURCE":"supplier resilience, material availability and sourcing decisions","MAKE":"production scheduling, batch execution, packaging, labelling and quality release","DELIVER":"depot inventory, shipment risk and clinical site replenishment"}
 return "Potential clinical supply chain relevance: "+", ".join(labels[s] for s in streams)+". Assess whether the reported capability could improve continuity of supply to clinical studies."
def opportunities(streams):
 out=[]
 for s in streams:
  out.extend([x[0] for x in USE_CASES[s][:2]])
 return list(dict.fromkeys(out))[:6]
def relevance(tech, streams, text):
 score=len(tech)+len(streams)+sum(1 for x in ["clinical trial","clinical supply","pharma","pharmaceutical","study site","drug supply"] if x in text.lower())
 return "High" if score>=7 else ("Medium" if score>=4 else "Emerging")
def parse_date(value):
 try:
  dt=parsedate_to_datetime(value)
  if dt.tzinfo is None: dt=dt.replace(tzinfo=timezone.utc)
  return dt.astimezone(timezone.utc)
 except Exception:return None
def fetch(query):
 url="https://news.google.com/rss/search?"+urllib.parse.urlencode({"q":query,"hl":"en-GB","gl":"GB","ceid":"GB:en"})
 req=urllib.request.Request(url,headers={"User-Agent":"ClinicalSupplyChainIntelligence/1.0 (RSS reader)"})
 with urllib.request.urlopen(req,timeout=25) as response: raw=response.read()
 root=ET.fromstring(raw)
 items=[]
 for item in root.findall(".//item"):
  title=clean(item.findtext("title")); link=clean(item.findtext("link")); desc=clean(re.sub("<[^>]+>"," ",item.findtext("description") or ""))
  source_el=item.find("source"); source=clean(source_el.text if source_el is not None else "Google News")
  pub=clean(item.findtext("pubDate")); dt=parse_date(pub)
  if not title or not link: continue
  if dt and dt < NOW-timedelta(days=CONFIG.get("max_age_days",365)): continue
  items.append((title,link,desc,source,dt))
 return items
def main():
 found={}
 for query in CONFIG["queries"]:
  try:
   results=fetch(query)
   for title,url,desc,source,dt in results[:CONFIG.get("max_articles_per_query",35)]:
    key=hashlib.sha1(url.split("&")[0].encode()).hexdigest()
    if key in found: continue
    text=f"{title} {desc}"
    tech,streams=classify(text)
    matched=[c for c in CONFIG["companies"] if c.lower() in text.lower()]
    company=matched[0] if matched else source
    summary=desc or f"Industry story relating to {', '.join(tech).lower()}. Review the original source for details and evidence of deployment."
    found[key]={
      "id":key,"title":title,"summary":summary[:650],"url":url,"source":source,
      "company":company,"published":dt.isoformat() if dt else None,
      "value_streams":streams,"technologies":tech,
      "clinical_application":clinical_application(streams,title),
      "decision_opportunities":opportunities(streams),
      "use_cases":opportunities(streams),
      "relevance":relevance(tech,streams,text),
      "evidence_status":"External news or announcement. Confirm whether the capability is a concept, pilot or operational deployment from the original source before using it as evidence of proven outcomes."
    }
  except Exception as exc:
   print(f"Query failed: {query!r}: {exc}")
   time.sleep(1)
 articles=sorted(found.values(),key=lambda x:x.get("published") or "",reverse=True)
 payload={"meta":{"last_updated":NOW.isoformat(),"source_count":len(CONFIG["queries"]),"article_count":len(articles),"note":"Stories are sourced from Google News RSS search results. Automated tags and clinical mappings are indicative and should be reviewed before strategic use."},"articles":articles}
 OUT.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 print(f"Wrote {len(articles)} unique stories to {OUT}")
if __name__=="__main__":main()
