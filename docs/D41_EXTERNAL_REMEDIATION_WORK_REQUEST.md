# D41 — External Remediation Work Request / Owner Handoff

**Program:** IIPS Production Market Data Program
**Date:** 2026-09-13
**Authority:** Program Authority (Sai / Ramki)
**Addressee:** Existing-IIPS Program Owner
**Source:** D40 P15 External Blocker Disposition (commit `989b750`)

---

## Authority Boundary

| Statement | Value |
|---|---|
| **D40 status** | ⛔ **BINDING** — P15 ENTRY-BLOCKED is MAINTAINED |
| **P15 entry** | ⛔ **ENTRY-BLOCKED** |
| **P15 implementation** | ⛔ **NOT AUTHORIZED** |
| **P15 certification** | ⛔ **NONE** |
| **Production activation** | ⛔ **NOT AUTHORIZED** |
| **This request authorizes P15?** | **NO** |
| **This request authorizes production activation?** | **NO** |
| **This request accepts any external remediation?** | **NO** |
| **External remediation requires its own process?** | **YES** — implementation and authority process within the Existing-IIPS program |
| **Closure evidence must be returned?** | **YES** — to this program for Program Authority review before P15 can be reconsidered |

---

## Executive Summary

The IIPS Production Market Data Program is blocked at P15 (Full E2E Certification) by three external dependencies owned by the Existing-IIPS program. P15 cannot proceed until all three are authoritatively resolved, validated, and the evidence is returned to this program.

This document specifies exactly what is required for each workstream.

---

## Dependency Order

```
M-1 repair
  → M-1 validation execution
    → M-1 authoritative acceptance
      → AD-4 revalidation
        → E2E-030 revalidation/closure

M-2 ReplayService repair
  → independent recomputation validation
    → AD-17/M-2 authoritative acceptance
```

Workstreams A and B are sequential (B depends on A). Workstream C is independent and may proceed in parallel.

---

## Workstream A: M-1 / AD-4 — ENGINE_FACTORY Baseline Repair

### A.1 Problem Statement

At the certified HEAD (`67e89aa`), the `ENGINE_FACTORY` in `frontend/server/executive-transport.ts` registers **10 engines** while the `PROGRAM_v1.1_REPLAY_BASELINE.json` declares **13 sectors**. This mismatch (defect **M-1**) means the 13-engine E2E-030 certification was issued against a tree where 3 sector engines could not execute through the governed factory path.

The existing-IIPS M-1 wiring commits (`64797d6` → `4292fff`) that previously attempted this repair were **permanently lost** (INCIDENT-03 classification **E**: exact history absent locally AND remotely, and the underlying content is also lost). A new repair is required.

**Current state on `phase13-next`:** `ENGINE_FACTORY` now contains **13 registrations** (Banking, Insurance, CapitalMarkets, Healthcare, Hospitality, Energy, Utilities, Consumer, Industrials, Technology, Telecommunications, Automobile, MaterialsMetals). This is structural evidence but does NOT constitute authoritative closure.

### A.2 Required Implementation / Remediation

| # | Requirement | Detail |
|---|---|---|
| R-A1 | ENGINE_FACTORY must register exactly 13 engines | All 13 sector engines must be constructable and invokable through the governed factory path |
| R-A2 | Each registration must produce a functional engine instance | `() => new <Engine>()` must return a valid, initialized engine |
| R-A3 | The 13 registered engine IDs must match the 13 sector IDs in `PROGRAM_v1.1_REPLAY_BASELINE.json` | No orphan registrations; no missing sectors |
| R-A4 | No methodology, calibration, or scoring change | The repair is wiring only — no engine behavior changes |
| R-A5 | The `NamespaceCollisionGuard` (ADR-01 C1–C6) must be in place at `LiveDataRuntime.ts` | Guarded merge replaces the unguarded spread at the data merge point |

### A.3 Required Validation Execution

| # | Validation | Pass Criterion |
|---|---|---|
| V-A1 | Platform regression suite | ≥ 506/506 PASS, 0 FAIL |
| V-A2 | Track 1: Platform certification | All assertions PASS |
| V-A3 | Track 2: Cross-sector certification | All assertions PASS |
| V-A4 | Track 3: Replay certification (13 sectors) | `rt.plugins.size === 13` AND `rt.store.size === 13` AND all 13 sector replays PASS |
| V-A5 | Track 6: CSIP certification | All assertions PASS |
| V-A6 | Track 8: Architecture audit | All assertions PASS |
| V-A7 | Golden/oracle engine tests | All frozen inputs yield byte-identical outputs |

### A.4 Required Evidence

| # | Evidence | Format |
|---|---|---|
| E-A1 | Test execution output for V-A1 through V-A7 | Machine-readable log (JSON or structured text) |
| E-A2 | `ENGINE_FACTORY` source diff showing 13 registrations | Git diff or file content |
| E-A3 | `PROGRAM_v1.1_REPLAY_BASELINE.json` sector count verification | 13 sectors confirmed |
| E-A4 | `NamespaceCollisionGuard` source and test evidence | Guard implementation + mutation-proof tests |

### A.5 Required Authority Acceptance

| # | Requirement |
|---|---|
| AA-A1 | Existing-IIPS Program Authority must issue an explicit acceptance/closure record for M-1 |
| AA-A2 | The acceptance record must cite the evidence (E-A1 through E-A4) |
| AA-A3 | The acceptance record must explicitly state: "M-1 is REPAIRED and CLOSED" |
| AA-A4 | The acceptance record must include the durable commit SHA |

### A.6 Required Durable Commit SHA

The M-1 repair must be committed to the Existing-IIPS repository (`ramkivs/iips-review-recovered`) on a durable branch. The commit SHA must be recorded in the closure document.

### A.7 Explicit Closure Criterion

**M-1 is CLOSED when:**
1. ENGINE_FACTORY registers exactly 13 engines matching the baseline
2. All validation executions (V-A1 through V-A7) PASS
3. All required evidence (E-A1 through E-A4) is produced
4. Existing-IIPS Program Authority issues an explicit acceptance/closure record
5. The closure record and evidence are returned to this program

### A.8 What Does NOT Constitute Closure

| # | Non-Closure | Reason |
|---|---|---|
| NC-A1 | ENGINE_FACTORY contains 13 entries without validation execution | Structural evidence only — no proof of correct execution |
| NC-A2 | Validation execution without authoritative acceptance | Evidence without authority decision |
| NC-A3 | Acceptance without evidence | Authority decision without basis |
| NC-A4 | Reconstruction documents (D16/D17) without execution | Plans are not repairs |
| NC-A5 | Lost commits (`64797d6`/`4292fff`) cited as evidence | Objects do not exist — cannot be verified |
| NC-A6 | README or documentation claims without source verification | Claims are not evidence |

---

## Workstream B: E2E-030 Revalidation

### B.1 Problem Statement

E2E-030 v3.0 (13-engine delta certification) was issued at HEAD `67e89aa` against a tree where M-1 was present. E2E-030 is **NOT REVOKED** and **NOT RENEWED**. It requires revalidation after M-1 repair to confirm that the 13-engine baseline is actually certified through the repaired factory path.

**Current state:** No E2E-030 revalidation artifact exists on `phase13-next` or any other accessible branch. Zero references to "E2E-030" found in any document on the external branch.

### B.2 Required Implementation / Remediation

| # | Requirement | Detail |
|---|---|---|
| R-B1 | M-1 must be CLOSED first (Workstream A complete) | Prerequisite — cannot revalidate against a defective factory |
| R-B2 | E2E-030 must be re-executed against the repaired tree | Full 13-engine delta certification re-executed |
| R-B3 | Revalidation must use the same methodology as the original E2E-030 | No methodology change (Part 8 governance) |
| R-B4 | Result must be byte-identical to the original E2E-030 for the 10 originally-executable engines | Non-regression for existing certified engines |
| R-B5 | Result must include the 3 previously-non-executable engines (Automobile, MaterialsMetals, Telecommunications) | New coverage for the repaired factory |

### B.3 Required Validation Execution

| # | Validation | Pass Criterion |
|---|---|---|
| V-B1 | E2E-030 full re-execution | All 13 engines produce certified outputs |
| V-B2 | Original 10-engine outputs match | Byte-identical to original E2E-030 for the 10 originally-executable engines |
| V-B3 | New 3-engine outputs validated | Automobile, MaterialsMetals, Telecommunications produce valid certified outputs |
| V-B4 | Golden/oracle tests | All frozen inputs yield byte-identical outputs across all 13 engines |

### B.4 Required Evidence

| # | Evidence | Format |
|---|---|---|
| E-B1 | E2E-030 revalidation execution log | Machine-readable (JSON or structured text) |
| E-B2 | Byte-identity comparison: original 10-engine outputs vs revalidated outputs | Diff or hash comparison |
| E-B3 | New 3-engine certification outputs | Per-engine certification artifacts |
| E-B4 | Updated `PROGRAM_v1.1_REPLAY_BASELINE.json` (if rebaselined) | JSON with 13 sectors confirmed |

### B.5 Required Authority Acceptance

| # | Requirement |
|---|---|
| AA-B1 | Existing-IIPS Program Authority must issue an explicit E2E-030 revalidation/closure record |
| AA-B2 | The closure record must cite the evidence (E-B1 through E-B4) |
| AA-B3 | The closure record must explicitly state: "E2E-030 is REVALIDATED and CLOSED" |
| AA-B4 | The closure record must state whether E2E-030 is RENEWED (new version) or REAFFIRMED (same version) |

### B.6 Required Durable Commit SHA

The E2E-030 revalidation evidence must be committed to the Existing-IIPS repository on a durable branch. The commit SHA must be recorded in the closure document.

### B.7 Explicit Closure Criterion

**E2E-030 is CLOSED when:**
1. M-1 is CLOSED (Workstream A complete)
2. E2E-030 revalidation execution (V-B1 through V-B4) PASS
3. All required evidence (E-B1 through E-B4) is produced
4. Existing-IIPS Program Authority issues an explicit revalidation/closure record
5. The closure record and evidence are returned to this program

### B.8 What Does NOT Constitute Closure

| # | Non-Closure | Reason |
|---|---|---|
| NC-B1 | E2E-030 referenced in documentation without re-execution | References are not revalidation |
| NC-B2 | Re-execution without byte-identity comparison | No proof of non-regression |
| NC-B3 | Revalidation attempted before M-1 closure | Cannot validate against defective factory |
| NC-B4 | Partial revalidation (fewer than 13 engines) | Must cover full 13-engine baseline |
| NC-B5 | Acceptance without evidence | Authority decision without basis |

---

## Workstream C: AD-17 / M-2 — ReplayService Remediation

### C.1 Problem Statement

`ReplayService.replay()` currently retrieves a stored snapshot from `SnapshotStore` and returns `reproduced: true, byteIdentical: true` as **hard-coded literals** without performing any actual replay or recomputation. This is defect **M-2**.

**Current source code (verified on `phase13-next`):**

```typescript
replay(snapshotId: string): ReplayResult | undefined {
    const snapshot = this.store.get(snapshotId);
    if (!snapshot) return undefined;
    return {
      snapshotId,
      reproduced: true,        // ← LITERAL — not recomputed
      byteIdentical: true,     // ← LITERAL — not recomputed
      evidenceRefs: snapshot.evidenceRefs,
    };
}
```

This means:
- `reproduced` does not indicate that the engine was actually re-executed
- `byteIdentical` does not indicate that the re-execution output was compared to the original
- Any consumer of these flags (including P13 UI17 ReplayExplorer) receives unverified claims
- P15 cannot certify replay reproducibility while the verifying mechanism is unsound

### C.2 Required Implementation / Remediation

| # | Requirement | Detail |
|---|---|---|
| R-C1 | `replay()` must re-execute the governed engine using the stored snapshot's input | The engine must be invoked with the original input, contract version, calibration version, and runtime configuration |
| R-C2 | `reproduced` must be computed, not literal | `true` only if the re-execution completed successfully |
| R-C3 | `byteIdentical` must be computed, not literal | `true` only if the re-execution output is byte-identical to the original snapshot output |
| R-C4 | Comparison must be deterministic | Same input + same versions → same output (NFR-04 determinism) |
| R-C5 | No methodology or calibration change | The repair is replay logic only — no engine behavior changes |
| R-C6 | Failure modes must be explicit | If re-execution fails or produces different output, `reproduced` and/or `byteIdentical` must be `false` with diagnostic information |

### C.3 Required Validation Execution

| # | Validation | Pass Criterion |
|---|---|---|
| V-C1 | Replay of a known-good snapshot | `reproduced: true` AND `byteIdentical: true` — computed, not literal |
| V-C2 | Replay with modified input | `byteIdentical: false` — proves comparison is real |
| V-C3 | Replay with modified calibration | `byteIdentical: false` — proves version binding |
| V-C4 | Replay with missing snapshot | Returns `undefined` or explicit error |
| V-C5 | Replay across all 13 sectors | All 13 sector replays produce computed results |
| V-C6 | Mutation test: remove comparison logic | Test must FAIL — proves the test is not vacuous |
| V-C7 | Full regression suite | No regressions introduced |

### C.4 Required Evidence

| # | Evidence | Format |
|---|---|---|
| E-C1 | ReplayService source code (repaired) | TypeScript source with computed flags |
| E-C2 | Test execution output for V-C1 through V-C7 | Machine-readable log |
| E-C3 | Mutation test evidence (V-C6) | Proof that tests detect literal returns |
| E-C4 | Byte-identity comparison evidence | Hash comparison showing actual computation |

### C.5 Required Authority Acceptance

| # | Requirement |
|---|---|
| AA-C1 | Existing-IIPS Program Authority must issue an explicit AD-17/M-2 resolution record |
| AA-C2 | The resolution record must cite the evidence (E-C1 through E-C4) |
| AA-C3 | The resolution record must explicitly state: "AD-17/M-2 is RESOLVED and CLOSED" |
| AA-C4 | The resolution record must confirm that `reproduced` and `byteIdentical` are now computed, not literal |

### C.6 Required Durable Commit SHA

The ReplayService repair must be committed to the Existing-IIPS repository on a durable branch. The commit SHA must be recorded in the closure document.

### C.7 Explicit Closure Criterion

**AD-17/M-2 is CLOSED when:**
1. ReplayService performs actual engine re-execution and comparison
2. `reproduced` and `byteIdentical` are computed, not literal
3. All validation executions (V-C1 through V-C7) PASS
4. Mutation tests prove the tests are not vacuous
5. All required evidence (E-C1 through E-C4) is produced
6. Existing-IIPS Program Authority issues an explicit resolution/closure record
7. The closure record and evidence are returned to this program

### C.8 What Does NOT Constitute Closure

| # | Non-Closure | Reason |
|---|---|---|
| NC-C1 | `reproduced: true` / `byteIdentical: true` as literals | This IS the defect — not the repair |
| NC-C2 | ReplayService retrieves snapshot and returns its fields | Retrieval is not recomputation |
| NC-C3 | Tests that assert `reproduced === true` without mutation proof | Tests may pass against the literal stub — vacuous |
| NC-C4 | Documentation claiming replay works without source verification | Claims are not evidence |
| NC-C5 | ADR-02 approval (replay identity extension) | ADR-02 is additive identity format — does not repair ReplayService |
| NC-C6 | Reconstruction documents (D16/D17) without execution | Plans are not repairs |
| NC-C7 | JSON equality tests against stored snapshots | Stored snapshot equality is retrieval, not recomputation |

---

## Return Requirements

When all three workstreams are complete, the Existing-IIPS program must return to this program:

| # | Deliverable | Format |
|---|---|---|
| 1 | M-1 closure record with evidence (E-A1 through E-A4) | Markdown + machine-readable evidence |
| 2 | E2E-030 revalidation/closure record with evidence (E-B1 through E-B4) | Markdown + machine-readable evidence |
| 3 | AD-17/M-2 resolution/closure record with evidence (E-C1 through E-C4) | Markdown + machine-readable evidence |
| 4 | Durable commit SHAs for all three closures | Git commit references on durable branches |
| 5 | Existing-IIPS Program Authority acceptance decisions | Signed authority records |

### Post-Return Process

Upon receipt of the closure evidence:

1. **Import** — Evidence is imported into the IIPS Production Market Data Program repository
2. **Review** — Program Authority reviews the evidence against this work request's requirements
3. **Reconciliation** — Evidence is reconciled against the P15 blocker matrix
4. **Decision** — Program Authority decides whether to:
   - Lift the standing prohibition on P15
   - Authorize P15 entry
   - Define P15 work items
   - Designate P15 A3
   - Authorize P15 implementation

**Until this process is complete, P15 remains ENTRY-BLOCKED under D40.**

---

## Authority State (Unchanged by This Document)

| Item | Status |
|---|---|
| **D40** | ⛔ BINDING — P15 ENTRY-BLOCKED MAINTAINED |
| **P15 entry** | ⛔ ENTRY-BLOCKED |
| **P15 implementation** | ⛔ NOT AUTHORIZED |
| **P15 certification** | ⛔ NONE |
| **P16–P17** | ⛔ NOT AUTHORIZED |
| **Production** | ⛔ NOT AUTHORIZED |
| **M-1 / AD-4** | ⛔ UNRESOLVED (this request does not resolve it) |
| **E2E-030** | ⛔ REVALIDATION REQUIRED (this request does not revalidate it) |
| **AD-17 / M-2** | ⛔ UNRESOLVED (this request does not resolve it) |

---

**This document is a work request, not an authority act. It changes no authority state, authorizes no implementation, and does not modify the P15 ENTRY-BLOCKED disposition established by D40.**
