# P01 — IDENTITY AND LINEAGE CONTRACT

**SPECIFICATION ONLY.** Authority: **AD-1 ADAPTER MODEL** · **AD-3 INCLUDE** · **AD-6 dual-layer** · ADR-02 (approved, additive).

> P01 defines identity **references** and lineage **requirements**.
> **P04 builds the security master and the canonical identity mapping. P04 is not implemented here.**

---

## 1. The identity boundary (AD-1) — restated, not re-decided

| Plane | Authoritative identifier | Owner |
|---|---|---|
| **Data plane** (this program) | Canonical security / issuer / listing IDs | P04 |
| **Certified engine / CSIP boundary** | `companyId` — `NormalizedHolding.companyId` | **Existing-IIPS — UNTOUCHED** |

Crossing between the planes happens **only** through the explicit governed adapter.

| # | Rule |
|---|---|
| ID-1 | The canonical identity model **must not** replace, alias, shadow or coerce `companyId` |
| ID-2 | Adapter mappings are **explicit, auditable, versioned and evidenced**. **No silent coercion** |
| ID-3 | The mapping version (`identityMappingVersion`) is recorded on every snapshot whose identity crosses the adapter, and participates in effective replay identity (ADR-02) |
| ID-4 | P04 is **not** authorized as product-wide authoritative identity. Making it so requires a **new ADR** |
| ID-5 | There is **no data migration**: existing `companyId` values (`` `${sector}-H1` ``) are synthetic placeholders. This is an adapter problem, not a migration |
| ID-6 | A provider symbol is **never** an identity. `localSymbol` is explicitly non-authoritative |

### 1.1 Contract slots P01 defines (and only these)

| Slot | Purpose |
|---|---|
| `identity` | The identity reference the snapshot is about |
| `identityMappingVersion` | Version of the adapter mapping used |
| `<NS>identity.*` | The identity attribute slots enumerated in `P01_FIELD_DICTIONARY.md` §7 |
| `<NS>identity.mappedCompanyId` | Adapter **output** slot — read-only to the data plane, written only by the P04 adapter |

### 1.2 Non-instrument identities

| Domain | Identity kind | Rule |
|---|---|---|
| D08 macro | **Series identity** | Distinct identity space; **never** `companyId`, never an instrument ref |
| D10 venue | **Venue identity** (MIC-based) | Reference data, not an instrument |
| D06 news | Event identity + entity **links** | Links resolve through D05; a link is not an identity |

### 1.3 Open — NOT resolved by P01

| Item | State | Owner |
|---|---|---|
| **OI-08** identity cardinality 1 → N (real data implies N companies/sector vs today's 1; product-behaviour change) | **OPEN** | P04 |
| **OI-09** external identifier standard (ISIN / FIGI / CUSIP — none assumed authoritative) | **OPEN** | P04 |

P01 records that both **shape** the contract (`externalIdentifiers[]` exists as a slot;
cardinality is not constrained) but **neither is decided here**.

---

## 2. Snapshot identity (AD-6) — two identifiers, both preserved

| | Market-data input layer | Engine execution/result layer |
|---|---|---|
| Type | `DataSnapshot<T>` | `Snapshot` (`SnapshotService`) |
| ID | `` `data-${provider}-${dataVersion}-${asOf}` `` | `SNAP_*` |
| Meaning | **which market-data input** was consumed | **which engine execution** was produced |

| # | Rule |
|---|---|
| SI-1 | Neither identifier is replaced, merged or renamed. Collapsing them destroys information |
| SI-2 | `data-*` is authoritative for the market-data input layer; **never conflated** with `SNAP_*` |
| SI-3 | The missing piece is the **explicit linkage** — §3 |
| SI-4 | `snapshotId` is deterministic: identical `(provider, dataVersion, asOf)` ⇒ identical id |

---

## 3. Replay-identity linkage (ADR-02) — representation only

P01 guarantees the market-data side carries everything ADR-02's linkage needs:

```
engine execution/result  (SNAP_*)                      ← engine layer, NOT changed by P01
        └── contributingData: [                        ← ordered, one per contributing snapshot
              { dataSnapshotId, provider, dataVersion, asOf,
                receivedAt, mode, quality, completenessPct, lineage }
            ]
        └── identityMappingVersion
        └── namespaceVersion
```

| # | Rule |
|---|---|
| RI-1 | Every canonical snapshot supplies **all** of the fields listed in `contributingData` |
| RI-2 | The contributing set is **ordered and deterministic**; order participates in identity because merge order is significant |
| RI-3 | Each entry is **individually addressable**; provider identity is **never flattened away** in lineage, even though it is never exposed in product DTOs (NFR-06) |
| RI-4 | Two executions differing in **any** contributing data vintage **must** have different effective replay identities. Silent vintage drift is prohibited |
| RI-5 | An execution with **no** contributing market-data snapshot must produce the **same** effective replay identity as today and reproduce existing certified baselines **byte-identically**. The delta is additive and inert |
| RI-6 | Deterministic serialization: canonical field ordering, ISO-8601 UTC at fixed precision, stable numeric formatting, stable ordering of the contributing set |

### 3.1 Explicitly NOT done in P01

| # | Not done |
|---|---|
| 1 | No replay implementation |
| 2 | No `ReplayService` modification |
| 3 | No engine-layer `Snapshot` contract modification |
| 4 | No modification of `PROGRAM_v1.1_REPLAY_BASELINE.json` |
| 5 | **AD-17 is NOT resolved** — `ReplayService.replay()` returning `reproduced: true` / `byteIdentical: true` as **hard-coded literals** remains **UNRESOLVED**, an existing-IIPS authority issue (M-2) |
| 6 | No claim that replay verification is adequate. Lineage sufficiency to *disambiguate vintage* and replay *verification by recomputation* are **independent concerns** |
| 7 | **M-1 remains `OPEN_REVALIDATION_REQUIRED`**; E2E-030 is **NOT REVOKED and NOT RENEWED**. Validation of the delta remains blocked on M-1 |

---

## 4. Lineage block — normative content

Every canonical snapshot carries a lineage block sufficient to answer, **without contacting the
provider**: *where did this come from, which adapter produced it, at what version, when was it
received, and what transformation chain applied?*

| # | Element | Req. | Contract |
|---|---|---|---|
| L-1 | `sourceRef` | R | Upstream source/dataset reference (program-internal identity) |
| L-2 | `adapterId` | R | Adapter identity |
| L-3 | `adapterVersion` | R | Adapter version |
| L-4 | `transformationChainRef` | R | Ordered, addressable reference to the applied transformation chain |
| L-5 | `receivedAt` | R | Acquisition time |
| L-6 | `datasetVersion` | C | Where the provider exposes one distinct from `dataVersion` |
| L-7 | `entitlementRef` | C | REQUIRED for licence-restricted content (D06, D09) |
| L-8 | `governanceClassification` | C | REQUIRED where `DataGovernanceRuntime` classification applies (AD-11) |
| L-9 | `identityMappingVersion` | C | REQUIRED when identity crossed the adapter |
| L-10 | `namespaceVersion` | R | Namespace scheme version |
| L-11 | `adjustmentBasisRef` | C | REQUIRED for adjusted series (D02/D04) — adjustment factors are **evidence-bearing** |

### 4.1 Field-level provenance

Each `CanonicalField.provenance` is a **reference into** this block, sufficient to attribute the
individual field to its source. In a multi-source snapshot the block holds multiple entries and
each field points at exactly one.

---

## 5. Lineage rules

| # | Rule |
|---|---|
| LN-1 | Lineage is **mandatory** (AD-3). A snapshot without a complete lineage block is **invalid** and is rejected, not degraded |
| LN-2 | Lineage must satisfy NFR-01 (source, dataset/version, timestamps/as-of, lineage) and NFR-07 (auditable) |
| LN-3 | Lineage is **reconstructible from the record alone** — no provider round-trip |
| LN-4 | **No provider leakage:** provider identity stays behind the data-plane boundary. Product DTOs expose governed provenance, not vendor names (NFR-06, INT-004) |
| LN-5 | Multi-provider snapshots retain **per-source** attribution; flattening is prohibited |
| LN-6 | Lineage is immutable with the snapshot; a lineage correction is a **new `dataVersion`** |
| LN-7 | A namespace-collision rejection is emitted as an **evidence-bearing event** (ADR-01 §5), including colliding keys, contributing snapshot IDs, `engineId`, `requestId` and namespace version |

---

## 6. Evidence conformance

All references in this package conform to `docs/p00/P00_EVIDENCE_CONVENTIONS.md`: repository +
path, line/section, **pinned commit**, artifact identity. Pinned commits used by P01 are listed
in `P01_EVIDENCE.md`. **CD-01** (line-citation drift `LiveDataRuntime.ts:76` vs `:78`) remains
open and is inherited, not re-litigated.
