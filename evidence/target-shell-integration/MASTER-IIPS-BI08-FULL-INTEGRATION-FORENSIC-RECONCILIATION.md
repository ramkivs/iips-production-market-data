# MASTER IIPS + BI-08 FULL INTEGRATION FORENSIC RECONCILIATION

**Gate:** Read-only forensic target reconciliation (authority: RAMKI message of 2026-09-23 —
"AUTHORITATIVE TARGET CHANGE": the operator screenshot is now the TARGET MASTER IIPS PLATFORM)
**Branch:** `arena/01a0c960-iips-production-market-data` · **Base:** `e0355f7f8d8b3519a522c638b9186a4f095ae579`
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
**NO implementation performed. ZERO source/test/route/navigation/config/D115/provider changes.**

---

## 0. TERMINAL CLASSIFICATION

> ## **B — MASTER IIPS PARTIALLY RECOVERABLE; SPECIFIC SOURCE/AUTHORITY GAPS REMAIN**
> ### The full platform's SOURCE is fully present in governed refs. Its FUNCTIONALITY is
> ### not recoverable in the governed non-production/offline mode without new authority.

Not **A**: source recoverability alone does not establish the integration target, because
the platform is a *client of an excluded server/auth tier*. Not **C**: the target IS
established from governed evidence (pinned donor refs, certified captures, route maps) —
no invention is needed to know what the platform is.

---

## 1. ACTUAL MASTER IIPS TARGET LINEAGE (Phase-1 items 1–3, 12)

| Element | Evidence |
| --- | --- |
| **Full-IIPS content baseline** | `8b10968` — "fix(pit): complete governed D114 handoff, gap refusal, executable Company path and Windows readiness" (pinned by the convergence plan §21) |
| **Ref baseline** | `42f91fa` — "docs(d115): record blocked identity reconciliation" |
| **Primary donor ref** | `origin/arena/01a0c440-iips-production-market-data` — full platform: 26 route paths, 25 nav entries, 19 feature dirs, 22 `api/` modules, **71 `frontend/server/` files**, `core/auth/` (AuthProvider, authContract, keycloakAdapter) |
| **Certified product** | `7964fcc` (branch `phase13-next`, 2026-09-03) — the E2E-018 certified product; **AppShell + TopBar blobs byte-identical to the donor** (`e05b823f` / `99100762`); 28 server files (earlier stage); `navigation.ts` evolved between them |
| **Certified captures** | `2f1049d` (`origin/m1-ad4-repair`): 19 operator captures under `real-keycloak-oidc-pkce`, incl. `executive.png` machine-recorded observables |
| **Shell recovery already executed** | Phase 1A (`f13002e`) recovered the shell **from donor blob `99100762`** (TopBar header records the provenance) with governed severances (§5) |

**Screenshot integrity note:** no image file was attached to this session — Arena viewed no
pixels. The enumerated visible-areas list in the authority message is treated as operator
attestation and cross-checked against the certified E2E-018 captures and donor source, per
the already-preserved `IIPS-HISTORICAL-CURRENT-CONVERGENCE-INVENTORY.md` (byte-unmodified).

## 2. FULL MASTER IIPS FEATURE / ROUTE INVENTORY (Phase-1 items 4–6)

**Donor route model (26 paths):** `/`, `/executive`, `/portfolio(+)`, `/research` +
`company/:id` + `sector/:id` + `events/:id` + `cross-sector` + `macro`, `/screener(+/governed)`,
`/search`, `/intelligence(+/decision-matrix)`, `/evidence(+:id, replay/:id)`, `/admin/*`
(8 tabs: Overview, Identity & Access, Tenants, Engines & Certification, Platform
Operations, Audit, Live Data & Governance, Migration/Workflow/Marketplace), `/collaboration`,
`/reports`, `/watchlists`, `/settings`, `/callback` (OIDC), `*`.

**Donor navigation:** 10 groups (Executive, Portfolio, Research×6 children, Intelligence×4
— Decision Matrix implemented, Opportunities/Risks/Rankings future, Evidence, Administration×8,
Collaboration, Reports, Watchlists, Settings).

**Coupling reality (the decisive fact, re-verified):** **53 donor feature files import the
`api/` layer** (22 modules) → `authFetch` → `/api/*` → `frontend/server/**` (71 files) →
Keycloak OIDC. The convergence plan's finding stands: the full-IIPS platform is **a client
of a server tier**, not an offline product that ships a server.

## 3. SCREENSHOT-TO-SOURCE EVIDENCE MATRIX (Phase-1 items 7–8; Phase-3 classes)

Class: **A** = source implementation recoverable · **B** = partially recoverable ·
**C** = screenshot-only / lineage unproven · **D** = intentionally deferred by authority ·
**E** = externally blocked (D115/provider/auth/data).

| Screenshot area | Source implementation | Class | Note |
| --- | --- | --- | --- |
| IIPS branding | TopBar brand — recovered, live | **A** (done) | |
| Tenant / Role | TopBar props — recovered, live | **A** (done) | never auth-derived |
| Global Search | GovernedSearch + `/search` + `api/p12Search` + palette | **E** | api/server/auth dependency |
| Notifications | NotificationDrawer + `api/notifications` | **E** | overlay severed in Phase 1A |
| Notes | NotesDrawer + `api/notes` | **E** | overlay severed in Phase 1A |
| Sign out | `useAuth` (Keycloak) on TopBar | **E** | D115 + auth seam; severed by Option F-a |
| Portfolio → Overview → workspace | **BI-08 (current)** | **A (done)** | target architecture already live |
| Executive (portfolio-level dashboard) | `ExecutiveDashboard` (fetchExecutiveData) | **B/E** | source exists; current `/executive` = UI02 company-level (identity divergence); payload X-1..X-5 |
| Research: Company / Sector / Events / Cross-Sector / Screener / Macro | donor components all exist | **B/E** | `/research` = UI03 only (designated); Macro additionally **D91-blocked** |
| Intelligence: Decision Matrix / Opportunities / Risks / Rankings | DecisionMatrix exists; O/R/R were future-markers even in the donor | **B / D / E** | no current UISurfaceId for Decision Matrix; O/R/R never implemented anywhere |
| Evidence: Decision Evidence | EvidenceHub/Explorer exist | **A→done as UI11 partial** | payload E-1..E-5 |
| Administration (8 tabs) | all 8 donor components exist | **E** | Keycloak + server + **D115** |
| Settings / Reports / Watchlists / Collaboration | donor components exist | **E** | api/server |
| Security Master | no donor route; current UI08 + governed D05 master | **B** | data-ready, undesignated |

## 4. CURRENT ARENA IMPLEMENTATION INVENTORY

501/501 tests · 77 suites · tsc/vite PASS · frozen trees `8491efdc`/`9080e997`/`0062ad52`/
`1597ed06` · navigation: Portfolio **implemented** (with Overview child), Intelligence /
Evidence / Executive / Research(UI03) **partial** presentation-only, seven honest `future`
placeholders · 13 concrete routes, no params, no callback · overlays unmounted (prop seams
only) · no server, no OIDC, no `/api` (bundle-verified every phase).

## 5. DIFFERENCES: REDUCED RECOVERED SHELL vs COMPLETE PLATFORM (Phase-1 item 11)

Verified by byte-diff of current shell vs donor:

1. **TopBar**: donor imported `useAuth` (Keycloak) gating Sign-out; current severs it
   (Option F-a, governed header) — role/tenant remain props.
2. **AppShell**: donor mounted CommandPalette + NotificationDrawer + NotesDrawer; current
   omits all three (api-coupled, Phase-1A exclusion; TopBar prop seams retained).
3. **navigation.ts**: donor 25 entries with children; current 12 top-level, honest statuses,
   research children pruned to the single-route contract.
4. **routes.ts**: donor 26 paths incl. `:param` children + `/callback`; current 13 concrete
   (Phase-1A OQ-1 = Option A: constants removed rather than retained as dead links).
5. **Feature surfaces**: donor 19 API-coupled feature dirs; current = BI-08 + four
   presentation-only partial surfaces + placeholders.

Every difference is a **recorded authority decision**, not a loss.

## 6. BI-08 INTEGRATION MAPPING (Phase-2)

> **Required target — `Master IIPS → Portfolio → Overview → BI-08 PortfolioWorkspace` —
> IS ALREADY THE CURRENT, ACCEPTED ARCHITECTURE.**

Verified: `navigation.ts` carries Portfolio (`implemented`) with child Overview →
`/portfolio` → the **current BI-08 PortfolioWorkspace** (tree `8491efdc`, never replaced;
historical API-coupled PortfolioWorkspace never imported). Mount accepted at
`144e8ed`/`4096276` (per `BI08-MASTER-IIPS-INTEGRATION-FINAL-RECONCILIATION.md`, preserved).
All listed BI-08 preserves verified green in the current suite (163/163 BI-08 functional
tests): broker import, Zerodha workflow, Dhan fixture-level workflow, duplicate/no-op
idempotency, AIIL and AGI GREENPAC mappings, unresolved retention, persistence/provenance.
**No BI-08 work is required by this gate.** The only open BI-08-adjacent item is the
eventual main-merge disposition (PR), which is separate.

## 7. MASTER PLATFORM PRESERVATION MATRIX (Phase-3)

Nothing in the current state *deleted or downgraded* Master functionality: every pruned
route/overlay/surface is either (a) preserved in donor refs, (b) represented by an honest
placeholder, or (c) recorded as authority-deferred. No C/D/E item has been silently
converted into "missing implementation" — the convergence inventory preserves the full
record. The reduced shell was never declared to *be* the complete platform; it is the
governed offline-mode instantiation of it.

## 8. CURRENT-VS-TARGET GAP MATRIX (Phase-4)

| Master IIPS target | Current Arena state | Source lineage | Gap type | Required action | External dependency |
| --- | --- | --- | --- | --- | --- |
| Full nav/route model (26 paths, children) | 13 concrete routes, no children | donor (pinned) | **authority gap** | amend Phase-1A pruning via new act | none for structure; surfaces fail-closed offline |
| Executive portfolio dashboard | UI02 company-level partial | donor `ExecutiveDashboard` | **integration + identity + data gap** | granularity designation + X-1..X-5 | none (offline) |
| Research children (Company/Sector/Events/Cross-Sector/Screener) | `/research` = UI03 single route | donor components | **identity + data gap** | per-surface designation + payloads | none (offline) |
| Macro child | excluded | donor `MacroContext` | **authority gap (D91/D88)** | D91 relief | LIVE-only macro governance |
| Intelligence Decision Matrix | not represented | donor `DecisionMatrix` | **implementation + data + auth gap** | new construction authority | `api/decisionMatrix` + palette/auth |
| Global Search / Notifications / Notes / Command Palette | prop seams only | donor overlays | **production dependency (E)** | server tier + auth | server, Keycloak |
| Administration (8 tabs) | `future` placeholder | donor admin components | **authority gap (D115) + production (E)** | D115 disposition + server | Keycloak/IdP |
| Settings / Reports / Watchlists / Collaboration | `future` placeholders | donor components | **production dependency (E)** | server tier | api/server |
| Sign-out | severed (Option F-a) | donor `useAuth` | **authority gap (D115/auth seam)** | auth gate | OIDC |
| Security Master | `future` placeholder; UI08 + D05 data exist | current registry + D05 | **designation gap only** | designation act | **none — data-ready** |
| BI-08 under Portfolio → Overview | **live, accepted** | BI lineage | **none** | none | none |

**Not all gaps are implementation work**: the dominant gap classes are authority (D115,
D91, Phase-1A pruning) and production dependency (server/auth/live data) — exactly as the
convergence plan classified ("re-source each remaining surface individually — deferred and
gated").

## 9–10. D115 / DHAN BOUNDARIES

**D115 = DEFERRED** (WITHHELD / UNRESOLVED / NOT AUTHORIZED). Governs: Identity & Access,
Tenants, sign-out/OIDC seam, runtime identity binding. No work performed, requested, or
implied. **Dhan Level-1 = DEFERRED** (credentials/entitlement/environment absent). The
integration remains valid in the governed non-production/offline state; where live data is
unavailable, honest fail-closed/offline states are preserved (and are test-enforced).

## 11. RECOVERABILITY ASSESSMENT (Phase-1 item 12)

- **Source recoverability: COMPLETE.** The full platform (shell, 19 feature dirs, api layer,
  71-file server tier, auth infra) exists in pinned, pushed refs. No code invention is
  required for any screenshot-visible area.
- **Functional recoverability in the governed offline mode: PARTIAL.** The shell and
  presentation kit are recovered; BI-08 is integrated; four surfaces exist as
  presentation-only partials. The remaining functionality requires either the excluded
  server/auth tier (E-class) or per-surface offline re-sourcing (individually gated —
  the plan's Phase 5.x pattern, begun by Phases 1C/2/3/4).
- **Hence classification B.**

## 12. EXACT IMPLEMENTATION SEQUENCE REQUIRED (design record only — NOT authorized)

1. **Authority act amending the Phase-1A pruning** for the donor navigation/route model
   (13 → 26 paths; reinstates children incl. `:param` routes — requires a NAV-11
   concrete-path contract change; NAV-05 dead-children contract must be addressed).
2. Mount donor feature components **in offline fail-closed states** (honest unavailable
   rendering, mirroring the established pattern) — OR re-source per surface (Phase 5.x),
   one authority per surface.
3. Overlays (Search/Notifications/Notes/Palette): E-class — server + auth prerequisite.
4. Administration: D115 + server prerequisite.
5. Macro: D91/D88 relief prerequisite.
6. Executive granularity: separate identity designation (portfolio-level vs company-level).
7. Security Master: designation only (data-ready).
8. Each step: its own durability checkpoint; BI-08 tree remains frozen throughout.

## 13–15. AUTHORITY / COMPLETE / EXTERNAL ITEMS

- **Requiring separate authority:** every item in §12; any route/navigation change; any
  overlay mount; any D115/D91 disposition; any server-tier import (prohibited by standing
  acts unless explicitly reversed).
- **Already complete:** shell recovery (`f13002e`); **BI-08 integration under Portfolio →
  Overview (accepted `144e8ed`/`4096276`)**; the four partial presentation surfaces; honest
  governed navigation; 501/501 validation; all BI-08 invariants.
- **External/deferred:** D115; Dhan Level-1; server/live tier; providers; Keycloak; macro
  (D91); production data.

---

## NEXT AUTHORITY ACTION (returned automatically — NOT selected)

**Decision required: disposition of the Master IIPS target given classification B.** The
options are mutually exclusive:

- **(A) AUTHORIZE OFFLINE FULL-SHELL RESTORATION** — amend the Phase-1A pruning to recover
  the donor navigation/route model and mount donor feature components in **offline
  fail-closed states** (no server, no auth, no live data; every API-coupled surface renders
  its honest unavailable state). Preserves the full platform *structure* without the
  excluded tier.
- **(B) AUTHORIZE PER-SURFACE FUNCTIONAL RECOVERY** — continue the individually-gated
  Phase 5.x pattern (next candidates: Security Master UI08 — data-ready; Executive
  granularity; Research children), one authority per surface.
- **(C) AUTHORIZE THE SERVER/AUTH TIER WORKSTREAM** — the only path to the platform *as
  photographed*; requires reversing standing exclusions and D115 disposition. Currently
  NOT AUTHORIZED by any act.
- **(D) CONFIRM CURRENT STATE AS THE GOVERNED MASTER PLATFORM** — record that the reduced
  shell + BI-08 + partial surfaces IS the Master IIPS platform for the governed
  non-production/offline execution mode, with the full platform as the production-mode
  target pending D115/Dhan/server authority.

**Standing disclosure:** D115 = DEFERRED / WITHHELD / NOT AUTHORIZED · Dhan Level-1 =
DEFERRED · `productionEligible` = false · external live sockets 0 · G-034 not executed ·
D91/D88 unchanged · no implementation authorized or performed by this gate · Windows visual
acceptance never claimed as Arena-reproduced.

**End of forensic reconciliation — classification B — gate STOPPED, awaiting authority.**
