# W04 E4 — read-only lineage reproduction from the original CSV, for the host (2026-11-14)

Supporting files for
[`docs/integration/IIPS-W04-E4-ORIGINAL-CSV-LINEAGE-REPRODUCTION-UTILITY-PREPARED-2026-11-14.md`](../../../docs/integration/IIPS-W04-E4-ORIGINAL-CSV-LINEAGE-REPRODUCTION-UTILITY-PREPARED-2026-11-14.md).

**The utility has not been run on the original CSV or on the actual capture.** Both exist only on the
Principal's Windows machine. This folder holds the utility the Principal runs there, and the test of
that utility. It holds no host data, no CSV content, no capture content and no E4 result.

| File | What it is |
|---|---|
| `w04-e4-csv-lineage-reproduction.mjs` | The host utility. One file, no dependency beyond Node. 66,737 bytes. SHA-256 `901a365c4dad816532fd244e9b17a7c7bb5cffbebff2a57bd4ad0f9f40c20a9c`. |
| `csv-lineage-selftest.mjs` | A test of the utility on synthetic data. **A tool test, not evidence.** |
| `sample-output-synthetic.txt` | One complete output of the utility on an invented 64-holding statement. **Format illustration only.** |

## The utility

It reads two things, both read-only:

1. the CSV named by `--csv`;
2. the exact W11-DEP1 capture file found under `--capture-dir`, chosen by its SHA-256.

It then does five things, in order, and stops at the first one that cannot be done:

1. Verifies the CSV against the import-content digest (`a3c3ee76…3107`).
2. Verifies the capture against its digest (`c5dd51f5…eda3`) and reads the target holdings from it.
3. Finds the one committed import in the capture whose content digest is the digest of the CSV.
4. Parses the CSV with the import pipeline's own rules and derives the holdings the pipeline derived.
5. Recomputes the lineage digest of every pair of a stored holding and a CSV-derived holding, and
   compares it with the stored digest.

A match is exact equality of the SHA-256 lineage digest. Nothing is paired by symbol, name or
similarity. The utility reports reproduced, ambiguous and unmatched holdings separately. It does not
classify identity: it assigns no security identity and no cause, and its result is not an acceptance.

It prints counts, SHA-256 digests of the two whole files, yes/no answers, values from closed
vocabularies and ordinal numbers (`H07` is the seventh holding in the capture, `G12` the twelfth
holding derived from the CSV, and a CSV line number is a physical line of the file). It prints no
symbol, ISIN, company identifier, file name, path, quantity, price, value, weight, timestamp or
per-holding digest. A value outside its closed vocabulary is printed as `OTHER`. An unexpected error
is printed as a code, never as its message.

It imports `node:crypto`, `node:fs` and `node:path` only. Every file is opened with the `'r'` flag.
It makes no network call, starts no process, and calls no write, rename, delete or directory-creation
function. It does not open the portfolio database, does not read or create `journal.ndjson`, reads no
repository checkout, and does not contact IPD, IRR, Dhan or any provider.

The algorithm, the capture structure, the command for the host and the rules for reading the result
are in the record linked above.

## Why Node and not PowerShell

The digests were computed in JavaScript over `JSON.stringify` of floating-point numbers that are
themselves results of JavaScript arithmetic (weighted averages, products, rounded weights). Windows
PowerShell parses and formats such numbers differently, so a PowerShell recomputation could report a
false mismatch. Node is already required on the host by IPD and IRR. The command that runs the
utility is a PowerShell 5.1 command.

## How the algorithm is carried

The utility cannot import the pipeline: it must be one file that runs outside any checkout. The
functions between its `PORT BEGIN` and `PORT END` markers are the production functions with type
annotations removed and the binary-input branches left out.

| Part | Production source (IPD) | How equality with production was checked |
|---|---|---|
| CSV line, row, object and cell parsing (5 functions) | `frontend/src/features/portfolio/import/adapters/csv-parser-helper.ts` | Token-identical to the compiled production functions (comments, whitespace and quote style aside; the rupee sign written as `\u20B9`) |
| Format detection | `broker-format-detector.ts` `detectFormat` | Self-test: Dhan detailed, Dhan web summary, another broker's layout |
| Dhan row mapping | `adapters/dhan-holdings-adapter.ts` `parse` | Self-test, all scenarios |
| Exclusion, grouping, aggregation, weights | `broker-holdings-mapper.ts` `mapBrokerOutputToUserHoldings` steps 1 to 3 | Self-test, all scenarios, and 40 seeded random statements |
| Lineage digest | same function and `src/contracts/provenance.ts` `computeLineageHash` | Every digest in every scenario was produced by the compiled pipeline |
| Whole-import digest | `src/persistence/brokerImportPersistence.ts` `computeBrokerImportProvenance` | Every passing scenario compares it with the value the real store kept |

The identity lookup of the mapper is not carried, because it needs the security master. Its three
outputs per holding (`companyId`, `identityStatus`, `resolutionDisposition`) are read from the
capture, as is the import instant.

## Checks made on the utility

| Check | Result |
|---|---|
| `node --check` on both `.mjs` files | Pass |
| ASCII only, LF line endings, no tab | Pass, both `.mjs` files |
| Imports of the utility | `node:crypto`, `node:fs`, `node:path` |
| File-system calls of the utility | `openSync(file, 'r')`, `readFileSync(fd)`, `closeSync`, `existsSync`, `statSync`, `readdirSync` |
| Run under Node's permission model with read permission only (`node --permission --allow-fs-read=*`, Node v22.22.3) | Completes with identical output. Under the same flags a write is refused with `ERR_ACCESS_DENIED` (negative control). |
| Input tree unchanged after every run (names, sizes, modification times, SHA-256 of every file) | Pass, 101 runs |
| Output free of every synthetic symbol, ISIN, company identifier, file name, path, instant, per-holding digest and measure | Pass, 101 runs |
| `csv-lineage-selftest.mjs` | 46 scenarios, all pass |

**The self-test** builds its inputs with unmodified compiled IPD code: the import pipeline
(`BrokerImportIngressOrchestrator.executeIngress`, with the options IRR's preview passes) on a
synthetic Dhan-layout CSV and a synthetic security master, then `persistBrokerImport` into an
in-memory database, then the store's own read, shaped as the `portfolio.get` wire result. It writes
that as an exact-capture document into a temporary folder shaped like the host capture root, runs the
utility as a separate process, and compares the result with the truth known by construction.

| Group | Scenarios | What is shown |
|---|---|---|
| Exact matches | 7 | All digests reproduced one-to-one and the whole-import digest equal: mixed identifiers and formatted numbers; CRLF with a byte-order mark; a byte-order mark inside the imported text; the Dhan web-summary layout; a renamed CSV and each accepted form of `--capture-dir`; a 64-holding statement of the recorded shape; 40 seeded random statements (449 holdings) |
| Missing identifiers | 2 | No ISIN column; empty and quoted-empty ISIN cells. Reproduced, reported as `NO_ISIN` |
| Missing exchange | 3 | Empty exchange cells; no Exchange column. Reproduced, reported as `NO_EXCHANGE`. Third scenario: the production identity gate refuses such a holding |
| Null and empty fields | 5 | Empty prices, quantity and symbol, blank lines, an all-empty row; a stored holding with a null digest or an empty company identifier; a null import instant or file name; an empty CSV, a header-only CSV, a capture without holdings |
| Duplicate rows | 2 | Rows of one security aggregated as the mapper does; one security with and without an ISIN |
| Ambiguous matches | 2 | Two stored holdings with one digest are both `AMBIGUOUS` and not counted as reproduced; a row equal in symbol and every measure but with another digest is `NOT_REPRODUCED` |
| Changed field values | 11 | Exchange, ISIN, quantity or average price changed in the CSV; a row added, removed or reordered; a stored measure, company identifier, identity status, import instant, file name or revision digest changed in the capture |
| Incorrect input digest | 6 | One byte changed; another statement; no override; a changed CSV with its own digest; a missing file; another broker's layout. Nothing is compared |
| Incorrect capture digest | 5 | Same content in other bytes; no override; empty or absent folder; a file that is not an exact capture; two reads that disagree |
| Read-only | 3 | Permission-model run; static check of the source; argument handling |

Three limits of the self-test, stated so that nothing is over-read:

- The identity gate of `persistBrokerImport` is a stand-in with the rules of the governed resolver,
  because the governed resolver accepts only the governed D05 master. The scenarios that store a
  holding without an exchange relax that gate; production does not.
- IRR refuses to commit a statement with a rejected row. The scenarios with excluded rows commit
  anyway, to show the utility follows the mapper there too.
- Ambiguity cannot come out of the pipeline itself: two different CSV-derived holdings cannot have
  the same digest, short of a SHA-256 collision. The ambiguous scenario is built by repeating a
  stored holding in the capture.

The identifiers in the self-test are invented (`INE0SYNT0000` and the like, `QZSYMA`,
`COMP-SYNTH-A`). They follow the ISIN shape so that the pipeline accepts them. They belong to no
security.

What was **not** checked: the utility has not been run on Windows, and it has not been run on the
original CSV or the actual capture. Neither exists in the sandbox.

Reproduce the self-test:

```
npm run build:tsc
node evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/csv-lineage-selftest.mjs
```

Add `--print-sample` to print the output that `sample-output-synthetic.txt` was taken from; its
digests differ from run to run, because the synthetic capture records the time of its own commit.
The self-test is not part of `npm test`.
