# W04 — IRR identity-source provisioning: evidence

Record: [`docs/integration/IIPS-W04-IRR-IDENTITY-SOURCE-PROVISIONING-2026-11-13.md`](../../../docs/integration/IIPS-W04-IRR-IDENTITY-SOURCE-PROVISIONING-2026-11-13.md).

Everything here was produced in the sandbox on 2026-11-13, on Linux, with Node v22. Nothing was run on the Windows host. IRR code was run unmodified.

**Later record (2026-11-13).** The transcripts `tool-run-*.txt` show `install` succeeding without an approval record. They were recorded with the tool at `b0d7908`, into sandbox directories, before the governance approval check existed. They are kept as recorded. The `install` line of "Reproduce" below no longer runs as written: the tool now refuses without `--approval`, and no approval record exists. See [`../w04-identity-approval-enforcement-2026-11-13/`](../w04-identity-approval-enforcement-2026-11-13/README.md).

| File | What it is |
|---|---|
| `provisioning-report.json` | The export report written by `generate --accept-withheld 2` on the tracked P04 master. Identical in both runs below. |
| `tool-run-08411bc.txt` | The tool against IRR `main` `08411bc`: unacknowledged run (exit 3), install refused before generation and before the gate (exit 5), generate, validate, install, repeated install, and IRR's readiness CLI on the installed directory. |
| `tool-run-d10afbb.txt` | The same sequence against IRR PR #563 `d10afbb`. |
| `tool-run-replace-08411bc.txt` | Installation over an existing, different identity set: refused, then replaced with `--replace`, with digests before and after and the backup. |
| `irr-loader-gate-08411bc.json`, `irr-loader-gate-d10afbb.json` | The gate records: the answer of IRR's loader and resolver, counts and digests only. |
| `irr-provisioned-endpoint-probe.ts` | Probe: IRR's composed server and route handler answering from the installed files. |
| `endpoint-probe-08411bc.txt`, `endpoint-probe-d10afbb.txt` | Its output at the two IRR commits. |

The identity files themselves (2.6 MB) are not stored. They are reproducible, and their digests are in `provisioning-report.json` and pinned by test `IIX-04`.

## Reproduce

```
# IPD checkout, built
npm ci && npm run build:tsc

# IRR checkout with frontend packages installed
node scripts/provision-irr-identity-sources.mjs generate --staging <staging> --accept-withheld 2
node scripts/provision-irr-identity-sources.mjs validate --staging <staging> --irr-root <IRR checkout> --as-of 2026-11-13
mkdir <data root>
node scripts/provision-irr-identity-sources.mjs install --staging <staging> --data-dir <data root>

# endpoint probe, from <IRR checkout>/frontend
./node_modules/.bin/tsx <this directory>/irr-provisioned-endpoint-probe.ts <IRR checkout> <staging> <IPD checkout>
```

`--as-of` fixes the date IRR's resolver uses, so that the gate record is repeatable. Without it the gate uses the current date.

## Notes on the transcripts

- Paths are replaced by `<staging>`, `<data root>`, `<IRR checkout>` and `<path>`.
- `tool-run-d10afbb.txt` shows `worktree clean: false`. That is the sandbox: the `d10afbb` worktree borrows its `frontend/node_modules` through a symbolic link, which git reports as one untracked entry. No tracked file differs.
- At `d10afbb` the composed-server part of the probe cannot return 200. That commit predates IRR's synthetic IPC peer, so the server has no holdings to read and answers `holdings-unavailable`. The route handler is exercised directly in part 2.
- The portfolio in the probe is not real. Part 1 uses IRR's tracked synthetic peer. Part 2 uses probe holdings that carry the identifiers of the first exported master record. No ISIN, symbol or name is printed.
