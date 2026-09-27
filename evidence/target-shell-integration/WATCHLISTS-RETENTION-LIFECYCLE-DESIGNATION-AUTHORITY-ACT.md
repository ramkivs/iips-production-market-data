# Institutional Investment Platform System (IIPS)
# WATCHLISTS — SG-3 RETENTION/LIFECYCLE DESIGNATION: AUTHORITY ACT

**Act ID:** `watchlists-sg3-retention-lifecycle-designation-2026-09-27-001`
**Act Type:** AUTHORITY ACT — RETENTION/LIFECYCLE DESIGNATION (non-executable;
**this act authorizes NO expiration code, NO cleanup job, NO archival code, NO
migration code, NO corruption-recovery code, NO storage change, NO implementation,
NO transport**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Designating Authority:** RAMKI
**Recording Agent:** Arena (recording only)
**Selection Basis:** explicit Designating-Authority instruction received for this gate
containing the complete D1–D10 operative decision tokens — recorded **verbatim,
without modification, reinterpretation, weakening, strengthening, or substitution**.
The prerequisite named by `c31dcda` (an explicit Designating-Authority SG-3 selection
across the D1–D10 option space) is hereby supplied. Nothing is inferred from
`localStorage`/browser behavior, existing stores, or conventions; the policy is an
authority decision supplied by RAMKI
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Recorded At (UTC):** 2026-09-27
**Antecedent Checkpoint:** `c31dcda5a8649275e3480fd259bdda003e495a01`

---

## 1. AUTHORITATIVE BASELINE (verified fail-closed before this act)

| Item | Value | Verified |
| --- | --- | --- |
| Branch / HEAD (pre-act) | `arena/01a0e30c-iips-production-market-data` @ `c31dcda…495a01` | ✓ |
| LOCAL == REMOTE | fresh fetch (explicit tracking refspec) → `refs/remotes/origin/arena/…` == `HEAD` | ✓ |
| Worktree / reflog | CLEAN; reflog head = `c31dcda`, `35a80f8`, `f5f7608`, `bcb3dac` → workspace persistent; **no re-clone / no history replacement** | ✓ |

## 2. ANTECEDENT VERIFICATION (from commit objects)

| Antecedent | Verified content | Result |
| --- | --- | --- |
| Chain `1fff0c4` … `c31dcda` | all 14 commits ancestors of HEAD | ✓ |
| SG-1 `bcb3dac` | `A — STORAGE MECHANISM DESIGNATED`; `SELECTED MECHANISM: browser localStorage` | ✓ |
| SG-2 `35a80f8` | `A — OPERATIONAL SEMANTICS ESTABLISHED`; atomic-boundary write; hard-removal delete; explicit-only reset | ✓ |
| SG-3 gate `c31dcda` | `C — RETENTION/LIFECYCLE UNRESOLVED`; prerequisite = explicit SG-3 selection across D1–D10; D10 BLOCKED on SG-5 | ✓ |
| State boundary + SG-5 | membership by canonical companyId; `EXACT RUNTIME PRINCIPAL IDENTIFIER = UNRESOLVED` | ✓ |

The UNRESOLVED gate record stands unmodified as history; this act supplies the exact
prerequisite it named and supersedes the SG-3 unresolved state going forward.

## 3. DESIGNATING AUTHORITY

**RAMKI** — Designating Authority = RAMKI, unchanged.

## 4–12. D1–D9 DESIGNATED DECISIONS (verbatim)

### §4 — D1 RETENTION DURATION — DESIGNATED
> **WATCHLIST LIST STATE SHALL BE RETAINED INDEFINITELY UNTIL AN AUTHORIZED DELETE OR EXPLICIT RESET/CLEAR OPERATION REMOVES IT.**
> **No time-based TTL is authorized.**

### §5 — D2 EXPIRY / STALE-STATE HANDLING — DESIGNATED
> **NO AUTOMATIC EXPIRY OR STALE-STATE DELETION IS AUTHORIZED.**
> Watchlist list state does not become deletable merely because it has not been
> accessed or modified for a period of time.

### §6 — D3 AUTOMATIC-BEHAVIOR POSTURE — DESIGNATED
> **NO AUTOMATIC RETENTION CLEANUP, EXPIRY, ARCHIVAL, OR DELETION IS AUTHORIZED.**
> **Lifecycle-changing behavior must result from an explicitly authorized operation.**
> The SG-2 explicit-only RESET/CLEAR rule remains unchanged.

### §7 — D4 EXPLICIT TERMINATION — PRESERVED (SG-2 authority, not reopened)
> **Individual Watchlist deletion is authorized as hard removal.**
> **Explicit RESET/CLEAR of the bounded Watchlists list state is authorized and removes all persisted Watchlist list-state records.**
> **No implicit termination is authorized.**

### §8 — D5 BROWSER-MEDIATED LOSS POSTURE — DESIGNATED
> **Browser/site-data clearing, browser-managed eviction, uninstall, or equivalent browser-level loss is NOT a Watchlists lifecycle operation authorized by the application governance.**
> **Such external browser behavior must not be represented as an intentional Watchlists retention policy.**
> **The application must not manufacture a governance event claiming that browser-mediated loss was an authorized Watchlist deletion.**

### §9 — D6 ARCHIVAL VS DELETION — DESIGNATED
> **NO ARCHIVAL LIFECYCLE IS AUTHORIZED.**
> **Watchlist state remains active persisted list state until an authorized deletion/reset operation removes it.**
> **No archive state is introduced.**

### §10 — D7 REPLACEMENT / VERSION LIFECYCLE — DESIGNATED
> **NO RETENTION POLICY authorizes replacement or version pruning of Watchlist state.**
> **Replacement/version behavior must preserve the already-established SG-2 mutation semantics and must not silently delete historical/current Watchlist state under a retention rule.**

### §11 — D8 MIGRATION LIFECYCLE — DESIGNATED
> **NO AUTOMATIC RETENTION-DRIVEN MIGRATION OR DATA PURGE IS AUTHORIZED.**
> **Any future schema/storage migration remains a separately governed implementation/migration decision and must not be inferred from this retention act.**

### §12 — D9 CORRUPTION LIFECYCLE — DESIGNATED
> **NO AUTOMATIC CORRUPTION-DRIVEN DELETION IS AUTHORIZED BY THIS ACT.**
> **Corruption detection/recovery behavior remains an implementation or separately governed decision.**
> **This does not authorize silently discarding Watchlist state because it cannot be parsed or validated.**

## 13. D10 — DEFERRED / SG-5 DEPENDENCY (explicitly NOT resolved)

> **DO NOT RESOLVE D10 IN THIS ACT.**
> **EXACT RUNTIME PRINCIPAL IDENTIFIER = UNRESOLVED**
> **Ownership/principal lifecycle is explicitly DEFERRED to SG-5 and must remain unresolved until the identity/principal governance permits a valid determination.**

No `companyId`/`tenantId`/`ANONYMOUS_SESSION`/`IIPS_OFFLINE_BOOTSTRAP`/generated UUID/
account ID/credential/token/Keycloak identity was substituted. D10 is recorded as an
open dependency; **this act claims NO D10 resolution.**

## 14. EXACT MECHANISM (preserved)

> **SELECTED MECHANISM: browser localStorage** (`bcb3dac`) — unchanged; not reconsidered.

## 15. EXACT STATE BOUNDARY (unchanged; SG-3 scope is exactly this)

This act applies only to Watchlists list state:
- list definitions
- list identity/name/ordering
- membership references by canonical companyId
- mutation provenance/audit metadata

**Not extended to:** triggers · score-change history · alerts · research results ·
portfolio holdings · securities master data · tenant state · credentials ·
authentication state · Dhan/NSE production data · server/cloud state.

## 16. OWNER / ENVIRONMENT / DURABILITY BOUNDARIES (preserved)

- Owner scope: `PERSONAL APPLICATION PRINCIPAL / SINGLE-USER LOCAL OWNERSHIP` — verbatim.
- Environment: LOCAL · PERSONAL · SINGLE-USER · NON_PRODUCTION /
  LOCAL_FIXTURE_AND_OFFLINE_DEV · NON-SHARED · NON-DEPLOYED — unchanged.
- Durability: **DURABLE** (`146c97f`) preserved — **not** reinterpreted as a TTL,
  expiration period, browser retention guarantee, or indefinite physical-storage
  guarantee.

## 17. APPLICATION RETENTION POLICY vs BROWSER TECHNICAL PERSISTENCE (distinction)

> This act governs **application lifecycle policy only**. It does **NOT** guarantee
> that a browser will physically preserve `localStorage` against: user clearing site
> data · browser administration · browser/platform behavior · profile deletion ·
> operating-system events · other external browser mechanisms. Those are
> **environmental/technical realities, not application retention policy**, and under
> D5 they must never be represented as intentional application lifecycle operations
> or fabricated as authorized deletion events.

## 18. EXPLICIT EXCLUSIONS (absolute)

No TTL/expiry/stale-deletion rule introduced (D1/D2 negative designations are policy
content from the Authority, not a manufactured period) · no automatic cleanup/archival/
deletion (D3/D6) · no retention-driven replacement/version pruning (D7) · no
retention-driven migration/purge (D8) · no corruption-driven automatic deletion or
silent discard (D9) · no D10 resolution (§13) · no SG-2 reopening (D4 preserved, §7) ·
no DURABLE reinterpretation (§16) · no mechanism change (§14) · no boundary extension
(§15) · SG-4/SG-5 transport/auth/tenant/production all CLOSED · D115 canonical block
unchanged · no expiration/cleanup/archival/migration/corruption/schema/key/dependency/
UI/transport/authentication/tracker/spec/donor/production change.

## 19. NO IMPLEMENTATION AUTHORITY GRANTED (explicit)

> **This act grants NO implementation authority.** It designates retention/lifecycle
> **policy only** — when lifecycle-changing operations are permitted — and authorizes
> no code, no storage operation, no schema, no migration, no UI, nothing executable.
> Sole repository change: this governance evidence artifact.

## 20. NEXT SINGLE GOVERNANCE PREREQUISITE

> **SG-4 — trigger/score-change persistence gate**: a separate state-domain authority
> question (trigger/alert/score-change rule or history persistence), closed by
> `d01bc97` §4–§5 and additionally dependent on the P07/P11/P12 engine data planes
> (`P13-07` deps). SG-5 (runtime principal identifier — including the D10
> ownership/principal-lifecycle determination deferred by this act), transport,
> authentication, and implementation remain independently and separately gated
> (CLOSED). **SG-4 is not opened by this act.**

---

## GOVERNANCE SEQUENCING (recorded; next gate NOT performed)

```
Product-surface designation      ✅  35acb91
Durability = DURABLE             ✅  146c97f
Identity/ownership scope         ✅  2cfd8a4   (identifier UNRESOLVED)
Persistence authority            ✅  d01bc97   (capability; sub-gates)
SG-1 mechanism designation       ✅  bcb3dac   (browser localStorage)
SG-2 semantics designation       ✅  35a80f8   (CREATE/WRITE/UPDATE/DELETE/RESET)
SG-3 retention gate              📋  c31dcda   (UNRESOLVED — prerequisite named)
SG-3 retention designation       ✅  THIS ACT (D1–D9 designated; D10 DEFERRED→SG-5)
SG-4 trigger/score persistence   ←  NEXT SINGLE GATE (separate state domain; CLOSED)
SG-5 runtime principal id        ←  bounded identity/runtime step (CLOSED; D10 open)
Transport authority              ←  later separate gate (CLOSED)
Implementation authorization     ←  later separate authority-controlled act (CLOSED)
```

## VALIDATION (targeted, governance-only)

- Sole repository change: ADD of this act file. Zero code/storage/transport/identity/
  config/dependency/UI/tracker/spec/donor/production changes. No build/test executed.
- Antecedent strings verified from commit objects after fresh fetch (wrap-tolerant
  where prose wraps); all D1–D10 tokens recorded verbatim from the instruction.

## DURABILITY CHECKPOINT

| Step | Result |
| --- | --- |
| Exact diff reviewed | only this act file added |
| Code/storage/transport/identity/config/dependency/production changes | none |
| Commit | (SHA in final report / git log) |
| Push to `arena/01a0e30c-iips-production-market-data` | completed |
| Re-fetch; LOCAL == REMOTE; commit reachable from authoritative branch | verified |
| Worktree CLEAN; delta sole artifact; no unrelated files changed | verified |

---

## OUTCOME

# **A — RETENTION/LIFECYCLE AUTHORITY ESTABLISHED**
# D1 = indefinite application retention until authorized delete/reset
# D2 = no automatic expiry/stale deletion
# D3 = no automatic lifecycle cleanup
# D4 = explicit delete/reset preserved
# D5 = browser-mediated loss is not an application lifecycle operation
# D6 = no archival lifecycle
# D7 = no retention-driven replacement/version pruning
# D8 = no retention-driven migration/purge
# D9 = no corruption-driven automatic deletion
# D10 = explicitly deferred to SG-5
# — explicit authority decisions supplied by RAMKI; recorded verbatim, unmodified.
# **Next single gate: SG-4 trigger/score-change persistence. STOPPED.**
