# P02 — PROVIDER IDENTITY AND ADAPTER VERSIONING

**SPECIFICATION ONLY.** Authority: **NFR-06** (provider abstraction; provider identity never
surfaced), **AD-3 / ADR-02** (lineage), **AD-6** (dual-layer identity).

---

## 1. Stable internal provider identity

| # | Rule |
|---|---|
| PI-1 | `provider` is a **program-internal, stable identity token**. It is **not** a vendor name, brand, hostname, account or product SKU |
| PI-2 | It is **stable across adapter swaps** — this is what makes lineage continuous when an adapter is rewritten or re-versioned |
| PI-3 | It is **immutable once issued**. A different source is a **different** provider identity, never a re-pointed one |
| PI-4 | It participates in `snapshotId` (`data-${provider}-…`) and therefore in snapshot identity — so it **must never be renamed** |
| PI-5 | It participates in effective replay identity via ADR-02 `contributingData` |
| PI-6 | It is **never exposed in product DTOs or UI** (NFR-06, INT-004). Product surfaces expose *governed provenance*, not vendor identity |
| PI-7 | It is **never flattened away in lineage** — internal invisibility to the product is not invisibility to the audit trail |
| PI-8 | Multi-provider snapshots retain **per-source** attribution |

### 1.1 Identity vs adapter — the distinction that matters

| Concept | Identifies | Changes when | Stable across |
|---|---|---|---|
| `provider` | **The source of the data** | Never (a new source ⇒ a new identity) | Adapter rewrites, versions, protocol changes |
| `adapterId` | **The code that talks to it** | A distinct adapter implementation is introduced | Provider protocol minor changes |
| `adapterVersion` | **Which revision of that code** | Any behavioural or mapping change | — |

**Conflating them breaks lineage in both directions:** versioning `provider` would fracture the
history of a single source; omitting `adapterVersion` would make two different mappings of the
same payload indistinguishable.

---

## 2. Adapter identity and version

| # | Rule |
|---|---|
| AV-1 | Every adapter declares `adapterId` and `adapterVersion`; both are recorded in **every** snapshot's lineage block (`adapterId`, `adapterVersion`) |
| AV-2 | `adapterVersion` uses `MAJOR.MINOR` at minimum |
| AV-3 | **Any change to mapping, capability, error classification, or canonical output is at least a MINOR version change.** Silent behavioural change is prohibited |
| AV-4 | A change that alters the canonical value produced from an identical provider payload is **MAJOR** |
| AV-5 | An adapter version is **immutable once released**; corrections produce a new version |
| AV-6 | Adapter version participates in lineage, and therefore in auditability — two snapshots with identical `provider`/`dataVersion`/`asOf` but different adapter versions are **distinguishable in lineage** |

### 2.1 Adapter version vs `dataVersion` — never conflated

| Axis | Versions | Owner |
|---|---|---|
| `dataVersion` | The **content vintage** from the provider | Provider / adapter-derived |
| `adapterVersion` | The **code** that mapped it | This program |
| `providerSchemaVersion` | The **provider's** wire schema | Provider |
| `schemaVersion` | The **canonical P01** schema | P01 |
| `namespaceVersion` | The namespace scheme | ADR-01 (⚠ token pending OI-10) |
| `identityMappingVersion` | The AD-1 adapter mapping | **P04** |

**Six independent axes.** P01 defined four; P02 adds `adapterVersion` and
`providerSchemaVersion`. **None may be substituted for another.**

| # | Rule |
|---|---|
| VX-1 | An adapter bug-fix that changes output is an `adapterVersion` change — it is **not** a `dataVersion` change and must not be disguised as one |
| VX-2 | A provider content correction is a `dataVersion` change — it is **not** an adapter change |
| VX-3 | A provider wire-schema change is a `providerSchemaVersion` change, which **may** force an `adapterVersion` change, but **never** changes `provider` |
| VX-4 | `identityMappingVersion` is **passed through** from P04; an adapter may not originate or alter it |

---

## 3. Source / vendor metadata

| # | Rule |
|---|---|
| SM-1 | Where a contract, licence or audit obligation requires vendor attribution, it is recorded in **governed lineage metadata**, never in the canonical field space and never in a product DTO |
| SM-2 | `sourceRef` and optional `datasetVersion` carry dataset-level attribution |
| SM-3 | Attribution required to be *displayed* by a licence is a **product decision for P12/P13** under NFR-06 constraints — **recorded here, not decided** (DEP-P02-05) |
| SM-4 | **No endpoint, hostname, account identifier, key or credential** may appear in source metadata |

---

## 4. Snapshot identity participation

| # | Rule |
|---|---|
| SI-1 | `snapshotId` = `data-${provider}-${dataVersion}-${asOf}` — **format frozen** (AD-6). P02 changes nothing about it |
| SI-2 | `data-*` and engine-layer `SNAP_*` remain **distinct identifiers for distinct things** and are never merged, renamed or conflated |
| SI-3 | Because `provider` is embedded in `snapshotId`, **provider identity stability is a precondition for snapshot identity stability** |
| SI-4 | `adapterId`/`adapterVersion` are **not** in `snapshotId` — they live in lineage. This is deliberate: re-versioning an adapter must not change the identity of the data it fetched |
| SI-5 | Consequence of SI-4: `adapterVersion` **must** be in lineage, or two mappings of the same payload become indistinguishable. This is a hard requirement, not a convenience |

---

## 5. Governance of the provider-identity space

| # | Rule |
|---|---|
| PG-1 | Provider identities are issued from a **governed register**; ad-hoc identities are prohibited |
| PG-2 | Issuing an identity records: what the source is, when it was issued, and which domains it is expected to serve |
| PG-3 | Retiring a provider **retires the identity permanently**; it is never reused |
| PG-4 | Historical snapshots retain their original `provider` value forever |
| PG-5 | The register is **not created in P02** — it is a P05 operational artifact (DEP-P02-04). P02 defines its required content and rules |
