# IES-016 03 INDUSTRY MODEL

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

# Document 03 - INDUSTRY MODEL (IES-016 remediated content)

## 1. Sector scope

Telecommunications is the first pending engine of the certification programme (pack §1): it must deliver a real, deterministic sector engine following the 19-stage engine lifecycle, reproducing frozen expected outputs byte-identically, registering into the governed universe with zero CSIP/platform/framework change, and extending the governed API/admin/UI automatically. The frozen dataset models the five operator/infrastructure subsegments below.

## 2. Subsegment taxonomy (pack §3.2)

| Subsegment | Description | Golden usage |
| --- | --- | --- |
| `cable-mso` | Cable multi-service operator | 2 golden provider(s) |
| `converged-telco` | Integrated fixed + mobile operator | 1 golden provider(s) |
| `fixed-broadband` | Fixed-line / broadband ISP | 4 golden provider(s) |
| `tower-infra` | Tower / neutral-host network infrastructure | 1 golden provider(s) |
| `wireless-mno` | Wireless mobile network operator | 5 golden provider(s) |

## 3. Archetype taxonomy (pack §3.3)

| Archetype | Description | Calibrated risk multiplier | Golden usage |
| --- | --- | --- | --- |
| `consumer` | Consumer-facing operator | risk multiplier 1.0 | 4 golden provider(s) |
| `converged` | Converged fixed+mobile operator | risk multiplier 1.0 | 1 golden provider(s) |
| `enterprise` | Enterprise/business services focus | risk multiplier 0.9 | 4 golden provider(s) |
| `hybrid` | Mixed (resolve via hybridDominant) | risk multiplier 1.0 | 1 golden provider(s) |
| `infrastructure` | Infrastructure/neutral-host economics | risk multiplier 0.8 | 1 golden provider(s) |
| `wholesale` | Wholesale/carrier services | risk multiplier 0.9 | 2 golden provider(s) |

The `hybrid` archetype occurs only on the multi-subsegment case TC-009 and resolves through `hybridDominant` (resolution rules: document 07). The five non-hybrid archetypes plus hybrid form the complete calibrated archetypeRisk set, exactly as frozen.

## 4. Golden-declared provider distribution

- TC-009 `Converged Hybrid (multi-subsegment)` declares `subsegments` ["wireless-mno", "fixed-broadband"] with `subsegmentDominant` `wireless-mno`, archetype `hybrid` with `hybridDominant` `converged` - the engine resolves it to `wireless-mno`/`converged` in the frozen outputs.

All 13 providers are synthetic deterministic reference fixtures (IES-015 convention) - not claims about real companies (pack pack §8).
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Subsegment/archetype taxonomy | ies-016-telecommunications/TELECOMMUNICATIONS_DISCOVERY_PACK.md | 68aae104dd3a0ccad8122d5770bd8d2c61637ba6 |
| Golden-declared values | ies-016-telecommunications/fixtures/telecommunications-golden-reference-1.0.0.json | f0dfc647b8e0220d04a241902a82899e3a667393 |
| Frozen resolution results | ies-016-telecommunications/expected-outputs/telecommunications-expected-outputs-1.0.0.json | 0d45ffc44df6d61a6f95dac15a12cb6f88be3155 |
| Segment calibration | ies-016-telecommunications/calibration/telecommunications-calibration-1.0.0.json | 178160fcbe0a30975c6796ac22c73a9bd03ab91a |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
