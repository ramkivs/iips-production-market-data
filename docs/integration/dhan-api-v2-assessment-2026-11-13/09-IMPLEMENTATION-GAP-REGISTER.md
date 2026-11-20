# 10 — Implementation Gap Register

**Purpose:** the authoritative list of gaps between the documented Dhan capability and IPD's
implementation, each classified, evidenced, and — where relevant — attributed.

**Classification (per the user's requirement):** `Critical` · `High` · `Medium` · `Low`.

**Each gap records:** current state · evidence · required work · dependencies · risks ·
validation criteria · whether **Dhan subscription and/or vendor clarification** is needed.

**Severity definitions used here:**

| Severity | Meaning |
|---|---|
| **Critical** | The capability cannot be used correctly at all; or an existing path produces **silently wrong** data; or the blocker prevents any use of the documented surface. |
| **High** | The capability is materially incomplete, or a correctness/robustness gap exists on a live path that would produce wrong results or wrong diagnoses. |
| **Medium** | A real gap with bounded impact, or a documented assumption that is unverifiable but unlikely to be wrong in a damaging way. |
| **Low** | Naming, completeness or hygiene items with negligible behavioural impact. |

**Global note:** gaps are stated against the **documented** surface. "Missing" means *not implemented*;
it does **not** mean *available*. Entitlement (see §11) is recorded separately in the Dependency
Register, and no gap below assumes entitlement.

---

## 10.1 Summary

| ID | Gap | Severity | Needs entitlement? | Needs vendor clarification? |
|---|---|---|---|---|
| G-01 | No Dhan data path can execute at runtime | **Critical** | **Yes** | No |
| G-02 | Canonical D05 cannot be populated from any Dhan source | **Critical** | No | **Yes** |
| G-03 | No market-depth product is implemented (3 distinct products) | **Critical** | **Yes** | **Yes** |
| G-04 | No WebSocket capability (live feed / depth feed) | **Critical** | **Yes** | **Yes** |
| G-05 | Depth semantics unguarded: `bid`/`ask` = 0, no ordering or level-count check | **High** | No | **Yes** |
| G-06 | Vendor error codes are never parsed | **High** | No | **Yes** |
| G-07 | Rate limiting is not endpoint-family aware and is mis-aligned | **High** | No | **Yes** |
| G-08 | `isAdjusted` and the historical response shape are ungrounded | **High** | **Yes** | **Yes** |
| G-09 | Instrument-master versioning/integrity is untracked | **High** | No | **Yes** |
| G-10 | Market analytics (`/data/*`) entirely absent | **High** | **Yes** | **Yes** |
| G-11 | `/marketfeed/ltp` and `/marketfeed/ohlc` absent | **Medium** | **Yes** | Partly |
| G-12 | `/charts/intraday` absent | **Medium** | **Yes** | **Yes** |
| G-13 | `GET /v2/instrument/{segment}` absent | **Medium** | No | **Yes** |
| G-14 | Documented gaps (schemas, tables, enums) unresolved | **High** | Partly | **Yes** |
| G-15 | Operational hardening absent: retry, circuit breaker, timeout, no retry classification | **Medium** | No | Partly |
| G-16 | Indicator/company-info typing and unit handling absent | **Medium** | **Yes** | **Yes** |
| G-17 | News capability is referenced but undocumented | **Low** | Partly | **Yes** |
| G-18 | Segment coverage limited to `NSE_EQ`/`BSE_EQ` | **Medium** | **Yes** | **Yes** |
| G-19 | Batching (1,000 instruments/request) not exploited | **Low** | No | No |
| G-20 | Option Chain surface absent | **Low** | **Yes** | **Yes** |

**Counts:** Critical 4 · High 7 · Medium 6 · Low 3 — **20 gaps**.

---

## 10.2 Critical gaps

### G-01 — No Dhan data path can execute at runtime

| | |
|---|---|
| **Severity** | **Critical** |
| **Classification** | `EXTERNALLY_BLOCKED` |
| **Current state** | The transport, client, parser, normaliser, orchestrator, limiter and cache are all implemented and tested. Every actual vendor call returns **`806` — "Data APIs not subscribed"** (`P1 p.5`), observed as HTTP 401. |
| **Evidence** | `P1 p.5` (`806`); W-06 root-cause record at `c260a82`; `dhan_api_client.ts:311–325` maps the observed 401 to `AUTHENTICATION_FAILURE`; `dhan_market_data_http.ts` maps `RATE_LIMITED` → 429 and everything else → 502. |
| **Required work** | **Not a code change.** An operator action with the vendor to activate the Data API subscription for the account in use, then re-qualification. |
| **Dependencies** | Vendor account action; the credential store must be re-verified afterwards (W-06 established that credential correctness is *not* the blocker). |
| **Risks** | Activating a subscription is a **paid/entitlement-bearing** action with a cost and a contractual footprint; it is an operator decision, not an engineering one. One authorized quote request remains unconsumed — it must not be spent on an exploratory probe. |
| **Validation criteria** | A single authorized request returns a **data** payload (not an error), with the response shape recorded as evidence — thereby closing DQ-1/DQ-2/DQ-3 simultaneously. |
| **Dhan subscription needed?** | **YES** — this is the definition of it. |
| **Vendor clarification needed?** | No. |

---

### G-02 — Canonical D05 cannot be populated from any Dhan source

| | |
|---|---|
| **Severity** | **Critical** |
| **Classification** | `MISSING` — and **independent of entitlement** |
| **Current state** | `InstrumentMasterPayload` requires `faceValue`, `industry`, `sector`, `tickSize`, `lotSize`, `listingStatus`, `effectiveFrom`/`effectiveTo` and an optional `cin`. Dhan's scrip master supplies `LOT_SIZE` and `TICK_SIZE` (documented and present) but **no face value, no industry, no sector, no listing status, and no effective dating**. |
| **Evidence** | `src/contracts/d05_security_master.ts:21–38`; `P9 p.1–4` (documented columns — **no face value**); the retained P7 snapshot `evidence/dhan-p7/source/api-scrip-master-detailed.csv` has 33 columns, **none of which is a face value**; `dhan_instrument_master_parser.ts` produces no face value, industry or sector. |
| **Required work** | Face value, industry, sector, listing status and effective dating must come from **a source other than Dhan** — the D05 contract's own fields, not a contract change. Two sub-options: (a) a non-Dhan reference source for those attributes; (b) populate D05 from IPD's P04 internal master where it already carries them, with Dhan contributing only what it uniquely provides. **IPD-side only; no Dhan work can close this.** |
| **Dependencies** | W04 (identity coverage) and W05 (financial coverage and rights) — the roadmap rows that actually own these attributes. |
| **Risks** | Tempting to satisfy D05 by weakening it. **That is not permitted here** — a canonical contract change requires separate authorisation, and a Dhan-shaped D05 would propagate a vendor's gaps into IPD's identity layer. |
| **Validation criteria** | A D05 instance exists for at least one listed equity with `faceValue`, `industry`, `sector`, `listingStatus` and effective dates all present and provenance-attributed; `validateInstrumentMaster` passes. |
| **Dhan subscription needed?** | **No** — the data does not exist in the Dhan product set. |
| **Vendor clarification needed?** | **YES** — confirm that no face-value, industry, sector, listing-status or versioning field exists in any Dhan master or endpoint (including ones not in the published set). |

---

### G-03 — No market-depth product is implemented, and the four products are distinct

| | |
|---|---|
| **Severity** | **Critical** |
| **Classification** | `MISSING` / `UNCERTAIN` |
| **Current state** | IPD reads a `depth` object from the REST Full Quote payload and takes `levels[0].price` as top-of-book. **No depth product that the documents actually specify is implemented**: neither the live-feed 5-level depth, nor the 20-level WebSocket product, nor the 200-level product. The REST depth IPD reads is the **one product whose structure is undocumented**. |
| **Evidence** | `dhan_dto.ts:38–41`; `dhan_normalizer.ts:50–54`, `:132–133`; `P4 p.1` (label only); `P5 p.5–7` (5-level, structure documented); `P6 p.1–6` (20/200-level, structure documented). |
| **Required work** | A decision (not an implementation) on which depth product IPD wants, if any; then a per-product implementation with its own decoder. **Do not** implement the 20/200-level products until the bid/ask side convention is confirmed (D-3). If the REST top-of-book is retained, it must be **labelled** as an undocumented five-level-ish structure, never as "20-level depth". |
| **Dependencies** | G-04 (WebSocket), G-14 (documentation gaps), D-3, D-12, D-18. |
| **Risks** | (i) **Silent inversion** of bid/ask if the side convention is misread — the highest-consequence risk in this register, because it corrupts spread and imbalance with no error. (ii) The 200-level product's 1-instrument-per-connection and 3,200-byte packet shape makes it operationally expensive. (iii) Claiming "market depth support" without naming the product would be a false capability statement. |
| **Validation criteria** | For whichever product is chosen: a decoder test that round-trips a captured frame; a side-convention test pinned by **vendor-confirmed** semantics; a level-count test; and a documented statement of which product is supported. |
| **Dhan subscription needed?** | **YES** for the WebSocket products (and for observing the REST shape). |
| **Vendor clarification needed?** | **YES** — the REST Quote request/response schema, the bid/ask side convention per product, the `41`/`51` annexure rows, and the disconnect-code table. |

---

### G-04 — No WebSocket capability exists

| | |
|---|---|
| **Severity** | **Critical** |
| **Classification** | `MISSING` |
| **Current state** | No WebSocket client, no binary decoder, no subscription lifecycle, no heartbeat, no reconnect policy — for either the live feed or the depth feed. IPD is REST-and-poll only. |
| **Evidence** | Repository-wide search for `websocket`, `wss://`, `api-feed`, `depth-api`, `twentydepth`, `twohundreddepth`, `binary` in `src/`, `frontend/src/`, `scripts/` → **no implementation**; only prose in the dev harness and component comments. `P5` (8 pp.) and `P6` (8 pp.) are the two richest documents in the set. |
| **Required work** | A WebSocket transport with: per-product decoders (8-byte vs 12-byte headers — D-5), little-endian parsing, ping/pong monitoring against the 40-second close rule, reconnect with backoff, subscription lifecycle, and a freshness interaction. **Plus the credential-in-URL problem (S-12) solved without regressing IPD's credential posture.** |
| **Dependencies** | G-01 (entitlement), G-03, G-14 (disconnect-code table, feed-code rows), S-12, S-14. |
| **Risks** | (i) **Protocol complexity**: a byte-offset error is silent and corrupting; the two header layouts make a shared parser the single most likely defect (D-5). (ii) **Lifecycle complexity**: a long-lived connection is a new failure mode that IPD's current request/response model has no answer for. (iii) **Security**: following the vendor's URL-token pattern verbatim would regress S-1/S-2. (iv) **Scope**: this is a large work item, and it must not be started before the entitlement question is settled. |
| **Validation criteria** | A captured-frame decoder test per product; a heartbeat/timeout test; a reconnect-with-backoff test; a credential-non-in-URL assertion; and a freshness verdict that correctly reports `UNAVAILABLE` while disconnected. |
| **Dhan subscription needed?** | **YES.** |
| **Vendor clarification needed?** | **YES** — disconnect codes (D-7), depth feed request codes (D-4), `41`/`51` rows (D-12), and whether the depth feed's `version`-less URL form is stable. |

---

## 10.3 High gaps

### G-05 — Depth semantics are unguarded

| | |
|---|---|
| **Severity** | **High** |
| **Classification** | `PARTIALLY_IMPLEMENTED` with `UNCERTAIN` semantics |
| **Current state** | `topOfBook` returns `0` for a missing or non-positive level; `src/contracts/d01_quotes.ts` does not require `bid`/`ask` to be positive. A quote with no depth therefore yields a **valid** canonical envelope with `bid = 0, ask = 0`. There is **no** book-ordering check and **no** depth-level-count check. |
| **Evidence** | `dhan_normalizer.ts:50–54`, `:132–133`; `src/contracts/d01_quotes.ts` — `ltp`/`open`/`high`/`low`/`previousClose` are validated `> 0`; `bid`/`ask` are validated for presence only. |
| **Required work** | (i) An explicit **"depth unavailable"** state distinct from "price 0" — carried as a canonical distinction, not as a magic number. (ii) A **monotonicity** check across levels (bids descending, asks ascending). (iii) A **level-count** check against the expected depth for the product. (iv) A **side-convention** attribute (`bidSideMeans`), defaulting to `UNKNOWN`, with the normaliser failing closed on `UNKNOWN`. |
| **Dependencies** | G-14 (REST depth schema), D-3, D-18. Items (i)–(iii) need **no** entitlement and **no** clarification — they are safe under either hypothesis. |
| **Risks** | A strict ordering check could reject a legitimately non-monotonic book (e.g. after a halt or an auction) — which is *correct* fail-closed behaviour, but must be reported as a **data-quality anomaly**, not as a transport failure. |
| **Validation criteria** | Unit tests: empty depth ⇒ unavailable, not `0`; descending bids accepted; ascending bids rejected as an anomaly; unexpected level count rejected; unknown side convention rejected. |
| **Dhan subscription needed?** | **No** for the guards. |
| **Vendor clarification needed?** | **YES** for the side convention and the expected level count. |

---

### G-06 — Vendor error codes are never parsed

| | |
|---|---|
| **Severity** | **High** |
| **Classification** | `MISSING` (parsing); the *vocabulary* already exists |
| **Current state** | `mapHttpStatus` maps HTTP status only. `806` (entitlement) and `807`–`810` (credentials) collapse into one `AUTHENTICATION_FAILURE`. `RL001` is invisible. `dhan_dto.ts:62` declares `remarks?: unknown` and never reads it. IPD's failure vocabulary already contains the right codes (`dhan_failures.ts:17–42`). |
| **Evidence** | `dhan_api_client.ts:311–325`; no `errorCode`/`errorType`/`data.code` parsing anywhere in `src/providers/dhan/`; `P1 p.5` (`806`…`814`), `P1 p.4–5` (`DH-901`…`DH-910`), `P8 p.1` (`RL001`); W-06's out-of-band body read. |
| **Required work** | A vendor-error parser that extracts the **code** (never the raw body) and maps it to an existing `DhanFailureCode`: `806` → entitlement-specific, `807`/`808`/`809`/`810` → credential-specific, `804`/`814`/`811`/`812`/`813` → caller-input, `800`/`DH-908` → transient, `805`/`RL001` → throttle, `DH-902`/`DH-903` → entitlement/segment. **The credential-reflection defence must be preserved**: sanitised message only. |
| **Dependencies** | None. **This gap needs neither entitlement nor a new endpoint** — the body already arrives. |
| **Risks** | (i) Reintroducing credential reflection — mitigated by extracting codes only and keeping the existing "never echo bodies" rule. (ii) Over-trusting the code: a code must **augment** the HTTP status, not replace it (both are needed — the status is the transport fact, the code is the application fact). (iii) Unknown codes must land in a distinct **unrecognised-vendor-code** state, never folded into `HTTP_ERROR` (D-11). |
| **Validation criteria** | Table-driven tests over the full documented code set; a test that `806` and `807` map to **different** IPD codes; a test asserting the raw body never appears in any message; a test that an unknown code maps to the unrecognised state. |
| **Dhan subscription needed?** | **No.** |
| **Vendor clarification needed?** | **YES** — the HTTP-status ↔ code mapping is undocumented (D-9), so the precedence rule between status and code must be confirmed. |

---

### G-07 — Rate limiting is not endpoint-family aware and is mis-aligned

| | |
|---|---|
| **Severity** | **High** |
| **Classification** | `PARTIALLY_IMPLEMENTED` |
| **Current state** | One shared token bucket, `maxRequests: 60, windowMs: 60_000`, covers quotes, history and any future endpoint. A burst of up to 60 quote requests is permitted, against a documented **1 req/sec** for the market-quote family. `/charts/*` and `/data/*` have **no documented limit** and share the same budget. `observeThrottle` exists but has **no production caller**. |
| **Evidence** | `dhan_market_data_service.ts:114`; `dhan_operational_controls.ts:151–152`; `tests/dhan_p4_operational_controls.test.ts:163` (the only caller); `P8 p.1`; `P4 p.1`; `dhan_market_data_service.ts` — `getHistorical` acquires the same limiter. |
| **Required work** | A per-family budget table keyed by endpoint family, each row carrying `limitSource` (a `P8 p.1` citation **or** `UNDOCUMENTED`), with the **stricter** documented limit applied where the scope is ambiguous (D-13, D-14, D-15). The 60/min bucket becomes the *data-family* budget rather than a global one. `observeThrottle` must be **wired** to the vendor's throttle signal. |
| **Dependencies** | G-06 (to see the throttle signal); G-14 (limits for `/charts/*`, `/data/*`). |
| **Risks** | The 60/min bucket is a **tested contract** (`dhan_p4_operational_controls.test.ts`), so changing it is a contract change requiring test updates — and could reduce throughput for the historical back-fill path if not partitioned carefully. Splitting a shared bucket could also change existing behaviour under load; that must be measured, not assumed. |
| **Validation criteria** | Per-family budget tests; a test that the quote family cannot exceed 1 req/s; a test that history cannot starve quotes; a test that `UNDOCUMENTED` families apply the stricter limit; a test that a vendor throttle signal blocks the window. |
| **Dhan subscription needed?** | **No.** |
| **Vendor clarification needed?** | **YES** — the family scope of "Data APIs 5 req/sec", the daily limit for Market Quote and Option Chain, and the limits for `/charts/*`, `/data/*`, `/instrument/*`. |

---

### G-08 — `isAdjusted` and the historical response shape are ungrounded

| | |
|---|---|
| **Severity** | **High** |
| **Classification** | `UNCERTAIN` |
| **Current state** | D02 requires `isAdjusted` (mandatory boolean). Dhan documents **no** adjustment, split or dividend policy. `P2` is a two-row table with **no** request parameters, response schema, interval list, date-range limit, timezone statement or example. IPD's interval vocabulary is its own and marked provisional. |
| **Evidence** | `src/contracts/d02_ohlcv.ts:11,24`; `dhan_historical_dto.ts:19–24` ("Vendor interval vocabulary is PROVISIONAL (published docs only, not live-qualified)"), `:31–33`; `dhan_historical_adapter.ts`; `P2 p.1`. |
| **Required work** | Obtain the historical request/response schema and the adjustment policy. Then: confirm the candle timestamp convention (start vs end); confirm the interval vocabulary and retire `1h` if Dhan does not support it; and decide honestly how `isAdjusted` is populated — a **contract tri-state** would be the clean answer, but **that is a contract change and is not proposed here** (§12 R-09). |
| **Dependencies** | G-01 (to observe), G-14. |
| **Risks** | (i) A timestamp convention mismatch mislabels **every** candle by one interval — a systematic, silent error. (ii) Asserting `isAdjusted = true` without evidence would be a fabrication in a **mandatory** field. (iii) Asserting `false` would be equally unfounded. |
| **Validation criteria** | Documented schema; an observed response recorded as evidence with a field-by-field reconciliation; a candle-boundary test against a known trading session; an explicit, recorded decision on `isAdjusted`. |
| **Dhan subscription needed?** | **YES** — observation is the only way to settle the wire format. |
| **Vendor clarification needed?** | **YES** — the request/response schema and adjustment policy. |

---

### G-09 — Instrument-master versioning and integrity are untracked

| | |
|---|---|
| **Severity** | **High** |
| **Classification** | `MISSING` (control) / `UNCERTAIN` (vendor capability) |
| **Current state** | The scrip master is fetched over plain HTTPS with no digest verification, no recorded fetch timestamp, and no comparison against any prior version. The published set documents no update frequency, version marker or checksum. |
| **Evidence** | `dhan_instrument_master_source.ts:22–23`; `P9 p.1–4`; D-16, D-19. Independently confirmed: the retained P7 snapshot carries 9 columns P9 does not document, including `SECURITY_ID`. |
| **Required work** | Record, on every fetch, the **retrieval timestamp and the SHA-256 of the retrieved bytes** — an IPD-side measure requiring no vendor support, and the precondition for detecting any change. Then maintain a **version ledger** so a master change becomes a detectable event rather than a silent drift. |
| **Dependencies** | None technically. |
| **Risks** | Low risk, high value: without it, an upstream master change (a removed column, a reassigned `securityId`) would propagate silently into the identity registry, which is the **foundation** of every Dhan-derived value. |
| **Validation criteria** | Fetch-time digest + timestamp recorded in the ledger; a test that a changed master produces a **change event** rather than a silent replacement; a test that the parser **fails closed** on an unrecognised header. |
| **Dhan subscription needed?** | **No.** |
| **Vendor clarification needed?** | **YES** — the publication cadence and whether a checksum/version endpoint exists. |

---

### G-10 — Market analytics are entirely absent

| | |
|---|---|
| **Severity** | **High** |
| **Classification** | `MISSING` |
| **Current state** | No call, DTO, normaliser or contract binding for `/data/technical`, `/data/companyinfo` or `/data/marketmovers`. No consumer can receive an indicator, a company metric or a movers ranking. |
| **Evidence** | `P7 p.1–2` (three POST endpoints, no schema); `P1 p.8–9` (indicator identifiers); `P1 p.9–13` (Company Info fields, all `String`); `P1 p.14` (movers groups and categories); no matching code in `src/providers/dhan/`. |
| **Required work** | First, obtain the request/response schemas for all three endpoints. Then implement each as **supporting context only** — with explicit as-of labelling ("TTM / point-in-time as of the latest closed candle"), strict numeric parsing of the `String` fields, and an explicit unknown/NA state that is **never** coerced to `0`. |
| **Dependencies** | G-01, G-14, G-16, D-1, D-2, D-20, D-21, D-22. |
| **Risks** | (i) **Category error**: presenting a TTM ratio snapshot as if it were financial statement data — the precise failure the standing caution names. (ii) **Unit mixing**: `₹ crore` vs `₹` vs percentages, all typed as `String`. (iii) **Indicator aliasing**: `STOCHASTIC` vs `STOCH`. (iv) **No canonical home**: D03 cannot hold these values — they need a separate, clearly-typed context payload, which is a **design decision for a separately authorised work item**, not for this assessment. |
| **Validation criteria** | Schemas documented; strict-parse tests including malformed/NA/thousands-separator inputs; an as-of label present in every emitted record; an explicit assertion that no analytics record is emitted as a `FundamentalStatementPayload`. |
| **Dhan subscription needed?** | **YES.** |
| **Vendor clarification needed?** | **YES** — all three schemas, plus the accepted indicator identifiers (D-1) and the period semantics (D-21). |

---

### G-14 — Documented gaps remain unresolved

| | |
|---|---|
| **Severity** | **High** |
| **Classification** | `UNCERTAIN` |
| **Current state** | Sixteen of the twenty-six discrepancies in §6 are **not resolvable from the published set**. The most consequential absences are the disconnect-code table, the `/marketfeed/quote` request/response schema, the historical request/response schema, the analytics schemas, and any HTTP-status ↔ vendor-code mapping. |
| **Evidence** | §6, entries D-1…D-26; the coverage register's "referenced but never defined" table (§2.3). |
| **Required work** | Consolidate the unresolved items into a **single clarification request** addressed to the vendor (§11.3), prioritised by the gap they block: disconnect codes (G-04) → Quote schema (G-05, G-08) → historical schema (G-08) → analytics schemas (G-10) → status↔code mapping (G-06) → rate-limit scope (G-07) → face value (G-02) → side convention (G-03). |
| **Dependencies** | A vendor communication channel (not a technical dependency). |
| **Risks** | The risk is **delay**: an implementation started against an assumed schema will need rework. Because these gaps are enumerated with page citations, the request can be specific and answerable. |
| **Validation criteria** | Each of the 16 unresolved items is marked **answered / unanswered**, with the answer attached to this package as evidence. |
| **Dhan subscription needed?** | Partly — some items (schemas) are best answered by observation. |
| **Vendor clarification needed?** | **YES** — this gap *is* the clarification need, consolidated. |

---

## 10.4 Medium and Low gaps

### G-11 — `/marketfeed/ltp` and `/marketfeed/ohlc` absent

**Severity:** Medium · **Needs:** subscription (Yes) · clarification (partly — the OHLC schema *is* documented in `P3`)

IPD calls only `/marketfeed/quote`. The **LTP** endpoint is the natural fit for a batched, cheap price read and the only one whose request shape is *not* documented; the **OHLC** endpoint is the one surface with a **published schema** (`P3 p.1–2` — segment-keyed integer arrays in, `last_price` + `ohlc{…}` out). **Required work:** a batched LTP/OHLC adapter carrying the 1,000-instrument cap and the 1 req/sec family limit. **Risks:** the OHLC response has **no volume and no timestamp**, so it cannot satisfy D01 (which requires `volume` and `last_trade_time`) — it is a D02-adjacent snapshot, not a quote substitute. **Validation:** a schema-conformance test against `P3`'s documented shape; a test that the request body uses **integer** arrays (the documented form) rather than IPD's string convention.

### G-12 — `/charts/intraday` absent

**Severity:** Medium · **Needs:** subscription (Yes) · clarification (Yes — no schema at all)

Only daily candles are implemented. `P2 p.1` names `/charts/intraday` as "Get OHLC for minute timeframe" and states nothing else — no parameters, no interval granularity, no session-window semantics. **Required work:** schema + session semantics (which minutes, which timezone, trading-session boundaries) before any implementation. **Risks:** intraday candles are the most timestamp-sensitive data in the set, and D02's `isAdjusted` problem compounds here. **Validation:** documented schema; a candle-boundary test against a known session; explicit session/timezone handling.

### G-13 — `GET /v2/instrument/{exchangeSegment}` absent

**Severity:** Medium · **Needs:** subscription (No) · clarification (Yes)

IPD uses the two CSV files only. The segment REST endpoint (`P9 p.1`) has no documented response, no rate limit and no parameters. **Required work:** clarify its response shape and its relationship to the CSVs — specifically whether it is a *subset* view of the same master or a different, more current source. **Risks:** if it is more current than the CSV, IPD's P07-based registry would be working from the staler of two available sources. **Validation:** a documented comparison of the endpoint's coverage against the CSV's for one segment.

### G-15 — Operational hardening absent

**Severity:** Medium · **Needs:** subscription (No) · clarification (partly)

No visible retry policy, no circuit breaker, no evident vendor-call timeout, and no retry-vs-fail classification. `800` (Internal Server Error) and `814` (Invalid Request) are indistinguishable, so retry policy cannot differ. **Required work:** a retry policy keyed to the *vendor code* (transient vs permanent), a circuit breaker, an explicit timeout, and a bounded-backoff reconnect path for any future feed. **Dependencies:** G-06 (the code classification this depends on). **Risks:** a blanket retry policy would amplify a throttle — which is exactly why the retry decision must key on the parsed code, not on the status. **Validation:** a retry-classification test table; a circuit-breaker open/half-open test; a test that a throttled request is **not** retried aggressively.

### G-16 — Indicator and company-info typing/unit handling absent

**Severity:** Medium · **Needs:** subscription (Yes) · clarification (Yes)

Every Company Info field is a `String` with an unstated format; units mix `₹ crore`, `₹` and percentages (DQ-9). The indicator identifier set is ambiguous (D-1, D-2). **Required work:** strict numeric parsing with an explicit unknown state; per-field unit normalisation into IPD's base units; a documented vendor-identifier → canonical-identifier map with an `UNCERTAIN` state for unconfirmed identifiers. **Risks:** the silent-corruption cases — a lenient `parseFloat` yielding `NaN`, a `|| 0` yielding a fabricated zero, and crore/rupee mixing by 10⁷. **Validation:** strict-parse tests covering thousands separators, unit prefixes, `NA`, empty strings, and negatives where invalid.

### G-17 — News capability is referenced but undocumented

**Severity:** Low · **Needs:** subscription (partly) · clarification (Yes)

`P1 p.13` supplies a 17-value news-category enum for a "Live News Headline API" whose **document does not exist in the set**. D06's own vocabulary (`CORPORATE`/`EARNINGS`/`REGULATORY`/`MACRO`/`MARKET_ROUNDUP`) does not map onto Dhan's (§5.5). **Required work:** obtain the document, then decide the mapping — noting that `EARNINGS` has no Dhan counterpart and `REGULATORY` and `MARKET_ROUNDUP` have none either. **Risks:** a naive mapping would mis-tag news events; `sentimentScore` and `relevanceScore` (both mandatory in D06) have no documented Dhan equivalent at all. **Validation:** a documented mapping table with an explicit **unmapped** state.

### G-18 — Segment coverage limited to `NSE_EQ`/`BSE_EQ`

**Severity:** Medium · **Needs:** subscription (Yes) · clarification (Yes)

IPD's identity API maps only `NSE`→`NSE_EQ` and `BSE`→`BSE_EQ` (`dhan_identity_api.ts:32`). Dhan documents six segments (`P1 p.1`); `P6` states depth is **NSE Equity and Derivatives only**. Canonical D01/D05 accept only `exchange: 'NSE' | 'BSE'`. **Required work:** a decision on whether derivatives/commodities are in scope — which is partly an **IRR/roadmap** decision (W08 security-to-issuer bridge, W05 rights) and partly a **contract** question (D01/D05's exchange enum). **Risks:** expanding canonical exchange coverage is a contract change and is **not** proposed here. **Validation:** an explicit, documented scope decision; if expanded, a canonical-contract change under separate authorisation plus D3D export-map updates.

### G-19 — Batching not exploited

**Severity:** Low · **Needs:** subscription (No) · clarification (No)

The documented cap is **1,000 instruments per request** (`P4 p.1`, `P8 p.1`) and the vendor's own first best practice is "Batch requests — use multi-instrument endpoints" (`P8 p.1`). IPD issues one request per instrument. **Required work:** a batched request path for LTP/OHLC. **Risks:** low; batching changes the limiter's dynamics and must be reconciled with G-07. **Validation:** a test that a 1,000-instrument batch is accepted and a 1,001-instrument batch is refused locally.

### G-20 — Option Chain surface absent

**Severity:** Low · **Needs:** subscription (Yes) · clarification (Yes)

`P8 p.1` documents Option Chain limits (1 req / 3 sec, 10 unique scrips / 8 sec) but **no Option Chain endpoint URL or schema appears anywhere in the set**. IPD has no Option Chain surface. **Required work:** obtain the endpoint and schema before any assessment of fit. **Risks:** the dual-limit semantics (both enforced together) and the unique-scrip window are unusual and would need a bespoke limiter. **Validation:** documented endpoint + schema; a test for both limit gates independently.

---

## 10.5 Gap-to-roadmap alignment

| Gap | Roadmap row | Note |
|---|---|---|
| G-01 | **W06** | The visible blocker; W-06's record is unchanged by this package |
| G-02 | **W04**, **W05** | Identity coverage and financial coverage — **Dhan is not on the critical path** |
| G-03, G-04 | W06, W13 (liquidity context) | Not required by any roadmap row as written |
| G-05, G-06, G-07, G-15 | W06, W19 | **Provider quality** — IPD-owned, no roadmap row required |
| G-08, G-12 | W06, W13 | Price history for valuation |
| G-09 | W04 | Identity integrity |
| G-10 | W05, W10, W12 | Context only — **not** engine inputs under GD-2 |
| G-11, G-13 | W08 | Bridge material |
| G-14 | W05 | Source verification |
| G-16, G-17, G-18, G-19, G-20 | W18 (capability boundaries) | Explicitly "other surfaces and capability boundaries" |

**Observation:** the gaps that IPD can close **on its own authority** (G-05, G-06, G-07, G-09, G-15, G-19)
are all provider-quality gaps; the gaps requiring vendor engagement (G-01, G-03, G-04, G-08, G-10, G-12,
G-13, G-14, G-16, G-17, G-18, G-20) are exactly the ones requiring either entitlement or
clarification. **This is the central triage result of the assessment.**
