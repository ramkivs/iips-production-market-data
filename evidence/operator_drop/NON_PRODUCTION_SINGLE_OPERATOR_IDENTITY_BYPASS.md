# Institutional Investment Platform System (IIPS)
## Governance Record: NON_PRODUCTION_SINGLE_OPERATOR_IDENTITY_BYPASS
### Architectural Authority, Safety Invariants & Operator Qualification Charter (Block 3M-A)

**Document Identifier:** `GOV-REC-2026-NON-PROD-OPERATOR-BYPASS-01`  
**Governing Charters:** `AD-01` through `AD-18`, `AD-CHARTER-2026-01`, `BI-03-AUTH`, `BI-04-AUTH`, `BI-05-AUTH`, `BI-07-AUTH`  
**Authority Disposition:** **PROGRAM AUTHORITY AUTHORIZED (NON-PRODUCTION SINGLE OPERATOR)**  
**Effective Date:** 2026-09-22  
**Repository Branch:** `arena/01a0b8e8-iips-production-market-data`  

---

### 1. Executive Summary & Context

Under Workstream BI-07 and Block 3L, comprehensive auditing confirmed that the Tier-2 Security Master broad universe (`D05`) correctly hydrates and deterministically resolves 2,250 canonical entities (52 real Indian equities + 2,198 synthetic broad-universe securities), including SteerCo-mandated dual BSE scrips for `AIIL` (`543599` / `600003`) and the governed `AGI GREENPAC` alias (`AGI`).

However, during offline single-operator visual acceptance testing of live broker statements (e.g. Zerodha Kite, Dhan Web UI, Dhan Detailed, Groww), real-world retail holdings frequently include securities outside the D05 broad universe (e.g., `ASK AUTOMOTIVE`, `AMBUJACEM`, `HCLTECH`, `M&M`, `ZOMATO`, `PAYTM`, `SUZLON`, `YESBANK`, `IDEA`, `IRFC`, `RVNL`). Under production governance, these unmapped securities fail closed at Stage 4 (NORMALIZE & IDENTITY RESOLUTION), preventing the operator from visually inspecting the end-to-end portfolio UI in offline mode.

To unblock single-operator non-production UI qualification without corrupting the canonical P04 Security Master, Program Authority has authorized **Block 3M-A: Non-Production Single-Operator Identity Bypass**.

---

### 2. Core Governance Invariants & Production Boundaries

The Non-Production Single-Operator Identity Bypass operates strictly within non-production boundaries under the following architectural invariants:

1. **Zero Fabrication Policy (Criterion A):**
   - No fake or synthetic `companyId` values are fabricated for unmapped securities.
   - Unresolved holdings are explicitly tagged with `companyId = ""` (empty string), `identityStatus = "UNRESOLVED"`, and `resolutionDisposition = "NON_PRODUCTION_OPERATOR_BYPASS"`.
2. **Preservation of Broker Identity & Provenance (Criteria B & C):**
   - Original broker metadata (`symbol`, `isin`, `exchange`, quantity, average buy price, current price, market value) are fully preserved without distortion.
   - Cryptographic lineage digests (`computeLineageHash`) and SHA-256 payload digests are computed and maintained across ingress, preview, and store persistence.
3. **Strict Production Boundary (Criterion D):**
   - Live Providers = 0. Commercial provider activation = PROHIBITED. Production authorization = NOT GRANTED.
   - The bypass is strictly gated on non-production execution context (`executionEnvironment: 'NON_PRODUCTION'` and `allowNonProductionBypass === true`).
   - If `executionEnvironment === 'PRODUCTION'` or bypass is disabled, the system strictly enforces fail-closed rejection with `IdentityAmbiguityError` quarantine.
4. **Governed Multi-Broker Atomic Merge (Criteria E, F & G):**
   - Multi-broker atomic consolidation seamlessly aggregates both canonical mapped holdings and unmapped bypass holdings.
   - Where identical unmapped holdings appear across multiple broker statements, position quantities and cost basis are aggregated with volume-weighted average buy price derivation.
   - Portfolio allocation weights are calculated only after the full canonical merged vector exists, guaranteeing exact `100.0000%` normalization across all constituents.
5. **UI Visual Parity & Operator Transparency (Criterion K):**
   - The UI preview modal and portfolio workspace clearly display amber warning badges and `UNRESOLVED (Bypass)` status indicators for unmapped securities.
   - All save guards strictly validate holding quantities, positive prices, and non-empty records while permitting authorized bypass holdings in non-production.

---

### 3. Component Modifications Matrix

| Module Path | Modification Summary | Safety Boundary Preserved |
| :--- | :--- | :--- |
| `frontend/src/features/portfolio/import/types.ts` | Added `identityStatus`, `resolutionDisposition`, `allowNonProductionBypass`, and `executionEnvironment` contracts. | Backward compatible with existing P04/P12 types. |
| `frontend/src/features/portfolio/import/broker-holdings-mapper.ts` | Retains unmapped securities as `UNRESOLVED` with empty `companyId` when bypass authorized; preserves fail-closed behavior for production. | Zero fake `companyId` fabrication. |
| `frontend/src/features/portfolio/import/broker-import-ingress.ts` | Gated bypass execution on `executionEnvironment === 'NON_PRODUCTION'`; enforces quarantine in production. | Strict production boundary preservation. |
| `frontend/src/features/portfolio/portfolio-store.ts` | Updated Save Guard 2 and multi-broker atomic consolidation map to accept and merge unresolved bypass holdings. | Volume-weighted averaging and exact 100.0000% weight sum preserved. |
| `frontend/src/features/portfolio/import/ui-broker-import-view-model.ts` | Surfaced `identityResolutionStatus = 'NON_PRODUCTION_OPERATOR_BYPASS_ACTIVE'` and updated save guard qualification. | WCAG 2.1 AA accessible and responsive. |
| `frontend/src/features/portfolio/BrokerImportModal.tsx` | Added amber operator status banner and `UNRESOLVED (Bypass)` badge rendering in preview table. | Responsive pinned columns & sticky header. |
| `frontend/src/features/portfolio/PortfolioWorkspace.tsx` | Added `UNRESOLVED` badge rendering in constituent table for bypass holdings. | Preserves table layout and lineage display. |
| `tests/non_production_operator_identity_bypass.test.ts` | Authoritative 7-subtest test suite verifying acceptance criteria A through K. | 100% pass rate across all suites. |

---

### 4. Verification & Qualification Results

The full regression test suite was executed across all unit, integration, and host test suites:

- **Total Test Suites:** 38 suites
- **Total Tests Executed:** 350 tests
- **Tests Passing:** 350 / 350 (100.0%)
- **Tests Failing:** 0
- **TypeScript Build (`tsc && vite build`):** Clean exit code 0, 0 compilation errors.

### 5. Qualification Disposition & Next Steps

- **Program Authority Status:** **AUTHORIZED & IMPLEMENTED**
- **Non-Production Visual Acceptance Status:** **READY FOR OPERATOR VERIFICATION**
- **Windows Host Safety Notice:** The dirty workspace at `G:\IIPS-Production-Market-Data-UI-VERIFY` remains untouched. Operator will pull the verified commit SHA on Windows and verify visual rendering in browser.
