# D101-W1: DhanHQ v2 Market Data Provider Implementation Report

**Act Identifier:** `D101-W1-DHAN-PROVIDER-IMPLEMENTATION`  
**Date:** 2026-09-15  
**Authority:** Program Authority (Sai / Ramki) under `D101-W1` Engineering Work Authorization  
**Execution Boundary:** STRICT ADAPTER IMPLEMENTATION BEHIND FROZEN `MarketDataProviderAdapter`  
**R-2 Core State:** PRESERVED / ACCEPTED / FROZEN UNDER D97  

---

## 1. Implementation Scope & Background

In accordance with Program Authority Adjudication **`D101`** and its authorized work item **`D101-W1`**, this engineering deliverable implements **Candidate 2: Dhan Data API (`OI-P16-06`)** as the primary provider adapter for IIPS Layer-1 approximately 15-minute delayed current-state market data.

The implementation strictly satisfies all D101-W1 engineering constraints:
1. **Interface Boundary:** Implements the existing frozen `MarketDataProviderAdapter` interface (`frontend/server/market-data/provider-adapter.ts`).
2. **Current-State Market Quote Ingestion:** Consumes DhanHQ v2 Market Quote REST endpoints (`POST /marketfeed/quote` or `/marketfeed/ohlc`) for the `NSE_EQ` exchange segment.
3. **Deterministic Instrument Master Resolver:** Implements `DhanInstrumentMasterResolver` to deterministically map NSE equity symbol strings (e.g., `TCS`, `INFY`, `RELIANCE`, `HDFCBANK`) to Dhan integer `securityId`s (e.g., `11536`, `1594`, `2885`, `1333`) using the published Dhan daily scrip master format.
4. **Canonical Normalization:** Losslessly normalizes Dhan quote structures into the existing frozen `CanonicalCurrentStateRecord` contract (`lastPrice`, `open`, `high`, `low`, `close`, `previousClose`, `volume`, `timestamp`, `receivedAt`, `quality: 'good'`).
5. **Fail-Closed Semantics:** Fails closed cleanly on unentitled configurations, HTTP 401 authentication errors, HTTP 429 rate limit throttling, network timeouts, and malformed payloads without manufacturing prices or throwing uncaught exceptions.
6. **Credential Protection:** Credentials are read exclusively from environment variables (`DHAN_CLIENT_ID` and `DHAN_ACCESS_TOKEN`). No hardcoded secrets, no credentials committed to git, and no sensitive tokens printed in output logs.
7. **Current-State Persistence Invariant:** In-memory state tracking only via existing `MarketDataStore`. Zero persistence of 15-minute snapshots.
8. **Strict Exclusion of Trading Endpoints:** Zero order placement, modification, cancellation, trade history, fund, or position endpoints. The adapter is 100% read-only.
9. **Zero Automatic Failover:** Automatic fallback to `yfinance` is strictly prohibited. Provider failure yields a canonical `unavailable` state.
10. **Zero Core Redesign:** Zero modifications to `canonical-contract.ts`, `cm-udiff-parser.ts`, `normalizer.ts`, `market-data-store.ts`, `current-state-scheduler.ts`, `eod-pipeline.ts`, or the UI Freshness Badge.

---

## 2. Implemented Components

### A. Instrument Master Resolver
- **File:** `frontend/server/market-data/dhan-instrument-master.ts`
- **Class:** `DhanInstrumentMasterResolver`
- **Capabilities:**
  - Maintains deterministic bidirectional mappings between NSE symbol strings and Dhan integer security IDs.
  - Ingests and parses Dhan's official scrip master CSV (`SEM_EXM_EXCH_ID`, `SEM_SMST_SECURITY_ID`, `SEM_TRADING_SYMBOL`, `SEM_SERIES`).
  - Pre-seeded with representative NSE Capital Market equities (`TCS`, `INFY`, `RELIANCE`, `HDFCBANK`, `ICICIBANK`, `SBIN`, `BHARTIARTL`, `ITC`, `KOTAKBANK`, `LT`).
  - Unknown symbols return `null` without fuzzy guessing or silent substitution.

### B. Dhan Provider Adapter
- **File:** `frontend/server/market-data/dhan-adapter.ts`
- **Class:** `DhanProviderAdapter` implements `MarketDataProviderAdapter`
- **Capabilities:**
  - `isEntitled`: Evaluates presence of `DHAN_CLIENT_ID` and `DHAN_ACCESS_TOKEN`.
  - `fetchCurrentState(symbols)`:
    - Resolves requested symbols to security IDs via the resolver.
    - Constructs batched payload: `{ "NSE_EQ": [secId1, secId2, ...] }`.
    - Dispatches HTTP POST to `${baseUrl}/marketfeed/quote` with `access-token` and `client-id` headers.
    - Normalizes response into `CanonicalCurrentStateRecord[]`.
    - Handles HTTP 401 (`DHAN_AUTH_ERROR_401`), HTTP 429 (`DHAN_API_ERROR_429`), and network aborts cleanly.
  - `fetchEodBhavcopy(tradeDate)`:
    - Fails closed citing scope limitation: EOD Bhavcopy remains governed by the official Layer-2 NSE CM-UDiFF SFTP architecture.

---

## 3. Verification & Test Evidence

The dedicated test suite (`frontend/server/market-data/dhan-adapter.test.ts`) verifies:
1. **Instrument Master Resolution:** Correct resolution of representative NSE_EQ symbols (`TCS` $\rightarrow$ 11536, `INFY` $\rightarrow$ 1594, etc.).
2. **Missing Symbol Handling:** Unknown symbols return `null` and do not produce fabricated IDs.
3. **Unentitled Fail-Closed:** Missing credentials return `success: false` with `EXTERNALLY_BLOCKED`.
4. **Canonical Normalization:** Lossless mapping of quote packets to canonical contract fields.
5. **OHLC Price Sanity:** Normalized prices match provider payloads exactly.
6. **Authentication Error (HTTP 401):** Fails closed with descriptive error without uncaught exceptions.
7. **Rate Limit Error (HTTP 429):** Fails closed with `DHAN_API_ERROR_429`.
8. **Batch Scaling:** Batches up to 200 instruments within a single HTTP request payload.
9. **Zero Trading Calls:** Verifies that no `/orders`, `/trades`, or `/positions` endpoints are called.
10. **Zero `yfinance` Fallback:** Verifies that Dhan failure does not trigger fallback queries to Yahoo Finance.

---

## 4. Operational Boundaries & Live Activation Status

- **Live Production Activation:** **NOT CERTIFIED / PENDING OPERATOR CREDENTIALS.**  
  Testing utilized deterministic mock/reference HTTP response doubles. No live operator credentials were used or committed.
- **Contractual / Data Rights:** Remains subject to direct operator confirmation under `D101`.
- **Governing Next Step:** Live handshake verification under `D102` upon operator credential provisioning in the local environment.
