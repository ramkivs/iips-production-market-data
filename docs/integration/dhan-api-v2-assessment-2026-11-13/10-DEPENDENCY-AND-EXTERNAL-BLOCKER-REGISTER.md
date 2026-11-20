# 11 — Dependency and External Blocker Register

**Purpose:** everything on the critical path that IPD **cannot** resolve by writing code — vendor
entitlement, vendor clarification, internal data lineage, other repositories, and the operator.

**Rule:** a blocker is only listed here if it is genuinely outside this repository's authority. IPD's
own code quality is registered in §10 (Gap Register), not here.

---

## 11.1 Blocker taxonomy

| Class | Meaning | Owner |
|---|---|---|
| `EXTERNAL_BLOCKER` | Progress requires an action by Dhan or the account holder | Dhan / operator |
| `CLARIFICATION_REQUIRED` | Progress requires a documented answer the published set does not contain | Dhan |
| `INTERNAL_DEPENDENCY` | Progress requires work in another IIPS area or repository | IPD / IRR |
| `CROSS_REPO` | Progress requires the IRR repository (`ramkivs/iips-review-recovered`) | IRR |
| `NOT_BLOCKING` | Recorded for completeness; not on any critical path | — |

---

## 11.2 External blocker register

### B-01 — `EXTERNAL_BLOCKER — DHAN_DATA_API_SUBSCRIPTION_INACTIVE`

| | |
|---|---|
| **Class** | `EXTERNAL_BLOCKER` |
| **State** | **OPEN — unchanged.** |
| **Description** | The Dhan Data API subscription is not active for the account in use. Every Data API call returns **`806` — "Data APIs not subscribed"** (`P1 p.5`), observed as HTTP 401 with body `{"data":{"806":"Data APIs not Subscribed"},"status":"failed"}`. |
| **Evidence** | `P1 p.5`; the W-06 root-cause record published at `c260a82`; `dhan_api_client.ts:311–325` maps the observed 401 to `AUTHENTICATION_FAILURE`. |
| **What it blocks** | **All** Dhan data retrieval: quotes (D01), history (D02), and every not-yet-implemented surface (analytics, depth, intraday, LTP/OHLC, movers). |
| **What it does NOT block** | Everything in IPD that does not call Dhan: the canonical contracts, the normaliser, the orchestrator, the limiter, the identity registry, the local transport, the IRR-facing route, the test suite. **The provider stack is complete and correct; it simply cannot be authorised to run.** |
| **Owner** | The account holder / operator (a commercial and contractual action with Dhan). **Not an engineering task.** |
| **Corroborating exclusion** | W-06 established, by successive evidence, that the failure is **not** transport, **not** credential-format, **not** credential-validity, **not** request conformance, and **not** an IPD defect. The remaining cause is the subscription itself. |
| **Status discipline** | This blocker must **not** be re-diagnosed. Any future claim that it is resolved must be backed by an **observed data response**, not by a change in IPD code. |
| **Authorized-request discipline** | **One** authorized quote request remains **unconsumed**. It must be spent on a **single, purposeful re-qualification** after the subscription is confirmed — not on exploratory probing, and not by this package. |

### B-02 — Vendor clarification: **16 unresolved documentation questions**

| | |
|---|---|
| **Class** | `CLARIFICATION_REQUIRED` |
| **State** | **OPEN** — never raised with the vendor. |
| **Description** | Sixteen of the twenty-six discrepancies in §6 cannot be resolved from the published set (§6 summary). They require a documented answer from Dhan. |
| **Blocks** | G-03, G-04, G-08, G-10, G-12, G-13, G-14, G-16, G-17, G-18, G-20 — and the *correctness* of G-05, G-06, G-07. |
| **Owner** | Dhan (documentation) via the account holder. |
| **Why this is a register entry and not a footnote** | Because it is **quantified and specific**. A generic "the docs are incomplete" is not actionable; sixteen numbered, page-cited questions are. The list is at §11.3. |
| **Does not block** | Any of IPD's existing work. The clarification list can be raised **today**, in parallel with entitlement, because it costs no vendor resource beyond a reply. |

### B-03 — Vendor entitlement for the WebSocket / depth products

| | |
|---|---|
| **Class** | `EXTERNAL_BLOCKER` (conditional) |
| **State** | **UNKNOWN — not determined.** |
| **Description** | The published set documents the live feed and both depth products but **states nothing about their subscription status**. B-01 concerns *Data APIs*; the feed products are documented separately (P5, P6) and may be licensed differently — for example as a paid market-data feed, or bundled with an exchange data agreement. |
| **Blocks** | G-03, G-04, and any sub-minute freshness capability. |
| **Owner** | The account holder / operator. |
| **Note** | It would be an error to assume B-01's resolution implies feed entitlement. **The two must be confirmed separately.** |

### B-04 — Vendor rights for data reuse

| | |
|---|---|
| **Class** | `CLARIFICATION_REQUIRED` / operator decision |
| **State** | **OPEN.** |
| **Description** | Nothing in the nine documents addresses **redistribution, storage or display rights** for Dhan market data. The published reference library's own governance note says its presence "does not establish account entitlement, subscription status, live API availability, or successful production access" — it says nothing about rights either. |
| **Blocks** | Roadmap **W05** ("financial coverage **and rights**") and any decision to persist Dhan-sourced values into IIPS reports (which is precisely what the Reports/NP-06 consumer would do — §8.5). |
| **Owner** | The account holder (commercial terms) with Dhan. |
| **Note** | This is a **rights** question, distinct from the entitlement question. Entitlement says "you may call it"; rights say "you may keep it and show it". For a personal, single-user, local system the answers may be permissive; for persisted reports they may not be. **Not resolvable by reading the API documentation.** |

---

## 11.3 Vendor clarification list — the sixteen questions

Ordered by the gap each one blocks. Every question is **answerable** — none requires a new product.

| # | Question | Blocks | Related §6 entries |
|---|---|---|---|
| Q-01 | What is the **disconnection message code** table referenced by both `P5 p.7` and `P6 p.7`? | G-04 | D-7 |
| Q-02 | What are the **request codes for the depth feed**? `P6 p.6` says "Connect — 41" and "Disconnect — 11", while `P1 p.3` defines `11` = Connect and `12` = Disconnect. Which is correct for the depth product? | G-04 | D-4, D-25 |
| Q-03 | What is the **request and response schema of `POST /marketfeed/quote`**? `P4 p.1` names it and gives no body. Specifically: the depth structure (level count, side labels, field names, units), the field names for volume and trade time, and the `net_change` field. | G-05, G-08, DQ-1…DQ-5 | D-18 |
| Q-04 | Which **bid/ask side convention** applies to each product — the REST Full Quote, the live-feed 5-level depth, and the 20/200-level depth? `P5` pairs Bid↔Buy and Ask↔Sell; `P6 p.4` labels `41` "Bid Data (Buy)" and `51` "Ask Data (Sell)" while `P6 p.4`'s own prose says "bid (sell) and ask (buy)". | G-03, G-05 | D-3 |
| Q-05 | What are the **Feed Response Code rows** for the 20-level and 200-level depth packets (`41`, `51`)? `P6 p.4` says "see Annexure", but `P1 p.4` has no such rows. | G-03, G-04 | D-12 |
| Q-06 | What are the **request parameters and response schema** of `POST /charts/historical` and `POST /charts/intraday` — including the supported intervals, the date-range limit, the timezone, the candle timestamp convention (start or end of period), and whether volume is included? | G-08, G-12 | D-23 |
| Q-07 | What is the **adjustment policy** for historical candles — are prices adjusted for splits, bonuses and dividends, and is there a flag in the response? (`D02` requires `isAdjusted`.) | G-08 | §5.2 |
| Q-08 | What is the **request and response schema** of `POST /data/technical`, `POST /data/companyinfo` and `POST /data/marketmovers`, including units, precision, and the accepted indicator identifiers (`STOCHASTIC` and `STOCH`; `MACD_12`/`MACD_26`/`MACD_HIST`)? | G-10, G-16 | D-1, D-2, D-20, D-21 |
| Q-09 | For Company Info, what is the **period anchor** for the "trailing twelve months" values, and is there any filing date, restatement index or audit flag? | G-10 | D-21 |
| Q-10 | Which **HTTP status codes** correspond to each Data API error code (`800`, `804`–`814`) and each Trading API error (`DH-901`–`DH-910`)? In particular, is `806` always `401`? | G-06 | D-9 |
| Q-11 | Is there a **`Retry-After` header** on rate-limit responses, and what is the correct backoff for each limit family? Is `RL001` returned with a non-`429` status? | G-06, G-07 | D-10, D-13 |
| Q-12 | What are the **rate limits for `/charts/*`, `/data/*` and `/instrument/*`**, and does "Data APIs — 5 req/sec, 100,000/day" include the market-quote endpoints? What is the daily limit for Market Quote and Option Chain (both columns are blank)? | G-07 | D-13, D-14, D-15 |
| Q-13 | Is the `SECURITY_ID` column of the scrip master **stable and guaranteed unique per (exchange segment, security)**? What is the master's **publication cadence**, and is there a **version marker or checksum**? | G-09, G-13 | D-16, D-19 |
| Q-14 | Does **any Dhan source provide face value, industry, sector or listing status**? (Needed to establish that D05 is unreachable from Dhan, not merely unimplemented.) | G-02 | §5.4 |
| Q-15 | What are the **request/response schemas and the endpoint URL** for the "Live News Headline API" whose categories are listed at `P1 p.13`, and for **Option Chain** whose limits are listed at `P8 p.1`? | G-17, G-20 | — |
| Q-16 | What is the **access-token lifetime and rotation procedure**, and can the credential be supplied by **header or/or WebSocket subprotocol** rather than in the URL query string? | S-12, S-14 | — |

**Structural note.** Q-01…Q-16 cover **every** item the published set defers to an external hyperlink or
leaves undefined. If Dhan answers all sixteen, the entire Dhan capability surface becomes
implementable with documented semantics. **That is the single highest-leverage action available.**

---

## 11.4 Internal dependencies (IPD-owned, but not in this package)

These are **not** external blockers; they are recorded so the boundary between "this assessment's
scope" and "the roadmap's scope" is explicit.

| # | Dependency | Owner | Note |
|---|---|---|---|
| I-01 | **P04 identity correspondence** | IPD | 23,644 of 23,764 candidate equities rejected `REJECTED_NO_P04_CORRESPONDENCE` (`evidence/dhan-p7/qualification-report.md`). Even a fully entitled Dhan would cover only the **96** instruments that correspond. **This — not Dhan — is the binding constraint on D05 coverage.** Maps to roadmap W04. |
| I-02 | **D05 attribute sources** | IPD | Face value, industry, sector, listing status and effective dating must come from elsewhere (G-02). |
| I-03 | **Fundamentals source** | IPD | Dhan supplies no statements, cash flows or dividend-sustainability evidence. A separate source is required for roadmap W05/W10. |
| I-04 | **Export-map discipline** | IPD | `tests/dhan_d3d_contract_drift.test.ts` `D3D-04`/`D3D-05` pin the exact package export map. **Any new Dhan surface requires an export-map update**, or those tests fail. This is the principal regression risk to any expansion. |
| I-05 | **Rate-limiter contract change** | IPD | The 60/min bucket is asserted by `tests/dhan_p4_operational_controls.test.ts`; partitioning it (G-07) is a **contract change**, not a tuning change. |
| I-06 | **Canonical exchange enum** | IPD | D01/D05 accept only `'NSE' \| 'BSE'`. Expanding to Dhan's six segments is a **contract change** (G-18). |
| I-07 | **Canonical `isAdjusted` tri-state** | IPD | D02's mandatory boolean cannot honestly represent "unknown" (G-08). A contract change — **not proposed here** (§12 R-09). |

---

## 11.5 Cross-repository dependencies

| # | Dependency | Repository | Note |
|---|---|---|---|
| X-01 | **IRR report and UI layers** | `ramkivs/iips-review-recovered` | The NP-04/NP-06 chains, the IID assessment and the UI live there. IPD's provider-neutral boundary (`src/server/market-data/dhanMarketDataRoute.ts`) is the intended interface. **No Dhan code may cross the boundary.** |
| X-02 | **IRR engines** | same | Engines consume IPD canonical contracts. GD-2 requires *traceable issuer-specific inputs* — Dhan Company Info does **not** meet that bar (§8.3). |
| X-03 | **Portfolio position data** | IRR / persistence | Holding-level decision support needs position and cost-basis data that Dhan does not have (§8.4). |
| X-04 | **Portfolio valuation methodology** | IRR | GD-4 (W12) fixes the weighting method, denominator, currency, time alignment and partial/stale policy. **These are IIPS decisions; Dhan supplies only the price input.** |

---

## 11.6 What is explicitly **not** blocked

Stated plainly, because a blocker register that lists everything is not a blocker register:

- **The provider implementation** is complete for its declared scope and passes 1,712 tests
  (1,708 passing, 4 pre-existing skips, 0 failing) at `c260a82`.
- **The canonical contracts** D01, D02, D03, D05, D06 are unaffected by this assessment and require
  **no change** for the implemented scope (§5.7).
- **The IRR-facing boundary** is provider-neutral and complete.
- **The six fail-closed guards** proposed in §12 (G-05, G-06, G-07, G-09, G-15, G-19)
  work) need **neither entitlement nor clarification** — they are pure internal hardening.
- **The clarification request (Q-01…Q-16)** can be raised **immediately and in parallel** with the
  entitlement action. It costs no vendor resource beyond a reply, and it is the only thing that
  unlocks correct implementation of the entire documented surface.

---

## 11.7 Blocker dependency diagram (textual)

```
                    ┌──────────────────────────────────────────┐
                    │  B-01  Data API subscription inactive    │  EXTERNAL
                    │        (806) — blocks ALL data retrieval  │
                    └───────────────┬──────────────────────────┘
                                    │ activation
                                    ▼
                    ┌──────────────────────────────────────────┐
                    │  B-03  Feed / depth entitlement status     │  EXTERNAL
                    │        unknown — must be confirmed apart  │
                    └───────────────┬──────────────────────────┘
                                    │
   ┌────────────────────────────────┴───────────────────────────────┐
   │                                                                │
   ▼                                                                ▼
┌─────────────────────────────┐              ┌───────────────────────────────┐
│ B-02  Q-01…Q-16            │              │ I-01  P04 identity            │
│ vendor clarification        │─────────────▶│       correspondence          │ INTERNAL
│ (no cost; raise now)        │  enables     │       (23,644/23,764 rejected) │
└─────────────┬───────────────┘  correct     └───────────────┬───────────────┘
              │                  impl.                      │
              ▼                                               ▼
   ┌──────────────────────────────────────┐   ┌───────────────────────────────┐
   │ G-03/G-04 depth + WebSocket          │   │ G-02  D05 attributes          │
   │ G-08/G-10/G-12/G-13 schemas          │   │ (face value — not from Dhan)  │
   └──────────────────────────────────────┘   └───────────────────────────────┘

   ┌───────────────────────────────────────────────────────────────┐
   │ NOT BLOCKED — closable on IPD's own authority:                 │
   │ G-05 depth guards · G-06 vendor-code parsing · G-07 budgets    │
   │ G-09 master integrity · G-15 hardening · G-19 batching         │
   └───────────────────────────────────────────────────────────────┘
```

**Reading of the diagram.** The two external blockers sit **upstream of everything**, which is why
they are Critical. The two internal dependencies sit **downstream** of everything, which is why they
determine the *usable* outcome even after the external blockers clear. And a **six-gap band of
internal hardening** sits outside the dependency structure entirely — it can proceed now, under
IPD's own authority, with no entitlement and no clarification.
