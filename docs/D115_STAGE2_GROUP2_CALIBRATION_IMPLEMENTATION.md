# IIPS D115-STAGE2: GROUP 2 (LIFE INSURANCE & CAPITAL MARKETS) NUMERICAL CALIBRATION
## FORMAL IMPLEMENTATION & VERIFICATION REPORT

**Document Reference:** `docs/D115_STAGE2_GROUP2_CALIBRATION_IMPLEMENTATION.md`  
**Governing Authority Directive:** Program Authority Adjudication Record (`docs/D115_STAGE2_GROUP2_CALIBRATION_ADJUDICATION.md`)  
**Context:** Codification and Synthesizer Integration of Ratified Numerical Bands for Life Insurance and Capital Markets  
**Status:** **IMPLEMENTED & VERIFIED — PENDING SEPARATE ACCEPTANCE/DURABILITY RECONCILIATION**  
**Authoritative Baseline Commit:** `991a008f0f1c5143a3e9f45bf3c1be5acd1abf5d`  
**Branch:** `arena/01a0a438-iips-production-market-data`  
**Date:** 2026-09-17  

---

## 1. Executive Summary

In accordance with the binding determinations rendered in **D115 Stage 2 Program Authority Adjudication** (`docs/D115_STAGE2_GROUP2_CALIBRATION_ADJUDICATION.md`, commit `991a008`), the numerical valuation calibrations for **Group 2 sectors** (**Life Insurance** and **Capital Markets: AMC & Non-AMC**) have been codified and integrated into Layer-2.5 EOD Valuation Synthesis.

### Core Boundaries Strictly Preserved:
1. **Zero Invented / Altered Thresholds:** All numerical scoring bands implemented match the exact authority-ratified 5-tier schedules bit-for-bit without interpolation or drift.
2. **Dynamic Runner Gate Preserved:** `DynamicEngineRunner.ts` maintains `Insurance` and `Capital Markets` in `blockedSectors` (line 114) failing closed as `SECTOR_UNSUPPORTED`. Operational unlock is **NOT** authorized by this implementation and requires a separate Stage 3 operational gate per **Q-GRP2-CAL-10**.
3. **Five-Sector Standing Isolation:**
   - **Banking:** Unlocked, calibrated, and operational per ratified **D113-QCAL09**.
   - **Insurance:** Blocked from LIVE dynamic execution in runner (`SECTOR_UNSUPPORTED`).
   - **Capital Markets:** Blocked from LIVE dynamic execution in runner (`SECTOR_UNSUPPORTED`).
   - **Healthcare:** Blocked from LIVE dynamic execution in runner (`SECTOR_UNSUPPORTED`, **Decision C2** unresolved).
   - **Hospitality:** Blocked from LIVE dynamic execution in runner (`SECTOR_UNSUPPORTED`, **Decision C2** unresolved).
4. **ADR-01 Engine & Snapshot Invariance:** `InsuranceScoreEngine.ts`, `CapitalMarketsScoreEngine.ts`, `BankingScoreEngine.ts`, and all 13 sector golden reference fixtures remain **100% byte-identical** (0 git diff).

---

## 2. Exact Files Modified & Created

```
┌────────────────────────────────────────────────────────────────────────────────────────┬───────────┐
│ File Path                                                                              │ Action    │
├────────────────────────────────────────────────────────────────────────────────────────┼───────────┤
│ frontend/server/valuation/calibration/insurance-valuation-calibration-1.0.0.json       │ Created   │
│ frontend/server/valuation/calibration/capital-markets-valuation-calibration-1.0.0.json │ Created   │
│ frontend/server/valuation/eod-valuation-synthesizer.ts                                 │ Modified  │
│ frontend/server/valuation/group2-valuation-scaffold.test.ts                            │ Modified  │
│ frontend/server/valuation/group2-valuation-calibration.test.ts                         │ Created   │
│ docs/D115_STAGE2_GROUP2_CALIBRATION_IMPLEMENTATION.md                                  │ Created   │
└────────────────────────────────────────────────────────────────────────────────────────┴───────────┘
```

---

## 3. Exact Authority Calibration Bands Implemented

All bands are evaluated using standard ADR-01 lower-inclusive, upper-exclusive interval semantics:

### 3.1 Life Insurance — Price-to-Embedded Value (P/EV)
**Calibration Profile:** `insurance-valuation-calibration-1.0.0.json` (`IM-VAL-001`)
$$\begin{aligned}
\text{Tier 1 (Elite / Deep Value):} & \quad \mathbf{\text{P/EV} < 1.800\times} && \longrightarrow \mathbf{\text{Score: } 90.0} \\
\text{Tier 2 (Attractive Valuation):} & \quad \mathbf{1.800\times \le \text{P/EV} < 2.400\times} && \longrightarrow \mathbf{\text{Score: } 75.0} \\
\text{Tier 3 (Fair Value Benchmark):} & \quad \mathbf{2.400\times \le \text{P/EV} < 3.200\times} && \longrightarrow \mathbf{\text{Score: } 60.0} \\
\text{Tier 4 (Stretched Valuation):} & \quad \mathbf{3.200\times \le \text{P/EV} < 4.000\times} && \longrightarrow \mathbf{\text{Score: } 45.0} \\
\text{Tier 5 (Overvalued / Expensive):} & \quad \mathbf{\text{P/EV} \ge 4.000\times} && \longrightarrow \mathbf{\text{Score: } 20.0}
\end{aligned}$$

### 3.2 Capital Markets AMC — Market Cap / AUM Ratio (%)
**Calibration Profile:** `capital-markets-valuation-calibration-1.0.0.json` (`CM-VAL-001`)
$$\begin{aligned}
\text{Tier 1 (Deep Value / Undervalued):} & \quad \mathbf{\text{MCap / AUM} < 6.000\%} && \longrightarrow \mathbf{\text{Score: } 90.0} \\
\text{Tier 2 (Attractive Valuation):} & \quad \mathbf{6.000\% \le \text{MCap / AUM} < 9.000\%} && \longrightarrow \mathbf{\text{Score: } 75.0} \\
\text{Tier 3 (Fair Value Benchmark):} & \quad \mathbf{9.000\% \le \text{MCap / AUM} < 13.000\%} && \longrightarrow \mathbf{\text{Score: } 60.0} \\
\text{Tier 4 (Stretched Valuation):} & \quad \mathbf{13.000\% \le \text{MCap / AUM} < 17.000\%} && \longrightarrow \mathbf{\text{Score: } 45.0} \\
\text{Tier 5 (Overvalued / Expensive):} & \quad \mathbf{\text{MCap / AUM} \ge 17.000\%} && \longrightarrow \mathbf{\text{Score: } 20.0}
\end{aligned}$$

### 3.3 Capital Markets Non-AMC — Price-to-Earnings (P/E)
**Calibration Profile:** `capital-markets-valuation-calibration-1.0.0.json` (`CM-VAL-002`)
$$\begin{aligned}
\text{Tier 1 (Deep Value / Undervalued):} & \quad \mathbf{\text{P/E} < 18.000\times} && \longrightarrow \mathbf{\text{Score: } 90.0} \\
\text{Tier 2 (Attractive Valuation):} & \quad \mathbf{18.000\times \le \text{P/E} < 26.000\times} && \longrightarrow \mathbf{\text{Score: } 75.0} \\
\text{Tier 3 (Fair Value Benchmark):} & \quad \mathbf{26.000\times \le \text{P/E} < 38.000\times} && \longrightarrow \mathbf{\text{Score: } 60.0} \\
\text{Tier 4 (Stretched Valuation):} & \quad \mathbf{38.000\times \le \text{P/E} < 52.000\times} && \longrightarrow \mathbf{\text{Score: } 45.0} \\
\text{Tier 5 (Overvalued / Expensive):} & \quad \mathbf{\text{P/E} \ge 52.000\times} && \longrightarrow \mathbf{\text{Score: } 20.0}
\end{aligned}$$

---

## 4. Exact Fail-Closed Rules Implemented

1. **Life Insurance:**
   - $\text{Embedded Value} \le 0 \longrightarrow \text{status: 'UNAVAILABLE'}$, $\text{valuationScore: null}$.
   - $\text{Solvency Ratio} < 1.50 \longrightarrow \text{status: 'UNAVAILABLE'}$, $\text{valuationScore: null}$.
   - $\text{Missing embeddedValue} \longrightarrow \text{status: 'BLOCKED_UNCALIBRATED'}$.
   - $\text{Non-Life category} \longrightarrow \text{status: 'BLOCKED_UNCALIBRATED'}$.
   - $\text{exceptionalEventFlag} === \text{true} \longrightarrow \text{status: 'UNAVAILABLE'}$, $\text{valuationScore: null}$.
2. **Capital Markets AMC:**
   - $\text{Total AUM} \le 0 \longrightarrow \text{status: 'UNAVAILABLE'}$, $\text{valuationScore: null}$.
   - $\text{Missing totalAum} \longrightarrow \text{status: 'UNAVAILABLE'}$, $\text{valuationScore: null}$.
   - $\text{exceptionalEventFlag} === \text{true} \longrightarrow \text{status: 'UNAVAILABLE'}$, $\text{valuationScore: null}$.
   - Strictly evaluates Market Cap / AUM (never cross-falls back to P/E).
3. **Capital Markets Non-AMC:**
   - $\text{EPS} \le 0 \text{ or } \text{Net Income} \le 0 \longrightarrow \text{status: 'UNAVAILABLE'}$, $\text{valuationScore: null}$.
   - $\text{Missing EPS and Net Income} \longrightarrow \text{status: 'UNAVAILABLE'}$, $\text{valuationScore: null}$.
   - $\text{exceptionalEventFlag} === \text{true} \longrightarrow \text{status: 'UNAVAILABLE'}$, $\text{valuationScore: null}$.
   - Strictly evaluates P/E (never cross-falls back to Market Cap / AUM).

---

## 5. Governance & Provenance Certification State

- **Calibration Methodology:** `STATIC_EXPERT_CALIBRATED_POLICY_BANDS`
- **Calibration Profile Assets:**
  - `insurance-valuation-calibration-1.0.0.json` (Profile ID: `insurance-valuation-calibration`, Version: `1.0.0`)
  - `capital-markets-valuation-calibration-1.0.0.json` (Profile ID: `capital-markets-valuation-calibration`, Version: `1.0.0`)
- **Review Cadence:** Annual Program Authority review; zero runtime automated drift.
- **Production Eligibility:** `DEVELOPMENT_MIXED_VINTAGE` / reference test harness only. Unattended production dynamic execution remains blocked by open dependency `OI-FUND-01`.

---

## 6. Comprehensive Verification Suite & Regression Floor

### 6.1 Test Suite Summary
```
Test Suite Breakdown
=============================================================================
1. frontend/server/valuation/group2-valuation-calibration.test.ts:   39 / 39 PASSED
   - Life Insurance P/EV boundary points (<1.8, 1.8, 2.4, 3.2, 4.0):  9 /  9 PASSED
   - Capital Markets AMC MCap/AUM boundary points (<6%, 6%, 9%, 13%, 17%): 9 / 9 PASSED
   - Capital Markets Non-AMC P/E boundary points (<18, 18, 26, 38, 52): 9 / 9 PASSED
   - Fail-closed & negative controls (EV<=0, Solv<1.5, AUM<=0, EPS<=0): 6 /  6 PASSED
   - Segmentation isolation (zero cross-fallback):                    2 /  2 PASSED
   - Runner safety gates (Insurance/CapMarkets/Health/Hosp blocked):  4 /  4 PASSED

2. frontend/server/valuation/group2-valuation-scaffold.test.ts:      20 / 20 PASSED
3. frontend/server/valuation/banking-valuation-calibration.test.ts:  15 / 15 PASSED
4. frontend/server/valuation/banking-valuation-scaffold.test.ts:     12 / 12 PASSED
5. frontend/server/dynamic-runner/dynamic-engine-runner.test.ts:     11 / 11 PASSED
6. frontend/server/dynamic-transport/dynamic-transport.test.ts:      14 / 14 PASSED
7. frontend/server/security-master/security-master.test.ts:          11 / 11 PASSED
8. frontend/server/valuation/valuation-synthesizer.test.ts:          18 / 18 PASSED
Subtotal Node Invariant Floor:                                      140 / 140 PASSED (100%)

9. frontend/server/market-data/ Batch Ingestion Suites (Vitest):     61 / 61 PASSED (100%)
TOTAL REGRESSION FLOOR:                                             201 / 201 PASSED (100%)
```

---

## 7. Baseline Invariance Affirmations

1. **Healthcare & Hospitality Remain Strictly Blocked:**
   - Both sectors remain in `DynamicEngineRunner.ts` `blockedSectors` and evaluate to `status: 'SECTOR_UNSUPPORTED'` with `composite: null`. **Decision C2** remains unresolved.
2. **Banking Dynamic Execution Intact:**
   - Banking continues to evaluate dynamic P/ABV multiple synthesis and dynamic composite scoring under ratified **D113-QCAL09**.
3. **ADR-01 Engines 100% Byte-Identical:**
   - `InsuranceScoreEngine.ts`, `CapitalMarketsScoreEngine.ts`, and `BankingScoreEngine.ts` remain byte-identical to baseline. Zero modification to ADR-01 composite calculations or weights.
4. **Stage 3 Operational Runner Unlock NOT Authorized:**
   - In accordance with **Q-GRP2-CAL-10**, `Insurance` and `Capital Markets` remain runner-blocked pending the separate D115 Stage 2 acceptance and durability reconciliation gate.

---

**STAGE 2 IMPLEMENTATION COMPLETE. READY FOR COMMITTING, PUSHING, AND SUBMISSION FOR FORENSIC ACCEPTANCE RECONCILIATION.**
