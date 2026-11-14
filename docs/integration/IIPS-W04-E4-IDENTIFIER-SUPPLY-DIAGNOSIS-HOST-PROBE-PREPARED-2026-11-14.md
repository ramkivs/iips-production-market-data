# Snapshot-to-Live W04 — E4: read-only identifier-supply diagnosis. Host probe prepared; not executed

**Date:** 2026-11-14
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md))
**Subject:** step 1 of section 9 of the [C4/C5 assessment](IIPS-W04-C4-C5-IDENTIFIER-SUPPLY-SOURCE-AND-OWNER-ASSESSMENT-2026-11-14.md), which is item E4 of the [coverage assessment](IIPS-W04-IDENTITY-COVERAGE-REVISION-1-EVIDENCE-ASSESSMENT-2026-11-13.md), section 10
**Repositories read:** IPD `ramkivs/iips-production-market-data` at this branch (`57c7f35`); IRR `ramkivs/iips-review-recovered` at `main` `08411bc`, read-only
**Type:** documentation and one read-only diagnostic. No runtime code, integration contract, registry, manifest or portfolio data was changed in either repository.

**E4 is NOT complete. It has not been executed.** The Principal approved it. It can run only on the Windows host, and this environment cannot reach the host. This record states the blocker, gives the exact command, and fixes in advance how the result will be read.

**W04 status is unchanged: PARTIALLY COMPLETE. Not accepted.** The cause distribution of the 63 holdings is still unknown.

| Requested | State |
|---|---|
| Inspect the E4 specification | Done (section 2) |
| Verify that the probe is strictly read-only | Done (section 5) |
| Establish the exact revision and the evidence inputs | Done (section 3) |
| Execute the host check | **Not done. Blocked** (section 1) |
| Prepare the bounded command for the Principal | Done (section 7) |
| Aggregate counts and digests | **Not obtained** |
| Cause distribution of the 63 | **Not obtained.** Rules fixed in section 6 |
| Independent verification against the revision | **Not obtained.** Method fixed in section 4.2 and built into the probe |

## 1. The blocker

- The two inputs exist only on the Windows host: the exact capture file under `%LOCALAPPDATA%\IIPS\w11-dep1-capture\`, and the IRR data directory that the launcher sets (`<runtime root>\iips-data`).
- This environment is a Linux sandbox with outbound access to GitHub and two package registries. It has no route to the host and no copy of either input.
- Running the probe here on repository files or on invented data would not be E4. That was not done. The synthetic data of the probe's self-test is a test of the tool and is reported as nothing else.

## 2. The E4 specification

From the coverage assessment, section 10, and the C4/C5 assessment, section 9, step 1:

- Find, in the IRR broker-import evidence journal, the record whose `contentDigest` equals the `contentDigest` of the contribution in the capture. Accept on exact digest equality only, never on a timestamp or a file name.
- Publish: record found, yes or no; rows in the record; rows with an ISIN; rows with an explicit absence of ISIN; rows with an exchange; whether the row count equals 64.
- Additions of C4/C5: the record's `broker` and `variant`; holdings per source broker in the capture; digest equality, yes or no, with each tracked candidate file.
- If no record matches, nothing is substituted.
- Publish no symbol, ISIN or value.

The probe implements all of it. It also implements one step that the E4 text does not contain (section 4.2). **That step is an addition and is the Principal's to accept or refuse.** It reads no input beyond the capture that E4 already reads.

## 3. The revision and the inputs

| Item | Value | Source |
|---|---|---|
| Portfolio | `DHAN_PORTFOLIO` | Operator-reported capture of 2026-11-13 ([disposition record](IIPS-W11-DEP1-CAPTURE-EVIDENCE-DISPOSITION-2026-11-13.md)) |
| Revision | 1, with one history entry | Same |
| Holdings | 64: `securityIdentity` object on 1, `null` on 63 | Same |
| Exact capture, SHA-256 | `c5dd51f51025e3e17e3b798164c6b8078fa5487392d8f0dfd96be9bb7c79eda3` | Same |
| Capture schema | `iips.w11-dep1.owner-bound-portfolio-capture.exact/v1` | IRR `ownerBoundPortfolioCapture.ts` |
| Match key | `reads[operation = portfolio.get].wireResult.importEvidence[].contentDigest` | IPD `src/ipc/dispatch.ts`, `personalDetail` |
| Evidence journal | `journal.ndjson` in the IRR data directory; first line `{"journalFormatVersion":1}` | IRR `persistence-service.ts`, `brokerImportEvidenceStore.ts` |

Verified from source for this task:

- The IPD build observed at capture time (`1fded9d`) already returns `importEvidence` from `portfolio.get`. The capture stores the wire result verbatim, not an adapted copy. The match key is therefore in the capture.
- `contentDigest` is the SHA-256 of the UTF-8 encoding of the text the browser decoded from the file (IPD `broker-import-ingress.ts`, `computeSha256`). The preview, the retained evidence and the commit payload come from one ingress result and share that digest.
- `RevisionEntry.contentDigest` is the digest of the stored revision. It is not the digest of the file and is never the match key.
- The journal holds one record per selection of a file. The same file selected twice gives two records with one content digest. The probe reports every match and marks the one whose read instant equals the committed import instant.
- The evidence rows are the native parsed rows of the file. The stored holdings are those rows after exclusion and aggregation. The row count of a record need not equal 64, and the probe reports both the row count and the number of aggregation keys.
- IRR at `08411bc` retains evidence when a file parses (`BrokerHoldingsPreview.tsx`, `select()`). The IRR operator runbook, section 10.2, says that nothing in the live import path writes evidence. The two disagree, and only the host can settle it. **The probe reports an absent journal or zero matching records as a finding, not as an error.**
- An owner reset removes active evidence and keeps a recovery copy beside the journal (`broker-evidence-reset`). The probe reports how many such entries exist. It does not open them.

## 4. What the probe does

File: [`w04-e4-identifier-supply-probe.mjs`](../../evidence/integration/w04-e4-identifier-supply-diagnosis-2026-11-14/w04-e4-identifier-supply-probe.mjs), SHA-256 `60e39f98246ab9278235397f029d5f9517f73d92555f57507dbb729cd17d47ef`.

### 4.1 E4 as specified: the retained record

1. Selects the capture by its SHA-256. A file with another digest stops the probe with `RESULT: INCONCLUSIVE`.
2. Checks the schema, the outcome, the portfolio, the revision, the 64 holdings and the 63 and 1 identity counts against the recorded facts, and that both `portfolio.get` reads in the capture are identical.
3. Reads the journal, counts its records by broker, variant, status and slot, and selects the records whose `contentDigest` equals the match key.
4. For each match: recomputes `recordDigest` and `importId` as IRR computes them and reports equality; reports `broker`, `variant`, `status`, the record's own counts, and the row counts of the E4 list, with the cross-tabulation of ISIN and exchange. A record that fails its own digest is reported and its rows are not used.
5. Reports digest equality of the match key with each tracked candidate file, for the committed LF text and for the same text with CRLF.

### 4.2 Addition: the stored lineage digests

This is a finding of the preparation. It refines R15 and R16 of the coverage assessment and B5 of the C4/C5 assessment, which say that the inputs of an unqualified holding cannot be recovered from revision 1. The inputs are not stored. **Two digests that commit to them are stored**, and both are in the capture.

- Each holding carries `lineageDigest`. The import pipeline computes it as the SHA-256 of the JSON text of the holding's symbol, company, ISIN if present, exchange if present, quantity, prices, value, weight, active flag, source broker, identity status and resolution disposition, followed by `UNCLASSIFIED`, the import instant and `v1.0.0-bi03` (IPD `broker-holdings-mapper.ts`; `computeLineageHash` in `src/contracts/provenance.ts`). IRR sends it with the commit (`prepareBrokerImport`), and IPD stores it unchanged.
- Every member except the ISIN and the exchange is in the capture. The import instant is the `importedAt` of the contribution.
- The probe recomputes the digest under each hypothesis and keeps the one that reproduces the stored value. Three hypotheses have no ISIN: no exchange, `NSE`, `BSE`. They need no identifier at all.
- A hypothesis with an ISIN is tested with two kinds of candidate only: the ISIN in the holding's own stored D114 identity, and the ISINs retained in the matched evidence record of the same import. **No identifier is taken from any other source. None is inferred, written or printed.**
- The import as a whole carries a second digest, over the portfolio id, the file name, the broker, the import instant, the content digest, and each holding's symbol, ISIN, exchange, measures and lineage digest (IPD `computeBrokerImportProvenance`). It is stored as the provenance digest of the revision. When every holding is determined, the probe recomputes it. **Equality proves the whole reconstruction against the stored revision.** This is the independent verification.

Consequences:

- Holdings committed without an ISIN are identified from the capture alone, with or without a journal.
- Holdings committed with an ISIN need the matched record, or their own stored identity, for a proof. Without either they are reported as undetermined, not as "ISIN present".
- A holding whose stored values differ from the committed ones reproduces under no hypothesis and is reported as undetermined. The method cannot produce a false assignment other than by a SHA-256 collision.

### 4.3 Supplementary: the tracked registry manifest

With `--ipd-root`, the probe reads the tracked `evidence/dhan-p7/qualification-manifest.json`, checks its SHA-256 against `13bd2ef1…78bc`, and counts, for the holdings committed with an ISIN and an exchange, whether that ISIN and segment pair is among the manifest's registry entries. It is reported as information. It is not a cause on its own, because the probe does not establish which file the running process had loaded when the import was committed.

## 5. Read-only verification

| Property | Evidence |
|---|---|
| No write to any file | The probe imports `node:crypto`, `node:fs`, `node:path`. Its file-system calls are `openSync(file, 'r')`, `readFileSync`, `closeSync`, `existsSync`, `statSync`, `readdirSync`. No write, append, rename, delete or directory-creation call exists in the file. |
| Enforced, not only read | Run under Node's permission model with read permission only, the probe completes with the same result. Under the same flag a write is refused with `ERR_ACCESS_DENIED`. The host command in section 7 can use the same flag. |
| Inputs unchanged | The self-test compares the SHA-256 of the capture and of the journal before and after every run. |
| No network, no process | No network module and no child-process module is imported. The probe does not contact IPD, IRR or any other host. |
| No portfolio store access | The probe opens the capture file, the journal, and optionally the manifest. It does not open the SQLite database. |
| Safe beside a running IRR | The journal is opened for reading with shared access. A final line that is still being appended is counted and skipped. IRR's own loader would rewrite the journal in that case; the probe does not use it. |
| Sanitized output | Counts, digests, yes/no and closed-vocabulary values. A value outside its vocabulary is printed as `OTHER`. An error is reduced to a code and the step name, because an error message can contain a path. The self-test asserts that no synthetic identifier, measure, file name or path appears in any output. |

The probe was tested on synthetic data built with the unmodified IPD pipeline and store, and cross-checked against a journal written by the unmodified IRR code. Details are in the [evidence folder](../../evidence/integration/w04-e4-identifier-supply-diagnosis-2026-11-14/README.md). **It has not been run on Windows and has not been run on the actual capture or journal.**

## 6. How the 63 will be classified

The classes are fixed here, before any result exists.

| Class | Evidence required | Standing | What it means |
|---|---|---|---|
| **A** No ISIN in the committed input | The stored lineage digest is reproduced with no ISIN | **Confirmed cause** | The holding was committed without an ISIN. `mapBrokerImportHoldings` cannot form a D114 identity without one, in either of its branches. This is break B2 of the C4/C5 assessment. The probe splits A by exchange present or absent. |
| **B** ISIN without an exchange | Reproduced with an ISIN and no exchange | **Confirmed cause** | Qualification is entered only with an ISIN and an exchange. The other branch needs a series, and the IRR commit sends none. Not expected: the company gate refuses a row without an exchange (B1). |
| **C** ISIN and exchange, no identity | Reproduced with an ISIN and an exchange | **Input confirmed. Reason unknown** | The identifiers were supplied and no identity was stored. The typed reason was not kept (R15). The candidates are the reasons of `qualifyHoldingSecurityIdentity` other than a missing ISIN, of which `MISSING_P7_MAPPING` is break B3, or a process that held no master or registry at that moment. |
| **D** Undetermined | No hypothesis reproduces the digest | **Unknown** | Nothing is claimed. |

Two facts narrow class C without settling it. Both are reported and neither is called a cause:

- If a holding of the same single-import revision received an identity from an ISIN and an exchange, the qualification path was active in that import. This assumes the committing client sent no series, as IRR's does.
- Section 4.3 gives the number of class C holdings whose ISIN and segment pair is absent from the tracked manifest.

Rules that hold in every case:

- A + B + C + D equals the number of `null` identities in the capture. The probe checks the sum.
- A count is an aggregate over the revision. No holding is named, and no holding receives an identity.
- The row counts of section 4.1 describe the file. The classes of this section describe the stored holdings. They are reported separately and are not added together.

## 7. The command for the Principal

Run in Windows PowerShell on the host. Nothing here touches either checkout. The download fetches one file at a pinned commit into a new folder outside every repository. IPD and IRR may be running or stopped.

```powershell
# 1. A folder outside every repository and outside the IIPS data directories
$work  = Join-Path $env:LOCALAPPDATA 'IIPS\w04-e4'
New-Item -ItemType Directory -Force -Path $work | Out-Null
$probe = Join-Path $work 'w04-e4-identifier-supply-probe.mjs'

# 2. Fetch the probe at the pinned commit (one file; no checkout is read or changed)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -UseBasicParsing -OutFile $probe -Uri 'https://raw.githubusercontent.com/ramkivs/iips-production-market-data/5056f0c99693a2284b869a4b5f1c161ebb82c911/evidence/integration/w04-e4-identifier-supply-diagnosis-2026-11-14/w04-e4-identifier-supply-probe.mjs'

# 3. Confirm it is the reviewed file. This must print:
#    60e39f98246ab9278235397f029d5f9517f73d92555f57507dbb729cd17d47ef
(Get-FileHash -Algorithm SHA256 -LiteralPath $probe).Hash.ToLower()

# 4. Run it. Read-only.
$out  = & node $probe --data-dir 'H:\IIPS\runtime\iips-data'
$code = $LASTEXITCODE
$out
"exit code: $code"

# 5. Keep the sanitized output beside the probe
$out | Set-Content -LiteralPath (Join-Path $work 'w04-e4-output.txt') -Encoding UTF8
```

Stop at step 3 if the digest differs.

Notes on step 4:

- `--data-dir` is the IRR data directory. `H:\IIPS\runtime\iips-data` is the launcher default (`windows-setup\03-Start-IipsServers.ps1`: `<InstallRoot>\runtime\iips-data`). Give another value if the installation differs. The option may be repeated; if IRR was ever started without the launcher, add `--data-dir '<IRR checkout>\frontend\.iips-data'`.
- The capture is found by its digest under `%LOCALAPPDATA%\IIPS\w11-dep1-capture`. If it was moved, add `--capture '<file>'`.
- Optional, for section 4.3: add `--ipd-root '<IPD checkout>'`. The probe reads one tracked file there.
- Optional, to have Node itself refuse any write: `& node --experimental-permission --allow-fs-read=* $probe ...`. Newer Node versions name the flag `--permission`. If Node rejects the flag, leave it out; the probe is the same.
- The probe needs `node` on the path, as the capture utility did.

What to return: the text of `w04-e4-output.txt`, or at least the lines `E4_RESULT_JSON:`, `E4_RESULT_JSON_SHA256:`, `checks:` and `RESULT:`, with the digest printed at step 3 and the exit code. The output holds counts, digests and closed-vocabulary values. It is still the Principal's to read before sending.

| Exit code | Last line | Meaning |
|---|---|---|
| 0 | `RESULT: COMPLETE` | Every `null`-identity holding has an evidenced class and no check failed |
| 1 | `RESULT: PARTIAL` | The probe ran. Some holdings are undetermined, or a check failed. The classes that were determined stand. |
| 2 | `RESULT: INCONCLUSIVE` | An input was missing or was not the expected one. Nothing was classified. The line above names a code and a step. |

## 8. Acceptance checks for a returned result

A returned result is accepted as the E4 result only if all of these hold. They will be applied as written.

1. The digest printed at step 3 is the probe digest of section 4.
2. `capture.sha256.expected` passes and `captureIsRecordedCapture` is `true`: the capture is the one with SHA-256 `c5dd51f5…eda3`.
3. The recorded facts pass: `DHAN_PORTFOLIO`, revision 1, 64 holdings, 63 `null`, 1 object.
4. `cause.sum` passes: the four classes sum to 63.
5. The SHA-256 of the text after `E4_RESULT_JSON: ` equals `E4_RESULT_JSON_SHA256`. The text arrived unaltered.
6. No line begins with `[FAIL]`.
7. For `RESULT: COMPLETE`: `verify.holdings` reports 64 of 64 and `verify.import` reports equality, also with the provenance digest of the stored revision.

Reading the E4 line itself:

- `e4.recordFound: yes`, with `recordDigest` and `importId` recomputed as equal: the row counts of the record are the E4 counts.
- `e4.recordFound: no`: the E4 counts are unavailable and nothing is substituted. Class A may still be established, because it rests on the capture alone. The other holdings stay undetermined.
- More than one match: the records come from repeated selections of the same file. Their row counts are expected to agree, and a disagreement is reported as it stands.

## 9. Result

| Item | Value |
|---|---|
| Record found | Not obtained |
| Rows; with an ISIN; explicit absence; with an exchange; equal to 64 | Not obtained |
| Record `broker` and `variant`; holdings per source broker | Not obtained |
| Digest equality with a tracked candidate file | Not obtained |
| Class A, B, C, D of the 63 | Not obtained |
| Verification against the stored revision | Not obtained |

## 10. Boundaries kept

- No portfolio write and no revision change. The portfolio store was not opened in any environment.
- No identifier was inferred or manufactured, and none will be by the probe.
- The registry and its manifest were not regenerated or changed. **Registry re-qualification was not started.**
- No change to the Dhan integration, to the Broker Import implementation, or to any runtime code.
- No external contact. The draft request of the C4/C5 assessment, section 11, was not sent.
- No holding identifier, quantity or price is published here or printed by the probe.
- The local Windows checkout was not synchronized or modified. The command of section 7 does not read or change it.
- No W05 to W20 work. No pull request was merged.

## 11. Next

1. The Principal runs section 7 and returns the output.
2. The result is checked against section 8 and recorded in a short result record beside this one. Only then is E4 complete.
3. The decisions of the C4/C5 assessment, section 9, steps 2 to 7, remain with their authorities. This record changes none of them.
