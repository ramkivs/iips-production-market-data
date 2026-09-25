# IES-017 03 INDUSTRY MODEL

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

# Document 03 - INDUSTRY MODEL (IES-017 remediated content)

## 1. Sector scope

Automobile is the second pending engine of the certification programme (pack §1), delivering a deterministic sector engine under the same programme contract: 19-stage lifecycle, byte-identical frozen replay, zero CSIP/platform/framework change, automatic governed-surface extension. The D17 methodology does not transfer from IES-016; the domain model below is automobile-specific (pack §1).

## 2. Subsegment taxonomy (pack §4 (M4))

| Subsegment | Description | Golden usage |
| --- | --- | --- |
| `commercial-vehicles` | Trucks / commercial vehicles | 2 golden provider(s) |
| `ev-native` | EV pure-play manufacturer | 1 golden provider(s) |
| `mass-market-oem` | Volume vehicle manufacturer | 5 golden provider(s) |
| `premium-oem` | Premium / luxury manufacturer | 3 golden provider(s) |
| `tier-1-supplier` | Tier-1 parts / systems supplier | 2 golden provider(s) |

## 3. Archetype taxonomy (pack §5 (M5))

| Archetype | Description | Calibrated risk multiplier | Golden usage |
| --- | --- | --- | --- |
| `commercial` | Commercial / fleet focus | risk multiplier 0.9 | 2 golden provider(s) |
| `component-supplier` | Parts / systems supplier | risk multiplier 0.9 | 2 golden provider(s) |
| `ev-pure-play` | EV-only business model | risk multiplier 1.1 | 2 golden provider(s) |
| `full-line` | Diversified product line | risk multiplier 1.0 | 4 golden provider(s) |
| `hybrid` | Mixed (resolve via hybridDominant) | risk multiplier 1.0 | 1 golden provider(s) |
| `luxury` | Premium focus | risk multiplier 0.9 | 2 golden provider(s) |

The `hybrid` archetype occurs only on the multi-subsegment case AB-009 and resolves through `hybridDominant` (resolution rules: document 07). The five non-hybrid archetypes plus hybrid form the complete calibrated archetypeRisk set, exactly as frozen.

## 4. Golden-declared provider distribution

- AB-009 `Multi-subsegment Hybrid OEM` declares `subsegments` ["mass-market-oem", "premium-oem"] with `subsegmentDominant` `premium-oem`, archetype `hybrid` with `hybridDominant` `luxury` - the engine resolves it to `premium-oem`/`luxury` in the frozen outputs.

All 13 providers are synthetic deterministic reference fixtures (IES-015 convention) - not claims about real companies (pack pack §8).
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Subsegment/archetype taxonomy | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| Golden-declared values | ies-017-automobile/fixtures/automobile-golden-reference-1.0.0.json | 11dcd3953046c4e27f80a8ffc71c2c7ef59ede47 |
| Frozen resolution results | ies-017-automobile/expected-outputs/automobile-expected-outputs-1.0.0.json | b9982d744d92d592714dcc5b1e8599bed63752f2 |
| Segment calibration | ies-017-automobile/calibration/automobile-calibration-1.0.0.json | e3f84ede6f5e89580aa451a689c0b5689cf8674e |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
