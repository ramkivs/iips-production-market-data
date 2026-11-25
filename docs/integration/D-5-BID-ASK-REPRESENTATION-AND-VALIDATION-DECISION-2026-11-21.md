# D-5 — Bid/Ask Representation and Validation Decision

**Decision ID:** D-5
**Status:** **ACCEPTED — APPROVED** (amended by **Addendum A**, §7, 25 November 2026)
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

> **Superseded in part — see Addendum A (§7).** The third row above governs a *supplied
> malformed level*, not a book in which **every** level on **both** sides is zero-filled.
> Since 25 November 2026 that entirely zero-filled book is classified **ABSENT MARKET
> BOOK** and yields `bid: null` / `ask: null` with a **valid** quote. Individual malformed
> levels — including a single reachable zero inside an otherwise real book, and any mixed
> or half-empty book — are still rejected exactly as this section states.

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
