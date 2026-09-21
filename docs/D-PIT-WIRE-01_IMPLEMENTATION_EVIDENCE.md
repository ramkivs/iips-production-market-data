# D-PIT-WIRE-01 — IMPLEMENTATION EVIDENCE

**Authority:** D-PIT-WIRE-01 = AUTHORIZED (all seven decision points, including §5).
**Governing scope:** `docs/PIT_TRANSPORT_WIRING_SCOPE_PREPARATION.md` @ `79d05d7`.
**Implementation checkpoints:** `a7044cc` (initial D114 port), `67f749c` (PIT wiring), `69812e1`
(initial evidence), plus the final hardening/evidence checkpoint containing this revision.
**Nature:** application integration, verified against bounded fixtures and executable repository
paths. **NOT Windows acceptance, NOT verification against the physical archives, NOT
certification.**

---

## 1. IMPLEMENTED SCOPE

| Authorized item | Result |
|---|---|
| PIT provider | `frontend/server/pit/pitVintageProvider.ts`: one authoritative frozen P08 `createPitStore()` instance; strict PS-9 query; bounded all-or-nothing loader; known-gap/bounded-date policy; PS-11/provenance/store failures refuse; `IN_MEMORY_ONLY`. |
| D114 admission bridge | `frontend/server/pit/d114AdmissionBridge.ts`: the only D114 D02 → P08/P01 translation point; AD-6 snapshot id; era window + physical trade-date enforcement; P01 ST-5/MD-3 boundary; archive/hash/handoff lineage carried verbatim. |
| Data-mode seam | Optional fourth PIT binding on `forMode`; SNAPSHOT and LIVE branch bodies preserved; no hook/no vintage/error ⇒ existing byte-identical `PIT_UNAVAILABLE`; mode remains server-derived. |
| Company transport | `frontend/server/pit/companyPitTransport.ts` is the executable request function used verbatim by `/api/company/:id` and by repository tests. It enforces absent/malformed/duplicate asOf → 400 under PIT and asOf under SNAPSHOT/LIVE → 400. |
| Client/UI | `PitVintageData` + `isPitVintage`; Company client forwards explicit URL `asOf` only; Company Intelligence discriminates before SNAPSHOT dereference; `PitVintagePanel` renders requested/resolved asOf, era, record and D114 provenance verbatim. UI12 remains mode authority. |
| D114 port | Frozen parser/adapter/contracts are byte-identical to `origin/d114-windows-evidence` @ `1d57d0b`; latest governed handoff/runner/reconciler and 24-test suite are byte-identical to `origin/d114-legacy-windows-evidence` @ `4a95cd9` (`9a6f4c1` handoff reconciliation). |
| D114 evidence | Both deposited evidence packages (`evidence/d114`, `evidence/d114-legacy`) are byte-identical to `origin/d114-legacy-windows-evidence`; physical mode validates both with `HistoricalEvidenceHandoff` before admitting anything. |
| Execution tooling | `frontend` now declares local `tsx` and `npm run dev:server`; no undeclared global runner is required for Windows acceptance. |

## 2. PHYSICAL D114 ADMISSION CONTRACT

A physical corpus uses `corpusKind: "D114_ARCHIVE"` and names two **separate** roots:

- `C:\IIPS_Data\NSE_Legacy_Acquisition\archives`
- `C:\IIPS_Data\NSE_CM_UDiFF_10Y\archives`

The loader never copies, moves, merges, writes, or mutates either root. For a bounded list of archive
filenames it performs, in order:

1. validate BOTH six-file deposits through the frozen D114 handoff;
2. require one archive from BOTH eras;
3. enforce `2016-09-20..2024-07-07 = LEGACY_BHAVCOPY` and
   `2024-07-08..2026-09-18 = CM_UDIFF`;
4. match `tradeDate` and filename to the governed SHA manifest;
5. SHA-256 the physical ZIP and require exact equality;
6. extract via the frozen D114 archive extractor;
7. normalize via the frozen dual-era adapter;
8. require every canonical record date to equal the evidence/manifest date;
9. admit through the bridge and frozen P08 store;
10. bind the provider only after the whole bounded corpus succeeds.

Every physical vintage carries `archiveRef`, archive SHA-256, verbatim SHA-manifest entry,
acquisition-manifest id, handoff lineage digest, intake directory, failure-register reference,
corpus id, provider/dataVersion, era and PIT boundary.

## 3. FAIL-CLOSED / PS-9 INTERACTION

PS-9 remains unchanged: within an admitted day, the resolved vintage is the latest snapshot whose
`asOf <= requestedAsOf`; both instants are disclosed. The transport adds the governed D114/bounded
availability boundary **before** PS-9:

- registered HTTP_404/failure date → `PIT_UNAVAILABLE`;
- evidence-classified holiday/weekend → `PIT_UNAVAILABLE`;
- date not loaded in the bounded boot corpus → `PIT_UNAVAILABLE`;
- pre-2016-09-20 / post-2026-09-18 → `PIT_UNAVAILABLE`;
- unbound/empty provider, unknown series, no vintage ≤ instant, PS-E9/PS-11 ambiguity, evidence or
  provenance failure, bridge/store error → `PIT_UNAVAILABLE`.

There is no interpolation and no cross-gap nearest-vintage substitution. SNAPSHOT, LIVE and the
frozen replay baseline are never substituted.

## 4. EXACT TEST RESULTS

| Floor / evidence | Result |
|---|---:|
| Full frontend Vitest | **1096 passed / 0 failed / 32 skipped** (1128 total; baseline 1033 + 63 added) |
| T1 seam PIT extension | **15 / 0** |
| Existing D89 data-mode regression (incl. 7 SNAPSHOT identity pins, LIVE, Macro) | **38 / 0**, unchanged tests |
| T2 provider + physical handoff/archive mode | **9 / 0** |
| T3 admission bridge | **16 / 0** |
| Exact Company request path/wiring | **15 / 0** — includes `PIT + asOf=2024-07-05T15:30:00.000Z` → governed `LEGACY_BHAVCOPY`, resolved `2024-07-05T09:15:00.000Z` |
| Client PIT discriminant/panel/Company URL consumer | **8 / 0** |
| Latest governed D114 suite | **24 / 0** |
| P12 | **154 / 0** |
| P13 | **86 / 0** |
| App TypeScript + server TypeScript | **clean / clean** |
| Runtime startup smoke (`npm run dev:server`) | **PASS** — listened on `:8787`; sandbox had no IdP configured, so no authenticated Windows claim is made |
| Frozen-source verification | **PASS** — parser/adapter, governed handoff modules/tests and both evidence packages match their source-branch blobs exactly |

The repository-side executable path demonstrates both eras, strict `<=`, provenance, SHA/handoff
lineage, known gap/weekend/holiday/out-of-corpus/pre/post fail-closed behavior, malformed/duplicate
request refusal, unbound behavior, SNAPSHOT identity and LIVE preservation. Fixtures and injected
test ZIP bytes are test-only and **do not constitute 10Y NSE application verification**.

## 5. T4 — PRE-EXISTING P08 GUARD DISPOSITION

The frozen P08 suite remains **87 passed / 3 failed (90 total)**. The exact unchanged failures are:

1. `p08/tests/adjustedSeriesProjection.test.js:327` — “no P09–P17 leakage, no acceptance artifact, no certification change”;
2. `p08/tests/corporateActionIngestion.test.js:317` — “no P09–P17 leakage and no P08 acceptance artifact”;
3. `p08/tests/pitStorageModel.test.js:203` — “no P09–P17 implementation is introduced by P08-01”.

Exact cause: these historical P08 work-item guards assert that every tracked `p09/`–`p17/` path is
absent. The D89 baseline `da43051` already carries accepted P09–P14 packages (P09 formal acceptance
commit `e77d128` among them), so the guards fail before this act and after it. **All P08 PIT-semantic
tests pass.** The operator's D-PIT-WIRE-01 §9 instruction expressly requires preservation and
truthful recording rather than modification: all three tests are byte-unchanged; no P08 or P09
source was changed. Their future scope-guard reconciliation remains program-owned outside this act.

## 6. PRESERVATION / PRODUCTION BOUNDARY

- SNAPSHOT: unchanged; existing identity/JSON tests pass as written.
- LIVE: unchanged `LIVE_UNAVAILABLE`; R-2 untouched.
- Macro: unchanged LIVE-only exemption; D89 pins pass as written.
- Certified computations, ReplayService, replay baseline, byte-identity code, P08 semantics,
  D114 parser semantics, acquisition scripts and physical archives: no modifications.
- Persistence: not introduced; P08 stays `IN_MEMORY_ONLY`; loader cap defaults to 100,000 snapshots.
- D114 `NON_PRODUCTION_HOLD`, OI-HIST-01 OPEN, G-004 OPEN, `liveProvidersActive = 0` and
  production authorization NOT GRANTED remain unchanged.

---

# ONE EXACT WINDOWS ACCEPTANCE PROCEDURE (W1–W6)

This is the next phase. It has **not** been executed in Arena.

## Preconditions

1. Checkout the final governed branch on Windows and set `$Repo` below.
2. The two physical roots and the named boundary-adjacent archive files exist and are unchanged.
3. Existing local Keycloak is running/provisioned for realm `iips`, client `iips-spa`, user
   `analyst-a` / tenant-A. This is existing authentication infrastructure, not authorized by this act.
4. PowerShell 7+, Node 22+ and npm are available.

## W0 — build the bounded manifest (no archive copying)

```powershell
$ErrorActionPreference = 'Stop'
$Repo       = 'C:\path\to\iips-production-market-data'   # SET THIS
$LegacyRoot = 'C:\IIPS_Data\NSE_Legacy_Acquisition\archives'
$UdiffRoot  = 'C:\IIPS_Data\NSE_CM_UDiFF_10Y\archives'
$CorpusDir  = 'C:\IIPS_Data\IIPS_PIT_Bounded_Corpus'
$LegacyFile = 'cm05JUL2024bhav.csv.zip'
$UdiffFile  = 'BhavCopy_NSE_CM_0_0_0_20240708_F_0000.csv.zip'

@($Repo, $LegacyRoot, $UdiffRoot,
  "$LegacyRoot\$LegacyFile", "$UdiffRoot\$UdiffFile",
  "$Repo\evidence\d114-legacy", "$Repo\evidence\d114") |
  ForEach-Object { if (-not (Test-Path $_)) { throw "MISSING: $_" } }

New-Item -ItemType Directory -Force $CorpusDir | Out-Null
$Manifest = [ordered]@{
  corpusId    = 'windows-d114-bounded-two-era-2024-boundary'
  corpusKind  = 'D114_ARCHIVE'
  provider    = 'NSE_D114'
  dataVersion = 'd114-dualera-v1'
  archiveRoots = [ordered]@{
    LEGACY_BHAVCOPY = $LegacyRoot
    CM_UDIFF        = $UdiffRoot
  }
  evidenceIntakes = @(
    [ordered]@{ era = 'LEGACY_BHAVCOPY'; directory = "$Repo\evidence\d114-legacy" },
    [ordered]@{ era = 'CM_UDIFF';        directory = "$Repo\evidence\d114" }
  )
  entries = @(
    [ordered]@{ file = $LegacyFile; source = 'ZIP'; era = 'LEGACY_BHAVCOPY'; tradeDate = '2024-07-05' },
    [ordered]@{ file = $UdiffFile;  source = 'ZIP'; era = 'CM_UDIFF';        tradeDate = '2024-07-08' }
  )
}
$Manifest | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 "$CorpusDir\pit-corpus-manifest.json"
```

The corpus directory contains the manifest only. The ZIPs stay in their separate physical roots.

## W1 — install, start, authenticate, set UI12=PIT, trigger governed boot

PowerShell A (transport):

```powershell
cd "$Repo\frontend"
npm ci
npm run typecheck
npm run typecheck:server
$env:IIPS_PIT_CORPUS_DIR = $CorpusDir
$env:KEYCLOAK_URL = 'http://localhost:8080'
npm run dev:server
```

PowerShell B (token + UI12 preference):

```powershell
$KC = 'http://localhost:8080'
$Pw = if ($env:IIPS_TEST_PASSWORD) { $env:IIPS_TEST_PASSWORD } else { 'iips-test-pw-2026' }
$Token = (Invoke-RestMethod -Method Post `
  -Uri "$KC/realms/iips/protocol/openid-connect/token" `
  -ContentType 'application/x-www-form-urlencoded' `
  -Body @{ grant_type='password'; client_id='iips-spa'; username='analyst-a'; password=$Pw }).access_token
$Headers = @{ Authorization = "Bearer $Token" }
$Prefs = @{ preferences = @{
  theme='light'; density='comfortable'; showDegradedDetail=$true; defaultDataMode='PIT'
}} | ConvertTo-Json -Depth 4
Invoke-RestMethod -Method Put -Uri 'http://localhost:8787/api/settings' `
  -Headers $Headers -ContentType 'application/json' -Body $Prefs | Out-Null

function Get-Company([string]$AsOf) {
  $q = [uri]::EscapeDataString($AsOf)
  Invoke-RestMethod -Headers $Headers -Uri "http://localhost:8787/api/company/RELIANCE?asOf=$q"
}
$Legacy = Get-Company '2024-07-05T15:30:00.000Z' # first authorized request triggers lazy corpus boot
```

**W1 PASS:** transport log contains:

```text
[pit] corpus 'windows-d114-bounded-two-era-2024-boundary' loaded: <N> snapshots / 2 dates (D114_ARCHIVE; evidence=true; IN_MEMORY_ONLY)
```

Any handoff/hash/archive/schema error must instead keep PIT unavailable; that is a W1 FAIL, not a
reason to bypass validation.

## W2 — both eras + UI rendering

```powershell
$Udiff = Get-Company '2024-07-08T15:30:00.000Z'
if (-not $Legacy.dataAvailable -or $Legacy.vintage.era -ne 'LEGACY_BHAVCOPY') { throw 'W2 LEGACY FAIL' }
if (-not $Udiff.dataAvailable  -or $Udiff.vintage.era  -ne 'CM_UDIFF')        { throw 'W2 CM-UDIFF FAIL' }
if ([datetime]$Legacy.vintage.resolvedAsOf -gt [datetime]$Legacy.vintage.requestedAsOf) { throw 'W2 PS-9 LEGACY FAIL' }
if ([datetime]$Udiff.vintage.resolvedAsOf  -gt [datetime]$Udiff.vintage.requestedAsOf)  { throw 'W2 PS-9 UDIFF FAIL' }
foreach ($r in @($Legacy,$Udiff)) {
  if (-not $r.vintage.snapshotId -or -not $r.provenance.archiveRef -or
      -not $r.provenance.sha256 -or -not $r.provenance.sha256ManifestEntry -or
      -not $r.provenance.acquisitionManifestId -or -not $r.provenance.intakeLineageDigest) {
    throw 'W2 PROVENANCE FAIL'
  }
}
```

PowerShell C (UI):

```powershell
cd "$Repo\frontend"
npm run dev -- --host 0.0.0.0
```

Log in as `analyst-a`, then open each URL and capture a screenshot:

```text
http://localhost:5173/research/company/RELIANCE?asOf=2024-07-05T15%3A30%3A00.000Z
http://localhost:5173/research/company/RELIANCE?asOf=2024-07-08T15%3A30%3A00.000Z
```

**W2 PASS:** the PIT panel shows requested and resolved instants, correct era, historical D02
record, archive/hash, acquisition manifest and intake lineage verbatim in both cases.

## W3 — fail-closed matrix

```powershell
$Cases = @(
  '2023-04-07T15:30:00.000Z', # deposited legacy HTTP_404
  '2025-03-14T15:30:00.000Z', # deposited CM-UDiFF HTTP_404
  '2024-07-13T15:30:00.000Z', # weekend
  '2024-08-15T15:30:00.000Z', # holiday
  '2016-09-19T15:30:00.000Z', # pre-range
  '2026-09-19T15:30:00.000Z', # post-range
  '2024-07-09T15:30:00.000Z'  # valid source date but not loaded in this bounded corpus
)
foreach ($AsOf in $Cases) {
  $r = Get-Company $AsOf
  if ($r.dataAvailable -ne $false -or $r.state -ne 'PIT_UNAVAILABLE') { throw "W3 FAIL: $AsOf" }
}
try { Get-Company '2024-07-08' | Out-Null; throw 'W3 malformed-asOf unexpectedly accepted' }
catch { if ($_.Exception.Response.StatusCode.value__ -ne 400) { throw } }
```

**W3 PASS:** every case is unavailable/400 as specified; never SNAPSHOT/LIVE/replay data.

## W4 — SNAPSHOT byte-identity

```powershell
$Prefs = @{ preferences = @{
  theme='light'; density='comfortable'; showDegradedDetail=$true; defaultDataMode='SNAPSHOT'
}} | ConvertTo-Json -Depth 4
Invoke-RestMethod -Method Put -Uri 'http://localhost:8787/api/settings' `
  -Headers $Headers -ContentType 'application/json' -Body $Prefs | Out-Null
$SnapshotCompany = Invoke-RestMethod -Headers $Headers -Uri 'http://localhost:8787/api/company/Banking'
if ($SnapshotCompany.provenance.freshness -ne 'SNAPSHOT') { throw 'W4 FAIL' }
cd "$Repo\frontend"
npx vitest run server/data-mode/data-mode.test.ts
```

**W4 PASS:** 38/38, including all seven identity/JSON pins as written; company SNAPSHOT is the
certified payload, not a PIT wrapper.

## W5 — LIVE + Macro unchanged

```powershell
$Prefs = @{ preferences = @{
  theme='light'; density='comfortable'; showDegradedDetail=$true; defaultDataMode='LIVE'
}} | ConvertTo-Json -Depth 4
Invoke-RestMethod -Method Put -Uri 'http://localhost:8787/api/settings' `
  -Headers $Headers -ContentType 'application/json' -Body $Prefs | Out-Null
$Live = Invoke-RestMethod -Headers $Headers -Uri 'http://localhost:8787/api/company/RELIANCE'
if ($Live.state -ne 'LIVE_UNAVAILABLE' -or $Live.dataAvailable -ne $false) { throw 'W5 LIVE FAIL' }
cd "$Repo\frontend"
npx vitest run server/macro/macro-transport.test.ts server/data-mode/data-mode.test.ts
```

**W5 PASS:** LIVE remains unavailable under R-2; Macro tests remain green and assert LIVE/exempt.

## W6 — evidence deposit (verification, never certification)

```powershell
$Out = "$Repo\evidence\d-pit-wire-01-windows"
New-Item -ItemType Directory -Force $Out | Out-Null
$Legacy | ConvertTo-Json -Depth 30 | Set-Content "$Out\legacy-response.json"
$Udiff  | ConvertTo-Json -Depth 30 | Set-Content "$Out\cm-udiff-response.json"
Copy-Item "$CorpusDir\pit-corpus-manifest.json" "$Out\pit-corpus-manifest.json"
@{
  disposition='WINDOWS APPLICATION VERIFICATION — NOT CERTIFICATION'
  certification='NONE_GRANTED'
  productionAuthorization='NOT GRANTED'
  d114='NON_PRODUCTION_HOLD'
  oiHist01='OPEN'
  g004='OPEN'
  executedAt=(Get-Date).ToUniversalTime().ToString('o')
} | ConvertTo-Json | Set-Content "$Out\verification-disposition.json"
```

Add the two W2 screenshots and transport/test logs to `$Out`. W1–W6 all passing is the sole
criterion for `WINDOWS ACCEPTANCE = PASS`. Until that occurs, do not claim final historical NSE
application verification.
