# IES-020 AUTHORITY REVIEW.md 08 FORMULA LIBRARY

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

# Document 08 - FORMULA LIBRARY (IES-020 remediated content)

## F1 - Band lookup

score(metric, x) = s_i where i is the unique band with lower_i <= x < upper_i in the effective table (lower-inclusive / upper-exclusive; the terminal band includes its upper bound). Effective table = calibrated ?? baseline at equal cardinality (pack §13-15 (M10)).

## F2 - Renormalized pillar mean

pillar(P) = sum(score(m) * w_m for available m in P) / sum(w_m for available m in P); 0.0 when no member is available. Nothing fabricated; never NaN.

## F3 - Pillar composition (frozen weights, pack §9-12 (M6/M7))

| Pillar | Composition |
| --- | --- |
| `quality` | MM-004*0.35 + MM-005*0.35 + MM-006*0.30 |
| `growth` | MM-002*0.50 + MM-012*0.50 |
| `risk` | MM-003*0.40 + MM-010*0.35 + MM-009*0.25 |
| `profitability` | MM-001*0.55 + MM-008*0.45 |
| `capitalEfficiency` | MM-007*1.00 |
| `valuation` | MM-011*1.00 |

## F4 - Composite (pack §20-21 (M11/M15))

composite = roundHalfToEven( quality*w0 + growth*w1 + risk*(w2*archetypeRisk) + profitability*w3 + capitalEfficiency*w4 + valuation*w5 )

`w` = the resolved subsegment 6-dimension vector; `archetypeRisk` scales the risk weight only. Summation is left-to-right in the written order, IEEE-754 double; the engine must match the oracle bit-for-bit (D20 M15).

## F5 - roundHalfToEven at 1 decimal (composite only)

Let s = x*10. If frac(s) == 0.5, round to the even neighbor; else round(s). Result divided by 10. Frozen proof: MM-010 (raw 63.25 rounds to 63.2 (ties-to-even)).

## F6 - Verdict mapping and min-rank overrides (pack §17-19 (M13/M14))

base verdict from composite via frozen verdictMapping; finalVerdict = min_rank(baseVerdict, caps of all applicable overrides); rank order Strong Buy 6 > Buy 5 > Accumulate 4 > Hold 3 > Watch 2 > Avoid 1; governance -> Avoid; every other override cap -> Watch; leverage-breach auto-fires at debtEbitda >= leverageAlert.

## Worked check - MM-001 quality pillar (frozen values)

- quality = 0.35*22(reserveLife=22 -> 90) + 0.35*20(cashCostCurve=20 -> 90) + 0.30*106(realizedPriceSpread=106 -> 90) = 90.000000 (frozen presentation 90.0)
- Resolved subsegment `diversified-miners` w = [0.25, 0.20, 0.25, 0.15, 0.10, 0.05]; archetype `integrated` archetypeRisk = 1.0 (risk weight 0.25 x 1.0 = 0.2500).
- composite = 82.5 (frozen; full derivation in document 15).

All constants above are read from the frozen calibration and the pack normative contract; none is invented or altered here.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Formulas | ies-020-materials-metals/MATERIALS_METALS_DISCOVERY_PACK.md | 7677ec47a335d0157411830a80aba29912dc97b5 |
| Constants/weights | ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json | ceea1d5fe7c9e4c56f76f6d34efcbbfef311cccf |
| Oracle implementation | ies-020-materials-metals/contract-tests/generate_expected_outputs.py | 2552b6590b75a5bbbc3d5893e07fb27468991e48 |
| Frozen worked values | ies-020-materials-metals/expected-outputs/materials-metals-expected-outputs-1.0.0.json | 3e67cb6f01fdc7a2459d6f4376e54cfa4b89cf2e |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- Formula constants are frozen; Q2/Q3 input-form questions remain OPEN and do not alter the frozen formulas.
