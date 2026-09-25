# IES-020 AUTHORITY REVIEW.md 09 CALIBRATION

**Status:** NEW — created under D36 Tier-3 Documentation-Parity Execution Authority.

**Provenance:** New documentation/evidence created during the D36 Tier-3 documentation-parity programme. This file is not recovered historical evidence and must not be represented as such.

**Authority:** `DEC-D36-TIER3-DOCUMENTATION-PARITY-AUTHORITY`.

**Execution semantics:** This artifact is subject to D15 role separation + clean-workspace reproducibility and D16 evidence semantics. No organizational, external, third-party, or accredited independence is claimed.

**Certification boundary:** Creation of this artifact does not constitute A2 → A1 promotion, Integration Verification Matrix amendment, certification, release/tag authorization, or independent verification.

---

**Modification provenance (2026-09-05):** MODIFIED `D36-NEW-EVIDENCE` (provenance class 3 of DEC-D36). Substantive content added to this document under the D36-successor 57-document authoring + product-mutation authority, durably recorded at governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33` (authority instrument `governance/iips/D7-TIER3-PARITY-D36-SUCCESSOR-57-DOCUMENT-AUTHORITY-2026-09-05.md`, blob `317c78536403185a39326848fa4fd87c3855250e`). Document identity, slot, and class are preserved (R1); the original D36 provenance block above is retained verbatim. All substantive values in this document derive, with per-claim citations, from the pinned frozen source assets of engine IES-020 at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f`. This file remains new documentation dated at modification - never recovered historical evidence - and is subject to D15 role separation + clean-workspace reproducibility.

**INDEPENDENCE DISCLOSURE (programme authority, binding on every remediation artifact):** No organizational, external, third-party, or accredited independence exists for this programme or for this document. D7-TIER3-INDEPENDENCE remains unchanged (OPEN/negative). This document is not independent verification and confers no independence claim. Evidence-class discipline (repository evidence / live-UI evidence / inferred capability / certified capability) is preserved; every substantive claim below carries its source citation.

**Remediation boundary:** This document asserts no certification, no parity, no A2 -> A1 promotion, no release/tag authorization, and no methodology change (W8/W9). Authoring/remediation does not establish parity; the separately authorized substantive re-review remains mandatory and pending.

---

# Document 09 - CALIBRATION (IES-020 remediated content)

## 1. Calibration identity (frozen file header, field-for-field)

| Key | Frozen value |
| --- | --- |
| profile | materials-metals-calibration-1.0.0 |
| standard | IES-020 |
| version | 1.0.0 |
| program | v3.0 Engine Certification Program |
| contractVersion | IES-020 v1.0 (D20 normative) |

Source: `ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json` @ `ceea1d5fe7c9...` - 262 leaves total (every scalar counted; the complete leaf enumeration is §8). DEC-D25 §4 verifies this calibration "matches the accepted pack contract" for the pack §4 contract.

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
| `base-metals` | 0.25 | 0.20 | 0.25 | 0.15 | 0.10 | 0.05 | 1.00 | 3.5 |
| `diversified-miners` | 0.25 | 0.20 | 0.25 | 0.15 | 0.10 | 0.05 | 1.00 | 3.0 |
| `precious-metals` | 0.30 | 0.15 | 0.20 | 0.20 | 0.10 | 0.05 | 1.00 | 2.5 |
| `specialty-materials` | 0.30 | 0.20 | 0.20 | 0.15 | 0.10 | 0.05 | 1.00 | 3.0 |
| `steel-producers` | 0.25 | 0.15 | 0.25 | 0.20 | 0.10 | 0.05 | 1.00 | 3.0 |

## 4. archetypeRisk (complete: 6 entries)

| Archetype | Risk multiplier |
| --- | --- |
| `hybrid` | 1.0 |
| `integrated` | 1.0 |
| `processor` | 0.9 |
| `pure-play` | 1.1 |
| `recycling` | 0.9 |
| `royalty` | 0.8 |

## 5. bandScores (complete: 12 baseline band tables)

| Metric | Field | Baseline band table | Cardinality |
| --- | --- | --- | --- |
| MM-001 | ebitdaMargin | x < 10 -> 40 ; 10 <= x < 20 -> 60 ; 20 <= x < 30 -> 75 ; x >= 30 -> 90 | 4 bands |
| MM-002 | revenueGrowth | x < 0 -> 40 ; 0 <= x < 8 -> 60 ; 8 <= x < 15 -> 75 ; x >= 15 -> 90 | 4 bands |
| MM-003 | debtEbitda | x < 1.5 -> 90 ; 1.5 <= x < 2.5 -> 75 ; 2.5 <= x < 3.5 -> 55 ; x >= 3.5 -> 30 | 4 bands |
| MM-004 | reserveLife | x < 5 -> 40 ; 5 <= x < 12 -> 60 ; 12 <= x < 20 -> 75 ; x >= 20 -> 90 | 4 bands |
| MM-005 | cashCostCurve | x < 25 -> 90 ; 25 <= x < 50 -> 75 ; 50 <= x < 75 -> 55 ; x >= 75 -> 30 | 4 bands |
| MM-006 | realizedPriceSpread | x < 95 -> 40 ; 95 <= x < 100 -> 60 ; 100 <= x < 105 -> 75 ; x >= 105 -> 90 | 4 bands |
| MM-007 | fcfYield | x < 2 -> 40 ; 2 <= x < 5 -> 60 ; 5 <= x < 8 -> 75 ; x >= 8 -> 90 | 4 bands |
| MM-008 | roic | x < 6 -> 40 ; 6 <= x < 10 -> 60 ; 10 <= x < 14 -> 75 ; x >= 14 -> 90 | 4 bands |
| MM-009 | capexIntensity | x < 10 -> 90 ; 10 <= x < 16 -> 75 ; 16 <= x < 24 -> 55 ; x >= 24 -> 30 | 4 bands |
| MM-010 | inventoryDays | x < 30 -> 90 ; 30 <= x < 60 -> 75 ; 60 <= x < 90 -> 55 ; x >= 90 -> 30 | 4 bands |
| MM-011 | evEbitda | x < 4 -> 90 ; 4 <= x < 7 -> 75 ; 7 <= x < 10 -> 55 ; x >= 10 -> 30 | 4 bands |
| MM-012 | recyclingInputMix | x < 10 -> 40 ; 10 <= x < 30 -> 60 ; 30 <= x < 60 -> 75 ; x >= 60 -> 90 | 4 bands |

## 6. calibratedBandTables (complete: engine-specific)

| Subsegment | Metric | Calibrated band table | Invariant |
| --- | --- | --- | --- |
| `precious-metals` | MM-004 | x < 8 -> 40 ; 8 <= x < 15 -> 60 ; 15 <= x < 25 -> 75 ; x >= 25 -> 90 | 4 bands (== baseline cardinality) |
| `specialty-materials` | MM-012 | x < 5 -> 40 ; 5 <= x < 15 -> 60 ; 15 <= x < 40 -> 75 ; x >= 40 -> 90 | 4 bands (== baseline cardinality) |
| `steel-producers` | MM-005 | x < 40 -> 90 ; 40 <= x < 60 -> 75 ; 60 <= x < 80 -> 55 ; x >= 80 -> 30 | 4 bands (== baseline cardinality) |

## 7. Source reconciliation (citation convention)

HISTORICAL pack wording (§0 data-authority row, quoted): "| Data authority | **PENDING** — all fixtures PROPOSED synthetic (IES-015/016/017 convention) |". Current authority: DEC-D25 ACCEPT (`D20 v1.0`, fresh forward-looking) + the FROZEN manifest (FROZEN, 2026-08-29; methodologyVersion "IES-020 v1.0 (D20 normative contract)"). The pack is not edited; history is not rewritten.

## 8. Complete leaf enumeration (262 leaves)

Every leaf of the frozen calibration JSON, in path order (values verbatim):

| Leaf path | Frozen value |
| --- | --- |
| archetypeRisk.hybrid | 1.0 |
| archetypeRisk.integrated | 1.0 |
| archetypeRisk.processor | 0.9 |
| archetypeRisk.pure-play | 1.1 |
| archetypeRisk.recycling | 0.9 |
| archetypeRisk.royalty | 0.8 |
| bandScores.MM-001[0][0] | "lt" |
| bandScores.MM-001[0][1] | 10 |
| bandScores.MM-001[0][2] | 40 |
| bandScores.MM-001[1][0] | "range" |
| bandScores.MM-001[1][1] | 10 |
| bandScores.MM-001[1][2] | 20 |
| bandScores.MM-001[1][3] | 60 |
| bandScores.MM-001[2][0] | "range" |
| bandScores.MM-001[2][1] | 20 |
| bandScores.MM-001[2][2] | 30 |
| bandScores.MM-001[2][3] | 75 |
| bandScores.MM-001[3][0] | "gte" |
| bandScores.MM-001[3][1] | 30 |
| bandScores.MM-001[3][2] | 90 |
| bandScores.MM-002[0][0] | "lt" |
| bandScores.MM-002[0][1] | 0 |
| bandScores.MM-002[0][2] | 40 |
| bandScores.MM-002[1][0] | "range" |
| bandScores.MM-002[1][1] | 0 |
| bandScores.MM-002[1][2] | 8 |
| bandScores.MM-002[1][3] | 60 |
| bandScores.MM-002[2][0] | "range" |
| bandScores.MM-002[2][1] | 8 |
| bandScores.MM-002[2][2] | 15 |
| bandScores.MM-002[2][3] | 75 |
| bandScores.MM-002[3][0] | "gte" |
| bandScores.MM-002[3][1] | 15 |
| bandScores.MM-002[3][2] | 90 |
| bandScores.MM-003[0][0] | "lt" |
| bandScores.MM-003[0][1] | 1.5 |
| bandScores.MM-003[0][2] | 90 |
| bandScores.MM-003[1][0] | "range" |
| bandScores.MM-003[1][1] | 1.5 |
| bandScores.MM-003[1][2] | 2.5 |
| bandScores.MM-003[1][3] | 75 |
| bandScores.MM-003[2][0] | "range" |
| bandScores.MM-003[2][1] | 2.5 |
| bandScores.MM-003[2][2] | 3.5 |
| bandScores.MM-003[2][3] | 55 |
| bandScores.MM-003[3][0] | "gte" |
| bandScores.MM-003[3][1] | 3.5 |
| bandScores.MM-003[3][2] | 30 |
| bandScores.MM-004[0][0] | "lt" |
| bandScores.MM-004[0][1] | 5 |
| bandScores.MM-004[0][2] | 40 |
| bandScores.MM-004[1][0] | "range" |
| bandScores.MM-004[1][1] | 5 |
| bandScores.MM-004[1][2] | 12 |
| bandScores.MM-004[1][3] | 60 |
| bandScores.MM-004[2][0] | "range" |
| bandScores.MM-004[2][1] | 12 |
| bandScores.MM-004[2][2] | 20 |
| bandScores.MM-004[2][3] | 75 |
| bandScores.MM-004[3][0] | "gte" |
| bandScores.MM-004[3][1] | 20 |
| bandScores.MM-004[3][2] | 90 |
| bandScores.MM-005[0][0] | "lt" |
| bandScores.MM-005[0][1] | 25 |
| bandScores.MM-005[0][2] | 90 |
| bandScores.MM-005[1][0] | "range" |
| bandScores.MM-005[1][1] | 25 |
| bandScores.MM-005[1][2] | 50 |
| bandScores.MM-005[1][3] | 75 |
| bandScores.MM-005[2][0] | "range" |
| bandScores.MM-005[2][1] | 50 |
| bandScores.MM-005[2][2] | 75 |
| bandScores.MM-005[2][3] | 55 |
| bandScores.MM-005[3][0] | "gte" |
| bandScores.MM-005[3][1] | 75 |
| bandScores.MM-005[3][2] | 30 |
| bandScores.MM-006[0][0] | "lt" |
| bandScores.MM-006[0][1] | 95 |
| bandScores.MM-006[0][2] | 40 |
| bandScores.MM-006[1][0] | "range" |
| bandScores.MM-006[1][1] | 95 |
| bandScores.MM-006[1][2] | 100 |
| bandScores.MM-006[1][3] | 60 |
| bandScores.MM-006[2][0] | "range" |
| bandScores.MM-006[2][1] | 100 |
| bandScores.MM-006[2][2] | 105 |
| bandScores.MM-006[2][3] | 75 |
| bandScores.MM-006[3][0] | "gte" |
| bandScores.MM-006[3][1] | 105 |
| bandScores.MM-006[3][2] | 90 |
| bandScores.MM-007[0][0] | "lt" |
| bandScores.MM-007[0][1] | 2 |
| bandScores.MM-007[0][2] | 40 |
| bandScores.MM-007[1][0] | "range" |
| bandScores.MM-007[1][1] | 2 |
| bandScores.MM-007[1][2] | 5 |
| bandScores.MM-007[1][3] | 60 |
| bandScores.MM-007[2][0] | "range" |
| bandScores.MM-007[2][1] | 5 |
| bandScores.MM-007[2][2] | 8 |
| bandScores.MM-007[2][3] | 75 |
| bandScores.MM-007[3][0] | "gte" |
| bandScores.MM-007[3][1] | 8 |
| bandScores.MM-007[3][2] | 90 |
| bandScores.MM-008[0][0] | "lt" |
| bandScores.MM-008[0][1] | 6 |
| bandScores.MM-008[0][2] | 40 |
| bandScores.MM-008[1][0] | "range" |
| bandScores.MM-008[1][1] | 6 |
| bandScores.MM-008[1][2] | 10 |
| bandScores.MM-008[1][3] | 60 |
| bandScores.MM-008[2][0] | "range" |
| bandScores.MM-008[2][1] | 10 |
| bandScores.MM-008[2][2] | 14 |
| bandScores.MM-008[2][3] | 75 |
| bandScores.MM-008[3][0] | "gte" |
| bandScores.MM-008[3][1] | 14 |
| bandScores.MM-008[3][2] | 90 |
| bandScores.MM-009[0][0] | "lt" |
| bandScores.MM-009[0][1] | 10 |
| bandScores.MM-009[0][2] | 90 |
| bandScores.MM-009[1][0] | "range" |
| bandScores.MM-009[1][1] | 10 |
| bandScores.MM-009[1][2] | 16 |
| bandScores.MM-009[1][3] | 75 |
| bandScores.MM-009[2][0] | "range" |
| bandScores.MM-009[2][1] | 16 |
| bandScores.MM-009[2][2] | 24 |
| bandScores.MM-009[2][3] | 55 |
| bandScores.MM-009[3][0] | "gte" |
| bandScores.MM-009[3][1] | 24 |
| bandScores.MM-009[3][2] | 30 |
| bandScores.MM-010[0][0] | "lt" |
| bandScores.MM-010[0][1] | 30 |
| bandScores.MM-010[0][2] | 90 |
| bandScores.MM-010[1][0] | "range" |
| bandScores.MM-010[1][1] | 30 |
| bandScores.MM-010[1][2] | 60 |
| bandScores.MM-010[1][3] | 75 |
| bandScores.MM-010[2][0] | "range" |
| bandScores.MM-010[2][1] | 60 |
| bandScores.MM-010[2][2] | 90 |
| bandScores.MM-010[2][3] | 55 |
| bandScores.MM-010[3][0] | "gte" |
| bandScores.MM-010[3][1] | 90 |
| bandScores.MM-010[3][2] | 30 |
| bandScores.MM-011[0][0] | "lt" |
| bandScores.MM-011[0][1] | 4 |
| bandScores.MM-011[0][2] | 90 |
| bandScores.MM-011[1][0] | "range" |
| bandScores.MM-011[1][1] | 4 |
| bandScores.MM-011[1][2] | 7 |
| bandScores.MM-011[1][3] | 75 |
| bandScores.MM-011[2][0] | "range" |
| bandScores.MM-011[2][1] | 7 |
| bandScores.MM-011[2][2] | 10 |
| bandScores.MM-011[2][3] | 55 |
| bandScores.MM-011[3][0] | "gte" |
| bandScores.MM-011[3][1] | 10 |
| bandScores.MM-011[3][2] | 30 |
| bandScores.MM-012[0][0] | "lt" |
| bandScores.MM-012[0][1] | 10 |
| bandScores.MM-012[0][2] | 40 |
| bandScores.MM-012[1][0] | "range" |
| bandScores.MM-012[1][1] | 10 |
| bandScores.MM-012[1][2] | 30 |
| bandScores.MM-012[1][3] | 60 |
| bandScores.MM-012[2][0] | "range" |
| bandScores.MM-012[2][1] | 30 |
| bandScores.MM-012[2][2] | 60 |
| bandScores.MM-012[2][3] | 75 |
| bandScores.MM-012[3][0] | "gte" |
| bandScores.MM-012[3][1] | 60 |
| bandScores.MM-012[3][2] | 90 |
| calibratedBandTables.precious-metals.MM-004[0][0] | "lt" |
| calibratedBandTables.precious-metals.MM-004[0][1] | 8 |
| calibratedBandTables.precious-metals.MM-004[0][2] | 40 |
| calibratedBandTables.precious-metals.MM-004[1][0] | "range" |
| calibratedBandTables.precious-metals.MM-004[1][1] | 8 |
| calibratedBandTables.precious-metals.MM-004[1][2] | 15 |
| calibratedBandTables.precious-metals.MM-004[1][3] | 60 |
| calibratedBandTables.precious-metals.MM-004[2][0] | "range" |
| calibratedBandTables.precious-metals.MM-004[2][1] | 15 |
| calibratedBandTables.precious-metals.MM-004[2][2] | 25 |
| calibratedBandTables.precious-metals.MM-004[2][3] | 75 |
| calibratedBandTables.precious-metals.MM-004[3][0] | "gte" |
| calibratedBandTables.precious-metals.MM-004[3][1] | 25 |
| calibratedBandTables.precious-metals.MM-004[3][2] | 90 |
| calibratedBandTables.specialty-materials.MM-012[0][0] | "lt" |
| calibratedBandTables.specialty-materials.MM-012[0][1] | 5 |
| calibratedBandTables.specialty-materials.MM-012[0][2] | 40 |
| calibratedBandTables.specialty-materials.MM-012[1][0] | "range" |
| calibratedBandTables.specialty-materials.MM-012[1][1] | 5 |
| calibratedBandTables.specialty-materials.MM-012[1][2] | 15 |
| calibratedBandTables.specialty-materials.MM-012[1][3] | 60 |
| calibratedBandTables.specialty-materials.MM-012[2][0] | "range" |
| calibratedBandTables.specialty-materials.MM-012[2][1] | 15 |
| calibratedBandTables.specialty-materials.MM-012[2][2] | 40 |
| calibratedBandTables.specialty-materials.MM-012[2][3] | 75 |
| calibratedBandTables.specialty-materials.MM-012[3][0] | "gte" |
| calibratedBandTables.specialty-materials.MM-012[3][1] | 40 |
| calibratedBandTables.specialty-materials.MM-012[3][2] | 90 |
| calibratedBandTables.steel-producers.MM-005[0][0] | "lt" |
| calibratedBandTables.steel-producers.MM-005[0][1] | 40 |
| calibratedBandTables.steel-producers.MM-005[0][2] | 90 |
| calibratedBandTables.steel-producers.MM-005[1][0] | "range" |
| calibratedBandTables.steel-producers.MM-005[1][1] | 40 |
| calibratedBandTables.steel-producers.MM-005[1][2] | 60 |
| calibratedBandTables.steel-producers.MM-005[1][3] | 75 |
| calibratedBandTables.steel-producers.MM-005[2][0] | "range" |
| calibratedBandTables.steel-producers.MM-005[2][1] | 60 |
| calibratedBandTables.steel-producers.MM-005[2][2] | 80 |
| calibratedBandTables.steel-producers.MM-005[2][3] | 55 |
| calibratedBandTables.steel-producers.MM-005[3][0] | "gte" |
| calibratedBandTables.steel-producers.MM-005[3][1] | 80 |
| calibratedBandTables.steel-producers.MM-005[3][2] | 30 |
| contractVersion | "IES-020 v1.0 (D20 normative)" |
| profile | "materials-metals-calibration-1.0.0" |
| program | "v3.0 Engine Certification Program" |
| segments.base-metals.leverageAlert | 3.5 |
| segments.base-metals.w[0] | 0.25 |
| segments.base-metals.w[1] | 0.2 |
| segments.base-metals.w[2] | 0.25 |
| segments.base-metals.w[3] | 0.15 |
| segments.base-metals.w[4] | 0.1 |
| segments.base-metals.w[5] | 0.05 |
| segments.diversified-miners.leverageAlert | 3.0 |
| segments.diversified-miners.w[0] | 0.25 |
| segments.diversified-miners.w[1] | 0.2 |
| segments.diversified-miners.w[2] | 0.25 |
| segments.diversified-miners.w[3] | 0.15 |
| segments.diversified-miners.w[4] | 0.1 |
| segments.diversified-miners.w[5] | 0.05 |
| segments.precious-metals.leverageAlert | 2.5 |
| segments.precious-metals.w[0] | 0.3 |
| segments.precious-metals.w[1] | 0.15 |
| segments.precious-metals.w[2] | 0.2 |
| segments.precious-metals.w[3] | 0.2 |
| segments.precious-metals.w[4] | 0.1 |
| segments.precious-metals.w[5] | 0.05 |
| segments.specialty-materials.leverageAlert | 3.0 |
| segments.specialty-materials.w[0] | 0.3 |
| segments.specialty-materials.w[1] | 0.2 |
| segments.specialty-materials.w[2] | 0.2 |
| segments.specialty-materials.w[3] | 0.15 |
| segments.specialty-materials.w[4] | 0.1 |
| segments.specialty-materials.w[5] | 0.05 |
| segments.steel-producers.leverageAlert | 3.0 |
| segments.steel-producers.w[0] | 0.25 |
| segments.steel-producers.w[1] | 0.15 |
| segments.steel-producers.w[2] | 0.25 |
| segments.steel-producers.w[3] | 0.2 |
| segments.steel-producers.w[4] | 0.1 |
| segments.steel-producers.w[5] | 0.05 |
| standard | "IES-020" |
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
| Calibration file (field-for-field) | ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json | ceea1d5fe7c9e4c56f76f6d34efcbbfef311cccf |
| Pack calibration contract | ies-020-materials-metals/MATERIALS_METALS_DISCOVERY_PACK.md | 7677ec47a335d0157411830a80aba29912dc97b5 |
| D25 field-for-field verification | governance/iips/DEC-D25-TIER3-EVIDENTIARY-STANDARD.md | cbab4da9ce922aacf45e513954d6e325bb037810 |
| Freeze record | ies-020-materials-metals/IES-020_FREEZE_MANIFEST.json | 0d43a538734c9c13645778b0eadfbd978730f637 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
