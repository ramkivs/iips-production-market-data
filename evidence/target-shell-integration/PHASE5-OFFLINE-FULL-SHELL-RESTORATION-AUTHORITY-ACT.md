# PHASE 5 — OPTION A: OFFLINE FULL-SHELL RESTORATION — AUTHORITY ACT

**Act identifier:** `phase5-offline-full-shell-restoration-2026-09-23-001`
**Authority:** RAMKI — "IIPS — OPTION A AUTHORITY ACT / OFFLINE FULL-SHELL RESTORATION" (2026-09-23)
**Originating checkpoint:** `b31ed94f6d9c202617682dcdd249a6f6380419bf` (MASTER IIPS + BI-08 FULL
INTEGRATION FORENSIC RECONCILIATION, classification B)
**Donor source (pinned):** `origin/arena/01a0c440-iips-production-market-data`
(content baseline `8b10968`, ref baseline `42f91fa`; recovered shell provenance tree
`682f4e6029818c839f23211ae5067eed862c5037`)
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED

---

## 1. AUTHORITY SELECTION

Option **A — OFFLINE FULL-SHELL RESTORATION** is explicitly authorized from the
classification-B options presented by the forensic reconciliation. This act is
IMPLEMENTATION AUTHORITY for the offline full-shell restoration **only**.

## 2. AUTHORIZED SCOPE (exact)

1. Restore the donor Master IIPS shell **STRUCTURE**: donor navigation hierarchy (donor
   model: 10 groups / 30 items incl. children; 26 donor route paths incl. `/callback`,
   `/search`, `/screener(+/governed)`, research `:id` children, evidence `:id`/replay
   children, and the 8 Administration tabs).
2. Mount donor **presentation/route structure ONLY** where it can be done without
   activating excluded dependencies; every restored API/auth/data-dependent surface
   renders an explicit, honest, fail-closed state (OFFLINE / UNAVAILABLE /
   AUTHORIZATION REQUIRED / GOVERNED DATA UNAVAILABLE / EXCLUDED BY AUTHORITY).
3. Restore structural presence of Global Search, Notifications, Notes (offline structural
   overlays on the preserved TopBar prop seams) and the Sign-out structural entry
   (honest unavailable notice; no auth).
4. Update NAV-05 / NAV-10 / NAV-13 / NAV-14 (and NAV-02/NAV-03 status expectations) as
   required by this act so restored concrete donor paths and the new `unavailable`
   status are legitimate; dead links remain prohibited.
5. Introduce presentation-only status `unavailable` (= structurally present, fail-closed)
   to keep the distinction: STRUCTURALLY PRESENT vs FUNCTIONALLY AVAILABLE.
6. Controlled contract amendments to existing guard tests where they pinned the Phase-1A
   pruned model (REG-03 sign-out seam, REG-04 administration state, navigation model
   contracts listed above). Every amendment must be honest and documented.

## 3. EXCLUSIONS (absolute)

- NO production server tier; NO `frontend/server/**` import; NO Keycloak; NO OIDC
  activation; NO `authFetch`; NO `/api/*` calls; NO network calls of any kind; NO
  credentials; NO provider activation; NO synthetic/successful API responses; NO
  fabricated scores, prices, alerts, notifications, recommendations, research, reports,
  watchlists, or administrative results.
- **D115 = DEFERRED / WITHHELD / UNRESOLVED / NOT AUTHORIZED.** Administration is
  STRUCTURE ONLY (8 routes/tabs, authorization-required states). No Identity & Access,
  no Tenants runtime, no runtime identity binding, no sign-out authentication.
- **Dhan Level-1 = DEFERRED.** No credentials, token, entitlement, handshake, or feed.
  The accepted BI-08 Dhan fixture-level workflow must remain intact and fixture-level.
- **Macro = EXCLUDED (D91/D88).** `/research/macro` restored structurally ONLY, rendering
  its excluded-by-authority state. No macro live endpoint.
- NO resolution of the Executive granularity/identity conflict (UI02 company-level stays;
  donor portfolio-level Executive is NOT restored, no portfolio-level data fabricated).
- NO UISurfaceId merging: `/research` stays UI03_FUNDAMENTAL_ANALYSIS; UI05/UI06/UI12/UI13
  are NOT designated and NOT claimed implemented under UI03. Restored child routes are
  structural surfaces WITHOUT registry identities.
- NO per-surface Phase 5.x functional recovery; NO D115; NO Dhan — after completion, STOP.

## 4. PRESERVATION REQUIREMENTS (non-negotiable)

- **BI-08 remains authoritative**: frozen tree `8491efdc` (frontend/src/features/portfolio)
  must not change; accepted lineage `144e8ed` (mount) / `4096276` (acceptance closure)
  stands; `/portfolio` renders the CURRENT BI-08 PortfolioWorkspace; all BI-08 tests and
  invariants (broker import, Zerodha, Dhan fixture, duplicate/no-op, AIIL, AGI GREENPAC,
  unresolved retention, persistence/provenance) remain green.
- The four existing partial surfaces are preserved EXACTLY as-is:
  Intelligence (UI04, partial), Evidence (UI11, partial), Executive (UI02, partial),
  Research (UI03, partial). No downgrade, no silent promotion, no donor-component
  replacement.
- Frozen trees: `src/identity` `9080e997`, `src/d114` `0062ad52`, `src/ui` `1597ed06`.
- The fail-closed production disclosures (Live Providers: 0 / Sockets: 0 /
  NON_PRODUCTION / OFFLINE_FIXTURE) remain on every surface.

## 5. VALIDATION GATES (per phase)

Baseline (before) and regression (after): full suite, tsc, vite production build, bundle
audit (no `authFetch` / `/api/` / Keycloak / OIDC / Bearer / unauthorized `fetch` in the
runtime bundle), plus new structural tests: route inventory, navigation inventory,
fail-closed rendering for every restored surface, offline-source guard, no-dead-links.
Mutation testing: network/API insertion, auth/OIDC insertion, synthetic payload
insertion, fabricated value insertion, unauthorized surface identity binding, BI-08
replacement — each must trip a guard; source restored byte-exact afterwards.

## 6. DURABILITY

Commit per meaningful phase; push normally; verify LOCAL == REMOTE + clean worktree; no
force-push, no history rewrite, no resets of accepted work; `main` (`94f519bf`) is not
modified by this act. Windows visual acceptance is NOT claimed by Arena; an operator
checklist is produced separately if required.

**Act recorded before implementation, per the Option A authority message.**
