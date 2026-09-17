# IIPS D115-STAGE3: GROUP 2 (LIFE INSURANCE & CAPITAL MARKETS) OPERATIONAL RUNNER UNLOCK
## AUTHORITY DECISION PREPARATION PACKAGE

**Document Reference:** `docs/D115_STAGE3_GROUP2_OPERATIONAL_RUNNER_UNLOCK_AUTHORITY_PREPARATION.md`  
**Governing Authority:** Program Authority (Sai / Ramki)  
**Context:** Preparation for Group 2 Stage 3 Operational Dynamic Engine Runner Unlocking Adjudication  
**Status:** **AUTHORITY PREPARATION ONLY — STRICTLY READ-ONLY (ZERO MUTATION TO IMPLEMENTATION CODE, TESTS, OR RUNNER CONFIGURATION)**  
**Authoritative Implementation Baseline:** Commit `ea12129f69ace067ff888a1ada58335adcc1780a`  
**Authoritative Acceptance Baseline:** Commit `75b133ad8202fea119e0600276d5bda4cb73a8cf`  
**Branch:** `arena/01a0a438-iips-production-market-data`  
**Remote Parity:** 100% synchronized with `origin/arena/01a0a438-iips-production-market-data`  
**Preparation Date:** 2026-09-17  

---

## 1. Purpose and Scope

Following the formal completion, acceptance, and durability reconciliation of **D115 Stage 2 Numerical Calibration** (`docs/D115_STAGE2_GROUP2_CALIBRATION_ACCEPTANCE_AND_DURABILITY_RECONCILIATION.md`, classification: $\mathbf{A}$ — ACCEPTED / COMPLETE / FROZEN), the Layer-2.5 valuation multiples for **Life Insurance** (P/EV) and **Capital Markets** (AMC Market Cap / AUM % and Non-AMC P/E) are fully codified and verified.

In strict accordance with ratified directive **Q-GRP2-CAL-10 = A** (*"Keep Insurance and Capital Markets blocked until: (1) Stage 2 calibration implementation is complete; (2) calibration tests pass; (3) acceptance reconciliation passes; (4) provenance/version checks pass; (5) regression floor remains green; (6) separate authority explicitly authorizes runner unlock"*), this document provides the formal **authority decision preparation package** required before `Insurance` and `Capital Markets` can be unblocked in `DynamicEngineRunner.ts`.

### Absolute Governance Safeguards Maintained:
1. **Zero Invented Configuration:** Engineering has not unblocked runner sectors, altered input builders, or modified transport pipelines.
2. **Strict Five-Sector Standing Isolation:**
   - **Banking:** Unlocked, calibrated, and operational per ratified **D113-QCAL09**.
   - **Insurance:** Blocked (`SECTOR_UNSUPPORTED`) in `DynamicEngineRunner.ts` (line 114).
   - **Capital Markets:** Blocked (`SECTOR_UNSUPPORTED`) in `DynamicEngineRunner.ts` (line 114).
   - **Healthcare:** Blocked (`SECTOR_UNSUPPORTED`, **Decision C2** unresolved).
   - **Hospitality:** Blocked (`SECTOR_UNSUPPORTED`, **Decision C2** unresolved).
3. **Certified ADR-01 Composite Engine Invariance:** `InsuranceScoreEngine.ts`, `CapitalMarketsScoreEngine.ts`, and `BankingScoreEngine.ts` composite scoring and golden references remain **100% byte-identical** (0 bytes diff against baseline).
4. **Technical Runner Unlock $\ne$ Production LIVE Authorization:** Live dynamic execution remains strictly development/reference harness only (`freshness: 'DEVELOPMENT_MIXED_VINTAGE'`). Unattended production execution remains blocked by **OI-FUND-01** (lack of automated corporate fundamentals feed).
5. **Strictly Read-Only:** Zero lines of implementation source code, test suites, or configuration files are modified by this preparation package.

---

## 2. Exact Current Dynamic Runner State

In `frontend/server/dynamic-runner/dynamic-engine-runner.ts` (lines 114–124):
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

### Forensic Execution Dimensions:
```
┌─────────────────────────────────┬──────────────────────┬────────────────────────────────────────────────────────┐
│ Dimension                       │ Operational Status   │ Evidence / Behavior                                    │
├─────────────────────────────────┼──────────────────────┼────────────────────────────────────────────────────────┤
│ A. Runner Eligibility           │ BLOCKED              │ Hardcoded in blockedSectors; returns SECTOR_UNSUPPORTED│
│ B. Dynamic Input Construction   │ UNWIRED              │ DynamicEngineInputBuilder lacks Insurance/CapMarkets   │
│ C. Valuation Calibration        │ READY (FROZEN)       │ Calibrated profiles loaded & passing in Synthesizer    │
│ D. Sector Engine Execution      │ READY (ADR-01)       │ Engines compile and pass golden reference checks       │
│ E. Transport DTO Availability   │ BLOCKED BY RUNNER    │ Returns null composite; prevents transport packaging   │
│ F. Provenance / Certification   │ DEVELOPMENT ONLY     │ Emits DEVELOPMENT_MIXED_VINTAGE; static denominators   │
│ G. Production Eligibility       │ BLOCKED              │ Blocked by OI-FUND-01 and OI-P16-01..06                │
└─────────────────────────────────┴──────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 3. Life Insurance Unlock Readiness Matrix

Under ratified decisions **Q-GRP2-01 = E**, **Q-GRP2-02 = C**, **Q-GRP2-03 = A**, **Q-GRP2-04 = D**, and **Q-GRP2-05 = A**:
- Scope: Life Insurance only under Price-to-Embedded Value (P/EV).
- Non-Life: Excluded (`BLOCKED_UNCALIBRATED`).
- Solvency Guard: Solvency Ratio $< 1.50 \rightarrow \text{UNAVAILABLE}$.
- EV Impairment: $\text{Embedded Value} \le 0 \rightarrow \text{UNAVAILABLE}$.
- Multiple Valuation: Evaluated via `insurance-valuation-calibration-1.0.0.json` (`IM-VAL-001`).

```
┌───────────────────────────────────────┬───────────────────────────┬────────────────────────────────────────────┐
│ Required Input / Component            │ Readiness Status          │ Implementation Requirement / Dependency    │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Security Master Mapping               │ UNPROVEN (EXCLUDED)       │ HDFCLIFE in excludedCandidateMappings;     │
│                                       │                           │ requires mapping entry in master JSON      │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ EOD Price Stream                      │ READY                     │ Ingested via CM-UDiFF bhavcopy             │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Representative Denominators           │ UNWIRED IN BUILDER        │ Needs fixed development base in builder:   │
│ (Shares, Debt, Cash, EV, Solvency)    │                           │ (e.g. HDFC Life scale: EV 45k Cr, Solv 1.8)│
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Golden Reference Fixture Base         │ READY IN PLATFORM         │ insurance-golden-reference-1.0.0.json      │
│                                       │                           │ exists in iips-platform/src/sector-engines │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Valuation Multiple Injection          │ UNWIRED IN BUILDER        │ Requires valuationInputKey = 'pEv' mapping │
│                                       │                           │ in assembleEngineInput()                   │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Calibration Profile Registration      │ UNREGISTERED IN RUNNER    │ Requires loading insurance profile into    │
│                                       │                           │ runner calibrations map                    │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Non-Life Guard in Runner              │ UNWIRED IN BUILDER        │ Must verify category === 'Life' before     │
│                                       │                           │ executing engine                           │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Authoritative Corporate Fundamentals  │ EXTERNAL DEPENDENCY       │ Blocked by OI-FUND-01 for production LIVE  │
└───────────────────────────────────────┴───────────────────────────┴────────────────────────────────────────────┘
```

---

## 4. Capital Markets Unlock Readiness Matrix

Under ratified decisions **Q-GRP2-06 = C**, **Q-GRP2-07 = A**, **Q-GRP2-08 = A**, and **Q-GRP2-10 = B**:
- Segmentation: AMC (Market Cap / AUM %) vs. Non-AMC (P/E). Zero cross-fallback.
- Multiple Valuation: Evaluated via `capital-markets-valuation-calibration-1.0.0.json` (`CM-VAL-001` & `CM-VAL-002`).

```
┌───────────────────────────────────────┬───────────────────────────┬────────────────────────────────────────────┐
│ Required Input / Component            │ Readiness Status          │ Implementation Requirement / Dependency    │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Security Master Mapping               │ UNPROVEN (EXCLUDED)       │ BSE in excludedCandidateMappings;          │
│                                       │                           │ requires mapping entries for AMC & Non-AMC │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ EOD Price Stream                      │ READY                     │ Ingested via CM-UDiFF bhavcopy             │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Representative Denominators: AMC      │ UNWIRED IN BUILDER        │ Needs fixed development base in builder:   │
│ (Shares, Debt, Cash, Total AUM)       │                           │ (e.g. HDFC AMC scale: AUM 650k Cr)         │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Representative Denominators: Non-AMC  │ UNWIRED IN BUILDER        │ Needs fixed development base in builder:   │
│ (Shares, Debt, Cash, LTM EPS)         │                           │ (e.g. BSE / Angel One scale: EPS 70 INR)   │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Golden Reference Fixture Base         │ READY IN PLATFORM         │ capital-markets-golden-reference-1.0.0.json│
│                                       │                           │ exists in iips-platform/src/sector-engines │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Valuation Multiple Injection          │ UNWIRED IN BUILDER        │ Requires valuationInputKey = 'mcapAum'     │
│                                       │                           │ (AMC) or 'peRatio' (Non-AMC) mapping       │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Calibration Profile Registration      │ UNREGISTERED IN RUNNER    │ Requires loading capital markets profile   │
│                                       │                           │ into runner calibrations map               │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Cross-Fallback Safeguard              │ READY IN SYNTHESIZER      │ Synthesizer enforces strict isolation;     │
│                                       │                           │ builder must preserve distinct archetypes  │
├───────────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────┤
│ Authoritative Corporate Fundamentals  │ EXTERNAL DEPENDENCY       │ Blocked by OI-FUND-01 for production LIVE  │
└───────────────────────────────────────┴───────────────────────────┴────────────────────────────────────────────┘
```

---

## 5. D113-QCAL09 Banking Comparison & Structural Differences

The accepted **D113-QCAL09 Banking dynamic unlock** serves as an architectural pattern, but critical sector differences exist:

```
┌─────────────────────────────────┬───────────────────────────────┬───────────────────────────────────────────────┐
│ Governance & Technical Feature  │ Banking Pattern (D113-QCAL09) │ Group 2 Operational Unlock (D115 Stage 3)     │
├─────────────────────────────────┼───────────────────────────────┼───────────────────────────────────────────────┤
│ Number of Target Sectors        │ Single sector (Banking)       │ Two sectors (Insurance & Capital Markets)     │
│ Sub-Sector Segmentation         │ Homogeneous commercial banks  │ Bifurcated: Life vs Non-Life (Insurance);     │
│                                 │                               │ AMC vs Non-AMC (Capital Markets)              │
│ Valuation Multiples             │ Single: P/ABV                 │ Three distinct multiples:                     │
│                                 │                               │ - P/EV (Life Insurance)                       │
│                                 │                               │ - Market Cap / AUM % (AMC)                    │
│                                 │                               │ - P/E (Non-AMC)                               │
│ Primary Regulatory Guard        │ Net NPA < Net Worth (ABV > 0) │ Statutory Solvency Ratio >= 1.50 (IRDAI)      │
│ Population Exclusion Guard      │ N/A (all mapped banks covered)│ Non-Life Insurance explicitly blocked         │
│ Golden Reference Structure      │ JSON uses "banks" array       │ Insurance uses "insurers" array;              │
│                                 │                               │ Capital Markets uses "firms" array            │
│ Security Master Baseline        │ HDFCBANK (BANK-H1) mapped     │ HDFCLIFE & BSE currently in excluded list     │
└─────────────────────────────────┴───────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 6. Strict Fail-Closed Requirements for Stage 3

In any future Stage 3 implementation, the dynamic runner must enforce strict fail-closed behavior:

1. **Life Insurance Dynamic Fail-Closed Conditions:**
   - Non-Life categories (General, Health, Reinsurance) $\longrightarrow \text{status: 'SECTOR_UNSUPPORTED'}$ or $\text{'BLOCKED_UNCALIBRATED'}$.
   - Solvency Ratio $< 1.50 \longrightarrow \text{status: 'VALUATION_UNAVAILABLE'}$ with reason `SOLVENCY_BELOW_REGULATORY_MINIMUM`.
   - Distressed $\text{EV} \le 0 \longrightarrow \text{status: 'VALUATION_UNAVAILABLE'}$ with reason `NON_POSITIVE_EMBEDDED_VALUE`.
   - Missing Embedded Value $\longrightarrow \text{status: 'VALUATION_UNAVAILABLE'}$.
   - `exceptionalEventFlag: true` $\longrightarrow \text{status: 'VALUATION_UNAVAILABLE'}$ with reason `EXCEPTIONAL_EVENT_EXCLUDED`.
   - In all fail-closed conditions: $\text{composite: null}$, $\text{verdict: null}$, $\text{valuationScore: null}$.
2. **Capital Markets AMC Dynamic Fail-Closed Conditions:**
   - Missing or non-positive Total AUM ($\text{AUM} \le 0$) $\longrightarrow \text{status: 'VALUATION_UNAVAILABLE'}$.
   - `exceptionalEventFlag: true` $\longrightarrow \text{status: 'VALUATION_UNAVAILABLE'}$.
   - Cross-methodology fallback to P/E is strictly prohibited.
3. **Capital Markets Non-AMC Dynamic Fail-Closed Conditions:**
   - Missing or non-positive earnings ($\text{EPS} \le 0$) $\longrightarrow \text{status: 'VALUATION_UNAVAILABLE'}$.
   - `exceptionalEventFlag: true` $\longrightarrow \text{status: 'VALUATION_UNAVAILABLE'}$.
   - Cross-methodology fallback to Market Cap / AUM is strictly prohibited.
4. **Remaining Sectors:**
   - Healthcare and Hospitality remain strictly blocked (`SECTOR_UNSUPPORTED`) under **Decision C2**.

---

## 7. Provenance & Certification Boundaries

Dynamic execution payloads for Insurance and Capital Markets must stamp exact provenance:
- `dataMode: 'LIVE'`
- `dataSource: 'IIPS Dynamic Engine Runner (D112-D / D115-STAGE3 DEVELOPMENT_HARNESS)'`
- `freshness: 'DEVELOPMENT_MIXED_VINTAGE'`
- `fundamentalsVintage: 'v1.1-reference'`
- `valuationMethodologyVersion: 'D115-STAGE2'`
- `engineVersion: '1.0.0'`
- `calibrationProfileId:` `insurance-valuation-calibration` or `capital-markets-valuation-calibration`
- `calibrationVersion: '1.0.0'`
- `transportSemantics: 'Development test harness; fundamental denominators held static; NOT PRODUCTION CERTIFIED'`

**Production LIVE Boundary Affirmation:**  
Technical runner execution does **not** grant or imply production data rights or live certification. Production dynamic execution remains strictly blocked by open items **OI-FUND-01** and **OI-P16-01..06**.

---

## 8. Open Program Dependency Cross-Reference

```
┌──────────────┬────────────────────────────────────────────────────────┬─────────────────────────────┐
│ Open Item    │ Description & Program Scope                            │ Classification for Stage 3  │
├──────────────┼────────────────────────────────────────────────────────┼─────────────────────────────┤
│ OI-FUND-01   │ Authoritative Production Fundamentals Ingestion Source │ BLOCKS PRODUCTION LIVE;     │
│              │ (Automated SEC/MCA/XBRL ingestion stream)              │ DOES NOT BLOCK TECHNICAL ST3│
├──────────────┼────────────────────────────────────────────────────────┼─────────────────────────────┤
│ OI-HIST-01   │ 10-Year Historical Data Population                     │ BLOCKS PRODUCTION LIVE;     │
│              │ (Full archive backfill pending external data access)   │ DOES NOT BLOCK TECHNICAL ST3│
├──────────────┼────────────────────────────────────────────────────────┼─────────────────────────────┤
│ OI-P16-01    │ Cash Market EOD Feed Agreement with NSE Data           │ EXTERNAL / COMMERCIAL;      │
│              │                                                        │ DOES NOT BLOCK TECHNICAL ST3│
├──────────────┼────────────────────────────────────────────────────────┼─────────────────────────────┤
│ OI-P16-02    │ Permitted enterprise retention and analytical use      │ EXTERNAL / COMMERCIAL;      │
│              │                                                        │ DOES NOT BLOCK TECHNICAL ST3│
├──────────────┼────────────────────────────────────────────────────────┼─────────────────────────────┤
│ OI-P16-03    │ Formal assignment of exchange SFTP User ID             │ EXTERNAL / COMMERCIAL;      │
│              │                                                        │ DOES NOT BLOCK TECHNICAL ST3│
├──────────────┼────────────────────────────────────────────────────────┼─────────────────────────────┤
│ OI-P16-04    │ Static public egress IP allowlisting on NSE firewalls  │ EXTERNAL / COMMERCIAL;      │
│              │                                                        │ DOES NOT BLOCK TECHNICAL ST3│
├──────────────┼────────────────────────────────────────────────────────┼─────────────────────────────┤
│ OI-P16-05    │ Production SSH key pair binding & authentication       │ EXTERNAL / COMMERCIAL;      │
│              │                                                        │ DOES NOT BLOCK TECHNICAL ST3│
├──────────────┼────────────────────────────────────────────────────────┼─────────────────────────────┤
│ OI-P16-06    │ Port 7010 active-active SFTP connectivity validation   │ EXTERNAL / COMMERCIAL;      │
│              │                                                        │ DOES NOT BLOCK TECHNICAL ST3│
├──────────────┼────────────────────────────────────────────────────────┼─────────────────────────────┤
│ OI-DHAN-01   │ Dhan Data API operational subscription verification    │ NOT RELEVANT TO STAGE 3     │
└──────────────┴────────────────────────────────────────────────────────┴─────────────────────────────┘
```

---

## 9. Stage 3 Authority Questionnaire (Q-GRP2-ST3-01 through Q-GRP2-ST3-15)

The Program Authority is requested to review and adjudicate the following fifteen governance items:

```
┌──────────────────┬────────────────────────────────────────────────────────────────────────────────────────┐
│ Question Code    │ Decision Item & Authority Options                                                      │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-01    │ Life Insurance Runner Eligibility:                                                     │
│                  │ [A] Authorize Life Insurance unblocking in DynamicEngineRunner after all Stage 3 tests │
│                  │ [B] Keep Life Insurance runner-blocked                                                 │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-02    │ Capital Markets Runner Eligibility:                                                    │
│                  │ [A] Authorize Capital Markets unblocking in DynamicEngineRunner after Stage 3 tests    │
│                  │ [B] Keep Capital Markets runner-blocked                                                │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-03    │ Life-Only Scope Confirmation:                                                          │
│                  │ [A] Reaffirm Life Insurance only; Non-Life categories fail closed in dynamic runner    │
│                  │ [B] Permit broader insurance inclusion                                                 │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-04    │ Capital Markets Segmentation Confirmation:                                             │
│                  │ [A] Reaffirm AMC (Market Cap / AUM) vs Non-AMC (P/E) dynamic execution routing          │
│                  │ [B] Modify segmentation architecture                                                  │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-05    │ Valuation Methodology Isolation:                                                       │
│                  │ [A] Zero cross-fallback permitted between AMC and Non-AMC multiples                    │
│                  │ [B] Permit fallback multiple evaluation                                                │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-06    │ Fail-Closed Input Rules:                                                               │
│                  │ [A] Reaffirm strict fail-closed UNAVAILABLE for missing or non-positive metrics        │
│                  │ [B] Permit default floor scores                                                        │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-07    │ Exceptional Events Policy:                                                             │
│                  │ [A] exceptionalEventFlag = true unconditionally fails closed as UNAVAILABLE           │
│                  │ [B] Permit conditional scoring                                                         │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-08    │ Immutable Calibration Profiles:                                                        │
│                  │ [A] Reaffirm insurance-valuation-calibration-1.0.0.json and                            │
│                  │     capital-markets-valuation-calibration-1.0.0.json remain immutable 1.0.0            │
│                  │ [B] Permit runtime profile updates                                                     │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-09    │ Development / Reference Harness Boundary:                                              │
│                  │ [A] Reaffirm dynamic execution is DEVELOPMENT_MIXED_VINTAGE test harness only          │
│                  │ [B] Authorize production LIVE dynamic execution                                        │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-10    │ Minimum Evidence Required for Unblocking:                                              │
│                  │ [A] Require 100% pass across boundary tests, negative controls, runner tests, transport│
│                  │     DTO tests, and full regression floor before unblocking                             │
│                  │ [B] Permit partial unblocking                                                          │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-11    │ Healthcare and Hospitality Standing Block:                                             │
│                  │ [A] Reaffirm Healthcare and Hospitality remain strictly blocked under Decision C2      │
│                  │ [B] Reopen Healthcare/Hospitality calibration                                          │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-12    │ Banking Operational Baseline Invariance:                                               │
│                  │ [A] Reaffirm Banking dynamic execution remains fully unlocked and unchanged per D113   │
│                  │ [B] Modify Banking dynamic execution                                                   │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-13    │ Separate Stage 3 Acceptance Reconciliation Gate:                                       │
│                  │ [A] Require formal acceptance reconciliation deliverable before Stage 3 closure        │
│                  │ [B] Close Stage 3 immediately upon implementation                                      │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-14    │ Production Licensing / Provider Entitlement Independence:                              │
│                  │ [A] Affirm technical runner unlock does not constitute production data entitlement     │
│                  │ [B] Conflate technical unlock with production entitlement                              │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ Q-GRP2-ST3-15    │ OI-FUND-01 Production Blocker Status:                                                  │
│                  │ [A] Affirm OI-FUND-01 blocks production LIVE dynamic execution regardless of unlock    │
│                  │ [B] Deem OI-FUND-01 non-blocking for production LIVE                                   │
└──────────────────┴────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Required Stage 3 Verification Plan

When the Program Authority renders binding determinations on **Q-GRP2-ST3-01 through Q-GRP2-ST3-15**, the subsequent Stage 3 implementation must provide the following acceptance evidence:

1. **Runner Eligibility Verification:**
   - Confirm `Insurance` and `Capital Markets` successfully execute when passed valid inputs.
   - Confirm `blockedSectors` in `DynamicEngineRunner.ts` is reduced from 4 to 2 (`['Healthcare', 'Hospitality']`).
2. **Sub-Sector Routing & Isolation:**
   - Life Insurance routes to `IM-VAL-001` (P/EV); Non-Life rejects fail closed.
   - AMC routes to `CM-VAL-001` (Market Cap / AUM %); Non-AMC routes to `CM-VAL-002` (P/E). Zero cross-fallback.
3. **Fail-Closed & Negative Controls:**
   - Solvency $< 1.50$ fails closed with `VALUATION_UNAVAILABLE`.
   - Distressed $\text{EV} \le 0, \text{AUM} \le 0, \text{EPS} \le 0$ fail closed with `VALUATION_UNAVAILABLE`.
   - `exceptionalEventFlag: true` fails closed with `VALUATION_UNAVAILABLE`.
4. **Dual-Plane Transport DTO Verification:**
   - Decision Matrix DTO serializes valid dynamic composite scores and pillars for Insurance and Capital Markets.
   - Screener DTO includes dynamic rows for Insurance and Capital Markets.
   - Executive transport serializes dynamic conviction scores with development mixed-vintage provenance.
5. **Healthcare / Hospitality Isolation:**
   - Confirm Healthcare and Hospitality continue to fail closed as `SECTOR_UNSUPPORTED` with `composite: null`.
6. **Regression Floor:**
   - Full regression floor must remain 100% green (140+ Node tests, 61 Vitest batch ingestion tests).
7. **ADR-01 & Golden Fixture Invariance:**
   - Zero diff in `iips-platform/src/sector-engines/`.

---

## 11. Explicit Disclosures & Items NOT Proven

1. **Security Master Mapping:** Listed life insurers (e.g. `HDFCLIFE`) and capital markets entities (e.g. `BSE`, `HDFCAMC`) currently reside in `excludedCandidateMappings` in `security-master-1.0.0.json`. Enabling live end-to-end ticker resolution requires promoting or mapping evidenced entities in the master registry.
2. **Dynamic Input Builder:** Denominator fixtures and valuation key injection for Insurance and Capital Markets are not yet implemented in `DynamicEngineInputBuilder.ts`.
3. **Production Data Entitlement:** Zero production licensing or commercial data rights are acquired or established by this preparation.
4. **Platform Scope:** Healthcare and Hospitality remain completely uncalibrated and blocked.

---

## 12. Proposed Stage 3 Implementation Sequence

1. **Adjudication:** Program Authority reviews this document and records binding determinations for `Q-GRP2-ST3-01` through `Q-GRP2-ST3-15`.
2. **Registry Mapping:** Promote or configure evidenced Insurance and Capital Markets securities in Security Master.
3. **Input Builder Wiring:** Update `DynamicEngineInputBuilder.ts` to register golden reference fixtures, wire representative denominators, and map valuation keys.
4. **Runner Unblocking:** Register calibration profiles and remove `Insurance` and `Capital Markets` from `blockedSectors` in `DynamicEngineRunner.ts`.
5. **Verification Suite Authoring:** Author `group2-dynamic-runner.test.ts` (15+ execution, routing, fail-closed, and transport tests).
6. **Acceptance Reconciliation Gate:** Produce formal acceptance and durability reconciliation deliverable.

---

**AUTHORITY DECISION PREPARATION PACKAGE COMPLETE. READY FOR COMMITTING AND PUSHING READ-ONLY DOCUMENT.**
