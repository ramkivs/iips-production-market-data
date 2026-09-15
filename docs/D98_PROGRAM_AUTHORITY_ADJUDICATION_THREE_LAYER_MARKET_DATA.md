# D98: Program Authority Adjudication — Three-Layer Market-Data Strategy

**Act ID:** `D98-PROGRAM-AUTHORITY-ADJUDICATION-THREE-LAYER-MARKET-DATA`  
**Date:** 2026-09-15  
**Authority:** Program Authority (Sai / Ramki)  
**Execution Boundary:** FORMAL GOVERNANCE ADJUDICATION ONLY — ZERO RUNTIME IMPLEMENTATION  
**R-2 Status:** ACCEPTED / FROZEN under D97  

---

## 1. Executive Summary & Context

Following the completion of the D98 documentation synchronization pass, this formal authority act establishes the binding market-data strategy and dependency model for the IIPS Program.

The purpose of this adjudication is to formally adopt a sustainable, economically sound **Three-Layer Market-Data Strategy** for the single-user, private, non-trading investment research deployment of IIPS. This act explicitly decouples the three market-data domains, settles provider-economics decisions, reclassifies historical data dependencies, and protects the frozen R-2 architecture without authorizing any runtime provider execution.

---

## 2. Program Authority Determinations (AD-1 through AD-8)

Program Authority (Sai / Ramki) hereby formally issues the following binding determinations:

### AD-1: Adoption of Three-Layer Market-Data Strategy
- **Decision:** **ADOPTED / APPROVED.**
- **Finding:** Market-data requirements across IIPS are structurally tripartite and must not be conflated into a single monolithic provider or entitlement:
  1. **Layer 1 (Current-State):** ~15-minute delayed equity refresh for active analysis.
  2. **Layer 2 (Daily EOD):** Daily official closing Bhavcopy records, corporate actions, and master data.
  3. **Layer 3 (10-Year History):** 10 years of daily EOD observations retained for quantitative factor modeling.
- **Governing Principle:** Exchange/reference authority is distinct from practical runtime acquisition. **NSE (National Stock Exchange of India)** remains the authoritative exchange direction for Capital Market equities and the official reference for EOD and historical data structures.

### AD-2: Adoption of `yfinance` as Preferred Initial Layer-1 Candidate
- **Decision:** **ADOPTED AS PREFERRED / INITIAL PRACTICAL CANDIDATE.**
- **Status:** **NOT YET IMPLEMENTED. NOT AN APPROVED PRODUCTION PROVIDER.**
- **Scope & Limitations:**
  - `yfinance` is recognized as the practical initial candidate to feed the ~15-minute current-state scheduler because it avoids direct recurring polling of NSE public endpoints and introduces no recurring commercial feed cost for a single-user private workstation.
  - `yfinance` is **NOT** declared an authoritative exchange source.
  - `yfinance` is **NOT** declared automatically legally or contractually cleared; applicable terms of service, rate limits, and private non-commercial research constraints remain subject to verification.
  - Any future implementation must integrate strictly behind the frozen `MarketDataProviderAdapter` interface without modifying the canonical contract or leaking provider specifics into engines/UI.

### AD-3: Retention of Dhan Data API as Alternative Layer-1 Candidate
- **Decision:** **ADOPTED AS ALTERNATIVE CANDIDATE.**
- **Status:** **NOT YET IMPLEMENTED.**
- **Scope & Limitations:**
  - Dhan Data API is retained as a valid secondary/alternative candidate for ~15-minute delayed equity quotes.
  - Progression is conditional upon verification of actual account entitlement, current commercial/API pricing, service availability, and permitted analytical data usage.

### AD-4: Non-Selection of NSE Commercial 15-Minute Snapshot Feed
- **Decision:** **NOT SELECTED ON ECONOMIC GROUNDS.**
- **Rationale:** The commercial NSE 15-minute Snapshot product is technically valid and fully supported by the R-2 provider-neutral architecture, but commercial pricing is not economically justified for the initial single-user, private deployment.
- **Impact:** IIPS is **NOT dependent** on purchasing the commercial NSE 15-minute Snapshot feed for continued program progression.

### AD-5: Absolute Exclusion of Recurring Public NSE Endpoint Polling/Scraping
- **Decision:** **EXPLICITLY EXCLUDED / PROHIBITED.**
- **Rationale:** Recurring automated scraping, polling, or scraping-wrapper libraries targeting `nseindia.com` public web endpoints (including `nsepython`, `NSELive`, and custom polling loops) violate NSE terms of service, trigger Akamai IP blocks, and lack stability.
- **Invariant:** Direct automated polling of public NSE endpoints is prohibited as an IIPS runtime market-data mechanism.

### AD-6: Reclassification of 10-Year Historical Data Dependency
- **Decision:** **CONFIRMED AS DOWNSTREAM DATA-ACTIVATION DEPENDENCY.**
- **Rationale:** The 10-year historical equity dataset is an analytical activation prerequisite for empirical modules (historical factor backtesting, rolling volatility, Sharpe ratio, PIT validation), but is **NOT a development blocker** for core engineering, contracts, engines, API, or UI surfaces.
- **Status Classification:**
  - 10-Year Historical Backfill Capability = **READY** (multi-day calendar support, resumption, idempotency verified).
  - Actual 10-Year Population = **PENDING EXTERNAL DATA ACCESS**.
  - Core development proceeds unhindered using approved synthetic and reference fixtures.

### AD-7: Confirmation of Historical Operational Model
- **Decision:** **CONFIRMED: ONE-TIME BASELINE + MONTHLY INCREMENTAL EOD REFRESH.**
- **Operational Cadence:**
  - Analytical granularity remains **daily EOD observations** spanning 10 years (~2,500 trading sessions).
  - Ingestion operates via an **initial one-time baseline population**, followed by a **monthly incremental EOD acquisition/refresh by default**.
  - Re-downloading or scraping the full 10-year archive on a daily basis is **expressly prohibited**.

### AD-8: Strict Implementation Boundary
- **Decision:** **NO IMPLEMENTATION AUTHORIZED BY THIS ACT.**
- **Boundary:** This adjudication is a governance and strategy decision only. It authorizes **zero code changes**, **zero package installations**, and **zero external network requests**. Any engineering implementation of a Layer-1 adapter (`yfinance` or `Dhan`) requires a subsequent, explicit, separate engineering work authorization from Program Authority.

---

## 3. Explicit Non-Decisions & External Open Items

This authority adjudication does **NOT** resolve, and explicitly maintains as external/legal matters:

1. **NSE Commercial Licensing:** Commercial terms and data distribution agreements with NSE Data & Analytics Limited remain an open external business dependency (`OI-P16-01`).
2. **NSE Non-Commercial / Research Concessions:** Applicability of Clause 3 & 8 fee waivers under the NSE Data Policy remains an open external inquiry (`OI-P16-02`).
3. **Public Archive Permissibility:** Regulatory/exchange determination regarding whether non-commercial private quantitative research may acquire historical Bhavcopy archives from `archives.nseindia.com` remains `NOT DETERMINED BY ENGINEERING` (`OI-P16-03`).
4. **SFTP Provisioning:** Exchange IP allowlisting and SSH credential binding for `eodsftp1.nseindia.com` / `eodsftp2.nseindia.com:7010` remain pending contract execution (`OI-P16-04`).
5. **yfinance Terms Verification:** Detailed review of applicable data rights and terms of service for personal private research remains open (`OI-P16-05`).
6. **Dhan API Terms Verification:** Detailed review of account requirements and terms for Dhan Data API remains open (`OI-P16-06`).

---

## 4. Frozen Core Affirmation

Program Authority reaffirms that:
- **R-2 Engineering is CLOSED, IMPLEMENTED, TESTED, and FROZEN.**
- The canonical market-data contract (`frontend/server/market-data/canonical-contract.ts`) is immutable.
- The CM-UDiFF parser, normalizer, current-state store, 15m scheduler, and EOD pipeline are immutable.
- The UI Freshness Badge (`frontend/src/components/data/MarketDataFreshnessBadge.tsx`) and TopBar integration are verified and frozen.
- Acceptance evidence (`frontend/src/test/r2-ui-acceptance.test.tsx`: 7/7 PASS) is accepted and immutable.

---

## 5. Next Required Program Action

Following this adjudication, the next authorized program actions are:
1. **Pre-Implementation Assessment:** Prepare a formal implementation specification and terms-of-use evaluation for an offline/sandboxed `yfinance` adapter strictly implementing `MarketDataProviderAdapter`.
2. **Work Item Authorization:** Issue a separate explicit engineering authorization before writing any provider-adapter code.
