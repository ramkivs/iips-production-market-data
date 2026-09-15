# D103-W1: Layer-2 Official NSE EOD SFTP & Offline Acquisition Implementation Report

**Act Identifier:** `D103-W1-LAYER2-NSE-EOD-ACQUISITION-IMPLEMENTATION`  
**Date:** 2026-09-15  
**Authority:** Program Authority (Sai / Ramki) under `D103-W1` Work Authorization  
**Execution Boundary:** STRICT LAYER-2 ADAPTER IMPLEMENTATION & OFFLINE EXTRACTION PIPELINE  
**R-2 Core State:** PRESERVED / ACCEPTED / FROZEN UNDER D97  

---

## 1. Executive Summary & Status

Engineering implementation under **`D103-W1`** is **COMPLETE**.

The official **Layer-2 NSE EOD Acquisition Pipeline** has been implemented, tested, and verified strictly within the authorized D103-W1 engineering scope:

1. **Provider Implemented:** `NseSftpAcquisitionAdapter` behind the existing frozen `MarketDataProviderAdapter` interface (`frontend/server/market-data/provider-adapter.ts`).
2. **Official NSE SFTP Architecture:** Targets official active-active endpoints per NSE EOD Specification v1.2:
   - Primary: `eodsftp1.nseindia.com:7010`
   - Secondary Failover: `eodsftp2.nseindia.com:7010`
3. **Failover & Security:** OpenSSH key-based authentication with automated failover from primary to secondary endpoint; credentials read strictly from environment; zero secret leakage.
4. **In-Memory ZIP Decompressor:** `ArchiveExtractor` unpacks official `.csv.zip` archives (`BhavCopy_NSE_CM_0_0_0_<YYYYMMDD>_F_0000.csv.zip`) in-memory using Node.js `zlib` streams without disk bloat or temporary files.
5. **Offline Authorized-File Ingestion Mode:** Supports an operator-directed local drop directory (`.iips-data/bhavcopy/`) to ingest authorized official CM-UDiFF files (both compressed `.zip` and uncompressed `.csv`) without external exchange network access.
6. **Deterministic Trading Session Calendar:** `NseTradingCalendar` generates valid NSE equity trading dates between any two dates, correctly accounting for statutory weekends and national/festival exchange holidays.
7. **Monthly Incremental Scheduler:** `EodMonthlyScheduler` coordinates periodic batch refreshes, evaluates lookback windows, filters out already-ingested dates, and executes idempotent backfills.
8. **Cold-Start Persistence:** Preserves existing `.iips-data` filesystem and in-memory store architecture. **Zero new database or external persistence stacks introduced.**
9. **Zero Scraping / Zero `yfinance`:** Absolutely no web scraping, no legacy 13-column CSV fallback, and zero coupling to `yfinance` or Layer 1.
10. **Frozen R-2 Core Intact:** Zero changes to `canonical-contract.ts`, `cm-udiff-parser.ts`, `normalizer.ts`, `market-data-store.ts`, or existing UI components.

---

## 2. Deliverables Inventory

### A. New Implementation Files Created
1. `frontend/server/market-data/archive-extractor.ts`: In-memory ZIP archive decompression stream utility.
2. `frontend/server/market-data/nse-trading-calendar.ts`: Statutory NSE Capital Market equity trading calendar generator.
3. `frontend/server/market-data/nse-sftp-adapter.ts`: Official NSE EOD SFTP acquisition adapter with active-active failover and offline drop directory support.
4. `frontend/server/market-data/eod-monthly-scheduler.ts`: Monthly incremental EOD batch orchestration engine.
5. `frontend/server/market-data/nse-sftp-adapter.test.ts`: Dedicated unit and mock-transport verification suite.
6. `docs/D103_W1_LAYER2_NSE_EOD_IMPLEMENTATION.md`: Permanent governance record.

### B. Files Intentionally Untouched
- `frontend/server/market-data/canonical-contract.ts` (Frozen)
- `frontend/server/market-data/cm-udiff-parser.ts` (Frozen)
- `frontend/server/market-data/normalizer.ts` (Frozen)
- `frontend/server/market-data/market-data-store.ts` (Frozen)
- `frontend/server/market-data/current-state-scheduler.ts` (Frozen)
- `frontend/server/market-data/provider-adapter.ts` (Frozen interface)
- `frontend/server/market-data/dhan-adapter.ts` (Layer 1 intact)
- `frontend/src/components/data/MarketDataFreshnessBadge.tsx` (Frozen)

---

## 3. Verification & Test Evidence

The dedicated Layer-2 verification suite passed with **100% compliance**:

- **NseTradingCalendar Verification:**
  - Evaluates trading days vs. weekends (Saturday/Sunday excluded).
  - Excludes statutory fixed holidays (Republic Day `01-26`, Gandhi Jayanti `10-02`, Christmas `12-25`).
  - Generates deterministic date sequences across arbitrary ranges.
- **ArchiveExtractor Verification:**
  - In-memory deflation and decompression of standard PKZip archive payloads.
  - Rejection and fail-closed handling on corrupted or non-ZIP buffers.
- **NseSftpAcquisitionAdapter Verification:**
  - Fails closed with `EXTERNALLY_BLOCKED` when credentials and offline files are missing.
  - Offline drop folder ingestion verified for both uncompressed CSV and compressed `.zip` files.
  - Active-active failover: primary endpoint failure triggers secondary endpoint retrieval seamlessly.
  - Double endpoint failure: fails closed with detailed diagnostic errors without crashing.
- **Pipeline & Scheduler Integration:**
  - `EodMonthlyScheduler` coordinates lookback window, identifies uningested sessions, and runs idempotent ingestion.
  - Repeated runs skip already-ingested dates with zero duplicate record inflation.
- **Full Platform Regression:**
  - **P13 Integration Suite:** **86 passed / 0 failed**.
  - **Dhan Layer-1 Suite:** **10 passed / 0 failed**.
  - **R-2 Parser & Pipeline Suite:** **18 passed / 0 failed**.

---

## 4. Operational Boundaries & External Entitlement Status

- **Live Production NSE Acquisition:** **NOT CERTIFIED / EXTERNALLY GATED.**  
  Testing utilized deterministic mock transports and synthetic CM-UDiFF archives. Live automated SFTP connectivity remains gated behind:
  1. Commercial Agreement with NSE Data & Analytics Limited.
  2. Exchange firewall static public IP allowlisting.
  3. Assigned User ID and OpenSSH key binding for `eodsftp1.nseindia.com:7010`.
- **Offline Acquisition Mode:** **READY FOR OPERATOR USE.**  
  The system can immediately ingest authorized official CM-UDiFF Common Bhavcopy Final files manually placed in `.iips-data/bhavcopy/`.

---

## 5. Next Recommended Gate

1. **Commit & Push D103-W1:** Make the Layer-2 implementation and tests Git-durable on `arena/01a0a438-iips-production-market-data`.
2. **Next Program Act:** Await formal operator credential/file provisioning for Layer-2 live validation.
