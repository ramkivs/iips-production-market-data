# D8 — FIRST EXECUTABLE WORK PACKAGE

**Selected by dependency order, not convenience.** Exactly one package.
**NOT executed in D8.**

---

## Identification

| Field | Value |
|---|---|
| **Work package ID** | **WP-P00-01** |
| **Work package name** | **Governance Baseline Establishment** |
| **Corresponding phase** | **P00 — Governance** (tracker gate: "Scope/authority baseline") |
| **Type** | Governance / documentation — **no production market-data code** |
| **Authorized by** | Sai/Ramki approval of record, via `D8_EXECUTION_AUTHORIZATION.md` |
| **Executed in D8?** | **NO** |

---

## Dependency rationale

`docs/d4/D4_12_PHASE_SEQUENCE.md` records P00 with **`Depends on: —`** — it is the only phase
in the P00–P17 sequence with no upstream dependency. Every alternative has an unmet upstream
deliverable (P01←P00, P02←P01, P03←P01, P04←P02/P03, P05←P02/P04 + token, P11←P05/P06/P09).
Choosing any of them would silently reorder the agreed sequence, which is forbidden.

P00's two D7 blockers were precisely (a) the user's *"do not scaffold P00 yet"* hold and
(b) A3 gate-acceptor UNKNOWN. The Sai/Ramki approval clears both. P00 is therefore the correct
and only first executable package.

---

## Objective

Establish the governance baseline for the production market-data program: scope of record,
authority register in its post-D8 state, decision log, gate model and evidence conventions —
so that P01's canonical data contract work begins against a governed, auditable baseline
rather than an implicit one.

**P00 is a governance/documentation phase. It produces no production market-data code.**

---

## Prerequisites now satisfied

| # | Prerequisite | Basis |
|---|---|---|
| 1 | "Do not scaffold P00 yet" hold lifted | Sai/Ramki approval to move forward |
| 2 | A3 gate-acceptance authority cleared | D8 §D — gate acceptance is now possible |
| 3 | A2 implementation authority cleared | D8 §D |
| 4 | Corrected specification baseline exists | D4 (18 outputs) + D4-B corrections |
| 5 | ADR-01 / ADR-02 authority holds cleared | D8 §B, §C |
| 6 | No upstream phase dependency | `D4_12_PHASE_SEQUENCE.md` — P00 `Depends on: —` |

---

## Dependencies

| Direction | Detail |
|---|---|
| **Upstream** | **NONE** — `D4_12_PHASE_SEQUENCE.md` records P00 with `Depends on: —` |
| **Downstream** | P01 Data Contract (blocked until the P00 gate is explicitly accepted); transitively all of P02–P17 |
| **Lateral (read-only inputs)** | `docs/d4/*` (corrected baseline), `docs/d5/*` (ADR packages), `docs/d7/*` (authority hold record), `docs/d8/*` (this reconciliation), the tracker's *Phase Gates* sheet (read-only) |
| **Existing-IIPS** | **Depends on, does not modify** — engine/certification/methodology artifacts are cited as evidence only |

---

## Prerequisites still outstanding

| # | Outstanding | Effect on P00 | Effect downstream |
|---|---|---|---|
| 1 | **Exact namespace token not recorded** (OI-10) | **None** — P00 does not touch field keys | Blocks P05, P06, P11 |
| 2 | **OI-08** cardinality decision | None | Blocks P04 completion |
| 3 | **OI-09** identifier standard | None | Blocks P04 completion |
| 4 | **AD-17 / M-2** unresolved | None — recorded as an open item | Affects UI17 reporting (P13) |
| 5 | **M-1 / AD-4** revalidation | None — recorded as an open item | Blocks P15 |
| 6 | **M-5, M-6** | None — recorded | P03 / P17 limitations |
| 7 | A3 person-specific assignment | None — clearance suffices to record the gate model | Each gate acceptance is a separate act |

**No outstanding item blocks P00.**

---

## Files / components expected to change

**New governance artifacts under `docs/p00/` (new directory):**

| Artifact | Content |
|---|---|
| `P00_PROGRAM_CHARTER.md` | Scope of record, objectives, in/out of scope, the 13-engine and 19-surface invariants |
| `P00_AUTHORITY_REGISTER.md` | Post-D8 authority state: ADR-01/ADR-02 approved, A1–A4 cleared, AD-17/M-1/M-5/M-6 open |
| `P00_DECISION_LOG.md` | All 14 G-A decisions + ADR-01 + ADR-02 + the D8 approval, with status and evidence |
| `P00_GATE_MODEL.md` | Per-phase gate, gate intent, minimum evidence, and the tracker rule "Explicit gate acceptance; no automatic promotion" |
| `P00_EVIDENCE_CONVENTIONS.md` | Citation format (path + line + **pinned commit**, per `D8_EVIDENCE_NOTES.md` CD-01), artifact naming, evidence storage |
| `P00_OPEN_ITEMS_REGISTER.md` | OI-08, OI-09, OI-10, AD-17, M-1, M-5, M-6 with owners and blocking effects |

**Possibly updated:** `docs/d8/D8_STATUS.json` (to record P00 as started) — status tracking only.

---

## Files / components explicitly FORBIDDEN to change

| # | Forbidden |
|---|---|
| 1 | **Any file in `iips-review-recovered`** |
| 2 | Any `iips-platform` source or test file |
| 3 | Any of the 13 engines, or any scoring / calibration / taxonomy artifact |
| 4 | Frozen methodologies: Auto Option-A, Materials G1–G6, Telecom D16 |
| 5 | `DataBoundExecutor` / `LiveDataRuntime.ts` — ADR-01 is approved but is a **P05/P06/P11** change, not P00 |
| 6 | `ReplayService` — AD-17 unresolved |
| 7 | **The tracker XLSX** — AD-14 corrections remain specified, not applied |
| 8 | **The SPEC DOCX** |
| 9 | Any certification artifact, including `PROGRAM_v1.1_REPLAY_BASELINE.json` and the E2E-030 document |
| 10 | `docs/d4/`, `docs/d5/`, `docs/d7/` — historical record; corrections go in new runs |
| 11 | Any production market-data implementation code |

---

## Acceptance criteria

| # | Criterion |
|---|---|
| 1 | All six governance artifacts exist and are internally consistent |
| 2 | Authority register reflects the exact post-D8 state, including **APPROVED-BUT-REQUIRES-EXACT-TOKEN RECORDING** for OI-10 |
| 3 | AD-17 recorded as **UNRESOLVED**; M-1 recorded as **OPEN — revalidation required, not revocation**; E2E-030 recorded as **not revoked, not renewed** |
| 4 | Gate model covers all 18 phases and preserves "Explicit gate acceptance; no automatic promotion" |
| 5 | Evidence conventions require commit-pinned citations |
| 6 | Invariants restated unchanged: 13 engines · 19 UI surfaces · sole ingress · adapter model · G2 retired |
| 7 | No forbidden file modified |
| 8 | No certification claimed; no gate accepted within P00's own artifacts |
| 9 | Open-items register complete (7 items) with owners |
| 10 | Traceable to D4/D5/D7/D8 by explicit citation |

---

## Evidence required at completion

1. Inventory of created artifacts with checksums.
2. Diff/status proof that no forbidden file changed (`git status`, checksums for tracker and SPEC).
3. Traceability matrix: each governance statement → its D4/D5/D7/D8 source.
4. Authority-state snapshot matching `D8_STATUS.json`.
5. Open-items register with owner and blocking effect per item.
6. Explicit integrity statement: no source, no tests, no methodology, no certification, no
   existing-IIPS modification, no implementation.

---

## Certification implications

| Aspect | Implication |
|---|---|
| **Certification required to execute WP-P00-01?** | **NO.** P00 is a governance/documentation phase; it produces no certifiable data-plane or engine-plane artifact |
| **Certification produced by WP-P00-01?** | **NONE.** No certification is granted, claimed or implied |
| **Certification requirements touched** | **NONE of C1–C12.** They are *recorded* in the open-items and authority registers, not satisfied |
| **Effect on existing certifications** | **NONE.** E2E-030 remains **not revoked, not renewed**; AD-4 revalidation requirement is recorded verbatim and unchanged |
| **Effect on the 13 engine certifications** | **NONE.** No engine, methodology, scoring, calibration or taxonomy artifact is touched |
| **Downstream certification enablement** | The evidence conventions and gate model produced here define *how* later certification evidence will be cited and accepted — a precondition for C1–C12 being auditable, not a substitute for them |
| **A2 certification authority** | Cleared, but **no certification act occurs in this work package** |

---

## Explicit non-scope

WP-P00-01 explicitly does **NOT** include:

| # | Out of scope |
|---|---|
| 1 | Any production market-data implementation code |
| 2 | Any change to `DataBoundExecutor` / `LiveDataRuntime.ts` — ADR-01 is approved but is P05/P06/P11 work |
| 3 | Any change to `ReplayService` or replay identity — ADR-02 is approved but is P08 work |
| 4 | Recording the exact namespace token — that is a separate Sai/Ramki recording action (OI-10) |
| 5 | Deciding OI-08 (cardinality) or OI-09 (identifier standard) — P04-gating content decisions |
| 6 | Resolving AD-17, or repairing M-1, M-5 or M-6 — existing-IIPS responsibilities |
| 7 | Applying the AD-14 tracker corrections — specified in D4 Part O, still not authorized to apply |
| 8 | Modifying the SPEC DOCX |
| 9 | Granting any certification or accepting any phase gate, including P00's own |
| 10 | Starting P01 or any later phase |
| 11 | Any production activation |
| 12 | Re-litigating the 14 G-A decisions or altering any D4 disposition |

---

## Next gate after completion

> **P00 gate — "Scope/authority baseline"**
> Promotion rule (tracker, verbatim): **"Explicit gate acceptance; no automatic promotion."**

Acceptance requires an **explicit acceptance act** under the now-cleared A3 authority. It is
not automatic and is not granted by D8.

**On acceptance, the next phase becomes P01 — Data Contract** (canonical schemas, identifiers,
timestamps, units, currency). P01 must not begin before the P00 gate is explicitly accepted.
