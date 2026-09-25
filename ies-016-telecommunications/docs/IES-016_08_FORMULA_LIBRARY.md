# IES-016 08 FORMULA LIBRARY

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

# Document 08 - FORMULA LIBRARY (IES-016 remediated content)

## F1 - Band lookup

score(metric, x) = s_i where i is the unique band with lower_i <= x < upper_i in the effective table (lower-inclusive / upper-exclusive; the terminal band includes its upper bound). Effective table = calibrated ?? baseline at equal cardinality (pack §3.5).

## F2 - Renormalized pillar mean

pillar(P) = sum(score(m) * w_m for available m in P) / sum(w_m for available m in P); 0.0 when no member is available. Nothing fabricated; never NaN.

## F3 - Pillar composition (frozen weights, pack §3.6)

| Pillar | Composition |
| --- | --- |
| `quality` | TC-006*0.35 + TC-004*0.35 + TC-005*0.30 |
| `growth` | TC-002*0.50 + TC-012*0.50 |
| `risk` | TC-003*0.40 + TC-010*0.35 + TC-009*0.25 |
| `profitability` | TC-001*0.55 + TC-008*0.45 |
| `capitalEfficiency` | TC-007*1.00 |
| `valuation` | TC-011*1.00 |

## F4 - Composite (pack §3.7)

composite = roundHalfToEven( quality*w0 + growth*w1 + risk*(w2*archetypeRisk) + profitability*w3 + capitalEfficiency*w4 + valuation*w5 )

`w` = the resolved subsegment 6-dimension vector; `archetypeRisk` scales the risk weight only. Summation is left-to-right in the written order, IEEE-754 double; the engine must match the oracle bit-for-bit.

## F5 - roundHalfToEven at 1 decimal (composite only)

Let s = x*10. If frac(s) == 0.5, round to the even neighbor; else round(s). Result divided by 10. Frozen proof: TC-012 (raw 55.05 rounds to 55.0 (ties-to-even)).

## F6 - Verdict mapping and min-rank overrides (pack §3.9)

base verdict from composite via frozen verdictMapping; finalVerdict = min_rank(baseVerdict, caps of all applicable overrides); rank order Strong Buy 6 > Buy 5 > Accumulate 4 > Hold 3 > Watch 2 > Avoid 1; governance -> Avoid; every other override cap -> Watch; leverage-breach auto-fires at debtEbitda >= leverageAlert.

## Worked check - TC-001 quality pillar (frozen values)

- quality = 0.35*88(postpaidMix=88 -> 90) + 0.35*34(arpu=34 -> 75) + 0.30*1(churnRate=1.1 -> 75) = 80.250000 (frozen presentation 80.2)
- Resolved subsegment `wireless-mno` w = [0.30, 0.20, 0.20, 0.15, 0.10, 0.05]; archetype `consumer` archetypeRisk = 1.0 (risk weight 0.20 x 1.0 = 0.2000).
- composite = 77.8 (frozen; full derivation in document 15).

All constants above are read from the frozen calibration and the pack normative contract; none is invented or altered here.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Formulas | ies-016-telecommunications/TELECOMMUNICATIONS_DISCOVERY_PACK.md | 68aae104dd3a0ccad8122d5770bd8d2c61637ba6 |
| Constants/weights | ies-016-telecommunications/calibration/telecommunications-calibration-1.0.0.json | 178160fcbe0a30975c6796ac22c73a9bd03ab91a |
| Oracle implementation | ies-016-telecommunications/contract-tests/generate_expected_outputs.py | c69ce2eb5d989f63a0618406b103dc398ebc4948 |
| Frozen worked values | ies-016-telecommunications/expected-outputs/telecommunications-expected-outputs-1.0.0.json | 0d45ffc44df6d61a6f95dac15a12cb6f88be3155 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
