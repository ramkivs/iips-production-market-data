# Institutional Investment Platform System (IIPS)
# WATCHLISTS — IDENTITY / OWNERSHIP DESIGNATION: AUTHORITY ACT

**Act ID:** `watchlists-identity-ownership-designation-2026-09-27-001`
**Act Type:** AUTHORITY ACT — IDENTITY/OWNERSHIP DESIGNATION (non-executable; **this act
authorizes NO authentication, NO persistence, NO transport, and NO implementation**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Designating Authority:** RAMKI
**Explicit Selection (verbatim authority instruction for this act):**
> **WATCHLISTS OWNER = PERSONAL APPLICATION PRINCIPAL / SINGLE-USER LOCAL OWNERSHIP**
**Selected By:** RAMKI (explicit — the designated identity/ownership model; no model inferred)
**Recording Agent:** Arena (recording only)
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Recorded At (UTC):** 2026-09-27
**Antecedent Checkpoint:** `1650ef5780b0affc406f54c33e62239f47da9af4`

---

## 1. ANTECEDENT STATE (verified fail-closed before this act)

| Item | Value | Verified |
| --- | --- | --- |
| Authoritative remote main | `origin/main` = `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | ✓ |
| Branch / HEAD (pre-act) | `arena/01a0e30c-iips-production-market-data` @ `1650ef5…da9af4` | ✓ |
| LOCAL == REMOTE (pre-act) | `ls-remote` == HEAD | ✓ |
| Worktree (pre-act) | CLEAN | ✓ |
| Product-surface designation | `WATCHLISTS-PRODUCT-SURFACE-DESIGNATION-AUTHORITY-ACT.md` @ `35acb91` | ✓ commit + string |
| Durable classification | `WATCHLISTS-DURABLE-CLASSIFICATION-AUTHORITY-ACT.md` @ `146c97f` — `DURABLE` | ✓ commit + string |
| Identity/ownership gate | `WATCHLISTS-IDENTITY-OWNERSHIP-SCOPE-GATE-RECORD.md` @ `1650ef5` → `IDENTITY/OWNERSHIP = UNRESOLVED` | ✓ commit + string |
| D115 framework records | PHASE1 §G.1 (`implementationAuthority: WITHHELD`, C/D UNRESOLVED); packet §7 — intact | ✓ spot-verified |

**Sandbox recovery record (transparency, per re-clone precedent):** a sandbox re-clone was
detected at gate opening (reflog: clone + checkout only; local branch reset to `4d3e1cd`).
All six prior governance commits were verified present on origin; all six artifact files
were hash-verified **byte-identical** between working copies and committed blobs
(`git hash-object` == `git rev-parse tip:blob`, 6/6) before a **fast-forward-only**
realignment to `1650ef5` (linear ancestry verified via `git merge-base --is-ancestor`).
No history was repaired, rewritten, or force-pushed.

## 2. AUTHORITY DECISION RECORDED

> ### **IDENTITY/OWNERSHIP SCOPE = PERSONAL APPLICATION PRINCIPAL / SINGLE-USER LOCAL OWNERSHIP**
> **Selected by:** RAMKI — explicit selection, recorded verbatim. The exact missing element
> recorded at `1650ef5` §8 (an explicit identity/ownership-scope designation) is hereby
> supplied. Not reinterpreted; the scope is not broadened.

### 2.1 Designated scope (exact)

| Property | Value |
| --- | --- |
| Owner class | **Personal application principal** (bounded) |
| Cardinality | **Single-user** |
| Locality | **Local** |
| Environment | **NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV** only |
| Sharing | **NON-SHARED** (no cross-user, no shared ownership, no collaboration semantics) |
| Deployment | **NON-DEPLOYED** |

Durable Watchlists state is conceptually owned **within** this bounded personal/single-user
local application principal scope. The designation is a **governance ownership boundary** —
not an authentication implementation (§4), not a persistence authority (§5), not a runtime
identifier (§3).

## 3. PRINCIPAL IDENTIFIER (no fabrication rule applied)

- **EXACT RUNTIME PRINCIPAL IDENTIFIER = `UNRESOLVED`.**
- No UUID, account ID, token, `companyId`, tenant ID, `ANONYMOUS_SESSION` value, `system`,
  or `IIPS_OFFLINE_BOOTSTRAP` value is substituted, invented, or designated as the
  identifier. The repository contains no authoritative exact principal identifier, and none
  is manufactured by this act.
- Resolving the runtime principal identifier — if a later gate requires one — is a
  **separate bounded identity/runtime determination**, not performed here.
- **Custodian:** custodianship of the durable state rests with the same bounded personal
  application principal within the local/non-production application **qualification
  boundary** only. This act grants **no** credential custody, **no** production credential
  authority, and **no** tenant administration. No new custodian concept is created.

## 4. IDENTITY-ADJACENT BOUNDARIES (all preserved exactly)

| Boundary | State under this act |
| --- | --- |
| D115 C / D / `runtimeCompanyId` / implementationAuthority / productionEligible / production activation | **UNCHANGED** — UNRESOLVED / WITHHELD / false / NOT AUTHORIZED. This act resolves nothing in D115, claims no backdoor around it, and designates no production identity |
| **Designation ≠ authentication** | No OIDC, Keycloak, login, callback handling, session authentication, tokens, credential storage, or external IdP integration is authorized or created |
| **`companyId` ≠ owner** | `companyId` remains a **security-identification** mechanism only (D05/P04). No security identifier — `companyId`, FIGI, ISIN, NSE symbol, BSE symbol, canonical security ID — is used or usable as the application principal. Security identity and owner identity remain separate |
| **`ANONYMOUS_SESSION` ≠ owner** | remains display-only; not authorization; **not** promoted to durable ownership; no synthetic anonymous owner created |
| **Tenant not established** | no tenant ownership; `tenantId` plumbing not promoted; no invented tenant; no cross-user or multi-tenant semantics |
| **Donor Keycloak identity excluded** | donor user-owned Watchlists (`authFetch → /api/watchlists → Keycloak`) is evidence only; Keycloak not imported; donor principal semantics not recreated; no `authFetch`, no `/api/watchlists`, no server authentication |

## 5. EXPLICIT EXCLUSIONS (absolute — none authorized by this act)

- **Persistence**: no Watchlist store; no `PortfolioStore` usage/promotion; no database,
  browser, filesystem, or server storage; no persistence adapter; no serialization
  implementation; no write/retention/deletion/reset/synchronization authority.
  **Durable classification stands; persistence authority remains a separate future act.**
- **Transport**: no API, server, RPC, network calls, `/api/watchlists`, WebSocket,
  EventSource, `authFetch`, or P12 Watchlist DTOs. Transport remains a separate later gate.
- **Implementation**: no Watchlists UI, route, navigation, UI registry, feature modules,
  stores, DTOs, fixtures, configuration, dependencies, or donor component changes. No
  application code change is authorized. No build/test suite run.
- **Ownership alternatives**: tenant ownership, company/security ownership, anonymous
  ownership, donor Keycloak identity, production identity — all excluded.

## 6. GOVERNANCE SEQUENCING (recorded; next gate NOT performed)

```
Product-surface designation     ✅  35acb91
Durability = DURABLE            ✅  146c97f   (classification only)
Identity/ownership scope        ✅  THIS ACT (PERSONAL APPLICATION PRINCIPAL /
                                             SINGLE-USER LOCAL OWNERSHIP — scope only;
                                             exact runtime identifier UNRESOLVED)
Persistence authority           ←  NEXT SINGLE GOVERNANCE PREREQUISITE
Transport authority             ←  later separate gate
Implementation authorization    ←  later read-only pre-flight / implementation gate
Implementation                  ←  later separate authority-controlled act
```

**Next single governance prerequisite: persistence authority for durable Watchlists state.**
This act does not execute it.

## 7. VALIDATION (targeted, governance-only)

- Sole repository change: ADD of this act file. Zero application, persistence, transport,
  authentication, configuration, D115, or production-boundary changes.
- No build or test suite executed (non-executable act).
- The selection is recorded verbatim; no identifier manufactured; no display session,
  tenant plumbing, security identifier, or offline-bootstrap marker substituted;
  D115 preservation spot-verified against the authoritative records before recording.

## 8. DURABILITY CHECKPOINT

| Step | Result |
| --- | --- |
| Exact diff reviewed | only this act file added |
| Application/persistence/transport/authentication/config/D115/production changes | none |
| Commit | (SHA in final report / git log) |
| Push to `arena/01a0e30c-iips-production-market-data` | completed |
| LOCAL == REMOTE (`ls-remote`, post-push) | verified |
| Tracking synchronization / clean worktree | verified |

---

## OUTCOME

# **IDENTITY/OWNERSHIP DESIGNATED — PERSONAL APPLICATION PRINCIPAL /
# SINGLE-USER LOCAL OWNERSHIP** (local · personal · single-user · non-production ·
# non-shared · non-deployed). **Exact runtime principal identifier = UNRESOLVED.**
# Designation ≠ authentication ≠ persistence ≠ implementation.
# **Next gate: persistence authority. STOPPED.**
