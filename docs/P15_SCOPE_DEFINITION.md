# P15 Scope Definition — Authority Adjudication

**Date:** 2026-09-13  
**Authority:** IIPS Program Authority Adjudication  
**Status:** READ-ONLY SCOPE DEFINITION ACT

---

## 1. P15 Objective

**Establish immutable market-data lineage propagation through the governed execution path.** P15 connects the existing market-data snapshot identity (DataSnapshot.snapshotId) to the governed production execution boundary (EngineApiAdapter), propagates that lineage through the RuntimeCoordinator, and preserves it in the existing Snapshot/Evidence provenance—without modifying any sector-engine behavior, execution methodology, or certified contracts.

---

## 2. P15 In-Scope Work Items

### 2.1 Implementation Work Items

| # | Work Item | Description |
|---|---|---|
| W-01 | Market-data lineage extraction | Extract snapshotId from DataSnapshot at execution boundary |
| W-02 | EngineApiAdapter lineage parameter | Add optional lineage parameter to EngineApiAdapter.execute() |
| W-03 | RuntimeCoordinator lineage propagation | Pass lineage through RuntimeCoordinator to SnapshotService |
| W-04 | SnapshotService provenance extension | Store market-data lineage in snapshot provenance |
| W-05 | EvidencePipeline provenance preservation | Ensure evidence references preserve market-data lineage |
| W-06 | Backward compatibility | Ensure all existing execution paths remain valid |
| W-07 | Test coverage | Add tests for lineage propagation and backward compatibility |

### 2.2 Minimum Implementation File Set

| # | File | Change Type |
|---|---|---|
| 1 | `iips-platform/src/distributed/LiveDataRuntime.ts` | Extract lineage from DataSnapshot |
| 2 | `iips-platform/src/runtime/RuntimeCoordinator.ts` | Propagate lineage through execution |
| 3 | `iips-platform/src/runtime/EngineApiAdapter.ts` | Accept optional lineage parameter |
| 4 | `iips-platform/src/snapshot/SnapshotService.ts` | Store lineage in provenance |
| 5 | `iips-platform/src/evidence/EvidencePipeline.ts` | Preserve lineage in evidence |
| 6 | `iips-platform/tests/integration/p15-market-data-lineage.test.ts` | NEW: Lineage propagation tests |

### 2.3 Required Lineage Propagation

```
DataSnapshot.snapshotId
    ↓ (W-01: extract)
LiveDataRuntime
    ↓ (W-02: pass to adapter)
EngineApiAdapter.execute(engineId, request, lineage?)
    ↓ (W-03: propagate)
RuntimeCoordinator.execute(engineId, request, lineage?)
    ↓ (W-04: store)
SnapshotService.create({ ..., provenance: { marketDataLineage: snapshotId } })
    ↓ (W-05: preserve)
EvidencePipeline (preserves market-data lineage in evidence refs)
```

---

## 3. P15 Explicitly Out-of-Scope Items

| # | Out-of-Scope Item | Rationale |
|---|---|---|
| O-01 | Methodology changes | No sector-engine behavior change required |
| O-02 | Sector-engine changes | All 13 engines remain unchanged |
| O-03 | Architecture rewrite | Additive/backward-compatible only |
| O-04 | Replay/evidence redesign | Existing replay/evidence behavior preserved |
| O-05 | UI/product redesign | No UI changes |
| O-06 | P16 activation/onboarding | P16 is separate phase |
| O-07 | Production activation | Production is separate authority |
| O-08 | Contract version changes | No certified contract regression |
| O-09 | Calibration changes | No calibration changes |
| O-10 | Scoring/composite changes | No methodology changes |
| O-11 | Performance optimization | Not required for lineage propagation |
| O-12 | PIT/data-vintage implementation | Separate future work |

---

## 4. P15 Acceptance Criteria

### 4.1 Immutable Market-Data Snapshot Identity

| # | Criterion | Test Method | Pass Condition |
|---|---|---|---|
| AC-01 | Market-data snapshot identity exists | Inspect DataSnapshot | snapshotId is non-null, immutable, unique |
| AC-02 | Identity is deterministic | Repeated execution | Same input → same snapshotId |

### 4.2 Identity Enters Governed Execution Path

| # | Criterion | Test Method | Pass Condition |
|---|---|---|---|
| AC-03 | Lineage extracted at boundary | Unit test | LiveDataRuntime extracts snapshotId |
| AC-04 | Lineage passed to adapter | Unit test | EngineApiAdapter receives lineage parameter |
| AC-05 | EngineApiAdapter remains governed boundary | Integration test | No execution bypass introduced |

### 4.3 RuntimeCoordinator Receives/Preserves Lineage

| # | Criterion | Test Method | Pass Condition |
|---|---|---|---|
| AC-06 | RuntimeCoordinator accepts lineage | Unit test | execute() accepts optional lineage parameter |
| AC-07 | Lineage propagated to SnapshotService | Unit test | SnapshotService receives lineage |

### 4.4 Existing Snapshot/Evidence References Remain Valid

| # | Criterion | Test Method | Pass Condition |
|---|---|---|---|
| AC-08 | Existing snapshots still created | Regression test | All existing snapshot tests pass |
| AC-09 | Existing evidence still created | Regression test | All existing evidence tests pass |
| AC-10 | Snapshot IDs unchanged | Regression test | Existing snapshot ID format preserved |

### 4.5 Market-Data Lineage Present in Resulting Provenance

| # | Criterion | Test Method | Pass Condition |
|---|---|---|---|
| AC-11 | Lineage stored in provenance | Unit test | snapshot.provenance.marketDataLineage exists |
| AC-12 | Lineage preserved in evidence | Unit test | evidence.provenance.marketDataLineage exists |
| AC-13 | Lineage is immutable | Unit test | provenance cannot be modified after creation |

### 4.6 Replay/Evidence Behavior Remains Valid

| # | Criterion | Test Method | Pass Condition |
|---|---|---|---|
| AC-14 | Replay still reproduces | Regression test | Track 3 replay certification passes |
| AC-15 | Evidence determinism preserved | Regression test | T3-CERT-03 passes |
| AC-16 | Metadata determinism preserved | Regression test | T3-CERT-04 passes |

### 4.7 Existing Execution/Methodology Behavior Unchanged

| # | Criterion | Test Method | Pass Condition |
|---|---|---|---|
| AC-17 | Sector engines unchanged | Regression test | All sector engine tests pass |
| AC-18 | Execution path unchanged | Integration test | Existing execution tests pass |
| AC-19 | Backward compatibility | Integration test | Execution without lineage parameter works |

### 4.8 No Certified Contract Regression

| # | Criterion | Test Method | Pass Condition |
|---|---|---|---|
| AC-20 | Contract version unchanged | Inspection | No contract version increment required |
| AC-21 | No contract regression | Regression test | Track 2 certification passes |

### 4.9 No Execution Bypass Introduced

| # | Criterion | Test Method | Pass Condition |
|---|---|---|---|
| AC-22 | EngineApiAdapter remains boundary | Security review | No execution path bypasses adapter |
| AC-23 | RuntimeCoordinator remains coordinator | Security review | No execution path bypasses coordinator |

---

## 5. P15 Evidence Requirements

The following evidence must be produced for Raji's P15 gate acceptance:

### 5.1 Technical Evidence

| # | Evidence | Format |
|---|---|---|
| E-01 | Implementation code | Git commits on P15 branch |
| E-02 | Unit tests (lineage propagation) | Test suite with >90% coverage |
| E-03 | Integration tests (backward compatibility) | Test suite |
| E-04 | Regression test results | Full test suite output |
| E-05 | Track 2 certification results | Certification report |
| E-06 | Track 3 certification results | Certification report |
| E-07 | Lineage propagation demonstration | Execution trace showing lineage flow |

### 5.2 Authority Evidence

| # | Evidence | Format |
|---|---|---|
| E-08 | P15 implementation authorization | Authority decision document |
| E-09 | P15 implementation report | Technical report |
| E-10 | P15 acceptance recommendation | Recommendation to Raji |

### 5.3 Acceptance Evidence

| # | Evidence | Format |
|---|---|---|
| E-11 | Raji's P15 gate acceptance | Signed acceptance record |
| E-12 | P15 closure report | Closure document |

---

## 6. Authority Boundaries

| Item | Status |
|---|---|
| **Raji** | P15 gate acceptance ONLY |
| **Scope definition** | ✅ ACCEPTED |
| **P15 implementation** | ⛔ NOT AUTHORIZED |
| **P15 certification** | ⛔ NONE |
| **P16 authorization** | ⛔ NOT AUTHORIZED |
| **Production activation** | ⛔ NOT AUTHORIZED |

**Explicit statements:**

1. **Raji = P15 A3 gate acceptance only.** Raji's authority does not extend to P15 implementation, certification, P16, or production.

2. **Scope definition does NOT authorize implementation.** This document defines what P15 will do, but does not authorize the work to begin. Separate P15 implementation authorization is required.

3. **Scope definition does NOT authorize certification.** P15 certification is a separate gate after implementation and acceptance.

4. **Scope definition does NOT authorize P16.** P16 is a separate phase with its own authority gates.

5. **Scope definition does NOT authorize production.** Production activation is a separate authority decision.

---

## 7. Decision

**P15 SCOPE = ACCEPTED**

**Rationale:**

1. **Objective is clear and well-defined:** Establish immutable market-data lineage propagation through the governed execution path.

2. **In-scope work is minimal and well-bounded:** 7 work items, 6 files, additive/backward-compatible changes only.

3. **Out-of-scope items are explicitly excluded:** No methodology changes, no sector-engine changes, no architecture rewrites.

4. **Acceptance criteria are objective and testable:** 23 criteria covering lineage propagation, backward compatibility, regression, and security.

5. **Evidence requirements are complete:** Technical, authority, and acceptance evidence specified.

6. **Authority boundaries are explicit:** Raji's scope is P15 gate acceptance only; implementation requires separate authorization.

7. **Technical basis is established:** Integration points identified, no contract conflicts, no methodology changes required.

---

## 8. Durable Record

**Document path:** `docs/P15_SCOPE_DEFINITION.md`

**Commit SHA:** (to be recorded after commit)

**Remote ref:** (to be recorded after push)

**Remote verification:** (to be recorded after push)

**Working-tree status:** Clean (no source modifications)

---

## 9. Summary

### P15 Scope Status

| Item | Status |
|---|---|
| **P15 objective** | ✅ Defined |
| **P15 in-scope work** | ✅ Defined (7 work items, 6 files) |
| **P15 out-of-scope items** | ✅ Defined (12 exclusions) |
| **P15 acceptance criteria** | ✅ Defined (23 criteria) |
| **P15 evidence requirements** | ✅ Defined (12 evidence items) |
| **P15 scope decision** | ✅ **ACCEPTED** |

### Authority Boundary

| Item | Status |
|---|---|
| **P15 entry** | ✅ CLEAR (P15-ENTRY-A) |
| **P15 A3 acceptor** | ✅ Raji (P15 gate acceptance only) |
| **P15 scope** | ✅ **ACCEPTED** |
| **P15 implementation** | ⛔ NOT AUTHORIZED |
| **P15 certification** | ⛔ NONE |
| **P16 authorization** | ⛔ NOT AUTHORIZED |
| **Production activation** | ⛔ NOT AUTHORIZED |

### Required Next Action

**Program Authority must authorize P15 implementation:**

1. Review P15 scope definition
2. Authorize P15 implementation to begin
3. Implementation team executes P15 work items
4. Produce P15 evidence package
5. Submit to Raji for P15 gate acceptance

**Until P15 implementation is authorized, no implementation work may begin.**

---

**P15 Scope Definition adjudication complete. P15 scope ACCEPTED. P15 implementation remains NOT AUTHORIZED. Production remains NOT AUTHORIZED. Next gate: P15 Implementation Authorization.**
