# 3 — Dhan API Capability Matrix

**Purpose:** a per-capability-area statement of what the nine documents document, at what depth, and
where IPD stands. Capability areas **A–H** are assessed **separately**, as required.

**Legend for "Documented depth":**

| Depth | Meaning |
|---|---|
| `SCHEMA` | Request and/or response shape is stated in the set |
| `STRUCTURE` | Wire/packet structure is stated, but not field-by-field semantics |
| `ENUM_ONLY` | Only enumeration values are stated; no schema |
| `INDEX_ONLY` | Only the endpoint name is stated |
| `ABSENT` | Not mentioned at all |

---

## 3.1 Master matrix

| Area | Capability | Documented in | Documented depth | IPD state | Classification |
|---|---|---|---|---|---|
| **A** | Instrument master (CSV) | P9 p.1–4 | `SCHEMA` (columns) | CSV fetch + parser, `NSE_EQ`/`BSE_EQ` only | `PARTIALLY_IMPLEMENTED` |
| **A** | Instrument master (`/v2/instrument/{seg}`) | P9 p.1 | `INDEX_ONLY` | absent | `MISSING` |
| **A** | Security-ID identity mapping | P9 p.1, P1 p.1 | `STRUCTURE` | P7 registry + qualification implemented | `IMPLEMENTED` |
| **A** | Face value / industry / sector / tick size for D05 | P9 (tick size only), P1 p.10 | `ABSENT` (face value) / `ENUM_ONLY` (industry, sector) | D05 contract requires them; Dhan parser does not supply them | `MISSING` |
| **B** | Historical daily candles | P2 p.1 | `INDEX_ONLY` | `/charts/historical` implemented | `PARTIALLY_IMPLEMENTED` |
| **B** | Historical intraday | P2 p.1 | `INDEX_ONLY` | absent | `MISSING` |
| **B** | Adjustment / split / dividend policy | — | `ABSENT` | not implemented; not documented | `MISSING` |
| **B** | Timezone / date-range limits | — | `ABSENT` | IPD assumes epoch-seconds-at-candle-start | `UNCERTAIN` |
| **C** | LTP snapshot | P4 p.1 | `INDEX_ONLY` | absent | `MISSING` |
| **C** | OHLC snapshot | P4 p.1, P3 p.1–2 | `SCHEMA` | absent | `MISSING` |
| **C** | Full Quote snapshot | P4 p.1 | `INDEX_ONLY` | **implemented** | `IMPLEMENTED` (shape `UNCERTAIN`) |
| **D** | Live feed — connection & auth | P5 p.1 | `SCHEMA` | absent | `MISSING` |
| **D** | Live feed — subscription protocol | P5 p.2 | `SCHEMA` | absent | `MISSING` |
| **D** | Live feed — binary framing & keepalive | P5 p.3 | `STRUCTURE` | absent | `MISSING` |
| **D** | Live feed — packet layouts | P5 p.4–6 | `STRUCTURE` | absent | `MISSING` |
| **D** | Live feed — disconnect semantics | P5 p.7 | `INDEX_ONLY` (table externalised) | absent | `MISSING` |
| **E** | Depth in REST Full Quote | P4 p.1 (label only) | `INDEX_ONLY` | **read by IPD** | `PARTIALLY_IMPLEMENTED` (shape `UNCERTAIN`) |
| **E** | 5-level depth inside live-feed Full packet | P5 p.5–6 | `STRUCTURE` | absent (no WS) | `MISSING` |
| **E** | 20-level Full Market Depth (WS) | P6 p.1–4, p.6 | `STRUCTURE` | absent | `MISSING` |
| **E** | 200-level Full Market Depth (WS) | P6 p.1–2, p.5–6 | `STRUCTURE` | absent | `MISSING` |
| **F** | Technical indicators | P7 p.1, P1 p.8–9 | `ENUM_ONLY` | absent | `MISSING` |
| **F** | Company Info | P7 p.1, P1 p.9–13 | `ENUM_ONLY` | absent | `MISSING` |
| **F** | Market Movers | P7 p.1, P1 p.14 | `ENUM_ONLY` | absent | `MISSING` |
| **F** | News headlines | P1 p.13 (enum only) | `ABSENT` (no doc) | absent | `MISSING` |
| **G** | Rate limits | P8 p.1–2 | `SCHEMA` | self-imposed budget, not vendor-aligned | `PARTIALLY_IMPLEMENTED` |
| **H** | Trading API errors | P1 p.4–5 | `ENUM_ONLY` | not parsed | `MISSING` |
| **H** | Data API errors | P1 p.5 | `ENUM_ONLY` | not parsed (HTTP status only) | `PARTIALLY_IMPLEMENTED` |
| **H** | Feed response codes | P1 p.4 | `ENUM_ONLY` | n/a — no WS | `MISSING` |
| **H** | Disconnect codes | P5 p.7, P6 p.7 | `ABSENT` (externalised) | n/a | `MISSING` |
| **H** | Rate-limit error body | P8 p.1 | `SCHEMA` | not parsed | `MISSING` |

---

## 3.2 Area A — Instrument master and security identity

### Documented

- Two scrip-master CSVs: a **detailed** file and a **compact** file, both carrying "Security IDs and
  other important details" (P9 p.1).
- `GET /v2/instrument/{exchangeSegment}` (P9 p.1).
- A **detailed-column dictionary** (P9 p.1–3) and a **compact-column dictionary** (P9 p.3–4).
- Exchange-segment enum values (P1 p.1) and instrument-type enum values (P1 p.3).

### Not documented

- **Update frequency, version marker, or checksum** for either CSV. Without these, staleness of the
  instrument master is undetectable.
- The **`SECURITY_ID` column is never listed** in P9's own column dictionary, even though the CSV
  demonstrably carries it (see §3.2 "Evidence" below).
- **ISIN is absent from the compact dictionary** — a documented difference between the two files
  (P9 p.3–4).
- **Face value** is not a column in either dictionary (P9 p.1–4).
- `GET /v2/instrument/{exchangeSegment}` has no response schema, no rate limit, no parameters.

### IPD evidence

- `dhan_instrument_master_source.ts:22–23` — the two CSV URLs are implemented exactly as documented.
- `dhan_instrument_master_parser.ts` — parses ISIN, SERIES, LOT_SIZE; produces `companyId`, `symbol`,
  `exchangeSegment`, `isin`, `series`, `lotSize`, `securityId`.
- **Face value, industry, sector and tick size are not produced** — the parser does not read them.
  This is the blocker for canonical D05 (`src/contracts/d05_security_master.ts` requires `faceValue`,
  `industry`, `sector`, `tickSize`, `lotSize`).
- `dhan_instrument_map.ts:134` — identity is keyed at *security* level as
  `${companyId}|${exchangeSegment}|${isin}|${series}`, and the provider instrument key is
  `${exchangeSegment}:${dhanSecurityId}` (`:192`), with an explicit note that `NSE_EQ` and `BSE_EQ`
  are **not** a conflict (`:190–192`).
- **Evidence that the CSV carries more than P9 documents** (independent of the PDFs): the retained
  snapshot at `evidence/dhan-p7/source/api-scrip-master-detailed.csv` has **33 columns**, of which
  **9 are not in P9's documented list** — `SECURITY_ID`, `SM_UPPER_LIMIT`, `SM_LOWER_LIMIT`,
  `SM_FREEZE_QTY`, `BUY_BO_MIN_MARGIN_PER`, `BUY_BO_PROFIT_RANGE_MAX_PERC`,
  `BUY_BO_PROFIT_RANGE_MIN_PERC`, `BUY_CO_MIN_MARGIN_PER`, `BUY_CO_SL_RANGE_MAX_PERC`,
  `BUY_CO_SL_RANGE_MIN_PERC` — while **all 23 columns P9 does document are present**. This is a
  concrete, checkable instance where the documentation is narrower than the artifact: `TICK_SIZE` and
  `LOT_SIZE` *are* documented and present, but `SECURITY_ID` — the column the whole identity model
  depends on — is **not in the dictionary**.
- **Coverage reality:** P7 qualification produced **96 qualified instruments** out of **23,764**
  equity candidates (`evidence/dhan-p7/qualification-report.md`), of which **23,644 were rejected
  `REJECTED_NO_P04_CORRESPONDENCE`** and **24 `REJECTED_INVALID_FIELD`**. The dominant gate is
  therefore **P04 identity correspondence**, *not* Dhan entitlement and *not* the scrip master.

### Assessment

`PARTIALLY_IMPLEMENTED` for the master fetch/parse; `IMPLEMENTED` for the identity resolution and
qualification logic; `MISSING` for the D05 attribute set and for the segment REST endpoint. The
instrument-master *governance* (versioning/checksum) is `UNCERTAIN` and unresolvable from the set.

---

## 3.3 Area B — Historical data

### Documented

- Two endpoints (P2 p.1): `/charts/historical` (daily) and `/charts/intraday` (minute).

### Not documented

**Everything else.** No request parameters, no response schema, no interval vocabulary, no date-range
limit, no adjustment/split/dividend policy, no timezone statement, no rate limit, no example. The
entire document is a two-row table plus a footer page.

### IPD evidence

- `dhan_historical_dto.ts:42` — `DHAN_HISTORICAL_PATH = '/charts/historical'`.
- `dhan_historical_adapter.ts` — normalises to `D02_OHLCV`; epoch-seconds timestamped at candle
  **start**; duplicates and out-of-order candles **fail closed**; ragged arrays fail.
- `DHAN_SUPPORTED_HISTORICAL_INTERVALS` is exported (`package.ts:80`) and is **IPD's own vocabulary**,
  not Dhan's — `1m|5m|15m|1h|1d|1w|1M` (`src/contracts/d02_ohlcv.ts`).
- **Intraday is absent.** `/charts/intraday` is never called.
- **Dhan's own interval vocabulary is unknown.** P2 does not state it, and `P1 p.8`'s analytics
  timeframe enum (`1`,`5`,`15`,`D`) covers only technical analysis, not candles.

### Assessment

`PARTIALLY_IMPLEMENTED` — daily only, against an undocumented wire format. **This is the highest
documentation risk in the implemented set**: IPD's D02 normaliser assumes a response shape that no
published document states, and the shape it assumes can only be validated against a live
entitled account. IPD's interval vocabulary is an IPD invention and must be labelled as such in any
downstream use.

---

## 3.4 Area C — Market Quote and OHLC

### Documented

- Three endpoints (P4 p.1): `/marketfeed/ltp`, `/marketfeed/ohlc`, `/marketfeed/quote`.
- Limits: **max 1,000 instruments per request; 1 request per second across all market quote
  endpoints** (P4 p.1, restated in P8 p.1).
- The **only** fully documented schema in the set is `POST /marketfeed/ohlc` (P3 p.1–2):
  - request headers `access-token`, `client-id`;
  - request body = segment-keyed **integer arrays** of security IDs;
  - response = `last_price` + `ohlc{open, high, low, close}`.

### Not documented

- `/marketfeed/ltp` — no response schema.
- **`/marketfeed/quote` — no request body, no response body, no field names.** P4 p.1 labels it
  "Get market depth data of instruments" and stops.
- OHLC endpoint: **no volume, no trade timestamp, no depth, no `version` header block, no error
  block** (P3 p.1–2).

### IPD evidence

- `dhan_api_client.ts:96` — `DHAN_MARKET_QUOTE_PATH = '/marketfeed/quote'` — the only market-data
  path IPD calls.
- `dhan_dto.ts:44–56` — `DhanQuoteDto` expects `last_price`, `ohlc{open,close,high,low}`, `volume`,
  `last_trade_time` (`DD/MM/YYYY HH:mm:ss`), optional `average_price`, `net_change`, `buy_quantity`,
  `sell_quantity`, `last_quantity`, `upper_circuit_limit`, `lower_circuit_limit`, and
  `depth{buy[], sell[]}`.
- `dhan_dto.ts:73` — required quote fields are exactly `last_price`, `ohlc`, `volume`,
  `last_trade_time`.
- **None of these field names appear in any published PDF.** The Quote response shape is inferred
  from vendor convention and confirmed only by the W-06 probe, which reached the **authentication
  layer**, not the data layer. **The shape is therefore `UNCERTAIN` in the strict sense** — it is
  plausible and consistent, but undocumented.

### Assessment

`PARTIALLY_IMPLEMENTED` — one of three market-quote endpoints, against an undocumented response
shape. The OHLC endpoint is the one surface where a schema exists and IPD has not used it.

---

## 3.5 Area D — Live Market Feed

### Documented (P5, 8 pp. — the richest document in the set)

| Aspect | Value | Citation |
|---|---|---|
| Connection | `wss://api-feed.dhan.co?version=2&token=…&clientId=…&authType=2` | P5 p.1 |
| Socket limit | **5 sockets per user** | P5 p.1, p.7 |
| Instruments per socket | **5,000** | P5 p.1 |
| Instruments per message | **100** | P5 p.2 |
| Subscribe message | `RequestCode`, `InstrumentCount`, `InstrumentList` | P5 p.2 |
| Byte order | **Little endian** | P5 p.3 |
| Header | **8 bytes** | P5 p.3 |
| Keepalive | ping every **10 s**; **no response within 40 s ⇒ close** | P5 p.3 |
| Packet types | Ticker (code `2`, 2 fields), Prev Close (code `6`, 2 fields), Quote (code `4`, 12 scalar fields), OI (code `5`, 1 field), Full (code `8`, 15 scalar fields + depth) | P5 p.4–6 |
| Full packet | 15 scalar fields (LTP, last qty, LTT EPOCH, ATP, volume, total sell/buy qty, OI, high/low OI for the day, day open/close/high/low) + **5-level depth at bytes 62–161** | P5 p.5–6 |
| Depth packet | **5 × 20 bytes**: `int32` bidQty (0–3), `int32` askQty (4–7), `int16` bidOrders (8–9), `int16` askOrders (10–11), `float32` bidPrice (12–15), `float32` askPrice (16–19) | P5 p.6–7 |
| Disconnect | code `50` + `int16` reason at **bytes 8–9** | P5 p.7 |
| Socket overrun | **">5 sockets ⇒ 805"** | P5 p.7 |

### Not documented

- The **disconnection message code table** (P5 p.7 links externally; no table in the set).
- The exact **field order and units** of the 8-field Full packet beyond the depth sub-packet.
- Any **rate limit** for the feed beyond socket/instrument counts (P8 p.1 has no WebSocket row).
- Whether `805` on a WebSocket surfaces as an HTTP status — **it cannot**, since the transport is
  WebSocket. P5 p.7 reuses the same numeric code as the REST Data API table (P1 p.5). This is a
  **transport/application conflation** in the vendor's own numbering.

### IPD evidence

**None.** A repository-wide search for `websocket`, `wss://`, `api-feed`, `WebSocket`, `binary
parser` across `src/`, `frontend/src/` and `scripts/` returned **no implementation** — only prose
comments (e.g. the dev harness noting "no WebSocket" support) and unrelated HTTP client code.

### Assessment

`MISSING`. The capability is the best-documented in the set and the least implemented in IPD. Its
absence is consistent with IPD's REST-only, request/response, poll-based architecture — but it
means IPD currently **cannot deliver sub-minute quote freshness** against the D01 threshold of
15 minutes (`src/quality/freshness_evaluator.ts:16`).

---

## 3.6 Area E — Market depth — **three distinct products, not one**

This area is deliberately separated into four rows because conflating them is the most likely
analytical error in this domain.

### E.1 — Depth inside REST `/marketfeed/quote`

- **Documented:** only that the endpoint is "Get market depth data of instruments" (P4 p.1). The
  depth **structure is not specified anywhere in the set** — no level count, no field names, no
  unit prices, no quantity fields.
- **IPD:** `dhan_dto.ts:38–41` defines `depth{buy: DhanDepthLevelDto[], sell: DhanDepthLevelDto[]}`
  with `{quantity, orders, price}` per level. `dhan_normalizer.ts:50–54,132–133` takes
  `levels[0].price` from `depth.buy` → `bid` and `depth.sell` → `ask`, with **no ordering validation**
  and **no depth-level-count validation**.
- **Classification:** `PARTIALLY_IMPLEMENTED` in code, `UNCERTAIN` in shape.

### E.2 — 5-level depth inside the live-feed Full packet

- **Documented:** P5 p.5–6 — 5 levels, 20 bytes each, `int32` bidQty/askQty, `int16`
  bidOrders/askOrders, `float32` bidPrice/askPrice.
- **IPD:** none — no WebSocket implementation exists.
- **Classification:** `MISSING`.

### E.3 — 20-level Full Market Depth (WebSocket)

- **Documented:** P6 p.1–4, p.6.
  - URL `wss://depth-api-feed.dhan.co/twentydepth?token=…&clientId=…&authType=2` — query parameters
    are `token`, `clientId`, `authType` (default `2`), but **no `version` parameter**, unlike P5 p.1.
  - **≤ 50 instruments per connection** (P6 p.2).
  - Subscribe with RequestCode **`23`** (P6 p.2), same code as the 200-level product.
  - **12-byte header** (P6 p.3) — different from P5's 8-byte header.
  - Bytes 8–11 = sequence number, **"to be ignored"** (P6 p.3).
  - Packet = **320 bytes = 20 rows × 16 bytes** (`float64` price, `uint32` quantity,
    `uint32` orders) (P6 p.4).
  - **Feed Response Codes `41` = "Bid Data (Buy)", `51` = "Ask Data (Sell)"** (P6 p.4) — note the
    label inversion against P5 p.6–7 (see §6, D-3).
  - Unsubscribe `25` (P6 p.6).
- **Not documented:** the Feed Response Code rows for `41`/`51` do **not** exist in P1 p.4 — the
  document defers to an Annexure that does not contain them (P6 p.4).
- **IPD:** none.
- **Classification:** `MISSING`.

### E.4 — 200-level Full Market Depth (WebSocket)

- **Documented:** P6 p.1–2, p.5–6.
  - URL `wss://full-depth-api.dhan.co/twohundreddepth?token=…&clientId=…&authType=2` — query parameters
    `token`, `clientId`, `authType`; **no `version` parameter**.
  - **Exactly 1 instrument per connection** (P6 p.2).
  - Subscribe RequestCode **`23`**, and the subscribe message **omits `InstrumentCount`** (P6 p.2).
  - Bytes 8–11 = **"No of Rows"**, *not* a sequence number (P6 p.5).
  - Packet = **3,200 bytes** (P6 p.5).
  - Same 20-row-per-packet structure, stacked in one message (P6 p.5–6).
- **IPD:** none.
- **Classification:** `MISSING`.

### E.5 — Depth products summary and the IPD position

| Product | Transport | Levels | Documented? | IPD |
|---|---|---|---|---|
| REST Full Quote depth | HTTPS | undocumented | label only (P4 p.1) | **read** (shape undocumented) |
| Live-feed Full packet depth | WebSocket `api-feed` | 5 | yes (P5 p.5–6) | no |
| Full Market Depth 20-level | WebSocket `depth-api-feed` | 20 | yes (P6 p.1–4) | no |
| Full Market Depth 200-level | WebSocket `full-depth-api` | 200 | yes (P6 p.1, p.5) | no |

**Assessment.** IPD sits on the **only one of the four products whose structure the vendor does not
document.** The three products that *are* specified are entirely unimplemented. Any statement of the
form "IPD supports 20-level market depth" would be **false on two counts** — the product is not
implemented, and the REST depth IPD does read is not the 20-level product. This is recorded as
gap **G-03** and discrepancy **D-3** / **D-4**.

---

## 3.7 Area F — Market analytics, company info, market movers

### Documented

- Three **POST** endpoints (P7 p.1): `POST /data/technical`, `POST /data/companyinfo`,
  `POST /data/marketmovers`.
- Two semantic guarantees (P7 p.1):
  - **"only the indicators you request are computed"**;
  - **"all values are point-in-time as of the latest closed candle"**.
- **Timeframes:** `1`, `5`, `15`, `D` (P1 p.8) — daily is the default for positional analysis.
- **Indicators (analytics list, P1 p.8–9):** `SMA_5…200`, `EMA_5…200`, `RSI_14`, `MACD_HIST`
  (12/26/9), `STOCH` (K9/D6), `STOCHRSI_14`, `ATR_14`, `ADX_14`, `UO` (7/14/28), `ROC` (12),
  `WILLR` (14), `PIVOT_CLASSIC`, `PIVOT_FIBONACCI`, `PIVOT_CAMARILLA`.
- **Company Info:** three sections — `CO`, `RATIOS`, `SHP`; **only requested sections are returned**
  (P1 p.9). Field list P1 p.10–13; **every field is `String`**.
- **Market Movers:** instrument groups (P1 p.14) and ranking categories (P1 p.14).
- **News categories** (P1 p.13) — for an API whose document is absent from the set.

### Not documented

- **Any request body or response body** for the three endpoints (P7 p.1–2).
- **Any rate limit** for `/data/*` (P8 p.1 covers only Order, Data, Market Quote, Option Chain — and
  "Data APIs 5 req/sec" is ambiguous as to whether it covers `/data/technical` etc.).
- **Units and precision** of the analytics outputs.
- **Company Info has no cash-flow, no P&L, no balance sheet, no dividend-payout history, no filing
  metadata** (P1 p.9–13). `DIVIDEND_YIELD` is defined as a trailing percentage of current market
  price (P1 p.10) — a **ratio, not evidence of sustainability**. `EPS` and `EBITDA` are TTM (P1 p.10).
- The 200-level and 20-level depth codes are absent from the Feed Response Code table (P1 p.4).

### IPD evidence

**None.** No `/data/technical`, `/data/companyinfo` or `/data/marketmovers` call exists anywhere in
the repository.

### Assessment

`MISSING` across the whole area. Critically, this is the area that would have been *misleading* if
implemented naively: Company Info is a **point-in-time trailing-ratio snapshot**, and Dhan's own
documentation says all values are "as of the latest closed candle" (P7 p.1). Using it as if it were
a financial-statement source would be a **category error**, not just an incompleteness.

---

## 3.8 Area G — Consolidated rate-limit matrix

### Documented (P8 p.1–2)

| API category | Rate | Per-request cap | Daily limit |
|---|---|---|---|
| Order APIs | 10 req/sec | — | 7,000 |
| **Data APIs** | **5 req/sec** | — | **100,000** |
| **Market Quote** | **1 req/sec** (across all market quote endpoints) | **1,000 instruments** | *(blank)* |
| **Option Chain** | **1 req / 3 sec**; **10 unique scrips / 8 sec** | 1 scrip | *(blank)* |

Option Chain enforces **both** limits together — a request is rejected if *either* is exceeded
(P8 p.1). Rate-limit error body (P8 p.1):

```json
{"status":"failure","errorType":"RATE_LIMIT_ERROR","errorCode":"RL001",
 "errorMessage":"Too many requests. Please retry after 1 second."}
```

### Not documented — and this is the crux of area G

- **No WebSocket rate limit** beyond connection and instrument counts (P5 p.1, p.2).
- **No limit for `/charts/*`, `/data/*`, `/instrument/*`** — three families of documented endpoint
  with **no stated limit**.
- **No mapping from rate limit to endpoint family.** "Data APIs 5 req/sec" is not stated to include
  or exclude the market-quote endpoints, which are separately limited to 1 req/sec.
- **`RL001` appears in no Annexure table** (P1 p.4–5) — it is a fifth error vocabulary with no
  code-table entry.
- The daily-limit column is **blank** for Market Quote and Option Chain — an unambiguous blank, not
  an "unlimited" statement.
- No statement of whether limits are **per token, per client-id, per IP, or per account**.

> **Therefore: no universal or global rate limit may be asserted.** Any IPD limit must be stated
> per-endpoint-family, and every family not covered by P8 is `UNCERTAIN`.

### IPD evidence

- `dhan_market_data_service.ts:114` — `new DhanRateLimiter({ maxRequests: 60, windowMs: 60_000 })`
  — a **60 requests/minute** token bucket shared by **all** Dhan traffic.
- `dhan_market_data_service.ts:115` — `new DhanConcurrencyLimiter(8)` — max 8 in flight; queue 1,024.
- `dhan_market_data_service.ts:113` — `new DhanBoundedCache<…>(256)`.
- `dhan_operational_controls.ts:151–152` — `observeThrottle(retryAfterSeconds, nowMs)` honours
  `Retry-After` when safely interpretable, **zeroes the token bucket**, and blocks the window;
  a `blocked` accessor exists.
- **The mismatch is real and material.** IPD's shared budget of 60/min = 1 req/s **average** — it
  coincides numerically with Market Quote's 1 req/s but is **not aligned to it**: the bucket is
  60 **per minute** (a rolling window permitting bursts up to 60), not 1 **per second** with
  inter-request spacing. A burst of 60 quote requests is permitted by IPD's limiter and forbidden
  by Dhan's documented Market Quote limit (P8 p.1). Meanwhile Dhan's documented **Data APIs limit
  of 5 req/sec (P8 p.1)** is **looser** than IPD's 1 req/s effective ceiling — so IPD is
  simultaneously *too strict* for some families and *too lax* for others.
- **Historical requests consume the same bucket** as quotes (`dhan_market_data_service.ts` —
  `getHistorical` acquires the limiter in addition to the client's internal call), so a D02 request
  can consume the budget that a D01 request needs.
- **IPD never parses `RL001`/`errorType`** — so a rate-limit rejection that arrives with a non-429
  status is indistinguishable from a generic `HTTP_ERROR`.

### Assessment

`PARTIALLY_IMPLEMENTED` — a functioning, tested limiter exists, but it is **not vendor-aligned**,
is **not endpoint-family aware**, and cannot **observe** the vendor's own rate-limit signal because
the vendor's rate-limit body is never parsed. See gap **G-07**.

---

## 3.9 Area H — Error taxonomy

### The four (five) independent vocabularies

| # | Vocabulary | Source | Form | Transport |
|---|---|---|---|---|
| 1 | Trading API Error `DH-901`…`DH-910` | P1 p.4–5 | TYPE / CODE / MESSAGE | REST (order APIs) |
| 2 | Data API Error `800`, `804`–`814` | P1 p.5 | CODE / DESCRIPTION | REST (data APIs) |
| 3 | Feed Response Code `1,2,4,5,6,7,8,50` | P1 p.4 | CODE → PACKET | WebSocket |
| 4 | Disconnection message code | P5 p.7, P6 p.7 — **table externalised** | CODE + `int16` reason | WebSocket |
| 5 | Rate-limit error `RL001` / `RATE_LIMIT_ERROR` | P8 p.1 | JSON error envelope | REST |

### The taxonomy separation the assessment must preserve

| Axis | Distinct values | Evidence |
|---|---|---|
| **HTTP status** | 200/401/403/408/429/504/5xx as observed | `dhan_api_client.ts:311–325` |
| **Vendor application code** | `800`, `804`–`814`, `DH-901`–`DH-910` | P1 p.4–5 |
| **WebSocket feed code** | `1`,`2`,`4`,`5`,`6`,`7`,`8`,`41`,`51`,`50` | P1 p.4; P6 p.4 |
| **Feed request code** | `11`,`12`,`15`,`16`,`17`,`18`,`21`,`22`,`23`,`25` | P1 p.3; P6 p.2, p.6 |
| **Transport-level condition** | socket limit exceeded, no-response-in-40s, unsubscribe | P5 p.3, p.7 |
| **Vendor rate-limit code** | `RL001` + `errorType` | P8 p.1 |

### Not documented

- **No HTTP-status mapping for any vendor code** in either table (P1 p.4–5) — confirmed by reading
  the tables: they have only `TYPE`/`CODE`/`MESSAGE` and `CODE`/`DESCRIPTION` columns.
- **`802` and `803` do not exist** in the Data API Error table (P1 p.5) — a gap in the enumeration
  with no explanation.
- **No disconnect-code table** in the set.
- **`805` is reused across layers**: "Too many requests or connections" in the Data API table
  (P1 p.5) and "too many sockets ⇒ 805" in the live feed (P5 p.7). One number, two different
  transports, two different remediations.

### IPD evidence

- `dhan_api_client.ts:311–325` — `mapHttpStatus`: `401|403 → AUTHENTICATION_FAILURE`,
  `408|504 → TIMEOUT`, `429 → RATE_LIMITED`, otherwise `HTTP_ERROR`.
- **No vendor body is ever parsed.** A repository-wide search for `errorCode`, `errorType`,
  `errorMessage`, `remarks`, `data.code` inside `src/providers/dhan/` returns **no parsing logic**.
  `dhan_dto.ts:62` declares `remarks?: unknown` and never reads it.
- `dhan_market_data_http.ts` carries `VENDOR_STATUS_BEARING_CODES` — a 10-code set governing
  whether `vendorHttpStatus` may be exposed — and **never reflects the vendor error body**.
- `dhan_failures.ts` — canonical failure codes are IPD's own vocabulary.

### Assessment

`PARTIALLY_IMPLEMENTED`, and this is a **material** gap rather than a cosmetic one. The W-06
investigation is the proof: **`806` (Data APIs not subscribed) and `807`–`810` (credential problems)
both arrive as HTTP 401** in practice, so `mapHttpStatus` collapses them into a single
`AUTHENTICATION_FAILURE`. IPD reached the correct root cause only by **separately** reading the
vendor's error body out-of-band — not by its own error handling. The capability to do that
programmatically is exactly what is missing.

---

## 3.10 Area coverage summary

| Area | Documented depth | IPD coverage | Net position |
|---|---|---|---|
| A | `SCHEMA` (columns) | ~40% (master + identity only) | Partial; D05 attributes missing |
| B | `INDEX_ONLY` | ~50% (daily only) | Partial; schema unverifiable |
| C | `INDEX_ONLY` + one `SCHEMA` | ~33% | Partial |
| D | `SCHEMA`/`STRUCTURE` | 0% | Missing |
| E | `STRUCTURE` (3 products) | ~0% (one undocumented REST surface) | Missing |
| F | `ENUM_ONLY` | 0% | Missing |
| G | `SCHEMA` (partial scope) | Partial, mis-aligned | Partial |
| H | `ENUM_ONLY` | Partial (HTTP only) | Partial, material gap |
