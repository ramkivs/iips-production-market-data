# Institutional Investment Platform System (IIPS)
# WATCHLISTS — DURABLE IDENTITY / OWNERSHIP SCOPE: GOVERNANCE GATE RECORD

**Act ID:** `watchlists-identity-ownership-scope-gate-2026-09-27-001`
**Act Type:** GOVERNANCE GATE RECORD — IDENTITY/OWNERSHIP CLASSIFICATION (non-executable;
**authorizes no persistence, no transport, no implementation, no identity of any kind**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Governing Authority:** RAMKI (Designating Authority)
**Recording Agent:** Arena (recording only — no identity inferred, promoted, or manufactured;
Phase-4 selection-integrity rule applied)
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Recorded At (UTC):** 2026-09-27
**Antecedent Checkpoint:** `146c97f8e48ed050435cc7951fca075f3fc209f3`
(`watchlists-durability-durable-classification-2026-09-27-001` — DURABLE, classification only)

---

## 1. ANTECEDENT STATE (verified fail-closed before this gate)

| Item | Value | Verified |
| --- | --- | --- |
| Authoritative remote main | `origin/main` = `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | ✓ |
| Branch / HEAD (pre-gate) | `arena/01a0e30c-iips-production-market-data` @ `146c97f…209f3` | ✓ |
| LOCAL == REMOTE (pre-gate) | `ls-remote` == HEAD | ✓ |
| Worktree (pre-gate) | CLEAN | ✓ |
| Product-surface designation | `WATCHLISTS-PRODUCT-SURFACE-DESIGNATION-AUTHORITY-ACT.md` @ `35acb91` — commit object + decision string verified | ✓ |
| Durable classification | `WATCHLISTS-DURABLE-CLASSIFICATION-AUTHORITY-ACT.md` @ `146c97f` — file + `DURABLE` decision string verified | ✓ |
| Prior PIT identity findings | `WATCHLISTS-PERSISTENCE-IDENTITY-TRANSPORT-GOVERNANCE-DECISION.md` @ `5c6aea9` (A1/A4/A5/A6 NOT ESTABLISHED) | ✓ present |

## 2. SINGLE QUESTION

> **What identity/ownership scope is authoritatively established for durable Watchlists state?**

Durability is not identity: `146c97f` classified *what kind of state* Watchlists is governed
to be; this gate determines only *who/what may own* that state. No persistence, transport,
or implementation question is touched.

## 3. AUTHORITATIVE D115 STATE (records inspected directly)

| D115 field | Authoritative state | Source records |
| --- | --- | --- |
| D115 C (authoritative companyId) | **UNRESOLVED** | PHASE1 §G.1; PHASE1B blocked report R-6; PHASE1C record; PHASE2/PHASE3 acts; designation packet §7 |
| D115 D (Company/Security mapping) | **UNRESOLVED** | same records |
| `runtimeCompanyId` | **UNRESOLVED** | same records |
| implementationAuthority | **WITHHELD** | same records |
| productionEligible | **false** | same records |
| production activation | **NOT AUTHORIZED** | same records |
| Principal / Custodian (user/ownership fields) | **NOT RECORDED in this repository.** No D115 sub-field, act, or charter establishes any principal or custodian. The only user-principal-shaped artifacts are the display-only `ANONYMOUS_SESSION` and the donor Keycloak lineage (deferred) | repo-wide search across `docs/`, `evidence/`, `src/`, `frontend/src/`, `tests/` |
| D115-constrained set | Identity & Access (AUTH-BLOCKED — "D115 core: identity binding, runtimeCompanyId WITHHELD"); Tenants (AUTH-BLOCKED, "D115-adjacent tenancy"); sign-out/OIDC seam; `runtimeCompanyId`; governed payload identity binding | convergence inventory rows 45/46 and §I |
| Environment / boundary | `NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV`; fail-closed; **unchanged** | every runtime header; PHASE5 §3 |

**Preservation statement:** no D115 field is resolved, modified, or weakened by this gate;
no `runtimeCompanyId` is invented; `productionEligible` is unchanged; no authentication,
OIDC, or Keycloak is activated.

## 4. EXISTING IDENTITY MECHANISMS — dimensions that exist vs. dimensions with ownership authority

| Mechanism | Authority it actually holds | Ownership authority for durable Watchlists state? |
| --- | --- | --- |
| `companyId` (D05 governed master, 2,250 records; P04 effective-dated mapping; fail-closed quarantine) | **Security/company identification** — current main contract authoritative (PHASE1 §G) | **NO** — identifies securities; no act designates companyId (or any security scope) as an *owner* of durable Watchlists state; treating it as owner is the prohibited user-owner inference |
| `NON_PRODUCTION_SINGLE_OPERATOR_IDENTITY_BYPASS` charter (`GOV-REC-2026-NON-PROD-OPERATOR-BYPASS-01`) | Securities-resolution disposition for offline **portfolio** broker import: unmapped holdings retained `companyId=""`, `UNRESOLVED`, bypass-tagged; gated `executionEnvironment === 'NON_PRODUCTION'`; production fail-closed | **NO** — portfolio-specific; non-production; resolves *securities*, creates no principal, no operator identifier, no ownership semantics; non-transferable |
| `ANONYMOUS_SESSION` (`authenticated:false`, role `viewer`, `tenantId:'system'`) | **Display only** — "never an authorization authority" (`session.ts`); deliberate Keycloak exclusion (`main.tsx`) | **NO** — §8 of this gate: remains non-authoritative; not promoted, reinterpreted, or assigned durable ownership; unavailable for durable Watchlists ownership |
| `tenantId` (provenance/telemetry plumbing) | Optional DTO field; only runtime use is the `IIPS_OFFLINE_BOOTSTRAP` **data-provenance marker** | **NO** — no tenant identity/authority exists; Tenancy surface is D115-constrained / AUTH-BLOCKED |
| Keycloak/OIDC principal | Donor lineage only | **NO / unavailable** — excluded (PHASE5 §3; `main.tsx` deliberate exclusions); donor semantics not importable |

**Watchlists ownership requirement (evidence only, not authority):** donor `Watchlists;
api/watchlists` was user-owned via `authFetch → api → Keycloak`; spec rows reference
"shared research/watchlists" (user context) and Settings "Identity/preferences/configuration";
tracker `P13-07` designates no owner (deps P07/P11/P12 only). This program/donor evidence
establishes that durable Watchlists semantics **calls for an owner identity** — and that the
owner identity is exactly what the repository does **not** currently authorize.

## 5. DETERMINATION

| Candidate scope | Established by repository authority? |
| --- | --- |
| A. USER / PRINCIPAL OWNERSHIP | **NOT ESTABLISHED** — no authority act establishes any principal; `ANONYMOUS_SESSION` non-authoritative by its own charter; authentication tier excluded; Identity & Access D115-constrained |
| B. TENANT-SCOPED OWNERSHIP | **NOT ESTABLISHED** — no tenant identity/authority exists; Tenancy D115-constrained / AUTH-BLOCKED; `tenantId` is plumbing only |
| C. COMPANY/SECURITY-SCOPED OWNERSHIP | **NOT ESTABLISHED** — `companyId` authority governs security identification only; no act authorizes it as an ownership scope for durable Watchlists state |
| **D. IDENTITY/OWNERSHIP UNRESOLVED** | **← THE RECORDED OUTCOME** |

**Dependency recorded (not resolved):** durable Watchlists ownership depends on (i) an
explicit identity-scope designation for this workstream by the Designating Authority, and/or
(ii) D115 disposition for any principal/tenant-requiring semantics. Neither exists today.

## 6. AUTHORITY ESTABLISHED BY THIS GATE

**None.** No owner may be recorded for durable Watchlists state. The DURABLE classification
(`146c97f`) stands; the identity/ownership boundary remains exactly as evidenced above.

## 7. EXCLUSIONS (absolute — unchanged by this gate)

No persistence authority (no database/browser/filesystem/server storage, adapters, Watchlist
store, write/retention/deletion/reset/synchronization/migration/serialization implementation;
`PortfolioStore`/PIT Store/IdentityMappingStore remain evidence only, not promoted) · no
transport authority (no `/api/watchlists`, server actions, RPC, network, WebSocket,
EventSource, `authFetch`, Keycloak, P12 Watchlist DTOs) · no implementation (Watchlists UI,
`/watchlists`, navigation, UI registry, feature directories, stores, DTOs, fixtures, API,
server, persistence, configuration, dependencies all unchanged; donor Watchlists not
imported) · no D115 modification · no authentication/authorization activation · no
production boundary change · no unrelated identity domains touched.

## 8. NEXT SINGLE GOVERNANCE PREREQUISITE

**Explicit identity/ownership-scope designation for durable Watchlists state by the
Designating Authority** — an authority act recording which governed identity scope (if any)
may own the durable state, or explicitly deferring ownership. Only after such an act can the
**persistence-authority gate** become the next item. Sequencing per `146c97f` §4 is
preserved and is **blocked at this step** until that designation exists.

## 9. VALIDATION (targeted, governance-only)

- Sole repository change: ADD of this gate record. Zero application, persistence,
  transport, authentication, or configuration changes.
- No build or test suite executed (non-executable record).
- Every D115/identity statement above cites a record inspected directly in this gate
  (PHASE1 §G.1; PHASE1B R-6; PHASE1C record; PHASE2/3 acts; designation packet §7;
  convergence inventory rows 45/46/§I; `NON_PRODUCTION_SINGLE_OPERATOR_IDENTITY_BYPASS.md`;
  `session.ts`; `main.tsx`; spec/tracker evidence). No conversational memory used as
  evidence; no principal manufactured; no display session promoted.

## 10. DURABILITY CHECKPOINT

| Step | Result |
| --- | --- |
| Exact diff reviewed | only this record added |
| Application/persistence/transport/authentication/config changes | none |
| Commit | (SHA in final report / git log) |
| Push to `arena/01a0e30c-iips-production-market-data` | completed |
| LOCAL == REMOTE (post-push, `ls-remote`) | verified |
| Clean worktree | verified |

---

## OUTCOME

# **IDENTITY/OWNERSHIP = UNRESOLVED**
# Durable classification stands (`146c97f`); no legitimate owner for durable Watchlists
# state is established by repository authority; D115 boundary preserved exactly.
# **STOPPED — persistence authority gate not entered.**
