# P12 Certification — A2 Decision Record

## Identity

| Field | Value |
|---|---|
| **Record type** | A2 certification scoping and decision (one inseparable act) |
| **Phase** | P12 — API/DTO Gate |
| **Decision** | **A — CERTIFY (C6, C7 within P12 API/DTO Gate scope)** |
| **Date** | 2026-09-12 |
| **A2 authority** | **Sai** — designated A2 (commit `2d28e42`) |
| **Baseline** | `e6ccf6ebf91976d6f8592811500944274340cdc2` (P12 acceptance) |

---

## Certification Scope

| Requirement | Definition | Scope |
|---|---|---|
| **C6** | Screener contract | Governed, deterministic, PIT-capable screener with declared operators, total-order sorting, explicit degradation, server-enforced tenant scoping |
| **C7** | Object-resolution / search contract | P04-adapter-sourced identity resolution, fail-closed, PIT-aware, deterministic search, server-enforced tenant scoping |

### C-Numbers NOT Applicable to P12

| C-number | Reason not applicable |
|---|---|
| C1 | Market-data ingress path — P11 scope (CERTIFIED within P11) |
| C2 | Namespace + collision guard — P11 scope (CERTIFIED within P11) |
| C3 | Snapshot immutability + contributingData lineage — P05/P09/P10 scope |
| C4 | Extended replay identity (data vintage) — P09 scope |
| C5 | Security master + P04 identity adapter — P04 scope |
| C8 | Provenance / quality / freshness derivation — P09/P10 scope |
| C9 | DataGovernanceRuntime.classify() — separate governance concern |
| C10 | Retention enforcement — BLOCKED (existing-IIPS M-6) |
| C11 | PIT reproducibility (reports, saved screens) — P09 scope |
| C12 | Data-plane security/tenant enforcement — BLOCKED (M-5, security authority unknown) |

---

## C6 Evaluation — CERTIFIED within P12 API/DTO Gate scope

### Criterion

C6 requires certification of the **screener contract** that governs how screened universes
of securities are filtered, sorted, and presented:

- Governed contract with declared authority basis
- Deterministic behavior (same inputs → same output)
- Declared/closed filter operators
- Deterministic ordering with stable tie-break (total order)
- Explicit degraded-row treatment (never silently ranked as good)
- PIT capability (reproducible at a stated as-of)
- Server-enforced tenant scoping
- No silent quality upgrades
- Preservation of existing methodology/scoring authority
- No certification claim by implementation

### Sub-requirement evaluation

| # | Sub-requirement | Evidence | Status |
|---|---|---|---|
| C6-1 | Governed contract | Module header cites D29, D4_09 K.2.3, AD-9. `ScreenerViolation` typed error. Authority basis explicit. | ✅ MET |
| C6-2 | Deterministic behavior | `executeScreen` produces frozen result. `executedAt = asOf` for PIT reproducibility. Test: "deterministic: same input → same output" verifies identical row ordering across two executions. | ✅ MET |
| C6-3 | Declared/closed filter operators | `FILTER_OPERATORS` is `Object.freeze([...])` with 11 operators. `applyFilter` throws `ScreenerViolation` on unknown operator. 11 operator tests + unknown rejection test. | ✅ MET |
| C6-4 | Deterministic total-order sorting | `deterministicSort` uses `tieBreakField` for stable tie-break. `SORT_DIRECTIONS` closed set (asc/desc). Copies array to avoid mutation. Tests: ascending, descending, tie-break, no-mutation all pass. | ✅ MET |
| C6-5 | Explicit degraded-row treatment | `classifyRowDegradation` maps quality → explicit labels (good/degraded-stale/degraded-partial/degraded-unavailable). Screen-level quality is worst-case. Test: "degraded rows are explicitly marked (SC-4)" verifies stale/partial rows carry degradation labels. | ✅ MET |
| C6-6 | PIT capability | `executeScreen` takes `asOf` parameter. `executedAt = asOf` for reproducibility. `saveScreenDefinition` records `pitCapable: true`. Frozen screen definition is re-executable. | ✅ MET |
| C6-7 | Server-enforced tenant scoping | `executeScreen` requires `tenantId` — throws `ScreenerViolation(['SC-6'])` if empty. Result carries `tenantId`. Test: "requires tenantId (SC-6)" verifies. | ✅ MET |
| C6-8 | No silent quality upgrades | P12-02 `assertQualityTransition` rejects upgrades (stale→good, partial→good, unavailable→good). Screen quality computed as worst-case via `worstOf`. 3 upgrade-rejection tests. | ✅ MET |
| C6-9 | Preservation of methodology authority | Imports only P05 `QUALITY`, `QUALITY_RANK`, `MODES` and `NAMESPACE_TOKEN`. No engine, scoring, calibration, or taxonomy imports. | ✅ MET |
| C6-10 | No certification claim | Module header: "SC-9: C6 is NOT certified by this implementation — requires A2 act". Grep for certification claims returns empty. | ✅ MET |

### C6 test evidence

| Metric | Value |
|---|---|
| C6-specific tests | **30** |
| Pass | **30** |
| Fail | **0** |
| Coverage | Filter operators (11), filter evaluation (3), sort (5), degradation (5), screen execution (7), saved screen (1), closed sets (2) |

### C6 decision

**C6 is CERTIFIED within P12 API/DTO Gate scope.**

All 10 sub-requirements are MET. 30/30 tests pass. The screener contract is governed,
deterministic, PIT-capable, with declared operators, total-order sorting, explicit
degradation marking, and server-enforced tenant scoping. No existing methodology or
scoring authority is modified.

---

## C7 Evaluation — CERTIFIED within P12 API/DTO Gate scope

### Criterion

C7 requires certification of the **object-resolution / search contract** that governs
how identities are resolved to governed product objects:

- P04 adapter is the identity-resolution authority
- No redefinition of P04 identity rules
- Fail-closed unresolved behavior
- PIT-aware resolution
- Reuse of existing `IdentityResolutionFailure` authority
- Deterministic behavior
- No Existing-IIPS methodology changes
- No certification claim by implementation

### Sub-requirement evaluation

| # | Sub-requirement | Evidence | Status |
|---|---|---|---|
| C7-1 | P04 adapter is identity authority | `resolveObject` resolves through `securities` (P04-shaped records) and `register` (MappingRegister from P05 identity). `RESOLUTION_INPUT_TYPES` is closed set (4 types). No raw-provider search surface. | ✅ MET |
| C7-2 | No redefinition of P04 rules | Uses P04-shaped records directly via `securities.find()`. Does not redefine mapping rules, cardinality, lifecycle states, or mapping methods. P04 contract consumed, not modified. | ✅ MET |
| C7-3 | Fail-closed unresolved | `resolveObject` throws `ResolutionViolation(['OR-2'])` when identity not found: "fail-closed; no coercion, no placeholder, no synthesized result". Test: "fails closed on unresolved (OR-2)" verifies. | ✅ MET |
| C7-4 | PIT-aware resolution | `buildResolutionRequest` requires `asOf` (ISO-8601). Result carries `asOf` and `lifecycleState`. Test: "resolves by canonicalSecurityId" verifies PIT boundary is carried. | ✅ MET |
| C7-5 | Reuse of IdentityResolutionFailure | `import { IdentityResolutionFailure } from '../../p05/src/identity.js'` — P05 authority reused, not redefined. | ✅ MET |
| C7-6 | Deterministic behavior | `executeSearch` uses deterministic sort (by objectType, then canonicalSecurityId via `localeCompare`). Test: "deterministic sort (OR-7)" verifies identical ordering across two executions. | ✅ MET |
| C7-7 | No Existing-IIPS changes | Imports only P05 `IdentityResolutionFailure` and `NAMESPACE_TOKEN`. No Existing-IIPS source, methodology, or certification artifacts imported or modified. | ✅ MET |
| C7-8 | No certification claim | Module header: "OR-6: C7 is NOT certified by this implementation — requires A2 act". Grep for certification claims returns empty. | ✅ MET |

### C7 test evidence

| Metric | Value |
|---|---|
| C7-specific tests | **22** |
| Pass | **22** |
| Fail | **0** |
| Coverage | Resolution request (5), resolve object (6), search (7), object reference (4) |

### C7 decision

**C7 is CERTIFIED within P12 API/DTO Gate scope.**

All 8 sub-requirements are MET. 22/22 tests pass. The object-resolution contract sources
identity through the P04 adapter exclusively, fails closed on unresolved identities,
carries PIT boundaries, reuses P05 identity authority without redefinition, and produces
deterministic search results. No Existing-IIPS methodology is modified.

---

## Certification Scope Limitations

This certification act:

- ✅ Certifies **C6** within P12 API/DTO Gate scope
- ✅ Certifies **C7** within P12 API/DTO Gate scope
- ⛔ Does **NOT** certify any other C-number
- ⛔ Does **NOT** broaden P09 certification (C3/C4/C8/C11 within D03 only — UNCHANGED)
- ⛔ Does **NOT** broaden P10 certification (C3/C8 within D06–D09 only — UNCHANGED)
- ⛔ Does **NOT** broaden P11 certification (C1/C2 within Engine Integration only — UNCHANGED)
- ⛔ Does **NOT** authorize production activation
- ⛔ Does **NOT** authorize P13 or any downstream phase
- ⛔ Does **NOT** resolve AD-4 (DEFERRED to P15)
- ⛔ Does **NOT** resolve AD-17/M-2 (UNRESOLVED — external Existing-IIPS authority)
- ⛔ Does **NOT** claim replay reproducibility
- ⛔ Does **NOT** certify C12 (BLOCKED — M-5, security authority unknown)
- ⛔ Does **NOT** modify any P00–P11 accepted/certified artifact

---

## Deferred Conditions (PRESERVED)

| Condition | Status | Resolution Gate |
|---|---|---|
| AD-4 revalidation | DEFERRED | P15 |
| AD-17/M-2 | UNRESOLVED (external) | P15 |
| Replay reproducibility | NOT CLAIMED | P15 (external) |
| C12 (data-plane security) | BLOCKED | External |
| C9/C10 | Outside P12 scope | Separate |
| K.2.6 security/tenant | Bounded (M-5) | Security authority |
| Stale P05/P08 assertions (13) | Non-blocking debt | Housekeeping |

---

## Full Regression at Certification Baseline

| Suite | Tests | Pass | Fail | Classification |
|---|---|---|---|---|
| P05 | 264 | 257 | 7 | ⚠ Stale boundary assertions — non-blocking |
| P06 | 113 | 113 | 0 | ✅ |
| P07 | 159 | 159 | 0 | ✅ |
| P08 | 90 | 84 | 6 | ⚠ Stale boundary assertions — non-blocking |
| P09 | 97 | 97 | 0 | ✅ |
| P10 | 67 | 67 | 0 | ✅ |
| P11 | 63 | 63 | 0 | ✅ |
| **P12** | **153** | **153** | **0** | ✅ |
| **Total** | **1006** | **993** | **13** | 13 stale — non-blocking |

---

## Explicit Non-Decisions

This record does **NOT**: authorize P13 · authorize production · resolve AD-4 · resolve
AD-17/M-2 · claim replay reproducibility · certify C12 · broaden P09/P10/P11 certification ·
modify P00–P11 artifacts · modify P12 implementation.

---

**P12 A2 Certification Decision: A — CERTIFY C6 and C7 within P12 API/DTO Gate scope.**
**C6 = CERTIFIED. C7 = CERTIFIED. All other C-numbers = NOT within P12 scope.**
**Production = NOT AUTHORIZED. P13–P17 = NOT AUTHORIZED.**
