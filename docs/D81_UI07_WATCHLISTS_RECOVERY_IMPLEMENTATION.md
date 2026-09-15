# D81 — UI07 WATCHLISTS RECOVERY: IMPLEMENTATION

**Act ID:** `D81 — UI07 Watchlists recovery implementation`
**Authority:** **D81-R1 decision A** (bounded UI07 recovery), under the **D82** recovery
adjudication (option A), informed by the **D84** obligation audit. Durability pattern per
**D80-C1**. Historical labels `D82` / `D84` are cited as-is and **not renumbered**.
**Type:** Recovery implementation of a previously specified, undelivered obligation.
Not acceptance, not certification, not production activation.
**Branch:** `arena/01a0814b-…` · **Base:** `ecfa59f…` (D80), tree clean.

---

## 1. THE OBLIGATION

`docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` **INT-011a** and `docs/d4/D4_03_UI_BASELINE.md`:

> **Existing capability:** **NONE.** `grep -i watchlist` → **0 hits** · **Evidence status:**
> **NOT FOUND** (positive absence) · **Disposition:** **NEW** · **Required delta:** *persistent
> lists, triggers, score-change detection* · **Validation:** persistence; trigger correctness;
> freshness · **Phase/gate:** **P13**

**UI07 is P13-only.** `D4_01` draws the contrast itself: UI09 Alerts is *"**P10** + P13 —
**distinct from UI07** — Alerts carries a P10 data dependency"*. UI07 therefore needs
**persistence, not providers**, and is **not R-2-blocked**.

### Correction by addition — NotesDrawer was never UI07

`P13_UI_SURFACE_COMPONENT_RECONCILIATION.md` mapped UI07 to `NotesDrawer.tsx` (*"Implemented as
embedded capability"*) and `PHASE_13_GATE_ACCEPTANCE.md`:44 marked UI07 **✅ ACCEPTED** against
`newSurfaces.js`. Both were inaccurate as to INT-011a: notes are **immutable free-text entries**
with no lists, no membership, no triggers and no baseline. Re-verified at this HEAD —
`grep -i watchlist` over source still returned **0 hits** before this act.

**Historical records are NOT edited.** This record supersedes the characterization as to fact;
the accepted P13 gate record is **not revoked** and no gate is reopened.

---

## 2. WHAT WAS IMPLEMENTED

| Concern | Delivery |
|---|---|
| Surface | `frontend/src/features/watchlists/Watchlists.tsx` |
| Route | **`/watchlists`** (lazy, inside `AppShell`) |
| Navigation | Top-level **Watchlists**, `minRole: 'viewer'` |
| API client | `frontend/src/api/watchlists.ts` |
| Transport | `frontend/server/watchlists/watchlists-transport.ts`, dispatched from `executive-transport.ts` |
| Persistence | `frontend/server/watchlists/watchlists-service.ts` over the **existing** `PersistenceService` |
| **Certified contract** | **`p13/src/newSurfaces.js::buildWatchlistView` consumed UNMODIFIED** |

**Endpoints:** `GET /api/watchlists` · `POST /api/watchlists` · `GET|DELETE /api/watchlists/:id` ·
`POST /api/watchlists/:id/items` · `DELETE /api/watchlists/:id/items/:securityId`.

### Append-only event model

`PersistenceService` de-duplicates on `append` and its only mutation primitive is
`updateReadState`, so lists cannot be mutated in place. Each operation is an **event**
(`list-created`, `item-added`, `item-removed`, `list-deleted`) and current state is **folded**
from the log in deterministic `seq` order. Full list history stays inspectable and
**`persistence-service.ts` required zero changes**.

### Certified contract reuse

`buildWatchlistView` is imported with the **same `@ts-expect-error` convention** already used for
the certified P12 JS modules in `p12-transport.ts`. It attaches `_quality`, `_degradation` and
`_provenanceView` per item and enforces `assertNoFabricatedProvenance` — satisfying INT-011a's
**freshness** validation through the accepted contract rather than a re-implementation.

---

## 3. SCORE-CHANGE SEMANTICS — BASELINE vs CURRENT (D81 §10-11)

**Implemented exactly as authorized, and no further.** The governed value observed when an item
is added is **persisted as its baseline**; the surface reports the delta against the **current**
governed value.

- **No history fabricated. No time series synthesized. No live monitoring claimed.**
- Where the governed universe derives from the **frozen v1.1 replay baseline**, current ==
  baseline and every delta is legitimately **0 / unchanged** — this is **disclosed on the surface
  and in the payload**, not hidden.
- A missing value yields `delta: null` and renders **"unavailable"** — **never coerced to 0**.
- Re-adding a security **re-baselines** it (a deliberate, logged act).
- When R-2 lands this becomes genuinely temporal **with no redesign**.

**Disclosure string carried on every response and rendered on the surface:**
> *"Deltas compare each item PERSISTED BASELINE against the CURRENT governed value. Values derive
> from the frozen v1.1 replay baseline — this is NOT a live feed and NOT a time series."*

**Triggers:** closed operator set `gt|gte|lt|lte|eq|changed`; unknown operators **rejected (400)**,
never coerced; deterministic (identical inputs → identical results, asserted); and a trigger
**NEVER fires on unavailable data** (`fired: null`), honouring the NS-4 discipline.

---

## 4. SECURITY

- **Tenant and owner are server-derived** from the authenticated principal via the existing
  `guardRead` / `guardExecute` path. **No new RBAC model, no new executor, `readSurfaceFor` not
  extended.**
- **Governed rows are resolved server-side.** The client sends only a `canonicalSecurityId`;
  submitted values are **ignored** — asserted by test (`composite: 999, verdict: 'FABRICATED'`
  stored as the governed `72` / `'BUY'`). An unknown id **fails closed with 404**; no row is
  fabricated.
- **Fail-closed:** 401 unauthenticated · 403 viewer mutation · 400 invalid input · 404 unknown
  list/item/security · 409 duplicate list.
- **Isolation:** another tenant or owner sees nothing and cannot delete another principal's list
  (404, no disclosure). The platform directory additionally 401s `no-valid-tenant` on a mismatched
  tenant claim — asserted.

---

## 5. FILES CHANGED (9) — ALL AUTHORIZED

| File | Change |
|---|---|
| `frontend/server/watchlists/watchlists-service.ts` | **NEW** |
| `frontend/server/watchlists/watchlists-service.test.ts` | **NEW** — 25 tests |
| `frontend/server/watchlists/watchlists-transport.ts` | **NEW** |
| `frontend/server/watchlists/watchlists-transport.test.ts` | **NEW** — 21 tests |
| `frontend/src/api/watchlists.ts` | **NEW** |
| `frontend/src/features/watchlists/Watchlists.tsx` | **NEW** |
| `frontend/src/features/watchlists/Watchlists.test.tsx` | **NEW** — 9 tests |
| `frontend/server/executive-transport.ts` | **+16** — `/api/watchlists` dispatch (additive only) |
| `frontend/src/app/App.tsx` | **+4** — lazy import + route |
| `frontend/src/app/navigation.ts` | **+2** — Watchlists entry |
| `frontend/src/app/navigation.test.ts` | **+4/−4** — inventory guard updated |

**`navigation.test.ts`:** the exact top-level list assertion was **retained** (not relaxed to a
subset) with `'Watchlists'` added alongside `'Settings'`; the added `/ai|advisory/i` assertion from
D80 is preserved. The guard remains strictly stronger than its original form.

---

## 6. TESTS AND FLOORS — FRESHLY OBSERVED

| Suite | Floor | **Observed** |
|---|---|---|
| **Frontend full** | ≥798 / 0 | **853 passed / 0 failed**, 32 skipped (63 files) |
| **P12 full** | ≥154 / 0 | **154 pass / 0 fail** |
| **P13 full** | ≥86 / 0 | **86 pass / 0 fail** |
| App `tsc --noEmit` | clean | **clean, exit 0** |
| Server `tsc --noEmit -p tsconfig.server.json` | clean | **clean, exit 0** |
| `watchlists-service.test.ts` | — | **25 / 25** |
| `watchlists-transport.test.ts` | — | **21 / 21** |
| `Watchlists.test.tsx` | — | **9 / 9** |

Frontend **798 → 853** (+55). Every D81 §12 criterion is covered: create/list/delete · membership
· persistence · **restart/journal reconstruction** (service *and* HTTP) · tenant isolation · owner
scoping · cross-tenant denial · trigger evaluation · freshness · provenance · baseline/current
delta.

---

## 7. SCOPE AUDIT — 0 CHANGES EACH

`p05`–`p14` · `iips-platform` (incl. `ReplayService.ts`) · `docs/` (no historical record edited) ·
**`persistence-service.ts`** · **`p12/src` and `p13/src` certified contracts** (consumed, never
modified) · `p12-transport.ts` · `components/evidence` · `features/replay`.

**`executive-transport.ts` replay hardcodes intact** — both `reproduced: true` sites present; the
only change is the additive dispatch branch. **AD-17 / M-2 untouched.** No other UI surface
modified. No provider ingestion, no synthetic time series, no live market data.
**No P14 qualification and no P15 UI certification claimed.**

---

## 8. M-5 / R-2 RESULT

- **M-5 / G3: not encountered.** The surface consumes the existing authenticated-principal
  boundary and introduces no identity/session semantics. **M-5 remains OPEN; R-5 / C12 remain
  BLOCKED.**
- **R-2: no dependency introduced.** UI07 is P13-only; governed rows come from the existing P12
  universe. **R-2 remains OPEN and externally blocked** (no procurement authority designated,
  D81-B).

**No blocker encountered. No scope widened.**

---

## 9. STATUS

| Item | Status |
|---|---|
| **UI07 Watchlists** | **IMPLEMENTED** — route, surface, API, persistence, triggers, baseline deltas, tests |
| UI07 "NotesDrawer / embedded capability" claim | **CORRECTED BY ADDITION** (historical records unedited) |
| **UI12** | IMPLEMENTED (D80) · **UI08 · UI10** | **NOT IMPLEMENTED** — remain in the recovery backlog |
| Partial UI02/03/04/05/06/09/13/14 | **OPEN** |
| P14 qualification · P15 UI certification | **NOT PERFORMED, NOT CLAIMED** |
| R-3 · L-2 · L-3 | **CLOSED** · R-2 · R-4 · R-7 **OPEN** · R-5/C12 **BLOCKED** · M-5 **OPEN** |
| P11 dormant residue | **OPEN-DORMANT** · **AD-17 / M-2 UNRESOLVED** |
| P15 | **ACCEPTED — certification NONE** · P16 **CERTIFIED / CLOSED** |
| **Production authorization** | **NOT GRANTED** |

**Not committed and not pushed** — awaiting explicit commit/push authority.
