# W04 evidence reconciliation — evidence folder (2026-11-16)

Record: [`IIPS-W04-EVIDENCE-RECONCILIATION-AND-ACCEPTANCE-ASSESSMENT-2026-11-16.md`](../../../docs/integration/IIPS-W04-EVIDENCE-RECONCILIATION-AND-ACCEPTANCE-ASSESSMENT-2026-11-16.md).

Nothing in this folder was produced on the Windows host by this record. Nothing here holds a holding identifier, a quantity, a price or a value.

## 1. Files

| File | What it is |
|---|---|
| `extract_w04_inventory_counts.py` | Read-only script. It checks the SHA-256 of the inventory archive and the archive's own manifest, then prints the counts of one portfolio. |
| `portfolio-inventory-counts-2026-11-16.json` | Output of that script for `DHAN_PORTFOLIO`: revision 1, 64 holdings, 64 active, security identity populated on 1 and `NULL` on 63. |
| `irr-merge-readback-2026-11-16.json` | What the GitHub API returned for the IRR merge `064195397dfdb32bf0f34a461b02fd6b9f9a8df0`: the commit, the head of IRR `main`, its pull request, its check runs, the state of IRR PRs #563, #566 and #568, and four ancestry comparisons. Read only. |
| `source-digests.txt` | SHA-256 of the files this record relies on that are not on `main`, each with its commit and Git blob. |

## 2. Grade of this evidence

- The inventory archive is **host output**: the Principal produced it on the Windows host on 2026-11-16 and published it. This record checked the file and read counts from it. It did not access the host.
- The IRR readback is **verified here** from the GitHub API.
- Neither makes operator-reported evidence of other dates independently verified.

## 3. The inventory archive is not in this folder

| Item | Value |
|---|---|
| Path | `evidence/d02-inventory-2026-11-16/windows-host/d02-d5-d16-inventory-20261116T143819255Z-96672044.zip` |
| Branch | `arena/c32aea42-iips-production-market-data`, head `8132c5b6bba0051cbac95dab060096f2983e7396` when read |
| Added by | commit `cd6c0bb8e711e18e4b7f4fba5fdba3b5303c1307` |
| Git blob | `36364ca514f2c126f97017abcd371bdeb752b2fd` |
| SHA-256, bytes | `813183b382a26d0b6affeeaee04d44b0ea0057bea140a83221b460d8720da1b3`, 27,601 |

Its result file states `LOCAL_PRINCIPAL_REVIEW_REQUIRED_BEFORE_EXTERNAL_SHARING`, and it holds raw rows, among them a portfolio value. This repository is public. The archive is therefore left where the Principal published it, and only counts are copied. Whether to carry it to `main` is for the Principal (record, section 10).

## 4. To reproduce the counts

```
git fetch origin "+refs/heads/arena/c32aea42-iips-production-market-data:refs/remotes/origin/arena/c32aea42-iips-production-market-data"
git show origin/arena/c32aea42-iips-production-market-data:evidence/d02-inventory-2026-11-16/windows-host/d02-d5-d16-inventory-20261116T143819255Z-96672044.zip > /tmp/inventory.zip
python3 evidence/integration/w04-evidence-reconciliation-2026-11-16/extract_w04_inventory_counts.py /tmp/inventory.zip
```

Expected: exit code 0 and a document equal to `portfolio-inventory-counts-2026-11-16.json`. A file with another SHA-256 is refused with exit code 3; an entry that differs from the archive's manifest, with exit code 4.

The script needs Python 3 and nothing else. It reads one file and writes to standard output only.

## 5. What the counts do not show

They show what is stored. They do not show why 63 holdings have no security identity, and they assign none. `RESOLVED` and `CANONICAL_P04` on all 64 rows are company-level fields.
