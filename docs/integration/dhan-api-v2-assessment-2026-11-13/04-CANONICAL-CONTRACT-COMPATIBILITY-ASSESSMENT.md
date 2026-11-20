# 5 — Canonical Contract Compatibility Assessment

**Purpose:** assess whether Dhan's data can satisfy IPD's canonical contracts **without modifying
those contracts**. The question is compatibility of *data*, not of *code*.

**Governing principle:** canonical contracts are IPD's. Dhan is a source. No canonical contract may be
altered to accommodate a vendor's payload; where a vendor's data cannot satisfy a contract, the
finding is recorded as a gap, not resolved by bending the contract.

---

## 5.1 D01 — Market Quotes & Prices

`src/contracts/d01_quotes.ts` → `MarketQuotePayload`.

| Canonical field | D01 rule | Dhan source | Compatible? |
|---|---|---|---|
| `companyId` | required, non-empty | IPD identity registry | ✅ internal |
| `symbol` | required | scrip master `SYMBOL_NAME` | ✅ |
| `exchange` | `'NSE' \| 'BSE'` | Dhan segments `NSE_EQ`/`BSE_EQ` (P1 p.1) | ✅ (2 of 6 documented segments) |
| `currency` | `'INR' \| 'USD'` | not in payload; IPD-fixed | ✅ |
| `bid` | number, **presence only** | `depth.buy[0].price` | ⚠️ shape undocumented; `0` permitted |
| `ask` | number, **presence only** | `depth.sell[0].price` | ⚠️ shape undocumented; `0` permitted |
| `ltp` | number, **> 0** | `last_price` | ✅ |
| `open` / `high` / `low` | number, **> 0** | `ohlc.open/high/low` | ✅ (schema matches P3's OHLC shape) |
| `close` | optional, > 0 if present | `ohlc.close` | ✅ |
| `previousClose` | number, **> 0** | **derived** `last_price − net_change` | ⚠️ depends on `net_change`, undocumented |
| `volume` | number, ≥ 0 | `volume` | ✅ (field undocumented in P4) |
| `vwap` | optional | `average_price` (optional in DTO) | ✅ plausible |
| `turnover` | optional | not mapped | ⚪ n/a |
| `change` | number | `net_change` | ✅ |
| `pctChange` | number | derived | ⚠️ depends on `previousClose` |
| `tradeCount` | optional | not mapped (Dhan has `last_quantity`, a different concept) | ⚪ n/a |
| `securityIdentity` | optional D114 | IPD-built | ✅ |

**Verdict: `COMPATIBLE IN SHAPE`.** Every canonical D01 field has a plausible source, and IPD already
maps them. Two caveats:

1. **The entire Quote response shape is undocumented in the published set.** P4 p.1 names the endpoint
   and nothing else. The mapping in `dhan_dto.ts` / `dhan_normalizer.ts` is therefore **plausible but
   unverified**; only the OHLC subset (`last_price`, `ohlc{open,high,low,close}`) has a published
   schema — and that is for a *different endpoint* (P3).
2. **`bid`/`ask` semantics are a documented inversion risk.** Dhan labels depth sides `buy`/`sell`
   (P5 p.6–7 pairs Bid↔Buy, Ask↔Sell correctly); P6 p.4 labels its 20/200-level codes "Bid Data
   (Buy)" / "Ask Data (Sell)", inverting the market convention. IPD maps `depth.buy → bid` and
   `depth.sell → ask` (`dhan_normalizer.ts:132–133`), which is correct **if and only if** the REST
   Quote payload follows the P5 convention. Nothing in the set confirms this for the REST surface.
   Recorded as discrepancy **D-3**.

**No canonical change is required or proposed.**

---

## 5.2 D02 — Historical OHLCV

`src/contracts/d02_ohlcv.ts` → `OHLCVCandle`.

| Canonical field | D02 rule | Dhan source | Compatible? |
|---|---|---|---|
| `companyId`, `symbol` | required | IPD identity | ✅ |
| `interval` | `'1m'\|'5m'\|'15m'\|'1h'\|'1d'\|'1w'\|'1M'` | IPD-side mapping | ⚠️ vendor vocabulary undocumented |
| `candleStart` / `candleEnd` | ISO-8601 UTC | epoch seconds at candle **start** (IPD assumption) | ⚠️ **undocumented** |
| `open`/`high`/`low`/`close` | number | vendor OHLC | ✅ |
| `volume` | integer shares | vendor volume | ⚠️ undocumented |
| `vwap`, `tradeCount` | optional | — | ⚪ |
| `isAdjusted` | **mandatory boolean** | **no adjustment policy documented anywhere** | ❌ **`UNVERIFIABLE`** |

**Verdict: `COMPATIBLE IN STRUCTURE`, with one mandatory field that no vendor documentation can ground.**

`isAdjusted` is the sharp point. D02 makes it **mandatory**; Dhan documents **no** adjustment,
split or dividend policy for `/charts/historical` (P2 is a two-row table). IPD must therefore
either assert a value it cannot substantiate, or fail closed. Failing closed is correct but makes
D02 unusable; asserting `true` would be a fabrication.

**Conclusion:** `isAdjusted` can only be honestly populated as **"unknown"**, which D02's boolean type
cannot express — unless the contract gains a tri-state, which **this assessment does not propose**
(contract changes require separate authorisation; see §12 R-09).

**Supported-interval gap:** IPD supports `1m|5m|15m|1h|1D`; canonical D02 supports
`1m|5m|15m|1h|1d|1w|1M`. **`1w` and `1M` have no Dhan equivalent in IPD's vocabulary**, and Dhan's
own vocabulary is undocumented. IPD's own header calls this "PROVISIONAL (published docs only,
not live-qualified)" (`dhan_historical_dto.ts:19–24`) — which is the correct epistemic status.

**No canonical change is required for the implemented subset.** The `isAdjusted` question is a gap
(G-08), not a contract incompatibility to be patched here.

---

## 5.3 D03 — Fundamentals / Financial Statements

`src/contracts/d03_fundamentals.ts` → `FundamentalStatementPayload`.

| Canonical field | D02/D03 rule | Dhan source | Compatible? |
|---|---|---|---|
| `statementType` | `'INCOME'\|'BALANCE_SHEET'\|'CASH_FLOW'\|'COMPREHENSIVE'` | **no statement concept exists in Dhan** | ❌ |
| `periodType` | `'ANNUAL'\|'QUARTERLY'\|'TTM'` | TTM implied for EPS/EBITDA (P1 p.10) | ⚠️ partial |
| `periodStart` / `periodEnd` | ISO-8601 UTC dates | **absent** | ❌ |
| `filingDate` | ISO-8601 UTC date | **absent** | ❌ |
| `restatementIndex` | number | **absent** | ❌ |
| `currency` | `'INR'\|'USD'` | Dhan quotes ₹ crore (P1 p.10) | ⚠️ unit mismatch (`₹ crore` ≠ base units) |
| `revenue` | number, base units | **absent** | ❌ |
| `operatingProfit`, `ebitda` | optional number | `EBITDA` (String, TTM, ₹ crore) | ⚠️ type + unit + period mismatch |
| `pat` | optional | **absent** | ❌ |
| `eps` | optional number | `EPS` (String, TTM) | ⚠️ type mismatch, no period anchor |
| `totalAssets` / `totalLiabilities` / `netWorth` | optional | `BOOK_VALUE` only (per-share, ₹) | ❌ not equivalent |
| `operatingCashFlow` / `freeCashFlow` | optional | **absent** | ❌ |
| `isAudited` | boolean, mandatory | **absent** | ❌ |
| `cin` | optional | **absent** | ❌ |

**Verdict: `NOT COMPATIBLE`.** **No Dhan endpoint in the published set supplies a single D03
mandatory field** beyond `companyId`.

This is the decisive, evidence-backed answer to the caution that Company Information must not be
assumed to provide complete financial statements or cash flows: **Dhan's Company Info cannot
populate D03 at all**, because D03 is a *statement*-oriented contract (period-bounded, filing-dated,
restatement-tracked, audit-flagged) and Company Info is a *point-in-time ratio snapshot* with no
period anchoring beyond "TTM" (`P1 p.10`) and no filing metadata.

**Dhan Company Info can populate at most a narrow, clearly-labelled subset:**
`marketCap`, `industry`, `sector`, `dividendYield`, `eps(TTM)`, `ebitda(TTM, ₹ crore)`,
`bookValue(₹)`, `peRatio`, `pbRatio`, `debtToEquity`, `roe`, `roce`, `52-week high/low`,
`promoter/dii/fii/public holding %`, and the sector-relative averages (P1 p.10–13).

That subset is **valuation context**, not financial statements — and it maps naturally onto
roadmap **W05 (financial coverage)** and **W12 (valuation)** as *supporting evidence*, never as the
decision authority. Note also that **every field is a `String`** (P1 p.10–13), so even the usable
subset requires explicit parsing and range validation.

**No canonical change is proposed.** The correct outcome is that Dhan Company Info **does not**
satisfy D03, and that any future use must be carried in a separate, clearly-typed context payload —
a design decision for a separately authorised work item, not for this assessment.

---

## 5.4 D05 — Instrument / Security Master

`src/contracts/d05_security_master.ts` → `InstrumentMasterPayload`.

| Canonical field | D05 rule | Dhan source | Compatible? |
|---|---|---|---|
| `companyId` | required | IPD identity | ✅ |
| `isin` | required, ISO-6166 12-char | CSV `ISIN` (detailed only) | ✅ |
| `cin` | optional | **absent** | ❌ |
| `nseSymbol` / `bseSymbol` / `bseScripCode` | optional | `SYMBOL_NAME` per segment | ✅ per-listing |
| `companyName` | required | `DISPLAY_NAME` / `SYMBOL_NAME` | ✅ |
| `industry` | **required** | **only** via `/data/companyinfo` (unimplemented) | ❌ |
| `sector` | **required** | **only** via `/data/companyinfo` (unimplemented) | ❌ |
| `listingStatus` | `'ACTIVE'\|'SUSPENDED'\|'DELISTED'` | **absent** — the CSV has `EXPIRY_FLAG`, which is *not* a listing status | ❌ |
| `lotSize` | required number | CSV `LOT_SIZE` | ✅ |
| `tickSize` | required number | CSV `TICK_SIZE` (present in the file; **not currently propagated** by IPD's D05 path) | ⚠️ available, not wired |
| **`faceValue`** | **required number** | **absent — no column in the CSV, no field in any PDF** | ❌ |
| `currency` | `'INR'\|'USD'` | not in CSV | ⚠️ IPD-fixed |
| `effectiveFrom` / `effectiveTo` | ISO-8601 dates, **effective-dated** | **absent — no update/version marker on the CSV** | ❌ |
| `listings[]` | per-exchange listing with status/lotSize/tickSize | partial: segment + `LOT_SIZE` + `TICK_SIZE` | ⚠️ partial |

**Verdict: `NOT COMPATIBLE AS SPECIFIED`.**

D05 demands five things the Dhan scrip master cannot supply:

1. **`faceValue`** — mandatory, and there is **no face-value column in the CSV** and **no face-value
   field in any of the nine PDFs**. This was confirmed against the retained P7 snapshot: the detailed
   CSV's 33 columns contain **no** face-value field. **This blocker is independent of entitlement** —
   no Dhan product in the published set could satisfy it.
2. **`industry` / `sector`** — mandatory; available only from `/data/companyinfo`, which is
   `MISSING` in IPD.
3. **`listingStatus`** — mandatory; Dhan exposes `EXPIRY_FLAG`, a different concept.
4. **Effective dating (`effectiveFrom`/`effectiveTo`)** — mandatory; the CSV has **no update
   frequency, version marker, or checksum** (P9 p.1), so "as of when" is unanswerable.
5. **CIN** — optional, but absent from the scrip master.

**Crucially, the dominant gate is NOT Dhan.** P7's own evidence: **23,644 of 23,764** candidate
equities were rejected `REJECTED_NO_P04_CORRESPONDENCE` — i.e. they could not be matched to IPD's
P04 internal security master — while only 24 were `REJECTED_INVALID_FIELD`. So even if every D05
attribute were available tomorrow, D05 coverage would remain bounded by **P04 identity
correspondence**, which maps to roadmap **W04 (identity coverage)**.

**This is the most important structural finding of the whole assessment:** the binding constraint on
D05 is *internal data lineage*, not vendor entitlement. Entitlement (`806`) is the current visible
blocker; P04 correspondence is the deeper one.

**No canonical change is proposed.** The correct outcome is that D05 remains unsatisfied from Dhan
alone, and that face value must come from a source other than Dhan.

---

## 5.5 D06 — News

`src/contracts/d06_news.ts` → `NewsEventPayload`, with
`category: 'CORPORATE' | 'EARNINGS' | 'REGULATORY' | 'MACRO' | 'MARKET_ROUNDUP'`.

Dhan's news categories (P1 p.13) are `ALL`, `COMPANIES`, `EQUITY_MARKETS`, `DEBT_MARKETS`, `IPO`,
`GLOBAL`, `INDIAN_ECONOMY`, `GLOBAL_ECONOMY`, `CURRENCY`, `COMMODITIES`, `CRYPTOCURRENCIES`,
`GOVERNMENT_POLICY_AND_REGULATION`, `INFRASTRUCTURE`, `INTERNATIONAL_TRADE`, `INVESTMENT_IDEAS`,
`REAL_ESTATE`, `STARTUPS`, `TECHNOLOGY`, `MUTUAL_FUNDS`.

**Verdict: `NOT COMPATIBLE` — and the input is `MISSING` in the first place.**

- The **"Live News Headline API" document does not exist in the published set.** P1 p.13 supplies only
  a category enum.
- Dhan's 17 categories and IPD's 5 **do not map**: no Dhan category corresponds to `EARNINGS`
  (the nearest is `COMPANIES`, which is an *entity type*, not an *event type*), and `MACRO` splits
  across `INDIAN_ECONOMY` / `GLOBAL_ECONOMY` / `CURRENCY` / `COMMODITIES` with no stated rule.
- Dhan has **no regulatory-event category** (`REGULATORY`) and **no market-roundup** category.

**No canonical change is proposed.** Dhan news is `MISSING`; the mapping problem is moot until the
capability is considered at all, and would require a documented endpoint before any mapping work is
meaningful.

---

## 5.6 Domains with no Dhan source at all

| Domain | Canonical contract | Dhan source in the published set |
|---|---|---|
| D04 Corporate Actions | `src/contracts/d04_*` | **none** — no dividend, split, bonus, rights or corporate-action endpoint exists in the set |
| D07 Estimates | `src/contracts/d07_*` | **none** |
| D08 Macro | `src/contracts/d08_*` | **none** |
| D09 Alternative Data | `src/contracts/d09_*` | **none** |

**D04 is a notable absence**: `P1 p.3`'s Product Type enum includes `MARGIN` and `MTF`, and `P1 p.5`
has `811`/`812` expiry/date codes, but **no corporate-action data surface is documented**. IPD's
D04 domain therefore has **no Dhan source at all** — this matters for roadmap **W05 (financial
coverage / rights)**, because Dhan cannot supply rights issues, bonuses or splits.

---

## 5.7 Compatibility summary

| Domain | Dhan compatibility | Contract change needed? | Blocking reason |
|---|---|---|---|
| **D01** | ✅ compatible in shape (2 undocumented fields) | **No** | — |
| **D02** | ⚠️ structure compatible; `isAdjusted` ungrounded | **No** for the implemented subset | no adjustment policy documented |
| **D03** | ❌ **not compatible** | **No** | no statement/period/filing concept exists in Dhan |
| **D05** | ❌ **not compatible** | **No** | `faceValue` absent from every Dhan source; `industry`/`sector` need `/data/companyinfo`; no effective dating |
| **D06** | ❌ **not compatible** | **No** | endpoint undocumented; category vocabularies disjoint |
| D04 / D07 / D08 / D09 | ❌ no source | **No** | no documented Dhan surface |

**Governing conclusion:** in **no** case does a Dhan payload require a canonical contract to change.
Every incompatibility is a **capability gap**, and the appropriate response to a gap is to record it
(Gap Register §9) — not to reshape the contract to fit the vendor. Where IPD has already reached into
vendor territory (D01, D02), it has done so by **normalising into** the canonical contract and
**failing closed** where the vendor's data is inadequate (`dhan_normalizer.ts:101–110`).

This is the single most important structural property of the existing implementation, and it is the
reason the recommendations in §12 are additive rather than corrective.
