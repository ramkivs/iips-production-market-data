# P04 — SCOPE AND BOUNDARY

**SPECIFICATION ONLY — NO IMPLEMENTATION.**
**Phase:** P04 — Instrument / Security Master · **Gate intent:** Identity/master gate
**Baseline HEAD:** `9a26ac70058a4410ed99905f0aa3d3a18e87ba17`
**Governing authority:** **AD-1 ADAPTER MODEL** (`docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md` §G.9 — *"RESOLVED — authorized"*)

> **This is a work-package preparation artifact.** It is **not** a gate acceptance record,
> not certification evidence, and not an activation authorization.
> **P04 is NOT ACCEPTED.** Formal gate status remains **4 of 18**.

---

## 1. Purpose

Per SPEC ¶40 and TRACKER *Phase Roadmap*!P04, verbatim:

> *"Establish authoritative instrument identity, mappings, listings, exchanges, currencies and
> lifecycle state."*

P04 owns data domain **D05 — Instrument / security master**, whose consumers are recorded as
**"All domains"** (`docs/d4/D4_02_DATA_DOMAINS.md` §D.6), and contributes to **D10 — Exchange /
reference metadata** (phases *"P04–P05"*).

---

## 2. Authorized content decisions incorporated

Both decisions previously blocking P04 entry are now **RESOLVED BY EXPLICIT PROGRAM AUTHORITY**
and are incorporated throughout this package. They are **not reopened** anywhere.

| Item | Prior state | **Authorized decision** | Where specified |
|---|---|---|---|
| **OI-08** identity cardinality | OPEN | **1:N** — one canonical company/entity identity **may map to multiple** securities / instruments / listings; each security/instrument carries **its own immutable canonical security ID**; existing `companyId` remains the CSIP join key at the existing boundary, **never redefined, removed or retyped**; the synthetic `${sector}-H1` model is **not** forced into the new master | `P04_CANONICAL_SECURITY_MODEL.md` §3 · `P04_IDENTITY_ADAPTER_CONTRACT.md` §4 · `P04_CSIP_NON_REGRESSION.md` §4 |
| **OI-09** external identifier standard | OPEN | **FIGI / OpenFIGI is the authoritative external security identifier standard.** The program-internal canonical security ID **remains distinct from FIGI**. ISIN / CUSIP / SEDOL may be carried as **additional non-authoritative** identifiers where available. Provider-native IDs and provider symbols are **never** canonical identity. Mapping provenance, uniqueness, effective dating and **fail-closed** unresolved mappings must be explicit | `P04_CANONICAL_SECURITY_MODEL.md` §5 · `P04_VALIDATION_RULES.md` §3 |

⚠ **Authority rule.** These decisions are authorized. No P04 artifact reopens, reinterprets,
downgrades or substitutes them, and no further authority decision on OI-08 or OI-09 is requested.

---

## 3. In scope — what P04 establishes

| # | Element | Artifact |
|---|---|---|
| S-1 | Authoritative instrument / security identity | `P04_CANONICAL_SECURITY_MODEL.md` §2 |
| S-2 | Canonical security ID — program-internal, immutable, unique | §2.1 |
| S-3 | Issuer / company / entity relationship | §3 |
| S-4 | **1:N** company/entity → securities/instruments/listings (**OI-08**) | §3.2 |
| S-5 | Canonical listing identity | §4 |
| S-6 | Exchange/venue reference — **MIC-based** | `P04_EXCHANGE_VENUE_REFERENCE.md` |
| S-7 | **FIGI as authoritative external identifier standard** (**OI-09**) | `P04_CANONICAL_SECURITY_MODEL.md` §5 |
| S-8 | Separation of program-internal identity from external identifiers | §5.1 |
| S-9 | Provider-neutral identity mapping | `P04_IDENTITY_ADAPTER_CONTRACT.md` §2 |
| S-10 | Mapping provenance | §5 |
| S-11 | Uniqueness constraints | `P04_CANONICAL_SECURITY_MODEL.md` §6 |
| S-12 | Lifecycle state | `P04_LIFECYCLE_AND_EFFECTIVE_DATING.md` §2 |
| S-13 | Effective dating | §3 |
| S-14 | Bidirectional security ↔ listing ↔ exchange relationships | `P04_EXCHANGE_VENUE_REFERENCE.md` §4 |
| S-15 | Explicit unresolved / unmapped failure behaviour (**fail-closed**) | `P04_IDENTITY_ADAPTER_CONTRACT.md` §6 |
| S-16 | `identityMappingVersion` impact | `P04_LINEAGE_AND_VERSION_IMPACT.md` §2 |
| S-17 | Snapshot lineage / replay impact | §3 |
| S-18 | CSIP non-regression boundary | `P04_CSIP_NON_REGRESSION.md` |

---

## 4. Out of scope — explicit exclusions

| # | Excluded | Owner | Basis |
|---|---|---|---|
| X-1 | **P04 as product-wide authoritative identity** | Requires a **NEW ADR** | `D4_05` §G.9 · `P01_IDENTITY_AND_LINEAGE` ID-4 |
| X-2 | `companyId` semantics at the certified CSIP boundary | **EXISTING-IIPS** | `D4_05` §G.4 |
| X-3 | Acquisition / ingestion / provider adapters | **P05** | TRACKER `P05-01/02/03` |
| X-4 | Normalization pipeline | **P06** | TRACKER `P06-01` |
| X-5 | Data quality / freshness / reconciliation | **P07** | TRACKER |
| X-6 | PIT storage, adjusted/unadjusted series, **corporate actions** | **P08** | TRACKER `P08-02` dep `P04-03` |
| X-7 | The exact namespace token (**OI-10**) | Ramki/Sai recording | `D8_STATUS` `OI-10.blocks:[P05,P06,P11]` — **P04 absent** |
| X-8 | Engine integration | **P11** | TRACKER |
| X-9 | Certified APIs · UI integration | P12 · P13 | TRACKER |
| X-10 | Any certification (C1–C12) | **A2 — none granted** | `D8_EXECUTION_AUTHORIZATION` §2 |
| X-11 | Production activation | **A4 — not authorized** | ibid. |
| X-12 | Any production code, schema, migration or configuration | Implementation phases | This package is specification only |
| X-13 | A P04 gate acceptance record | A3 — a separate explicit act | `P00_GATE_MODEL` promotion rule |

---

## 5. Existing-IIPS boundary — depend on, never modify

**Not modified by P04:** `iips-review-recovered` (any file) · existing-IIPS source or tests ·
any of the **13 certified engines** · scoring · calibration · **sector taxonomy** ·
Auto Option-A · Materials G1–G6 · Telecom D16 · `LiveDataRuntime.ts` · `DataBoundExecutor` ·
`ReplayService` · E2E-030 artifacts · `PROGRAM_v1.1_REPLAY_BASELINE.json`.

**Remains existing-IIPS responsibility, not P04's:** M-1 repair/revalidation · **AD-17**
resolution · M-5 · M-6 · existing-IIPS methodology and certification changes
(`D8_STATUS.existing_iips_boundary.forbidden_to_this_program`).

**Certified constraint carried forward verbatim** (`D4_05` §G.4): `NormalizedHolding.companyId`
is the certified CSIP join key and **must remain untouched** — no field added, removed or
retyped; `companyId` remains a plain `string` at that boundary.

---

## 6. Preserved upstream invariants

P04 preserves **INV-1 … INV-10** (`docs/CHECKPOINT-02.md` §8) without alteration:

| Invariant | P04 disposition |
|---|---|
| INV-1 sole ingress `MarketDataSource<T>` → `DataSnapshot<T>` (G2 retired) | **UNCHANGED** — P04 adds no ingress |
| INV-2 `data-${provider}-${dataVersion}-${asOf}` distinct from `SNAP_*` | **UNCHANGED** — P04 adds no component |
| INV-3 six version axes, **no seventh** | **UNCHANGED** — P04 *populates* the existing `identityMappingVersion` axis |
| INV-4 `adapterVersion` in lineage, not `snapshotId` | **UNCHANGED** |
| INV-5 five timestamps; five-value `availability` incl. `WITHHELD` | **UNCHANGED** |
| INV-6 P02 error taxonomy **E1–E8**, only E1 quality-bearing | **UNCHANGED** — no class added or reclassified |
| INV-7 AD-1; certified `companyId` join key untouched | **PRESERVED — P04 is its subject** |
| INV-8 ADR-02 `contributingData`; replay identity unaffected | **PRESERVED** |
| INV-9 domains **D01–D10**; **13 engines**; **19 UI surfaces** | **UNCHANGED** |
| INV-10 entitlement matrix **EMPTY** | **UNCHANGED** — no provider selected |

P03 invariants preserved: the ordered fail-closed gate chain **G1–G7**, authentication planes
ADP-1/ADP-2, and tenant isolation **IS-1…IS-4** (`P04_IDENTITY_ADAPTER_CONTRACT.md` §7).

---

## 7. Upstream dependencies satisfied

| Dependency | State | Evidence |
|---|---|---|
| **P01** Data Contract | **ACCEPTED** | 10 artifacts; identity slots `P01_IDENTITY_AND_LINEAGE` §1.1 |
| **P02** Provider Abstraction | **ACCEPTED** | 11 artifacts; PI-1…PI-8, AV-1…AV-6 |
| **P03** Secrets/Security | **ACCEPTED** | 14 artifacts; lineage impact recorded **NONE** |

TRACKER `Work Tracker`!P04-01 dependencies = `P01,P02,P03` (Hard) — all satisfied.

---

## 8. Status

| Field | Value |
|---|---|
| P04 work package | **PREPARED** |
| P04 gate | **NOT ACCEPTED** |
| Formal gates | **4 of 18** — unchanged |
| `certification_status` | **`NONE_GRANTED`** |
| `production_activation_status` | **`NOT_AUTHORIZED`** |
| Implementation performed | **NONE** |
| Existing-IIPS | **UNTOUCHED** |
