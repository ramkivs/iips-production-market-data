# D4 Part O — Tracker Correction Specification

**SPECIFICATION ONLY. THE TRACKER XLSX HAS NOT BEEN MODIFIED IN THIS RUN.**
Authority: **AD-14 — AUTHORIZE tracker corrections at D4** (specification form).
Application to the workbook is a separate, explicitly-authorized action.

Target workbook: `IIPS Production Market Data — programme tracker` (`.xlsx`, 11 sheets, repo root).

---

## O.1 Correction classes

| Class | Meaning |
|---|---|
| **DISPOSITION** | Reuse disposition is wrong (e.g. REUSE where NEW is required) |
| **SPLIT** | One INT row conflates two distinct integrations |
| **ADD** | A required row is missing |
| **RENAME** | Terminology retired (AD-12) |
| **RECORD** | An authority decision must be captured in the tracker |

---

## O.2 Disposition corrections (UI surfaces)

| UI | Surface | Tracker value | **Corrected** | Justification |
|---|---|---|---|---|
| UI04 | Decision Matrix | REUSE | **ADAPT** | Cell-level provenance + as-of not present today |
| UI05 | Screener | REUSE | **NEW** | No screener exists; governed contract required (AD-9) |
| UI06 | Research Workspace | REUSE | **EXTEND** | Data vintage attachment to research artifacts |
| UI07 | Watchlists | REUSE | **NEW** | No watchlist persistence or contract exists |
| UI08 | Reports | REUSE | **EXTEND** | PIT reproducibility requirement is new |
| UI09 | Alerts | REUSE | **NEW** | No alert evaluation mechanism exists |
| UI10 | Collaboration | REUSE | **NEW** | No collaboration surface exists |
| UI11 | Admin / Governance | REUSE | **EXTEND** | Literal provenance must become derived feed health |
| UI12 | Notification Center | REUSE | **ADAPT** | Data-plane event payloads added |
| UI13 | Global Search | REUSE | **NEW** | No object-resolution contract exists |
| UI14 | Command Palette | REUSE | **NEW** | Same; must share UI13's single resolver |

**Rationale (user constraint):** "REUSE UI / INTEGRATE DATA" must not conceal NEW or ADAPT
work. Where a component already consumes a typed API client, the correction is *not* a rebuild
— it is a truthful disposition on the **data-integration** axis.

---

## O.3 SPLIT corrections (INT rows)

| INT row | Conflation | **Split into** |
|---|---|---|
| **INT-011** | Bundles Watchlists and Alerts | INT-011a → **UI07 Watchlists**; INT-011b → **UI09 Alerts** |
| **INT-014** | Bundles Admin/Governance and Notification Center | INT-014a → **UI11 Admin/Governance**; INT-014b → **UI12 Notification Center** |
| **INT-015** | Bundles Global Search and Command Palette | INT-015a → **UI13 Global Search**; INT-015b → **UI14 Command Palette** |

Each split row inherits the corrected disposition from O.2 and requires its own evidence
reference. Splits are the reason the effective INT baseline is **22 rows**, not 18 (Part 2).

---

## O.4 ADD corrections

| New row | Content | Reason |
|---|---|---|
| **INT-019** | D05 **Security master / reference data** integration row | D05 has no INT row today, yet it is the identity foundation for P04 (AD-1) and the screener universe (AD-9) |
| **UI15** | Engine Console | AD-13 — in scope, absent from tracker |
| **UI16** | Evidence Explorer | AD-13 |
| **UI17** | Replay Explorer | AD-13 (⚠ AD-17/M-2 caveat must be noted on the row) |
| **UI18** | Health / Status | AD-13 |
| **UI19** | AI Advisory | AD-13 (must be marked SYNTHESIZED output) |

---

## O.5 RENAME corrections (AD-12 — G2 retired)

| Field | Current | **Corrected** |
|---|---|---|
| `P12-02` task name | "G2 DTO integration" | **"Product API / DTO integration"** |
| `P12-02` deliverable | "G2 integration" | **"Product transport + typed client integration"** |
| `P12-02` evidence | "G2 evidence" | **"Product API contract evidence"** |
| Any other cell containing "G2" | — | Replace with the product-plane term; **no "G2" layer exists** (zero occurrences in the existing IIPS repository) |

---

## O.6 RECORD corrections (authority decisions to capture)

| Decision | To record |
|---|---|
| **AD-1** | Adapter model for `companyId` / security master |
| **AD-2** | `DataSnapshot`/`MarketDataSource` authorized as **sole** ingress |
| **AD-3** | `dataVersion` + `asOf` + provider included in replay lineage (**ADR pending**) |
| **AD-6** | Explicit dual-layer mapping (input snapshot vs result snapshot) |
| **AD-16** | Namespace + fail-closed collision detection authorized (**token OI-10 pending**) |
| **AD-4** | E2E-030 revalidation required — **not** revocation |
| **AD-8** | IES-016/017/020 are certified |
| **AD-9** | Screener contract certified before UI |
| **AD-11** | `DataGovernanceRuntime.classify()` authorized |
| **AD-12** | G2 retired |
| **AD-13** | UI15–UI19 in scope |
| **AD-15** | Repository is authoritative over reconstructions |

---

## O.7 Open items to add to the tracker's risk/open register

`OI-08` cardinality (1→N) · `OI-09` external identifier standard · `OI-10` namespace token
approval · AD-17/M-2 replay literals · M-1 evidence chain · M-6 retention stub ·
4 UNKNOWN authority roles (security/identity, new-program certification, P00–P17 gate
acceptors, P16 activation) · missing IES-016/017/020 certification files · `G:\IIPS\BACKUPS`
inaccessible.

---

## O.8 Application protocol (NOT executed)

1. Obtain explicit authorization to modify the workbook.
2. Snapshot the current `.xlsx` (immutable copy) before edit.
3. Apply O.2 → O.3 → O.4 → O.5 → O.6 → O.7 in that order.
4. Record a correction log sheet citing this document per change.
5. Do **not** alter certified engine, methodology or evidence rows.

**Status: NOT EXECUTED. The tracker remains byte-unchanged.**
