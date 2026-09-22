# Institutional Investment Platform System (IIPS)
## Formal Gate Report: GATE-WINDOWS-OPERATOR-VISUAL-EVIDENCE-INTAKE
### Windows Visual Acceptance Evidence Intake & Provenance Gap Reconciliation

**Gate Identifier:** `GATE-WINDOWS-OPERATOR-VISUAL-EVIDENCE-INTAKE`  
**Governing Baseline Commit SHA:** `c2aeb5ff821da26ebc9aa8840269bdeba101f8b7`  
**Evaluation Mode:** `NON_PRODUCTION / OFFLINE_FIXTURE`  
**Gate Disposition:** **ACCEPTED**  
**Date:** 2026-09-22  

---

### 1. Forensic Intake & Metric Reconciliation

The operator visual acceptance on the Windows workstation host was evaluated against the certified baseline `c2aeb5ff821da26ebc9aa8840269bdeba101f8b7`. All observable UI metrics match the governed non-production multi-broker merge contract:

| Metric / Dimension | Expected Governance Contract | Observed Operator Visual Result | Status |
| :--- | :--- | :--- | :--- |
| **Execution Environment** | `NON_PRODUCTION / OFFLINE_FIXTURE` | `NON_PRODUCTION / OFFLINE_FIXTURE` | **PASS** |
| **Total Constituents** | 148 holdings (Zerodha + Dhan merge) | 148 holdings | **PASS** |
| **Total Portfolio Value** | ₹9,82,769.63 INR | ₹9,82,769.63 INR | **PASS** |
| **Weight Sum Invariant** | Exact 100.0000% | Exact 100.0000% | **PASS** |
| **Persistence Status** | `COMMITTED (Atomic)` | `COMMITTED (Atomic)` | **PASS** |
| **Canonical `AIIL` Identity** | `EQ_AIIL_IN` (Dual BSE: `543989` / `539177`) | Resolved to `EQ_AIIL_IN` | **PASS** |
| **Canonical `AGI` Identity** | `EQ_AGI_IN` (`AGI GREENPAC` alias) | Resolved to `EQ_AGI_IN` | **PASS** |
| **Unmapped `AMBUJACEM`** | `UNRESOLVED` (`companyId = ""`) | Retained as `UNRESOLVED` (Amber Badge) | **PASS** |
| **Unmapped `ASK AUTOMOTIVE`** | `UNRESOLVED` (`companyId = ""`) | Retained as `UNRESOLVED` (Amber Badge) | **PASS** |
| **Fabricated Company IDs** | Strictly 0 | 0 fabricated company IDs | **PASS** |

---

### 2. Provenance Digest Evidence-Gap Declaration

- **Observed Visual DOM String:** `92d6c6f177cf1364af3f...`
- **UI Component Contract (`PortfolioWorkspace.tsx` line 191):** Truncates 64-character SHA-256 digest to 20 characters (`${digest.slice(0, 20)}...`) for responsive display.
- **Evidence-Gap Classification:** `FULL_SHA256_PROVENANCE_DIGEST_TRUNCATED_IN_UI_VIEWPORT_DOM`
- **Governance Finding:** In accordance with anti-fabrication rules (AD-02 / AD-17), the operator visual acceptance gate records the exact 20-character displayed prefix (`92d6c6f177cf1364af3f...`) and formally notes that full 64-character cryptographic verification is established via automated unit/integration tests rather than inferred from DOM text.

---

### 3. Verification & Durability Signoff

- **Automated Regression Suite:** 350 / 350 tests passing across 38 suites.
- **TypeScript & Vite Production Build:** Clean exit code 0.
- **Gate Disposition:** **ACCEPTED**
