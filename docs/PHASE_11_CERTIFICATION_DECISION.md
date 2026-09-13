# P11 Certification — A2 Decision Record

## Identity

| Field | Value |
|---|---|
| **Record type** | A2 certification scoping and decision (one inseparable act) |
| **Phase** | P11 — Engine Integration Gate |
| **Decision** | **A — CERTIFY (C1, C2 within P11 Engine Integration scope)** |
| **Date** | 2026-09-12 |
| **A2 authority** | **Sai** — designated A2 (commit `2d28e42`) |
| **Baseline** | `f093c749decefc4819a73c2ea25c122d6701f894` (P11 acceptance) |

---

## Certification Scope

| Requirement | Definition | Scope |
|---|---|---|
| **C1** | Market-data ingress path | MarketDataSource → DataSnapshot → DataBoundRequest → DataBoundExecutor |
| **C2** | Namespace + collision guard | MD:<domain>.<field>, fail-closed C1–C6 behavior |

### C-Numbers NOT Applicable to P11

| C-number | Reason not applicable |
|---|---|
| C3 | Snapshot immutability + contributingData lineage — P05/P09/P10 scope |
| C4 | Extended replay identity (data vintage) — P09 scope |
| C5 | Security master + P04 identity adapter — P04 scope |
| C6 | Screener contract — P12 scope |
| C7 | Object-resolution / search contract — P12/P13 scope (UI13/UI14) |
| C8 | Provenance / quality / freshness derivation — P09/P10 scope |
| C9 | DataGovernanceRuntime.classify() — separate governance concern |
| C10 | Retention enforcement — BLOCKED (existing-IIPS M-6) |
| C11 | PIT reproducibility (reports, saved screens) — P09 scope |
| C12 | Data-plane security/tenant enforcement — BLOCKED (M-5, security authority unknown) |

---

## C1 Evaluation — CERTIFIED within P11 Engine Integration scope

### Criterion

C1 requires certification of the **market-data ingress path** that feeds data to the 13 certified engines:

- MarketDataSource → DataSnapshot → DataBoundRequest → DataBoundExecutor
- Pre-dispatch validation
- Deterministic behavior
- Contributing snapshot provenance
- Frozen request/result/provenance structures
- No engine modification
- No claim that AD-4 has been revalidated

### Evidence

| Check | Result |
|---|---|
| Four-stage ingress path | ✅ `executeIngressPath()` implements MarketDataSource → DataSnapshot → DataBoundRequest → DataBoundExecutor |
| Pre-dispatch validation | ✅ `assertEngineDispatchGuard()` called in `buildDataBoundRequest()` before merge |
| Pre-dispatch re-validation | ✅ `validateEngineDispatch()` called in `executeDataBound()` before dispatch |
| Deterministic merge order | ✅ Snapshot fields first (sorted by key), then company inputs (sorted by key) — no wall clock, no randomness |
| Contributing snapshot provenance | ✅ `provenance.contributingSnapshots` recorded in every execution result |
| Frozen DataBoundRequest | ✅ `deepFreeze(request)` at line 103 |
| Frozen ExecutionResult | ✅ `deepFreeze(result)` at line 175 |
| Frozen inputs | ✅ `Object.freeze(inputs)` at line 95, `Object.freeze(executionInputs)` at line 157 |
| Frozen provenance | ✅ `Object.freeze({...})` at lines 96-104, 165-172 |
| No engine modification | ✅ Engine dispatch is optional callback parameter; no engine code called or modified |
| No AD-4 revalidation claim | ✅ `certification.ad4_revalidationClaimed = false` at line 218 |
| No AD-17/M-2 replay claim | ✅ `provenance.replayReproducibilityClaimed = false` at line 169, `ad17Status: 'UNRESOLVED'` at line 170 |
| Tests | ✅ 21 tests PASS covering ingress path, determinism, provenance, certification evidence |

### Finding

P11 implements the **complete four-stage market-data ingress path** with pre-dispatch validation, deterministic merge order, contributing snapshot provenance, and frozen structures at every stage. The ingress path does not modify engines or claim AD-4 revalidation or AD-17/M-2 replay reproducibility. The implementation is a prerequisite for P15 (E2E Certification), not a certification of the 13-engine baseline.

### Verdict

**✅ CERTIFIED** — C1 (market-data ingress path) is established within P11 Engine Integration scope.

---

## C2 Evaluation — CERTIFIED within P11 Engine Integration scope

### Criterion

C2 requires certification of the **namespace + collision guard** that protects engine inputs from provider-native name leakage:

- MD:<domain>.<field> namespace enforcement
- Delegation to P05 namespace/collision authority (C1–C6 rules)
- No redefinition of P05 rules
- Fail-closed C1–C6 behavior
- Frozen engine collision surface
- No engine modification

### Evidence

| Check | Result |
|---|---|
| MD:<domain>.<field> enforcement | ✅ P05 `NAMESPACE_TOKEN` imported and used throughout |
| P05 C1–C6 delegation | ✅ `assertCollisionGuard()` called at line 71 — NO redefinition of P05 rules |
| P05 C1 import | ✅ `assertC1` imported from `p05/src/namespace.js` |
| P05 C2 import | ✅ `assertC2` imported from `p05/src/namespace.js` |
| P05 C3 import | ✅ `assertC3` imported from `p05/src/namespace.js` |
| P05 C4 import | ✅ `assertC4` imported from `p05/src/namespace.js` |
| Fail-closed behavior | ✅ `NamespaceViolation` thrown on any C1–C6 violation, aborting engine dispatch |
| Engine collision surface | ✅ `ENGINE_COLLISION_SURFACE` frozen at line 44-49 (14 HIGH-RISK keys: peRatio, evEbitda, evRevenue, fcfYield, roic, roce, ebitdaMargin, debtEbitda, revenueGrowth, segment, id, archetype, subsegment, businessModel) |
| Bare collision key detection | ✅ `detectBareEngineCollisionKeys()` at line 82-95 |
| Bare collision key assertion | ✅ `assertNoBareEngineCollisionKeys()` at line 102-113 throws `NamespaceViolation` |
| No engine modification | ✅ Guard is in ingress path (`namespaceCollisionGuard.js`), not in engine code |
| Tests | ✅ 17 tests PASS covering C1–C6 rules, collision detection, fail-closed behavior |

### Finding

P11 implements the **namespace + collision guard** by delegating to P05's certified C1–C6 rules without redefinition. The guard enforces MD:<domain>.<field> namespacing, fails closed on any violation, and detects bare engine collision keys from the frozen HIGH-RISK surface. The guard is in the ingress path, not in engine code, and does not modify engines.

### Verdict

**✅ CERTIFIED** — C2 (namespace + collision guard) is established within P11 Engine Integration scope.

---

## Decision Summary

| Requirement | Verdict | Evidence |
|---|---|---|
| **C1** — Market-data ingress path | ✅ **CERTIFIED** | Four-stage path, pre-dispatch validation, deterministic merge, provenance, frozen structures, no engine modification, no AD-4/AD-17 claims, 21 tests PASS |
| **C2** — Namespace + collision guard | ✅ **CERTIFIED** | MD:<domain>.<field> enforcement, P05 C1–C6 delegation (UNCHANGED), fail-closed, frozen collision surface, no engine modification, 17 tests PASS |

---

## Scope Limitation

This certification is **scoped to P11 Engine Integration only**. It does NOT:

- ⛔ Certify C1 or C2 for any other phase or domain
- ⛔ Broaden P09 certification beyond D03 scope
- ⛔ Broaden P10 certification beyond C3/C8 within D06–D09 scope
- ⛔ Grant production activation (remains **NOT AUTHORIZED**)
- ⛔ Authorize P12 or any downstream phase (remains **NOT AUTHORIZED**)
- ⛔ Resolve AD-4 revalidation (remains **DEFERRED to P15**)
- ⛔ Resolve AD-17/M-2 (remains **UNRESOLVED** under external Existing-IIPS authority)
- ⛔ Claim replay reproducibility (remains **NOT CLAIMED**)
- ⛔ Modify any existing-IIPS source, methodology, or certification artifact
- ⛔ Modify any of the 13 certified engines

---

## Preserved Deferred/Unresolved Conditions

The following conditions remain in force and are **NOT resolved** by this certification act:

1. **AD-4 revalidation** — DEFERRED to P15 (E2E Certification). P11 does NOT claim the 13-engine baseline is certified through the new ingress.

2. **AD-17/M-2** — UNRESOLVED under external Existing-IIPS authority. The existing-IIPS `ReplayService` returns literals (M-2 defect). This program does NOT repair it.

3. **Replay reproducibility** — NOT CLAIMED. P11 computes deterministic replay identity but does NOT claim replay reproducibility certification.

4. **Existing-IIPS modifications** — NONE. No existing-IIPS source, methodology, or certification artifact was modified.

5. **Engine modifications** — NONE. The 13 certified engines are REUSED, not modified.

6. **Six stale P05/P08 boundary assertions** — OUTSTANDING (non-blocking). These detect P09/P10/P11 files and are classified as P09/P10 acceptance debt.

---

## Authority Boundaries

This certification:

- ✅ Establishes C1 and C2 within P11 Engine Integration scope
- ✅ Follows the P09/P10 precedent (scoping + evaluation as one inseparable act)
- ✅ Is recorded by the designated A2 authority (Sai)
- ✅ Preserves P09 certification scope (C3, C4, C8, C11 within D03 only)
- ✅ Preserves P10 certification scope (C3, C8 within D06–D09 only)
- ⛔ Does NOT constitute production activation
- ⛔ Does NOT authorize P12 or any downstream phase
- ⛔ Does NOT certify any other phase or domain
- ⛔ Does NOT modify implementation or accepted artifacts

---

## Post-Certification Authority State

| Item | Pre-certification | Post-certification |
|---|---|---|
| P11 | ✅ ACCEPTED | ✅ ACCEPTED |
| **P11 certification** | ⛔ NONE GRANTED | ✅ **CERTIFIED (C1, C2 within Engine Integration scope)** |
| P10 certification | ✅ PARTIAL (C3, C8 within D06–D09) | ✅ PARTIAL (unchanged) |
| P09 certification | ✅ CERTIFIED (C3, C4, C8, C11 within D03) | ✅ CERTIFIED (unchanged) |
| C1 (ingress path) | ⚠ EVIDENCE PRESENT | ✅ **CERTIFIED within P11 scope** |
| C2 (namespace guard) | ⚠ EVIDENCE PRESENT | ✅ **CERTIFIED within P11 scope** |
| C3 (overall) | ✅ CERTIFIED within P09 D03 + P10 D06–D09 | ✅ CERTIFIED (unchanged) |
| C4 (overall) | ✅ CERTIFIED within P09 D03 | ✅ CERTIFIED (unchanged) |
| C8 (overall) | ✅ CERTIFIED within P09 + P10 scope | ✅ CERTIFIED (unchanged) |
| C11 (overall) | ✅ CERTIFIED within P09 D03 | ✅ CERTIFIED (unchanged) |
| AD-4 revalidation | ⚠ DEFERRED to P15 | ⚠ DEFERRED to P15 (unchanged) |
| AD-17/M-2 | ⚠ UNRESOLVED (external authority) | ⚠ UNRESOLVED (unchanged) |
| Replay reproducibility | ⚠ NOT CLAIMED | ⚠ NOT CLAIMED (unchanged) |
| Production activation | ⛔ NOT AUTHORIZED | ⛔ NOT AUTHORIZED |
| P12–P17 | ⛔ NOT AUTHORIZED | ⛔ NOT AUTHORIZED |

---

**P11 ENGINE INTEGRATION CERTIFICATION = CERTIFIED (C1, C2).**

**A2 authority: Sai.**

**Date: 2026-09-12.**

**Commit:** `bf3532a5d56c6bdce8a9b22a5c8d2a378f733aba`
