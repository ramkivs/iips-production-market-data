# IES-016 04 BUSINESS MODEL

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

# Document 04 - BUSINESS MODEL (IES-016 remediated content)

## 1. Pillar structure of the business model

The business model is expressed as six pillars, each fed by engine-specific metrics (pack §3.6). Weights renormalize over available metrics (missing-primitive rule, document 05/07).

| Pillar | Composition (metric (weight)) | Economic meaning (from pack metric taxonomy) |
| --- | --- | --- |
| `quality` | TC-006 (0.35) + TC-004 (0.35) + TC-005 (0.30) | Postpaid / contracted-revenue share / Blended recurring revenue per subscriber-equivalent (per-site for tower-infra) / Subscriber/tenant churn |
| `growth` | TC-002 (0.50) + TC-012 (0.50) | Service revenue growth (YoY) / Mobile data-traffic growth (YoY) |
| `risk` | TC-003 (0.40) + TC-010 (0.35) + TC-009 (0.25) | Net debt / EBITDA / Spectrum cost per population / Capex / revenue |
| `profitability` | TC-001 (0.55) + TC-008 (0.45) | EBITDA margin / Return on invested capital |
| `capitalEfficiency` | TC-007 (1.00) | Free cash flow yield |
| `valuation` | TC-011 (1.00) | Enterprise value / EBITDA |

## 2. Business-model dimensions as encoded in the golden inputs

The golden reference provider records carry the base field set: `archetype`, `arpu`, `capexIntensity`, `churnRate`, `competitionPressure`, `debtEbitda`, `ebitdaMargin`, `evEbitda`, `fcfYield`, `governance`, `marginCompression`, `postpaidMix`, `revenueGrowth`, `roic`, `spectrumCost`, `subsegment`, `usageGrowth`. Quality/growth metrics are engine-specific (`postpaidMix`, `arpu`, `churnRate`, `revenueGrowth`, `usageGrowth`); risk combines leverage (`debtEbitda`) with the engine risk metrics; capitalEfficiency and valuation are single-metric pillars (`fcfYield`, `evEbitda`).

## 3. Subsegment business-model calibration (pack §4)

| Subsegment | quality w | growth w | risk w | profitability w | capitalEfficiency w | valuation w | sum | leverageAlert (x) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `cable-mso` | 0.25 | 0.15 | 0.25 | 0.20 | 0.10 | 0.05 | 1.00 | 4.0 |
| `converged-telco` | 0.25 | 0.20 | 0.25 | 0.15 | 0.10 | 0.05 | 1.00 | 3.5 |
| `fixed-broadband` | 0.30 | 0.15 | 0.20 | 0.20 | 0.10 | 0.05 | 1.00 | 3.0 |
| `tower-infra` | 0.30 | 0.10 | 0.25 | 0.20 | 0.10 | 0.05 | 1.00 | 5.0 |
| `wireless-mno` | 0.30 | 0.20 | 0.20 | 0.15 | 0.10 | 0.05 | 1.00 | 3.5 |

## 4. Archetype risk multipliers

| Archetype | archetypeRisk multiplier | Description |
| --- | --- | --- |
| `consumer` | 1.0 | Consumer-facing operator |
| `converged` | 1.0 | Converged fixed+mobile operator |
| `enterprise` | 0.9 | Enterprise/business services focus |
| `hybrid` | 1.0 | Mixed (resolve via hybridDominant) |
| `infrastructure` | 0.8 | Infrastructure/neutral-host economics |
| `wholesale` | 0.9 | Wholesale/carrier services |

The multiplier scales the risk weight only (composite formula, document 08). All values above are frozen in `ies-016-telecommunications/calibration/telecommunications-calibration-1.0.0.json` @ `178160fcbe0a...`.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Pillar composition | ies-016-telecommunications/TELECOMMUNICATIONS_DISCOVERY_PACK.md | 68aae104dd3a0ccad8122d5770bd8d2c61637ba6 |
| Metric meanings | ies-016-telecommunications/TELECOMMUNICATIONS_DISCOVERY_PACK.md | 68aae104dd3a0ccad8122d5770bd8d2c61637ba6 |
| Segment weights / archetype risk | ies-016-telecommunications/calibration/telecommunications-calibration-1.0.0.json | 178160fcbe0a30975c6796ac22c73a9bd03ab91a |
| Golden input encoding | ies-016-telecommunications/fixtures/telecommunications-golden-reference-1.0.0.json | f0dfc647b8e0220d04a241902a82899e3a667393 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
