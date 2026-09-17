# IIPS PROGRAM AUTHORITY DECISION RECORD: D115 GROUP 2 ADJUDICATION
## Formal Authority Determination for Insurance & Capital Markets Valuation Calibration

**Document Reference:** `docs/D115_GROUP2_INSURANCE_CAPITAL_MARKETS_ADJUDICATION.md`  
**Governing Authority:** Program Authority (Sai / Ramki)  
**Adjudication Date:** 2026-09-17  
**Status:** **RECORDED & RATIFIED — FORMAL PROGRAM DIRECTIVE**  
**Baseline Git HEAD:** `7bf8730bb3fa072d6896245d8205cb3677761005`  
**Branch:** `arena/01a0a438-iips-production-market-data`  

---

## 1. Executive Summary & Adjudication Framework

Following the formal submission of `docs/D115_GROUP2_INSURANCE_CAPITAL_MARKETS_AUTHORITY_PREPARATION.md`, the Program Authority has rendered binding adjudications for each of the sixteen governance questions (**Q-GRP2-01 through Q-GRP2-16**) governing the **Group 2 Sectors: Insurance and Capital Markets**.

### Governing Principles Applied:
1. **Strict Staging (Reaffirming Decision D2):** Implementation proceeds by segmented, evidenced stages. High-complexity sub-sectors lacking standardized metrics are explicitly deferred or excluded from initial execution.
2. **Layer-2.5 Orthogonal Architecture (Reaffirming Decision A1):** Dynamic valuation resides strictly at Layer 2.5 (`EodValuationSynthesizer.ts`) and feeds the Decision Matrix valuation axis ($y$-axis). Certified ADR-01 composite engines (`InsuranceScoreEngine.ts`, `CapitalMarketsScoreEngine.ts`) remain **100% UNTOUCHED**.
3. **No Threshold Invention:** Numerical scoring bands are deferred until explicit proposed schedules are reviewed in Stage 2.
4. **Development-Only Harness (Reaffirming Decision E1):** Implementation is authorized exclusively for the development verification harness (`DEVELOPMENT_MIXED_VINTAGE`). Production LIVE remains blocked pending automated corporate fundamentals feeds.
5. **No Code / Test Mutation:** This document is an **authority decision act only**. Zero lines of code or test suites are modified by this act.

---

## 2. Itemized Adjudications (Q-GRP2-01 through Q-GRP2-16)

```
┌──────────────┬────────────────────────────────────────┬──────────────────────────────────────────┐
│ Question     │ Governance Subject                     │ Ratified Program Authority Determination │
├──────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
│ Q-GRP2-01    │ Insurance Valuation Methodology        │ E — Restrict Initial Scope to Life (P/EV)│
│ Q-GRP2-02    │ Insurance Population Scope             │ C — Restrict to Life Insurance Initially │
│ Q-GRP2-03    │ Embedded Value Definition              │ A — Use Existing IM-006 Contract         │
│ Q-GRP2-04    │ Non-Life Valuation Input               │ D — Exclude Non-Life from Initial Scope  │
│ Q-GRP2-05    │ Insurance Solvency Guard               │ A — Solvency Ratio < 1.50 => Fail Closed │
│ Q-GRP2-06    │ Capital Markets Population             │ C — Segment Only AMC vs. Non-AMC         │
│ Q-GRP2-07    │ AMC Valuation Methodology              │ A — Market Cap / AUM Ratio (%)           │
│ Q-GRP2-08    │ Brokerage / Exchange Valuation         │ A — Price-to-Earnings (P/E) Multiple     │
│ Q-GRP2-09    │ Capital Markets Calibration Method     │ A — Static Expert-Calibrated Policy Bands│
│ Q-GRP2-10    │ Calibration Population                 │ B — Calibrate Approved Segments Separately│
│ Q-GRP2-11    │ Observation Window Baseline            │ D — N/A for Static Policy Methodology    │
│ Q-GRP2-12    │ Numerical Calibration Thresholds       │ C — Defer Numerical Threshold Approval   │
│ Q-GRP2-13    │ Exceptional Events Treatment           │ A — Exclude Defined Exceptional Events   │
│ Q-GRP2-14    │ Versioning & Re-Calibration Cadence    │ A — Immutable Versioned Profile + Annual │
│ Q-GRP2-15    │ Dynamic Engine Runner Unlock Gate      │ A — Blocked Until Accept + Verification  │
│ Q-GRP2-16    │ Production Eligibility Boundary        │ A — Development / Reference Harness Only │
└──────────────┴────────────────────────────────────────┴──────────────────────────────────────────┘
```

---

## 3. Detailed Decision Records & Implementation Constraints

### Q-GRP2-01: Insurance Valuation Methodology
- **Selected Determination:** **Option E — Restrict initial Insurance scope to Life Insurance (Price-to-Embedded Value, P/EV)**.
- **Authority-Defined Parameters:** Valuation multiple is defined strictly as:
  $$\text{EVPS} = \frac{\text{Embedded Value}}{\text{sharesOutstanding}}, \quad \text{P/EV} = \frac{\text{eodClosePrice}}{\text{EVPS}}$$
- **Deferred Components:** Valuation for Non-Life (General Insurance, Standalone Health Insurance, Reinsurance) is explicitly deferred.
- **Implementation Constraint:** If an insurance security is classified as non-life, or if Embedded Value is zero/missing, the synthesizer must emit `status: 'BLOCKED_UNCALIBRATED'` or `UNAVAILABLE`.
- **Permits Implementation?** **YES, for Life Insurance scaffold only**.

### Q-GRP2-02: Insurance Population Scope
- **Selected Determination:** **Option C — Restrict to Life Insurance initially**.
- **Authority-Defined Parameters:** Target universe consists of Indian listed life insurance entities (e.g., HDFC Life Insurance Company Ltd, SBI Life Insurance Company Ltd, ICICI Prudential Life Insurance Company Ltd, Life Insurance Corporation of India).
- **Deferred Components:** Multi-line and general insurers.
- **Implementation Constraint:** Security Master and engine input builders must restrict valid Insurance evaluation candidates to Life Insurers.
- **Permits Implementation?** **YES, for Life Insurance**.

### Q-GRP2-03: Embedded Value Definition
- **Selected Determination:** **Option A — Use existing IM-006 Embedded Value contract**.
- **Authority-Defined Parameters:** Denominator must be read from the established `IM-006` metric or `embeddedValue` input property.
- **Implementation Constraint:** Engineering is strictly forbidden from inventing customized actuarial adjustments, synthetic operating assumptions, or unevidenced balance-sheet adjustments.
- **Permits Implementation?** **YES**.

### Q-GRP2-04: Non-Life Valuation Input
- **Selected Determination:** **Option D — Exclude Non-Life from initial implementation**.
- **Rationale:** Non-life insurers do not calculate Embedded Value; their inclusion at this stage would introduce divergent multi-metric complexity without adequate benchmark evidence.
- **Implementation Constraint:** Non-life insurers fail closed with `status: 'BLOCKED_UNCALIBRATED'`.
- **Permits Implementation?** **YES (Non-Life excluded)**.

### Q-GRP2-05: Insurance Solvency Guard
- **Selected Determination:** **Option A — Solvency Ratio < 1.50 => Fail Closed**.
- **Authority-Defined Parameters:** Statutory threshold established by the Insurance Regulatory and Development Authority of India (IRDAI) is 1.50 (150%).
- **Implementation Constraint:** If Solvency Ratio (`IM-002` / `solvencyRatio`) $< 1.50$, the synthesizer must immediately fail closed:
  $$\text{status: 'UNAVAILABLE'}, \quad \text{valuationScore: null}, \quad \text{reason: 'SOLVENCY\_BELOW\_REGULATORY\_MINIMUM'}$$
- **Permits Implementation?** **YES**.

### Q-GRP2-06: Capital Markets Population Segmentation
- **Selected Determination:** **Option C — Segment only AMC versus Non-AMC**.
- **Authority-Defined Parameters:** The Capital Markets sector is bifurcated into:
  1. **Asset Management Companies (AMCs):** Evaluated via Assets Under Management (AUM).
  2. **Non-AMC Entities (Brokerages, Exchanges/MIIs, Wealth, Investment Banks):** Evaluated via standard earnings metrics.
- **Implementation Constraint:** Dynamic input builder must categorize Capital Markets firms into `AMC` or `Non-AMC` using existing category metadata.
- **Permits Implementation?** **YES**.

### Q-GRP2-07: AMC Valuation Methodology
- **Selected Determination:** **Option A — Market Cap / AUM Ratio (%)**.
- **Authority-Defined Parameters:**
  $$\text{Market Cap / AUM (\%)} = \frac{\text{Market Capitalization}}{\text{Total AUM}} \times 100 = \frac{\text{eodClosePrice} \times \text{sharesOutstanding}}{\text{Total AUM}} \times 100$$
- **Implementation Constraint:** Total AUM must be read from `CM-001` or `totalAum`. If AUM $\le 0$, fail closed with `UNAVAILABLE`.
- **Permits Implementation?** **YES, for AMC scaffold**.

### Q-GRP2-08: Brokerage / Exchange Valuation Methodology
- **Selected Determination:** **Option A — Price-to-Earnings (P/E) Multiple**.
- **Authority-Defined Parameters:**
  $$\text{P/E} = \frac{\text{eodClosePrice}}{\text{EPS}}$$
- **Implementation Constraint:** Standard P/E evaluation architecture (already certified in D112-C for Automobile, Consumer, and Utilities) is applied to non-AMC Capital Markets entities. Negative or zero EPS fails closed with `UNAVAILABLE`.
- **Permits Implementation?** **YES, for Non-AMC scaffold**.

### Q-GRP2-09: Capital Markets Calibration Methodology
- **Selected Determination:** **Option A — Static expert-calibrated policy bands**.
- **Rationale:** Aligns with ratified decision `Q-CAL-01 = D`. Provides fixed, deterministic, institutional structural benchmarks without empirical time-series drift.
- **Implementation Constraint:** Engineering must not introduce dynamic empirical rolling lookback calculations.
- **Permits Implementation?** **YES**.

### Q-GRP2-10: Calibration Population
- **Selected Determination:** **Option B — Calibrate each explicitly approved business segment separately**.
- **Authority-Defined Parameters:**
  - Segment 1: AMCs (calibrated against Market Cap / AUM bands).
  - Segment 2: Non-AMCs (calibrated against financial-services P/E bands).
- **Implementation Constraint:** Two distinct scoring schedules must be codified within the Capital Markets calibration profile.
- **Permits Implementation?** **YES**.

### Q-GRP2-11: Observation Window Baseline
- **Selected Determination:** **Option D — N/A for static methodology**.
- **Rationale:** Because static policy bands have been selected under Q-GRP2-09, dynamic rolling observation windows are not applicable.
- **Implementation Constraint:** No historical bhavcopy lookback dependencies.
- **Permits Implementation?** **YES**.

### Q-GRP2-12: Numerical Calibration Thresholds
- **Selected Determination:** **Option C — Defer numerical threshold approval**.
- **Authority Mandate:** Engineering is **strictly forbidden from inventing numerical scoring thresholds** in Stage 1.
- **Implementation Constraint:** Stage 1 implementation must produce a calibration-neutral scaffold emitting:
  $$\text{status: 'CALIBRATION\_PENDING'}, \quad \text{valuationScore: null}$$
  Numerical thresholds must be presented in a dedicated Stage 2 proposal for explicit Program Authority review and ratification.
- **Permits Implementation?** **YES for Stage 1 scaffold only; BLOCKS Stage 2 scoring**.

### Q-GRP2-13: Exceptional Events Policy
- **Selected Determination:** **Option A — Exclude defined exceptional events**.
- **Authority-Defined Parameters:** Follows ratified `Q-CAL-06` pattern. If `exceptionalEventFlag === true` in company fundamentals, valuation synthesis must immediately abort and fail closed with `UNAVAILABLE`.
- **Implementation Constraint:** Enforce fail-closed flag check prior to multiple calculation.
- **Permits Implementation?** **YES**.

### Q-GRP2-14: Versioning & Re-Calibration Cadence
- **Selected Determination:** **Option A — Immutable versioned profile + annual review**.
- **Authority-Defined Parameters:**
  - `frontend/server/valuation/calibration/insurance-valuation-calibration-1.0.0.json`
  - `frontend/server/valuation/calibration/capital-markets-valuation-calibration-1.0.0.json`
- **Implementation Constraint:** Calibration profiles must be immutable versioned external JSON assets governed under annual Program Authority review. Zero runtime auto-tuning.
- **Permits Implementation?** **YES**.

### Q-GRP2-15: Dynamic Engine Runner Unlock Gate
- **Selected Determination:** **Option A — Remain blocked until implementation + verification acceptance**.
- **Authority Mandate:** `DynamicEngineRunner.ts` shall **NOT** unlock Insurance or Capital Markets during Stage 1 scaffold implementation.
- **Implementation Constraint:** Both sectors must remain in `blockedSectors` (line 114) failing closed with `SECTOR_UNSUPPORTED` until an explicit subsequent acceptance gate authorizes unlocking.
- **Permits Implementation?** **YES (Scaffold must keep runner blocked)**.

### Q-GRP2-16: Production Eligibility Boundary
- **Selected Determination:** **Option A — Development / reference implementation only until authoritative production fundamentals source and data rights are established**.
- **Authority Mandate:** Stamped provenance must strictly declare:
  - `dataMode: 'LIVE'`
  - `freshness: 'DEVELOPMENT_MIXED_VINTAGE'`
  - `fundamentalsVintage: 'v1.1-reference'`
  - `certificationState: 'DEVELOPMENT_HARNESS_VERIFIED_ONLY'`
- **Implementation Constraint:** Production LIVE dynamic execution remains barred.
- **Permits Implementation?** **YES for development harness**.

---

## 4. Scope Authorized for Subsequent Implementation

Following this adjudication, the Program Authority authorizes **Stage 1 (Calibration-Neutral Scaffold Implementation)** covering exclusively:

1. **Insurance (Life Insurance Only):**
   - Synthesizer method for raw **Price-to-Embedded Value (P/EV)** calculation.
   - Solvency guard: Solvency Ratio $< 1.50 \rightarrow$ `UNAVAILABLE`.
   - Distressed guard: $\text{Embedded Value} \le 0 \rightarrow$ `UNAVAILABLE`.
   - Status: Emits `CALIBRATION_PENDING`, `valuationScore: null`.
2. **Capital Markets (Segmented AMC vs. Non-AMC):**
   - Synthesizer method for AMC raw **Market Cap / AUM Ratio (%)** calculation.
   - Synthesizer method for Non-AMC raw **Price-to-Earnings (P/E)** calculation.
   - Distressed guards: $\text{AUM} \le 0$ or $\text{EPS} \le 0 \rightarrow$ `UNAVAILABLE`.
   - Status: Emits `CALIBRATION_PENDING`, `valuationScore: null`.

---

## 5. Explicitly Excluded Scope

The following scopes are **strictly prohibited** from any forthcoming implementation:
1. **Non-Life Insurance:** General, health, and multi-line insurers are excluded (`status: 'BLOCKED_UNCALIBRATED'`).
2. **Numerical Scoring Bands:** Engineering must not encode scoring bands in Stage 1.
3. **Dynamic Engine Runner Unlocking:** `DynamicEngineRunner.ts` must maintain `Insurance` and `Capital Markets` in `blockedSectors`.
4. **ADR-01 Sector Engine Modification:** Certified `InsuranceScoreEngine.ts` and `CapitalMarketsScoreEngine.ts` composite scoring and golden fixtures must remain untouched.
5. **Healthcare and Hospitality:** Both sectors remain strictly blocked (`SECTOR_UNSUPPORTED`) under unresolved **Decision C2**.
6. **Production Data Providers:** Zero live external API requests, zero Dhan token dependencies, zero NSE SFTP connections.

---

## 6. Preservation of Baseline Integrity

- **Banking Baseline:** Banking dynamic execution is fully operational under ratified **D113-QCAL09** and remains **100% UNTOUCHED AND FROZEN**.
- **Healthcare & Hospitality:** Both remain strictly blocked (`SECTOR_UNSUPPORTED`) with Decision C2 untouched.
- **D112 & D114 Baselines:** All 142 regression tests (81 D112/D113 + 61 D114) must be preserved without regression.
- **Zero Source Modifications in this Act:** No source code, tests, or configurations were modified by this adjudication document.

---

**PROGRAM AUTHORITY ADJUDICATION RATIFIED. AWAITING BOUNDED IMPLEMENTATION CHARTER FOR STAGE 1 GROUP 2 CALIBRATION-NEUTRAL SCAFFOLD.**
