# Institutional Investment Platform System (IIPS)
# D07 M-3 — Prospective Estimates Provenance Establishment & Acceptance Act

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `d07-m3-prospective-estimates-provenance-acceptance-2026-09-27-001`
**Governing Authority:** RAMKI (M-3 Provenance Accepting Authority)
**Recording Agent:** Arena (recording only — no implementation beyond governance record)
**Act Type:** AUTHORITY M-3 PROVENANCE ESTABLISHMENT & ACCEPTANCE (governance-only; NO D06/D08/D09/D115/PRODUCTION/CERTIFICATION BEYOND M-3)
**Recorded At (local, Asia/Calcutta):** 2026-09-27
**Antecedent Checkpoint:** `62330df0889ca1fe05009b0366ec1286d3865704`
**Parent Checkpoint:** `b0faa13f7f4d236f634028e123c642abed286660`
**Governed Branch:** `arena/01a0ddae-iips-production-market-data`
**Gate Context:** `GATE-Y (Intelligence Data-Supply)` — M-1 COMMISSIONED by `d07-m1-prospective-estimates-observation-commissioning-2026-09-27-001` at `b0faa13`; M-1 DEPLOYED/DEPOSITED at `62330df` — 40 observations, 39 valid, 1 provider-null, 0 invalid, 5 entities, 6110B raw, SHA-256 `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254`, observation `2026-09-27T18:18:58Z`; M-3 previously NOT ESTABLISHED

---

## 1. VERIFIED AUTHORITATIVE PRE-CHECK (inspected before recording, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative repository | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` |
| Authoritative branch | `refs/heads/arena/01a0ddae-iips-production-market-data` @ `62330df0889ca1fe05009b0366ec1286d3865704` — LOCAL == REMOTE before mutation |
| Local HEAD | `62330df0889ca1fe05009b0366ec1286d3865704` |
| Worktree | CLEAN (0 entries) — `git status --porcelain` empty |
| M-1 commissioning act | PRESENT — `D07-M1-PROSPECTIVE-ESTIMATES-OBSERVATION-DATASET-COMMISSIONING-ACT.md` blob `9c0f2975af367da680edd303627cbb0ad9092b4dc37e5b3134052b2b49871e9d` — 45681B |
| Deposited M-1 dataset | PRESENT — `src/intelligence/d07_prospective_estimates_observation_dataset.ts` — 53618B SHA-256 `eda08b8b3d8c600ccdaac4b61a9b4001dd9638eb76cdb015d544744fd6701f03` |
| Retained raw response | PRESENT — `src/intelligence/d07_prospective_estimates_raw_response.json` — 6110B SHA-256 `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254` |
| D07 contract | PRESENT — `src/contracts/d07_estimates.ts` — 1959B SHA-256 `7112f8ac6eaacfbf022c9fd93df3be220e16c4204069bd2217aa3a1b2921d462` — byte-identical to M-1 state |
| SourceClassification | PRESENT — `src/contracts/types.ts` — 1276B SHA-256 `6b567a398e45f1ffe3c7131c940ccb39be417752225c64f227fd6256479fd0c4` — includes `TIGZIG_YAHOO_FINANCE_ESTIMATES` |
| M-1 state before this act | `DEPLOYED/DEPOSITED — ACCEPTANCE PASS` |
| M-3 state before this act | `NOT ESTABLISHED` |
| M-3 act | ABSENT before this act — `D07-M3-PROSPECTIVE-ESTIMATES-PROVENANCE-ACCEPTANCE-ACT.md` does NOT exist in HEAD |

Pre-check result: **PASS — authoritative state matches expected pre-gate HEAD `62330df`**

---

## 2. PURPOSE OF M-3

M-3 is the separate provenance-establishment boundary that M-1 commissioning act `d07-m1-prospective-estimates-observation-commissioning-2026-09-27-001` deliberately left unresolved:

> `M-3 = NOT ESTABLISHED BY THIS ACT` — M-3 requires separate evidence/acceptance boundary after actual deposition.

Objective: Establish from actually deposited artifacts that commissioned M-1 dataset has traceable and reproducible provenance chain:

```
PROVIDER RESPONSE
→ exact retained bytes (6110B)
→ SHA-256 lineage digest (9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254)
→ acquisition/observation timestamp (2026-09-27T18:18:58Z)
→ request URL (https://yfin-h.tigzig.com/v1/get-estimates/?tickers=RELIANCE.NS,INFY.NS,TCS.NS,HDFCBANK.NS,AXISBANK.NS)
→ provider ticker (RELIANCE.NS etc)
→ governed EQ_* identity (EQ_RELIANCE_IN etc)
→ metric (EPS/REVENUE)
→ provider period (0q/+1q/0y/+1y)
→ deterministic transformation (period→targetPeriod, avg→consensusMean, low→lowEstimate, high→highEstimate, numberOfAnalysts→analystCount, currency→currency, governed resolver→companyId, earnings→EPS, revenue→REVENUE)
→ deposited governed observation (40 observations)
→ build-time TypeScript dataset (src/intelligence/d07_prospective_estimates_observation_dataset.ts)
```

M-3 is based on **actual deposited evidence**, not newly invented metadata.

---

## 3. PROVENANCE CHAIN VERIFICATION — INDEPENDENT CALCULATION

### 3.1 Raw Response Byte Count & SHA-256

| Item | Declared in dataset | Independently calculated from retained raw file | Match |
| --- | --- | --- | --- |
| Raw response byte count | 6110 (in `D07_PROSPECTIVE_ESTIMATES_PROVENANCE.responseByteCount`) | 6110 (`wc -c src/intelligence/d07_prospective_estimates_raw_response.json`) | PASS |
| Raw response SHA-256 | `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254` (in `lineageDigest`) | `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254` (`sha256sum` of raw file) | PASS |
| Raw file presence | `src/intelligence/d07_prospective_estimates_raw_response.json` | File exists, 6110B, valid JSON, 5 top-level keys | PASS |

No reconstructed response used — retained raw response is exact provider bytes.

### 3.2 Dataset-Declared Lineage Digest & Byte Count

| Item | Value | Verified |
| --- | --- | --- |
| Dataset file | `src/intelligence/d07_prospective_estimates_observation_dataset.ts` 53618B SHA-256 `eda08b8b3d8c600ccdaac4b61a9b4001dd9638eb76cdb015d544744fd6701f03` | PRESENT |
| Declared lineageDigest in dataset | `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254` | Matches raw SHA-256 PASS |
| Declared responseByteCount in dataset | 6110 | Matches raw byte count PASS |
| Dataset observations count | 40 (providerTicker occurrences 41 including interface, but 40 observation objects) | Matches raw total 40 PASS |

### 3.3 Observations Against Raw Response

Raw JSON structure:

- `RELIANCE.NS`: earnings 4, revenue 4 = 8
- `INFY.NS`: earnings 4, revenue 4 = 8
- `TCS.NS`: earnings 4, revenue 4 = 8
- `HDFCBANK.NS`: earnings 4 (including 1 null), revenue 4 = 8
- `AXISBANK.NS`: earnings 4, revenue 4 = 8
- Total = 40

Independent python verification:

- Total 40, Valid 39, Null 1, Invalid 0, Earnings 20, Revenue 20 — PASS
- All 39 valid rows numeric PASS, low≤avg≤high PASS, analystCount≥0 PASS, currency INR PASS

Dataset transformation preserves all 40 rows with same breakdown.

### 3.4 Identity Mappings — Deterministic

| Provider Ticker | Governed Identity | Verified in raw + dataset |
| --- | --- | --- |
| `RELIANCE.NS` | `EQ_RELIANCE_IN` | PASS — NSE RELIANCE from `governed_fixture_master.ts` |
| `INFY.NS` | `EQ_INFY_IN` | PASS — required, NSE INFY |
| `TCS.NS` | `EQ_TCS_IN` | PASS — NSE TCS |
| `HDFCBANK.NS` | `EQ_HDFCBANK_IN` | PASS — NSE HDFCBANK |
| `AXISBANK.NS` | `EQ_AXISBANK_IN` | PASS — NSE AXISBANK |

Provider-native tickers remain source identifiers only, never stored as `companyId`. Deterministic NSE symbol + `.NS` derivation explicitly supported by TIGZIG route. No ambiguous, no inferred from name, no provider-native stored as companyId — PASS.

### 3.5 Metric/Period Mappings

- `earnings → EPS` where semantics support — PASS
- `revenue → REVENUE` — PASS
- `period → targetPeriod` — PASS (0q, +1q, 0y, +1y preserved)
- `avg → consensusMean`, `low → lowEstimate`, `high → highEstimate`, `numberOfAnalysts → analystCount`, `currency → currency`, `governed resolver → companyId` — PASS
- `consensusMedian` ABSENT/NULL — provider does not supply median, NOT calculated — PASS (no consensusMedian numeric in dataset)

### 3.6 Numeric Values — 39 Valid Observations

Independent verification: For each of 39 valid rows, raw avg/low/high/numberOfAnalysts/currency matches dataset consensusMean/lowEstimate/highEstimate/analystCount/currency within observation object.

Example valid rows (all verified):

- `RELIANCE.NS` EPS 0q avg 16.275 low 13.6 high 18.95 analystCount 2 currency INR → dataset consensusMean 16.275 lowEstimate 13.6 highEstimate 18.95 PASS
- `INFY.NS` EPS 0q avg 19.61527 low 19.2 high 20.33 analystCount 8 PASS
- `HDFCBANK.NS` REVENUE 0y avg 2007951231600 low 2000114290210 high 2099597000000 analystCount 35 PASS
- ... (all 39 verified via script `/tmp/m3_verify.py` — PASS)

### 3.7 Provider-Null Observation — Single

- **Raw:** `HDFCBANK.NS` earnings `+1q` `avg=null low=null high=null yearAgoEps=null numberOfAnalysts=null growth=null currency=INR`
- **Dataset:** Same ticker/period/metric preserved, `consensusMean: null`, `highEstimate: null`, `lowEstimate: null`, `analystCount: null`, `currency: 'INR'`, `quality: 'PROVIDER_NULL'`, `isProviderNull: true`
- **Not represented as valid numeric estimate:** PASS — not in `D07_PROSPECTIVE_ESTIMATES_VALID_PAYLOADS` (39 entries), only in `D07_PROSPECTIVE_ESTIMATES_OBSERVATIONS` (40) and `D07_PROSPECTIVE_PROVIDER_NULL_OBSERVATIONS` (1)
- **Not silently dropped:** PASS — retained
- **Not converted to zero:** PASS — null preserved, not 0
- **Provenance preserved:** provider ticker, governed identity, metric, period, observation timestamp, lineage digest, source classification preserved — PASS

---

## 4. REQUIRED PROVENANCE FACTS — VERIFIED

For every deposited observation (40), verified presence and consistency of commissioned provenance:

| Provenance Field | Required | Verified | Status |
| --- | --- | --- | --- |
| `sourceClassification = TIGZIG_YAHOO_FINANCE_ESTIMATES` | REQUIRED | Present in every observation + provenance object | PASS |
| Provider/source identity | REQUIRED — `TIGZIG Yahoo Finance` / `Yahoo Finance via TIGZIG API` | Present | PASS |
| Exact request URL | REQUIRED — `https://yfin-h.tigzig.com/v1/get-estimates/?tickers=RELIANCE.NS,INFY.NS,TCS.NS,HDFCBANK.NS,AXISBANK.NS` | Present verbatim in dataset + raw | PASS |
| Provider-native ticker | REQUIRED | 5 tickers preserved per observation | PASS |
| Governed EQ_* identity | REQUIRED | 5 EQ_* identities, deterministic | PASS |
| Metric | REQUIRED — EPS/REVENUE | Present | PASS |
| Provider period | REQUIRED — 0q/+1q/0y/+1y | Present | PASS |
| Acquisition/observation timestamp | REQUIRED — UTC ISO-8601 | `2026-09-27T18:18:58Z` present | PASS |
| Response byte count | REQUIRED | 6110 present | PASS |
| SHA-256 lineage digest | REQUIRED | `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254` present | PASS |
| Quality state | REQUIRED — GOOD / PROVIDER_NULL | GOOD for 39, PROVIDER_NULL for 1 | PASS |
| `replayConstraintApplied = true` | REQUIRED | Present in every observation + provenance | PASS |

Identity mappings deterministic — verified in §3.4 — PASS.

---

## 5. CROSS-ARTIFACT LINEAGE VERIFICATION — SUMMARY

| # | Check | Actual | Expected | Result |
| --- | --- | --- | --- | --- |
| 1 | Raw response byte count | 6110 (`wc -c`) | 6110 declared | PASS |
| 2 | Raw response SHA-256 | `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254` (`sha256sum`) | Same declared | PASS |
| 3 | Dataset-declared lineage digest | `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254` | Raw SHA-256 | PASS |
| 4 | Dataset-declared response byte count | 6110 | Raw byte count | PASS |
| 5 | Dataset observations vs raw | 40 total, 39 valid, 1 null, 0 invalid, earnings 20, revenue 20 | Raw 40/39/1/0/20/20 | PASS |
| 6 | Provider ticker → governed identity | 5 mappings deterministic | Commissioned 5 | PASS |
| 7 | Metric/period mappings | EPS/REVENUE, 0q/+1q/0y/+1y | Commissioned | PASS |
| 8 | Numeric values 39 valid | low≤mean≤high, analystCount≥0, currency INR | Invariants | PASS |
| 9 | Single provider-null | HDFCBANK.NS +1q nulls preserved with quality PROVIDER_NULL | Commissioned null policy | PASS |

Every mismatch would fail closed — no mismatch found.

No reconstructed response used — retained raw response is exact provider bytes.

---

## 6. TEMPORAL PROVENANCE BOUNDARIES — EXPLICITLY ESTABLISHED FROM EVIDENCE

| Boundary | Status | Evidence |
| --- | --- | --- |
| `OBSERVATION_TIME` | **ESTABLISHED** | `2026-09-27T18:18:58Z` — acquisition/observation timestamp from actual deposition, UTC ISO-8601, present in provenance + every observation |
| `PUBLICATION_TIME` | **NOT ESTABLISHED** | Provider response contains no publicationTime field — verified in raw JSON (fields: period/avg/low/high/numberOfAnalysts/currency/growth/yearAgo) — dataset `publicationTime: null` — act explicitly states NOT ESTABLISHED |
| `SOURCE_AS_OF` | **NOT PROVIDED** | Provider does NOT supply sourceAsOf — raw JSON has no sourceAsOf — dataset `sourceAsOf: null` — commissioning act SOURCE_AS_OF NOT PROVIDED |
| `HISTORICAL_PIT` | **NOT ESTABLISHED** | Provider does NOT establish historical PIT archive — no historical publication-time history — dataset `historicalPit: 'NOT_ESTABLISHED'` — no backfill |
| `EFFECTIVE_TIME` | **NOT ESTABLISHED** | Provider does NOT supply effectiveTime — dataset `effectiveTime: null` |
| `REVISION_SEQ` | **NOT ESTABLISHED** | Provider does NOT supply revisionSeq — dataset `revisionSeq: null` — do NOT fabricate revisionSeq=1, do NOT infer revisions from repeated observations |
| `DATA_VERSION` | **NOT PROVIDED** | Provider does NOT supply dataVersion — dataset `dataVersion: null` |

Observed/acquired timestamp `2026-09-27T18:18:58Z` never relabeled as provider publication time or source-as-of time — verified: `publicationTime: null` in every observation, no synthetic timestamp created — PASS.

No synthetic publication timestamps, no synthetic revision sequences, no historical PIT chronology inferred — PASS.

---

## 7. NULL OBSERVATION PROVENANCE — INDEPENDENT VERIFICATION

Retained HDFCBANK `+1q` provider-null observation:

- **Raw:** `HDFCBANK.NS` earnings `+1q` `avg=null low=null high=null numberOfAnalysts=null currency=INR growth=null yearAgoEps=null`
- **Dataset observation:**
  - `providerTicker: 'HDFCBANK.NS'` — preserved PASS
  - `governedIdentity: 'EQ_HDFCBANK_IN'` — preserved PASS
  - `companyId: 'EQ_HDFCBANK_IN'` — preserved PASS
  - `metric: 'EPS'` — preserved PASS (earnings→EPS)
  - `providerPeriod: '+1q'` / `targetPeriod: '+1q'` — preserved PASS
  - `observationTimestamp: '2026-09-27T18:18:58Z'` — preserved PASS
  - `lineageDigest: '9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254'` — preserved PASS
  - `sourceClassification: 'TIGZIG_YAHOO_FINANCE_ESTIMATES'` — preserved PASS
  - `quality: 'PROVIDER_NULL'` — explicitly PROVIDER_NULL PASS
  - `isProviderNull: true` — explicit PASS
  - `consensusMean: null`, `highEstimate: null`, `lowEstimate: null`, `analystCount: null` — NOT represented as valid numeric estimate PASS
  - Not silently dropped — present in `D07_PROSPECTIVE_ESTIMATES_OBSERVATIONS` (40) and `D07_PROSPECTIVE_PROVIDER_NULL_OBSERVATIONS` (1), absent from `D07_PROSPECTIVE_ESTIMATES_VALID_PAYLOADS` (39) — PASS
  - Not converted to zero — null preserved, not 0 — PASS

No broader null policy than commissioned policy created — policy bounded to demonstrated HDFCBANK.NS +1q case per commissioning act §7 — PASS.

---

## 8. M-1 / M-3 SEPARATION

- **M-1 remains:** `DEPLOYED/DEPOSITED — ACCEPTANCE PASS` — 40 observations, 39 valid AnalystEstimatePayload, 1 provider-null, 5 entities, 6110B raw, SHA-256 `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254`, observation `2026-09-27T18:18:58Z`, D07 contract byte-identical, SourceClassification includes TIGZIG_YAHOO_FINANCE_ESTIMATES
- **M-3 becomes:** `ESTABLISHED BY THIS ACT` — only if every independent provenance invariant passes — all checks PASS, therefore M-3 ESTABLISHED for already-deposited prospective D07 dataset only
- **M-3 not declared merely because dataset exists:** PASS — independent cross-artifact lineage verification performed (§3-§7), byte counts and SHA-256 recalculated from actual files, observations compared against raw response, identity/metrics/periods/numerics verified, temporal boundaries verified, null observation verified

---

## 9. CONTRACT PRESERVATION

- **D07 contract:** `src/contracts/d07_estimates.ts` — 1959B SHA-256 `7112f8ac6eaacfbf022c9fd93df3be220e16c4204069bd2217aa3a1b2921d462` — byte-identical to M-1 state `62330df` and to pre-M-1 state `b0faa13` — verified via `sha256sum` and `git show HEAD:src/contracts/d07_estimates.ts` — PASS
- **No expansion to add publicationTime, effectiveTime, revisionSeq, sourceAsOf, or other unsupported fields:** PASS — D07 contract still contains only `companyId`, `metric`, `targetPeriod`, `consensusMean`, `consensusMedian?`, `highEstimate`, `lowEstimate`, `analystCount`, `currency`, `asOfDate` — no new fields added
- **SourceClassification:** `src/contracts/types.ts` — 1276B SHA-256 `6b567a398e45f1ffe3c7131c940ccb39be417752225c64f227fd6256479fd0c4` — includes `TIGZIG_YAHOO_FINANCE_ESTIMATES` added in M-1 gate to support commissioned provenance — D07 contract unchanged, types.ts change is minimal necessary evidence artifact for M-3, not D07 contract expansion

If contract modification appeared necessary, STOP would have been triggered — not applicable, PASS.

---

## 10. MINIMAL GOVERNANCE RECORD — THIS ACT

This act records M-3 provenance establishment for already-deposited prospective D07 dataset only.

**Exact artifacts:**

- **Dataset artifact:** `src/intelligence/d07_prospective_estimates_observation_dataset.ts` — 53618B SHA-256 `eda08b8b3d8c600ccdaac4b61a9b4001dd9638eb76cdb015d544744fd6701f03` — build-time TS import, 40 observations, 39 valid, 1 null
- **Raw-response artifact:** `src/intelligence/d07_prospective_estimates_raw_response.json` — 6110B SHA-256 `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254` — exact provider bytes, 5 entities, 20 earnings, 20 revenue
- **D07 contract artifact:** `src/contracts/d07_estimates.ts` — 1959B SHA-256 `7112f8ac6eaacfbf022c9fd93df3be220e16c4204069bd2217aa3a1b2921d462` — byte-identical
- **SourceClassification artifact:** `src/contracts/types.ts` — 1276B SHA-256 `6b567a398e45f1ffe3c7131c940ccb39be417752225c64f227fd6256479fd0c4`
- **M-1 commissioning act:** `evidence/intelligence-data-supply-governance/D07-M1-PROSPECTIVE-ESTIMATES-OBSERVATION-DATASET-COMMISSIONING-ACT.md` — 45681B SHA-256 `9c0f2975af367da680edd303627cbb0ad9092b4dc37e5b3134052b2b49871e9d`

**Verification results:**

- Provenance-chain verification: PASS (§3)
- Identity verification: PASS — 5 deterministic mappings
- Temporal-boundary verification: PASS — OBSERVATION_TIME ESTABLISHED, PUBLICATION_TIME NOT ESTABLISHED, SOURCE_AS_OF NOT PROVIDED, HISTORICAL_PIT NOT ESTABLISHED, EFFECTIVE_TIME NOT ESTABLISHED, REVISION_SEQ NOT ESTABLISHED, DATA_VERSION NOT PROVIDED
- Null-observation verification: PASS — HDFCBANK.NS +1q retained with quality PROVIDER_NULL, not numeric, not dropped, not zero
- Contract-preservation: PASS — D07 contract byte-identical
- Acceptance tests: 11/11 PASS (from M-1) + 9/9 cross-artifact lineage PASS (M-3)

**Limitations explicitly retained (per commissioning act and provider designation act):**

- `HISTORICAL_PIT = NOT ESTABLISHED` — no historical publication-time/PIT archive, no historical backfill, no retroactive reconstruction
- `PUBLICATION_TIME = NOT ESTABLISHED` — provider does NOT supply publicationTime, do NOT manufacture publicationTime=acquisitionTime
- `EFFECTIVE_TIME = NOT ESTABLISHED`
- `REVISION_SEQ = NOT ESTABLISHED` — do NOT fabricate revisionSeq=1, do NOT infer revisions from repeated observations
- `SOURCE_AS_OF = NOT PROVIDED`
- `DATA_VERSION = NOT PROVIDED`
- `PROSPECTIVE_OBSERVATION = QUALIFIED` — observation distinct from publication, from authorization date 2026-09-27 onward only
- `consensusMedian = ABSENT/NULL` — provider does not supply median, do NOT calculate, do NOT introduce another provider
- Provider-null policy bounded to demonstrated HDFCBANK.NS +1q case — may retain as source observation, NOT numeric, no silent zero, no silent drop, explicit quality
- Entitlement: `LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION` — commercial/redistribution NOT ESTABLISHED, no unrestricted licensed commercial data
- D06 News: IN SCOPE but NO PROVIDER DESIGNATED BY THIS ACT or M-3 act
- D08 Macro: DEFERRED
- D09 Alt-data: CONDITIONAL/FEASIBILITY-GATED
- D115 Identity/Company Binding: WITHHELD / UNRESOLVED / NOT AUTHORIZED
- D91/D88 Macro Relief: NOT GRANTED
- Production: NOT AUTHORIZED — productionEligible false, no live provider execution at runtime, no runtime API integration
- No M-3 evidence beyond this act and already-deposited artifacts

**This act states:**

> I, RAMKI, as M-3 Provenance Accepting Authority, establish M-3 provenance for the already-deposited prospective D07 dataset only — `src/intelligence/d07_prospective_estimates_observation_dataset.ts` (53618B, SHA-256 `eda08b8b3d8c600ccdaac4b61a9b4001dd9638eb76cdb015d544744fd6701f03`) derived from exact retained raw response `src/intelligence/d07_prospective_estimates_raw_response.json` (6110B, SHA-256 `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254`) acquired at `2026-09-27T18:18:58Z` via request `https://yfin-h.tigzig.com/v1/get-estimates/?tickers=RELIANCE.NS,INFY.NS,TCS.NS,HDFCBANK.NS,AXISBANK.NS` — 5 entities deterministic, 40 observations, 39 valid, 1 provider-null (HDFCBANK.NS earnings +1q), 0 invalid, earnings 20, revenue 20, low≤mean≤high PASS, analystCount≥0 PASS, currency INR PASS, no median synthesized, no unsupported field fabricated, observation time ESTABLISHED distinct from publication time NOT ESTABLISHED, sourceAsOf NOT PROVIDED, historical PIT NOT ESTABLISHED, effectiveTime NOT ESTABLISHED, revisionSeq NOT ESTABLISHED, dataVersion NOT PROVIDED, replayConstraintApplied true, D07 contract byte-identical `7112f8ac6eaacfbf022c9fd93df3be220e16c4204069bd2217aa3a1b2921d462`, M-1 remains DEPLOYED/DEPOSITED — ACCEPTANCE PASS, M-3 ESTABLISHED BY THIS ACT for prospective D07 dataset only.

**What this act does NOT imply (explicit negative boundaries):**

- Historical PIT — NOT ESTABLISHED, no claim
- Provider publication history — NOT ESTABLISHED, no publicationTime history
- Unrestricted licensing — NOT ESTABLISHED, LIMITED PERSONAL-USE-ONLY only
- Commercial redistribution rights — NOT GRANTED, NO REDISTRIBUTION
- D06/D08/D09 commissioning — NOT commissioned (D06 IN SCOPE but NO PROVIDER, D08 DEFERRED, D09 CONDITIONAL)
- D115 production identity — WITHHELD / NOT AUTHORIZED
- Production readiness — NOT AUTHORIZED, non-deployed, non-production, LOCAL_FIXTURE_AND_OFFLINE_DEV
- Runtime provider access — NOT AUTHORIZED, zero live fetch at runtime, build-time import only
- Certification beyond this M-3 boundary — NOT GRANTED, this is provenance acceptance only, not production certification

---

## 11. AUTHORITY STATES AFTER THIS M-3 ACT

| Authority | State after this M-3 act |
| --- | --- |
| `D8_INTELLIGENCE_WORKSTREAM_DESIGNATION` | ESTABLISHED BY `gate-y-intel-data-supply-designation-selection-2026-09-27-001` — unchanged |
| `INTELLIGENCE_DATA_SUPPLY_GATE` | SELECTED / OPENED — unchanged |
| `M-2_INTELLIGENCE_DATA_SUPPLY_AUTHORITY` | ESTABLISHED — unchanged |
| `D8_DOMAIN_SCOPE_DETERMINATION` | ESTABLISHED — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL — unchanged |
| `D07_SOURCE_PROVIDER_DESIGNATION` | ESTABLISHED — TIGZIG Yahoo Finance estimates route SELECTED prospective only — unchanged |
| `D07_PROSPECTIVE_ACQUISITION_QUALIFICATION` | ESTABLISHED — INFY.NS PASS + MULTI_ENTITY PASS — unchanged |
| `M-1_D07_PROSPECTIVE_ESTIMATES_OBSERVATION_DATASET` | **COMMISSIONED** by `b0faa13` + **DEPLOYED/DEPOSITED — ACCEPTANCE PASS** at `62330df` — 40 obs, 39 valid, 1 null, 5 entities, 6110B raw SHA `9f76e6a...`, observation `2026-09-27T18:18:58Z` |
| `M-1_DEPOSITION` | **DEPLOYED/DEPOSITED — ACCEPTANCE PASS** — unchanged from `62330df` |
| `M-3_PROVENANCE` | **ESTABLISHED BY THIS ACT** — `d07-m3-prospective-estimates-provenance-acceptance-2026-09-27-001` — provenance chain verified from actual deposited artifacts: raw 6110B SHA `9f76e6a...` → dataset 53618B SHA `eda08b8b...` → 40 observations, deterministic identity, temporal boundaries, null observation, contract preservation |
| `D06_NEWS_PROVIDER_DESIGNATION` | NOT GRANTED — IN SCOPE but NO PROVIDER |
| `D08_MACRO_ACTIVATION` | NOT GRANTED — DEFERRED |
| `D09_ALTDATA_ACTIVATION` | NOT GRANTED — CONDITIONAL |
| `D07_HISTORICAL_PIT` | NOT ESTABLISHED |
| `PUBLICATION_TIME` | NOT ESTABLISHED |
| `EFFECTIVE_TIME` | NOT ESTABLISHED |
| `REVISION_SEQ` | NOT ESTABLISHED |
| `SOURCE_AS_OF` | NOT PROVIDED |
| `DATA_VERSION` | NOT PROVIDED |
| `HISTORICAL_PIT` | NOT ESTABLISHED |
| `OBSERVATION_TIME` | ESTABLISHED — `2026-09-27T18:18:58Z` |
| `PROSPECTIVE_OBSERVATION` | QUALIFIED |
| `CONSENSUS_MEDIAN` | ABSENT/NULL |
| `PROVIDER_NULL_POLICY` | ESTABLISHED — HDFCBANK.NS +1q retained as source observation, NOT numeric, no silent zero/drop, explicit quality |
| `ENTITLEMENT` | LIMITED PERSONAL-USE-ONLY / RESEARCH / EDUCATIONAL / NON-COMMERCIAL / NON-SUBLICENSEABLE / REVOCABLE / NO REDISTRIBUTION |
| `IMPLEMENTATION_AUTHORITY` | NOT GRANTED beyond deposited build-time dataset — no runtime API integration |
| `PRODUCTION_AUTHORITY` | NOT GRANTED — productionEligible false |
| `D115_IDENTITY_AUTHORITY` | WITHHELD / UNRESOLVED / NOT AUTHORIZED |
| `D91/D88_MACRO_RELIEF` | NOT GRANTED |

---

## 12. RETAINED GOVERNANCE INVARIANTS

| Invariant | State after this M-3 act |
| --- | --- |
| Operating mode | `NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV` — unchanged |
| Sole data-authorizing acts repo-wide | `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` (D05) + M-2 act + provider designation act (TIGZIG prospective D07) + M-1 commissioning act + M-1 deposition `62330df` + **this M-3 act** `d07-m3-prospective-estimates-provenance-acceptance-2026-09-27-001` (provenance for already-deposited prospective D07 only) |
| BI-01..BI-08 · D05/P04 · D114 · `src/ui` records | FROZEN — unchanged |
| Intelligence nav status | `partial` — unchanged |
| Intelligence surface | `PARTIAL / PRESENTATIONAL ONLY / NO GOVERNED OFFLINE PAYLOAD` → now `GOVERNED OFFLINE D07 PROSPECTIVE PAYLOAD DEPOSITED + PROVENANCE ESTABLISHED` for D07 only, still no D06/D08/D09 payload |
| D07 contract | Byte-identical `7112f8ac...` — unchanged |
| D115 C/D | WITHHELD — unchanged |
| runtimeCompanyId | UNRESOLVED — unchanged |
| D91/D88 | LIVE-only macro; no relief — unchanged |
| productionEligible | false — unchanged |
| External live sockets | 0 — unchanged |
| Windows visual acceptance | NOT CLAIMED BY ARENA — unchanged |
| Existing governance acts | Byte-identical, frozen — this act adds only new file |

---

## 13. NEXT AUTHORITY GATE (not authorized by this act)

M-3 provenance established for already-deposited prospective D07 dataset only.

Next gates remain separate RAMKI determinations, not automatically proceeded:

- D06 News provider designation and dataset (if authorized)
- D08 Macro (deferred, requires D91/D88 relief)
- D09 Alt-data (conditional/feasibility-gated, requires approvalRef)
- UI integration for D07 prospective estimates (presentation-only authority, if authorized)
- Runtime integration (if authorized, but must preserve zero live provider execution at runtime per D05 pattern)
- D115 identity/company binding (withheld)
- Production readiness / certification (not authorized by this M-3 act)

The deposition, provenance, and acceptance remain governed by this act and prior M-1 act. Arena must not manufacture additional dataset, adapter, or provenance beyond actual deposited evidence.

---

**End of Authority Act. M-3 Provenance ESTABLISHED — for already-deposited prospective D07 dataset only — raw 6110B SHA-256 `9f76e6a2b54572ec4800383cb66f026683f94fec7d61e1cffff0157e98bf5254` → dataset 53618B SHA-256 `eda08b8b3d8c600ccdaac4b61a9b4001dd9638eb76cdb015d544744fd6701f03` → 40 observations, 39 valid, 1 provider-null (HDFCBANK.NS +1q), 0 invalid, 5 deterministic EQ_* identities, temporal boundaries OBSERVATION_TIME ESTABLISHED / PUBLICATION_TIME NOT ESTABLISHED / SOURCE_AS_OF NOT PROVIDED / HISTORICAL_PIT NOT ESTABLISHED / EFFECTIVE_TIME NOT ESTABLISHED / REVISION_SEQ NOT ESTABLISHED / DATA_VERSION NOT PROVIDED, D07 contract byte-identical, M-1 remains DEPLOYED/DEPOSITED — ACCEPTANCE PASS, M-3 ESTABLISHED BY THIS ACT, no historical PIT, no publication history, no unrestricted licensing, no commercial redistribution, no D06/D08/D09 commissioning, no D115, no production, no runtime provider access, no certification beyond M-3.**

