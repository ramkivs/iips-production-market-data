# IES-017 11 EVIDENCE FRAMEWORK

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

# Document 11 - EVIDENCE FRAMEWORK (IES-017 remediated content)

## 1. Evidence package structure (pack §6)

Each execution produces an evidence package: `engineId` (sector.automobile), recommendation = final verdict, `compositeScore`, supporting scores = quality/growth/risk/profitability, `decisionRulesApplied` = the override list, `calibrationVersion` (frozen outputs record `1.0.0`), `replayReference` = snapshot id, and provenance (framework version, engine version 1.0.0, methodologyVersion "IES-017 v1.0 (D17 normative contract)").

| Evidence field | Content (this engine, frozen chain) |
| --- | --- |
| engineId | sector.automobile |
| recommendation | final verdict (six-value vocabulary) |
| compositeScore | composite, 1 decimal, round-half-to-even |
| supporting scores | quality / growth / risk / profitability pillars |
| decisionRulesApplied | override list (engine vocabulary: competition-pressure, demand-collapse, governance, leverage-breach, margin-compression, recall-risk) |
| calibrationVersion | 1.0.0 |
| replayReference | replay snapshot id (dataset automobile-replay-dataset-1.0.0) |
| provenance | framework 1.0 / engine 1.0.0 / methodologyVersion "IES-017 v1.0 (D17 normative contract)" |

## 2. Verification methodology (D15)

DEC-D15 establishes role separation plus clean-workspace reproducibility as the programme standard: verification is performed by a disclosed role from a fresh clone of committed state, with no prior build state; "independent" means clean-clone reproducibility, and no organizational/third-party independence is claimed (this document carries that disclosure).

## 3. Confidence treatment (recorded decisions; null-honesty)

The engine never fabricates confidence: golden expected outputs carry none; the governed transport reports null -> "unavailable". The certified platform `EvidencePipeline.build` requires a non-nullable internal numeric confidence, resolved per engine by recorded decision:

- IES-017: **G5 (Option-A analog, maintainer, recorded)** in the frozen readiness certificate and acceptance matrix; DEC-D25 §6 withdraws blocker B1 ("decision is recorded"). Pack §6 had recorded the decision as not auto-transferring from IES-016 - the recorded G5 decision is the current authority; the historical pack wording is retained above as history.

## 4. Evidence classes (W6 discipline)

Repository evidence (frozen assets at pinned blobs), live-UI evidence (none claimed here), inferred capability (not claimed), and certified capability (NOT claimed - no certification exists) are kept distinct. Replay `reproduced`/`byteIdentical` fields in the frozen replay dataset are stored claims of the freeze record (P1 rule); DF-1 (byteIdentical=false, caseDiffs=0) is carried unchanged.

Recorded decision-evidence instances for this engine (frozen): overrides fired on AB-006, AB-011, AB-012 across the 13 cases (competition-pressure, demand-collapse, governance, leverage-breach, margin-compression, recall-risk); the AB-010 tie case and the AB-014/AB-015 edge fixtures are the recorded numerical anchors of the deterministic-evidence claim.

## 5. Evidence chain integrity

The evidence chain is the frozen quintuple golden reference -> calibration -> generator -> expected outputs -> replay dataset, pinned in the freeze manifest documentHashes pinmap (document 14) and independently reproducible (document 15 shows 13/13 + 2/2 value-exact reproduction).

| Chain link (this engine) | Frozen asset id |
| --- | --- |
| Golden reference dataset | automobile-golden-reference-1.0.0 |
| Calibration profile | automobile-calibration-1.0.0 (v1.0.0) |
| Reference oracle generator | ies-017-automobile/contract-tests/generate_expected_outputs.py @ ec599ce1aafb |
| Expected outputs (basis) | automobile-golden-reference-1.0.0 |
| Replay dataset | automobile-replay-dataset-1.0.0 |

Recorded decision note (DEC-D25 §6, verbatim): "**WITHDRAWN.** The decision **is recorded** — `IES-017_IMPLEMENTATION_READINESS_CERTIFICATE.md:27–29` (*"G5 (Option-A analog, maintainer)"*) and `AUTOMOBILE_ENGINE_ACCEPTANCE_MATRIX.md:24`"
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Evidence contract | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| Frozen evidence fields | ies-017-automobile/expected-outputs/automobile-expected-outputs-1.0.0.json | b9982d744d92d592714dcc5b1e8599bed63752f2 |
| D15 methodology | governance/iips/DEC-D15-VERIFICATION-METHODOLOGY.md | 8cc089df6ae680706921dd5ecb57b75776ad4580 |
| Recorded confidence decision | ies-017-automobile/IES-017_IMPLEMENTATION_READINESS_CERTIFICATE.md | a1f8ee7f9a7e7bdb572041f9cbbe0357a87bc77f |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
