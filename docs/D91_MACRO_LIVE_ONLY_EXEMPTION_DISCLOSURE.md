# D91 — MACRO LIVE-ONLY EXEMPTION DISCLOSURE

**Act ID:** `D91 — macro LIVE-only exemption disclosure`
**Authority:** **D88 = A** (explicit Macro exemption and visible disclosure requirement).  
**Correct-by-addition:** **D85, D86, D88, D89, and D90 records are NOT edited.**
**Base:** `57ea3bb` (D90) · **Browser/runtime qualification: NOT CLAIMED.**

---

## 1. WHAT CHANGED

Per the D88 Macro exemption and WP-MACRO-03 source governance rules, Macro data (`/api/macro`) is
governed **LIVE-only** and is deliberately **EXEMPT** from the account-wide UI12 "Default data mode"
preference.

In D89 and D90, the server route `/api/macro` was verified as exempt from data-mode dispatch
(retaining `freshness: 'LIVE'` and disallowing fallback to SNAPSHOT baseline data). D91 delivers
the outstanding UI disclosure requirement on `MacroContext.tsx` so that users selecting SNAPSHOT
or PIT in Settings are explicitly informed that Macro remains LIVE-only and does not switch modes.

| Component | UI / Surface Location | Behaviour |
|---|---|---|
| `MacroContext.tsx` | Research → Macro (`/research/macro`) | Renders explicit `<div data-testid="macro-data-mode-exemption-disclosure">` stating Macro is governed LIVE-only and exempt from UI12 Default data mode preferences. |

---

## 2. GOVERNANCE & SERVER CONTRACT PRESERVED EXACTLY

- `/api/macro` remains strictly LIVE-only.
- **WP-MACRO-03:** LIVE, never SNAPSHOT.
- `retrievedAt` remains adapter FETCH time.
- No UI12 mode dispatch was added to Macro (`handleMacroReadRequest` unchanged).
- No provider changes; no R-2 implementation.
- No PIT capability wired (`p08` imports in server: **0**).
- No frozen v2.0 route changes.
- No `iips-platform` changes.
- No replay / AD-17 / M-2 changes.

---

## 3. TESTS AND FLOORS

| Suite | Floor Requirement | **Observed** |
|---|---|---|
| **Macro component tests** (`MacroContext.test.tsx`) | — | **20 passed / 0 failed** (+2 tests) |
| **Data-mode tests** (`data-mode.test.ts`) | ≥48 / 0 | **50 passed / 0 failed** (+2 tests) |
| **Macro server transport tests** (`server/macro/`) | — | **34 passed / 0 failed** |
| **Frontend full** | ≥1048 passed / 0 failed | **1052 passed / 0 failed**, 32 skipped (+4 tests) |
| **P12** | ≥154 / 0 | **154 passed / 0 failed** across 41 suites |
| **P13** | ≥86 / 0 | **86 passed / 0 failed** across 45 suites |
| App `tsc` (`npm run typecheck`) | clean | **clean (0 errors)** |
| Server `tsc` (`npm run typecheck:server`) | clean | **clean (0 errors)** |

Tests explicitly prove:
1. Macro remains LIVE regardless of whether SNAPSHOT, LIVE, or PIT preference is saved for the principal.
2. The UI disclosure is rendered with `data-testid="macro-data-mode-exemption-disclosure"`.
3. No UI12 preference is silently represented as controlling Macro.
4. Existing Macro 1:1 observations, indicators, and retrievedAt fetch-time assertions remain green.

---

## 4. SCOPE AUDIT — 0 CHANGES EACH

- `p05`–`p14`: 0 changes.
- `iips-platform`: 0 changes.
- Prior docs (`D85`, `D86`, `D88`, `D89`, `D90`): 0 changes (correct-by-addition preserved).
- Macro server contract (`frontend/server/macro`, `frontend/server/executive-transport.ts` `handleMacroReadRequest`): 0 changes.
- Macro API client (`src/api/macro.ts`): 0 changes.
- Frozen v2.0 routes: 0 changes.
- P12 additive routes (`/api/screener/execute`, `/api/search`): 0 changes.
- Replay / AD-17 / M-2 paths: intact.
- Server `p08` imports: **0**.
- No RBAC or auth changes.
- Browser/runtime qualification: **NOT CLAIMED**.
- Production authorization: **NOT GRANTED**.

---

## 5. STATUS

| Item | Status |
|---|---|
| **Phase 1 — 6 frozen route families** | **COMPLETE (D89)** |
| **Phase 2 — P12 additive routes** (`/api/screener/execute`, `/api/search`) | **COMPLETE (D90)** |
| **Phase 3 — Macro disclosure** | **COMPLETE (D91)** |
| R-2 · R-4 · R-7 | **OPEN** · R-5/C12 **BLOCKED** · M-5 **OPEN** |
| AD-17 / M-2 | **UNRESOLVED** · P14 **INCOMPLETE** · P15 UI certification **NONE** |
| **Production authorization** | **NOT GRANTED** |
