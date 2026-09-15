# D93 — EXECUTIVE DATA-MODE CONSUMER REMEDIATION (UI01 CRASH FIX)

**Act ID:** `D93 — bounded consumer-only remediation for UI01 Executive blank-page crash`  
**Authority:** **D92 = A** (bounded consumer-only remediation authorization).  
**Correct-by-addition:** **D85, D86, D88, D89, D90, D91, and D92 records are NOT edited.**  
**Base:** `727bdcb` (D91) · **Browser/runtime qualification: NOT CLAIMED.**

---

## 1. DEFECT DESCRIPTION & ROOT CAUSE

In D89, governed data-mode propagation was introduced for frozen v2.0 endpoints, returning `DegradedData` (with `dataAvailable: false`) when LIVE or PIT modes are requested for surfaces lacking wired live providers or point-in-time capabilities.

In `ExecutiveDashboard.tsx`, derived presentation arrays were computed in `useMemo` hooks (`evidenceRefs` and `rankedRows`) executing prior to the degraded-state return guard. When a degraded response arrived:
```typescript
const evidenceRefs: EvidenceReference[] = useMemo(() => {
  if (!data) return [];
  return data.decisions.map(...); // TypeError: Cannot read properties of undefined (reading 'map')
}, [data]);
```
Because `data.decisions` and `data.ranking` only exist on successful `ExecutiveData` payloads (and are `undefined` on `DegradedData`), evaluating these hooks before checking `isDegraded(data)` threw a runtime `TypeError`, causing a complete React render abort and a blank screen on UI01 Executive.

---

## 2. BOUNDED REMEDIATION APPLIED

The remediation is strictly **consumer-side**:

1. **Widened Executive API Client Return Type (`frontend/src/api/executive.ts`):**
   - Imported `DegradedData` from `./dataMode`.
   - Exported `ExecutiveResponse = ExecutiveData | DegradedData`.
   - Updated `fetchExecutiveData()` signature to return `Promise<ExecutiveResponse>`.
   - Explicitly marked `dataAvailable?: undefined` on `ExecutiveData` for discriminated union clarity.

2. **Guarded Derived Access in `ExecutiveDashboard.tsx`:**
   - Typed state as `useState<ExecutiveResponse | null>(null)`.
   - Short-circuited `evidenceRefs` memo hook:
     ```typescript
     if (!data || isDegraded(data)) return [];
     ```
   - Short-circuited `rankedRows` memo hook:
     ```typescript
     if (!data || isDegraded(data)) return [];
     ```
   - Retained downstream governed `if (isDegraded(data)) return <DataModeUnavailable data={data} />;` rendering.

3. **SNAPSHOT Behavior Preserved Intact:**
   - When `data` is successful `ExecutiveData`, `isDegraded(data)` evaluates to `false`, allowing `evidenceRefs`, `rankedRows`, summary cards, trust chains, and decision badges to calculate and render normally.

---

## 3. PROOF & MUTATION TESTING

- **4 New Regression Tests Added in `ExecutiveDashboard.test.tsx`:**
  1. `LIVE_UNAVAILABLE does not crash and renders the governed DataModeUnavailable UI`: verifies live degraded response renders `<DataModeUnavailable />` with LIVE label and no decision list.
  2. `PIT_UNAVAILABLE does not crash and renders the governed DataModeUnavailable UI`: verifies PIT degraded response renders `<DataModeUnavailable />` with PIT label and no decision list.
  3. `successful-only arrays are never accessed for degraded payloads (decisions / ranking)`: attaches getter traps that throw errors on any access to `decisions`, `ranking`, `portfolio`, etc. on degraded objects, asserting no throws during render.
  4. `no silent SNAPSHOT fallback occurs when degraded payload is returned`: verifies no certified badges, snapshot freshness badges, or opportunity cards appear for degraded responses.
- **Mutation Proof:**
  - Temporarily reverting the `isDegraded(data)` short-circuit guard reproduced the exact D92 crash (`TypeError: Cannot read properties of undefined (reading 'map')`) and failed all 4 tests.
  - Restoring the guard resulted in all 14 tests passing cleanly.

---

## 4. VERIFICATION OF TEST FLOORS

| Suite | Floor Requirement | **Observed** | Status |
|---|---|---|---|
| **Executive tests** (`ExecutiveDashboard.test.tsx`) | 10 passed | **14 passed / 0 failed** (+4 tests) | **PASSED** |
| **Data-mode tests** (`data-mode.test.ts`) | ≥50 passed | **50 passed / 0 failed** | **PASSED** |
| **Frontend full** (`npm run test -- --pool=threads`) | ≥1052 passed / 0 failed | **1056 passed / 0 failed**, 32 skipped (+4 tests) | **PASSED** |
| **P12 test suite** (`cd p12 && npm test`) | ≥154 passed / 0 failed | **154 passed / 0 failed** (41 suites) | **PASSED** |
| **P13 test suite** (`cd p13 && npm test`) | ≥86 passed / 0 failed | **86 passed / 0 failed** (45 suites) | **PASSED** |
| App `tsc` (`npm run typecheck`) | clean | **clean (0 errors)** | **PASSED** |
| Server `tsc` (`npm run typecheck:server`) | clean | **clean (0 errors)** | **PASSED** |

---

## 5. SCOPE AUDIT — 0 CHANGES OUTSIDE BOUNDED REMEDIATION

- `server/data-mode/data-mode.ts`: **0 changes** (server contract and dispatch preserved).
- `computeCertifiedExecutive()`: **0 changes**.
- D89 server routes and dispatch logic: **0 changes**.
- Frozen v2.0 calculations: **0 changes**.
- `p05`–`p14`: **0 changes**.
- `iips-platform`: **0 changes**.
- Macro server contract and WP-MACRO-03 semantics: **0 changes**.
- R-2 provider ingestion: **OPEN and untouched**.
- PIT capability wiring: **UNWIRED** (0 p08 server imports).
- Replay / AD-17 / M-2: **intact and unchanged**.
- Auth / RBAC: **0 changes**.
- Previous docs (`D85`–`D92`): **0 changes** (correct-by-addition maintained).

---

## 6. STATUS & CONSTRAINTS

| Item | Status |
|---|---|
| **UI01 Executive Crash Remediation** | **COMPLETE (D93)** |
| **Browser / runtime qualification** | **NOT CLAIMED** |
| **Production authorization** | **NOT GRANTED** |
| **R-2 · R-4 · R-7** | **OPEN** · R-5/C12 **BLOCKED** · M-5 **OPEN** |
| **AD-17 / M-2** | **UNRESOLVED** · P14 **INCOMPLETE** · P15 UI certification **NONE** |
