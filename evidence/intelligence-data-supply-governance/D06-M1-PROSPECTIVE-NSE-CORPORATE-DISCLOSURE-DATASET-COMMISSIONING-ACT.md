# Institutional Investment Platform System (IIPS)
# D06 M-1 — Prospective NSE Corporate-Disclosure Observation Dataset Commissioning Act (Governance-Only)

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `d06-m1-prospective-nse-corporate-disclosure-commissioning-2026-09-27-001`
**Governing Authority:** RAMKI (M-1 Commissioning Authority / Authorizing Authority)
**Recording Agent:** Arena (recording only — no implementation, no data acquisition, no deposition performed or authorized by this act beyond governance commissioning record)
**Act Type:** AUTHORITY M-1 DATASET COMMISSIONING (governance-only; NO M-1 DEPOSITION, NO M-3 ESTABLISHMENT, NO IMPLEMENTATION, NO PRODUCTION, NO CERTIFICATION BEYOND M-1 COMMISSIONING)
**Recorded At (local, Asia/Calcutta):** 2026-09-27
**Antecedent Checkpoint:** `8076b58ffd2e1a44c0242175e6d44080b402ab49`
**Parent Checkpoint:** `9f608d94195fb14c6aa11dd7b7158043d491be5d`
**Governed Branch:** `arena/01a0ddae-iips-production-market-data`
**Gate Context:** `GATE-Y (Intelligence Data-Supply)` — SELECTED/OPENED by `gate-y-intel-data-supply-designation-selection-2026-09-27-001` at `95f36cf`; M-2 ESTABLISHED by `gate-y-m2-intelligence-data-authorization-2026-09-27-001` at `7db93a6`; D8 Domain Scope ESTABLISHED by `d8-intelligence-domain-scope-determination-2026-09-27-001` at `a2eee10` — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL/FEASIBILITY-GATED; Provider Designation for D07 ESTABLISHED by `d8-d06-d07-source-provider-designation-2026-09-27-001` at `e14b3b4` — TIGZIG Yahoo Finance estimates route SELECTED for PROSPECTIVE D07 ONLY; D07 M-1 COMMISSIONED at `b0faa13` — `d07-m1-prospective-estimates-observation-commissioning-2026-09-27-001`; M-1 DEPLOYED/DEPOSITED at `62330df` — 40 obs, 39 valid, 1 null, 5 entities, 6110B raw SHA-256 `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254`, observation `2026-09-27T18:18:58Z`; M-3 ESTABLISHED at `9f608d9` — `d07-m3-prospective-estimates-provenance-acceptance-2026-09-27-001`; D07 = CLOSED; D06 provider DESIGNATED by `d8-d06-news-source-provider-designation-2026-09-27-001` at `8076b58` — Parse.bot NSE India API `get_corporate_announcements` SELECTED for PROSPECTIVE D06 ONLY — 129700B SHA-256 `4fda6bfd306fe1dde11b543f14e2d74ff0764f48d49911097898d27953dff0c2`

---

## 1. AUTHORITATIVE PRE-CHECK — FAIL CLOSED (inspected before any mutation, not assumed from memory)

| Check | Expected | Actual | Result |
| --- | --- | --- | --- |
| Branch | `arena/01a0ddae-iips-production-market-data` | `arena/01a0ddae-iips-production-market-data` via `git branch --show-current` | PASS |
| HEAD | `8076b58ffd2e1a44c0242175e6d44080b402ab49` | `8076b58ffd2e1a44c0242175e6d44080b402ab49` via `git rev-parse HEAD` | PASS |
| origin HEAD | same as HEAD | `8076b58ffd2e1a44c0242175e6d44080b402ab49` via `git rev-parse origin/arena/01a0ddae-iips-production-market-data` | PASS |
| ls-remote | same as HEAD | `8076b58ffd2e1a44c0242175e6d44080b402ab49` via `git ls-remote origin arena/01a0ddae-iips-production-market-data` | PASS |
| LOCAL == REMOTE | YES | YES — HEAD == origin == ls-remote | PASS |
| Worktree | CLEAN | CLEAN — `git status --porcelain` empty | PASS |
| D06 provider-designation act exists | `evidence/intelligence-data-supply-governance/D8-D06-NEWS-SOURCE-PROVIDER-DESIGNATION-ACT.md` present | PRESENT — 129700B SHA-256 `4fda6bfd306fe1dde11b543f14e2d74ff0764f48d49911097898d27953dff0c2` | PASS |
| Recorded provider | Parse.bot NSE India API — `get_corporate_announcements` | Verified via grep: provider name `Parse.bot NSE India API — nseindia.com API wrapper — get_corporate_announcements endpoint`, endpoint `GET get_corporate_announcements`, URL `https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements` | PASS |
| D06 provider designation current | ESTABLISHED by this act at 8076b58 | ESTABLISHED — `D06_PROVIDER = SELECTED` | PASS |
| D07 status | CLOSED | CLOSED — provider designated at e14b3b4, M-1 commissioned at b0faa13, M-1 deposited at 62330df, M-3 established at 9f608d9 | PASS |
| D06 contract | `src/contracts/d06_news.ts` present, unchanged | PRESENT — verified content below | PASS |
| D06 engine | `src/intelligence/news_engine.ts` present, unchanged | PRESENT — verified content below | PASS |
| SourceClassification contract | `src/contracts/types.ts` present | PRESENT — values `CANONICAL_MARKET_DATA, REAL, DERIVED, CERTIFIED_ENGINE, TIGZIG_YAHOO_FINANCE_ESTIMATES` only, no D06 classification yet | PASS |
| D06 M-1 act pre-existence | NOT PRESENT before this act | NOT EXISTS — verified via ls | PASS |
| D06 M-1 deposition | NOT DEPOSITED before this act | No dataset file present for D06 | PASS |

**Pre-check outcome:** PASS — fail-closed gates satisfied, authorized to proceed with governance-only M-1 commissioning act.

---

## 2. M-1 COMMISSIONING OBJECTIVE

Commission exactly this capability:

**D06 PROSPECTIVE NSE CORPORATE-DISCLOSURE OBSERVATION DATASET**

Scope:

* NSE corporate announcements / regulatory disclosures (issuer filings to exchange, not editorial news);
* Parse.bot NSE India API route `get_corporate_announcements`;
* underlying source NSE India (public corporate-announcements feed backend behind nseindia.com Corporate Filings page);
* prospective acquisition only from commissioning boundary onward;
* single-user;
* personal / non-commercial;
* research / educational;
* non-deployed;
* build-time TypeScript dataset;
* zero live provider execution at runtime;
* zero historical backfill;
* zero historical PIT claim.

Authorization begins from D06 provider-designation boundary 2026-09-27 (act `d8-d06-news-source-provider-designation-2026-09-27-001` at `8076b58`).

This gate commissions the capability only.

It MUST NOT acquire or deposit the actual D06 dataset.

It MUST NOT perform live provider calls.

It MUST NOT modify contracts, engine, or identity infrastructure.

---

## 3. D06 CONTRACT — AUTHORITATIVE INSPECTION (actual file, not assumed)

**Path:** `src/contracts/d06_news.ts`
**Inspection timestamp:** 2026-09-27 via `cat src/contracts/d06_news.ts`
**SHA-256 at inspection (recalculated from authoritative checkout):** To be preserved via existing file hash (contract unchanged in this gate)

**Actual contract as found (verbatim):**

```typescript
/**
 * Institutional Investment Platform System (IIPS)
 * Domain D06: News & Events Canonical Contract
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { ValidationResult, ValidationIssue } from './types.js';

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

export function validateNewsEvent(payload: NewsEventPayload): ValidationResult {
  const errors: ValidationIssue[] = [];
  const anomalyCodes: string[] = [];

  if (!payload.newsId) {
    errors.push({ field: 'newsId', code: 'MISSING_MANDATORY_FIELD', message: 'newsId is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (!payload.headline) {
    errors.push({ field: 'headline', code: 'MISSING_MANDATORY_FIELD', message: 'headline is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (isNaN(Date.parse(payload.publishedAt))) {
    errors.push({ field: 'publishedAt', code: 'STRUCTURAL_MALFORMATION', message: 'publishedAt must be valid ISO-8601', severity: 'CRITICAL' });
    anomalyCodes.push('STRUCTURAL_MALFORMATION');
  }
  if (payload.sentimentScore < -1.0 || payload.sentimentScore > 1.0) {
    errors.push({ field: 'sentimentScore', code: 'OUT_OF_RANGE_VALUE', message: 'sentimentScore must be between -1.0 and 1.0', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }
  if (payload.relevanceScore < 0.0 || payload.relevanceScore > 1.0) {
    errors.push({ field: 'relevanceScore', code: 'OUT_OF_RANGE_VALUE', message: 'relevanceScore must be between 0.0 and 1.0', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }

  const isValid = errors.length === 0;
  return {
    isValid,
    quality: isValid ? 'GOOD' : 'UNAVAILABLE',
    errors,
    anomalyCodes,
  };
}
```

**Contract preservation statement:** Contract unchanged in this gate. Do NOT modify `src/contracts/d06_news.ts` in this governance-only gate. The commissioning act must conform to actual engine/contract rather than inventing new contract.

**Reported shape matches actual:** YES — `NewsEventPayload { companyId?, newsId, headline, summary, publishedAt, category, sentimentScore, relevanceScore, sourcePublisher, tags }` with validation invariants.

---

## 4. D06 ENGINE — AUTHORITATIVE INSPECTION (actual file, not assumed)

**Path:** `src/intelligence/news_engine.ts`
**Inspection via:** `cat src/intelligence/news_engine.ts`

**Actual engine semantics verified:**

* `publishedAt <= asOf` PIT behavior: YES — `Filter eligible` where `pubMs > asOfMs return false`, i.e., `publishedAt <= asOf`
* Official exchange disclosure precedence: YES — sort by `sourcePublisher === 'GOVERNED_EXCHANGE_DISCLOSURE'` first, then latest `publishedAt`
* Category/source handling: YES — filters `category`, `companyId`, `minRelevance`, `limit`
* Payload expectations: `NewsEventPayload` with `sentimentScore -1.0..1.0`, `relevanceScore 0.0..1.0`, `publishedAt ISO-8601`, `newsId`, `headline`
* Immutability: `Object.freeze` on ingest
* Aggregate sentiment: average, dominant BULLISH/BEARISH/NEUTRAL threshold ±0.15

**Engine code as found (verbatim excerpt):**

```typescript
/**
 * Institutional Investment Platform System (IIPS)
 * Corporate News & Events Ingestion Engine (P10 / D06)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W2-AUTH-2026-01
 */

import { NewsEventPayload } from '../contracts/d06_news.js';
import { QualityState } from '../contracts/types.js';

export interface FilteredNewsResult {
  newsItems: NewsEventPayload[];
  totalAvailable: number;
  filteredCount: number;
  dominantSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  averageSentimentScore: number;
  qualityState: QualityState;
}

export class NewsEngine {
  private newsStore: NewsEventPayload[] = [];

  public ingestNews(item: NewsEventPayload): void {
    // Validate sentiment score invariant (-1.0 to +1.0)
    if (item.sentimentScore < -1.0 || item.sentimentScore > 1.0) {
      throw new Error(`Sentiment score out of range: ${item.sentimentScore}`);
    }

    // Freeze for immutability
    this.newsStore.push(Object.freeze({ ...item }));
  }

  /**
   * Queries news items for a company strictly as of a point in time (PIT).
   * Filters by minimum relevance and orders official exchange disclosures first.
   */
  public queryNews(params: {
    companyId?: string;
    asOf: string;
    minRelevance?: number;
    category?: NewsEventPayload['category'];
    limit?: number;
  }): FilteredNewsResult {
    const { companyId, asOf, minRelevance = 0.5, category, limit = 20 } = params;
    const asOfMs = Date.parse(asOf);

    // 1. PIT filtering: publishedAt <= asOf
    let eligible = this.newsStore.filter((item) => {
      const pubMs = Date.parse(item.publishedAt);
      if (pubMs > asOfMs) return false;
      if (companyId && item.companyId && item.companyId !== companyId) return false;
      if (category && item.category !== category) return false;
      if (item.relevanceScore < minRelevance) return false;
      return true;
    });

    const totalAvailable = eligible.length;

    // 2. Precedence ordering: Official Exchange Disclosures rank highest
    eligible.sort((a, b) => {
      const isAOfficial = a.sourcePublisher === 'GOVERNED_EXCHANGE_DISCLOSURE' ? 1 : 0;
      const isBOfficial = b.sourcePublisher === 'GOVERNED_EXCHANGE_DISCLOSURE' ? 1 : 0;
      if (isAOfficial !== isBOfficial) {
        return isBOfficial - isAOfficial; // Official first
      }
      // Then sort by latest publishedAt
      return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    });

    const items = eligible.slice(0, limit);

    // Calculate aggregate sentiment
    let avgSentiment = 0;
    if (items.length > 0) {
      const sum = items.reduce((acc, curr) => acc + curr.sentimentScore, 0);
      avgSentiment = Math.round((sum / items.length) * 100) / 100;
    }

    let dominantSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (avgSentiment >= 0.15) dominantSentiment = 'BULLISH';
    else if (avgSentiment <= -0.15) dominantSentiment = 'BEARISH';

    return {
      newsItems: items,
      totalAvailable,
      filteredCount: items.length,
      dominantSentiment,
      averageSentimentScore: avgSentiment,
      qualityState: items.length > 0 ? 'GOOD' : 'PARTIAL',
    };
  }
}
```

**Engine preservation:** Do NOT modify engine in this gate. Commissioning act must conform to actual engine/contract.

---

## 5. COMMISSIONED PROVIDER — EXACT DESIGNATION

The only commissioned provider route is:

**Parse.bot NSE India API — `get_corporate_announcements`**

**Base route:**

`https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/`

**Endpoint:**

`get_corporate_announcements`

**Full URL example (without secrets):**

`https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements?from_date=DD-MM-YYYY&to_date=DD-MM-YYYY&page=1&page_size=100`

**Documentation:**

* Marketplace: `https://parse.bot/marketplace/2a81eefa-a201-41f8-af3b-103a9010df01/nseindia-com-api`
* Pricing: `https://parse.bot/pricing`
* API contract: GET `get_corporate_announcements` — Get corporate announcements and filings for an NSE segment, newest first — 2 credits/call — charged only on success

**Authentication:**

`X-API-Key` header — e.g., `X-API-Key: $YOUR_KEY`

**Credential boundary:**

The API key MUST NOT be committed to the repository.

The commissioning act must explicitly state that credentials are external runtime/operator secrets and are not part of the repository artifact.

Credentials are external operator secrets, never recorded in governance acts, never committed, never logged, never embedded in request URL examples beyond placeholder.

**Provider identity provenance:**

* Independent, maintained REST wrapper over public NSE data — not official NSE API
* NSE does NOT offer publicly documented developer API with open registration — per Parse.bot marketplace description
* Market data distribution handled through licensed data vendors per Parse.bot marketplace
* This route provides structured JSON access to NSE public corporate-announcements feed (backend behind nseindia.com Corporate Filings page) — real-time, announcements appear within minutes — verified via Parse.bot docs + Apify NSE scraper FAQ + drishti blog filing vs news distinction

**Underlying source:** NSE India — corporate announcements / regulatory filings (issuer/exchange disclosure)

**Selection authority:** `d8-d06-news-source-provider-designation-2026-09-27-001` at `8076b58` — forensic basis 5 candidates, Parse.bot SELECTED for D06 News prospective only.

---

## 6. FREE-TIER / ENTITLEMENT BOUNDARY

Preserve exact limitation established by provider-designation act at `8076b58`.

Commissioned use is:

```text
LIMITED PERSONAL-USE-ONLY
RESEARCH / EDUCATIONAL
NON-COMMERCIAL
NON-SUBLICENSEABLE
REVOCABLE
NO REDISTRIBUTION
GRAY AREA FOR UNOFFICIAL ROUTES
```

Explicitly:

* Free tier: $0/mo, 200 credits/month, 5 req/min rate limit, no credit card required to start, free API key at signup via `https://parse.bot/signup` — per Parse.bot pricing page and marketplace — "No credit card. 200 credits on the house. Pay only for what you call." — "Free tier available"
* Per-call cost for `get_corporate_announcements`: 2 credits/call — charged only on success — ~100 calls/month free capacity for this endpoint — sufficient for 5-entity qualification (1-2 calls) and daily prospective polling
* Rate limits: Free 5 req/min — per pricing + marketplace
* Revocability: API key revocable, free tier revocable, NSE source can change without notice, undocumented, breaks without notice, no SLA — per Parse.bot docs and TIGZIG pattern
* Unofficial: Parse.bot is independent maintained REST wrapper, not official NSE API — gray area — per marketplace: "This isn't an official nseindia.com API — it's an independent, maintained REST wrapper over public data. Where the source has no official API (or only a limited one), Parse gives you a stable contract over a source that never promised one"

Do NOT state or imply:

* official NSE API authorization
* NSE commercial license
* unrestricted retention
* unrestricted redistribution
* commercial entitlement
* sublicensing rights
* official exchange data vendor agreement

Explicitly preserve:

```text
UNRESTRICTED COMMERCIAL ENTITLEMENT = NOT ESTABLISHED
FREE API ACCESS ≠ UNRESTRICTED DATA LICENSE
NO API KEY ≠ UNRESTRICTED RETENTION
PERSONAL USE ≠ PERMISSION TO REDISTRIBUTE
PUBLIC WEBPAGE ≠ UNRESTRICTED BULK EXTRACTION
```

For unrestricted commercial retention/transformation/redistribution, **ENTITLEMENT BASIS = NOT ESTABLISHED** — per Trading Q&A BSE charges 9 lakh + GST ticket plant 2.5 lakh + GST annual, Apify $50/1000 records commercial, official licensing expensive.

Entitlement for this IIPS single-user personal/research/educational non-deployed build-time dataset: **LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES** — for limited personal, single-user, non-commercial, research/educational retention/transformation for this single-user IIPS application (LOCAL / PERSONAL / SINGLE-USER / DEVELOPMENT-QUALIFICATION / NON-DEPLOYED tier per GP-5).

---

## 7. PROSPECTIVE ACQUISITION BOUNDARY

Commission:

```text
PROSPECTIVE_ACQUISITION = AUTHORIZED
HISTORICAL_BACKFILL = NOT AUTHORIZED
HISTORICAL_PIT = NOT ESTABLISHED
```

Rules:

* Future dataset must represent observations acquired from commissioning boundary onward — from designation date 2026-09-27 forward
* Do NOT manufacture historical records
* Do NOT backfill older NSE announcements beyond prospective window
* Do NOT infer historical PIT merely from announcement dates
* Announcement date (`an_dt`) is provider-supplied publication timestamp, NOT acquisition time — must not be relabeled as historical PIT capability
* Acquisition/observation time must be separately recorded as `acquiredAt` / `observedAt` at time of actual provider call
* No claim of continuous historical coverage prior to designation
* No claim of historical PIT reconstruction

**Temporal boundaries for D06 (commissioned):**

| Boundary | Status | Evidence |
| --- | --- | --- |
| OBSERVATION_TIME / ACQUISITION_TIME | TO BE ESTABLISHED at M-1 deposition — must be actual call timestamp | Commissioned to be preserved separately |
| PUBLICATION_TIME | MAY BE ESTABLISHED via provider `an_dt` + `exchdisstime` when actually supplied — unlike D07 where NOT ESTABLISHED | Provider supplies `an_dt`, `sort_date`, `exchdisstime` |
| SOURCE_AS_OF | NOT PROVIDED — NSE feed is latest-announcements, not point-in-time snapshot as-of parameter | Not to be invented |
| HISTORICAL_PIT | NOT ESTABLISHED — do not claim historical PIT capability | Commissioned as NOT ESTABLISHED |
| EFFECTIVE_TIME | NOT ESTABLISHED unless provider supplies explicit effective date beyond announcement date | Not to be invented |
| REVISION_SEQ | NOT ESTABLISHED unless provider supplies revision sequence | `seq_id` is stable announcement identifier, not revision sequence |
| DATA_VERSION | NOT PROVIDED unless provider supplies version | Not to be invented |

---

## 8. PUBLICATION-TIME SEMANTICS (D06 differs from D07)

D06 differs from D07 here.

For D06, provider may supply:

* `an_dt` — announcement date (e.g., DD-MM-YYYY or DD-MMM-YYYY)
* `exchdisstime` — exchange dissemination time (IST)
* `sort_date` — sortable date
* `an_dt` + `exchdisstime` combined provides dissemination timestamp

These MAY support governed `publishedAt` value after deterministic conversion from IST to UTC.

Commission the rule:

* Provider-supplied publication/dissemination timestamp MAY be retained as `publishedAt` after deterministic IST→UTC conversion
* It MUST NOT be replaced by acquisition time
* Acquisition/observation time MUST remain separate field (`acquiredAt` / `observedAt`)
* If publication time is absent in provider response, record it as unavailable — never fabricate
* Never fabricate publication time
* Never equate `acquiredAt = publishedAt` unless actual source evidence proves they are same, which must NOT be assumed
* Conversion must be deterministic, explicit, documented in M-1 deposition — e.g., `an_dt + exchdisstime IST → ISO-8601 UTC` via known IST offset (+05:30) without DST
* If `an_dt` present but `exchdisstime` absent, `publishedAt` may be date-only at start of day UTC or with explicit missing-time handling — must be documented, not silently assumed midnight
* Preserve original provider fields `an_dt`, `exchdisstime`, `sort_date` verbatim alongside derived `publishedAt` for lineage verification

**Prohibited:**

```text
acquiredAt = publishedAt  // PROHIBITED unless proven same
publishedAt = now()       // PROHIBITED — never fabricate
publishedAt = acquisitionTime // PROHIBITED
```

**Required separation:**

```text
publishedAt = provider-supplied an_dt + exchdisstime → ISO-8601 UTC (when available)
acquiredAt = actual provider call timestamp (separate)
observedAt = same as acquiredAt or transformation timestamp (separate)
```

---

## 9. GOVERNED IDENTITY

All future D06 governed observations MUST resolve NSE symbols through existing governed identity resolver.

Required form:

```text
EQ_*
```

Examples already established and to be reused:

```text
RELIANCE → EQ_RELIANCE_IN
INFY → EQ_INFY_IN
TCS → EQ_TCS_IN
HDFCBANK → EQ_HDFCBANK_IN
AXISBANK → EQ_AXISBANK_IN
```

Rules:

* Do NOT store `INFY` as governed `companyId`
* Do NOT store `INFY.NS` as governed `companyId` — unlike D07 which uses RELIANCE.NS via Yahoo Finance, D06 uses NSE native symbol without suffix (RELIANCE, INFY, TCS, etc) — both map to same EQ_* via governed resolver
* Do NOT store provider-native symbol as governed `companyId`
* Mapping deterministic, explicit, one-to-one, no ambiguous, no inferred from name, no fuzzy matching, fail closed if unmapped
* Provider-native symbol (`symbol` field from Parse.bot response) must be preserved as provenance alongside governed `companyId`
* ISIN (`sm_isin`) and company name (`sm_name`) also preserved as provenance for identity verification
* Industry (`smIndustry`) preserved as tag/provenance

Do NOT modify identity infrastructure in this gate.

Identity infrastructure remains as previously established — no changes to resolver in this governance-only gate.

---

## 10. FIVE-ENTITY QUALIFICATION SCOPE

Commission future qualification against already-established five governed entities:

1. `RELIANCE → EQ_RELIANCE_IN`
2. `INFY → EQ_INFY_IN`
3. `TCS → EQ_TCS_IN`
4. `HDFCBANK → EQ_HDFCBANK_IN`
5. `AXISBANK → EQ_AXISBANK_IN`

**Qualification requirement for later M-1 acquisition gate:**

* Later M-1 acquisition gate MUST prove all five through actual provider response — at least one corporate announcement per entity OR explicit null-data handling with quality PROVIDER_NULL preserved
* Must demonstrate symbol filtering or response parsing that correctly associates provider observations to governed EQ_* identities
* Must NOT invent observations — must use actual Parse.bot GET response bytes
* Must preserve raw response, byte count, SHA-256, acquisition timestamp, exact request URL (without API key), provider-native symbol, governed EQ_* mapping

**This commissioning gate does NOT perform that acquisition.**

No live provider execution in this gate.

No dataset deposition in this gate.

No five-entity proof in this gate — only commissioning of requirement.

---

## 11. DATA ELEMENTS TO BE PRESERVED (provenance/data preservation commissioning)

Commission provenance/data preservation for fields actually supplied by provider, including where applicable:

**From Parse.bot `get_corporate_announcements` per marketplace docs:**

* stable NSE announcement identifier (`seq_id` / `announcement_id`) — dedup key, stable id
* NSE symbol (`symbol` — e.g., RELIANCE)
* company name (`sm_name`)
* ISIN (`sm_isin`)
* industry (`smIndustry`)
* announcement date (`an_dt`)
* sort date (`sort_date`)
* exchange dissemination time (`exchdisstime` — IST)
* subject/category (`subject` — e.g., Board Meeting, Financial Results, Dividend)
* descriptive headline (`desc` — maps to `headline`)
* attachment text (`attchmntText` — maps to `summary`)
* attachment PDF URL (`attchmntFile` — source URL)
* file size (`fileSize`)
* source/publisher — NSE India = `GOVERNED_EXCHANGE_DISCLOSURE`
* acquisition timestamp (`acquiredAt` / `observedAt`)
* exact request URL without API key (e.g., `https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements?from_date=...&to_date=...&page=1&page_size=100`)
* response byte count
* SHA-256 lineage digest of raw response
* quality (`GOOD`, `PARTIAL`, `UNAVAILABLE`, `PROVIDER_NULL`)
* replay constraint (`replayConstraintApplied = true`)
* pagination metadata (`page`, `page_size`, `total`, `has_more`)
* deterministic transformation mapping (provider field → governed field)

**Do NOT require unsupported provider fields as though they already exist.**

Actual provider response schema is authoritative during M-1 deposition — if field absent, record as unavailable, do not fabricate.

**Governed mapping to `NewsEventPayload`:**

| Governed Field | Provider Source | Transformation | Notes |
| --- | --- | --- | --- |
| `companyId` | `symbol` → EQ_* via resolver | Deterministic NSE symbol → EQ_* | Must be EQ_* form |
| `newsId` | `seq_id` stable id | Direct, preserve verbatim | Dedup key |
| `headline` | `desc` descriptive text | Direct, trim | |
| `summary` | `attchmntText` attachment text | Direct, may be truncated | |
| `publishedAt` | `an_dt` + `exchdisstime` → ISO-8601 UTC | IST → UTC deterministic conversion | Separate from acquiredAt |
| `category` | `subject` NSE category | Mapping to `CORPORATE/EARNINGS/REGULATORY/MACRO/MARKET_ROUNDUP` | Explicit mapping table required in M-1 |
| `sentimentScore` | NOT PROVIDED | NOT PROVIDER-SUPPLIED — see §12 | Must not invent |
| `relevanceScore` | NOT PROVIDED | NOT PROVIDER-SUPPLIED — see §12 | Must not invent |
| `sourcePublisher` | NSE India | `GOVERNED_EXCHANGE_DISCLOSURE` | Official disclosure precedence |
| `tags` | `symbol`, `smIndustry`, `sm_isin`, `subject` | Array of tags | |

**Additional provenance fields to preserve in M-1 dataset beyond governed payload:**

* `sourceClassification` (to be determined — see §13)
* provider/source identity `Parse.bot NSE India API — get_corporate_announcements`
* exact request URL without API key
* provider-native announcement ID `seq_id`
* governed EQ_* identity
* source publisher `GOVERNED_EXCHANGE_DISCLOSURE`
* publication/dissemination time original `an_dt`, `exchdisstime`, `sort_date` plus derived `publishedAt`
* acquisition/observation time `acquiredAt`
* source URL `attchmntFile` PDF URL
* response byte count
* SHA-256 lineage digest
* dataVersion only if actually supplied
* quality
* replayConstraintApplied = true
* deterministic transformation mapping documentation

Never record API key.

Never include secrets in repository.

---

## 12. SENTIMENT / RELEVANCE — IMPORTANT BOUNDARY (must not be invented)

The provider-designation forensic at `8076b58` established:

* Parse.bot/NSE corporate announcements does NOT directly provide `sentimentScore`
* Parse.bot/NSE corporate announcements does NOT directly provide `relevanceScore`

Therefore M-1 commissioning act MUST NOT claim these are provider-supplied.

Commission following state:

```text
sentimentScore = NOT PROVIDER-SUPPLIED
relevanceScore = NOT PROVIDER-SUPPLIED
```

Do NOT authorize invented value such as:

```text
sentimentScore = 0.0
relevanceScore = 1.0
```

as though it came from NSE.

Such constants would violate provenance — provider does not supply sentiment/relevance, and contract requires -1.0..1.0 and 0.0..1.0 ranges, but must not be silently inserted as though from source.

If derived values are later considered necessary to satisfy `NewsEventPayload` contract validation (which requires sentimentScore and relevanceScore), that must be separately defined deterministic transformation/qualification decision based on explicit governance — e.g.:

* `relevanceScore` derived from official disclosure precedence (e.g., 1.0 for GOVERNED_EXCHANGE_DISCLOSURE)
* `sentimentScore` derived via deterministic rule (e.g., neutral 0.0 for factual filings) OR via separately governed sentiment model with explicit documentation

Do NOT solve that problem by silently inserting constants in this commissioning gate.

This gate commissions the limitation as QUALIFICATION-INCOMPLETE/DERIVED, to be resolved in M-1 deposition with explicit governance and documentation of derivation method, NOT as provider-supplied.

**For M-1 deposition acceptance, must document:**

* Whether sentimentScore/relevanceScore are derived or not present
* If derived, exact deterministic rule, why chosen, and that it is NOT provider-supplied
* Contract validation still must pass (`validateNewsEvent` requires sentiment -1..1, relevance 0..1)
* Provenance must distinguish provider-supplied vs derived

---

## 13. SOURCE CLASSIFICATION

Provider-designation act proposed future classification such as:

`NSE_CORPORATE_ANNOUNCEMENTS`

or:

`PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS`

Inspect existing `SourceClassification` contract:

**Actual `src/contracts/types.ts` at HEAD 8076b58:**

```typescript
export type SourceClassification =
  | 'CANONICAL_MARKET_DATA'
  | 'REAL'
  | 'DERIVED'
  | 'CERTIFIED_ENGINE'
  | 'TIGZIG_YAHOO_FINANCE_ESTIMATES';
```

**Finding:** No D06 classification exists yet. DataDomain includes `D06_NEWS` but SourceClassification does NOT include NSE classification.

**Determination for this commissioning act:**

* Smallest exact classification required: new enum member genuinely necessary for M-1 D06
* Candidate names:
  - `NSE_CORPORATE_ANNOUNCEMENTS` — concise, source-focused, matches underlying source NSE
  - `PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS` — provider+source explicit, matches TIGZIG pattern (`TIGZIG_YAHOO_FINANCE_ESTIMATES`)
  - `PARSE_BOT_NSE` — shorter but less precise

* Preferred per TIGZIG precedent: include provider AND source — `TIGZIG_YAHOO_FINANCE_ESTIMATES` pattern is provider + source + domain. Analogous for D06 would be `PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS` or `NSE_CORPORATE_ANNOUNCEMENTS`

* Decision for commissioning act: **Record requirement for new SourceClassification enum member, do NOT modify file in this gate**

**Commissioned requirement:**

```text
NEW_SOURCE_CLASSIFICATION_REQUIRED = YES
CANDIDATE_1 = NSE_CORPORATE_ANNOUNCEMENTS
CANDIDATE_2 = PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS
PREFERRED = PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS (to match TIGZIG_YAHOO_FINANCE_ESTIMATES pattern, explicit provider provenance)
DECISION_DEFERRED_TO_M1_DEPOSITION = YES — exact name to be finalized at M-1 deposition based on minimal exact classification principle and actual provider response
MODIFICATION_IN_THIS_GATE = NOT AUTHORIZED
```

Do NOT modify `src/contracts/types.ts` in this governance-only gate.

Record requirement only.

---

## 14. OFFICIAL DISCLOSURE PRECEDENCE

Commission:

```text
sourcePublisher = GOVERNED_EXCHANGE_DISCLOSURE
```

for observations whose source is actually NSE corporate disclosure.

Preserve distinction between:

```text
NSE issuer/exchange disclosure (official filing)
```

and:

```text
third-party editorial news (publisher article about filing)
```

D06 is commissioned for former — official NSE corporate announcements/regulatory filings, newest first, with original attachment PDF URL and stable record id — exactly regulatory disclosure intelligence — verified via Parse.bot docs + Apify FAQ + drishti blog.

Do NOT broaden this act into generic financial-news ingestion.

Generic financial news = regulatory disclosure source? FALSE — per forensic.

NSE corporate announcement = regulatory disclosure source? TRUE — verified.

**Engine precedence:** `NewsEngine` already implements official exchange disclosure precedence — `sourcePublisher === 'GOVERNED_EXCHANGE_DISCLOSURE'` ranks highest, then latest `publishedAt`.

**Category mapping commissioned:**

* NSE `subject` field (e.g., Board Meeting, Financial Results, Dividend, Credit Rating, Allotment) → governed `category` (`CORPORATE`, `EARNINGS`, `REGULATORY`, `MACRO`, `MARKET_ROUNDUP`)
* Must define explicit mapping table in M-1 deposition — e.g., Financial Results → EARNINGS, Dividend → CORPORATE, Board Meeting → CORPORATE, regulatory filings → REGULATORY, etc.
* Mapping must be deterministic, documented, not invented silently

---

## 15. BUILD-TIME / RUNTIME BOUNDARY

Commission D05-style architecture:

```text
Provider acquisition (build-time, operator secret API key)
        ↓
raw source retention (JSON bytes, SHA-256, byte count)
        ↓
deterministic transformation (NSE symbol → EQ_*, an_dt+exchdisstime IST→UTC, subject→category, etc)
        ↓
governed build-time TypeScript dataset (offline payload)
        ↓
browser/runtime consumption (no live calls)
```

Explicitly:

```text
LIVE_PROVIDER_EXECUTION_AT_RUNTIME = NOT AUTHORIZED
```

No:

* browser fetch to Parse.bot
* runtime API call to NSE
* runtime API key in browser bundle
* OIDC provider call
* dynamic external dependency at runtime
* production ingestion loop
* server-side runtime polling without governance

**Runtime must consume only governed build-time dataset:**

* `src/intelligence/d06_*` TypeScript dataset (future) — similar to D07 pattern
* `NewsEngine.ingestNews()` + `queryNews({ asOf })` PIT filtering

**Acquisition is build-time only:**

* Operator runs script with external `X-API-Key` from env/secret store
* Script calls Parse.bot `get_corporate_announcements` with date range, pagination
* Raw JSON retained with byte count + SHA-256 + acquisition timestamp + exact request URL (without key)
* Transformation to `NewsEventPayload` with provenance
* Deposition as TypeScript file committed to repo (governed offline payload)
* No secrets committed

---

## 16. PROVENANCE REQUIREMENTS

Commission future M-1 records to preserve, where actually available:

* `sourceClassification` — new classification to be finalized (e.g., `PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS` or `NSE_CORPORATE_ANNOUNCEMENTS`)
* provider/source — `Parse.bot NSE India API — get_corporate_announcements` — underlying source NSE India
* exact request URL without API key — e.g., `https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements?from_date=DD-MM-YYYY&to_date=DD-MM-YYYY&page=1&page_size=100`
* provider-native announcement ID — `seq_id` stable id (dedup key)
* governed EQ_* identity — `EQ_RELIANCE_IN`, etc via resolver
* source publisher — `GOVERNED_EXCHANGE_DISCLOSURE`
* publication/dissemination time — original `an_dt`, `exchdisstime`, `sort_date` plus derived ISO-8601 UTC `publishedAt`
* acquisition/observation time — actual call timestamp ISO-8601 UTC
* source URL — `attchmntFile` PDF URL
* response byte count — actual bytes of raw response
* SHA-256 lineage digest — of raw response bytes
* dataVersion only if actually supplied by provider
* quality — `GOOD`, `PARTIAL`, `UNAVAILABLE`, `PROVIDER_NULL` per observation
* `replayConstraintApplied = true` — deterministic replay possible from retained raw bytes
* deterministic transformation mapping — provider field → governed field documentation
* provider-native symbol — `symbol` field preserved
* company name — `sm_name` preserved
* ISIN — `sm_isin` preserved
* industry — `smIndustry` preserved
* subject/category — `subject` preserved plus mapped `category`
* headline — `desc` preserved
* summary — `attchmntText` preserved
* file size — `fileSize` preserved
* pagination — `page`, `page_size`, `total`, `has_more` preserved

Never record API key.

Never include secrets in repository.

Never log secrets.

Exact request URL must be recorded WITHOUT API key.

---

## 17. NULL / MISSING-DATA POLICY

Commission explicit handling of missing provider fields.

Do NOT:

* convert null to zero
* silently drop source observations
* fabricate sentiment
* fabricate relevance
* fabricate publication timestamps
* fabricate identifiers
* fabricate headline/summary

**Policy commissioned (to be verified against actual M-1 response):**

* If provider returns observation with `symbol` null/unmapped → quality `UNAVAILABLE` or fail closed if cannot resolve EQ_*, do not invent mapping
* If `seq_id` absent → cannot establish `newsId` — must be `UNAVAILABLE` or generate deterministic id with explicit governance and documentation that it is derived, not provider-supplied
* If `desc` absent → headline missing — `UNAVAILABLE`, cannot ingest per contract (headline required)
* If `an_dt`/`exchdisstime` absent → `publishedAt` unavailable — record as unavailable, do not fabricate, do not replace with acquiredAt
* If `attchmntText` absent → summary may be empty string? Contract requires summary — must document handling — e.g., use `desc` as summary fallback with explicit note, or empty string with quality PARTIAL
* If no announcements for entity in prospective window → retain explicit null observation with quality `PROVIDER_NULL`, governed identity, metric period observation timestamp lineage digest source classification — similar to D07 HDFCBANK +1q null preservation pattern — ticker governed identity metric period observation timestamp lineage digest source classification quality PROVIDER_NULL not numeric not dropped not zero
* Sentiment/relevance missing → see §12 — NOT PROVIDER-SUPPLIED, must be derived with explicit governance if needed for contract validation, not silently invented

A provider observation may be retained with explicit quality/missing-data state where governance permits.

Exact policy must reflect actual M-1 response rather than inventing generic policy in advance.

For D06, similar to D07 null handling: null HDFCBANK +1q preserved ticker governed identity metric period observation timestamp lineage digest source classification quality PROVIDER_NULL not numeric not dropped not zero no broader null policy — for D06, if entity has zero filings in window, preserve explicit null/missing with governed identity, observation timestamp, source classification, quality PROVIDER_NULL, not dropped, not zero.

---

## 18. M-3 BOUNDARY

This act must explicitly preserve:

```text
D06 M-3 = NOT ESTABLISHED
```

M-3 will require:

* actual source acquisition via Parse.bot `get_corporate_announcements` — at least one real GET with external API key, build-time, operator secret
* retained source bytes — raw JSON response with byte count and SHA-256
* independent lineage verification — byte count, SHA-256, declared digest, declared byte count, observations vs raw, identity, metric, period, numeric, valid/null/invalid
* identity verification — NSE symbol → EQ_* deterministic, 5 entities
* publication-time verification — `an_dt` + `exchdisstime` → ISO-8601 UTC deterministic, preserved original, not replaced by acquisition time, acquisition time separate
* transformation verification — provider field → governed field mapping, category mapping, sourcePublisher GOVERNED_EXCHANGE_DISCLOSURE, tags, etc.
* provenance acceptance — sourceClassification, provider/source identity, exact request URL without key, provider ticker, governed EQ_* identity, headline, summary, publishedAt, category, sourcePublisher, tags, source URL, observation timestamp, lineage SHA-256, source classification, quality, replay constraint
* temporal boundaries — OBSERVATION_TIME ESTABLISHED, PUBLICATION_TIME MAY BE ESTABLISHED via an_dt+exchdisstime, SOURCE_AS_OF NOT PROVIDED, HISTORICAL_PIT NOT ESTABLISHED, EFFECTIVE_TIME NOT ESTABLISHED, REVISION_SEQ NOT ESTABLISHED, DATA_VERSION NOT PROVIDED unless actually supplied
* null handling — explicit quality state
* sentiment/relevance limitation — documented as NOT PROVIDER-SUPPLIED, derived with explicit governance if needed

Do NOT create M-3 evidence in this gate.

This gate is M-1 commissioning only.

---

## 19. D07 / D08 / D09 / D115 BOUNDARIES

Explicitly preserve:

```text
D07 = CLOSED
D08 = DEFERRED
D09 = CONDITIONAL
D115 = WITHHELD / UNRESOLVED / NOT AUTHORIZED
D91/D88 = NOT GRANTED
PRODUCTION = NOT AUTHORIZED
```

* D07 = CLOSED — provider designated at e14b3b4, M-1 commissioned at b0faa13, M-1 deposited at 62330df (40 obs, 39 valid, 1 null, 5 entities, 6110B raw SHA 9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254, observation 2026-09-27T18:18:58Z), M-3 established at 9f608d9 — no D07 changes by this act, do not modify D07 contracts, datasets, acts

* D08 = DEFERRED — macro remains LIVE-only per D91, D91/D88 relief NOT GRANTED, macro acquisition NOT AUTHORIZED, do not make blocker for initial D8 commissioning, preserve D91/D88

* D09 = CONDITIONAL / FEASIBILITY-GATED — may enter only if valid governed source, entitlement/licensing, provenance, approvalRef can be established, no provider designated merely to satisfy condition, do not activate D09 in this gate

* D115 = WITHHELD / UNRESOLVED / NOT AUTHORIZED — runtimeCompanyId UNRESOLVED, no D115 production activation, no identity authority grant

* D91/D88 = NOT GRANTED — LIVE-only macro, no relief, D08 deferred

* PRODUCTION = NOT AUTHORIZED — no production runtime certification, no deployment, no commercial entitlement

Do NOT modify any of those states.

This act is D06 M-1 commissioning only.

---

## 20. GOVERNANCE ACT — EXACT ARTIFACT

Create exactly one governance-only act:

`evidence/intelligence-data-supply-governance/D06-M1-PROSPECTIVE-NSE-CORPORATE-DISCLOSURE-DATASET-COMMISSIONING-ACT.md`

This file is that act.

The act includes:

* authority — RAMKI
* antecedent provider-designation act — `d8-d06-news-source-provider-designation-2026-09-27-001` at `8076b58` — 129700B SHA `4fda6bfd306fe1dde11b543f14e2d74ff0764f48d49911097898d27953dff0c2`
* exact provider — Parse.bot NSE India API — `get_corporate_announcements`
* exact endpoint — `GET get_corporate_announcements` via `https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements`
* entitlement boundary — LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES, UNRESTRICTED COMMERCIAL ENTITLEMENT = NOT ESTABLISHED, FREE API ACCESS ≠ UNRESTRICTED DATA LICENSE
* prospective-only boundary — PROSPECTIVE_ACQUISITION = AUTHORIZED from 2026-09-27, HISTORICAL_BACKFILL = NOT AUTHORIZED, HISTORICAL_PIT = NOT ESTABLISHED
* five-entity qualification scope — RELIANCE→EQ_RELIANCE_IN, INFY→EQ_INFY_IN, TCS→EQ_TCS_IN, HDFCBANK→EQ_HDFCBANK_IN, AXISBANK→EQ_AXISBANK_IN
* governed identity requirements — EQ_* required, NSE symbol without .NS suffix, deterministic mapping, fail closed if unmapped, preserve provider-native symbol
* provider publication-time semantics — an_dt + exchdisstime IST→UTC deterministic conversion, preserved original, acquisition time separate, never fabricate, never equate acquiredAt=publishedAt unless proven same
* acquisition-time separation — publishedAt from provider when available, acquiredAt actual call timestamp separate
* data/provenance requirements — seq_id, symbol, sm_name, sm_isin, smIndustry, an_dt, sort_date, exchdisstime, subject, desc, attchmntText, attchmntFile, fileSize, sourcePublisher GOVERNED_EXCHANGE_DISCLOSURE, acquisition timestamp, exact request URL without key, byte count, SHA-256, quality, replayConstraintApplied, transformation mapping, pagination
* sentiment/relevance limitation — sentimentScore = NOT PROVIDER-SUPPLIED, relevanceScore = NOT PROVIDER-SUPPLIED, QUALIFICATION-INCOMPLETE/DERIVED, must not invent constants as though from NSE, derived values require explicit governance
* source-classification requirement — new enum member required, candidates NSE_CORPORATE_ANNOUNCEMENTS / PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS, preferred PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS per TIGZIG pattern, decision deferred to M-1 deposition, no modification in this gate
* build-time/runtime boundary — D05-style architecture, LIVE_PROVIDER_EXECUTION_AT_RUNTIME = NOT AUTHORIZED, no browser fetch, no runtime API key, no production ingestion, build-time dataset only
* M-3 not-established boundary — D06 M-3 = NOT ESTABLISHED, M-3 will require actual acquisition, retained bytes, lineage verification, identity verification, publication-time verification, transformation verification, provenance acceptance
* explicit exclusions — no historical backfill, no historical PIT, no publication-time fabrication, no sentiment/relevance fabrication, no official NSE authorization claim, no commercial entitlement claim, no unrestricted retention/redistribution claim, no API key in repo, no runtime execution, no D07/D08/D09/D115 changes, no production
* acceptance criteria for subsequent deposition gate — see §21

Do NOT create actual dataset in this gate.

---

## 21. ACCEPTANCE CRITERIA FOR SUBSEQUENT M-1 DEPOSITION GATE

The next governed gate will be **D06 M-1 actual prospective dataset acquisition, deposition, and acceptance**.

It must prove:

**Technical proof-of-acquisition:**

* ONE real Parse.bot GET `get_corporate_announcements` with external `X-API-Key` (operator secret, not in repo)
* Exact request URL without key preserved (e.g., with from_date/to_date/page/page_size)
* Response byte count actual
* SHA-256 lineage digest actual
* Acquisition timestamp actual ISO-8601 UTC
* Raw JSON retained — `src/intelligence/d06_prospective_*.json` or similar, similar to D07 pattern
* No secrets in repo

**Five-entity consistency:**

* Prove all five governed entities through actual provider response — at least one announcement per entity OR explicit null with quality PROVIDER_NULL
* NSE symbol → EQ_* deterministic mapping verified for each — RELIANCE→EQ_RELIANCE_IN, INFY→EQ_INFY_IN, TCS→EQ_TCS_IN, HDFCBANK→EQ_HDFCBANK_IN, AXISBANK→EQ_AXISBANK_IN
* Cross-artifact lineage — observations vs raw, byte count, SHA, identity, metric, period, valid/null/invalid
* If entity has zero announcements in prospective window, preserve explicit null observation with governed identity, observation timestamp, lineage digest, source classification, quality PROVIDER_NULL, not dropped, not zero

**M-1 commissioning conformance:**

* Conforms to this commissioning act — provider Parse.bot get_corporate_announcements only, prospective only, no historical backfill
* Conforms to D06 contract `src/contracts/d06_news.ts` — NewsEventPayload with companyId EQ_*, newsId seq_id, headline desc, summary attchmntText, publishedAt ISO-8601 UTC from an_dt+exchdisstime, category mapped from subject, sentimentScore/relevanceScore handled per §12 with explicit derivation documentation, sourcePublisher GOVERNED_EXCHANGE_DISCLOSURE, tags
* Conforms to engine `src/intelligence/news_engine.ts` — publishedAt <= asOf PIT, official disclosure precedence, relevance filtering
* Source classification — new enum member finalized and added to `src/contracts/types.ts` (e.g., PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS) with minimal exact change
* Build-time dataset — TypeScript file similar to D07 pattern, governed offline payload, no runtime execution
* Provenance — sourceClassification, provider/source, exact request URL without key, provider-native announcement ID, governed EQ_* identity, source publisher, publication/dissemination time original + derived, acquisition/observation time, source URL, byte count, SHA-256, quality, replayConstraintApplied, transformation mapping
* Publication-time semantics — an_dt+exchdisstime preserved original, converted IST→UTC deterministic, acquisition time separate, never equated unless proven same
* Sentiment/relevance — documented as NOT PROVIDER-SUPPLIED, derived with explicit governance if needed, not silently invented as provider-supplied
* Entitlement — LIMITED PERSONAL-USE-ONLY etc preserved, UNRESTRICTED COMMERCIAL NOT ESTABLISHED, FREE API ≠ UNRESTRICTED LICENSE
* Null handling — explicit quality, not dropped, not zero

**Deposition artifacts:**

* Raw response JSON — byte count, SHA-256
* Governed dataset TypeScript file — observations with provenance
* M-1 act reference — this act ID `d06-m1-prospective-nse-corporate-disclosure-commissioning-2026-09-27-001`
* Acceptance criteria — must pass validation `validateNewsEvent`, identity mapping, temporal boundaries, lineage verification

**Boundaries preserved:**

* D07 CLOSED — no changes
* D08 DEFERRED — no activation
* D09 CONDITIONAL — no activation unless valid source/entitlement/provenance/approvalRef
* D115 WITHHELD — no production
* D91/D88 NOT GRANTED — no relief
* PRODUCTION NOT AUTHORIZED — no production certification
* D06 M-3 NOT ESTABLISHED until separate M-3 gate

---

## 22. EXPLICIT EXCLUSIONS

This act does NOT authorize and explicitly excludes:

* Actual D06 data acquisition — NO live provider execution in this gate, ZERO LIVE PROVIDER EXECUTION, build-time acquisition ZERO
* D06 five-entity qualification — commissioning only, qualification to be performed in next gate
* D06 dataset deposition — NO dataset file created in this gate
* D06 M-3 establishment — D06 M-3 = NOT ESTABLISHED, no provenance acceptance in this gate
* D06 UI integration — no UI changes
* Runtime integration — LIVE_PROVIDER_EXECUTION_AT_RUNTIME = NOT AUTHORIZED
* Historical backfill — HISTORICAL_BACKFILL = NOT AUTHORIZED
* Historical PIT — HISTORICAL_PIT = NOT ESTABLISHED
* Publication-time fabrication — never fabricate publishedAt, never replace with acquisition time
* Sentiment/relevance fabrication — sentimentScore/relevanceScore NOT PROVIDER-SUPPLIED, do not invent as though from NSE
* Official NSE authorization claim — NSE does NOT offer publicly documented developer API with open registration, free tier is unofficial wrapper gray area
* Commercial entitlement claim — UNRESTRICTED COMMERCIAL ENTITLEMENT = NOT ESTABLISHED
* Unrestricted retention/redistribution claim — NO REDISTRIBUTION, NON-SUBLICENSEABLE, REVOCABLE
* API key in repository — credentials external operator secrets only
* D07 changes — D07 CLOSED, provider designated at e14b3b4, M-1 commissioned at b0faa13, M-1 deposited at 62330df, M-3 established at 9f608d9 — no D07 modifications
* D08 activation — D08 DEFERRED
* D09 activation — D09 CONDITIONAL/FEASIBILITY-GATED
* D115 resolution — D115 WITHHELD/UNRESOLVED/NOT AUTHORIZED
* D91/D88 relief — NOT GRANTED
* Production — PRODUCTION NOT AUTHORIZED
* SourceClassification modification — new classification required but NOT modified in this governance-only gate
* Contract modification — `src/contracts/d06_news.ts` unchanged
* Engine modification — `src/intelligence/news_engine.ts` unchanged
* Identity infrastructure modification — no resolver changes in this gate

---

## 23. FINAL STATE AFTER THIS ACT

```text
D06 = PROVIDER-DESIGNATED + M-1 COMMISSIONED
D06 Provider = Parse.bot NSE India API get_corporate_announcements — ESTABLISHED at 8076b58
D06 M-1 = COMMISSIONED by this act d06-m1-prospective-nse-corporate-disclosure-commissioning-2026-09-27-001 — prospective NSE corporate-disclosure observation dataset capability commissioned, no deposition yet
D06 M-1 Deposition = NOT DEPOSITED — no dataset file, no raw response, no proof-of-acquisition yet
D06 M-3 = NOT ESTABLISHED — provenance acceptance requires actual acquisition + lineage verification + identity + publication-time + transformation verification
D07 = CLOSED — provider designated at e14b3b4, M-1 commissioned at b0faa13, M-1 deposited at 62330df (40 obs, 39 valid, 1 null, 5 entities, 6110B raw SHA 9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254, observation 2026-09-27T18:18:58Z), M-3 established at 9f608d9 — no changes
D08 = DEFERRED — macro LIVE-only, D91/D88 relief NOT GRANTED, macro acquisition NOT AUTHORIZED
D09 = CONDITIONAL / FEASIBILITY-GATED — may enter only if valid governed source, entitlement/licensing, provenance, approvalRef can be established
D115 = WITHHELD / UNRESOLVED / NOT AUTHORIZED — runtimeCompanyId UNRESOLVED, no production activation
D91/D88 = NOT GRANTED — LIVE-only macro, no relief
PRODUCTION = NOT AUTHORIZED — no production runtime certification
ENTITLEMENT_D06 = LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES — commercial/redistribution NOT ESTABLISHED
PROSPECTIVE_ACQUISITION_D06 = AUTHORIZED from 2026-09-27
HISTORICAL_BACKFILL_D06 = NOT AUTHORIZED
HISTORICAL_PIT_D06 = NOT ESTABLISHED
PUBLICATION_TIME_D06 = MAY BE ESTABLISHED via an_dt + exchdisstime when actually supplied, preserved original, IST→UTC deterministic, acquisition time separate
OBSERVATION_TIME_D06 = TO BE ESTABLISHED at M-1 deposition — actual call timestamp
SENTIMENT_SCORE_D06 = NOT PROVIDER-SUPPLIED — QUALIFICATION-INCOMPLETE/DERIVED
RELEVANCE_SCORE_D06 = NOT PROVIDER-SUPPLIED — QUALIFICATION-INCOMPLETE/DERIVED
SOURCE_CLASSIFICATION_D06 = NEW REQUIRED — candidates NSE_CORPORATE_ANNOUNCEMENTS / PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS, preferred PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS per TIGZIG pattern, decision deferred to M-1 deposition, no modification in this gate
BUILD_TIME_DATASET_D06 = COMMISSIONED — D05-style architecture
LIVE_PROVIDER_EXECUTION_AT_RUNTIME_D06 = NOT AUTHORIZED
API_KEY_BOUNDARY = EXTERNAL OPERATOR SECRET — never committed, never logged, never in repo
```

---

## 24. AUTHORITY & SIGNATURE

**Authority:** RAMKI — M-1 Commissioning Authority / Authorizing Authority per M-2 act `gate-y-m2-intelligence-data-authorization-2026-09-27-001`

**Antecedent Acts Verified:**

* `gate-y-intel-data-supply-designation-selection-2026-09-27-001` at `95f36cf` — GATE-Y SELECTED
* `gate-y-m2-intelligence-data-authorization-2026-09-27-001` at `7db93a6` — M-2 ESTABLISHED
* `d8-intelligence-domain-scope-determination-2026-09-27-001` at `a2eee10` — D8 scope D06=REQUIRED/IN SCOPE D07=REQUIRED/IN SCOPE D08=DEFERRED D09=CONDITIONAL
* `d8-d06-d07-source-provider-designation-2026-09-27-001` at `e14b3b4` — D07 provider TIGZIG Yahoo Finance SELECTED for PROSPECTIVE D07 ONLY
* `d07-m1-prospective-estimates-observation-commissioning-2026-09-27-001` at `b0faa13` — D07 M-1 COMMISSIONED
* `62330df` — D07 M-1 DEPLOYED/DEPOSITED — 40 obs 39 valid 1 null 5 entities 6110B raw SHA `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254`
* `d07-m3-prospective-estimates-provenance-acceptance-2026-09-27-001` at `9f608d9` — D07 M-3 ESTABLISHED — D07 CLOSED
* `d8-d06-news-source-provider-designation-2026-09-27-001` at `8076b58` — D06 provider Parse.bot NSE get_corporate_announcements SELECTED for PROSPECTIVE D06 ONLY — 129700B SHA `4fda6bfd306fe1dde11b543f14e2d74ff0764f48d49911097898d27953dff0c2` — antecedent for this act

**Recording Agent:** Arena — recording only, no implementation, no acquisition, no deposition

**Act ID:** `d06-m1-prospective-nse-corporate-disclosure-commissioning-2026-09-27-001`

**Recorded At:** 2026-09-27 Asia/Calcutta

**Branch:** `arena/01a0ddae-iips-production-market-data`

**Pre-gate HEAD:** `8076b58ffd2e1a44c0242175e6d44080b402ab49`

**Post-gate Commit:** To be established after durability verification — see §25

**Remote SHA:** To be verified after push — see §25

**LOCAL == REMOTE:** To be verified after push — see §25

**Worktree:** To be verified CLEAN after commit — see §25

---

## 25. DURABILITY BOUNDARY (to be completed after file creation, before final report)

If and only if commissioning act is internally consistent and all preconditions pass:

1. Inspect exact diff — only intended governance act added
2. Verify only intended file mutated
3. Compute byte count — `wc -c` actual
4. Compute SHA-256 — `sha256sum` actual
5. Commit — `git add` + `git commit` with message `GATE-Y D06 M-1: commission prospective NSE corporate-disclosure dataset — Parse.bot get_corporate_announcements`
6. Push explicitly to authoritative remote — `git push origin arena/01a0ddae-iips-production-market-data`
7. Fetch remote — `git fetch origin`
8. Verify remote SHA equals new commit — `git rev-parse HEAD` == `git rev-parse origin/...` == `git ls-remote`
9. Verify LOCAL == REMOTE — YES
10. Verify worktree CLEAN — `git status --porcelain` empty
11. Re-read final act from authoritative checkout — `cat` + `sha256sum` recalc
12. Recalculate SHA-256 and verify matches recorded hash

Every command must fail closed.

No PASS after failed invariant.

If any requirement cannot be established from authoritative evidence, STOP rather than inventing it.

---

## 26. FINAL REPORT BOUNDARY

Report only verified facts after durability:

### Authoritative state

* branch
* pre-gate HEAD
* post-gate commit
* remote SHA
* LOCAL == REMOTE
* worktree

### Commissioning

* exact act path
* act SHA-256
* byte count
* provider
* endpoint
* entitlement
* prospective boundary
* five-entity scope
* provenance requirements
* sentiment/relevance limitation
* publication-time boundary

### Final state

```text
D06 = PROVIDER-DESIGNATED + M-1 COMMISSIONED
D06 M-1 = COMMISSIONED
D06 M-1 Deposition = NOT DEPOSITED
D06 M-3 = NOT ESTABLISHED
D07 = CLOSED
D08 = DEFERRED
D09 = CONDITIONAL
D115 = WITHHELD / UNRESOLVED
D91/D88 = NOT GRANTED
PRODUCTION = NOT AUTHORIZED
```

Do not claim actual data acquisition or dataset deposition.

---

## 27. STOP CONDITION

Once D06 M-1 commissioning act is durably committed, pushed, remotely verified, and worktree clean:

**STOP.**

Do not perform:

* D06 data acquisition
* D06 five-entity qualification
* D06 dataset deposition
* D06 M-3
* D06 UI integration
* runtime integration
* D07 changes
* D08
* D09
* D115
* production
* certification

Next governed gate will be **D06 M-1 actual prospective dataset acquisition, deposition, and acceptance**, determined from authoritative post-commissioning state.

---

**End of Authority Act. D06 M-1 COMMISSIONED — Parse.bot NSE India API get_corporate_announcements route commissioned for prospective NSE corporate-disclosure observation dataset capability ONLY — governance-only, no acquisition, no deposition, no M-3, personal/single-user/non-commercial, prospective from designation date 2026-09-27 onward, regulatory disclosure intelligence (NSE corporate announcements with PDF URL and stable seq_id), headline desc, summary attchmntText, publishedAt an_dt+exchdisstime preserved IST→UTC deterministic, sourcePublisher GOVERNED_EXCHANGE_DISCLOSURE, newsId seq_id, category subject mapping, tags symbol/industry/isin, companyId EQ_* deterministic, sentimentScore NOT PROVIDER-SUPPLIED, relevanceScore NOT PROVIDER-SUPPLIED, entitlement LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES, commercial/redistribution NOT ESTABLISHED, new SourceClassification required but not modified in this gate, build-time dataset commissioned, LIVE_PROVIDER_EXECUTION_AT_RUNTIME NOT AUTHORIZED, API key external secret never committed, D07 CLOSED, D08 DEFERRED, D09 CONDITIONAL, D115 WITHHELD, D91/D88 NOT GRANTED, PRODUCTION NOT AUTHORIZED. Next gate: D06 M-1 actual prospective dataset acquisition, deposition, and acceptance.**
