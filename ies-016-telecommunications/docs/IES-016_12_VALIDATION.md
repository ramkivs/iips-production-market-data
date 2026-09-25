# IES-016 12 VALIDATION

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

# Document 12 - VALIDATION (IES-016 remediated content)

## 1. Validation assets (frozen; basis)

Expected outputs basis: `telecommunications-golden-reference-1.0.0`; golden dataset id: `telecommunications-golden-reference-1.0.0`; replay dataset id: `telecommunications-replay-dataset-1.0.0`; fixtures id: `telecommunications-validation-fixtures-1.0.0`.

| Asset | Path | Pinned blob |
| --- | --- | --- |
| gol | ies-016-telecommunications/fixtures/telecommunications-golden-reference-1.0.0.json | f0dfc647b8e0220d04a241902a82899e3a667393 |
| cal | ies-016-telecommunications/calibration/telecommunications-calibration-1.0.0.json | 178160fcbe0a30975c6796ac22c73a9bd03ab91a |
| gen | ies-016-telecommunications/contract-tests/generate_expected_outputs.py | c69ce2eb5d989f63a0618406b103dc398ebc4948 |
| exp | ies-016-telecommunications/expected-outputs/telecommunications-expected-outputs-1.0.0.json | 0d45ffc44df6d61a6f95dac15a12cb6f88be3155 |
| rep | ies-016-telecommunications/replay-datasets/telecommunications-replay-dataset-1.0.0.json | ed6bbeb8b127f45ac8c8d99f9baee8c42bd60001 |
| fix | ies-016-telecommunications/fixtures/telecommunications-validation-fixtures-1.0.0.json | 25accdd952a6f774968e51b3a18eb6f4aa1dbf05 |

## 2. The frozen 13-case validation set (complete; certification oracle)

| Case | Composite | Verdict | Pillars (frozen 1dp) | Overrides |
| --- | --- | --- | --- | --- |
| TC-001 | 77.8 | Buy | {"quality": 80.2, "growth": 75.0, "risk": 75.0, "profitability": 83.2, "capitalEfficiency": 75.0, "valuation": 75.0} | - |
| TC-002 | 71.4 | Buy | {"quality": 75.0, "growth": 60.0, "risk": 72.2, "profitability": 83.2, "capitalEfficiency": 75.0, "valuation": 55.0} | - |
| TC-003 | 70.0 | Buy | {"quality": 75.0, "growth": 60.0, "risk": 62.0, "profitability": 83.2, "capitalEfficiency": 75.0, "valuation": 75.0} | - |
| TC-004 | 74.5 | Buy | {"quality": 85.5, "growth": 60.0, "risk": 72.2, "profitability": 83.2, "capitalEfficiency": 75.0, "valuation": 75.0} | - |
| TC-005 | 69.6 | Accumulate | {"quality": 80.2, "growth": 67.5, "risk": 66.0, "profitability": 76.5, "capitalEfficiency": 75.0, "valuation": 55.0} | - |
| TC-006 | 60.5 | Watch | {"quality": 58.5, "growth": 75.0, "risk": 45.0, "profitability": 68.2, "capitalEfficiency": 60.0, "valuation": 55.0} | leverage-breach, competition-pressure, margin-compression |
| TC-007 | 80.0 | Strong Buy | {"quality": 84.8, "growth": 75.0, "risk": 75.2, "profitability": 90.0, "capitalEfficiency": 90.0, "valuation": 55.0} | - |
| TC-008 | 65.1 | Accumulate | {"quality": 74.2, "growth": 60.0, "risk": 67.2, "profitability": 68.2, "capitalEfficiency": 60.0, "valuation": 55.0} | - |
| TC-009 | 68.4 | Accumulate | {"quality": 75.0, "growth": 60.0, "risk": 62.0, "profitability": 75.0, "capitalEfficiency": 75.0, "valuation": 55.0} | - |
| TC-010 | 62.7 | Accumulate | {"quality": 69.8, "growth": 50.0, "risk": 75.2, "profitability": 60.0, "capitalEfficiency": 60.0, "valuation": 55.0} | - |
| TC-011 | 38.6 | Avoid | {"quality": 37.0, "growth": 50.0, "risk": 30.0, "profitability": 40.0, "capitalEfficiency": 40.0, "valuation": 30.0} | leverage-breach, governance |
| TC-012 | 55.0 | Hold | {"quality": 55.0, "growth": 40.0, "risk": 84.0, "profitability": 40.0, "capitalEfficiency": 40.0, "valuation": 75.0} | - |
| TC-013 | 49.5 | Watch | {"quality": 55.0, "growth": 40.0, "risk": 75.2, "profitability": 40.0, "capitalEfficiency": 40.0, "valuation": 30.0} | - |

## 3. Validation fixtures (2 edge cases, complete with frozen expectations)

| Case | Name | Frozen expected | Frozen note (verbatim) |
| --- | --- | --- | --- |
| TC-014 | Missing Primitive (fcfYield null) | 70.3 / Buy | fcfYield omitted -> capitalEfficiency pillar renormalizes over zero available metrics -> 0.0 (never fabricated); composite falls 77.8 -> 70.3. |
| TC-015 | Exact Band Boundaries | 68.2 / Accumulate | Every input sits exactly on a band boundary: lower-inclusive / upper-exclusive applies throughout (e.g. revenueGrowth 5.0 -> [5,10) not [0,5); debtEbitda 2.5 -> [2.5,3.5)). |

## 4. Replay dataset (structure; stored claims labelled as claims)

The replay dataset carries 13 sector records with fields `providerId`, `inputs`, `expected` (composite/verdict/overrides), `reproduced`, `byteIdentical`. The stored `reproduced`/`byteIdentical` markers are stored claims of the freeze record (P1 rule); they are quoted as recorded, not re-adjudicated here. DF-1 qualification (byteIdentical=false, caseDiffs=0; newline-only-ness unproven; mechanical closure requires bundle recomputed*Sha256 values) is carried unchanged.

## 5. Acceptance gates (recorded, all PASS)

The frozen engine acceptance matrix records 16 gates; the validation-critical rows are reproduced verbatim below (full matrix: `ies-016-telecommunications/TELECOMMUNICATIONS_ENGINE_ACCEPTANCE_MATRIX.md` @ `0a4548458230...`).

| # | Gate (verbatim) | Result |
| --- | --- | --- |
| 1 | 13/13 frozen expected outputs reproduced (composite + verdict + overrides + subsegment + archetype) | PASS |
| 2 | Pillars match frozen expected outputs (round-half-to-even at 1dp) | PASS |
| 3 | Effective band-table resolution (calibrated ?? baseline, cardinality invariant) | PASS |
| 4 | Round-half-to-even (TC-012: 55.05 → 55.0) | PASS |
| 5 | Multi-subsegment + hybrid resolution (TC-009) | PASS |
| 6 | Override / min-rank (governance→Avoid; leverage-breach etc.→Watch) | PASS |
| 7 | Missing-data renormalization (TC-014: capitalEfficiency 0.0, never fabricated) | PASS |
| 8 | Band-boundary semantics (TC-015 lower-inclusive/upper-exclusive) | PASS |
| 9 | All 6 verdict bands exercised | PASS |
| 10 | Ontology 8/8 dimensions (CSIP-compatible) | PASS |
| 11 | Evidence complete + replay deterministic | PASS |
| 12 | Leverage alerts + archetype risk applied (TC-005/TC-006) | PASS |
| 13 | Golden regression from the delivery unit (13/13) | PASS |
| 14 | Replay byte-identical across repeated runs | PASS |
| 15 | Replay-dataset integrity (13/13, byte-identical markers) | PASS |
| 16 | Calibration integrity (12 band tables · 5 subsegments · 6 archetypes · 6 verdict bands) | PASS |

## 6. Independent reproduction during this remediation (execution evidence)

The remediation build re-transcribed the calculation chain from the pinned pack contract + calibration + generator and reproduced, value-exactly, all 13 cases (composite, verdict, overrides, subsegment/archetype resolution, pillars) and both edge fixtures for this engine. This is execution evidence of reproducibility at 830bd7218f6a77274e3d58eef09d706a3a99794f, not a new certification of anything.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Frozen validation set + fixtures | ies-016-telecommunications/expected-outputs/telecommunications-expected-outputs-1.0.0.json | 0d45ffc44df6d61a6f95dac15a12cb6f88be3155 |
| Fixtures | ies-016-telecommunications/fixtures/telecommunications-validation-fixtures-1.0.0.json | 25accdd952a6f774968e51b3a18eb6f4aa1dbf05 |
| Replay structure | ies-016-telecommunications/replay-datasets/telecommunications-replay-dataset-1.0.0.json | ed6bbeb8b127f45ac8c8d99f9baee8c42bd60001 |
| Acceptance gates | ies-016-telecommunications/TELECOMMUNICATIONS_ENGINE_ACCEPTANCE_MATRIX.md | 0a45484582300d106c104e093a176d9ba52f6aec |
| Golden inputs | ies-016-telecommunications/fixtures/telecommunications-golden-reference-1.0.0.json | f0dfc647b8e0220d04a241902a82899e3a667393 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
