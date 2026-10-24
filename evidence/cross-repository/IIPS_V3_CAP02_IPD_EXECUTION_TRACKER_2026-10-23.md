# CAP-02 IPD execution tracker — 2026-10-23

**Repository:** `ramkivs/iips-production-market-data`

**Session branch:** `arena/8347c24e-iips-production-market-data` (this pass; earlier passes in this file ran from `arena/f960b85e-iips-production-market-data` and `arena/7b9e7a9d-iips-production-market-data`, whose receipts are preserved below)
**Status semantics:** implementation progress only; this tracker does not accept results or promote gates.

| Workstream | Current evidence | Status | Next gate / blocker |
|---|---|---|---|
| CAP-02 prerequisite PR #48 | Merged commit `3dde26aa1cd29197c31498f380d9600aa5471222`; post-merge CI run `39932962357` passed. | Complete as repository integration fact | Tracker reconciliation remains a separate evidence fact. |
| U2 Part A identity/atomicity implementation | Effective exact manifest `IIPS_V3_CAP02_G3_AMEND_02_U2_EFFECTIVE_2026-10-23.md`; implementation merged in PR #52 as `c15135df09a4b71a20cc99623a4a322a41979903`; post-merge CI run `39935853893` succeeded. Governed raw-observation resolution, in-transaction binding revalidation, expected-revision checks, atomic import persistence, refusal/unknown-outcome states, migration and tests are on IPD main. | **Implementation complete; reconciled against gate criteria in `IIPS_V3_CAP02_U2_CRITERION_EVIDENCE_AND_GATE_STATUS_2026-10-23.md`** | Gate 4/5 progression and operational write authorization remain separate and ungranted. |
| U2 Part B provenance/schema | Effective separate schema act `IIPS_V3_CAP02_U2_PROVENANCE_SCHEMA_ACT_EFFECTIVE_2026-10-23.md`; additive migration `004_portfolio_contribution_provenance` merged in PR #52; all six fields asserted on insert and after restart; pre-existing rows keep six SQL `NULL`s; migration 001 blob `f594a182…` unchanged; ledger idempotent. | **Implemented and verified** | Retain NULL for historical facts not recorded; Gate 4/5 unchanged. |
| U2 write-port wrapper | Supplemental exact-scope authority published in PR #51; merged as `7145a2cea0b2d7d9d8a401e57db3f9ce20a8f0a7`; pre-merge checks and post-merge CI run `39934639130` succeeded. Wrapper merged in PR #52; `assertWritable()` still refuses before any transaction or callback. | Authority and implementation merged; no write enabled | Existing W-1 guard still refuses first. |
| U2 evidence gaps closed this pass | (a) governed-source rejection: a resolver built over a non-governed master now has an executed fail-closed test; (b) T-U2-5 upgraded to race a revocation against the **actual** `withBrokerImportTransaction` path, plus absent / duplicate-ACTIVE / mismatched-membership binding shapes and the caller-transaction precondition. | **Closed** | None; no defect or regression found in the merged implementation. |
| U3 / Gate 4 qualification | **PA act rendered 2026-10-23 — effective on merge (receipt below records the merge)**: `IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01` — `IIPS_V3_CAP02_GATE4_TARGET_HOST_QUALIFICATION_ACT_EFFECTIVE_2026-10-23.md` (blob `66b56fd1…`, preserved unchanged). Q1–Q12 determined; pins re-derived live (IPD `5fc74085…`/tree `7226ef00…`; IRR consumer `4740ba21…`/tree `23c5ca4a…`, with Gate 3 acceptance identity `d355d904…` retained separately); Limb A boundary reconciled with `G3-AMEND-01` §6.4(1) and merged `--test-reporter=tap` **ratified prospectively**; D-4 three-tier mechanism adopted; bounded Limb A implementation published and remote-verified by PR #68 (`a52b47b0…`). H-12 `R1` stopped at the §8 `33`-vs-`32` conflict (`PR #69`); the conflict was then fully investigated and reconciled in `IIPS_V3_CAP02_G4_H12_MEMBERSHIP_RECONCILIATION_DECISION_PROPOSED_2026-10-23.md` (`IIPS-V3-CAP02-G4-H12-MEMBERSHIP-RECONCILIATION-PROPOSAL-2026-10-23-01`, preserved as `PROPOSED — NOT EFFECTIVE`), which proved §8 double-counted `entries[23]` (`tests/g4_run_tests_summary_parsing.test.ts`, already inside `v2` `entries[0..31]` and `D-7`'s `32`), identified the secondary stale `ci.yml` parenthetical (`aeee464f…` → `4614ee0e…`), and inventoried all `7` post-`1cceacff` CAP-02 IPD files. **The Program Authority has now rendered the separate corrective amendment on Alternative A** — `IIPS-V3-CAP02-G4-AMEND-01-H12-MEMBERSHIP-2026-10-23` (`IIPS_V3_CAP02_G4_AMEND_01_H12_MEMBERSHIP_EFFECTIVE_2026-10-24.md`, blob `21a0f9eb6cd7b1bbc4849d6dfd26c6c8025d60b8`, SHA-256 `ad20b02bb1c4d27417e0b3b43f98ac1257369cfd26339ca37cda8d6f6579c045`, `43,608` B, PR #76, merge `00cad5c3c18552422f816d1b9a486d1057c78e43`) — **EFFECTIVE**: §8 now reads **32 mandatory IPD paths** (`entries[0..31]`, already containing the parser test at `entries[23]`) **+ 1 conditional helper** (`scripts/test-summary-parser.mjs`, never a mandatory core path) **+ 24 IRR = 56 core entries**, with the **7** post-G3 CAP-02 paths kept separate in `post_g3_cap02_qualified_surface_entries`, the `1,140` `dist/**` verification requirement preserved, and `ci.yml` corrected to `4614ee0e…`. Companion candidate `G4-H12-MANIFEST-v3-CANDIDATE-2026-10-23-R2` (`IIPS_V3_CAP02_G4_H12_MANIFEST_V3_RECONCILED_CANDIDATE_2026-10-23.json`) and its validation record are unchanged and remain **`NOT ADOPTED`**; Alternatives B and C were **not** selected. **H-12 remains `NOT ADOPTED`.** | **`AUTHORIZED — NOT STARTED`** | Execution blocked pending: (1) ✔ **satisfied** — express PA corrective determination on `Q-H12-1..Q-H12-4` rendered by `IIPS-V3-CAP02-G4-AMEND-01-H12-MEMBERSHIP-2026-10-23` (PR #76); (2) S1 Gate A′ identity-value act + commit & final H-12 re-pin, (3) S2 native-Windows canonical `npm test` + S1 P-1 provisioning on `desktop-no0nhtp`, (4) separate express PA H-12 adoption act → S3 host preflight. **0/11 QE executed.** |
| U4 result acceptance | Not rendered; no acceptance act exists in either repository. | **Not rendered** | Requires executed QE-1…QE-11 on the designated host at a fixed commit. Green CI, a merged PR and local fixtures are not acceptance. |
| U5 Gate 5 admission | Not granted. | **Not granted** | Depends on effective U4 acceptance and its own act; not inferable from U2 implementation or package publication. |
| U6 operational write authorization | W-1(3) and W-1(4) unmet; `evaluatePortSaveGuard()` returns hard-false with both reasons; `WRITE_NOT_AUTHORIZED` enforced before mutation; shipped UI port declares `SESSION_ONLY` / `durable:false`. Re-verified by executed tests this pass (9 + 6 tests). | **Not authorized** | Effective U6 decision satisfying W-1. No code change can supply it; provisioning does not supply it. |
| U7 provider-side outcome mapping | IRR's U7 read/result contract is now **EFFECTIVE** at IRR `main@30091d33ecf3c094cc25d78d4b66023ab3279759`, whose §5 names the exact IPD act. IPD act rendered: `IIPS_V3_CAP02_U7_IPD_PROVIDER_OUTCOME_ACT_EFFECTIVE_2026-10-23.md`. Implemented: minimal v1 receipt, no preview fallbacks in the committed panel, refusals with no mandatory record/timestamp/zero/durability, a distinct `OUTCOME_UNKNOWN` state with no retry, receipt-driven durability, optional `getAnalytics`. Tests `T-U7-1…T-U7-7` (10 tests) pass. | **Provider side executed** (IPD capacity) | IRR must repin to the IPD commit carrying this change, then create its `PortfolioStorePort` implementation, mount the surface and produce end-to-end evidence. No end-to-end claim is made here. |
| Binding provisioning / active owner | **Successor PA act rendered 2026-10-23 — effective on merge**: `IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01` — `IIPS_V3_CAP02_GATE_A_PRIME_SUCCESSOR_PROVISIONING_ACT_EFFECTIVE_2026-10-23.md`. Successor basis selected: IPD `main@5fc74085…`/tree `7226ef00…`; the 2026-10-17 act's **execution basis** superseded (its record preserved byte-identically, `c04f8a30…`); bounded implementation authority granted for exactly 4 paths (entrypoint, read-only validator, new test, bounded static-regression addition); fail-closed/duplicate/no-unintended-mutation rules, P-1 desktop procedure and V-A2-1…V-A2-8 fixed. **Identity values `principal_label`/`tenantId`/`canonicalOwnerId` remain UNRESOLVED** — no authoritative IPD-owned source; IRR's `owner-7f3a91c2`/`irr-domain-4b82d6e1` may not be copied. The entrypoint and validator are now **published and remote-verified by PR #68**; execute remains inert and no provisioning occurred. | Basis + entrypoint authority **EFFECTIVE on merge**; implementation **PUBLISHED/REMOTE-VERIFIED**; provisioning **NOT AUTHORIZED** | Separate PA identity-value determination (§4 of the act), then the single P-1 execution on `desktop-no0nhtp`. |
| IRR | Read-only inspection re-verified live at `main@4740ba21ea6103f1a7ebc9768269ae7795920698`, tree `23c5ca4ae1bfd481bcfc911c70b9e7dc090e1162` (historical Gate 3 code pin `d355d904aa52988e70a98324714886f6a1c0ea2a`, tree `e631cf3287fc19a2d1c8f73a0eb5f8d640370e27`): `24/24` mandatory consumer entries and `3/3` IRR criteria entries byte-verified; prior `main@3f628cbc…` observation preserved. | Unchanged | No IRR file, branch, PR, issue, comment or tracker modified. |
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
Gate 4 §8 H-12 membership: amended — 32 mandatory IPD paths + 1 conditional helper + 24 IRR = 56 core entries
  (IIPS-V3-CAP02-G4-AMEND-01-H12-MEMBERSHIP-2026-10-23; effective on publication, PR #76) — no gate moved
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
- **Detailed evidence and handoff:** `IIPS_V3_CAP02_B1R_PACKAGE_AND_GATE4_PREPARATION_2026-10-23.md`. The source/API assessment is against IPD `main@24e62c80…`; PR #56 then moved `main` to the documentation-only successor `70323867619d4270bc94cad6ae8d622c0579eb4e` (tree `32890138c6c11ab91ec75c6f4d72f4c26e093b49`). IRR may inspect that latest verified head, but must not pin it for B-1R until the effective IPD package/API prerequisite is met and remotely verified.

### Publication receipt — PR #56 (verified against IPD `main`)

```text
IPD main before:    24e62c80f37e8a55c34747581a68209c67b775a3
PR #56 head:        07cd274ba2b6836888c81c3c1396aeaebe9f1127
PR checks:          CI run 39946635397 SUCCESS; executed-test-count SUCCESS — 848 executed,
                    847 passed, 0 failed
PR #56 merge:       MERGED 2026-10-23T11:32:19Z
IPD main after:     70323867619d4270bc94cad6ae8d622c0579eb4e
root tree:          32890138c6c11ab91ec75c6f4d72f4c26e093b49
changed paths:      exactly 2 documentation paths (the preparation report and this tracker)
remote read-back:   both file blobs match the committed contents
post-merge CI:      run 39946778715 SUCCESS; executed-test-count check 120391517271
                    reports 848 executed, 847 passed, 0 failed
package/source diff: none from evaluated baseline 24e62c80…
```

The publication receipt verifies documentation and current-main state only. It does not resolve B-1R, qualify Gate 4, render U4, grant U5/U6, provision identity, enable writes or establish E2E.

## CAP-02 B-1R IPD compatibility implementation candidate — 2026-10-23

- **Authority:** `IIPS_V3_CAP02_B1R_IPD_COMPATIBILITY_IMPLEMENTATION_ACT_EFFECTIVE_2026-10-23.md` is the narrow IPD-owned act for the exact PIT/D114/package/U7 manifest. Increment A was not stretched; the IRR composition act was used only as read-only consumer evidence.
- **Baseline:** `main@b3428f3f431eceb1dcde60e3b120bbd1888622bb`; read-only IRR consumer source `98cd56a9a568f431ea31d5515e515a1b6cbb91ba`.
- **Implementation state:** series-qualified identity propagation, fail-closed PIT keys/queries, read-only `PitReadService`, admitted-key enumeration, frozen offline D114 population, `./pit` and `./d114-non-production` exports, and the three U7 type exports/two refusal codes are implemented on the session branch. No production or privileged capability was added.
- **Local qualification:** typecheck and full build PASS; guarded full suite **875 executed / 874 passed / 0 failed / 1 skipped**; focused compatibility suite 99/99; `npm pack --dry-run` and `git diff --check` PASS.
- **Packed consumer:** the installed tarball passed standalone runtime/strict declaration checks and browser closure scanning. All five verbatim IRR importer files at `98cd56a9…` compiled against the pack; the real IRR production composition/adapter executed with 8 fixture records and 20 combined records. The two IRR route test files were compile-checked only, not run as E2E.
- **Evidence:** `IIPS_V3_CAP02_B1R_IPD_COMPATIBILITY_EXECUTION_EVIDENCE_2026-10-23.md` and `IIPS_V3_CAP02_B1R_IPD_COMPATIBILITY_FINAL_REPORT_2026-10-23.md`.
- **Publication status:** candidate only at this entry; no local commit, open PR or merge is called published. PR/check/merge/remote receipt is to be appended after verification.
- **Gate state:** unchanged. This is not Gate 4, U4/U5/U6, Gate A′ provisioning, durability, operational-write, IRR-repin or cross-repository E2E evidence. `WRITE_NOT_AUTHORIZED`, `SESSION_ONLY` and `durable:false` remain operative.

### Publication receipt — CAP-02 B-1R IPD compatibility, PR #58

```text
PR head:              b613d4f984fa1cc72cae9b6dfeee6f4bc393f06a
PR checks:            CI 39950883166 SUCCESS; executed-test-count 120405152716 SUCCESS
PR merge:             MERGED 2026-10-23T12:08:01Z
IPD main after:       16459f465024ca1eb4da4953d8e178eba4269f8e
Root tree:            0c088282d69a03eced2f33533b19ff647179145a (same as PR-head tree)
Remote read-back:     27/27 changed-path blobs match; PR head is an ancestor of main
Merged-commit pack:   PASS from detached 16459f4…; 121 files; all three subpaths/declarations
                      and browser closure verified; five actual IRR importers compiled;
                      real IRR composition/adapter runtime PASS (8 fixture / 20 combined)
Post-merge CI:        push run 39951277310 SUCCESS; consumer step SUCCESS
                      executed-test-count 120406562857 SUCCESS — 875 executed, 874 passed, 0 failed
```

**CAP-02 B-1R IPD package/API prerequisite: PUBLISHED AND REMOTE-VERIFIED on IPD `main`.** The separate
IRR repin remains unexecuted and IRR remains read-only. This receipt does not qualify Gate 4, render U4,
grant U5/U6, provision Gate A′, enable operational/durable writes, or establish IRR/production E2E.

## CAP-02 successor Gate A′, U3/Gate 4 act and QE status — one-pass execution (2026-10-23, second pass)

**Scope of this pass.** Verified the two remote baselines, every relevant effective record, the current
provisioning/write-guard/IPC implementation, target-host availability and operator-store availability;
determined whether the successor Gate A′ act and the U3/Gate 4 qualification act can be rendered under
existing authority; and produced decision-ready records for each, without crossing any authority
boundary. **No implementation, no provisioning, no QE execution, no gate movement.**

**Verified baselines.** IPD `main@2d9130e76bb0dc89daeefabaf297e27bdaa84250`, tree
`4658699180ef161aae3c1b33d3946e918d6fb9b2` (matches the reported authoritative tip; zero tracked
working-tree changes) · read-only IRR `main@409604e4dfefbe6aa966113f52af607995b5f297`, tree
`297ce6aebd9a4d93b8e3fc572720aa18a8e682ca` (matches the reported tip).

**Substantive findings (all executed, not inferred).**

1. **The 2026-10-17 Gate A′ act cannot be executed on `main`.** Its own D-A′-1 pins the designated ref
   `gate-a/local-principal-enablement-2026-10-16@2ded0e98` — still present and byte-matching — but three
   of its four pinned paths (`src/gate_a/provision.ts`, `src/gate_a/validate.ts`,
   `src/app_identity/local_principal.ts`) **do not exist on `main`**, and migration `003` differs
   (`9ba884ac` vs `32b125bf`). D-A′-8/§4.9 make that a hard stop.
2. **The two schemas are mutually incompatible, measured.** Three tables the old act provisions
   (`application_users`, `tenant_memberships`, `local_principal_audit_events`) are absent from `main`;
   applying `main`'s migration set over a Gate A′-basis store fails closed with
   `table portfolio_revisions already exists`. A store provisioned on the old basis could not be opened
   by the build that Gate 4 must qualify.
3. **No provisioning entrypoint exists on `main`.** The only mutating function is gated on a
   module-private symbol; four attemptable authorization shapes were refused before any SQL, with zero
   row and zero audit delta, and no `src/` module imports it. Any successor act therefore needs a
   **paired implementation authority**, not only provisioning authority.
4. **The U3/Gate 4 qualification act is already written and is `PROPOSED — NOT EFFECTIVE`** (IRR blob
   `c02093e0…`). Its §9 requires an express PA determination assigning an Act ID and resolving Q1–Q12;
   publication and merge confer no effectiveness; and its publication locus (IRR) is read-only to this
   pass. It is additionally **29 commits stale** (`1cceacff…` vs `2d9130e7…`; 54 files), including the
   identity resolver, transaction/revision logic, binding revalidation, provenance migration and six
   test files that the matrix measures. Silent re-pinning is prohibited by its own §14.5.
5. **Limb A (Windows runner parser) is unreconciled.** The only delta on `scripts/run-tests.mjs` between
   the Gate 3-accepted baseline (`fe1ab1a3…`) and `main` (`4a90d935…`) is `'--test-reporter=tap'`
   (commit `196a0e88…`, PR #45) — a runner change that no located effective IPD act names, while the
   Gate 3 act excludes runner changes and `G3-AMEND-01` §6.4(1) defers the repair to a Gate 4 act.
   Measured: the parser is **CRLF-safe** and **fails only on the spec reporter's `ℹ` marker**; the
   mandatory `tests/g4_run_tests_summary_parsing.test.ts` is still absent. Limb A must be re-scoped by
   the PA before the Gate 4 act can take effect.
6. **QE-1 … QE-11: 0 of 11 executed.** Every item is BLOCKED for prerequisite, not outcome, reasons.
   The host `desktop-no0nhtp` is unreachable, no store path or IPC endpoint exists, Gate A′ is
   unprovisioned and no effective execution act exists. Local suites remain implementation evidence only.

**Records published by this pass.** `IIPS_V3_CAP02_SUCCESSOR_GATE_A_PRIME_PROVISIONING_ACT_PROPOSED_2026-10-23.md`
(decision-ready successor act, D-A2-1…D-A2-8), `IIPS_V3_CAP02_U3_GATE4_ACT_RECONCILIATION_2026-10-23.md`,
`IIPS_V3_CAP02_QE1_QE11_EXECUTION_STATUS_MATRIX_2026-10-23.md`,
`IIPS_V3_CAP02_ONE_PASS_FINAL_REPORT_2026-10-23.md`, and raw evidence under
`evidence/cross-repository/cap02_2026-10-23_authority_and_gate_evidence/`.

**Missing acts — owner and closure evidence.**

| Missing act | Owner | Closure evidence |
|---|---|---|
| Successor Gate A′ act at a named current commit **+** bounded implementation authority for its provisioning entrypoint | PA (Ramki) | rendered act, published + remotely verified; then host receipt with V-A2-1…V-A2-8 |
| Gate 4 qualification determination (Q1–Q12, Act ID), re-pinned basis, Limb A reconciliation, H-12 adoption | PA (Ramki) | effective act + adopted H-12 at the final commit |
| QE-1…QE-11 execution | operator of `desktop-no0nhtp` | host transcript per `IIPS_V3_CAP02_QE1_QE11_EXECUTION_STATUS_MATRIX_2026-10-23.md` |
| U4 result acceptance | PA | separate acceptance act referencing host evidence |
| U5 admission / U6 write authorization | PA | separate acts satisfying W-1; no code change supplies them |

**Local validation of this pass (Linux, Node v22.22.3).** `npx tsc --noEmit` exit 0 · `npm run build`
exit 0 · `npm test` exit 0, **875 executed / 874 passed / 0 failed / 1 skipped** · focused:
`g3_startup_validation` 20, `q1_ownership_source_readiness` 4, `g3_write_gate` 9,
`g3_durability_vocabulary` 6, `g3_binding_resolution` 13, `q1_broker_import_durability` 18,
`g3_caller_authority` 103 — all pass · `git diff --check` clean. These are **not** Gate 4 qualification,
result acceptance, admission or write authorization.

**Non-negotiable gate state after this pass.**

```text
WRITE_NOT_AUTHORIZED:              preserved and enforced before any transaction or callback
SESSION_ONLY / durable:false:      preserved; durable:true still unreachable from the shipped adapter
Gate A′:                           APPROVED (2026-10-17, superseded basis) / NOT EXECUTED — successor PROPOSED
Gate A′ provisioning:              not performed, not authorised, no store, no row
Gate 4 / U3:                       NOT AUTHORIZED / NOT STARTED — act PROPOSED, basis 29 commits stale
QE-1 … QE-11:                      0 executed, 0 pass, 0 fail — all BLOCKED
U4 result acceptance:              not rendered
Gate 5 / U5:                       not granted
U6 operational writes:             denied
IRR:                               read-only; no file, branch, PR, issue, comment or tracker modified
```

### Publication receipt — PR #60 (verified against IPD `main`)

```text
IPD main before:    2d9130e76bb0dc89daeefabaf297e27bdaa84250  tree 4658699180ef161aae3c1b33d3946e918d6fb9b2
PR #60 head:        448b097c299278bb4b165c44ad2a5eb397ba5b77  tree 384f1cb10023565551ff4485ee6c58b102427e91
PR checks:          CI run 39964047320 SUCCESS; executed-test-count SUCCESS — 875 executed, 0 failed
PR #60 merge:       MERGED 2026-10-23T13:48:16Z
IPD main after:     e2f332638bbf6cf6e848cc85fa74994141deb50f  tree 384f1cb10023565551ff4485ee6c58b102427e91
ancestry:           448b097c… is an ancestor of origin/main; merge tree == PR-head tree
changed paths:      13 — 4 new records, this tracker, and 8 raw-evidence artifacts
remote read-back:   5/5 record blobs byte-identical at the merge commit
post-merge CI:      push run 39964246325 SUCCESS; 875 executed / 0 failed at e2f33263…
```

This receipt verifies documentation and remote state only. It does not qualify Gate 4, render U4, grant
U5/U6, provision Gate A′, enable operational writes, or change any gate status above.

## CAP-02 successor execution — standing-approval reconciliation and desktop-evidence preparation (2026-10-23, third pass)

Record: `IIPS_V3_CAP02_SUCCESSOR_EXECUTION_AUTHORITY_RECONCILIATION_AND_DESKTOP_EVIDENCE_2026-10-23.md`
(`IIPS-V3-CAP02-SUCCESSOR-EXECUTION-2026-10-23-01`); evidence:
`cap02_2026-10-23_successor_execution_evidence/`. Baseline IPD `main@bb4101b…` (tree `b02ef11c…`),
IRR read-only `409604e4…`. The global standing approval (F-3 §1.2) was reconciled clause-by-clause
**before** any item was treated as PA-blocked: all covered work (investigation, probes, tests,
documentation, publication) was executed without further approval. The provisioning entrypoint,
successor Gate A′ rendering, Limb A, and Gate 4 effectiveness remain stopped only by named
**effective** reservations (G3-AMEND-01 §6.4(1); Q1 act; Gate E §5; F-3 no-value-selection + DEC-06
R-2) — the prior pass's reliance on *proposed* Gate 4 §14.6 is expressly not carried forward.
Fresh evidence at `bb4101b…`: Gate A′ probe 4/4 refused, 0 mutations; parser probe (TAP+CRLF safe,
spec fail-closed); Gate 4 pin now 33 commits stale (no new source drift); `npm test` 875/874/0/1.
Added: re-pinned Q1–Q12 determination sheet and the exact `desktop-no0nhtp` operator runbook
(host again unreachable; QE remains 0 executed / 11 BLOCKED). Gate state unchanged:
Gate A′ successor PROPOSED, Gate 4 NOT AUTHORIZED, U4 not rendered, U5 not granted, U6 denied;
`WRITE_NOT_AUTHORIZED` / `SESSION_ONLY` / `durable:false` preserved. No `src/`, `tests/`,
`scripts/`, CI, manifest or IRR change.

### Publication receipt — PR #62 (verified against IPD `main`)

```text
IPD main before:    bb4101b5d16546a1327227258a947e9cbe463900  tree b02ef11c61bb87e64c3effb5d252566f43ef26c5
PR #62 head:        0548b67 (arena/f9358f79-iips-production-market-data)
PR #62 checks:      run 39966897587 "typecheck · build · test" SUCCESS; "executed test count" SUCCESS
PR #62 merge:       MERGED 2026-10-23T14:08:35Z
IPD main after:     a3ababf183b118a7c5dd9ab31cd6dddc02d1905d  tree 29bc721fceab106bf7f37d0aa8fb17e4d044f958
changed paths:      6 — the successor-execution record, this tracker, 4 raw-evidence artifacts (compare-verified)
remote read-back:   4/4 sampled blobs byte-identical at the merge commit (record, tracker, probe JSON, validation summary)
post-merge CI:      push run 39967117152 SUCCESS at a3ababf1…; "executed test count" SUCCESS
```

This receipt verifies documentation and remote state only. It does not provision Gate A′, qualify
Gate 4, render U4, grant U5/U6, enable operational writes, or change any gate status.

## CAP-02 — Two decisions rendered (2026-10-23, fourth pass): Gate A′ successor and Gate 4

**Baseline.** IPD `main@5fc74085ade980846ff4a07b36415b6d49446486`, tree
`7226ef0033b3a7049169d8fcf9bcbc9908e2590b` (live `ls-remote` = fetched tip; PRs #62 and #63
reconciled — merged `a3ababf1…` and `ddaaef98…`; PRs #64–#66 landed **after** the first draft and are
**documentation/evidence only** — 0 `src`/`tests`/`scripts`/`frontend`/`package.json`/`tsconfig*`/`vite.config.ts`/`.github` paths — so the acts were **re-pinned to the current tip**). Read-only IRR
`main@4740ba21ea6103f1a7ebc9768269ae7795920698`, tree `23c5ca4ae1bfd481bcfc911c70b9e7dc090e1162`. Local
validation at the IPD basis: `npm ci` 0 · `npx tsc --noEmit` 0 · `npm run build` 0 · `npm test` 0 —
**875 executed / 874 passed / 0 failed / 1 skipped** (repository-level evidence only).

### Decision 1 — Gate A′ successor — **RENDERED (basis + entrypoint authority); effective on merge**

| Item | Result |
|---|---|
| Act | `IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01` |
| Successor basis | IPD `5fc74085…` / tree `7226ef00…` (re-pinned from `ddaaef98…` after the documentation-only PRs #64–#66); 12 designated blobs recorded in the act and unchanged at the new tip |
| Prior act | `IIPS-V3-G2-IPD-GATE-A-PRIME-PA-DECISION-2026-10-17-01` (`c04f8a30…`) **preserved byte-identically**; superseded **as to execution basis only**; still `APPROVED / NOT EXECUTED` |
| Bounded implementation authority | exactly 4 paths: `src/persistence/gateAPrimeProvisioning.ts` (new), `src/persistence/gateAPrimeValidation.ts` (new), `tests/g3_gate_a_prime_successor_provisioning.test.ts` (new), `tests/g3_startup_validation.test.ts` (bounded addition). No `package.json`/tsconfig/lockfile/CI/migration/existing-`src` change |
| Identity values | **`principal_label` — UNRESOLVED · `tenantId` — UNRESOLVED · `canonicalOwnerId` — UNRESOLVED.** No authoritative IPD-owned source located; not derivable; IRR's F-3 pair is another domain's identifiers and F-3 records "value-selection authority NOT EXERCISED" |
| Provisioning execution | **NOT AUTHORIZED** — the entrypoint must ship inert (compiled constants `null`, `IDENTITY_VALUES_UNRESOLVED`, tested by T-4) |
| Provisioned in this pass | **NO** — no store, no row, no path selected |
| Effectiveness | On merge to IPD `main` with green CI and remote read-back. This tracker section is committed **with** the acts; its publication receipt is appended once the merge exists |

### Decision 2 — Gate 4 — **RENDERED; effective on merge · Gate 4 `AUTHORIZED — NOT STARTED` on effectiveness**

| Item | Result |
|---|---|
| Act | `IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01` (the `…-2026-10-22-01` candidate was never assigned and is not adopted) |
| Proposal disposition | `IIPS_v3.0_G4_TARGET_HOST_QUALIFICATION_AUTHORITY_ACT_PROPOSED_2026-10-22.md` (`c02093e0…`) **adopted with the six recorded changes**, preserved unmodified |
| Pins | IPD base `5fc74085…`/`7226ef00…` (re-pinned from `ddaaef98…`; documentation-only drift, 0 source paths); future IPD QE pin = final Limb A merge commit, designated after merge/CI/read-back and before preflight; IRR consumer pin `4740ba21…`/`23c5ca4a…`; IRR Gate 3 acceptance identity `d355d904…`/`e631cf32…` retained separately |
| Q3 / `G3-AMEND-01` §6.4(1) | This act **is** the deferred separate Gate 4 PA act. Limb A = `scripts/run-tests.mjs` summary-parsing region + mandatory `tests/g4_run_tests_summary_parsing.test.ts` + conditional `scripts/test-summary-parser.mjs`. The merged `--test-reporter=tap` line (blob `4a90d935…`) is **ratified prospectively**, not retroactively and not as proof |
| Q4 | Three-tier fence-preserving mechanism adopted; PASS requires executed host evidence in a tier that can reach the criterion; structurally unreachable criteria are **limitation findings**, never passes |
| Q5 | S0–S6 + S2a adopted. **Stopped at S1**: Gate A′ execution not performed |
| Q6 | QE-11 execution grant re-issued on current commits; acceptance separate; **G-12 reading determined** (historical Gate V + D-GC-B waivers carry forward for the records-only Q1 limb, as waivers, not proof) |
| Q7 | H-12 v2 **not adopted**; replacement (33 mandatory IPD paths + conditional helper + 10 anchors + IRR/criteria/runtime/deposit sets) regenerated and fully validated at the final Limb A commit, then adopted by a **separate express PA act** |
| Q8–Q12 | Evidence deposit in IPD `cap02_gate4_qe_<date>_<run-id>/` with byte hashes and independent read-back; five failure classes and disposable-copy fixture controls; measurement-only durability with the fixed non-claim sentence; executor Ramki on `desktop-no0nhtp`, Arena preparation/verification only; registration here now, IRR registration deferred (read-only) and identifiers to be re-censused |
| QE executed | **0 of 11 — all BLOCKED** (unchanged) |

### What did **not** change

`WRITE_NOT_AUTHORIZED` before any transaction or callback · `SESSION_ONLY` / `durable:false` ·
Gate A′ **not executed**, no store, no binding, no membership, no audit row · Gate 4 **not started** ·
U4 result acceptance **not rendered** · Gate 5 **not granted** · U6 writes **denied** · all twelve IRR
`/api/user-portfolios*` route-method pairs remain `503` · IRR read-only (no file, branch, PR, issue,
comment or tracker modified) · no `src/`, `tests/`, `scripts/`, CI, manifest, schema or migration change
in this pass.

### Remaining genuine prerequisites (both decisions)

1. **Gate A′ identity values** — a separate PA value-selection determination naming `principal_label`,
   `tenantId`, `canonicalOwnerId` verbatim. Nothing else can unblock provisioning.
2. **Limb A implementation** — authorized, not started (entrypoint of Gate A′ is separately authorized
   and also not started).
3. **H-12 v3** — regeneration + full validation + separate express adoption at the final Limb A commit.
4. **Designated host availability** — `desktop-no0nhtp` unreachable from this environment; Node
   `>=22.13.0 <23` unverified there.
5. **Downstream acts** — Gate C acceptance, Gate 4 result acceptance, Gate 5 admission, U6 write
   authorization: none is granted, sequenced or implied here.

## CAP-02 PR #67 post-merge verification — independent remote read-back (2026-10-23)

This section is the post-merge publication receipt required by both effective acts. It was measured
from a fresh `git fetch --prune origin main` and `gh pr view/checks`, not copied from the pre-merge
candidate or from the owner's merge notice.

| Item | Independently verified value |
|---|---|
| Authoritative repository / ref | `ramkivs/iips-production-market-data` / `refs/heads/main` |
| Remote `main` commit / root tree | `7f64d37afe8e70adec9c05d80aa74aca5498a194` / `04f53910623da4024e28bf4bd307df3f5c6e8349` |
| PR #67 | `MERGED`; merge commit `7f64d37afe8e70adec9c05d80aa74aca5498a194`; merged `2026-10-23T16:22:25Z` |
| PR candidate / parent / tree | candidate `33bf35b48ea1a717c3e05e242abaee1e2a6cc4c7`; parent `5fc74085ade980846ff4a07b36415b6d49446486`; tree `04f53910623da4024e28bf4bd307df3f5c6e8349` |
| Merge relationship | The candidate is merge parent 2 of `7f64d37…`; candidate tree equals merge tree; `git diff --name-only 33bf35b… 7f64d37…` is empty. The merge's first parent is `5fc74085…`. |
| Changed paths | Exactly 3 relative to first parent: the two act files below were added and this tracker was modified. |
| CI | `typecheck · build · test`: `SUCCESS` (run `39985596870`, job `120523817486`); `executed test count`: `SUCCESS` (run/check `120524376556`). `gh pr checks 67` returned both checks as pass. |
| GitHub publication coordinates | https://github.com/ramkivs/iips-production-market-data/pull/67 |

### Published artifact identities and content integrity

All three paths were resolved directly as `origin/main:<path>` and read back from the fetched Git
object database. Blob SHA-1 is the Git identity; SHA-256 is over the exact raw blob bytes (no newline
normalization).

| Exact authoritative path | Git blob ID | Bytes | Lines | Raw SHA-256 |
|---|---|---:|---:|---|
| `evidence/cross-repository/IIPS_V3_CAP02_GATE4_TARGET_HOST_QUALIFICATION_ACT_EFFECTIVE_2026-10-23.md` | `66b56fd1584890525a7250aadd7da449def621e5` | 34316 | 420 | `c8c1378622657a320f14f34c008bb27fde2acaf57acc9a73a3489ea6be57c7b6` |
| `evidence/cross-repository/IIPS_V3_CAP02_GATE_A_PRIME_SUCCESSOR_PROVISIONING_ACT_EFFECTIVE_2026-10-23.md` | `528de6aeddbc8e5f3191be8792f3937d77de4037` | 29856 | 354 | `df8e44f704814e2321b5134206b04f25097830bdc5dd53c4d907d1256e4c788d` |
| `evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md` | `14658b9353d7154dcaa08ac1cea9e0bd81b1a2c5` | 35139 | 347 | `47450b6c4f87d1a2eab455258c48229f1c11d5f6123bf958fc1688d4a3bf9810` |

The candidate, merge commit and fetched remote tree have no discrepancy. The only pre-existing
tracker discrepancy was temporal: its fourth-pass rows still described effectiveness as conditional
on the merge and explicitly deferred the receipt. This section closes that receipt without editing
either act, as required by the acts' non-edit-after-publication rule.

### Effectiveness confirmation — decisions remain bounded

- **Gate A′ successor act:** **EFFECTIVE** under §13: exact content is in the merged `main` tree,
  both PR checks passed, and the three published blobs were read back. This makes the successor basis
  and the four-path bounded implementation authority effective. It does **not** select
  `principal_label`, `tenantId` or `canonicalOwnerId`; all three remain **UNRESOLVED**. Provisioning
  execution is **NOT AUTHORIZED**, the host/P-1 procedure is unmet, and no store, row or identity value
  was created by publication.
- **Gate 4 qualification act:** **EFFECTIVE** under §15: exact content is in the merged `main` tree,
  both PR checks passed, and read-back succeeded. Gate 4 is **AUTHORIZED — NOT STARTED**; QE-1…QE-11
  remain `0/11 executed`, and no result was accepted, no H-12 v3 was adopted, no host was contacted,
  no Gate C/4 result acceptance occurred, and no W-1/U6 fence changed.

## CAP-02 authorized implementation continuation — candidate state after the effective acts

The following work is authorized by the effective four-path Gate A′ act and Gate 4 §4.2 only. It is
recorded as a candidate until its own publication receipt exists; it does not expand either act's
file set.

| Authorized slice | Exact paths | Candidate result |
|---|---|---|
| Gate A′ bounded entrypoint/validator | `src/persistence/gateAPrimeProvisioning.ts`; `src/persistence/gateAPrimeValidation.ts`; `tests/g3_gate_a_prime_successor_provisioning.test.ts`; bounded addition to `tests/g3_startup_validation.test.ts` | Implemented on this session branch. Execute remains inert because the three compiled constants are `null`, with `IDENTITY_VALUES_UNRESOLVED` and no store creation. |
| Gate 4 Limb A | Summary-parsing region of `scripts/run-tests.mjs`; mandatory `tests/g4_run_tests_summary_parsing.test.ts`; conditional pure helper `scripts/test-summary-parser.mjs` (present) | Implemented on this session branch. TAP/spec summaries and LF/CRLF are covered; stale/missing compiled counterparts, malformed/missing summaries and non-zero child exits remain fail-closed. |

### Candidate validation evidence

- `npm run build` — exit 0 (TypeScript, Vite and both package builds).
- `npm test` — exit 0: **892 executed / 891 passed / 0 failed / 1 skipped**; the guarded runner
  reported the anchored summary and did not execute an empty suite.
- Focused tests: Gate A′ successor **7/7**; Gate 4 summary matrix **10/10**; `git diff --check` —
  exit 0.
- No package, lockfile, migration, existing `src` module, CI, runtime, IPC, frontend or IRR path
  was changed. No host operation, provisioning attempt, QE execution or result acceptance was made.

### Next authorized work and entry conditions

1. Publish this exact bounded implementation through a PR with green CI, merge it to IPD `main`,
   independently fetch/read back the final commit/tree/blobs, and run the native-Windows canonical
   `npm test` at that final Limb A commit when `desktop-no0nhtp` is available. The IPD QE pin is that
   final Limb A merge commit; it must not be guessed.
2. At that exact final commit, regenerate and fully validate H-12 v3 (33 mandatory IPD paths, the
   conditional helper, 10 anchors, criteria, IRR consumer set, runtime and evidence-deposit sets).
   H-12 adoption is a **separate express PA act**; this record does not adopt it.
3. Only after Gate A′ identity values are named by a separate PA determination, H-12 is separately
   adopted, and the designated Windows preflight succeeds may S1/S3/S4 proceed. The current Linux
   sandbox cannot contact `desktop-no0nhtp`, and it must not claim native-Windows evidence.

**Durable state at this receipt:** the verified published decisions are at IPD `main@7f64d37…`,
root tree `04f53910…`; the candidate implementation is on session branch
`arena/7b9e7a9d-iips-production-market-data` and is not yet a remote-main result until its own
publication receipt is appended.

## CAP-02 PR #68 publication and remote verification (2026-10-23)

PR #68 carried out the next authorized implementation slice; it is not a replay of PR #67. The
publication was independently reconciled after merge.

| Item | Independently verified value |
|---|---|
| PR #68 | `MERGED` at `2026-10-23T16:34:51Z`; URL https://github.com/ramkivs/iips-production-market-data/pull/68 |
| PR head / candidate tree | `c62dee81748aaed6416956b2e323ce77d1ff1f3c` / `1467802e9b9497f84acb1bc6bb3ddd386792499a` |
| Merge commit / root tree | `a52b47b0f8ca448c8c9c195cf261e83ecf813ba3` / `1467802e9b9497f84acb1bc6bb3ddd386792499a` |
| Merge parents | first `7f64d37afe8e70adec9c05d80aa74aca5498a194`; second `c62dee81748aaed6416956b2e323ce77d1ff1f3c` |
| Tree/ancestry reconciliation | PR head is merge parent 2; candidate tree equals merge tree; `git diff --name-only c62dee8… a52b47b…` is empty. |
| PR #68 changes | 8 files, 1223 additions, 14 deletions; exactly the two permitted slices plus this tracker. |
| PR #68 CI | `typecheck · build · test`: `SUCCESS`, PR run `39987751219`, job `120531246174`; `executed test count`: `SUCCESS`, check `120531784013`. |
| Post-merge `main` CI | run `39987949877` (`push`, head `a52b47b…`) **SUCCESS**; job `120531926834` and executed-count job `120532505749` both **SUCCESS**. |
| Authoritative remote ref | `refs/heads/main` now `a52b47b0f8ca448c8c9c195cf261e83ecf813ba3`, tree `1467802e9b9497f84acb1bc6bb3ddd386792499a`. |

### Final remote-read-back identities for this pass

The two acts remain byte-identical to PR #67. Their final remote-main identities, plus the reconciled
tracker and implementation identities, are:

| Exact `origin/main` path | Git blob ID | Bytes | Lines | Raw SHA-256 |
|---|---|---:|---:|---|
| `evidence/cross-repository/IIPS_V3_CAP02_GATE4_TARGET_HOST_QUALIFICATION_ACT_EFFECTIVE_2026-10-23.md` | `66b56fd1584890525a7250aadd7da449def621e5` | 34316 | 420 | `c8c1378622657a320f14f34c008bb27fde2acaf57acc9a73a3489ea6be57c7b6` |
| `evidence/cross-repository/IIPS_V3_CAP02_GATE_A_PRIME_SUCCESSOR_PROVISIONING_ACT_EFFECTIVE_2026-10-23.md` | `528de6aeddbc8e5f3191be8792f3937d77de4037` | 29856 | 354 | `df8e44f704814e2321b5134206b04f25097830bdc5dd53c4d907d1256e4c788d` |
| `evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md` | `973e91ddfd9e98a2479bc526dd22ef8c36f93d73` | 42087 | 433 | `f100735bea98e148c5dcd0588b66d834c71d431232f7ce682f599d05c6d7b6da` |
| `scripts/run-tests.mjs` | `05a0ea56f62d4f3b614480858c968a728bc24ca4` | 5015 | 129 | `f467445321ba64162992ec6a4938b48495d6922205582d80cd50c96fe6a0eefd` |
| `scripts/test-summary-parser.mjs` | `15c849fa739765af501182919748e4610acc4157` | 682 | 19 | `a88e2289c0f052198af500de88ccac516444fb20f7901d472f7933dcdb37ef13` |
| `src/persistence/gateAPrimeProvisioning.ts` | `1fe6e6b3e87a4fbe082271be150c517e5e445423` | 14107 | 402 | `7f717b8302f0682e7d5c207667ad1540178eefceb0822882cb9113b2fc429f6e` |
| `src/persistence/gateAPrimeValidation.ts` | `be9ce404fd8077b9f57a71a846636d4fdc3e1769` | 14469 | 382 | `92416eba01b2f44cfa26fb4352b77ca8478f706483a2c609dd3a6f1f98881a17` |
| `tests/g3_gate_a_prime_successor_provisioning.test.ts` | `c13a52ec34e81e0a14f5f821b7d1a1a9d5670694` | 7375 | 191 | `4ec84a9b9a7ea1ac562c21b904719eeed746d9a18648f989d8289abb25126498` |
| `tests/g3_startup_validation.test.ts` | `edd0305e3e5891020b2b045ab2cf082cd6cf788f` | 15072 | 381 | `d6bfd728c871267732bfc31f307b3fc1bed90b5b09c0bc88ad3999b05548f6e4` |
| `tests/g4_run_tests_summary_parsing.test.ts` | `49e901b6ca957a5cc705b42e96cdeaf0365cfbc9` | 5627 | 125 | `7907087f13053e232e1ae537d6b75de5f5b280728ce9af1e210041c4660b633d` |

The remote tree and PR-head tree are identical. No file outside the explicitly authorized Gate A′ and
Gate 4 path sets (plus this tracker) changed; no IRR publication or mutation was performed.

### Resulting state and handover after PR #68

- Gate A′ bounded entrypoint/validator authority is now **published and remote-verified**. Its execute
  path is intentionally inert: `principal_label`, `tenantId` and `canonicalOwnerId` compile as `null`,
  so it refuses with `IDENTITY_VALUES_UNRESOLVED`; no provisioning, store, row or host execution occurred.
- Gate 4 Limb A is **published and remote-verified**. The final IPD QE execution pin is now the exact
  `a52b47b0f8ca448c8c9c195cf261e83ecf813ba3` / tree
  `1467802e9b9497f84acb1bc6bb3ddd386792499a` merge result, subject to the act's designation/read-back
  rule. This publication does not start Gate 4 or execute QE.
- The effective Gate 4 prerequisites remain: separate H-12 v3 regeneration/full validation and
  express PA adoption; separate Gate A′ identity-value determination; then target-host preflight on
  `desktop-no0nhtp`. The sandbox cannot supply native-Windows evidence or select identity values.

**Durable handover state after this publication:** authoritative IPD `main` is
`a52b47b0f8ca448c8c9c195cf261e83ecf813ba3`, root tree `1467802e9b9497f84acb1bc6bb3ddd386792499a`.
The next concrete action is the documented H-12 membership reconciliation below; no QE or provisioning
may start before that decision, separate Gate A′ identity selection, and the named host prerequisites.

## CAP-02 H-12 v3 preparation — content verified, adoption stopped at a material membership conflict

Prepared in IPD (IRR remained read-only):

- Machine-readable candidate: `evidence/cross-repository/IIPS_V3_CAP02_G4_H12_MANIFEST_V3_CANDIDATE_2026-10-23.json`, raw SHA-256 `344d1bd19c35231cc9d243c58f7e1ce22ccb7bfeda541966a71c1355a17d0594`.
- Validation/stop record: `evidence/cross-repository/IIPS_V3_CAP02_G4_H12_MANIFEST_V3_CANDIDATE_VALIDATION_2026-10-23.md`.
- IPD final Limb A pin: `a52b47b0f8ca448c8c9c195cf261e83ecf813ba3` / tree `1467802e9b9497f84acb1bc6bb3ddd386792499a`; current IRR consumer read-only pin: `4740ba21ea6103f1a7ebc9768269ae7795920698` / tree `23c5ca4ae1bfd481bcfc911c70b9e7dc090e1162`.
- Verified observed set: 32 IPD path records present (including the newly published parser test), 24 IRR consumer paths, 9 criteria references, 10 frozen anchors, the conditional parser helper present, and 1,140 generated `dist/**` files captured by SHA-256. The QE evidence-deposit set is explicitly not generated because QE has not executed.

**Material stop — do not adopt or silently repair.** Effective Gate 4 act §8 requires **33 mandatory
IPD paths** (“the candidate's 32 + the mandatory parser test”). The preserved D-7/§4.7 packet defines
**32 mandatory IPD paths** and already treats `tests/g4_run_tests_summary_parsing.test.ts` as the
required future path. The machine-readable v2 candidate enumerates 32 IPD records total: 31 present
at its old pin plus that absent parser-test record. At the final Limb A commit, the same records yield
32 present paths, not 33. No authoritative record names a distinct 33rd path.

This pass therefore does **not** invent a path, duplicate the parser test, downgrade the effective act
to 32, adopt H-12, perform host preflight, or start QE. The required closure is a **separate Program
Authority corrective membership determination/adoption-boundary decision** naming the exact 33-path set
(or reconciling the effective act's count) and its status. Until that decision is durably published
and independently read back, H-12 remains **NOT ADOPTED** and Gate 4 remains **AUTHORIZED — NOT STARTED**.

## CAP-02 PR #69 publication and final remote-main verification (2026-10-23)

PR #69 published the H-12 preparation/stop record and the tracker reconciliation. It was independently
fetched after merge; no claim relies only on the PR page.

| Item | Independently verified value |
|---|---|
| PR #69 | `MERGED` at `2026-10-23T16:40:29Z`; URL https://github.com/ramkivs/iips-production-market-data/pull/69 |
| PR head / candidate tree | `a211cbfdf83c3172a89a1d5c31cbf57c9a38957e` / `6fe2d6dea72772dd04e8442cc7135dac5c46388d` |
| Merge commit / root tree | `6804e17d04373ccc5fed82ecfc5153afdc6f0b3e` / `6fe2d6dea72772dd04e8442cc7135dac5c46388d` |
| Merge parents | first `a52b47b0f8ca448c8c9c195cf261e83ecf813ba3`; second `a211cbfdf83c3172a89a1d5c31cbf57c9a38957e` |
| Tree/ancestry reconciliation | PR head is merge parent 2; candidate tree equals merge tree; `git diff --name-only a211cbf… 6804e17…` is empty. |
| PR #69 changes | 3 files, 12933 additions, 0 deletions: tracker plus the two H-12 candidate/validation records. |
| PR #69 CI | `typecheck · build · test`: `SUCCESS`, PR run `39988569866`, job `120534085899`; `executed test count`: `SUCCESS`, check `120534500538`. |
| Post-merge `main` CI | run `39988741293` (`push`, head `6804e17…`) **SUCCESS**; job `120534674459` and executed-count job `120535149701` both **SUCCESS**. |
| Authoritative remote ref | `refs/heads/main` now `6804e17d04373ccc5fed82ecfc5153afdc6f0b3e`, tree `6fe2d6dea72772dd04e8442cc7135dac5c46388d`. |

### Final artifact read-back at remote `main`

The following identities were read directly from the fetched `origin/main` tree after PR #69.
The PR #67 decision blobs remain unchanged and still match the original raw SHA-256 values.

| Exact `origin/main` path | Git blob ID | Bytes | Lines | Raw SHA-256 |
|---|---|---:|---:|---|
| `evidence/cross-repository/IIPS_V3_CAP02_GATE4_TARGET_HOST_QUALIFICATION_ACT_EFFECTIVE_2026-10-23.md` | `66b56fd1584890525a7250aadd7da449def621e5` | 34316 | 420 | `c8c1378622657a320f14f34c008bb27fde2acaf57acc9a73a3489ea6be57c7b6` |
| `evidence/cross-repository/IIPS_V3_CAP02_GATE_A_PRIME_SUCCESSOR_PROVISIONING_ACT_EFFECTIVE_2026-10-23.md` | `528de6aeddbc8e5f3191be8792f3937d77de4037` | 29856 | 354 | `df8e44f704814e2321b5134206b04f25097830bdc5dd53c4d907d1256e4c788d` |
| `evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md` | `163f66618e164a3defb0e9ed6c012bc418c16628` | 49463 | 511 | `e0762e2a26237a2c64ee6d0cfb4ac8b7947acd55d91fce401a904d9b77f497d6` |
| `evidence/cross-repository/IIPS_V3_CAP02_G4_H12_MANIFEST_V3_CANDIDATE_2026-10-23.json` | `a169e1f7d8721860942807bad1b325ccc57d2404` | 482205 | 12796 | `344d1bd19c35231cc9d243c58f7e1ce22ccb7bfeda541966a71c1355a17d0594` |
| `evidence/cross-repository/IIPS_V3_CAP02_G4_H12_MANIFEST_V3_CANDIDATE_VALIDATION_2026-10-23.md` | `64d04e78750878f2bd35e06ef30d4d2ba25c2674` | 3918 | 59 | `ff9d97f9c7047dd2fafdd0b6c8d1256bc722240768403153bee00d72f73f5ed1` |

The two H-12 artifacts are **preparation evidence only**. The machine-readable candidate records the
76 repository-entry identity checks and the 33-versus-32 membership conflict; its status is
`NOT ADOPTED`. The final main tree has no discrepancy from PR #69 head, and no IRR mutation occurred.

**Handover state recorded at the PR #69 receipt (superseded by later tracker-only publications):**
IPD `ramkivs/iips-production-market-data` `refs/heads/main` was
`6804e17d04373ccc5fed82ecfc5153afdc6f0b3e`, tree `6fe2d6dea72772dd04e8442cc7135dac5c46388d`.
The next action remains the separate PA correction/reconciliation of the H-12 path-membership
conflict. Gate A′ identity values remain unresolved; provisioning, host preflight, QE-1…QE-11, H-12
adoption, result acceptance and W-1/U6 write authorization remain unperformed/not granted as applicable.

## CAP-02 PR #70 publication receipt (2026-10-23)

PR #70 was the tracker-only publication of the prior H-12 receipt. It was independently fetched and
verified before this final tracker update.

| Item | Verified value |
|---|---|
| PR #70 | `MERGED` at `2026-10-23T16:43:37Z`; URL https://github.com/ramkivs/iips-production-market-data/pull/70 |
| PR head / tree | `963b0d70cf910181ea8e046c344204bf61b165b5` / `da09fd3cb43a938cff1b7b4cf7e4b636a57bdebf` |
| Merge commit / tree | `7c51d25d8e702fc62eaaf0bbcf2fc023fad28398` / `da09fd3cb43a938cff1b7b4cf7e4b636a57bdebf` |
| Merge parents | first `6804e17d04373ccc5fed82ecfc5153afdc6f0b3e`; second `963b0d70cf910181ea8e046c344204bf61b165b5`; tree and ancestry match, no diff from PR head |
| PR #70 CI | `typecheck · build · test`: `SUCCESS`, run `39988979415`, job `120535503473`; `executed test count`: `SUCCESS`, check `120536038566` |
| Post-merge `main` CI | run `39989171432` (`push`, head `7c51d25…`) **SUCCESS**; job `120536155243` and executed-count job `120536728240` both **SUCCESS** |
| Remote `main` at this receipt | `7c51d25d8e702fc62eaaf0bbcf2fc023fad28398`, tree `da09fd3cb43a938cff1b7b4cf7e4b636a57bdebf` |
| Final read-back H-12 identities | JSON blob `a169e1f7d8721860942807bad1b325ccc57d2404` / SHA-256 `344d1bd19c35231cc9d243c58f7e1ce22ccb7bfeda541966a71c1355a17d0594`; validation blob `64d04e78750878f2bd35e06ef30d4d2ba25c2674` / SHA-256 `ff9d97f9c7047dd2fafdd0b6c8d1256bc722240768403153bee00d72f73f5ed1` |

This receipt does not change any decision status: H-12 remains **NOT ADOPTED** at the explicit
33-versus-32 membership conflict; Gate 4 remains **AUTHORIZED — NOT STARTED**; Gate A′ execution
remains **NOT AUTHORIZED** pending its separate identity-value act and host conditions.

## CAP-02 PR #72 tracker-status reconciliation receipt (2026-10-23)

PR #72 corrected only the existing authoritative U3/Gate 4 and Binding provisioning rows after
re-reading the published PR #68 implementation and the H-12 v3 stop record. No source, act, IRR
artifact, host operation, QE execution, result acceptance, or write authorization changed.

| Item | Verified value |
|---|---|
| PR #72 | `MERGED` at `2026-10-23T16:49:53Z`; URL https://github.com/ramkivs/iips-production-market-data/pull/72 |
| PR head / tree | `1af5f6425081506418a1c47bc707f5986ef808e6` / `09bff9dbccff60a90b48a25bf880c81c1bb00338` |
| Merge commit / tree | `50cbe6842e13a1c9ea0c833e7e3b2351ff90a305` / `09bff9dbccff60a90b48a25bf880c81c1bb00338` |
| Merge parents | first `4198170b9c9eccc7bba8fab6c11825564ad043d3`; second `1af5f6425081506418a1c47bc707f5986ef808e6`; PR head is parent 2 and the merge tree matches the PR-head tree |
| PR #72 CI | `typecheck · build · test`: `SUCCESS`, run `39989882080`, job `120538597607`; `executed test count`: `SUCCESS`, check `120538971949` |
| Post-merge `main` CI | run `39990027123` (`push`, head `50cbe684…`) **SUCCESS**; job `120539100924` and executed-count job `120539582698` both **SUCCESS** |
| Remote `main` at this receipt | `50cbe6842e13a1c9ea0c833e7e3b2351ff90a305`, tree `09bff9dbccff60a90b48a25bf880c81c1bb00338` |

The corrected rows preserve the effective statuses: Gate 4 remains **AUTHORIZED — NOT STARTED**;
Gate A′ implementation is **PUBLISHED/REMOTE-VERIFIED** but provisioning remains **NOT AUTHORIZED**
while identity values are unresolved; H-12 remains **NOT ADOPTED** at the explicit 33-versus-32
membership conflict. The next action remains a separate PA membership correction/adoption-boundary
decision; no host preflight, QE-1…QE-11, result acceptance, Gate 5, U6, or write operation occurred.

## CAP-02 PR #73 baseline receipt & Gate 4 H-12 membership reconciliation preparation (2026-10-23)

### 1. Verified starting baseline on remote `origin/main` (PR #73) and read-only `IRR`

| Item | Independently verified value |
|---|---|
| PR #73 (starting `origin/main` baseline) | `MERGED` at `2026-10-23T16:52:53Z`; URL https://github.com/ramkivs/iips-production-market-data/pull/73 |
| PR #73 head | `56f30a2320767c0800003450506baa51176befd7` |
| PR #73 merge commit / root tree | `7e4f44534c1c3e2853a0a6b60ac109f75194cdff` / `d5c65882012bd6d67f0f5a3d88438f520db721fc` (`0` non-`evidence/` diffs from Limb A merge `a52b47b0f8ca448c8c9c195cf261e83ecf813ba3` / tree `1467802e9b9497f84acb1bc6bb3ddd386792499a`) |
| PR #73 pre-merge & post-merge CI | Pre-merge run `39990281364` (`typecheck · build · test` job `120539975564` `SUCCESS`; `executed test count` check `120540407342` `SUCCESS`); post-merge `main` push run `39990445949` `SUCCESS` |
| Read-only IRR remote tip | `ramkivs/iips-review-recovered` `origin/main@4740ba21ea6103f1a7ebc9768269ae7795920698`, tree `23c5ca4ae1bfd481bcfc911c70b9e7dc090e1162` (historical Gate 3 code pin `d355d904aa52988e70a98324714886f6a1c0ea2a`, tree `e631cf3287fc19a2d1c8f73a0eb5f8d640370e27`) — strictly read-only |

### 2. Root-cause determination, authority boundary, and additive reconciliation artifacts

Live inspection across both repositories resolved the full provenance of the `33`-versus-`32` conflict:
1. **Primary root cause (internal source-of-truth arithmetic double-count):** `IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01` §8 (blob `66b56fd1584890525a7250aadd7da449def621e5`) stated `"33 mandatory IPD paths (the candidate's 32 + the mandatory parser test)"`, overlooking that `G4-H12-MANIFEST-v2-CANDIDATE-2026-10-22.json` (`entries[23]` / 1-based `#24`, IRR blob `3b64c4ac4ae31d4c318b3de7183874a27c178eef`) and `D-7` §4.7 (IRR blob `7d3b143ec2bdd926d8bed0d771d436156bd27de9`) **already included** `tests/g4_run_tests_summary_parsing.test.ts` inside `32` (`31 PRESENT + 1 ABSENT_AT_PINNED_BASELINE = 32`). Set union cardinality is `32`, not `33`.
2. **Secondary stale parenthetical citation also uncovered:** Gate 4 Act §8 parenthetically cited `.github/workflows/ci.yml` as `blob aeee464feb76e2d1e9d104e1cae4e5dde37700ad` (`1cceacff…`), whereas prior effective IPD CAP-02 acts (`IIPS-V3-CAP02-IPD-EXPORT-IMPLEMENTATION-ACT-2026-10-23-01` and `IIPS-V3-CAP02-B1R-IPD-COMPATIBILITY-IMPLEMENTATION-ACT-2026-10-23-01` §5) had already updated `.github/workflows/ci.yml` on `main` to `blob 4614ee0e27fe8a8f0b4f4883bacc141e2d67aae5`.
3. **Why existing published authority does NOT allow self-changing §8:** `IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01` §§13, 15.3, and 16 prohibit silent reinterpretation or post-merge modification without a **separate explicit Program Authority act**, and `DEC-06` R-2/R-3 prohibits presenting a proposed resolution as an approved PA decision.
4. **Additive artifacts prepared and validated in this pass (`0` prior records modified; `0` non-`evidence/` paths touched):**

| Additive Artifact Path | Record / Manifest ID | Git Blob OID (SHA-1) | Bytes | Raw SHA-256 | Status |
|---|---|---|---:|---|---|
| `evidence/cross-repository/IIPS_V3_CAP02_G4_H12_MEMBERSHIP_RECONCILIATION_DECISION_PROPOSED_2026-10-23.md` | `IIPS-V3-CAP02-G4-H12-MEMBERSHIP-RECONCILIATION-PROPOSAL-2026-10-23-01` | `336276fecdc1df651c716c2e5ec1e43852c2e014` | 71164 | `e69fa6e9915dca94259876d949687b5945ee78e7d67feeec28b0fd45c8d5eba4` | **`PROPOSED — NOT EFFECTIVE`** (stages `Q-H12-1..Q-H12-4`: **Alt A [Recommended] `32` core IPD paths**, **Alt B `39` expanded CAP-02 IPD paths**, **Alt C `33` IPD paths via explicit helper promotion**, `AC-H12-01..AC-H12-10`, `ADOPT-REQ-01..ADOPT-REQ-08`) |
| `evidence/cross-repository/IIPS_V3_CAP02_G4_H12_MANIFEST_V3_RECONCILED_CANDIDATE_2026-10-23.json` | `G4-H12-MANIFEST-v3-CANDIDATE-2026-10-23-R2` | `9382d4b0bf6d085616f781221daa5b6a4d03b2bc` | 498153 | `3afce627b92b05f6e0b27cc06719d9849dcd72946927f07e768ed631f8c471f2` | **`NOT ADOPTED`** (`56/56` `entries` + `1/1` helper + `9/9` criteria + `10/10` anchors + `7/7` supplemental CAP-02 IPD files + `1,140/1,140` `dist/**` files byte-verified) |
| `evidence/cross-repository/IIPS_V3_CAP02_G4_H12_MANIFEST_V3_RECONCILED_VALIDATION_2026-10-23.md` | `IIPS-V3-CAP02-G4-H12-V3-R2-VALIDATION-2026-10-23-01` | `456d08e8c8933250c1feb98986bbd32d548226bc` | 5733 | `aba6fc73b9a881ceb79f1a10a91b0c9f49b75fd644ba7f4be1dd547a130c831a` | Executed `VAL-R2-01..VAL-R2-10` validation record (`tsc --noEmit`, `npm run build`, `npm test` `892/891/0/1`, `verify-public-package.mjs` `PASS`) |

All execution boundaries remain strictly intact: `H-12` remains **`NOT ADOPTED`**, Gate 4 remains
**`AUTHORIZED — NOT STARTED`**, Gate A′ provisioning remains **`NOT AUTHORIZED`**, and no host
preflight, QE-1..QE-11 execution, result acceptance, Gate 5 admission, U6 authorization, operational
write, or IRR modification occurred.

## CAP-02 PR #74 publication and final remote-main verification receipt (2026-10-23)

PR #74 published the formal `H-12` membership reconciliation & proposed PA corrective decision record,
the pre-validated `v3-R2` candidate manifest, the executed `VAL-R2-01..VAL-R2-10` validation record,
and the authoritative tracker update. All checks and artifact digests below were verified directly
from fetched `origin/main` and the GitHub Contents API after merge.

| Item | Independently verified value |
|---|---|
| PR #74 | `MERGED` at `2026-10-23T17:29:26Z`; URL https://github.com/ramkivs/iips-production-market-data/pull/74 |
| PR head / candidate tree | `102294b359d6e5a9188f04a09c121448c885fa90` / `d1437ffb070aa7b23661a9fe3846ea23b90c3f34` |
| Merge commit / root tree | `5b498e5590b77bb722ead39cf9205e1ab26aea01` / `d1437ffb070aa7b23661a9fe3846ea23b90c3f34` |
| Merge parents | first `7e4f44534c1c3e2853a0a6b60ac109f75194cdff`; second `102294b359d6e5a9188f04a09c121448c885fa90` (`git diff --name-only 102294b3… 5b498e55…` empty) |
| PR #74 CI | `typecheck · build · test`: `SUCCESS`, run `39995297697`, job `120557145380`; `executed test count`: `SUCCESS`, check `120557609745` (`892` executed, `891` passed, `0` failed, `1` skipped) |
| Post-merge `main` push CI | run `39995485000` (`push`, head `5b498e5590b77bb722ead39cf9205e1ab26aea01`) **SUCCESS**; job `120557801311` and `executed test count` check `120558429817` both **SUCCESS** |
| Read-only `IRR` remote re-verification | `ramkivs/iips-review-recovered` `refs/heads/main` remains `4740ba21ea6103f1a7ebc9768269ae7795920698`, tree `23c5ca4ae1bfd481bcfc911c70b9e7dc090e1162` (`0` edits, commits, branches, or PRs) |

### Direct `origin/main` read-back table after PR #74 (`5b498e5590b77bb722ead39cf9205e1ab26aea01`)

| Exact `origin/main` path | Git blob SHA-1 OID (`== GitHub API sha`) | Bytes | Lines | Raw SHA-256 |
|---|---|---:|---:|---|
| `evidence/cross-repository/IIPS_V3_CAP02_GATE4_TARGET_HOST_QUALIFICATION_ACT_EFFECTIVE_2026-10-23.md` | `66b56fd1584890525a7250aadd7da449def621e5` | 34316 | 420 | `c8c1378622657a320f14f34c008bb27fde2acaf57acc9a73a3489ea6be57c7b6` |
| `evidence/cross-repository/IIPS_V3_CAP02_GATE_A_PRIME_SUCCESSOR_PROVISIONING_ACT_EFFECTIVE_2026-10-23.md` | `528de6aeddbc8e5f3191be8792f3937d77de4037` | 29856 | 354 | `df8e44f704814e2321b5134206b04f25097830bdc5dd53c4d907d1256e4c788d` |
| `evidence/cross-repository/IIPS_V3_CAP02_G4_H12_MANIFEST_V3_CANDIDATE_2026-10-23.json` | `a169e1f7d8721860942807bad1b325ccc57d2404` | 482205 | 12796 | `344d1bd19c35231cc9d243c58f7e1ce22ccb7bfeda541966a71c1355a17d0594` |
| `evidence/cross-repository/IIPS_V3_CAP02_G4_H12_MANIFEST_V3_CANDIDATE_VALIDATION_2026-10-23.md` | `64d04e78750878f2bd35e06ef30d4d2ba25c2674` | 3918 | 59 | `ff9d97f9c7047dd2fafdd0b6c8d1256bc722240768403153bee00d72f73f5ed1` |
| `evidence/cross-repository/IIPS_V3_CAP02_G4_H12_MEMBERSHIP_RECONCILIATION_DECISION_PROPOSED_2026-10-23.md` | `336276fecdc1df651c716c2e5ec1e43852c2e014` | 71164 | 299 | `e69fa6e9915dca94259876d949687b5945ee78e7d67feeec28b0fd45c8d5eba4` |
| `evidence/cross-repository/IIPS_V3_CAP02_G4_H12_MANIFEST_V3_RECONCILED_CANDIDATE_2026-10-23.json` | `9382d4b0bf6d085616f781221daa5b6a4d03b2bc` | 498153 | 12974 | `3afce627b92b05f6e0b27cc06719d9849dcd72946927f07e768ed631f8c471f2` |
| `evidence/cross-repository/IIPS_V3_CAP02_G4_H12_MANIFEST_V3_RECONCILED_VALIDATION_2026-10-23.md` | `456d08e8c8933250c1feb98986bbd32d548226bc` | 5733 | 42 | `aba6fc73b9a881ceb79f1a10a91b0c9f49b75fd644ba7f4be1dd547a130c831a` |
| `evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md` *(at PR #74 merge)* | `05894952f2bc22bb30afa9155035ac2769841227` | 63389 | 625 | `734dfc15602995bd33048e8d6862cb168e71968b21045f5b3e2ecdd572db0ac7` |

**Handover & gate state:** Proposed corrective record `IIPS-V3-CAP02-G4-H12-MEMBERSHIP-RECONCILIATION-PROPOSAL-2026-10-23-01` remains **`PROPOSED — NOT EFFECTIVE`** until **Ramki — Program Authority** renders an express determination on `Q-H12-1..Q-H12-4`. `H-12` remains **`NOT ADOPTED`**; Gate 4 remains **`AUTHORIZED — NOT STARTED`**; Gate A′ provisioning remains **`NOT AUTHORIZED`**; `IRR` remains strictly read-only at `4740ba21ea6103f1a7ebc9768269ae7795920698`.

## CAP-02 PR #76 publication and final remote-main verification receipt — Gate 4 `H-12` membership amendment (Alternative A) (2026-10-24)

PR #76 published the formal amendment act `IIPS-V3-CAP02-G4-AMEND-01-H12-MEMBERSHIP-2026-10-23`, rendered by
**Ramki — Program Authority** on the express selection of **Alternative A — Narrow Arithmetic Amendment** (Alternatives B
and C expressly not selected). It is the separate express act that Gate 4 Act §§13, 15.3 and 16 require, and it corrects
§8 of that effective act while preserving the act itself byte-identically. Every value below was read back from the
fetched remote after merge and, independently, from the GitHub Contents and blob APIs.

### 1. Publication coordinates

| Item | Independently verified value |
|---|---|
| PR #76 | `MERGED` at `2026-10-24T04:33:26Z`; https://github.com/ramkivs/iips-production-market-data/pull/76 |
| Starting baseline (pre-merge `origin/main`) | `09d547f7ced040748ba27f438b01cae822119618`, tree `7af592b1ad7042caf9c4cb0ffbf9d56f2ccf4dfb` — unchanged from the reported baseline; `git rev-list --left-right --count main...origin/main` = `0 0` |
| PR head | `0dd13f80155d98f95125310dfa0d09919bccbbc9` |
| Merge commit / root tree | `00cad5c3c18552422f816d1b9a486d1057c78e43` / `9ff07e488043af38b82bedebc57ddc2bd37a3d69` |
| Merge parents | first `09d547f7ced040748ba27f438b01cae822119618`; second `0dd13f80155d98f95125310dfa0d09919bccbbc9` |
| PR #76 CI | `typecheck · build · test`: `SUCCESS`, run `40062687234`, job `120779371873`; `executed test count`: `SUCCESS`, check `120779616139` (`892` executed, `891` passed, `0` failed) |
| Post-merge `main` push CI | run `40062811790` (`push`, head `00cad5c3…`) **SUCCESS**; job `120779746962` and `executed test count` check `120779931218` both **SUCCESS** (`892` / `891` / `0`) |
| Changed paths in the merge | exactly **one** added path — the amendment file; **`0`** non-`evidence/` paths (`git diff --name-only 09d547f7… 00cad5c3… -- . ':(exclude)evidence/'` = `0`) |

### 2. Amendment artifact identity (remote read-back at `main@00cad5c3…`)

| Item | Value |
|---|---|
| Path | `evidence/cross-repository/IIPS_V3_CAP02_G4_AMEND_01_H12_MEMBERSHIP_EFFECTIVE_2026-10-24.md` |
| Act ID | `IIPS-V3-CAP02-G4-AMEND-01-H12-MEMBERSHIP-2026-10-23` (identifier reserved in the proposal; census before this pass: `0` assignments in either repository) |
| Rendered / decision date | `2026-10-24` (UTC) — actual date; the `-2026-10-23` suffix is the reserved identifier string, not a backdated decision |
| Git blob SHA-1 OID (`== ` GitHub Contents API `sha`) | `21a0f9eb6cd7b1bbc4849d6dfd26c6c8025d60b8` |
| Raw SHA-256 | `ad20b02bb1c4d27417e0b3b43f98ac1257369cfd26339ca37cda8d6f6579c045` — reproduced from the API-decoded blob bytes, not only from the worktree |
| Byte length / lines | `43,608` B / `367` |
| Status | **`RENDERED — EFFECTIVE`** on this publication; §8 read as amended per its §3.3 |
| Receipt locus | this section (`§13.1` of the amended act); the act body is not edited after merge |

### 3. Preservation read-back (byte-identical before and after PR #76)

| Artifact | Git blob SHA-1 | Raw SHA-256 | Bytes |
|---|---|---|---:|
| `IIPS_V3_CAP02_GATE4_TARGET_HOST_QUALIFICATION_ACT_EFFECTIVE_2026-10-23.md` (amended act) | `66b56fd1584890525a7250aadd7da449def621e5` | `c8c1378622657a320f14f34c008bb27fde2acaf57acc9a73a3489ea6be57c7b6` | 34,316 |
| `IIPS_V3_CAP02_G4_H12_MEMBERSHIP_RECONCILIATION_DECISION_PROPOSED_2026-10-23.md` (proposal) | `336276fecdc1df651c716c2e5ec1e43852c2e014` | `e69fa6e9915dca94259876d949687b5945ee78e7d67feeec28b0fd45c8d5eba4` | 71,164 |
| `IIPS_V3_CAP02_G4_H12_MANIFEST_V3_CANDIDATE_2026-10-23.json` (`R1`) | `a169e1f7d8721860942807bad1b325ccc57d2404` | `344d1bd19c35231cc9d243c58f7e1ce22ccb7bfeda541966a71c1355a17d0594` | 482,205 |
| `IIPS_V3_CAP02_G4_H12_MANIFEST_V3_CANDIDATE_VALIDATION_2026-10-23.md` (`R1` validation) | `64d04e78750878f2bd35e06ef30d4d2ba25c2674` | `ff9d97f9c7047dd2fafdd0b6c8d1256bc722240768403153bee00d72f73f5ed1` | 3,918 |
| `IIPS_V3_CAP02_G4_H12_MANIFEST_V3_RECONCILED_CANDIDATE_2026-10-23.json` (`R2`) | `9382d4b0bf6d085616f781221daa5b6a4d03b2bc` | `3afce627b92b05f6e0b27cc06719d9849dcd72946927f07e768ed631f8c471f2` | 498,153 |
| `IIPS_V3_CAP02_G4_H12_MANIFEST_V3_RECONCILED_VALIDATION_2026-10-23.md` (`R2` validation) | `456d08e8c8933250c1feb98986bbd32d548226bc` | `aba6fc73b9a881ceb79f1a10a91b0c9f49b75fd644ba7f4be1dd547a130c831a` | 5,733 |
| `IIPS_V3_CAP02_GATE_A_PRIME_SUCCESSOR_PROVISIONING_ACT_EFFECTIVE_2026-10-23.md` | `528de6aeddbc8e5f3191be8792f3937d77de4037` | `df8e44f704814e2321b5134206b04f25097830bdc5dd53c4d907d1256e4c788d` | 29,856 |
| `.github/workflows/ci.yml` (corrected anchor) | `4614ee0e27fe8a8f0b4f4883bacc141e2d67aae5` | `a2dba24f47aaead2b6b5c235ae9f33dc8a98641a5bcd1d5080bb3e202d724f86` | 4,054 |

### 4. Validation executed for the amendment (summary of the act's §9 `VM-1…VM-16`)

| Check | Result |
|---|---|
| Baseline identity and advance | `origin/main` = `09d547f7…` / tree `7af592b1…`; **no advance** since the reported baseline; post-merge `main` = `00cad5c3…` / tree `9ff07e48…` |
| Content drift since the final Limb A merge `a52b47b0…` | **`0`** non-`evidence/` paths; the Gate 4 Act's selected basis `5fc74085…` advanced `18` commits, all of them the authorised Limb A and Gate A′ implementations and their evidence records |
| `R2` manifest integrity, IPD side | **`56/56`** entries byte-exact (blob SHA-1, raw SHA-256, byte length, LF/CRLF/bare-CR); `0` duplicates, `0` `ABSENT` |
| `R2` manifest integrity, IRR side | **`27/27`** match the designated pin `4740ba21…`; `0` changed at the live IRR tip |
| The `32` IPD core paths, the helper and the `7` post-G3 paths at the current tip | all identical to the recorded blobs |
| `D-7` §4.7 arithmetic | `27` (which already includes the parser test) `+ 5` = **`32`**; present at `1cceacff…`: **`31` of `32`**, the only absent path being the parser test; union cardinality **`32`**, never `33` |
| Fresh `npm ci` → `npx tsc --noEmit` → `npm run build` at `09d547f7…` | exit `0` / `0` / `0`; **`1,140`** `dist/**` files; `1,140/1,140` byte-identical against `runtime_dist_set` (`0` missing, `0` mismatched, `0` extra) |
| `npm test` / `npm run test:package-consumer` | `892` tests, `891` pass, `0` fail, `1` skipped, `[test-guard] OK`; package consumer `PASS`, shasum `cc2aa70186b8fd7bc7255452ac8d8b00d094f53e`, `durable: false` |
| Identifier census | Act ID previously unassigned: present only as a *reserved* string in the proposal and in `R2`; **`0`** hits in `ramkivs/iips-review-recovered` |
| Documentation-only diff | **`1`** added file; `0` source, test, script, package, build-config or CI-workflow changes |

### 5. Read-only `IRR` state

| Item | Value |
|---|---|
| Designated consumer pin (unchanged) | `main@4740ba21ea6103f1a7ebc9768269ae7795920698`, tree `23c5ca4ae1bfd481bcfc911c70b9e7dc090e1162` |
| Live `IRR` `main` observed | `4d14780f0db66a891f552926ee2badaf56acfa2d`, tree `742ac4d4c8817bab9aa2cbeaac138d9a72c2934e` |
| Drift from the pin | `4` commits, **`1` file** (`IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md`) — **documentation only**; **`0`** of the `24` consumer and `3` criteria paths changed, byte-identical at the live tip |
| Effect of the amendment on the pin | **none** — the amendment changes no IRR identity and authorises no re-pin |
| IRR writes by this pass | **`0`** — no branch, commit, file, issue, comment or PR created or modified |

### 6. Gate state after publication

| Item | State |
|---|---|
| `IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01` | **In force, unmodified** (blob `66b56fd1…`); §8 now read as amended (`32` mandatory IPD + `1` conditional helper + `24` IRR = `56` core entries; `ci.yml` `4614ee0e…`) |
| `IIPS-V3-CAP02-G4-AMEND-01-H12-MEMBERSHIP-2026-10-23` | **RENDERED — EFFECTIVE** (PR #76) |
| `H-12` manifest | **`NOT ADOPTED`** — `R1` (`a169e1f7…`) and `R2` (`9382d4b0…`) both remain candidates |
| Gate 4 | **`AUTHORIZED — NOT STARTED`** — `0` of `11` QE items executed |
| Gate A′ provisioning | **`NOT AUTHORIZED`** — `principal_label` / `tenantId` / `canonicalOwnerId` remain unresolved and unselected |
| U4 / Gate C / Gate 5 / U6 | **not rendered / not accepted / not granted / not authorized** — no operational write, `SESSION_ONLY` / `durable:false` unchanged |
| Remaining prerequisites for `H-12` adoption | S1 Gate A′ identity-value act + binding commit; final execution-commit regeneration at that commit; S2 native-Windows canonical `npm test` on `desktop-no0nhtp` under Node `>=22.13.0 <23`; S1 P-1 provisioning with V-A2 acceptance evidence; direct remote read-back; and a **separate express PA adoption act**. None is claimed as complete |

---

## CAP-02 S1 identity-value authority, Gate A′ readiness and H-12 adoption-readiness — decision-request one-pass (2026-10-24)

**Session branch:** `arena/3d7e0b42-iips-production-market-data`. **Scope:** take the S1 identity
question and the H-12 adoption question to the furthest evidence-supported point without crossing any
authority boundary. No value was selected, derived, copied, defaulted or fabricated; no provisioning,
host contact, QE, adoption, schema/migration/source/test/CI/package change, or IRR mutation occurred.
Full argument, matrix and evidence:
`IIPS_V3_CAP02_S1_IDENTITY_VALUE_AUTHORITY_H12_READINESS_DECISION_REQUEST_2026-10-24.md`
(record `IIPS-V3-CAP02-S1-IDENTITY-AUTHORITY-H12-READINESS-DECISION-REQUEST-2026-10-24-01`,
**PROPOSED — NOT EFFECTIVE**; working blob `b11cc457805a7947bd2d90c9d8185b225c5722ff`, raw SHA-256
`f3d58c28f1b6f72eb195f3674ef813f05099fd430b55ad0cc1f2c818337ae9b3`, 52,212 B — final identities
confirmed by post-commit/remote read-back below).

### 1. Live baselines re-verified this pass

| Item | Value |
|---|---|
| IPD `origin/main` | `5e4e54db752060f75c945eb437ab317b7b9f04bf`, tree `9de03c775dbbc19f9e68b5e4931a94a6c70fa054`; clean worktree; Limb A merge `a52b47b0…` is an ancestor, `18` commits intervene, **all evidence-only** (`0` non-`evidence/` paths) |
| Gate A′ act §2.1 blobs | **12/12** designated blobs (provisioning `dc844189…`, binding `96d0079d…`, audit `273ccd3b…`, connection `5169e402…`, migrations 001–004 `f594a182…/932af8e6…/32b125bf…/6bad5a50…`, dispatch `27becc76…`, portfolio_store `4a005b73…`, package.json `51796e63…`, g3 test `edd0305e…`) unchanged at the current tip |
| IRR (read-only) | live tip `4d14780f0db66a891f552926ee2badaf56acfa2d` / tree `742ac4d4…`; designated pin `4740ba21…`; `27/27` manifest entries byte-identical at both; drift = one tracker document; **zero** IRR mutations |
| Record-ID census | the new decision-request string/filename had **0** prior hits in either repository |

### 2. S1 identity-field determination (all three UNRESOLVED — AUTHORITY REQUIRED)

| Field | Classification | Authority | Candidate classes rejected (all located to exact blobs) |
|---|---|---|---|
| `principal_label` | **UNRESOLVED — AUTHORITY REQUIRED** | PA-only separate S1 determination (Gate A′ act §4); standing grant withholds value selection | no candidate at all — the spent Gate A schema used `endpointId`, not a label |
| `tenantId` | **UNRESOLVED — AUTHORITY REQUIRED** | PA-only; tenant administration NOT AUTHORIZED / source of truth D115-deferred (G24 governance) | IRR `irr-domain-4b82d6e1` (cross-domain, no equivalence); `IIPS_OFFLINE_BOOTSTRAP` (offline provenance marker, different schema); spent `t-1c568b7e…` (old/absent tables); `*-not-selected`/`fixture-*` tests |
| `canonicalOwnerId` | **UNRESOLVED — AUTHORITY REQUIRED** | PA-only; F-3 carrier refused as principal (OC-7, F-3 §5.7, CV-20) | IRR `owner-7f3a91c2`; spent `applicationUserId 4f423263…` (absent table, different concept); fixtures |

Compiled constants remain `PRINCIPAL_LABEL = TENANT_ID = CANONICAL_OWNER_ID = null`; `binding_id` and
`membership_id` are deterministic SHA-256 functions of these values, so a single verbatim three-value
PA determination is the only unblock; no env/default/placeholder path is permitted or exists.

### 3. Gate A′, H-12 and CAP-03 DR dispositions

- **Gate A′:** basis/entrypoint authority EFFECTIVE and published (PR #67/#68); execution still
  **NOT AUTHORIZED**; no `src/`/`frontend/` importer of the mutator; host `desktop-no0nhtp` remains
  unreachable (fresh DNS/ping failure) and its Node 22-range preflight is unproven; no P-1 path, no
  store, no V-A2 receipt; V-A2-1…V-A2-8 read-only fail-closed logic re-read and empirically confirmed.
- **H-12:** remains **NOT ADOPTED**. Amendment Alternative A is EFFECTIVE and byte-verified: R2
  structure = **56** core entries (32 IPD incl. parser test at `entries[23]` blob `49e901b6…`, 24 IRR)
  + 1 conditional helper + 7 post-G3 + 1,140 dist; this pass re-verified **50/50** IPD and **27/27**
  IRR manifest blobs and **1,140/1,140** dist bytes at current tips. Adoption still requires the S1
  act + binding commit, regeneration at the resulting final execution commit (R2 is a preserved
  pre-amendment candidate and cannot be adopted as-is), native-Windows evidence, and a separate
  express PA adoption act.
- **CAP-03 (IRR read-only):** tracker L7900 re-confirms DR-2 / DR-3 / DR-4r **UNRESOLVED — PA
  decisions required** (DR-4 IPD schema half CLOSED via migration 004 `6bad5a50…`). **None blocks S1,
  Gate A′ provisioning or H-12** (they are P05–P07 after identity P02/provisioning P04); they bound
  Gate 4 QE (PASS vs recorded limitation under the Q4 tiers) and gate Gate 5 read admission.
  DR-1 is now EFFECTIVE (successor act); the capability-matrix O-01 "PROPOSED" wording is preserved
  point-in-time text, not a live conflict.

### 4. Non-mutating checks executed (Linux Node v22.22.3; repository evidence, not host qualification)

`npm ci` exit 0; `npx tsc --noEmit` exit 0; `npm run build` exit 0 (1,140 dist, chunk advisory only);
`npm test` **892 tests / 891 pass / 0 fail / 1 skipped / 123 suites**, `[test-guard] OK`;
package-consumer **PASS**, shasum `cc2aa701…`, `durable:false`; focused suites — Gate A′ 7/7, parser
10/10, write-gate + startup 29/29. Refusal probes: execute → `IDENTITY_VALUES_UNRESOLVED` (no file
created); env-supplied value → `ENVIRONMENT_VALUES_NOT_AUTHORIZED`; wrong act → `ACT_ID_MISMATCH`;
validate empty temp store → read-only `FAIL` V-A2-1/STORE_SCHEMA with zero mutation; write guard
hard-false W-1(3)/(4); host probe → name not resolvable. Full census in decision record §12.

### 5. Gate state after this pass (unchanged where authority is withheld)

| Item | State |
|---|---|
| S1 identity values | **all three UNRESOLVED — AUTHORITY REQUIRED**; decision-ready PA request rendered (this pass), no determination performed |
| Gate A′ provisioning | **NOT AUTHORIZED** — inert entrypoint; no store/row/audit event |
| H-12 | **NOT ADOPTED** — R1/R2 preserved candidates; content verified under the effective amendment |
| Gate 4 / QE | **AUTHORIZED — NOT STARTED — 0/11**; host-gated and downstream of S1 |
| U4 / Gate C / Gate 5 / U6 | not rendered / not accepted / not granted / not authorized; `SESSION_ONLY`, `durable:false`, W-1 hard-false unchanged |
| IRR | strictly read-only; **0** mutations |
| Smallest next authorized action | **PA:** render the S1 three-value determination specified in decision record §6. **Preparation (standing grant):** keep entrypoint inert; once rendered, prepare the binding commit and H-12 regeneration as normal PR/CI/read-back candidates |

---

## CAP-02 PR #78 publication and remote read-back receipt — S1 identity-authority / H-12 readiness decision-request (2026-10-24)

### 1. Pull request and commits (verified against the remote)

| Item | Value |
|---|---|
| PR | [#78](https://github.com/ramkivs/iips-production-market-data/pull/78) — `CAP-02: S1 identity-authority and H-12 readiness decision-request (2026-10-24)`, base `main`, head `arena/3d7e0b42-iips-production-market-data` |
| Head commit | `d3a0fcf212213d31089589812b8dd5a95bce6e68`, tree `da624ea3a53211f8660e4fb4ebbe90afb92b7270` — 2 files changed, 615 insertions, 0 deletions outside the tracker append |
| Merge commit | **`4b84dc8178ad46f8ac0a6d51d5ca1db6412d6309`** (MERGED `2026-10-24T05:18:50Z`), parents `5e4e54db…` + `d3a0fcf…`; post-merge `main` tree `da624ea3a53211f8660e4fb4ebbe90afb92b7270` (clean merge; content tree identical to the reviewed head) |
| Files | new `IIPS_V3_CAP02_S1_IDENTITY_VALUE_AUTHORITY_H12_READINESS_DECISION_REQUEST_2026-10-24.md`; append-only edit to this tracker (78 lines, zero deletions) |

### 2. CI results

| Run | Ref | Checks | Result |
|---|---|---|---|
| `40065610153` | PR head `d3a0fcf…` (pre-merge) | `typecheck · build · test` (1 m 4 s); `executed test count` | **both SUCCESS** |
| `40065760217` | `main` push `4b84dc81…` (post-merge) | `typecheck · build · test`; `executed test count` | **both SUCCESS** |

The `executed test count` github-script gate (fail on zero tests or non-zero failures) passed; the local guarded suite on the identical tree was independently measured at **892 tests / 891 pass / 0 fail / 1 skipped / 123 suites**, `[test-guard] OK`, package-consumer PASS (shasum `cc2aa701…`, `durable:false`).

### 3. Independent remote read-back (GitHub Contents API, not the local object store)

| File | Git blob SHA-1 (remote == local) | Bytes | Raw SHA-256 (remote-decoded == local file) |
|---|---|---|---|
| `IIPS_V3_CAP02_S1_IDENTITY_VALUE_AUTHORITY_H12_READINESS_DECISION_REQUEST_2026-10-24.md` | `b11cc457805a7947bd2d90c9d8185b225c5722ff` | 52,212 | `f3d58c28f1b6f72eb195f3674ef813f05099fd430b55ad0cc1f2c818337ae9b3` |
| `IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md` | `e55ab50f78f6c80ad1e4298c29d2a538681f6f1f` | 84,527 | `27cdc898b09ff030d7ae7a331a8d9f4839b580e2710c53d79dc34bea81b802c9` |

Both paths resolve at `refs/heads/main@4b84dc81…`; blob IDs also match `git rev-parse origin/main:<path>` after a fresh `git fetch`. Every other identity cited inside the new record was re-derived live this pass and matches (12 Gate A′ designated blobs; manifest/validation/act/amendment blobs; IRR `a576e5af…`/`296dd5e3…`).

### 4. Cross-check against the IRR D-7 packet (read-only)

IRR `docs/integration/IIPS_v3.0_G4_DETERMINATION_RESOLUTION_PACKET_D1_TO_D12_2026-10-22.md` (blob `7d3b143e…`, recommendations-only) independently corroborates the new record: Q5/D-5 require Gate A′ evidence + Node `>=22.13.0 <23` + full H-12 validation and **express PA adoption** before any host preflight/QE; Q7/D-7 require manifest regeneration at the exact final execution commit and forbid silent re-pin; §7.2 confirms the Node 22 major requirement; §7.5 states Gate A′ is an external hard prerequisite needing its own provisioning record; DR-V4 records "zero identity-resolution matches in persistence/ipc". No identity value is named in that packet. No IRR object was modified.

### 5. Gate state after PR #78 (unchanged where authority is withheld)

| Item | State |
|---|---|
| S1 `principal_label` / `tenantId` / `canonicalOwnerId` | **UNRESOLVED — AUTHORITY REQUIRED**; decision-ready request published, no determination rendered, no value selected |
| Gate A′ provisioning | **NOT AUTHORIZED** — inert entrypoint (`IDENTITY_VALUES_UNRESOLVED` reproduced), no store/row/audit event |
| H-12 | **NOT ADOPTED** — R1/R2 preserved candidates; amended Alternative A membership byte-verified |
| Gate 4 / QE | **AUTHORIZED — NOT STARTED — 0/11** |
| U4 / Gate C / Gate 5 / U6 | not rendered / not accepted / not granted / not authorized; `SESSION_ONLY`, `durable:false`, W-1 hard-false unchanged |
| IRR | strictly read-only; **0** mutations; designated pin `4740ba21…` unchanged |

---

## CAP-02 S1 identity-value determination and binding commit — one-pass execution (2026-10-24)

**Session branch:** `arena/7c8457a2-iips-production-market-data`. **Baseline verified before any
mutation:** IPD `origin/main` = `6d8f161118a26ddb1486b3c5f1365f391cfaed8c`, root tree
`6c8cb2afff91a2cb92b52e69ad528f3377e557e3` (PR #79 merge; clean worktree; `git fetch --unshallow`
because the workspace clone was shallow — ancestry checks were not trusted before that). The predecessor
S1 decision request is preserved byte-identically at blob `b11cc457…`; this pass answers it and rewrites
nothing.

### 1. Governance outcome of this pass

| Item | Result |
|---|---|
| PA S1 identity-value determination | **RENDERED — EFFECTIVE ON PUBLICATION** — `IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01`, `evidence/cross-repository/IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md` (ID census before this pass: **`0`** hits) |
| Discharged reservation | successor act §4 (`IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01`), preserved unmodified (blob `528de6ae…`) |
| `principal_label` | **`ramki-personal-local`** |
| `tenantId` | **`ipd-personal-local`** |
| `canonicalOwnerId` | **`ipd-owner-ramki-personal`** |
| Deterministic ids | `binding_id` = `c5808abaffd072d6401ce63ad86c6ac0`; `membership_id` = `d25dcc5370100b00766efc5166f65cf3` |
| Value provenance | PA designation for this personal, local, single-user application. **`0`** prior occurrences of any of the three strings in the tree; **not** from an identity provider, **not** derived, **not** copied from IRR (`owner-7f3a91c2` / `irr-domain-4b82d6e1`), the offline marker `IIPS_OFFLINE_BOOTSTRAP`, the spent 2026-10-16 Gate A values, or any fixture |

### 2. Authorization inventory for this pass (dependency-aware)

| # | Task | Authority | Dependency | Class | Result |
|---|---|---|---|---|---|
| 1 | Record the S1 identity-value determination | PA explicit selection 2026-10-24; successor act §4 | none | **A** | **DONE** |
| 2 | Binding commit: constants + T-1…T-9 | successor act §4 last paragraph + §5.1/§5.2 | task 1 | **B** | **DONE** |
| 3 | Complete T-1…T-9 coverage (T-6, T-7, T-8 in the designated file; T-2 split; T-4 re-expressed) | successor act §5.4 | task 2 | **B** | **DONE** |
| 4 | Reconcile stale tracker/S1/Gate A′/H-12 status text additively | standing preparation/publication grant | none | **C** | **DONE** (this section) |
| 5 | Re-measure H-12 R2 staleness after the binding commit | Gate 4 act §8 / amendment; read-only | task 2 | **C** | **DONE** — `3` post-G3 entries + `10` of `1,140` dist files changed; R2 unadoptable as-is, measured |
| 6 | Integrity sweep: write guard, durability markers, import edges, no operational state | standing grant; W-1 / durability rules | none | **C** | **DONE** — all unchanged |
| 7 | H-12 regeneration at the final execution commit | successor act §8; Gate 4 act §8 (amended) | needs the *final execution commit*, which is fixed only when the provisioning/QE sequence runs | **D** | **NOT DONE — premature; would create a third stale candidate** |
| 8 | H-12 adoption | **separate express PA adoption act** | 7 + S2 native-Windows `npm test` + S1 P-1 provisioning | **D** | **NOT DONE — NOT ADOPTED** |
| 9 | Gate A′ P-1 provisioning execution | successor act §8 (value blocker now discharged) | designated host `desktop-no0nhtp` unreachable; no Node `>=22.13.0 <23` preflight; no P-1 path | **D** | **NOT EXECUTED** |
| 10 | Gate 4 / QE-1…QE-11 | Gate 4 act (effective) | Gate E §4 ordering: after provisioning; host-gated | **D** | **0/11** |
| 11 | U4 acceptance / Gate 5 / U6 writes | separate PA acts | executed QE evidence | **D** | **not rendered / not granted / not authorized** |
| 12 | CAP-03 DR-2 / DR-3 / DR-4r | PA decisions | none available | **D** | **UNRESOLVED — unchanged** |
| 13 | IRR B-1R repin | IRR's own act | IRR is read-only to this pass; IPD package prerequisite already published | **D** | **not executed — out of IPD scope** |

No task was invented; each row is traceable to an effective instrument or an existing tracker row.

### 3. Implementation scope — exactly the successor act §5.1 file set

| Path | Change |
|---|---|
| `src/persistence/gateAPrimeValidation.ts` | `PRINCIPAL_LABEL` / `TENANT_ID` / `CANONICAL_OWNER_ID`: `null` → the three determined values, with a provenance comment; `string \| null` retained so the null guard stays meaningful |
| `src/persistence/gateAPrimeProvisioning.ts` | identity gate extracted as the pure exported `assertIdentityValuesResolved(supplied, compiled)`, called by `authorizeExecution` with the module constants; check order, refusal codes and the module-private brand unchanged; **no injectable bypass** (single production caller) |
| `tests/g3_gate_a_prime_successor_provisioning.test.ts` | T-2 split (absent / mismatch), T-4 re-expressed, T-6 / T-7 / T-8 added, `args()` default now the determined triple |
| `tests/g3_startup_validation.test.ts` | **unchanged** (its static import-edge regression already covers both modules and still passes) |

Not changed: `package.json`, `package-lock.json`, `tsconfig*`, `vite.config.ts`,
`.github/workflows/**`, any migration, `provisioning.ts`, `binding.ts`, `audit.ts`, `connection.ts`,
`portfolio_store.ts`, `dispatch.ts`, any other test, any frontend path, any IRR path.
`BASIS_COMMIT`/`BASIS_TREE`/`GATE_A_PRIME_ACT_ID` stay exactly as the act fixed them (they identify the
act's selected basis, not the current tip).

### 4. T-1 … T-9 execution results (Linux, Node v22.22.3 — repository evidence, not host qualification)

| # | Result |
|---|---|
| T-1 wrong act id | **PASS** — `ACT_ID_MISMATCH`, store never created |
| T-2 absent / differing values | **PASS** — three absent shapes + whitespace ⇒ `IDENTITY_VALUES_UNRESOLVED`; three differing shapes ⇒ `IDENTITY_VALUE_MISMATCH`; store never created |
| T-3 environment-supplied value | **PASS** — `GATE_A_PRIME_TENANT_ID` ⇒ `ENVIRONMENT_VALUES_NOT_AUTHORIZED` |
| T-4 unbound build | **PASS (re-expressed)** — shipped triple is exactly the determined values and all-string (never partially bound); the surviving null guard refuses both all-null and partially-null compiled triples with `IDENTITY_VALUES_UNRESOLVED`; a refusal creates no store. Justification recorded in determination §8 |
| T-5 pre-existing rows | **PASS** — read-only classification of a provisioned store, SHA-256 unchanged; `ALREADY_PROVISIONED` path retained |
| T-6 non-win32 / wrong runtime | **PASS** — `linux` and `darwin` ⇒ `PLATFORM_UNSUPPORTED`; Node `24.14.0` on `win32` ⇒ `RUNTIME_UNSUPPORTED`; no store |
| T-7 forged brand shapes | **PASS** — `undefined`, `{}`, structural `{act:'gate-a-prime'}`, foreign-symbol forgery ⇒ 4/4 `ProvisioningNotAuthorizedError`, rows `0` before and after |
| T-8 static import edges | **PASS** — no guarded path imports either module; full `src/**` + `frontend/src/**` scan yields `0` importers of `provisioning.js` / `gateAPrimeProvisioning.js` |
| T-9 read-only validation | **PASS** — empty store ⇒ `FAIL` with zero bindings/memberships and identical bytes; valid fixture pair ⇒ `PASS`, identical bytes |

Focused suite: **12 tests / 12 pass / 0 fail** (was 7).

### 5. Full validation of this pass

`npm ci` exit `0` · `npx tsc --noEmit` exit `0` · `npm run build` exit `0` · `npm test` exit `0` —
**897 tests, 896 pass, 0 fail, 1 skipped** (`[test-guard] OK`; baseline before the change was
892/891/0/1) · `npm run test:package-consumer` `"result": "PASS"`, shasum
`cc2aa70186b8fd7bc7255452ac8d8b00d094f53e`, `SESSION_ONLY`, `durable:false` · focused regressions
`g3_startup_validation` 20, `g3_binding_resolution` 13, `g3_write_gate` 9,
`q1_ownership_source_readiness` 4, `g3_caller_authority` 103 — all pass.

Refusal probes on the built entrypoint (all exit `1`, probe directory **empty** afterwards):
`PLATFORM_UNSUPPORTED` with the correct values on Linux · `ACT_ID_MISMATCH` · `IDENTITY_VALUE_MISMATCH` ·
`ENVIRONMENT_VALUES_NOT_AUTHORIZED` · `--mode=validate` on a non-existent path. No `*.sqlite`/`*.db`
exists anywhere in the tree.

### 6. Measured effect on the H-12 R2 candidate (it remains NOT ADOPTED)

`IIPS_V3_CAP02_G4_H12_MANIFEST_V3_RECONCILED_CANDIDATE_2026-10-23.json` blob `9382d4b0…` was verified
at the pre-publication baseline as `7/7` post-G3 entries, `10/10` anchors and `32/32` mandatory IPD
entries present and matching. After the binding commit: **`3`** of the `7` `post_g3_cap02_qualified_surface_entries`
(`gateAPrimeProvisioning.ts`, `gateAPrimeValidation.ts`, `tests/g3_gate_a_prime_successor_provisioning.test.ts`)
and **`10`** of the `1,140` `runtime_dist_set` files differ (`1,130/1,140` byte-identical, `0` missing).
`R2` was already a pre-amendment candidate; it is now also content-stale. **It cannot be adopted as-is,
by measurement.** Regeneration is deferred to the final execution commit (inventory row 7, class D).

### 7. Gate state after this pass

| Item | State |
|---|---|
| S1 identity values | **DETERMINED — `ramki-personal-local` / `ipd-personal-local` / `ipd-owner-ramki-personal`**; effective on publication of this PR |
| Gate A′ provisioning | **value blocker discharged · NOT EXECUTED** — still gated by successor act §8 (designated `win32` host, Node `>=22.13.0 <23`, non-existent P-1 store); `win32` restriction empirically enforced on Linux |
| H-12 | **NOT ADOPTED** — `R1`/`R2` preserved candidates; `R2` now measurably content-stale |
| Gate 4 / QE | **AUTHORIZED — NOT STARTED — 0/11** |
| U4 / Gate C / Gate 5 / U6 | not rendered / not accepted / not granted / not authorized |
| W-1 guard | hard-false: `["W-1(3): Gate 4 qualification not accepted","W-1(4): Gate 5 admission not accepted"]` |
| `SESSION_ONLY` / `durable:false` | unchanged in the shipped UI port and in the package-consumer report |
| Schema / migrations | unchanged (`001 f594a182…`, `002 932af8e6…`, `003 32b125bf…`, `004 6bad5a50…`) |
| IRR | not contacted; read-only; **0** mutations |
| CAP-03 DR-2 / DR-3 / DR-4r | **UNRESOLVED — PA decisions required** (unchanged) |

---

## CAP-02 PR #80 publication and remote read-back receipt — S1 identity-value determination and binding commit (2026-10-24)

### 1. Pull request and merge (verified against the remote)

| Item | Value |
|---|---|
| PR | [#80](https://github.com/ramkivs/iips-production-market-data/pull/80) — `CAP-02: S1 identity-value determination and binding commit (2026-10-24)`, base `main`, head `arena/7c8457a2-iips-production-market-data` |
| Head commit | `f9ec0c5fd4c689360264b4f7a8b85fdf823d4374`, tree `fcf7cb85ad7f53c20d5cfd8721bfecf7fc13a129` |
| Merge commit | **`d8568b0ebe2bec2a7a2f38ed758e1f877f861704`** (`2026-10-24T06:15:53Z`), tree `fcf7cb85ad7f53c20d5cfd8721bfecf7fc13a129` — identical to the reviewed head tree (clean merge) |
| Ancestry | `f9ec0c5f…` verified an ancestor of `origin/main` after merge |
| Prior `main` | `6d8f161118a26ddb1486b3c5f1365f391cfaed8c` / tree `6c8cb2afff91a2cb92b52e69ad528f3377e557e3` |
| Changed paths | **exactly `5`**, listed below — no other path |

```text
added     evidence/cross-repository/IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md   410 +  0 -
modified  evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md                        113 +  0 -
modified  src/persistence/gateAPrimeProvisioning.ts                                                            58 + 17 -
modified  src/persistence/gateAPrimeValidation.ts                                                              25 +  4 -
modified  tests/g3_gate_a_prime_successor_provisioning.test.ts                                                 201 + 12 -
```

The tracker edit is **append-only** (`113` insertions, `0` deletions). No earlier evidence record was
edited, and the predecessor S1 decision request is byte-identical at blob `b11cc457…`.

### 2. CI results

| Run | Ref | Checks | Result |
|---|---|---|---|
| `40069388650` | PR head `f9ec0c5f…` (pre-merge) | `typecheck · build · test`; `executed test count` (`120799588077`) | **both SUCCESS** |
| `40069514698` | `main` push `d8568b0e…` (post-merge) | `typecheck · build · test`; `executed test count` (`120799946074`) | **both SUCCESS** |

The post-merge `executed test count` check reports: **897 tests executed — 896 passed, 0 failed** at
head `d8568b0ebe2bec2a7a2f38ed758e1f877f861704`. The `typecheck · build · test` job's steps all
succeeded, including `Install (locked)`, `Typecheck`, `Build`, `Test (guarded — zero tests is a
failure)` and `Public package consumer (pack + IRR importers)`.

### 3. Independent remote read-back (GitHub Contents API at `refs/heads/main`, not the local object store)

| Path | Git blob SHA-1 (remote) | Bytes | Raw SHA-256 (remote-decoded) | remote == local |
|---|---|---|---|---|
| `IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md` | `b7746b5ed955abcf689ec57ca4a0748c0241ed09` | 35,936 | `554741c70e3a24a794be297f463707894c4ce7e0e2a4f5aad0c97dd6b3c5f12c` | **true** |
| `src/persistence/gateAPrimeValidation.ts` | `df5d48a583c9aaed51af90a90225c15c408fbd33` | 15,688 | `c307549a38033f9b2ce03973bc0a5e0eacbf7e9132695ea1fc7ae09fa9bbe3ce` | **true** |
| `src/persistence/gateAPrimeProvisioning.ts` | `2cbce83f6572d211630ce0620dae49fa02fe4622` | 15,727 | `0bd6d134405dbcab27f5639c3e22a856c778daa9fd414d2cb0e26e5b03919aa3` | **true** |
| `tests/g3_gate_a_prime_successor_provisioning.test.ts` | `f2d0ab37ad4fbdae6db69a4316affc0a33704bf3` | 16,160 | `d45140f2727651da3d69f0655ad5a8fd8621ffaa45c52f0633920d34e7a74873` | **true** |
| `IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md` | `027f39eb9fa2d504b9ba3dfc84f08f1d4a265557` | 98,966 | `c32db72ddb95caaacf1402f12e8dcc0be1dfe19a027852d9812be89b6d9b559d` | **true** |

Every path resolved at `refs/heads/main@d8568b0e…`. The determination is therefore **EFFECTIVE** on the
terms of its §13. Remote content contains the three values verbatim; the compiled constants at `main`
are exactly `ramki-personal-local` / `ipd-personal-local` / `ipd-owner-ramki-personal`.

*(The tracker blob in this table is the one published by PR #80. This receipt append necessarily
produces a later tracker blob; the receipt for that append, if any, is a separate publication fact and
is not claimed here.)*

### 4. What this receipt does and does not establish

**Establishes:** the S1 identity-value determination and the binding commit are published and remotely
verified on the authoritative ref; the three values are effective for this personal, local,
single-user application; T-1…T-9 pass on the merged tree; CI is green on the merge commit.

**Does not establish:** any provisioning execution or store/row/binding/membership/audit event (none
exists); any host preflight, native-Windows QE or Gate 4 qualification (0/11); any H-12 adoption or
manifest promotion (`R2` is now measurably content-stale — `3` post-G3 entries and `10` of `1,140`
`dist` files); any U4 acceptance, Gate 5 admission or U6 write authorization; any change to W-1,
`SESSION_ONLY` or `durable:false`; any IRR mutation; any CAP-03 DR-2/DR-3/DR-4r resolution.

### 5. Smallest next authorized action

**Program Authority / operator of `desktop-no0nhtp`:** run the successor act §8 P-1 sequence on the
designated Windows host (Node `>=22.13.0 <23`, flag-free `node:sqlite`, non-existent absolute store
outside every Git worktree), publishing the V-A2-1…V-A2-8 receipt. That single execution is the next
dependent step; it cannot be performed from a Linux workspace, and the `win32` restriction is enforced
by the entrypoint itself (empirically: `PLATFORM_UNSUPPORTED` on Linux with the correct values).
Everything downstream — H-12 regeneration at the final execution commit, native-Windows `npm test`,
QE-1…QE-11, U4/U5/U6 — remains blocked behind it.

---

## CAP-03 dependency-aware one-pass — A1 verification, DQ-1…DQ-7 packet and host readiness (2026-10-24)

**Session branch:** `arena/e3526bec-iips-production-market-data`. **Status:** preparation only. This
append records no Program Authority decision, no implementation, no freeze, no H-12 adoption, no
provisioning, no QE result, no acceptance or admission, and no write authorization. Full text of the two
records is in their own immutable artifacts; this entry is the tracker pointer.

### 1. Step 0 — re-verified before mutation

| Item | Measured value |
|---|---|
| IPD `main` / tree | `1864f908b26322071a866cc3a3dab074faa536fd` / `4a28a3b819e00fe999079727d3cdf8a1d8fb5155`; full history; clean worktree |
| IPD main CI | run `40069710927` **success** (`typecheck · build · test`, executed-test-count check) |
| IRR `main` / tree (read-only) | `4d14780f0db66a891f552926ee2badaf56acfa2d` / `742ac4d4c8817bab9aa2cbeaac138d9a72c2934e`; full-history bare clone |
| IRR main CI | run `39999128417` **success** |
| Open PRs | IPD draft #42 head `afa43090…` (`DIRTY/CONFLICTING`); IRR #204 head `dee114ae…` (`MERGEABLE/CLEAN`). Both heads non-ancestors of their `main`; neither used as a base or merged |
| Fence / contract anchors | all four blobs byte-identical at IRR `main`: `51704c12…`, `cb8db45d…`, `e6b57bb8…`, `98147054…`; no mismatch, no edit |
| Package pins | primary `2d9130e7…` (tree `46586991…`) guarded; alias `70b24f02…` (tree `cc0f0117…`) unguarded; **both** full-history ancestors of IPD `main`; no re-pin |
| G24 | reference-only ancestry re-checked on full history: `6828155e…`, `c1b955b4…`, `2ded0e98…` are **not** ancestors of IPD `main`; IRR `470cc698…`, `5eba01b6…` are **not** ancestors of IRR `main`; no merge/cherry-pick/port/promotion |

**A1 result:** the PR #80 substantive record and PR #81 receipt already exist on `main` with green
exact-head and post-merge CI and remote read-back of the S1 determination (blob `b7746b5e…`, 35,936 B) and
the tracker (blob `e131d428…`, 104,742 B). No receipt was missing; nothing was published for A1.

### 2. Authoritative label reconciliation applied

- **P01/P02/P03 are discharged** by the effective successor act, the S1 determination/binding commit and
  PR #80/#81. They are **not** re-opened as pending PA decisions.
- **P04 moves from G to Q.** The remaining condition is host execution of the single P-1, not another
  identity-value decision.
- **P08/O-02:** Gate 4 is **`AUTHORIZED — NOT STARTED`**, not unauthorized. Remaining: DQ-4 sequencing,
  DQ-5 host/store confirmation, final pins and H-12 adoption.
- **P07/DR-4:** the IPD schema half is closed by effective migration `004`; only the CAP-03 consumer half
  (DR-4r) is open.
- **CV-52 is Gate 5 portfolio admission, not a Reports item.** Reports remains CV-21/CV-51.
- **O-07 splits F6 from TD-7b.** `F6_INVENTORY_AUTHORIZED` is a discrete question; **TD-7b is production
  and outside this non-production pass**.
- Rows 8, 14, 16, 21, 23, 29, 33, 40, 41, 44, 51 remain closed/deferred/OOS; row 34 remains correct
  `503` behaviour. No row was moved by this pass.

### 3. Records published as PROPOSED / readiness only

| Record ID | Path | Status |
|---|---|---|
| `IIPS-V3-CAP03-PA-DECISION-PACKET-DQ1-DQ7-2026-10-24-01` | `evidence/cross-repository/IIPS_V3_CAP03_PA_DECISION_PACKET_DQ1_DQ7_2026-10-24.md` | **PROPOSED — NOT EFFECTIVE**; options, evidence, recommendations, consequences and proposed manifests for DQ-1…DQ-7 |
| `IIPS-V3-CAP03-HOST-READINESS-PACKET-2026-10-24-01` | `evidence/cross-repository/IIPS_V3_CAP03_HOST_READINESS_PACKET_2026-10-24.md` | **NOT READY — NOT EXECUTED**; preflight checklist, P-1 procedure template, V-A2 template, QE tier-labelled matrix at undesignated pins, digest procedure, blocker list |

Both record IDs and filenames returned **0** prior hits in IPD and IRR before allocation.

### 4. Validation executed on this documentation-only tree

| Check | Command | Result |
|---|---|---|
| Install | `npm ci --no-audit --no-fund` | exit `0` |
| Typecheck | `npx tsc --noEmit` | exit `0` |
| Build | `npm run build` | exit `0`; **1,140** files under `dist/**` |
| Full guarded suite | `npm test` | exit `0` — **897 tests / 896 pass / 0 fail / 1 skipped**, `[test-guard] OK`; 68 source suite files |
| Package consumer | `npm run test:package-consumer` | `"result": "PASS"`, pack 121 files / 239,032 B, shasum `cc2aa70186b8fd7bc7255452ac8d8b00d094f53e`, `"durability":"SESSION_ONLY"`, `"durable":false` |
| Focused Gate A′ | `g3_gate_a_prime_successor_provisioning` | 12/12 pass |
| Focused startup / binding / write / durability / caller | `g3_*` | 20/20 · 13/13 · 9/9 · 6/6 · 103/103 |
| Focused contract / ownership / broker durability / Limb A | `q1_*`, `g4_*` | 3/3 · 4/4 · 18/18 · 10/10 |
| Store census | `find` for `*.sqlite` / `*.db` outside `node_modules` | **0** files |
| Documentation scope | `git diff --check`; no source/test/package/CI/migration change | clean; documentation only |

These are **repository implementation checks**, not host qualification, QE, provisioning or acceptance.

### 5. Exact stop and next condition

No rendered DQ act exists, so Track B implementation/freeze and the PR #42/Reports/D115 dispositions did
not start. The designated host is unreachable (`ping desktop-no0nhtp` → `Name or service not known`) and
no store/endpoint/final pin/adopted H-12 exists, so Track C did not start. QE remains **0/11**.

**Next condition:** the Program Authority renders the separable DQ-1…DQ-7 answers. The first dependent
actions are then the exact-manifest implementations (DQ-1/2/3), followed by DQ-4 freeze/pin designation
and DQ-5 host/store confirmation. No host action, write, fence lift, adoption, acceptance or admission is
authorized by this append.

---

## CAP-03 PR #82 publication and remote read-back receipt — DQ packet and host readiness (2026-10-24)

### 1. Pull request and merge

| Item | Value |
|---|---|
| PR | [#82](https://github.com/ramkivs/iips-production-market-data/pull/82) — `CAP-03: DQ-1..DQ-7 PA decision packet and host readiness blocker (PROPOSED)` |
| Head commit / tree | `a4fc8c0630cbf75d50c9f4fef5450dfb64c29036` / `07b51a74e61230ad22a73a3fce4bbd209eca40a8` |
| Merge commit / tree | **`793e0f96f612a0bf76325163110d5f87b6fed88d`** / `07b51a74e61230ad22a73a3fce4bbd209eca40a8` (`2026-10-24T06:58:15Z`) — merge tree identical to the reviewed head tree |
| Prior IPD `main` | `1864f908b26322071a866cc3a3dab074faa536fd` / `4a28a3b819e00fe999079727d3cdf8a1d8fb5155` |
| Changed paths | **exactly 3**, all documentation: the two CAP-03 records added; tracker append `+79/−0`. No source, test, script, package, CI, migration, manifest or pin change |
| PR-head CI | run `40072184337` — `typecheck · build · test` **SUCCESS**; `executed test count` (check `120808053075`) **SUCCESS — 897 executed / 896 passed / 0 failed** |
| Post-merge CI | run `40072288312` — **SUCCESS**; `executed test count` (check `120808369255`) **SUCCESS — 897 / 896 / 0** at `793e0f96…` |

### 2. Remote read-back at authoritative `main@793e0f96…`

| Path | Git blob SHA-1 | Bytes | Raw SHA-256 |
|---|---|---:|---|
| `IIPS_V3_CAP03_PA_DECISION_PACKET_DQ1_DQ7_2026-10-24.md` | `f96492c1124c0e1d30d7474575ec76d58a0c7c3d` | 46,359 | `0dda89e8e38cdc95dcf01a7db4ae77e0dcaf4a5d495c83f77ebbd071f9c095c8` |
| `IIPS_V3_CAP03_HOST_READINESS_PACKET_2026-10-24.md` | `9d9c5970f66b1c901a2b5d28c02e8c9562078cf2` | 20,923 | `1ea2637f29a0c42497a0ef2232514b977147131afebfa6f557295b4706a90360` |
| `IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md` (as published by PR #82) | `877f88845631b021620f49ee3b97025fdace7275` | 110,577 | `cc66a3637eaad8b84dedcfe7acc6a558e2f3247a9d7f1fa7c8c2ab9b7c205ec9` |

Each blob resolved at `refs/heads/main` through the GitHub Contents API and matched the local object
byte-for-byte. This receipt append necessarily produces a later tracker blob; that later blob is a
separate publication fact and is not claimed here.

### 3. What this receipt establishes and does not establish

**Establishes:** the DQ-1…DQ-7 packet and the host readiness/blocker packet are published as
**PROPOSED — NOT EFFECTIVE** / **NOT READY — NOT EXECUTED** on the authoritative ref; A1 was verified and
skipped; Step 0 checks passed; the documentation-only tree executed 897 tests with zero failures.

**Does not establish:** any PA decision or option selection; any contract implementation; any final pin
or H-12 adoption; any provisioning, store, binding, membership or audit row; any host contact, preflight,
canonical host test or QE result (`0/11`); any U4/Gate C acceptance; any Gate 5 admission; any write,
fence lift, `SESSION_ONLY`/`durable:false` change, production eligibility, production `durable:true` or
`TD-7b`; any Reports/D115/F6 action; any IRR mutation.

*End of the PR #82 receipt.*

---

## CAP-03 — IRR post-baseline movement receipt (2026-10-24)

**Record:** `IIPS-V3-CAP03-IRR-POST-BASELINE-MOVEMENT-RECEIPT-2026-10-24-01`
(`evidence/cross-repository/IIPS_V3_CAP03_IRR_POST_BASELINE_MOVEMENT_RECEIPT_2026-10-24.md`). Dated
cross-repository receipt only; **no Program Authority decision and no IRR mutation**.

| Fact | Value |
|---|---|
| IRR baseline at this pass's Step 0 | `4d14780f0db66a891f552926ee2badaf56acfa2d` / tree `742ac4d4…` |
| IRR `main` after the pass | **`d6d25197b6f3c16e7e1adb12ca2522aa947992ba` / tree `600301b3807135eb14ea27fa9c4b4ef0e3520742`** |
| Movement | external PRs #233 (merge `9b62979…`, `2026-10-24T06:53:31Z`) and #234 (merge `d6d2519…`, `2026-10-24T06:58:38Z`); old main is an ancestor; one changed path — the master tracker |
| Current IRR tracker identity | blob `8205bc168693c217e9e0e0f1cb1b9b822fb7829e`, 1,766,761 B, raw SHA-256 `4944acc6a060d79947fe8754455f433a43da846f9d52d816f63b1e3f2b357eec` |
| New IRR main CI | run `40072312965` **success** |
| IRR PR #204 | **CLOSED externally** `2026-10-24T06:48:22Z`, not merged; head `dee114ae…` not an ancestor of `main`; IRR open PRs now `[]` |
| Preserved at new tip | fence/contract blobs `51704c12…`, `cb8db45d…`, `e6b57bb8…`, `98147054…`; package manifests `6274537a…`/`05ade78c…` — all unchanged |
| DQ acts | **none** appeared; the new §16.95 content records DR-2/DR-3/DR-4r unresolved, P04 host-gated, H-12 NOT ADOPTED, Gate 4 AUTHORIZED—NOT STARTED, QE 0/11 |

The published DQ packet remains valid as a preparation record; its IRR coordinate is historical as of
Step 0 and is not rewritten. This movement does not move any DQ answer, designate a final pin, change a
fence/pin or alter the host blocker. No IRR file, branch, PR, issue or comment was modified by this pass.

---

## CAP-03 PR #84 publication and remote read-back receipt; final observed IRR snapshot (2026-10-24)

### 1. PR #84

| Item | Value |
|---|---|
| PR | [#84](https://github.com/ramkivs/iips-production-market-data/pull/84) — `CAP-03: dated IRR post-baseline movement receipt` |
| Head / tree | `b827c0bcb12219422778f65a24166fa5685942ba` / `232472ae01424c33f3c6f705a70a04d5ba019aae` |
| Merge / tree | **`6a056c0e677b3754eb56bf45635f531892a41c17`** / `232472ae01424c33f3c6f705a70a04d5ba019aae` (`2026-10-24T07:05:40Z`); merge tree = head tree |
| Prior `main` | `7b310af4cff0351dd26f52b91064383188059781` / `472ce73592d0a97144461da4ce988ec43d763f57` |
| Changed paths | exactly 2: movement receipt added; tracker append `+23/−0` |
| PR-head CI | run `40072688768` **success**; check `120809570600` — **897 / 896 / 0** |
| Post-merge CI | run `40072783369` **success**; check `120809767717` — **897 / 896 / 0** at `6a056c0e…` |
| Read-back | movement receipt blob `e25dc1701827bafa4bca8df07a0cd71b3f97e2f8`, 6,975 B, raw SHA-256 `82831cfee9dc39b7081201267b2d16d73fe142db1e60610a272d4c83b22b61d6`; tracker-as-merged blob `e010b1e00ddb5b872e35871efaad9a821095bf79`, 115,467 B, raw SHA-256 `12b5995c8d46aedcd0a2b99e18349d81acca03a6d9fcf9fd378a16a2b54cc5e0` |

### 2. Final observed IRR coordinate for this pass

At preparation of this receipt, IRR `main` was observed at **`a5e72dc4d7b1e76ad19e591f427ef3b58d6f9ac8`**,
tree **`49aab1feda71278e259e9f9bd7f997b46588871e`**, after external documentation-only PR #235
(`docs(runbook): re-stamp pin and §8 figures at measured head values (§16.96, CV-CORR-79)`) merged at
`2026-10-24T07:05:13Z` with main CI `40072753782` **success**. PR #235 changed exactly the IRR master
tracker and `docs/OPERATOR_RUNBOOK.md`; it is the routine O-09 runbook re-stamp and creates no DQ act.

The earlier movement receipt's `d6d25197…`/tree `600301b3…` remains accurate for its stated snapshot;
`a5e72dc4…` is the later observation. IRR open PRs were `[]` at this snapshot. Fence/contract blobs
(`51704c12…`, `cb8db45d…`, `e6b57bb8…`, `98147054…`) and package manifests (`6274537a…`, `05ade78c…`)
remained byte-identical at the observed tip. No DQ act, final pin, H-12 adoption, provisioning, QE result,
acceptance or admission appeared; **DR-2/DR-3/DR-4r remain unresolved**, QE remains **0/11**.

This snapshot is observation only. It does not make the IRR tip a final consumer pin, move any CAP-03
anchor, or claim that no further external documentation movement can occur. No IRR mutation was made by
this pass.

*End of the PR #84 receipt and final observed IRR snapshot.*
