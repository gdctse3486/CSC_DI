# Clinical Supply Chain Decision Intelligence Observatory

A static, GitHub Pages-ready dashboard that collects public industry stories and translates them into potential clinical supply chain applications across **PLAN, SOURCE, MAKE and DELIVER**.

## What is included

- `index.html`, `styles.css`, `app.js` — responsive interactive webpage.
- `data/articles.json` — published story dataset consumed by the page.
- `config/sources.json` — monitored search themes and company watchlist.
- `scripts/ingest.py` — daily RSS ingestion, deduplication, technology tagging and clinical use-case mapping.
- `.github/workflows/refresh-news.yml` — scheduled GitHub Actions workflow.

## Publish with GitHub Pages

1. Create a GitHub repository and upload the contents of this folder to its root.
2. In **Settings → Pages**, set **Deploy from a branch**, choose `main` and `/ (root)`, then Save.
3. In **Actions**, enable workflows if GitHub asks.
4. Open **Actions → Refresh clinical supply chain intelligence → Run workflow** to run the first collection.
5. After the workflow commits `data/articles.json`, refresh the published webpage.

The workflow runs daily at 05:17 UTC. You can change the cron schedule in `.github/workflows/refresh-news.yml`.

## Data collection and limitations

- The first version uses Google News RSS search results, so it does not require an API key.
- It collects public article metadata and descriptions, not full paywalled article text.
- Search results, source availability and RSS behaviour can change. Failed queries are logged in the workflow output.
- Company matching is based on names appearing in the title/description. The publisher is shown where no tracked company is matched.
- Classification is keyword-based in this starter version. It is a useful triage layer, not a validated AI assessment.
- Clinical use-case mappings are suggested applications, not claims that a vendor has implemented that capability or that AstraZeneca currently has/does not have it.
- Relevance is a heuristic based on the story text and tags. Review original sources before using findings in formal strategy or external communications.
- Do not add confidential AstraZeneca information, study data, patient data or internal system details to this public repository.

## Customise the company list and topics

Edit `config/sources.json`:
- `companies`: vendors and technology providers to recognise.
- `queries`: Google News search expressions.
- `max_articles_per_query`: maximum RSS items considered per search.
- `max_age_days`: age limit for stories.

Add more company names and query themes as the monitoring scope evolves.

## Suggested next iteration

1. Add an approved LLM enrichment step for higher-quality summaries, evidence extraction and relevance scoring.
2. Add a reviewed use-case ontology with stable IDs, decision owners, input data, recommended action and measurable outcome.
3. Add evidence levels: announcement, product capability, customer pilot, production deployment and independently evidenced outcome.
4. Add exportable weekly briefings and an opportunity prioritisation matrix.

## Local preview

From this directory run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`. The browser must be able to load `data/articles.json` from the local server; opening `index.html` directly as a file may block the fetch request.
