# Snapshot-to-Live W04 — E4: read-only lineage reproduction from the original CSV. Utility prepared here; run on the host by the Principal: 64 of 64 reproduced

**Date:** 2026-11-14
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md))
**Follows:** the [E4 record](IIPS-W04-E4-IDENTIFIER-SUPPLY-DIAGNOSIS-HOST-PROBE-PREPARED-2026-11-14.md) (1 of 64 lineage digests reproduced from the capture alone) and the [journal-not-found investigation](IIPS-W04-E4-EVIDENCE-JOURNAL-NOT-FOUND-INVESTIGATION-2026-11-14.md) (section 6, step 4: look for the original statement file by digest)
**Repositories read:** IPD `ramkivs/iips-production-market-data` at `81b5178` (head of PR #157); IRR `ramkivs/iips-review-recovered` at `main` `08411bc`, read-only. For sections 12 to 15: IPD at `68ab3dc` (head of PR #157), IRR at `08411bc`
**Type:** documentation and one read-only diagnostic utility. No runtime code, integration contract, registry, manifest, journal or portfolio data was changed in either repository.

**Host result (later record, 2026-11-14).** The Principal ran the published utility on the Windows host and reports **`RESULT: REPRODUCED_ALL`, exit code 0: 64 of 64 stored lineage digests reproduced from the original CSV, 0 ambiguous, 0 not reproduced**, with the utility, CSV and capture digests equal to the recorded ones. The 63 holdings without a stored security identity all had an ISIN and an exchange in the committed input: **class C, 63 of 63** (NSE 62, BSE 1). This replaces "UNDETERMINED". The cause of the missing identities is not proven. `identityStatus` `RESOLVED` beside a `null` security identity is a valid state by design. Sections 12 to 15.

**The utility was run by the Principal on Windows, not in this environment.** The CSV and the capture exist only on the Principal's machine, and this environment cannot reach it. Neither file was requested, uploaded or read. The figures recorded here are those the Principal reported. **The complete sanitized output has not reached this environment and is not yet committed** (section 12.1).

**W04 status is unchanged: PARTIALLY COMPLETE. Not accepted.**

Sections 1 to 11 are kept as written when the utility was prepared, before any result existed. Where a later fact supersedes a statement, the table below and sections 12 to 15 say so.

| Requested | State |
|---|---|
| Document the canonical lineage digest, its inputs and its rules | Done (section 2) |
| Document the capture file and the structure that holds the 64 holdings | Done (section 3) |
| State whether the CSV suffices | Done (section 4): the CSV and the capture together suffice; the CSV alone does not |
| Standalone read-only utility for Windows | Done (section 5). Published with this record |
| Synthetic tests of the nine listed cases | Done (section 6): 46 scenarios, all pass. A tool test, not evidence |
| Exact command for the Principal | Done (section 7). **Not executed here**: this environment has no PowerShell and no Windows host |
| Run on the original CSV and the actual capture | When prepared: not done. **Later record: done by the Principal on the host; `REPRODUCED_ALL`, 64 of 64 (section 12)** |
| Classification of the 63 | When prepared: not done. **Later record: read by the rules of section 9; class C, 63 of 63 (section 13).** Not done by the utility, and not a cause |
| `identityStatus` against `securityIdentity` (asked after the result) | Investigated in source and reproduced in the sandbox: a valid state by design (section 14) |
| Complete sanitized host output, with the result JSON, in the repository | **Not done.** It did not reach this environment (section 12.1) |

## 1. Inputs, as reported

Reported by the Principal and not verified here:

- The original statement file was found on the host at `C:\Users\USER\Desktop\dhan_holdings_withisinv1.1 - Copy.csv`. Its import-content SHA-256 is `a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107`, the content digest of the one committed import in the capture.
- The capture is under `%LOCALAPPDATA%\IIPS\w11-dep1-capture\`. Its SHA-256 is `c5dd51f51025e3e17e3b798164c6b8078fa5487392d8f0dfd96be9bb7c79eda3`, exact-capture schema v1.
- Target: `DHAN_PORTFOLIO`, revision 1, 64 holdings, 63 without a stored security identity. The earlier probe reproduced 1 of 64 lineage digests from the capture alone.

The file is the import's input. It is not the retained IRR evidence record, and it does not restore the journal. No journal entry is reconstructed from it, here or by the utility.

No file with that digest is in either repository: the earlier search compared every blob of up to 4 MiB on every ref of both (`evidence/integration/w04-e4-journal-not-found-2026-11-14/search-import-content-digest.output.txt`: 0 equal). The three operator-supplied CSVs in IRR `evidence/broker-import/operator-supplied/` have other digests and are not the statement.

## 2. The canonical lineage digest

### 2.1 Where it is computed, and what was running

The stored per-holding `lineageDigest` is computed once, in the browser, by the IPD import pipeline that IRR bundles. IPD stores it unchanged.

| Step | Source | What happens |
|---|---|---|
| Read the file | IRR `frontend/src/features/broker-holdings/BrokerHoldingsPreview.tsx:167` | `content = await file.text()` |
| Start the pipeline | same file `:171`; IRR `frontend/src/api/brokerHoldingsPreview.ts:172–194` | `previewBrokerHoldings(content, file.name, new Date().toISOString(), …)` calls `BrokerImportIngressOrchestrator.executeIngress` with the governed master, `failOnUnmappedIdentity: true`, `allowNonProductionBypass: false`, `allowPartialRejection: false`. Text over 1 MiB is refused (`:182`) |
| Content digest | IPD `frontend/src/features/portfolio/import/broker-import-ingress.ts:50`; `src/contracts/provenance.ts:31` | `computeSha256(content)`: SHA-256 of the UTF-8 encoding of the text |
| Detect, parse | IPD `broker-format-detector.ts:29`; `adapters/dhan-holdings-adapter.ts:38`; `adapters/csv-parser-helper.ts` | Section 2.3 |
| Holdings and digests | IPD `broker-holdings-mapper.ts:61` (`mapBrokerOutputToUserHoldings`); digest at `:408–428` | Section 2.2 |
| Build the commit request | IRR `frontend/src/api/brokerImportStage4.ts:16–38` | Refused unless the result is ready, the identity summary is saveable and there is no rejection. Sends each holding's `lineageDigest` and `importedAt = provenance.asOf` |
| Forward | IRR `frontend/server/broker-import/brokerImportHttp.ts` | Shape validation, then one `portfolio.importBroker` call. The digest passes through |
| Store | IPD `src/ipc/dispatch.ts` (`portfolio.importBroker`); `src/persistence/brokerImportPersistence.ts:227` (`persistBrokerImport`), `:128–166` (`mapBrokerImportHoldings`, `lineageDigest: h.lineageDigest`) | Stored verbatim |

IRR pins IPD at `1aee57f`. Every pipeline path named above is byte-identical at `1aee57f`, `1fded9d`, `a624d06` (`main`) and `81b5178` (`git diff --stat`, no difference), so the code read here is the code that ran.

Two other lineage digests exist in IPD and do **not** apply to this revision:

- `rowLineageDigestOf` (`brokerImportPersistence.ts:659`) is computed by IPD on the snapshot-v2 save. That save requires `expectedRevision >= 1` (`:681`), so it cannot create revision 1, and the dispatcher emits no v2 write.
- The manual-portfolio digest belongs to manual entry.

The utility computes neither.

### 2.2 The digest and its input fields

```
lineageDigest = SHA-256( JSON.stringify(payload) + 'UNCLASSIFIED' + asOf + 'v1.0.0-bi03' )
```

lowercase hexadecimal, over the UTF-8 encoding of the concatenated string, with no separator (`computeLineageHash`, `src/contracts/provenance.ts:117`; no `parentHash` is passed). `payload` has these members, in this order:

| # | Member | Comes from | In the CSV? | Rule |
|---|---|---|---|---|
| 1 | `symbol` | Symbol column of the first row of the group | Yes | Trimmed, uppercased |
| 2 | `companyId` | Identity lookup in the governed master at import time | **No** | Read from the capture |
| 3 | `isin` | ISIN column | Yes | Trimmed, uppercased. **Omitted** when empty or when there is no ISIN column |
| 4 | `exchange` | Exchange column of the first row of the group | Yes | `BSE` if the uppercased cell contains `BSE`, otherwise `NSE`. **Omitted** when empty or when there is no Exchange column |
| 5 | `quantity` | Sum of the group's quantities | Yes | |
| 6 | `averageBuyPrice` | Σ(quantity × average price) ÷ Σ quantity | Yes | An average price that is not above 0 counts as 0 |
| 7 | `currentPrice` | The last row of the group whose price is above 0 | Yes | Otherwise `averageBuyPrice` |
| 8 | `marketValue` | `quantity × currentPrice` | Yes | |
| 9 | `weightPercentage` | Share of the whole statement | Yes, **all rows** | Section 2.3 |
| 10 | `active` | Constant | — | `true` |
| 11 | `sourceBroker` | The adapter | — | `DHAN` |
| 12 | `identityStatus` | Identity lookup | **No** | Read from the capture. `RESOLVED` for a committed holding |
| 13 | `resolutionDisposition` | Identity lookup | **No** | Read from the capture. `CANONICAL_P04` for a committed holding |
| — | `asOf` | The browser clock when the file was chosen | **No** | Read from the capture: `importEvidence[].importedAt` |

`series` is not a member. The IRR commit sends none.

### 2.3 Normalization, null handling, ordering, serialization

**Text.** The pipeline receives a string. It removes no byte-order mark itself; whether `file.text()` removed one is browser behaviour, not repository source. The utility therefore computes both readings and uses the one whose digest is the expected one.

**Lines and cells** (`csv-parser-helper.ts`). CRLF and CR become LF. Each line is trimmed; blank lines are dropped. A cell ends at a comma outside double quotes; `""` inside quotes is one quote; each cell is trimmed. The first remaining line is the header. One leading and one trailing quote character are removed from headers and values, which are then trimmed. A row whose cells are all empty is dropped. A cell cannot span lines.

**Columns** (`dhan-holdings-adapter.ts:118–130`). Header names are matched in lowercase; the first name present wins:

| Member | Header names, in order |
|---|---|
| symbol | `trading symbol`, `symbol`, `stock name`, `name` |
| ISIN | `isin` |
| exchange | `exchange` |
| quantity | `total qty`, `quantity`, `available qty`, `dp qty`, `total quantity`, `qty`, `qty.` |
| average price | `average buy price`, `average price`, `avg buy price`, `avg price`, `buy avg`, `avg. cost`, `buy price` |
| last price | `last traded price`, `last traded`, `ltp`, `current price` |

**Null and empty handling.**

- An empty symbol: the row is skipped by the adapter.
- An empty ISIN or exchange cell, or a missing column: the member is `undefined` and `JSON.stringify` leaves it out. It is not serialized as `null` or as an empty string.
- A number: the rupee sign, `$`, `,`, `%` and whitespace are removed, then `Number()`. An empty or unparseable cell is 0.
- No last-price column: the average price is used. An empty last-price cell is 0, and the mapper then falls back to the average price.
- A row is excluded by the mapper when symbol and ISIN are both missing, when the quantity is not above 0, when no price is above 0, or when quantity × price is not above 0. IRR does not commit a statement with an excluded row.

**Grouping and ordering** (`broker-holdings-mapper.ts:93–176`). Rows are grouped under `ISIN:<isin>` when the row has an ISIN, otherwise under `SYM:<symbol>`. Groups keep the order in which they first appear. The symbol and the exchange of a group are those of its first row. Row order does not enter a per-holding digest except through "first row" and "last price".

**Weights** (`:340–398`). `round(marketValue ÷ total × 100 × 10⁴) ÷ 10⁴` for each holding. If the rounded weights do not sum to 100, the difference is added to the first holding with the strictly largest market value. Every weight depends on every row of the statement, so one changed row can change the digest of other holdings.

**Serialization.** `JSON.stringify` of the object literal: members in the order of section 2.2, no whitespace, numbers in JavaScript's shortest round-trip form. This is why the recomputation runs in Node (section 5.4).

## 3. The capture file and its structure

**File.** `<capture root>\w11-dep1-capture-<UTC stamp>-<first 8 characters of the capture id>\LOCAL-ONLY-DO-NOT-PUBLISH\exact-owner-bound-portfolio-capture.json`. The default root is `%LOCALAPPDATA%\IIPS\w11-dep1-capture` (IRR `frontend/server/user-portfolio/capture/capture-owner-bound-portfolio.ts:63–65`, `:333`). The recorded SHA-256 is over the exact bytes of this file (`:372`; `ownerBoundPortfolioCapture.ts` `sha256Hex`).

**Structure** (IRR `ownerBoundPortfolioCapture.ts:1281`, `buildExactCaptureDocument`):

```
schema: "iips.w11-dep1.owner-bound-portfolio-capture.exact/v1"
outcome: "CONSISTENT_CAPTURE"
selection: { method, listedPortfolioCount, portfolioId }
reads: [
  { sequence: 1, operation: "portfolio.list",      wireResult: [...] },
  { sequence: 2, operation: "portfolio.get",       wireResult: <detail> },
  { sequence: 3, operation: "portfolio.revisions", wireResult: [ { revision, operation, contentDigest, provenanceDigest, ... } ] },
  { sequence: 4, operation: "portfolio.get",       wireResult: <detail> }
]
```

`<detail>` is the IPD wire result verbatim (IPD `src/ipc/dispatch.ts:174`, `personalGet`):

```
portfolioId, revision, holdingsCount, provenanceDigest,
holdings: [ 64 x {
  symbol, companyId, quantity, averageBuyPrice, currentPrice, marketValue, weightPercentage,
  active, sourceBroker, lineageDigest, identityStatus, resolutionDisposition, securityIdentity
} ],
contributions: [],
importEvidence: [ { contentDigest, lineageDigest, fileName, sourceBroker, importedAt, contributedAt, semantics } ]
```

- **The 64 holdings and their lineage digests are `reads[1].wireResult.holdings[]`, member `lineageDigest`.** `reads[3]` holds the same result a second time; the utility requires the two to be identical. The holdings are not in statement order.
- `isin` and `exchange` are **not** stored on a holding. That is why the capture alone could reproduce only a holding whose input carried no ISIN.
- `securityIdentity` is `null` on 63 holdings and an object on 1. It is a different member from `identityStatus`.
- `importEvidence[].contentDigest` is the digest of the statement text. `importEvidence[].lineageDigest` and `provenanceDigest` are the whole-import digest (section 4). The `contentDigest` inside `portfolio.revisions` is the revision's own digest, not the file's.

## 4. Is the CSV sufficient

**The CSV alone: no.** Four members of every digest are not in the file: `companyId`, `identityStatus`, `resolutionDisposition` and `asOf`.

**The CSV with the capture: yes.** The capture holds all four, the stored digests to compare with, and the file name, source broker and portfolio id that the whole-import digest needs.

**What else is needed.** The CSV is not hashed row by row. The import stage must be applied: format detection, the Dhan column mapping, row exclusion, grouping, aggregation and the weights over the whole statement. The identity lookup of that stage needs the security master and is the one part not re-run; its outputs are taken from the capture. The stored `companyId`, `identityStatus` and `resolutionDisposition` are the values IPD derived again at commit time. They equal the values inside the digest when both sides resolved against the same governed master, which is what the one digest already reproduced on the host shows for that holding. If they differ for a holding, its digest is not reproduced and the utility says so; it does not guess another value.

**A check that covers all 64 at once.** `computeBrokerImportProvenance` (`brokerImportPersistence.ts:169`) is the SHA-256 of these lines joined by a newline: `portfolio:<id>`, `file:<name>`, `broker:<broker>`, `imported:<importedAt>`, `content:<contentDigest>`, then one line per holding in symbol order, `symbol|isin|exchange|quantity|averageBuyPrice|currentPrice|marketValue|weightPercentage|active|sourceBroker|lineageDigest`. It is stored as the revision's `provenanceDigest` and as `importEvidence[].lineageDigest`. It includes each holding's ISIN and exchange. If the utility reproduces it, the ISIN, exchange, measures and digest of all 64 holdings are confirmed together by a value IPD computed itself.

## 5. The utility

`evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/w04-e4-csv-lineage-reproduction.mjs`
66,737 bytes. SHA-256 `901a365c4dad816532fd244e9b17a7c7bb5cffbebff2a57bd4ad0f9f40c20a9c`.

```
node w04-e4-csv-lineage-reproduction.mjs --csv <file> --capture-dir <dir>
```

### 5.1 What it does

| Step | Action | If it fails |
|---|---|---|
| 1 | Reads the CSV. Computes the SHA-256 of the raw bytes and of the decoded text. Requires the import-content digest to equal `a3c3ee76…3107` | Stops. Nothing is parsed or compared |
| 2 | Looks under `--capture-dir` for exact capture files and selects the one whose SHA-256 is `c5dd51f5…eda3`. Checks the schema, the outcome, that both `portfolio.get` reads agree, and the recorded facts: `DHAN_PORTFOLIO`, revision 1, 64 holdings, 63 `null` and 1 object identity | Stops if no file has the digest or the file is not an exact capture. A recorded fact that does not hold is a failed check |
| 3 | Requires exactly one committed import in the capture to carry the content digest of this CSV, with a recorded import instant | Stops |
| 4 | Detects the format, maps the Dhan columns, excludes, groups, aggregates and weighs, as section 2.3 | Stops if the file is not a Dhan export or yields no holding |
| 5 | For every stored holding H and every CSV-derived holding G, computes the digest from G's CSV-derived members and H's four stored members, and compares it with H's stored digest | — |
| 6 | If all are reproduced one-to-one, recomputes the whole-import digest and compares it with the two stored copies | A failed check |

`--capture-dir` accepts the capture root, one run folder, its `LOCAL-ONLY-DO-NOT-PUBLISH` folder, or the file itself.

### 5.2 Results per holding

| Status | Meaning | Counted as reproduced |
|---|---|---|
| `REPRODUCED` | Exactly one CSV-derived holding reproduces the stored digest, and it reproduces no other stored holding | Yes |
| `AMBIGUOUS` | More than one CSV-derived holding reproduces it, or its CSV-derived holding also reproduces another stored holding | No |
| `REPRODUCED_IDENTIFIERS_ONLY` | No CSV-derived holding reproduces it. The digest is reproduced from the **stored** measures with an ISIN that occurs in the CSV (or none) and an exchange of `NSE`, `BSE` or none. A weaker result, reported apart | No |
| `NOT_REPRODUCED` | None of the above | No |

A match is exact digest equality. Nothing is paired by symbol, name or similarity. For a holding that is not reproduced, a diagnostic names which measures differ from the CSV-derived holding with the same symbol text; it is labelled a diagnostic, is never a match, and prints no value.

**The utility does not classify identity.** For each reproduced holding it reports what the committed input carried, in a closed form such as `ISIN+EXCHANGE_NSE` or `NO_ISIN+EXCHANGE_BSE`, beside whether the stored security identity is `null` or an object. It assigns no security identity, no cause and no acceptance, and prints `identityClassification: NOT_PERFORMED`.

### 5.3 Read-only and sanitized

- Imports `node:crypto`, `node:fs`, `node:path`. Opens files with `'r'`. No write, rename, delete, directory creation, process or network call.
- Does not modify the CSV or the capture; does not open the portfolio database; does not read, create or change `journal.ndjson`; re-imports nothing; changes no portfolio, identity, registry or persisted state; contacts neither Dhan nor any provider; reads no repository checkout.
- Prints counts, the SHA-256 of the two whole files, yes/no answers, closed-vocabulary values and ordinals (`H07`, `G12`, CSV line numbers). It prints no symbol, ISIN, company identifier, file name, path, quantity, price, value, weight, timestamp or per-holding digest.

### 5.4 Why Node

The digest is over `JSON.stringify` of numbers produced by JavaScript arithmetic. PowerShell parses and formats such numbers differently and could report a false mismatch. Node is already required on the host by IPD and IRR.

## 6. Synthetic tests

`csv-lineage-selftest.mjs`, in the same folder. **A tool test, not evidence.** Its inputs are built by the unmodified compiled IPD pipeline and store, so every digest the utility is asked to reproduce was computed by production code. Result in this environment (Node v22.22.3): **46 of 46 scenarios pass; 101 utility runs checked.**

| Required case | Scenarios | Result |
|---|---|---|
| Exact matches | 7, including a 64-holding statement of the recorded shape and 40 seeded random statements (449 holdings) | All digests reproduced one-to-one; whole-import digest equal |
| Missing identifiers | 2 | Reproduced; reported as `NO_ISIN` |
| Missing exchange | 3 | Reproduced; reported as `NO_EXCHANGE`. The production identity gate refuses such a holding, so none is expected in the capture |
| Null and empty fields | 5 | CSV side reproduced as the mapper computes it. A stored holding with a null digest or an empty company identifier is `NOT_REPRODUCED`; nothing is guessed |
| Duplicate rows | 2 | Aggregated exactly as the mapper does; CSV lines reported as `2+5` |
| Ambiguous matches | 2 | Both holdings `AMBIGUOUS`, neither counted. A row equal in symbol and every measure but with another digest is `NOT_REPRODUCED` |
| Changed field values | 11 | Each change is detected. Reordered rows reproduce the per-holding digests but not the whole-import digest, so the result is `PARTIAL` |
| Incorrect input digest | 6 | `INCONCLUSIVE`, exit code 2, nothing compared |
| Incorrect capture digest | 5 | `INCONCLUSIVE`, exit code 2, nothing compared |
| Read-only (added) | 3 | Identical output under `node --permission --allow-fs-read=*`; source check; argument handling |

Every run also asserts an unchanged input tree, an empty stderr, and an output free of every synthetic identifier, measure, file name, path, instant and per-holding digest. The five CSV parsing functions in the utility are token-identical to the compiled production functions. Details, and three stated limits of the test, are in the [folder README](../../evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/README.md).

One further check was run once in the sandbox and is not committed: the compiled pipeline with the governed D05 master and IRR's preview options, committed through `persistBrokerImport` with its default resolver (the production identity gate), on an invented 64-row statement of securities taken from the master. The utility, as fetched from GitHub at `8467dfb`, reproduced 64 of 64 digests and the whole-import digest, and the stored company identifier equalled the one inside the digest on 64 of 64. This supports the statement in section 4 about the three identity members; it is still not a run on the actual inputs.

**Not tested:** Windows, PowerShell, the original CSV, the actual capture. (Later record: the Principal ran the utility on the host on those inputs; section 12. It is still not tested in this environment.)

## 7. The command for the Principal

Windows PowerShell 5.1. **It has not been executed: this environment has no PowerShell.** Read it before running it. (Later record: the Principal executed it on the host; section 12.)

```powershell
# 1. A folder outside every repository and outside the IIPS data directories
$work = Join-Path $env:LOCALAPPDATA 'IIPS\w04-e4'
New-Item -ItemType Directory -Force -Path $work | Out-Null
$tool = Join-Path $work 'w04-e4-csv-lineage-reproduction.mjs'

# 2. Fetch the utility at the pinned commit (one file; no checkout is read or changed)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -UseBasicParsing -OutFile $tool -Uri 'https://raw.githubusercontent.com/ramkivs/iips-production-market-data/8467dfb4a51bdc73a59d92c39f15e98e64b91997/evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/w04-e4-csv-lineage-reproduction.mjs'

# 3. Confirm it is the reviewed file. This must print:
#    901a365c4dad816532fd244e9b17a7c7bb5cffbebff2a57bd4ad0f9f40c20a9c
(Get-FileHash -Algorithm SHA256 -LiteralPath $tool).Hash.ToLower()

# 4. Run it. Read-only.
$csv     = 'C:\Users\USER\Desktop\dhan_holdings_withisinv1.1 - Copy.csv'
$capture = Join-Path $env:LOCALAPPDATA 'IIPS\w11-dep1-capture'
$out  = & node $tool --csv $csv --capture-dir $capture
$code = $LASTEXITCODE
$out
"exit code: $code"

# 5. Keep the sanitized output beside the utility
$out | Set-Content -LiteralPath (Join-Path $work 'w04-e4-csv-lineage-output.txt') -Encoding UTF8
```

Stop at step 3 if the digest differs.

Notes:

- The block writes two files, both in `%LOCALAPPDATA%\IIPS\w04-e4`: the utility (step 2) and its sanitized output (step 5). The utility itself writes nothing. Step 5 may be left out.
- Step 2 is the only network request. It fetches one file from GitHub. No repository checkout on the host is read, fetched, pulled or changed.
- Give `--capture-dir` no trailing backslash. In PowerShell 5.1 a quoted argument that ends in `\` is passed to a native program incorrectly.
- If the capture was moved, give its folder or the file itself to `--capture-dir`.
- Optional, to have Node itself refuse any write: `& node --permission --allow-fs-read=* $tool --csv $csv --capture-dir $capture`. Older Node versions name the flag `--experimental-permission`. If Node rejects the flag, leave it out; the utility is the same.
- The utility needs `node` on the path, as the capture utility and the E4 probe did.

What to return: the text of `w04-e4-csv-lineage-output.txt`, or at least the lines from `== Result` to the end, with the digest printed at step 3 and the exit code. The output holds counts, two whole-file digests, ordinals and closed-vocabulary values. It is still the Principal's to read before sending.

## 8. Expected output format

A complete synthetic example is in [`sample-output-synthetic.txt`](../../evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/sample-output-synthetic.txt). The outline, with `…` for values:

```
W04 E4 - lineage reproduction from the original CSV (w04-e4-csv-lineage/1). Read-only. Sanitized output.

== 1. Original CSV (input 1): digest verification
[INFO] csv.sha256.expected: a3c3ee76…3107
[INFO] csv.sha256.rawBytes: …
[INFO] csv.sha256.importContent: … (SHA-256 of the decoded text, as the import pipeline computes it)
[INFO] csv.encoding: byte-order mark …; valid UTF-8 …; line endings …
[PASS] csv.sha256: import-content SHA-256 of the CSV equals the expected digest: yes
[PASS] csv.size: the text is within the 1 MiB limit of the import preview: yes

== 2. Exact capture (input 2): digest verification and target holdings
[INFO] capture.sha256.expected: c5dd51f5…eda3
[INFO] capture.search: … exact capture file(s) examined; 1 with the expected SHA-256
[PASS] capture.sha256: capture SHA-256 equals the expected digest: yes
[PASS] capture.schema / capture.outcome / capture.reads.agree
[PASS] capture.portfolio: portfolio selected and returned is DHAN_PORTFOLIO: yes
[PASS] capture.revision: revision is 1 (observed 1): yes
[PASS] capture.holdings: holdings array and holdingsCount are 64 (observed 64 and 64): yes
[PASS] capture.identity.null: securityIdentity null on 63 (observed 63): yes
[PASS] capture.identity.object: securityIdentity object on 1 (observed 1): yes
[INFO] capture.identityStatus / resolutionDisposition / holdingsPerSourceBroker / lineageDigests / revisions / imports

== 3. Link: the committed import whose content digest is the digest of this CSV
[PASS] link.contentDigest: exactly one committed import in the capture carries the content digest of this CSV (observed 1): yes
[PASS] link.importedAt: the import instant is recorded as an ISO-8601 UTC instant: yes

== 4. CSV parsed with the import format and transformation rules
[INFO] csv.detection: broker DHAN; format CSV
[INFO] csv.variant / csv.columns / csv.rows / csv.rows.identifiers
[INFO] csv.mapper: … holding(s) derived; … row(s) aggregated …; … row(s) excluded {…}

== 5. Lineage digests recomputed from the CSV and compared with the stored digests
[ROW] H01 REPRODUCED algorithm=MAPPER_BI03 csvHolding=G17 csvLines=18 input=ISIN+EXCHANGE_NSE storedIdentity=null
[ROW] H02 REPRODUCED_IDENTIFIERS_ONLY algorithm=MAPPER_BI03 input=… isinOfCsvHolding=G… exchangeEqualsThatCsvHolding=… storedIdentity=null | diagnostic: equalSymbol=G… csvLines=… differingMembers=…
[ROW] H03 AMBIGUOUS candidates=G…+G… sharedWith=H… storedIdentity=null
[ROW] H04 NOT_REPRODUCED storedIdentity=null | diagnostic: equalSymbol=…
…                                                    (one [ROW] line per target holding: 64)
[CSV] G… MATCHES_NO_STORED_DIGEST csvLines=… input=…  (one line per CSV-derived holding that matches nothing)
[INFO] reproduction.target: 64 target holding(s); … holding(s) derived from the CSV
[INFO] reproduction.reproduced: … of 64 stored lineage digests reproduced from the CSV, one-to-one {…}
[INFO] reproduction.ambiguous: … ambiguous
[INFO] reproduction.unmatched: … not reproduced from the CSV: … reproduced from stored measures with an identifier pair only, … reproduced by nothing
[INFO] reproduction.csvUnmatched: … CSV-derived holding(s) match no stored digest
[PASS] reproduction.storedMembers: …
[PASS] import.provenance.evidence: whole-import digest recomputed from the CSV equals the digest recorded for the import: yes
[PASS] import.provenance.revision: whole-import digest recomputed from the CSV equals the provenance digest of the stored revision: yes

== 6. Committed input of the reproduced holdings (not an identity classification)
[INFO] input.reproduced.storedIdentityNull: {"ISIN+EXCHANGE_NSE":…,…}
[INFO] input.reproduced.storedIdentityObject: {…}
[INFO] input.identifiersOnly.storedIdentityNull: {…}
[INFO] input.identifiersOnly.storedIdentityObject: {…}
[INFO] identity.classification: NOT_PERFORMED. …

== Result
E4_CSV_LINEAGE_RESULT_JSON: {…}
E4_CSV_LINEAGE_RESULT_JSON_SHA256: …
checks: … pass, … fail, … warn
unresolved: none | <codes>
RESULT: REPRODUCED_ALL | PARTIAL | INCONCLUSIVE
```

| Exit code | Last line | Meaning |
|---|---|---|
| 0 | `RESULT: REPRODUCED_ALL` | All 64 stored digests reproduced one-to-one from the CSV, the whole-import digest equals both stored copies, no check failed, nothing unresolved |
| 1 | `RESULT: PARTIAL` | The utility ran. Something is unmatched, ambiguous or failed. What was reproduced stands |
| 2 | `RESULT: INCONCLUSIVE` | An input was missing or was not the expected one. Nothing was compared. A `[STOP]` line names a code and a step |

Explicit errors and unresolved conditions appear as `[FAIL]` lines, `[WARN] unresolved:` lines, a `[STOP]` line, and the `unresolved:` list, which repeats inside the result JSON. `E4_CSV_LINEAGE_RESULT_JSON` carries the same facts in one line, including one anonymized entry per holding.

## 9. How the result will be read

Fixed here, before any result exists. This reading is a step after the utility, not part of it.

The classes are those of section 6 of the [E4 record](IIPS-W04-E4-IDENTIFIER-SUPPLY-DIAGNOSIS-HOST-PROBE-PREPARED-2026-11-14.md). They apply to the 63 holdings whose stored identity is `null` (`input.reproduced.storedIdentityNull`):

| Reported input of a `REPRODUCED` holding | E4 class | Standing |
|---|---|---|
| `NO_ISIN+…` | A, no ISIN in the committed input | Confirmed cause |
| `ISIN+NO_EXCHANGE` | B, ISIN without an exchange | Confirmed cause. Not expected |
| `ISIN+EXCHANGE_NSE`, `ISIN+EXCHANGE_BSE` | C, ISIN and exchange supplied, no identity stored | **Input confirmed. Reason unknown** |
| not reproduced, or ambiguous | D | Undetermined. Nothing is claimed |

Rules:

- Only `RESULT: REPRODUCED_ALL` on the recorded digests supports a statement about all 64. With `PARTIAL`, each count stands for the holdings it covers and no more.
- `REPRODUCED_IDENTIFIERS_ONLY` meets the wording of the E4 classes (the stored digest is reproduced with that ISIN and exchange) but not from the CSV's own measures. It is reported apart and is a matter for review, not counted silently.
- Class C is not a cause. The typed reason for a missing identity was not kept. Reproducing the digests does not recover it.
- A count is an aggregate. No holding is named, and no holding receives an identity.
- The result is the Principal's run of a prepared tool. It is operator-reported until reviewed, as the E4 probe output is.
- Nothing here is an acceptance of W04.

## 10. Boundaries observed

- Read-only. No Broker Import change, no portfolio or registry change, no import, no journal reconstruction, no Windows checkout synchronization.
- The CSV was not requested, uploaded or read. The Principal's Desktop was not accessed. No repository file was treated as the statement.
- Nothing was run on the host. Every test used synthetic rows, an in-memory database and temporary folders.
- No IRR commit or push. PR #157 remains open and unmerged.
- W04 is not declared accepted.

## 11. State when the utility was prepared

Superseded by section 15.

**Completed**

- Source investigation of the lineage digest, its inputs and rules, the capture structure and the sufficiency of the CSV.
- The utility, its self-test (46 of 46), a synthetic sample output and this record, published on the branch of PR #157.

**Remaining**

- The Principal runs the command of section 7 and returns the output.
- The returned output is read by the rules of section 9 and recorded.

**Blockers**

- The CSV and the capture exist only on the host. The run cannot be made here.
- Not a blocker for the run, but a limit of what it can show: for class C the reason remains unknown whatever the result.

**Next roadmap step**

W04, E4: record the result of the host run. If the holdings are reproduced, the split of the 63 by committed input replaces "UNDETERMINED" for the classes it confirms, and the open question narrows to why holdings with an ISIN and an exchange received no identity. The decisions listed in section 6 of the journal-not-found investigation (the evidence-owner carrier, refusing a commit without verified retention, the runbook corrections) are unaffected and still open.

## 12. Host result (later record, 2026-11-14)

### 12.1 Standing of this evidence

- **Who ran it.** The Principal ran the published utility on the Windows host, in Windows PowerShell 5.1, with the command of section 7. **It was not run in this environment.** This environment has no access to the host, to the CSV or to the capture, and requested neither file.
- **What reached this environment.** The figures in sections 12.2 to 12.7 are transcribed from the Principal's task brief of 2026-11-14 (its section 4). They are **reported by the Principal (H)**. Nothing in them was re-read from the host or verified independently here.
- **What did not reach this environment.** The brief states that the complete sanitized output, including `E4_CSV_LINEAGE_RESULT_JSON`, was attached. **No attachment was delivered to this environment.** The Principal was asked and chose to attach it again in a later message. Until then the following are **not in the repository and were not seen here**: the 64 `[ROW]` lines, the result JSON and its SHA-256, the totals of the `checks:` line, any `[WARN]` line, and the `unresolved:` line.
- **Where the complete output will go.** `evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/host-run-2026-11-14/w04-e4-csv-lineage-output.txt`, verbatim. The [folder note](../../evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/host-run-2026-11-14/README.md) lists the figures it must agree with. If it differs from this section in any figure, this section is corrected and the difference is recorded.

Labels used from here on: **H** reported by the Principal from the host run; **S** read in source here, at the commit named; **R** reproduced here with synthetic input; **D** derived, with its conditions stated; **U** unavailable.

### 12.2 Utility and inputs (H)

| Item | Expected | Reported | Result |
|---|---|---|---|
| Utility SHA-256 (section 7, step 3) | `901a365c4dad816532fd244e9b17a7c7bb5cffbebff2a57bd4ad0f9f40c20a9c` | `901a365c4dad816532fd244e9b17a7c7bb5cffbebff2a57bd4ad0f9f40c20a9c` | Equal |
| CSV, import-content SHA-256 | `a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107` | `a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107` | `csv.sha256` PASS |
| CSV, raw-byte SHA-256 | not fixed in advance | `a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107` | Equal to the import-content digest, as it is for UTF-8 text without a byte-order mark |
| CSV encoding | | Valid UTF-8, no byte-order mark, CRLF line endings | |
| CSV size | within 1 MiB | within the limit | `csv.size` PASS |
| Capture SHA-256 | `c5dd51f51025e3e17e3b798164c6b8078fa5487392d8f0dfd96be9bb7c79eda3` | `c5dd51f51025e3e17e3b798164c6b8078fa5487392d8f0dfd96be9bb7c79eda3` | `capture.sha256` PASS |

The CSV path given to the utility was `C:\Users\USER\Desktop\dhan_holdings_withisinv1.1 - Copy.csv`.

### 12.3 The capture (H)

| Item | Reported |
|---|---|
| Schema; outcome | exact-capture schema v1; `CONSISTENT_CAPTURE` |
| Reads | Four examined; the two portfolio reads agree |
| Portfolio; revision | `DHAN_PORTFOLIO`; 1 |
| Holdings; distinct lineage digests | 64; 64 |
| Committed imports; revision operation; source broker | 1; `INITIAL`; `DHAN` |
| `securityIdentity` | object 1; `null` 63; other 0 |
| `identityStatus` | `{"RESOLVED":64}` |
| `resolutionDisposition` | `{"CANONICAL_P04":64}` |

### 12.4 Link between the CSV and the committed import (H)

| Check | Reported |
|---|---|
| Committed imports in the capture that carry the content digest of this CSV | Exactly 1 |
| Recorded import instant | An ISO-8601 UTC instant |
| Recorded file name | Equals the name of the supplied CSV |
| Source broker; import semantics | `DHAN`; `SAVED_NEW_BATCH` |
| Whole-import digest recorded for the import, against the provenance digest of the revision | Equal |

### 12.5 The CSV as parsed (H)

| Item | Reported |
|---|---|
| Recognized layout | `DHAN_DETAILED_HOLDINGS_V1` |
| Data rows; native rows passed to the mapper | 64; 64 |
| Rows skipped for an empty symbol; aggregated; excluded | 0; 0; 0 |
| Holdings derived; distinct ISINs | 64; 64 |

| Identifiers on the row | Rows |
|---|---:|
| ISIN and NSE | 63 |
| ISIN and BSE | 1 |
| ISIN without an exchange | 0 |
| Exchange without an ISIN | 0 |
| Neither | 0 |
| **Total** | **64** |

### 12.6 Lineage reproduction (H)

| Measure | Reported |
|---|---:|
| Target holdings | 64 |
| Holdings derived from the CSV | 64 |
| Stored lineage digests reproduced, one-to-one, algorithm `MAPPER_BI03` | **64** |
| Ambiguous | 0 |
| Not reproduced | 0 |
| Reproduced with an identifier pair only | 0 |
| CSV-derived holdings that match no stored digest | 0 |
| Stored-member discrepancies (symbol, measures, source broker) | 0 |

| Whole-import digest recomputed from the CSV | Reported |
|---|---|
| Equals the digest recorded for the import (`import.provenance.evidence`) | PASS |
| Equals the provenance digest of the stored revision (`import.provenance.revision`) | PASS |

**Final line: `RESULT: REPRODUCED_ALL`. Exit code: 0.**

### 12.7 Committed input by stored identity (H)

| Stored `securityIdentity` | ISIN and NSE | ISIN and BSE | Total |
|---|---:|---:|---:|
| `null` | 62 | 1 | 63 |
| object | 1 | 0 | 1 |
| **Total** | **63** | **1** | **64** |

### 12.8 Check against section 8

| Section 8 says, for exit code 0 | Reported |
|---|---|
| All 64 stored digests reproduced one-to-one from the CSV | 64 of 64, 0 ambiguous, 0 not reproduced |
| The whole-import digest equals both stored copies | Both PASS |
| No check failed, nothing unresolved | Follows from the final line: the utility prints `REPRODUCED_ALL` only with zero failed checks and an empty unresolved list (utility source, lines 1251-1253). The `checks:` totals and the `unresolved:` line themselves are in the complete output only |
| The digests are the recorded ones, not overridden | The three digests of 12.2 equal the recorded values |

The reported figures are internally consistent: 63 + 1 = 64 rows; 62 + 1 + 1 = 64 holdings; 64 reproduced + 0 + 0 = 64 targets.

### 12.9 What the result establishes, and what it does not

1. The original committed CSV input is identified and verified: its content digest is the one recorded for the single committed import of revision 1 (H).
2. All 64 stored lineage digests are reproduced from that file with the production algorithm (H), and the whole-import digest that IPD computed itself is reproduced (H). By section 4 that confirms the ISIN, exchange, measures and digest of all 64 holdings together.
3. All 63 holdings whose stored security identity is `null` had **both an ISIN and an exchange** in the committed input (H).
4. The evidence establishes **what the import contained**.
5. It does **not** establish **why** no security identity was stored for the 63. Section 13 gives what can be derived and on which conditions.
6. No missing identity was reconstructed or assigned, here or by the utility. `identityClassification` is `NOT_PERFORMED` by design.
7. No identity repair, import, portfolio change or journal reconstruction was performed.

The result is the Principal's run of a prepared tool. It is operator-reported, as the E4 probe output is. The lineage reproduction does not recreate the IRR evidence journal, which remains unrecovered ([journal-not-found record](IIPS-W04-E4-EVIDENCE-JOURNAL-NOT-FOUND-INVESTIGATION-2026-11-14.md)).

## 13. Reading of the result: the 63 holdings

Read by the rules of section 9, which were fixed before the result existed. `RESULT: REPRODUCED_ALL` on the recorded digests is the condition for a statement about all 64, and it is met (H).

| E4 class | Holdings | Standing |
|---|---:|---|
| A, no ISIN in the committed input | 0 | Excluded for all 63 |
| B, ISIN without an exchange | 0 | Excluded for all 63 |
| **C, ISIN and exchange supplied, no identity stored** | **63** (NSE 62, BSE 1) | **Input confirmed. Cause not proven** |
| D, undetermined | 0 | |
| **Total** | **63** | Equals the number of `null` identities in the capture |

**The earlier status "UNDETERMINED: 63 of 63" is replaced by "class C: 63 of 63".** The input identifiers of the 63 are no longer unknown. Class C is a statement about the input. It is not a root cause.

**What the result adds to class C (D).** The E4 record, section 6, named two candidates for class C: a typed reason of `qualifyHoldingSecurityIdentity`, or a process that held no master or registry at that moment. It also fixed one narrowing fact in advance: if a holding of the same single-import revision received an identity from an ISIN and an exchange, the qualification path was active in that import.

- Revision 1 is one import (H: one committed import, operation `INITIAL`). One of its holdings carries an identity object and was committed with an ISIN and an exchange (H).
- IRR's commit sends no series (S: IRR `frontend/src/api/brokerImportStage4.ts:16-41` at `08411bc`). Without a series the fallback branch builds nothing (S: `src/persistence/brokerImportPersistence.ts:148-150`; R: section 14.4, control 4d). An identity object can then come only from the qualification branch, which needs both the master and the registry (S: lines 137-145).
- `mapBrokerImportHoldings` is called once per import with one options object (S: line 242). The branch condition is therefore the same for every holding that has an ISIN and an exchange, and all 64 have both.

So, **on the condition that revision 1 was written by a build that behaves as the reviewed source** (coverage condition C1), all 63 went through `qualifyHoldingSecurityIdentity` and each returned a result other than `QUALIFIED`. "A process that held no master or registry" is excluded on that condition.

**On the further condition that the tracked sources were the ones loaded** (coverage condition C2), the reason is `MISSING_P7_MAPPING` for all 63: the registry holds no mapping for that company, exchange segment and ISIN. Over every ACTIVE listing of the tracked master, a row that passes the company gate either qualifies or returns `MISSING_P7_MAPPING`, and no other reason occurs (R: section 14.4; coverage assessment, section 6.2). The tracked registry qualifies 45 ISINs on each exchange out of 2,390 and 2,290 listings. One qualifying holding among 64 is consistent with that. It does not prove it.

**Neither condition is established on the host.** The build that wrote revision 1 and the files it loaded were not observed (U). The typed reason was not returned, stored or logged at import (S: lines 143-147; coverage R15, R17) and cannot be recovered. The ISINs are not in this environment, so membership in the tracked registry was not checked (U). Section 14.6 names the evidence that would settle the cause.

## 14. `identityStatus` and `securityIdentity`: source investigation

**The observation (H).** The capture reports `identityStatus` `RESOLVED` and `resolutionDisposition` `CANONICAL_P04` on 64 of 64 holdings, and a `securityIdentity` object on 1 of 64.

### 14.1 Answer

**It is a valid state, produced by design.** The two status fields and the identity object answer different questions.

- `identityStatus` and `resolutionDisposition` record the **company-level gate**: the row's identifiers resolve to exactly one company of the P04 master. The gate decides whether the import may be saved at all.
- `securityIdentity` records the **security-level qualification**: an exact D114 identity `ISIN:<isin>:<series>`, which needs series evidence from the P7 registry. It is additive. A holding without it is still saved.

`RESOLVED` on 64 holdings therefore does not mean that 64 securities were identified, and a `null` identity beside it is not a serializer defect. The earlier [coverage assessment](IIPS-W04-IDENTITY-COVERAGE-REVISION-1-EVIDENCE-ASSESSMENT-2026-11-13.md) recorded the same reading (its section 4, R4, R5 and R7). This section re-establishes it independently from the source at the head of PR #157 and adds a sandbox reproduction of the exact reported shape.

Sources read: IPD at `68ab3dc` (head of PR #157). IRR at `main` `08411bc`, read-only. Every IPD function cited below is textually identical at `1aee57f`, the IPD commit IRR pins; three of the files changed elsewhere, so their line numbers differ there. Which build the host's IPD server ran is not observed (U).

### 14.2 Data flow (S)

```
IRR browser bundle (IPD pipeline)                 IPD IPC server: one call of persistBrokerImport
CSV row: symbol, ISIN, exchange                   request holding: symbol, isin?, exchange?, measures, lineageDigest
  | mapper, with the P04 master                     | companyId, identityStatus and resolutionDisposition
  |   companyId, identityStatus,                    | are refused on the wire
  |   resolutionDisposition                         |
  |   -> used inside the lineage digest only        +- 1. company gate: resolveHoldings -> resolver.resolve
  v                                                 |      one row that fails refuses the whole import
prepareBrokerImport                                 |      -> companyId, 'RESOLVED', 'CANONICAL_P04'
  sends no identity member and no series            +- 2. security qualification: mapBrokerImportHoldings
                                                    |      qualifyHoldingSecurityIdentity(isin, exchange; P04, P7)
                                                    |      QUALIFIED -> D114 object; otherwise null, reason discarded
                                                    v
                                                  one INSERT per holding, three separate columns:
                                                  identity_status, resolution_disposition, security_identity
                                                    v
                                                  portfolio.get -> wire result -> IRR capture, verbatim
```

### 14.3 The ten questions

| # | Question | Finding | Source |
|---|---|---|---|
| 1 | Where is `identityStatus` produced? | In `resolveHoldings`. For each holding it calls the governed resolver; on `RESOLVED` it pushes the holding with the literal `identityStatus: 'RESOLVED'`. The type allows no other value. It is carried unchanged into the stored row. | IPD `src/persistence/brokerImportPersistence.ts:41-45`, `62-89` (literal at 77), `162`; resolver `src/identity/broker_observation_resolver.ts:31-81` |
| 2 | Where is `resolutionDisposition` produced? | In the same statement, as the literal `'CANONICAL_P04'`. | Same, line 77; carried at 163 |
| 3 | Where is `securityIdentity` populated? | In `mapBrokerImportHoldings`. It starts as `null`. With an ISIN, an exchange, a master and a registry it becomes the D114 object only if `qualifyHoldingSecurityIdentity` returns `QUALIFIED`. Without a master or registry it is built from a broker-supplied ISIN and series, or stays `null`. The server composes the master and the registry at start and refuses to start if it cannot. | `brokerImportPersistence.ts:128-167` (136, 137-145, 148-150); `src/providers/dhan/dhan_security_identity_service.ts:117-345`; `src/ipc/brokerImportComposition.ts:60-67`; `src/ipc/entrypoint.ts:175-200`; `src/providers/dhan/dhan_local_daemon.ts:154-198` |
| 4 | Different lifecycle stages, or different concepts? | Different concepts, evaluated one after the other inside one commit call: the gate at line 237, the qualification at line 242. The first is the company; the second is the security with its series. | `brokerImportPersistence.ts:227-243`; comment at 114-127 ("identity is additive metadata, not a blocker for portfolio data") |
| 5 | Can `RESOLVED` coexist with `securityIdentity: null`? | Yes, by design. `null` is defined as "explicitly unresolved" for the security. The gate needs a company; the qualification also needs a P7 mapping. Over the tracked master 4,590 of 4,680 listing pairs pass the gate and fail the qualification. | `src/persistence/portfolio_store.ts:92-98`; `src/persistence/migrations/005_holding_security_identity.ts:5-14`; R: section 14.4 |
| 6 | What does `CANONICAL_P04` indicate? | A disposition class: the company identity came from the governed P04 master. It is a completed company resolution, not an attempt. It is written only together with `RESOLVED`. Other paths write other values: the mapper's `NON_PRODUCTION_OPERATOR_BYPASS`, and `MANUAL_PERSONAL_ENTRY` with `UNRESOLVED` for manual holdings. It says nothing about series or security. | `brokerImportPersistence.ts:77`; `frontend/src/features/portfolio/import/broker-holdings-mapper.ts:230-253`; `src/persistence/manualPersonalPortfolio.ts:93-104` |
| 7 | Can the status be stale, or copied from an earlier stage? | Not for revision 1. The browser computes its own status, which enters the lineage digest only. A request that carries `companyId`, `identityStatus` or `resolutionDisposition` is refused three times: by IRR, by the IPC payload check and by `validateRequest`. The stored value is the server's own result of the same call. It is a fact as of the import and is not re-evaluated on a read; a restore copies rows, but revision 1 is `INITIAL` (H). | IRR `frontend/server/broker-import/brokerImportStage4.ts:35-37`; IPD `src/ipc/dispatch.ts:294-314`; `brokerImportPersistence.ts:191-206`; `portfolio_store.ts:1097-1113`; R: control 4a |
| 8 | Could the serializer omit or transform an identity object? | No path was found that turns an object into `null`. The read returns `null` only for SQL `NULL`; a stored value that is not valid makes the read fail. `personalGet` passes holdings through. IRR parses the response frame and the capture stores `frame.result` verbatim. The capture counts object, `null`, absent and malformed separately; an omitted member would be counted absent, and absent and malformed are 0 (H). | `portfolio_store.ts:1097-1113`, `1120-1135`; `dispatch.ts:174-191`, `536`; IRR `frontend/server/user-portfolio/ipcClient.ts:674`; IRR `frontend/server/user-portfolio/capture/ownerBoundPortfolioCapture.ts:382-424`, `1317`; R: control 4e |
| 9 | Does persistence keep the fields independently? | Yes. Three nullable text columns, written by one `INSERT` per holding, with no constraint between them. The write requires a non-blank status and disposition, and a valid D114 object if one is present. | `src/persistence/migrations/001_initial_schema.ts:64-65`; migration 005, line 14; `portfolio_store.ts:1153-1160`, `1283-1309`, `1409-1414` |
| 10 | Valid state, semantic inconsistency, or defect? | **Valid state.** Not a defect of storage or of serialization. One residual point is recorded in 14.5: the unqualified name `identityStatus` does not say which identity it covers. | Sections 14.4 and 14.5 |

### 14.4 Sandbox reproduction (R)

[`identity-status-source-probe.mjs`](../../evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/identity-status-probe/identity-status-source-probe.mjs) runs the unmodified compiled IPD code with the two tracked sources: the governed P04 master and the retained P7 manifest (SHA-256 `13bd2ef1…78bc`, 96 mappings, 48 ISINs). The statement is invented: securities taken from the tracked master by a fixed rule, with made-up quantities and prices. **It is not host evidence.** Its [output](../../evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/identity-status-probe/identity-status-source-probe.output.txt) holds counts and closed-vocabulary values only.

| Step | Result |
|---|---|
| Company gate over every ACTIVE NSE and BSE listing of the tracked master (4,680 pairs) | `RESOLVED` 4,680 |
| Security qualification over the same pairs | `QUALIFIED` 90 (45 on each exchange); `MISSING_P7_MAPPING` 4,590; no other reason |
| Synthetic import of the reported shape, through the production composition: 63 NSE rows and 1 BSE row, every row with an ISIN and an exchange, one row with a P7 mapping | Committed as revision 1, `SAVED_NEW_BATCH`, 64 holdings |
| Stored columns | `RESOLVED`, `CANONICAL_P04`, identity `NULL`: 63. `RESOLVED`, `CANONICAL_P04`, identity present: 1 |
| `portfolio.get` wire result | `identityStatus` `{"RESOLVED":64}`; `resolutionDisposition` `{"CANONICAL_P04":64}`; identity object 1, `null` 63, absent 0 |
| The published utility on that statement and a capture-shaped file | `REPRODUCED_ALL`; `null`: `ISIN+EXCHANGE_NSE` 62, `ISIN+EXCHANGE_BSE` 1; object: `ISIN+EXCHANGE_NSE` 1 |
| Control 4a: a request that carries `identityStatus` | Refused, `INVALID_REQUEST`, no store effect |
| Control 4b: one row whose identifiers name two companies | Whole import refused, `REFUSED_UNRESOLVED_IDENTITY`, nothing stored |
| Control 4c: an empty registry | `RESOLVED` 64; identity object 0 |
| Control 4d: no master and no registry (the fallback) | `RESOLVED` 64; identity object 0 |
| Control 4e: a stored identity damaged in the database | The read fails; the value is not returned as `null` |

10 checks pass, 0 fail. Two runs give the same output.

**The reviewed code, given 64 rows with an ISIN and an exchange of which one has a P7 mapping, produces exactly the reported state.** That shows the state is reachable and by design. It does not show that the host import had those inputs or those sources.

### 14.5 Hypotheses, residual point and missing evidence

| Statement | Standing |
|---|---|
| The two status fields are company-level; the identity object is security-level; the fields are stored and read independently | **Established (S, R)** |
| A committed broker-import holding always has `RESOLVED` and `CANONICAL_P04`, whatever its security identity | **Established (S, R)** for the reviewed source |
| The browser-side and server-side company results agreed on all 64 holdings | **Supported (H, S).** The stored `companyId`, status and disposition, used as digest members, reproduce 64 of 64 digests the browser computed |
| The host capture shows the state the reviewed code produces | **Consistent (H with S, R).** Not proof that the host ran that code |
| Each of the 63 `null` identities is a `MISSING_P7_MAPPING` | **Hypothesis (D)**, on conditions C1 and C2 of section 13. Not confirmed on the host |
| A defect dropped 63 identities between store and capture | **Not supported.** No such path exists in the reviewed source (question 8). Not excluded for an unreviewed build (U) |

**Residual point, recorded and not acted on.** The name `identityStatus` carries no qualifier. A reader, or a consumer, can take `RESOLVED` to cover the security. IRR's capture utility already avoids this: it reports holding identity "only from the actual `securityIdentity` object" (IRR `ownerBoundPortfolioCapture.ts:52-53`). Whether the contract should name the level is a decision for the IPD identity owner. No change is proposed or made here.

### 14.6 Evidence that would settle the cause of the 63

Each item is a read-only host check that only the Principal can run. None is prepared or authorized by this record.

| # | Evidence | What it would show | Limit |
|---|---|---|---|
| E-a | Counts only: the result of `qualifyHoldingSecurityIdentity`, with the tracked P04 master and the tracked P7 manifest, for the 64 ISIN and exchange pairs of the verified CSV; and whether the one `QUALIFIED` row is the holding that carries the stored identity, with the same series | Expected on condition C2: `QUALIFIED` 1, `MISSING_P7_MAPPING` 63, the same holding, the same series. An exact match on 1 of 64 would be strong support for C2. Any other split refutes the hypothesis | A measurement against today's tracked sources, not the reason computed at import (coverage R19) |
| E-b | The SHA-256 of `evidence/dhan-p7/qualification-manifest.json` in the IPD checkout the host's IPC server runs from, the working directory of that process, and the commit of that checkout | Whether the file the loader would find is the tracked one (`13bd2ef1…78bc`), and which source the server ran (conditions C2 and C1) | Shows the files as they are now. The server neither prints nor serves what it loaded |
| E-c | The typed reason at import | | **Not obtainable.** It was not returned, stored or logged |

## 15. State after the host result

**Completed**

- The host run of the utility is recorded (section 12) from the figures the Principal reported: 64 of 64 lineage digests reproduced, 0 ambiguous, 0 not reproduced, both whole-import checks passed, `RESULT: REPRODUCED_ALL`, exit code 0.
- The 63 holdings are reclassified from UNDETERMINED to class C (section 13): ISIN and NSE 62, ISIN and BSE 1.
- The relation between `identityStatus` and `securityIdentity` is investigated (section 14): a valid state by design, reproduced in the sandbox.

**Remaining**

- The complete sanitized host output, with the `[ROW]` lines and `E4_CSV_LINEAGE_RESULT_JSON`, is to be committed verbatim and reconciled with section 12 (12.1). **Until then this record rests on reported figures, and W04 E4 is not closed.**
- The cause of the 63 `null` identities is not proven. The evidence that would settle it is in 14.6.
- The W04 acceptance conditions of the [roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md) are open: the IRR resolver outcome for the holdings is not observed, the exact security to listing to issuer mapping does not exist for 63 holdings, and the source versions served on the host are not established.

**Blockers**

- The complete host output did not reach this environment.
- Checks E-a and E-b need the host and the Principal.
- An identity for the 63 needs series evidence the tracked registry does not hold. Supplying it is a registry decision of the C4/C5 assessment, section 9. It is not authorized here.

**Next roadmap step**

W04, E4: commit the complete host output and reconcile it. Then the Principal decides whether to run check E-a, which would confirm or refute `MISSING_P7_MAPPING` as the cause. The decisions of the C4/C5 assessment, section 9, and of the journal-not-found record, section 6, are unaffected and still open. **W04 remains PARTIALLY COMPLETE and is not accepted.** No Broker Import change and no identity repair is authorized by this record.
