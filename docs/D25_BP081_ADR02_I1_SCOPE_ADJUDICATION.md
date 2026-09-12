# D25 — B-P08-1 AUTHORITY ADJUDICATION — ADR-02 §I.1 SCOPE AS APPLIED TO THE P08 GATE

> **ACT TYPE:** **Program Authority adjudication.** Scope interpretation only.
> ⛔ **NO ACCEPTANCE. NO CERTIFICATION. NO ACTIVATION. NO IMPLEMENTATION.**
> ⛔ **ADR-02 IS NOT MODIFIED. P00 GATE REQUIREMENTS ARE NOT MODIFIED. EXISTING-IIPS IS NOT
>    MODIFIED. NO CONCESSION OR WAIVER MECHANISM IS CREATED.**
> **Append-only. Edits no prior record.**
> **Identifier: `D25` — adjudicating the blocker recorded at `810ede2`.**

| Field | Content |
|---|---|
| **Act** | Adjudication of **B-P08-1**, the sole P08 acceptance blocker found by the formal review |
| **Baseline** | **`810ede2e5cf04fed24a2e9222622aab4260f1931`** — *"P08 formal gate acceptance review: NOT ACCEPTED"* |
| **Branch** | `arena/01a0853d-iips-production-market-data` (P08 implementation lineage) |
| **Authority** | **Program Authority of record**, exercised expressly for this act |
| **Decision** | # **OPTION 1 — ADR-02 §I.1 IS AN EXISTING-IIPS REPLAY-SURFACE OBLIGATION, NOT A P08-LOCAL ACCEPTANCE OBLIGATION** |

---

## 1. The question

`P00_GATE_MODEL.md`:45 sets P08 minimum evidence as *"**ADR-02 evidence: byte-identical golden
replay**; vintage ambiguity detection"*. ADR-02 §I.1 reads, verbatim:

> *"Byte-identical replay of **all existing golden executions** with `contributingData` empty."*

**Does §I.1 bind the P08 gate, or the existing-IIPS replay surface?**

⚠ This was adjudicated **on the corpus, not on convenience.** The disciplined test applied
throughout: *would this interpretation still be correct if it produced the opposite outcome for
P08?*

---

## 2. What ADR-02 §I.1 actually scopes — **the engine execution layer**

**§I.1 is a test of the ENGINE layer, not the market-data layer.** ADR-02 itself draws the
two-layer distinction (§B), and every operative element of §I.1 sits on the far side of it:

| Element of §I.1 | Which layer it belongs to | Source |
|---|---|---|
| *"existing golden executions"* | **Engine executions** — the certified 13-engine / 97-case corpus | `ADR-02` §B: certified replay identity lives in `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json` |
| *"`contributingData`"* | A field **added to the engine `Snapshot` record** (`SnapshotService.ts`) | `ADR-02` §C.2:83 — *"Engine `Snapshot` \| Carry `contributingData` … \| **Additive**"* |
| *"replay"* | Performed by **`ReplayService`** — existing-IIPS | `ADR-02`:137 |

⚠ **§I.1 is the REGRESSION-SAFETY test for the ADR-02 extension**, not a market-data feature test.
Its logic is stated at `ADR-02`:108 — *"Empty `contributingData` \| Extension is **inert**;
effective replay identity reduces exactly to today's four-element identity."* §I.1 exists to prove
that **adding** the lineage field **breaks nothing that already exists**. With `contributingData`
**empty**, §I.1 by construction exercises **no market-data input at all** — it is the
extension-off control case.

⚠ Therefore §I.1 is **not merely inconvenient for P08 — it is not a test of P08's subject matter.**

## 3. Which phase/gate owns the obligation — **existing-IIPS, expressly**

ADR-02 **§G. Authority**, verbatim:

| Role | Assignment |
|---|---|
| **NAMED AUTHORITY REQUIRED** | **Ramki / Sai** — *"the engine `Snapshot` record and effective replay identity are **certified existing-IIPS surfaces**"* |
| **AD-17 authority** | *"**Existing-IIPS — separate; not this ADR**"* |
| **This program's authority** | # *"**None over this decision.** It may only prepare the package"* |

⚠ **ADR-02 states in its own authority section that THIS PROGRAM HAS NO AUTHORITY over the
surface §I.1 tests.** A gate of this program therefore cannot own, discharge or be blocked on an
obligation the ADR assigns elsewhere. Reading §I.1 as a P08-local acceptance condition would make
P08 accountable for a surface ADR-02 expressly places beyond this program's authority.

## 4. Whether P08 can discharge it — **NO, contractually and technically**

| Test | Finding |
|---|---|
| Does P08 emit an engine `Snapshot`, `contributingData` or a `SNAP_*` identity? | ⛔ **NO** — verified: zero occurrences in `p08/src/`. P08 emits only the market-data identity `data-${provider}-${dataVersion}-${asOf}` |
| Is the golden corpus present? | ⛔ **NO** — no `program-v1.1-certification/`, no `PROGRAM_v1.1_REPLAY_BASELINE.json`, **0** tracked existing-IIPS files |
| May P08 touch it? | ⛔ **PROHIBITED** — `D22` §5: *"⛔ `iips-review-recovered` · ⛔ **any existing-IIPS path**"* |
| Is the verifying mechanism sound? | ⛔ **NO** — **AD-17/M-2 UNRESOLVED**: `ReplayService` returns `reproduced: true` / `byteIdentical: true` as **literals, not verified results** (`ADR-02`:137). ⚠ **BD-1 forbids P08 to repair it** |

⚠ **A gate cannot be blocked on evidence it is contractually forbidden to produce, about a surface
it does not own, verified by a mechanism known to be a literal stub.** That is not a P08 evidence
gap; it is a **mis-attribution of an upstream obligation**, corrected here.

## 5. Does this change any previously accepted methodology? — **NO**

| Artifact | Effect |
|---|---|
| **ADR-02** | ⛔ **UNMODIFIED.** Not amended, not reinterpreted as to its own terms. §I.1–§I.4 stand exactly as written |
| **`P00_GATE_MODEL.md`:45** | ⛔ **UNMODIFIED.** The evidence requirement is **not deleted, weakened or relabelled** — its **owner** is identified |
| **P05 / P06 / P07 acceptances** | ⛔ **UNAFFECTED.** No prior acceptance ever claimed §I.1; verified. ⚠ P06's *"97/97 independently byte-identical"* is the **ADR-01 C1–C6 normalization** oracle — a different requirement, untouched |
| **Existing-IIPS methodology / source** | ⛔ **UNMODIFIED** |
| **AD-17 / M-2** | ⛔ **UNRESOLVED** — see §7 |

⚠ **Nothing is reclassified as satisfied.** §I.1 remains **UNSATISFIED**; this act determines
**who must satisfy it**, and it is not P08.

## 6. Effect on certification requirements — **NEITHER CREATED NOR REMOVED**

`P00_GATE_MODEL.md`:45 keeps P08's *"Cert. before progression?"* = **YES (C3, C4, C11)**.

⚠ **UNCHANGED BY THIS ACT.** The C3/C4 owner remains as ADR-02 §F records it — *"**A2 new-program
certification authority — UNKNOWN.** Not assigned here"* — and `D4_11`:41-42 assigns C3/C4 to the
replay-identity extension under *"Ramki/Sai ADR + certification"*.

⚠ **This adjudication grants, implies and prepares NO certification.** Per `P00_GATE_MODEL.md`
rule 5, *"authority clearance is not certification"*; and certification gates **progression**, not
acceptance — the distinction already applied when **P07 was accepted with certification
`NONE_GRANTED`**.

---

## 7. ⚠ What this act expressly does **NOT** resolve

| Item | State after this act |
|---|---|
| **AD-17 / M-2** | # **UNRESOLVED** — untouched. ⚠ This adjudication does **not** repair, reinterpret or weaken it, and **does not legitimately resolve it**. The `ReplayService` literal-return defect stands, owned by existing-IIPS |
| **ADR-02 §I.1 itself** | # **UNSATISFIED** — owed by the existing-IIPS replay surface, undischarged |
| **Existing-IIPS replay certification** | **NOT CERTIFIED, NOT PREPARED, NOT IMPLIED** |
| **C3 / C4 / C11 · C7** | **NOT CERTIFIED** — unchanged |
| **PIT repeatability (P05 PIT-6)** | **PARTIALLY DISCHARGED, OPEN** — recorded at `810ede2` §4; ⚠ **not resolved here** |
| **AG-1 · AG-2** | **OPEN** (bounded / non-blocking) — unchanged |
| **F-2 · F-5 · branch-ref discrepancy** | **UNTOUCHED**, separately outstanding |
| **Concessions register** | ⛔ **NOT CREATED.** ⚠ **Option 2 was NOT selected**, precisely so that no waiver mechanism is invented. The corpus defect — rule 4 citing a register that never existed — remains **recorded, not cured** |

---

## 8. Options considered

| Option | Disposition |
|---|---|
| **1 — existing-IIPS obligation** | ✅ **SELECTED.** Supported by ADR-02 §B (layer separation), §C.2:83 (`contributingData` is an **engine `Snapshot`** field), :108 (empty ⇒ inert control case), **§G (*"This program's authority: **None over this decision**"*)**, `D22` §5 and AD-17/BD-1 |
| **2 — concede B-P08-1** | ⛔ **REJECTED.** Requires a concessions register that does not exist; creating one is a separate authority act and was expressly prohibited. ⚠ Also unnecessary: a **mis-attributed** obligation needs correction, not concession |
| **3 — hard blocker pending AD-17** | ⛔ **REJECTED**, though it is the closest alternative. It correctly preserves AD-17, but holds P08 hostage to a defect P08 **may not touch** (`D22` §5) and **may not repair** (BD-1), on a surface this program has **no authority** over (§G). That is an indefinite, undischargeable block created by mis-attribution. ⚠ **Everything Option 3 protects, Option 1 also preserves** — AD-17 UNRESOLVED, §I.1 UNSATISFIED, no certification — while placing the obligation with its actual owner |

⚠ **The decisive point is NOT that Option 1 unblocks P08.** It is that §I.1 tests the engine
replay surface with `contributingData` **empty** — a case that exercises no P08 behaviour at all.
Option 1 would be the correct reading even if P08 had never been implemented.

---

## 9. Effect on P08 acceptance eligibility

> ### **B-P08-1 is NOT a P08-local acceptance blocker.**
>
> ### **P08's ADR-02 obligations are §I.2, §I.3 and §I.4 — all three independently evidenced at `810ede2` (5/5 byte-identical digests `14a5bc71…`; distinct identities per `dataVersion`/`asOf`; `data-*` format preserved).**

⚠ **P08 REMAINS `NOT_ACCEPTED`.** This adjudication **does not accept P08** and is **not** an
acceptance act. It removes one mis-attributed obstacle from the acceptance path; **a separate
acceptance act by the designated A3 (Sai) is required**, and that act must still weigh the
remaining open items on their own merits — including **PIT repeatability (partially discharged)**,
**AG-1**, **AG-2**, and the `P00_GATE_MODEL.md` rule 4 / concessions-register defect.

⚠ **This act does not pre-decide that acceptance**, and nothing here obliges the A3 to accept.

---

## 10. State after this act

```
B-P08-1           = ADJUDICATED — not a P08-local blocker (Option 1)
ADR-02 §I.1       = UNSATISFIED — owed by the existing-IIPS replay surface
AD-17 / M-2       = UNRESOLVED                [unchanged]
P08 ACCEPTANCE    = NOT_ACCEPTED              [unchanged]
P08 A3            = DESIGNATED — Sai (P08 gate only)
C3 / C4 / C11     = NOT CERTIFIED             C7 = NOT_CERTIFIED
CERTIFICATION     = NONE_GRANTED              PRODUCTION = NOT_AUTHORIZED
P09–P17           = NOT_AUTHORIZED
AG-1 = OPEN (bounded)   AG-2 = OPEN / NON-BLOCKING
PIT repeatability = PARTIALLY DISCHARGED, OPEN
```

## 11. Required next act

A **separate P08 gate-acceptance act by the designated A3 (Sai)** may now be considered. ⚠ It is
**not authorized by this record** and its outcome is **not pre-determined** here.

Separately outstanding, **not resolved by this act**: **AD-17/M-2** and ADR-02 §I.1 (existing-IIPS)
· **F-2** · **F-5** · the **branch-reference discrepancy** · the **concessions-register corpus
defect**.

---

**Adjudication performed. No acceptance, no certification, no activation, no implementation. ADR-02,
P00 gate requirements and existing-IIPS are unmodified. No golden replay evidence was fabricated and
§I.1 is NOT marked satisfied.**
