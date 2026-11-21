# D-5 — Bid/Ask Representation and Validation Decision

**Decision ID:** D-5
**Status:** **ACCEPTED — APPROVED**
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
