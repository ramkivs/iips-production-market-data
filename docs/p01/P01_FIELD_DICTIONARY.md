# P01 — FIELD DICTIONARY

**SPECIFICATION ONLY.** Defines the contract attributes of every canonical field slot.

`<NS>` = the namespace token — **NOT RECORDED** (OI-10, `APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING`).
`<NS>` is a placeholder for readability, **not a proposed token**, and `MD:<domain>.<field>`
is **not adopted**. Recording the token is a mechanical substitution over this dictionary.

**Req.**: `R` required · `O` optional · `C` conditional (condition stated).
**Type**: `dec` decimal · `int` integer · `str` string · `bool` · `ts` timestamp · `enum` · `id` identifier.
**Cur/Unit**: currency or unit obligation. **PIT**: `pitEligible` default.

---

## 1. Snapshot-envelope slots

| Slot | Req. | Type | Contract |
|---|---|---|---|
| `snapshotId` | R | str | `data-${provider}-${dataVersion}-${asOf}`, format frozen |
| `provider` | R | id | Program-internal, stable across adapter swaps, never in product DTOs |
| `dataVersion` | R | str | Opaque; new value on any content change |
| `schemaVersion` | R | str | Canonical schema version |
| `namespaceVersion` | R | str | Namespace scheme version (token itself pending OI-10) |
| `asOf` | R | ts | Market-data time, ISO-8601 UTC, fixed precision |
| `receivedAt` | R | ts | Acquisition time |
| `mode` | R | enum | `LIVE` \| `SNAPSHOT` \| `PIT` |
| `pitBoundary` | C | ts | REQUIRED iff `mode = PIT`; else PROHIBITED |
| `quality` | R | enum | `good` \| `stale` \| `partial` \| `unavailable` |
| `completenessPct` | R | dec | 0–100 inclusive |
| `domain` | R | enum | D01…D10 only |
| `identity` | C | obj | REQUIRED for instrument-keyed domains; series identity for D08; venue identity for D10 |
| `identityMappingVersion` | C | str | REQUIRED when identity crosses the AD-1 adapter (value produced by P04) |
| `lineage` | R | obj | See `P01_IDENTITY_AND_LINEAGE.md` §4 |
| `fields` | R | map | Namespaced key → field record; empty only when `quality = 'unavailable'` |

## 2. Per-field attribute slots

| Slot | Req. | Type | Contract |
|---|---|---|---|
| `key` | R | str | Namespaced canonical key |
| `value` | R | any | Typed value or explicit absence marker |
| `dataType` | R | enum | `dec`/`int`/`str`/`bool`/`ts`/`enum`/`id` |
| `unit` | C | enum | REQUIRED for dimensioned quantities |
| `currency` | C | str | ISO-4217; REQUIRED for monetary |
| `precision` | C | int | REQUIRED for `dec` |
| `observationTime` | C | ts | Where distinct from `asOf` |
| `effectiveTime` | C | ts | REQUIRED for effective-dated data |
| `publicationTime` | C | ts | REQUIRED for revision-bearing data |
| `availability` | R | enum | `PRESENT`\|`NULL_ASSERTED`\|`NOT_APPLICABLE`\|`NOT_PROVIDED`\|`WITHHELD` |
| `quality` | O | enum | Field override; may only be equal/worse than snapshot |
| `provenance` | R | ref | Reference into the snapshot lineage block |
| `pitEligible` | R | bool | Per this dictionary |
| `evaluationTime` | C | ts | T6 — evaluation/scoring/threshold-assessment instant. ISO-8601 UTC, fixed precision (TS-1/TS-2). Clock source per TS-7. Present when evaluation contributes; absent otherwise (BC-3/BC-4). Schema `1.1` (Act A / Act B) |
| `freshnessDuration` | C | dec | Duration value for freshness assessment. REQUIRED when a freshness duration is declared; absent otherwise (BC-3/BC-4). Precision declared per NP-1. Schema `1.2` (Act 2 / A2 / B2) |
| `freshnessUnit` | C | enum | Duration unit for freshness assessment. REQUIRED iff `freshnessDuration` is present. Members: `minutes` \| `seconds` (UN-8). PROHIBITED when `freshnessDuration` is absent. Schema `1.2` (Act 2 / A2 / B2) |

---

## 3. D01 — prices / quotes

| Canonical key | Req. | Type | Cur/Unit | Times | PIT | Notes |
|---|---|---|---|---|---|---|
| `<NS>price.last` | C | dec | currency + precision | observationTime | **No** | LIVE only |
| `<NS>price.bid` / `.ask` | C | dec | currency + precision | observationTime | **No** | LIVE only |
| `<NS>price.bidSize` / `.askSize` | O | int | dimensionless | observationTime | No | |
| `<NS>price.open` / `.high` / `.low` | C | dec | currency + precision | observationTime | Yes | session-scoped |
| `<NS>price.previousClose` | C | dec | currency + precision | effectiveTime | Yes | |
| `<NS>price.close` | C | dec | currency + precision | effectiveTime | **Yes** | official mark |
| `<NS>price.settlement` | O | dec | currency + precision | effectiveTime | Yes | where applicable |
| `<NS>price.volume` | C | int | dimensionless | effectiveTime | Yes | |
| `<NS>price.tradeCount` | O | int | dimensionless | effectiveTime | Yes | |
| `<NS>price.vwap` | O | dec | currency + precision | effectiveTime | Yes | |
| `<NS>price.venueRef` | R | id | — | effectiveTime | Yes | → D10 |

**Price-derived valuation slots — ⚠ collision-critical** (`D4_07` §I.1). These correspond to
**existing free-form engine keys shared across 2–6 engines**. They are namespaced here and may
only reach an engine through an explicit declared mapping (P11), never by name coincidence.

| Canonical key | Req. | Type | Cur/Unit | PIT | Engine keys it may map to (existing, frozen) |
|---|---|---|---|---|---|
| `<NS>valuation.peRatio` | C | dec | dimensionless | Yes | `peRatio` (2 engines) |
| `<NS>valuation.evEbitda` | C | dec | dimensionless | Yes | `evEbitda` (2 engines) |
| `<NS>valuation.evRevenue` | C | dec | dimensionless | Yes | `evRevenue` (Technology) |
| `<NS>valuation.fcfYield` | C | dec | dimensionless | Yes | `fcfYield` (4 engines) |
| `<NS>valuation.marketCap` | O | dec | currency | Yes | not a direct engine input |

## 4. D02 — historical OHLCV

| Canonical key | Req. | Type | Cur/Unit | Times | PIT |
|---|---|---|---|---|---|
| `<NS>ohlcv.open` / `.high` / `.low` / `.close` | R | dec | currency + precision | effectiveTime (bar boundary) | Yes |
| `<NS>ohlcv.volume` | R | int | dimensionless | effectiveTime | Yes |
| `<NS>ohlcv.adjustedClose` | C | dec | currency + precision | effectiveTime | Yes |
| `<NS>ohlcv.adjustmentFactor` | C | dec | dimensionless | effectiveTime | Yes |
| `<NS>ohlcv.adjustmentBasisRef` | C | ref | — | — | Yes |
| `<NS>ohlcv.barInterval` | R | enum | — | — | Yes |
| `<NS>ohlcv.adjusted` | R | bool | — | — | Yes |

**Rule:** adjusted and unadjusted are **both** retained. `adjusted = true` without an
`adjustmentBasisRef` is **invalid**.

## 5. D03 — fundamentals

| Canonical key class | Req. | Type | Cur/Unit | Times | PIT |
|---|---|---|---|---|---|
| `<NS>fundamentals.<lineItem>` (monetary) | C | dec | **currency + precision + reporting scale** | effectiveTime + publicationTime | Yes |
| `<NS>fundamentals.<ratio>` | C | dec | dimensionless | effectiveTime + publicationTime | Yes |
| `<NS>fundamentals.fiscalPeriod` | R | enum | — | effectiveTime | Yes |
| `<NS>fundamentals.statementType` | R | enum | — | — | Yes |
| `<NS>fundamentals.restatementSeq` | R | int | — | publicationTime | Yes |

**Frozen mapping targets** (existing engine keys, **not created here**): `ebitdaMargin` (6),
`debtEbitda` (6), `revenueGrowth` (5), `roic` (2), `roce` (2), plus the 52 coded keys.
**No new engine key may be introduced by this program.**

## 6. D04 — corporate actions

| Canonical key | Req. | Type | Cur/Unit | PIT |
|---|---|---|---|---|
| `<NS>corpaction.actionType` | R | enum | — | Yes |
| `<NS>corpaction.exDate` / `.recordDate` / `.payDate` | C | ts | — | Yes |
| `<NS>corpaction.effectiveDate` | R | ts | — | Yes |
| `<NS>corpaction.ratio` | C | dec | dimensionless + precision | Yes |
| `<NS>corpaction.cashAmount` | C | dec | currency + precision | Yes |
| `<NS>corpaction.resultingInstrumentRef` | C | id | — | Yes |
| `<NS>corpaction.adjustmentFactor` | C | dec | dimensionless | Yes |

## 7. D05 — identity reference slots (contract slots only; master is P04)

| Canonical key | Req. | Type | PIT | Notes |
|---|---|---|---|---|
| `<NS>identity.canonicalSecurityId` | R | id | Yes | Program-internal, immutable, unique |
| `<NS>identity.canonicalIssuerId` | C | id | Yes | |
| `<NS>identity.listingRef` | C | id | Yes | → D10 |
| `<NS>identity.instrumentType` | R | enum | Yes | |
| `<NS>identity.lifecycleStatus` | R | enum | Yes | active/suspended/delisted/merged/superseded |
| `<NS>identity.validFrom` / `.validTo` | R | ts | Yes | every attribute time-bounded |
| `<NS>identity.externalIdentifiers[]` | C | obj | Yes | **⚠ OI-09 — no standard is assumed authoritative** |
| `<NS>identity.localSymbol` | O | str | Yes | **explicitly NOT authoritative** |
| `<NS>identity.mappedCompanyId` | C | str | Yes | **AD-1 adapter output. Produced by P04. Never written by the data plane, never coerced** |

## 8. D06 — news / events

| Canonical key | Req. | Type | Times | PIT |
|---|---|---|---|---|
| `<NS>news.eventId` | R | id | — | Yes |
| `<NS>news.headline` | R | str | publicationTime | Yes |
| `<NS>news.bodyRef` | C | ref | — | Yes |
| `<NS>news.sourceRef` | R | ref | — | Yes |
| `<NS>news.taxonomyRef` | C | ref | — | Yes |
| `<NS>news.entityLinks[]` | C | id | — | Yes |
| `<NS>news.classification` | R | enum | — | Yes |
| `<NS>news.dedupeKey` | R | str | — | Yes |

## 9. D07 — estimates / consensus

| Canonical key | Req. | Type | Cur/Unit | PIT |
|---|---|---|---|---|
| `<NS>estimates.metricRef` | R | id | — | Yes |
| `<NS>estimates.consensusMean` / `.median` / `.high` / `.low` | C | dec | currency where monetary | Yes |
| `<NS>estimates.estimateCount` | R | int | dimensionless | Yes |
| `<NS>estimates.revisionSeq` | R | int | — | Yes |
| `<NS>estimates.forecastPeriod` | R | enum | — | Yes |
| `<NS>estimates.priceTarget` | O | dec | currency + precision | Yes |

## 10. D08 — macro

| Canonical key | Req. | Type | Cur/Unit | PIT |
|---|---|---|---|---|
| `<NS>macro.seriesId` | R | id | — | Yes |
| `<NS>macro.value` | R | dec | `unitOfMeasure` REQUIRED | Yes |
| `<NS>macro.unitOfMeasure` | R | enum | index/percent/level/rate | Yes |
| `<NS>macro.frequency` | R | enum | — | Yes |
| `<NS>macro.region` | R | str | — | Yes |
| `<NS>macro.vintage` | R | str | — | Yes |
| `<NS>macro.revisionSeq` | R | int | — | Yes |

**Identity rule:** D08 uses **series identity**, not instrument identity, and **never** `companyId`.

## 11. D09 — alternative data

| Canonical key | Req. | Type | PIT |
|---|---|---|---|
| `<NS>alt.datasetId` | R | id | Per dataset |
| `<NS>alt.classification` | R | enum | Per dataset |
| `<NS>alt.region` | R | str | Per dataset |
| `<NS>alt.retentionDays` | R | int | Per dataset |
| `<NS>alt.approvalRef` | R | ref | Per dataset |
| `<NS>alt.<datasetField>` | C | any | Declared per dataset |

⚠ **M-6:** retention is **not enforced** by existing-IIPS. Recording `retentionDays` is
**not** an enforcement claim. Not fixed by this program.

## 12. D10 — venue / reference

| Canonical key | Req. | Type | PIT |
|---|---|---|---|
| `<NS>venue.micCode` | R | id | Yes |
| `<NS>venue.name` | R | str | Yes |
| `<NS>venue.timezone` | R | str | Yes |
| `<NS>venue.sessionSchedule` | R | obj | Yes |
| `<NS>venue.holidayCalendar` | R | obj | Yes |
| `<NS>venue.settlementCycle` | C | enum | Yes |
| `<NS>venue.quotationCurrency` | R | str | Yes |
| `<NS>venue.validFrom` / `.validTo` | R | ts | Yes |

---

## 13. Dictionary-wide rules

| # | Rule |
|---|---|
| FD-1 | Every key in a snapshot's `fields` carries the namespace (ADR-01 C1). A bare key is a **hard error** |
| FD-2 | No key in `companyInputs` may carry the namespace (C2) |
| FD-3 | A canonical key never duplicates an existing engine input key **as-is** — the namespace guarantees this structurally |
| FD-4 | Adding a key to this dictionary is a **minor** schema change; changing a key's type, unit obligation or `pitEligible` is **major** (`P01_VERSIONING_COMPATIBILITY.md`) |
| FD-5 | Monetary ⇒ `currency` REQUIRED. Dimensioned ⇒ `unit` REQUIRED. Dimensionless ⇒ both PROHIBITED |
| FD-6 | `pitEligible = false` fields **must not** appear in a `mode = PIT` snapshot |
| FD-7 | This dictionary declares **contract slots**, not provider mappings. Provider-to-canonical mapping is **P06** |
