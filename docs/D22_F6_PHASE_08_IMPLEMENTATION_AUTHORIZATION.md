# D22 — F-6 — P08 IMPLEMENTATION AUTHORIZATION + GUARD RESCOPE

**Authority act + narrowly scoped guard rescope. Append-only.**
⚠ **This is NOT P08 implementation.** No P08 source was created · no acceptance · no
certification · no activation · no downstream authorization · no provider · no credentials.

| Field | Value |
|---|---|
| **Record** | **D22** — act **F-6** (required by `D21` §11) |
| **Baseline SHA** | **`dead55180e51dbf2f87642eb04a4c99a42d544fc`** ✅ verified |
| **Branch** | ✅ **`arena/01a0853d-iips-production-market-data`** |
| **Stray branch** | `arena/01a0853d` @ `3c084bb` — ⚠ **NOT modified, NOT deleted** |
| **Tree at start** | ✅ CLEAN |
| **Date** | 2026-09-12 |

---

# 1. DECISION

> # ✅ **F6-A — SELECTED**
> **P08 IMPLEMENTATION = AUTHORIZED, within the scope defined in §5.**
> **Narrowly scoped guard rescope = AUTHORIZED and applied (§7).**

```
P08 ENTRY          = AUTHORIZED
P08 IMPLEMENTATION = AUTHORIZED        (scope §5)
P08 ACCEPTANCE     = NOT_ACCEPTED
A3                 = NOT DESIGNATED
C7                 = NOT CERTIFIED
CERTIFICATION      = NONE_GRANTED
PRODUCTION         = NOT_AUTHORIZED
DOWNSTREAM (P09+)  = NOT_AUTHORIZED
```

⚠ **F6-A is NOT selected because entry was authorized.** The independent implementation
authority basis is stated at §4.1.

---

# 2. F-3 authorization evidence

`docs/D21_F3_PHASE_08_ENTRY_AUTHORIZATION_RERUN.md` @ `dead551`: **P08 ENTRY = AUTHORIZED**;
25/25 preconditions re-verified; **0 independent hard entry blockers**; and §7 of that record
identified precisely this act (**F-6**) as the prerequisite for any P08 code, *because* entry has
never carried implementation in this program.

# 3. Implementation-entry preconditions

| # | Precondition | State |
|---|---|---|
| 1 | P08 **ENTRY** authorized | ✅ D21 |
| 2 | Dependencies **{P06, P07}** accepted | ✅ both |
| 3 | **BL-3** resolved for P08 progression | ✅ D20/F-1 (R1-A) — ⚠ not reopened |
| 4 | P08 scope defined in an accepted artifact | ✅ `P00_GATE_MODEL`:45 (§5) |
| 5 | Identity contracts fixed | ✅ OI-08 **1:N** · OI-09 **FIGI/OpenFIGI** · OI-10 **`MD:` / `MD:<domain>.<field>`** — ⚠ none reopened |
| 6 | A guard-rescope mechanism with precedent | ✅ D10-2 (P06), `c91690b` + P07-01-A…04-A (P07) |
| 7 | Rescope expressible **without** weakening existing-IIPS protection | ✅ proven by mutation testing (§9) |
| 8 | New blocker since D21 | ✅ **NONE** |

## 3.1 Not preconditions — recorded so they are not silently promoted

**A3 designation**, **C7 certification**, **C3/C4/C11**, **provider selection**, **credentials**
and **P05-04** are *acceptance*- or *progression*-stage concerns, **not** implementation-entry
conditions. ⚠ **None is treated as satisfied**, and none is waived.

---

# 4. Authority basis

| Ground | Source |
|---|---|
| Entry authorized, and F-3 named F-6 as the required next act | `D21` §1, §11 |
| `P00_GATE_MODEL`:45 defines P08's objective and evidence — the scope exists in an **accepted** artifact | :45 |
| The gate model's `Impl. permitted now?` column is *"under the post-D8 state"* — a **state**, changeable by explicit act, not an immutable bar | :26 |
| **Programme precedent:** P06 implementation by **D10-2**; P07 by `c91690b` + P07-01-A…04-A — each an explicit act **plus** a guard rescope | guard header :138–:155 |
| Rule 1: *"an explicit acceptance act … silence, completion or clearance is never acceptance"* — ⚠ satisfied **negatively**: this act is explicit, and it is **not** acceptance | :63 |

## 4.1 ⚠ Why F6-A rather than F6-B or F6-C

**F6-B rejected:** the 8-point scan (§3) found no missing hard implementation prerequisite. The
open items are bounded/deferred, and promoting them to blockers is prohibited.

**F6-C rejected on evidence, not convenience:** a safe rescope *can* be defined — and was, using
the **existing** P06/P07 structural pattern rather than a new governance mechanism. ⚠ Had the
rescope required deleting an assertion, broadening a path rule, or touching the existing-IIPS
arms, **F6-C would have been the answer.** It did not: the surface is **net enlarged** (§8).

---

# 5. P08 implementation scope — explicit

**Objective** (`P00_GATE_MODEL`:45, verbatim): *"Historical/PIT gate — Historical and PIT
semantics; adjusted/unadjusted series"*. Minimum evidence: *"ADR-02 evidence: byte-identical
golden replay; vintage ambiguity detection"*.

| Dimension | Authorized | Prohibited |
|---|---|---|
| **Repository areas** | `p08/src/`, `p08/tests/`, `p08/package.json`; governance records `docs/D*_PHASE_08_*` / `PHASE_08_*` | ⛔ `docs/p08/` · ⛔ any `p05/`,`p06/`,`p07/` source change · ⛔ `iips-review-recovered` · ⛔ any existing-IIPS path |
| **Executable/source** | Pure, deterministic historical/PIT logic; adjusted/unadjusted series semantics; vintage ambiguity detection | ⛔ **disk persistence** (`writeFileSync`/`mkdirSync`/`createWriteStream`) · ⛔ **network acquisition** · ⛔ **`process.env.` credential reads** |
| **Tests** | `p08/tests/**` unit/contract tests, node:test, in-memory | ⛔ tests asserting acceptance, certification or activation |
| **Docs/evidence** | Work-item evidence records under the `PHASE_08_` prefix | ⛔ `P08_GATE_ACCEPTANCE.md` (any path) |
| **Provider / live data** | ⛔ **NONE.** No provider selected; entitlement matrix EMPTY | ⛔ live acquisition, licensed acquisition, provider selection |
| **Credentials** | ⛔ **NONE** | ⛔ secrets, env vars, vendor/secret-manager selection |
| **Contracts** | Must remain **within accepted P01–P07 contracts and the P04 identity model** | ⛔ new version axis (six only) · ⛔ conflating `data-${provider}-${dataVersion}-${asOf}` with `SNAP_*` · ⛔ provider-native shape leakage · ⛔ new engine metric key |
| **Certification** | ⛔ none — C3/C4/C11 remain future **A2** acts | ⛔ representing implementation evidence as certification evidence |
| **Production activation** | ⛔ **NOT_AUTHORIZED** (A4, P16 only) | — |
| **Downstream** | ⛔ **P09–P17 NOT AUTHORIZED** | — |

⚠ **Bounded conditions bind the implementation:** **DEP-P01-04** — P08 must *produce* the
historical series-structure decision, **not default it from P05-01**; **PIT-6** — P08 may **not**
cite P05 acceptance as PIT evidence; **BD-13** — P08 may **not** rely on **P05-04**
(`NOT_AUTHORIZED`) as ingestion evidence; **AD-17/M-2** — replay firewall preserved, **P08 may
not repair it**; **D04** corporate actions, **OI-P04-03** (IB-1…IB-5), **OI-P04-04**, **M-1/AD-4**,
**Act 6/O-8** all remain open and unwaived.

---

# 6. Guard — behaviour BEFORE this act

`p05/tests/existing-iips-boundary.test.js`, test at **:157** (live line numbers verified, not
assumed):

| Line | Assertion |
|---|---|
| :159 | `docs/p08` must not exist |
| :160–161 | **no tracked file matching `/P08[_-]/`** |
| :162–164 | `p05/src/localFeed.js` + `src/replay.js` must contain *"PIT storage is P08"* — *"P08 ownership is declared, not implemented"* |

⚠ Clause :160–161 makes **any** P08 implementation file uncommittable. It is the operative bar.

# 7. Guard rescope — design and exact change

**One file changed: `p05/tests/existing-iips-boundary.test.js`** (the P08 arm only).

| # | Clause | Status |
|---|---|---|
| **(a)** | `docs/p08` must not exist | ✅ **UNCHANGED** — P08 governance uses the `PHASE_08_` prefix |
| **(b)** | ⚠ **NEW** — no `P08_GATE_ACCEPTANCE` artifact may be tracked, anywhere | 🔒 **TIGHTENED** — the D10-6 tripwire applied to P08; makes silent P08 acceptance uncommittable |
| **(c)** | `p08/src/**` permitted, but **no disk persistence** and ⚠ **no network/credential access** | 🔒 **TIGHTENED** beyond the P07 analogue, which bars persistence only |
| **(d)** | If this record exists it must assert `NOT_ACCEPTED`, `NONE_GRANTED`, `NOT CERTIFIED` | 🔒 **NEW** content binding |
| **(e)** | ⚠ **NEW** — no `p09/`…`p17/` source and no `P09–P17` acceptance artifact may be tracked | 🔒 **NEW BAR — no equivalent existed before** |
| **(f)** | *"PIT storage is P08"* declaration in P05 | ✅ **UNCHANGED** |

**Only the blanket `/P08[_-]/` ban (:160–161) was replaced** — by (b)+(c)+(d), which bind
*content*, where an absence check could say nothing.

**Requirements 1–7 of the instruction:** explicit ✅ · narrow to P08 ✅ · new-program repo only ✅
· fail-closed for existing-IIPS ✅ (those arms untouched — §8) · cannot authorize P09+ ✅ (clause
(e) **forbids** it) · cannot weaken P00–P07 boundaries ✅ (§8) · auditable/reversible ✅ (disclosed
in-code correction naming F-6/D22, per precedent).

# 8. Precedent comparison, and boundaries retained

| | **P06 (D10-2)** | **P07 (`c91690b`)** | **P08 (F-6, this act)** |
|---|---|---|---|
| Trigger | Explicit authorization act | Explicit authorization act | Explicit authorization act |
| Pattern | Disclosed in-code correction, ban → prefix allow-list | Disclosed correction, ban → scoped source allow + no-persistence | ⚠ **Same pattern reused — no new governance mechanism invented** |
| Acceptance tripwire | Retained, then rescoped to exactly one artifact | `P07_GATE_ACCEPTANCE` barred | **`P08_GATE_ACCEPTANCE` barred** |
| Net effect | Tightened | Tightened | **Tightened + new downstream bar** |

**Untouched and still passing:** no existing-IIPS executable source · no methodology/scoring/
calibration source · **AD-17 replay firewall** · P05-01 makes no certification/activation/E2E-030
claim · certified CSIP boundary · sector taxonomy · no new engine metric key · accepted **P00–P04**
gate records unmodified · **CHECKPOINT-03 / D8_STATUS** unmodified · tracker XLSX / SPEC DOCX
unmodified · P06/P07 arms unmodified.

⚠ **No assertion was deleted. No path rule was broadened. No existing-IIPS file is newly permitted.**

# 9. Guard validation — mutation-tested, not asserted

Full suite: **536/536 PASS** (P05 **264** · P06 113 · P07 159).

| # | Mutation | Expected | Observed |
|---|---|---|---|
| M1 | create `docs/p08` | FAIL | ✅ 263/**1 fail** |
| M2 | track `P08_GATE_ACCEPTANCE.md` | FAIL | ✅ 263/**1 fail** |
| M3 | `p08/src` writes to disk | FAIL | ✅ 263/**1 fail** |
| M4 | `p08/src` reads `process.env` | FAIL | ✅ 263/**1 fail** |
| M5 | clean pure `p08/src` module | **PASS** | ✅ 264/0 — **P08 explicitly allowed** |
| M6 | track `p09/src/a.js` | FAIL | ✅ 261/**3 fail** — P09+ disallowed |

All mutations reverted; tree restored. ⚠ **No P08 source was retained** — M5's file was removed.

---

# 10. Certification firewall

> **C7 = NOT CERTIFIED · P07 certification = NONE_GRANTED · P08 certification = NONE_GRANTED.**

⚠ Implementation authorization **implies no certification whatsoever**. **C3/C4/C11** remain
future **A2** acts, and A2's designation is recorded as *scoped to P07* — extension to P08 is
**NOT determined**. ⚠ **P08 implementation evidence must NEVER be represented as certification
evidence.** The A2 withhold is **intact**, except the single `:96` clause superseded by F-1 for
P08 progression only; ⚠ **the A2 record was not modified and F-1 was not reopened.**

# 11. A3 / acceptance

> **P08 A3 ACCEPTOR = NOT DESIGNATED.** ⚠ Not designated, inferred or implied by this act — not
> from A2 (Sai), the P07 A3 (Sai) or the P06 A3 (Ramki).

**F-4 remains a future acceptance prerequisite.** Guard clause (b) now enforces it mechanically.

# 12. Explicit non-decisions

Does **NOT**: implement P08 · create P08 source (⚠ **none exists**) · accept P08 · certify P08
or C7 · grant P07 certification · authorize P09–P17 · authorize production activation · designate
A3/A2/A4 · authorize provider selection, licensed acquisition, credentials or secrets · resolve
**BD-1…BD-13** (all preserved) · reopen **OI-08/09/10**, **F-1** or the A2 withhold · alter
**ADR-01 C1–C6** · modify the gate model, certification matrix, A2 record, P00–P07 acceptance
records, P04 artifacts, **D17–D21** · modify existing-IIPS · correct the stale `P08.state` or the
OI-10 register contradiction (D21 §3.1) · touch the stray branch · merge to `main`.

# 13. Next separately authorized act

> ## **P08-01 — the first P08 work item: implementation + tests, within §5.**

⚠ It requires its own work-package act. **F-4** (P08 A3) remains outstanding and blocks future
acceptance; **F-2** and **F-5** remain recorded.

**⚠ STOP AFTER F-6. P08 implementation is NOT begun in this run.**

---

**D22 — F-6. DECISION: ✅ F6-A. P08 IMPLEMENTATION = AUTHORIZED (scope §5); guard RESCOPED and net-TIGHTENED.**
**ACCEPTANCE = NOT_ACCEPTED · A3 = NOT DESIGNATED · C7 = NOT CERTIFIED · CERTIFICATION = NONE_GRANTED · PRODUCTION = NOT_AUTHORIZED · DOWNSTREAM = NOT_AUTHORIZED.**
