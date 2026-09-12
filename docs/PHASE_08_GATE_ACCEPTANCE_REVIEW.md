# PHASE 08 — FORMAL GATE ACCEPTANCE REVIEW

> **ACT TYPE:** **A3 formal gate-acceptance review.** A3 = **Sai** (P08 gate only, `7e3f61b`).
> **RESULT: ⛔ P08 = NOT ACCEPTED** — one P00 minimum-evidence criterion is **NOT SATISFIABLE BY
> P08** and requires a **separate authority decision**.
> ⛔ **NO ACCEPTANCE ARTIFACT IS CREATED.** No certification. No activation. No P09–P17.
> **Append-only. Edits no prior record.**
> **Identifier: `PHASE_08_GATE_ACCEPTANCE_REVIEW` — no `Dnn` token claimed.**

---

## 0. Baseline and integrity

| Check | Result |
|---|---|
| HEAD | **`7e3f61b5cd1661d658a76ac7ab1b819b9658c004`** ✅ |
| Working tree | **CLEAN** ✅ |
| Lineage | `7e3f61b` (F-4 recording) ← `46537f7` (F4-B) ← `8ee2da3` (**P08-03**) ← `085bf7a` (D24) ← `397ae54` (**P08-02**) ← `9e14124` (D23) ← `55cb472` (**P08-01**) ✅ |
| F4-B record byte-identical | **md5 `dbb5dd5b258913c8fcc380719d95a2dc`** ✅ unchanged |
| F-4 designation + ledger additions | ✅ present (`F4A_…`, `P00_DECISION_LOG.md` §39, `P00_GATE_MODEL.md` P08 A3 row) |
| Full suite | **626/626 PASS** — p05 264 · p06 113 · p07 159 · p08 90 ✅ |

---

## 1. Governing standard

`P00_GATE_MODEL.md`:45 — P08 minimum evidence, verbatim:

> *"**ADR-02 evidence: byte-identical golden replay; vintage ambiguity detection**"*

Acceptance requirement 2: *"Minimum evidence for the phase exists and is cited."*
⚠ Requirement 2 is **not** discretionary and **not** waivable by an A3 review.

**ADR-02 §I — "Required evidence (to be produced after approval)"**, verbatim:

1. *"**Byte-identical replay of all existing golden executions** with `contributingData` empty."*
2. *"Ambiguity-detection test: two market-data executions differing only in `dataVersion`/`asOf` yield **distinct effective replay identities**."*
3. *"Determinism: identical contributing snapshots ⇒ identical replay identity, with deterministic serialization of the lineage block."*
4. *"Demonstration that `data-*` and `SNAP_*` formats are unchanged."*

---

## 2. Criterion A — ADR-02 byte-identical golden replay — ⛔ **PARTIALLY SATISFIED; §I.1 NOT SATISFIABLE BY P08**

### A.1 What P08 **does** demonstrate — executed, reproducible

**Full-rebuild determinism (5 independent rebuilds of store + CA pipeline + projection):**

```
run1..run5  sha256 = 14a5bc7179fb23941d21cb1d36e42f180825321c3dfb5c69f90d6b132b714a1c
ALL IDENTICAL: true          serialized payload: 2551 bytes
```

| ADR-02 §I | Result |
|---|---|
| **§I.2** distinct identities for differing vintage | ✅ `data-fixture-1.0-2024-01-02…` ≠ `data-fixture-2.0-2024-01-02…` (dataVersion) and ≠ `data-fixture-1.0-2024-02-02…` (asOf) |
| **§I.3** identical inputs ⇒ identical output, deterministic serialization | ✅ 5/5 byte-identical digests |
| **§I.4** `data-*` format unchanged | ✅ `data-${provider}-${dataVersion}-${asOf}` preserved; ⚠ **`SNAP_*` is untouched and out of P08 scope** |

### A.2 ⛔ The blocker — §I.1

ADR-02 §I.1 requires byte-identical replay of **"all existing golden executions"**. Those are
**existing-IIPS engine executions** (`PROGRAM_v1.1_REPLAY_BASELINE.json`, the 13-engine / 97-case
golden corpus).

**Verified facts:**

| Fact | Evidence |
|---|---|
| The existing-IIPS golden corpus is **NOT PRESENT** in this repository | no `program-v1.1-certification/`; no `PROGRAM_v1.1_REPLAY_BASELINE.json`; **0** tracked `ReplayService`/`DataBoundExecutor`/`iips-review-recovered` files |
| P08 is **FORBIDDEN** from touching it | `D22` §5: *"⛔ `iips-review-recovered` · ⛔ **any existing-IIPS path**"* |
| The replay mechanism is itself **defective and unrepaired** | **AD-17 / M-2** = **UNRESOLVED** — `ReplayService` returns `reproduced: true` / `byteIdentical: true` as **literals, not verified results** (`ADR-02`:137). ⚠ **P08 may not repair it** (BD-1) |
| ADR-02 keeps it out of scope | §H: *"**AD-17 remains UNRESOLVED and explicitly out of scope**"* |

⛔ **Therefore §I.1 cannot be discharged by P08 at all** — not by more work, not by better tests.
The artifact is absent, the path is prohibited, and the verifying mechanism is a known literal-stub.

⚠ **What P08 produced is a deterministic projection over in-code fixtures — it is NOT a replay of
existing golden executions, and this review does not present it as one.** Declaring §I.1 met would
be exactly the *"citing an artifact not actually inspected"* failure banned by
`P00_EVIDENCE_CONVENTIONS.md`:73.

⚠ **D20/F-1 does not cure this.** F-1 superseded only the **PROGRESSION EFFECT of the A2 C7
withhold**, for P08 progression. It expressly left **C7 NOT ESTABLISHED** and did **not** dispose
of ADR-02 §I.1, AD-17 or the P00 `:45` evidence requirement.

---

## 3. Criterion B — vintage ambiguity detection — ✅ **SATISFIED**

Executed:

```
B1 conflicting vintage at same asOf        -> REJECTED, code PS-E9  (fail-closed at ingress)
B2 detectVintageAmbiguity() post-rejection -> []   (unreachable by construction)
B3 idempotent re-append of identical bar   -> size 1 (no duplicate vintage)
B4 distinct identity by dataVersion / asOf -> true / true
```

⚠ **Disclosure — an architectural nuance, not a defect.** P08-01 detects ambiguity **fail-closed at
ingress** (`PS-E9`), so a conflicting vintage is **never stored**. Consequently the post-hoc
`detectVintageAmbiguity()` surface is **unreachable while ingestion is the only writer**: it
returns `[]` because the conflict was already refused. The gate requirement — *"vintage ambiguity
detection"* — is **met, and met more strictly** (prevention rather than after-the-fact reporting).
This is recorded so no future reader mistakes the empty array for undetected ambiguity.

---

## 4. Criterion C — P05 PIT repeatability (PIT-6, travelled forward) — 🟡 **DEMONSTRATED IN-MEMORY; NOT FULLY DISCHARGED**

P05 `PIT-6`, verbatim: *"The obligation travels forward, undischarged … recorded as **P08** scope
(Historical/PIT gate; ADR-02 byte-identical golden replay). **This P05 acceptance does not
discharge it, and P08 may not cite P05 acceptance as evidence that PIT is handled.**"*

`P05_ACCEPTANCE_CRITERIA.md` **B-2**: *"**NOT satisfied by snapshot-level repeatability, replay
idempotency, or deterministic re-runs, none of which is point-in-time.**"*

**Executed — a genuine point-in-time test (not a deterministic re-run):**

```
PIT query @2024-01-15 BEFORE later knowledge = f61d4d62…f799d941
  → then appended a 2024-03-01 bar AND ingested a corporate action
PIT query @2024-01-15 AFTER  later knowledge = f61d4d62…f799d941
POINT-IN-TIME REPEATABLE (as-knowable, not as-known-now): true
```

✅ This **is** point-in-time semantics: the historical answer did **not** move when later knowledge
arrived. It satisfies B-2's distinction rather than evading it.

⚠ **But it is NOT the full discharge**, and this review does not claim it is:

- the store is **in-memory only**, by F-6 mandate (no durable persistence authorized), so
  repeatability **across process/storage lifetimes is not demonstrated**;
- B-2's own terms tie the obligation to the **ADR-02 byte-identical golden replay** — which fails
  at §I.1 (§2 above).

**Classification: PARTIALLY DISCHARGED — recorded open, not marked satisfied.** ⚠ Per the standing
instruction, it is **not** marked satisfied merely because P08-01 has an append-only in-memory PIT
model.

---

## 5. Criterion D — AG-1 (actionType taxonomy) — ✅ **BOUNDED / NON-BLOCKING**

Executed:

```
ACTION_TYPES = ["dividend","split","bonus"]
dividend ACCEPTED · split ACCEPTED · bonus ACCEPTED
rights   REJECTED CA-E2 · merger REJECTED CA-E2 · spinoff REJECTED CA-E2
```

`P01_FIELD_DICTIONARY.md`:120 declares `actionType` an `enum` with **no enumerated values**. P08-02
bounds it to the three tracker-named values and **fails closed** on anything else — it does not
silently accept, coerce or widen.

**Assessment: a bounded, correctly-recorded authority gap, NOT an acceptance blocker.** The gate
requirement is D04 corporate-action ingestion with effective dating, which the bounded vocabulary
fully serves. A future action type requires a P01 amendment, not a P08 change. ⚠ **AG-1 remains
OPEN**; no action type was invented.

---

## 6. Criterion E — AG-2 (adjustment methodology) — ✅ **CORRECTLY CLASSIFIED OPEN / NON-BLOCKING**

Verified in source and by mutation testing:

| Check | Result |
|---|---|
| Declared `adjustmentFactor` consumed verbatim | ✅ |
| Factor derived from `ratio` / `cashAmount` / price / actionType | ⛔ **NO** — missing factor ⇒ refusal `AS-E3` |
| Cumulative composition / ordering / precedence | ⛔ **NO** — ≥2 actions ⇒ refusal `AS-E6` |
| Rounding/precision policy imposed | ⛔ **NO** — `1/3` factor passes through unrounded |
| Mutation tests (derive-from-ratio · mutate vintage · drop flag+provenance · allow composition) | ✅ **all four killed** (4/13/5/2 failures) |
| `adjustmentBasisRef` required on adjusted output (**L-11**) | ✅ deterministic, derived from CA evidence |
| P01 D02 adjusted-vs-unadjusted flag | ✅ present on series **and** every bar |

Satisfies `P01_SCHEMA_CATALOG.md` D02: *"adjustment factors are **evidence-bearing, never silently
applied**."* **AG-2 remains OPEN / NON-BLOCKING** — correctly classified; no methodology invented.

---

## 7. Criterion F — P04 lifecycle boundary — ✅ **SATISFIED**

P08-02 consumes the five-value `lifecycleStatus` enumeration from the **P04-03 specification** and
declares `executableP04ServiceProvided: false`. It computes **no lifecycle transitions**, adds no
sixth timestamp (ED-7/INV-5), and keeps `effectiveDate`/`effectiveTime`/`exDate`/`recordDate`/
`payDate`/`asOf` distinct. ⚠ **No executable P04 lifecycle service is claimed.**

## 8. Criterion G — P07-03 dependency — ✅ **SATISFIED**

P07-03 is **accepted** (`PHASE_07_OVERALL_ACCEPTANCE.md`:28, `e302a4d`/`28d862b`, 18/18; ledger
44/44/0; re-executed locally **44 pass / 0 fail**). P08-03 **imports** `DISPOSITION_TYPES` and
`COMPARISON_DIMENSIONS` from `p07/src/providerReconciliation.js` — consumed, **not duplicated, not
modified**; `git diff` shows **zero** `p07/` changes.

## 9. Criterion H — no prohibited scope expansion — ✅ **SATISFIED**

Scans over `p08/src/`: **no** network/`fetch`/URLs · **no** `process.env.` · **no** credentials ·
**no** `writeFileSync`/`mkdirSync`/`createWriteStream` · **no** provider acquisition. **0** P09–P17
files · **0** P08 acceptance artifacts · **0** existing-IIPS files tracked or modified ·
F-6 guard unmodified · `docs/p08/` absent.

---

## 10. ⛔ FORMAL ACCEPTANCE DECISION

# **P08 = NOT ACCEPTED**

### Exact blocking criterion

| Blocker | Criterion | Authority |
|---|---|---|
| **B-P08-1** | **`P00_GATE_MODEL.md`:45 minimum evidence — "ADR-02 evidence: byte-identical golden replay"**, specifically **ADR-02 §I.1**: byte-identical replay of **all existing golden executions**. **NOT SATISFIABLE BY P08**: the golden corpus is absent from this repository; `D22` §5 **prohibits** P08 from touching any existing-IIPS path; and the verifying mechanism is **AD-17/M-2 UNRESOLVED** (`ReplayService` returns literals), which **BD-1 forbids P08 to repair**. | Acceptance requirement **2** |

⚠ **This is a genuine authority blocker, not an implementation shortfall.** P08-01/02/03 are
complete and correct within their authorized scope; **no additional P08 work can clear B-P08-1.**

⚠ **Acceptance was NOT forced despite complete implementation.** Requirement 2 is unmet on its
face, and acceptance requirement **4** permits an open item to be *"resolved or explicitly conceded
in the concessions register"* — ⚠ **no concessions register exists** (a known corpus defect:
`P00_GATE_MODEL.md` rule 4 cites an artifact that was never created). **Creating one, or conceding
B-P08-1, is an authority act this review is not authorized to perform.**

**Secondary, recorded but NOT independently blocking:** criterion **C** (PIT repeatability) is
**partially discharged** and remains open — it is entangled with B-P08-1 and would be resolved
alongside it.

### Because P08 is NOT accepted

⛔ **No P08 gate-acceptance artifact was created** (correctly — the F-6 guard independently
enforces this). Formal gate count **UNCHANGED**.

---

## 11. State after this review — **UNCHANGED**

```
P08 A3 ACCEPTOR   = DESIGNATED — Sai (P08 gate only)   [unchanged]
P08 ACCEPTANCE    = NOT_ACCEPTED                       [unchanged — blocker B-P08-1]
P08 CERTIFICATION = NONE_GRANTED      C7 = NOT_CERTIFIED
CERTIFICATION     = NONE_GRANTED      PRODUCTION = NOT_AUTHORIZED
P09–P17           = NOT_AUTHORIZED
AG-1 = OPEN (bounded, non-blocking)   AG-2 = OPEN / NON-BLOCKING
AD-17/M-2 = UNRESOLVED                PIT repeatability = PARTIALLY DISCHARGED, OPEN
```

Unchanged: P08-01 COMPLETE · P08-02 IMPLEMENTED · P08-03 COMPLETE · BD-1…BD-13 (BD-11 discharged at
`7e3f61b`) · OI-08/09/10 · ADR-01 C1–C6 · ADR-02 · M-1/AD-4 · M-5 · M-6 · Act 6 · OI-P04-03/04.

---

## 12. Required next act — **an authority decision, not more implementation**

**B-P08-1 must be dispositioned by the Program Authority.** The options are named, **not chosen
here**:

1. **Scope interpretation** — expressly determine that ADR-02 §I.1 binds the **existing-IIPS
   replay surface**, not P08, and that P08's obligation is limited to §I.2–§I.4 (all ✅ met).
2. **Explicit concession** — concede B-P08-1, which first requires **creating the concessions
   register** that acceptance requirement 4 presupposes but which does not exist.
3. **Discharge upstream** — resolve **AD-17/M-2** in the existing-IIPS program and run the golden
   corpus, then re-review.

⚠ **F-2, F-5 and the branch-reference discrepancy were NOT touched and are NOT resolved here.**
None is a dependency of B-P08-1; they remain separately outstanding. ⚠ The **concessions-register
gap** surfaced by option 2 is likewise **recorded, not decided**.

---

**Review performed. Acceptance NOT performed. No evidence invented, no criterion relabelled, no
dependency weakened or bypassed.**
