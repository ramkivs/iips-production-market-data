# D-PIT-WIRE-01 — IMPLEMENTATION EVIDENCE

**Act:** D-PIT-WIRE-01 = AUTHORIZED (all seven decision points, including §5).
**Governing scope:** `docs/PIT_TRANSPORT_WIRING_SCOPE_PREPARATION.md` @ `79d05d7`.
**Implementation commits:** `a7044cc` (D114 governed port) · `67f749c` (PIT transport wiring) ·
this document's commit (evidence + Windows procedure).
**Nature:** application integration (fixture-verified). **NOT** Windows acceptance, **NOT**
application verification against the physical archives, **NOT** certification
(`NONE_GRANTED` unchanged).

---

## 1. WHAT WAS IMPLEMENTED (map to governed scope §1)

| Scope item | Artifact | Status |
|---|---|---|
| §1.1 `frontend/server/pit/pitVintageProvider.ts` | Consumer of the frozen P08 store (single `createPitStore()` instance; strict PS-9 retrieval; sha-attested bounded-corpus loader, atomic all-or-nothing; shared singleton UNBOUND unless `IIPS_PIT_CORPUS_DIR` loads cleanly) | IMPLEMENTED |
| §1.2 `frontend/server/pit/d114AdmissionBridge.ts` | Single translation point D114 dual-era canonical (D02 `OHLCVCandle`) → P08-admissible P01 snapshot (AD-6 `snapshotId`, domain `D02`, four-state quality, `pitBoundary` = record's own session end per P01 ST-5/MD-3, era/archiveRef/sha256/corpusId provenance) | IMPLEMENTED |
| §1.3 Seam PIT retrieval hook | `data-mode.ts` `forMode(..., pit?)` OPTIONAL 4th parameter; SNAPSHOT/LIVE branch bodies byte-identical; unbound PIT ⇒ pre-D-PIT behaviour exactly (degraded family byte-identical; the D89 `dependency` text is untouched and its pin passes AS WRITTEN). NEW `resolveModeForPrincipal` (extracted verbatim from `dispatchForPrincipal`, whose length pin ≤ 4 passes AS WRITTEN), `validateAsOfRequest`, `buildPitVintageResponse`, `AS_OF_PATTERN` | IMPLEMENTED |
| §1.4 `/api/company/:id` ONLY | Transport company block: server-side asOf parse/validate via the seam contract; PIT binding built only there (`buildCompanyPitBinding` → shared provider, domain `D02`, securityId = `:id`). ALL other mode-aware routes dispatch unchanged, WITHOUT a PIT binding; Macro block untouched | IMPLEMENTED |
| §1.5 Client contract/consumer | `api/dataMode.ts`: `PitVintageData` + `isPitVintage()` (mutually exclusive with `isDegraded()`). `api/company.ts`: `fetchCompanyPayload()` (uninterpreted). `CompanyIntelligence.tsx`: discriminates BEFORE any SNAPSHOT-shape dereference; renders `PitVintagePanel` (server values verbatim; requested AND resolved asOf both shown) | IMPLEMENTED |
| §1.6 D114 merge/port | `d114/` tree: dependency-closed VERBATIM port from `origin/d114-windows-evidence` @ `1d57d0b` (`cm_udiff_parser`, `legacy_bhavcopy_parser`, `unified_historical_adapter`, `historical_feasibility_runner`, `evidence_reconciler`, `evidence_handoff`, `index`; plus the contracts/normalization modules they import). Frozen suite runs 21/21 via the branch's governed compile-then-run path | IMPLEMENTED (commit `a7044cc`) |

**Preservation verification (scope §2):** the full frontend suite passes **1089 / 0 failed**
(baseline 1033 + 56 new) — including every D89 SNAPSHOT byte-identity pin (`toBe` identity,
all 7 certified computations), LIVE pins, Macro exemption pins, P12/P13 suites — with ZERO
modifications to those tests. `dispatchForPrincipal.length ≤ 4` pin passes untouched.

## 2. REQUEST/RESPONSE CONTRACTS AS BUILT (scope §3–§4)

- `GET /api/company/:id?asOf=YYYY-MM-DDTHH:MM:SS.sssZ`
  - asOf is DATA SELECTION, never a mode authority; mode stays server-derived (UI12).
  - PIT + absent/malformed (incl. calendar-invalid, e.g. month 13) asOf → **400**.
  - SNAPSHOT/LIVE + any asOf → **400** (never silently ignored).
  - Under PIT: resolved vintage (`resolvedAsOf <= requestedAsOf`, PS-9) → `dataAvailable: true`
    family; otherwise → the EXISTING `PIT_UNAVAILABLE` degraded response, byte-identical.
- **PS-9 gap semantics (truthful clarification):** a requested instant with no bar but with an
  EARLIER vintage in the series resolves BACKWARD to that vintage (the store's frozen PS-9
  rule; the response discloses both `requestedAsOf` and `resolvedAsOf`, so backward resolution
  is never hidden). Fail-closed (`PIT_UNAVAILABLE`) applies when NO vintage exists at or below
  the requested instant (pre-first-vintage instants, unknown series, unbound/empty store,
  store error). No interpolation, no cross-series substitution, no SNAPSHOT/LIVE/baseline
  fallback ever.

## 3. D114 DUAL-ERA ADMISSION AS BUILT (scope §5)

- Physical directories NOT merged; archive contents untouched (they remain on the Windows host).
- Format boundary preserved and ENFORCED per record: `LEGACY_BHAVCOPY` = 2016-09-20→2024-07-07;
  `CM_UDIFF` = 2024-07-08→2026-09-18 (governed windows from the deposited coverage summaries).
  A record dated outside its declared era window → whole-entry refusal (D114-E4); declared era
  ≠ content-detected format → refusal (D114-E3). Era ambiguity is refused, never resolved.
- Era + provenance (archiveRef, sha256, corpusId) ride on every stored snapshot and are
  disclosed in every PIT response.

## 4. PIT STORAGE AS BUILT (scope §6)

`IN_MEMORY_ONLY` — pinned by test (`PIT_CAPABILITY.storage === 'IN_MEMORY_ONLY'`,
`persistenceAuthorized === false`, `durableMediaAuthorized === false`, `networkAuthorized ===
false`, `credentialsAuthorized === false`, `p05RefusalModified === false`). No persistence,
no durability, no network, no credentials introduced. The verification corpus is bounded
(`maxRecords`, default 100,000; fixture corpus = 10 snapshots). D114 tree port carries its own
`.gitignore`; `dist/` build artifacts are not committed.

## 5. TEST RESULTS (scope §10–§11) — exact numbers

| Suite | Result |
|---|---|
| T1 seam extension (`data-mode-pit.test.ts`) + D89 regression (`data-mode.test.ts`) | 15 + 38 = **53 / 0 fail** |
| T2 PIT provider (`pitVintageProvider.test.ts`) | **7 / 0 fail** |
| T3 admission bridge (`d114AdmissionBridge.test.ts`) | **15 / 0 fail** |
| Transport wiring pins + composed request contract (`companyPitWiring.test.ts`) | **11 / 0 fail** |
| T-client discriminant + panel (`dataModePit.test.ts`, `PitVintagePanel.test.tsx`) | **7 / 0 fail** |
| **T5 frontend FULL suite** (baseline 1033 + 56 new) | **1089 passed / 0 failed** (32 skipped, unchanged) |
| D114 frozen parser suite (`d114/`, governed compile-then-run path) | **21 / 0 fail** |
| P12 | **154 / 0 fail** |
| P13 | **86 / 0 fail** |
| app `tsc --noEmit` + server `tsc --noEmit` | **clean / clean** |
| Fixture application-contract path (§11): Legacy + CM-UDiFF + asOf≤ resolution + provenance + era + fail-closed | **PROVEN** (server/pit + wiring suites; does NOT constitute actual NSE application acceptance) |

## 6. T4 — PRE-EXISTING P09 GUARD FAILURES: EXACT DISPOSITION (scope §9)

**Reproduced (not introduced by this act):** `p08` suite = **87 pass / 3 fail**, identical
before and after the implementation commits:

1. `p08/tests/pitStorageModel.test.js:203` — *"no P09–P17 implementation is introduced by P08-01"*
2. `p08/tests/adjustedSeriesProjection.test.js:327` — *"no P09–P17 leakage, no acceptance artifact, no certification change"*
3. `p08/tests/corporateActionIngestion.test.js:317` — *"no P09–P17 leakage and no P08 acceptance artifact"*

**Exact cause:** each guard asserts `git ls-files` under `p09/`–`p17/` is EMPTY — correct when
P08-01 was the active work item, but factually outdated on this application branch, which
legitimately carries the **formally accepted P09 gate** (`iips-p09-fundamentals-gate`:
`p09/src/fundamentalsModel.js`, `fundamentalsPitModel.js`, `publicationEffectiveTime.js`,
`fundamentalsLineage.js` + tests; commit `e77d128` *"P09 FORMAL ACCEPTANCE: ACCEPTED by A3
(Sai, P09 gate only)"*). The content existed at the D89 baseline `da43051` itself — the guards
fail identically on the unmodified baseline and on the scope-preparation commit `79d05d7`.

**Ownership:** OUTSIDE D-PIT-WIRE-01. This is a P08 scope-guard vs accepted-P09-baseline
reconciliation that belongs to program authority (the guards are frozen P08 test content; the
authorization for this act explicitly forbids modifying P08 semantics/tests or unrelated P09
behaviour). **The tests are preserved verbatim; nothing was deleted, weakened, or modified;
P09 behaviour was not touched.** The truthful p08 floor until that reconciliation act is:
**87 pass / 3 fail — 0 PIT-semantics failures** (every PS-* test passes).

## 7. BOUNDARIES RESTATED (scope §13)

NSE LIVE production activation NOT authorized · A4@P16 NOT authorized · R-2 untouched ·
no commercial entitlement, no production credentials · OI-HIST-01 OPEN · G-004 OPEN ·
D114 NON_PRODUCTION_HOLD preserved · production authorization NOT GRANTED ·
`liveProvidersActive = 0`. PIT transport wiring is application integration only.

---

## 8. WINDOWS ACCEPTANCE PROCEDURE (scope §12 — executable AFTER this phase)

**Precondition:** the implementation branch is checked out on the Windows host and the two
physical corpora exist: `C:\IIPS_Data\NSE_Legacy_Acquisition\archives` (2016-09-20→2024-07-07)
and `C:\IIPS_Data\NSE_CM_UDiFF_10Y\archives` (2024-07-08→2026-09-18).

**W0 — Corpus manifest generation (no archive modification).**
From PowerShell, build `pit-corpus-manifest.json` beside a staging directory of CSV
extractions (or point `file` entries at per-archive CSVs placed in the corpus dir):

```powershell
$dir = "C:\IIPS_Data\pit_corpus"          # staging dir (CSV files; zips stay untouched)
$manifest = [ordered]@{
  corpusId    = "windows-d114-dualera-10y"
  provider    = "NSE_D114"
  dataVersion = "d114-dualera-v1"
  entries     = @(
    [ordered]@{ file = "<legacy-extract>.csv"; era = "LEGACY_BHAVCOPY"
                sha256 = (Get-FileHash "$dir\<legacy-extract>.csv" -Algorithm SHA256).Hash.ToLower()
                archiveRef = "C:\IIPS_Data\NSE_Legacy_Acquisition\archives\<cmDDMMMYYYYbhav.csv.zip>" }
    [ordered]@{ file = "<udiff-extract>.csv"; era = "CM_UDIFF"
                sha256 = (Get-FileHash "$dir\<udiff-extract>.csv" -Algorithm SHA256).Hash.ToLower()
                archiveRef = "C:\IIPS_Data\NSE_CM_UDiFF_10Y\archives\<BhavCopy_NSE_CM_*.csv.zip>" }
  )
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content "$dir\pit-corpus-manifest.json"
```
Bound the corpus (a representative window per era is acceptable and keeps the store bounded);
the loader refuses corpora beyond 100,000 snapshots and refuses ANY sha/era mismatch.

**W1 — Corpus boot via D114 intake.**
`IIPS_PIT_CORPUS_DIR=C:\IIPS_Data\pit_corpus` then start the transport. PASS = boot log reads
`[pit] corpus 'windows-d114-dualera-10y' loaded: N snapshots (IN_MEMORY_ONLY)`; a corrupted
manifest/hash must instead log the fail-closed message and the app must serve PIT_UNAVAILABLE.

**W2 — PIT vintage render in BOTH eras.**
UI12 default data mode = PIT (Settings). Then:
`GET /api/company/RELIANCE?asOf=<legacy trading instant ≤ 2024-07-07T…>` → 200
`dataAvailable:true`, `era: LEGACY_BHAVCOPY`, `resolvedAsOf ≤ requestedAsOf`, provenance
archiveRef/sha256 present; `GET /api/company/RELIANCE?asOf=<CM-UDiFF instant ≥ 2024-07-08T…>`
→ `era: CM_UDIFF`. UI renders the vintage panel verbatim. PASS = both eras rendered with
requested/resolved asOf both visible.

**W3 — Fail-closed matrix.**
`asOf` before the corpus's first vintage (e.g. 2016-09-19), an unknown symbol (`/api/company/BANKING`),
and a malformed instant → `PIT_UNAVAILABLE` (or 400 for malformed/SNAPSHOT+asOf) with truthful
reason; UI shows the governed unavailable state; NO fallback, NO placeholder values. A
mid-range gap date resolves backward with `resolvedAsOf` disclosed (PS-9, by design).

**W4 — SNAPSHOT byte-identity regression.**
Same principal switches UI12 to SNAPSHOT: all 7 surfaces return the certified payloads
byte-identical to the pre-wiring baseline (`JSON.stringify` equality spot-check against a
pre-act capture; the D89 suite's byte-identity pins already cover this server-side).

**W5 — LIVE + Macro unchanged.** LIVE → `LIVE_UNAVAILABLE` citing R-2; `/api/macro` → LIVE
freshness, exempt from the seam. PASSED server-side already; re-observed on Windows.

**W6 — Evidence deposit.** Screenshots + request/response JSON + corpus manifest + boot log
deposited under `evidence/` per the D114 handoff pattern, marked **"Windows application
verification — NOT certification"**.

PASS criteria for the whole phase: W1–W6 all pass on the physical two-era corpus. Only that
execution — not this document — constitutes the 10Y NSE application verification.
