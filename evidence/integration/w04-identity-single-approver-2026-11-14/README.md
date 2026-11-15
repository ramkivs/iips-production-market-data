# W04 — identity provisioning, single-approver approval enforcement: evidence

Record: [`docs/integration/IIPS-W04-IDENTITY-PROVISIONING-APPROVAL-ENFORCEMENT-2026-11-13.md`](../../../docs/integration/IIPS-W04-IDENTITY-PROVISIONING-APPROVAL-ENFORCEMENT-2026-11-13.md) (revision 2).

Everything here was produced in the sandbox, on Linux, with Node v22, at sandbox clock 2026-11-14T03:03Z. Nothing was run on the Windows host. The IPD tool ran from a checkout at commit `3b924711b53fd49f67adc97bbb6e26c03f614971` with no changed tool file, except where stated. IRR code was run unmodified at `main` `08411bcd6d782a601fe5c82cc9983d076831148d`.

**No approval record exists, and none is stored here.** No run below installed anything.

| File | What it is |
|---|---|
| `review-run-3b92471.txt` | `review --accept-withheld 2 --irr-root <IRR checkout> --as-of 2026-11-14` on the tracked P04 master: generation, IRR's own loader gate, and everything an approval record has to state, including both commits, the approver, the validity rule and the two determinations. Ends `REVIEW RESULT: COMPLETE`. Exit code 0. Then the content of the staging directory and of the (empty) data root. |
| `review-for-approval-3b92471.json` | The review record that run wrote. Schema `IPD_IRR_IDENTITY_REVIEW_V2`, `readyForApproval` true. It is not an approval and the tool refuses it as one (attempt 5 below). |
| `review-run-modified-tool-3b92471.txt` | The same review with one line appended to a tracked tool file and not committed. The tool commit is reported as not available, the result is `COMPLETE, NOT YET READY FOR APPROVAL`, and the review record has `readyForApproval` false and no tool commit. The file was restored afterwards. |
| `refusal-runs-3b92471.txt` | Nine attempts on the same staging directory, with the gate accepted, against a data root that holds three files placed by hand to stand for an earlier installation. SHA-256 and modification time of every file of the data root and of the staging directory before and after. |

The nine attempts of `refusal-runs-3b92471.txt`:

| # | Attempt | Result |
|---|---|---|
| 1 | `install` without an approval record | `APPROVAL_MISSING`, exit code 7 |
| 2 | `install --replace` without an approval record | `APPROVAL_MISSING`, exit code 7 |
| 3 | `install` with an approval path that does not exist | `APPROVAL_MISSING`, exit code 7 |
| 4 | `install` with the blank template | `APPROVAL_MALFORMED` 28 times and `APPROVER_DID_NOT_APPROVE`, exit code 7 |
| 5 | `install` with the review record of these very files | `APPROVAL_SCHEMA_UNKNOWN`, exit code 7 |
| 6 | `install` with a complete record for exactly these files, both commits included, made in another approver's name | `POLICY_VERSION_MISMATCH`, `DECISION_REFERENCE_MISMATCH`, `APPROVER_NOT_AUTHORIZED`, exit code 7 |
| 7 | `check-approval` of the blank template | Refused, exit code 7 |
| 8 | `check-approval` of the record of attempt 6 against the staged files | Compared with the tool, the staged files and the gate; refused, exit code 7 |
| 9 | `install --skip-approval` | Usage error, exit code 64 |

The state after is identical to the state before, line for line: the three hand-placed files are untouched, and the staging directory has no receipt and no backup.

## The record of attempt 6

It was built in a temporary directory with the test fixture `tests/support/irr_identity_approval_fixture.ts`, for the real digests, the real P04 source, the real IRR commit and the real tool commit, in the name `TEST_AUTHORITY_NOT_A_PERSON`, under a decision that is not a decision. It is not stored. It shows that a record which matches the files and both commits in every respect is still refused when it is not made by the approver of the policy.

## What these runs do not show

- **A refusal on account of the tool commit, on the command line.** `install` compares the tool commit only after the record has passed by itself, and a record passes by itself only in Ramki's name. No such record was made for a demonstration. The refusals `IPD_TOOL_COMMIT_MISMATCH` and `IPD_TOOL_COMMIT_UNDETERMINED` are shown by the tests `IAP-67`, `IAP-104`, `IAP-106`, `IAP-108` and `IAP-109`, under the test policy.
- **A successful installation on the command line**, for the same reason. Tests `IAP-102` and `IAP-106` show it through the library under the test policy.
- **Anything on Windows.**

## Reproduce

```
npm ci && npm run build:tsc
node scripts/provision-irr-identity-sources.mjs review --staging <staging> --accept-withheld 2 --irr-root <IRR checkout> --as-of 2026-11-14
mkdir <data root>
node scripts/provision-irr-identity-sources.mjs install --staging <staging> --data-dir <data root>
node scripts/provision-irr-identity-sources.mjs install --staging <staging> --data-dir <data root> --approval docs/integration/w04-identity-approval/IRR-IDENTITY-APPROVAL-RECORD-TEMPLATE.json
node scripts/provision-irr-identity-sources.mjs check-approval --approval docs/integration/w04-identity-approval/IRR-IDENTITY-APPROVAL-RECORD-TEMPLATE.json
```

The tool commit a reproduction prints is the commit of the checkout it runs from. It equals `3b92471…` only at that commit. Later commits of this branch that change documents only give another commit and the same three digests.

## Notes on the transcripts

- Paths are replaced by `<staging>`, `<data root>`, `<IRR checkout>`, `<IPD checkout>` and `<scratch>`.
- The three digests of the review run equal those of `../w04-identity-source-provisioning-2026-11-13/provisioning-report.json`, of `../w04-identity-approval-enforcement-2026-11-13/review-run-08411bc.txt` and of test `IIX-04`.
- The transcripts were recorded at `3b92471`. The checks of the repository at the commit that carries this directory are in section 9 of the record.
