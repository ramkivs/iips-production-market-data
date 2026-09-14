# UI Source Provenance Establishment — Authority Record

**Record:** UI-PROVENANCE-01  
**Date:** 2026-09-14  
**Authority:** Program Authority (Sai / Ramki)  
**Status:** EXECUTED

---

## Decision

Program Authority formally designates:

**Authoritative current IIPS UI source:**
`iips-production-market-data/frontend/`

**Identity:**
- Package: `@iips/v3-frontend`
- Version: `0.1.0`
- Description: Program v3.0 Enterprise Investment Intelligence Experience — React/TS/Vite application shell (Phase 3). Presentation-only; consumes certified v2.0 contracts.

**Scope of designation:** SOURCE PROVENANCE ONLY.

---

## Why frontend/ Was Selected

### 1. It IS the actual IIPS UI application

- 147 files total
- 78 React .tsx component files
- React 18.3.1, Vite, TypeScript
- 14 feature directories mapping to the governed P13 UI surfaces

### 2. Direct mapping to P13's 19 UI surfaces

| Feature Directory | P13 Surface(s) |
|---|---|
| `features/executive/` | UI01 Dashboard |
| `features/company/` | UI02 Company Workspace |
| `features/portfolio/` | UI03 Portfolio |
| `features/research/` | UI04 Research |
| `features/screener/` | UI05 Screener |
| `features/decision-matrix/` | UI06 Decision Center |
| `features/notes/` | UI07/09 Watchlists/Alerts |
| `features/admin/` | UI11 Administration |
| `features/shell/` | UI13/14 Search/Command Palette |
| `features/cross-sector/` | UI15 CrossSectorIntelligence |
| `features/evidence/` | UI16 EvidenceExplorer |
| `features/replay/` | UI17 ReplayExplorer |
| `features/intelligence/` | UI18/19 EngineRegistry/AiAdvisory |

### 3. Target of P14 validation/oracle

P14 UX validation modules (`p14/src/`) validate against these UI surfaces.
P14 acceptance record references visual parity, accessibility, and browser
compatibility for the 19 P13 surfaces — which are implemented in frontend/.

### 4. Referenced in prior program authority evidence

| Authority Record | Reference |
|---|---|
| D4_01 Integration Reuse Baseline | `frontend/src/features/executive/ExecutiveDashboard.tsx`, `frontend/src/app/App.tsx`, `frontend/server/*.ts`, `frontend/src/api/*.ts` cited as primary evidence |
| D41 External Remediation Work Request | `frontend/server/executive-transport.ts` identified as location of ENGINE_FACTORY (M-1 defect) |
| D50-R2 Existing-IIPS Authority Acceptance | `frontend/server/executive-transport.ts` cited for 13-engine verification |

### 5. Previous absence of Git provenance

Before this act, frontend/ had:
- 0 files tracked in Git
- No commit SHA
- No branch/ref
- No formal Program Authority designation

This act establishes all four.

---

## Provenance Established

| Field | Value |
|---|---|
| **Repository** | `ramkivs/iips-production-market-data` |
| **Path** | `frontend/` |
| **Branch** | `arena/01a0853d-iips-production-market-data` |
| **Baseline commit** | `4b37e5b3fec81e06464a91ea524808d28c21acdf` |
| **File count** | 147 |
| **Source identity** | `@iips/v3-frontend` v0.1.0 |
| **Authority** | Program Authority (Sai / Ramki) |
| **Date** | 2026-09-14 |

---

## Explicit Statements

### This is provenance establishment ONLY

This act:
- ✅ Designates frontend/ as the authoritative current IIPS UI source
- ✅ Tracks frontend/ under Git control for durable provenance
- ✅ Establishes an immutable baseline commit
- ✅ Records the designation in a durable authority record

### This does NOT authorize

- ⛔ UI implementation or modification
- ⛔ UI certification
- ⛔ Windows UI verification
- ⛔ E13-10 closure (separate evaluation required)
- ⛔ EB14-3 closure (separate evaluation required)
- ⛔ Production activation
- ⛔ Any change to P00-P16 authority records

### UI implementation authority: NOT GRANTED
### UI certification authority: NOT GRANTED

---

## E13-10 / EB14-3 Post-Provenance Assessment (READ-ONLY)

After provenance establishment, the following conditions are assessed
but NOT closed:

**E13-10 prerequisites:**
- ✅ Authoritative UI source designated (frontend/)
- ✅ Git provenance established (tracked in this commit)
- ✅ Immutable baseline/version established (this commit)
- ✅ Relationship to governed P13 UI surfaces established (14 features → 19 surfaces)

**EB14-3 prerequisites:**
- ✅ Authoritative UI source designated (frontend/)
- ✅ P14 validation/oracle relationship established (P14 modules validate against frontend/ surfaces)

**Status:** Prerequisites appear satisfied, but closure requires a
separate explicit authority act. E13-10 and EB14-3 remain OPEN pending
that act.

---

## P13/P14/P15/P16 Safety

- P13: ACCEPTED (unchanged)
- P14: ACCEPTED (unchanged)
- P15: ACCEPTED AT A3 GATE; Certification = NONE (unchanged)
- P16: CERTIFIED / CLOSED (unchanged)

---

**Next Action:** Separate authority act to evaluate and close E13-10 / EB14-3
