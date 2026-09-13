# D4 Part D — D01–D10 Data Domain Baseline

**SPECIFICATION ONLY.** Domain definitions preserved from SPEC Table 1 / tracker sheet `Data Domains`.

**Governing distinction applied throughout:**

- **NEW source capability** — the data itself does not exist and must be acquired.
- **REUSE of existing governance mechanism** — the control/contract that governs it already exists.

Most domains are **NEW source + REUSE governance**. That combination is the core reuse story
of this program: we are not building governance, we are building acquisition and feeding it
through governance that already exists.

---

## D.1 Domain matrix

| ID | Domain | Mode | Source capability | Governance mechanism | Disposition | Phase |
|---|---|---|---|---|---|---|
| D01 | Market prices / quotes | LIVE + historical | **NEW** (no provider) | **REUSE** `MarketDataSource<T>`/`DataSnapshot<T>` | **EXTEND** | P05–P08 |
| D02 | Historical OHLCV | Historical / PIT | **NEW** | **REUSE** ingress + **NEW** time-series store | **NEW** | P05–P08 |
| D03 | Fundamentals | PIT + snapshot | **NEW** | **REUSE** frozen metric-code namespace | **ADAPT** | P09 |
| D04 | Corporate actions | PIT + effective-date | **NEW** | **REUSE** ingress; **NEW** adjustment model | **NEW** | P08 |
| D05 | Instrument / security master | Current + historical lifecycle | **NEW** | **REUSE** `companyId` boundary via adapter | **NEW** | P04 |
| D06 | News / events | LIVE + historical | **NEW** | **REUSE** ingress + governance | **NEW** | P10 |
| D07 | Analyst estimates / consensus | Snapshot + PIT | **NEW** | **REUSE** ingress; feeds existing valuation pillars | **NEW** | P10 |
| D08 | Macroeconomic data | Snapshot + historical/PIT | **NEW** | **REUSE** ingress | **NEW** | P10 |
| D09 | Alternative data | Governed/approved only | **NEW** | **REUSE** `DataGovernanceRuntime.classify()` (AD-11) | **NEW** | P10 |
| D10 | Exchange / reference metadata | Current + historical | **NEW** | **REUSE** ingress | **NEW** | P04–P05 |

**EXTEND 1 · ADAPT 1 · NEW 8** — and **10/10 reuse an existing governance mechanism**.

---

## D.2 D01 — Market prices / quotes

**Disposition: EXTEND** (contract exists; provider does not)

| Aspect | Specification |
|---|---|
| Existing capability | `MarketDataSource<T>` / `DataSnapshot<T>` / `DataSourceMeta` fully typed in `LiveDataRuntime.ts` |
| Existing wiring | One stub instance only: `admin-transport.ts:174`, `new MarketDataSource<Record<string, unknown>>('governed-provider')`, explicitly commented *"deterministic test feed — NOT production market data"* |
| **NEW source capability** | Provider adapters (quote/price feeds); production connectivity; entitlement handling |
| **REUSE governance** | Immutable snapshot boundary; `quality` enum; `completenessPct`; provider abstraction |
| Immutable snapshot boundary | **Preserved unconditionally** (AD-2). `Object.freeze` on snapshot and fields retained |
| Canonical fields | Expressed as the `T` in `DataSnapshot<T>` — **not** a parallel type |
| Namespace | All fields carry the AD-16 market-data namespace (Part 5) |
| Degraded states | `quality: 'good'\|'stale'\|'partial'\|'unavailable'` — already exists, must be **propagated** to DTOs and UI |
| Consumers | UI01, UI03, engines (valuation inputs), D02, D04 |
| Authority | AD-2 (resolved) |

## D.3 D02 — Historical OHLCV

**Disposition: NEW** (source and storage both absent)

| Aspect | Specification |
|---|---|
| Existing capability | **None.** `DataSnapshot.asOf` is a **single scalar**, not a series |
| **NEW source capability** | OHLCV acquisition; time-series storage; as-of/PIT query semantics |
| **REUSE governance** | Each retrieved series/point delivered as an immutable `DataSnapshot<T>` |
| PIT / as-of semantics | Query must return data **as it was knowable** at a stated as-of boundary; publication vs effective time preserved |
| Adjusted vs unadjusted | Both required; adjustment provenance from D04 |
| Mode-mixing rule | SPEC ¶17 — LIVE/SNAPSHOT/PIT may never be silently combined; every series carries explicit mode |
| Consumers | Charts, research, screening (UI05), engines |
| Dependency | D01, D04 (adjustment), D05 (identity) |

## D.4 D03 — Fundamentals

**Disposition: ADAPT** — this is a **constraint discovery**, not a free build

| Aspect | Specification |
|---|---|
| Existing capability | Engine inputs are **already** fundamentals-shaped, in a frozen namespace |
| **Critical constraint** | Input keys are **split** between coded and free-form (see below). Fundamentals must map into the **existing** namespace — **no free-form methodology keys may be invented** |
| Coded namespaces | `BM-*` Banking (8) · `IM-*` Insurance (8) · `CM-*` Capital Markets (7) · `HC-*` Healthcare (5) · `TL-*` Telecom (8) · `AU-*` Auto (8) · `MM-*` Materials (8) — **52 keys, 7 engines** |
| Free-form namespaces | Hospitality, Energy, Utilities, Consumer, Industrials, Technology — **54 distinct camelCase keys, 6 engines** |
| Collision surface | 13 free-form keys shared across engines: `id`(6), `ebitdaMargin`(6), `debtEbitda`(6), `revenueGrowth`(5), `fcfYield`(4), `segment`(3), `businessModel`, `roic`, `roce`, `evEbitda`, `peRatio`, `subsegment`, `archetype` |
| **Rule** | Fundamentals map to **existing metric codes/keys only**. Any genuinely new metric is a **methodology change** requiring **Ramki/Sai** authority — it is NOT introduced by this program (SPEC ¶132/133) |
| Namespace interaction | Market-data-sourced fundamentals arrive namespaced (AD-16) and are **explicitly mapped** into engine input keys — never merged by name coincidence |
| Overlap with existing product | Company Workspace already displays "financials, valuation" → **replace / supplement / re-source is an authority question** (OI-06) |
| Consumers | Company (UI02), research, scoring |
| Authority | Methodology authority **Ramki/Sai** for any new metric · OI-06 |

## D.5 D04 — Corporate actions

**Disposition: NEW**

| Aspect | Specification |
|---|---|
| Existing capability | **None.** No adjustment logic anywhere in the repository |
| **NEW source capability** | Corporate-action acquisition; effective-date model; adjustment engine (splits, dividends, mergers, spin-offs, symbol/identity changes) |
| **REUSE governance** | Delivered as immutable `DataSnapshot<T>`; lineage via Part 7 |
| Adjustment model | Adjusted and unadjusted series both retained; adjustment factors are **evidence-bearing**, never silently applied |
| Security-master dependency | Identity changes (symbol change, merger, delisting) are **security-master lifecycle events** → hard dependency on D05 |
| PIT implications | An adjustment applied *today* must not retroactively alter a *past* PIT query result. PIT queries return values as knowable at their as-of boundary |
| Consumers | UI03 Portfolio, price adjustment, evidence |
| Dependency | D01, **D05** |

## D.6 D05 — Instrument / security master

**Disposition: NEW (master) + ADAPT (adapter)** — full specification in Part 6

| Aspect | Specification |
|---|---|
| Existing capability | **None.** Zero hits: `isin\|figi\|cusip\|ticker\|exchange\|listing\|securitymaster\|instrumentmaster` |
| Existing identifier | `companyId: string`, values `` `${sector}-H1` `` — a **sector label, not an entity ID**. `GET /api/company/:id` is keyed by **sector** (`executive-transport.ts:639`) |
| Certified constraint | `NormalizedHolding.companyId` is the **certified CSIP join key** (`cross-sector/types.ts:7`) — **must remain untouched** |
| **NEW source capability** | Canonical security/instrument model, identifiers, listing/exchange identity, lifecycle, effective dates, aliases |
| **REUSE governance** | Existing `companyId` contract preserved; canonical identity reaches CSIP only through the governed adapter |
| Model (AD-1 ADAPTER) | Canonical identity authoritative **within the data plane**; `companyId` authoritative **within the certified engine/CSIP boundary** |
| Mapping requirements | Explicit · auditable · versioned · evidenced · **no silent coercion** |
| Migration | **No data migration.** Existing `companyId` values are synthetic. This is an **adapter/mapping** problem |
| Cardinality | ⚠ Real data implies N companies/sector vs today's 1 — a product-behaviour change (**OI-08**) |
| Consumers | **All domains** |
| Authority | **AD-1 ADAPTER MODEL** (resolved); product-wide authority would need a **new ADR** |

## D.7 D06 — News / events

**Disposition: NEW**

| Aspect | Specification |
|---|---|
| Existing capability | **None** |
| **NEW source capability** | News/event acquisition, taxonomy, entity linking, dedupe |
| **REUSE governance** | Ingress boundary; `DataGovernanceRuntime` classification for licensed content |
| Entity linking | Requires D05 canonical identity to attach events to instruments |
| Licensing | News content is typically licence-restricted → classification + entitlement required |
| Consumers | Research (UI04), Alerts (UI09), Dashboard (UI01) |
| Dependency | D05 · P10 |

## D.8 D07 — Analyst estimates / consensus

**Disposition: NEW**

| Aspect | Specification |
|---|---|
| Existing capability | **Consumer exists, source does not.** Valuation pillars (`valuationScore`) and free-form valuation keys (`peRatio`, `evEbitda`, `evRevenue`) already consume valuation inputs |
| **NEW source capability** | Consensus estimate acquisition; revision history; PIT consensus (what consensus *was* at a date) |
| **REUSE governance** | Ingress; feeds existing valuation pillar inputs via D03 mapping rules |
| PIT requirement | Consensus is inherently revision-bearing → PIT is mandatory, not optional |
| ⚠ Collision note | `peRatio`/`evEbitda` are **free-form shared keys** — estimate-derived values must be namespaced and explicitly mapped (AD-16), never merged by name |
| Consumers | Research, valuation, Dashboard |
| Dependency | D03, D05 |

## D.9 D08 — Macroeconomic data

**Disposition: NEW**

| Aspect | Specification |
|---|---|
| Existing capability | **None** |
| **NEW source capability** | Macro series acquisition; vintage/revision handling; region/country dimensions |
| **REUSE governance** | Ingress; immutable snapshots |
| Revision semantics | Macro series are heavily revised → **vintage is first-class**; PIT mandatory |
| Identity | Not instrument-keyed; requires its own series identity (**not** `companyId`) |
| Consumers | Research, thematic analysis |
| Dependency | P10 |

## D.10 D09 — Alternative data

**Disposition: NEW source + REUSE governance (AD-11)**

| Aspect | Specification |
|---|---|
| Existing capability | **Source: none. Governance: exists.** |
| **REUSE governance (AD-11)** | `DataGovernanceRuntime.classify()` → `GovernedData{dataId, tenantId, classification: 'public'\|'internal'\|'confidential'\|'restricted', region, retentionDays, createdAt, immutable}`; `canAccess()` tenant isolation |
| Requirement mode | "Required by applicability" — **conditional**, unlike D01–D08/D10 |
| Approval | Classification via `DataGovernanceRuntime.classify()` per AD-11 |
| ⚠ **Recorded limitation (M-6)** | `isWithinRetention()` is a **stub**: `return data.retentionDays >= 0` (`DataGovernanceRuntime.ts:53`). **Retention is NOT enforced.** Existing-IIPS defect — **must NOT be silently fixed by this program (AD-11)**. D09 may not rely on retention enforcement |
| Applicability criteria | Still undefined — see OI-05 |
| Consumers | Research/engines where approved |
| Authority | **AD-11 AUTHORIZE** (resolved) · applicability criteria open |

## D.11 D10 — Exchange / reference metadata

**Disposition: NEW**

| Aspect | Specification |
|---|---|
| Existing capability | **None.** Zero `exchange`/`listing` hits |
| **NEW source capability** | Exchange/venue registry, MIC codes, trading calendars, sessions, holidays, currency and settlement metadata |
| **REUSE governance** | Ingress; immutable snapshots |
| Role | Supplies listing/venue identity to D05 and staleness baselines to D01/D07 |
| Historical relevance | Calendars must be historically accurate for PIT correctness |
| Consumers | Security master (D05), data quality (P07) |
| Dependency | **D05** (bidirectional: D10 supplies venue identity; D05 owns instrument↔listing) |

---

## D.12 Cross-domain rules

1. **Single ingress (AD-2).** Every domain enters via `MarketDataSource<T>` → `DataSnapshot<T>`. No domain gets a bespoke ingress path.
2. **Namespace mandatory (AD-16).** Every market-data field is namespaced before it can reach `DataBoundExecutor`.
3. **Identity through D05.** Every instrument-keyed domain resolves identity through the security master and its adapter — never by raw provider symbol.
4. **Lineage mandatory (AD-3).** Every domain contributes `provider` + `dataVersion` + `asOf` to execution lineage.
5. **Mode explicit (SPEC ¶17).** LIVE / SNAPSHOT / PIT is explicit per domain per query; never silently mixed.
6. **Quality propagated (NFR-04).** `quality` and `completenessPct` propagate to DTOs and UI; never coerced or dropped.
7. **No methodology invention (SPEC ¶132/133).** D03/D07 map to existing keys; new metrics require Ramki/Sai.
