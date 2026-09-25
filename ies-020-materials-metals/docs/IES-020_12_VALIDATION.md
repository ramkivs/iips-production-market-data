# IES-020 AUTHORITY REVIEW.md 12 VALIDATION

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

# Document 12 - VALIDATION (IES-020 remediated content)

## 1. Validation assets (frozen; basis)

Expected outputs basis: `materials-metals-golden-reference-1.0.0`; golden dataset id: `materials-metals-golden-reference-1.0.0`; replay dataset id: `materials-metals-replay-dataset-1.0.0`; fixtures id: `materials-metals-validation-fixtures-1.0.0`.

| Asset | Path | Pinned blob |
| --- | --- | --- |
| gol | ies-020-materials-metals/fixtures/materials-metals-golden-reference-1.0.0.json | 1b601093cb09d607a7725bfed6b7cc4689c3f1e0 |
| cal | ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json | ceea1d5fe7c9e4c56f76f6d34efcbbfef311cccf |
| gen | ies-020-materials-metals/contract-tests/generate_expected_outputs.py | 2552b6590b75a5bbbc3d5893e07fb27468991e48 |
| exp | ies-020-materials-metals/expected-outputs/materials-metals-expected-outputs-1.0.0.json | 3e67cb6f01fdc7a2459d6f4376e54cfa4b89cf2e |
| rep | ies-020-materials-metals/replay-datasets/materials-metals-replay-dataset-1.0.0.json | 62ace6612c289a38ac6bb75ee5795c56be7650f5 |
| fix | ies-020-materials-metals/fixtures/materials-metals-validation-fixtures-1.0.0.json | 000412669a40a7b36e6bdd85bcbb9196dd5ab2e4 |

## 2. The frozen 13-case validation set (complete; certification oracle)

| Case | Composite | Verdict | Pillars (frozen 1dp) | Overrides |
| --- | --- | --- | --- | --- |
| MM-001 | 82.5 | Strong Buy | {"quality": 90.0, "growth": 67.5, "risk": 81.0, "profitability": 90.0, "capitalEfficiency": 90.0, "valuation": 75.0} | - |
| MM-002 | 76.6 | Buy | {"quality": 75.0, "growth": 67.5, "risk": 75.0, "profitability": 83.2, "capitalEfficiency": 75.0, "valuation": 75.0} | - |
| MM-003 | 73.2 | Buy | {"quality": 85.5, "growth": 50.0, "risk": 90.0, "profitability": 83.2, "capitalEfficiency": 75.0, "valuation": 30.0} | - |
| MM-004 | 68.7 | Accumulate | {"quality": 65.2, "growth": 60.0, "risk": 75.0, "profitability": 66.8, "capitalEfficiency": 75.0, "valuation": 75.0} | - |
| MM-005 | 73.4 | Buy | {"quality": 69.8, "growth": 82.5, "risk": 75.0, "profitability": 81.8, "capitalEfficiency": 75.0, "valuation": 55.0} | - |
| MM-006 | 55.9 | Watch | {"quality": 58.2, "growth": 50.0, "risk": 45.0, "profitability": 68.2, "capitalEfficiency": 60.0, "valuation": 55.0} | leverage-breach, margin-compression, competition-pressure |
| MM-007 | 74.6 | Buy | {"quality": 85.5, "growth": 50.0, "risk": 90.0, "profitability": 90.0, "capitalEfficiency": 75.0, "valuation": 30.0} | - |
| MM-008 | 57.2 | Hold | {"quality": 51.2, "growth": 75.0, "risk": 55.0, "profitability": 60.0, "capitalEfficiency": 60.0, "valuation": 55.0} | - |
| MM-009 | 73.5 | Buy | {"quality": 75.0, "growth": 67.5, "risk": 75.0, "profitability": 75.0, "capitalEfficiency": 75.0, "valuation": 75.0} | - |
| MM-010 | 63.2 | Accumulate | {"quality": 57.5, "growth": 57.5, "risk": 84.0, "profitability": 40.0, "capitalEfficiency": 75.0, "valuation": 75.0} | - |
| MM-011 | 39.9 | Avoid | {"quality": 43.5, "growth": 50.0, "risk": 30.0, "profitability": 40.0, "capitalEfficiency": 40.0, "valuation": 30.0} | leverage-breach, governance |
| MM-012 | 66.5 | Watch | {"quality": 65.2, "growth": 50.0, "risk": 70.0, "profitability": 83.2, "capitalEfficiency": 60.0, "valuation": 55.0} | tailings-failure, strike-disruption |
| MM-013 | 69.0 | Accumulate | {"quality": 75.0, "growth": 75.0, "risk": 55.0, "profitability": 75.0, "capitalEfficiency": 75.0, "valuation": 55.0} | - |

The Materials & Metals pack contains no per-case table; the values above come from the frozen expected-outputs JSON (independently recomputed during this remediation).

## 3. Validation fixtures (2 edge cases, complete with frozen expectations)

| Case | Name | Frozen expected | Frozen note (verbatim) |
| --- | --- | --- | --- |
| MM-014 | Missing Primitive (fcfYield null) | 73.5 / Buy | fcfYield omitted -> capitalEfficiency pillar renormalizes over zero available metrics -> 0.0 (never fabricated); composite falls 82.5 -> 73.5. |
| MM-015 | Calibrated Band Boundary | 70.1 / Buy | reserveLife 13.0 hits the precious-metals CALIBRATED band [8,15) -> 60, whereas the baseline table [12,20) -> 75 would apply for other subsegments. Demonstrates effective band-table resolution (calibrated ?? baseline, boundaries+scores together). |

## 4. Replay dataset (structure; stored claims labelled as claims)

The replay dataset carries 13 sector records with fields `providerId`, `inputs`, `expected` (composite/verdict/overrides), `reproduced`, `byteIdentical`. The stored `reproduced`/`byteIdentical` markers are stored claims of the freeze record (P1 rule); they are quoted as recorded, not re-adjudicated here. DF-1 qualification (byteIdentical=false, caseDiffs=0; newline-only-ness unproven; mechanical closure requires bundle recomputed*Sha256 values) is carried unchanged.

## 5. Acceptance gates (recorded, all PASS)

The frozen engine acceptance matrix records 16 gates; the validation-critical rows are reproduced verbatim below (full matrix: `ies-020-materials-metals/MATERIALS_METALS_ENGINE_ACCEPTANCE_MATRIX.md` @ `12a04073ff03...`).

| # | Gate (verbatim) | Result |
| --- | --- | --- |
| 1 | 13/13 frozen expected outputs reproduced (composite + verdict + overrides + subsegment + archetype) | PASS |
| 2 | Pillars match frozen expected outputs (round-half-to-even at 1dp) | PASS |
| 3 | Effective band-table resolution (calibrated ?? baseline, cardinality invariant) | PASS |
| 4 | Round-half-to-even (MM-010: 63.25 → 63.2) | PASS |
| 5 | Multi-subsegment + hybrid resolution (MM-009) | PASS |
| 6 | Override / min-rank (governance→Avoid; tailings-failure etc.→Watch) | PASS |
| 7 | Missing-data renormalization (MM-014: capitalEfficiency 0.0, never fabricated) | PASS |
| 8 | Calibrated band-boundary semantics (MM-015) | PASS |
| 9 | All 6 verdict bands exercised | PASS |
| 10 | Ontology 8/8 dimensions (CSIP-compatible) | PASS |
| 11 | Evidence complete + replay deterministic | PASS |
| 12 | Leverage alerts + archetype risk applied (MM-006/MM-003) | PASS |
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
| Frozen validation set + fixtures | ies-020-materials-metals/expected-outputs/materials-metals-expected-outputs-1.0.0.json | 3e67cb6f01fdc7a2459d6f4376e54cfa4b89cf2e |
| Fixtures | ies-020-materials-metals/fixtures/materials-metals-validation-fixtures-1.0.0.json | 000412669a40a7b36e6bdd85bcbb9196dd5ab2e4 |
| Replay structure | ies-020-materials-metals/replay-datasets/materials-metals-replay-dataset-1.0.0.json | 62ace6612c289a38ac6bb75ee5795c56be7650f5 |
| Acceptance gates | ies-020-materials-metals/MATERIALS_METALS_ENGINE_ACCEPTANCE_MATRIX.md | 12a04073ff0334bb3fe7ca6c1c0b8325da79059c |
| Golden inputs | ies-020-materials-metals/fixtures/materials-metals-golden-reference-1.0.0.json | 1b601093cb09d607a7725bfed6b7cc4689c3f1e0 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
