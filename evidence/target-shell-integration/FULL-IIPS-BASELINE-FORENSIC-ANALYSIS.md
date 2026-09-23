# IIPS — Full-Application Baseline Forensic Analysis

**Report ID:** `FORENSIC-IIPS-FULL-APP-BASELINE-2026-09-22`
**Session Branch:** `arena/01a0c960-iips-production-market-data`
**Gate:** Forensic analysis only. No implementation commit. No source modification.

---

## PRELIMINARY: DEPOSITED FORENSIC PACKAGE NOT FOUND

The instruction directs analysis of:

```
evidence/operator_drop/target_application_forensic_20260922/
```

**This directory does not exist.** Neither do any of the seven named artifacts
(`git-status.txt`, `git-head.txt`, `git-branches.txt`, `git-remotes.txt`,
`react-source-inventory.csv`, `application-lineage.log`, SHA-256 records).

### Search performed

| Vector | Result |
|---|---|
| `evidence/operator_drop/` working tree | Exists — 10 files, none forensic (D05/BI-08/3M-A manifests) |
| Filesystem sweep `*target_application*`, `*forensic*`, `*UI-VERIFY*` | 0 hits anywhere on disk |
| Named-file search across whole repo | 0 hits |
| `git ls-tree` across **all 22 remote refs + tags** | 0 hits |
| Full-history added-file scan (`--diff-filter=A`, all refs) | Never existed in any commit |
| `git status --porcelain --ignored` | Only `dist/`, `dist-frontend/`, `node_modules/` |
| GitHub issues / releases / PR#1 comments | Empty |
| Repo `ramkivs/IIPS-Production-Market-Data-UI-VERIFY` | HTTP 404 — does not exist |

**Conclusion:** the deposit was not committed and pushed. Arena sees only the Git remote;
a file placed on the Windows filesystem is invisible unless committed and pushed.

### What this changes

Items **A–G cannot be answered from the operator package.** However, they **can** be
answered — with higher evidentiary quality — from Git objects already on the remote,
because **the full IIPS application is present in this repository's own history.** The
analysis below rests entirely on verifiable Git objects, not on operator assertions.

---

## 1. FULL-IIPS BASELINE CLASSIFICATION

### `FULL IIPS APPLICATION BASELINE PLAUSIBLE — LINEAGE INCOMPLETE`

The full IIPS application **is confirmed to exist** as recoverable Git objects. What is
**not** established is any lineage combining it with the BI implementation.

**Confirmed:** a complete, mature, react-router application shell with 97 `.tsx` files and
20 mounted product surfaces exists at `origin/arena/01a0c440-iips-production-market-data`
(tip `42f91fa`) and on 9 sibling refs.

**Incomplete:** no commit anywhere combines that application with BI-01..BI-08. The two
bodies of work are disjoint. "Recoverable baseline" is therefore true of the *application*
but false of an *integrated* application, which does not yet exist in any object.

`FULL IIPS APPLICATION BASELINE CONFIRMED` is withheld: confirmation would require a
lineage point containing both halves, and no such point exists (§6, finding F).

---

## 2. TARGET-SCREEN CORRELATION

No operator screenshot was deposited, so direct pixel correlation is impossible. The
repository does, however, contain **19 committed PNG captures** of the running full
application (`docs/v3.0/e2e-018-screenshots/`, commit `2f1049d`, reachable from
`origin/m1-ad4-repair`), plus `CAPTURE_MANIFEST.json`.

`executive.png` was rendered and inspected. It shows:

- **Top bar:** `IIPS — Enterprise Investment Intelligence`; Search / Notifications / Notes
  controls; `Tenant: tenant-A`; `Role: admin`; Sign out.
- **Left sidebar:** Executive · Portfolio (Overview) · Research `Partial` (Company, Sector,
  Events, Cross-Sector, Screener, Macro) · Intelligence `Partial` (Decision Matrix;
  Opportunities/Risks/Rankings badged `Future`) · Evidence `Partial` (Decision Evidence) ·
  Administration (8 children) · and below, Collaboration/Reports/Watchlists/Settings.
- **Content:** "Executive" with `✓ CERTIFIED RESULT` and `SNAPSHOT` badges; PORTFOLIO
  HEALTH metric cards (Holdings 13, Avg Conviction 74.2, Avg Quality 71.7, Avg Risk 77.7,
  Concentration 7.7, Diversification 128.3); "Top opportunity: Capital Markets (conviction
  84.6)"; a 13-row Priority Opportunities table with Conviction/Trend.

**Correlation:** this matches the conventional description of the IIPS target screen —
persistent top bar, governed left navigation, executive dashboard. Screenshot pixels
correspond to code in the `c440` family, not to `origin/main`.

**Caveat — this is correlation, not verification.** Without the operator's own screenshot
the match is to the *program's* historical captures. Formal target-screen acceptance
remains an open gate.

---

## 3. APPLICATION SURFACE INVENTORY

Extracted from `frontend/src/app/App.tsx` (declared routes) and `navigation.ts` (nav model)
at `origin/arena/01a0c440-iips-production-market-data`.

### 3.1 Shell architecture (finding A)

`AppShell.tsx` — `TopBar` + `Sidebar` + `<Outlet/>`, with `CommandPalette` (Ctrl/Cmd-K),
`NotificationDrawer`, `NotesDrawer` as sibling overlays; skip-link; role-aware nav via
`SessionContext`. React Router v6 (`react-router-dom ^6.28.0`), lazy-loaded surfaces.

> **Naming note:** components are `TopBar` / `Sidebar` / `AppShell` — **not** `TopNavBar` /
> `LeftSidebar` / `GovernedSurfaceView` as named in the prior session's `798bc548` brief.
> Functionally equivalent, lexically distinct. This is evidence `798bc548` was a *separate,
> later* re-implementation, not this code.

### 3.2 Mounted, reachable routes (finding B)

| Route | Component | Nav status |
|---|---|---|
| `/` → `/executive` | redirect | — |
| `/executive` | `ExecutiveDashboard` | implemented |
| `/portfolio`, `/portfolio/*` | `PortfolioWorkspace` | implemented |
| `/research` | `ResearchHub` | partial |
| `/research/company/:id` | `CompanyIntelligence` | implemented |
| `/research/sector/:id` | `SectorIntelligence` | implemented |
| `/research/events/:id` | `ResearchEvents` | implemented |
| `/research/cross-sector` | `CrossSectorIntelligence` | implemented |
| `/research/macro` | `MacroContext` | implemented |
| `/screener`, `/screener/governed` | `Screener`, `GovernedScreener` | implemented |
| `/search` | `GovernedSearch` | implemented |
| `/intelligence` | `IntelligenceHub` | partial |
| `/intelligence/decision-matrix` | `DecisionMatrix` | implemented |
| `/evidence`, `/evidence/:id`, `/evidence/replay/:id` | `EvidenceHub`, `EvidenceExplorer`, `ReplayExplorer` | partial |
| `/collaboration` | `Collaboration` | implemented |
| `/reports` | `Reports` | implemented |
| `/watchlists` | `Watchlists` | implemented |
| `/settings` | `Settings` | implemented |
| `/admin/*` | `Administration` (8 governed tabs) | implemented |
| `/callback` | `SignInCallback` | — |
| `*` | `FeaturePlaceholder` | — |

20 feature domains: admin, collaboration, company, cross-sector, decision-matrix, evidence,
executive, intelligence, notes, notifications, portfolio, replay, reports, research,
screener, search, settings, shell, watchlists.

Nav entries carry a display-only `status` (`implemented` / `partial` / `future`) — the
codebase is explicit that a nav entry is not a claim of implementation.

---

## 4. GIT LINEAGE FINDINGS (finding D)

| Ref | Tip | Date | `.tsx` |
|---|---|---|---|
| `origin/arena/01a0c440-…` | `42f91fa` | 2026-09-22 09:31 | **97** |
| `origin/arena/01a0a438-…` | `ea00140` | 2026-09-17 08:40 | 97 |
| `tag portfolio-option-a-cb969b6` / `post-cleanup-baseline-b46b4f4` / `temporary-cleanup-caf73ba` | — | — | 95 |
| `origin/arena/01a0bdb5-…` | `97527ea` | 2026-09-21 12:21 | 95 |
| `origin/arena/01a0c86d-…` | `3695d95` | 2026-09-22 13:32 | 94 |
| `origin/arena/01a0ae80-…`, `01a0814b-…`, `windows/d114-stage5…`, `tag p14-r7` | — | — | 94 |
| `origin/m1-ad4-repair` | `ad41b4d` | 2026-09-13 16:53 | 78 (+ 87 `docs/v3.0` incl. screenshots) |
| **`origin/main`** | **`94f519b`** | **2026-09-22 12:50** | **4** |

Shell history: `7325aed` (Phase 12 certified baseline) → `6ef9487` → `d4047e8` (command
palette) → `0e063d3` → `85bbd49` → `4b37e5b` (frontend/ baseline authority) → `8ae69cf`.

**The shell has a long, coherent, multi-phase history. It is authentic program work, not a
synthetic artifact.**

---

## 5. CURRENT-MAIN COMPARISON (finding E)

**Divergence point:** `eae2ff6` — *"chore: align program baseline with IIPS integration
boundary"* (2026-09-08 19:09).

```
git rev-list --left-right --count origin/main...origin/arena/01a0c440-…
56      192
```

56 commits main-only; 192 commits full-app-only; **never reconverged.**

| | `origin/main` (BI lineage) | `c440` (full-app lineage) |
|---|---|---|
| Total files | 244 | 1,177 |
| `.tsx` files | 4 | 97 |
| App shell | none (single-file tab state) | `AppShell` + `TopBar` + `Sidebar` |
| Routing | none | react-router-dom v6 |
| Build | root `tsc && vite build`, vite 8 | `frontend/` tsc -b + vite 5 |
| Tests | `node --test` (360) | `vitest` |
| Source root | `src/` + `frontend/src/` | `frontend/`, `iips-platform/`, `p05..p14`, `d114/` |
| Server transports | none | `frontend/server/**` (HTTP, OIDC, live certification) |

**Only 20 paths are common; only 3 are source:** `frontend/src/app/App.tsx`,
`frontend/src/features/portfolio/PortfolioWorkspace.tsx`, `frontend/src/main.tsx`.

`PortfolioWorkspace.tsx` blobs: `3d09c97…` (c440) vs `82cd8a9…` (main) — **same path,
unrelated implementations.** c440's version fetches from `/api/portfolio` over an HTTP
transport; main's version is an offline broker-ingestion workspace over `PortfolioStore`.
They share a filename and nothing else.

### BI-critical asset distribution

| Asset | `c440` (full app) | `origin/main` (BI) |
|---|---|---|
| Broker adapters (zerodha/groww/dhan) | **0** | 28 |
| `ALREADY_IMPORTED_NO_OP` (BI-08) | **0** | 3 |
| GREENPAC identity | **0** | 12 |
| AIIL identity | 0 (1 false positive in `package-lock.json`) | 12 |
| 2,250 security master | partial refs | 13 |
| D114 modules | 7 (`d114/src/d114/`) | 8 (`src/d114/`, +`pit_ingestion_loader.ts`) |

**The full-app branch contains none of Workstream BI.**

---

## 6. 798BC548 RECOVERY STATUS

### `NOT RECOVERED — OBJECT DOES NOT EXIST`

Re-verified this session: `git cat-file -t 798bc548…` → *"Not a valid commit name."*
`git ls-remote` across 22 refs → absent. Prior session exhausted 11 retrieval vectors.

**No claim of recovery is made.** The `c440` shell is **not** `798bc548`: different
component names (`TopBar`/`Sidebar`/`AppShell` vs `TopNavBar`/`LeftSidebar`/
`GovernedSurfaceView`), different lineage, and it lacks the BI integration `798bc548` was
said to have. It is a **different and older** application, and a candidate *substitute*
baseline — not a recovery.

### Finding F — historical integration point: **NONE EXISTS**

Tested across all 22 refs (`AppShell` × `bi08_idempotent` × adapters × sec-master × d114):

```
AppShell=1 AND BI08=1  →  ZERO REFS
```

Every ref with `AppShell` has `BI08=0`; every ref with `BI08` has `AppShell=0`. The two
halves of IIPS **have never coexisted in any commit in this repository's history.**

---

## 7. BI PRESERVATION REQUIREMENTS

All ten are currently satisfied **only** on `origin/main`, and **none** are present on the
full-app branch. Any integration must treat `origin/main` as the authority for these.

| # | Requirement | Authority | Present on c440 |
|---|---|---|---|
| 1 | BI-01..BI-08 | `origin/main` | NO |
| 2 | Broker ingestion | `frontend/src/features/portfolio/import/**` (5 adapters) | NO |
| 3 | Multi-broker consolidation | `portfolio-store.ts` atomic merge | NO |
| 4 | BI-08 duplicate no-op | `ALREADY_IMPORTED_NO_OP` (3 sites) | NO |
| 5 | AIIL current/historical identity | `src/identity/**` (12 sites) | NO |
| 6 | AGI GREENPAC identity | `src/identity/**` (12 sites) | NO |
| 7 | Unresolved identity fail-closed | `companyId=""`, no fabrication | NO |
| 8 | 2,250 security master | `src/identity/d05_broad_universe_data.ts` | NO |
| 9 | D114 historical capability | `src/d114/**` (8 modules) | partial (7, no `pit_ingestion_loader`) |
| 10 | Production fail-closed boundary | G-034 held; 0 providers, 0 sockets | **AT RISK** |

### Requirement 10 — material risk

The full-app branch ships `frontend/server/**`: HTTP transports, `real-oidc-verifier.ts`,
`keycloak-provision.mjs`, `live/` certification suites, and `authFetch.ts`. `origin/main`
has **zero** network surface.

Adopting the full app wholesale would import a live-capable server tier into a
fail-closed non-production baseline. This is **directly contrary** to "no providers,
sockets, credentials, or live data," and must be gated, not inherited.

---

## 8. RECOMMENDED INTEGRATION PATH

**Do not merge branches.** A 192-commit merge across incompatible toolchains, with 3
colliding source files and a live server tier, is high-risk and would jeopardise a
certified BI baseline.

### Recommended: port the shell onto `main` (shell-forward, BI-authoritative)

`origin/main` stays the base. Port the *shell only* from `c440`, mounting main's existing
BI surfaces inside it. Rationale:

1. **BI is certified and irreplaceable** (360/360, tsc, vite, Windows visual acceptance).
   It must never be rebased under a foreign tree.
2. **The shell is presentation-only** and the cheap half to move.
3. **The server tier is excluded by construction** — the boundary stays intact.
4. It reproduces the target screen without importing 933 unrelated files.

### Explicitly rejected

| Option | Why rejected |
|---|---|
| Merge `c440` → `main` | 192 commits, 2 build systems, 2 test runners, live server tier |
| Rebase BI onto `c440` | Puts certified BI at risk; re-validation of everything |
| Adopt `c440` as new main | Silently drops all 10 BI requirements |
| Reconstruct `798bc548` | Object gone; would be new work misrepresented as recovery |

### Sequencing

1. Port `AppShell` / `TopBar` / `Sidebar` / `navigation.ts` (adapted, no `react-router` at
   first — or add it as the single new dependency).
2. Mount main's `ExecutiveDashboard`-equivalent and `PortfolioWorkspace` (BI version, unchanged).
3. Route remaining nav entries to an honest `FeaturePlaceholder` with `future` status —
   **do not** claim surfaces that lack BI-side implementations.
4. Re-validate: 360/360 (+ new shell tests), tsc, vite. Zero providers/sockets.
5. Windows visual acceptance against the operator's target screen.

---

## 9. EXACT FILE/MODULE SCOPE

### 9.1 Port from `origin/arena/01a0c440-…` (presentation only)

| Source | Destination | Note |
|---|---|---|
| `frontend/src/app/AppShell.tsx` | `frontend/src/app/AppShell.tsx` | NEW |
| `frontend/src/app/TopBar.tsx` | `frontend/src/app/TopBar.tsx` | NEW |
| `frontend/src/app/Sidebar.tsx` | `frontend/src/app/Sidebar.tsx` | NEW |
| `frontend/src/app/navigation.ts` | `frontend/src/app/navigation.ts` | NEW — prune to real surfaces |
| `frontend/src/app/Sidebar.test.tsx`, `navigation.test.ts` | same | NEW — adapt to `node --test` |
| `frontend/src/components/shell/ShellStates.tsx` | same | OPTIONAL |
| `frontend/src/features/shell/CommandPalette.tsx` | same | OPTIONAL (defer) |

### 9.2 Modify on `origin/main` (3 files only)

| File | Change |
|---|---|
| `frontend/src/app/App.tsx` | Replace 4-tab state with shell + routing; **preserve** `portfolioStore`/`securityMaster` singletons (Tier-B session continuity) |
| `frontend/src/index.css` | Add `.app-shell`, `.app-topbar`, `.app-sidebar`, `.app-main`, `.skip-link` |
| `package.json` | Add `react-router-dom` **only if** routing is adopted |

### 9.3 FROZEN — must not be touched

```
src/identity/**                          (AIIL, GREENPAC, fail-closed, 2,250 master)
src/d114/**                              (D114 — explicitly out of scope)
frontend/src/features/portfolio/import/**        (BI-03..BI-06 adapters)
frontend/src/features/portfolio/portfolio-store.ts (BI-07 merge, BI-08 no-op)
frontend/src/features/portfolio/PortfolioWorkspace.tsx
frontend/src/features/portfolio/BrokerImportModal.tsx
tests/**                                 (360 certified tests)
evidence/**                              (operator deposits, read-only)
```

### 9.4 Must NOT be imported

```
frontend/server/**            HTTP transports, OIDC, Keycloak, live certification
frontend/src/api/**           authFetch + live API clients
iips-platform/**, p05..p14/**, d114/**, program-v1.1-certification/**
c440's frontend/src/features/portfolio/PortfolioWorkspace.tsx   ← would overwrite BI work
c440's frontend/package.json, vite/tsconfig                     ← conflicting toolchain
```

---

## 10. NEXT EXECUTABLE ACTION

The forensic gate is closed with classification
**`FULL IIPS APPLICATION BASELINE PLAUSIBLE — LINEAGE INCOMPLETE`**. Two decisions are
required before implementation.

### Decision 1 — is `c440` the intended target application? (BLOCKING)

Components are named `TopBar`/`Sidebar`/`AppShell`, not `TopNavBar`/`LeftSidebar`/
`GovernedSurfaceView`. Either (a) `c440` is the real target and the `798bc548` brief used
different names, or (b) `798bc548` was a distinct shell now permanently lost. These lead to
different work. **Operator must confirm against the target screenshot.**

Fastest resolution: commit the target screenshot to the repo, or compare it against
`docs/v3.0/e2e-018-screenshots/executive.png` (commit `2f1049d`) — already reproduced in §2.

### Decision 2 — routing dependency

Adopt `react-router-dom` (faithful to `c440`, one new dependency), or reproduce the shell
over main's existing state-based tabs (zero dependencies, slight visual divergence)?

### If the operator still wants the forensic package analysed

It must be **committed and pushed**, not merely placed on disk:

```powershell
cd <windows-repo>
git checkout -b evidence/target-application-forensic-20260922
mkdir -p evidence/operator_drop/target_application_forensic_20260922
# copy the 7 artifacts in
git add evidence/operator_drop/target_application_forensic_20260922
git commit -m "evidence: deposit target application forensic package 20260922"
git push origin evidence/target-application-forensic-20260922
```

If `IIPS-Production-Market-Data-UI-VERIFY` holds unpushed history (it is **not** on GitHub —
404), preserve it before anything else:

```powershell
cd G:\IIPS-Production-Market-Data-UI-VERIFY
git bundle create ui-verify-full.bundle --all
```

> **Standing caution:** `798bc548` may survive only on a Windows host. Do not run
> `git reset --hard`, `git clean -fdx`, or `git gc --prune` on any IIPS working copy until
> bundles are captured.

### Gate status

- `GATE-WINDOWS-TARGET-SHELL-VISUAL-ACCEPTANCE` — **NOT ENTERED**
- D114 — untouched · G-034 — not executed · Production — blocked
- No implementation commit created; no source modified; deposited evidence unmodified
