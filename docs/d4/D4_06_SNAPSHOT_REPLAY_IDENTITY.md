# D4 Part H — Snapshot / Replay Identity Delta (AD-3 + AD-6)

**SPECIFICATION ONLY — NO IMPLEMENTATION.**
**Authority:** AD-3 **INCLUDE** · AD-6 **EXPLICIT DUAL-LAYER MAPPING**
**Gated on:** Ramki/Sai ADR (certified engine-layer contract change)

---

## H.1 The problem, precisely stated

Two snapshot identifiers exist, in different layers, and **they are not linked**.

| | Market-data input layer | Engine execution/result layer |
|---|---|---|
| Type | `DataSnapshot<T>` (`LiveDataRuntime.ts`) | `Snapshot` (`SnapshotService.ts`) |
| ID format | `` `data-${provider}-${dataVersion}-${asOf}` `` | `SNAP_*` via `idProvider.generate('SNAP', …)` |
| Carries | `provider`, `dataVersion`, `asOf`, `quality`, `completenessPct` | `engineId`, `metrics`, `scores`, `verdict`, `evidenceRefs`, `provenance` |
| **Data vintage fields** | **present** | **ABSENT** |

Certified replay identity (`PROGRAM_v1.1_REPLAY_BASELINE.json`):

```json
"replayIdentity": ["input", "contractVersion", "calibrationVersion", "runtimeConfiguration"]
```

**`dataVersion` and `asOf` are absent.** Under SNAPSHOT-only operation this was harmless —
inputs were frozen golden fixtures. **Under real market data it is a correctness defect:**
two executions differing *only* in data vintage would share one replay identity, and a replay
could reproduce against an ambiguous vintage. That directly contradicts `LiveDataRuntime`'s
own invariant and breaches NFR-01/NFR-02.

---

## H.2 AD-6 — both identifiers preserved

**Neither identifier is replaced, merged or renamed.** They identify different things:

- `data-*` → **which market-data input snapshot** was consumed.
- `SNAP_*` → **which engine execution/result** was produced.

Collapsing them would destroy information and modify a certified identifier. Coexistence is
correct; the missing piece is the **explicit, evidenced linkage**.

---

## H.3 The linkage specification

```
engine execution/result  (SNAP_*)
        │
        └── contributingData: [
              {
                dataSnapshotId : "data-<provider>-<dataVersion>-<asOf>",
                provider       : <provider identity>,
                dataVersion    : <version>,
                asOf           : <market-data time>,
                receivedAt     : <acquisition time>,
                mode           : LIVE | SNAPSHOT | PIT,
                quality        : good | stale | partial | unavailable,
                completenessPct: 0-100,
                lineage        : <adapter/transformation chain ref>
              },
              ... (ordered, one per contributing snapshot)
            ]
        └── identityMappingVersion : <security-master mapping version>   (Part 6)
        └── namespaceVersion       : <market-data namespace version>     (Part 5)
```

### Minimum contract delta

| Target | Delta | Nature |
|---|---|---|
| Engine `Snapshot` | Carry `contributingData` (or an equivalent structured lineage block) | **Additive** |
| Existing extension point | `Snapshot.provenance: Readonly<Record<string,string>>` already exists and may host a structured, deterministically serialized lineage reference | Additive use of an existing field |
| Effective replay identity | Extended to include, for market-data executions: contributing snapshot identities + `provider` + `dataVersion` + `asOf` + `identityMappingVersion` + `namespaceVersion` | **Additive** |
| `DataSnapshot<T>` | Unchanged in identity; gains `receivedAt`/`mode`/`lineage`/`schemaVersion` (Part 4) | Additive |
| `ExecutionRequest` / `ExecutionResult` | **UNCHANGED** | — |
| Engines / scoring / calibration | **UNCHANGED** | — |

---

## H.4 Requirements

### Replay identity
Effective replay identity for a market-data execution =
`[input, contractVersion, calibrationVersion, runtimeConfiguration]` (existing, unchanged)
**+** `[contributing dataSnapshotIds, provider, dataVersion, asOf, identityMappingVersion, namespaceVersion]` (new).

**Rule:** two executions differing in any contributing data vintage **must** have different
effective replay identities. Silent vintage drift is prohibited.

### Provenance
Lineage must be reconstructible from the execution record alone — no provider round-trip.
Must satisfy NFR-01 (source, dataset/version, timestamps/as-of, lineage) and NFR-07 (auditable).

### PIT
A PIT execution records its as-of boundary and the vintage knowable at that boundary.
Re-running the same PIT query must resolve the **same** contributing snapshots, the same
identity mapping version, and produce the same effective replay identity.
A later correction (new `dataVersion`) must **not** retroactively alter a past PIT result.

### Multi-provider
Contributing snapshots may come from **different providers**. Each retains its own provider,
version and vintage. **Provider identity is never flattened away** in lineage — even though it
is not exposed in product DTOs (NFR-06).

### Multiple contributing snapshots
The set is **ordered and deterministic**. Order participates in identity, because merge order
is significant (Part 5). Each entry is individually addressable.

### Backward compatibility
An execution with **no** contributing market-data snapshots (SNAPSHOT-only, as today) must:
- produce the **same** effective replay identity as it does now,
- reproduce existing certified baselines byte-identically,
- require no change to existing golden fixtures.

**The delta is strictly additive and inert for existing executions.** This is essential —
otherwise the delta itself would invalidate the very baselines AD-4 is trying to protect.

### Deterministic serialization
Canonical field ordering; ISO-8601 UTC timestamps at fixed precision; stable numeric
formatting; stable ordering of the contributing set. Required for byte-identical replay.

---

## H.5 Migration / revalidation implications

| Implication | Detail |
|---|---|
| Existing snapshots | No migration — the field is absent and reads as "no contributing market data" |
| Existing replay baselines | Must remain byte-identical; **this is a required test** of the delta |
| New market-data executions | Carry full lineage from first execution |
| Revalidation | The delta touches a **certified engine-layer contract** → revalidation of replay/evidence suites required, **compounded by AD-4** (those suites do not currently execute) |
| Sequencing consequence | The delta cannot be validated until **M-1 is repaired** (external, AD-10). Specification can proceed; validation cannot |

---

## H.6 ⚠ AD-17 — UNRESOLVED, explicitly not resolved here

Current implementation (`replay/ReplayService.ts`):

```ts
replay(snapshotId: string): ReplayResult | undefined {
  const snapshot = this.store.get(snapshotId);
  if (!snapshot) return undefined;
  return { snapshotId, reproduced: true, byteIdentical: true, evidenceRefs: snapshot.evidenceRefs };
}
```

`reproduced: true` and `byteIdentical: true` are **hard-coded literals**. The method verifies
that a snapshot **record exists**; it does **not** re-execute and compare. This is defect **M-2**.

**Consequences recorded, not resolved:**

1. Whether this satisfies NFR-02 ("SNAPSHOT and PIT results are replayable and deterministic") is **AD-17 — UNRESOLVED**, an **existing-IIPS authority issue**.
2. AD-3's lineage extension makes replay identity *sufficient to disambiguate vintage*, but does **not** make replay *verify by recomputation*. **These are independent concerns.**
3. If AD-17 concludes recomputation is required, that is an **existing-IIPS change** owned by Ramki/Sai — **not** this program (AD-10 principle).
4. UI17 ReplayExplorer displays these literals and **must not present them as verified reproduction** (Part 10).

**This program neither fixes M-2 nor asserts that replay verification is adequate.**

---

## H.7 Authority summary

| Item | Status |
|---|---|
| AD-3 INCLUDE | **RESOLVED** — decision made |
| AD-6 dual-layer | **RESOLVED** — both identifiers preserved |
| Engine `Snapshot` contract change | **PENDING Ramki/Sai ADR** |
| AD-17 replay recomputation | **UNRESOLVED — existing-IIPS authority** |
| Validation of the delta | **BLOCKED on M-1 (external, AD-10) + AD-4** |
