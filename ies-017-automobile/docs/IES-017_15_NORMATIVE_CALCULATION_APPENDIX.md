# IES-017 15 NORMATIVE CALCULATION APPENDIX

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

# Document 15 - NORMATIVE CALCULATION APPENDIX (IES-017 remediated content)

## 1. Calculation chain (normative restatement)

resolution -> effective band tables -> band scores -> pillars (renormalized weighted means) -> composite (segment weights, archetype-risk-scaled risk weight, left-to-right sum, round-half-to-even at 1dp) -> verdict band -> min-rank overrides. All constants: frozen calibration; all inputs: frozen golden reference.

## 2. Anchor case AB-001 - complete worked calculation (frozen-reproduced)

Provider `Global Volume OEM` (AB-001), subsegment `mass-market-oem`, archetype `full-line`.

### 2.1 Inputs (golden reference, verbatim)

| Code | Field | Input |
| --- | --- | --- |
| AB-001 | `ebitdaMargin` | 12 |
| AB-002 | `revenueGrowth` | 8 |
| AB-003 | `debtEbitda` | 1.8 |
| AB-004 | `vehicleMargin` | 9 |
| AB-005 | `capacityUtilization` | 85 |
| AB-006 | `evMix` | 30 |
| AB-007 | `fcfYield` | 5 |
| AB-008 | `roic` | 12 |
| AB-009 | `capexIntensity` | 12 |
| AB-010 | `inventoryDays` | 45 |
| AB-011 | `evEbitda` | 5.5 |
| AB-012 | `aftersalesMix` | 18 |

### 2.2 Band scores (effective tables at resolved subsegment `mass-market-oem`)

| Metric | Input | Band score | Table used |
| --- | --- | --- | --- |
| AB-001 | 12 | 60 | baseline |
| AB-002 | 8 | 75 | baseline |
| AB-003 | 1.8 | 75 | baseline |
| AB-004 | 9 | 60 | baseline |
| AB-005 | 85 | 75 | baseline |
| AB-006 | 30 | 75 | baseline |
| AB-007 | 5 | 75 | baseline |
| AB-008 | 12 | 75 | baseline |
| AB-009 | 12 | 75 | baseline |
| AB-010 | 45 | 75 | baseline |
| AB-011 | 5.5 | 75 | baseline |
| AB-012 | 18 | 60 | baseline |

### 2.3 Pillars (full precision; frozen presentation at 1dp)

| Pillar | Computed (full precision) | Computed (1dp) | Frozen (1dp) |
| --- | --- | --- | --- |
| `quality` | 65.250000 | 65.2 | 65.2 |
| `growth` | 75.000000 | 75.0 | 75.0 |
| `risk` | 75.000000 | 75.0 | 75.0 |
| `profitability` | 66.750000 | 66.8 | 66.8 |
| `capitalEfficiency` | 75.000000 | 75.0 | 75.0 |
| `valuation` | 75.000000 | 75.0 | 75.0 |

### 2.4 Composite and verdict

- w = [0.25, 0.20, 0.25, 0.15, 0.10, 0.05] (subsegment `mass-market-oem`); risk weight 0.25 x archetypeRisk(1.0 for `full-line`) = 0.2500.
- Left-to-right sum over (quality, growth, risk, profitability, capitalEfficiency, valuation) with the scaled risk weight; roundHalfToEven at 1 decimal.
- Computed composite: **71.3**. Frozen composite: **71.3**. Equal: yes.
- Band mapping (pack §5 (M12)): **Buy**. Frozen verdict: **Buy**. Overrides: none.

## 3. Full reproduction table (all 13 cases, independent re-computation)

| Case | Frozen composite | Recomputed | Frozen verdict | Recomputed | Result |
| --- | --- | --- | --- | --- | --- |
| AB-001 | 71.3 | 71.3 | Buy | Buy | OK |
| AB-002 | 74.8 | 74.8 | Buy | Buy | OK |
| AB-003 | 69.2 | 69.2 | Accumulate | Accumulate | OK |
| AB-004 | 70.6 | 70.6 | Buy | Buy | OK |
| AB-005 | 66.9 | 66.9 | Accumulate | Accumulate | OK |
| AB-006 | 56.0 | 56.0 | Watch | Watch | OK |
| AB-007 | 83.6 | 83.6 | Strong Buy | Strong Buy | OK |
| AB-008 | 56.6 | 56.6 | Hold | Hold | OK |
| AB-009 | 71.8 | 71.8 | Buy | Buy | OK |
| AB-010 | 56.2 | 56.2 | Hold | Hold | OK |
| AB-011 | 39.0 | 39.0 | Avoid | Avoid | OK |
| AB-012 | 68.5 | 68.5 | Watch | Watch | OK |
| AB-013 | 64.8 | 64.8 | Accumulate | Accumulate | OK |

## 4. Edge-case worked summaries (fixtures)

- **AB-014 (Missing Primitive (fcfYield null)):** frozen expectation 63.8 / Accumulate; independently recomputed 63.8 / Accumulate. fcfYield omitted -> capitalEfficiency pillar renormalizes over zero available metrics -> 0.0 (never fabricated); composite falls 71.3 -> 63.8.
- **AB-015 (Calibrated Band Boundary):** frozen expectation 73.1 / Buy; independently recomputed 73.1 / Buy. vehicleMargin 8.0 hits the ev-native CALIBRATED band lower bound [8,13) -> 75, whereas the baseline table [5,10) -> 60 would apply for other subsegments. Demonstrates effective band-table resolution (calibrated ?? baseline, boundaries+scores together).

## 5. Tie case (round-half-to-even)

- AB-010: raw 56.25 rounds to 56.2 (ties-to-even) (frozen note; band -> verdict Hold).

Every number above was computed at remediation time from the pinned frozen assets; the reproduction is execution evidence, not a certification.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Golden inputs | ies-017-automobile/fixtures/automobile-golden-reference-1.0.0.json | 11dcd3953046c4e27f80a8ffc71c2c7ef59ede47 |
| Calibration constants | ies-017-automobile/calibration/automobile-calibration-1.0.0.json | e3f84ede6f5e89580aa451a689c0b5689cf8674e |
| Frozen expectations | ies-017-automobile/expected-outputs/automobile-expected-outputs-1.0.0.json | b9982d744d92d592714dcc5b1e8599bed63752f2 |
| Reference oracle (chain transcription) | ies-017-automobile/contract-tests/generate_expected_outputs.py | ec599ce1aafb26fe645f238e1f953521e60795f8 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
