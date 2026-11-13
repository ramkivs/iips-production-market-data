# Snapshot-to-Live W03 — Reports inventory: status record

**Date:** 2026-11-13
**Workstream:** Snapshot-to-Live only (single-user, locally hosted Windows laptop application for personal use).
**Governing plan:** [`IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md`](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md), work item W03.
**Follows:** [`IIPS-W11-DEP1-CAPTURE-EVIDENCE-DISPOSITION-2026-11-13.md`](IIPS-W11-DEP1-CAPTURE-EVIDENCE-DISPOSITION-2026-11-13.md) section 7, item 2 ("W03, remaining half").

## 1. Outcome

**W03 is NOT complete. The Reports half is unblocked technically and is waiting for one host run.**

| W03 half | State | Basis |
|---|---|---|
| Actual portfolio revision | Supported by the host capture: one broker-import portfolio, revision 1, 64 holdings. Operator-reported, subject to review. Not repeated in this pass. | Disposition record, section 2. |
| Actual report inventory | **Not collected.** A safe read-only method was identified and implemented as a Windows collector in IRR. It has not run on the host. | This record. |

No report count, count proxy or reconciliation result is claimed. Nothing in this record is host evidence.

This pass changed no IPD source, test, contract or acceptance criterion. In this repository it adds this
record and updates the status sentence of W03 in the roadmap. W04 and W11 are untouched.

## 2. Why the earlier collection returned `UNKNOWN / UNKNOWN / []`

Reports are persisted in one place: the NP-04 SQLite store that IRR addresses through
`IIPS_NP04_DATABASE_PATH` (table `governed_artifacts`; NP-04 source pinned at this repository's commit
`2e11fa3b689d1a3674a5e4ba1f1de9a559e20494`).

1. **Every IRR Reports read path opens NP-04 for writing.** `loadAuthoritativeNp04Persistence()` calls
   `openDatabase({ createDirectory: true, migrate: true })`, and NP-04 `openDatabase` executes
   `PRAGMA journal_mode = WAL` on every open, whatever the options. Loading reports can create the directory,
   create or verify the migration ledger and apply migrations.
2. **A read-only SQLite connection still writes beside a WAL database.** In a sandbox measurement, opening a
   closed NP-04 store with `readOnly: true` and running one `SELECT` left `np04.db-shm` and `np04.db-wal` in a
   directory that had held only `np04.db`. Opening the file as `immutable` writes nothing but ignores the WAL,
   so committed artifacts can be missing from the result without any error.

A collector that must not initialize, migrate or write therefore had no safe SQLite open available, and
returning nothing was the correct result for it. This was not a host fault. The sandbox measurement was not
repeated on Windows.

## 3. The read-only method

`VERIFIED_PRIVATE_COPY`: SQLite never opens the NP-04 files.

1. Read the database file and its `-wal` file as plain bytes, with read access only, twice.
2. Accept the pair only if both reads of each file are identical and size and modification time did not move.
   Otherwise retry (bounded); a store that never holds still is reported unreadable, never read torn.
3. Write the bytes to a private copy under a local-only output directory outside every repository and outside
   the NP-04 directory.
4. Let SQLite open the copy. It replays the copied WAL there, so committed, uncheckpointed artifacts are seen.
5. Read artifact metadata only. Report content is never selected.
6. Remove the copy.

Toward NP-04 this takes no SQLite lock, opens or creates no `-shm`, runs no migration and creates no file.

## 4. What the inventory reports

- **Store state:** `READ`, `UNAVAILABLE` (not configured, file absent, schema not initialized) or `UNREADABLE`
  (read refused, changed during copy, integrity check failed, schema unrecognised), each with a reason code.
- **Per report type:** `PERSISTED`, `TRANSIENT_ONLY`, `NOT_PRESENT`, `UNAVAILABLE` or `UNREADABLE`, with
  persisted versions, chains, broken chains, head version range and schema versions. Unreadable rows are
  counted by defect and never counted as persisted.
- **Transient** is a repository-derived classification and is labelled so: `Executive` and `Portfolio Summary`
  are computed per request and are persisted only by an explicit operator command. A transient report leaves
  nothing on disk to observe.
- **Reconciliation to captured revision 1:** each persisted artifact is classified as matching the captured
  portfolio and revision, matching the portfolio at another revision, matching the portfolio with no revision
  recorded, referencing another portfolio, or carrying no portfolio reference.

### What the persisted model can link, and what it cannot

| Fact | Consequence |
|---|---|
| Only `investment.holding-disposition` records a portfolio revision (`provenance.portfolioRevision`), with the portfolio id inside its scope. | An exact portfolio-and-revision match is possible for dispositions only. |
| The cross-sector reports record no portfolio revision and, when persisted, are scoped to the certified reference portfolio. | They can never be shown to derive from revision 1. They are reported as referencing another portfolio. |
| No artifact field carries the IPD provenance digest of a portfolio revision. | The collector counts verbatim occurrences; the expected count is 0, and 0 is reported as 0. |
| A match is what the artifact records. | It is not proof that the artifact was computed from the captured holdings. Nothing is inferred from time, type, issuer or holdings. |

If the host holds no artifact for revision 1, the reconciled count is 0. That is a valid W03 finding, and it
is the input W09 and W15–W16 need.

## 5. Where the work is

| Item | Location | Published |
|---|---|---|
| Collector, tests, operator document, additive W03 update of the IRR Stage 2 record | `ramkivs/iips-review-recovered`, commit `93578cfd550a0a7ef11c620603ac75aa7a02fa0d` on top of `main` `08411bcd6d782a601fe5c82cc9983d076831148d` (12 files, +3634; no existing source file modified) | **No.** The push from the build sandbox was refused (HTTP 403). The commit was handed to the operator as a git bundle and a patch. It is not on the IRR remote at the time of writing. |
| This record and the roadmap status sentence | this repository, branch `arena/5570860c-iips-production-market-data` | Yes (PR #157). |

Operator document in IRR, once the commit is published: `docs/integration/W03-REPORTS-INVENTORY-UTILITY-2026-11-13.md`.

## 6. Verification performed (Linux sandbox, synthetic NP-04 stores only)

| Check | Result |
|---|---|
| Inventory tests (`vitest run server/reports/inventory/`) | 3 files, 91 tests, 91 passed |
| IRR `typecheck`, `typecheck:replay-server`, `typecheck:reports-inventory`, `typecheck:portfolio-capture` | exit 0 |
| IRR full suite (`test:ci` and the CI test guard) | 203 files, 3010 tests: 3009 passed, 1 skipped, 0 failed |
| Collector on Node 22.11.0 with the runtime flag passed the way the Windows script passes it | exit 0, inventory collected |

The tests show, on synthetic stores: artifacts present only in the WAL are enumerated while a writer is open;
the store directory is byte-identical before and after, with and without a WAL; no `-shm` or `-wal` appears
beside a closed store; a store changed during the copy is retried and one that keeps changing is refused; an
absent store is reported without creating its directory; no identifier, path or content reaches the sanitized
inventory.

**Not verified:** the PowerShell entry point was not executed (no PowerShell in the sandbox; it is checked
statically). Nothing ran on Windows. Reading the two files while the IRR transport holds them open is expected
to work on Windows but has not been observed; if it is refused the collector reports
`STORE_UNREADABLE / SOURCE_READ_REFUSED` and the remediation is to run it with the IRR transport stopped.

## 7. Remaining blocker and the host step

**Blocker:** the collector must be in the IRR checkout on the Windows host, and must be run there. Both are
operator actions.

From the IRR checkout, in the kind of session the IRR transport is started from:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\collect-reports-inventory.ps1 -ExpectedCaptureSha256 c5dd51f51025e3e17e3b798164c6b8078fa5487392d8f0dfd96be9bb7c79eda3
```

Add `-ValidateOnly` for a preflight that reads and writes nothing. Publish only the two files under
`SANITIZED-INVENTORY`. The local-only directory holds report identifiers and scope tokens and stays on the host.

W03 closes when the sanitized inventory is supplied and reviewed against the roadmap acceptance: counts
reconciled to the captured revision; empty, unavailable and unknown distinguished; no identifiers, values,
secrets or sensitive errors published. Any exit code from 0, 3 or 4 yields a sanitized inventory that can be
recorded; 3 and 4 record why the store could not be read.

## 8. Next roadmap step

**W04 for revision 1** (identity coverage counts for the captured revision), as specified in the disposition
record, section 7, item 3. W04 follows W03 in the roadmap and that order is not changed here. Its input is
the captured revision, which exists; it is host-operator work.
