# Institutional Investment Platform System (IIPS)
# Target-Shell Integration / Phase 1C — Intelligence Path-L Completion: Authority Designation Record

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `phase1c-intel-payload-auth-2026-09-22-001`
**Governing Authority:** RAMKI (Designating Authority)
**Recording Agent:** Arena (recording only — NO implementation performed in this act)
**Act Type:** AUTHORITY DESIGNATION (non-executable)
**Recorded At (local, Asia/Calcutta):** 2026-09-22
**Antecedent Checkpoint:** `881371e1b286315ac984a3c3d421bdec08493fc7`

---

## 1. Purpose

This record memorialises a single authority decision concerning the completion path of
the **Intelligence** surface delivered in Phase 1C via **PATH L** (local offline
view-model). It authorises an investigation; it does **not** authorise implementation.

Per the designating instruction, **no decision content was implemented during this act.**

---

## 2. Verified Antecedent State

Arena independently re-verified the state asserted in the designation preamble before
recording the decision. All checks were performed against the working repository at the
antecedent checkpoint. Results:

| Attestation | Asserted | Verified |
| --- | --- | --- |
| Checkpoint SHA | `881371e…3fc7` | `881371e1b286315ac984a3c3d421bdec08493fc7` ✓ |
| LOCAL == REMOTE | yes | ✓ |
| Worktree | CLEAN | ✓ |
| Intelligence nav status | PARTIAL | `partial` ✓ |
| Full regression | 413/413, 65 suites, 0 failures | ✓ re-run, identical |
| `src/identity` tree | unchanged | `9080e997` ✓ |
| `src/d114` tree | unchanged | `0062ad52` ✓ |
| `frontend/src/features/portfolio` tree | unchanged | `8491efdc` ✓ |
| `src/ui` tree | unchanged | `1597ed06` ✓ |
| `main` preserved | `94f519b` | `94f519bf` ✓ |

The designation preamble is **accurate in every particular**. No discrepancy recorded.

---

## 3. Decision Presented

Exactly one of:

- **Option A — AUTHORIZE GOVERNED OFFLINE INTELLIGENCE PAYLOAD SOURCE**
  A READ-ONLY FORENSIC + DESIGN gate to determine whether an existing repository
  artifact can serve as a governed offline `IntelligenceDTO` source.

- **Option B — KEEP INTELLIGENCE PARTIAL**
  Create/authorise nothing; record Intelligence as
  `PARTIAL / PRESENTATIONAL ONLY / NO GOVERNED OFFLINE PAYLOAD` and move to the next
  product surface designation.

---

## 4. DECISION RECORDED

> ### **OPTION A — AUTHORIZED**
> **Selected by:** RAMKI
> **Scope:** READ-ONLY FORENSIC + DESIGN gate only.
> **Implementation authority:** **NOT GRANTED** by this act.

### 4.1 Binding constraints carried by Option A

The authorised gate is bounded by **all** of the following. Each is a hard constraint:

- no API
- no `authFetch`
- no OIDC
- no Keycloak
- no `frontend/server/**`
- no live network
- no credentials
- **no fabricated intelligence data**
- **no synthetic payload presented as governed production intelligence**
- no modification to BI-01..BI-08
- no modification to D05/P04 identity
- no modification to PortfolioWorkspace
- D114 unchanged
- D115 remains **WITHHELD / UNRESOLVED**

### 4.2 Required terminal outcomes

The gate must terminate in exactly one of two reportable states:

1. **GOVERNED PAYLOAD IDENTIFIED** — report the artifact's **exact provenance** and
   **exact contract** *before* any implementation is proposed or performed.
2. **FAIL CLOSED** — report the **exact missing authority or artifact**. Fabrication,
   approximation, or synthesis to avoid a fail-closed outcome is **prohibited**.

Neither outcome authorises code changes. A further designation is required to implement.

---

## 5. Recording Agent's Disclosed Position

Arena recommended Option A and discloses that recommendation here for the record, on the
grounds that the gate is read-only, fail-closed by construction, cannot touch the frozen
trees, and resolves the open question in either direction without foreclosing Option B.

Arena **declined to select** the option itself. Selecting it would have constituted Arena
self-authorising its own next scope, contrary to the standing separation between Arena
(produces decision packets) and the designating authority (selects). The selection
recorded in §4 originated with RAMKI.

---

## 6. Pre-existing Signal (NOT a forensic finding of this act)

One relevant observation already existed from authorised Phase-1C implementation work. It
is recorded for completeness and is **explicitly not** a substitute for the authorised
gate:

- During implementation, `grep -rln IntelligenceDTO src/` matched **only** the type
  definition, the adapter, and the view-models — **no committed fixture and no governed
  payload artifact.**

**Stated limitations of that signal:**

- It was **narrow** — scoped to the literal `IntelligenceDTO` symbol, asked incidentally
  during implementation, and was **not** a forensic sweep.
- It did **not** examine `src/intelligence/*_engine.ts` (which currently require external
  inputs), governed D05/P04 company data, or `evidence/` deposits as candidate
  **derivation** sources rather than literal DTO fixtures.

Accordingly it does **not** pre-empt the gate's outcome. Arena's disclosed expectation is
that the gate terminates either at a governed derivation path via existing engines, or at
**FAIL CLOSED with an exact missing-authority report**. Both are acceptable terminations.

---

## 7. What This Act Does NOT Do

- Does **NOT** implement a payload source.
- Does **NOT** authorise implementation of a payload source.
- Does **NOT** promote Intelligence from `partial` to `implemented`.
- Does **NOT** modify any source, test, or configuration file.
- Does **NOT** authorise any additional product surface.
- Does **NOT** authorise overlays (CommandPalette / NotificationDrawer / NotesDrawer) —
  these remain **DEFERRED**.
- Does **NOT** authorise the `onSignOut` / authentication seam — remains **DEFERRED**.
- Does **NOT** alter the production / live boundary.
- Does **NOT** resolve D115.

---

## 8. Retained Governance Invariants

| Invariant | State |
| --- | --- |
| Operating mode | `NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV` |
| Intelligence surface | `PARTIAL / PRESENTATIONAL ONLY / NO GOVERNED OFFLINE PAYLOAD` |
| BI-08 | AUTHORITATIVE / UNCHANGED |
| D114 | UNCHANGED |
| D115 C | UNRESOLVED |
| D115 D | UNRESOLVED |
| `runtimeCompanyId` | UNRESOLVED |
| `implementationAuthority` | WITHHELD |
| `productionEligible` | false |
| D115 production activation | NOT AUTHORIZED |
| External live sockets | 0 |
| Windows visual acceptance | NOT CLAIMED BY ARENA |

---

## 9. Next Authorised Executable Action

**Execute `GATE-PHASE-1C-INTELLIGENCE-PAYLOAD-FORENSIC` — read-only.**

Permitted activity: inspection, enumeration, contract analysis, provenance tracing, and
production of a decision packet. Prohibited activity: any file modification outside a
governance evidence record, and any of the §4.1 constraints.

Termination: report findings per §4.2 and **STOP** for a further authority designation.

---

**End of Authority Designation Record.**
