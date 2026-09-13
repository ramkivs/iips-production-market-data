# D4 Part I — Market-Data Field Namespace & Collision Specification (AD-16)

**SPECIFICATION ONLY — NO IMPLEMENTATION.**
**Authority:** AD-16 **AUTHORIZE NAMESPACE + COLLISION DETECTION**.
`md.*` was explicitly flagged as illustrative and **NOT approved**. A namespace is
**recommended** below; it requires its own sign-off.

---

## I.1 Evidence — the collision surface, measured

D3 assumed engine inputs were uniformly coded (`BM-*`, `IM-*`, `CM-*`). Direct inspection of
`PROGRAM_v1.1_REPLAY_BASELINE.json` shows the namespace is **split**:

| Style | Keys | Engines |
|---|---|---|
| Coded — `BM-`, `IM-`, `CM-`, `HC-`, `TL-`, `AU-`, `MM-` | **52** | Banking, Insurance, Capital Markets, Healthcare, Telecom, Auto, Materials |
| **Free-form camelCase** | **54 distinct** | Hospitality, Energy, Utilities, Consumer, Industrials, Technology |

**Free-form keys already shared across engines:**

| Key | Engines | Key | Engines |
|---|---|---|---|
| `id` | 6 | `businessModel` | 2 |
| `ebitdaMargin` | 6 | `roic` | 2 |
| `debtEbitda` | 6 | `roce` | 2 |
| `revenueGrowth` | 5 | `evEbitda` | 2 |
| `fcfYield` | 4 | `peRatio` | 2 |
| `segment` | 3 | `subsegment` | 2 |
| | | `archetype` | 2 |

**The decisive finding:** several free-form keys are **price-derived valuation metrics** —
`peRatio`, `evEbitda`, `evRevenue`, `fcfYield` — exactly the fields a market-data plane
supplies. Under the current flat merge:

```ts
const inputs = { ...bound.data.fields, ...bound.companyInputs };
```

a market-data `peRatio` is **silently overwritten** by `companyInputs.peRatio` — no error,
no warning, no lineage record. **This is a live NFR-04 violation** ("Invalid, incomplete,
contradictory or unavailable data is classified and propagated, not silently coerced"), and
it is the strongest evidence for AD-16.

---

## I.2 Recommended canonical namespace

### 1. Recommendation

> **Prefix: `MD:`** — an uppercase token followed by a colon, applied to every market-data
> field key at the point of canonical mapping.
>
> Form: `MD:<domain>.<field>` — e.g. `MD:price.last`, `MD:ohlcv.close`, `MD:valuation.peRatio`
>
> **Recommended, not approved.** Requires sign-off per I.8.

### 2. Rationale

| Requirement (AD-16) | How `MD:` satisfies it |
|---|---|
| Clearly separates market-data from engine/company inputs | Uppercase + colon is visually and lexically distinct from both `BM-001` style and `camelCase` style |
| Must not collide with `BM-`/`IM-`/`CM-`/`HC-`/`TL-`/`AU-`/`MM-` | Coded keys use `XX-NNN` (hyphen, digits). `MD:` uses a colon and never matches `^[A-Z]{2}-\d` |
| Must not collide with free-form camelCase | No existing key contains `:`; verified — all 54 free-form keys are `[a-zA-Z]` only |
| Deterministic | Purely lexical, no context-dependence; same canonical field always yields the same key |
| Explicit in schemas | The prefix is part of the declared canonical schema, not a runtime convention |
| Supports provenance | `<domain>` segment ties the field to its D01–D10 domain for lineage attribution |
| Collision fails explicitly | Enables an unambiguous partition test before merge (I.4) |

**Why not `md.*`:** lowercase `md.` risks confusion with camelCase fields and, being
dot-separated, is closer to plausible future free-form key styles. The colon is not a legal
character in any existing key and cannot be produced accidentally by camelCase conventions.
This is the substantive reason for departing from the illustrative example.

### 3. Example field mapping

| Canonical market-data field | Namespaced key | Domain | Engine input mapping |
|---|---|---|---|
| Last traded price | `MD:price.last` | D01 | not a direct engine input |
| Closing price | `MD:ohlcv.close` | D02 | not a direct engine input |
| Price/earnings ratio | `MD:valuation.peRatio` | D01+D03 | **explicit map** → `peRatio` (Consumer, Utilities) |
| EV/EBITDA | `MD:valuation.evEbitda` | D01+D03 | **explicit map** → `evEbitda` (Energy, Industrials) |
| EV/Revenue | `MD:valuation.evRevenue` | D01+D03 | **explicit map** → `evRevenue` (Technology) |
| FCF yield | `MD:valuation.fcfYield` | D01+D03 | **explicit map** → `fcfYield` (4 engines) |
| Revenue growth | `MD:fundamentals.revenueGrowth` | D03 | **explicit map** → `revenueGrowth` (5 engines) |
| EBITDA margin | `MD:fundamentals.ebitdaMargin` | D03 | **explicit map** → `ebitdaMargin` (6 engines) |
| Consensus target | `MD:estimates.priceTarget` | D07 | not a direct engine input |

**Critical rule:** namespaced keys are **never** merged into engine inputs by name coincidence.
Mapping into an engine input key is an **explicit, declared, evidenced transformation** at the
canonical-mapping layer (D03 rules). The namespace guarantees a market-data field can never
*accidentally* satisfy an engine input.

### 4. Collision rule

Evaluated in `DataBoundExecutor` **before** any merge:

| # | Rule |
|---|---|
| **C1** | **Namespace partition.** Every key in `data.fields` MUST carry the namespace. A non-namespaced key in `data.fields` is a **hard error** |
| **C2** | **Reverse partition.** No key in `companyInputs` may carry the namespace. A namespaced key in `companyInputs` is a **hard error** |
| **C3** | **Intersection test.** `keys(data.fields) ∩ keys(companyInputs)` MUST be empty. Non-empty → **hard error**, listing every colliding key |
| **C4** | **Cross-snapshot test.** With multiple contributing snapshots, pairwise key intersections MUST be empty. Non-empty → **hard error** naming both snapshot IDs and the keys |
| **C5** | **Fail-closed.** Any C1–C4 violation **aborts the execution**. No partial merge, no precedence, no coercion, no warning-and-continue |
| **C6** | **Deterministic order.** Where merging is legal (partitions disjoint), order is canonical and specified — not implementation-incidental |

**Given C1+C2, C3 can only be violated by a namespace-discipline failure — which is exactly
the condition that must fail loudly rather than silently resolve.**

### 5. Error semantics

| Condition | Behaviour |
|---|---|
| Collision detected | Explicit typed error; execution **aborted** |
| Error content | Colliding key(s); contributing snapshot ID(s); `engineId`; `requestId`; namespace version |
| Evidence | Emitted as an evidence-bearing event (NFR-07 auditable) |
| Data-quality classification | Classified as a data-quality failure (NFR-04) — **propagated, not coerced** |
| Prohibited | Silent overwrite · precedence rules · "last wins" · dropping a field · substituting a default |
| Degraded-state interaction | A collision is a **contract violation**, not a degraded state. It is not representable as `quality: 'partial'` |

### 6. Schema impact

| Artifact | Impact |
|---|---|
| Canonical market-data schema (P01) | All field keys declared **with** the namespace |
| `DataSnapshot<T>` `T` | All keys namespaced (Part 4) |
| `DataSnapshot.schemaVersion` | Versions the namespaced schema |
| Namespace version | Participates in replay identity (Part 7) |
| Engine input keys | **UNCHANGED** — the 52 coded + 54 free-form keys are untouched |
| Mapping layer | Declares explicit namespaced → engine-input transformations |
| Product DTOs (P12) | May expose namespaced keys or mapped display names; **provider identity never exposed** (NFR-06) |

### 7. Affected certified component

**Exactly one: `DataBoundExecutor` (`iips-platform/src/distributed/LiveDataRuntime.ts:74-84`).**

| Component | Change |
|---|---|
| `DataBoundExecutor.execute()` | Collision detection before merge; deterministic order; fail-closed errors |
| `ExecutionRequest` / `ExecutionResult` | **NONE** |
| `SectorPlugin`, all 13 engines | **NONE** |
| Scoring / metrics / calibration / taxonomy | **NONE** |
| `SnapshotService`, `EvidencePipeline`, CSIP | **NONE** |

Engines continue to receive `ExecutionRequest{requestId, inputs}` identical in shape. The
change is **defensive only** — it converts a silent failure mode into an explicit one.

### 8. Ramki/Sai ADR / sign-off requirement

**Required. `DataBoundExecutor` is a certified-boundary component.**

| ADR element | Content |
|---|---|
| Decision | Adopt namespace + fail-closed collision detection in `DataBoundExecutor` |
| Justification | Live NFR-04 violation: price-derived valuation keys (`peRatio`, `evEbitda`, `evRevenue`, `fcfYield`) are free-form and shared across 2–4 engines; flat merge silently overwrites |
| Namespace token | `MD:` recommended — **requires approval** |
| Scope | Merge semantics only. No methodology, scoring, calibration or engine change |
| Backward compatibility | Executions with empty `data.fields` are unaffected — existing behaviour preserved exactly |
| Risk if rejected | Silent, unlineaged overwrite of market-data valuation inputs; NFR-04 breach persists |
| Validation | Collision unit tests; determinism tests; **existing baseline byte-identity must be preserved** |
| Authority | **Ramki (Engineering Reviewer) / Sai (Repository Maintainer)** |
| Status | **PENDING — NOT IMPLEMENTED** |

---

## I.3 Open sub-decision

**OI-10 — namespace token approval.** `MD:` is a recommendation grounded in the measured
collision surface. The final token requires sign-off with the ADR. **Not assumed approved.**
