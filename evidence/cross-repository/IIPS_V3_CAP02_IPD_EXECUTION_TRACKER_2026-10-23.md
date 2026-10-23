# CAP-02 IPD execution tracker — 2026-10-23

**Repository:** `ramkivs/iips-production-market-data`

**Session branch:** `arena/0a035399-iips-production-market-data`
**Status semantics:** implementation progress only; this tracker does not accept results or promote gates.

| Workstream | Current evidence | Status | Next gate / blocker |
|---|---|---|---|
| CAP-02 prerequisite PR #48 | Merged commit `3dde26aa1cd29197c31498f380d9600aa5471222`; post-merge CI run `39932962357` passed. | Complete as repository integration fact | Tracker reconciliation remains a separate evidence fact. |
| U2 Part A identity/atomicity implementation | Effective exact manifest `IIPS_V3_CAP02_G3_AMEND_02_U2_EFFECTIVE_2026-10-23.md`; implementation merged in PR #52 as `c15135df09a4b71a20cc99623a4a322a41979903`; post-merge CI run `39935853893` succeeded. Governed raw-observation resolution, in-transaction binding revalidation, expected-revision checks, atomic import persistence, refusal/unknown-outcome states, migration and tests are on IPD main. | **Implementation complete; reconciled against gate criteria in `IIPS_V3_CAP02_U2_CRITERION_EVIDENCE_AND_GATE_STATUS_2026-10-23.md`** | Gate 4/5 progression and operational write authorization remain separate and ungranted. |
| U2 Part B provenance/schema | Effective separate schema act `IIPS_V3_CAP02_U2_PROVENANCE_SCHEMA_ACT_EFFECTIVE_2026-10-23.md`; additive migration `004_portfolio_contribution_provenance` merged in PR #52; all six fields asserted on insert and after restart; pre-existing rows keep six SQL `NULL`s; migration 001 blob `f594a182…` unchanged; ledger idempotent. | **Implemented and verified** | Retain NULL for historical facts not recorded; Gate 4/5 unchanged. |
| U2 write-port wrapper | Supplemental exact-scope authority published in PR #51; merged as `7145a2cea0b2d7d9d8a401e57db3f9ce20a8f0a7`; pre-merge checks and post-merge CI run `39934639130` succeeded. Wrapper merged in PR #52; `assertWritable()` still refuses before any transaction or callback. | Authority and implementation merged; no write enabled | Existing W-1 guard still refuses first. |
| U2 evidence gaps closed this pass | (a) governed-source rejection: a resolver built over a non-governed master now has an executed fail-closed test; (b) T-U2-5 upgraded to race a revocation against the **actual** `withBrokerImportTransaction` path, plus absent / duplicate-ACTIVE / mismatched-membership binding shapes and the caller-transaction precondition. | **Closed** | None; no defect or regression found in the merged implementation. |
| U3 / Gate 4 qualification | IPD-local qualification matrix executed and recorded (`IIPS_V3_CAP02_U2_CRITERION_EVIDENCE_AND_GATE_STATUS_2026-10-23.md` §B): migration/transaction, fault injection, unknown-outcome recovery, revocation serialization, expected-revision, idempotency, commit/ack ordering, write denial. | **Not qualified** | Missing evidence has owners: target Windows host run, target-host restart durability, `durable:true` path (needs U6 first), cross-repo end-to-end (needs IRR composition + repin). |
| U4 result acceptance | Not rendered. | **Not rendered** | Requires actual Gate 4 results. Green CI and a merged PR are not acceptance. |
| U5 Gate 5 admission | Not granted. | **Not granted** | Depends on U4 acceptance; not inferable from U2 implementation. |
| U6 operational write authorization | W-1(3) and W-1(4) unmet; `WRITE_NOT_AUTHORIZED` preserved and enforced; only shipped port declares `SESSION_ONLY` / `durable:false`. | **Not authorized** | Effective U6 decision satisfying W-1. No code change can supply it. |
| U7 provider-side outcome mapping | IRR's U7 read/result contract is now **EFFECTIVE** at IRR `main@30091d33ecf3c094cc25d78d4b66023ab3279759`, whose §5 names the exact IPD act. IPD act rendered: `IIPS_V3_CAP02_U7_IPD_PROVIDER_OUTCOME_ACT_EFFECTIVE_2026-10-23.md`. Implemented: minimal v1 receipt, no preview fallbacks in the committed panel, refusals with no mandatory record/timestamp/zero/durability, a distinct `OUTCOME_UNKNOWN` state with no retry, receipt-driven durability, optional `getAnalytics`. Tests `T-U7-1…T-U7-7` (10 tests) pass. | **Provider side executed** (IPD capacity) | IRR must repin to the IPD commit carrying this change, then create its `PortfolioStorePort` implementation, mount the surface and produce end-to-end evidence. No end-to-end claim is made here. |
| Binding provisioning / active owner | Resolver, in-transaction revalidation and all binding failure shapes are under test. `src/persistence/provisioning.ts` remains library-only, brand-gated and unreachable from `ipc/**` and startup. No identity was provisioned and none should have been. | Implementation behaviour verified; **no provisioning performed; none authorised** | Effective Gate A′/provisioning execution decision, then a controlled operator action. Provenance: an operational identity write, not an implementation gap. |
| IRR | Read-only inspection only: `main@30091d33…` records read via the API. | Unchanged | No IRR file, branch, PR, issue, comment or tracker modified. |

## Publication reconciliation

- PR #48 merged; merged state, pre-merge checks, post-merge CI, and tracker reconciliation are tracked separately.
- PRs #49 and #50 remain merged baseline corrections as recorded in the independent reconciliation.
- PR #51 published the exact write-guard adapter amendment only; merged commit `7145a2cea0b2d7d9d8a401e57db3f9ce20a8f0a7`; pre-merge CI and executed-test-count checks passed, and post-merge CI succeeded.
- PR #52 merged as `c15135df09a4b71a20cc99623a4a322a41979903`; PR checks passed (CI run `39935747730`, executed-test-count check `120354984364`), and post-merge CI run `39935853893` succeeded.
- PR #53 merged as `04e63edd995889b170eed6660e7010dd32e15fd3` (tree `3949ab645697d8c7c26dd5e5708c43bcdcd71cec`). This pass starts from exactly that commit/tree with a clean working tree.
- This pass publishes the U7 provider/UI act and implementation, the U2 criterion-evidence and gate-status record, and this tracker reconciliation.

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
