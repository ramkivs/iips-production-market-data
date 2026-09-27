# Institutional Investment Platform System (IIPS)
# WATCHLISTS — SG-1 STORAGE-MECHANISM DESIGNATION: AUTHORITY ACT

**Act ID:** `watchlists-sg1-storage-mechanism-designation-2026-09-27-002`
**Act Type:** AUTHORITY ACT — STORAGE-MECHANISM DESIGNATION (non-executable; **this act
authorizes NO persistence implementation, NO storage initialization, NO transport**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Designating Authority:** RAMKI
**Recording Agent:** Arena (recording only)
**Selection Basis:** explicit Designating-Authority instruction received for this gate —
the exact verbatim token `SELECTED MECHANISM: browser localStorage` — recorded as
received. The Recording Agent **selected nothing and inferred nothing**: the selection is
not derived from technical convenience, existing code, existing dependencies, browser
capability, donor implementation, prior architectural patterns, or repository evidence.
The prior BLOCKED state (`d2f5174`) named exactly one prerequisite — an explicit
Designating-Authority selection token — and this instruction supplied it verbatim
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Recorded At (UTC):** 2026-09-27
**Antecedent Checkpoint:** `d2f5174c7e5e870a8d3968a240f1f25dcf2e4c88`

---

## 1. AUTHORITATIVE BASELINE (verified fail-closed before this act)

| Item | Value | Verified |
| --- | --- | --- |
| Branch / HEAD (pre-act) | `arena/01a0e30c-iips-production-market-data` @ `d2f5174…4c88` | ✓ |
| LOCAL == REMOTE | fresh fetch (explicit tracking refspec) → `refs/remotes/origin/arena/…` == `HEAD` | ✓ |
| Worktree (pre-act) | CLEAN | ✓ |
| Reflog / re-clone | reflog head = local commits `d2f5174`, `91dc3fe`, `d01bc97` → workspace persistent; **no fresh re-clone / no history replacement** | ✓ |

## 2. ANTECEDENT VERIFICATION (from commit objects and artifact contents)

| Antecedent | Verified content | Result |
| --- | --- | --- |
| Chain `1fff0c4` → `d2f5174` | all 10 governance commits ancestors of HEAD | ✓ |
| Product-surface designation `35acb91` | AUTHORITY_DESIGNATION act + strings | ✓ |
| Durability classification `146c97f` | `WATCHLISTS DURABILITY CLASSIFICATION = DURABLE` | ✓ |
| Identity/ownership designation `2cfd8a4` | `PERSONAL APPLICATION PRINCIPAL / SINGLE-USER LOCAL OWNERSHIP` + `EXACT RUNTIME PRINCIPAL IDENTIFIER = UNRESOLVED` | ✓ |
| Persistence authority `d01bc97` | `PERSISTENCE AUTHORITY = ESTABLISHED WITH EXPLICIT SUB-GATES`; §4 state boundary verbatim | ✓ |
| SG-1 classification gate `91dc3fe` | `C — STORAGE TECHNOLOGY UNRESOLVED`; missing element = explicit Designating-Authority mechanism selection | ✓ |
| SG-1 designation attempt `d2f5174` | `B — STORAGE MECHANISM DESIGNATION BLOCKED`; `NONE — NO MECHANISM WAS, OR COULD LAWFULLY BE, SELECTED`; missing selection-token finding | ✓ |
| Authority input (this gate) | explicit token `SELECTED MECHANISM: browser localStorage` — RAMKI | ✓ received |

No antecedent absent, altered, ambiguous, non-authoritative, or inconsistent. No prior
assistant output was used as evidence of repository state. The BLOCKED record and the
UNRESOLVED gate record **stand unmodified as history**; this act resolves the exact
prerequisite they named and supersedes the blocked/unresolved SG-1 state going forward.

## 3. DESIGNATING AUTHORITY

**RAMKI** — Designating Authority = RAMKI, unchanged. This act records the Authority's
selection; it neither creates nor moves any authority.

## 4. AUTHORITY DECISION RECORDED (exact verbatim selection)

> ## **SELECTED MECHANISM: browser localStorage**
>
> — explicit selection by RAMKI, Designating Authority, for the bounded durable
> Watchlists list-state boundary of §5 within the owner/environment boundary of §6–§7.

**Recorded exactly as instructed: not reinterpreted, not substituted, not broadened,
not second-guessed.** The phrase "browser localStorage" denotes the browser-standard
`localStorage` mechanism class as named by the instruction; no vendor, wrapper,
library, or implementation form is chosen by this act (implementation is not
authorized — §8, §11). **SG-1 = STORAGE MECHANISM DESIGNATED; mechanism = browser
localStorage.**

## 5. EXACT WATCHLISTS STATE BOUNDARY (mechanism scope — preserved from `d01bc97` §4)

The designated mechanism applies **only** to Watchlists **list state**:
(i) list definitions — list identity/name/ordering;
(ii) membership references to governed securities by canonical companyId
(security-identification only, never security ownership);
(iii) mutation provenance/audit metadata.

**Not authorized for this mechanism:** triggers · score-change history · alerts ·
research results · portfolio holdings · securities master data · tenant state ·
credentials/tokens · authentication state · Dhan/NSE production data · server/cloud
state · any unrelated product state. No boundary expansion occurred.

## 6. OWNER BOUNDARY (preserved exactly)

- Owner scope: `PERSONAL APPLICATION PRINCIPAL / SINGLE-USER LOCAL OWNERSHIP` — verbatim from `2cfd8a4`.
- `EXACT RUNTIME PRINCIPAL IDENTIFIER = UNRESOLVED` — verbatim; **this act does NOT
  resolve SG-5**; no `companyId` / `tenantId` / `ANONYMOUS_SESSION` /
  `IIPS_OFFLINE_BOOTSTRAP` / generated UUID / account ID / credential/token /
  donor Keycloak identity was substituted.

## 7. ENVIRONMENT BOUNDARY (preserved exactly)

LOCAL · PERSONAL · SINGLE-USER · **NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV** ·
NON-SHARED · NON-DEPLOYED — unchanged. Browser `localStorage` is recorded within this
boundary as a browser-local, single-user, per-origin mechanism class; **no server,
cloud, network, production service, authentication infrastructure, or deployment
authority is introduced** by this act. Durability consistency: the DURABLE
classification (`146c97f`) requires survival beyond an ephemeral process/session;
within the designated environment, browser `localStorage` is the Authority-selected
mechanism carrying that classification. This sentence records alignment with the
standing classification only — it was **not** a selection basis (§ selection basis).

## 8. WHY THIS IS AN AUTHORITY DESIGNATION, NOT IMPLEMENTATION

Framework precedent (BI-07/BI-08 charters; `bi07-final-certification`): authority
precedes implementation; certification follows separately. This act names **what
governed mechanism class may hold** the bounded state. It decides nothing about
**how** — and grants nothing operational:

- `localStorage` itself is **not** authorization to implement; designation ≠ build
  authority (`d01bc97` §6: technical capability ≠ authority; designation ≠
  implementation).
- No operational semantics (SG-2), retention (SG-3), identity runtime (SG-5),
  transport, authentication, or production authority flows from this designation.

## 9. MECHANISMS EXPLICITLY NOT SELECTED

| Mechanism | Status |
| --- | --- |
| In-memory / session mechanism | **NOT selected** — prohibited by the DURABLE classification and by the governing instructions |
| `sessionStorage` | **NOT selected** — session-scoped; fails DURABLE |
| IndexedDB | **NOT selected** — valid candidate class; not chosen by the Authority |
| Filesystem / local file | **NOT selected** — valid candidate class; not chosen |
| SQLite / local database | **NOT selected** — valid candidate class; not chosen |
| Any other mechanism | **NOT selected** — only `browser localStorage` carries the designation |
| Server / cloud / network / API persistence | **NOT selected** — excluded absolutely by the environment boundary |
| Existing primitives (`PortfolioStore`, `PointInTimeStore`, `IdentityMappingStore`, provenance/serialization) | **NOT promoted** — unchanged per `d01bc97` §6 |

## 10. SG-2 THROUGH SG-5 AND MECHANISM-SPECIFIC MATTERS — ALL REMAIN CLOSED

- **SG-2** create/write/update/delete/reset operational semantics — **CLOSED**; not
  established by this act; no lifecycle invented.
- **SG-3** retention/lifecycle policy — **CLOSED**; follows SG-2 per framework
  precedent (operational invariants are defined with the mechanism's operational act).
- **SG-4** trigger/score-change persistence — **CLOSED**; separate state domain
  (`d01bc97` §4), also dependent on P07/P11/P12 data planes per `P13-07`.
- **SG-5** exact runtime principal identifier — **CLOSED**; `UNRESOLVED` preserved
  verbatim (§6). Whether/when any key structure binds to a runtime identity is a later
  governed question; this act decides no principal binding.
- **Mechanism-specific matters explicitly NOT decided here** (later governed gates or
  implementation; none invented): key naming · serialization schema · versioning ·
  migration strategy · initialization behavior · write/update/delete semantics ·
  retention/expiry · reset semantics · concurrency semantics · corruption handling ·
  quota handling · principal-binding implementation · provenance implementation.
- Transport · authentication · tenant ownership · production eligibility ·
  implementation — all **CLOSED**; D115 canonical block unchanged (C/D UNRESOLVED,
  runtimeCompanyId UNRESOLVED, implementationAuthority WITHHELD, productionEligible
  false, production activation NOT AUTHORIZED).

## 11. NO IMPLEMENTATION AUTHORITY (explicit statement)

> **This act grants NO implementation authority.** No `localStorage` initialization,
> no `localStorage` writes, no persistence code, no schema, no migration, no
> dependency, no application-code, no UI, no tracker/spec, no donor, no transport, no
> authentication, and no production change is authorized. The sole repository change
> of this act is this governance evidence artifact.

## 12. NEXT SINGLE GOVERNANCE PREREQUISITE

> **SG-2 — operational-semantics authority act for the designated mechanism**:
> create/write/update/delete/reset semantics for browser `localStorage` within the
> bounded Watchlists list-state boundary, designated by explicit authority (no
> semantics may be invented; framework precedent defines them with the mechanism's
> operational act). SG-3 (retention/lifecycle) follows SG-2. SG-5 opens only if a
> later governed key structure would bind to a runtime identity. SG-4, transport, and
> implementation remain independently gated. **SG-2 is not opened by this act.**

---

## GOVERNANCE SEQUENCING (recorded; next gate NOT performed)

```
Product-surface designation      ✅  35acb91
Durability = DURABLE             ✅  146c97f   (classification only)
Identity/ownership scope         ✅  2cfd8a4   (scope; identifier UNRESOLVED)
Persistence authority            ✅  d01bc97   (capability; sub-gates)
SG-1 classification              ✅  91dc3fe   (UNRESOLVED — prerequisite named)
SG-1 designation attempt         📋  d2f5174   (BLOCKED — token absent)
SG-1 mechanism designation       ✅  THIS ACT (browser localStorage DESIGNATED)
SG-2 operational semantics       ←  NEXT SINGLE GATE (CLOSED)
SG-3 retention/lifecycle         ←  following SG-2 (CLOSED)
SG-4 trigger/score persistence   ←  separate state-domain gate (CLOSED)
SG-5 runtime principal id        ←  bounded identity/runtime step (CLOSED)
Transport authority              ←  later separate gate (CLOSED)
Implementation authorization     ←  later separate authority-controlled act (CLOSED)
```

## VALIDATION (targeted, governance-only)

- Sole repository change: ADD of this act file. Zero application, persistence,
  storage-initialization, transport, identity/authentication, configuration,
  dependency, UI, tracker/spec, donor, or production-boundary changes. No build or
  test suite executed (non-executable act).
- All antecedent strings verified from commit objects after fresh fetch; the
  selection token recorded verbatim from the Designating-Authority instruction;
  nothing inferred by the Recording Agent.

## DURABILITY CHECKPOINT

| Step | Result |
| --- | --- |
| Exact diff reviewed | only this act file added |
| Application/persistence/storage/transport/identity/config/dependency/production changes | none |
| Commit | (SHA in final report / git log) |
| Push to `arena/01a0e30c-iips-production-market-data` | completed |
| Re-fetch; LOCAL == REMOTE; commit reachable from authoritative branch | verified |
| Worktree CLEAN; delta sole artifact; no unrelated files changed | verified |

---

## OUTCOME

# **A — STORAGE MECHANISM DESIGNATED**
# **SELECTED MECHANISM: browser localStorage**
# Designating Authority = RAMKI · Scope = bounded durable Watchlists list-state boundary.
# SG-2 / SG-3 / SG-4 / SG-5 / transport / implementation: all remain CLOSED.
# **Next single gate: SG-2 operational-semantics authority act. STOPPED.**
