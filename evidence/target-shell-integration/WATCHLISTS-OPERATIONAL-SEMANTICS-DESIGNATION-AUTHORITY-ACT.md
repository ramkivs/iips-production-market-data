# Institutional Investment Platform System (IIPS)
# WATCHLISTS — SG-2 OPERATIONAL-SEMANTICS DESIGNATION: AUTHORITY ACT

**Act ID:** `watchlists-sg2-operational-semantics-designation-2026-09-27-001`
**Act Type:** AUTHORITY ACT — OPERATIONAL-SEMANTICS DESIGNATION (non-executable;
**this act authorizes NO persistence implementation, NO storage initialization, NO
transport**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Designating Authority:** RAMKI
**Recording Agent:** Arena (recording only)
**Selection Basis:** explicit Designating-Authority instruction received for this gate
containing the complete SG-2 operative decision tokens for CREATE / WRITE / UPDATE /
DELETE / RESET-CLEAR — recorded **verbatim, without modification, reinterpretation,
weakening, strengthening, or substitution**. The analytic prerequisite named by
`f5f7608` (an explicit Designating-Authority SG-2 operational-semantics selection) is
hereby supplied. Nothing is inferred from existing code; the semantics are authority
decisions supplied by RAMKI
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Recorded At (UTC):** 2026-09-27
**Antecedent Checkpoint:** `f5f76084fae9e46d89e46e6561ce74125c99abfd`

---

## 1. AUTHORITATIVE BASELINE (verified fail-closed before this act)

| Item | Value | Verified |
| --- | --- | --- |
| Branch / HEAD (pre-act) | `arena/01a0e30c-iips-production-market-data` @ `f5f7608…99abfd` | ✓ |
| LOCAL == REMOTE | fresh fetch (explicit tracking refspec) → `refs/remotes/origin/arena/…` == `HEAD` | ✓ |
| Worktree / reflog | CLEAN; reflog head = local commits `f5f7608`, `bcb3dac`, `d2f5174`, `91dc3fe` → workspace persistent; **no re-clone / no history replacement** | ✓ |

## 2. ANTECEDENT VERIFICATION (from commit objects)

| Antecedent | Verified content | Result |
| --- | --- | --- |
| Chain `1fff0c4` … `f5f7608` | all 12 commits ancestors of HEAD | ✓ |
| SG-1 designation `bcb3dac` | `A — STORAGE MECHANISM DESIGNATED`; `SELECTED MECHANISM: browser localStorage` | ✓ |
| SG-2 gate record `f5f7608` | `C — OPERATIONAL SEMANTICS UNRESOLVED`; prerequisite = explicit Designating-Authority SG-2 selection; BI-07/BI-08/BI-04 findings (scoped to other domains; not promoted) | ✓ |
| Persistence authority `d01bc97` | `PERSISTENCE AUTHORITY = ESTABLISHED WITH EXPLICIT SUB-GATES`; §4 state boundary verbatim | ✓ |
| Identity/ownership `2cfd8a4` | `PERSONAL APPLICATION PRINCIPAL / SINGLE-USER LOCAL OWNERSHIP` + `EXACT RUNTIME PRINCIPAL IDENTIFIER = UNRESOLVED` | ✓ |

The UNRESOLVED gate record stands unmodified as history; this act supplies the exact
prerequisite it named and supersedes the SG-2 unresolved state going forward.

## 3. DESIGNATING AUTHORITY

**RAMKI** — Designating Authority = RAMKI, unchanged.

## 4. EXACT MECHANISM (preserved; not reconsidered)

> **SELECTED MECHANISM: browser localStorage** (`bcb3dac`) — unchanged.

No IndexedDB / sessionStorage / filesystem / SQLite / server / cloud / network
persistence / other mechanism is introduced by this act.

## 5. EXACT STATE BOUNDARY (unchanged)

SG-2 applies only to **Watchlists list state**: list definitions (list
identity/name/ordering) · membership references to governed securities by canonical
companyId · mutation provenance/audit metadata. **Not authorized:** triggers ·
score-change history · alerts · research results · portfolio holdings · securities
master data · tenant state · credentials · authentication · Dhan/NSE production data ·
server/cloud state.

## 6. CREATE SEMANTICS — DESIGNATED (verbatim authority decisions)

> 1. **A Watchlist is created as one complete list-state record.**
> 2. **Duplicate Watchlist identity is NOT permitted** within the bounded
>    single-user Watchlists state.
> 3. **An empty Watchlist IS valid and may be created.**

## 7. WRITE SEMANTICS — DESIGNATED (verbatim authority decisions)

> 1. **Persistence occurs only after a complete valid Watchlists state transition
>    has been formed.**
> 2. **Persistence MUST be atomic at the Watchlists state boundary: no partially
>    written Watchlists state is authorized.**
> 3. **A failed/incomplete state transition MUST NOT be treated as a successful
>    persisted Watchlists state.**

## 8. UPDATE SEMANTICS — DESIGNATED (verbatim authority decisions)

> 1. **Authorized mutable fields are limited to:** list name · list ordering ·
>    membership references by canonical companyId · authorized mutation
>    provenance/audit metadata.
> 2. **Membership and ordering MAY be changed through an authorized update.**
> 3. **An update MUST preserve the bounded Watchlists state boundary.**
> 4. **Mutation provenance/audit metadata MUST accompany an authorized mutation where
>    the implementation has the corresponding provenance capability.**
> 5. **No security identity ownership may be rewritten by a Watchlist update.**

## 9. DELETE SEMANTICS — DESIGNATED (verbatim authority decisions)

> 1. **Deletion of an individual Watchlist IS authorized.**
> 2. **Deletion is a hard removal** of that Watchlist from the persisted Watchlists
>    list state.
> 3. **The deletion itself is a governed mutation and MUST NOT expand the persisted
>    state boundary.**
> 4. **Mutation provenance/audit metadata applies to the deletion event where the
>    implementation has the corresponding provenance capability.**

## 10. RESET / CLEAR SEMANTICS — DESIGNATED (verbatim authority decisions)

> 1. **Explicit reset/clear of the bounded Watchlists list state IS authorized.**
> 2. **Reset means removal of all persisted Watchlist list-state records within the
>    bounded Watchlists domain.**
> 3. **Reset is distinct from deleting one Watchlist.**
> 4. **Reset MUST be an explicit operation and MUST NOT occur implicitly merely
>    because the application starts, reloads, or encounters an empty state.**

## 11. ATOMICITY DETERMINATION

**Atomic full-state persistence at the Watchlists state boundary is EXPLICITLY
DESIGNATED** by §7 decisions 2–3 (complete-transition-only persistence; no partial
state; failure ≠ persisted success). This atomicity exists **because RAMKI designated
it for this Watchlists domain** — it is recorded as this domain's designated
invariant. It is **not** claimed as a transfer of BI-07's portfolio-domain "Atomic
Persistence Boundary" (which remains scoped to the portfolio domain).

## 12. PROVENANCE DETERMINATION

- Mutation provenance/audit metadata **is part of the authorized state boundary**
  (`d01bc97` §4) and its recording at mutation time is **explicitly designated** by
  §8 decision 4 and §9 decision 4 — **governed to the stated extent**: where the
  implementation has the corresponding provenance capability.
- The **exact provenance schema is NOT decided** by this act (§14).
- **No BI-08 content-hash idempotency algorithm, hash field, retry algorithm, or
  deduplication implementation is inferred** from this act; BI-08 remains scoped to
  broker-CSV portfolio ingress. If mutation idempotency (e.g., retry safety) is
  required, its algorithm is recorded as **implementation detail / later sub-gate**
  (§14), not invented here.

## 13. FRAMEWORK-PRECEDENT HANDLING (explicit statement)

> **BI-07, BI-08, and BI-04 were NOT automatically promoted to Watchlists.** The
> `f5f7608` findings stand: BI-07 atomic persistence = portfolio-domain authority;
> BI-08 idempotency = broker-file ingress scope; BI-04 atomic merge = DEFAULT_PORTFOLIO
> scope. The SG-2 operational semantics recorded in §6–§10 are authorized **solely
> because RAMKI explicitly designated them for this Watchlists domain** in this act.
> Where a designated semantic resembles a precedent (e.g., atomicity, explicit reset
> distinct from delete), the resemblance is recorded as the framework's charter-bundle
> pattern being exercised for this domain by direct authority — not as inheritance.

## 14. EXACT UNRESOLVED IMPLEMENTATION DETAILS (not decided by this act)

localStorage **key name / key namespace** · **serialization format** ·
**schema/version** · **migration format** · **exact provenance schema** ·
**principal-binding key structure** · runtime principal identifier (SG-5 — §15) ·
**corruption recovery algorithm** · **quota handling** · **concurrency algorithm** ·
**mutation idempotency algorithm** (retry/dedup mechanics — §12) · **UI behavior** ·
**transport contract**. Those remain separate implementation/mechanism-detail
questions; none is invented here.

## 15. SG-3 / SG-4 / SG-5 REMAIN SEPARATE

- **SG-3** retention/lifecycle — **CLOSED** (not established; no expiry/retention
  policy invented; create/write/delete/reset semantics designated here ≠ retention).
- **SG-4** trigger/score-change persistence — **CLOSED**; separate state domain with
  P07/P11/P12 data-plane dependencies.
- **SG-5** exact runtime principal identifier — **CLOSED**; `EXACT RUNTIME PRINCIPAL
  IDENTIFIER = UNRESOLVED` preserved verbatim; these SG-2 decisions do NOT resolve
  SG-5; no `companyId`/`tenantId`/`ANONYMOUS_SESSION`/`IIPS_OFFLINE_BOOTSTRAP`/UUID/
  account ID/credential/Keycloak substitution. Owner scope: `PERSONAL APPLICATION
  PRINCIPAL / SINGLE-USER LOCAL OWNERSHIP` — preserved verbatim. Environment:
  LOCAL · PERSONAL · SINGLE-USER · NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV ·
  NON-SHARED · NON-DEPLOYED — unchanged. D115 canonical block unchanged.

## 16. IMPLEMENTATION AUTHORITY REMAINS CLOSED (explicit)

> **This act grants NO implementation authority.** No application-code changes, no
> `localStorage` writes, no storage initialization, no persistence implementation, no
> schema/migration changes, no dependency changes, no transport changes, no
> authentication changes, no UI changes, no tracker/spec changes, no donor imports, no
> production changes. The designated semantics are **authority content only**; how
> they are encoded is implementation, gated separately. Sole repository change: this
> governance evidence artifact.

## 17. NEXT SINGLE GOVERNANCE PREREQUISITE

> **SG-3 — retention/lifecycle authority act** for the bounded Watchlists list-state
> boundary on the designated mechanism: an explicit Designating-Authority decision on
> retention/lifecycle policy (none may be invented). SG-4, SG-5, transport,
> authentication, and implementation remain independently and separately gated
> (CLOSED). **SG-3 is not opened by this act.**

---

## GOVERNANCE SEQUENCING (recorded; next gate NOT performed)

```
Product-surface designation      ✅  35acb91
Durability = DURABLE             ✅  146c97f
Identity/ownership scope         ✅  2cfd8a4   (identifier UNRESOLVED)
Persistence authority            ✅  d01bc97   (capability; sub-gates)
SG-1 mechanism designation       ✅  bcb3dac   (browser localStorage)
SG-2 semantics gate              📋  f5f7608   (UNRESOLVED — prerequisite named)
SG-2 semantics designation       ✅  THIS ACT (CREATE/WRITE/UPDATE/DELETE/RESET designated)
SG-3 retention/lifecycle         ←  NEXT SINGLE GATE (CLOSED)
SG-4 trigger/score persistence   ←  separate state-domain gate (CLOSED)
SG-5 runtime principal id        ←  bounded identity/runtime step (CLOSED)
Transport authority              ←  later separate gate (CLOSED)
Implementation authorization     ←  later separate authority-controlled act (CLOSED)
```

## VALIDATION (targeted, governance-only)

- Sole repository change: ADD of this act file. Zero application, storage,
  persistence, transport, identity/authentication, configuration, dependency, UI,
  tracker/spec, donor, or production-boundary changes. No build/test executed.
- All antecedent strings verified from commit objects after fresh fetch; the five
  family decision sets recorded verbatim from the Designating-Authority instruction.

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

# **A — OPERATIONAL SEMANTICS ESTABLISHED**
# CREATE = designated · WRITE = designated · UPDATE = designated ·
# DELETE = designated · RESET/CLEAR = designated
# — explicit authority decisions supplied by RAMKI for the bounded durable Watchlists
# list-state boundary on browser localStorage; recorded verbatim, not inferred from code.
# SG-3 / SG-4 / SG-5 / transport / implementation: all remain CLOSED.
# **Next single gate: SG-3 retention/lifecycle. STOPPED.**
