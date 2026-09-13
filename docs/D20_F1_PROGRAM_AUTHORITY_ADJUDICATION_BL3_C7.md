# D20 — F-1 — PROGRAM AUTHORITY ADJUDICATION — BL-3 / C7 P07→P08 PROGRESSION DEADLOCK

**Explicit Program Authority decision act. Append-only.**
No implementation · no P08 authorization · no acceptance · no certification · no activation ·
no source change · no amendment of any accepted artifact.

| Field | Value |
|---|---|
| **Record** | **D20** |
| **Act** | **F-1** — Program Authority adjudication of **BL-3** (required by `D19` §9) |
| **Baseline** | **`5e0993aedfe79be8c2195c29f93946c1b79e68c4`** (D19), verified at execution |
| **Predecessors** | **D17** `059ae4a` · **D18** `3c084bb` · **D19** `5e0993a` |
| **Binding input** | `docs/PHASE_07_CERTIFICATION_DECISION.md` @ `925926d` — A2 (Sai), **WITHHOLD** |
| **Authority** | **Program Authority of record**, exercised expressly for this act |
| **Option class** | **R-1 — Interpretive Authority Decision** |
| **Date** | 2026-09-12 |

---

# 0. DECISION

> # ✅ **R1-A — SELECTED**
>
> **The Program Authority expressly SUPERSEDES the PROGRESSION EFFECT of the A2 C7 withhold,
> FOR P08 PROGRESSION ONLY, while leaving the certification status itself wholly intact.**

```
BL-3                        = RESOLVED FOR P08 PROGRESSION
A2 C7 CERTIFICATION         = NOT GRANTED BY THIS ACT
A2 WITHHOLD                 = SUPERSEDED ONLY AS TO P08 PROGRESSION
P08 ENTRY                   = ELIGIBLE FOR SEPARATE AUTHORIZATION ACT
P08 AUTHORIZATION           = NOT_AUTHORIZED
P08 ACCEPTANCE              = NOT_ACCEPTED
CERTIFICATION               = NONE_GRANTED
PRODUCTION ACTIVATION       = NOT_AUTHORIZED
```

⚠ **Eligibility is not authorization.** P08 remains **NOT_AUTHORIZED** and **may not be
implemented**. This act removes one blocker; it grants nothing.

---

# 1. BL-3 statement

> **P08 entry requires P07 progression → P07 progression requires C7 → C7's evidence (UI13/UI14)
> exists only at P12 → P12 ⟵ P11 ⟵ P09 ⟵ P08.** A closed loop of length 5.

---

# 2. Authority evidence (re-verified at this baseline, not assumed)

| # | Fact | Source — verified |
|---|---|---|
| E-1 | *"Cert. before progression?" — **whether a certification act is required before the next phase*** | `P00_GATE_MODEL.md`:27 |
| E-2 | **P07** row: `… P05, P06 \| Not yet \| **YES** (C7, C8) \| **NO**` | :44 ✅ verbatim |
| E-3 | **P12** row: `… P11 \| Not yet \| **YES** (C6, C7) \| **NO**` | :49 ✅ verbatim |
| E-4 | Rule 5: *"Certification, where required, has actually occurred — authority clearance is not certification"* | :65 |
| E-5 | A2 **WITHHOLD**; ⛔ *"Does NOT authorize P07 progression to P08"* | `PHASE_07_CERTIFICATION_DECISION.md`:9, :68, :96 |
| E-6 | **C8 = CERTIFIED** within P07 scope, 7/7 sub-requirements | ibid.:52–64 |
| E-7 | **C7 = NOT ESTABLISHED**; *"NOT within P07's implementation scope"*; *"requires P12/P13"* | ibid.:38, :42 |
| E-8 | *"✅ Preserves P07 overall acceptance (ESTABLISHED)"* | ibid.:99 |
| E-9 | C7 trigger = **UI13/UI14**; owner *"Certification authority — **UNKNOWN**"*; ⚠ **the matrix binds C7 to no phase** | `D4_11_CERTIFICATION_MATRIX.md`:45 |
| E-10 | Dependency chain P12←P11←P09←P08 | `P00_GATE_MODEL.md`:46–:49 |

## 2.1 ⚠ The discriminator — newly established by this act

Every certification cell in the gate model was enumerated:

| Phase | Cert. before progression |
|---|---|
| P00–P06 | No |
| **P07** | **YES (C7, C8)** |
| P08 | YES (C3, C4, C11) |
| P09 / P10 | YES |
| P11 | YES (C1, C2) |
| **P12** | **YES (C6, C7)** |
| P13 / P14 | No |
| P15 | YES — *is* the certification |
| P16 / P17 | YES |

> ### ⚠ **C7 is the ONLY certification identifier in the entire gate model that appears on two phase rows.**
> C1, C2, C3, C4, C6, C8, C11 each appear exactly once. **C7 appears twice — at :44 and :49.**

This is a **structural anomaly unique to C7**, established by enumeration of the accepted
artifact itself rather than by inference.

---

# 3. C7 — the P07 occurrence

`P00_GATE_MODEL.md`:44 lists C7 among P07's progression certifications. On its face it is a
prerequisite. **But the accepted corpus supplies no P07-side content for it:**

- P07's own purpose cell is *"Data quality gate … quality classification; completeness; no coercion proof"* — **no object-resolution or search element**.
- A2's evaluation: object-resolution in P07 → **NOT FOUND**; UI13/UI14 in P07 → **NOT FOUND** (`:31–:33`).
- C7's sole recorded trigger is **UI13/UI14** (`D4_11`:45) — surfaces P07 does not implement.

⚠ **There is no artifact anywhere in the corpus describing a P07-scoped C7 obligation.**

# 4. C7 — the P12 occurrence

`P00_GATE_MODEL.md`:49 — **P12 = API/DTO gate**, *"Expose governed data through stable
APIs/contracts"*, evidence *"Additive DTO proof; derived (not literal) provenance; AD-9 screener
contract certified before UI05"*, certifications **C6, C7**.

⚠ **P12 is the phase that implements the object-resolution/search contract C7 certifies.** The
P12 occurrence has matching scope, matching evidence and a matching implementation boundary.
The P07 occurrence has none of these.

---

# 5. Exact circular dependency

```
P08          ──requires──►  P07 progression
P07 progression ──requires──►  C7 certified          (P00_GATE_MODEL:44)
C7           ──evidence is──►  UI13 / UI14            (D4_11:45)
UI13/UI14    ──implemented at──►  P12  (and P13)
P12          ──depends on──►  P11  ──►  P09  ──►  **P08**
```

⚠ **Closed.** Confirmed: A2's own remedy — *"Certify C7 once P12 implements the contract"*
(`PHASE_07_CERTIFICATION_DECISION.md`:119) — **is unreachable while P08 is blocked**, because P12
is downstream of P08. The withhold, read as a progression bar, forecloses its own cure.

---

# 6. D13 precedent analysis

**D13 (P07 entry authorization) recorded, as carried-forward open item 5:**

> *"A2 / C7 / C8 certification authorities unknown … `P00_GATE_MODEL.md:44` requires **cert before
> progression = YES (C7, C8)**"* — and **authorized P07 entry anyway** (`D13`:24 *"P07 = AUTHORIZED"*).

| Question | Finding |
|---|---|
| Does D13 **directly apply**? | ⚠ **NO — it is DISTINGUISHABLE.** D13 acted when C7/C8 were merely *unperformed with unknown authority*. Today A2 exists, has **exercised** the authority, and has **expressly** addressed P08 progression. An unexercised requirement and an exercised refusal are different authority facts |
| Does it provide **context**? | ✅ **YES, materially.** D13 establishes an accepted program precedent that the :44 *"cert before progression"* cell **does not bar phase ENTRY**, and that entry is separable from certification. It was applied to the very same cell, on the very same row |
| Is it used to override A2? | ⛔ **NO.** ⚠ **The precedent is expressly NOT relied on to override the A2 act.** It is cited only to show that the interpretation adopted below is **consistent with prior accepted practice**, not novel |

⚠ **D13 is treated as context and consistency evidence only. The override in §11 rests on the
Program Authority's own act, not on D13.**

---

# 7. R-1 analysis — the four required questions

**Q1 — Genuine prerequisite, or duplication creating unintended circularity?**

> **Finding: the two occurrences represent ONE certification obligation, recorded twice; and
> treating both as sequential prerequisites produces an unintended circular dependency.**

Basis, cumulatively: (a) C7 is the **only** doubly-listed ID in the model (§2.1); (b) the matrix
binds C7 to **UI13/UI14**, not to P07 (E-9); (c) the matrix assigns C7 **no phase**; (d) **A2
itself found C7 outside P07's scope** (E-7) — the certifying authority's own reading; (e) the
P12 occurrence has matching scope and evidence, the P07 occurrence has none; (f) reading both as
sequential prerequisites yields a **self-foreclosing loop** (§5), which cannot have been the
drafters' intent.

⚠ **On the D19 taxonomy this is B (same obligation represented twice), reached on the evidence
above — not A, and not left at C.** ⚠ **The accepted artifacts do not state this in terms**; the
anomaly is resolved here by **express Program Authority interpretation**, which is precisely the
instrument D19 §4.1 identified for it — **not by assumption, and not silently.**

**Q2 — Does the corpus permit an interpretation preserving C7 as a requirement without requiring
its certification before the downstream work that produces its evidence?**

> **YES.** C7 remains a full certification requirement — at **P12** (:49), where its evidence
> arises and where the model already records it. Nothing is deleted, weakened or waived. Only the
> **duplicate P07-side progression effect** is disapplied, and only for P08.

**Q3 — Does this require amending an accepted artifact?**

> **NO — not to resolve BL-3.** No text is changed. :44 and :49 stand verbatim; `D4_11`:45 stands
> verbatim. ⚠ **A durable amendment remains RECOMMENDED but is NOT REQUIRED** — recorded as
> optional follow-up **F-2** (§15), so that future readers are not left to re-derive this
> interpretation.

**Q4 — Why is the interpretation authorized under the existing gate model?**

| # | Ground |
|---|---|
| 1 | Interpreting an ambiguity in an accepted artifact is inherent to the **Program Authority**, which owns the gate model and certification matrix (`D19` §2) |
| 2 | It **does not breach rule 5**: rule 5 requires certification *"where required"* — this act determines **where** C7 is required (P12), and does **not** claim C7 has occurred |
| 3 | It invents **no** waiver, concession, exception, override or escalation — D19 found none exist, and none is created |
| 4 | It leaves C7's **certification status untouched** — still **NOT ESTABLISHED** |
| 5 | It is **consistent with accepted practice** under D13 for this same cell (§6) |
| 6 | The alternative (R-4) is a **permanent halt** that also forecloses A2's own prescribed cure (§10) |

⚠ **R-1 is selected on this reasoning, NOT because it enables progress.** Had C7 been uniquely
listed against P07, or had the matrix bound C7 to P07, the outcome would have been **R1-C**.

---

# 8. R-2 availability — re-verified

| Check | Result |
|---|---|
| Concessions register exists? | ⛔ **NO** — `find docs -iname "*CONCESSION*"` → **0 files** |
| Rule 4 usable for certification? | ⛔ **NO** — rule 4 is an **acceptance** mechanism; C7 is governed by rule **5**, which admits no concession |
| Waiver / exception / override / sequencing override / escalation in the gate model? | ⛔ **NONE** |

> **R-2 = NOT AVAILABLE.** ⚠ **Nothing is invented.** This act does **not** rely on R-2 in any part.

---

# 9. R-3 implications

**Not selected — not required to resolve BL-3 (Q3).** ⚠ **No amendment is performed or staged.**

If the Program Authority later wants the interpretation made durable in the artifacts, the exact
targets are:

| Artifact | Provision | Nature |
|---|---|---|
| `docs/p00/P00_GATE_MODEL.md` | **:44** — P07 `Cert. before progression = YES (C7, C8)` | Note that C7's obligation attaches at **P12** (:49); P07 progression turns on **C8** |
| `docs/d4/D4_11_CERTIFICATION_MATRIX.md` | **:45** — C7 row | Record the owning phase (**P12**), currently unstated |

⚠ **By addition only — never a silent rewrite.** Recorded as **future act F-2**.

# 10. R-4 implications

**Not selected.** ⚠ R-4 is **not** a conservative pause: the loop is closed, so under R-4 the C7
evidence can never be produced and **A2's own "Next gate" cure (:114–:120) is unreachable**. R-4
is a **permanent program halt at P07** — a consequence disproportionate to a
drafting anomaly, and one the certifying authority did not state it intended.

⚠ R-4 was not rejected for convenience; it was rejected because it forecloses the cure the
withhold itself prescribes.

---

# 11. ⚠ EXPLICIT TREATMENT OF A2/SAI'S WITHHOLD — NO SILENT OVERRIDE

> ## The Program Authority **DOES supersede** the **PROGRESSION EFFECT** of the A2 C7 withhold — **for P08 progression ONLY.**

Stated element by element, against the A2 record:

| A2 statement | Treatment |
|---|---|
| Decision **B — WITHHOLD P07 CERTIFICATION** (:9, :68) | ✅ **INTACT — NOT superseded, NOT amended, NOT reinterpreted** |
| **C7 = NOT ESTABLISHED** (:42, :89) | ✅ **INTACT.** ⚠ **C7 is NOT certified by this act** |
| **C8 = CERTIFIED** within P07 scope (:64) | ✅ **INTACT** |
| **P07 certification (overall) = NONE GRANTED** (:109) | ✅ **INTACT** |
| ⛔ *"Does NOT certify P07 overall"* (:95) | ✅ **INTACT** |
| ⛔ ***"Does NOT authorize P07 progression to P08"*** (:96) | ⚠ **SUPERSEDED — THIS CLAUSE ONLY, AND ONLY AS TO P08 PROGRESSION** |
| ⛔ *"Does NOT authorize production activation"* (:97) | ✅ **INTACT** |
| ⛔ *"Does NOT modify P01 or accepted P07 work items"* (:98) | ✅ **INTACT** |
| ✅ *"Preserves P07 overall acceptance"* (:99) | ✅ **INTACT** |

**Why this single clause may be superseded.** A2's authority is to determine **whether C1–C12 are
certified on the evidence** (`P00_AUTHORITY_REGISTER.md`:63). A2 exercised that fully and
correctly, and that determination stands untouched. The clause at :96 goes further: it draws a
**progression consequence** from the gate model's :44 cell. ⚠ **Interpreting the gate model is the
Program Authority's function, not A2's** — and A2 drew the consequence from the very entry this
act finds to be a duplicate (§7 Q1). Superseding it therefore **corrects the premise, not the
certification judgement**.

⚠ **The A2 record is NOT edited.** It remains byte-identical. This supersession is recorded
**here, by addition**, and is **limited to P08 progression**. ⚠ It creates **no** precedent for
P09–P17 and does **not** supersede the withhold as to any other phase, any other clause, or any
other purpose.

---

# 12. Final Program Authority decision

> # **R1-A.** BL-3 = **RESOLVED FOR P08 PROGRESSION.**

# 13. Exact scope

| In scope | Out of scope |
|---|---|
| ✅ Disapplies the **duplicate C7 progression bar** at `P00_GATE_MODEL`:44, **for P08 progression only** | ⛔ Any other phase's progression |
| ✅ Determines C7's obligation attaches at **P12** (:49) | ⛔ Amending :44, :49 or `D4_11`:45 |
| ✅ Supersedes **`PHASE_07_CERTIFICATION_DECISION.md`:96 only** | ⛔ Every other clause of that record |
| ✅ Makes P08 entry **ELIGIBLE for a separate authorization act** | ⛔ Granting that authorization |

⚠ **P07 progression for any purpose other than P08 entry is NOT adjudicated here.**

---

# 14. Explicit non-decisions

This act does **NOT**: authorize P08 entry or implementation · accept P08 · certify P08 ·
certify C7 · re-certify C8 · grant any certification (**NONE_GRANTED**) · authorize production
activation · authorize P09, P11, P12 or P13 · promote any downstream gate · designate any A2/A3/A4
authority · **designate a P08 A3 acceptor (still NOT DESIGNATED)** · create a concessions
register · invoke R-2 · perform or stage any R-3 amendment · modify `P00_GATE_MODEL.md`,
`D4_11_CERTIFICATION_MATRIX.md`, the A2 certification record, P07 acceptance, P06 acceptance,
D17, D18 or D19 · resolve, waive or reinterpret **BD-1…BD-12** (all **PRESERVED**) · reopen
**OI-08 / OI-09 / OI-10** · alter **ADR-01 C1–C6** · touch source, tests or existing-IIPS ·
merge to `main`.

⚠ **AD-17/M-2, M-1/AD-4, Act 6/O-8, OI-P04-03, OI-P04-04, DEP-P01-04, PIT-6, D04 corporate
actions, and provider/credential/licensing restrictions all remain exactly as recorded in D18 §7.**

---

# 15. Required next acts

| # | Act | Status |
|---|---|---|
| **F-1** | *This record.* | ✅ **COMPLETE** |
| **F-3** | **Re-run the P08 ENTRY AUTHORIZATION** as a separate act, superseding **D18**'s BLOCKED outcome on the BL-3 ground only. ⚠ It must independently re-verify that **no other** blocker exists | **REQUIRED NEXT** |
| **F-4** | **Designate a P08 A3 acceptor** — ⚠ still outstanding; blocks future P08 **acceptance**, not entry | Outstanding |
| **F-2** | *Optional:* durable R-3 amendment (§9), **by addition** | Recommended, not required |
| **F-5** | Reconcile the stale `P00_GATE_MODEL` ledger (D18 §4.1), **by addition** | Outstanding |

⚠ **None of F-2…F-5 is performed here, and F-3 is NOT performed in this run.**

---

**D20 — F-1 PROGRAM AUTHORITY ADJUDICATION. DECISION: ✅ R1-A.**
**BL-3 = RESOLVED FOR P08 PROGRESSION · A2 WITHHOLD SUPERSEDED ONLY AS TO P08 PROGRESSION ·
C7 = NOT CERTIFIED · P08 AUTHORIZATION = NOT_AUTHORIZED · P08 ACCEPTANCE = NOT_ACCEPTED ·
CERTIFICATION = NONE_GRANTED · PRODUCTION ACTIVATION = NOT_AUTHORIZED.**
