# P00 — GATE MODEL (P00–P17)

> ## GOVERNING RULE (tracker, verbatim)
> ### **"Explicit gate acceptance; no automatic promotion."**
>
> No phase is promoted by technical completion, by authority clearance, or by the passage of
> time. Every gate requires an **explicit acceptance act** with its minimum evidence.

**Current formal gate status: 7 of 18 accepted.**
**P00 is ACCEPTED** — see `P00_GATE_ACCEPTANCE.md` (checkpoint `d29ad2f`).
**P01 is ACCEPTED** — see `../p01/P01_GATE_ACCEPTANCE.md` (package `547de1b`).
**P02 is ACCEPTED** — see `../p02/P02_GATE_ACCEPTANCE.md` (package `2dd43cd`).
**P03 is ACCEPTED** — see `../p03/P03_GATE_ACCEPTANCE.md` (checkpoint `d99c557`).
**P04 is ACCEPTED** — see `../p04/P04_GATE_ACCEPTANCE.md` (package `6ec3b288c8deeee317a63341297bd33b9a090f4f`).
**P05 is ACCEPTED** — see `../p05/P05_GATE_ACCEPTANCE.md` (pinned baseline `cdc684435ad41982b49f832e37d1c153866da6e8`). ⚠ **PIT repeatability = MISSING / NOT DEMONSTRATED — recorded and open, not discharged.** **P05-04 = `IMPLEMENTED + EVIDENCED` within the D10-1 boundary** (`../p05/P05_04_EVIDENCE.md`; exit criterion *"Replay does not duplicate data"* MET — ⚠ limitation L-1: not exercised against a live adapter; provider execution still `NOT_AUTHORIZED`).
**P06 is ACCEPTED** — see `../p06/P06_GATE_ACCEPTANCE.md` (pinned baseline `3f79e612e06afcd87f09c199665b12354b233e42` = **D12**; A3 acceptor **Ramakrishnan V. S. (Ramki)** under the **D10-3** P06-scoped designation). ⚠ **ADR-01 §G item 1 satisfied via D12 — `collision_census_status` = `RECONCILED — 60 coded controlling`; historical 52/54 PRESERVED and unedited, `ADR-01 §B.2` NOT rewritten, historical 54 `UNREPRODUCED` with no substitute adopted. ⚠ AD-17 `UNRESOLVED`; named digest triples `NOT REPRODUCED`. Certification `NONE_GRANTED`; production activation, provider/licensed execution and Track B → `origin/main` all `NOT_AUTHORIZED`.**
**P07–P17 remain NOT ACCEPTED.**

Gate names and intents derive from the tracker's *Phase Gates* sheet (read-only) and the
corrected D4-B phase taxonomy (`docs/d4/D4_12_PHASE_SEQUENCE.md`).

---

## Legend

**Impl. permitted now?** — under the post-D8 state (`docs/d8/D8_STATUS.json`).
**Cert. before progression?** — whether a certification act is required before the next phase.
All rows share the same **explicit acceptance requirement** and the same **minimum evidence
baseline**: *phase-specific tests + artifacts + lineage/evidence + concessions register*.

---

## Gate table

| Phase | Gate name | Gate intent | Minimum evidence (beyond baseline) | Upstream deps | Impl. permitted now? | Cert. before progression? | Accepted? |
|---|---|---|---|---|---|---|---|
| **P00** | Scope/authority baseline | Establish scope, baseline, contracts, ownership, certification posture | 6 governance artifacts; traceability to D4/D5/D7/D8; integrity proof | — | **YES** | No | **✅ ACCEPTED** |
| **P01** | Canonical contract gate | Define canonical schemas, identifiers, timestamps, units, currency | Canonical contract spec; schema versioning; determinism rules | P00 ✅ | **YES** | No | **✅ ACCEPTED** |
| **P02** | Provider abstraction/entitlement gate | Provider-neutral adapter contracts; explicit licensing/entitlement | Adapter contract; entitlement model; provider identity never surfaced | P01 ✅ | **YES** | No | **✅ ACCEPTED** |
| **P03** | Security gate | Provider credentials, service identities, tenant isolation | Secrets handling; tenant scoping proof; ⚠ M-5 limitation recorded | P01 ✅, P02 ✅ | **YES** | No | **✅ ACCEPTED** |
| **P04** | Identity/master gate | Instrument identity, mappings, listings | Mapping records; versioning; audit log; **OI-08 + OI-09 decided**; CSIP non-regression | P02 ✅, P03 ✅ | ⚠ Bounded — see `../p04/P04_GATE_ACCEPTANCE.md` §4.2 | No | **✅ ACCEPTED** |
| **P05** | Acquisition gate | Deterministic/local ingestion first, then provider | **Exact namespace token recorded**; PIT repeatability; degraded-state classification | P02 ✅, P04 ✅ | ⚠ **PIT repeatability MISSING / NOT DEMONSTRATED — accepted with the gap recorded and open, see `../p05/P05_GATE_ACCEPTANCE.md` §4.5** | No | **✅ ACCEPTED** |
| **P06** | Canonical pipeline gate | Normalize provider payloads into governed canonical form | **Token recorded**; C1–C6 collision guard evidence; 13-engine oracle byte-identity | P05 ✅ | ⚠ **ENTRY AUTHORIZED by D10 (`P00_DECISION_LOG.md` §8) — scope `P06-01`/`P06-02`/`P06-03` only; C1–C6 in `DataBoundExecutor` authorized as written, no variation. AUTHORIZATION ≠ ACCEPTANCE.** **`P06-01` IMPLEMENTED + EVIDENCED** (`../p06/P06_01_EVIDENCE.md` — exit criterion *"Canonical output deterministic"* MET; ⚠ limitation L-1: not exercised against a live provider). **`P06-02` and `P06-03` authorized for entry but NOT implemented.** ⚠ **P06 remains `NOT_ACCEPTED` — no `P06_GATE_ACCEPTANCE.md` exists (D10-6).** | ⚠ **ACCEPTED by an explicit A3 act** — `../p06/P06_GATE_ACCEPTANCE.md` (acceptor **Ramakrishnan V. S. (Ramki)**, **D10-3**; pinned baseline `3f79e61` = **D12**). Scope = the three **D10-2** work items **only**: **`P06-01`** normalization pipeline · **`P06-02`** raw/canonical storage boundary · **`P06-03`** deduplication/idempotency (**55 + 25 + 33 = 113 tests**; combined suite **377/377 PASS**); ⚠ **the tracker defines no fourth P06 work item**. ⚠ **Minimum evidence MET:** token `MD:` recorded · **C1–C6 guard 11/11** (mutation-verified) · **13/13 engines, 97/97 golden cases, 97/97 value-match, 97/97 independently byte-identical** · `tsc --noEmit` clean. ⚠ **ADR-01 §G item 1 is satisfied by the D12 authority disposition** (`collision_census_status` = **`RECONCILED — 60 coded controlling`**; historical **52/54 PRESERVED, unedited**; **`ADR-01 §B.2` NOT rewritten**; historical **54 `UNREPRODUCED`**, no substitute adopted). ⚠ **`AD-17` remains `UNRESOLVED`** and the **named historical digest triples remain `NOT REPRODUCED`** — neither closed by this acceptance, no canonicalization invented. ⚠ **Grants no certification (`NONE_GRANTED`), no production activation, no provider/licensed execution, no Track B → `origin/main` merge, and no P07/P08 work.** ⚠ **D10-6 stands as a historical record: authorization was never acceptance.** | **✅ ACCEPTED** |
| **P07** | Data quality gate | Detect missing, stale, malformed, contradictory, out-of-order data | Quality classification; completeness; **no coercion** proof | P05, P06 | Not yet | **YES** (C7, C8) | **NO** |
| **P08** | Historical/PIT gate | Historical and PIT semantics; adjusted/unadjusted series | ADR-02 evidence: byte-identical golden replay; vintage ambiguity detection | P06, P07 | Not yet | **YES** (C3, C4, C11) | **NO** |
| **P09** | Fundamentals gate | Statements, ratios, valuation inputs | Fundamentals lineage; publication vs effective time | P07, P08 | Not yet | **YES** | **NO** |
| **P10** | Intelligence data gate | News/events, consensus estimates, macro, approved alternative datasets | Approval/provenance/quality rules; ⚠ **thin D4 coverage — deepen first** | P09 | Not yet | **YES** | **NO** |
| **P11** | Engine/evidence gate | Connect canonical data to existing engines and research flows | **13-engine oracle byte-identity**; fail-closed negative tests; **no engine change**; ⚠ OI-08; inherits **AD-4** | P05, P06, P09 | Not yet | **YES** (C1, C2) | **NO** |
| **P12** | API/DTO gate *(G2 retired — AD-12)* | Expose governed data through stable APIs/contracts | Additive DTO proof; derived (not literal) provenance; **AD-9 screener contract certified before UI05** | P11 | Not yet | **YES** (C6, C7) | **NO** |
| **P13** | UI integration gate | 19 UI surfaces consume governed data | Per-surface provenance classification; degraded-state visibility; ⚠ **AD-17** constrains UI17 | P12 | Not yet | No | **NO** |
| **P14** | UX/visual/browser gate | Harden UX; qualify against screenshot targets | Parity evidence; accessibility; no fabricated provenance | P13 | Not yet | No | **NO** |
| **P15** | Full E2E certification gate | Certify provider-to-UI lineage, engine outputs, evidence | **BLOCKED — M-1 repair + revalidation (existing-IIPS)**; AD-4 = revalidation, not revocation | P11, P13, P14 | **NO** | **YES — is the certification** | **NO** |
| **P16** | Production activation authority gate | Licensing, credentials, production connectivity, entitlement | **A4 activation control**; P15 accepted | P15 | **NO** | **YES** | **NO** |
| **P17** | Operational/release certification gate | Monitoring, incident handling, provider failover | Runbooks; ⚠ **M-6 retention** open | P16 | **NO** | **YES** | **NO** |

---

## Acceptance requirements — all phases

| # | Requirement |
|---|---|
| 1 | An **explicit acceptance act** is recorded. Silence, completion or clearance is never acceptance |
| 2 | Minimum evidence for the phase exists and is cited per `P00_EVIDENCE_CONVENTIONS.md` |
| 3 | Upstream phases are themselves accepted |
| 4 | Open items blocking that phase are resolved or explicitly conceded in the concessions register |
| 5 | Certification, where required, has actually occurred — **authority clearance is not certification** |
| 6 | A3 clearance permits the acceptance *process*; it does not pre-accept any gate |

---

## Explicit statement

**P00 — Scope/authority baseline — was explicitly ACCEPTED** by the separate acceptance act
recorded in `P00_GATE_ACCEPTANCE.md`. That acceptance covers **P00 only**.

**P01 — Canonical contract gate — was subsequently ACCEPTED** by the separate act recorded in
`../p01/P01_GATE_ACCEPTANCE.md`.

**P02 — Provider abstraction/entitlement gate — was subsequently ACCEPTED** by the separate act
recorded in `../p02/P02_GATE_ACCEPTANCE.md`.

**P03 — Security gate — was subsequently ACCEPTED** by the separate act recorded in
`../p03/P03_GATE_ACCEPTANCE.md`. That acceptance covers **P03 specification only**; ⚠ **M-5
remains OPEN (existing-IIPS)**, **C12 remains BLOCKED**, and **DO-1…DO-5 remain deferred**.

**P04 — Identity/master gate — was subsequently ACCEPTED** by the separate act recorded in
`../p04/P04_GATE_ACCEPTANCE.md` (package `6ec3b288c8deeee317a63341297bd33b9a090f4f`). That
acceptance covers **P04 specification only**; **OI-08 is RESOLVED (1:N)** and **OI-09 is RESOLVED
(FIGI/OpenFIGI)**, while ⚠ **OI-P04-03 remains OPEN and bounds implementation**, and
**DO-P04-1…DO-P04-5 remain deferred**.

**P05 — Acquisition gate — was subsequently ACCEPTED** by the explicit **A3** act recorded in
`../p05/P05_GATE_ACCEPTANCE.md` (acceptor **Ramakrishnan V. S. (Ramki)**, pinned baseline
`cdc684435ad41982b49f832e37d1c153866da6e8`). That acceptance covers **P05-01 implementation
plus the P05-02 and P05-03 specification / adapter-contract packages**. ⚠ **PIT repeatability —
a P05 minimum-evidence item — is MISSING / NOT DEMONSTRATED**; the A3 decision accepts P05 with
that gap **recorded and open**, and the gap does not become evidence because acceptance
occurred. ⚠ **P05-04 — `NOT_AUTHORIZED` at the moment of P05 acceptance (D9 N-3) — is now `IMPLEMENTED + EVIDENCED` within the D10-1 boundary** (`../p05/P05_04_EVIDENCE.md`: scheduling · bounded retry execution · idempotent checkpointing; exit criterion *"Replay does not duplicate data"* demonstrated by X-1…X-6 plus an interrupted-run/resume proof; run logs are **LOCAL SYNTHETIC**, and limitation **L-1** records that the path is not exercised against a live P05-02 adapter). ⚠ **That record is additive: the P05 acceptance record's R-13/R-14 remain historically true and unedited.** Provider
execution and licensed historical acquisition remain **`NOT_AUTHORIZED` (N-1 / N-2)**;
**OI-P04-03, OI-P04-04 and DEP-P01-04 remain OPEN**.

**P06 — Canonical pipeline gate — was subsequently ACCEPTED** by the explicit **A3** act
recorded in `../p06/P06_GATE_ACCEPTANCE.md` (acceptor **Ramakrishnan V. S. (Ramki)**, the **P06-scoped**
designation made by **D10-3**; pinned baseline `3f79e612e06afcd87f09c199665b12354b233e42` = **D12**).
That acceptance covers the **three D10-2 work items only** — **`P06-01`** normalization pipeline,
**`P06-02`** raw/canonical storage boundary, **`P06-03`** deduplication/idempotency (**55 + 25 + 33 =
113 tests**; combined suite **377/377 PASS**); the tracker defines **no fourth P06 work item**.
⚠ **The minimum evidence at `:42` is MET**, with **D12** (`P00_DECISION_LOG.md` §10) as the authority
disposition for **ADR-01 §G item 1** — `collision_census_status` = **`RECONCILED — 60 coded
controlling`**, while the historical **52 coded / 54 free-form** figures are **preserved and
unedited**, **`ADR-01 §B.2` is NOT rewritten**, and the historical **54 remains `UNREPRODUCED`** with
no substitute adopted. ⚠ **ADR-01 §G evidence delivered:** 13/13 engines · 97/97 golden cases ·
97/97 value-match · 97/97 independently byte-identical · C1–C6 guard 11/11, mutation-verified.
⚠ **`AD-17` remains `UNRESOLVED`** and the **named historical digest triples remain `NOT REPRODUCED`**
— neither was closed by this acceptance and no canonicalization was invented.
⚠ **This acceptance grants no certification (`NONE_GRANTED`), no production activation
(`NOT_AUTHORIZED`, A4 at P16), no provider or licensed execution (`NOT_AUTHORIZED`, N-1/N-2) and no
Track B → `origin/main` merge.** ⚠ **P06 acceptance performs no P07 or P08 work and designates no
P07–P17 acceptor.**

**All other gates (P07–P17) remain NOT ACCEPTED.** No further gate is accepted by this
document, and none is promoted automatically.

---

## P08 A3 GATE-ACCEPTOR DESIGNATION — appended 2026-09-12 (act **F-4**)

> ### ✅ **A3 P08 gate acceptor = SAI. Scope = the P08 gate ONLY.**

Recorded by explicit **Program Authority** act against baseline `46537f7`
(`docs/F4A_PHASE_08_A3_DESIGNATION_RECORDING.md`; `P00_DECISION_LOG.md` **§39**).

⚠ **This changes exactly ONE field: the P08 A3 acceptor, `NOT_DESIGNATED` → `DESIGNATED (Sai)`.**
**No gate status, no acceptance, no certification and no activation state moves. The formal gate
count is UNCHANGED.**

⚠ **DESIGNATION IS NOT ACCEPTANCE** (rule 6: *"A3 clearance permits the acceptance process; it
does not pre-accept any gate"*). **P08 remains `NOT_ACCEPTED`** — a separate acceptance act by Sai
is required, and it must independently establish the P08 minimum evidence at `:45` (**ADR-02
byte-identical golden replay**; **vintage ambiguity detection**).

⚠ Scoped to **P08 only**. It does **not** designate **A1**, **A2** or **A4**; does **not** extend
the **§7** (P05) or **D10-3** (P06) designations, or **§27 / O-5** (P07); does **not** extend or
reuse the **A2** certification designation (`2d28e42`, scoped to P07) — **A2 ≠ A3** (rule 5:
*"authority clearance is not certification"*); and does **not** constitute a standing per-phase
assignment for **P09–P17**.

⚠ **UNCHANGED:** **C7 `NOT_CERTIFIED`** · certification **`NONE_GRANTED`** · production activation
**`NOT_AUTHORIZED`** (A4 at P16) · **P09–P17 NOT AUTHORIZED** · **AG-1 OPEN** · **AG-2 OPEN /
NON-BLOCKING** · P08-01/P08-02/P08-03 source, tests and methodology · every P01–P07 artifact ·
existing-IIPS. ⚠ **BD-11 / NB-1** (*"no P08 A3"*) is **DISCHARGED**; all other BD items preserved.

⚠ The prior **F4-B** finding (`docs/F4_PHASE_08_A3_ACCEPTOR_DESIGNATION.md`, `46537f7`) is
**preserved byte-for-byte and left unedited** as the record of its own moment, and is **superseded
by addition as to current state only**.

---

## P08 GATE ACCEPTANCE — appended 2026-09-12

> ### ✅ **P08 — Historical/PIT gate — is ACCEPTED** by explicit **A3** act (acceptor **Sai**, P08 gate only).

`docs/PHASE_08_GATE_ACCEPTANCE.md`, pinned baseline `4836c82` (**D25**); `P00_DECISION_LOG.md` **§40**.
Scope: **P08-01** PIT storage · **P08-02** corporate actions · **P08-03** adjusted/unadjusted series
(**90 P08 tests**; suite **626/626**). Minimum evidence at `:45` met **as scoped by D25** —
**ADR-02 §I.2/§I.3/§I.4** evidenced; **vintage ambiguity detection fail-closed at admission**.

⚠ **ACCEPTANCE IS NOT CERTIFICATION** (rule 5 governs *progression*, not acceptance — the **P07**
precedent: accepted §36, certification withheld §38). **C7 `NOT_CERTIFIED`** · **C3/C4/C11
`NOT_CERTIFIED`** · certification **`NONE_GRANTED`** · production activation **`NOT_AUTHORIZED`**
(A4 at P16) · **P09–P17 `NOT_AUTHORIZED`**.

⚠ **NOT resolved by this acceptance:** **ADR-02 §I.1** remains an **UNSATISFIED existing-IIPS**
obligation (D25) · **AD-17/M-2 UNRESOLVED** · **AG-1** / **AG-2** **OPEN** (bounded, non-blocking) ·
**PIT durable persistence OPEN**, travelling forward · F-2 · F-5 · branch-ref discrepancy.
⚠ **No concession was invoked and no concessions register was created** (P05 **PIT-7/NG-14**, P06:119).

⚠ **Lines :17 and :121 above — *"P07–P17 remain NOT ACCEPTED"* — are STALE** as to **P07** (accepted,
§36), **P08** (accepted, §40), **P13** (accepted, reconciliation act 2026-09-14), and **P14**
(accepted, reconciliation act 2026-09-14). They are **left unedited** as the record of their own
moment and are **superseded by addition** by this block and the P13/P14 reconciliation sections
below. **Formal gate status: P00, P01, P02, P03, P04, P05, P06, P07, P08, P13, P14 accepted.**

---

## P13 GATE ACCEPTANCE — appended 2026-09-14 (reconciliation act)

> ### ✅ **P13 — UI Integration Gate — is ACCEPTED** by explicit **A3** act (acceptor **Sai**, P13 gate only).

`docs/PHASE_13_GATE_ACCEPTANCE.md`, authorization basis **D32** (commit `2f131d9`); A3 acceptor
designated by **D33** (Program Authority, explicit naming). Scope: **UI01 through UI19** (19 UI
surfaces) — per-surface provenance classification, degraded-state visibility, cross-surface rules
**U1–U10** (**85 P13 tests**; 8 source files, 1,361 lines; 8 + 1 helper test files, 890 lines).

**Implementation baseline provenance:** Original baseline commit `510b453ed672e4be25c4dce4c4346169a5e24d3d`
is **UNRECOVERABLE** (confirmed not in any branch, reflog, or loose objects). Current `p13/src/`
files are **designated as the authoritative P13 baseline** by explicit Program Authority act
(reconciliation act 2026-09-14, Decision 2 Option C). File count and module names verified against
acceptance record (8 source files: `dataSurfaces.js`, `screenerSurface.js`, `newSurfaces.js`,
`extendSurfaces.js`, `resolverSurface.js`, `boundedSurfaces.js`, `crossSurfaceRules.js`,
`provenanceView.js`).

⚠ **ACCEPTANCE IS NOT CERTIFICATION.** P13 certification = **NONE** (not required before P14
progression). Production activation **`NOT_AUTHORIZED`** (A4 at P16).

⚠ **NOT resolved by this acceptance:** **AD-17/M-2 UNRESOLVED** (scoped to UI17, bounded) ·
**E13-10 REMAINS OPEN** ("zero UI source tracked" — structural blocker; no authoritative UI
application source established; `p13/src/` contains UI surface logic modules, not the actual UI
application) · **existing-IIPS UI not identified or reconciled**.

⚠ This acceptance was recorded by the P13 acceptance act but was not reflected in the gate model
until this reconciliation. The acceptance record is preserved byte-for-byte at
`docs/PHASE_13_GATE_ACCEPTANCE.md`. This appended section reconciles the gate model to match.

---

## P14 GATE ACCEPTANCE — appended 2026-09-14 (reconciliation act)

> ### ✅ **P14 — UX/Visual/Browser Gate — is ACCEPTED** by explicit **A3** act (acceptor **Sai**, P14 gate only).

`docs/PHASE_14_GATE_ACCEPTANCE.md`, implementation commit `9e45ac2fe88147591ad2cd8373b2311a7b0534d3`
(recovered to branch `p14-implementation-recovered`); authorization basis **D38** (`22bf59e`); A3
acceptor designated by **D37** (Program Authority, explicit naming). Scope: **P14-01** Provenance
Integrity · **P14-02** Visual Parity Baseline · **P14-03** Visual Parity Qualification · **P14-04**
Accessibility Conformance · **P14-05** Browser Compatibility · **P14-06** Non-Regression Oracle Gate
(**75 P14 tests**; 6 source files; full regression **1160/1166 PASS**, 6 pre-existing stale
boundary assertions — non-blocking).

**Implementation provenance:** Commit `9e45ac2` was a dangling commit (not reachable from any
branch). Recovered to branch `p14-implementation-recovered` by explicit Program Authority act
(reconciliation act 2026-09-14, Decision 3 Option A). Parent chain verified: `9e45ac2` → `22bf59e`
(D38) → `d107c41` (D37). Source files in commit byte-identical to current `p14/src/` files.

⚠ **ACCEPTANCE IS NOT CERTIFICATION.** P14 certification = **NONE_GRANTED**. Production activation
**`NOT_AUTHORIZED`** (A4 at P16).

⚠ **NOT resolved by this acceptance:** **EB14-3 REMAINS OPEN** ("No UI source/oracle" — bounded
condition; no authoritative UI application source established; P14 oracle validates against UI
surfaces whose authoritative source remains unestablished) · **AD-17/M-2 UNRESOLVED** ·
**existing-IIPS UI not identified or reconciled**.

⚠ This acceptance was recorded by the P14 acceptance act but was not reflected in the gate model
until this reconciliation. The acceptance record is preserved byte-for-byte at
`docs/PHASE_14_GATE_ACCEPTANCE.md`. This appended section reconciles the gate model to match.
