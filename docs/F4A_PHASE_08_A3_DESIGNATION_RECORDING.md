# F-4 (RECORDING) — P08 A3 GATE-ACCEPTOR DESIGNATION — **SAI**

> **ACT TYPE:** **Program Authority decision recording — A3 designation only.**
> **NO ACCEPTANCE IS PERFORMED IN THIS ACT.**
> ⛔ **P08 IS NOT ACCEPTED. NOTHING IS CERTIFIED. PRODUCTION IS NOT ACTIVATED.**
> ⛔ **Designation is NOT acceptance.** Designation, acceptance, certification and production
>    activation remain **four separate states**.
> **Append-only. Edits no prior record. Decision log §39 appended.**
> **Identifier: `F4A_PHASE_08_A3_DESIGNATION_RECORDING` — no `Dnn` token claimed.**

---

## 0. Boundary

| | |
|---|---|
| **Baseline** | **`46537f754004724ea61cdad767effad4f91248a0`** — *"F-4: P08 A3 gate-acceptor designation — F4-B NO VALID A3 DESIGNABLE"* |
| **Branch / ref** | `arena/01a0853d-iips-production-market-data` — the P08 implementation lineage (D24 → P08-01 → P08-02 → P08-03 → F-4) |
| **Working tree at act start** | **CLEAN** — verified |
| **P08-01 / P08-02 / P08-03** | ⛔ **UNMODIFIED** — no source, no tests, no methodology |
| **P01–P07 artifacts** | ⛔ **UNMODIFIED** |
| **Certification records / A2** | ⛔ **UNMODIFIED** |
| **existing-IIPS** | ⛔ **UNMODIFIED** |
| **F-6 guard** | ⛔ **UNMODIFIED** |
| **Acceptance / certification granted** | **NONE** |

---

## 1. Relationship to the prior F-4 record — **SUPERSEDED BY ADDITION, NOT REWRITTEN**

`docs/F4_PHASE_08_A3_ACCEPTOR_DESIGNATION.md` (created at `46537f7`) selected **F4-B** — *"no
valid A3 can be designated from the currently authorized authority"* — because, **at that moment,
no Program Authority act naming an individual existed**, and the record expressly refused to
invent or infer one.

⚠ **That record is PRESERVED BYTE-FOR-BYTE and is NOT edited, reinterpreted or withdrawn.** It
remains the true and accurate record of its own moment. Its §15 stated the exact condition that
would discharge F-4:

> *"The Program Authority must issue an explicit P08 A3 designation **NAMING THE INDIVIDUAL**."*

**That condition has now been met.** The Program Authority has issued the act. This record
therefore **supersedes the F4-B finding as to current state only** — by **addition**, following
the program's standing correction-by-addition discipline (`P00_DECISION_LOG.md` rule 1:
*"Record only. No decision below is re-litigated, reinterpreted or altered."*).

| | Before (`46537f7`) | After (this record) |
|---|---|---|
| **P08 A3** | `NOT_DESIGNATED` | ✅ **`DESIGNATED` — Sai** |
| Everything else | — | **unchanged** |

---

## 2. Program Authority decision

> ### ✅ **A3 P08 GATE ACCEPTOR IS DESIGNATED**
>
> # **A3 = SAI**
>
> ### **Scope = the P08 gate ONLY.**

| Property | Value |
|---|---|
| **Designating authority** | **Program Authority** — owner of the gate model and the designation power (`P00_AUTHORITY_REGISTER.md`:64; exercised previously at §7, D10-3, §27/O-5) |
| **Act type** | **F-4** — the P08 A3 designation required by `D19` §12, `D20` §14, `D21` §11, `D22`:217, `D23`:238, `D24`:232 |
| **Designated person** | **Sai** |
| **Role designated** | **A3 — Phase-Gate Acceptance Authority** |
| **Scope** | **The P08 gate only** |
| **Designation date** | 2026-09-12 |
| **Nature** | Designation of the person authorized to **perform** a future P08 gate-acceptance decision. ⚠ **It is NOT that acceptance.** |

⚠ **The name was supplied by the Program Authority act, not derived.** It is **not** inferred
from Sai's A2 certification role, **not** from O-5 (P07), **not** from implementation authorship,
**not** from F-6 authorization and **not** from maintainer status. Each of those paths was
examined and rejected in the F4-B record §6; the designation rests solely on the express
Program Authority act.

---

## 3. Exact recorded terms

Recorded exactly as required:

```
A3                                = Sai
Scope                             = P08 gate only
Designation                      ≠ acceptance
Designation of A1, A2, A4         = NONE
Extension of D10-3 / P07 / O-5    = NONE
```

### 3.1 Designation ≠ acceptance

- **P08 acceptance = NOT ESTABLISHED** — requires a **separate** acceptance act by Sai.
- **P08-01 / P08-02 / P08-03 acceptance = NOT ESTABLISHED.**
- **P08 certification = NONE GRANTED.**
- **Production activation = NOT AUTHORIZED.**

Per `P00_GATE_MODEL.md` rule 6: *"A3 clearance permits the acceptance **process**; it does not
pre-accept any gate."*

### 3.2 No other role is designated

⚠ This act designates **A3 for P08 only**. It does **NOT** designate **A1**, **A2** or **A4** —
for P08 or for any other phase.

### 3.3 No prior authority is extended

⚠ This is a **separate, new designation**, consistent with the corpus rule that A3 is never
inherited:

| Prior designation | Scope | Effect of this act |
|---|---|---|
| **§7** `A3-P05-GATE-ACCEPTOR-DESIGNATION` — Ramki | P05 only | **NOT extended** |
| **D10-3** — Ramki | P06 only | **NOT extended** |
| **§27 / O-5** (`a55e29f`) — Sai | P07 only | **NOT extended** |
| **A2 certification authority** (`2d28e42`) — Sai, scoped to P07 | P07 only | ⚠ **NOT extended, NOT reused, and NOT the basis of this designation.** A2 ≠ A3 |

⚠ This designation does **not** constitute a **standing per-phase assignment** for **P09–P17**.
Each remaining gate still requires its own explicit designation act.

---

## 4. Explicit non-decisions

This act does **NOT**: accept P08 or any P08 work item · create a P08 gate-acceptance artifact ·
certify anything · alter **C7** or **C8** · alter the certification matrix or any A2 record ·
designate A1/A2/A4 · authorize production activation · authorize **P09–P17** · reopen **F-1**,
**F-6**, **D20**, **D21**, **D22**, **D23** or **D24** · resolve **AG-1** or **AG-2** · invent
adjustment methodology · expand `actionType` · modify P08 source, tests or methodology · modify
P07-03 · modify existing-IIPS · rewrite any historical or accepted artifact · reconcile, merge,
rebase, delete or force-push any branch.

---

## 5. State after this act

```
P08 A3 ACCEPTOR          = DESIGNATED — Sai (P08 gate only)
P08 ACCEPTANCE           = NOT_ACCEPTED
P08 CERTIFICATION        = NONE_GRANTED
C7                       = NOT_CERTIFIED
CERTIFICATION            = NONE_GRANTED
PRODUCTION               = NOT_AUTHORIZED
P09–P17                  = NOT_AUTHORIZED
AG-1                     = OPEN
AG-2                     = OPEN / NON-BLOCKING
```

**Unchanged by this act:** P08 entry AUTHORIZED · P08 implementation AUTHORIZED · P08-01 COMPLETE
· P08-02 IMPLEMENTED · P08-03 COMPLETE · formal gate count · **BD-1…BD-13** (⚠ **BD-11/NB-1** —
*"no P08 A3"* — is **now discharged**; all other BD items preserved) · OI-08/OI-09/OI-10 ·
ADR-01 C1–C6 · ADR-02 · AD-17/M-2 · M-1/AD-4 · M-5 · M-6 · Act 6 · OI-P04-03/04.

---

## 6. Required next act

With A3 designated, **P08 ACCEPTANCE** becomes **possible** as a **separate, explicitly
authorized act performed by Sai**.

⚠ **It has not occurred and is not authorized by this record.** A future P08 acceptance act must
independently establish the P00 minimum evidence for P08 (`P00_GATE_MODEL.md`:45 — **ADR-02
byte-identical golden replay** and **vintage ambiguity detection**) and address the open items,
including **AG-1**, **AG-2** and the P05 **PIT repeatability** obligation that travelled to P08
undischarged.

Also outstanding and unaffected: **F-2** (optional D20 §9 amendment by addition) · **F-5** (ledger
reconciliation) · the **branch-ref discrepancy** recorded at F4-B §3, which remains
**unreconciled by deliberate choice** and needs its own decision.

---

**Designation performed. Acceptance NOT performed. No dependency weakened, reordered or bypassed.**
