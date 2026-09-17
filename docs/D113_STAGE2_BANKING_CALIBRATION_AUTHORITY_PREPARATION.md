# IIPS D113-STAGE2: BANKING P/ABV CALIBRATION AUTHORITY DECISION PREPARATION
## Comprehensive Governance Briefing, Input Lineage, and Adjudication Package for Deferred Banking Calibration

**Document Reference:** `docs/D113_STAGE2_BANKING_CALIBRATION_AUTHORITY_PREPARATION.md`  
**Governing Authority Directive:** Program Authority Adjudication Record (`docs/D113_PROGRAM_AUTHORITY_ADJUDICATION.md`)  
**Context:** Preparation for Program Authority Decision B2 Unlocking (Stage 2 Banking Calibration)  
**Status:** **AUTHORITY PREPARATION ONLY — STRICTLY READ-ONLY (ZERO MUTATION TO CODE, TESTS, OR CONFIG)**  
**Baseline Git HEAD:** `914cdc6ce4dfaaff0da5f194b50bc18792991f58`  
**Branch:** `arena/01a0a438-iips-production-market-data`  

---

## 1. Executive Summary & Purpose

Following the acceptance and freezing of **Stage 1** (`docs/D113_STAGE1_BANKING_ACCEPTANCE_AND_DURABILITY_RECONCILIATION.md`, commit `914cdc6`), the foundational Layer-2.5 mathematical scaffold for the **Banking** sector is fully implemented, verified, and durable.

In accordance with Program Authority **Decision B2** (*"Do NOT authorize numerical calibration yet. Keep calibration bands as a subsequent authority gate"*), this document provides the formal **authority decision preparation package** required before any numerical Price-to-Adjusted Book Value (P/ABV) scoring bands can be authorized, codified, or unlocked in the runtime engine.

### Standing Governance Boundaries
1. **Zero Invented Thresholds:** No numerical scoring thresholds (e.g. 90/75/60/45/20) or comparison bands are invented by engineering.
2. **Neutral Alternatives:** Multiple calibration methodology alternatives are presented objectively without engineering advocacy.
3. **Strict Isolation:** This decision package applies **strictly and exclusively to Banking**. Insurance, Capital Markets, Healthcare, and Hospitality remain 100% fail-closed and uncalibrated.

---

## 2. Current Banking Valuation State (Stage 1 Baseline)

### 2.1. Layer 2.5 Scaffold Behavior
In `frontend/server/valuation/eod-valuation-synthesizer.ts`, `synthesizeBankingScaffold()` calculates raw mathematical quantities:
- **Net Worth Base:** Reads `tangibleNetWorth` or `totalEquity`.
- **Net NPA Deduction:** Reads `netNpa` (defaults to 0 if zero net NPA reported).
- **Adjusted Book Value (ABV):**
  $$\text{ABV} = \text{Tangible Net Worth (or Total Equity)} - \text{Net NPA}$$
- **Adjusted Book Value Per Share (ABVPS):**
  $$\text{ABVPS} = \frac{\text{ABV}}{\text{sharesOutstanding}}$$
- **Raw Multiple (P/ABV):**
  $$\text{P/ABV} = \frac{\text{eodClosePrice}}{\text{ABVPS}}$$

### 2.2. Decision B2 Boundary Enforcement
- When valid inputs are provided, the synthesizer evaluates raw P/ABV and unconditionally sets:
  ```typescript
  status: 'CALIBRATION_PENDING',
  valuationScore: null,
  multipleType: 'P/ABV',
  calculatedMultiple: Math.round(pabv * 1000) / 1000,
  adjustedBookValue,
  adjustedBookValuePerShare,
  reason: 'CALIBRATION_PENDING: Raw P/ABV metric computed; numerical calibration bands deferred under Program Authority Decision B2'
  ```

### 2.3. Externally Visible Fail-Closed State
In `frontend/server/dynamic-runner/dynamic-engine-runner.ts` (line 111):
```typescript
const blockedSectors = ['Banking', 'Insurance', 'Capital Markets', 'Healthcare', 'Hospitality'];
if (blockedSectors.includes(security.sector)) {
  return { status: 'SECTOR_UNSUPPORTED', composite: null, verdict: null ... };
}
```
**Critical Lineage Finding:**
Because `DynamicEngineRunner.ts` was deliberately left untouched during Stage 1, Banking fails closed **before** calling valuation synthesis. Therefore:
- The Banking scaffold exists solely as an internal Layer-2.5 capability.
- Externally visible LIVE UI surfaces (Decision Matrix, Screener, Executive Dashboard) continue to emit `SECTOR_UNSUPPORTED` with `composite: null` and `valuation: null`.
- Banking **cannot leak uncalibrated scores** into any user-facing surface.

---

## 3. Calibration Input Requirements & Lineage Audit

To establish an authoritative calibration profile for Banking P/ABV, the following inputs and treatments must be reconciled:

```
┌────────────────────────────────┬──────────────────────────┬────────────────────────────┬─────────────────────────────┐
│ Input Attribute                │ Repository Implementation│ Documented D113 Spec       │ Unresolved Authority Item   │
├────────────────────────────────┼──────────────────────────┼────────────────────────────┼─────────────────────────────┤
│ EOD Close Price                │ Verified via CM-UDiFF    │ NSE CM-UDiFF EOD Bhavcopy  │ Resolved (D114 harness)     │
├────────────────────────────────┼──────────────────────────┼────────────────────────────┼─────────────────────────────┤
│ Net Worth Base                 │ tangibleNetWorth / equity│ Audited Tangible Net Worth │ Treatment of revaluation &  │
│                                │                          │                            │ foreign currency reserves   │
├────────────────────────────────┼──────────────────────────┼────────────────────────────┼─────────────────────────────┤
│ Net NPA Treatment              │ Deducted 1:1 from equity │ Basel III Net NPA Schedule │ Treatment of standard asset │
│                                │                          │                            │ provisions & write-offs     │
├────────────────────────────────┼──────────────────────────┼────────────────────────────┼─────────────────────────────┤
│ Diluted Shares Outstanding     │ sharesOutstanding        │ Diluted share capital      │ Treatment of unexercised    │
│                                │                          │                            │ ESOPs / warrant dilution    │
├────────────────────────────────┼──────────────────────────┼────────────────────────────┼─────────────────────────────┤
│ Return on Assets (RoA) Context │ Present in engine input  │ RoA-adjusted multiple      │ Should P/ABV bands be       │
│                                │ (BM-001)                 │ scoring                    │ conditioned on RoA tiers?   │
├────────────────────────────────┼──────────────────────────┼────────────────────────────┼─────────────────────────────┤
│ Subsidiary Value Deduction     │ Not implemented          │ Standalone vs Consolidated │ SOTP adjustment for banking │
│                                │                          │ equity                     │ subsidiaries (e.g. HDFC Sec)│
└────────────────────────────────┴──────────────────────────┴────────────────────────────┴─────────────────────────────┘
```

---

## 4. Calibration Methodology Options (Neutral Alternatives)

To avoid engineering bias, four mathematically sound and established financial methodology options are presented for Program Authority evaluation:

### Option 1: Historical Cycle Distribution (Time-Series Percentile)
- **Concept:** Calibrate P/ABV scoring bands based on the 10-year historical distribution of P/ABV multiples for Indian scheduled commercial banks (2014–2024).
- **Structure:**
  - Top quintile historical valuation ($>80\text{th percentile}$) $\rightarrow$ Score 20 (Expensive/Overvalued).
  - Median valuation ($40\text{th} - 60\text{th percentile}$) $\rightarrow$ Score 60 (Fair Value).
  - Bottom quintile historical valuation ($<20\text{th percentile}$) $\rightarrow$ Score 90 (Undervalued).
- **Trade-offs:** Captures full Indian credit cycles (asset quality review, COVID, post-2021 credit expansion), but requires a verified 10-year historical fundamental dataset.

### Option 2: Peer Cross-Sectional Distribution (Cross-Sectional Percentile)
- **Concept:** Score banks relative to the prevailing cross-sectional distribution of all NSE-listed private and public sector commercial banks on the current trade date.
- **Structure:** Bands are dynamically re-indexed or quarterly calibrated against the active universe median and standard deviations.
- **Trade-offs:** Highly adaptive to structural market re-ratings, but creates moving score targets where an individual bank's score changes without fundamental shifts due to peer multiple expansion.

### Option 3: Return on Assets (RoA) Conditional Quality Matrix
- **Concept:** P/ABV multiples are intrinsically linked to bank profitability. A $2.5\times$ P/ABV is cheap for a bank earning $2.0\%$ RoA (e.g. HDFC Bank historically), but extremely expensive for a bank earning $0.5\%$ RoA.
- **Structure:** A dual-lookup matrix where the P/ABV band thresholds shift based on the bank's audited RoA tier (`BM-001`).
- **Trade-offs:** Financially superior and mathematically rigorous; requires coupling the valuation synthesizer to the engine's RoA metric input.

### Option 4: Static Expert-Calibrated Policy Bands (Reference Standard)
- **Concept:** Establish fixed, conservative structural bands based on institutional banking valuation norms in the Indian banking system:
  - Band 1 (Score 90 / Undervalued): $\text{P/ABV} < 1.2\times$
  - Band 2 (Score 75 / Attractive): $1.2\times \le \text{P/ABV} < 1.8\times$
  - Band 3 (Score 60 / Fair Value): $1.8\times \le \text{P/ABV} < 2.5\times$
  - Band 4 (Score 45 / Stretched): $2.5\times \le \text{P/ABV} < 3.2\times$
  - Band 5 (Score 20 / Overvalued): $\text{P/ABV} \ge 3.2\times$
- **Trade-offs:** Highly transparent, deterministic, zero moving targets, simple to test and verify; does not dynamically adjust to interest rate regime shifts.

---

## 5. Governance Questions for Authority Adjudication

Before Stage 2 implementation can be authorized, Program Authority must explicitly adjudicate the following 10 governance questions:

1. **`Q-CAL-01` (Methodology Selection):** Which calibration methodology (Option 1 Historical, Option 2 Cross-Sectional, Option 3 RoA-Conditional, or Option 4 Static Policy Bands) shall be adopted?
2. **`Q-CAL-02` (Population Scope):** Does the calibration population include **all** NSE commercial banks, or is it segregated into Private Sector Banks vs. Public Sector Undertaking (PSU) Banks?
3. **`Q-CAL-03` (Observation Window):** If historical data is utilized, what is the authoritative observation window (e.g., 5-year vs. 10-year)?
4. **`Q-CAL-04` (Numerical Threshold Sign-off):** What are the exact numerical cut-offs $[X_1, X_2, X_3, X_4]$ separating Scores 90, 75, 60, 45, and 20?
5. **`Q-CAL-05` (Negative/Near-Zero ABV Policy):** Confirm that distressed banks ($\text{Net NPA} \ge \text{Net Worth}$) must strictly fail closed with `VALUATION_UNAVAILABLE` rather than receiving a minimum score (e.g. 15 or 20).
6. **`Q-CAL-06` (Exceptional Bank Events):** How should structural capital injections (e.g. Government recapitalization bonds) or emergency mergers (e.g. Yes Bank reconstruction) be flagged?
7. **`Q-CAL-07` (Recalibration Cadence):** Is the calibration profile static (annual review) or dynamically recalibrated post-quarterly LODR filings?
8. **`Q-CAL-08` (Versioning & Effective Dates):** What profile ID and schema version should be assigned (e.g., `banking-valuation-calibration-1.0.0.json`)?
9. **`Q-CAL-09` (Dynamic Runner Unlocking):** Upon successful valuation calibration, is `DynamicEngineRunner.ts` authorized to remove `Banking` from `blockedSectors` and calculate live composite scores?
10. **`Q-CAL-10` (Decision Matrix Weighting):** Does the calibrated Banking valuation score map exclusively to the Decision Matrix valuation axis, or does it also contribute 15% to dynamic composite calculation (matching calibrated sectors)?

---

## 6. Data-Source & Regulatory Boundary

```
┌───────────────────────────────────────┬───────────────────────────────┬─────────────────────────────┐
│ Data Element                          │ Current Repository State      │ External Regulatory Target  │
├───────────────────────────────────────┼───────────────────────────────┼─────────────────────────────┤
│ EOD Bhavcopy Market Data              │ Verified (D114 / OPERATOR_DROP)│ NSE CM-UDiFF EOD Bhavcopy   │
├───────────────────────────────────────┼───────────────────────────────┼─────────────────────────────┤
│ HDFC Bank Reference Denominators      │ Static fixture (v1.1-reference)│ Quarterly SEBI LODR Filings │
├───────────────────────────────────────┼───────────────────────────────┼─────────────────────────────┤
│ Sector-Wide Banking Net NPA Database  │ ABSENT                        │ RBI Basel III Disclosures   │
├───────────────────────────────────────┼───────────────────────────────┼─────────────────────────────┤
│ Sector-Wide Share Dilution Schedules  │ ABSENT                        │ NSE Corporate Filings Feed  │
└───────────────────────────────────────┴───────────────────────────────┴─────────────────────────────┘
```
**Data Boundary Mandate:**
Under Decision **E1**, any Stage 2 implementation must operate strictly with **development reference denominators** (`DEVELOPMENT_MIXED_VINTAGE`). Real production data ingestion remains gated.

---

## 7. Stage 2 Implementation Gate & Acceptance Criteria

When Program Authority issues an explicit Stage 2 charter, the implementation must satisfy these strict gates:

1. **Explicit Adjudication Record:** Written selections recorded for Questions `Q-CAL-01` through `Q-CAL-10`.
2. **Immutable Calibration Profile:** Codification of approved bands into an external JSON asset (e.g. `frontend/server/valuation/calibration/banking-valuation-calibration-1.0.0.json`).
3. **Valuation Score Synthesis:** Update `synthesizeBankingScaffold()` to evaluate the approved bands and return `status: 'CALCULATED'` with an integer/float `valuationScore` when valid, while maintaining `CALIBRATION_PENDING` if unapproved.
4. **Dynamic Runner Integration:** If authorized under `Q-CAL-09`, update `DynamicEngineRunner.ts` to execute dynamic Banking evaluations.
5. **Zero Regression:**
   - 65 / 65 D112 tests passing.
   - 61 / 61 D114 market-data tests passing.
   - All 13 sector snapshot fixtures 100% byte-identical.
   - ADR-01 `BankingScoreEngine.ts` remaining 100% untouched.

---

## 8. Five-Sector Separation Reaffirmation

This decision package applies **ONLY to Banking**. The remaining four sectors remain strictly untouched:
- **Insurance:** Blocked (`BLOCKED_UNCALIBRATED`); pending separate actuarial Embedded Value source.
- **Capital Markets:** Blocked (`BLOCKED_UNCALIBRATED`); pending sub-segment routing adjudication.
- **Healthcare:** Blocked (`BLOCKED_UNCALIBRATED`); pending Ind AS 116 lease policy decision (**Decision C2**).
- **Hospitality:** Blocked (`BLOCKED_UNCALIBRATED`); pending Ind AS 116 lease policy decision (**Decision C2**).

---

## 9. D112 / D114 Preservation Checklist

```
[✓] D112-A Security Master: Preserved; no unevidenced candidate promotions.
[✓] D112-B Development Fundamentals: Preserved; DEVELOPMENT_MIXED_VINTAGE provenance intact.
[✓] D112-C Valuation Architecture: Extended cleanly without parallel subsystems.
[✓] D112-D Dynamic Engine Runner: Preserved; fail-closed guards intact.
[✓] D112-E Dynamic Transport & UI: Preserved; dual-plane isolation intact.
[✓] D114 Batch Ingestion Harness: Preserved; zero market-data mutations.
[✓] ADR-01 Engine Mathematics: Preserved; BankingScoreEngine.ts 100% byte-identical.
```

---

**D113-STAGE2 BANKING CALIBRATION AUTHORITY PREPARATION COMPLETE. STRICTLY READ-ONLY. ZERO CODE OR CALIBRATION THRESHOLDS INTRODUCED. AWAITING PROGRAM AUTHORITY DIRECTION.**
