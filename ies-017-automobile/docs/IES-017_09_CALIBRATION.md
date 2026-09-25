# IES-017 09 CALIBRATION

**Status:** NEW — created under D36 Tier-3 Documentation-Parity Execution Authority.

**Provenance:** New documentation/evidence created during the D36 Tier-3 documentation-parity programme. This file is not recovered historical evidence and must not be represented as such.

**Authority:** `DEC-D36-TIER3-DOCUMENTATION-PARITY-AUTHORITY`.

**Execution semantics:** This artifact is subject to D15 role separation + clean-workspace reproducibility and D16 evidence semantics. No organizational, external, third-party, or accredited independence is claimed.

**Certification boundary:** Creation of this artifact does not constitute A2 → A1 promotion, Integration Verification Matrix amendment, certification, release/tag authorization, or independent verification.

---

**Modification provenance (2026-09-05):** MODIFIED `D36-NEW-EVIDENCE` (provenance class 3 of DEC-D36). Substantive content added to this document under the D36-successor 57-document authoring + product-mutation authority, durably recorded at governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33` (authority instrument `governance/iips/D7-TIER3-PARITY-D36-SUCCESSOR-57-DOCUMENT-AUTHORITY-2026-09-05.md`, blob `317c78536403185a39326848fa4fd87c3855250e`). Document identity, slot, and class are preserved (R1); the original D36 provenance block above is retained verbatim. All substantive values in this document derive, with per-claim citations, from the pinned frozen source assets of engine IES-017 at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f`. This file remains new documentation dated at modification - never recovered historical evidence - and is subject to D15 role separation + clean-workspace reproducibility.

**INDEPENDENCE DISCLOSURE (programme authority, binding on every remediation artifact):** No organizational, external, third-party, or accredited independence exists for this programme or for this document. D7-TIER3-INDEPENDENCE remains unchanged (OPEN/negative). This document is not independent verification and confers no independence claim. Evidence-class discipline (repository evidence / live-UI evidence / inferred capability / certified capability) is preserved; every substantive claim below carries its source citation.

**Remediation boundary:** This document asserts no certification, no parity, no A2 -> A1 promotion, no release/tag authorization, and no methodology change (W8/W9). Authoring/remediation does not establish parity; the separately authorized substantive re-review remains mandatory and pending.

---

# Document 09 - CALIBRATION (IES-017 remediated content)

## 1. Calibration identity (frozen file header, field-for-field)

| Key | Frozen value |
| --- | --- |
| profile | automobile-calibration-1.0.0 |
| standard | IES-017 |
| version | 1.0.0 |
| program | v3.0 Engine Certification Program |
| contractVersion | IES-017 v1.0 (D17 normative) — PROPOSED, NOT AUTHORITY *(frozen verbatim value; the embedded self-label is historical wording, reconciled by the DEC-D25 ACCEPT - document 05)* |

Source: `ies-017-automobile/calibration/automobile-calibration-1.0.0.json` @ `e3f84ede6f5e...` - 262 leaves total (every scalar counted; the complete leaf enumeration is §8). DEC-D25 §4 verifies this calibration "matches the accepted pack contract" for the pack §4 contract.

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
| `commercial-vehicles` | 0.25 | 0.15 | 0.25 | 0.20 | 0.10 | 0.05 | 1.00 | 3.0 |
| `ev-native` | 0.30 | 0.25 | 0.20 | 0.10 | 0.10 | 0.05 | 1.00 | 3.5 |
| `mass-market-oem` | 0.25 | 0.20 | 0.25 | 0.15 | 0.10 | 0.05 | 1.00 | 3.0 |
| `premium-oem` | 0.30 | 0.15 | 0.20 | 0.20 | 0.10 | 0.05 | 1.00 | 3.5 |
| `tier-1-supplier` | 0.25 | 0.20 | 0.25 | 0.15 | 0.10 | 0.05 | 1.00 | 3.0 |

## 4. archetypeRisk (complete: 6 entries)

| Archetype | Risk multiplier |
| --- | --- |
| `commercial` | 0.9 |
| `component-supplier` | 0.9 |
| `ev-pure-play` | 1.1 |
| `full-line` | 1.0 |
| `hybrid` | 1.0 |
| `luxury` | 0.9 |

## 5. bandScores (complete: 12 baseline band tables)

| Metric | Field | Baseline band table | Cardinality |
| --- | --- | --- | --- |
| AB-001 | ebitdaMargin | x < 8 -> 40 ; 8 <= x < 15 -> 60 ; 15 <= x < 22 -> 75 ; x >= 22 -> 90 | 4 bands |
| AB-002 | revenueGrowth | x < 0 -> 40 ; 0 <= x < 6 -> 60 ; 6 <= x < 12 -> 75 ; x >= 12 -> 90 | 4 bands |
| AB-003 | debtEbitda | x < 1.5 -> 90 ; 1.5 <= x < 2.5 -> 75 ; 2.5 <= x < 3.5 -> 55 ; x >= 3.5 -> 30 | 4 bands |
| AB-004 | vehicleMargin | x < 5 -> 40 ; 5 <= x < 10 -> 60 ; 10 <= x < 15 -> 75 ; x >= 15 -> 90 | 4 bands |
| AB-005 | capacityUtilization | x < 60 -> 40 ; 60 <= x < 75 -> 60 ; 75 <= x < 90 -> 75 ; x >= 90 -> 90 | 4 bands |
| AB-006 | evMix | x < 5 -> 40 ; 5 <= x < 20 -> 60 ; 20 <= x < 50 -> 75 ; x >= 50 -> 90 | 4 bands |
| AB-007 | fcfYield | x < 2 -> 40 ; 2 <= x < 5 -> 60 ; 5 <= x < 8 -> 75 ; x >= 8 -> 90 | 4 bands |
| AB-008 | roic | x < 6 -> 40 ; 6 <= x < 10 -> 60 ; 10 <= x < 14 -> 75 ; x >= 14 -> 90 | 4 bands |
| AB-009 | capexIntensity | x < 10 -> 90 ; 10 <= x < 16 -> 75 ; 16 <= x < 24 -> 55 ; x >= 24 -> 30 | 4 bands |
| AB-010 | inventoryDays | x < 30 -> 90 ; 30 <= x < 60 -> 75 ; 60 <= x < 90 -> 55 ; x >= 90 -> 30 | 4 bands |
| AB-011 | evEbitda | x < 4 -> 90 ; 4 <= x < 7 -> 75 ; 7 <= x < 10 -> 55 ; x >= 10 -> 30 | 4 bands |
| AB-012 | aftersalesMix | x < 10 -> 40 ; 10 <= x < 20 -> 60 ; 20 <= x < 30 -> 75 ; x >= 30 -> 90 | 4 bands |

## 6. calibratedBandTables (complete: engine-specific)

| Subsegment | Metric | Calibrated band table | Invariant |
| --- | --- | --- | --- |
| `ev-native` | AB-004 | x < 3 -> 40 ; 3 <= x < 8 -> 60 ; 8 <= x < 13 -> 75 ; x >= 13 -> 90 | 4 bands (== baseline cardinality) |
| `ev-native` | AB-009 | x < 15 -> 90 ; 15 <= x < 25 -> 75 ; 25 <= x < 40 -> 55 ; x >= 40 -> 30 | 4 bands (== baseline cardinality) |
| `tier-1-supplier` | AB-005 | x < 70 -> 40 ; 70 <= x < 80 -> 60 ; 80 <= x < 90 -> 75 ; x >= 90 -> 90 | 4 bands (== baseline cardinality) |

## 7. Source reconciliation (citation convention)

HISTORICAL pack wording (§0 data-authority row, quoted): "| Data authority | **PENDING — maintainer acceptance required.** All fixtures are PROPOSED synthetic (IES-015/016 convention), never presented as real companies. |". Current authority: DEC-D25 ACCEPT (`D17 v1.0`, fresh forward-looking) + the FROZEN manifest (FROZEN, 2026-08-29; methodologyVersion "IES-017 v1.0 (D17 normative contract)"). The pack is not edited; history is not rewritten.

## 8. Complete leaf enumeration (262 leaves)

Every leaf of the frozen calibration JSON, in path order (values verbatim):

| Leaf path | Frozen value |
| --- | --- |
| archetypeRisk.commercial | 0.9 |
| archetypeRisk.component-supplier | 0.9 |
| archetypeRisk.ev-pure-play | 1.1 |
| archetypeRisk.full-line | 1.0 |
| archetypeRisk.hybrid | 1.0 |
| archetypeRisk.luxury | 0.9 |
| bandScores.AB-001[0][0] | "lt" |
| bandScores.AB-001[0][1] | 8 |
| bandScores.AB-001[0][2] | 40 |
| bandScores.AB-001[1][0] | "range" |
| bandScores.AB-001[1][1] | 8 |
| bandScores.AB-001[1][2] | 15 |
| bandScores.AB-001[1][3] | 60 |
| bandScores.AB-001[2][0] | "range" |
| bandScores.AB-001[2][1] | 15 |
| bandScores.AB-001[2][2] | 22 |
| bandScores.AB-001[2][3] | 75 |
| bandScores.AB-001[3][0] | "gte" |
| bandScores.AB-001[3][1] | 22 |
| bandScores.AB-001[3][2] | 90 |
| bandScores.AB-002[0][0] | "lt" |
| bandScores.AB-002[0][1] | 0 |
| bandScores.AB-002[0][2] | 40 |
| bandScores.AB-002[1][0] | "range" |
| bandScores.AB-002[1][1] | 0 |
| bandScores.AB-002[1][2] | 6 |
| bandScores.AB-002[1][3] | 60 |
| bandScores.AB-002[2][0] | "range" |
| bandScores.AB-002[2][1] | 6 |
| bandScores.AB-002[2][2] | 12 |
| bandScores.AB-002[2][3] | 75 |
| bandScores.AB-002[3][0] | "gte" |
| bandScores.AB-002[3][1] | 12 |
| bandScores.AB-002[3][2] | 90 |
| bandScores.AB-003[0][0] | "lt" |
| bandScores.AB-003[0][1] | 1.5 |
| bandScores.AB-003[0][2] | 90 |
| bandScores.AB-003[1][0] | "range" |
| bandScores.AB-003[1][1] | 1.5 |
| bandScores.AB-003[1][2] | 2.5 |
| bandScores.AB-003[1][3] | 75 |
| bandScores.AB-003[2][0] | "range" |
| bandScores.AB-003[2][1] | 2.5 |
| bandScores.AB-003[2][2] | 3.5 |
| bandScores.AB-003[2][3] | 55 |
| bandScores.AB-003[3][0] | "gte" |
| bandScores.AB-003[3][1] | 3.5 |
| bandScores.AB-003[3][2] | 30 |
| bandScores.AB-004[0][0] | "lt" |
| bandScores.AB-004[0][1] | 5 |
| bandScores.AB-004[0][2] | 40 |
| bandScores.AB-004[1][0] | "range" |
| bandScores.AB-004[1][1] | 5 |
| bandScores.AB-004[1][2] | 10 |
| bandScores.AB-004[1][3] | 60 |
| bandScores.AB-004[2][0] | "range" |
| bandScores.AB-004[2][1] | 10 |
| bandScores.AB-004[2][2] | 15 |
| bandScores.AB-004[2][3] | 75 |
| bandScores.AB-004[3][0] | "gte" |
| bandScores.AB-004[3][1] | 15 |
| bandScores.AB-004[3][2] | 90 |
| bandScores.AB-005[0][0] | "lt" |
| bandScores.AB-005[0][1] | 60 |
| bandScores.AB-005[0][2] | 40 |
| bandScores.AB-005[1][0] | "range" |
| bandScores.AB-005[1][1] | 60 |
| bandScores.AB-005[1][2] | 75 |
| bandScores.AB-005[1][3] | 60 |
| bandScores.AB-005[2][0] | "range" |
| bandScores.AB-005[2][1] | 75 |
| bandScores.AB-005[2][2] | 90 |
| bandScores.AB-005[2][3] | 75 |
| bandScores.AB-005[3][0] | "gte" |
| bandScores.AB-005[3][1] | 90 |
| bandScores.AB-005[3][2] | 90 |
| bandScores.AB-006[0][0] | "lt" |
| bandScores.AB-006[0][1] | 5 |
| bandScores.AB-006[0][2] | 40 |
| bandScores.AB-006[1][0] | "range" |
| bandScores.AB-006[1][1] | 5 |
| bandScores.AB-006[1][2] | 20 |
| bandScores.AB-006[1][3] | 60 |
| bandScores.AB-006[2][0] | "range" |
| bandScores.AB-006[2][1] | 20 |
| bandScores.AB-006[2][2] | 50 |
| bandScores.AB-006[2][3] | 75 |
| bandScores.AB-006[3][0] | "gte" |
| bandScores.AB-006[3][1] | 50 |
| bandScores.AB-006[3][2] | 90 |
| bandScores.AB-007[0][0] | "lt" |
| bandScores.AB-007[0][1] | 2 |
| bandScores.AB-007[0][2] | 40 |
| bandScores.AB-007[1][0] | "range" |
| bandScores.AB-007[1][1] | 2 |
| bandScores.AB-007[1][2] | 5 |
| bandScores.AB-007[1][3] | 60 |
| bandScores.AB-007[2][0] | "range" |
| bandScores.AB-007[2][1] | 5 |
| bandScores.AB-007[2][2] | 8 |
| bandScores.AB-007[2][3] | 75 |
| bandScores.AB-007[3][0] | "gte" |
| bandScores.AB-007[3][1] | 8 |
| bandScores.AB-007[3][2] | 90 |
| bandScores.AB-008[0][0] | "lt" |
| bandScores.AB-008[0][1] | 6 |
| bandScores.AB-008[0][2] | 40 |
| bandScores.AB-008[1][0] | "range" |
| bandScores.AB-008[1][1] | 6 |
| bandScores.AB-008[1][2] | 10 |
| bandScores.AB-008[1][3] | 60 |
| bandScores.AB-008[2][0] | "range" |
| bandScores.AB-008[2][1] | 10 |
| bandScores.AB-008[2][2] | 14 |
| bandScores.AB-008[2][3] | 75 |
| bandScores.AB-008[3][0] | "gte" |
| bandScores.AB-008[3][1] | 14 |
| bandScores.AB-008[3][2] | 90 |
| bandScores.AB-009[0][0] | "lt" |
| bandScores.AB-009[0][1] | 10 |
| bandScores.AB-009[0][2] | 90 |
| bandScores.AB-009[1][0] | "range" |
| bandScores.AB-009[1][1] | 10 |
| bandScores.AB-009[1][2] | 16 |
| bandScores.AB-009[1][3] | 75 |
| bandScores.AB-009[2][0] | "range" |
| bandScores.AB-009[2][1] | 16 |
| bandScores.AB-009[2][2] | 24 |
| bandScores.AB-009[2][3] | 55 |
| bandScores.AB-009[3][0] | "gte" |
| bandScores.AB-009[3][1] | 24 |
| bandScores.AB-009[3][2] | 30 |
| bandScores.AB-010[0][0] | "lt" |
| bandScores.AB-010[0][1] | 30 |
| bandScores.AB-010[0][2] | 90 |
| bandScores.AB-010[1][0] | "range" |
| bandScores.AB-010[1][1] | 30 |
| bandScores.AB-010[1][2] | 60 |
| bandScores.AB-010[1][3] | 75 |
| bandScores.AB-010[2][0] | "range" |
| bandScores.AB-010[2][1] | 60 |
| bandScores.AB-010[2][2] | 90 |
| bandScores.AB-010[2][3] | 55 |
| bandScores.AB-010[3][0] | "gte" |
| bandScores.AB-010[3][1] | 90 |
| bandScores.AB-010[3][2] | 30 |
| bandScores.AB-011[0][0] | "lt" |
| bandScores.AB-011[0][1] | 4 |
| bandScores.AB-011[0][2] | 90 |
| bandScores.AB-011[1][0] | "range" |
| bandScores.AB-011[1][1] | 4 |
| bandScores.AB-011[1][2] | 7 |
| bandScores.AB-011[1][3] | 75 |
| bandScores.AB-011[2][0] | "range" |
| bandScores.AB-011[2][1] | 7 |
| bandScores.AB-011[2][2] | 10 |
| bandScores.AB-011[2][3] | 55 |
| bandScores.AB-011[3][0] | "gte" |
| bandScores.AB-011[3][1] | 10 |
| bandScores.AB-011[3][2] | 30 |
| bandScores.AB-012[0][0] | "lt" |
| bandScores.AB-012[0][1] | 10 |
| bandScores.AB-012[0][2] | 40 |
| bandScores.AB-012[1][0] | "range" |
| bandScores.AB-012[1][1] | 10 |
| bandScores.AB-012[1][2] | 20 |
| bandScores.AB-012[1][3] | 60 |
| bandScores.AB-012[2][0] | "range" |
| bandScores.AB-012[2][1] | 20 |
| bandScores.AB-012[2][2] | 30 |
| bandScores.AB-012[2][3] | 75 |
| bandScores.AB-012[3][0] | "gte" |
| bandScores.AB-012[3][1] | 30 |
| bandScores.AB-012[3][2] | 90 |
| calibratedBandTables.ev-native.AB-004[0][0] | "lt" |
| calibratedBandTables.ev-native.AB-004[0][1] | 3 |
| calibratedBandTables.ev-native.AB-004[0][2] | 40 |
| calibratedBandTables.ev-native.AB-004[1][0] | "range" |
| calibratedBandTables.ev-native.AB-004[1][1] | 3 |
| calibratedBandTables.ev-native.AB-004[1][2] | 8 |
| calibratedBandTables.ev-native.AB-004[1][3] | 60 |
| calibratedBandTables.ev-native.AB-004[2][0] | "range" |
| calibratedBandTables.ev-native.AB-004[2][1] | 8 |
| calibratedBandTables.ev-native.AB-004[2][2] | 13 |
| calibratedBandTables.ev-native.AB-004[2][3] | 75 |
| calibratedBandTables.ev-native.AB-004[3][0] | "gte" |
| calibratedBandTables.ev-native.AB-004[3][1] | 13 |
| calibratedBandTables.ev-native.AB-004[3][2] | 90 |
| calibratedBandTables.ev-native.AB-009[0][0] | "lt" |
| calibratedBandTables.ev-native.AB-009[0][1] | 15 |
| calibratedBandTables.ev-native.AB-009[0][2] | 90 |
| calibratedBandTables.ev-native.AB-009[1][0] | "range" |
| calibratedBandTables.ev-native.AB-009[1][1] | 15 |
| calibratedBandTables.ev-native.AB-009[1][2] | 25 |
| calibratedBandTables.ev-native.AB-009[1][3] | 75 |
| calibratedBandTables.ev-native.AB-009[2][0] | "range" |
| calibratedBandTables.ev-native.AB-009[2][1] | 25 |
| calibratedBandTables.ev-native.AB-009[2][2] | 40 |
| calibratedBandTables.ev-native.AB-009[2][3] | 55 |
| calibratedBandTables.ev-native.AB-009[3][0] | "gte" |
| calibratedBandTables.ev-native.AB-009[3][1] | 40 |
| calibratedBandTables.ev-native.AB-009[3][2] | 30 |
| calibratedBandTables.tier-1-supplier.AB-005[0][0] | "lt" |
| calibratedBandTables.tier-1-supplier.AB-005[0][1] | 70 |
| calibratedBandTables.tier-1-supplier.AB-005[0][2] | 40 |
| calibratedBandTables.tier-1-supplier.AB-005[1][0] | "range" |
| calibratedBandTables.tier-1-supplier.AB-005[1][1] | 70 |
| calibratedBandTables.tier-1-supplier.AB-005[1][2] | 80 |
| calibratedBandTables.tier-1-supplier.AB-005[1][3] | 60 |
| calibratedBandTables.tier-1-supplier.AB-005[2][0] | "range" |
| calibratedBandTables.tier-1-supplier.AB-005[2][1] | 80 |
| calibratedBandTables.tier-1-supplier.AB-005[2][2] | 90 |
| calibratedBandTables.tier-1-supplier.AB-005[2][3] | 75 |
| calibratedBandTables.tier-1-supplier.AB-005[3][0] | "gte" |
| calibratedBandTables.tier-1-supplier.AB-005[3][1] | 90 |
| calibratedBandTables.tier-1-supplier.AB-005[3][2] | 90 |
| contractVersion | "IES-017 v1.0 (D17 normative) \u2014 PROPOSED, NOT AUTHORITY" *(frozen verbatim value; the embedded self-label is historical wording, reconciled by the DEC-D25 ACCEPT - document 05)* |
| profile | "automobile-calibration-1.0.0" |
| program | "v3.0 Engine Certification Program" |
| segments.commercial-vehicles.leverageAlert | 3.0 |
| segments.commercial-vehicles.w[0] | 0.25 |
| segments.commercial-vehicles.w[1] | 0.15 |
| segments.commercial-vehicles.w[2] | 0.25 |
| segments.commercial-vehicles.w[3] | 0.2 |
| segments.commercial-vehicles.w[4] | 0.1 |
| segments.commercial-vehicles.w[5] | 0.05 |
| segments.ev-native.leverageAlert | 3.5 |
| segments.ev-native.w[0] | 0.3 |
| segments.ev-native.w[1] | 0.25 |
| segments.ev-native.w[2] | 0.2 |
| segments.ev-native.w[3] | 0.1 |
| segments.ev-native.w[4] | 0.1 |
| segments.ev-native.w[5] | 0.05 |
| segments.mass-market-oem.leverageAlert | 3.0 |
| segments.mass-market-oem.w[0] | 0.25 |
| segments.mass-market-oem.w[1] | 0.2 |
| segments.mass-market-oem.w[2] | 0.25 |
| segments.mass-market-oem.w[3] | 0.15 |
| segments.mass-market-oem.w[4] | 0.1 |
| segments.mass-market-oem.w[5] | 0.05 |
| segments.premium-oem.leverageAlert | 3.5 |
| segments.premium-oem.w[0] | 0.3 |
| segments.premium-oem.w[1] | 0.15 |
| segments.premium-oem.w[2] | 0.2 |
| segments.premium-oem.w[3] | 0.2 |
| segments.premium-oem.w[4] | 0.1 |
| segments.premium-oem.w[5] | 0.05 |
| segments.tier-1-supplier.leverageAlert | 3.0 |
| segments.tier-1-supplier.w[0] | 0.25 |
| segments.tier-1-supplier.w[1] | 0.2 |
| segments.tier-1-supplier.w[2] | 0.25 |
| segments.tier-1-supplier.w[3] | 0.15 |
| segments.tier-1-supplier.w[4] | 0.1 |
| segments.tier-1-supplier.w[5] | 0.05 |
| standard | "IES-017" |
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
| Calibration file (field-for-field) | ies-017-automobile/calibration/automobile-calibration-1.0.0.json | e3f84ede6f5e89580aa451a689c0b5689cf8674e |
| Pack calibration contract | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| D25 field-for-field verification | governance/iips/DEC-D25-TIER3-EVIDENTIARY-STANDARD.md | cbab4da9ce922aacf45e513954d6e325bb037810 |
| Freeze record | ies-017-automobile/IES-017_FREEZE_MANIFEST.json | a7d1190edbd8bf0bfc5b852da466c5e03b6f2cd3 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
