# IIPS D113: VALUATION CALIBRATION SPECIFICATION
## Architectural & Mathematical Requirements for the Five Blocked Sectors

**Document Reference:** `docs/D113_VALUATION_CALIBRATION_SPECIFICATION.md`  
**Governing Authority:** Program Authority (Sai / Ramki) — Formal Authorization of D113  
**Status:** **READ-ONLY ARCHITECTURAL SPECIFICATION (ZERO SOURCE OR PLATFORM MUTATION)**  
**Target Sectors:** Banking, Insurance, Capital Markets, Healthcare, Hospitality  
**Baseline Git HEAD:** `8948723ba7e334e0a899152081354ff63725f900`  
**Certification Scope:** `DEVELOPMENT_HARNESS_SPECIFICATION_ONLY` (Not Production Certified)  

---

## 1. Executive Summary & Forensic Findings

In accordance with Program Authority directive **D113**, this document establishes the exhaustive, read-only mathematical and architectural specification required to transition the **five currently blocked sectors** into valuation-capable components under a future, explicitly chartered workstream.

### Forensic Finding 1: The Two Distinct Engine Archetypes
A deep inspection of the certified platform sector engines in `iips-platform/src/sector-engines/` reveals that the five blocked sectors divide into two fundamentally different architectural classes:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SECTOR VALUATION ARCHETYPE COMPARISON                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ARCHETYPE 1: PILLAR EXISTS, BUT HARDCODED NEUTRAL (Banking)                            │
│ • BankingEngine: Defines a 7th pillar ('valuation': 50) with a 5% composite weight.    │
│   Currently hardcoded to a static neutral score (50.0) in BankingScoreEngine.ts.       │
│   ==> Architecture requires: Replacing hardcoded neutral score with calibrated         │
│       Price-to-Book (P/B) multiple band evaluations.                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ARCHETYPE 2: NO VALUATION PILLAR DEFINED IN CERTIFIED ENGINE (Insurance, CapMarkets,    │
│              Healthcare, Hospitality)                                                  │
│ • Insurance: 5 pillars (underwriting, solvency, growth, persistency, profitability).   │
│ • Capital Markets: 5 pillars (earnings-quality, growth, profitability, franchise, eff). │
│ • Healthcare: 5 pillars (utilization, revenue-quality, profitability, clinical, eff).  │
│ • Hospitality: 6 pillars (occupancy, demandRevpar, growth, profitability, fee, risk).   │
│   ==> In all 4 engines, valuation was intentionally EXCLUDED from ADR-01 composite     │
│       calculations to reflect pure operational/franchise performance.                  │
│   ==> In CSIP and Decision Matrix, valuation is an ORTHOGONAL PRESENTATION AXIS.       │
│   ==> Architecture requires: Dynamic valuation synthesizer to evaluate an external     │
│       valuation score for the Decision Matrix Quality vs. Valuation scatter plot       │
│       WITHOUT mutating the certified ADR-01 operational composite weights.             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Forensic Finding 2: Strict Fail-Closed Invariance Maintained
Under **D112-C** and **D112-D**, all five sectors correctly fail closed with:
$$\text{status: 'SECTOR_UNSUPPORTED'}, \quad \text{composite: null}, \quad \text{verdict: 'UNAVAILABLE'}$$
This specification establishes the roadmap for future calibration without compromising current fail-closed boundary safety.

---

## 2. Sector-by-Sector Technical Specification

---

### 2.1. Sector 1: Banking (`sector.banking`)

#### A. Existing Engine Architecture
- **Engine ID:** `sector.banking` (`BankingEngine.ts`)
- **Existing Pillars:** Asset Quality (25%), Profitability (20%), Funding Quality (15%), Capital Strength (15%), Growth (10%), Operating Efficiency (10%), **Valuation (5%)**.
- **Current Valuation Behavior:** `BankingScoreEngine.ts` hardcodes `'valuation': 50`.
- **Why Currently Blocked in D112-C:** While the pillar exists in engine code, there is **zero external calibration table** for bank valuation multiples (e.g. Price-to-Book bands) in `iips-platform`.

#### B. Required Valuation Methodology
- **Governed Multiples:** **Price-to-Adjusted Book Value (P/ABV)** as primary metric; **Price-to-Earnings (P/E)** as secondary.
- **Mathematical Formula:**
  $$\text{Adjusted Book Value Per Share (ABVPS)} = \frac{\text{Net Worth} - \text{Net NPA}}{\text{Total Outstanding Equity Shares}}$$
  $$\text{P/ABV Multiple} = \frac{\text{EOD Close Price}}{\text{ABVPS}}$$
- **Input Type:** Absolute financial denominator inputs combined with dynamic EOD closing price.

#### C. Required Financial Data
1. `equityShareCapital` (Balance Sheet)
2. `tangibleNetWorth` (Balance Sheet / Reserves)
3. `netNpaAbsolute` (Asset Quality Schedule)
4. `totalDilutedShares` (Share Capital Schedule)
5. `tradeDateClosePrice` (NSE CM-UDiFF EOD)

#### D. Calibration Requirements
- **Missing Calibration:** A calibrated 5-tier scoring band mapping P/ABV to scores (15–90) adjusted for Return on Assets (RoA).
- **Required Authority Adjudication:** Authoritative approval of P/ABV boundary thresholds:
  - Band 1 (Score 90 / Undervalued): $\text{P/ABV} < 1.2\times$ (High RoA $>1.5\%$)
  - Band 2 (Score 75): $1.2\times \le \text{P/ABV} < 1.8\times$
  - Band 3 (Score 60): $1.8\times \le \text{P/ABV} < 2.5\times$
  - Band 4 (Score 45): $2.5\times \le \text{P/ABV} < 3.2\times$
  - Band 5 (Score 20 / Overvalued): $\text{P/ABV} \ge 3.2\times$

---

### 2.2. Sector 2: Insurance (`sector.insurance`)

#### A. Existing Engine Architecture
- **Engine ID:** `sector.insurance` (`InsuranceEngine.ts`)
- **Existing Pillars:** Underwriting (30%), Solvency (20%), Growth (20%), Persistency (15%), Profitability (15%). Total = 100%.
- **Current Valuation Behavior:** No valuation pillar defined in certified scoring engine.
- **Why Currently Blocked in D112-C:** Enterprise Value (EV) and standard EBITDA/Revenue multiples are financially meaningless for insurance companies due to fiduciary policyholder float liabilities.

#### B. Required Valuation Methodology
- **Governed Multiples:** **Price-to-Embedded Value (P/EV)** for Life Insurance; **Price-to-Book (P/B)** combined with Combined Ratio for General/Health Insurance.
- **Mathematical Formula:**
  $$\text{Embedded Value Per Share (EVPS)} = \frac{\text{Adjusted Net Worth (ANW)} + \text{Value of In-Force Business (VIF)}}{\text{Total Diluted Shares}}$$
  $$\text{P/EV Multiple} = \frac{\text{EOD Close Price}}{\text{EVPS}}$$
- **Input Type:** Actuarial Embedded Value disclosures from semi-annual/annual filings.

#### C. Required Financial Data
1. `actuarialEmbeddedValue` (Indian Embedded Value / MCEV disclosure)
2. `valueNewBusiness` (VNB, for growth-adjusted valuation)
3. `totalDilutedShares`
4. `tradeDateClosePrice`

#### D. Calibration Requirements
- **Missing Calibration:** P/EV band schedule.
- **Required Authority Adjudication:** Program Authority confirmation that P/EV operates as an **orthogonal Decision Matrix axis** and does NOT alter the certified 5-pillar composite weights in `InsuranceScoreEngine.ts`.

---

### 2.3. Sector 3: Capital Markets (`sector.capital-markets`)

#### A. Existing Engine Architecture
- **Engine ID:** `sector.capital-markets` (`CapitalMarketsEngine.ts`)
- **Existing Pillars:** Earnings Quality (25%), Growth (20%), Profitability (20%), Franchise (20%), Operating Efficiency (15%). Total = 100%.
- **Current Valuation Behavior:** No valuation pillar defined in engine.
- **Why Currently Blocked in D112-C:** Multi-business diversity (AMCs, Retail Brokerages, Wealth Managers, Exchanges, Depositories) requires segmented multiple calibration.

#### B. Required Valuation Methodology
- **Governed Multiples:**
  - Asset Management Companies (AMCs): **Market Cap as % of AUM (M-Cap / AUM)** and **P/E**.
  - Brokerages & Exchanges: **Normalized P/E** (cyclically adjusted over 3-year market volume cycle).
- **Mathematical Formula (AMC):**
  $$\text{M-Cap / AUM (\%)} = \frac{\text{EOD Close Price} \times \text{Total Shares}}{\text{Quarterly Average AUM (QAAUM)}} \times 100$$
- **Formula (Exchanges/Brokerages):**
  $$\text{Trailing P/E} = \frac{\text{EOD Close Price}}{\text{Diluted TTM EPS}}$$

#### C. Required Financial Data
1. `quarterlyAverageAum` (AMC segment)
2. `trailingTwelveMonthsNetProfit` (All segments)
3. `totalDilutedShares`
4. `subSegmentClassification` (`AMC` vs `EXCHANGE_DEPOSITORY` vs `BROKERAGE`)
5. `tradeDateClosePrice`

#### D. Calibration Requirements
- **Missing Calibration:** Segment-specific calibration profiles mapping M-Cap/AUM and P/E into standard 15–90 scores.
- **Required Authority Adjudication:** Approval of sub-segment routing rules in Security Master.

---

### 2.4. Sector 4: Healthcare (`sector.healthcare`)

#### A. Existing Engine Architecture
- **Engine ID:** `sector.healthcare` (`HealthcareEngine.ts`)
- **Existing Pillars:** Utilization (25%), Revenue Quality (20%), Profitability (20%), Clinical Quality (20%), Efficiency (15%). Total = 100%.
- **Current Valuation Behavior:** No valuation pillar defined.
- **Why Currently Blocked in D112-C:** Hospital chains and diagnostics providers require distinct capital asset multiple treatments (EV/Operational Bed vs EV/EBITDA).

#### B. Required Valuation Methodology
- **Governed Multiples:** **Enterprise Value to EBITDA (EV/EBITDA)** for corporate providers; **EV per Operational Bed** as specialized cross-check.
- **Mathematical Formula:**
  $$\text{Enterprise Value (EV)} = (\text{Close Price} \times \text{Shares}) + \text{Total Debt} + \text{Lease Liabilities} - \text{Cash \& Equiv}$$
  $$\text{EV/EBITDA Multiple} = \frac{\text{Enterprise Value}}{\text{Normalized Operating EBITDA}}$$
- **Input Type:** Balance sheet debt, lease liabilities (Ind AS 116), cash reserves, and operating EBITDA.

#### C. Required Financial Data
1. `operatingEbitdaTtm`
2. `grossBorrowings`
3. `leaseLiabilities` (Ind AS 116 capitalization)
4. `cashAndEquivalents`
5. `operationalBedCapacity` (Optional operational multiple)
6. `totalDilutedShares`
7. `tradeDateClosePrice`

#### D. Calibration Requirements
- **Missing Calibration:** Standardized EV/EBITDA band schedule for Indian healthcare providers (e.g. 14x–26x normalized bands).
- **Required Authority Adjudication:** Decision whether EV includes capitalized operating leases under Ind AS 116.

---

### 2.5. Sector 5: Hospitality (`sector.hospitality`)

#### A. Existing Engine Architecture
- **Engine ID:** `sector.hospitality` (`HospitalityEngine.ts`)
- **Existing Pillars:** Occupancy, Demand RevPAR, Growth, Profitability, Earnings Quality (Fee Mix), Capital Risk.
- **Current Valuation Behavior:** No valuation pillar defined in engine.
- **Why Currently Blocked in D112-C:** Hospitality involves two radically divergent business models (Asset-Heavy Owner vs Asset-Light Operator/Franchisor) requiring separated calibration schedules.

#### B. Required Valuation Methodology
- **Governed Multiples:**
  - Asset-Heavy (Owner/Lease): **EV / Operating EBITDA** and **EV per Available Room (EV/Key)**.
  - Asset-Light (Management Contracts / Fees): **P/E** and **EV / Cash Flow from Operations**.
- **Mathematical Formula:**
  $$\text{EV/EBITDA Multiple} = \frac{(\text{Close Price} \times \text{Shares}) + \text{Debt} - \text{Cash}}{\text{Consolidated Hospitality EBITDA}}$$

#### C. Required Financial Data
1. `businessModel` (`ASSET_HEAVY` vs `ASSET_LIGHT` vs `HYBRID`)
2. `hospitalityEbitdaTtm`
3. `totalDebt`
4. `cashAndEquivalents`
5. `totalDilutedShares`
6. `totalOperatingRooms`
7. `tradeDateClosePrice`

#### D. Calibration Requirements
- **Missing Calibration:** Bifurcated calibration profile for Asset-Heavy vs Asset-Light hotel groups.
- **Required Authority Adjudication:** Governance determination for hybrid operators (e.g. IHCL) mixing ownership and management contracts.

---

## 3. Cross-Sector Synthesis & System Dependencies

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FIVE-SECTOR DATA REQUIREMENT MATRIX                             │
├──────────────────┬─────────────────────────────┬───────────────────────────────────────┤
│ Sector           │ Primary Governed Multiple   │ Critical Non-Standard Input Required  │
├──────────────────┼─────────────────────────────┼───────────────────────────────────────┤
│ Banking          │ P/ABV (Price / Adj Book)    │ Net NPA deductions, Tier-1 capital    │
│ Insurance        │ P/EV (Price / Embedded Val) │ Actuarial MCEV disclosures (Semi-ann) │
│ Capital Markets  │ M-Cap/AUM & Normalized P/E  │ QAAUM, Subsegment classification      │
│ Healthcare       │ EV / EBITDA                 │ Ind AS 116 lease liabilities          │
│ Hospitality      │ EV / EBITDA & EV / Key      │ Asset-Heavy vs Asset-Light asset flag │
└──────────────────┴─────────────────────────────┴───────────────────────────────────────┘
```

### Identity & Security Master Dependencies
To unlock these sectors in the future, `SecurityMasterRegistry` (`security-master-contract.ts`) will require:
1. Expansion of `SectorFamily` to map evidenced banking/insurance equities (e.g. `HDFCBANK`, `ICICIBANK`, `SBIN`, `HDFCLIFE`, `HDFCAMC`, `APOLLOHOSP`, `INDHOTEL`).
2. Inclusion of `businessModelSubtype` metadata for Capital Markets (AMC vs Broker) and Hospitality (Asset-Heavy vs Asset-Light).

### Corporate Action Continuity
Valuation synthesizers require strict handling of:
- Bonus issues, stock splits, and rights offerings (ensuring Diluted Shares reflect current EOD capital base).
- Bank mergers (e.g. HDFC Ltd into HDFC Bank) with clean balance-sheet restatement flags.

---

## 4. Production Data Quality & Freshness Boundaries

| Data Dimension | Development Harness (Current Baseline) | Production Authoritative Target |
|---|---|---|
| **Fundamental Inputs** | Frozen `v1.1-reference` static denominators | Automated quarterly financial statements (SEBI LODR) |
| **Market Data Close** | Local CM-UDiFF Bhavcopy via `MarketDataStore` | Verified NSE CM-UDiFF EOD via `OPERATOR_DROP` |
| **Filing Cadence** | Annual reference baseline | Quarterly (45-day post-quarter statutory limit) |
| **Embedded Value** | Static reference note | Semi-annual actuarial disclosures (Insurance) |
| **Fail-Closed Staleness** | Exempt in dev (`DEVELOPMENT_MIXED_VINTAGE`) | Fail-closed if filing $>180$ days stale |

---

## 5. Fail-Closed Boundary Conditions

A future valuation implementation for these five sectors must strictly fail closed (returning `VALUATION_UNAVAILABLE`, `composite: null`, and `verdict: 'UNAVAILABLE'`) under the following conditions:

1. **Negative or Zero Denominators:**
   - Adjusted Book Value $\le 0$ (Distressed/Insolvent Banks).
   - Embedded Value $\le 0$ (Insurance).
   - Operating EBITDA $\le 0$ (Loss-making Healthcare or Hotels).
2. **Missing Sector-Specific Disclosures:**
   - Bank filing lacking Gross/Net NPA schedules.
   - Life insurer lacking audited Embedded Value reports.
   - AMC lacking quarterly average AUM disclosures.
3. **Corporate Action / Capital Mismatch:**
   - Share count discrepancy following unadjusted stock split or rights issue.
4. **Stale Audited Statements:**
   - Fundamental filing date older than governed staleness threshold without explicit operator dispensation.

---

## 6. Architectural Boundary: Platform Engine vs. Dynamic Synthesizer

A critical finding of this specification is that **NO CHANGES TO CERTIFIED ADR-01 SECTOR ENGINES ARE REQUIRED**:

1. **Preservation of ADR-01 Engines:**
   - For `Insurance`, `Capital Markets`, `Healthcare`, and `Hospitality`, the certified engines evaluate operational quality, risk, and efficiency.
   - Dynamic valuation multiple synthesis belongs in **`EodValuationSynthesizer` (Layer 2.5)**.
   - The synthesized valuation score is supplied as an **orthogonal axis** to the Decision Matrix (`fetchDecisionMatrixData`), matching how `GOLDEN_PILLARS` exposes nullable valuation scores.
2. **Preservation of SNAPSHOT Invariance:**
   - Certified SNAPSHOT routes (`computeCertifiedExecutive`, `computeCertifiedDecisionMatrix`) will continue to read frozen expected outputs verbatim.
   - Dynamic valuation synthesis executes **only** when `mode === 'LIVE'`.

---

## 7. Future Testing & Verification Floor

Prior to any future production acceptance, an implementation of these five sectors must pass:
1. **Mathematical Invariant Tests:** Positive, negative, zero, and out-of-band denominator tests for all 5 sectors.
2. **Subsegment Routing Tests:** Verification that AMCs evaluate M-Cap/AUM while exchanges evaluate normalized P/E.
3. **Fail-Closed Negative Tests:** Verification that distressed institutions with negative net worth or NPA breaches emit `VALUATION_UNAVAILABLE`.
4. **Decision Matrix Integration Tests:** Verification that dynamic scatter coordinates $(x, y) = (\text{Quality}, \text{Valuation})$ render correctly without NaN or undefined crashes.
5. **Snapshot Invariance Regression:** Verification that all 13 existing sector expected-output JSON fixtures remain 100% byte-identical.

---

## 8. Program Authority & Dependency Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        D113 AUTHORITY & DEPENDENCY MATRIX                              │
├──────────────────────────┬─────────────────────────────────────────────────────────────┤
│ Level                    │ Responsibility & Scope                                      │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Level 1: Technical Scope │ • Implementation of D113-C valuation synthesis formulas     │
│ (Arena Coding Charter)   │ • Security Master expansion for banking/insurance leaders   │
│                          │ • Unit tests and negative fail-closed invariant suites      │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Level 2: Program         │ • Formal approval of valuation multiple band thresholds     │
│ Authority Adjudication   │ • Decision on Ind AS 116 lease capitalization for hospitals │
│ (Sai / Ramki)            │ • Approval of AMC vs Brokerage sub-segment routing rules    │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Level 3: External Data   │ • Integration of real quarterly financial statement feed    │
│ & Regulatory Boundary    │ • Access to audited actuarial Embedded Value filings        │
│                          │ • SEBI LODR corporate action continuity verification        │
└──────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 9. Recommended Post-D113 Program Sequencing

With D113 completed as a read-only specification, the program holds clean baselines across all modules:

1. **`D112-A..E`:** Dynamic Analytical Engine Bridge = **ACCEPTED & FROZEN**.
2. **`D114`:** Automated Historical Bhavcopy Batch Ingestion Harness = **ACCEPTED & COMMITTED**.
3. **`D113`:** Excluded-Sector Valuation Calibration Specification = **SPECIFICATION COMPLETE**.

### Recommended Next Program Action:
Return to **Layer 1 Intraday Market Data Operationalization (`D111`)**: Prepare the Windows operator runbook and smoke protocol for the 24-hour Dhan developer token lifecycle to transition intraday refresh from `CREDENTIAL_BLOCKED` to operational verification.

---

## 10. Git Baseline & Verification Audit

- **Baseline Commit HEAD:** `8948723ba7e334e0a899152081354ff63725f900`
- **Branch:** `arena/01a0a438-iips-production-market-data`
- **Working Tree:** Intact, clean, and durable.
- **Source Modifications:** Zero platform, engine, test, or persistence code modified.

---

**D113 VALUATION CALIBRATION SPECIFICATION COMPLETE (READ-ONLY). AWAITING PROGRAM AUTHORITY DIRECTION.**
