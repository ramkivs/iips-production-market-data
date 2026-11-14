# Snapshot-to-Live W04 — identity provisioning: approval enforcement

**Date:** 2026-11-13. **Revision 2** (single approver), recorded with sandbox runs of 2026-11-14 UTC.
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md)). Follows the [provisioning record](IIPS-W04-IRR-IDENTITY-SOURCE-PROVISIONING-2026-11-13.md) and the [decision record D1 to D4](IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md).
**Repository:** IPD `ramkivs/iips-production-market-data`, this branch (PR #157). Tool commit `3b924711b53fd49f67adc97bbb6e26c03f614971`.

**This record describes a check. It is not an approval, and no approval exists.** Decision D1 is not approved. No approval record was created, completed or inferred by this change, by the tool or by any test. Nothing was installed on the Windows host. W04 stays **PARTIALLY COMPLETE and NOT ACCEPTED**.

## 0. Summary

Installation of the three IRR identity files requires one approval record, made by one person: **Ramki**, the sole decision authority and approver of the local, single-user, non-production IIPS. There is no second approver.

| | Revision 1 (`550e5ae`) | Revision 2 (`3b92471`) |
|---|---|---|
| Who approves | Two authorities, "Sai" and "Ramki", both required while the question was open | Ramki alone |
| Open questions the record had to answer | CV-22 Option C; the IRR roster cap of 200; who must approve | None. The first two are settled by reading the rules (section 5); the third by instruction |
| IPD commit of the tool | Not bound | Bound. `install` refuses any other commit and any checkout with changed tool files |
| P04 source | Bound inside the generation | Bound as its own block: batch, authorization, operating mode, checksum, record count |
| Review date | Mandatory | Mandatory. Valid from the approval time until the review date; nothing else |
| Scope | Local, single user, operator-supplied; not product-wide, not production | The same, plus not hosted, not multi-user, not commercial |
| Where the record is kept | Published on IPD `main` | A file on the host, outside the checkout (section 8) |

What did not change: without an approval record nothing is installed, by any route; a record that is incomplete, expired, revoked, by someone else, for another scope or for other files is refused with exit code 7 and nothing is written; `review` shows what would be installed without installing it.

**The practical state today:** the tool can install only after Ramki writes a record for the exact files, the exact IRR commit and the exact IPD commit that the review on the host prints. No such record exists.

**Later record (2026-11-14, host completion).** The sentences of this record that say no approval exists and nothing was installed describe the state at `fff4829`. The operator reports that an approval record was then written on the host for that commit, that a first attempt against another IRR checkout was refused with nothing installed, and that the installation under the record passed. This is the first run of the command-line success path and of the wrapper, and it is reported by the operator, not shown by a test. See [host completion and reconciliation](IIPS-W04-IDENTITY-PROVISIONING-HOST-COMPLETION-RECONCILIATION-2026-11-14.md).

## 1. How to read this record

- **(R)** was run in the sandbox on Linux with Node v22, and the output is in the [evidence directory](../../evidence/integration/w04-identity-single-approver-2026-11-14/README.md).
- **(T)** is pinned by a test in `tests/irr_identity_approval.test.ts` (identifiers `IAP-nn`).
- The Windows wrapper was **not executed**. No PowerShell runtime is available in the sandbox. It was parsed and checked structurally (section 9).
- Revision 1 of this record is in commit `550e5ae`. Its evidence directory is kept as recorded and describes the earlier contract.

## 2. What is enforced, and in what order

`installStagedIdentity` (`src/identity/irr_identity_provisioning.ts`) is the only governed way to install. The command line calls it, and the wrapper calls the command line. It does the following in order and stops at the first refusal. Steps 1 to 6 write nothing.

| # | Check | Refusal |
|---|---|---|
| 1 | An approval record file was named, exists, is a file, is at most 1 MiB and is JSON. | `APPROVAL_MISSING`, `APPROVAL_UNREADABLE` |
| 2 | The record by itself: schema, every field present and of the right kind, no field that is not part of the record, status, approval time and review date, approver, decision, policy version, scope. Done before the staging directory is read. | Section 6 |
| 3 | The record against the running tool: the tool reads the commit of its own checkout and whether any tracked tool file differs from it. | `IPD_TOOL_COMMIT_UNDETERMINED`, `IPD_TOOL_COMMIT_MISMATCH` |
| 4 | The record against the staged files: SHA-256 and size of each of the three files, the P04 source, every field of the generation, the limitations, the withheld records. | `DIGEST_MISMATCH`, `SOURCE_MISMATCH`, `GENERATION_MISMATCH`, `LIMITATION_MISMATCH`, `EXCLUSION_MISMATCH` |
| 5 | The IRR loader gate, as before: run, accepted, for the same bytes, and accepted again when the decision is recomputed from the recorded loader output. | `GATE_NOT_RUN`, `GATE_REFUSED`, `GATE_STALE` |
| 6 | The record against the IRR commit of that gate. This is the complete evaluation; installation continues only if it reports that the record authorizes it. | `IRR_COMMIT_MISMATCH` |
| 7 | The existing installation rules: the data root exists, a different existing identity set is replaced only with `--replace` and after a verified copy, the directory appears in one rename, the installed bytes are verified. | As before |

Properties (T):

- **Every call is checked**, including a repeated call that would change nothing (`ALREADY_INSTALLED`). `IAP-105`.
- **A refusal on account of the approval changes nothing.** For 33 kinds of rejected record, each tried against a data directory that holds an earlier installation and against an empty one, with `--replace` requested: the installed files, their modification times and neighbouring files are unchanged, the empty directory stays empty, and the staging directory gains no backup, no receipt and no other file. The same request with a valid record then replaces the earlier files and keeps a verified copy. `IAP-106`.
- **The order is part of the contract.** A record that is invalid in itself is reported even when nothing is staged; a tool that is not at the approved commit is reported before the staged files are read; a record for other files is reported before the gate is considered. `IAP-104`.
- **The existing safeguards are intact.** The 38 tests of `tests/irr_identity_provisioning.test.ts` (gate refusals, altered files, replacement with backup, interruption) pass; they install under the test policy of section 9.
- **The receipt names the approval.** `install-receipt.json` (schema `IPD_IRR_IDENTITY_INSTALL_RECEIPT_V3`) carries the approval identifier, the SHA-256 of the record file used, the policy version, the decision, the approver, both dates and the IPD tool commit. `IAP-102`.

## 3. The approval record

Schema `IPD_IRR_IDENTITY_APPROVAL_V2`. A JSON document. The definition is `IdentityApprovalRecord` in `src/identity/irr_identity_approval.ts`. Every field is required, and a field that is not listed here is a refusal.

| Field | Content | Compared with |
|---|---|---|
| `schemaVersion` | `IPD_IRR_IDENTITY_APPROVAL_V2` | Fixed |
| `approvalId` | 8 to 128 characters of `A-Z`, `0-9`, `.`, `_`, `-`. The approver chooses it | The withdrawn list of the policy |
| `status` | `APPROVED` or `REVOKED` | Must be `APPROVED` |
| `policyVersion` | `IPD-IRR-IDENTITY-APPROVAL-POLICY-2` | The policy of the running tool |
| `decision.decisionId`, `decision.decisionRecord` | `IIPS-W04-D1` and the path of the decision record | Policy |
| `subject.files` | For each of `eligible-roster.json`, `listing-map.json`, `corporate-actions.json`: `sha256` (64 lower-case hexadecimal characters, in full) and `bytes` | The staged files |
| `subject.p04Source` | `batchId`, `authorizationRef`, `operatingMode`, `checksumSha256`, `recordCount` of the P04 master | The staged report |
| `subject.generation` | Report schema, mapping version, roster label, SHA-256 of the P7 manifest or `null`, SHA-256 of the issuer-key supplement or `null`, required-ISIN coverage or `null`, and the counts of issuers, securities, NSE listings, corporate actions and withheld records | The staged report, field by field |
| `subject.irrCommit` | 40-character commit of the IRR checkout whose loader accepted the files | The gate record |
| `subject.ipdToolCommit` | 40-character commit of the IPD checkout the tool runs from | The running tool (section 4) |
| `scope` | Eight fields, section 5 | Policy. Any difference is a refusal |
| `accepted.exportLimitationCodes` | The limitation codes of the export | Exactly the codes the staged report carries |
| `accepted.additionalLimitationCodes` | The limitations the export report does not carry | Exactly those the policy derives for the staged export (section 5) |
| `accepted.withheldRecords` | Each withheld master record: `isin` and `reasons` | Exactly the records the staged report withholds, with their reasons |
| `approver` | `authorityId`, `name`, `decision` (`APPROVED`), `statement` (the approver's own words) | Policy: `PROGRAM_AUTHORITY_RAMKI`, `Ramki` |
| `approvedAtUtc`, `reviewDateUtc` | UTC, written `YYYY-MM-DDTHH:MM:SSZ`. The review date is later than the approval time | The clock of the machine at the time of the call |
| `revocation` | `null`, or `revokedAtUtc` and `reason` | Must be `null` |

**Validity.** The record authorizes from `approvedAtUtc` until `reviewDateUtc`. Before the first it is `APPROVAL_NOT_YET_VALID`; from the second on it is `APPROVAL_EXPIRED`. The approver chooses the review date; the tool sets no maximum. Renewal is a new record. `IAP-30`.

A blank form is tracked at [`w04-identity-approval/IRR-IDENTITY-APPROVAL-RECORD-TEMPLATE.json`](w04-identity-approval/IRR-IDENTITY-APPROVAL-RECORD-TEMPLATE.json). It carries the field names, the schema, the policy version, the decision and the eight scope values, which are fixed and decide nothing. Every field that decides something is `null` or empty: no digest, no source, no commit, no approver, no date, no accepted limitation. The tool refuses it for 29 reasons (`IAP-80`). It is the only document of this schema in the repository (`IAP-81`).

## 4. The tool commit

The record names the IPD commit the tool was reviewed at. At installation the tool establishes what it is (`readIpdToolIdentity`):

1. It runs from a git checkout of IPD, and `git rev-parse HEAD` gives a commit.
2. `git status` reports no tracked file changed under `src`, `scripts`, `package.json` or `tsconfig.json`. Staged changes count. Untracked files and changes to documents do not.
3. When it runs from `dist`, no compiled identity module is missing or older than its source.

If any of the three cannot be shown, the result is `IPD_TOOL_COMMIT_UNDETERMINED` and nothing is installed. If the commit differs from the record, the result is `IPD_TOOL_COMMIT_MISMATCH`. `IAP-67`, `IAP-104`, `IAP-108`, `IAP-109`.

Consequences:

- **Any new commit of the checkout needs a new record**, including a commit that changes only documents and a merge commit. The commit to state is the one `review` prints on the host at the time of the review, not one quoted in this record.
- **The record cannot be a tracked file of the same checkout.** Committing it would change the commit it names. It is kept on the host outside the checkout. For that reason revision 1's requirement that the record be published on IPD `main` is withdrawn; the install receipt carries the SHA-256 of the record file used.
- `review` writes the commit into the review record only when the three conditions hold. Otherwise it says the commit is not available and reports `COMPLETE, NOT YET READY FOR APPROVAL` (R: `review-run-modified-tool-3b92471.txt`).

## 5. The policy: what a record cannot change

`IDENTITY_APPROVAL_POLICY`, version `IPD-IRR-IDENTITY-APPROVAL-POLICY-2`, in `src/identity/irr_identity_approval.ts`. It is fixed in code, and changing it is a commit, which the tool-commit binding then makes visible. `installStagedIdentity` always uses it; the command line has no option that names another.

| Item | Value | Source |
|---|---|---|
| Decision | `IIPS-W04-D1`, decision record of 2026-11-13 | Decision record, section 2 |
| Approver | `PROGRAM_AUTHORITY_RAMKI`, "Ramki". One approval is sufficient; no other approver is recognised | Roadmap: "PERSONAL APPLICATION PRINCIPAL" and single decision authority; the instruction for this revision |
| Permitted scope | Environment `LOCAL_SINGLE_USER_IIPS`; consumer `IRR_INVESTMENT_IDENTITY_SOURCES`; roster class `OPERATOR_SUPPLIED`; product-wide authoritative use, production use, hosted use, multi-user use and commercial use all `false` | Proposal items P-2 and P-4; P01 rule ID-4 |
| Limitations of every export | `NON_EQ_SERIES_HOLDINGS_UNRESOLVED`, `NSE_SOURCE_FILE_WITHOUT_RETRIEVAL_RECEIPT` | Proposal item P-6 |
| Limitation of a roster above 200 issuers | `ROSTER_LARGER_THAN_IID_DESIGN_DEFAULT` | Determination 2 below |
| Limitation of a generation that counted no holdings coverage | `HOLDINGS_COVERAGE_NOT_MEASURED` | Qualification Q-1 of the decision record |
| Withdrawn approvals | None | |

P01 rule ID-4 is unchanged: product-wide authoritative use of P04 needs a new ADR. The scope says `false`, and a record that says anything else is refused (`IAP-41`).

### The two rules that were examined

Revision 1 asked the approval record whether two IRR rules apply. The instruction for this revision was to settle that by reading the rules. The result is part of the policy, is printed by `review`, and is written into every review record with its basis. The record is not asked, and a record that tries to answer is refused as carrying an unknown field (`IAP-70`).

**Determination 1. CV-22 Option C does not apply.** Rule: IRR `docs/integration/IIPS_v3.0_CV22_OPTION_C_PA_DECISION_2026-10-19.md`, section 3, five prerequisites before any expansion of the governed sector-reference universe.

- The rule governs proposals to expand the 13-row sector-reference universe that IRR serves to its Executive and Watchlists surfaces, with D05 as the possible source.
- This installation writes three files to `<data root>/investment/identity` and nothing else. The sector-reference universe is another data set, read by other code, and is not changed.
- Section 3.3 of the rule itself separates the sector-reference `canonicalSecurityId` from other identities.
- The files are an operator-supplied roster for one local user, not a product-wide universe.
- The rule also says that D05 is "not an admitted IRR owner-data universe", and its second prerequisite speaks of an "exact eligible roster". Both are stated for an expansion of the sector-reference universe. The payload the rule assessed is the earlier D05 payload of 2,250 records. These files are generated from the P04 master of the later replacement batch (2,390 records), which the rule did not assess.

Consequence: no CV-22 prerequisite is checked. The installation target is fixed to the identity directory, so the tool cannot change what the rule governs.

**Determination 2. The IID roster default of 200 applies as a design default, not as a limit.** Rule: IRR `docs/integration/IIPS_V3_IID_INVESTMENT_INTELLIGENCE_DESIGN_REFINEMENT_2026-11-05.md`, section 7.2 item Q-2 and R-19: "Operator-curated file, seeded from holdings ∪ watchlist, capped at 200, every row requiring an ISIN".

- The item is about this file, so it is in scope.
- It is recorded as a default. The document states that it is not an authority act and creates no implementation obligation, and R-19 calls the roster a data decision.
- Its stated reason is the effort of entering data for each company, not correctness.
- IRR enforces no roster size: its loader accepted 2,388 issuers at the gated commit (R).
- R-17 makes the roster an operator-maintained file; the operator is the approver.

Consequence: a roster above 200 issuers is not refused. It carries `ROSTER_LARGER_THAN_IID_DESIGN_DEFAULT`, which the record must accept by name; a roster of 200 or fewer does not carry it (`IAP-71`). The proposed roster has 2,388 issuers and is not seeded from holdings and watchlist, so it carries the limitation.

**These are readings made for this change, not acts of the authority that wrote the rules.** They are in the policy so that they are visible and reviewed with the code. The reading of CV-22 rests on the distinction between the sector-reference universe and the identity directory. If Ramki reads CV-22 as covering any D05-derived roster in IRR, the determination is wrong, and the correction is a change of the policy, which gives a new policy version and a new tool commit.

Section 2.3 of the same IID document says the company-analysis universe cannot be D05, because the earlier payload held 52 real and 2,198 synthetic records without a per-row discriminator. The files here come from the replacement batch and carry the limitation `SOURCE_AUTHORITY_CONDITIONAL` of the export. Whether the replacement batch removes the reason for that caveat was not assessed by this change. The decision record lists what is known about the batch (A-4).

## 6. Refusal codes

All are exit code 7 on the command line. Several can be reported at once; the first is the code on the `RESULT` line.

| Code | Meaning |
|---|---|
| `APPROVAL_MISSING` | No record was named, or the file does not exist or is not a file |
| `APPROVAL_UNREADABLE` | Larger than 1 MiB, not JSON, or not a JSON object |
| `APPROVAL_SCHEMA_UNKNOWN` | Another kind of document: the review record, the provisioning report, or a record of revision 1 |
| `APPROVAL_MALFORMED` | A field is missing, unknown, of the wrong kind, empty, padded, a placeholder, a shortened digest or commit, or a date that is not a real UTC instant; or the review date is not later than the approval time |
| `APPROVAL_POLICY_UNUSABLE` | The policy itself names no usable approver |
| `APPROVAL_REVOKED` | Status `REVOKED`, a revocation entry, or the identifier is on the withdrawn list of the policy |
| `APPROVAL_EXPIRED` | The review date has been reached, or the current time cannot be determined |
| `APPROVAL_NOT_YET_VALID` | Approved at a time in the future |
| `APPROVER_NOT_AUTHORIZED` | The approver is not the approver of the policy, by identifier or by name |
| `APPROVER_DID_NOT_APPROVE` | The approver's decision is not `APPROVED` |
| `POLICY_VERSION_MISMATCH` | Written under another policy version |
| `DECISION_REFERENCE_MISMATCH` | Another decision or another decision record |
| `SCOPE_MISMATCH` | Any scope field differs from the permitted scope |
| `LIMITATION_MISMATCH` | The limitations accepted are not exactly the limitations that exist |
| `EXCLUSION_MISMATCH` | The exclusions accepted are not exactly the records withheld, with their reasons |
| `DIGEST_MISMATCH` | The SHA-256 or size of a staged file differs. Reported per file |
| `SOURCE_MISMATCH` | A field of the P04 source differs |
| `GENERATION_MISMATCH` | A field of the generation differs |
| `IRR_COMMIT_MISMATCH` | Another IRR commit than the one whose loader accepted the files, or that commit is unknown |
| `IPD_TOOL_COMMIT_UNDETERMINED` | The tool cannot show which commit it is, or it has changed tool files or a stale build |
| `IPD_TOOL_COMMIT_MISMATCH` | Another IPD commit than the one the tool runs from |

## 7. Commands and the Windows wrapper

```
node scripts/provision-irr-identity-sources.mjs review --staging <dir> [the options of generate]
     [--irr-root <IRR checkout>] [--as-of YYYY-MM-DD]
node scripts/provision-irr-identity-sources.mjs check-approval --approval <record.json> [--staging <dir>]
node scripts/provision-irr-identity-sources.mjs install --staging <dir> --data-dir <IIPS_DATA_DIR>
     --approval <record.json> [--replace]
```

**`review` — review only.** Runs `generate` and, with `--irr-root`, `validate`. Then prints everything an approval record has to state: the three digests and sizes, the P04 source, the generation, both commits, the scope, the limitations and withheld records to accept, the approver, the validity rule and the two determinations. It writes the same as `<staging>/review-for-approval.json` (schema `IPD_IRR_IDENTITY_REVIEW_V2`) with `readyForApproval` true only when both commits are available. It has no option that names a data directory or an approval record and calls no installing function. The review record has no approver, decision or date, and is refused as an approval (`IAP-110`, `IAP-120`). A later `generate` or `validate` removes it, so that it cannot describe an earlier state.

**`check-approval` — read-only.** Applies the governed policy to a record and writes nothing. It always compares the record with the running tool. With `--staging` it also compares it with the staged files and, if an accepted gate of those files exists, with its IRR commit. It prints what it compared. It says `RESULT: PASS` only when every comparison was made and nothing failed (`IAP-107`, `IAP-123`).

**`install`.** As section 2. `--approval` is required.

| Exit code | Meaning |
|---|---|
| 0 | The step passed |
| 2 | `generate`, `review`: an input was refused |
| 3 | `generate`, `review`: an acknowledgement is required |
| 4 | `validate`, `review`: IRR's loader gate did not accept the staged files |
| 5 | `install`, `check-approval`: refused for a reason other than the approval |
| 6 | The endpoint did not answer from the gated roster |
| **7** | `install`, `check-approval`: the approval record is missing or does not authorize the staged files. Nothing was installed or changed |
| 64 | Usage error, or a missing or stale build |

**No command creates, completes or infers an approval** (`IAP-124`). There is no `approve` command and no option that skips, relaxes or supplies the check; `--force`, `--skip-approval`, `--policy` and the like are usage errors. The approval module has no file access. The provisioning module reads an approval record and never writes one.

**Windows wrapper** `scripts/Invoke-IrrIdentityProvisioning.ps1`. **Not executed.** Its logic is as in revision 1; only its texts changed.

- Without `-ReviewOnly` and without `-ApprovalRecordPath` it ends with `RESULT: NOT RUN`, exit code 2, before any step and before the tool is called. `-ReviewOnly` together with `-ApprovalRecordPath`, `-Replace` or `-PortfolioId` is also `NOT RUN`.
- With `-ReviewOnly` it calls the tool's `review` command and exits. It passes no data directory and no approval record.
- Otherwise it runs five steps: the approval record by itself and against the tool (`check-approval`); `generate`; `validate`; `install` with `--approval`; the endpoint. A refused record is `RESULT: FAIL`, exit code 1, at step 1 before anything is generated, or at step 4 before anything is installed.
- The wrapper has one call of `install`, and it carries `--approval` (`IAP-130`).

```powershell
# Review only. Installs nothing.
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-IrrIdentityProvisioning.ps1 -ReviewOnly -AcceptWithheld 2

# Install. Refused unless the record authorizes exactly the generated files.
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-IrrIdentityProvisioning.ps1 -AcceptWithheld 2 -ApprovalRecordPath <path of the approval record>
```

## 8. Procedure for the approver

This is how the approval is made. It has not been done.

1. **Bring the host checkouts to the commits that are to run**, IPD and IRR, and build IPD (`npm ci`, `npm run build:tsc`). Do not change either checkout between the review and the installation.
2. **Review.** Run the wrapper with `-ReviewOnly -AcceptWithheld 2`. The run must end with `REVIEW RESULT: COMPLETE` and not with `NOT YET READY FOR APPROVAL`. Read what it prints: the files, the source, the limitations, the withheld records, the two determinations of section 5.
3. **Decide.** If the answer is no, stop here; nothing is installed.
4. **Write the record.** Copy the blank form to a place on the host outside both checkouts. Fill `subject` and `accepted` from the review record `review-for-approval.json` in the staging directory (`subject` as it stands; `accepted` from `toBeAcceptedExplicitly`). Then enter, yourself: `approvalId`; `status` `APPROVED`; `approver` with `authorityId` `PROGRAM_AUTHORITY_RAMKI`, `name` `Ramki`, `decision` `APPROVED` and a statement in your own words; `approvedAtUtc`; `reviewDateUtc`. The tool fills in none of it.
5. **Check.** `node scripts\provision-irr-identity-sources.mjs check-approval --approval <record> --staging <staging>` must report `RESULT: PASS`.
6. **Install** with the wrapper and `-ApprovalRecordPath <record>`.
7. **Keep the record.** The receipt in the staging directory carries its SHA-256.

**To withdraw an approval:** delete the record file, or mark it `REVOKED`. The withdrawn list of the policy also works, and changes the tool commit. A withdrawal stops later installations; it does not remove installed files (the provisioning record, section 10, says how to undo an installation).

**A new record is needed** after any new commit of the IPD checkout or of the IRR checkout on the host, a new master batch, a new mapping version, a different withheld set, a new limitation, or the passing of the review date.

## 9. Tests and evidence

| Check | Result |
|---|---|
| `tests/irr_identity_approval.test.ts` | 48 tests, 48 passed. The contract (`IAP-01` to `IAP-81`): a valid record; structure; who approved; status and time; decision, policy version and scope; limitations and exclusions; the three digests, the P04 source, the generation and both commits; the two examined rules; the blank template. Enforcement (`IAP-100` to `IAP-110`). Command line (`IAP-120` to `IAP-124`). Wrapper text (`IAP-130`, `IAP-131`) |
| `tests/irr_identity_provisioning.test.ts` | 38 tests, 38 passed |
| IPD `npm test` | 1,638 executed, 1,637 passed, 1 skipped (as before), 0 failed. At revision 1: 1,634 executed |
| IPD `npx tsc --noEmit`, `npm run build:tsc` | Clean |
| Twenty-two deliberate faults in the compiled code, one at a time | Each makes at least one test fail. Among them: the tool commit not compared; a modified tool accepted; a stale build accepted; the approver's name or identifier not compared; the review date boundary moved; the 200-issuer boundary moved; the roster limitation never required; the P04 source not compared; the policy version not compared; commercial use dropped from the scope; the complete evaluation skipped. Not committed |
| Wrapper, tree-sitter PowerShell grammar | 400 lines, 0 error nodes |
| Wrapper, structural validator of this branch (`windows-setup/.validate-scripts.py`) | 23 rules pass, 3 fail: as in revision 1 and before it |
| Wrapper, structural validator of PR #156 (`c260a82`) | 29 rules pass, 3 fail: as in revision 1. The three are the rules that require the shared library, as recorded in the provisioning record |

**The cases of the enforcement instruction**, and where each is tested:

| Case | Unit | No change to installed files (`IAP-106`) |
|---|---|---|
| Missing approval | `IAP-100` | Yes |
| Invalid approval structure | `IAP-10`, `IAP-11`, `IAP-12` | Yes |
| Approver is not Ramki | `IAP-20`, `IAP-103`, `IAP-122` | Yes |
| Approver did not approve | `IAP-21` | Yes |
| Expired approval, approval not yet valid | `IAP-30` | Yes |
| Revoked approval | `IAP-31` | Yes |
| Other decision or policy version | `IAP-40` | Yes |
| Wrong permitted scope, including hosted, multi-user, commercial | `IAP-41` | Yes |
| Modified limitation | `IAP-50`, `IAP-71`, `IAP-72` | Yes |
| Modified exclusion | `IAP-51` | Yes |
| Roster, listing-map, corporate-actions digest mismatch | `IAP-60`, `IAP-61`, `IAP-62` | Yes |
| Other P04 source, other generation | `IAP-66`, `IAP-64` | Yes |
| Other IRR commit | `IAP-65` | Yes |
| Other IPD tool commit, modified tool | `IAP-67`, `IAP-104`, `IAP-108`, `IAP-109` | Yes |
| One approval by the one approver installs | `IAP-23`, `IAP-102` | |
| Review only installs nothing | `IAP-120`, `IAP-121` | |

**Recorded runs (R):** [`evidence/integration/w04-identity-single-approver-2026-11-14/`](../../evidence/integration/w04-identity-single-approver-2026-11-14/README.md). A review of the real export from a clean checkout at `3b92471` against IRR `main` `08411bc` with IRR's own loader, ending ready for approval; the same review with one tool file changed, ending not ready; and nine refused attempts with the state of the data directory and the staging directory before and after.

**How acceptance is tested without an approval.** No test holds a record in Ramki's name; that would be a forged approval. Acceptance is tested under a test policy (`tests/support/irr_identity_approval_fixture.ts`) that is the governed policy with the approver, the decision and the policy version replaced by fictitious ones. Records built for it are written to temporary directories only. The governed entry point and the command line refuse them (`IAP-103`, `IAP-122`). The test policy can be passed only to `installStagedIdentityUnderPolicy`, which no script calls (`IAP-124`).

## 10. Limits: what the check does not do, and what is not shown

- **It does not authenticate the author.** A record is a file. The check establishes that the file is complete, current, made in Ramki's name and bound to these bytes, this source and these two commits. That Ramki made it is not verified. On a single-user machine the person who can write the file is the person who can also copy three files into the data directory by hand; the check governs this tool, not the directory.
- **It trusts the clock of the machine** for the approval time and the review date, and it trusts `git` on the machine for the tool commit. The tool commit check covers tracked files under `src`, `scripts`, `package.json` and `tsconfig.json` and the age of the compiled identity modules. It does not hash `dist` or `node_modules`.
- **The tool-commit check was not run on Windows.** It needs `git` on the path of the process. If `git` is absent, the result is `IPD_TOOL_COMMIT_UNDETERMINED` and nothing is installed. Whether a Windows checkout with line-ending conversion reports no changed file is not shown; the review run on the host shows it.
- **The tool-commit refusals are shown by tests, not by a recorded command-line run.** A command-line run that reaches the tool comparison needs a record in Ramki's name, and none was made for the purpose.
- **The success output of `install` on the command line is exercised by no test**, for the same reason. The library path beneath it is tested under the test policy. The first real installation will be the first run of those few lines of output.
- **The Windows wrapper was not executed.** Its text is tested, it parses, and it passes the structural validators as before. Its behaviour in Windows PowerShell 5.1 is not shown.
- **The earlier transcripts** in `evidence/integration/w04-identity-source-provisioning-2026-11-13/` show `install` succeeding without an approval, and those in `evidence/integration/w04-identity-approval-enforcement-2026-11-13/` show the two-authority contract. They are left as recorded and cannot be reproduced with the current tool.
- **IRR is unchanged.** IRR's loader does not know about the approval and will read any well-formed files in its data directory.
