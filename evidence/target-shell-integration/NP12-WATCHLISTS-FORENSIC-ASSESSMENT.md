# Institutional Investment Platform System (IIPS)
# NP-12 — WATCHLISTS: READ-ONLY FORENSIC ASSESSMENT

**Act Type:** FORENSIC ASSESSMENT (read-only; non-executable; no implementation authority)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
**Recorded At (UTC):** 2026-09-27
**Authoritative Baseline:** `origin/main` = `4d3e1cdca3a33da0ec3be8b336b17128108a502c`
**Recording Branch:** `arena/01a0e30c-iips-production-market-data` (byte-identical to baseline at recording)
**Implementation Authority:** **NOT GRANTED** — this act determines state only.

---

## 1. SCOPE OF ACT

Determine the existing authoritative state and governance requirements for NP-12 Watchlists.
No application code was modified. No build or test suite was executed. No migrations, no
dependency changes, no persistence, no transport, no identity/authorization changes.

---

## 2. AUTHORITATIVE BASELINE (verified at recording)

| Fact | Value |
| --- | --- |
| Remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` |
| Remote authoritative branch | `origin/main` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (post-fetch) |
| Recording branch | `arena/01a0e30c-iips-production-market-data` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c` |
| Branch vs baseline | zero diff (`git diff origin/main...HEAD` empty) |
| Worktree | CLEAN (before this document) |

---

## 3. WATCHLIST IMPLEMENTATION FINDINGS

Repository-wide search (`watchlist`/`watchlists`, favorites, saved symbols/securities,
portfolio lists, watch, security-related user preferences) — exact inventory:

**Code (all structural, fail-closed):**

| File | Lines | Content |
| --- | --- | --- |
| `frontend/src/app/App.tsx` | 34, 274–278, 417 | `WatchlistsStructural = structural('Watchlists', …)` → `<UnavailableSurface state="offline">`; mounted at `<Route path={ROUTES.watchlists}>`. Note verbatim: *"Watchlists require the platform watchlist services, which are not active offline"* / *"Donor structure: features/watchlists/Watchlists (server-coupled in the donor lineage). No watchlists or triggers are fabricated."* |
| `frontend/src/app/routes.ts` | 72 | `watchlists: '/watchlists'` route constant (restored donor structure only) |
| `frontend/src/app/navigation.ts` | 180–184 | `{ label: 'Watchlists', path: '/watchlists', minRole: 'viewer', status: 'unavailable' }` — donor lineage comment "UI07 Watchlists" (donor label only) |

**Tests (assert the fail-closed structure, never data):**

| File | Assertion |
| --- | --- |
| `tests/shell_offline_full_shell_restoration.test.ts` | OPTA-01 route inventory includes `/watchlists`; OPTA-04a every offline structural route renders fail-closed; OPTA-11 `App.tsx` must NOT import donor `Watchlists` component |
| `tests/shell_navigation_model.test.ts` | NAV-02/03: `Watchlists` must have status `unavailable` |
| `tests/shell_multifactor_screener_surface.test.ts:229` | `['Watchlists', '/watchlists', 'unavailable']` nav assertion |

**Absences (verified):** no `features/watchlists/` directory; no Watchlist store, state, types,
view-model, service, API client, or fixture anywhere in `src/`, `frontend/src/`, `tests/`;
no Watchlists `UISurfaceId` — current registry UI01–UI14 (`src/ui/types.ts:22–35`) assigns
**UI07 = `UI07_PIT_CORPORATE_ACTIONS`**, not Watchlists; convergence inventory records
Watchlists as **"OUTSIDE REGISTRY"** (surface #54, `evidence/target-shell-integration/
IIPS-HISTORICAL-CURRENT-CONVERGENCE-INVENTORY.md:166`: `PRUNED / DEFER / hist api`).

**Governance lineage:** donor surface #30 (`docs/PHASE1_AUTHORIZATION_PREPARATION.md:200`):
`watchlists/Watchlists.tsx` | `/watchlists` | `api/watchlists` | API-coupled | **DEFER** | family 5.7.
Spec surface matrix (program spec §surface inventory): *Watchlists | Yes | Data + triggers |
Persistent lists, triggers, score changes*. Program tracker: `P13-07 Watchlist integration`
— **NOT STARTED**, deps P07/P11/P12 (`DEP-MATRIX row 52`: "must be stable before dependent
work can be certified"); `INT-011 Watchlists / Alerts` — **BASELINE — VERIFY**,
"runtime topology remains a later governed decision". Donor widget "Watchlist Highlights"
(inventory row 25): screenshot only, **ZERO repo evidence**, UNVERIFIED.

---

## 4. EXISTING DATA FLOW (current repo)

```text
UI                          /watchlists → WatchlistsStructural → UnavailableSurface(state='offline')
 ↓                          (renders reason/note text only; holds no data, performs no fetch)
state/store                 NOT PRESENT
view model/controller       NOT PRESENT  (no Watchlists builder in src/ui/view_models/)
transport                   NOT PRESENT  (donor api/watchlists tier not present and excluded)
server/application layer    NOT PRESENT  (no server/, no api/ directory, zero /api/* call sites)
persistence                 NOT PRESENT
```

Current Watchlist state classification: **structural placeholder only** — no UI state,
no React/local state, no application store, no fixture backing, nothing server-backed,
nothing persisted (not even partially).

---

## 5. EXISTING PERSISTENCE PRIMITIVES (that DO exist; not Watchlist-related)

| Primitive | File | Mechanism | Governs | Identity scope | Write authority | Retention/lifecycle |
| --- | --- | --- | --- | --- | --- | --- |
| **PortfolioStore (BI-07)** | `frontend/src/features/portfolio/portfolio-store.ts` | In-memory `Map<string, PortfolioRecord>`; atomic save boundary; module singleton for Tier-B session continuity (App-level `useMemo`) | portfolio holdings aggregates + broker contribution audit records | `portfolioId` (`DEFAULT_PORTFOLIO`); **no user/tenant scope** | Save Guards (empty-write rejection, entity-authority check: resolved `companyId` or `NON_PRODUCTION_OPERATOR_BYPASS`, weight-sum = 100.0000%) + BI-08 content-hash idempotency (`ALREADY_IMPORTED_NO_OP`) | Session-lifetime only; `resetPortfolio` / `resetDefaultPortfolioStore`; **no durability across reload; no serialization to disk/network; no browser storage anywhere in repo (verified: 0 localStorage/sessionStorage/indexedDB uses)** |
| **PointInTimeStore (P08)** | `src/pit/pit_store.ts` | Append-only in-memory map `${companyId}:${domain}` → chronologically ordered frozen `CanonicalEnvelope`s | market-data domain snapshots (D01–D09) | `companyId` + `DataDomain` | append-only; historical overwrite prohibited; envelope validation + provenance lineageHash mandatory | In-process lifetime; PIT query semantics (`queryAsOf` zero-future-leakage) |
| **IdentityMappingStore (P04)** | `src/identity/mapping_store.ts` | effective-dated mappings + fail-closed quarantine (IdentityAmbiguityError) | security→companyId identity resolution | identifiers ISIN/CIN/NSE_SYMBOL/BSE_SYMBOL/COMPOSITE_TICKER | fail-closed resolution authority | In-process lifetime |
| **Serialization/chaining (P01-05/NFR-06)** | `src/contracts/provenance.ts` | isomorphic SHA-256 + `computeLineageHash(payload, {sourceClassification, asOf, dataVersion, parentHash?})` | all governed digests (envelopes, portfolio provenance, transports) | optional `tenantId` plumbing field only (unused at runtime except `IIPS_OFFLINE_BOOTSTRAP` in d114 loader) | — | — |

Answers to the standing questions:
1. **What exists:** three in-process stores + a provenance/serialization primitive (above).
2. **State governed:** portfolio aggregates (BI-07/08), PIT market-data snapshots (P08), identity mappings (P04).
3. **Identity scope:** `portfolioId` / `companyId` / identifier — **never user or tenant** (D115 UNRESOLVED; runtime session is display-only `ANONYMOUS_SESSION`).
4. **Write authority:** BI-07 save guards + idempotency (portfolio only); append-only envelope authority (P08). No write authority designated for any user-facing list state.
5. **Retention/lifecycle:** session-lifetime / process-lifetime only. No durable retention mechanism or policy exists.
6. **Can the existing mechanism represent Watchlists without a new persistence authority?**
   **UNRESOLVED** — the PortfolioStore *pattern* can represent a session-scoped securities-list
   aggregate in-process; the spec/tracker semantics ("Persistent lists, triggers, score
   changes") require durability and per-user identity that **no existing mechanism provides**,
   and designating a durability authority is a governed act that has not occurred (P13-07
   NOT STARTED; no authority act exists for Watchlists).

---

## 6. EXISTING TRANSPORT (that DOES exist; not Watchlist-related)

| Transport | File | Type |
| --- | --- | --- |
| P12 Product Transports | `src/transports/*` (engine_api_adapter, market_data_dto, fundamentals_dto, intelligence_dto, screener_service, object_resolver, types) | **in-process typed DTOs** with ExecutiveProvenance (AD-13; G2 retired) |
| Provider SPI (P02) | `src/spi/provider_spi.ts` | provider-neutral `MarketDataSource<T>` interface (fixture/offline providers) |
| Network transport | — | **NOT PRESENT**: zero `fetch`/`XMLHttpRequest`/`WebSocket`/`EventSource` call sites in app code (each Path-L surface header asserts this verbatim); no `server/`, no `api/` directories; donor `authFetch → /api/* → frontend/server/** → Keycloak` tier explicitly excluded by `PHASE5-OFFLINE-FULL-SHELL-RESTORATION-AUTHORITY-ACT.md` §3. ("NO production server tier; NO authFetch; NO /api/* calls; NO network calls of any kind") |

**Watchlists transport status:** no API, no server action, no RPC, no persistence adapter,
no provider-neutral Watchlist contract — **NOT PRESENT**. Donor-semantics transport
(`api/watchlists`) is **excluded by standing authority**. An in-process typed-transport
pattern (P12-style) exists and is the only transport pattern available in the current
environment; whether it can carry a governed Watchlist aggregate depends on the unresolved
persistence/identity decisions above. **No new transport was created.**

---

## 7. ENVIRONMENT / AUTHORITY BOUNDARY (repository evidence only)

| Fact | Evidence |
| --- | --- |
| Execution mode | `NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV` (every runtime file header; main.tsx:7) |
| D115 | `DEFERRED / WITHHELD / UNRESOLVED / NOT AUTHORIZED` (PHASE5 act §3; PHASE1_AUTHORIZATION_PREPARATION.md §G.1: "D115 C (authoritative companyId): UNRESOLVED; D115 D (Company/Security mapping): UNRESOLVED; runtimeCompanyId: UNRESOLVED; implementationAuthority: WITHHELD; productionEligible: false; D115 production activation: NOT AUTHORIZED") |
| Identity conflict (companyId vs donor `canonicalSecurityId`/FIGI) | **UNRESOLVED**; automatic reconciliation PROHIBITED (PHASE1_AUTHORIZATION_PREPARATION.md §G) |
| Authentication | **NOT PRESENT** — Keycloak/OIDC excluded (main.tsx deliberate exclusions; `/callback` structural only). Session = display-only `ANONYMOUS_SESSION` (`authenticated: false`, role `viewer`, tenantId `system`; "never an authorization authority") |
| Authorization | Role model is display-only (`frontend/src/core/session/session.ts`); `minRole` gates nav visibility only |
| Tenant/company identity | No tenant runtime; `tenantId` exists only as optional provenance/telemetry plumbing field |
| Dhan Level-1 | **DEFERRED** — fixture-level BI-08 workflow only (PHASE5 act §3) |
| Macro | **EXCLUDED** by D91/D88 (no relief) |
| Production eligibility | `productionEligible: false`; GovernanceFooter carries the fail-closed disclosure (Live Providers: 0 / Sockets: 0) |
| Program intent for Watchlists | spec: "Persistent lists, triggers, score changes"; tracker P13-07 NOT STARTED; INT-011 BASELINE — VERIFY; "runtime topology remains a later governed decision" |

**Currently authorized boundary in which NP-12 could eventually operate:** the offline,
non-production, fixture/offline-dev environment only — in-process, anonymous, anonymous-
tenant, with no server tier, no network, no durable persistence, and no user identity.
Any operation beyond that boundary requires explicit authority acts that do not yet exist
for Watchlists. **No production authorization decision is made by this act.**

---

## 8. NP-12 DECISION MATRIX

| Question | Evidence | Status |
| --- | --- | --- |
| Watchlist implementation exists? | Structural fail-closed surface only: `App.tsx:274–278,417`, `routes.ts:72`, `navigation.ts:184`; no feature module; OUTSIDE REGISTRY | ESTABLISHED |
| Watchlist state currently persisted? | No watchlist state exists; zero durable persistence of any kind in repo (no browser storage, no disk, no server) | NOT ESTABLISHED |
| Existing persistence primitive usable? | PortfolioStore (BI-07) pattern can hold a session-scoped aggregate in-process; no primitive provides durability or per-user scoping; designation act absent | UNRESOLVED |
| Existing transport usable? | In-process P12 typed-DTO pattern is the only available transport pattern; donor `api/watchlists` semantics excluded by PHASE5 §3; depends on unresolved persistence decision | UNRESOLVED |
| Identity scope established? | D115 UNRESOLVED/NOT AUTHORIZED; runtime identity = display-only `ANONYMOUS_SESSION`; existing stores scope by portfolioId/companyId, never user | NOT ESTABLISHED |
| Write authority established? | The only governed write boundary is the BI-07 portfolio atomic save (guards + idempotency + lineage digest); nothing designated for list state | NOT ESTABLISHED |
| Retention authority established? | Session/process lifetime only (Tier-B continuity); no durable retention mechanism or policy exists | NOT ESTABLISHED |
| Environment boundary established? | NON_PRODUCTION + Phase-5 exclusion set + productionEligible: false, fully recorded in-repo | ESTABLISHED |
| New persistence authority required? | For spec-semantics ("Persistent lists, triggers") no durable authority exists; whether session-scope suffices is an un-made governance decision | UNRESOLVED |
| New transport required? | For in-process session state, existing pattern suffices; for persistent/server semantics a transport would be required and is currently excluded | UNRESOLVED |

---

## 9. OUTCOME

**`NP-12 = GOVERNANCE INPUT REQUIRED`**

Rationale (evidence-grounded): the current-state facts are fully established, but the
persistence/transport decision for NP-12 has authoritative dependencies missing from the
repository:

1. **Identity scope (D115)** — Watchlists are per-user state in the donor lineage
   (`api/watchlists` + server tier + Keycloak identity). D115 is DEFERRED / WITHHELD /
   UNRESOLVED / NOT AUTHORIZED; no per-user or tenant identity exists to scope list state.
2. **Durability classification** — the program spec requires "Persistent lists, triggers,
   score changes"; no durable persistence authority exists in this repository, and no
   authority act has designated one (or authorized a session-scoped alternative). The
   tracker's own integration row keeps "runtime topology … a later governed decision".
3. **Work authority** — P13-07 Watchlist integration is recorded NOT STARTED; no authority
   act for NP-12 exists. Per `NEXT-PRODUCT-SURFACE-AUTHORITY-DESIGNATION-PACKET.md`,
   implementation authority is withheld for all surfaces until the authority holder designates.

The existing UI is a fail-closed structural placeholder; implementation readiness is NOT
declared. No implementation was performed.

---

## 10. CHANGES MADE BY THIS ACT

- ADDED: `evidence/target-shell-integration/NP12-WATCHLISTS-FORENSIC-ASSESSMENT.md` (this document).
- No code, test, fixture, contract, transport, persistence, identity, or configuration changes.
- No builds, tests, migrations, or qualification suites executed (targeted `grep`/`read` inspection only).

**FAIL-CLOSED NOTE:** no required authoritative fact was unestablishable during this pass;
the STOP condition did not trigger. The missing items above are missing *authorizations/
decisions*, recorded faithfully as UNRESOLVED — not missing *evidence*.
