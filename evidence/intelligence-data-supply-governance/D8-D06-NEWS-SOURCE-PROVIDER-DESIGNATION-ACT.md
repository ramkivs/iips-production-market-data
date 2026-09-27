# Institutional Investment Platform System (IIPS)
# D8 D06 News — Source/Provider Designation Act (Free Provider Prospective Acquisition Authority)

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `d8-d06-news-source-provider-designation-2026-09-27-001`
**Governing Authority:** RAMKI (Provider Designating Authority / Authorizing Authority)
**Recording Agent:** Arena (recording only — no implementation performed or authorized by this act beyond governance record)
**Act Type:** AUTHORITY SOURCE/PROVIDER DESIGNATION + PROSPECTIVE ACQUISITION AUTHORIZATION (non-executable; NO M-1 COMMISSIONING, NO M-3 ESTABLISHMENT, NO IMPLEMENTATION, NO PRODUCTION, NO CERTIFICATION AUTHORITY)
**Recorded At (local, Asia/Calcutta):** 2026-09-27
**Antecedent Checkpoint:** `9f608d94195fb14c6aa11dd7b7158043d491be5d`
**Parent Checkpoint:** `62330df0889ca1fe05009b0366ec1286d3865704`
**Governed Branch:** `arena/01a0ddae-iips-production-market-data`
**Gate Context:** `GATE-Y (Intelligence Data-Supply)` — SELECTED/OPENED by `gate-y-intel-data-supply-designation-selection-2026-09-27-001` at `95f36cf`; M-2 ESTABLISHED by `gate-y-m2-intelligence-data-authorization-2026-09-27-001` at `7db93a6`; D8 Domain Scope ESTABLISHED by `d8-intelligence-domain-scope-determination-2026-09-27-001` at `a2eee10` — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL/FEASIBILITY-GATED; Provider Designation for D07 ESTABLISHED by `d8-d06-d07-source-provider-designation-2026-09-27-001` at `e14b3b4` — TIGZIG Yahoo Finance estimates route SELECTED for PROSPECTIVE D07 ONLY; D07 M-1 COMMISSIONED at `b0faa13` — `d07-m1-prospective-estimates-observation-commissioning-2026-09-27-001`; M-1 DEPLOYED/DEPOSITED at `62330df` — 40 obs, 39 valid, 1 null, 5 entities, 6110B raw SHA-256 `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254`, observation `2026-09-27T18:18:58Z`; M-3 ESTABLISHED at `9f608d9` — `d07-m3-prospective-estimates-provenance-acceptance-2026-09-27-001`; D07 = CLOSED; D06 provider = NOT DESIGNATED before this act

---

## 1. VERIFIED AUTHORITATIVE PRE-CHECK (inspected before recording, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative repository | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole remote) |
| Authoritative governed branch | `refs/heads/arena/01a0ddae-iips-production-market-data` @ `9f608d94195fb14c6aa11dd7b7158043d491be5d` — LOCAL == REMOTE before mutation |
| Local HEAD | `9f608d94195fb14c6aa11dd7b7158043d491be5d` |
| Worktree | CLEAN (0 entries) — `git status --porcelain` empty |
| GATE-Y designation act | PRESENT — `GATE-Y-INTELLIGENCE-DATA-SUPPLY-DESIGNATION-AND-GATE-SELECTION-ACT.md` blob `aa7746096f24c367322d10a6dcd216ea30fb5815` |
| M-2 authorization act | PRESENT — `GATE-Y-M2-INTELLIGENCE-DATA-AUTHORIZATION-ACT.md` blob `bd3be4024d8910f62860ec46cc267d646c0bc454` |
| D8 scope determination act | PRESENT — `D8-INTELLIGENCE-DOMAIN-SCOPE-DETERMINATION-ACT.md` blob `a2b4179fb323531b675ffe029415d8b3bdd3080b` — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL/FEASIBILITY-GATED |
| D06/D07 source/provider designation act (D07 only) | PRESENT — `D8-D06-D07-SOURCE-PROVIDER-DESIGNATION-ACT.md` blob `2519cbe436f34b2c42e4cbdec0d9acc755dd5a4fa13d28d0b47e0aaed024bd98` — TIGZIG Yahoo Finance estimates route SELECTED for PROSPECTIVE D07 ONLY, D06 News provider remains NOT DESIGNATED per §5 |
| D07 M-1 commissioning act | PRESENT — `D07-M1-PROSPECTIVE-ESTIMATES-OBSERVATION-DATASET-COMMISSIONING-ACT.md` blob `9c0f2975af367da680edd303627cbb0ad9092b4dc37e5b3134052b2b49871e9d` — 45681B — M-1 COMMISSIONED for D07 prospective |
| D07 M-1 deposition | PRESENT — `src/intelligence/d07_prospective_estimates_observation_dataset.ts` 53618B SHA-256 `eda08b8b3d8c600ccdaac4b61a9b4001dd9638eb76cdb015d544744fd6701f03` + `d07_prospective_estimates_raw_response.json` 6110B SHA-256 `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254` — M-1 DEPLOYED/DEPOSITED ACCEPTANCE PASS at `62330df` |
| D07 M-3 provenance act | PRESENT — `D07-M3-PROSPECTIVE-ESTIMATES-PROVENANCE-ACCEPTANCE-ACT.md` blob `7c6cffb8884cdc7723f3fc47155557835a0f6aec030aa95b07446553a90da24d` — 28969B — M-3 ESTABLISHED for already-deposited prospective D07 only |
| D06 News provider designation act | ABSENT — `D8-D06-NEWS-SOURCE-PROVIDER-DESIGNATION-ACT.md` does NOT exist in HEAD or any prior commit (verified via `git ls-tree -r HEAD` and `git log --all --full-history`) |
| D06 scope | **REQUIRED / IN SCOPE** per `D8-INTELLIGENCE-DOMAIN-SCOPE-DETERMINATION-ACT.md` §4 — initial required for D8 Intelligence commissioning path, governed offline dataset must include governed news with provenance, still requires separate provider/source designation and entitlement before commissioning |
| D07 scope | **CLOSED** — provider designated, qualification PASS, M-1 commissioned, M-1 deposited, M-3 established — no further D07 work required |
| D08 scope | **DEFERRED** — do NOT make blocker for initial D8 commissioning, preserve D91/D88, D91/D88 relief NOT GRANTED, macro acquisition NOT AUTHORIZED |
| D09 scope | **CONDITIONAL / FEASIBILITY-GATED** — may enter only if valid governed source, entitlement/licensing, provenance, approvalRef can be established |
| D06 provider | **NOT DESIGNATED** before this act — verified: zero governance records designate D06 News provider, `D8-D06-D07-SOURCE-PROVIDER-DESIGNATION-ACT.md` explicitly says D06 News provider remains NOT DESIGNATED |
| D06 contract | PRESENT — `src/contracts/d06_news.ts` — `NewsEventPayload { companyId?, newsId, headline, summary, publishedAt, category, sentimentScore, relevanceScore, sourcePublisher, tags }` — authoritative, unchanged |
| D06 engine | PRESENT — `src/intelligence/news_engine.ts` — `NewsEngine { newsStore: NewsEventPayload[], ingestNews(item), queryNews({companyId?, asOf, minRelevance?, category?, limit?}) }` — PIT filtering `publishedAt <= asOf`, precedence ordering official exchange disclosures first |
| M-1 D06 | NOT COMMISSIONED |
| M-3 D06 | NOT ESTABLISHED |
| D115 | WITHHELD / UNRESOLVED / NOT AUTHORIZED — `runtimeCompanyId` UNRESOLVED |
| D91/D88 | NOT GRANTED — LIVE-only macro, no relief |
| Production | NOT AUTHORIZED — `productionEligible: false`, external live sockets 0 |

Pre-check result: **PASS — authoritative state matches expected pre-gate HEAD `9f608d9`, D06=REQUIRED/IN SCOPE, D07=CLOSED, D08=DEFERRED, D09=CONDITIONAL, D06 provider NOT DESIGNATED**

---

## 2. GATE OBJECTIVE — PRESERVED

Sole objective:

1. Perform forensic assessment of genuinely available free D06 News provider routes suitable for personal, single-user, non-commercial IIPS platform;
2. Determine whether at least one route can satisfy commissioned governance boundaries;
3. If and only if suitable route actually established, create RAMKI provider designation act selecting exactly ONE provider route for prospective D06 acquisition — prospective only.

This is governance-only gate. No D06 M-1 commissioning, data deposition, provenance establishment, implementation, UI, runtime, production work.

---

## 3. D06 DOMAIN — EXISTING CONTRACT PRESERVED (inspected, not assumed)

### 3.1 D06 Contract — `src/contracts/d06_news.ts`

Verified actual file content (byte-identical to HEAD `9f608d9`):

```ts
export interface NewsEventPayload {
  companyId?: string;
  newsId: string;
  headline: string;
  summary: string;
  publishedAt: string; // ISO-8601 UTC
  category: 'CORPORATE' | 'EARNINGS' | 'REGULATORY' | 'MACRO' | 'MARKET_ROUNDUP';
  sentimentScore: number; // Normalized -1.0 to +1.0
  relevanceScore: number; // Normalized 0.0 to 1.0
  sourcePublisher: string; // Governed sanitized publisher name
  tags: string[];
}
```

Validation: `validateNewsEvent` requires `newsId`, `headline`, `publishedAt` valid ISO-8601, `sentimentScore` -1.0..+1.0, `relevanceScore` 0.0..1.0.

Fields recorded from repository, not from prompt memory: `newsId`, `headline`, `summary`, `publishedAt`, `category`, `sentimentScore`, `relevanceScore`, `sourcePublisher`, `tags`, `companyId?` optional.

### 3.2 D06 Engine — `src/intelligence/news_engine.ts`

- `NewsEngine` holds `private newsStore: NewsEventPayload[] = []`
- `ingestNews(item)` validates sentiment -1.0..+1.0, freezes for immutability
- `queryNews({companyId?, asOf, minRelevance=0.5, category?, limit=20})` — PIT filtering `publishedAt <= asOf`, precedence ordering official exchange disclosures `GOVERNED_EXCHANGE_DISCLOSURE` first, then latest publishedAt, aggregate sentiment BULLISH/BEARISH/NEUTRAL

### 3.3 D06 Fixtures — Forensic Only

- `tests/fixtures/d06_fixtures.json` — strongest candidate per `PHASE1C-INTELLIGENCE-PAYLOAD-FORENSIC-REPORT.md` C-1, but **TEST FIXTURE** — contains deliberately invalid data (`sentimentScore: 5.0`, `publishedAt: "INVALID_DATE"`), no provenance (`lineageDigest`, `sourceClassification`, `dataVersion`, `evaluatedAt` NONE), identity not governed (`companyId: "INFY"` not `EQ_INFY_IN`), wrong shape (raw records not `FilteredNewsResult` engine output), test compatibility ≠ governance authorization — therefore **NOT governed production data** — per forensic report B — FAIL CLOSED
- D05 / P04 governed artifacts contain zero intelligence-domain payload — verified

D06 contract remains authoritative, unchanged by this act.

---

## 4. FREE-PROVIDER RESEARCH — FORENSIC ASSESSMENT

Search for genuinely free provider routes appropriate for **D06 = regulatory disclosure intelligence / securities-market news/disclosures**, consistent with existing D06 scope and governance records.

Forensic performed via web search + TIGZIG OpenAPI inspection + Parse.bot marketplace inspection + NSE RSS directory inspection.

### 4.1 Candidate 1 — TIGZIG Yahoo Finance API / Yahoo Finance data

- **Provider name:** TIGZIG Yahoo Finance API / Yahoo Finance data via yfinance
- **Official service/API:** `https://yfin-h.tigzig.com/v1` REST + `https://yfin-h.tigzig.com/mcp` MCP, OpenAPI `https://yfin-h.tigzig.com/openapi.json`, docs `https://yfin-h.tigzig.com/redoc`
- **Actual endpoint list (24 endpoints, from `tigzig.com/apis/yahoo-finance` and OpenAPI):** `/v1/excel/get-balance-sheet/`, `/v1/excel/get-cash-flow/`, `/v1/excel/get-income-statement/`, `/v1/excel/get-quarterly-balance-sheet/`, `/v1/excel/get-quarterly-cash-flow/`, `/v1/excel/get-quarterly-income-statement/`, `/v1/get-actions/`, `/v1/get-adj-close/`, `/v1/get-all-prices/`, `/v1/get-analyst-price-targets/`, `/v1/get-balance-sheet/`, `/v1/get-calendar/`, `/v1/get-cash-flow/`, `/v1/get-detailed-info/`, `/v1/get-dividends/`, `/v1/get-estimates/`, `/v1/get-income-statement/`, `/v1/get-major-holders/`, `/v1/get-market-data/`, `/v1/get-quarterly-cash-flow/`, `/v1/get-quarterly-income-statement/`, `/v1/get-recommendations/`, `/v1/get-splits/`, `/v1/search/` — **NO news endpoint**
- **Genuinely free:** Yes — open, no-auth, no key, no signup, per TIGZIG docs
- **Authentication:** No auth, fully open
- **Personal single-user account sufficient:** Yes — no account needed
- **Technical capability for D06 News:**
  - Headline/event identity: NO — no news endpoint, no headline field
  - Publisher/source: NO
  - Publication timestamp: NO
  - Article/source URL: NO
  - Entity/ticker/company association: NO for news
  - Event/category: NO
  - Sentiment/relevance: NO
  - Pagination: N/A
  - Deterministic retrieval: N/A for news
  - Response stability for build-time acquisition: N/A for news
- **Acquisition model:**
  - Prospective acquisition capability for news: NO — no news endpoint
  - Rate limits: 60 req/min for Tigzig Unified, 30 req/min for Vigil, per Tigzig docs — but irrelevant for news
  - Multi-entity query: Up to 25 tickers per request for existing endpoints, but no news endpoint to query
  - Five-entity qualification support: NO for D06 News
  - Build-time acquisition outside runtime: N/A
- **Entitlement / licensing:**
  - Per `D8-D06-D07-SOURCE-PROVIDER-DESIGNATION-ACT.md` §5: yfinance intended for research and educational purposes, personal use only; Yahoo API licensed worldwide non-exclusive non-sublicenseable revocable, all rights reserved, YOU SHALL NOT sell/lease/share/transfer/sublicense/derive income without permission; Yahoo ToS no reproduction/modification/rent/lease/sell/trade/distribute for commercial purposes without permission; Tiingo blog no official Yahoo Finance API since 2017 discontinued, unofficial routes gray area redistribution restricted undocumented breaks without notice no SLA; TIGZIG open no-auth HTTP API and MCP exposing Yahoo Finance via yfinance, built/run by one person, FastAPI fastapi-mcp yfinance pandas Coolify Hetzner Cloudflare, no explicit licensing for retention/transformation, relies on underlying Yahoo terms
  - Entitlement basis: LIMITED PERSONAL-USE-ONLY / RESEARCH & EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES — for unrestricted commercial retention/transformation/redistribution, ENTITLEMENT BASIS = NOT ESTABLISHED
- **Regulatory-disclosure requirement:**
  - D06 is not unrestricted generic news aggregation — intended as regulatory disclosure intelligence / securities-market news/disclosures
  - TIGZIG provides NO news, NO regulatory disclosure — generic financial news = regulatory disclosure? NO — `generic financial news = regulatory disclosure source` is FALSE
  - Regulatory exchange/company disclosures available through route: NO — verified via OpenAPI and docs
  - Can support regulatory-disclosure provenance: NO
  - Limitation: Provider supplies NO news at all, let alone regulatory disclosure
- **Decision:** **REJECT for D06 News** — fails technical fit (no news endpoint, no headline/publisher/publishedAt/URL/entity association), fails D06 regulatory-disclosure fit, fails five-entity qualification support. Retains D07 designation for estimates only — D07 remains CLOSED.

### 4.2 Candidate 2 — Finnhub API — Company News + Market News

- **Provider name:** Finnhub — Free realtime APIs for stock, forex, cryptocurrency
- **Official service/API:** `https://finnhub.io/api/v1`, docs `https://finnhub.io/docs/api/market-news`, `https://finnhub.io/docs/api/company-news`
- **Actual endpoints:**
  - `GET /company-news?symbol=AAPL&from=YYYY-MM-DD&to=YYYY-MM-DD&token=API_KEY` — List latest company news by symbol
  - `GET /news?category=general|forex|crypto|merger&token=API_KEY` — Get latest market news
  - `WebSocket wss://ws.finnhub.io` — Stream real-time news for US and Canadian stocks (Premium Access Required)
- **Genuinely free:** Free tier advertised — $0/month, 60 calls/min, US real-time quotes, company news, basic fundamentals, SEC filings, WebSocket (50 symbols) — per Finnhub pricing page and fintegrationfs.com — no credit card required to get started, API key available immediately in dashboard after free account creation
- **Authentication:** API key required — `token` query param or header — free API key from finnhub.io
- **Personal single-user account sufficient:** Yes — free account, free API key, no credit card
- **Technical capability for D06 News:**
  - Headline/event identity: YES — `headline` field, `id` News ID
  - Publisher/source: YES — `source` field (e.g., Yahoo, Benzinga)
  - Publication timestamp: YES — `datetime` Published time in UNIX timestamp
  - Article/source URL: YES — `url` URL of original article
  - Entity/ticker/company association: YES — `related` Related stocks and companies mentioned, `symbol` param filters by symbol
  - Event/category: YES — `category` News category (company, general, forex, crypto, merger)
  - Sentiment: Separate endpoint `NewsSentiment` / company news sentiment endpoint provides sentiment, but main company-news endpoint does NOT provide sentimentScore/relevanceScore — would need to derive or use separate sentiment endpoint
  - Pagination: `minId` param to get latest news only, `from`/`to` date range filtering
  - Deterministic retrieval: YES — date-bounded JSON, bounded by date ranges in filenames to fix vendor revisions ex post per RAPTOR paper
  - Response stability for build-time acquisition: YES — REST updates, can be retained as JSON snapshots per-ticker date-bounded
  - Supported fields mapping to D06 contract: `headline` → `headline`, `summary` → `summary`, `datetime` (UNIX) → `publishedAt` (ISO-8601 conversion), `source` → `sourcePublisher`, `id` → `newsId`, `category` → `category` (needs mapping to CORPORATE/EARNINGS/REGULATORY/MACRO/MARKET_ROUNDUP), `url` → source URL, `related` → companyId association — but `sentimentScore` and `relevanceScore` NOT supplied by main endpoint, would need to be derived or defaulted — limitation
- **Acquisition model:**
  - Prospective acquisition capability: YES — free REST updates, premium news WebSocket for real-time is Premium Access Required per docs, but polling prototype can be free without being equivalent to continuous premium stream per qveris.ai guide — free REST updates can include recent history and new updates
  - Rate limits: Free tier 60 API calls/min per Finnhub pricing — generous for 5-entity qualification
  - Request limits: Free tier 60 calls/min, 1 year of historical news and new updates for company-news endpoint per docs
  - Multiple governed entities per request: NO — company-news endpoint takes single `symbol` param per request, not batch up to 25 like TIGZIG — would need 5 separate requests for 5-entity qualification (RELIANCE.NS, INFY.NS, TCS.NS, HDFCBANK.NS, AXISBANK.NS) — feasible but less efficient
  - Five-entity qualification support: PARTIAL — technically possible via 5 separate requests, but endpoint documentation explicitly states "This endpoint is only available for North American companies" per `pkg.go.dev` and `finnhub.io/docs/api/company-news` — therefore Indian NSE securities like RELIANCE.NS, INFY.NS, TCS.NS, HDFCBANK.NS, AXISBANK.NS are NOT supported — fails five-entity qualification for required Indian entity set
  - Build-time acquisition outside runtime: YES — REST API, can be called offline, retained as JSON, transformed to build-time TS import (D05 pattern), zero live provider execution at runtime
- **Entitlement / licensing:**
  - Free tier: $0/month, 60 calls/min, US real-time quotes, company news, basic fundamentals, SEC filings, WebSocket (50 symbols) — per fintegrationfs.com and Finnhub docs
  - Personal-use status: Free API key for development and prototyping per lobehub.com skills — free tier for development and prototyping
  - Research/educational status: Likely permitted for personal, single-user, non-commercial research per free tier
  - Commercial restrictions: Free tier for development/prototyping, commercial use may require paid plan? Need to check terms — but free tier is generous
  - Redistribution restrictions: Not explicitly documented in fetched pages, but typical financial news APIs restrict redistribution of licensed content — would need to check Finnhub Terms of Service
  - Retention restrictions: Not explicitly documented, but storing transformed metadata may be permitted for personal use, retention of source URLs permitted
  - Derivative/transformation restrictions: Not explicitly documented
  - Source URLs may be retained: YES — `url` field is URL of original article, retaining URL is typical
  - Unofficial/unlicensed: NO — Finnhub is official provider, not unofficial wrapper
  - Revocability: API key revocable, free tier revocable
  - SLA/availability: No SLA for free tier
  - Overall: For limited personal, single-user, non-commercial, research/educational retention/transformation for single-user IIPS, entitlement likely LIMITED PERSONAL-USE-ONLY, but commercial/redistribution NOT ESTABLISHED without checking full ToS — similar to TIGZIG
- **Regulatory-disclosure requirement:**
  - D06 is not unrestricted generic news aggregation — intended as regulatory disclosure intelligence / securities-market news/disclosures
  - Finnhub Company News provides company-linked news — editorial coverage and context — e.g., "What are publishers saying about TCS?" — Company-linked news
  - What did TCS disclose to the exchange? NSE/BSE announcement — The issuer's source filing — This is regulatory disclosure, NOT provided by Finnhub Company News
  - News, filings, and market data are three different inputs per drishti.manasija.in blog: "A filing alert needs an exchange announcement, not a publisher's article about that announcement"
  - Finnhub provides company news (editorial) and SEC filings for US, but NOT NSE/BSE corporate announcements / regulatory filings from India's National Stock Exchange
  - Regulatory exchange/company disclosures available through route: NO — for Indian market, Finnhub Company News only available for North American companies, and even for US, it's news articles, not exchange filings — filings are separate endpoint (SEC filings) for US only
  - Can support regulatory-disclosure provenance: NO — provides generic financial news, not regulatory disclosure source — limitation must be recorded: `generic financial news = regulatory disclosure source` is FALSE
  - Limitation: Provider supplies only generic company news (editorial), not regulatory disclosure source (NSE/BSE announcements) — fails D06 regulatory-disclosure fit for Indian market
- **Decision:** **REJECT for D06 News** — fails technical fit for required Indian entity set (endpoint only available for North American companies per docs, cannot support RELIANCE.NS etc five-entity qualification), fails D06 regulatory-disclosure fit (supplies generic financial news, not NSE/BSE regulatory disclosure), sentimentScore/relevanceScore not supplied by main endpoint would need derivation, single ticker per request not batch.

### 4.3 Candidate 3 — Alpha Vantage API — News & Sentiment (NEWS_SENTIMENT)

- **Provider name:** Alpha Vantage — Market News & Sentiment Trending
- **Official service/API:** `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=API_KEY`, docs `https://www.alphavantage.co/documentation/`
- **Actual endpoint:** `GET /query?function=NEWS_SENTIMENT&tickers=COIN,CRYPTO:BTC,FOREX:USD&time_from=YYYYMMDDTHHMM&time_to=...&limit=1000&apikey=...`
- **Genuinely free:** Free tier advertised — Free API key from `https://www.alphavantage.co/support/#api-key`, free tier 25 requests/day for premium endpoints, 500 requests/day for standard endpoints per mcpservers.org, rate limit 5 calls/min, no credit card required for free key
- **Authentication:** API key required — `apikey` query param — free API key from Alpha Vantage
- **Personal single-user account sufficient:** Yes — free API key, no credit card
- **Technical capability for D06 News:**
  - Headline/event identity: YES — `title` field per MQL5 articles and qveris.ai guides
  - Publisher/source: YES — `source` / `source_domain` per docs
  - Publication timestamp: YES — `time_published` per MQL5 articles
  - Article/source URL: YES — `url` per MQL5 articles
  - Entity/ticker/company association: YES — `tickers` param accepts comma-separated list to filter articles by symbol, `ticker_sentiment` per article
  - Event/category: YES — `topics` per docs, topic classifications
  - Sentiment: YES — overall sentiment score and sentiment label per article, plus `ticker_sentiment` per ticker — integrated sentiment scoring
  - Relevance: YES — `relevance_score` per ticker per qveris.ai and MQL5 articles — measure of how relevant article is to stock
  - Pagination: `limit` param (e.g., limit=1000), `time_from`/`time_to` time range filtering in YYYYMMDDTHHMM format
  - Deterministic retrieval: YES — time-bounded, but duplicate articles observed per openreview.net PDF — need deduplication
  - Response stability for build-time acquisition: YES — REST, can be retained as JSON, but free-key throughput limited
  - Supported fields mapping to D06 contract: `title` → `headline`, `summary` → `summary`, `time_published` → `publishedAt` (needs conversion to ISO-8601), `source` → `sourcePublisher`, URL → source URL, `overall_sentiment_score` → `sentimentScore` (needs normalization -1..+1), `relevance_score` → `relevanceScore` (0..1), topics → `tags`/`category` mapping, tickers → companyId association — mapping feasible but sentiment/relevance are provider-generated enrichment, must retain source URL and original text evidence per qveris.ai guide
- **Acquisition model:**
  - Prospective acquisition capability: YES — time_from/time_to filtering, can poll for new updates
  - Rate limits: Free tier 25 requests/day for premium endpoints (NEWS_SENTIMENT is premium per mcpservers.org), 5 calls/min — restrictive for 5-entity qualification and daily polling — free tier small
  - Request limits: 25 requests/day for premium endpoints, 500/day for standard — small quota
  - Multiple governed entities per request: YES — tickers param accepts comma-separated list (e.g., `AAPL,MSFT`) — supports batch, up to maybe 1000 limit param — supports five-entity qualification via one request (e.g., tickers=RELIANCE.NS,INFY.NS,TCS.NS,HDFCBANK.NS,AXISBANK.NS) — but need to verify Indian ticker support
  - Five-entity qualification support: UNKNOWN / LIKELY FAILS for Indian NSE — StackOverflow answer: "Alphavantage has stopped supporting NSE data" per `stackoverflow.com/questions/62589253` — check docs whether it supports NSE stocks — Indian listings may not resolve, BSE may work per comment — for RELIANCE.NS, INFY.NS etc, may return no data — fails five-entity qualification for required Indian entity set
  - Build-time acquisition outside runtime: YES — REST API, can be called offline, retained as JSON, transformed to build-time TS import
- **Entitlement / licensing:**
  - Free tier: Free API key, no credit card, 25 requests/day premium, 5 calls/min — per mcpservers.org and Alpha Vantage docs
  - Personal-use status: Free API key for personal use, development and prototyping
  - Research/educational status: Likely permitted for personal, single-user, non-commercial research
  - Commercial restrictions: Free tier for personal use, commercial use may require paid plan
  - Redistribution restrictions: Typical financial news APIs restrict redistribution of licensed content — would need to check Alpha Vantage Terms
  - Retention restrictions: Not explicitly documented, but storing transformed metadata may be permitted for personal use
  - Derivative/transformation restrictions: Not explicitly documented
  - Source URLs may be retained: YES — url field is URL of original article
  - Unofficial/unlicensed: NO — Alpha Vantage is official provider, not unofficial wrapper
  - Revocability: API key revocable
  - SLA/availability: No SLA for free tier
  - Overall: For limited personal, single-user, non-commercial, research/educational retention/transformation for single-user IIPS, entitlement likely LIMITED PERSONAL-USE-ONLY, but commercial/redistribution NOT ESTABLISHED — similar to TIGZIG
- **Regulatory-disclosure requirement:**
  - D06 is not unrestricted generic news aggregation — intended as regulatory disclosure intelligence / securities-market news/disclosures
  - Alpha Vantage News & Sentiment provides financial news with sentiment — enriched REST start per qveris.ai — "Alpha Vantage combines news search with ticker/topic filters and sentiment, subject to free-key rate limits" — "Best enriched REST start"
  - It provides company-linked news — editorial coverage and context — not regulatory disclosure
  - News, filings, and market data are three different inputs per drishti blog — filing alert needs exchange announcement, not publisher's article about that announcement
  - Regulatory exchange/company disclosures available through route: NO — Alpha Vantage provides news articles from publishers like Motley Fool, MarketWatch, Benzinga per openreview.net PDF — not NSE/BSE corporate announcements / regulatory filings
  - Can support regulatory-disclosure provenance: NO — provides generic financial news, not regulatory disclosure source — limitation: `generic financial news = regulatory disclosure source` is FALSE — must be recorded
  - Limitation: Provider supplies only generic financial news with sentiment, not regulatory disclosure source (NSE/BSE announcements) — fails D06 regulatory-disclosure fit for Indian market, plus Indian NSE support stopped per StackOverflow
- **Decision:** **REJECT for D06 News** — fails technical fit for required Indian entity set (Alphavantage has stopped supporting NSE data per StackOverflow, Indian tickers like RELIANCE.NS may not resolve), fails D06 regulatory-disclosure fit (supplies generic financial news, not NSE/BSE regulatory disclosure), rate limits restrictive (25/day premium), sentiment is enrichment but not regulatory disclosure provenance.

### 4.4 Candidate 4 — NewsAPI.org — Top Headlines + Everything

- **Provider name:** NewsAPI.org — News API for developers
- **Official service/API:** `https://newsapi.org/v2/top-headlines` + `https://newsapi.org/v2/everything`, docs `https://newsapi.org/docs`
- **Actual endpoints:** `/v2/top-headlines` and searchable `/v2/everything` endpoint
- **Genuinely free:** Free tier advertised — Developer free tier $0, 100 req/day, ~24h delayed, dev only, no credit card — per apicostcalc.com and newsmesh.co — but is it genuinely free for production? NO — free tier restricted to localhost only, strictly for development and testing, not a live app, not production/commercial use
- **Authentication:** API key required — `apiKey` query param or header — free developer key from newsapi.org
- **Personal single-user account sufficient:** Yes for development, but localhost only restriction means cannot deploy even hobby project without upgrading to $449/mo Business plan per newsmesh.co
- **Technical capability for D06 News:**
  - Headline/event identity: YES — `title` field
  - Publisher/source: YES — `source.name`
  - Publication timestamp: YES — `publishedAt` ISO-8601
  - Article/source URL: YES — `url`
  - Entity/ticker/company association: NO — generic news API, no ticker filtering by symbol like RELIANCE.NS — searches by keywords, not ticker association — fails entity/ticker/company association for governed EQ_* identities
  - Event/category: NO — generic news, no corporate/earnings/regulatory category mapping to D06 category, no ML enrichment (categories, entities) per newsmesh.co
  - Sentiment: NO — No ML enrichment, no sentimentScore
  - Relevance: NO — No relevanceScore
  - Pagination: YES — page, pageSize, but limited to about 20 articles per call per free-news-api comparison
  - Deterministic retrieval: PARTIAL — search history limited to about a month for free tier, delayed ~24h
  - Response stability for build-time acquisition: NO — delayed ~24h, localhost only, not suitable for prospective build-time dataset that would be retained
  - Supported fields mapping to D06 contract: `title` → `headline`, `description` → `summary`, `publishedAt` → `publishedAt`, `source.name` → `sourcePublisher`, `url` → source URL — but `newsId`, `category`, `sentimentScore`, `relevanceScore`, `tags`, `companyId` would need to be invented or derived — fails D06 contract mapping without fabrication
- **Acquisition model:**
  - Prospective acquisition capability: NO — articles delayed ~24h per apicostcalc.com, free tier delayed, not real-time
  - Rate limits: Free tier 100 req/day per apicostcalc.com and free-news-api comparison — but localhost only
  - Request limits: 100 req/day, max 20 articles per call per free-news-api comparison
  - Multiple governed entities per request: NO — no ticker filtering, keyword search only
  - Five-entity qualification support: NO — cannot query by RELIANCE.NS etc, no entity association, localhost only restriction prevents deployment even for qualification
  - Build-time acquisition outside runtime: NO — free tier restricted to localhost only, cannot be retained as governed build-time data for IIPS (even non-commercial personal use, localhost restriction fails)
- **Entitlement / licensing:**
  - Free tier: Developer free tier $0, 100 req/day, ~24h delayed, dev only, no credit card — per apicostcalc.com
  - Personal-use status: Free tier for development and testing only, NOT for production or commercial use per apicostcalc.com FAQ
  - Research/educational status: For tutorials and learning projects, it is fine per newsmesh.co, but for anything headed toward production, $449/mo minimum barrier
  - Commercial restrictions: Free Developer plan forbids production and commercial use per apicostcalc.com — shipping public product requires paid Business plan (~$449/mo)
  - Redistribution restrictions: Free tier forbids production/commercial, implies no redistribution
  - Retention restrictions: Delayed articles, limited history (about a month), summaries only per Currents comparison
  - Derivative/transformation restrictions: Not explicitly documented, but localhost-only restriction is most commonly cited frustration
  - Source URLs may be retained: YES — url field, but localhost-only restriction prevents retention for production
  - Unofficial/unlicensed: NO — NewsAPI.org is official provider
  - Revocability: API key revocable
  - SLA/availability: No SLA for free tier
  - Overall: For limited personal, single-user, non-commercial, research/educational retention/transformation for single-user IIPS, entitlement is **NOT ESTABLISHED for production** — free tier explicitly forbids production/commercial use and delays articles ~24h, localhost only — fails entitlement boundary for governed build-time dataset
- **Regulatory-disclosure requirement:**
  - D06 is not unrestricted generic news aggregation — intended as regulatory disclosure intelligence / securities-market news/disclosures
  - NewsAPI.org provides headlines and article metadata from 80,000+ sources worldwide — generic news, not regulatory disclosure
  - Generic financial news = regulatory disclosure source? FALSE
  - Regulatory exchange/company disclosures available through route: NO — provides generic news, not NSE/BSE corporate announcements / regulatory filings
  - Can support regulatory-disclosure provenance: NO — provides generic news, not regulatory disclosure source
  - Limitation: Provider supplies only generic news (80,000+ sources), not regulatory disclosure source — fails D06 regulatory-disclosure fit, plus localhost-only restriction, delayed articles, no ticker association, no sentiment/relevance
- **Decision:** **REJECT for D06 News** — fails entitlement (localhost only, no production/commercial use, delayed ~24h, $449/mo business plan required for live), fails technical fit (no ticker filtering for RELIANCE.NS etc, no entity association, no sentimentScore/relevanceScore, summaries only, max 20 articles per call), fails D06 regulatory-disclosure fit (generic news, not NSE/BSE announcements).

### 4.5 Candidate 5 — NSE India Corporate Announcements via Parse.bot NSE India API (get_corporate_announcements)

- **Provider name:** Parse.bot NSE India API — nseindia.com API wrapper — `get_corporate_announcements` endpoint
- **Official service/API:** `https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements` via `https://api.parse.bot/marketplace/2a81eefa-a201-41f8-af3b-103a9010df01/nseindia-com-api`, docs `https://parse.bot/marketplace/2a81eefa-a201-41f8-af3b-103a9010df01/nseindia-com-api`, OpenAPI spec via Parse.bot
- **Actual endpoint:** `GET get_corporate_announcements` — Get corporate announcements and filings for an NSE segment, newest first. Without `from_date`/`to_date` response is NSE's latest-announcements feed (about 20 rows). When `from_date` and `to_date` both supplied (DD-MM-YYYY, inclusive), every announcement submitted in that range is fetched from NSE in one upstream request — normal trading day roughly 500-700 equities rows, 100-150 debt rows, 100-150 SME rows — returned in pages: `page` (1-based, default 1) and `page_size` (default 100, max 500, larger clamped) slice full set; `total` is number of announcements in whole range, `has_more` says whether later page exists. Supplying only one of from_date/to_date, date not in DD-MM-YYYY form, or non-positive page/page_size yields stale_input error. Page beyond last returns empty items array with same total. Each item carries NSE's fields (`symbol`, `sm_name`, `sm_isin`, `desc`, `attchmntText`, `attchmntFile`, `an_dt`, `sort_date`, `smIndustry`, `seq_id`, `fileSize`, `exchdisstime`, ...); `smIndustry` and `sm_isin` are null when NSE does not publish them (always null for sme segment). Per-call upstream cost same whether or not date range given (one announcements request). Cost 2 credits/call — charged only on success.
- **Genuinely free:** Free tier advertised — $0/mo, 200 credits/month, 5 req/min rate limit, no credit card required to start, free API key at signup via `https://parse.bot/signup` — per Parse.bot pricing page and marketplace — "No credit card. 200 credits on the house. Pay only for what you call." — "Free tier available" — per marketplace offers. Free tier is genuinely free for personal, single-user, non-commercial prototyping and qualification.
- **Authentication:** API key required — `X-API-Key` header — free API key from parse.bot/signup — per cURL example `curl -X GET 'https://api.parse.bot/scraper/.../get_market_status' -H 'X-API-Key: $YOUR_KEY' # ← get one free at parse.bot/signup`
- **Personal single-user account sufficient:** Yes — free account, free API key, no credit card, 200 credits on the house
- **Technical capability for D06 News:**
  - Headline/event identity: YES — `desc` (description/headline), `attchmntText` (attachment text), `seq_id` stable NSE sequence id (dedup key), `announcement_id` per Apify actor (stable NSE sequence id) — per Apify NSE scraper docs: announcement_id stable NSE sequence id (dedup key)
  - Publisher/source: YES — NSE — `GOVERNED_EXCHANGE_DISCLOSURE` — official exchange disclosure, not editorial publisher — highest precedence per `NewsEngine.queryNews` ordering
  - Publication timestamp: YES — `an_dt` announcement date, `sort_date`, `exchdisstime` exchange dissemination time (IST) — per Apify docs: announcement_date, announcement_time (IST), subject, headline, has_xbrl — per Parse.bot docs: an_dt, sort_date, exchdisstime — provides publication timestamp when actually supplied, can be converted to ISO-8601 UTC
  - Article/source URL: YES — `attchmntFile` attachment file (PDF URL) and `attchmntText` — original attachment (PDF) URL and stable record id per Apify docs — per drishti blog: NSE corporate announcements include original attachment (PDF) URL
  - Entity/ticker/company association: YES — `symbol` NSE ticker (e.g., RELIANCE), `sm_name` company name, `sm_isin` ISIN, `smIndustry` industry — deterministic NSE symbol, explicitly supported, no provider-native stored as companyId? Actually symbol is NSE symbol like RELIANCE, not RELIANCE.NS, but can be mapped to EQ_RELIANCE_IN via governed resolver — similar to D07 RELIANCE.NS→EQ_RELIANCE_IN but without .NS suffix — NSE symbol is base symbol
  - Event/category: YES — `subject` NSE category (e.g., "Board Meeting", "Financial Results", "Dividend") per Apify docs — can be mapped to D06 category CORPORATE/EARNINGS/REGULATORY/MACRO/MARKET_ROUNDUP — e.g., Board Meeting→CORPORATE, Financial Results→EARNINGS, Dividend→CORPORATE, regulatory filings→REGULATORY
  - Sentiment: NO — NSE announcements do NOT supply sentimentScore — would need to be derived via separate sentiment analysis or defaulted — but D06 contract requires sentimentScore -1.0..+1.0 — would need to be synthesized or set to 0.0 neutral with explicit limitation — but provider does NOT supply sentiment, so sentimentScore would be QUALIFICATION-INCOMPLETE or derived — limitation must be recorded
  - Relevance: NO — NSE announcements do NOT supply relevanceScore — would need to be derived or defaulted to 1.0 for official exchange disclosures (highest relevance) per NewsEngine precedence — limitation
  - Pagination: YES — `page` (1-based, default 1) and `page_size` (default 100, max 500) slice full set, `total` number of announcements in whole range, `has_more` whether later page exists — per Parse.bot docs
  - Deterministic retrieval: YES — date-bounded, page-based, stable seq_id dedup key, sort_date — can be retained as JSON snapshots per-ticker date-bounded
  - Response stability for build-time acquisition: YES — REST API, returns structured JSON, can be retained as JSON snapshots, transformed to build-time TS import (D05 pattern), zero live provider execution at runtime, zero fs/path dependencies at browser runtime
  - Supported fields mapping to D06 contract: `seq_id` / `announcement_id` → `newsId` (stable id), `desc` → `headline`, `attchmntText` / `desc` → `summary`, `an_dt` + `exchdisstime` → `publishedAt` (ISO-8601 UTC conversion from IST), `symbol` → `companyId` via governed resolver EQ_* (e.g., RELIANCE→EQ_RELIANCE_IN), `subject` → `category` (mapping), `source` NSE → `sourcePublisher` = `GOVERNED_EXCHANGE_DISCLOSURE` (official exchange disclosure, highest precedence), `attchmntFile` → source URL / attachment, `sm_name`, `sm_isin`, `smIndustry` → `tags` — but `sentimentScore` and `relevanceScore` NOT supplied by provider, would need to be derived (sentiment neutral 0.0 or via separate analysis, relevance 1.0 for official disclosures) with explicit limitation — mapping PARTIAL, not full
- **Acquisition model:**
  - Prospective acquisition capability: YES — latest-announcements feed (about 20 rows) newest first without date range, plus date range filtering (DD-MM-YYYY) for every announcement in range — normal trading day 500-700 equities rows — supports prospective acquisition from designation date forward
  - Rate limits: Free tier 5 req/min per Parse.bot pricing — per marketplace: Free $0/mo 200 credits/month 5 req/min — per pricing page: Free +5 req/min rate limit — sufficient for 5-entity qualification (1-2 calls) and daily polling
  - Request limits: Free tier 200 credits/month — get_corporate_announcements costs 2 credits/call — charged only on success — ~100 calls/month for this endpoint — sufficient for qualification and small prospective dataset (e.g., daily 1 call × 30 days = 30 calls = 60 credits <200)
  - Multiple governed entities per request: YES — endpoint returns corporate announcements and filings for an NSE segment, newest first — returns about 20 rows latest feed, or 500-700 equities rows per day with date range — includes multiple symbols in one request — can support five-entity qualification by filtering for 5 symbols client-side (RELIANCE, INFY, TCS, HDFCBANK, AXISBANK) — batch-capable via segment feed, not per-ticker param but segment-wide
  - Five-entity qualification support: YES — via segment feed with date range, returns many symbols, can filter for 5 required Indian NSE securities already represented by authoritative IIPS identity mappings from `governed_fixture_master.ts` — RELIANCE→EQ_RELIANCE_IN, INFY→EQ_INFY_IN, TCS→EQ_TCS_IN, HDFCBANK→EQ_HDFCBANK_IN, AXISBANK→EQ_AXISBANK_IN — deterministic NSE symbol, explicitly supported, no provider-native stored as companyId, not inferred from name — feasible
  - Build-time acquisition outside runtime: YES — REST API, can be called offline via `curl` with API key, retained as JSON, transformed to build-time TS import (D05 pattern), zero `fetch`/`authFetch`/`API`/`OIDC` at runtime, zero dynamic Node fs/path dependencies at browser runtime
- **Entitlement / licensing — MANDATORY:**
  - Free tier: $0/mo, 200 credits, 5 req/min, no credit card required — per Parse.bot pricing and marketplace — genuinely free for personal, single-user, non-commercial prototyping
  - Personal-use status: Free plan comes with 200 credits and no card required — per pricing page — free API key at signup — personal single-user account sufficient
  - Research/educational status: Likely permitted for personal, single-user, non-commercial research/educational purposes — similar to TIGZIG/Yahoo free route
  - Commercial restrictions: NSE does NOT offer publicly documented developer API with open registration — per Parse.bot marketplace description: "NSE does not offer a publicly documented developer API with open registration. Market data distribution is handled through licensed data vendors. This Parse API provides structured JSON access to NSE data without requiring a vendor agreement." — implies free tier is unofficial wrapper, not official NSE licensed data vendor agreement — commercial use requires licensed data vendor agreement — for unrestricted commercial retention/transformation/redistribution, ENTITLEMENT BASIS = NOT ESTABLISHED
  - Redistribution restrictions: NSE corporate announcements are official exchange filings — redistribution may be restricted — typical exchange terms prohibit redistribution without license — per Trading Q&A: BSE charges 9 lakh + GST, ticket plant 2.5 lakh + GST for realtime corporate announcement API — official commercial licensing expensive — free unofficial route does NOT grant redistribution rights
  - Retention restrictions: NSE website terms likely prohibit scraping/bulk extraction — unofficial wrappers re-use front-end endpoints, may operate in gray area — similar to TIGZIG/Yahoo — retention for personal, single-user, non-commercial research may be within intended use for prototyping, but unrestricted retention NOT ESTABLISHED
  - Derivative/transformation restrictions: No explicit permission for arbitrary retention/transformation documented beyond personal use — free API ≠ unrestricted license — no API key ≠ unrestricted retention — personal use ≠ permission to redistribute — public webpage ≠ unrestricted bulk extraction — same as TIGZIG/Yahoo
  - Whether storing transformed metadata is permitted: For limited personal, single-user, non-commercial, research/educational purposes for this single-user IIPS application (LOCAL / PERSONAL / SINGLE-USER / DEVELOPMENT-QUALIFICATION / NON-DEPLOYED tier per GP-5), retention/transformation of transformed metadata (headline, summary, publishedAt, category, sourcePublisher, tags) may be within intended use, but does NOT establish unrestricted license, commercial use, redistribution, or bulk extraction permission
  - Whether source URLs may be retained: YES — `attchmntFile` is original attachment (PDF) URL — retaining source URL is typical and likely permitted for personal use, but redistribution of PDF content may be restricted
  - Whether service is unofficial/unlicensed: YES — Parse.bot is independent, maintained REST wrapper over public data — not official NSE API — unofficial, gray area — per marketplace: "This isn't an official nseindia.com API — it's an independent, maintained REST wrapper over public data. Where the source has no official API (or only a limited one), Parse gives you a stable contract over a source that never promised one"
  - Revocability: API key revocable, free tier revocable, NSE source can change without notice, undocumented, breaks without notice, no SLA — per TIGZIG pattern and Parse.bot docs
  - SLA/availability limitations: No SLA for free tier, undocumented, breaks without notice, no support/SLA, credit headers on every response
  - Overall entitlement basis determination for selected provider: **ENTITLEMENT BASIS = LIMITED PERSONAL-USE-ONLY / RESEARCH & EDUCATIONAL PURPOSES / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES** — for limited personal, single-user, non-commercial, research/educational retention/transformation for this single-user IIPS application (LOCAL / PERSONAL / SINGLE-USER / DEVELOPMENT-QUALIFICATION / NON-DEPLOYED tier per GP-5): LIMITED PERSONAL-USE-ONLY per NSE/Parse.bot free tier, but revocable, non-sublicenseable, no redistribution, gray area for unofficial routes — explicitly recorded; for unrestricted commercial retention/transformation/redistribution, **ENTITLEMENT BASIS = NOT ESTABLISHED**; free API ≠ unrestricted license; no API key ≠ unrestricted retention; personal use ≠ permission to redistribute; public webpage ≠ unrestricted bulk extraction
- **Regulatory-disclosure requirement:**
  - D06 is not being commissioned as unrestricted generic news aggregation — intended as **regulatory disclosure intelligence / securities-market news/disclosures** — per D8 scope act and NewsEngine precedence ordering official exchange disclosures first
  - Determine whether candidate route can support intended regulatory disclosure intelligence use case: YES — NSE corporate announcements and filings for an NSE segment, newest first — each item carries NSE's fields (symbol, sm_name, sm_isin, desc, attchmntText, attchmntFile, an_dt, sort_date, smIndustry, seq_id, fileSize, exchdisstime) — per Parse.bot docs — per Apify NSE scraper docs: Live corporate announcements and regulatory filings from India's National Stock Exchange (NSE) — dividends, quarterly results, board meetings, allotments, credit-rating updates, and more — each with original attachment (PDF) URL and stable record id — Built for analysts, fintech products, and AI agents that need structured Indian-market disclosures without scraping a JavaScript site — per Apify: announcement_id stable NSE sequence id (dedup key), symbol NSE ticker (e.g., RELIANCE), company_name, isin, industry, announcement_date, announcement_time (IST), subject NSE category (e.g., "Board Meeting", "Financial Results", "Dividend"), headline descriptive text, has_xbrl whether structured XBRL filing attached — per drishti blog: "A filing alert needs an exchange announcement, not a publisher's article about that announcement" — "What did TCS disclose to the exchange? NSE/BSE announcement — The issuer's source filing" — this route provides exactly that: NSE/BSE announcement, the issuer's source filing, not editorial news
  - Generic financial news = regulatory disclosure source? FALSE — but this route provides regulatory disclosure source, NOT generic financial news — `generic financial news = regulatory disclosure source` is FALSE, but `NSE corporate announcement = regulatory disclosure source` is TRUE — verified from actual provider/source evidence: Parse.bot get_corporate_announcements returns NSE's latest-announcements feed, NSE's fields, NSE's public corporate-announcements feed (backend behind nseindia.com's Corporate Filings page) per Apify FAQ: "Where does the data come from? NSE's public corporate-announcements feed (the backend behind nseindia.com's Corporate Filings page)" — "How fresh is it? Real-time — announcements appear within minutes of NSE publishing them"
  - Regulatory exchange/company disclosures available through route: YES — verified from actual provider/source evidence — NSE corporate announcements and regulatory filings, newest first, with original attachment PDF URL and stable record id
  - Can support regulatory-disclosure provenance: YES — provides regulatory disclosure provenance: NSE as source/publisher = GOVERNED_EXCHANGE_DISCLOSURE, symbol, seq_id, announcement_date/time, subject, headline, attachment URL — sufficient for D06 regulatory disclosure intelligence
  - Limitation: Provider does NOT supply sentimentScore and relevanceScore — D06 contract requires sentimentScore -1.0..+1.0 and relevanceScore 0.0..1.0 — would need to be derived (e.g., sentiment neutral 0.0 or via separate sentiment analysis, relevance 1.0 for official exchange disclosures) with explicit limitation — sentimentScore/relevanceScore QUALIFICATION-INCOMPLETE or DERIVED — must be recorded, not invented as provider-supplied
  - Limitation: Provider does NOT supply dataVersion, but may supply seq_id as stable id — dataVersion if supplied otherwise NOT PROVIDED
  - Overall: Regulatory-disclosure fit GOOD — provides NSE corporate announcements / regulatory filings, exactly intended D06 use case, unlike generic news APIs
- **Decision:** **SELECT for D06 News** — satisfies minimum governance/technical requirements for D06 regulatory disclosure intelligence: genuinely free tier (200 credits/month, 5 req/min, no credit card, free API key), prospective acquisition capability (latest feed + date range, 500-700 equities rows per day), supports five-entity qualification via symbol filtering for required Indian NSE securities, provides required D06 fields headline (desc), summary (attchmntText/desc), publishedAt (an_dt + exchdisstime conversion to ISO-8601 UTC), sourcePublisher NSE = GOVERNED_EXCHANGE_DISCLOSURE, newsId seq_id, category subject mapping, tags (symbol, industry, isin), source URL attchmntFile, entity/ticker association symbol, deterministic retrieval, pagination, build-time acquisition outside runtime, entitlement LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES — for unrestricted commercial, ENTITLEMENT NOT ESTABLISHED — best fit for D06 regulatory disclosure intelligence among genuinely free routes, unlike generic news APIs which fail regulatory-disclosure fit and Indian coverage.

### 4.6 Additional Candidates Briefly Considered

- **BennyThadikaran NseIndiaApi / BseIndiaApi (Python packages):** Unofficial Python APIs for NSE/BSE India Stock Exchange — `pip install -U bse` — provides announcements via `BSE.announcements` pagination — per GitHub docs and Trading Q&A: "You might like stock-news built using BseIndiaApi. It helps to keep track of corporate announcements and actions on your portfolio." — Technical capability similar to Parse.bot (regulatory disclosure), but NOT a hosted REST API — requires local Python execution, not a stable HTTP contract — would need to host own service — entitlement same gray area — free basis via Python package MIT? — but not a ready-to-use free HTTP API like Parse.bot — therefore NOT selected, but remains research candidate.

- **Apify NSE India Company Announcements Scraper:** Live corporate announcements and regulatory filings from NSE — dividends, results, board meetings, allotments — with PDF attachment URLs — per Apify docs — pricing from $50.00 / 1,000 announcement records — Try for free — but NOT genuinely free for sustained prospective acquisition — free trial limited — therefore fails free basis — REJECT for free-provider designation (commercial).

- **NewsData.io, MarketAux, GNews, Currents, Mediastack, WorldNewsAPI, TheNewsAPI, Bing News API:** Free tiers available per free-news-api comparison — 500 calls/month max 10 articles per call (NewsData.io), limited access (WorldNewsAPI, TheNewsAPI, Bing) — generic news, not regulatory disclosure — some restrict free tier to non-commercial use — rate limits restrictive — therefore REJECT — fail regulatory-disclosure fit, fail entitlement for production, fail Indian NSE coverage.

- **NSE India RSS Feeds (nsearchives.nseindia.com/content/RSS/Announcements.xml etc):** NSE publishes RSS directory that includes corporate-announcement feeds — per drishti blog and feedspot — free, no-auth, open — provides regulatory disclosure — but RSS is limited (title, link, description, pubDate) — less structured than Parse.bot get_corporate_announcements (which provides symbol, seq_id, attchmntFile, an_dt, exchdisstime, smIndustry, sm_isin) — RSS could be alternative free route, but Parse.bot provides more structured fields and pagination and date range filtering — therefore Parse.bot SELECTED over RSS, but RSS remains reference point for filing coverage.

---

## 5. REGULATORY-DISCLOSURE REQUIREMENT — ASSESSMENT

D06 is not being commissioned as unrestricted generic news aggregation.

Per D8 scope act, D06 News = INITIAL REQUIRED / IN SCOPE for initial D8 Intelligence commissioning path — governed offline dataset must include governed news with provenance — still requires separate provider/source designation and entitlement.

Per NewsEngine, official exchange disclosures rank highest — `GOVERNED_EXCHANGE_DISCLOSURE` first, then latest publishedAt — therefore D06 intended as **regulatory disclosure intelligence / securities-market news/disclosures**, not generic editorial news.

**Forensic distinction preserved:**

- `generic financial news = regulatory disclosure source` is FALSE — verified: generic news APIs (Finnhub, Alpha Vantage, NewsAPI.org, NewsData.io, MarketAux, GNews etc) provide editorial coverage and context — "What are publishers saying about TCS?" — Company-linked news — NOT regulatory disclosure
- `NSE corporate announcement = regulatory disclosure source` is TRUE — verified: Parse.bot `get_corporate_announcements` provides NSE's public corporate-announcements feed (backend behind nseindia.com's Corporate Filings page), real-time, announcements appear within minutes of NSE publishing, each with original attachment PDF URL and stable record id — "What did TCS disclose to the exchange?" — NSE/BSE announcement — The issuer's source filing — exactly D06 intended use case
- If provider supplies only generic news, clearly record limitation — done for Finnhub, Alpha Vantage, NewsAPI.org: they supply only generic news, NOT regulatory disclosure — limitation recorded as `REGULATORY_DISCLOSURE_FIT = FAIL — generic financial news only`
- If regulatory exchange/company disclosures available through route, verify from actual provider/source evidence — done for Parse.bot NSE API: verified via Parse.bot marketplace description, Apify NSE scraper FAQ, drishti blog filing vs news distinction, NSE RSS directory — regulatory disclosure available, verified
- If route cannot establish required regulatory-disclosure provenance, record limitation rather than inventing compliance — done: for generic news providers, recorded limitation `REGULATORY_DISCLOSURE_PROVENANCE = NOT ESTABLISHED`; for Parse.bot NSE API, `REGULATORY_DISCLOSURE_PROVENANCE = ESTABLISHED` for NSE corporate announcements, but `sentimentScore`/`relevanceScore` NOT supplied by provider — QUALIFICATION-INCOMPLETE / DERIVED, must be recorded

---

## 6. PROVIDER CANDIDATE SELECTION — DECISION

### Candidates Examined Summary

| # | Provider | Route | Free Basis | Technical Fit D06 | Regulatory-Disclosure Fit | Publication Timestamp Capability | Licensing/Entitlement | Restrictions | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | TIGZIG Yahoo Finance API | `https://yfin-h.tigzig.com/v1` 24 endpoints (no news) | Yes — open, no-auth, no key, no signup | FAIL — no news endpoint, no headline/publisher/publishedAt/URL/entity | FAIL — supplies no news at all | NO — no publishedAt | LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA | Unofficial wrapper over Yahoo, discontinued official API 2017, undocumented, no SLA, free ≠ unrestricted license | **REJECT for D06** — retains D07 designation |
| 2 | Finnhub | `https://finnhub.io/api/v1/company-news?symbol=AAPL&from=...&to=...&token=...` + `/news?category=general` | Yes — free tier $0/mo 60 calls/min, free API key no credit card, 1 year historical | PARTIAL — headline, source, datetime UNIX, summary, url, related, category, but single ticker per request, sentimentScore/relevanceScore not supplied by main endpoint, 60 calls/min generous | FAIL — only North American companies per docs "This endpoint is only available for North American companies", generic company news (editorial), NOT NSE/BSE regulatory disclosure | YES — datetime UNIX → publishedAt ISO-8601 conversion | LIMITED PERSONAL-USE-ONLY likely, but commercial/redistribution NOT ESTABLISHED, official provider not unofficial | North American scope only, no Indian NSE support, no regulatory disclosure, sentiment requires separate endpoint | **REJECT** — fails Indian coverage + regulatory-disclosure fit |
| 3 | Alpha Vantage | `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=...` | Yes — free API key, 25 req/day premium, 5 calls/min, no credit card | PARTIAL — title, url, time_published, authors, summary, source domain, topics, overall sentiment score/label, ticker_sentiment, relevance_score, batch tickers param, but duplicate articles observed, free-key throughput limited | FAIL — generic financial news with sentiment, NOT NSE/BSE regulatory disclosure, plus StackOverflow "Alphavantage has stopped supporting NSE data" — Indian NSE tickers may not resolve | YES — time_published → publishedAt | LIMITED PERSONAL-USE-ONLY likely, commercial/redistribution NOT ESTABLISHED, official provider | Indian NSE support stopped, rate limits restrictive 25/day premium, generic news only | **REJECT** — fails Indian NSE support + regulatory-disclosure fit |
| 4 | NewsAPI.org | `https://newsapi.org/v2/everything` + `/v2/top-headlines` | Free tier $0 100 req/day ~24h delayed dev only, but localhost only restriction — NOT genuinely free for production | FAIL — title, source.name, publishedAt ISO-8601, url, but NO ticker filtering for RELIANCE.NS etc, no entity association, no category mapping to D06, no sentimentScore/relevanceScore, max 20 articles per call, delayed ~24h, history limited ~1 month, summaries only | FAIL — generic news from 80,000+ sources, NOT NSE/BSE regulatory disclosure | YES — publishedAt ISO-8601, but delayed ~24h | **NOT ESTABLISHED for production** — free Developer plan forbids production/commercial use, localhost only, cannot deploy even hobby project without $449/mo Business plan, delayed ~24h | Localhost only, no production/commercial, delayed, no ticker association, no ML enrichment, $449/mo business plan | **REJECT** — fails entitlement + technical fit + regulatory-disclosure fit |
| 5 | **Parse.bot NSE India API — get_corporate_announcements** | `https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements` via `https://parse.bot/marketplace/2a81eefa-a201-41f8-af3b-103a9010df01/nseindia-com-api` | **Yes — genuinely free tier $0/mo 200 credits/month 5 req/min no credit card free API key at signup** — per Parse.bot pricing + marketplace | **PASS for regulatory disclosure** — symbol, sm_name, sm_isin, desc (headline), attchmntText (summary), attchmntFile (PDF URL), an_dt (announcement date), sort_date, exchdisstime (exchange dissemination time IST), smIndustry, seq_id stable id (dedup key), fileSize — maps to D06 headline, summary, publishedAt (an_dt+exchdisstime→ISO-8601 UTC), sourcePublisher NSE=GOVERNED_EXCHANGE_DISCLOSURE, newsId seq_id, category subject mapping, tags (symbol, industry, isin), source URL attchmntFile, entity association symbol — but sentimentScore/relevanceScore NOT supplied by provider — QUALIFICATION-INCOMPLETE/DERIVED | **PASS — GOOD** — NSE corporate announcements and regulatory filings, newest first, with original attachment PDF URL and stable record id — exactly regulatory disclosure intelligence — verified via Parse.bot docs + Apify NSE scraper FAQ "Where does the data come from? NSE's public corporate-announcements feed (backend behind nseindia.com's Corporate Filings page)" + "How fresh is it? Real-time — announcements appear within minutes" + drishti blog filing vs news distinction | **YES — an_dt + exchdisstime → publishedAt ISO-8601 UTC** — provider-supplied publication timestamp when actually supplied, preserved, not replaced with acquisition time, acquisition/observation time separately identified, if absent recorded as unavailable, never fabricated | **LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES** — NSE does NOT offer publicly documented developer API with open registration, market data distribution via licensed vendors per Parse.bot marketplace, BSE charges 9 lakh + GST, ticket plant 2.5 lakh + GST per Trading Q&A, Apify $50/1000 records commercial — free tier unofficial wrapper gray area — for unrestricted commercial retention/transformation/redistribution, ENTITLEMENT BASIS = NOT ESTABLISHED — free API ≠ unrestricted license — no API key ≠ unrestricted retention — personal use ≠ permission to redistribute — public webpage ≠ unrestricted bulk extraction | Unofficial wrapper, gray area, NSE source can change without notice, undocumented, no SLA, credit headers, rate limit 5 req/min, 200 credits/month (~100 calls for this endpoint at 2 credits/call), sentimentScore/relevanceScore NOT supplied by provider must be derived with explicit limitation | **SELECT for D06 News** — satisfies minimum governance/technical requirements for D06 regulatory disclosure intelligence, genuinely free tier, prospective capability, supports 5-entity qualification via symbol filtering, best fit among free routes |

**Additional candidates briefly considered and rejected:**

- BennyThadikaran NseIndiaApi / BseIndiaApi (Python packages): Unofficial Python APIs for NSE/BSE — `pip install -U bse` — provides announcements via `BSE.announcements` pagination — similar regulatory disclosure capability but NOT hosted REST API — requires local Python execution — not stable HTTP contract — entitlement same gray area — free via package but not ready-to-use free HTTP API like Parse.bot — NOT selected, remains research candidate.

- Apify NSE India Company Announcements Scraper: Live corporate announcements from NSE — dividends, results, board meetings, allotments — with PDF attachment URLs — pricing from $50.00 / 1,000 announcement records — Try for free — NOT genuinely free for sustained prospective acquisition — free trial limited — REJECT for free-provider designation (commercial).

- NewsData.io, MarketAux, GNews, Currents, Mediastack, WorldNewsAPI, TheNewsAPI, Bing News API: Free tiers available (NewsData.io 500 calls/month max 10 articles per call, etc) — generic news, not regulatory disclosure, some restrict free tier to non-commercial use, rate limits restrictive — REJECT — fail regulatory-disclosure fit, fail entitlement for production, fail Indian NSE coverage.

- NSE India RSS Feeds (nsearchives.nseindia.com/content/RSS/Announcements.xml): NSE publishes RSS directory including corporate-announcement feeds — free, no-auth, open — regulatory disclosure — but RSS limited (title, link, description, pubDate) — less structured than Parse.bot get_corporate_announcements (which provides symbol, seq_id, attchmntFile, an_dt, exchdisstime, smIndustry, sm_isin) — RSS could be alternative free route, but Parse.bot SELECTED over RSS for more structured fields and pagination and date range filtering — RSS remains reference point for filing coverage.

### Final Selection

**ONE candidate satisfies minimum governance/technical requirements for D06 regulatory disclosure intelligence:**

**Parse.bot NSE India API — get_corporate_announcements endpoint**

Therefore:

```
D06_PROVIDER = SELECTED
```

Select exactly ONE provider — do NOT designate multiple providers "for flexibility."

---

## 7. PROVIDER SELECTION RECORDED (authority statement, verbatim, RAMKI)

> I, RAMKI, as Provider Designating Authority and Authorizing Authority, select ONE free provider route for prospective D06 News acquisition under the already-authorized GATE-Y → M-2 → D8 Intelligence governance scope and the closed D07 chain (D07 provider designated at e14b3b4, M-1 commissioned at b0faa13, M-1 deposited at 62330df, M-3 established at 9f608d9).
>
> I select: **Parse.bot NSE India API — nseindia.com API wrapper — get_corporate_announcements endpoint (`GET get_corporate_announcements` via `https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements`) — for prospective D06 News acquisition.**
>
> I do NOT select TIGZIG Yahoo Finance API for D06 News — TIGZIG has NO news endpoint (24 endpoints, none are news) — TIGZIG remains designated for D07 estimates only at e14b3b4.
>
> I do NOT select Finnhub Company News for D06 News — Finnhub Company News endpoint is only available for North American companies per documentation, cannot support five-entity qualification for required Indian NSE securities RELIANCE.NS, INFY.NS, TCS.NS, HDFCBANK.NS, AXISBANK.NS, and supplies only generic company news (editorial), NOT NSE/BSE regulatory disclosure — fails Indian coverage and regulatory-disclosure fit.
>
> I do NOT select Alpha Vantage News & Sentiment for D06 News — Alpha Vantage has stopped supporting NSE data per StackOverflow, Indian NSE tickers like RELIANCE.NS may not resolve, supplies only generic financial news with sentiment, NOT NSE/BSE regulatory disclosure, rate limits restrictive (25/day premium) — fails Indian NSE support and regulatory-disclosure fit.
>
> I do NOT select NewsAPI.org for D06 News — free tier restricted to localhost only, 100 req/day, delayed ~24h, forbids production/commercial use, no ticker filtering for RELIANCE.NS etc, no entity association, no sentimentScore/relevanceScore, summaries only, first commercial plan $449/mo — fails entitlement, technical fit, and regulatory-disclosure fit.
>
> I do NOT select Apify NSE scraper for D06 News in this free-provider act — Apify pricing from $50.00 / 1,000 announcement records, Try for free but NOT genuinely free for sustained prospective acquisition — commercial, fails free basis.
>
> This selection is made strictly as a **free, personal, single-user, non-commercial acquisition route** for this single-user IIPS application (LOCAL / PERSONAL / SINGLE-USER / DEVELOPMENT-QUALIFICATION / NON-DEPLOYED tier per GP-5). The route is authorized ONLY for prospective acquisition from the designation date onward (designation date: 2026-09-27 per this act) for the purpose of establishing a future governed offline D06 News dataset with proper provenance and lineage, subject to all limitations recorded in this act.
>
> The existing repository D06 contract `src/contracts/d06_news.ts` with `companyId?`, `newsId`, `headline`, `summary`, `publishedAt`, `category`, `sentimentScore`, `relevanceScore`, `sourcePublisher`, `tags` and engine `NewsEngine` with PIT rule `publishedAt <= asOf` and precedence ordering official exchange disclosures first remains authoritative. This act does NOT modify the D06 contract. If a future D06 contract extension is required for richer provenance semantics (e.g., `attachmentUrl`, `seqId`, `exchangeDisseminationTime`, `isXBRL`), that requires a separate governed gate.
>
> This act does NOT claim that Parse.bot NSE India API supplies sentimentScore or relevanceScore — authoritative evidence and repository forensic establish that NSE corporate announcements do NOT supply sentimentScore or relevanceScore — those fields would need to be derived (e.g., sentiment neutral 0.0 or via separate sentiment analysis, relevance 1.0 for official exchange disclosures) with explicit QUALIFICATION-INCOMPLETE / DERIVED limitation, not invented as provider-supplied. This act does NOT claim historical PIT reconstruction is authorized — historical backfill is NOT AUTHORIZED.
>
> This act authorizes prospective acquisition from the designation date onward, retention of acquired source responses for this single-user IIPS application, deterministic transformation into an internal governed D06 News dataset, provenance and lineage recording, and observation/as-of handling consistent with the CURRENT repository D06 contract and NewsEngine PIT rule. It does NOT authorize fabrication of publishedAt, treating acquisitionTime as publishedAt without authoritative basis (unless provider actually supplies publishedAt), claiming historical PIT reconstruction, treating repeated observations as provider revision history, inventing provider revisionSeq, retroactive D06 historical backfill, M-1 commissioning, M-3 establishment, production activation, D115 authority, D91/D88 relief, D08 or D09 activation.

**Selected by:** RAMKI. **Selection:** EXPLICIT — Parse.bot NSE India API get_corporate_announcements route ONLY for D06 News prospective acquisition. TIGZIG remains D07 only. Finnhub, Alpha Vantage, NewsAPI.org, Apify NOT selected for D06.

---

## 8. DISTINCTION — AVAILABILITY vs AUTHORIZATION vs ENTITLEMENT vs CAPABILITY

| Dimension | Status for selected provider (Parse.bot NSE India API get_corporate_announcements) |
| --- | --- |
| **Availability** | **AVAILABLE** — endpoint exists, free tier $0/mo 200 credits/month 5 req/min no credit card free API key at signup, cost 2 credits/call charged only on success, returns NSE corporate announcements newest first ~20 rows latest feed or 500-700 equities rows per day with date range, pagination page/page_size, total/has_more, fields symbol/sm_name/sm_isin/desc/attchmntText/attchmntFile/an_dt/sort_date/smIndustry/seq_id/fileSize/exchdisstime |
| **Authorization** | **AUTHORIZED BY THIS ACT** — `d8-d06-news-source-provider-designation-2026-09-27-001` — governance-only, prospective, single-user, non-commercial, D06 News route ONLY; Parse.bot NSE API is NOT currently authorized before this act, now AUTHORIZED BY THIS ACT for prospective acquisition only |
| **Entitlement** | **LIMITED PERSONAL-USE-ONLY / RESEARCH & EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES** — NSE does NOT offer publicly documented developer API with open registration, market data distribution via licensed data vendors per Parse.bot marketplace, BSE charges 9 lakh + GST, ticket plant 2.5 lakh + GST per Trading Q&A, Apify $50/1000 records commercial — free tier unofficial wrapper gray area — for unrestricted commercial retention/transformation/redistribution, ENTITLEMENT BASIS = NOT ESTABLISHED — free API ≠ unrestricted license — no API key ≠ unrestricted retention — personal use ≠ permission to redistribute — public webpage ≠ unrestricted bulk extraction |
| **Capability** | **PROSPECTIVE D06 REGULATORY DISCLOSURE** — provides NSE corporate announcements and regulatory filings, newest first, with original attachment PDF URL and stable record id — exactly regulatory disclosure intelligence — headline (desc), summary (attchmntText/desc), publishedAt (an_dt + exchdisstime → ISO-8601 UTC), sourcePublisher NSE = GOVERNED_EXCHANGE_DISCLOSURE, newsId seq_id, category subject mapping, tags (symbol, industry, isin), source URL attchmntFile, entity association symbol — but sentimentScore/relevanceScore NOT supplied by provider — QUALIFICATION-INCOMPLETE / DERIVED — does NOT establish historical PIT archive or provider revision sequence |

For comparison, generic news APIs (Finnhub, Alpha Vantage, NewsAPI.org) — AVAILABLE but NOT AUTHORIZED by this act, ENTITLEMENT LIMITED PERSONAL-USE-ONLY at best but some forbid production/commercial (NewsAPI.org localhost only), CAPABILITY generic financial news only, NOT regulatory disclosure, REGULATORY_DISCLOSURE_FIT FAIL.

---

## 9. ENTITLEMENT / LICENSING — DETAILED FINDINGS (mandatory)

Per task requirement, entitlement/licensing determined from provider's actual terms/documentation:

**Parse.bot NSE India API (SELECTED):**

- Parse.bot marketplace: "This isn't an official nseindia.com API — it's an independent, maintained REST wrapper over public data. Where the source has no official API (or only a limited one), Parse gives you a stable contract over a source that never promised one" — per `parse.bot/marketplace/2a81eefa-a201-41f8-af3b-103a9010df01/nseindia-com-api` — unofficial wrapper, not official NSE API
- NSE does not offer publicly documented developer API with open registration — per marketplace: "NSE does not offer a publicly documented developer API with open registration. Market data distribution is handled through licensed data vendors. This Parse API provides structured JSON access to NSE data without requiring a vendor agreement." — implies free tier is unofficial, not official licensed vendor agreement
- Pricing: Free $0/mo 200 credits/month 5 req/min, Hobby $30/mo 1000 credits 20 req/min, Developer $100/mo 5000 credits 100 req/min, Team $300/mo 20000 credits 300 req/min, Company $1000/mo 100000 credits 500 req/min — per marketplace and pricing page — free tier no credit card, 200 credits on the house, pay only for what you call
- Trading Q&A: "In India for retail trader getting access to data is painful. In India only ticket plant provides the API for realtime corporate announcement. They quoted 2.5 lakh + Gst for annual subscription which I think not at all reasonable. bse charges 9 lakh + Gst" — per `tradingqna.com/t/corporate-announcement-data-api/178154` — official commercial licensing expensive, free unofficial route does NOT grant commercial rights
- Apify NSE scraper pricing: from $50.00 / 1,000 announcement records — Try for free — per `apify.com/nexgendata/nse-bse-announcements` — commercial, not genuinely free for sustained prospective acquisition
- Parse.bot pricing page: "No credit card. 200 credits on the house. Pay only for what you call." — "Free plan comes with 200 credits and no card required. Upgrade only when you need more throughput" — per `parse.bot/pricing`
- Credit system: Calling endpoint costs credits — per-call cost varies by API — Building or revising private (off-catalog) API costs 75 credits for new build and 50 for revision — Browsing, subscribing, contributing back to public catalog always free — per pricing page
- Per-call cost for get_corporate_announcements: 2 credits/call — charged only on success — per marketplace
- Rate limit: Free 5 req/min, Hobby 20 req/min, Developer 100 req/min — per marketplace
- No explicit licensing terms for retention/transformation documented on Parse.bot site for NSE data — relies on underlying NSE terms — similar to TIGZIG/Yahoo
- NSE website terms: Not fetched in this gate, but per forensic, NSE corporate announcements are official exchange filings — redistribution may be restricted — typical exchange terms prohibit redistribution without license
- Unresolved licensing limitations recorded explicitly:
  - No explicit permission for arbitrary retention/transformation documented beyond personal use
  - No explicit permission for redistribution, sublicensing, or deriving income — likely prohibited without NSE licensed vendor agreement
  - Unofficial wrappers re-use front-end endpoints, may operate in gray area, no official open API, undocumented, breaks without notice, no support/SLA
  - Parse.bot itself is independent, maintained REST wrapper, not official NSE API — relies on underlying NSE terms
  - Free API ≠ unrestricted license
  - No API key ≠ unrestricted retention
  - Personal use ≠ permission to redistribute
  - Public webpage ≠ unrestricted bulk extraction
- If evidence insufficient for local retention/transformation, record NOT ESTABLISHED rather than inventing: For unrestricted commercial retention/transformation/redistribution, **ENTITLEMENT BASIS = NOT ESTABLISHED**; for limited personal, single-user, non-commercial, research/educational retention/transformation for this single-user IIPS application, entitlement is **LIMITED PERSONAL-USE-ONLY** per NSE/Parse.bot free tier, but remains revocable, non-sublicenseable, no redistribution, gray area for unofficial routes — this act records that limitation explicitly and does NOT grant commercial or redistribution authority

**Finnhub (NOT selected):**

- Free tier $0/mo 60 calls/min, free API key no credit card, 1 year historical company news — per Finnhub docs and fintegrationfs.com
- Company news endpoint only available for North American companies per docs — fails Indian coverage
- Generic company news (editorial), NOT NSE/BSE regulatory disclosure — fails regulatory-disclosure fit
- Entitlement: Free tier for development/prototyping, commercial may require paid plan, official provider not unofficial

**Alpha Vantage (NOT selected):**

- Free API key, 25 req/day premium, 5 calls/min, no credit card
- StackOverflow: "Alphavantage has stopped supporting NSE data" — fails Indian NSE support
- Generic financial news with sentiment, NOT NSE/BSE regulatory disclosure — fails regulatory-disclosure fit
- Rate limits restrictive

**NewsAPI.org (NOT selected):**

- Developer free tier $0 100 req/day ~24h delayed dev only, no credit card, but localhost only restriction — per apicostcalc.com and newsmesh.co
- Free Developer plan forbids production and commercial use, delayed ~24h, localhost only — per FAQ
- First commercial plan $449/mo Business — per apicostcalc.com
- Generic news from 80,000+ sources, NOT NSE/BSE regulatory disclosure — fails regulatory-disclosure fit
- No ticker filtering for RELIANCE.NS etc, no entity association, no sentimentScore/relevanceScore, summaries only, max 20 articles per call — fails technical fit
- Entitlement: NOT ESTABLISHED for production — free tier explicitly forbids production/commercial use

---

## 10. ACQUISITION ROUTE — SELECTED

**Selected route:** Parse.bot NSE India API — nseindia.com API wrapper — get_corporate_announcements endpoint — for prospective D06 News acquisition

- **Provider:** Parse.bot (independent maintained REST wrapper over NSE public data) + NSE India (National Stock Exchange of India) as underlying source
- **Base URL (Parse.bot):** `https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/`
- **Endpoint:** `GET get_corporate_announcements` — Get corporate announcements and filings for an NSE segment, newest first
- **Full URL example:** `https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements` + query params `?from_date=DD-MM-YYYY&to_date=DD-MM-YYYY&page=1&page_size=100` + header `X-API-Key: $YOUR_KEY`
- **Marketplace:** `https://parse.bot/marketplace/2a81eefa-a201-41f8-af3b-103a9010df01/nseindia-com-api`
- **Pricing page:** `https://parse.bot/pricing`
- **Auth:** API key required — `X-API-Key` header — free API key at signup via `https://parse.bot/signup` — no credit card required for free tier
- **Free-tier basis:** Free $0/mo — +200 credits, +5 req/min rate limit — per pricing page — no credit card — 200 credits on the house — per-call cost 2 credits/call for get_corporate_announcements — charged only on success — ~100 calls/month free
- **Rate limits:** Free 5 req/min, Hobby 20 req/min, Developer 100 req/min — per marketplace — sufficient for 5-entity qualification (1-2 calls) and daily prospective polling (1 call/day = 60 credits/month <200)
- **Ticker/symbol support:** NSE symbols — e.g., RELIANCE, TCS, INFY, HDFCBANK, AXISBANK — deterministic NSE symbol (without .NS suffix) — explicitly supported, maps to EQ_* via governed resolver — e.g., RELIANCE→EQ_RELIANCE_IN, INFY→EQ_INFY_IN, TCS→EQ_TCS_IN, HDFCBANK→EQ_HDFCBANK_IN, AXISBANK→EQ_AXISBANK_IN — from `governed_fixture_master.ts` GOVERNED_OFFLINE_REFERENCE_ENTITIES with NSE listings
- **Segment support:** Equities segment (about 20 rows latest feed without date range, 500-700 equities rows per normal trading day with date range), debt segment (100-150 rows), SME segment (100-150 rows) — per Parse.bot docs
- **Pagination:** `page` (1-based, default 1) and `page_size` (default 100, max 500, larger clamped) slice full set; `total` number of announcements in whole range, `has_more` whether later page exists — per docs
- **Data returned:** Each item carries NSE's fields — `symbol` NSE ticker (e.g., RELIANCE), `sm_name` company name, `sm_isin` ISIN, `desc` headline/descriptive text, `attchmntText` attachment text, `attchmntFile` attachment file (PDF URL), `an_dt` announcement date, `sort_date`, `smIndustry` industry, `seq_id` stable NSE sequence id (dedup key), `fileSize`, `exchdisstime` exchange dissemination time (IST), etc — per marketplace — per Apify NSE scraper: announcement_id stable NSE sequence id (dedup key), symbol NSE ticker, company_name, isin, industry, announcement_date, announcement_time (IST), subject NSE category (e.g., "Board Meeting", "Financial Results", "Dividend"), headline descriptive text, has_xbrl whether structured XBRL filing attached, attachment PDF URL
- **Compatibility with governed offline/build-time model:** Prospective acquisition from designation date onward can be retained as source responses and deterministically transformed into internal governed D06 News dataset as build-time TypeScript import (D05 precedent: browser runtime uses build-time imported canonical dataset with zero dynamic Node fs/path dependencies), consistent with Path L offline model, zero live provider execution at runtime, zero `fetch`/`authFetch`/`API`/`OIDC` at runtime — future acquisition step must implement offline bootstrap, not live runtime fetch
- **Regulatory-disclosure fit:** GOOD — provides NSE corporate announcements and regulatory filings, newest first, with original attachment PDF URL and stable record id — exactly regulatory disclosure intelligence — verified via Parse.bot docs + Apify NSE scraper FAQ + drishti blog filing vs news distinction + NSE RSS directory — unlike generic news APIs

**Acquisition route NOT authorized:**

- Historical backfill, retroactive D06 historical reconstruction
- Live runtime fetching in production
- Bulk extraction beyond enforced limits (5 req/min free, 200 credits/month)
- Redistribution, sublicensing, deriving income
- Generic news aggregation as regulatory disclosure — generic financial news ≠ regulatory disclosure source

---

## 11. PERMITTED RETENTION / TRANSFORMATION BOUNDARY

**Permitted by this act (prospective, governance-only):**

- Prospective acquisition from designation date onward (date of this act: 2026-09-27) — retention of acquired source responses for this single-user IIPS application (LOCAL / PERSONAL / SINGLE-USER / DEVELOPMENT-QUALIFICATION / NON-DEPLOYED tier per GP-5)
- Deterministic transformation into internal governed D06 News dataset as build-time TypeScript import (D05 precedent: browser runtime uses build-time imported canonical D06 dataset with zero dynamic Node fs/path dependencies)
- Provenance and lineage recording per `ExecutiveProvenance` requirements — sourceClassification, asOf, evaluatedAt, dataVersion, lineageDigest SHA-256 over actual governed source, quality, replayConstraintApplied
- Observation/as-of handling consistent with CURRENT repository D06 contract: `publishedAt` (provider-supplied publication timestamp when actually supplied, preserved, not replaced with acquisition time) + `asOf` / `submittedAt` PIT rule `publishedAt <= asOf` with existing NewsEngine precedence ordering official exchange disclosures first
- Single-user, non-commercial, research and educational purposes only — per NSE/Parse.bot free tier personal-use-only terms
- Retention of source URLs (attchmntFile PDF URL) for personal use

**NOT permitted:**

- Fabrication of `publishedAt` — this act does NOT authorize fabrication of publishedAt — preserve provider-supplied publication timestamp when actually supplied (an_dt + exchdisstime → ISO-8601 UTC), do NOT replace it with acquisition time, acquisition/observation time must remain separately identified, if provider publication time absent record as unavailable, never fabricate it
- Treating acquisitionTime as publishedAt without authoritative basis — NOT AUTHORIZED unless provider actually supplies publishedAt; NSE corporate announcements DO supply an_dt + exchdisstime as publication timestamp, so publishedAt can be derived from provider fields, but acquisition time must remain separately identified
- Claiming historical PIT reconstruction — NOT AUTHORIZED — historical backfill NOT AUTHORIZED — PROSPECTIVE ONLY from designation date forward
- Treating repeated observations as provider revision history — NOT AUTHORIZED — repeated observations ≠ source revision history
- Inventing provider revisionSeq — NOT AUTHORIZED — locally generated revisionSeq ≠ provider revisionSeq unless governed as such
- Retroactive D06 historical backfill — NOT AUTHORIZED
- M-1 commissioning — NOT AUTHORIZED — M-1 D06 remains NOT COMMISSIONED
- M-3 establishment — NOT AUTHORIZED — M-3 D06 remains NOT ESTABLISHED
- M-4 establishment — NOT AUTHORIZED — D115 WITHHELD
- M-5 establishment — NOT AUTHORIZED — D91/D88 relief NOT GRANTED, D08 DEFERRED
- Production activation, D115 authority, D91/D88 relief, D08/D09 activation — NOT AUTHORIZED — D08 DEFERRED, D09 CONDITIONAL
- Generic news aggregation as regulatory disclosure — generic financial news ≠ regulatory disclosure source — must NOT silently equate

---

## 12. PROSPECTIVE-ONLY BOUNDARY

**Explicitly established by this act:**

```
PROSPECTIVE_ACQUISITION = AUTHORIZED FROM DESIGNATION DATE FORWARD
HISTORICAL_BACKFILL = NOT AUTHORIZED
HISTORICAL_PIT = NOT ESTABLISHED
```

- **Designation date:** 2026-09-27 per this act — authorization date for prospective D06 acquisition
- **Prospective acquisition:** From designation date onward (2026-09-27), acquire NSE corporate announcements and filings via selected Parse.bot NSE India API get_corporate_announcements route
- **Historical backfill:** NOT AUTHORIZED — no retroactive D06 historical reconstruction, no historical acquisition
- **Historical PIT:** NOT ESTABLISHED — provider does NOT establish historical PIT archive beyond latest feed and date-range filtering — historical PIT reconstruction NOT AUTHORIZED
- **No historical acquisition:** Do NOT perform historical acquisition, do NOT manufacture historical observations
- **D06 news publication timestamp handling (unlike D07):**
  - D06 news MAY legitimately contain provider-supplied `publishedAt` — NSE corporate announcements DO supply `an_dt` (announcement date) + `exchdisstime` (exchange dissemination time IST) — per Parse.bot docs and Apify docs
  - Therefore: preserve provider-supplied publication timestamp when actually supplied — `an_dt` + `exchdisstime` → ISO-8601 UTC conversion — e.g., `an_dt` DD-MM-YYYY + `exchdisstime` IST → `publishedAt` ISO-8601 UTC
  - Do NOT replace it with acquisition time — acquisition/observation time must remain separately identified — `observationTimestamp` / `acquiredAt` distinct from `publishedAt`
  - If provider publication time absent, record as unavailable — `publishedAt` = QUALIFICATION-INCOMPLETE or NOT PROVIDED, do NOT fabricate
  - Never fabricate publication timestamp — do NOT manufacture `publishedAt=acquisitionTime` unless provider actually supplies it — for NSE, `an_dt` + `exchdisstime` ARE provider-supplied publication timestamp, so can be used as `publishedAt`
  - Acquisition/observation time must remain separately identified — `acquiredAt` / `observationTimestamp` UTC distinct from `publishedAt`

---

## 13. PROVENANCE REQUIREMENTS

**Future D06 M-1 dataset must be designed around actual evidence.**

Provider designation requires, at minimum where supported, per actual provider schema authoritative:

| Field | Requirement | Value / Rule for Parse.bot NSE API get_corporate_announcements |
| --- | --- | --- |
| `sourceClassification` | REQUIRED | `NSE_CORPORATE_ANNOUNCEMENTS` or `PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS` or `TIGZIG_YAHOO_FINANCE_ESTIMATES`-like classification — to be designated in future M-1 act based on actual governed source — for now, per this designation act, `sourceClassification` = `PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS` or `NSE_CORPORATE_ANNOUNCEMENTS` — must be added to `SourceClassification` enum in future gate if needed — do NOT invent beyond actual evidence |
| `provider` / `source identity` | REQUIRED | `Parse.bot NSE India API` / `NSE India` (National Stock Exchange of India) — via Parse.bot wrapper |
| `request URL` | REQUIRED | Exact URL used — e.g., `https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements?from_date=27-09-2026&to_date=27-09-2026&page=1&page_size=100` + header `X-API-Key` — must be retained verbatim (without exposing API key in repo) |
| `provider-native identifier` | REQUIRED | `seq_id` stable NSE sequence id (dedup key) / `announcement_id` — per NSE — e.g., `seq_id` 123456 |
| `governed EQ_* identity` | REQUIRED | `EQ_*` canonical — e.g., `EQ_RELIANCE_IN` — via governed resolver from `symbol` (RELIANCE→EQ_RELIANCE_IN) |
| `source/publisher` | REQUIRED | `NSE` / `GOVERNED_EXCHANGE_DISCLOSURE` — official exchange disclosure, highest precedence per NewsEngine |
| `event/article identifier` | REQUIRED | `seq_id` / `announcement_id` — stable NSE sequence id |
| `publication timestamp` when actually supplied | REQUIRED where supported | `an_dt` + `exchdisstime` → `publishedAt` ISO-8601 UTC — provider-supplied publication timestamp, preserved, not replaced with acquisition time |
| `acquisition timestamp` | REQUIRED | UTC ISO-8601 observation/acquisition timestamp — e.g., `2026-09-27T18:30:00Z` — MUST be distinguished from `publishedAt` |
| `source URL` | REQUIRED where supported | `attchmntFile` attachment file (PDF URL) — original attachment PDF URL — e.g., `https://nsearchives.nseindia.com/...pdf` |
| `exact source-response byte count` | REQUIRED where raw retained | Exact byte count of raw source response — retained for M-1 deposition |
| `SHA-256 lineage digest` | REQUIRED | SHA-256 over exact raw source response byte-for-byte |
| `data version` if actually supplied | REQUIRED if supplied, otherwise NOT PROVIDED | Provider does NOT supply dataVersion explicitly — seq_id is stable id but not dataVersion — record NOT PROVIDED or use seq_id as version with explicit limitation — do NOT invent |
| `quality state` | REQUIRED | Quality state — GOOD for valid rows, UNAVAILABLE if invalid — per ExecutiveProvenance |
| `replay constraint` | REQUIRED | Boolean — true for prospective observation qualification — replay constraint that observation time ≠ publication time, no historical PIT reconstruction |
| `deterministic transformation record` | REQUIRED | Mapping record: `seq_id`→`newsId`, `desc`→`headline`, `attchmntText`/`desc`→`summary`, `an_dt`+`exchdisstime`→`publishedAt`, `symbol`→`companyId` via governed resolver, `subject`→`category`, `sm_name`/`sm_isin`/`smIndustry`→`tags`, `attchmntFile`→source URL, sentimentScore QUALIFICATION-INCOMPLETE/DERIVED (provider does NOT supply), relevanceScore QUALIFICATION-INCOMPLETE/DERIVED (provider does NOT supply, but 1.0 for official disclosures) |

Do NOT create unsupported fields merely because they appear in this list — actual provider schema authoritative — NSE corporate announcements do NOT supply sentimentScore, relevanceScore, dataVersion — record as QUALIFICATION-INCOMPLETE / DERIVED / NOT PROVIDED, do NOT invent as provider-supplied.

**ExecutiveProvenance mapping (per `src/transports/intelligence_dto.ts` and `src/transports/types.ts`):**

- `sourceClassification` = to be designated (e.g., `NSE_CORPORATE_ANNOUNCEMENTS` or `PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS`)
- `asOf` = observation date for prospective semantics + PIT filtering `publishedAt <= asOf`
- `evaluatedAt` = acquisition timestamp
- `dataVersion` = NOT PROVIDED (provider does not supply explicit dataVersion) or seq_id with explicit limitation
- `lineageDigest` = SHA-256 over actual governed source (byte-for-byte)
- `quality` = GOOD / UNAVAILABLE / PARTIAL
- `replayConstraintApplied` = true (prospective observation qualified, historical PIT not established)

**Qualification lineage to be preserved in future M-1 deposition:**

- Future live acquisition must retain exact raw response, exact request URL, UTC acquisition timestamp, HTTP status, byte count, SHA-256 — similar to D07 pattern

---

## 14. IDENTITY BOUNDARY

All future D06 governed records must use canonical governed identities:

```
EQ_*
```

Never use:

```
INFY
INFY.NS
provider-native ticker (RELIANCE, INFY, TCS, HDFCBANK, AXISBANK as companyId)
```

as the governed `companyId`.

Use existing repository resolver/master:

- `src/identity/governed_fixture_master.ts` — `GOVERNED_OFFLINE_REFERENCE_ENTITIES` 5 entities with NSE listings: RELIANCE, INFY, TCS, HDFCBANK, AXISBANK → `EQ_RELIANCE_IN`, `EQ_INFY_IN`, `EQ_TCS_IN`, `EQ_HDFCBANK_IN`, `EQ_AXISBANK_IN`
- `src/identity/d05_broad_universe_data.ts` — 2250 entities — Tier-2 expanded broad-universe Security Master

Mapping must be deterministic, explicit, one-to-one, no ambiguous, no inferred from name, no fuzzy matching, fail closed if unmapped:

- NSE symbol (e.g., RELIANCE) → governed resolver → `EQ_RELIANCE_IN` — deterministic, explicitly supported, no provider-native stored as companyId, not inferred from name
- For D06, NSE symbol is base symbol without .NS suffix (e.g., RELIANCE not RELIANCE.NS) — unlike D07 which uses RELIANCE.NS — both map to same EQ_* via governed resolver

Do NOT modify resolver in this gate — `src/identity/*` remains frozen, byte-identical.

---

## 15. NO M-1 YET — EXPLICIT NEGATIVE BOUNDARIES

This gate MUST NOT and DOES NOT:

- create D06 M-1 commissioning authority — M-1 D06 remains NOT COMMISSIONED
- create D06 dataset — no D06 dataset created
- acquire and retain D06 production data — no D06 production data acquired and retained (prospective acquisition authorized from designation date forward for future M-1 gate, but not performed in this governance-only gate)
- create raw-response dataset — no raw-response dataset created for D06 in this gate
- create fixtures — no fixtures created
- create adapter — no provider adapter created
- modify `src/contracts/d06_news.ts` — D06 contract remains byte-identical, unchanged
- modify `src/intelligence/news_engine.ts` — NewsEngine remains unchanged
- modify UI — no UI changes
- modify runtime — no runtime changes
- add credentials — no API key, token, secret embedded in repository — Parse.bot free API key must NOT be embedded in repo, must be supplied via environment variable or local config outside repo per security
- add API integration — no API integration created
- establish M-3 — M-3 D06 remains NOT ESTABLISHED
- establish M-4 — M-4 remains NOT ESTABLISHED — dependency-blocked (D115 WITHHELD)
- establish M-5 — M-5 remains CONDITIONAL — relief NOT REQUESTED / NOT GRANTED, D08 DEFERRED
- touch D07 — D07 remains CLOSED — provider designated at e14b3b4, M-1 commissioned at b0faa13, M-1 deposited at 62330df (40 obs, 39 valid, 1 null, 5 entities, 6110B raw SHA `9f76e6a...`), M-3 established at 9f608d9 — no D07 changes by this act
- activate D08 — D08 remains DEFERRED
- activate D09 — D09 remains CONDITIONAL / FEASIBILITY-GATED
- grant D115 — D115 remains WITHHELD / UNRESOLVED / NOT AUTHORIZED, runtimeCompanyId UNRESOLVED
- grant D91/D88 relief — D91/D88 relief remains NOT GRANTED, D08 DEFERRED, LIVE-only macro
- grant production authority — production remains NOT AUTHORIZED, productionEligible false, external live sockets 0

Only allowed repository mutation is **D06 provider forensic/designation governance record** — this file `D8-D06-NEWS-SOURCE-PROVIDER-DESIGNATION-ACT.md` — single file added, no other files changed.

---

## 16. GOVERNANCE ACT — EXPLICIT DESIGNATION SUMMARY

### Authority

- **RAMKI** as Provider Designating / Authorizing Authority
- **GATE-Y context:** SELECTED/OPENED by `gate-y-intel-data-supply-designation-selection-2026-09-27-001` at `95f36cf`, M-2 ESTABLISHED by `gate-y-m2-intelligence-data-authorization-2026-09-27-001` at `7db93a6`, D8 scope ESTABLISHED by `d8-intelligence-domain-scope-determination-2026-09-27-001` at `a2eee10` — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL/FEASIBILITY-GATED
- **Reference to existing M-2 authorization:** `gate-y-m2-intelligence-data-authorization-2026-09-27-001` — governance/data-supply authority for bounded Intelligence M-1→M-5 workstream, covering news/estimates/macro/alt-data
- **D8 scope authority:** `d8-intelligence-domain-scope-determination-2026-09-27-001` — D06=REQUIRED/IN SCOPE for initial D8 Intelligence commissioning path, governed offline dataset must include governed news with provenance, still requires separate provider/source designation and entitlement before commissioning
- **D07 closure:** D07 provider designated at `e14b3b4`, M-1 commissioned at `b0faa13`, M-1 deposited at `62330df`, M-3 established at `9f608d9` — D07 CLOSED

### Forensic Basis

- **Candidates considered:** 5 primary + 4 additional — TIGZIG Yahoo Finance API (24 endpoints, no news), Finnhub Company News + Market News (60 calls/min free, 1 year historical, but North American companies only per docs, generic company news not regulatory disclosure), Alpha Vantage News & Sentiment (25 req/day premium, 5 calls/min, free API key, but stopped supporting NSE data per StackOverflow, generic financial news with sentiment not regulatory disclosure), NewsAPI.org (100 req/day ~24h delayed dev only localhost only, no production/commercial, $449/mo business, generic news 80,000+ sources not regulatory disclosure, no ticker filtering), Parse.bot NSE India API get_corporate_announcements (free $0/mo 200 credits/month 5 req/min no credit card, provides NSE corporate announcements and regulatory filings newest first with original attachment PDF URL and stable record id — exactly regulatory disclosure intelligence)
- **Actual evidence:** TIGZIG OpenAPI `https://yfin-h.tigzig.com/openapi.json` 24 endpoints list, TIGZIG docs `https://www.tigzig.com/apis/yahoo-finance`, Finnhub docs `https://finnhub.io/docs/api/company-news` + `https://finnhub.io/docs/api/market-news` + pricing, Alpha Vantage docs `https://www.alphavantage.co/documentation/` + StackOverflow "Alphavantage has stopped supporting NSE data", NewsAPI.org pricing `https://newsapi.org/pricing` + apicostcalc.com + newsmesh.co (100 req/day delayed localhost only $449/mo business), Parse.bot marketplace `https://parse.bot/marketplace/2a81eefa-a201-41f8-af3b-103a9010df01/nseindia-com-api` + pricing `https://parse.bot/pricing` + get_corporate_announcements endpoint docs (2 credits/call, symbol/sm_name/sm_isin/desc/attchmntText/attchmntFile/an_dt/sort_date/smIndustry/seq_id/fileSize/exchdisstime, about 20 rows latest feed or 500-700 equities rows per day with date range, pagination page/page_size/total/has_more), Apify NSE scraper `https://apify.com/nexgendata/nse-bse-announcements` ($50/1000 records), Trading Q&A `https://tradingqna.com/t/corporate-announcement-data-api/178154` (BSE 9 lakh + GST, ticket plant 2.5 lakh + GST), NSE RSS directory `nsearchives.nseindia.com/content/RSS/` (Announcements RSS), drishti blog filing vs news distinction
- **Selected provider:** Parse.bot NSE India API — nseindia.com API wrapper — get_corporate_announcements endpoint — for prospective D06 News acquisition — regulatory disclosure intelligence, genuinely free tier, prospective capability, supports 5-entity qualification via symbol filtering
- **Rejected candidates and reasons:**
  - TIGZIG Yahoo Finance: REJECT for D06 — no news endpoint, no headline/publisher/publishedAt/URL/entity, fails technical fit + regulatory-disclosure fit, retains D07 designation only
  - Finnhub: REJECT — only North American companies per docs, cannot support RELIANCE.NS etc five-entity qualification for Indian NSE, generic company news (editorial) not NSE/BSE regulatory disclosure, sentimentScore/relevanceScore not supplied by main endpoint, single ticker per request
  - Alpha Vantage: REJECT — stopped supporting NSE data per StackOverflow, Indian NSE tickers may not resolve, generic financial news with sentiment not regulatory disclosure, rate limits restrictive 25/day premium
  - NewsAPI.org: REJECT — free tier localhost only 100 req/day delayed ~24h forbids production/commercial, no ticker filtering, no entity association, no sentimentScore/relevanceScore, summaries only, $449/mo business, generic news not regulatory disclosure
  - Apify NSE scraper: REJECT for free-provider act — $50/1000 records commercial, not genuinely free for sustained prospective acquisition
- **Licensing/entitlement findings:** Parse.bot NSE API is independent maintained REST wrapper over public data, not official NSE API, NSE does not offer publicly documented developer API with open registration, market data distribution via licensed data vendors, BSE 9 lakh + GST, ticket plant 2.5 lakh + GST commercial, Apify $50/1000 commercial — free tier unofficial wrapper gray area — entitlement LIMITED PERSONAL-USE-ONLY / RESEARCH & EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES — for unrestricted commercial retention/transformation/redistribution, ENTITLEMENT BASIS = NOT ESTABLISHED — free API ≠ unrestricted license — no API key ≠ unrestricted retention — personal use ≠ permission to redistribute — public webpage ≠ unrestricted bulk extraction

### Exact Provider Designation

- **Provider:** Parse.bot (independent maintained REST wrapper) + NSE India (National Stock Exchange of India) as underlying source
- **Route:** NSE corporate announcements and regulatory filings — dividends, quarterly results, board meetings, allotments, credit-rating updates, and more — each with original attachment PDF URL and stable record id — per Apify and Parse.bot docs
- **Endpoint:** `GET get_corporate_announcements` — Get corporate announcements and filings for an NSE segment, newest first
- **Full URL example:** `https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements?from_date=27-09-2026&to_date=27-09-2026&page=1&page_size=100` — header `X-API-Key: $YOUR_KEY`
- **Base URL:** `https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/`
- **Marketplace:** `https://parse.bot/marketplace/2a81eefa-a201-41f8-af3b-103a9010df01/nseindia-com-api`
- **Pricing:** `https://parse.bot/pricing`
- **Authentication:** API key required — `X-API-Key` header — free API key at signup via `https://parse.bot/signup` — no credit card required for free tier — must NOT be embedded in repository
- **Free-tier basis:** Free $0/mo — +200 credits, +5 req/min rate limit — no credit card — 200 credits on the house — per-call cost 2 credits/call for get_corporate_announcements — charged only on success — ~100 calls/month free — sufficient for 5-entity qualification (1-2 calls) and daily prospective polling (1 call/day = 60 credits/month <200)
- **Rate limits:** Free 5 req/min, Hobby 20 req/min, Developer 100 req/min — per marketplace — sufficient
- **Supported fields:** `symbol` NSE ticker (e.g., RELIANCE), `sm_name` company name, `sm_isin` ISIN, `desc` headline/descriptive text, `attchmntText` attachment text, `attchmntFile` attachment file (PDF URL), `an_dt` announcement date, `sort_date`, `smIndustry` industry, `seq_id` stable NSE sequence id (dedup key), `fileSize`, `exchdisstime` exchange dissemination time (IST), `subject` NSE category (Board Meeting, Financial Results, Dividend) per Apify — maps to D06 headline, summary, publishedAt, sourcePublisher, newsId, category, tags, source URL, entity association
- **Entity/ticker capability:** NSE symbols — RELIANCE, TCS, INFY, HDFCBANK, AXISBANK — deterministic NSE symbol (without .NS suffix) — explicitly supported, maps to EQ_* via governed resolver — e.g., RELIANCE→EQ_RELIANCE_IN, INFY→EQ_INFY_IN, TCS→EQ_TCS_IN, HDFCBANK→EQ_HDFCBANK_IN, AXISBANK→EQ_AXISBANK_IN — from `governed_fixture_master.ts` GOVERNED_OFFLINE_REFERENCE_ENTITIES with NSE listings — supports five-entity qualification via symbol filtering for required Indian NSE securities

### Entitlement

Preserve narrowest verified boundary:

```
LIMITED PERSONAL-USE-ONLY
RESEARCH / EDUCATIONAL
NON-COMMERCIAL
NON-SUBLICENSEABLE
REVOCABLE
NO REDISTRIBUTION
GRAY AREA FOR UNOFFICIAL ROUTES
```

Do NOT claim unrestricted commercial rights unless actual authoritative entitlement evidence establishes them — for unrestricted commercial retention/transformation/redistribution, ENTITLEMENT BASIS = NOT ESTABLISHED — free API ≠ unrestricted license — no API key ≠ unrestricted retention — personal use ≠ permission to redistribute — public webpage ≠ unrestricted bulk extraction — per TIGZIG/Yahoo precedent and NSE/Parse.bot forensic.

### Acquisition

```
PROSPECTIVE ONLY
NO HISTORICAL BACKFILL
NO HISTORICAL PIT CLAIM
BUILD-TIME ACQUISITION
ZERO LIVE PROVIDER EXECUTION AT RUNTIME
```

- Prospective only from designation date 2026-09-27 onward — authorization date per this act
- No historical backfill — retroactive D06 historical reconstruction NOT AUTHORIZED
- No historical PIT claim — HISTORICAL_PIT NOT ESTABLISHED — provider does NOT establish historical PIT archive beyond latest feed and date-range filtering — historical PIT reconstruction NOT AUTHORIZED
- Build-time acquisition — retention of acquired source responses for single-user IIPS application, deterministic transformation into internal governed D06 News dataset as build-time TypeScript import (D05 precedent), zero dynamic Node fs/path dependencies at browser runtime
- Zero live provider execution at runtime — future acquisition step must implement offline bootstrap, not live runtime fetch — zero `fetch`/`authFetch`/`API`/`OIDC` at runtime

### Provenance

Record exact provenance obligations supported by provider per actual provider schema authoritative:

- `sourceClassification` = to be designated in future M-1 act (e.g., `NSE_CORPORATE_ANNOUNCEMENTS` or `PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS`) — must be added to `SourceClassification` enum in future gate if needed — do NOT invent beyond actual evidence — NSE corporate announcements do NOT supply sentimentScore/relevanceScore/dataVersion — record as QUALIFICATION-INCOMPLETE / DERIVED / NOT PROVIDED
- `provider` / `source identity` = Parse.bot NSE India API / NSE India
- `request URL` exact verbatim (without exposing API key)
- `provider-native identifier` = seq_id stable NSE sequence id / announcement_id
- `governed EQ_* identity` = EQ_* canonical via governed resolver from symbol
- `source/publisher` = NSE / GOVERNED_EXCHANGE_DISCLOSURE — official exchange disclosure, highest precedence per NewsEngine
- `event/article identifier` = seq_id / announcement_id
- `publication timestamp` when actually supplied = an_dt + exchdisstime → publishedAt ISO-8601 UTC — provider-supplied publication timestamp, preserved, not replaced with acquisition time, acquisition/observation time separately identified, if absent recorded as unavailable, never fabricated
- `acquisition timestamp` = UTC ISO-8601 observation/acquisition timestamp, distinct from publishedAt
- `source URL` = attchmntFile attachment file (PDF URL) — original attachment PDF URL
- `exact source-response byte count` = exact byte count of raw source response
- `SHA-256 lineage digest` = SHA-256 over exact raw source response byte-for-byte
- `data version` if actually supplied = NOT PROVIDED (provider does NOT supply explicit dataVersion) or seq_id with explicit limitation
- `quality state` = GOOD / UNAVAILABLE / PARTIAL per ExecutiveProvenance
- `replay constraint` = true — prospective observation qualified, historical PIT not established
- `deterministic transformation record` = mapping record seq_id→newsId, desc→headline, attchmntText/desc→summary, an_dt+exchdisstime→publishedAt, symbol→companyId via governed resolver, subject→category, sm_name/sm_isin/smIndustry→tags, attchmntFile→source URL, sentimentScore QUALIFICATION-INCOMPLETE/DERIVED, relevanceScore QUALIFICATION-INCOMPLETE/DERIVED (1.0 for official disclosures)

### Identity

Require governed `EQ_*` identity resolution:

- All future D06 governed records must use canonical governed identities `EQ_*` — never `INFY`, `INFY.NS`, provider-native ticker as governed companyId
- Use existing repository resolver/master — `governed_fixture_master.ts` 5 entities + `d05_broad_universe_data.ts` 2250 entities
- Mapping deterministic, explicit, one-to-one, no ambiguous, no inferred from name, no fuzzy matching, fail closed if unmapped — e.g., RELIANCE→EQ_RELIANCE_IN, INFY→EQ_INFY_IN, TCS→EQ_TCS_IN, HDFCBANK→EQ_HDFCBANK_IN, AXISBANK→EQ_AXISBANK_IN — NSE symbol base without .NS suffix, unlike D07 which uses RELIANCE.NS
- Do NOT modify resolver in this gate

### Explicit Exclusions

This act does NOT authorize:

- M-1 — M-1 D06 remains NOT COMMISSIONED — no D06 M-1 commissioning authority by this act
- M-3 — M-3 D06 remains NOT ESTABLISHED — no D06 M-3 provenance establishment by this act
- D07 changes — D07 remains CLOSED — provider designated at e14b3b4, M-1 commissioned at b0faa13, M-1 deposited at 62330df (40 obs, 39 valid, 1 null, 5 entities, 6110B raw SHA `9f76e6a...`), M-3 established at 9f608d9 — no D07 changes
- D08 — D08 remains DEFERRED — macro remains LIVE-only per D91, D91/D88 relief NOT GRANTED, macro acquisition NOT AUTHORIZED
- D09 — D09 remains CONDITIONAL / FEASIBILITY-GATED — may enter only if valid governed source, entitlement/licensing, provenance, approvalRef can be established
- D115 — D115 remains WITHHELD / UNRESOLVED / NOT AUTHORIZED, runtimeCompanyId UNRESOLVED — no D115 production activation
- D91/D88 relief — D91/D88 relief remains NOT GRANTED, D08 DEFERRED, LIVE-only macro
- Production — Production remains NOT AUTHORIZED, productionEligible false, external live sockets 0
- Runtime integration — No runtime API integration, zero live provider execution at runtime, build-time acquisition only
- UI integration — No UI integration, no UI changes
- Unrestricted redistribution — NOT AUTHORIZED — LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES — commercial/redistribution NOT ESTABLISHED

---

## 17. AUTHORITY STATES — RECORDED SEPARATELY

| Authority | State after this D06 provider act |
| --- | --- |
| `D8_INTELLIGENCE_WORKSTREAM_DESIGNATION` | ESTABLISHED BY `gate-y-intel-data-supply-designation-selection-2026-09-27-001` — unchanged |
| `INTELLIGENCE_DATA_SUPPLY_GATE` | SELECTED / OPENED FOR GOVERNANCE RESOLUTION — unchanged |
| `M-2_INTELLIGENCE_DATA_SUPPLY_AUTHORITY` | ESTABLISHED BY `gate-y-m2-intelligence-data-authorization-2026-09-27-001` — governance/data-supply authority only, bounded to news/estimates/macro/alt-data — unchanged |
| `D8_DOMAIN_SCOPE_DETERMINATION` | ESTABLISHED BY `d8-intelligence-domain-scope-determination-2026-09-27-001` — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL/FEASIBILITY-GATED — unchanged |
| `D07_SOURCE_PROVIDER_DESIGNATION` | ESTABLISHED BY `d8-d06-d07-source-provider-designation-2026-09-27-001` — TIGZIG Yahoo Finance estimates route SELECTED for PROSPECTIVE D07 ONLY — unchanged |
| `D07_PROSPECTIVE_ACQUISITION_QUALIFICATION` | ESTABLISHED — INFY.NS PASS (1220B SHA `13257362...` 2026-09-27T17:55:35Z) + MULTI_ENTITY PASS (6111B SHA `2b2813a3...` 2026-09-27T18:02:58Z) + deposition 6110B SHA `9f76e6a...` 2026-09-27T18:18:58Z — unchanged |
| `M-1_D07_PROSPECTIVE_ESTIMATES_OBSERVATION_DATASET` | COMMISSIONED at `b0faa13` + DEPLOYED/DEPOSITED at `62330df` — 40 obs, 39 valid, 1 null, 5 entities, 6110B raw SHA `9f76e6a...`, observation `2026-09-27T18:18:58Z` — CLOSED |
| `M-3_D07_PROVENANCE` | ESTABLISHED at `9f608d9` — provenance chain verified raw 6110B SHA `9f76e6a...` → dataset 53618B SHA `eda08b8...` — CLOSED |
| `D06_SOURCE_PROVIDER_DESIGNATION` | **ESTABLISHED BY THIS ACT** — `d8-d06-news-source-provider-designation-2026-09-27-001` — Parse.bot NSE India API get_corporate_announcements route SELECTED for PROSPECTIVE D06 ONLY — free $0/mo 200 credits/month 5 req/min no credit card, 2 credits/call, NSE corporate announcements regulatory filings newest first with PDF URL and stable seq_id, headline desc, summary attchmntText, publishedAt an_dt+exchdisstime, sourcePublisher NSE=GOVERNED_EXCHANGE_DISCLOSURE, newsId seq_id, category subject mapping, tags symbol/industry/isin, source URL attchmntFile, entity association symbol, sentimentScore/relevanceScore NOT supplied by provider QUALIFICATION-INCOMPLETE/DERIVED, entitlement LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES, commercial/redistribution NOT ESTABLISHED |
| `D06_NEWS_PROVIDER` | **DESIGNATED BY THIS ACT** — Parse.bot NSE India API get_corporate_announcements — prospective, personal, single-user, non-commercial ONLY |
| `D06_PROSPECTIVE_ACQUISITION_QUALIFICATION` | NOT YET ESTABLISHED — requires future technical proof-of-acquisition gate with source response retention, deterministic transformation, provenance, lineage, qualification for 5 entities |
| `M-1_D06_NEWS` | NOT COMMISSIONED — remains governed offline news dataset requirement, still requires M-1 commissioning after provider designation and qualification |
| `M-3_D06_NEWS` | NOT ESTABLISHED — remains dependent on actual governed source data and traceable provenance |
| `D06_HISTORICAL_PIT` | NOT ESTABLISHED — explicitly NOT AUTHORIZED — PROSPECTIVE ONLY from designation date 2026-09-27 onward |
| `PUBLICATION_TIME_D06` | **MAY BE ESTABLISHED** — NSE corporate announcements DO supply an_dt + exchdisstime as provider-supplied publication timestamp — unlike D07 which is NOT ESTABLISHED — preserve when actually supplied, do NOT replace with acquisition time |
| `D08_MACRO_ACTIVATION` | NOT GRANTED — DEFERRED |
| `D09_ALTDATA_ACTIVATION` | NOT GRANTED — CONDITIONAL/FEASIBILITY-GATED |
| `D07_HISTORICAL_PIT` | NOT ESTABLISHED — unchanged |
| `PUBLICATION_TIME_D07` | NOT ESTABLISHED — unchanged |
| `SOURCE_AS_OF_D07` | NOT PROVIDED — unchanged |
| `ENTITLEMENT_D06` | LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES — commercial/redistribution NOT ESTABLISHED |
| `ENTITLEMENT_D07` | LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES — unchanged |
| `IMPLEMENTATION_AUTHORITY` | NOT GRANTED — governance-only — this act adds only governance file, no dataset, no adapter, no contract/engine/UI/runtime change |
| `PRODUCTION_AUTHORITY` | NOT GRANTED — productionEligible false — unchanged |
| `D115_IDENTITY_AUTHORITY` | WITHHELD / UNRESOLVED / NOT AUTHORIZED — unchanged |
| `D91/D88_MACRO_RELIEF` | NOT GRANTED — unchanged |
| `CERTIFICATION_AUTHORITY` (beyond M-3 D07) | NOT GRANTED — M-3 D07 provenance acceptance is governance, not production certification |

---

## 18. RETAINED GOVERNANCE INVARIANTS

| Invariant | State after this D06 provider act |
| --- | --- |
| Operating mode | `NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV` — unchanged |
| Sole data-authorizing acts repo-wide | `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` (D05 only) + M-2 act (Intelligence governance/data-supply authority only) + provider designation act for D07 (TIGZIG prospective D07) + M-1 commissioning act for D07 + M-1 deposition D07 at `62330df` + M-3 act for D07 at `9f608d9` + **this D06 provider act** `d8-d06-news-source-provider-designation-2026-09-27-001` (D06 News prospective acquisition authority only, no M-1 commissioning, no M-3 establishment) |
| BI-01..BI-08 · D05/P04 · D114 · `src/ui` records | FROZEN — unchanged |
| Intelligence nav status | `partial` — unchanged |
| Intelligence surface | `PARTIAL / PRESENTATIONAL ONLY / NO GOVERNED OFFLINE PAYLOAD` for D06, `GOVERNED OFFLINE D07 PROSPECTIVE PAYLOAD DEPOSITED + PROVENANCE ESTABLISHED` for D07 — D06 still no offline payload (provider designated, M-1 not commissioned, deposition not yet performed) |
| D06 contract | `src/contracts/d06_news.ts` authoritative, unchanged —  `NewsEventPayload { companyId?, newsId, headline, summary, publishedAt, category, sentimentScore, relevanceScore, sourcePublisher, tags }` |
| D07 contract | `src/contracts/d07_estimates.ts` authoritative, unchanged — `AnalystEstimatePayload { companyId, metric, targetPeriod, consensusMean, consensusMedian?, highEstimate, lowEstimate, analystCount, currency, asOfDate }` |
| D115 C/D | WITHHELD / UNRESOLVED / NOT AUTHORIZED — unchanged |
| runtimeCompanyId | UNRESOLVED — unchanged |
| D91/D88 | LIVE-only macro; no relief — unchanged; D08 deferred |
| productionEligible | false — unchanged |
| External live sockets | 0 — unchanged |
| Windows visual acceptance | NOT CLAIMED BY ARENA — unchanged |
| Existing governance acts | Byte-identical, frozen — this act adds only new file `D8-D06-NEWS-SOURCE-PROVIDER-DESIGNATION-ACT.md`, modifies none |

---

## 19. NEXT AUTHORITY GATE (not authorized by this act)

Within GATE-Y path, under M-2 authority, D8 scope, provider designations for D07 (closed) and D06 (designated by this act):

- **For D06 News (IN SCOPE, provider DESIGNATED by this act for prospective acquisition ONLY, M-1 NOT COMMISSIONED, M-3 NOT ESTABLISHED):**
  - Technical proof-of-acquisition for D06 News — separate governance-only gate — ONE real Parse.bot NSE API get_corporate_announcements request covering NSE segment (latest feed or date range), capture exact raw response byte-for-byte, exact request URL, UTC acquisition timestamp, HTTP status, byte count, SHA-256, retain outside repo during qualification, forensic validation of fields actually present: symbol, seq_id, desc (headline), attchmntText (summary), an_dt + exchdisstime (publishedAt), subject (category), sourcePublisher NSE, attchmntFile (PDF URL), sm_name/sm_isin/smIndustry/tags — validate numeric/temporal fields, validate identity provider ticker → governed resolver → EQ_* canonical, validate D06 contract mapping (seq_id→newsId, desc→headline, attchmntText/desc→summary, an_dt+exchdisstime→publishedAt, symbol→companyId via governed resolver, subject→category, sm_name/sm_isin/smIndustry→tags, attchmntFile→source URL, sentimentScore/relevanceScore QUALIFICATION-INCOMPLETE/DERIVED with explicit limitation), provenance chain, PIT safety (preserve provider-supplied publishedAt when actually supplied, do NOT replace with acquisition time, acquisition/observation time separately identified)
  - Five-entity prospective acquisition consistency for D06 News — ONE real request covering NSE segment with date range returning 500-700 equities rows per day, filter for 5 required Indian NSE securities RELIANCE, INFY, TCS, HDFCBANK, AXISBANK → EQ_RELIANCE_IN, EQ_INFY_IN, EQ_TCS_IN, EQ_HDFCBANK_IN, EQ_AXISBANK_IN — deterministic NSE symbol, explicitly supported, no provider-native stored as companyId, not inferred from name — capture exact request URL, UTC timestamp, HTTP status, raw response byte count, SHA-256, retain outside repo, payload validation every returned entity every row record actual fields only, identity validation provider ticker→governed resolver→EQ_* canonical every ticker maps exactly once no provider-native stored as governed companyId no ambiguous no inferred from name, D06 contract mapping ONLY current authoritative contract `src/contracts/d06_news.ts`, as-of/PIT handling, consistency test selected/returned/missing/valid/invalid, provenance sourceClassification to be designated, M-1 MUST REMAIN NOT COMMISSIONED, M-3 MUST REMAIN NOT ESTABLISHED, repository mutation READ-ONLY
  - M-1 commissioning for D06 News prospective observation dataset — separate RAMKI act commissioning M-1 specifically for D06 PROSPECTIVE NEWS OBSERVATION DATA — must commission only prospective dataset capability demonstrated by qualification gates, must NOT commission historical PIT, provider publication-time history beyond actually supplied, revision history, historical backfill, D07 changes, D08, D09, production, D115, D91/D88, unrestricted redistribution — define M-1 as governed prospective single-user non-commercial non-deployed D06 News observation dataset acquired from authorized Parse.bot NSE route from authorization date onward, preserve provider identity, request URL, provider ticker, governed EQ_* identity, headline, summary, publishedAt, category, sourcePublisher, tags, source URL, observation timestamp, lineage SHA-256, source classification, quality, replay constraint — distinguish OBSERVATION_TIME from PROVIDER_PUBLICATION_TIME (latter IS AVAILABLE for D06 via an_dt+exchdisstime, unlike D07), commission null-data policy, sentiment/relevance policy (provider does NOT supply sentimentScore/relevanceScore — QUALIFICATION-INCOMPLETE/DERIVED), entity identity EQ_* canonical, provenance requirements, entitlement LIMITED PERSONAL-USE-ONLY, M-3 NOT ESTABLISHED BY THIS ACT
  - Actual M-1 prospective D06 News dataset deposition and acceptance — separate gate — smallest deterministic prospective acquisition required by commissioning act, use already-qualified repository-backed entity set, use authorized Parse.bot NSE route, retain exact source response needed for provenance, record exact request URL, provider-native identifier, governed EQ_* identity, acquisition/observation timestamp UTC, calculate SHA-256 over exact retained response bytes, record byte count, do NOT call acquisition time provider publication time, do NOT invent sourceAsOf/dataVersion/revisionSeq, create smallest governed build-time dataset consistent with existing authoritative D06 contract `src/contracts/d06_news.ts`, preserve contract unchanged, map only supported fields, do NOT invent sentimentScore/relevanceScore as provider-supplied if not supplied — preserve as QUALIFICATION-INCOMPLETE/DERIVED with explicit quality, provenance/lineage, M-1 acceptance tests, M-3 boundary NOT ESTABLISHED, durability boundary

- **For D07 (CLOSED):** No further action required — provider designated, qualification PASS, M-1 commissioned, M-1 deposited (40 obs, 39 valid, 1 null, 5 entities, 6110B raw SHA `9f76e6a...`), M-3 established — D07 chain closed — do NOT propose another D07 provider search, qualification, deposition, provenance, historical PIT, publication-time reconstruction, median supplementation, runtime integration

- **For D08 Macro (DEFERRED):** No action required for initial D8 commissioning path — remains subject to D91/D88, D91/D88 relief NOT GRANTED, macro acquisition NOT AUTHORIZED

- **For D09 Alternative Data (CONDITIONAL/FEASIBILITY-GATED):** Feasibility evaluation only if valid governed source, entitlement/licensing, provenance, approvalRef can actually be established — if YES may enter initial scope via separate RAMKI feasibility determination, if NO must NOT become mandatory blocker — no provider designated merely to satisfy condition

The commissioning act for M-1 D06 News dataset, establishment of M-3 D06 provenance, resolution of D115, relief of D91/D88, and certification of M-1→M-5 remain **separate, future, explicit RAMKI determinations**. Arena must not manufacture provider, entitlement, dataset, or provenance.

---

**End of Authority Act. D06 News Source/Provider Designation ESTABLISHED — Parse.bot NSE India API get_corporate_announcements route selected for prospective D06 News acquisition ONLY — governance-only, personal/single-user/non-commercial, prospective from designation date 2026-09-27 onward, regulatory disclosure intelligence (NSE corporate announcements with PDF URL and stable seq_id), headline desc, summary attchmntText, publishedAt an_dt+exchdisstime preserved, sourcePublisher NSE=GOVERNED_EXCHANGE_DISCLOSURE, newsId seq_id, category subject mapping, tags symbol/industry/isin, source URL attchmntFile, entity association symbol→EQ_* deterministic, sentimentScore/relevanceScore NOT supplied by provider QUALIFICATION-INCOMPLETE/DERIVED, entitlement LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES, commercial/redistribution NOT ESTABLISHED, no historical backfill, no historical PIT claim, no M-1 commissioned, no M-3 established, no D07 changes, no D08/D09 activation, no D115, no D91/D88 relief, no production, no implementation/production/certification authority granted beyond prospective acquisition boundary. Next gates: technical proof-of-acquisition, five-entity consistency, M-1 commissioning, actual M-1 deposition and acceptance for D06 News.**

