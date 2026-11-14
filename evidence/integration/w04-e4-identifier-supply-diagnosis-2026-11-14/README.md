# W04 E4 — read-only identifier-supply probe for the host (2026-11-14)

Supporting files for
[`docs/integration/IIPS-W04-E4-IDENTIFIER-SUPPLY-DIAGNOSIS-HOST-PROBE-PREPARED-2026-11-14.md`](../../../docs/integration/IIPS-W04-E4-IDENTIFIER-SUPPLY-DIAGNOSIS-HOST-PROBE-PREPARED-2026-11-14.md).

**E4 has not been executed.** This folder holds the probe that the Principal runs on the Windows
host, and the test of that probe. It holds no host data, no capture content and no E4 result.

| File | What it is |
|---|---|
| `w04-e4-identifier-supply-probe.mjs` | The host probe. One file, no dependency beyond Node. SHA-256 `60e39f98246ab9278235397f029d5f9517f73d92555f57507dbb729cd17d47ef`. |
| `probe-selftest.mjs` | A test of the probe on synthetic data. **A tool test, not evidence.** |

## The probe

It reads at most three things, all read-only:

1. the exact W11-DEP1 capture file on the host (SHA-256 `c5dd51f5…eda3`), chosen by that digest;
2. the IRR broker-import evidence journal, `journal.ndjson` in the IRR data directory;
3. optionally, the tracked `evidence/dhan-p7/qualification-manifest.json` of an IPD checkout.

It prints counts, SHA-256 digests, yes/no answers and values from closed vocabularies. It prints no
symbol, ISIN, company identifier, file name, tenant or owner identifier, quantity, price, value,
timestamp or path. A value outside its closed vocabulary is printed as `OTHER`.

It imports `node:crypto`, `node:fs` and `node:path` only. Every file is opened with the `'r'` flag.
It makes no network call, starts no process, and calls no write, rename, delete or directory-creation
function. It does not open the portfolio database and does not contact IPD or IRR.

The command for the host, the classification rules and the acceptance checks are in the record
linked above.

## Why Node and not PowerShell

The probe recomputes digests that the application computed in JavaScript over `JSON.stringify` of
numbers. Windows PowerShell formats a floating-point number differently from JavaScript, so a
PowerShell recomputation could report a false mismatch. Node is already required on the host by IPD
and IRR, and the capture utility used it. The command that runs the probe is a PowerShell command.

## Checks made on the probe

| Check | Result |
|---|---|
| `node --check` on both files | Pass |
| ASCII only, LF line endings, no tab | Pass, both files |
| Imports of the probe | `node:crypto`, `node:fs`, `node:path` |
| File-system calls of the probe | `openSync(file, 'r')`, `readFileSync(fd)`, `closeSync`, `existsSync`, `statSync`, `readdirSync` |
| Run under Node's permission model with read permission only (`node --experimental-permission --allow-fs-read=*`, Node v22.22.3) | Completes with the same result. Under the same flag a write is refused with `ERR_ACCESS_DENIED` (negative control). |
| Run on inputs made read-only (`chmod -R a-w`) | Completes with the same result |
| `probe-selftest.mjs` | 11 scenarios, all assertions pass |
| Cross-check with the unmodified IRR code at `08411bc` | Pass (below) |

**The self-test** builds its inputs with unmodified compiled IPD code: the import pipeline
(`BrokerImportIngressOrchestrator.executeIngress`) on a synthetic Dhan-layout CSV and a synthetic
security master, then `persistBrokerImport` into an in-memory database with a synthetic P7 registry,
then the store's own read. It writes the result as a capture document and writes a journal in the IRR
format into a temporary folder, runs the probe as a separate process, and compares the probe's
aggregate output with the truth known by construction. The scenarios: matched record; no journal; no
data directory; unrelated record only; record altered after retention; a capture other than the
expected one; truncated final journal line; a stored measure that differs; the registry cross-check;
no import evidence on the wire; selection of the capture by digest from the default folder. Each
scenario also asserts that the input files are byte-identical after the run and that the output
contains none of the synthetic identifiers, measures, file names or paths.

The identifiers in the self-test are invented (`INE000SYNT00` and the like, `QZSYMA`, `COMP-SYNTH-A`).
They follow the ISIN shape so that the pipeline accepts them. They belong to no security.

**The IRR cross-check** was run once in the sandbox and is not committed, because it needs an IRR
checkout. The unmodified IRR `previewBrokerHoldings`, `buildBrokerImportEvidence` and
`BrokerImportEvidenceStore.retain` (IRR `08411bc`) wrote a journal for the same synthetic CSV, twice,
with two read instants. The probe matched both records by content digest, recomputed both
`recordDigest` values and both `importId` values as equal, marked the one whose read instant equals
the committed import instant, and reproduced the whole-import provenance digest.

What was **not** checked: the probe has not been run on Windows, and it has not been run on the
actual capture or the actual journal. Neither exists in the sandbox.

Reproduce the self-test:

```
npm run build:tsc
node evidence/integration/w04-e4-identifier-supply-diagnosis-2026-11-14/probe-selftest.mjs
```

It is not part of `npm test`.
