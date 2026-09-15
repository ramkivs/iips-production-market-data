# D101: Program Authority Adjudication — Dhan Data API (OI-P16-06)

**Act Identifier:** `D101-PROGRAM-AUTHORITY-ADJUDICATION-OI-P16-06-DHAN`  
**Date:** 2026-09-15  
**Authority:** Program Authority (Sai / Ramki)  
**Execution Boundary:** FORMAL GOVERNANCE ADJUDICATION ONLY — ZERO RUNTIME IMPLEMENTATION  
**R-2 Core State:** ACCEPTED / FROZEN under D97  
**Preceding Authority Acts:** `D98`, `D99-A`, `D100`  

---

## 1. Context & Purpose

This formal authority act adjudicates the `D100` Pre-Implementation Assessment of **Candidate 2: Dhan Data API (`OI-P16-06`)** as an alternative to `yfinance` for the IIPS Layer-1 approximately 15-minute delayed current-state equity refresh for a single-user private investment research workstation.

In strict adherence to core IIPS governance standards (fail-closed, transparent lineage, evidence-based compliance), this adjudication explicitly distinguishes between:
1. **API Access Authorization** (the technical ability to query an authenticated endpoint), and
2. **Contractual Market-Data Rights** (the affirmative legal entitlement to ingest, store derived calculations from, and retain exchange market data).

Program Authority hereby establishes the binding decisions `D101-1` through `D101-8`.

---

## 2. Program Authority Determinations (D101-1 through D101-8)

### D101-1: Technical Candidate Status
- **Determination:** **ACCEPTED AS PREFERRED TECHNICAL CANDIDATE.**
- **Rationale & Evidence:**
  - Official, versioned REST/WebSocket developer platform (`DhanHQ v2`).
  - Batch market quote capability supporting up to 1,000 instruments per call (`POST /marketfeed/quote` or `/marketfeed/ohlc`).
  - Strict, documented rate boundaries (1 request/second for quotes; 100,000 daily requests) offering over 900x safety margin for IIPS's ~15-minute refresh cadence.
  - Native coverage of the entire NSE Cash Market equity domain (`NSE_EQ`) with published instrument scrip master mapping.
  - Complete compatibility with the frozen provider-neutral adapter interface (`MarketDataProviderAdapter`).
- **Limitation:** Acceptance as the preferred technical candidate does **not** by itself constitute an engineering work authorization or a finding of complete contractual clearance.

### D101-2: Economic Commitment & Account Opening
- **Determination:** **APPROVED IN PRINCIPLE (CONDITIONAL ON OPERATOR ONBOARDING).**
- **Adjudicated Terms:**
  - **Account Prerequisite:** Individual KYC-verified trading/demat account with Dhan (Raise Financial Services).
  - **Subscription Cost:** **₹499 + GST (~₹589 / ~$7 USD) per month** recurring auto-debit on the account ledger.
  - **Trading Waiver Policy:** The conditional fee waiver (25 trades/30 days) is formally rejected for planning because IIPS is strictly read-only and non-trading.
- **Finding:** Program Authority determines that ₹589/month is **economically viable, sustainable, and approved** as a personal workstation operational expense, subject to user willingness to complete individual KYC onboarding.

### D101-3: Contractual Data Rights
- **Determination:** **REQUIRES DIRECT DHAN CONFIRMATION.**
- **Governance Finding:**
  - While DhanHQ Terms of Service explicitly authorize programmatic API access for personal algorithmic trading and analytical monitoring, the governing public agreement is framed primarily around retail trading execution.
  - The public terms do not contain an affirmative, unambiguous clause governing:
    1. Local storage of derived quantitative factor metrics,
    2. Retention of analytical point-in-time state, or
    3. Multi-month quantitative historical research baselines.
  - In strict compliance with the instruction that *"the existence of an official API does not prove every downstream data-use right"*, Program Authority declines to infer unstated data-use rights.
  - **Status of Record:** `REQUIRES DIRECT DHAN CONFIRMATION`.

### D101-4: NSE Data Entitlement
- **Determination:** **REQUIRES DHAN CONFIRMATION.**
- **Governance Finding:**
  - Dhan distributes NSE market quotes under its broker redistribution license with NSE.
  - Whether a retail broker Data API subscription legally satisfies an institution-grade investment research system's delayed current-state requirements without requiring a direct exchange data agreement with NSE Data & Analytics Limited is **NOT CONCLUSIVELY ESTABLISHED** from public web terms alone.
  - **Status of Record:** `REQUIRES DHAN CONFIRMATION`.

### D101-5: Implementation Authorization Decision
- **Determination:** **IMPLEMENTATION = DEFERRED.**
- **Rationale & Findings:**
  - Criteria A and B (account requirement and ₹499/month cost) are accepted in principle.
  - However, because Criteria D and E (contractual analytical data rights and exchange sublicensing scope under `D101-3` and `D101-4`) remain unconfirmed by direct Dhan documentation, live engineering implementation cannot be unconditionally authorized at this gate.
  - In accordance with IIPS fail-closed governance, live provider implementation remains **DEFERRED** pending resolution of these specific contractual confirmations, OR an explicit operator decision to provision a sandbox account.
  - Core development, API contracts, engines, and UI continue to operate unhindered against the verified reference/synthetic test double (`ReferenceFileBasedAdapter`).

### D101-6: Conditional Engineering Scope (D101-W1)
- **Status:** **DEFINED AND FROZEN; STAGED PENDING FUTURE AUTHORIZATION.**
- When formal implementation authorization is granted by Program Authority, engineering shall execute **strictly** under the following work package scope (`D101-W1`):
  1. **Strict Adapter Boundary:** Construct `DhanProviderAdapter` implementing the existing frozen `MarketDataProviderAdapter` interface (`frontend/server/market-data/provider-adapter.ts`).
  2. **Zero Core Redesign:** Zero changes to canonical contracts, stores, schedulers, transports, normalizers, or UI components.
  3. **Zero Trading APIs:** Strictly exclude all Dhan order placement, modification, cancellation, fund, and position endpoints. The adapter must be 100% read-only (`POST /marketfeed/quote`).
  4. **Security ID Mapping:** Implement an offline/in-memory resolver mapping NSE symbol strings to Dhan integer `securityId`s using the daily published Dhan scrip master.
  5. **Canonical Normalization:** Losslessly map Dhan quote fields (`last_price`, `ohlc`, `volume`, `last_trade_time`) into canonical `CanonicalMarketDataRecord` structures.
  6. **Token Injection:** Support simple, secure environment injection (`DHAN_CLIENT_ID`, `DHAN_ACCESS_TOKEN`). No hardcoded secrets, no automated headless scraping of login credentials.
  7. **Persistence Invariant:** Maintain in-memory current state; do not persist every 15-minute snapshot.
  8. **Regression Guard:** Preserve 100% pass rate across the existing R-2 acceptance suite (7/7 suites).

### D101-7: Status of `yfinance`
- **Determination:** **MAINTAIN D99-A STATUS UNCHANGED.**
- `yfinance` remains:
  - Technically suitable for planning;
  - Contractually adverse / terms unresolved under Yahoo ToS;
  - Implementation **DEFERRED**.
- Promoting Dhan to preferred technical candidate does **not** authorize `yfinance`.

### D101-8: Historical Market Data Boundary
- **Determination:** **DHAN HISTORICAL API DOES NOT REPLACE NSE 10-YEAR HISTORICAL ARCHITECTURE.**
- The IIPS historical equity requirement remains: **10 years of daily NSE CM equity EOD observations** retained at daily granularity.
- Dhan's historical API (which provides 5 years of historical data) may serve as a secondary research cross-check in future phases, but it does **not** supersede or replace the official **Layer-3 NSE EOD SFTP / CM-UDiFF Common Bhavcopy** architecture.

---

## 3. Explicit Summary of Decisions

| Decision Item | Core Subject | Adjudicated Result | Action Status |
|---|---|---|---|
| **D101-1** | **Technical Candidate** | **PREFERRED TECHNICAL CANDIDATE (Layer 1)** | Approved for Planning |
| **D101-2** | **Account & Economic Commitment**| **APPROVED IN PRINCIPLE (₹499 + GST/mo)** | Approved for Planning |
| **D101-3** | **Contractual Data Rights** | **REQUIRES DIRECT DHAN CONFIRMATION** | Unresolved External Item |
| **D101-4** | **NSE Exchange Entitlement** | **REQUIRES DHAN CONFIRMATION** | Unresolved External Item |
| **D101-5** | **Implementation Authorization** | **IMPLEMENTATION = DEFERRED** | Deferred |
| **D101-6** | **D101-W1 Engineering Scope** | **STAGED / DEFINED (Zero Core Modification)**| Frozen Specification |
| **D101-7** | **yfinance Status** | **MAINTAIN D99-A (DEFERRED)** | Unchanged |
| **D101-8** | **Historical Data Boundary** | **NSE EOD/SFTP REMAINS OFFICIAL ROUTE** | Invariant Preserved |

---

## 4. Remaining External Questions Requiring Resolution

The following questions require direct operator/commercial confirmation before D101-W1 implementation can be initiated:
1. **`Q-DHAN-EXT-01` (Account Onboarding):** Does the operator intend to proceed with individual KYC registration to establish a Dhan trading account?
2. **`Q-DHAN-EXT-02` (Data API Terms Clarification):** Does Dhan's standard API agreement affirmatively permit storing derived metrics (volatility, Sharpe, custom factor scores) on a local private research workstation?
3. **`Q-DHAN-EXT-03` (Exchange Sublicensing Scope):** Does Dhan confirm that retail market-data API access covers non-trading private quantitative research without requiring a direct NSE vendor license?

---

## 5. Frozen Core & Governance Safety Reaffirmation

Program Authority confirms:
- **R-2 Engineering remains 100% ACCEPTED and FROZEN.**
- Zero application code, server contracts, normalizers, parsers, or stores have been altered.
- Zero external network connections or API calls were initiated.
- Zero packages or SDKs have been installed.
- The reference adapter and synthetic CM-UDiFF test fixtures remain the sole active data providers in the repository.

---

## 6. Next Required Act

In accordance with D101-5:

### **NEXT REQUIRED ACT:**
**Submit an Operator Inquiry (`Q-DHAN-EXT-01`/`02`) regarding Dhan account provisioning and contractual data rights.**  
Pending resolution of the operator onboarding decision, all core IIPS development, UI workflows, API endpoints, and quantitative engines continue to execute against the accepted and verified synthetic/reference baseline.
