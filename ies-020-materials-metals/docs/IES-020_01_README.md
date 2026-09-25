# IES-020 AUTHORITY REVIEW.md 01 README

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

# Document 01 - README (IES-020 remediated content)

## 1. Engine identity

| Attribute | Value |
| --- | --- |
| Standard | IES-020 |
| Sector family (display) | Materials & Metals |
| Engine directory | ies-020-materials-metals |
| Engine id | sector.materials-metals |
| Engine version | 1.0.0 |
| Normative contract | IES-020 v1.0 (D20 normative) |
| Calibration profile | materials-metals-calibration-1.0.0 (version 1.0.0) |
| Program | v3.0 Engine Certification Program |
| Capabilities | metrics, scoring, calibration, decision, evidence, ontology |
| Reference pack | ies-020-materials-metals/MATERIALS_METALS_DISCOVERY_PACK.md (11,376 B / 21 headings; M-marker structure + five open authority questions + D20 Part D cross-references) |

The display name is the roadmap term; the engine directory uses the lowercase slug (recorded follow-up: sector display name `Materials & Metals` vs directory `materials-metals`). The engine expresses its differences through methodology and calibration only - never through platform or CSIP changes (see document 13).

## 2. The 19-document set (D14 invariant)

DEC-D14 records the uniform A1 baseline as exactly 19 numbered documents plus one ARCHITECTURE_REVIEW per engine. This engine conforms: `IES-020_01_README` through `IES-020_19_REFERENCE_DATA_SOURCES`, listed in document 17. The `IES-020_ARCHITECTURE_REVIEW.md` stub is a D36 header-only stub; it is out of remediation scope, remains unchanged, and must never be represented as a historical or recovered review (W4).

Set provenance (recorded in the frozen manifest `engineeringDocs` field, verbatim): "IES-020-D01..D19 documentation set exists: docs/IES-020_01_README.md through docs/IES-020_19_REFERENCE_DATA_SOURCES.md (19 documents), created under DEC-D36-TIER3-DOCUMENTATION-PARITY-AUTHORITY on phase13-next commit 0a8e287 dated 2026-09-01; new documentation, not recovered historical evidence. The normative calculation contract remains section 3 of MATERIALS_METALS_DISCOVERY_PACK.md."

## 3. Engine directory map (pinned frozen assets)

| Role | Path | Pinned blob |
| --- | --- | --- |
| Calibration (frozen) | ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json | ceea1d5fe7c9e4c56f76f6d34efcbbfef311cccf |
| Golden reference dataset (frozen) | ies-020-materials-metals/fixtures/materials-metals-golden-reference-1.0.0.json | 1b601093cb09d607a7725bfed6b7cc4689c3f1e0 |
| Expected outputs / certification oracle (frozen) | ies-020-materials-metals/expected-outputs/materials-metals-expected-outputs-1.0.0.json | 3e67cb6f01fdc7a2459d6f4376e54cfa4b89cf2e |
| Replay dataset (frozen) | ies-020-materials-metals/replay-datasets/materials-metals-replay-dataset-1.0.0.json | 62ace6612c289a38ac6bb75ee5795c56be7650f5 |
| Validation fixtures (frozen) | ies-020-materials-metals/fixtures/materials-metals-validation-fixtures-1.0.0.json | 000412669a40a7b36e6bdd85bcbb9196dd5ab2e4 |
| Ontology metadata (frozen) | ies-020-materials-metals/materials-metals-ontology-metadata-1.0.0.json | 8ea6b53c08aad0c3cbb7fb04020d3f8b8903ab25 |
| Reference-oracle generator (pinned) | ies-020-materials-metals/contract-tests/generate_expected_outputs.py | 2552b6590b75a5bbbc3d5893e07fb27468991e48 |
| Discovery pack (methodology source) | ies-020-materials-metals/MATERIALS_METALS_DISCOVERY_PACK.md | 7677ec47a335d0157411830a80aba29912dc97b5 |
| Freeze manifest (frozen) | ies-020-materials-metals/IES-020_FREEZE_MANIFEST.json | 0d43a538734c9c13645778b0eadfbd978730f637 |
| Engine acceptance matrix (frozen review artifact) | ies-020-materials-metals/MATERIALS_METALS_ENGINE_ACCEPTANCE_MATRIX.md | 12a04073ff0334bb3fe7ca6c1c0b8325da79059c |
| Implementation readiness certificate (frozen review artifact) | ies-020-materials-metals/IES-020_IMPLEMENTATION_READINESS_CERTIFICATE.md | 7533e1d69dfd32b1f2781680e885e536a714f180 |

## 4. Status

- Methodology: `D20 v1.0` is ACCEPT under DEC-D25 (cbab4da9ce92...) - a fresh forward-looking acceptance; historical acceptance is not established and not claimed; the engine remains evidence-maturity A2.
- Assets: FROZEN 2026-08-29 (approver: IIPS Engineering Standards Maintainer); postFreezeRule: any methodology/calibration change requires a new version, never modification of the frozen baseline.
- Engine implementation / integration materialization: NOT authorized (documents 13, 16). No commit/push, no promotion, no release/tag.
- Documentation: remediated 2026-09-05 under the D36-successor authority; re-review pending; parity NOT established by this documentation.

## 5. Reading order

03-04 (domain) -> 05 (methodology) -> 06-08 (quantitative core) -> 09 (calibration) -> 10 (decision) -> 11-12 (evidence/validation) -> 13 (implementation/ontology) -> 14 (asset governance) -> 15 (worked calculations) -> 16-19 (readiness, index, data).
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| 19-doc inventory | s | e |
| Engine identity / taxonomy | ies-020-materials-metals/MATERIALS_METALS_DISCOVERY_PACK.md | 7677ec47a335d0157411830a80aba29912dc97b5 |
| Frozen manifest | ies-020-materials-metals/IES-020_FREEZE_MANIFEST.json | 0d43a538734c9c13645778b0eadfbd978730f637 |
| Ontology metadata | ies-020-materials-metals/materials-metals-ontology-metadata-1.0.0.json | 8ea6b53c08aad0c3cbb7fb04020d3f8b8903ab25 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
