# IES-016 09 CALIBRATION

**Status:** NEW — created under D36 Tier-3 Documentation-Parity Execution Authority.

**Provenance:** New documentation/evidence created during the D36 Tier-3 documentation-parity programme. This file is not recovered historical evidence and must not be represented as such.

**Authority:** `DEC-D36-TIER3-DOCUMENTATION-PARITY-AUTHORITY`.

**Execution semantics:** This artifact is subject to D15 role separation + clean-workspace reproducibility and D16 evidence semantics. No organizational, external, third-party, or accredited independence is claimed.

**Certification boundary:** Creation of this artifact does not constitute A2 → A1 promotion, Integration Verification Matrix amendment, certification, release/tag authorization, or independent verification.

---

**Modification provenance (2026-09-05):** MODIFIED `D36-NEW-EVIDENCE` (provenance class 3 of DEC-D36). Substantive content added to this document under the D36-successor 57-document authoring + product-mutation authority, durably recorded at governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33` (authority instrument `governance/iips/D7-TIER3-PARITY-D36-SUCCESSOR-57-DOCUMENT-AUTHORITY-2026-09-05.md`, blob `317c78536403185a39326848fa4fd87c3855250e`). Document identity, slot, and class are preserved (R1); the original D36 provenance block above is retained verbatim. All substantive values in this document derive, with per-claim citations, from the pinned frozen source assets of engine IES-016 at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f`. This file remains new documentation dated at modification - never recovered historical evidence - and is subject to D15 role separation + clean-workspace reproducibility.

**INDEPENDENCE DISCLOSURE (programme authority, binding on every remediation artifact):** No organizational, external, third-party, or accredited independence exists for this programme or for this document. D7-TIER3-INDEPENDENCE remains unchanged (OPEN/negative). This document is not independent verification and confers no independence claim. Evidence-class discipline (repository evidence / live-UI evidence / inferred capability / certified capability) is preserved; every substantive claim below carries its source citation.

**Remediation boundary:** This document asserts no certification, no parity, no A2 -> A1 promotion, no release/tag authorization, and no methodology change (W8/W9). Authoring/remediation does not establish parity; the separately authorized substantive re-review remains mandatory and pending.

---

# Document 09 - CALIBRATION (IES-016 remediated content)

## 1. Calibration identity (frozen file header, field-for-field)

| Key | Frozen value |
| --- | --- |
| profile | telecommunications-calibration-1.0.0 |
| standard | IES-016 |
| version | 1.0.0 |
| program | v3.0 Engine Certification Program |
| contractVersion | IES-016 v1.0 (D16 normative) |

Source: `ies-016-telecommunications/calibration/telecommunications-calibration-1.0.0.json` @ `178160fcbe0a...` - 262 leaves total (every scalar counted; the complete leaf enumeration is §8). DEC-D25 §4 verifies this calibration "matches pack §4 field-for-field" for the pack §4 contract.

## 2. verdictMapping (complete)

| Composite range | Verdict | Rank |
| --- | --- | --- |
| 80-100 | Strong Buy | rank 6 |
| 70-80 | Buy | rank 5 |
| 60-70 | Accumulate | rank 4 |
| 50-60 | Hold | rank 3 |
| 40-50 | Watch | rank 2 |
| 0-40 | Avoid | rank 1 |

## 3. segments (complete: 5 subsegments, 6-dim weight vectors + leverageAlert)

| Subsegment | quality | growth | risk | profitability | capitalEfficiency | valuation | sum | leverageAlert |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `cable-mso` | 0.25 | 0.15 | 0.25 | 0.20 | 0.10 | 0.05 | 1.00 | 4.0 |
| `converged-telco` | 0.25 | 0.20 | 0.25 | 0.15 | 0.10 | 0.05 | 1.00 | 3.5 |
| `fixed-broadband` | 0.30 | 0.15 | 0.20 | 0.20 | 0.10 | 0.05 | 1.00 | 3.0 |
| `tower-infra` | 0.30 | 0.10 | 0.25 | 0.20 | 0.10 | 0.05 | 1.00 | 5.0 |
| `wireless-mno` | 0.30 | 0.20 | 0.20 | 0.15 | 0.10 | 0.05 | 1.00 | 3.5 |

## 4. archetypeRisk (complete: 6 entries)

| Archetype | Risk multiplier |
| --- | --- |
| `consumer` | 1.0 |
| `converged` | 1.0 |
| `enterprise` | 0.9 |
| `hybrid` | 1.0 |
| `infrastructure` | 0.8 |
| `wholesale` | 0.9 |

## 5. bandScores (complete: 12 baseline band tables)

| Metric | Field | Baseline band table | Cardinality |
| --- | --- | --- | --- |
| TC-001 | ebitdaMargin | x < 15 -> 40 ; 15 <= x < 25 -> 60 ; 25 <= x < 35 -> 75 ; x >= 35 -> 90 | 4 bands |
| TC-002 | revenueGrowth | x < 0 -> 40 ; 0 <= x < 5 -> 60 ; 5 <= x < 10 -> 75 ; x >= 10 -> 90 | 4 bands |
| TC-003 | debtEbitda | x < 1.5 -> 90 ; 1.5 <= x < 2.5 -> 75 ; 2.5 <= x < 3.5 -> 55 ; x >= 3.5 -> 30 | 4 bands |
| TC-004 | arpu | x < 15 -> 40 ; 15 <= x < 25 -> 60 ; 25 <= x < 40 -> 75 ; x >= 40 -> 90 | 4 bands |
| TC-005 | churnRate | x < 1.0 -> 90 ; 1.0 <= x < 1.8 -> 75 ; 1.8 <= x < 2.5 -> 55 ; x >= 2.5 -> 30 | 4 bands |
| TC-006 | postpaidMix | x < 40 -> 40 ; 40 <= x < 60 -> 60 ; 60 <= x < 80 -> 75 ; x >= 80 -> 90 | 4 bands |
| TC-007 | fcfYield | x < 2 -> 40 ; 2 <= x < 5 -> 60 ; 5 <= x < 8 -> 75 ; x >= 8 -> 90 | 4 bands |
| TC-008 | roic | x < 6 -> 40 ; 6 <= x < 10 -> 60 ; 10 <= x < 14 -> 75 ; x >= 14 -> 90 | 4 bands |
| TC-009 | capexIntensity | x < 10 -> 90 ; 10 <= x < 16 -> 75 ; 16 <= x < 24 -> 55 ; x >= 24 -> 30 | 4 bands |
| TC-010 | spectrumCost | x < 0.5 -> 90 ; 0.5 <= x < 1.0 -> 75 ; 1.0 <= x < 1.75 -> 55 ; x >= 1.75 -> 30 | 4 bands |
| TC-011 | evEbitda | x < 5 -> 90 ; 5 <= x < 7 -> 75 ; 7 <= x < 9 -> 55 ; x >= 9 -> 30 | 4 bands |
| TC-012 | usageGrowth | x < 10 -> 40 ; 10 <= x < 20 -> 60 ; 20 <= x < 30 -> 75 ; x >= 30 -> 90 | 4 bands |

## 6. calibratedBandTables (complete: engine-specific)

| Subsegment | Metric | Calibrated band table | Invariant |
| --- | --- | --- | --- |
| `fixed-broadband` | TC-004 | x < 25 -> 40 ; 25 <= x < 40 -> 60 ; 40 <= x < 55 -> 75 ; x >= 55 -> 90 | 4 bands (== baseline cardinality) |
| `tower-infra` | TC-004 | x < 2 -> 40 ; 2 <= x < 3 -> 60 ; 3 <= x < 4 -> 75 ; x >= 4 -> 90 | 4 bands (== baseline cardinality) |
| `tower-infra` | TC-011 | x < 12 -> 90 ; 12 <= x < 16 -> 75 ; 16 <= x < 20 -> 55 ; x >= 20 -> 30 | 4 bands (== baseline cardinality) |

## 7. Source reconciliation (citation convention)

HISTORICAL pack wording (§4 preamble, quoted): "**Frozen ≠ authoritative.** The calibration values below are proposals awaiting maintainer/domain-authority acceptance. Once accepted they may be frozen (immutable) for certification purposes; until then they carry no authority. File: `calibration/telecommunications-calibration-1.0.0.json` (deep-frozen at load; mirrors TechnologyCalibration)." and the §0 data-authority row "| Data authority | **PENDING — maintainer acceptance required.** The frozen reference providers are PROPOSED synthetic fixtures (IES-015 convention), NOT authoritative until the D16 methodology is approved by the maintainer/domain authority |". Current authority: DEC-D25 ACCEPT + the FROZEN manifest (FROZEN, 2026-08-29) - DEC-D25 §4 records the calibration "matches pack §4 field-for-field". The pack is not edited; history is not rewritten.

## 8. Complete leaf enumeration (262 leaves)

Every leaf of the frozen calibration JSON, in path order (values verbatim):

| Leaf path | Frozen value |
| --- | --- |
| archetypeRisk.consumer | 1.0 |
| archetypeRisk.converged | 1.0 |
| archetypeRisk.enterprise | 0.9 |
| archetypeRisk.hybrid | 1.0 |
| archetypeRisk.infrastructure | 0.8 |
| archetypeRisk.wholesale | 0.9 |
| bandScores.TC-001[0][0] | "lt" |
| bandScores.TC-001[0][1] | 15 |
| bandScores.TC-001[0][2] | 40 |
| bandScores.TC-001[1][0] | "range" |
| bandScores.TC-001[1][1] | 15 |
| bandScores.TC-001[1][2] | 25 |
| bandScores.TC-001[1][3] | 60 |
| bandScores.TC-001[2][0] | "range" |
| bandScores.TC-001[2][1] | 25 |
| bandScores.TC-001[2][2] | 35 |
| bandScores.TC-001[2][3] | 75 |
| bandScores.TC-001[3][0] | "gte" |
| bandScores.TC-001[3][1] | 35 |
| bandScores.TC-001[3][2] | 90 |
| bandScores.TC-002[0][0] | "lt" |
| bandScores.TC-002[0][1] | 0 |
| bandScores.TC-002[0][2] | 40 |
| bandScores.TC-002[1][0] | "range" |
| bandScores.TC-002[1][1] | 0 |
| bandScores.TC-002[1][2] | 5 |
| bandScores.TC-002[1][3] | 60 |
| bandScores.TC-002[2][0] | "range" |
| bandScores.TC-002[2][1] | 5 |
| bandScores.TC-002[2][2] | 10 |
| bandScores.TC-002[2][3] | 75 |
| bandScores.TC-002[3][0] | "gte" |
| bandScores.TC-002[3][1] | 10 |
| bandScores.TC-002[3][2] | 90 |
| bandScores.TC-003[0][0] | "lt" |
| bandScores.TC-003[0][1] | 1.5 |
| bandScores.TC-003[0][2] | 90 |
| bandScores.TC-003[1][0] | "range" |
| bandScores.TC-003[1][1] | 1.5 |
| bandScores.TC-003[1][2] | 2.5 |
| bandScores.TC-003[1][3] | 75 |
| bandScores.TC-003[2][0] | "range" |
| bandScores.TC-003[2][1] | 2.5 |
| bandScores.TC-003[2][2] | 3.5 |
| bandScores.TC-003[2][3] | 55 |
| bandScores.TC-003[3][0] | "gte" |
| bandScores.TC-003[3][1] | 3.5 |
| bandScores.TC-003[3][2] | 30 |
| bandScores.TC-004[0][0] | "lt" |
| bandScores.TC-004[0][1] | 15 |
| bandScores.TC-004[0][2] | 40 |
| bandScores.TC-004[1][0] | "range" |
| bandScores.TC-004[1][1] | 15 |
| bandScores.TC-004[1][2] | 25 |
| bandScores.TC-004[1][3] | 60 |
| bandScores.TC-004[2][0] | "range" |
| bandScores.TC-004[2][1] | 25 |
| bandScores.TC-004[2][2] | 40 |
| bandScores.TC-004[2][3] | 75 |
| bandScores.TC-004[3][0] | "gte" |
| bandScores.TC-004[3][1] | 40 |
| bandScores.TC-004[3][2] | 90 |
| bandScores.TC-005[0][0] | "lt" |
| bandScores.TC-005[0][1] | 1.0 |
| bandScores.TC-005[0][2] | 90 |
| bandScores.TC-005[1][0] | "range" |
| bandScores.TC-005[1][1] | 1.0 |
| bandScores.TC-005[1][2] | 1.8 |
| bandScores.TC-005[1][3] | 75 |
| bandScores.TC-005[2][0] | "range" |
| bandScores.TC-005[2][1] | 1.8 |
| bandScores.TC-005[2][2] | 2.5 |
| bandScores.TC-005[2][3] | 55 |
| bandScores.TC-005[3][0] | "gte" |
| bandScores.TC-005[3][1] | 2.5 |
| bandScores.TC-005[3][2] | 30 |
| bandScores.TC-006[0][0] | "lt" |
| bandScores.TC-006[0][1] | 40 |
| bandScores.TC-006[0][2] | 40 |
| bandScores.TC-006[1][0] | "range" |
| bandScores.TC-006[1][1] | 40 |
| bandScores.TC-006[1][2] | 60 |
| bandScores.TC-006[1][3] | 60 |
| bandScores.TC-006[2][0] | "range" |
| bandScores.TC-006[2][1] | 60 |
| bandScores.TC-006[2][2] | 80 |
| bandScores.TC-006[2][3] | 75 |
| bandScores.TC-006[3][0] | "gte" |
| bandScores.TC-006[3][1] | 80 |
| bandScores.TC-006[3][2] | 90 |
| bandScores.TC-007[0][0] | "lt" |
| bandScores.TC-007[0][1] | 2 |
| bandScores.TC-007[0][2] | 40 |
| bandScores.TC-007[1][0] | "range" |
| bandScores.TC-007[1][1] | 2 |
| bandScores.TC-007[1][2] | 5 |
| bandScores.TC-007[1][3] | 60 |
| bandScores.TC-007[2][0] | "range" |
| bandScores.TC-007[2][1] | 5 |
| bandScores.TC-007[2][2] | 8 |
| bandScores.TC-007[2][3] | 75 |
| bandScores.TC-007[3][0] | "gte" |
| bandScores.TC-007[3][1] | 8 |
| bandScores.TC-007[3][2] | 90 |
| bandScores.TC-008[0][0] | "lt" |
| bandScores.TC-008[0][1] | 6 |
| bandScores.TC-008[0][2] | 40 |
| bandScores.TC-008[1][0] | "range" |
| bandScores.TC-008[1][1] | 6 |
| bandScores.TC-008[1][2] | 10 |
| bandScores.TC-008[1][3] | 60 |
| bandScores.TC-008[2][0] | "range" |
| bandScores.TC-008[2][1] | 10 |
| bandScores.TC-008[2][2] | 14 |
| bandScores.TC-008[2][3] | 75 |
| bandScores.TC-008[3][0] | "gte" |
| bandScores.TC-008[3][1] | 14 |
| bandScores.TC-008[3][2] | 90 |
| bandScores.TC-009[0][0] | "lt" |
| bandScores.TC-009[0][1] | 10 |
| bandScores.TC-009[0][2] | 90 |
| bandScores.TC-009[1][0] | "range" |
| bandScores.TC-009[1][1] | 10 |
| bandScores.TC-009[1][2] | 16 |
| bandScores.TC-009[1][3] | 75 |
| bandScores.TC-009[2][0] | "range" |
| bandScores.TC-009[2][1] | 16 |
| bandScores.TC-009[2][2] | 24 |
| bandScores.TC-009[2][3] | 55 |
| bandScores.TC-009[3][0] | "gte" |
| bandScores.TC-009[3][1] | 24 |
| bandScores.TC-009[3][2] | 30 |
| bandScores.TC-010[0][0] | "lt" |
| bandScores.TC-010[0][1] | 0.5 |
| bandScores.TC-010[0][2] | 90 |
| bandScores.TC-010[1][0] | "range" |
| bandScores.TC-010[1][1] | 0.5 |
| bandScores.TC-010[1][2] | 1.0 |
| bandScores.TC-010[1][3] | 75 |
| bandScores.TC-010[2][0] | "range" |
| bandScores.TC-010[2][1] | 1.0 |
| bandScores.TC-010[2][2] | 1.75 |
| bandScores.TC-010[2][3] | 55 |
| bandScores.TC-010[3][0] | "gte" |
| bandScores.TC-010[3][1] | 1.75 |
| bandScores.TC-010[3][2] | 30 |
| bandScores.TC-011[0][0] | "lt" |
| bandScores.TC-011[0][1] | 5 |
| bandScores.TC-011[0][2] | 90 |
| bandScores.TC-011[1][0] | "range" |
| bandScores.TC-011[1][1] | 5 |
| bandScores.TC-011[1][2] | 7 |
| bandScores.TC-011[1][3] | 75 |
| bandScores.TC-011[2][0] | "range" |
| bandScores.TC-011[2][1] | 7 |
| bandScores.TC-011[2][2] | 9 |
| bandScores.TC-011[2][3] | 55 |
| bandScores.TC-011[3][0] | "gte" |
| bandScores.TC-011[3][1] | 9 |
| bandScores.TC-011[3][2] | 30 |
| bandScores.TC-012[0][0] | "lt" |
| bandScores.TC-012[0][1] | 10 |
| bandScores.TC-012[0][2] | 40 |
| bandScores.TC-012[1][0] | "range" |
| bandScores.TC-012[1][1] | 10 |
| bandScores.TC-012[1][2] | 20 |
| bandScores.TC-012[1][3] | 60 |
| bandScores.TC-012[2][0] | "range" |
| bandScores.TC-012[2][1] | 20 |
| bandScores.TC-012[2][2] | 30 |
| bandScores.TC-012[2][3] | 75 |
| bandScores.TC-012[3][0] | "gte" |
| bandScores.TC-012[3][1] | 30 |
| bandScores.TC-012[3][2] | 90 |
| calibratedBandTables.fixed-broadband.TC-004[0][0] | "lt" |
| calibratedBandTables.fixed-broadband.TC-004[0][1] | 25 |
| calibratedBandTables.fixed-broadband.TC-004[0][2] | 40 |
| calibratedBandTables.fixed-broadband.TC-004[1][0] | "range" |
| calibratedBandTables.fixed-broadband.TC-004[1][1] | 25 |
| calibratedBandTables.fixed-broadband.TC-004[1][2] | 40 |
| calibratedBandTables.fixed-broadband.TC-004[1][3] | 60 |
| calibratedBandTables.fixed-broadband.TC-004[2][0] | "range" |
| calibratedBandTables.fixed-broadband.TC-004[2][1] | 40 |
| calibratedBandTables.fixed-broadband.TC-004[2][2] | 55 |
| calibratedBandTables.fixed-broadband.TC-004[2][3] | 75 |
| calibratedBandTables.fixed-broadband.TC-004[3][0] | "gte" |
| calibratedBandTables.fixed-broadband.TC-004[3][1] | 55 |
| calibratedBandTables.fixed-broadband.TC-004[3][2] | 90 |
| calibratedBandTables.tower-infra.TC-004[0][0] | "lt" |
| calibratedBandTables.tower-infra.TC-004[0][1] | 2 |
| calibratedBandTables.tower-infra.TC-004[0][2] | 40 |
| calibratedBandTables.tower-infra.TC-004[1][0] | "range" |
| calibratedBandTables.tower-infra.TC-004[1][1] | 2 |
| calibratedBandTables.tower-infra.TC-004[1][2] | 3 |
| calibratedBandTables.tower-infra.TC-004[1][3] | 60 |
| calibratedBandTables.tower-infra.TC-004[2][0] | "range" |
| calibratedBandTables.tower-infra.TC-004[2][1] | 3 |
| calibratedBandTables.tower-infra.TC-004[2][2] | 4 |
| calibratedBandTables.tower-infra.TC-004[2][3] | 75 |
| calibratedBandTables.tower-infra.TC-004[3][0] | "gte" |
| calibratedBandTables.tower-infra.TC-004[3][1] | 4 |
| calibratedBandTables.tower-infra.TC-004[3][2] | 90 |
| calibratedBandTables.tower-infra.TC-011[0][0] | "lt" |
| calibratedBandTables.tower-infra.TC-011[0][1] | 12 |
| calibratedBandTables.tower-infra.TC-011[0][2] | 90 |
| calibratedBandTables.tower-infra.TC-011[1][0] | "range" |
| calibratedBandTables.tower-infra.TC-011[1][1] | 12 |
| calibratedBandTables.tower-infra.TC-011[1][2] | 16 |
| calibratedBandTables.tower-infra.TC-011[1][3] | 75 |
| calibratedBandTables.tower-infra.TC-011[2][0] | "range" |
| calibratedBandTables.tower-infra.TC-011[2][1] | 16 |
| calibratedBandTables.tower-infra.TC-011[2][2] | 20 |
| calibratedBandTables.tower-infra.TC-011[2][3] | 55 |
| calibratedBandTables.tower-infra.TC-011[3][0] | "gte" |
| calibratedBandTables.tower-infra.TC-011[3][1] | 20 |
| calibratedBandTables.tower-infra.TC-011[3][2] | 30 |
| contractVersion | "IES-016 v1.0 (D16 normative)" |
| profile | "telecommunications-calibration-1.0.0" |
| program | "v3.0 Engine Certification Program" |
| segments.cable-mso.leverageAlert | 4.0 |
| segments.cable-mso.w[0] | 0.25 |
| segments.cable-mso.w[1] | 0.15 |
| segments.cable-mso.w[2] | 0.25 |
| segments.cable-mso.w[3] | 0.2 |
| segments.cable-mso.w[4] | 0.1 |
| segments.cable-mso.w[5] | 0.05 |
| segments.converged-telco.leverageAlert | 3.5 |
| segments.converged-telco.w[0] | 0.25 |
| segments.converged-telco.w[1] | 0.2 |
| segments.converged-telco.w[2] | 0.25 |
| segments.converged-telco.w[3] | 0.15 |
| segments.converged-telco.w[4] | 0.1 |
| segments.converged-telco.w[5] | 0.05 |
| segments.fixed-broadband.leverageAlert | 3.0 |
| segments.fixed-broadband.w[0] | 0.3 |
| segments.fixed-broadband.w[1] | 0.15 |
| segments.fixed-broadband.w[2] | 0.2 |
| segments.fixed-broadband.w[3] | 0.2 |
| segments.fixed-broadband.w[4] | 0.1 |
| segments.fixed-broadband.w[5] | 0.05 |
| segments.tower-infra.leverageAlert | 5.0 |
| segments.tower-infra.w[0] | 0.3 |
| segments.tower-infra.w[1] | 0.1 |
| segments.tower-infra.w[2] | 0.25 |
| segments.tower-infra.w[3] | 0.2 |
| segments.tower-infra.w[4] | 0.1 |
| segments.tower-infra.w[5] | 0.05 |
| segments.wireless-mno.leverageAlert | 3.5 |
| segments.wireless-mno.w[0] | 0.3 |
| segments.wireless-mno.w[1] | 0.2 |
| segments.wireless-mno.w[2] | 0.2 |
| segments.wireless-mno.w[3] | 0.15 |
| segments.wireless-mno.w[4] | 0.1 |
| segments.wireless-mno.w[5] | 0.05 |
| standard | "IES-016" |
| verdictMapping.0-40 | "Avoid" |
| verdictMapping.40-50 | "Watch" |
| verdictMapping.50-60 | "Hold" |
| verdictMapping.60-70 | "Accumulate" |
| verdictMapping.70-80 | "Buy" |
| verdictMapping.80-100 | "Strong Buy" |
| version | "1.0.0" |

postFreezeRule (frozen manifest, verbatim): "Any methodology/calibration change requires a new version, never modification of the frozen baseline. Reference assets are the authoritative test oracle; implementation disagreement is an implementation defect."
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Calibration file (field-for-field) | ies-016-telecommunications/calibration/telecommunications-calibration-1.0.0.json | 178160fcbe0a30975c6796ac22c73a9bd03ab91a |
| Pack calibration contract | ies-016-telecommunications/TELECOMMUNICATIONS_DISCOVERY_PACK.md | 68aae104dd3a0ccad8122d5770bd8d2c61637ba6 |
| D25 field-for-field verification | governance/iips/DEC-D25-TIER3-EVIDENTIARY-STANDARD.md | cbab4da9ce922aacf45e513954d6e325bb037810 |
| Freeze record | ies-016-telecommunications/IES-016_FREEZE_MANIFEST.json | 70018bdb38849d50af7258f62d0341ac2bf64f1a |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
