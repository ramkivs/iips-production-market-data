# CHECKPOINT-04 — POST-P08-ACCEPTANCE GOVERNANCE RECONCILIATION

> **ACT TYPE:** **READ-ONLY governance checkpoint.** State reconciliation only.
> ⛔ **GRANTS NO AUTHORITY OF ANY KIND** — see §11.
> ⛔ **NO IMPLEMENTATION. NO ACCEPTANCE. NO CERTIFICATION. NO ACTIVATION. NO P09.**
> **Append-only. Rewrites nothing. Resolves nothing.**
> **Identifier: `CHECKPOINT-04` — no `Dnn` token claimed.**

| Field | Value |
|---|---|
| **Baseline SHA** | **`ec2349f90375911be33428e4a4cf42a9eedba457`** — *"P08 FORMAL GATE ACCEPTANCE: ACCEPTED by A3 (Sai, P08 gate only)"* |
| **Branch** | `arena/01a0853d-iips-production-market-data` (P08 implementation lineage) |
| **Working tree** | **CLEAN** ✅ verified |
| **Date** | 2026-09-12 |
| **Predecessors** | CHECKPOINT-01 · CHECKPOINT-02 · CHECKPOINT-03 (all **unedited**) |

---

## 1. Lineage — verified

P08 acceptance (`ec2349f`) **is the latest substantive program gate act**. The P08 lineage is
complete and contiguous:

| Act | Commit |
|---|---|
| **P08-01** PIT storage model | `55cb472` |
| **P08-02** corporate-action ingestion | `397ae54` |
| **P08-03** adjusted/unadjusted series | `8ee2da3` |
| **F-4** A3 finding (F4-B — none designable) | `46537f7` |
| **F-4** A3 designation recorded (**Sai**) | `7e3f61b` |
| P08 acceptance **review** — NOT ACCEPTED (B-P08-1) | `810ede2` |
| **D25** B-P08-1 adjudication (Option 1) | `4836c82` |
| **P08 FORMAL GATE ACCEPTANCE** | **`ec2349f`** |

⚠ The **negative** records (`46537f7` F4-B; `810ede2` NOT ACCEPTED) are **retained unedited** as the
record of their own moment. Each was superseded **by addition**, never rewritten — so the trail
shows P08 was *refused twice before being accepted*, which is the integrity evidence itself.

## 2. Gate ledger — **9 of 18 ACCEPTED**

Verified **independently** by enumerating acceptance artifacts, not by trusting the expected count:

| Gate | State | Acceptance artifact |
|---|---|---|
| **P00** | ✅ ACCEPTED | `docs/p00/P00_GATE_ACCEPTANCE.md` |
| **P01** | ✅ ACCEPTED | `docs/p01/P01_GATE_ACCEPTANCE.md` |
| **P02** | ✅ ACCEPTED | `docs/p02/P02_GATE_ACCEPTANCE.md` |
| **P03** | ✅ ACCEPTED | `docs/p03/P03_GATE_ACCEPTANCE.md` (specification only) |
| **P04** | ✅ ACCEPTED | `docs/p04/P04_GATE_ACCEPTANCE.md` |
| **P05** | ✅ ACCEPTED | `docs/p05/P05_GATE_ACCEPTANCE.md` |
| **P06** | ✅ ACCEPTED | `docs/p06/P06_GATE_ACCEPTANCE.md` |
| **P07** | ✅ ACCEPTED | `docs/PHASE_07_OVERALL_ACCEPTANCE.md` (§36) — ⚠ **no `docs/p07/` gate file**; different path, same authority |
| **P08** | ✅ **ACCEPTED** | `docs/PHASE_08_GATE_ACCEPTANCE.md` (§40) |
| **P09** | ⛔ **NOT_STARTED / NOT_ACCEPTED / NOT_AUTHORIZED** | — |

> # **TOTAL: 9 of 18 ACCEPTED. P10–P17 NOT ACCEPTED.**

⚠ **Documentation debt (recorded, NOT cured):** `P00_GATE_MODEL.md`:17 and :121 still read *"P07–P17
remain NOT ACCEPTED"* — **stale** as to **P07** and **P08**. Left **unedited**; superseded by
addition in the appended P08 block. ⚠ Fixing them is `F-5` ledger reconciliation, **not this act**.

## 3. P08 authority state — verified

| Property | Value |
|---|---|
| **A3 acceptor** | **Sai** |
| **Scope** | **P08 gate ONLY** — no standing assignment for P09–P17 |
| **Designation ≠ acceptance** | ✅ **two separate acts** — `7e3f61b` designated; `ec2349f` accepted |
| **A2 ≠ A3** | ✅ Sai holds P07 **A2** certification authority (`2d28e42`) and P08 **A3** acceptance authority — **two distinct roles from two independent acts**. The P08 designation rests **solely** on the express Program Authority act, **not** on the A2 role |
| **A1 / A4** | ⛔ **NOT DESIGNATED** — no designation occurred at any point |
| **Not extended from** | D10-3 (P06) · §7 (P05) · §27/O-5 (P07) |

## 4. Certification firewall — **INTACT**

| State | Value |
|---|---|
| **C7** | ⛔ **NOT_CERTIFIED** — *"NOT ESTABLISHED … requires P12/P13"* (`PHASE_07_CERTIFICATION_DECISION.md`:21/:42) |
| **C3 / C4 / C11** | ⛔ **NOT_CERTIFIED** — owner *"A2 — UNKNOWN"* (`ADR-02` §F; `D4_11`:41-42) |
| **Overall certification** | ⛔ **NONE_GRANTED** |
| **Production activation** | ⛔ **NOT_AUTHORIZED** (A4, at P16 only) |

> ⚠ **P08 ACCEPTANCE IS NOT AND MUST NOT BE REPRESENTED AS CERTIFICATION.**
> `P00_GATE_MODEL.md` rule 5 governs *"Cert. **before progression**"* — it gates **progression to
> the next phase**, not the acceptance of this one. This follows the **P07 precedent exactly**:
> accepted (§36) while certification was **withheld** (§38). ⚠ **No certification is inferred from
> A3 acceptance authority.**

## 5. Carried-forward open items — **RECORDED, NOT RESOLVED**

| Item | State |
|---|---|
| **ADR-02 §I.1** | **UNSATISFIED — existing-IIPS obligation** (D25). Not satisfied, not waived, not transferred to P08 |
| **AD-17 / M-2** | **UNRESOLVED** — `ReplayService` literal returns; not repaired or reinterpreted |
| **AG-1** (`actionType` taxonomy) | **OPEN** — bounded to `dividend\|split\|bonus`, fails closed (`CA-E2`); non-blocking |
| **AG-2** (adjustment methodology) | **OPEN / NON-BLOCKING** — declared factors only; `AS-E3`/`AS-E6` refusals |
| **PIT durable persistence** | **OPEN / TRAVELLING FORWARD** — see §5.1 |
| **F-2 · F-5 · branch-ref discrepancy** | **OUTSTANDING** — §9 |
| **Concessions-register corpus defect** | **RECORDED, not cured** — rule 4 cites a register that never existed |
| **M-1/AD-4 · M-5 · M-6 · Act 6 · OI-P04-03/04 · OI-05/06 · CD-01** | **UNCHANGED** |

### 5.1 ⚠ The PIT distinction — preserved exactly

| | Status |
|---|---|
| **P08 semantic PIT evidence** | ✅ **DISCHARGED.** A prior as-of answer is byte-stable (`f61d4d62…`) after later bars **and** a corporate action arrive; prior vintages are never rewritten; adjustment is a read-side projection. This meets P05 **B-2**'s own test (*"not satisfied by … deterministic re-runs"*) rather than evading it |
| **Durable production persistence** | ⛔ **OPEN — NOT discharged, NOT owned by P08.** The store is **in-memory by mandate**: F-6/`D22` §5 **prohibits** disk persistence; *"PIT storage remains a designed capability, not an authorized side effect, until its own separate act"* |

⚠ **These two must never be collapsed.** An in-memory proof was **not** upgraded into durable
production persistence, and P08 acceptance **does not** discharge the durable-persistence
obligation, which travels forward undischarged.

## 6. Existing-IIPS boundary — **ZERO CHANGES**

- **0** tracked existing-IIPS files (`iips-review-recovered`, `LiveDataRuntime`, `ReplayService`,
  `program-v1.1-certification`) — the corpus is **not present in this repository**.
- `git diff eae2ff69..ec2349f` touches **only** `docs/` and `p05/`–`p08/`; **no** path outside them.
- Methodology, scoring, calibration, taxonomy, engines and `ADR-02` itself: **UNMODIFIED**.

> ⚠ **Explicitly confirmed: NO existing-IIPS golden replay evidence was fabricated, cited or newly
> claimed by P08.** P08's determinism digests are **deterministic projections over in-code
> fixtures** and are **not** presented as a replay of existing golden executions. **ADR-02 §I.1
> remains UNSATISFIED and owed by existing-IIPS.**

## 7. P09 boundary — **COMPLETELY UNAUTHORIZED**

```
P09 = NOT_STARTED · NOT_AUTHORIZED · NOT_ACCEPTED · NOT_CERTIFIED
```

- **ZERO** `p09/`–`p17/` files, and **zero** P09 governance artifacts, tracked.
- `P00_GATE_MODEL.md`:46 — P09 deps **P07, P08**; *"Impl. permitted now? **Not yet**"*; Cert. before
  progression **YES**; Accepted **NO**.
- ⚠ **P08 acceptance satisfies one P09 dependency; it does NOT authorize P09.** Entry requires its
  own explicit authorization act.
- ⚠ **No P09 entry assessment, implementation, acceptance or certification was performed here.**

## 8. Historical integrity — verified by digest

| Artifact | md5 | State |
|---|---|---|
| `docs/PHASE_08_GATE_ACCEPTANCE.md` | `c9cd516355fd6f05f6958f31f941dcba` | **unchanged since acceptance** |
| `docs/D25_BP081_ADR02_I1_SCOPE_ADJUDICATION.md` | `fa11cfdc309be9183e21b78453996923` | **unchanged** |
| `docs/F4_PHASE_08_A3_ACCEPTOR_DESIGNATION.md` (F4-B) | `dbb5dd5b258913c8fcc380719d95a2dc` | **unchanged** |
| `docs/F4A_PHASE_08_A3_DESIGNATION_RECORDING.md` | `0e26f1ec2ca4b72cf2e20442c216049a` | **unchanged** |

**No P00–P07 accepted gate artifact was rewritten** — the only `docs/p00/` changes across the P08
acceptance act were **additive** (`P00_DECISION_LOG.md` §40, +43/−0; `P00_GATE_MODEL.md` block,
+26/−0). **No methodology was silently changed.**

⚠ **Disclosed at acceptance (`ec2349f` §10), restated here for the record:** **three governance
guards were RESCOPED + TIGHTENED**, never weakened — the `p05/tests/existing-iips-boundary.test.js`
P08 arm plus the two P08-01/P08-02 working-tree proxies. Each was **mutation-verified to still fail
closed** (stripped limitation statements, a second acceptance artifact, `p05/src`/`p07/src` edits,
and deletion of the acceptance record all still fail). ⚠ A `PHASE_08_`-prefixed filename would have
slipped past the old regex silently; **that evasion was rejected and the guard corrected instead.**

## 9. Branch discipline — ⚠ **DISCREPANCY UNRESOLVED**

| Ref | SHA | Disposition |
|---|---|---|
| `arena/01a0853d-iips-production-market-data` | **`ec2349f`** | ✅ **implementation lineage — authoritative** |
| `arena/01a0814b-iips-production-market-data` | `07ad52f` | ⚠ *"D10: P08 entry/dependency assessment"* — **NOT** in this lineage; divergent |
| `arena/01a0853c-iips-production-market-data` | `794c07c` | already an **ancestor** of this lineage |
| `arena/01a0853d` | `3c084bb` | stray |
| `main` | `eae2ff69` | **untouched** |

⚠ **Recorded as an UNRESOLVED OPERATIONAL ISSUE and deliberately NOT reconciled here.** `07ad52f` is
a real commit reachable only from `…01a0814b-…`; force-pushing would destroy it. **No force-push,
merge, rebase, delete or reconciliation** was performed by this or any preceding act. Reconciliation
requires its own authority decision.

## 10. Tests

| Package | Result |
|---|---|
| p05 | **264 / 264** |
| p06 | **113 / 113** |
| p07 | **159 / 159** |
| **p08** | **90 / 90** |
| **TOTAL** | # **626 / 626 PASS — 0 FAIL** |

---

## 11. ⚠ CHECKPOINT-04 grants NO authority

> **This checkpoint is a READ-ONLY reconciliation of state that already exists. It grants NO new
> implementation, acceptance, certification, designation or production-activation authority, and
> creates no precedent for any.**

It does **NOT**: authorize or begin **P09** · create a concessions register · resolve **AG-1**,
**AG-2**, **AD-17/M-2**, **ADR-02 §I.1**, **PIT durable persistence**, **F-2**, **F-5** or the
**branch-ref discrepancy** · alter **ADR-02**, P00 acceptance criteria or existing-IIPS · grant
certification · authorize production · designate any authority · rewrite any record.

## 12. State at CHECKPOINT-04

```
FORMAL GATES       = 9 of 18 ACCEPTED (P00…P08)
P08                = ACCEPTED    A3 = Sai (P08 gate only)
P09                = NOT_STARTED / NOT_AUTHORIZED / NOT_ACCEPTED
C7 · C3/C4/C11     = NOT_CERTIFIED
CERTIFICATION      = NONE_GRANTED
PRODUCTION         = NOT_AUTHORIZED
ADR-02 §I.1        = UNSATISFIED — existing-IIPS
AD-17 / M-2        = UNRESOLVED
AG-1 = OPEN (bounded)   AG-2 = OPEN / NON-BLOCKING
PIT durable persistence = OPEN / TRAVELLING FORWARD
SUITE              = 626/626
```

**Separately outstanding, each requiring its own authority act:** **P09 entry authorization** ·
**F-2** (optional D20 §9 amendment by addition) · **F-5** (ledger reconciliation, incl. the stale
`:17`/`:121` lines) · **branch-ref reconciliation** · **AD-17/M-2** and **ADR-02 §I.1**
(existing-IIPS) · **PIT durable persistence** · the **concessions-register defect**.

---

**Checkpoint recorded. Nothing implemented, accepted, certified, activated, authorized or resolved.**
