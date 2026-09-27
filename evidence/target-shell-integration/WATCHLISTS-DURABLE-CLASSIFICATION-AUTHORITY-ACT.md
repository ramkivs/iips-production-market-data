# Institutional Investment Platform System (IIPS)
# WATCHLISTS — DURABILITY CLASSIFICATION = DURABLE: AUTHORITY ACT

**Act ID:** `watchlists-durability-durable-classification-2026-09-27-001`
**Act Type:** AUTHORITY ACT — DURABILITY CLASSIFICATION (non-executable; **this act authorizes
NO implementation, persistence, or state of any kind**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Designating Authority:** RAMKI
**Explicit Selection (verbatim authority instruction for this act):**
> **WATCHLISTS DURABILITY CLASSIFICATION = DURABLE**
**Selected By:** RAMKI (explicit — no inference; closes the missing element recorded by the
preceding classification gate)
**Recording Agent:** Arena (recording only)
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Recorded At (UTC):** 2026-09-27
**Antecedent Checkpoint:** `bd9efbf48a23f2f19f8f5926daae79504526c5a9`

---

## 1. ANTECEDENT STATE (verified fail-closed before this act)

| Item | Value | Verified |
| --- | --- | --- |
| Authoritative remote main | `origin/main` = `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | ✓ |
| Recording branch | `arena/01a0e30c-iips-production-market-data` | ✓ |
| HEAD (pre-act) | `bd9efbf48a23f2f19f8f5926daae79504526c5a9` | ✓ |
| LOCAL == REMOTE (branch, pre-act) | `ls-remote` == HEAD | ✓ |
| Worktree (pre-act) | CLEAN | ✓ |
| Antecedent 1 — forensic assessment | `NP12-WATCHLISTS-FORENSIC-ASSESSMENT.md` @ `1fff0c4` | ✓ present |
| Antecedent 2 — PIT governance decision | `WATCHLISTS-PERSISTENCE-IDENTITY-TRANSPORT-GOVERNANCE-DECISION.md` @ `5c6aea9` (governance remains unresolved) | ✓ present |
| Antecedent 3 — product-surface designation | `WATCHLISTS-PRODUCT-SURFACE-DESIGNATION-AUTHORITY-ACT.md` @ `35acb91` (DESIGNATION ESTABLISHED, no implementation authority) | ✓ present; commit object verified |
| Antecedent 4 — classification gate | `WATCHLISTS-DURABILITY-CLASSIFICATION-GATE-RECORD.md` @ `bd9efbf` → `DURABILITY CLASSIFICATION = UNRESOLVED`; missing element named: *"an explicit durability-classification selection by the Designating Authority"* | ✓ present; commit object verified; result string confirmed |
| `/watchlists` surface | structural fail-closed placeholder — unchanged by this act | ✓ |

**Chain integrity:** the exact missing authority element recorded at `bd9efbf` §10 — an
explicit SESSION-scoped-or-DURABLE selection by the Designating Authority — is the element
this act records. The classification question is **not reopened**; the unresolved state
recorded at `bd9efbf` is now resolved by explicit selection.

## 2. AUTHORITY DECISION RECORDED

> ### **WATCHLISTS DURABILITY CLASSIFICATION = `DURABLE`**
> ### (intended Watchlists state is governed as durable/persistent state, not
> ### session/process-lifetime-only state)
> **Selected by:** RAMKI — explicit authority selection; recorded without reinterpretation.
> This classification is **not** downgraded to session scope on account of the current
> absence of durable implementation mechanisms, and the classification question is **not
> reopened** by this act.

### 2.1 Scope of the classification

The classification applies to the **designated Watchlists product surface/workstream only**
(donor surface #30 / route `/watchlists` / tracker `P13-07`, `INT-011`), as designated by
`watchlists-product-surface-designation-2026-09-27-001`. It classifies the *kind of state*
Watchlists is governed to be; it reconciles and adopts the recorded program requirement
(*"Persistent lists, triggers, score changes"*, master spec surface inventory; `P13-07`
requirement text) as the governing durability semantics for that surface.

### 2.2 Classification ≠ implementation authority (explicit standing distinction)

This act establishes **durability classification only**. It does **NOT** authorize any
mechanism by which durable state would be realized. The distinction between *what kind of
state Watchlists is governed to be* and *authority to build it* is preserved verbatim from
the framework (designation acts authorize no implementation by themselves; each mechanism
layer requires its own subsequent authority gate).

## 3. EXPLICIT EXCLUSIONS (absolute — none of the following is authorized)

**No persistence implementation:** no database selection; no browser storage; no filesystem
storage; no server storage; no API persistence; no persistence adapter; no Watchlist store;
no Watchlist state object, DTO, fixture, or model; no write operations; no retention
implementation; no deletion implementation; no reset implementation; no synchronization;
no background triggers; no alerts; no score-change processing.

**No identity/ownership (§…D115 boundary preserved):** D115 remains **unchanged**;
D115 C **remains UNRESOLVED**; D115 D **remains UNRESOLVED**; `runtimeCompanyId` remains
UNRESOLVED; `ANONYMOUS_SESSION` remains display-only; **no user principal** is created;
**no tenant authority** is created; **no ownership mapping** is created; no authentication;
no authorization semantics. Durable classification does **not** establish *who owns* the
durable Watchlist state.

**No persistence promotion:** `PortfolioStore`, `PointInTimeStore`, `IdentityMappingStore`,
and the provenance/serialization primitives are **not** promoted into Watchlist persistence
authority. They remain citable architectural evidence only; none becomes authorized
persistence because durability is now classified. **Durable classification has been
established; persistence authority has NOT been established.**

**No transport:** no P12 Watchlist DTOs; no API routes; no `/api/watchlists`; no server
actions; no RPC; no WebSocket/EventSource; no network calls; no donor `authFetch`; no
Keycloak integration. The PHASE5 offline/network exclusion remains in force absolutely.
Transport remains a later governed decision.

**No production expansion:** `productionEligible: false` stands; the non-production /
local-qualification boundary stands; no production provider entitlement; no NSE
authorization; no Dhan production authorization; no OIDC/Keycloak activation; no
operator-drop changes; no P12 contract changes.

**No surface/program-record changes:** no change to the `/watchlists` structural
placeholder, routes, navigation, statuses, `UnavailableSurface`, or UI registry; no donor
Watchlists import; no tracker/spec edits (`P13-07` remains NOT STARTED; `INT-011` remains
BASELINE — VERIFY); no unrelated product surfaces.

## 4. GOVERNANCE SEQUENCING (recorded; next gate NOT performed by this act)

```
Product-surface designation        ✅  35acb91  (DESIGNATION ESTABLISHED)
Durability classification          ✅  THIS ACT (DURABLE — classification only)
Identity/ownership scope           ←  NEXT SINGLE GOVERNANCE PREREQUISITE
Persistence authority              ←  later separate gate
Transport authority                ←  later separate gate
Implementation authorization       ←  later read-only pre-flight / implementation gate
Implementation                     ←  later separate authority-controlled act
```

**Next single governance prerequisite: identity/ownership scope for durable Watchlists
state** (who owns the durable state — user/tenant/principal scoping — with D115 as it
stands). This act does not perform it, does not skip to persistence, and authorizes none
of the later items.

## 5. VALIDATION (targeted, governance-only)

- Sole repository change: ADD of this authority act. No application code, tests, fixtures,
  contracts, DTOs, stores, persistence, transport, routes, navigation, UI registry,
  configuration, dependencies, migrations, server/API, identity, or authentication changes.
- No build or test suite executed; fail-closed antecedent verification performed (§1).
- The explicit selection is recorded verbatim; nothing reinterpreted, downgraded, or
  reopened; no authority inferred from program intent, donor behavior, technical
  convenience, or prior chat statements; technical mechanisms cited as evidence only.

## 6. DURABILITY CHECKPOINT

| Step | Result |
| --- | --- |
| Exact diff reviewed | only this act file added |
| Application/persistence/transport/identity/config changes | none |
| Commit | (SHA in final report / git log) |
| Push to `arena/01a0e30c-iips-production-market-data` | completed |
| Remote HEAD == local HEAD (post-push, `ls-remote`) | verified |
| Tracking state / clean worktree | verified |

---

## OUTCOME

# **WATCHLISTS DURABILITY CLASSIFICATION = `DURABLE`** — recorded by explicit
# Designating-Authority selection. **Classification only.** Persistence, identity/
# ownership, transport, implementation, and production remain unauthorized and unresolved.
# **Next gate: identity/ownership scope. STOPPED.**
