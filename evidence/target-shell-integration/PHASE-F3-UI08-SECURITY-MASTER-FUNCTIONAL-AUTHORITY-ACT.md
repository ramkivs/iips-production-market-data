# PHASE F-3 — UI08 SECURITY MASTER FUNCTIONAL IMPLEMENTATION — AUTHORITY ACT

**Act identifier:** `f3-ui08-security-master-functional-2026-09-23-001`
**Authority:** RAMKI — "IIPS — F-3 UI08 SECURITY MASTER FUNCTIONAL IMPLEMENTATION" (2026-09-23)
**Originating designation:** F-2 = **A — DESIGNATION SUPPORTED** (checkpoint `91a0a3d2` state;
D05 manifest SHA-256 `7f53540b…74b5`; authorization act
`AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001`)
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED

---

## 1. TARGET

**Surface:** `UI08_SECURITY_MASTER` (builder `UI08SecurityMasterModalBuilder`,
`src/ui/view_models/ui08_security_master_modal.ts`, blob `8427932f` at act time)
**Route:** `/security-master` (route constant already declared in `frontend/src/app/routes.ts`)
**Functional source:** the governed D05 Security Master — `getGovernedBroadSecurityMaster()`
(`src/identity/governed_fixture_master.ts`, tree `9080e997`, 2,250 canonical entities) via the
existing in-process `ObjectResolverService` (`src/transports/object_resolver.ts`, blob `ec8f898c`).

## 2. REQUIRED IMPLEMENTATION

Mount a routed UI08 surface at `/security-master` that binds the EXISTING
`UI08SecurityMasterModalBuilder` and the EXISTING governed resolver to the governed D05
master. No new identity resolver; no duplication of D05 data (the cached governed master
singleton / the App-injected instance is used); no server/API path; no donor Administration
code; no D115.

Preserved behaviors (existing UI08 contract): canonical `EQ_*_IN` companyId, companyName,
full resolution descriptor (ISIN/CIN/listings/sector/industry/face value/currency),
provenance + lineage digest, fail-closed unmapped-identity behavior, ambiguous-identity
quarantine (`IdentityAmbiguityError` + quarantine record), responsive tiers, and the
accessibility/focus semantics already defined by the UI08 view model.

## 3. EXPLICITLY PERMITTED (and nothing more)

- Route registration for `/security-master` (replacing its `future` marker).
- Navigation registration update for the Security Master entry (`future` → `implemented`).
- A UI08 surface component (`frontend/src/features/security-master/`).
- Governed D05 data binding (injected or cached governed master).
- Routed-surface tests + the bounded amendments to the navigation-census guard tests that
  pinned Security Master as `future` (NAV-01/NAV-03, OPTA-02 census).
- Accessibility/viewport behavior already defined by the UI08 view model.
- Fail-closed unavailable/quarantine rendering.

## 4. EXPLICITLY PROHIBITED

New API · `frontend/server` integration · `authFetch` · OIDC/Keycloak · D115 runtime ·
Dhan · NSE · production credentials · production market-data activation · replacement of
D05 identity machinery · fuzzy identity matching · synthetic product data. Binding any of
UI05/UI06/UI07/UI09/UI10/UI12/UI13/UI14 to this route.

## 5. AUTHORITY BOUNDARY

**UI08 only.** No authority is granted to activate any other surface, dataset, provider,
or runtime. All standing exclusions (D115, Dhan, NSE, server/API, OIDC, D91/D88 macro)
remain in force.

## 6. REQUIRED ACCEPTANCE

Functional tests · routed-surface tests · typecheck · build · comment-stripped boundary
scan of the implementation delta (zero executable activation signals) · mutation/negative
guards (synthetic-source swap, ticker-only identity, API/network, auth/OIDC, undesignated
surface binding, invalid-identity promotion — each must trip a guard, restores
byte-exact) · full-suite regression (baseline 516/516 · 81) · one implementation commit +
push + LOCAL == REMOTE.

**Act recorded BEFORE any source change.**
