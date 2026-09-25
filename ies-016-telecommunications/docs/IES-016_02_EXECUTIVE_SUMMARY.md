# IES-016 02 EXECUTIVE SUMMARY

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

# Document 02 - EXECUTIVE SUMMARY (IES-016 remediated content)

## 1. Summary

IES-016 is the Telecommunications sector engine of the v3.0 Engine Certification Program: a deterministic scoring engine that maps 13 synthetic reference providers onto six pillars (quality, growth, risk, profitability, capitalEfficiency, valuation), composites them under a subsegment weight vector with archetype-risk scaling, maps the composite to a six-value verdict vocabulary, and applies deterministic min-rank overrides. Its methodology (`D16 v1.0`) is ACCEPT under DEC-D25 as a fresh forward-looking acceptance; the engine remains A2. No historical acceptance is claimed.

## 2. Frozen oracle results (13 cases, all six verdict bands exercised)

| Case | Provider (synthetic) | Subsegment | Archetype | Composite | Verdict | Overrides |
| --- | --- | --- | --- | --- | --- | --- |
| TC-001 | National Wireless Leader | wireless-mno | consumer | 77.8 | Buy | - |
| TC-002 | Fixed-Line Broadband ISP | fixed-broadband | enterprise | 71.4 | Buy | - |
| TC-003 | Converged Telecom Group | converged-telco | converged | 70.0 | Buy | - |
| TC-004 | Cable MSO Operator | cable-mso | wholesale | 74.5 | Buy | - |
| TC-005 | Tower Infrastructure REIT | tower-infra | infrastructure | 69.6 | Accumulate | - |
| TC-006 | Challenger Mobile Operator | wireless-mno | consumer | 60.5 | Watch | leverage-breach, competition-pressure, margin-compression |
| TC-007 | Enterprise Fiber & Data Center | fixed-broadband | enterprise | 80.0 | Strong Buy | - |
| TC-008 | Regional Cable MSO (sub-scale) | cable-mso | wholesale | 65.1 | Accumulate | - |
| TC-009 | Converged Hybrid (multi-subsegment) | wireless-mno (resolved) | converged | 68.4 | Accumulate | - |
| TC-010 | Sub-scale Fixed Operator | fixed-broadband | enterprise | 62.7 | Accumulate | - |
| TC-011 | Governance-Risk Operator | wireless-mno | consumer | 38.6 | Avoid | leverage-breach, governance |
| TC-012 | Half-Even Boundary Operator | wireless-mno | consumer | 55.0 | Hold | - |
| TC-013 | Stressed Fixed Operator | fixed-broadband | enterprise | 49.5 | Watch | - |

Verdict distribution across the frozen 13 cases: Accumulate: 4; Avoid: 1; Buy: 4; Hold: 1; Strong Buy: 1; Watch: 2. All six bands are exercised. Anchor case TC-001: composite 77.8, verdict Buy (frozen in the certified replay baseline, cited by DEC-D25).

Coverage recorded in the pack (pack §7): all 6 verdict bands; multi-subsegment + hybrid resolution (TC-009); governance -> Avoid (TC-011); leverage-breach (TC-006, TC-011); round-half-to-even tie (TC-012, raw 55.05 rounds to 55.0 (ties-to-even)); missing primitive (TC-014) and band/calibrated-boundary semantics (TC-015 (exact band boundaries)) in the validation fixtures.

## 3. Consistency claims and their limits

- Every composite/verdict/override above is the frozen recorded value; the remediation build reproduced all 13 cases value-exactly from the pinned golden reference + calibration (document 15 shows the reproduction table).
- Stored replay `reproduced`/`byteIdentical` markers are stored claims (P1 rule); DF-1 (byteIdentical=false, caseDiffs=0) is carried unchanged and is not resolved by this document.
- A2 labelling: this summary claims nothing beyond the frozen evidence; no certification, no parity, no promotion.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Frozen case values | ies-016-telecommunications/expected-outputs/telecommunications-expected-outputs-1.0.0.json | 0d45ffc44df6d61a6f95dac15a12cb6f88be3155 |
| Provider identities | ies-016-telecommunications/fixtures/telecommunications-golden-reference-1.0.0.json | f0dfc647b8e0220d04a241902a82899e3a667393 |
| Coverage statements | ies-016-telecommunications/TELECOMMUNICATIONS_DISCOVERY_PACK.md | 68aae104dd3a0ccad8122d5770bd8d2c61637ba6 |
| D25 anchor citation | governance/iips/DEC-D25-TIER3-EVIDENTIARY-STANDARD.md | cbab4da9ce922aacf45e513954d6e325bb037810 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
