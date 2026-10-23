# IIPS v3.0 CAP-02 — Gate 3 Amendment 02 — U2 implementation authority

> **STATUS: RENDERED — EFFECTIVE FOR PART A EXACT MANIFEST ONLY.** This is the IPD PA decision/implementation act for U2 code corrections. It is not Gate 3 acceptance, Gate 4 qualification, result acceptance, Gate 5 admission, or operational-write authorization. The separate provenance/schema act is `IIPS_V3_CAP02_U2_PROVENANCE_SCHEMA_ACT_EFFECTIVE_2026-10-23.md` and has its own exact scope.

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-CAP02-G3-AMEND-02-U2` |
| Decision date | 2026-10-23 (UTC) |
| Repository | `ramkivs/iips-production-market-data` |
| Decision/implementation baseline | `main@3dde26aa1cd29197c31498f380d9600aa5471222`; tree `62273fde60cba47986969be7c32cf30fbf7d4e1d` |
| PA | Ramki, Program Authority |
| Authority basis | Standing PA global decision/execution grant (2026-10-12), IRR F-3 record blob `c4c9f7d79ef181af96f6c4e5cc108288ef22fd02`; DEC-06 authority reconciliation, IRR main blob `4be3ea578a51a1a949337e5d218b89841c04892d`, especially R-1/R-3/R-6/R-7; current PA execution instruction in this session; accepted Gate E W-1 and G2 contract v1 as constraints, not as grants of writes. |
| Prior proposal | `IIPS_V3_CAP02_U2_GATE3_MANIFEST_AMENDMENT_PROPOSED_2026-10-23.md`; incorporated only where the exact manifest below is restated. Its prior PROPOSED status is preserved historically. |

## 1. Decision

Under the standing PA grant and current direction to execute IPD-owned CAP-02 work without repeat approval, the PA **renders this exact U2 implementation authority effective**. The standing grant authorizes making this bounded act; this record is the specific act; remote publication and its content hashes prove publication. This act does not claim that a code change has already occurred.

This act amends the bounded Gate 3 implementation manifest solely for the paths/symbols and correctness behavior in §2. It does not rewrite the accepted Gate 3 result or claim its earlier acceptance covers this new scope. The change is a precondition for any future write qualification; it enables no writes.

## 2. Exact PART A manifest

| Path | Scope |
|---|---|
| `src/identity/broker_observation_resolver.ts` (new) | Pure synchronous mapping of raw broker observations `{symbol, isin?, exchange?}` to exactly one canonical company identity through the existing governed IPD `SecurityMaster` and effective-dated mapping source. Return resolved/unmapped/ambiguous outcomes with source evidence/quarantine data. No I/O, persistence, new master, fixture fabrication, fallback, or caller-provided canonical identity. |
| `src/persistence/brokerImportPersistence.ts` (modify) | Accept raw observations and an injected governed resolver; refuse whole request on zero/ambiguous identity with zero store effect and per-item evidence; make `expectedRevision` mandatory and runtime-validated; assert duplicate disposition at import boundary; model `OUTCOME_UNKNOWN` distinctly and expose read reconciliation; preserve existing refusal meanings and the write guard. |
| `src/persistence/portfolio_store.ts` (modify) | Make the import mutation request atomic using one `BEGIN IMMEDIATE`/`COMMIT`, rollback on any error; place owner-binding revalidation, revision comparison, idempotency check and all import mutations in that transaction. Preserve existing revision arithmetic, operation semantics, row ownership and hard-false write authorization. No schema change under this Part A act. |
| `tests/q1_broker_import_durability.test.ts` (modify) | Add T-U2-1 through T-U2-8 and T-U2-10 from §4, including boundary-level identity, expectation, duplicate, fault, revocation race, unknown/reconciliation, commit-before-ack and denial assertions. |
| `tests/g3_write_gate.test.ts`, `tests/g3_durability_vocabulary.test.ts` | May be modified only to strengthen assertions that the existing gate remains hard false and durable success remains unrepresentable; no existing denial may be weakened. |

The following are explicit unchanged paths: `src/persistence/binding.ts` (reuse `resolveActiveBinding` inside the transaction); `src/ipc/dispatch.ts`; `src/ipc/protocol.ts`; `src/ipc/entrypoint.ts`; all IRR paths. No IPC operation, wire field, framing, outcome member, HTTP route, renderer, or interface revision is authorized. The resolver must not mutate existing frozen anchor files `src/identity/security_master.ts` (blob `60030e0c17f8b2a31977ce598c80b18dc52d6727`), `src/identity/mapping_store.ts` (`eec60c09e08ec45a29979abf25b21efddef448ae`), or `src/identity/quarantine.ts` (`70c6f6580f6ade66eb31e7dee3adc4b52b10b010`).

## 3. Invariants and interpretation

1. The caller sends broker-observed fields only. Canonical identity is resolved IPD-side. `companyId`, `runtimeCompanyId`, `identityStatus`, `resolutionDisposition`, owner, tenant and credentials remain refused at the wire boundary.
2. Every imported holding resolves to exactly one governed canonical identity or the whole request refuses before mutation.
3. The entire import and its duplicate/revision decision are a single transaction. On an injected failure before commit, all rows and revisions equal the pre-request snapshot.
4. `expectedRevision` is the caller's compare-and-swap assertion, never replaced with a newly read revision. Same-content duplicate is an explicit no-op without a new revision; stale expectation is a conflict.
5. Revocation and import are serialized so a revocation committed before the import's protected decision cannot be bypassed. Concurrency behavior is tested against the actual SQLite transaction/connection semantics.
6. A caller/transport failure whose commit result cannot be known is `OUTCOME_UNKNOWN`, not refusal or success. No automatic retry. A read reconciliation reports authoritative current state without fabricating a commit.
7. A success acknowledgment follows database `COMMIT`. This is a correctness property only; `durable:true` is not made available by this act.
8. `evaluatePortSaveGuard()` remains hard false; IPC continues to return `WRITE_NOT_AUTHORIZED` before dispatch/mutation; no `durable:true`, operational write, or production claim.

## 4. Required tests and closure evidence

| Test | Pass criterion |
|---|---|
| T-U2-1 raw identity | Raw-only observations resolve via the injected governed source; caller canonical keys are refused. |
| T-U2-2 zero/ambiguous | Whole request refuses, `storeEffect: NONE`, item evidence present, no mutation. |
| T-U2-3 expected revision | Omission/malformed/stale values refuse or conflict as specified; no hidden current-revision substitution. |
| T-U2-4 atomicity/fault injection | One transaction; inject at each database mutation boundary for create/update and compare complete database state before/after rollback. |
| T-U2-5 revocation race | Race revocation with an import using independent connections/barriers; assert serialized outcome and no stale authorization write. |
| T-U2-6 idempotency | Same digest yields `ALREADY_IMPORTED_NO_OP` before and after reopen, no extra revision/contribution; different digest follows expected revision. |
| T-U2-7 unknown/reconcile | Commit-before-ack and pre-commit failures are distinguishable; no retry; reconcile-by-read reports persisted state. |
| T-U2-8 acknowledgment order | Instrumented transaction proves ack is produced only after commit; refusal gate still yields zero effect. |
| T-U2-10 write gate | Hard-false guard and `WRITE_NOT_AUTHORIZED` unchanged. |

Closure also requires migration compatibility (for the separate Part B migration where applicable), full IPD typecheck/build/test, exact command/exit/test counts, staged diff scope review, merged PR, post-merge CI and remote blob verification. These tests are not Gate 4 qualification or result acceptance.

## 5. Exclusions and gate separation

No schema/migration/contribution-model changes (separate effective instrument required); no changes to the IPC contract or route; no IRR edits; no W-1 guard changes; no Gate 4 execution/acceptance, Gate 5 admission, or operational-write authorization. Existing package export scope is unchanged. No retroactive authorization of prior changes is created.

## 6. Decision state

```text
U2 Part A implementation authority: EFFECTIVE for §2 exact manifest
U2 Part B provenance/schema:        separate act; see companion record
Gate 3 prior acceptance:             remains bounded to its prior manifest; not retroactively expanded
Gate 4 / result acceptance:          not authorized / not rendered
Gate 5:                              not granted
Operational writes:                  NOT AUTHORIZED; WRITE_NOT_AUTHORIZED preserved
U2 completion:                        NOT YET — authority rendered, implementation/evidence pending
```

*Rendered under the recorded standing PA grant and the current PA-directed execution. No signature, approval ID, spoken selection or independent authority is fabricated.*
