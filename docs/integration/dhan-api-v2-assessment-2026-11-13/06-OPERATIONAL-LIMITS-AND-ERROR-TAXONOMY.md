# 7 — Operational Limits and Error Taxonomy

**Purpose:** a single consolidated view of (a) every limit the documents state, (b) every limit
they do **not** state, and (c) the error vocabularies, kept strictly separate by layer.

**Governing constraint:** the user directed that the rate-limit matrix be consolidated and that
**no invented universal limit** be asserted; and that HTTP status, API codes, WebSocket codes and
disconnect codes be kept distinct, with **transport** distinguished from **application**.

---

## 7.1 Layer model — four vocabularies, never merged

```
┌─ TRANSPORT ────────────────────────────────────────────────────────────────┐
│  HTTP status  200 · 401 · 403 · 408 · 429 · 5xx                         │
│  WS transport close · heartbeat timeout · socket-limit exceeded            │
└────────────────────────────────────────────────────────────────────────────┘
┌─ APPLICATION (REST) ───────────────────────────────────────────────────────┐
│  Data API Error      800 · 804–814            (P1 p.5)                     │
│  Trading API Error   DH-901 … DH-910          (P1 p.4–5)                   │
│  Rate-limit body     RL001 / RATE_LIMIT_ERROR (P8 p.1)                    │
└────────────────────────────────────────────────────────────────────────────┘
┌─ FEED PROTOCOL (WebSocket) ───────────────────────────────────────────────┐
│  Feed Request Code   11 · 12 · 15 · 16 · 17 · 18 · 21 · 22 · 23 · 25      │
│  Feed Response Code  1 · 2 · 4 · 5 · 6 · 7 · 8 · 50  (+ 41 · 51)          │
│  Disconnect code     int16 reason — TABLE NOT IN THE SET                  │
└────────────────────────────────────────────────────────────────────────────┘
```

**Rules this document enforces:**

1. A number appearing in one layer **never** implies membership in another. `805` in the Data API
   table (REST, application) and `805` in the live-feed text (WebSocket, transport) are two
   different things that happen to share a numeral (D-8).
2. **No HTTP status is asserted for any vendor application code**, because no document provides
   one (D-9). The one observed status↔code pair is an *empirical* W-06 observation, recorded as
   such and **not** generalised.
3. An **unknown** code in any vocabulary is preserved as unknown. It is never folded into a
   neighbouring code or a generic error.

---

## 7.2 Consolidated rate-limit matrix

### 7.2.1 Limits that **are** documented

| # | API category | Rate | Per-request cap | Daily limit | Citation |
|---|---|---|---|---|---|
| L-1 | Order APIs | 10 req/sec | — | 7,000 | `P8 p.1` |
| L-2 | **Data APIs** | **5 req/sec** | — | **100,000** | `P8 p.1` |
| L-3 | **Market Quote** (`/marketfeed/ltp`, `/ohlc`, `/quote`) | **1 req/sec**, *across all market quote endpoints* | **1,000 instruments** | *(column blank)* | `P8 p.1`; `P4 p.1` |
| L-4 | **Option Chain** | **1 req / 3 sec** per underlying/expiry | 1 scrip | *(column blank)* | `P8 p.1` |
| L-5 | Option Chain — unique-scrip cap | **10 unique scrips / 8 sec** | — | — | `P8 p.1` |
| L-6 | Market Quote — batching guidance | multi-instrument endpoints preferred | — | — | `P8 p.1` (best practice 1) |
| L-7 | WebSocket — live feed sockets | **5 sockets per user** | — | — | `P5 p.1`, `P5 p.7`, `P6 p.7` |
| L-8 | WebSocket — live feed instruments | **5,000 per socket** | — | — | `P5 p.1` |
| L-9 | WebSocket — instruments per message | **100** | — | — | `P5 p.2` |
| L-10 | WebSocket — 20-level depth instruments | **≤ 50 per connection** | — | — | `P6 p.2` |
| L-11 | WebSocket — 200-level depth instruments | **exactly 1 per connection** | — | — | `P6 p.2` |
| L-12 | WebSocket — keepalive | ping every **10 s**; close if no response within **40 s** | — | — | `P5 p.3`, `P6 p.3` |

**L-4/L-5 semantics:** "A request is rejected if **either** the per-request rate **OR** the unique-scrip
cap is exceeded" (`P8 p.1`) — two independent gates, both enforced.

**L-3 semantics:** the 1 req/s cap spans **all three** market-quote endpoints *together*
(`P4 p.1`), i.e. it is a **family** limit, not a per-endpoint limit.

### 7.2.2 Limits that are **NOT** documented

| Family / condition | Status | Consequence |
|---|---|---|
| `/charts/historical`, `/charts/intraday` | **NO LIMIT DOCUMENTED** (`P2` states none; `P8` does not list `/charts/*`) | Must not assert any limit; apply the stricter documented cap and mark `LIMIT_UNDOCUMENTED` |
| `/data/technical`, `/data/companyinfo`, `/data/marketmovers` | **NO LIMIT DOCUMENTED** (`P7` states none) | Same |
| `GET /v2/instrument/{segment}` and the two CSVs | **NO LIMIT DOCUMENTED** (`P9` states none) | Same |
| WebSocket message/data rate (as opposed to connection & instrument counts) | **NO LIMIT DOCUMENTED** | Same |
| Option Chain daily limit | **BLANK COLUMN** in `P8 p.1` — blank, not "unlimited" | Treat as unknown |
| Market Quote daily limit | **BLANK COLUMN** in `P8 p.1` | Treat as unknown |
| Whether Market Quote endpoints are *also* subject to L-2 (5 req/sec, 100,000/day) | **NOT STATED** (D-13) | Apply the stricter (1 req/s) |
| Whether "Data APIs" (L-2) includes the analytics endpoints titled "Data API" (D-15) | **NOT STATED** | Build an explicit per-endpoint table; do not infer from the phrase |
| Whether limits are per token / per client-id / per IP / per account | **NOT STATED** | Assume the strictest plausible scope (per account) |
| Whether the 100,000/day is per category or per endpoint within a category | **NOT STATED** | Assume the strictest |
| `Retry-After` **header** presence | **NOT DOCUMENTED** anywhere | Do not depend on it; treat as optional |
| Backoff guidance | "exponential backoff" (P8 p.1 best practice 3) — no schedule given | Implement exponential backoff with IPD's own schedule |
| Rate limit for the local IPD daemon/loopback surface | n/a — internal | IPD's own concern |

> **Governing statement.** There is **no universal, global or account-wide limit** in the published
> set, and none may be asserted. The set defines **per-category** limits with **unresolved scope**,
> plus **connection/instrument counts** for WebSocket. Any IPD document or code comment asserting
> "the Dhan rate limit is X" is wrong unless it names the category and the endpoint family.

### 7.2.3 IPD's own operating budget vs the documented limits

| Aspect | IPD today | Documented Dhan limit | Alignment |
|---|---|---|---|
| Shape | one shared token bucket, `maxRequests: 60`, `windowMs: 60_000` (`dhan_market_data_service.ts:114`) | per-category limits (`P8 p.1`) | **Not aligned** — no per-category structure |
| Ceiling for the market-quote family | 60/min rolling ⇒ up to **60 quote requests in a burst** | **1 req/sec** (`P8 p.1`, `P4 p.1`) | **Too lax in burst** — a 60-request burst violates the documented cap |
| Ceiling for the data family (`/data/*`) | ≤ 60/min | 5 req/sec = 300/min | **Stricter than needed** |
| Ceiling for `/charts/*` | ≤ 60/min, **shared with quotes** | **undocumented** | Unknowable; and the shared bucket means D02 traffic competes with D01 traffic |
| Concurrency | 8 in flight, queue 1,024 (`:115`) | not documented | IPD-internal; reasonable |
| Caching | 256 entries (`:113`) | "Cache data locally" (best practice 2, `P8 p.1`) | **Aligned** — IPD does what the vendor advises |
| Batching | not applicable (one instrument per request in the current adapter) | "Batch requests — use multi-instrument endpoints" (`P8 p.1`) | **Not implemented** — IPD does not exploit the 1,000-instrument cap |
| Backoff | `observeThrottle` honours `Retry-After`, zeroes the bucket, blocks the window (`dhan_operational_controls.ts:151–152`) — but **no production caller**; its only caller is the test | "exponential backoff" (`P8 p.1`) | **Capability present, not wired** |
| Vendor throttle signal | **never parsed** — no `RL001`/`errorType` reader exists | `RL001` body (`P8 p.1`) | **Missing** |
| `429` handling | mapped to `RATE_LIMITED` (`dhan_api_client.ts:319–321`) | not stated whether Dhan uses `429` | Partial |

**Aggregate finding:** IPD's limiter is a **single global bucket** that is simultaneously **too
permissive** (burst behaviour against the market-quote family) and **too restrictive** (against the
data family), and it **shares one budget across mutually distinct endpoint families**. It also does
not exploit the documented 1,000-instrument batching capability.

---

## 7.3 Error taxonomy — the REST application layer

### 7.3.1 Data API Error codes (`P1 p.5`) — verbatim

| Code | Description | Layer meaning | Remediation class |
|---|---|---|---|
| `800` | Internal Server Error | transient server fault | retry with backoff |
| `804` | Requested number of instruments exceeds limit | caller over-batch | reduce batch size |
| `805` | Too many requests **or connections** — further requests may result in blocking | throttle / block | back off; do not retry immediately |
| `806` | **Data APIs not subscribed** | **entitlement** | **operator action — cannot be fixed in code** |
| `807` | Access token is expired | credential | refresh token |
| `808` | Authentication Failed — Client ID or Access Token invalid | credential | fix credentials |
| `809` | Access token is invalid | credential | re-issue token |
| `810` | Client ID is invalid | credential | fix client id |
| `811` | Invalid Expiry Date | caller input | fix date |
| `812` | Invalid Date Format | caller input | fix format |
| `813` | Invalid SecurityId | caller input | fix security id |
| `814` | Invalid Request | caller input | fix request |
| — | `802`, `803` — **do not exist in the table** (D-11) | unknown | — |

### 7.3.2 Trading API Error codes (`P1 p.4–5`) — verbatim

| Type | Code | Message |
|---|---|---|
| Invalid Authentication | `DH-901` | Client ID or user generated access token is invalid or expired |
| Invalid Access | `DH-902` | **User has not subscribed to Data APIs or does not have access to Trading APIs** |
| User Account | `DH-903` | Errors related to User's Account — check if required segments are activated |
| Rate Limit | `DH-904` | Too many requests — try throttling API calls |
| Input Exception | `DH-905` | Missing required fields, bad values for parameters etc. |
| Order Error | `DH-906` | Incorrect request for order — cannot be processed |
| Data Error | `DH-907` | Unable to fetch data due to incorrect parameters or no data present |
| Internal Server Error | `DH-908` | Server was not able to process request — occurs rarely |
| Network Error | `DH-909` | API was unable to communicate with backend system |
| Others | `DH-910` | Error originating from other reasons |

**Note on `DH-902`:** it is the trading-side counterpart of `806` — "User has not subscribed to Data
APIs". The same entitlement condition therefore appears in **two** vocabularies, reinforcing that
the error layer is not a single axis.

**Note on `DH-903`:** "check if required **segments** are activated" — a **segment-level** entitlement
concept, distinct from the account-level `806`. No document maps segments to activation.

### 7.3.3 Rate-limit error body (`P8 p.1`)

```json
{
  "status": "failure",
  "errorType": "RATE_LIMIT_ERROR",
  "errorCode": "RL001",
  "errorMessage": "Too many requests. Please retry after 1 second."
}
```

A **fifth** vocabulary, absent from the annexure (D-10). The body shape differs from the Data API
error shape (`{"data":{"806":"…"},"status":"failed"}` — observed empirically in W-06): **two distinct
REST error body shapes** exist.

### 7.3.4 HTTP status ↔ vendor code: the documented state

| Relationship | Status in the published set |
|---|---|
| HTTP status → vendor code | **NOT DOCUMENTED** for any code |
| Vendor code → HTTP status | **NOT DOCUMENTED** for any code |
| Observed pairs (empirical, W-06) | `806` observed with **HTTP 401**; `807`–`810` observed with **HTTP 401** |
| `429` | **NOT DOCUMENTED** as Dhan's throttle status — IPD assumes it (`dhan_api_client.ts:319–321`) |

**Nothing else is observed.** The only vendor body ever seen by IPD came from the W-06 probe, which
was deliberately read out-of-band rather than parsed by the client.

### 7.3.5 IPD's current error mapping

`dhan_api_client.ts:311–325`:

| HTTP status | IPD canonical failure |
|---|---|
| 2xx | success (body then parsed; non-JSON → `MALFORMED_RESPONSE`) |
| 401, 403 | `AUTHENTICATION_FAILURE` |
| 408, 504 | `TIMEOUT` |
| 429 | `RATE_LIMITED` |
| anything else | `HTTP_ERROR` |

**Note — the canonical vocabulary is richer than the HTTP mapping.** `dhan_failures.ts:17–42` defines a
24-code `DhanFailureCode` set that already includes `CREDENTIALS_UNAVAILABLE`,
`CREDENTIALS_EXPIRED`, `PRODUCTION_NOT_AUTHORIZED`, `PROVIDER_STATUS_FAILURE`,
`STALE_DATA_SUPPRESSED`, `UNSUPPORTED_DOMAIN`, `UNSUPPORTED_PRE_ACCESS_OPERATION`,
`INVALID_DATE_RANGE`, `UNSUPPORTED_INTERVAL`, `EMPTY_HISTORICAL_SERIES`, and others.

The point is important: **IPD already has the vocabulary it needs.** What it lacks is the *wire
signal* that would let it choose the right code — a vendor-code parser, not a new failure taxonomy.
That materially lowers the cost of gap **G-06**: the change is additive mapping, not new
vocabulary.

**What is lost:**

- `806` (entitlement) vs `807`/`808`/`809`/`810` (credentials) — **collapsed** into one code.
  W-06 proved this is a real failure mode: both arrive as `401`.
- `804` (over-batch) vs `805` (throttle) vs `814` (bad request) — all `HTTP_ERROR`.
- `811`–`813` (caller input errors) — if the vendor used a 4xx other than 401/403/408/429, they
  would surface as `HTTP_ERROR` and be misdiagnosed as a vendor fault rather than a caller bug.
- `800` (transient) vs `814` (permanent) — indistinguishable, so retry policy cannot differ.
- `RL001` — indistinguishable from any other non-429 failure.

**Severity: HIGH.** This is the highest-value, lowest-risk improvement in the whole register: it
requires **no** entitlement, **no** new endpoint, and **no** contract change — only parsing a body
that IPD already receives. The credential-reflection defence must be preserved: extract the **code**
and a **sanitised** message; never echo the raw body.

---

## 7.4 Error taxonomy — the WebSocket layer

### 7.4.1 Feed Request Codes (`P1 p.3`) — outbound JSON

| Code | Action | Also used by |
|---|---|---|
| `11` | Connect Feed | ⚠️ **`P6 p.6` says `11` = Disconnect** (D-4) |
| `12` | Disconnect Feed | `P5 p.7` (`{"RequestCode": 12}`) |
| `15` | Subscribe — Ticker Packet | live feed |
| `16` | Unsubscribe — Ticker Packet | live feed |
| `17` | Subscribe — Quote Packet | live feed |
| `18` | Unsubscribe — Quote Packet | live feed |
| `21` | Subscribe — Full Packet | live feed |
| `22` | Unsubscribe — Full Packet | live feed |
| `23` | Subscribe — Full Market Depth | `P6 p.2` — **both** 20-level and 200-level |
| `25` | Unsubscribe — Full Market Depth | `P6 p.6` — with `InstrumentCount` + `InstrumentList` |

`41` is used as a **request** code by `P6 p.6` ("Connect the feed — 41") but appears in **no** annexure
request table; and `41`/`51` are **response** codes for depth bid/ask data (`P6 p.4–5`) — see D-25.

### 7.4.2 Feed Response Codes (`P1 p.4`) — inbound binary

| Code | Packet | Structure source |
|---|---|---|
| `1` | Index Packet | not detailed in P5 |
| `2` | Ticker Packet | `P5 p.4` |
| `4` | Quote Packet | `P5 p.4–5` |
| `5` | OI Packet | `P5 p.5` |
| `6` | Prev Close Packet | `P5 p.4` |
| `7` | Market Status Packet | **not detailed in any document** |
| `8` | Full Packet | `P5 p.5–6` |
| `50` | Feed Disconnect | `P5 p.7`, `P6 p.7` |
| `41` | Bid Data (Buy) — depth | `P6 p.4–5` — **absent from the annexure** (D-12) |
| `51` | Ask Data (Sell) — depth | `P6 p.4–5` — **absent from the annexure** (D-12) |

### 7.4.3 Disconnect codes

| Property | Live feed (`P5 p.7`) | Depth feed (`P6 p.7`) |
|---|---|---|
| Packet | 8-byte header, code `50` | 12-byte header, code `50` |
| Reason field | `int16` at bytes **8–9** | `int16` at bytes **12–13** |
| Reason semantics | **TABLE NOT IN THE SET** (external hyperlink) | **TABLE NOT IN THE SET** (external hyperlink) |
| Socket overflow | ">5 websockets … first socket disconnected with **805**" | identical wording |

**Only one disconnect cause is interpretable from the set:** socket-limit overflow (`805`).
Everything else is an uninterpretable `int16`.

### 7.4.4 Transport-level conditions (not application errors)

| Condition | Evidence | IPD classification today |
|---|---|---|
| Ping not answered within **40 s** ⇒ server closes | `P5 p.3`, `P6 p.3` | n/a (no WS) |
| More than **5** sockets ⇒ first socket disconnected with `805` | `P5 p.7`, `P6 p.7` | n/a |
| `8`-byte vs `12`-byte header framing | `P5 p.3` vs `P6 p.3–4` | n/a |
| Little-endian byte order | `P5 p.3` | n/a |

---

## 7.5 Operational risk summary

| # | Risk | Severity | Basis |
|---|---|---|---|
| OR-1 | Entitlement (`806`) and credential (`807`–`810`) failures are indistinguishable in code | **HIGH** | D-9; `dhan_api_client.ts:311–325`; W-06 evidence |
| OR-2 | A burst of up to 60 quote requests violates the documented 1 req/s family cap | **HIGH** | `P8 p.1` vs `dhan_market_data_service.ts:114` |
| OR-3 | One shared budget lets `/charts/*` starve the quote family | **HIGH** | `dhan_market_data_service.ts:114` |
| OR-4 | Unknown vendor codes collapse into `HTTP_ERROR`, preventing correct retry policy | MEDIUM | `P1 p.5` codes `800`/`804`/`805`/`814` all → `HTTP_ERROR` |
| OR-5 | The vendor's own throttle signal is invisible to IPD | MEDIUM | `P8 p.1` `RL001`; no parser |
| OR-6 | `observeThrottle` exists but is never called in production | MEDIUM | `dhan_operational_controls.ts:152`; only caller is the test |
| OR-7 | No documented limit for three endpoint families ⇒ any IPD limit there is an assumption | MEDIUM | `P2`, `P7`, `P9` |
| OR-8 | Instrument-master staleness is undetectable (no version/checksum/upstream cadence) | **HIGH** | D-19; `P9` |
| OR-9 | Disconnect reasons are uninterpretable | MEDIUM (blocking for feeds) | D-7 |
| OR-10 | Depth side labelling could invert bid/ask silently | **HIGH** | D-3, D-18 |

---

## 7.6 What IPD must **not** assert

Consolidated prohibitions, each with its reason:

1. **No universal rate limit.** Only per-category limits exist, with unresolved scope (D-13, D-14, D-15).
2. **No HTTP status for any vendor code.** Never documented (D-9).
3. **No meaning for any disconnect reason code** beyond socket overflow (D-7).
4. **No `802`/`803`** — the codes are not documented (D-11).
5. **No alias between `STOCHASTIC` and `STOCH`** (D-1).
6. **No bid/ask side convention for the depth products** (D-3).
7. **No `version` parameter for the depth URLs** (they have `token`/`clientId`/`authType` only).
8. **No `InstrumentCount` on a 200-level request** (D-26).
9. **No adjustment, split or dividend policy** for historical candles — `isAdjusted` cannot be
   grounded (§5.2).
10. **No statement that Company Info supplies financial statements, cash flows, or dividend-sustainability
    evidence** (D-21; §5.3).
11. **No "5-level/20-level/200-level depth" conflation** — four distinct products (§3.6).
12. **No assumption that `11` disconnects a depth feed** (D-4).
