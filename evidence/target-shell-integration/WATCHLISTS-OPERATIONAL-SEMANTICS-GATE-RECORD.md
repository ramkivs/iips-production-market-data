# Institutional Investment Platform System (IIPS)
# WATCHLISTS — SG-2 OPERATIONAL SEMANTICS: AUTHORITY-ACT GATE RECORD

**Gate ID:** `watchlists-sg2-operational-semantics-2026-09-27-001`
**Gate Type:** AUTHORITY ACT — OPERATIONAL-SEMANTICS (non-executable, analytic;
**this gate authorizes NO operational semantics, NO persistence implementation, NO
storage initialization, NO transport**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Designating Authority:** RAMKI
**Recording Agent:** Arena (recording only)
**Selection Basis:** the authority instruction for this act is **analytic only** — it
carries **no explicit operational-semantics selection and no conditional directive**;
it directs inspection of existing governing records and prohibits manufacturing policy.
Per the standing selection-integrity rule (`bd9efbf`, `1650ef5`, `91dc3fe`, `d2f5174`),
where governing records establish no directly applicable authority and no explicit
selection is supplied, the gate HALTS on UNRESOLVED. No PortfolioStore (or any other
store) behavior was promoted into Watchlists policy; no invariant was assumed to
transfer across state domains; no policy was invented
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Recorded At (UTC):** 2026-09-27
**Antecedent Checkpoint:** `bcb3dac16862a072d4ca35c5ce232553ae27163f`

---

## 1. AUTHORITATIVE ANTECEDENTS (verified fail-closed, from repository objects)

| Item | Value | Verified |
| --- | --- | --- |
| Branch / HEAD (pre-act) | `arena/01a0e30c-iips-production-market-data` @ `bcb3dac…27163f` | ✓ |
| LOCAL == REMOTE | fresh fetch (explicit tracking refspec) → `refs/remotes/origin/arena/…` == `HEAD` == `bcb3dac` | ✓ |
| Worktree / reflog | CLEAN; reflog head = local commits `bcb3dac`, `d2f5174`, `91dc3fe`, `d01bc97` → workspace persistent; **no re-clone / no history replacement** | ✓ |
| Governance chain | `1fff0c4` … `bcb3dac` — all 11 commits ancestors of HEAD | ✓ |
| `bcb3dac` authoritative | act file present at that commit; `A — STORAGE MECHANISM DESIGNATED`; `SELECTED MECHANISM: browser localStorage` read from commit object | ✓ |
| State boundary verbatim | `list identity/name/ordering`; `membership references to governed securities by canonical companyId`; `mutation provenance/audit metadata` — confirmed in `bcb3dac` §5 / `d01bc97` §4 | ✓ |
| **SG-2 not already authorized** | `bcb3dac` §10: `SG-2** create/write/update/delete/reset operational semantics — **CLOSED`; `d01bc97` lifecycle status: `None is authorized now` | ✓ |

No antecedent absent, altered, ambiguous, non-authoritative, or inconsistent. No prior
assistant output was used as repository evidence.

## 2. EXACT MECHANISM (designated; not reconsidered)

**browser localStorage** (`bcb3dac`, outcome A). Not reconsidered, not replaced.
**Mechanism-conflict check (per instruction):** no existing governance rule makes any
secondary mechanism unavoidable — at the authority level the `localStorage` class
supports all five semantic families; what is absent is **authority selections**, not
mechanism capability. No IndexedDB / filesystem / SQLite / server / cloud / cookies /
sessionStorage / other mechanism was introduced; no conflict required a STOP.

## 3. EXACT STATE BOUNDARY (unchanged)

SG-2 would apply only to creating / writing-persisting / updating / deleting /
resetting **Watchlists list state**: list definitions (list identity/name/ordering) ·
membership references by canonical companyId · mutation provenance/audit metadata.
No expansion into triggers, score-change history, alerts, research results, portfolio
holdings, securities master data, tenant state, credentials, authentication, or
Dhan/NSE production data, or server/cloud persistence.

## 4. OWNER / ENVIRONMENT BOUNDARY (preserved exactly)

- Owner scope: `PERSONAL APPLICATION PRINCIPAL / SINGLE-USER LOCAL OWNERSHIP` — verbatim.
- `EXACT RUNTIME PRINCIPAL IDENTIFIER = UNRESOLVED` — verbatim; SG-5 untouched; no
  substitution of any kind (`companyId`/`tenantId`/`ANONYMOUS_SESSION`/
  `IIPS_OFFLINE_BOOTSTRAP`/UUID/account ID/credential/Keycloak).
- Environment: LOCAL · PERSONAL · SINGLE-USER · NON_PRODUCTION /
  LOCAL_FIXTURE_AND_OFFLINE_DEV · NON-SHARED · NON-DEPLOYED — unchanged.
- **Recorded dependency (per instruction):** any mutation semantic that would require an
  actual runtime principal identifier (e.g., actor-attributed mutation provenance,
  principal-bound storage keying) **depends on SG-5, which remains UNRESOLVED** —
  recorded as an unresolved dependency, not invented.

## 5–9. SEMANTIC FAMILIES — findings per family

Framework rule verified from records (`d01bc97` §2 row 5): operational invariants are
designated **inside the charter of each state domain, with its mechanism**; nothing
transfers automatically. For every family: **existing framework invariant = present
only in other domains; directly applicable Watchlists authority = none; technical
detail = out of scope; unresolved governance question = the family itself.**

### 5. CREATE — UNRESOLVED
- What constitutes creation of a Watchlist: **not designated anywhere** for this domain.
- Duplicate list identity/name permitted or prohibited: **no governing record**;
  portfolio precedent keys on `portfolioId`/DEFAULT_PORTFOLIO — domain-specific, not
  transferable.
- Empty list validity: BI-07's empty-state normalization + empty-write rejection are
  **portfolio-domain Save Guards**; no Watchlists rule exists.
- **UNRESOLVED — requires explicit designation.**

### 6. WRITE — UNRESOLVED
- When state may be persisted: no Watchlists write-trigger rule exists.
- Atomicity: the only designated atomic boundary is **BI-07's portfolio-domain**
  "Atomic Persistence Boundary"; it is not a generalized platform invariant and was
  **not** designated for Watchlists.
- Partial-state prohibition: no governing record for this boundary.
- **UNRESOLVED — requires explicit designation.**

### 7. UPDATE — UNRESOLVED
- Changeable fields: no designation (identity immutability vs rename/reorder rules
  undetermined).
- Membership/ordering mutability: no designation.
- Provenance accompaniment: the **state-content slot** for mutation provenance/audit
  metadata is already authorized (`d01bc97` §4); the **operational requirement** that
  each update attaches provenance is **not** designated. P01-05 provenance chain
  = architectural evidence only; not promoted.
- **UNRESOLVED — requires explicit designation.**

### 8. DELETE — UNRESOLVED
- Authorized at all: **no Watchlists record grants or denies delete**.
- Form (hard-delete vs governed alternative): no designation; no precedent defines a
  delete-form taxonomy applicable here.
- Provenance-on-delete: no designation (and any actor attribution would also depend
  on SG-5 — §4 recorded dependency).
- **UNRESOLVED — requires explicit designation.**

### 9. RESET / CLEAR — UNRESOLVED
- Authorized at all: BI-07 shows reset (`resetPortfolio`, `resetDefaultPortfolioStore`)
  exists **only as an explicitly chartered portfolio-domain utility** — precedent
  proving reset requires per-domain explicit authority, which Watchlists lacks.
- Distinct from delete: no designation.
- Requires explicit authority: per that precedent, **yes** — and none exists here.
- **UNRESOLVED — requires explicit designation.**

## 10. ATOMICITY / IDEMPOTENCY / PROVENANCE — DETERMINATION (from actual records)

| Invariant | Where designated (verified this gate) | Scope | Watchlists applicability |
| --- | --- | --- | --- |
| Atomic save boundary | `portfolio-store.ts` header — "Portfolio Domain Store & Atomic Persistence Boundary (BI-07)", `BI-07-AUTH-2026-01` | portfolio domain only | **None by transfer** — UNRESOLVED pending explicit designation |
| Save Guards (empty-write rejection; entity-authority check; weight-sum 100.0000%) | BI-07 charter/`portfolio-store.ts` | portfolio domain (weight-sum is a portfolio financial invariant, inapplicable by content) | **None** — not adoptable |
| Content-hash idempotency | `evidence/bi08/…` — "OPTION A — CONTENT-HASH IDEMPOTENCY (SELECTED)", scoped to `PortfolioStore.saveHoldings()` broker-CSV ingress | portfolio ingress dedup by file digest | **None by transfer** — list mutations are not file ingress; UNRESOLVED |
| Governed atomic merge | `evidence/bi04/…` `GOVERNED_MULTI_BROKER_ATOMIC_MERGE` — `DEFAULT_PORTFOLIO` consolidation | portfolio accumulation | **None** |
| Reset utilities | BI-07 charter bundle (`d01bc97` §2 row 4) | portfolio domain | **None — precedent shows reset needs explicit per-domain authority** |
| Mutation provenance content | `d01bc97` §4 | **THIS boundary** | **Authorized as state content only**; operational production rule UNRESOLVED |

**Framework-level finding (definitive):** in every precedent, operational invariants
were created by an **explicit Designating-Authority selection recorded in that domain's
charter** (BI-08: "OPTION A … (SELECTED)"; BI-07 charter fields). No generic/default
operational semantics exist anywhere in the framework. `d01bc97` rows 5/8: semantics
and retention are **defined with the mechanism** — i.e., this SG-2 act is exactly the
place a designation would occur, and this instruction supplied none.

## 11. UNRESOLVED SEMANTICS (complete list)

CREATE (creation definition · duplicate identity/name policy · empty-list validity) ·
WRITE (persist timing · atomicity requirement · partial-state prohibition) ·
UPDATE (changeable fields · membership/ordering mutability · provenance-accompanies-update
requirement) · DELETE (authorization · delete form · provenance-on-delete) ·
RESET/CLEAR (authorization · distinction from delete · explicit-authority requirement).
Secondary unresolveds flowing from the above: provenance operational production rule;
any actor-attribution (blocked on SG-5); atomicity requirement; mutation idempotency
expectation. **All five families are unresolved; zero semantics are authorized.**

## 12. EXPLICIT EXCLUSIONS (absolute)

No semantics established, assumed, borrowed, or promoted (no PortfolioStore/PIT/
IdentityMapping/provenance behavior → Watchlists policy) · no mechanism reconsidered
or replaced; no secondary mechanism introduced (§2) · no state-boundary expansion (§3)
· SG-3 retention untouched · SG-4 untouched · SG-5 untouched (`UNRESOLVED` verbatim) ·
no storage-key design (no key name/namespace, serialization format, schema/version,
migration format, principal binding, corruption recovery, quota handling) · no
implementation of any kind · no transport/auth/tenant/production change · D115
canonical block unchanged · no UI/tracker/spec/donor change.

## 13. IMPLEMENTATION REMAINS UNAUTHORIZED (explicit)

> **This gate grants NO implementation authority.** No `localStorage` reads/writes, no
> key creation, no serialization code, no persistence code, no schema, no migration,
> no dependency, no application-code, no UI, no tracker/spec, no donor, no transport,
> no authentication, no production change. Sole repository change: this artifact.

## 14. NEXT SINGLE GOVERNANCE PREREQUISITE

> **One explicit Designating-Authority SG-2 operational-semantics selection** for the
> bounded Watchlists list-state boundary on the designated browser `localStorage`
> mechanism — i.e., an authority instruction carrying the operative decision token(s)
> answering, at minimum, the governing decision points enumerated in §5–§9 (create
> definition / duplicate-identity policy / empty-list validity; write timing /
> atomicity / partial-state policy; update field scope / membership-ordering
> mutability / provenance-on-update; delete authorization / delete form /
> provenance-on-delete; reset authorization / reset-vs-delete distinction). The
> framework's charter-bundle pattern (BI-07) contemplates these as **one** authority
> act designated with the mechanism; decision points are enumerated as the option
> space only — **no option is recommended, preferred, or pre-selected here.** Upon
> that selection, SG-2 records ESTABLISHED (or ESTABLISHED WITH EXPLICIT SUB-GATES if
> the Authority defers items, e.g., anything blocked on SG-5). SG-3 follows SG-2;
> SG-4, SG-5, transport, implementation remain independently gated.

---

## VALIDATION (targeted, governance-only)

- Sole repository change: ADD of this gate record. Zero application, storage,
  persistence, transport, identity/authentication, configuration, dependency, UI,
  tracker/spec, donor, or production-boundary changes. No build/test executed.
- All antecedent strings verified from commit objects after fresh fetch; framework
  findings (§10) verified by direct inspection of `portfolio-store.ts`,
  `evidence/bi08/…`, `evidence/bi04/…`, and `d01bc97` this gate.

## DURABILITY CHECKPOINT

| Step | Result |
| --- | --- |
| Exact diff reviewed | only this gate record added |
| Code/storage/transport/identity/config/dependency/production changes | none |
| Commit | (SHA in final report / git log) |
| Push to `arena/01a0e30c-iips-production-market-data` | completed |
| Re-fetch; LOCAL == REMOTE; commit reachable from authoritative branch | verified |
| Worktree CLEAN; delta sole artifact; no unrelated files changed | verified |

---

## OUTCOME

# **C — OPERATIONAL SEMANTICS UNRESOLVED**
# No governing record establishes any create/write/update/delete/reset semantic for this
# exact boundary; the framework requires explicit Designating-Authority selection per
# state domain, and none accompanied this act. Existing invariants (BI-07/BI-08/BI-04)
# were verified and NOT promoted. Zero semantics authorized. No mechanism conflict found.
# **Next single prerequisite: explicit Designating-Authority SG-2 operational-semantics
# selection. STOPPED.**
