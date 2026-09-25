# IES-016 14 REFERENCE ASSET GOVERNANCE

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

# Document 14 - REFERENCE ASSET GOVERNANCE (IES-016 remediated content)

## 1. Freeze manifest identity (frozen file, verbatim fields)

| Field | Value |
| --- | --- |
| standard | IES-016 |
| title | Telecommunications Sector Engine |
| status | FROZEN |
| freezeDate | 2026-08-29 |
| approver | IIPS Engineering Standards Maintainer |
| methodologyVersion | IES-016 v1.0 (D16 normative contract) |
| engineeringStandardVersion | IES-016 discovery pack v1.0 + D36 documentation set (see engineeringDocs) |
| calibrationProfile | telecommunications-calibration-1.0.0 |
| goldenDataset | telecommunications-golden-reference-1.0.0 |
| expectedOutputs | telecommunications-expected-outputs-1.0.0 |
| replayDataset | telecommunications-replay-dataset-1.0.0 |
| validationFixtures | telecommunications-validation-fixtures-1.0.0 |
| ontologyMetadata | telecommunications-ontology-metadata-1.0.0 |
| consumedPlatform | iips-platform unchanged (IES-005/005.1) |
| releaseTag | None |
| releaseTagRationale | Deferred per governance decision DEC-D31-MAINTAINER-ISSUANCE-AND-RELEASETAG-RESOLUTION: a releaseTag is not mandatory for Tier-3 A1 evidence. No Git tag was created for this freeze. |
| postFreezeRule | Any methodology/calibration change requires a new version, never modification of the frozen baseline. Reference assets are the authoritative test oracle; implementation disagreement is an implementation defect. |

## 2. documentHashes pinmap (12 keys, verbatim recorded values)

| Key | Recorded sha256 (verbatim) |
| --- | --- |
| acceptanceMatrix | sha256:1e344fa5e65e46d633d4b3774dfd7acbd71488b464b1086bc9d672c31321c665 |
| architectureReview | sha256:96ef579479a55aa880902384058003888b9d72d911e931bb3cb316211b3cb4c7 |
| authorityReview | sha256:369cadebf1953fcd3c520e7e6c5619783c3d2ac440af978c3ecf1bab8fc81802 |
| calibration | sha256:2d22256e2c13b0e5b855c0869558f9d12898ddb12a7f3d0f611f6c9b16cba7e0 |
| contractTestGenerator | sha256:807a7dafba619d01543f78bbe13cb169165bf56ae8f4939c1fb8285711e8ae48 |
| discoveryPack | sha256:4f35d9f51cb29d03b60a87f6a5f3d23db9c3dc0c275fbd73d591389c04e9438a |
| expectedOutputs | sha256:18341d76da1c7577be879a030234f1aecb095330d93f5da4b36529b9772633d6 |
| goldenDataset | sha256:feb521c8cdd55f5e404c99b3f8bb7507345593c05ce64de0e1ebc61168f530fa |
| ontologyMetadata | sha256:b12cf97abd1d6c6290eea57332e83c4960b685b4d357bbc8fa387d8f40a7d5d6 |
| replayDataset | sha256:097ca980c103a19b4132d4e994cc620743f14d16117cb24cc023e876aa0d11c5 |
| riskRegister | sha256:bb45049d2d22facd5048fc3b15f7e645962dbee09a5e9b4324be4a356f2b2f07 |
| validationFixtures | sha256:783d68ebc9d311888adc8e1fb82f4651a58f584d1e4fe38eedccc7ebe8251c4f |

## 3. hashNormalization conventions (verbatim)

> architectureReview and authorityReview are SHA-256 hashes of the repository LF blob representation of the named files at phase13-next commit 100a90237d4ac3db29d10019423b67afe99e2819. The pre-existing ten documentHashes entries retain their historical CRLF-rendering convention and were not recomputed.

The recorded convention is documented as-is: two entries are LF-blob hashes pinned at a named historical ref; the other ten retain their historical CRLF-rendering convention and were not recomputed. This document neither recomputes nor re-derives those hashes.

## 4. reviewArtifacts / engineeringDocs / coexistsWith (verbatim)

- reviewArtifacts: `TELECOMMUNICATIONS_ENGINE_ACCEPTANCE_MATRIX.md`, `TELECOMMUNICATIONS_IMPLEMENTATION_RISK_REGISTER.md`, `IES-016_IMPLEMENTATION_READINESS_CERTIFICATE.md`, `IES-016_ARCHITECTURE_REVIEW.md`, `D16_AUTHORITY_REVIEW.md`
- engineeringDocs (verbatim): "IES-016-D01..D19 documentation set exists: docs/IES-016_01_README.md through docs/IES-016_19_REFERENCE_DATA_SOURCES.md (19 documents), created under DEC-D36-TIER3-DOCUMENTATION-PARITY-AUTHORITY on phase13-next commit 0a8e287 dated 2026-09-01; new documentation, not recovered historical evidence. The normative calculation contract remains section 3 of TELECOMMUNICATIONS_DISCOVERY_PACK.md."
- consumedCapabilities: CSIP (ontology registration, zero change)
- coexistsWith: 12 engines (banking-engine-v1.0.0, insurance-engine-v1.0.0, capital-markets-engine-v1.0.0, healthcare-engine-v1.0.0...)

## 5. Live git blob pins of the engine asset set (at 830bd7218f6a77274e3d58eef09d706a3a99794f)

| Asset | Path | Git blob |
| --- | --- | --- |
| pack | ies-016-telecommunications/TELECOMMUNICATIONS_DISCOVERY_PACK.md | 68aae104dd3a0ccad8122d5770bd8d2c61637ba6 |
| cal | ies-016-telecommunications/calibration/telecommunications-calibration-1.0.0.json | 178160fcbe0a30975c6796ac22c73a9bd03ab91a |
| gol | ies-016-telecommunications/fixtures/telecommunications-golden-reference-1.0.0.json | f0dfc647b8e0220d04a241902a82899e3a667393 |
| exp | ies-016-telecommunications/expected-outputs/telecommunications-expected-outputs-1.0.0.json | 0d45ffc44df6d61a6f95dac15a12cb6f88be3155 |
| rep | ies-016-telecommunications/replay-datasets/telecommunications-replay-dataset-1.0.0.json | ed6bbeb8b127f45ac8c8d99f9baee8c42bd60001 |
| fix | ies-016-telecommunications/fixtures/telecommunications-validation-fixtures-1.0.0.json | 25accdd952a6f774968e51b3a18eb6f4aa1dbf05 |
| onto | ies-016-telecommunications/telecommunications-ontology-metadata-1.0.0.json | 31383863e126a6688bd95249522e654c933ec6f1 |
| freeze | ies-016-telecommunications/IES-016_FREEZE_MANIFEST.json | 70018bdb38849d50af7258f62d0341ac2bf64f1a |
| matrix | ies-016-telecommunications/TELECOMMUNICATIONS_ENGINE_ACCEPTANCE_MATRIX.md | 0a45484582300d106c104e093a176d9ba52f6aec |
| ready | ies-016-telecommunications/IES-016_IMPLEMENTATION_READINESS_CERTIFICATE.md | d764f276d980b6843e1b68939803299181bd3a47 |
| gen | ies-016-telecommunications/contract-tests/generate_expected_outputs.py | c69ce2eb5d989f63a0618406b103dc398ebc4948 |

## 6. Provenance classes (DEC-D36) and this set

DEC-D36 defines four mandatory provenance classes: RECOVERED-HISTORICAL; CURRENT-REPOSITORY; D36-NEW-EVIDENCE; ABSENT-UNVERIFIABLE. The 19-document set (including this file) is D36-NEW-EVIDENCE, created 2026-09-01 under DEC-D36 and modified 2026-09-05 under the D36-successor 57-document authority - dated, authorship-disclosed, never represented as recovered historical evidence. No unlisted normative asset exists in the engine tree; the remediation mutated exactly the 19 `docs/` files and no asset in this section.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Freeze manifest (verbatim) | ies-016-telecommunications/IES-016_FREEZE_MANIFEST.json | 70018bdb38849d50af7258f62d0341ac2bf64f1a |
| D36 provenance classes | governance/iips/DEC-D36-TIER3-DOCUMENTATION-PARITY-AUTHORITY.md | 747178d0adb86699d39486f261ac273bbf8f527e |
| D14 inventory invariant | governance/iips/DEC-D14-TIER3-PREREQUISITE-RESOLUTION.md | 84e276ad4246f1618731b135884005d937e5820e |
| Live asset pins | s | e |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
