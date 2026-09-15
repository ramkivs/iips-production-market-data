# D99-A: Program Authority Adjudication — OI-P16-05 (`yfinance` Current-State Provider Assessment)

**Act ID:** `D99-A-PROGRAM-AUTHORITY-ADJUDICATION-OI-P16-05-YFINANCE`  
**Date:** 2026-09-15  
**Authority:** Program Authority (Sai / Ramki)  
**Execution Boundary:** FORMAL GOVERNANCE ADJUDICATION ONLY — ZERO RUNTIME IMPLEMENTATION  
**R-2 Status:** ACCEPTED / FROZEN under D97  

---

## 1. Purpose & Governance Context

Following the completion of the `OI-P16-05` pre-implementation assessment, this formal authority act adjudicates the technical findings, legal/contractual terms, and implementation readiness of `yfinance` as the preferred initial candidate for IIPS Layer-1 (approximately 15-minute delayed current-state equity refresh).

This adjudication formally separates **technical feasibility** from **contractual/legal authorization**, establishes the binding governance position regarding Yahoo Finance's terms of service, adjudicates rate-boundary claims, and issues the controlling implementation determination (D99-A-1 through D99-A-6).

---

## 2. Program Authority Determinations (D99-A-1 through D99-A-6)

Program Authority (Sai / Ramki) hereby formally issues the following binding determinations:

### D99-A-1: Technical Suitability of `yfinance`
- **Determination:** **ACCEPTED / APPROVED (TECHNICAL ONLY).**
- **Finding:** `yfinance` is technically suitable for the IIPS Layer-1 requirement, subject to the documented limitations. Specifically accepted for planning:
  - Full support for NSE equities via the `.NS` symbol suffix.
  - Compatibility with an approximately 15-minute current-state refresh cycle.
  - Low-volume single-user batching capability.
  - Seamless integration behind the frozen `MarketDataProviderAdapter` interface.
  - Lossless normalization into the canonical IIPS market-data contract.
  - Comprehensive fail-closed and stale-data error handling.
  - Complete provider replaceability without reopening or modifying frozen R-2 components.
- **Limitation:** Technical suitability does **NOT** constitute or imply commercial or legal authorization.

### D99-A-2: Yahoo Finance Terms & Automated-Access Permission
- **Determination:** **UNRESOLVED / EXTERNAL TERMS RISK CONFIRMED.**
- **Binding Rule:**
  - Yahoo's current Terms of Service explicitly prohibit automated collection, extraction, data-mining, or scraping of content without express prior written permission.
  - **OI-P16-05 TERMS STATUS = UNRESOLVED / EXTERNAL.**
  - `yfinance` is **NOT** legally cleared or authorized for automated IIPS polling.
  - `yfinance` must **NEVER** be described as an "authorized" provider.
  - Authorization must **NEVER** be inferred from:
    1. Free web accessibility,
    2. Personal or non-commercial use,
    3. Low request volume,
    4. Private investment research purpose, or
    5. The permissive open-source Apache 2.0 license of the `yfinance` software wrapper.
  - The software license is legally distinct from the rights to access, query, or store the underlying market data.

### D99-A-3: Rate Boundary & Request Frequency
- **Determination:** **ACCEPTED AS TECHNICALLY PLAUSIBLE ONLY; NOT AN AUTHORIZED SLA.**
- **Binding Rule:**
  - The expected IIPS request load (~1–2 batched HTTP requests every 15 minutes, or ~25–50 requests per trading day) is **technically plausible** and operationally viable without triggering common automated IP blocks.
  - Community-observed request thresholds (e.g. ~2,000 req/hr) do **NOT** represent an official Yahoo SLA, contractual allowance, or permission.
  - Claims of "guaranteed limits", "orders of magnitude below thresholds", or "zero IP-ban risk" are rejected from official governance ledgers.
  - **Status Classification:**
    - **RATE FEASIBILITY:** `TECHNICALLY PLAUSIBLE`.
    - **RATE AUTHORIZATION:** `NOT ESTABLISHED`.

### D99-A-4: Implementation Authorization Decision
- **Determination:** **IMPLEMENTATION = DEFERRED PENDING FORMAL TERMS/PERMISSION RESOLUTION.**
- **Rationale & Findings:**
  - Program Authority declines to accept the unresolved Yahoo automated-access terms risk for immediate live implementation.
  - `yfinance` remains the **preferred technical candidate**, but cannot yet be treated as an authorized production current-state provider.
  - In accordance with IIPS core governance principles (fail-closed, transparent lineage, zero unevidenced compliance claims), engineering implementation of a live `yfinance` polling adapter is **DEFERRED**.
  - Core development, API contracts, engines, and UI continue to operate unhindered against the verified reference/synthetic test double (`ReferenceFileBasedAdapter`).

### D99-A-5: Retention & Acceleration of Dhan Data API Fallback
- **Determination:** **RETAINED AS ACTIVE ALTERNATIVE; CANDIDATE FOR IMMEDIATE ASSESSMENT.**
- **Binding Rule:**
  - Dhan Data API is retained as the primary alternative candidate for Layer-1 current state under `OI-P16-06`.
  - Because Dhan offers formal contractual developer API agreements that explicitly authorize programmatic access for personal analytical use, Dhan may become preferable to `yfinance` despite account setup requirements.
  - `OI-P16-06` remains open to evaluate actual account entitlement, current commercial/API pricing, data rights, rate limits, and private analytical usage terms.

### D99-A-6: Implementation Boundary Affirmation
- **Determination:** **CONFIRMED: ZERO IMPLEMENTATION AUTHORIZED.**
- **Scope:** Zero source code changes, zero package installations (`yfinance`, `Dhan`, etc.), zero network calls, zero credential provisioning, and zero database schema changes are authorized by this act.

---

## 3. Explicit Status of Program Elements Post-D99-A

| Program Element | Status Following D99-A Adjudication | Governing Action |
|---|---|---|
| **Layer 1: `yfinance`** | **PREFERRED TECHNICAL CANDIDATE; IMPLEMENTATION DEFERRED.** Technically suitable; terms remain unresolved/external (`OI-P16-05`). NOT authorized for production runtime. | D99-A-1, D99-A-4 |
| **Layer 1: `Dhan Data API`** | **ACTIVE ALTERNATIVE CANDIDATE.** Pending formal entitlement and API terms assessment (`OI-P16-06`). | D99-A-5 |
| **Layer 1: Commercial NSE Snapshot** | **NOT SELECTED ON ECONOMIC GROUNDS.** Technically valid, but commercial fees are not justified for single-user deployment. | D98 AD-4 |
| **Layer 1: NSE Public Web Scraping** | **EXPLICITLY EXCLUDED / PROHIBITED.** Recurring automated polling of `nseindia.com` via `nsepython`/`NSELive` is strictly banned. | D98 AD-5 |
| **Layer 2: NSE Daily EOD** | **OFFICIAL TARGET ARCHITECTURE CONFIRMED.** SFTP v1.2 specification (port 7010). Externally gated pending commercial licensing & credentials (`OI-P16-01`, `OI-P16-04`). | D98 AD-1 |
| **Layer 3: 10-Year History** | **DOWNSTREAM DATA-ACTIVATION DEPENDENCY.** Capability READY; population PENDING EXTERNAL ACCESS. Default cadence: one-time baseline + monthly incremental EOD. | D98 AD-6, AD-7 |
| **R-2 Core Pipeline & UI** | **ACCEPTED / FROZEN.** Canonical contract, CM-UDiFF parser, normalizer, 15m scheduler, and TopBar Freshness Badge remain untouched. | D97 |

---

## 4. Remaining External Questions

The following items remain strictly open and outside engineering determination:
1. **`OI-P16-01`:** Commercial agreement with NSE Data & Analytics Limited for EOD & Historical data.
2. **`OI-P16-02`:** Evaluation of Clause 3 & 8 Non-Commercial / Research fee waiver applicability with NSE Data & Analytics.
3. **`OI-P16-03`:** Legal/policy determination on public archive access for offline research bootstrap (`NOT DETERMINED BY ENGINEERING`).
4. **`OI-P16-04`:** Static public IP registration and OpenSSH public key exchange with NSE SFTP operations (`eodsftp1.nseindia.com` / `eodsftp2.nseindia.com:7010`).
5. **`OI-P16-05`:** Clarification/permission regarding Yahoo Terms of Service for automated personal research polling (Status: `UNRESOLVED / EXTERNAL`).
6. **`OI-P16-06`:** Dhan Data API account entitlement, API pricing, and private non-commercial data rights.

---

## 5. Frozen Core & Governance Safety Reaffirmation

Program Authority reaffirms:
- **R-2 Engineering remains 100% ACCEPTED and FROZEN.**
- No application source files, server contracts, parsers, normalizers, or stores have been altered.
- No network connections were initiated.
- No market data was downloaded or scraped.
- The reference adapter and synthetic test fixtures remain the sole active data providers in the repository.

---

## 6. Next Required Act

In accordance with D99-A-4 and D99-A-5:

### **NEXT REQUIRED ACT:**
**Commission an equivalent Pre-Implementation Assessment for Candidate 2 (`OI-P16-06`: Dhan Data API)** to determine whether Dhan provides clear contractual developer terms, stable REST endpoints, and zero-cost or low-cost personal research entitlement, thereby establishing a fully authorized contractual path for the Layer-1 current-state adapter.
