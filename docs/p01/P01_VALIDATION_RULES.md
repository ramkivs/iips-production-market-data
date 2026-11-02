# P01 — VALIDATION AND REJECTION RULES

**SPECIFICATION ONLY — NO IMPLEMENTATION.** These are contract obligations; the validating
runtime is built in **P06 / P07**, and the collision guard in `DataBoundExecutor` is
**specified by ADR-01 and not implemented here**.

---

## 1. Validation stages

| Stage | When | Failure class |
|---|---|---|
| **S1 — Structural** | On snapshot construction | **REJECT** |
| **S2 — Namespace partition** | Before any merge | **REJECT (fail-closed)** |
| **S3 — Semantic** | On snapshot construction | **REJECT** |
| **S4 — Referential** | On identity/lineage resolution | **REJECT** |
| **S5 — Quality assessment** | After S1–S4 pass | **CLASSIFY (degraded state, not rejection)** |

**Governing distinction:** S1–S4 failures are **contract violations** → rejection.
S5 outcomes are **data conditions** → `quality` / `completenessPct`.
**A contract violation is never representable as `quality: 'partial'`.**

---

## 2. S1 — Structural validation

| # | Rule | Violation |
|---|---|---|
| ST-1 | All REQUIRED envelope slots present | REJECT |
| ST-2 | `snapshotId` matches `data-${provider}-${dataVersion}-${asOf}` exactly | REJECT |
| ST-3 | `snapshotId` is **consistent with** its own `provider`/`dataVersion`/`asOf` | REJECT |
| ST-4 | `mode` ∈ {LIVE, SNAPSHOT, PIT} | REJECT |
| ST-5 | `pitBoundary` present **iff** `mode = PIT` | REJECT |
| ST-6 | `quality` ∈ {good, stale, partial, unavailable} | REJECT |
| ST-7 | `completenessPct` ∈ [0, 100] | REJECT |
| ST-8 | `domain` ∈ {D01…D10} | REJECT |
| ST-9 | `fields` empty **only** when `quality = 'unavailable'` | REJECT |
| ST-10 | Snapshot and `fields` are frozen; mutation attempt is a **hard error**, never a silent no-op | REJECT |
| ST-11 | Every field carries `key`, `dataType`, `availability`, `provenance`, `pitEligible` | REJECT |
| ST-12 | Timestamps are ISO-8601 UTC at declared precision | REJECT |

## 3. S2 — Namespace partition (ADR-01 C1–C6) — FAIL-CLOSED

| # | Rule (verbatim intent) | Violation |
|---|---|---|
| **C1** | **Namespace partition.** Every key in `data.fields` MUST carry the namespace. A non-namespaced key is a **hard error** | REJECT |
| **C2** | **Reverse partition.** No key in `companyInputs` may carry the namespace | REJECT |
| **C3** | **Intersection test.** `keys(data.fields) ∩ keys(companyInputs)` MUST be empty; non-empty → hard error listing every colliding key | REJECT |
| **C4** | **Cross-snapshot test.** Pairwise key intersections across contributing snapshots MUST be empty; non-empty → hard error naming both snapshot IDs and the keys | REJECT |
| **C5** | **Fail-closed.** Any C1–C4 violation **aborts the execution**. No partial merge, no precedence, no coercion, no warning-and-continue | ABORT |
| **C6** | **Deterministic order.** Where merging is legal, order is canonical and specified — not implementation-incidental | REJECT if unspecified |

⚠ **OI-10:** the literal namespace token is **not recorded**. C1/C2 are therefore specified
against "**the** namespace" as a structural property; they become mechanically checkable the
moment the token is recorded. **P01 does not record it and does not adopt `MD:<domain>.<field>`.**

## 4. Missing / null / unavailable semantics (S3, and the `availability` enum)

**Absence is always explicit and typed. A missing value is never a default, never zero, never
an empty string, and never silently omitted.**

| Marker | Meaning | Contributes to incompleteness? |
|---|---|---|
| `PRESENT` | A value is asserted | No |
| `NULL_ASSERTED` | The source **explicitly asserts** no value exists (a true null) | No |
| `NOT_APPLICABLE` | The field is meaningless for this instrument/domain | No |
| `NOT_PROVIDED` | The source did not supply it (silence) | **Yes** |
| `WITHHELD` | Suppressed by entitlement, licensing or governance | **Yes** — and recorded distinctly |

| # | Rule | Violation |
|---|---|---|
| NL-1 | `availability` is REQUIRED on every field | REJECT |
| NL-2 | `availability = PRESENT` requires a `value` | REJECT |
| NL-3 | Any non-`PRESENT` marker **prohibits** a substituted value | REJECT |
| NL-4 | `NULL_ASSERTED` and `NOT_PROVIDED` are **never** conflated — assertion vs silence are different facts | REJECT |
| NL-5 | `WITHHELD` must carry an `entitlementRef` in lineage | REJECT |
| NL-6 | `completenessPct` is computed from `NOT_PROVIDED` + `WITHHELD` against the contracted field set | — |
| NL-7 | **No coercion:** absence never becomes `0`, `""`, `false` or a prior value (NFR-04) | REJECT |

## 5. S3 — Semantic validation

| # | Rule | Violation |
|---|---|---|
| SM-1 | Monetary value without `currency` | REJECT |
| SM-2 | `currency` not ISO-4217 | REJECT |
| SM-3 | Dimensioned value without `unit`; dimensionless value **with** one | REJECT |
| SM-4 | `unit` not in the declared versioned enumeration (including duration-unit members `minutes`, `seconds` at schema `1.2`, UN-8) | REJECT |
| SM-5 | `decimal` without declared `precision` | REJECT |
| SM-6 | Value violates its declared `dataType` | REJECT |
| SM-7 | `mode = PIT` containing a `pitEligible = false` field | REJECT |
| SM-8 | Required time missing for the data class (`P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1.1) | REJECT |
| SM-9 | `receivedAt` earlier than `asOf` **without** an explicit declared justification | REJECT |
| SM-10 | Effective-dated field without `effectiveTime`; revision-bearing field without `publicationTime` | REJECT |
| SM-11 | `adjusted = true` without `adjustmentBasisRef` | REJECT |
| SM-12 | FX-converted value without recorded rate, rate source and rate as-of | REJECT |
| SM-13 | Field-level `quality` **better** than snapshot-level | REJECT |
| SM-14 | Mixed modes within one snapshot | REJECT |

## 6. S4 — Referential validation

| # | Rule | Violation |
|---|---|---|
| RF-1 | Instrument-keyed domain without an `identity` reference | REJECT |
| RF-2 | Identity crossing the AD-1 adapter without `identityMappingVersion` | REJECT |
| RF-3 | `mappedCompanyId` written by anything other than the P04 adapter | REJECT |
| RF-4 | A provider symbol used as an identity | REJECT |
| RF-5 | Venue-scoped price data without `venueRef` | REJECT |
| RF-6 | Incomplete lineage block (any REQUIRED L-element missing) | REJECT |
| RF-7 | Field `provenance` not resolvable within the snapshot's lineage block | REJECT |
| RF-8 | Licence-restricted content (D06/D09) without governance classification | REJECT |
| RF-9 | D08 macro using instrument identity or `companyId` | REJECT |

## 7. Rejection behaviour (P)

| # | Rule |
|---|---|
| RJ-1 | Rejection is **explicit and typed**. There is no partial acceptance of a structurally invalid record |
| RJ-2 | A rejected snapshot is **never** admitted downstream in any degraded form |
| RJ-3 | Rejection is **fail-closed**: on doubt, reject. Never admit-and-warn |
| RJ-4 | Every rejection emits an **evidence-bearing event** (NFR-07 auditable) containing: rule ID, offending key(s), `snapshotId`(s), `provider`, `domain`, `schemaVersion`, `namespaceVersion`, and — for merge-time failures — `engineId` and `requestId` |
| RJ-5 | A rejection is classified as a **data-quality failure** and **propagated, not coerced** (NFR-04) |
| RJ-6 | **Prohibited without exception:** silent overwrite · precedence rules · "last wins" · dropping a field · substituting a default · downgrading a rejection to `quality: 'partial'` |
| RJ-7 | A failed or degraded acquisition **must never** yield a snapshot presented as `quality: 'good'` |
| RJ-8 | Rejections are counted and reportable; a silently discarded rejection is itself a contract violation |

## 8. S5 — Quality classification (not rejection)

| Condition | Classification |
|---|---|
| Provider unavailable | `quality = 'unavailable'` |
| Partial response, structurally valid | `quality = 'partial'` + accurate `completenessPct` |
| Data older than the applicable session/freshness baseline | `quality = 'stale'` |
| Complete, fresh, valid | `quality = 'good'` |

Thresholds, freshness computation and reconciliation are **P07**, not P01. P01 requires only
that the **inputs** to those judgements (`asOf`, `receivedAt`, venue session reference,
completeness basis) are present and unambiguous.

## 9. Validation artifacts owed at the P01 gate

| Artifact | Nature | Status |
|---|---|---|
| Contract tests for identifiers, time, mode, provenance | Specified obligation (tracker `P01-01`, `-02`, `-04`, `-05`) | **Specified — not executed** (implementation prohibited in P01) |
| Golden fixtures for measurement determinism | Tracker `P01-03` | **Specified — not produced**, since fixture production is an implementation act |
| Byte-identity re-demonstration of existing baselines | Inherited | **BLOCKED on M-1** (`OPEN_REVALIDATION_REQUIRED`) — external |

**No test, fixture or executable artifact was produced in P01.** See
`P01_DEPENDENCY_REGISTER.md` DEP-P01-07.
