# IES-017 06 METRIC LIBRARY

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

# Document 06 - METRIC LIBRARY (IES-017 remediated content)

## 1. Metric taxonomy (pack §3 (M1/M2/M3; AB-001..AB-012)) - exactly as consumed

| Code | Field | Unit | Interpretation | Direction |
| --- | --- | --- | --- | --- |
| AB-001 | `ebitdaMargin` | % | EBITDA margin | higher-better |
| AB-002 | `revenueGrowth` | % | Revenue growth (YoY) | higher-better |
| AB-003 | `debtEbitda` | × | Net debt / EBITDA | lower-better |
| AB-004 | `vehicleMargin` | % | Per-vehicle contribution margin | higher-better |
| AB-005 | `capacityUtilization` | % | Plant capacity utilization | higher-better |
| AB-006 | `evMix` | % | EV share of deliveries (transition positioning) | higher-better |
| AB-007 | `fcfYield` | % | Free cash flow yield | higher-better |
| AB-008 | `roic` | % | Return on invested capital | higher-better |
| AB-009 | `capexIntensity` | % | Capex / revenue | lower-better |
| AB-010 | `inventoryDays` | days | Inventory days on hand | lower-better |
| AB-011 | `evEbitda` | × | Enterprise value / EBITDA | lower-better |
| AB-012 | `aftersalesMix` | % | Aftersales / services revenue share | higher-better |

Every metric is optional (nullability): a missing primitive is dropped from its pillar and remaining weights renormalize; an empty pillar scores 0.0 - never fabricated, never NaN (pack §3 (M1/M2/M3; AB-001..AB-012); proven by AB-014).

## 2. Baseline band tables (frozen `bandScores`, complete)

| Metric | Band table (lower-inclusive / upper-exclusive; terminal band inclusive) | Direction |
| --- | --- | --- |
| AB-001 | x < 8 -> 40 ; 8 <= x < 15 -> 60 ; 15 <= x < 22 -> 75 ; x >= 22 -> 90 | higher-better |
| AB-002 | x < 0 -> 40 ; 0 <= x < 6 -> 60 ; 6 <= x < 12 -> 75 ; x >= 12 -> 90 | higher-better |
| AB-003 | x < 1.5 -> 90 ; 1.5 <= x < 2.5 -> 75 ; 2.5 <= x < 3.5 -> 55 ; x >= 3.5 -> 30 | lower-better |
| AB-004 | x < 5 -> 40 ; 5 <= x < 10 -> 60 ; 10 <= x < 15 -> 75 ; x >= 15 -> 90 | higher-better |
| AB-005 | x < 60 -> 40 ; 60 <= x < 75 -> 60 ; 75 <= x < 90 -> 75 ; x >= 90 -> 90 | higher-better |
| AB-006 | x < 5 -> 40 ; 5 <= x < 20 -> 60 ; 20 <= x < 50 -> 75 ; x >= 50 -> 90 | higher-better |
| AB-007 | x < 2 -> 40 ; 2 <= x < 5 -> 60 ; 5 <= x < 8 -> 75 ; x >= 8 -> 90 | higher-better |
| AB-008 | x < 6 -> 40 ; 6 <= x < 10 -> 60 ; 10 <= x < 14 -> 75 ; x >= 14 -> 90 | higher-better |
| AB-009 | x < 10 -> 90 ; 10 <= x < 16 -> 75 ; 16 <= x < 24 -> 55 ; x >= 24 -> 30 | lower-better |
| AB-010 | x < 30 -> 90 ; 30 <= x < 60 -> 75 ; 60 <= x < 90 -> 55 ; x >= 90 -> 30 | lower-better |
| AB-011 | x < 4 -> 90 ; 4 <= x < 7 -> 75 ; 7 <= x < 10 -> 55 ; x >= 10 -> 30 | lower-better |
| AB-012 | x < 10 -> 40 ; 10 <= x < 20 -> 60 ; 20 <= x < 30 -> 75 ; x >= 30 -> 90 | higher-better |

## 3. Calibrated band tables (frozen `calibratedBandTables`, complete, engine-specific)

| Subsegment | Metric | Calibrated table | Semantics |
| --- | --- | --- | --- |
| `ev-native` | AB-004 | x < 3 -> 40 ; 3 <= x < 8 -> 60 ; 8 <= x < 13 -> 75 ; x >= 13 -> 90 | supersedes baseline boundaries AND scores for this subsegment (cardinality preserved: 4 bands) |
| `ev-native` | AB-009 | x < 15 -> 90 ; 15 <= x < 25 -> 75 ; 25 <= x < 40 -> 55 ; x >= 40 -> 30 | supersedes baseline boundaries AND scores for this subsegment (cardinality preserved: 4 bands) |
| `tier-1-supplier` | AB-005 | x < 70 -> 40 ; 70 <= x < 80 -> 60 ; 80 <= x < 90 -> 75 ; x >= 90 -> 90 | supersedes baseline boundaries AND scores for this subsegment (cardinality preserved: 4 bands) |

## 4. Override flag inputs (booleans, optional)

| Input field | Override id | Verdict cap | Observed in golden data |
| --- | --- | --- | --- |
| `governance` | governance | Avoid | yes (AB-011) |
| `recallRisk` | recall-risk | Watch | yes (AB-012) |
| `batteryCostShock` | battery-cost-shock | Watch | no |
| `demandCollapse` | demand-collapse | Watch | yes (AB-012) |
| `capexOverrun` | capex-overrun | Watch | no |
| `marginCompression` | margin-compression | Watch | yes (AB-006) |
| `competitionPressure` | competition-pressure | Watch | yes (AB-006) |

`leverage-breach` is not a flag: it fires automatically when `debtEbitda >= subsegment.leverageAlert` (document 10).

## 5. Pillar membership map

| Metric | Pillar membership (weight) |
| --- | --- |
| AB-001 | profitability (0.55) |
| AB-002 | growth (0.50) |
| AB-003 | risk (0.40) |
| AB-004 | quality (0.35) |
| AB-005 | quality (0.35) |
| AB-006 | growth (0.50) |
| AB-007 | capitalEfficiency (1.00) |
| AB-008 | profitability (0.45) |
| AB-009 | risk (0.25) |
| AB-010 | risk (0.35) |
| AB-011 | valuation (1.00) |
| AB-012 | quality (0.30) |
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Metric taxonomy + nullability | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| Band tables | ies-017-automobile/calibration/automobile-calibration-1.0.0.json | e3f84ede6f5e89580aa451a689c0b5689cf8674e |
| Pillar composition | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| Generator FIELD consumption | ies-017-automobile/contract-tests/generate_expected_outputs.py | ec599ce1aafb26fe645f238e1f953521e60795f8 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
