# **P08 — Historical/PIT gate — is ACCEPTED.**

> **ACT TYPE:** **Explicit A3 formal gate-acceptance act.**
> **A3 acceptor: Sai** — designated for the **P08 gate only** (`7e3f61b`, `P00_DECISION_LOG.md` §39).
> ⛔ **ACCEPTANCE IS NOT CERTIFICATION. NOT ACTIVATION. NOT P09 AUTHORIZATION.**
> **Append-only. Rewrites no historical or accepted record.**

| Field | Value |
|---|---|
| **Decision** | # **✅ ACCEPT — P08 IS ACCEPTED AS A UNIFIED GATE** |
| **A3 acceptor** | **Sai** — scope **P08 gate only**; not extended from D10-3 (P06), §7 (P05) or §27/O-5 (P07); **A2 ≠ A3** |
| **Pinned baseline** | **`4836c82288b2985a0db1f110c6ef9ef5114ee9f0`** (D25) |
| **Scope accepted** | **P08-01** PIT storage model · **P08-02** corporate-action ingestion · **P08-03** adjusted/unadjusted series + reconciliation — the complete tracker scope; **no fourth P08 work item exists** |
| **Suite** | **626/626 PASS** — p05 264 · p06 113 · p07 159 · **p08 90** |
| **Date** | 2026-09-12 |

---

## 1. Acceptance requirements (`P00_GATE_MODEL.md`:61-67)

| # | Requirement | Finding |
|---|---|---|
| **1** | An **explicit acceptance act** is recorded | ✅ **This record.** Not silence, completion or clearance |
| **2** | **Minimum evidence** exists and is cited | ✅ §2–§3 below (as scoped by **D25**) |
| **3** | **Upstream phases accepted** | ✅ **P06 ACCEPTED** (`P06_GATE_ACCEPTANCE.md`, D10-3/D12) · **P07 ACCEPTED** (`P00_DECISION_LOG.md` **§36**, `PHASE_07_OVERALL_ACCEPTANCE.md`, 15/15, 79/79). ⚠ See §8 documentation debt |
| **4** | Open items **resolved or explicitly conceded** | ✅ **No concession required** — §6 |
| **5** | **Certification, where required, has occurred** — *"authority clearance is not certification"* | ⚠ **Certification has NOT occurred and is NOT granted.** Rule 5 governs **progression**, not acceptance — §7 |
| **6** | A3 clearance **does not pre-accept** the gate | ✅ Designation (`7e3f61b`) and this acceptance are **separate acts** |

---

## 2. Minimum evidence — `P00_GATE_MODEL.md`:45

Required: *"**ADR-02 evidence: byte-identical golden replay; vintage ambiguity detection**"*.

### 2.1 ADR-02 — as scoped by **D25**

**D25** (`4836c82`) adjudicated **B-P08-1**: **ADR-02 §I.1 is an existing-IIPS replay-surface
obligation, NOT a P08-local acceptance obligation** — `contributingData` is a field on the **engine
`Snapshot`** (`ADR-02` §C.2:83), with `contributingData` **empty** the extension is **inert**
(`ADR-02`:108), and **§G** states *"This program's authority: **None over this decision**."*

> ⚠ **ADR-02 §I.1 REMAINS AN UNSATISFIED EXISTING-IIPS OBLIGATION.** It is **not** satisfied, **not**
> waived and **not** transferred to P08 by this acceptance. ⚠ **No existing-IIPS golden replay
> evidence is fabricated, cited or implied.**

**P08-local obligations — §I.2, §I.3, §I.4 — all independently evidenced (executed):**

| ADR-02 | Evidence |
|---|---|
| **§I.2** distinct identities per vintage | ✅ `data-fixture-1.0-2024-01-02…` ≠ `data-fixture-2.0-2024-01-02…` (dataVersion) and ≠ `…2024-02-02…` (asOf) |
| **§I.3** determinism, deterministic serialization | ✅ repeated full rebuilds byte-identical — sha256 `14a5bc71…` (5/5), projection `f888f1ba…` (3/3) |
| **§I.4** `data-*` format unchanged | ✅ `data-${provider}-${dataVersion}-${asOf}` preserved. ⚠ `SNAP_*` untouched, out of P08 scope |

⚠ These are **deterministic projections over in-code fixtures** — they are **NOT** a replay of
existing golden executions, and are **not presented as one**.

### 2.2 Vintage ambiguity detection — ✅ **SATISFIED (fail-closed)**

```
conflicting same-asOf payload  -> REJECTED, code PS-E9   (rejected at admission)
post-hoc detectVintageAmbiguity() -> []                  (unreachable by construction)
idempotent re-append of identical bar -> size 1
```

⚠ **Explicitly documented, as required:** conflicting same-`asOf` payloads are **rejected at
admission**, so a conflicting vintage is **never stored**. The post-hoc detector therefore being
**unreachable by construction is INTENTIONAL**, not a defect or dead code — the requirement is met
by **prevention**, which is **stricter** than after-the-fact reporting. ⚠ The empty array must not
be read as "no ambiguity detected".

---

## 3. PIT storage / repeatability — the P05 **PIT-6** obligation

P05 **PIT-6**: *"The obligation travels forward, undischarged … **P08 may not cite P05 acceptance
as evidence that PIT is handled**."* **B-2**: *"**NOT satisfied by snapshot-level repeatability,
replay idempotency, or deterministic re-runs, none of which is point-in-time.**"*

**Executed — a true point-in-time test, not a deterministic re-run:**

```
as-of 2024-01-15 answer BEFORE later knowledge  = f61d4d62035f67f1
  → appended a 2024-03-01 bar AND ingested a corporate action (factor 0.5)
as-of 2024-01-15 answer AFTER  later knowledge  = f61d4d62035f67f1   (STABLE)
prior vintage unrewritten (close still 100)     = true
deterministic identity: data-fixture-1.0-2024-01-02T00:00:00.000Z
```

| Required evidence | Finding |
|---|---|
| Historical/as-of retrieval | ✅ strict `<=` boundary, as-knowable semantics |
| Later-arriving knowledge does not rewrite prior vintages | ✅ verified |
| Corporate-action arrival does not rewrite stored history | ✅ verified — adjustment is a **read-side projection**; the store is byte-identical after projection |
| Reproducibility of a prior as-of answer | ✅ identical digest before/after |
| Deterministic identity/version semantics | ✅ `data-${provider}-${dataVersion}-${asOf}`; six version axes preserved |

⚠ **(a) vs (b) — the distinction is held, not blurred:**

- **(a) Discharged by P08:** point-in-time **semantics** — as-of retrieval, immutability of prior
  vintages under later knowledge, and reproducibility of a historical answer. This satisfies B-2's
  own test, which the evidence meets rather than evades.
- **(b) NOT discharged, NOT owned by P08:** **durable production persistence** — repeatability
  across process and storage lifetimes. The store is **in-memory by mandate**: F-6/`D22` §5
  **prohibits** disk persistence, and *"PIT **storage** remains a designed capability, not an
  authorized side effect, until its own separate act."*

> ⚠ **An in-memory proof is NOT upgraded into durable production persistence.** The accepted corpus
> does not require durable persistence for P08 acceptance — it **forbids** it absent a separate act.
> **The durable-persistence obligation remains OPEN and travels forward, undischarged.**

---

## 4. AG-1 — `actionType` taxonomy — **OPEN / DEFERRED / NON-BLOCKING**

```
ACTION_TYPES = ["dividend","split","bonus"]
dividend/split/bonus ACCEPTED · rights/merger/spinoff REJECTED CA-E2
```

`P01_FIELD_DICTIONARY.md`:120 declares `actionType` an `enum` with **no enumerated values**. P08-02
bounds it to the three tracker-named values and **fails closed**; it does not coerce or widen.

**Finding: AG-1 remains OPEN as a bounded, deferred authority gap — NOT an acceptance blocker.** The
gate requires D04 corporate-action ingestion with effective dating, which the bounded vocabulary
fully serves. Widening requires a **P01 amendment**, not a P08 change. ⚠ **No action type invented;
"other approved actions" is never an executable value.**

## 5. AG-2 — adjustment methodology — **OPEN / NON-BLOCKING (correctly classified)**

| Check | Result |
|---|---|
| Declared `adjustmentFactor` consumed **verbatim** | ✅ `0.5` in → `0.5` used; `factorDerived: false` |
| Factor derived from `ratio` | ⛔ **NO** — `ratio: 2` present, factor absent ⇒ refusal `AS-E3` |
| Rounding/precision methodology invented | ⛔ **NO** — factor `1/3` passes through unrounded |
| Ordering / cumulative methodology invented | ⛔ **NO** |
| Multi-action composition rejected | ✅ `AS-E6` |
| `adjustmentBasisRef` (L-11) on adjusted output | ✅ deterministic, derived from CA evidence |
| D02 adjusted-vs-unadjusted flag | ✅ on series **and** every bar; unadjusted bars untouched |
| Mutation tests (derive-from-ratio · mutate vintage · drop flag+provenance · allow composition) | ✅ **4/4 killed** |

Satisfies `P01_SCHEMA_CATALOG.md` D02: *"adjustment factors are **evidence-bearing, never silently
applied**."* **AG-2 correctly remains OPEN / NON-BLOCKING** — no methodology invented.

## 5.1 P04 lifecycle boundary · P07-03 dependency · scope firewall

- **P04 (§5 of the review mandate):** consumes the **five-value** `lifecycleStatus` from the
  **P04-03 specification**; declares `executableP04ServiceProvided: false`; computes **no**
  transitions; adds no sixth timestamp (ED-7/INV-5); `asOf`/`effectiveDate`/`effectiveTime`/
  `exDate`/`recordDate`/`payDate` kept distinct. ⚠ **No executable P04-03 lifecycle service is
  claimed to exist.**
- **P07-03 (§6):** **ACCEPTED** (`PHASE_07_OVERALL_ACCEPTANCE.md`:28, `e302a4d`/`28d862b`, 18/18;
  ledger 44/44/0; re-executed **44 pass/0 fail**). P08-03 **imports** `DISPOSITION_TYPES` /
  `COMPARISON_DIMENSIONS` — consumed, **not duplicated, not modified**; `git diff` shows **zero**
  `p07/` changes; P07 methodology unaltered.
- **Scope firewall (§10):** **no** network/`fetch`/URLs · **no** `process.env.` · **no** credentials
  · **no** `writeFileSync`/`mkdirSync`/`createWriteStream` · **no** live provider acquisition ·
  **0** P09–P17 files · **0** existing-IIPS files tracked or modified · **no** methodology
  alteration · `docs/p08/` absent.

---

## 6. Concessions register — **NO CONCESSION IS REQUIRED OR RECORDED**

Rule 4 requires open items **"blocking that phase"** to be resolved or conceded.

⚠ **No concessions register exists, none is created, and no concessions authority is invented.**

**Determination — no current P08 acceptance criterion requires a concession entry:**

| Open item | Why no concession is needed |
|---|---|
| **AG-1** | Bounded and **non-blocking** (§4) — rule 4 reaches only *blocking* items |
| **AG-2** | **Non-blocking** (§5); refusal paths keep the gap visible |
| **PIT durable persistence** | **Not owned by P08** and **prohibited** by F-6 absent a separate act (§3) |
| **ADR-02 §I.1** | **Not a P08 obligation** per **D25** (§2.1) |

⚠ **This is the exact mechanism the accepted corpus already exercises** — **P05 was ACCEPTED with
PIT repeatability recorded as `MISSING / NOT DEMONSTRATED` and *no* concession** (`P05_GATE_
ACCEPTANCE.md` **PIT-7**, **NG-14**: *"The limitation is recorded by **this acceptance record
itself**"*), and **P06** followed it (*"No concessions register exists and **none was required**"*,
:119). ⚠ **P08's PIT evidence is strictly STRONGER than the P05 state that was accepted** — P05 had
no demonstration at all; P08 demonstrates point-in-time semantics (§3).

**Acceptance is therefore established WITHOUT invoking the concessions mechanism.** ⚠ The corpus
defect — rule 4 citing a register that was never created — is **recorded, not cured**.

---

## 7. Certification / progression — **DISTINCT AND UNCHANGED**

| State | Value |
|---|---|
| **P08 acceptance** | ✅ **ACCEPTED** (this act) |
| **C7** | ⛔ **NOT CERTIFIED** |
| **C3 / C4 / C11** | ⛔ **NOT CERTIFIED** — owner *"A2 — UNKNOWN"* (`ADR-02` §F; `D4_11`:41-42) |
| **Overall certification** | ⛔ **NONE_GRANTED** |
| **Production activation** | ⛔ **NOT_AUTHORIZED** (A4, at P16 only) |
| **P09–P17** | ⛔ **NOT_AUTHORIZED** |

⚠ **Acceptance grants NO certification.** Rule 5 concerns *"Cert. **before progression**"* — it
gates **progression to the next phase**, not the acceptance of this one. ⚠ This follows the
**accepted P07 precedent exactly**: P07 was **ACCEPTED** (§36) while its certification was
**WITHHELD** and **C7 NOT ESTABLISHED** (§38). ⚠ **No certification is inferred from A3 acceptance
authority**, and **A2 ≠ A3**.

---

## 8. Preserved, and expressly NOT resolved by this acceptance

| Item | State |
|---|---|
| **ADR-02 §I.1** | # **UNSATISFIED — existing-IIPS obligation** (D25) |
| **AD-17 / M-2** | # **UNRESOLVED** — `ReplayService` literal returns; ⚠ not repaired, reinterpreted or weakened |
| **AG-1 · AG-2** | **OPEN** (bounded / non-blocking) |
| **PIT durable persistence** | **OPEN**, travels forward undischarged |
| **F-2 · F-5 · branch-ref discrepancy** | **UNTOUCHED**, separately outstanding |
| **Concessions-register corpus defect** | **RECORDED, not cured** |
| **M-1/AD-4 · M-5 · M-6 · Act 6 · OI-P04-03/04 · OI-05/06 · CD-01** | **UNCHANGED** |
| **OI-08 1:N · OI-09 FIGI · OI-10 `MD:<domain>.<field>` · ADR-01 C1–C6 · six version axes · four quality states · AD-1** | **PRESERVED** |
| **BD-1…BD-13** | Preserved (BD-11 discharged at `7e3f61b`) |
| ⚠ **Documentation debt** | `P00_GATE_MODEL.md`:17 and :121 still read *"P07–P17 remain NOT ACCEPTED"* — **stale as to P07**, which was accepted by **§36**. Left **unedited** as the record of their own moment; corrected **by addition** in the ledger. **P08's own status is recorded additively below** |

## 9. Changes made by this act

| File | Change |
|---|---|
| `docs/PHASE_08_GATE_ACCEPTANCE.md` | **NEW** — this record (canonical path; `docs/p08/` remains prohibited) |
| `docs/p00/P00_DECISION_LOG.md` | **§40 appended** |
| `docs/p00/P00_GATE_MODEL.md` | **Appended** current-state block — no historical line edited |
| `p05/tests/existing-iips-boundary.test.js` | ⚠ **ONE guard clause RESCOPED + TIGHTENED, disclosed** — see §10 |

⚠ **Zero P08 source or test changes. Zero `p05/src`, `p06/`, `p07/` changes. Zero existing-IIPS
changes. No accepted P00–P07 artifact rewritten. D25, F4-B and F4A byte-identical.**

## 10. ⚠ Disclosed guard rescope — **REPLACED, NOT WEAKENED**

`p05/tests/existing-iips-boundary.test.js` clause **(b)** asserted that **no** P08 gate-acceptance
artifact may exist, *"because P08 acceptance is NOT_ACCEPTED and **A3 is NOT DESIGNATED**"*. Both
stated premises have since changed by **explicit authority acts**: A3 was designated (`7e3f61b`) and
this acceptance act is precisely the **non-silent event the tripwire existed to force**.

Following the **P06 precedent in this same file** (*"RESCOPED to admit exactly that one artifact —
and TIGHTENED"*), the clause now admits **exactly one** acceptance artifact at **one canonical
path** and additionally requires that **this record itself** carry every limitation the old clause
protected by absence: acceptance ≠ certification · certification `NONE_GRANTED` · C7 `NOT_CERTIFIED`
· production `NOT_AUTHORIZED` · P09–P17 `NOT_AUTHORIZED` · **ADR-02 §I.1 unsatisfied (existing-IIPS)**
· **AD-17/M-2 unresolved** · A3 named as **Sai**.

⚠ **NOTHING IS DELETED FROM THE PROTECTIVE SURFACE**; a silent or unauthorized P08 acceptance remains
impossible to commit, and the guard is now **stronger** because content assertions bind where an
absence check could say nothing. ⚠ **The `docs/p08/` ban (clause a) and every other clause are
untouched.** ⚠ A `PHASE_08_`-prefixed name would have slipped past the old regex unnoticed — that
evasion was **rejected**; the guard was corrected instead.

---

## 11. Final state

```
P08                  = ACCEPTED          A3 = Sai (P08 gate only)
P08 CERTIFICATION    = NONE_GRANTED      C7 = NOT_CERTIFIED
CERTIFICATION        = NONE_GRANTED      PRODUCTION = NOT_AUTHORIZED
P09–P17              = NOT_AUTHORIZED
ADR-02 §I.1          = UNSATISFIED — existing-IIPS obligation
AD-17 / M-2          = UNRESOLVED
AG-1 = OPEN (bounded)     AG-2 = OPEN / NON-BLOCKING
PIT durable persistence  = OPEN, travels forward
```

**Acceptance performed. No certification. No activation. No P09 authorization. No dependency
weakened, reordered or bypassed. No evidence invented.**
