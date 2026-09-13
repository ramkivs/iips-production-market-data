# D50-R2 — Existing-IIPS Program Authority Acceptance of M-1 / AD-4 and M-2 / AD-17

**Date:** 2026-09-13  
**Authority:** Existing-IIPS Program Authority  
**Status:** READ-ONLY AUTHORITY ACCEPTANCE DECISION

---

## 1. Authority Scope

### Role

The Existing-IIPS Program Authority is performing the acceptance decision for the externally remediated M-1/AD-4 and M-2/AD-17 work.

### Scope of Decision

This decision determines **only** whether the remediation work is accepted sufficiently to proceed to its required validation gates.

This decision does **NOT**:
- Lift D40 (P15 ENTRY-BLOCKED remains in force)
- Authorize P15 implementation
- Certify AD-4 (revalidation still required)
- Certify E2E-030 (revalidation still required)
- Authorize production activation

### Boundary Statement

**Acceptance of M-1/M-2 remediation ≠ Acceptance of AD-4/E2E-030 closure ≠ Authorization of P15 ≠ Authorization of production.**

This is a **narrow, scoped acceptance decision** for the remediation work only.

---

## 2. Evidence Reviewed

### Governance Evidence

| Document | Commit | Status | Reviewed |
|---|---|---|---|
| D40: P15 External Blocker Disposition | `989b750` | BINDING | ✅ |
| D41: External Remediation Work Request | `a604c5c` | DURABLE | ✅ |
| D44: External Remediation Authorization | `65d5dce` | AUTHORIZED | ✅ |
| D45: External Remediation Closure Evidence | `1c16dc9` | EVIDENCE | ✅ |
| D47: Authority Review (initial withholding) | — | WITHHELD | ✅ |
| D48: Durability Package | `fde7f43` | PRESERVED | ✅ |
| D49: Owner Publication | — | CLOSED | ✅ |
| D50: Authority Re-Review (incorrect remote) | `5c157ee` | SUPERSEDED | ✅ |
| D50-R1: Corrective Authority Re-Review | `59c6304` | CURRENT | ✅ |

### Technical Evidence — M-1 / AD-4

| Criterion | Evidence | Verified |
|---|---|---|
| ENGINE_FACTORY 13 engines | `frontend/server/executive-transport.ts` | ✅ 13 entries counted |
| NamespaceCollisionGuard C1-C6 | `iips-platform/src/governance/NamespaceCollisionGuard.ts` (6.4K) | ✅ Implementation reviewed |
| Guarded merge at LiveDataRuntime | `iips-platform/src/distributed/LiveDataRuntime.ts` | ✅ `guardedMerge()` replaces unguarded spread |
| 653/653 M-1 tests | Test execution at commit `2b4e2bd` | ✅ Independently reproduced |
| Mutation proofs | `NamespaceCollisionGuard.test.ts` | ✅ 3/3 PASS (C1, C4, guardedMerge) |
| Remote durability | `ramkivs/iips-production-market-data` branch `m1-ad4-repair` | ✅ Commit `83c098b` on remote |
| D50-R1 disposition | A1: Accept / Clear for revalidation | ✅ Reviewed |

### Technical Evidence — M-2 / AD-17

| Criterion | Evidence | Verified |
|---|---|---|
| ReplayService recomputation | `iips-platform/src/replay/ReplayService.ts` | ✅ Actual re-execution via registered executor |
| `reproduced`/`byteIdentical` computed | SHA256 hash comparison logic | ✅ Computed, not literal |
| 8/8 ReplayService tests | `ReplayService.test.ts` | ✅ Independently reproduced |
| 3/3 mutation proofs | V-C6a, V-C6b, V-C6c | ✅ Detect literal returns |
| 44 full-regression failures | D50-R1 expert review | ✅ All classified as expected consequences |
| Remote durability | `ramkivs/iips-production-market-data` branch `m1-ad4-repair` | ✅ Commit `83c098b` on remote |
| D50-R1 disposition | B1: Accept / Clear for authority acceptance | ✅ Reviewed |

### Independent Verification

The Existing-IIPS Program Authority independently verified:

```bash
# D49 owner publication
$ git ls-remote origin refs/heads/m1-ad4-repair
83c098b9a9f7b81bfb1b146fb65348ab71e121ad	refs/heads/m1-ad4-repair

# ENGINE_FACTORY count
$ grep -c "ENGINE_ID.*: () => new" frontend/server/executive-transport.ts
13

# M-1 tests at commit 2b4e2bd
$ git checkout 2b4e2bd
$ npm test
# tests 653
# pass 653
# fail 0

# M-2 ReplayService mutation proofs
$ git checkout m1-ad4-repair
$ npm test
ok 6 - V-C6: Mutation proof — tests detect literal returns
```

---

## 3. M-1 / AD-4 Decision

### Authority Selection

**M1-A = ACCEPT M-1 / AUTHORIZE AD-4 REVALIDATION**

### Rationale

The M-1 remediation work meets all acceptance criteria:

1. **Technical correctness verified:**
   - ENGINE_FACTORY has 13 engines matching the required baseline ✅
   - NamespaceCollisionGuard implements C1-C6 correctly ✅
   - Guarded merge replaces unguarded spread at LiveDataRuntime ✅
   - 653/653 tests PASS at M-1 commit ✅
   - 3/3 mutation proofs demonstrate tests are not vacuous ✅

2. **Durability achieved:**
   - D49 owner publication is CLOSED ✅
   - Branch `m1-ad4-repair` exists on authoritative remote ✅
   - Commit `2b4e2bd` is reachable and independently verifiable ✅

3. **D50-R1 technical authority cleared M-1:**
   - A1: Accept / Clear for revalidation ✅

4. **No blocking deficiencies identified:**
   - No genuine regressions ✅
   - No methodology changes ✅
   - No unresolved technical concerns ✅

### Conditions for AD-4 Closure

M-1 is **accepted**. AD-4 revalidation is **authorized to proceed**.

AD-4 closure requires:
1. Re-execute AD-4 validation against repaired tree (commit `2b4e2bd` or later)
2. Validate 13-engine baseline matches PROGRAM_v1.1_REPLAY_BASELINE.json
3. Produce AD-4 closure record with explicit results
4. Existing-IIPS Program Authority reviews and accepts AD-4 closure

**AD-4 is NOT yet closed.** This decision only authorizes the revalidation to proceed.

---

## 4. M-2 / AD-17 Decision

### Authority Selection

**M2-A = ACCEPT M-2 / AD-17**

### Rationale

The M-2 remediation work meets all acceptance criteria:

1. **Technical correctness verified:**
   - ReplayService performs actual recomputation (not literal returns) ✅
   - `reproduced` and `byteIdentical` are computed via SHA256 hash comparison ✅
   - Executor registration required for replay ✅
   - Execution context extraction from snapshot provenance ✅
   - 8/8 ReplayService tests PASS ✅
   - 3/3 mutation proofs detect literal returns ✅

2. **Durability achieved:**
   - D49 owner publication is CLOSED ✅
   - Branch `m1-ad4-repair` exists on authoritative remote ✅
   - Commit `83c098b` is the remote tip and independently verifiable ✅

3. **D50-R1 technical authority cleared M-2:**
   - B1: Accept / Clear for authority acceptance ✅

4. **44 full-regression failures resolved:**
   - D50-R1 expert review classified all 44 as expected consequences ✅
   - No genuine regressions identified ✅
   - Failures prove the repair works (detect tests relying on literal returns) ✅

5. **No blocking deficiencies identified:**
   - No methodology changes ✅
   - No unresolved technical concerns ✅

### Treatment of 44 Failures

The Existing-IIPS Program Authority **accepts the D50-R1 expert classification** of the 44 full-regression failures:

**Classification:** All 44 failures are **expected consequences of the intentional AD-17 semantic change**.

**Root cause:** Tests created snapshots without execution context or did not register an executor with ReplayService. The new ReplayService correctly returns `reproduced: false` when recomputation is not possible.

**Conclusion:** The failures are **NOT regressions**. They are **proof that the repair works** by detecting tests that relied on the old literal-returning behavior.

**Authority treatment:** The 44 failures are **accepted as expected** and **not treated as blockers** to M-2 acceptance.

### Conditions for AD-17 Closure

M-2 is **accepted**. AD-17 is **closed** as of this decision.

**Rationale:** AD-17 required:
1. ReplayService recomputation (not literal returns) ✅
2. `reproduced` and `byteIdentical` computed ✅
3. Mutation proofs demonstrating tests detect literal returns ✅
4. Expert review of 44 failures (all expected consequences) ✅

All AD-17 requirements are satisfied. No further revalidation is required.

---

## 5. Treatment of 44 Failures (Detailed)

### D50-R1 Expert Classification

| Classification | Count | Description |
|---|---|---|
| (1) Expected consequence of AD-17 behavior change | 44 | Tests relied on literal returns |
| (2) Stale/obsolete assertion | 0 | All tests are current |
| (3) Genuine regression | 0 | No broken functionality |
| (4) Unable to determine | 0 | All failures have clear root cause |

### Authority Acceptance of Classification

The Existing-IIPS Program Authority has reviewed the D50-R1 expert analysis and **accepts the classification**.

**Key findings:**
- All 44 failures are in replay-related tests
- All failures show `reproduced: false` or `byteIdentical: false` where tests expect `true`
- Root cause is consistent: tests do not provide execution context or do not register executor
- The new ReplayService behavior is correct per AD-17 requirements
- The failures demonstrate the repair successfully eliminated the literal-returning defect

**Authority decision:** The 44 failures are **expected, acceptable, and not regressions**. They do not block M-2 acceptance.

### No Reopening of 44 Failures

Per the D50-R2 objective: "Do not reopen the 44 failures without specific contradictory evidence."

**No contradictory evidence has been identified.** The D50-R1 expert classification is accepted.

---

## 6. Exact Remaining Conditions

### M-1 / AD-4

| Condition | Status | Required For |
|---|---|---|
| M-1 implementation accepted | ✅ SATISFIED | M-1 closure |
| M-1 durably published | ✅ SATISFIED | M-1 closure |
| AD-4 revalidation executed | ⛔ NOT YET | AD-4 closure |
| AD-4 closure record produced | ⛔ NOT YET | AD-4 closure |
| Existing-IIPS authority accepts AD-4 closure | ⛔ NOT YET | AD-4 closure |

**M-1 is CLOSED. AD-4 revalidation is AUTHORIZED but NOT YET EXECUTED.**

### M-2 / AD-17

| Condition | Status | Required For |
|---|---|---|
| M-2 implementation accepted | ✅ SATISFIED | M-2 closure |
| M-2 durably published | ✅ SATISFIED | M-2 closure |
| 44 failures classified as expected | ✅ SATISFIED | M-2 closure |
| AD-17 requirements satisfied | ✅ SATISFIED | AD-17 closure |

**M-2 is CLOSED. AD-17 is CLOSED.**

### E2E-030

| Condition | Status | Required For |
|---|---|---|
| M-1 closed | ✅ SATISFIED | E2E-030 revalidation |
| AD-4 closed | ⛔ NOT YET | E2E-030 revalidation |
| E2E-030 revalidation executed | ⛔ NOT YET | E2E-030 closure |
| E2E-030 closure record produced | ⛔ NOT YET | E2E-030 closure |
| Existing-IIPS authority accepts E2E-030 closure | ⛔ NOT YET | E2E-030 closure |

**E2E-030 revalidation remains REQUIRED and is BLOCKED by AD-4 closure.**

---

## 7. AD-4 Revalidation Authorization

### Status

**AD-4 revalidation is AUTHORIZED to proceed.**

### Rationale

- M-1 is accepted (M1-A) ✅
- M-1 is durably published (D49 closed) ✅
- No blocking deficiencies identified ✅

### Next Steps

1. Execute AD-4 validation against repaired tree (commit `2b4e2bd` or later)
2. Validate 13-engine baseline matches PROGRAM_v1.1_REPLAY_BASELINE.json
3. Produce AD-4 closure record with explicit results
4. Submit to Existing-IIPS Program Authority for acceptance

**AD-4 is NOT yet closed.** Closure requires successful revalidation and authority acceptance.

---

## 8. E2E-030 Revalidation Requirement

### Status

**E2E-030 revalidation remains REQUIRED.**

### Rationale

E2E-030 revalidation depends on:
1. M-1 closure ✅ (satisfied by this decision)
2. AD-4 closure ⛔ (not yet satisfied)

E2E-030 revalidation is **blocked** until AD-4 is closed.

### Next Steps

1. Complete AD-4 revalidation and closure
2. Execute E2E-030 validation against repaired tree
3. Validate 13-engine baseline
4. Validate 10-engine byte-identity
5. Validate 3-engine delta
6. Produce E2E-030 closure record
7. Submit to Existing-IIPS Program Authority for acceptance

---

## 9. D40 P15 ENTRY-BLOCKED Status

### Status

**D40 P15 ENTRY-BLOCKED remains in force.**

### Rationale

P15 entry requires:
1. M-1/AD-4 closed ⚠️ (M-1 closed, AD-4 not yet closed)
2. E2E-030 revalidated ⛔ (blocked by AD-4)
3. AD-17/M-2 closed ✅ (closed by this decision)

**2 of 3 blockers remain unresolved.** P15 ENTRY-BLOCKED must remain in force.

### When Can D40 Be Reconsidered?

D40 can be reconsidered only after:
1. AD-4 revalidation is executed and accepted
2. E2E-030 revalidation is executed and accepted
3. Program Authority performs D52 re-adjudication
4. Program Authority explicitly lifts D40

**This decision does NOT lift D40.**

---

## 10. Production Activation Status

### Status

**Production activation remains UNAUTHORIZED.**

### Rationale

Production activation requires:
1. P15 completed ⛔ (P15 ENTRY-BLOCKED)
2. Separate explicit production authority decision ⛔ (not made)

**No production authority decision has been made.** Production activation remains unauthorized.

### Authority Boundary Statement

**Acceptance of M-1/M-2 does NOT authorize production activation.**

Production activation requires a separate, explicit production authority decision after P15 is completed and all certification gates are passed.

---

## 11. Authority State (Updated)

| Item | Status |
|---|---|
| **D40** | ⛔ BINDING — P15 ENTRY-BLOCKED MAINTAINED |
| **D41** | ✅ DURABLE — work request |
| **D44** | ✅ AUTHORIZED — external remediation |
| **D45** | ✅ EVIDENCE — closure package |
| **D47** | ✅ **RESOLVED** — all withholding reasons addressed |
| **D48** | ✅ DURABILITY PACKAGE — bundle + patch preserved |
| **D49** | ✅ CLOSED — owner publication verified |
| **D50** | ✅ RE-REVIEW COMPLETE — superseded by D50-R1 |
| **D50-R1** | ✅ CORRECTIVE REVIEW COMPLETE — M-1 A1, M-2 B1 |
| **D50-R2** | ✅ **AUTHORITY ACCEPTANCE COMPLETE** — M-1 M1-A, M-2 M2-A |
| **P15 entry** | ⛔ ENTRY-BLOCKED |
| **P15 implementation** | ⛔ NOT AUTHORIZED |
| **P15 certification** | ⛔ NONE |
| **Production activation** | ⛔ NOT AUTHORIZED |
| **M-1** | ✅ **CLOSED** (M1-A accepted) |
| **AD-4** | ⚠️ **REVALIDATION AUTHORIZED** (not yet executed) |
| **M-2** | ✅ **CLOSED** (M2-A accepted) |
| **AD-17** | ✅ **CLOSED** (M2-A accepted) |
| **E2E-030** | ⛔ REVALIDATION REQUIRED (blocked by AD-4) |

---

## 12. Summary

### Authority Decisions

| Workstream | Decision | Rationale |
|---|---|---|
| **M-1 / AD-4** | **M1-A: Accept / Authorize AD-4 revalidation** | Implementation verified, durability achieved, no blocking deficiencies |
| **M-2 / AD-17** | **M2-A: Accept M-2 / AD-17** | Implementation verified, durability achieved, 44 failures expected |

### Closures

| Item | Status |
|---|---|
| **M-1** | ✅ CLOSED |
| **AD-17** | ✅ CLOSED |
| **M-2** | ✅ CLOSED |
| **AD-4** | ⚠️ REVALIDATION AUTHORIZED (not yet closed) |
| **E2E-030** | ⛔ REVALIDATION REQUIRED (not yet closed) |

### 44 Failures

**Accepted as expected consequences of AD-17 semantic change. Not treated as regressions. Not reopened.**

### Remaining Blockers

1. **AD-4 revalidation** — Authorized, not yet executed
2. **E2E-030 revalidation** — Required, blocked by AD-4

### Final Status

**D40 remains binding. P15 remains ENTRY-BLOCKED. No production authorized.**

However, significant progress has been achieved:
- D49 is CLOSED (owner publication verified)
- D47 is RESOLVED (all withholding reasons addressed)
- M-1 is CLOSED (M1-A accepted)
- M-2 is CLOSED (M2-A accepted)
- AD-17 is CLOSED (M2-A accepted)
- AD-4 revalidation is AUTHORIZED
- 44 failures are RESOLVED (expected consequences)

The path to P15 unblocking is now clear:
1. Execute AD-4 revalidation
2. Existing-IIPS authority accepts AD-4 closure
3. Execute E2E-030 revalidation
4. Existing-IIPS authority accepts E2E-030 closure
5. D51 updated evidence package
6. D52 Program Authority re-adjudication
7. D40 reconsidered, P15 unblocked

---

## 13. Next Mandatory Gate

### Immediate

1. **Execute AD-4 revalidation**
   - Re-execute AD-4 validation against repaired tree (commit `2b4e2bd` or later)
   - Validate 13-engine baseline matches PROGRAM_v1.1_REPLAY_BASELINE.json
   - Produce AD-4 closure record with explicit results
   - **Required for:** AD-4 closure, E2E-030 unblocking

### After AD-4 Closure

2. **Existing-IIPS authority accepts AD-4 closure**
   - Review AD-4 closure record
   - Issue explicit AD-4 acceptance
   - **Required for:** E2E-030 unblocking

3. **Execute E2E-030 revalidation**
   - Re-execute E2E-030 validation against repaired tree
   - Validate 13-engine baseline
   - Validate 10-engine byte-identity
   - Validate 3-engine delta
   - Produce E2E-030 closure record
   - **Required for:** E2E-030 closure

4. **Existing-IIPS authority accepts E2E-030 closure**
   - Review E2E-030 closure record
   - Issue explicit E2E-030 acceptance
   - **Required for:** D51 evidence package

### After All Closures

5. **D51 updated evidence package**
   - Include M-1, M-2, AD-4, E2E-030 closure records
   - Include Existing-IIPS authority acceptance records
   - Include D50-R1 and D50-R2 authority decisions
   - **Required for:** D52 Program Authority re-adjudication

6. **D52 Program Authority re-adjudication**
   - Review D51 evidence package
   - Adjudicate all closures
   - Reconsider D40 and P15 entry
   - **Required for:** P15 unblocking

---

**D50-R2 is complete. M-1 accepted (M1-A). M-2 accepted (M2-A). AD-4 revalidation authorized. E2E-030 revalidation required. D40 remains binding. P15 remains ENTRY-BLOCKED. No production authorized.**
