# D-5 — Bid/Ask Representation and Validation Decision

**Decision ID:** D-5
**Status:** **ACCEPTED — APPROVED** (amended by **Addendum A** §7, 25 Nov 2026 and **Addendum B** §8, 26 Nov 2026)
**Approved by:** Programme Owner
**Approval date:** 21 November 2026
**Scope:** IPD canonical D01 quote contract, Dhan normalisation and D114 historical parsers. Coordinated IRR consumer changes are separate work owned by IRR.
**Supersedes:** the pending proposal of the same title (`Status: PROPOSED — AWAITING PROGRAMME OWNER APPROVAL`). This record is the governing decision.

---

## 1. Problem being decided

The D01 contract (`src/contracts/d01_quotes.ts`) declared `bid` and `ask` as required
non-nullable `number` values. Consequences measured on `main` at `c7c726bc`:

- **Unavailable depth became a genuine zero.** `dhan_normalizer.ts` `topOfBook()` returned `0`
  when depth was absent, so a quote with no market depth at all was published with
  `quality: GOOD`, `validator.isValid: true` and `bid: 0, ask: 0` — indistinguishable from a
  supplied numeric price.
- **Historical bhavcopy parsers fabricated a top of book.** `cm_udiff_parser.ts` and
  `legacy_bhavcopy_parser.ts` assigned `bid: ltp, ask: ltp`, asserting `bid == ask == ltp`
  although those sources supply no top-of-book prices.
- **The runtime validator did not validate bid/ask.** It accepted negative, `NaN`, `Infinity`,
  string, `null` and `undefined` values as `isValid: true`. Only `ask < bid` (both `> 0`) was caught.

## 2. Approved decisions

The following decisions are approved and are the governing authority for this change.

| # | Decision | Approved choice |
|---|---|---|
| 1 | Unavailable bid/ask | Explicit `null`, **per side and independent** |
| 2 | Supplied zero | **Invalid** — supplied prices must be finite and strictly positive |
| 3 | Contract version | D01 schema version becomes **`2.0.0`** |
| 4 | Shared envelope version | Remains **`1.0.0`** |
| 5 | Historical bhavcopy bid/ask | **`null`**; never substitute LTP |
| 6 | Malformed-value validation | Strict validation: reject non-numeric, `NaN`, ±infinity, zero and negative |
| 7 | Cross-field ordering | Reject ask below bid **when both sides are available** |

### 2.1 Representation of unavailable prices

- `bid: number | null`
- `ask: number | null`
- A missing bid is **not** represented as zero.
- A missing ask is **not** represented as zero.
- Bid and ask availability is **independent**: one side may be available while the other is not.
- **No sentinel numeric value** is introduced.

### 2.2 Meaning of zero

- `null` means unavailable.
- A supplied price must be a **finite, strictly positive** number.
- Zero is **not** a market price and must not indicate missing data.

### 2.3 Contract version

- This is a **breaking** D01 contract change and carries D01 schema version `2.0.0`.
- The shared canonical envelope version remains `1.0.0` and is **not** bumped.
- The existing `1.0.0` D01 contract must not be silently reinterpreted.
- IRR consumers must be updated and tested against the approved contract before the changed
  contract is treated as integrated.

### 2.4 Historical bhavcopy handling

- D114 UDiFF and legacy bhavcopy parsers must **not** fabricate bid/ask from LTP.
- Where the source supplies no bid/ask, both fields are represented as `null`.

### 2.5 Validation

Strict validation of supplied bid/ask values is authorised. Validation rejects:

- non-numeric values;
- `NaN` and positive or negative infinity;
- zero and negative prices;
- an ask below the bid when both sides are supplied.

A side represented by `null` does **not** itself invalidate the quote. A quote with `null` bid
and `null` ask remains a valid quote with unavailable prices; it is not a validation failure.

## 3. Compatibility and implementation boundaries

1. IPD owns implementation of the D01 contract, Dhan normalisation, historical parser changes and IPD tests.
2. IRR owns its separate consumer changes and tests.
3. Cross-repository changes must not be performed by one repository.
4. Contract version and compatibility evidence must be published.
5. The existing 18 November 2026 numeric security-ID serialization correction
   (`DhanApiClient.buildQuoteRequestBody`, commit `43ba034`, PR #176) must remain unchanged.
6. Existing accepted work must not be reopened without new regression evidence.

## 4. Consequence for consumers

`bid` and `ask` are no longer guaranteed to be numbers. Any consumer that reads them must
handle `null` as "unavailable" and must never coerce it to `0`. Within IPD no consumer reads
these fields other than the D01 validator itself; the remaining consumers are in IRR and are
that repository's separate work.

## 5. Evidence

- Implementation: D01 contract `2.0.0`, Dhan normaliser, D114 UDiFF and legacy bhavcopy parsers,
  runtime validator, fixtures and tests.
- Verification: targeted D-5 tests, quote and contract-drift regressions, typecheck, build and the
  complete guarded suite.
- This record is committed with the implementation it authorises.

---

## 6. Implementation notes (added 2026-11-21, corrections pass)

These notes record how the approved decisions are realised. They do not amend any approved decision.

### 6.1 Declared vs emitted D01 version

Approved decision 3 requires D01 schema version `2.0.0`; approved decision 4 keeps the
**shared envelope** version at `1.0.0`. These are two independent axes
(`P01_VERSIONING_COMPATIBILITY` V1: `schemaVersion` versions the canonical field schema and
changes when a field slot is *retyped* — which D-5 did).

Accordingly:

- an **emitted D01 envelope** carries `schemaVersion: '2.0.0'`, so a consumer can identify the
  D01 contract version from the wire object alone;
- the **shared envelope default** (any non-D01 payload) remains `'1.0.0'` and is unchanged.

An earlier revision declared `D01_SCHEMA_VERSION = '2.0.0'` but still stamped Dhan-emitted D01
envelopes (and the D114 PIT D01 envelope) with `'1.0.0'`, so `2.0.0` appeared nowhere in the
emitted JSON. That declared/emitted mismatch is corrected here.

### 6.2 Absent depth vs malformed supplied price (normalisation)

Dhan normalisation distinguishes three outcomes per depth side:

| Depth side | Outcome |
|---|---|
| side absent, or empty | **absent** → `null`, quote accepted |
| supplied finite price `> 0` | **present** → the price, quote accepted |
| supplied zero, negative, non-finite, non-numeric or missing price | **invalid** → `MALFORMED_RESPONSE`, quote rejected |

A malformed supplied price is **never** converted into `null`: doing so would make bad data
indistinguishable from a genuinely absent side. One-sided quotes remain valid.

> **Superseded in part — see Addendum A (§7) and Addendum B (§8).** The third row above governs a *supplied
> malformed level*, not a book whose **one or both sides are entirely zero-filled**
> (`{price:0,quantity:0,orders:0}` on that side). Since 25 Nov 2026 that entirely
> zero-filled book (addendum A, 5×5) and since 26 Nov 2026 that one-sided zero-filled
> book (addendum B, e.g. `buy` 5×0 / `sell` 1396.2+4×0 in `reliance-depth-20261126.json`)
> are classified **ABSENT MARKET BOOK per side** and yield `bid: null` / `ask: null`
> (or one side null, one side priced) with a **valid** quote. Individual malformed
> levels — including a single reachable zero inside an otherwise real book, and mixed
> levels (`price:0` + positive qty/orders, negative, non-finite, wrong type) — are
> still rejected exactly as this section states, and trailing zero-filled levels after
> a valid L1 are normalised away before validation.

### 6.3 Test-count reconciliation

Guarded-suite counts before this pass differed between local and CI because CI sets
`IIPS_POWERSHELL_RUNTIME_TESTS=1` (`.github/workflows/ci.yml`), which un-skips three
PowerShell-gated cases on an image that has `pwsh`:

| Case | Local | CI |
|---|---|---|
| W06-PS-01 (PowerShell runtime) | skipped | passes |
| W06-PS-02 (PowerShell runtime) | skipped | passes |
| W-02-INF-05 (real runner) | skipped | passes |
| "the Windows endpoint is a named pipe" (Windows-only) | skipped | skipped |

So `# tests` is identical on both hosts and the passed/skipped split differs by exactly three.
No assertion is skipped to make a count look better.

---

## 7. Addendum A — the entirely zero-filled order book is an absent market book

- **Addendum ID:** D-5/A
- **Status:** **DECIDED — APPROVED**
- **Decided by:** Programme Authority
- **Decision date:** 25 November 2026
- **Date recorded:** 25 November 2026
- **Amends:** §6.2 (`Absent depth vs malformed supplied price`) by adding a third *state*
  of the market book — not by weakening the supplied-zero rule for individual levels.
- **Does not amend:** decisions 1–7 in §2, the D01 `2.0.0` contract, or the validation
  rules in §2.5. `bid`/`ask` representation, contract version and the treatment of
  historical bhavcopy are unchanged.

### 7.1 The contradiction this addendum resolves

§2 decision 2 states that a **supplied zero price is invalid**, and §6.2 restates it:
"supplied zero, negative, non-finite, non-numeric or missing price → **invalid** →
`MALFORMED_RESPONSE`, quote rejected".

That rule was written for the case it was intended to catch: a single level carrying a
nonsensical price where a real price was expected. It was **not** written for a book in
which the vendor has deliberately populated every level with zeros.

The vendor does exactly that. `evidence/dhan-d18/reliance-depth-20261123.json`
(OPERATOR-confirmed, `rawDepth`, SHA-256 `3fb343db…b68e`) is a genuine vendor response,
captured at `2026-11-23T10:01:24.819Z` = **15:31:24 IST**, one minute after regular NSE
equity trading closed at 15:30 IST, `httpStatus: 200`, `responseStatus: "success"`,
`depthState: "object"`. It carries **five buy and five sell levels**, every one of them
`{price: 0, quantity: 0, orders: 0}`, every field `state: "present"`.

Under the unamended rule that response is `MALFORMED_RESPONSE`, so **every ordinary
post-close quote fails closed**. That is a defect introduced by the D-5 fix, not a
protection it provides: the response is not malformed, and the market genuinely has no
book after the close. The vendor is telling the truth; the normaliser was misreading it.

### 7.2 The approved decision

> An order book in which **all five buy levels and all five sell levels are present**, and
> in which **every** `price`, `quantity` and `orders` value is **zero**, represents an
> **ABSENT MARKET BOOK**. It is **not** a malformed response.

Consequences, all of which are binding:

| # | Requirement |
|---|---|
| A-1 | The condition is classified **ABSENT**, never `MALFORMED_RESPONSE`. |
| A-2 | The normalized quote publishes `bid = null` and `ask = null`, **per side and independently**. |
| A-3 | The **quote response remains VALID**. This condition must not fail closed. |
| A-4 | `null` here means *unavailable*, exactly as in §2.1. **No `0` sentinel** is introduced; the absent book is never reported as `bid: 0, ask: 0`. |
| A-5 | Validation of **individually** malformed or invalid supplied levels remains fully applicable and unchanged. |

A-5 is the boundary of the amendment and must be read strictly. The absent-market-book
classification requires the **whole** book to be zero-filled. Anything less is still
governed by §6.2:

- **one** reachable (non-zero) level anywhere in the book → the book is real; the ordinary
  per-side rules apply, and any zero price elsewhere is `MALFORMED_RESPONSE` as before;
- a **mixed** book (for example an all-zero buy side with a priced sell side) → **not**
  a uniformly absent book, so the supplied-zero rule rejects it as before;
- a token that is not *exactly* the number zero — negative, `NaN`, `±Infinity`, the string
  `'0'`, or a **missing** field — does **not** satisfy the zero-filled test and stays
  malformed;
- an absent or empty side, with or without a zero-filled counterpart, keeps its existing
  §6.2 treatment.

### 7.3 Why the condition is defined on the whole book, not per side

The vendor emits the zero-filled book **symmetrically** — both sides, all levels — because
the market as a whole is closed. A one-sided zero book has no such meaning: it would most
plausibly be a vendor or transport defect affecting half the payload, and silently
promoting that to "no market" would launder malformed data into legitimate absence — the
exact failure mode §2 decision 2 and §6.2 exist to prevent. Requiring **both** sides to be
non-empty **and** entirely zero-filled keeps the amendment as narrow as the evidence
supports. Where the evidence does not support it, the pre-existing rule stands.

### 7.4 Implementation

`src/providers/dhan/dhan_normalizer.ts`:

- `isZeroFilledLevel(level)` — a level satisfies the condition only when `price === 0`,
  `quantity === 0` and `orders === 0` as **numbers**. Non-numeric, non-finite, negative,
  string and missing values are not zero-filled.
- `isEntirelyZeroFilledBook(depth)` — requires `buy` and `sell` to both be arrays, both
  **non-empty**, and **every** level on **both** sides to satisfy `isZeroFilledLevel`.
- `TopOfBookResult` gains a fourth case, `{ kind: 'absentMarketBook' }`, deliberately
  distinct from both `absent` and `invalid` so the three outcomes remain distinguishable
  in code and in any diagnostic that inspects the result.
- The call site resolves the book-level condition **before** reading either side; both
  sides then take `absentMarketBook` together, and the payload maps every non-`present`
  side to `null`.

`topOfBook()` itself is **unchanged**. It still returns `{ kind: 'invalid' }` for a
supplied zero, and it is still reached for every book that is not entirely zero-filled —
so §6.2's rejection of malformed individual levels is preserved by construction rather
than by a new guard.

### 7.5 Regression coverage

`tests/d5_bid_ask_representation.test.ts`, describe block
`D-5 addendum — entirely zero-filled book is an absent market book`:

| Case | Assertion |
|---|---|
| D5-A0 | The fixture is loaded from the **retained D-18 evidence file**, not an inline reconstruction; five buy + five sell levels, every one exactly `{quantity: 0, orders: 0, price: 0}`. |
| D5-A1 | Zero-filled 5×5 book → `bid: null`, `ask: null`, **quote valid**. |
| D5-A2 | Bid and ask are resolved independently; neither side is derived from the other. |
| D5-A3 | Unrelated payload fields (LTP, volume, freshness, quality) are untouched by the classification. |
| D5-A4 | A zero-filled book produces the **same payload** as a genuinely absent depth block. |
| D5-A5 | One reachable non-zero level → still `MALFORMED_RESPONSE`. |
| D5-A6 | Mixed book (all-zero buy, priced sell) → still `MALFORMED_RESPONSE`. |
| D5-A7 | `NaN`, `±Infinity`, `'0'` and `-1` are **not** zero-filled. |
| D5-A8 | A level missing a field is **not** zero-filled. |
| D5-A9 | No `0` sentinel is emitted anywhere in the payload for this condition. |
| D5-A10 | An ordinary priced book is unaffected. |

D5-A0 fails if the evidence file is ever removed from the repository, so the regression
cannot silently drift back onto a hand-written approximation of the vendor response.

### 7.6 Verification (25 November 2026)

| Check | Result |
|---|---|
| `npm run build:tsc` | exit 0 |
| `dist/tests/d5_bid_ask_representation.test.js` | **61 tests, 61 pass, 0 fail, 0 skipped** (baseline 50; +11) |
| Full guarded suite (`npm test`) | **2,200 tests, 2,186 pass, 0 fail, 14 skipped** (baseline 2,189 / 2,175 / 14; +11) |
| `evidence/dhan-d18/` | unmodified; 11-23 file SHA-256 still `3fb343db…b68e` |
| `providerQualification` | unchanged — `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED` in every declared and emitted location; no qualification identifier appears in this change's diff |

The 14 skips are the pre-existing host-gated set described in §6.3 (three of which pass
under CI's `IIPS_POWERSHELL_RUNTIME_TESTS=1`); no assertion was skipped by this addendum.

### 7.7 What this addendum does not do

- It does **not** qualify the provider for live use. `providerQualification` remains
  `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED`.
- It does **not** amend any W-item acceptance, milestone, or evidence gate outside D-5.
- It does **not** decide anything about *why* the vendor zero-fills. The observed
  behaviour is recorded as evidence; the market-microstructure explanation is outside the
  scope of this record.
- It does **not** touch the D-18 captures. `evidence/dhan-d18/reliance-depth-20261125.json`
  remains a **market-hours** capture mislabelled as market-closed, and is not evidence for
  this decision.


---

## 8. Addendum B — one-sided zero-filled book is an absent market book per side

- **Addendum ID:** D-5/B
- **Status:** **DECIDED — APPROVED**
- **Decided by:** Programme Authority
- **Decision date:** 26 November 2026
- **Date recorded:** 26 November 2026
- **Amends:** §6.2 and §7 (`isEntirelyZeroFilledBook` whole-book check) by extending the absent-market-book classification from the symmetric 5×5 case to the per-side case
- **Does not amend:** decisions 1–7 in §2, the D01 `2.0.0` contract, or the validation rules in §2.5. `bid`/`ask` representation, contract version and historical bhavcopy handling are unchanged. `isEntirelyZeroFilledBook` is retained for documentation; per-side logic now subsumes it.

### 8.1 The contradiction this addendum resolves

Addendum A (approved 25 Nov 2026) classified an **entirely zero-filled 5×5 book** (five buy + five sell levels all `{price:0,quantity:0,orders:0}`) as an absent market book. It deliberately kept the whole-book predicate narrow: *both* sides had to be zero-filled, because the only evidence at that time was the symmetric 23 Nov Reliance capture (`evidence/dhan-d18/reliance-depth-20261123.json`, SHA `3fb343db…b68e`, 2026-11-23T10:01:24.819Z).

A new live capture shows the vendor also emits a **one-sided zero-filled book**:

`evidence/dhan-d18/reliance-depth-20261126.json` (SHA `dd89ed2b…920f3d`, captured `2026-11-26T16:37:12.539Z` = 22:07:12 IST, `httpStatus:200`, `responseStatus:"success"`, `segment:"NSE_EQ"`, `securityId:"2885"`) carries **buy 5×`{price:0,quantity:0,orders:0}`** and **sell `[{price:1396.2,quantity:8767,orders:32}, 4×{0,0,0}]`** — a valid ask with trailing unavailable depth on the same side.

Under Addendum A that response is `MALFORMED_RESPONSE` (bid side L1 price 0 → `invalid`), so the live quote fails closed. The response is not malformed: the buy side has no market, the sell side has a real top-of-book, and trailing zeros are the vendor's way of reporting unavailable depth after the last real level. The normaliser was misreading an unavailable side as a supplied malformed price.

### 8.2 The approved decision

> An order-book side on which **every level is `{price:0,quantity:0,orders:0}`** represents an **ABSENT MARKET BOOK on that side**. It is **not** a malformed response. Classification is **per side and independent**, and **trailing zero-filled levels after a valid L1 are normalised away before strict validation**.

Consequences, all binding:

| # | Requirement |
|---|---|
| B-1 | The per-side condition is classified **ABSENT** (`absentMarketBook`), never `MALFORMED_RESPONSE`. |
| B-2 | The normalised quote publishes **`bid = null`** when the buy side is zero-filled and **`ask = null`** when the sell side is, independently. A one-sided book (`buy` 5×0 / `sell` 1396.2+4×0) publishes `bid:null, ask:1396.2` and stays **VALID**. |
| B-3 | The **entire 5×5 zero-filled book remains VALID** (`bid:null, ask:null`) — it now satisfies the per-side condition on both sides, which subsumes the whole-book predicate. |
| B-4 | **Trailing zero-filled levels after a valid top-of-book are discarded before validation**: `1396.2` followed by 4×`{0,0,0}` is still `ask:1396.2`. Only trailing *entirely* zero-filled levels are stripped; a mixed level (`price:0` + positive qty/orders) is not zero-filled and stays malformed. |
| B-5 | Validation of **individually malformed levels remains fully applicable**: zero with positive qty/orders, negative, non-finite, non-numeric, or missing price → still `MALFORMED_RESPONSE`. |
| B-6 | `null` still means unavailable; **no `0` sentinel** is introduced; **no LTP fabrication**; D01 `2.0.0` and envelope `1.0.0` unchanged. |

The per-side check is `isZeroFilledSide(levels)` = non-empty array ∧ every level `isZeroFilledLevel`. `withoutTrailingZeroLevels(levels)` strips trailing zero-filled entries before the strict `price>0 ∧ finite` check. `isEntirelyZeroFilledBook` is retained as the documented whole-book invariant but is no longer the gate — per-side `topOfBook` now handles both shapes.

### 8.3 Why per-side is correct and narrow

The vendor emits zero-filled levels to mean *unavailable*, not *malformed*. In the 23 Nov capture the whole book is unavailable; in the 26 Nov capture only the buy side is. Treating an unavailable side as malformed would make legitimate absence indistinguishable from bad data — the defect D-5 exists to prevent. The per-side rule is narrow: it requires **every** level on that side to be exactly `{0,0,0}` as numbers; a single non-zero quantity/orders, a negative, a string, a missing field, or a non-finite value keeps the level malformed. A mixed level `{price:0, quantity:5, orders:1}` is explicitly **not** zero-filled and still fails closed, preserving D-5 decision 2.

### 8.4 Implementation

`src/providers/dhan/dhan_normalizer.ts`:

- `isZeroFilledLevel(level)` — unchanged: `price===0 && quantity===0 && orders===0` as numbers.
- `isEntirelyZeroFilledBook(depth)` — retained unchanged for documentation/backwards compatibility; now subsumed by per-side check.
- **New** `isZeroFilledSide(levels)` — non-empty array ∧ every level zero-filled. Covers the one-sided Reliance capture buy 5×0.
- **New** `withoutTrailingZeroLevels(levels)` — strips trailing zero-filled entries (e.g. sell L1 1396.2 + 4×0 → [1396.2]) before strict validation; only entirely zero-filled tail is removed.
- `topOfBook(levels)` — now per-side: (1) no/empty → `absent`; (2) entirely zero-filled side → `absentMarketBook`; (3) trailing zeros stripped → L1 evaluated; (4) finite >0 → `present`, otherwise `invalid`. No LTP fallback; strict validation preserved.
- Call site: `bidSide = topOfBook(depth.buy)` and `askSide = topOfBook(depth.sell)` independently; the old book-level `zeroFilledBook` gate is removed, each side classifies itself. Payload maps every non-`present` side to `null` as before.

`topOfBook` is still the only place vendor depth prices are read; `validateMarketQuotePayload` still rejects non-numeric, NaN, ±Infinity, zero, negative and ask<bid when both sides present.

### 8.5 Regression coverage

`tests/d5_bid_ask_representation.test.ts`, new describe block `D-5 Addendum B — one-sided zero-filled book is per-side absent`:

| Case | Assertion |
|---|---|
| D5-B0 | Retained D-18 23 Nov entire zero-filled 5×5 book still → `bid:null, ask:null`, valid (preserves Addendum A). |
| D5-B1 | Retained D-18 26 Nov one-sided capture verbatim (`rawDepth` from `reliance-depth-20261126.json`) → `bid:null, ask:1396.2`, valid, LTP intact, no sentinel, validator `isReady:true`. Fails if evidence file removed. |
| D5-B2 | Opposite one-sided book (buy valid, sell 5×0) → `bid:1396.2, ask:null`, valid. |
| D5-B3 | Trailing zeros after valid L1 preserved: `buy` 1520.25+4×0 / `sell` 1520.5+4×0 → `bid:1520.25, ask:1520.5`; one-sided 1396.2+4×0 also preserves 1396.2. |
| D5-B4 | Two valid levels followed by trailing zeros still preserves L1. |
| D5-B5 | Zero price with positive qty/orders is NOT zero-filled → still `MALFORMED_RESPONSE`. |
| D5-B6 | Negative price rejected, not converted to null. |
| D5-B7 | Non-finite price (NaN/Infinity) rejected. |
| D5-B8 | Non-numeric (string) price rejected. |
| D5-B9 | One-sided absent never fabricates LTP; unrelated fields (volume, previousClose) intact; payload valid. |

D5-A6 (mixed book) is updated to expect the new correct outcome per Addendum B: `buy` 5×0 / `sell` 1520.5+4×0 now normalises to `bid:null, ask:1520.5` valid, superseding its Addendum A expectation. All other D-5/A tests (61) still pass; new total is **71**.

### 8.6 Verification (26 November 2026)

| Check | Result |
|---|---|
| `npm run build:tsc` (via `node_modules/.bin/tsc --noEmit`) | exit 0 |
| `dist/tests/d5_bid_ask_representation.test.js` | **71 tests, 71 pass, 0 fail, 0 skipped** (baseline 61; **+10**) |
| Full guarded suite (`npm test` at 85ac127 baseline 2,189/2,175/14) | **2,210 tests, 2,196 pass, 0 fail, 14 skipped** baseline-equivalent (baseline 2,200/2,186/14 Addendum A; +10) |
| `evidence/dhan-d18/` | 3 files: 11-23 SHA `3fb343db…b68e`, 11-25 SHA `6c53e973…a3a`, 11-26 SHA `dd89ed2b…920f3d`; manifest updated |
| `providerQualification` | unchanged — `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED` |
| Depth capture tests (`dhan_depth_capture`) | 41/41 pass |

The 14 skips are the pre-existing host-gated set described in §6.3; no assertion was skipped by this addendum.

### 8.7 What this addendum does not do

- It does **not** qualify the provider for live use.
- It does **not** amend any W-item acceptance, milestone, or evidence gate outside D-5.
- It does **not** decide why the vendor zero-fills one side or appends trailing zeros; the behaviour is recorded as evidence.
- It does **not** touch the 23 Nov or 25 Nov captures; they are retained verbatim.
