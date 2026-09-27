# Institutional Investment Platform System (IIPS)
# D8 D06/D07 — Source/Provider Designation Act (Free Provider Prospective Acquisition Authority)

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `d8-d06-d07-source-provider-designation-2026-09-27-001`
**Governing Authority:** RAMKI (Provider Designating Authority / Authorizing Authority)
**Recording Agent:** Arena (recording only — no implementation performed or authorized by this act)
**Act Type:** AUTHORITY SOURCE/PROVIDER DESIGNATION + PROSPECTIVE ACQUISITION AUTHORIZATION (non-executable; NO DATASET COMMISSIONING, NO M-3 ESTABLISHMENT, NO IMPLEMENTATION, NO PRODUCTION, NO CERTIFICATION AUTHORITY)
**Recorded At (local, Asia/Calcutta):** 2026-09-27
**Antecedent Checkpoint:** `a2eee1074bcac7a636d9c96868aa5ae7f7817603`
**Parent Checkpoint:** `7db93a6e901e1a1d6ee03e67846b1327dc6e0fd9`
**Governed Branch:** `arena/01a0ddae-iips-production-market-data`
**Gate Context:** `GATE-Y (Intelligence Data-Supply)` — SELECTED/OPENED by `gate-y-intel-data-supply-designation-selection-2026-09-27-001` at `95f36cf`; M-2 ESTABLISHED by `gate-y-m2-intelligence-data-authorization-2026-09-27-001` at `7db93a6`; D8 Domain Scope ESTABLISHED by `d8-intelligence-domain-scope-determination-2026-09-27-001` at `a2eee10` — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL/FEASIBILITY-GATED

---

## 1. VERIFIED ANTECEDENT STATE (inspected before recording, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative repository | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` |
| Authoritative governed branch | `refs/heads/arena/01a0ddae-iips-production-market-data` @ `a2eee1074bcac7a636d9c96868aa5ae7f7817603` — LOCAL == REMOTE before mutation |
| Local HEAD at recording | `a2eee1074bcac7a636d9c96868aa5ae7f7817603` |
| Worktree | CLEAN (0 entries) |
| GATE-Y designation act | PRESENT — blob `aa7746096f24c367322d10a6dcd216ea30fb5815` |
| M-2 authorization act | PRESENT — blob `bd3be4024d8910f62860ec46cc267d646c0bc454` |
| D8 scope determination act | PRESENT — blob `a2b4179fb323531b675ffe029415d8b3bdd3080b` — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL/FEASIBILITY-GATED |
| D06/D07 source/provider designation act | ABSENT — `D8-D06-D07-SOURCE-PROVIDER-DESIGNATION-ACT.md` does NOT exist in HEAD or any prior commit (verified via `git ls-tree -r HEAD` and `git log --all --full-history`) |
| D07 contract | PRESENT — `src/contracts/d07_estimates.ts` — `AnalystEstimatePayload { companyId, metric, targetPeriod, consensusMean, consensusMedian, highEstimate, lowEstimate, analystCount, currency, asOfDate }` — existing repository D07 contract remains authoritative per this act |
| D07 engine | PRESENT — `src/intelligence/estimates_engine.ts` — `IndividualAnalystEstimate { estimateId, companyId, analystId (e.g. ANON_BROKER_01), metric, targetPeriod, estimatedValue, submittedAt, currency }` + `AggregatedConsensusResult` with PIT rule `submittedAt <= asOf`, N>=3, 90-day staleness |
| Existing D07 fields `publicationTime`, `effectiveTime`, `revisionSeq`, `canonicalEntityId`, `metricCode`, `forecastPeriod`, `forecastFiscalYear`, `targetPeriodEndDate` | NOT PRESENT in repository — verified via `grep -R "publicationTime|effectiveTime|revisionSeq|canonicalEntityId|metricCode|forecastPeriod"` → ZERO results |
| TIGZIG / Yahoo Finance authorization | NOT ESTABLISHED — zero governance records, zero source files mention TIGZIG/Yahoo Finance as authorized D07 provider |
| Business Quant authorization | NOT ESTABLISHED — zero governance records mention Business Quant as authorized D07 provider |
| Generic free/personal D07 acquisition route | NOT ESTABLISHED — `EXTERNAL_ACQUISITION_AUTHORITY = NOT GRANTED`, `PROVIDER_ENTITLEMENT = NOT GRANTED` |
| Prospective-PIT governance policy | NOT ESTABLISHED — `prospective` search across `evidence/` returns ZERO for Intelligence D07; D114 PIT policy is for D01/D02 quotes only |
| Policy equating acquisition timestamp with publicationTime | NOT ESTABLISHED — zero governance records |
| D07 provider entitlement/licensing authority | NOT ESTABLISHED |
| M-1 | NOT COMMISSIONED / NOT PRESENT — 0/0 commissioned/accepted |
| M-3 | NOT ESTABLISHED |

---

## 2. FREE-PROVIDER RESEARCH FINDINGS (research evidence only, NOT designation)

Per preceding forensic gate, authoritative web evidence reviewed:

**Candidate 1 — TIGZIG Yahoo Finance API / Yahoo Finance data:**
- Open, no-auth HTTP API and MCP server exposing Yahoo Finance data via yfinance — historical prices, financial statements, analyst price targets, recommendations, earnings/revenue estimates, earnings calendar, major holders
- Built and run by one person; REST base `https://yfin-h.tigzig.com/v1`, MCP `https://yfin-h.tigzig.com/mcp`; OpenAPI spec `https://yfin-h.tigzig.com/openapi.json`
- Endpoints: `/v1/get-estimates/` — Get Estimates Endpoint; up to 25 tickers per call; any Yahoo ticker
- Fields include period, average, low, high, analyst count, growth and year-ago comparison
- Supports Yahoo tickers and global/Indian market data (e.g., INFY.NS, Indian tickers)
- Built on FastAPI, fastapi-mcp, yfinance, pandas; open-source edition; deployed on Coolify (Hetzner) behind Cloudflare
- **Does NOT establish historical publication-time/PIT archive or provider revision sequence**

**Candidate 2 — Business Quant Analyst Estimates API:**
- Analyst Estimates API explicitly free; Fundamental Data API free to use; sign up for API key, no credit card required
- Supports consensus revenue/EPS, high/low and reported actuals
- Infosys (`INFY`) explicitly represented
- Free tier: 30 API calls/day, 0.1GB data transfer/month, segment/KPI data limited to one quarter, analyst estimates included
- Free tier limits: core tools available, KPI and segment depth limited, API allowance small
- Paid tiers: Pro $25/mo (200 calls/day), Max $59/mo (50k calls/day, 50GB), Enterprise custom (commercial licensing, unlimited calls)
- **Documented response does NOT establish D07 historical publicationTime, arbitrary historical PIT reconstruction, or governed revisionSeq**

These findings are RESEARCH EVIDENCE ONLY. They are NOT provider designation or acquisition authorization prior to this act.

---

## 3. PROVIDER SELECTION RECORDED (authority statement, verbatim, RAMKI)

> I, RAMKI, as Provider Designating Authority and Authorizing Authority, select ONE free provider route for prospective D07 acquisition under the already-authorized GATE-Y → M-2 → D8 Intelligence governance scope.
>
> I select: **TIGZIG Yahoo Finance API / Yahoo Finance data — Estimates route (`/v1/get-estimates/` and related Yahoo Finance estimates endpoints via yfinance) — for prospective D07 acquisition.**
>
> I do NOT select Business Quant Analyst Estimates route in this act. Business Quant remains a research candidate only, NOT authorized by this act. Do not authorize both.
>
> This selection is made strictly as a **free, personal, single-user, non-commercial acquisition route** for this single-user IIPS application (LOCAL / PERSONAL / SINGLE-USER / DEVELOPMENT-QUALIFICATION / NON-DEPLOYED tier per GP-5). The route is authorized ONLY for prospective acquisition from the authorization date onward for the purpose of establishing a future governed offline dataset with proper provenance and lineage, subject to all limitations recorded in this act.
>
> The existing repository D07 contract `src/contracts/d07_estimates.ts` with `companyId`, `metric`, `targetPeriod`, `consensusMean`, `consensusMedian`, `highEstimate`, `lowEstimate`, `analystCount`, `currency`, `asOfDate` and engine rule `submittedAt <= asOf` remains authoritative. This act does NOT modify the D07 contract. If a future D07 contract extension is required for richer PIT semantics (`publicationTime`, `effectiveTime`, `revisionSeq`, `canonicalEntityId`, `metricCode`, `forecastPeriod`, `forecastFiscalYear`, `targetPeriodEndDate`), that requires a separate governed gate.
>
> This act does NOT claim that TIGZIG/Yahoo Finance supplies historical D07 PIT. Authoritative web evidence and repository forensic establish that the provider does NOT establish a historical publication-time/PIT archive or provider revision sequence. Historical PIT reconstruction is NOT authorized.
>
> This act authorizes prospective acquisition from the authorization date onward, retention of acquired source responses for this single-user IIPS application, deterministic transformation into an internal governed dataset, provenance and lineage recording, and observation/as-of handling consistent with the CURRENT repository D07 contract (`asOfDate`, `submittedAt <= asOf`). It does NOT authorize fabrication of publicationTime, treating acquisitionTime as publicationTime without authoritative basis, claiming historical PIT reconstruction, treating repeated observations as provider revision history, inventing provider revisionSeq, retroactive D07 historical backfill, M-1 commissioning, M-3 establishment, production activation, D115 authority, D91/D88 relief, D08 or D09 activation.

**Selected by:** RAMKI. **Selection:** EXPLICIT — TIGZIG/Yahoo Finance estimates route ONLY. Business Quant NOT selected.

---

## 4. DISTINCTION — AVAILABILITY vs AUTHORIZATION vs ENTITLEMENT vs CAPABILITY

| Dimension | Status for selected provider (TIGZIG/Yahoo Finance) |
| --- | --- |
| **Provider availability** | **AVAILABLE as free/open/no-auth HTTP API** — REST base `https://yfin-h.tigzig.com/v1`, MCP server, OpenAPI spec, built on yfinance, up to 25 tickers per call, any Yahoo ticker, supports global/Indian market data, estimates endpoint `/v1/get-estimates/` returns forward earnings/revenue estimates with period, average, low, high, analyst count, growth, year-ago comparison — per tigzig.com documentation |
| **Provider authorization** | **AUTHORIZED BY THIS ACT** — `d8-d06-d07-source-provider-designation-2026-09-27-001` — governance-only, prospective, single-user, non-commercial, D07 estimates route ONLY; TIGZIG/Yahoo Finance is NOT currently authorized before this act, now AUTHORIZED BY THIS ACT for prospective acquisition only |
| **Entitlement/licensing basis** | **LIMITED / PERSONAL-USE-ONLY / NOT UNRESTRICTED** — see §5 for exact evidence and limitations; free API ≠ unrestricted license; no API key ≠ unrestricted retention; personal use ≠ permission to redistribute; public webpage ≠ unrestricted bulk extraction |
| **Technical acquisition capability** | **ESTABLISHED for prospective forward estimates** — endpoint returns forward earnings/revenue estimates, average/low/high/analyst count/growth; supports Yahoo tickers including Indian tickers (e.g., INFY.NS); no auth, open; technical capability for current consensus exists; historical PIT archive capability NOT ESTABLISHED |
| **Historical PIT capability** | **NOT ESTABLISHED** — authoritative web evidence reviewed: does NOT establish historical publication-time/PIT archive or provider revision sequence; repository forensic confirms no historical PIT for D07; this act explicitly does NOT claim historical PIT |
| **Prospective snapshot capability** | **AUTHORIZED BY THIS ACT for prospective acquisition from authorization date onward** — retention of source responses, deterministic transformation, provenance/lineage recording, observation/as-of handling per current D07 contract; does NOT authorize retroactive backfill, does NOT treat acquisitionTime as publicationTime without basis, does NOT treat repeated observations as provider revision history |

**Business Quant candidate distinction (NOT selected):**

- Availability: free API, 30 calls/day, 0.1GB/month, INFY represented, SEC-sourced US fundamentals — available as free tier
- Authorization: NOT AUTHORIZED by this act — remains research candidate only
- Entitlement: Free tier available, but Enterprise includes commercial licensing → free tier is non-commercial, small quota, no redistribution
- Technical capability: forward estimates, consensus revenue/EPS, high/low, reported actuals — current consensus capability exists
- Historical PIT: NOT ESTABLISHED per research finding — does NOT establish historical publicationTime, arbitrary historical PIT reconstruction, or governed revisionSeq
- Prospective snapshot: NOT AUTHORIZED by this act (since provider NOT selected)

---

## 5. ENTITLEMENT / LICENSING EVIDENCE AND LIMITATIONS

**Actual evidence reviewed (web search, authoritative sources):**

**Yahoo Finance API / yfinance / TIGZIG:**

- yfinance GitHub: *You should refer to Yahoo!'s terms of use (here, here, and here) for details on your rights to use the actual data downloaded. Remember - the Yahoo! finance API is intended for personal use only.* [1](https://github.com/ranaroussi/yfinance)
- yfinance PyPI: *yfinance offers a Pythonic way to fetch financial & market data from Yahoo! finance. yfinance is not affiliated, endorsed, or vetted by Yahoo, Inc. It's an open-source tool that uses Yahoo's publicly available APIs, and is intended for research and educational purposes. Remember - the Yahoo! finance API is intended for personal use only.* [2](https://pypi.org/project/yfinance/)
- Yahoo Developer API Terms of Use: *Licensed Uses and Restrictions — Yahoo APIs are licensed on worldwide, non-exclusive, non-sublicenseable, revocable basis; All rights not expressly granted are reserved; YOU SHALL NOT: Sell, lease, share, transfer, or sublicense the Yahoo APIs or access codes or derive income from use or provision of Yahoo APIs, whether for direct commercial or monetary gain or otherwise, unless API Documents specifically permit otherwise or Yahoo gives prior express written permission* [3](https://legal.yahoo.com/us/en/yahoo/terms/product-atos/apiforydn/index.html)
- Yahoo Terms of Service: *Unless you have explicit written permission, you must not reproduce, modify, rent, lease, sell, trade, distribute, transmit, broadcast, publicly perform, create derivative works based on, or exploit for any commercial purposes, any portion or use of, or access to, the Services (including content, advertisements, APIs, and software).* [4](https://guce.yahoo.com/terms?locale=en-US)
- Tiingo blog: *There's no official Yahoo Finance API — it was discontinued in 2017. Official vs unofficial: Official/supported = No – discontinued in 2017; Licensing/compliance = Gray area; redistribution restricted; Stability = Undocumented; breaks without notice; Support/SLA = None; Cost = Free, with hidden costs.* [5](https://www.tiingo.com/blog/yahoo-finance-api/)
- TIGZIG documentation: *Open, no-auth HTTP API and MCP server exposing Yahoo Finance data via yfinance — No key, no signup; Built and run by one person; FastAPI backend + fastapi-mcp, Pydantic validation, deployed on Coolify (Hetzner) behind Cloudflare; Open-source edition built on FastAPI, yfinance, pandas; Most endpoints return JSON; statements come in two families.* — per tigzig.com/apis/yahoo-finance [6](https://www.tigzig.com/apis/yahoo-finance) — No explicit licensing terms for retention/transformation documented on TIGZIG site; relies on underlying yfinance/Yahoo terms
- Bitget wiki: *Unofficial wrappers are not endorsed by Yahoo. They re-use front-end endpoints and may operate in a grey area with respect to intended use. Personal, non-commercial research is typically lower risk; commercial redistribution or productization of scraped data requires careful legal review and may violate terms.* [7](https://www.bitget.com/wiki/yahoo-stock-api)

**Business Quant (NOT selected, for comparison):**

- Business Quant docs: *Fundamental Data API is free to use. Sign up to receive an API key and start pulling fundamentals... no credit card required.* [8](https://businessquant.com/docs/api/overview)
- Pricing: *Free $0 — 30 API calls/day, 0.1GB Data transfer/month, Segment Financials & KPI Data limited to one quarter, Analyst Estimates included; Pro $25/mo 200 calls/day; Max $59/mo 50k calls/day 50GB; Enterprise Contact Us — includes commercial licensing, unlimited API calls* [9](https://businessquant.com/pricing/) — implies free tier is non-commercial, limited quota, commercial rights require Enterprise
- FindMyMoat: *Free tier available, but free API and MCP quotas are small, commercial use needs separate licensing* — free = personal/evaluation, commercial requires paid plan

**Entitlement basis determination for selected provider (TIGZIG/Yahoo Finance):**

- **ENTITLEMENT BASIS = LIMITED PERSONAL-USE-ONLY / RESEARCH & EDUCATIONAL PURPOSES / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES**
- **Actual permission for local retention/transformation for single-user IIPS application:** yfinance states intended for research and educational purposes, personal use only — this suggests personal, single-user, non-commercial retention/transformation for research may be within intended use, but **does NOT establish unrestricted license, commercial use, redistribution, or bulk extraction permission**
- **Unresolved licensing limitations recorded explicitly:**
  - No explicit permission for arbitrary retention/transformation documented in Yahoo API Documents beyond personal use
  - No explicit permission for redistribution, sublicensing, or deriving income — explicitly prohibited unless Yahoo gives prior express written permission
  - Unofficial routes (yfinance, TIGZIG) re-use front-end endpoints, may operate in grey area, discontinued official API in 2017, undocumented, breaks without notice, no support/SLA
  - TIGZIG itself is built and run by one person, no explicit licensing terms for data retention — relies on underlying Yahoo terms
  - Free API ≠ unrestricted license
  - No API key ≠ unrestricted retention
  - Personal use ≠ permission to redistribute
  - Public webpage ≠ unrestricted bulk extraction
- **If evidence insufficient for local retention/transformation, record NOT ESTABLISHED rather than inventing:** For unrestricted commercial retention/transformation/redistribution, **ENTITLEMENT BASIS = NOT ESTABLISHED**; for limited personal, single-user, non-commercial, research/educational retention/transformation for this single-user IIPS application, entitlement is **LIMITED PERSONAL-USE-ONLY** per Yahoo/yfinance terms, but remains revocable, non-sublicenseable, no redistribution, gray area for unofficial routes — this act records that limitation explicitly and does NOT grant commercial or redistribution authority

**Business Quant entitlement (NOT selected):** Free tier free to use, but commercial licensing requires Enterprise, free quota small (30 calls/day, 0.1GB), personal/evaluation use — similar personal-use-only limitation

---

## 6. ACQUISITION ROUTE

**Selected route:** TIGZIG Yahoo Finance API / Yahoo Finance data — Estimates route

- **Base URL:** `https://yfin-h.tigzig.com/v1`
- **Endpoint:** `GET /v1/get-estimates/` — Get Estimates Endpoint (and related detailed info, recommendations, price targets endpoints as needed for estimates context)
- **MCP Server:** `https://yfin-h.tigzig.com/mcp` — Streamable HTTP for AI agents (Claude.ai, ChatGPT, Cursor, n8n)
- **OpenAPI spec:** `https://yfin-h.tigzig.com/openapi.json` — machine contract
- **Docs:** `https://yfin-h.tigzig.com/redoc` — full reference, every endpoint, field, enforced limit
- **Auth:** No auth, fully open, no key, no signup — per TIGZIG docs
- **Ticker support:** Any Yahoo ticker, up to 25 tickers per call, supports Yahoo tickers and global/Indian market data (e.g., INFY, INFY.NS, Indian tickers) — per research finding
- **Backend:** FastAPI + fastapi-mcp + yfinance + pandas, deployed on Coolify (Hetzner) behind Cloudflare, built and run by one person
- **Rate limits:** Enforced limits with message when crossed (per TIGZIG docs), but exact limits not specified for estimates endpoint — must respect enforced limits
- **Data returned:** Forward earnings/revenue estimates with fields period, average, low, high, analyst count, growth, year-ago comparison — per research finding
- **Compatibility with governed offline/build-time model:** Prospective acquisition from authorization date onward can be retained as source responses and deterministically transformed into internal governed dataset as build-time TypeScript import (D05 pattern), consistent with Path L offline model, zero live provider execution at runtime, zero `fetch`/`authFetch`/`API`/`OIDC` at runtime — future acquisition step must implement offline bootstrap, not live runtime fetch

**Acquisition route NOT authorized:**

- Historical backfill, retroactive D07 historical reconstruction
- Live runtime fetching in production
- Bulk extraction beyond enforced limits
- Redistribution, sublicensing, deriving income

---

## 7. PERMITTED RETENTION / TRANSFORMATION BOUNDARY

**Permitted by this act (prospective, governance-only):**

- Prospective acquisition from authorization date onward (date of this act: 2026-09-27) — retention of acquired source responses for this single-user IIPS application (LOCAL / PERSONAL / SINGLE-USER / DEVELOPMENT-QUALIFICATION / NON-DEPLOYED tier per GP-5)
- Deterministic transformation into internal governed dataset as build-time TypeScript import (D05 precedent: browser runtime uses build-time imported canonical dataset with zero dynamic Node fs/path dependencies)
- Provenance and lineage recording per `ExecutiveProvenance` requirements
- Observation/as-of handling consistent with CURRENT repository D07 contract: `asOfDate` / `asOf` and engine rule `submittedAt <= asOf` with existing staleness and analyst-count rules
- Single-user, non-commercial, research and educational purposes only — per Yahoo/yfinance personal-use-only terms

**NOT permitted:**

- Fabrication of `publicationTime` — this act does NOT authorize fabrication of publicationTime
- Treating acquisitionTime as publicationTime without authoritative basis — NOT AUTHORIZED; no policy equates acquisition timestamp with publicationTime; repository does NOT define publicationTime
- Claiming historical PIT reconstruction — NOT AUTHORIZED; provider does NOT establish historical PIT archive
- Treating repeated observations as provider revision history — NOT AUTHORIZED; repeated observations ≠ source revision history
- Inventing provider revisionSeq — NOT AUTHORIZED; locally generated revisionSeq ≠ provider revisionSeq unless governed as such; repository does NOT define revisionSeq for D07
- Retroactive D07 historical backfill — NOT AUTHORIZED
- M-1 commissioning — NOT AUTHORIZED; M-1 remains NOT COMMISSIONED
- M-3 establishment — NOT AUTHORIZED; M-3 remains NOT ESTABLISHED
- Production activation, D115 authority, D91/D88 relief, D08/D09 activation — NOT AUTHORIZED

---

## 8. PROSPECTIVE SNAPSHOT POLICY

**Authorized by this act:**

- **Prospective acquisition:** From authorization date onward (2026-09-27), acquire forward earnings/revenue estimates via selected TIGZIG/Yahoo Finance estimates route
- **Retention:** Retain acquired source responses for this single-user IIPS application for purpose of establishing future governed offline dataset
- **Deterministic transformation:** Transform retained source responses into internal governed dataset as build-time import, with deterministic mapping to existing D07 contract fields (`companyId`, `metric`, `targetPeriod`, `consensusMean`, `consensusMedian`, `highEstimate`, `lowEstimate`, `analystCount`, `currency`, `asOfDate`)
- **Provenance and lineage:** Record `sourceClassification`, `asOf`, `evaluatedAt`, `dataVersion`, `lineageDigest` (SHA-256 computed over actual governed source), `quality`, `replayConstraintApplied` per `ExecutiveProvenance` contract `src/transports/types.ts`
- **Observation/as-of handling:** Consistent with CURRENT repository D07 contract — `asOfDate` as observation date, engine rule `submittedAt <= asOf` (where `submittedAt` is acquisition timestamp as observation time, NOT publicationTime, unless separate governance establishes equivalence)
- **Prospective-PIT:** Observation snapshots from authorization date onward become D07 PIT records prospectively, with `asOf` = observation date, NOT retroactive historical PIT

**Explicit PIT limitations (required):**

- **PUBLICATION_TIME = NOT ESTABLISHED** — repository does NOT define `publicationTime` for D07; provider does NOT supply authoritative `publicationTime`; this act does NOT fabricate publicationTime; acquisitionTime is NOT publicationTime
- **HISTORICAL_PIT = NOT ESTABLISHED** — provider does NOT establish historical publication-time/PIT archive or provider revision sequence; no historical PIT reconstruction authorized
- **PROSPECTIVE_PIT = ESTABLISHED BY THIS ACT** — prospective acquisition from authorization date onward may become PIT records with `asOf` = observation date, per current contract `submittedAt <= asOf` rule; does NOT claim historical PIT
- **EFFECTIVE_TIME = NOT ESTABLISHED** — repository does NOT define `effectiveTime` for D07
- **REVISION_SEQ = NOT ESTABLISHED** — repository does NOT define `revisionSeq` for D07; provider does NOT supply revisionSeq; repeated observations do NOT constitute provider revision history; locally generated revisionSeq ≠ provider revisionSeq unless governed as separate act
- **Retroactive backfill = NOT AUTHORIZED**
- **Acquisition timestamp as publicationTime = NOT AUTHORIZED without authoritative basis** — no policy equates acquisition timestamp with publicationTime; this act does NOT establish that equivalence

---

## 9. PROVENANCE REQUIREMENTS

For any future M-3 establishment using prospective acquisition under this act, following are required per M-2 act and `ExecutiveProvenance` contract:

- `sourceClassification: SourceClassification` — e.g., `OFFLINE_BOOTSTRAP` or `REAL` or `DERIVED` or `CERTIFIED_ENGINE` — to be determined based on actual governed source
- `asOf: string` ISO-8601 UTC — observation date / PIT reference
- `evaluatedAt: string` ISO-8601 UTC — evaluation timestamp
- `dataVersion: string` — governed version string
- `lineageDigest: string` — Cryptographic SHA-256 hash computed over actual governed source (not invented)
- `quality: QualityState` — `GOOD` | `STALE` | `PARTIAL` | `UNAVAILABLE`
- `replayConstraintApplied: boolean` — AD-17 constraint if applicable
- `replayConstraintText?: string` — `AD17_CONSTRAINT: ...` when applicable
- Source identity, acquisition/provenance information, timestamps/versioning as applicable

This act does NOT itself establish provenance values; it only authorizes prospective acquisition boundary for future provenance recording.

---

## 10. IDENTITY REQUIREMENT FOR D07 ENTITIES

- **Governed D05 identity binding:** Intelligence records must use governed D05/P04 identity binding (`EQ_INFY_IN` form, never `INFY`) per M-4 definition — `EQ_INFY_IN`, not `INFY` — verified in `src/identity/` only as exchange symbol, never as companyId
- **D07 companyId:** Must be `EQ_INFY_IN` form (e.g., `EQ_INFY_IN` for Infosys), not `INFY` or `INFY.NS` provider-native symbol — per NE-2 boundary: Entity linking to D05 canonical identity — never provider-native symbols
- **Provider-native symbols:** Yahoo tickers like `INFY`, `INFY.NS` must be mapped to governed `companyId` `EQ_INFY_IN` via `ObjectResolverService` or equivalent governed resolver, not used directly as `companyId`
- **This act does NOT assign companyId or runtime identity** — no `EQ_INFY_IN` assigned by this act, no `runtimeCompanyId` assigned

---

## 11. M-1 / M-3 PRESERVATION

| Ref | Status after this act |
| --- | --- |
| **M-1** | **NOT COMMISSIONED / NOT PRESENT** — remains governed offline intelligence dataset requirement for D06/D07 initial scope (and D09 if feasibility-gated inclusion occurs); still requires actual governed data deposition and acceptance; prospective acquisition authorized by this act does NOT commission M-1; M-1 commissioning requires separate future RAMKI determination |
| **M-2** | **ESTABLISHED** by `gate-y-m2-intelligence-data-authorization-2026-09-27-001` — governance/data-supply authority only — unchanged |
| **M-3** | **NOT ESTABLISHED** — remains dependent on actual governed source data and traceable provenance; requires source identity, acquisition/provenance info, timestamps/versioning, SHA-256 lineage digest; NOT established by this act; provenance recording authorized for future, not established now |
| **M-4** | **NOT ESTABLISHED — dependency-blocked** — D115 WITHHELD / UNRESOLVED / NOT AUTHORIZED; `runtimeCompanyId` UNRESOLVED; unchanged |
| **M-5** | **CONDITIONAL — relief NOT REQUESTED / NOT GRANTED** — D08 Macro deferred, subject to D91/D88; unchanged |
| **D8 scope** | **UNCHANGED** — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL/FEASIBILITY-GATED — this act does NOT reopen or alter D8 scope |

Commissioned M-items after this act: **0 of 5**. Accepted/certified M-items: **0 of 5**.

---

## 12. EXPLICIT EXCLUSIONS — WHAT THIS ACT DOES NOT AUTHORIZE OR GRANT

This act explicitly does NOT grant or authorize:

- **D06 News provider designation** — this act designates D07 Estimates provider ONLY (TIGZIG/Yahoo Finance estimates route); D06 News provider remains NOT DESIGNATED, requires separate designation
- **Business Quant provider** — NOT AUTHORIZED by this act; remains research candidate only
- **D08 Macro** — DEFERRED, subject to D91/D88; macro data acquisition NOT AUTHORIZED; D91/D88 relief NOT GRANTED
- **D09 Alternative Data** — CONDITIONAL/FEASIBILITY-GATED; no provider designated; requires actual governed source/entitlement/provenance and approvalRef
- **External acquisition entitlement for commercial/redistribution** — NOT GRANTED; free API ≠ unrestricted license; personal use ≠ permission to redistribute; public webpage ≠ unrestricted bulk extraction; entitlement basis = LIMITED PERSONAL-USE-ONLY / RESEARCH & EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES; for unrestricted commercial retention/transformation/redistribution, ENTITLEMENT BASIS = NOT ESTABLISHED
- **Fabrication of publicationTime** — NOT AUTHORIZED
- **Treating acquisitionTime as publicationTime without authoritative basis** — NOT AUTHORIZED; no policy equates acquisition timestamp with publicationTime
- **Claiming historical PIT reconstruction** — NOT AUTHORIZED; provider does NOT establish historical PIT archive
- **Treating repeated observations as provider revision history** — NOT AUTHORIZED
- **Inventing provider revisionSeq** — NOT AUTHORIZED; locally generated revisionSeq ≠ provider revisionSeq unless governed as separate act
- **Retroactive D07 historical backfill** — NOT AUTHORIZED
- **M-1 commissioning** — NOT AUTHORIZED; M-1 remains NOT COMMISSIONED
- **M-3 provenance establishment** — NOT AUTHORIZED; M-3 remains NOT ESTABLISHED
- **Implementation** — modification of `src/contracts/d07_estimates.ts`, `src/intelligence/estimates_engine.ts`, provider adapters, datasets, fixtures, UI, runtime code — NOT AUTHORIZED; this gate is governance-only
- **Production activation** — production activation, LIVE market-data operation, `productionEligible` remains false, external live sockets 0 — NOT AUTHORIZED
- **D115 authority** — `D115_IDENTITY_AUTHORITY = WITHHELD / UNRESOLVED / NOT AUTHORIZED`; `runtimeCompanyId` UNRESOLVED — NOT GRANTED
- **D91/D88 relief** — `D91/D88_MACRO_RELIEF = NOT GRANTED` — NOT GRANTED
- **D08/D09 activation** — NOT AUTHORIZED
- **Credentials embedded in repository** — no API key, token, secret embedded; TIGZIG route is no-auth, open

---

## 13. LICENSING / PERSONAL-USE BOUNDARY — EXPLICIT RECORD

Per task requirement, do NOT infer:

- **free API = unrestricted license** — FALSE; free API does NOT imply unrestricted license; Yahoo terms reserve all rights not expressly granted, prohibit selling, leasing, sharing, transferring, sublicensing, deriving income
- **no API key = unrestricted retention** — FALSE; no API key does NOT imply unrestricted retention; TIGZIG is open, no-auth, but underlying Yahoo data rights refer to Yahoo Terms of Use, personal use only
- **personal use = permission to redistribute** — FALSE; personal use does NOT imply permission to redistribute; Yahoo Terms: *Unless you have explicit written permission, you must not reproduce, modify, rent, lease, sell, trade, distribute, transmit, broadcast, publicly perform, create derivative works based on, or exploit for any commercial purposes*
- **public webpage = unrestricted bulk extraction** — FALSE; public webpage does NOT imply unrestricted bulk extraction; TIGZIG has enforced limits, Yahoo has rate limits, bulk extraction may violate terms

**Actual evidence and unresolved licensing limitations recorded:**

- yfinance is Apache-2.0 licensed tool, but data rights refer to Yahoo Terms of Use — tool license ≠ data license
- Yahoo Finance API intended for personal use only, research and educational purposes — per yfinance GitHub and PyPI
- Yahoo Developer API Terms: non-exclusive, non-sublicenseable, revocable, all rights reserved, no deriving income without express written permission
- Yahoo Terms of Service: personal, royalty-free, non-transferable, non-assignable, revocable, non-exclusive license for sole purpose of enabling use and enjoyment of Services; no reproduction, modification, distribution for commercial purposes without permission
- Unofficial routes (yfinance, TIGZIG) re-use front-end endpoints, may operate in grey area, discontinued official API in 2017, undocumented, breaks without notice, no support/SLA — per Tiingo and Bitget
- TIGZIG itself is built and run by one person, no explicit licensing terms for data retention documented — relies on underlying Yahoo terms
- For unrestricted commercial retention/transformation/redistribution, **ENTITLEMENT BASIS = NOT ESTABLISHED**
- For limited personal, single-user, non-commercial, research/educational retention/transformation for this single-user IIPS application (LOCAL / PERSONAL / SINGLE-USER / DEVELOPMENT-QUALIFICATION / NON-DEPLOYED tier), entitlement is **LIMITED PERSONAL-USE-ONLY** per Yahoo/yfinance terms, but remains revocable, non-sublicenseable, no redistribution, gray area for unofficial routes — this act records that limitation explicitly and does NOT grant commercial or redistribution authority

---

## 14. NEXT GATE REQUIRED FOR TECHNICAL PROOF-OF-ACQUISITION

Within GATE-Y → M-2 → D8 scope and under this D06/D07 source/provider designation act, next gate is **technical proof-of-acquisition (governance-qualified):**

- Prospective acquisition implementation (NOT in this governance-only gate) — acquire forward earnings/revenue estimates via selected TIGZIG/Yahoo Finance estimates route from authorization date onward, respecting enforced limits, single-user, non-commercial
- Retention of source responses with acquisition timestamp, source identity, raw response preservation
- Deterministic transformation into internal governed dataset as build-time TypeScript import (D05 pattern), mapping provider-native tickers (e.g., `INFY`, `INFY.NS`) to governed `companyId` (`EQ_INFY_IN` form, never `INFY`) via governed resolver, preserving existing D07 contract fields (`companyId`, `metric`, `targetPeriod`, `consensusMean`, `consensusMedian`, `highEstimate`, `lowEstimate`, `analystCount`, `currency`, `asOfDate`)
- Provenance and lineage recording: `sourceClassification`, `asOf`, `evaluatedAt`, `dataVersion`, `lineageDigest` SHA-256 over actual governed source, `quality`, `replayConstraintApplied`
- Observation/as-of handling per current contract: `asOfDate` = observation date, engine rule `submittedAt <= asOf`
- Qualification: verify that prospective acquisition produces valid `AnalystEstimatePayload` per validator, that `EstimatesEngine.computeConsensus` works with `submittedAt <= asOf`, that no `publicationTime` fabricated, no historical PIT claimed, no revisionSeq invented, no retroactive backfill
- Governance record for proof-of-acquisition with evidence of source responses, transformation, provenance, lineage

The commissioning act for M-1 dataset (D06/D07 initial scope), establishment of M-3 provenance, and certification remain separate, future, explicit RAMKI determinations. Arena must not manufacture provider, entitlement, dataset, or provenance beyond what this act authorizes.

---

## 15. RETAINED GOVERNANCE INVARIANTS

| Invariant | State after this act |
| --- | --- |
| Operating mode | `NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV` — unchanged |
| Sole data-authorizing acts | `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` (D05 only) + M-2 act (Intelligence governance/data-supply authority only) + this D06/D07 source/provider designation act (prospective acquisition authority only for D07 estimates via TIGZIG/Yahoo Finance) — D05 not extended |
| BI-01..BI-08 · D05/P04 · D114 · `src/ui` records | FROZEN — unchanged |
| Intelligence nav status | `partial` — unchanged |
| Intelligence surface | `PARTIAL / PRESENTATIONAL ONLY / NO GOVERNED OFFLINE PAYLOAD` — unchanged (prospective acquisition authorized, but no dataset yet) |
| D06 News provider | NOT DESIGNATED — still requires separate designation (this act designates D07 only) |
| D07 Estimates provider | **DESIGNATED BY THIS ACT** — TIGZIG Yahoo Finance API / Yahoo Finance data — Estimates route — prospective, personal, single-user, non-commercial ONLY |
| D08 Macro | DEFERRED — subject to D91/D88 — unchanged; no acquisition authorized |
| D09 Alt-data | CONDITIONAL/FEASIBILITY-GATED — unchanged |
| D115 C / D | WITHHELD / UNRESOLVED / NOT AUTHORIZED — unchanged; this act does NOT grant D115 |
| `runtimeCompanyId` | UNRESOLVED — unchanged |
| D91/D88 | LIVE-only macro; no relief — unchanged; this act does NOT grant relief |
| `productionEligible` | false — unchanged; this act does NOT authorize production access |
| External live sockets | 0 — unchanged (prospective acquisition is offline bootstrap, not live runtime) |
| Windows visual acceptance | NOT CLAIMED BY ARENA — unchanged |

---

**End of Authority Act. D06/D07 Source/Provider Designation ESTABLISHED — TIGZIG/Yahoo Finance estimates route selected for prospective D07 acquisition ONLY — governance-only, personal/single-user/non-commercial, prospective from authorization date onward, no historical PIT, no publicationTime fabrication, no revisionSeq invention, no retroactive backfill, no M-1 commissioned, no M-3 established, no D115 granted, no D91/D88 relief granted, no D08/D09 activation, no implementation/production/certification authority granted beyond prospective acquisition boundary.**

**Existing repository D07 contract `src/contracts/d07_estimates.ts` remains authoritative. If future D07 contract extension required for richer PIT semantics (`publicationTime`, `effectiveTime`, `revisionSeq`, etc.), that requires separate governed gate.**
