# D4 Part J — Engine / Methodology Integration Specification (13 Certified Engines)

**SPECIFICATION ONLY — NO IMPLEMENTATION.**
**Target scope:** 13 certified engines (AD-8), subject to AD-4 revalidation.

---

## J.1 Non-negotiable statements

| Statement | Status |
|---|---|
| No scoring changes | **GUARANTEED** |
| No calibration changes | **GUARANTEED** |
| No taxonomy changes | **GUARANTEED** |
| No engine methodology changes | **GUARANTEED** |
| No direct mutable-data reads by engines | **ENFORCED** — engines read only `ExecutionRequest.inputs` |
| Market data enters via `DataSnapshot`/`DataBoundExecutor` | **MANDATORY** (AD-2) |
| `ExecutionRequest.inputs` remains the engine-facing boundary | **UNCHANGED** |
| No engine implementation modified | **GUARANTEED** |

**Mechanism.** `DataBoundExecutor` merges frozen snapshot fields with `companyInputs` and
calls the engine through the existing dispatch. The engine sees a normal `ExecutionRequest`.
It cannot distinguish a market-data-sourced input from a fixture-sourced one — which is
precisely why the namespace + collision guard (Part 5) is required, and why no engine change
is needed.

---

## J.2 Certified engine scope (AD-8)

Per `EngineRegistry.CERTIFIED_ENGINES` and E2E-030 §12 (13-engine delta @ `67e89aa`).
All `engineVersion 1.0.0`, `calibrationVersion 1.0.0`, `ontologyDimensions 8`.

| # | Engine ID | IES | Sector | Input style | Input keys |
|---|---|---|---|---|---|
| 1 | `sector.banking` | IES-006 | Banking | **Coded** | `BM-001…006`, `BM-014`, `BM-015` (8) |
| 2 | `sector.insurance` | IES-007 | Insurance | **Coded** | `IM-001…008` (8) |
| 3 | `sector.capital-markets` | IES-008 | Capital Markets | **Coded** | `CM-001…006`, `CM-008` (7) |
| 4 | `sector.healthcare` | IES-009 | Healthcare | **Coded** | `HC-001,002,004,005,007` (5) |
| 5 | `sector.hospitality` | IES-010 | Hospitality | **Free-form** | `adr`, `occupancy`, `revpar`, `revparGrowth`, `gopMargin`, `feeMix`, `demandQualityMix`, `businessModel`, `debtEbitda`, `ebitdaMargin`, `roic`, `id` (12) |
| 6 | `sector.energy` | IES-011 | Energy | **Free-form** | `liftingCost`, `reserveReplacement`, `productionGrowth`, `commodityExposure`, `transitionMix`, `evEbitda`, `fcfYield`, `roce`, `debtEbitda`, `ebitdaMargin`, `revenueGrowth`, `segment`, `id` (13) |
| 7 | `sector.utilities` | IES-012 | Utilities | **Free-form** | `allowedRoe`, `rateBaseGrowth`, `regulatoryPosture`, `ffoDebt`, `saidi`, `omEfficiency`, `transitionCapexIntensity`, `demandGrowth`, `peRatio`, `roe`, `debtEbitda`, `ebitdaMargin`, `revenueGrowth`, `segment`, `id` (15) |
| 8 | `sector.consumer` | IES-013 | Consumer | **Free-form** | `brandLoyalty`, `dtcShare`, `innovationIntensity`, `marginResilience`, `priceContribution`, `privateLabelExposure`, `peRatio`, `fcfYield`, `roic`, `debtEbitda`, `ebitdaMargin`, `revenueGrowth`, `businessModel`, `segment`, `id` (15) |
| 9 | `sector.industrials` | IES-014 | Industrials | **Free-form** | `backlog`, `bookToBill`, `orderGrowth`, `aftermarketShare`, `projectRiskExposure`, `operatingMargin`, `evEbitda`, `fcfYield`, `roce`, `debtEbitda`, `ebitdaMargin`, `revenueGrowth`, `archetype`, `subsegment`, `id` (15) |
| 10 | `sector.technology` | IES-015 | Technology | **Free-form** | `nrr`, `recurringRevenuePct`, `usageGrowth`, `rdIntensity`, `customerConcentration`, `capexIntensity`, `grossMargin`, `evRevenue`, `fcfYield`, `debtEbitda`, `ebitdaMargin`, `revenueGrowth`, `archetype`, `subsegment`, `id` (15) |
| 11 | `sector.telecom` | IES-016 | Telecommunications | **Coded** | `TL-001…008` (8) |
| 12 | `sector.auto` | IES-017 | Automobile | **Coded** | `AU-001…008` (8) |
| 13 | `sector.materials` | IES-020 | Materials & Metals | **Coded** | `MM-001…008` (8) |

**Frozen methodologies preserved verbatim:** D16 M1–M15 (Telecom) · D17 M1–M15 + Option-A
left-to-right accumulation, triple `44ba/ea22/c8ed` (Auto) · D20 M1–M15 + G1–G6, `5813…` (Materials).

---

## J.3 Per-engine data dependency specification

**Legend — Mapping:** `EXISTING-CODE` = maps to an existing coded key ·
`EXISTING-FREEFORM` = maps to an existing free-form key ·
`NEW-METRIC` = would require a new engine input → **methodology change, Ramki/Sai, NOT in scope**

| Engine | Expected data dependencies | Mapping | Collision risk (AD-16) |
|---|---|---|---|
| `sector.banking` | D03 fundamentals; D01 valuation context | **EXISTING-CODE** (`BM-*`) | **Low** — coded namespace |
| `sector.insurance` | D03 fundamentals | **EXISTING-CODE** (`IM-*`) | **Low** |
| `sector.capital-markets` | D03 fundamentals; D01 market context | **EXISTING-CODE** (`CM-*`) | **Low** |
| `sector.healthcare` | D03 fundamentals | **EXISTING-CODE** (`HC-*`) | **Low** |
| `sector.hospitality` | D03 (`ebitdaMargin`, `debtEbitda`, `roic`); operational metrics | **EXISTING-FREEFORM** | **HIGH** — `ebitdaMargin`(6), `debtEbitda`(6), `roic`(2), `id`(6) |
| `sector.energy` | D01/D03 (`evEbitda`, `fcfYield`); commodity context | **EXISTING-FREEFORM** | **HIGH** — `evEbitda`(2), `fcfYield`(4), `revenueGrowth`(5), `ebitdaMargin`(6), `debtEbitda`(6), `segment`(3), `id`(6) |
| `sector.utilities` | D01 (`peRatio`); D03; regulatory | **EXISTING-FREEFORM** | **HIGH** — `peRatio`(2), `revenueGrowth`(5), `ebitdaMargin`(6), `debtEbitda`(6), `segment`(3), `id`(6) |
| `sector.consumer` | D01 (`peRatio`, `fcfYield`); D03 | **EXISTING-FREEFORM** | **HIGH** — `peRatio`(2), `fcfYield`(4), `roic`(2), `businessModel`(2), `segment`(3) + shared set |
| `sector.industrials` | D01 (`evEbitda`, `fcfYield`); D03 | **EXISTING-FREEFORM** | **HIGH** — `evEbitda`(2), `fcfYield`(4), `archetype`(2), `subsegment`(2) + shared set |
| `sector.technology` | D01 (`evRevenue`, `fcfYield`); D03 | **EXISTING-FREEFORM** | **HIGH** — `fcfYield`(4), `archetype`(2), `subsegment`(2) + shared set |
| `sector.telecom` | D03 fundamentals | **EXISTING-CODE** (`TL-*`) | **Low** |
| `sector.auto` | D03 fundamentals | **EXISTING-CODE** (`AU-*`) | **Low** |
| `sector.materials` | D01 commodity; D03 | **EXISTING-CODE** (`MM-*`) | **Low** |

**Structural conclusion:** the six free-form engines (Hospitality, Energy, Utilities,
Consumer, Industrials, Technology) carry **all** the collision risk, and they are precisely
the engines consuming price-derived valuation metrics. The AD-16 namespace is therefore not
a general precaution — it is targeted mitigation for a measured, concentrated risk.

---

## J.4 Per-engine provenance, replay and certification implications

Uniform across all 13 (differences noted):

| Aspect | Requirement |
|---|---|
| **Provenance** | Every execution records contributing `DataSnapshot` IDs, `provider`, `dataVersion`, `asOf`, `identityMappingVersion`, `namespaceVersion` (Part 7). Engine-side provenance (`ies`, `engineVersion`, `secVersion`, `semcVersion`, `calibrationProfile`, `calibrationVersion`) unchanged |
| **Replay** | Effective replay identity extended with data vintage (AD-3). Existing SNAPSHOT-only golden executions must remain **byte-identical** |
| **Certification** | Feeding real data changes engine **inputs**, not engine **behaviour**. Requires **new data-plane certification** of the input path; existing engine certification is unaffected *in principle* — but **all 13 inherit AD-4 revalidation** |
| **Determinism** | Same snapshot(s) + same `companyInputs` → identical result. Preserved by immutability + deterministic merge order |
| **Oracle preservation** | Frozen golden inputs must continue to produce frozen expected outputs. **This is the primary non-regression test** |

**Engine-specific notes:**

- **`sector.auto` (IES-017)** — Option-A left-to-right accumulation
  (`for (i…) compositeRaw += pillarValues[i]*weightValues[i]`, `r1h2e`, **no `sum()`**) must be
  preserved verbatim; triple `44ba/ea22/c8ed` must continue to MATCH. Market-data inputs must
  not alter accumulation order.
- **`sector.materials` (IES-020)** — G1–G6 preserved: subsegments steel/cement/aluminium/diversified,
  archetype risk producer 1.1, 8 metrics, `r1h2e`/lower-inclusive, `5813…`.
- **`sector.telecom` (IES-016)** — D16 M1–M15 preserved; oracle `3cfb/92be`.
- **Free-form six** — highest namespace-mapping scrutiny (J.3).

---

## J.5 CSIP interaction

Engine outputs feed `CrossSectorEngine` via `NormalizedHolding` (**certified, untouched** —
Part 6). `companyId` arrives from the P04 adapter. `OntologyMapper`, `RankingEngine`,
`OpportunityEngine`, `CrossSectorEvidence` unchanged.

⚠ **Cardinality (OI-08):** CSIP currently receives one holding per sector. Real data implies
many. Existing tests assert `holdings 10` / `holdings 13`. A cardinality change is a
**product-behaviour change requiring authority** — not assumed here.

---

## J.6 What is explicitly NOT specified

| Not specified | Reason |
|---|---|
| Any change to engine implementations | Rule 6; methodology authority Ramki/Sai |
| New engine input metrics | Would be a methodology change (SPEC ¶132/133) |
| Changes to scoring/calibration/taxonomy | Prohibited |
| Repair of M-1 | AD-10 — existing-IIPS program |
| Whether AD-4 revalidation passes | AD-4 open; requires M-1 repair first |
| Cardinality resolution | OI-08 open |
