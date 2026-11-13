# Snapshot-to-Live W04 — identity provisioning: governance approval enforcement

**Date:** 2026-11-13
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md)). Follows the [provisioning record](IIPS-W04-IRR-IDENTITY-SOURCE-PROVISIONING-2026-11-13.md) and the [decision record D1 to D4](IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md).
**Repository:** IPD `ramkivs/iips-production-market-data`, this branch (PR #157).

**This record describes a check. It is not an approval, and no approval exists.** Decision D1 is not approved. No approval record was created, completed or inferred by this change, by the tool, or by any test. Nothing was installed on the Windows host. W04 stays **PARTIALLY COMPLETE and NOT ACCEPTED**.

## 0. Summary

Until this change the block on provisioning was a sentence in the decision record: `install` and the Windows wrapper ran without an approval. They no longer do.

| | Before (`ec11cf9`) | Now |
|---|---|---|
| `install` without an approval record | Installed | Refused, exit code 7, nothing written |
| Windows wrapper without an approval record | Ran all four steps | `NOT RUN`, exit code 2, before any step and before the tool is called |
| A record that is incomplete, expired, revoked, by the wrong people, for another scope, or for other files | Not looked at | Refused, exit code 7, nothing written |
| Seeing the proposed files and their digests without installing | Only by running `generate` and `validate` by hand | `review` command and wrapper switch `-ReviewOnly` |

The check is fail-closed: installation proceeds only when the record is shown to authorize exactly the three staged files, the generation that produced them and the IRR commit whose loader accepted them. Anything that cannot be shown is a refusal.

**The practical consequence today: nothing can be installed with this tool**, by anyone, because no approval record of the required authorities exists.

## 1. How to read this record

- **(R)** was run in the sandbox on 2026-11-13, on Linux with Node v22, and the output is recorded in the evidence directory.
- **(T)** is pinned by a test in `tests/irr_identity_approval.test.ts` (identifiers `IAP-nn`).
- The Windows wrapper was **not executed**. No PowerShell runtime is available in the sandbox. It was parsed and checked structurally (section 9).
- Section 10 lists the choices this change had to make that are governance matters, so that the authority can confirm or change them. Section 11 lists what is not shown.

## 2. What is enforced, and in what order

`installStagedIdentity` (`src/identity/irr_identity_provisioning.ts`) is the only governed way to install. The command line calls it, and the wrapper calls the command line. It does the following in order, and stops at the first refusal. Steps 1 to 5 write nothing.

| # | Check | Refusal |
|---|---|---|
| 1 | An approval record file was named, exists, is a file, is at most 1 MiB and is JSON. | `APPROVAL_MISSING`, `APPROVAL_UNREADABLE` |
| 2 | The record by itself: schema, every field present and of the right kind, no field that is not part of the record, status, dates, approvers, governance references, scope, the determinations of the open questions. Done before the staging directory is read. | Section 5 |
| 3 | The record against the staged files: the SHA-256 and size of each of the three files, every field of the generation, the limitations the export reports, the records the export withholds. | `DIGEST_MISMATCH`, `GENERATION_MISMATCH`, `LIMITATION_MISMATCH`, `EXCLUSION_MISMATCH`, and two more in section 5 |
| 4 | The IRR loader gate, as before: run, accepted, for the same bytes, and accepted again when the decision is recomputed from the recorded loader output. | `GATE_NOT_RUN`, `GATE_REFUSED`, `GATE_STALE` |
| 5 | The record against the IRR commit of that gate. This is the complete evaluation; installation continues only if it reports that the record authorizes it. | `IRR_COMMIT_MISMATCH` |
| 6 | The existing installation rules: the data root exists, a different existing identity set is replaced only with `--replace` and after a verified copy, the directory appears in one rename, the installed bytes are verified. | As before |

Properties (T):

- **Every call is checked**, including a repeated call that would change nothing (`ALREADY_INSTALLED`). `IAP-105`.
- **A refusal on account of the approval changes nothing.** For 27 kinds of rejected record, each tried against a data directory that holds an earlier installation and against an empty one, with `--replace` requested: the installed files, their modification times and neighbouring files are unchanged, the empty directory stays empty, and the staging directory gains no backup, no receipt and no other file. The same request with a valid record then replaces the earlier files and keeps a verified copy. `IAP-106`.
- **The order is part of the contract.** A record that is invalid in itself is reported even when nothing is staged; a record for other files is reported before the gate is considered. `IAP-104`.
- **The existing safeguards are intact.** The 38 tests of `tests/irr_identity_provisioning.test.ts` (gate refusals, altered files, replacement with backup, interruption) pass unchanged in what they assert; they install under the test policy of section 8.
- **The receipt names the approval.** `install-receipt.json` (schema `IPD_IRR_IDENTITY_INSTALL_RECEIPT_V2`) carries the approval identifier, the SHA-256 of the record file used, the policy version, the decision, the approvers and the dates. `IAP-102`.

## 3. The approval record

Schema `IPD_IRR_IDENTITY_APPROVAL_V1`. A JSON document. The definition is `IdentityApprovalRecord` in `src/identity/irr_identity_approval.ts`. Every field is required, and a field that is not listed here is a refusal.

| Field | Content | Compared with |
|---|---|---|
| `schemaVersion` | `IPD_IRR_IDENTITY_APPROVAL_V1` | Fixed |
| `approvalId` | 8 to 128 characters of `A-Z`, `0-9`, `.`, `_`, `-` | The withdrawn list of the policy |
| `status` | `APPROVED` or `REVOKED` | Must be `APPROVED` |
| `governance.decisionId`, `governance.decisionRecord` | The decision the approval is made under and the record that defines it | Policy: `IIPS-W04-D1` and the decision record |
| `governance.approvalActRef` | Where the act of approval is recorded, for example the pull request that put the record on `main` | Must be stated; not otherwise checked |
| `subject.files` | For each of `eligible-roster.json`, `listing-map.json`, `corporate-actions.json`: `sha256` (64 lower-case hexadecimal characters, in full) and `bytes` | The staged files |
| `subject.generation` | Report schema, mapping version, master batch, master authorization, master checksum, master record count, roster label, SHA-256 of the P7 manifest or `null`, SHA-256 of the issuer-key supplement or `null`, required-ISIN coverage or `null`, and the counts of issuers, securities, NSE listings, corporate actions and withheld records | The staged report, field by field |
| `subject.irrCommit` | 40-character commit of the IRR checkout whose loader accepted the files | The gate record |
| `scope` | `environment`, `consumer`, `rosterDataClass`, `productWideAuthoritativeUse`, `productionUse` | Policy, section 4. Any difference is a refusal |
| `accepted.exportLimitationCodes` | The limitation codes of the export | Exactly the codes the staged report carries |
| `accepted.additionalLimitationCodes` | The limitations found by the D1 investigation that the export report does not carry | Policy, section 4 |
| `accepted.withheldRecords` | Each withheld master record: `isin` and `reasons` | Exactly the records the staged report withholds, with their reasons |
| `qualifications` | For `Q-1` and `Q-2`: `disposition` (`SATISFIED` or `WAIVED`) and a reference | Each once. `Q-1` as `SATISFIED` requires a generation that counted required-ISIN coverage |
| `determinations.cv22OptionC` | `decisionRef`, `applicability` (`APPLIES` or `DOES_NOT_APPLY`), `basisRef`, and for each of the five prerequisites a `determination` and an `evidenceRef` | Section 4 |
| `determinations.irrRosterContentDecision` | `decisionRef`, `applicability`, `basisRef` | Section 4 |
| `approvals` | One entry per approver: `authorityId`, `name`, `designation`, `decision` (`APPROVED`), `approvedAtUtc`, `statement` (the approver's own words) | Policy: recognised and required authorities |
| `approvedAtUtc`, `expiresAtUtc` | UTC, written `YYYY-MM-DDTHH:MM:SSZ`. `expiresAtUtc` is the review date of Q-3: the approval lapses at that instant | The clock of the machine at the time of the call |
| `revocation` | `null`, or who withdrew the approval, when and why | Must be `null` |

A blank form is tracked at [`w04-identity-approval/IRR-IDENTITY-APPROVAL-RECORD-TEMPLATE.json`](w04-identity-approval/IRR-IDENTITY-APPROVAL-RECORD-TEMPLATE.json). It carries the field names and the identifiers that name the form (the decision, the two cited decisions, the five prerequisite identifiers, `Q-1` and `Q-2`). Every field that decides something is `null` or empty: no digest, no scope, no approver, no date, no determination, no accepted limitation. The tool refuses it with more than fifty reasons (`IAP-80`). It is the only document of this schema in the repository (`IAP-81`).

## 4. The policy: what a record cannot change

`IDENTITY_APPROVAL_POLICY` in `src/identity/irr_identity_approval.ts`. It is fixed in code, and changing it is a reviewed commit. `installStagedIdentity` always uses it; the command line has no option that names another.

| Item | Value | Source |
|---|---|---|
| Decision | `IIPS-W04-D1`, decision record of 2026-11-13 | Decision record, section 2 |
| Permitted scope | Environment `LOCAL_SINGLE_USER_IIPS`; consumer `IRR_INVESTMENT_IDENTITY_SOURCES`; roster class `OPERATOR_SUPPLIED`; product-wide authoritative use `false`; production use `false` | Proposal items P-2 and P-4; P01 rule ID-4 |
| Recognised authorities | `PROGRAM_AUTHORITY_RAMKI` ("Ramki", Program Authority) and `PROGRAM_AUTHORITY_SAI` ("Sai", Program Authority) | The authority of record "Sai/Ramki" |
| Required authorities | **Unresolved** (question U-2). While it is unresolved, **both** are required | Section 10, item 1 |
| Additional limitations to accept | `NON_EQ_SERIES_HOLDINGS_UNRESOLVED`, `NSE_SOURCE_FILE_WITHOUT_RETRIEVAL_RECEIPT` | Proposal item P-6 |
| Qualifications to dispose of | `Q-1`, `Q-2` | Decision D1-c |
| CV-22 Option C | IRR record `IIPS-V3-CV22-OPTION-C-PA-DISPOSITION-2026-10-19-01` and its five prerequisites. The five identifiers (`CV22-1-…` to `CV22-5-…`) are this tool's labels for the five items of its section 3 | Question U-1 |
| IRR roster-content decision | Cap of 200 issuers. Cited as `IRR-IID-DESIGN-REFINEMENT-2026-11-05-R19-Q2`, which is this tool's label for the item "Q-2, Roster content" of IRR's `docs/integration/IIPS_V3_IID_INVESTMENT_INTELLIGENCE_DESIGN_REFINEMENT_2026-11-05.md` (not the qualification Q-2 of the decision record) | Question U-17 |
| Withdrawn approvals | None | |

**Open governance questions are represented, not decided.** The policy does not answer U-1, U-2 or U-17. It makes the approval record answer them, and refuses a record that does not:

- **U-2, who must approve.** The rule is `UNRESOLVED`, so every recognised authority is required. That is the one reading under which an approval is valid whichever way the question is answered. When a governance record settles it, the rule is changed to `RESOLVED` with the authorities named and the record cited; a rule that names nobody, names somebody unrecognised or cites nothing authorizes nothing (`IAP-23`).
- **U-1, CV-22 Option C.** The record states whether the five prerequisites apply and on what basis. If it says they apply, each must be recorded as `SATISFIED` with its evidence, or the record is refused. If it says they do not apply, each must be recorded as `NOT_APPLICABLE`. A missing or inconsistent determination is a refusal (`IAP-70`).
- **U-17, the roster-content decision.** The record states whether IRR's decision that caps the roster at 200 issuers applies. If it says it applies, a roster above 200 issuers is refused; the proposed roster has 2,388 (`IAP-71`). The same item says the roster is "seeded from holdings ∪ watchlist". The files do not show how a roster was seeded, so the tool checks the cap only.

## 5. Refusal codes

All are exit code 7 on the command line. Several can be reported at once; the first is the code on the `RESULT` line.

| Code | Meaning |
|---|---|
| `APPROVAL_MISSING` | No record was named, or the file does not exist or is not a file |
| `APPROVAL_UNREADABLE` | Larger than 1 MiB, not JSON, or not a JSON object |
| `APPROVAL_SCHEMA_UNKNOWN` | Another kind of document, for example the review record or the provisioning report |
| `APPROVAL_MALFORMED` | A field is missing, unknown, of the wrong kind, empty, padded, a placeholder, a shortened digest, or a date that is not a real UTC instant; or the validity period is empty |
| `APPROVAL_POLICY_UNUSABLE` | The policy itself names no usable set of required authorities |
| `APPROVAL_REVOKED` | Status `REVOKED`, a revocation entry, or the identifier is on the withdrawn list of the policy |
| `APPROVAL_EXPIRED` | The review date has been reached, or the current time cannot be determined |
| `APPROVAL_NOT_YET_VALID` | Dated in the future |
| `APPROVER_NOT_AUTHORIZED` | An approver is not a recognised authority, carries another name or designation, or is named twice |
| `APPROVER_DID_NOT_APPROVE` | An approver's decision is not `APPROVED` |
| `REQUIRED_AUTHORITY_MISSING` | A required authority has not approved |
| `GOVERNANCE_REFERENCE_MISMATCH` | Another decision, another decision record, or another cited decision |
| `SCOPE_MISMATCH` | Any scope field differs from the permitted scope |
| `LIMITATION_MISMATCH` | The limitations accepted are not exactly the limitations that exist |
| `EXCLUSION_MISMATCH` | The exclusions accepted are not exactly the records withheld, with their reasons |
| `DIGEST_MISMATCH` | The SHA-256 or size of a staged file differs. Reported per file |
| `GENERATION_MISMATCH` | A field of the generation differs |
| `IRR_COMMIT_MISMATCH` | Another IRR commit than the one whose loader accepted the files, or that commit is unknown |
| `QUALIFICATION_NOT_DISPOSED`, `QUALIFICATION_NOT_MET` | `Q-1` or `Q-2` is not disposed of; or `Q-1` is recorded as satisfied and no coverage was counted |
| `CV22_NOT_DETERMINED`, `CV22_PREREQUISITE_NOT_MET` | Section 4 |
| `ROSTER_CONTENT_DECISION_NOT_DETERMINED`, `ROSTER_CONTENT_DECISION_NOT_MET` | Section 4 |

## 6. Commands

```
node scripts/provision-irr-identity-sources.mjs review --staging <dir> [the options of generate]
     [--irr-root <IRR checkout>] [--as-of YYYY-MM-DD]
node scripts/provision-irr-identity-sources.mjs check-approval --approval <record.json> [--staging <dir>]
node scripts/provision-irr-identity-sources.mjs install --staging <dir> --data-dir <IIPS_DATA_DIR>
     --approval <record.json> [--replace]
```

**`review` — review only.** Runs `generate` and, with `--irr-root`, `validate`. Then prints the SHA-256 and size of each proposed file, every field of the generation, the IRR commit of the accepted gate, the limitations and withheld records an approval would have to accept, and the authorities the policy requires. It writes the same as `<staging>/review-for-approval.json`. It has no option that names a data directory or an approval record and calls no installing function. The review record is of schema `IPD_IRR_IDENTITY_REVIEW_V1`, has no approver, decision or date, and is refused as an approval (`IAP-110`, `IAP-120`). A later `generate` or `validate` removes it, so that it cannot describe an earlier state.

**`check-approval` — read-only.** Applies the governed policy to a record and writes nothing. With `--staging` it also compares the record with the staged files and, if an accepted gate of those files exists, with its IRR commit. It prints what it compared. It says `RESULT: PASS` only when all three comparisons were made and nothing failed; when nothing failed in a partial comparison it says so in those words, not `PASS` (`IAP-107`, `IAP-123`).

**`install`.** As section 2. `--approval` is required; without it the result is `APPROVAL_MISSING`.

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

## 7. Windows wrapper

`scripts/Invoke-IrrIdentityProvisioning.ps1`. **Not executed** (section 9).

| Parameter | Effect |
|---|---|
| `-ApprovalRecordPath <file>` | The approval record. Required to install |
| `-ReviewOnly` | Generate, validate and report digests. Installs nothing |

- Without `-ReviewOnly` and without `-ApprovalRecordPath` the script ends with `RESULT: NOT RUN`, exit code 2, before any step and before the tool is called. `-ReviewOnly` together with `-ApprovalRecordPath`, `-Replace` or `-PortfolioId` is also `NOT RUN`.
- With `-ReviewOnly` it calls the tool's `review` command and exits. It passes no data directory and no approval record, does not require the runtime data directory to exist, and does not ask the running transport. Exit code 0 means the proposed files were generated and IRR's loader accepted them; the result line says `PASS (REVIEW ONLY)` and `NOTHING WAS INSTALLED`.
- Otherwise it runs five steps: the approval record by itself (`check-approval`); `generate`; `validate`; `install` with `--approval`; the endpoint. A refused record is `RESULT: FAIL`, exit code 1, at step 1 before anything is generated, or at step 4 before anything is installed.
- The comparison with the digests is made by the tool inside `install`. The wrapper has one call of `install`, and it carries `--approval` (`IAP-130`).
- Sanitized output and the exit codes 0, 1, 2 and 3 are as before. The output now also carries the identifier, the dates and the authority identifiers of the approval record.

```powershell
# Review only. Installs nothing.
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-IrrIdentityProvisioning.ps1 -ReviewOnly -AcceptWithheld 2

# Install. Refused unless the record authorizes exactly the generated files.
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-IrrIdentityProvisioning.ps1 -AcceptWithheld 2 -ApprovalRecordPath <path of the approval record>
```

## 8. Procedure for the approving authorities

This is how an approval would be made. It has not been done.

1. **Review.** Run `review` (or the wrapper with `-ReviewOnly`) against the IRR commit that runs on the host. Read the digests, the generation, the limitations and the withheld records it prints.
2. **Decide** D1-a to D1-c of the decision record, including the answers to U-1, U-2 and U-17.
3. **Write the record.** Copy the blank form and complete every field. The subject values are those the review printed; the scope values are those of section 4; the statements are the approvers' own words. The tool does not fill in any of it.
4. **Publish** the record on IPD `main`, as E-1 of the decision record requires, and put the reference of that act in `governance.approvalActRef`.
5. **Check.** `check-approval --approval <record> --staging <dir>` must report `RESULT: PASS`.
6. **Install** with `--approval <record>`.

If U-2 is answered "one approver is sufficient", the policy rule is changed first, in a reviewed commit that cites the governance record (section 4). A record signed by one authority is refused until then.

**To withdraw an approval:** add its identifier to `revokedApprovalIds` of the policy in a reviewed commit. Marking the record `REVOKED` also works, but only on machines that hold the marked copy. A withdrawal stops later installations; it does not remove installed files (the provisioning record, section 10, says how to undo an installation).

**The approval is bound to more than the files.** A new IRR commit on the host, a new master batch, a new mapping version, a different withheld set or a new limitation each need a new record. So does the passing of the review date.

## 9. Tests and evidence

| Check | Result |
|---|---|
| `tests/irr_identity_approval.test.ts` | 44 tests, 44 passed. The contract (`IAP-01` to `IAP-81`): a valid record; structure; who approved; status and time; governance reference and scope; limitations and exclusions; each of the three digests, the generation and the IRR commit; the three open questions; the blank template. Enforcement (`IAP-100` to `IAP-110`). Command line (`IAP-120` to `IAP-124`). Wrapper text (`IAP-130`, `IAP-131`) |
| `tests/irr_identity_provisioning.test.ts` | 38 tests, 38 passed. `IIP-42` now expects exit code 7 without an approval. `IIP-43` now tests the receipt rule through the library, because the command line cannot be shown installing (section 11) |
| IPD `npm test` | 1,634 executed, 1,633 passed, 1 skipped (as before), 0 failed. Before this change: 1,590 executed |
| IPD `npx tsc --noEmit`, `npm run build:tsc` | Clean |
| Twelve deliberate faults in the compiled code, one at a time | Each makes at least one test fail. Faults: each of the three approval checks of `install` skipped; the missing-record check skipped; the expiry boundary moved; file size not compared; the withdrawn list ignored; unknown fields tolerated; the IRR commit not compared; one authority accepted under the unresolved rule; scope not compared; a partial comparison reported as authorizing. Not committed |
| Wrapper, tree-sitter PowerShell grammar | 398 lines, 0 error nodes |
| Wrapper, structural validator of this branch (`windows-setup/.validate-scripts.py`) | 23 rules pass, 3 fail: before and after this change |
| Wrapper, structural validator of PR #156 (`c260a82`) | 29 rules pass, 3 fail: before and after this change. The three are the rules that require the shared library, as recorded in the provisioning record |

**The cases named in the instruction for this change**, and where each is tested:

| Case | Unit | No change to installed files (`IAP-106`) |
|---|---|---|
| Missing approval | `IAP-100` | Yes |
| Invalid approval structure | `IAP-10`, `IAP-11`, `IAP-12` | Yes |
| Unauthorized approver | `IAP-20` | Yes |
| Missing required authority | `IAP-21`, `IAP-22`, `IAP-23` | Yes |
| Expired approval | `IAP-30` | Yes |
| Revoked approval | `IAP-31` | Yes |
| Incorrect governance reference | `IAP-40` | Yes |
| Wrong permitted scope | `IAP-41` | Yes |
| Modified limitation | `IAP-50` | Yes |
| Modified exclusion | `IAP-51` | Yes |
| Roster digest mismatch | `IAP-60` | Yes |
| Listing-map digest mismatch | `IAP-61` | Yes |
| Corporate-actions digest mismatch | `IAP-62` | Yes |
| Valid approval installs | `IAP-102` | |
| Review only installs nothing | `IAP-120`, `IAP-121` | |

**Recorded runs (R):** [`evidence/integration/w04-identity-approval-enforcement-2026-11-13/`](../../evidence/integration/w04-identity-approval-enforcement-2026-11-13/README.md). A review of the real export against IRR `main` `08411bc` with IRR's own loader, and nine refused attempts on the same staging directory with the state of the data directory and the staging directory before and after.

**How acceptance is tested without an approval.** No test may hold a record in the name of a real authority; that would be a forged approval. Acceptance is tested under a test policy (`tests/support/irr_identity_approval_fixture.ts`) that is the governed policy with its two authorities and its decision replaced by fictitious ones. Records built for it are written to temporary directories only. The governed entry point and the command line refuse them (`IAP-103`, `IAP-122`). The test policy can be passed only to `installStagedIdentityUnderPolicy`, which no script calls (`IAP-124`).

## 10. Choices made in this change that the authority should confirm

The instruction was to enforce the approval. These points had no answer in any record, and the check could not be built without settling them one way. Each is a conservative reading; each is a line in the policy or the schema and can be changed in a reviewed commit.

1. **Who the authorities are, and that both are required.** The records name "Sai/Ramki" as the authority of record and do not say whether one is sufficient (U-2). The policy recognises the two, by first name as the records give them, and requires both. If the answer is one, the tool is stricter than necessary until the rule is changed. The roadmap names Ramki as "PERSONAL APPLICATION PRINCIPAL, under standing global PA grant" for the application scope; it does not say whether that grant covers D1, and this change does not read it as the answer.
2. **The record is a JSON document, and an amendment is not a field.** The text form of the decision record (section 2.6) allowed "APPROVED WITH AMENDMENTS". The tool accepts `APPROVED` only, for the one permitted scope. An amended use needs a changed policy, so that the amendment is reviewed as code and not read from free text.
3. **The IPD commit of the tool is not bound.** E-1 lists it. The record has to be published on `main`, so the commit that carries the record is necessarily later than any commit the record could name. The record binds what the tool produced instead: the three digests, the mapping version and every input of the generation.
4. **The review date is mandatory.** The decision record leaves Q-3 to the approver. A record without `expiresAtUtc` is refused; the approver chooses the date.
5. **The roster-content item is a question the record must answer.** IRR's design refinement describes the roster as an operator-maintained file seeded from holdings and watchlist and capped at 200; IRR's code enforces no cap; no record says whether that item governs a roster exported from P04. It is added to the decision record as U-17. An approval of the proposed 2,388-issuer roster is possible only with the determination that the item does not apply.
6. **The scope identifiers.** `LOCAL_SINGLE_USER_IIPS` and `IRR_INVESTMENT_IDENTITY_SOURCES` are names given here to the use described in P-2. They are labels for that text, not a new definition of it.

## 11. Limits: what the check does not do, and what is not shown

- **It does not authenticate the author.** A record is a file. The check establishes that the file is complete, current, made in the required names and bound to these bytes. That the named authorities really made it is established by where the record is published, which the tool does not verify. The receipt records the SHA-256 of the record used, so that it can be compared with the published one afterwards. A person who can write to the host can also copy three files into the data directory by hand; the check governs this tool, not the directory.
- **It trusts the clock of the machine** for the review date.
- **The success output of `install` on the command line is exercised by no test**, because the command line accepts only a record of the real authorities and none exists. The library path beneath it is tested under the test policy. The first real installation will be the first run of those few lines of output.
- **The Windows wrapper was not executed.** Its text is tested, it parses, and it passes the structural validators as before. Its behaviour in Windows PowerShell 5.1 is not shown.
- **The earlier transcripts** in `evidence/integration/w04-identity-source-provisioning-2026-11-13/` show `install` succeeding without an approval. They were recorded at `b0d7908`, in sandbox directories, before this check existed. They are left as recorded and cannot be reproduced with the current tool.
- **IRR is unchanged.** IRR's loader does not know about the approval and will read any well-formed files in its data directory.
