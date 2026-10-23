# IIPS v3.0 — CAP-02 B-1R Package Reconciliation and Gate 4 Preparation Record

> **STATUS: INVESTIGATION AND PERMITTED PREPARATION COMPLETE — PACKAGE BLOCKER OPEN; GATE 4 NOT QUALIFIED.**
> Evidence/reconciliation record only. This is not an authority act, package implementation, gate execution or acceptance.

| Field | Value |
|---|---|
| Date | `2026-10-23` (UTC) |
| IPD repository | `ramkivs/iips-production-market-data` |
| Session branch | `arena/7b04bc0f-iips-production-market-data` |
| IPD authoritative baseline inspected | `main@24e62c80f37e8a55c34747581a68209c67b775a`, tree `d5eb798b7455711f7e46bfaec89fdca551fa0f3d` |
| IRR read-only baseline inspected | `main@3f628cbc15d0a4712980dc9c9e378edf062be67e`, tree `eb807be6c9b02062c060a7a0793b3733e80612b6` |
| Worktree before evidence edits | Clean; session branch at the same commit/tree as IPD `main` |
| Mutation boundary | IPD documentation/tracker only. No IPD source/package implementation and no IRR file, ref, PR, issue, comment or tracker was modified. |

## 1. Authority and status reconciliation

| Record / fact | Current disposition | Consequence for this pass |
|---|---|---|
| Standing PA assignment and user constraints | Routine in-scope investigation, documentation, tests, publication and verification are authorized. Explicit effective-act boundaries still control implementation scope. | Investigation, local compatibility probes, tests and this tracker/evidence update proceed without repeat approval. |
| IPD Increment A package act, `IIPS_V3_CAP02_INCREMENT_A_PACKAGE_EXPORT_IMPLEMENTATION_ACT_2026-10-23.md` | **Effective for its exact manifest only:** the `./portfolio-ui` package entry and its named packaging/test/publication files. It expressly excludes scope expansion and gate/write movement. | It does not authorize `./pit`, `./d114-non-production`, a PIT service, a security-identity contract change or D114 non-production population APIs. |
| IRR U0 placement decision and effective composition act, including its dated §12 correction | U0 is effective. The composition act authorizes B-1R's plain dependency repin only after its own package/consumer verification prerequisites pass. The correction records B-1R as **authorized but not executed**, awaiting IPD `main` exports for `./pit` and `./d114-non-production`. | IRR remains read-only. No repin or IRR consumer edit was made. A packaging act is an IPD-side prerequisite, not authority to invent or widen the missing IPD API. |
| IRR G1-B2 PIT/D114 capability record | The record present in inspected IRR `main` is headed **PREPARED — NOT IN FORCE** and says PIT/D114 remain not admitted for G2 until its stated authority/publication conditions are satisfied. | It is not used as effective consumer-admission authority. The B-1R status comes from the effective composition act and its dated correction, not from this prepared record. |
| IPD Stage-5 D114 authority and validation | Non-production/offline bootstrap and local fixture validation only. Production historical acquisition, live network execution and production deployment remain unauthorized. | No historical acquisition, network activity, deployment or broader D114 qualification is inferred or performed. |
| Off-main IPD `np04-governed-persistence-windows` (`2e11fa3b…`) and its IU-1/IU-2 records | Comparison material only; the ref is not the IPD `main` baseline and does not supply current-main authority. | No cherry-pick, merge, repin, source substitution or implementation from that line. |

**Authority conclusion:** no currently effective IPD act located on IPD `main` covers the required PIT/D114 subpaths and the current-main API changes needed by the actual consumers. The Increment A act is insufficient for that scope. Under the user's explicit constraint, the package blocker is **not resolved by implementation** in this pass.

## 2. Actual IRR consumers and import surface (read-only)

The inspected IRR `main` has five files with actual package import declarations. The IRR register's six-file list also names `frontend/src/api/pit.test.ts`; that file mentions the package only in comments and has no package import. No `./persistence` import was found.

| IRR `main` file | Direct imports and use |
|---|---|
| `frontend/server/pit/ipdPitReadAdapter.ts` | Runtime `PitReadService`; type-only `DataProvenanceDTO` and `PointInTimeStore`, from `.../pit`. Constructs the service over an injected store and calls `queryAsOf({ securityId, domain, asOf })`; expects found/miss result semantics, `resolvedAsOf`, the selected security/domain, payload and six provenance fields. |
| `frontend/server/pit/nonProductionPitStore.ts` | Runtime `PointInTimeStore`; type-only `CanonicalEnvelope` and `DataDomain`, from `.../pit`. Appends fixture envelopes that include `securityId`. |
| `frontend/server/pit/nonProductionRuntimePitStore.ts` | Runtime `PointInTimeStore` and `populateNonProductionD114Pit`; one shared in-memory store is used for non-production fixture and D114 data. |
| `frontend/server/pit/pitRuntimeIntegration.test.ts` | Runtime `PointInTimeStore` and `PitReadService`; exercises `append`, `queryAsOf`, `getRecordCount` and the IRR server path. |
| `frontend/server/pit/pitD114RuntimeIntegration.test.ts` | Runtime `PointInTimeStore`, `PitReadService`; `createNonProductionD114PitStore`, `populateNonProductionD114Pit`, `ingestNonProductionD114Archives`; `NON_PRODUCTION_D114_EQ`, `_BL`, and `_VINTAGE_1/2/3`. Also calls `append`, `getRecordCount`, `listAdmittedSeriesKeys` and `queryAsOf`. |
| `frontend/src/api/pit.test.ts` | **Not a direct importer.** The IPD package names occur in a comment describing the transitive runtime path; imports are from IRR-local modules. |

All actual IPD package importers are server-side or tests. No browser module directly imports either PIT/D114 subpath.

## 3. IPD `main` package and source compatibility findings

### 3.1 Package declaration and published output

At IPD `main@24e62c80…` (`package.json` blob `f7146b67d44fc7d1c016f34b10307b46e3921a7f`):

- The `exports` map contains only `./portfolio-ui` (`types` and `import` conditions). Neither requested PIT/D114 subpath is exported.
- `files` is limited to `dist/package`; `prepare`/`prepack` build the existing portfolio UI package.
- `tsconfig.portfolio-ui-package.json` (blob `b5395d7b79f2ceacf9e0413bd920164d477ff44d`) has the single root input `src/ui/portfolio_ui_package.ts`.
- Runtime import results: `./pit` and `./d114-non-production` both fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`; `./portfolio-ui` resolves with 22 runtime exports.
- A temporary external TypeScript consumer probe reports TS2307 for both missing subpaths (three diagnostics across its imports; exit 2).
- `npm pack --dry-run --json`: 95 files, 217,073 packed bytes, 2,615,683 unpacked bytes. The compiled package contains the UI entrypoint and its transitive UI/domain dependencies; it contains no `dist/package/src/pit/**` or `dist/package/src/d114/**` artifacts.

These facts establish the export/build blocker; they do not justify adding the exports.

### 3.2 Current-main source APIs are not consumer-compatible

| Required capability | Current IPD `main` finding |
|---|---|
| `PointInTimeStore` | Present (`src/pit/pit_store.ts`, blob `9c17b4647b9bc2bdf337cf736c3605efe8f7b484`), with `append`, `queryAsOf`, `queryRange`, `getRecordCount` and `clear`. Its key is `${companyId}:${domain}` and `PITQuery` requires `companyId`; it is not keyed or queried by the IRR `securityId`. |
| `CanonicalEnvelope` | Present (`src/contracts/envelope.ts`, blob `4c4713af57e280c4e1d425dbad7b62d0d6c6778c`), requires `companyId` and has no `securityId`. The IRR fixture constructs an envelope with `securityId`; the current type does not express that contract, and the current store does not use it in its key. |
| `DataDomain` / `DataProvenanceDTO` | Present (`types.ts` blob `47a40c7f…`; `provenance.ts` blob `459c77a4…`). The domain union includes D01/D02 and the provenance DTO contains the six fields projected by the IRR adapter, plus other fields. These compatible pieces do not repair the store/query mismatch. |
| `PitReadService` | Absent from IPD `main`; no `src/pit/pit_read_service.ts` and no exported class. Current `PointInTimeStore.queryAsOf` returns an envelope/undefined and accepts company/domain/asOf, not the service's securityId-addressed found/miss result with `resolvedAsOf`. |
| `listAdmittedSeriesKeys` | Absent from current `PointInTimeStore`; required by the IRR D114 integration test. |
| D114 non-production package symbols | Absent from `src/d114` on current `main`: the non-production store/population/archive wrappers and named EQ/BL/vintage constants are not present. `HistoricalPitIngestionLoader` exists, but is not the consumer's missing wrapper/API. |
| Packaging entrypoints | `src/pit/package.ts`, `src/pit/pit_read_service.ts`, `src/d114/non_production_package.ts` and `src/d114/non_production_pit_population.ts` are absent on current `main`. |

Therefore, merely mapping two new package subpaths to existing barrels would still not satisfy actual consumers. Both the package/export layer and the current-main API/identity mismatch must be covered by effective scope and then verified; a no-op export or off-main substitution would misrepresent compatibility.

### 3.3 Source dependency-closure census

A read-only TypeScript-AST walk followed relative imports/re-exports from each root, including type imports and static dynamic imports. The current-main rows describe existing source barrels only; they are not package exports. The final two rows inspect the entrypoints at the recorded off-main pin solely as comparison—their source and authority are not promoted to IPD `main`.

| Repository/ref and source root | Local source files | External module specifiers | Finding |
|---|---:|---|---|
| IPD `main@24e62c80…`: `src/pit/index.ts` | 7 | none | `index.ts`, `corporate_actions.ts`, `pit_store.ts`, `contracts/d04_corporate_actions.ts`, `contracts/envelope.ts`, `contracts/provenance.ts`, `contracts/types.ts`. No `PitReadService` or security-aware store exists in this closure. |
| IPD `main@24e62c80…`: `src/d114/index.ts` | 15 | `crypto`, `zlib`, `fs`, `path` | Broad barrel includes parser/adapter/loader plus historical-feasibility, evidence-reconciler and evidence-handoff modules. It is not a narrow non-production package entrypoint. |
| Comparison only, off-main `2e11fa3b…`: `src/pit/package.ts` (the pin's `./pit` root) | 6 | none | `package.ts`, `pit_read_service.ts`, `pit_store.ts`, `contracts/envelope.ts`, `contracts/provenance.ts`, `contracts/types.ts`. This closure carries the securityId-addressed service/store absent from IPD `main`; this difference is not authority to transfer it. |
| Comparison only, off-main `2e11fa3b…`: `src/d114/non_production_package.ts` (the pin's `./d114-non-production` root) | 13 | `crypto`, `zlib` | `non_production_package.ts`, `non_production_pit_population.ts`, `pit_ingestion_loader.ts`, `unified_historical_adapter.ts`, `cm_udiff_parser.ts`, `legacy_bhavcopy_parser.ts`, `normalization/time_normalizer.ts`, `pit/pit_store.ts`, and contracts `d01_quotes`, `d02_ohlcv`, `envelope`, `provenance`, `types`. No unresolved local import in the census. This is a Node-oriented offline/non-production path, not production acquisition. |

### 3.4 Comparative off-main export surface (not current-main authority)

At `2e11fa3b…`, `package.json` declares `./pit`, `./d114-non-production` and `./persistence`; its `tsconfig.pit-package.json` compiles the three package roots. The PIT entry exports `PitReadService` and its request/result/hit/miss/failure-reason types; `PointInTimeStore`, `buildPitKey` and `PITQuery`; plus `CanonicalEnvelope`, `DataDomain` and `DataProvenanceDTO`. IRR's actual importers do not import `buildPitKey` or the `./persistence` subpath. The D114 entry exports `createNonProductionD114PitStore`, `populateNonProductionD114Pit`, `ingestNonProductionD114Archives`; `NON_PRODUCTION_D114_ARCHIVES`, `_DISPOSITION`, `_ISIN`, `_SYMBOL`, `_EQ`, `_BL`, `_DATE_1/2/3`, `_VINTAGE_1/2/3`; `NonProductionD114Archive`, `NonProductionD114Population`, `ArchiveIngestionResult` and `HistoricalPitIngestionLoader`. The actual D114 test imports only the three functions and EQ/BL plus the three vintage constants listed in §2. These observations explain the recorded split surface; the off-main manifest, implementation and wider exports are comparison evidence only and do not establish current-main API or authority.

A future exact-scope act must cover the actual consumer-required entrypoints, their complete transitive runtime/type closure, build outputs, export conditions and focused consumer resolution. This record does not prescribe or authorize that implementation.

## 4. Validation receipts (repository/package checks, not gate qualification)

The baseline was installed with `npm ci --no-audit --no-fund` on Node `v22.22.3` / npm `10.9.8`. Checks were run serially where build output was a prerequisite.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Exit 0. |
| `npm run build` | Exit 0; TypeScript, Vite and the existing UI package build completed. Vite emitted its existing large-chunk advisory. |
| `npm test` | Exit 0: **848 tests executed, 847 passed, 0 failed, 1 skipped** (116 suites; the executed-test guard passed). |
| `node --test dist/tests/portfolio_ui_package.test.js` | **29/29 passed**. |
| `node --test dist/tests/q1_broker_import_durability.test.js` | **18/18 passed**. This uses qualification fixtures and does not establish operator-store durability. |
| `node --test dist/tests/q1_cap02_u7_provider_outcomes.test.js` | **10/10 passed**. This does not establish U7 end-to-end integration. |
| Focused guard command over `g3_write_gate`, `g3_durability_vocabulary`, `g3_caller_authority` and `g3_binding_resolution` | **131/131 passed**. `WRITE_NOT_AUTHORIZED` and the existing refusal behavior remain intact. |
| `npm pack --dry-run --json` | Exit 0; package inventory and sizes above. Prepack/prepare rebuilt the same UI-only package entry. |
| Runtime/TypeScript consumer resolution | Expected blocker reproduced: both runtime subpaths unexported; TS2307 for both. `./portfolio-ui` resolves. |
| Remote IPD `main` CI at baseline | Run `39938693994` succeeded; executed-test-count check `120364760904` reports **848 executed, 847 passed, 0 failed** at `24e62c80…`. |

Passing IPD builds, tests, package checks or CI is not Gate 4 qualification, U4 acceptance, U5 admission, U6 authorization or cross-repository E2E evidence.

## 5. Gate 4 preparation — separate track, no qualification claim

The current U2 criterion/gate-status record marks U3/Gate 4 **NOT QUALIFIED**, U4 not rendered, U5 not granted and U6 unauthorized. The Increment A act likewise states that it does not authorize or perform Gate 4. This pass prepared and refreshed local repository evidence only; it did not start a Gate 4 run or access an operator environment.

| Gate 4 evidence element | Preparation/revalidation in this pass | Still required / boundary |
|---|---|---|
| IPD-local typecheck, build, repository tests and refusal guards | Results in §4; focused write-denial/caller-authority/binding guards are green. | These prove code/fixture behavior only; they are not host qualification or gate acceptance. |
| Target Windows host under frozen topology | No target-host execution. No host identity, operator-supplied database path or IPC endpoint was provided or used. | A governed target-host run with exact host identity, command set, exit codes and test counts, as required by the existing criterion record. |
| Real operator-store restart durability | No real operator store was opened; no store path or operator data was accessed. | Authorized store path and target-host process-restart evidence. Linux/OS-temp fixtures are not substitutes. |
| `durable:true` end-to-end acknowledgment | Not attempted; the write guard remains false. | U6 decision first. Preserve `WRITE_NOT_AUTHORIZED`, `SESSION_ONLY` and `durable:false`; do not fabricate a receipt. |
| Cross-repository end-to-end | Not attempted. No IRR change was made and B-1R remains unexecuted. | Separate IRR composition/repin and required host evidence; package tests alone are not E2E. |

No identity/binding was provisioned. No write was enabled. No durable receipt was created or inferred. Gate 4, U4, U5, U6 and E2E status remain unchanged.

## 6. Program workbook cell inspection

The repository workbook `IIPS_Production_Market_Data_Intelligence_Program_v1.0_TRACKER_INTEGRATION_ALIGNED.xlsx` was read-only parsed through its workbook relationships and worksheet cell XML (including inline string cells). It contains 12 worksheets; `Work Tracker` has 60 non-empty rows. An explicit cell search found no CAP-02, U2, U7, B-1R or Gate-4 work item. The workbook is the broad P00–P17 program roadmap, not the CAP-02 tracker, and was not edited.

## 7. Handoff and remaining blockers

- **Exact authoritative source baseline inspected:** IPD `main@24e62c80f37e8a55c34747581a68209c67b775a` (tree `d5eb798b7455711f7e46bfaec89fdca551fa0f3d`). It is suitable for IRR to inspect as the authoritative current-main baseline, **not to pin for B-1R**: it exports only `./portfolio-ui` and lacks the required PIT/D114 APIs.
- **IRR state:** read-only IRR `main@3f628cbc15d0a4712980dc9c9e378edf062be67e` (tree `eb807be6c9b02062c060a7a0793b3733e80612b6`) was inspected; its tracker records the existing off-main dependency reference `2e11fa3b…`. No IRR pin change was made. No compatible, eligible IPD-main commit exists in the inspected baseline.
- **Next B-1R prerequisite:** an effective IPD act with a sufficiently exact manifest for the two required exports, their build/package outputs, the consumer-required current-main API/identity compatibility, complete dependency closures and tests. After that scope is authorized, implement only its manifest, publish and remotely verify it; then IRR may execute its already-authorized plain B-1R repin and §8 checks.
- **Separate Gate 4 blockers:** effective authority and the target Windows/operator-store evidence above; U6 remains a separate prerequisite for any durable-write path. This package reconciliation neither satisfies nor advances those gates.

```text
./portfolio-ui:                    PRESENT; current 22-export UI surface
./pit:                             NOT EXPORTED; required service/store API also incompatible/missing
./d114-non-production:             NOT EXPORTED; required non-production APIs/constants missing
B-1R:                              AUTHORIZED but NOT EXECUTED; no eligible compatible main pin
Gate 4 / U4 / U5 / U6:             unchanged; not qualified / not rendered / not granted / not authorized
WRITE_NOT_AUTHORIZED:              preserved
SESSION_ONLY / durable:false:      preserved
Identity provisioning:             not performed
IRR:                               read-only; no files, refs, PRs, issues, comments or tracker changed
E2E:                               not claimed
```

## 8. Publication receipt — IPD PR #56 (remote-verified)

- PR #56 merged at `2026-10-23T11:32:19Z`; PR head `07cd274ba2b6836888c81c3c1396aeaebe9f1127`; merge commit `70323867619d4270bc94cad6ae8d622c0579eb4e`; tree `32890138c6c11ab91ec75c6f4d72f4c26e093b49`.
- Remote `main` changed exactly the two intended documentation paths: this record (blob `6be7a5e28088b0b27d4f575bc5a47cb1ce3e7e58`) and the CAP-02 tracker (blob `34d7f4d76fc53e6b9ccca05f53f667e7cc320bc5`). Remote blob IDs match the committed local contents.
- PR checks passed: CI run `39946635397` and executed-test-count check reported 848 executed, 847 passed, 0 failed. Post-merge `main` CI run `39946778715` and check `120391517271` also passed (848 executed, 847 passed, 0 failed).
- Comparing assessed baseline `24e62c80…` to merge `70323867…`, there are no changes to package manifests, TypeScript/package build config, source, tests or CI. The post-merge main head is a documentation-only successor and still is **not an eligible B-1R pin**.

## 9. B-1R IPD compatibility implementation candidate — 2026-10-23

The exact IPD compatibility act is now rendered at
`IIPS_V3_CAP02_B1R_IPD_COMPATIBILITY_IMPLEMENTATION_ACT_EFFECTIVE_2026-10-23.md` from verified
`main@b3428f3f431eceb1dcde60e3b120bbd1888622bb`. It authorizes only the consumer-required additive
PIT/D114 APIs, offline population, package/declaration wiring and narrow U7 vocabulary. It does not
promote off-main code or infer authority from the IRR composition act.

### Implemented and locally verified

- Source-derived `ISIN:<isin>:<series>` identity at all four D114 normalization seams; no company/security
  namespace collapse and no fallback for malformed or missing D114 series.
- Explicit series-qualified PIT storage, sole-key legacy compatibility, ambiguity refusal, admitted-key
  enumeration, strict UTC/calendar reads, typed misses, future-vintage exclusion and provenance projection.
- Three frozen local archives through both real parser eras and the existing loader into one supplied
  store: 12 D114 records, 12 same-loader replay skips, deterministic EQ/BL isolation and three vintages.
- Exactly three package subpaths, including the preserved `./portfolio-ui`; 22 UI runtime exports remain.
  The U7 package surface now includes the three existing receipt/outcome types and the two established
  Class A refusal codes without changing write behavior.

Final local typecheck/build passed; the guarded suite executed 875 tests with 874 passed, zero failed and
one skipped. The focused compatibility set passed 99/99. `npm pack --dry-run` and `git diff --check` passed.

### Actual packed-consumer result

The verification script installed the real tarball into an isolated consumer, resolved runtime and strict
TypeScript declarations, and browser-bundled the installed UI entry with an empty forbidden-closure hit
list. It also copied the five actual IRR package importers verbatim from read-only commit
`98cd56a9a568f431ea31d5515e515a1b6cbb91ba`: all five typechecked against the installed pack. The three
IRR production composition modules and adapter executed, yielding 8 fixture records, 20 combined records,
correct D114 selection and `INVALID_IDENTITY` for malformed input. The two IRR route test files were not
executed; no IRR E2E or repin is claimed.

A first verbatim compile caught a generic store/service constructor incompatibility. The read facade's
payload-only type projection was corrected without changing runtime semantics, and all checks were rerun.
This is recorded instead of hiding the compatibility failure or weakening the consumer.

### Status and unchanged Gate 4 boundary

This entry is a locally validated **candidate**, not a publication receipt. PR/check/merge/remote facts
will be appended only after they occur. No Windows target host, real operator store, privileged IPC
endpoint, production acquisition or operational write was used. Gate 4 remains **NOT QUALIFIED**; U4 is
unrendered, U5/U6 are ungranted, Gate A′ is unprovisioned, and durability/E2E remain unclaimed.
`WRITE_NOT_AUTHORIZED`, `SESSION_ONLY` and `durable:false` remain enforced. Detailed evidence and the
consolidated report are the sibling `IIPS_V3_CAP02_B1R_IPD_COMPATIBILITY_*_2026-10-23.md` records.
