# P00 — GATE MODEL (P00–P17)

> ## GOVERNING RULE (tracker, verbatim)
> ### **"Explicit gate acceptance; no automatic promotion."**
>
> No phase is promoted by technical completion, by authority clearance, or by the passage of
> time. Every gate requires an **explicit acceptance act** with its minimum evidence.

**Current formal gate status: 6 of 18 accepted.**
**P00 is ACCEPTED** — see `P00_GATE_ACCEPTANCE.md` (checkpoint `d29ad2f`).
**P01 is ACCEPTED** — see `../p01/P01_GATE_ACCEPTANCE.md` (package `547de1b`).
**P02 is ACCEPTED** — see `../p02/P02_GATE_ACCEPTANCE.md` (package `2dd43cd`).
**P03 is ACCEPTED** — see `../p03/P03_GATE_ACCEPTANCE.md` (checkpoint `d99c557`).
**P04 is ACCEPTED** — see `../p04/P04_GATE_ACCEPTANCE.md` (package `6ec3b288c8deeee317a63341297bd33b9a090f4f`).
**P05 is ACCEPTED** — see `../p05/P05_GATE_ACCEPTANCE.md` (pinned baseline `cdc684435ad41982b49f832e37d1c153866da6e8`). ⚠ **PIT repeatability = MISSING / NOT DEMONSTRATED — recorded and open, not discharged.** **P05-04 = `IMPLEMENTED + EVIDENCED` within the D10-1 boundary** (`../p05/P05_04_EVIDENCE.md`; exit criterion *"Replay does not duplicate data"* MET — ⚠ limitation L-1: not exercised against a live adapter; provider execution still `NOT_AUTHORIZED`).
**P06–P17 remain NOT ACCEPTED.**

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
| **P06** | Canonical pipeline gate | Normalize provider payloads into governed canonical form | **Token recorded**; C1–C6 collision guard evidence; 13-engine oracle byte-identity | P05 ✅ | ⚠ **ENTRY AUTHORIZED by D10 (`P00_DECISION_LOG.md` §8) — scope `P06-01`/`P06-02`/`P06-03` only; C1–C6 in `DataBoundExecutor` authorized as written, no variation. AUTHORIZATION ≠ ACCEPTANCE.** **`P06-01` IMPLEMENTED + EVIDENCED** (`../p06/P06_01_EVIDENCE.md` — exit criterion *"Canonical output deterministic"* MET; ⚠ limitation L-1: not exercised against a live provider). **`P06-02` and `P06-03` authorized for entry but NOT implemented.** ⚠ **P06 remains `NOT_ACCEPTED` — no `P06_GATE_ACCEPTANCE.md` exists (D10-6).** | No | **NO** |
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

**All other gates (P06–P17) remain NOT ACCEPTED.** No further gate is accepted by this
document, and none is promoted automatically.
