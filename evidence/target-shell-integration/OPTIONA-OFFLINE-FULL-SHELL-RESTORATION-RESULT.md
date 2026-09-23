# OPTION A — OFFLINE FULL-SHELL RESTORATION RESULT

**Authority act:** `phase5-offline-full-shell-restoration-2026-09-23-001` (RAMKI, 2026-09-23)
**Starting checkpoint:** `b31ed94f6d9c202617682dcdd249a6f6380419bf` (forensic reconciliation, classification B)
**Execution checkpoints:** authority act `27e2173` → implementation `6b8afda` → this report (final)
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED

---

## 1–3. Authority act / start / donor

Act recorded BEFORE implementation (checkpoint `27e2173`). Donor: pinned
`origin/arena/01a0c440-iips-production-market-data` (content baseline `8b10968`, ref
baseline `42f91fa`; recovered-shell provenance tree `682f4e60`). A 4th sandbox re-clone was
detected at Phase A (documented signature) and recovered verbatim (full-refspec unshallow
fetch → byte-compare 14/14 identical, zero missing → mixed reset to `b31ed94` → rebuild) —
baseline re-verified 501/501·77 BEFORE any source change.

## 4–5. Routes and navigation (before → after)

| | Before (Phase-1A pruned) | After (Option A) |
| --- | --- | --- |
| Route constants | 13 | **36** (26 donor App.tsx paths + 2 preserved current-base + donor future-marker constants) |
| Route paths rendered | 13 | **29 rendered** (+ 3 future-marker constants without routes, as in the donor) |
| Nav groups (top-level) | 12 | 12 (same order — no reordering regression) |
| Nav items (incl. children) | 13 | **32** |
| Nav statuses | implemented/partial/future | + **`unavailable`** = structurally present, fail-closed |
| Status census | 1 impl · 4 partial · 8 future | **2 impl · 5 partial · 20 unavailable · 5 future** |

Restored donor structure: Research children (Company/Sector/Events — concrete `Banking`
deep links per the donor N+7/P-4 contract — Cross-Sector, Screener, Macro), Intelligence
children (Decision Matrix + Opportunities/Risks/Rankings which stay `future` exactly as in
the donor), Evidence child (Decision Evidence → the Hub), Administration's 8 governed tabs
(admin-only), Collaboration/Reports/Watchlists/Settings, `/search`, `/screener/governed`,
`/evidence/:id` + `/evidence/replay/:id`, `/admin/*` wildcard, `/callback` (outside the
shell layout, per the donor route contract), `/portfolio/*` (donor N+18 — same BI-08 element).

## 6. Features restored STRUCTURALLY (donor lineage, no runtime dependencies)

Global Search (route + TopBar palette structure + Ctrl+K), Notifications (drawer
structure), Notes (drawer structure), Sign-out (structural entry + honest notice),
Screener + Governed Screener, Research Company/Sector/Events/Cross-Sector, Macro
(structure only — D91/D88 EXCLUDED), Intelligence Decision Matrix, Evidence
Detail/Replay, Administration ×8 tabs, Collaboration, Reports, Watchlists, Settings,
OIDC callback route structure (NO activation).

## 7. Features FUNCTIONALLY AVAILABLE offline (unchanged)

**Portfolio → Overview → BI-08 PortfolioWorkspace** (the authoritative, accepted
integration — untouched); Executive (UI02, partial), Research (UI03, partial),
Intelligence (UI04, partial), Evidence (UI11, partial) — all four preserved exactly.
Session/RBAC display model, governance disclosures.

## 8. Features STRUCTURALLY PRESENT but FAIL-CLOSED

All §6 surfaces render `UnavailableSurface` with one of three honest states:
`OFFLINE — SERVICE NOT ACTIVE` (server/API-coupled donor surfaces) ·
`AUTHORIZATION REQUIRED — D115 DEFERRED` (all Administration tabs, /callback) ·
`EXCLUDED BY AUTHORITY` (Macro, D91/D88). No fetch, no service invocation, no simulated
response, no fabricated values (currency/decimal/grouped-number scan enforced by test).

## 9. Existing partial surfaces preserved

UI02/UI03/UI04/UI11 render their OWN components — verified by OPTA-07 (their own
markers, never the structural page) and their four full suites (all green). No downgrade,
no promotion, no donor substitution. /research remains the single UI03 surface; restored
children claim NO UISurfaceId (OPTA-08; proven by mutation M-5).

## 10. BI-08 preservation verification

Frozen tree `frontend/src/features/portfolio` = **`8491efdc` — UNCHANGED** (git tree hash
at every checkpoint). Accepted lineage `144e8ed`/`4096276` stands. `/portfolio` renders
the certified workspace (root class + `BI-07 Host Verified` in bundle); MOUNT-01..06 green;
BI-08 functional suites 163/163 green; no `api/portfolio` import (OPTA-12; proven by
mutation M-6). Duplicate/no-op, AIIL/AGI mappings, unresolved retention, Dhan
fixture-level workflow — all covered by the unchanged BI-08 suites.

## 11–12. D115 / Dhan boundaries

**D115 = DEFERRED / WITHHELD / UNRESOLVED / NOT AUTHORIZED.** Administration is structure
only (8 routes/tabs, authorization-required states); no Identity & Access, no Tenants
runtime, no runtime identity binding, no Keycloak, no sign-out authentication, no
credentials. The sign-out structural entry discloses that no identity layer is active.
**Dhan Level-1 = DEFERRED.** No credentials/token/entitlement/handshake/feed; the accepted
BI-08 Dhan fixture-level workflow remains intact and fixture-level.

## 13. API/auth/network audit

Source guard (comment-stripped, `frontend/src/app/**`): zero `authFetch`, zero `/api/`,
zero `core/auth`, zero `frontend/server`, zero `fetch(`, zero `XMLHttpRequest`/
`EventSource`/`WebSocket` (OPTA-10). Runtime bundle: all prohibited tokens absent
(authFetch, keycloak, oidc, Bearer, /api/, frontend/server, XHR, EventSource, WebSocket);
`fetch(` count = 1 (undici polyfill, established baseline). No donor API-coupled feature
component is imported (OPTA-11). Governance disclosures render on every surface.

## 14–16. Test / build / mutation results

- **Tests: 516/516 · 81 suites** (501 baseline + 15 new Option A tests; zero baseline
  regressions). tsc: 0 errors. Vite production build: clean.
- **Mutations — every prohibited mutation tripped its guard; every restore byte-exact
  (worktree CLEAN after each):**
  1. Network/API insertion (`fetch('/api/health')` in a fail-closed surface) → OPTA-10 FAIL ✓
  2. Auth/OIDC insertion (`useAuth` import into TopBar) → OPTA-10 FAIL ("must not contain the Keycloak auth provider") ✓
  3. Synthetic payload insertion (Composite Score 94.20 · ₹1,234,567.89 · 100.0000%) → OPTA-04a/04c FAIL (monetary + decimal scan) ✓
  4. Fabricated status promotion (Administration → `implemented`) → NAV-01/NAV-02/ADMIN-01 FAIL ✓
  5. Unauthorized surface identity binding (research child → "UI05 — Sector Scoring Radar") → OPTA-08 FAIL ✓
  6. BI-08 replacement (/portfolio → placeholder) → MOUNT-01/02/04 + OPTA-06 FAIL ✓
- Process note (honest record): M-4's first restore ran before the implementation was
  committed and reverted navigation.ts to the pre-Option-A committed state; the Option A
  model was restored byte-exact, re-verified 516/516, and the implementation was THEN
  committed (`6b8afda`) before M-4-retry/M-5/M-6 — which all restored cleanly.

## 17. Frozen-tree verification

`frontend/src/features/portfolio` `8491efdc` ✓ · `src/identity` `9080e997` ✓ ·
`src/d114` `0062ad52` ✓ · `src/ui` `1597ed06` ✓ — all unchanged at final checkpoint.

## 18. Windows acceptance requirements (if required)

Arena does NOT claim Windows visual acceptance. If required, the operator checklist:
(1) `npm run build:vite` + serve; (2) sidebar shows 12 groups incl. Research/Intelligence/
Evidence children + (admin session) 8 Administration tabs, each with an honest badge;
(3) every `unavailable` surface opens and shows OFFLINE/AUTHORIZATION-REQUIRED/EXCLUDED —
never data, never a spinner; (4) Macro shows EXCLUDED BY AUTHORITY; (5) TopBar: Search /
Notifications / Notes triggers open the offline panels; Sign out shows the
unavailable-identity notice; (6) Ctrl+K opens the offline palette; (7) Portfolio →
Overview renders the certified BI-08 workspace; Executive/Research/Intelligence/Evidence
render their partial surfaces; (8) footer disclosures (Live Providers: 0 / Sockets: 0)
visible everywhere; (9) browser dev-tools network tab: zero outbound requests.

## 19. Final Git durability checkpoint

This report commits the final checkpoint (LOCAL == REMOTE, CLEAN, `main` `94f519bf`
untouched, no force-push, no history rewrite).

---

## FINAL STATUS (structure vs function)

| Category | Items |
| --- | --- |
| **STRUCTURE RESTORED** | Full donor shell structure: 26 donor route paths, donor navigation hierarchy (32 items), TopBar overlay structure + Sign-out entry, Ctrl+K, 8 Administration tabs, OIDC callback route structure |
| **FUNCTIONALITY AVAILABLE** | BI-08 Portfolio (authoritative, accepted) + the four preserved partial presentation surfaces (UI02/UI03/UI04/UI11) + RBAC/session display + governance disclosures |
| **FUNCTIONALITY FAIL-CLOSED** | All 29 rendered structural routes for server/API/auth-coupled donor surfaces — explicit OFFLINE / AUTHORIZATION REQUIRED (D115 DEFERRED) / EXCLUDED (D91/D88 macro) states |
| **EXTERNALLY DEFERRED** | D115 (identity/access/tenancy/admin runtime) · Dhan Level-1 (provider activation) · the server/auth tier itself · macro live governance (D91/D88) |

**Not claimed:** production ready · D115 complete · Dhan active · server/auth
functionality restored. The platform remains NON_PRODUCTION / OFFLINE / FAIL-CLOSED with
`productionEligible` = false, zero live sockets, zero providers.

## NEXT AUTHORITY ACTION (returned automatically — NOT selected)

Option A's authorized scope is complete and STOPPED. Candidate next actions, requiring
explicit selection:

- **(A) Per-surface functional recovery** — continue the individually-gated Phase 5.x
  pattern (candidates: Security Master UI08 — data-ready via governed D05; Executive
  granularity designation; Research children payloads R-1/R-5/R-6; Intelligence payload).
- **(B) Windows visual acceptance** — operator executes the §18 checklist on the restored
  shell (Arena never claims it).
- **(C) Main-merge disposition** — the accepted arena branch now carries the full-shell
  restoration; a normal GitHub PR to `main` remains a separate disposition.
- **(D) D115 / Dhan / server-tier disposition** — all still DEFERRED; any movement
  requires explicit new authority.

**No per-surface Phase 5.x work, D115, or Dhan work was started. Gate STOPPED.**
