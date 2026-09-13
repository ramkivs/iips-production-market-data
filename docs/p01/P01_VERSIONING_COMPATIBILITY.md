# P01 — VERSIONING AND COMPATIBILITY

**SPECIFICATION ONLY.**

---

## 1. The four independent version axes

They are **independent** and must never be conflated.

| # | Axis | Versions | Changes when |
|---|---|---|---|
| V1 | **`schemaVersion`** | The canonical field schema (shape) | A field slot is added, removed, retyped, or its obligations change |
| V2 | **`dataVersion`** | The **content vintage** from a provider | Source content changes — including corrections |
| V3 | **`namespaceVersion`** | The field-namespace scheme | The namespace token, structure or partition rules change |
| V4 | **`identityMappingVersion`** | The AD-1 adapter mapping | P04 changes a canonical↔`companyId` mapping |

| # | Rule |
|---|---|
| VA-1 | A content change **must not** be expressed as a schema change, and vice versa |
| VA-2 | V1, V3 and V4 all participate in effective replay identity (ADR-02) |
| VA-3 | **V3 cannot be finalized until OI-10 records the exact namespace token.** The axis exists; its first recorded value does not |

## 2. Schema version semantics

| # | Rule |
|---|---|
| SV-1 | `MAJOR.MINOR` at minimum; both components explicit |
| SV-2 | **MINOR** = strictly additive and backward-compatible |
| SV-3 | **MAJOR** = any breaking change (§3) |
| SV-4 | The version is carried **on every snapshot**; it is never implied by deployment |
| SV-5 | Multiple schema versions may be live concurrently; consumers declare the versions they accept |
| SV-6 | Mirrors the engine layer's `snapshot-1.0` discipline (`D4_04` §F.3) |

## 3. Change classification

| Change | Class |
|---|---|
| Add an **optional** field slot | MINOR |
| Add a new domain field class | MINOR |
| Add an enum member to an **output-only** enum | MINOR |
| Relax a `REQUIRED` field to `OPTIONAL` | **MAJOR** (breaks producers' guarantees to consumers) |
| Tighten `OPTIONAL` → `REQUIRED` | **MAJOR** |
| Change a field's `dataType` | **MAJOR** |
| Change a unit or currency obligation | **MAJOR** |
| Change declared `precision` | **MAJOR** |
| Change `pitEligible` | **MAJOR** |
| Remove or rename a field slot | **MAJOR** |
| Change the `snapshotId` format | **MAJOR — and prohibited** (format is frozen, AD-6) |
| Change namespace token / structure | **MAJOR** on V3 — **requires OI-10 authority** |
| Change a timestamp's precision or timezone convention | **MAJOR** (breaks byte-stability) |
| Change merge/collision rules | **MAJOR** — **requires ADR authority** |

## 4. Backward compatibility (consumer reading older data)

| # | Rule |
|---|---|
| BC-1 | A consumer at schema `N` must read data at `N-k` **minor** versions without error |
| BC-2 | Absent optional fields read as `NOT_PROVIDED`, **never as a default value** |
| BC-3 | **Critical inherited requirement:** an execution with **no** contributing market-data snapshot must behave exactly as today, produce the same effective replay identity, and reproduce existing certified baselines **byte-identically**. Existing golden fixtures require **no change** |
| BC-4 | The whole market-data contract delta is **additive and inert** for existing SNAPSHOT-only executions. This is essential — otherwise the delta would invalidate the very baselines AD-4 protects |
| BC-5 | Historical snapshots are **never rewritten** to a newer schema. They retain their original `schemaVersion` |

## 5. Forward compatibility (consumer reading newer data)

| # | Rule |
|---|---|
| FC-1 | Unknown **optional** fields at a higher **minor** version are ignored **and recorded as ignored** — never silently dropped from lineage |
| FC-2 | An unknown **required** field, or any **major** version increment, is a **rejection**, not a best-effort read |
| FC-3 | A consumer must never guess the meaning of an unrecognised key. Unknown ≠ absent |
| FC-4 | Forward-compat tolerance never extends to identity, namespace, mode, currency, unit or precision semantics |

## 6. Migration and deprecation

| # | Rule |
|---|---|
| MG-1 | **No in-place data migration.** Corrections produce a new `dataVersion`; schema evolution produces a new `schemaVersion` |
| MG-2 | Deprecation is a two-step: mark deprecated at a MINOR version, remove only at a MAJOR version |
| MG-3 | A deprecated slot keeps its contract until removal; deprecation is not permission to stop populating it |
| MG-4 | Every version change is recorded with rationale, evidence and the affected consumers |
| MG-5 | **No existing engine input key is ever versioned, renamed or migrated by this program.** The 52 coded + 54 free-form keys are frozen |

## 7. Compatibility obligations toward certified components

| Component | Obligation |
|---|---|
| `ExecutionRequest` / `ExecutionResult` | **UNCHANGED** — zero shape change |
| `SectorPlugin`, all 13 engines | **UNCHANGED** |
| Scoring / calibration / taxonomy | **UNCHANGED** |
| `SnapshotService`, `EvidencePipeline`, CSIP | **UNCHANGED** |
| `NormalizedHolding.companyId` | **UNCHANGED** — certified CSIP join key |
| `DataBoundExecutor` | The **only** proposed certified behavioural change (ADR-01 merge semantics) — **specified, not implemented, not performed in P01** |

## 8. Validation obligations attached to versioning

| # | Obligation | Owning phase |
|---|---|---|
| VV-1 | Byte-identity of existing certified replay baselines must be re-demonstrated for any contract delta | P08 / P15 |
| VV-2 | ⚠ Those suites **do not currently execute** (AD-4); **M-1 remains `OPEN_REVALIDATION_REQUIRED`**. Validation cannot proceed until M-1 is repaired — **external, not this program's fix** | Existing-IIPS authority |
| VV-3 | Specification may proceed; **validation cannot**. P01 is specification | — |
