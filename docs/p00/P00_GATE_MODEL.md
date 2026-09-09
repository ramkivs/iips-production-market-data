# P00 — GATE MODEL (P00–P17)

> ## GOVERNING RULE (tracker, verbatim)
> ### **"Explicit gate acceptance; no automatic promotion."**
>
> No phase is promoted by technical completion, by authority clearance, or by the passage of
> time. Every gate requires an **explicit acceptance act** with its minimum evidence.

**Current formal gate status: 5 of 18 accepted.**
**P00 is ACCEPTED** — see `P00_GATE_ACCEPTANCE.md` (checkpoint `d29ad2f`).
**P01 is ACCEPTED** — see `../p01/P01_GATE_ACCEPTANCE.md` (package `547de1b`).
**P02 is ACCEPTED** — see `../p02/P02_GATE_ACCEPTANCE.md` (package `2dd43cd`).
**P03 is ACCEPTED** — see `../p03/P03_GATE_ACCEPTANCE.md` (checkpoint `d99c557`).
**P04 is ACCEPTED** — see `../p04/P04_GATE_ACCEPTANCE.md` (package `6ec3b288c8deeee317a63341297bd33b9a090f4f`).
**P05–P17 remain NOT ACCEPTED.**

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
| **P05** | Acquisition gate | Deterministic/local ingestion first, then provider | **Exact namespace token recorded**; PIT repeatability; degraded-state classification | P02, P04 | Not yet | No | **NO** |
| **P06** | Canonical pipeline gate | Normalize provider payloads into governed canonical form | **Token recorded**; C1–C6 collision guard evidence; 13-engine oracle byte-identity | P05 | Not yet | No | **NO** |
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

**All other gates (P05–P17) remain NOT ACCEPTED.** No further gate is accepted by this
document, and none is promoted automatically.
