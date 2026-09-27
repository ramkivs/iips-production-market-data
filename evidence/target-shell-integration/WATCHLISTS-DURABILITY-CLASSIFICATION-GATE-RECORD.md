# Institutional Investment Platform System (IIPS)
# WATCHLISTS — DURABILITY CLASSIFICATION: GOVERNANCE GATE RECORD

**Act ID:** `watchlists-durability-classification-gate-2026-09-27-001`
**Act Type:** GOVERNANCE GATE RECORD — CLASSIFICATION DETERMINATION (non-executable;
**authorizes no implementation, no persistence, and no state of any kind**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Governing Authority:** RAMKI (Designating Authority)
**Recording Agent:** Arena (recording only — **no classification inferred**; Phase-4
selection-integrity rule applied)
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Recorded At (UTC):** 2026-09-27
**Antecedent Checkpoint:** `35acb916ed1569481b65e6d35462d14685183383`
(`watchlists-product-surface-designation-2026-09-27-001` — DESIGNATION ESTABLISHED,
no implementation authority, durability classification named as the next single item)

---

## 1. ANTECEDENT STATE (verified before this gate; independent re-fetch)

| Item | Value | Verified |
| --- | --- | --- |
| Authoritative remote main | `origin/main` = `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | ✓ |
| Recording branch | `arena/01a0e30c-iips-production-market-data` | ✓ |
| HEAD | `35acb916ed1569481b65e6d35462d14685183383` | ✓ |
| LOCAL == REMOTE (branch) | `ls-remote` == HEAD | ✓ |
| Worktree | CLEAN | ✓ |
| Antecedent 1 | `NP12-WATCHLISTS-FORENSIC-ASSESSMENT.md` @ `1fff0c4` (state fully established) | ✓ present |
| Antecedent 2 | `WATCHLISTS-PERSISTENCE-IDENTITY-TRANSPORT-GOVERNANCE-DECISION.md` @ `5c6aea9` (Option C — governance remains unresolved; B1–B8 `UNRESOLVED — NO AUTHORITY DESIGNATED`) | ✓ present |
| Antecedent 3 | `WATCHLISTS-PRODUCT-SURFACE-DESIGNATION-AUTHORITY-ACT.md` @ `35acb91` (workstream designation only; §5 names this gate) | ✓ present |
| `/watchlists` surface | structural fail-closed placeholder; unchanged | ✓ |

## 2. SINGLE QUESTION

> **What durability classification is authoritatively designated for the Watchlists product
> surface at this stage?** (SESSION-SCOPED / DURABLE / UNRESOLVED — no fourth category)

## 3. EVIDENCE INSPECTED (records read directly, not via prior reports)

| Record | Finding |
| --- | --- |
| Master spec (integrated program spec docx) — surface inventory | Watchlists: "Data + triggers — **Persistent lists, triggers, score changes**" — a **program requirement / intended-behavior statement** |
| Master spec — integration boundary text | *"This specification is the proposed master development sequence for a new program. It does not reopen or alter completed IIPS E2E certifications. **Implementation should begin only after the appropriate program authority establishes the next gate.**"* — the spec **self-declares it is not self-executing**; gate establishment is reserved to program authority |
| Program tracker (aligned xlsx) — `INT-011 Watchlists / Alerts` | `REUSE UI / INTEGRATE DATA`, status **BASELINE — VERIFY**, closing note: *"Integration through governed contracts/APIs; **runtime topology remains a later governed decision**"* |
| Program tracker — `P13-07 Watchlist integration` | Requirement: "Lists, score changes and triggers use governed data and freshness semantics"; deps P07/P11/P12; status **NOT STARTED** |
| `docs/PHASE1_AUTHORIZATION_PREPARATION.md` | Donor surface #30 Watchlists `api/watchlists` — **DEFER** (family 5.7) |
| PHASE5 authority act §3 | Absolute exclusions: no server tier, no network, no fabricated watchlists; structural-only restoration |
| Watchlists PIT governance decision (`5c6aea9`) §4 | B1 verbatim: "**UNRESOLVED — NO AUTHORITY DESIGNATED.** No act classifies Watchlists either way. The spec records durable-intent semantics; no act designates a session-scoped deviation" (B2–B8 identically unresolved) |
| Watchlists surface designation act (`35acb91`) §3–§5 | Grants workstream designation only; explicitly preserves durability as unresolved; names this classification gate as the next single item |
| Existing in-process state precedent (factual only) | BI-07 `PortfolioStore` + Tier-B session singletons = **portfolio-specific**, session-lifetime, non-transferable; no durable storage of any kind exists in-environment (0 browser-storage uses; no disk; no server). Recorded as fact, **not** as authority |
| `phase4-research-identity-designation-2026-09-23-001` §2 | Selection-integrity rule: where the authority message carries no explicit selection, the Recording Agent **halts and does not infer** |

## 4. RECONCILIATION OF THE PROGRAM SEMANTICS STATEMENT

The phrase *"Persistent lists, triggers, score changes"* is classified as follows, from the
authoritative records above:

1. It is a **requirement / intended-behavior statement** in the authoritative master
   program specification — it describes what the Watchlists product surface is intended
   to provide at full function.
2. It is **NOT an already-authorized durability classification**. The spec itself states
   implementation "should begin only after the appropriate program authority establishes
   the next gate"; the aligned tracker records the runtime/persistence topology as "a later
   governed decision"; and every product surface in this framework required its own
   designation/authority acts notwithstanding the spec's descriptions.
3. It is therefore a **requirement that still requires a separate designation** — and it is
   **not** downgraded to session scope by the current absence of durable primitives (the PIT
   decision gate ruled exactly that: no session-scoped deviation is designated either).

## 5. MECHANISM FINDINGS (durability-classification authority)

| # | Question | Finding |
| --- | --- | --- |
| 1 | Who/what can designate durability? | The **Designating Authority (RAMKI)**, via an authority act recorded in `evidence/target-shell-integration/` — the same designation mechanism used for all prior surface acts. Neither the spec (self-limiting) nor the tracker ("later governed decision") self-executes the classification |
| 2 | What evidence is required? | An **explicit classification selection** reconciling the recorded durable-intent program semantics with the bounded NON_PRODUCTION environment, recorded in an authority act |
| 3 | Does the Watchlists surface designation grant/withhold this? | **Withholds.** `35acb91` grants workstream designation only; it names this gate; implementation and all semantics classifications are explicitly preserved unresolved |
| 4 | Is another explicit authority act required? | **YES.** This gate's instruction establishes and scopes the gate but carries **no explicit SESSION-scoped or DURABLE selection**; per the Phase-4 selection-integrity rule, the Recording Agent may not infer one |
| 5 | Does a durable classification auto-authorize persistence implementation? | **NO — preserved distinction.** Classification ≠ persistence implementation authority; storage, write, retention, deletion, identity/ownership, transport, and production each remain separate subsequent gates |

## 6. IDENTITY BOUNDARY (closed — unchanged by this gate)

No user principal, tenant identity, D115 C/D resolution, `ANONYMOUS_SESSION` promotion,
ownership, or authorization semantics is established here. Recorded dependency (not
resolved): any **durable user-owned** Watchlists semantics depends on D115, which remains
**DEFERRED / WITHHELD / UNRESOLVED / NOT AUTHORIZED**.

## 7. CLASSIFICATION DETERMINATION

# **DURABILITY CLASSIFICATION = UNRESOLVED**

**Basis (exactly):**

1. **SESSION-SCOPED is not authoritatively designated.** No authority record permits
   Watchlists session scope; the PIT decision gate already established this
   (`5c6aea9` §4 B1), and this gate's instruction prohibits choosing from existing
   implementation patterns or technical convenience.
2. **DURABLE is not authoritatively designated.** The program statement is a requirement
   awaiting a separate designation (§4); the tracker holds the topology open; and this
   gate's instruction prohibits choosing from program intent alone or donor behavior.
3. **No explicit selection was provided for this gate.** The designation-framework's
   selection-integrity rule forbids the Recording Agent from inferring one
   (`phase4-…identity-designation…` §2 precedent).

**What is missing (exact authority/evidence):** an explicit **durability-classification
selection by the Designating Authority** for the Watchlists surface in the bounded
NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV environment, recorded in an authority act —
either SESSION-SCOPED (with the recorded persistent semantics explicitly scoped/deferred
for this environment and lifecycle/reset rules stated) or DURABLE (which would then route
to the identity/ownership [D115] and persistence-authority gates before any implementation
gate could exist).

## 8. AUTHORITY ESTABLISHED BY THIS GATE

**None beyond this record.** The gate's only product is the determination recorded in §7.
No classification is designated; no implementation, state, or persistence authority exists.

## 9. EXCLUSIONS (absolute)

This gate did not create, modify, or authorize: persistence; a Watchlist store; `PortfolioStore`
changes; browser/disk/server storage; API routes; network transport; DTOs; Watchlist state;
retention/deletion/reset code; identity/tenant logic; authentication; D115 modification;
Dhan/NSE/OIDC activation; donor Watchlists import; the `/watchlists` placeholder; tracker/spec
records; or any unrelated surface. Technical feasibility was not treated as authorization.

## 10. NEXT SINGLE GOVERNANCE PREREQUISITE

**Explicit durability-classification selection by the Designating Authority (RAMKI)** —
SESSION-SCOPED or DURABLE — recorded as an authority act under the existing designation
mechanism. *(Not performed by this gate; nothing else may proceed until it is recorded.)*

## 11. VALIDATION (targeted, governance-only)

- Sole repository change: ADD of this gate record. No application code, tests, fixtures,
  contracts, persistence, transport, identity, configuration, or unrelated files changed.
- No build or test suite executed (not required for a non-executable gate record).
- Every citation in §3/§4/§5 was verified by direct inspection of the underlying record
  (spec docx text, tracker xlsx rows, authority acts) before recording; no authority
  inferred from chat history, donor behavior, convenience, or program intent alone.

## 12. DURABILITY CHECKPOINT

| Step | Result |
| --- | --- |
| Exact diff reviewed | only this record added |
| Implementation/persistence/transport/identity/config changes | none |
| Commit | (SHA in final report / git log) |
| Push to `arena/01a0e30c-iips-production-market-data` | completed |
| LOCAL == REMOTE | verified post-push |
| Clean worktree | verified |

---

## OUTCOME

# **DURABILITY CLASSIFICATION = UNRESOLVED** (gate closed; no classification designated; STOPPED)
