# IES-017 04 BUSINESS MODEL

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

# Document 04 - BUSINESS MODEL (IES-017 remediated content)

## 1. Pillar structure of the business model

The business model is expressed as six pillars, each fed by engine-specific metrics (pack §5 (M6/M7)). Weights renormalize over available metrics (missing-primitive rule, document 05/07).

| Pillar | Composition (metric (weight)) | Economic meaning (from pack metric taxonomy) |
| --- | --- | --- |
| `quality` | AB-004 (0.35) + AB-005 (0.35) + AB-012 (0.30) | Per-vehicle contribution margin / Plant capacity utilization / Aftersales / services revenue share |
| `growth` | AB-002 (0.50) + AB-006 (0.50) | Revenue growth (YoY) / EV share of deliveries (transition positioning) |
| `risk` | AB-003 (0.40) + AB-010 (0.35) + AB-009 (0.25) | Net debt / EBITDA / Inventory days on hand / Capex / revenue |
| `profitability` | AB-001 (0.55) + AB-008 (0.45) | EBITDA margin / Return on invested capital |
| `capitalEfficiency` | AB-007 (1.00) | Free cash flow yield |
| `valuation` | AB-011 (1.00) | Enterprise value / EBITDA |

## 2. Business-model dimensions as encoded in the golden inputs

The golden reference provider records carry the base field set: `aftersalesMix`, `archetype`, `capacityUtilization`, `capexIntensity`, `competitionPressure`, `debtEbitda`, `demandCollapse`, `ebitdaMargin`, `evEbitda`, `evMix`, `fcfYield`, `governance`, `inventoryDays`, `marginCompression`, `recallRisk`, `revenueGrowth`, `roic`, `subsegment`, `vehicleMargin`. Quality/growth metrics are engine-specific (`vehicleMargin`, `capacityUtilization`, `aftersalesMix`, `revenueGrowth`, `evMix`); risk combines leverage (`debtEbitda`) with the engine risk metrics; capitalEfficiency and valuation are single-metric pillars (`fcfYield`, `evEbitda`).

## 3. Subsegment business-model calibration (pack §5 calibration contract)

| Subsegment | quality w | growth w | risk w | profitability w | capitalEfficiency w | valuation w | sum | leverageAlert (x) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `commercial-vehicles` | 0.25 | 0.15 | 0.25 | 0.20 | 0.10 | 0.05 | 1.00 | 3.0 |
| `ev-native` | 0.30 | 0.25 | 0.20 | 0.10 | 0.10 | 0.05 | 1.00 | 3.5 |
| `mass-market-oem` | 0.25 | 0.20 | 0.25 | 0.15 | 0.10 | 0.05 | 1.00 | 3.0 |
| `premium-oem` | 0.30 | 0.15 | 0.20 | 0.20 | 0.10 | 0.05 | 1.00 | 3.5 |
| `tier-1-supplier` | 0.25 | 0.20 | 0.25 | 0.15 | 0.10 | 0.05 | 1.00 | 3.0 |

## 4. Archetype risk multipliers

| Archetype | archetypeRisk multiplier | Description |
| --- | --- | --- |
| `commercial` | 0.9 | Commercial / fleet focus |
| `component-supplier` | 0.9 | Parts / systems supplier |
| `ev-pure-play` | 1.1 | EV-only business model |
| `full-line` | 1.0 | Diversified product line |
| `hybrid` | 1.0 | Mixed (resolve via hybridDominant) |
| `luxury` | 0.9 | Premium focus |

The multiplier scales the risk weight only (composite formula, document 08). All values above are frozen in `ies-017-automobile/calibration/automobile-calibration-1.0.0.json` @ `e3f84ede6f5e...`.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Pillar composition | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| Metric meanings | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| Segment weights / archetype risk | ies-017-automobile/calibration/automobile-calibration-1.0.0.json | e3f84ede6f5e89580aa451a689c0b5689cf8674e |
| Golden input encoding | ies-017-automobile/fixtures/automobile-golden-reference-1.0.0.json | 11dcd3953046c4e27f80a8ffc71c2c7ef59ede47 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
