# W04 C4/C5 identifier supply — repository probes (2026-11-14)

Supporting evidence for
[`docs/integration/IIPS-W04-C4-C5-IDENTIFIER-SUPPLY-SOURCE-AND-OWNER-ASSESSMENT-2026-11-14.md`](../../../docs/integration/IIPS-W04-C4-C5-IDENTIFIER-SUPPLY-SOURCE-AND-OWNER-ASSESSMENT-2026-11-14.md).

These files are repository evidence only. They contain no host data and no capture content. The
outputs hold counts and file digests; no ISIN, symbol, company, quantity or value appears in them.

| File | What it is |
|---|---|
| `p7-series-evidence-probe.mjs` | Runs the unmodified compiled P7 qualification, in memory, over the tracked Dhan instrument-master snapshot against the legacy and the present P04 master, and compares the vendor series with the NSE and BSE files in the tracked Wave-3 bundle. Reads tracked IPD files only. Needs `unzip`. |
| `p7-series-evidence-probe.output.json` | Its output on this branch, whose identity sources are identical to IPD `main` `a624d06`. Identical on two consecutive runs. |
| `tracked-broker-file-identifier-probe.mjs` | For the three broker files tracked in IRR under `evidence/broker-import/operator-supplied/`: which identifier columns each has, and what the unmodified compiled IPD company gate and security qualification return for its rows. |
| `tracked-broker-file-identifier-probe.output.json` | Its output against IRR `main` `08411bc`. Identical on two consecutive runs. |

What the probes are not:

- **Not a regeneration.** Neither writes a file. `evidence/dhan-p7/qualification-manifest.json`, the
  registry the application loads, is unchanged. Re-qualifying it is a separate decision
  (assessment, section 9, step 2).
- **Not evidence about revision 1.** The broker files are tracked repository files. No link between
  any of them and the captured portfolio revision is established, and none is inferred.
- **Not an identity assignment.** No identifier is attached to any holding.
- Not part of the test suite, and not collectors for host use.

The second probe reads files that hold an account's holdings. They are already tracked in IRR. The
probe prints counts only and copies nothing from them.

Reproduce:

```sh
# IPD, from the repository root
npm ci && npm run build:tsc
node evidence/integration/w04-c4-c5-identifier-supply-2026-11-14/p7-series-evidence-probe.mjs
node evidence/integration/w04-c4-c5-identifier-supply-2026-11-14/tracked-broker-file-identifier-probe.mjs <IRR checkout root>
```

Checks run for the assessment, in a Linux sandbox on 2026-11-14:

| Check | Result |
|---|---|
| `npm run build:tsc` | exit 0 |
| `npm test` on this branch with the new files present | 1,638 tests executed, 1,637 passed, 0 failed, 1 skipped; exit 0. The same counts as before the new files. |
| Each probe run twice | outputs identical |
| IRR working tree after the second probe | unchanged |
| Relative links of the assessment and of this file | all resolve |
| Search of the new files for an ISIN pattern | none |
