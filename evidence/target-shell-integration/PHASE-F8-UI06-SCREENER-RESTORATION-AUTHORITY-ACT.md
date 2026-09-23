**# IIPS — PHASE F-8 AUTHORITY DESIGNATION ACT**

**# UI06 MULTIFACTOR SCREENER — WAVE-1 RESTORATION-ONLY SURFACE BINDING**

**Act ID:** `f8-ui06-screener-restoration-2026-09-23-001`

**Act Type:** AUTHORITY_DESIGNATION (act precedes any implementation; this act authorizes NO implementation by itself)

**Decision Authority:** RAMKI (Designating Authority)

**Recording Agent:** Arena (recording only; no implementation performed or authorized by this act's creation)

**Selected By:** RAMKI — explicit authority decision recorded 2026-09-23 (F-8 gate), ONE surface only

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01

**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED

**---**

**## 1. ANTECEDENT STATE (verified before this act)**

| Item | Value |

| --- | --- |

| Authoritative main | `78c95d03311a4893bf513adbeff43fe0d06c7883` (F-3 merge commit; 0 commits after) |

| F-3 (UI08) | MERGED / ACCEPTED / DURABLE (authority `4f8db9d`, implementation `c3d61a1`) |

| F-5 | A — dataset readiness reconciliation complete (D01–D09 payload supply = dependency facts only) |

| F-7 | A — restoration sequencing complete (UI06 classified Wave-1 / PLATFORM-INTEGRATION READY / SAFE-NOW upon this designation) |

| Prior authority selection for UI05/UI06/UI09 | NONE existed (NEXT-PRODUCT-SURFACE packet explicitly reserved selection to RAMKI) — this act is the first and only selection; no duplicate |

| Worktree | Platform re-clone artifact state (32 entries, session work intact, byte-verified vs main); NOT modified by the F-8 gate; git metadata NOT repaired per instruction |

**## 2. PRE-ACT VERIFICATION (12/12 PASS, recorded 2026-09-23)**

1. main == `78c95d0` ✓

2. Worktree not modified by this gate ✓

3. Selected builder exists: `src/ui/view_models/ui06_multifactor_screener.ts` ✓

4. Already-qualified builder: `UI06MultiFactorScreenerBuilder` qualified by `tests/wse_surfaces_ui01_ui14.test.ts` (Contract C6 integration; `surfaceId === 'UI06_MULTIFACTOR_SCREENER'`) ✓

5. Builder unchanged vs main (blob `d3cccdda`) ✓

6. Existing contract unchanged: `src/transports/screener_service.ts` (blob `7555da20`), `ScreenerFilter` contract ✓

7. Certified platform core unchanged: `src/identity`, `src/ui`, `src/d114`, `frontend/src/features/portfolio`, `src/transports`, `src/contracts` — byte-identical to main (0 differences) ✓

8. No Dhan dependency for the binding action (0 references) ✓

9. No D115 dependency for the binding action (0 references) ✓

10. No provider activation dependency for the binding (pure in-process builder + service) ✓

11. Honest unavailable-payload capability: builder requires `criteria` + `screenerService` (registered candidates); absent a governed candidate universe the bound surface MUST render the honest `OFFLINE / UNAVAILABLE / PAYLOAD NOT COMMISSIONED` state (Path-L precedent UI02/UI03/UI04/UI11) ✓

12. F-3 Path-L binding precedent exists (F-3 act `f3-ui08-security-master-functional-2026-09-23-001` + four Path-L presentation-only acts) ✓

**## 3. SELECTED SURFACE**

- **Surface ID:** `UI06_MULTIFACTOR_SCREENER`

- **Surface name:** Multifactor Screener (UI06)

- **Existing route constants:** `/screener` and `/screener/governed` (donor-lineage, structural, currently `unavailable`)

- **Authoritative implementation:** the EXISTING qualified `UI06MultiFactorScreenerBuilder` + EXISTING in-process `ScreenerService` — VERBATIM, as-is.

**## 4. RESTORATION-ONLY SCOPE — THE ONLY AUTHORIZED CHAIN**

```

EXISTING QUALIFIED BUILDER (UI06MultiFactorScreenerBuilder, unmodified)

        ↓

MASTER IIPS SURFACE BINDING (routed surface, F-3/Path-L pattern)

        ↓

REQUIRED ROUTE/NAV CENSUS (bounded amendment, UI06 only)

        ↓

BOUNDED TEST COVERAGE (routed tests for UI06 only)

```

**NOTHING BEYOND THIS CHAIN IS AUTHORIZED.**

Permitted, within the chain only:

- Create the Master IIPS surface component bound to the existing builder (no builder modification).

- Bind the surface to the existing `/screener` route constant (the `/screener/governed` constant may be referenced only as the donor structure already does; no new donor-lineage claims).

- Bounded navigation/route census amendments strictly as necessary for UI06 (status transitions recorded honestly; totals unchanged unless UI06's own entry requires it).

- Routed test suite for the UI06 surface (route resolution, builder binding, honest unavailable-payload state, no-activation source scan, census guards).

- The expected resulting state is: **OFFLINE / UNAVAILABLE / PAYLOAD NOT COMMISSIONED** — this state is EXPECTED, HONEST, and MANDATORY until a governed candidate universe (D01-derived payloads) is separately commissioned.

**## 5. EXPLICIT NON-AUTHORIZATION (prohibited without further authority)**

- NO reimplementation of any completed functionality (****COMPLETED FUNCTIONALITY = PRESERVE + RESTORE****).

- NO builder modification, NO contract redesign, NO engine modification.

- NO dataset commissioning (D01 or any other domain; the payload gap is a dependency, NOT missing functionality).

- NO provider activation; NO Dhan activation; NO NSE activation (Dhan remains an external dependency only; no Dhan workstream is created by D01's absence).

- NO D115 activation; NO production authorization; NO credentials.

- NO identity designation beyond UI06's standard surface binding; NO binding of any other surface (UI05, UI07, UI09, UI10, UI12, UI14, or any other).

- NO modification of protected items.

**## 6. PROTECTED ITEMS (unchanged by this act and by any execution under it)**

BI-08 (sealed BI-01..BI-08) · UI08 / D05 `src/identity` `9080e997`) · all 14 certified builders `src/ui` `1597ed06`; UI06 builder blob `d3cccdda` verbatim) · D01–D09 contracts · platform core `src/d114` `0062ad52`, portfolio `8491efdc`) · 530/530 · 82-suite regression baseline · all qualification/acceptance evidence · all governance acts · D115 boundary · Dhan boundary · NSE boundary · D114 NON_PRODUCTION_HOLD · D91/D88 Macro exclusion · all existing fail-closed behavior.

**## 7. ACCEPTANCE REQUIREMENTS FOR THE FUTURE IMPLEMENTATION GATE (F-9)**

The implementation gate (F-9), executing this act, MUST follow the proven F-3 pattern:

authority act committed FIRST → existing builder bound verbatim → bounded census amendments → routed tests → comment-stripped boundary scan (zero genuine activation) → full regression (530/530 baseline; ANY regression STOPS the gate) → mutation guards where applicable → ONE implementation commit → push → LOCAL == REMOTE durability.

**## 8. RECORDING STATUS (git durability)**

This act was recorded as a workspace artifact on 2026-09-23 during the F-8 gate. The session workspace was under a platform re-clone metadata reset (branch pointer at `94f519b`, session work present but uncommitted, remote push unavailable); committing in that state would create corrupt lineage, so NO commit was made by the F-8 gate. **The act commit MUST be the FIRST action of the F-9 implementation gate — before any source change — preserving the act-precedes-source invariant.** Integrity: this act's file SHA-256 is recorded in the F-8 gate report.

**---**

**This act designates ONE surface (UI06 Multifactor Screener) for restoration-only Master IIPS surface binding. It authorizes NO implementation by itself; implementation requires the F-9 gate executing exactly the chain in §4 under the constraints in §5–§6.**
