const state = { articles: [], stream: "PLAN", search: "", technology: "", relevance: "", visible: 12 };
const $ = (id) => document.getElementById(id);
const streams = ["PLAN","SOURCE","MAKE","DELIVER"];
const useCases = [
  ["Study demand sensing","Combine study milestones, enrolment, randomisation and site consumption to anticipate changing material demand.","PLAN"],
  ["Global inventory optimisation","Recommend inventory positioning across depots, countries and studies while balancing expiry and service risk.","PLAN · DELIVER"],
  ["Supplier and material risk","Predict supplier disruption, component shortages and long-lead material constraints before they affect a study.","SOURCE"],
  ["Manufacturing and release orchestration","Align capacity, batch priorities, packaging, labelling, quality review and release commitments.","MAKE"],
  ["Predictive site resupply","Anticipate site stock-outs using shipment status, consumption and patient activity; recommend the best replenishment action.","DELIVER"],
  ["Cross-study supply balancing","Evaluate constrained inventory across studies and recommend governed allocation scenarios.","PLAN · SOURCE · MAKE · DELIVER"],
  ["Clinical change impact analysis","Translate protocol amendments, country changes and recruitment shifts into downstream supply consequences.","PLAN · MAKE · DELIVER"]
];
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function dateText(v){if(!v)return "Date not stated";const d=new Date(v);return isNaN(d)?"Date not stated":d.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});}
function streamsOf(a){return (a.value_streams||[]).filter(s=>streams.includes(s));}
function relevanceClass(v){return (v||"Emerging").toLowerCase();}
function renderUseCases(){ $("useCaseRadar").innerHTML=useCases.map(([n,d,s])=>`<div class="usecase-item"><strong>${esc(n)}</strong><small>${esc(d)}</small><small><b>${esc(s)}</b></small></div>`).join("");}
function filteredArticles(){
  return state.articles.filter(a=>{
    const hay=[a.title,a.summary,a.company,a.source,a.technologies?.join(" "),a.clinical_application].join(" ").toLowerCase();
    return (!state.stream||streamsOf(a).includes(state.stream))&&(!state.search||hay.includes(state.search))&&(!state.technology||(a.technologies||[]).includes(state.technology))&&(!state.relevance||a.relevance===state.relevance);
  }).sort((a,b)=>new Date(b.published||0)-new Date(a.published||0));
}
function renderStories(){
  const list=filteredArticles();$("resultCount").textContent=`${list.length} ${list.length===1?"story":"stories"}`;
  const shown=list.slice(0,state.visible);
  if(!shown.length){$("storyFeed").innerHTML=`<div class="empty-state"><div class="empty-icon">⌕</div><h3>No matching stories yet</h3><p>Try another value stream or clear your filters. The feed only displays collected, source-linked stories — it does not invent examples.</p></div>`;}
  else $("storyFeed").innerHTML=shown.map((a,i)=>`<article class="story-card" data-id="${esc(a.id)}" tabindex="0" role="button" aria-label="Open story: ${esc(a.title)}"><div class="story-top">${streamsOf(a).map(s=>`<span class="tag ${s.toLowerCase()}">${s}</span>`).join("")}<span class="tag">${esc((a.technologies||[])[0]||"Industry signal")}</span><span class="date-label">${dateText(a.published)}</span></div><h3>${esc(a.title)}</h3><p class="story-summary">${esc(a.summary||"Open the original source for more information.")}</p><div class="story-bottom"><span class="story-company">${esc(a.company||a.source||"Industry")}</span><span class="story-link">VIEW INTELLIGENCE ↗</span></div></article>`).join("");
  $("loadMore").hidden=list.length<=state.visible;
  document.querySelectorAll(".story-card").forEach(el=>{const open=()=>openStory(el.dataset.id);el.addEventListener("click",open);el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}});});
}
function openStory(id){
  const a=state.articles.find(x=>x.id===id);if(!a)return;
  $("dialogContent").innerHTML=`<div class="dialog-content"><p class="eyebrow">INDUSTRY INTELLIGENCE · ${esc(a.source||"SOURCE NOT STATED")}</p><h2>${esc(a.title)}</h2><p>${esc(a.summary||"No summary available.")}</p><div class="story-top">${streamsOf(a).map(s=>`<span class="tag ${s.toLowerCase()}">${s}</span>`).join("")}<span class="tag">${esc(a.relevance||"Emerging")} relevance</span><span class="date-label">${dateText(a.published)}</span></div><div class="dialog-section"><h4>Technology signals</h4><p>${esc((a.technologies||[]).join(" · ")||"Not yet classified")}</p></div><div class="dialog-section"><h4>Clinical supply chain application</h4><p>${esc(a.clinical_application||"Review the source and assess potential relevance to clinical supply operations.")}</p></div><div class="dialog-section"><h4>Potential decision opportunities</h4><ul>${(a.decision_opportunities||["Assess relevance to clinical supply chain decisions","Identify data, process and governance requirements","Evaluate feasibility and potential impact"]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div><div class="dialog-section"><h4>Evidence assessment</h4><p>${esc(a.evidence_status||"Industry announcement or report; independent validation of deployment and outcomes may be required.")}</p></div><a class="source-button" href="${esc(a.url||"#")}" target="_blank" rel="noopener noreferrer">OPEN ORIGINAL STORY ↗</a></div>`;
  $("storyDialog").showModal();
}
function renderTech(){
  const counts={};state.articles.forEach(a=>(a.technologies||[]).forEach(t=>counts[t]=(counts[t]||0)+1));
  const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,7);const max=Math.max(1,...entries.map(x=>x[1]));
  $("technologyRadar").innerHTML=entries.length?entries.map(([n,c])=>`<div class="tech-row"><span>${esc(n)}</span><b>${c} ${c===1?"story":"stories"}</b><div class="tech-track"><i style="width:${Math.max(8,c/max*100)}%"></i></div></div>`).join(""):`<p class="muted">Technology themes will populate as stories are ingested.</p>`;
}
function renderMetrics(){
  const companies=new Set(state.articles.map(a=>a.company).filter(Boolean));
  const useCount=new Set(state.articles.flatMap(a=>a.use_cases||[])).size;
  $("storyCount").textContent=state.articles.length.toLocaleString();$("companyCount").textContent=companies.size.toLocaleString();$("useCaseCount").textContent=useCount.toLocaleString();
  const latest=state.articles.map(a=>a.published).filter(Boolean).sort().at(-1);$("freshness").textContent=latest?dateText(latest):"—";
  const updated=state.meta?.last_updated?new Date(state.meta.last_updated):null;
  $("lastUpdated").textContent=updated&&!isNaN(updated)?`Updated ${updated.toLocaleString()}`:"Waiting for first data refresh";
  const techs=[...new Set(state.articles.flatMap(a=>a.technologies||[]))].sort();
  $("techFilter").innerHTML='<option value="">All technologies</option>'+techs.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join("");
}
function applyFilters(){state.search=$("searchInput").value.trim().toLowerCase();state.stream=$("streamFilter").value;state.technology=$("techFilter").value;state.relevance=$("relevanceFilter").value;state.visible=12;document.querySelectorAll(".stream-card").forEach(b=>b.classList.toggle("active",b.dataset.stream===state.stream));renderStories();}
async function loadData(){
  $("refreshBtn").disabled=true;
  try{const r=await fetch(`data/articles.json?t=${Date.now()}`,{cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);const data=await r.json();state.articles=Array.isArray(data.articles)?data.articles:[];state.meta=data.meta||{};renderMetrics();renderTech();renderStories();}
  catch(e){$("storyFeed").innerHTML=`<div class="empty-state"><h3>Could not load the story dataset</h3><p>${esc(e.message)}. Check that data/articles.json exists in the published repository.</p></div>`;}
  finally{$("refreshBtn").disabled=false;}
}
document.querySelectorAll(".stream-card").forEach(b=>b.addEventListener("click",()=>{$("streamFilter").value=state.stream===b.dataset.stream?"":b.dataset.stream;applyFilters();}));
["searchInput","streamFilter","techFilter","relevanceFilter"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",applyFilters));
$("loadMore").addEventListener("click",()=>{state.visible+=12;renderStories();});
$("refreshBtn").addEventListener("click",loadData);$("dialogClose").addEventListener("click",()=>$("storyDialog").close());
$("storyDialog").addEventListener("click",e=>{if(e.target===$("storyDialog"))$("storyDialog").close();});
renderUseCases();loadData();
