# IIPS PRODUCTION MARKET DATA PROGRAM
## PROGRAM-WIDE OPEN-ITEM RECONCILIATION

**Document Reference:** `docs/IIPS_PRODUCTION_MARKET_DATA_PROGRAM_OPEN_ITEMS_RECONCILIATION.md`  
**Governing Authority:** Program Authority (Sai / Ramki)  
**Reconciliation Type:** Strictly Read-Only Forensic Program Inventory & Open-Item Audit  
**Verified Baseline HEAD:** `7bf8730bb3fa072d6896245d8205cb3677761005`  
**Branch:** `arena/01a0a438-iips-production-market-data` (100% remote parity with `origin`)  
**Audit Date:** 2026-09-17  

---

## 1. Executive Summary & Audit Mandate

In accordance with Program Authority directives, this report provides a comprehensive, strictly read-only forensic reconciliation of the entire IIPS Production Market Data engineering and governance lifecycle.

### Audit Rules Applied:
1. **Zero Modifications:** No implementation source code, test suites, configurations, persistence layers, provider adapters, or UI components were altered.
2. **Exclusion of Completed/Frozen Work:** All ratified, verified, and frozen engineering artifacts (P00–P14 baseline, P16 closure, D101–D114, D112-A..E, D113 Stage 1 & 2, D113-QCAL09, and D114 batch ingestion) are explicitly verified and separated from active open items.
3. **Rigorous Taxonomy:** Every genuine open item is classified into one of five mutually exclusive operational categories:
   - `ENGINEERING`
   - `EXTERNAL / COMMERCIAL`
   - `AUTHORITY DECISION`
   - `OPERATIONAL`
   - `BLOCKED DEPENDENCY`
4. **Itemized Audit Dimensions:** Each open item is documented with its Current Status, Authoritative Evidence, Dependencies, Production-Blocking State, and Next Executable Act.

---

## 2. Completed & Frozen Milestones (Explicitly Excluded from Open Items)

The following milestones and architectural components are forensically audited as **COMPLETE, VERIFIED, ACCEPTED, AND FROZEN**. They represent settled baseline capabilities and are excluded from the open-item register:

| Milestone / Work Item | Scope / Deliverable | Status | Authoritative Baseline Evidence |
|---|---|:---:|---|
| **P00 – P14** | Foundation, Security Master foundation, Normalization, Pipeline, Decision Matrix, Screener, Executive, Portfolio UI, and Dual-Plane contracts | **ACCEPTED / FROZEN** | `docs/PROGRAM_STATE.md`, `docs/PHASE_07_*` through `docs/PHASE_14_GATE_ACCEPTANCE.md` |
| **P15** | Platform Governance Closure & Corrective Integration | **CLOSED / FROZEN** | `docs/P15_CLOSURE_REPORT.md` (Commit `fef6005`) |
| **P16 Authority Gate** | Production Activation Authority Gate Governance | **CLOSED / FROZEN** | `docs/P16_CLOSURE.md` (Commit `b6281f0`) |
| **D101 / D101-W1** | DhanHQ v2 Provider Implementation (Layer 1 adapter) | **ACCEPTED / FROZEN** | `docs/D101_PROGRAM_AUTHORITY_ADJUDICATION_OI_P16_06_DHAN.md`, `docs/D101_W1_DHAN_PROVIDER_IMPLEMENTATION.md` |
| **D102** | Dhan Live Connectivity Probe & Contract Verification | **ACCEPTED / FROZEN** | `docs/D102_DHAN_LIVE_CONNECTIVITY_VERIFICATION.md` |
| **D103-W1 / DEMO-W2** | Layer-2 NSE CM-UDiFF EOD Ingestion & Operator Drop Probe | **ACCEPTED / FROZEN** | `docs/D103_W1_LAYER2_NSE_EOD_IMPLEMENTATION.md`, `docs/D103_DEMO_W2_NSE_PUBLIC_ARCHIVE_INGESTION_REPORT.md` |
| **D105 / D106 / D107** | Operator Drop Governance, Runbook & Production Readiness Gate | **ACCEPTED / FROZEN** | `docs/D105_PROGRAM_AUTHORITY_ADJUDICATION_OPERATOR_DROP.md`, `docs/D106_OPERATOR_DROP_OPERATIONAL_RUNBOOK.md`, `docs/D107_EOD_PRODUCTION_READINESS_GATE_ADJUDICATION.md` |
| **D108 / D108-R1 / D109** | Governance Synchronization & Layer-1 / Layer-2 Harmonization | **ACCEPTED / FROZEN** | `docs/D108_PROGRAM_GOVERNANCE_SYNCHRONIZATION.md`, `docs/D109_PROGRAM_MILESTONE_SIGNOFF_LAYER1_LAYER2_HARMONIZATION.md` |
| **D110** | Layer-1 Runtime Operationalization Assessment (`LIVE-CAPABLE BUT CREDENTIAL/ENTITLEMENT BLOCKED`) | **ACCEPTED / FROZEN** | `docs/D110_LAYER1_RUNTIME_OPERATIONALIZATION_ASSESSMENT.md` |
| **D112-A** | Canonical Security Master & Bidirectional Resolution Contract | **ACCEPTED / FROZEN** | `frontend/server/security-master/`, `security-master.test.ts` (11/11 passing, Commit `a84198d`) |
| **D112-B** | Development Mixed-Vintage Reference Denominators Contract | **ACCEPTED / FROZEN** | `frontend/server/dynamic-runner/dynamic-engine-input-builder.ts` (Commit `551a983`) |
| **D112-C** | Layer-2.5 EOD Valuation Synthesizer Contract | **ACCEPTED / FROZEN** | `frontend/server/valuation/eod-valuation-synthesizer.ts`, `valuation-synthesizer.test.ts` (18/18 passing, Commit `4753ad1`) |
| **D112-D** | Dynamic Engine Runner & Fail-Closed Guard Contract | **ACCEPTED / FROZEN** | `frontend/server/dynamic-runner/dynamic-engine-runner.ts`, `dynamic-engine-runner.test.ts` (11/11 passing, Commit `551a983`, `f94fcba`) |
| **D112-E** | Dynamic Transport Dispatcher & Dual-Plane Routing Contract | **ACCEPTED / FROZEN** | `frontend/server/dynamic-transport/`, `dynamic-transport.test.ts` (14/14 passing, Commits `ef4c91c`, `5b83adf`, `f94fcba`) |
| **D113 Stage 1** | Banking Layer-2.5 Calibration-Neutral Valuation Scaffold | **ACCEPTED / FROZEN** | `docs/D113_STAGE1_BANKING_ACCEPTANCE_AND_DURABILITY_RECONCILIATION.md`, Commit `914cdc6` |
| **D113 Stage 2** | Banking P/ABV Numerical Calibration (Ratified 5 Tiers: 90, 75, 60, 45, 20) | **ACCEPTED / FROZEN** | `docs/D113_STAGE2_BANKING_CALIBRATION_ACCEPTANCE_AND_DURABILITY_RECONCILIATION.md`, Commit `f773ade` |
| **D113-QCAL09** | Banking Dynamic Runner Operational Unlock & Governance Correction | **ACCEPTED / FROZEN** | `docs/D113_QCAL09_BANKING_DYNAMIC_RUNNER_UNLOCK_AUTHORITY_RECONCILIATION_CORRECTION.md`, Commits `f94fcba`, `aded9d4`, `7bf8730` |
| **D114** | Automated Historical Bhavcopy Batch Ingestion Harness & CLI | **ACCEPTED / FROZEN** | `frontend/server/market-data/batch-ingestion-harness.ts`, `batch-ingest.ts`, `batch-ingestion.test.ts` (12/12 passing, Commit `8948723`) |

---

## 3. Comprehensive Open-Item Inventory & Classification

The forensic review identified **12 active open items** across the program. Each is detailed below with complete evidence, dependencies, and next executable actions.

```
┌─────────────┬────────────────────────────────────────────────────────┬─────────────────────────┬───────────────────┐
│ Item Code   │ Title / Summary                                        │ Classification          │ Production Block? │
├─────────────┼────────────────────────────────────────────────────────┼─────────────────────────┼───────────────────┤
│ OI-P16-01   │ Commercial NSE Cash Market EOD Feed Agreement          │ EXTERNAL / COMMERCIAL   │ YES (for SFTP)    │
│ OI-P16-02   │ NSE Clause 3 & 8 Non-Commercial / Research Fee Waiver   │ EXTERNAL / COMMERCIAL   │ NO (Optional)     │
│ OI-P16-03   │ Exchange SFTP User ID Formal Assignment                │ EXTERNAL / COMMERCIAL   │ YES (for SFTP)    │
│ OI-P16-04   │ Static Public Egress IP Allowlisting on NSE Perimeter   │ OPERATIONAL             │ YES (for SFTP)    │
│ OI-P16-05   │ Production SSH Key Pair Binding & Mutual Auth          │ OPERATIONAL             │ YES (for SFTP)    │
│ OI-P16-06   │ Port 7010 Active-Active SFTP Connectivity Validation    │ OPERATIONAL             │ YES (for SFTP)    │
│ OI-DHAN-01  │ Layer-1 Dhan Developer Access Token Provisioning       │ EXTERNAL / COMMERCIAL   │ YES (for L1 Live) │
│ OI-HIST-01  │ 10-Year Historical Bhavcopy Archive Acquisition        │ BLOCKED DEPENDENCY      │ NO (Core Ready)   │
│ OI-FUND-01  │ Authoritative Production Fundamentals Ingestion Source │ BLOCKED DEPENDENCY      │ YES (Prod Live)   │
│ OI-SEC-01   │ Ind AS 116 Lease Capitalization Policy (Decision C2)   │ AUTHORITY DECISION      │ NO (Staged Gate)  │
│ OI-SEC-02   │ Remaining 4 Blocked Sectors Valuation Calibration      │ ENGINEERING             │ NO (Staged Gate)  │
│ OI-UI-01    │ Global UI Live Socket / Refresh Auto-Wiring            │ ENGINEERING             │ NO (Manual Ready) │
└─────────────┴────────────────────────────────────────────────────────┴─────────────────────────┴───────────────────┘
```

---

## 4. Itemized Open-Item Details

### Item 1: OI-P16-01 — Commercial NSE Cash Market EOD Feed Agreement
- **Classification:** `EXTERNAL / COMMERCIAL`
- **Current Status:** **OPEN / EXTERNALLY GATED**. Commercial licensing agreement with NSE Data & Analytics Limited has not been executed.
- **Authoritative Evidence:** `docs/p00/P00_OPEN_ITEMS_REGISTER.md` §Addendum D108-R1; `docs/D107_EOD_PRODUCTION_READINESS_GATE_ADJUDICATION.md` §3.
- **Dependencies:** Commercial business negotiation, budget authorization, corporate entity registration.
- **Blocks Production?** **YES for automated exchange SFTP ingestion**. **NO for governed operational workstation use**, where `OPERATOR_DROP` (`.iips-data/bhavcopy/`) is certified under D107.
- **Next Executable Act:** Program Authority commercial execution of licensing contract with NSE Data & Analytics Limited.

### Item 2: OI-P16-02 — NSE Clause 3 & 8 Non-Commercial / Research Fee Waiver
- **Classification:** `EXTERNAL / COMMERCIAL`
- **Current Status:** **OPEN / PENDING INQUIRY**. Formal request for academic/research concession or non-commercial fee waiver under Clauses 3 & 8 of the NSE Data Policy has not been formally submitted or granted.
- **Authoritative Evidence:** `docs/D98_PROGRAM_AUTHORITY_ADJUDICATION_THREE_LAYER_MARKET_DATA.md` §4; `docs/p00/P00_OPEN_ITEMS_REGISTER.md`.
- **Dependencies:** Legal / corporate representation submission to NSE Data & Analytics Limited.
- **Blocks Production?** **NO**. (Cost optimization track; commercial execution under OI-P16-01 is fallback).
- **Next Executable Act:** Authorize and dispatch formal inquiry letter to NSE Data Policy committee regarding single-user private research concession.

### Item 3: OI-P16-03 — Exchange SFTP User ID Formal Assignment
- **Classification:** `EXTERNAL / COMMERCIAL`
- **Current Status:** **OPEN / BLOCKED BY OI-P16-01**. Formal production username/account on `eodsftp1.nseindia.com` / `eodsftp2.nseindia.com` has not been provisioned.
- **Authoritative Evidence:** `docs/p00/P00_OPEN_ITEMS_REGISTER.md` §Addendum D108-R1; `docs/D105_PROGRAM_AUTHORITY_ADJUDICATION_OPERATOR_DROP.md` §3.
- **Dependencies:** Completion of `OI-P16-01` (Commercial Contract Execution).
- **Blocks Production?** **YES for automated SFTP**.
- **Next Executable Act:** Receive credential allocation from NSE Market Data Operations following contract sign-off.

### Item 4: OI-P16-04 — Static Public Egress IP Allowlisting on NSE Perimeter
- **Classification:** `OPERATIONAL`
- **Current Status:** **OPEN / PENDING INFRASTRUCTURE ALLOCATION**. Dedicated static IPv4 public egress address has not been provisioned and submitted to NSE firewall administrators for port 7010 traversal.
- **Authoritative Evidence:** `docs/p00/P00_OPEN_ITEMS_REGISTER.md`; `docs/D103_DEMO_W2_NSE_PUBLIC_ARCHIVE_INGESTION_REPORT.md` §4.
- **Dependencies:** Cloud host / ISP static public IP allocation and completion of `OI-P16-01`.
- **Blocks Production?** **YES for automated SFTP**.
- **Next Executable Act:** Bind static public IP to the deployment server and submit form to NSE technical operations.

### Item 5: OI-P16-05 — Production SSH Key Pair Binding & Mutual Authentication
- **Classification:** `OPERATIONAL`
- **Current Status:** **OPEN / PENDING SFTP PROVISIONING**. Ed25519 or RSA-4096 production key pair has not been generated and exchanged with exchange SFTP systems.
- **Authoritative Evidence:** `docs/p00/P00_OPEN_ITEMS_REGISTER.md` §Addendum D108-R1; `frontend/server/market-data/nse-sftp-adapter.ts`.
- **Dependencies:** Resolution of `OI-P16-03` and `OI-P16-04`.
- **Blocks Production?** **YES for automated SFTP**.
- **Next Executable Act:** Generate dedicated deployment OpenSSH key pair and upload public component to exchange credential portal.

### Item 6: OI-P16-06 — Port 7010 Active-Active SFTP Connectivity Validation
- **Classification:** `OPERATIONAL`
- **Current Status:** **OPEN / PENDING NETWORK & KEYS**. Mutual TLS / SSH handshake against primary (`eodsftp1.nseindia.com:7010`) and secondary (`eodsftp2.nseindia.com:7010`) has not been exercised.
- **Authoritative Evidence:** `docs/p00/P00_OPEN_ITEMS_REGISTER.md` §Addendum D108-R1; `docs/D107_EOD_PRODUCTION_READINESS_GATE_ADJUDICATION.md`.
- **Dependencies:** Resolution of `OI-P16-01` through `OI-P16-05`.
- **Blocks Production?** **YES for automated SFTP**.
- **Next Executable Act:** Execute automated connectivity smoke test using `NseSftpAdapter.testConnection()`.

### Item 7: OI-DHAN-01 — Layer-1 Dhan Developer Access Token Provisioning
- **Classification:** `EXTERNAL / COMMERCIAL`
- **Current Status:** **OPEN / EXTERNALLY BLOCKED**. DhanHQ v2 adapter is code-complete and verified, but live production polling is blocked due to lack of an active, KYC-verified trading account token (HTTP 401 on Windows verification probe).
- **Authoritative Evidence:** `docs/D102_DHAN_LIVE_CONNECTIVITY_VERIFICATION.md` §3; `docs/D110_LAYER1_RUNTIME_OPERATIONALIZATION_ASSESSMENT.md` §1.
- **Dependencies:** User registration of individual trading account with Dhan, API Developer subscription enablement (₹499 + GST/month auto-debit), and generation of 30-day personal access token.
- **Blocks Production?** **YES for Layer-1 ~15m delayed intraday current-state refresh**. **NO for Layer-2 EOD or certified SNAPSHOT analysis**.
- **Next Executable Act:** User-level subscription to Dhan Developer API and environment injection of `DHAN_CLIENT_ID` and `DHAN_ACCESS_TOKEN`.

### Item 8: OI-HIST-01 — 10-Year Historical Bhavcopy Archive Acquisition
- **Classification:** `BLOCKED DEPENDENCY`
- **Current Status:** **OPEN / PENDING EXTERNAL DATA ACCESS**. The 10-year historical batch ingestion engine (`BatchIngestionHarness`, `batch-ingest.ts`) is fully implemented, verified, and certified **`READY`** under D114. However, the physical archive of ~2,500 historical Bhavcopy zip files (2014–2024) has not been populated into the repository or local storage.
- **Authoritative Evidence:** `docs/PROGRAM_STATE.md` §8n; `docs/D98_PROGRAM_AUTHORITY_ADJUDICATION_THREE_LAYER_MARKET_DATA.md` §3; `docs/D107_EOD_PRODUCTION_READINESS_GATE_ADJUDICATION.md` §3.
- **Dependencies:** Formal access authorization to exchange historical archive (via NSE commercial licensing or authorized one-time historical media drop). Scraping public archives is explicitly barred.
- **Blocks Production?** **NO for daily operational EOD or dynamic valuation**. **YES only for multi-year historical backtesting and rolling risk metrics**.
- **Next Executable Act:** Authorize one-time ingestion of historical Bhavcopy files via `npm run batch-ingest -- --dir <path-to-archives>` once media is procured.

### Item 9: OI-FUND-01 — Authoritative Production Fundamentals Ingestion Source
- **Classification:** `BLOCKED DEPENDENCY`
- **Current Status:** **OPEN / DEVELOPMENT HARNESS ACTIVE**. The dynamic analytics plane currently operates under Program Authority Decision **E1** (`DEVELOPMENT_MIXED_VINTAGE`), utilizing static reference fundamentals denominators from certified golden benchmarks. No automated production fundamentals adapter (e.g. quarterly LODR financial report scraper or corporate database feed) exists.
- **Authoritative Evidence:** `docs/D113_PROGRAM_AUTHORITY_ADJUDICATION.md` §2 (Decision E1); `frontend/server/dynamic-runner/dynamic-engine-input-builder.ts`.
- **Dependencies:** Architecture and procurement of an authoritative fundamental corporate financial data feed (e.g., CMIE Prowess, Prime Database, or automated XBRL filing parser).
- **Blocks Production?** **YES for unassisted live fundamental updates**. **NO for development research workstation operation**.
- **Next Executable Act:** Program Authority formulation of specification for Layer-3 automated fundamentals ingestion.

### Item 10: OI-SEC-01 — Ind AS 116 Lease Capitalization Policy (Decision C2)
- **Classification:** `AUTHORITY DECISION`
- **Current Status:** **OPEN / DEFERRED UNDER DECISION C2**. Healthcare and Hospitality sectors require formal resolution of operating lease liabilities (Ind AS 116 right-of-use asset and lease debt treatment) before valuation synthesizers can compute Enterprise Value.
- **Authoritative Evidence:** `docs/D113_PROGRAM_AUTHORITY_ADJUDICATION.md` §2 (Decision C2); `docs/D113_VALUATION_CALIBRATION_SPECIFICATION.md` §5.
- **Dependencies:** Program Authority policy adjudication on whether to treat capitalized lease liabilities as debt in EV calculations for asset-heavy operators.
- **Blocks Production?** **NO for Technology, Energy, and Banking**. **YES for unlocking Healthcare and Hospitality**.
- **Next Executable Act:** Program Authority issuance of formal decision record for Decision C2 (Lease Policy).

### Item 11: OI-SEC-02 — Remaining 4 Blocked Sectors Valuation Calibration
- **Classification:** `ENGINEERING`
- **Current Status:** **OPEN / PENDING STAGED AUTHORIZATION (Decision D2)**. Following the completion and unlock of Banking under D113-QCAL09, four sectors remain in `blockedSectors` (`SECTOR_UNSUPPORTED`):
  1. `Insurance` (requires Price-to-Embedded Value, P/EV calibration)
  2. `Capital Markets` (requires Market Cap to AUM calibration)
  3. `Healthcare` (requires EV/EBITDA calibration, gated by OI-SEC-01)
  4. `Hospitality` (requires EV/EBITDA calibration, gated by OI-SEC-01)
- **Authoritative Evidence:** `frontend/server/dynamic-runner/dynamic-engine-runner.ts` (line 114); `docs/D113_PROGRAM_AUTHORITY_ADJUDICATION.md` (Decision D2).
- **Dependencies:** Resolution of `OI-SEC-01` (for Healthcare/Hospitality) and Program Authority preparation of calibration specifications for Insurance and Capital Markets.
- **Blocks Production?** **NO for currently unlocked sectors**. **YES for complete cross-sector coverage**.
- **Next Executable Act:** Authorize D115 specification and calibration preparation for Group 2 sectors (Insurance & Capital Markets).

### Item 12: OI-UI-01 — Global UI Live Socket / Refresh Auto-Wiring
- **Classification:** `ENGINEERING`
- **Current Status:** **OPEN / REST POLLING OPERATIONAL**. UI components (Decision Matrix, Screener, Executive, Portfolio) correctly consume dynamic LIVE transport DTOs via REST endpoints (`/api/decision-matrix`, `/api/screener/execute`, `/api/executive`). However, continuous push updates via WebSocket or Server-Sent Events (SSE) remain unwired; updates occur on page load or explicit manual refresh.
- **Authoritative Evidence:** `frontend/server/dynamic-transport/dynamic-transport-dispatcher.ts`; `docs/D112_E_LIVE_TRANSPORT_ROUTING_SPECIFICATION.md`.
- **Dependencies:** Finalization of Layer-1 runtime scheduler integration.
- **Blocks Production?** **NO**. REST endpoints fully satisfy existing single-user analytical workflows.
- **Next Executable Act:** Optional implementation of an SSE/WebSocket notification topic for market-data ticks.

---

## 5. Authority Decisions Genuinely Outstanding

A forensic audit of the decision logs indicates that only **two genuine Program Authority decisions** remain outstanding:

1. **Decision C2 (Operating Lease Capitalization Policy):**
   - Governing healthcare hospital networks and hospitality hotel leases under Ind AS 116.
   - Required before technical specifications for Healthcare and Hospitality valuation engines can be codified.
2. **Phase 17 Entry Authorization (Final Production System Cutover):**
   - The formal authorization to transition the workstation from single-user research mode to full enterprise unattended production runtime.
   - Requires resolution of `OI-P16-01` through `OI-P16-06` and `OI-FUND-01`.

*Note:* Decision A1, B2, D2, E1, and Q-CAL-01 through Q-CAL-10 are fully ratified, implemented, and settled.

---

## 6. Recommended Next Executable Act

Based on technical readiness, dependencies, and business constraints:

1. **If proceeding on Financial Analytics (Core Quantitative Path):**
   - **Authorize D115:** Formulate the Stage 1 Valuation Scaffold and Calibration Specification for **Group 2 Sectors: Insurance & Capital Markets** (P/EV and M-Cap/AUM multiples), expanding dynamic analytical coverage from 3 to 5 sectors.
2. **If proceeding on External Market-Data Operations (Infrastructure Path):**
   - Address **OI-DHAN-01** by provisioning an active Dhan Developer API token to validate live Layer-1 ~15-minute delayed streaming end-to-end on a live network.

---

**PROGRAM-WIDE OPEN-ITEM RECONCILIATION COMPLETE. ZERO CODE MODIFIED.**
