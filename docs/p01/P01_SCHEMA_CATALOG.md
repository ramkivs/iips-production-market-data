# P01 — SCHEMA CATALOG (per D4 domain D01–D10)

**SPECIFICATION ONLY.** Domains are the **D4 approved inventory**
(`docs/d4/D4_02_DATA_DOMAINS.md` §D.1). **No new domain is introduced.**

`<NS>` = the namespace token, **not yet recorded** (OI-10). See `P01_DATA_CONTRACT.md` §4.

Legend — **PIT?**: whether the class is suitable for point-in-time use.
**Owner**: the phase that implements it (P01 defines the contract only).

---

## D01 — Market prices / quotes

| Aspect | Contract |
|---|---|
| Disposition | **EXTEND** (contract exists; provider does not) |
| Canonical field classes | `<NS>price.*` — last, bid, ask, open, high, low, previousClose, volume, tradeCount, vwap; `<NS>valuation.*` — price-derived ratios |
| Required metadata | `provider`, `dataVersion`, `asOf`, `receivedAt`, `mode`, `quality`, `completenessPct`, `lineage`, `identity`, `identityMappingVersion` |
| Units / currency | Prices **monetary** → `currency` REQUIRED (ISO-4217) + `precision`. Volumes **dimensionless integer** → no currency. Ratios dimensionless |
| Timestamps | `asOf` = quote/snapshot time; `observationTime` = exchange trade/quote time where distinct; `receivedAt` = ingest |
| Provenance | Provider + venue attribution required; venue reference resolves via D10 |
| PIT? | **Yes** for closing/settlement marks; **No** for intraday LIVE last/bid/ask (`pitEligible = false`) |
| Downstream consumers (established) | UI01 Dashboard, UI03 Portfolio, engines (valuation inputs) via explicit mapping, D02, D04 |
| Deferred | Provider connectivity, entitlement (P02/P03); acquisition (P05) |

## D02 — Historical OHLCV

| Aspect | Contract |
|---|---|
| Disposition | **NEW** (source and storage both absent) |
| Canonical field classes | `<NS>ohlcv.*` — open, high, low, close, volume, adjustedClose, adjustmentFactor, barInterval, sessionRef |
| Required metadata | As D01, plus **adjusted vs unadjusted flag** and adjustment provenance reference (→ D04) |
| Units / currency | Prices monetary + precision; volume integer; `barInterval` enum |
| Timestamps | Each bar carries an explicit bar-boundary `observationTime`; series carries `asOf`; `mode` explicit per query |
| Provenance | Adjustment factors are **evidence-bearing, never silently applied** |
| PIT? | **Yes — mandatory.** Query returns data **as knowable** at the as-of boundary |
| Consumers | Charts, research, screening (UI05), engines |
| Dependencies | D01, **D04** (adjustment), **D05** (identity) |
| Deferred | Time-series storage and PIT query engine — **P08** |
| ⚠ Contract note | `DataSnapshot.asOf` is a **single scalar**, not a series. A series is delivered as an ordered set of snapshots or as a snapshot whose `T` carries a bounded series — **structure choice is a P08 storage decision**, recorded here as **DEP-P01-04**, not resolved |

## D03 — Fundamentals

| Aspect | Contract |
|---|---|
| Disposition | **ADAPT** — a constraint discovery, not a free build |
| Canonical field classes | `<NS>fundamentals.*` — statement line items, margins, growth, leverage, returns |
| **Hard constraint** | Fundamentals map into the **existing** engine namespace only. **No new methodology key may be invented.** 52 coded (`BM-`/`IM-`/`CM-`/`HC-`/`TL-`/`AU-`/`MM-`) + 54 free-form camelCase keys are **frozen** |
| Mapping rule | Namespaced canonical → engine input key is an **explicit, declared, evidenced transformation**. **Never** merged by name coincidence |
| Units / currency | Monetary line items REQUIRE `currency` + `precision` + reporting-scale declaration; margins/ratios dimensionless |
| Timestamps | `effectiveTime` = fiscal period end; `publicationTime` = filing/report date; both REQUIRED |
| PIT? | **Yes — mandatory** (restatements are routine) |
| Consumers | UI02 Company Workspace, research, scoring |
| Open | **OI-06** — replace / supplement / re-source of existing displayed financials is an authority question. **Not resolved here** |
| Authority | Any genuinely new metric = **methodology change → Ramki/Sai**. Not introduced by this program (SPEC ¶132/133) |
| Deferred | Mapping execution — **P09** |

## D04 — Corporate actions

| Aspect | Contract |
|---|---|
| Disposition | **NEW** |
| Canonical field classes | `<NS>corpaction.*` — actionType, exDate, recordDate, payDate, effectiveDate, ratio, cashAmount, resultingInstrumentRef, adjustmentFactor |
| Required metadata | Effective dating **mandatory**; adjustment factors evidence-bearing |
| Units / currency | Cash amounts monetary; ratios dimensionless with declared precision |
| Timestamps | `effectiveTime` REQUIRED; ex/record/pay dates are distinct contract fields, never collapsed |
| PIT? | **Yes.** An adjustment applied today **must not** retroactively alter a past PIT result |
| Consumers | UI03 Portfolio, price adjustment, evidence |
| Dependencies | D01, **D05** (identity changes are security-master lifecycle events) |
| Deferred | Adjustment engine — **P08** |

## D05 — Instrument / security master

| Aspect | Contract |
|---|---|
| Disposition | **NEW (master) + ADAPT (adapter)** — **owned by P04** |
| P01 contribution | Defines only the **identity reference** a snapshot must carry, and the required identity metadata slots (`identity`, `identityMappingVersion`) |
| Canonical model | Instrument / issuer / listing / external-identifier entities per `D4_05` §G.2 — **referenced, not re-specified** |
| Certified constraint | `NormalizedHolding.companyId` is the **certified CSIP join key** — **untouched** |
| Model | **AD-1 ADAPTER**: canonical identity authoritative in the data plane; `companyId` authoritative in the certified engine/CSIP boundary |
| PIT? | **Yes** — every attribute is effective-dated (`validFrom` / `validTo`) |
| Open | **OI-08** cardinality 1 → N · **OI-09** external identifier standard. **Both remain OPEN** |
| Deferred | Entire master + mapping — **P04. Not implemented in P01** |

## D06 — News / events

| Aspect | Contract |
|---|---|
| Disposition | **NEW** |
| Canonical field classes | `<NS>news.*` — eventId, headline, body reference, sourceRef, taxonomyRef, entityLinks, sentiment (where licensed) |
| Required metadata | Governance classification (AD-11) REQUIRED before admission; dedupe key |
| Units / currency | N/A |
| Timestamps | `publicationTime` REQUIRED; `observationTime` = event occurrence where distinct |
| PIT? | **Yes** for knowability (what was published by a boundary) |
| Consumers | UI04 Research, UI09 Alerts, UI01 Dashboard |
| Dependencies | **D05** (entity linking) · P10 |
| ⚠ | Licence-restricted content → classification + entitlement REQUIRED. **M-6 retention is not enforced** in existing-IIPS; D09/D06 may not rely on it |

## D07 — Analyst estimates / consensus

| Aspect | Contract |
|---|---|
| Disposition | **NEW** (consumer exists, source does not) |
| Canonical field classes | `<NS>estimates.*` — consensusValue, estimateCount, high, low, mean, median, revisionCount, priceTarget, period |
| Units / currency | Monetary estimates REQUIRE `currency`; per-share values declare scale |
| Timestamps | `publicationTime` and `effectiveTime` (forecast period) both REQUIRED |
| PIT? | **Yes — mandatory.** Consensus is inherently revision-bearing |
| ⚠ Collision note | `peRatio` / `evEbitda` / `evRevenue` are **free-form shared engine keys**. Estimate-derived values must be namespaced and explicitly mapped (ADR-01), never merged by name |
| Consumers | Research, valuation pillars, Dashboard |
| Dependencies | D03, D05 |

## D08 — Macroeconomic data

| Aspect | Contract |
|---|---|
| Disposition | **NEW** |
| Canonical field classes | `<NS>macro.*` — seriesId, value, frequency, region, unitOfMeasure, vintage, revisionSeq |
| **Identity** | **NOT instrument-keyed.** Requires its own **series identity** — explicitly **not** `companyId` and not an instrument `IdentityRef` |
| Units | `unitOfMeasure` REQUIRED (index, percent, level, rate); currency only where monetary |
| Timestamps | `effectiveTime` = reference period; `publicationTime` = release; **vintage is first-class** |
| PIT? | **Yes — mandatory.** Macro series are heavily revised |
| Consumers | Research, thematic analysis |
| Dependency | P10 |

## D09 — Alternative data

| Aspect | Contract |
|---|---|
| Disposition | **NEW source + REUSE governance (AD-11)** |
| Requirement mode | **Conditional** — "required by applicability", unlike D01–D08/D10 |
| Canonical field classes | Dataset-specific; every field REQUIRES a governance classification attribute |
| Governance | `DataGovernanceRuntime.classify()` → `classification: public\|internal\|confidential\|restricted`, `region`, `retentionDays`, `tenantId` |
| ⚠ **Recorded limitation (M-6)** | `isWithinRetention()` is a stub (`return data.retentionDays >= 0`). **Retention is NOT enforced.** Existing-IIPS defect — **must NOT be silently fixed by this program**. D09 may not rely on retention enforcement |
| PIT? | Dataset-dependent; must be declared per dataset |
| Open | **OI-05** applicability criteria still undefined — **not resolved here** |

## D10 — Exchange / reference metadata

| Aspect | Contract |
|---|---|
| Disposition | **NEW** |
| Canonical field classes | `<NS>venue.*` — micCode, venueName, timezone, sessionSchedule, holidayCalendar, settlementCycle, quotationCurrency, tickRules |
| Required metadata | Effective dating REQUIRED — calendars must be **historically accurate** for PIT correctness |
| Timestamps | `effectiveTime` REQUIRED; local venue timezone recorded **alongside**, never instead of, UTC |
| PIT? | **Yes — mandatory** (a historical calendar is required to evaluate historical freshness/sessions) |
| Role | Supplies listing/venue identity to D05 and **session/staleness baselines** to D01/D07 |
| Consumers | Security master (D05), data quality (P07) |
| Dependency | **D05** (bidirectional) |

---

## Cross-domain summary

| Domain | Instrument-keyed | Currency-bearing | PIT class | Owning implementation phase |
|---|---|---|---|---|
| D01 | Yes | Yes | Partial (close yes / intraday no) | P05 |
| D02 | Yes | Yes | Mandatory | P05, P08 |
| D03 | Yes | Yes | Mandatory | P09 |
| D04 | Yes | Yes | Mandatory | P08 |
| D05 | Is the identity | No | Mandatory | **P04** |
| D06 | Via linking | No | Yes | P10 |
| D07 | Yes | Yes | Mandatory | P10 |
| D08 | **No — series identity** | Conditional | Mandatory | P10 |
| D09 | Conditional | Conditional | Per dataset | P10 |
| D10 | No — venue identity | Reference only | Mandatory | P04, P05 |

**Cross-domain rules inherited verbatim in force** (`D4_02` §D.12): single ingress (AD-2) ·
namespace mandatory (AD-16) · identity through D05 · lineage mandatory (AD-3) · mode explicit
(SPEC ¶17) · quality propagated (NFR-04) · no methodology invention (SPEC ¶132/133).
