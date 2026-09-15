# D80 — UI12 SETTINGS RECOVERY: IMPLEMENTATION

**Act ID:** `D80 — UI12 Settings recovery implementation`
**Authority:** **D80-R1 — decision A**, bounded UI12 Settings recovery (itself authorized by the
D82 recovery adjudication, option A).
**Type:** Recovery implementation of a previously specified, undelivered obligation.
Not acceptance, not certification, not production activation.
**Branch:** `arena/01a0814b-…` · **Base:** `5400816…` (D79), tree clean.

> **D-numbering note.** The last committed record is **D79**; this record takes the next free
> number, **D80**. The authorizing acts were labelled `D80-R1`, `D82` and the audit `D84` — those
> labels are preserved verbatim as cited and are **not** renumbered. The numbering ambiguity was
> flagged before implementation and remains an open governance housekeeping item.

---

## 1. THE OBLIGATION AND WHY IT WAS UNMET

**Authoritative requirement** — `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` **INT-014b** and
`docs/d4/D4_03_UI_BASELINE.md` *"UI12 Settings — ADAPT"*:

> *Data preferences + user configuration.* Validation: **authorization; tenant scoping**.
> Existing capability: *"Partial — `AdminIdentity.tsx`, `core/session`… **No user settings surface**"*.

`docs/P13_UI_SURFACE_COMPONENT_RECONCILIATION.md`:167-174 recorded UI12 as
*"Current Component: NONE (embedded in UI11)… Exposed: YES (within UI11, **admin role only**)…
Implemented elsewhere"*, and `PHASE_13_GATE_ACCEPTANCE.md`:49 marked UI12 **✅ ACCEPTED**.

**That status was inaccurate against INT-014b**, for a reason visible in the record itself:
UI11 Administration is **admin-only**, but UI12 is the **user's own** configuration. Non-admin
users therefore had **no settings surface at all**, and **no user-preference persistence existed**
anywhere. `docs/WINDOWS_UI_VERIFICATION.md`:74,102 independently records UI12 as **"NOT PRESENT —
no `.tsx` file with 'Setting' in its name"**.

**Correction by addition.** The historical records above are **NOT edited**. This record supersedes
the *"implemented elsewhere"* characterization as to fact; the accepted P13 gate record is **not
revoked** and no gate is reopened.

---

## 2. WHAT WAS IMPLEMENTED

| Concern | Delivery |
|---|---|
| Surface | `frontend/src/features/settings/Settings.tsx` — first-class React surface |
| Route | **`/settings`** in `App.tsx` (lazy, inside `AppShell`) |
| Navigation | Top-level **Settings**, `minRole: 'viewer'` (contrast: Administration is admin-only) |
| API client | `frontend/src/api/settings.ts` — `GET` / `PUT /api/settings` |
| Transport | `handleSettingsRequest` in `admin-transport.ts`, dispatched from `executive-transport.ts` |
| Persistence | `frontend/server/settings/settings-service.ts` over the **existing** `PersistenceService` |

**Governed preference set** (INT-014b "data preferences + user configuration"):
`defaultDataMode` (LIVE/SNAPSHOT/PIT) · `showDegradedDetail` · `theme` · `density`.

### Append-only revision model — a design consequence, recorded

`PersistenceService` is an **append-only journal** whose only mutation primitive is
`updateReadState`; `append()` de-duplicates, so a preference update **cannot overwrite in place**.
Rather than modify the accepted persistence authority (explicitly out of scope), each save is a
**new revision** with a unique dedup key and the **newest revision is effective**. This preserves
the journal's audit semantics — prior preference states remain inspectable — and required
**zero changes to `persistence-service.ts`**.

---

## 3. SECURITY

- **Tenant and owner are server-derived** from the authenticated principal (`guardRead` /
  `guardExecute` → `p.tenantId`, `p.userId`), exactly as the promoted P-2 notes surface.
  **No new RBAC model, no new executor, `readSurfaceFor` not extended.**
- **The client cannot supply identity.** The request body carries only `preferences`;
  `validatePreferences` ignores unknown keys, so a smuggled `tenantId`/`ownerUserId` can never
  reach storage — asserted by test, at both service and HTTP layers.
- **Fail-closed:** unauthenticated → **401**; viewer save → **403**; missing body → **400**;
  invalid value → **422, never coerced** and nothing persisted.
- **Tenant isolation / owner scoping** enforced by `PersistenceService` on every read; a foreign
  principal receives governed defaults, never another principal's data.
- ⚠ Discovered and asserted: the platform `ADMIN_DIRECTORY` binds each user to exactly one
  authoritative tenant and returns **401 `no-valid-tenant`** if the token's tenant claim
  disagrees — so cross-tenant access is **unreachable over HTTP by construction**. Two of my
  initial tests encoded a weaker assumption; **the tests were corrected, not the product**.

---

## 4. M-5 / G3 DEPENDENCY RESULT — NOT ENCOUNTERED AS A BLOCKER

INT-014b records an authority dependency on the unresolved G3 authentication/session gap (M-5).
**No M-5/G3 change was required.** This surface **consumes** the existing authenticated principal
boundary unchanged, exactly as notes does, and deliberately contains **no preference governing
authentication, session, tenancy or entitlement**.

**M-5 remains OPEN. R-5 / C12 remain BLOCKED.** Neither is remediated or claimed.

> The `D4_01` annotation *"P03 BLOCKED"* is stale: `PROGRAM_STATE.md`:241 records **P03 ACCEPTED**.
> Flagged, not resolved; no reliance was placed on it either way.

---

## 5. FILES CHANGED (8) — ALL AUTHORIZED

| File | Change |
|---|---|
| `frontend/server/settings/settings-service.ts` | **NEW** — persistence + validation |
| `frontend/server/settings/settings-service.test.ts` | **NEW** — 15 tests |
| `frontend/server/settings/settings-transport.test.ts` | **NEW** — 16 tests |
| `frontend/src/api/settings.ts` | **NEW** — typed client |
| `frontend/src/features/settings/Settings.tsx` | **NEW** — UI12 surface |
| `frontend/src/features/settings/Settings.test.tsx` | **NEW** — 6 tests |
| `frontend/server/admin-transport.ts` | **+~70** — `handleSettingsRequest` (additive) |
| `frontend/server/executive-transport.ts` | **+15** — `/api/settings` dispatch (additive) |
| `frontend/src/app/App.tsx` | **+3** — lazy import + route |
| `frontend/src/app/navigation.ts` | **+3** — Settings entry |
| `frontend/src/app/navigation.test.ts` | **+5/−3** — inventory guard updated (see below) |

**One pre-existing test was updated:** `navigation.test.ts` pinned the exact top-level nav list.
Its subject is *"no standalone **AI** route or navigation entry"*. The exact-list assertion was
**retained** (not relaxed to a subset, which would have weakened it) with `'Settings'` added, and
an **additional** assertion that no nav label matches `/ai|advisory/i` was **added**. The guard is
strictly stronger than before; all AI-specific assertions are untouched.

---

## 6. TESTS AND FLOORS — FRESHLY OBSERVED

| Suite | Floor | **Observed** |
|---|---|---|
| **Frontend full** | ≥761 / 0 | **798 passed / 0 failed**, 32 skipped (60 files) |
| **P12 full** | ≥154 / 0 | **154 pass / 0 fail** |
| **P13 full** | ≥86 / 0 | **86 pass / 0 fail** |
| App `tsc --noEmit` | clean | **clean, exit 0** |
| Server `tsc --noEmit -p tsconfig.server.json` | clean | **clean, exit 0** |
| `settings-service.test.ts` | — | **15 / 15** |
| `settings-transport.test.ts` | — | **16 / 16** |
| `Settings.test.tsx` | — | **6 / 6** |

Frontend **761 → 798** (+37). Required coverage: **persistence · retrieval · restart/journal
reconstruction · tenant isolation · owner scoping · cross-tenant denial** — all present at the
service layer and again at the HTTP layer.

> `frontend/node_modules` was destroyed by the fourth sandbox re-clone; `npm ci` restored it. No
> dependency or lockfile change.

---

## 7. OUT-OF-SCOPE CONFIRMATIONS — 0 CHANGES EACH

`p05`–`p14` · `iips-platform` (incl. `ReplayService.ts`) · `docs/` (no historical record edited) ·
`p12-transport.ts` · `components/evidence` · `features/replay` · `persistence-service.ts`.

**`executive-transport.ts` replay hardcodes intact** — `reproduced: true` still present at both
sites; the only change is the additive `/api/settings` dispatch branch. **AD-17 / M-2 untouched.**
No other UI surface modified. No R-2 dependency introduced. No provider ingestion.
**No P14 visual/responsive qualification and no P15 UI certification is claimed.**

---

## 8. STATUS

| Item | Status |
|---|---|
| **UI12 Settings** | **IMPLEMENTED** — route, surface, API, persistence, tests |
| UI12 "implemented elsewhere" claim | **CORRECTED BY ADDITION** (historical records unedited) |
| UI07 · UI08 · UI10 | **NOT IMPLEMENTED** — remain in the recovery backlog |
| Partial UI02/03/04/05/06/09/13/14 | **OPEN** |
| P14 qualification · P15 UI certification | **NOT PERFORMED, NOT CLAIMED** |
| **M-5 / G3** | **OPEN** — not encountered, not remediated |
| **R-5 / C12** | **BLOCKED** |
| R-2 · R-4 · R-7 | **OPEN** (R-2 externally blocked) · R-3, L-2, L-3 **CLOSED** |
| P11 dormant residue | **OPEN-DORMANT** · **AD-17 / M-2 UNRESOLVED** |
| P15 | **ACCEPTED — certification NONE** · P16 **CERTIFIED / CLOSED** |
| **Production authorization** | **NOT GRANTED** |

**Not committed and not pushed** — awaiting explicit commit/push authority.


---

### Addendum D98 (2026-09-15) — R-2 Status & Dependency Reconciliation
Per D97 and D98 Program Adjudications:
- **R-2 Engineering Status:** **CLOSED — IMPLEMENTED / TESTED / READY** (`frontend/server/market-data/`).
- **UI Acceptance:** **PASS** (7/7 tests passed in `frontend/src/test/r2-ui-acceptance.test.tsx`).
- **Production Market Data:** EXTERNALLY GATED. The `LIVE_UNAVAILABLE` fail-closed state verified here is fully consistent with the accepted R-2 architecture. Production provider access is not an engineering defect or open implementation task.
