# IIPS — RESEARCH & SECTOR INTELLIGENCE — RECOVERY MANIFEST

**Gate:** IIPS — PER-SURFACE CONTROLLED RECOVERY GATE: RESEARCH & SECTOR INTELLIGENCE — **Prompt 1 of 3 (FORENSIC / MANIFEST ONLY)**
**Document instant:** 2026-09-24 (UTC) · **Mode:** NON_PRODUCTION / FORENSIC READ-ONLY
**Current implementation baseline (HEAD, verified):** `43c3e0dc079db47bc5bb1b6eb16d1ab6dfb38b1e`
  parent `ea70a8c4fdb52a1378953b2d249a315c9e68ca77` (Stage 4 recovery) · parent `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (`main`) · tree `24e8d6f61f967f83a1f23291ae36da7a4aea8e0b`

```text
SCOPE                 = Company/Research Intelligence + Sector Intelligence ONLY
IMPLEMENTATION        = NOT PERFORMED (this prompt is forensic/manifest only)
SOURCE COPIED         = NONE
EXECUTIVE MODIFIED    = NO     D05 MODIFIED = NO     BI-08 MODIFIED = NO
D115                  = UNCHANGED / WITHHELD
PROVIDER ACTIVATION   = NOT GRANTED          PRODUCTION AUTHORIZATION = NOT GRANTED
WINDOWS               = UNCHANGED (outside Arena access; not touched)
main                  = 4d3e1cdca3a33da0ec3be8b336b17128108a502c (unchanged)
```

**Method.** All archaeology was performed against fetched Git objects; no historical branch was merged, no
historical commit cherry-picked, no working-tree file written. Verification of build/bundle behaviour used a
throwaway `dist-frontend/` build (gitignored) which was deleted afterwards.

---

## 1. Historical refs investigated

| Ref | SHA | Role in this gate | Key evidence used |
| --- | --- | --- | --- |
| Certified product checkpoint | `7964fccefbf95341699bf56b5833b2432981767d` | the commit the 19 captures were taken at (`productCommit`) | blob comparison anchor for every surface |
| Certified screenshot deposit | `2f1049d0db348733f4d4f15fb4dcc57d4f2742fa` | Stage A capture artifacts | `docs/v3.0/e2e-018-screenshots/` (19 PNG + `CAPTURE_MANIFEST.json`) |
| E2E-018 matrix baseline | `f8aa038e78373113858459c8136ba888cae6520c` | parity matrix `product baseline` | `E2E-018_SCREENSHOT_CERTIFIED_PRODUCT_PARITY_MATRIX.md` |
| Donor tip (c440) | `42f91fad0ff5141fce665b068b544224ac471f73` (tree `e1755b29…`) | authoritative historical implementation | full app: 19 feature dirs, `frontend/server/**` (71 files), `frontend/src/api/**` (23) |
| D89 lineage tip | `da4305149bd5495789f893f530edb2526d08bb5b` | donor-family variant (UI12 data-mode propagation) | `SectorIntelligence.tsx` @ donor == @ da43051 |
| Divergence point | `eae2ff6937b257883433348560ae92f5485629e5` | merge base donor ↔ `main` | per Stage 2/3 records |
| `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | current authoritative product tip | unchanged |
| Stage 4 recovery | `ea70a8c4fdb52a1378953b2d249a315c9e68ca77` | recovered Executive + foundational transport | supplies the in-process certified platform in the current tree |
| **Current baseline** | `43c3e0dc079db47bc5bb1b6eb16d1ab6dfb38b1e` | target of every compatibility judgement | HEAD |

---

## 2. TASK A — HISTORICAL ARCHAEOLOGY

### 2.1 Route identity (donor `frontend/src/app/routes.ts`, `App.tsx`)

```text
research:            '/research'                     → ResearchHub            (NOT in scope — see §7 E-9)
researchCompany:     '/research/company/:id'         → CompanyIntelligence    ← IN SCOPE (Company Intelligence)
researchSector:      '/research/sector/:id'          → SectorIntelligence     ← IN SCOPE (Sector Intelligence)
researchEvents:      '/research/events/:id'          → ResearchEvents         (EXCLUDED — Events)
researchCrossSector: '/research/cross-sector'        → CrossSectorIntelligence(EXCLUDED — Cross-Sector)
researchMacro:       '/research/macro'               → MacroContext           (EXCLUDED — Macro/LIVE)
```

Donor `App.tsx:69–74` mounts all six lazily inside `AppShell`. Navigation entries resolve to the frozen
reference sector (`/research/company/Banking`, `/research/sector/Banking`, `…/events/Banking`) — the donor
N+7 / P-4 concrete-deep-link contract.

### 2.2 Company Intelligence — implementation lineage

| Layer | Historical path | Donor blob | Certified `7964fcc` blob | Baseline `43c3e0dc` |
| --- | --- | --- | --- | --- |
| UI surface | `frontend/src/features/company/CompanyIntelligence.tsx` (9,938 B) | `23cb1af6c229` | `570471632871` | **ABSENT** |
| Sub-UI (trust chain) | `frontend/src/features/company/CompanyTrustChain.tsx` | `18d59e26785c` | `0f16dcb01180` | present, adapted `361064393acc` (Stage 4) |
| Header component | `frontend/src/components/company/CompanyHeader.tsx` | `16e7ddc603f3` | `16e7ddc603f3` | present, adapted `fb268ce9fe96` |
| API client (primary) | `frontend/src/api/company.ts` (2,854 B) | `04c4ba4c8c23` | `1235c20eca0d` | **ABSENT** |
| API client (universe) | `frontend/src/api/decisionMatrix.ts` (1,302 B) | `311e86c08459` | `311e86c08459` | **ABSENT** |
| API client (evidence) | `frontend/src/api/evidence.ts` | `8ea7c864519e` | `8ea7c864519e` | present, adapted `900d31af6293` |
| API client (replay) | `frontend/src/api/replay.ts` | `56e236dfbca6` | `56e236dfbca6` | present, adapted `5febff55fcb4` |
| API client (mode types) | `frontend/src/api/dataMode.ts` (5,152 B) | `d45b544afd6d` | **ABSENT** (post-certified) | **ABSENT** |
| API client (advisory) | `frontend/src/api/aiAdvisory.ts` (3,518 B) | `2258e54c179e` | `2258e54c179e` | **ABSENT** |
| UI (advisory panel) | `frontend/src/components/ai/AiExplanation.tsx` (4,830 B) | `df8bb2b9a5c7` | `df8bb2b9a5c7` | **ABSENT** |
| UI (state) | `frontend/src/components/state/DataModeUnavailable.tsx` (1,729 B) | `b264ace76b11` | **ABSENT** | **ABSENT** |
| UI (state) | `frontend/src/components/state/PitVintagePanel.tsx` (5,076 B) | `0ca0e8773855` | **ABSENT** | **ABSENT** |
| Server dispatch | `frontend/server/executive-transport.ts` (56,726 B) | `e6360974e447` | `fab26a429736` | present, **different** `dd7493a5680f` (Stage 4, Executive-only) |
| Server route (company) | `frontend/server/pit/companyPitTransport.ts` (3,670 B) | `4c1af54bc42e` | **ABSENT** | **ABSENT** |
| Server PIT provider | `frontend/server/pit/pitVintageProvider.ts` (31,314 B) | `17f9bfdd012e` | **ABSENT** | **ABSENT** |
| Server PIT store | `frontend/server/pit/p08PitStore.ts` (818 B) | `e764ad6b29ff` | **ABSENT** | **ABSENT** |
| Server mode seam | `frontend/server/data-mode/data-mode.ts` (16,586 B) | `904e9ead9554` | **ABSENT** | **ABSENT** |
| Auth (browser) | `frontend/src/core/auth/oidcClient.ts` (14,101 B) | `638fa3b5ada9` | `638fa3b5ada9` | **ABSENT** |
| Server (advisory) | `frontend/server/ai-advisory-transport.ts` (9,244 B) | `e257814e3eb2` | `e257814e3eb2` | **ABSENT** |
| Platform (advisory runtime) | `iips-platform/src/distributed/AiAssistedRuntime.ts` | — | — | **PRESENT** `bf51421e7c7b` |

**Dependency graph actually executed by the surface** (`CompanyIntelligence.tsx` header comment: *"N+5:
composes the THREE guarded read endpoints client-side (/api/company, /api/evidence, /api/replay) into one
surface"*; *"N+12: governed sector list sourced from /api/decision-matrix; never hardcoded"*):

```text
/research/company/:id
  └─ CompanyIntelligence.tsx
       ├─ api/company.ts   fetchCompanyPayload(id, asOf?) ──► GET /api/company/:id[?asOf=]
       ├─ api/evidence.ts  fetchEvidenceData(id)          ──► GET /api/evidence/:id
       ├─ api/replay.ts    fetchReplayData(id)            ──► GET /api/replay/:id
       ├─ api/decisionMatrix.ts fetchDecisionMatrixData() ──► GET /api/decision-matrix   (sector selector/universe)
       ├─ api/dataMode.ts  isDegraded / isPitVintage      ──► payload discrimination (pure)
       ├─ components/ai/AiExplanation.tsx ────────────────► GET /api/ai-advisory/:sectorKey  (self-fetching)
       ├─ components/state/DataModeUnavailable.tsx, PitVintagePanel.tsx
       ├─ components/company/CompanyHeader.tsx + features/company/CompanyTrustChain.tsx
       └─ components/{data,decision,evidence,state,ui}/*  (already in baseline)
                 server side of every /api/* above:
                 frontend/server/executive-transport.ts (dispatch + guardRead)
                   ├─ computeCertifiedCompany(sectorId)     ← mapper over computeCertifiedPlatform()
                   ├─ computeCertifiedEvidence(sectorId)    ← mapper (fixture constants, D79)
                   ├─ computeCertifiedReplay(sectorId)      ← mapper (fixture constants, D79)
                   ├─ computeCertifiedDecisionMatrix()      ← mapper over engineDetails + CSIP
                   └─ pit/companyPitTransport.ts → pit/pitVintageProvider.ts → d114/src/d114/*  (PIT mode)
```

### 2.3 Sector Intelligence — implementation lineage

| Layer | Historical path | Donor blob | Certified `7964fcc` blob | Baseline |
| --- | --- | --- | --- | --- |
| UI surface | `frontend/src/features/research/SectorIntelligence.tsx` (12,916 B) | `4f724d0da0dd` | `858f1f89fe81` | **ABSENT** |

Dependency graph (`SectorIntelligence.tsx` header: *"S1: three-call governed composition (Bearer propagated
via authFetch in each client)"*; *"S6: sector selector options sourced ONLY from /api/decision-matrix
(N+12 pattern)"*):

```text
/research/sector/:id
  └─ SectorIntelligence.tsx
       ├─ api/company.ts          fetchCompanyData(id)      ──► GET /api/company/:id   (per-sector engine payload)
       ├─ api/evidence.ts         fetchEvidenceData(id)     ──► GET /api/evidence/:id
       ├─ api/replay.ts           fetchReplayData(id)       ──► GET /api/replay/:id
       ├─ api/decisionMatrix.ts   fetchDecisionMatrixData() ──► GET /api/decision-matrix  ("Decision-matrix position")
       ├─ api/dataMode.ts (isDegraded) + components/state/DataModeUnavailable.tsx
       ├─ components/ai/AiExplanation.tsx ──────────────────► GET /api/ai-advisory/:sectorKey
       └─ components/{data,decision,state,ui}/*
```

**There is no `/api/sector` and no `/api/research` endpoint anywhere in the donor** (`git grep '/api/sector'`
= 0 matches; `/api/research` = 0 matches). Both in-scope surfaces are **client-side composition surfaces**
over four shared read authorities; they own no server route of their own.

### 2.4 Dependency-closure measurement (transitive, computed against historical objects)

| Root | Closure files | Already in baseline | **Absent from baseline** |
| --- | --- | --- | --- |
| `features/company/CompanyIntelligence.tsx` | 21 | 12 | **9** |
| `features/research/SectorIntelligence.tsx` | 17 | 9 | **8** |
| Second-order roots (clients + state/ai components + `core/auth/oidcClient`) | 13 | 5 | **8** |
| Server: `pit/companyPitTransport.ts` (the `/api/company/:id` route) | 19 | **0** | **19** |
| Server: `ai-advisory-transport.ts` | 131 | 115 | 16 (auth tier) |
| Server: `data-mode/data-mode.ts` | 3 | 0 | 3 |
| Server: full dispatch `executive-transport.ts` | **188** | 127 | **61** |
| External packages (UI closure) | — | `react`, `react-router-dom` only | none new |

Absent-file composition of the 61-file dispatch closure (representative — this is why it cannot be
recovered wholesale): `admin-transport`, `secured-executor`, `secrets/secret-authority`, `directory/*`,
`live/real-oidc-verifier`, `collaboration/*`, `macro/mospi-source`, `watchlists/*`, `reports/*`,
`p12-*`, `portfolio/portfolio-data-mode`, `settings/*`, `persistence/*`, **`d114/src/{contracts,d114,normalization}/*` (11 files)**,
`p05/src/*`, `p08/src/pitStorageModel.js`, `p12/src/*`, `p13/src/*`, `iips-platform/src/governance/NamespaceCollisionGuard.ts`, `plugin-loader/PluginNamespace.ts`.

---

## 3. TASK B — PAYLOAD PROVENANCE (per endpoint, evidence-based)

Classification vocabulary fixed by the prompt. No provenance is inferred from a payload's existence; every
row cites the code that produces it.

| Transport | Consumed by | **Provenance** | Evidence |
| --- | --- | --- | --- |
| `GET /api/company/:id` (SNAPSHOT) | Company, Sector | **FROZEN SNAPSHOT (certified derivation)** | `computeCertifiedCompany()` ← `computeCertifiedPlatform().engineDetails` + `GOLDEN_PILLARS`; platform runs the 13 frozen sector engines over `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json` (blob `63bcd350f2cda2b0337097c25236fd8dbe82d87b`); `generatedAt/calibratedAt = 2026-08-09T00:00:00.000Z`; no provider, no network |
| `GET /api/company/:id?asOf=…` (PIT) | Company | **FIXTURE / PERSISTED (governed PIT corpus)** | `pit/companyPitTransport.ts` → `pit/pitVintageProvider.ts` → `p08PitStore.ts` seeded from `pit/fixtures/corpus/{legacy-fixture.csv, udiff-fixture.csv}` + `pit-corpus-manifest.json`; imports `d114/src/d114/*` |
| `GET /api/evidence/:id` | Company, Sector | **FIXTURE — TRANSPORT FIXTURE CONSTANTS** | `computeCertifiedEvidence()`: `reproduced: true`, `byteIdentical: true` are hardcoded and no `EvidencePipeline` is invoked. Corrected by the donor's own **D79** act: `dataSource: 'transport fixture constants over frozen v1.1 Replay Baseline inputs — … NOT produced by a runtime replay or EvidencePipeline verification'`. `AD-17 / M-2 remain UNRESOLVED` (D79 §2). |
| `GET /api/replay/:id` | Company, Sector | **FIXTURE — TRANSPORT FIXTURE CONSTANTS** | `computeCertifiedReplay()`: same defect, same D79 correction; `differenceAvailable: false` by contract; `dataSource: 'transport fixture constants … NOT produced by a runtime ReplayService verification'` |
| `GET /api/decision-matrix` | Company, Sector | **FROZEN SNAPSHOT (certified derivation)** | `computeCertifiedDecisionMatrix()` ← `engineDetails` + CSIP ranking; explicit comment: *"NO certified matrix/quadrant classification object exists; UI positions them (no quadrant/band/threshold computation in React)"*; valuation `null` where the engine does not expose it |
| `GET /api/ai-advisory/:sectorKey` | Company, Sector (embedded) | **FROZEN SNAPSHOT (deterministic, non-provider)** | `ai-advisory-transport.ts`: `ADVISORY_FRESHNESS = 'SNAPSHOT'`; `ADVISOR_MODEL = 'iips-deterministic-advisor'`; *"Deterministic; no external AI, provider or network; no additional reads"*; advisor derived from the frozen certified baseline |
| `GET /api/macro` | *not required by the two in-scope surfaces* | **LIVE PROVIDER DATA (MoSPI)** | `macro/mospi-source.ts`; governed LIVE-only (D91/D88) — **EXCLUDED**, see §7 E-6 |
| Captured UI payload strings/values (19 PNG) | both surfaces | **DERIVED FROM FROZEN SNAPSHOT, PER-SURFACE PARITY UNVERIFIED** | `CAPTURE_MANIFEST.json` `dataBaseline` = `PROGRAM_v1.1_REPLAY_BASELINE.json` `63bcd350…`; `authMode = real-keycloak-oidc-pkce`; **no parity determination is claimed by the manifest** (`attestations.parity = "not determined"`) and Stage 3 verified E2E-018 observables for **Executive only (41/41)** |
| E2E-018 matrix rows 3 / A1 / A2 (repository side) | both surfaces | **UNKNOWN / ABSENT at matrix baseline** | matrix records `CURRENT-REPOSITORY · ABSENT · ABSENT-UNVERIFIABLE · ABSENT` for Company Intelligence, AI-Advisory-in-Company, AI-Advisory-in-Sector |

```text
COMPANY INTELLIGENCE UI PAYLOAD PROVENANCE  = FROZEN SNAPSHOT (company/decision-matrix)
                                            + FIXTURE (evidence/replay)
                                            + FROZEN SNAPSHOT deterministic (ai-advisory)
SECTOR INTELLIGENCE UI PAYLOAD PROVENANCE   = same four sources
PIT-VINTAGE VARIANT PROVENANCE              = FIXTURE / PERSISTED (d114-seeded PIT corpus)
LIVE PROVIDER DATA                          = NONE (macro is not consumed by either in-scope surface)
UNKNOWNS                                    = per-surface observable parity (never verified for these two)
```

---

## 4. TASK C — COMPATIBILITY AGAINST BASELINE `43c3e0dc`

### 4.1 Blob-level verdicts (baseline vs donor vs certified)

| Path | baseline | donor | certified | Verdict |
| --- | --- | --- | --- | --- |
| `components/data/DataComponents.tsx` | `5124c91713ac` | `5124c91713ac` | `5124c91713ac` | **ALREADY PRESENT — identical to donor and certified (do not touch)** |
| `components/decision/DecisionComponents.tsx` | `9b9679c2c577` | `9b9679c2c577` | `9b9679c2c577` | **ALREADY PRESENT (do not touch)** |
| `components/evidence/Ad17Disclosure.tsx` | `fa5c0ebb3bf5` | `fa5c0ebb3bf5` | ABSENT | **ALREADY PRESENT (do not touch)** |
| `components/ui/Badges.tsx` | `80eebe2fff49` | `80eebe2fff49` | `80eebe2fff49` | **ALREADY PRESENT (do not touch)** |
| `components/state/StateComponents.tsx` | `cd227f96a434` | `cd227f96a434` | `a359daa85148` | **ALREADY PRESENT — donor-identical (donor consumers are prop-compatible)** |
| `components/company/CompanyHeader.tsx` | `fb268ce9fe96` | `16e7ddc603f3` | `16e7ddc603f3` | **ADAPTER ONLY — the entire diff is the `.js` import suffix** (`diff` shows exactly 3 import lines) |
| `components/evidence/EvidenceExplorerComponents.tsx` | `c491ae116d6f` | `f9f880e9119f` | `56600fbbc9ba` | **PRESENT BUT DIFFERS — review required** (Company/E2 narrative stays valid; Sector does not consume it) |
| `features/company/CompanyTrustChain.tsx` | `361064393acc` | `18d59e26785c` | `0f16dcb01180` | **ALREADY RECOVERED by Stage 4 — reuse, do not duplicate** |
| `api/authFetch.ts`, `api/evidence.ts`, `api/replay.ts`, `api/executive.ts` | Stage-4 adapted | donor | certified | **ALREADY PRESENT (adapted)** — donor surfaces importing these need no change beyond `.js` |
| `frontend/server/executive-transport.ts` | `dd7493a5680f` (Stage 4, Executive-only) | `e6360974e447` (56 KB, 12 surfaces) | `fab26a429736` | **CURRENT IS A DELIBERATE SUBSET — must NOT be replaced by the donor module (see §4.3)** |
| All other rows of §2.2/§2.3 | ABSENT | present | present | **ABSENT FROM BASELINE — recovery decision required** |

### 4.2 Mechanical adapter (proven, not assumed)

Baseline `tsconfig.json` is `module: NodeNext` and every existing relative import carries an explicit `.js`
suffix; donor sources are extensionless (Vite/bundler style). The Stage-4 precedent is confirmed by direct
diff: `CompanyHeader.tsx` differs from the donor **only** in that suffix.

```text
CURRENT-LINEAGE ADAPTER = add `.js` to relative import specifiers (NodeNext),
                          keeping the donor module body byte-for-byte.
```
Any recovered donor file must be classified as `RECOVER WITH CURRENT-LINEAGE ADAPTER`, never `RECOVER AS-IS`.

### 4.3 Browser / Vite boundary — the "previous Executive transport issue", reproduced and evidenced

The Executive recovery introduced the node-only certified transport into the **browser** graph. Verified here
on the current baseline:

```text
$ npm run build:vite
[plugin rolldown:vite-resolve] Module "node:url"    has been externalized for browser compatibility,
                               imported by "/home/user/…/src/transports/executive_transport.ts"
[plugin rolldown:vite-resolve] Module "node:fs"     … same …
[plugin rolldown:vite-resolve] Module "node:module" … same …
[plugin rolldown:vite-resolve] Module "node:path"   … same …

$ grep in the emitted browser bundle (dist-frontend/assets/index-*.js, 1,487,184 B)
  createRequire     → present
  readFileSync      → present  (`JSON.parse(N.default.readFileSync(N.default.join(Qn,'PROGRAM_v1.1_REPLAY_BASELINE.json'),'utf8'))`)
  existsSync        → present
  "iips-platform"   → present
```

Root cause: `frontend/src/api/executive.ts` does
`import { computeCertifiedExecutive } from '../../../src/transports/executive_transport.js'` and its
`catch` block falls back to `getCertifiedExecutiveData()` — a **node-only, `fs`-based** computation with no
browser guard. In a browser with no dev server, the fallback path executes externalized stubs and fails
rather than failing closed.

```text
RULE FOR PROMPT 2 (mandatory):
  Browser code (frontend/src/**, vite graph) MUST NOT import src/transports/**, iips-platform/**, or any
  node:* module. Certified data reaches the browser ONLY over HTTP (the Stage-4 server precedent), and any
  non-HTTP fallback MUST be an honest fail-closed state — never a node call.
  This rule must NOT be propagated from the Executive surface into Research/Sector.
```

### 4.4 Test-stack incompatibility

| | Baseline `43c3e0dc` | Donor `42f91fad` |
| --- | --- | --- |
| Runner | `node --test dist/tests/*.test.js` (560 tests / 86 suites) | `vitest run` |
| DOM | `react-dom/server` `renderToString` (SSR string assertions) | `@testing-library/react` + `jsdom` + `user-event` |
| Dev deps | typescript, vite, react, react-dom, @types/*, @vitejs/plugin-react | + vitest, jsdom, @testing-library/* |
| Surface tests | none for company/sector | `CompanyIntelligence.test.tsx` (11 cases, URL-aware fetch mocks), `SectorIntelligence.test.tsx` (6+ cases, imports `App`+`SessionProvider`), `CompanyIntelligencePit.test.tsx`, `server/pit/companyPitWiring.test.ts` |

**Donor tests are evidence, not transferable artifacts.** Stage 4's precedent (governed and accepted) was to
author *new* current-lineage `node:test` parity suites (`tests/executive_recovery_integration.test.ts`, 246
lines) rather than import donor vitest tests. Adding vitest/jsdom/testing-library to the baseline is a
dependency decision that is **not** authorized by this gate.

### 4.5 Governed current-lineage constraints that any recovery must satisfy

| Constraint | Evidence | Consequence |
| --- | --- | --- |
| `/research` = **UI03_FUNDAMENTAL_ANALYSIS only** (single surface, zero children) under `phase4-research-identity-designation-2026-09-23-001` | `frontend/src/features/research/ResearchSurface.tsx` header; `navigation.ts:104-108` | Replacing `/research` with the donor `ResearchHub` would contradict an authority act → **excluded** (§7 E-9) |
| The six donor research children are explicitly **pruned and NOT restored**; present as `status: 'unavailable'` deep links | `navigation.ts:115-123`; `App.tsx` structural placeholders with honest reasons (`'Company Intelligence requires the platform research services, which are not active offline'`) | Recovery = a **status and route change**, i.e. a governed edit of the shell, not just file addition |
| Shell tests pin the current honest state | `tests/shell_navigation_model.test.ts` (NAV-03 "declared-but-unimplemented surfaces are honestly future or unavailable"; NAV-13), `tests/shell_offline_full_shell_restoration.test.ts:93` (`'/research/company/:id', '/research/sector/:id'` in the structural list) | These tests must be **honestly updated** (Stage-4 precedent updated 2 shell suites), never weakened silently |
| Research surface authority-act **prohibitions** include "no network/auth/api/server" | `tests/shell_research_surface.test.ts` header §4; RSR-01…RSR-23 + source-scan suite (currently `ok 42–45`) | A networked Sector/Company surface must **not** be mounted *inside* UI03; it must be a distinct route tree |
| Executive navigation stays honest | `navigation.ts` marks Executive `partial` | Any Research/Sector recovery needs an equivalent honest status decision |
| D114/D115 boundaries | `pit/pitVintageProvider.ts` imports `d114/src/d114/*` (`HistoricalEvidenceHandoff`, `CmUdiffParser`, `historical_feasibility_runner`) | The PIT-vintage branch of `/api/company/:id` touches D114 legacy territory → **EXCLUDED** (§7 E-5) |

---

## 5. TASK D — MINIMUM RECOVERY MANIFEST

Legend — **Recovery action:** `AS-IS` (never applicable here) · `ADAPTER` (current-lineage `.js` adaptation, donor body preserved) · `REUSE` (already present; do not duplicate) · `REVIEW` · `EXCLUDE`.
**Payload provenance** per §3. **Governance** = the authority question the unit raises.

### 5.1 SAFE TO RECOVER (in scope; browser-safe; no excluded-surface coupling; no auth coupling)

| # | Historical source | Current target | Action | Dependency | Payload provenance | Compatibility | Test/evidence requirement | Governance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S-1 | `frontend/src/api/dataMode.ts` (`d45b544afd6d`, 5,152 B) | `frontend/src/api/dataMode.ts` | **ADAPTER** | none (pure type guards `isDegraded`/`isPitVintage`) | n/a (types) | donor-only (post-certified) | unit assertions for the guards | in scope (shared primitive) |
| S-2 | `frontend/src/components/state/DataModeUnavailable.tsx` (`b264ace76b11`) | same path | **ADAPTER** | `StateComponents` (baseline `cd227f96` == donor) | n/a (presentation) | donor-only | SSR render assertions | in scope |
| S-3 | `frontend/src/components/state/PitVintagePanel.tsx` (`0ca0e8773855`) | same path | **ADAPTER** | only `import type { PitVintageData } from '../../api/dataMode'` | renders PIT metadata verbatim | donor-only | SSR render assertions | in scope (presentation); **data** source remains E-5 |
| S-4 | `frontend/src/features/company/CompanyTrustChain.tsx` | already present (`361064393acc`) | **REUSE** | — | evidence/replay refs | adapted by Stage 4; certified blob `0f16dcb01180` | covered by Executive suites | **do not duplicate** |
| S-5 | `frontend/src/components/company/CompanyHeader.tsx` | already present (`fb268ce9fe96`) | **REUSE** | — | n/a | donor-identical modulo `.js` | — | — |

### 5.2 REQUIRES REVIEW (in scope, but each carries an unresolved authority or boundary decision)

| # | Historical source | Current target | Action | Dependency | Payload provenance | Compatibility | Test/evidence requirement | Governance question |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-1 | `features/company/CompanyIntelligence.tsx` (`23cb1af6c229` / cert `570471632871`) | `frontend/src/features/company/CompanyIntelligence.tsx` | **ADAPTER** | company + evidence + replay + **decision-matrix** clients + `AiExplanation` + S-1..S-3 + CompanyHeader/TrustChain | SNAPSHOT + FIXTURE (§3) | 9 absent deps (§2.4) | 43-key observable parity per §6 (13 sectors) | mounting is a shell-status change; depends on R-3/R-4/R-5 |
| R-2 | `features/research/SectorIntelligence.tsx` (`4f724d0da0dd` / cert `858f1f89fe81`) | same path | **ADAPTER** | as R-1 | SNAPSHOT + FIXTURE | 8 absent deps | 40-key observable parity (§6) | as R-1 |
| R-3 | `api/company.ts`, `api/decisionMatrix.ts`, `api/aiAdvisory.ts` | same paths | **ADAPTER** | target endpoints that do not exist in baseline | n/a (clients) | thin clients; browser-safe | client contract tests | dead code unless E-1/E-2 decisions made |
| R-4 | **Read authority** `GET /api/company/:id` — `computeCertifiedCompany()` (≈40 pure lines in the donor dispatch) | a current-lineage server module, e.g. `frontend/server/company-transport.ts` | **REVIEW** | `computeCertifiedPlatform()` (**already in baseline**), `GOLDEN_PILLARS`, frozen baseline `63bcd350` | **FROZEN SNAPSHOT** | donor mapper is pure; the donor *host* module is 56 KB and not recoverable | endpoint contract + payload-hash tests | SNAPSHOT-only; PIT branch **EXCLUDED** (E-5) |
| R-5 | **Read authority** `GET /api/decision-matrix` — `computeCertifiedDecisionMatrix()` | current-lineage server module | **REVIEW — DEPENDENCY ON AN EXCLUDED SURFACE** | `computeCertifiedPlatform()` + CSIP | FROZEN SNAPSHOT | pure mapper | contract + ordering tests | **Decision Matrix is excluded by this gate**, yet both in-scope surfaces source their selector *and* the Sector "Decision-matrix position" panel from it (observables `company-sector-selector`, `sector-select`, `sector-supporting-scores`) |
| R-6 | **Read authority** `GET /api/evidence/:id`, `GET /api/replay/:id` — `computeCertifiedEvidence/Replay()` | current-lineage server modules | **REVIEW — DEPENDENCY ON AN EXCLUDED SURFACE** | `computeCertifiedPlatform()` | **FIXTURE (transport fixture constants, D79)** | mappers are short but their content is fixture constants | parity tests must assert the **corrected D79 attribution truthfully** | Evidence surface is excluded; AD-17 / M-2 unresolved (D79) |
| R-7 | **Read authority** `GET /api/ai-advisory/:key` — `server/ai-advisory-transport.ts` (`e257814e3eb2`) + `components/ai/AiExplanation.tsx` (`df8bb2b9a5c7`) + `api/aiAdvisory.ts` | current-lineage module + component | **REVIEW — AUTH COUPLING** | `guardRead` (`admin-transport`, `8866dbe81b0f`) → `secured-executor` → `core/auth/{keycloakAdapter,authContract}` → `secrets/secret-authority`, `directory/*`, `live/real-oidc-verifier` (**16 absent files**); `AiAssistedRuntime` (**present**) | FROZEN SNAPSHOT deterministic (no provider) | advisor runtime already in baseline | contract tests + disclosure assertions | 5 of the 43/40 captured keys are `ai-explanation*` — omitting advisory is a **visible parity loss**; including it drags in the auth tier |
| R-8 | Route registration (`App.tsx`, `navigation.ts`), shell status for the two children | baseline files | **REVIEW** | R-1/R-2 | n/a | current files are governed | must update `shell_navigation_model`, `shell_offline_full_shell_restoration`; must **not** touch UI03 prohibitions (`shell_research_surface`) | governed edit + honest status; Stage-4 precedent |
| R-9 | Donor surface tests (`CompanyIntelligence.test.tsx`, `SectorIntelligence.test.tsx`, `companyPitWiring.test.ts`) | — | **REVIEW — NOT TRANSFERABLE** | vitest/jsdom/testing-library (not in baseline) | n/a | incompatible runner | author `node:test` parity suites instead | dependency addition needs separate authorization |

### 5.3 EXCLUDED (must not be recovered in this gate)

| # | Unit | Evidence | Reason |
| --- | --- | --- | --- |
| E-1 | Donor `frontend/server/executive-transport.ts` wholesale (56,726 B) | 188-file closure; 61 absent | would merge 12 surfaces (admin, collaboration, reports, watchlists, screener/P12, macro, notes, notifications, settings, portfolio, evidence, decision-matrix) — violates "no broad merges / no unrelated surface recovery" |
| E-2 | Donor **auth tier** (`admin-transport`, `secured-executor`, `secrets/secret-authority`, `directory/*`, `live/real-oidc-verifier`, `core/auth/*`) | §2.4 closure | Administration surface excluded; auth is a boundary that must not be reconstructed ad hoc or bypassed |
| E-3 | `frontend/src/features/research/{ResearchEvents,MacroContext}.tsx`, `features/cross-sector/CrossSectorIntelligence.tsx` | donor `App.tsx:72–74`; captures `cross-sector-intelligence.png` | Events / Cross-Sector / Macro are separate gates; Macro is LIVE-only (D91/D88) |
| E-4 | `frontend/server/macro/mospi-source.ts` | LIVE provider adapter | provider activation = NOT GRANTED |
| E-5 | **PIT vintage branch**: `pit/companyPitTransport.ts`, `pit/pitVintageProvider.ts` (31 KB), `pit/p08PitStore.ts`, `pit/d114AdmissionBridge.ts` | imports `d114/src/d114/*` + `node:fs|crypto|path`; corpus fixtures `pit/fixtures/corpus/*.csv` | D114 legacy-evidence territory (D115/D114 excluded); node-only (browser-unsafe); the SNAPSHOT form of the endpoint does not need it |
| E-6 | `/api/macro` and any policy/screener/P12/watchlists/reports read authority | §2.4 | excluded surfaces |
| E-7 | Adding `vitest`/`jsdom`/`@testing-library/*` to baseline `devDependencies` | §4.4 | dependency change outside the gate's authority |
| E-8 | Importing `src/transports/**` or `iips-platform/**` into browser code | §4.3 (vite externalization warnings; bundle greps) | Node-only modules must not enter the browser/Vite graph |
| E-9 | Replacing `/research` (UI03) with donor `ResearchHub` | `phase4-research-identity-designation-2026-09-23-001`; `ResearchSurface.tsx` header | would contradict an authority act; ResearchHub is also outside "Company/Sector Intelligence" |

---

## 6. PARITY EVIDENCE INVENTORY (E2E-018, in-scope surfaces only)

Source: `2f1049d0db348733f4d4f15fb4dcc57d4f2742fa:docs/v3.0/e2e-018-screenshots/CAPTURE_MANIFEST.json`
(`productCommit 7964fcc…`, `dataBaseline 63bcd350…`, Edge 151.0.4129.107 @1440×900, light theme,
`authMode real-keycloak-oidc-pkce`, realm `iips`, tenant `tenant-A`, role `iips-admin`).

| Capture | Route | h1 | tableRows | testId keys | metric-card/value | h3s |
| --- | --- | --- | --- | --- | --- | --- |
| company-intelligence_banking.png | `/research/company/Banking` | `Banking (reference)` | 9 | 43 | 14 / 14 | Certified pillar scores · Supporting metrics (certified) |
| company-intelligence_insurance.png | `…/Insurance` | `Insurance (reference)` | 9 | 43 | 10 / 10 | ″ |
| company-intelligence_capital-markets.png | `…/Capital%20Markets` | `Capital Markets (reference)` | 8 | 43 | 10 / 10 | ″ |
| company-intelligence_healthcare.png | `…/Healthcare` | `Healthcare (reference)` | 6 | 43 | 10 / 10 | ″ |
| company-intelligence_hospitality.png | `…/Hospitality` | `Hospitality (reference)` | 13 | 43 | 12 / 12 | ″ |
| company-intelligence_energy.png | `…/Energy` | `Energy (reference)` | 14 | 43 | 12 / 12 | ″ |
| company-intelligence_utilities.png | `…/Utilities` | `Utilities (reference)` | 16 | 43 | 12 / 12 | ″ |
| company-intelligence_consumer.png | `…/Consumer` | `Consumer (reference)` | 16 | 43 | 12 / 12 | ″ |
| company-intelligence_industrials.png | `…/Industrials` | `Industrials (reference)` | 16 | 43 | 12 / 12 | ″ |
| company-intelligence_technology.png | `…/Technology` | `Technology (reference)` | 16 | 43 | 12 / 12 | ″ |
| company-intelligence_telecommunications.png | `…/Telecommunications` | `Telecommunications (reference)` | 16 | 43 | 12 / 12 | ″ |
| company-intelligence_automobile.png | `…/Automobile` | `Automobile (reference)` | 16 | 43 | 12 / 12 | ″ |
| company-intelligence_materials-metals.png | `…/Materials%20%26%20Metals` | `Materials & Metals (reference)` | 16 | 43 | 12 / 12 | ″ |
| sector-intelligence_banking.png | `/research/sector/Banking` | `Banking` | 9 | 40 | 10 / 10 | Certified pillar scores · Decision-matrix position |

All 14: `stateChecks.acceptedAsSurface = true`, `alerts = []`, `advisoryState = 'rendered'`.
Observable key sets: **43 unique keys** for Company Intelligence, **40** for Sector Intelligence
(the union over all 14 captures is 88 keys; 88 − 43 − 40 = 5 keys exclusive to the out-of-scope
cross-sector capture).

```text
PARITY SPEC AVAILABLE   = YES (deterministic, hash-pinned manifest; 14 in-scope captures)
PARITY EVER VERIFIED    = NO  (Stage 3 verified Executive only: 41/41)
=> Prompt 2 must build a node:test observables-parity suite from this manifest, or parity must be
   reported as UNVERIFIED. No parity claim may be inherited from the Executive gate.
```

---

## 7. EXACT MINIMUM RECOVERY SET (proposed, conditional)

**Minimum set that is unambiguously inside scope and safe** (no excluded-surface or auth coupling):
`S-1`, `S-2`, `S-3` (3 UI primitives) + `S-4`/`S-5` **reuse** (no duplication). This set alone does **not**
restore either surface — it restores the shared primitives the two surfaces require.

**Minimum set that restores the two surfaces *as captured*** (i.e. with the 43/40 observable keys):
`S-1…S-3` + `R-1`, `R-2`, `R-3` + `R-4`, `R-5`, `R-6`, `R-7` read authorities + `R-8` route wiring.
It is **not** recoverable until the operator rules on:
**B-1** decision-matrix coupling (R-5) · **B-2** evidence/replay coupling (R-6) ·
**B-3** auth/advisory coupling (R-7) · **B-4** parity verification (R-9/§6).

**Reduced-parity variants** (honest, but each loses observable keys):
- drop the sector selector + "Decision-matrix position" panel → loses `company-sector-selector`,
  `sector-select`, `sector-supporting-scores`, `sector-company-link` (4 keys per surface);
- drop the advisory panel → loses `ai-explanation`, `badge-ai`, `ai-explanation-label`,
  `ai-explanation-text`, `ai-explanation-fields`, `status-positive`, `ai-explanation-ref`,
  `ai-explanation-unavailable` (`state-unavailable` too, 8–9 keys) and contradicts
  `advisoryState: "rendered"`;
- drop evidence/replay inline → loses `evidence-record-card`, `snapshot-metadata-panel`, `provenance-chain`,
  `replay-summary`, `company-replay-*` / `sector-replay-summary`.

---

## 8. UNRESOLVED QUESTIONS / BLOCKERS

| # | Blocker | Evidence | Needed decision |
| --- | --- | --- | --- |
| B-1 | Both in-scope surfaces read `GET /api/decision-matrix` for their universe/selector **and** the Sector "Decision-matrix position" panel; Decision Matrix is an **excluded** surface | `SectorIntelligence.tsx` S6; `CompanyIntelligence.tsx` N+12; observables `company-sector-selector`, `sector-select`, `sector-supporting-scores` | authorize a **minimum read authority** for decision-matrix as a shared dependency, or accept documented observable loss |
| B-2 | Both surfaces inline evidence + replay; the Evidence surface is excluded; those payloads are **D79 transport fixture constants**, not runtime verification | D79 §2; `computeCertifiedEvidence/Replay` bodies; observables `evidence-record-card`, `replay-summary`, `company-replay-*` | authorize the two read authorities as shared dependencies, with the corrected D79 attribution displayed verbatim |
| B-3 | Captured observables include session-derived `topbarRole`/`topbarTenant`; endpoints are `guardRead`-authorized; 16 auth-tier files are absent | `CAPTURE_MANIFEST.json`; `ai-advisory-transport.ts` header (SR-4); §2.4 | choose: (a) non-production **unauthenticated** dev transport with explicit disclosure (Stage-4 `createExecutiveServer` precedent, no auth, nav `partial`), or (b) defer to a dedicated auth-boundary gate. **Bypassing auth to make a screen appear functional is prohibited.** |
| B-4 | The AI-advisory panel is part of both captured surfaces and has its **own** certification lineage (`DEC-G-AI-IMPL-CERTIFICATION.md`, certified at `f63a9b493118643725568a95b86405a5835a30a0`) | matrix rows A1/A2; `AiExplanation.tsx` self-fetch | decide whether AI Advisory is (i) part of this gate, (ii) part of R-7's review, or (iii) excluded with documented parity loss |
| B-5 | **No parity was ever verified for these two surfaces** | §6; Stage 3 = Executive 41/41 only; matrix rows 3/A1/A2 = `ABSENT-UNVERIFIABLE` | Prompt 2 must include an observables-parity suite built from the 14 captures (or report parity `UNVERIFIED`) |
| B-6 | Recovering networked surfaces changes governed shell assertions | `shell_navigation_model` NAV-03/NAV-13; `shell_offline_full_shell_restoration:93`; `shell_research_surface` UI03 prohibitions | authorize honest test updates (Stage-4 precedent) and the navigation status change for the two children |
| B-7 | The PIT-vintage variant of the company payload is D114-seeded and node-only | `pitVintageProvider.ts` imports `d114/src/d114/*`, `node:fs|crypto|path` | confirm EXCLUDED (recommended) and record `PitVintagePanel` as presentational-only (S-3) |

---

## 9. WHETHER PROMPT 2 IS SAFE TO BEGIN

```text
FORENSIC PHASE (this document)                = COMPLETE
ARCHAEOLOGY                                   = COMPLETE (both lineages traced UI→client→route→service→platform→DTO→fixtures→tests)
PAYLOAD PROVENANCE                            = CLASSIFIED for every endpoint the two surfaces consume
COMPATIBILITY                                 = CLASSIFIED per file (blob-level) + boundary findings
MINIMUM RECOVERY MANIFEST                      = PRODUCED, split SAFE / REQUIRES REVIEW / EXCLUDED

PROMPT 2 SAFE TO BEGIN?                       = CONDITIONALLY YES —
   safe if restricted to: S-1, S-2, S-3 (+ reuse S-4/S-5) and the R-4/R-5/R-6 read authorities
   constructed as pure current-lineage mappers over the ALREADY-RECOVERED computeCertifiedPlatform(),
   served over HTTP only, with honest fail-closed states and no auth reconstruction.
   NOT safe if it attempts: R-7 (auth-coupled advisory) or any donor server-file import, or any
   node-only import into the browser graph, or any excluded-surface recovery, without the B-1…B-7
   rulings above.

RECOMMENDED PROMPT-2 SCOPE (subject to operator ruling on B-1…B-3):
   1. Recover the three UI primitives (S-1…S-3) with the `.js` adapter.
   2. Author the minimum SNAPSHOT read authorities (company, decision-matrix, evidence, replay) as
      current-lineage server modules over computeCertifiedPlatform(); SNAPSHOT only; PIT branch excluded.
   3. Recover CompanyIntelligence + SectorIntelligence with the `.js` adapter, reusing
      CompanyTrustChain / CompanyHeader / DataComponents / DecisionComponents / Badges / StateComponents.
   4. Wire the two routes; set honest navigation status; update the three shell suites honestly.
   5. Author current-lineage node:test suites incl. the 43/40-key observable parity from §6.
   6. Defer AI Advisory (B-4) and PIT vintage (B-7) with explicit, recorded parity loss.
NOT VERIFIED BY THIS PHASE: any runtime behaviour, any parity figure, any visual claim.
```

---

## 10. Appendix — reproducibility

```text
Anchors fetched (no merge, no cherry-pick, no worktree write):
  refs/remotes/tmp/c440  = 42f91fad0ff5141fce665b068b544224ac471f73
  refs/remotes/tmp/c7964 = 7964fccefbf95341699bf56b5833b2432981767d
  refs/remotes/tmp/capt  = 2f1049d0db348733f4d4f15fb4dcc57d4f2742fa
  refs/remotes/tmp/d89   = da4305149bd5495789f893f530edb2526d08bb5b
  refs/remotes/tmp/pr4   = f7cd994f6ebc02f24472783e9567593d2bfce4f5
  (all removed after use; repository refs return to branch + main + origin/*)

Commands used for each claim:
  git cat-file -p <sha>                          commit/tree/parent identity
  git ls-tree -r --name-only <ref>:<dir>         inventories
  git show <ref>:<path>                          bodies (route tables, mappers, imports, dataSource strings)
  git rev-parse <ref>:<path>                     blob identity per file per ref   (§2, §4.1)
  python3 /tmp/depmap.py, /tmp/depmap2.py        import-graph closures (§2.4)  [regex over `from`/`import`/`require`/`import()`]
  diff <(git show HEAD:<p>) <(git show c440:<p>) CompanyHeader adapter proof (§4.2)
  npm run build:vite + bundle greps              browser-boundary evidence (§4.3)
  jq over CAPTURE_MANIFEST.json                  observable inventory (§6)
Throwaway artifacts deleted: dist/, dist-frontend/, /tmp/{manifest.json,depmap.py,depmap2.py,blobcmp.py}
No file under frontend/, src/, tests/, iips-platform/ was modified by this phase.
```

*End of forensic/manifest phase. No implementation performed. Prompt 2 not started automatically.*
