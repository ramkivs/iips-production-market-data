# W04-P7: the 64 original holdings against the published P7 manifest (2026-11-15)

**W04 status is unchanged: PARTIALLY COMPLETE. Not accepted.** This folder holds a read-only
verification utility and its command for the host. **The utility has not been run on the
original CSV.** Everything executed so far is synthetic and ran in the sandbox (section 6).
W04-P7 is not accepted until the Principal returns a successful host result.

## 1. Question

The gap diagnostic of 2026-11-15 qualified 64 of 64 holdings against a registry that the
unchanged generator produced **in memory**. The registry was then regenerated (4,680 mappings)
and published by PR #164 (merge `bcb45d7`). The open question is whether the 64 holdings are
exact members of the registry **as published**: the bytes the `main` ref serves, not a
regeneration.

## 2. Inputs of record

| Input | Value |
|---|---|
| Manifest address | `https://raw.githubusercontent.com/ramkivs/iips-production-market-data/main/evidence/dhan-p7/qualification-manifest.json` |
| Manifest SHA-256 | `69a918f78791114e8fb036ddfd2a2005facdddf785a7496bc28f541fd4964769` |
| Pipeline commit | `325266d684f857a377d55b147e7306e02c7a495a` |
| Qualified mappings | 4,680 |
| CSV import-content SHA-256 | `a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107` |
| Holdings | 64 |

These six values are constants of the utility. A run with any other value (options `--url`,
`--expected-csv-sha256`, `--expected-manifest-sha256`, `--expected-holdings`, which exist for
the tests) is reported as overridden and cannot end with the acceptance line.

## 3. What the utility does

`w04-p7-published-manifest-qualification.mjs` is one file. It uses `node:crypto`, `node:fs` and
the global `fetch`, and needs no checkout and no compiled code.

1. **CSV.** Opens the CSV read-only, computes the import-content SHA-256 and stops unless it
   equals the recorded digest. No request is made before that. Groups the rows as the mapper
   does and labels the holdings `H01`…`H64`.
2. **Published manifest.** One `GET` of the address above, into memory. The SHA-256 of the
   downloaded bytes is compared with the recorded digest **before any byte is parsed**; on a
   difference the run stops and the bytes are not parsed. Then: pipeline commit, and the three
   counts the manifest states.
3. **Published registry.** Loads every record whose disposition is `QUALIFIED` and that has a
   mapping, as the runtime loader does, and requires: 4,680 QUALIFIED records; 4,680 mappings
   loaded and none refused; `registryEntries` lists 4,680 distinct, well-formed entries; the
   listed entries and the loaded mappings are the same set; every QUALIFIED record agrees with
   its own mapping.
4. **Holding by holding.** For each holding: the published mapping for its ISIN on its
   exchange, the decision of the runtime qualification on it, and the comparison of the
   mapping, its record and its registry entry with the holding (section 4).
5. **Read-only confirmation.** Re-reads the CSV and requires the same bytes; reports whether
   the Node permission model denies writing.

It never regenerates a registry and has no fallback to an in-memory result.

### Where the rules come from

| Part of the utility | Source, copied with type annotations removed |
|---|---|
| CSV parsing, the mapper's grouping, the import-content digest, the `H` labels | `w04-p7-mapping-gap-diagnostic.mjs` (PORT block and `readCsv`) — the test PMQ-12 requires the same text |
| `PublishedRegistry` | `src/providers/dhan/dhan_instrument_map.ts`: `keyOf`, `seriesOf`, `register`, `listFor`, `checkActive`, `resolveSecurity` |
| Selection of records | `loadGovernedP7InstrumentRegistry` in `src/providers/dhan/dhan_local_daemon.ts` |
| `qualifyAgainstPublishedRegistry` | `qualifyHoldingSecurityIdentity` in `src/providers/dhan/dhan_security_identity_service.ts`: step 1 and steps 5 to 9 |
| D114 grammar | `src/contracts/types.ts`: `isD114SecurityId`, `buildD114SecurityIdentity` |

Steps 2 to 4 of `qualifyHoldingSecurityIdentity` ask the P04 master, which is compiled into
IPD and is not part of the published manifest. The utility takes the company from the
published registry instead (the mapping found for the ISIN on the exchange segment). The test
PMQ-02 runs the utility and the real function, with the governed P04 master and the real
loader, on all 4,680 published mappings and requires `MATCH` where the runtime says
`QUALIFIED`, with the same series; PMQ-03 does the same for holdings neither accepts.

Because the labels use the gap diagnostic's rule, a label names the same holding in both
outputs for the same CSV.

## 4. Output

One row per holding:

| Column | Meaning |
|---|---|
| `exchange` | NSE or BSE, as the import derives it from the CSV. |
| `verdict` | `MATCH`, `MISSING`, `AMBIGUOUS`, `MISMATCH` or `NOT_COMPARABLE`. |
| `reason` | `EXACT_PUBLISHED_MAPPING`, or a typed reason (below). |
| `publishedMappings` | Published mappings for the ISIN on the exchange. Exactly 1 is required. |
| `registryEntry` | The mapping's entry `company|segment|securityId` is listed in `registryEntries` exactly once. |
| `isin` | The holding's ISIN equals the ISIN of the mapping, of its security identifier, of the record and of the record's security identity. |
| `exchangeAgrees` | The holding's exchange equals the mapping's exchange, its segment, and the record's exchange. |
| `series` | The series of the security identifier, of the record and of the record's security identity are the same and form the D114 identity. |
| `company` | The mapping, its record and its registry entry carry one company, and every published mapping of the ISIN, on either exchange, carries that company. |
| `seriesCode` | The series (at most three characters). |
| `otherExchanges` | The other exchange, when the ISIN is also published there. Expected; not an exception. |
| `unexpected` | Further entries, records or duplicates for the ISIN on the exchange. Must be 0. |
| `holdingFp`, `mappingFp` | Keyed fingerprints (section 5). |

Reasons other than `EXACT_PUBLISHED_MAPPING`: `MISSING_P7_MAPPING`, `AMBIGUOUS_PROVIDER_MAPPING`,
`INACTIVE_OR_MISSING_LISTING`, `CONFLICTING_ISIN`, `MISSING_SERIES_EVIDENCE`,
`STALE_SOURCE_EVIDENCE` (the runtime's reasons); `ISIN_DISAGREES`, `EXCHANGE_DISAGREES`,
`SERIES_DISAGREES`, `COMPANY_DISAGREES`, `NOT_IN_REGISTRY_ENTRIES`, `UNEXPECTED_ENTRIES` (this
utility's comparison); `HOLDING_WITHOUT_ISIN`, `HOLDING_WITHOUT_EXCHANGE`, `INVALID_ISIN_SYNTAX`.

The output ends with nine conditions, each `yes`, `no` or `not evaluated`, the list of failed
conditions, and one `RESULT:` line.

| # | Condition |
|---|---|
| 1 | CSV import-content SHA-256 equals the recorded digest |
| 2 | Manifest SHA-256 equals the recorded digest, verified before parsing |
| 3 | Pipeline commit equals `325266d6…495a` |
| 4 | 4,680 qualified mappings: stated, QUALIFIED records, registry entries and loaded registry, all in agreement |
| 5 | All 64 holdings have an exact published entry |
| 6 | Every identity dimension agrees (ISIN, exchange, series, company) |
| 7 | Zero missing, ambiguous, mismatched or unexpected |
| 8 | Nothing mutated (no write call in the utility; CSV unchanged at the end) |
| 9 | The inputs are the recorded ones (no override) |

| Exit | `RESULT:` | Meaning |
|---|---|---|
| 0 | `ALL_64_MATCH_PUBLISHED_MANIFEST` | All nine conditions hold. |
| 1 | `NOT_ALL_MATCH` | The holdings were compared and a condition failed. The failed conditions and the rows say which. |
| 1 | `FAILED_PRECONDITION` | A digest or the structure of the manifest is wrong. `[STOP] <code>` and `[EVIDENCE]` lines give both digests. No holding was compared. |
| 2 | `INCONCLUSIVE` | Nothing could be decided: file not found or not readable, download failed, argument error. |
| 3 | `ALL_MATCH_NOT_RECORDED_INPUTS` | Everything matched, but an input was overridden. A tool check; never an acceptance result. |

[`sample-output-synthetic.txt`](sample-output-synthetic.txt) is the complete output of a run on
64 invented holdings (exit 3). It is a format example and says nothing about the original CSV.

## 5. Privacy

The output holds labels, counts, SHA-256 digests of whole files, the pipeline commit, the P04
batch name, yes/no answers, NSE/BSE, series codes, keyed fingerprints and values from closed
lists. It holds no symbol, ISIN, company identifier, security identifier, provider identifier,
file name, path, quantity, price or value, and no error message.

The fingerprints are HMAC-SHA-256 values, cut to 16 hexadecimal characters, under a key
derived from the whole content of the CSV. A plain hash of an ISIN could be reversed with a
public list of ISINs; these cannot be recomputed without the CSV. The same CSV and the same
manifest always give the same fingerprints. `holdingFp` covers the ISIN and the exchange;
`mappingFp` covers the eleven members of the published mapping and its registry entry.

## 6. Tests and checks (all synthetic, all in the sandbox)

`tests/w04_p7_published_manifest_qualification.test.ts` — 14 tests, about 20 s, part of
`npm test`. The holdings are invented from the tracked manifest; the manifest is served by a
loopback server inside the test; the utility runs as a child process.

| Test | Shows |
|---|---|
| PMQ-01 | 64 holdings (63 NSE, 1 BSE) are exact members: 64 `MATCH`, conditions 1–8 hold, and the acceptance line is not printed for overridden inputs |
| PMQ-02 | All 4,680 published mappings: utility `MATCH`, runtime `QUALIFIED`, same series |
| PMQ-03 | 43 negative holdings: neither accepts them |
| PMQ-04 | Missing mapping: a removed record; an unpublished holding |
| PMQ-05 | Mismatch in each dimension, 12 cases: series, company, exchange, ISIN, entry not listed, unexpected entry, inactive, no verification instant |
| PMQ-06 | Duplicate and ambiguous: second series, second company, the same record twice, a provider instrument used twice; a CSV row twice; one ISIN on two exchanges in the CSV |
| PMQ-07 | Manifest digest failure: stops before parsing, also for bytes that are not JSON |
| PMQ-08 | CSV digest failure: stops before any request |
| PMQ-09 | Wrong pipeline commit; wrong stated count; one mapping fewer |
| PMQ-10 | HTTP 404, refused connection, argument errors, a non-loopback `http` address: `INCONCLUSIVE` |
| PMQ-11 | No identifier, name, path or measure in the output; fingerprints deterministic and keyed |
| PMQ-12 | Two built-in imports, no write call, one `fetch`; the CSV functions equal the gap diagnostic's text; the recorded inputs equal the tracked manifest |
| PMQ-13 | Runs under `node --permission` with read access to the utility and the CSV only; refused without access to the CSV |
| PMQ-14 | With no override the run ends with `ALL_64_MATCH_PUBLISHED_MANIFEST` — shown with a copy of the utility in which only the recorded CSV digest is replaced, and the recorded address answered by the loopback server; the unchanged utility refuses the synthetic CSV |

Run once in the sandbox and not committed as tests:

- The existing gap diagnostic and this utility on the same 64 synthetic holdings: the same 64
  labels; exchange and series equal label by label; `QUALIFIED` there where `MATCH` here.
- The utility on Node 18.20.8, 20.20.2, 22.11.0, 22.22.3, 24.22.3 and 25.9.0 (Linux). The
  permission flag is `--permission` from 22.13, `--experimental-permission` on 20 and 22.11,
  absent on 18. Node 25 denies the network under the model unless `--allow-net` is given;
  earlier versions have no network flag.

**Not run:** Windows, PowerShell, the original CSV, the address on `raw.githubusercontent.com`
(outside the sandbox's reach; the same bytes were served from the tracked file, whose SHA-256
is the recorded one).

## 7. The command for the Principal

Windows PowerShell. **It has not been executed: the sandbox has no PowerShell.** Paste it as
one block; it is a single command. It ends without closing the window. The utility is pinned
to commit `59bf98b93130a140f915cd8a3cedb8a1321e2f9a` (the commit before this record) and to its
SHA-256.

```powershell
& {
  $ErrorActionPreference = 'Stop'
  $commit = '59bf98b93130a140f915cd8a3cedb8a1321e2f9a'
  $sha256 = '07a27e7287e921f46a40c1643437bd7d7853e08f765e78820e460abe7e0fffbc'
  $name   = 'w04-p7-published-manifest-qualification.mjs'
  $url    = "https://raw.githubusercontent.com/ramkivs/iips-production-market-data/$commit/evidence/integration/w04-p7-published-manifest-qualification-2026-11-15/$name"
  $csv    = Join-Path $env:USERPROFILE 'Desktop\dhan_holdings_withisinv1.1 - Copy.csv'
  $work   = Join-Path $env:LOCALAPPDATA 'IIPS\w04-p7-published-manifest'
  $tool   = Join-Path $work $name
  $temp   = $env:TEMP; $tmp = $env:TMP
  try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { 'STOPPED: node is not on the PATH. Nothing was run.'; return }
    if (-not (Test-Path -LiteralPath $csv -PathType Leaf)) { 'STOPPED: the CSV is not on the Desktop of this user under its recorded name. Nothing was run.'; return }
    New-Item -ItemType Directory -Force -Path $work | Out-Null
    $env:TEMP = $work; $env:TMP = $work
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $tool
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $tool).Hash.ToLower()
    "utility sha256: $actual"
    if ($actual -ne $sha256) { "STOPPED: the downloaded utility is not the reviewed file (expected $sha256). Nothing was run."; return }
    $model = @()
    & cmd /c 'node --permission -e 0 >nul 2>&1'
    if ($LASTEXITCODE -eq 0) { $model += '--permission' } else {
      & cmd /c 'node --experimental-permission -e 0 >nul 2>&1'
      if ($LASTEXITCODE -eq 0) { $model += '--experimental-permission' }
    }
    if ($model.Count -eq 0) { "STOPPED: Node $(& node --version) has no permission model (Node 20 or later is needed). Nothing was run."; return }
    & cmd /c "node $($model[0]) --allow-net -e 0 >nul 2>&1"
    if ($LASTEXITCODE -eq 0) { $model += '--allow-net' }
    "node $(& node --version); permission flags: $($model -join ' '); file read access: the utility and the CSV only"
    $flags = $model + "--allow-fs-read=$tool" + "--allow-fs-read=$csv"
    $out  = & node @flags $tool --csv $csv
    $code = $LASTEXITCODE
    $out
    "exit code: $code"
    if (-not (@($out) -match '^RESULT: ')) { 'NOTE: no RESULT line was printed. Node did not start the utility, or it did not finish. Return the text above.' }
    @($out) + "exit code: $code" | Set-Content -LiteralPath (Join-Path $work 'w04-p7-published-manifest-output.txt') -Encoding UTF8
  } finally {
    $env:TEMP = $temp; $env:TMP = $tmp
  }
}
```

What the block does, in order:

- Checks that `node` exists and that the CSV is on the Desktop of the current user under its
  recorded name. The CSV is not uploaded, copied or moved.
- Downloads **one file**, the utility, from the pinned commit into
  `%LOCALAPPDATA%\IIPS\w04-p7-published-manifest`, and runs nothing unless its SHA-256 is the
  one above.
- Finds the permission flags this Node has and runs the utility with read access to two files
  only: the utility and the CSV. Under the model Node refuses every write, every other read,
  child processes, workers and native add-ons.
- Prints the sanitized output and the exit code, and saves the same text beside the utility
  as `w04-p7-published-manifest-output.txt`.
- If Node refuses to start the utility under these flags, no `RESULT:` line appears and the
  block says so. That would be a finding about the flags on Windows, not about the holdings.

Network. Two requests: the download of the utility (PowerShell) and the `GET` of the manifest
(the utility), both to `raw.githubusercontent.com`. Node 25 and later deny the network under
the model, and the block then adds `--allow-net`. Node 24 and earlier have no network
permission to give or withhold; there the limit is the utility itself, which has one `fetch`
call, to the recorded address, and refuses a redirect.

Files. The block writes two files, both in `%LOCALAPPDATA%\IIPS\w04-p7-published-manifest`:
the utility and the saved output. `TEMP` and `TMP` point at that folder while the block runs
and are restored at its end. Nothing else on the host is written. No repository checkout is
read, fetched, pulled or changed.

What to return: the text of `w04-p7-published-manifest-output.txt`, or at least the lines from
`== Conditions` to the end, with the `utility sha256:` line. The output is sanitized; it is
still the Principal's to read before sending.

## 8. What a successful run establishes, and what it does not

A run that ends with `RESULT: ALL_64_MATCH_PUBLISHED_MANIFEST` and exit code 0 establishes, for
the bytes served by `main` at that moment: the CSV is the original one; the manifest is the
regenerated one, from pipeline commit `325266d`, with 4,680 qualified mappings; each of the 64
holdings has exactly one published mapping for its ISIN on its exchange, listed once in
`registryEntries`, consistent in ISIN, exchange, series and company, with nothing further
published for that ISIN on that exchange; and the runtime qualification, applied to the
published registry, qualifies each of them.

Limits:

- The CSV has no series and no company identifier. The `series` and `company` columns state
  agreement inside the manifest and with the D114 grammar, not with a value from the CSV.
- That the company of a published mapping is the company the P04 master gives for the ISIN,
  with an ACTIVE listing on the exchange, is not re-derived on the host. For the same manifest
  bytes it is covered by the repository tests P7-REG-02 and PMQ-02.
- `MATCH` is stricter than the runtime's `QUALIFIED`: the runtime does not compare the record
  fields or the entry list.
- It is not an identity assignment and not a repair. No holding, portfolio, revision, journal,
  registry or approval record is read or changed. What the server did at the time of the
  import is not shown by it.

## 9. Files

| File | Content |
|---|---|
| `w04-p7-published-manifest-qualification.mjs` | The utility. SHA-256 `07a27e7287e921f46a40c1643437bd7d7853e08f765e78820e460abe7e0fffbc`. |
| `sample-output-synthetic.txt` | Output of a run on 64 invented holdings. Format example only. |
| `README.md` | This record. |
| `tests/w04_p7_published_manifest_qualification.test.ts` | The 14 tests. |
