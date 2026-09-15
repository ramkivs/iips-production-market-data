# D83 — UI10 COLLABORATION RECOVERY: IMPLEMENTATION

**Act ID:** `D83 — UI10 Collaboration recovery implementation`
**Authority:** **D83-R1 decision A** (bounded UI10 recovery), under the **legacy-D82** recovery
adjudication and the **D84** obligation audit. Durability pattern per **D80-C1 / D81-C1 / D82-C1**.
**Type:** Recovery implementation of a previously specified, undelivered obligation.
Not acceptance, not certification, not production activation.
**Branch:** `arena/01a0814b-…` · **Base:** `01fa1ea…` (D82), tree clean.

> **Numbering.** Historical `D80`, `D81`, `legacy D82` and `D84` labels are cited as-is and **not
> renumbered**.

---

## 1. THE OBLIGATION

`docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` **INT-013**:

> **Existing capability:** **NONE.** No comments/mentions/sharing/assignments/activity ·
> **Evidence status:** **NOT FOUND** (positive absence) · **Disposition:** **NEW** ·
> **Required delta:** *full capability; must reference **governed IIPS objects**, never raw
> provider records* · **Validation:** object/reference integrity · **Phase/gate:** **P13**

**Re-verified before implementing:** `comment`, `mention`, `thread`, `activity`, `collaborat` —
**0 files each** across `frontend/src` and `frontend/server`. UI10 was the **last fully
unimplemented surface**; P13 had accepted it against `buildCollaborationView`, a view-model with
**zero consumers**, and the reconciliation later recorded it **ABSENT**.

**Correction by addition.** Historical records are **NOT edited**; the accepted P13 gate record is
**not revoked** and no gate is reopened.

---

## 2. WHAT WAS IMPLEMENTED

| Concern | Delivery |
|---|---|
| Surface | `frontend/src/features/collaboration/Collaboration.tsx` |
| Route | **`/collaboration`** (lazy, inside `AppShell`) |
| Navigation | Top-level **Collaboration**, `minRole: 'viewer'` |
| API client | `frontend/src/api/collaboration.ts` |
| Transport | `frontend/server/collaboration/collaboration-transport.ts` |
| Resolvers | `frontend/server/collaboration/collaboration-resolvers.ts` |
| Persistence | `frontend/server/collaboration/collaboration-service.ts` over the **existing** `PersistenceService` |
| **Certified contract** | **`p13/src/newSurfaces.js::buildCollaborationView` consumed UNMODIFIED** |

**Endpoints:** `GET|POST /api/collaboration` · `GET|DELETE /api/collaboration/:id` ·
`POST /api/collaboration/:id/comments` · `DELETE …/comments/:commentId` ·
`POST|DELETE /api/collaboration/:id/assignment`.

**Capabilities:** governed-object threads · comments · **tenant-scoped mentions** ·
**assignments** · **activity log** — all folded from an append-only event log
(`thread-created`, `comment-added`, `comment-deleted`, `assigned`, `unassigned`,
`thread-deleted`) in deterministic `seq` order. **`persistence-service.ts` unchanged.**

---

## 3. NS-5 EVIDENCE

**Every thread and every comment pins `dataVersion` + `asOf` + `mode` at authoring time.** The pin
is persisted (so it survives restarts) *and* re-stamped on read by the accepted
`buildCollaborationView`, which emits `_pinnedVintage` per comment and rejects fabricated
provenance.

**Vintage honesty (D83 §15-16):**

- The server assigns the pin from the **current** governed vintage. **A client cannot choose a
  vintage and cannot author against a historical one.**
- When the current vintage later differs, `vintageStatus` **discloses the mismatch** — the thread
  keeps its original pin, is **never silently re-pinned**, and the disclosure states the earlier
  vintage is **NOT retrievable**.
- **No historical vintage is fabricated or claimed retrievable.** Asserted at service, transport
  and component level.

---

## 4. REFERENCE-INTEGRITY EVIDENCE

- **Closed governed object set:** `evidence` · `company` · `watchlist` · `report`. **No provider
  kind exists**, so a raw provider record is structurally unreferenceable. `provider-quote` → 400.
- **Server-side resolution:** `company`/`evidence` resolve against the **certified governed
  universe**; `watchlist`/`report` resolve against the **owner-scoped journals** created by
  D81/D82 — so a principal can cite only their **own** artefacts. Proven: `analyst-a` resolves
  `wl-1`; `analyst-b` does **not**.
- **Fail-closed:** an unresolvable or cross-tenant reference → **404**, and **nothing is stored**
  (asserted: the thread still has 0 comments after a rejected citation).
- **Mentions** resolve against the tenant roster; an unknown handle (`@ghost`) → **404**, **never
  stored as free text**. Directory read is **fail-closed**: no sync → no members → all mentions
  rejected. Disabled users are excluded and tenants never cross.

---

## 5. FILES CHANGED (11) — ALL AUTHORIZED

| File | Change |
|---|---|
| `frontend/server/collaboration/collaboration-service.ts` | **NEW** |
| `frontend/server/collaboration/collaboration-service.test.ts` | **NEW** — 27 tests |
| `frontend/server/collaboration/collaboration-transport.ts` | **NEW** |
| `frontend/server/collaboration/collaboration-transport.test.ts` | **NEW** — 22 tests |
| `frontend/server/collaboration/collaboration-resolvers.ts` | **NEW** |
| `frontend/src/api/collaboration.ts` | **NEW** |
| `frontend/src/features/collaboration/Collaboration.tsx` | **NEW** |
| `frontend/src/features/collaboration/Collaboration.test.tsx` | **NEW** — 10 tests |
| `frontend/server/executive-transport.ts` | **+~30** — `/api/collaboration` dispatch (additive only) |
| `frontend/src/app/App.tsx` | **+4** — lazy import + route |
| `frontend/src/app/navigation.ts` | **+2** — Collaboration entry |
| `frontend/src/app/navigation.test.ts` | **+2/−2** — inventory guard updated |

**`navigation.test.ts`:** the exact top-level list assertion is **retained** (not relaxed) with
`'Collaboration'` added; the `/ai|advisory/i` guard from D80 is preserved.

---

## 6. TESTS AND FLOORS — FRESHLY OBSERVED

| Suite | Floor | **Observed** |
|---|---|---|
| **Frontend full** | ≥906 / 0 | **965 passed / 0 failed**, 32 skipped (69 files) |
| **P12 full** | ≥154 / 0 | **154 pass / 0 fail** |
| **P13 full** | ≥86 / 0 | **86 pass / 0 fail** |
| App `tsc --noEmit` | clean | **clean, exit 0** |
| Server `tsc --noEmit -p tsconfig.server.json` | clean | **clean, exit 0** |
| `collaboration-service.test.ts` | — | **27 / 27** |
| `collaboration-transport.test.ts` | — | **22 / 22** |
| `Collaboration.test.tsx` | — | **10 / 10** |

Frontend **906 → 965** (+59). Every D83 §18 criterion is covered: persistence · retrieval ·
**restart/journal reconstruction** · tenant isolation · owner scoping · cross-tenant denial ·
**governed-reference integrity** · **mention resolution** · assignment · activity ·
**NS-5 vintage pinning** · **vintage mismatch disclosure**.

---

## 7. M-5 / R-2 RESULT

- **M-5 / G3: not encountered — and deliberately not approached.** Per D83 §17, sharing is
  **BY REFERENCE inside a thread only**. **No object-level ACL, no cross-user permission model,
  no new identity/session semantics** were introduced. Threads are owner-scoped like every other
  recovered surface, using the existing authenticated-principal boundary.
  **M-5 remains OPEN; R-5 / C12 remain BLOCKED.** `roster-directory.ts` is **unmodified** — its
  snapshot is read read-only through exported constants.
- **R-2: no dependency introduced.** UI10 is P13-only. Its sole R-2 contact point is the
  statement that a superseded vintage is not retrievable — **disclosed, not worked around**.

**No stop condition triggered. No scope widened.**

---

## 8. SCOPE AUDIT — 0 CHANGES EACH

`p05`–`p14` · `iips-platform` (incl. `ReplayService.ts`) · `docs/` (no historical record edited) ·
**`persistence-service.ts`** · **`p12/src` and `p13/src` certified contracts** ·
**`frontend/server/directory`** · `p12-transport.ts` · `components/evidence` · `features/replay`.

**`executive-transport.ts` replay hardcodes intact** (both `reproduced: true` sites); the only
change is the additive dispatch branch. **AD-17 / M-2 untouched.** No other UI surface modified.
**No P14 qualification and no P15 UI certification claimed.**

---

## 9. STATUS

| Item | Status |
|---|---|
| **UI10 Collaboration** | **IMPLEMENTED** — route, surface, API, persistence, NS-5 pinning, reference integrity, mentions, assignments, activity, tests |
| UI10 "ABSENT / accepted view-model" status | **CORRECTED BY ADDITION** (historical records unedited) |
| **All four previously unimplemented surfaces** | **UI07 (D81) · UI08 (D82) · UI10 (D83) · UI12 (D80) — COMPLETE** |
| Partial UI02/03/04/05/06/09/13/14 | **OPEN** |
| P14 qualification · P15 UI certification | **NOT PERFORMED, NOT CLAIMED** |
| R-3 · L-2 · L-3 | **CLOSED** · R-2 · R-4 · R-7 **OPEN** · R-5/C12 **BLOCKED** · M-5 **OPEN** |
| P11 dormant residue | **OPEN-DORMANT** · **AD-17 / M-2 UNRESOLVED** |
| P15 | **ACCEPTED — certification NONE** · P16 **CERTIFIED / CLOSED** |
| **Production authorization** | **NOT GRANTED** |

**Not committed and not pushed** — awaiting explicit commit/push authority.
