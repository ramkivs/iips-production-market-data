# D-PIT-WIRE-01 — Windows W0–W6 handoff

This package makes the single governed Windows acceptance procedure from
`docs/D-PIT-WIRE-01_IMPLEMENTATION_EVIDENCE.md` directly executable.

It does **not** claim that Windows acceptance has run. The Arena environment is Linux and does not
contain either physical D114 archive root. A `PASS` can be produced only by running these scripts
on the governed Windows host with both physical archives, both evidence deposits, local Keycloak,
and operator-confirmed UI screenshots.

## Fixed boundaries

- Branch: `arena/01a0c440-iips-production-market-data`
- Required implementation ancestor: `2a682ef6ec2b7eddd4c13563dc746b0d1d6ba557`
- PIT store: `IN_MEMORY_ONLY`
- Archives are read in place from two separate roots; no copy, move, merge, mutation, or persistence
  of PIT state is performed.
- No provider acquisition is run.
- No SNAPSHOT/LIVE/replay fallback is permitted.
- This is application verification, not certification or production activation.
- D114 remains `NON_PRODUCTION_HOLD`; OI-HIST-01 and G-004 remain `OPEN`.

## Package

- `prepare-corpus.ps1` — W0: verifies branch/prerequisites and creates a manifest-only bounded
  corpus descriptor for the 2024-07-05 legacy archive and 2024-07-08 CM-UDiFF archive.
- `verify-w0-w6.ps1` — W1–W6: installs/typechecks, starts the transport and UI, authenticates,
  verifies both eras, requires operator-confirmed UI screenshots, executes the fail-closed matrix,
  runs SNAPSHOT/LIVE/Macro regressions, writes evidence, and stops the processes it started.

## Preconditions

1. PowerShell 7+, Git, Node 22+, and npm are available.
2. The final governed branch is checked out and clean.
3. Local Keycloak is running at `http://localhost:8080` with:
   - realm `iips`;
   - client `iips-spa` with direct access grant and browser redirect configured;
   - user `analyst-a` in tenant-A with the governed analyst role.
4. Set `IIPS_TEST_PASSWORD` in the current PowerShell process if the local test password is not
   `iips-test-pw-2026`. The script uses it in memory and never writes it or the bearer token.
5. These files exist unchanged:
   - `C:\IIPS_Data\NSE_Legacy_Acquisition\archives\cm05JUL2024bhav.csv.zip`
   - `C:\IIPS_Data\NSE_CM_UDiFF_10Y\archives\BhavCopy_NSE_CM_0_0_0_20240708_F_0000.csv.zip`

## Execute

From PowerShell 7:

```powershell
$ErrorActionPreference = 'Stop'
$Repo = 'C:\path\to\iips-production-market-data' # SET THIS
cd $Repo

git switch arena/01a0c440-iips-production-market-data
git pull --ff-only origin arena/01a0c440-iips-production-market-data
git status --short

pwsh -NoProfile -File .\scripts\windows\d-pit-wire-01\prepare-corpus.ps1 -Repo $Repo
pwsh -NoProfile -File .\scripts\windows\d-pit-wire-01\verify-w0-w6.ps1 -Repo $Repo
```

`prepare-corpus.ps1` refuses a dirty/wrong checkout, missing archive/evidence input, an unexpected
file in the bounded corpus directory, or a checkout that does not contain the required
implementation commit.

`verify-w0-w6.ps1` starts the transport on `8787` and Vite UI on `5173`. Stop any process already
using those ports before execution. During W2 it pauses and prints the two Company URLs. Log in as
`analyst-a`, verify the complete PIT panel, save screenshots at the exact paths printed by the
script, then type `W2-PASS`. The script will not record a pass without both files and explicit
operator confirmation.

## Required exact legacy result

The authenticated request made by W2 is equivalent to:

```text
GET /api/company/RELIANCE?asOf=2024-07-05T15%3A30%3A00.000Z
UI12 server-derived mode: PIT
```

Required response facts:

```text
HTTP 200
dataMode       = PIT
dataAvailable  = true
era             = LEGACY_BHAVCOPY
requestedAsOf  = 2024-07-05T15:30:00.000Z
resolvedAsOf   = 2024-07-05T09:15:00.000Z
record.symbol  = RELIANCE
```

The response must also contain `snapshotId`, archive reference and SHA-256, the verbatim SHA
manifest entry, acquisition manifest id, and intake-lineage digest. Any admission, hash, handoff,
provenance, gap, date-bound, or store failure must remain `PIT_UNAVAILABLE`.

## Evidence output

The scripts write only acceptance evidence and the manifest descriptor:

- external manifest: `C:\IIPS_Data\IIPS_PIT_Bounded_Corpus\pit-corpus-manifest.json`;
- repository evidence: `evidence\d-pit-wire-01-windows\`.

The physical ZIP files remain in their original roots. A successful W6 evidence directory contains:

- W0 handoff context and bounded manifest;
- transport/UI/typecheck/regression logs;
- both API responses;
- fail-closed matrix;
- `legacy-ui.png` and `cm-udiff-ui.png`;
- `verification-disposition.json` preserving `NONE_GRANTED`, `NOT GRANTED`,
  `NON_PRODUCTION_HOLD`, OI-HIST-01 `OPEN`, and G-004 `OPEN`.

If any phase fails, the script writes `verification-failure.json`, stops its child processes, and
returns a non-zero exit. Do not bypass the failure or manually relabel it as a pass.
