# P01 — CANONICAL MARKET-DATA CONTRACT

**Phase:** P01 — Data Contract (tracker: *Data Contract & Canonical Domain Model*)
**Status:** SPECIFICATION — **NOT ACCEPTED**. P01 gate acceptance is a separate explicit act.
**Authority to execute:** `AUTHORIZED_TO_PROCEED` (D8) · P00 gate ACCEPTED (`94ee533`)
**Certification:** `NONE_GRANTED` · **Production activation:** `NOT_AUTHORIZED`

> **This is a contract-definition phase.** No provider adapter, acquisition, normalization,
> quality, security-master, PIT-storage, replay, engine, API or UI implementation is performed
> or authorized here.

---

## 1. Scope and non-scope

### 1.1 In scope

The canonical, **provider-independent** contract for a market-data record and its enclosing
snapshot: identity references, provenance, timestamps, currency, units, value representation,
quality/freshness metadata, PIT semantics, versioning, lineage, snapshot identity, validation
and compatibility.

### 1.2 Explicitly out of scope (deferred, with owning phase)

| Excluded | Owning phase |
|---|---|
| Provider adapters, credentials, entitlement enforcement | P02, P03 |
| Security master, canonical identity resolution, mappings | **P04** |
| Acquisition / ingestion runtime | P05 |
| Normalization runtime | P06 |
| Data-quality / freshness runtime | P07 |
| PIT storage, corporate-action adjustment, replay implementation | P08 |
| Fundamentals mapping execution | P09 |
| Engine integration | P11 |
| APIs / DTOs | P12 |
| UI | P13 |
| Certification, activation | P15–P17 |

**No executable source code is produced by P01.** The authoritative P01 tracker rows
(`P01-01`…`P01-05`, sheet `Work Tracker`) call for specifications, contracts and fixtures at
the *phase gate*; the D4 standing prohibition on `docs/d4/D4_12_PHASE_SEQUENCE.md:25`
("⚠ Standing prohibition: **implementation prohibited**") governs. Contract artifacts are
therefore expressed as normative documents, not `.ts` files.

---

## 2. Governing invariants inherited (not re-decided by P01)

| # | Invariant | Source |
|---|---|---|
| INV-1 | **Sole ingress:** `MarketDataSource<T>` → `DataSnapshot<T>`. No second ingress contract. | AD-2 · `D4_04_INGRESS_CONTRACT_DELTA.md` §F.1 |
| INV-2 | Snapshots are **immutable and versioned**; corrections produce a new `dataVersion`, never mutation. | `D4_04` §F.3 |
| INV-3 | **Identity adapter model (AD-1):** canonical identity is authoritative in the data plane only; certified `companyId` / CSIP boundary is untouched. | `D4_05_SECURITY_MASTER_ADAPTER.md` §G |
| INV-4 | **Namespace mandatory (AD-16)** on every market-data field key; collisions fail closed (C1–C6). | `D4_07_FIELD_NAMESPACE.md` §I.2 · ADR-01 |
| INV-5 | **Lineage mandatory (AD-3):** `provider` + `dataVersion` + `asOf` reach execution lineage. | `D4_06_SNAPSHOT_REPLAY_IDENTITY.md` §H.3 · ADR-02 |
| INV-6 | **Mode explicit (SPEC ¶17):** LIVE / SNAPSHOT / PIT never silently mixed. | `D4_02_DATA_DOMAINS.md` §D.12 |
| INV-7 | **Quality never coerced (NFR-04):** `quality` / `completenessPct` propagate. | `D4_04` §F.7 |
| INV-8 | **No methodology invention (SPEC ¶132/133):** no new engine metric keys. | `D4_02` §D.12 |
| INV-9 | All deltas are **additive**; SNAPSHOT-only executions behave byte-identically to today. | `D4_06` §H.4 |
| INV-10 | **No provider leakage** to product DTOs (NFR-06). | `D4_04` §F.7 |

---

## 3. The canonical record model

P01 defines **three nested levels**. They are contract levels, not classes.

```
CanonicalSnapshot            ← the unit of ingress and of identity
  ├── SnapshotMeta           ← provider, version, vintage, mode, quality, lineage
  ├── IdentityRef            ← what the data is about (see P01_IDENTITY_AND_LINEAGE.md)
  └── fields: CanonicalField[]   ← the observations, namespaced
        └── CanonicalField   ← key, value, type, unit/currency, times, quality, provenance
```

`CanonicalSnapshot` is the contract shape carried as the `T` of `DataSnapshot<T>` plus the
additive `DataSnapshot` fields specified in `D4_04` §F.3. **It is not a parallel type** —
constructing one would violate INV-1 / AD-2.

### 3.1 CanonicalSnapshot — normative fields

| # | Field | Req. | Contract |
|---|---|---|---|
| 1 | `snapshotId` | **REQUIRED** | `data-${provider}-${dataVersion}-${asOf}` — format frozen; authoritative for the market-data input layer (AD-6). **Never** conflated with engine-layer `SNAP_*` |
| 2 | `provider` | **REQUIRED** | Stable program-internal provider identity; stable across adapter swaps; never exposed in product DTOs |
| 3 | `dataVersion` | **REQUIRED** | Monotonic-per-provider version token. Any source change **must** yield a new value |
| 4 | `schemaVersion` | **REQUIRED** | Version of the canonical field schema (see `P01_VERSIONING_COMPATIBILITY.md`) |
| 5 | `namespaceVersion` | **REQUIRED** | Version of the field-namespace scheme. Token itself **not yet fixed** — OI-10 |
| 6 | `asOf` | **REQUIRED** | Market-data time — the snapshot point. ISO-8601 UTC, fixed precision |
| 7 | `receivedAt` | **REQUIRED** | Acquisition/ingest time. Additive per `D4_04` §F.2 |
| 8 | `mode` | **REQUIRED** | `LIVE` \| `SNAPSHOT` \| `PIT`. Never inferred |
| 9 | `pitBoundary` | **CONDITIONAL** | REQUIRED when `mode = PIT`; PROHIBITED otherwise |
| 10 | `quality` | **REQUIRED** | `good` \| `stale` \| `partial` \| `unavailable` (existing enum, unchanged) |
| 11 | `completenessPct` | **REQUIRED** | `0`–`100` inclusive |
| 12 | `identity` | **CONDITIONAL** | `IdentityRef` — REQUIRED for instrument-keyed domains; series identity for D08 (see §5) |
| 13 | `identityMappingVersion` | **CONDITIONAL** | REQUIRED whenever `identity` resolves through the AD-1 adapter. Value produced by P04 |
| 14 | `lineage` | **REQUIRED** | Structured lineage block (see `P01_IDENTITY_AND_LINEAGE.md` §4) |
| 15 | `domain` | **REQUIRED** | One of D01–D10 from the D4 approved inventory. No new domains |
| 16 | `fields` | **REQUIRED** | Frozen map of namespaced key → `CanonicalField`. May be empty **only** when `quality = 'unavailable'` |

**Immutability:** the snapshot and its `fields` are deeply frozen. Attempted mutation is a
hard error, never a silent no-op (`D4_04` §F.3).

### 3.2 CanonicalField — normative fields

| # | Field | Req. | Contract |
|---|---|---|---|
| 1 | `key` | **REQUIRED** | Namespaced canonical key. Namespace **token pending OI-10** — see §4 |
| 2 | `value` | **REQUIRED** | Typed value, or the explicit absence marker (`P01_VALIDATION_RULES.md` §4) |
| 3 | `dataType` | **REQUIRED** | `decimal` \| `integer` \| `string` \| `boolean` \| `timestamp` \| `enum` \| `identifier` |
| 4 | `unit` | **CONDITIONAL** | REQUIRED for dimensioned quantities; PROHIBITED for dimensionless |
| 5 | `currency` | **CONDITIONAL** | REQUIRED for monetary values; ISO-4217 |
| 6 | `precision` | **CONDITIONAL** | REQUIRED for `decimal`; declared scale |
| 7 | `observationTime` | **CONDITIONAL** | Event/observation time where the datum has one distinct from `asOf` |
| 8 | `effectiveTime` | **CONDITIONAL** | REQUIRED for effective-dated data (D04, D05, D10) |
| 9 | `publicationTime` | **CONDITIONAL** | REQUIRED for revision-bearing data (D07, D08) |
| 10 | `availability` | **REQUIRED** | `PRESENT` \| `NULL_ASSERTED` \| `NOT_APPLICABLE` \| `NOT_PROVIDED` \| `WITHHELD` (§ `P01_VALIDATION_RULES.md` §4) |
| 11 | `quality` | **OPTIONAL** | Field-level override; absent ⇒ inherits snapshot quality |
| 12 | `provenance` | **REQUIRED** | Reference into the snapshot lineage block; sufficient to attribute the field to a source |
| 13 | `pitEligible` | **REQUIRED** | Whether the field may be used in PIT queries (see `P01_SCHEMA_CATALOG.md`) |
| 14 | `evaluationTime` | **CONDITIONAL** | T6 — the evaluation / scoring / threshold-assessment instant. ISO-8601 UTC with explicit `Z`, precision per TS-2. Present when an evaluation, scoring or threshold assessment contributed to the datum. Clock source: evaluation engine evaluation boundary, recorded once, never back-filled or recomputed (TS-7). **Never** implicit wall-clock "now"; **never** repurposes T1–T5. Absent when no evaluation contributes (BC-3/BC-4). Added by Act A / Act B — schema `1.0` → `1.1` (MINOR, SV-2) |

---

## 4. Field namespace — OI-10 PRESERVED, NOT RESOLVED

ADR-01 is **APPROVED for execution**; the exact namespace token is
**`APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING`** (OI-10).

**This contract does not choose the token.** The contract is defined structurally:

| Element | P01 position |
|---|---|
| Every market-data field key carries a namespace | **FIXED by ADR-01 / AD-16** |
| Key has the structural form `<NAMESPACE-TOKEN><domain-segment><separator><field-segment>` | **FIXED structurally** |
| `<domain-segment>` ties the field to its D01–D10 domain for lineage attribution | **FIXED** |
| The literal token, separator characters and casing | **NOT FIXED — OI-10 open** |
| `MD:<domain>.<field>` | **ILLUSTRATIVE ONLY — NOT ADOPTED, NOT APPROVED** |
| Namespace participates in `namespaceVersion` and thus replay identity | **FIXED** (ADR-02) |
| Collision rules C1–C6 fail-closed | **FIXED** (ADR-01) |

Throughout this package the placeholder **`<NS>`** denotes the unrecorded token. `<NS>` is a
documentation device, **not** a proposed token. Every field-dictionary entry is expressed as
`<NS>` + domain segment + field segment, so the dictionary is complete and stable **without**
resolving OI-10; recording the token later is a substitution, not a redesign.

**Downstream consequence (unchanged):** OI-10 continues to block field-key work in P05, P06
and P11.

---

## 5. Identity boundary (AD-1) — contract-level only

P01 defines **identity references and required identity fields**. It does **not** build the
security master, resolve identifiers, or choose an external identifier standard.

| Concern | P01 | Owning phase |
|---|---|---|
| That a snapshot must carry an identity reference | **DEFINED** | — |
| Required attributes of that reference | **DEFINED** | — |
| Canonical security/issuer/listing model | Referenced from `D4_05` §G.2 as the P04 target | **P04** |
| Resolution of provider symbol → canonical ID | **NOT DEFINED** | **P04** |
| `canonicalId` → `companyId` adapter mapping | **Contract slot defined** (`identityMappingVersion`) | **P04** |
| Cardinality 1 → N | **OI-08 — OPEN** | P04 |
| External identifier standard (ISIN/FIGI/CUSIP/…) | **OI-09 — OPEN** | P04 |

**Hard rule:** the canonical market-data identity **must not** replace, alias or coerce the
certified `NormalizedHolding.companyId` CSIP join key. All crossing is through the explicit,
versioned, evidenced AD-1 adapter. Full detail: `P01_IDENTITY_AND_LINEAGE.md`.

---

## 6. Replay-identity representation (ADR-02) — representation only

The contract carries the fields ADR-02 requires so that P08/P11 can construct the linkage:

- `snapshotId` in the frozen `data-${provider}-${dataVersion}-${asOf}` form;
- `provider`, `dataVersion`, `asOf`, `receivedAt`, `mode`, `quality`, `completenessPct`, `lineage`;
- `identityMappingVersion` and `namespaceVersion`;
- support for an **ordered set** of contributing snapshots per execution (`D4_04` §F.5).

**Not done here:** no replay implementation, no `ReplayService` change, no `Snapshot`
contract change, no engine change, **no resolution of AD-17**. AD-17 (`ReplayService`
returns `reproduced: true` / `byteIdentical: true` as hard-coded literals) remains
**UNRESOLVED** and is an existing-IIPS authority matter (`D4_06` §H.6).

**Backward-compatibility requirement carried forward:** an execution with **no** contributing
market-data snapshot must produce the same effective replay identity as today and reproduce
existing certified baselines byte-identically (`D4_06` §H.4).

---

## 7. Contract design requirements A–P — where each is satisfied

| Req | Requirement | Location |
|---|---|---|
| A | Required vs optional fields | This doc §3; `P01_FIELD_DICTIONARY.md` |
| B | Null / missing / unavailable semantics | `P01_VALIDATION_RULES.md` §4 |
| C | Timestamp semantics and timezone | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1–3 |
| D | Currency semantics | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §4 |
| E | Unit semantics | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §5 |
| F | Numeric precision | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §6 |
| G | Source / provenance | `P01_IDENTITY_AND_LINEAGE.md` §4 |
| H | Data-version semantics | This doc §8 |
| I | Snapshot / as-of semantics | This doc §9 |
| J | Historical / PIT compatibility | This doc §10 |
| K | Lineage | `P01_IDENTITY_AND_LINEAGE.md` §4–5 |
| L | Quality / freshness metadata | This doc §11 |
| M | Contract versioning | `P01_VERSIONING_COMPATIBILITY.md` §1–3 |
| N | Backward / forward compatibility | `P01_VERSIONING_COMPATIBILITY.md` §4–6 |
| O | Validation requirements | `P01_VALIDATION_RULES.md` §1–3 |
| P | Rejection behaviour | `P01_VALIDATION_RULES.md` §5–6 |

---

## 8. Data-version semantics (H)

| # | Rule |
|---|---|
| DV-1 | `dataVersion` identifies the **vintage of the source content**, not the schema. Schema is `schemaVersion` |
| DV-2 | Any change in source content **must** produce a new `dataVersion`. Silent mutation is prohibited |
| DV-3 | A correction/restatement is a **new** `dataVersion` at the **same** `asOf`, never an edit |
| DV-4 | `dataVersion` is opaque to consumers: comparable for equality, **not** required to be orderable across providers |
| DV-5 | `(provider, dataVersion, asOf)` uniquely determines `snapshotId`; identical inputs must yield an identical `snapshotId` (determinism, `D4_04` §F.4) |
| DV-6 | `dataVersion` participates in effective replay identity (ADR-02) |

## 9. Snapshot / as-of semantics (I)

| # | Rule |
|---|---|
| SN-1 | A snapshot is **immutable** once constructed |
| SN-2 | `asOf` is **market-data time**, distinct from `receivedAt` (ingest) and from field-level `observationTime` / `effectiveTime` / `publicationTime` |
| SN-3 | A snapshot carries exactly one `mode`; mixed-mode snapshots are **invalid** (INV-6) |
| SN-4 | An execution may consume **multiple** contributing snapshots; the set is **ordered and deterministic**, and each retains its own identity. Flattening into one opaque bag is prohibited (`D4_04` §F.5) |
| SN-5 | A failed or degraded acquisition **must not** be presented as `quality: 'good'` |
| SN-6 | Serialization is deterministic: canonical key ordering, ISO-8601 UTC at fixed precision, stable numeric formatting |

## 10. Historical / PIT compatibility (J)

| # | Rule |
|---|---|
| PIT-1 | `mode = PIT` requires an explicit `pitBoundary`; the snapshot contains only data **knowable at** that boundary |
| PIT-2 | PIT queries are **repeatable**: same boundary ⇒ same contributing snapshots, same `identityMappingVersion`, same effective replay identity |
| PIT-3 | A later correction (new `dataVersion`) **must not** retroactively alter a past PIT result |
| PIT-4 | Publication time and effective time are both preserved for revision-bearing data; collapsing them is prohibited |
| PIT-5 | Each field declares `pitEligible`. A field that is not PIT-eligible **must not** be served in a PIT response |
| PIT-6 | PIT **storage** is not specified here — P08 |

## 11. Quality and freshness metadata (L)

| # | Rule |
|---|---|
| Q-1 | `quality` uses the existing enum unchanged: `good` \| `stale` \| `partial` \| `unavailable` |
| Q-2 | `completenessPct` (0–100) must reflect the actual proportion of contracted fields present |
| Q-3 | Quality is **propagated, never coerced or dropped** (NFR-04/NFR-09) |
| Q-4 | Freshness is **derived**, from `receivedAt`, `asOf` and the applicable session/calendar baseline (D10) — the contract requires the inputs; P07 computes and thresholds |
| Q-5 | A **contract violation is not a quality state.** A namespace collision or structural invalidity is a rejection, not `quality: 'partial'` (ADR-01 §5) |
| Q-6 | Field-level `quality` may only be **equal to or worse than** the snapshot-level value |

---

## 12. What P01 does NOT decide

| # | Deferred | Owner |
|---|---|---|
| 1 | The exact namespace token | OI-10 / ADR-01 authority |
| 2 | Identity cardinality 1 → N | OI-08 / P04 |
| 3 | External identifier standard | OI-09 / P04 |
| 4 | Whether replay verifies by recomputation | AD-17 / existing-IIPS authority |
| 5 | Any existing-IIPS defect (M-1, M-5, M-6) | Existing-IIPS authority |
| 6 | Alternative-data applicability criteria | OI-05 / P10 |
| 7 | Whether market-data fundamentals replace, supplement or re-source existing displays | OI-06 |
| 8 | Any new engine metric | Ramki/Sai methodology authority — **not this program** |

Recording an open item does **not** resolve it.

---

## 13. Gate position

P01 is **NOT accepted** by this document. Governing rule: **"Explicit gate acceptance; no
automatic promotion."** Next phase after acceptance: **P02 — Provider Abstraction**.
