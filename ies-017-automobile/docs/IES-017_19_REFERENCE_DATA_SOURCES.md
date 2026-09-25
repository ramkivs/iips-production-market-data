# IES-017 19 REFERENCE DATA SOURCES

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

# Document 19 - REFERENCE DATA SOURCES (IES-017 remediated content)

## 1. Source register (all cited sources; pinned)

| Role | Path | Blob |
| --- | --- | --- |
| Methodology source (normative contract; historical self-labels superseded by D25) | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| Frozen calibration (authoritative constants) | ies-017-automobile/calibration/automobile-calibration-1.0.0.json | e3f84ede6f5e89580aa451a689c0b5689cf8674e |
| Frozen golden reference (synthetic; certification inputs) | ies-017-automobile/fixtures/automobile-golden-reference-1.0.0.json | 11dcd3953046c4e27f80a8ffc71c2c7ef59ede47 |
| Frozen expected outputs (certification oracle) | ies-017-automobile/expected-outputs/automobile-expected-outputs-1.0.0.json | b9982d744d92d592714dcc5b1e8599bed63752f2 |
| Frozen replay dataset (stored claims labelled) | ies-017-automobile/replay-datasets/automobile-replay-dataset-1.0.0.json | f4d599631ee27b48aa808472f5cd9cbb0b108cff |
| Frozen validation fixtures | ies-017-automobile/fixtures/automobile-validation-fixtures-1.0.0.json | fa9bb6df3560bd2449486d5ac9dbc889ff7ac56d |
| Frozen ontology metadata | ies-017-automobile/automobile-ontology-metadata-1.0.0.json | c0cbe1659642ff6bcc2e767e06d24be081c4cd7f |
| Reference-oracle generator (transcription tool, not authority) | ies-017-automobile/contract-tests/generate_expected_outputs.py | ec599ce1aafb26fe645f238e1f953521e60795f8 |
| Freeze manifest (frozen pinmap) | ies-017-automobile/IES-017_FREEZE_MANIFEST.json | a7d1190edbd8bf0bfc5b852da466c5e03b6f2cd3 |
| Engine acceptance matrix (recorded evidence) | ies-017-automobile/AUTOMOBILE_ENGINE_ACCEPTANCE_MATRIX.md | 8707125b545d36541e1199e3f35d425fdda3613d |
| Implementation readiness certificate (recorded evidence report) | ies-017-automobile/IES-017_IMPLEMENTATION_READINESS_CERTIFICATE.md | a1f8ee7f9a7e7bdb572041f9cbbe0357a87bc77f |

## 2. Synthetic-fixture provenance (no fabricated data)

All 13 reference providers + 2 edge cases are synthetic deterministic fixtures under the frozen Replay-Baseline reference-dataset convention established by IES-015 (Automobile convention chain) - never presented as real companies; no fabricated scores, confidence, calibration constants, or sector data (pack §8).

## 3. Data-authority reconciliation (citation convention)

HISTORICAL pack wording (pack §8, quoted): "| Data authority | **PENDING — maintainer acceptance required.** All fixtures are PROPOSED synthetic (IES-015/016 convention), never presented as real companies. |". Current authority: DEC-D25 ACCEPT (`D17 v1.0`, fresh forward-looking, A2 preserved) + FROZEN manifest FROZEN (2026-08-29). The pack is a frozen asset and is not edited to remove historical labels; history is not rewritten in either direction.

## 4. Governance and programme sources (recorded)

| Record | Path | Blob |
| --- | --- | --- |
| DEC-D25 evidentiary standard (methodology acceptance) | governance/iips/DEC-D25-TIER3-EVIDENTIARY-STANDARD.md | cbab4da9ce922aacf45e513954d6e325bb037810 |
| DEC-D15 verification methodology | governance/iips/DEC-D15-VERIFICATION-METHODOLOGY.md | 8cc089df6ae680706921dd5ecb57b75776ad4580 |
| DEC-D14 documentation-parity invariant | governance/iips/DEC-D14-TIER3-PREREQUISITE-RESOLUTION.md | 84e276ad4246f1618731b135884005d937e5820e |
| DEC-D36 documentation authority (CLOSED at 63 files; historical fact) | governance/iips/DEC-D36-TIER3-DOCUMENTATION-PARITY-AUTHORITY.md | 747178d0adb86699d39486f261ac273bbf8f527e |
| Certified replay baseline (fence 7; frozen anchors) | program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json | (cited via DEC-D25 §4; not re-parsed here) |

## 5. No fabricated citations

Every citation above resolves to a pinned, verifiable artifact in this repository or the recorded governance chain. No citation in this document asserts verification that was not performed and recorded. P1 qualifications carried unchanged: DF-1 byteIdentical=false / caseDiffs=0 (newline-only-ness unproven); freeze-manifest 33/33 primary verification qualification.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Pack data-authority statement | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| Asset register | s | e |
| D25 acceptance | governance/iips/DEC-D25-TIER3-EVIDENTIARY-STANDARD.md | cbab4da9ce922aacf45e513954d6e325bb037810 |
| Freeze record | ies-017-automobile/IES-017_FREEZE_MANIFEST.json | a7d1190edbd8bf0bfc5b852da466c5e03b6f2cd3 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
