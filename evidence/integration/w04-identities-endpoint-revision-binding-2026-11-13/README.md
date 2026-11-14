# W04 — IRR holding-identity endpoint: revision binding probes

Evidence for [`docs/integration/IIPS-W04-IRR-IDENTITIES-ENDPOINT-REVISION-BINDING-ASSESSMENT-2026-11-13.md`](../../../docs/integration/IIPS-W04-IRR-IDENTITIES-ENDPOINT-REVISION-BINDING-ASSESSMENT-2026-11-13.md).

Run on 2026-11-13 in a Linux sandbox. **Every input is synthetic.** The probes read no portfolio, capture, database or file from the Windows host, and they contact no running IRR or IPD service. They import application code unmodified and change no repository file.

## Files

| File | What it runs | Commits |
|---|---|---|
| `irr-identities-endpoint-probe.ts` | IRR's identities handler and user-portfolio handler, unmodified, with IRR's real IPC port adapter over a synthetic in-process transport, and IRR's tracked synthetic identity fixture | IRR `08411bc` (`main`) and `d10afbb` (head of open PR #563) |
| `irr-identities-endpoint-probe.output.txt` | Its output at both commits | |
| `irr-composed-server-probe.ts` | IRR's exported HTTP server on an ephemeral loopback port, with IRR's real IPC client connected to IRR's own tracked synthetic IPC peer (`capture/testing/syntheticIpcPeer.ts`) | IRR `08411bc` only |
| `irr-composed-server-probe.output.txt` | Its output | |
| `ipd-portfolio-get-revision-probe.mjs` | IPD's compiled portfolio store and IPC connection handler on an in-memory SQLite database and a temporary local socket | IPD branch head; `src/ipc`, `src/persistence` and `src/contracts` are identical to `main` `a624d06` and to `1fded9d` |
| `ipd-portfolio-get-revision-probe.output.txt` | Its output | |

## What the outputs show

- One identities `GET` sends exactly one IPC request, `portfolio.get`, with the payload key `portfolioId` only.
- The response has no key for a revision, a provenance digest, a timestamp or an aggregate count, and does not contain the provenance digest value served upstream.
- With the same holdings, the response at upstream revision 1 and at revision 7 is byte-identical. A `?revision=1` query has no effect.
- `GET /api/user-portfolios/<id>` and `GET /api/user-portfolios/<id>/revisions` return the revision and the provenance digest through the same adapter. The holdings order of the detail read equals the `identities[]` order.
- IPD has three read operations and none takes a revision. A protocol v1 `portfolio.get` payload that also names `revision: 1` is answered with the current revision.
- IPD revision rows and holding rows of an earlier revision are unchanged by later writes. A restore creates a new revision number that repeats an earlier provenance digest.
- At the head of PR #563 the response gains identity and directory fields, and still has no revision or provenance digest.

## Reproduce

IRR probes, from `<irr checkout>/frontend` with its dependencies installed:

```
./node_modules/.bin/tsx <this folder>/irr-identities-endpoint-probe.ts <irr checkout>
./node_modules/.bin/tsx <this folder>/irr-composed-server-probe.ts <irr checkout>
```

IPD probe, from the IPD repository root after `npm ci` and `npm run build:tsc`:

```
node --no-warnings evidence/integration/w04-identities-endpoint-revision-binding-2026-11-13/ipd-portfolio-get-revision-probe.mjs
```

Each probe exits 0 and prints the same output on repeated runs. The first line of each stored output, naming the commit, was added by the run wrapper.

## Limits

- The composed-server probe does not run at `d10afbb`: that branch predates the synthetic IPC peer, which reached IRR `main` with PR #564. PR #563 is covered by the handler probe only.
- The IPD probe covers protocol version 1, the only version the IRR client sends.
- The runs used a local socket on Linux, not a Windows named pipe.
- The probes show what the code does on synthetic input. They are not evidence about the host, about revision 1, or about the identity files loaded there.
- The symbols and identifiers in the scripts are synthetic placeholders from the scripts themselves and from IRR's tracked synthetic fixture.
