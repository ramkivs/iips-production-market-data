# D4 Part F — Canonical Market-Data Ingress Contract Delta

**SPECIFICATION ONLY — NO IMPLEMENTATION.**

**Authority:** AD-2 AUTHORIZE — `MarketDataSource<T>` / `DataSnapshot<T>` is the **mandatory
and sole** production market-data ingress boundary; `DataBoundExecutor` is the **sole**
engine-binding path. **No second ingress contract may be created.**

---

## F.1 The canonical ingress path (unchanged, authoritative)

```
external provider
      │
      ▼
MarketDataSource<T>          ← provider abstraction (NFR-06)
      │  .snapshot(...)
      ▼
DataSnapshot<T>              ← IMMUTABLE, VERSIONED  (Object.freeze)
      │                         identity = provider + dataVersion + asOf
      ▼
DataBoundRequest             ← binds snapshot + companyInputs to an engine
      │
      ▼
DataBoundExecutor            ← namespace + collision guard (AD-16)
      │  .execute(...)
      ▼
ExecutionRequest.inputs      ← the engine-facing boundary (FROZEN, unchanged)
      │
      ▼
certified engine (1 of 13)   ← NO CHANGE
```

**Governing invariant, quoted verbatim from `LiveDataRuntime.ts`:**

> *"Live data is external, mutable infrastructure; the engine NEVER consumes mutable live
> state. It consumes an IMMUTABLE, VERSIONED data snapshot whose identity (dataVersion +
> asOf + provider + lineage) is part of the replay lineage."*

This invariant is **preserved unconditionally**. Every delta below is additive to it.

---

## F.2 `DataSourceMeta` — delta

**Existing (`LiveDataRuntime.ts`):**

```ts
export interface DataSourceMeta {
  readonly provider: string;
  readonly dataVersion: string;
  readonly asOf: string;            // market-data time (snapshot point)
  readonly quality: 'good' | 'stale' | 'partial' | 'unavailable';
  readonly completenessPct: number; // 0-100
}
```

| Field | Status | Specification |
|---|---|---|
| `provider` | **REUSE** | Stable provider identity. Must be **stable across adapter swaps** for lineage continuity. Never leaked to UI DTOs (NFR-06) |
| `dataVersion` | **REUSE** | Provider-assigned or adapter-derived version. **A source change MUST produce a new `dataVersion`** — never silent mutation |
| `asOf` | **REUSE** | Market-data time (the snapshot point). ISO-8601 UTC, deterministic serialization (F.7) |
| `quality` | **REUSE** | Already satisfies NFR-04/NFR-09. **Must be propagated**, not coerced |
| `completenessPct` | **REUSE** | 0–100 |
| **`receivedAt`** | **NEW (additive)** | Acquisition/ingest time, distinct from `asOf`. Required by NFR-01 ("received/as-of timestamps") and needed to compute staleness |
| **`lineage`** | **NEW (additive)** | Structured lineage: upstream source reference, adapter identity + version, transformation chain reference. Required by NFR-01/NFR-07 |
| **`mode`** | **NEW (additive)** | `'LIVE' \| 'SNAPSHOT' \| 'PIT'` — makes SPEC ¶17 (no silent mode mixing) enforceable at the contract, not by convention |

**Lineage requirements:** every `DataSourceMeta` must permit reconstruction of *where the
datum came from, which adapter produced it, at what version, when it was received, and what
transformation chain applied* — without consulting the provider.

---

## F.3 `DataSnapshot<T>` — delta

**Existing:**

```ts
export interface DataSnapshot<T> {
  readonly snapshotId: string;      // `data-${provider}-${dataVersion}-${asOf}`
  readonly dataVersion: string;
  readonly asOf: string;
  readonly provider: string;
  readonly quality: DataSourceMeta['quality'];
  readonly completenessPct: number;
  readonly fields: Readonly<T>;     // immutable field set
}
```

| Field | Status | Specification |
|---|---|---|
| `snapshotId` | **REUSE** | Format `data-${provider}-${dataVersion}-${asOf}` retained. **Authoritative for the market-data input layer** (AD-6). Never conflated with `SNAP_*` |
| `dataVersion`, `asOf`, `provider` | **REUSE** | Participate in replay identity per AD-3 (Part 7) |
| `quality`, `completenessPct` | **REUSE** | Propagate through to DTOs and UI |
| `fields: Readonly<T>` | **REUSE — shape constrained** | Canonical market-data fields are expressed as **`T`** (AD-2). **All keys must carry the AD-16 namespace** (Part 5) |
| **`receivedAt`** | **NEW (additive)** | Mirrors `DataSourceMeta` |
| **`mode`** | **NEW (additive)** | LIVE / SNAPSHOT / PIT |
| **`lineage`** | **NEW (additive)** | Mirrors `DataSourceMeta.lineage` |
| **`schemaVersion`** | **NEW (additive)** | Versions the canonical field schema of `T`, mirroring the engine layer's `snapshot-1.0` discipline. Enables contract evolution without ambiguity |

**Immutability requirements (unchanged, mandatory):**
- Snapshot object and `fields` remain frozen (`Object.freeze`, ideally deep).
- A snapshot, once created, is **never mutated**. Corrections produce a **new** `dataVersion`.
- Attempted mutation is a **hard error**, never a silent no-op.

**Lineage requirements:** the snapshot must be self-describing for replay — given only the
snapshot, one must be able to state provider, version, vintage, mode, quality and
transformation chain.

---

## F.4 `MarketDataSource<T>` — delta

**Existing:** `snapshot(dataVersion, asOf, quality, completenessPct, fields)` — a synchronous
constructor of deterministic snapshots. One stub instance exists (`admin-transport.ts:174`),
explicitly *"NOT production market data"*.

| Capability | Status | Specification |
|---|---|---|
| Provider abstraction | **REUSE** | Generic over `T`, constructed with a provider identity. Adapters are **replaceable behind this type** (NFR-06). Provider identity never reaches UI DTOs |
| Deterministic snapshot construction | **REUSE** | Same inputs → same `snapshotId`. Preserved exactly |
| **Snapshot acquisition** | **NEW (additive)** | Acquire from a real provider: authentication, request, response validation, canonical field mapping, namespace application, snapshot construction. Asynchronous acquisition must resolve to the **same deterministic snapshot shape** |
| **PIT / as-of semantics** | **NEW (additive)** | Retrieve data **as knowable at a stated as-of boundary**. Must preserve publication vs effective time. A PIT acquisition must be **repeatable**: same as-of → same snapshot identity |
| **Error / degraded-state semantics** | **NEW (additive)** | Provider unavailable → `quality: 'unavailable'`; partial response → `'partial'` + accurate `completenessPct`; stale feed → `'stale'`. **A failed acquisition must never yield a snapshot presented as `'good'`.** Errors are classified and propagated, never coerced (NFR-04) |
| **Entitlement boundary** | **NEW (additive)** | Adapter enforces licensing/entitlement before acquisition; entitlement failure is an explicit classified state, not an empty success |

**Constraint:** these are **additions to `MarketDataSource<T>`**, not a new type. Introducing a
parallel acquisition class would violate AD-2 and Rule 11.

---

## F.5 `DataBoundRequest` — delta

**Existing:**

```ts
export interface DataBoundRequest {
  readonly engineId: string;
  readonly requestId: string;
  readonly data: DataSnapshot<Record<string, unknown>>;
  readonly companyInputs: Record<string, unknown>;
}
```

| Aspect | Status | Specification |
|---|---|---|
| `engineId`, `requestId` | **REUSE** | Unchanged |
| `data` | **REUSE — extended cardinality** | See below |
| `companyInputs` | **REUSE** | The company's fundamental/frozen baseline fields |
| **Multiple contributing snapshots** | **NEW (additive)** | A single execution may draw on **several** data snapshots (e.g. price + fundamentals + estimates from different providers). The contract must support an ordered, explicit set of contributing snapshots, each retaining its own identity. **Merging them into one opaque bag would destroy lineage** |
| **Identity requirements** | **NEW (additive)** | Must carry the **canonical security identity** and its mapping to `companyId` (Part 6). Identity is explicit in the request, never inferred |
| **Provenance requirements** | **NEW (additive)** | Must be sufficient to construct the execution→data lineage linkage of Part 7 without re-reading providers |

---

## F.6 `DataBoundExecutor` — delta

**Existing:**

```ts
export class DataBoundExecutor {
  constructor(private readonly exec: (engineId: string, request: ExecutionRequest) => ExecutionResult) {}
  execute(bound: DataBoundRequest): { result: ExecutionResult; snapshotIdentity: string } {
    const inputs = { ...bound.data.fields, ...bound.companyInputs };   // ⚠ flat, unguarded
    const result = this.exec(bound.engineId, { requestId: bound.requestId, inputs });
    return { result, snapshotIdentity: bound.data.snapshotId };
  }
}
```

| Aspect | Status | Specification |
|---|---|---|
| **Production wiring** | **NEW** | Currently **unwired outside tests** (`grep DataBoundExecutor` → only its definition + test files). Must become the sole production engine-binding path (AD-2) |
| **Namespace / collision behaviour** | **NEW — MANDATORY (AD-16)** | Collision detection **before** merge. Duplicate key between namespaced market-data fields and `companyInputs` → **explicit fail-closed error with evidence**. **Never silent precedence.** Full rule in Part 5 |
| **Deterministic behaviour** | **REUSE — reinforced** | Same snapshot(s) + same `companyInputs` + same engine → identical `ExecutionResult`. Merge order must be deterministic and specified, not implementation-incidental |
| **Multi-snapshot merge** | **NEW (additive)** | Deterministic, specified ordering across contributing snapshots; cross-snapshot collisions are also fail-closed |
| **Lineage emission** | **NEW (additive)** | Must emit contributing snapshot identities for the Part 7 linkage — currently returns only a single `snapshotIdentity` |
| **Engine-facing shape** | **UNCHANGED** | Engines continue to receive `ExecutionRequest{requestId, inputs}`. **Zero engine change** |

---

## F.7 Cross-cutting requirements

1. **Deterministic serialization.** Timestamps ISO-8601 UTC, fixed precision. Field ordering canonical. Numeric formatting stable. Required so snapshot identity and replay identity are byte-stable.
2. **No provider leakage.** Provider identity stays behind the data-plane boundary; product DTOs expose governed provenance, not vendor names (NFR-06, INT-004).
3. **No mutable state to engines.** Engines read only `ExecutionRequest.inputs`, derived solely from frozen snapshots + `companyInputs`.
4. **Mode never implicit.** Every snapshot declares LIVE/SNAPSHOT/PIT; consumers may not silently combine (SPEC ¶17).
5. **Quality never coerced.** `quality`/`completenessPct` propagate unchanged to DTOs; degradation is displayed, not hidden (NFR-04/09).
6. **Backward compatibility.** All deltas are additive. Existing SNAPSHOT-only executions that supply no market-data snapshot behave exactly as today.

---

## F.8 Certified-component impact

| Component | Change | Authority |
|---|---|---|
| `DataSourceMeta` | Additive fields | Data authority; ADR if treated as certified |
| `DataSnapshot<T>` | Additive fields | Data authority; ADR if treated as certified |
| `MarketDataSource<T>` | Additive methods | Data authority |
| `DataBoundRequest` | Additive fields / cardinality | Data authority |
| **`DataBoundExecutor`** | **Merge semantics change** | **AD-16 — Ramki/Sai ADR REQUIRED** |
| `ExecutionRequest` / `ExecutionResult` | **NONE** | — |
| `SectorPlugin` / engines | **NONE** | — |
| Scoring / calibration / taxonomy | **NONE** | — |

**Exactly one certified behavioural change is proposed: the `DataBoundExecutor` merge
(AD-16). It is specified, not implemented, and is gated on Ramki/Sai ADR sign-off.**
