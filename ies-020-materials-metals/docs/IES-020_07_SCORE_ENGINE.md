# IES-020 AUTHORITY REVIEW.md 07 SCORE ENGINE

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

# Document 07 - SCORE ENGINE (IES-020 remediated content)

## 1. Scoring pipeline (inputs -> pillars -> composite, as implemented)

1. **Input validation/normalization** - provider record from the golden reference field set (document 18).
2. **Subsegment resolution** (pack §13-15 resolution rules): single `subsegment` -> itself; `subsegments[]` + `subsegmentDominant` in set -> dominant; multi without dominant -> most-conservative risk profile (highest `leverageAlert`, tie-break lexicographic smallest id); archetype `hybrid` -> `hybridDominant` (default `hybrid`). Frozen proof: MM-009 resolves to `base-metals`.
3. **Metric scoring** (pack §13-15 (M10)): each present metric maps through its effective band table to a band score (40/60/75/90 in the baseline tables; calibrated tables may vary per segment).
4. **Effective band-table resolution** (pack §13-15 (M10)): effective[metric] = calibratedBandTables[subsegment][metric] ?? bandScores[metric], boundaries AND scores together, accepted only at equal band cardinality - otherwise the baseline applies (never mixed). Frozen proof: MM-015 (calibrated band boundary, precious-metals).
5. **Pillar composition** (pack §9-12 (M6/M7)): pillar = renormalized weighted mean of member band scores (weights in document 04/06); missing members are dropped; empty pillar = 0.0.
6. **Composite** (pack §20-21 (M11/M15)): see document 08. Round-half-to-even at 1 decimal, composite only; pillars stay full precision (presented at 1 decimal in the frozen outputs).
7. **Verdict** (pack §17-19 (M12)): composite -> six-value verdict via the frozen verdictMapping (document 10).
8. **Overrides** (pack §17-19 (M13/M14)): min-rank precedence over the base verdict (document 10).

## 2. Reference oracle

The deterministic generator `ies-020-materials-metals/contract-tests/generate_expected_outputs.py` @ `2552b6590b75...` is the recorded reference oracle (a transcription tool, not an authority); the engine must reproduce its outputs exactly - same IEEE-754 arithmetic, same left-to-right summation order (explicitly specified for Materials & Metals: D20 M15). This remediation independently re-transcribed the chain and reproduced all 13 frozen cases and both edge fixtures value-exactly (documents 12/15).

## 3. Frozen structure of a computed case

| Field | Frozen value (MM-001) |
| --- | --- |
| subsegment | diversified-miners |
| declaredSubsegments | ["diversified-miners"] |
| archetype | integrated |
| composite | 82.5 |
| verdict | Strong Buy |
| pillars | {"quality": 90.0, "growth": 67.5, "risk": 81.0, "profitability": 90.0, "capitalEfficiency": 90.0, "valuation": 75.0} |
| overrides | [] |
| calibrationVersion | 1.0.0 |
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Pipeline contract | ies-020-materials-metals/MATERIALS_METALS_DISCOVERY_PACK.md | 7677ec47a335d0157411830a80aba29912dc97b5 |
| Band-table semantics | ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json | ceea1d5fe7c9e4c56f76f6d34efcbbfef311cccf |
| Resolution proofs | ies-020-materials-metals/expected-outputs/materials-metals-expected-outputs-1.0.0.json | 3e67cb6f01fdc7a2459d6f4376e54cfa4b89cf2e |
| Reference oracle | ies-020-materials-metals/contract-tests/generate_expected_outputs.py | 2552b6590b75a5bbbc3d5893e07fb27468991e48 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
