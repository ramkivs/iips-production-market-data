# CAP-02 IPD execution tracker — 2026-10-23

**Repository:** `ramkivs/iips-production-market-data`

**Session branch:** `arena/7b04bc0f-iips-production-market-data`
**Status semantics:** implementation progress only; this tracker does not accept results or promote gates.

| Workstream | Current evidence | Status | Next gate / blocker |
|---|---|---|---|
| CAP-02 prerequisite PR #48 | Merged commit `3dde26aa1cd29197c31498f380d9600aa5471222`; post-merge CI run `39932962357` passed. | Complete as repository integration fact | Tracker reconciliation remains a separate evidence fact. |
| U2 Part A identity/atomicity implementation | Effective exact manifest `IIPS_V3_CAP02_G3_AMEND_02_U2_EFFECTIVE_2026-10-23.md`; implementation merged in PR #52 as `c15135df09a4b71a20cc99623a4a322a41979903`; post-merge CI run `39935853893` succeeded. Governed raw-observation resolution, in-transaction binding revalidation, expected-revision checks, atomic import persistence, refusal/unknown-outcome states, migration and tests are on IPD main. | **Implementation complete; reconciled against gate criteria in `IIPS_V3_CAP02_U2_CRITERION_EVIDENCE_AND_GATE_STATUS_2026-10-23.md`** | Gate 4/5 progression and operational write authorization remain separate and ungranted. |
| U2 Part B provenance/schema | Effective separate schema act `IIPS_V3_CAP02_U2_PROVENANCE_SCHEMA_ACT_EFFECTIVE_2026-10-23.md`; additive migration `004_portfolio_contribution_provenance` merged in PR #52; all six fields asserted on insert and after restart; pre-existing rows keep six SQL `NULL`s; migration 001 blob `f594a182…` unchanged; ledger idempotent. | **Implemented and verified** | Retain NULL for historical facts not recorded; Gate 4/5 unchanged. |
| U2 write-port wrapper | Supplemental exact-scope authority published in PR #51; merged as `7145a2cea0b2d7d9d8a401e57db3f9ce20a8f0a7`; pre-merge checks and post-merge CI run `39934639130` succeeded. Wrapper merged in PR #52; `assertWritable()` still refuses before any transaction or callback. | Authority and implementation merged; no write enabled | Existing W-1 guard still refuses first. |
| U2 evidence gaps closed this pass | (a) governed-source rejection: a resolver built over a non-governed master now has an executed fail-closed test; (b) T-U2-5 upgraded to race a revocation against the **actual** `withBrokerImportTransaction` path, plus absent / duplicate-ACTIVE / mismatched-membership binding shapes and the caller-transaction precondition. | **Closed** | None; no defect or regression found in the merged implementation. |
| U3 / Gate 4 qualification | IPD-local matrix remains recorded in `IIPS_V3_CAP02_U2_CRITERION_EVIDENCE_AND_GATE_STATUS_2026-10-23.md` §B. This CAP-02 follow-on revalidated local typecheck/build/tests and 131 focused refusal/authority/binding guard tests; it did not access a target host or operator store (details in `IIPS_V3_CAP02_B1R_PACKAGE_AND_GATE4_PREPARATION_2026-10-23.md`). | **Not qualified** | Target Windows host run and real-store restart evidence remain absent; `durable:true` remains blocked on U6; cross-repo E2E remains separate. |
| U4 result acceptance | Not rendered. | **Not rendered** | Requires actual Gate 4 results. Green CI and a merged PR are not acceptance. |
| U5 Gate 5 admission | Not granted. | **Not granted** | Depends on U4 acceptance; not inferable from U2 implementation. |
| U6 operational write authorization | W-1(3) and W-1(4) unmet; `WRITE_NOT_AUTHORIZED` preserved and enforced; only shipped port declares `SESSION_ONLY` / `durable:false`. | **Not authorized** | Effective U6 decision satisfying W-1. No code change can supply it. |
| U7 provider-side outcome mapping | IRR's U7 read/result contract is now **EFFECTIVE** at IRR `main@30091d33ecf3c094cc25d78d4b66023ab3279759`, whose §5 names the exact IPD act. IPD act rendered: `IIPS_V3_CAP02_U7_IPD_PROVIDER_OUTCOME_ACT_EFFECTIVE_2026-10-23.md`. Implemented: minimal v1 receipt, no preview fallbacks in the committed panel, refusals with no mandatory record/timestamp/zero/durability, a distinct `OUTCOME_UNKNOWN` state with no retry, receipt-driven durability, optional `getAnalytics`. Tests `T-U7-1…T-U7-7` (10 tests) pass. | **Provider side executed** (IPD capacity) | IRR must repin to the IPD commit carrying this change, then create its `PortfolioStorePort` implementation, mount the surface and produce end-to-end evidence. No end-to-end claim is made here. |
| Binding provisioning / active owner | Resolver, in-transaction revalidation and all binding failure shapes are under test. `src/persistence/provisioning.ts` remains library-only, brand-gated and unreachable from `ipc/**` and startup. No identity was provisioned and none should have been. | Implementation behaviour verified; **no provisioning performed; none authorised** | Effective Gate A′/provisioning execution decision, then a controlled operator action. Provenance: an operational identity write, not an implementation gap. |
| IRR | Read-only inspection only: `main@3f628cbc15d0a4712980dc9c9e378edf062be67e`, tree `eb807be6c9b02062c060a7a0793b3733e80612b6`. Five actual IPD-package importers; one additional tracker-listed path is comment-only. | Unchanged | No IRR file, branch, PR, issue, comment or tracker modified. |
| CAP-02 B-1R PIT/D114 package prerequisite | Evaluated IPD baseline `main@24e62c80…` exports only `./portfolio-ui`; both required subpaths fail runtime and TypeScript resolution, and its PIT/D114 APIs are missing or incompatible. See `IIPS_V3_CAP02_B1R_PACKAGE_AND_GATE4_PREPARATION_2026-10-23.md`. | **BLOCKED — no sufficiently scoped effective IPD-main act; no package/API change made** | Effective exact-scope IPD act and implementation/test/publication for compatible `./pit` and `./d114-non-production`; only then execute the already-authorized IRR B-1R repin and verification. |

## Publication reconciliation

- PR #48 merged; merged state, pre-merge checks, post-merge CI, and tracker reconciliation are tracked separately.
- PRs #49 and #50 remain merged baseline corrections as recorded in the independent reconciliation.
- PR #51 published the exact write-guard adapter amendment only; merged commit `7145a2cea0b2d7d9d8a401e57db3f9ce20a8f0a7`; pre-merge CI and executed-test-count checks passed, and post-merge CI succeeded.
- PR #52 merged as `c15135df09a4b71a20cc99623a4a322a41979903`; PR checks passed (CI run `39935747730`, executed-test-count check `120354984364`), and post-merge CI run `39935853893` succeeded.
- PR #53 merged as `04e63edd995889b170eed6660e7010dd32e15fd3` (tree `3949ab645697d8c7c26dd5e5708c43bcdcd71cec`). This pass starts from exactly that commit/tree with a clean working tree.
- This pass published the U7 provider/UI act and implementation, the U2 criterion-evidence and gate-status record, and this tracker reconciliation in PR **#54**.

### Publication receipt — PR #54 (verified against the remote)

```text
IPD main before:  04e63edd995889b170eed6660e7010dd32e15fd3  tree 3949ab645697d8c7c26dd5e5708c43bcdcd71cec
PR #54 head:      0742a20a3903351a8306a9b6cc302b5135f25198
PR #54 checks:    "typecheck · build · test" SUCCESS (run 39938245808)
                  "executed test count" SUCCESS — 848 executed, 847 passed, 0 failed
PR #54 merge:     MERGED 2026-10-23T10:20:04Z
IPD main after:   88e434474c388fb397ad09878ec6139064fbfffd  tree 804ffa5511476ad6e84e2a2468a7844409d848e9
ancestry:         0742a20a… verified an ancestor of origin/main after merge
post-merge CI:    run 39938354292 (push, main) SUCCESS; check "executed test count"
                  848 tests executed — 847 passed, 0 failed at 88e43447…
changed paths:    10 — exactly the files below, no other path
  M evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md
  A evidence/cross-repository/IIPS_V3_CAP02_U2_CRITERION_EVIDENCE_AND_GATE_STATUS_2026-10-23.md
  A evidence/cross-repository/IIPS_V3_CAP02_U7_IPD_PROVIDER_OUTCOME_ACT_EFFECTIVE_2026-10-23.md
  M frontend/src/features/portfolio/BrokerImportModal.tsx
  M frontend/src/features/portfolio/PortfolioWorkspace.tsx
  M frontend/src/features/portfolio/import/ui-broker-import-view-model.ts
  M frontend/src/features/portfolio/portfolioStorePort.ts
  M tests/bi07_portfolio_store_port.test.ts
  M tests/q1_broker_import_durability.test.ts
  A tests/q1_cap02_u7_provider_outcomes.test.ts
```

A green CI run, a merged PR and this record are each publication facts — none of them is Gate 4
qualification, result acceptance, Gate 5 admission, operational write authorization, or end-to-end
integration evidence.

## Tracker workbook disposition

The repository workbook `IIPS_Production_Market_Data_Intelligence_Program_v1.0_TRACKER_INTEGRATION_ALIGNED.xlsx` was inspected read-only. It is the broad P00–P17 program roadmap and contains no CAP-02/U2/U7 work item or corresponding status field. It was not edited to avoid misclassifying this separately governed CAP-02 work. This CAP-02-specific status record is maintained here instead.

## Local validation of this pass

Executed on the current IPD worktree, serially (typecheck → build → test), before publication:

- `npx tsc --noEmit` — exit 0.
- `npm run build` — exit 0 (TypeScript, Vite, and package build); Vite emitted only its existing large-chunk advisory.
- `npm test` — exit 0: **848 tests executed, 847 passed, 0 failed, 1 skipped** (116 suites; `scripts/run-tests.mjs` guard passed).
- Focused `node --test dist/tests/q1_broker_import_durability.test.js` — 18 tests, 0 failed (was 15).
- Focused `node --test dist/tests/q1_cap02_u7_provider_outcomes.test.js` — 10 tests, 0 failed (new).
- `git diff --check` — exit 0.

These are local implementation and qualification-fixture tests. They are **not** Gate 4 qualification, result acceptance, operational write authorization, or end-to-end UI/IPC integration.

## Non-negotiable gate state

```text
WRITE_NOT_AUTHORIZED: preserved and enforced before any transaction or callback
Durable adapter capability marker: durable:false preserved; durable:true unreachable from the shipped adapter
Durability display: receipt-driven only (U7) — a static capability declaration is never commit evidence
Gate 3 scope: unchanged except the exact effective U2 Part A/Part B/addendum and U7 provider acts
Gate 4 qualification / result acceptance: not claimed
Gate 5 admission: not granted
Operational writes: denied
Binding provisioning: not performed, not authorized
U2 persistence implementation: complete and reconciled (see the criterion evidence record)
U7 provider side: executed on IPD; U7 consumer end-to-end: not claimed
End-to-end integration: not claimed
```

## CAP-02 one-pass addendum — B-1R package and Gate 4 preparation (2026-10-23)

- **Baseline:** the investigation reconciled authoritative IPD `main@24e62c80f37e8a55c34747581a68209c67b775a` (tree `d5eb798b7455711f7e46bfaec89fdca551fa0f3d`) against read-only IRR `main@3f628cbc15d0a4712980dc9c9e378edf062be67e` (tree `eb807be6c9b02062c060a7a0793b3733e80612b6`).
- **Authority outcome:** Increment A is effective only for `./portfolio-ui`; the effective IRR composition act's B-1R remains authorized but not executed and is conditional on IPD mainline package compatibility. No effective IPD act covering `./pit`, `./d114-non-production` and the consumer-required missing/incompatible source APIs was found. No source/API/export change was made.
- **Consumer/package outcome:** five IRR files actually import the PIT/D114 subpaths; the sixth register-listed path is comment-only. Both subpaths fail ESM package resolution (`ERR_PACKAGE_PATH_NOT_EXPORTED`) and TypeScript consumer resolution (TS2307). Current-main PIT/D114 APIs also do not satisfy the securityId-addressed service/store and D114 helper imports. There is no eligible compatible main pin in the evaluated baseline.
- **Independent Gate 4 preparation:** local build/test and refusal/authority/binding checks were revalidated, but no target Windows host, real operator store, operator path or IPC endpoint was used. Gate 4 remains **NOT QUALIFIED**; U4/U5/U6, provisioning and E2E remain unchanged and are not inferred from package/CI checks. Preserve `WRITE_NOT_AUTHORIZED`, `SESSION_ONLY` and `durable:false`.
- **Workbook:** worksheet cells were read via the workbook relationships/XML. The 12-sheet P00–P17 roadmap has no explicit CAP-02/U2/U7/B-1R/Gate-4 work item; the workbook was not edited.
- **Detailed evidence and handoff:** `IIPS_V3_CAP02_B1R_PACKAGE_AND_GATE4_PREPARATION_2026-10-23.md`. IRR may inspect IPD `main@24e62c80…` as the authoritative evaluated baseline, but must not pin it for B-1R until the effective IPD package/API prerequisite is met and remotely verified.
