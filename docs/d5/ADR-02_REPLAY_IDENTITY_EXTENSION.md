# ADR-02 — REPLAY IDENTITY EXTENSION (AD-3 + AD-6)

**Package type:** ADR **PREPARATION** for existing-IIPS authority review.
**Status: PENDING RAMKI/SAI ADR.**
**Preparation of this ADR is NOT approval of this ADR.** Nothing herein is implemented,
approved, certified, or accepted.

| Field | Value |
|---|---|
| ADR ID | ADR-02 |
| Origin | G-A **AD-3** (include `dataVersion` + `asOf`; provider remains linked) · **AD-6** (explicit dual-layer mapping) |
| Baseline | D4 Part H (`docs/d4/D4_06_SNAPSHOT_REPLAY_IDENTITY.md`), D4-B corrected |
| Affected certified components | Engine `Snapshot` record / effective replay identity |
| Named authority required | **Ramki / Sai** |
| Certification authority | **UNKNOWN (A2)** |
| Decision status | **PENDING RAMKI/SAI ADR — NOT APPROVED** |
| **Explicitly NOT in scope** | **AD-17 / M-2** — see §F |

---

## A. Decision question

> **May `dataVersion` + `asOf` + provider participate in effective replay identity, with
> explicit `data-*` ↔ `SNAP_*` linkage?**

---

## B. Current model (as-is)

Two snapshot identifiers exist, in different layers, and **they are not linked**.

| | Market-data input layer | Engine execution/result layer |
|---|---|---|
| Type | `DataSnapshot<T>` (`LiveDataRuntime.ts`) | `Snapshot` (`SnapshotService.ts`) |
| ID format | `` `data-${provider}-${dataVersion}-${asOf}` `` | `SNAP_*` via `idProvider.generate('SNAP', …)` |
| Carries | `provider`, `dataVersion`, `asOf`, `quality`, `completenessPct` | `engineId`, `metrics`, `scores`, `verdict`, `evidenceRefs`, `provenance` |
| **Data vintage fields** | **present** | **ABSENT** |

Certified replay identity (`program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json`):

```json
"replayIdentity": ["input", "contractVersion", "calibrationVersion", "runtimeConfiguration"]
```

**`dataVersion` and `asOf` are absent, and no linkage between the two identifiers exists.**

Under SNAPSHOT-only operation this is harmless — inputs are frozen golden fixtures. Under real
market data it becomes a correctness defect: two executions differing *only* in data vintage
would share one replay identity, and a replay could reproduce against an ambiguous vintage.
That contradicts `LiveDataRuntime`'s own stated invariant and breaches NFR-01/NFR-02.

---

## C. Proposed delta (D4 Part H design)

### C.1 Linkage structure

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
        └── identityMappingVersion : <security-master mapping version>   (D4 Part G)
        └── namespaceVersion       : <market-data namespace version>     (D4 Part I)
```

### C.2 Minimum contract delta

| Target | Delta | Nature |
|---|---|---|
| Engine `Snapshot` | Carry `contributingData` (or equivalent structured lineage block) | **Additive** |
| Existing extension point | `Snapshot.provenance: Readonly<Record<string,string>>` already exists and may host a deterministically serialized lineage reference | Additive use of an existing field |
| Effective replay identity | Extended, **for market-data executions only**, to include contributing snapshot identities + `provider` + `dataVersion` + `asOf` + `identityMappingVersion` + `namespaceVersion` | **Additive** |
| `DataSnapshot<T>` | Identity unchanged; gains `receivedAt` / `mode` / `lineage` / `schemaVersion` (D4 Part F) | Additive |
| `ExecutionRequest` / `ExecutionResult` | **UNCHANGED** | — |
| Engines / scoring / calibration / taxonomy | **UNCHANGED** | — |

### C.3 AD-6 — both identifiers preserved

**Neither identifier is replaced, merged or renamed.** They identify different things:
`data-*` = which market-data input snapshot was consumed; `SNAP_*` = which engine
execution/result was produced. Collapsing them would destroy information and modify a
certified identifier. The missing piece is only the **explicit, evidenced linkage**.

**Provider remains linked** per AD-3. (Provider identity remains governed-internal; its
exposure in product DTOs is separately constrained by NFR-06 — not decided here.)

---

## D. Compatibility

| Element | Assertion |
|---|---|
| SNAPSHOT-only executions | **PRESERVED** — unaffected |
| Existing golden executions | **MUST remain byte-identical** |
| Empty `contributingData` | Extension is **inert**; effective replay identity reduces exactly to today's four-element identity |
| Existing `SNAP_*` identity | **PRESERVED** — format, generation and semantics unchanged |
| Existing `data-*` identity | **PRESERVED** — format unchanged |
| Silent replacement of existing identity | **PROHIBITED** — no identifier scheme is replaced, renamed or migrated |
| Existing replay records | Unchanged; no migration required |
| Engines / methodology | **UNCHANGED** |

---

## E. Certification impact (D4 Part M reference)

| Ref | Item |
|---|---|
| **C3** | Snapshot immutability + `contributingData` lineage = **NEW certification requirement** |
| **C4** | Extended replay identity (data vintage) = **NEW certification requirement** |
| Evidence | **Byte-identical replay requirement** — existing golden executions reproduce unchanged |
| Evidence | **Ambiguity detection for market-data executions** — two executions differing only in data vintage must be distinguishable and must not share a replay identity |
| Owner | **A2 new-program certification authority — UNKNOWN.** Not assigned here |

**No certification is granted, renewed or implied by this document.**

---

## F. AD-17 boundary — CRITICAL

> **This ADR does NOT resolve AD-17. AD-17 remains UNRESOLVED.**

| | ADR-02 (this package) | AD-17 / M-2 (separate) |
|---|---|---|
| Concerns | The **AD-3 / AD-6 market-data identity extension** — linking `data-*` to `SNAP_*` and admitting data vintage into effective replay identity | The **existing `ReplayService` literal-return implementation**, which returns `reproduced: true` / `byteIdentical: true` as literals rather than as verified results |
| Origin | This new production market-data program | Pre-existing existing-IIPS defect, independent of this program |
| Owner | Ramki / Sai, as an additive extension | **Existing-IIPS authority** (AD-10 principle) |
| Status | PENDING ADR | **UNRESOLVED** |

**These two must NOT be merged into one approval.** Approving ADR-02 does not, and must not be
read to, validate the `ReplayService` literal returns. Conversely, rejecting or deferring
AD-17 does not block ADR-02's additive linkage.

**Consequence carried forward:** until AD-17 is resolved by its own named authority, UI17
ReplayExplorer must not present `reproduced` / `byteIdentical` as verified reproduction
(D4 Part L). This package does not change that.

---

## G. Authority

| Role | Assignment |
|---|---|
| **NAMED AUTHORITY REQUIRED** | **Ramki / Sai** — the engine `Snapshot` record and effective replay identity are certified existing-IIPS surfaces |
| Certification authority | **UNKNOWN (A2)** — not assigned, not inferred |
| AD-17 authority | **Existing-IIPS — separate; not this ADR** |
| This program's authority | **None over this decision.** It may only prepare the package |

---

## H. Decision status

# **PENDING RAMKI/SAI ADR**

- Not approved.
- Not implemented.
- No certification granted.
- **AD-17 remains UNRESOLVED and explicitly out of scope.**
- **Blocks:** P08 Historical/PIT (and, through it, downstream PIT-dependent work).

---

## I. Required evidence (to be produced **after** approval, not now)

1. Byte-identical replay of all existing golden executions with `contributingData` empty.
2. Ambiguity-detection test: two market-data executions differing only in `dataVersion`/`asOf`
   yield distinct effective replay identities.
3. Determinism: identical contributing snapshots ⇒ identical replay identity, with
   deterministic serialization of the lineage block.
4. Demonstration that `data-*` and `SNAP_*` formats are unchanged.
