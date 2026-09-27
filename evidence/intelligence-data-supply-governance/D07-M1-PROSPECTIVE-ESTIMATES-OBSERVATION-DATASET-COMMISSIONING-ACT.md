# Institutional Investment Platform System (IIPS)
# D07 M-1 — Prospective Estimates Observation Dataset Commissioning Act (Governance-Only)

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `d07-m1-prospective-estimates-observation-commissioning-2026-09-27-001`
**Governing Authority:** RAMKI (M-1 Commissioning Authority / Authorizing Authority)
**Recording Agent:** Arena (recording only — no implementation performed or authorized by this act beyond governance record)
**Act Type:** AUTHORITY M-1 DATASET COMMISSIONING (governance-only; NO M-3 ESTABLISHMENT, NO IMPLEMENTATION, NO PRODUCTION, NO CERTIFICATION BEYOND M-1 COMMISSIONING)
**Recorded At (local, Asia/Calcutta):** 2026-09-27
**Antecedent Checkpoint:** `e14b3b42de74e95af7e83fa36888b97bd2a2b31b`
**Parent Checkpoint:** `a2eee1074bcac7a636d9c96868aa5ae7f7817603`
**Governed Branch:** `arena/01a0ddae-iips-production-market-data`
**Gate Context:** `GATE-Y (Intelligence Data-Supply)` — SELECTED/OPENED by `gate-y-intel-data-supply-designation-selection-2026-09-27-001` at `95f36cf`; M-2 ESTABLISHED by `gate-y-m2-intelligence-data-authorization-2026-09-27-001` at `7db93a6`; D8 Domain Scope ESTABLISHED by `d8-intelligence-domain-scope-determination-2026-09-27-001` at `a2eee10` — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL/FEASIBILITY-GATED; Provider Designation ESTABLISHED by `d8-d06-d07-source-provider-designation-2026-09-27-001` at `e14b3b4` — TIGZIG Yahoo Finance estimates route SELECTED for PROSPECTIVE D07 ACQUISITION ONLY; Free-provider forensic COMPLETE; Real INFY.NS proof-of-acquisition PASS; Five-entity prospective acquisition consistency PASS (`MULTI_ENTITY_PROSPECTIVE_ACQUISITION = PASS`)

---

## 1. VERIFIED ANTECEDENT STATE (inspected before recording, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative repository | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole remote) |
| Authoritative governed branch | `refs/heads/arena/01a0ddae-iips-production-market-data` @ `e14b3b42de74e95af7e83fa36888b97bd2a2b31b` — LOCAL == REMOTE before mutation |
| Local HEAD at recording | `e14b3b42de74e95af7e83fa36888b97bd2a2b31b` |
| Parent | `a2eee1074bcac7a636d9c96868aa5ae7f7817603` |
| Worktree | CLEAN (0 entries) — `git status --porcelain` empty |
| GATE-Y designation act | PRESENT — `GATE-Y-INTELLIGENCE-DATA-SUPPLY-DESIGNATION-AND-GATE-SELECTION-ACT.md` blob `aa7746096f24c367322d10a6dcd216ea30fb5815` |
| M-2 authorization act | PRESENT — `GATE-Y-M2-INTELLIGENCE-DATA-AUTHORIZATION-ACT.md` blob `bd3be4024d8910f62860ec46cc267d646c0bc454` |
| D8 scope determination act | PRESENT — `D8-INTELLIGENCE-DOMAIN-SCOPE-DETERMINATION-ACT.md` blob `a2b4179fb323531b675ffe029415d8b3bdd3080b` — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL/FEASIBILITY-GATED |
| D07 source/provider designation act | PRESENT — `D8-D06-D07-SOURCE-PROVIDER-DESIGNATION-ACT.md` blob `2519cbe436f34b2c42e4cbdec0d9acc755dd5a4fa13d28d0b47e0aaed024bd98` — TIGZIG Yahoo Finance / Yahoo Finance estimates route SELECTED for PROSPECTIVE D07 ACQUISITION ONLY, Business Quant NOT selected, entitlement LIMITED PERSONAL-USE-ONLY |
| D07 contract | PRESENT — `src/contracts/d07_estimates.ts` — `AnalystEstimatePayload { companyId, metric, targetPeriod, consensusMean, consensusMedian?, highEstimate, lowEstimate, analystCount, currency, asOfDate }` — authoritative, unchanged |
| D07 engine | PRESENT — `src/intelligence/estimates_engine.ts` — `IndividualAnalystEstimate { estimateId, companyId, analystId, metric, targetPeriod, estimatedValue, submittedAt, currency }` + `AggregatedConsensusResult` with PIT rule `submittedAt <= asOf`, N>=3, 90-day staleness |
| Governed identity master | PRESENT — `src/identity/governed_fixture_master.ts` — `GOVERNED_OFFLINE_REFERENCE_ENTITIES` 5 entities with NSE listings: RELIANCE, INFY, TCS, HDFCBANK, AXISBANK → `EQ_RELIANCE_IN`, `EQ_INFY_IN`, `EQ_TCS_IN`, `EQ_HDFCBANK_IN`, `EQ_AXISBANK_IN` |
| Free-provider forensic | COMPLETE |
| Provider selection/designation | COMPLETE — TIGZIG Yahoo Finance estimates route |
| Real INFY.NS proof-of-acquisition | PASS — live GET `https://yfin-h.tigzig.com/v1/get-estimates/?tickers=INFY.NS` → 200, 1220 bytes, SHA-256 `132573629992bae256b3698f81fc2c23400e9bd47c4414b942d445d09383fb48`, acquiredAt `2026-09-27T17:55:35Z`, earnings 4 revenue 4 valid |
| Five-entity prospective acquisition consistency | PASS — `MULTI_ENTITY_PROSPECTIVE_ACQUISITION = PASS` — ONE real GET `https://yfin-h.tigzig.com/v1/get-estimates/?tickers=RELIANCE.NS,INFY.NS,TCS.NS,HDFCBANK.NS,AXISBANK.NS` → 200, 6111 bytes, SHA-256 `2b2813a3b43c6774d5a6b5288f911659e7c2f8b9a4b7137a357d269d6676c943`, acquiredAt `2026-09-27T18:02:58Z`, selected 5 returned 5 missing 0, earnings 20 revenue 20 total 40 valid 39 invalid 0 null 1 (HDFCBANK.NS earnings +1q nulls) |
| M-1 | NOT COMMISSIONED before this act — 0/0 commissioned/accepted |
| M-3 | NOT ESTABLISHED before this act |
| M-1 prospective dataset commissioning act | ABSENT — `D07-M1-PROSPECTIVE-ESTIMATES-OBSERVATION-DATASET-COMMISSIONING-ACT.md` does NOT exist in HEAD or any prior commit (verified via `git ls-tree -r HEAD` and `git log --all --full-history`) |
| Implementation | NONE — no M-1 dataset, no adapter, no contract change, no engine change, no UI/runtime change |

---

## 2. COMPLETED QUALIFICATION GATES — EVIDENCE PRESERVED

### 2.1 Single-entity INFY.NS proof-of-acquisition (PASS)

- **Request:** `GET https://yfin-h.tigzig.com/v1/get-estimates/?tickers=INFY.NS`
- **AcquiredAt:** `2026-09-27T17:55:35Z` (UTC observation time, NOT provider publication time)
- **HTTP Status:** `200`
- **Response Bytes:** `1220`
- **SHA-256:** `132573629992bae256b3698f81fc2c23400e9bd47c4414b942d445d09383fb48`
- **Raw retained:** `/tmp/response_body.json` outside repo (byte-for-byte)
- **Payload:** `INFY.NS` present YES, earnings YES (4 rows: 0q/+1q/0y/+1y), revenue YES (4 rows), fields per row `period`, `avg`, `low`, `high`, `numberOfAnalysts`, `currency`, `growth`, `yearAgoEps|yearAgoRevenue`, median NO, publicationTime NO, effectiveTime NO, revisionSeq NO, sourceAsOf NO
- **Validation:** numeric PASS, low<=avg<=high PASS, analystCount>=0 PASS, currency INR PASS
- **Identity:** `INFY.NS` → `EQ_INFY_IN` via governed resolver, not `INFY` stored as companyId
- **D07 mapping:** `avg→consensusMean`, `low→lowEstimate`, `high→highEstimate`, `numberOfAnalysts→analystCount`, `currency→currency`, `period→targetPeriod`, governed resolver→`companyId`, `earnings→EPS`, `revenue→REVENUE`, `consensusMedian` absent/null, `asOfDate` QUALIFICATION-INCOMPLETE (SOURCE_AS_OF NOT PROVIDED)
- **PIT:** PUBLICATION_TIME NOT ESTABLISHED, EFFECTIVE_TIME NOT ESTABLISHED, REVISION_SEQ NOT ESTABLISHED, HISTORICAL_PIT NOT ESTABLISHED, PROSPECTIVE_OBSERVATION QUALIFIED
- **Provenance:** sourceClassification `TIGZIG_YAHOO_FINANCE_ESTIMATES`, provider `TIGZIG Yahoo Finance`, request exact URL, acquiredAt, byteCount 1220, lineageDigest SHA-256, dataVersion NOT PROVIDED, sourceAsOf NOT PROVIDED, observationDate, quality GOOD

### 2.2 Five-entity prospective acquisition consistency (PASS)

- **Selected entities (5) — authoritative IIPS identity mappings from `governed_fixture_master.ts` / `d05_broad_universe_data.ts`, deterministic NSE symbol + `.NS`, explicitly supported, no provider-native stored as companyId, not inferred from name, one MUST be INFY.NS→EQ_INFY_IN:**
  - `RELIANCE.NS` → `EQ_RELIANCE_IN` (NSE RELIANCE)
  - `INFY.NS` → `EQ_INFY_IN` (NSE INFY — required)
  - `TCS.NS` → `EQ_TCS_IN` (NSE TCS)
  - `HDFCBANK.NS` → `EQ_HDFCBANK_IN` (NSE HDFCBANK)
  - `AXISBANK.NS` → `EQ_AXISBANK_IN` (NSE AXISBANK)

- **Live request (ONE real TIGZIG request covering five Yahoo tickers):**
  - **Exact Request URL:** `https://yfin-h.tigzig.com/v1/get-estimates/?tickers=RELIANCE.NS,INFY.NS,TCS.NS,HDFCBANK.NS,AXISBANK.NS`
  - **AcquiredAt (UTC observation timestamp):** `2026-09-27T18:02:58Z`
  - **HTTP Status:** `200`
  - **Response Byte Count:** `6111`
  - **SHA-256 (lineageDigest):** `2b2813a3b43c6774d5a6b5288f911659e7c2f8b9a4b7137a357d269d6676c943`
  - **Raw retained:** `/tmp/multi_response_body.json` outside repo, byte-for-byte, exact raw response
  - **Request retained:** exact URL, timestamp, status, byteCount, SHA-256

- **Payload validation (every returned entity, earnings/revenue, every estimate row, actual fields only):**
  - Selected: 5, Returned: 5, Missing: 0
  - Earnings rows: 20, Revenue rows: 20, Total: 40, Valid: 39, Invalid: 0, Null: 1
  - Null row: `HDFCBANK.NS` earnings `+1q` `avg=null low=null high=null numberOfAnalysts=null currency=INR` — provider returns null when no data, not invalid numeric
  - Numeric valid: PASS for all 39 valid rows
  - low<=avg<=high: PASS for all 39 valid rows
  - analystCount>=0: PASS
  - currency INR: PASS
  - Fields actually present: `period`, `avg`, `low`, `high`, `numberOfAnalysts`, `currency`, `growth`, `yearAgoEps|yearAgoRevenue`
  - Fields NOT present: `median` NO, `publicationTime` NO, `effectiveTime` NO, `revisionSeq` NO, `sourceAsOf` NO
  - Do NOT require median, do NOT manufacture median

- **Identity validation:**
  - Provider ticker → authoritative governed resolver → `EQ_*` canonical: PASS
  - Every ticker maps exactly once: PASS (5 unique EQ identities)
  - No provider-native stored as governed companyId: PASS
  - No ambiguous, no inferred from name: PASS
  - Deterministic: NSE symbol + `.NS` derivation explicitly supported

- **D07 contract mapping (ONLY current authoritative contract `src/contracts/d07_estimates.ts`):**
  - `companyId` = governed resolver `EQ_*` (never provider ticker)
  - `metric` = `earnings→EPS` where semantics support, `revenue→REVENUE`
  - `targetPeriod` = provider `period`
  - `consensusMean` = `avg`
  - `consensusMedian` = ABSENT/NULL (provider does not supply)
  - `highEstimate` = `high`
  - `lowEstimate` = `low`
  - `analystCount` = `numberOfAnalysts`
  - `currency` = `currency`
  - `asOfDate` = QUALIFICATION-INCOMPLETE where contract requires, because SOURCE_AS_OF NOT PROVIDED
  - Do NOT invent mappings, do NOT calculate median, do NOT store provider-native as companyId

- **Consistency:**
  - All 5 returned, no collision, all valid rows pass invariants, all mappings deterministic, no unsupported fields invented, no silent drop of failures
  - If fails THROW STOP — not applicable, PASS

- **Provenance (qualification):**
  - sourceClassification: `TIGZIG_YAHOO_FINANCE_ESTIMATES`
  - provider: `TIGZIG Yahoo Finance`
  - request exact URL: `https://yfin-h.tigzig.com/v1/get-estimates/?tickers=RELIANCE.NS,INFY.NS,TCS.NS,HDFCBANK.NS,AXISBANK.NS`
  - acquiredAt: `2026-09-27T18:02:58Z`
  - responseByteCount: `6111`
  - lineageDigest SHA-256: `2b2813a3b43c6774d5a6b5288f911659e7c2f8b9a4b7137a357d269d6676c943`
  - dataVersion: NOT PROVIDED (provider does not supply)
  - sourceAsOf: NOT PROVIDED
  - observationDate: `2026-09-27T18:02:58Z`
  - quality: GOOD (39 valid, 0 invalid, 1 explicit provider-null)

---

## 3. M-1 DATASET COMMISSIONING RECORDED (authority statement, verbatim, RAMKI)

> I, RAMKI, as M-1 Commissioning Authority and Authorizing Authority, commission M-1 specifically for D07 PROSPECTIVE ESTIMATES OBSERVATION DATA under the already-selected GATE-Y, already-established M-2, already-determined D8 scope, and already-designated TIGZIG/Yahoo Finance prospective acquisition route.
>
> I commission M-1 as:
>
> A governed, prospective, single-user, non-commercial, non-deployed D07 estimates observation dataset acquired from the authorized TIGZIG/Yahoo Finance estimates route (`/v1/get-estimates/` and related Yahoo Finance estimates endpoints via yfinance at base `https://yfin-h.tigzig.com/v1`) from the authorization date onward (authorization date: 2026-09-27 per `d8-d06-d07-source-provider-designation-2026-09-27-001`).
>
> This M-1 commissioning is for the prospective dataset capability demonstrated by the completed qualification gates:
> - Free-provider forensic COMPLETE
> - Provider selection/designation COMPLETE (TIGZIG Yahoo Finance estimates route)
> - Real INFY.NS proof-of-acquisition PASS (1220 bytes, SHA-256 132573629992bae256b3698f81fc2c23400e9bd47c4414b942d445d09383fb48, acquiredAt 2026-09-27T17:55:35Z)
> - Five-entity prospective acquisition consistency PASS (MULTI_ENTITY_PROSPECTIVE_ACQUISITION = PASS, 5/5 returned, 39 valid, 1 provider-null, 0 invalid, 6111 bytes, SHA-256 2b2813a3b43c6774d5a6b5288f911659e7c2f8b9a4b7137a357d269d6676c943, acquiredAt 2026-09-27T18:02:58Z, entities RELIANCE.NS→EQ_RELIANCE_IN, INFY.NS→EQ_INFY_IN, TCS.NS→EQ_TCS_IN, HDFCBANK.NS→EQ_HDFCBANK_IN, AXISBANK.NS→EQ_AXISBANK_IN)
>
> The commissioned M-1 dataset MUST preserve the following 16 items for every observation:
>
> 1. provider identity
> 2. request URL
> 3. provider ticker
> 4. governed EQ_* identity
> 5. metric
> 6. provider period
> 7. consensus mean
> 8. high estimate
> 9. low estimate
> 10. analyst count
> 11. currency
> 12. observation/acquisition timestamp
> 13. exact source-response lineage SHA-256
> 14. source classification
> 15. quality state
> 16. replay constraint
>
> The dataset MUST distinguish OBSERVATION_TIME from PROVIDER_PUBLICATION_TIME. The latter is NOT AVAILABLE from this provider.
>
> This act COMMISSIONS THE GOVERNED M-1 DATASET CAPABILITY ONLY. It does NOT perform dataset deposition. Actual deposition, deterministic transformation (D05 pattern: build-time TypeScript import, zero live provider execution at runtime), provenance evidence, and acceptance remain separate future gates.
>
> This commissioning is governance-only.

**Commissioned by:** RAMKI. **M-1 Authority:** COMMISSIONED for D07 prospective estimates observation dataset only. Arena did not select scope, did not widen, did not infer.

---

## 4. EXACT SCOPE COMMISSIONED

| # | Commissioned scope |
| --- | --- |
| 1 | **D07 PROSPECTIVE ESTIMATES OBSERVATION DATA** — governed, prospective, single-user, non-commercial, non-deployed D07 estimates observation dataset |
| 2 | **Provider:** TIGZIG Yahoo Finance API / Yahoo Finance data — Estimates route `/v1/get-estimates/` (and related estimates endpoints via yfinance) at base `https://yfin-h.tigzig.com/v1` — designated by `d8-d06-d07-source-provider-designation-2026-09-27-001` |
| 3 | **Acquisition window:** From authorization date onward — authorization date `2026-09-27` per designation act — prospective only |
| 4 | **Entities demonstrated:** 5 Indian NSE securities already represented by authoritative IIPS identity mappings: `RELIANCE.NS→EQ_RELIANCE_IN`, `INFY.NS→EQ_INFY_IN`, `TCS.NS→EQ_TCS_IN`, `HDFCBANK.NS→EQ_HDFCBANK_IN`, `AXISBANK.NS→EQ_AXISBANK_IN` — future expansion requires governed identity existence, not invention |
| 5 | **Metrics:** `EPS` (earnings) and `REVENUE` where provider semantics support, per D07 contract `EstimateMetric` |
| 6 | **Periods:** Provider `period` values (`0q`, `+1q`, `0y`, `+1y` etc as supplied) → `targetPeriod` |
| 7 | **Fields preserved:** provider identity, request URL, provider ticker, governed EQ_* identity, metric, provider period, consensus mean, high estimate, low estimate, analyst count, currency, observation/acquisition timestamp, exact source-response lineage SHA-256, source classification, quality state, replay constraint |
| 8 | **Observation semantics:** `OBSERVATION_TIME` = acquisition/observation timestamp from commissioning date onward, distinct from provider publication time |
| 9 | **Transformation pattern:** Prospective acquisition retained as source responses, deterministically transformed into internal governed dataset as build-time TypeScript import (D05 precedent), zero dynamic Node fs/path dependencies at browser runtime, zero `fetch`/`authFetch`/`API`/`OIDC` at runtime — future deposition gate must implement offline bootstrap, not live runtime fetch |
| 10 | **Provenance lineage:** ExecutiveProvenance with lineageDigest SHA-256 over actual governed source |

---

## 5. EXACT EXCLUSIONS — WHAT THIS M-1 ACT DOES NOT COMMISSION

This M-1 commissioning act explicitly does NOT commission, authorize, or grant:

- **Historical PIT** — `HISTORICAL_PIT = NOT ESTABLISHED` — no historical publication-time/PIT archive, no historical backfill, no retroactive reconstruction
- **Provider publication-time history** — `PUBLICATION_TIME = NOT ESTABLISHED` — provider proven not to contain publicationTime
- **Provider revision history** — `REVISION_SEQ = NOT ESTABLISHED` — no provider revision sequence, no fabrication of revisionSeq, no inference of revisions from repeated observations
- **Effective time history** — `EFFECTIVE_TIME = NOT ESTABLISHED`
- **Source as-of** — `SOURCE_AS_OF = NOT PROVIDED` — provider does not supply sourceAsOf
- **Historical backfill** — NOT AUTHORIZED
- **D06 News** — IN SCOPE per D8 scope act but NO PROVIDER DESIGNATED BY THIS ACT, no commissioning of news dataset
- **D08 Macro** — DEFERRED per D8 scope act, NOT commissioned, NOT activated
- **D09 Alternative Data** — CONDITIONAL / FEASIBILITY-GATED per D8 scope act, NOT commissioned, NOT activated
- **Production** — NOT AUTHORIZED — `productionEligible` remains false, no production ingestion, no live market-data operation
- **D115 Identity/Company Binding** — WITHHELD / UNRESOLVED / NOT AUTHORIZED — `runtimeCompanyId` UNRESOLVED, this act does NOT grant D115
- **D91/D88 Macro Relief** — NOT GRANTED — D91 remains LIVE-only macro, no relief
- **Unrestricted redistribution** — NOT AUTHORIZED — limited personal-use-only, non-commercial, non-sublicenseable, revocable, no redistribution
- **Business Quant** — NOT selected, NOT authorized by this act (research candidate only)
- **Another provider to populate median** — NOT AUTHORIZED — consensusMedian remains ABSENT/NULL
- **Generic null policy beyond requirement** — NOT invented — only explicit policy for demonstrated HDFCBANK.NS +1q null case
- **M-3 provenance establishment** — NOT ESTABLISHED BY THIS ACT — requires separate evidence/acceptance after actual deposition
- **Implementation** — no M-1 dataset created, no provider adapter, no D07 contract modification, no estimates engine modification, no UI/runtime modification, no credentials, no fixtures, no API integration, no production ingestion, no M-3 evidence, no modification of existing governance acts

---

## 6. PIT BOUNDARY

Commissioned M-1 MUST explicitly state and enforce:

| PIT Field | Status |
| --- | --- |
| `HISTORICAL_PIT` | **NOT ESTABLISHED** — provider does NOT establish historical publication-time/PIT archive |
| `PUBLICATION_TIME` | **NOT ESTABLISHED** — provider response proven not to contain `publicationTime`; do NOT manufacture `publicationTime=acquisitionTime` |
| `EFFECTIVE_TIME` | **NOT ESTABLISHED** — provider does NOT supply `effectiveTime` |
| `REVISION_SEQ` | **NOT ESTABLISHED** — provider does NOT supply `revisionSeq`; do NOT fabricate `revisionSeq=1`; do NOT infer provider revisions from repeated observations; locally generated sequence ≠ provider sequence unless governed as such |
| `SOURCE_AS_OF` | **NOT PROVIDED** — provider does NOT supply source asOf; do NOT create; if D07 contract requires asOfDate and provider does not supply, record `QUALIFICATION-INCOMPLETE` for that field per prior qualification, do NOT substitute acquisitionTime as sourceAsOf |

The M-1 dataset may support **prospective observation/as-of semantics from the commissioning/authorization date onward only** — authorization date `2026-09-27` per designation act.

**Prospective observation qualification:**

- `PROSPECTIVE_OBSERVATION = QUALIFIED` only if acquisition satisfies governance rule: observation/acquisition date MUST be distinguished from provider publication time; former MUST NOT be represented as latter
- Observation date `2026-09-27T18:02:58Z` (latest qualification) is distinct from publicationTime (NOT ESTABLISHED)
- `asOfDate` ONLY where contract requires and provider supplies; otherwise `QUALIFICATION-INCOMPLETE` / `SOURCE_AS_OF NOT PROVIDED`; do NOT substitute acquisitionTime if required field needs sourceAsOf
- Historical PIT chronology NOT ESTABLISHED

**Prohibitions:**

- Do NOT represent observation time as provider publication time
- Do NOT fabricate revisionSeq
- Do NOT infer provider revisions from repeated observations
- Do NOT claim historical PIT reconstruction
- Do NOT treat repeated observations as provider revision history

This boundary preserves the provider designation act §8 prospective snapshot policy: `PROSPECTIVE_PIT ESTABLISHED FROM AUTHORIZATION DATE ONWARD WITH asOf = observation date; HISTORICAL_PIT NOT ESTABLISHED`.

---

## 7. NULL DATA POLICY

Qualification found explicit provider-null row:

- **Entity:** `HDFCBANK.NS` → `EQ_HDFCBANK_IN`
- **Metric:** earnings
- **Period:** `+1q`
- **Provider values:** `avg = null`, `low = null`, `high = null`, `numberOfAnalysts = null`, `currency = INR`
- **Interpretation:** Provider returns null when no data, not invalid numeric — observed in 6111-byte response SHA-256 `2b2813a3b43c6774d5a6b5288f911659e7c2f8b9a4b7137a357d269d6676c943`

**Commissioned null-data policy (explicit, bounded to demonstrated case, no generic policy invented beyond requirement):**

- Provider-null rows **may be retained as source observations** — they are legitimate source observations indicating provider has no estimate for that entity/period/metric at observation time
- They are **NOT numeric estimate records** — they do NOT satisfy `AnalystEstimatePayload` numeric requirements (`consensusMean`, `highEstimate`, `lowEstimate`, `analystCount` numeric)
- They **must not be silently converted to zero** — zero ≠ null, conversion would fabricate consensus value
- They **must not be silently dropped** — silent dropping would hide source observation and break lineage/provenance (source says null, dataset must be able to represent that source said null)
- They **must carry an explicit quality/missing-data state** — e.g., `quality = UNAVAILABLE` or `MISSING_DATA` or `PROVIDER_NULL` or `null` representation with provenance, distinguishing from valid consensus values
- **Downstream consumers must not treat them as valid consensus values** — `validateAnalystEstimate` would fail (analystCount <1, missing mandatory), they must be filtered or flagged before use in consensus aggregation
- **Retention requirement:** If retained, must retain full provenance: provider ticker, governed identity, metric, period, observation timestamp, lineageDigest SHA-256, sourceClassification, quality state indicating null
- **No generic null policy beyond this requirement invented** — policy applies to demonstrated provider-null pattern; future null patterns require same principles (preserve source truth, explicit quality, no silent zero, no silent drop)

---

## 8. MEDIAN POLICY

- **Provider does not supply median** — verified in both qualification gates: `INFY.NS` single (1220 bytes) and five-entity (6111 bytes) — field `median` absent in all rows, actual fields only `period`, `avg`, `low`, `high`, `numberOfAnalysts`, `currency`, `growth`, `yearAgoEps|yearAgoRevenue`
- **Therefore:** `consensusMedian = ABSENT / NULL` for M-1 prospective dataset commissioned by this act
- **Do NOT calculate median from high/low/mean** — median ≠ mean, median ≠ (high+low)/2, calculation would fabricate provider value
- **Do NOT introduce another provider merely to populate median** — Business Quant NOT selected, no other provider authorized by this act to populate median
- **D07 contract preservation:** `src/contracts/d07_estimates.ts` defines `consensusMedian?` optional — absent/null is valid per contract, no contract modification required or authorized
- **Validation:** `validateAnalystEstimate` does NOT require median — median absent does NOT cause validation failure
- **Future median population:** Requires separate governed gate with provider designation that actually supplies median and provenance

---

## 9. ENTITY IDENTITY

**Governed identity must remain canonical EQ_* form, never provider-native:**

| Provider Ticker (source identifier only) | Governed Identity (companyId) | NSE Symbol | Source Master |
| --- | --- | --- | --- |
| `RELIANCE.NS` | `EQ_RELIANCE_IN` | RELIANCE | `governed_fixture_master.ts` GOVERNED_OFFLINE_REFERENCE_ENTITIES |
| `INFY.NS` | `EQ_INFY_IN` | INFY | `governed_fixture_master.ts` — required |
| `TCS.NS` | `EQ_TCS_IN` | TCS | `governed_fixture_master.ts` |
| `HDFCBANK.NS` | `EQ_HDFCBANK_IN` | HDFCBANK | `governed_fixture_master.ts` |
| `AXISBANK.NS` | `EQ_AXISBANK_IN` | AXISBANK | `governed_fixture_master.ts` |

**Identity rules commissioned by this act:**

- Governed identity = `EQ_*` canonical from authoritative IIPS identity mappings (`governed_fixture_master.ts`, `d05_broad_universe_data.ts` 2250 entities)
- Provider symbols (`RELIANCE.NS`, `INFY.NS`, `TCS.NS`, `HDFCBANK.NS`, `AXISBANK.NS`) must remain **source/provider identifiers only** — they are NOT companyId
- Do NOT store provider-native symbols as `companyId` — `companyId` MUST be `EQ_*` form per M-4 requirement
- Provider ticker → governed resolver → `EQ_*` canonical mapping must be deterministic, explicit, one-to-one, no ambiguous, no inferred from name, no fuzzy matching, fail closed if unmapped
- Deterministic derivation: NSE symbol + `.NS` suffix explicitly supported by TIGZIG Yahoo Finance route, verified in qualification
- No provider-native stored as governed companyId — verified in qualification PASS
- Future entity expansion: Must use already-represented authoritative IIPS identity mappings from repository evidence, do NOT invent identities, do NOT silently use provider ticker as companyId

---

## 10. PROVENANCE REQUIREMENTS

M-1 commissioning establishes governed dataset structure and source lineage requirements (not yet M-3 provenance values, which require actual deposition).

**Required provenance fields for every observation (M-1 must require):**

| Field | Requirement | Value / Rule |
| --- | --- | --- |
| `sourceClassification` | REQUIRED | `TIGZIG_YAHOO_FINANCE_ESTIMATES` — per designation act |
| `source` / `provider` | REQUIRED | `TIGZIG Yahoo Finance` / `Yahoo Finance` — via TIGZIG API |
| `request URL` | REQUIRED | Exact URL used — e.g., `https://yfin-h.tigzig.com/v1/get-estimates/?tickers=RELIANCE.NS,INFY.NS,TCS.NS,HDFCBANK.NS,AXISBANK.NS` — must be retained verbatim |
| `provider ticker` | REQUIRED | Provider-native ticker — e.g., `INFY.NS`, `RELIANCE.NS` — source identifier only |
| `governed identity` | REQUIRED | `EQ_*` canonical — e.g., `EQ_INFY_IN` — via governed resolver |
| `acquiredAt` / `observation time` | REQUIRED | UTC ISO-8601 observation/acquisition timestamp — e.g., `2026-09-27T18:02:58Z` — MUST be distinguished from provider publication time (NOT ESTABLISHED) |
| `response byte count` | REQUIRED where raw source retained | Exact byte count of raw source response — e.g., `6111` for five-entity, `1220` for single INFY.NS — retained outside repo during qualification, must be retained for M-1 deposition |
| `lineageDigest` | REQUIRED | SHA-256 over exact raw source response byte-for-byte — e.g., `2b2813a3b43c6774d5a6b5288f911659e7c2f8b9a4b7137a357d269d6676c943` (6111 bytes), `132573629992bae256b3698f81fc2c23400e9bd47c4414b942d445d09383fb48` (1220 bytes) |
| `dataVersion` | REQUIRED if supplied, otherwise NOT PROVIDED | Provider does NOT supply dataVersion — record `NOT PROVIDED`, do NOT invent |
| `sourceAsOf` | REQUIRED if supplied, otherwise NOT PROVIDED | Provider does NOT supply sourceAsOf — record `NOT PROVIDED` / `SOURCE_AS_OF NOT PROVIDED`, do NOT invent, do NOT substitute observation time |
| `quality` | REQUIRED | Quality state — `GOOD` for 39 valid rows, `PROVIDER_NULL` / `UNAVAILABLE` for null row, `UNAVAILABLE` if invalid — per `ExecutiveProvenance` |
| `replayConstraintApplied` | REQUIRED | Boolean — `true` for prospective observation qualification — replay constraint that observation time ≠ publication time, no historical PIT reconstruction |
| `observationDate` | REQUIRED | Same as acquiredAt for prospective observation — distinct from publicationTime (NOT ESTABLISHED) |

**Do NOT invent:**

- `dataVersion` — provider does NOT supply, record NOT PROVIDED
- `sourceAsOf` — provider does NOT supply, record NOT PROVIDED
- `publicationTime` — NOT ESTABLISHED
- `effectiveTime` — NOT ESTABLISHED
- `revisionSeq` — NOT ESTABLISHED

**ExecutiveProvenance mapping (per `src/transports/intelligence_dto.ts` and `src/transports/types.ts`):**

- `sourceClassification` = `TIGZIG_YAHOO_FINANCE_ESTIMATES`
- `asOf` = observation date for prospective semantics (not provider publication time)
- `evaluatedAt` = acquisition timestamp
- `dataVersion` = NOT PROVIDED (provider does not supply)
- `lineageDigest` = SHA-256 over actual governed source (byte-for-byte)
- `quality` = GOOD / UNAVAILABLE / PROVIDER_NULL
- `replayConstraintApplied` = true (prospective observation qualified, historical PIT not established)

**Qualification lineage preserved:**

- Latest live acquisition: `2026-09-27T18:02:58Z`, 6111 bytes, SHA-256 `2b2813a3b43c6774d5a6b5288f911659e7c2f8b9a4b7137a357d269d6676c943`
- Prior INFY.NS proof: `2026-09-27T17:55:35Z`, 1220 bytes, SHA-256 `132573629992bae256b3698f81fc2c23400e9bd47c4414b942d445d09383fb48`
- Both retained outside repo during qualification, byte-for-byte, with exact request URL, status 200, timestamp, byteCount, SHA-256

---

## 11. ENTITLEMENT BOUNDARY

Preserve existing governance limitation from provider designation act:

**Entitlement Basis:**

- `LIMITED PERSONAL-USE-ONLY`
- `RESEARCH / EDUCATIONAL`
- `NON-COMMERCIAL`
- `NON-SUBLICENSEABLE`
- `REVOCABLE`
- `NO REDISTRIBUTION`

**Basis per authoritative web evidence (preserved from designation act):**

- yfinance PyPI: *yfinance offers a Pythonic way to fetch financial & market data from Yahoo! finance. yfinance is not affiliated, endorsed, or vetted by Yahoo, Inc. It's an open-source tool that uses Yahoo's publicly available APIs, and is intended for research and educational purposes. Remember - the Yahoo! finance API is intended for personal use only.*
- Yahoo Developer API Terms: Licensed worldwide, non-exclusive, non-sublicenseable, revocable; All rights not expressly granted reserved; YOU SHALL NOT: Sell, lease, share, transfer, sublicense Yahoo APIs or derive income without permission
- Yahoo ToS: Unless explicit written permission, must not reproduce, modify, rent, lease, sell, trade, distribute, transmit, broadcast, publicly perform, create derivative works, exploit for commercial purposes
- Tiingo blog: No official Yahoo Finance API since 2017 discontinued; unofficial routes gray area, redistribution restricted, undocumented, breaks without notice, no SLA
- TIGZIG docs: Open, no-auth HTTP API and MCP exposing Yahoo Finance via yfinance — no key, no signup, built/run by one person, FastAPI + fastapi-mcp + yfinance + pandas, Coolify Hetzner Cloudflare — no explicit licensing for retention/transformation documented, relies on underlying Yahoo terms

**Therefore:**

- For limited personal, single-user, non-commercial, research/educational retention/transformation for this single-user IIPS application (LOCAL / PERSONAL / SINGLE-USER / DEVELOPMENT-QUALIFICATION / NON-DEPLOYED tier per GP-5): **LIMITED PERSONAL-USE-ONLY** per Yahoo/yfinance terms, but revocable, non-sublicenseable, no redistribution, gray area for unofficial routes — explicitly recorded
- For unrestricted commercial retention/transformation/redistribution: **ENTITLEMENT BASIS = NOT ESTABLISHED**
- Free API ≠ unrestricted license; No API key ≠ unrestricted retention; Personal use ≠ permission to redistribute; Public webpage ≠ unrestricted bulk extraction
- This act does NOT represent route as unrestricted licensed commercial data — do NOT represent as such
- This act does NOT grant commercial or redistribution authority — explicitly WITHHELD

---

## 12. M-3 BOUNDARY

M-1 commissioning may establish governed dataset structure and source lineage requirements (per §10).

It must NOT falsely declare M-3 already established unless actual deposited dataset and provenance evidence have been produced and accepted.

**Therefore:**

- `M-3 = NOT ESTABLISHED BY THIS ACT`
- M-3 requires separate evidence/acceptance boundary after actual deposition
- M-3 establishment requires: actual governed source data deposited as build-time TypeScript import (D05 pattern), source identity, acquisition/provenance information, timestamps/versioning as applicable, SHA-256 lineageDigest where contract requires, `ExecutiveProvenance` fields `sourceClassification`, `asOf`, `evaluatedAt`, `dataVersion`, `lineageDigest`, `quality`, `replayConstraintApplied`
- Actual deposited dataset and provenance evidence have NOT been produced by this act — this act is governance-only, no implementation
- No M-3 evidence created by this act, no M-3 acceptance, no M-3 provenance establishment
- M-3 remains NOT ESTABLISHED after this act, pending separate deposition gate

---

## 13. D06 / D08 / D09 PRESERVATION

Per D8 scope determination act `d8-intelligence-domain-scope-determination-2026-09-27-001` and provider designation act `d8-d06-d07-source-provider-designation-2026-09-27-001`:

| Domain | Scope | Status after this M-1 act |
| --- | --- | --- |
| **D06 News** | INITIAL REQUIRED / IN SCOPE for initial D8 Intelligence commissioning path | **IN SCOPE but NO PROVIDER DESIGNATED BY THIS ACT** — remains governed offline dataset requirement, still requires separate provider/source designation and entitlement before actual data commissioning; this act does NOT designate News provider, does NOT commission News dataset, does NOT authorize News acquisition |
| **D07 Estimates** | INITIAL REQUIRED / IN SCOPE for initial D8 Intelligence commissioning path | **IN SCOPE and PROVIDER DESIGNATED by designation act for prospective acquisition ONLY, M-1 COMMISSIONED BY THIS ACT for prospective observation dataset only** — TIGZIG Yahoo Finance estimates route, prospective from 2026-09-27 onward, 5 entities demonstrated, 39 valid rows + 1 provider-null row, no historical PIT, no publicationTime, no revisionSeq |
| **D08 Macro** | DEFERRED | **DEFERRED** — do NOT make macro blocker for initial D8 commissioning, preserve D91/D88 dependency, D91/D88 relief NOT GRANTED, macro data acquisition NOT AUTHORIZED, macro remains LIVE-only per D91, this act does NOT activate D08 |
| **D09 Alternative Data** | CONDITIONAL / FEASIBILITY-GATED | **CONDITIONAL / FEASIBILITY-GATED** — may enter initial scope only if valid governed source, entitlement/licensing, provenance, and required approvalRef governance can actually be established, must NOT become mandatory blocker merely because architecturally supported, do NOT designate provider merely to satisfy condition, this act does NOT activate D09 |

Do NOT activate any of D06 provider, D08, D09.

---

## 14. D07 CONTRACT PRESERVATION

**Existing authoritative contract remains:**

`src/contracts/d07_estimates.ts`

with:

- `companyId: string`
- `metric: EstimateMetric ('REVENUE' | 'EBITDA' | 'EPS' | 'PAT' | 'TARGET_PRICE')`
- `targetPeriod: string (e.g. FY2026, Q2FY2027, 0q, +1q, 0y, +1y)`
- `consensusMean: number`
- `consensusMedian?: number`
- `highEstimate: number`
- `lowEstimate: number`
- `analystCount: number`
- `currency: 'INR' | 'USD'`
- `asOfDate: string (ISO-8601 UTC date)`

**Do not modify this contract in this gate.**

**Mapping for commissioned M-1 (deterministic, honest, per qualification):**

- Provider `period` → `targetPeriod`
- Provider `avg` → `consensusMean`
- Provider `low` → `lowEstimate`
- Provider `high` → `highEstimate`
- Provider `numberOfAnalysts` → `analystCount`
- Provider `currency` → `currency`
- Governed resolver `EQ_*` → `companyId`
- Provider `earnings` → `EPS` where semantics support
- Provider `revenue` → `REVENUE` where semantics support
- Provider median NOT supplied → `consensusMedian` = ABSENT/NULL, do NOT calculate
- Provider `sourceAsOf` NOT PROVIDED → `asOfDate` = QUALIFICATION-INCOMPLETE where contract requires, do NOT substitute acquisitionTime as sourceAsOf, do NOT manufacture SOURCE_AS_OF

**Validation preserved:**

- `validateAnalystEstimate` requires `companyId`, `targetPeriod`, `analystCount>=1 integer`, `highEstimate>=lowEstimate`
- Provider-null row (HDFCBANK.NS +1q) fails validation (analystCount null) — must be flagged as PROVIDER_NULL / UNAVAILABLE, not valid consensus, not silently converted to zero, not silently dropped without provenance

---

## 15. NO IMPLEMENTATION IN THIS GATE

Governance-only.

This act explicitly does NOT:

- create M-1 dataset
- create provider adapter
- modify D07 contract `src/contracts/d07_estimates.ts`
- modify estimates engine `src/intelligence/estimates_engine.ts`
- modify UI
- modify runtime
- add credentials
- add fixtures
- create API integration
- create production ingestion
- create M-3 evidence
- modify existing governance acts (`GATE-Y-INTELLIGENCE-DATA-SUPPLY-DESIGNATION-AND-GATE-SELECTION-ACT.md`, `GATE-Y-M2-INTELLIGENCE-DATA-AUTHORIZATION-ACT.md`, `D8-INTELLIGENCE-DOMAIN-SCOPE-DETERMINATION-ACT.md`, `D8-D06-D07-SOURCE-PROVIDER-DESIGNATION-ACT.md` remain byte-identical, frozen)
- modify `src/identity/*`, `src/d114/*`, `frontend/*`, `src/ui/*`
- add package dependencies
- embed secrets
- authorize production
- authorize D115, D91/D88

Implementation authority remains NOT GRANTED.

---

## 16. AUTHORITY STATES — RECORDED SEPARATELY

| Authority | State after this M-1 act |
| --- | --- |
| `D8_INTELLIGENCE_WORKSTREAM_DESIGNATION` | ESTABLISHED BY `gate-y-intel-data-supply-designation-selection-2026-09-27-001` — unchanged |
| `INTELLIGENCE_DATA_SUPPLY_GATE` | SELECTED / OPENED FOR GOVERNANCE RESOLUTION — unchanged |
| `M-2_INTELLIGENCE_DATA_SUPPLY_AUTHORITY` | ESTABLISHED BY `gate-y-m2-intelligence-data-authorization-2026-09-27-001` — governance/data-supply authority only, bounded to news / estimates / macro / alt-data — unchanged |
| `D8_DOMAIN_SCOPE_DETERMINATION` | ESTABLISHED BY `d8-intelligence-domain-scope-determination-2026-09-27-001` — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL/FEASIBILITY-GATED — unchanged |
| `D07_SOURCE_PROVIDER_DESIGNATION` | ESTABLISHED BY `d8-d06-d07-source-provider-designation-2026-09-27-001` — TIGZIG Yahoo Finance estimates route SELECTED for PROSPECTIVE D07 ACQUISITION ONLY — unchanged |
| `D07_PROSPECTIVE_ACQUISITION_QUALIFICATION` | ESTABLISHED — INFY.NS PASS (1220 bytes, SHA-256 132573629992bae256b3698f81fc2c23400e9bd47c4414b942d445d09383fb48, 2026-09-27T17:55:35Z) + MULTI_ENTITY_PROSPECTIVE_ACQUISITION PASS (5/5, 39 valid, 1 provider-null, 0 invalid, 6111 bytes, SHA-256 2b2813a3b43c6774d5a6b5288f911659e7c2f8b9a4b7137a357d269d6676c943, 2026-09-27T18:02:58Z) |
| `M-1_D07_PROSPECTIVE_ESTIMATES_OBSERVATION_DATASET` | **COMMISSIONED BY THIS ACT** — `d07-m1-prospective-estimates-observation-commissioning-2026-09-27-001` — governed, prospective, single-user, non-commercial, non-deployed D07 estimates observation dataset from authorized TIGZIG/Yahoo route from authorization date onward; capability only, not deposition |
| `M-1_DEPOSITION` | NOT PERFORMED BY THIS ACT — actual dataset deposition remains separate future gate |
| `M-3_PROVENANCE` | **NOT ESTABLISHED BY THIS ACT** — requires separate evidence/acceptance boundary after actual deposition; M-3 remains NOT ESTABLISHED |
| `D06_NEWS_PROVIDER_DESIGNATION` | NOT GRANTED — IN SCOPE but NO PROVIDER DESIGNATED BY THIS ACT |
| `D08_MACRO_ACTIVATION` | NOT GRANTED — DEFERRED |
| `D09_ALTDATA_ACTIVATION` | NOT GRANTED — CONDITIONAL/FEASIBILITY-GATED |
| `D07_HISTORICAL_PIT` | NOT ESTABLISHED — explicitly NOT COMMISSIONED |
| `PUBLICATION_TIME` | NOT ESTABLISHED |
| `EFFECTIVE_TIME` | NOT ESTABLISHED |
| `REVISION_SEQ` | NOT ESTABLISHED |
| `SOURCE_AS_OF` | NOT PROVIDED |
| `PROSPECTIVE_OBSERVATION` | QUALIFIED from commissioning date onward, observation time distinct from publication time |
| `CONSENSUS_MEDIAN` | ABSENT/NULL — provider does not supply, do NOT calculate |
| `PROVIDER_NULL_POLICY` | ESTABLISHED BY THIS ACT for demonstrated HDFCBANK.NS +1q case — may retain as source observation, NOT numeric record, no silent zero, no silent drop, explicit quality, downstream must not treat as valid consensus |
| `ENTITLEMENT` | LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION — commercial/redistribution NOT ESTABLISHED |
| `IMPLEMENTATION_AUTHORITY` | NOT GRANTED — governance-only |
| `PRODUCTION_AUTHORITY` | NOT GRANTED — `productionEligible: false` |
| `D115_IDENTITY_AUTHORITY` | WITHHELD / UNRESOLVED / NOT AUTHORIZED — unchanged |
| `D91/D88_MACRO_RELIEF` | NOT GRANTED — unchanged |
| `CERTIFICATION_AUTHORITY` (beyond M-1 commissioning) | NOT GRANTED — M-1 commissioning is governance, not certification of deposition |

---

## 17. RETAINED GOVERNANCE INVARIANTS

| Invariant | State after this act |
| --- | --- |
| Operating mode | `NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV` — unchanged |
| Sole data-authorizing acts repo-wide | `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` (D05 only) + M-2 act (Intelligence governance/data-supply authority only) + provider designation act (TIGZIG prospective D07) + **this M-1 act** `d07-m1-prospective-estimates-observation-commissioning-2026-09-27-001` (D07 prospective observation dataset capability only, not deposition) |
| BI-01..BI-08 · D05/P04 · D114 · `src/ui` records | FROZEN — unchanged |
| Intelligence nav status | `partial` — unchanged |
| Intelligence surface | `PARTIAL / PRESENTATIONAL ONLY / NO GOVERNED OFFLINE PAYLOAD` — unchanged (M-1 capability commissioned, deposition not yet performed) |
| D07 contract | `src/contracts/d07_estimates.ts` authoritative, unchanged |
| D115 C / D | WITHHELD / UNRESOLVED / NOT AUTHORIZED — unchanged |
| `runtimeCompanyId` | UNRESOLVED — unchanged |
| D91/D88 | LIVE-only macro; no relief — unchanged; D08 deferred |
| `productionEligible` | false — unchanged |
| External live sockets | 0 — unchanged |
| Windows visual acceptance | NOT CLAIMED BY ARENA — unchanged |
| Existing governance acts | Byte-identical, frozen — this act adds only new file, modifies none |

---

## 18. NEXT AUTHORITY GATE (not authorized by this act)

Within GATE-Y path, under M-2 authority, D8 scope, provider designation, and this M-1 commissioning:

- **Actual M-1 prospective dataset deposition and acceptance** — separate gate:
  - Governed offline dataset as build-time TypeScript import (D05 pattern), zero live provider execution at runtime
  - Preserve 16 required items: provider identity, request URL, provider ticker, governed EQ_* identity, metric, provider period, consensus mean, high estimate, low estimate, analyst count, currency, observation/acquisition timestamp, exact source-response lineage SHA-256, source classification, quality state, replay constraint
  - Distinguish OBSERVATION_TIME from PROVIDER_PUBLICATION_TIME (NOT AVAILABLE)
  - Enforce PIT boundary: HISTORICAL_PIT NOT ESTABLISHED, PUBLICATION_TIME NOT ESTABLISHED, EFFECTIVE_TIME NOT ESTABLISHED, REVISION_SEQ NOT ESTABLISHED, SOURCE_AS_OF NOT PROVIDED, prospective observation qualified from commissioning date onward
  - Enforce null-data policy: provider-null rows may be retained as source observations, NOT numeric records, no silent zero, no silent drop, explicit quality, downstream must not treat as valid consensus
  - Enforce median policy: consensusMedian ABSENT/NULL, do NOT calculate, do NOT introduce another provider
  - Enforce identity: EQ_* canonical, provider ticker source only, deterministic resolver
  - Provenance: sourceClassification TIGZIG_YAHOO_FINANCE_ESTIMATES, provider TIGZIG Yahoo Finance, request exact URL, provider ticker, governed identity, acquiredAt, byteCount where retained, lineageDigest SHA-256, dataVersion NOT PROVIDED, sourceAsOf NOT PROVIDED, observationDate, quality, replayConstraintApplied
  - Entitlement: LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION
  - Validation: low<=avg<=high, analystCount>=0, currency valid, numeric valid for valid rows, null rows flagged
  - ExecutiveProvenance with lineageDigest SHA-256 over actual governed source

- **M-3 provenance establishment** — separate evidence/acceptance boundary after actual deposition, requires actual deposited dataset and provenance evidence produced and accepted

The deposition, provenance establishment, and acceptance remain **separate, future, explicit RAMKI determinations**. Arena must not manufacture dataset, adapter, or provenance.

---

**End of Authority Act. M-1 D07 Prospective Estimates Observation Dataset COMMISSIONED — governance-only capability for prospective observation from authorization date onward via authorized TIGZIG/Yahoo Finance estimates route. M-3 NOT ESTABLISHED BY THIS ACT. No implementation, no dataset deposition, no M-3 evidence, no D06 provider designation, no D08/D09 activation, no production, no D115, no D91/D88 relief, no unrestricted redistribution. Next gate: actual M-1 prospective dataset deposition and acceptance.**

