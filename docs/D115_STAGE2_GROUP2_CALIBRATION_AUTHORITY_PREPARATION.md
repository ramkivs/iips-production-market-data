# IIPS D115-STAGE2: GROUP 2 (LIFE INSURANCE & CAPITAL MARKETS) NUMERICAL CALIBRATION
## AUTHORITY DECISION PREPARATION PACKAGE

**Document Reference:** `docs/D115_STAGE2_GROUP2_CALIBRATION_AUTHORITY_PREPARATION.md`  
**Governing Authority:** Program Authority (Sai / Ramki)  
**Context:** Preparation for Group 2 Stage 2 Numerical Calibration Adjudication (P/EV for Life Insurance; Market Cap / AUM and P/E for Capital Markets)  
**Status:** **AUTHORITY PREPARATION ONLY — STRICTLY READ-ONLY (ZERO MUTATION TO IMPLEMENTATION CODE, TESTS, OR RUNNER CONFIGURATION)**  
**Implementation Baseline:** Commit `d0c83f2a6729920adc933611bceb7df51fc29f08`  
**Acceptance & Durability Reconciliation Baseline:** Commit `37c8bef4312b21df42d1946ce3f49468c38d997a`  
**Branch:** `arena/01a0a438-iips-production-market-data` (100% remote parity with `origin`)  
**Preparation Date:** 2026-09-17  

---

## 1. Executive Summary & Purpose

Following the formal completion, acceptance, and durability reconciliation of **D115 Stage 1** (`docs/D115_STAGE1_GROUP2_VALUATION_SCAFFOLD_ACCEPTANCE_AND_DURABILITY_RECONCILIATION.md`, classification: $\mathbf{A}$ — ACCEPTED / COMPLETE / FROZEN), the foundational Layer-2.5 mathematical scaffolds for **Life Insurance** and **Capital Markets** (AMC & Non-AMC) are fully operational and verified in `EodValuationSynthesizer.ts`.

In strict adherence to governing directive **Q-GRP2-12 = C** (*"Numerical thresholds deferred; valid raw metrics emit status = CALIBRATION_PENDING, valuationScore = null"*), this document provides the formal **authority decision preparation package** required before any numerical scoring bands can be adjudicated, codified into versioned calibration profiles, or evaluated in runtime engines.

### Absolute Governance Safeguards Maintained:
1. **Zero Invented Thresholds:** Engineering has not selected, recommended, or coded numerical calibration thresholds (e.g. 90/75/60/45/20) or comparison band boundaries.
2. **Neutral Alternatives:** Multiple structural, historical, and peer calibration options are documented objectively with explicit trade-offs.
3. **No Dynamic Runner Unlock:** `Insurance` and `Capital Markets` remain strictly blocked (`SECTOR_UNSUPPORTED`) in `DynamicEngineRunner.ts` (line 114).
4. **Preservation of Settled Baselines:**
   - Banking dynamic execution remains fully operational, calibrated, and frozen per **D113-QCAL09**.
   - Certified ADR-01 composite engines (`InsuranceScoreEngine.ts`, `CapitalMarketsScoreEngine.ts`, `BankingScoreEngine.ts`) and all 13 sector golden fixtures remain 100% byte-identical.
   - Healthcare and Hospitality remain strictly blocked (`SECTOR_UNSUPPORTED`) with **Decision C2** untouched.
5. **Strictly Read-Only:** Zero lines of implementation source code, test suites, or configuration files are modified by this preparation package.

---

## 2. Life Insurance Calibration Architecture & Requirements

### 2.1 Scope & Frozen Architectural Mandates
Under ratified decisions **Q-GRP2-01 = E**, **Q-GRP2-02 = C**, **Q-GRP2-03 = A**, **Q-GRP2-04 = D**, and **Q-GRP2-05 = A**:
- **Target Population:** Restricted strictly to Indian listed Life Insurance institutions (e.g. HDFC Life, SBI Life, ICICI Prudential Life, Life Insurance Corporation of India).
- **Non-Life Exclusion:** General insurance, standalone health insurance, and reinsurance remain strictly excluded (`status: 'BLOCKED_UNCALIBRATED'`).
- **Valuation Multiple:** Price-to-Embedded Value (P/EV):
  $$\text{EVPS} = \frac{\text{Embedded Value}}{\text{sharesOutstanding}}, \quad \text{P/EV} = \frac{\text{eodClosePrice}}{\text{EVPS}} = \frac{\text{Market Capitalization}}{\text{Embedded Value}}$$
- **Denominator Source:** Reads Embedded Value (`embeddedValue`, corresponding to metric `IM-006` in `InsuranceMetrics.ts`).
- **Statutory Solvency Guard (Q-GRP2-05 = A):** If Solvency Ratio (`solvencyRatio` / `IM-002`) $< 1.50$ (statutory regulatory minimum mandated by IRDAI), synthesis fails closed with `status: 'UNAVAILABLE'` and reason `SOLVENCY_BELOW_REGULATORY_MINIMUM`.
- **Exceptional Event Guard (Q-GRP2-13 = A):** If `exceptionalEventFlag === true`, synthesis immediately fails closed with `status: 'UNAVAILABLE'` and reason `EXCEPTIONAL_EVENT_EXCLUDED`.

### 2.2 Denominator & Input Lineage
1. **Embedded Value (EV):** In Indian life insurance accounting, Embedded Value represents the sum of Adjusted Net Worth (ANW) and the Value of In-Force business (VIF), reflecting long-term policyholder cash-flow present value. EV is reported semi-annually or annually in audited public disclosures.
2. **Shares Outstanding:** Number of equity shares outstanding in Crores.
3. **EOD Close Price:** Official NSE CM-UDiFF EOD closing price in INR per share.
4. **Treatment of Distressed / Non-Positive EV:** If $\text{Embedded Value} \le 0$, the balance sheet is economically impaired; the synthesizer unconditionally fails closed with `status: 'UNAVAILABLE'` (never receives an arbitrary low score).
5. **Treatment of Missing / Stale Fundamentals:** If `embeddedValue` is missing from the input payload, the synthesizer fails closed with `status: 'UNAVAILABLE'` (or `BLOCKED_UNCALIBRATED` if unevidenced).

---

## 3. Capital Markets Calibration Architecture & Requirements

### 3.1 Sub-Sector Segmentation & Frozen Mandates
Under ratified decisions **Q-GRP2-06 = C**, **Q-GRP2-07 = A**, **Q-GRP2-08 = A**, and **Q-GRP2-10 = B**:
- **Population Segmentation:** Segmented into two mutually exclusive, non-overlapping analytical populations:
  1. **Asset Management Companies (AMCs)**
  2. **Non-AMC Entities (Brokerages, Exchanges / MIIs, Wealth Managers, Investment Banks)**
- **Strict Methodology Isolation:** Zero cross-methodology fallback. Providing EPS to an AMC does not invoke P/E; providing AUM to a broker does not invoke M-Cap / AUM.

### 3.2 AMC Sub-Sector: Market Cap / AUM Ratio (%)
- **Target Population:** Pure-play mutual fund asset managers (e.g. HDFC AMC, Nippon Life India AMC, UTI AMC, Aditya Birla Sun Life AMC).
- **Core Valuation Multiple:** Market Capitalization as a percentage of Total Assets Under Management:
  $$\text{Market Cap / AUM (\%)} = \left(\frac{\text{Market Capitalization}}{\text{Total AUM}}\right) \times 100 = \left(\frac{\text{eodClosePrice} \times \text{sharesOutstanding}}{\text{totalAum}}\right) \times 100$$
- **Denominator Source:** Reads Total AUM (`totalAum`, corresponding to metric `CM-001` in `CapitalMarketsMetrics.ts`).
- **Distressed / Non-Positive AUM Guard:** If Total AUM is missing, non-positive ($\le 0$), or non-finite, fails closed with `status: 'UNAVAILABLE'`.
- **Exceptional Event Guard (Q-GRP2-13 = A):** If `exceptionalEventFlag === true`, fails closed with `status: 'UNAVAILABLE'`.

### 3.3 Non-AMC Sub-Sector: Price-to-Earnings (P/E)
- **Target Population:** Retail brokerages (e.g. Angel One), exchanges and market infrastructure institutions (e.g. BSE Limited, MCX, CDSL, CAMS), wealth managers (e.g. 360 ONE), and investment banks.
- **Core Valuation Multiple:** Standard Price-to-Earnings (P/E):
  $$\text{P/E} = \frac{\text{eodClosePrice}}{\text{EPS}} \quad \text{or} \quad \frac{\text{Market Capitalization}}{\text{LTM Net Income}}$$
- **Denominator Source:** Reads `ltmEps` or `ltmNetIncome`.
- **Distressed / Negative Earnings Guard:** If EPS or Net Income is missing, non-positive ($\le 0$), or non-finite, fails closed with `status: 'UNAVAILABLE'`.
- **Exceptional Event Guard (Q-GRP2-13 = A):** If `exceptionalEventFlag === true`, fails closed with `status: 'UNAVAILABLE'`.

---

## 4. Calibration Governance: Neutral Methodology Options

To enable Program Authority adjudication of the numerical scoring schedules, four neutral calibration methodologies are evaluated across both sectors:

```
┌─────────────────────────────────┬───────────────────────────────┬───────────────────────────────┬──────────────────────────────┐
│ Methodology Alternative         │ Data Prerequisites            │ Key Advantages                │ Key Disadvantages            │
├─────────────────────────────────┼───────────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ Option A: Static Expert-        │ Institutional benchmarks,     │ 100% deterministic, zero time-│ Requires periodic authority  │
│ Calibrated Policy Bands         │ industry valuation literature,│ series drift, independent of  │ review; does not dynamically │
│ (Recommended Baseline)          │ historical cycle boundaries   │ external lookback data        │ adjust to regime shifts      │
├─────────────────────────────────┼───────────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ Option B: Historical Cycle      │ 5-to-10 year multi-cycle      │ Empirically anchored in Indian│ Requires populated historical│
│ Distribution (Percentiles)      │ time-series fundamental data  │ market cycles (pre/post COVID)│ archive (OI-HIST-01 blocker) │
├─────────────────────────────────┼───────────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ Option C: Peer Cross-Sectional  │ Active cross-sectional quotes │ Reflects instantaneous market │ Small peer sample size       │
│ Distribution                    │ across entire listed peer set │ sentiment and peer relativities (e.g. only 4 listed life ins)│
├─────────────────────────────────┼───────────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ Option D: Segment-Conditional   │ Granular franchise, quality,  │ Captures quality premiums for │ High complexity; risks       │
│ Multi-Tier Bands                │ and return metric matrices    │ top-tier franchises           │ circular scoring dependency  │
└─────────────────────────────────┴───────────────────────────────┴───────────────────────────────┴──────────────────────────────┘
```

### Detailed Evaluation of Methodology Options:

#### Option A: Static Expert-Calibrated Policy Bands
- **Description:** Establishes fixed, discrete, lower-inclusive, upper-exclusive numerical tiers codified directly in immutable versioned JSON profile assets (identical to the ratified `Q-CAL-01 = D` Banking precedent).
- **Advantages:**
  - Zero external market-data lookback dependency; completely immune to missing 10-year archives (`OI-HIST-01`).
  - Bit-for-bit deterministic reproducibility across all environments.
  - Zero computational overhead at runtime; trivial auditing and regression testing.
- **Disadvantages:**
  - Requires deliberate governance review if Indian structural valuation baselines permanently shift.
- **Profile Impact:** Codified in `insurance-valuation-calibration-1.0.0.json` and `capital-markets-valuation-calibration-1.0.0.json`.

#### Option B: Historical Cycle Distribution (Percentiles)
- **Description:** Derives 5 scoring tiers based on historical 10-year percentile distributions (e.g. $<20\text{th}$, $20\text{--}40\text{th}$, $40\text{--}60\text{th}$, $60\text{--}80\text{th}$, $\ge 80\text{th}$).
- **Advantages:** Reflects actual realized valuation multiples across full bull/bear cycles.
- **Disadvantages:**
  - **BLOCKED BY OI-HIST-01:** Listed life insurers have relatively short public histories in India (HDFC Life listed in 2017; SBI Life in 2017; LIC in 2022). A continuous 10-year listed history does not exist for the majority of the peer group.
  - Generates moving targets as the observation window rolls.

#### Option C: Peer Cross-Sectional Distribution
- **Description:** Ranks current multiples across active peers and scores relative to the contemporaneous median.
- **Advantages:** Dynamically adapts to broader macro regime shifts (e.g. rising rate environments).
- **Disadvantages:**
  - Severe small-sample bias: Only 4 pure-play life insurers and 4 pure-play AMCs are listed on the NSE CM segment. Standard statistical percentiles fail on populations of $N \le 4$.
  - Fragile to single-peer corporate distress or speculative bubbles.

#### Option D: Segment-Conditional Multi-Tier Bands
- **Description:** Adjusts valuation bands based on underwriting profitability (Combined Ratio for Life, Cost-to-Income for Capital Markets).
- **Advantages:** Allows higher valuation multiples for businesses generating superior returns on equity.
- **Disadvantages:**
  - Violates the foundational separation of concerns between operational quality (ADR-01 composite engines) and valuation multiple synthesis (Layer 2.5).

---

## 5. Illustrative Reference Multiples for Authority Review

To assist the Program Authority in adjudicating numerical scoring bands under **Q-GRP2-CAL-04**, the following institutional reference distributions from Indian equity capital markets are provided as neutral technical context (**NOT** as operative thresholds):

### 5.1 Life Insurance: Price-to-Embedded Value (P/EV)
In Indian life insurance equity research, P/EV multiples historically exhibit the following structural characteristics:
- **Sub-1.50x:** Deep value / distressed / low-VNB margin operators (or public sector entities trading at substantial discounts).
- **1.50x – 2.20x:** Moderate valuation / transitional growth insurers.
- **2.20x – 3.00x:** Benchmark / fair value for scaled private sector players with healthy persistency.
- **3.00x – 3.80x:** Stretched / premium valuation reflecting high VNB growth and distribution moats.
- **Above 3.80x:** Historically expensive / overvalued.

### 5.2 Capital Markets — AMC: Market Cap / AUM Ratio (%)
In Indian asset management equity research, Market Cap / AUM multiples typically align with:
- **Sub-5.0%:** Deep value / sub-scale AUM / high debt or equity-outflow pressure.
- **5.0% – 8.0%:** Attractive / reasonable valuation for profitable AMCs.
- **8.0% – 12.0%:** Fair value benchmark for scaled equity-heavy franchise leaders.
- **12.0% – 16.0%:** Stretched / premium multiple reflecting rapid retail SIP inflows and high operating margins.
- **Above 16.0%:** Expensive / peak-cycle valuation.

### 5.3 Capital Markets — Non-AMC: Price-to-Earnings (P/E)
Capital market infrastructure institutions (exchanges, depositories) and brokerages historically span:
- **Sub-15.0x:** Deep value / cyclical brokerage downturn.
- **15.0x – 25.0x:** Attractive valuation for brokerages / moderate multiple for infrastructure.
- **25.0x – 40.0x:** Fair value benchmark for market infrastructure leaders (exchanges/depositories with recurring fees).
- **40.0x – 60.0x:** Stretched / premium growth valuation.
- **Above 60.0x:** Expensive / peak speculative market volume multiple.

---

## 6. Calibration Boundary & Architectural Isolation

The Program Authority is formally advised that the following structural boundaries remain active and must not be altered during Stage 2:
1. **Scaffold Derivation Preservation:** The mathematical formulas implemented in Stage 1 (`synthesizeInsuranceScaffold`, `synthesizeCapitalMarketsScaffold`) must remain the sole multiple derivation methods.
2. **Zero Hidden Thresholds:** No provisional constants or undeclared multipliers may exist.
3. **Valuation Score Nullity:** Until Stage 2 numerical calibration is explicitly adjudicated, implemented, and accepted, `valuationScore` remains strictly `null`.
4. **ADR-01 Composite Engine Invariance:** `InsuranceScoreEngine.ts` and `CapitalMarketsScoreEngine.ts` composite scoring, weights, and golden references are **100% UNTOUCHED**. Valuation remains strictly an orthogonal axis on the Decision Matrix ($y$-axis).
5. **Dynamic Runner Gate Preserved:** `Insurance` and `Capital Markets` remain in `DynamicEngineRunner.ts` `blockedSectors` (line 114) failing closed as `SECTOR_UNSUPPORTED`. Unlocking requires a subsequent dedicated acceptance gate.

---

## 7. Concise Authority Questionnaire (Q-GRP2-CAL-01 through Q-GRP2-10)

The Program Authority is requested to review and adjudicate the following ten governance items:

```
┌──────────────────┬────────────────────────────────────────────────────────────────────────────────────────┐
│ Question Code    │ Decision Item & Authority Options                                                      │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-CAL-01    │ Calibration Methodology Selection:                                                     │
│                  │ [A] Option A: Static Expert-Calibrated Policy Bands (reaffirming Q-CAL-01 precedent)  │
│                  │ [B] Option B: Historical Multi-Cycle Percentile Distribution                           │
│                  │ [C] Option C: Cross-Sectional Peer Distribution                                        │
│                  │ [D] Defer Methodology Selection                                                        │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-CAL-02    │ Life Insurance Population Scope:                                                       │
│                  │ [A] Unified Life Insurance Population (All listed Indian life insurers)               │
│                  │ [B] Segmented by Ownership (PSU vs. Private Sector Life Insurers)                      │
│                  │ [C] Defer Population Scope                                                             │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-CAL-03    │ Capital Markets Segmentation Confirmation:                                             │
│                  │ [A] Confirm Two Distinct Calibration Profiles: AMC (M-Cap/AUM) vs. Non-AMC (P/E)       │
│                  │ [B] Unified Single Multiple across Capital Markets                                     │
│                  │ [C] Defer Capital Markets Segmentation                                                 │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-CAL-04    │ Numerical Scoring Band Thresholds:                                                     │
│                  │ [A] Authorize Program Authority to specify explicit 5-tier numerical band schedules:   │
│                  │     - Life Insurance (P/EV)                                                            │
│                  │     - Capital Markets AMC (Market Cap / AUM %)                                         │
│                  │     - Capital Markets Non-AMC (P/E)                                                    │
│                  │ [B] Defer Numerical Band Selection to Subsequent Workstream                            │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-CAL-05    │ Exceptional Events Treatment:                                                          │
│                  │ [A] Strict Fail-Closed Exclusion (exceptionalEventFlag: true -> UNAVAILABLE)           │
│                  │ [B] Scoring Adjustment Floor (Assign provisional low score)                           │
│                  │ [C] Defer Exceptional Event Policy                                                     │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-CAL-06    │ Distressed / Invalid Input Policy:                                                     │
│                  │ [A] Strict Fail-Closed UNAVAILABLE for:                                                │
│                  │     - Insurance: EV <= 0 OR Solvency Ratio < 1.50                                      │
│                  │     - Capital Markets AMC: Total AUM <= 0                                              │
│                  │     - Capital Markets Non-AMC: EPS <= 0                                                │
│                  │ [B] Fallback floor scoring for distressed balance sheets                               │
│                  │ [C] Defer Distressed Input Policy                                                      │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-CAL-07    │ Calibration Profile Versioning & Schema:                                               │
│                  │ [A] Distinct immutable versioned JSON assets in frontend/server/valuation/calibration/:│
│                  │     - insurance-valuation-calibration-1.0.0.json                                       │
│                  │     - capital-markets-valuation-calibration-1.0.0.json                                 │
│                  │ [B] Integrated composite profile map                                                   │
│                  │ [C] Defer Profile Versioning                                                           │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-CAL-08    │ Recalibration Cadence & Governance Review:                                             │
│                  │ [A] Annual Scheduled Review (Governance policy only; zero runtime auto-drift)          │
│                  │ [B] Quarterly LODR Recalibration                                                       │
│                  │ [C] Defer Recalibration Cadence                                                        │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-CAL-09    │ Production Eligibility Boundary:                                                       │
│                  │ [A] Development / Reference Harness Only (LIVE dynamic execution blocked pending       │
│                  │     authoritative corporate fundamentals feed under OI-FUND-01)                        │
│                  │ [B] Full Production Authorization                                                      │
│                  │ [C] Defer Production Boundary                                                          │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-CAL-10    │ Dynamic Engine Runner Unlock Gate:                                                     │
│                  │ [A] Remain Blocked in blockedSectors until Stage 2 implementation, 100% test passing,  │
│                  │     and formal acceptance reconciliation are completed                                 │
│                  │ [B] Unlock immediately upon calibration profile codification                           │
│                  │ [C] Defer Unlock Gate                                                                  │
└──────────────────┴────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Stage 2 Verification & Acceptance Plan

When the Program Authority renders binding determinations on **Q-GRP2-CAL-01 through Q-GRP2-CAL-10**, the subsequent Stage 2 implementation must satisfy the following explicit verification criteria:

1. **Exact Numerical Threshold Conformance:**
   - Dedicated boundary verification suite (`group2-valuation-calibration.test.ts`) testing exact behavior at boundary edges, interior points, and deep outliers across all 5 tiers for each sub-sector.
2. **Fail-Closed & Negative Control Tests:**
   - Insurance solvency breaches (Solvency $< 1.50$) fail closed with `UNAVAILABLE`.
   - Distressed metrics ($\text{EV} \le 0$, $\text{AUM} \le 0$, $\text{EPS} \le 0$) fail closed with `UNAVAILABLE`.
   - Exceptional events (`exceptionalEventFlag: true`) fail closed with `UNAVAILABLE`.
   - Non-Life Insurance remains strictly blocked (`BLOCKED_UNCALIBRATED`).
3. **Segmentation & Cross-Fallback Isolation:**
   - AMC payloads strictly evaluate Market Cap / AUM; Non-AMC payloads strictly evaluate P/E. Zero cross-methodology leakage.
4. **Provenance & Versioning Verification:**
   - Calibration profile assets are stamped on output provenance DTOs (`calibrationProfileId`, `calibrationVersion: '1.0.0'`).
5. **Baseline Regression Floor:**
   - 101/101 D112/D113/D115 invariant tests + Stage 2 calibration tests passing.
   - 61/61 D114 market-data batch ingestion tests passing.
6. **Runner Safety & SNAPSHOT Invariance:**
   - Confirm `DynamicEngineRunner.ts` maintains `blockedSectors` until formal acceptance.
   - Confirm zero mutation of ADR-01 engines or golden reference fixtures.

---

## 9. Final Forensic Summary & Disclosures

### A. Exact Files Inspected During Preparation
1. `frontend/server/valuation/valuation-contract.ts` (Type contracts, fundamentals, and result definitions)
2. `frontend/server/valuation/eod-valuation-synthesizer.ts` (Scaffold methods, solvency guards, segmentation)
3. `frontend/server/valuation/group2-valuation-scaffold.test.ts` (20-test Stage 1 verification suite)
4. `frontend/server/dynamic-runner/dynamic-engine-runner.ts` (Blocked sectors list at line 114)
5. `iips-platform/src/sector-engines/insurance/` (Engine, metrics, calibration, golden references)
6. `iips-platform/src/sector-engines/capital-markets/` (Engine, metrics, calibration, golden references)
7. `docs/D115_GROUP2_INSURANCE_CAPITAL_MARKETS_ADJUDICATION.md` (Governing Stage 1 adjudication record)
8. `docs/D115_STAGE1_GROUP2_VALUATION_SCAFFOLD_ACCEPTANCE_AND_DURABILITY_RECONCILIATION.md` (Stage 1 acceptance report)

### B. Settled Authority Decisions Preserved (MUST NOT BE SILENTLY CHANGED)
- **Q-GRP2-01 = E:** Initial Insurance scope restricted strictly to Life Insurance under P/EV.
- **Q-GRP2-02 = C:** Life Insurance only initially.
- **Q-GRP2-03 = A:** Existing `IM-006` `embeddedValue` contract is authoritative.
- **Q-GRP2-04 = D:** Non-Life Insurance excluded (`BLOCKED_UNCALIBRATED`).
- **Q-GRP2-05 = A:** Solvency ratio $< 1.50$ fails closed with `UNAVAILABLE`.
- **Q-GRP2-06 = C:** Capital Markets segmented into AMC and Non-AMC.
- **Q-GRP2-07 = A:** AMCs evaluate Market Cap / AUM Ratio (%).
- **Q-GRP2-08 = A:** Non-AMCs evaluate Price-to-Earnings (P/E).
- **Q-GRP2-13 = A:** Defined exceptional events fail closed with `UNAVAILABLE`.
- **Q-GRP2-15 = A:** `DynamicEngineRunner.ts` keeps Insurance and Capital Markets blocked.
- **Q-GRP2-16 = A:** Development mixed-vintage harness only; production LIVE blocked.
- **Decision C2:** Healthcare and Hospitality operating lease policy remains untouched and blocked.
- **D113-QCAL09:** Banking operational dynamic runner execution remains unlocked, calibrated, and frozen.

### C. Unresolved Stage 2 Authority Questions
- Numerical threshold approval for Life Insurance P/EV bands (**Q-GRP2-CAL-04**).
- Numerical threshold approval for AMC Market Cap / AUM (%) bands (**Q-GRP2-CAL-04**).
- Numerical threshold approval for Non-AMC P/E bands (**Q-GRP2-CAL-04**).
- Formal selection of calibration profile versioning and file paths (**Q-GRP2-CAL-07**).

### D. Proposed Stage 2 Implementation Sequence
1. **Adjudication:** Program Authority reviews this document and records binding determinations for `Q-GRP2-CAL-01` through `Q-GRP2-CAL-10`.
2. **Asset Codification:** Create `insurance-valuation-calibration-1.0.0.json` and `capital-markets-valuation-calibration-1.0.0.json`.
3. **Synthesizer Implementation:** Update `eod-valuation-synthesizer.ts` to load profiles, evaluate bands, and emit `status: 'CALCULATED'` with numeric `valuationScore`.
4. **Verification Testing:** Author `group2-valuation-calibration.test.ts` (15+ boundary and negative tests).
5. **Acceptance Gate:** Produce Stage 2 acceptance reconciliation report.
6. **Operational Unlock (Stage 3):** Under a separate subsequent authority gate, unblock Insurance and Capital Markets in `DynamicEngineRunner.ts` and verify dynamic transport DTOs.

### E. Zero-Modification Affirmation
This activity is **STRICTLY READ-ONLY**. Zero lines of implementation source code, test suites, or configuration files were added, modified, or deleted. No runtime behavior has been altered.

---

**AUTHORITY DECISION PREPARATION PACKAGE COMPLETE. COMMITTING AND PUSHING READ-ONLY SPECIFICATION.**
