# IES-017 02 EXECUTIVE SUMMARY

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

# Document 02 - EXECUTIVE SUMMARY (IES-017 remediated content)

## 1. Summary

IES-017 is the Automobile sector engine of the v3.0 Engine Certification Program: a deterministic scoring engine that maps 13 synthetic reference providers onto six pillars (quality, growth, risk, profitability, capitalEfficiency, valuation), composites them under a subsegment weight vector with archetype-risk scaling, maps the composite to a six-value verdict vocabulary, and applies deterministic min-rank overrides. Its methodology (`D17 v1.0`) is ACCEPT under DEC-D25 as a fresh forward-looking acceptance; the engine remains A2. No historical acceptance is claimed.

## 2. Frozen oracle results (13 cases, all six verdict bands exercised)

| Case | Provider (synthetic) | Subsegment | Archetype | Composite | Verdict | Overrides |
| --- | --- | --- | --- | --- | --- | --- |
| AB-001 | Global Volume OEM | mass-market-oem | full-line | 71.3 | Buy | - |
| AB-002 | Premium Luxury Brand | premium-oem | luxury | 74.8 | Buy | - |
| AB-003 | Commercial Vehicle Leader | commercial-vehicles | commercial | 69.2 | Accumulate | - |
| AB-004 | Global Tier-1 Supplier | tier-1-supplier | component-supplier | 70.6 | Buy | - |
| AB-005 | EV Pure-Play Challenger | ev-native | ev-pure-play | 66.9 | Accumulate | - |
| AB-006 | Legacy OEM Under Pressure | mass-market-oem | full-line | 56.0 | Watch | leverage-breach, margin-compression, competition-pressure |
| AB-007 | Premium EV Leader | premium-oem | ev-pure-play | 83.6 | Strong Buy | - |
| AB-008 | Sub-scale Supplier | tier-1-supplier | component-supplier | 56.6 | Hold | - |
| AB-009 | Multi-subsegment Hybrid OEM | premium-oem (resolved) | luxury | 71.8 | Buy | - |
| AB-010 | Half-Even Tie OEM | mass-market-oem | full-line | 56.2 | Hold | - |
| AB-011 | Governance-Risk OEM | mass-market-oem | full-line | 39.0 | Avoid | leverage-breach, governance |
| AB-012 | Recall + Demand Collapse OEM | premium-oem | luxury | 68.5 | Watch | recall-risk, demand-collapse |
| AB-013 | Exact Band Boundaries OEM | commercial-vehicles | commercial | 64.8 | Accumulate | - |

Verdict distribution across the frozen 13 cases: Accumulate: 3; Avoid: 1; Buy: 4; Hold: 2; Strong Buy: 1; Watch: 2. All six bands are exercised. Anchor case AB-001: composite 71.3, verdict Buy (frozen in the certified replay baseline, cited by DEC-D25).

Coverage recorded in the pack (pack §7): all 6 verdict bands; multi-subsegment + hybrid resolution (AB-009); governance -> Avoid (AB-011); leverage-breach (AB-006, AB-011); round-half-to-even tie (AB-010, raw 56.25 rounds to 56.2 (ties-to-even)); missing primitive (AB-014) and band/calibrated-boundary semantics (AB-015 (calibrated band boundary, ev-native)) in the validation fixtures.

Registered source discrepancy (carried open, not adjudicated here): the pack case table records AB-002 composite=74.9 vs frozen 74.8; AB-009 composite=71.9 vs frozen 71.8. The frozen expected-outputs JSON is the recorded certification oracle (DEC-D25 relies on the frozen certified replay baseline); an independent re-computation during this remediation reproduces the frozen values exactly. The pack table is therefore superseded for value purposes; no pack edit is made or authorized.

## 3. Consistency claims and their limits

- Every composite/verdict/override above is the frozen recorded value; the remediation build reproduced all 13 cases value-exactly from the pinned golden reference + calibration (document 15 shows the reproduction table).
- Stored replay `reproduced`/`byteIdentical` markers are stored claims (P1 rule); DF-1 (byteIdentical=false, caseDiffs=0) is carried unchanged and is not resolved by this document.
- A2 labelling: this summary claims nothing beyond the frozen evidence; no certification, no parity, no promotion.
## Sources and traceability (R5)

All source assets are pinned read-only at product baseline `830bd7218f6a77274e3d58eef09d706a3a99794f` (branch phase13-next).

| Claim domain | Source path | Pinned git blob |
| --- | --- | --- |
| Frozen case values | ies-017-automobile/expected-outputs/automobile-expected-outputs-1.0.0.json | b9982d744d92d592714dcc5b1e8599bed63752f2 |
| Provider identities | ies-017-automobile/fixtures/automobile-golden-reference-1.0.0.json | 11dcd3953046c4e27f80a8ffc71c2c7ef59ede47 |
| Coverage statements | ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md | e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b |
| D25 anchor citation | governance/iips/DEC-D25-TIER3-EVIDENTIARY-STANDARD.md | cbab4da9ce922aacf45e513954d6e325bb037810 |

Governance records cited: DEC-D25 evidentiary standard (methodology acceptance, blob `cbab4da9ce922aacf45e513954d6e325bb037810`); DEC-D15 verification methodology (blob `8cc089df6ae680706921dd5ecb57b75776ad4580`); DEC-D14 documentation-parity invariant (blob `84e276ad4246f1618731b135884005d937e5820e`); DEC-D36 documentation authority, CLOSED at 63 files - historical fact (blob `747178d0adb86699d39486f261ac273bbf8f527e`); D36-successor 57-document authority (governance commit `73e7f668e91a909a9dfdcfdc0ec041fd85f74c33`); P2 substantive review recording `81e1b515...`; remediation discovery recording `e3145c7e5de9214f175deaa2161268a17731e291`; remediation execution-plan recording `71693115a9d3f6721a4c1be85a5967dd06d4586a`.

## Open items carried open (R6)

- None specific to this document beyond the programme-level carried items (IES-020 pack §28 Q1-Q5 open; ontology compatibility Q5 = UNVERIFIABLE; DF-1 byteIdentical=false / caseDiffs=0 unchanged; manifest 33/33 qualification unchanged).
