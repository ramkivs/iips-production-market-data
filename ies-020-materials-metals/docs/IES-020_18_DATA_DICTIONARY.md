# IES-020 AUTHORITY REVIEW.md 18 DATA DICTIONARY

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

# Document 18 - DATA DICTIONARY (IES-020 remediated content)

## 1. Golden reference provider schema (measured field inventory)

Top-level fields: `dataset`, `standard`, `version`, `program`, `contractVersion`, `purpose`, `providers`. Provider count: 13.

| Field | Type | Unit | Meaning | Measured range (13 providers) |
| --- | --- | --- | --- | --- |
| `archetype` | enum | - | subsegment enum | - |
| `capexIntensity` | number | % | Capex / revenue | 1..28 |
| `cashCostCurve` | number | % | Cost-curve percentile position | 10..85 |
| `competitionPressure` | boolean (override flag) | - | override flag; see document 10 | - |
| `debtEbitda` | number | × | Net debt / EBITDA | 0.5..4.5 |
| `ebitdaMargin` | number | % | EBITDA margin | 7..60 |
| `evEbitda` | number | × | Enterprise value / EBITDA | 5.0..13 |
| `fcfYield` | number | % | Free cash flow yield | 1..8 |
| `governance` | boolean (override flag) | - | override flag; see document 10 | - |
| `inventoryDays` | number | days | Inventory days on hand | 15..100 |
| `marginCompression` | boolean (override flag) | - | override flag; see document 10 | - |
| `realizedPriceSpread` | number | % | Realized vs benchmark price | 92..106 |
| `recyclingInputMix` | number | % | Recycled/scrap input share | 4..70 |
| `reserveLife` | number | years | Proven+probable reserves ÷ annual production | 4..28 |
| `revenueGrowth` | number | % | Revenue growth (YoY) | -2..11 |
| `roic` | number | % | Return on invested capital | 3..15 |
| `strikeDisruption` | boolean (override flag) | - | override flag; see document 10 | - |
| `subsegment` | enum | - | subsegment enum | - |
| `tailingsFailure` | boolean (override flag) | - | override flag; see document 10 | - |

Special/multi-subsegment fields (case MM-009 only): `subsegments` (array of subsegment enums), `subsegmentDominant`, `hybridDominant`. Override flag fields observed in the golden data: `hybridDominant`, `subsegmentDominant`, `subsegments`.

Enums: subsegment = {base-metals, diversified-miners, precious-metals, specialty-materials, steel-producers}; archetype = {hybrid, integrated, processor, pure-play, recycling, royalty}.

## 2. Expected-outputs case schema (measured)

Case fields: `providerId`, `subsegment` (resolved), `declaredSubsegments` (array), `archetype` (resolved), `composite` (number, 1dp), `verdict` (enum), `pillars` (object: quality, growth, risk, profitability, capitalEfficiency, valuation, each 1dp), `overrides` (array of enum), `calibrationVersion` (all cases `1.0.0`).

verdict enum (6 values): Strong Buy, Buy, Accumulate, Hold, Watch, Avoid. overrides enum observed in frozen data: {competition-pressure, governance, leverage-breach, margin-compression, strike-disruption, tailings-failure}; the full contract vocabulary additionally defines unexercised flags (document 10 lists the complete engine vocabulary).

## 3. Replay-dataset sector schema (measured)

Top-level: `dataset`, `standard`, `version`, `contractVersion`, `sectors` (13). Sector fields: `providerId`, `inputs` (the provider record minus id/name), `expected` {`composite`, `verdict`, `overrides`}, `reproduced` (boolean, stored claim), `byteIdentical` (boolean, stored claim - P1 labelling applies).

## 4. Validation-fixtures schema (measured)

Top-level: `dataset`, `standard`, `version`, `program`, `contractVersion`, `purpose`, `edgeCases` (2), `providers` (null). Edge-case fields: the provider field set plus `id`, `name`, `expected` {`composite`, `verdict`, `overrides`, `note`}.

## 5. Leaf counts (measured; every scalar counted)

| Asset | Leaves |
| --- | --- |
| calibration | 262 |
| golden reference | 222 |
| expected outputs | 182 |
| replay dataset | 266 |
| validation fixtures | 44 |

These inventories are measured from the pinned JSONs at 830bd7218f6a77274e3d58eef09d706a3a99794f; no field outside them is consumed by the engine contract.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Golden schema + enums | ies-020-materials-metals/fixtures/materials-metals-golden-reference-1.0.0.json | 1b601093cb09d607a7725bfed6b7cc4689c3f1e0 |
| Case schema + verdict enum | ies-020-materials-metals/expected-outputs/materials-metals-expected-outputs-1.0.0.json | 3e67cb6f01fdc7a2459d6f4376e54cfa4b89cf2e |
| Replay schema | ies-020-materials-metals/replay-datasets/materials-metals-replay-dataset-1.0.0.json | 62ace6612c289a38ac6bb75ee5795c56be7650f5 |
| Fixtures schema | ies-020-materials-metals/fixtures/materials-metals-validation-fixtures-1.0.0.json | 000412669a40a7b36e6bdd85bcbb9196dd5ab2e4 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
