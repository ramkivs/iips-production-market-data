# IIPS D115: GROUP 2 (INSURANCE & CAPITAL MARKETS) VALUATION CALIBRATION
## AUTHORITY PREPARATION & SPECIFICATION RECORD

**Document Reference:** `docs/D115_GROUP2_INSURANCE_CAPITAL_MARKETS_AUTHORITY_PREPARATION.md`  
**Governing Authority:** Program Authority (Sai / Ramki)  
**Preparation Scope:** Strictly Read-Only Forensic Architecture Review, Methodology Options & Authority Decision Questions for Group 2 Sectors (Insurance & Capital Markets)  
**Baseline Git HEAD:** `7bf8730bb3fa072d6896245d8205cb3677761005`  
**Branch:** `arena/01a0a438-iips-production-market-data` (100% remote parity with `origin`)  

---

## 1. Scope & Strict Boundaries

This document provides a strictly read-only technical and governance preparation package for **Group 2 Valuation Calibration**, covering exclusively:
1. **Insurance**
2. **Capital Markets**

### Absolute Architectural & Governance Safeguards:
- **No Implementation:** Zero lines of implementation source code, test suites, or configuration files are modified by this document.
- **No Unlocking:** `Insurance` and `Capital Markets` remain strictly blocked (`SECTOR_UNSUPPORTED`) in `frontend/server/dynamic-runner/dynamic-engine-runner.ts` (line 114).
- **Four Sectors Preserved as Blocked:**
  - `Insurance`: **BLOCKED**
  - `Capital Markets`: **BLOCKED**
  - `Healthcare`: **BLOCKED** (Decision C2 unresolved)
  - `Hospitality`: **BLOCKED** (Decision C2 unresolved)
- **Banking Preserved:** Banking remains the sole additional unlocked sector per ratified **D113-QCAL09**.
- **ADR-01 Invariance:** Sector engines (`InsuranceScoreEngine.ts`, `CapitalMarketsScoreEngine.ts`) and composite weights remain **100% UNTOUCHED**.
- **Zero Threshold Invention:** No numerical calibration thresholds or band rankings are selected or recommended in this act.

---

## 2. Current Architecture Forensic Findings

A forensic review of the repository identified the current structural state of Insurance and Capital Markets across all platform layers:

```
┌──────────────────────────────────────┬──────────────────────────────────────────────────────────────────┐
│ Architectural Layer                  │ Forensic Finding for Insurance & Capital Markets                 │
├──────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ 1. Certified ADR-01 Sector Engines   │ Fully implemented in iips-platform/src/sector-engines/.          │
│    - InsuranceScoreEngine.ts         │ 5 pillars: underwriting (0.30), solvency (0.20), growth (0.20),  │
│                                      │ persistency (0.15), profitability (0.15). Composite: 0..100.    │
│    - CapitalMarketsScoreEngine.ts    │ 5 pillars: earnings-quality (0.25), growth (0.20),               │
│                                      │ profitability (0.20), franchise (0.20), operating-eff (0.15).    │
│                                      │ NOTE: Neither engine includes a 'valuation' pillar.             │
├──────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ 2. Layer-2.5 Valuation Synthesizer   │ frontend/server/valuation/eod-valuation-synthesizer.ts.          │
│    - Status                          │ Both sectors reside in UNCALIBRATED_BLOCKED_SECTORS.            │
│    - Runtime Behavior                │ evaluate() emits status: 'BLOCKED_UNCALIBRATED', score: null.   │
├──────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ 3. Dynamic Engine Runner             │ frontend/server/dynamic-runner/dynamic-engine-runner.ts.         │
│    - Status                          │ Both sectors reside in blockedSectors (line 114).               │
│    - Runtime Behavior                │ execute() immediately fails closed with SECTOR_UNSUPPORTED,      │
│                                      │ composite: null, verdict: null. Zero silent fallback.            │
├──────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ 4. Security Master Registry          │ frontend/server/security-master/security-master-1.0.0.json.      │
│    - Status                          │ Candidate tickers (HDFCLIFE / BSE) are explicitly registered     │
│                                      │ under excludedCandidateMappings with UNMAPPED_FAIL_CLOSED.       │
│                                      │ Zero active canonical IDs exist for Insurance or Capital Markets.│
├──────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ 5. Golden Reference Benchmarks       │ Fully populated in sector engine directories.                    │
│    - Insurance                       │ insurance-golden-reference-1.0.0.json (Life, General, Health).   │
│    - Capital Markets                 │ capital-markets-golden-reference-1.0.0.json (5 sub-sectors).     │
└──────────────────────────────────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 3. Insurance Valuation Methodology Requirements

### 3.1 Existing Concepts in the Repository
Inspection of `iips-platform/src/sector-engines/insurance/` reveals:
- **Metric Definitions (`InsuranceMetrics.ts`):**
  - `IM-001`: Combined Ratio (loss + expense)
  - `IM-002`: Solvency Ratio (regulatory capital requirement multiple)
  - `IM-003`: Annualized Premium Equivalent (APE, new business sales measure)
  - `IM-004`: Value of New Business (VNB, present value of future profits on new business)
  - `IM-005`: 13th-Month Persistency Ratio (% of policies renewed)
  - `IM-006`: **Embedded Value (EV)** — represents sum of adjusted net worth and present value of in-force business
  - `IM-007`: Expense Ratio
  - `IM-008`: Investment Yield
- **Golden Reference Inputs (`IN-001` Life-Insurer-Alpha):**
  - Explicitly specifies `IM-006: 5000` (Embedded Value in INR Crores).

### 3.2 Technical Valuation Supportability
1. **Life Insurance:**
   - Institutional valuation universally relies on **Price-to-Embedded Value (P/EV)**:
     $$\text{P/EV} = \frac{\text{Market Capitalization}}{\text{Embedded Value}} = \frac{\text{eodClosePrice} \times \text{sharesOutstanding}}{\text{Embedded Value}}$$
   - Or alternatively, **P/EV per share**:
     $$\text{EVPS} = \frac{\text{Embedded Value}}{\text{sharesOutstanding}}, \quad \text{P/EV} = \frac{\text{eodClosePrice}}{\text{EVPS}}$$
2. **General / Health Insurance (Non-Life):**
   - Non-life insurers do not calculate Embedded Value because contracts are typically short-term (1-year annual policies).
   - In `insurance-golden-reference-1.0.0.json`, `IN-002` (General Insurance) explicitly has `"IM-006": 0`.
   - Non-life valuation institutional practice relies on:
     - **Price-to-Book Value (P/BV)**: $\frac{\text{Market Cap}}{\text{Net Worth}}$
     - **Price-to-Earnings (P/E)**: $\frac{\text{Market Cap}}{\text{Net Profit}}$
3. **Fail-Closed & Negative Safeguards:**
   - Solvency Floor: If Solvency Ratio (`IM-002`) $< 1.50$ (statutory regulatory minimum set by IRDAI), synthesis must fail closed with `UNAVAILABLE`.
   - Non-Positive EV: If Embedded Value $\le 0$, synthesis must fail closed with `UNAVAILABLE`.

---

## 4. Capital Markets Methodology Requirements

### 4.1 Sub-Sector Heterogeneity
Inspection of `iips-platform/src/sector-engines/capital-markets/` and its golden reference demonstrates that the Capital Markets sector contains **5 fundamentally distinct business categories**:

1. **Asset Management Companies (AMCs):**
   - Entities: Mutual Fund asset managers (e.g. HDFC AMC, Nippon AMC).
   - Core Driver: Assets Under Management (`CM-001`, AUM).
   - Primary Multiple: **Market Cap-to-AUM Ratio (% of AUM)**:
     $$\text{Market Cap / AUM} = \frac{\text{Market Capitalization}}{\text{Total AUM}} \times 100$$
   - Secondary Multiple: **Price-to-Earnings (P/E)**.
2. **Retail & Institutional Brokerages:**
   - Entities: Angel One, Motilal Oswal, ICICI Securities.
   - Core Driver: Brokerage transaction revenue (`CM-007`), trading volumes, active client count.
   - Primary Multiple: **Price-to-Earnings (P/E)**: Highly cyclical, tracking market turnover.
3. **Exchanges & Market Infrastructure Institutions (MIIs):**
   - Entities: BSE Limited, MCX, CDSL, NSDL, CAMS, KFintech.
   - Core Driver: Transaction fees, depository charges, clearing fees (`CM-005` Recurring Revenue %).
   - Primary Multiple: **Price-to-Earnings (P/E)** or **EV/EBITDA** (reflecting annuity-like operating leverage).
4. **Investment Banking:**
   - Entities: Advisory, underwriting, and deal syndication.
   - Core Driver: Highly volatile advisory fee revenue.
   - Primary Multiple: **Price-to-Book (P/BV)** or **P/E**.
5. **Wealth Management / Distribution:**
   - Entities: 360 ONE, Anand Rathi, Nuvama.
   - Primary Multiple: **Market Cap / AUM** or **P/E**.

### 4.2 Technical Valuation Supportability
- The repository **does not support a single monolithic valuation metric** across all Capital Markets sub-sectors.
- Applying Market Cap / AUM to an exchange (e.g. BSE) is invalid because exchanges have zero AUM.
- Applying P/E uniformly across all sub-sectors is technically viable, but ignores institutional AMC valuation standards (M-Cap/AUM).

---

## 5. Missing-Data & Dependency Analysis

| Sector | Metric Candidate | Denominator Required | Current Repository Status | Production Dependency |
|---|---|---|---|---|
| **Insurance (Life)** | Price / Embedded Value (P/EV) | Embedded Value (`embeddedValue` or `IM-006`) | Present only in golden fixture (`IN-001: 5000 Cr`). Absent from production store. | Annual/Semi-annual actuarial EV disclosures from company filings. |
| **Insurance (Non-Life)** | Price / Book Value (P/BV) | Net Worth (`tangibleNetWorth`) | Present only in golden fixture. Absent from production store. | Quarterly financial report balance sheet data. |
| **Capital Markets (AMC)** | Market Cap / AUM | Total AUM (`totalAum` or `CM-001`) | Present only in golden fixture (`CM-001: 5000 Cr`). Absent from production store. | Monthly AMFI published AUM disclosures. |
| **Capital Markets (All)** | Price / Earnings (P/E) | LTM Net Income / EPS (`ltmEps` or `eps`) | Denominator pattern established in D112-B for Auto/Consumer/Utilities. | Quarterly LODR consolidated financial results. |
| **Security Master** | Active Equities | Canonical mapping for `HDFCLIFE`, `BSE` | Registered as `excludedCandidateMappings` (unmapped fail-closed). | Authoritative NSE Bhavcopy and Dhan master ingestion. |

---

## 6. Neutral Methodology Options for Authority Adjudication

### 6.1 Insurance Methodology Options
- **Option I-A (Single Metric — P/EV Universal):** Apply Price-to-Embedded Value across all insurers. Requires non-life insurers to be classified as unsupported/blocked.
- **Option I-B (Segmented Architecture — Life vs. Non-Life):** Segment Insurance into Life (P/EV) and General/Health (P/BV or P/E).
- **Option I-C (Defer Non-Life, Implement Life Only):** Stage Insurance implementation by initially scoping only Life Insurance under P/EV, keeping General/Health blocked.

### 6.2 Capital Markets Methodology Options
- **Option CM-A (Unified P/E Multiple):** Apply standard Price-to-Earnings (P/E) uniformly across all 5 capital market sub-sectors.
- **Option CM-B (Dual-Metric Architecture):** Segment Capital Markets into Asset Managers/Wealth (Market Cap / AUM) and Brokers/Exchanges/Infrastructure (P/E).
- **Option CM-C (Segment-Restricted Scope):** Implement valuation exclusively for Asset Managers under M-Cap/AUM, keeping brokerages and exchanges blocked until subsequent milestones.

---

## 7. Explicit Program Authority Questions (Q-GRP2-01 through Q-GRP2-16)

The Program Authority is invited to review and adjudicate the following sixteen binding governance questions prior to authorizing any D115 engineering:

```
┌─────────────────┬────────────────────────────────────────────────────────────────────────────────────────┐
│ Question Code   │ Governance Subject & Neutral Decision Scope                                            │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-01       │ Insurance Valuation Methodology:                                                       │
│                 │ [A] Unified P/EV (Life-only scope)                                                     │
│                 │ [B] Dual-Metric: P/EV for Life, P/BV for Non-Life                                      │
│                 │ [C] Earnings Multiple (P/E) across all insurance categories                            │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-02       │ Insurance Population Scope:                                                            │
│                 │ [A] Life Insurers only (e.g. HDFC Life, SBI Life, ICICI Pru)                           │
│                 │ [B] All listed insurers (Life, General, Standalone Health, Reinsurance)                │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-03       │ Embedded Value Definition:                                                             │
│                 │ [A] Indian Embedded Value (IEV) per public actuarial disclosures                      │
│                 │ [B] Market Consistent Embedded Value (MCEV) where disclosed                            │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-04       │ Treatment of Non-Positive EV or Regulatory Solvency Breach:                             │
│                 │ [A] Fail closed with UNAVAILABLE (Net Worth/EV <= 0 OR Solvency Ratio < 1.50)           │
│                 │ [B] Degraded numerical floor score (e.g. 15.0 or 20.0)                                 │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-05       │ Capital Markets Population Segmentation:                                               │
│                 │ [A] Segmented by business model (AMCs vs. Brokers vs. Infrastructure)                   │
│                 │ [B] Unified single population across all capital market participants                   │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-06       │ AMC Valuation Methodology:                                                             │
│                 │ [A] Market Cap / AUM Ratio (%)                                                         │
│                 │ [B] Price-to-Earnings (P/E) Multiple                                                   │
│                 │ [C] Dual Evaluation (Composite of M-Cap/AUM and P/E)                                   │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-07       │ Brokerage & Exchange Valuation Methodology:                                            │
│                 │ [A] Price-to-Earnings (P/E) Multiple                                                   │
│                 │ [B] EV/EBITDA Multiple                                                                 │
│                 │ [C] Defer Brokerages & Exchanges; unlock AMCs only                                     │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-08       │ Calibration Methodology for Group 2:                                                   │
│                 │ [A] Static Expert-Calibrated Policy Bands (consistent with Q-CAL-01 Option D)          │
│                 │ [B] Empirical Rolling Historical Percentiles                                           │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-09       │ Calibration Population & Observation Window:                                           │
│                 │ [A] Defer / Not Applicable (Static policy bands require no rolling window)             │
│                 │ [B] 5-Year Empirical Window                                                            │
│                 │ [C] 10-Year Full Cycle Window                                                          │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-10       │ Numerical Scoring Schedule Approval:                                                   │
│                 │ [A] Formulate and review 5-tier structural bands in dedicated Stage 2 proposal         │
│                 │ [B] Adopt provisional standard bands prior to review                                   │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-11       │ Exceptional Events Policy:                                                             │
│                 │ [A] Explicit fail-closed exclusion flag (exceptionalEventFlag: true -> UNAVAILABLE)     │
│                 │ [B] Automated scoring adjustment based on published event category                     │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-12       │ Recalibration Cadence:                                                                 │
│                 │ [A] Annual Scheduled Review (Governance policy only; zero runtime auto-drift)          │
│                 │ [B] Semi-annual or quarterly recalibration                                             │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-13       │ Profile Schema & Versioning:                                                           │
│                 │ [A] Separate immutable assets: insurance-valuation-calibration-1.0.0.json and          │
│                 │     capital-markets-valuation-calibration-1.0.0.json                                   │
│                 │ [B] Unified financial sector profile combined with Banking                             │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-14       │ Dynamic Engine Runner Unlock Gate:                                                     │
│                 │ [A] Remain blocked until Stage 2 implementation + verification acceptance              │
│                 │ [B] Unlock immediately upon scaffold definition                                        │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-15       │ Decision Matrix Presentation Axis:                                                     │
│                 │ [A] Layer-2.5 Orthogonal Valuation Axis (ADR-01 sector engines 100% untouched)         │
│                 │ [B] Incorporate valuation into ADR-01 composite engine scoring                         │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-16       │ Production Eligibility Boundary:                                                       │
│                 │ [A] Development mixed-vintage harness only; LIVE blocked pending automated feeds       │
│                 │ [B] Authorize production LIVE deployment using static fallback                         │
└─────────────────┴────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Gate Criteria (Staged Execution Sequence)

If Program Authority adjudicates the questions above, the implementation must follow the verified D113 pattern:

1. **Stage 1 — Scaffold Implementation:**
   - Define type-safe inputs in `valuation-contract.ts`.
   - Implement calibration-neutral synthesis methods in `EodValuationSynthesizer.ts` emitting `status: 'CALIBRATION_PENDING'` and `valuationScore: null`.
   - Maintain `DynamicEngineRunner.ts` `blockedSectors` without unlocking.
   - Author Stage 1 verification tests.
2. **Stage 2 — Calibration Codification:**
   - Create immutable versioned JSON calibration profiles in `frontend/server/valuation/calibration/`.
   - Implement ratified scoring band logic.
   - Enforce fail-closed guards for non-positive EV/AUM/earnings and exceptional event flags.
   - Author Stage 2 boundary verification suites.
3. **Stage 3 — Acceptance & Operational Unlock:**
   - Formally review and reconcile Stage 2 acceptance.
   - Wire representative development denominators into `DynamicEngineInputBuilder.ts`.
   - Remove `Insurance` and `Capital Markets` from `blockedSectors` in `DynamicEngineRunner.ts`.
   - Verify dynamic delivery across Decision Matrix, Screener, and Executive DTOs.

---

## 9. Production Eligibility Boundary

- **Development Harness Only:** Under standing Decision **E1**, any Group 2 valuation capability operates strictly within the development verification harness (`dataMode: 'LIVE'`, `freshness: 'DEVELOPMENT_MIXED_VINTAGE'`, `fundamentalsVintage: 'v1.1-reference'`).
- **Production LIVE Remains Blocked:** Unattended production dynamic execution remains blocked by **OI-FUND-01** (lack of automated corporate fundamentals feed) and **OI-P16-01..06** (lack of automated exchange SFTP ingestion).
- **Prohibition on Data Fabrication:** Test fixtures and development denominators must be clearly designated as reference benchmarks and must not be published as official production data.

---

## 10. D112 / D113 / D114 Baseline Preservation

This preparation preserves 100% of the established engineering floor:
- **D112-A Security Master:** Bidirectional ISO 6166 resolution preserved.
- **D112-B Reference Denominators:** Static benchmark denominator pattern preserved.
- **D112-C Valuation Framework:** Multi-sector synthesis framework preserved.
- **D112-D Dynamic Engine Runner:** Fail-closed `SECTOR_UNSUPPORTED` semantics preserved.
- **D112-E Dynamic Transport Dispatcher:** LIVE REST routing and DTO contracts preserved.
- **D113 Banking Calibration & Q-CAL09:** Banking dynamic execution is fully operational and unaltered.
- **D114 Historical Batch Ingestion:** Batch ingestion harness and CLI remain fully operational.

---

## 11. Five-Sector Isolation Verification

The standing isolation state remains strictly enforced:

$$\begin{aligned}
\mathbf{Banking:} & \quad \mathbf{UNLOCKED} \quad (\text{D113-QCAL09 operational; Layer-2.5 P/ABV calibrated}) \\
\mathbf{Insurance:} & \quad \mathbf{STRICTLY \quad BLOCKED} \quad (\text{SECTOR\_UNSUPPORTED}) \\
\mathbf{Capital \quad Markets:} & \quad \mathbf{STRICTLY \quad BLOCKED} \quad (\text{SECTOR\_UNSUPPORTED}) \\
\mathbf{Healthcare:} & \quad \mathbf{STRICTLY \quad BLOCKED} \quad (\text{SECTOR\_UNSUPPORTED, Decision C2 unresolved}) \\
\mathbf{Hospitality:} & \quad \mathbf{STRICTLY \quad BLOCKED} \quad (\text{SECTOR\_UNSUPPORTED, Decision C2 unresolved})
\end{aligned}$$

---

## 12. Explicit Unresolved Dependencies

1. **Decision C2 (Operating Lease Capitalization):**
   - Unresolved by this preparation. Healthcare and Hospitality remain completely excluded from Group 2.
2. **OI-P16-01 through OI-P16-06 (Commercial Exchange SFTP):**
   - Retained as externally gated open items.
3. **OI-DHAN-01 (Dhan Layer-1 Credentials):**
   - Retained as externally blocked.
4. **OI-HIST-01 (10-Year Historical Bhavcopy Data Access):**
   - Retained as a downstream data-activation dependency.
5. **OI-FUND-01 (Authoritative Corporate Fundamentals Source):**
   - Retained as an open production prerequisite.

---

**AUTHORITY PREPARATION COMPLETE. STRICTLY READ-ONLY. ZERO CODE MODIFIED. STOPPING FOR PROGRAM AUTHORITY ADJUDICATION.**
