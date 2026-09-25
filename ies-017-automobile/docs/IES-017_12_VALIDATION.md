# IES-017 12 VALIDATION

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

# Document 12 - VALIDATION (IES-017 remediated content)

## 1. Validation assets (frozen; basis)

Expected outputs basis: `automobile-golden-reference-1.0.0`; golden dataset id: `automobile-golden-reference-1.0.0`; replay dataset id: `automobile-replay-dataset-1.0.0`; fixtures id: `automobile-validation-fixtures-1.0.0`.

| Asset | Path | Pinned blob |
| --- | --- | --- |
| gol | ies-017-automobile/fixtures/automobile-golden-reference-1.0.0.json | 11dcd3953046c4e27f80a8ffc71c2c7ef59ede47 |
| cal | ies-017-automobile/calibration/automobile-calibration-1.0.0.json | e3f84ede6f5e89580aa451a689c0b5689cf8674e |
| gen | ies-017-automobile/contract-tests/generate_expected_outputs.py | ec599ce1aafb26fe645f238e1f953521e60795f8 |
| exp | ies-017-automobile/expected-outputs/automobile-expected-outputs-1.0.0.json | b9982d744d92d592714dcc5b1e8599bed63752f2 |
| rep | ies-017-automobile/replay-datasets/automobile-replay-dataset-1.0.0.json | f4d599631ee27b48aa808472f5cd9cbb0b108cff |
| fix | ies-017-automobile/fixtures/automobile-validation-fixtures-1.0.0.json | fa9bb6df3560bd2449486d5ac9dbc889ff7ac56d |

## 2. The frozen 13-case validation set (complete; certification oracle)

| Case | Composite | Verdict | Pillars (frozen 1dp) | Overrides |
| --- | --- | --- | --- | --- |
| AB-001 | 71.3 | Buy | {"quality": 65.2, "growth": 75.0, "risk": 75.0, "profitability": 66.8, "capitalEfficiency": 75.0, "valuation": 75.0} | - |
| AB-002 | 74.8 | Buy | {"quality": 75.0, "growth": 75.0, "risk": 75.0, "profitability": 81.8, "capitalEfficiency": 75.0, "valuation": 75.0} | - |
| AB-003 | 69.2 | Accumulate | {"quality": 75.0, "growth": 60.0, "risk": 75.0, "profitability": 66.8, "capitalEfficiency": 75.0, "valuation": 75.0} | - |
| AB-004 | 70.6 | Buy | {"quality": 70.5, "growth": 75.0, "risk": 78.8, "profitability": 66.8, "capitalEfficiency": 75.0, "valuation": 55.0} | - |
| AB-005 | 66.9 | Accumulate | {"quality": 60.0, "growth": 90.0, "risk": 62.0, "profitability": 60.0, "capitalEfficiency": 40.0, "valuation": 55.0} | - |
| AB-006 | 56.0 | Watch | {"quality": 60.0, "growth": 60.0, "risk": 45.0, "profitability": 60.0, "capitalEfficiency": 60.0, "valuation": 55.0} | leverage-breach, margin-compression, competition-pressure |
| AB-007 | 83.6 | Strong Buy | {"quality": 85.5, "growth": 90.0, "risk": 81.0, "profitability": 81.8, "capitalEfficiency": 75.0, "valuation": 55.0} | - |
| AB-008 | 56.6 | Hold | {"quality": 60.0, "growth": 60.0, "risk": 60.0, "profitability": 49.0, "capitalEfficiency": 60.0, "valuation": 55.0} | - |
| AB-009 | 71.8 | Buy | {"quality": 75.0, "growth": 75.0, "risk": 75.0, "profitability": 66.8, "capitalEfficiency": 75.0, "valuation": 75.0} | - |
| AB-010 | 56.2 | Hold | {"quality": 40.0, "growth": 40.0, "risk": 84.0, "profitability": 40.0, "capitalEfficiency": 75.0, "valuation": 75.0} | - |
| AB-011 | 39.0 | Avoid | {"quality": 40.0, "growth": 50.0, "risk": 30.0, "profitability": 40.0, "capitalEfficiency": 40.0, "valuation": 30.0} | leverage-breach, governance |
| AB-012 | 68.5 | Watch | {"quality": 80.2, "growth": 67.5, "risk": 68.0, "profitability": 66.8, "capitalEfficiency": 60.0, "valuation": 55.0} | recall-risk, demand-collapse |
| AB-013 | 64.8 | Accumulate | {"quality": 75.0, "growth": 67.5, "risk": 55.0, "profitability": 66.8, "capitalEfficiency": 75.0, "valuation": 55.0} | - |

Registered source discrepancy (open item): pack §7 table records AB-002 composite=74.9 vs frozen=74.8; AB-009 composite=71.9 vs frozen=71.8. The frozen expected-outputs JSON + generator are the recorded oracle; independent recomputation reproduces the frozen values. No pack edit is made or authorized.

## 3. Validation fixtures (2 edge cases, complete with frozen expectations)

| Case | Name | Frozen expected | Frozen note (verbatim) |
| --- | --- | --- | --- |
| AB-014 | Missing Primitive (fcfYield null) | 63.8 / Accumulate | fcfYield omitted -> capitalEfficiency pillar renormalizes over zero available metrics -> 0.0 (never fabricated); composite falls 71.3 -> 63.8. |
| AB-015 | Calibrated Band Boundary | 73.1 / Buy | vehicleMargin 8.0 hits the ev-native CALIBRATED band lower bound [8,13) -> 75, whereas the baseline table [5,10) -> 60 would apply for other subsegments. Demonstrates effective band-table resolution (calibrated ?? baseline, boundaries+scores together). |

## 4. Replay dataset (structure; stored claims labelled as claims)

The replay dataset carries 13 sector records with fields `providerId`, `inputs`, `expected` (composite/verdict/overrides), `reproduced`, `byteIdentical`. The stored `reproduced`/`byteIdentical` markers are stored claims of the freeze record (P1 rule); they are quoted as recorded, not re-adjudicated here. DF-1 qualification (byteIdentical=false, caseDiffs=0; newline-only-ness unproven; mechanical closure requires bundle recomputed*Sha256 values) is carried unchanged.

## 5. Acceptance gates (recorded, all PASS)

The frozen engine acceptance matrix records 16 gates; the validation-critical rows are reproduced verbatim below (full matrix: `ies-017-automobile/AUTOMOBILE_ENGINE_ACCEPTANCE_MATRIX.md` @ `8707125b545d...`).

| # | Gate (verbatim) | Result |
| --- | --- | --- |
| 1 | 13/13 frozen expected outputs reproduced (composite + verdict + overrides + subsegment + archetype) | PASS |
| 2 | Pillars match frozen expected outputs (round-half-to-even at 1dp) | PASS |
| 3 | Effective band-table resolution (calibrated ?? baseline, cardinality invariant) | PASS |
| 4 | Round-half-to-even (AB-010: 56.25 → 56.2) | PASS |
| 5 | Multi-subsegment + hybrid resolution (AB-009) | PASS |
| 6 | Override / min-rank (governance→Avoid; recall-risk etc.→Watch) | PASS |
| 7 | Missing-data renormalization (AB-014: capitalEfficiency 0.0, never fabricated) | PASS |
| 8 | Calibrated band-boundary semantics (AB-015) | PASS |
| 9 | All 6 verdict bands exercised | PASS |
| 10 | Ontology 8/8 dimensions (CSIP-compatible) | PASS |
| 11 | Evidence complete + replay deterministic | PASS |
| 12 | Leverage alerts + archetype risk applied (AB-005/AB-006) | PASS |
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
| Frozen validation set + fixtures | ies-017-automobile/expected-outputs/automobile-expected-outputs-1.0.0.json | b9982d744d92d592714dcc5b1e8599bed63752f2 |
| Fixtures | ies-017-automobile/fixtures/automobile-validation-fixtures-1.0.0.json | fa9bb6df3560bd2449486d5ac9dbc889ff7ac56d |
| Replay structure | ies-017-automobile/replay-datasets/automobile-replay-dataset-1.0.0.json | f4d599631ee27b48aa808472f5cd9cbb0b108cff |
| Acceptance gates | ies-017-automobile/AUTOMOBILE_ENGINE_ACCEPTANCE_MATRIX.md | 8707125b545d36541e1199e3f35d425fdda3613d |
| Golden inputs | ies-017-automobile/fixtures/automobile-golden-reference-1.0.0.json | 11dcd3953046c4e27f80a8ffc71c2c7ef59ede47 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
