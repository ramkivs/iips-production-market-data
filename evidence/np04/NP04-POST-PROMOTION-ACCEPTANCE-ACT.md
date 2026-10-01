# NP04 — POST-PROMOTION ACCEPTANCE ACT

**Act identifier:** `np04-post-promotion-acceptance-2026-10-01-001`
**Act Type:** ACCEPTANCE_AUTHORITY_ACT (adjudication only — **NOT** an execution, **NOT** a
designation, **NOT** a qualification, **NOT** an implementation authorization, **NOT** a promotion,
**NOT** an integration authorization, **NOT** a certification, **NOT** an A2-class designation,
**NOT** a production authorization, **NOT** a tracker status mutation)
**Governing Gate:** `NP04-POST-PROMOTION-ACCEPTANCE`
**Acceptance Authority:** **RAMKI** — designated A3 acceptor for `NP04-POST-PROMOTION-ACCEPTANCE`
**Designation Act:** `evidence/np04/NP04-POST-PROMOTION-ACCEPTANCE-AUTHORITY-DESIGNATION-ACT.md`
(commit `61e8e593316a8b58cb3b4ffff5c3261798ac776c`; **ACCEPTANCE AUTHORITY ONLY**, gate-scoped,
state-scoped, one-time, non-standing, non-transferable)
**Accepted By:** **RAMKI** — exercising the acceptance authority designated by the designation act
**Recording Agent:** Arena (recording only; executor of preceding verification/execution gates —
**acceptance ≠ execution**; the Recording Agent does not accept its own output)
**Authority Instruction:** RAMKI — instruction "NP04-POST-PROMOTION-ACCEPTANCE-ACT" (2026-10-01)
**Scope:** The already-promoted NP04 Phase-A integration state ONLY
**Nature:** POST-PROMOTION ACCEPTANCE (governance/evidence artifact only)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Execution Mode:** NON_PRODUCTION
**Recorded At (local, Asia/Calcutta):** 2026-10-01 22:45 (2026-10-01T17:15:45Z)
**Repository:** `ramkivs/iips-production-market-data` (IPD — authoritative)
**Recording branch (this record):** `arena/01a0f839-iips-production-market-data`

---

## 0. PRE-ACCEPTANCE RECHECK (performed read-only immediately before this act)

| # | Check | Expected | Observed | Result |
|---|---|---|---|---|
| A | Target branch tip | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` | ✓ MATCH |
| B | Target tree | `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5` | `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5` | ✓ MATCH |
| C | Accepted implementation branch tip | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` | ✓ MATCH |
| D | PMD `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | ✓ MATCH — UNMOVED |
| E | Designation act `61e8e59` remotely retrievable | retrievable, blob `bce386e3…` | fetched independently; body sha256 `2983592d7b37…` = recorded; `git hash-object` = `bce386e3d384df1f0e441c476ef8d545f56caa18` | ✓ VERIFIED |
| F | Designation names RAMKI for this exact gate | named acceptor RAMKI, `NP04-POST-PROMOTION-ACCEPTANCE` only | confirmed verbatim in retrieved body (§2) | ✓ VERIFIED |
| G | Competing NP04 post-promotion acceptor designation | none | NONE — full tree scan (383 blobs): the only `NP04` governance artifact is the canonical record; the only `*A3*` artifacts are P01-01/P01-02 (different subjects, non-transferable) | ✓ NO CONFLICT |
| H | Post-promotion verification remains established | ESTABLISHED | re-established from live objects: target tip = accepted object; tree identical | ✓ VALID |
| I | No mutation since promotion/verification | none | target, accepted branch, and `main` unchanged; target tip == accepted tip | ✓ NO MUTATION |
| J | Exact accepted/promoted object identical | same commit object | `6828155…` == `6828155…` (identical object, not equivalent tree) | ✓ IDENTICAL |
| — | Ref inventory | 31 heads / 4 tags / 6 pull refs | 31 / 4 / 6 | ✓ NO UNEXPECTED MOVEMENT |
| — | Promotion lineage | `0dab1221 → 8c99627 → d4fdb33 → 6828155` | all ancestors of the target tip | ✓ VERIFIED |

No stop condition was triggered. No discrepancy was encountered.

---

## 1. PURPOSE AND CHARACTER OF THIS ACT

This act records the **explicit post-promotion acceptance decision** for the already-promoted NP04
Phase-A integration state on `arena/01a0e6d9-iips-production-market-data`, made by the designated A3
acceptance authority (**RAMKI**) exercising the designation recorded at `61e8e59`.

This act is **separate from** authority (G29), qualification (G30), implementation acceptance (G31),
promotion target designation and promotion authority (NP04-PROMOTION-AUTH), promotion execution
(NP04-PROMOTION-EXEC), post-promotion verification
(NP04-POST-PROMOTION-VERIFICATION), and acceptance-authority designation
(`np04-post-promotion-acceptance-authority-designation-2026-10-01-001`). None of those gates is
reopened, re-performed, reinterpreted, or replaced here.

This act does **not**: modify any implementation, test, dependency, migration, or protected surface;
perform or repeat any qualification; promote anything; move any branch or ref; advance or modify
`main`; create or imply any certification; authorize production; adjudicate any unrelated
workstream.

---

## 2. ACCEPTANCE AUTHORITY — DESIGNATION DISTINGUISHED FROM DECISION

### 2.1 Designation reference (retrieved and verified in §0.E–F)

| Element | Exact value |
| --- | --- |
| Designation act | `np04-post-promotion-acceptance-authority-designation-2026-10-01-001` |
| Record path | `evidence/np04/NP04-POST-PROMOTION-ACCEPTANCE-AUTHORITY-DESIGNATION-ACT.md` |
| Containing ref | `refs/heads/arena/01a0f839-iips-production-market-data` |
| Designation commit | `61e8e593316a8b58cb3b4ffff5c3261798ac776c` |
| Designation parent | `2606185923f6cbd3f4df5c3af200f54d40ed4bbc` |
| Designation blob | `bce386e3d384df1f0e441c476ef8d545f56caa18` (17,972 bytes) |
| Named acceptor | **RAMKI** |
| Scope | `NP04-POST-PROMOTION-ACCEPTANCE` **only** — exact target branch, commit and tree |
| Retrievability | **VERIFIED** — independently fetched from the authoritative remote; retrieved body
hash equals the recorded blob exactly |

### 2.2 The designation is NOT acceptance

The designation act states, verbatim:

> *"Designation of the named A3 acceptance authority **does not constitute acceptance** of the
> promoted state. **Acceptance requires a separate subsequent acceptance act** by the designated
> authority."*

That separate act is **this artifact**. Acceptance was **NOT** performed before this act; the state
before this act was `POST-PROMOTION ACCEPTANCE = NOT PERFORMED / PENDING` (unchanged from the
designation gate).

### 2.3 The decision is the designated authority's

The acceptance decision recorded in §4 is the decision of the **designated A3 acceptance authority
(RAMKI)**, conveyed through the governing authority instruction for this gate. It is **not** an
Arena adjudication: the Recording Agent verified the antecedent state (§0), applied no acceptance
authority of its own, and recorded the decision with its evidence basis (`§5`). No acceptance was
fabricated, inferred, or pre-judged from the designation, from any prior gate, or from technical
success alone.

---

## 3. EXACT STATE SUBJECT TO ACCEPTANCE

The acceptance decision is bound **exactly and only** to the following state:

| Field | Value |
| --- | --- |
| **Target branch** | `arena/01a0e6d9-iips-production-market-data` |
| **Target SHA** | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| **Target tree** | `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5` |
| **Accepted implementation branch** | `arena/01a0f308-iips-production-market-data` |
| **Accepted implementation SHA** | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| **NP04 baseline** | `0dab1221fb0f89e2e0601ea905d642bfe72d5f9c` |
| **`main` at time of acceptance** | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (UNMOVED) |
| **Exact NP04 lineage** | `0dab1221 → 8c9962725666be76ad58f52fd493a52479d0b75e → d4fdb33d9810b0736a9a382d6ab35b7ce2a7480e → 6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| **Scope** | NP04 Phase-A — IPD durable user-portfolio persistence foundation, as promoted |

No other SHA, tree, branch tip, descendant, or later mutation is accepted by this act.

---

## 4. ACCEPTANCE DECISION

```text
NP04 POST-PROMOTION ACCEPTANCE = ACCEPTED
```

**Accepted state:** `arena/01a0e6d9-iips-production-market-data` @
`6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` (tree
`eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5`) — the exact object previously qualified (G30),
accepted (G31), designated for promotion (NP04-PROMOTION-AUTH), promoted by authorized
fast-forward (NP04-PROMOTION-EXEC) and independently verified
(NP04-POST-PROMOTION-VERIFICATION).

**Binding.** This acceptance is bound only to the exact state in §3. It does not extend to any
descendant commit, any other branch, any later mutation of the target, any other environment, any
excluded scope, or any future modification of the accepted state.

---

## 5. BASIS FOR THE DECISION (ESTABLISHED EVIDENCE — NOT REOPENED)

| Element | Established state | Reference |
| --- | --- | --- |
| **Authority** | FRESH AUTHORITY ESTABLISHED (adoption/revalidation of surviving Phase-A lineage) | G29 act `np04-g29-fresh-authority-phase-a-adoption-2026-10-01-001` @ `f4ceecb192f1d2e4ec7f67b6ac6615e71871eac8`, blob `111a380a714d3beece90bef3040e9d381039a7bf` |
| **Qualification** | PHASE-A CURRENTLY QUALIFIED at `6828155` / tree `eb07ea36…` — Phase-A 84/84 ×3; full suite 782/782 ×3; baseline 698/698; 4 pre-existing `tsc` errors (0 NP04-attributable); `build:vite` exit 0; protected prefixes 0 changed | G30 (recorded in the G29/G31 chain) |
| **Implementation acceptance** | `NP04 PHASE-A — INDEPENDENT ACCEPTANCE = ACCEPTED`, bound to `6828155` / tree `eb07ea36…` | G31 act `np04-g31-phase-a-acceptance-2026-10-01-001` @ `3a89c70e77a6172ee4f75aa9c5d2dc441f4543d0`, blob `614994da55525e94d1d7c6d0880c55f65236bd5c` |
| **Promotion target designation + promotion authority** | Target `arena/01a0e6d9-…` designated; fast-forward promotion of the exact accepted lineage authorized, executed only in a separate gate | Act `np04-promotion-auth-target-designation-2026-10-01-001` @ `2606185923f6cbd3f4df5c3af200f54d40ed4bbc`, blob `832003c6e31999d05df44951038b97862fae9961` |
| **Promotion execution** | AUTHORIZED FAST-FORWARD EXECUTED AND VERIFIED — `0dab122..6828155`; no force, no merge commit, no new object; target tree = accepted tree | NP04-PROMOTION-EXEC gate (report; remote state independently verified) |
| **Post-promotion verification** | POST-PROMOTION VERIFICATION = ESTABLISHED — 12-item verification; target tip = accepted object; tree/byte identity; protected surfaces 0 NP04 changes; dependency state exact; scope boundaries confirmed | NP04-POST-PROMOTION-VERIFICATION gate (report) |
| **Acceptance authority** | DESIGNATED — RAMKI, `NP04-POST-PROMOTION-ACCEPTANCE` only, state-scoped, one-time, non-standing | Designation act @ `61e8e593316a8b58cb3b4ffff5c3261798ac776c`, blob `bce386e3d384df1f0e441c476ef8d545f56caa18` |
| **State identity (re-verified for this act)** | target tip `6828155` == accepted branch tip `6828155` == G31-accepted object; tree `eb07ea36…`; lineage intact; `main` unmoved | §0 — live remote inspection |
| **Scope boundaries** | Exclusions as recorded across the NP04 act chain: no Watchlists/Reports/Collaboration/Settings/Governed Screener; no protected-foundation changes; no `main`; no certification; no production | G29 §13; G31 §6/§11; PROMOTION-AUTH §6/§9; canonical record §7/§9 |

No contradiction was discovered in any established element. Nothing above is reopened,
re-adjudicated, or reinterpreted by this act.

---

## 6. BOUNDARIES AND LIMITATIONS OF THIS ACCEPTANCE

### 6.1 This acceptance DOES NOT mean

- promotion of `main`;
- authorization to merge into `main`;
- certification (A2-class or otherwise);
- production authorization;
- production readiness;
- authorization of NSE / Dhan / live-market-data production access;
- acceptance of Watchlists;
- acceptance of Reports;
- acceptance of Collaboration;
- acceptance of Settings;
- acceptance of Governed Screener;
- acceptance of unrelated workstreams or GATE-P application-domain work;
- standing authority for future changes;
- acceptance of any later SHA or mutated tree.

### 6.2 This acceptance remains

**one-time · gate-scoped · state-scoped · SHA/tree-bound · non-transferable · non-inferable ·
separate from certification · separate from production authorization.**

No authority may be inferred for any other subject from this act, and no authority may be inferred
**into** this acceptance from any other designation or gate.

---

## 7. SEPARATION FROM CERTIFICATION

> ## acceptance ≠ certification

This act performs **acceptance only**. No certification is granted, implied, or pre-judged for
NP04 or any other capability. Certification would require a separate, explicit A2-class
certification-authority designation and a separate certification act, neither of which exists for
NP04. The P01 line's dispositions (e.g. "ACCEPTANCE-GOVERNED ONLY / NOT CERTIFICATION-BEARING")
are separate matters and are neither imported nor extended here.

---

## 8. SEPARATION FROM PRODUCTION AUTHORIZATION

> ## acceptance ≠ production authorization

```text
PRODUCTION AUTHORIZATION = NOT ESTABLISHED
PRODUCTION READINESS     = NOT ESTABLISHED
PRODUCTION ACTIVATION    = NOT AUTHORIZED
EXECUTION MODE           = NON_PRODUCTION (unchanged)
```

No production activation, deployment, or operational authorization of any kind is created by this
act. The promoted state remains a NON_PRODUCTION, non-certified integration state accepted only as
recorded in §3–§4.

---

## 9. `main` EXCLUSION (EXPLICIT)

```text
main = 4d3e1cdca3a33da0ec3be8b336b17128108a502c   (UNMOVED — not modified by this act)
```

This act:

- does **not** promote `main`;
- does **not** authorize merging into `main`;
- does **not** accept `main` in any respect;
- does **not** authorize `main → 0dab1221`;
- does **not** authorize `main → 6828155`;

Those remain **separate governance matters**, each requiring its own explicit authority gate.
Acceptance of the promoted integration state does **not** constitute, imply, or pre-judge any
`main` decision.

---

## 10. UNRELATED WORKSTREAM EXCLUSION (EXPLICIT)

This act adjudicates **only** the NP04 Phase-A promoted state. It does **not** accept, authorize,
or adjudicate: Watchlists; Reports; Collaboration; Settings; Governed Screener; tenant
administration/restoration/audit expansion; cross-system security-audit delivery; live Keycloak
verification; any GATE-P application-domain work; or any other workstream. All deferred/unresolved
items recorded in the canonical NP04 record (§7) remain deferred/unresolved, unchanged.

---

## 11. WHAT THIS ACT DOES NOT DO (NON-EXECUTION ATTESTATION)

In creating this act, the Recording Agent did **not**:

- modify any implementation, test, dependency, migration, or protected surface;
- perform or repeat any qualification, test execution, or requalification;
- promote, merge, cherry-pick, rebase, reset, copy, or force-push anything;
- move any ref other than adding this single governance artifact to the governance branch (§8 of
  the gate; §12 below);
- modify `main`, `arena/01a0e6d9-…`, or `arena/01a0f308-…`;
- create, imply, or pre-judge any certification, production authorization, or product-surface
  authority;
- create or alter any governance authority other than the single acceptance recorded here.

**Only this governance artifact was created by this act.**

---

## 12. DURABILITY OF THIS ACCEPTANCE RECORD

This record is committed to the governance branch
`refs/heads/arena/01a0f839-iips-production-market-data` and pushed to the authoritative IPD remote;
its remote commit SHA, parent SHA, blob SHA and tree SHA are reported in the NP04-POST-PROMOTION-
ACCEPTANCE-ACT gate report. A record that is only local is **not** durable; durability requires
remote ref, commit and tree verification, which must succeed before acceptance is claimed as
durable.

---

## 13. FINAL STATE MACHINE

```text
AUTHORITY                    = ESTABLISHED      (G29 @ f4ceecb)
QUALIFICATION                = ESTABLISHED      (G30, bound to 6828155 / eb07ea36)
IMPLEMENTATION ACCEPTANCE    = ESTABLISHED      (G31 @ 3a89c70)
PROMOTION TARGET             = ESTABLISHED      (arena/01a0e6d9-… @ 6828155)
PROMOTION AUTHORITY          = ESTABLISHED      (2606185)
PROMOTION                    = EXECUTED / VERIFIED
POST-PROMOTION VERIFICATION  = ESTABLISHED
ACCEPTANCE AUTHORITY         = DESIGNATED       (61e8e59)
POST-PROMOTION ACCEPTANCE    = ACCEPTED         ← CHANGED BY THIS ACT
                               (bound to arena/01a0e6d9-… @ 6828155 / tree eb07ea36… only)

MAIN PROMOTION               = NOT AUTHORIZED
PRODUCTION AUTHORIZATION     = NOT ESTABLISHED
```

---

## 14. ATTESTATION (VERIFIED BEFORE COMMIT)

| Check | Result |
| --- | --- |
| Implementation files changed by this act | **0** |
| Test files changed by this act | **0** |
| Dependency / lockfile changed by this act | **0** |
| Migration files changed by this act | **0** |
| Protected-surface files changed by this act | **0** |
| `main` modified | **NO** |
| `arena/01a0e6d9-…` modified | **NO** (still `6828155`) |
| `arena/01a0f308-…` modified | **NO** (still `6828155`) |
| New artefacts | exactly one — this file |
| Authorised scope expanded | **NO** |
| Certification created | **NO** |
| Production authorization created | **NO** |
| `main` promotion created or implied | **NO** |

**Acceptance attestation.** Recorded by Arena as **Recording Agent** only, from RAMKI's explicit
authority instruction for this gate and exercising the designation recorded at `61e8e59`. The
antecedent state was re-verified read-only immediately before recording (§0); the acceptance
disposition (§4) is the designated authority's decision, not an Arena adjudication; nothing beyond
this single acceptance artifact was created; no acceptance outcome was pre-judged or inferred from
any prior gate.

---

*End of record `np04-post-promotion-acceptance-2026-10-01-001`.*
