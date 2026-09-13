# D24 — P08-03 WORK-ITEM AUTHORIZATION — ADJUSTMENT / RECONCILIATION (ADJUSTED-UNADJUSTED SERIES)

**Authorization act only. Append-only.**
⚠ **P08-03 is NOT implemented in this run.** No source · no tests · no P08-01/P08-02 change ·
no guard change · no acceptance · no certification · no activation.

| Field | Value |
|---|---|
| **Record** | **D24** |
| **Act** | P08-03 work-item authorization |
| **Baseline SHA** | **`397ae546562f391058f95eef55fe4f418eb8c904`** ✅ verified |
| **Branch** | ✅ **`arena/01a0853d-iips-production-market-data`** |
| **Stray branch** | `arena/01a0853d` @ `3c084bb` — ⚠ **NOT modified, NOT deleted** |
| **Tree at start** | ✅ CLEAN |
| **Authority chain** | F-1/**D20** → F-3/**D21** → F-6/**D22** → **P08-01** → **D23** → **P08-02** |
| **Date** | 2026-09-12 |

---

# 1. DECISION

> # ✅ **P08-03-A — SELECTED**
> ## **P08-03 IMPLEMENTATION = AUTHORIZED**, within the scope at §13 and the prohibitions at §14.

```
P08-03 IMPLEMENTATION = AUTHORIZED (scope §13)
P08-03 IMPLEMENTED    = NO — not begun in this run
P08 ACCEPTANCE        = NOT_ACCEPTED
A3                    = NOT DESIGNATED
C7                    = NOT CERTIFIED
CERTIFICATION         = NONE_GRANTED
PRODUCTION            = NOT_AUTHORIZED
P09–P17               = NOT_AUTHORIZED
```

⚠ **Not selected because P08-03 is "next".** The hard dependency **P07-03** was independently
verified (§5) and **is satisfied**; had it not been, this record would read **P08-03-B**.
⚠ One **bounded methodology gap (AG-2)** is recorded at §10 and **is not resolved here**.

---

# 2. P08-03 tracker definition — authoritative XLSX, verbatim

| Column | Value |
|---|---|
| **Work ID** | **P08-03** · Phase **P08** · Area **Corporate Actions** |
| **Work Item** | **Adjustment/reconciliation** |
| **Requirement** | *"Define adjusted/unadjusted series and portfolio reconciliation behavior."* |
| **Deliverable** | *"Adjustment engine/rules"* |
| **Dependencies** | **`P08-02, P07-03`** — Dependency Type **Hard** |
| **Entry Criteria** | *"CA data validated"* |
| **Exit Criteria** | *"Series and holdings reconcile"* |
| **Test / Validation** | *"Golden scenarios"* |
| **Evidence** | *"Adjustment evidence"* |
| **Authority / Gate** | *"Phase gate"* · Status **NOT STARTED** · Wave **W6** · Critical Path **YES** |
| **Parallelization** | *"Phase-gate dependency controls entry/exit; **no dependency bypass**"* |

⚠ **The dependency set is `P08-02, P07-03` — `P04-03` is NOT a P08-03 dependency** (that was
P08-02's). Verified in both `Work Tracker` and `Dependency Matrix`.

# 3. Dependency matrix

| Dependency | Type | Verified state | Satisfied? |
|---|---|---|---|
| **P07-03** | **Hard** | ✅ **IMPLEMENTED + ACCEPTED**, 44/44 — §5 | ✅ **YES** |
| **P08-02** | **Hard** | ✅ **IMPLEMENTED**, `397ae54` — §7 | ✅ **YES** |
| P08-01 | implicit (PIT) | ✅ COMPLETE — §6 | ✅ YES |
| P04-03 | ⚠ **not a P08-03 dependency** | (was P08-02's) | n/a |

---

# 5. ⚠ P07-03 — INDEPENDENTLY VERIFIED (the decisive check)

⚠ **Verified from live records, NOT inferred from P07 overall acceptance, not from P08-02, and
not from any other P07 work item** — exactly as required.

| Evidence | Finding |
|---|---|
| `docs/PHASE_07_OVERALL_ACCEPTANCE.md`:28 | `\| P07-03 Provider reconciliation \| e302a4d \| 28d862b — 18/18 PASS \| ✅ \|` |
| ibid.:97 | Test ledger row **`P07-03 \| 44 \| 44 \| 0`** |
| ibid.:40 | *"P07-01 → P07-03 integration — reconciliation consumes quality boundaries without redefining — **PASS**"* |
| ibid.:41 | *"P07-03 → O-2 integration — conforms to resolution policy v1.0 — **PASS**"* |
| ibid.:61 | *"**P07-03** provides provider reconciliation (classify and present, never collapse)"* |
| **Source present** | `p07/src/providerReconciliation.js` (20,147 B) + tests (25,475 B) |
| **Executed at this baseline** | `node --test tests/providerReconciliation.test.js` → **44 pass / 0 fail** |

> ## **P07-03 STATE = IMPLEMENTED + ACCEPTED (within the accepted P07 gate). ✅ Dependency SATISFIED.**

**Required output vs. acceptance.** The tracker exit criterion for P07-03 is *"Discrepancies
classified"* — an **output**, and it exists as an executable, accepted surface:
`compareCanonicalSnapshots`, `reconcileCanonicalSnapshots`, `checkDomainSupport`,
`reconcileWithCoverageCheck`, `DISPOSITION_TYPES`, `COMPARISON_DIMENSIONS`, `NSE_DOMAIN_COVERAGE`.
⚠ **P08-03 needs the output, and the output is additionally covered by an explicit acceptance
act** — so the dependency is satisfied on either reading. **No bypass is performed.**

⚠ **D04 is `COVERED`** in `NSE_DOMAIN_COVERAGE` (`providerReconciliation.js`:104-115), so the
corporate-action domain P08-03 must reconcile is within P07-03's declared coverage.

⚠ **Certification relevance:** P07-03 carries **no certification** — `C7` remains **NOT
CERTIFIED** and overall P07 certification is **NONE_GRANTED (withheld)**. ⚠ **Nothing about
P07-03's acceptance implies certification**, and none is inferred here.

# 6. P08-01 boundary

**COMPLETE** (`459b05b`, 25/25). P08-03 **may consume the existing PIT model directly**: the store
is domain-agnostic, `asOf`-keyed, append-only, with vintage-ambiguity rejection — which already
supplies D04's *"an adjustment applied today must not retroactively alter a past PIT result"*.

> ⚠ **No new storage architecture is assumed or authorized.** An adjusted series must be derived
> as a **read-side projection** over stored vintages, **never** by rewriting a stored vintage. Any
> genuine need beyond additive use must be **stopped and recorded**, not designed in.

# 7. P08-02 boundary — inputs verified to exist

⚠ Verified that P08-03's inputs are **actually produced** by the implemented P08-02 contract:

| P08-03 input | Produced by P08-02? |
|---|---|
| `MD:corpaction.actionType` | ✅ `CA_FIELDS`, required |
| `MD:corpaction.ratio` | ✅ conditional, ingested verbatim |
| `MD:corpaction.adjustmentFactor` | ✅ **declared value ingested**, never computed (`declaredAdjustmentFactor`) |
| `MD:corpaction.effectiveDate` + `effectiveTime` | ✅ both required |
| distinct `exDate` / `recordDate` / `payDate` | ✅ never collapsed |
| FIGI instrument linkage | ✅ `CA-E5`/`CA-E6` enforced |
| `lifecycleStatus` | ✅ five-value enumeration |
| PIT vintages / as-of view | ✅ `actionsFor`, `asOfView`, `ambiguities` |

> ✅ **No gap found. P08-02 must NOT be modified by P08-03.** If implementation later reveals a
> missing field, the gap is **recorded**, not silently patched into P08-02.

# 9. P01 / P04 contracts governing P08-03

| Source | Binding |
|---|---|
| `P01_SCHEMA_CATALOG.md`:32-33 (**D02**) | `<NS>ohlcv.*` includes `adjustedClose`, `adjustmentFactor`; ⚠ required metadata includes an **"adjusted vs unadjusted flag"** and an **adjustment provenance reference (→ D04)** |
| `P01_FIELD_DICTIONARY.md`:93-94 | `<NS>ohlcv.adjustedClose` (C, dec, currency+precision, `effectiveTime`) · `<NS>ohlcv.adjustmentFactor` (C, dec, **dimensionless**) |
| `P01_IDENTITY_AND_LINEAGE.md`:129 (**L-11**) | ⚠ **`adjustmentBasisRef` is REQUIRED for adjusted series (D02/D04)** — *"adjustment factors are **evidence-bearing**"* |
| `P01_SCHEMA_CATALOG.md`:65 | Effective dating mandatory; adjustment factors evidence-bearing |
| `P00_GATE_MODEL.md`:45 | P08 evidence: *"**ADR-02 evidence: byte-identical golden replay**; vintage ambiguity detection"* — aligns with the tracker's *"Golden scenarios"* |
| `P02_PROVIDER_CAPABILITY_MODEL.md`:105 (RC-3) | A D04 claim must state supported action types, effective-dating completeness and whether adjustment factors are supplied |
| P04 / identity | **AD-1**; CSIP join key `NormalizedHolding.companyId` **untouched**; FIGI linkage |

⚠ Distinct time semantics (`asOf` vintage vs `effectiveDate`/`effectiveTime` vs ex/record/pay)
**must not be collapsed**. ⚠ `companyId` and provider symbols are **never** canonical security
identity.

# 10. ⚠ AG-1 relevance, and a NEW bounded gap AG-2

**AG-1 (from P08-02):** `actionType` is declared `enum` but no values are enumerated; P08-02
implements `dividend`, `split`, `bonus` and rejects others.

> ⚠ **P08-03 DOES depend on `actionType` semantics** — an adjustment differs by action type
> (a split's ratio and a cash dividend behave differently). **Recorded, NOT resolved here.**
> **Consequence:** P08-03 is bounded to the same three types. It must **not** widen the
> enumeration, and must **not** invent behaviour for *"other approved actions"*.

**⚠ AG-2 — NEW, recorded not resolved.** The corpus specifies the adjustment **fields**
(`adjustedClose`, `adjustmentFactor`, `adjustmentBasisRef`) and their **evidence obligations**,
but **no artifact specifies the adjustment ARITHMETIC** — no formula for deriving a factor from a
split ratio or a dividend, and no rounding/precision rule beyond *"dimensionless with declared
precision"*. ⚠ **P08-03 must therefore consume a DECLARED `adjustmentFactor` and must NOT invent
a derivation methodology.** Deriving factors from ratios requires an explicit authority act.

⚠ This is **bounded, not blocking**: the tracker's exit criterion is *"Series and holdings
reconcile"*, achievable from declared, evidence-bearing factors.

# 11-12. Firewalls — unchanged

| Item | Status |
|---|---|
| **AD-17 / M-2** | ⚠ **UNRESOLVED — PRESERVED.** P08-03 may not repair, weaken or reinterpret it |
| **OI-08** | ✅ RESOLVED — **1:N** |
| **OI-09** | ✅ RESOLVED — **FIGI / OpenFIGI** |
| **OI-10** | ✅ RESOLVED — token **`MD:`**, form **`MD:<domain>.<field>`** |
| **BD-1…BD-13** | ⚠ All preserved — D04/BD-5, PIT-6, BD-13 (P05-04), OI-P04-03/04/05, M-1/AD-4, Act 6/O-8 |

# 13. Authorized implementation scope

| Dimension | Authorized |
|---|---|
| **Objective** | *"Define adjusted/unadjusted series and portfolio reconciliation behavior"* |
| **Deliverable** | *"Adjustment engine/rules"* — **rules that APPLY declared factors** (⚠ not derive them, AG-2) |
| **Repository** | `p08/src/**`, `p08/tests/**` — additive files only; **no `docs/p08`** |
| **Series** | Adjusted **and** unadjusted views, with the P01 D02 **"adjusted vs unadjusted flag"** and **adjustment provenance reference (→ D04)** |
| **Lineage** | ⚠ **`adjustmentBasisRef` REQUIRED** for any adjusted series (L-11) — factors are evidence-bearing |
| **Reconciliation** | *"Series and holdings reconcile"* — ⚠ **only to the extent the tracker assigns it here**; the requirement names *"portfolio reconciliation behavior"*, so **behaviour definition + reconciliation proof** is in scope |
| **Inputs** | P08-02 CA records; P08-01 PIT vintages; **P07-03** classification outputs for discrepancies |
| **PIT** | **Read-side projection only** — ⚠ a stored vintage is never rewritten |
| **Tests / Evidence** | *"Golden scenarios"* / *"Adjustment evidence"*, incl. **ADR-02 byte-identical golden replay** |
| **Constraints** | Deterministic · offline · **no persistence, no network, no `process.env`, no credentials, no provider acquisition** |

# 14. Prohibited scope

⛔ **Deriving/computing an adjustment factor** (AG-2 — declared factors only) · ⛔ widening
`actionType` beyond the three named values (AG-1) · ⛔ **rewriting any stored PIT vintage** or
retroactively altering a past PIT result · ⛔ redesigning P08-01 storage · ⛔ **modifying P08-02**
· ⛔ new storage architecture, database or filesystem persistence · ⛔ network, credentials,
provider selection, licensed acquisition · ⛔ **P05-04** as evidence · ⛔ claiming an executable
P04 lifecycle service · ⛔ collapsing distinct time semantics · ⛔ `companyId`/provider symbols as
identity · ⛔ altering the CSIP join key · ⛔ new engine metric key · ⛔ seventh version axis ·
⛔ fifth quality state · ⛔ repairing **AD-17** · ⛔ redefining **P07-03** policy · ⛔ modifying the
**F-6 guard** · ⛔ `P08_GATE_ACCEPTANCE` · ⛔ **P09–P17** · ⛔ certification or activation claims.

⚠ **F-6 guard:** the §13 scope is entirely within `p08/src` + `p08/tests`, already permitted.
**No guard change is required or made.** If implementation reveals one, it is a **separate
governance act**, not a quiet edit.

# 15-16. Certification firewall · A3

> **C7 = NOT CERTIFIED · CERTIFICATION = NONE_GRANTED · A3 = NOT DESIGNATED · P08 = NOT_ACCEPTED.**

⚠ Nothing is inferred from P07-03's acceptance or from P08-01/P08-02 completion — implementation
evidence is **not** certification evidence. **C3/C4/C11** remain future **A2** acts; A2's scope is
recorded as *P07* and its extension to P08 is **NOT determined**. The A2/Sai record is **not
modified**; F-1 and F-6 are **not reopened**. **F-4 remains outstanding** and is **not performed
here**.

# 18. Explicit non-decisions

Does **NOT**: implement P08-03 · create source or tests · modify P08-01, P08-02, P07-03 or the
F-6 guard · resolve **AG-1** or **AG-2** · resolve BD-1…BD-13, AD-17/M-2, PIT-6, OI-P04-03/04/05,
D04/BD-5, M-1/AD-4 or Act 6 · accept P08 · certify anything · designate A3/A2/A4 · authorize
providers, credentials or licensed acquisition · authorize **P09–P17** · modify P04/P05/P06/P07
acceptance records, **D20–D23**, the A2 record, the certification matrix, the gate model or
existing-IIPS · merge to `main` · touch the stray branch.

# 19. Next act

> ## **P08-03 IMPLEMENTATION** — adjustment engine/rules, within §13, honouring §14.

⚠ Implementation must open by **re-verifying AG-2's boundary** (declared factors only).
Thereafter: **F-4** P08 A3 designation · **F-2**, **F-5**.

⚠ **STOP AFTER AUTHORIZATION. P08-03 is not implemented in this run.**

---

**D24 — P08-03 WORK-ITEM AUTHORIZATION. DECISION: ✅ P08-03-A — IMPLEMENTATION AUTHORIZED (scope §13).**
**P07-03 = IMPLEMENTED + ACCEPTED (44/44), dependency SATISFIED · P08-02 inputs verified present ·
AG-1 relevant + AG-2 newly recorded, neither resolved · NOT IMPLEMENTED ·
ACCEPTANCE = NOT_ACCEPTED · A3 = NOT DESIGNATED · C7 = NOT CERTIFIED · CERTIFICATION = NONE_GRANTED · PRODUCTION = NOT_AUTHORIZED.**
