# D18 — PHASE 08 ENTRY AUTHORIZATION — AUTHORITY ACT

> ⚠ **Filename convention:** `PHASE_08_` prefix, per the P07 precedent (D13 §8 G-3). A
> `P08_`-prefixed filename is barred by the standing guard
> `p05/tests/existing-iips-boundary.test.js`:161. ⚠ **That guard was NOT modified.**

**This is the separate, explicit P08 entry authorization act required by D17 §10.**
It implements no P08 work, accepts no gate, certifies nothing and activates nothing.

| Field | Value |
|---|---|
| **Record** | **D18** |
| **Act** | P08 Entry / Implementation Authorization |
| **Baseline** | **`925926d5aa20b49e9838bcee6d8a476e69e13939`** — *"P07 certification: A2 WITHHOLD — C8 certified, C7 not established"* |
| **Predecessor** | **D17** `059ae4a50935dabf612b7114518613b4f59ddff0` — P08 Entry/Dependency Reconciliation |
| **Prior assessment** | `docs/d10/D10_P08_ENTRY_ASSESSMENT.md` @ Track A `07ad52f` — **historical, untouched** |
| **Authority** | Program Authority. ⚠ **No individual named or inferred** |
| **Date** | 2026-09-12 |

---

# 0. DECISION

> # ⛔ **P08 ENTRY AUTHORIZATION = BLOCKED**
>
> ## New hard blocker, arising **after** the D17 reconciliation:
> ## **BL-3 — P07 CERTIFICATION WITHHELD, AND P07 CERTIFICATION IS A RECORDED PRECONDITION OF PROGRESSION TO P08.**

| State | Value |
|---|---|
| **P08 ENTRY** | ⛔ **NOT AUTHORIZED** |
| **P08 IMPLEMENTATION** | ⛔ **NOT AUTHORIZED** |
| **P08 ACCEPTANCE** | **NOT_ACCEPTED** |
| **P08 A3 ACCEPTOR** | **NOT DESIGNATED** |
| **CERTIFICATION** | **NONE_GRANTED** |
| **PRODUCTION ACTIVATION** | **NOT_AUTHORIZED** |

⚠ **This is not a manufactured blocker and not a bounded/deferred item re-labelled.** It is a
**newly created authority fact**, recorded by the Program Authority's own A2 act one commit
after D17 was written.

---

## 1. Why the decision changed between D17 and D18

**D17 was correct at its baseline.** It assessed `2d28e42`, where the only certification-related
fact was that A2 had just been **designated** (Sai). D17 recorded — correctly and conservatively
— that **A2 designation is not certification** (its §4.1), and that P08's own C3/C4/C11 acts
remained deferred (**BD-2**).

**One commit later, `925926d` changed the state**: A2 exercised the designation and **withheld
P07 certification**. That is a different fact from *"certification has not yet happened."*

| | D17 baseline `2d28e42` | D18 baseline `925926d` |
|---|---|---|
| A2 | **Designated** (Sai) | Designated **and exercised** |
| P07 certification | Not yet performed | **WITHHELD — a decision of record** |
| C7 | Authority unknown | **NOT ESTABLISHED** — requires P12/P13 |
| C8 | Not assessed | **CERTIFIED** within P07 scope |

⚠ **D17 is not wrong and is not rewritten.** It is superseded on this single point by an event
that post-dates it.

---

## 2. BL-3 — the blocker, established from the artifacts

### 2.1 The rule

`docs/p00/P00_GATE_MODEL.md`:27 defines the column verbatim:

> **"Cert. before progression?" — whether a certification act is required before the next phase.**

The **P07** row (:44) carries: **`Cert. before progression? = YES (C7, C8)`**.

⚠ The column governs **progression to the next phase** — it is not an acceptance-only rule. P08
*is* the next phase after P07.

### 2.2 The fact

`docs/PHASE_07_CERTIFICATION_DECISION.md`, A2 act at `925926d`:

| Element | Recorded |
|---|---|
| Decision | **B — WITHHOLD CERTIFICATION** |
| **C8** | **CERTIFIED** within P07 scope |
| **C7** | **NOT ESTABLISHED** — outside P07's implementation boundary; requires **P12/P13** |
| Rationale | *"The P00_GATE_MODEL requires **BOTH C7 and C8** for P07 progression. Since C7 cannot be certified at P07 scope, overall P07 certification is withheld."* |
| Explicit effect | ⛔ *"Does **NOT** authorize **P07 progression to P08**"* |

`P00_DECISION_LOG.md` §38 restates it: **`P07 certification = NONE GRANTED (withheld — C7 not established)`**.

### 2.3 The conclusion

The A2 authority **expressly withheld the progression that this act would otherwise grant.**
Authorizing P08 entry here would **contradict an authority act made one commit earlier** and
bypass `P00_GATE_MODEL`:27 and acceptance rule 5 (*"Certification, where required, has actually
occurred"*).

⚠ **No waiver, exception or override mechanism exists** anywhere in the gate model — searched;
zero hits. There is therefore no recorded path by which this act could proceed over the withhold.

---

## 3. ⚠ BL-3 is a STRUCTURAL DEADLOCK — escalated, not solved here

The withhold is not a matter of missing work that P07 could go and do:

```
P07 progression ──requires──► C7 certified
C7 scope        ──is────────► UI13 / UI14  (D4_11_CERTIFICATION_MATRIX:45)
C7 needs        ──────────► P12 (deps P11) and P13 (deps P12)
P11/P12/P13     ──are downstream of──► P08
```

> ### **C7 requires P12/P13 · P12/P13 require P08 · P08 requires C7.**

⚠ **This is a circular dependency in the authoritative records.** It cannot be resolved by
evidence, implementation or diligence at P07 or P08 scope. It requires a **Program Authority
adjudication** — and per the standing rules I **do not invent** one, **do not** re-scope C7,
**do not** reinterpret the gate-model column, and **do not** waive rule 5.

**Candidate resolutions — recorded as options for authority, NOT selected and NOT recommended-as-decided:**

| # | Option | Nature |
|---|---|---|
| R-1 | Adjudicate that C7's *"Cert. before progression"* obligation attaches at the phase that **implements** UI13/UI14 (P12/P13), not at P07 | Interpretive act on `P00_GATE_MODEL`:27 / `D4_11`:45 |
| R-2 | Record an explicit **concession** for C7 under acceptance rule 4 (*"explicitly conceded in the concessions register"*) | Concession act |
| R-3 | Re-scope C7 in `D4_11_CERTIFICATION_MATRIX` | ⚠ Amends an accepted matrix — heavier act |
| R-4 | Accept the deadlock and halt progression at P07 | Status quo |

⚠ **R-1 and R-2 appear to be the only options that do not amend an accepted artifact — but
selecting among them is an authority decision, expressly not taken here.**

---

## 4. Verification performed before deciding

| # | Check | Result |
|---|---|---|
| V-1 | D17 reconciliation verified | ✅ `059ae4a`, unmodified at this baseline |
| V-2 | P08 dependency graph re-verified | ✅ **`depends_on = ["P06","P07"]`** — unchanged |
| V-3 | P06 acceptance intact | ✅ byte-identical |
| V-4 | P07 acceptance intact | ✅ byte-identical — ⚠ **acceptance is preserved; only certification is withheld** |
| V-5 | BL-1 / BL-2 still cleared | ✅ **YES — both remain cleared and are NOT reinstated** |
| V-6 | New hard blocker since D17 | ⛔ **YES — BL-3** |
| V-7 | Waiver/override mechanism exists | ❌ **NONE** |
| V-8 | OI-08 / OI-09 / OI-10 / ADR-01 C1–C6 | ✅ untouched, not reopened |

### 4.1 ⚠ Documentation debt observed — recorded, NOT corrected

`P00_GATE_MODEL.md` still states **"Current formal gate status: 7 of 18 accepted"** and
**"P07–P17 remain NOT ACCEPTED"**, while listing accepted records only through P06, and the P07
row's `Accepted?` cell reads **NO** — although `PHASE_07_OVERALL_ACCEPTANCE.md` records P07 as
accepted. The header count (7) appears to include P07 while the row and the sentence do not.

⚠ **Not corrected here.** Correcting an accepted gate ledger is outside this act's change
boundary, and this act does not modify P00–P07 records. Recorded for authority.

---

## 5. Authorized scope

> # **NONE. No P08 scope is authorized by this act.**

Because the decision is **BLOCKED**, no scope is defined, no work items are enumerated, and no
implementation boundary is opened. **P08 implementation may NOT begin.**

---

## 6. Explicit non-authorizations (all unchanged)

This act does **not**: constitute P08 acceptance · create a P08 gate-acceptance record · grant
certification · authorize production activation · authorize provider selection · authorize
credentials or secret provisioning · authorize licensed/deeper acquisition · modify
existing-IIPS methodology, source or certification behaviour · reopen **OI-08**, **OI-09** or
**OI-10** · alter **ADR-01 C1–C6** · alter any P00–P07 acceptance record · modify the historical
D10 assessment · promote any downstream gate · merge to `main`.

---

## 7. Bounded / deferred conditions — ALL PRESERVED

Carried forward from D17 §8 **unresolved, unwaived and not reinterpreted**:

| # | Condition | Status |
|---|---|---|
| **BD-1** | **AD-17 / M-2** replay firewall — P08 may not repair it | PRESERVED |
| **BD-2** | **C3 / C4 / C11** certification acts remain **separate**; ⚠ A2's scope is recorded as *"P07 certification"* — extension to P08 **not determined** | PRESERVED |
| **BD-3** | **DEP-P01-04** — P08 scope, **must not be defaulted** | PRESERVED |
| **BD-4** | **PIT-6** — P08 may not cite P05 acceptance as PIT evidence | PRESERVED |
| **BD-5** | **D04** corporate-actions limitation | PRESERVED |
| **BD-6** | Provider / licensed execution restrictions — ⚠ O-3 = NSE authorizes no execution | PRESERVED |
| **BD-7** | **OI-P04-03** — IB-1…IB-5 bound | PRESERVED |
| **BD-8** | **OI-P04-04** FIGI sourcing/licensing/coverage | PRESERVED |
| **BD-9** | **M-1 / AD-4** — blocks P15 | PRESERVED |
| **BD-10** | **Act 6** (open, no owner) · **O-8** | PRESERVED |
| **BD-11 / NB-1** | **P08 A3 acceptance authority** — separate designation required | PRESERVED |
| **BD-12** *(new)* | **P05 PIT repeatability MISSING / NOT DEMONSTRATED** (`P00_GATE_MODEL`:15) — recorded, not discharged; travels into P08 | PRESERVED |

**None resolved, waived or silently reinterpreted.**

---

## 8. A3 designation

> # **P08 A3 ACCEPTOR = NOT DESIGNATED**

No designation is made by this act. ⚠ **No A3 person is inferred from A2 (Sai), from the P07
A3 (Sai), from the P06 A3 (Ramki), or from any other role** — each prior designation is
explicitly scoped to its own gate.

Per the governing instruction: a missing A3 designation **would not by itself have prevented
P08 ENTRY AUTHORIZATION**, but it **does prevent future P08 GATE ACCEPTANCE** until the
authority is established. ⚠ Here entry is blocked by **BL-3**, independently of A3.

---

## 9. Resulting status

| Item | Status |
|---|---|
| **P08 ENTRY AUTHORIZATION** | ⛔ **BLOCKED — BL-3** |
| **P08 IMPLEMENTATION** | ⛔ **NOT AUTHORIZED** — may not begin |
| **P08 ACCEPTANCE** | **NOT_ACCEPTED** |
| **P08 A3 ACCEPTOR** | **NOT DESIGNATED** |
| **CERTIFICATION** | **NONE_GRANTED** — P07 withheld; **C8 certified within P07 scope**, **C7 NOT ESTABLISHED** |
| **PRODUCTION ACTIVATION** | **NOT_AUTHORIZED** (A4, P16 only) |
| P00–P06 | **ACCEPTED** — unchanged |
| P07 | **ACCEPTED** — ⚠ acceptance preserved; **certification withheld** |
| BL-1 / BL-2 | **CLEARED** — not reinstated |
| Gate count | **unchanged by this act** |

---

## 10. Next authority act

> **A Program Authority adjudication of the C7 progression deadlock (§3).**

Until that is recorded, P08 entry cannot be authorized without contradicting the A2 withhold.
Thereafter, in order: **(a)** re-run or amend the P08 entry authorization · **(b)** designate a
**P08 A3 acceptor** · **(c)** define P08 scope.

⚠ **None of these is performed, selected or implied here.**

---

**D18 — PHASE 08 ENTRY AUTHORIZATION. DECISION: ⛔ BLOCKED (BL-3).**
**No scope authorized · no implementation · no acceptance · no certification · no activation · no merge.**
