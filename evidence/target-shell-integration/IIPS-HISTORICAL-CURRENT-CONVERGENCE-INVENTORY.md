# Institutional Investment Platform System (IIPS)
# HISTORICAL PRODUCT → CURRENT UISurface FULL CONVERGENCE INVENTORY

**Gate:** Read-only forensic/convergence inventory (authority: RAMKI message of 2026-09-23)
**Base Checkpoint:** `ad2205a76f944666ea40a85d6db43f9a89e3e8b1`
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
**NO IMPLEMENTATION AUTHORIZED OR PERFORMED** — read-only throughout.

---

## 0. TERMINAL CLASSIFICATION

> ## **B — HISTORICAL IIPS FUNCTIONALITY REMAINS OUTSIDE THE CURRENT REGISTRY**
> ### The 14-surface registry does NOT account for the full historical product experience.

A **C-subset additionally holds** (specific unresolved identity mappings — §6, table D);
B is terminal because the dominant finding is historical functionality with **no current
registered identity at all**, which no mapping exercise can resolve without new authority.

---

## 1. INTEGRITY VERIFICATION

| Check | Before | After |
| --- | --- | --- |
| HEAD | `ad2205a` ✓ | `ad2205a` ✓ (unchanged — no commit during research) |
| LOCAL == REMOTE | ✓ | ✓ |
| Worktree | CLEAN ✓ | CLEAN ✓ (this report is the only new file) |
| Tests | 501/501 · 77 suites ✓ | 501/501 · 77 suites ✓ |
| `main` | `94f519bf` ✓ | `94f519bf` ✓ |
| Five surface states | Portfolio IMPL; Intelligence/Evidence/Executive/Research PARTIAL ✓ | unchanged ✓ |
| Frozen trees | `9080e997`/`0062ad52`/`8491efdc`/`1597ed06` ✓ | unchanged ✓ |
| Source/test/config diff | — | **ZERO** |

## 2. EVIDENCE BASE AND METHOD (Q1)

**Evidence sources (all read-only):**

1. **The enumerated screenshot inventory supplied in the authority message** — treated as
   operator attestation of the visual target. **Integrity note:** no image file was
   attached to this session; Arena did not view pixels. Every enumerated item was
   cross-checked against repository evidence, and items with **zero** repo evidence are
   explicitly marked (§3, EXECUTIVE rows; §7 K).
2. **Certified historical capture manifest** — `docs/v3.0/e2e-018-screenshots/CAPTURE_MANIFEST.json`
   at `2f1049d` (ref `origin/m1-ad4-repair`, product commit `7964fcc`, branch `phase13-next`,
   operator Windows/Edge, `authMode: real-keycloak-oidc-pkce` on all 19 captures). The
   `executive.png` observables are **machine-recorded**: h1 "Executive"; h3 "Portfolio
   Health"; `metric-card: 6`; `top-opportunity: 1`; `data-table: 1` (14 rows);
   `risk-list: 1`; `chart-container: 1`; `palette/notification/notes-trigger: 1 each`;
   `sign-out: 1`; `topbar-tenant/role: 1 each`; `nav-status-Research/Intelligence/Evidence`;
   `nav-future-Opportunities/Risks/Rankings`.
3. **FULL-IIPS donor ref** `origin/arena/01a0c440-iips-production-market-data` — historical
   `App.tsx` route map (26 paths), `navigation.ts` (full nav model incl. 8 admin tabs),
   `ExecutiveDashboard.tsx` (widget code), feature tree (20 dirs), api surface (22 modules).
4. **BI-lineage ancestry of this repository** (e.g. `e8a4fae`, BI-07) — portfolio dashboard
   history; current `PortfolioWorkspace.tsx`.
5. **Current tree** — `navigation.ts`, `routes.ts`, `App.tsx`, `TopBar.tsx`, `AppShell.tsx`,
   `UISurfaceId` registry, view-model builders, NAV-*/SHELL-*/REG-* tests.
6. **Prior governance records** — `FULL-IIPS-BASELINE-FORENSIC-ANALYSIS.md`,
   `PHASE1_AUTHORIZATION_PREPARATION.md` (DEFER matrix), `NEXT-PRODUCT-SURFACE-AUTHORITY-
   DESIGNATION-PACKET.md`, Phase 1C/2/3/4 reports and acts.

## 3. MASTER INVENTORY (Q2–Q6; 20 columns)

**Legend.** CS codes: **IMPL** implemented · **PARTIAL** partial/presentation-only ·
**FUTURE** placeholder route · **UNMNT** registered builder, no route/designation ·
**PRUNED** removed by Phase-1A authority · **DEFER** deferred by standing act ·
**AUTH-BLOCK** authority-blocked · **N/R** not recovered · **N/G** not currently governed ·
**NO-EV** screenshot-attested only, zero repository evidence. HFR = historical
functionality recovered; CPR = current presentation recovered; GPA = governed payload
available. E-1..E-5 / M-1..M-5 / X-1..X-5 / R-1..R-6 = the accumulated gap series
(Evidence / Intelligence / Executive / Research).

### 3.1 GLOBAL / SHELL

| # | Historical feature | Hist route | Hist artifact | Cur UISurfaceId | Cur route | CS | HFR | CPR | GPA | Identity/Prov | Authority | Ext dep | D91 | D115 | P1A | Blocker | Evidence | Future authority | Disposition |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | IIPS Platform brand | all | TopBar brand | — | all | IMPL | YES | YES | n/a | display-only | none needed | none | — | — | N | none | TopBar.tsx; SHELL-02 | none | CONVERGED |
| 2 | Global Search | /search | GovernedSearch; api/p12Search; palette-trigger | — none | none | PRUNED | NO | NO | NO | n/a | none exists | api/server/auth | — | — | Y | no UISurfaceId + api dependency | donor features/search; route map | designation + data act | OUTSIDE REGISTRY |
| 3 | Notifications | — | NotificationDrawer; api/notifications | — none | none | DEFER | NO | NO | NO | n/a | overlays DEFERRED (Path-L act) | api/server | — | — | Y | api dependency + deferred overlay | AppShell.tsx header; donor features/notifications | overlay gate (if ever) | DEFERRED |
| 4 | Notes | — | NotesDrawer; api/notes | — none | none | DEFER | NO | NO | NO | n/a | overlays DEFERRED | api/server | — | — | Y | api dependency + deferred overlay | AppShell.tsx header; donor features/notes | overlay gate (if ever) | DEFERRED |
| 5 | Tenant/role indicator | all | topbar-tenant/-role | — | all | IMPL | YES | YES | n/a | props, never auth-derived | none needed | none | — | — | N | none | TopBar.tsx; SHELL-02 | none | CONVERGED |
| 6 | Sign out | all | sign-out (real Keycloak session) | — | none | AUTH-BLOCK | NO | NO | NO | auth seam | DEFERRED; no executable auth | OIDC/Keycloak | — | YES | auth seam deferred + D115 WITHHELD | TopBar.tsx onSignOut; REG-03; capture manifest | D115 + auth gate | AUTH-BLOCKED |
| 7 | Command palette (Ctrl-K) | — | shell/CommandPalette (api/decisionMatrix + core/auth) | — none | none | PRUNED | NO | NO | NO | n/a | excluded Phase-1A | api/server/auth | — | YES | Y | auth + api + decision-matrix dependency | AppShell.tsx header; donor shell/ | excluded unless re-governed | PRUNED/AUTH-BLOCKED |

### 3.2 EXECUTIVE (Q10 — widget forensics)

| # | Historical feature | Hist route | Hist artifact | Cur UISurfaceId | Cur route | CS | HFR | CPR | GPA | Identity/Prov | Authority | Ext dep | D91 | D115 | P1A | Blocker | Evidence | Future authority | Disposition |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 8 | Executive surface (portfolio-level dashboard) | /executive | ExecutiveDashboard (fetchExecutiveData/evidence/replay via authFetch) | UI02 (company-level summary) | /executive | PARTIAL | **NO — granularity divergence** | NO | NO (X-1..X-5) | no governed payload | phase3 act | historical api/* | — | — | N | X-1..X-5 + identity divergence | donor ExecutiveDashboard.tsx; executive.png observables | **granularity decision required** | IDENTITY DIVERGENT |
| 9 | Portfolio Health — Holdings | /executive | ExecutiveDashboard L105 | — none | none | N/R | NO | NO | NO | none | none | hist /api/executive | — | — | N | no UISurfaceId for portfolio aggregates | donor L104-110; metric-card:6 | new identity + data act | OUTSIDE REGISTRY |
| 10 | Portfolio Health — Avg Conviction | /executive | L106 | — | none | N/R | NO | NO | NO | none | none | hist api | — | — | N | same | same | same | OUTSIDE REGISTRY |
| 11 | Portfolio Health — Avg Quality | /executive | L107 | — | none | N/R | NO | NO | NO | none | none | hist api | — | — | N | same | same | same | OUTSIDE REGISTRY |
| 12 | Portfolio Health — Avg Risk | /executive | L108 | — | none | N/R | NO | NO | NO | none | none | hist api | — | — | N | same | same | same | OUTSIDE REGISTRY |
| 13 | Portfolio Health — Concentration | /executive | L109 | — | none | N/R | NO | NO | NO | none | none | hist api | — | — | N | same | same | same | OUTSIDE REGISTRY |
| 14 | Portfolio Health — Diversification | /executive | L110 | — | none | N/R | NO | NO | NO | none | none | hist api | — | — | N | same | same | same | OUTSIDE REGISTRY |
| 15 | Top opportunity | /executive | L113-116 (certified opportunity output) | — | none | N/R | NO | NO | NO | none | none | hist api | — | — | N | no identity + engine-output payload | top-opportunity:1 in capture | new identity + data act | OUTSIDE REGISTRY |
| 16 | Priority Opportunities table | /executive | L121-125 (RankedSector) | — | none | N/R | NO | NO | NO | none | none | hist api | — | — | N | no identity + opportunity payload | data-table:1, 14 rows | same | OUTSIDE REGISTRY |
| 17 | Risk list (sector concentration) | /executive | L137 concentrationSectors | UI10 (adjacent only) | none | UNMNT | NO | NO | NO | none | none | hist api | — | — | N | UI10 undesignated + no payload | risk-list:1 in capture | designation + data act | ADJACENT-UNMOUNTED |
| 18 | Chart (SimpleBarChart ≈ "IIPS Score Distribution") | /executive | ChartFoundations import | — | none | N/R | NO | NO | NO | none | none | hist api | — | — | N | no chart identity + payload | chart-container:1 in capture | new identity + data act | OUTSIDE REGISTRY |
| 19 | Total Portfolio Value | (BI lineage) /portfolio | BI-07 PortfolioWorkspace; current L151 | — (portfolio domain) | /portfolio | IMPL | **YES** | YES | YES (governed portfolio store) | BI-08 governed | BI-07/08 accepted | none | — | — | N | none | current PortfolioWorkspace.tsx L149-151 | none | **CONVERGED** |
| 20 | Active Positions | screenshot only | **ZERO repo evidence** | — | none | NO-EV | NO | NO | NO | n/a | n/a | unknown | ? | ? | N | not verifiable from repository | authority-message enumeration only | operator attestation | UNVERIFIED |
| 21 | IIPS Average Score | screenshot only | **ZERO repo evidence** | — | none | NO-EV | NO | NO | NO | n/a | n/a | unknown | ? | ? | N | not verifiable | enumeration only | operator attestation | UNVERIFIED |
| 22 | Risk Exposure (label) | screenshot only; ≈ risk-list (row 17) | no label evidence; risk-list is evidenced | — | none | NO-EV/adjacent | NO | NO | NO | n/a | n/a | unknown | ? | ? | N | not verifiable as a distinct widget | enumeration + row 17 | operator attestation | UNVERIFIED |
| 23 | Alerts Requiring Action | screenshot only | **ZERO repo evidence** (capture alerts: []) | UI10 (adjacent) | none | NO-EV | NO | NO | NO | n/a | n/a | unknown | ? | ? | N | not verifiable; capture recorded alerts: [] | enumeration; manifest alerts:[] | operator attestation | UNVERIFIED |
| 24 | IIPS Score Distribution (label) | screenshot only; ≈ chart (row 18) | no label evidence; chart is evidenced | — | none | NO-EV/adjacent | NO | NO | NO | n/a | n/a | unknown | ? | ? | N | not verifiable as a distinct widget | enumeration + row 18 | operator attestation | UNVERIFIED |
| 25 | Watchlist Highlights | screenshot only | **ZERO repo evidence** (donor Watchlists feature exists, unconnected) | — | none | NO-EV | NO | NO | NO | n/a | n/a | unknown | ? | ? | N | not verifiable | enumeration; donor features/watchlists | operator attestation | UNVERIFIED |
| 26 | Quick Actions | screenshot only | **ZERO repo evidence** | — | none | NO-EV | NO | NO | NO | n/a | n/a | unknown | ? | ? | N | not verifiable | enumeration only | operator attestation | UNVERIFIED |

### 3.3 PORTFOLIO

| # | Historical feature | Hist route | Hist artifact | Cur UISurfaceId | Cur route | CS | HFR | CPR | GPA | Identity/Prov | Authority | Ext dep | D91 | D115 | P1A | Blocker | Evidence | Future authority | Disposition |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 27 | Portfolio workspace | /portfolio/* | PortfolioWorkspace | — (BI-08 domain) | /portfolio | IMPL | YES | YES | YES | governed | BI-07/08 accepted | none | — | — | N | none | frozen tree 8491efdc | none | **CONVERGED** |
| 28 | Overview child | /portfolio | nav child | — | /portfolio | IMPL | YES | YES | YES | governed | accepted | none | — | — | N | none | navigation.ts | none | **CONVERGED** |

### 3.4 RESEARCH (Q4 — pruning/single-route contract honoured)

| # | Historical feature | Hist route | Hist artifact | Cur UISurfaceId | Cur route | CS | HFR | CPR | GPA | Identity/Prov | Authority | Ext dep | D91 | D115 | P1A | Blocker | Evidence | Future authority | Disposition |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 29 | Research hub | /research | ResearchHub (partial) | **UI03** | /research | PARTIAL | PARTIAL (hub shell only; single surface) | PARTIAL | NO (R-1) | no governed payload | phase4 acts | hist api/* | — | — | Y(children) | R-1/R-5/R-6 | phase4 gate bc6d8ae | R-1/R-5/R-6 commission | PARTIAL (designated) |
| 30 | Company | /research/company/:id | CompanyIntelligence (+AI Advisory; 13 sector captures) | none designated | none (child pruned) | PRUNED | NO | NO | NO | none | none | hist api company/aiAdvisory | — | — | Y | **unresolved mapping** (UI03/UI04/UI12 adjacent) | donor route map; 13 captures | identity designation | UNMAPPED (C) |
| 31 | Sector | /research/sector/:id | SectorIntelligence | UI05 (adjacent) | none | UNMNT | NO | NO | NO | none | not designated | hist api | — | — | Y | undesignated + no payload | donor; sector-intelligence capture | designation + data act | ADJACENT-UNMOUNTED |
| 32 | Events | /research/events/:id | ResearchEvents | UI09 (adjacent only) | none | UNMNT | NO | NO | NO | none | not designated | hist api evidence/replay | — | — | Y | **unresolved mapping** | donor route map | identity designation | UNMAPPED (C) |
| 33 | Cross-Sector | /research/cross-sector | CrossSectorIntelligence | **none** | none | PRUNED | NO | NO | NO | none | none | hist api/crossSector | — | — | Y | **no registered identity exists** | donor; cross-sector capture | new construction authority | OUTSIDE REGISTRY |
| 34 | Screener | /screener, /screener/governed | Screener, GovernedScreener; api/p12Screener | UI06 (adjacent) | none (route pruned; not under /research) | UNMNT | NO | NO | NO | none | not designated | hist api | — | — | Y | undesignated + service-object novelty + no payload | donor; screener.png capture | designation + data act | ADJACENT-UNMOUNTED |
| 35 | Macro | /research/macro | MacroContext (D91 disclosure-bearing) | UI13 | none | UNMNT/AUTH-BLOCK | NO | NO | NO | none | **D91/D88 LIVE-only, no relief** | hist /api/macro (LIVE-only) | **YES** | — | Y | **D91 blocks offline macro** | D91 doc (hist refs); phase4 gate §4 | D91/D88 relief (not requested) | AUTH-BLOCKED |

### 3.5 INTELLIGENCE

| # | Historical feature | Hist route | Hist artifact | Cur UISurfaceId | Cur route | CS | HFR | CPR | GPA | Identity/Prov | Authority | Ext dep | D91 | D115 | P1A | Blocker | Evidence | Future authority | Disposition |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 36 | Intelligence hub | /intelligence | IntelligenceHub (partial) | UI04 | /intelligence | PARTIAL | PARTIAL (domain-intelligence subset) | PARTIAL | NO (M-1..M-5; macro=D91) | none | phase1c deferral act | hist api | partial | — | N(children) | M-1..M-5 | phase1c gate a647213 | M-series commission | PARTIAL (deferred) |
| 37 | Decision Matrix | /intelligence/decision-matrix | DecisionMatrix; api/decisionMatrix (also CommandPalette dep) | **none** | none (child pruned) | PRUNED | NO | NO | NO | none | none | hist api + palette/auth | — | — | Y | **no registered identity exists** | decision-matrix.png capture; donor | new construction authority | OUTSIDE REGISTRY |
| 38 | Opportunities | /intelligence/opportunities (nav: future) | none — future marker only | — | none | N/G | n/a | n/a | n/a | n/a | n/a | none (never built) | — | — | N | was future even historically | donor nav; nav-future-Opportunities in capture | any future act | NEVER IMPLEMENTED |
| 39 | Risks | /intelligence/risks (future) | none | — | none | N/G | n/a | n/a | n/a | n/a | n/a | none | — | — | N | same | nav-future-Risks | any future act | NEVER IMPLEMENTED |
| 40 | Rankings | /intelligence/rankings (future) | none | — | none | N/G | n/a | n/a | n/a | n/a | n/a | none | — | — | N | same | nav-future-Rankings | any future act | NEVER IMPLEMENTED |

### 3.6 EVIDENCE

| # | Historical feature | Hist route | Hist artifact | Cur UISurfaceId | Cur route | CS | HFR | CPR | GPA | Identity/Prov | Authority | Ext dep | D91 | D115 | P1A | Blocker | Evidence | Future authority | Disposition |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 41 | Evidence hub / Decision Evidence | /evidence, /evidence/:id | EvidenceHub, EvidenceExplorer | UI11 | /evidence | PARTIAL | PARTIAL (auditor subset) | PARTIAL | NO (E-1..E-5) | none | phase2 act | hist api | — | — | N | E-1..E-5 | phase2 gate 8dfd8ec | E-series commission | PARTIAL (deferred) |
| 42 | Replay Explorer | /evidence/replay/:id | ReplayExplorer; api/replay | UI01 (adjacent) | /replay (FUTURE placeholder) | UNMNT | NO | NO | NO | none | not designated | hist api | — | — | Y | undesignated + no payload | donor route map | designation + data act | ADJACENT-UNMOUNTED |

### 3.7 ADMINISTRATION (Q11)

| # | Historical feature | Hist route | Hist artifact | Cur UISurfaceId | Cur route | CS | HFR | CPR | GPA | Identity/Prov | Authority | Ext dep | D91 | D115 | P1A | Blocker | Evidence | Future authority | Disposition |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 43 | Administration (all 8 tabs; real Keycloak OIDC-PKCE) | /admin/* | Administration + 8 tabs | none | /admin (FUTURE placeholder) | PRUNED/AUTH-BLOCK | NO | NO | NO | Keycloak realm | Phase-1A DEFER | IdP/auth/server | — | **YES** | Y | auth + D115 + server dependency | PHASE1_AUTHORIZATION_PREPARATION L173-179+; capture authMode | D115 + auth gate | AUTH-BLOCKED |
| 44 | Overview | /admin/overview | AdminOverview | none | none | PRUNED | NO | NO | NO | — | DEFER | server | — | YES | Y | same | donor admin/ | same | AUTH-BLOCKED |
| 45 | Identity & Access | /admin/identity | AdminIdentity | none | none | PRUNED/AUTH-BLOCK | NO | NO | NO | Keycloak users/roles | DEFER | IdP | — | **YES** | Y | **D115 core: identity binding, runtimeCompanyId WITHHELD** | donor admin/AdminIdentity.tsx | **D115 disposition required** | AUTH-BLOCKED (D115) |
| 46 | Tenants | /admin/tenancy | AdminTenancy | none | none | PRUNED | NO | NO | NO | tenant identity | DEFER | server | — | YES | Y | D115-adjacent tenancy | donor | D115 | AUTH-BLOCKED (D115) |
| 47 | Engines & Certification | /admin/engines | AdminEngines (13-engine registry) | none | none | PRUNED | NO | NO | NO | none | DEFER | server | — | — | Y | server dependency; engine adapters exist ungoverned as a surface | admin-engines.png capture | new authority if ever | AUTH-BLOCKED |
| 48 | Platform Operations | /admin/platform | AdminPlatform | none | none | PRUNED | NO | NO | NO | — | DEFER | server | — | — | Y | server dependency | donor | same | AUTH-BLOCKED |
| 49 | Audit | /admin/audit | AdminAudit | none | none | PRUNED | NO | NO | NO | — | DEFER | server | — | — | Y | server dependency | donor | same | AUTH-BLOCKED |
| 50 | Live Data & Governance | /admin/data | AdminData | none | none | PRUNED | NO | NO | NO | providers | DEFER | **production providers** | — | — | Y | fail-closed boundary; productionEligible false | donor | production authorization (not requestable) | AUTH-BLOCKED |
| 51 | Migration/Workflow/Marketplace | /admin/operations | AdminOperations + WorkflowDefinitionPanel | none | none | PRUNED | NO | NO | NO | — | DEFER | server | — | — | Y | server dependency | donor | same | AUTH-BLOCKED |

### 3.8 OTHER HISTORICAL TOP-LEVEL SURFACES

| # | Historical feature | Hist route | Hist artifact | Cur UISurfaceId | Cur route | CS | HFR | CPR | GPA | Identity/Prov | Authority | Ext dep | D91 | D115 | P1A | Blocker | Evidence | Future authority | Disposition |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 52 | Collaboration | /collaboration | Collaboration; api/collaboration | none | /collaboration (FUTURE) | PRUNED | NO | NO | NO | none | DEFER | hist api | — | — | Y | no identity + api | donor features+api | new authority if ever | OUTSIDE REGISTRY |
| 53 | Reports | /reports | Reports; api/reports | none | /reports (FUTURE) | PRUNED | NO | NO | NO | none | DEFER | hist api | — | — | Y | same | donor | same | OUTSIDE REGISTRY |
| 54 | Watchlists | /watchlists | Watchlists; api/watchlists | none | /watchlists (FUTURE) | PRUNED | NO | NO | NO | none | DEFER | hist api | — | — | Y | same | donor | same | OUTSIDE REGISTRY |
| 55 | Settings (incl. data-mode pref; macro D91-exempt) | /settings | Settings; api/settings | none | /settings (FUTURE) | PRUNED | NO | NO | NO | none | DEFER | hist api | partial (macro mode pref) | — | Y | same | donor; D91 text | same | OUTSIDE REGISTRY |
| 56 | Security Master (current-only) | none historical | — (BI-base origin) | UI08 | /security-master (FUTURE) | UNMNT | n/a | NO | identity master EXISTS (D05, 2,250 records) | governed D05 | not designated | none | — | — | N | designation only (data exists!) | routes.ts; D05 act | designation | DATA-READY, UNDESIGNATED |
| 57 | Replay Studio (current-only label) | (hist = ReplayExplorer row 42) | — | UI01 | /replay (FUTURE) | UNMNT | NO | NO | NO | none | not designated | none | — | — | N | undesignated + no payload | routes.ts | designation + data act | ADJACENT-UNMOUNTED |

## 4. SUMMARY TABLES

**A. Historical features by current state** (57 rows): CONVERGED **6** (brand, tenant/role,
Total Portfolio Value, Portfolio workspace, Overview, — plus row 5 double-counted with 1;
effective 5 unique) · PARTIAL (designated, payload-deferred) **4** (Research hub, Intelligence
hub, Evidence hub, Executive surface-as-UI02) · ADJACENT-UNMOUNTED **6** (UI05, UI06, UI09,
UI10, UI13, UI01) · DATA-READY-UNDESIGNATED **1** (UI08/D05) · OUTSIDE REGISTRY **12**
(Global Search, Cross-Sector, Decision Matrix, Portfolio-Health×6, Top opportunity,
Priority Opportunities, chart, Collaboration/Reports/Watchlists/Settings counted at area
level = 4 → 14 counting all) · AUTH-BLOCKED **10** (sign-out, Command Palette,
Administration×8 area-level) · DEFERRED (overlays) **2** · UNMAPPED-C **3** (Company,
Events, +Executive granularity) · NEVER-IMPLEMENTED-EVEN-HISTORICALLY **3** ·
UNVERIFIED-NO-EVIDENCE **7** (Executive widgets rows 20-26).

**B. Historical → current UISurface mapping:** Executive→UI02 (**granularity divergent**);
Research→UI03 (designated); Intelligence→UI04; Evidence→UI11; Sector→UI05 (adjacent);
Screener→UI06 (adjacent); Macro→UI13 (D91-blocked); Replay→UI01 (adjacent);
risk/anomaly→UI10 (adjacent); events/PIT→UI09 (adjacent); estimates→UI12 (adjacent);
alt-data→UI14 (adjacent); Company→**none**; Cross-Sector→**none**; Decision Matrix→**none**;
portfolio aggregates→**none**; Search/Notifications/Notes/Palette→**none**;
Administration→**none**; Collaboration/Reports/Watchlists/Settings→**none**.

**C. Current 14 UISurfaceIds → historical functionality:** UI01→ReplayExplorer (unmounted);
UI02→Executive (divergent granularity, mounted); UI03→Research fundamentals (mounted);
UI04→Intelligence (mounted, Decision Matrix NOT covered); UI05→Sector (unmounted);
UI06→Screener (unmounted); UI07→PIT corporate actions (no direct historical route;
company/events adjacent, unmounted); UI08→no historical surface (D05 asset exists,
unmounted); UI09→Events/evidence-PIT (adjacent, unmounted); UI10→risk list (adjacent,
unmounted); UI11→Evidence (mounted); UI12→estimates (adjacent, unmounted);
UI13→MacroContext (D91-blocked, unmounted); UI14→alt-data (adjacent, unmounted).
**Mounted: 4 of 14 (UI02, UI03, UI04, UI11). Registered-but-undesignated: 10 of 14.**

**D. Unmapped historical functionality (C-subset):** Company Intelligence; Research Events;
Cross-Sector; Decision Matrix; the portfolio-level Executive experience (aggregates +
opportunities + chart); Global Search. These have **no resolvable current identity without
a new designation or new construction authority**.

**E. Deliberately pruned:** all 26→13 route reduction of Phase-1A (research children,
screener, search, admin/*, callback, evidence/:id, evidence/replay/:id,
intelligence/decision-matrix, portfolio/*); overlays (palette/notifications/notes drawers);
sign-out/auth seam. All prunings are authority decisions, not losses.

**F. Data-blocked (payload gap series):** Executive X-1..X-5; Intelligence M-1..M-5
(macro M-5 = D91); Evidence E-1..E-5; Research R-1/R-5/R-6; plus unopened series for
Sector/Screener/Estimates/anomaly/replay payloads and portfolio-aggregate payloads.

**G. Authority-blocked:** D115 (Identity & Access, Tenants, sign-out/auth seam, any new
identity binding — WITHHELD); D91/D88 (macro, macro data-mode preference); production
providers (Live Data & Governance); OIDC/Keycloak (all admin tabs, Command Palette).

**H. D91/D88 constrained:** MacroContext, UI13, api/macro, the macro sub-domain of
Intelligence (M-5), and the historical Settings data-mode preference as it applied to macro.

**I. D115-constrained:** Identity & Access; Tenants; sign-out/OIDC seam; runtimeCompanyId;
any governed payload identity binding (R-6, M-4, X-5, E-series identity).

**J. Shell/overlay/auth functionality (Q9):** brand IMPL; tenant/role IMPL; Global Search
NOT-RECOVERED (trigger prop-gated, unwired, no surface, no route, no governance);
Notifications DEFERRED (prop seam only); Notes DEFERRED (prop seam only); Command Palette
PRUNED + AUTH-BLOCKED (api/decisionMatrix + core/auth); Notification/Notes drawers PRUNED;
sign-out DEFERRED/AUTH-BLOCKED (renders only if a future gate supplies onSignOut — REG-03).

**K. Executive widget inventory (Q10, condensed):** evidenced historically AND in the
certified capture: Portfolio Health ×6, Top opportunity, Priority Opportunities (14 rows),
risk list, chart — ALL unrecovered (no identity, no payload). Evidenced and recovered:
Total Portfolio Value (BI-08 /portfolio). Screenshot-attested with ZERO repo evidence:
Active Positions, IIPS Average Score, Risk Exposure (label), Alerts Requiring Action
(capture recorded `alerts: []`), IIPS Score Distribution (label), Watchlist Highlights,
Quick Actions — UNVERIFIED, requiring operator-side attestation; they cannot be mapped,
recovered, or excluded from repository evidence alone. Current UI02 exposes NONE of the
historical Executive widgets (it is a company-level quote/score/intelligence summary — a
different product experience); all Executive widgets are blocked by X-1..X-5 **and** by the
identity divergence.

## 5. NAVIGATION & ROUTE CONVERGENCE (Q3/Q4 — three-way)

| Dimension | HISTORICAL (donor) | CURRENT | GOVERNED TARGET STATE |
| --- | --- | --- | --- |
| Top-level nav | 10 groups (Executive, Portfolio, Research, Intelligence, Evidence, Administration, Collaboration, Reports, Watchlists, Settings) | 12 entries (same six future placeholders kept honest) | unchanged until designation |
| Research children | 6 (Company, Sector, Events, Cross-Sector, Screener, Macro) | **none** — single route, zero children (Phase-4 contract) | single-route contract stands; children only via new authority |
| Intelligence children | 4 (Decision Matrix implemented; Opportunities/Risks/Rankings future) | none | none until Decision-Matrix authority |
| Administration children | 8 implemented tabs | none (admin-only future entry) | D115/auth-gated |
| Routes | 26 paths incl. 4 `:param` routes, /callback (OIDC), /search, /screener(+governed) | 13 concrete paths, no params, no callback | NAV-10/11 contracts |
| Mount status | 20 implemented historical routes | 1 IMPL + 4 PARTIAL + 8 FUTURE placeholders | honest-status contract (NAV-01..05) |

Differences are **all deliberate authority decisions** (Phase-1A pruning, Phase-1C/2/3/4
graduations); no navigation or route was changed by this inventory.

## 6. Q12 — COMPLETENESS TEST (strict evidence answer)

**"Does the current 14-surface governed registry account for all historical IIPS product
functionality visible in the screenshot?" — NO.**

1. **Outside the registry entirely** (no UISurfaceId can represent them): Global Search,
   Decision Matrix, Cross-Sector Intelligence, the portfolio-level Executive experience
   (6 aggregate cards, top-opportunity, 14-row opportunities table, risk list, chart),
   Administration (8 tabs), Collaboration, Reports, Watchlists, Settings, notifications/
   notes/palette overlays, sign-out.
2. **Registered but undesignated** (10 of 14 surfaces have no route): UI01, UI05–UI10,
   UI12–UI14 — adjacent to historical Sector/Screener/Events/Macro/Replay/risk/estimates/
   alt-data but never designated, and all payload-blocked.
3. **Identity divergence at the flagship**: historical Executive was a portfolio-level
   dashboard; current `/executive` (UI02) is a company-level summary. The flagship
   experience of the historical product is therefore **not represented** by the current
   Executive surface — the most material unresolved mapping in the inventory.
4. **Unverifiable items**: 7 screenshot-enumerated Executive widgets have zero repository
   evidence in any reachable ref (current tree, c440 donor, BI-07 lineage `e8a4fae`,
   m1-ad4-repair `2f1049d`). They cannot be accounted for from the repository at all.

Hence **B**, with the C-subset (§4 D) explicitly preserved.

## 7. FINAL ANSWERS (classification brief)

1. **Classification: B** — per §6, with evidence per row in §3.
2. **Exact remaining functionality:** §3 rows 2, 6, 7, 9–18, 20–26, 30–35 (partially),
   37, 42–57 as itemized.
3. **Already recoverable:** Portfolio/BI-08 (fully converged); the four partial surfaces
   (UI02/UI03/UI04/UI11 — components genuine, awaiting payloads); **UI08 Security Master
   is data-ready** (D05 governed master, 2,250 records) and needs only designation.
4. **Data-blocked:** all payload-gap series (X/M/E/R + unopened series) — §4 F.
5. **Authority-blocked:** D115, D91/D88, auth seam, production providers — §4 G/H/I.
6. **Deliberately deferred/pruned:** §4 E — every pruning is an recorded authority act.
7. **Next authority decision:** see §8.

## 8. NEXT AUTHORITY DECISION (provided automatically)

**Decision required: disposition of the convergence given classification B.** Options are
NOT interchangeable:

- **(A) EXECUTIVE GRANULARITY GATE** — authorize a read-only identity/design gate on the
  single most material divergence: whether the historical portfolio-level Executive
  experience (Portfolio Health aggregates, Top/Priority Opportunities, risk list, chart)
  shall ever be represented, and under what identity (new designation vs. explicit
  out-of-scope record).
- **(B) DESIGNATE THE NEXT UNDESIGNATED REGISTERED SURFACE** — e.g. UI08 Security Master
  (the only data-ready candidate: governed D05 master exists; designation + presentation
  gate only), or UI05/UI06/UI12 (payload-blocked adjacency).
- **(C) CONVERGENCE SCOPE ACT** — explicitly bound the convergence scope: enumerate the
  historical areas permanently out of scope for this convergence (Administration/auth,
  overlays, Search, Collaboration/Reports/Watchlists/Settings, Cross-Sector, Decision
  Matrix), enabling an honest "converged within scope" declaration at the current state.
- **(D) COMMISSION THE UNIFIED GOVERNED-DATA SPECIFICATION** — one specification act
  covering the accumulated gap series (X-1..X-5, M-1..M-5, E-1..E-5, R-1/R-5/R-6) and the
  unopened series, macro excluded pending D91/D88 relief.

**Standing disclosure:** D115 = WITHHELD / UNRESOLVED / NOT AUTHORIZED · D91/D88 macro
standing unchanged · `productionEligible = false` · external live sockets 0 · no
implementation performed or authorized by this inventory · Windows visual acceptance NOT
claimed by Arena; the 7 unverified widgets require operator-side attestation.

---

**End of Convergence Inventory — classification B, read-only, no state changed.**
