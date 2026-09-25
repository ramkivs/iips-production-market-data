# IES-020 AUTHORITY REVIEW.md 14 REFERENCE ASSET GOVERNANCE

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

# Document 14 - REFERENCE ASSET GOVERNANCE (IES-020 remediated content)

## 1. Freeze manifest identity (frozen file, verbatim fields)

| Field | Value |
| --- | --- |
| standard | IES-020 |
| title | Materials & Metals Sector Engine |
| status | FROZEN |
| freezeDate | 2026-08-29 |
| approver | IIPS Engineering Standards Maintainer |
| methodologyVersion | IES-020 v1.0 (D20 normative contract) |
| engineeringStandardVersion | IES-020 discovery pack v1.0 + D36 documentation set (see engineeringDocs) |
| calibrationProfile | materials-metals-calibration-1.0.0 |
| goldenDataset | materials-metals-golden-reference-1.0.0 |
| expectedOutputs | materials-metals-expected-outputs-1.0.0 |
| replayDataset | materials-metals-replay-dataset-1.0.0 |
| validationFixtures | materials-metals-validation-fixtures-1.0.0 |
| ontologyMetadata | materials-metals-ontology-metadata-1.0.0 |
| consumedPlatform | iips-platform unchanged (IES-005/005.1) |
| releaseTag | None |
| releaseTagRationale | Deferred per governance decision DEC-D31-MAINTAINER-ISSUANCE-AND-RELEASETAG-RESOLUTION: a releaseTag is not mandatory for Tier-3 A1 evidence. No Git tag was created for this freeze. |
| postFreezeRule | Any methodology/calibration change requires a new version, never modification of the frozen baseline. Reference assets are the authoritative test oracle; implementation disagreement is an implementation defect. |

## 2. documentHashes pinmap (12 keys, verbatim recorded values)

| Key | Recorded sha256 (verbatim) |
| --- | --- |
| acceptanceMatrix | sha256:7fcd2d5bb57c8785fa1a9ab421e0fb63d56d02830066ab93ffed5ac58d22f3f4 |
| architectureReview | sha256:da37dff062853d48b65be5490c8b29e21188e5671ef181e0abac4bc7970f48c5 |
| authorityReview | sha256:8c309a1aa9ef35b86d24a1e79df495d70217d873d98181278e150688da605e27 |
| calibration | sha256:bb0afb700d31b272b5e1da4b0e89ea0adcd2a01368789b940e8ccfc998c0b5d9 |
| contractTestGenerator | sha256:1f7ee122d8d7e3a24038dea96b644a120e101147126560da6107a57c028eb91a |
| discoveryPack | sha256:fe4d1b4e386ad379878e5879acd2fb469388b323e25cbf9f05f7252649affbd8 |
| expectedOutputs | sha256:1f1414dfe313fdccd2dd90438959c2de28511ce7017b6bfd41a431f06f70b580 |
| goldenDataset | sha256:ec289d7701f3723ed0cd7d5c4c2dfb1288286e391c3ce7cf086e3e3a0798cd9d |
| ontologyMetadata | sha256:819a663498f5f7b7b8475c6135eaf8b83d9c4eac105bc83f57b7b49d50ead35e |
| replayDataset | sha256:b8c8409d06c817908b231e603f8380ed57b4a4e1d5d2b589a87a8135c6a821f3 |
| riskRegister | sha256:8cb2486f84c81d5ce18bc9d8eaabf5c336d4af6f4f6719e69a6f57cbe8ab4ae6 |
| validationFixtures | sha256:d090b1b2e0959444c0d1211b2392b9d6d13e105dd851b95e90bf74b001554190 |

## 3. hashNormalization conventions (verbatim)

> architectureReview and authorityReview are SHA-256 hashes of the repository LF blob representation of the named files at phase13-next commit 100a90237d4ac3db29d10019423b67afe99e2819. The pre-existing ten documentHashes entries retain their historical CRLF-rendering convention and were not recomputed.

The recorded convention is documented as-is: two entries are LF-blob hashes pinned at a named historical ref; the other ten retain their historical CRLF-rendering convention and were not recomputed. This document neither recomputes nor re-derives those hashes.

## 4. reviewArtifacts / engineeringDocs / coexistsWith (verbatim)

- reviewArtifacts: `MATERIALS_METALS_ENGINE_ACCEPTANCE_MATRIX.md`, `MATERIALS_METALS_IMPLEMENTATION_RISK_REGISTER.md`, `IES-020_IMPLEMENTATION_READINESS_CERTIFICATE.md`, `IES-020_ARCHITECTURE_REVIEW.md`, `D20_AUTHORITY_REVIEW.md`
- engineeringDocs (verbatim): "IES-020-D01..D19 documentation set exists: docs/IES-020_01_README.md through docs/IES-020_19_REFERENCE_DATA_SOURCES.md (19 documents), created under DEC-D36-TIER3-DOCUMENTATION-PARITY-AUTHORITY on phase13-next commit 0a8e287 dated 2026-09-01; new documentation, not recovered historical evidence. The normative calculation contract remains section 3 of MATERIALS_METALS_DISCOVERY_PACK.md."
- consumedCapabilities: CSIP (ontology registration, zero change)
- coexistsWith: 12 engines (banking-engine-v1.0.0, insurance-engine-v1.0.0, capital-markets-engine-v1.0.0, healthcare-engine-v1.0.0...)

## 5. Live git blob pins of the engine asset set (at 830bd7218f6a77274e3d58eef09d706a3a99794f)

| Asset | Path | Git blob |
| --- | --- | --- |
| pack | ies-020-materials-metals/MATERIALS_METALS_DISCOVERY_PACK.md | 7677ec47a335d0157411830a80aba29912dc97b5 |
| cal | ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json | ceea1d5fe7c9e4c56f76f6d34efcbbfef311cccf |
| gol | ies-020-materials-metals/fixtures/materials-metals-golden-reference-1.0.0.json | 1b601093cb09d607a7725bfed6b7cc4689c3f1e0 |
| exp | ies-020-materials-metals/expected-outputs/materials-metals-expected-outputs-1.0.0.json | 3e67cb6f01fdc7a2459d6f4376e54cfa4b89cf2e |
| rep | ies-020-materials-metals/replay-datasets/materials-metals-replay-dataset-1.0.0.json | 62ace6612c289a38ac6bb75ee5795c56be7650f5 |
| fix | ies-020-materials-metals/fixtures/materials-metals-validation-fixtures-1.0.0.json | 000412669a40a7b36e6bdd85bcbb9196dd5ab2e4 |
| onto | ies-020-materials-metals/materials-metals-ontology-metadata-1.0.0.json | 8ea6b53c08aad0c3cbb7fb04020d3f8b8903ab25 |
| freeze | ies-020-materials-metals/IES-020_FREEZE_MANIFEST.json | 0d43a538734c9c13645778b0eadfbd978730f637 |
| matrix | ies-020-materials-metals/MATERIALS_METALS_ENGINE_ACCEPTANCE_MATRIX.md | 12a04073ff0334bb3fe7ca6c1c0b8325da79059c |
| ready | ies-020-materials-metals/IES-020_IMPLEMENTATION_READINESS_CERTIFICATE.md | 7533e1d69dfd32b1f2781680e885e536a714f180 |
| gen | ies-020-materials-metals/contract-tests/generate_expected_outputs.py | 2552b6590b75a5bbbc3d5893e07fb27468991e48 |

## 6. Provenance classes (DEC-D36) and this set

DEC-D36 defines four mandatory provenance classes: RECOVERED-HISTORICAL; CURRENT-REPOSITORY; D36-NEW-EVIDENCE; ABSENT-UNVERIFIABLE. The 19-document set (including this file) is D36-NEW-EVIDENCE, created 2026-09-01 under DEC-D36 and modified 2026-09-05 under the D36-successor 57-document authority - dated, authorship-disclosed, never represented as recovered historical evidence. No unlisted normative asset exists in the engine tree; the remediation mutated exactly the 19 `docs/` files and no asset in this section.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Freeze manifest (verbatim) | ies-020-materials-metals/IES-020_FREEZE_MANIFEST.json | 0d43a538734c9c13645778b0eadfbd978730f637 |
| D36 provenance classes | governance/iips/DEC-D36-TIER3-DOCUMENTATION-PARITY-AUTHORITY.md | 747178d0adb86699d39486f261ac273bbf8f527e |
| D14 inventory invariant | governance/iips/DEC-D14-TIER3-PREREQUISITE-RESOLUTION.md | 84e276ad4246f1618731b135884005d937e5820e |
| Live asset pins | s | e |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
