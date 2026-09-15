# IIPS D106: Operator-Drop Operational Runbook & Workflow Integration

**Document Reference:** `docs/D106_OPERATOR_DROP_OPERATIONAL_RUNBOOK.md`  
**Governing Authority:** D105 Explicit Authority Adjudication (`docs/D105_PROGRAM_AUTHORITY_ADJUDICATION_OPERATOR_DROP.md`)  
**Commit Baseline:** `df9e41255ee670c55f193cbdd0e87cc3165b3c4f`  
**Governed Operator Ingestion Channel:** `.iips-data/bhavcopy/`  
**Scope:** Operating Procedures, Validation Checklist, Catch-up, Retention, and Runtime Execution  
**Regulatory Notice:** `GOVERNED OPERATIONAL INGESTION ONLY — NOT COMMERCIAL ENTITLEMENT`  

---

## 1. Purpose & Authority

Under **D105**, the Program Authority formally authorized `.iips-data/bhavcopy/` as the primary Layer-2 operator-drop ingestion channel for daily NSE CM-UDiFF EOD market data.

The purpose of this runbook is to define standard operating procedures (SOP), validation controls, multi-day catch-up flows, retention policies, and verification commands for operators placing official NSE CM-UDiFF Common Bhavcopy Final files into the platform.

---

## 2. Operating Directory Layout & Boundaries

```
[Repository Root]
├── .iips-data/                     <-- R-3 governed local data directory (in .gitignore)
│   └── bhavcopy/                   <-- GOVERNED OPERATOR DROP DIRECTORY
│       ├── BhavCopy_NSE_CM_0_0_0_20260911_F_0000.csv.zip
│       └── BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv.zip
└── frontend/
    └── server/
        └── market-data/            <-- Frozen Layer-2 ingestion pipeline components
```

### Windows Host vs. Arena Environment Separation
- **Windows Verification Host (`G:\IIPS-Production-Market-Data-UI-VERIFY\frontend\`):**  
  The operator's live working directory. The physical path `.\.iips-data\bhavcopy\` holds authorized daily `.csv.zip` or `.csv` files provided by the operator.
- **Arena Linux Environment:**  
  Engineering validation and CI/test harness only. Arena **never** accesses the Windows physical filesystem. All tests in Arena use isolated in-memory or volatile temporary scratch directories (`/tmp/...`).

---

## 3. Canonical Daily Operator Workflow (D106-A)

The daily operator workflow executes in 16 explicit stages:

```
[1. Operator Obtains File via Authorized Channel]
                   │
                   ▼
[2. Operator Copies File to .iips-data/bhavcopy/]
                   │
                   ▼
[3. File Discovery by Canonical Pattern: BhavCopy_NSE_CM_0_0_0_<YYYYMMDD>_F_0000.csv(.zip)]
                   │
                   ▼
[4. Trade Date / Filename Consistency Check]
                   │
                   ▼
[5. ZIP Header Validation (Magic 0x04034b50) & In-Memory Decompression]
                   │
                   ▼
[6. CM-UDiFF 19-Column Schema Validation]
                   │
                   ▼
[7. CSV Parsing (cm-udiff-parser.ts)]
                   │
                   ▼
[8. Series Filtering (Retain: EQ, BE, BZ, SM; Ignore: Debt, Derivatives, MF)]
                   │
                   ▼
[9. Numeric Range & OHLC Relationship Validation (normalizer.ts)]
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
[10. Valid Records]    [10. Anomalous Records]
       │                       │
       │                       ▼
       │               [Quarantined Fail-Closed (MarketDataStore.quarantinedRecords)]
       ▼
[11. Ingest Canonical Records into MarketDataStore]
       │
       ▼
[12. Attach Provenance Label: [OFFLINE_LOCAL] or [OFFLINE_LOCAL_ZIP]]
       │
       ▼
[13. Deduplication Check against Existing Keys (${tradeDate}:${symbol})]
       │
       ▼
[14. Expose Observations in History API & Update MarketDataStatus]
       │
       ▼
[15. Source File Remains Bit-for-Bit Untouched (SHA-256 Unchanged)]
       │
       ▼
[16. Routine Operations Complete]
```

---

## 4. File Drop Validation Checklist (D106-B)

Before or immediately upon dropping a file, operators and validation tools evaluate this checklist:

| Check Item | Validation Rule | Action on Failure |
|---|---|---|
| **Filename Pattern** | Must match `BhavCopy_NSE_CM_0_0_0_YYYYMMDD_F_0000.csv.zip` or `.csv` | **REJECT:** Ignored by adapter; not ingested. |
| **Trade Date** | Must be a valid trading session per `NseTradingCalendar` | **FAIL-CLOSED:** Staged only for the specified session date. |
| **ZIP Integrity** | Magic signature `0x04034b50`; valid Deflate stream | **FAIL-CLOSED:** Throws `ARCHIVE_EXTRACTOR_ERROR`; stops processing. |
| **Header Schema** | Exactly 19 comma-separated columns matching SEBI/NSE CM-UDiFF | **FAIL-CLOSED:** Header mismatch flags line-level parse errors. |
| **Segment** | `Sgmt` column must equal `CM` (Capital Market) | **FILTER:** Non-CM segments discarded. |
| **Series** | `SctySrs` must be in `['EQ', 'BE', 'BZ', 'SM']` | **FILTER:** Corporate bonds, government debt, and futures excluded. |
| **OHLC Sanity** | `High >= Low`, `High >= Open`, `High >= Close`, `Low <= Open`, `Low <= Close` | **QUARANTINE:** Flagged with `OHLC_VIOLATION`; isolated in store. |
| **Numeric Validity** | Prices > 0, Volume >= 0, non-NaN, non-infinite | **QUARANTINE:** Flagged with `NUMERIC_PARSE_ERROR`. |
| **Replay Check** | Compare incoming bar against existing `${tradeDate}:${symbol}` bar | **IDEMPOTENT:** Identical bars counted as duplicates; conflicting bars quarantined. |
| **Source Hash** | Checksum verification before and after pipeline run | **IMMUTABLE:** Pipeline must leave source file completely unmodified. |

**OPERATOR ACTION ON FAILURE:**  
If any archive fails extraction or produces quarantine errors:
1. Do not edit the archive or attempt partial manual CSV manipulation.
2. Confirm the source file was downloaded completely without network truncation.
3. Verify the file SHA-256 against exchange manifests where available.
4. Replace the drop file with a clean copy and re-run ingestion.

---

## 5. Multi-Date / Catch-Up Procedures (D106-C)

### Scenario A: One Missed Trading Day
- **Action:** Place the missed day's `BhavCopy_NSE_CM_0_0_0_<YYYYMMDD>_F_0000.csv.zip` into `.iips-data/bhavcopy/`.
- **Pipeline:** Invoke `pipeline.executeBackfill([tradeDate])`.
- **Outcome:** The single date is ingested into `MarketDataStore` without affecting other dates.

### Scenario B: Consecutive Missed Trading Days
- **Action:** Drop all missed archive files into `.iips-data/bhavcopy/`.
- **Pipeline:** Invoke `pipeline.executeBackfill(targetDates)` or execute `scheduler.executeMonthlyBatch()`.
- **Outcome:** Pipeline iterates across all requested trading dates sequentially. Already-ingested dates are automatically skipped; newly dropped dates are ingested.

### Scenario C: Duplicate Delivery (Accidental Re-Drop)
- **Action:** No operator intervention needed.
- **Pipeline:** `MarketDataStore.ingestEodRecords()` compares incoming OHLCV against existing keys.
- **Outcome:** Identical records increment `duplicateCount` with **zero duplicate inflation**. Distinct dates and observation arrays remain clean.

### Scenario D: Corrected / Reissued Exchange File
- **Behavior:** If the exchange reissues a bhavcopy with revised closing prices:
- **Pipeline:** Re-ingestion identifies conflicting OHLC values for existing `${tradeDate}:${symbol}` keys.
- **Outcome:** Conflicting records are quarantined under rule `RECONCILIATION_CONFLICT` (`Contradictory duplicate EOD record... Existing close: X, incoming close: Y`). Prevents silent overwriting of certified historical records.

### Scenario E: Non-Trading Day (Weekend or Holiday)
- **Action:** The operator should not drop files for holidays.
- **Pipeline:** If requested, `adapter.fetchEodBhavcopy()` reports `EXTERNALLY_BLOCKED: Manual drop file ... not found`.

---

## 6. Retention & Source File Handling Policy (D106-D)

### Operational Guidelines
1. **Source Preservation:** The pipeline opens files with read-only streams. Source `.zip` and `.csv` files remain bit-for-bit immutable.
2. **Retention Policy:**  
   *Notice:* D105 does not establish legal retention terms. Source file retention in `.iips-data/bhavcopy/` is governed strictly by the operator's applicable legal agreements and institutional policies with the National Stock Exchange of India.
3. **Storage Hygiene:**
   - Source archives may remain in `.iips-data/bhavcopy/` to enable rapid disaster-recovery rebuilding of `MarketDataStore`.
   - Never commit `.zip` or `.csv` files to Git. The `.gitignore` line `.iips-data/` enforces this.
   - Never copy raw exchange CSV payloads into logging aggregators or public issue trackers.

---

## 7. Runtime Ingestion Automation & Scheduling (D106-E)

The system provides two operational execution paths for operator-dropped files:

1. **Targeted Operator Ingestion Script (Standard SOP):**  
   Operators execute a dedicated run command (PowerShell / npm run) specifying the dates to ingest.
2. **Incremental Batch Scheduler (`EodMonthlyScheduler`):**  
   Evaluates a configurable lookback window (e.g. 35 days), generates all statutory NSE equity trading days, checks `MarketDataStore.getDistinctTradeDates()`, and automatically ingests any dropped dates not yet present in the store.

*Daemon Policy:* Per standing instructions, an unmonitored background daemon or file-watcher is **not required**. The explicit scheduler/script invocation model provides deterministic, verifiable auditability.

---

## 8. UI & Freshness Status Interpretation (D106-G)

In the UI, operator-drop state is communicated through the TopBar `MarketDataFreshnessBadge`:

- **Live Credential Gate:** Displays `GATE ACTIVE` with tooltip `Status: EXTERNALLY_BLOCKED`. This correctly informs users that automated live SFTP is inactive and data is sourced locally.
- **Freshness State:**
  - `CURRENT` (Green): EOD refresh completed for the latest trading session.
  - `STALE` (Amber): Latest EOD observation is older than 24 hours on a trading day.
  - `UNAVAILABLE` (Red): No EOD observations ingested in the store.
- **Data Provenance Inspector:** In cell-level and table provenance disclosures, records reflect `[OFFLINE_LOCAL_ZIP]` or `[OFFLINE_LOCAL]`, preserving 100% provenance clarity.

---

## 9. Operator Ingestion Execution Command (Windows PowerShell)

To execute ingestion of dropped files from `G:\IIPS-Production-Market-Data-UI-VERIFY\frontend`:

```powershell
# Run the governed operator-drop ingestion probe across available files
npx tsx -e "
import { NseSftpAcquisitionAdapter } from './server/market-data/nse-sftp-adapter.js';
import { EodIngestionPipeline } from './server/market-data/eod-pipeline.js';
import { MarketDataStore } from './server/market-data/market-data-store.js';

async function main() {
  const store = new MarketDataStore();
  const adapter = new NseSftpAcquisitionAdapter();
  const pipeline = new EodIngestionPipeline(store, adapter);
  
  // Replace or extend with the relevant target dates
  const dates = ['2026-09-11', '2026-09-15'];
  const res = await pipeline.executeBackfill(dates);
  console.log('Ingestion Result:', JSON.stringify(res, null, 2));
}
main();
"
```

---

## 10. Important Production & Legal Boundary

> **REGULATORY DISCLOSURE:**  
> The **OPERATOR_DROP** workflow is an authorized **engineering ingestion mechanism** for `.iips-data/bhavcopy/`.  
> It **DOES NOT** confer, imply, or substitute for commercial licensing from **NSE Data & Analytics Limited**.  
> The commercial SFTP track (`OI-P16-01` through `OI-P16-06`) and the 10-year historical dataset population remain **EXTERNALLY GATED & OPEN**.
