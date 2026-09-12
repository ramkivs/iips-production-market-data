# F-4 — P08 A3 GATE-ACCEPTOR DESIGNATION — DECISION RECORD

**Governance / authority act. Append-only. No implementation performed.**

| Field | Content |
|---|---|
| **Act** | **F-4** — designation of the **A3 phase-gate acceptance authority for the P08 gate** |
| **Required by** | `D19` §12 F-4 · `D20` §14 F-4 · `D21` §11 F-4 · `D22`:217 · `D23`:238 · `D24`:232 |
| **Nature** | **Designation act only.** Not acceptance, not certification, not activation |
| **Decision** | # **F4-B — NO VALID A3 CAN BE DESIGNATED FROM THE CURRENTLY AUTHORIZED AUTHORITY. P08 ACCEPTANCE REMAINS BLOCKED.** |
| **Date** | 2026-09-12 |

---

## 1. Baseline SHA

**`8ee2da3f357fd1400c52c550f2671e84417ea55a`** — *"P08-03: adjusted/unadjusted series +
portfolio reconciliation behavior"*. Worktree clean at the time of this act.

Lineage verified: `8ee2da3` (P08-03) ← `085bf7ac` (**D24**) ← `397ae54` (P08-02) ←
`9e14124` (D23) ← `55cb472` (P08-01) ← `ed3734fe` (D22/F-6) ← `dead5518` (D21/F-3) ←
`7f74650` (D20/F-1) ← … ← `eae2ff69` (`main`).

## 2. Branch / ref used

**`arena/01a0853d-iips-production-market-data`** — the ref carrying the authoritative P08
implementation lineage (D24 → P08-01 → P08-02 → P08-03 → `8ee2da3`), verified by
`git merge-base --is-ancestor`.

## 3. Branch discrepancy and disposition

⚠ **Four remote refs observed** at the start of this act:

| Ref | SHA | Disposition |
|---|---|---|
| `arena/01a0853d-iips-production-market-data` | `8ee2da3` | ✅ **Implementation lineage — used for this act** |
| `arena/01a0814b-iips-production-market-data` | `07ad52f` | ⚠ *"D10: P08 entry/dependency assessment"* — **NOT** in the implementation lineage; divergent. **Untouched** |
| `arena/01a0853c-iips-production-market-data` | `794c07c` | *"B2: P01 additive amendment"* — **is** an ancestor of the implementation lineage; already contained. **Untouched** |
| `main` | `eae2ff69` | **Untouched** |

**Disposition: NOT RECONCILED — deliberately.** `07ad52f` is a real commit that exists only on
`…01a0814b-…`; force-pushing the implementation lineage over it would destroy it. No force-push,
no delete, no merge, no rebase was performed. ⚠ **Reconciliation of the refs is NOT part of F-4
and requires a separate authority decision.**

⚠ **No repository program-state authority artifact identifies a canonical *session branch*.**
`PROGRAM_STATE.md` records commit pins and artifacts, not session refs, so there is no corpus
statement contradicting the use of the implementation-lineage ref. The discrepancy is reported
here rather than resolved.

⚠ **A sandbox re-clone occurred immediately before this act** (HEAD reverted to `eae2ff69`, the
P08 work surviving only as untracked files). Every untracked file was verified **byte-identical
(md5) to the pushed tip `8ee2da3`** before restoration; no content was recreated or re-performed.

## 4. Authoritative definition of A3

| Source | Location | Content |
|---|---|---|
| Authority register | `P00_AUTHORITY_REGISTER.md`:64 | **"A3 Gate acceptance — PROGRAM-AUTHORITY CLEARANCE ESTABLISHED … Cleared for the gate process. NO AUTOMATIC GATE ACCEPTANCE. 0 of 18 accepted; each requires an explicit act"** |
| Authority register | `P00_AUTHORITY_REGISTER.md`:16 | **"A3 clearance makes acceptance *possible*; each gate needs an explicit acceptance act"** |
| Gate model rule 6 | `P00_GATE_MODEL.md`:67 | **"A3 clearance permits the acceptance *process*; it does not pre-accept any gate"** |
| Gate model rule 5 | `P00_GATE_MODEL.md`:65 | **"Certification, where required, has actually occurred — authority clearance is not certification"** |

**A3 for P08 therefore means:** the **named individual explicitly designated as the phase-gate
acceptance authority for the P08 gate**, who alone may *perform* a future P08 acceptance act. It
is a **person-level** role, established **per gate** by an **explicit designation act**.

⚠ **A3 is never inherited.** Both precedents say so in terms:

- **D10-3** (`P00_DECISION_LOG.md`:191) — A3 for **P06** = **Ramakrishnan V. S. (Ramki)**;
  *"Scoped to the P06 gate only … does not constitute a standing per-phase assignment for
  P07–P17."*
- **§7 `A3-P05-GATE-ACCEPTOR-DESIGNATION`** (`P00_DECISION_LOG.md`:131-136) — A3 for **P05** =
  Ramki; *"does not constitute a standing per-phase assignment for P06–P17."*
- **O-5** (`a55e29f`, `PHASE_07_OVERALL_ACCEPTANCE.md`:82) — A3 for **P07** = **Sai**, P07 only.

⚠ **No standing per-phase A3 assignment exists anywhere in the corpus** (verified: every
occurrence of *"standing per-phase assignment"* is a **negation**).

## 5. Does an existing valid P08 A3 designation exist?

**NO.** Searched the whole corpus. Every P08-relevant statement is an explicit **negative**:

| Source | Statement |
|---|---|
| `D17_PHASE_08_ENTRY_RECONCILIATION.md`:183 (**NB-1**) | *"**no A3 gate acceptor is designated for P08.** O-5 designated Sai for **P07 only**; D10-3 designated Ramki for **P06 only**. A P08 acceptance act will be impossible until a P08 designation occurs."* |
| `D17`:95 | O-5 *"**SCOPED** — designation covers P07; **no A3 designated for P08**"* |
| `D17`:230 (C-20) | *"A3 P08 acceptor designated — **NOT DONE**"* |
| `D18_PHASE_08_ENTRY_AUTHORIZATION.md`:34, :207, :226 | **"P08 A3 ACCEPTOR = NOT DESIGNATED"** |
| `D19`:130 | *"⚠ **No P08 A3 exists anyway**"* |
| `D19`:253 | *"P08 A3 — **NOT DESIGNATED** — not inferred"* |
| `D20`:306 · `D21`:240 · `D22`:217 | F-4 *"still outstanding; blocks future P08 **acceptance**, not entry"* |
| `D21`:214 (**BD-11/NB-1**) | *"no P08 A3"* — preserved boundary |

**Conclusion: the P08 A3 role is VACANT.** Nothing to verify; no designation to record.

## 6. Authority basis examined

The **Program Authority of record** owns the gate model and the designation power, and has
exercised it before (D10-3, §7, O-5). ⚠ **The power exists. The missing element is the
identity.**

⚠ **The F-4 instruction that triggered this act names no person.** It expressly forbids
inventing a person, inferring a person from a role, silently reusing A2, or designating A2
merely because A2 exists.

**Every available path to a name was examined and rejected:**

| Candidate path | Why REJECTED |
|---|---|
| Ramki (A3 for P05, P06) | D10-3 and §7 are **scoped to P06 / P05 only** and expressly disclaim P07–P17. Carrying them into P08 is precisely the inheritance the corpus forbids (`PHASE_07_THRESHOLD_DECISION_INPUT.md`:35) |
| Sai (A3 for P07 via O-5) | O-5 is **P07 only**. Extending it is inference from a role |
| Sai as **A2** certification authority (`2d28e42`) | ⚠ **A2 ≠ A3.** Certification authority is a different role; gate-model rule 5 separates them expressly. Forbidden by the instruction |
| Implementation authorship (P08-01/02/03) | Authorship is not an authority role; an implementer accepting their own work defeats A3 |
| F-6 / D22 implementation authorization | Authorizes **implementation**, expressly *"not acceptance"* |
| Repository maintainer status | Not an authority basis in the corpus |
| §3 convention *"approved by Sai/Ramki"* | A **general progression** convention, not a P08 gate-acceptor designation. D10-3 still required an explicit act despite it |

⚠ Selecting any of these would be **inventing or inferring an acceptance authority** — the exact
failure mode the instruction, `D19`:253 (*"not inferred"*) and O-4 prohibit.

## 7. Selected decision

# **F4-B**

**No valid A3 can be designated from the currently authorized authority. P08 acceptance remains
blocked.**

⚠ **F4-C was considered and REJECTED.** The A3 **role** is *not* ambiguous — it is defined at
`P00_AUTHORITY_REGISTER.md`:64/:16 and `P00_GATE_MODEL.md`:67, with three concrete precedents
(§7, D10-3, O-5) establishing exactly how a designation is made and scoped. The obstacle is
**not** definitional. Reporting ambiguity would misdescribe a **single missing input** as a
conceptual defect and would wrongly imply further analysis is required.

⚠ **F4-A was considered and REJECTED** — selecting it would require naming a person this act was
not given.

## 8. Designated acceptor

**NONE. A3 = NOT_DESIGNATED.** ⚠ No person is named, proposed, recommended, shortlisted or
implied by this record.

## 9. Exact scope of this designation

**EMPTY — no designation is made.** This record is a **finding of vacancy** plus the precise
identification of what would discharge F-4. It confers no authority on anyone.

## 10. Explicit non-decisions

This act does **NOT**: accept P08 · create a P08 gate-acceptance artifact · certify anything ·
alter C7 · designate A1, A2, A3 or A4 · extend D10-3, §7 or O-5 · authorize production ·
authorize P09–P17 · reopen F-1, F-6, D20, D21, D22, D23 or D24 · resolve AG-1 or AG-2 · invent
adjustment methodology · expand `actionType` · modify P08 source or tests · modify P07-03 ·
reconcile, merge or delete any branch · modify any accepted artifact.

⚠ **No `PROGRAM_STATE.md` ledger update is made.** A ledger update was authorized *"recording the
designation"* — **no designation occurred**, so program state is **unchanged** and a row asserting
otherwise would be false. Correction-by-addition remains available if the Program Authority later
designates.

## 11. P08 acceptance state

**P08 = NOT_ACCEPTED.** Unchanged. Formal gate count unchanged.
P08 ENTRY = AUTHORIZED · IMPLEMENTATION = AUTHORIZED · P08-01 COMPLETE · P08-02 IMPLEMENTED ·
P08-03 COMPLETE. ⚠ **Acceptance is blocked on this designation, not on implementation.**

## 12. Certification state

**CERTIFICATION = NONE_GRANTED.** Unchanged. A2 (Sai, `2d28e42`, scoped to P07) **byte-identical
and untouched**. ⚠ **A3 designation would not imply certification** (gate-model rule 5).

## 13. C7 state

**C7 = NOT_CERTIFIED.** Unchanged, untouched. ⚠ Per `D19`:130, A3 is **not relevant** to C7:
acceptance ≠ certification.

## 14. AG-1 / AG-2 state

| Gap | State | Note |
|---|---|---|
| **AG-1** | **OPEN** | `actionType` bounded to `dividend\|split\|bonus`; **not widened** |
| **AG-2** | **OPEN / NON-BLOCKING** | No adjustment methodology exists or is invented; P08-03 consumes declared factors only |

Both **unchanged** by this act.

## 15. Required next act

⚠ **The next act is NOT P08 acceptance** — it is impossible while A3 is vacant.

> ## **The Program Authority must issue an explicit P08 A3 designation NAMING THE INDIVIDUAL.**

That instruction must supply, following the D10-3 template (`P00_DECISION_LOG.md`:191):

1. the **named individual**;
2. **scope = the P08 gate only** (no standing assignment for P09–P17);
3. an express statement that **designation ≠ acceptance**;
4. an express statement that it does **not** designate A1, A2 or A4, and does **not** extend
   D10-3, §7 or O-5.

Once designated, **P08 ACCEPTANCE** becomes possible as a **separate** act.

Also outstanding and unaffected: **F-2** (optional D20 §9 amendment by addition) · **F-5** (ledger
reconciliation) · the **branch-ref reconciliation** noted in §3.

---

## Final state

```
A3                       = NOT_DESIGNATED
P08 ACCEPTANCE           = NOT_ACCEPTED
C7                       = NOT_CERTIFIED
CERTIFICATION            = NONE_GRANTED
PRODUCTION               = NOT_AUTHORIZED
P09–P17                  = NOT_AUTHORIZED
AG-1                     = OPEN
AG-2                     = OPEN / NON-BLOCKING
```

**STOP AFTER F-4.** No P08 acceptance performed.
