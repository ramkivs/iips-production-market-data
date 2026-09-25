# IES-020 AUTHORITY REVIEW.md 03 INDUSTRY MODEL

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

# Document 03 - INDUSTRY MODEL (IES-020 remediated content)

## 1. Sector scope

The sector covers upstream mining and primary metal production plus downstream materials processing/transformation (pack §1/§2). Included: diversified multi-commodity miners; base-metals producers (copper, zinc, lead, nickel, aluminium); precious-metals producers (gold, silver, PGMs); iron-ore and steel producers (integrated BOF and EAF); specialty-materials processors (advanced alloys, rare-earths, battery-materials, recycling). Excluded: pure commodity trading, fabricated end products (Industrials), downstream chemicals (historic, superseded), equipment OEMs. OPEN (pack §28 Q1): aluminium placement between `base-metals` and `specialty-materials` - proposal places primary aluminium under `base-metals`, rolled/extruded under `specialty-materials`.

## 2. Subsegment taxonomy (pack §4 (M4))

| Subsegment | Description | Golden usage |
| --- | --- | --- |
| `base-metals` | Copper/zinc/lead/nickel/aluminium producers | 2 golden provider(s) |
| `diversified-miners` | Multi-commodity mining majors | 4 golden provider(s) |
| `precious-metals` | Gold/silver/PGM producers | 3 golden provider(s) |
| `specialty-materials` | Advanced alloys, rare-earths, battery-materials processors | 1 golden provider(s) |
| `steel-producers` | Integrated BOF + EAF steelmakers | 3 golden provider(s) |

## 3. Archetype taxonomy (pack §5 (M5))

| Archetype | Description | Calibrated risk multiplier | Golden usage |
| --- | --- | --- | --- |
| `hybrid` | Mixed (resolve via hybridDominant) | risk multiplier 1.0 | 1 golden provider(s) |
| `integrated` | Mine-to-metal (pack §5) | risk multiplier 1.0 | 6 golden provider(s) |
| `processor` | No mining - processing/transformation (pack §5) | risk multiplier 0.9 | 1 golden provider(s) |
| `pure-play` | Single commodity (pack §5) | risk multiplier 1.1 | 2 golden provider(s) |
| `recycling` | Scrap-based/circular (pack §5) | risk multiplier 0.9 | 1 golden provider(s) |
| `royalty` | Royalty/streaming finance (pack §5; legitimacy itself is pack §28 Q5, OPEN) | risk multiplier 0.8 | 2 golden provider(s) |

The `hybrid` archetype occurs only on the multi-subsegment case MM-009 and resolves through `hybridDominant` (resolution rules: document 07). The five non-hybrid archetypes plus hybrid form the complete calibrated archetypeRisk set, exactly as frozen.

## 4. Golden-declared provider distribution

- MM-009 `Multi-subsegment Hybrid Miner` declares `subsegments` ["diversified-miners", "base-metals"] with `subsegmentDominant` `base-metals`, archetype `hybrid` with `hybridDominant` `integrated` - the engine resolves it to `base-metals`/`integrated` in the frozen outputs.

All 13 providers are synthetic deterministic reference fixtures (IES-015 convention) - not claims about real companies (pack pack §27).
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Subsegment/archetype taxonomy | ies-020-materials-metals/MATERIALS_METALS_DISCOVERY_PACK.md | 7677ec47a335d0157411830a80aba29912dc97b5 |
| Golden-declared values | ies-020-materials-metals/fixtures/materials-metals-golden-reference-1.0.0.json | 1b601093cb09d607a7725bfed6b7cc4689c3f1e0 |
| Frozen resolution results | ies-020-materials-metals/expected-outputs/materials-metals-expected-outputs-1.0.0.json | 3e67cb6f01fdc7a2459d6f4376e54cfa4b89cf2e |
| Segment calibration | ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json | ceea1d5fe7c9e4c56f76f6d34efcbbfef311cccf |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
