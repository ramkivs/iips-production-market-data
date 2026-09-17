# IIPS PROGRAM AUTHORITY DECISION RECORD: D113-STAGE2 BANKING CALIBRATION ADJUDICATION
## Formal Authority Determination for Banking P/ABV Numerical Calibration

**Document Reference:** `docs/D113_STAGE2_BANKING_CALIBRATION_ADJUDICATION.md`  
**Governing Authority:** Program Authority (Sai / Ramki)  
**Adjudication Date:** 2026-09-17  
**Status:** **RECORDED & RATIFIED — FORMAL PROGRAM DIRECTIVE**  
**Baseline Git HEAD:** `914cdc6ce4dfaaff0da5f194b50bc18792991f58`  
**Branch:** `arena/01a0a438-iips-production-market-data`  

---

## 1. Executive Authority Determinations (Q-CAL-01 through Q-CAL-10)

Following the formal review of `docs/D113_STAGE2_BANKING_CALIBRATION_AUTHORITY_PREPARATION.md`, the Program Authority has rendered binding determinations for each of the ten governance questions governing **Banking Price-to-Adjusted Book Value (P/ABV) Calibration**:

```
┌──────────────┬─────────────────────────────────────────────────┬──────────────────────────┐
│ Decision Item│ Governance Subject                              │ Ratified Determination   │
├──────────────┼─────────────────────────────────────────────────┼──────────────────────────┤
│ Q-CAL-01     │ Calibration Methodology                         │ D — Static Policy Bands  │
│ Q-CAL-02     │ Banking Population Scope                        │ A — Unified Population   │
│ Q-CAL-03     │ Observation Window Baseline                     │ D — Defer / N/A (Static) │
│ Q-CAL-04     │ Numerical Thresholds Approval                   │ A — Approve D113 Package │
│ Q-CAL-05     │ Distressed / Non-Positive ABV Policy            │ A — Continue Fail-Closed │
│ Q-CAL-06     │ Exceptional Bank Events Treatment               │ A — Exclude Defined Evts │
│ Q-CAL-07     │ Recalibration Cadence                           │ A — Annual Review        │
│ Q-CAL-08     │ Profile Schema & Versioning                     │ A — Immutable Versioned  │
│ Q-CAL-09     │ Dynamic Engine Runner Unlocking Gate            │ A — Blocked Until Accept │
│ Q-CAL-10     │ Decision Matrix Presentation Axis               │ A — Orthogonal Axis Only │
└──────────────┴─────────────────────────────────────────────────┴──────────────────────────┘
```

---

## 2. Itemized Adjudication & Architectural Mandates

### 1. Methodology Selection (`Q-CAL-01` $\rightarrow$ Option D)
- **Determination:** Adopt **Option D: Static Expert-Calibrated Policy Bands**.
- **Rationale:** Establishes fixed, transparent, deterministic structural valuation bands based on institutional Indian banking norms. Avoids moving score targets and eliminates dependencies on unverified external time-series data.

### 2. Population Scope (`Q-CAL-02` $\rightarrow$ Option A)
- **Determination:** Adopt **Option A: Unified Commercial-Banking Population**.
- **Scope:** Applies uniformly across all scheduled commercial banks (Private Sector Banks and PSU Banks) listed on the NSE Cash Market.

### 3. Observation Window (`Q-CAL-03` $\rightarrow$ Option D)
- **Determination:** **Deferred / Not Applicable**. Because static expert-calibrated policy bands have been adopted under `Q-CAL-01`, a dynamic time-series observation window is not required.

### 4. Approved Numerical Scoring Thresholds (`Q-CAL-04` $\rightarrow$ Option A)
- **Determination:** Program Authority formally ratifies and approves the 5-tier structural scoring schedule specified in the D113 package:

$$\begin{aligned}
\text{Tier 1 (Elite / Deep Value / Undervalued):} & \quad \mathbf{\text{P/ABV} < 1.2\times} && \longrightarrow \mathbf{\text{Score: } 90.0} \\
\text{Tier 2 (Attractive Valuation):} & \quad \mathbf{1.2\times \le \text{P/ABV} < 1.8\times} && \longrightarrow \mathbf{\text{Score: } 75.0} \\
\text{Tier 3 (Fair Value / Benchmark Baseline):} & \quad \mathbf{1.8\times \le \text{P/ABV} < 2.5\times} && \longrightarrow \mathbf{\text{Score: } 60.0} \\
\text{Tier 4 (Stretched Valuation):} & \quad \mathbf{2.5\times \le \text{P/ABV} < 3.2\times} && \longrightarrow \mathbf{\text{Score: } 45.0} \\
\text{Tier 5 (Overvalued / Expensive):} & \quad \mathbf{\text{P/ABV} \ge 3.2\times} && \longrightarrow \mathbf{\text{Score: } 20.0}
\end{aligned}$$

- **Evaluation Semantics:** Lower-inclusive, upper-exclusive standard ADR-01 band semantics.

### 5. Distressed / Insolvent ABV Policy (`Q-CAL-05` $\rightarrow$ Option A)
- **Determination:** **Strict Fail-Closed**.
- **Mandate:** If Adjusted Book Value $\le 0$ (i.e. $\text{Net NPA} \ge \text{Net Worth}$), the system **MUST NOT** assign an arbitrary low score (e.g. 15 or 20). It must fail closed emitting:
  $$\text{status: 'UNAVAILABLE'}, \quad \text{valuationScore: null}, \quad \text{reason: 'NON\_POSITIVE\_ADJUSTED\_BOOK\_VALUE'}$$

### 6. Exceptional Bank Events Policy (`Q-CAL-06` $\rightarrow$ Option A)
- **Determination:** **Exclude Defined Exceptional Events**.
- **Mandate:** Restructuring moratoriums, government recapitalization bonds, or distressed amalgamations must be accompanied by explicit data-quality provenance flags and audited balance-sheet adjustments before valuation evaluation.

### 7. Recalibration Cadence (`Q-CAL-07` $\rightarrow$ Option A)
- **Determination:** **Annual Scheduled Review**.
- **Mandate:** The static policy band thresholds are governed under annual review by Program Authority. Intra-year quarterly LODR filings update individual bank ABV and ABVPS denominators, not the threshold bands.

### 8. Calibration Profile Versioning (`Q-CAL-08` $\rightarrow$ Option A)
- **Determination:** **Immutable Versioned Profile Asset**.
- **Artifact:** Future implementation shall codify these approved bands into an external, immutable asset:
  `frontend/server/valuation/calibration/banking-valuation-calibration-1.0.0.json` (or integrated profile Map).

### 9. Dynamic Engine Runner Unlocking Gate (`Q-CAL-09` $\rightarrow$ Option A)
- **Determination:** **Remain Blocked Until Implementation + Verification Acceptance**.
- **Mandate:** `DynamicEngineRunner.ts` shall **NOT** immediately unlock Banking upon profile creation. Banking shall remain in `blockedSectors` until an explicit Stage 2 verification suite demonstrates 100% test passing, zero snapshot regressions, and formal authority acceptance.

### 10. Presentation & Decision Matrix Treatment (`Q-CAL-10` $\rightarrow$ Option A)
- **Determination:** **Preserve Layer-2.5 Orthogonal Presentation Axis (Reaffirming Decision A1)**.
- **Mandate:** The synthesized Banking valuation score serves strictly as the $y$-axis (Valuation) in the Decision Matrix Quality vs. Valuation scatter plot.
- **Invariance:** Certified ADR-01 `BankingScoreEngine.ts` composite weights, golden references, and frozen expected outputs remain **100% UNTOUCHED**.

---

## 3. Scope & Strict Boundaries

1. **Banking Only:** This adjudication authorizes the parameters **exclusively for Banking**.
2. **Four Sectors Blocked:**
   - **Insurance:** Blocked (`BLOCKED_UNCALIBRATED`).
   - **Capital Markets:** Blocked (`BLOCKED_UNCALIBRATED`).
   - **Healthcare:** Blocked (`BLOCKED_UNCALIBRATED`, pending Decision C2).
   - **Hospitality:** Blocked (`BLOCKED_UNCALIBRATED`, pending Decision C2).
3. **No Implementation Authorized in This Act:**
   - This document is an **adjudication record only**.
   - No lines of source code or tests were modified during this act.
   - Implementation of these ratified decisions requires an explicit subsequent implementation directive.

---

## 4. Current State & Working Tree Audit

- **Baseline HEAD:** `914cdc6ce4dfaaff0da5f194b50bc18792991f58`
- **Branch:** `arena/01a0a438-iips-production-market-data`
- **Source Code Status:** **0 lines modified**.
- **Test Status:** **0 lines modified** (126/126 automated tests passing).
- **Working Tree:** Intact and clean; contains only read-only documentation artifacts.

---

**PROGRAM AUTHORITY ADJUDICATION RATIFIED. AWAITING EXPLICIT IMPLEMENTATION CHARTER FOR STAGE 2 CODIFICATION.**
