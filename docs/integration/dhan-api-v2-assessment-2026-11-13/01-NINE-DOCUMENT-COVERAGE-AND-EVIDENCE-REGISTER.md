# 2 — Nine-Document Coverage and Evidence Register

**Purpose:** record exactly what each of the nine PDFs contains, where the evidence sits, and what
each document does **not** contain. Coverage is stated per page so that later sections can cite
without re-deriving.

**Source:** `docs/dhan-api-v2-reference-library` @ `27c75cfb842ac971b4178c0e9c162946bac62983`,
directory `docs/vendor/dhan/api-v2/2026-11-13/`. All nine PDFs read in full.

---

## 2.1 Integrity of the published set

Digests recomputed locally with `sha256sum`; each matches the published `SHA256SUMS.txt` entry.

| ID | Filename | SHA-256 (recomputed) | Pages | Bytes |
|---|---|---|---|---|
| P1 | `Dhan_DHAN_ANNEX.pdf` | `196550b93f8c1ae2bf8f1c2983475246f12dfb7af706b9269382bd425ac7afd1` | 15 | 346,754 |
| P2 | `Dhan_Historical_Data.pdf` | `c90429ced0d311b208a406efa1b87cf1a3a1927351d01d974eb97905c962d4ba` | 2 | 93,401 |
| P3 | `Dhan_Data_API_OHLC.pdf` | `f2398c84c61bc4ae9a697df3c9ab82720da566206d7a29da631083713d9fbfa4` | 3 | 137,754 |
| P4 | `Dhan_Market_Quote.pdf` | `671933bfa9ca048554d315dd7dcc185ef376ed8454365eca7d7ecbbda866a453` | 2 | 99,205 |
| P5 | `Dhan_Live_Market_Feed.pdf` | `72cdd34633ed9b88153dc833b212ffde91fe46ea79657e76d72a33214799731d` | 8 | 187,656 |
| P6 | `Dhan_MARKET_DEPTH.pdf` | `b986e7c4a19202ab0a8e356f2a0cee08c8f9e84c595f7fd0813682ba90a3b28b` | 8 | 195,306 |
| P7 | `Dhan_MARKET_ANALYTICS.pdf` | `41258177f4907a3892c723dab9ecf38ab4a5d087bd5a7e96eae463ef24d29135` | 3 | 96,385 |
| P8 | `Dhan_Rate_Limits.pdf` | `f3cc62249238ce2ffcd6c8814153123e0f2df36feed22300ab80b18fd2d40387` | 3 | 117,314 |
| P9 | `Dhan_Instruments_Guide.pdf` | `808b9382728e2b3b635a3dcf7c22da2e18cc1fe2a35ae2db7ce0f28d2b18116f` | 5 | 177,926 |

> **All nine digests match `SHA256SUMS.txt` — recomputed locally, verified, not assumed.**

**Extraction method and cross-check:** text was extracted page-by-page with two independent engines —
`pypdf` 7.1.0 and `pymupdf` — and the two outputs were compared token-for-token. **Zero tokens were
unique to either engine.** The PDFs contain **zero embedded images**, so no content could hide in
raster form; every character in every table was machine-readable text. Total pages: **49**.

---

## 2.2 Page-level coverage register

Each row = one page. "Content" is what is actually on that page; "Absent" is what a reader might
expect on that page and is **not** there.

### P1 — `Dhan_DHAN_ANNEX.pdf` (15 pp.) — enumerations, codes, feed tables, analytics enums

| Page | Content present | Content absent |
|---|---|---|
| 1 | Exchange Segment enum: `IDX_I`=0, `NSE_EQ`=1, `NSE_FNO`=2, `BSE_EQ`=4, `MCX_COMM`=5, `BSE_FNO`=8. Product Type: `CNC`, `INTRADAY`, `MARGIN`, `MTF`. Order Status begins. | — |
| 2 | Order Status enum continues (`CLOSED`, `TRIGGERED`, …); Expiry Code enum begins | — |
| 3 | Expiry Code values; Instrument type enum (`INDEX`, `FUTIDX`, `OPTIDX`, `EQUITY`, `FUTSTK`, `OPTSTK`, `FUTCOM`, `OPTFUT`); **Feed Request Code** table: `11` Connect Feed, `12` Disconnect Feed, `15`/`16` Ticker sub/unsub, `17`/`18` Quote sub/unsub, `21`/`22` Full sub/unsub, `23` Subscribe Full Market Depth, `25` Unsubscribe Full Market Depth. "Feed Response Code" heading. | The Feed Response **Code** table itself is on p.4; p.3 is only the heading |
| 4 | **Feed Response Code**: `1` Index Packet, `2` Ticker Packet, `4` Quote Packet, `5` OI Packet, `6` Prev Close Packet, `7` Market Status Packet, `8` Full Packet, `50` Feed Disconnect. **Trading API Error** table begins: `DH-901` Invalid Authentication … `DH-907` Data Error. | **No HTTP-status column.** No row for 20-level or 200-level depth packets |
| 5 | Trading API Error completes: `DH-908` Internal Server Error, `DH-909` Network Error, `DH-910` Others. **Data API Error** table: `800` Internal Server Error, `804` Requested number of instruments exceeds limit, `805` Too many requests or connections, `806` Data APIs not subscribed, `807` Access token is expired, `808` Authentication Failed, `809` Access token is invalid, `810` Client ID is invalid, `811` Invalid Expiry Date, `812` Invalid Date Format, `813` Invalid SecurityId, `814` Invalid Request. | **Codes `802` and `803` do not exist.** No HTTP-status column |
| 6 | Alert "type" enums (`TECHNICAL_WITH_VALUE`, `TECHNICAL_WITH_INDICATOR`, `TECHNICAL_WITH_CLOSE`, `PRICE_WITH_VALUE`); **alert Indicator Name** list: `SMA_5…SMA_200`, `EMA_5…EMA_200`, `BB_UPPER`, `BB_LOWER`, `RSI_14`. | No `MACD`, no `ATR`, no `STOCH*` on this list |
| 7 | Alert Indicator Name continues: `ATR_14`, **`STOCHASTIC`**, `STOCHRSI_14`, **`MACD_26`**, **`MACD_12`**, `MACD_HIST`. Operator enum (`CROSSING_UP` … `NOT_EQUAL`). Status enum (`ACTIVE`, `TRIGGERED`, `EXPIRED`, `CANCELLED`). | — |
| 8 | Market Analytics **Timeframe** enum (`1`=1-min, `5`=5-min, `15`=15-min, `D`=daily, default for positional analysis). Technical Indicators — Moving Averages: `SMA_5…200`, `EMA_5…200`. | No weekly/monthly/1-hour timeframe |
| 9 | Momentum/Oscillators: `RSI_14`, `MACD_HIST` (Fast 12 / Slow 26 / Signal 9), **`STOCH`** (K 9 / D 6), `STOCHRSI_14`, `ATR_14`, `ADX_14`, `UO` (7/14/28), `ROC` (12), `WILLR` (14). Pivot Points: `PIVOT_CLASSIC`, `PIVOT_FIBONACCI`, `PIVOT_CAMARILLA`. **Company Info** sections: `CO`, `RATIOS`, `SHP` ("Only the sections passed in the request are returned"). | **No `MACD_12`/`MACD_26` in the analytics list** — contradicts p.7 |
| 10 | Company Info `CO` response parameters, **all `String`**: `MARKET_CAP` (Rs Cr.), `INDUSTRY`, `SECTOR`, `DIVIDEND_YIELD` ("Annual dividend per share as a percentage of the current market price"), `EPS` (TTM), `EBITDA` (TTM, ₹ crore), `BOOK_VALUE` (₹), `FIFTY_TWO_WEEK_HIGH`, `FIFTY_TWO_WEEK_LOW`. `RATIOS` section begins (`PE_RATIO`, TTM). | **No revenue, no PAT, no total assets/liabilities, no net worth, no cash-flow fields, no dividend-payout history** |
| 11 | `RATIOS` continues, all `String`: `PB_RATIO`, `DEBT_TO_EQUITY`, `PE_TO_SECTOR_PE`, `ROE`, `ROCE`, `INDUSTRY_EPS`, `INDUSTRY_DEBT_TO_EQUITY`, `INDUSTRY_PB_RATIO`, `INDUSTRY_CURRENT_RATIO` | — |
| 12 | `RATIOS` closes: `INDUSTRY_DIVIDEND_YIELD`, `INDUSTRY_OPERATING_MARGIN`. `SHP` response parameters, all `String`: `REPORTING_PERIOD` (`YYYYMM`), `PROMOTER_HOLDING`, `DII_HOLDING`, `CHANGE_IN_DII_HOLDING`, `FII_HOLDING`, `CHANGE_IN_FII_HOLDING` | — |
| 13 | `SHP` closes: `PUBLIC_HOLDING`. **News Category** enum (`ALL`, `COMPANIES`, `EQUITY_MARKETS`, `DEBT_MARKETS`, `IPO`, `GLOBAL`, `INDIAN_ECONOMY`, `GLOBAL_ECONOMY`, `CURRENCY`, `COMMODITIES`, `CRYPTOCURRENCIES`, `GOVERNMENT_POLICY_AND_REGULATION`, `INFRASTRUCTURE`, `INTERNATIONAL_TRADE`, `INVESTMENT_IDEAS`, `REAL_ESTATE`, `STARTUPS`, `TECHNOLOGY`) | **No news API document exists in the set** — the enum references an undocumented endpoint |
| 14 | `MUTUAL_FUNDS`. **Market Movers Instrument** enum (`OPTIDX`, `OPTSTK`, `OPTFUT`, `FUTIDX`, `FUTSTK`, `FUTCOM`, `EQUITY`; "All values in a single request must belong to the same group … cannot be mixed"). **Ranking Category** enum with applicability (`HIGHEST_OI` (Options), `OI_GAINERS`/`OI_LOSERS` (Options, Futures), `TOP_VOLUME` (Options, Futures), `PRICE_GAINERS`/`PRICE_LOSERS` (Stocks)) | — |
| 15 | Corporate footer only | — |

### P2 — `Dhan_Historical_Data.pdf` (2 pp.) — **the thinnest document in the set**

| Page | Content present | Content absent |
|---|---|---|
| 1 | A **two-row endpoint table**: `/charts/historical` (daily) and `/charts/intraday` (minute) | **No parameters. No response schema. No interval list. No date-range limit. No adjustment/split policy. No timezone statement. No rate limit. No example.** |
| 2 | Corporate footer / navigation only | — |

**Consequence:** the historical capability is, for assessment purposes, **documented only at the level of
endpoint existence.** IPD's entire D02 implementation rests on a response shape that appears in
**no** published document.

### P3 — `Dhan_Data_API_OHLC.pdf` (3 pp.) — the **only** document with a full REST request/response schema

| Page | Content present | Content absent |
|---|---|---|
| 1 | `POST /marketfeed/ohlc`. Headers `access-token`, `client-id`. Request body: **segment-keyed integer arrays** of security IDs. Response: `last_price` plus `ohlc{open, high, low, close}`. | **No volume. No trade timestamp. No depth. No `version` request-header block. No error block. No rate limit on this page.** |
| 2 | Continuation of the schema/example; response field descriptions | — |
| 3 | Corporate footer only | — |

### P4 — `Dhan_Market_Quote.pdf` (2 pp.) — endpoint index **without schema**

| Page | Content present | Content absent |
|---|---|---|
| 1 | Three endpoints: `POST /marketfeed/ltp`, `POST /marketfeed/ohlc`, `POST /marketfeed/quote` — the last described as "Get market depth data of instruments". **Limits: max 1,000 instruments per request; 1 request per second across all market quote endpoints.** | **No request body. No response body. No field names. No units. No timestamp format.** |
| 2 | Corporate footer only | — |

### P5 — `Dhan_Live_Market_Feed.pdf` (8 pp.) — the most detailed document

| Page | Content present | Content absent |
|---|---|---|
| 1 | Connection URL `wss://api-feed.dhan.co?version=2&token=…&clientId=…&authType=2`. **Limits: 5 sockets per user; 5,000 instruments per socket.** | — |
| 2 | **100 instruments per message.** Subscribe message structure: `RequestCode`, `InstrumentCount`, `InstrumentList`. | — |
| 3 | Binary framing: **little-endian**; **8-byte header**. Ping every 10 seconds; **no response within 40 seconds ⇒ close**. | — |
| 4 | Packet field layouts. **Ticker Packet** (code `2`): `float32` LTP (8–11), `int32` Last Trade Time EPOCH (12–15) — **2 fields**. **Prev Close Packet** (code `6`): `float32` previous-day close (8–11), `int32` previous-day Open Interest (12–15) — **2 fields**. **Quote Packet** (code `4`) begins: `float32` LTP (8–11) … | — |
| 5 | Quote Packet completes: `int16` last traded qty (12–13), `int32` LTT EPOCH (14–17), `float32` ATP (18–21), `int32` volume (22–25), `int32` total sell qty (26–29), `int32` total buy qty (30–33), `float32` day open (34–37), `float32` day close (38–41, "only sent post market close"), `float32` day high (42–45), `float32` day low (46–49) — **12 scalar fields**. **OI Packet** (code `5`): `int32` Open Interest (8–11). **Full Packet** (code `8`) begins: `float32` LTP (8–11) … | — |
| 6 | Full Packet completes: `int16` last traded qty (12–13), `int32` LTT EPOCH (14–17), `float32` ATP (18–21), `int32` volume (22–25), `int32` total sell qty (26–29), `int32` total buy qty (30–33), `float32` OI in contract (34–37), `float32` highest OI for the day (38–41, "only for NSE_FNO"), `float32` lowest OI for the day (42–45, "only for NSE_FNO"), `float32` day open (46–49), `float32` day close (50–53), `float32` day high (54–57), `float32` day low (58–61) — **15 scalar fields**. **Market Depth Structure at bytes 62–161, 100 bytes = 5 packets of 20 bytes each.** Depth packet layout: `int32` Bid Quantity (0–3), `int32` Ask Quantity (4–7), `int16` No. of Bid Orders (8–9), `int16` No. of Ask Orders (10–11), `float32` Bid Price (12–15), `float32` Ask Price (16–19). | **The 5-level depth is not named as a distinct product** — it is embedded in the Full Packet |
| 7 | Unsubscribe `25`. **Disconnect message**: code `50` + `int16` reason at bytes 8–9. **">5 sockets ⇒ 805."** | **The "Disconnection message code description" table is a hyperlink to an external page — no table is in this PDF.** |
| 8 | Corporate footer only | — |

### P6 — `Dhan_MARKET_DEPTH.pdf` (8 pp.) — the 20-level and 200-level **WebSocket** products

| Page | Content present | Content absent |
|---|---|---|
| 1 | Scope: **NSE Equity and Derivatives only**. URLs `wss://depth-api-feed.dhan.co/twentydepth?token=…&clientId=…&authType=2` and `wss://full-depth-api.dhan.co/twohundreddepth?token=…&clientId=…&authType=2`. Query parameters documented: `token*`, `clientId*`, `authType*` (default `2`). **Neither URL carries a `version` parameter** (unlike the live feed). | — |
| 2 | 20-level: **≤ 50 instruments per connection**. 200-level: **exactly 1 instrument per connection**. Both subscribe with **RequestCode `23`**. 200-level subscribe **omits `InstrumentCount`**. | — |
| 3 | **12-byte header** (differs from P5's 8-byte header). Bytes 8–11 = sequence number, **"to be ignored"**. | — |
| 4 | 20-level packet: **320 bytes = 20 × 16-byte rows** (`float64` price, `uint32` quantity, `uint32` orders). **Feed Response Codes `41` = Bid Data (Buy), `51` = Ask Data (Sell)** — note the label inversion against P5. | **No Feed Response Code row exists in P1 for 20-level or 200-level depth** |
| 5 | 200-level packet: bytes 8–11 = **"No of Rows"** (not a sequence); **3,200-byte packet**. | — |
| 6 | Packets **stacked within one message**. Unsubscribe = `25`. **"Connect the feed — 41"** and **"Disconnect the feed — 11"**. | **Contradicts P1 p.3 (`11` = Connect, `12` = Disconnect).** No `12` mentioned anywhere on this page |
| 7 | Disconnect = code `50` + **`int16` reason at bytes 12–13** (P5 places it at 8–9). | **The disconnect-code table is an external hyperlink — absent from the set** |
| 8 | Corporate footer only | — |

### P7 — `Dhan_MARKET_ANALYTICS.pdf` (3 pp.) — endpoint index **without schema**

| Page | Content present | Content absent |
|---|---|---|
| 1 | Three **POST** endpoints: `POST /data/technical`, `POST /data/companyinfo`, `POST /data/marketmovers`. Two semantic statements: **"only the indicators you request are computed"** and **"all values are point-in-time as of the latest closed candle"**. | **No request body. No response body. No field names. No units. No rate limit.** |
| 2 | Continuation of endpoint list / guidance | — |
| 3 | Corporate footer only | — |

### P8 — `Dhan_Rate_Limits.pdf` (3 pp.) — **the only rate-limit document**

| Page | Content present | Content absent |
|---|---|---|
| 1 | Table: **Order APIs** 10 req/sec, 7,000 daily. **Data APIs** 5 req/sec, 100,000 daily. **Market Quote** 1 req/sec, 1,000 instruments/request, **daily column blank**. **Option Chain** 1 req / 3 sec, 10 unique scrips / 8 sec, 1 scrip, **daily column blank**. Option-chain dual-limit semantics ("rejected if either … is exceeded"). Rate-limit error body: `{"status":"failure","errorType":"RATE_LIMIT_ERROR","errorCode":"RL001","errorMessage":"Too many requests. Please retry after 1 second."}`. Best practices: batch, cache, exponential backoff, queue orders. | **No WebSocket limits beyond connection counts. No `/charts/*`, `/data/*`, `/instrument/*` limits. `RL001` appears in no Annexure table.** No `Retry-After` header mention |
| 2 | Python SDK example (`dhanhq` `get_ltp` with `(segment, securityId)` tuples; 100 ms sleep for orders) | — |
| 3 | Corporate footer only | — |

### P9 — `Dhan_Instruments_Guide.pdf` (5 pp.) — instrument master

| Page | Content present | Content absent |
|---|---|---|
| 1 | Two CSV URLs ("detailed" and "compact"), both serving "Security IDs and other important details". `GET /v2/instrument/{exchangeSegment}` endpoint. Detailed-column dictionary begins. | **No update frequency. No versioning. No checksum. No ETag.** |
| 2 | Detailed-column dictionary continues | — |
| 3 | Detailed-column dictionary continues; compact-column dictionary begins | — |
| 4 | Compact-column dictionary continues | — |
| 5 | Corporate footer only | — |

---

## 2.3 Cross-document coverage summary

### Endpoints named anywhere in the set

| Endpoint | Named in | Schema documented? | IPD implements? |
|---|---|---|---|
| `POST /marketfeed/quote` | P4 p.1 | **No** (P4 has no body) | **Yes** — `dhan_api_client.ts:96` |
| `POST /marketfeed/ohlc` | P4 p.1, P3 p.1 | **Yes** (P3) — but no volume/depth/time | No |
| `POST /marketfeed/ltp` | P4 p.1 | **No** | No |
| `POST /charts/historical` | P2 p.1 | **No** | **Yes** — `dhan_historical_dto.ts:42` |
| `POST /charts/intraday` | P2 p.1 | **No** | No |
| `POST /data/technical` | P7 p.1 | **No** | No |
| `POST /data/companyinfo` | P7 p.1 | **No** | No |
| `POST /data/marketmovers` | P7 p.1 | **No** | No |
| `GET /v2/instrument/{exchangeSegment}` | P9 p.1 | **No** | No |
| `wss://api-feed.dhan.co` (live feed) | P5 p.1 | **Yes** (packet layouts) | No |
| `wss://depth-api-feed.dhan.co/twentydepth` | P6 p.1 | **Yes** (packet layout) | No |
| `wss://full-depth-api.dhan.co/twohundreddepth` | P6 p.1 | **Yes** (packet layout) | No |
| "Live News Headline API" | P1 p.13 (enum only) | **No** — no document exists | No |
| Option Chain endpoint | P8 p.1 (limits only) | **No** — no endpoint named | No |

**Count: 14 API/feed surfaces are named across 49 pages. IPD calls **2** of them (`/marketfeed/quote`
and `/charts/historical`) plus **2** CSV downloads — **4 vendor surfaces in total** — and **both** of the
API endpoints it calls have no documented schema.**

### Documented field-level schemas in the entire set

Only three:

1. **P3 p.1–2** — `POST /marketfeed/ohlc` request (segment-keyed int arrays) and response
   (`last_price`, `ohlc{open,high,low,close}`).
2. **P5 p.4–6** — live-feed packet binary layouts (Quote/Ticker/PrevClose/Full + 5-level depth).
3. **P6 p.3–5** — depth-feed packet binary layouts (12-byte header, 16-byte rows, 320/3,200-byte packets).

Everything else — including every analytics field, every company-info field, every feed-request field
name beyond the codes — is **enumerated without a schema**.

### Concepts that are referenced but never defined in the set

| Concept | Referenced at | Defined where? |
|---|---|---|
| Disconnection message codes | P5 p.7, P6 p.7 | **Nowhere** — external hyperlink |
| Feed response code for 20/200-level depth | P6 p.4 ("can be referred in Annexure") | **Nowhere** — P1 p.4 has no such row |
| `SECURITY_ID` column name in the scrip master | P9 p.1 (CSV carries it) | **Nowhere** — not in P9's column dictionary |
| "Live News Headline API" request/response | P1 p.13 | **Nowhere** — no news document |
| Option Chain endpoint URL and schema | P8 p.1 | **Nowhere** |
| Versioning / update cadence of the scrip master | implied by P9 p.1 | **Nowhere** |
| HTTP status for any vendor error code | P1 p.4–5 | **Nowhere** |

---

## 2.4 Method statement

- **Every page of every PDF was read.** No sampling.
- Text extraction was **dual-engine cross-checked** (pypdf + pymupdf, zero divergent tokens).
- Digests were **recomputed**, not trusted from the manifest.
- Hyperlink targets in the PDFs were **enumerated and resolved against the local set**; none of the
  referenced external targets is part of the published nine documents, which is why those items are
  recorded as `UNCERTAIN` rather than filled in.
- **No external web page was used** to fill any gap in this package. Where the set is silent, this
  package says so.
