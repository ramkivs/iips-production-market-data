# P04 — LINEAGE AND VERSION IMPACT

**SPECIFICATION ONLY.** Authority: **AD-3 INCLUDE** · **AD-6 dual-layer** · **ADR-02** (approved, additive).
P04 is the phase that **populates** the `identityMappingVersion` axis P01 reserved for it.

---

## 1. Version axes — six, and still six

`P02_PROVIDER_IDENTITY_VERSIONING.md` §2.1 and **INV-3**, unchanged:

| Axis | Versions | Owner |
|---|---|---|
| `schemaVersion` | Canonical P01 schema | P01 |
| `dataVersion` | Provider content vintage | Provider / adapter-derived |
| `namespaceVersion` | Namespace scheme | ADR-01 (⚠ token pending **OI-10**) |
| **`identityMappingVersion`** | **The AD-1 adapter mapping** | **P04** |
| `adapterVersion` | The code that mapped it | This program (P02) |
| `providerSchemaVersion` | Provider wire schema | Provider |

| # | Rule |
|---|---|
| **VA-1** | ⚠ **Six independent axes. P04 adds NO seventh axis** (INV-3). It supplies the *value space* of an axis that already exists |
| **VA-2** | **None may be substituted for another.** `identityMappingVersion` is never conflated with `adapterVersion`, `dataVersion` or `schemaVersion` |
| **VA-3** | P04 does **not** modify `namespaceVersion` and does **not** decide **OI-10**. That token remains unrecorded and is **not** inferred |

---

## 2. `identityMappingVersion`

| # | Rule |
|---|---|
| **IM-1** | **The mapping set is versioned; an execution records which mapping version it used** (ADP-4) |
| **IM-2** | Per `P01_DATA_CONTRACT.md` field 13, it is **CONDITIONAL** — *"REQUIRED whenever `identity` resolves through the AD-1 adapter. Value produced by P04."* P04 **produces the value; the slot's conditionality is unchanged** |
| **IM-3** | **ID-3 preserved**: it is recorded on every snapshot whose identity crosses the adapter, and participates in effective replay identity (ADR-02) |
| **IM-4** | It versions the **mapping set**, not an individual mapping record; individual records are effective-dated (ED-1) |
| **IM-5** | **Immutable once released**; corrections produce a new version — parallel to AV-5. ⚠ A released mapping version is **never** re-pointed |
| **IM-6** | ⚠ **Any change to mapping content, cardinality resolution or identifier authority is a version change.** **Silent behavioural change is prohibited** — parallel to AV-3 |
| **IM-7** | Two snapshots with identical `provider`/`dataVersion`/`asOf` but different `identityMappingVersion` are **distinguishable in lineage** — parallel to AV-6 |
| **IM-8** | It remains a **pass-through** at the P03 boundary — `P03_LINEAGE_AND_VERSION_IMPACT.md` records P03 impact as **NONE**, and P04 does not change that |

---

## 3. Snapshot identity — unchanged

| # | Rule |
|---|---|
| **SN-1** | ⚠ **Snapshot identity remains `data-${provider}-${dataVersion}-${asOf}`** (INV-2). **P04 adds NO component to it** |
| **SN-2** | `identityMappingVersion` lives in **lineage, not in `snapshotId`** — exactly as `adapterVersion` does (**INV-4**, P02 SI-4/SI-5) |
| **SN-3** | **SI-4 determinism preserved**: identical `(provider, dataVersion, asOf)` ⇒ identical `snapshotId` |
| **SN-4** | ⚠ **Never conflated with the engine `SNAP_*` identity** (SI-1/SI-2). Two identifiers, two layers, both preserved; collapsing them destroys information |
| **SN-5** | P04 introduces **no third identity layer** |

---

## 4. Replay linkage (ADR-02) — additive, unchanged

| # | Rule |
|---|---|
| **RL-1** | **ADR-02 `contributingData` is unchanged** (INV-8). P04 **adds no element** to it |
| **RL-2** | Replay identity is **unaffected** by P04; the dual-layer model is preserved |
| **RL-3** | `identityMappingVersion` travelling in lineage is what makes **a replay resolve identity the same way** (ADP-5) — this is the existing ADR-02 mechanism, not a new one |
| **RL-4** | **Backward compatibility when `contributingData` is empty is preserved** (`D8_STATUS` `backward_compatible_when_contributing_data_empty: true`) |

---

## 5. ⚠ AD-17 replay firewall — preserved

| # | Rule |
|---|---|
| **AF-1** | **AD-17 / M-2 is UNRESOLVED** — `ReplayService` returns `reproduced: true` and `byteIdentical: true` as **literals**, not verified results. Owner: **EXISTING-IIPS**. `resolved_by_ADR-02: false` |
| **AF-2** | ⚠ **P04 does not resolve, repair, work around or mask AD-17**, and must not be read as doing so |
| **AF-3** | ⚠ **Identity reproducibility ≠ verified replay.** RP-1 guarantees deterministic *identity resolution* as-of. It says **nothing** about byte-identical reproduction, and must never be presented as evidence of it |
| **AF-4** | **UI17 ReplayExplorer must not present these values as verified reproduction** — unchanged constraint, P13 scope |
| **AF-5** | P04 touches **no** replay component: `ReplayService`, `DataBoundExecutor`, `LiveDataRuntime.ts` and `PROGRAM_v1.1_REPLAY_BASELINE.json` are **untouched** |

---

## 6. Net impact summary

| Area | P04 impact |
|---|---|
| `schemaVersion` | **NONE** |
| `dataVersion` | **NONE** |
| `namespaceVersion` | **NONE** — OI-10 untouched |
| `identityMappingVersion` | ✅ **Value space specified — this is P04's contribution** |
| `adapterVersion` | **NONE** |
| `providerSchemaVersion` | **NONE** |
| `snapshotId` format | **NONE** |
| Engine `SNAP_*` | **NONE** |
| ADR-02 `contributingData` | **NONE** |
| P02 error taxonomy E1–E8 | **NONE** (FC-6) |
| Five timestamps / availability enum | **NONE** |
| AD-17 | **NONE — remains UNRESOLVED** |
