# D82 — UI08 REPORTS RECOVERY: IMPLEMENTATION

**Act ID:** `D82 — UI08 Reports recovery implementation`
**Authority:** **D82-R1 decision A** (bounded UI08 recovery), under the **legacy-D82** recovery
adjudication and the **D84** obligation audit. Durability pattern per **D80-C1** / **D81-C1**;
immediately preceded by **D81-R1** / D81 (UI07).
**Type:** Recovery implementation of a previously specified, undelivered obligation.
Not acceptance, not certification, not production activation.
**Branch:** `arena/01a0814b-…` · **Base:** `9e05008…` (D81), tree clean.

> **Numbering.** Historical labels `legacy D82` and `D84` are cited as-is and **not renumbered**.

---

## 1. THE OBLIGATION

`docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` **INT-012**:

> **Existing capability:** **No Reports UI.** Platform type
> `PortfolioReport{reportId, reportType, portfolioId, payload}` exists · **Disposition:**
> **EXTEND** · **Required delta:** *reuse report data type; build templates + generation UI +
> **PIT reproducibility*** · **Validation:** historical/PIT reproducibility; lineage;
> source/timestamp · **Phase/gate:** **P08 + P13** (no P10 → **not R-2 blocked**)

**Re-verified before implementing:** `PortfolioReport` and `ReportingEngine` had **zero
references** in `frontend/server` or `frontend/src`. No report route, endpoint or component
existed.

### Correction by addition — "embedded in UI01" did not satisfy UI08

`P13_UI_SURFACE_COMPONENT_RECONCILIATION.md` recorded UI08 as *"Current Component: NONE (embedded
in UI01)… Implemented elsewhere"*, and `PHASE_13_GATE_ACCEPTANCE.md`:45 marked UI08 **✅
ACCEPTED**. Both were inaccurate against INT-012: no reports UI existed, and the platform report
type was unreachable from any surface.

**Historical records are NOT edited.** This record supersedes the characterization as to fact;
the accepted P13 gate record is **not revoked** and no gate is reopened.

---

## 2. WHAT WAS IMPLEMENTED

| Concern | Delivery |
|---|---|
| Surface | `frontend/src/features/reports/Reports.tsx` |
| Route | **`/reports`** (lazy, inside `AppShell`) |
| Navigation | Top-level **Reports**, `minRole: 'viewer'` |
| API client | `frontend/src/api/reports.ts` |
| Transport | `frontend/server/reports/reports-transport.ts`, dispatched from `executive-transport.ts` |
| Persistence | `frontend/server/reports/reports-service.ts` over the **existing** `PersistenceService` |
| **Report content** | **Existing platform `ReportingEngine.build()`** over certified CSIP output |
| **Certified contract** | **`p13/src/extendSurfaces.js::buildReportView` consumed UNMODIFIED** |

**Endpoints:** `GET /api/reports` · `POST /api/reports` · `GET|DELETE /api/reports/:id`.

**Templates are limited to the five existing `PortfolioReport` reportTypes** — Executive,
Investment Committee, Portfolio Summary, Allocation Recommendation, Sector Dashboard. **No report
type was invented**; an unknown type is rejected **400**.

Append-only event model (`report-generated` / `report-deleted`) folded deterministically by
`seq`, as in D81. **`persistence-service.ts` unchanged.**

---

## 3. PIT / REPRODUCIBILITY EVIDENCE — AND THE EXACT LIMITATION

### Delivered and proven

1. **Pin-and-store.** Every report persists its **complete payload** plus pinned `dataVersion`,
   `asOf` and `mode`, with a canonical-JSON **FNV-1a hash** recorded at generation.
2. **Byte-identical re-opening.** Re-reading a stored report reproduces the payload exactly;
   `storedIntegrityVerified` re-checks the hash **on every read**. Proven by test, including
   **after a restart** (journal reconstruction) and **over HTTP**. A tampered payload is detected.
3. **Same-vintage regeneration is byte-identical.** `ReportingEngine.build()` is a **pure
   function** — no clock, no randomness, `reportId` derived from reportType+portfolioId — so
   regenerating against the same pinned vintage yields an identical hash.
4. **Canonical JSON is key-order independent**, so byte-identity is a property of content, not of
   serialization accident.
5. **Reports are keyed by vintage** (`reportId@asOf`), so regenerating under a different vintage
   **cannot overwrite** an earlier point-in-time report.

### ⚠ NOT delivered, and explicitly NOT claimed

**Regeneration for an arbitrary past as-of is UNAVAILABLE.** Only one governed vintage exists —
the frozen v1.1 replay baseline. Historical governed vintages require **R-2** (externally
blocked). Producing a "past as-of" report would require **fabricating a historical vintage**,
which is prohibited and was **not done** (audited: no invented dates or synthetic vintages).

A different current vintage is reported as **`byteIdentical: null` — "not comparable"**, never as
a failure: it is a different point in time, not a reproducibility defect.

**`buildReportView.pitReproducible: true` is consumed unmodified and deliberately NOT amplified.**
It means *"this report pins its vintage"*, not *"any past date can be rebuilt"*. The distinction
is carried in `PIT_LIMITATION` on **every** API response and **rendered on the surface**.
`replayReproducibilityClaimed: false` is preserved — **AD-17/M-2 untouched**.

**Lineage / source / timestamp:** every stored report records `dataSource`, `classification`,
`contributingSnapshotIds` and `generatedAt`, with `generatedAt` (wall clock) **distinguished from
`asOf`** (data observation time) — asserted by test.

---

## 4. SECURITY EVIDENCE

- **Tenant and owner server-derived** from the authenticated principal via the existing
  `guardRead` / `guardExecute` path. **No new RBAC model, no new executor, `readSurfaceFor` not
  extended.**
- **Content cannot be supplied by the client.** A request sending
  `payload: { diversificationScore: 999, injected: true }` stores the **engine-produced 71** with
  `injected` absent — asserted by test.
- **Fail-closed:** 401 unauthenticated · 403 viewer generate/delete · 400 invalid template ·
  404 unknown report. A mismatched tenant claim is **401 `no-valid-tenant`**.
- **Isolation:** another tenant or owner sees nothing, cannot read by id (404), and cannot delete.

---

## 5. FILES CHANGED (10) — ALL AUTHORIZED

| File | Change |
|---|---|
| `frontend/server/reports/reports-service.ts` | **NEW** |
| `frontend/server/reports/reports-service.test.ts` | **NEW** — 23 tests |
| `frontend/server/reports/reports-transport.ts` | **NEW** |
| `frontend/server/reports/reports-transport.test.ts` | **NEW** — 20 tests |
| `frontend/src/api/reports.ts` | **NEW** |
| `frontend/src/features/reports/Reports.tsx` | **NEW** |
| `frontend/src/features/reports/Reports.test.tsx` | **NEW** — 10 tests |
| `frontend/server/executive-transport.ts` | **+33** — `/api/reports` dispatch (additive only) |
| `frontend/src/app/App.tsx` | **+4** — lazy import + route |
| `frontend/src/app/navigation.ts` | **+2** — Reports entry |
| `frontend/src/app/navigation.test.ts` | **+3/−2** — inventory guard updated |

**`navigation.test.ts`:** the exact top-level list assertion was **retained** (not relaxed) with
`'Reports'` added alongside `'Watchlists'`/`'Settings'`; the `/ai|advisory/i` guard from D80 is
preserved.

---

## 6. TESTS AND FLOORS — FRESHLY OBSERVED

| Suite | Floor | **Observed** |
|---|---|---|
| **Frontend full** | ≥853 / 0 | **906 passed / 0 failed**, 32 skipped (66 files) |
| **P12 full** | ≥154 / 0 | **154 pass / 0 fail** |
| **P13 full** | ≥86 / 0 | **86 pass / 0 fail** |
| App `tsc --noEmit` | clean | **clean, exit 0** |
| Server `tsc --noEmit -p tsconfig.server.json` | clean | **clean, exit 0** |
| `reports-service.test.ts` | — | **23 / 23** |
| `reports-transport.test.ts` | — | **20 / 20** |
| `Reports.test.tsx` | — | **10 / 10** |

Frontend **853 → 906** (+53). Every D82 §16 criterion is covered: generation · persistence ·
retrieval · deletion · **restart/journal reconstruction** · tenant isolation · owner scoping ·
cross-tenant denial · lineage · **PIT pinning** · **byte identity**.

---

## 7. M-5 / R-2 RESULT

- **M-5 / G3: not encountered.** The surface consumes the existing authenticated-principal
  boundary and introduces no identity/session semantics. **M-5 remains OPEN; R-5 / C12 remain
  BLOCKED.**
- **R-2: no dependency introduced.** UI08 is P08 + P13. The *only* R-2 contact point is the
  historical-as-of limitation, which is **disclosed rather than worked around**.

**No blocker encountered. No scope widened. No requirement silently weakened.**

---

## 8. SCOPE AUDIT — 0 CHANGES EACH

`p05`–`p14` · `iips-platform` (incl. `ReplayService.ts` and `ReportingEngine.ts` — **consumed, not
modified**) · `docs/` (no historical record edited) · **`persistence-service.ts`** · **`p12/src`
and `p13/src` certified contracts** · `p12-transport.ts` · `components/evidence` ·
`features/replay`.

**`executive-transport.ts` replay hardcodes intact** (both `reproduced: true` sites); the only
change is the additive dispatch branch. **No fabricated historical data** — audited for invented
dates, synthetic vintages and time series: **none found**. No other UI surface modified.
**No P14 qualification and no P15 UI certification claimed.**

---

## 9. STATUS

| Item | Status |
|---|---|
| **UI08 Reports** | **IMPLEMENTED** — route, surface, API, persistence, templates, PIT pinning, byte identity, tests |
| UI08 "embedded in UI01" claim | **CORRECTED BY ADDITION** (historical records unedited) |
| **Arbitrary historical as-of regeneration** | **UNAVAILABLE — recorded limitation, R-2 dependent** |
| UI07 (D81) · UI12 (D80) | IMPLEMENTED · **UI10 Collaboration** | **NOT IMPLEMENTED** |
| Partial UI02/03/04/05/06/09/13/14 | **OPEN** |
| P14 qualification · P15 UI certification | **NOT PERFORMED, NOT CLAIMED** |
| R-3 · L-2 · L-3 | **CLOSED** · R-2 · R-4 · R-7 **OPEN** · R-5/C12 **BLOCKED** · M-5 **OPEN** |
| P11 dormant residue | **OPEN-DORMANT** · **AD-17 / M-2 UNRESOLVED** |
| P15 | **ACCEPTED — certification NONE** · P16 **CERTIFIED / CLOSED** |
| **Production authorization** | **NOT GRANTED** |

**Not committed and not pushed** — awaiting explicit commit/push authority.


---

### Addendum D98 (2026-09-15) — R-2 Status & Historical Data Reclassification
Per D97 and D98 Program Adjudications:
- **R-2 Engineering Status:** **CLOSED — IMPLEMENTED / TESTED / READY**.
- **Historical As-Of Regeneration:** Reclassified as a **downstream data-activation dependency**, not a core engineering blocker. The 10-year historical backfill capability is fully implemented and ready; arbitrary historical point-in-time calculation activates upon population of official historical archives.
