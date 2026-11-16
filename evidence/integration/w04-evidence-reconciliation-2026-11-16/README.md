# W04 evidence reconciliation — evidence folder (2026-11-16)

Record: [`IIPS-W04-EVIDENCE-RECONCILIATION-AND-ACCEPTANCE-ASSESSMENT-2026-11-16.md`](../../../docs/integration/IIPS-W04-EVIDENCE-RECONCILIATION-AND-ACCEPTANCE-ASSESSMENT-2026-11-16.md).

Nothing in this folder was produced on the Windows host by this record. Nothing here holds a holding identifier, a quantity or a price. One file, the D02 comparison, holds one revision total and one weight sum of the test data, because they are the values it corrects.

## 1. Files

| File | What it is |
|---|---|
| `extract_w04_inventory_counts.py` | Read-only script. It checks the SHA-256 of the inventory archive and the archive's own manifest, then prints the counts of one portfolio. |
| `portfolio-inventory-counts-2026-11-16.json` | Output of that script for `DHAN_PORTFOLIO`: revision 1, 64 holdings, 64 active, security identity populated on 1 and `NULL` on 63. |
| `irr-merge-readback-2026-11-16.json` | What the GitHub API returned for the IRR merge `064195397dfdb32bf0f34a461b02fd6b9f9a8df0`: the commit, the head of IRR `main`, its pull request, its check runs, the state of IRR PRs #563, #566 and #568, and four ancestry comparisons. Read only. |
| `compare_d02_document_with_archive.py` | Read-only script. It checks the SHA-256 of the archive and of the D02 reconciliation document, then compares the document's statements about `DHAN_PORTFOLIO` with the rows of the archive. The archive is the authority. |
| `d02-document-archive-comparison-2026-11-16.json` | Output of that script: three values of the document's line 80 differ from the archive (portfolio name, total market value, weight sum), as does one table count; nine values agree; one figure is not in the archive at all. |
| `source-digests.txt` | SHA-256 of the files this record relies on that are not on `main`, each with its commit and Git blob. |

## 2. Grade of this evidence

- The inventory archive is **host output**: the Principal produced it on the Windows host on 2026-11-16 and published it. This record checked the file and read counts from it. It did not access the host.
- The IRR readback is **verified here** from the GitHub API.
- Neither makes operator-reported evidence of other dates independently verified.

## 3. The inventory archive

The archive is on `main`, carried unchanged in the second pass of the record: [`evidence/d02-inventory-2026-11-16/windows-host/d02-d5-d16-inventory-20261116T143819255Z-96672044.zip`](../../d02-inventory-2026-11-16/windows-host/d02-d5-d16-inventory-20261116T143819255Z-96672044.zip).

| Item | Value |
|---|---|
| First published on | branch `arena/c32aea42-iips-production-market-data`, head `8132c5b6bba0051cbac95dab060096f2983e7396` when read; that copy is untouched |
| Added there by | commit `cd6c0bb8e711e18e4b7f4fba5fdba3b5303c1307` |
| Git blob, on that branch and on `main` | `36364ca514f2c126f97017abcd371bdeb752b2fd` |
| SHA-256, bytes | `813183b382a26d0b6affeeaee04d44b0ea0057bea140a83221b460d8720da1b3`, 27,601 |

Its result file states `LOCAL_PRINCIPAL_REVIEW_REQUIRED_BEFORE_EXTERNAL_SHARING`. On 2026-11-16 the Principal stated that the archive is intentional test data and is not to be sanitized or removed. It was copied as it is. It holds raw rows of that test data, among them revision totals.

## 4. To reproduce

The counts:

```
python3 evidence/integration/w04-evidence-reconciliation-2026-11-16/extract_w04_inventory_counts.py evidence/d02-inventory-2026-11-16/windows-host/d02-d5-d16-inventory-20261116T143819255Z-96672044.zip
```

Expected: exit code 0 and a document equal to `portfolio-inventory-counts-2026-11-16.json`. A file with another SHA-256 is refused with exit code 3; an entry that differs from the archive's manifest, with exit code 4.

The comparison of the D02 document with the archive (record, section 3.3.1). The document is not on `main`, so it is read from its commit:

```
git fetch origin "+refs/heads/arena/c32aea42-iips-production-market-data:refs/remotes/origin/arena/c32aea42-iips-production-market-data"
git show 8132c5b6bba0051cbac95dab060096f2983e7396:docs/integration/IPD-D02-D5-D16-LIVE-EVIDENCE-RECONCILIATION-2026-11-16.md > /tmp/d02.md
python3 evidence/integration/w04-evidence-reconciliation-2026-11-16/compare_d02_document_with_archive.py evidence/d02-inventory-2026-11-16/windows-host/d02-d5-d16-inventory-20261116T143819255Z-96672044.zip /tmp/d02.md
```

Expected: exit code 0 and a document equal to `d02-document-archive-comparison-2026-11-16.json`. Another archive is refused with exit code 3; another version of the document, with exit code 4.

Both scripts need Python 3 and nothing else. Each reads its input files and writes to standard output only.

## 5. What the counts do not show

They show what is stored. They do not show why 63 holdings have no security identity, and they assign none. `RESOLVED` and `CANONICAL_P04` on all 64 rows are company-level fields.
