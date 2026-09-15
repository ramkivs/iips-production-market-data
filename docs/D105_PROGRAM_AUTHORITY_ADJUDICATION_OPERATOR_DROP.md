# IIPS D105: Program Authority Adjudication — Layer-2 Operator-Drop Operational Authorization

**Document Reference:** `docs/D105_PROGRAM_AUTHORITY_ADJUDICATION_OPERATOR_DROP.md`  
**Adjudication Authority:** Program Authority (Sai / Ramki)  
**Date:** September 15, 2026  
**Status:** **AUTHORIZE OPERATOR_DROP**  
**Classification:** `GOVERNED OPERATIONAL INGESTION CHANNEL — NOT COMMERCIAL ENTITLEMENT`  

---

## 1. Authoritative Evidence Base

The Program Authority bases this adjudication on three independently corroborated technical and operational milestones:

1. **D103-DEMO-W2 (Engineering Complete):**  
   - Established end-to-end in-memory Deflate archive decompression (`ArchiveExtractor`).  
   - Validated official 19-column SEBI/NSE CM-UDiFF Common Bhavcopy Final schema conformance.  
   - Verified strict equity eligibility filtering (`EQ`, `BE`, `BZ`, `SM`) and exclusion of debt/derivatives.  
   - Confirmed deterministic normalization, fail-closed quarantine controls, and canonical store delivery.  
   - Confirmed 100% regression floor across P13 (86/86), Layer-1 Dhan, and Layer-2 test suites.

2. **D104 (Readiness Assessment):**  
   - Verified that the committed Layer-2 architecture already contains native, explicit operator-drop semantics.  
   - Confirmed that zero code changes, zero schema migrations, and zero database additions are required.

3. **D103-WINDOWS-PROBE (Real Exchange Data Verification):**  
   - Verified execution on the Windows verification checkout against two real NSE CM-UDiFF archives:
     - `BhavCopy_NSE_CM_0_0_0_20260911_F_0000.csv.zip` (SHA-256: `C34AF0E74A9C21AAD106DFCB31F03685D4BAAA24AF09DA2245B6D007527B43FE`)
     - `BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv.zip` (SHA-256: `1838E677DC64454862D7AEF4E802A624D964796446E7ED474F562A04167078CA`)
   - **Verification Results:**
     - 2 of 2 sessions succeeded (0 sessions failed).
     - **6,588 canonical equity EOD records accepted**.
     - 0 quarantine rejections from the clean exchange set.
     - 100% duplicate suppression on replay (zero record inflation).
     - Source archive SHA-256 checksums verified bit-for-bit unchanged after pipeline execution.
     - Zero source data committed to Git.

---

## 2. Formal Adjudication Decision

### **DECISION: AUTHORIZE OPERATOR_DROP**

The Program Authority hereby **AUTHORIZES** the existing directory:
```
.iips-data/bhavcopy/
```
as the governed Layer-2 operator ingestion channel for daily NSE CM-UDiFF EOD market data.

---

## 3. Scope & Boundary of Authorization

### A. Permitted Under this Authorization
1. **Operator Drop:** Placement by an authorized operator of appropriately obtained NSE CM-UDiFF EOD files (`.csv` or `.csv.zip`) into `.iips-data/bhavcopy/`.
2. **D103 Pipeline Processing:** Automated consumption by the existing `NseSftpAcquisitionAdapter` and `EodIngestionPipeline`.
3. **Quality & Quarantine Controls:** Enforcement of existing CM equity series filters, numeric sanity checks, and OHLC integrity rules.
4. **Provenance Labeling:** Strict recording of `[OFFLINE_LOCAL]` or `[OFFLINE_LOCAL_ZIP]` in all ingested canonical records.
5. **Idempotent Ingestion:** Execution of routine daily or catch-up sweeps without duplicate state generation.
6. **Routine Operations:** Standard operational usage of the operator-drop path for day-to-day EOD refresh.

### B. Strictly Excluded & Prohibited
1. **Scraping / Harvesting:** Automated web scraping, crawling, or non-browser harvesting of public NSE web pages or archive URLs.
2. **Undocumented Endpoints:** Interaction with undocumented or deprecated exchange endpoints.
3. **Provider Substitution:** Using Dhan or yfinance as an unapproved surrogate for official exchange EOD records.
4. **Redistribution:** Commercial redistribution or external syndication of NSE market data.
5. **Entitlement Claims:** Claiming that operator-drop operationalization constitutes commercial NSE Data & Analytics licensing.
6. **Live SFTP Activation:** Automated production connection to port 7010 prior to formal credential provisioning.
7. **Premature 10-Year Ingestion:** Fabricating or scraping 10-year historical data without authorized source files.
8. **Infrastructure Additions:** Introducing new database stacks or persistence layers outside the governed `.iips-data` store.

---

## 4. Open Commercial Tracks & 10-Year Backfill Status

### A. Commercial NSE SFTP Track (Port 7010)
The commercial active-active SFTP track remains **EXTERNALLY GATED** and tracked as open items in the program governance registers:
- `OI-P16-01`: Cash Market EOD Feed Agreement with NSE Data & Analytics Limited.
- `OI-P16-02`: Permitted enterprise retention and analytical use determination.
- `OI-P16-03`: Formal assignment of exchange SFTP User ID.
- `OI-P16-04`: Static public egress IP allowlisting on NSE perimeter firewalls.
- `OI-P16-05`: SSH key pair binding and mutual authentication testing.
- `OI-P16-06`: Port 7010 active-active connectivity validation (`eodsftp1`/`eodsftp2`).

### B. 10-Year Historical Population
- **Capability:** **READY** (Trading calendar, CM-UDiFF parser, normalizer, and store are certified for multi-year historical ingestion).
- **Data Status:** **PENDING AUTHORIZED DATA ACCESS** (No speculative or fabricated history will be populated).

---

## 5. Next Executable Action

**NEXT PROGRAM ACTION: D106**  
- **Title:** `D106 — OPERATOR-DROP OPERATIONAL RUNBOOK & WORKFLOW INTEGRATION`  
- **Objective:** Document standard operating procedures (SOP), validation scripts, and automated directory monitoring guidelines for operator-supplied CM-UDiFF files in `.iips-data/bhavcopy/`.
