# Institutional Investment Platform System (IIPS)
# Phase 4 — Research Surface Forensic Report

**Gate:** `GATE-PHASE-4-RESEARCH-SURFACE-FORENSIC`
**Authority Act:** `phase4-research-surface-designation-2026-09-23-001` (RAMKI)
**Executed:** 2026-09-23 (Asia/Calcutta) · READ-ONLY — no implementation, no navigation change,
no route restoration, no payload synthesis, no fixture promotion
**Base Checkpoint:** `c7faf1f0f6ca6ee85f4274ea915bbe3c4f5c9afd`
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV

---

## 0. TERMINAL CLASSIFICATION

> ## **C — RESEARCH SURFACE IDENTITY / ROUTE CONTRACT ITSELF REMAINS UNRESOLVED**
> ### FAIL CLOSED — an authority decision is REQUIRED before any Research work can proceed

**B also holds as a sub-finding** (no governed offline Research payload/source exists in ANY
candidate domain), but B alone would mischaracterize the determination: per the designation
packet's own warning, *"the payload question cannot even be posed until the surface's identity
is defined by designation."* The surface-identity question is upstream of, and blocks, the
payload question. Classification **C** is therefore terminal.

Per the gate instruction ("If the gate produces a classification requiring an authority
decision, STOP and return the decision options"), **this gate STOPS here.** Decision options
are returned in §9.

---

## 1. INTEGRITY VERIFICATION (§0 of the gate contract)

| Attestation | Verified |
| --- | --- |
| HEAD at gate start | `c7faf1f0f6ca6ee85f4274ea915bbe3c4f5c9afd` ✓ |
| LOCAL == REMOTE | ✓ (verified pre-gate and post-gate) |
| Worktree at gate end | Only `PHASE4-RESEARCH-SURFACE-DESIGNATION.md` untracked (the act, recorded before gate work) ✓ |
| `git diff HEAD -- src/ tests/ frontend/ package.json tsconfig.json vite.config.ts` | **EMPTY** (0 lines) ✓ |
| Frozen trees | `9080e997` / `0062ad52` / `8491efdc` / `1597ed06` ✓ UNCHANGED |
| Intelligence / Evidence / Executive | nav `partial` × 3 ✓ · surfaces untouched ✓ |
| Research nav (post-gate) | `future` ✓ (unchanged — no navigation change made) |
| Regression | 470/470 tests · 73 suites · 0 failures ✓ (run at gate end) |
| `main` | `94f519bf` ✓ preserved |

---

## 2. DETERMINATION 1 — SURFACE IDENTITY (REQ-1)

**Finding: a governed Research surface DOES NOT exist. UI03 / UI05 / UI06 / UI12 are DISTINCT
product surfaces, not components of a Research surface.**

Primary evidence:

1. **The governed surface registry has no Research member.** `src/ui/types.ts` L22-36 defines
   `UISurfaceId` as exactly 14 literals — `UI01_REPLAY_STUDIO` … `UI14_ALTDATA_AUDITOR`.
   No `RESEARCH` surface ID exists.
2. **"Research" does not appear in the governed contract layer at all.** Case-insensitive
   search of `src/` returns **zero** matches. The term exists only in four shell files
   (`App.tsx` placeholder mount, `FeaturePlaceholder`, `navigation.ts` label, `routes.ts`
   constant) — a shell-level navigation label, not a product-surface identity.
3. **The four named builders are peers, not children.** All 14 builders are exported as
   equals by `src/ui/view_models/index.ts`. No composite, aggregation, grouping, or
   "research" type exists anywhere in `src/` or `frontend/src/` (verified:
   `researchSurface` / `ResearchView` / `ResearchViewModel` → 0 matches).
4. **The UI03/05/06/12 → Research mapping is analytical, not contractual.** It appears only
   in `NEXT-PRODUCT-SURFACE-AUTHORITY-DESIGNATION-PACKET.md` §4.1 as "adjacent assets", with
   an explicit scope warning: binding them to `/research` *"would constitute implicitly
   selecting additional product surfaces, which the standing constraints prohibit."*
5. **Cross-lineage identifier instability (new finding).** The historical D91 document uses
   "UI12" to mean the account-wide *"Default data mode"* preference
   (`docs/D91_MACRO_LIVE_ONLY_EXEMPTION_DISCLOSURE.md`, historical refs only), while the
   current governed registry's `UI12` = `UI12_ESTIMATES_DISTRIBUTION`. The same identifier
   denotes different things across lineages; only the current registry is authoritative, and
   historical numbering must never be transplanted.

## 3. DETERMINATION 2 — CHILD-ROUTE CONTRACT (REQ-2)

**Finding: the current governed contract is a SINGLE placeholder route with NO child routes.
No route was restored or created by this gate.**

| Era | Contract |
| --- | --- |
| **Historical (donor, `origin/arena/01a0c440`)** | `/research` → `ResearchHub` (nav `partial`) with **six** implemented children: `/research/company/:id` (CompanyIntelligence), `/research/sector/:id` (SectorIntelligence), `/research/events/:id` (ResearchEvents), `/research/cross-sector` (CrossSectorIntelligence), `/research/macro` (MacroContext); Screener lived separately at `/screener`. Source: `FULL-IIPS-BASELINE-FORENSIC-ANALYSIS.md` §3.2. |
| **Phase-1A authority decision** | API-coupled route constants **REMOVED rather than retained as dead links** (OQ-1 = Option A). `docs/PHASE1_AUTHORIZATION_PREPARATION.md` L173-179 records all six research-family surfaces as **DEFER**, each with its API dependencies (decisionMatrix / dataMode / company / evidence / replay / crossSector / macro) — every child is API-coupled. |
| **Current (verified)** | Exactly ONE route: `research: '/research'` → `FeaturePlaceholder surface="Research"`; nav status `future`; **zero** `research/` child paths in `frontend/src/`. Enforced by NAV-10 (all nav paths declared), NAV-11 (all paths concrete — `:param` templates forbidden), NAV-05 (no dead children). |

Additional constraint recorded: four of the six historical child routes are `:id` param
routes. Restoring them would collide with the NAV-11 concrete-path contract, not merely with
the pruning decision — the dead-link question and the param-route question are **both** open
under any restoration scenario.

## 4. DETERMINATION 3 — D91 GOVERNANCE (REQ-3)

**Finding: MacroContext is the D91 disclosure-bearing component; its data path is governed
LIVE-only with SNAPSHOT fallback disallowed. Any offline macro rendering under Research would
contradict standing macro governance absent explicit relief.**

Primary evidence (extracted read-only from historical refs; see caveat):

1. **D91** (`D91 — macro LIVE-only exemption disclosure`, authority **D88 = A**, created
   `727bdcb`, last carried `3ef2cc7`): macro data (`/api/macro`) is governed **LIVE-only**
   (WP-MACRO-03: *"LIVE, never SNAPSHOT"*), deliberately **EXEMPT** from the account-wide
   data-mode preference, *"disallowing fallback to SNAPSHOT baseline data."*
2. **The D91 UI obligation binds precisely to the Research child:** the disclosure table
   names `MacroContext.tsx` at *Research → Macro (`/research/macro`)*, rendering
   `data-testid="macro-data-mode-exemption-disclosure"` stating Macro is LIVE-only and exempt
   from data-mode preferences.
3. **Caveat — D91 is absent from the current tree.** `docs/` holds only three files; the D91
   document exists solely on historical refs. In the current lineage its content is carried
   by **citation** in the Phase-1C forensic report (§6, missing-artifact M-5). This gate
   treats the cited governance as standing (consistent with the Phase-1C adjudication) and
   flags the documentary gap explicitly.
4. **Compounding exclusion:** the historical macro transport (`/api/macro`,
   `frontend/server/macro`, `handleMacroReadRequest`, `src/api/macro.ts`) is exactly the
   infrastructure class Path L prohibits. Macro under Research is therefore blocked
   **twice**: by D91 (offline/SNAPSHOT macro contradicts governance) and by Path L (the
   historical transport is excluded).
5. **The only macro-shaped artifact is ungoverned:** `tests/fixtures/d08_fixtures.json`
   (2 `validMacro` + 1 **deliberately invalid** record; zero governance fields — no
   provenance/lineageDigest/quality/dataVersion) is a P01 validator harness, and D91 blocks
   it regardless.

## 5. DETERMINATION 4 — PAYLOAD FORENSICS (REQ-4)

**Finding: no governed offline Research payload/source exists in ANY candidate domain.**

Exhaustive stored-payload search across every JSON artifact (fixtures, evidence, docs),
per candidate surface's mandatory input contract:

| Candidate surface | Mandatory input(s) | Stored governed payloads | Determination |
| --- | --- | --- | --- |
| UI03 Fundamental Analysis | `FundamentalsDTO` (+ full `ExecutiveProvenance`) | **ZERO** (no artifact carries fundamentals keys) | FAIL |
| UI05 Sector Scoring Radar | `EngineScoreOutput` | **ZERO** — re-verified; consistent with Executive gate Domain 2 (`5ef8960`); derivation transitively blocked (absent `rawMarketDataInputs`; P04 identity fails closed) | FAIL |
| UI06 Multifactor Screener | `ScreenerService` **service object** + `ScreenerFilter` | **ZERO** candidates; the service is an empty registry — every `ScreenerCandidate` (score/grade/pe/roe aggregates) must be externally registered | FAIL |
| UI12 Estimates Distribution | `EstimatesEngine` **engine object** + `IndividualAnalystEstimate[]` | **ZERO** estimates; the engine is an empty registry requiring `submitEstimate()` of analyst-level records | FAIL |
| UI13 Macro Vintage Tracker | `MacroEngine` + `MacroSeriesId[]` | Only `d08` validator harness — **ungoverned AND D91-blocked** | FAIL |

Structural note: unlike Executive's three payload DTOs, UI06 and UI12 depend on
**stateful service/engine objects** with no built-in data. Even a hypothetical payload
authorization would need to define how candidates/estimates are registered into those
objects — a construction the Path-L pattern has never exercised. No fixture was promoted and
no payload was synthesized by this gate.

## 6. DETERMINATION 5 — AUTHORITY (REQ-5)

**Finding: zero Research-specific authority exists.**

- Repo-wide `AUTH-*-ACT-*` inventory re-verified (fourth consecutive gate): exactly **ONE**
  act — `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` (identity only).
- Acts naming RESEARCH / SCREENER / SECTOR / MACRO / ESTIMATES / FUNDAMENTALS: **ZERO**.
- No governed Research identity binding, no Research provenance source, no Research
  data-source authority. The D05 master is identity-only and does not extend to any research
  domain.
- The only Research-adjacent authority artifacts are the Phase-1A **DEFER** record for the
  six historical children (an exclusion, not an authorization) and this gate's own
  designation act.

## 7. DETERMINATION 6 — PATH-L FEASIBILITY (REQ-6)

**Finding: Path L is NOT executable for Research today — it becomes feasible only AFTER an
explicit surface-identity designation.**

The Path-L pattern as executed three times (Intelligence UI04, Evidence UI11, Executive UI02)
binds a route to an EXISTING TESTED LOCAL view-model builder whose surface identity matches
the route. For `/research`:

1. **No matching builder exists.** No RESEARCH surface ID, no research view model, no
   grouping of UI03/05/06/12. Any binding of an adjacent builder to `/research` would be a
   NEW surface-identity decision — precisely what the standing constraints prohibit doing
   implicitly, and what this gate must not do.
2. **If an authority names a surface, the pattern is compatible but constrained:**
   - UI03 would fail closed on absent `FundamentalsDTO` (Executive-like).
   - UI05 **inherits the Executive Domain-2 failure** (`EngineScoreOutput` absent).
   - UI06 requires a service object (novel construction for Path L).
   - UI12 requires an engine + raw estimates (novel construction).
   - UI13 is D91-collided (LIVE-only macro; offline contradicts governance).
3. **All five candidate builders are genuine tested assets** (`wse_surfaces_ui01_ui14`
   exercises all 14; `wse_p13_ui_integration` exercises UI03/UI06) — the constraint is not
   asset quality but **identity authority**.
4. **The child-route contract question is equally open:** single-surface-at-`/research` (no
   children, NAV-10/11 compatible) vs. any restoration (pruning decision + NAV-11 param
   conflict + dead-link exposure).

**Therefore: classification C.** The blocker is upstream of payloads: WHICH surface(s)
`/research` presents, and under what child-route contract, is undefined and requires an
explicit designation that this gate is forbidden to make.

## 8. WHY NEITHER SYNTHETIC DATA NOR IMPLICIT SELECTION CAN SUBSTITUTE

1. Synthesizing a research payload repeats the fabrication error class already rejected by
   three consecutive gates; for UI06/UI12 it would additionally require inventing
   **aggregate scores/grades and analyst-level estimates** — double fabrication.
2. An offline macro payload would directly contradict D91 (LIVE-only, SNAPSHOT fallback
   disallowed) — governance relief, not data, is the blocker there.
3. Implicitly binding UI03/05/06/12 to `/research` would silently select four additional
   product surfaces under a Research label — a navigation-contract decision made by an
   agent rather than by authority. The honest state (placeholder + `future`) is strictly
   superior to an unauthorized composition.

## 9. NEXT AUTHORITY DECISION (returned automatically; gate STOPPED)

**Decision required: the disposition of RESEARCH given classification C.** Options are
mutually exclusive and NOT interchangeable:

- **OPTION A — DESIGNATE THE RESEARCH SURFACE IDENTITY, THEN PATH-L.** Explicitly name
  which existing registered surface(s) `/research` shall present (e.g. "UI03 only", or an
  ordered set), fix the child-route contract to **single route, no children** (NAV-10/11
  compatible), and authorize a presentation-only fail-closed Path-L convergence for the
  named surface(s) under the established pattern. Macro (UI13) is excluded unless D91 relief
  is separately granted. Scope of any implementation would then be bounded by the payload
  failures in §5 (the named surface renders its governed unavailable state).
- **OPTION B — COMMISSION GOVERNED RESEARCH PAYLOAD SPECIFICATION.** Authorize a
  requirements/contract specification (no implementation) for the missing governed offline
  research datasets: R-1 `FundamentalsDTO` source, R-2 `EngineScoreOutput` source (or
  governed derivation inputs), R-3 `ScreenerCandidate` registration source, R-4
  `IndividualAnalystEstimate` source, R-5 authorizing acts, R-6 governed identity binding
  (may implicate D115). Macro (R-7) requires D91 relief from authority D88 **first**.
- **OPTION C — CLOSE RESEARCH ADJUDICATION WITHOUT DESIGNATION.** Record classification C
  as terminal: Research remains `future` and unadjudicated-in-principle; the 14 governed
  surfaces remain individually available for future single-surface designations (Executive /
  Intelligence / Evidence pattern); no further Research gate is opened unless a new
  authority act re-opens it. No repository change beyond the governance record.

**Standing disclosure:** D115 C/D = WITHHELD / UNRESOLVED / NOT AUTHORIZED ·
`runtimeCompanyId` UNRESOLVED · `productionEligible` false · external live sockets 0 ·
implementation authority NOT GRANTED by the Phase-4 designation (read-only gate only) ·
Windows visual acceptance NOT claimed by Arena.

---

**End of Gate `GATE-PHASE-4-RESEARCH-SURFACE-FORENSIC` — classification C, fail closed,
awaiting authority disposition.**
