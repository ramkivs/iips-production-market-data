# P01 — TIMESTAMP, CURRENCY, UNIT AND PRECISION RULES

**SPECIFICATION ONLY.** Satisfies tracker rows `P01-02` (time semantics), `P01-03`
(units/currency/adjustment) and `P01-04` (LIVE/SNAPSHOT/PIT modes), sheet `Work Tracker`.

---

## 1. The six distinct times

The contract recognises **six** distinct times. **They are never collapsed, never inferred
from one another, and never substituted for one another.**

| # | Time | Meaning | Where carried |
|---|---|---|---|
| T1 | **`asOf`** | Market-data time — the snapshot point | Snapshot envelope, REQUIRED |
| T2 | **`receivedAt`** | Acquisition / ingest time | Snapshot envelope, REQUIRED |
| T3 | **`observationTime`** | Event time — when the datum was observed/traded | Field, conditional |
| T4 | **`effectiveTime`** | When the datum becomes economically effective (fiscal period end, ex-date, validFrom) | Field, conditional |
| T5 | **`publicationTime`** | When the source published/released it | Field, conditional |
| T6 | **`evaluationTime`** | Evaluation / scoring / threshold-assessment instant — when the evaluation was performed | Field, conditional |

### 1.1 Obligations by data class

| Data class | Required times |
|---|---|
| Live quote (D01) | T1, T2, T3 (+ T6 where threshold evaluation contributes) |
| Session mark / OHLCV bar (D01, D02) | T1, T2, T4 |
| Fundamentals (D03) | T1, T2, T4, T5 (+ T6 where scoring contributes) |
| Corporate action (D04) | T1, T2, T4 (+ ex/record/pay as distinct contract fields) |
| Identity attribute (D05) | T1, T2, T4 (`validFrom`/`validTo`) |
| News / event (D06) | T1, T2, T5 (+ T3 where occurrence differs) |
| Estimates (D07) | T1, T2, T4, T5 (+ T6 where evaluation contributes) |
| Macro (D08) | T1, T2, T4, T5 (+ vintage) |
| Venue / calendar (D10) | T1, T2, T4 |

## 2. Timezone and representation

| # | Rule |
|---|---|
| TS-1 | **All timestamps are ISO-8601 in UTC** with an explicit `Z` offset. Local-time-only values are **invalid** |
| TS-2 | Precision is **fixed and declared** per the schema version; variable precision breaks byte-stable identity |
| TS-3 | Venue local timezone is recorded **alongside** UTC (via `<NS>venue.timezone`), **never instead of** it |
| TS-4 | Date-only concepts (ex-date, fiscal period end) are represented as an explicit date type at a declared UTC convention — **not** as an ambiguous midnight-local instant |
| TS-5 | Serialization is deterministic — required for snapshot and replay identity byte-stability |
| TS-6 | Clock source for `receivedAt` is the ingest boundary, recorded once; it is **never back-filled or recomputed** |
| TS-7 | Clock source for `evaluationTime` is the evaluation/scoring engine's evaluation boundary, recorded once; it is **never back-filled or recomputed**. `evaluationTime` is always an **explicit input** — an implementation that reads a system clock in place of an explicit input **violates this rule** |

## 3. Mode semantics (LIVE / SNAPSHOT / PIT)

| # | Rule |
|---|---|
| MD-1 | Every snapshot declares exactly one `mode`. **Mode is never implicit** (SPEC ¶17) |
| MD-2 | LIVE, SNAPSHOT and PIT data **may never be silently combined**. A consumer combining modes must do so explicitly and record it |
| MD-3 | `mode = PIT` requires `pitBoundary`; any other mode **prohibits** it |
| MD-4 | Only `pitEligible` fields may appear in a PIT snapshot |
| MD-5 | Same PIT boundary ⇒ same contributing snapshots ⇒ same effective replay identity (repeatability) |
| MD-6 | A later correction (new `dataVersion`) **must not** retroactively alter a past PIT result |
| MD-7 | Mode is part of the lineage and of the ADR-02 `contributingData` entry |

## 4. Currency semantics

| # | Rule |
|---|---|
| CU-1 | **ISO-4217** alphabetic codes. No provider-proprietary currency tokens |
| CU-2 | Every monetary value carries `currency`. A monetary value without a currency is **invalid — rejected, not defaulted** |
| CU-3 | **No implicit currency.** Venue quotation currency (`<NS>venue.quotationCurrency`) may inform a mapping but is **never** silently substituted for a missing field currency |
| CU-4 | **No implicit FX conversion.** Any conversion is an explicit, declared, evidenced transformation recorded in lineage, producing a **new field**, never overwriting the source-currency field |
| CU-5 | An FX-converted value records the rate, rate source and rate as-of time in lineage. A conversion without a recorded rate is **invalid** |
| CU-6 | Minor-unit conventions (e.g. pence vs pounds, cents) are handled by an explicit **scale** declaration, never by convention |
| CU-7 | Mixed-currency aggregation is **prohibited at the contract level**; aggregation policy is a downstream (P07/P09/P12) concern |

## 5. Unit semantics

| # | Rule |
|---|---|
| UN-1 | Every dimensioned quantity carries `unit`. Dimensionless quantities **must not** carry one |
| UN-2 | Units come from a **declared, versioned enumeration** in the schema; free-text units are **invalid** |
| UN-3 | Ratios, margins, yields and multiples are **dimensionless**. Percent vs fraction is an explicit unit choice, declared per field and **never** inferred |
| UN-4 | Reporting **scale** (units / thousands / millions / billions) is an explicit declaration. **Scale is never inferred from magnitude** |
| UN-5 | Unit conversion is an explicit declared transformation recorded in lineage, producing a new field |
| UN-6 | Share/volume counts are integers with no unit |
| UN-7 | Per-share values declare both `currency` and the per-share basis |

## 6. Numeric precision

| # | Rule |
|---|---|
| NP-1 | Every `decimal` field declares `precision` (scale). Undeclared precision is **invalid** |
| NP-2 | Decimal semantics are **exact**; binary floating-point representation that loses source fidelity is prohibited for monetary and ratio values |
| NP-3 | **No silent rounding.** Any rounding is an explicit declared transformation recorded in lineage |
| NP-4 | Numeric formatting is **stable and canonical** on serialization (fixed scale, no exponent drift, no trailing-zero variation) — required for byte-stable identity |
| NP-5 | Source precision is preserved; the contract may not truncate to a display precision |
| NP-6 | Precision changes are a **major** schema change (`P01_VERSIONING_COMPATIBILITY.md`) |

## 7. Adjustment semantics (D02 / D04)

| # | Rule |
|---|---|
| AJ-1 | Adjusted and unadjusted values are **both retained**; adjusted never replaces unadjusted |
| AJ-2 | Adjustment factors are **evidence-bearing** and **never silently applied** |
| AJ-3 | `adjusted = true` without `adjustmentBasisRef` is **invalid** |
| AJ-4 | An adjustment applied today **must not** retroactively alter a past PIT query result |
| AJ-5 | The adjustment **engine** is not specified here — **P08** |

## 8. Market / session / calendar semantics

| # | Rule |
|---|---|
| SE-1 | Session, holiday and settlement semantics come from **D10**, effective-dated |
| SE-2 | Calendars must be **historically accurate**; a current calendar may not be applied to a historical PIT evaluation |
| SE-3 | Session context supplies the baseline for staleness — the contract supplies the inputs; **P07** computes freshness and thresholds |
| SE-4 | A session/venue reference is REQUIRED on venue-scoped price data (`<NS>price.venueRef`) |

## 9. Schema version (T6 amendment)

The addition of T6 / `evaluationTime` (Act A, `PHASE_07_P01_T6_AMENDMENT_AUTHORIZATION.md`)
increments the canonical schema version from **`1.0`** to **`1.1`** (MINOR per SV-2 — strictly
additive and backward-compatible). T6 is conditional; consumers at `1.0` encounter no T6;
consumers at `1.1` reading `1.0` data treat absent T6 as `NOT_PROVIDED` (BC-2). Historical
snapshots retain `schemaVersion: "1.0"` (BC-5).
