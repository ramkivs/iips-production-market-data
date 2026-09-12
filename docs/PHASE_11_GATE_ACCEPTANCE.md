# **P11 — Engine Integration Gate — is ACCEPTED.**

---

## Acceptance Statement

**P11 is ACCEPTED** by the designated A3 acceptor **Raji** for the P11 gate only.

Acceptance is granted on the basis of:
- Complete P11 implementation across all four authorized work items (P11-01 through P11-04).
- 63 P11-specific tests, all passing.
- Read-only acceptance gate assessment confirming implementation completeness, C1/C2 evidence presence, and contract reuse.
- P11 entry authorization by Program Authority adjudication (D26).
- P11 A3 acceptor designation by Program Authority act (D27).

---

## Scope

This acceptance covers the following implemented work items:

| Work Item | Scope | Implementation |
|---|---|---|
| **P11-01** | Engine Ingress Path | MarketDataSource → DataSnapshot → DataBoundRequest → DataBoundExecutor; pre-dispatch validation; deterministic merge; frozen structures; contributing snapshot provenance |
| **P11-02** | Namespace + Collision Guard | MD:<domain>.<field> namespace; delegation to P05 C1–C6 rules (UNCHANGED); fail-closed behavior; engine collision surface detection |
| **P11-03** | Evidence/Snapshot/Replay ADAPT | Additive provenance extension; deterministic replay identity computation; ADAPT treatment per INT-003; no P05 CanonicalRecordStore modification |
| **P11-04** | Engine Registry (REUSE) | 13-engine registry metadata; REUSE only (no engine implementation); frozen methodologies (D16, D17, D20) preserved verbatim; no scoring/calibration/taxonomy changes |

### Implementation Files

- `p11/src/engineIngressPath.js` — P11-01 Engine Ingress Path (C1)
- `p11/src/namespaceCollisionGuard.js` — P11-02 Namespace + Collision Guard (C2)
- `p11/src/evidenceSnapshotReplay.js` — P11-03 Evidence/Snapshot/Replay Adaptation
- `p11/src/engineRegistry.js` — P11-04 Engine Registry (13 engines)
- `p11/tests/*.test.js` — 63 tests, all passing
- `p11/package.json` — P11 package definition

---

## C1/C2 Evidence Assessment

### C1 — Market-data ingress path

**Evidence is PRESENT and SUFFICIENT for certification evaluation.**

| Evidence | Status |
|---|---|
| Four-stage ingress path | ✅ Implemented (`executeIngressPath()`) |
| Pre-dispatch validation | ✅ C1–C6 guard enforced (`assertEngineDispatchGuard()`) |
| Deterministic behavior | ✅ Sorted merge order; no wall clock, no randomness |
| Contributing snapshot provenance | ✅ Recorded in `provenance.contributingSnapshots` |
| Frozen structures | ✅ `deepFreeze()` at every stage |
| No engine modification | ✅ Engine dispatch is optional callback; no engine code |
| Tests | ✅ 21 tests PASS |

### C2 — Namespace + collision guard

**Evidence is PRESENT and SUFFICIENT for certification evaluation.**

| Evidence | Status |
|---|---|
| MD:<domain>.<field> enforced | ✅ P05 `NAMESPACE_TOKEN` imported and used |
| P05 C1–C6 delegation | ✅ `assertCollisionGuard()` called — NO redefinition |
| Fail-closed behavior | ✅ `NamespaceViolation` thrown on any violation |
| Engine collision surface | ✅ 14 HIGH-RISK keys enumerated and detected |
| No engine modification | ✅ Guard is in ingress path, not engine |
| Tests | ✅ 17 tests PASS |

**⚠ CRITICAL: C1/C2 certification is NOT granted by this acceptance act.** C1 and C2 evidence is present and sufficient for certification evaluation, but certification requires a separate A2 authority act.

---

## Limitations and Deferred Conditions

The following conditions remain in force and are **NOT resolved** by this acceptance act:

1. **AD-4 revalidation** — DEFERRED to P15 (E2E Certification). P11 implementation does NOT claim the 13-engine baseline is certified through the new ingress. AD-4 revalidation (including M-1 repair) must be completed before P15 can certify the 13-engine baseline.

2. **AD-17/M-2** — UNRESOLVED; external Existing-IIPS authority. The existing-IIPS `ReplayService` returns literals (M-2 defect). This program does NOT repair it. AD-17 resolution must be completed by the Existing-IIPS program before P15 can certify replay reproducibility.

3. **Replay reproducibility** — NOT CLAIMED. P11 computes deterministic replay identity but does NOT claim replay reproducibility certification. `AD17_M2_STATUS.replayReproducibilityClaimed = false`.

4. **C1/C2 certification** — NONE GRANTED. C1 and C2 evidence is present and sufficient for certification evaluation, but certification requires a separate A2 authority act. This acceptance act does NOT grant C1 or C2 certification.

5. **Existing-IIPS modifications** — NONE. No existing-IIPS source, methodology, or certification artifact was modified. This program is explicitly prohibited from modifying existing-IIPS.

6. **Engine modifications** — NONE. The 13 certified engines are REUSED, not modified. No engine implementation code exists in P11. `engineVersion: '1.0.0'`, `calibrationVersion: '1.0.0'`, `ontologyDimensions: 8` for all engines (frozen).

7. **P09 certification** — Remains C3/C4/C8/C11 within D03 scope only. This acceptance act does NOT broaden P09 certification.

8. **P10 certification** — Remains C3/C8 within D06–D09 scope only. This acceptance act does NOT broaden P10 certification.

9. **P05/P08 stale boundary assertions** — OUTSTANDING. Six P05/P08 tests fail due to stale authorization-boundary assertions detecting P09/P10/P11 files (not P11 regressions). These are classified as **P09/P10 acceptance debt** and are **NON-BLOCKING** for P11 acceptance. This acceptance act does not resolve them.

10. **Production activation** — NOT AUTHORIZED. This acceptance act does not authorize production activation.

11. **P12–P17** — NOT AUTHORIZED. This acceptance act does not authorize P12 or any downstream phase.

---

## 13-Engine Reuse Verification

| Check | Result |
|---|---|
| 13 engines documented | ✅ 13 entries in `CERTIFIED_ENGINES` |
| No engine implementation | ✅ Registry is metadata only; no `function.*engine` or `class.*Engine` |
| No methodology changes | ✅ D16, D17, D20 referenced but not modified |
| No scoring changes | ✅ No scoring code in registry |
| No calibration changes | ✅ `calibrationVersion: '1.0.0'` for all |
| No taxonomy changes | ✅ No taxonomy code |
| Frozen versions | ✅ `engineVersion: '1.0.0'`, `calibrationVersion: '1.0.0'`, `ontologyDimensions: 8` |

---

## Regression Adjudication

The six P05/P08 test failures are adjudicated as follows:

- **Root cause:** Stale authorization-boundary assertions not updated when P09 and P10 were accepted.
- **Detection:** All six tests detect P09, P10, and P11 files via `git ls-files`.
- **Classification:** P09/P10 acceptance debt, not P11 regressions.
- **Impact on P11:** NON-BLOCKING.
- **Required remediation:** Update boundary assertions to recognize P09/P10/P11 as authorized phases. This is out of scope for P11 acceptance and requires a separate boundary-test maintenance act.

### Failure Details

| Test | Location | Classification |
|---|---|---|
| P05 #95 | `existing-iips-boundary.test.js:46` | Stale boundary assertion (detects P11) |
| P05 #96 | `existing-iips-boundary.test.js:75` | Stale boundary assertion (detects P09/P10/P11) |
| P05 #102 | `existing-iips-boundary.test.js:162` | Stale boundary assertion (detects P09/P10/P11) |
| P08 #27 | `adjustedSeriesProjection.test.js:327` | Stale boundary assertion (detects P09/P10/P11) |
| P08 #62 | `corporateActionIngestion.test.js:317` | Stale boundary assertion (detects P09/P10/P11) |
| P08 #86 | `pitStorageModel.test.js:203` | Stale boundary assertion (detects P09/P10/P11) |

---

## Authority Basis

- **P11 entry authorization:** D26 Program Authority adjudication (commit `af5b23e`).
- **P11 implementation:** Complete (commit `ed4da1e`).
- **A3 designation:** D27 Program Authority act — Raji, P11 gate ONLY (commit `946d842`).
- **Acceptance gate assessment:** Read-only assessment confirming ACCEPTANCE-READY WITH BOUNDED/DEFERRED CONDITIONS.
- **Upstream gates:** P05, P06, P07, P08, P09, P10 all ACCEPTED.
- **P09 certification:** CERTIFIED (C3, C4, C8, C11 within D03 scope only).
- **P10 certification:** PARTIAL (C3, C8 within D06–D09 scope only).

---

## Contract Reuse Verification

P11 implementation reuses the following P05 contracts without modification:

- `buildSnapshot`, `buildField`, `deepFreeze`, `buildSnapshotId` from `p05/src/contract.js`
- `NAMESPACE_TOKEN`, `NAMESPACE_VERSION`, `isNamespaced`, `parseKey`, `assertC1`–`assertC4`, `assertCollisionGuard`, `NamespaceViolation` from `p05/src/namespace.js`
- `canonicalJson`, `canonicalDigest`, `assertIsoUtc` from `p05/src/serialize.js`

No P05 source files were modified. No P00–P10 accepted artifacts were modified.

---

## P01 Gate Integrity

P01 gate SHA remains unchanged: `cf23f0eda0ee917626d90270e883073c5d52d62c`

---

## Test Results

- **P11 tests:** 63/63 PASS
- **Full regression:** 847/853 PASS (6 stale boundary assertions, non-blocking)

### Test Suite Breakdown

| Phase | Tests | Pass | Fail |
|---|---|---|---|
| P05 | 264 | 261 | 3 (stale boundary) |
| P06 | 113 | 113 | 0 |
| P07 | 159 | 159 | 0 |
| P08 | 90 | 87 | 3 (stale boundary) |
| P09 | 97 | 97 | 0 |
| P10 | 67 | 67 | 0 |
| **P11** | **63** | **63** | **0** |
| **Total** | **853** | **847** | **6** |

---

## Acceptance Scope Limitation

This acceptance is scoped to the P11 gate only. It does NOT:
- Grant C1 or C2 certification.
- Grant any other certification.
- Authorize production activation.
- Authorize P12 or any downstream phase.
- Resolve AD-4 revalidation (deferred to P15).
- Resolve AD-17/M-2 (external Existing-IIPS authority).
- Claim replay reproducibility certification.
- Modify any existing-IIPS source, methodology, or certification artifact.
- Modify any of the 13 certified engines.
- Modify scoring, calibration, or taxonomy.
- Broaden P09 certification beyond D03 scope.
- Broaden P10 certification beyond C3/C8 within D06–D09 scope.
- Resolve the six stale P05/P08 boundary assertions.

---

## A3 Acceptor

**Raji**  
P11 gate acceptor, P11 gate ONLY  
Designated by Program Authority explicit decision (D27, commit `946d842`)

---

## Final Authority State

```
P11 IMPLEMENTATION  = COMPLETE
P11 ACCEPTANCE      = ACCEPTED (Raji, P11 gate only)
P11 CERTIFICATION   = NONE_GRANTED
C1 (ingress)        = EVIDENCE_PRESENT (not certified)
C2 (namespace)      = EVIDENCE_PRESENT (not certified)
P11 PRODUCTION      = NOT_AUTHORIZED

P10 CERTIFICATION   = PARTIAL (C3, C8 — D06–D09 scope only)
P10 ACCEPTANCE      = ACCEPTED (Ramki, P10 gate only)

P09 CERTIFICATION   = CERTIFIED (C3, C4, C8, C11 — D03 scope only)
P09 ACCEPTANCE      = ACCEPTED (Sai, P09 gate only)

P05–P09             = ACCEPTED
P01 GATE            = cf23f0eda0ee (UNCHANGED)

AD-4                = DEFERRED (to P15)
AD-17/M-2           = UNRESOLVED (external authority)
REPLAY REPRODUCIBILITY = NOT_CLAIMED
P09/P10 BOUNDARY DEBT = OUTSTANDING (non-blocking)

P12–P17             = NOT_AUTHORIZED
```

---

**Date:** 2026-09-12  
**Commit:** `69583516e9ad0eff52ed26ca5904e7f7f7e0a17b`
