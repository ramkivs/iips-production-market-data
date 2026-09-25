# IES-017 13 ARENA IMPLEMENTATION SPECIFICATION

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

# Document 13 - ARENA IMPLEMENTATION SPECIFICATION (IES-017 remediated content)

## 1. Ontology registration metadata (pack §6/ontology mapping sections; frozen)

| Attribute | Frozen value |
| --- | --- |
| engineId | sector.automobile |
| sectorFamily | Automobile |
| standard | IES-017 |
| contractVersion | IES-017 v1.0 (D17 normative) — PROPOSED, NOT AUTHORITY *(frozen verbatim value; the embedded self-label is historical wording, reconciled by the DEC-D25 ACCEPT - document 05)* |

8-dimension mapping (verbatim from the frozen metadata):

| Engine key | Ontology dimension |
| --- | --- |
| capitalEfficiency | Capital Efficiency |
| composite | Conviction |
| confidence | Confidence |
| growthScore | Growth |
| profitabilityScore | Profitability |
| qualityScore | Quality |
| riskScore | Risk |
| valuationScore | Valuation |

Recorded label note: the frozen metadata contractVersion carries the historical self-label "IES-017 v1.0 (D17 normative) — PROPOSED, NOT AUTHORITY" (frozen as-is); current methodology authority is the DEC-D25 ACCEPT + FROZEN manifest. The metadata file is not edited.

Purpose (frozen, verbatim): "PROPOSED engine-declared ontology metadata for the Universal Investment Ontology (CSIP). Registering this metadata makes the Automobile engine participate in ranking + portfolio intelligence with NO CSIP logic change (the single integration contract). NOT authoritative until the D17 methodology is approved."

## 2. CSIP zero-modification registration mechanism

Because the engine exposes the standard pillar keys (`quality`, `risk`, `growth`, `profitability`, `capitalEfficiency`, `valuation`), the transport `csipInputs` fallback and the OntologyMapper fallback consume the metadata with zero CSIP / transport-logic change. Registration makes the engine participate in ranking + portfolio intelligence through the single integration contract (Ontology Consistency Matrix).

Pack statement (pack §6/ontology mapping sections, verbatim): "it must deliver a deterministic sector engine following the 19-stage lifecycle (v1.0 §8), reproducing frozen expected outputs byte-identically, registering into the governed universe with **zero CSIP/platform/framework change**, and extending the governed API/admin/UI automatically."

The registered dimensions cover the six pillar keys plus composite and confidence uniformly across this engine's five frozen subsegments (commercial-vehicles, ev-native, mass-market-oem, premium-oem, tier-1-supplier) and 13 golden providers; the mapping introduces no engine-specific ontology concept beyond the frozen metadata above.

## 3. Platform ontology sources exist - existence is NOT compatibility proof (Q5)

| Platform source | Path | Pinned blob |
| --- | --- | --- |
| Universal Investment Ontology (CSIP foundation spec) | iips-cross-sector/UNIVERSAL_INVESTMENT_ONTOLOGY.md | 72ee4d3d552bc1ca6007a7d79c92cac6721b226e |
| Ontology Consistency Matrix (CSIP Phase 3 artifact) | iips-cross-sector/architecture-review/ONTOLOGY_CONSISTENCY_MATRIX.md | a01d7f84ea3be4397b3b940f3dc8ce42de4be5d5 |
| OntologyMapper (platform source) | iips-platform/src/sector-engines/cross-sector/ontology/OntologyMapper.ts | ea0f6acfe0ca9e8fbeb04392a2861881cadaa937 |
| IES-010 ontology-registration review (A1 exemplar, form reference only) | ies-010-hospitality/HOSPITALITY_ONTOLOGY_REGISTRATION_REVIEW.md | 8d755d3d970ab0db5c115833847b018aabcf4df3 |

Q5 status: **UNVERIFIABLE - content-level ontology compatibility is NOT established.** A dimension-level compatibility analysis of this engine against the platform ontology is a separate, unperformed evidence work item; the existence of the sources above (and of the IES-010 exemplar form) does not perform it. This document registers the limitation; it does not resolve Q5.

## 4. Integration contract (proposal only - materialization unauthorized)

The pack integration sections (pack §9) list the materialization points (ENGINE_FACTORY registries, SECTOR_DIR entry, replay-baseline append-only entry, admin auto-registration, generic transport/API/UI auto-extension, certification-suite mechanical extension). The pack states these materialize ONLY under an engine implementation authorization, which does not exist for this engine. No integration change is made by this or any Tier-3 documentation; the forbidden boundary (no `frontend/src`, no CSIP/platform/framework change, no existing certified engine changes) stands.

Recorded integration-count fact (pack §9): admin auto-registration 11 -> 12; replay-baseline entry: 12th sector entry.

## 5. Open items (explicitly open)

- Q5 ontology compatibility: UNVERIFIABLE (above).
- Integration materialization: unauthorized (pack-stated).
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Ontology metadata (frozen) | ies-017-automobile/automobile-ontology-metadata-1.0.0.json | c0cbe1659642ff6bcc2e767e06d24be081c4cd7f |
| CSIP registration contract | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| Platform ontology sources (existence only) | iips-cross-sector + iips-platform pinned files | 72ee4d3d552bc1ca6007a7d79c92cac6721b226e |
| A1 exemplar (form reference only) | ies-010-hospitality exemplar | 8d755d3d970ab0db5c115833847b018aabcf4df3 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
