# NP04 — POST-PROMOTION ACCEPTANCE AUTHORITY DESIGNATION ACT

**Act identifier:** `np04-post-promotion-acceptance-authority-designation-2026-10-01-001`
**Act Type:** AUTHORITY-DESIGNATION-ACT / A3-ACCEPTANCE-AUTHORITY-ESTABLISHMENT
(**designation only — NOT an acceptance act, NOT an acceptance, NOT a certification, NOT an
implementation, NOT a qualification, NOT a promotion, NOT an integration, NOT a production
activation, NOT a tracker status mutation**)
**Authority:** RAMKI (Program Authority) — instruction "NP04-POST-PROMOTION-ACCEPTANCE-AUTHORITY-DESIGNATION — Program Authority Designation Act" (2026-10-01)
**Designating Authority:** RAMKI — Program Authority
**Designated A3 Acceptor:** RAMKI — Program Authority (NP04-POST-PROMOTION-ACCEPTANCE only)
**Recording Agent:** Arena (recording only — no acceptance, no qualification, no promotion, no implementation performed in this act)
**Scope:** Acceptance authority for the already-promoted NP04 Phase-A integration state ONLY
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Execution Mode:** NON_PRODUCTION
**Recorded At (local, Asia/Calcutta):** 2026-10-01
**Repository:** `ramkivs/iips-production-market-data` (IPD — authoritative)
**Recording branch (this record):** `arena/01a0f839-iips-production-market-data`

---

## 0. BASELINE / PROMOTED-STATE INTEGRITY VERIFICATION (performed before recording)

| Check | Expected | Observed | Result |
|---|---|---|---|
| PMD `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | ✓ MATCH — UNMOVED |
| Promoted target branch | `arena/01a0e6d9-iips-production-market-data` | tip `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` | ✓ MATCH |
| Promoted target tree | `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5` | `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5` | ✓ MATCH |
| Accepted implementation branch | `arena/01a0f308-iips-production-market-data` | tip `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` | ✓ MATCH — UNMOVED |
| NP04 baseline | `0dab1221fb0f89e2e0601ea905d642bfe72d5f9c` | present as ancestor of the target | ✓ MATCH |
| NP04 lineage | `0dab1221 → 8c99627 → d4fdb33 → 6828155` | all ancestors of the target tip; tip identical to accepted object | ✓ MATCH |
| Governance branch (pre-record) | `2606185923f6cbd3f4df5c3af200f54d40ed4bbc` | `2606185923f6cbd3f4df5c3af200f54d40ed4bbc` | ✓ MATCH |
| G29 authority record | retrievable | blob `111a380a714d…` (14,218 bytes) | ✓ VERIFIED |
| G31 acceptance record | retrievable | blob `614994da5552…` (16,904 bytes) | ✓ VERIFIED |
| PROMOTION-AUTH record | retrievable | blob `832003c6e319…` (11,249 bytes) | ✓ VERIFIED |
| G32 canonical NP04 record | retrievable at `6828155` | blob `45d016e8d044…` (18,473 bytes) | ✓ VERIFIED |
| Existing NP04 acceptance-authority designation | none | NONE — exhaustive tree scan: no `NP04` governance artifact other than the canonical record; files named `*A3*` are P01-01/P01-02 only; no NP04 acceptor named anywhere | ✓ NO PRIOR DESIGNATION |
| Competing / conflicting NP04 acceptor designation | none | NONE FOUND | ✓ NO CONFLICT |
| Ref inventory | 31 heads / 4 tags / 6 pull refs | 31 / 4 / 6 | ✓ NO UNEXPECTED MOVEMENT |

No discrepancy was encountered. No fail-closed condition was triggered.

---

## 1. DESIGNATING AUTHORITY AND AUTHORITY BASIS

**Designating Authority: RAMKI** — Program Authority / Designating Authority for this bounded
program governance decision.

**Authority basis (repository-verified; not inferred from repository ownership, commit authorship,
title, or implementation):**

1. `evidence/target-shell-integration/NEXT-PRODUCT-SURFACE-AUTHORITY-DESIGNATION-PACKET.md` —
   **"Authority Holder: RAMKI"** (resident on PMD `main` at `4d3e1cdc`).
2. `evidence/target-shell-integration/PHASE1C-INTELLIGENCE-PAYLOAD-AUTHORITY-DESIGNATION.md` and its
   `.json` companion — `"decisionAuthority": "RAMKI (Designating Authority)"` (PMD `main`).
3. `evidence/target-shell-integration/PHASE3-EXECUTIVE-SURFACE-AUTHORITY-DESIGNATION.md`,
   `PHASE4-RESEARCH-IDENTITY-DESIGNATION-AUTHORITY-ACT.md`,
   `PHASE-F3-UI08-SECURITY-MASTER-FUNCTIONAL-AUTHORITY-ACT.md`,
   `PHASE-F8-UI06-SCREENER-RESTORATION-AUTHORITY-ACT.md` — the same holder-reserved designation
   lineage on PMD `main`.
4. **NP04 series acts recorded under the same Program Authority:** G29
   (`np04-g29-fresh-authority-phase-a-adoption-2026-10-01-001`), G31
   (`np04-g31-phase-a-acceptance-2026-10-01-001`) and NP04-PROMOTION-AUTH
   (`np04-promotion-auth-target-designation-2026-10-01-001`) each record
   "Authority: RAMKI (Program Authority)". This act continues that lineage for the
   acceptance-authority step.

**Precedent for the Program Authority holding the A3 acceptance function** (form precedent,
durably quoted in-repo): the D10-3 phase-scoped designation precedent —
`P06_GATE_ACCEPTANCE.md` / `P00_DECISION_LOG.md` §8.1, quoted in
`evidence/target-shell-integration/P01-01-A3-ACCEPTANCE-AUTHORITY-DESIGNATION-ACT.md` §8 —
*A3 acceptance authority "designated explicitly, scoped to the P06 gate only, with the acceptor
named (Ramakrishnan V. S. (Ramki)), and with the record that designation was not acceptance."*
That precedent establishes the **form** followed here; no authority is imported from it.

**Designation input.** The acceptor identity recorded in §2 was supplied **explicitly by the
Program Authority** in the governing gate instruction for this act. It was **not** selected,
ranked, inferred, or manufactured by the Recording Agent.

---

## 2. DESIGNATED A3 ACCEPTOR

> ### ✅ **RAMKI DESIGNATED AS A3 ACCEPTANCE AUTHORITY FOR NP04-POST-PROMOTION-ACCEPTANCE**
>
> | Field | Value |
> |---|---|
> | **Named acceptor** | **RAMKI** |
> | **Role** | **A3 gate acceptor — NP04 post-promotion acceptance authority** |
> | **Designating authority** | **RAMKI — Program Authority** |
> | **Scope** | **NP04-POST-PROMOTION-ACCEPTANCE only** (see §3) |
> | **Subject** | the already-promoted NP04 Phase-A integration state (`6828155…` / tree `eb07ea36…`) |
> | **Authority class** | **A3 — gate acceptance authority** |
> | **Authority** | Program Authority explicit designation (this act, 2026-10-01) |
> | **Designation date** | 2026-10-01 |
> | **Effective from** | this act's commit |

### 2.1 Non-inference attestation

This designation rests **solely** on the express Program Authority designation recorded in §1 and
§2. It is **not** derived from, and is **not** evidence of, any of the following — each of which is
expressly disclaimed as a basis:

| Disclaimed basis | Status |
|---|---|
| The **G31 implementation acceptance** (`3a89c70`) | **NOT the basis** — implementation acceptance ≠ post-promotion acceptance |
| The **NP04 promotion authority** (`2606185`) | **NOT the basis** — promotion authority ≠ acceptance authority |
| The **successful fast-forward promotion** (EXEC gate) | **NOT the basis** — execution ≠ acceptance |
| The **POST-PROMOTION-VERIFICATION** result | **NOT the basis** — verification ≠ acceptance |
| The **tree/object identity** of the promoted state | **NOT the basis** |
| Any **program role**, standing capacity, or reserved function | **NOT the basis** |
| The **Recording Agent** role (Arena) | **NOT the basis** — the Recording Agent does not accept its own or any output |
| Repository ownership, commit authorship, or executor role | **NOT the basis** |
| The **P01-01 / P01-02** A3 designations (SAI) | **NOT the basis** — different subjects, independently designated, non-transferable |
| Any person's involvement in NP04 execution gates | **NOT the basis** |

---

## 3. EXACT SUBJECT AND SCOPE OF THE DESIGNATION

The designation applies **only** to the following, and to nothing else:

| Field | Value |
|---|---|
| **Gate** | `NP04-POST-PROMOTION-ACCEPTANCE` |
| **Capability** | NP04 — IPD durable user-portfolio persistence foundation (Phase A), **as promoted** |
| **Repository** | `iips-production-market-data` |
| **Target branch** | `arena/01a0e6d9-iips-production-market-data` |
| **Target commit** | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| **Target tree** | `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5` |
| **NP04 baseline** | `0dab1221fb0f89e2e0601ea905d642bfe72d5f9c` |
| **Accepted implementation branch** | `arena/01a0f308-iips-production-market-data` |
| **Accepted lineage** | `0dab1221 → 8c99627 → d4fdb33 → 6828155` |

### 3.1 What the designation is NOT to be read as covering

The designation must **not** be interpreted as covering, in whole or in part:

- any **other gate** (including NP04-POST-PROMOTION-ACCEPTANCE-ACT beyond the act itself, any
  future NP04 gate, GATE-P gates, or P01/P13/P14/P15/P16 certification gates);
- any **other branch or commit** — including any future descendant of `6828155`, any state on
  `arena/01a0f308-…`, any state on `arena/01a0f839-…`, or any state on `main`;
- **`main`** in any respect (see §8);
- the **baseline promotion** `main → 0dab1221` (a separate governance matter);
- any **product surface** (Watchlists, Reports, Collaboration, Settings, Governed Screener);
- any **certification**, production readiness, or production activation;
- any artifact merely because it shares an `NP04` label.

---

## 4. AUTHORITY BOUNDARY

> ## ACCEPTANCE AUTHORITY ONLY

The designated acceptor's authority under this designation is **limited to the acceptance
determination for the exact promoted state specified in §3**.

The designated acceptor may:

- adjudicate the promoted integration state `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`
  (tree `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5`) on
  `arena/01a0e6d9-iips-production-market-data` against the established qualifying and accepting
  evidence (G30, G31, PROMOTION-AUTH, PROMOTION-EXEC, POST-PROMOTION-VERIFICATION); and
- issue a **separate, explicit NP04 post-promotion acceptance act** recording
  ACCEPTED, REJECTED, or QUALIFIED for that exact state.

The designated acceptor may **not**, under this designation:

- perform, imply, or pre-judge the acceptance in this act (designation is not acceptance);
- authorize implementation changes, requalification, or reimplementation;
- authorize promotion of anything, or movement of the target branch;
- authorize integration into PMD `main` or advancement of `main`;
- certify (certification requires a separate A2-class certification-authority designation);
- authorize production activation, production readiness, or any Dhan / NSE / live-market-data
  access;
- accept, certify, or authorize **any** capability, branch, or state outside the exact scope in §3.

---

## 5. DESIGNATION ≠ ACCEPTANCE (EXPLICIT)

> ### Designation of the named A3 acceptance authority **does not constitute acceptance** of the
> ### promoted state. **Acceptance requires a separate subsequent acceptance act** by the
> ### designated authority.

**No acceptance decision is recorded in this act.** The promoted state is **not** accepted,
approved, or endorsed by this act, and no wording in it may be read as doing so.

```text
NP04-POST-PROMOTION ACCEPTANCE AUTHORITY = DESIGNATED          ← CHANGED BY THIS ACT
NP04-POST-PROMOTION ACCEPTANCE          = NOT PERFORMED / PENDING (unchanged — separate gate)
```

The next governed action is a separate act: an explicit acceptance decision by **RAMKI**, exercising
this designation, against the exact state in §3 — performed only in a subsequent, separate gate.

---

## 6. NON-TRANSFER / NON-INFERENCE RULE

This designation **does not automatically transfer to, and confers no authority over**:

- any other gate, phase, or work item;
- any other branch, commit, tree, or future descendant state;
- `main` or the baseline promotion;
- any product surface, certification, or production activity;
- any capability outside the exact scope in §3.

No authority may be inferred for any other subject from this act, and no authority may be inferred
**into** NP04 post-promotion acceptance from any other designation. Each prior designation is
independent; each future designation must be separately and explicitly made.

---

## 7. SEPARATION OF ACTS

> ## designation ≠ acceptance
> ## acceptance ≠ certification
> ## certification ≠ production activation

Additionally, within the NP04 series, the following remain distinct and separately gated:

```text
implementation acceptance (G31)         ≠ promotion authority (PROMOTION-AUTH)
promotion authority                     ≠ promotion execution (PROMOTION-EXEC)
promotion execution                     ≠ post-promotion verification
post-promotion verification             ≠ post-promotion acceptance (this designation's subject)
```

**Designation is not acceptance.** A separate subsequent acceptance act is required; this act does
not pre-judge, predict, or imply any acceptance outcome.

---

## 8. `main` SEPARATION (EXPLICIT)

```text
main = 4d3e1cdca3a33da0ec3be8b336b17128108a502c   (UNMOVED)
```

This designation:

- does **not** authorize promotion to `main`;
- does **not** accept `main` in any respect;
- does **not** authorize `main → 0dab1221`;
- does **not** authorize `main → 6828155`;
- does **not** establish P01 certification;
- does **not** establish production readiness;
- does **not** establish production authorization.

Any future `main` integration remains a **separate authority gate**.

---

## 9. EXPLICIT NON-AUTHORIZATIONS

This act does **not** authorize: implementation changes; requalification; reimplementation;
transplantation of `8c99627` / `d4fdb33` / `6828155`; promotion of anything; movement of any branch;
modification of `main`, `arena/01a0e6d9-…`, `arena/01a0f308-…`, or any implementation, test,
dependency, migration, or protected surface; P01 certification or any certification; production
activation or production readiness; Watchlists; Reports; Collaboration; Settings; Governed
Screener; artifact `2f5613e` recreation; validation of G25/G26; GATE-P application-domain work; any
credential, remote, or permission change.

---

## 10. VALIDITY AND BOUNDS

| Aspect | Statement |
|---|---|
| **Scope class** | **Gate-scoped AND state-scoped** — `NP04-POST-PROMOTION-ACCEPTANCE`, at the exact target branch, commit and tree in §3 |
| **One-time / reusable** | **One-time designation**; exercised by a single separate acceptance act and not a standing or reusable capacity |
| **Standing assignment** | **None granted** — no standing assignment for any other item, gate, phase, or state |
| **Transferable** | **No** (see §6) |
| **Expiry** | None stated by the governing authority; bounded by scope, not by time |
| **Revocation** | Reserved to Program Authority; not addressed by this act |
| **Predecessor authority** | Does not supersede, modify, or reinterpret any prior designation |

---

## 11. GATE STATE AFTER THIS ACT

```text
AUTHORITY                   = ESTABLISHED   (G29 @ f4ceecb)
QUALIFICATION               = ESTABLISHED   (G30, bound to 6828155 / eb07ea36)
ACCEPTANCE (implementation) = ESTABLISHED   (G31 @ 3a89c70)
TARGET                      = ESTABLISHED   (arena/01a0e6d9-… @ 6828155)
PROMOTION AUTH              = ESTABLISHED   (2606185)
MECHANISM                   = FAST-FORWARD
PROMOTION                   = EXECUTED / VERIFIED

POST-PROMOTION VERIFICATION = ESTABLISHED
ACCEPTANCE AUTHORITY        = DESIGNATED    ← CHANGED BY THIS ACT
POST-PROMOTION ACCEPTANCE   = NOT PERFORMED / PENDING (separate subsequent act required)
MAIN PROMOTION              = NOT AUTHORIZED
PRODUCTION AUTHORIZATION    = NOT ESTABLISHED
```

---

## 12. DURABILITY OF THIS DESIGNATION RECORD

This record is committed to the governance branch
`refs/heads/arena/01a0f839-iips-production-market-data` and pushed to the authoritative IPD remote;
its remote commit SHA, blob SHA and tree SHA are reported in the NP04-POST-PROMOTION-ACCEPTANCE-
AUTHORITY-DESIGNATION gate report. A record that is only local is **not** durable; durability
requires remote ref, commit and tree verification.

---

## 13. NON-EXECUTION ATTESTATION

This act is **governance-only**. In creating it, the Recording Agent did **not**:

- accept, adjudicate, or pre-judge the promoted state in any way;
- perform or re-perform any qualification, test execution, or verification;
- modify any implementation, test, dependency, migration, or protected surface;
- promote anything; move any branch; modify `main` or any other ref;
- merge, cherry-pick, rebase, reset, or copy any content between branches;
- create, imply, or pre-judge any certification, production authorization, or product-surface
  authority;
- create or alter any governance authority other than the single designation recorded here.

**Only this governance artifact was created.**

---

## 14. ATTESTATION (verified before commit)

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
| Acceptance decision recorded | **NO** — designation only |

**Designation attestation:** Recorded from RAMKI's explicit Program Authority designation
instruction (acceptor: **RAMKI** — Program Authority, NP04-POST-PROMOTION-ACCEPTANCE only); baseline
and promoted-state facts verified independently before recording; no acceptance authority
manufactured for any other subject; no acceptance, certification, implementation, promotion,
integration, or production authority granted by this act.

---

*End of record `np04-post-promotion-acceptance-authority-designation-2026-10-01-001`.*
