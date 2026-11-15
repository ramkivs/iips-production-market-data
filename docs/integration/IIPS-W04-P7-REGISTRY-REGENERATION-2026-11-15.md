# Snapshot-to-Live W04 — P7 registry regenerated against the master of today; evidence utilities and record

**Date:** 2026-11-15
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md))
**Subject:** the smallest governed correction recommended by PR #163's P7 mapping gap analysis (section 5 of `evidence/integration/w04-p7-mapping-gap-analysis-2026-11-15/README.md` on that branch): regenerate `evidence/dhan-p7/qualification-manifest.json` from the retained official snapshot against the P04 master of today, with the P04 source revision recorded, and re-pin the three test expectations the new registry changes.
**Repositories read:** IPD `ramkivs/iips-production-market-data` at this branch (`325266d`, `371bf3b`, and the commit of this record); PR #163 head `3a656c2` — read only to copy the gap diagnostic; IRR `ramkivs/iips-review-recovered` at `08411bc`, read-only.
**Type:** the regenerated artifacts and the runner are the two commits before this one; this commit adds two evidence utilities, a byte-identical copy of the gap diagnostic in a directory that exists only on this branch, and this record. No approval record was authored; no `src/identity/irr_identity_*.ts` file was edited; no IRR file was written; no provider was contacted.

**W04 status is unchanged: PARTIALLY COMPLETE. Not accepted.** This record changes the registry and its evidence, not the status. The cause distribution of the 63 holdings and the host-side questions remain as they were.

## 1. Commits and the required merge shape

| Commit | Content |
|---|---|
| `325266d` | The runner only: `scripts/dhan-p7-qualify.mjs` records `p04SourceRevision {batchId, fileChecksumSha256, recordCount}` in the manifest and one line in the qualification report, and throws when the master carries no revision. |
| `371bf3b` | The regenerated artifacts, the three authorized expectation changes, and the new test file `tests/dhan_p7_registry_regeneration.test.ts`. |
| this commit | The evidence utilities, the copied gap diagnostic, this record. |

The manifest was regenerated from the clean tree of `325266d`, so `pipelineCommit` names `325266d684f857a377d55b147e7306e02c7a495a`. **The pull request must be merged with a merge commit** (IPD `main` history is merge commits). A squash or a rebase would leave `pipelineCommit` pointing at a commit that `main` does not contain. `main` carries no branch protection that would enforce a shape (measured in the earlier session; the protection endpoint returns 403 to this token and was not re-verified here).

## 2. The regenerated artifacts

| Item | Value |
|---|---|
| `qualification-manifest.json` | 4,726,767 bytes; SHA-256 `69a918f78791114e8fb036ddfd2a2005facdddf785a7496bc28f541fd4964769`; Git blob at `371bf3b` `f957dd68aae67d7dabe10a4af8ac316d4e14c35f` |
| `pipelineCommit` | `325266d684f857a377d55b147e7306e02c7a495a` (the runner commit) |
| `p04SourceRevision` | `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`, `b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4`, 2390 — equal to `getGovernedBroadSecurityMaster().sourceRevision` in all three members |
| Totals | 217,104 detailed rows; 217,104 compact rows; 23,764 equity candidates; QUALIFIED 4,680; registry size 4,680 |
| Dispositions | `QUALIFIED` 4,680; `REJECTED_NOT_EQUITY` 193,340; `REJECTED_INVALID_FIELD` 24; `REJECTED_NO_P04_CORRESPONDENCE` 19,060; schema/ambiguous/duplicate/conflicting 0 |
| Coverage | `BSE:A` 700, `BSE:B` 1,590, `NSE:EQ` 2,390 |
| Reconciliation (equity) | consistent 23,764; missing in compact 0; series mismatch 0; not-equity skipped 193,340 |
| Records kept | 5,180 (every QUALIFIED record plus the first 500 non-qualified); `registryEntries` 4,680 |
| `qualification-report.md` | 1,247 bytes; carries the new `- P04 source revision: …` line and the 4,680 counts |
| `source-reconciliation-report.md` | byte-identical to the tracked file (no diff) |

The old manifest (`13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc`, 210,821 bytes) is still what `main` serves at the time of writing (verified: `git ls-tree origin/main` and a raw download through the GitHub API both give that digest).

## 3. Tests

Baseline at `45472ad`, before any change: **1,638 executed, 1,637 passed, 1 skipped, 0 failed** (~101 s). After the change set: **1,640 executed, 1,639 passed, 1 skipped, 0 failed** (228 suites, ~103 s). Both runs were made exactly as governed — `unshare -rn sh -c 'ip link set lo up && npm test'`, a network namespace with loopback only. With packet capture in such a namespace the suite sends no TCP or UDP packet beyond loopback; no Dhan host name appears anywhere in this work, and no provider was contacted.

The three authorized expectation changes, and nothing else:

| File:line | Was | Now |
|---|---|---|
| `tests/dhan_stage1_operational_wiring.test.ts:563` | `qualifiedMappingsLoaded` 96 | 4680 |
| `tests/irr_identity_source_export.test.ts:236-246` (IIX-07 corroboration) | 96, 48, 48, 0, 48, 0, 48, 0, 3 | 4680, 2390, 2390, 0, 2390, 0, 2290, 0, 0 |
| `tests/ipd_instrument_search_runtime.test.ts:58` | name search 2 rows | 4 rows (the ISIN search on that line stays 2) |

New test file `tests/dhan_p7_registry_regeneration.test.ts` (2 tests, ~2.3 s):

- **P7-REG-01** — the committed manifest's `p04SourceRevision` equals `getGovernedBroadSecurityMaster().sourceRevision` in batchId, fileChecksumSha256 and recordCount.
- **P7-REG-02** — every ACTIVE listing pair of the master (4,680 pairs) qualifies at runtime through `loadGovernedP7InstrumentRegistry()` and `qualifyHoldingSecurityIdentity`, and the loaded registry's size equals the pair count.

Both negative properties were executed, not assumed: on the tracked manifest both checks fail (0 pass, 2 fail); with one QUALIFIED mapping removed from the regenerated manifest P7-REG-01 still passes and P7-REG-02 fails with `EQ_ABB_IN/BSE: MISSING_P7_MAPPING`.

No test reads the runner, `docs/DHAN-P7-INSTRUMENT-MASTER-QUALIFICATION.md` or either report (grep: no hits in `tests/`). The three exported IRR files keep their pinned digests with the regenerated manifest (test IIX-04, executed in the full run): `eligible-roster.json` `078e89cc1896d0f59e09e2ad05a12378e248cd81b97775ee7667b5f1e750e937`, `listing-map.json` `6a330123a2fea31e9e1dd54f01e5adbe13f9721f077a5a82a34ee7cd60bcf458`, `corporate-actions.json` `d6bc14d1b676260bb0f1c2280e62956d3f6a7e07b9b9265a73b49f821185ffcd`.

`npm run test:package-consumer` was run here and exits 0 (strict typecheck PASS, no forbidden hits) — the earlier "not run" note no longer applies to it.

## 4. Re-measured runtime behaviour (report to the Principal)

**Daemon and search** (measured twice from the same code, once loading the old manifest file and once the tracked one; loopback only):

| Measure | old manifest (96) | regenerated (4,680) |
|---|---|---|
| `qualifiedMappingsLoaded` | 96 | 4,680 |
| `vendorEgressMode` | `DISABLED_PRE_ACCESS` | `DISABLED_PRE_ACCESS` |
| search `INFY` | 2 rows | 2 rows |
| search `INFOSYS` (name) | 2 rows | 4 rows |
| search `INE009A01021` (ISIN) | 2 rows | 2 rows |
| search `A` (broad) | 90 rows | **100 rows — the 100-row limit is reached** (`dhan_identity_api.ts:58`, `.slice(0, 100)`) |
| empty query | 400 `MALFORMED_REQUEST` | 400 `MALFORMED_REQUEST` |

The registry remains the gate before any provider call: `dhan_market_data_service.ts:181` (`resolveExactIdentity`) runs on every quote request, with the comment at line 178 ("BEFORE any provider call") unchanged.

**Loader** (`loadGovernedP7InstrumentRegistry()`, once per process start): first call 2.6 ms with the old manifest, **37.5 ms** with the regenerated one (repeat calls 1.1 ms / 30.2 ms) in this sandbox — the earlier session measured about 6 ms → about 50 ms on its machine; the order of magnitude is the same and the cause is the same (parsing 4.73 MB instead of 211 KB).

**IRR identity export** (executed against the regenerated manifest): `result: PASS`; corroboration block `{qualifiedRecords: 4680, distinctIsins: 2390, isinsInMaster: 2390, isinsNotInMaster: 0, nseSeriesEq: 2390, nseSeriesOther: 0, bseScripCodeAgrees: 2290, bseScripCodeDiffers: 0, companyIdDiffers: 0}`; the three files unchanged at their pinned digests; 2 withheld records; `inputs.p7QualificationManifest` now carries SHA-256 `69a918f7…4769`, `qualifiedRecords` 4,680.

## 5. The approval digest — report only (decision 4)

- Approval `W04-D1-20261114-01` (status `APPROVED`, approver `PROGRAM_AUTHORITY_RAMKI`, approved at `2026-11-14T04:57:48Z`, **review date `2026-11-14T18:29:59Z`**) binds P7 digest `13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc`, IPD tool commit `fff4829db5f8cd2863965e64e4650a58f48f82b7` and IRR commit `08411bcd6d782a601fe5c82cc9983d076831148d` — [host completion and reconciliation, sections 2.1–2.2](IIPS-W04-IDENTITY-PROVISIONING-HOST-COMPLETION-RECONCILIATION-2026-11-14.md).
- `src/identity/irr_identity_approval.ts` compares `record.subject.generation.p7ManifestSha256` with the staged report (line 397 builds it from the staged report; line 603 lists it among the generation fields). `tests/irr_identity_approval.test.ts:637-644` (IAP-64, "a P7 manifest that was not used") shows `GENERATION_MISMATCH` for another digest.
- Consequence, stated and not acted on: a provisioning run staged **after** this regeneration would carry `69a918f7…4769` in its report and the existing approval would refuse it (fail-closed). The three installed files are unaffected — they keep their pinned digests (IIX-04). Any new approval is the Principal's to give. **No approval record was authored, edited or fabricated.**
- IRR at `08411bc` reads only `${IIPS_DATA_DIR}/investment/identity/{eligible-roster,listing-map,corporate-actions}.json` (`iips-platform/src/investment/identity/sources.ts`, lines 10–12 and 43). A grep of IRR's code at that commit for `W04-D1`, `p7ManifestSha256`, `13bd2ef1`, `qualification-manifest`, `dhan-p7` and `loadGovernedP7InstrumentRegistry` returns no hits: IRR has no reference to the approval record or to the P7 digest, does not read `evidence/dhan-p7` and does not call the registry loader. The CI test in IPD (P7-REG-01/02) is what covers the real loader.
- IRR has two dated documents of 2026-11-11 that state the 96-mapping registry — `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md:34` ("P7 load of 96 mappings") and `docs/integration/DHAN-LIVE-MARKET-DATA-CURRENT-STATE-INVESTIGATION-2026-11-11.md:77` ("96 qualified P7 mappings load at daemon start", with the same figure at lines 630 and 732). Reported only; no IRR write was made.

## 6. Evidence route (a)

**The diagnostic copy.** `evidence/integration/w04-p7-registry-regeneration-2026-11-15/w04-p7-mapping-gap-diagnostic.mjs` is a byte-identical copy of the diagnostic at PR #163 head `3a656c2` (SHA-256 `aa7222cb544fba21e9891788442ca4f0c7611de17ce532995e29d69a4bf5f0ec`). It sits in a **new directory whose path exists on neither `main` nor `3a656c2`**, so the two branches cannot conflict on it. `3a656c2` was read only for this copy.

**The utility.** `regeneration-source-and-registry-check.mjs` (same directory) performs the two checks of this route, read-only and offline:

1. It shows the Git blob id of each of the 16 source files the diagnostic pins (`SOURCE_BLOBS`), both as committed at a ref (`--commit`, default `HEAD`) and as they are on disk. Run at the regeneration commit `371bf3b`: **16 of 16 equal, 0 different, 0 missing**, on both views — the ids are `b8f0ec8d…`, `ad097ab5…`, `1c6b4248…`, `eec60c09…`, `70c6f658…`, `60030e0c…`, `fbdb54b0…`, `e426d3d5…`, `a644c833…`, `32113a68…`, `ef18605a…`, `25aeb86f…`, `08090103…`, `b6acecd9…`, `975db376…`, `72d88d1c…|bec1dc81…`, in the diagnostic's file order. None of the 16 was edited.
2. It re-runs the generator **in memory with the diagnostic's own `sourceEvidence` object** and compares the result with the committed manifest mapping by mapping. Run at `371bf3b`: `rerun.count` 4,680 = 4,680 — PASS; `rerun.elevenMembers` every mapping equal in all 11 members, in the same order — PASS; `manifest.committed` (the file examined is the one committed at that ref) — PASS; `p04SourceRevision` equals the compiled master's, in the three members — PASS. `RESULT: ANALYSED`, exit 0, counts PASS 22 FAIL 0 WARN 0 INFO 5. This repeats, against the committed manifest, the finding that the diagnostic's re-run and the runner's call give the same 4,680 mappings in all 11 members.

**What still needs the Principal's host output.** No session has seen the diagnostic's output for the original 64-row broker CSV — the CSV is not in the repository. The host run of the copied diagnostic supplies the per-holding table (section 4 of its README). Reading note for that run, verified here by executing the copied diagnostic against this checkout with a two-row synthetic CSV: `checkout.sources` passes (16 equal), `checkout.compiled.selfContained` passes, `master.recorded` passes, the tracked registry reports 4,680 mappings on 2,390 ISINs with `SAME_COMPANY_ID 4680 / COMPANY_ID_DIFFERS 0 / ISIN_NOT_IN_P04 0`, the re-run of the master of today reproduces 4,680 of 4,680 mappings, and both synthetic holdings classify as `QUALIFIED_BY_EXACT_MAPPING`. Two lines are expected to differ from the recorded baseline and are not defects: `checkout.manifest.recorded` is a WARN because the digest is no longer `13bd2ef1…`, and the single FAIL is `rerun.legacyMaster.equalsTracked`, whose invariant ("the tracked registry is the legacy re-run") the regeneration intentionally breaks — the legacy re-run still gives 96, the tracked registry now gives 4,680. The run therefore exits 1 with `ANALYSED_WITH_FAILED_CHECKS` and `unresolved: CHECK_FAILED:rerun.legacyMaster.equalsTracked`; everything else passes or warns. The synthetic run wrote nothing and assigned no identity; its inputs were two invented rows, and it is reported as a tool check, not as evidence about the 64 holdings.

## 7. Evidence route (b) — proving publication after the merge

**Utility:** `verify-published-manifest.mjs` (same directory). It downloads the qualification manifest from the `main` ref over HTTPS **into memory** — no file is written and no checkout is touched — computes its SHA-256 and requires `69a918f78791114e8fb036ddfd2a2005facdddf785a7496bc28f541fd4964769`, the digest recorded at regeneration (section 2). Default URL: `https://raw.githubusercontent.com/ramkivs/iips-production-market-data/main/evidence/dhan-p7/qualification-manifest.json`; `--url <url>` overrides it for mirrors or tests.

**Instructions (for the Principal, after the merge commit is on `main`, on the host):**

```
node evidence/integration/w04-p7-registry-regeneration-2026-11-15/verify-published-manifest.mjs
```

Node 18 or later (it uses the built-in `fetch`). Exit 0 / `RESULT: PUBLISHED` means `main` serves exactly the bytes regenerated here; exit 1 / `NOT_PUBLISHED` means `main` serves something else; exit 2 / `INCONCLUSIVE` means the download failed. The script may be run from any checkout or from a downloaded copy — running it changes nothing.

**Validated here:** against a loopback server serving the regenerated bytes the utility exits 0 with `PUBLISHED` (download, digest, JSON parse and counts all exercised); against the `main` ref as it stands today it downloads the pre-regeneration manifest and exits 1 with `NOT_PUBLISHED`, which is the correct answer until the merge. (This sandbox's TLS is intercepted by a proxy whose CA bundle Node does not trust by default — `NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt` was needed for the sandbox's own `fetch` — and `raw.githubusercontent.com` is outside this sandbox's host allowlist, so the real-`main` leg was exercised through `api.github.com` with `Accept: application/vnd.github.raw` and the digest checked against `git ls-tree origin/main`. Neither quirk exists on a normal host.)

## 8. PR #163 (decision 1)

- The gap diagnostic was copied from `3a656c2` as recorded in section 6; nothing else on that branch was read for this work.
- Re-measured in a scratch worktree of `3a656c2` with `tests/broker_import_security_identity_qualification.test.ts` built from that commit: with the tracked manifest **25 of 25 pass**; with this branch's regenerated manifest copied in, **8 of 25 fail** (`2/3`, `8`, `9`, `11` ×3, the IPC entrypoint frame, and the mapper-equivalence test). PR #163's checks predate the regeneration; this branch does not change them and does not merge them.
- IPD `main` has no branch protection (section 1), so nothing enforces how either PR is merged — the merge-commit requirement in section 1 must be honoured by choice, not by settings.

## 9. Left as it is (reported, not changed)

- `evidence/integration/w04-e4-identifier-supply-diagnosis-2026-11-14/w04-e4-identifier-supply-probe.mjs:74` still hard-codes the old manifest digest `13bd2ef1…`, as do dated outputs that quote it. No test depends on it. Dated records were left as they are.
- `docs/DHAN-P7-INSTRUMENT-MASTER-QUALIFICATION.md:43` still states the 96-mapping result. It is a dated qualification document of the old generation; it was not part of the authorized change set and was not edited.
- The two IRR documents of 2026-11-11 stating the 96-mapping registry are listed in section 5. Report only; no IRR write.
- The old manifest digest recorded in approval `W04-D1-20261114-01` stands as recorded (section 5).

## 10. Not run / limits

- Anything with the 64-row CSV: not run here (the file is not in the repository). The per-holding table is route (a), section 6.
- PowerShell: not run (no Windows in this environment).
- The gap diagnostic's own self-test (PR #163's `p7-mapping-gap-diagnostic-selftest.mjs`, ~90 s, expects the pre-regeneration world) was not run against this checkout; its scenarios 1.tracked-registry and 1.legacy-rerun-equals-tracked encode 96 and would fail here by construction, exactly like the diagnostic's legacy check.
- No approval record, no IRR file, no `src/identity/irr_identity_*.ts` file and no dated record was written.

## 11. Verification transcript (all executed in this session)

| Check | Command / method | Result |
|---|---|---|
| Baseline suite | `unshare -rn sh -c 'ip link set lo up && npm test'` at `45472ad` | 1,638 / 1,637 pass / 1 skipped / 0 fail |
| Final suite | same command after the change set | 1,640 / 1,639 pass / 1 skipped / 0 fail |
| New test, positive | `node --test dist/tests/dhan_p7_registry_regeneration.test.js` | 2 pass, ~2.3 s |
| New test, tracked manifest | manifest replaced by `git show 45472ad:…` | both checks fail |
| New test, one mapping removed | first QUALIFIED record deleted (then restored) | P7-REG-02 fails `MISSING_P7_MAPPING`; P7-REG-01 passes |
| Recon report unchanged | `git diff` after regeneration | empty |
| Route (a) utility | `regeneration-source-and-registry-check.mjs --commit 371bf3b` | `ANALYSED`, exit 0, 16/16 blobs, 4,680 = 4,680 in 11 members |
| Gap diagnostic (copied) | against this checkout, 2-row synthetic CSV | `ANALYSED_WITH_FAILED_CHECKS`, exit 1, only `rerun.legacyMaster.equalsTracked` fails (expected, section 6) |
| Route (b) utility, pass path | loopback server with the regenerated bytes | `PUBLISHED`, exit 0 |
| Route (b) utility, pre-merge | `main` ref (through `api.github.com`, raw accept) | `NOT_PUBLISHED`, exit 1; `main` = `13bd2ef1…` |
| PR #163 scratch | worktree of `3a656c2`, one test file, both manifests | 25/25 with tracked; 8/25 fail with regenerated |
| IRR export | `buildIrrIdentitySources` with the regenerated manifest | PASS; pinned digests unchanged; corroboration as section 4 |
| IRR at `08411bc` | clone, checkout, greps | three-file loader only; no approval/P7-digest/registry-loader reference |
| Package consumer | `npm run test:package-consumer` | exit 0, strict typecheck PASS |
