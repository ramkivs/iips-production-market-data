# IIPS D109: Program Milestone Sign-Off & Layer-1 / Layer-2 Operational Harmonization

**Document Reference:** `docs/D109_PROGRAM_MILESTONE_SIGNOFF_LAYER1_LAYER2_HARMONIZATION.md`  
**Governing Authority:** Program Authority (Sai / Ramki)  
**Date:** September 15, 2026  
**Status:** **D109 = ACCEPTED**  
**Milestone Completion:** **Layer-2 EOD Operationalization Milestone = COMPLETE**  
**Commit Baseline:** `8e7064f7d90c2c3c3b1d9eecd8a312d8d2581b00`  
**Classification:** `GOVERNANCE & BASELINE HARMONIZATION — ZERO CODE MODIFICATION`  

---

## 1. Executive Summary & Authoritative Milestone Sign-Off

### **FORMAL ADJUDICATION: D109 = ACCEPTED**
### **MILESTONE STATUS: Layer-2 EOD Operationalization Milestone = COMPLETE**

The Program Authority hereby **ACCEPTS** the formal completion of the **Layer-2 EOD Operationalization Cycle** and establishes the permanent architectural, operational, and governance boundary between **Layer 1** (Intraday Current-Market-Data Refresh) and **Layer 2** (Official NSE CM-UDiFF EOD Market Data via Certified Operator Drop).

This milestone sign-off is grounded upon the uncompromised succession of verified engineering, operational, and governance acts:
1. **D105:** Program Authority Adjudication formally authorizing `OPERATOR_DROP` (`.iips-data/bhavcopy/`).
2. **D106:** Implementation and validation of the Operator-Drop Operational Runbook and 14-point test suite (`operator-drop.test.ts`, 11/11 passed).
3. **D107:** Formal EOD Production Readiness Gate adjudication (`D107 = ACCEPTED`).
4. **D108:** Synchronization of core program ledgers (`PROGRAM_STATE.md` and `P00_OPEN_ITEMS_REGISTER.md`).
5. **D108-R1:** Permanent reconciliation and restoration of the authoritative D107 definitions for the commercial active-active SFTP track (`OI-P16-01` through `OI-P16-06`).

---

## 2. Layer-1 vs. Layer-2 Architectural & Operational Boundary

The IIPS Three-Layer Market Data Architecture strictly decouples the responsibilities, cadences, failure modes, and provenance of Layer 1 and Layer 2:

```
┌────────────────────────────────────────────────────────────────────────┐
│             LAYER 1: INTRADAY CURRENT-STATE REFRESH                    │
├────────────────────────────────────────────────────────────────────────┤
│ • Primary Purpose:        ~15-minute delayed snapshot during market hrs│
│ • Canonical Contract:     CanonicalCurrentStateRecord                  │
│ • Ingestion Cadence:      Periodic polling (~15 min, 09:15 - 15:30 IST)│
│ • Active Candidate:       Dhan Data API (v2 Quote REST endpoint)       │
│ • Secondary Candidate:    yfinance (deferred pending usage review)     │
│ • Entitlement Status:     EXTERNALLY BLOCKED (OI-P16-06 Gate Active)   │
│ • Ingestion Rule:         NEVER persists recurring 15m snapshots      │
│ • Isolation Rule:         NEVER overwrites or fabricates EOD history   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
              [STRICT ARCHITECTURAL ISOLATION BOUNDARY]
                                   │
┌──────────────────────────────────┴─────────────────────────────────────┐
│             LAYER 2: OFFICIAL DAILY NSE CM-UDiFF EOD                   │
├────────────────────────────────────────────────────────────────────────┤
│ • Primary Purpose:        Certified daily closing equity observations  │
│ • Canonical Contract:     CanonicalEquityEodRecord                     │
│ • Ingestion Cadence:      Daily batch / Monthly sweep via OPERATOR_DROP│
│ • Operational Channel:    .iips-data/bhavcopy/ (Certified D107)        │
│ • In-Memory Processing:   ArchiveExtractor (Zero temp file disk bloat) │
│ • Series Permitted:       EQ, BE, BZ, SM (Excludes Debt & Derivs)      │
│ • Operational Status:     CERTIFIED / OPERATIONALLY READY              │
│ • Ingestion Rule:         Persists canonical daily records indefinitely│
│ • Isolation Rule:         Independent of Layer 1 network availability  │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Harmonization Principles
1. **Zero Data Overwriting:** Intraday/current-state data from Layer 1 must **NEVER** overwrite, modify, or substitute for authoritative Layer-2 EOD records.
2. **Zero Price Fabrication:** In the event that an official Layer-2 EOD file is delayed or un-dropped, the system must **NEVER** synthesize or fabricate closing EOD bars from Layer-1 intraday ticks.
3. **Independent Runtime Survivability:** Failure, quota exhaustion, or unprovisioned credential state in Layer 1 (Dhan) has **zero effect** on the operator's ability to ingest official daily Bhavcopy files via Layer-2 `OPERATOR_DROP`.
4. **Separate Governance Tracks:** Layer-1 provider candidate evaluations (`OI-P16-05` for yfinance, `OI-P16-06` for Dhan) remain completely separate from the exchange SFTP EOD track (`OI-P16-01` through `OI-P16-06`). A provider adapter existing for Layer 1 does **not** make it an authoritative EOD source.

---

## 3. Authoritative Layer-2 Operational State

| Attribute | Certified Status | Governing Authority |
|---|---|---|
| **Layer-2 EOD Status** | **`CERTIFIED / OPERATIONALLY READY — OPERATOR_DROP`** | D105, D106, D107 |
| **Production EOD Route** | **`OPERATOR_DROP`** | D105 §2, D107 §1 |
| **Governed Drop Location** | `.iips-data/bhavcopy/` | D105 §2, D106 §2 |
| **Exchange File Format** | NSE CM-UDiFF Common Bhavcopy Final (`.csv` / `.csv.zip`) | D103-W1, D106 §3 |
| **D107 Gate Acceptance** | **`ACCEPTED`** (EOD Production Readiness Gate) | `D107_EOD_PRODUCTION_READINESS_GATE_ADJUDICATION.md` |
| **10-Year Backfill Architecture** | **`READY`** (Deterministic multi-year trading calendar) | D98 §8m, D107 §3, D108 §8n |
| **10-Year Historical Population**| **`PENDING AUTHORIZED EXTERNAL DATA ACCESS`** | D98 §8m, D107 §3, D108 §8n |
| **Commercial Active-Active SFTP** | **`EXTERNALLY GATED / OPEN`** (Port 7010) | D107 §4, D108-R1 |

---

## 4. Preservation of the Commercial NSE SFTP Track (P16 Baseline)

The six commercial active-active SFTP items defined in D107 remain **OPEN, EXTERNALLY GATED, and UNALTERED**:

- **`OI-P16-01`**: Cash Market EOD Feed Agreement with NSE Data & Analytics Limited.
- **`OI-P16-02`**: Permitted enterprise retention and analytical use determination.
- **`OI-P16-03`**: Formal assignment of exchange SFTP User ID.
- **`OI-P16-04`**: Static public egress IP allowlisting on NSE perimeter firewalls.
- **`OI-P16-05`**: Production SSH key pair binding and mutual authentication.
- **`OI-P16-06`**: Port 7010 active-active connectivity validation (`eodsftp1.nseindia.com` / `eodsftp2.nseindia.com`).

*Affirmation:* Zero P16 items are closed. Operational certification of `OPERATOR_DROP` does **not** equal commercial exchange licensing.

---

## 5. Implementation Discipline & Verification

- **Code Changes Authorized:** **ZERO**.
- **Implementation Drift:** **ZERO**.
- **Database / Infrastructure Additions:** **ZERO** (Strictly uses existing `.iips-data` filesystem and in-memory `MarketDataStore`).
- **Regression Suite Compliance:** 
  - Operator-Drop Suite: **11/11 passed**
  - Layer-2 Adapter Suite: **11/11 passed**
  - Parser & Normalizer: **16/16 passed**
  - Layer-1 Dhan Suite: **11/11 passed**
  - Combined Market Data Domain: **49/49 passed**
  - P13 Integration Suite: **86/86 passed**
  - TypeScript Typecheck (`tsc --noEmit`): **0 errors**

---

## 6. Git Durability & State Audit

- **Starting Commit HEAD:** `8e7064f7d90c2c3c3b1d9eecd8a312d8d2581b00`
- **Committed Milestone Document:** `docs/D109_PROGRAM_MILESTONE_SIGNOFF_LAYER1_LAYER2_HARMONIZATION.md`
- **Working Tree:** Clean (0 untracked files, 0 tracked binary datasets).

---

## 7. Recommended Next Executable Program Action

### **RECOMMENDED PROGRAM ACT: D110**
**Layer-1 Runtime Operationalization & Credential Gate Assessment (`D110`):**  
With the Layer-2 EOD operationalization milestone formally closed and certified, shift program focus to Layer-1: adjudicate the production readiness and live credential activation requirements for the ~15-minute delayed intraday equity refresh adapter (`dhan-adapter.ts`).
