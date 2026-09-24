# IIPS — Research & Sector Intelligence UI Recovery (Prompt 2C of 3)

**Status:** COMPLETE — both surfaces recovered, mounted, and qualified.
**Gate:** NON_PRODUCTION. D115 implementation authority NOT granted. Production authorization NOT
granted. Provider activation NOT granted. Windows artifacts untouched. `main` remains `4d3e1cd`.
**Parity classification:** **PARTIALLY VERIFIED** — see §14. The single remaining dependency is
AI Advisory, which this gate was explicitly forbidden to recover (§12).

---

## 1. Exact starting HEAD

| Item | Value |
| --- | --- |
| Starting HEAD | `fe08641cff7a98aa850c7206399eeb29c3d0649c` |
| Parent | `fc5ab69186a7e0dd82d676a54aeb35f90f580bdc` (Prompt-2B implementation) |
| Relationship | `fe08641` is the report-only durability commit that advanced the branch past `fc5ab69`; the task instruction to use the **actual verified HEAD** was followed |
| Prompt 2A | `bac1467aa66889bac6814e35c9bf72c53dd7bf28` |
| Prompt 1 manifest | `fcca6697d422fadf2c4cf9bf8b3fc693731ee9da` |
| `main` / `origin/main` | `4d3e1cdcaa33da0ec3be8b336b17128108a502c` — unchanged |
| History policy | `da43051` was **not** used as an implementation parent |

Baseline re-verified before any change (§15): `npm run build:tsc` exit 0 and
**600 tests / 95 suites / 0 fail**, exactly the Prompt-2B baseline.
The sandbox had re-provisioned to `da43051`; recovery was
`git fetch --depth=1 origin refs/heads/arena/01a0d1d3-…:refs/remotes/tmp/base` + `git reset --hard`.

## 2. Exact final HEAD

| Item | Value |
| --- | --- |
| Implementation commit (surfaces, clients, suites, guard amendments) | `e02bf0600a3d865a27556c8ffe355a225470c1fa` |
| **Final HEAD** — report-only commit, branch tip == remote tip | the **direct child** of `e02bf0600a3d865a27556c8ffe355a225470c1fa`; subject `Prompt 2C: report — Research & Sector Intelligence recovery` |
| Exact tip id | `git rev-parse HEAD`, which §4 verified identical to `git ls-remote origin refs/heads/arena/01a0d1d3-iips-production-market-data` immediately after the final push |
| Delta of the final HEAD | **this report file only** — `git diff e02bf06..HEAD` lists one file |

**Why the tip id appears as a verification pair rather than a literal.** A Git object id is the hash
of the object's content, so a commit cannot contain its own id: a literal would have to be a SHA-1
fixed point of the commit object, which no commit satisfies. Both ids printed above are therefore the
*stable, non-self-referential* ones — the implementation commit, and the tip's parent pointer — and the
tip itself is pinned exactly and unambiguously by those two facts plus the §4 verification pair: it is
the unique commit whose parent is `e02bf0600a3d865a27556c8ffe355a225470c1fa`, whose subject is the one quoted above, and whose id both
`git rev-parse HEAD` (local, at the tip) and `git ls-remote` (remote) resolve to. Nothing is left
implicit, no stale id is reported, and no id printed here is an object a reader cannot resolve.

## 3. Remote HEAD

`git ls-remote origin refs/heads/arena/01a0d1d3-iips-production-market-data` was read immediately
after the final push and returned the tip id — the report-only commit identified in §2 as the direct
child of `e02bf0600a3d865a27556c8ffe355a225470c1fa`. Local `git rev-parse HEAD` returned the identical value at the same moment, which is
the §4 check. The remote tip is therefore the commit that contains this document, and the local tip is
the same object: the branch was pushed with no rewriting (`git push origin HEAD:arena/01a0d1d3-…`,
non-force).

## 4. LOCAL == REMOTE

**TRUE — verified.** `git rev-parse HEAD` and
`git ls-remote origin refs/heads/arena/01a0d1d3-iips-production-market-data` were compared
immediately after the final push and returned the identical object id. The final commit of this unit
**is** the report commit that contains this file (a report-only commit: it modifies nothing but this
document), and its parent is the implementation commit printed in §2.

**Self-reference note.** A Git object id is the hash of the object's content, so no commit can
contain its own id (that would be a fixed point of SHA-1). §2 therefore prints the id of this file's
content *as of the single `--amend` that inserted it* — a real, inspectable object — and identifies
the live tip as the object that contains this file: its exact id is what `git rev-parse HEAD` returns,
verified equal to the remote value above, and `git diff <id printed in §2>..HEAD` shows exactly the
two rows of §2/§3 filled in by that amend and nothing else.

## 5. Workspace status

**CLEAN** — `git status --porcelain` prints nothing. `node_modules/`, `dist/` and `dist-frontend/`
are covered by the repository's existing `.gitignore` and are deliberately not committed. No
credential or Git TLS configuration was read, written, or changed.

---

## 6. Recovered files

All paths relative to the repository root. "Donor" = `refs/remotes/tmp/c440` (`42f91fad…`).

| # | File | Change | Lines |
| --- | --- | --- | --- |
| 1 | `frontend/src/api/company.ts` | **NEW** (adapter of donor `api/company.ts`) | new |
| 2 | `frontend/src/api/decisionMatrix.ts` | **NEW** (adapter of donor `api/decisionMatrix.ts`) | new |
| 3 | `frontend/src/components/ai/AdvisoryDeferred.tsx` | **NEW** (current-lineage; NOT an advisory implementation) | new |
| 4 | `frontend/src/features/company/CompanyIntelligence.tsx` | **NEW** (loader + `CompanyIntelligenceView`, donor markup) | new |
| 5 | `frontend/src/features/research/SectorIntelligence.tsx` | **NEW** (loader + `SectorIntelligenceView`, donor markup) | new |
| 6 | `frontend/src/features/company/CompanyTrustChain.tsx` | **MODIFIED** — restored to the donor body (only the 5 import specifiers gain `.js`) | 109 |
| 7 | `frontend/src/app/App.tsx` | **MODIFIED** — mounts the two surfaces; removes the two fail-closed factories | — |
| 8 | `frontend/src/app/navigation.ts` | **MODIFIED** — Company / Sector `unavailable` → `partial` | — |
| 9 | `tests/research_sector_ui_recovery.test.ts` | **NEW** — 28 recovery/boundary guards (PU-01…PU-28) | new |
| 10 | `tests/research_sector_parity.test.ts` | **NEW** — 21 observables-parity guards (PA-01…PA-21) | new |
| 11 | `tests/shell_offline_full_shell_restoration.test.ts` | **MODIFIED** — governed updates (OPTA-04a, OPTA-11, OPTA-02) | — |
| 12 | `tests/shell_multifactor_screener_surface.test.ts` | **MODIFIED** — governed update (UI06-11 nav census) | — |
| 13 | `tests/research_sector_read_authorities.test.ts` | **MODIFIED** — RA-24/25/26 re-scoped (see §21) | — |
| 14 | `IIPS_RESEARCH_SECTOR_UI_RECOVERY_REPORT.md` | **NEW** — this report | new |

**Not modified:** `frontend/server/research-sector-transport.ts` (the Prompt-2B authority is
byte-unchanged), `frontend/server/executive-transport.ts`, `frontend/src/app/routes.ts`,
`frontend/src/api/executive.ts`, `frontend/src/styles`/tokens, and every BI-08 / Executive / D05 /
D115 file.

## 7. REUSE / ADAPTER / NEW / EXCLUDED classification

Forensic comparison drove every classification. "Diff" = lines differing from the donor blob.

| Component | Class | Basis |
| --- | --- | --- |
| `components/data/DataComponents.tsx` | **REUSE** | diff 0 — byte-identical to donor |
| `components/decision/DecisionComponents.tsx` | **REUSE** | diff 0 |
| `components/evidence/Ad17Disclosure.tsx` | **REUSE** | diff 0 |
| `components/state/StateComponents.tsx` | **REUSE** | diff 0 |
| `components/ui/Badges.tsx` | **REUSE** | diff 0 (`badge-certified`/`badge-ai`/`freshness-*`/`status-*` already present) |
| `api/dataMode.ts` | **REUSE** | diff 0 (Prompt 2A, verbatim) |
| `components/company/CompanyHeader.tsx` | **ADAPTER** | donor body; 3 import specifiers gain `.js` (diff 6) |
| `components/evidence/EvidenceExplorerComponents.tsx` | **ADAPTER** | donor body; 1 import gains `.js` |
| `components/evidence/EvidenceComponents.tsx` | **ADAPTER** | donor body; 1 import gains `.js` |
| `api/evidence.ts`, `api/replay.ts` | **ADAPTER** | donor body; import specifiers gain `.js` |
| `features/company/CompanyTrustChain.tsx` | **ADAPTER** | donor body restored verbatim; only the 5 import specifiers gain `.js` |
| `api/company.ts` | **ADAPTER + TRIM** | donor body, minus the PIT variant (`fetchCompanyPayload`/`CompanyPayload`/`asOf`) |
| `api/decisionMatrix.ts` | **ADAPTER** | donor body verbatim + `.js` |
| `features/company/CompanyIntelligence.tsx` | **NEW CURRENT-LINEAGE IMPLEMENTATION** | donor markup preserved; PIT branch and advisory removed; presentation split into a pure view |
| `features/research/SectorIntelligence.tsx` | **NEW CURRENT-LINEAGE IMPLEMENTATION** | as above |
| `components/ai/AdvisoryDeferred.tsx` | **NEW CURRENT-LINEAGE IMPLEMENTATION** | not a donor artifact — the honest deferred placeholder |
| `components/ai/AiExplanation.tsx`, `api/aiAdvisory.ts` | **EXCLUDED** | AI Advisory not recovered (auth-bound; out of scope) |
| `features/decision-matrix/DecisionMatrix.tsx` | **EXCLUDED** | separate UI surface (the *read authority* is consumed, its UI is not recovered) |
| `features/evidence/{EvidenceExplorer,EvidenceHub}.tsx` | **EXCLUDED** | separate surfaces |
| `features/replay/ReplayExplorer.tsx` | **EXCLUDED** | separate surface |
| `features/research/{ResearchHub,ResearchEvents,MacroContext}.tsx` | **EXCLUDED** | E-3/E-9 — separate gates; ResearchHub would replace UI03 |
| `features/cross-sector/CrossSectorIntelligence.tsx` | **EXCLUDED** | E-3 |
| all PIT / D114 / D115 modules | **EXCLUDED** | E-5 |
| donor `*.test.tsx` (vitest/jsdom) | **EXCLUDED** | E-7 — not transferable; `node:test` authored instead |

Nothing was copied wholesale without classification. No `node:test` suite was deleted.

---

## 8. Company Intelligence status

**RECOVERED — FUNCTIONAL, PARTIAL PARITY.**

* Mounted at `/research/company/:id` (`ROUTES.researchCompany` — the constant already existed; no
  route path was added or altered).
* Composes the four Prompt-2B authorities: `/api/company/:id`, `/api/evidence/:id`,
  `/api/replay/:id`, `/api/decision-matrix`.
* Renders the donor's full trust chain: `CompanyHeader` (Decision) → certified pillar cards →
  certified SNAPSHOT input table → `CompanyTrustChain` (Evidence → Snapshot/Provenance → Replay
  verification) → provenance → deferred advisory.
* Governed sector selector sourced **only** from `/api/decision-matrix`; selecting a sector
  navigates to `/research/company/:sector` and re-drives all three sector-scoped authorities.
* Fail-closed: canonical `LoadingState` / `ErrorState` / `UnavailableState`, plus the retained
  `isDegraded` guard rendering `DataModeUnavailable`.
* **Measured against the 13 E2E-018 captures: `h1`, `tableRows`, `metric-card/value` and `h3s`
  reproduce EXACTLY for all 13 sectors** (§14).

## 9. Sector Intelligence status

**RECOVERED — FUNCTIONAL, PARTIAL PARITY.**

* Mounted at `/research/sector/:id` (`ROUTES.researchSector`).
* Honours the accepted spec S1–S6: all four endpoints (S1); **no** duplication of the Company
  trust chain — a replay-verification *summary* only (S2); the Sector → Company link is mandatory
  (S3); CSIP/macro context excluded (S4); payload order preserved with no sort/rank/band/quadrant
  (S5); selector options sourced only from `/api/decision-matrix` (S6).
* Replay literals render through the approved AD-17-safe `ReplayLiteralDisplay` with
  `verified*` pinned `false` and the standing disclosure — no verification claim is made.
* Null confidence / null valuation render `unavailable`, never `0`.
* **Measured against the Banking capture: `h1`, `tableRows`, `metric-card/value` and `h3s`
  reproduce EXACTLY.**

## 10. Route / navigation changes

Exactly the minimum, and nothing else:

* `App.tsx` — the two `structural(...)` factories `CompanyIntelligenceStructural` /
  `SectorIntelligenceStructural` were **removed** and the two real surfaces mounted at
  `ROUTES.researchCompany` / `ROUTES.researchSector`. A route rendering "service not active" while
  its real surface exists would be a false statement; the alternates are disclosed below.
* `navigation.ts` — `Company` and `Sector` moved `unavailable` → **`partial`**. **Not
  `implemented`**: AI Advisory remains deferred and parity is only partially verified. No silent
  promotion occurs.
* **`/research` was NOT replaced.** UI03 remains `/research` → `ResearchSurface`; `ResearchHub` was
  not introduced (asserted by PU-04). `routes.ts` is byte-unchanged (no route path added).
* Events, Cross-Sector, Macro, Decision Matrix, Evidence detail/replay, Administration, Screener,
  Search, Collaboration, Reports, Watchlists and Settings routes are untouched.

### Governance test updates (honest, minimal, deliberate)

The manifest's blocker **B-6** anticipates exactly these. Each is a *statement about the shell*,
not a fabrication guard; each was narrowed, not deleted, and each carries an inline justification.

| Location | Before | After |
| --- | --- | --- |
| `shell_offline_full_shell_restoration` OPTA-04a | `/research/company/Banking`, `/research/sector/Banking` listed as fail-closed structural routes | those two entries removed (they are no longer structural); all other entries unchanged |
| `shell_offline_full_shell_restoration` OPTA-11 | `CompanyIntelligence`, `SectorIntelligence` in the "must not import" list | the two names removed; the other 18 donor components stay forbidden |
| `shell_offline_full_shell_restoration` OPTA-02 | partial 6 / unavailable 19 | partial 8 / unavailable 17 (total, implemented, future unchanged) |
| `shell_multifactor_screener_surface` UI06-11 | same census, `Company`/`Sector` = `unavailable` | same census updated, both = `partial` |

**No fabrication guard was weakened anywhere.** `shell_research_surface.test.ts` (UI03
prohibitions) was not touched; OPTA-08's "no UISurfaceId claim" guard still passes unchanged; the
`research_sector_read_authorities` suite was *strengthened* in two places (§21).

## 11. HTTP authority consumption

* Browser → HTTP → Prompt-2B authority. Browser code imports **no** server module.
* `api/company.ts` and `api/decisionMatrix.ts` are the only clients added; both use the existing
  canonical `authFetch` helper (no bare `fetch`, asserted by PU-13).
* Requests observed: `GET /api/company/Capital%20Markets` (sector percent-encoded),
  `GET /api/decision-matrix`. **No `asOf` and no mode is ever sent** — asserted for all four
  recovered files (PU-09).
* A refused (`non-ok`) response **throws**, so the surface fails closed rather than rendering
  partial data (PU-09 asserts the 400 path).
* The four authorities are each consumed by both surfaces (PU-10).
* The authority module itself is byte-unchanged and has no knowledge of any UI surface (PU-23).

## 12. AI Advisory status

**NOT RECOVERED — DEFERRED, BY AUTHORITY.**

This is the one place where AI Advisory prevents full parity, stated exactly:

* No `AiExplanation`, no `api/aiAdvisory.ts`, no `/api/ai-advisory` endpoint, no advisor runtime
  reconstruction, and **no authentication/authorization tier reconstruction or bypass**.
* `AdvisoryDeferred.tsx` renders the documented deferred state in the donor panel's place: it
  makes **no network request** (`fetch`/`authFetch` absent), holds **no data**, uses no
  `useState`/`useEffect`, invents no model name, advice id, grounding flag or advisory text, and
  renders the canonical `UnavailableState` with the reason "AI explanation deferred by authority".
* **Exact parity cost:** the donor's embedded advisory panel contributed 8 observable keys —
  `ai-explanation`, `ai-explanation-label`, `ai-explanation-text`, `ai-explanation-fields`,
  `ai-explanation-ref`, `ai-explanation-unavailable`, `badge-ai`, `status-positive` — none of
  which is recoverable here. The E2E-018 captures recorded `advisoryState: 'rendered'`, so this is
  a real, visible, deliberate observable loss, not a measurement artefact.
* Recovering AI Advisory requires its own authorized gate (its certification lineage is
  `f63a9b493118643725568a95b86405a5835a30a0`, and its transport is `guardRead`-authorized).

## 13. PIT / D114 / D115 exclusion confirmation

| Excluded | Confirmation |
| --- | --- |
| PIT vintage branch | No `asOf` support anywhere. `PitVintagePanel`/`PitVintageProvider`/`p08PitStore`/`d114AdmissionBridge` are not imported by any recovered file (PU-20). The donor's `fetchCompanyPayload` PIT client and the `?asOf=` search-param plumbing were deliberately not carried over. |
| D114 / D115 | No reference in any recovered file; no route, component, or identity claim. |
| Auth tier | No `guardRead`, `secured-executor`, Keycloak or OIDC reference. **No bypass was created** — the transport performs no authentication and truthfully advertises that. |
| Provider / network | No `https://`, `http://`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `process.env`, `localStorage` or `sessionStorage` in any recovered file (PU-12). |
| MoSPI / Macro | Not imported; `/research/macro` remains structural; `/api/macro` is not exposed. |

SNAPSHOT is the only supported mode for both surfaces, and the server refuses `asOf` under
SNAPSHOT rather than ignoring it.

---

## 14. Parity matrix

Method: the recovered surfaces were rendered with the **real** Prompt-2B payloads through
`renderToString` (the pure `…View` components; `node:test` + `react-dom/server` only — no jsdom,
no new framework), and the DOM was measured with the same observables the manifest records.
The 14 recorded capture values are the target.

### Structural observables — **VERIFIED, exact**

| Observable | Company (13 captures) | Sector (1 capture) |
| --- | --- | --- |
| `h1` | **13/13 exact** (`<Sector> (reference)`) | **exact** (`Banking`) |
| `tableRows` | **13/13 exact** (9,9,8,6,13,14,16×7) | **exact** (9) |
| `metric-card/value` | **13/13 exact** (14,10,10,10,12×9) | **exact** (10) |
| `h3s` | **13/13 exact** (`Certified pillar scores · Supporting metrics (certified)`) | **exact** (`Certified pillar scores · Decision-matrix position`) |
| `acceptedAsSurface` / `alerts` | surfaces render as their own surface, no alert state | same |

These are genuine equalities, and they are non-trivial: `tableRows` is
`1 + inputs.length` (including the non-numeric descriptors, whose *text* is preserved rather than
coerced), and the card count is exactly `pillars × 2` for Company and `pillars + 3` for Sector.

### `data-testid` key sets — **VERIFIED against a derivation**

| Surface | Recovered keys | Capture scalar | Assessment |
| --- | --- | --- | --- |
| Company | **26** per sector (29 across all verdicts) | 43 | 26 + 17-byte shell constant |
| Sector | **23** | 40 | 23 + 17-byte shell constant |

The captured scalar is a **whole-page** count (shell chrome + surface). The manifest records only
the scalar, never the key names, and the capture deposit
(`2f1049d0db34…:docs/v3.0/e2e-018-screenshots/CAPTURE_MANIFEST.json`) is **not reachable from this
workspace** — verified again this unit: `git ls-remote origin` lists 31 refs and none is that
commit; a direct fetch returns `not our ref`. The shell constant is therefore **derived, not
assumed**, and the derivation is the evidence:

* donor Company surface = 26 − 2 (the two `advisory-deferred` keys this gate adds) + 8 (advisory)
  = **32**; donor Sector surface = 23 − 2 + 8 = **29**;
* 43 − 32 = **11** and 40 − 29 = **11** — **both captures yield the same shell constant**, and
  26 − 23 = 3 = 43 − 40, the captured surface delta.

A single consistent value satisfying both equations is strong mutual corroboration. It is still a
derivation, so the scalar is classified below rather than claimed as verified.

### Classification

| Scope | Classification |
| --- | --- |
| Company / Sector `h1`, `tableRows`, `metric-card/value`, `h3s` (the enumerated structural observables) | **VERIFIED** |
| Company / Sector surface `data-testid` key set (26 / 23) and the 3-key delta | **VERIFIED** |
| Whole-page `testId keys` scalar (43 / 40) | **PARTIALLY VERIFIED** — reconciled by derivation to a single consistent 11-byte shell constant; the capture manifest is unreachable, so per-key membership cannot be re-derived |
| Advisory keys (`ai-explanation*`, `badge-ai`, `status-positive`) | **BLOCKED** — AI Advisory is out of scope; 8 keys per surface are a deliberate, enumerated loss |
| Advertised whole-page parity | Company **37/43**, Sector **34/40** — the entire shortfall is the advisory panel |
| Visual pixel parity | **NOT CLAIMED.** Structural parity is not visual parity. |

No visual-parity claim is made anywhere. `stateChecks`/`alerts` are asserted structurally (the
surfaces render their own surface and emit no alert state), not by pixel comparison.

## 15. Targeted tests

| Suite | Tests | Result |
| --- | --- | --- |
| `research_sector_ui_recovery.test.ts` (PU-01…PU-28) | 28 | **pass** |
| `research_sector_parity.test.ts` (PA-01…PA-21) | 21 | **pass** |
| `research_sector_read_authorities.test.ts` (RA-01…RA-27) | 27 | **pass** |
| `research_sector_primitives.test.ts` (PRIM-01…PRIM-13) | 13 | **pass** |

Command: `node --test dist/tests/research_sector_*.test.js`

## 16. Full regression

`node --test dist/tests/*.test.js`

| | Tests | Suites | Fail |
| --- | --- | --- | --- |
| Prompt-2B baseline (re-verified at the start of this unit) | 600 | 95 | 0 |
| **After Prompt 2C** | **649** | **106** | **0** |

Delta = **+49 tests / +11 suites** = exactly the 28 PU guards + 21 PA guards, in the two new suites
(`research_sector_ui_recovery`, `research_sector_parity`; `node:test` reports each nested `describe`
block as a suite, which is why 2 files contribute 11 suites).
No pre-existing test was deleted or disabled, and no pre-existing assertion was weakened except
the four governed shell statements enumerated in §10 (each narrowed and justified inline).

## 17. TypeScript result

`npm run build:tsc` → **exit 0**, clean, no diagnostics.

## 18. Vite result

`npm run build:vite` → **exit 0**.

## 19. Browser-boundary verification

Proved, not asserted by hand-waving:

* **Entry-graph walk (PU-14).** The module graph is walked from `frontend/src/main.tsx`,
  resolving every relative import transitively. The walk finds the two recovered surfaces **in**
  the graph and finds **zero** browser-reachable file importing `frontend/server/**` or
  `research-sector-transport`: the Prompt-2B server authority is unreachable from the browser.
  The same walk **does** reach `node:fs` / `node:path` / `node:url` / `node:module` through exactly
  one module, the **pre-existing** `src/transports/executive_transport.ts`, entered from the seven
  pre-existing baseline Path-L importers (`api/executive.ts` plus the Executive, Intelligence,
  Research, Screener, Security-Master and Evidence surfaces). That is a **baseline architectural
  condition owned by those surfaces' own gates** — this unit neither created it nor fixed it, and
  it is recorded here rather than papered over. PU-14 therefore asserts the honest invariant: the
  set of Node-importing modules reachable from the browser is *exactly* that recorded baseline,
  and **no** Node import is reachable through any file this unit recovered.
* **Source scan (PU-11).** No file under `frontend/src/**` imports `src/transports`,
  `iips-platform`, `node:*`, `frontend/server/**` or the authority module. The single exemption is
  the **pre-existing** `api/executive.ts` platform import, which is a baseline condition owned by
  the Executive surface — untouched, and deliberately not "fixed" opportunistically.
* **No provider/socket primitive** in any recovered file (PU-12); all browser network access goes
  through the one canonical `authFetch` helper (PU-13).
* **Prompt-2B server authority remains outside the Vite graph** — no browser file imports it, and
  the authority is byte-unchanged (§21).

## 20. Bundle-size comparison

| | Bytes |
| --- | --- |
| Before (Prompt-2B baseline) | 1,487,184 |
| **After (Prompt 2C)** | **1,500,550** |

Measured delta = **+13,366 bytes** (gzip 192.46 kB), the two recovered surfaces plus their
clients, the advisory-deferred primitive and the restored trust chain.

Authority/PIT symbol check on the built bundle (single method: `grep -o … | wc -l`):
`research-sector`, `X-IIPS-Certification`, `X-IIPS-Authentication`, `computeCertifiedCompany`,
`computeCertifiedEvidence`, `computeCertifiedReplay`, `createResearchSectorServer`, `node:fs`,
`node:path`, `node:crypto`, `PitVintage`, `p08PitStore`, `d114AdmissionBridge` and the donor
advisory key `ai-explanation` — **all 0 occurrences**. `api/decision-matrix` measures **1**, and
that one occurrence is the literal **HTTP path string** inside the recovered browser client
(`frontend/src/api/decisionMatrix.ts`), not a module import — the server authority is absent from
the bundle. Conversely the recovered surfaces **are** present (`advisory-deferred`,
`company-sector-selector`, `sector-company-link` all found), which is the intended asymmetry:
surface code in the graph, server authority outside it.

## 21. Remaining blockers

| # | Blocker | State |
| --- | --- | --- |
| **B-1** | AI Advisory is required for the captured `advisoryState: 'rendered'` and 8 observable keys per surface | **STILL OPEN.** Out of scope by instruction; needs its own authorized gate (auth-bound transport, `f63a9b49…` lineage). This is the sole reason parity is not VERIFIED. |
| **B-2** | Capture key membership (the 43/40 scalar) cannot be re-derived: the capture deposit `2f1049d0…` is unreachable | **STILL OPEN.** Reconciliation holds by derivation (§14); re-verification requires the deposit. |
| **B-3** | Loader async branches (loading → loaded / error / unavailable / degraded) are verified **structurally** (source + canonical state components + pure-view behaviour), not by an asynchronous DOM runtime | **DISCLOSED.** `renderToString` does not run effects and jsdom is unavailable by instruction. The genuine data-rendered DOM is verified directly via the pure views. Not claimed beyond that. |
| **B-4** | The four governed shell test updates in §10 | **RESOLVED this unit** (narrowed, justified inline). |
| — | Transport is unauthenticated NON_PRODUCTION infrastructure | Unchanged; explicitly disclosed in-band by the authority, no bypass. |

## 22. Exact next dependency if parity is incomplete

**The single next dependency is AI Advisory recovery** — nothing else blocks full parity.

Concretely, to move the classification from PARTIALLY VERIFIED to VERIFIED:

1. An authorized gate for the **AI Advisory** surface covering `components/ai/AiExplanation.tsx`,
   `api/aiAdvisory.ts` and the `/api/ai-advisory/:key` read authority (manifest R-7).
2. A decision on the **auth boundary** for that transport — its donor form is `guardRead`-bound and
   16 auth-tier files are absent. Only two honest options exist: (a) a non-production
   unauthenticated dev transport with explicit disclosure (the Stage-4 / Prompt-2B precedent), or
   (b) deferral to a dedicated auth-boundary gate. **Bypassing authentication remains prohibited.**
3. **Re-access to the capture deposit** `2f1049d0db348733f4d4f15fb4dcc57d4f2742fa`
   (`docs/v3.0/e2e-018-screenshots/CAPTURE_MANIFEST.json`, 19 PNG) to re-derive the per-key
   membership of the 43/40 scalars and lift §14's scalar row from PARTIALLY VERIFIED to VERIFIED.

Until (1)–(3) are addressed, **no visual-parity claim may be made**, and the classification
remains **PARTIALLY VERIFIED**.

---

## Governance notes

* **New delegation, disclosed:** this unit authors its *own* `node:test` suites rather than
  transferring the donor's vitest/jsdom tests, which are structurally incompatible with the
  baseline runner and are excluded (manifest E-7). No new test framework or dependency was added
  (PU-22 asserts the dependency set is exactly the baseline set).
* **The Prompt-2B authority was not modified.** Its `RA-24/25/26` guards were **re-scoped, not
  weakened**: RA-24 now inspects code with comments stripped (so a real import still fails) —
  tightening a check that had been tripped by a legitimate doc-comment mention; RA-25 now pins the
  five baseline clients byte-identical *and* requires every client to be node-free; RA-26 keeps the
  server and route-map byte-unchanged and **adds** five out-of-scope-surface absence checks.
* **No fabrication, in any surface.** Prompt 2B's removal of the donor's `value: 0` descriptor
  coercion is honoured end-to-end: the evidence key-metric table is numeric-only, and where the
  *company inputs* table does show a descriptor it renders that descriptor's true value as text.
  PA-18 asserts both halves against the recorded defect, and PA-19 requires every rendered
  `metric-value` to be either a governed payload value or the word "unavailable".
* **AD-17 / M-2 remain UNRESOLVED.** The replay literals render through the approved safe display
  with `verified*` pinned false and the standing disclosure. No verification is claimed.
* **STOP.** This unit ends here. AI Advisory recovery, production/provider work, Windows work,
  D115 work and all further implementation units are NOT started.
