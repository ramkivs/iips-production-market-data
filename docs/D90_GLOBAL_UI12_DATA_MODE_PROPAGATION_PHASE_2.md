# D90 — GLOBAL UI12 DATA-MODE PROPAGATION (PHASE 2: P12 ADDITIVE ROUTES)

**Act ID:** `D90 — global UI12 data-mode propagation — P12 additive routes (Phase 2)`
**Authority:** **D88 = A** — account-wide UI12 semantics, bounded **D54 §97 exception**, explicit
**Macro exemption**. Correct-by-addition: **D85, D86, D88, and D89 records are NOT edited.**
**Base:** `da43051` (D89) · **Browser/runtime qualification: NOT CLAIMED.**

---

## 1. WHAT CHANGED

UI12 "Default data mode" now propagates to the two additive P12 market-data routes:
- `/api/screener/execute` (Governed Screener — C6)
- `/api/search` (Governed Search — C7)

Wiring uses the shared D89 server seam (`frontend/server/data-mode/data-mode.ts`) through
`dispatchForPrincipal`, resolving the authenticated principal's persisted preference.

| Route | Surface | Pre-D90 Status | D90 Status |
|---|---|---|---|
| `/api/screener/execute` | Governed Screener | SNAPSHOT-only | **mode-aware (D90)** |
| `/api/search` | Governed Search | SNAPSHOT-only | **mode-aware (D90)** |
| `/api/screener/saved` | Saved Screens | definition persistence / list | **unchanged** |
| `/api/resolve` | Object Resolution | identity resolution (C7) | **unchanged** |
| `/api/executive`, `/api/decision-matrix`, `/api/cross-sector`, `/api/company/:id`, `/api/evidence/:id`, `/api/replay/:id`, `/api/portfolio` | Frozen v2.0 routes | mode-aware (D85/D89) | **unchanged** |
| `/api/macro` | Macro | EXEMPT (WP-MACRO-03) | **unchanged (EXEMPT)** |

---

## 2. D54 §97 COMPLIANCE & EQUIVALENCE GATE

The exception permits adding mode branches only while existing SNAPSHOT behaviour remains
byte-identical:

> For both `/api/screener/execute` and `/api/search`, `forMode(surface, 'SNAPSHOT', computeSnapshot)`
> returns the exact same object reference (`toBe` identity) and produces byte-identical JSON
> compared to the direct call.
>
> When no owner is resolved (e.g. unauthenticated or missing userId), `dispatchForPrincipal`
> defaults to `SNAPSHOT`, preserving pre-D90 behaviour without inventing an owner.

LIVE/PIT branches previously had no behaviour on these additive endpoints, so no existing
governed/certified computation is altered.

---

## 3. THE CONTRACT (identical to D89)

- **SNAPSHOT** → computation invoked **UNCHANGED**, returned verbatim. Also the governed
  default when no preference is saved and when no owner resolves.
- **LIVE** → governed `LIVE_UNAVAILABLE` with `dataAvailable: false`, citing **R-2**. Never falls
  back, never substitutes.
- **PIT** → governed `PIT_UNAVAILABLE` with `dataAvailable: false`. PIT capability in `p08` is
  **NOT wired** (`p08` imports in `frontend/server`: **0**).

Mode is resolved **server-side** via `readPreferences` from the authenticated principal only.
No client/query/body-supplied mode authority exists.

---

## 4. CONSUMER SAFETY & NARROWING

All React consumers of the two additive routes are guarded against degraded payloads using
the D86/D89 discriminated-union pattern (`isDegraded` / `dataAvailable: false`):

1. **`GovernedScreener.tsx`**:
   - `executeScreen` returns `Promise<P12Envelope<P12ScreenResult> | DegradedData>`.
   - `if (isDegraded(data))` guards before any access to `data.data` or row fields, rendering
     `<DataModeUnavailable data={data} title="Governed Screener" />`.
2. **`GovernedSearch.tsx`**:
   - `executeSearch` returns `Promise<P12Envelope<P12SearchResult> | DegradedData>`.
   - `if (isDegraded(data))` guards before any access to `data.data` or search hit fields, rendering
     `<DataModeUnavailable data={data} title="Governed Search" />`.
3. **`CommandPalette.tsx`**:
   - `executeGovernedSearch` checks `if (isDegraded(env))` in the `.then()` handler.
   - On degraded response, gracefully sets `governedHits = null` and falls back to disclosing
     `lineage = 'V2.0-CERTIFIED'` without throwing or dereferencing missing hits.

---

## 5. TESTS AND FLOORS

| Suite | Floor | **Observed** |
|---|---|---|
| **D90 / D89 data-mode tests** | ≥38 / 0 | **48 passed / 0 failed** (+10 tests) |
| **Frontend full** | ≥1033 passed / 0 failed | **1048 passed / 0 failed**, 32 skipped (+15 tests) |
| **P12** | ≥154 / 0 | **154 / 0** |
| **P13** | ≥86 / 0 | **86 / 0** |
| App `tsc` (`npm run typecheck`) | clean | **clean (0 errors)** |
| Server `tsc` (`npm run typecheck:server`) | clean | **clean (0 errors)** |

**Mutation proof:**
Introducing a silent SNAPSHOT fallback into `forMode` (`return computeSnapshot()`) causes
**21 tests to fail** across the data-mode test suite. Restoring the degraded branch restores
100% passing tests (48/48).

---

## 6. SCOPE AUDIT — 0 CHANGES EACH

- `p05`–`p14`: 0 changes.
- `iips-platform`: 0 changes.
- Prior docs (`D85`, `D86`, `D88`, `D89`): 0 changes (correct-by-addition preserved).
- Macro routes and UI (`frontend/server/macro`, `src/api/macro.ts`, `MacroContext.tsx`): 0 changes.
- Frozen v2.0 route families in `executive-transport.ts`: 0 changes.
- Replay / AD-17 / M-2 paths and hardcoded flags: intact.
- Server `p08` imports: **0**.
- No provider / R-2 ingestion implemented.
- No RBAC or auth changes.
- No production activation claimed.

---

## 7. STATUS & OPEN ITEMS

| Item | Status |
|---|---|
| **Phase 1 — 6 frozen route families** | **COMPLETE (D89)** |
| **Phase 2 — P12 additive routes** (`/api/screener/execute`, `/api/search`) | **COMPLETE (D90)** |
| **Phase 3 — Macro disclosure** | **OPEN** (exemption active; UI disclosure outstanding) |
| R-2 · R-4 · R-7 | **OPEN** · R-5/C12 **BLOCKED** · M-5 **OPEN** |
| AD-17 / M-2 | **UNRESOLVED** · P14 **INCOMPLETE** · P15 UI certification **NONE** |
| **Production authorization** | **NOT GRANTED** |


---

### Addendum D98 (2026-09-15) — R-2 Status Reconciliation
Per D97 and D98 Program Adjudications:
- **R-2 Engineering Status:** **CLOSED — IMPLEMENTED / TESTED / READY**.
- **Phase 2 Routes:** Screener and search transports operate seamlessly under canonical data contracts; production market data boundary remains fail-closed.
