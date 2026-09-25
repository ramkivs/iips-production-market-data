# IES-020 AUTHORITY REVIEW.md 17 MASTER INDEX

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

# Document 17 - MASTER INDEX (IES-020 remediated content)

## 1. Exact 19-document inventory (names and order)

| # | Exact filename | Class | Scope |
| --- | --- | --- | --- |
| 01 | `IES-020_01_README.md` | Governance / index | Engine identity, document map, asset directory, status |
| 02 | `IES-020_02_EXECUTIVE_SUMMARY.md` | Overview | Frozen oracle results, verdict distribution (Accumulate: 3; Avoid: 1; Buy: 5; Hold: 1; Strong Buy: 1; Watch: 2), A2 summary limits |
| 03 | `IES-020_03_INDUSTRY_MODEL.md` | Domain model | Subsegment taxonomy (base-metals, diversified-miners, precious-metals, specialty-materials, steel-producers) + archetype taxonomy vs golden-declared values |
| 04 | `IES-020_04_BUSINESS_MODEL.md` | Domain model | Pillar structure, segment weights, archetype risk |
| 05 | `IES-020_05_METHODOLOGY_PRINCIPLES.md` | Methodology | Methodology principles + D25/freeze vs historical pack labels (pack §13-15 calibrated tables (M9)) |
| 06 | `IES-020_06_METRIC_LIBRARY.md` | Quantitative core | Metric taxonomy, band tables, flags, pillar membership |
| 07 | `IES-020_07_SCORE_ENGINE.md` | Engine logic | Scoring pipeline, resolution, effective tables, oracle |
| 08 | `IES-020_08_FORMULA_LIBRARY.md` | Quantitative core | Band/renorm/pillar/composite/rounding/min-rank formulas |
| 09 | `IES-020_09_CALIBRATION.md` | Calibration | Calibration field-for-field (all 262 leaves) |
| 10 | `IES-020_10_DECISION_ENGINE.md` | Engine logic | Verdict bands, override vocabulary, precedence, frozen instances |
| 11 | `IES-020_11_EVIDENCE_FRAMEWORK.md` | Evidence / validation | Evidence package, D15, confidence decisions, evidence classes |
| 12 | `IES-020_12_VALIDATION.md` | Evidence / validation | 13-case set (basis materials-metals-golden-reference-1.0.0), fixtures, replay structure, acceptance gates |
| 13 | `IES-020_13_ARENA_IMPLEMENTATION_SPECIFICATION.md` | Implementation / ontology | Ontology metadata, CSIP registration, Q5 UNVERIFIABLE, integration boundary |
| 14 | `IES-020_14_REFERENCE_ASSET_GOVERNANCE.md` | Asset governance | Freeze manifest pinmap, hashNormalization, provenance classes |
| 15 | `IES-020_15_NORMATIVE_CALCULATION_APPENDIX.md` | Quantitative core | Anchor worked calculation (MM-001: 82.5 Strong Buy) + 13/13 reproduction table |
| 16 | `IES-020_16_IMPLEMENTATION_READINESS_CERTIFICATE.md` | Readiness | Frozen recorded readiness evidence (registrations 12 -> 13) + labelling |
| 17 | `IES-020_17_MASTER_INDEX.md` | Governance / index | This index |
| 18 | `IES-020_18_DATA_DICTIONARY.md` | Data | Field inventories of golden/expected/replay/fixtures |
| 19 | `IES-020_19_REFERENCE_DATA_SOURCES.md` | Data | Source register + data-authority reconciliation |

All 19 documents exist in this directory at their pinned pre-mutation blobs (freeze-recorded creation provenance) and now carry the remediated content under the D36-successor authority. Internal references in this index resolve exactly to these files; no phantom or missing entries.

## 2. Adjacent engine artifacts (outside docs/, unchanged by the remediation)

| Artifact | Path |
| --- | --- |
| Discovery pack | ies-020-materials-metals/MATERIALS_METALS_DISCOVERY_PACK.md |
| Calibration | ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json |
| Golden reference | ies-020-materials-metals/fixtures/materials-metals-golden-reference-1.0.0.json |
| Expected outputs | ies-020-materials-metals/expected-outputs/materials-metals-expected-outputs-1.0.0.json |
| Replay dataset | ies-020-materials-metals/replay-datasets/materials-metals-replay-dataset-1.0.0.json |
| Validation fixtures | ies-020-materials-metals/fixtures/materials-metals-validation-fixtures-1.0.0.json |
| Ontology metadata | ies-020-materials-metals/materials-metals-ontology-metadata-1.0.0.json |
| Freeze manifest | ies-020-materials-metals/IES-020_FREEZE_MANIFEST.json |
| Acceptance matrix | ies-020-materials-metals/MATERIALS_METALS_ENGINE_ACCEPTANCE_MATRIX.md |
| Readiness certificate | ies-020-materials-metals/IES-020_IMPLEMENTATION_READINESS_CERTIFICATE.md |
| Generator | ies-020-materials-metals/contract-tests/generate_expected_outputs.py |
| ARCHITECTURE_REVIEW stub (D36 header-only; unchanged; never a recovered review - W4) | ies-020-materials-metals/IES-020_ARCHITECTURE_REVIEW.md |

## 3. D14 conformance

Exactly 19 numbered documents plus the ARCHITECTURE_REVIEW stub - the uniform A1-parity shape recorded by DEC-D14. The stub is not part of the 19-document remediation and remains at its pre-mutation blob.

## 4. Engine fact sheet (quick navigation)

| Fact | Value (this engine) |
| --- | --- |
| Methodology | D20 v1.0, ACCEPT under DEC-D25 (fresh; A2) |
| Frozen assets | calibration materials-metals-calibration-1.0.0; golden materials-metals-golden-reference-1.0.0; expected materials-metals-expected-outputs-1.0.0; replay materials-metals-replay-dataset-1.0.0; fixtures materials-metals-validation-fixtures-1.0.0 |
| Case family | MM-001..MM-013 + edge MM-014/MM-015 |
| Anchor case | MM-001 composite 82.5, verdict Strong Buy |
| Verdict distribution (13 cases) | Accumulate: 3; Avoid: 1; Buy: 5; Hold: 1; Strong Buy: 1; Watch: 2 |
| Leaf counts cal/golden/expected | 262 / 222 / 182 |
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| 19-doc inventory | s | e |
| D14 invariant | governance/iips/DEC-D14-TIER3-PREREQUISITE-RESOLUTION.md | 84e276ad4246f1618731b135884005d937e5820e |
| Adjacent asset pins | s | e |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
