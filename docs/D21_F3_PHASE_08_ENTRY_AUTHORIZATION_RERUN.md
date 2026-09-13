# D21 — F-3 — P08 ENTRY AUTHORIZATION RE-RUN (POST-F-1 BL-3 RESOLUTION)

**Entry-authorization act only.** No implementation · no acceptance · no certification ·
no activation · no downstream authorization · no source change.

> ⚠ **Filename uses the mandatory `PHASE_08_`-free `D21_F3_PHASE_08_` form.** A `P08_`-prefixed
> name is barred by the standing guard `p05/tests/existing-iips-boundary.test.js`:160–161
> (`/P08[_-]/`). ⚠ **The guard was NOT modified.**

| Field | Value |
|---|---|
| **Record** | **D21** — act **F-3** (required by `D20` §15) |
| **Baseline SHA** | **`7f7465090d4dc92d4c979883fc915c59b6bf9a0a`** ✅ **verified — matches the instruction** |
| **Branch** | **`arena/01a0853d-iips-production-market-data`** *(local working ref `p08adj`)* |
| **Tree cleanliness** | ✅ **CLEAN** at start — `git status --porcelain` empty |
| **Authoritative basis** | **D20 / F-1 → R1-A** |
| **Date** | 2026-09-12 |

## ⚠ 0.1 Correction to the instruction's branch labelling — recorded, not acted on

The instruction identifies `arena/01a0853d-iips-production-market-data` as *"the stray branch …
at the older erroneous state."* **That is inverted.** Verified by `git ls-remote`:

| Ref | SHA | Actual role |
|---|---|---|
| `arena/01a0853d-iips-production-market-data` | **`7f74650`** | ✅ **The correct session branch, at the authoritative HEAD** |
| `arena/01a0853d` | `3c084bb` | ⚠ **The stray branch** (my earlier mispush), at the older state |

⚠ The instruction's own required baseline (`7f74650`) is carried **only** by the full-name
branch, so the two directives are reconciled by using it. **The stray `arena/01a0853d` was NOT
modified and NOT deleted**, per instruction.

---

# 1. DECISION

> # ✅ **P08 ENTRY = AUTHORIZED**

```
P08 ENTRY                = AUTHORIZED
P08 IMPLEMENTATION       = NOT AUTHORIZED BY THIS ACT   ⚠ see §7
P08 ACCEPTANCE           = NOT_ACCEPTED
P08 A3 ACCEPTOR          = NOT DESIGNATED
C7 CERTIFICATION         = NOT CERTIFIED
P07 CERTIFICATION        = NONE_GRANTED
P08 CERTIFICATION        = NONE_GRANTED
PRODUCTION ACTIVATION    = NOT_AUTHORIZED
BL-3                     = RESOLVED FOR P08 PROGRESSION (D20/F-1, R1-A)
```

⚠ **This authorizes ENTRY ONLY.** See §7 for why implementation is *not* carried by it — this is
a deliberate departure from the instruction's optional phrasing, on evidence.

---

# 2. P08 dependency graph — independently re-verified

`docs/d8/D8_STATUS.json`:202–208 (read at this baseline, not copied from D17/D18):

```json
"P08": { "title": "Historical/PIT",
         "state": "AUTHORITY_UNBLOCKED_AWAITING_UPSTREAM",
         "depends_on": ["P06", "P07"] }
```

Concurring: `P00_GATE_MODEL.md`:45 → P08 upstream deps = **P06, P07**.

| Dependency | State | Evidence |
|---|---|---|
| **P06** | ✅ **ACCEPTED** | `docs/p06/P06_GATE_ACCEPTANCE.md`; gate-model :43 *"ACCEPTED by an explicit A3 act"*, acceptor Ramki, baseline `3f79e61`, 113 tests |
| **P07** | ✅ **ACCEPTED / ESTABLISHED** | `docs/PHASE_07_OVERALL_ACCEPTANCE.md`, Sai, 15/15 |

⚠ **P05 is not a direct P08 dependency** — confirmed again; it enters only transitively via P06.
⚠ `P08.state` still reads `AUTHORITY_UNBLOCKED_AWAITING_UPSTREAM` — **stale after this act**;
recorded as documentation debt, **not corrected here**.

---

# 3. Entry-precondition matrix — all 25 checks, independently re-run

| # | Precondition | Finding | Evidence | Entry impact |
|---|---|---|---|---|
| 1 | **P06 = ACCEPTED** | ✅ YES | `P06_GATE_ACCEPTANCE.md`; `P00_GATE_MODEL`:43 | PASS |
| 2 | **P07 = ACCEPTED/ESTABLISHED** | ✅ YES | `PHASE_07_OVERALL_ACCEPTANCE.md` | PASS |
| 3 | **P07-01…04 ACCEPTED** | ✅ ALL FOUR | :26 `07d6d15`/15-15 · :27 `c8decf2`/22-22 · :28 `e302a4d`/18-18 · :29 `988a74c`/24-24 | PASS |
| 4 | **Dependency graph** | ✅ `{P06,P07}`, both satisfied | §2 | PASS |
| 5 | **OI-08** | ✅ **RESOLVED — 1:N** | `PROGRAM_STATE.md`:357 | PASS |
| 6 | **OI-09** | ✅ **RESOLVED — FIGI/OpenFIGI** | :359; `P00_DECISION_LOG`:1297–1309 | PASS |
| 7 | **OI-10 + exact token** | ✅ **RESOLVED — token `MD:`, form `MD:<domain>.<field>`** | `PROGRAM_STATE.md`:373 §6d, :417; `CHECKPOINT-03.md` §3 | PASS ⚠ see §3.1 |
| 8 | **P05 = ACCEPTED** | ✅ YES | `docs/p05/P05_GATE_ACCEPTANCE.md` | PASS (not a direct dep) |
| 9 | **P05-04 status** | ⚠ **`NOT_AUTHORIZED` / NO COMPLETION EVIDENCE** — inside the accepted gate; acceptance did **not** change its authorization state | `P05_GATE_ACCEPTANCE.md`:72, :123–:128 (R-13/R-14) | **NOT an entry blocker** — P05 is not a P08 dependency, and the gate model imposes no P05-04 precondition on P08. ⚠ **P08 may NOT rely on P05-04 as ingestion evidence** |
| 10 | **O-6** | ✅ RESOLVED (A2 = Sai) | `PHASE_07_O6_AUTHORITY_RECONCILIATION.md` (`2d28e42`); ⚠ cert record :110 qualifies *"PARTIALLY RESOLVED (A2 named; C7 open)"* | PASS |
| 11 | **Act 6** | 🔴 **OPEN — NO OWNER** | `PHASE_07_CERTIFICATION_DECISION.md`:112 | **Bounded**, not a gate-model entry requirement (display latency; P08 is historical/PIT) |
| 12 | **A2 designation** | ✅ **Sai**, C1–C12, ⚠ *scoped to P07* | `2d28e42` | PASS ⚠ extension to P08's C3/C4/C11 **NOT determined** |
| 13 | **C7 certification** | 🔴 **NOT CERTIFIED / NOT ESTABLISHED** | `PHASE_07_CERTIFICATION_DECISION.md`:42, :89 | **Not an entry blocker** — progression effect superseded for P08 only (D20 §11). ⚠ **C7 is NOT represented as certified anywhere in this act** |
| 14 | **AD-17 replay firewall** | ⚠ **UNRESOLVED — PRESERVED** | `P00_GATE_MODEL`:43 (P06 cell) | Bounded — ⚠ **P08 may NOT repair it** |
| 15 | **M-2 / certification boundary** | ⚠ Preserved | D18 §7 BD-1 | Bounded |
| 16 | **C3/C4/C11** (P08's own certs) | ⚠ **Required before P08 *progression*, not before entry** | `P00_GATE_MODEL`:27, :45 | **Not an entry blocker.** ⚠ Each needs a separate A2 act; A2's scope is recorded as P07 |
| 17 | **DEP-P01-04 / PIT-6** | ⚠ Preserved | D18 §7 BD-3/BD-4 | Bounded — ⚠ P08 must **produce** the historical series structure, not default it from P05-01, and may **not** cite P05 acceptance as PIT evidence |
| 18 | **D04 corporate actions** | ⚠ Preserved | D18 §7 BD-5 | Bounded |
| 19 | **OI-P04-03** | ⚠ **OPEN**, bounded IB-1…IB-5 | `P00_DECISION_LOG`:102 | Bounded — lifting needs an explicit **A1** act |
| 20 | **OI-P04-04** | ⚠ **OPEN** — FIGI sourcing/licensing/coverage | `P00_DECISION_LOG`:102; `PROGRAM_STATE`:266 | Bounded — ⚠ **not** resolved by OI-10 |
| 21 | **M-1 / AD-4** | ⚠ Preserved | D18 §7 BD-9 | Bounded — blocks **P15**, not P08 |
| 22 | **Provider / licensing / credentials** | 🔴 **No provider selected; entitlement matrix EMPTY** | `PROGRAM_STATE.md`:266 | **Not an entry blocker** — ⚠ but **licensed acquisition, provider selection and credentials remain NOT AUTHORIZED** |
| 23 | **New blocker after D20?** | ✅ **NONE** — only D18/D19/D20 land after `925926d`; no third-party commits | `git log 925926d..HEAD` | PASS |
| 24 | **Entry vs acceptance requirements** | ⚠ Distinguished — see §6 | rules 1–6, `P00_GATE_MODEL`:60–66 | PASS |
| 25 | **Repository governance guard** | ⚠ **ACTIVE and entry-relevant** — see §7 | `existing-iips-boundary.test.js`:158–164 | ⚠ **Constrains implementation, not entry** |

**Tally: hard entry blockers = 0. Bounded/deferred carried forward = 12. Procedural = 1 (A3).**

## 3.1 ⚠ Contradiction observed — recorded, NOT resolved

`docs/p00/P00_OPEN_ITEMS_REGISTER.md`:41 still describes `MD:<domain>.<field>` as *"an
**illustrative recommendation only**"*, contradicting `PROGRAM_STATE.md`:373 §6d (**OI-10
RESOLVED**) and `CHECKPOINT-03`. ⚠ This is **known stale documentation debt**, already on the
program's correct-by-addition list. The **authoritative** status is **RESOLVED, token `MD:`**.
⚠ **Not corrected here** (change boundary forbids touching P00 artifacts), and it is **not**
treated as a blocker.

---

# 4. Independent blocker scan (blockers NOT derived from BL-3)

| Candidate | Hard entry blocker? | Why |
|---|---|---|
| P06/P07 not accepted | ❌ NO | Both accepted |
| A P08 dependency unsatisfied | ❌ NO | `{P06,P07}` both ✅ |
| Identity decisions open (OI-08/09/10) | ❌ NO | All three resolved |
| P05-04 unauthorized | ❌ NO | Outside P08's dependency set (§3 #9) |
| C3/C4/C11 uncertified | ❌ NO | Progression-stage, not entry (`P00_GATE_MODEL`:27) |
| No provider / empty entitlement matrix | ❌ NO | Acquisition is not an entry precondition; remains unauthorized |
| Act 6 open | ❌ NO | Not a gate-model entry requirement |
| No A3 for P08 | ❌ NO | **Procedural — blocks ACCEPTANCE, not ENTRY** (rule 6) |
| Governance guard | ❌ NO **for entry** | ⚠ **YES for implementation** — §7 |
| Anything new since D20 | ❌ NO | §3 #23 |

> **Result: NO independent hard entry blocker exists.** ⚠ Bounded/deferred items were **not**
> promoted to blockers, per the standing rule.

---

# 5. BL-3 / F-1 treatment · C7 · the A2 withhold

**BL-3 = RESOLVED FOR P08 PROGRESSION**, by **D20/F-1 (R1-A)**. ⚠ **F-1 is treated as
authoritative and is NOT reopened**; no contradiction making execution impossible was found, and
**A2 is not reinterpreted again in this act.**

| Element | Status carried into this act |
|---|---|
| **C7** | 🔴 **NOT CERTIFIED / NOT ESTABLISHED** — ⚠ **explicitly not represented as certified** |
| **P07 certification (overall)** | ⛔ **NONE_GRANTED** — withheld |
| **C8** | ✅ CERTIFIED within P07 scope |
| **A2 withhold** | ✅ **INTACT**, except the single clause `:96` superseded by F-1 **for P08 progression only** |
| A2 record file | ✅ **byte-identical — not modified** |

⚠ This act relies on the F-1 supersession **only** to clear the P08 progression bar. It claims
nothing else from it, and extends it to **no other phase**.

---

# 6. Entry vs acceptance — states kept separate

⚠ **The gate model defines no explicit "consequence of entry authorization" clause** — searched;
it defines **acceptance** requirements (rules 1–6) and the *"Cert. before progression?"* column
only. **Therefore nothing is quoted and nothing is expanded.** The separation applied:

| State | Value now |
|---|---|
| **ENTRY ELIGIBILITY** | ✅ Established by F-1 |
| **ENTRY AUTHORIZATION** | ✅ **AUTHORIZED — by this act** |
| **IMPLEMENTATION** | ⛔ **NOT AUTHORIZED** (§7) |
| **ACCEPTANCE** | ⛔ **NOT_ACCEPTED** |
| **CERTIFICATION** | ⛔ **NONE_GRANTED** |
| **PRODUCTION ACTIVATION** | ⛔ **NOT_AUTHORIZED** (A4, P16 only) |

---

# 7. ⚠ Why IMPLEMENTATION is NOT authorized by this act

The instruction permitted implementation authorization only *"if explicitly stated as the
separate authorized consequence."* **It is not stated, and the corpus affirmatively cuts the
other way:**

1. **The active guard forbids P08 artifacts outright** — `existing-iips-boundary.test.js`:158–164:
   `docs/p08` must not exist; **no tracked file matching `/P08[_-]/`**; and
   `assert.match(text, /PIT storage is P08/, 'P08 ownership is declared, not implemented')`.
2. **Precedent:** P06 and P07 implementation each required an **explicit guard RESCOPE act**
   (D10-2 for P06; `c91690b` + P07-01-A…P07-04-A for P07), recorded in the guard's own header.
   ⚠ Entry authorization alone has **never** carried implementation in this program.
3. **D13 precedent:** P07 *entry* was authorized while *"P07 IMPLEMENTATION = NOT YET PERMITTED"*
   (`D13`:196) — entry and implementation were separate acts.

> ⚠ **Therefore P08 implementation requires a SEPARATE authorization act that also rescopes the
> guard.** ⚠ **I did not weaken, edit or stage any change to the guard** — it remains
> byte-identical, and I decline to treat entry authorization as implying a rescope.

---

# 8. F-4 — A3 status

> # **P08 A3 ACCEPTOR = NOT DESIGNATED**

Verified: no P08 A3 designation exists in the corpus. ⚠ **No A3 is created, inferred or implied
here** — not from A2 (Sai), not from the P07 A3 (Sai), not from the P06 A3 (Ramki); each
designation is scoped to its own gate.

**Effect:** does **not** prevent ENTRY (rule 6 — A3 clearance concerns the acceptance *process*);
**does** prevent any future **P08 GATE ACCEPTANCE**. **F-4 remains outstanding.**

---

# 9. Bounded / deferred conditions — ALL CARRIED FORWARD, NONE RESOLVED

**BD-1** AD-17/M-2 (P08 may not repair) · **BD-2** C3/C4/C11 separate certification acts, A2 scope = P07, extension undetermined · **BD-3** DEP-P01-04 not defaulted · **BD-4** PIT-6 · **BD-5** D04 corporate actions · **BD-6** provider/licensed execution (O-3 = NSE authorizes no execution) · **BD-7** OI-P04-03 IB-1…IB-5 · **BD-8** OI-P04-04 · **BD-9** M-1/AD-4 · **BD-10** Act 6 / O-8 · **BD-11/NB-1** no P08 A3 · **BD-12** P05 PIT repeatability not demonstrated · **BD-13** *(new)* **P05-04 `NOT_AUTHORIZED`** — P08 may not rely on it as ingestion evidence.

⚠ **None resolved, waived, reinterpreted or defaulted.**

---

# 10. Explicit non-decisions

This act does **NOT**: authorize P08 implementation (§7) · accept P08 · certify P08 · certify C7
· grant P07 certification · re-open or re-interpret the A2 withhold beyond F-1 · authorize P09,
P10, P11, P12 or P13 · promote any downstream gate · authorize production activation ·
designate any A2/A3/A4 authority · authorize provider selection, licensed acquisition,
credentials, secrets or entitlement · resolve OI-P04-03/04 · reopen OI-08/OI-09/OI-10 · alter
ADR-01 C1–C6 · modify `P00_GATE_MODEL.md`, the certification matrix, the A2 record, P00–P07
acceptance records, P04 artifacts, D17, D18, D19 or D20 · weaken the governance guard · correct
the OI-10 register contradiction (§3.1) or the stale `P08.state` (§2) · merge to `main` ·
modify the stray branch `arena/01a0853d`.

---

# 11. Required next act

| # | Act | Status |
|---|---|---|
| **F-3** | *This record.* | ✅ **COMPLETE** |
| **F-6** | ⚠ **P08 IMPLEMENTATION AUTHORIZATION — including an explicit guard RESCOPE** (§7). **The next separately authorized work act.** | **REQUIRED before any P08 code or artifact** |
| **F-4** | **Designate a P08 A3 acceptor** | Outstanding — blocks future acceptance |
| **F-2** | Optional durable R-3 amendment (D20 §9), by addition | Recommended |
| **F-5** | Ledger reconciliation (stale `P00_GATE_MODEL` counts, `P08.state`, OI-10 register §3.1), by addition | Outstanding |

⚠ **STOP after F-3. No P08 implementation is begun in this run.**

---

# 12. Validation

| Check | Result |
|---|---|
| Governance/test suite | ✅ **536/536 PASS** — P05 264 · P06 113 · P07 159 |
| Executable/source changed | ✅ **NO** |
| Existing-IIPS changed | ✅ **NO** |
| Accepted historical artifacts byte-identical | ✅ **YES** |
| P08 implementation files created | ✅ **NONE** |
| Tracked `/P08[_-]/` files | ✅ **0** — guard satisfied |
| Git status | ✅ clean apart from this record |
| Pushed to `main` | ✅ **NO** |

---

**D21 — F-3 P08 ENTRY AUTHORIZATION RE-RUN. DECISION: ✅ P08 ENTRY = AUTHORIZED.**
**IMPLEMENTATION NOT AUTHORIZED · ACCEPTANCE = NOT_ACCEPTED · A3 = NOT DESIGNATED ·
C7 = NOT CERTIFIED · CERTIFICATION = NONE_GRANTED · PRODUCTION ACTIVATION = NOT_AUTHORIZED.**
