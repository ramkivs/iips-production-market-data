# 8 — IIPS Consumer Capability Mapping

**Purpose:** for each named IIPS consumer, state precisely what Dhan data could contribute, what it
cannot, and — critically — **that Dhan data would be supporting evidence only, never an independent
decision authority**.

**Governing rule (from the standing scope):** *Dhan data must be supporting evidence only, never an
independent decision authority; IIPS retains ownership of analytical decisions and of persisted
report semantics.*

**Roadmap authority:** `docs/integration/IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md` — W01–W20 and
GD-1–GD-7. This package is **assessment only** and changes no roadmap status.

---

## 8.1 The rule, restated operationally

"Supporting evidence only" is enforceable only if it is stated operationally. The following six
rules are what this assessment applies, and each is **already satisfied by the current code**, which
is the strongest evidence that the rule is real rather than aspirational.

| # | Rule | How it holds | Current evidence |
|---|---|---|---|
| CR-1 | **No Dhan value may enter a decision function.** | Decision functions consume IPD canonical contracts; Dhan payloads are normalised into them *before* use and never reach an engine. | `src/providers/dhan/dhan_normalizer.ts` produces `CanonicalEnvelope<MarketQuotePayload>`; vendor DTOs are not exported (`package.ts:12–18`); `D3D-01`/`D3D-02` pin the exact canonical key sets |
| CR-2 | **No Dhan value may become the sole basis of a persisted report.** | Reports persist IPD-owned lineage (NP-04/NP-06 chains) with source, data, model and quote times; a Dhan number appears only as a **cited source value** within that lineage. | Roadmap GD-6, W15–W16; `src/contracts/provenance.ts` (`asOf`, `receivedAt`, `evaluatedAt`, `dataVersion`, `qualityState`, `lineageHash`) |
| CR-3 | **Dhan data may not silently fill a gap.** | Missing/absent data fails closed and is labelled absent, never substituted. | `dhan_normalizer.ts:101–110` refuses `ohlc.close` as `previousClose`; `STALE_DATA_SUPPRESSED` and `MISSING_REQUIRED_FIELD` are distinct codes |
| CR-4 | **Dhan absence may not be reported as IIPS absence, nor the reverse.** | Coverage and source status are reported per-source, not rolled up. | Roadmap GD-3, GD-5; `dhan_freshness_status.ts` exposes `cacheState`, `verdict`, `thresholdSeconds` |
| CR-5 | **A Dhan value must not become the *only* evidence for a conclusion.** | A conclusion requires IIPS-owned evidence; a vendor observation is one input among several and is labelled with its own source time and quality state. | Roadmap GD-2 ("use only traceable issuer-specific inputs… withhold unsupported metrics"), GD-3; `qualityState` + `quarantineReason` in `src/contracts/provenance.ts` |
| CR-6 | **Vendor identity is masked at the consumer boundary.** | Provenance reaching a consumer carries a governed `sourceClassification`/`vendorTier`, not a vendor name. | NFR-06 Provider Masking Enforcement — `sanitizeProvenanceForConsumer` (`src/contracts/provenance.ts`) |

**Corroborating finding from the code.** There is currently **no** IRR/engine/UI/report consumer of
Dhan data at all. The only runtime consumers are the broker-import identity path
(`src/ipc/brokerImportComposition.ts`, `brokerImportConsumer.ts`,
`src/persistence/brokerImportPersistence.ts`) and the provider-neutral local market-data route
(`src/server/market-data/dhanMarketDataRoute.ts`). **A Dhan number cannot currently become a decision
input, because no such path exists.** This is the cleanest possible demonstration that CR-1 is
structural, not merely policy.

---

## 8.2 Personal Portfolio

**Roadmap anchor:** GD-1 (scope and mode), W03 (actual revision/report inventory), W04 (actual
identity coverage), W09 (revision-aware portfolio consumer), W17 (current/reference/degraded
experience).

| Question | Answer |
|---|---|
| **What Dhan could contribute** | A per-instrument market quote (D01) for cash equities on `NSE_EQ`/`BSE_EQ`; daily OHLCV history (D02); the identity bridge from IPD's internal company to Dhan's `securityId`; the instrument-master attributes IPD is missing from other sources (lot size, tick size, exchange segment). |
| **What Dhan cannot contribute** | Portfolio holdings — Dhan has no holdings concept in the published set; valuation of a position (needs a price **and** a holding quantity, and only the price side exists); corporate actions (no endpoint); financial statements (no endpoint); intraday candles (`/charts/intraday` is `MISSING`); live/sub-minute prices (no WebSocket); depth (see §8.6). |
| **Current availability** | **None.** `806` blocks every data call; the identity path is implemented but only 96 of 23,764 candidate equities qualified. |
| **What it would mean if fully available** | Personal Portfolio would gain *market context* for holdings it can already identify — not *holdings*, not *valuation*, not *analysis*. GD-1's "reference / current / degraded" modes would gain a genuine "current" mode for the price column. |
| **Authority impact** | **None.** GD-4 (valuation) and GD-6 (lineage) remain wholly IIPS-owned. A Dhan price is a **cited quote**, with its own source time and freshness verdict, inside an IIPS-owned valuation and report. |
| **Key risk** | If Dhan quote coverage were sparse (it would be: `NSE_EQ`/`BSE_EQ` only, 96 identity-matched instruments), a **partially covered portfolio** could be mis-presented as a valued portfolio. GD-5's current/reference/degraded separation and GD-4's "withhold when inputs cannot support it" are the protections — they must be applied per-position, not per-portfolio. |
| **Classification** | `PARTIALLY_IMPLEMENTED` (quote + identity only), **externally blocked** at runtime |

---

## 8.3 Stock-level Company Analysis

**Roadmap anchor:** W05 (financial coverage and rights), W07 (issuer limitation semantics), W10
(issuer-to-engine input mapping), W11 (issuer-engine execution).

| Question | Answer |
|---|---|
| **What Dhan could contribute** | `/data/companyinfo` — a **trailing, point-in-time** metric snapshot: market cap, industry, sector, EPS (TTM), EBITDA (TTM, ₹ crore), book value, PE/PB/DE, ROE/ROCE, dividend yield (trailing %), 52-week range, promoter/DII/FII/public holding %, and sector-relative averages (P1 p.10–13). Also `/data/technical` — point-in-time indicators as of the latest closed candle (P7 p.1). |
| **What Dhan cannot contribute** | **Statements.** No P&L, no balance sheet, no cash flow, no filing dates, no restatement history, no audit flag. **Dividend sustainability** — `DIVIDEND_YIELD` is a trailing ratio of annual dividend to current price (P1 p.10); there is no payout history, no coverage ratio, no dividend-cycle evidence. **Estimates** (no endpoint). **Corporate actions** (no endpoint). **News** (enum only, no document). |
| **Current availability** | **None.** `/data/companyinfo` and `/data/technical` are `MISSING` in IPD and the account is blocked by `806`. |
| **What it would mean if fully available** | A **context layer**: valuation ratios and peer-relative ratios, an industry/sector classification (which D05 also needs — see §5.4), and technical indicator context. It would **not** satisfy the engine-input requirements of W10/W11, which need issuer-specific, traceable, period-anchored metrics. |
| **Authority impact** | **None — and this is the point that matters most.** GD-2 requires engines to run on *only traceable issuer-specific inputs*, with unsupported metrics **withheld**. Dhan Company Info would be an **additional context input**, never an engine input and never a substitute for statements. The user-directed caution is fully borne out: **Company Information does not provide complete financial statements, cash flows, or sufficient evidence for dividend sustainability.** |
| **Key risk** | **Type confusion.** Every Company Info field is a `String` (P1 p.10–13) and every value is "point-in-time as of the latest closed candle" (P7 p.1). A lenient parser would produce `NaN`s or fabricated zeros; a carelessly-labelled consumer would present a TTM EPS as a statement figure. The mitigation is CR-3 (no silent fill) plus explicit as-of labelling (D-21). |
| **Classification** | `MISSING` |

---

## 8.4 Holding-level Portfolio Decision Support

**Roadmap anchor:** W12 (valuation and alignment methodology), W13 (position valuation and coverage),
W14 (portfolio and cross-sector analytics), W15 (IID assessment and disposition).

| Question | Answer |
|---|---|
| **What Dhan could contribute** | Per-position **market prices** (D01) — the price input GD-4 needs; **historical price series** (D02) for momentum/relative-performance context; **market depth** (§8.6) as liquidity context; **market movers** (`/data/marketmovers`) as market-wide context for relative-performance assessment; technical indicators for positioning context. |
| **What Dhan cannot contribute** | Cost basis, transaction history, weights, position size, risk metrics (no endpoint), factor data (no endpoint), macro context (no endpoint), peer-group membership (no endpoint), corporate actions (no endpoint). |
| **Current availability** | **None.** Additionally, the **holding-level decision-support code path does not exist in IPD** — the NP-04/NP-06 mechanisms live in the IRR repository, and IPD has no consumer that assembles positions into a decision input. |
| **What it would mean if fully available** | GD-4's "count vs money" distinction becomes computable **only where** a position's price is available and the holding identity resolves. W13's coverage policy would need to record, per position, whether the price came from Dhan and how fresh it was. |
| **Authority impact** | **None.** GD-4 fixes the weighting method, denominator, currency, time alignment, exclusion rules and the partial/stale policy; W12 makes those choices. A Dhan price is an **input to an IIPS-defined valuation**, never the valuation itself. |
| **Key risk** | **Time alignment.** Dhan's "day close" is the current session close, only sent post market close (P5 p.6), and the REST `ohlc.close` is inferred to be the same (D-24). A valuation computed against a price from a different trading session than the holding's as-of time would be **silently wrong**. GD-4 requires explicit time alignment; the Dhan side needs an explicit as-of label to make it possible. |
| **Classification** | `MISSING` (IPD side) / `PARTIALLY_IMPLEMENTED` (price primitives only) |

---

## 8.5 Reports / NP-06

**Roadmap anchor:** GD-6 (report lineage), W15 (IID assessment and disposition), W16 (lineage,
staleness and comparison), W19 (preservation/regression).

| Question | Answer |
|---|---|
| **What Dhan could contribute** | A **cited source value** with its own provenance: the quote (D01), the as-of time, the freshness verdict, and the provider identity — as one *input record* inside an IIPS-owned report. |
| **What Dhan cannot contribute** | The **report itself**. Report structure, versioning, comparison semantics and persistence are IIPS-owned via the existing NP-04/NP-06 chains. Dhan has no reporting, artefact or history concept whatsoever. |
| **Current availability** | **None.** |
| **What it would mean if fully available** | Reports would gain a **source-labelled market observation** — with the quote time distinct from the calculation time and the report time, which is exactly what GD-6 asks for ("compare available revision/data/model/quote times; explicitly label unknown/stale"). |
| **Authority impact** | **None, and this must be enforced structurally.** GD-6 requires "explicitly label unknown/stale and preserve old versions". A Dhan-sourced number must appear as a **citation with its own source time**; it must not overwrite, substitute for, or be persisted as if it were an IIPS-computed value. The provenance model (`src/contracts/provenance.ts`) already carries `asOf` / `receivedAt` / `evaluatedAt` / `dataVersion` / `qualityState` / `lineageHash`, and `computeLineageHash` binds payload + source classification + as-of + version into a SHA-256 — so a Dhan-sourced value can be lineage-bound **without** naming the vendor. |
| **Provider masking (important)** | `sanitizeProvenanceForConsumer` (`src/contracts/provenance.ts`, "**NFR-06 Provider Masking Enforcement**") removes vendor-specific internal names and network locations before provenance is emitted downstream, replacing them with a governed `sourceClassification` and `vendorTier`. A consumer-facing report therefore **must not** be able to name "Dhan" from provenance alone — the citation must be made at the **source-classification** level. Any consumer surface that intends to display a vendor name must do so through an explicit, governed decision — **not** by simply emitting raw provenance. |
| **Key risk** | **Report identity.** If a Dhan value were persisted into a report body without a distinct source-time label, then a later report comparing two revisions could not tell whether the difference came from a **new quote** or a **new analysis** — collapsing GD-6's central distinction. Mitigation: the source time must be a first-class field in the persisted record, never inferred. |
| **Classification** | `MISSING` |

---

## 8.6 Depth — the four-product trap, applied to consumers

Because the user directed that depth **must not** be conflated, the consumer view is given per
product:

| Product | Levels | Transport | Consumer value | IPD state | Consumer risk |
|---|---|---|---|---|---|
| REST Full Quote depth | **undocumented** | HTTPS | top-of-book spread for liquidity context | **read** (`dhan_normalizer.ts:132–133`) | Shape, side convention and level count are all undocumented (D-18, D-3). A wrong side silently inverts spread and imbalance. |
| Live-feed 5-level depth | 5 | WebSocket | near-touch book for execution-cost context | `MISSING` | — |
| 20-level Full Market Depth | 20 | WebSocket | demand/supply zones, depth imbalance | `MISSING` | Bid/ask label inversion (D-3); `41`/`51` absent from the annexure (D-12). |
| 200-level Full Market Depth | 200 | WebSocket | full-book liquidity profile | `MISSING` | Same, plus 1 instrument/connection and 3,200-byte packets. |

**Consumer conclusion:** no IIPS consumer may claim "market depth support" on the basis of IPD's
current code. What exists is an **undocumented REST top-of-book read**. Any consumer-facing statement
must name the product.

---

## 8.7 Consumer × capability matrix

`✔` = Dhan could serve it · `✖` = Dhan cannot serve it · `—` = not applicable

| Capability | Personal Portfolio | Stock-level Company Analysis | Holding-level Decision Support | Reports / NP-06 |
|---|---|---|---|---|
| Price quote (D01) | ✔ *(blocked)* | ✔ *(blocked)* | ✔ *(blocked)* | ✔ *(blocked)* |
| Historical candles (D02) | ✔ *(daily only)* | ✔ | ✔ | ✔ |
| Intraday candles | ✖ | ✖ | ✖ | ✖ |
| Live/sub-minute price | ✖ | ✖ | ✖ | ✖ |
| Market depth (any product) | ✖ *(shape undocumented)* | ✖ | ✖ *(shape undocumented)* | ✖ |
| Technical indicators | ✖ | ✔ *(point-in-time)* | ✔ *(context only)* | ✔ *(citation only)* |
| Company fundamentals | ✖ | ✔ *(TTM snapshot only)* | ✔ *(context only)* | ✔ *(citation only)* |
| Financial statements | ✖ | ✖ | ✖ | ✖ |
| Cash flows | ✖ | ✖ | ✖ | ✖ |
| Dividend sustainability evidence | ✖ | ✖ | ✖ | ✖ |
| Corporate actions | ✖ | ✖ | ✖ | ✖ |
| Estimates / consensus | ✖ | ✖ | ✖ | ✖ |
| News | ✖ *(enum only, no doc)* | ✖ | ✖ | ✖ |
| Instrument attributes (lot/tick/segment) | ✔ | ✔ | ✔ | ✔ |
| Face value | ✖ | ✖ | ✖ | ✖ |
| Industry / sector classification | ✔ *(via companyinfo)* | ✔ | ✔ | ✔ |
| Holdings / cost basis | ✖ | ✖ | ✖ | ✖ |
| Market movers | ✖ | ✖ | ✔ *(context only)* | ✔ *(citation only)* |

*(✔ *(blocked)* = technically available in principle but currently blocked by `806`.)*

---

## 8.8 What the matrix says about the roadmap

| Roadmap row | Dhan's contribution | Status effect |
|---|---|---|
| **W03** actual revision/report inventory | none | unaffected |
| **W04** actual identity coverage | **material** — Dhan provides the provider security id; but the binding gate is **P04 correspondence** (23,644 of 23,764 rejected), so Dhan is *not* the constraint | unchanged; Dhan is **not** on the critical path |
| **W05** financial coverage and rights | **limited** — trailing ratios only; **no** statements, cash flows or dividend-sustainability evidence; **no** corporate actions; rights for Dhan data are a separate question | unchanged; W05 needs other sources |
| **W06** market observations and freshness | **the natural Dhan surface** — but **blocked** by `806` | unchanged; W06 status is governed by the W-06 record, which this package does not alter |
| **W07** issuer limitation semantics | **partial** — Dhan's own limitation semantics ("point-in-time as of the latest closed candle", "only the indicators you request are computed") are *upstream* limitations and belong in the limitation set | unchanged |
| **W08** security-to-issuer bridge | **direct** — Dhan's `securityId` + segment + ISIN is the bridge material | unchanged; Dhan is one input |
| **W10** issuer-to-engine input mapping | **context only** — Company Info values are *not* engine inputs under GD-2 | unchanged |
| **W12** valuation methodology | **price input only** | unchanged |
| **W13** position valuation | **price input only** | unchanged |
| **W14** portfolio analytics | **partial** — movers + indicators as context | unchanged |
| **W15** IID assessment | **citation only** | unchanged |
| **W16** lineage/staleness | **source-time label only** | unchanged |
| **W17** current/reference/degraded | **would supply the "current" mode for prices** | unchanged |
| **W19** preservation/regression | **must not regress** the export map (`D3D-04`/`D3D-05`) | unchanged; §12 R-05 |

**Governing observation.** Across all twenty roadmap rows, Dhan is at most a **price-and-context
source**, and the roadmap's own binding gates are **identity correspondence (W04)**, **financial
coverage (W05)** and **market access (W06)** — none of which Dhan alone can satisfy. This is
consistent with the architecture: the roadmap never depends on a single provider, and this
assessment finds no place where it would need to.

---

## 8.9 Consumer-facing statements that are **not** permitted

Derived directly from the evidence, these are the claims no consumer surface may make:

1. "Dhan data is live." — no live feed; REST polling only; `806` blocks even that.
2. "Dhan provides market depth." — must name the product (§8.6); IPD supports none of the three
   documented ones.
3. "Dhan provides financial statements / cash flow." — false (P1 p.9–13).
4. "Dhan supports dividend sustainability analysis." — false; only a trailing yield ratio exists.
5. "Dhan provides analyst estimates." — no endpoint in the set.
6. "Dhan provides corporate actions." — no endpoint in the set.
7. "Dhan provides news." — an enum exists; the API document does not.
8. "Dhan covers the portfolio." — at most `NSE_EQ`/`BSE_EQ` cash equities, and only 96
   identity-matched instruments today.
9. "Dhan provides the previous close." — the REST `close` is *not* the previous close; IPD derives
   `previousClose` from `net_change` and refuses the substitution (D-24).
10. "The error tells us the subscription is inactive." — only out-of-band body inspection reveals
    `806`; IPD's own mapping cannot (D-9).
