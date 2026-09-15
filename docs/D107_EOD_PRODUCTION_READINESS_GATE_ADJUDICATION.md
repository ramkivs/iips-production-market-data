# IIPS D107: EOD Production Readiness Gate Adjudication

**Document Reference:** `docs/D107_EOD_PRODUCTION_READINESS_GATE_ADJUDICATION.md`  
**Adjudication Authority:** Program Authority (Sai / Ramki)  
**Date:** September 15, 2026  
**Status:** **D107 = ACCEPTED**  
**Governing Authority Reference:** D105 (`docs/D105_PROGRAM_AUTHORITY_ADJUDICATION_OPERATOR_DROP.md`)  
**Operational Runbook Baseline:** D106 (`docs/D106_OPERATOR_DROP_OPERATIONAL_RUNBOOK.md`)  
**Commit Baseline:** `799de1129899d336631567305d56fa4ff1b78090`  
**Classification:** `GOVERNED OPERATIONAL CERTIFICATION — ZERO COMMERCIAL ENTITLEMENT CLAIMED`  

---

## 1. Executive Summary & Authoritative Adjudication

### **FORMAL DECISION: D107 = ACCEPTED**

The Program Authority hereby **ACCEPTS** the D106 operationalization and **CERTIFIES** the **`OPERATOR_DROP`** channel (`.iips-data/bhavcopy/`) as the governed operational EOD ingestion mechanism for IIPS production runtime under the standing restrictions established in D105.

The **`OPERATOR_DROP`** path is recognized as the **authoritative operational EOD route** pending future commercial NSE SFTP activation. This certification strictly establishes **engineering and operational production readiness** and **DOES NOT** imply, confer, or substitute for commercial NSE data entitlement or licensing.

---

## 2. Certified Operational Baseline (D106 Evidence Summary)

This certification is grounded upon verified, tested, and durable engineering controls:

1. **Sole Governed Channel:** `.iips-data/bhavcopy/` is the exclusive offline operator drop directory.
2. **CM-UDiFF Processing:** Pure in-memory PKZip Deflate decompression (`ArchiveExtractor`) feeding official 19-column SEBI/NSE CM-UDiFF Common Bhavcopy Final files into `cm-udiff-parser.ts` with zero temporary file disk bloat.
3. **Canonical Filename & Session Validation:** Strict verification of pattern `BhavCopy_NSE_CM_0_0_0_YYYYMMDD_F_0000.csv(.zip)` and matching trade date against `NseTradingCalendar`.
4. **Segment & Equity Series Filtering:** Mandatory retention of eligible equity series (`EQ`, `BE`, `BZ`, `SM`) and deterministic exclusion of non-CM segments (`FO`, `CD`, `CO`) and non-equity debt/derivatives.
5. **Fail-Closed Quality & Quarantine:** Strict mathematical OHLC relationship checking (`High >= Low/Open/Close`, `Low <= Open/Close`, prices > 0); anomalous rows quarantined under rule `OHLC_SANITY`.
6. **Reconciliation & Idempotency:** Duplicate delivery causes 100% duplicate suppression (0 duplicate records added); contradictory duplicate records for the same session are quarantined under `RECONCILIATION_CONFLICT`.
7. **Source File Immutability:** Read-only ingestion streams ensure source archives on disk remain bit-for-bit unchanged (SHA-256 identical pre- and post-run).
8. **Provenance Integrity:** Persistent recording of provenance tags (`[OFFLINE_LOCAL]` and `[OFFLINE_LOCAL_ZIP]`) across all canonical store records and data table inspector views.
9. **Multi-Date & Catch-Up Procedures:** Full support for single-day drops, consecutive missed trading days, and monthly batch sweeps via `EodMonthlyScheduler`.
10. **Clean System Architecture:** No always-running background polling daemons; full visibility via TopBar `MarketDataFreshnessBadge` (`GATE ACTIVE` status displayed while live SFTP is unprovisioned).
11. **Environment Separation:** Windows host verification path (`G:\IIPS-Production-Market-Data-UI-VERIFY\frontend\.iips-data\bhavcopy\`) strictly segregated from Arena sandbox CI execution.
12. **Git Hygiene:** Zero source archives, uncompressed CSVs, or `.iips-data/` contents committed to Git.
13. **Verification Floor Passed:**
    - Dedicated Operator-Drop Suite (`operator-drop.test.ts`): **11/11 passed**
    - Dedicated Layer-2 SFTP/Drop Suite (`nse-sftp-adapter.test.ts`): **11/11 passed**
    - CM-UDiFF Parser Suite (`cm-udiff-parser.test.ts`): **8/8 passed**
    - EOD Pipeline Suite (`pipeline.test.ts`): **8/8 passed**
    - Layer-1 Dhan Suite (`dhan-adapter.test.ts`): **11/11 passed**
    - Market Data Domain Combined: **49/49 passed**
    - Platform Integration Suite (`p13/`): **86/86 passed**
    - TypeScript Typecheck (`tsc --noEmit` & `tsconfig.server.json`): **0 errors**

---

## 3. Mandatory Governance & Operational Boundaries

This operational certification is bound strictly to the following standing constraints:

1. **No Commercial Entitlement:** This certification reflects software and procedural readiness only. It does not constitute or imply commercial licensing from **NSE Data & Analytics Limited**.
2. **No Redistribution:** Market data ingested through this channel is for authorized internal single-user deployment and must not be syndicated or redistributed.
3. **No Web Scraping or URL Harvesting:** Automated web crawling of `nseindia.com` or harvesting of `nsearchives.nseindia.com` is strictly prohibited.
4. **No Layer-1 Substitution:** Dhan and yfinance are prohibited from acting as surrogate sources for official exchange EOD records.
5. **No Speculative 10-Year Ingestion:** The 10-year historical backfill architecture remains certified **READY**, but actual historical population remains **PENDING AUTHORIZED EXTERNAL DATA ACCESS**.
6. **No Infrastructure Creep:** Ingestion relies exclusively on the existing in-memory store and governed `.iips-data/` directory. Zero new database engines or ORMs are permitted.

---

## 4. Status of External Commercial SFTP Track

The automated active-active commercial SFTP track (port 7010) remains **EXTERNALLY GATED & OPEN** in the Program Open Items Register:
- `OI-P16-01`: Commercial Cash Market EOD Feed Agreement with NSE Data & Analytics Limited.
- `OI-P16-02`: Permitted retention and multi-year analytical use determination.
- `OI-P16-03`: Formal assignment of exchange SFTP User ID.
- `OI-P16-04`: Static public egress IP allowlisting on NSE perimeter firewalls.
- `OI-P16-05`: Production SSH key pair binding and mutual authentication testing.
- `OI-P16-06`: Port 7010 active-active connectivity validation (`eodsftp1.nseindia.com` and `eodsftp2.nseindia.com`).

---

## 5. Next Executable Program Action

### **NEXT PROGRAM ACTION: D108**
- **Title:** `D108 — PROGRAM GOVERNANCE SYNCHRONIZATION & PROGRAM STATE UPDATE`
- **Scope:** 
  1. Synchronize `docs/PROGRAM_STATE.md` to reflect D107 operational acceptance of Layer-2 Operator-Drop EOD mode.
  2. Update `docs/p00/P00_OPEN_ITEMS_REGISTER.md` to record completion of Layer-2 offline acquisition milestones and affirm the open external status of `OI-P16-01` through `OI-P16-06`.
  3. Prepare final milestone summary for Program Authority sign-off.
