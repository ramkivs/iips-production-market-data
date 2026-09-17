# IIPS D115-STAGE1: GROUP 2 VALUATION SCAFFOLD
## FORENSIC ACCEPTANCE & DURABILITY RECONCILIATION REPORT

**Document Reference:** `docs/D115_STAGE1_GROUP2_VALUATION_SCAFFOLD_ACCEPTANCE_AND_DURABILITY_RECONCILIATION.md`  
**Governing Authority Directive:** Program Authority Adjudication Record (`docs/D115_GROUP2_INSURANCE_CAPITAL_MARKETS_ADJUDICATION.md`)  
**Adjudicated Directives Reconciled:**  
$$\text{Q-GRP2-01 = E}, \quad \text{Q-GRP2-02 = C}, \quad \text{Q-GRP2-03 = A}, \quad \text{Q-GRP2-04 = D}, \quad \text{Q-GRP2-05 = A},$$
$$\text{Q-GRP2-06 = C}, \quad \text{Q-GRP2-07 = A}, \quad \text{Q-GRP2-08 = A}, \quad \text{Q-GRP2-09 = A}, \quad \text{Q-GRP2-10 = B},$$
$$\text{Q-GRP2-11 = D}, \quad \text{Q-GRP2-12 = C}, \quad \text{Q-GRP2-13 = A}, \quad \text{Q-GRP2-14 = A}, \quad \text{Q-GRP2-15 = A}, \quad \text{Q-GRP2-16 = A}$$  
**Audit Scope:** Stage 1 Group 2 Valuation Scaffolds (Life Insurance & Capital Markets) — Strictly Read-Only Forensic Audit  
**Verified Commit HEAD:** `d0c83f2a6729920adc933611bceb7df51fc29f08`  
**Branch:** `arena/01a0a438-iips-production-market-data` (100% remote parity with `origin`)  

---

## 1. Executive Summary & Acceptance Statement

Under the governing Program Authority directives for Group 2 Valuation Calibration, a strictly read-only forensic audit and reconciliation of the completed **Stage 1 Group 2 Valuation Scaffolds** was conducted against commit `d0c83f2`.

### Final Classification:

$$\mathbf{A \quad \text{—} \quad \text{ACCEPTED / COMPLETE / FROZEN}}$$

### Formal Authority Statement:
> **"D115 Stage 1 Group 2 valuation scaffolds are accepted, complete, and frozen. Numerical calibration remains a separate Stage 2 authority/implementation gate, and Insurance/Capital Markets remain runner-blocked."**

All acceptance criteria established under milestone **D115-STAGE1** have been verified in full:
1. **Life Insurance P/EV Scaffold:** Evaluates raw Price-to-Embedded Value ($\text{EVPS} = \text{embeddedValue} / \text{sharesOutstanding}$, $\text{P/EV} = \text{eodClosePrice} / \text{EVPS}$) using existing `IM-006` embedded value.
2. **Solvency & Distressed Guards:** Solvency Ratio $< 1.50$ (IRDAI statutory minimum) and $\text{Embedded Value} \le 0$ fail closed with `status: 'UNAVAILABLE'`.
3. **Non-Life Exclusion:** Non-Life Insurance (General, Health, Reinsurance) fails closed with `status: 'BLOCKED_UNCALIBRATED'`.
4. **Capital Markets Segmentation:** AMCs evaluate Market Cap / AUM Ratio ($\%$); Non-AMCs evaluate Price-to-Earnings (P/E). Zero cross-methodology fallback exists.
5. **Distressed AUM / Earnings Guards:** Non-positive AUM ($\le 0$) or non-positive EPS ($\le 0$) fail closed with `status: 'UNAVAILABLE'`.
6. **Exceptional Event Guards:** Both sectors abort evaluation and fail closed with `UNAVAILABLE` when `exceptionalEventFlag === true`.
7. **Strict Calibration-Neutral Boundary:** For all valid raw calculations, the synthesizer emits `status: 'CALIBRATION_PENDING'` and `valuationScore: null`. Zero numerical scoring bands or thresholds were created.
8. **Dynamic Engine Runner Safety Gate:** `DynamicEngineRunner.ts` was deliberately **NOT modified**. `Insurance` and `Capital Markets` remain strictly blocked (`SECTOR_UNSUPPORTED`).
9. **ADR-01 & Baseline Invariance:** `InsuranceScoreEngine.ts`, `CapitalMarketsScoreEngine.ts`, `BankingScoreEngine.ts`, all 13 sector golden reference fixtures, and certified SNAPSHOT execution paths remain 100% byte-identical.
10. **Full Regression Floor Verified:** 162 automated tests pass deterministically (101 D112/D113/D115 + 61 D114).

---

## 2. Authority-to-Code Reconciliation

Every ratified directive from `docs/D115_GROUP2_INSURANCE_CAPITAL_MARKETS_ADJUDICATION.md` was inspected against the runtime code:

```
┌──────────────┬────────────────────────────────────────┬──────────────────────┬─────────────────────────────┐
│ Question     │ Governance Subject                     │ Ratified Decision    │ Code Conformance Status     │
├──────────────┼────────────────────────────────────────┼──────────────────────┼─────────────────────────────┤
│ Q-GRP2-01    │ Insurance Valuation Methodology        │ E — Life Only (P/EV) │ VERIFIED & CONFORMANT       │
│ Q-GRP2-02    │ Insurance Population Scope             │ C — Life Only        │ VERIFIED & CONFORMANT       │
│ Q-GRP2-03    │ Embedded Value Definition              │ A — Existing IM-006  │ VERIFIED & CONFORMANT       │
│ Q-GRP2-04    │ Non-Life Valuation Input               │ D — Exclude Non-Life │ VERIFIED & CONFORMANT       │
│ Q-GRP2-05    │ Insurance Solvency Guard               │ A — Solvency < 1.50  │ VERIFIED & CONFORMANT       │
│ Q-GRP2-06    │ Capital Markets Population             │ C — AMC vs. Non-AMC  │ VERIFIED & CONFORMANT       │
│ Q-GRP2-07    │ AMC Valuation Methodology              │ A — MCap / AUM (%)   │ VERIFIED & CONFORMANT       │
│ Q-GRP2-08    │ Brokerage / Exchange Valuation         │ A — P/E Multiple     │ VERIFIED & CONFORMANT       │
│ Q-GRP2-09    │ Capital Markets Calibration Method     │ A — Static Policy    │ VERIFIED (Stage 2 Boundary) │
│ Q-GRP2-10    │ Calibration Population                 │ B — Separate Segments│ VERIFIED (Stage 2 Boundary) │
│ Q-GRP2-11    │ Observation Window Baseline            │ D — N/A for Static   │ VERIFIED & CONFORMANT       │
│ Q-GRP2-12    │ Numerical Calibration Thresholds       │ C — Defer Thresholds │ VERIFIED (Score is null)    │
│ Q-GRP2-13    │ Exceptional Events Treatment           │ A — Exclude Events   │ VERIFIED & CONFORMANT       │
│ Q-GRP2-14    │ Versioning & Re-Calibration Cadence    │ A — Immutable 1.0.0  │ VERIFIED (Stage 2 Boundary) │
│ Q-GRP2-15    │ Dynamic Engine Runner Unlock Gate      │ A — Remain Blocked   │ VERIFIED (Runner blocked)   │
│ Q-GRP2-16    │ Production Eligibility Boundary        │ A — Dev Harness Only │ VERIFIED & CONFORMANT       │
└──────────────┴────────────────────────────────────────┴──────────────────────┴─────────────────────────────┘
```

---

## 3. Insurance Technical Verification

A code-level AST inspection of `synthesizeInsuranceScaffold()` in `frontend/server/valuation/eod-valuation-synthesizer.ts` confirmed:
1. **Scope Restriction:** Lines 427–436 explicitly enforce `category === 'Life' || category === 'Life Insurance'`. Any non-life category immediately returns `status: 'BLOCKED_UNCALIBRATED'`, `valuationScore: null`.
2. **Embedded Value Contract:** Lines 483–509 read `f.embeddedValue` directly. Missing EV returns `status: 'UNAVAILABLE'`; EV $\le 0$ returns `status: 'UNAVAILABLE'`, `reason: 'NON_POSITIVE_EMBEDDED_VALUE'`.
3. **EVPS & Multiple Derivation:**
   $$\text{EVPS} = \frac{\text{f.embeddedValue}}{\text{f.sharesOutstanding}}, \quad \text{P/EV} = \frac{\text{input.eodClosePrice}}{\text{EVPS}}$$
   Both rounded deterministically (`multipleType: 'P/EV'`).
4. **Solvency Guard:** Lines 470–481 check `f.solvencyRatio`. If $< 1.50$ (or non-finite), immediately fails closed with `status: 'UNAVAILABLE'`, `reason: 'SOLVENCY_BELOW_REGULATORY_MINIMUM'`.
5. **Exceptional Events:** Lines 438–447 fail closed with `status: 'UNAVAILABLE'` if `f.exceptionalEventFlag === true`.
6. **Calibration Boundary:** Unconditionally returns `status: 'CALIBRATION_PENDING'`, `valuationScore: null`.

---

## 4. Capital Markets Technical Verification

A code-level AST inspection of `synthesizeCapitalMarketsScaffold()` in `frontend/server/valuation/eod-valuation-synthesizer.ts` confirmed:
1. **Segmentation:** Line 587 reads `category = f.capitalMarketsCategory ?? 'NON-AMC'`.
2. **AMC Evaluation:**
   - Lines 590–634 execute AMC logic when `category === 'AMC' || category === 'Asset Management'`.
   - Requires finite positive `f.totalAum`. Missing or $\le 0$ fails closed with `status: 'UNAVAILABLE'`.
   - Computes:
     $$\text{Market Cap} = \text{eodClosePrice} \times \text{sharesOutstanding}$$
     $$\text{Market Cap / AUM (\%)} = \left(\frac{\text{Market Cap}}{\text{f.totalAum}}\right) \times 100$$
   - Returns `status: 'CALIBRATION_PENDING'`, `valuationScore: null`, `multipleType: 'Market Cap / AUM (%)'`.
3. **Non-AMC Evaluation:**
   - Lines 636–667 execute Non-AMC logic (Brokers, Exchanges, MIIs, Wealth Managers).
   - Evaluates $\text{P/E} = \text{eodClosePrice} / \text{f.ltmEps}$ (or $\text{Market Cap} / \text{ltmNetIncome}$).
   - Missing or non-positive earnings fails closed with `status: 'UNAVAILABLE'`.
   - Returns `status: 'CALIBRATION_PENDING'`, `valuationScore: null`, `multipleType: 'P/E'`.
4. **No Cross-Fallback:** Test 4.1 in `group2-valuation-scaffold.test.ts` proves that providing EPS to an AMC payload does not trigger P/E, and providing AUM to a Non-AMC payload does not trigger Market Cap / AUM.
5. **Exceptional Events:** Lines 544–553 fail closed with `status: 'UNAVAILABLE'` if `f.exceptionalEventFlag === true`.

---

## 5. Calibration Boundary Verification

An exhaustive string and AST search was conducted across `frontend/server/valuation/` for unauthorized calibration logic:
- **Zero Numerical Scoring Bands:** No comparison trees (e.g. `if (pev < 2.0) return 90`) exist for Insurance or Capital Markets.
- **Zero Hidden Scoring Thresholds:** No provisional or fallback constants were assigned.
- **Zero Percentile Logic:** No empirical rolling distributions or statistical calculators were introduced.
- **Score Is Unconditionally Null:** `valuationScore` is strictly `null` in both scaffolds.
- **Stage 2 Deferred:** Numerical threshold codification remains deferred to a subsequent formal Stage 2 charter per `Q-GRP2-12 = C`.

---

## 6. Versioning & Provenance Verification

- **Provenance DTO:**
  ```typescript
  provenance: {
    dataMode: 'LIVE',
    freshness: 'DEVELOPMENT_MIXED_VINTAGE',
    fundamentalsVintage: 'v1.1-reference',
    transportSemantics: 'Development test harness; fundamental denominators held static'
  }
  ```
- **Profile Assets:** In accordance with `Q-GRP2-14`, versioned calibration profile assets (`insurance-valuation-calibration-1.0.0.json` and `capital-markets-valuation-calibration-1.0.0.json`) will be authored exclusively in Stage 2 upon Program Authority ratification of numerical bands. No unauthorized stub profile files exist.

---

## 7. Dynamic Engine Runner Gate Verification

Inspection of `frontend/server/dynamic-runner/dynamic-engine-runner.ts` confirmed:
```typescript
// Line 114:
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
- **Finding:** `Insurance` and `Capital Markets` remain strictly blocked.
- **Isolation:** Stage 1 scaffolds in `EodValuationSynthesizer.ts` are **completely unreachable** from `DynamicEngineRunner.execute()`.
- **Zero UI Exposure:** LIVE Decision Matrix, Screener, and Executive DTOs continue to report Insurance and Capital Markets as `SECTOR_UNSUPPORTED` with `composite: null`.

---

## 8. Certified ADR-01 & SNAPSHOT Invariance

A diff against the historical pre-D113 baseline (`8948723`) confirmed:
```bash
git diff 8948723..d0c83f2 iips-platform/src/sector-engines/insurance/ \
  iips-platform/src/sector-engines/capital-markets/ \
  iips-platform/src/sector-engines/banking/
```
- **Finding:** Output is **completely empty** (0 lines changed).
- `InsuranceScoreEngine.ts` and `CapitalMarketsScoreEngine.ts` composite scoring, weights, and golden reference fixtures are **100% byte-identical**.
- `computeCertifiedExecutive` and `computeCertifiedDecisionMatrix` remain untouched.
- SNAPSHOT execution plane remains completely isolated.

---

## 9. Baseline Preservation (D112 / D113 / D114)

- **D112-A Security Master:** Bidirectional ISO 6166 resolution intact (11/11 tests pass).
- **D112-B Reference Denominators:** Development denominators pattern intact.
- **D112-C Valuation Framework:** Multi-sector valuation synthesizer intact (18/18 tests pass).
- **D112-D Dynamic Engine Runner:** Fail-closed blocked sectors intact (11/11 tests pass).
- **D112-E Dynamic Transport Dispatcher:** LIVE REST routing intact (14/14 tests pass).
- **D113 Stage 1 & 2 Banking Calibration:** Banking P/ABV calibration intact (12/12 scaffold + 15/15 calibration tests pass).
- **D113-QCAL09 Banking Runner Unlock:** Operational dynamic execution for HDFCBANK intact.
- **D114 Historical Batch Ingestion:** Batch ingestion harness intact (61/61 tests pass).

---

## 10. Five-Sector Standing Isolation Matrix

$$\begin{aligned}
\mathbf{Banking:} & \quad \mathbf{UNLOCKED} \quad (\text{Operational LIVE dynamic evaluation, D113-QCAL09}) \\
\mathbf{Insurance:} & \quad \mathbf{STRICTLY \quad BLOCKED} \quad (\text{SECTOR\_UNSUPPORTED, Stage 1 scaffold internal}) \\
\mathbf{Capital \quad Markets:} & \quad \mathbf{STRICTLY \quad BLOCKED} \quad (\text{SECTOR\_UNSUPPORTED, Stage 1 scaffold internal}) \\
\mathbf{Healthcare:} & \quad \mathbf{STRICTLY \quad BLOCKED} \quad (\text{SECTOR\_UNSUPPORTED, Decision C2 unresolved}) \\
\mathbf{Hospitality:} & \quad \mathbf{STRICTLY \quad BLOCKED} \quad (\text{SECTOR\_UNSUPPORTED, Decision C2 unresolved})
\end{aligned}$$

---

## 11. Test Execution & Regression Floor

The complete automated test suite was executed in the workspace:

```
Test Group 1: D112 / D113 / D115 Invariant Suites (Node Test Runner)
=====================================================================
- D115-STAGE1 Group 2 Scaffold Verification Suite:     20 / 20 PASSED
- D112-D Dynamic Engine Runner Invariant Suite:        11 / 11 PASSED
- D112-E Dynamic Transport Dual-Plane Invariant Suite: 14 / 14 PASSED
- D112-A Security Master Verification Suite:           11 / 11 PASSED
- D113-STAGE2 Banking P/ABV Calibration Suite:         15 / 15 PASSED
- D113-STAGE1 Banking Valuation Scaffold Suite:        12 / 12 PASSED
- D112-C EOD Valuation Synthesizer Suite:              18 / 18 PASSED
Subtotal:                                             101 / 101 PASSED (100%)

Test Group 2: D114 Historical Bhavcopy Batch Ingestion Suites (Vitest)
=====================================================================
- CM-UDiFF Parser Suite:                                8 /  8 PASSED
- NSE SFTP Adapter Suite:                              11 / 11 PASSED
- Dhan Data API Adapter Suite:                         11 / 11 PASSED
- Operator Drop Ingestion Suite:                       11 / 11 PASSED
- Batch Ingestion Harness Suite:                       12 / 12 PASSED
- Ingestion Pipeline Verification Suite:                8 /  8 PASSED
Subtotal:                                              61 / 61 PASSED (100%)

TOTAL WORKSPACE AUTOMATED TESTS:                      162 / 162 PASSED (100%)
```

---

## 12. Security, Persistence & Provider Audit

- **Zero Persistence Changes:** In-memory execution only. Zero new tables, schemas, or disk persistence mechanisms introduced.
- **Zero External Network Egress:** Zero calls to external APIs, zero scraping, zero Dhan API calls, zero SFTP connections.
- **Zero Credentials:** No API tokens or credentials added or stored.
- **Production Boundary Maintained:** Scaffolds are explicitly bounded to the development harness under Decision E1.

---

## 13. Git Durability & Remote Parity

- **Starting Commit HEAD:** `7bf8730bb3fa072d6896245d8205cb3677761005`
- **Current Implementation Commit HEAD:** `d0c83f2a6729920adc933611bceb7df51fc29f08`
- **Commit Subject:** `feat(valuation): implement D115 Stage 1 Group 2 valuation scaffolds (Life Insurance & Capital Markets)`
- **Working Tree State:** Completely clean (`nothing to commit, working tree clean`).
- **Remote Parity:** Up-to-date with `origin/arena/01a0a438-iips-production-market-data` (0 ahead, 0 behind).
- **Zero Unrelated Changes:** Modifications strictly confined to `valuation-contract.ts`, `eod-valuation-synthesizer.ts`, `group2-valuation-scaffold.test.ts`, and governance documentation.

---

**D115-STAGE1 FORENSIC RECONCILIATION COMPLETE. ASSIGNED CLASSIFICATION A. STOPPING PRIOR TO STAGE 2.**
