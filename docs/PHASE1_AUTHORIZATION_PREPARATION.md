# IIPS — PHASE-1 AUTHORIZATION PREPARATION

**Gate:** `PHASE-1 AUTHORIZATION PREPARATION`
**Artifact ID:** `AUTH-PREP-IIPS-FULLAPP-BI08-PHASE1-2026-09-22`
**Type:** Authorization preparation. **No source modified. Not the implementation gate.**
**Session branch:** `arena/01a0c960-iips-production-market-data`
**Predecessors:** `docs/FULL_IIPS_BI08_CONVERGENCE_PLAN.md`, `docs/FULL_IIPS_BI08_CONVERGENCE_FILE_MATRIX.md`

> **Outcome:** `PHASE-1 READY FOR AUTHORITY APPROVAL` — conditional on two human decisions
> (OQ-1, OQ-2) presented in §8 and §9. No source has been modified. Phase 1A must not begin
> until those decisions are given.

---

## A. EXACT BASELINE DEFINITION

The previous gate described `8b10968` (content) and `42f91fa` (ref) as "the baseline." That
dual description was ambiguous. This gate replaces it with **one reproducible tree object**.

### A.1 Formal baseline statement

```
CONTENT BASELINE (authoritative, reproducible):
  TREE OBJECT : 682f4e6029818c839f23211ae5067eed862c5037
  PATH        : frontend/src
  REACHABLE AT: 8b10968  AND  42f91fa   (both resolve to the same tree)

REFERENCE / BRANCH TIP:
  42f91fad0ff5141fce665b068b544224ac471f73
  ref origin/arena/01a0c440-iips-production-market-data

CONTENT-BASELINE COMMIT (provenance citation):
  8b10968  "fix(pit): complete governed D114 handoff, gap refusal, executive…"
  2026-09-21 15:20

COMMITS AFTER CONTENT BASELINE:  10   (8b10968..42f91fa)
FILES TOUCHED BY THOSE COMMITS:  29
FRONTEND/src EFFECT:             ZERO — VERIFIED BY TREE-HASH EQUALITY
```

### A.2 Verification evidence

```bash
git rev-parse 8b10968:frontend/src   # 682f4e6029818c839f23211ae5067eed862c5037
git rev-parse 42f91fa:frontend/src   # 682f4e6029818c839f23211ae5067eed862c5037   → IDENTICAL
git rev-parse 8b10968:frontend       # a83cb3fe…
git rev-parse 42f91fa:frontend       # 40088909…                                  → DIFFERS
```

The 10 intervening commits touch `d114/**`, `evidence/d-pit-wire-01-windows/**`,
`scripts/windows/**`, `docs/**`, and **`frontend/server/pit/**`**.

**Material correction to the previous gate.** It stated those commits touch "zero
`frontend/src` files," which is true — but they *do* touch `frontend/**` (specifically
`frontend/server/pit/*`). The correct invariant is narrower and must be stated precisely:

> The Phase-1 extraction scope is **`frontend/src`**, whose tree is byte-identical at both
> SHAs. `frontend/server/**` is **excluded** from Phase 1 (§6), so its divergence is
> irrelevant to Phase 1 — but the baseline must be cited as `frontend/src`, never as
> "`frontend/`" or "the commit."

### A.3 The single reproducible answer

> **"Which exact tree is the Full-IIPS content baseline for Phase 1?"**
> **Tree `682f4e6029818c839f23211ae5067eed862c5037` (`frontend/src`), reachable at
> `42f91fa`.** Cite `8b10968` for provenance only.

Baseline is **sufficient and reproducible**. No correction required; no source altered.

---

## B. BRANCH LINEAGE MAP

```
        eae2ff6  2026-09-08 19:09   "align program baseline with IIPS integration boundary"
              │                      ── DIVERGENCE: full-IIPS vs BI ──
    ┌─────────┴──────────┐
    │                    │
FULL-IIPS (192)      BI LINEAGE (56)
    │                    │
 da43051  2026-09-15     005f7324 ── PR #1 ──▶ 94f519b  origin/main
 "D89 global UI12 …"                           [BI-01..BI-08 + D05 + identity]
 COMMON ANCESTOR of all
 97-tsx siblings
    │
    ├── 01a0814b   94 tsx   frontend/src tree 98a6a6ea
    ├── 01a0ae80   94 tsx   frontend/src tree 98a6a6ea   (identical to 814b)
    ├── 01a0c86d   94 tsx   frontend/src tree 98a6a6ea   (identical to 814b)
    ├── 01a0bdb5   95 tsx   frontend/src tree da1a446a   ◀ PRIOR CONVERGENCE PRECEDENT
    ├── 01a0a438   97 tsx   frontend/src tree af437ca9
    └── 01a0c440   97 tsx   frontend/src tree 682f4e60   ◀ ELECTED BASELINE
            └── 8b10968 (content) → 42f91fa (tip)

EXTERNAL PROVENANCE
 b97b103  ramkivs/finapp WP-FB-IMPORT-BROKER-01 — Governed Reuse Handoff
          cited by BOTH lineages: main's import/types.ts AND 01a0bdb5's import/types.ts
```

### B.1 Relationships

| Ref | Role | Classification |
|---|---|---|
| `eae2ff6` | Divergence point | Historical fact |
| `da43051` | Common ancestor of all full-app siblings | Sibling fan-out origin |
| `b97b103` | FINAPP reuse handoff (external) | **Shared provenance of both lineages** |
| `01a0bdb5` | BI-02 handoff + BI-03 inside full-app tree | **PRIOR CONVERGENCE PRECEDENT** |
| `01a0c440` | Elected Phase-1 shell donor | Content baseline |
| `origin/main` `94f519b` | BI authority | **Target authority — unchanged** |

### B.2 `01a0bdb5` classification — explicit

```
01a0bdb5 = PRIOR CONVERGENCE PRECEDENT
01a0bdb5 ≠ AUTHORITATIVE CONVERGENCE SOLUTION
```

It added 973 lines of BI-03 contracts into the full-app tree (`97527ea`) and **stopped at
BI-03** — no BI-04 adapters, no BI-05 ingress, no BI-07 UI, no BI-08 idempotency. `main`'s
`import/types.ts` is the strictly later descendant of the same `b97b103` handoff
(BI-03/04/05 vs BI-03 only). Its value is **evidentiary** — it proves the two lineages share
contract ancestry — not as a merge candidate.

### B.3 Selection is content-based, not timestamp-based

Per the governing rule, no sibling is authoritative merely for being later or larger.
Evidence that selection did **not** rest on those attributes:

- `01a0a438` has **more** files (1,200 vs 1,177) and **more** tests (190 vs 182) — **not selected**.
- `01a0c86d` has a **later** branch tip (13:32 vs 09:31) — **not selected**.

Selection rests on **dependency closure and content compatibility**: for the 9 files in the
Phase-1 shell scope, `c440`'s blobs are the minimal-coupling variant (§B.4).

### B.4 Decisive per-file evidence (Phase-1 scope only)

| File | c440 | a438 | c86d | bdb5 |
|---|---|---|---|---|
| `app/App.tsx` | `1e6dde580d` | = | = | = |
| `app/AppShell.tsx` | `e05b823faf` | = | = | = |
| `app/Sidebar.tsx` | `f1d22d3d05` | = | = | = |
| `app/navigation.ts` | `f72e3809f6` | = | = | = |
| `core/session/SessionContext.tsx` | `d3ce08ea3d` | = | = | = |
| `core/session/session.ts` | `f119f7fc15` | = | = | = |
| `core/theme/theme.ts` | `92061264c5` | = | = | = |
| `core/tokens/index.ts` | `ff80280332` | = | = | = |
| **`app/TopBar.tsx`** | **`99100762e7`** | **`41904b84cc`** | `99100762e7` | `99100762e7` |

**8 of 9 shell files are byte-identical across all four siblings.** The sole divergence is
`TopBar.tsx` on `a438`, which adds exactly:

```
+ import { MarketDataFreshnessBadge } from '../components/data/MarketDataFreshnessBadge';
+ <MarketDataFreshnessBadge />
```

That badge pulls a live market-data freshness dependency — precisely the coupling Phase 1
excludes. **`c440` is therefore the correct donor on dependency-closure grounds**, and
`c86d`/`bdb5` are equally valid for this scope.

**Correction to the previous gate:** it said shell blobs were "identical across siblings."
That is true for 8 of 9 but **false for `TopBar.tsx` on `a438`**. Corrected here.

---

## C. SURFACE DEPENDENCY MATRIX — 34 FEATURE SURFACES

Measured at tree `682f4e60`. Coupling test: any `from '(../)+api/'` import.

| # | Surface | Source path (`frontend/src/features/`) | Route | API clients | Auth | Server | Pres-pure | Disposition | Phase |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Executive Dashboard | `executive/ExecutiveDashboard.tsx` | `/executive` | dataMode, executive, evidence, replay | – | YES | NO | DEFER | 5.1 |
| 2 | Portfolio (historical) | `portfolio/PortfolioWorkspace.tsx` | `/portfolio` | portfolio, evidence, replay | – | YES | NO | **REFERENCE ONLY** | 3 |
| 3 | Research Hub | `research/ResearchHub.tsx` | `/research` | decisionMatrix | – | YES | NO | DEFER | 5.2 |
| 4 | Company Intelligence | `company/CompanyIntelligence.tsx` | `/research/company/:id` | dataMode, company, evidence, replay, decisionMatrix | – | YES | NO | DEFER | 5.2 |
| 5 | Company Trust Chain | `company/CompanyTrustChain.tsx` | composed | evidence, replay | – | YES | NO | DEFER | 5.2 |
| 6 | Sector Intelligence | `research/SectorIntelligence.tsx` | `/research/sector/:id` | dataMode, company, evidence, replay, decisionMatrix | – | YES | NO | DEFER | 5.2 |
| 7 | Research Events | `research/ResearchEvents.tsx` | `/research/events/:id` | evidence, replay, decisionMatrix | – | YES | NO | DEFER | 5.2 |
| 8 | Cross-Sector | `cross-sector/CrossSectorIntelligence.tsx` | `/research/cross-sector` | dataMode, crossSector, evidence, replay | – | YES | NO | DEFER | 5.2 |
| 9 | Macro Context | `research/MacroContext.tsx` | `/research/macro` | macro | – | YES | NO | DEFER | 5.2 |
| 10 | Screener | `screener/Screener.tsx` | `/screener` | decisionMatrix | – | YES | NO | DEFER | 5.3 |
| 11 | Governed Screener | `screener/GovernedScreener.tsx` | `/screener/governed` | **p12Screener** | – | YES | NO | DEFER | 5.3 |
| 12 | Governed Search | `search/GovernedSearch.tsx` | `/search` | **p12Search, p12Screener** | – | YES | NO | DEFER | 5.3 |
| 13 | Intelligence Hub | `intelligence/IntelligenceHub.tsx` | `/intelligence` | decisionMatrix | – | YES | NO | DEFER | 5.4 |
| 14 | Decision Matrix | `decision-matrix/DecisionMatrix.tsx` | `/intelligence/decision-matrix` | dataMode, decisionMatrix, evidence, replay | – | YES | NO | DEFER | 5.4 |
| 15 | Evidence Hub | `evidence/EvidenceHub.tsx` | `/evidence` | decisionMatrix | – | YES | NO | DEFER | 5.5 |
| 16 | Evidence Explorer | `evidence/EvidenceExplorer.tsx` | `/evidence/:id` | evidence | – | YES | NO | DEFER | 5.5 |
| 17 | Replay Explorer | `replay/ReplayExplorer.tsx` | `/evidence/replay/:id` | replay | – | YES | NO | DEFER | 5.5 |
| 18 | **Administration** | `admin/Administration.tsx` | `/admin/*` | **none (direct)** | – | **transitive** | **direct-pure** | DEFER | 5.6 |
| 19 | Admin Overview | `admin/AdminOverview.tsx` | `/admin/overview` | admin | – | YES | NO | DEFER | 5.6 |
| 20 | Admin Identity | `admin/AdminIdentity.tsx` | `/admin/identity` | admin | – | YES | NO | DEFER | 5.6 |
| 21 | Admin Tenancy | `admin/AdminTenancy.tsx` | `/admin/tenancy` | admin | – | YES | NO | DEFER | 5.6 |
| 22 | Admin Engines | `admin/AdminEngines.tsx` | `/admin/engines` | admin | – | YES | NO | DEFER | 5.6 |
| 23 | Admin Platform | `admin/AdminPlatform.tsx` | `/admin/platform` | admin | – | YES | NO | DEFER | 5.6 |
| 24 | Admin Audit | `admin/AdminAudit.tsx` | `/admin/audit` | admin | – | YES | NO | DEFER | 5.6 |
| 25 | Admin Data | `admin/AdminData.tsx` | `/admin/data` | admin | – | YES | NO | DEFER | 5.6 |
| 26 | Admin Operations | `admin/AdminOperations.tsx` | `/admin/operations` | admin | – | YES | NO | DEFER | 5.6 |
| 27 | Workflow Panel | `admin/WorkflowDefinitionPanel.tsx` | `/admin/operations` | admin | – | YES | NO | DEFER | 5.6 |
| 28 | Collaboration | `collaboration/Collaboration.tsx` | `/collaboration` | collaboration | – | YES | NO | DEFER | 5.7 |
| 29 | Reports | `reports/Reports.tsx` | `/reports` | reports | – | YES | NO | DEFER | 5.7 |
| 30 | Watchlists | `watchlists/Watchlists.tsx` | `/watchlists` | watchlists | – | YES | NO | DEFER | 5.7 |
| 31 | Settings | `settings/Settings.tsx` | `/settings` | settings | – | YES | NO | DEFER | 5.7 |
| 32 | Notifications | `notifications/NotificationDrawer.tsx` | overlay | notifications | – | YES | NO | DEFER | 5.8 |
| 33 | Notes | `notes/NotesDrawer.tsx` | overlay | notes | – | YES | NO | DEFER | 5.8 |
| 34 | Command Palette | `shell/CommandPalette.tsx` | overlay ⌘K | decisionMatrix | **YES** | YES | NO | DEFER | 5.8 |

### C.1 Enumerated count — corrected

```
TOTAL FEATURE SURFACES            : 34
DIRECTLY API-COUPLED              : 33
DIRECTLY API-PURE                 :  1   (#18 Administration)
TRANSITIVELY API-COUPLED          : 34   ← all 8 Administration children are API-coupled
SURFACES PORTABLE IN PHASE 1      :  0
```

**Refinement of the previous gate's headline.** "33 of 34" is correct for *direct* imports,
but `Administration.tsx` is a tab router whose **eight children are each API-coupled**
(verified individually). In dependency-closure terms the honest figure is **34/34
effectively coupled**, with exactly one surface direct-pure.

Two surfaces (#11, #12) import `api/p12Screener` / `api/p12Search`, which the earlier
`../../api/[a-z]+` pattern missed. Corrected by re-scanning with `(../)+api/`.

**Consequence: zero product surfaces are portable in Phase 1.** Phase 1 is shell +
presentation kit only. This is the finding that makes Phase 1 safe and small.

---

## D. BASE COMPONENT MATRIX — 15 COMPONENTS

### D.1 Definition — PRESENTATION-PURE

A component is **PRESENTATION-PURE** only if it has **none** of:

1. auth import (`core/auth/**`, `useAuth`)
2. API-client import (`api/**`)
3. direct `fetch` / `authFetch`
4. server import (`frontend/server/**`)
5. live-runtime dependency
6. identity-resolution dependency (resolver, `canonicalSecurityId`, `SecurityMaster`)
7. mutation side effect (writes to store/network/global state)

### D.2 Definition — PRESENTATION-COMPATIBLE

**PRESENTATION-COMPATIBLE** = presentation-pure **and** mountable in the target shell
without a router/provider/context change. A component may be pure yet *not* compatible
(e.g. requires `react-router` context, or a CSS-variable theme the target lacks).

**These are distinct axes and are reported separately below.**

### D.3 Matrix

| # | Component | API | Auth | Router | Stateful | **PURE** | **COMPATIBLE** | Note | Phase |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `ui/Badges.tsx` | 0 | 0 | no | no | **YES** | needs CSS vars | `CertifiedBadge`, `FreshnessBadge` | 1 |
| 2 | `data/DataComponents.tsx` | 0 | 0 | no | no | **YES** | needs CSS vars | `MetricCard`, `DataTable`, `TrendIndicator` | 1 |
| 3 | `decision/DecisionComponents.tsx` | 0 | 0 | no | no | **YES** | needs CSS vars | `DecisionBadge`, `Verdict` | 1 |
| 4 | `viz/ChartFoundations.tsx` | 0 | 0 | no | no | **YES** | needs CSS vars | `ChartContainer`, `SimpleBarChart` | 1 |
| 5 | `state/StateComponents.tsx` | 0 | 0 | no | no | **YES** | needs CSS vars | Loading/Error/Unavailable/PermissionDenied | 1 |
| 6 | `interaction/InteractionComponents.tsx` | 0 | 0 | no | **yes** | **YES** | needs CSS vars | `Accordion`; local UI state only | 1 |
| 7 | `evidence/EvidenceComponents.tsx` | 0 | 0 | no | no | **YES** | needs CSS vars | `EvidenceCard` | 1 |
| 8 | `evidence/EvidenceExplorerComponents.tsx` | 0 | 0 | no | no | **YES** | needs CSS vars | explorer primitives | 1 |
| 9 | `evidence/Ad17Disclosure.tsx` | 0 | 0 | no | no | **YES** | needs CSS vars | AD-17 disclosure | 1 |
| 10 | `company/CompanyHeader.tsx` | 0 | 0 | no | no | **YES** | needs CSS vars | company header | 1 |
| 11 | `shell/ShellStates.tsx` | 0 | 0 | no | no | **YES** | needs CSS vars | shell-level states | 1 |
| 12 | `ai/AiExplanation.tsx` | **1** | 0 | no | yes | NO | — | imports `api/` | 5 |
| 13 | `provenance/P12Provenance.tsx` | **1** | 0 | no | no | NO | — | imports `api/` | 5 |
| 14 | `state/DataModeUnavailable.tsx` | **1** | 0 | no | no | NO | — | imports `api/dataMode` | 5 |
| 15 | `state/PitVintagePanel.tsx` | **1** | 0 | no | no | NO | — | imports `api/` + PIT | 5 |

```
PRESENTATION-PURE            : 11 / 15   (#1–#11)
PRESENTATION-COMPATIBLE      :  0 / 15  as-is  →  11 / 15  after CSS-variable provisioning
API-COUPLED (deferred)       :  4 / 15   (#12–#15)
```

**All 11 pure components are token-driven** (`var(--color-*)`). They are pure but **not
compatible until the token layer ships** (`core/theme/global.css` + `core/tokens/index.ts`,
both in Phase-1 scope). This is exactly the pure-vs-compatible distinction required.

**Note on #6:** `InteractionComponents` uses `useState` for local disclosure state. That is
*not* a mutation side effect under D.1(7) — no external writes — so it remains PURE.

---

## E. BI-08 DEPENDENCY CLOSURE

### E.1 Complete transitive closure (measured on `origin/main`)

```
frontend/src/features/portfolio/PortfolioWorkspace.tsx
  ├── react { useState, useMemo, useCallback }              ✅ shared, v18.3.1 both lineages
  ├── ./index.js  → portfolio-store.js                      ✅ BI, frozen
  │                → import/index.js → adapters, detector,
  │                  mapper, ingress, types, view-model      ✅ BI, frozen
  │                → PortfolioWorkspace.js, BrokerImportModal.js
  ├── ./BrokerImportModal.js                                 ✅ BI, frozen
  │     └── ../../../../src/identity/security_master.js      ✅ identity, frozen
  └── ../../../../src/identity/index.js                      ✅ identity, frozen
        → SecurityMaster, getGovernedBroadSecurityMaster
```

### E.2 Compatibility probes

| Probe | Result | Evidence |
|---|---|---|
| React context / provider required? | **NO** | zero `useContext`/`createContext`/`Provider` |
| Router required? | **NO** | zero `react-router`/`useNavigate`/`useParams` |
| CSS-module / asset import? | **NO** | zero `import '*.css'` in feature files |
| Styling mechanism | `className` utilities (88 sites) | global `index.css` (443 L, 218 selectors) |
| Injection interface | **present** | `portfolioStore?`, `securityMaster?`, `portfolioId?` |
| Fallback when props omitted | **present** | `getDefaultPortfolioStore()`, `getGovernedBroadSecurityMaster()` |
| Network / socket | **NONE** | no `fetch`, no `/api` |
| D115 identity | **NONE** | `\bD115\b` → 0 hits in `src/`, `frontend/src/`, `tests/` |

### E.3 Closure verdict

```
BI-08 = DIRECT ROUTE-LEVEL INTEGRATION CONFIRMED
        SUBJECT TO COMPATIBILITY CLOSURE — CLOSURE SATISFIED, WITH ONE CONDITION
```

`PortfolioWorkspace` has **zero** provider, router, or context requirements and already
exposes the injection interface. It can mount as a route element **without modifying any BI
source file**.

### E.4 The one condition — CSS system collision (new finding)

The two lineages use **incompatible visual systems**:

| | Shell donor (`c440`) | BI (`main`) |
|---|---|---|
| Mechanism | inline styles + `var(--color-*)` tokens | utility classes (`min-h-screen`, `bg-slate-950`) |
| Theme | **light** (`applyTheme('light')`, `--color-surface-0`) | **dark** (`bg-slate-950 text-slate-100`) |
| Utility framework | none | **none — Tailwind is NOT installed**; utilities hand-authored in `index.css` |
| Global element rules | `*`, `html`, `body`, `a` | `*`, `*::before`, `*::after`, `html`, `body` |

Two concrete risks:

1. **Global-selector collision** — both stylesheets define bare `*`, `html`, `body`. Naive
   concatenation lets the later rule win, potentially restyling the certified BI-07 visual
   parity surface.
2. **Theme inversion** — a light shell around a dark workspace will look wrong even when
   functionally correct.

**Mitigation (Phase 1A, mandatory):** import **only** `core/tokens/index.ts` (CSS custom
properties) and the **`.app-*` layout rules** from `global.css`. **Do not** import
`global.css`'s `*`/`html`/`body`/`a` reset block. Scope shell rules under `.app-shell`.
BI-07 visual parity is a certified artifact and must not regress — verified at the Phase-3
Windows gate.

---

## F. AUTH COLLISION MATRIX

| Artifact | Historical (`c440`) | Current authority (`main`) | Classification | Required action |
|---|---|---|---|---|
| `main.tsx` | boots `<AuthProvider>` (Keycloak OIDC/PKCE) around app | renders `<App/>`; **no auth** | **HARD BOUNDARY CONFLICT** | **DO NOT PORT.** At most add `<BrowserRouter>` (OQ-1) |
| `TopBar.tsx` | `const { status, logout } = useAuth()` | n/a | **AUTH COLLISION** | Explicit reconciliation — §F.2 |
| `SessionContext.tsx` | **inert** — "Does not perform auth" | n/a | **COMPATIBLE** | PORT as-is |
| `session.ts` | `Role`, `Session`, `ANONYMOUS_SESSION` | n/a | **COMPATIBLE** | PORT as-is |
| `core/auth/AuthProvider.tsx` | Keycloak provider | absent | **EXCLUDED** | Never port |
| `core/auth/oidcClient.ts` | OIDC/PKCE client | absent | **EXCLUDED** | Never port |
| `core/auth/keycloakAdapter.ts` | Keycloak role mapping | absent | **EXCLUDED** | Never port |
| `core/auth/authContract.ts` | auth types | absent | INTERFACE-ONLY (deferred) | Not Phase 1 |
| `api/authFetch.ts` | authenticated fetch | absent | **EXCLUDED** | Never port |
| `CommandPalette.tsx` | **only feature importing `core/auth`** | absent | **EXCLUDED from Phase 1** | Defer to 5.8 |

### F.1 Current authority

```
CURRENT IIPS AUTH ARCHITECTURE = NO CLIENT-SIDE AUTHENTICATION
Verified: grep -rniE 'keycloak|oidc|authFetch' src/ frontend/src/ tests/ package.json → 0 hits
Mode: NON_PRODUCTION / single-operator / offline
```

### F.2 `TopBar` reconciliation — explicit, not a silent deletion

The governing instruction forbids deleting `useAuth` merely to compile. Measured scope of
the coupling — it is exactly two symbols in one conditional block:

```tsx
import { useAuth } from '../core/auth/AuthProvider';   // line 9
const { status, logout } = useAuth();                  // line 25
{status === 'authenticated' && (
  <button data-testid="sign-out" onClick={() => { void logout(); }}>Sign out</button>
)}
```

`role` and `tenantId` are **props**, not auth-derived. The auth dependency governs **only**
the Sign-out button.

**Three candidate reconciliations, for authority decision:**

| Option | Behaviour | Auth-model change | Recommendation |
|---|---|---|---|
| **F-a** | Drop the Sign-out block; `TopBar` renders brand + tenant + role + triggers | **None** — faithful to "no client-side auth" | **RECOMMENDED** |
| F-b | Keep block behind an injected optional `onSignOut?` prop, unset in Phase 1 | None now; preserves future seam | Acceptable |
| F-c | Port a stub `useAuth` returning `unauthenticated` | Introduces a fake auth surface | **NOT recommended** |

**F-a is recommended and must be recorded as an explicit auth-model statement**, not an
incidental edit: *the target shell has no client-side authentication; the historical
Keycloak-gated Sign-out control is intentionally not reconstituted.* No silent change
occurs; the decision is documented and testable (AC-05).

---

## G. IDENTITY CONFLICT RECORD

```
IDENTITY CONFLICT STATUS      : UNRESOLVED
TARGET AUTHORITY              : CURRENT MAIN CONTRACT (companyId / SecurityMaster)
AUTOMATIC RECONCILIATION      : PROHIBITED
SILENT ADAPTER                : PROHIBITED
FUTURE RESOLUTION             : REQUIRES EXPLICIT GOVERNED CONTRACT DECISION
PHASE-1 EXPOSURE              : NONE — no identity-bearing file is in Phase-1 scope
```

| Dimension | Current main (**AUTHORITATIVE**) | Historical full-IIPS |
|---|---|---|
| Internal identity | `companyId` (`EQ_AGI_IN`, `EQ_AIIL_IN`) | `canonicalSecurityId` (CS-1) |
| External authority | ISIN / NSE / BSE via D05 | **FIGI authoritative (XI-1)**; ISIN non-authoritative (XI-3) |
| Resolver | `SecurityMaster` (client, offline) | `portfolio-resolver.ts` (**server**) + p12 `objectResolutionContract.js` |
| Sector | D05 record | frozen `AUTHORIZED_SECTORS` (13) |
| Unresolved | `companyId=''`, `UNRESOLVED`, preserved | fail closed (OR-2) |

Both fail closed and neither fabricates identifiers — but **FIGI-authoritative vs
companyId-authoritative is a genuine semantic conflict**. Phase 1 touches no identity file,
so the conflict is neither resolved nor aggravated. It remains open for a future governed
decision.

### G.1 D115 boundary — verified clean

```
D115 C (authoritative companyId)      : UNRESOLVED   — unchanged by this gate
D115 D (Company/Security mapping)     : UNRESOLVED   — unchanged by this gate
runtimeCompanyId                      : UNRESOLVED
implementationAuthority               : WITHHELD
productionEligible                    : false
D115 production activation            : NOT AUTHORIZED
```

Verification: `grep -rnE '\bD115\b|D-115' src/ frontend/src/ tests/` → **0 hits**.
(An earlier broad grep matched `IND1159` in D05 data — a substring false positive,
6 occurrences, unrelated to D115. Confirmed and discounted.)

Phase 1 introduces **no** companyId, mapping, identity, Stage-3 binding, Keycloak change,
OIDC activation, credential, authority change, or entitlement change. **The convergence
cannot become a backdoor around D115 C/D**, because no Phase-1 file participates in
identity resolution.

---

## H. OQ-1 DECISION ANALYSIS — ROUTING MODEL

### H.1 Evidence

| Question | Finding |
|---|---|
| Does `react-router-dom` exist on main? | **NO** — absent from `package.json` and `package-lock.json` |
| Current routing mechanism | `useState<'portfolio'\|'executive'\|'replay'\|'sec_master'>` in `App.tsx:23` |
| Deep linking today? | **NO** — zero `window.location` / `history.pushState` in `frontend/src` |
| Does `PortfolioWorkspace` require a router? | **NO** — zero router imports (§E.2) |
| Does `Sidebar` require a router? | **YES** — `import { NavLink } from 'react-router-dom'` (line 15), `<NavLink to={item.path}>` |
| Does `AppShell` require a router? | **YES** — `<Outlet/>` from `react-router-dom` |
| Does the donor ship a route map? | **YES** — `app/routes.ts`, 24 named routes |
| Historical nav model | `navigation.ts` — path-based, with `implemented\|partial\|future` status |

### H.2 Options

**Option A — adopt `react-router-dom` (^6.28.0)**
*For:* `Sidebar`/`AppShell` port **as-authored** (zero rewrite); `routes.ts` reusable;
deep-linking enables per-surface Windows acceptance; matches donor's design intent.
*Against:* one new runtime dependency; `main.tsx` must add `<BrowserRouter>` (a
security-sensitive file — but `BrowserRouter` alone carries no auth/network behaviour);
current tab-state UX changes to URL-driven.

**Option B — state-based shell**
*For:* zero new dependencies; `main.tsx` untouched — maximal boundary safety.
*Against:* `Sidebar` and `AppShell` **must be rewritten** — they *are* the Phase-1
deliverable, so the port largely ceases to be a port; no deep links (weakens Windows
per-surface acceptance); diverges from donor, raising future re-sync cost.

### H.3 Recommendation

> **RECOMMEND OPTION A** — adopt `react-router-dom ^6.28.0`.

Rationale: Option B rewrites the two files Phase 1 exists to recover, which forfeits the
fidelity benefit and re-introduces authoring risk in the exact place the donor is
authoritative. Option A's cost is one well-scoped dependency; `BrowserRouter` introduces no
auth, no network, and no server coupling, so the production boundary is unaffected.

**However — this is a genuine architectural change** (it alters how the current product
navigates, from component state to URL). Per §12 and §20 of the instruction, it is **not
taken silently.**

```
OQ-1 STATUS: AWAITING EXPLICIT AUTHORITY DECISION
```

---

## I. OQ-2 DECISION ANALYSIS — TARGET SHELL

### I.1 Candidates compared

| Criterion | `c440` (`TopBar`/`Sidebar`/`AppShell`) | `a438` variant | Named target (`TopNavBar`/`LeftSidebar`/`GovernedSurfaceView`) |
|---|---|---|---|
| Exists as Git objects | **YES** — tree `682f4e60` | YES | **NO** — 0 hits across all 22 refs |
| Layout | CSS-grid: `topbar topbar / sidebar content`, 240px × 56px, responsive | same | unknown |
| Navigation | `navigation.ts`, role-aware `visibleNav()`, status badges | same | unknown |
| Providers | `SessionContext` (inert) | same | unknown |
| Route assumptions | `react-router` `<Outlet/>`, `<NavLink>` | same | unknown |
| Auth coupling | `useAuth` → Sign-out only | same | unknown |
| Accessibility | skip-link, `aria-label="Primary"`, `tabIndex={-1}` main, aria-labelled triggers | same | unknown |
| Extra dependency | — | **+`MarketDataFreshnessBadge`** (live data) | — |
| Phase-1 compatibility | **best** (minimal closure) | worse | n/a |

### I.2 Evidence for `c440`

- **Not chosen for file count or recency** — `a438` has more files/tests; `c86d` has a later
  tip. Chosen because its `TopBar` blob (`99100762e7`) omits the live market-data badge,
  giving the minimal dependency closure (§B.4).
- **Accessibility is real, not assumed** — skip-link, labelled landmarks, focus target.
- **Governance intent is built in** — `navigation.ts` carries `implemented|partial|future`
  and states a nav entry is not proof of implementation (§14 compliance is native).
- **Visual correlation** — `docs/v3.0/e2e-018-screenshots/executive.png` (commit `2f1049d`)
  renders this exact shell.

### I.3 Unresolved conflict

The `798bc548` brief named `TopNavBar` / `LeftSidebar` / `GovernedSurfaceView`. Those
identifiers **do not exist in any ref**. Either (a) `c440` is the intended shell under
different names, or (b) `798bc548` was a distinct shell, now permanently lost.

**This cannot be settled from Git alone** — it requires the operator's target screenshot.

### I.4 Recommendation

> **RECOMMEND `c440` shell** — tree `682f4e60`, files `AppShell.tsx` `e05b823faf`,
> `TopBar.tsx` `99100762e7`, `Sidebar.tsx` `f1d22d3d05`, `navigation.ts` `f72e3809f6`.

It is the only shell that exists as recoverable objects, is accessibility-complete,
carries native governance honesty, and has the minimal dependency closure.

```
OQ-2 STATUS: AWAITING EXPLICIT AUTHORITY DECISION
Requires: operator confirmation against the target screenshot (naming mismatch)
```

---

## J. PHASE-1 ACCEPTANCE CRITERIA

| AC | Criterion | Verification |
|---|---|---|
| AC-01 | Current main authority unchanged | `git diff --stat` shows **no** modification to `src/**`, `tests/**`, BI files |
| AC-02 | No D115 identity values introduced | `grep -rnE '\bD115\b'` → 0 in source |
| AC-03 | No D115 companyId introduced | no new `companyId` literal anywhere |
| AC-04 | No Company/Security mapping introduced | `src/identity/**` byte-identical (tree hash) |
| AC-05 | No Keycloak / realm / client / auth bootstrap | `grep -rniE 'keycloak\|oidc\|authFetch'` → 0 |
| AC-06 | No historical server/live tier | no `frontend/server/**`; no `/api` proxy in `vite.config.ts` |
| AC-07 | Target shell renders | `vite build` PASS + dev-server smoke |
| AC-08 | Behaviour outside the slice intact | 360/360 unchanged |
| AC-09 | `PortfolioWorkspace` mounts via existing injection interfaces | 1B: route element with `portfolioStore`/`securityMaster` props |
| AC-10 | BI-08 source unchanged | BI blob hashes identical pre/post |
| AC-11 | Historical identity contract does not replace current | no `canonicalSecurityId`/`FIGI` in shipped source |
| AC-12 | Research/Intelligence/Admin not fabricated as implemented | nav status `future`; no mounted component |
| AC-13 | No production/provider entitlement touched | G-034 untouched; 0 providers, 0 sockets |
| AC-14 | No deployment performed | no deploy step executed |
| AC-15 | Tests / typecheck / build pass | 360/360 (+ additions), `tsc` PASS, `vite build` PASS |
| AC-16 | No secrets or credentials introduced | no `.env`, token, key, or credential file |
| AC-17 | Git durability checkpoint succeeds | commit + push complete |
| AC-18 | `LOCAL SHA == REMOTE SHA` | `git rev-parse HEAD` == `git ls-remote origin <branch>` |
| AC-19 | Worktree clean | `git status --short` empty |

**Gate rule:** all 19 must hold at the end of **both** 1A and 1B. Any failure → stop,
report, do not proceed to 1B.

---

## K. PHASE-1 ROLLBACK BOUNDARY

```
PHASE-1 ROLLBACK BASELINE (exact, reproducible):
  2561dd2284c08d5ac7850dba2a2e7fe53a467a60

  branch  : arena/01a0c960-iips-production-market-data
  remote  : verified equal at gate entry (git ls-remote)
  state   : 360/360 PASS · tsc PASS · vite build PASS · worktree CLEAN
  content : forensic + convergence planning artifacts only; zero source modification
```

Rollback method: `git revert <phase-sha>` or branch from `2561dd2`.
**Never `reset --hard` a pushed checkpoint.** Each of 1A and 1B gets its own checkpoint, so
1B can be reverted without losing 1A.

---

## L. PHASE-1A IMPLEMENTATION SCOPE

> Executable **only** after OQ-1 and OQ-2 are decided and Phase 1 is authorized.

### L.1 Phase 1A — Shell recovery (ADDITIVE ONLY)

Source tree `682f4e60` (`frontend/src` @ `42f91fa`).

**ADD — shell (9 files):**
`app/AppShell.tsx` · `app/TopBar.tsx` *(F-a reconciliation applied)* · `app/Sidebar.tsx` ·
`app/navigation.ts` *(pruned)* · `app/routes.ts` *(if OQ-1 = A)* ·
`core/session/SessionContext.tsx` · `core/session/session.ts` · `core/theme/theme.ts` ·
`core/tokens/index.ts`

**ADD — presentation kit (11 pure components):** §D.3 rows 1–11.

**ADD — new:** `app/FeaturePlaceholder.tsx` (honest `future` surface) ·
`tests/navigation.test.ts` (logic-only, `node --test`).

**MODIFY — exactly one existing file:** `frontend/src/index.css` — append **scoped**
`.app-shell`/`.app-topbar`/`.app-sidebar`/`.app-main`/`.skip-link` + token block.
**Must not** import `global.css`'s `*`/`html`/`body`/`a` reset (§E.4).

**NOT TOUCHED in 1A:** `App.tsx`, `main.tsx`, all BI files, `src/identity/**`, `src/d114/**`,
`tests/**` (existing 39), `package.json` (unless OQ-1 = A → add `react-router-dom` only).

**Exit:** AC-01..AC-19 · shell compiles, unmounted · **checkpoint: commit + push + verify**.

### L.2 Phase 1B — BI-08 route mount (after 1A checkpoint)

**MODIFY:** `App.tsx` — render `AppShell`; mount BI `PortfolioWorkspace` at `/portfolio`;
retain Replay + Security Master; **hoist `PortfolioStore` / `SecurityMaster` `useMemo`
singletons above the shell** (Tier-B session lifetime — load-bearing for BI-08).
`main.tsx` — add `<BrowserRouter>` **only** if OQ-1 = A; **no `AuthProvider`, ever**.

**NOT TOUCHED:** every BI file; `src/identity/**`; `src/d114/**`; existing tests.

**Exit:** AC-01..AC-19 · BI-08 AC-01..AC-08 green · 360/360 ·
**checkpoint: commit + push + verify** · then **REASSESS** (do not continue to Phase 2).

### L.3 Notes carried into implementation

- `navigation.test.ts` is **Vitest** (`import { describe, it, expect } from 'vitest'`) and
  also imports `routes.ts`. It must be **rewritten** for `node --test`
  (`node:test` + `node:assert`), not copied. Scope: `NAV` status classification, child
  reconciliation, `visibleNav()` role filtering.
- Ported files use extensionless/bundler specifiers; main is **NodeNext** and requires
  explicit `.js`. All ported imports must be rewritten accordingly (compile-caught).
- `Sidebar.test.tsx` / `App.test.tsx` are DOM tests — **deferred** (no DOM runner on main).

---

## M. GATE CONCLUSION

```
PHASE-1 READY FOR AUTHORITY APPROVAL
```

A–K are complete; L is specified but **not executed**. Two decisions block implementation:

1. **OQ-1 — routing model.** Recommendation: **Option A** (`react-router-dom`). Genuine
   architectural change → explicit approval required.
2. **OQ-2 — target shell.** Recommendation: **`c440`** (tree `682f4e60`). Naming mismatch vs
   the `798bc548` brief → operator confirmation against the target screenshot required.

### Safety state at gate exit

```
D115 C / D                  : UNRESOLVED (unchanged)
runtimeCompanyId            : UNRESOLVED
implementationAuthority     : WITHHELD
productionEligible          : false
D115 production activation  : NOT AUTHORIZED
G-034                       : NOT EXECUTED
D114                        : UNTOUCHED
Production                  : FAIL-CLOSED · 0 providers · 0 sockets
Source modified this gate   : NONE
798bc548                    : NOT RECOVERED — recovery failure mode reproduced and
                              mitigated by remote durability; not recovered as an artifact
148 (82+66)                 : WINDOWS-ONLY OPERATOR ACCEPTANCE — Arena reproducibility
                              NOT CLAIMABLE; in-repo equivalent is AC-04 (3+4+2=9)
```
