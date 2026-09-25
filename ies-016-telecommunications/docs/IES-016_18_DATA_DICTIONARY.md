# IES-016 18 DATA DICTIONARY

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

# Document 18 - DATA DICTIONARY (IES-016 remediated content)

## 1. Golden reference provider schema (measured field inventory)

Top-level fields: `dataset`, `standard`, `version`, `program`, `contractVersion`, `purpose`, `providers`. Provider count: 13.

| Field | Type | Unit | Meaning | Measured range (13 providers) |
| --- | --- | --- | --- | --- |
| `archetype` | enum | - | subsegment enum | - |
| `arpu` | number | USD/month | Blended recurring revenue per subscriber-equivalent (per-site for tower-infra) | 3.2..52 |
| `capexIntensity` | number | % | Capex / revenue | 8..30 |
| `churnRate` | number | %/year | Subscriber/tenant churn | 0.8..3.0 |
| `competitionPressure` | boolean (override flag) | - | override flag; see document 10 | - |
| `debtEbitda` | number | × | Net debt / EBITDA | 2.0..4.5 |
| `ebitdaMargin` | number | % | EBITDA margin | 8..55 |
| `evEbitda` | number | × | Enterprise value / EBITDA | 6.0..16 |
| `fcfYield` | number | % | Free cash flow yield | 1..8.5 |
| `governance` | boolean (override flag) | - | override flag; see document 10 | - |
| `marginCompression` | boolean (override flag) | - | override flag; see document 10 | - |
| `postpaidMix` | number | % | Postpaid / contracted-revenue share | 35..90 |
| `revenueGrowth` | number | % | Service revenue growth (YoY) | -1..9 |
| `roic` | number | % | Return on invested capital | 4..14 |
| `spectrumCost` | number | USD/pop | Spectrum cost per population | 0.0..1.9 |
| `subsegment` | enum | - | subsegment enum | - |
| `usageGrowth` | number | % | Mobile data-traffic growth (YoY) | 5..28 |

Special/multi-subsegment fields (case TC-009 only): `subsegments` (array of subsegment enums), `subsegmentDominant`, `hybridDominant`. Override flag fields observed in the golden data: `hybridDominant`, `subsegmentDominant`, `subsegments`.

Enums: subsegment = {cable-mso, converged-telco, fixed-broadband, tower-infra, wireless-mno}; archetype = {consumer, converged, enterprise, hybrid, infrastructure, wholesale}.

## 2. Expected-outputs case schema (measured)

Case fields: `providerId`, `subsegment` (resolved), `declaredSubsegments` (array), `archetype` (resolved), `composite` (number, 1dp), `verdict` (enum), `pillars` (object: quality, growth, risk, profitability, capitalEfficiency, valuation, each 1dp), `overrides` (array of enum), `calibrationVersion` (all cases `1.0.0`).

verdict enum (6 values): Strong Buy, Buy, Accumulate, Hold, Watch, Avoid. overrides enum observed in frozen data: {competition-pressure, governance, leverage-breach, margin-compression}; the full contract vocabulary additionally defines unexercised flags (document 10 lists the complete engine vocabulary).

## 3. Replay-dataset sector schema (measured)

Top-level: `dataset`, `standard`, `version`, `contractVersion`, `sectors` (13). Sector fields: `providerId`, `inputs` (the provider record minus id/name), `expected` {`composite`, `verdict`, `overrides`}, `reproduced` (boolean, stored claim), `byteIdentical` (boolean, stored claim - P1 labelling applies).

## 4. Validation-fixtures schema (measured)

Top-level: `dataset`, `standard`, `version`, `program`, `contractVersion`, `purpose`, `edgeCases` (2), `providers` (null). Edge-case fields: the provider field set plus `id`, `name`, `expected` {`composite`, `verdict`, `overrides`, `note`}.

## 5. Leaf counts (measured; every scalar counted)

| Asset | Leaves |
| --- | --- |
| calibration | 262 |
| golden reference | 220 |
| expected outputs | 180 |
| replay dataset | 262 |
| validation fixtures | 44 |

These inventories are measured from the pinned JSONs at 830bd7218f6a77274e3d58eef09d706a3a99794f; no field outside them is consumed by the engine contract.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Golden schema + enums | ies-016-telecommunications/fixtures/telecommunications-golden-reference-1.0.0.json | f0dfc647b8e0220d04a241902a82899e3a667393 |
| Case schema + verdict enum | ies-016-telecommunications/expected-outputs/telecommunications-expected-outputs-1.0.0.json | 0d45ffc44df6d61a6f95dac15a12cb6f88be3155 |
| Replay schema | ies-016-telecommunications/replay-datasets/telecommunications-replay-dataset-1.0.0.json | ed6bbeb8b127f45ac8c8d99f9baee8c42bd60001 |
| Fixtures schema | ies-016-telecommunications/fixtures/telecommunications-validation-fixtures-1.0.0.json | 25accdd952a6f774968e51b3a18eb6f4aa1dbf05 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
