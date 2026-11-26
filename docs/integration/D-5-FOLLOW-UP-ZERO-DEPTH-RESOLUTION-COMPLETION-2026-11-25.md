# D-5 Follow-up — execution and completion record

- **Work item:** **D-5 Follow-up** — Resolve the zero-depth contradiction
  (BLK-1 in `DHAN-LIVE-INVESTIGATION-2026-11-25`)
- **Repository:** IPD (`ramkivs/iips-production-market-data`)
- **Decision authority:** Programme Authority — Ramki
- **Implementation owner:** IPD
- **Branch:** `arena/f93e947f-iips-production-market-data`
- **Date:** 25 November 2026
- **Governing decision:** **Addendum A** to D-5, recorded as **§7** of
  `docs/integration/D-5-BID-ASK-REPRESENTATION-AND-VALIDATION-DECISION-2026-11-21.md`
- **Live vendor request made by this work item:** **no.** The verification reads
  evidence already retained in the repository. No credential was read or used.
- **Status:** **IMPLEMENTED AND VERIFIED.** See §7 for the exact scope of that claim.

---

## 1. The defect being closed

D-5 decision 2 (§2 of the D-5 record) makes a **supplied zero price invalid**, and §6.2
rejects such a level as `MALFORMED_RESPONSE`. That rule was written to catch a single
nonsensical level where a real price was expected.

The vendor does not only emit nonsensical levels. After the regular NSE equity close it
emits a **fully populated book of zeros**. `evidence/dhan-d18/reliance-depth-20261123.json`
is a genuine vendor response — `rawDepth`, SHA-256 `3fb343db…b68e`, captured
`2026-11-23T10:01:24.819Z` = **15:31:24 IST**, one minute after the 15:30 close,
`httpStatus: 200`, `responseStatus: "success"`, `depthState: "object"`, five buy and five
sell levels, every one `{price: 0, quantity: 0, orders: 0}` with every field
`state: "present"`.

Under the unamended rule that response was `MALFORMED_RESPONSE`, so **every ordinary
post-close quote failed closed**. The response is not malformed; the market genuinely has
no book after the close. The defect was introduced *by* the D-5 fix, and it blocked M2 —
freshness and session-awareness work exists to make out-of-session quotes usable, and the
depth rule was rejecting exactly those quotes.

## 2. The decided interpretation

> An order book in which **all five buy levels and all five sell levels are present**, and
> in which **every** `price`, `quantity` and `orders` value is **zero**, represents an
> **ABSENT MARKET BOOK**. It is **not** a malformed response.

The condition is classified **ABSENT**; the quote stays **VALID**; `bid` and `ask` are
**independently** `null`; no `0` sentinel is introduced; and validation of **individually**
malformed or invalid supplied levels is **unchanged and fully applicable**.

The boundary matters and is deliberate. The absent-market-book classification requires the
**whole** book to be zero-filled. A book with a single reachable non-zero level is real, and
any zero inside it is still `MALFORMED_RESPONSE`. A mixed book — all-zero buy with a priced
sell — is **not** uniformly absent and is still rejected. A token that is not exactly the
number zero — negative, `NaN`, `±Infinity`, the string `'0'`, a missing field — does not
qualify. Requiring **both** sides keeps the amendment as narrow as the evidence supports:
the vendor emits the zero book symmetrically because the market as a whole is closed, so a
one-sided zero book would most plausibly indicate a defect, and promoting it to "no market"
would launder malformed data into legitimate absence — precisely what D-5 exists to prevent.

## 3. Files modified

| File | Change |
|---|---|
| `src/providers/dhan/dhan_normalizer.ts` | `TopOfBookResult` gains `{ kind: 'absentMarketBook' }`; new `isZeroFilledLevel()` and `isEntirelyZeroFilledBook()`; book-level check resolved before either side is read; payload maps every non-`present` side to `null`. `topOfBook()` itself is **unchanged**. |
| `tests/d5_bid_ask_representation.test.ts` | New describe block `D-5 addendum — entirely zero-filled book is an absent market book` with **D5-A0…D5-A10**; fixture loaded from the retained D-18 evidence file. |
| `docs/integration/D-5-BID-ASK-REPRESENTATION-AND-VALIDATION-DECISION-2026-11-21.md` | **Addendum A** added as §7; §6.2 cross-references it; header status amended. |
| `docs/integration/DHAN-LIVE-INTEGRATION-CURRENT-STATE-INVESTIGATION-AND-EXECUTION-ROADMAP-2026-11-25.md` | Post-publication status note; D-5 row, work-item row 11 and BLK-1 marked closed. Findings left intact. |
| `docs/integration/D-5-FOLLOW-UP-ZERO-DEPTH-RESOLUTION-COMPLETION-2026-11-25.md` | This record. |

**Not modified:** `evidence/dhan-d18/*` (both capture files and the manifest are byte-identical
to their committed state), any contract, any DTO, any provider qualification path.

## 4. Implementation changes

`isZeroFilledLevel(level)` returns true only when `price === 0`, `quantity === 0` and
`orders === 0` hold as **numbers** on a structurally valid object. `NaN` is not `0`;
`'0'` is not `0`; `-0` and `0` are the same number in JavaScript and both qualify, which is
correct — `-0` is not a distinct vendor token.

`isEntirelyZeroFilledBook(depth)` requires `buy` and `sell` to both be arrays, both
**non-empty**, and **every** level on **both** sides to satisfy `isZeroFilledLevel`. A
missing side, an empty side, a non-array side or a single qualifying exception all return
false, which leaves the pre-existing per-side behaviour in force.

At the call site the book-level condition is resolved **before** either side is read, and
both sides then take `absentMarketBook` together. The existing `invalid` loop runs
unchanged underneath it, so anything that is not wholly zero-filled still fails closed with
the same `MALFORMED_RESPONSE` and the same message.

`absentMarketBook` is kept distinct from `absent` rather than collapsed into it. The two
conditions have different causes — no depth supplied versus a supplied book that denotes no
market — and keeping them separate preserves the distinction for diagnostics and future
session-aware logic without changing today's output. Both produce `null` in the payload.

## 5. Regression tests added

`D5-A0…D5-A10`, all passing:

| Case | Assertion |
|---|---|
| D5-A0 | Fixture is loaded from the **retained D-18 evidence file** — not an inline reconstruction — and every one of its ten levels is exactly `{quantity: 0, orders: 0, price: 0}`. Fails if the evidence is removed. |
| D5-A1 | Zero-filled 5×5 book → `bid: null`, `ask: null`, quote **valid**, validator `errors: []`. |
| D5-A2 | Bid and ask resolve independently; neither is derived from the other. |
| D5-A3 | Unrelated payload fields (LTP, volume, freshness, quality) are untouched. |
| D5-A4 | A zero-filled book produces the **same payload** as a genuinely absent depth block. |
| D5-A5 | One reachable non-zero level → still `MALFORMED_RESPONSE`. |
| D5-A6 | Mixed book (all-zero buy, priced sell) → still `MALFORMED_RESPONSE`. |
| D5-A7 | `NaN`, `±Infinity`, `'0'`, `-1` are **not** zero-filled. |
| D5-A8 | A level missing a field is **not** zero-filled. |
| D5-A9 | No `0` sentinel appears anywhere in the payload for this condition. |
| D5-A10 | An ordinary priced book is unaffected. |

The existing D-5 malformed-level cases (`D5-06`, `D5-07`, `D5-08`, `D5-08a`, `D5-08b`) are
**unchanged and still pass**, which is the direct evidence that individual-level validation
was preserved rather than relaxed.

## 6. Test execution results

| Command | Result |
|---|---|
| `npm ci --no-audit --no-fund` | completed; `node_modules` restored |
| `npm run build:tsc` | **exit 0** |
| `node --test dist/tests/d5_bid_ask_representation.test.js` | **61 tests, 61 pass, 0 fail, 0 skipped** (baseline 50; **+11**) |
| `npm test` (guarded full suite) | **2,200 tests, 2,186 pass, 0 fail, 14 skipped**, guard `OK`, exit 0 (baseline 2,189 / 2,175 / 14; **+11**) |

The 14 skips are the pre-existing host-gated set described in D-5 §6.3 — three of them pass
under CI's `IIPS_POWERSHELL_RUNTIME_TESTS=1`. **No assertion was skipped by this work item**
and `# tests` rose by exactly the eleven cases added.

## 7. Behaviour verification against the retained raw capture

Run against the compiled normaliser, splicing the **verbatim** `rawDepth` object from
`evidence/dhan-d18/reliance-depth-20261123.json` into an otherwise ordinary quote body:

| Input | Outcome |
|---|---|
| **D-18 `rawDepth` verbatim (retained evidence)** | **VALID — `bid: null`, `ask: null`, LTP intact, D01 `2.0.0`, validator `isValid: true`, `errors: []`** |
| empty arrays on both sides | VALID — `bid: null`, `ask: null` |
| no `depth` key at all | VALID — `bid: null`, `ask: null` |
| one reachable level at the back of the book | FAIL-CLOSED — `MALFORMED_RESPONSE` |
| all-zero buy / priced sell (mixed) | FAIL-CLOSED — `MALFORMED_RESPONSE` |
| single negative price level | FAIL-CLOSED — `MALFORMED_RESPONSE` |
| single string price level (`'0'`) | FAIL-CLOSED — `MALFORMED_RESPONSE` |
| single `NaN` price level | FAIL-CLOSED — `MALFORMED_RESPONSE` |
| single `Infinity` price level | FAIL-CLOSED — `MALFORMED_RESPONSE` |
| level missing `price` | FAIL-CLOSED — `MALFORMED_RESPONSE` |

## 8. Acceptance criteria

| ID | Criterion | Status | Evidence |
|---|---|---|---|
| **D5-F1** | Addendum records the interpretation | **MET** | D-5 record §7, Addendum A; §6.2 cross-reference; header status amended |
| **D5-F2** | `topOfBook()` recognises the entirely zero-filled book as absent | **MET** | Book-level classification resolved before either side is read; `topOfBook()` itself unchanged |
| **D5-F3** | Normalized bid/ask `null` with a **valid** quote response | **MET** | D5-A1, D5-A2, D5-A4, D5-A9; retained-capture probe returns `isValid: true` |
| **D5-F4** | Malformed individual levels still fail | **MET** | D5-06/07/08/08a/08b unchanged and passing; D5-A5…D5-A8; nine fail-closed rows in §7 |
| **D5-F5** | Regression fixture covers the retained D-18 zero-filled response | **MET** | D5-A0 loads `evidence/dhan-d18/reliance-depth-20261123.json` and fails if the fixture would fall back |
| **D5-F6** | Full relevant suite passes, count recorded | **MET** | 2,200 tests / 2,186 pass / 0 fail / 14 skipped; D-5 file 61/61 (§6) |
| **D5-F7** | `providerQualification` unchanged | **MET** | Still `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED` at every declared and emitted site; no qualification identifier appears anywhere in this change's diff |

## 9. Scope of the claim

**Implementation complete; evidence complete; formal acceptance of D-5/A is the Programme
Authority's to give**, and this record does not presume it. What is established here is that
the decision as communicated is implemented as stated, tested at the seam the vendor
actually exercises, and that nothing else changed.

This work item does **not**:

- qualify the provider for live use — `providerQualification` remains
  `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED`, so this is not a live-qualification gate;
- achieve M2 or any other milestone — it removes one blocker from M2's path;
- amend any W-item acceptance, milestone or evidence gate outside D-5;
- decide *why* the vendor zero-fills. The behaviour is recorded as evidence; the
  market-microstructure explanation is outside this record;
- touch the D-18 captures. `reliance-depth-20261125.json` remains a **market-hours** capture
  mislabelled as market-closed and is **not** evidence for this decision.
