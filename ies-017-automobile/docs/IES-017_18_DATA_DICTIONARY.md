# IES-017 18 DATA DICTIONARY

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

# Document 18 - DATA DICTIONARY (IES-017 remediated content)

## 1. Golden reference provider schema (measured field inventory)

Top-level fields: `dataset`, `standard`, `version`, `program`, `contractVersion`, `purpose`, `providers`. Provider count: 13.

| Field | Type | Unit | Meaning | Measured range (13 providers) |
| --- | --- | --- | --- | --- |
| `aftersalesMix` | number | % | Aftersales / services revenue share | 8..28 |
| `archetype` | enum | - | subsegment enum | - |
| `capacityUtilization` | number | % | Plant capacity utilization | 55..90 |
| `capexIntensity` | number | % | Capex / revenue | 8..30 |
| `competitionPressure` | boolean (override flag) | - | override flag; see document 10 | - |
| `debtEbitda` | number | × | Net debt / EBITDA | 1.2..4.5 |
| `demandCollapse` | boolean (override flag) | - | override flag; see document 10 | - |
| `ebitdaMargin` | number | % | EBITDA margin | 6..18 |
| `evEbitda` | number | × | Enterprise value / EBITDA | 5..12 |
| `evMix` | number | % | EV share of deliveries (transition positioning) | 3..100 |
| `fcfYield` | number | % | Free cash flow yield | 1..7 |
| `governance` | boolean (override flag) | - | override flag; see document 10 | - |
| `inventoryDays` | number | days | Inventory days on hand | 25..100 |
| `marginCompression` | boolean (override flag) | - | override flag; see document 10 | - |
| `recallRisk` | boolean (override flag) | - | override flag; see document 10 | - |
| `revenueGrowth` | number | % | Revenue growth (YoY) | -1..25 |
| `roic` | number | % | Return on invested capital | 3..15 |
| `subsegment` | enum | - | subsegment enum | - |
| `vehicleMargin` | number | % | Per-vehicle contribution margin | 4..16 |

Special/multi-subsegment fields (case AB-009 only): `subsegments` (array of subsegment enums), `subsegmentDominant`, `hybridDominant`. Override flag fields observed in the golden data: `hybridDominant`, `subsegmentDominant`, `subsegments`.

Enums: subsegment = {commercial-vehicles, ev-native, mass-market-oem, premium-oem, tier-1-supplier}; archetype = {commercial, component-supplier, ev-pure-play, full-line, hybrid, luxury}.

## 2. Expected-outputs case schema (measured)

Case fields: `providerId`, `subsegment` (resolved), `declaredSubsegments` (array), `archetype` (resolved), `composite` (number, 1dp), `verdict` (enum), `pillars` (object: quality, growth, risk, profitability, capitalEfficiency, valuation, each 1dp), `overrides` (array of enum), `calibrationVersion` (all cases `1.0.0`).

verdict enum (6 values): Strong Buy, Buy, Accumulate, Hold, Watch, Avoid. overrides enum observed in frozen data: {competition-pressure, demand-collapse, governance, leverage-breach, margin-compression, recall-risk}; the full contract vocabulary additionally defines unexercised flags (document 10 lists the complete engine vocabulary).

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
| Golden schema + enums | ies-017-automobile/fixtures/automobile-golden-reference-1.0.0.json | 11dcd3953046c4e27f80a8ffc71c2c7ef59ede47 |
| Case schema + verdict enum | ies-017-automobile/expected-outputs/automobile-expected-outputs-1.0.0.json | b9982d744d92d592714dcc5b1e8599bed63752f2 |
| Replay schema | ies-017-automobile/replay-datasets/automobile-replay-dataset-1.0.0.json | f4d599631ee27b48aa808472f5cd9cbb0b108cff |
| Fixtures schema | ies-017-automobile/fixtures/automobile-validation-fixtures-1.0.0.json | fa9bb6df3560bd2449486d5ac9dbc889ff7ac56d |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
