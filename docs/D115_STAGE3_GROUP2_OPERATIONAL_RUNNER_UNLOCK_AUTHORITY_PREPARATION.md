# IIPS D115 Stage 3 — Group 2 Operational Runner Unlock
## Authority Preparation Package

**Activity:** strictly read-only forensic/design preparation  
**Prepared:** 2026-09-17  
**Forensic baseline requested and inspected:** `75b133ad8202fea119e0600276d5bda4cb73a8cf`  
**Baseline branch named by the request:** `arena/01a0a438-iips-production-market-data`  
**Classification:** PREPARATION ONLY — NOT AN ADJUDICATION, IMPLEMENTATION, UNLOCK, CERTIFICATION, OR PRODUCTION AUTHORIZATION

---

## A. Purpose and scope

This package defines the evidence and safeguards required by a **separate D115 Stage 3 operational gate** before Life Insurance or Capital Markets may pass through `DynamicEngineRunner`. It does not answer the authority questions, authorize code, or infer runner readiness from Stage 2 calibration acceptance.

Inspection covered the D112-A Security Master, D112-C EOD valuation synthesizer, D112-D runner, D112-E transport, D113-QCAL09 Banking unlock and acceptance, D115 Stage 2 profiles/implementation/acceptance, Group 2 engines and frozen assets, runner/transport tests, valuation and runner DTOs, and current open-item records.

No implementation, test, configuration, engine, fixture, runner, input-builder, calibration, Banking, Healthcare, or Hospitality file is changed by this preparation.

## B. Authoritative baseline

At requested baseline `75b133ad8202fea119e0600276d5bda4cb73a8cf`:

- D115 Stage 2 is recorded **ACCEPTED / COMPLETE / FROZEN**.
- Immutable valuation profiles are `insurance-valuation-calibration-1.0.0.json` and `capital-markets-valuation-calibration-1.0.0.json`.
- Life Insurance is calibrated to P/EV (`IM-VAL-001`); AMC to Market Cap/AUM percent (`CM-VAL-001`); Non-AMC to P/E (`CM-VAL-002`).
- Stage 2 acceptance expressly leaves runner unlock to Stage 3 under Q-GRP2-CAL-10.
- Banking is unlocked under accepted D113-QCAL09 and is not in scope for change.
- Healthcare and Hospitality remain blocked under unresolved Decision C2.
- ADR-01 sector engines and golden fixtures remain frozen boundaries.

This review inspected the requested commit directly. No Windows, browser, external network, live-provider, entitlement, or production-LIVE verification was performed or is claimed.

## C. Exact current runner state

`frontend/server/dynamic-runner/dynamic-engine-runner.ts` contains:

```ts
const blockedSectors = ['Insurance', 'Capital Markets', 'Healthcare', 'Hospitality'];
```

The check occurs after EOD validation and Security Master resolution but before fundamentals retrieval. A resolved blocked security returns `SECTOR_UNSUPPORTED`, null composite/verdict, empty pillars, and development provenance. In practice, current Group 2 exemplars do not reach that check: `HDFCLIFE` and `BSE` are only `excludedCandidateMappings` in Security Master 1.0.0, so they resolve as `UNMAPPED_SECURITY`.

The runner presently loads runner calibration/fixture support only for eight original sectors plus Banking. `DynamicEngineInputBuilder` likewise loads no Insurance or Capital Markets golden reference, supplies no Group 2 denominators, and has no Group 2 valuation-key mapping. Therefore deleting two strings from `blockedSectors` alone would merely move Group 2 to `FUNDAMENTALS_UNAVAILABLE` or `ENGINE_INPUT_INCOMPLETE`; it would not constitute a valid unlock.

### Seven distinct dimensions

| Dimension | Current finding | Stage 3 implication |
|---|---|---|
| A. Runner eligibility | **BLOCKED** by explicit list; exemplars also unmapped | Authority must approve narrowly scoped eligibility and Security Master evidence must resolve eligible entities. |
| B. Dynamic input construction | **BLOCKED**: no Group 2 fixture registration, denominators, segmentation, or valuation-key assembly | Implement and validate explicit Life/AMC/Non-AMC construction; reject omissions. |
| C. Valuation calibration availability | **READY for development/reference evaluation**: profiles 1.0.0 load in synthesizer | Preserve profiles byte-for-byte; profile availability alone proves no other dimension. |
| D. Sector engine execution | **UNPROVEN in D112-D path**: runner computes a generic composite and assembles input but does not invoke `InsuranceEngine`/`CapitalMarketsEngine` | Authority must define whether Stage 3 means current runner scoring or actual plugin execution; evidence must match that definition. |
| E. Transport DTO availability | **PARTIAL / BLOCKED for Group 2**: generic result/provenance shapes exist, but evidenced universes and fallback prices include only TCS, RELIANCE, HDFCBANK | Add Group 2 route/serialization evidence without snapshot fallback or fabricated EOD. |
| F. Provenance/certification state | **PARTIAL**: development stamps exist; runner lacks explicit certification-state and calibration-profile fields | Preserve development boundary and extend DTOs as specified below. |
| G. Production eligibility | **BLOCKED / NOT AUTHORIZED** | Independent production requirements remain; technical unlock is not production authorization. |

## D. Insurance readiness matrix

### D.1 Valuation prerequisites (Life only, P/EV)

| Required input/control | Source/use | Status | Finding |
|---|---|---|---|
| Security identity and sector | Security Master | **BLOCKED** | `HDFCLIFE` is excluded, not an active entry. Authoritative mapping evidence is required. |
| Life classification | `insuranceCategory` | **BLOCKED** | Builder supplies none. Synthesizer currently defaults missing category to `Life`; Stage 3 must not infer eligibility by default. Require explicit `Life`/`Life Insurance`. |
| Positive EOD close | request / EOD store | **READY** contractually; **UNPROVEN** for Group 2 integration | Runner validates finite `>0`; no Group 2 store-path evidence exists. |
| EOD trade date/hash/source | request/store | **PARTIAL** | Date and optional hash flow; absent hash becomes `UNSPECIFIED_LOCAL_SHA256`; source identity is not a structured field. |
| Shares outstanding | market-cap and EVPS basis | **BLOCKED** | No Insurance denominator in builder. |
| Embedded Value (`IM-006`) | P/EV denominator | **BLOCKED** | Supported by valuation contract/synthesizer and fixture-only evidence, but builder supplies none. Production value is an **EXTERNAL DEPENDENCY** under OI-FUND-01/company actuarial disclosures. |
| EV finite and `>0` | fail-closed guard | **READY** in synthesizer | Missing/non-finite and `<=0` reject. Preserve exactly. |
| Solvency ratio (`IM-002`) | minimum `1.50` | **BLOCKED** | Builder supplies none. Worse, synthesizer only enforces threshold when present; missing solvency currently passes. Stage 3 must require finite solvency and reject missing or `<1.50`. Production value is an **EXTERNAL DEPENDENCY**. |
| Exceptional-event flag/state | unconditional exclusion | **UNPROVEN / BLOCKED** | `true` rejects, but builder supplies no governed flag and absence passes. Authority must define a required, trustworthy event state; unresolved/missing state must fail closed if required. |
| Calibration profile | P/EV `IM-VAL-001`, v1.0.0 | **READY** | Loaded by synthesizer; exact boundaries are Stage 2 tested. Must remain immutable. |
| Engine metrics IM-001…IM-008 | actual `InsuranceEngine` scoring | **BLOCKED / UNPROVEN** | Builder supplies no Insurance fixture. Engine score code defaults missing metrics to neutral values; this conflicts with Stage 3 “missing required inputs fail closed” unless required metrics are validated before execution. |
| Governance/catastrophe flags | Insurance decision | **UNPROVEN** | Optional in engine; no dynamic source or Stage 3 missing-state policy exists. |

The Insurance engine consumes IM-001 Combined Ratio, IM-002 Solvency, IM-003 APE, IM-004 VNB, IM-005 Persistency, IM-006 EV, IM-007 Expense Ratio, IM-008 Investment Yield, plus governance/catastrophe flags. Stage 2 valuation only proves IM-006-based P/EV scoring and a solvency guard; it does not prove the full engine payload. Authority must designate the minimum required engine set. Until then, full sector-engine execution is **UNPROVEN**.

## E. Capital Markets readiness matrix

### E.1 Common and segmentation controls

| Required input/control | Status | Finding |
|---|---|---|
| Security identity/sector | **BLOCKED** | `BSE` is excluded, not active. At least one AMC and one Non-AMC require authoritative mappings. |
| Explicit population category | **BLOCKED** | Builder supplies none. Synthesizer defaults category to `NON-AMC`; Stage 3 must reject missing/unknown category instead of default-routing. |
| Positive EOD close | **READY** contractually; **UNPROVEN** integration | Finite `>0` guard exists; no Group 2 EOD route evidence. |
| Positive shares outstanding | **BLOCKED** | Required for market cap; absent in builder. |
| Exceptional-event state | **UNPROVEN / BLOCKED** | `true` rejects, but no governed dynamic source; missing passes. |
| Calibration profile 1.0.0 | **READY** | Both metric tables load; preserve immutably. |
| Engine metrics CM-001…CM-008 and flags | **BLOCKED / UNPROVEN** | Builder has no fixture; engine defaults missing metrics to neutral values. Required engine payload has not been authorized. |

### E.2 AMC — Market Cap / AUM only

| Required input/control | Status | Finding |
|---|---|---|
| Explicit `AMC`/`Asset Management` classification | **BLOCKED** | Must come from governed classification, not denominator presence or fallback. |
| Total AUM (`CM-001`) finite and `>0` | **BLOCKED** | Contract and synthesizer support it; builder does not. Production AUM is an **EXTERNAL DEPENDENCY** (authoritative fundamentals/disclosures). |
| Market cap (`price × shares`) | **BLOCKED** end-to-end | Formula exists; shares unavailable. |
| MCap/AUM percent route | **READY** in synthesizer | Exact metric and bands exist. |
| No EPS/P/E fallback | **READY** in synthesizer for explicit AMC; **UNPROVEN** runner-wide | AMC branch ignores EPS. Must test malformed AMC cannot enter Non-AMC. |

### E.3 Non-AMC — P/E only

| Required input/control | Status | Finding |
|---|---|---|
| Explicit `NON-AMC` classification | **BLOCKED** | Missing category currently defaults to Non-AMC; unacceptable for Stage 3. |
| EPS finite and `>0` | **BLOCKED** | Builder supplies none. Production EPS is an **EXTERNAL DEPENDENCY**. |
| Net-income alternative | **POLICY CONFLICT / UNPROVEN** | Synthesizer currently falls back from invalid/missing EPS to positive LTM net income. The requested Stage 3 rule says invalid/missing EPS must fail closed. Authority must decide whether net-income-derived P/E is forbidden; absent contrary adjudication, Stage 3 must remove/disable this within Group 2 runtime behavior without touching profile bands. |
| P/E route | **READY** in synthesizer | Exact profile bands exist. |
| No AUM/AMC fallback | **READY** for explicit Non-AMC; **UNPROVEN** runner-wide | Non-AMC ignores AUM, but explicit category validation is absent. |

The Capital Markets engine consumes CM-001 AUM, CM-002 AUM Growth, CM-003 TER, CM-004 Cost-to-Income, CM-005 Recurring %, CM-006 Market Share, CM-007 Brokerage Income, CM-008 Net Flows, plus regulatory/governance/market-cycle flags. Stage 2 does not prove these full inputs for either segment.

## F. D113-QCAL09 comparison — pattern only

Banking required: Stage 2 P/ABV profile and synthesizer; accepted separate unlock authority; active `HDFCBANK` Security Master mapping; Banking golden fixture registration; representative tangible-net-worth/net-NPA/shares denominators; `pAbv` input mapping; runner calibration registration; removal only of Banking from blocked sectors; runner and Decision Matrix/Screener/Executive tests; fail-closed distressed ABV and exceptional-event guards; development provenance; full regressions; and separate acceptance/durability reconciliation.

Group 2 already satisfies the analogous **valuation-profile and synthesizer** portion and has Stage 2 exact-boundary/fail-closed tests. It does not satisfy mappings, dynamic fundamentals, input assembly, Group 2 transport universes, or Stage 3 acceptance.

Differences:

- **Insurance:** Life-only eligibility; explicit classification; EV and mandatory solvency; exceptional-event state; Non-Life rejection; P/EV mapping; full IM engine requirements remain unresolved.
- **Capital Markets:** two mutually exclusive populations and methods; explicit category; AMC AUM vs Non-AMC EPS; no category or methodology fallback; full CM engine requirements remain unresolved.
- **Additional safeguards:** no default `Life` or `NON-AMC`; no EPS-to-net-income substitution unless expressly authorized; eligibility allowlist/classification; missing event state policy; segment-specific tests; profile identity in provenance; source/vintage/hash integrity; no neutral defaults for inputs declared required.

Banking remains unchanged; its representative static denominator precedent does not prove that static Group 2 denominators are authoritative or suitable.

## G. Fail-closed requirements

Stage 3 runtime must return an explicit non-success state, null composite/verdict/valuation score where applicable, and no alternate-method or SNAPSHOT substitution when any required condition fails.

1. **Insurance:** reject non-Life; missing/unknown category; missing/non-finite/non-positive shares or EOD; missing/non-finite/non-positive EV; missing/non-finite solvency or solvency `<1.50`; exceptional event; unresolved exceptional-event state if made mandatory; missing required IM/decision inputs; missing profile or bands.
2. **AMC:** reject missing/unknown/non-AMC category; missing/non-finite/non-positive AUM; missing/non-positive shares/EOD; exceptional event; missing required CM/decision inputs; missing profile/bands. Never use P/E.
3. **Non-AMC:** reject missing/unknown/AMC category; missing/non-finite/non-positive EPS; missing/non-positive shares/EOD; exceptional event; missing required CM/decision inputs; missing profile/bands. Never use AUM valuation. Under the stated Stage 3 requirement, do not use net income as an EPS fallback.
4. **All:** unmapped/ambiguous/inactive security remains `UNMAPPED_SECURITY`; invalid EOD remains `INVALID_EOD`; Healthcare/Hospitality remain `SECTOR_UNSUPPORTED`; no generic default category, neutral score, fabricated price, fabricated denominator, or cross-methodology fallback may turn incomplete Group 2 input into success.
5. `exceptionalEventFlag === true` remains unconditional `UNAVAILABLE`; false/absence semantics require explicit Stage 3 authority and provenance.

## H. Provenance and certification requirements

Dynamic Group 2 output must preserve the development/reference boundary:

| Field | Current implementation | Stage 3 requirement |
|---|---|---|
| `dataMode` | Runner/valuation/transport: `LIVE` | Retain only as execution-plane label; never present as production certification. |
| `freshness` | `DEVELOPMENT_MIXED_VINTAGE` | Required unchanged while reference fundamentals are used. |
| Calibration profile ID/version | Valuation DTO has optional ID/version; runner and transport DTOs omit them | Propagate exact `insurance-valuation-calibration` or `capital-markets-valuation-calibration`, version `1.0.0`, through runner and transport. |
| Security Master version | Runner/transport hard-code `1.0.0` | Emit resolved registry/mapping version; prove eligible entity mapping. |
| EOD source/as-of/hash | As-of/hash fields exist; missing/synthetic placeholders are permitted; transport uses fixed hash | Emit actual source identity, observation date, and archive/record hash. Placeholders must be clearly development-only and cannot support production claims. |
| Fundamentals vintage/source | Vintage `v1.1-reference`; no structured source/hash/as-of | Add source, as-of/vintage, dataset/version/hash where available; retain reference label. |
| Valuation methodology/version | Runner hard-codes `D113-STAGE2`; transport hard-codes `D112-C` | Emit Group 2 method (`P/EV`, `MCap/AUM`, or `P/E`), Stage 2/profile version, and prevent inconsistent hard-coded labels. |
| Engine version | `1.0.0` exists | Retain and distinguish generic runner from sector plugin version if plugin execution occurs. |
| Certification state | Transport has `DEVELOPMENT_HARNESS_VERIFIED_ONLY`; runner DTO lacks it | Add/propagate explicit certification state on runner and every transport. |
| Production eligibility | Not a structured field; semantics say not certified | Add explicit `productionEligible: false` (or governed equivalent) for this gate; do not infer from status. |
| Execution status | Implemented | Preserve exact fail-closed status end-to-end. |

Successful Stage 3 technical execution should therefore state, at minimum: `LIVE` execution plane, `DEVELOPMENT_MIXED_VINTAGE`, exact calibration profile/version, Security Master version, actual or explicitly development-placeholder EOD lineage, reference fundamentals lineage, valuation method/version, `DEVELOPMENT_HARNESS_VERIFIED_ONLY`, and production-ineligible/not-authorized semantics.

## I. Future Stage 3 implementation scope (not authorized here)

Minimum implementation would have to address all of the following, not merely edit `blockedSectors`:

1. Authoritative active Security Master entries and explicit Life/AMC/Non-AMC classification.
2. Group 2 development fundamentals/source adapters with required shares, EV, solvency, AUM, or EPS and event state.
3. Group 2 fixture loading and segment-specific assembly keys, without changing ADR-01/golden assets.
4. Mandatory preflight validation before the synthesizer and before any engine execution.
5. Insurance/Capital Markets runner calibration registration if runner-side profiles are genuinely used; otherwise removal of dead ambiguity, subject to authority.
6. Narrow removal of only Insurance and Capital Markets from the runner block once all evidence passes; Healthcare/Hospitality unchanged.
7. Explicit definition and implementation of “sector engine execution” versus the current generic 72/15% runner formula.
8. Group 2 inclusion in appropriate transport universes with real development EOD records—not silent representative-price fallback.
9. Provenance/certification DTO extensions and end-to-end propagation.
10. Tests, regression evidence, and a separate acceptance/durability reconciliation.

## J. Required Stage 3 verification plan

### Minimum tests

| Area | Acceptance criterion / expected evidence |
|---|---|
| Insurance eligibility/routing | Mapped, explicitly Life security with complete inputs reaches P/EV and only P/EV; result has expected identity/method/profile. |
| Non-Life rejection | General, Health, Reinsurance, unknown, and missing category fail closed with no score. |
| Capital Markets eligibility | Mapped Group 2 securities execute only with explicit supported segment and complete inputs. |
| AMC routing | AMC uses MCap/AUM; EPS presence does not alter route. Missing/zero/negative/non-finite AUM rejects. |
| Non-AMC routing | Non-AMC uses P/E; AUM presence does not alter route. Missing/zero/negative/non-finite EPS rejects; no net-income fallback under stated requirements. |
| Calibration resolution | Exact profile ID/version and metric code are selected; missing/corrupt/wrong-sector profile rejects. Profile files hash/byte equality against Stage 2. |
| Exact boundaries | P/EV: 1.8/2.4/3.2/4.0; AMC: 6/9/13/17%; Non-AMC: 18/26/38/52, including just-below/at boundary and rounding behavior. |
| Solvency/EV | Missing or invalid solvency rejects; 1.499… rejects; exactly 1.50 passes if all else valid. Missing/invalid/`<=0` EV rejects. |
| Exceptional events | `true` always `UNAVAILABLE` for all three populations, irrespective of otherwise valid inputs. Test missing/false according to adjudicated policy. |
| Missing engine inputs | Every authority-designated required IM/CM metric/flag tested individually; no neutral/default completion. |
| No cross-fallback | Malformed AMC never P/E; malformed Non-AMC never MCap/AUM; Insurance never another multiple; no LIVE-to-SNAPSHOT fallback. |
| Security Master | Ticker/ISIN/canonical resolution, temporal validity, ambiguity, pre-listing, inactive, and excluded candidate behavior. Version emitted. |
| EOD integration | Store record price/date/hash/source reaches result; absent/invalid record fails. Synthetic/default price cannot qualify as gate evidence. |
| Fundamentals integration | Correct entity, source, as-of/vintage, units, hash/version and segment fields propagate; stale/mismatched entity rejects. |
| Provenance/certification | Every success and failure emits consistent `DEVELOPMENT_MIXED_VINTAGE`, exact method/profile, EOD/fundamental lineage, certification state, `productionEligible=false`. |
| Transport DTOs | Direct runner, Screener, Decision Matrix, Executive, and Company routes serialize success/failure without omission or fallback; authorization tests remain. |
| Healthcare/Hospitality | Continue `SECTOR_UNSUPPORTED`; no mapping/transport side effect unlocks them. |
| Banking regression | Existing HDFCBANK P/ABV result, guards, DTOs, and provenance unchanged. |
| ADR-01/golden invariance | Hash/byte diff proves all engines, weights, calibrations and golden/expected fixtures outside authorized Stage 3 files unchanged. |
| D112 regression | Security Master, valuation synthesizer, runner, and transport suites all pass. |
| D113 regression | Banking scaffold/calibration/unlock suites all pass. |
| D114 regression | Market-data ingestion suites pass; no claimed live-provider verification. |
| D115 regression | Stage 1 and Stage 2 Group 2 suites pass plus new Stage 3 suites. |
| Determinism/durability | Repeated input gives byte-equivalent DTO; fresh checkout at exact commit reproduces suite; separate reconciliation records commit and remote parity. |

### Gate acceptance criteria

All tests pass with zero skipped/xfail relevant cases; negative cases return null outputs and explicit statuses; profiles and frozen assets are unchanged; only authorized files differ; code review maps every authority answer to implementation/test evidence; provenance is consistent across layers; production eligibility remains false; Healthcare/Hospitality and Banking invariants pass; and a separate Program Authority acceptance/durability act accepts the exact implementation commit. Test counts must be reported from actual execution, not forecast here.

## K. Production eligibility boundary

> **Technical runner unlock ≠ production LIVE authorization.**

A Stage 3 unlock, if later authorized and accepted, permits only the adjudicated technical development/reference execution. Production LIVE remains independently subject to:

- an authoritative automated fundamentals source, including EV, solvency, AUM, EPS and required engine/event inputs;
- production data rights, licenses and entitlements;
- production-grade source/as-of/hash provenance and certification;
- authentication, authorization, monitoring, stale-data, reconciliation, incident, replay and operational controls;
- authoritative Security Master and remaining market-data dependencies.

`OI-FUND-01` is not removed or reinterpreted. It blocks production LIVE even if technical runner execution is authorized, unless Program Authority later records its resolution. Runner status `DYNAMIC_EXECUTION_COMPLETED` and `dataMode: LIVE` do not establish provider authorization, entitlement, or production certification.

## L. Open dependency matrix

Statuses below preserve current records and separate technical Stage 3 from production tracks.

| Item | Current recorded subject/status | Stage 3 classification |
|---|---|---|
| OI-FUND-01 | Authoritative production fundamentals ingestion source; open blocked dependency | **DOES NOT BLOCK TECHNICAL STAGE 3** if expressly limited to governed reference fixtures; **BLOCKS PRODUCTION LIVE**. It becomes **BLOCKS TECHNICAL STAGE 3** if authority requires automated authoritative fundamentals for this gate. |
| OI-HIST-01 | 10-year historical Bhavcopy population pending authorized external access; core capability ready | **DOES NOT BLOCK TECHNICAL STAGE 3**; static profiles require no empirical lookback. Not by itself a Group 2 production-runner prerequisite unless separately mandated. |
| OI-P16-01 | Commercial NSE Cash Market EOD agreement; open/external | **EXTERNAL / COMMERCIAL**; **DOES NOT BLOCK TECHNICAL STAGE 3** using governed development EOD; **BLOCKS PRODUCTION LIVE commercial SFTP route**. |
| OI-P16-02 | Permitted retention/analytical-use determination; open/external | **EXTERNAL / COMMERCIAL**; **DOES NOT BLOCK TECHNICAL STAGE 3**; production/legal applicability remains authority-controlled and is not adjudicated here. |
| OI-P16-03 | Formal exchange SFTP user ID; open/external | **DOES NOT BLOCK TECHNICAL STAGE 3**; **BLOCKS PRODUCTION LIVE commercial SFTP route**. |
| OI-P16-04 | Static egress IP allowlisting; open/external/operational | **DOES NOT BLOCK TECHNICAL STAGE 3**; **BLOCKS PRODUCTION LIVE commercial SFTP route**. |
| OI-P16-05 | Production SSH key binding/mutual auth under controlling D107 definition; open/external | **DOES NOT BLOCK TECHNICAL STAGE 3**; **BLOCKS PRODUCTION LIVE commercial SFTP route**. |
| OI-P16-06 | Port 7010 active-active connectivity under controlling D107 definition; open/external | **DOES NOT BLOCK TECHNICAL STAGE 3**; **BLOCKS PRODUCTION LIVE commercial SFTP route**. |
| OI-DHAN-01 | Dhan Layer-1 token provisioning; external/commercial, required for Layer-1 live | **EXTERNAL / COMMERCIAL** and **NOT RELEVANT TO TECHNICAL STAGE 3** unless Dhan is separately selected as its EOD source; blocks Dhan Layer-1 live verification, not the development runner gate. |

The repository contains historical semantic conflicts for OI-P16 labels; D108-R1/D107 controlling definitions above are used. No open item is declared closed by this document.

## M. Authority questionnaire — unanswered

Program Authority must adjudicate, not this preparation:

1. **Q-GRP2-ST3-01** — Is Life Insurance eligible for runner unlock after all Stage 3 verification requirements pass?
2. **Q-GRP2-ST3-02** — Is Capital Markets eligible for runner unlock after all Stage 3 verification requirements pass?
3. **Q-GRP2-ST3-03** — Confirm Life-only Insurance scope.
4. **Q-GRP2-ST3-04** — Confirm AMC vs Non-AMC segmentation.
5. **Q-GRP2-ST3-05** — Confirm no valuation-methodology cross-fallback.
6. **Q-GRP2-ST3-06** — Confirm fail-closed behavior for all missing/invalid required inputs.
7. **Q-GRP2-ST3-07** — Confirm `exceptionalEventFlag` remains unconditional `UNAVAILABLE`.
8. **Q-GRP2-ST3-08** — Confirm calibration profiles remain immutable 1.0.0.
9. **Q-GRP2-ST3-09** — Confirm development/reference-only execution unless production eligibility is separately authorized.
10. **Q-GRP2-ST3-10** — Define the minimum evidence required before removing Insurance and Capital Markets from `blockedSectors`.
11. **Q-GRP2-ST3-11** — Confirm Healthcare and Hospitality remain blocked under unresolved Decision C2.
12. **Q-GRP2-ST3-12** — Confirm Banking remains unchanged.
13. **Q-GRP2-ST3-13** — Confirm Stage 3 implementation must have a separate acceptance/durability reconciliation.
14. **Q-GRP2-ST3-14** — Confirm runner unlock does not constitute production data entitlement or provider authorization.
15. **Q-GRP2-ST3-15** — Confirm OI-FUND-01 status and whether it blocks production LIVE eligibility even if technical runner execution is authorized.

Additional precision requested within Q-GRP2-ST3-06/10: define mandatory IM/CM engine inputs; require explicit category rather than current defaults; decide missing exceptional-event-state treatment; and confirm that Non-AMC must reject missing EPS rather than use current net-income fallback.

## N. Explicit items not proven

This preparation does **not** prove:

- that either Group 2 sector is eligible for unlock;
- that HDFCLIFE, BSE, an AMC, or any other Group 2 security has an authoritative active mapping;
- that dynamic Group 2 fundamentals exist in the builder or a production store;
- that static golden/reference values are entity-correct, current, licensed, or production-authoritative;
- that all IM-001…IM-008 or CM-001…CM-008 engine inputs and flags are available;
- that current optional/default category and solvency behavior meets Stage 3;
- that actual Insurance/CapitalMarkets plugin engines execute in the D112-D path;
- that generic runner composite/pillars represent ADR-01 sector-engine output;
- that Group 2 is present in transport universes or has non-fabricated EOD fallback behavior;
- that runner/transport provenance identifies complete source lineage or consistent Group 2 methodology;
- that `dataMode: LIVE` means production-certified;
- that OI-FUND-01, OI-HIST-01, OI-P16-01…06, or OI-DHAN-01 is resolved;
- production data rights, provider authorization, operational controls, Windows/browser behavior, live connectivity, or production eligibility;
- future code correctness, test counts, clean-checkout reproducibility, acceptance, or durability.

## O. Recommended sequencing

1. Program Authority answers Q-GRP2-ST3-01…15 and the additional precision questions, without changing Stage 2 profiles.
2. Freeze an implementation contract defining eligible entities, explicit segment taxonomy, mandatory valuation and engine inputs, event-state semantics, statuses, DTO fields, and development-only boundary.
3. Establish authoritative Security Master evidence for at least one Life, one AMC, and one Non-AMC test entity; keep Non-Life and unsupported categories fail-closed.
4. Establish governed reference-fundamental records and lineage for all mandatory fields; do not fabricate missing values.
5. Approve a narrow implementation file list and invariance hashes for Banking, Healthcare/Hospitality, ADR-01 engines, profiles, and golden assets.
6. Implement validation/input construction/provenance and tests before changing runner eligibility.
7. Remove only the two authorized block entries last, after all prerequisite suites pass locally; preserve Healthcare/Hospitality.
8. Execute the complete Stage 3 and D112–D115 regression plan and record exact commands/results.
9. Produce a separate acceptance/durability reconciliation against the exact implementation commit and remote branch.
10. Keep `productionEligible=false` until independent production authority resolves required fundamentals, rights, provenance, controls, and market-data dependencies.

---

**STOP CONDITION:** This document ends the preparation activity. No authority question is adjudicated; no Stage 3 implementation, runner unlock, production activation, calibration change, or sector modification is authorized or performed.
