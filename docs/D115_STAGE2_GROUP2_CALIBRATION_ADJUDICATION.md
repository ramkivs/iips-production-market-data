# IIPS PROGRAM AUTHORITY DECISION RECORD: D115-STAGE2 CALIBRATION ADJUDICATION
## Formal Authority Determination for Group 2 (Life Insurance & Capital Markets) Numerical Calibration

**Document Reference:** `docs/D115_STAGE2_GROUP2_CALIBRATION_ADJUDICATION.md`  
**Governing Authority:** Program Authority (Sai / Ramki)  
**Adjudication Date:** 2026-09-17  
**Status:** **RECORDED & RATIFIED — FORMAL PROGRAM DIRECTIVE**  
**Baseline Git HEAD:** `0ae6d62b328637855c0042a5045d84bad207fe6c`  
**Branch:** `arena/01a0a438-iips-production-market-data` (100% remote parity with `origin`)  

---

## 1. Executive Summary & Adjudication Basis

Following the formal submission and review of `docs/D115_STAGE2_GROUP2_CALIBRATION_AUTHORITY_PREPARATION.md`, the Program Authority has rendered binding determinations for each of the ten governance questions (**Q-GRP2-CAL-01 through Q-GRP2-CAL-10**) governing **Group 2 (Life Insurance and Capital Markets) Numerical Calibration**.

### Core Authority Directives Applied:
1. **Methodology Harmony (Reaffirming Q-CAL-01):** Adopts static expert-calibrated structural policy bands. This eliminates moving targets, prevents small-sample distortions, and decouples calibration from empirical historical time-series dependencies (`OI-HIST-01`).
2. **Standard 5-Tier Scoring Structure:** Establishes discrete, lower-inclusive, upper-exclusive standard scoring bands across all three Group 2 valuation multiples, mapping deterministically to the ratified scores:
   $$\mathbf{90.0 \quad (\text{Tier 1})}, \quad \mathbf{75.0 \quad (\text{Tier 2})}, \quad \mathbf{60.0 \quad (\text{Tier 3})}, \quad \mathbf{45.0 \quad (\text{Tier 4})}, \quad \mathbf{20.0 \quad (\text{Tier 5})}$$
3. **Strict Runner Gate Enforcement:** `Insurance` and `Capital Markets` remain in `blockedSectors` (line 114) in `DynamicEngineRunner.ts`. Unlocking requires complete Stage 2 implementation, 100% test passing, and a separate subsequent authority acceptance gate (following the verified `D113-QCAL09` pattern).
4. **Zero Code / Test Modifications in this Act:** This document is an **authority decision act only**. Zero lines of implementation source code, test suites, or configuration files are modified.

---

## 2. Itemized Authority Determinations (Q-GRP2-CAL-01 through Q-GRP2-CAL-10)

```
┌──────────────────┬─────────────────────────────────────────────────┬──────────────────────────────────────────┐
│ Decision Code    │ Governance Subject                              │ Ratified Determination                   │
├──────────────────┼─────────────────────────────────────────────────┼──────────────────────────────────────────┤
│ Q-GRP2-CAL-01    │ Calibration Methodology                         │ A — Static Expert-Calibrated Policy Bands│
│ Q-GRP2-CAL-02    │ Life Insurance Population Scope                 │ A — Unified Life Insurance Population    │
│ Q-GRP2-CAL-03    │ Capital Markets Segmentation                    │ A — Preserve AMC vs. Non-AMC             │
│ Q-GRP2-CAL-04    │ Numerical Scoring Bands                         │ A — Authority Provides Exact Bands       │
│ Q-GRP2-CAL-05    │ Exceptional Events Treatment                    │ A — exceptionalEventFlag = true => UNAVAIL│
│ Q-GRP2-CAL-06    │ Distressed / Invalid Inputs                     │ A — Strict Fail-Closed UNAVAILABLE       │
│ Q-GRP2-CAL-07    │ Calibration Profile Governance                  │ A — Immutable Versioned JSON (1.0.0)     │
│ Q-GRP2-CAL-08    │ Recalibration Cadence                           │ A — Annual Review; Zero Runtime Drift    │
│ Q-GRP2-CAL-09    │ Production Eligibility Boundary                 │ A — Development / Reference-Only         │
│ Q-GRP2-CAL-10    │ Dynamic Engine Runner Unlock Gate               │ A — Blocked Until Acceptance + Auth Gate │
└──────────────────┴─────────────────────────────────────────────────┴──────────────────────────────────────────┘
```

---

## 3. Explicit Determinations & Ratified Parameters

### Q-GRP2-CAL-01 — CALIBRATION METHODOLOGY
- **Selected Option:** **A — Static expert-calibrated policy bands**.
- **Determination:** Program Authority ratifies static structural valuation bands based on institutional Indian equity research benchmarks. Dynamic rolling percentiles and peer cross-sectional ranking are rejected due to small peer group sizes and empirical lookback dependencies.

### Q-GRP2-CAL-02 — LIFE INSURANCE POPULATION
- **Selected Option:** **A — Unified Life Insurance population**.
- **Determination:** Single calibration tiering applies uniformly across all Indian listed life insurers (private sector leaders and public sector entities alike). Non-Life Insurance remains strictly excluded per `Q-GRP2-04 = D`.

### Q-GRP2-CAL-03 — CAPITAL MARKETS SEGMENTATION
- **Selected Option:** **A — Preserve AMC vs Non-AMC segmentation: AMC = Market Cap / AUM; Non-AMC = P/E**.
- **Determination:** The two-segment architecture ratified in Stage 1 is reaffirmed as the sole controlling segmentation. Zero cross-methodology fallback is permitted.

### Q-GRP2-CAL-04 — NUMERICAL SCORING BANDS
- **Selected Option:** **A — Authority provides exact numerical bands now**.
- **Determination:** Program Authority formally ratifies and establishes the following exact 5-tier numerical scoring schedules:

#### 1. Life Insurance — Price-to-Embedded Value (P/EV)
$$\begin{aligned}
\text{Tier 1 (Elite / Deep Value):} & \quad \mathbf{\text{P/EV} < 1.800\times} && \longrightarrow \mathbf{\text{Score: } 90.0} \\
\text{Tier 2 (Attractive Valuation):} & \quad \mathbf{1.800\times \le \text{P/EV} < 2.400\times} && \longrightarrow \mathbf{\text{Score: } 75.0} \\
\text{Tier 3 (Fair Value Benchmark):} & \quad \mathbf{2.400\times \le \text{P/EV} < 3.200\times} && \longrightarrow \mathbf{\text{Score: } 60.0} \\
\text{Tier 4 (Stretched Valuation):} & \quad \mathbf{3.200\times \le \text{P/EV} < 4.000\times} && \longrightarrow \mathbf{\text{Score: } 45.0} \\
\text{Tier 5 (Overvalued / Expensive):} & \quad \mathbf{\text{P/EV} \ge 4.000\times} && \longrightarrow \mathbf{\text{Score: } 20.0}
\end{aligned}$$

#### 2. Capital Markets AMC — Market Cap / AUM Ratio (%)
$$\begin{aligned}
\text{Tier 1 (Deep Value / Undervalued):} & \quad \mathbf{\text{MCap / AUM} < 6.000\%} && \longrightarrow \mathbf{\text{Score: } 90.0} \\
\text{Tier 2 (Attractive Valuation):} & \quad \mathbf{6.000\% \le \text{MCap / AUM} < 9.000\%} && \longrightarrow \mathbf{\text{Score: } 75.0} \\
\text{Tier 3 (Fair Value Benchmark):} & \quad \mathbf{9.000\% \le \text{MCap / AUM} < 13.000\%} && \longrightarrow \mathbf{\text{Score: } 60.0} \\
\text{Tier 4 (Stretched Valuation):} & \quad \mathbf{13.000\% \le \text{MCap / AUM} < 17.000\%} && \longrightarrow \mathbf{\text{Score: } 45.0} \\
\text{Tier 5 (Overvalued / Expensive):} & \quad \mathbf{\text{MCap / AUM} \ge 17.000\%} && \longrightarrow \mathbf{\text{Score: } 20.0}
\end{aligned}$$

#### 3. Capital Markets Non-AMC — Price-to-Earnings (P/E)
$$\begin{aligned}
\text{Tier 1 (Deep Value / Undervalued):} & \quad \mathbf{\text{P/E} < 18.000\times} && \longrightarrow \mathbf{\text{Score: } 90.0} \\
\text{Tier 2 (Attractive Valuation):} & \quad \mathbf{18.000\times \le \text{P/E} < 26.000\times} && \longrightarrow \mathbf{\text{Score: } 75.0} \\
\text{Tier 3 (Fair Value Benchmark):} & \quad \mathbf{26.000\times \le \text{P/E} < 38.000\times} && \longrightarrow \mathbf{\text{Score: } 60.0} \\
\text{Tier 4 (Stretched Valuation):} & \quad \mathbf{38.000\times \le \text{P/E} < 52.000\times} && \longrightarrow \mathbf{\text{Score: } 45.0} \\
\text{Tier 5 (Overvalued / Expensive):} & \quad \mathbf{\text{P/E} \ge 52.000\times} && \longrightarrow \mathbf{\text{Score: } 20.0}
\end{aligned}$$

*Evaluation Semantics:* Lower-inclusive, upper-exclusive standard ADR-01 band semantics.

### Q-GRP2-CAL-05 — EXCEPTIONAL EVENTS
- **Selected Option:** **A = exceptionalEventFlag = true always fails closed as UNAVAILABLE**.
- **Determination:** Restructuring schemes, regulatory bans, and distressed amalgamations fail closed with `status: 'UNAVAILABLE'` and reason `EXCEPTIONAL_EVENT_EXCLUDED`. No arbitrary floor score may be awarded.

### Q-GRP2-CAL-06 — DISTRESSED / INVALID INPUTS
- **Selected Option:** **A = Strict fail-closed policy**.
- **Determination:**
  - Life Insurance: $\text{Embedded Value} \le 0$ OR $\text{Solvency Ratio} < 1.50 \longrightarrow \text{UNAVAILABLE}$.
  - Capital Markets AMC: $\text{Total AUM} \le 0 \longrightarrow \text{UNAVAILABLE}$.
  - Capital Markets Non-AMC: $\text{EPS} \le 0 \longrightarrow \text{UNAVAILABLE}$.
  - Non-positive or non-finite EOD close price or shares outstanding $\longrightarrow \text{UNAVAILABLE}$.

### Q-GRP2-CAL-07 — CALIBRATION PROFILE GOVERNANCE
- **Selected Option:** **A = Immutable versioned JSON profiles**.
- **Determination:** Ratified scoring bands shall be codified into two dedicated, versioned external assets:
  1. `frontend/server/valuation/calibration/insurance-valuation-calibration-1.0.0.json`
  2. `frontend/server/valuation/calibration/capital-markets-valuation-calibration-1.0.0.json`

### Q-GRP2-CAL-08 — RECALIBRATION CADENCE
- **Selected Option:** **A = Annual authority review; zero automatic runtime drift**.
- **Determination:** Static band schedules are governed under annual Program Authority review. Zero automated online learning, self-tuning loops, or algorithmic drift.

### Q-GRP2-CAL-09 — PRODUCTION ELIGIBILITY
- **Selected Option:** **A = Development/reference-only until authoritative fundamentals, data rights, production provenance, and required production controls are separately established and accepted**.
- **Determination:** Emits `dataMode: 'LIVE'`, `freshness: 'DEVELOPMENT_MIXED_VINTAGE'`, `fundamentalsVintage: 'v1.1-reference'`. Unattended production dynamic execution remains blocked by open dependencies `OI-FUND-01` and `OI-P16-01..06`.

### Q-GRP2-CAL-10 — DYNAMIC RUNNER UNLOCK
- **Selected Option:** **A = Keep Insurance and Capital Markets blocked until: (1) Stage 2 implementation complete; (2) calibration tests pass; (3) acceptance reconciliation passes; (4) provenance/version checks pass; (5) regression floor remains green; (6) separate authority explicitly authorizes runner unlock**.
- **Determination:** `DynamicEngineRunner.ts` must maintain `Insurance` and `Capital Markets` in `blockedSectors` during Stage 2 implementation. Unlocking is strictly deferred to a subsequent Stage 3 operational unlock gate.

---

## 4. Distinction Between Newly Adjudicated and Previously Frozen Decisions

| Decision Domain | Governing Document | Status | Scope |
|---|---|:---:|---|
| **D115 Stage 1 Decisions** (`Q-GRP2-01..16`) | `docs/D115_GROUP2_INSURANCE_CAPITAL_MARKETS_ADJUDICATION.md` | **FROZEN / ACCEPTED** | Defined raw metrics (P/EV, MCap/AUM, P/E), Life-only scope, solvency guard (1.50), AMC segmentation, and calibration deferral. |
| **D115 Stage 2 Decisions** (`Q-GRP2-CAL-01..10`) | `docs/D115_STAGE2_GROUP2_CALIBRATION_ADJUDICATION.md` (This Act) | **NEWLY RATIFIED** | Establishes exact numerical 5-tier scoring bands, profile asset paths (1.0.0), annual governance review, and runner unlock gate. |

---

## 5. Affirmation of Baseline Invariance & Boundaries

1. **Banking Operational Baseline Intact:**
   - Banking dynamic execution remains fully operational under ratified **D113-QCAL09** and is **100% UNTOUCHED AND FROZEN**.
2. **Healthcare & Hospitality Blocked:**
   - Both sectors remain strictly blocked (`SECTOR_UNSUPPORTED`) in `DynamicEngineRunner.ts` (line 114) with **Decision C2** (Ind AS 116 Lease Policy) unresolved.
3. **Certified ADR-01 Sector Engines Intact:**
   - `InsuranceScoreEngine.ts`, `CapitalMarketsScoreEngine.ts`, and `BankingScoreEngine.ts` composite scoring, weights, and golden reference fixtures remain **100% byte-identical**.
4. **No Implementation Authorized in this Act:**
   - This document is a **decision record only**. No implementation code or test modifications have been executed in this turn.
   - Subsequent implementation of these ratified bands requires an explicit implementation charter.

---

## 6. Git Durability & Remote Parity

- **Baseline HEAD:** `0ae6d62b328637855c0042a5045d84bad207fe6c`
- **Working Tree State:** Completely clean; contains only read-only documentation deliverables.
- **Remote Parity:** 100% synchronized with `origin/arena/01a0a438-iips-production-market-data`.

---

**PROGRAM AUTHORITY ADJUDICATION RATIFIED. AWAITING BOUNDED IMPLEMENTATION CHARTER FOR STAGE 2 ASSET CODIFICATION AND SYNTHESIZER INTEGRATION.**
