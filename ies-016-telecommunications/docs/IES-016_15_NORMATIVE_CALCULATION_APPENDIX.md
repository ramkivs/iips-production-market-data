# IES-016 15 NORMATIVE CALCULATION APPENDIX

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

# Document 15 - NORMATIVE CALCULATION APPENDIX (IES-016 remediated content)

## 1. Calculation chain (normative restatement)

resolution -> effective band tables -> band scores -> pillars (renormalized weighted means) -> composite (segment weights, archetype-risk-scaled risk weight, left-to-right sum, round-half-to-even at 1dp) -> verdict band -> min-rank overrides. All constants: frozen calibration; all inputs: frozen golden reference.

## 2. Anchor case TC-001 - complete worked calculation (frozen-reproduced)

Provider `National Wireless Leader` (TC-001), subsegment `wireless-mno`, archetype `consumer`.

### 2.1 Inputs (golden reference, verbatim)

| Code | Field | Input |
| --- | --- | --- |
| TC-001 | `ebitdaMargin` | 42 |
| TC-002 | `revenueGrowth` | 6 |
| TC-003 | `debtEbitda` | 2.2 |
| TC-004 | `arpu` | 34 |
| TC-005 | `churnRate` | 1.1 |
| TC-006 | `postpaidMix` | 88 |
| TC-007 | `fcfYield` | 6 |
| TC-008 | `roic` | 12 |
| TC-009 | `capexIntensity` | 15 |
| TC-010 | `spectrumCost` | 0.8 |
| TC-011 | `evEbitda` | 6.5 |
| TC-012 | `usageGrowth` | 22 |

### 2.2 Band scores (effective tables at resolved subsegment `wireless-mno`)

| Metric | Input | Band score | Table used |
| --- | --- | --- | --- |
| TC-001 | 42 | 90 | baseline |
| TC-002 | 6 | 75 | baseline |
| TC-003 | 2.2 | 75 | baseline |
| TC-004 | 34 | 75 | baseline |
| TC-005 | 1.1 | 75 | baseline |
| TC-006 | 88 | 90 | baseline |
| TC-007 | 6 | 75 | baseline |
| TC-008 | 12 | 75 | baseline |
| TC-009 | 15 | 75 | baseline |
| TC-010 | 0.8 | 75 | baseline |
| TC-011 | 6.5 | 75 | baseline |
| TC-012 | 22 | 75 | baseline |

### 2.3 Pillars (full precision; frozen presentation at 1dp)

| Pillar | Computed (full precision) | Computed (1dp) | Frozen (1dp) |
| --- | --- | --- | --- |
| `quality` | 80.250000 | 80.2 | 80.2 |
| `growth` | 75.000000 | 75.0 | 75.0 |
| `risk` | 75.000000 | 75.0 | 75.0 |
| `profitability` | 83.250000 | 83.2 | 83.2 |
| `capitalEfficiency` | 75.000000 | 75.0 | 75.0 |
| `valuation` | 75.000000 | 75.0 | 75.0 |

### 2.4 Composite and verdict

- w = [0.30, 0.20, 0.20, 0.15, 0.10, 0.05] (subsegment `wireless-mno`); risk weight 0.20 x archetypeRisk(1.0 for `consumer`) = 0.2000.
- Left-to-right sum over (quality, growth, risk, profitability, capitalEfficiency, valuation) with the scaled risk weight; roundHalfToEven at 1 decimal.
- Computed composite: **77.8**. Frozen composite: **77.8**. Equal: yes.
- Band mapping (pack §3.8): **Buy**. Frozen verdict: **Buy**. Overrides: none.

## 3. Full reproduction table (all 13 cases, independent re-computation)

| Case | Frozen composite | Recomputed | Frozen verdict | Recomputed | Result |
| --- | --- | --- | --- | --- | --- |
| TC-001 | 77.8 | 77.8 | Buy | Buy | OK |
| TC-002 | 71.4 | 71.4 | Buy | Buy | OK |
| TC-003 | 70.0 | 70.0 | Buy | Buy | OK |
| TC-004 | 74.5 | 74.5 | Buy | Buy | OK |
| TC-005 | 69.6 | 69.6 | Accumulate | Accumulate | OK |
| TC-006 | 60.5 | 60.5 | Watch | Watch | OK |
| TC-007 | 80.0 | 80.0 | Strong Buy | Strong Buy | OK |
| TC-008 | 65.1 | 65.1 | Accumulate | Accumulate | OK |
| TC-009 | 68.4 | 68.4 | Accumulate | Accumulate | OK |
| TC-010 | 62.7 | 62.7 | Accumulate | Accumulate | OK |
| TC-011 | 38.6 | 38.6 | Avoid | Avoid | OK |
| TC-012 | 55.0 | 55.0 | Hold | Hold | OK |
| TC-013 | 49.5 | 49.5 | Watch | Watch | OK |

## 4. Edge-case worked summaries (fixtures)

- **TC-014 (Missing Primitive (fcfYield null)):** frozen expectation 70.3 / Buy; independently recomputed 70.3 / Buy. fcfYield omitted -> capitalEfficiency pillar renormalizes over zero available metrics -> 0.0 (never fabricated); composite falls 77.8 -> 70.3.
- **TC-015 (Exact Band Boundaries):** frozen expectation 68.2 / Accumulate; independently recomputed 68.2 / Accumulate. Every input sits exactly on a band boundary: lower-inclusive / upper-exclusive applies throughout (e.g. revenueGrowth 5.0 -> [5,10) not [0,5); debtEbitda 2.5 -> [2.5,3.5)).

## 5. Tie case (round-half-to-even)

- TC-012: raw 55.05 rounds to 55.0 (ties-to-even) (frozen note; band -> verdict Hold).

Every number above was computed at remediation time from the pinned frozen assets; the reproduction is execution evidence, not a certification.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Golden inputs | ies-016-telecommunications/fixtures/telecommunications-golden-reference-1.0.0.json | f0dfc647b8e0220d04a241902a82899e3a667393 |
| Calibration constants | ies-016-telecommunications/calibration/telecommunications-calibration-1.0.0.json | 178160fcbe0a30975c6796ac22c73a9bd03ab91a |
| Frozen expectations | ies-016-telecommunications/expected-outputs/telecommunications-expected-outputs-1.0.0.json | 0d45ffc44df6d61a6f95dac15a12cb6f88be3155 |
| Reference oracle (chain transcription) | ies-016-telecommunications/contract-tests/generate_expected_outputs.py | c69ce2eb5d989f63a0618406b103dc398ebc4948 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
