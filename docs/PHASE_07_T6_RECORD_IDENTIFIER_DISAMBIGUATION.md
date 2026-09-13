# PHASE 07 — T6 ACT 1 RECORD IDENTIFIER DISAMBIGUATION

> **ACT TYPE:** **Append-only governance correction.** **NO IMPLEMENTATION.**
> **PURPOSE:** Resolve the **decision-identifier collision** created by
> `docs/D16_P01_EVALUATION_INSTANT_AUTHORITY_ACT.md` (commit `fc81404`), which carries the token
> **`D16`** — an identifier already occupied by a **frozen methodology preserved verbatim**.
> ⚠ **This act RENAMES NOTHING, EDITS NOTHING and RENUMBERS NOTHING.** The defective record is left
> **byte-for-byte intact**; the collision is resolved by **citation rule**, not by rewriting history.
> **Append-only.**

---

## 0. Scope and boundary

| | |
|---|---|
| **In scope** | The **identifier** used by the Act 1 authority record |
| **Out of scope** | The **substance** of the Act 1 decision — which is **unaffected and stands as recorded** |
| **P01** | ⛔ **NOT MODIFIED** — P01 remains ACCEPTED and unamended; **T6 is not established** |
| **Act 1 status** | 🟡 **B — DECIDED, NOT ESTABLISHED** — **UNCHANGED by this act** |
| **P07 IMPLEMENTATION** | ⛔ **NOT YET PERMITTED** — **unchanged** |

---

## 1. THE DEFECT — evidence

`PHASE_07_THRESHOLD_AUTHORITY_PATH.md` §0.1 recorded the hazard **before** it occurred:

> *"The next decision number in the `docs/Dnn_` series is **16**, and it is **unusable**. `D16` is an
> **occupied frozen-methodology identifier** in this corpus: **"Telecom D16"** / **`D16 M1–M15`**
> (IES-016, oracle `3cfb/92be`)… Introducing a decision record named `D16_…` would make every `D16`
> reference ambiguous and risk conflating a program decision with a frozen methodology. **`D17` and
> `D20` are likewise occupied.**"*

And `PHASE_07_THRESHOLD_DECISION_INPUT.md:258` made it a **condition**: the filename must be
*"**not** `D16`/`D17`/`D20` as a decision number."*

**Commit `fc81404` did not satisfy that condition.** Fresh measurements:

| Token | Corpus hits (excl. the Act 1 record) | Occupant |
|---|---|---|
| **`D16`** | **23** | **Telecom `D16 M1–M15`** — IES-016, oracle `3cfb/92be` |
| **`D17`** | **4** | **Auto `D17 M1–M15` + Option-A**, triple `44ba/ea22/c8ed` |
| **`D20`** | **4** | **Materials `D20 M1–M15` + G1–G6**, `5813…` |
| **`D18`** | **0** | **FREE** |
| **`D19`** | **0** | **FREE** |
| **`D21`+** | **0** | **FREE** |

**Binding invariant:** `D4_11_CERTIFICATION_MATRIX.md:28` — *"Frozen methodologies **D16/D17/D20** …
| methodology docs | **UNAFFECTED** | **Preserved verbatim**."* Reinforced at
`P00_PROGRAM_CHARTER.md:82`, `PROGRAM_STATE.md:846`, `D4_08_ENGINE_INTEGRATION.md:50-51`,
`D8_EXECUTION_AUTHORIZATION.md:72`.

### 1.1 ⚠ A second collision dimension

The record also uses **`D16-1` … `D16-8`** as **internal sub-decision identifiers**. Since the frozen
methodology's own items are **`M1–M15`** under the **same `D16`** token, `D16-n` labels are likewise
ambiguous. **Both dimensions are resolved below.**

### 1.2 Why the test suite did not catch it

The repository guards assert `!/P07[_-]/` on tracked filenames and the absence of `docs/p07`,
`docs/p08`. **They do not test the `Dnn` / frozen-methodology token space.** The filename therefore
passes **377/377** while remaining **governance-ambiguous** — precisely the failure mode §0.1
predicted. **This is a governance defect, not a test failure.**

---

## 2. RESOLUTION — citation rules

| # | Rule |
|---|---|
| **R1** | **Token primacy.** A bare **`D16`**, **`D17`** or **`D20`** in this corpus **always** denotes the **frozen methodology** (Telecom / Auto / Materials respectively). **No program decision may claim these tokens.** |
| **R2** | **The Act 1 record carries no decision number.** `docs/D16_P01_EVALUATION_INSTANT_AUTHORITY_ACT.md` is cited canonically as **`T6_EVALUATION_INSTANT_AUTHORITY_ACT`**, pinned to commit **`fc81404acae5727eb93ee8d681fac8c4b781d61c`**. The `D16_` prefix is a **filename artifact only** and confers **no `Dnn` decision number**. |
| **R3** | **Sub-decisions are re-cited.** **`D16-1`…`D16-8`** are cited canonically as **`EVAL-1`…`EVAL-8`**. The original labels remain in the record **unedited** (append-only); all downstream citation uses the **`EVAL-n`** form. |
| **R4** | **Series reservation.** The `docs/Dnn_` decision series **reserves and skips 16, 17 and 20**. **`D18`, `D19` and `D21`+ are free** (0 corpus hits each) and available to future decision records. |
| **R5** | **No renumbering of the frozen series.** Frozen methodologies are **preserved verbatim**; renumbering them is **prohibited** and outside the authority of any recording act. |

---

## 3. CANONICAL CITATION MAPPING

| Original label (in the record, unedited) | Canonical citation | Substance |
|---|---|---|
| `D16-1` | **`EVAL-1`** | T6 is a NEW and DISTINCT time; family extended five → six |
| `D16-2` | **`EVAL-2`** | Meaning: the instant at which freshness is evaluated |
| `D16-3` | **`EVAL-3`** | Candidate field name `evaluationTime` |
| `D16-4` | **`EVAL-4`** | Explicit input (**RP-2**) |
| `D16-5` | **`EVAL-5`** | Never an implicit wall-clock *"now"* |
| `D16-6` | **`EVAL-6`** | Never repurposes / substitutes for / is inferred from / is collapsed with T1–T5 |
| `D16-7` | **`EVAL-7`** | **TS-1** / **TS-2** representation, inherited |
| `D16-8` | **`EVAL-8`** | Recorded in the freshness evidence (**RP-1**, **RP-3**) |

⚠ **The substance of EVAL-1…EVAL-8 is UNAFFECTED by this act.** Only the **identifier** changes.

---

## 4. WHAT THIS ACT DOES NOT DO

| Action | Performed? |
|---|---|
| Rename or move `docs/D16_P01_EVALUATION_INSTANT_AUTHORITY_ACT.md` | ❌ **NO** — renaming a durable record would violate append-only discipline |
| Edit any line of the Act 1 record | ❌ **NO** — blob preserved |
| Alter or weaken any `EVAL-1…EVAL-8` decision | ❌ **NO** |
| Renumber a frozen methodology | ❌ **NO** — **R5** |
| Modify **P01** or establish **T6** | ❌ **NO** — P01 remains ACCEPTED and unamended; **five times, no T6** |
| Move Act 1 to `A — ESTABLISHED` | ❌ **NO** — it remains **B — DECIDED, NOT ESTABLISHED** |
| Modify tracker / SPEC / source / tests / fixtures | ❌ **NO** |
| Grant acceptance or certification | ❌ **NO** |

⚠ **Renaming the file remains available to a future authority act** (e.g. a `git mv` in its own
commit, which preserves history). **This act does not perform it**, because the citation rules above
already remove the ambiguity and renaming a durable authority record requires its own authorization.

---

## 5. RESULTING STATE

| Item | Status |
|---|---|
| **Identifier collision** | ✅ **RESOLVED by citation rule** — `D16`/`D17`/`D20` are unambiguously the frozen methodologies; the Act 1 record is cited as **`T6_EVALUATION_INSTANT_AUTHORITY_ACT`** @ `fc81404`, sub-decisions **`EVAL-1…EVAL-8`** |
| **Act 1** | 🟡 **B — DECIDED, NOT ESTABLISHED** *(unchanged)* |
| **Act 2** duration units | 🟡 **B** *(unchanged)* — **UN-2 unsatisfied** |
| **Act 3** operational state | 🟡 **B** *(unchanged)* |
| **Act 4** P17 tracker | 🟡 **B** *(unchanged)* |
| **D3** | 🟡 **B — PARTIALLY READY** *(unchanged)* |
| **O-1** | 🔴 **OPEN — 4 of 5 resolved · D3 NOT RESOLVED** *(unchanged)* — **RP-4 stands** |
| **P07 implementation** | ⛔ **NOT YET PERMITTED** *(unchanged)* |

➡️ **Next authority act is unchanged:** the **P01 additive MINOR contract act** establishing T6.
**P01 was NOT modified by this act, per explicit instruction.** Until that act executes, Act 1
cannot advance to `A`.

---

## 6. Mutation statement

| | |
|---|---|
| Artifacts created | **exactly one** — this file |
| Files modified / renamed / deleted | **0** |
| Act 1 record blob | **preserved unchanged** |
| Frozen methodologies | **preserved verbatim — untouched** |
| Source / test / fixture / evidence changes | **0** |
| P01 / tracker / SPEC | **untouched** |
| Acceptance / certification granted | **none** |
| `origin/main` | **untouched** |

*Append-only. Every claim cites a line in an existing record or a measured corpus count.*
