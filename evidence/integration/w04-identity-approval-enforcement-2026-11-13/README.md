# W04 — identity provisioning, governance approval enforcement: evidence

Record: [`docs/integration/IIPS-W04-IDENTITY-PROVISIONING-APPROVAL-ENFORCEMENT-2026-11-13.md`](../../../docs/integration/IIPS-W04-IDENTITY-PROVISIONING-APPROVAL-ENFORCEMENT-2026-11-13.md).

Everything here was produced in the sandbox on 2026-11-13, on Linux, with Node v22. Nothing was run on the Windows host. IRR code was run unmodified at `main` `08411bcd6d782a601fe5c82cc9983d076831148d`.

**No approval record exists, and none is stored here.** No run below installed anything.

| File | What it is |
|---|---|
| `review-run-08411bc.txt` | `review --accept-withheld 2 --irr-root <IRR checkout> --as-of 2026-11-13` on the tracked P04 master: generation, IRR's own loader gate, the three digests and everything else an approval record would have to state, then the content of the staging directory and of the (empty) data root. Exit code 0. |
| `review-for-approval-08411bc.json` | The review record that run wrote. Schema `IPD_IRR_IDENTITY_REVIEW_V1`. It is not an approval and the tool refuses it as one (run 5 below). |
| `refusal-runs-08411bc.txt` | Nine attempts on the same staging directory, with the gate accepted, against a data root that holds three files placed by hand to stand for an earlier installation. SHA-256 and modification time of every file of the data root and of the staging directory before and after. |

The nine attempts of `refusal-runs-08411bc.txt`:

| # | Attempt | Result |
|---|---|---|
| 1 | `install` without an approval record | `APPROVAL_MISSING`, exit code 7 |
| 2 | `install --replace` without an approval record | `APPROVAL_MISSING`, exit code 7 |
| 3 | `install` with an approval path that does not exist | `APPROVAL_MISSING`, exit code 7 |
| 4 | `install` with the blank template | `APPROVAL_MALFORMED` and 52 further reasons, exit code 7 |
| 5 | `install` with the review record of these very files | `APPROVAL_SCHEMA_UNKNOWN`, exit code 7 |
| 6 | `install` with a complete record for exactly these files, made by fictitious authorities | `GOVERNANCE_REFERENCE_MISMATCH`, `APPROVER_NOT_AUTHORIZED`, `REQUIRED_AUTHORITY_MISSING`, exit code 7 |
| 7 | `check-approval` of the blank template | Refused, exit code 7 |
| 8 | `check-approval` of the fictitious record against the staged files | Refused, exit code 7 |
| 9 | `install --skip-approval` | Usage error, exit code 64 |

The state after is identical to the state before, line for line: the three hand-placed files are untouched, and the staging directory has no receipt and no backup.

## The record of attempt 6

It was built in a temporary directory with the test fixture `tests/support/irr_identity_approval_fixture.ts`, for the real digests and the real IRR commit, in the names of two authorities that do not exist and under a decision that is not a decision. It is not stored. It shows that a record which is complete and matches the files in every respect is still refused when its approvers are not the recognised authorities. No record in the name of a real authority was built, here or in any test.

## Reproduce

```
npm ci && npm run build:tsc
node scripts/provision-irr-identity-sources.mjs review --staging <staging> --accept-withheld 2 --irr-root <IRR checkout> --as-of 2026-11-13
mkdir <data root>
node scripts/provision-irr-identity-sources.mjs install --staging <staging> --data-dir <data root>
node scripts/provision-irr-identity-sources.mjs install --staging <staging> --data-dir <data root> --approval docs/integration/w04-identity-approval/IRR-IDENTITY-APPROVAL-RECORD-TEMPLATE.json
node scripts/provision-irr-identity-sources.mjs check-approval --approval docs/integration/w04-identity-approval/IRR-IDENTITY-APPROVAL-RECORD-TEMPLATE.json
```

## Notes on the transcripts

- Paths are replaced by `<staging>`, `<data root>`, `<IRR checkout>` and `<scratch>`.
- The three digests of the review run equal those of `../w04-identity-source-provisioning-2026-11-13/provisioning-report.json` and of test `IIX-04`.
- Repository checks at this change: `npx tsc --noEmit` clean; `npm run build:tsc` clean; `npm test` 1,634 executed, 1,633 passed, 1 skipped, 0 failed.
