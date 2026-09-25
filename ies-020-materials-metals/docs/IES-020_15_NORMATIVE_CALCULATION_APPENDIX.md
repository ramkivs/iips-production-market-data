# IES-020 AUTHORITY REVIEW.md 15 NORMATIVE CALCULATION APPENDIX

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

# Document 15 - NORMATIVE CALCULATION APPENDIX (IES-020 remediated content)

## 1. Calculation chain (normative restatement)

resolution -> effective band tables -> band scores -> pillars (renormalized weighted means) -> composite (segment weights, archetype-risk-scaled risk weight, left-to-right sum, round-half-to-even at 1dp) -> verdict band -> min-rank overrides. All constants: frozen calibration; all inputs: frozen golden reference.

## 2. Anchor case MM-001 - complete worked calculation (frozen-reproduced)

Provider `Global Diversified Miner` (MM-001), subsegment `diversified-miners`, archetype `integrated`.

### 2.1 Inputs (golden reference, verbatim)

| Code | Field | Input |
| --- | --- | --- |
| MM-001 | `ebitdaMargin` | 32 |
| MM-002 | `revenueGrowth` | 9 |
| MM-003 | `debtEbitda` | 1.4 |
| MM-004 | `reserveLife` | 22 |
| MM-005 | `cashCostCurve` | 20 |
| MM-006 | `realizedPriceSpread` | 106 |
| MM-007 | `fcfYield` | 8 |
| MM-008 | `roic` | 14 |
| MM-009 | `capexIntensity` | 11 |
| MM-010 | `inventoryDays` | 40 |
| MM-011 | `evEbitda` | 5.5 |
| MM-012 | `recyclingInputMix` | 15 |

### 2.2 Band scores (effective tables at resolved subsegment `diversified-miners`)

| Metric | Input | Band score | Table used |
| --- | --- | --- | --- |
| MM-001 | 32 | 90 | baseline |
| MM-002 | 9 | 75 | baseline |
| MM-003 | 1.4 | 90 | baseline |
| MM-004 | 22 | 90 | baseline |
| MM-005 | 20 | 90 | baseline |
| MM-006 | 106 | 90 | baseline |
| MM-007 | 8 | 90 | baseline |
| MM-008 | 14 | 90 | baseline |
| MM-009 | 11 | 75 | baseline |
| MM-010 | 40 | 75 | baseline |
| MM-011 | 5.5 | 75 | baseline |
| MM-012 | 15 | 60 | baseline |

### 2.3 Pillars (full precision; frozen presentation at 1dp)

| Pillar | Computed (full precision) | Computed (1dp) | Frozen (1dp) |
| --- | --- | --- | --- |
| `quality` | 90.000000 | 90.0 | 90.0 |
| `growth` | 67.500000 | 67.5 | 67.5 |
| `risk` | 81.000000 | 81.0 | 81.0 |
| `profitability` | 90.000000 | 90.0 | 90.0 |
| `capitalEfficiency` | 90.000000 | 90.0 | 90.0 |
| `valuation` | 75.000000 | 75.0 | 75.0 |

### 2.4 Composite and verdict

- w = [0.25, 0.20, 0.25, 0.15, 0.10, 0.05] (subsegment `diversified-miners`); risk weight 0.25 x archetypeRisk(1.0 for `integrated`) = 0.2500.
- Left-to-right sum over (quality, growth, risk, profitability, capitalEfficiency, valuation) with the scaled risk weight; roundHalfToEven at 1 decimal.
- Computed composite: **82.5**. Frozen composite: **82.5**. Equal: yes.
- Band mapping (pack §17-19 (M12)): **Strong Buy**. Frozen verdict: **Strong Buy**. Overrides: none.

## 3. Full reproduction table (all 13 cases, independent re-computation)

| Case | Frozen composite | Recomputed | Frozen verdict | Recomputed | Result |
| --- | --- | --- | --- | --- | --- |
| MM-001 | 82.5 | 82.5 | Strong Buy | Strong Buy | OK |
| MM-002 | 76.6 | 76.6 | Buy | Buy | OK |
| MM-003 | 73.2 | 73.2 | Buy | Buy | OK |
| MM-004 | 68.7 | 68.7 | Accumulate | Accumulate | OK |
| MM-005 | 73.4 | 73.4 | Buy | Buy | OK |
| MM-006 | 55.9 | 55.9 | Watch | Watch | OK |
| MM-007 | 74.6 | 74.6 | Buy | Buy | OK |
| MM-008 | 57.2 | 57.2 | Hold | Hold | OK |
| MM-009 | 73.5 | 73.5 | Buy | Buy | OK |
| MM-010 | 63.2 | 63.2 | Accumulate | Accumulate | OK |
| MM-011 | 39.9 | 39.9 | Avoid | Avoid | OK |
| MM-012 | 66.5 | 66.5 | Watch | Watch | OK |
| MM-013 | 69.0 | 69.0 | Accumulate | Accumulate | OK |

## 4. Edge-case worked summaries (fixtures)

- **MM-014 (Missing Primitive (fcfYield null)):** frozen expectation 73.5 / Buy; independently recomputed 73.5 / Buy. fcfYield omitted -> capitalEfficiency pillar renormalizes over zero available metrics -> 0.0 (never fabricated); composite falls 82.5 -> 73.5.
- **MM-015 (Calibrated Band Boundary):** frozen expectation 70.1 / Buy; independently recomputed 70.1 / Buy. reserveLife 13.0 hits the precious-metals CALIBRATED band [8,15) -> 60, whereas the baseline table [12,20) -> 75 would apply for other subsegments. Demonstrates effective band-table resolution (calibrated ?? baseline, boundaries+scores together).

## 5. Tie case (round-half-to-even)

- MM-010: raw 63.25 rounds to 63.2 (ties-to-even) (frozen note; band -> verdict Accumulate).

Every number above was computed at remediation time from the pinned frozen assets; the reproduction is execution evidence, not a certification.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Golden inputs | ies-020-materials-metals/fixtures/materials-metals-golden-reference-1.0.0.json | 1b601093cb09d607a7725bfed6b7cc4689c3f1e0 |
| Calibration constants | ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json | ceea1d5fe7c9e4c56f76f6d34efcbbfef311cccf |
| Frozen expectations | ies-020-materials-metals/expected-outputs/materials-metals-expected-outputs-1.0.0.json | 3e67cb6f01fdc7a2459d6f4376e54cfa4b89cf2e |
| Reference oracle (chain transcription) | ies-020-materials-metals/contract-tests/generate_expected_outputs.py | 2552b6590b75a5bbbc3d5893e07fb27468991e48 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
