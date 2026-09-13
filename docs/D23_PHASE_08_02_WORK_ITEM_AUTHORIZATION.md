# D23 — P08-02 WORK-ITEM AUTHORIZATION — CORPORATE-ACTION INGESTION

**Authorization act only. Append-only.**
⚠ **P08-02 is NOT implemented in this run.** No source · no tests · no P08-01 change · no
acceptance · no certification · no activation.

| Field | Value |
|---|---|
| **Record** | **D23** |
| **Act** | P08-02 work-item authorization |
| **Baseline SHA** | **`459b05b2bf34baf974231e96d69e33809d0aa122`** ✅ verified |
| **Branch** | ✅ **`arena/01a0853d-iips-production-market-data`** |
| **Stray branch** | `arena/01a0853d` @ `3c084bb` — ⚠ **NOT modified, NOT deleted** |
| **Authority chain** | F-1/**D20** (R1-A) → F-3/**D21** (entry) → F-6/**D22** (implementation + guard) → **P08-01** complete |
| **Date** | 2026-09-12 |

---

# 1. DECISION

> # ✅ **P08-02-A — SELECTED**
> ## **P08-02 IMPLEMENTATION = AUTHORIZED**, within the scope at §11 and the prohibitions at §12.

```
P08-02 IMPLEMENTATION = AUTHORIZED (scope §11)
P08-02 IMPLEMENTED    = NO — not begun in this run
P08 ACCEPTANCE        = NOT_ACCEPTED
A3                    = NOT DESIGNATED
C7                    = NOT CERTIFIED
CERTIFICATION         = NONE_GRANTED
PRODUCTION            = NOT_AUTHORIZED
P08-03                = NOT AUTHORIZED
```

⚠ **Not inferred from F-6.** §10 states the independent work-item basis, and §5 resolves the one
genuinely contested dependency (**P04-03**) on evidence rather than by assumption.

---

# 2. Branch / baseline / tree

HEAD `459b05b` ✅ · branch ✅ · working tree **CLEAN** at start · stray branch untouched.

# 3. P08-02 tracker definition — read from the authoritative XLSX, verbatim

| Column | Value |
|---|---|
| **Work ID** | **P08-02** · Phase **P08** · Area **Corporate Actions** |
| **Work Item** | **Corporate action ingestion** |
| **Requirement** | *"Dividends, splits, bonuses and other approved actions."* |
| **Deliverable** | *"CA pipeline"* |
| **Dependencies** | **`P04-03, P05, P06`** — Dependency Type **Hard** |
| **Entry Criteria** | *"Instrument lifecycle stable"* |
| **Exit Criteria** | *"Actions linked to instruments"* |
| **Test / Validation** | *"Scenario tests"* |
| **Evidence** | *"CA fixtures"* |
| **Authority / Gate** | *"Phase gate"* · Status **NOT STARTED** · Wave **W6** · Critical Path **YES** |
| **Parallelization** | *"Phase-gate dependency controls entry/exit; **no dependency bypass**"* |

⚠ **The summary in the instruction was incomplete** — it named only `P04-03`. The authoritative
dependency set is **`P04-03, P05, P06`**, and ⚠ **`P07-03` is NOT a P08-02 dependency** (it
belongs to **P08-03**). Verified in both `Work Tracker` and `Dependency Matrix`.

# 4. Dependency matrix — verified against live files

| Dependency | Tracker type | Live status | Sufficient for P08-02? |
|---|---|---|---|
| **P04-03** | Hard | ⚠ Tracker `Status = NOT STARTED`; deliverable **exists as accepted specification** — see §5 | ✅ **YES (case B)** |
| **P05** | Hard | ✅ **ACCEPTED** (`docs/p05/P05_GATE_ACCEPTANCE.md`) | ✅ YES ⚠ **P05-04 excluded** (§12) |
| **P06** | Hard | ✅ **ACCEPTED** (`docs/p06/P06_GATE_ACCEPTANCE.md`) | ✅ YES |
| P08-01 | implicit (PIT) | ✅ **COMPLETE** — `459b05b`, 25/25 | ✅ YES — §6 |
| P07-03 | ⚠ **NOT a P08-02 dependency** | (P08-03's dependency) | n/a — §7 |

# 5. ⚠ P04-03 — status and exact effect (the decisive question)

**Tracker `P04-03`:** *"Lifecycle/reference metadata — handle listings, delistings, exchange
metadata and instrument state"*; deps `P04-01`; entry *"Master exists"*; exit *"Historical
lifecycle reproducible"*; **Status `NOT STARTED`**.

**Live corpus:** `docs/p04/P04_LIFECYCLE_AND_EFFECTIVE_DATING.md` opens, verbatim:

> *"**SPECIFICATION ONLY.** Tracker deliverable **`P04-03`** — 'Lifecycle/reference metadata…',
> exit criterion 'Historical lifecycle reproducible'."*

and states the boundary itself:

> *"⚠ **P08 boundary.** `P08-02` (corporate-action ingestion) depends on **`P04-03`** with entry
> criterion *'Instrument lifecycle stable'*. P04 specifies lifecycle state and effective dating;
> **P08 owns corporate-action ingestion, adjustment logic and PIT storage.** **P04 specifies
> enough for P08 to consume, and no more.**"*

`P04_GATE_ACCEPTANCE.md` accepts P04 **as specification only** (§5, :109; :198 *"✅ ACCEPTED —
specification only"*), and `P04_LIFECYCLE…` §6 **LX-1** assigns *"Corporate-action ingestion
(dividends, splits, bonuses)"* to **P08 (`P08-02`)**.

> ## **Determination: CASE B — bounded/deferred but explicitly NON-BLOCKING for P08-02.**

| Ground | Evidence |
|---|---|
| The `P04-03` **deliverable exists** as an accepted artifact | `P04_LIFECYCLE_AND_EFFECTIVE_DATING.md` self-identifies as the P04-03 deliverable |
| The entry criterion *"Instrument lifecycle stable"* is met by a **stable specification** — the five-value `lifecycleStatus` enumeration is *"fixed … unchanged, none added"* | ibid. §2 |
| The authoritative artifact **itself** declares P04-03 sufficient for P08 consumption | *"specifies enough for P08 to consume, and no more"* |
| The same artifact **assigns** P08-02 to P08 | **LX-1** |

⚠ **I did NOT treat P04-03 as satisfied merely because P04 was accepted** — the instruction's
warning is exactly right, and P04's acceptance is **specification-only**. The finding rests on
the P04-03 artifact's own explicit P08 hand-off, not on the gate acceptance.

⚠ **Residual limitation, preserved not waived:** P04-03 is **specification, not executable**
(`OI-P04-05` executable validation remains **DEFERRED — NOT PASSED**). **P08-02 may therefore
consume the lifecycle *contract*, and may NOT claim an executable P04 lifecycle service exists.**

# 6. P08-01 dependency status

**COMPLETE** at `459b05b` (25/25). P08-02 will need corporate-action records represented in PIT.
The exact contract relationship, from `P01_SCHEMA_CATALOG.md` **D04**:

> **PIT? — "Yes. An adjustment applied today must not retroactively alter a past PIT result."**

⚠ **P08-01 must NOT be redesigned.** Its store is domain-agnostic (`domain` + `securityId` keyed)
and already admits `D04` snapshots, with vintage-ambiguity rejection providing exactly the
"no retroactive alteration" property. **Any P08-02 need must be met additively, or stopped and
recorded.**

# 7. P08-03 separation — explicit

| | P08-02 (authorized) | **P08-03 (NOT authorized)** |
|---|---|---|
| Work item | Corporate action **ingestion** | **Adjustment/reconciliation** |
| Requirement | *"Dividends, splits, bonuses and other approved actions"* | *"Define **adjusted/unadjusted series** and portfolio reconciliation behavior"* |
| Deliverable | CA pipeline | **Adjustment engine/rules** |
| Exit | *"Actions linked to instruments"* | *"Series and holdings reconcile"* |
| Deps | P04-03, P05, P06 | **P08-02, P07-03** |

> ⚠ **P08-02 MUST NOT silently absorb P08-03.** Ingesting an `adjustmentFactor` **field** as
> declared data is ingestion; **computing, applying or deriving** an adjustment is **P08-03** and
> is **prohibited** (§12). `P04_LIFECYCLE` **LX-2** likewise excludes *"price/series adjustment
> logic"*, and `P01 D04` records *"Deferred: Adjustment engine — P08"*.

# 8. Applicable contracts

| Source | Binding on P08-02 |
|---|---|
| **P01 D04** | Canonical field classes `<NS>corpaction.*` — `actionType, exDate, recordDate, payDate, effectiveDate, ratio, cashAmount, resultingInstrumentRef, adjustmentFactor`. **Effective dating mandatory**; `effectiveTime` **REQUIRED**; ⚠ *"ex/record/pay dates are distinct contract fields, **never collapsed**"*; cash monetary, ratios dimensionless with declared precision |
| **P01 D04 deps** | D01, **D05** — ⚠ *"identity changes are security-master lifecycle events"* |
| **P02** | E1–E8 taxonomy; `MarketDataSource<T> → DataSnapshot<T>` sole ingress; six version axes; no provider-native shape leakage |
| **P04** | Canonical security model; **AD-1** — P04 owns identity within the data plane; certified **CSIP** join key `NormalizedHolding.companyId` untouched |
| **P04-03** | Five-value `lifecycleStatus`; time-bounded attributes; effective dating |
| **P06** | Canonical normalization output — consumed, never re-derived |
| **P07** | Four-state quality vocabulary; **INV-7** no coercion. ⚠ **P07-03 reconciliation is NOT invoked** — it is P08-03's dependency |
| **P08-01** | PIT store, `ORDERED_SET_OF_SNAPSHOTS`, scalar `asOf`, vintage-ambiguity rejection |

# 9. Firewall items — status unchanged

| Item | Status |
|---|---|
| **AD-17 / M-2** | ⚠ **UNRESOLVED — PRESERVED.** P08-02 may **not** repair, weaken or reinterpret the replay firewall |
| **OI-08** | ✅ RESOLVED — **1:N** entity → securities/instruments/listings |
| **OI-09** | ✅ RESOLVED — **FIGI / OpenFIGI** authoritative external identifier |
| **OI-10** | ✅ RESOLVED — token **`MD:`**, form **`MD:<domain>.<field>`** |
| **D04 (BD-5)** | ⚠ Bounded — preserved, **not** resolved by this act |
| **OI-P04-03 / OI-P04-04 / OI-P04-05** | ⚠ **OPEN** — IB-1…IB-5 bound; FIGI licensing open; executable validation deferred |
| **M-1/AD-4, Act 6/O-8, PIT-6, BD-13 (P05-04)** | ⚠ All preserved |

⚠ None reopened, downgraded or substituted.

# 10. Authority basis for a work-item act

F-6/D22 authorized **P08 implementation** and §13 named *"P08-01 — the first P08 work item"* as
the next act, i.e. **F-6 contemplated per-work-item acts rather than a blanket licence.** The
tracker reinforces it: every P08 row carries `Authority / Gate = "Phase gate"` and
*"**no dependency bypass**"*. The **P07 precedent** is identical — P07-01-A…P07-04-A were four
separate work-item authorizations under one phase authorization.

> ⚠ **Therefore P08-02 requires its own act — which is this record — and F-6 alone would not
> have sufficed.**

**Why not P08-02-B:** no hard prerequisite is missing — P05 ✅, P06 ✅, P04-03 case **B** (§5).
**Why not P08-02-C:** no interpretation gap; the P04-03 artifact resolves its own P08 hand-off
explicitly, so no new authority decision or amendment is needed. ⚠ Had P04-03 been **case C or
D**, this act would have **STOPPED** and recorded the blocker.

# 11. Authorized implementation scope

| Dimension | Authorized |
|---|---|
| **Objective** | Ingest declared corporate actions (**dividends, splits, bonuses and other approved actions**) as canonical, effective-dated records, **linked to instruments** |
| **Repository** | `p08/src/**`, `p08/tests/**` (additive files) — **no `docs/p08`** |
| **Contract** | `<NS>corpaction.*` per P01 D04, `MD:<domain>.<field>`; ex/record/pay dates kept **distinct**; `effectiveTime` required |
| **Identity linkage** | Link actions to instruments via the **P04 canonical identity / FIGI** — ⚠ never a provider symbol |
| **PIT** | Store CA records through the **existing P08-01 store**, additively |
| **Tests** | *"Scenario tests"* — deterministic, offline, in-memory |
| **Evidence** | *"CA fixtures"* — **P08-owned backdated fixtures** |
| **Constraints** | Deterministic · offline · **no persistence** · **no network** · **no `process.env`** · no provider · no credentials (F-6 §5 and the active guard) |

# 12. Prohibited scope

⛔ **P08-03** adjusted/unadjusted series, adjustment engine, or any computed/applied adjustment ·
⛔ inventing **adjustment, split/dividend calculation or CA normalization methodology** ·
⛔ provider-specific semantics · ⛔ persistence design beyond the accepted P08-01 architecture ·
⛔ redesigning or modifying **P08-01** non-additively · ⛔ **P05-04** as evidence · ⛔ claiming
licensed historical acquisition · ⛔ credentials, network or live acquisition · ⛔ invoking
**P07-03** reconciliation · ⛔ repairing **AD-17** · ⛔ altering the CSIP join key · ⛔ new engine
metric key · ⛔ seventh version axis · ⛔ fifth quality state · ⛔ `P08_GATE_ACCEPTANCE` ·
⛔ **P09–P17** · ⛔ certification or activation claims.

# 13. Certification firewall

> **C7 = NOT CERTIFIED · CERTIFICATION = NONE_GRANTED.**

⚠ **Nothing is inferred from P08-01's completion** — implementation evidence is **not**
certification evidence. **C3/C4/C11** remain future **A2** acts; A2's designation is recorded as
*scoped to P07* and its extension to P08 is **NOT determined**. The A2 withhold stands intact
except the single `:96` clause superseded by F-1 for P08 progression only. ⚠ **F-1 and F-6 are
not reopened; no certification artifact is modified.**

# 14. A3 / acceptance

> **P08 A3 ACCEPTOR = NOT DESIGNATED** · **P08 ACCEPTANCE = NOT_ACCEPTED.**

⚠ Not designated or inferred here. **F-4 remains outstanding** and blocks any future P08 gate
acceptance; the guard enforces it mechanically (no `P08_GATE_ACCEPTANCE` may be tracked).

# 15. Explicit non-decisions

Does **NOT**: implement P08-02 · create P08-02 source or tests · modify `p08/src`, `p08/tests` or
P08-01 · authorize **P08-03** · resolve **P04-03**, **D04/BD-5**, **OI-P04-03/04/05**, **PIT-6**,
**AD-17/M-2**, **M-1/AD-4** or **Act 6** · accept P08 · certify anything · designate A3/A2/A4 ·
authorize provider selection, credentials, licensed acquisition or network access · authorize
**P09–P17** · modify P04/P05/P06/P07 artifacts, **D20/D21/D22**, the A2 record, the certification
matrix, the gate model or existing-IIPS · modify the **F-6 guard** (⚠ the current guard already
permits the §11 scope — **left untouched**) · merge to `main` · touch the stray branch.

# 16. Next separately authorized act

> ## **P08-02 IMPLEMENTATION** — the CA pipeline, within §11, honouring §12.

Then: **P08-03** (own authorization required) · **F-4** P08 A3 designation · **F-2**, **F-5**.

⚠ **STOP AFTER AUTHORIZATION. P08-02 is not implemented in this run.**

---

**D23 — P08-02 WORK-ITEM AUTHORIZATION. DECISION: ✅ P08-02-A — IMPLEMENTATION AUTHORIZED (scope §11).**
**NOT IMPLEMENTED · P04-03 = CASE B (non-blocking, specification-only limit preserved) · P08-03 NOT AUTHORIZED ·
ACCEPTANCE = NOT_ACCEPTED · A3 = NOT DESIGNATED · C7 = NOT CERTIFIED · CERTIFICATION = NONE_GRANTED · PRODUCTION = NOT_AUTHORIZED.**
