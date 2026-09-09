# ADR-01 — MARKET-DATA FIELD NAMESPACE + COLLISION GUARD

**Package type:** ADR **PREPARATION** for existing-IIPS authority review.
**Status: PENDING RAMKI/SAI ADR.**
**Preparation of this ADR is NOT approval of this ADR.** Nothing herein is implemented,
approved, certified, or accepted.

| Field | Value |
|---|---|
| ADR ID | ADR-01 |
| Origin | G-A **AD-16** (namespace + collision detection authorized *conceptually*) · open item **OI-10** (token) |
| Baseline | D4 Part I (`docs/d4/D4_07_FIELD_NAMESPACE.md`), D4-B corrected |
| Affected certified component | **`DataBoundExecutor`** — exactly one |
| Named authority required | **Ramki (Engineering Reviewer) / Sai (Repository Maintainer)** |
| Certification authority | **UNKNOWN (A2)** |
| Decision status | **PENDING RAMKI/SAI ADR — NOT APPROVED** |

---

## A. Decision question

> **What is the approved namespace token for market-data fields entering
> `ExecutionRequest.inputs`, and is fail-closed pre-merge collision detection inside
> `DataBoundExecutor` approved?**

Two separable sub-decisions; both are requested, and the authority may approve one without
the other:

| Sub-decision | Question |
|---|---|
| **A-1 (token)** | Which exact namespace token is adopted? (D4 recommends `MD:<domain>.<field>` — **OI-10**) |
| **A-2 (guard)** | Is fail-closed pre-merge collision detection in `DataBoundExecutor` approved? |

---

## B. Current contract (as-is behaviour)

All measurements below are carried over from D4 Part I. **No new measurement was performed
for this package.**

### B.1 The unguarded merge

`iips-platform/src/distributed/LiveDataRuntime.ts`, line **76** (executor body lines 74–84):

```ts
const inputs = { ...bound.data.fields, ...bound.companyInputs };
```

`companyInputs` is spread **last**, so any key present in both silently overwrites the
market-data value. There is no error, no warning, no precedence declaration and no lineage
record of the discarded value.

### B.2 Engine input key population — split namespace

| Style | Distinct keys | Engines |
|---|---|---|
| Coded (`BM-`, `IM-`, `CM-`, `HC-`, `TL-`, `AU-`, `MM-`) | **52** | Banking, Insurance, Capital Markets, Healthcare, Telecom, Auto, Materials (**7**) |
| **Free-form camelCase** | **54** | Hospitality, Energy, Utilities, Consumer, Industrials, Technology (**6**) |

### B.3 Known collision examples (free-form keys already shared across engines)

| Key | Engines sharing it | Price-derived? |
|---|---|---|
| `id` | **6** | No |
| `ebitdaMargin` | **6** | No |
| `debtEbitda` | **6** | No |
| `revenueGrowth` | **5** | No |
| `fcfYield` | **4** | **Yes** |
| `evEbitda` | **2** | **Yes** |
| `peRatio` | **2** | **Yes** |

(Also shared at 2–3 engines: `segment`, `businessModel`, `roic`, `roce`, `subsegment`,
`archetype`, `evRevenue`.)

### B.4 The defect this ADR addresses

`peRatio`, `evEbitda`, `evRevenue` and `fcfYield` are **price-derived valuation metrics** —
precisely the fields a market-data plane supplies — and they are free-form and shared. Under
B.1 a market-data-sourced `peRatio` is **silently overwritten** by `companyInputs.peRatio`.

This is a **live NFR-04 violation** ("Invalid, incomplete, contradictory or unavailable data
is classified and propagated, not silently coerced"). It exists today, independently of this
program. It is the substantive justification for AD-16.

---

## C. Proposed design

### C.1 Namespace token — **RECOMMENDED — NOT APPROVED**

> **Form: `MD:<domain>.<field>`**
> Examples: `MD:price.last`, `MD:ohlcv.close`, `MD:valuation.peRatio`

**Rationale (D4 Part I):** no existing engine input key contains a colon; the token therefore
cannot collide with the `XX-NNN` coded pattern or with any camelCase free-form key. Selection
was driven by the measured collision surface in §B, not by convention.

**This token is RECOMMENDED ONLY. It is NOT approved. Approval is OI-10 and belongs to
Ramki/Sai.** An alternative token that satisfies the same disjointness property is equally
acceptable to the D4 design; only the *partition property* is load-bearing.

### C.2 Collision rules C1–C6 (evaluated in `DataBoundExecutor` **before** any merge)

| # | Rule | Requirement |
|---|---|---|
| **C1** | **Namespace partition** | Every key in `data.fields` MUST carry the namespace. A non-namespaced key is a **hard error** |
| **C2** | **Reverse partition** | No key in `companyInputs` may carry the namespace. A namespaced key there is a **hard error** |
| **C3** | **Intersection test** | `keys(data.fields) ∩ keys(companyInputs)` MUST be empty. Non-empty → **hard error** listing every colliding key |
| **C4** | **Cross-snapshot test** | With multiple contributing snapshots, pairwise key intersections MUST be empty. Non-empty → **hard error** naming both snapshot IDs and the keys |
| **C5** | **Fail-closed abort** | Any C1–C4 violation **aborts the execution**. No partial merge, no precedence, no coercion, no warning-and-continue |
| **C6** | **Deterministic merge order** | Where merging is legal (partitions disjoint), order is canonical and specified — not implementation-incidental |

Given C1+C2, C3 can only be violated by a namespace-discipline failure — exactly the
condition that must fail loudly rather than resolve silently.

### C.3 Error semantics

| Condition | Behaviour |
|---|---|
| Collision detected | Explicit typed error; execution **aborted** |
| Error content | Colliding key(s); contributing snapshot ID(s); `engineId`; `requestId`; namespace version |
| Evidence | Emitted as an evidence-bearing event (NFR-07 auditable) |
| Classification | Data-quality failure (NFR-04) — propagated, not coerced |
| Prohibited | Silent overwrite · precedence rules · "last wins" · dropping a field · substituting a default |
| Degraded-state interaction | A collision is a **contract violation**, not a degraded state; it is **not** representable as `quality: 'partial'` |

---

## D. Compatibility

| Statement | Assertion |
|---|---|
| Certified existing-IIPS component affected | **`DataBoundExecutor`** (`LiveDataRuntime.ts:74-84`) — **exactly one** |
| SNAPSHOT-only executions | **MUST remain byte-identical** |
| Empty contributing market-data state | Guard is **inert**; behaviour preserved exactly as today |
| `ExecutionRequest` / `ExecutionResult` | **UNCHANGED** |
| `SectorPlugin` (IES-005.1 frozen) | **UNCHANGED** |
| All 13 engines | **UNCHANGED** — no engine methodology change |
| Scoring / calibration / taxonomy | **UNCHANGED** |
| Engine input keys (52 coded + 54 free-form) | **UNCHANGED** |
| `SnapshotService`, `EvidencePipeline`, CSIP | **UNCHANGED** |
| Auto Option-A accumulation · Materials G1–G6 · Telecom D16 | **PRESERVED VERBATIM** |
| Nature of the change | **Defensive only** — converts a silent failure mode into an explicit one |

---

## E. Certification impact (D4 Part M reference)

| Ref | Item |
|---|---|
| **C2** | Namespace + collision guard = **NEW certification requirement** |
| **C1** | Ingress-path certification **depends on C2** (D4 Part M sequencing constraint **S2**: the ingress cannot be certified while the merge at `LiveDataRuntime.ts:76` is unguarded) |
| Evidence | **Oracle / golden byte-identity evidence required** across all 13 engines |
| Evidence | **Negative collision tests required** (each of C1–C4 must be shown to abort) |
| Owner | **A2 new-program certification authority — UNKNOWN.** This ADR does not assign it |

**No certification is granted, renewed or implied by this document.**

---

## F. Rollback / backward compatibility

| Element | Expectation (from D4) |
|---|---|
| Inertness | With no contributing market-data snapshot (`data.fields` empty), the guard performs no partition check that can fail and the merge result is identical to today's |
| Acceptance test for rollback safety | **Existing golden/oracle executions must remain byte-identical** across all 13 engines — this is the primary non-regression gate |
| Rollback path | The guard is additive and isolated to one function; reverting `DataBoundExecutor` restores the prior (defective) behaviour without touching engines, contracts or data |
| Irreversible changes | **None.** No data migration, no identifier change, no schema rewrite of engine inputs |
| Risk if rejected | Silent, unlineaged overwrite of market-data valuation inputs persists; NFR-04 breach remains live |

---

## G. Required evidence (to be produced **after** approval, not now)

1. **Collision census** — the measured 52 coded / 54 free-form key inventory and the shared-key
   table in §B.3, re-verified against the tree at implementation time.
2. **13-engine oracle / byte-identity evidence** — every certified engine's golden inputs
   produce byte-identical outputs with the guard present and no market-data snapshot bound;
   includes Auto triple `44ba/ea22/c8ed`, Materials `5813…`, Telecom `3cfb/92be`.
3. **Fail-closed negative tests** — C1, C2, C3 and C4 each demonstrated to abort the execution
   with the error content specified in §C.3, and demonstrated **not** to produce a partial merge.
4. **Determinism evidence** — C6: same snapshot + same `companyInputs` ⇒ identical result;
   merge order canonical.

---

## H. Authority

| Role | Assignment |
|---|---|
| **NAMED AUTHORITY REQUIRED** | **Ramki / Sai** — `DataBoundExecutor` is a certified-boundary existing-IIPS component (G-A rule: certified engine-layer contract/component changes require Ramki/Sai sign-off) |
| Certification authority | **UNKNOWN (A2)** — not assigned, not inferred |
| Namespace token approval (OI-10) | **Ramki / Sai** |
| This program's authority | **None over this decision.** It may only prepare the package |

---

## I. Decision status

# **PENDING RAMKI/SAI ADR**

- Not approved.
- Namespace token `MD:<domain>.<field>` **NOT approved** (OI-10 remains open).
- Collision guard **NOT approved**.
- Not implemented.
- No certification granted.
- **Blocks:** P05 Acquisition, P06 Normalization, P11 Engine Integration, and certification C1.
