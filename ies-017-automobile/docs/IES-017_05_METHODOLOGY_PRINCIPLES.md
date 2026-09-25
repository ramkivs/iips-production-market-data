# IES-017 05 METHODOLOGY PRINCIPLES

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

# Document 05 - METHODOLOGY PRINCIPLES (IES-017 remediated content)

## 1. Methodology authority (source-reconciliation convention)

The binding citation convention for this engine (recorded remediation plan, slots 05/09/19): the methodology is cited as ACCEPT under DEC-D25 (fresh forward-looking acceptance, cbab4da9ce92...; all three Tier-3 engines remain A2; historical acceptance NOT established), together with the FROZEN manifest (2026-08-29, status FROZEN); stale pack self-labels are historical source wording only and are never copied as current authority. The packs are frozen assets - they are not edited to remove historical labels.

DEC-D25 §1 records: "- **Status:** `RECORDED — IES-016 = ACCEPT · IES-017 = ACCEPT · IES-020 = ACCEPT. ALL THREE ARE FRESH FORWARD-LOOKING ACCEPTANCES. HISTORICAL ACCEPTANCE IS *NOT* ESTABLISHED FOR ANY OF THEM. ALL THREE REMAIN A2.`"

## 2. Historical source wording (frozen pack state - quoted, not current authority)

- §0 data authority row (HISTORICAL): > \| Data authority \| **PENDING — maintainer acceptance required.** All fixtures are PROPOSED synthetic (IES-015/016 convention), never presented as real companies. \|
- §13.1 unresolved (HISTORICAL): > 1. **Maintainer acceptance** of M1–M15 (all PENDING in `D17_AUTHORITY_REVIEW.md`).
- Terminal status line (HISTORICAL): > **IES-017 D17 SPECIFICATION STATUS: METHODOLOGY ACCEPTED (M1–M15 + G1–G6, recorded 2026-08-20)**

## 3. Current authority reconciliation

- Methodology: `D17 v1.0` = ACCEPT (DEC-D25 §1). DEC-D25 §6 withdraws the IES-017 confidence blocker B1 as recorded (readiness certificate + acceptance matrix record the G5 Option-A analog).
- Certification data: FROZEN 2026-08-29 by IIPS Engineering Standards Maintainer; the frozen reference assets are the authoritative test oracle (postFreezeRule).
- Acceptance evidence: engine acceptance matrix - 16 gates recorded PASS; readiness certificate records the evidence table (document 16).
- The pack self-labels above predate/side-date these records; where they disagree, the D25 + FROZEN records govern for authority purposes. No historical rewriting occurs in either direction.

| Authority record | Identity (this engine) | Effect over the historical pack wording |
| --- | --- | --- |
| DEC-D25 acceptance (2026-08-29) | blob cbab4da9ce922aacf45e513954d6e325bb037810 | methodology D17 v1.0 = ACCEPT (fresh, forward-looking; A2 preserved) |
| FROZEN manifest | FROZEN, 2026-08-29, methodologyVersion "IES-017 v1.0 (D17 normative contract)", calibrationProfile automobile-calibration-1.0.0 | certification data frozen; postFreezeRule binds |
| Acceptance matrix (16 gates PASS) | ies-017-automobile/AUTOMOBILE_ENGINE_ACCEPTANCE_MATRIX.md | implementation conformance recorded |
| Readiness certificate (recorded) | ies-017-automobile/IES-017_IMPLEMENTATION_READINESS_CERTIFICATE.md | evidence-report record incl. the recorded confidence decision |
| Historical pack self-label being reconciled | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | quoted in §2 above; superseded for authority purposes, retained as history |

## 4. Methodology principles (as accepted; unchanged by this remediation - W8/W9)

1. **Determinism.** No random, clock, or external data at execution time; identical input -> identical output/evidence/metadata (pack §5 (M11/M15)).
2. **Band semantics.** Metric -> band -> score; bands are lower-inclusive / upper-exclusive, terminal band includes its upper bound (pack §5 (M10)).
3. **Effective band-table resolution.** effective table = calibrated ?? baseline, boundaries AND scores together, only at equal band cardinality (pack §5 (M10)).
4. **Missing-data honesty.** A missing primitive is dropped and the pillar renormalizes over available metrics; an empty pillar is 0.0; nothing is fabricated, never NaN (pack §3 (M1/M2/M3; AB-001..AB-012); proven by AB-014).
5. **Pillar composition and composite.** Weighted pillars per pack §5 (M6/M7); composite = round-half-to-even at 1 decimal (composite only), left-to-right IEEE-754 summation in the fixed pillar order (pack §5 (M11/M15); raw 56.25 rounds to 56.2 (ties-to-even)).
6. **Verdict mapping and overrides.** Six-value verdict vocabulary (pack §5 (M12)); overrides apply deterministic min-rank precedence, governance -> Avoid, all other caps -> Watch; leverage-breach fires automatically at `debtEbitda >= leverageAlert` (pack §5 (M13/M14)).
7. **Null-honesty confidence.** The engine never fabricates confidence; golden expected outputs carry none; the governed transport reports null -> "unavailable" (pack evidence sections; document 11).
8. **No fabrication / synthetic provenance.** The 13 reference providers are synthetic deterministic fixtures (IES-015 convention), never presented as real companies (pack §8).
9. **Zero-CSIP registration.** The engine registers into the governed universe through ontology metadata only - no CSIP/platform/framework change (document 13).

## 5. Open items carried open

- No engine-specific open authority question is carried by this slot. Programme-level: ontology compatibility Q5 = UNVERIFIABLE; DF-1 unchanged; manifest qualification unchanged.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Methodology acceptance | governance/iips/DEC-D25-TIER3-EVIDENTIARY-STANDARD.md | cbab4da9ce922aacf45e513954d6e325bb037810 |
| Pack self-labels (historical wording) | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| Freeze record | ies-017-automobile/IES-017_FREEZE_MANIFEST.json | a7d1190edbd8bf0bfc5b852da466c5e03b6f2cd3 |
| Normative contract sections | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
