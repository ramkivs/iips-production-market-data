# IES-016 19 REFERENCE DATA SOURCES

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

# Document 19 - REFERENCE DATA SOURCES (IES-016 remediated content)

## 1. Source register (all cited sources; pinned)

| Role | Path | Blob |
| --- | --- | --- |
| Methodology source (normative contract; historical self-labels superseded by D25) | ies-016-telecommunications/TELECOMMUNICATIONS_DISCOVERY_PACK.md | 68aae104dd3a0ccad8122d5770bd8d2c61637ba6 |
| Frozen calibration (authoritative constants) | ies-016-telecommunications/calibration/telecommunications-calibration-1.0.0.json | 178160fcbe0a30975c6796ac22c73a9bd03ab91a |
| Frozen golden reference (synthetic; certification inputs) | ies-016-telecommunications/fixtures/telecommunications-golden-reference-1.0.0.json | f0dfc647b8e0220d04a241902a82899e3a667393 |
| Frozen expected outputs (certification oracle) | ies-016-telecommunications/expected-outputs/telecommunications-expected-outputs-1.0.0.json | 0d45ffc44df6d61a6f95dac15a12cb6f88be3155 |
| Frozen replay dataset (stored claims labelled) | ies-016-telecommunications/replay-datasets/telecommunications-replay-dataset-1.0.0.json | ed6bbeb8b127f45ac8c8d99f9baee8c42bd60001 |
| Frozen validation fixtures | ies-016-telecommunications/fixtures/telecommunications-validation-fixtures-1.0.0.json | 25accdd952a6f774968e51b3a18eb6f4aa1dbf05 |
| Frozen ontology metadata | ies-016-telecommunications/telecommunications-ontology-metadata-1.0.0.json | 31383863e126a6688bd95249522e654c933ec6f1 |
| Reference-oracle generator (transcription tool, not authority) | ies-016-telecommunications/contract-tests/generate_expected_outputs.py | c69ce2eb5d989f63a0618406b103dc398ebc4948 |
| Freeze manifest (frozen pinmap) | ies-016-telecommunications/IES-016_FREEZE_MANIFEST.json | 70018bdb38849d50af7258f62d0341ac2bf64f1a |
| Engine acceptance matrix (recorded evidence) | ies-016-telecommunications/TELECOMMUNICATIONS_ENGINE_ACCEPTANCE_MATRIX.md | 0a45484582300d106c104e093a176d9ba52f6aec |
| Implementation readiness certificate (recorded evidence report) | ies-016-telecommunications/IES-016_IMPLEMENTATION_READINESS_CERTIFICATE.md | d764f276d980b6843e1b68939803299181bd3a47 |

## 2. Synthetic-fixture provenance (no fabricated data)

All 13 reference providers + 2 edge cases are synthetic deterministic fixtures under the frozen Replay-Baseline reference-dataset convention established by IES-015 (Telecommunications convention chain) - never presented as real companies; no fabricated scores, confidence, calibration constants, or sector data (pack §8).

## 3. Data-authority reconciliation (citation convention)

HISTORICAL pack wording (pack §8, quoted): "| Data authority | **PENDING — maintainer acceptance required.** The frozen reference providers are PROPOSED synthetic fixtures (IES-015 convention), NOT authoritative until the D16 methodology is approved by the maintainer/domain authority |". Current authority: DEC-D25 ACCEPT (`D16 v1.0`, fresh forward-looking, A2 preserved) + FROZEN manifest FROZEN (2026-08-29). The pack is a frozen asset and is not edited to remove historical labels; history is not rewritten in either direction.

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
| Pack data-authority statement | ies-016-telecommunications/TELECOMMUNICATIONS_DISCOVERY_PACK.md | 68aae104dd3a0ccad8122d5770bd8d2c61637ba6 |
| Asset register | s | e |
| D25 acceptance | governance/iips/DEC-D25-TIER3-EVIDENTIARY-STANDARD.md | cbab4da9ce922aacf45e513954d6e325bb037810 |
| Freeze record | ies-016-telecommunications/IES-016_FREEZE_MANIFEST.json | 70018bdb38849d50af7258f62d0341ac2bf64f1a |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
