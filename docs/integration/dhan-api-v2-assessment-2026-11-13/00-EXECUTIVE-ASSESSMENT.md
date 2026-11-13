# 1 — Executive Assessment

**Classification of this document:** assessment conclusion, evidence-cited throughout.

---

## 1.1 Verdict

> **IPD's documented Dhan surface is a narrow, high-quality, cash-equity-only slice of a much larger
> vendor capability set. The nine documents describe substantial capability that IPD does not
> implement at all; the parts IPD does implement are contract-strict and well tested. The binding
> constraint on progress is not IPD code quality — it is (a) vendor entitlement, currently
> `EXTERNAL_BLOCKER — DHAN_DATA_API_SUBSCRIPTION_INACTIVE`, and (b) genuine gaps in the published
> documentation itself, which cannot be closed by more careful reading.**

Three things are true simultaneously and should not be conflated:

1. **What Dhan documents** is broad: REST snapshots (LTP/OHLC/Quote), WebSocket live feed (ticker,
   quote, full with 5-level depth), WebSocket full market depth (20-level *and* 200-level), historical
   candles, technical indicators, company info, market movers, news and an instrument master.
2. **What IPD implements** is narrow: `POST /marketfeed/quote` (REST snapshot), `POST /charts/historical`
   (daily candles only) and the instrument-master CSV. D01 and D02 canonical domains only.
3. **What IPD can currently use** is narrower still: **nothing at runtime**, because the vendor returns
   `806 Data APIs not Subscribed` (`P1 p.5`). Documentation cannot close this.

---

## 2. The five findings that drive the assessment

### F-1 — IPD calls 4 vendor surfaces out of the 14 named in the set; the rest is `MISSING`

| Capability area | Documented in | IPD state | Classification |
|---|---|---|---|
| A. Instrument master / security identity | P9 (5 pp.), P1 p.1–3 | CSV fetch + parser + qualification for `NSE_EQ`/`BSE_EQ` only | `PARTIALLY_IMPLEMENTED` |
| B. Historical data | P2 (2 pp.) | Daily candles via `/charts/historical` only | `PARTIALLY_IMPLEMENTED` |
| C. Market Quote & OHLC | P4 (2 pp.), P3 (3 pp.) | `/marketfeed/quote` only; `/marketfeed/ltp` and `/marketfeed/ohlc` absent | `PARTIALLY_IMPLEMENTED` |
| D. Live Market Feed (WebSocket) | P5 (8 pp.) | none | `MISSING` |
| E. Market depth (3 distinct things) | P6 (8 pp.), P4 p.1, P5 p.5–7 | 5-level depth field read from the REST Quote payload only | `PARTIALLY_IMPLEMENTED` |
| F. Market analytics / company info / movers | P7 (3 pp.), P1 p.8–14 | none | `MISSING` |
| G. Rate limits | P8 (3 pp.), P4 p.1 | Self-imposed 60 req/min budget, not vendor-aligned | `PARTIALLY_IMPLEMENTED` |
| H. Error taxonomy | P1 p.4–5 | HTTP-status-only mapping; vendor codes never parsed | `PARTIALLY_IMPLEMENTED` |

Evidence: §2 and §3 of this package. There is **zero** WebSocket code anywhere in the repository —
verified by a repository-wide search for `websocket`, `marketfeed/ltp`, `marketfeed/ohlc`,
`depth-api`, `api-feed`, `twenty`, `twohundred`, `technical`, `companyinfo`, `marketmovers`, which
returned only unrelated prose and component comments (see §3.1).

### F-2 — Depth must not be conflated: the documents describe **four** distinct depth products

This is the single most consequential ambiguity in the set, and IPD currently sits on the weakest one.

| Product | Transport | Levels | Where documented | IPD state |
|---|---|---|---|---|
| Depth inside **Full Packet** (feed response code `8`) | WebSocket `api-feed` | **5** | `P5 p.5–6` | not implemented (no WS at all) |
| Depth inside **REST `/marketfeed/quote`** | HTTPS | 5 (structure **undocumented** in P4) | `P4 p.1` | **this is what IPD reads** |
| **20-level** Full Market Depth (code `41`/`51`) | WebSocket `depth-api-feed/…/twentydepth` | 20 | `P6 p.1–4` | not implemented |
| **200-level** Full Market Depth | WebSocket `full-depth-api/…/twohundreddepth` | 200 | `P6 p.1, p.5` | not implemented |

`P4 p.1` labels `POST /marketfeed/quote` as "Get market depth data of instruments" — but that endpoint
is a **REST snapshot** and its depth structure is **not specified anywhere in the published set**
(P4 documents no response body at all; P3 documents the OHLC endpoint's response, not Quote's).
`P6` is unambiguously a **separate WebSocket product** with its own hosts, its own subscription codes
and a **different header layout** (12 bytes, `P6 p.3–4`) from the live feed (8 bytes, `P5 p.3`).

**IPD therefore reads a depth structure that the published documentation does not define**, and has
implemented none of the three products that *are* specified. See §6 D-3 and §10 G-03.

### F-3 — The error taxonomy has at least **five independent vocabularies** and no documented HTTP mapping

| Vocabulary | Source | Shape | IPD handling |
|---|---|---|---|
| Trading API Error `DH-901`…`DH-910` | `P1 p.4–5` | Type / Code / Message | not parsed |
| Data API Error `800`, `804`–`814` | `P1 p.5` | Code / Description | not parsed |
| Feed Response Code `1,2,4,5,6,7,8,50` (+ `41`/`51` for depth) | `P1 p.4`; `P6 p.4–5` | 1 byte | not applicable (no WS) |
| Disconnection message code | `P5 p.7`, `P6 p.7` — **table externalised** | `int16` reason after code `50` | not applicable |
| Rate-limit body `RL001` / `RATE_LIMIT_ERROR` | `P8 p.1` | JSON error envelope | not parsed |

**No document in the set provides an HTTP-status column for any vendor error code.** This is now
confirmed from the PDF text itself, not from a web page: `P1 p.4–5` contains only `TYPE`/`CODE`/`MESSAGE`
and `CODE`/`DESCRIPTION`.

IPD's `mapHttpStatus` maps **HTTP status only** — `401/403 → AUTHENTICATION_FAILURE`,
`408/504 → TIMEOUT`, `429 → RATE_LIMITED`, else `HTTP_ERROR`
(`src/providers/dhan/dhan_api_client.ts:311–325`). Nothing in `src/providers/dhan/` reads
`errorCode`, `errorMessage`, `remarks` or the `data.{code}` block; a repository-wide search confirms
zero occurrences. The consequence is already recorded and proven by W-06: **`806` (entitlement) and
`807`–`810` (credential) can both arrive as HTTP 401**, so a bare status cannot distinguish them.
This is a **real, evidenced limitation**, not a hypothetical.

### F-4 — The documentation is materially incomplete, and some gaps cannot be closed by reading harder

Several tables that the documents themselves depend on are **not in the published set**:

| Gap | The document says | Reality |
|---|---|---|
| Disconnection message codes | `P5 p.7`, `P6 p.7`: "detailed Disconnection message code description **here**" | hyperlink resolves to `…/annexure#data-api-error`; **no disconnect table exists in P1** |
| `/marketfeed/quote` request & response schema | `P4 p.1` lists the endpoint | **no parameters, no response fields anywhere in P4** |
| `/marketfeed/ltp` response schema | `P4 p.1` | **none** |
| Historical request/response schema | `P2 p.1` gives two endpoints | **no parameters, no response shape, no limits** |
| Technical/company-info/market-movers request bodies | `P7 p.1` gives three endpoints | **enums only** (via P1 p.8–14); no request/response schema |
| Feed Response Code for 20/200-level packets | `P6 p.4` says "Feed Response Code can be referred in Annexure" | `P1 p.4` lists **no** code for 20-level or 200-level depth |
| Security ID column name in instrument master | `P9 p.1–3` column dictionary | the **`SECURITY_ID` column is never listed** in the dictionary |
| "Live News Headline API" categories | `P1 p.13` | **no news document** in the set at all |

This matters strategically: a large share of the implementation gaps below **cannot be validated by
documentation review**. They require either entitlement and live observation, or a vendor
clarification. That is why §11 (blockers) and §12 (recommendations) are structured the way they are.

### F-5 — Dhan's Company Info cannot support the responsibilities the user flagged, and this is now proven

`P1 p.9–13` defines Company Info as exactly three sections — `CO`, `RATIOS`, `SHP` — with fields
covering market cap, industry, sector, dividend yield, EPS, EBITDA, book value, 52-week range, PE, PB,
debt/equity, sector-relative ratios, ROE, ROCE, and shareholding pattern.

There is **no cash-flow statement, no P&L, no balance sheet, no dividend-payout history, and no
auditor/filing metadata**. `DIVIDEND_YIELD` is documented as "Annual dividend per share as a
percentage of the current market price" (`P1 p.10`) — a **trailing ratio**, not evidence of
sustainability. `EBITDA` is a trailing-twelve-month figure "in ₹ crore" (`P1 p.10`) with no statement
context, restatement history or audit flag.

Every field is typed **`String`** (`P1 p.10–12`), including `MARKET_CAP`, `EPS`, `PE_RATIO`,
`DEBT_TO_EQUITY`, `ROE` and `ROCE` — a parsing and normalisation hazard in its own right (§9).

**This independently confirms the user's caution:** Company Information does **not** provide complete
financial statements, cash flows, or sufficient evidence for dividend sustainability, and must not be
treated as if it does. The canonical D03 contract requires `statementType`, `periodStart`/`periodEnd`,
`filingDate`, `restatementIndex`, `isAudited`, `operatingCashFlow` and `freeCashFlow`
(`src/contracts/d03_fundamentals.ts:9–40`) — **none of which Dhan Company Info can supply**.

---

## 3. What is genuinely good, and should not be rebuilt

Assessment credibility requires saying what works.

- **Contract isolation is real and tested.** `D3D-01`/`D3D-02` assert the normalised output has
  *exactly* the D01/D02 key set with no vendor fields leaking; `D3D-03` asserts identity separation;
  `D3D-04`/`D3D-05` pin the public export map so raw vendor parsers cannot escape the package
  (`tests/dhan_d3d_contract_drift.test.ts`). Vendor DTOs are explicitly internal
  (`src/providers/dhan/dhan_dto.ts:10–16`).
- **Failing closed is systematic, not decorative.** Missing `net_change` refuses to derive
  `previousClose` rather than substituting `ohlc.close` (`dhan_normalizer.ts:101–110`); ragged
  historical arrays fail; out-of-order or duplicate candle timestamps fail; non-finite numbers fail
  before canonical validation can be fooled.
- **Credential handling is disciplined.** Per-request resolution, never stored on the instance, never
  logged, never echoed from error bodies (`dhan_api_client.ts:14–20`, `:268–281`).
- **The `CREDENTIALS_RESOLVED` vs vendor `AUTHENTICATED` distinction is preserved** and is exactly
  what stopped W-06 from being misdiagnosed.

None of this is in question. The gaps are about **coverage**, not about **discipline**.

---

## 4. Readiness in one line per consumer

Dhan data is **supporting evidence only — never an independent decision authority**. IIPS retains
ownership of analytical decisions and of persisted report semantics.

| Consumer | Can it use Dhan today? | Binding constraint |
|---|---|---|
| Personal Portfolio | No | no entitlement; no live quote; no valuation path |
| Stock-level Company Analysis | No | Company Info `MISSING`; cannot supply statements, cash flow or dividend sustainability |
| Holding-level Portfolio Decision Support | No | requires quotes + depth + freshness, none available at runtime |
| Reports / NP-06 | No | must not cite Dhan as authority; no data to cite |

Detail in §8.

---

## 5. The five contradictions a reader would otherwise silently resolve

Recorded in full in §6. Deliberately **not** resolved here:

1. **`STOCHASTIC` vs `STOCH`** — the same oscillator under two names in two different indicator lists
   (`P1 p.7` vs `P1 p.9`).
2. **MACD naming** — `MACD_26`/`MACD_12` as separate "components" (`P1 p.7`) vs a single `MACD_HIST`
   with fixed 12/26/9 (`P1 p.9`). No single canonical MACD identifier exists.
3. **Bid/ask labelled as its opposite** — `P6 p.4` writes "`41` for Bid Data (Buy)" and
   "`51` for Ask Data (Sell)", while `P5 p.6–7` correctly pairs **Bid with Buy** and **Ask with Sell**.
   In market convention a **bid is a buy** order and an **ask is a sell** order, so the correct pairing
   is P5's; P6's *labels* are inverted even though its `41=Bid`/`51=Ask` mapping is consistent.
4. **`11` carries two meanings** — `P1 p.3` defines request code `11` = **Connect Feed** and `12` =
   Disconnect; `P6 p.6` instructs "Disconnect the feed — `11`" and never mentions `12`.
5. **Header size** — 8-byte header with different field ordering (`P5 p.3`) vs 12-byte header
   (`P6 p.3–4`). Different products, but the documents never say so explicitly, and `P6 p.7` still
   reuses the generic "code 50" disconnect.

Each of these is `UNCERTAIN` for implementation purposes. None may be resolved by preference.

---

## 6. The external blocker, stated precisely

> **`EXTERNAL_BLOCKER — DHAN_DATA_API_SUBSCRIPTION_INACTIVE`** — unchanged. `P1 p.5` documents
> `806` = "Data APIs not subscribed". The operator's independent probe returned HTTP 401 with
> `{"data":{"806":"Data APIs not Subscribed"},"status":"failed"}`.

**Documented capability ≠ entitled capability.** Everything in §2 F-1 is documented. None of it is
demonstrated to be available to this account. Conversely, the presence of a document is not evidence
of a subscription, and the W-06 record must not be read as implying activation.

**One authorized quote request remains unconsumed and shall remain unconsumed by this assessment.**

---

## 7. Assessment boundary statement

This package:

- changes **no** implementation file, contract, test, credential, configuration or deployment;
- makes **no** vendor API call and consumes **no** authorized request;
- does **not** modify W-06 records, W-06 tests, or milestone status (M1 not achieved; M2a/M2/M3a/M3/M4
  not started);
- does **not** grant implementation authority — §12 recommendations are proposals requiring separate
  authorization;
- does **not** resolve any documentation contradiction by preference, and records each as open.

See `12-EVIDENCE-BASED-CONCLUSION-AND-READINESS-ASSESSMENT.md` for the final readiness position.
