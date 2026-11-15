# W04 identity coverage — repository probes (2026-11-13)

Supporting evidence for
[`docs/integration/IIPS-W04-IDENTITY-COVERAGE-REVISION-1-EVIDENCE-ASSESSMENT-2026-11-13.md`](../../../docs/integration/IIPS-W04-IDENTITY-COVERAGE-REVISION-1-EVIDENCE-ASSESSMENT-2026-11-13.md).

These files are repository evidence only. They contain no host data, no portfolio data and no capture
content. They print counts and source digests; no ISIN, symbol or company appears in any output.

| File | What it is |
|---|---|
| `ipd-identity-source-probe.mjs` | Runs the unmodified compiled IPD functions over the tracked P04 security master and the tracked P7 qualification manifest. Reads tracked files only. |
| `ipd-identity-source-probe.output.json` | Its output on this branch, whose identity sources are identical to IPD `main` `a624d06`. Identical on two consecutive runs. |
| `irr-resolver-probe.ts` | Runs the unmodified IRR function `resolveHoldingIdentities` on two made-up holdings against IRR's tracked **synthetic** identity fixture. |
| `irr-resolver-probe.output.txt` | Its output at IRR `main` `08411bc` and at the head of open IRR PR #563, `d10afbb`. |

Reproduce:

```sh
# IPD, from the repository root
npm ci && npm run build:tsc
node evidence/integration/w04-identity-coverage-2026-11-13/ipd-identity-source-probe.mjs

# IRR, from <IRR checkout>/frontend with dependencies installed
./node_modules/.bin/tsx <path-to>/irr-resolver-probe.ts <IRR checkout root>
```

Neither probe is part of the test suite, and neither is a collector for host use.
