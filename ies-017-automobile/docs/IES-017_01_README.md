# IES-017 01 README

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

# Document 01 - README (IES-017 remediated content)

## 1. Engine identity

| Attribute | Value |
| --- | --- |
| Standard | IES-017 |
| Sector family (display) | Automobile |
| Engine directory | ies-017-automobile |
| Engine id | sector.automobile |
| Engine version | 1.0.0 |
| Normative contract | IES-017 v1.0 (D17 normative) — PROPOSED, NOT AUTHORITY *(frozen verbatim value; the embedded self-label is historical wording, reconciled by the DEC-D25 ACCEPT - document 05)* |
| Calibration profile | automobile-calibration-1.0.0 (version 1.0.0) |
| Program | v3.0 Engine Certification Program |
| Capabilities | metrics, scoring, calibration, decision, evidence, ontology |
| Reference pack | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md (13,841 B / 24 headings; M1-M15 marker structure) |

The display name is the roadmap term; the engine directory uses the lowercase slug (recorded follow-up: sector display name `Automobile` vs directory `automobile`). The engine expresses its differences through methodology and calibration only - never through platform or CSIP changes (see document 13).

## 2. The 19-document set (D14 invariant)

DEC-D14 records the uniform A1 baseline as exactly 19 numbered documents plus one ARCHITECTURE_REVIEW per engine. This engine conforms: `IES-017_01_README` through `IES-017_19_REFERENCE_DATA_SOURCES`, listed in document 17. The `IES-017_ARCHITECTURE_REVIEW.md` stub is a D36 header-only stub; it is out of remediation scope, remains unchanged, and must never be represented as a historical or recovered review (W4).

Set provenance (recorded in the frozen manifest `engineeringDocs` field, verbatim): "IES-017-D01..D19 documentation set exists: docs/IES-017_01_README.md through docs/IES-017_19_REFERENCE_DATA_SOURCES.md (19 documents), created under DEC-D36-TIER3-DOCUMENTATION-PARITY-AUTHORITY on phase13-next commit 0a8e287 dated 2026-09-01; new documentation, not recovered historical evidence. The normative calculation contract remains section 3 of AUTOMOBILE_DISCOVERY_PACK.md."

## 3. Engine directory map (pinned frozen assets)

| Role | Path | Pinned blob |
| --- | --- | --- |
| Calibration (frozen) | ies-017-automobile/calibration/automobile-calibration-1.0.0.json | e3f84ede6f5e89580aa451a689c0b5689cf8674e |
| Golden reference dataset (frozen) | ies-017-automobile/fixtures/automobile-golden-reference-1.0.0.json | 11dcd3953046c4e27f80a8ffc71c2c7ef59ede47 |
| Expected outputs / certification oracle (frozen) | ies-017-automobile/expected-outputs/automobile-expected-outputs-1.0.0.json | b9982d744d92d592714dcc5b1e8599bed63752f2 |
| Replay dataset (frozen) | ies-017-automobile/replay-datasets/automobile-replay-dataset-1.0.0.json | f4d599631ee27b48aa808472f5cd9cbb0b108cff |
| Validation fixtures (frozen) | ies-017-automobile/fixtures/automobile-validation-fixtures-1.0.0.json | fa9bb6df3560bd2449486d5ac9dbc889ff7ac56d |
| Ontology metadata (frozen) | ies-017-automobile/automobile-ontology-metadata-1.0.0.json | c0cbe1659642ff6bcc2e767e06d24be081c4cd7f |
| Reference-oracle generator (pinned) | ies-017-automobile/contract-tests/generate_expected_outputs.py | ec599ce1aafb26fe645f238e1f953521e60795f8 |
| Discovery pack (methodology source) | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| Freeze manifest (frozen) | ies-017-automobile/IES-017_FREEZE_MANIFEST.json | a7d1190edbd8bf0bfc5b852da466c5e03b6f2cd3 |
| Engine acceptance matrix (frozen review artifact) | ies-017-automobile/AUTOMOBILE_ENGINE_ACCEPTANCE_MATRIX.md | 8707125b545d36541e1199e3f35d425fdda3613d |
| Implementation readiness certificate (frozen review artifact) | ies-017-automobile/IES-017_IMPLEMENTATION_READINESS_CERTIFICATE.md | a1f8ee7f9a7e7bdb572041f9cbbe0357a87bc77f |

## 4. Status

- Methodology: `D17 v1.0` is ACCEPT under DEC-D25 (cbab4da9ce92...) - a fresh forward-looking acceptance; historical acceptance is not established and not claimed; the engine remains evidence-maturity A2.
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
| Engine identity / taxonomy | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| Frozen manifest | ies-017-automobile/IES-017_FREEZE_MANIFEST.json | a7d1190edbd8bf0bfc5b852da466c5e03b6f2cd3 |
| Ontology metadata | ies-017-automobile/automobile-ontology-metadata-1.0.0.json | c0cbe1659642ff6bcc2e767e06d24be081c4cd7f |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
