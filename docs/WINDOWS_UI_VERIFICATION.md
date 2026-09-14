# Windows UI Verification — Authority Record

**Decision ID:** WIN-UI-VERIFY-01
**Date:** 2026-09-14
**Authority:** Program Authority (explicit, this act)
**Type:** Windows UI verification authority act
**Source baseline:** `4b37e5b3fec81e06464a91ea524808d28c21acdf`

---

## 1. Authority Basis

Program Authority explicitly authorized Windows UI verification of the
authoritative IIPS frontend against governed P13/P14 UI expectations.

**Authorization scope:** Verification ONLY.
**Not authorized:** UI implementation, modification, refactoring,
certification, P15/P16 changes, production authorization.

### Governance Prerequisites (all verified)

| Prerequisite | Status | Evidence |
|---|---|---|
| E13-10 | CLOSED | `docs/E13-10_EB14-3_CLOSURE.md` |
| EB14-3 | CLOSED | `docs/E13-10_EB14-3_CLOSURE.md` |
| P13 | ACCEPTED | `docs/PHASE_13_GATE_ACCEPTANCE.md` |
| P14 | ACCEPTED | `docs/PHASE_14_GATE_ACCEPTANCE.md` |
| P14-06 oracle | PASS | 15/15 tests, 7/7 oracle checks |
| CHECKPOINT-02 | DURABILITY COMPLETE | All governed commits durable on remote |
| P15 | ACCEPTED AT A3 GATE; Certification = NONE | Unchanged |
| P16 | CERTIFIED / CLOSED | Unchanged |

---

## 2. Windows Workspace Identity

| Field | Value |
|---|---|
| **Windows workspace** | NOT ACCESSIBLE |
| **Reason** | Arena sandbox is Linux-only; no access to user's Windows filesystem |
| **Known Windows reference** | `G:/IIPS/phase13-next-authority/frontend` (from prior E2E test output) |
| **Relationship to baseline** | UNKNOWN — cannot verify correspondence to `4b37e5b` |
| **Substitution check** | No older phase12/phase13 lineage silently substituted |

**Determination:** The Windows workspace cannot be identified, accessed,
or verified against the authoritative baseline from the Arena sandbox
environment. Per the authority act's explicit instruction: "If the Windows
workspace cannot be proven to correspond to the authoritative frontend/
baseline, STOP and report BLOCKED rather than certifying parity."

---

## 3. Source-Level Verification (Authoritative Baseline)

Since Windows execution is BLOCKED, the following source-level verification
was performed against the authoritative baseline `4b37e5b` to establish
what IS and IS NOT present in the governed UI source.

### 19-Surface Matrix

| ID | Governed Name | Source Component(s) | Route/Trigger | Status |
|---|---|---|---|---|
| UI01 | Dashboard | `ExecutiveDashboard.tsx` | `/executive` | ✅ PRESENT |
| UI02 | Company Workspace | `CompanyIntelligence.tsx`, `CompanyTrustChain.tsx` | `/research/company/:id` | ✅ PRESENT |
| UI03 | Portfolio | `PortfolioWorkspace.tsx` | `/portfolio` | ✅ PRESENT |
| UI04 | Research | `ResearchHub.tsx`, `SectorIntelligence.tsx`, `ResearchEvents.tsx`, `MacroContext.tsx` | `/research`, `/research/sector/:id`, `/research/events/:id`, `/research/macro` | ✅ PRESENT |
| UI05 | Screener | `Screener.tsx` | `/screener` | ✅ PRESENT |
| UI06 | Decision Center | `DecisionMatrix.tsx` | `/intelligence/decision-matrix` | ✅ PRESENT |
| UI07 | Watchlists | `NotesDrawer.tsx` | TopBar Notes button (shell overlay) | ✅ PRESENT |
| UI08 | Reports | **NONE** | **NONE** | ❌ NOT PRESENT |
| UI09 | Alerts | `NotificationDrawer.tsx` | TopBar Notifications button (shell overlay) | ✅ PRESENT |
| UI10 | Collaboration | **NONE** | **NONE** | ❌ NOT PRESENT |
| UI11 | Administration | `Administration.tsx` + 8 sub-panels (`AdminOverview`, `AdminIdentity`, `AdminTenancy`, `AdminEngines`, `AdminPlatform`, `AdminAudit`, `AdminData`, `AdminOperations`) | `/admin/*` | ✅ PRESENT |
| UI12 | Settings | **NONE** | **NONE** | ❌ NOT PRESENT |
| UI13 | Global Search | `CommandPalette.tsx` | TopBar Search button + Ctrl+K (shell overlay) | ✅ PRESENT |
| UI14 | Command Palette | `CommandPalette.tsx` | Ctrl+K / Cmd+K (shell overlay) | ✅ PRESENT |
| UI15 | CrossSectorIntelligence | `CrossSectorIntelligence.tsx` | `/research/cross-sector` | ✅ PRESENT |
| UI16 | EvidenceExplorer | `EvidenceExplorer.tsx`, `EvidenceHub.tsx` | `/evidence`, `/evidence/:id` | ✅ PRESENT |
| UI17 | ReplayExplorer | `ReplayExplorer.tsx` | `/evidence/replay/:id` | ✅ PRESENT |
| UI18 | EngineRegistry | `IntelligenceHub.tsx` | `/intelligence` | ✅ PRESENT |
| UI19 | AiAdvisory | `AiExplanation.tsx` | Embedded component (host surface sector key) | ✅ PRESENT |

### Source-Level Summary

| Category | Count | Surfaces |
|---|---|---|
| PRESENT (routed) | 10 | UI01, UI02, UI03, UI04, UI05, UI06, UI11, UI15, UI16, UI17 |
| PRESENT (shell overlay/drawer) | 4 | UI07, UI09, UI13, UI14 |
| PRESENT (embedded component) | 2 | UI18, UI19 |
| NOT PRESENT | 3 | UI08, UI10, UI12 |

### Absent Surfaces — Evidence

**UI08 (Reports):** No `.tsx` file with "Report" in its name exists in the
baseline. No route contains "report". No navigation entry references
Reports. The navigation model (`navigation.ts`) has no entry for Reports.

**UI10 (Collaboration):** No `.tsx` file with "Collab" in its name exists
in the baseline. No route contains "collaboration". No navigation entry
references Collaboration.

**UI12 (Settings):** No `.tsx` file with "Setting" in its name exists in
the baseline. No route contains "settings". No navigation entry references
Settings.

**Note:** These 3 surfaces were listed in the P13 acceptance record
(`docs/PHASE_13_GATE_ACCEPTANCE.md`) as ACCEPTED. The P13 acceptance
was a governance act that accepted the implementation state as-is. The
absence of dedicated components for these surfaces in the authoritative
baseline is a factual finding, not a governance contradiction.

---

## 4. Overall Verification Result

| Aspect | Result | Reason |
|---|---|---|
| **Windows UI verification** | **BLOCKED** | Windows workspace not accessible from Arena sandbox; identity and baseline correspondence cannot be established |
| **Source-level verification** | **16/19 PRESENT, 3/19 NOT PRESENT** | UI08 (Reports), UI10 (Collaboration), UI12 (Settings) have no source components in the authoritative baseline |

---

## 5. Discrepancies

| # | Surface | Discrepancy | Type | Severity |
|---|---|---|---|---|
| D1 | UI08 (Reports) | No source component, route, or navigation entry in authoritative baseline | Provenance | Informational — surface was P13-accepted but has no dedicated implementation in baseline |
| D2 | UI10 (Collaboration) | No source component, route, or navigation entry in authoritative baseline | Provenance | Informational — surface was P13-accepted but has no dedicated implementation in baseline |
| D3 | UI12 (Settings) | No source component, route, or navigation entry in authoritative baseline | Provenance | Informational — surface was P13-accepted but has no dedicated implementation in baseline |
| D4 | Windows workspace | Cannot be accessed or identified from Arena sandbox | Environment | BLOCKING — prevents runtime visual verification |

No code was modified. No patches were applied.

---

## 6. Explicit Statements

**This was verification only.** No UI implementation, modification,
refactoring, or patching was performed.

**Implementation authority:** NOT GRANTED
**Certification authority:** NOT GRANTED
**Production authorization:** NOT GRANTED

**P13:** ACCEPTED — unchanged
**P14:** ACCEPTED — unchanged
**P15:** ACCEPTED AT A3 GATE; Certification = NONE — unchanged
**P16:** CERTIFIED / CLOSED — unchanged

---

## 7. Authority Record

| Role | Identity | Authority Basis |
|---|---|---|
| Program Authority | Sai / Ramki | Ongoing Program Authority |
| Verification Authority | Program Authority | WIN-UI-VERIFY-01 (explicit, this act) |
| Source baseline | `4b37e5b` | UI-PROVENANCE-01 |

---

**Windows UI verification: BLOCKED** (Windows workspace not accessible;
source-level verification: 16/19 PRESENT, 3/19 NOT PRESENT)
