# Evidence — W04 identity provisioning decisions D1 to D4 (2026-11-13)

Record: [`docs/integration/IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md`](../../../docs/integration/IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md)

Everything here was produced in the Arena sandbox (Linux, Node 22). Nothing was run on the Windows
host. No IRR file was changed, nothing was pushed to IRR, and no pull request was merged. No file
here contains portfolio data. No file here is provisioning data or an approved supplement.

**None of this is an approval.** A measurement shows that two tracked files differ; it does not show
which is right. A loader gate shows that IRR can read the files; it does not give them authority.

## Files

| File | Decision | What it is |
|---|---|---|
| `measure-identity-sources.py` | D1, D2, D4 | Read-only measurement of the P04 master against the Wave-3 bundle, the published CSVs, the reassessment's derived files and, optionally, IRR's tracked rosters. Standard library only. Opens no socket, writes no file. |
| `identity-source-measurements.json` | D1, D2, D4 | Its output: counts, input digests, and the public reference facts of the two withheld securities. |
| `d2-supplement-refusals.txt` | D2 | Two runs of the provisioning tool with a test supplement for the two withheld securities. Both are refused. The supplement files were kept under `/tmp` and are not in the repository. |
| `irr-two-security-issuer-probe.ts`, `.json` | D2 | IRR's unmodified loader and resolver on one issuer with two equity securities, built in memory. |
| `irr-bse-series-probe.ts`, `.json` | D4 | IRR's unmodified loader and resolver on a BSE listing with series `A` and with series `EQ`, built in memory. |
| `irr-pr563-metadata.json` | D3 | The pull request as GitHub reported it on 2026-11-13: state, head, commits, review count, checks. |
| `irr-pr563-merge-checks.txt` | D3 | The local merge with IRR `main` and every check run on the merged tree and on the head. |
| `irr-loader-gate-merged-tree.json` | D3 | The IPD loader gate against the merged tree. The gates against IRR `main` and the PR head are in `../w04-identity-source-provisioning-2026-11-13/`. |

## Reproduction

From the IPD repository root, with an IRR checkout at `<irr>` and its `frontend/node_modules` installed:

```
python3 evidence/integration/w04-identity-provisioning-decisions-2026-11-13/measure-identity-sources.py <irr>

npm ci && npm run build:tsc
node scripts/provision-irr-identity-sources.mjs generate --staging <staging> --accept-withheld 2

cd <irr>/frontend
./node_modules/.bin/tsx <ipd>/evidence/integration/w04-identity-provisioning-decisions-2026-11-13/irr-bse-series-probe.ts <irr> <staging>
./node_modules/.bin/tsx <ipd>/evidence/integration/w04-identity-provisioning-decisions-2026-11-13/irr-two-security-issuer-probe.ts <irr> <staging>
```

The measurement output is byte-identical on repetition. Each probe printed the same bytes at IRR
`main` `08411bc`, at the PR #563 head `d10afbb` and on the local merge of the two (tree `7e554318`).

| Output | SHA-256 |
|---|---|
| `identity-source-measurements.json` | `1abd77e4671f9cba0be04665633a119194c01ac498e925ef1904af0660172787` |
| `irr-bse-series-probe.json` | `a64dde6dae1593c8c3d893f14075aaa813585e62985f0731374eaf401b80c3fb` |
| `irr-two-security-issuer-probe.json` | `62e2ed1506f2155966f7b123a0f7659eb701787a991554c6f608b50ce8edf618` |

## Web sources

Read on 2026-11-13. "Fetched" means the page was read. Nothing was saved to the repository.

| Source | Used for | How |
|---|---|---|
| `jains.in/Company/Terms_Conditions.htm` | The CIN the issuer publishes | Fetched |
| The issuer's letter to BSE and NSE of 26 July 2025 (`jains.com`, Corporate Announcements) | The same CIN on the letterhead; the two symbols and codes named as ordinary and DVR equity shares | Fetched |
| `primeinfobase.in` listed-instruments page | A different first NSE listing date for the ordinary share | Search excerpt only; the page could not be fetched |
| NSE `EQUITY_L.csv`, NSE index constituent lists, NSE corporate-actions page, NSE symbol-change file, BSE "List of Security", MCA company master data | Candidate sources of section 5 | Search excerpts only. Not opened, not downloaded, terms not read |

## Repository checks at this change

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run build:tsc` | exit 0 |
| `npm test` | exit 0: 1,590 tests in 123 files; 1,589 pass, 0 fail, 1 skipped (1,578 before this change, plus the 12 new tests) |
| New tests | `IDF-01` to `IDF-07` (7) and `IIX-53` to `IIX-56` (5): all pass |

## Not shown here

- Anything about the Windows host or the operator's holdings.
- That any CIN is registered: no registry file is tracked.
- That any candidate source exists as described.
