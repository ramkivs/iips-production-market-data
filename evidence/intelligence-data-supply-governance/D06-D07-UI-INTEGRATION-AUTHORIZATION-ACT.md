# Institutional Investment Platform System (IIPS)
# D06/D07 UI Integration Authorization Act — Governance-Only Build-Time Wiring Preparation

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `d06-d07-ui-integration-authorization-2026-09-27-001`
**Governing Authority:** RAMKI (Implementation Authorizing Authority / Authorizing Authority)
**Recording Agent:** Arena (recording only — no implementation, no UI wiring performed or authorized beyond governance authorization record)
**Act Type:** AUTHORITY UI INTEGRATION AUTHORIZATION (governance-only; NO IMPLEMENTATION, NO PRODUCTION, NO LIVE-PROVIDER EXECUTION, NO D115, NO D08/D09 ACTIVATION, NO CERTIFICATION BEYOND AUTHORIZATION)
**Recorded At (local, Asia/Calcutta):** 2026-09-27
**Antecedent Checkpoint:** `dde0ee73e6a0954f8c1c3c761ed8971c1f0a0cbf`
**Parent Checkpoint:** `0ac3f3c6d08e29f237a0b0f54e8a6c8e0bc46c4d`
**Governed Branch:** `arena/01a0ddae-iips-production-market-data`
**Gate Context:** `GATE-Y (Intelligence Data-Supply)` — SELECTED/OPENED by `gate-y-intel-data-supply-designation-selection-2026-09-27-001` at `95f36cf`; M-2 ESTABLISHED by `gate-y-m2-intelligence-data-authorization-2026-09-27-001` at `7db93a6`; D8 Domain Scope ESTABLISHED by `d8-intelligence-domain-scope-determination-2026-09-27-001` at `a2eee10` — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL/FEASIBILITY-GATED; D07 Provider Designation ESTABLISHED by `d8-d06-d07-source-provider-designation-2026-09-27-001` at `e14b3b4` — TIGZIG Yahoo Finance estimates route SELECTED for PROSPECTIVE D07 ONLY; D07 M-1 COMMISSIONED at `b0faa13`, DEPLOYED/DEPOSITED at `62330df` — 40 obs 39 valid 1 null 5 entities 6110B raw SHA `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254`, M-3 ESTABLISHED at `9f608d9` — D07 CLOSED; D06 Provider Designation ESTABLISHED by `d8-d06-news-source-provider-designation-2026-09-27-001` at `8076b58` — Parse.bot NSE India API `get_corporate_announcements` SELECTED for PROSPECTIVE D06 ONLY — 129700B SHA `4fda6bfd306fe1dde11b543f14e2d74ff0764f48d49911097898d27953dff0c2`; D06 M-1 COMMISSIONED at `275922f` — 60591B SHA `1afd882657f2db82c014899ddb5d820ad20b507d8667bf0c5172da3c212f7c5c`; D06 M-1 Deposition at `0ac3f3c` — 5 obs 5 valid 0 null 5 entities 4030B raw SHA `ead9e0ac9276d739c532f986159f95c0e7bcfd5856d0f18c04b9f1abceaa7404` dataset 27380B SHA `d99248b8c524ded00ab656a9985dd091045957af10b5d3917f19c14507ddd895` types 1320B SHA `048791fe59f6a4fbb2349e0499e492b52f07b68fb114edb2e69801ccc8ae5a72`; D06 M-3 ESTABLISHED at `dde0ee7` — 48446B SHA `be04b2f13a3f9615aeb8373ec84166a5c14456fd63e4be3e8ac93f37e7884ce9` — D06 CLOSED, `ARENA_DIRECT_PARSEBOT_GET = ENVIRONMENT-BLOCKED` preserved verbatim and accepted per Ramki authority

---

## 1. AUTHORITATIVE PRE-CHECK — FAIL CLOSED (inspected before any mutation, not assumed from memory)

| Check | Expected | Actual | Result |
| --- | --- | --- | --- |
| Branch | `arena/01a0ddae-iips-production-market-data` | `arena/01a0ddae-iips-production-market-data` via `git branch --show-current` | PASS |
| HEAD | `dde0ee73e6a0954f8c1c3c761ed8971c1f0a0cbf` | `dde0ee73e6a0954f8c1c3c761ed8971c1f0a0cbf` via `git rev-parse HEAD` | PASS |
| origin HEAD | same as HEAD | `dde0ee73e6a0954f8c1c3c761ed8971c1f0a0cbf` via `git rev-parse origin/...` | PASS |
| ls-remote | same as HEAD | `dde0ee73e6a0954f8c1c3c761ed8971c1f0a0cbf` via `git ls-remote` | PASS |
| LOCAL == REMOTE | YES | YES — HEAD == origin == ls-remote | PASS |
| Worktree | CLEAN | CLEAN — `git status --porcelain` empty | PASS |
| D06 provider-designation act | `D8-D06-NEWS-SOURCE-PROVIDER-DESIGNATION-ACT.md` 129700B SHA `4fda6bfd306fe1dde11b543f14e2d74ff0764f48d49911097898d27953dff0c2` | PRESENT | PASS |
| D06 M-1 commissioning act | `D06-M1-PROSPECTIVE-NSE-CORPORATE-DISCLOSURE-DATASET-COMMISSIONING-ACT.md` 60591B SHA `1afd882657f2db82c014899ddb5d820ad20b507d8667bf0c5172da3c212f7c5c` | PRESENT | PASS |
| D06 M-3 provenance act | `D06-M3-PROSPECTIVE-NSE-CORPORATE-DISCLOSURE-PROVENANCE-ACCEPTANCE-ACT.md` 48446B SHA `be04b2f13a3f9615aeb8373ec84166a5c14456fd63e4be3e8ac93f37e7884ce9` | PRESENT | PASS |
| D07 provider act | `D8-D06-D07-SOURCE-PROVIDER-DESIGNATION-ACT.md` 39275B SHA `2519cbe436f34b2c42e4cbdec0d9acc755dd5a4fa13d28d0b47e0aaed024bd98` | PRESENT | PASS |
| D07 M-1 commissioning act | `D07-M1-PROSPECTIVE-ESTIMATES-OBSERVATION-DATASET-COMMISSIONING-ACT.md` 45681B SHA `9c0f2975af367da680edd303627cbb0ad9092b4dc37e5b3134052b2b49871e9d` | PRESENT | PASS |
| D07 M-3 provenance act | `D07-M3-PROSPECTIVE-ESTIMATES-PROVENANCE-ACCEPTANCE-ACT.md` 28969B SHA `7c6cffb8884cdc7723f3fc47155557835a0f6aec030aa95b07446553a90da24d` | PRESENT | PASS |
| D06 raw artifact | `d06_prospective_nse_corporate_announcements_raw_response.json` 4030B SHA `ead9e0ac9276d739c532f986159f95c0e7bcfd5856d0f18c04b9f1abceaa7404` | PRESENT | PASS |
| D06 dataset artifact | `d06_prospective_nse_corporate_disclosure_observation_dataset.ts` 27380B SHA `d99248b8c524ded00ab656a9985dd091045957af10b5d3917f19c14507ddd895` | PRESENT | PASS |
| D07 raw artifact | `d07_prospective_estimates_raw_response.json` 6110B SHA `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254` | PRESENT | PASS |
| D07 dataset artifact | `d07_prospective_estimates_observation_dataset.ts` 53618B SHA `eda08b8b3d8c600ccdaac4b61a9b4001dd9638eb76cdb015d544744fd6701f03` | PRESENT | PASS |
| D06 contract | `src/contracts/d06_news.ts` 2183B SHA `9aa401d7bf874ae633c20780f2dde7fc45db76f21344c253d79b86354e1d567d` | PRESENT unchanged | PASS |
| D06 engine | `src/intelligence/news_engine.ts` 3158B SHA `6f624e8be3b6307cbb282a844888563f0c3e4a932c6d20389b12e312173f1af4` | PRESENT unchanged | PASS |
| D07 contract | `src/contracts/d07_estimates.ts` 1959B SHA `7112f8ac6eaacfbf022c9fd93df3be220e16c4204069bd2217aa3a1b2921d462` | PRESENT unchanged | PASS |
| D07 engine | `src/intelligence/estimates_engine.ts` 4643B SHA `c3531b53d110982afb27707768d17cedb72dae4404a2ed441424b5164d1ed409` | PRESENT unchanged | PASS |
| Types | `src/contracts/types.ts` 1320B SHA `048791fe59f6a4fbb2349e0499e492b52f07b68fb114edb2e69801ccc8ae5a72` includes `PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS` + `TIGZIG_YAHOO_FINANCE_ESTIMATES` | PRESENT | PASS |
| UI04 surface | `src/ui/view_models/ui04_domain_intelligence.ts` 2741B | PRESENT — consumes news.newsItems with isOfficialExchange check | PASS |
| D06 status | CLOSED | CLOSED — provider, M-1 commissioned, M-1 deposited, M-3 established | PASS |
| D07 status | CLOSED | CLOSED — provider, M-1 commissioned, M-1 deposited, M-3 established | PASS |
| D08 status | DEFERRED | DEFERRED per scope act a2eee10 | PASS |
| D09 status | CONDITIONAL / FEASIBILITY-GATED | CONDITIONAL per scope act | PASS |
| D115 | WITHHELD | WITHHELD per M-2 act 7db93a6 | PASS |
| D91/D88 | NOT GRANTED | NOT GRANTED | PASS |
| PRODUCTION | NOT AUTHORIZED | NOT AUTHORIZED | PASS |
| D06/D07 UI integration act pre-existence | NOT PRESENT before this act | NOT EXISTS via ls | PASS |

Pre-check outcome: **PASS** — all invariants satisfied, authorized to proceed with governance-only UI integration authorization act.

---

## 2. REQUIRED INSPECTION — UI04 DOMAIN INTELLIGENCE SURFACE

**Path:** `src/ui/view_models/ui04_domain_intelligence.ts`
**Size:** 2741B
**Inspection via:** `cat src/ui/view_models/ui04_domain_intelligence.ts`

**Actual builder semantics verified:**

```typescript
export class UI04DomainIntelligenceBuilder {
  public static build(params: {
    intelligence: IntelligenceDTO;
    companyName: string;
    viewportWidth?: number;
  }): UI04DomainIntelligenceViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    const newsSignals = params.intelligence.news.newsItems.map((a) => ({
      headline: a.headline,
      sentiment: a.sentimentScore,
      sourceClass: a.sourcePublisher,
      isOfficialExchange: a.sourcePublisher === 'GOVERNED_EXCHANGE_DISCLOSURE',
    }));

    const macroIndicators = (params.intelligence.macro || []).map((m) => ({
      indicatorCode: m.seriesId,
      value: m.value,
      period: m.matchedPeriod,
      releaseDate: m.releaseDate,
      vintageDate: m.vintageDate,
    }));

    const altDataSignals = params.intelligence.altData
      ? [
          {
            signalName: params.intelligence.altData.signalType,
            confidence: params.intelligence.altData.compositeConfidence,
            approvalRef: params.intelligence.altData.approvalRefs.join(', '),
          },
        ]
      : [];

    return {
      surfaceId: 'UI04_DOMAIN_INTELLIGENCE',
      companyId: params.intelligence.companyId,
      companyName: params.companyName,
      asOf: params.intelligence.provenance.asOf,
      newsSignals,
      estimatesConsensus: {
        targetPrice: params.intelligence.estimates?.mean ?? null,
        analystCount: params.intelligence.estimates?.analystCount ?? 0,
        isValidConsensus: params.intelligence.estimates?.isConsensusValid ?? false,
      },
      macroIndicators,
      altDataSignals,
      qualityIndicator: AccessibilityEngine.getQualityIndicator(params.intelligence.quality),
      provenance: params.intelligence.provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        pinnedColumn: bp.pinPrimaryColumn ? 'signalType' : undefined,
      },
      accessibility: {
        ariaLive: 'polite',
        ariaRole: 'region',
        focusElementId: 'ui04-intelligence-feed',
        tableCaption: `Domain Intelligence and Alternative Signals for ${params.companyName}`,
      },
    };
  }
}
```

**Findings:**

* Consumes `news.newsItems` — maps `headline`, `sentimentScore`, `sourcePublisher`, `isOfficialExchange` check `sourcePublisher === 'GOVERNED_EXCHANGE_DISCLOSURE'` — **preserves official-disclosure precedence**
* Consumes `estimates` via `estimates?.mean`, `analystCount`, `isConsensusValid` — presentation-only
* Consumes `macro` optionally and `altData` optionally
* Uses `provenance.asOf`, `quality`, `companyId`, `companyName` — provenance preservation
* No direct provider calls, no network access, no API keys — purely view model builder, presentation-only
* Depends on `IntelligenceDTO` which contains `news: FilteredNewsResult` from `NewsEngine`, `estimates: AggregatedConsensusResult` from `EstimatesEngine`, etc.

**IntelligenceDTO inspected:**

**Path:** `src/transports/intelligence_dto.ts` — 883B

```typescript
export interface IntelligenceDTO {
  companyId: string;
  news: FilteredNewsResult;
  estimates?: AggregatedConsensusResult | null;
  macro?: MacroQueryResult[] | null;
  altData?: CompositeAlternativeSignal | null;
  quality: QualityState;
  provenance: ExecutiveProvenance;
}
```

* `news` is `FilteredNewsResult` from `NewsEngine.queryNews()` — requires PIT `publishedAt <= asOf` filtering and official disclosure precedence
* `estimates` is `AggregatedConsensusResult` from `EstimatesEngine.computeConsensus()` — requires PIT and N>=3 analyst threshold
* No live provider execution implied — DTO is product of engines consuming build-time datasets

**Intelligence module index inspected:**

**Path:** `src/intelligence/index.ts` — 324B — exports `news_engine`, `estimates_engine`, `macro_engine`, `altdata_engine` — no wiring, only exports

**D05/build-time dataset wiring pattern authoritative in repository:**

* **Path:** `src/identity/d05_broad_universe_data.ts` — 1841675B — pattern `export const D05_BROAD_UNIVERSE_ENTITIES: ReadonlyArray<SecurityMasterEntity> = [...]` — browser-safe build-time imported canonical dataset, governed under `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001`
* **D07 pattern:** `src/intelligence/d07_prospective_estimates_observation_dataset.ts` 53618B SHA `eda08b8b...` — pattern `export const D07_PROSPECTIVE_ESTIMATES_OBSERVATIONS`, `D07_PROSPECTIVE_ESTIMATES_VALID_PAYLOADS`, `D07_PROSPECTIVE_ESTIMATES_PROVENANCE` — build-time TS import, no live execution, D05 pattern
* **D06 pattern:** `src/intelligence/d06_prospective_nse_corporate_disclosure_observation_dataset.ts` 27380B SHA `d99248b8...` — pattern `export const D06_PROSPECTIVE_NSE_PROVENANCE`, `D06_PROSPECTIVE_NSE_OBSERVATIONS` — same build-time TS import pattern
* **Build scripts:** `package.json` scripts `build: tsc && vite build`, `build:tsc: tsc` — build-time only, no runtime acquisition

**Determination:** Deposited D06/D07 datasets CAN be wired into existing engines/view-model pipeline without changing D06/D07 contracts or engines, via build-time TS import (D05 pattern) — `NewsEngine.ingestNews()` from `D06_PROSPECTIVE_NSE_OBSERVATIONS` and `EstimatesEngine.submitEstimate()` from transformed `D07_PROSPECTIVE_ESTIMATES_VALID_PAYLOADS` (requires mapping to `IndividualAnalystEstimate` with governed anonymous analyst codes, but D07 already has valid payloads), then `queryNews({ companyId, asOf })` and `computeConsensus({ companyId, metric, targetPeriod, asOf })` to produce `FilteredNewsResult` and `AggregatedConsensusResult` for `IntelligenceDTO` → `UI04DomainIntelligenceBuilder.build()` — presentation-only, no network, no credentials, deterministic, preserves PIT and official disclosure precedence.

---

## 3. AUTHORIZED FUTURE BOUNDARY

This governance act may authorize subsequent implementation gate for:

### D06

Build-time consumption of:

`D06_PROSPECTIVE_NSE_OBSERVATIONS`

Current deposited scope:

* 5 observations
* 5 valid
* 0 provider-null
* 0 invalid
* five governed `EQ_*` identities: `EQ_RELIANCE_IN, EQ_INFY_IN, EQ_TCS_IN, EQ_HDFCBANK_IN, EQ_AXISBANK_IN`
* Raw: 4030B SHA `ead9e0ac9276d739c532f986159f95c0e7bcfd5856d0f18c04b9f1abceaa7404`
* Dataset: 27380B SHA `d99248b8c524ded00ab656a9985dd091045957af10b5d3917f19c14507ddd895`
* SourceClassification: `PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS`
* Provider: Parse.bot NSE India API `get_corporate_announcements` via `https://api.parse.bot/scraper/d621017b-ba03-43b8-816b-e5167cb6ec16/get_corporate_announcements` — underlying source NSE India
* Entitlement: LIMITED PERSONAL-USE-ONLY RESEARCH/EDUCATIONAL NON-COMMERCIAL NON-SUBLICENSEABLE REVOCABLE NO REDISTRIBUTION GRAY AREA
* Temporal: OBSERVATION_TIME ESTABLISHED `2026-09-27T18:45:00Z`, PUBLICATION_TIME MAY BE ESTABLISHED via an_dt+exchdisstime IST→UTC deterministic original preserved verbatim, SOURCE_AS_OF NOT PROVIDED, HISTORICAL_PIT NOT ESTABLISHED

### D07

Build-time consumption of:

`D07_PROSPECTIVE_ESTIMATES_VALID_PAYLOADS`

Current deposited scope:

* 39 valid observations/payloads (from 40 total, 1 provider-null HDFCBANK +1q)
* five governed entities: `EQ_RELIANCE_IN, EQ_INFY_IN, EQ_TCS_IN, EQ_HDFCBANK_IN, EQ_AXISBANK_IN`
* Raw: 6110B SHA `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254`
* Dataset: 53618B SHA `eda08b8b3d8c600ccdaac4b61a9b4001dd9638eb76cdb015d544744fd6701f03`
* SourceClassification: `TIGZIG_YAHOO_FINANCE_ESTIMATES`
* Provider: TIGZIG Yahoo Finance estimates route `https://yfin-h.tigzig.com/v1/get-estimates/`
* Entitlement: LIMITED PERSONAL-USE-ONLY RESEARCH/EDUCATIONAL NON-COMMERCIAL NON-SUBLICENSEABLE REVOCABLE NO REDISTRIBUTION GRAY AREA
* Temporal: OBSERVATION_TIME ESTABLISHED `2026-09-27T18:18:58Z`, PUBLICATION_TIME NOT ESTABLISHED, SOURCE_AS_OF NOT PROVIDED, HISTORICAL_PIT NOT ESTABLISHED

The subsequent implementation must preserve:

* existing contracts: `src/contracts/d06_news.ts` SHA `9aa401d7...`, `src/contracts/d07_estimates.ts` SHA `7112f8ac...`, `src/contracts/types.ts` SHA `048791fe...` includes both classifications
* existing engines: `src/intelligence/news_engine.ts` SHA `6f624e8b...`, `src/intelligence/estimates_engine.ts` SHA `c3531b53...`
* `publishedAt <= asOf` PIT filtering via `NewsEngine.queryNews()`
* `GOVERNED_EXCHANGE_DISCLOSURE` precedence via `NewsEngine` sort + `UI04` `isOfficialExchange` check
* deterministic EQ_* identity via governed resolver — no ticker strings substituted for companyId
* deposited provenance: raw/dataset lineage, byte counts, SHAs, timestamps, request URLs without keys, quality, replayConstraintApplied, transformation mapping, category mapping, sentiment/relevance derived provenance
* build-time/static dataset boundary: D05 pattern `export const ... ReadonlyArray`, no external acquisition during UI execution, no runtime provider sockets, no credentials, `LIVE_PROVIDER_EXECUTION_AT_RUNTIME = NOT AUTHORIZED`

---

## 4. AUTHORITY — RAMKI

**Authority:** RAMKI — Implementation Authorizing Authority per M-2 act `gate-y-m2-intelligence-data-authorization-2026-09-27-001` at `7db93a6` and per D06/D07 M-3 acts

**Antecedent Acts Verified:**

* `gate-y-intel-data-supply-designation-selection-2026-09-27-001` at `95f36cf` — GATE-Y SELECTED
* `gate-y-m2-intelligence-data-authorization-2026-09-27-001` at `7db93a6` — M-2 ESTABLISHED — governance/data-supply authority only, IMPLEMENTATION_AUTHORITY NOT GRANTED by M-2
* `d8-intelligence-domain-scope-determination-2026-09-27-001` at `a2eee10` — D8 scope D06=REQUIRED/IN SCOPE D07=REQUIRED/IN SCOPE D08=DEFERRED D09=CONDITIONAL
* `d8-d06-d07-source-provider-designation-2026-09-27-001` at `e14b3b4` — D07 provider TIGZIG Yahoo Finance SELECTED for PROSPECTIVE D07 ONLY — 39275B SHA `2519cbe4...`
* `d07-m1-prospective-estimates-observation-commissioning-2026-09-27-001` at `b0faa13` — D07 M-1 COMMISSIONED — 45681B SHA `9c0f2975...`
* `62330df` — D07 M-1 DEPLOYED/DEPOSITED — 40 obs 39 valid 1 null 5 entities 6110B raw SHA `9f76e6a...` dataset 53618B SHA `eda08b8b...` observation `2026-09-27T18:18:58Z`
* `d07-m3-prospective-estimates-provenance-acceptance-2026-09-27-001` at `9f608d9` — D07 M-3 ESTABLISHED — 28969B SHA `7c6cffb8...` — D07 CLOSED
* `d8-d06-news-source-provider-designation-2026-09-27-001` at `8076b58` — D06 provider Parse.bot NSE `get_corporate_announcements` SELECTED for PROSPECTIVE D06 ONLY — 129700B SHA `4fda6bfd...`
* `d06-m1-prospective-nse-corporate-disclosure-commissioning-2026-09-27-001` at `275922f` — D06 M-1 COMMISSIONED — 60591B SHA `1afd882...`
* `0ac3f3c` — D06 M-1 DEPLOYED/DEPOSITED — 5 obs 5 valid 0 null 5 entities 4030B raw SHA `ead9e0ac...` dataset 27380B SHA `d99248b8...` types 1320B SHA `048791fe...` observation `2026-09-27T18:45:00Z` — M-1 ACCEPTANCE PASS despite `ARENA_DIRECT_PARSEBOT_GET = ENVIRONMENT-BLOCKED`
* `d06-m3-prospective-nse-corporate-disclosure-provenance-acceptance-2026-09-27-001` at `dde0ee7` — D06 M-3 ESTABLISHED — 48446B SHA `be04b2f1...` — D06 CLOSED, `ARENA_DIRECT_PARSEBOT_GET = ENVIRONMENT-BLOCKED` preserved verbatim and accepted

**Recording Agent:** Arena — recording only, no implementation, no UI wiring

**Act ID:** `d06-d07-ui-integration-authorization-2026-09-27-001`

**Recorded At:** 2026-09-27 Asia/Calcutta

**Branch:** `arena/01a0ddae-iips-production-market-data`

**Pre-gate HEAD:** `dde0ee73e6a0954f8c1c3c761ed8971c1f0a0cbf`

**Post-gate Commit:** To be established after durability — see §12

**Remote SHA:** To be verified after push — see §12

**LOCAL == REMOTE:** To be verified after push — see §12

**Worktree:** To be verified CLEAN after commit — see §12

---

## 5. IMPLEMENTATION AUTHORIZATION

**Authorization statement (verbatim, RAMKI):**

> I, RAMKI, as Implementation Authorizing Authority, authorize a subsequent presentation-only, build-time implementation gate for D06/D07 intelligence UI integration, consuming already-deposited governed offline datasets only, under the already-established GATE-Y M-2 governance path and already-closed D06 and D07 chains.

> This authorization is for a subsequent presentation-only/build-time implementation gate that wires `D06_PROSPECTIVE_NSE_OBSERVATIONS` (5 observations, 5 valid, 0 null, 5 EQ_* identities, raw 4030B SHA `ead9e0ac...` dataset 27380B SHA `d99248b8...`) and `D07_PROSPECTIVE_ESTIMATES_VALID_PAYLOADS` (39 valid payloads, 5 entities, raw 6110B SHA `9f76e6a...` dataset 53618B SHA `eda08b8...`) into their existing engines `NewsEngine` and `EstimatesEngine` via build-time TS import (D05 pattern), producing `FilteredNewsResult` via `queryNews({ companyId, asOf })` with `publishedAt <= asOf` PIT and `GOVERNED_EXCHANGE_DISCLOSURE` precedence, and `AggregatedConsensusResult` via `computeConsensus({ companyId, metric, targetPeriod, asOf })`, for `IntelligenceDTO` → `UI04DomainIntelligenceBuilder.build()` presentation.

> This authorization is NOT production authorization, NOT live-provider execution authorization, NOT D115 identity authority, NOT D91/D88 macro relief, NOT D08 activation, NOT D09 provider designation, NOT commercial licensing, NOT unrestricted redistribution, NOT historical PIT authorization.

> Implementation must preserve existing contracts `src/contracts/d06_news.ts` SHA `9aa401d7...` and `src/contracts/d07_estimates.ts` SHA `7112f8ac...` and `src/contracts/types.ts` SHA `048791fe...` including `PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS` and `TIGZIG_YAHOO_FINANCE_ESTIMATES`, existing engines `src/intelligence/news_engine.ts` SHA `6f624e8b...` and `src/intelligence/estimates_engine.ts` SHA `c3531b53...`, deterministic EQ_* identity, deposited provenance, build-time/static dataset boundary, PIT semantics, official-disclosure precedence, entitlement boundaries, and Arena limitation `ARENA_DIRECT_PARSEBOT_GET = ENVIRONMENT-BLOCKED`.

> No UI files are modified by this authorization act — implementation to be performed in subsequent separate governed gate.

**Authorized by:** RAMKI — explicit, bounded to D06/D07 presentation-only build-time wiring

---

## 6. BUILD-TIME BOUNDARY

Commissioned for subsequent implementation:

```text
DEPOSITED D06/D07 ARTIFACTS ONLY
NO EXTERNAL ACQUISITION DURING UI EXECUTION
NO RUNTIME PROVIDER SOCKETS
NO CREDENTIALS
LIVE_PROVIDER_EXECUTION_AT_RUNTIME = NOT AUTHORIZED
```

* **D06 deposited artifacts only:** `d06_prospective_nse_corporate_announcements_raw_response.json` 4030B SHA `ead9e0ac...` + `d06_prospective_nse_corporate_disclosure_observation_dataset.ts` 27380B SHA `d99248b8...` — 5 obs
* **D07 deposited artifacts only:** `d07_prospective_estimates_raw_response.json` 6110B SHA `9f76e6a...` + `d07_prospective_estimates_observation_dataset.ts` 53618B SHA `eda08b8b...` — 39 valid payloads
* **No external acquisition during UI execution:** UI04 builder and engines must consume only build-time imported datasets, no `fetch`, no `XMLHttpRequest`, no `axios`, no `https`, no `X-API-Key`, no `fetch_page`, no `curl`
* **No runtime provider sockets:** External live sockets 0, preserved
* **No credentials:** No API keys, tokens, secrets in implementation — only sanitized request URLs without keys already in provenance
* **D05 pattern:** `export const D06_PROSPECTIVE_NSE_OBSERVATIONS: ReadonlyArray<...>` + `export const D07_PROSPECTIVE_ESTIMATES_VALID_PAYLOADS: ReadonlyArray<...>` — browser-safe build-time import, frozen via `Object.freeze` in engines
* **Build scripts:** `tsc && vite build` — build-time only, no runtime acquisition

---

## 7. PIT SEMANTICS

Preserve for subsequent implementation:

```text
publishedAt <= asOf PIT FILTERING
NEVER INTRODUCE HISTORICAL PIT CLAIMS BEYOND ESTABLISHED PROVENANCE
```

* **NewsEngine:** `queryNews({ companyId, asOf, minRelevance, category, limit })` already implements `publishedAt <= asOf` PIT filtering — verified in `src/intelligence/news_engine.ts` — `pubMs > asOfMs return false` — must be preserved, not bypassed
* **EstimatesEngine:** `computeConsensus({ companyId, metric, targetPeriod, asOf })` already implements PIT filtering `submittedAt <= asOf` + 90-day staleness cutoff + N>=3 analyst threshold — must be preserved
* **Never introduce historical PIT claims beyond established provenance:** D06 `PUBLICATION_TIME = MAY BE ESTABLISHED via an_dt+exchdisstime IST→UTC`, OBSERVATION_TIME ESTABLISHED `2026-09-27T18:45:00Z`, SOURCE_AS_OF NOT PROVIDED, HISTORICAL_PIT NOT ESTABLISHED — D07 `PUBLICATION_TIME = NOT ESTABLISHED`, OBSERVATION_TIME ESTABLISHED `2026-09-27T18:18:58Z`, SOURCE_AS_OF NOT PROVIDED, HISTORICAL_PIT NOT ESTABLISHED — must NOT claim historical PIT capability, no backfill, prospective only from authorization date onward

---

## 8. D06 OFFICIAL-DISCLOSURE PRECEDENCE

Preserve for subsequent implementation:

```text
sourcePublisher = GOVERNED_EXCHANGE_DISCLOSURE
IS_OFFICIAL_EXCHANGE = sourcePublisher === 'GOVERNED_EXCHANGE_DISCLOSURE'
```

* **NewsEngine:** Already implements official exchange disclosure precedence — sort by `sourcePublisher === 'GOVERNED_EXCHANGE_DISCLOSURE'` first, then latest `publishedAt` — verified in `src/intelligence/news_engine.ts`
* **UI04:** Already implements `isOfficialExchange: a.sourcePublisher === 'GOVERNED_EXCHANGE_DISCLOSURE'` — verified in `src/ui/view_models/ui04_domain_intelligence.ts`
* **D06 dataset:** All 5 observations have `sourcePublisher: GOVERNED_EXCHANGE_DISCLOSURE` — official NSE corporate announcements/regulatory filings, not third-party editorial news — must be preserved
* **D07:** No official disclosure precedence, but consensus validity via N>=3
* **Must NOT broaden into generic financial-news ingestion:** D06 is commissioned for official NSE issuer/exchange disclosure only, not third-party editorial news — `generic financial news = regulatory disclosure source` is FALSE, `NSE corporate announcement = regulatory disclosure source` is TRUE

---

## 9. IDENTITY — GOVERNED EQ_* PRESERVATION

Preserve for subsequent implementation:

```text
companyId = EQ_*
NEVER SUBSTITUTE TICKER STRING FOR companyId
```

* **D06:** `RELIANCE→EQ_RELIANCE_IN, INFY→EQ_INFY_IN, TCS→EQ_TCS_IN, HDFCBANK→EQ_HDFCBANK_IN, AXISBANK→EQ_AXISBANK_IN` — NSE symbol without `.NS` suffix, deterministic mapping via governed resolver, fail closed if unmapped — verified in dataset `companyId: EQ_RELIANCE_IN` etc, `providerTicker: RELIANCE` preserved separately
* **D07:** `RELIANCE.NS→EQ_RELIANCE_IN, INFY.NS→EQ_INFY_IN, TCS.NS→EQ_TCS_IN, HDFCBANK.NS→EQ_HDFCBANK_IN, AXISBANK.NS→EQ_AXISBANK_IN` — Yahoo Finance symbol with `.NS` suffix, both map to same EQ_* via resolver — verified in dataset
* **No ticker strings substituted for companyId:** `companyId` must be EQ_* form, provider-native ticker remains source identifier only `providerTicker` — must be preserved in subsequent implementation
* **Do NOT modify identity infrastructure in this gate:** No resolver changes in this governance-only gate, no `src/identity/` modifications

---

## 10. PROVENANCE — DEPOSITED RAW/DATASET LINEAGE PRESERVATION

Preserve for subsequent implementation:

```text
PRESERVE DEPOSITED RAW/DATASET LINEAGE
DO NOT STRIP SOURCE/PROVENANCE METADATA DURING TRANSFORMATION
```

* **D06 provenance to preserve:** sourceClassification `PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS`, provider `Parse.bot NSE India API — get_corporate_announcements`, source `NSE India`, sanitized request URL Parse.bot `https://api.parse.bot/scraper/.../get_corporate_announcements?page=1&page_size=20` without key, NSE direct underlying URLs `https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=...`, provider-native announcement ID seq_id `106795047` etc, governed EQ_* identity, sourcePublisher `GOVERNED_EXCHANGE_DISCLOSURE`, publication/dissemination time original an_dt+exchdisstime+sort_date verbatim + derived ISO-8601 UTC IST→UTC deterministic, acquisition/observation time `2026-09-27T18:45:00Z`, source URL attchmntFile PDF, byte count 4030, SHA-256 `ead9e0ac...`, quality GOOD, replayConstraintApplied true, transformation mapping explicit, category mapping deterministic, sentiment/relevance derived provenance `NOT_PROVIDER_SUPPLIED_DERIVED_*`, tags, fileSize, industry, isin, companyName, subject
* **D07 provenance to preserve:** sourceClassification `TIGZIG_YAHOO_FINANCE_ESTIMATES`, provider `TIGZIG Yahoo Finance`, request URL `https://yfin-h.tigzig.com/v1/get-estimates/?tickers=RELIANCE.NS,INFY.NS,TCS.NS,HDFCBANK.NS,AXISBANK.NS`, provider tickers, governed identities, metric EPS/REVENUE, provider period 0q/+1q/0y/+1y, observation timestamp `2026-09-27T18:18:58Z`, byte count 6110, SHA `9f76e6a...`, quality GOOD/PARTIAL (39 valid, 1 provider-null), replayConstraintApplied true, median policy ABSENT/NULL, null policy RETAIN_AS_SOURCE_OBSERVATION
* **Do NOT strip source/provenance metadata during transformation:** Subsequent UI implementation must preserve provenance via `IntelligenceDTO.provenance` and `ExecutiveProvenance` — verified UI04 already includes `provenance: params.intelligence.provenance`
* **Build-time wiring must be reproducible from recorded acquisition evidence:** Raw bytes + SHA + transformation mapping → governed observations → engines → DTO → view model

---

## 11. ENTITLEMENT — LIMITED PERSONAL/NON-COMMERCIAL/NO-REDISTRIBUTION BOUNDARY

Preserve for subsequent implementation:

```text
LIMITED PERSONAL-USE-ONLY
RESEARCH / EDUCATIONAL
NON-COMMERCIAL
NON-SUBLICENSEABLE
REVOCABLE
NO REDISTRIBUTION
GRAY AREA FOR UNOFFICIAL ROUTES
UNRESTRICTED COMMERCIAL ENTITLEMENT = NOT ESTABLISHED
FREE API ACCESS ≠ UNRESTRICTED DATA LICENSE
```

* **D06 entitlement:** LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES — per provider-designation act 129700B and commissioning act 60591B and M-3 act 48446B — NSE does NOT offer publicly documented developer API with open registration, market data distribution via licensed vendors per Parse.bot marketplace, BSE charges 9 lakh + GST, Apify $50/1000 records commercial — free tier unofficial wrapper gray area — for unrestricted commercial retention/transformation/redistribution, ENTITLEMENT BASIS = NOT ESTABLISHED — free API ≠ unrestricted license — no API key ≠ unrestricted retention — personal use ≠ permission to redistribute — public webpage ≠ unrestricted bulk extraction
* **D07 entitlement:** LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES — per D8-D06-D07 act 39275B — TIGZIG open no-auth REST https://yfin-h.tigzig.com/v1, Yahoo ToU non-exclusive non-sublicenseable revocable no sell/lease/share/transfer/sublicense/derive income, Yahoo ToS no reproduction/modification/rent/lease/sell/trade/distribute commercial — for unrestricted commercial, ENTITLEMENT BASIS = NOT ESTABLISHED
* **No commercial entitlement inference:** Subsequent UI implementation must NOT state or imply official NSE API authorization, NSE commercial license, unrestricted retention, unrestricted redistribution, commercial entitlement, sublicensing rights, official exchange data vendor agreement
* **Preserve in implementation:** Entitlement must be documented in implementation comments, no new licensing claims

---

## 12. ARENA LIMITATION — EXPLICIT PRESERVATION VERBATIM

**Required per authority decision and M-3 act:**

```text
ARENA_DIRECT_PARSEBOT_GET = ENVIRONMENT-BLOCKED
```

**Actual evidence:**

* Direct egress to `api.parse.bot:443` (Cloudflare 104.18.6.193) blocked in Arena sandbox: curl `SSL_ERROR_SYSCALL`, Node fetch `ECONNRESET`, openssl s_client `unexpected EOF` — documented in `0ac3f3c` commit message and `d06_prospective_nse_corporate_disclosure_observation_dataset.ts` header
* `fetch_page` proxy (different egress) succeeds: Parse.bot without key → `401 Missing X-API-Key header`, NSE direct → `200` with real JSON — proves connectivity via proxy
* Operator-held API key `pmx_c5aba7241731a7dee1e54a22804fe30f` provided, used only via external secret mechanism, NOT committed, NOT logged, only redacted `pmx_***` in comments — verified via `grep -R pmx_ src/ evidence/` only redacted
* Parse.bot is independent maintained REST wrapper over public NSE data per marketplace — underlying source is NSE public corporate-announcements feed backend behind nseindia.com Corporate Filings page — NSE direct returns identical fields — therefore NSE direct is authoritative underlying source, Parse.bot wrapper equivalent for regulatory disclosure intelligence — actual acquisition via NSE direct underlying source accepted as environment boundary per Ramki authority

**This authorization act explicitly preserves verbatim:**

```text
ARENA_DIRECT_PARSEBOT_GET = ENVIRONMENT-BLOCKED
```

* Do NOT reinterpret this as authenticated Parse.bot execution — subsequent implementation must preserve `actualAcquisitionMethod: NSE_DIRECT_VIA_FETCH_PAGE_PROXY_UNDERLYING_SOURCE_FOR_PARSE_BOT_WRAPPER` and `parseBotAttempt: DIRECT_EGRESS_BLOCKED_SSL_ERROR_SYSCALL_ECONNRESET_FETCH_PAGE_PROXY_401_WITHOUT_KEY` and must NOT claim Arena itself successfully executed authenticated Parse.bot request — underlying NSE-source qualification accepted per Ramki authority, not rewritten as authenticated Parse.bot success

---

## 13. SUBSEQUENT IMPLEMENTATION ACCEPTANCE CRITERIA

The next implementation gate (presentation-only, build-time wiring) must satisfy exact checks, otherwise fail closed:

### 13.1 Authoritative Checkout

* Branch = `arena/01a0ddae-iips-production-market-data`
* HEAD = post-authorization commit (to be established after this act durability)
* LOCAL == REMOTE = YES via `git rev-parse HEAD` == `git rev-parse origin/...` == `git ls-remote`
* Worktree = CLEAN via `git status --porcelain` empty

### 13.2 Exact Intended Files for Subsequent Implementation

**Files authorized for creation/modification in next implementation gate:**

* `src/intelligence/d06_d07_build_time_wiring.ts` OR `src/intelligence/intelligence_build_time_bundle.ts` OR similar — new file that imports `D06_PROSPECTIVE_NSE_OBSERVATIONS` (5 obs) and `D07_PROSPECTIVE_ESTIMATES_VALID_PAYLOADS` (39 valid) and wires into `NewsEngine` and `EstimatesEngine` via build-time TS import (D05 pattern), producing `FilteredNewsResult` and `AggregatedConsensusResult` for `IntelligenceDTO`
* `src/ui/view_models/ui04_domain_intelligence.ts` — may be inspected but NOT modified in authorization gate; in implementation gate, may be extended to consume build-time bundle if needed, but must preserve existing `newsSignals` mapping with `isOfficialExchange` check and `estimatesConsensus` mapping
* `src/transports/intelligence_dto.ts` — may be inspected, not modified unless independently necessary and explicitly governed
* Any new UI component that consumes `IntelligenceDTO` → `UI04DomainIntelligenceBuilder.build()` — presentation-only

**Exact files forbidden from mutation in next implementation gate (unless independently necessary and explicitly governed):**

* `src/contracts/d06_news.ts` — FORBIDDEN — SHA `9aa401d7bf874ae633c20780f2dde7fc45db76f21344c253d79b86354e1d567d` must remain unchanged
* `src/intelligence/news_engine.ts` — FORBIDDEN — SHA `6f624e8be3b6307cbb282a844888563f0c3e4a932c6d20389b12e312173f1af4` must remain unchanged
* `src/contracts/d07_estimates.ts` — FORBIDDEN — SHA `7112f8ac6eaacfbf022c9fd93df3be220e16c4204069bd2217aa3a1b2921d462` must remain unchanged
* `src/intelligence/estimates_engine.ts` — FORBIDDEN — SHA `c3531b53d110982afb27707768d17cedb72dae4404a2ed441424b5164d1ed409` must remain unchanged
* `src/contracts/types.ts` — FORBIDDEN unless new classification genuinely necessary — currently already contains `PARSE_BOT_NSE_CORPORATE_ANNOUNCEMENTS` + `TIGZIG_YAHOO_FINANCE_ESTIMATES` — SHA `048791fe59f6a4fbb2349e0499e492b52f07b68fb114edb2e69801ccc8ae5a72` must remain unchanged unless independently necessary
* `src/identity/` — FORBIDDEN — governed fixture master frozen
* `src/d114/`, `frontend/src/features/portfolio/` — FROZEN per BI-07/08 authority
* No provider acquisition files, no API keys, no credentials

### 13.3 No Contract/Engine Mutation

* D06 contract `src/contracts/d06_news.ts` SHA `9aa401d7...` must remain unchanged — verified via `sha256sum` and `git show HEAD:...`
* D06 engine `src/intelligence/news_engine.ts` SHA `6f624e8b...` must remain unchanged
* D07 contract `src/contracts/d07_estimates.ts` SHA `7112f8ac...` must remain unchanged
* D07 engine `src/intelligence/estimates_engine.ts` SHA `c3531b53...` must remain unchanged
* If any appears necessary, STOP — fail closed rather than silently expanding

### 13.4 Build-Time Only

* Deposited D06/D07 artifacts only — raw 4030B SHA `ead9e0ac...` + dataset 27380B SHA `d99248b8...` + raw 6110B SHA `9f76e6a...` + dataset 53618B SHA `eda08b8b...`
* No external acquisition during UI execution — no `fetch`, no `axios`, no `https`, no `X-API-Key`, no `fetch_page`, no `curl`, no `node-fetch`
* No runtime provider sockets — external live sockets 0
* No credentials — no API keys, tokens, secrets — only sanitized URLs without keys
* `LIVE_PROVIDER_EXECUTION_AT_RUNTIME = NOT AUTHORIZED` — must be preserved verbatim in implementation comments
* D05 pattern: `export const ... ReadonlyArray` build-time import, frozen via `Object.freeze` in engines

### 13.5 No Network Calls

* No browser fetch to Parse.bot
* No browser fetch to NSE
* No runtime API call to Yahoo Finance/TIGZIG
* No OIDC provider call
* No dynamic external dependency at runtime
* No production ingestion loop
* Verification via `grep -R "fetch\|axios\|https\|X-API-Key\|api.parse.bot\|nseindia.com\|yfin-h.tigzig.com" src/intelligence/d06_d07_build_time_wiring.ts` should show only sanitized URLs in comments, no live calls

### 13.6 Deterministic Dataset Consumption

* D06: `D06_PROSPECTIVE_NSE_OBSERVATIONS` 5 obs → `NewsEngine.ingestNews()` each observation → `queryNews({ companyId: EQ_*, asOf: observationTimestamp })` → `FilteredNewsResult` with `newsItems` 1 per entity when asOf >= publishedAt, totalAvailable, filteredCount, dominantSentiment, averageSentimentScore, qualityState
* D07: `D07_PROSPECTIVE_ESTIMATES_VALID_PAYLOADS` 39 valid → transform to `IndividualAnalystEstimate` with governed anonymous analyst codes (if needed) → `EstimatesEngine.submitEstimate()` → `computeConsensus({ companyId, metric, targetPeriod, asOf })` → `AggregatedConsensusResult` with mean, analystCount, isConsensusValid, qualityState
* Deterministic, explicit, one-to-one, no ambiguous, no fuzzy matching, fail closed if unmapped
* Must preserve `D06_PROSPECTIVE_NSE_PROVENANCE` and `D07_PROSPECTIVE_ESTIMATES_PROVENANCE` with byte counts, SHAs, timestamps, request URLs

### 13.7 D06/D07 Observation Counts

* D06: 5 observations, 5 valid, 0 provider-null, 0 invalid, 5 entities — must be preserved in implementation
* D07: 40 total, 39 valid, 1 provider-null (HDFCBANK +1q), 0 invalid, 5 entities, earnings 20, revenue 20 — valid payloads 39 must be preserved, provider-null retained separately with quality PROVIDER_NULL not numeric not dropped not zero

### 13.8 EQ_* Identity Preservation

* D06: RELIANCE→EQ_RELIANCE_IN, INFY→EQ_INFY_IN, TCS→EQ_TCS_IN, HDFCBANK→EQ_HDFCBANK_IN, AXISBANK→EQ_AXISBANK_IN — NSE symbol without .NS suffix
* D07: RELIANCE.NS→EQ_RELIANCE_IN, INFY.NS→EQ_INFY_IN, TCS.NS→EQ_TCS_IN, HDFCBANK.NS→EQ_HDFCBANK_IN, AXISBANK.NS→EQ_AXISBANK_IN — Yahoo Finance symbol with .NS suffix
* Both map to same EQ_* via governed resolver — must be preserved, no ticker strings substituted for companyId, provider-native ticker remains source identifier only

### 13.9 PIT Filtering

* Preserve `publishedAt <= asOf` behavior in NewsEngine — verified `pubMs > asOfMs return false`
* Preserve `submittedAt <= asOf` + 90-day staleness + N>=3 threshold in EstimatesEngine — verified
* Never introduce historical PIT claims beyond established provenance — D06 PUBLICATION_TIME MAY BE ESTABLISHED via an_dt+exchdisstime, OBSERVATION_TIME ESTABLISHED, HISTORICAL_PIT NOT ESTABLISHED — D07 PUBLICATION_TIME NOT ESTABLISHED, OBSERVATION_TIME ESTABLISHED, HISTORICAL_PIT NOT ESTABLISHED

### 13.10 Official Disclosure Precedence

* Preserve `GOVERNED_EXCHANGE_DISCLOSURE` — NewsEngine sort official first, then latest publishedAt, UI04 `isOfficialExchange` check `sourcePublisher === 'GOVERNED_EXCHANGE_DISCLOSURE'`
* D06 dataset all 5 have `sourcePublisher: GOVERNED_EXCHANGE_DISCLOSURE` — must be preserved

### 13.11 Provenance Preservation

* Preserve deposited raw/dataset lineage: byte counts, SHAs, timestamps, request URLs without keys, provider tickers, governed identities, headline, summary, publishedAt, category, sourcePublisher, tags, source URL, quality, replayConstraintApplied, transformation mapping, category mapping, sentiment/relevance derived provenance, industry, isin, companyName, subject, fileSize
* Do NOT strip source/provenance metadata during transformation — UI04 already includes `provenance: params.intelligence.provenance`
* Build-time wiring must be reproducible from recorded acquisition evidence

### 13.12 Relevant Tests/Typecheck

* `tsc --noEmit` must PASS — no type errors introduced
* Relevant tests: `npm run build:tsc` must PASS if applicable, or `node --test` for intelligence tests if present
* No existing tests broken by new wiring

### 13.13 Exact Diff

* Inspect exact diff via `git diff --stat` and `git diff --name-only`
* Verify only intended files for implementation gate were added/modified — e.g., `src/intelligence/d06_d07_build_time_wiring.ts` new, maybe `src/intelligence/index.ts` updated to export new wiring — minimal exact change, no unrelated refactoring

### 13.14 Commit/Push/Remote Parity/Clean Worktree

* Commit with message including pre-gate HEAD, post-gate commit, artifact hashes, byte counts, entitlement, Arena limitation, build-time boundary
* Push explicitly to `origin/arena/01a0ddae-iips-production-market-data`
* Fetch remote via `git fetch origin arena/01a0ddae-iips-production-market-data:refs/remotes/origin/... --force`
* Verify `git rev-parse HEAD` == `git rev-parse origin/...` == `git ls-remote origin ...`
* Verify `LOCAL == REMOTE = YES`
* Verify worktree CLEAN via `git status --porcelain` empty
* Re-read committed files and recalculate SHA-256 to verify matches recorded hashes

---

## 14. WHAT THIS AUTHORIZATION ACT DOES NOT AUTHORIZE OR GRANT

This authorization act explicitly does NOT grant or authorize:

* **Implementation** — modification of D06/D07 contracts/engines, creation of build-time wiring, UI components, view models, DTOs — this act is governance-only authorization, implementation to be performed in subsequent separate governed gate
* **UI files modification** — no `src/ui/` files modified by this act
* **Wiring implementation** — no `src/intelligence/d06_d07_build_time_wiring.ts` created by this act
* **Provider acquisition** — no Parse.bot GET, no NSE GET, no Yahoo Finance/TIGZIG GET, no fetch_page, no curl
* **Runtime network access** — no browser fetch, no runtime API call, no OIDC provider call, no dynamic external dependency, no production ingestion, no external live sockets
* **API keys or credentials** — no X-API-Key, no secrets, no tokens — only sanitized URLs without keys
* **D115 activation** — D115 remains WITHHELD / UNRESOLVED / NOT AUTHORIZED, runtimeCompanyId UNRESOLVED
* **Production activation** — PRODUCTION remains NOT AUTHORIZED, productionEligible false, no live provider execution at runtime
* **D08 activation** — D08 remains DEFERRED, macro LIVE-only per D91, D91/D88 relief NOT GRANTED, macro acquisition NOT AUTHORIZED
* **D09 provider designation** — D09 remains CONDITIONAL / FEASIBILITY-GATED, no provider designated merely to satisfy condition, no approvalRef fabricated
* **Commercial licensing** — UNRESTRICTED COMMERCIAL ENTITLEMENT = NOT ESTABLISHED, no official NSE API authorization, no NSE commercial license, no unrestricted retention/redistribution/commercial entitlement/sublicensing rights
* **Unrestricted redistribution** — NO REDISTRIBUTION, NON-SUBLICENSEABLE, REVOCABLE, GRAY AREA FOR UNOFFICIAL ROUTES
* **Historical PIT** — HISTORICAL_PIT NOT ESTABLISHED, no claim of historical publication-time archive, no historical backfill
* **D06/D07 governance status change** — D06 remains CLOSED, D07 remains CLOSED — no status change by this act
* **Certification beyond authorization** — NOT GRANTED, this is implementation authorization only, not production certification, not M-4, not M-5

---

## 15. FINAL STATE AFTER THIS AUTHORIZATION ACT

```text
D06 = CLOSED — provider designated at 8076b58, M-1 commissioned at 275922f, M-1 deposited at 0ac3f3c 5 obs 5 valid 0 null 5 entities 4030B raw SHA ead9e0ac..., M-3 established at dde0ee7 48446B SHA be04b2f1...
D07 = CLOSED — provider designated at e14b3b4, M-1 commissioned at b0faa13, M-1 deposited at 62330df 40 obs 39 valid 1 null 5 entities 6110B raw SHA 9f76e6a..., M-3 established at 9f608d9
D06/D07 UI Integration = AUTHORIZED BY THIS ACT for subsequent presentation-only build-time implementation gate — NOT IMPLEMENTED YET
D08 = DEFERRED — macro LIVE-only, D91/D88 relief NOT GRANTED
D09 = CONDITIONAL / FEASIBILITY-GATED — may enter only if valid governed source, entitlement, provenance, approvalRef can be established
D115 = WITHHELD / UNRESOLVED / NOT AUTHORIZED — runtimeCompanyId UNRESOLVED
D91/D88 = NOT GRANTED — LIVE-only macro, no relief
PRODUCTION = NOT AUTHORIZED — productionEligible false, no live provider execution at runtime
ENTITLEMENT_D06 = LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES — commercial/redistribution NOT ESTABLISHED
ENTITLEMENT_D07 = LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION / GRAY AREA FOR UNOFFICIAL ROUTES — commercial/redistribution NOT ESTABLISHED
ARENA_DIRECT_PARSEBOT_GET = ENVIRONMENT-BLOCKED — direct egress to api.parse.bot blocked SSL_ERROR_SYSCALL ECONNRESET OpenSSL unexpected EOF, fetch_page proxy 401 without X-API-Key proves connectivity, NSE direct underlying 200 via fetch_page proxy — accepted environment boundary per Ramki authority, not unresolved blocker for M-1, underlying NSE-source qualification accepted, not rewritten as authenticated Parse.bot success — preserved verbatim
BUILD_TIME_DATASET_D06 = DEPOSITED 4030B SHA ead9e0ac... dataset 27380B SHA d99248b8... — 5 obs
BUILD_TIME_DATASET_D07 = DEPOSITED 6110B SHA 9f76e6a... dataset 53618B SHA eda08b8b... — 39 valid
LIVE_PROVIDER_EXECUTION_AT_RUNTIME = NOT AUTHORIZED
API_KEY_BOUNDARY = EXTERNAL OPERATOR SECRET NEVER COMMITTED NEVER LOGGED
```

---

## 16. AUTHORITY & SIGNATURE

**Authority:** RAMKI — Implementation Authorizing Authority per M-2 act `gate-y-m2-intelligence-data-authorization-2026-09-27-001` at `7db93a6` and per D06/D07 M-3 acts

**Antecedent Acts Verified:**

* `gate-y-intel-data-supply-designation-selection-2026-09-27-001` at `95f36cf` — GATE-Y SELECTED
* `gate-y-m2-intelligence-data-authorization-2026-09-27-001` at `7db93a6` — M-2 ESTABLISHED — governance/data-supply authority only, IMPLEMENTATION_AUTHORITY NOT GRANTED by M-2
* `d8-intelligence-domain-scope-determination-2026-09-27-001` at `a2eee10` — D8 scope D06=REQUIRED/IN SCOPE D07=REQUIRED/IN SCOPE D08=DEFERRED D09=CONDITIONAL — 20668B SHA `6d4c27ea...`
* `d8-d06-d07-source-provider-designation-2026-09-27-001` at `e14b3b4` — D07 provider TIGZIG Yahoo Finance SELECTED — 39275B SHA `2519cbe4...`
* `d07-m1-prospective-estimates-observation-commissioning-2026-09-27-001` at `b0faa13` — D07 M-1 COMMISSIONED — 45681B SHA `9c0f2975...`
* `62330df` — D07 M-1 DEPLOYED/DEPOSITED — 40 obs 39 valid 1 null 5 entities 6110B raw SHA `9f76e6a...` dataset 53618B SHA `eda08b8b...` observation `2026-09-27T18:18:58Z`
* `d07-m3-prospective-estimates-provenance-acceptance-2026-09-27-001` at `9f608d9` — D07 M-3 ESTABLISHED — 28969B SHA `7c6cffb8...` — D07 CLOSED
* `d8-d06-news-source-provider-designation-2026-09-27-001` at `8076b58` — D06 provider Parse.bot NSE SELECTED — 129700B SHA `4fda6bfd...`
* `d06-m1-prospective-nse-corporate-disclosure-commissioning-2026-09-27-001` at `275922f` — D06 M-1 COMMISSIONED — 60591B SHA `1afd882...`
* `0ac3f3c` — D06 M-1 DEPLOYED/DEPOSITED — 5 obs 5 valid 0 null 5 entities 4030B raw SHA `ead9e0ac...` dataset 27380B SHA `d99248b8...` types 1320B SHA `048791fe...` observation `2026-09-27T18:45:00Z` — M-1 ACCEPTANCE PASS despite `ARENA_DIRECT_PARSEBOT_GET = ENVIRONMENT-BLOCKED`
* `d06-m3-prospective-nse-corporate-disclosure-provenance-acceptance-2026-09-27-001` at `dde0ee7` — D06 M-3 ESTABLISHED — 48446B SHA `be04b2f1...` — D06 CLOSED, `ARENA_DIRECT_PARSEBOT_GET = ENVIRONMENT-BLOCKED` preserved verbatim and accepted

**Recording Agent:** Arena — recording only, no implementation, no UI wiring

**Act ID:** `d06-d07-ui-integration-authorization-2026-09-27-001`

**Recorded At:** 2026-09-27 Asia/Calcutta

**Branch:** `arena/01a0ddae-iips-production-market-data`

**Pre-gate HEAD:** `dde0ee73e6a0954f8c1c3c761ed8971c1f0a0cbf`

**Post-gate Commit:** To be established after durability verification — see §17

**Remote SHA:** To be verified after push — see §17

**LOCAL == REMOTE:** To be verified after push — see §17

**Worktree:** To be verified CLEAN after commit — see §17

---

## 17. DURABILITY BOUNDARY (to be completed after file creation, before final report)

If and only if authorization act is internally consistent and all preconditions pass:

1. Inspect exact diff — only intended governance act added
2. Verify only intended file mutated — `evidence/intelligence-data-supply-governance/D06-D07-UI-INTEGRATION-AUTHORIZATION-ACT.md` new
3. Compute byte count — `wc -c` actual
4. Compute SHA-256 — `sha256sum` actual
5. Commit — `git add` + `git commit` with message `GATE-Y D06/D07: authorize UI integration — governance-only build-time wiring preparation`
6. Push explicitly to authoritative remote — `git push origin arena/01a0ddae-iips-production-market-data`
7. Fetch remote — `git fetch origin arena/01a0ddae-iips-production-market-data:refs/remotes/origin/... --force`
8. Verify remote SHA equals new commit — `git rev-parse HEAD` == `git rev-parse origin/...` == `git ls-remote`
9. Verify LOCAL == REMOTE — YES
10. Verify worktree CLEAN — `git status --porcelain` empty
11. Re-read final act from authoritative checkout — `cat` + `sha256sum` recalc
12. Recalculate SHA-256 and verify matches recorded hash

Every command must fail closed.

No PASS after failed invariant.

If any requirement cannot be established from authoritative evidence, STOP rather than inventing it.

---

## 18. FINAL REPORT BOUNDARY

Report only verified facts after durability:

### Authoritative state

* branch
* pre-gate HEAD
* post-gate commit
* remote SHA
* LOCAL == REMOTE
* worktree

### Provider/antecedent evidence

* D06 provider, M-1, M-3 commits and artifact hashes
* D07 provider, M-1, M-3 commits and artifact hashes

### Authorization scope

* exact authorization scope — presentation-only build-time consumption of D06 5 obs + D07 39 valid payloads via NewsEngine/EstimatesEngine → IntelligenceDTO → UI04DomainIntelligenceBuilder

### Exact files identified for subsequent implementation

* authorized for creation/modification: `src/intelligence/d06_d07_build_time_wiring.ts` or similar bundle, maybe `src/intelligence/index.ts` export update
* forbidden: `src/contracts/d06_news.ts` SHA `9aa401d7...`, `src/intelligence/news_engine.ts` SHA `6f624e8b...`, `src/contracts/d07_estimates.ts` SHA `7112f8ac...`, `src/intelligence/estimates_engine.ts` SHA `c3531b53...`, `src/contracts/types.ts` SHA `048791fe...` unless genuinely necessary, `src/identity/`, `src/d114/`, `frontend/src/features/portfolio/` frozen, no provider acquisition, no API keys

### Build-time/runtime boundary

* deposited artifacts only, no external acquisition during UI execution, no runtime sockets, no credentials, LIVE_PROVIDER_EXECUTION_AT_RUNTIME = NOT AUTHORIZED

### PIT and provenance requirements

* PIT `publishedAt <= asOf`, `submittedAt <= asOf` + 90-day + N>=3, official disclosure precedence `GOVERNED_EXCHANGE_DISCLOSURE`, EQ_* identity preservation, provenance preservation raw/dataset lineage

### Entitlement boundary

* LIMITED PERSONAL-USE-ONLY etc, commercial/redistribution NOT ESTABLISHED, FREE API ≠ UNRESTRICTED LICENSE

### Arena limitation

* `ARENA_DIRECT_PARSEBOT_GET = ENVIRONMENT-BLOCKED` preserved verbatim, not reinterpreted as authenticated Parse.bot execution

### Subsequent implementation acceptance criteria

* As defined in §13 — authoritative checkout, exact intended files, no contract/engine mutation, build-time only, no network calls, deterministic consumption, observation counts, EQ_* preservation, PIT filtering, official disclosure precedence, provenance preservation, tsc --noEmit PASS, exact diff, commit/push/remote parity, clean worktree

### Governance act

* path `evidence/intelligence-data-supply-governance/D06-D07-UI-INTEGRATION-AUTHORIZATION-ACT.md`
* byte count
* SHA-256
* post-gate commit
* remote SHA
* LOCAL == REMOTE
* worktree status

Then STOP.

Do not implement UI integration.

Do not proceed to implementation gate automatically.

---

**End of Authority Act. D06/D07 UI Integration AUTHORIZED — Governance-Only Build-Time Wiring Preparation — for subsequent presentation-only implementation gate consuming already-deposited D06 5 obs 5 valid 4030B raw SHA ead9e0ac... dataset 27380B SHA d99248b8... + D07 39 valid 6110B raw SHA 9f76e6a... dataset 53618B SHA eda08b8... via NewsEngine queryNews publishedAt<=asOf GOVERNED_EXCHANGE_DISCLOSURE precedence + EstimatesEngine computeConsensus PIT N>=3 → IntelligenceDTO → UI04DomainIntelligenceBuilder.build() with isOfficialExchange check, deterministic EQ_* identity, provenance preservation, build-time/static dataset only, LIVE_PROVIDER_EXECUTION_AT_RUNTIME NOT AUTHORIZED, no credentials, no network, no contract/engine mutation, entitlement LIMITED PERSONAL-USE-ONLY etc, ARENA_DIRECT_PARSEBOT_GET = ENVIRONMENT-BLOCKED preserved verbatim, D06 CLOSED D07 CLOSED D08 DEFERRED D09 CONDITIONAL D115 WITHHELD D91/D88 NOT GRANTED PRODUCTION NOT AUTHORIZED. Next gate: D06/D07 UI Integration Implementation (presentation-only, build-time wiring).**
