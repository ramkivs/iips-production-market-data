# Institutional Investment Platform System (IIPS)
# P01-01 — A3 ACCEPTANCE AUTHORITY DESIGNATION ACT

**Act ID:** `p01-01-a3-acceptance-authority-designation-act-2026-09-28-001`
**Act Type:** AUTHORITY-DESIGNATION-ACT / A3-ACCEPTANCE-AUTHORITY-ESTABLISHMENT
(**authority only — NOT an acceptance act, NOT a certification, NOT an implementation, NOT an
integration, NOT a production activation, NOT a tracker status mutation, NOT a commercial/data-provider
authorization, NOT a credential authorization**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01 / P00 phase-gate model (Work Tracker Production Schedule)
**Governing Gate:** `P01-01-SCOPED-A3-ACCEPTANCE-AUTHORITY-DESIGNATION`
**Antecedent Determination:** `FINAL-P01-01-ACCEPTANCE-AUTHORITY-EVIDENCE-CLOSURE` →
**NO APPLICABLE AUTHORITY FOUND / AUTHORITY GAP — NOT A CONFLICT**
**Designated By:** RAMKI (Program Authority / Designating Authority)
**Designated A3 Acceptor:** **SAI**
**Recording Agent:** Arena (recording only — no acceptance, certification, implementation, or integration performed in this act)
**Recorded At (local, Asia/Calcutta):** 2026-09-28
**Repository / Branch (authoritative at act time):** `ramkivs/iips-production-market-data` / `arena/01a0e6d9-iips-production-market-data`
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED

---

## 0. BASELINE INTEGRITY VERIFICATION (performed before recording)

| Check | Expected | Observed | Result |
|---|---|---|---|
| PMD HEAD | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | ✓ MATCH |
| `origin/main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | ✓ LOCAL == REMOTE |
| `src/identity` (D05) | `9080e997ee7da977d0066431737e329e88b3c0b7` | `9080e997ee7da977d0066431737e329e88b3c0b7` | ✓ FROZEN |
| `src/d114` | `0062ad520dce647f3d02ed9a27739598d457faaa` | `0062ad520dce647f3d02ed9a27739598d457faaa` | ✓ FROZEN |
| `frontend/src/features/portfolio` | `8491efdc44ae449eedf1aaf93fbc7415c428fcb9` | `8491efdc44ae449eedf1aaf93fbc7415c428fcb9` | ✓ FROZEN (BI-08 authoritative) |
| `src/ui` | `1597ed0663ee6a450dac7e9c6959748a1a85b05e` | `1597ed0663ee6a450dac7e9c6959748a1a85b05e` | ✓ FROZEN |
| Candidate commit | `e716bf1f4bb1c32199f57f43de54f0b67daa6b72` | present in `iips-production-market-data` | ✓ VERIFIED |
| Candidate artifact at commit | `src/contracts/canonical_id_specification.ts` | present, 9,834 bytes | ✓ VERIFIED |
| Candidate branch | `arena/01a0e30c-iips-production-market-data` | tip `e716bf1f4bb1c32199f57f43de54f0b67daa6b72` | ✓ VERIFIED |
| Existing P01-01 governance artifacts on `main` | none | none | ✓ NO IDENTIFIER COLLISION |
| `canonical_id_specification` on `main` | absent | 0 occurrences | ✓ NO IMPLEMENTATION LEAKED |

No discrepancy was encountered. No fail-closed condition was triggered.

---

## 1. DESIGNATOR AND AUTHORITY BASIS

**Designator: RAMKI** — Program Authority / Designating Authority for this bounded program governance decision.

**Authority basis (repository-verified; not inferred from repository ownership, commit authorship,
title, or implementation):**

1. `evidence/target-shell-integration/NEXT-PRODUCT-SURFACE-AUTHORITY-DESIGNATION-PACKET.md` line 8
   (**resident on PMD `main` at `4d3e1cdc`**) — **"Authority Holder: RAMKI"**.
2. `evidence/target-shell-integration/PHASE1C-INTELLIGENCE-PAYLOAD-AUTHORITY-DESIGNATION.md` and its
   `.json` companion — `"decisionAuthority": "RAMKI (Designating Authority)"` (PMD `main`).
3. `evidence/target-shell-integration/PHASE3-EXECUTIVE-SURFACE-AUTHORITY-DESIGNATION.md`,
   `PHASE4-RESEARCH-IDENTITY-DESIGNATION-AUTHORITY-ACT.md`,
   `PHASE-F3-UI08-SECURITY-MASTER-FUNCTIONAL-AUTHORITY-ACT.md`,
   `PHASE-F8-UI06-SCREENER-RESTORATION-AUTHORITY-ACT.md` — the same holder-reserved
   designation lineage on PMD `main`.
4. Corroborating cross-lineage program-authority records (`arena/01a0ae80` lineage, cited for
   authority-form only; no authority is imported from them into P01-01):
   `D13_PHASE_07_ENTRY_AUTHORIZATION.md` ("**Authority** | **Ramki / current program authority act**"),
   `D115_STAGE3_GOVERNANCE_DELEGATION_RECORD.md` ("**Program Authority** | **Ramki**"),
   and `D26` / `D27` / `D29` / `D32` / `D40` ("**Program Authority** (Sai / Ramki)").

**Designation input.** The acceptor designation in §2 was supplied **explicitly by Program Authority**
in the governing gate instruction for this act. It was **not** selected, ranked, inferred, or
manufactured by the Recording Agent.

---

## 2. DESIGNATED A3 ACCEPTOR

> ### ✅ **SAI DESIGNATED AS A3 ACCEPTANCE AUTHORITY FOR P01-01**
>
> | Field | Value |
> |---|---|
> | **Named acceptor** | **SAI** |
> | **Role** | **A3 gate acceptor — P01-01 acceptance authority** |
> | **Scope** | **P01-01 only** (see §3) |
> | **Authority** | Program Authority explicit designation (this act, 2026-09-28) |
> | **Designation date** | 2026-09-28 |

### 2.1 Non-inference attestation

This designation rests **solely** on the express Program Authority designation recorded in §1 and §2.
It is **not** derived from, and is **not** evidence of, any of the following — each of which is
expressly disclaimed as a basis:

| Disclaimed basis | Status |
|---|---|
| Sai's **A2 certification authority** for P07 (`2d28e42`) | **NOT the basis** — A2 ≠ A3; two distinct roles from two independent acts |
| Sai's **A3 acceptor** roles for P07 / P08 / P09 | **NOT the basis** — each is phase-scoped and independently designated |
| Any **program role**, standing capacity, or reserved function | **NOT the basis** |
| Ramki's **P05 / P06 / P10** A3 acceptances | **NOT the basis** — different phases, different acceptors |
| Raji's **P11** A3 acceptance | **NOT the basis** |
| `P00-02`'s holder-reserved acceptance function | **NOT the basis** — P00-02-scoped, and expressly non-transferable to P01 items |
| Any person's **involvement in P01-01** | **NOT the basis** |
| Repository ownership, commit authorship, or executor role | **NOT the basis** |

---

## 3. EXACT SUBJECT AND SCOPE OF THE DESIGNATION

The designation applies **only** to the following, and to nothing else:

| Field | Value |
|---|---|
| **Capability** | **P01-01 — Canonical Identifier Specification v1.0.0** |
| **Executable artifact** | `src/contracts/canonical_id_specification.ts` |
| **Repository** | `iips-production-market-data` |
| **Candidate lineage** | `arena/01a0e30c-iips-production-market-data` |
| **Candidate commit** | `e716bf1f4bb1c32199f57f43de54f0b67daa6b72` |

### 3.1 What the designation is NOT to be read as covering

The designation must **not** be interpreted as covering, in whole or in part:

- **B1 / IRR P01-01 — Canonical Envelope & Validation Engine** (`src/contracts/envelope.ts`) — a different, already-integrated capability that merely shares the `P01-01` label;
- **D115 canonical identity allocator** (`d115/tools/canonical-identity-allocator/`) — a different capability;
- **`docs/p01/` documentation package** — a documentation-level artifact, already accepted as documentation, with a narrower scope than the executable module;
- **P01-WAVE1 P01-02** — not covered;
- **D7-TIER3** engine certification programme — not covered;
- **B1 engine certification** — not covered;
- **any other capability** merely because it contains `P01` or `canonical` in its name.

The five-way `P01-01` / `canonical` label collision is preserved: the subject of this act is **only**
the executable Canonical Identifier Specification v1.0.0 at the exact commit in §3.

---

## 4. AUTHORITY BOUNDARY

> ## ACCEPTANCE AUTHORITY ONLY

SAI's authority under this designation is **limited to the acceptance determination for the exact
P01-01 executable capability specified in §3**.

SAI may:
- evaluate `src/contracts/canonical_id_specification.ts` v1.0.0 at `e716bf1f…` against its acceptance
  criteria, and
- issue a **separate, explicit P01-01 acceptance act** recording ACCEPTED, REJECTED, or QUALIFIED for
  that exact capability.

SAI may **not**, under this designation:
- certify P01-01 (certification requires a separate A2-class certification-authority designation);
- authorize implementation, adaptation, or integration into PMD `main`;
- authorize production activation;
- authorize any commercial, data-provider, Dhan, NSE, or live-market-data access;
- authorize any credential;
- accept, certify, or authorize **any** capability outside the exact scope in §3.

---

## 5. WHAT THIS DESIGNATION IS NOT

This act **does NOT constitute**:

| # | Not constituted | State |
|---|---|---|
| 1 | **P01-01 acceptance** | **NOT PERFORMED — NOT ESTABLISHED** |
| 2 | **P01-01 certification** | **NONE GRANTED** |
| 3 | **Implementation authority** | **NOT AUTHORIZED** |
| 4 | **Integration authority** (into PMD `main`) | **NOT AUTHORIZED** |
| 5 | **Production activation** | **NOT AUTHORIZED** |
| 6 | **Dhan / NSE / live-market-data authorization** | **NOT AUTHORIZED** |
| 7 | **Credential authorization** | **NOT AUTHORIZED** |
| 8 | **Any tracker status mutation** | **NOT PERFORMED** |

The only successful result of the governing gate is **P01-01 ACCEPTANCE AUTHORITY DESIGNATED**. This act
records **designation only**.

---

## 6. NON-TRANSFER / NON-INFERENCE RULE

This designation **does not automatically transfer to, and confers no authority over**:

- **P01-02**;
- **other P01 capabilities**;
- **other phases** (P00, P02–P06, P07–P17 — each retains its own, independently designated authority);
- **documentation packages** (including `docs/p01/`);
- **B1 engines**;
- **the D115 identity allocator**;
- **certification**;
- **production activation**;
- **any capability, phase, or artifact** outside the exact scope in §3.

No authority may be inferred for any other subject from this act, and no authority may be inferred
**into** P01-01 from any other designation. Each prior designation is independent, and each future
designation must be separately and explicitly made.

---

## 7. SEPARATION OF ACTS

> ## designation ≠ acceptance
> ## acceptance ≠ certification
> ## certification ≠ production activation

This act performs **designation only**. The four states remain distinct and separately gated:

```
P01-01 A3 ACCEPTANCE AUTHORITY      = DESIGNATED   ← THIS ACT
P01-01 ACCEPTANCE                   = NOT PERFORMED (separate gate, by SAI, exercising this designation)
P01-01 CERTIFICATION                = NONE GRANTED (requires a separate certification-authority designation)
P01-01 INTEGRATION INTO PMD main    = NOT AUTHORIZED (only after the appropriate acceptance/certification gates)
P01-01 PRODUCTION ACTIVATION        = NOT AUTHORIZED
```

**Designation is not acceptance.** SAI may now perform an acceptance act, but has not yet done so, and
this act does not pre-judge, predict, or imply any acceptance outcome.

---

## 8. EVIDENCE BASIS

This act rests on:

1. **The completed authority-gap determination** —
   `FINAL-P01-01-ACCEPTANCE-AUTHORITY-EVIDENCE-CLOSURE`, which searched the complete four-repository
   IIPS universe (`iips-production-market-data`, `iips-review-recovered`, `IIPS`, `Cockpit`) and
   returned **NO APPLICABLE AUTHORITY FOUND / AUTHORITY GAP — NOT A CONFLICT**. The exhaustive
   enumeration of every A3 designation artifact in that universe found designations for P05, P06, P07,
   P08, P09, P10, P11, P12 (not designated), P13, P13B, P14, P15, and P16 — and **none for P01 or
   P01-01**.
2. **The D10-3 phase-scoped designation precedent** — `P06_GATE_ACCEPTANCE.md` / `P00_DECISION_LOG.md`
   §8.1, in which A3 acceptance authority was designated **explicitly**, **scoped to the P06 gate
   only**, with the acceptor named (Ramakrishnan V. S. (Ramki)), and with the record that
   **designation was not acceptance**. That precedent establishes the *form* followed here. No
   unrelated authority is copied from it.
3. **The P00 governing rule** — `P00_AUTHORITY_REGISTER.md`: *"Authority to proceed ≠ gate acceptance ≠
   certification ≠ production activation."* A3 program-level clearance carries **"NO AUTOMATIC GATE
   ACCEPTANCE"** and records that *"No individual names are recorded. None may be inferred."*
4. **The subject's own execution-authority record** —
   `P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md` §8 and §18: *"P01-01 ACCEPTANCE AUTHORITY =
   UNRESOLVED / NOT YET DESIGNATED"* … *"P00-02's acceptance authority does NOT automatically transfer
   to P01 items"* … *"acceptance requires a separate designated acceptance authority and act."* This act
   is that separate designation.

---

## 9. VALIDITY AND BOUNDS

| Aspect | Statement |
|---|---|
| **Scope class** | **Phase-scoped AND artifact-scoped** — P01-01, at the exact executable artifact and commit in §3 |
| **One-time / reusable** | **One-time designation.** It is exercised by a separate acceptance act and is not a standing or reusable capacity |
| **Standing assignment** | **None granted.** This designation creates no standing assignment for any other item, phase, or capability |
| **Transferable** | **No.** See §6 |
| **Expiry** | None stated by the governing authority; bounded by scope, not by time |
| **Revocation** | Reserved to Program Authority; not addressed by this act |
| **Predecessor authority** | Does not supersede, modify, or reinterpret any prior designation |

---

## 10. GATE STATE AFTER THIS ACT

```
P01-01 EXECUTION            = COMPLETE (e716bf1f — execution authority per P01-WAVE1)
P01-01 A3 ACCEPTOR          = SAI (P01-01 only)                          ← CHANGED BY THIS ACT
P01-01 ACCEPTANCE AUTHORITY = DESIGNATED (this act)                      ← CHANGED BY THIS ACT
P01-01 ACCEPTANCE           = NOT PERFORMED                              (unchanged — next gate)
P01-01 CERTIFICATION        = NONE GRANTED                               (unchanged)
P01-01 INTEGRATION          = NOT AUTHORIZED                             (unchanged)
P01-02 ACCEPTANCE AUTHORITY = UNRESOLVED / NOT YET DESIGNATED             (unchanged)
PRODUCTION ACTIVATION       = NOT AUTHORIZED                             (unchanged)
```

---

## 11. NON-EXECUTION ATTESTATION

This act is **governance-only**. In creating it, the Recording Agent did **not**:

- merge, cherry-pick, rebase, reset, or copy the candidate implementation into PMD `main`;
- add `canonical_id_specification.ts`, its fixtures, or its tests to `main`;
- alter D05 Security Master, `src/identity`, `src/d114`, `frontend/src/features/portfolio`, or `src/ui`;
- alter existing envelope/validation contracts;
- modify identifiers already used by PMD;
- change persistence, UI, or provider integrations;
- modify package, configuration, or build files;
- perform, imply, or pre-judge P01-01 acceptance or certification;
- activate production or any Dhan/NSE/live-data access;
- introduce credentials;
- create or alter any governance authority other than the single designation recorded here.

**Only this governance artifact was created.**

---

**Designation attestation:** Recorded from RAMKI's explicit Program Authority designation instruction
(acceptor: **SAI**); baseline facts verified independently before recording; no acceptance authority
manufactured for any other subject; no acceptance, certification, implementation, integration, or
production authority granted by this act.
