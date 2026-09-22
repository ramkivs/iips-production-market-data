# FULL IIPS + BI-08 CONVERGENCE PLAN

**Gate:** `FULL-IIPS-SHELL-TO-MAIN-BI-CONVERGENCE-PLAN`
**Artifact ID:** `PLAN-IIPS-FULLAPP-BI08-CONVERGENCE-2026-09-22`
**Type:** Forensic / architecture planning gate. **No source modified. No implementation.**
**Session branch:** `arena/01a0c960-iips-production-market-data`
**Companion:** `docs/FULL_IIPS_BI08_CONVERGENCE_FILE_MATRIX.md`

---

## 1. EXECUTIVE SUMMARY

Convergence to ONE IIPS application is **feasible**, but not by the route the phrasing
"recover the full-IIPS application" implies. The decisive new finding of this gate:

> **33 of 34 full-IIPS feature surfaces are hard-coupled to `authFetch → /api/*`, served by
> `frontend/server/**` and gated by a Keycloak OIDC provider.**

The full-IIPS application is **not** an offline product that happens to ship a server. It is
a **client of a server tier**. Its product surfaces cannot be "ported" without either
(a) importing the excluded server/auth tier, or (b) re-sourcing each surface onto offline
governed data.

This reframes the work. The convergence is **not** "copy 97 `.tsx` files onto main." It is:

1. **Port the shell** — genuinely portable (small, presentation-only, 1 coupling to sever).
2. **Port the presentation kit** — 11 of 15 base components are API-pure and reusable.
3. **Mount BI Portfolio into the shell** — additive, zero BI risk.
4. **Re-source each remaining surface individually** — the real cost, deferred and gated.

### What makes this tractable

Three findings materially de-risk the work:

- **Only 3 source paths collide** across 1,177 vs 244 files — and all 3 are shell-layer
  files, none of them BI logic.
- **Both lineages descend from the same FINAPP handoff (`b97b103`)** — the broker-import
  contracts are cousins, not strangers. `main` is strictly the more advanced descendant.
- **`SessionContext` is inert by design** ("Does not perform auth") — so role-aware
  navigation ports without importing OIDC. Only `TopBar`'s `useAuth` import must be severed.

### What the plan deliberately refuses

Mounting empty Research/Intelligence/Evidence/Admin surfaces to make the app *look* like the
target screenshot would fabricate functionality. Phase 2 mounts them as honest, explicitly
badged `future` placeholders — the historical `navigation.ts` already carries an
`implemented | partial | future` status field for exactly this purpose, and its authors
wrote: *"A navigation entry existing does NOT mean its module is fully implemented."* That
governance intent is preserved.

### Classifications (full set in §21)

| Axis | Result |
|---|---|
| Full-IIPS baseline | **CONFIRMED** (upgraded from PLAUSIBLE) |
| BI-08 integration | **DIRECT** (additive mount; zero BI files touched) |
| Eventual full convergence | **FEASIBLE WITH CONTROLLED RECONCILIATION** |
| `798bc548` | **NOT RECOVERED** |
| Server/live tier | **EXCLUDE FROM CURRENT CONVERGENCE** |

---

## 2. CURRENT STATE

Measured this session at `origin/main` = `94f519b`:

```
TESTS      : 360/360 PASS (39 files, 54 suites, 0 fail, 0 skipped, 0 todo)
TYPECHECK  : tsc PASS
BUILD      : vite build PASS (40 modules)
WORKTREE   : CLEAN
PROVIDERS  : 0     SOCKETS: 0     MODE: NON_PRODUCTION
```

### 2.1 Durability model validated in-session

Mid-gate, the sandbox was re-provisioned: the local branch reverted to `94f519b` while the
two prior reports survived **only because they had been pushed**. Recovery was a clean
fast-forward to `a34b6c4`, with both files verified byte-identical to their committed blobs
(`git hash-object` == `git rev-parse <sha>:<path>`).

This is the `798bc548` failure mode reproduced live and survived. It is the empirical basis
for the mandatory push-per-phase rule in §16.

---

## 3. FULL-IIPS BASELINE (TASK A)

### 3.1 Elected baseline

```
BASELINE SHA : 8b109681  (frontend/src content authority)
REF          : origin/arena/01a0c440-iips-production-market-data
TIP          : 42f91fad0ff5141fce665b068b544224ac471f73  (2026-09-22 09:31 +0000)
STRUCTURE    : 1,177 files · 97 .tsx · 182 test files
```

**Two SHAs, deliberately.** The branch tip `42f91fa` is the citation anchor (reproducible ref
state), but its last 11 commits touch **zero** `frontend/src` files — they are D-PIT-WIRE-01
and D115 evidence/docs work. The last commit that actually changed application source is
`8b10968` (2026-09-21 15:20). **`8b10968` is the content authority; `42f91fa` is the ref
anchor.** Any extraction should read blobs at `42f91fa` (identical for `frontend/src`) and
cite `8b10968` as provenance.

### 3.2 Why `c440` and not a sibling

The 97-`.tsx` branches are **divergent siblings, not one line.** All pairwise merge-bases
converge on `da43051` (*D89: global UI12 data-mode propagation*, 2026-09-15 07:27):

| Pair | Merge base | Divergence |
|---|---|---|
| `c440` ↔ `a438` | `da43051` | 15 / 39 |
| `c440` ↔ `c86d` | `da43051` | 15 / 9 |
| `a438` ↔ `c86d` | `da43051` | — |

`c440` is **not** a superset — `a438` has *more* files (1,200 vs 1,177) and more tests
(190 vs 182). Selection rationale:

1. **Shell blobs are identical across all three** — `AppShell.tsx` `e05b823f`,
   `navigation.ts` `f72e3809`, `App.tsx` `1e6dde58`. **For the shell-port scope, the choice
   is immaterial.** This is the single most reassuring finding in Task A: the deliverable of
   Phase 1 is byte-identical whichever sibling is chosen.
2. `c440` has the **most recent** `frontend/src` change (`8b10968`, 09-21) vs `a438`
   (`b75badb`, 09-15) and `c86d` (`da43051`, 09-15).
3. `c440` carries D114/PIT integration boundary work, making its exclusion boundaries
   explicit rather than implicit.

### 3.3 Lineage range

No single commit is fully authoritative for a *converged* app (none exists — §5). The
authoritative range for the **historical application** is:

```
eae2ff6 (2026-09-08, divergence)  ..  8b10968 (2026-09-21, last src change)
   observed via ref 42f91fa
```

### 3.4 Baseline properties

| Property | Value |
|---|---|
| Router | `react-router-dom ^6.28.0`, `<Routes>`/`<Route>`, lazy surfaces |
| Shell | `AppShell` = `TopBar` + `Sidebar` + `<Outlet/>` + 3 overlays |
| Entry | `main.tsx` → `BrowserRouter` → **`AuthProvider` (Keycloak OIDC)** → `App` |
| Build | `tsc -b && vite build`, Vite **5**, `outDir: dist` |
| tsconfig | ES2020, `moduleResolution: bundler`, `noEmit`, `allowImportingTsExtensions` |
| Tests | **Vitest** + jsdom + Testing Library, `src/test/setup.ts` |
| Data | `authFetch` → `/api/*`, vite proxy → `http://localhost:8787` |
| Server | `frontend/server/**` — transports, OIDC verifier, Keycloak provisioning, live certification |

---

## 4. CURRENT-MAIN BI BASELINE (TASK C)

### 4.1 Verified present at `origin/main`

| Item | Evidence |
|---|---|
| BI-03/04/05 contracts | `frontend/src/features/portfolio/import/types.ts` (BI-03/04/05 headers) |
| BI-04 adapters | `zerodha-`, `dhan-`, `groww-holdings-adapter.ts`, `csv-parser-helper.ts` |
| BI-04 detector | `broker-format-detector.ts`, incl. `DHAN_WEB_UI_SUMMARY_V1` |
| BI-05 ingress | `broker-import-ingress.ts` — `DETECT → QUALIFICATION_CHECK → PARSE → NORMALIZE → VALIDATE` |
| BI-07 host/UI | `PortfolioWorkspace.tsx` (352 L), `BrokerImportModal.tsx`, `ui-broker-import-view-model.ts` |
| BI-08 idempotency | `portfolio-store.ts` → `ALREADY_IMPORTED_NO_OP`; `tests/bi08_idempotent_ingress.test.ts` |
| D05 master | `src/identity/d05_broad_universe_data.ts`; SHA-256 `7f53540b…4b74b5` pinned in e2e |
| Identity | `security_master.ts`, `governed_fixture_master.ts`, `mapping_store.ts`, `quarantine.ts` |
| D114 | `src/d114/**` — 8 modules incl. `pit_ingestion_loader.ts` |

### 4.2 BI-06 status

**BI-06 (XLSX binary governance) has no dedicated module or test file on `main`.** The
release manifest lists it closed; `types.ts` declares `BrokerFileFormat = 'CSV' | 'XLSX' |
'JSON' | 'UNKNOWN'`. Treat BI-06 as **governance-closed, format-declared** — not as a
portable code asset. Flagged as Open Question OQ-4.

### 4.3 Identity values verified in source

| Fact | Location |
|---|---|
| AIIL current BSE `543989` | `d05_broad_universe_data.ts:701,722` |
| AIIL historical BSE `539177` | `d05_broad_universe_data.ts:730` |
| AGI `companyId: "EQ_AGI_IN"` | `d05_broad_universe_data.ts:738` |
| `AGI GREENPAC` exact alias | `governed_fixture_master.ts:145-149` |
| Both resolve to `EQ_AIIL_IN` / `EQ_AGI_IN` | `e2e_…test.ts` Phase 5, Phase 6 |

### 4.4 Toolchain

Root `package.json`: `build: tsc && vite build`, `test: node --test dist/tests/*.test.js`.
Vite **8**, `outDir: dist-frontend`, `host: 0.0.0.0`. tsconfig: ES2022, **NodeNext**,
`declaration: true`, includes `src/`, `tests/`, `frontend/`. **No frontend test files**
(`git ls-tree | grep -c 'frontend.*\.test\.'` → 0) — all 360 tests are Node-side.

---

## 5. HISTORICAL LINEAGE & DIVERGENCE

```
                      eae2ff6  2026-09-08 19:09
            "align program baseline with IIPS integration boundary"
                             │
          ┌──────────────────┴───────────────────┐
          │                                      │
   FULL-IIPS LINEAGE                       BI LINEAGE
   192 commits                             56 commits
          │                                      │
     da43051 (D89) ── sibling fan-out       005f7324 (PR #1)
     ├── a438 (1200 f)                           │
     ├── c86d (1116 f)                      94f519b  origin/main
     ├── bdb5 (1134 f) ← BI-03 attempt       [BI-01..BI-08 + D05]
     └── c440 (1177 f) ← BASELINE
          └── 8b10968 last src change
```

**`AppShell` and `BI08` are mutually exclusive across all 22 refs — zero overlap.** No
pre-existing combined branch exists.

### 5.1 New finding — `bdb5` is a prior convergence attempt

`origin/arena/01a0bdb5` commit `97527ea` (*"feat(portfolio): BI-03 FINAPP broker-adapter
foundation contracts"*, 2026-09-21) added **973 lines of BI-03 into the full-app tree**:
`import/{types,mapper,compatibility,index}.ts` + tests, plus
`docs/broker-import/finapp-reuse-handoff/**` (BI-02 deposit, incl. Zerodha/Dhan/Groww
adapters as *documents*).

**This is the only known attempt to converge BI into the full app, and it stopped at BI-03.**
It never reached BI-04 adapters, BI-05 ingress, BI-07 UI, or BI-08 idempotency.

Its significance is not as a merge candidate — it is **behind** `main` — but as proof of
**shared provenance**: both lineages cite the same handoff commit `b97b103` from
`ramkivs/finapp` (WP-FB-IMPORT-BROKER-01). `main`'s `types.ts` is the strictly more advanced
descendant (BI-03/04/05 vs BI-03 only; `FinappBrokerType` with `GENERIC|UNKNOWN` vs
`BrokerKind`; Dhan variants; `IngressStage`).

**Consequence:** the broker-import contracts are not architecturally alien across lineages.
They are the same design at two maturity levels, and `main` holds the later one.

---

## 6. SURFACE INVENTORY (TASK B)

### 6.1 Layer classification

| Layer | Count | Convergence disposition |
|---|---|---|
| PRESENTATION/SHELL | 4 + 3 overlays | **PORT** (Phase 1) |
| PRESENTATION KIT (API-pure) | 11 of 15 | **PORT** (Phase 1) |
| PRESENTATION KIT (API-coupled) | 4 of 15 | **DEFER** |
| PRODUCT FEATURE | 34 (**33 API-coupled**) | **DEFER / re-source** |
| DATA/STATE (`api/**`) | ~14 | **EXCLUDE** |
| SERVER/TRANSPORT (`frontend/server/**`) | large | **EXCLUDE** |
| AUTHENTICATION (`core/auth/**`) | 4 modules | **EXCLUDE** |
| PRODUCTION INFRA (Keycloak, live/) | — | **EXCLUDE — G-034** |

### 6.2 Shell (portable)

| Path | Role | Deps | Port |
|---|---|---|---|
| `app/AppShell.tsx` | Layout + Ctrl/Cmd-K + overlays | `Sidebar`, `TopBar`, `useSession`, 3 overlays | YES (drop overlays P1) |
| `app/TopBar.tsx` | Header, tenant/role, actions | `core/session/session`, **`useAuth`** | YES — **sever `useAuth`** |
| `app/Sidebar.tsx` | Governed nav + status badges | `react-router NavLink`, `navigation`, `useSession` | YES |
| `app/navigation.ts` | `NAV` model, `visibleNav(role)`, status | `core/session/session` (type only) | YES — prune |
| `core/session/SessionContext.tsx` | **Inert** session ctx | react only | YES |
| `core/session/session.ts` | `Role`, `Session`, `ANONYMOUS_SESSION` | none | YES |
| `components/shell/ShellStates.tsx` | Shell empty/error states | pure | YES |

`TopBar` uses exactly `const { status, logout } = useAuth();` — a **two-symbol** coupling.

### 6.3 Presentation kit — 11 API-pure (PORT)

`components/{ui/Badges, data/DataComponents, decision/DecisionComponents, viz/ChartFoundations,
state/StateComponents, interaction/InteractionComponents, evidence/EvidenceComponents,
evidence/EvidenceExplorerComponents, evidence/Ad17Disclosure, company/CompanyHeader,
shell/ShellStates}.tsx`

### 6.4 Presentation kit — 4 API-coupled (DEFER)

`ai/AiExplanation`, `provenance/P12Provenance`, `state/DataModeUnavailable`,
`state/PitVintagePanel`.

### 6.5 Product surfaces — 33 of 34 API-coupled (DEFER)

All of Executive, Portfolio(hist), Research/Company/Sector/Events/Macro, Cross-Sector,
Screener, Search, Intelligence, Decision Matrix, Evidence/Explorer/Replay, Collaboration,
Reports, Watchlists, Settings, Notifications, Notes, CommandPalette depend on
`../../api/*` → `authFetch` → `/api/*`.

**The sole exception:** `features/admin/Administration.tsx` is API-pure (a tab router; its 8
children are coupled).

**`ExecutiveDashboard.tsx` imports 3 API clients** (`executive`, `evidence`, `replay`) +
`dataMode`. It is **not** portable as-is — the screenshot's Executive surface is server-fed.

---

## 7. COLLISION MAP (TASK D)

Re-verified at source level. **Exactly 3 source collisions** among 20 common paths
(17 are `evidence/d114*` JSON + 3 root binaries/`.gitignore`).

| Path | full-IIPS | main | Class | Action |
|---|---|---|---|---|
| `frontend/src/app/App.tsx` | `1e6dde58` 99 L | `b69ded97` 153 L | **ROUTING + STATE-MANAGEMENT** | REQUIRES ADAPTER — rewrite P2 |
| `frontend/src/features/portfolio/PortfolioWorkspace.tsx` | `3d09c975` 228 L | `82cd8a9a` 352 L | **DATA-MODEL + TRUE LOGIC** | **MUST REMAIN CURRENT-MAIN** |
| `frontend/src/main.tsx` | `2367d065` 24 L | `e74978d8` 21 L | **SECURITY/BOUNDARY** | MUST REMAIN CURRENT-MAIN (+`BrowserRouter` only) |

### Detail

**`main.tsx` — the security-critical collision.** Full-IIPS wraps `<AuthProvider>` (Keycloak
OIDC) around the app and imports `core/theme/global.css`; main renders `<App/>` with
`index.css`. Adopting the historical file would boot an OIDC client into a fail-closed
offline build. **Only** `<BrowserRouter>` may be adopted, and only if Phase 2 elects routing.

**`App.tsx` — routing + state.** Full-IIPS: `<Routes>` under `<AppShell>`, lazy surfaces,
no app-level state. Main: `useState<'portfolio'|'executive'|'replay'|'sec_master'>` plus
**`useMemo` singletons for `PortfolioStore` and `SecurityMaster`** — the Tier-B
session-lifetime owner (established by `663dd9e`, *"application-session lifetime state
ownership … across top-level surface navigation"*). Those singletons are **load-bearing for
BI-08**: they must survive the rewrite, hoisted above the router.

**Toolchain collisions** (no shared path, still blocking): Vite 5 vs 8; ES2020/bundler/noEmit
vs ES2022/NodeNext/declaration; Vitest vs `node --test`; `dist` vs `dist-frontend`.

---

## 8. PORTFOLIOWORKSPACE RECONCILIATION (TASK E)

| Dimension | Historical (228 L) | Current BI (352 L) |
|---|---|---|
| Provenance | Program v3.0 Phase 6 / N+8 | BI-07 React DOM Host Integration |
| Props | none | `portfolioStore?`, `securityMaster?`, `portfolioId?` |
| State | `PortfolioData`, sort, selected sector, chain evidence/replay | `PortfolioRecord`, analytics, modal, save result |
| Data source | `fetchPortfolioData()` → `/api/portfolio` | `PortfolioStore` (in-memory, offline) |
| Model | sector-weighted holdings, conviction/quality/risk | broker holdings, `companyId`, provenance, contributions |
| Identity | server `portfolio-resolver.ts` (canonicalSecurityId/FIGI, p12 contract) | `SecurityMaster` (`companyId`, `EQ_*`, D05 2,250) |
| Ingestion | none | Zerodha/Dhan/Groww + BI-08 dedup |
| Routing | `/portfolio`, `/portfolio/*` | none (tab) |

**They share a filename and nothing else.** Unrelated blobs, unrelated data models, two
incompatible identity authorities (`canonicalSecurityId` vs `companyId`).

### Answers to the mandatory questions

**Q: Can the historical PortfolioWorkspace become the shell around the current BI one?**
**No — and it should not.** It is a *sibling surface*, not a container. The correct container
is `AppShell` + `<Outlet/>`. Nesting one workspace inside another would drag in
`/api/portfolio` and the server resolver.

**Q: Can the current BI PortfolioWorkspace mount at the Portfolio route without losing
full-IIPS navigation?**
**Yes — this is the recommended integration.** It already accepts injectable
`portfolioStore`/`securityMaster` props, so it mounts unchanged at `/portfolio` as a route
element. Navigation is owned by `Sidebar`/`navigation.ts`, which are independent of it.
**Zero BI files change.** This is why BI-08 integration classifies **DIRECT**.

**Q: Which shared components should be extracted?**
None from the historical workspace initially (all bind `PortfolioData`). Later, the API-pure
kit (`DataTable`, `MetricCard`, `Badges`, `ChartFoundations`) can restyle the BI workspace —
**Phase 5, presentation-only, no data-model change.**

**Q: Which implementation is authoritative for broker ingestion?**
**Current main, unambiguously.** The historical lineage has zero adapters
(`zerodha|groww|dhan` → 0 hits); `bdb5` reached only BI-03 contracts.

**Q: What adapter is required?**
For mounting: **none**. The props interface is already the adapter. An `IdentityResolution`
port is required only if historical surfaces are later re-sourced (Phase 5) — deferred.

**Disposition:** BI `PortfolioWorkspace.tsx` is **FROZEN**. Historical version is
**NOT PORTED** (retained as reference for Phase 5 restyling only).

---

## 9. ROUTING & SHELL CONVERGENCE (TASK F)

### 9.1 Target route tree (end-state, honesty-preserving)

```
main.tsx  → [BrowserRouter] → App
  App: hoists PortfolioStore + SecurityMaster singletons (Tier-B, BI-08 critical)
   └── <AppShell>  TopBar + Sidebar + <Outlet/>
        ├── /                      → redirect /executive
        ├── /executive             → P2 placeholder(future) → P5 offline exec
        ├── /portfolio             → ** BI PortfolioWorkspace (UNCHANGED) **  ← authoritative
        ├── /portfolio/*           → same
        ├── /replay                → main's existing replay surface
        ├── /sec-master            → main's existing security-master surface
        ├── /research/**           → placeholder(future)
        ├── /intelligence/**       → placeholder(future)
        ├── /evidence/**           → placeholder(future)
        ├── /admin/**              → placeholder(future)
        ├── /reports /watchlists /settings /collaboration → placeholder(future)
        └── *                      → FeaturePlaceholder
```

### 9.2 BI surface placement

| Nav entry | Phase 2 status | Eventual |
|---|---|---|
| **Portfolio** | **implemented** — BI workspace | BI workspace (authoritative) |
| Executive | future | offline exec over `PortfolioStore` |
| Replay / Security Master | implemented (main's tabs) | as-is |
| Research / Intelligence / Evidence / Admin / Reports / Watchlists / Settings / Collaboration | **future** | per-surface authority |

### 9.3 Routing decision (blocking — OQ-1)

**Option A — adopt `react-router-dom` (recommended).** Faithful to historical `Sidebar`
(`NavLink`) and `AppShell` (`<Outlet/>`); deep links work; 1 runtime dependency.

**Option B — state-based shell.** Zero dependencies, but `Sidebar`/`AppShell` must be
rewritten (they *are* the port deliverable), and no deep-linking.

Recommend **A**: it preserves the ported code as-authored, which is the point of porting.

---

## 10. SERVER / AUTH / LIVE BOUNDARY (TASK G)

| Component | Classification | Rationale |
|---|---|---|
| `frontend/server/**` (all transports) | **EXCLUDE** | Introduces HTTP listeners; breaks 0-sockets |
| `frontend/server/live/**` | **REQUIRES SEPARATE AUTHORITY** | Live certification — **G-034** |
| `live/keycloak-provision.mjs` | **EXCLUDE** | Production credential provisioning |
| `live/real-oidc-verifier.ts` | **EXCLUDE** | Production identity |
| `core/auth/{AuthProvider,oidcClient,keycloakAdapter,authContract}` | **EXCLUDE** | OIDC/PKCE client |
| `api/authFetch.ts` | **EXCLUDE** | Authenticated fetch wrapper |
| `api/*.ts` (14 clients) | **PORT ONLY AS INTERFACE** | Types reusable; fetch bodies not |
| `server/portfolio/portfolio-resolver.ts` | **DEFER** | **Conflicts** with `SecurityMaster` (§12) |
| `server/data-mode/**` | **DEFER** | Useful concept; server-bound |
| `core/session/**` | **SAFE TO PORT** | Inert by construction |
| `core/theme/**`, `core/tokens/**` | **SAFE TO PORT** | CSS/tokens only |
| `components/**` (11 pure) | **SAFE TO PORT** | No API imports |
| `app/{AppShell,TopBar,Sidebar,navigation}` | **SAFE TO PORT** | After severing `useAuth` |
| `vite.config` `/api` proxy → `:8787` | **EXCLUDE** | Would wire the app to a server |
| `iips-platform/`, `p05..p14/`, `program-v1.1-certification/` | **EXCLUDE** | Out of scope |

**Invariant:** after every phase — 0 providers, 0 sockets, 0 credentials, non-production,
fail-closed. Verified by build output + absence of `frontend/server/**`.

---

## 11. BI-08 PRESERVATION CONTRACT (TASK H)

Must hold after **every** phase. Source: `tests/bi08_idempotent_ingress.test.ts` (AC-01..08)
and `tests/e2e_broad_universe_multi_broker_integration.test.ts` (Phases 1-10).

| # | Invariant | Authority |
|---|---|---|
| 1 | Duplicate identical CSV → `isDuplicate=true`, `disposition='ALREADY_IMPORTED_NO_OP'` | AC-01 :77-78 |
| 2 | Re-import does not double value/holdings | AC-01 :81-83 |
| 3 | Provenance digest invariant on duplicate | AC-02 :117 |
| 4 | Contribution ledger stays length 1 | AC-03 :151 |
| 5 | Distinct brokers consolidate; ledger = 3; count 3+4+2=9 | AC-04 :199-203 |
| 6 | Weight sum exactly `100.0000%` | AC-04 :202 |
| 7 | UI reports "Duplicate File Ignored" | AC-05 :220 |
| 8 | `REPLACE` bypasses dedup, resets state | AC-06 :244-246 |
| 9 | Non-prod bypass: `identityStatus='UNRESOLVED'`, `companyId=''`, zero fabricated IDs | AC-07 :270-271 |
| 10 | Production fails closed: `disposition='REJECTED'`, 0 holdings | AC-08 :283-284 |
| 11 | AIIL `543989`/`539177` → `EQ_AIIL_IN` | e2e Phase 5 |
| 12 | `AGI GREENPAC` exact alias → `EQ_AGI_IN`, no fuzzy | e2e Phase 6 |
| 13 | D05 byte-identical, SHA-256 `7f53540b…4b74b5`, 2,250 records | e2e Phase 1 |
| 14 | Unmapped/malformed fail closed, no partial contamination | e2e Phase 10 |

### 11.1 The 82 + 66 = 148 invariant — provenance caveat

**This is Windows visual-acceptance evidence, not a coded assertion.** It appears only in
`evidence/operator_drop/windows_bi08_visual_acceptance_manifest.json`
(`consolidatedHoldingsCount: 148`, *"Zerodha (82) + Dhan Web UI (66) … 148 … exactly
100.0000%"*). The in-repo automated equivalent is AC-04's 3+4+2=9.

**Implication:** 82+66=148 is **only re-verifiable on the Windows host with the operator's
real broker files.** It must be re-asserted at the Phase 8 Windows gate, and **cannot** be
claimed by Arena-side `npm test`. Recorded as a Windows-only acceptance criterion.

---

## 12. D05 / IDENTITY PRESERVATION CONTRACT (TASK I)

Frozen: `src/identity/**` (6 modules), the 2,250-record D05 package and manifest,
`resolveCompanyId` semantics, non-production operator bypass, production fail-closed.

### 12.1 Identity-model conflict — MUST NOT be silently reconciled

| | Current main (**AUTHORITATIVE**) | Historical full-IIPS |
|---|---|---|
| Internal id | `companyId` (`EQ_AGI_IN`) | `canonicalSecurityId` (CS-1) |
| External authority | ISIN / NSE / BSE via D05 | **FIGI** authoritative (XI-1); ISIN non-authoritative (XI-3) |
| Resolver | `SecurityMaster` (client, offline) | `portfolio-resolver.ts` (**server**), p12 `objectResolutionContract.js` |
| Sector | D05 record | `AUTHORIZED_SECTORS` frozen list of 13 |
| Unresolved | `companyId=''`, `UNRESOLVED`, preserved | fail closed (OR-2) |

Both fail closed and neither fabricates — but **`FIGI`-authoritative vs `companyId`-
authoritative is a genuine semantic conflict.** Any Phase-5 re-sourcing that touches the
historical resolver requires an explicit **Identity Authority Decision**. Until then:
**`SecurityMaster` is the sole identity authority; `portfolio-resolver.ts` is DEFERRED.**

---

## 13. D114 BOUNDARY (TASK J)

**D114 remains separate. Not modified, not merged.**

| | main | full-IIPS |
|---|---|---|
| Path | `src/d114/**` (8, incl. `pit_ingestion_loader.ts`) | `d114/src/d114/**` (7) |
| Status | FROZEN | EXCLUDE |

`origin/arena/01a0c440` carries D-PIT-WIRE-01 commits (`8b10968`, `331dbed`, `b57098c`)
touching PIT/legacy-NSE identity — **excluded from all phases.** `evidence/d114*` JSON is
shared across lineages and must remain untouched. Windows worktree
`G:\IIPS-D114-Historical-Feasibility-Windows` must not be used for any operation here.

---

## 14. DEPENDENCY / TOOLCHAIN CONVERGENCE (TASK K)

| Aspect | main (base) | full-IIPS | Resolution |
|---|---|---|---|
| React | 18.3.1 | 18.3.1 | **No conflict** |
| Router | — | `^6.28.0` | **Add if Option A** (only new runtime dep) |
| Vite | 8.3.0 | ^5.4.11 | Keep **8** |
| TS | ^5.8.2 | ^5.6.3 | Keep 5.8 |
| Module | NodeNext, `.js` specifiers | bundler, extensionless | **Rewrite imports in ported files** |
| Target | ES2022 | ES2020 | Keep ES2022 |
| Emit | `declaration: true` | `noEmit` | Keep main's |
| Tests | `node --test` (360) | Vitest+jsdom | Keep `node --test`; **no DOM tests initially** |
| CSS | `index.css` | `core/theme/global.css` + tokens | Merge classes into `index.css` |
| Output | `dist-frontend` | `dist` | Keep `dist-frontend` |
| Proxy | none | `/api`→`:8787` | **Never adopt** |

**Minimum change set:** add `react-router-dom` (Option A only); rewrite import specifiers in
ported files to NodeNext `.js`; append shell CSS. **No historical devDependency is adopted.**

**Testing gap (OQ-3):** main has zero DOM test infrastructure. Ported shell components carry
Vitest/RTL tests that cannot run under `node --test`. Options: (a) port logic-only tests for
`navigation.ts` (`visibleNav`) under `node --test` — recommended for Phase 1; (b) add Vitest
as a second runner — defer to Phase 6.

---

## 15. PHASED CONVERGENCE (TASK L)

Revised from the suggested sequence per source analysis. Key changes: **added Phase 1.5**
(mount BI before routing — earliest safe value, smallest blast radius); **Phase 5 is
per-surface and individually gated**, not one step.

| Phase | Name | Input | Changes | Untouched | Acceptance | Commit/Push | Windows |
|---|---|---|---|---|---|---|---|
| **0** | Baseline + durability | `94f519b` + `a34b6c4` | plan artifacts only | all source | 360/360, tsc, vite | **YES / YES** | no |
| **1** | Port shell + pure kit | P0 | ADD `app/{AppShell,TopBar,Sidebar,navigation}`, `core/session/*`, 11 pure components, CSS | BI, identity, D114, tests | 360/360 unchanged + new `navigation` tests; **no `useAuth`/`authFetch`/`/api`** | YES / YES | no |
| **1.5** | **Mount BI in shell** | P1 | rewrite `App.tsx` (shell + Portfolio + Replay + SecMaster); hoist singletons | **PortfolioWorkspace, store, adapters** | 360/360; BI-08 AC-01..08; shell renders | YES / YES | **optional smoke** |
| **2** | Routing + honest nav | P1.5 | `+react-router-dom`; `main.tsx` `BrowserRouter` **only**; prune `navigation.ts`; placeholders `future` | BI files | 360/360; deep links; **no OIDC** | YES / YES | no |
| **3** | BI presentation parity | P2 | optional restyle of BI workspace with ported kit | BI logic/data model | 360/360; BI-08 byte-identical behaviour | YES / YES | **YES** |
| **4** | Shared contracts | P3 | define `IdentityResolution` port (types only) | `src/identity/**` | 360/360; no identity change | YES / YES | no |
| **5.x** | Per-surface re-source (Executive → Research → …) | P4 | one surface per sub-phase over offline data | all other surfaces | per-surface tests; 0 sockets | YES / YES **each** | per surface |
| **6** | Toolchain convergence | P5 | optional Vitest for DOM tests | `node --test` 360 | 360 + DOM green | YES / YES | no |
| **7** | Full E2E | P6 | none (validation) | all | full suite, tsc, vite | YES / YES | no |
| **8** | **Windows visual acceptance** | P7 | none | all | target-screen parity; **82+66=148** | evidence deposit | **YES** |
| **9** | Convergence signoff | P8 | manifest | all | all gates closed | YES / YES | no |

### Risks per phase

P1 import-specifier churn (NodeNext) — low, compile-caught. **P1.5 is the highest-value,
lowest-risk step** (additive; BI untouched). P2 `main.tsx` is the security-critical edit —
adopt `BrowserRouter` only. P5 is the long tail: 33 surfaces, each needing an offline data
authority. P8 is the only place 82+66=148 can be re-proved.

### Rollback

Every phase ends at a pushed SHA. Rollback = `git revert <sha>` or branch from the prior
checkpoint. **Never `reset --hard` a pushed checkpoint.**

---

## 16. GIT DURABILITY MODEL (TASK M)

| Phase | Commit | Push | Purpose |
|---|---|---|---|
| 0-9 | **YES** | **YES** | Every phase is a durability checkpoint |

Mandatory per checkpoint:

```bash
git status --short          # must be empty
git diff --check            # no whitespace errors
git log -1 --oneline
git push origin arena/01a0c960-iips-production-market-data
git fetch origin && git rev-parse HEAD origin/arena/01a0c960-…   # MUST be equal
```

**Rule: no phase is complete until `local == remote`.** An unpushed Arena commit is not a
state — it is a pending loss. Demonstrated twice: `798bc548` (lost) and this session's
sandbox re-provision (survived only because pushed; recovered by fast-forward to `a34b6c4`
with blobs verified byte-identical).

---

## 17. WINDOWS / ARENA EVIDENCE MODEL (TASK N)

**Arena cannot read `G:\`. Windows cannot read the Arena sandbox. Git is the only channel.**

Arena → Windows: commit + push, then `git fetch origin && git checkout <branch> && npm ci`.

Windows → Arena: evidence must be **committed and pushed** to a repository-visible path.
Placing files on disk is invisible to Arena — proven by
`evidence/operator_drop/target_application_forensic_20260922/`, which was never committed
and therefore never analysable.

```powershell
# Windows evidence deposit (per acceptance phase)
cd <windows-repo>
git fetch origin && git checkout arena/01a0c960-iips-production-market-data && git pull
mkdir evidence\convergence\phaseN
# place screenshots + results.json
git add evidence\convergence\phaseN
git commit -m "evidence(convergence): phase N Windows acceptance"
git push origin arena/01a0c960-iips-production-market-data
```

Phase 8 must deposit: target-screen comparison screenshots; Zerodha 82 + Dhan 66 → **148**
consolidated with 100.0000% weight; duplicate re-upload showing no-op; `npm run build` +
`npm test` console output; SHA-256 manifest.

---

## 18. FINAL TARGET ARCHITECTURE (TASK O)

```
┌──────────────────────── ONE IIPS APPLICATION ────────────────────────┐
│ main.tsx → BrowserRouter → App (hoists PortfolioStore+SecurityMaster)│
│                                                                      │
│  IIPS AppShell ── TopBar (tenant/role, NO OIDC) ── Sidebar (governed)│
│   │                                                                  │
│   ├── Executive            [P5 — offline]                            │
│   ├── Portfolio            ** AUTHORITATIVE — CURRENT BI **          │
│   │     ├── broker ingestion (Zerodha/Dhan/Groww)                    │
│   │     ├── multi-broker consolidation (atomic merge)                │
│   │     ├── BI-08 idempotency (ALREADY_IMPORTED_NO_OP)               │
│   │     ├── identity resolution (SecurityMaster)                     │
│   │     └── provenance + contribution ledger                         │
│   ├── Replay / Security Master   [current main surfaces]             │
│   ├── Research · Intelligence · Evidence · Administration            │
│   ├── Reports · Watchlists · Settings · Collaboration                │
│   │      └── honest `future` placeholders until re-sourced (P5.x)    │
│   └── Notifications · Notes · CommandPalette      [P5]               │
├──────────────────── PROTECTED LOWER LAYERS (FROZEN) ─────────────────┤
│  Security Master (D05, 2,250)  │  Identity (AIIL/AGI, fail-closed)   │
│  Market data (offline fixture) │  BI contracts (BI-01..BI-08)        │
│  PRODUCTION FAIL-CLOSED BOUNDARY — 0 providers, 0 sockets            │
└──────────────────────────────────────────────────────────────────────┘

OUTSIDE THE APPLICATION — externally gated, NOT converged:
  D114 historical feasibility          (separate workstream)
  frontend/server/** + /api transports (EXCLUDED)
  Keycloak / OIDC / real-oidc-verifier (EXCLUDED)
  Live provider + commercial activation(G-034)
  Production credentials / Vault / HSM (G-034)
  Live-feed equivalence                (G-034)
```

---

## 19. ACCEPTANCE CRITERIA

**Per phase:** 360/360 (+ additions) · tsc PASS · vite build PASS · worktree clean ·
`local == remote` · 0 providers/sockets/credentials · BI-08 AC-01..08 green ·
`src/identity/**`, `src/d114/**`, `tests/**` unmodified unless the phase declares it.

**Final convergence:** one app, one build, one test command; full governed navigation;
Portfolio authoritative for BI; all 14 BI-08 invariants; D05 SHA-256 unchanged; AIIL/AGI
resolution intact; production fail-closed; **Windows target-screen parity + 82+66=148**;
no `frontend/server/**`, no OIDC, no `/api` proxy; D114 untouched; G-034 not executed.

---

## 20. RISKS

| # | Risk | Sev | Mitigation |
|---|---|---|---|
| R1 | **33/34 surfaces are server-coupled** — "port the app" is really "rebuild 33 surfaces offline" | **HIGH** | Reframed: P1/P1.5/P2 deliver shell+BI; P5.x per-surface, individually gated |
| R2 | `main.tsx` adoption boots Keycloak OIDC | **HIGH** | `BrowserRouter` only; never adopt the historical file |
| R3 | Vite `/api` proxy wires app to a server | HIGH | Never adopt historical `vite.config.ts` |
| R4 | Identity conflict (FIGI vs companyId) silently reconciled | **HIGH** | `SecurityMaster` sole authority; resolver DEFERRED pending Identity Authority Decision |
| R5 | `PortfolioWorkspace.tsx` overwritten by same-named historical file | **CRITICAL** | FROZEN; matrix marks NOT PORTED |
| R6 | Tier-B singletons lost in `App.tsx` rewrite → BI-08 regression | **HIGH** | Hoist above router in P1.5; AC-01..08 gate |
| R7 | Placeholder surfaces mistaken for features | MED | `future` badges; honesty rule from `navigation.ts` |
| R8 | Unpushed Arena work lost | **HIGH** | §16 — proven twice |
| R9 | 82+66=148 unverifiable in Arena | MED | Windows-only criterion, Phase 8 |
| R10 | Import-specifier mismatch (NodeNext vs bundler) | LOW | Compile-caught in P1 |
| R11 | Vitest/RTL tests unrunnable under `node --test` | MED | Logic-only tests P1; Vitest deferred to P6 |
| R12 | Sibling-branch drift (`a438` has +23 files) | LOW | Shell blobs identical; baseline pinned |

---

## 21. MANDATORY CLASSIFICATIONS

**A. FULL IIPS BASELINE: `CONFIRMED`**
Upgraded from *PLAUSIBLE — LINEAGE INCOMPLETE*. An exact baseline SHA now exists
(`8b10968` content / `42f91fa` ref), the shell blobs are pinned and identical across
siblings, routes and surfaces are enumerated, and the toolchain is characterised. The
earlier qualifier referred to *converged* lineage, which is now separately classified in C.

**B. BI-08 INTEGRATION: `DIRECT`**
`PortfolioWorkspace` already accepts injectable `portfolioStore`/`securityMaster`, so it
mounts unchanged as a route element. Zero BI files change. The only condition is hoisting
the Tier-B singletons (R6).

**C. EVENTUAL FULL CONVERGENCE: `FEASIBLE WITH CONTROLLED RECONCILIATION`**
Shell + BI (P1–P2) is low-risk and near-term. Full surface parity requires re-sourcing 33
server-coupled surfaces onto offline data plus an Identity Authority Decision.

**D. 798BC548: `NOT RECOVERED`**
Re-verified: object absent locally and remotely. No part of this plan depends on it, and
nothing here reconstructs it by assumption.

**E. SERVER/LIVE TIER: `EXCLUDE FROM CURRENT CONVERGENCE`**
`frontend/server/**`, OIDC/Keycloak, `authFetch`, live certification, `/api` proxy all
excluded. `api/*.ts` type declarations are *interface-only* candidates.

**F. NEXT ACTION:** `GATE-CONVERGENCE-PHASE-1-SHELL-RECOVERY-AUTHORIZATION`

---

## 22. OPEN QUESTIONS (blocking Phase 1 authorization)

| # | Question | Default if unanswered |
|---|---|---|
| **OQ-1** | Adopt `react-router-dom` (Option A) or state-based shell (Option B)? | **A** — preserves ported code as-authored |
| **OQ-2** | Is `c440`'s shell the intended target screen? (names are `TopBar`/`Sidebar`/`AppShell`, not `TopNavBar`/`LeftSidebar`/`GovernedSurfaceView`) | Proceed with `c440`; confirm at P8 |
| **OQ-3** | Add Vitest for DOM tests, or logic-only tests under `node --test`? | Logic-only in P1; revisit P6 |
| **OQ-4** | Is BI-06 code-bearing, or governance-only? | Governance-closed, format-declared |
| **OQ-5** | Which surface leads Phase 5.x? | Executive (highest screenshot salience) |
| **OQ-6** | Identity Authority Decision — does FIGI ever become authoritative? | No; `companyId` remains sole authority |

---

## 23. RECOMMENDED NEXT GATE

```
GATE-CONVERGENCE-PHASE-1-SHELL-RECOVERY-AUTHORIZATION
```

Scope: port `AppShell`, `TopBar` (sans `useAuth`), `Sidebar`, `navigation.ts`,
`core/session/**`, 11 API-pure components, shell CSS. **Additive only** — no existing file
modified, no BI file touched, no router yet, no `/api`, no OIDC.

Entry: OQ-1 and OQ-2 answered. Exit: 360/360 + new `navigation` tests, tsc, vite, worktree
clean, pushed, `local == remote`.
