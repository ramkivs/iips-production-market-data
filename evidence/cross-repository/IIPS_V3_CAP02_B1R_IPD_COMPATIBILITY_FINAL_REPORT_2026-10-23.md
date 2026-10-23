# IIPS v3.0 CAP-02 — B-1R IPD compatibility consolidated final report

**Status at this revision: validated implementation candidate; publication receipt pending.**

## Outcome

The narrow IPD compatibility act has been implemented on the CAP-02 session branch. Current-main IPD
now has the consumer-required series-aware PIT read/store semantics, deterministic offline D114
population, `./pit` and `./d114-non-production` package entries, and the narrow U7 public type/refusal
vocabulary, while retaining `./portfolio-ui` and its browser/write safeguards.

The actual installed tarball was consumed by a standalone TypeScript/runtime fixture and by all five
verbatim IRR importer files at read-only IRR commit `98cd56a9a568f431ea31d5515e515a1b6cbb91ba`.
The three IRR production composition modules and adapter executed successfully: 8 fixture records,
20 combined records, correct D114 vintage selection and typed invalid-identity refusal. The two IRR
route integration test files compiled only; no IRR route/E2E result is claimed.

## Validation summary

- Typecheck: PASS.
- Full build: PASS (existing Vite chunk-size advisory only).
- Guarded full suite: **875 executed / 874 passed / 0 failed / 1 skipped**.
- Focused compatibility suite: **99 / 99 passed**.
- Packed public consumer: PASS; 121 packed files; all three export maps and declarations resolved.
- Actual five-file IRR importer typecheck: PASS; verbatim copies; package imports unchanged.
- Installed UI browser bundle/closure scan: PASS; no forbidden Node, IPC, persistence, PIT or D114
  entries in the browser closure.
- `npm pack --dry-run` and `git diff --check`: PASS.

Detailed commands, consumer rows and the compatibility correction are in
`IIPS_V3_CAP02_B1R_IPD_COMPATIBILITY_EXECUTION_EVIDENCE_2026-10-23.md`.

## Authority and preserved fences

Only the exact IPD-owned act scope was implemented. `companyId` is not `securityId`; no series or
identity is inferred from company, sector, symbol or tenant. D114 remains
`NON_PRODUCTION / OFFLINE_BOOTSTRAP / LOCAL_FIXTURE_ONLY`. No production acquisition, persistence,
privileged IPC, identity/binding provisioning, operational write or durable enablement was added.
Receipt-only success, fabrication-free refusal, distinct `OUTCOME_UNKNOWN`, no automatic retry,
`WRITE_NOT_AUTHORIZED`, `SESSION_ONLY` and `durable:false` remain intact.

## Remaining work and non-claims

Publication is not inferred from local validation. The remaining publication steps are the focused
IPD PR, required checks, merge, remote commit/tree/blob/package read-back, merged-commit consumer
re-proof and post-merge CI. IRR's separately authorized repin and any target-host/operator-store work
remain outside this IPD change. Gate 4 is **not qualified**; U4 is not rendered, U5/U6 are not granted,
Gate A′ is not provisioned, and no production E2E or durability claim is made.

## Publication receipt

Pending; append the verified PR/merge and post-merge evidence here after remote read-back.
