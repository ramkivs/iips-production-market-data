# Snapshot-to-Live W04 — P7: Principal host verification of the 64 original holdings against the published manifest; W04-P7 technical evidence closed

**Date:** 2026-11-15 (the date this record was written; the time of the host run was not supplied)
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md))
**Subject:** the result of the published-manifest qualification utility ([utility folder](../../evidence/integration/w04-p7-published-manifest-qualification-2026-11-15/README.md)), run by the Principal on the Windows host on the original CSV.
**Source of the result:** supplied by the Principal as a final summary with the SHA-256 of the result JSON. **It was not executed by Arena, in the sandbox or by any session of this repository.** The complete host output and the result JSON were not supplied and are not in the repository (section 1.2).
**Repositories read:** IPD `ramkivs/iips-production-market-data` at `main` `bcb45d7db8f4b8baf542761593f82f32e803e488` and at this branch; PR #163 head `3a656c2`, read only; IRR `ramkivs/iips-review-recovered` at `08411bcd6d782a601fe5c82cc9983d076831148d`, read only through the GitHub API, for the tracker question of section 7.
**Type:** record only. No utility, test, manifest, snapshot, runtime source, approval record or IRR file was changed. Nothing was run on the host from here.

**W04-P7 technical evidence: COMPLETE / PASS**, on the Principal's host result below.
**Overall W04 is unchanged: PARTIALLY COMPLETE. Not accepted.** One downstream approval dependency is outstanding (section 6).

## 1. The result

### 1.1 As supplied by the Principal

| Item | Value as supplied |
|---|---|
| Executed by | the Principal, on the Windows host, on the original CSV |
| Conditions passed | 15 |
| Failed | 0 |
| Warnings | 0 |
| Conditions not evaluated | 0 |
| Unresolved | 0 |
| Result | `ALL_64_MATCH_PUBLISHED_MANIFEST` |
| PowerShell exit code | 0 |
| Result JSON SHA-256 | `da36143a2c2e5b5c026729e53782c39b9b29b8471df2e123f89c2f79fb657326` |
| Reported with the result | the comparison used the downloaded published manifest bytes only; no registry was regenerated; nothing was written; no identity was assigned; `TEMP` and `TMP` were restored |

### 1.2 What was not supplied

The saved output file `w04-p7-published-manifest-output.txt`, the 64 `[ROW]` lines, the nine `[COND]` lines, the text of the result JSON, the `utility sha256:` line, the line with the Node version and permission flags, and the time of the run. **None of them is in the repository, and this record does not reconstruct any of them.** The digest `da36143a…7326` is recorded as supplied; the JSON it covers is not held here, so the digest was not recomputed. The JSON carries fingerprints keyed with the content of the CSV and cannot be reproduced without the CSV.

## 2. How the supplied figures correspond to the utility

This section is read from the source of the utility at commit `59bf98b93130a140f915cd8a3cedb8a1321e2f9a` (SHA-256 `07a27e7287e921f46a40c1643437bd7d7853e08f765e78820e460abe7e0fffbc`). **It is not read from the host output.**

| Supplied | Line of the utility's output it corresponds to | Source |
|---|---|---|
| 15 passed, 0 failed, 0 warnings | `checks: <n> pass, <n> fail, <n> warn` | Line 1028. The utility has 15 `check` call sites, each reached once in a complete run. A warning is printed only for an overridden input (three sites). 15 / 0 / 0 is therefore the count of a complete run on the recorded inputs. |
| Conditions not evaluated: 0 | `conditions not evaluated: none` | Line 1030. |
| Unresolved: 0 | `unresolved: none` | Line 1031. |
| Result | `RESULT: ALL_64_MATCH_PUBLISHED_MANIFEST` | Lines 1057–1059. |
| Result JSON SHA-256 | `W04_P7_PUBLISHED_MANIFEST_RESULT_JSON_SHA256: <hex>` | Line 1027: the SHA-256 of the JSON text printed on the line before. |
| Manifest bytes only, no regeneration, nothing written, no identity assigned | `The comparison used the downloaded manifest bytes only. No registry was regenerated, nothing was written and no identity was assigned.` | Line 1032. |
| PowerShell exit code 0 | `exit code: 0` | Printed by the host command (utility README, section 7). |
| `TEMP` and `TMP` restored | none | The utility prints nothing about `TEMP` or `TMP`. The host command restores both in its `finally` clause and prints no line for it. Recorded as the Principal's statement. |

The Principal's "15 conditions passed" is the `checks:` line. The utility also ends with nine summary conditions (`[COND] 1` to `[COND] 9`). Those nine lines were not supplied one by one. By the construction of the utility the result line `ALL_64_MATCH_PUBLISHED_MANIFEST` is printed only when conditions 1 to 8 are all `yes`, no check failed and no input was overridden (condition 9); the test PMQ-14 covers this. On that basis, and not on a reading of the host output, the result implies:

| # | Condition | Value of record |
|---|---|---|
| 1 | CSV import-content SHA-256 equals the recorded digest | `a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107` |
| 2 | Manifest SHA-256 equals the recorded digest, verified before parsing | `69a918f78791114e8fb036ddfd2a2005facdddf785a7496bc28f541fd4964769` |
| 3 | Pipeline commit | `325266d684f857a377d55b147e7306e02c7a495a` |
| 4 | Qualified mappings: stated, QUALIFIED records, registry entries and loaded registry, all in agreement | 4,680 |
| 5 | Holdings with an exact published entry | 64 of 64 |
| 6 | Every identity dimension agrees (ISIN, exchange, series, company) | 64 of 64 in each |
| 7 | Missing, ambiguous, mismatched, not comparable, unexpected | 0 |
| 8 | Nothing mutated: no write call in the utility; the CSV unchanged at the end | yes |
| 9 | The inputs are the recorded ones | no override |

**Condition on this reading.** It holds for the reviewed utility. The host command refuses to run a file whose SHA-256 is not `07a27e72…fffbc`. The `utility sha256:` line of the host output is among the items not supplied (section 1.2); the Principal's statement names the utility by commit `59bf98b` and by that SHA-256.

## 3. Values of record

| Item | Value |
|---|---|
| Published manifest SHA-256 | `69a918f78791114e8fb036ddfd2a2005facdddf785a7496bc28f541fd4964769` |
| Pipeline commit | `325266d684f857a377d55b147e7306e02c7a495a` |
| Qualified mappings | 4,680 |
| Manifest address the utility downloads | `https://raw.githubusercontent.com/ramkivs/iips-production-market-data/main/evidence/dhan-p7/qualification-manifest.json` |
| Holdings | 64 |
| Result | `ALL_64_MATCH_PUBLISHED_MANIFEST`, PowerShell exit code 0 |
| Checks | 15 passed, 0 failed, 0 warnings; 0 conditions not evaluated; 0 unresolved |
| Result JSON SHA-256 | `da36143a2c2e5b5c026729e53782c39b9b29b8471df2e123f89c2f79fb657326` |
| Utility | `evidence/integration/w04-p7-published-manifest-qualification-2026-11-15/w04-p7-published-manifest-qualification.mjs`, commit `59bf98b93130a140f915cd8a3cedb8a1321e2f9a`, SHA-256 `07a27e7287e921f46a40c1643437bd7d7853e08f765e78820e460abe7e0fffbc` |
| `main` at the time of this record | `bcb45d7db8f4b8baf542761593f82f32e803e488` (merge of PR #164, 2026-11-15T16:14:34Z) |

## 4. Three kinds of evidence, kept apart

| | 1. In-memory regeneration diagnostic | 2. Publication verification | 3. Direct comparison of the 64 holdings with the published manifest |
|---|---|---|---|
| Question | What would the unchanged generator produce against the P04 master of today, and would the holdings qualify against that? | Are the bytes that `main` serves the regenerated manifest? | Is each of the 64 original holdings an exact member of the registry as published? |
| Registry used | Produced in memory by re-running the generator. Nothing stored. | None. Whole-file digest only. | The downloaded manifest bytes only. No regeneration path exists in the utility. |
| Tool | `w04-p7-mapping-gap-diagnostic.mjs` (PR #163; byte-identical copy in `evidence/integration/w04-p7-registry-regeneration-2026-11-15/`) and `regeneration-source-and-registry-check.mjs` | `verify-published-manifest.mjs` (same folder) | `w04-p7-published-manifest-qualification.mjs` |
| Run where | Sandbox for the registry itself. Host, by the Principal, for the 64 holdings. | See below. | Windows host, by the Principal. Not Arena-executed. |
| Result | Sandbox: 4,680 qualified mappings in memory, equal to the committed manifest in all eleven members ([regeneration record](IIPS-W04-P7-REGISTRY-REGENERATION-2026-11-15.md), section 6). Host: 64 of 64 qualified against the in-memory registry, as stated by the Principal and noted in section 1 of the utility README. | See below. | `ALL_64_MATCH_PUBLISHED_MANIFEST`, exit code 0 (section 1). |
| Host output in the repository | No | No | No. Summary and result JSON digest only. |
| Does not show | That anything was published, or that a holding is in the published registry. | Anything about a holding. | See section 5.2. |

**On kind 2.** What the repository holds:

- The utility and its validation before the merge ([regeneration record](IIPS-W04-P7-REGISTRY-REGENERATION-2026-11-15.md), section 7): `PUBLISHED` against a loopback server with the regenerated bytes, and `NOT_PUBLISHED` against `main` before the merge, which was the correct answer then.
- Git objects, read for this record and not a run of that utility: `main` at `bcb45d7` tracks the manifest as blob `f957dd68aae67d7dabe10a4af8ac316d4e14c35f`, the blob recorded at the regeneration commit `371bf3b`; commits `325266d` and `371bf3b` are ancestors of `main`.
- The tests P7-REG-01, P7-REG-02 and PMQ-12, which read the tracked manifest in CI.

The Principal's instruction for this record treats the publication check as completed. **No output of a host run of `verify-published-manifest.mjs` is in the repository, and none was supplied to this record.** It was not re-run here.

Kind 3 carries its own publication check: the utility downloads the manifest from the `main` ref and compares its SHA-256 with `69a918f7…4769` before it parses a byte (condition 2). The result line cannot be reached otherwise.

Kind 3 does not rest on kind 1. Kind 1 showed what a regeneration would give. Kind 3 compares with what was published.

## 5. Status

### 5.1 W04-P7 technical evidence: COMPLETE / PASS

Basis: the Principal's host result of section 1, on the published manifest `69a918f7…4769`, pipeline commit `325266d6…495a`, 4,680 mappings. The grade of the evidence is a Principal-supplied summary with one digest. It is not a committed host output.

What the result establishes is section 8 of the [utility README](../../evidence/integration/w04-p7-published-manifest-qualification-2026-11-15/README.md): for the bytes `main` served at the time of the run, each of the 64 holdings has exactly one published mapping for its ISIN on its exchange, listed once in `registryEntries`, consistent in ISIN, exchange, series and company, and the runtime qualification applied to the published registry qualifies each of them.

### 5.2 What it does not establish

- **No identity was assigned or repaired.** The stored holdings of revision 1 are as the earlier records describe them. No holding, portfolio, revision or journal was read or changed.
- Which manifest the server on the host loads. The utility needs no checkout, and the Principal's Windows checkout was not read, synchronized or changed.
- The IRR resolver outcome for the holdings.
- Why the identities were missing at the time of the import.
- The series and company columns state agreement inside the manifest. The CSV has neither value. The P04 steps of the runtime qualification are not re-derived on the host; for the same manifest bytes they are covered by the tests P7-REG-02 and PMQ-02.

### 5.3 Overall W04

Unchanged: **PARTIALLY COMPLETE, not accepted.** This record does not claim W04 acceptance.

## 6. Approval boundary: outstanding downstream dependency

| Item | Value |
|---|---|
| Approval | `W04-D1-20261114-01`, for the provisioning of the IRR identity sources |
| P7 manifest digest the approval binds | `13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc` (the previous manifest) |
| P7 manifest digest published now | `69a918f78791114e8fb036ddfd2a2005facdddf785a7496bc28f541fd4964769` |

The two differ. The approval check (`src/identity/irr_identity_approval.ts`) compares the P7 manifest digest of a staged provisioning run with the one in the approval record and refuses a difference with `GENERATION_MISMATCH` ([regeneration record](IIPS-W04-P7-REGISTRY-REGENERATION-2026-11-15.md), section 5). A provisioning run staged against the published manifest is therefore refused until a new approval exists.

**This is recorded as an outstanding downstream approval dependency. A new approval is a separate decision of the Principal and was not made here.** The approval record is on the host and in neither repository. It was not read, edited, renewed or replaced; its digest was not changed; `GENERATION_MISMATCH` was not bypassed; no source file of the approval check was edited. Overall W04 cannot be accepted while this dependency is open.

## 7. Who owns the overall W04 tracker

**IPD.** The overall W04 status is the section "W04 — Actual security and issuer coverage" of `docs/integration/IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md` in `ramkivs/iips-production-market-data`.

- IRR names that file as the source of truth: `docs/integration/IIPS-CURRENT-PORTFOLIO-STAGE-2-IRR-RECORD-2026-11-10.md`, lines 4–5, at IRR `08411bc` ("Roadmap (source of truth): IPD `main` …").
- IRR's own master tracker, `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` at the root of IRR, has no W04 entry at `08411bc` (no occurrence of `W04`).

Because the tracker is IPD-owned, its W04 paragraph is updated with this change: the W04-P7 statement and the approval dependency are added, and the overall status stays as it was.

IRR documents that refer to W04 or to the registry, reported and **not modified** (no IRR write was made):

- `docs/integration/IIPS-CURRENT-PORTFOLIO-STAGE-2-IRR-RECORD-2026-11-10.md`: W08 acceptance depends on W04.
- The two documents of 2026-11-11 that state the 96-mapping registry ([regeneration record](IIPS-W04-P7-REGISTRY-REGENERATION-2026-11-15.md), section 5).

## 8. Not done

- The manifest was not regenerated. The gap diagnostic, the regeneration check and `verify-published-manifest.mjs` were not re-run.
- The P04 and P7 snapshots, the runtime qualification, the loader, Broker Import and identity assignments were not changed.
- No holding, portfolio, revision or evidence journal was read or changed.
- No Dhan API and no provider credential was used.
- PR #163 was not modified. No pull request was merged.
- The utility was not edited: its SHA-256 is still `07a27e72…fffbc`, and the pinned host command is unchanged.
- Dated records were left as they are, including the regeneration record's "what still needs the Principal's host output". This record answers that for the published manifest.

## 9. Files of this change

| File | Change |
|---|---|
| `docs/integration/IIPS-W04-P7-PUBLISHED-MANIFEST-HOST-VERIFICATION-2026-11-15.md` | This record. New. |
| `docs/integration/IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md` | W04 paragraph: W04-P7 technical evidence and the approval dependency added. Overall status unchanged. |
| `evidence/integration/w04-p7-published-manifest-qualification-2026-11-15/README.md` | Status header, the notes that the utility had not been run, and the file list now point to this record. The utility, its tests, the sample output and the pinned command are unchanged. |
