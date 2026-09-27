# Institutional Investment Platform System (IIPS)
# WATCHLISTS — PRODUCT SURFACE DESIGNATION: AUTHORITY ACT

**Act ID:** `watchlists-product-surface-designation-2026-09-27-001`
**Act Type:** AUTHORITY_DESIGNATION (act precedes any implementation; **this act authorizes NO
implementation by itself** — F-8/Phase-4 act-type precedent)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Decision Authority:** RAMKI (Designating Authority)
**Selected By:** RAMKI — explicit authority instruction received for this gate designating the
**Watchlists product surface** as the active governed workstream (the surface is named in the
instruction; no selection was inferred by the Recording Agent)
**Recording Agent:** Arena (recording only; no implementation performed or authorized by this
act's creation)
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Recorded At (UTC):** 2026-09-27
**Antecedent Checkpoint:** `5c6aea9dbda25ef81195f4f6d74e9753c1b02d93`

---

## 1. ANTECEDENT STATE (verified before this act, independently re-fetched)

| Item | Value | Verified |
| --- | --- | --- |
| Authoritative remote | `origin/main` = `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | ✓ |
| Recording branch | `arena/01a0e30c-iips-production-market-data` | ✓ |
| HEAD | `5c6aea9dbda25ef81195f4f6d74e9753c1b02d93` | ✓ |
| LOCAL == REMOTE (branch) | `ls-remote` HEAD = HEAD | ✓ |
| Worktree | CLEAN | ✓ |
| Antecedent gate 1 | `NP12-WATCHLISTS-FORENSIC-ASSESSMENT.md` @ `1fff0c4` (read-only forensic; state fully established) | ✓ present |
| Antecedent gate 2 | `WATCHLISTS-PERSISTENCE-IDENTITY-TRANSPORT-GOVERNANCE-DECISION.md` @ `5c6aea9` (OPTION C — governance remains unresolved; no authority designated) | ✓ present |
| `/watchlists` surface | structural fail-closed only (`UnavailableSurface(state='offline')`), nav `unavailable` | ✓ unchanged |
| Registry | Watchlists **OUTSIDE REGISTRY**; `UI07 = UI07_PIT_CORPORATE_ACTIONS` | ✓ unchanged |
| Guard tests | OPTA-01/04a/11 + nav contracts pin the structural state | ✓ unchanged (not executed; read-only verification) |

## 2. APPLICABLE AUTHORITY/DESIGNATION MECHANISM (reconciliation of the existing framework)

| Dimension | Evidence (repository records inspected directly) |
| --- | --- |
| Mechanism | Authority **designation act** recorded by the Recording Agent pursuant to an **explicit selection by the Designating Authority (RAMKI)**, recorded in `evidence/target-shell-integration/`. Optional preparatory instruments: authority selection packet (`GATE-NEXT-PRODUCT-SURFACE-AUTHORITY-DESIGNATION`) and read-only forensic gates. Designation **≠** implementation authority: "act precedes any implementation; this act authorizes NO implementation by itself" (`f8-ui06-screener-restoration-2026-09-23-001`); implementation requires a separate read-only pre-flight / implementation-authorization gate (packet §8) |
| Authority holder/role | **RAMKI (Designating Authority)** — named in `phase5-…-2026-09-23-001`, `phase1c-intel-deferred-completion-2026-09-22-001`, `phase4-research-identity-designation-2026-09-23-001`, `f8-…-2026-09-23-001`, `f3-…-2026-09-23-001`, designation packet |
| Required fields | Act ID; Act Type; Governing Authority; Recording Agent; antecedent verification (HEAD / LOCAL==REMOTE / CLEAN); explicit selection record (Recording Agent **must not infer** — `phase4-research-identity-designation-2026-09-23-001` §2); exact authorized scope; absolute exclusions; preservation requirements; validation; durability checkpoint (commit → push → LOCAL==REMOTE → CLEAN) |
| Approval/acceptance semantics | Explicit selection by RAMKI recorded verbatim; designation-only acts are non-executable (no code change); any later implementation act carries its own gates |
| Durability/recording requirements | Markdown act committed to `evidence/target-shell-integration/`; LOCAL == REMOTE; clean worktree; no history rewrite |
| Prior use for other product surfaces | YES — BI-08 portfolio mount; Phase-1C Intelligence; Phase-2 Evidence; Phase-3 Executive; Phase-4 Research + Phase-4 identity designation; F-3 UI08 Security Master; F-8 UI06 Screener; Phase-5 full-shell restoration |

**Framework applicability to Watchlists:** the mechanism is surface-agnostic; Watchlists can be
designated through it **without creating any new framework**. Preparatory evidence equivalent to
prior cycles exists (the two committed Watchlists gates above). The closed candidate set of the
NEXT-PRODUCT-SURFACE packet (Executive/Evidence/Research) is not binding on later workstreams —
all three were subsequently designated; F-3/F-8/Phase-5 each proceeded under a fresh authority
selection, as this act does. PHASE5's "NO per-surface Phase 5.x functional recovery … STOP"
bounded the Phase-5 implementation act only; it is not a prohibition on a later, separately
selected designation act. No duplicate prior Watchlists selection exists anywhere in the
repository (verified: designation acts enumerated in §2; none names Watchlists).

## 3. AUTHORITY DECISION RECORDED

> ### **WATCHLISTS PRODUCT SURFACE — DESIGNATED AS THE ACTIVE GOVERNED WORKSTREAM**
> ### (bounded designation only; durability classification is the NEXT governance item)
> **Selected by:** RAMKI

### 3.1 What is designated (the *entire* authorized scope)

1. **Workstream designation.** The Watchlists product surface (donor surface #30
   `watchlists/Watchlists.tsx`; route `/watchlists`; tracker `P13-07` / `INT-011`;
   spec surface-inventory "Persistent lists, triggers, score changes") is **designated as the
   active product-surface workstream** for sequential authority-gated determinations.
2. **Governance sequencing.** The **next governance item** for this workstream is the
   **durability classification gate** (session-scoped vs durable — see §5). Later items, in
   order, remain: persistence authority → identity/ownership → transport authority →
   read-only pre-flight / implementation-authorization gate. Each remains a **separate act**
   with its own authority selection; none is rolled into this act.
3. **Nothing else.** This act grants no technical capability and changes no repository state
   other than its own recording.

### 3.2 Selection-integrity record

The authority instruction for this gate explicitly named the Watchlists product surface and
directed the narrowest valid designation be recorded if the existing framework supports it
(§2 establishes that it does). The Recording Agent inferred no selection, ranked no options,
and anticipated no outcome beyond the instruction; per `phase4-…identity-designation…` §2,
had the instruction lacked an explicit surface selection, this act would have halted.

## 4. EXCLUSIONS (absolute — boundaries explicitly preserved)

This act does **NOT** authorize, create, modify, or designate:

- **Watchlists implementation** of any kind (no `features/watchlists`, no store, no state,
  no DTO, no list mutation, no triggers, no alerts, no score-change tracking, no fixtures,
  no UI beyond the existing structural placeholder);
- **Session vs durable classification**, persistence authority, storage mechanism, retention,
  deletion, or reset semantics (all remain `UNRESOLVED — NO AUTHORITY DESIGNATED` per the
  antecedent decision gate);
- **Identity/ownership/tenant** authority (D115 remains **DEFERRED / WITHHELD / UNRESOLVED /
  NOT AUTHORIZED**; `ANONYMOUS_SESSION` is display-only and is not promoted);
- **Transport**: no network transport, no API, no server tier, no RPC (PHASE5 §3 exclusions
  stand absolutely);
- **Authentication/OIDC/Keycloak**; **Dhan / NSE / OIDC / operator-drop / P12** modifications;
  **production eligibility/authorization** (`productionEligible: false` stands);
- **Surface-record changes**: no route, navigation, `status`, or `UnavailableSurface` change;
  the structural fail-closed `/watchlists` placeholder remains exactly as-is;
- **Registry identity**: no `UISurfaceId` is assigned or merged. Recorded conflict: the tracker
  UI-coverage sheet labels Watchlists "UI07", while the code registry binds
  `UI07 = UI07_PIT_CORPORATE_ACTIONS`; surface-identity designation (if any) is a **future
  separate act** and is NOT resolved here;
- **Donor component import** (`Watchlists` donor component remains prohibited, OPTA-11);
- **Tracker/spec edits** (`P13-07` remains NOT STARTED; `INT-011` remains BASELINE — VERIFY;
  their status advancement is a later governed action tied to implementation gating);
- **Any unrelated product surface.**

## 5. NEXT GOVERNANCE PREREQUISITE (single, named; NOT performed by this act)

**Durability classification gate for Watchlists** — determine session-scoped vs durable
semantics, reconciled with the recorded program semantics ("Persistent lists, triggers, score
changes"), under the existing authority mechanism. Prerequisites already discharged for that
gate: surface designation (this act); forensic state record (`1fff0c4`); persistence/identity/
transport evidence record (`5c6aea9`). Unresolved prerequisites it must preserve or resolve:
B1–B8 persistence questions, D115 identity scope, transport authority — each per its own act.

## 6. VALIDATION (targeted, governance-only)

- Sole repository change: ADD of this act file. No application code, tests, fixtures,
  contracts, transports, persistence, identity, configuration, or unrelated files changed.
- No build or test suite executed (not required for a non-executable designation record).
- Every framework citation above was verified by direct inspection of the underlying
  authority records before recording (§1–§2); authority holder not inferred from memory or
  conversation artifacts outside the received instruction.
- Technical possibility separated from authorization throughout (per the antecedent
  decision gate's capability table); no boundary altered to make this step pass.

## 7. DURABILITY CHECKPOINT

| Step | Required | Result |
| --- | --- | --- |
| Exact diff reviewed | only the intended artifact added | (completed at commit) |
| Application code unchanged | zero diffs outside this file | ✓ |
| Persistence/transport/identity/config changes | none | ✓ |
| Commit | `watchlists: product-surface designation authority act …` | (SHA recorded below) |
| Push to remote branch | `arena/01a0e30c-iips-production-market-data` | (completed) |
| LOCAL == REMOTE | verified post-push | ✓ |
| Clean worktree | verified | ✓ |

**Commit SHA:** `recorded in commit object — see final report / git log`

**FAIL-CLOSED NOTE:** had the existing framework not supported this designation, this act
would have recorded `DESIGNATION NOT ESTABLISHED` and added no artifact. The framework
mechanism, authority holder, designation-only act type, and current Watchlists evidence
base were all verified present (§1–§2), and the instruction carried an explicit selection;
therefore the designation is recorded exactly as bounded above.

---

## OUTCOME

# `DESIGNATION ESTABLISHED` — bounded workstream designation only (no implementation authority)
