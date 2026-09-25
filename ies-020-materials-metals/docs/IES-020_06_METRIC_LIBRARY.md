# IES-020 AUTHORITY REVIEW.md 06 METRIC LIBRARY

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

# Document 06 - METRIC LIBRARY (IES-020 remediated content)

## 1. Metric taxonomy (pack §6-8 (M1/M2/M3; MM-001..MM-012)) - exactly as consumed

| Code | Field | Unit | Interpretation | Direction |
| --- | --- | --- | --- | --- |
| MM-001 | `ebitdaMargin` | % | EBITDA margin | higher-better |
| MM-002 | `revenueGrowth` | % | Revenue growth (YoY) | higher-better |
| MM-003 | `debtEbitda` | × | Net debt / EBITDA | lower-better |
| MM-004 | `reserveLife` | years | Proven+probable reserves ÷ annual production | higher-better |
| MM-005 | `cashCostCurve` | % | Cost-curve percentile position | lower-better |
| MM-006 | `realizedPriceSpread` | % | Realized vs benchmark price | higher-better |
| MM-007 | `fcfYield` | % | Free cash flow yield | higher-better |
| MM-008 | `roic` | % | Return on invested capital | higher-better |
| MM-009 | `capexIntensity` | % | Capex / revenue | lower-better |
| MM-010 | `inventoryDays` | days | Inventory days on hand | lower-better |
| MM-011 | `evEbitda` | × | Enterprise value / EBITDA | lower-better |
| MM-012 | `recyclingInputMix` | % | Recycled/scrap input share | higher-better |

Every metric is optional (nullability): a missing primitive is dropped from its pillar and remaining weights renormalize; an empty pillar scores 0.0 - never fabricated, never NaN (pack §6-8 (M1/M2/M3; MM-001..MM-012); proven by MM-014).

## 2. Baseline band tables (frozen `bandScores`, complete)

| Metric | Band table (lower-inclusive / upper-exclusive; terminal band inclusive) | Direction |
| --- | --- | --- |
| MM-001 | x < 10 -> 40 ; 10 <= x < 20 -> 60 ; 20 <= x < 30 -> 75 ; x >= 30 -> 90 | higher-better |
| MM-002 | x < 0 -> 40 ; 0 <= x < 8 -> 60 ; 8 <= x < 15 -> 75 ; x >= 15 -> 90 | higher-better |
| MM-003 | x < 1.5 -> 90 ; 1.5 <= x < 2.5 -> 75 ; 2.5 <= x < 3.5 -> 55 ; x >= 3.5 -> 30 | lower-better |
| MM-004 | x < 5 -> 40 ; 5 <= x < 12 -> 60 ; 12 <= x < 20 -> 75 ; x >= 20 -> 90 | higher-better |
| MM-005 | x < 25 -> 90 ; 25 <= x < 50 -> 75 ; 50 <= x < 75 -> 55 ; x >= 75 -> 30 | lower-better |
| MM-006 | x < 95 -> 40 ; 95 <= x < 100 -> 60 ; 100 <= x < 105 -> 75 ; x >= 105 -> 90 | higher-better |
| MM-007 | x < 2 -> 40 ; 2 <= x < 5 -> 60 ; 5 <= x < 8 -> 75 ; x >= 8 -> 90 | higher-better |
| MM-008 | x < 6 -> 40 ; 6 <= x < 10 -> 60 ; 10 <= x < 14 -> 75 ; x >= 14 -> 90 | higher-better |
| MM-009 | x < 10 -> 90 ; 10 <= x < 16 -> 75 ; 16 <= x < 24 -> 55 ; x >= 24 -> 30 | lower-better |
| MM-010 | x < 30 -> 90 ; 30 <= x < 60 -> 75 ; 60 <= x < 90 -> 55 ; x >= 90 -> 30 | lower-better |
| MM-011 | x < 4 -> 90 ; 4 <= x < 7 -> 75 ; 7 <= x < 10 -> 55 ; x >= 10 -> 30 | lower-better |
| MM-012 | x < 10 -> 40 ; 10 <= x < 30 -> 60 ; 30 <= x < 60 -> 75 ; x >= 60 -> 90 | higher-better |

## 3. Calibrated band tables (frozen `calibratedBandTables`, complete, engine-specific)

| Subsegment | Metric | Calibrated table | Semantics |
| --- | --- | --- | --- |
| `precious-metals` | MM-004 | x < 8 -> 40 ; 8 <= x < 15 -> 60 ; 15 <= x < 25 -> 75 ; x >= 25 -> 90 | supersedes baseline boundaries AND scores for this subsegment (cardinality preserved: 4 bands) |
| `specialty-materials` | MM-012 | x < 5 -> 40 ; 5 <= x < 15 -> 60 ; 15 <= x < 40 -> 75 ; x >= 40 -> 90 | supersedes baseline boundaries AND scores for this subsegment (cardinality preserved: 4 bands) |
| `steel-producers` | MM-005 | x < 40 -> 90 ; 40 <= x < 60 -> 75 ; 60 <= x < 80 -> 55 ; x >= 80 -> 30 | supersedes baseline boundaries AND scores for this subsegment (cardinality preserved: 4 bands) |

Open authority notes (pack §6-8, §28; carried open): Q2 - whether the `cashCostCurve` percentile is an acceptable input primitive (alternative: absolute unit cash cost, which varies by commodity); Q3 - whether `reserveLife` should be commodity-weighted. The implemented contract uses the percentile and unweighted reserveLife (DEC-D25 §4 partial dispositions); no resolution is invented here.

## 4. Override flag inputs (booleans, optional)

| Input field | Override id | Verdict cap | Observed in golden data |
| --- | --- | --- | --- |
| `governance` | governance | Avoid | yes (MM-011) |
| `tailingsFailure` | tailings-failure | Watch | yes (MM-012) |
| `permittingRevocation` | permitting-revocation | Watch | no |
| `strikeDisruption` | strike-disruption | Watch | yes (MM-012) |
| `capexOverrun` | capex-overrun | Watch | no |
| `marginCompression` | margin-compression | Watch | yes (MM-006) |
| `competitionPressure` | competition-pressure | Watch | yes (MM-006) |

`leverage-breach` is not a flag: it fires automatically when `debtEbitda >= subsegment.leverageAlert` (document 10).

## 5. Pillar membership map

| Metric | Pillar membership (weight) |
| --- | --- |
| MM-001 | profitability (0.55) |
| MM-002 | growth (0.50) |
| MM-003 | risk (0.40) |
| MM-004 | quality (0.35) |
| MM-005 | quality (0.35) |
| MM-006 | quality (0.30) |
| MM-007 | capitalEfficiency (1.00) |
| MM-008 | profitability (0.45) |
| MM-009 | risk (0.25) |
| MM-010 | risk (0.35) |
| MM-011 | valuation (1.00) |
| MM-012 | growth (0.50) |
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Metric taxonomy + nullability | ies-020-materials-metals/MATERIALS_METALS_DISCOVERY_PACK.md | 7677ec47a335d0157411830a80aba29912dc97b5 |
| Band tables | ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json | ceea1d5fe7c9e4c56f76f6d34efcbbfef311cccf |
| Pillar composition | ies-020-materials-metals/MATERIALS_METALS_DISCOVERY_PACK.md | 7677ec47a335d0157411830a80aba29912dc97b5 |
| Generator FIELD consumption | ies-020-materials-metals/contract-tests/generate_expected_outputs.py | 2552b6590b75a5bbbc3d5893e07fb27468991e48 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- Q2 (cashCostCurve as input primitive) and Q3 (reserveLife commodity-weighting) remain OPEN; implemented-contract partial dispositions are recorded, not resolutions.
