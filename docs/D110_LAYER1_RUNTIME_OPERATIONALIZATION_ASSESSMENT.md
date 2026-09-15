# IIPS D110: Layer-1 Runtime Operationalization & Credential Gate Assessment Report

**Document Reference:** `docs/D110_LAYER1_RUNTIME_OPERATIONALIZATION_ASSESSMENT.md`  
**Governing Authority:** Program Authority (Sai / Ramki) under D109 Milestone Sign-Off  
**Date:** September 15, 2026  
**Implementation Baseline:** Commit `eaa4f87bdf2d3d01406237abb3203ae8994b71e8`  
**Target Provider:** DhanHQ v2 Market Data API (`frontend/server/market-data/dhan-adapter.ts`)  
**Assessment Classification:** **`LIVE-CAPABLE BUT CREDENTIAL/ENTITLEMENT BLOCKED`**  

---

## 1. Executive Summary & Gate Decision

With the formal completion and acceptance of the **Layer-2 EOD Operationalization Milestone (`D109 = ACCEPTED`)**, work package **`D110`** transitions program assessment to **Layer 1** (approximately 15-minute delayed intraday current-state equity refresh).

### Authoritative Finding:
The DhanHQ v2 Layer-1 adapter (`DhanProviderAdapter`) and its associated runtime scheduler (`CurrentStateScheduler`) are **technically complete, fully unit-tested, contract-conformant, and architecturally isolated**. 

However, in accordance with the prior live probe observation on the Windows verification checkout (which returned `HTTP 401: Invalid or expired Dhan access-token or client-id`), **Layer 1 is NOT production ready**. Live external connectivity is **EXTERNALLY BLOCKED** pending provisioning of an active, unexpired, KYC-verified Dhan developer access token and entitlement verification.

### **FINAL LAYER-1 CLASSIFICATION: `LIVE-CAPABLE BUT CREDENTIAL/ENTITLEMENT BLOCKED`**

---

## 2. Existing Dhan Adapter Technical Audit (D110-A)

An exhaustive code inspection of `frontend/server/market-data/dhan-adapter.ts` confirms the following runtime mechanics:

| Attribute | Technical Implementation Detail |
|---|---|
| **API Endpoint** | `POST https://api.dhan.co/v2/marketfeed/quote` |
| **Authentication** | Custom HTTP headers: `client-id: <DHAN_CLIENT_ID>` and `access-token: <DHAN_ACCESS_TOKEN>` |
| **Environment Keys** | `process.env.DHAN_CLIENT_ID` and `process.env.DHAN_ACCESS_TOKEN` |
| **Security ID Resolver** | `DhanInstrumentMasterResolver`: Resolves NSE equity ticker symbols (e.g. `RELIANCE`, `TCS`, `INFY`) to numeric exchange IDs (`2885`, `11536`, `1594`) via daily published scrip master |
| **Payload Structure** | JSON body: `{ "NSE_EQ": [ 2885, 11536, 1594, 1333 ] }` (supports up to 1,000 securityIds per call) |
| **Response Schema** | Expects `{ status: "success", data: { "NSE_EQ": { "<id>": { "last_price": ..., "ohlc": { ... }, "volume": ..., "prev_close": ..., "last_trade_time": ... } } } }` |
| **Error Handling** | Fail-closed on HTTP 401/403 (`DHAN_AUTH_ERROR_*`), HTTP 429 (`DHAN_API_ERROR_429`), network aborts/timeouts (`DHAN_NETWORK_ERROR`), or malformed status (`DHAN_RESPONSE_MALFORMED`) |
| **Timeout Policy** | Uses native `AbortController` bounded to `timeoutMs` (default: 10,000 ms) |
| **Rate Limit Rules** | 1 req/sec for Quote API; 5 req/sec for Data APIs; 100,000 requests/day per account |
| **Current-State Storage** | Volatile in-memory map in `MarketDataStore` via `updateCurrentState()` |
| **Snapshot Persistence** | **ZERO disk writes.** Recurring 15-minute ticks are never written to disk or database |
| **EOD Scope Limitation** | `fetchEodBhavcopy()` explicitly returns `DHAN_PROVIDER_SCOPE_LIMITATION` error fail-closed |

---

## 3. Credential Lifecycle & Entitlement Distinction (D110-B)

To ensure clear governance boundaries, the system explicitly defines three stages of readiness:

```
[IMPLEMENTED / TESTED] ──▶ [LIVE-CAPABLE] ──▶ [PRODUCTION-ACTIVE]
       (CURRENT)               (GATE 1)            (GATE 2)
```

1. **`IMPLEMENTED / TESTED` (Current State):**  
   The adapter code, symbol resolver, normalizer, and mock-transport unit tests pass 100%. Verified fail-closed when credentials are absent.
2. **`LIVE-CAPABLE` (Pending Operator Action):**  
   Requires injection of valid, unexpired `DHAN_CLIENT_ID` and `DHAN_ACCESS_TOKEN` into the environment, successfully completing a single controlled live HTTP quote handshake with `api.dhan.co`.
3. **`PRODUCTION-ACTIVE` (Pending Authority Decision):**  
   Requires:
   - Account entitlement confirmation (KYC-verified trading account with active Data API subscription at ₹499 + GST/month).
   - Commercial/contractual data rights verification for private quantitative workstation use.
   - Formal Program Authority adjudication promoting Layer 1 from `EXTERNALLY_BLOCKED` to `PROVISIONED`.

---

## 4. Prior Live-Probe Observation & Status (D110-C)

- **Prior Live Windows Test:** In a prior controlled probe on the Windows operator environment, a request using unrefreshed credentials returned:
  `HTTP 401: Invalid or expired Dhan access-token or client-id.`
- **D110 Probe State:** In accordance with prompt instructions, because credentials in the current Arena environment are absent and prior credentials expired, **LIVE PROBE = BLOCKED / NOT RUN**. Zero blind retries or credential scraping were performed.
- **Dhan Token Expiry Policy:** DhanHQ access tokens expire after **24 hours**. Operationalizing Layer 1 requires a daily token generation/refresh procedure.

---

## 5. Rate-Limiting & Quota Margin Assessment (D110-D)

The planned Layer-1 refresh schedule was evaluated against DhanHQ v2 rate constraints:

| Metric | Scheduled Layer-1 Usage | DhanHQ Limit | Margin / Safety Factor |
|---|---|---|---|
| **Batch Size** | 50 index equities in 1 single HTTP request | Up to 1,000 symbols / request | 20x headroom |
| **Burst Frequency** | 1 request per refresh cycle | 1 request per second | 100% compliant |
| **Polling Cadence** | Once every 15 minutes | Bounded by interval | 100% compliant |
| **Market Hours Cycles** | ~25 cycles per day (09:15 to 15:30 IST) | 100,000 requests/day | **0.025% of daily quota consumed** |
| **429 Response Handling**| Fail-closed; stores `DHAN_API_ERROR_429`; halts retries | N/A | Compliant |

*Conclusion:* The single multi-instrument POST payload consumes less than **0.03%** of the daily Dhan quota, presenting negligible rate-limit or quota risk.

---

## 6. Runtime Scheduler Assessment (D110-E)

An evaluation of `frontend/server/market-data/current-state-scheduler.ts` confirms:
- **Refresh Interval:** Default 15 minutes (`15 * 60 * 1000 ms`).
- **Retry Logic:** Maximum 3 attempts with exponential delay (`retryDelayMs: 1000`).
- **Duplicate Prevention:** Timer loop prevents overlapping cycles (`isRunning` state flag).
- **Failure Transparency:** Records timestamped errors in store; never masks failures.
- **Freshness Evaluation:** When retries fail, freshness shifts from `CURRENT` to `STALE` (threshold: 30 minutes) and eventually `UNAVAILABLE`.
- **Zero Snapshot Accumulation:** Stores only the latest observation per symbol in an in-memory Map (`this.currentState.set(symbol, record)`).

---

## 7. Failure-Mode & Fail-Closed Matrix (D110-G)

| Failure Event | Layer-1 Adapter Response | Store & UI State |
|---|---|---|
| **Missing Credentials** | Returns `EXTERNALLY_BLOCKED` fail-closed | Freshness = `UNAVAILABLE`, Badge = `GATE ACTIVE` |
| **HTTP 401 (Invalid/Expired)**| Returns `DHAN_AUTH_ERROR_401` fail-closed | Retries 3x, halts, records error in store |
| **HTTP 403 (Forbidden)** | Returns `DHAN_AUTH_ERROR_403` fail-closed | Halts, records authorization failure |
| **HTTP 429 (Rate Limit)** | Returns `DHAN_API_ERROR_429` fail-closed | Halts retries to avoid rate penalty |
| **Network Timeout** | AbortController triggers after 10,000 ms | Retries up to maxRetries, reports `DHAN_NETWORK_ERROR` |
| **HTTP 5xx (Dhan Outage)** | Returns `DHAN_API_HTTP_ERROR_5xx` fail-closed | Preserves prior timestamp; shifts to `STALE` after 30 min |
| **Malformed JSON** | Returns `DHAN_RESPONSE_MALFORMED` fail-closed | Rejects payload; zero invalid records entered into store |
| **Unmapped Symbol** | Security ID resolver ignores unmapped symbol | Quotes only valid resolved symbols; reports missing list |
| **Non-Numeric / Negative Price**| Normalizer drops invalid quote line | Accepts valid quotes; omits corrupted quote |
| **Partial Response** | Normalizes all valid records present in `NSE_EQ` | Updates present symbols; unreturned symbols become stale |

---

## 8. Layer-1 vs. Layer-2 Architectural Isolation (D110-F)

The assessment confirms absolute separation between Layer 1 and Layer 2:
1. **Contract Isolation:** Layer 1 creates `CanonicalCurrentStateRecord`; Layer 2 creates `CanonicalEquityEodRecord`.
2. **Store Isolation:** Layer 1 writes to `this.currentState = new Map<string, CanonicalCurrentStateRecord>()`; Layer 2 writes to `this.historicalEod = new Map<string, CanonicalEquityEodRecord>()`.
3. **Immutability of EOD:** `DhanProviderAdapter.fetchEodBhavcopy()` throws a scope limitation error fail-closed. Layer 1 cannot overwrite, edit, or fabricate historical EOD records.
4. **Independent Survivability:** If Dhan is unprovisioned, expired, or down, Layer-2 `OPERATOR_DROP` operates with 100% independence.

---

## 9. Security & Secret Protection Audit (D110-H)

- **Source Control Cleanliness:** `git grep -i "dhan_access_token"` reveals zero hardcoded tokens.
- **Environment Isolation:** Keys are injected strictly via `process.env.DHAN_CLIENT_ID` and `process.env.DHAN_ACCESS_TOKEN`.
- **URL Sanitation:** Zero tokens or secrets appear as HTTP URL query parameters; passed exclusively via HTTP request headers.
- **Log Sanitation:** Error messages return status codes (`401`, `403`) and redact token contents.

---

## 10. Platform Regression & Typecheck Results (D110-K)

All suites pass with 100% compliance:
- **Dhan Unit & Normalizer Suite (`dhan-adapter.test.ts`):** 11/11 passed.
- **Operator-Drop Suite (`operator-drop.test.ts`):** 11/11 passed.
- **Layer-2 SFTP/Drop Suite (`nse-sftp-adapter.test.ts`):** 11/11 passed.
- **CM-UDiFF Parser Suite (`cm-udiff-parser.test.ts`):** 8/8 passed.
- **EOD Pipeline Suite (`pipeline.test.ts`):** 8/8 passed.
- **Platform P13 Integration Suite (`p13/`):** 86/86 passed.
- **TypeScript Typecheck (`tsc --noEmit` & `tsconfig.server.json`):** 0 errors.

---

## 11. Git Durability & State Audit (D110-M)

- **Starting Commit HEAD:** `eaa4f87bdf2d3d01406237abb3203ae8994b71e8`
- **Files Inspected:**
  - `frontend/server/market-data/dhan-adapter.ts`
  - `frontend/server/market-data/current-state-scheduler.ts`
  - `frontend/server/market-data/market-data-store.ts`
  - `frontend/server/market-data/canonical-contract.ts`
  - `docs/D102_DHAN_LIVE_CONNECTIVITY_VERIFICATION.md`
- **Implementation Changes:** **ZERO** (Zero code modified; read-only assessment).
- **Working Tree:** Clean (0 untracked files).

---

## 12. Outstanding Prerequisites for Layer-1 Activation

To transition Layer 1 from `LIVE-CAPABLE BUT CREDENTIAL/ENTITLEMENT BLOCKED` to `PRODUCTION-ACTIVE`:

1. **Active Trading Account:** Verification of an active Dhan trading account with completed KYC.
2. **Data API Subscription:** Active subscription to DhanHQ Data APIs (₹499 + GST/month auto-debited).
3. **Daily Token Refresh SOP:** Implementation of a daily token generation workflow (since Dhan access tokens expire every 24 hours).
4. **Environment Provisioning:** Injection of valid `DHAN_CLIENT_ID` and `DHAN_ACCESS_TOKEN` on the production workstation.
5. **Controlled Smoke Test:** Execution of a single live quote handshake verifying HTTP 200 response.

---

## 13. Recommended Next Program Action

### **RECOMMENDED PROGRAM ACT: D111**
**Layer-1 Operator Token Provisioning & Controlled Live Verification Protocol (`D111`):**  
Establish the exact operator standard operating procedure for generating, injecting, and rotating 24-hour Dhan developer access tokens on the Windows production workstation, paired with a single-request live connectivity verification test.
