# D75 — R-3 SAVED-SCREEN PERSISTENCE IMPLEMENTATION

**Act ID:** `D74-PROGRAM-AUTHORITY-IMPLEMENTATION-R3-SAVED-SCREEN-PERSISTENCE`
(record filed as the next free D-number, **D75**)
**Authority:** **Program Authority — D74 implementation authorization, R-3 ONLY.**
**Type:** Additive transport-layer implementation. Not acceptance, not certification,
not production activation.
**Branch:** `arena/01a0814b-iips-production-market-data` · **Base:** `4e8c766…` (D71), tree clean.

---

## 1. WHAT WAS WIRED

Saved screen definitions previously **died with the request**: `screenerContract.js`:296-309
returns a frozen object and never writes. R-3 gives them durability by adapting the **existing**
governed `PersistenceService` (PF-1a → Class C filesystem journal → TD-2/TD-3/TD-7a), which was
already implemented and tested (21 tests) but had **zero consumers**.

**No new persistence technology, no vendor, no new dependency** — `node:fs/os/path` only, via the
existing service.

### Persistence flow

```
POST /api/screener/saved
  → authorizeRead(...)                        existing security path (401/403)
  → resolvePrincipalTenant(principal)         server-derived tenant
  → resolvePrincipalOwner(principal)          server-derived owner   [NEW]
  → saveGovernedScreenDefinition(...)         CERTIFIED C6 contract — UNCHANGED, validates & builds
  → saved-screens-store.saveScreen(...)       [NEW] persists the definition VERBATIM, after validation
  → PersistenceService.append(...)            existing TD-2 primitive, append-only journal
  → response = certified definition + { persisted: { recordId, createdAt } }

GET /api/screener/saved                       [NEW] lists this principal's durable screens
  → listScreens(tenant, owner) → PersistenceService.listOrdered(...)   tenant+owner scoped
```

**Ordering** is the service's governed deterministic order (`createdAt` DESC, then `seq` DESC) —
not re-implemented here.

---

## 2. FILES CHANGED (5) — ALL AUTHORIZED

| File | Change | Classification |
|---|---|---|
| `frontend/server/persistence/saved-screens-store.ts` | **NEW** — thin adapter over TD-2 primitives | **AUTHORIZED** (§3 scope 1-3) |
| `frontend/server/persistence/saved-screens-store.test.ts` | **NEW** — 12 tests | **AUTHORIZED** (§6) |
| `frontend/server/p12-request-handler.ts` | +54 — persist after validation; additive `GET`; optional `ownerUserId` param | **AUTHORIZED** (§2) |
| `frontend/server/executive-transport.ts` | +21/−1 — `resolvePrincipalOwner()` + pass owner to handler | **AUTHORIZED** (§4 principal resolution) |
| `.gitignore` | +3 — `.iips-data/` | **AUTHORIZED** (§5) |

**UNEXPECTED changes: NONE.**

⚠ `executive-transport.ts` was modified **only** for the D74 §4 principal-resolution requirement.
**The L-3 replay hardcodes at L425-426 / L487-488 are untouched and verified still present.**
No L-3 work was performed.

---

## 3. SECURITY / TENANT ENFORCEMENT

- **Tenant and owner come exclusively from the authenticated principal.** `resolvePrincipalOwner`
  reads `principal.userId ?? principal.subject`; **nothing is read from the request body or query.**
- `PersistenceService` is a *library authority, not an HTTP/RBAC boundary* (TD-2 §5) — the caller
  supplies identity, and the service enforces tenant+owner scoping on **every** read, list and lookup.
- **Fail-closed:** `GET` without a resolved owner → **401**. `POST` without a resolved owner
  **does not persist and does not fabricate an owner** — behaviour is exactly the prior
  validate-only path.
- Cross-tenant and cross-owner reads return **nothing** (mapped to 404/empty), disclosing nothing
  about another tenant's data.
- **Namespaced dedup key** (`saved-screen\0<screenId>`) so saved screens cannot collide with, or
  read, another consumer's records in the shared journal.
- **⚠ This does NOT resolve C12 (R-5).** No security certification is claimed.

---

## 4. TESTS AND FLOORS — FRESHLY OBSERVED

| Suite | Required floor | **Observed** |
|---|---|---|
| **Frontend full** | ≥740 / 0 | **752 passed / 0 failed**, 32 skipped (56 files) |
| **P12 full** | ≥154 / 0 | **154 pass / 0 fail** |
| **P13 full** | ≥86 / 0 | **86 pass / 0 fail** |
| App `tsc --noEmit` | clean | **clean, exit 0** |
| Server `tsc --noEmit -p tsconfig.server.json` | clean | **clean, exit 0** |
| `saved-screens-store.test.ts` | — | **12 / 12** |
| `persistence-service.test.ts` | unchanged | **21 / 21** |
| `p12-transport.test.ts` | unchanged | **48 / 48** |

Frontend **740 → 752** (+12, all new). **No existing test modified, weakened or removed.**

### Acceptance criteria evidence

| Criterion | Evidence |
|---|---|
| Save persistence | `persists a saved definition and returns a durable record identity` |
| Retrieval | `retrieves a saved definition by record id`, `lists saved screens for the owner` |
| **Restart / journal reconstruction** | `a saved definition survives a fresh service instance (restart)` — a brand-new `PersistenceService` over the same dir rebuilds from the journal alone; `record identity is stable across a restart` |
| Tenant isolation | `cross-tenant retrieval is denied`; `the same screenId in two tenants yields two independent records` |
| Owner scoping | `cross-owner retrieval within the same tenant is denied` |
| Dedup / record identity | `re-saving the same screenId is idempotent and returns the existing record` |
| Cross-consumer isolation | `does not surface records written by another consumer of the same journal` |

---

## 5. `.gitignore` PROTECTION

`.iips-data/` added, satisfying TD-7a (env-configured, gitignored, server-owned). **Verified by
probe:** `git check-ignore -v .iips-data/probe.jsonl` → `.gitignore:38:.iips-data/`; **0 untracked
data entries.** Probe removed.

---

## 6. EXPLICIT NON-MODIFICATION CONFIRMATIONS

- **`p12/src/screenerContract.js` — NOT MODIFIED.** The certified C6 contract still performs all
  validation and builds the definition; persistence happens **after** it, in transport.
- **`p12/src` and `p13/src` — 0 changes. C6/C7 contracts and certification scope UNTOUCHED.**
- **`frontend/server/persistence/persistence-service.ts` — 0 changes.** No defect found; no scope
  expansion was required.
- **P05–P11 — 0 changes.** `iips-platform` (incl. `ReplayService.ts`) — **0 changes.**
- **Historical D-records (D5x/D6x/D7x) — 0 changes.**
- R-2 provider ingestion **not implemented**; R-4 UI binding **not implemented**; P11 dormant
  residue **not touched**; P12/P13 gates **not reopened**.

---

## 7. RESIDUAL STATUS

| Item | Status |
|---|---|
| **R-3 saved-screen persistence** | **CLOSED** — all D74 acceptance criteria pass |
| **L-3** | **OPEN** — transport hardcoding unremediated (verified untouched) |
| **L-2** | **OPEN** |
| **R-2** provider ingestion | **OPEN** — licensing/credentials external (OI-P04-04) |
| **R-4** UI binding | **OPEN** |
| **R-5** C12 | **BLOCKED** — M-5, security authority unknown; not resolved here |
| **R-6** | **OPEN** |
| **R-7** browser/runtime evidence | **OPEN** — Windows-only; Arena cannot perform it |
| **P11 dormant residue** | **OPEN-DORMANT** |
| **AD-17 / M-2** | **UNRESOLVED** (gate P15) |
| **P15** | **ACCEPTED — certification NONE** |
| **P16** | **CERTIFIED / CLOSED** |
| **Production authorization** | **NOT GRANTED** |
| Next free D-number | **D76** |
