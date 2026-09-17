# IIPS D115-STAGE2: GROUP 2 (LIFE INSURANCE & CAPITAL MARKETS) NUMERICAL CALIBRATION
## FORENSIC ACCEPTANCE AND DURABILITY RECONCILIATION REPORT

**Document Reference:** `docs/D115_STAGE2_GROUP2_CALIBRATION_ACCEPTANCE_AND_DURABILITY_RECONCILIATION.md`  
**Governing Authority:** Program Authority (Sai / Ramki)  
**Adjudication Directive Reference:** `docs/D115_STAGE2_GROUP2_CALIBRATION_ADJUDICATION.md`  
**Implementation Record Reference:** `docs/D115_STAGE2_GROUP2_CALIBRATION_IMPLEMENTATION.md`  
**Baseline Implementation Commit:** `ea12129f69ace067ff888a1ada58335adcc1780a`  
**Branch:** `arena/01a0a438-iips-production-market-data`  
**Audit Date:** 2026-09-17  
**Audit Mode:** **STRICTLY READ-ONLY FORENSIC RECONCILIATION**  

---

## 1. Executive Forensic Summary & Milestone Classification

A strictly read-only forensic acceptance and durability audit of the completed **D115 Stage 2 Numerical Calibration** was conducted across code repositories, versioned calibration profiles, test suites, dynamic runner safety gates, ADR-01 score engine boundaries, and git history.

### Milestone Classification Awarded:

$$\mathbf{A \quad \text{—} \quad \text{ACCEPTED / COMPLETE / FROZEN}}$$

### Formal Authority Reconciliation Affirmation:
> **"D115 Stage 2 Group 2 numerical calibration (Life Insurance P/EV, Capital Markets AMC Market Cap / AUM %, and Non-AMC P/E) is formally accepted, complete, and frozen. Operational runner unlocking remains blocked under a separate Stage 3 operational gate per Q-GRP2-CAL-10, and Healthcare/Hospitality remain strictly blocked under Decision C2."**

---

## 2. Comprehensive Adjudication-to-Code Reconciliation (Q-GRP2-CAL-01..10)

Every ratified determination recorded in `docs/D115_STAGE2_GROUP2_CALIBRATION_ADJUDICATION.md` was forensically verified against the commit baseline `ea12129`:

```
┌──────────────────┬─────────────────────────────────────────────────┬──────────────────────┬──────────────────────────────────┐
│ Question Code    │ Governance Directive                            │ Ratified Decision    │ Code Forensic Audit Status       │
├──────────────────┼─────────────────────────────────────────────────┼──────────────────────┼──────────────────────────────────┤
│ Q-GRP2-CAL-01    │ Calibration Methodology                         │ A — Static Policy    │ VERIFIED (Static JSON Profiles)  │
│ Q-GRP2-CAL-02    │ Life Insurance Population Scope                 │ A — Unified Life Pop │ VERIFIED (Life/Life Insurance)   │
│ Q-GRP2-CAL-03    │ Capital Markets Segmentation                    │ A — AMC vs. Non-AMC  │ VERIFIED (Strict Isolation)      │
│ Q-GRP2-CAL-04    │ Exact Numerical Scoring Bands                   │ A — Exact Bands Now  │ VERIFIED (Bit-for-Bit Matching)  │
│ Q-GRP2-CAL-05    │ Exceptional Events Treatment                    │ A — Fail Closed      │ VERIFIED (Status: UNAVAILABLE)   │
│ Q-GRP2-CAL-06    │ Distressed / Invalid Inputs                     │ A — Fail Closed      │ VERIFIED (EV<=0, AUM<=0, EPS<=0) │
│ Q-GRP2-CAL-07    │ Immutable Versioned JSON Profiles               │ A — Version 1.0.0    │ VERIFIED (Immutable Profiles)    │
│ Q-GRP2-CAL-08    │ Recalibration Cadence                           │ A — Annual Review    │ VERIFIED (Zero Runtime Drift)    │
│ Q-GRP2-CAL-09    │ Production Eligibility Boundary                 │ A — Dev / Reference  │ VERIFIED (Mixed Vintage Stamp)   │
│ Q-GRP2-CAL-10    │ Dynamic Engine Runner Unlock Gate               │ A — Runner Blocked   │ VERIFIED (SECTOR_UNSUPPORTED)    │
└──────────────────┴─────────────────────────────────────────────────┴──────────────────────┴──────────────────────────────────┘
```

---

## 3. Detailed Audit of Numerical Calibration Bands (Q-GRP2-CAL-04)

### 3.1 Life Insurance — Price-to-Embedded Value (P/EV)
Codified in `frontend/server/valuation/calibration/insurance-valuation-calibration-1.0.0.json` under metric code `IM-VAL-001`:
- $\text{P/EV} < 1.800 \longrightarrow \text{Score: } \mathbf{90.0}$ (Verified by test `1.1` at 1.799)
- $1.800 \le \text{P/EV} < 2.400 \longrightarrow \text{Score: } \mathbf{75.0}$ (Verified by tests `1.2` at 1.800 and `1.3` at 2.399)
- $2.400 \le \text{P/EV} < 3.200 \longrightarrow \text{Score: } \mathbf{60.0}$ (Verified by tests `1.4` at 2.400 and `1.5` at 3.199)
- $3.200 \le \text{P/EV} < 4.000 \longrightarrow \text{Score: } \mathbf{45.0}$ (Verified by tests `1.6` at 3.200 and `1.7` at 3.999)
- $\text{P/EV} \ge 4.000 \longrightarrow \text{Score: } \mathbf{20.0}$ (Verified by tests `1.8` at 4.000 and `1.9` at 5.500)

### 3.2 Capital Markets AMC — Market Cap / AUM Ratio (%)
Codified in `frontend/server/valuation/calibration/capital-markets-valuation-calibration-1.0.0.json` under metric code `CM-VAL-001`:
- $\text{MCap / AUM} < 6.000\% \longrightarrow \text{Score: } \mathbf{90.0}$ (Verified by test `2.1` at 5.990%)
- $6.000\% \le \text{MCap / AUM} < 9.000\% \longrightarrow \text{Score: } \mathbf{75.0}$ (Verified by tests `2.2` at 6.000% and `2.3` at 8.990%)
- $9.000\% \le \text{MCap / AUM} < 13.000\% \longrightarrow \text{Score: } \mathbf{60.0}$ (Verified by tests `2.4` at 9.000% and `2.5` at 12.990%)
- $13.000\% \le \text{MCap / AUM} < 17.000\% \longrightarrow \text{Score: } \mathbf{45.0}$ (Verified by tests `2.6` at 13.000% and `2.7` at 16.990%)
- $\text{MCap / AUM} \ge 17.000\% \longrightarrow \text{Score: } \mathbf{20.0}$ (Verified by tests `2.8` at 17.000% and `2.9` at 25.000%)

### 3.3 Capital Markets Non-AMC — Price-to-Earnings (P/E)
Codified in `frontend/server/valuation/calibration/capital-markets-valuation-calibration-1.0.0.json` under metric code `CM-VAL-002`:
- $\text{P/E} < 18.000 \longrightarrow \text{Score: } \mathbf{90.0}$ (Verified by test `3.1` at 17.990)
- $18.000 \le \text{P/E} < 26.000 \longrightarrow \text{Score: } \mathbf{75.0}$ (Verified by tests `3.2` at 18.000 and `3.3` at 25.990)
- $26.000 \le \text{P/E} < 38.000 \longrightarrow \text{Score: } \mathbf{60.0}$ (Verified by tests `3.4` at 26.000 and `3.5` at 37.990)
- $38.000 \le \text{P/E} < 52.000 \longrightarrow \text{Score: } \mathbf{45.0}$ (Verified by tests `3.6` at 38.000 and `3.7` at 51.990)
- $\text{P/E} \ge 52.000 \longrightarrow \text{Score: } \mathbf{20.0}$ (Verified by tests `3.8` at 52.000 and `3.9` at 75.000)

---

## 4. Fail-Closed Boundaries & Safety Audits

1. **Life Insurance Solvency & EV Impairment:**
   - Solvency ratio $< 1.50$ (IRDAI minimum) unconditionally fails closed with `status: 'UNAVAILABLE'` (Test `4.2`).
   - Embedded Value $\le 0$ unconditionally fails closed with `status: 'UNAVAILABLE'` (Test `4.1`).
   - Non-Life Insurance categories unconditionally fail closed with `status: 'BLOCKED_UNCALIBRATED'` (`group2-valuation-scaffold.test.ts` test `1.9`).
2. **Capital Markets Denominator Safeguards:**
   - AMC Total AUM $\le 0$ unconditionally fails closed with `status: 'UNAVAILABLE'` (Test `4.3`).
   - Non-AMC EPS / Net Income $\le 0$ unconditionally fails closed with `status: 'UNAVAILABLE'` (Test `4.4`).
   - Missing denominators fail closed (Test `4.5`).
3. **Exceptional Events:**
   - `exceptionalEventFlag: true` unconditionally fails closed with `status: 'UNAVAILABLE'` across Life Insurance, AMC, and Non-AMC (Test `4.6`).
4. **Segmentation Isolation:**
   - AMC payloads containing EPS evaluate strictly Market Cap / AUM (Test `5.1`).
   - Non-AMC payloads containing Total AUM evaluate strictly P/E (Test `5.2`). Zero cross-methodology fallback.

---

## 5. Dynamic Engine Runner Gate Audit (Q-GRP2-CAL-10)

Inspection of `frontend/server/dynamic-runner/dynamic-engine-runner.ts` lines 114–118:
```typescript
const blockedSectors = ['Insurance', 'Capital Markets', 'Healthcare', 'Hospitality'];
if (blockedSectors.includes(security.sector)) {
  return {
    canonicalSecurityId: security.canonicalSecurityId,
    tickerSymbol: security.tickerSymbol,
    sector: security.sector,
    status: 'SECTOR_UNSUPPORTED',
    composite: null,
    verdict: null,
    pillars: {},
    provenance: { ...baseProvenance, executionStatus: 'SECTOR_UNSUPPORTED' },
    reason: `SECTOR_UNSUPPORTED: Sector ${security.sector} is explicitly uncalibrated/blocked from dynamic valuation synthesis`,
  };
}
```
**Forensic Findings:**
- `Insurance` remains strictly blocked (`SECTOR_UNSUPPORTED`, Test `6.1`).
- `Capital Markets` remains strictly blocked (`SECTOR_UNSUPPORTED`, Test `6.2`).
- `Healthcare` and `Hospitality` remain strictly blocked (`SECTOR_UNSUPPORTED`, Test `6.3`).
- `Banking` dynamic execution remains operational per **D113-QCAL09** (Test `6.4`).
- **Operational runner unlock is NOT authorized by Stage 2.**

---

## 6. ADR-01 Engine & Snapshot Invariance Audit

Forensic inspection confirms:
- `iips-platform/src/sector-engines/insurance/InsuranceScoreEngine.ts`: 0 bytes diff against `da43051`.
- `iips-platform/src/sector-engines/capital-markets/CapitalMarketsScoreEngine.ts`: 0 bytes diff against `da43051`.
- `iips-platform/src/sector-engines/banking/BankingScoreEngine.ts`: 0 bytes diff against `da43051`.
- All 13 sector golden reference fixtures remain 100% byte-identical.
- Evaluated `valuationScore` remains an orthogonal axis and does not mutate certified ADR-01 composite scores.

---

## 7. Full Regression Floor Audit

```
Execution Suite Verification
========================================================================================
1. D115-STAGE2 Group 2 Calibration Suite (group2-valuation-calibration.test.ts): 39 /  39 PASSED
2. D115-STAGE1 Group 2 Scaffold Suite (group2-valuation-scaffold.test.ts):       20 /  20 PASSED
3. D113-STAGE2 Banking Calibration Suite (banking-valuation-calibration.test.ts): 15 /  15 PASSED
4. D113-STAGE1 Banking Scaffold Suite (banking-valuation-scaffold.test.ts):      12 /  12 PASSED
5. D112-D Dynamic Engine Runner Suite (dynamic-engine-runner.test.ts):           11 /  11 PASSED
6. D112-E Dynamic Transport Suite (dynamic-transport.test.ts):                   14 /  14 PASSED
7. D112-A Security Master Suite (security-master.test.ts):                       11 /  11 PASSED
8. D112-C EOD Valuation Synthesizer Suite (valuation-synthesizer.test.ts):       18 /  18 PASSED
Subtotal Invariant Suites (Node Test Runner):                                   140 / 140 PASSED (100%)

9. D114 Historical Bhavcopy Batch Ingestion Suites (Vitest):                      61 /  61 PASSED (100%)
TOTAL REGRESSION FLOOR:                                                         201 / 201 PASSED (100%)
```

---

## 8. Git Durability & Remote Parity

- **Implementation Commit:** `ea12129f69ace067ff888a1ada58335adcc1780a`
- **Reconciliation Baseline Commit:** `ea12129f69ace067ff888a1ada58335adcc1780a`
- **Working Tree State:** Completely clean (`nothing to commit, working tree clean`).
- **Remote Parity:** 100% synchronized with `origin/arena/01a0a438-iips-production-market-data`.

---

**FORENSIC ACCEPTANCE RECONCILIATION COMPLETE. COMMITTING AND PUSHING AUDIT REPORT.**
