# IES-017 14 REFERENCE ASSET GOVERNANCE

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

# Document 14 - REFERENCE ASSET GOVERNANCE (IES-017 remediated content)

## 1. Freeze manifest identity (frozen file, verbatim fields)

| Field | Value |
| --- | --- |
| standard | IES-017 |
| title | Automobile Sector Engine |
| status | FROZEN |
| freezeDate | 2026-08-29 |
| approver | IIPS Engineering Standards Maintainer |
| methodologyVersion | IES-017 v1.0 (D17 normative contract) |
| engineeringStandardVersion | IES-017 discovery pack v1.0 + D36 documentation set (see engineeringDocs) |
| calibrationProfile | automobile-calibration-1.0.0 |
| goldenDataset | automobile-golden-reference-1.0.0 |
| expectedOutputs | automobile-expected-outputs-1.0.0 |
| replayDataset | automobile-replay-dataset-1.0.0 |
| validationFixtures | automobile-validation-fixtures-1.0.0 |
| ontologyMetadata | automobile-ontology-metadata-1.0.0 |
| consumedPlatform | iips-platform unchanged (IES-005/005.1) |
| releaseTag | None |
| releaseTagRationale | Deferred per governance decision DEC-D31-MAINTAINER-ISSUANCE-AND-RELEASETAG-RESOLUTION: a releaseTag is not mandatory for Tier-3 A1 evidence. No Git tag was created for this freeze. |
| postFreezeRule | Any methodology/calibration change requires a new version, never modification of the frozen baseline. Reference assets are the authoritative test oracle; implementation disagreement is an implementation defect. |

## 2. documentHashes pinmap (12 keys, verbatim recorded values)

| Key | Recorded sha256 (verbatim) |
| --- | --- |
| acceptanceMatrix | sha256:fb399c59244f7bc2f762cdead5a5e173c4a9d7f81c352ede2a8606cdddd0b00d |
| architectureReview | sha256:91905ce5d0d3c2e41a5ccf25d5134c3b99c264ff59cd0431986af231607afd17 |
| authorityReview | sha256:1175f2a66123e396ce04f14bbc4faabb1b4fe7cbb68afb89b7eafb70bcbd40b2 |
| calibration | sha256:64c8186debd575f61b03f3caa12709540f61bc834492fd422f00f43ae86a3799 |
| contractTestGenerator | sha256:45fe3aab3d16a7333c5042a60d466ea36a94814ce0309c3bc9eb8ac3a5c1e3a1 |
| discoveryPack | sha256:cd7096f23949877ec5cc47dd8053ce80c4fe4a0e0e4c43563bedee8319387f9f |
| expectedOutputs | sha256:ae532792a759b56be7a3ea3d77fde93b88e99d1dc1facec2a6d660a7c2ff5b45 |
| goldenDataset | sha256:d912224225c9364e86f4a9ed4e149928ee9ba2ae2b6487820b7cb67db41e54af |
| ontologyMetadata | sha256:bbd293b130d0fd5f27c686c182f8b2b294c956402bdac17838291b50a28fa680 |
| replayDataset | sha256:fce68b0af3ef09abd7e3817fc0609b172d0b02386c079d916050c45c93dab2b3 |
| riskRegister | sha256:f18359007c5943813e777aeafc96657651ba4c09029253075e7dc616fd83960c |
| validationFixtures | sha256:e5a3cb5267666bf51e8f948eb9732e5cb2d36eddbc92df1b7f87d8abd5fb165c |

## 3. hashNormalization conventions (verbatim)

> architectureReview and authorityReview are SHA-256 hashes of the repository LF blob representation of the named files at phase13-next commit 100a90237d4ac3db29d10019423b67afe99e2819. The pre-existing ten documentHashes entries retain their historical CRLF-rendering convention and were not recomputed.

The recorded convention is documented as-is: two entries are LF-blob hashes pinned at a named historical ref; the other ten retain their historical CRLF-rendering convention and were not recomputed. This document neither recomputes nor re-derives those hashes.

## 4. reviewArtifacts / engineeringDocs / coexistsWith (verbatim)

- reviewArtifacts: `AUTOMOBILE_ENGINE_ACCEPTANCE_MATRIX.md`, `AUTOMOBILE_IMPLEMENTATION_RISK_REGISTER.md`, `IES-017_IMPLEMENTATION_READINESS_CERTIFICATE.md`, `IES-017_ARCHITECTURE_REVIEW.md`, `D17_AUTHORITY_REVIEW.md`
- engineeringDocs (verbatim): "IES-017-D01..D19 documentation set exists: docs/IES-017_01_README.md through docs/IES-017_19_REFERENCE_DATA_SOURCES.md (19 documents), created under DEC-D36-TIER3-DOCUMENTATION-PARITY-AUTHORITY on phase13-next commit 0a8e287 dated 2026-09-01; new documentation, not recovered historical evidence. The normative calculation contract remains section 3 of AUTOMOBILE_DISCOVERY_PACK.md."
- consumedCapabilities: CSIP (ontology registration, zero change)
- coexistsWith: 12 engines (banking-engine-v1.0.0, insurance-engine-v1.0.0, capital-markets-engine-v1.0.0, healthcare-engine-v1.0.0...)

## 5. Live git blob pins of the engine asset set (at 830bd7218f6a77274e3d58eef09d706a3a99794f)

| Asset | Path | Git blob |
| --- | --- | --- |
| pack | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| cal | ies-017-automobile/calibration/automobile-calibration-1.0.0.json | e3f84ede6f5e89580aa451a689c0b5689cf8674e |
| gol | ies-017-automobile/fixtures/automobile-golden-reference-1.0.0.json | 11dcd3953046c4e27f80a8ffc71c2c7ef59ede47 |
| exp | ies-017-automobile/expected-outputs/automobile-expected-outputs-1.0.0.json | b9982d744d92d592714dcc5b1e8599bed63752f2 |
| rep | ies-017-automobile/replay-datasets/automobile-replay-dataset-1.0.0.json | f4d599631ee27b48aa808472f5cd9cbb0b108cff |
| fix | ies-017-automobile/fixtures/automobile-validation-fixtures-1.0.0.json | fa9bb6df3560bd2449486d5ac9dbc889ff7ac56d |
| onto | ies-017-automobile/automobile-ontology-metadata-1.0.0.json | c0cbe1659642ff6bcc2e767e06d24be081c4cd7f |
| freeze | ies-017-automobile/IES-017_FREEZE_MANIFEST.json | a7d1190edbd8bf0bfc5b852da466c5e03b6f2cd3 |
| matrix | ies-017-automobile/AUTOMOBILE_ENGINE_ACCEPTANCE_MATRIX.md | 8707125b545d36541e1199e3f35d425fdda3613d |
| ready | ies-017-automobile/IES-017_IMPLEMENTATION_READINESS_CERTIFICATE.md | a1f8ee7f9a7e7bdb572041f9cbbe0357a87bc77f |
| gen | ies-017-automobile/contract-tests/generate_expected_outputs.py | ec599ce1aafb26fe645f238e1f953521e60795f8 |

## 6. Provenance classes (DEC-D36) and this set

DEC-D36 defines four mandatory provenance classes: RECOVERED-HISTORICAL; CURRENT-REPOSITORY; D36-NEW-EVIDENCE; ABSENT-UNVERIFIABLE. The 19-document set (including this file) is D36-NEW-EVIDENCE, created 2026-09-01 under DEC-D36 and modified 2026-09-05 under the D36-successor 57-document authority - dated, authorship-disclosed, never represented as recovered historical evidence. No unlisted normative asset exists in the engine tree; the remediation mutated exactly the 19 `docs/` files and no asset in this section.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Freeze manifest (verbatim) | ies-017-automobile/IES-017_FREEZE_MANIFEST.json | a7d1190edbd8bf0bfc5b852da466c5e03b6f2cd3 |
| D36 provenance classes | governance/iips/DEC-D36-TIER3-DOCUMENTATION-PARITY-AUTHORITY.md | 747178d0adb86699d39486f261ac273bbf8f527e |
| D14 inventory invariant | governance/iips/DEC-D14-TIER3-PREREQUISITE-RESOLUTION.md | 84e276ad4246f1618731b135884005d937e5820e |
| Live asset pins | s | e |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
