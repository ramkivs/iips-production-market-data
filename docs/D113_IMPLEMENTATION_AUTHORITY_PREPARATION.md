# IIPS D113-IMPL-PREP: FIVE-SECTOR VALUATION IMPLEMENTATION AUTHORITY PREPARATION
## Comprehensive Architectural Blueprints, Impact Analysis, and Authority Decision Register for Blocked Sectors

**Document Reference:** `docs/D113_IMPLEMENTATION_AUTHORITY_PREPARATION.md`  
**Governing Authority:** Program Authority (Sai / Ramki)  
**Charter Status:** **AUTHORITY PREPARATION ONLY — STRICTLY READ-ONLY (NO CODE, TEST, OR CONFIG MUTATION)**  
**Target Sectors:** Banking (`sector.banking`), Insurance (`sector.insurance`), Capital Markets (`sector.capital-markets`), Healthcare (`sector.healthcare`), Hospitality (`sector.hospitality`)  
**Baseline Git HEAD:** `8948723ba7e334e0a899152081354ff63725f900`  
**Branch:** `arena/01a0a438-iips-production-market-data`  

---

## 1. Executive Summary

Following the formal acceptance and freezing of **D113** (`docs/D113_VALUATION_CALIBRATION_SPECIFICATION.md` and `docs/D113_ACCEPTANCE_AND_DURABILITY_RECONCILIATION.md`), this document establishes the **implementation authority preparation package**. 

### Purpose & Scope
This preparation package defines the exact engineering delta, architectural boundaries, dependency flows, test floors, and governance gates required before any future implementation could be authorized to activate the **five currently blocked sectors**:
1. **Banking**
2. **Insurance**
3. **Capital Markets**
4. **Healthcare**
5. **Hospitality**

### Standing Authority Principles
- **Read-Only Invariance:** This document prepares, but does **NOT** implement, any valuation logic.
- **Zero Inventions:** No valuation thresholds, multiple bands, or fundamental parameters are manufactured.
- **Decision Clarity:** Architectural alternatives (e.g., Banking engine mutation vs. Layer 2.5 synthesis) are formulated as explicit questions for Program Authority decision, not pre-selected.
- **Fail-Closed Durability:** All five sectors remain strictly fail-closed in repository runtime code until a formal implementation workstream is explicitly chartered.

---

## 2. Five-Sector Implementation Readiness Matrix

```
┌──────────────────┬───────────────────────┬──────────────────────────┬────────────────────────┬───────────────────────┐
│ Sector           │ Engine Architecture   │ Valuation Status in Repo │ Key Missing Input      │ Authority Readiness   │
├──────────────────┼───────────────────────┼──────────────────────────┼────────────────────────┼───────────────────────┤
│ 1. Banking       │ 7 Pillars (val: 50)   │ Static neutral in engine;│ Net NPA, Adj Book Val, │ BLOCKED: Architecture │
│                  │ Weight: 0.05          │ Blocked in Layer 2.5     │ P/ABV calibration band │ Decision A required   │
├──────────────────┼───────────────────────┼──────────────────────────┼────────────────────────┼───────────────────────┤
│ 2. Insurance     │ 5 Pillars (No val)    │ Excluded from composite; │ MCEV Embedded Value,   │ BLOCKED: Actuarial    │
│                  │ Weight: 0.00          │ Blocked in Layer 2.5     │ P/EV calibration bands │ data source required  │
├──────────────────┼───────────────────────┼──────────────────────────┼────────────────────────┼───────────────────────┤
│ 3. Capital Mkts  │ 5 Pillars (No val)    │ Excluded from composite; │ QAAUM, Sub-segment     │ BLOCKED: Bifurcation  │
│                  │ Weight: 0.00          │ Blocked in Layer 2.5     │ routing (AMC vs Exch)  │ approval required     │
├──────────────────┼───────────────────────┼──────────────────────────┼────────────────────────┼───────────────────────┤
│ 4. Healthcare    │ 5 Pillars (No val)    │ Excluded from composite; │ Ind AS 116 Lease debt, │ BLOCKED: Lease debt   │
│                  │ Weight: 0.00          │ Blocked in Layer 2.5     │ EV/EBITDA bands        │ policy required       │
├──────────────────┼───────────────────────┼──────────────────────────┼────────────────────────┼───────────────────────┤
│ 5. Hospitality   │ 6 Pillars (No val)    │ Excluded from composite; │ Asset-Heavy vs Light   │ BLOCKED: Dual-track   │
│                  │ Weight: 0.00          │ Blocked in Layer 2.5     │ classification & bands │ profile required      │
└──────────────────┴───────────────────────┴──────────────────────────┴────────────────────────┴───────────────────────┘
```

---

## 3. Sector-by-Sector Implementation Design

---

### 3.1. Sector 1: Banking (`sector.banking`)

#### A. Existing Engine State
- **Source File:** `iips-platform/src/sector-engines/banking/scoring/BankingScoreEngine.ts`
- **Current Input Contract:** `BankingMetricValues` (`iips-platform/src/sector-engines/banking/metrics/BankingMetrics.ts`), covering GNPA, NNPA, PCR, NIM, RoA, RoE, CASA, Cost-to-Income, Tier-1, CAR, Loan Growth, Deposit Growth.
- **Current Pillars:** Asset Quality (0.25), Profitability (0.20), Funding Quality (0.15), Capital Strength (0.15), Growth (0.10), Operating Efficiency (0.10), **Valuation (0.05)**.
- **Current Valuation Behavior:** `pillars.valuation = 50` (hardcoded neutral integer in `BankingScoreEngine.ts`).
- **Current Fail-Closed Behavior:** In `eod-valuation-synthesizer.ts`, `'sector.banking'` is in `UNSUPPORTED_SECTORS` $\rightarrow$ emits `SECTOR_UNSUPPORTED`. In `dynamic-engine-runner.ts`, `blockedSectors.includes('Banking')` $\rightarrow$ emits `SECTOR_UNSUPPORTED` and `composite: null`.

#### B. Proposed Future Valuation Layer
- **Implementation Location:** `frontend/server/valuation/eod-valuation-synthesizer.ts` (Layer 2.5).
- **Placement Logic:** See Section 4 (Architectural Decision A). If synthesized in Layer 2.5, it evaluates Price-to-Adjusted Book Value (P/ABV) externally.

#### C. Required Inputs
- **EOD Market Data:** `eodClosePrice` from verified NSE CM-UDiFF Bhavcopy.
- **Security Master:** `canonicalSecurityId: "BANK-H1"`, ticker `"HDFCBANK"`, `exchange: "NSE"`, `series: "EQ"`.
- **Fundamentals:** Net Worth, Net NPA absolute, Diluted Shares, Return on Assets (RoA).
- **Filing Vintage:** Latest quarterly SEBI LODR financial disclosures ($\le 45$ days post-quarter end).

#### D. Calibration
- **Existing Calibration:** `iips-platform/src/sector-engines/banking/banking-calibration-1.0.0.json` (covers operational metrics only; has zero valuation multiple bands).
- **Absent Calibration:** P/ABV 5-tier scoring band matrix.
- **Strict Prohibition:** *Do NOT invent P/ABV boundary thresholds without formal Program Authority adjudication.*

#### E. Dynamic Engine Integration
- Can be consumed by D112-D dynamic runner without altering `BankingEngine.ts` if implemented via Layer 2.5 synthesis.

#### F. Transport & UI
- D112-E transport path (`DynamicTransportDispatcher.ts`) already supports nullable `valuation` in `DynamicMatrixCompanyDto` and degraded screener rows.

---

### 3.2. Sector 2: Insurance (`sector.insurance`)

#### A. Existing Engine State
- **Source File:** `iips-platform/src/sector-engines/insurance/scoring/InsuranceScoreEngine.ts`
- **Current Input Contract:** `InsuranceMetricValues` (`iips-platform/src/sector-engines/insurance/metrics/InsuranceMetrics.ts`).
- **Current Pillars:** Underwriting (0.30), Solvency (0.20), Growth (0.20), Persistency (0.15), Profitability (0.15). Sum = 1.00.
- **Current Valuation Behavior:** Zero valuation pillar in engine composite.
- **Current Fail-Closed Behavior:** Strictly blocked under `UNCALIBRATED_BLOCKED_SECTORS`.

#### B. Proposed Future Valuation Layer
- **Implementation Location:** `EodValuationSynthesizer.ts` (Layer 2.5).
- **Orthogonal Preservation:** Evaluates **Price-to-Embedded Value (P/EV)** for Life Insurance as an orthogonal presentation score for the Decision Matrix without altering the 5-pillar ADR-01 operational composite weights.

#### C. Required Inputs
- **EOD Market Data:** `eodClosePrice`.
- **Security Master:** Expansion required for insurance candidates (e.g. `HDFCLIFE`, `SBILIFE`, `ICICIPRULI`).
- **Fundamentals:** Actuarial Embedded Value (MCEV/IEV), Value of New Business (VNB), Diluted Shares.
- **Filing Vintage:** Semi-annual actuarial disclosures.

#### D. Calibration
- **Existing Calibration:** `insurance-calibration-1.0.0.json` (operational underwriting/persistency bands only).
- **Absent Calibration:** P/EV multiple bands (e.g. 1.0x to 3.5x). Must be approved by Program Authority.

---

### 3.3. Sector 3: Capital Markets (`sector.capital-markets`)

#### A. Existing Engine State
- **Source File:** `iips-platform/src/sector-engines/capital-markets/scoring/CapitalMarketsScoreEngine.ts`
- **Current Input Contract:** `CapitalMarketsMetricValues`.
- **Current Pillars:** Earnings Quality (0.25), Growth (0.20), Profitability (0.20), Franchise (0.20), Operating Efficiency (0.15).
- **Current Valuation Behavior:** Zero valuation pillar in engine composite.
- **Current Fail-Closed Behavior:** Strictly blocked under `UNCALIBRATED_BLOCKED_SECTORS`.

#### B. Proposed Future Valuation Layer
- **Implementation Location:** `EodValuationSynthesizer.ts` (Layer 2.5).
- **Orthogonal Preservation:** Evaluates multiple scores as an orthogonal Decision Matrix axis.

#### C. Required Inputs
- **EOD Market Data:** `eodClosePrice`.
- **Security Master:** Expansion to map `HDFCAMC`, `BSE`, `MCX`, `CDSL`, `ANGELONE`. Subsegment attribute (`AMC` vs `EXCHANGE_DEPOSITORY` vs `BROKERAGE`).
- **Fundamentals:** Quarterly Average AUM (QAAUM for AMCs), Diluted TTM Net Profit, Diluted Shares.

#### D. Calibration
- **Existing Calibration:** `capital-markets-calibration-1.0.0.json` (Cost-to-income, recurring revenue, AUM growth bands only).
- **Absent Calibration:** M-Cap/AUM percentage bands (AMCs) and Cyclically-Adjusted P/E bands (Brokers/Exchanges).

---

### 3.4. Sector 4: Healthcare (`sector.healthcare`)

#### A. Existing Engine State
- **Source File:** `iips-platform/src/sector-engines/healthcare/scoring/HealthcareScoreEngine.ts`
- **Current Input Contract:** `HealthcareMetricValues`.
- **Current Pillars:** Utilization (0.25), Revenue Quality (0.20), Profitability (0.20), Clinical Quality (0.20), Efficiency (0.15).
- **Current Valuation Behavior:** Zero valuation pillar in engine composite.
- **Current Fail-Closed Behavior:** Strictly blocked under `UNCALIBRATED_BLOCKED_SECTORS`.

#### B. Proposed Future Valuation Layer
- **Implementation Location:** `EodValuationSynthesizer.ts` (Layer 2.5).
- **Methodology:** Enterprise Value to EBITDA (EV/EBITDA).

#### C. Required Inputs
- **EOD Market Data:** `eodClosePrice`.
- **Security Master:** Expansion to map `APOLLOHOSP`, `FORTIS`, `MAXHEALTH`.
- **Fundamentals:** Operating EBITDA (TTM), Gross Debt, Cash & Equivalents, Diluted Shares, **Capitalized Operating Lease Liabilities (Ind AS 116)**.

#### D. Calibration
- **Existing Calibration:** `healthcare-calibration-1.0.0.json` (Occupancy, ARPOB, ALOS, EBITDA margin bands).
- **Absent Calibration:** EV/EBITDA scoring bands. Lease-debt policy adjudication.

---

### 3.5. Sector 5: Hospitality (`sector.hospitality`)

#### A. Existing Engine State
- **Source File:** `iips-platform/src/sector-engines/hospitality/scoring/HospitalityScoreEngine.ts`
- **Current Input Contract:** `HospitalityInput` (`HospitalityMetrics.ts`).
- **Current Pillars:** Occupancy, Demand RevPAR, Growth, Profitability, Earnings Quality (Fee Mix), Capital Risk.
- **Current Valuation Behavior:** Zero valuation pillar in engine composite.
- **Current Fail-Closed Behavior:** Strictly blocked under `UNCALIBRATED_BLOCKED_SECTORS`.

#### B. Proposed Future Valuation Layer
- **Implementation Location:** `EodValuationSynthesizer.ts` (Layer 2.5).
- **Methodology:** Asset-Heavy (EV/EBITDA, EV/Key) vs. Asset-Light (P/E, EV/Cash Flow).

#### C. Required Inputs
- **EOD Market Data:** `eodClosePrice`.
- **Security Master:** Expansion to map `INDHOTEL`, `EIHOTEL`, `CHALET`. Business model classification (`ASSET_HEAVY` vs `ASSET_LIGHT` vs `HYBRID`).
- **Fundamentals:** Hospitality EBITDA (TTM), Gross Debt, Cash, Room Count (Keys), Diluted Shares.

#### D. Calibration
- **Existing Calibration:** `hospitality-calibration-1.0.0.json` (RevPAR, Occupancy, GOP margin bands).
- **Absent Calibration:** Bifurcated multiple scoring bands for hotel groups.

---

## 4. Architectural Decision Register: Banking Architecture (Question A)

Before any implementation can commence for the Banking sector, Program Authority must select between two distinct architectural paths:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   ARCHITECTURAL ALTERNATIVES FOR BANKING VALUATION                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ OPTION A1: LAYER 2.5 ORTHOGONAL SYNTHESIS (Recommended)                                │
│ • Implementation: Synthesize dynamic P/ABV in EodValuationSynthesizer.ts.              │
│ • Engine Impact: Leave BankingScoreEngine.ts untouched with its static 'valuation: 50'.│
│ • Operational Composite: Banking ADR-01 composite remains 100% frozen and byte-        │
│   identical to certified SNAPSHOT baselines.                                           │
│ • Decision Matrix: Dynamically synthesized P/ABV score is passed directly to the       │
│   Decision Matrix (Quality vs. Valuation scatter plot) as the valuation axis.          │
│ • Pros: Zero mutation of certified ADR-01 engine; zero risk to golden fixtures;        │
│   maintains identical architecture to the other 4 blocked sectors.                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ OPTION A2: INTERNAL ENGINE MUTATION (Modifying BankingScoreEngine.ts)                  │
│ • Implementation: Modify BankingScoreEngine.ts to accept dynamic valuationMultiple    │
│   and dynamically compute the 5% valuation pillar inside the engine.                   │
│ • Engine Impact: Modifies core engine code; requires updating BankingMetricValues,     │
│   banking-calibration-1.0.0.json, and all banking expected-output test fixtures.       │
│ • Pros: Strictly satisfies the original 7-pillar model design.                         │
│ • Cons: Breaks ADR-01 byte-identity invariance for banking golden reference files;     │
│   introduces regression risk across all legacy banking test suites.                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
**Authority Directive Required:** Program Authority must formally adjudicate between **Option A1** (Layer 2.5 External) and **Option A2** (Engine Mutation).

---

## 5. Calibration Decision Register (Question B)

The following parameter bands are **currently absent from the repository** and must be formally established and approved by Program Authority. Engineers are strictly forbidden from manufacturing these values:

| Sector | Target Multiple | Proposed Scoring Band Schedule to be Approved | Authority Action |
|---|---|---|---|
| **Banking** | P/ABV | 5 tiers: Score 90 ($<X_1$), Score 75 ($X_1 \le v < X_2$), Score 60 ($X_2 \le v < X_3$), Score 45 ($X_3 \le v < X_4$), Score 20 ($v \ge X_4$) | **PENDING APPROVAL** |
| **Insurance** | P/EV | 5 tiers: Score 90 ($<Y_1$), Score 75 ($Y_1 \le v < Y_2$), Score 60 ($Y_2 \le v < Y_3$), Score 45 ($Y_3 \le v < Y_4$), Score 20 ($v \ge Y_4$) | **PENDING APPROVAL** |
| **Capital Markets** | M-Cap/AUM (%) | AMC 5-tier bands: Score 90 ($<Z_1\%$) to Score 20 ($\ge Z_4\%$) | **PENDING APPROVAL** |
| **Capital Markets** | Normalized P/E | Broker/Exchange 5-tier bands: Score 90 ($<P_1$) to Score 20 ($\ge P_4$) | **PENDING APPROVAL** |
| **Healthcare** | EV / EBITDA | 5-tier hospital EV/EBITDA bands: Score 90 ($<H_1$) to Score 20 ($\ge H_4$) | **PENDING APPROVAL** |
| **Hospitality** | EV / EBITDA | Asset-Heavy 5-tier bands: Score 90 ($<K_1$) to Score 20 ($\ge K_4$) | **PENDING APPROVAL** |
| **Hospitality** | P/E Multiple | Asset-Light 5-tier bands: Score 90 ($<L_1$) to Score 20 ($\ge L_4$) | **PENDING APPROVAL** |

---

## 6. Ind AS 116 Lease Policy Decision Register (Question C)

In Indian corporate reporting (Ind AS 116), operating leases are capitalized as Right-of-Use (ROU) Assets with corresponding Lease Liabilities on the balance sheet:

- **Impact on Healthcare & Hotels:** Hospital chains (e.g. Max Healthcare, Apollo) and hotel operators lease significant hospital buildings and hotel properties.
- **Enterprise Value Equation:**
  $$\text{EV}_{\text{Standard}} = \text{Market Cap} + \text{Gross Borrowings} - \text{Cash}$$
  $$\text{EV}_{\text{Ind AS 116}} = \text{Market Cap} + \text{Gross Borrowings} + \mathbf{Lease\ Liabilities} - \text{Cash}$$
- **Divergence:** Including lease liabilities increases Enterprise Value by $15\% - 35\%$ for leased hospital chains, dramatically shifting the EV/EBITDA multiple.
- **Authority Question:** *Does the IIPS Enterprise Value formula capitalize Ind AS 116 lease liabilities, and does operating EBITDA correspondingly exclude lease rental charges?*

---

## 7. Data & Input Dependency Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FIVE-SECTOR END-TO-END DATA DEPENDENCY GRAPH                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
   Security Master (D112-A)
        │  [Requires expansion for Banking, Insurance, AMC, Healthcare, Hotels]
        ▼
   EOD Bhavcopy (MarketDataStore / D114) ───► Close Price ($P_{\text{EOD}}$)
        │
        │ + Governed Fundamental Denominators
        │   [Net NPA, ABVPS, MCEV, QAAUM, Operating EBITDA, Lease Debt]
        ▼
   Layer 2.5 EOD Valuation Synthesizer (`EodValuationSynthesizer.ts`)
        │  [Applies Program-Authority-approved multiple scoring bands]
        ▼
   Dynamic Engine Input Builder (`DynamicEngineInputBuilder.ts`)
        │  [Assembles reference metrics + dynamic multiple]
        ▼
   Dynamic Engine Runner (`DynamicEngineRunner.ts`)
        │  [Calculates dynamic scores & fail-closed states]
        ▼
   Dynamic Transport Dispatcher (`DynamicTransportDispatcher.ts`)
        │  [Injects dynamic Decision Matrix / Screener / Executive DTOs]
        ▼
   UI Presentation Plane (Decision Matrix, Screener, Executive Dashboards)
```

### Missing Data Dependencies Prior to Production Activation:
1. **Security Master Registry:** `security-master-1.0.0.json` currently excludes `HDFCLIFE`, `BSE`, `SUNPHARMA`, and `INDHOTEL` under `excludedCandidateMappings` due to pending authoritative master CSV ingestion.
2. **Fundamental Ingestion Pipeline:** Layer 2 fundamentals currently rely on static reference fixtures (`v1.1-reference`). Dynamic production activation requires automated quarterly SEBI LODR statement ingestion.
3. **Actuarial MCEV Data:** No public API provides Indian Embedded Value disclosures; requires an audited semi-annual tabular ingest pipeline.

---

## 8. Component & File Change Map for Future Implementation

When authorized, a future implementation would interact with repository files according to this strict architectural taxonomy:

| Component / File Path | Lifecycle State | Planned Implementation Action |
|---|---|---|
| `frontend/server/valuation/eod-valuation-synthesizer.ts` | **EXTEND** | Remove 5 sectors from `UNCALIBRATED_BLOCKED_SECTORS`; implement P/ABV, P/EV, M-Cap/AUM, and EV/EBITDA calculation methods; load approved calibration profiles. |
| `frontend/server/valuation/valuation-contract.ts` | **EXTEND** | Add sector-specific fundamental denominator fields to `ValuationCompanyFundamentals` interface. |
| `frontend/server/security-master/security-master-1.0.0.json` | **EXTEND** | Promote evidenced securities from `excludedCandidateMappings` to `entries` upon authoritative validation. |
| `frontend/server/dynamic-runner/dynamic-engine-runner.ts` | **ADAPT** | Remove 5 sectors from `blockedSectors` array; allow successful valuation results to flow into composite calculation. |
| `frontend/server/dynamic-runner/dynamic-engine-input-builder.ts` | **EXTEND** | Add golden reference fixture mappings for Banking, Insurance, Capital Markets, Healthcare, Hospitality. |
| `frontend/server/dynamic-transport/dynamic-transport-dispatcher.ts` | **REUSE** | D112-E transport is already built to pass dynamic company DTOs and handle nullable valuations cleanly. Zero structural rewrite needed. |
| `iips-platform/src/sector-engines/banking/` | **REUSE** | If Option A1 (Layer 2.5 synthesis) is selected, engine remains 100% frozen. |
| `iips-platform/src/sector-engines/{insurance,capmarkets,health,hosp}/` | **REUSE** | All 4 ADR-01 engines remain 100% frozen; valuation is synthesized orthogonally in Layer 2.5. |
| `frontend/server/valuation/valuation-synthesizer.test.ts` | **EXTEND** | Add positive, negative, zero-denominator, and boundary test cases for all 5 sectors. |
| `frontend/server/dynamic-runner/dynamic-engine-runner.test.ts` | **EXTEND** | Add dynamic execution assertions for all 5 sectors. |

---

## 9. Future Test & Acceptance Floor

Any future PR or commit implementing these five sectors must satisfy the following **mandatory test floor**:

1. **Positive Sector Synthesis:**
   - Valid valuation score and multiple calculation for representative tickers in all 5 sectors.
2. **Zero / Negative Denominator Fail-Closed Tests:**
   - Adjusted Book Value $\le 0 \rightarrow$ `VALUATION_UNAVAILABLE`.
   - Embedded Value $\le 0 \rightarrow$ `VALUATION_UNAVAILABLE`.
   - EBITDA $\le 0 \rightarrow$ `VALUATION_UNAVAILABLE`.
   - Outstanding Shares $\le 0 \rightarrow$ `VALUATION_UNAVAILABLE`.
3. **Missing Fundamentals Fail-Closed Tests:**
   - Ticker without fundamental disclosure $\rightarrow$ `FUNDAMENTALS_UNAVAILABLE`.
4. **Stale Filing Fail-Closed Tests:**
   - Fundamental filing $> 180$ days stale in production mode $\rightarrow$ `VALUATION_STALE`.
5. **Deterministic Invariance:**
   - Identical inputs must yield identical floating-point scores across repeated runs.
6. **Regression Invariance:**
   - The 53 existing D112 invariant tests must continue to pass without regression.
   - The 34 D114 market-data tests must continue to pass without regression.
7. **Snapshot Byte Identity:**
   - All 13 sector golden expected-output JSON files in `iips-platform` must remain byte-identical.
8. **No Silent Fallback:**
   - LIVE dynamic execution failures must never silently fall back to snapshot composite scores.

---

## 10. Authority Decision Matrix

```
┌──────────────────────────────────────────────┬─────────────────────────┬──────────────────────────┬─────────────────────────┐
│ Decision Item                                │ Technical Engineering   │ Program Authority        │ External Provider /     │
│                                              │ Implementation Scope    │ Adjudication (Sai/Ramki) │ Legal Boundary          │
├──────────────────────────────────────────────┼─────────────────────────┼──────────────────────────┼─────────────────────────┤
│ Banking Option A1 vs A2 (Layer 2.5 vs Engine)│ Analyzes & implements   │ SOLE AUTHORITY APPROVAL  │ N/A                     │
├──────────────────────────────────────────────┼─────────────────────────┼──────────────────────────┼─────────────────────────┤
│ Valuation Multiple Scoring Band Schedules    │ Codes band algorithms   │ SOLE AUTHORITY APPROVAL  │ N/A                     │
├──────────────────────────────────────────────┼─────────────────────────┼──────────────────────────┼─────────────────────────┤
│ Ind AS 116 Lease Capitalization Policy       │ Implements formula math │ SOLE AUTHORITY APPROVAL  │ Statutory Accounting    │
├──────────────────────────────────────────────┼─────────────────────────┼──────────────────────────┼─────────────────────────┤
│ Capital Markets Sub-segment Routing Rules    │ Implements router       │ SOLE AUTHORITY APPROVAL  │ N/A                     │
├──────────────────────────────────────────────┼─────────────────────────┼──────────────────────────┼─────────────────────────┤
│ Security Master Promotion of Candidates      │ Validates checksums     │ GOVERNED APPROVAL        │ NSE Official Master CSV │
├──────────────────────────────────────────────┼─────────────────────────┼──────────────────────────┼─────────────────────────┤
│ Insurance Embedded Value Data Source         │ Builds ingest adapter   │ GOVERNED APPROVAL        │ Public LODR Disclosures │
├──────────────────────────────────────────────┼─────────────────────────┼──────────────────────────┼─────────────────────────┤
│ Production LIVE Activation Gate              │ Tests operational path  │ SOLE AUTHORITY APPROVAL  │ Exchange Compliance     │
└──────────────────────────────────────────────┴─────────────────────────┴──────────────────────────┴─────────────────────────┘
```

---

## 11. Proposed Implementation Sequencing (When Authorized)

When Program Authority issues an explicit implementation charter, the work must follow this staged sequence:

```
  Phase 1: Authority Parameter Approval
    ├── Authority approves Banking Option A1 vs A2.
    ├── Authority signs off on numerical scoring bands for all 5 sectors.
    └── Authority approves Ind AS 116 lease capitalization policy.

  Phase 2: Security Master & Contract Extension
    ├── Expand ValuationCompanyFundamentals interface in valuation-contract.ts.
    └── Promote evidenced banking/insurance equities in security-master-1.0.0.json.

  Phase 3: Layer 2.5 Valuation Synthesizer Extension
    ├── Implement 5-sector calculation logic in EodValuationSynthesizer.ts.
    └── Implement fail-closed guards for negative/zero denominators.

  Phase 4: Dynamic Runner & Transport Wiring
    ├── Update DynamicEngineRunner.ts to route 5 newly calibrated sectors.
    └── Verify DynamicTransportDispatcher.ts serves dynamic matrix and screener DTOs.

  Phase 5: Verification & Durability Gate
    ├── Execute full invariant and negative test suite (Target: 80+ assertions).
    └── Verify 13/13 snapshot fixtures remain byte-identical.
```

---

## 12. Explicit Non-Authorized Actions

To prevent accidental scope creep or stability regressions, the following actions are **STRICTLY PROHIBITED** during any future implementation workstream unless separately chartered:

1. **NO MUTATION of `GOLDEN_PILLARS` contracts.**
2. **NO MUTATION of certified SNAPSHOT output JSON files.**
3. **NO LIVE ACTIVATION of external network feeds (Dhan API, NSE SFTP, Kite).**
4. **NO INVENTED FUNDAMENTALS or synthetic data masquerading as official data.**
5. **NO SILENT FALLBACK from LIVE dynamic failures to SNAPSHOT outputs.**
6. **NO ALTERATION of the D114 automated historical bhavcopy batch ingestion harness.**

---

## 13. Exact Decisions Required Before Implementation

Before any developer writes a single line of valuation code for these five sectors, Program Authority must formally deliver written decisions on:

1. **Banking Placement:** Confirm **Option A1** (Layer 2.5 orthogonal synthesis) or **Option A2** (Engine mutation).
2. **Calibration Thresholds:** Sign off on the numerical threshold schedules for P/ABV, P/EV, M-Cap/AUM, P/E, and EV/EBITDA.
3. **Lease Capitalization:** Confirm whether Ind AS 116 capitalized lease liabilities are included in Enterprise Value for Healthcare and Hospitality.
4. **Security Promotion:** Approve the promotion of target equities (`HDFCBANK`, `HDFCLIFE`, `BSE`, `APOLLOHOSP`, `INDHOTEL`) into the active Security Master registry.

---

## 14. Recommended Next Authority Gate

### **Immediate Recommendation:**
Do **NOT** implement five-sector valuation at this time. Maintain the five sectors in their current, verified **fail-closed state**.

### **Next Governed Program Workstream:**
Proceed to **D111 Intraday Operational Readiness Gate**:
- Focus on Layer 1 intraday refresh infrastructure.
- Prepare the Windows operator runbook and smoke protocol for the 24-hour Dhan developer token lifecycle.
- Validate local CM-UDiFF EOD Bhavcopy ingestion operational flows under `OPERATOR_DROP` without introducing uncalibrated sector risks into the core engine.

---

**D113-IMPL-PREP COMPLETE (READ-ONLY). ZERO CODE OR PLATFORM MUTATIONS EXECUTED. AWAITING PROGRAM AUTHORITY DIRECTION.**
