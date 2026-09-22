# Institutional Investment Platform System (IIPS)
# Phase 4 — Research Surface Identity Designation: Authority Act

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `phase4-research-identity-designation-2026-09-23-001`
**Governing Authority:** RAMKI (Designating Authority)
**Recording Agent:** Arena
**Act Type:** SURFACE IDENTITY DESIGNATION + READ-ONLY DESIGN AUTHORIZATION (NO IMPLEMENTATION AUTHORITY)
**Recorded At (local, Asia/Calcutta):** 2026-09-23
**Antecedent Checkpoint:** `bc6d8ae5cf07a21f7436bac04076a215187473f3`

---

## 1. Preserved Antecedent State (verbatim)

| Item | Value |
| --- | --- |
| Gate | `GATE-PHASE-4-RESEARCH-SURFACE-FORENSIC` = COMPLETE |
| Classification | **C — SURFACE IDENTITY / ROUTE CONTRACT UNRESOLVED — FAIL CLOSED** |
| Prior authority act | `phase4-research-surface-designation-2026-09-23-001` |
| Durability checkpoint | `bc6d8ae5cf07a21f7436bac04076a215187473f3` |
| Research (pre-act) | `future` — single placeholder route, zero child routes |

Verified independently before recording: HEAD ✓ · LOCAL == REMOTE ✓ · CLEAN ✓ ·
`main` `94f519bf` ✓ · Portfolio implemented / Intelligence+Evidence+Executive `partial` /
Research `future` ✓ · frozen trees `9080e997` / `0062ad52` / `8491efdc` / `1597ed06` ✓ ·
470/470 tests across 73 suites ✓. **0 discrepancies** against the authority message.

## 2. Selection Integrity Note

**Two selections were required, and both were obtained explicitly.**

1. **Disposition (A / B / C).** The authority message enumerated the three options, said
   *"SELECT EXACTLY ONE"* and *"Do not implement any option autonomously"*, but carried **no
   selection line** — the fourth consecutive act in this sequence to do so. Arena **halted
   and did not infer**: the options are not interchangeable (A = identity designation then
   read-only design; B = payload specification with no identity selection; C = close the
   adjudication). RAMKI then explicitly selected **OPTION A**.
2. **Surface identity (the follow-up Option A itself mandates).** Option A requires that
   *"every registered surface authorized for /research"* be **explicitly named** — the
   naming authority belongs to RAMKI alone. Arena asked; RAMKI explicitly selected
   **`UI03_FUNDAMENTAL_ANALYSIS`** (single surface).

No repository state was modified prior to either selection.

## 3. AUTHORITY DECISION RECORDED

> ### **OPTION A — DESIGNATE RESEARCH SURFACE IDENTITY**
> ### **/research = `UI03_FUNDAMENTAL_ANALYSIS` (SINGLE REGISTERED SURFACE)**
> **Selected by:** RAMKI

### 3.1 What is designated

| Element | Value |
| --- | --- |
| Route | `/research` — **single route, zero child routes** |
| Surface identity | **`UI03_FUNDAMENTAL_ANALYSIS`** (registered in `UISurfaceId`, `src/ui/types.ts` L25) |
| Bound local asset | `UI03FundamentalAnalysisBuilder` (`src/ui/view_models/ui03_fundamental_analysis.ts`) |
| Mandatory input | `FundamentalsDTO` (incl. `ExecutiveProvenance`) + `companyName` |
| Composition | **NONE** — no other surface is merged, grouped, or implicitly selected |

### 3.2 Constraints carried by the designation (binding)

- **NO** new `UISurfaceId` is invented; **NO** distinct registered surfaces are merged.
- `/research` remains a **single route with zero child routes** unless separately authorized.
- **NO** restoration of `ResearchHub`, `ResearchEvents`, `SectorIntelligence`, `MacroContext`
  (or `CompanyIntelligence` / `CrossSectorIntelligence`) routes.
- **Macro (`UI13`) remains EXCLUDED** unless separate D91/D88 authority relief exists.
- After identity designation, **ONLY the resulting read-only/design work** is authorized.
  **NO implementation authority is granted by this act** — no route change, no navigation
  change, no component, no test, no payload.
- UI05 / UI06 / UI12 (the other research-adjacent surfaces) are **NOT selected** and remain
  individually designatable only through future explicit authority acts.

### 3.3 Consequences of the designation (factual, from gate `bc6d8ae`)

- The payload blocker is **R-1**: zero governed `FundamentalsDTO` payloads exist repo-wide;
  until R-1 (+ R-5 act, R-6 identity binding) exists, any UI03-bound `/research` surface
  renders its **governed unavailable state** (Executive-pattern fail-closed).
- Identity discipline: existing UI03 *test harnesses* use the ungoverned `companyId: 'INFY'`
  form. Any future **governed** payload must use the D05 canonical form (`EQ_INFY_IN`-style);
  minting a binding may implicate D115 (WITHHELD).

## 4. Retained Governance Invariants (unmodified by this act)

| Invariant | State |
| --- | --- |
| Operating mode | `NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV` |
| Portfolio / BI-08 | `implemented` — FROZEN |
| Intelligence · Evidence · Executive | `partial` — FROZEN at current states |
| Research | `future` — **navigation unchanged by this act** (identity designated only) |
| 13 other registered surfaces | NOT SELECTED — individually designatable via future acts |
| Production fail-closed boundary | FROZEN |
| Overlays / auth seam | DEFERRED |
| D115 C / D | **WITHHELD / UNRESOLVED / NOT AUTHORIZED** |
| D91 / D88 (macro) | STANDING — LIVE-only, no relief granted |
| `productionEligible` | false |
| Windows visual acceptance | NOT CLAIMED BY ARENA |

---

**End of Authority Act. Only the resulting read-only design work may follow; implementation
requires a separate, explicit authority act.**
