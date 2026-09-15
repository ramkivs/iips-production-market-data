# IIPS R-2 — UI End-to-End Acceptance Test Report (Reference Adapter)

## Executive Summary

- **Objective:** Controlled UI acceptance verification of the completed R-2 provider-neutral market data architecture using the existing deterministic `ReferenceFileBasedAdapter` and synthetic CM-UDiFF fixtures.
- **R-2 Architecture Status:** **FROZEN / UNCHANGED / FULLY COMPLIANT**
- **Test Chain Verified:**
  `Reference CM-UDiFF Fixture -> Parser -> NSE-Equity Eligibility Filter -> Normalization/QC -> Canonical Market-Data Contract -> Current-State Store -> Scheduler/Refresh -> Market-Data HTTP API -> Existing UI -> MarketDataFreshnessBadge`
- **Running Application URL:** Local `http://localhost:5173` (Vite SPA) proxied to `http://localhost:8787` (Executive Transport). Live Preview at `https://5173-ij0jy7e0vdb45p2nubq3j.e2b.app`.

---

## Controlled Acceptance Test Results Matrix

| Test | Title | Status | Classification | Key Observations |
|---|---|---|---|---|
| **TEST 1** | **Current State** | **PASS** | Reference-data UI validation | Ingests synthetic CM-UDiFF fixture; non-equities excluded; canonical quotes populated; UI renders `NSE CURRENT` with last refresh timestamp; zero production credentials needed. |
| **TEST 2** | **Stale State** | **PASS** | Reference-data UI validation | Exceeded 30-min threshold (45m elapsed); UI transitions to `NSE STALE`; preserves last refresh time without fabricating current timestamps. |
| **TEST 3** | **Unavailable / Production Gate** | **PASS** | Production NSE validation | `NseProductionAcquisitionAdapter` invoked unentitled (`isEntitled=false`); zero external network calls; fail-closed; UI renders `NSE UNAVAILABLE` with `GATE ACTIVE` warning tag. |
| **TEST 4** | **EOD / Bhavcopy Flow** | **PASS** | Reference-data UI validation | Parses mixed CM-UDiFF file (7 rows); filters out bond `718GS2033` and future `RELIANCE26SEPFUT` (2 rejected); quarantines 4 anomalous rows; stores valid `RELIANCE`; repeat ingestion is 100% idempotent (0 duplicates inserted). |
| **TEST 5** | **Refresh Behavior** | **PASS** | Reference-data UI validation | Scheduler executes refresh cycles; in-memory quotes update; failed attempts trigger 3 retries with backoff; verified that zero 15-minute snapshots are persisted to disk. |
| **TEST 6** | **10-Year Backfill Capability** | **PASS** | Reference-data UI validation | Configurable date ranges (~2500 sessions); incremental backfill and resumption verified; synthetic reference fixtures clearly labelled; 0 claims of official historical data. |
| **TEST 7** | **Security / Production Boundary** | **PASS** | Production NSE validation | Zero secrets/API keys hardcoded; production adapter strictly gated; reference adapter restricted to dev/test. |

---

## Forensic Evidence & Verification

### 1. Representative Canonical Equity Data Visible in UI / Store
Ingestion of `SYNTHETIC_VALID_BHAVCOPY_2026_09_14`:
- **RELIANCE (`INE002A01018`, Series `EQ`)**:
  - `open`: 2950.00
  - `high`: 2985.50
  - `low`: 2940.00
  - `close`: 2972.25
  - `lastPrice`: 2970.00
  - `previousClose`: 2945.00
  - `volume`: 4,521,000
  - `tradedValue`: 13,420,000,000
  - `quality`: `'good'`
- **Non-Equity Exclusion Verified**:
  - `718GS2033` (Govt Bond, `FinInstrmTp='DBT'`): Rejected by `isEligibleEquity()`.
  - `RELIANCE26SEPFUT` (Derivatives, `Sgmt='FO'`): Rejected by `isEligibleEquity()`.

### 2. UI Freshness Badge Evidence
- **State 1 (`CURRENT`)**:
  - Rendered: `<div data-testid="market-data-freshness-badge">`
  - Text: `NSE CURRENT (10:00:00 AM)`
  - Indicator: Green dot (`#10b981`)
  - Title: `Source: National Stock Exchange of India (Capital Market) | Refresh: ~15m | Status: PROVISIONED`
- **State 2 (`STALE`)**:
  - Text: `NSE STALE (9:15:00 AM)`
  - Indicator: Amber dot (`#f59e0b`)
  - Guarantee: No fabricated current timestamp; last successful refresh timestamp accurately preserved.
- **State 3 (`UNAVAILABLE / GATE ACTIVE`)**:
  - Text: `NSE UNAVAILABLE (NO REFRESH)`
  - Indicator: Red dot (`#ef4444`)
  - Badge: `<span data-testid="market-data-gate-indicator">GATE ACTIVE</span>`
  - Tooltip: `Production NSE credentials and licensing agreement not provisioned (OI-P04-04 gate active).`

### 3. API Response Evidence (`/api/market-data/status`)
```json
{
  "isLiveProvisioned": false,
  "provider": "NSE (National Stock Exchange of India)",
  "refreshCadenceMinutes": 15,
  "lastSuccessfulRefresh": null,
  "lastAttemptTimestamp": null,
  "freshness": "UNAVAILABLE",
  "currentRecordCount": 0,
  "historicalDayCount": 0,
  "historicalRange": { "earliestDate": null, "latestDate": null },
  "activeLicensingGate": {
    "state": "EXTERNALLY_BLOCKED",
    "reason": "Production NSE acquisition mechanism remains behind an explicit licensing, credentials, and data entitlement gate.",
    "providerSelection": "NSE (Capital Market Equities)",
    "requiredEntitlements": [
      "NSE CM-UDiFF Common Bhavcopy Final distribution entitlement",
      "NSE 15-minute delayed market data licensing agreement",
      "Production access credentials (API/SFTP)"
    ]
  }
}
```

### 4. Non-Persistence of 15-Minute Snapshots
- Verified that `CurrentStateScheduler.executeRefresh()` updates `currentState: Map<string, CanonicalCurrentStateRecord>` in memory only.
- The disk journal and historical EOD stores remain zero-growth during 15-minute refreshes (satisfying Requirements 9 & 30).

### 5. Automated Regression Test Floor Compliance
- **R-2 UI Acceptance Suite (`src/test/r2-ui-acceptance.test.tsx`):** **7/7 passed**
- **Market Data Parser & Pipeline Suites:** **18/18 passed**
- **Full Vitest Regression Suite:** **1,110 passed / 0 failed** across 75 test files (floor >= 1,056 passed).
- **P12 Gateway Gate Suite:** **154 passed / 0 failed**
- **P13 Integration Gate Suite:** **86 passed / 0 failed**
- **TypeScript Typechecks:** **0 errors** across frontend and server.

---

## Final Classification

All 7 R-2 UI End-to-End Acceptance Tests **PASS**. The complete provider-neutral R-2 flow is demonstrably functional in the running UI while the production NSE boundary remains securely and visibly gated.
