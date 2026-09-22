# FULL IIPS + BI-08 CONVERGENCE — FILE MATRIX

Companion to `docs/FULL_IIPS_BI08_CONVERGENCE_PLAN.md`.
**Planning artifact only — no source modified.**

**Lineage keys**
`FULL` = `origin/arena/01a0c440-iips-production-market-data` (content authority `8b10968`, ref `42f91fa`)
`MAIN` = `origin/main` @ `94f519b`
`NEW` = to be authored during convergence

**Action keys**
`PORT` · `PORT-MODIFIED` · `FREEZE` (must remain current-main, unmodified) · `REWRITE` ·
`EXCLUDE` · `DEFER` · `INTERFACE-ONLY` · `REFERENCE` (read-only input, not shipped)

---

## 1. COLLISIONS (paths present in BOTH lineages)

| path | lineage | action | reason | conflict | dependency | phase |
|---|---|---|---|---|---|---|
| `frontend/src/features/portfolio/PortfolioWorkspace.tsx` | MAIN | **FREEZE** | BI-07/08 authority; broker ingestion + dedup | DATA-MODEL + TRUE LOGIC (blobs `3d09c975` vs `82cd8a9a`) | `portfolio-store`, `SecurityMaster` | 1.5 |
| `frontend/src/features/portfolio/PortfolioWorkspace.tsx` | FULL | **REFERENCE** | server-fed sibling surface; restyle donor only | binds `/api/portfolio` + server resolver | `api/portfolio`, `CompanyTrustChain` | 3 |
| `frontend/src/app/App.tsx` | NEW | **REWRITE** | shell + routes; must hoist Tier-B singletons | ROUTING + STATE-MANAGEMENT (`1e6dde58` vs `b69ded97`) | `AppShell`, BI store/master | 1.5 / 2 |
| `frontend/src/main.tsx` | MAIN | **FREEZE** (+`BrowserRouter` only) | FULL version boots Keycloak OIDC | **SECURITY/BOUNDARY** | react-dom | 2 |

---

## 2. SHELL — PORT (Phase 1)

| path | lineage | action | reason | conflict | dependency | phase |
|---|---|---|---|---|---|---|
| `frontend/src/app/AppShell.tsx` | FULL | PORT-MODIFIED | layout authority; drop 3 overlays initially | none | `Sidebar`, `TopBar`, `useSession` | 1 |
| `frontend/src/app/TopBar.tsx` | FULL | **PORT-MODIFIED** | **sever `useAuth` (`status`,`logout`)** | SECURITY/BOUNDARY | `core/session/session` | 1 |
| `frontend/src/app/Sidebar.tsx` | FULL | PORT | governed nav + status badges | needs `NavLink` (OQ-1) | `navigation`, `useSession` | 1 |
| `frontend/src/app/navigation.ts` | FULL | PORT-MODIFIED | prune to real surfaces; keep `future` honesty | none | `Role` type | 1 |
| `frontend/src/app/navigation.test.ts` | FULL | PORT-MODIFIED | logic-only; convert Vitest → `node --test` | TOOLCHAIN | — | 1 |
| `frontend/src/app/Sidebar.test.tsx` | FULL | DEFER | DOM test; no runner on main | TOOLCHAIN | Vitest/RTL | 6 |
| `frontend/src/core/session/SessionContext.tsx` | FULL | PORT | **inert** — "does not perform auth" | none | react | 1 |
| `frontend/src/core/session/session.ts` | FULL | PORT | `Role`, `Session`, `ANONYMOUS_SESSION` | none | none | 1 |
| `frontend/src/core/theme/theme.ts` | FULL | PORT-MODIFIED | light theme apply | none | none | 1 |
| `frontend/src/core/theme/global.css` | FULL | PORT-MODIFIED | merge into `index.css` | CSS arch | — | 1 |
| `frontend/src/core/tokens/index.ts` | FULL | PORT | semantic tokens | none | none | 1 |
| `frontend/src/index.css` | MAIN | PORT-MODIFIED | append `.app-shell/.app-topbar/.app-sidebar/.app-main/.skip-link` | none | — | 1 |

---

## 3. PRESENTATION KIT — 11 API-PURE (PORT, Phase 1)

| path | lineage | action | reason | conflict | dependency | phase |
|---|---|---|---|---|---|---|
| `frontend/src/components/ui/Badges.tsx` | FULL | PORT | certified/freshness badges | none | none | 1 |
| `frontend/src/components/data/DataComponents.tsx` | FULL | PORT | `MetricCard`,`DataTable`,`TrendIndicator` | none | none | 1 |
| `frontend/src/components/decision/DecisionComponents.tsx` | FULL | PORT | `DecisionBadge`, `Verdict` | none | none | 1 |
| `frontend/src/components/viz/ChartFoundations.tsx` | FULL | PORT | `ChartContainer`,`SimpleBarChart` | none | none | 1 |
| `frontend/src/components/state/StateComponents.tsx` | FULL | PORT | loading/error/unavailable | none | none | 1 |
| `frontend/src/components/interaction/InteractionComponents.tsx` | FULL | PORT | `Accordion` etc. | none | none | 1 |
| `frontend/src/components/evidence/EvidenceComponents.tsx` | FULL | PORT | `EvidenceCard` | none | none | 1 |
| `frontend/src/components/evidence/EvidenceExplorerComponents.tsx` | FULL | PORT | explorer primitives | none | none | 1 |
| `frontend/src/components/evidence/Ad17Disclosure.tsx` | FULL | PORT | AD-17 disclosure | none | none | 1 |
| `frontend/src/components/company/CompanyHeader.tsx` | FULL | PORT | company header | none | none | 1 |
| `frontend/src/components/shell/ShellStates.tsx` | FULL | PORT | shell-level states | none | none | 1 |

### 3.1 Presentation kit — API-coupled (DEFER)

| path | lineage | action | reason | phase |
|---|---|---|---|---|
| `frontend/src/components/ai/AiExplanation.tsx` | FULL | DEFER | imports `api/` | 5 |
| `frontend/src/components/provenance/P12Provenance.tsx` | FULL | DEFER | imports `api/` | 5 |
| `frontend/src/components/state/DataModeUnavailable.tsx` | FULL | DEFER | imports `api/dataMode` | 5 |
| `frontend/src/components/state/PitVintagePanel.tsx` | FULL | DEFER | imports `api/` + PIT | 5 |

---

## 4. BI — FROZEN (must not be modified by any phase)

| path | lineage | action | reason | conflict | phase |
|---|---|---|---|---|---|
| `frontend/src/features/portfolio/portfolio-store.ts` | MAIN | **FREEZE** | BI-07 merge + **BI-08 `ALREADY_IMPORTED_NO_OP`** | none | — |
| `frontend/src/features/portfolio/BrokerImportModal.tsx` | MAIN | FREEZE | BI-07 import UI | none | — |
| `frontend/src/features/portfolio/index.ts` | MAIN | FREEZE | BI barrel | none | — |
| `frontend/src/features/portfolio/import/types.ts` | MAIN | FREEZE | BI-03/04/05 contracts (later than FULL's BI-03) | supersedes `bdb5` | — |
| `frontend/src/features/portfolio/import/broker-format-detector.ts` | MAIN | FREEZE | BI-04 incl. `DHAN_WEB_UI_SUMMARY_V1` | none | — |
| `frontend/src/features/portfolio/import/broker-holdings-mapper.ts` | MAIN | FREEZE | BI-03 mapper | none | — |
| `frontend/src/features/portfolio/import/broker-import-ingress.ts` | MAIN | FREEZE | BI-05 orchestration | none | — |
| `frontend/src/features/portfolio/import/ui-broker-import-view-model.ts` | MAIN | FREEZE | BI-07 view-model (AC-05 text) | none | — |
| `frontend/src/features/portfolio/import/index.ts` | MAIN | FREEZE | barrel | none | — |
| `frontend/src/features/portfolio/import/adapters/zerodha-holdings-adapter.ts` | MAIN | FREEZE | BI-04 | none | — |
| `frontend/src/features/portfolio/import/adapters/dhan-holdings-adapter.ts` | MAIN | FREEZE | BI-04 | none | — |
| `frontend/src/features/portfolio/import/adapters/groww-holdings-adapter.ts` | MAIN | FREEZE | BI-04 | none | — |
| `frontend/src/features/portfolio/import/adapters/csv-parser-helper.ts` | MAIN | FREEZE | BI-04 parsing | none | — |
| `frontend/src/features/portfolio/import/adapters/index.ts` | MAIN | FREEZE | barrel | none | — |

---

## 5. IDENTITY / D05 — FROZEN

| path | lineage | action | reason | phase |
|---|---|---|---|---|
| `src/identity/security_master.ts` | MAIN | **FREEZE** | sole identity authority (`companyId`) | — |
| `src/identity/d05_broad_universe_data.ts` | MAIN | **FREEZE** | 2,250 records; AIIL `543989`/`539177`; `EQ_AGI_IN` | — |
| `src/identity/governed_fixture_master.ts` | MAIN | FREEZE | `AGI GREENPAC` exact alias (:145-149) | — |
| `src/identity/mapping_store.ts` | MAIN | FREEZE | mappings | — |
| `src/identity/quarantine.ts` | MAIN | FREEZE | unresolved handling | — |
| `src/identity/index.ts` | MAIN | FREEZE | barrel | — |
| `src/contracts/d05_security_master.ts` | MAIN | FREEZE | D05 contract | — |
| `evidence/operator_drop/d05_security_master_broad_universe.json` | MAIN | FREEZE | SHA-256 `7f53540b…4b74b5` pinned | — |
| `evidence/operator_drop/d05_security_master_manifest.json` | MAIN | FREEZE | manifest | — |

---

## 6. D114 — BOUNDARY

| path | lineage | action | reason | phase |
|---|---|---|---|---|
| `src/d114/**` (8 modules) | MAIN | **FREEZE** | separate workstream | — |
| `d114/src/d114/**` (7 modules) | FULL | **EXCLUDE** | do not merge D114 | — |
| `evidence/d114/**`, `evidence/d114-legacy/**` | BOTH | FREEZE | shared evidence; identical blobs | — |

---

## 7. SERVER / AUTH / LIVE — EXCLUSION MATRIX

| path | lineage | action | reason | phase |
|---|---|---|---|---|
| `frontend/server/**` (all) | FULL | **EXCLUDE** | HTTP listeners; breaks 0-sockets | — |
| `frontend/server/live/**` | FULL | **REQUIRES SEPARATE AUTHORITY** | live certification — **G-034** | — |
| `frontend/server/live/keycloak-provision.mjs` | FULL | **EXCLUDE** | production credential provisioning | — |
| `frontend/server/live/real-oidc-verifier.ts` | FULL | **EXCLUDE** | production identity | — |
| `frontend/server/portfolio/portfolio-resolver.ts` | FULL | **DEFER** | conflicts with `SecurityMaster` (FIGI vs companyId) | 4 (decision) |
| `frontend/server/portfolio/portfolio-{service,transport,data-mode}.ts` | FULL | EXCLUDE | server tier | — |
| `frontend/server/data-mode/**` | FULL | DEFER | concept useful; server-bound | 5 |
| `frontend/src/core/auth/AuthProvider.tsx` | FULL | **EXCLUDE** | Keycloak OIDC provider | — |
| `frontend/src/core/auth/oidcClient.ts` | FULL | **EXCLUDE** | OIDC/PKCE | — |
| `frontend/src/core/auth/keycloakAdapter.ts` | FULL | **EXCLUDE** | Keycloak roles | — |
| `frontend/src/core/auth/authContract.ts` | FULL | INTERFACE-ONLY | types only if ever needed | 5 |
| `frontend/src/api/authFetch.ts` | FULL | **EXCLUDE** | authenticated fetch | — |
| `frontend/src/api/*.ts` (14 clients) | FULL | **INTERFACE-ONLY** | keep type decls; discard fetch bodies | 5 |
| `frontend/vite.config.ts` (`/api`→`:8787`) | FULL | **EXCLUDE** | would wire app to a server | — |
| `frontend/package.json` / `tsconfig.json` | FULL | EXCLUDE | conflicting toolchain (Vite 5, Vitest, bundler) | — |
| `iips-platform/**`, `p05..p14/**`, `program-v1.1-certification/**`, `scripts/**` | FULL | EXCLUDE | out of scope | — |

---

## 8. PRODUCT SURFACES — DEFER (33 API-coupled; re-source in Phase 5.x)

| path (FULL) | route | data source | action | phase |
|---|---|---|---|---|
| `features/executive/ExecutiveDashboard.tsx` | `/executive` | `api/{executive,evidence,replay,dataMode}` | DEFER | 5.1 |
| `features/research/ResearchHub.tsx` | `/research` | `api/*` | DEFER | 5.2 |
| `features/company/CompanyIntelligence.tsx` | `/research/company/:id` | `api/*` | DEFER | 5.2 |
| `features/company/CompanyTrustChain.tsx` | (composed) | `api/*` | DEFER | 5.2 |
| `features/sector/SectorIntelligence.tsx` | `/research/sector/:id` | `api/*` | DEFER | 5.2 |
| `features/research/ResearchEvents.tsx` | `/research/events/:id` | `api/*` | DEFER | 5.2 |
| `features/cross-sector/CrossSectorIntelligence.tsx` | `/research/cross-sector` | `api/*` | DEFER | 5.2 |
| `features/macro/MacroContext.tsx` | `/research/macro` | `api/*` | DEFER | 5.2 |
| `features/screener/Screener.tsx` | `/screener` | `api/*` | DEFER | 5.3 |
| `features/screener/GovernedScreener.tsx` | `/screener/governed` | `api/*` | DEFER | 5.3 |
| `features/search/GovernedSearch.tsx` | `/search` | `api/*` | DEFER | 5.3 |
| `features/intelligence/IntelligenceHub.tsx` | `/intelligence` | `api/*` | DEFER | 5.4 |
| `features/decision-matrix/DecisionMatrix.tsx` | `/intelligence/decision-matrix` | `api/*` | DEFER | 5.4 |
| `features/evidence/EvidenceHub.tsx` | `/evidence` | `api/*` | DEFER | 5.5 |
| `features/evidence/EvidenceExplorer.tsx` | `/evidence/:id` | `api/*` | DEFER | 5.5 |
| `features/replay/ReplayExplorer.tsx` | `/evidence/replay/:id` | `api/*` | DEFER | 5.5 |
| `features/admin/Administration.tsx` | `/admin/*` | **API-pure** (tab router) | DEFER (children coupled) | 5.6 |
| `features/admin/Admin{Overview,Identity,Tenancy,Engines,Platform,Audit,Data,Operations}.tsx` | `/admin/**` | `api/*` | DEFER | 5.6 |
| `features/admin/WorkflowDefinitionPanel.tsx` | `/admin/operations` | `api/*` | DEFER | 5.6 |
| `features/collaboration/Collaboration.tsx` | `/collaboration` | `api/*` | DEFER | 5.7 |
| `features/reports/Reports.tsx` | `/reports` | `api/*` | DEFER | 5.7 |
| `features/watchlists/Watchlists.tsx` | `/watchlists` | `api/*` | DEFER | 5.7 |
| `features/settings/Settings.tsx` | `/settings` | `api/*` | DEFER | 5.7 |
| `features/notifications/NotificationDrawer.tsx` | overlay | `api/*` | DEFER | 5.8 |
| `features/notes/NotesDrawer.tsx` | overlay | `api/*` | DEFER | 5.8 |
| `features/shell/CommandPalette.tsx` | overlay (Ctrl+K) | `api/*` | DEFER | 5.8 |

---

## 9. TESTS

| path | lineage | action | reason | phase |
|---|---|---|---|---|
| `tests/**` (39 files, 360 tests) | MAIN | **FREEZE** | certified suite; regression gate | — |
| `tests/bi08_idempotent_ingress.test.ts` | MAIN | **FREEZE** | AC-01..08 — BI-08 contract | — |
| `tests/e2e_broad_universe_multi_broker_integration.test.ts` | MAIN | **FREEZE** | D05 SHA-256, AIIL/AGI, fail-closed | — |
| `tests/d05_browser_runtime_hydration.test.ts` | MAIN | FREEZE | HYDRATION-05 exact alias | — |
| `tests/navigation.test.ts` | NEW | ADD | `visibleNav(role)` logic-only under `node --test` | 1 |
| `frontend/src/**/*.test.tsx` (FULL, 182) | FULL | DEFER | Vitest/RTL; no runner on main | 6 |

---

## 10. NEW FILES

| path | action | reason | phase |
|---|---|---|---|
| `frontend/src/app/FeaturePlaceholder.tsx` | ADD | honest `future` surface; no fabricated functionality | 2 |
| `frontend/src/app/routes.ts` | ADD (optional) | central route table | 2 |
| `tests/navigation.test.ts` | ADD | nav model coverage | 1 |
| `frontend/src/core/ports/IdentityResolution.ts` | ADD | types-only port; no behaviour change | 4 |
| `evidence/convergence/phaseN/**` | ADD (Windows) | operator acceptance deposits | 8 |

---

## 11. DEPENDENCIES

| package | main | full | action | phase |
|---|---|---|---|---|
| `react` / `react-dom` | 18.3.1 | 18.3.1 | KEEP — no conflict | — |
| `react-router-dom` | absent | ^6.28.0 | **ADD if OQ-1 = Option A** (only new runtime dep) | 2 |
| `vite` | 8.3.0 | ^5.4.11 | KEEP 8 | — |
| `typescript` | ^5.8.2 | ^5.6.3 | KEEP 5.8 | — |
| `vitest`, `jsdom`, `@testing-library/*` | absent | present | DEFER | 6 |
| `tsx` | absent | ^4.23.15 | EXCLUDE (server runner) | — |
