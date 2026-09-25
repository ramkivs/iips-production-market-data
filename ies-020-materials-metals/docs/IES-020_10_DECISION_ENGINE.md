# IES-020 AUTHORITY REVIEW.md 10 DECISION ENGINE

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

# Document 10 - DECISION ENGINE (IES-020 remediated content)

## 1. Verdict bands (pack §17-19 (M12); frozen verdictMapping)

| Composite range | Verdict | Rank |
| --- | --- | --- |
| 80-100 (terminal inclusive) | Strong Buy | 6 |
| 70-80 | Buy | 5 |
| 60-70 | Accumulate | 4 |
| 50-60 | Hold | 3 |
| 40-50 | Watch | 2 |
| 0-40 | Avoid | 1 |

## 2. Override vocabulary, caps and triggers (engine-specific; pack §17-19 (M13/M14))

| Override id | Cap | Trigger |
| --- | --- | --- |
| `governance` | Avoid | input flag `governance` |
| `tailings-failure` | Watch | input flag `tailingsFailure` |
| `permitting-revocation` | Watch | input flag `permittingRevocation` |
| `strike-disruption` | Watch | input flag `strikeDisruption` |
| `capex-overrun` | Watch | input flag `capexOverrun` |
| `margin-compression` | Watch | input flag `marginCompression` |
| `competition-pressure` | Watch | input flag `competitionPressure` |
| `leverage-breach` | Watch | automatic: debtEbitda >= subsegment.leverageAlert |

## 3. Precedence - min-rank (pack §17-19 (M13/M14))

finalVerdict = min_rank(baseVerdict, caps of all applicable overrides). Multiple concurrent overrides each apply their cap; the lowest rank wins; the override list is recorded in the frozen outputs. P1 architecture review Q4 verified deterministic precedence on the frozen case set (multi-override cases reproduced exactly, 13/13 equality).

## 4. Override instances in the frozen outputs (complete)

| Case | Composite | Base verdict (band) | Applicable overrides (frozen list) | Final verdict (min-rank) |
| --- | --- | --- | --- | --- |
| MM-006 | 55.9 | Hold | leverage-breach, margin-compression, competition-pressure | Watch |
| MM-011 | 39.9 | Avoid | leverage-breach, governance | Avoid |
| MM-012 | 66.5 | Accumulate | tailings-failure, strike-disruption | Watch |

## 5. Leverage-breach triggers (per-subsegment alerts, frozen)

| Subsegment | leverageAlert (x) |
| --- | --- |
| `base-metals` | 3.5 |
| `diversified-miners` | 3.0 |
| `precious-metals` | 2.5 |
| `specialty-materials` | 3.0 |
| `steel-producers` | 3.0 |

Cases where leverage-breach fired in the frozen set: MM-006, MM-011.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Verdict/override contract | ies-020-materials-metals/MATERIALS_METALS_DISCOVERY_PACK.md | 7677ec47a335d0157411830a80aba29912dc97b5 |
| Frozen verdictMapping + alerts | ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json | ceea1d5fe7c9e4c56f76f6d34efcbbfef311cccf |
| Frozen override instances | ies-020-materials-metals/expected-outputs/materials-metals-expected-outputs-1.0.0.json | 3e67cb6f01fdc7a2459d6f4376e54cfa4b89cf2e |
| P1 Q4 precedence finding | governance/iips/D7-TIER3-PARITY-P1-PERFORMED-ARCHITECTURE-REVIEW recordings (fab88267) | fab88267ef94905f34134025a397ff1f5ca9ea3d |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- Override vocabulary is frozen as accepted; no pack §28 question alters it; Q4/Q5 remain OPEN.
