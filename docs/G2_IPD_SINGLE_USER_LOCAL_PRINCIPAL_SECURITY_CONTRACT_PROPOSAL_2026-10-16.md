# IIPS — G-2 Single-User Local Principal IPD Security-Contract Proposal

**Gate:** `G-2 — IPD-SIDE SECURITY-CONTRACT PROPOSAL (DESIGN ONLY)`
**Artifact ID:** `G2-IPD-LOCAL-PRINCIPAL-SECURITY-CONTRACT-PROPOSAL-2026-10-16-01`
**Type:** **Contract PROPOSAL for explicit security-authority review. NOT approved, NOT effective, NOT implemented, NOT qualified, NOT admitted. No source, test, dependency, schema, or runtime behavior is changed by this document.**
**Date:** 2026-10-16 (Asia/Calcutta)
**Repository (authoritative for this contract):** `ramkivs/iips-production-market-data` (IPD)
**Session branch:** `arena/01a0e6d9-iips-production-market-data`
**Proposal HEAD:** `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`
**IPD `main` HEAD:** `70b24f029842a7e9b7f615e4d9df7376fd4ff817`
**Antecedent decision request:** IRR PR #117, `docs/integration/IIPS_v3.0_G2_SINGLE_USER_LOCAL_PRINCIPAL_SECURITY_CONTRACT_DECISION_REQUEST_2026-10-16.md` (head `322a5095a`)
**Governing standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Execution mode:** NON_PRODUCTION

> **Status: PROPOSED — AWAITING EXPLICIT IPD SECURITY-AUTHORITY DECISION.**
> The Program Authority selected Option A **in principle, for design only**, and named
> **same-host OS-protected local IPC** as the trusted-boundary design direction. That is a
> direction, not a contract. This document converts the direction into a concrete, reviewable
> IPD-side contract proposal with its exact incompatibilities, its unresolved assumptions, and
> the precise authority required to accept it. Nothing here is admitted to IPD `main`, and
> nothing here authorizes implementation.

### Evidence classes used throughout

| Class | Meaning |
|---|---|
| **[RV]** | Repository-verifiable from a commit SHA, file path, or source constant |
| **[AI]** | Authority instruction or prior gate determination with no in-repository artifact |
| **[UNV]** | **Unvalidated proposal** — design intent, **not** verified behavior |

Claims in §2, §6, §9 and §10 are **[RV]**. Claims in §3, §4, §5 and §7 are **[UNV]**. Claims in
§6.2 drawn from the NP04 record are **[AI]** with **[RV]** corroboration of the cited source
lines. No claim outruns its evidence class.

---

## 1. PURPOSE AND DECISION SOUGHT

### 1.1 Purpose

To advance G-2 from *approval in principle* to a *concrete IPD-side contract proposal* that a
security authority can explicitly accept or reject, for a **single-user personal application**
using **OS-protected, same-host local IPC**.

### 1.2 Decision sought

A single, explicit, additive decision by the IPD security-contract authority that either:

- **ACCEPT** the trust boundary, peer authentication, browser/server separation, owner binding,
  tenant treatment, and canonical-identity contract defined in §3–§7, together with the exact
  clause amendments stated in §2.6; **or**
- **REJECT** the proposal, retaining the existing G24 OIDC trust contract and the IRR
  `/api/user-portfolios*` HTTP 503 fence unchanged; **or**
- **RETURN** the proposal with the specific unanswered questions named in §9.

### 1.3 What this document is not

Not an approved contract. Not an implementation authorization. Not a qualification record.
Not a route admission. Not a successful-write policy. Not a change to DP-2 Option 2F.
Not a promotion of the off-main G24 lineage.

### 1.4 Governing records and non-repetition boundary

This proposal reuses prior findings and does not repeat their investigations:

- **G-2 Durable User Portfolio Architectural Decision** — IPD owns and extends the portfolio
  domain; IRR consumption is separately governed.
- **Gate C DP-1 Option 1A′ binding contract**
  (`IIPS_v3.0_GATE_C_S5A_DP1_OPTION_1A_PRIME_BINDING_CONTRACT_AND_PREREQUISITE_SPECIFICATION_2026-10-13.md`)
  — current OIDC trust path and its explicit exclusions.
- **Gate C P-2 scope correction**
  (`IIPS_v3.0_GATE_C_P2_SCOPE_CORRECTION_AND_F5R_DISPOSITION_2026-10-14.md`) — OIDC and
  authentication work are out of scope.
- **Gate C DP-2 Option 2F packet**
  (`IIPS_v3.0_GATE_C_PORTFOLIO_IDENTITY_AND_SECURITY_IDENTIFIER_CONTRACT_PA_DECISION_REQUEST_2026-10-13.md`)
  — refusal remains unchanged.
- **D115 / D-2 / G-2 reconciliation and D115 implementation-authorization records** — separate
  principal, owner, tenant, and canonical-company namespaces.
- **`evidence/np04/NP04-GOVERNANCE-AUTHORITY-RECORD.md`** (IPD, `6828155e`) — §4.2 bounded G24
  outcome, §4.4 tenant-authority findings, §5 approved tenant disposition.
- **`evidence/operator_drop/NON_PRODUCTION_SINGLE_OPERATOR_IDENTITY_BYPASS.md`** (Block 3M-A) —
  offline frontend store only.
- **Antecedent request:** IRR PR #117
  `docs/integration/IIPS_v3.0_G2_SINGLE_USER_LOCAL_PRINCIPAL_SECURITY_CONTRACT_DECISION_REQUEST_2026-10-16.md`
  (head `322a5095a`).

---

## 2. EXISTING CONTRACT AND PRECISE INCOMPATIBILITY

### 2.1 Where the IPD-owned G24 security contract is defined

All paths below are at IPD `6828155e` on `arena/01a0e6d9-iips-production-market-data`. **[RV]**

| Concern | Exact location |
|---|---|
| Portfolio authorization sequence | `src/server/authorization.ts` — `PortfolioAuthorizer.authorize()` / `authorizeScope()` |
| Credential verification | `src/auth/oidc-verifier.ts` — `OidcVerifier.verifyToken()` / `verifyAuthorizationHeader()`, type `VerifiedOidcCredential` |
| Trust configuration | `src/auth/config.ts` — `loadOidcTrustConfig()` |
| External-identity mapping | `src/app_identity/service.ts` — `resolveExternalIdentity()` (L379) |
| Tenant membership resolution | `src/app_identity/service.ts` — `resolveTenant()` (L466) |
| Tenant provisioning / revocation | `src/app_identity/service.ts` — `provisionTenantMembership()` (L418), `revokeTenantMembership()` (L439) |
| HTTP boundary | `src/server/http-server.ts` — `IpdHttpServer.handle()` (L112) |
| Boundary configuration | `src/server/config.ts` — `DEFAULT_HTTP_HOST = '127.0.0.1'`, `DEFAULT_HTTP_PORT = 8099`, `MAX_BODY_BYTES` |
| Durable portfolio store | `src/portfolio/durable-store.ts` — `saveHoldings()` (L254), `getPortfolio()` (L166) |
| Authorized-scope SQL | `src/portfolio/repository.ts` — `findAuthorizedPortfolio()` (L175) |
| Save guards | `src/portfolio/consolidation.ts` — Save Guard 2 (L110–118) |
| Persistence | `src/persistence/connection.ts`; `src/persistence/migrations/001_initial_schema.ts`, `002_audit_event_sequence.ts` |

### 2.2 The enforced sequence (verified existing behavior) **[RV]**

`src/server/authorization.ts` documents and enforces:

```text
verified OIDC identity
      -> issuer + subject
      -> applicationUserId            (resolveExternalIdentity, fails closed)
      -> tenant membership            (resolveTenant, fails closed)
      -> tenantId
      -> portfolio authorization      (getPortfolio by applicationUserId + tenantId + portfolioId)
```

`authorize()` takes `credential: VerifiedOidcCredential` as its **first and only** trust input.
`requestedTenantId` is an optional *hint*; it is re-derived from membership and never trusted.
Portfolio ownership supplied by the browser is never trusted: it is re-derived from the durable
store. A portfolio that is not authorized for the caller is indistinguishable from one that does
not exist (`ResourceNotFoundError`).

### 2.3 Which current G24 checks require OIDC credentials, external-identity mappings, and active tenant membership **[RV]**

| Check | Requires |
|---|---|
| `G24-F1..F15` (`tests/g24_f_oidc_security.test.ts`) | Signed OIDC bearer: trusted issuer, distinct IPD audience `ipd-user-portfolio-api`, RS256/ES256 signature against trusted JWKS, `exp`, `nbf`, non-blank `sub`; `none`/HS256/unknown-`kid` rejected |
| `G24-E6` (`tests/g24_e_authorization.test.ts`) | An **ACTIVE** external-identity mapping `(issuer, subject) -> applicationUserId`; no implicit application user is created |
| `G24-E7`, `G24-E8` | **ACTIVE** tenant membership for the resolved `applicationUserId`; revoked membership refused |
| `G24-E1..E5`, `E9` | Owner + tenant + lifecycle authorization on every operation; non-disclosure; durable revisions |
| `G24-H1`, `H7`, `H8` (`tests/g24_h_http_boundary.test.ts`) | Every `/api/ipd` route requires a verified credential; another application user cannot reach the portfolio; a caller-supplied unprovisioned tenant is refused |
| `G24-H4` | Stale `expectedRevision` rejected with 409 |

### 2.4 The precise incompatibility

**G24 does not accept a local IRR principal as proof of identity.** The inspected HTTP path
requires an OIDC bearer verified by IPD, then an ACTIVE external-identity mapping to an IPD
`applicationUserId`, then ACTIVE tenant membership. A local owner identifier is not a credential
and cannot be placed in a header, body, cookie, or URL and treated as one.

Therefore accepting a local principal requires an **explicit amendment to the trust-input clause
of `PortfolioAuthorizer`** (§2.6, clause C-1). It cannot be achieved by adding an IRR header,
relaxing the verifier, or treating loopback, browser origin, or a single-user label as
authentication.

### 2.5 Verified existing behavior that must be preserved unchanged **[RV]**

| Invariant | Verified at |
|---|---|
| Server-side authorization on every operation | `src/server/authorization.ts`; `tests/g24_e_authorization.test.ts` |
| Unauthorized access indistinguishable from missing | `ResourceNotFoundError` — `src/server/authorization.ts`; `src/portfolio/durable-store.ts` L173, L264 (authorization paths) |
| Owner + tenant + portfolio scoping of reads and writes | `src/portfolio/repository.ts` `findAuthorizedPortfolio()` L175 |
| Optimistic concurrency via `expectedRevision` (409) | `src/portfolio/durable-store.ts` L271; `G24-H4` |
| Content-hash idempotency / consolidation | `src/portfolio/consolidation.ts`; `tests/g24_c_portfolio_durability.test.ts` |
| Restart durability, no in-memory fallback | `src/persistence/connection.ts`; `tests/g24_g_recovery.test.ts` |
| Tombstone non-disclosure | `src/portfolio/durable-store.ts` L479–481 ("every authorized lookup excludes tombstoned rows"), `ResourceTombstonedError` L32; `G24-H6` |
| Fail-closed tenant resolution at every branch | `src/app_identity/service.ts` `resolveTenant()` L466 |

### 2.6 The exact contract clauses that would change

If accepted, the amendment is confined to these four clauses. **Everything else is preserved.**

| Clause | Current | Proposed |
|---|---|---|
| **C-1** Trust input of `PortfolioAuthorizer` | `credential: VerifiedOidcCredential` derived from an IPD-verified OIDC bearer | A `VerifiedPrincipal` abstraction satisfied by either `VerifiedOidcCredential` **or** a `VerifiedLocalPrincipal` derived from OS-enforced endpoint access control plus peer process identity verification (§4). Steps 2–3 (tenant resolution, portfolio authorization) are **unchanged**. |
| **C-2** Tenant treatment | `resolveTenant()` over `tenant_memberships`; tenant administration NOT AUTHORIZED | Either **T-1**: exactly one expressly provisioned `ACTIVE` membership plus the missing provisioning authority, audit, and restoration fix (§6.3); **or** **T-2**: a distinct single-user owner-isolation contract changing the authorizer and durable-store ownership key. **Authority must select.** |
| **C-3** Holding identity disposition | Caller-supplied `identityStatus` / `resolutionDisposition` accepted at the HTTP boundary | Caller-supplied identity disposition **refused**; identity status derived only from IPD-performed canonical resolution (§7.3). |
| **C-4** Local principal binding | None | New `LocalPrincipalBinding` record (§6.1) with explicit provision/revoke and audit. |

**Not changed:** DP-1 Option 1A′'s exclusion of forwarded IRR-principal trust, caller-supplied
identity, static/service credentials, and operator bypass — except insofar as C-1 substitutes a
*different, OS-enforced* trust mechanism for the OIDC one. DP-2 Option 2F, the G-2 IPD ownership
boundary, single-user scope, revision controls, and all fail-closed requirements are preserved.

---

## 3. PROPOSED OS-PROTECTED IPC TRUST BOUNDARY

### 3.1 Runtime actually supported (verified) **[RV]**

| Fact | Evidence |
|---|---|
| Windows is an attested deployment target | `windows-acceptance-evidence/WINDOWS-FULL-SHELL-VISUAL-ACCEPTANCE-20260923.md`; `run-d114-legacy-acquisition.ps1`; `evidence/operator_drop/windows_*_acceptance_manifest.json` |
| IRR is a React/Vite browser app **plus** a Node server, **no Electron** | IRR `frontend/package.json` (`"server:dev": "tsx server/executive-transport.ts"`); no `electron` dependency |
| IPD boundary is a Node HTTP server | `src/server/http-server.ts`, `src/server/config.ts` |
| Node runtime | `@types/node ^22.13.9` (IPD) |
| Persistence driver | exact-pinned `better-sqlite3@13.0.3` (native module); path from `IPD_PORTFOLIO_DB_PATH` |
| IPD listener default | `127.0.0.1:8099` |

**Consequence — the browser is a separate, untrusted process.** Because IRR has no Electron main
process, the browser renderer is *not* part of a trusted server process. The trust boundary must
therefore run **between the IRR Node server process and the IPD Node server process**, both
launched by the operator on the same host. Nothing the browser supplies may cross it as identity.

### 3.2 Proposed primitive **[UNV]**

**Primary (Windows — the attested runtime): a named pipe (`\\.\pipe\<name>`) created by the IPD
process with an explicit Windows DACL, combined with OS-level peer process identity
verification (§4).**

**Secondary (POSIX runtimes): a Unix domain socket in a private directory with owner-only
filesystem permissions, combined with `SO_PEERCRED` peer pid/uid verification and executable
path resolution (§4).**

### 3.3 Why this primitive

1. **It is OS-enforced, not convention-enforced.** Access is decided by the kernel against the
   pipe's DACL (Windows) or the socket's filesystem permissions (POSIX). No application-level
   check can be bypassed by a caller who cannot open the endpoint.
2. **It requires no new credential technology.** No OIDC, no Keycloak, no shared secret, no
   service credential, no token, no TLS. It introduces nothing excluded by DP-1 Option 1A′.
3. **It is same-host only.** A named pipe and a filesystem-bound Unix socket are not routable.
   Remote callers cannot reach them at all, which removes the network-exposure question.
4. **It matches the attested deployment.** Windows named pipes are the native, documented
   same-host IPC mechanism with per-object ACLs on the supported runtime.

### 3.4 Endpoint ownership, permissions, lifecycle **[UNV]**

| Property | Proposal |
|---|---|
| Creator / owner | The **IPD** process creates and owns the endpoint. IRR is a client. |
| DACL (Windows) | Grant only: the operator's interactive user SID, `SYSTEM`, and `Administrators`. Deny `Everyone`, `Authenticated Users`, `Guests`, `Network`, and anonymous. |
| Directory / socket (POSIX) | Private directory `0700` owned by the operator; socket file `0600`. |
| Name | Generated by IPD at startup: **random, unguessable, held only in IPD process memory**, and **never** transmitted to IRR through any browser-visible channel. |
| Discovery | IRR receives the endpoint identity **only** through an OS-level side channel at process launch (environment of the child process, or a file descriptor inherited at spawn) — never through an HTTP response, a URL, a cookie, or a browser-visible value. |
| Stale endpoint | IPD unlinks/closes the endpoint on graceful shutdown and on `SIGINT`/`SIGTERM`; the endpoint is recreated on next start. A stale endpoint file is removed before bind; bind failure is fail-closed. |
| Lifecycle | Exactly one endpoint per IPD process. No re-bind without process restart. |

### 3.5 Explicitly rejected as authentication

Possession of the endpoint name; loopback binding; a private URL; a caller-supplied identity;
`Origin` / `Host` / CORS headers; a single-user assertion. **None of these authenticate a
caller.** The DACL and the peer-process check in §4 are the authentication; the random name is
only an availability and hygiene measure.

---

## 4. PEER AUTHENTICATION AND ENDPOINT PERMISSIONS

### 4.1 Two independent controls, both required **[UNV]**

**Control 1 — endpoint access control (kernel-enforced).** If the caller cannot open the
endpoint, the connection never exists. This excludes other OS user accounts, remote callers, and
unprivileged local processes.

**Control 2 — peer process identity verification (application-enforced, OS-derived).** On each
accepted connection IPD resolves the **peer process identity from the OS** and requires it to
equal the authorized IRR server process:

- **Windows:** `GetNamedPipeClientProcessId` → peer PID;
  `OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION)`; `QueryFullProcessImageNameW` → peer
  executable path; compare against the authorized IRR server executable path recorded at
  provisioning time. Close the handle immediately.
- **POSIX:** `SO_PEERCRED` → peer pid/uid; resolve `/proc/<pid>/exe`; compare against the
  authorized path.

A peer whose executable path does not match, or whose process cannot be resolved, is
**disconnected and the request refused**. The PID→path resolution happens **before** any request
bytes are read, so an unidentified peer cannot submit a request at all.

**Process identity is re-verified per connection, not cached per process lifetime**, so a
restarted or replaced IRR server cannot inherit a stale authorization.

### 4.2 How IPD verifies the request comes from the authorized local application process

The authoritative answer is: **IPD does not verify a claim. IPD verifies the connecting
process's OS identity and executable path, and admits the connection only if both the endpoint
DACL and the executable-path comparison pass.** Identity is therefore a property of the kernel's
answer, not of anything the caller states.

### 4.3 What an untrusted browser page, renderer, or remote client can do

| Actor | Can it invoke the privileged operation? | Why |
|---|---|---|
| Remote client | **No** | The endpoint is not routable; it has no network address. |
| Another OS user account | **No** | Denied by the endpoint DACL / socket permissions. |
| An unprivileged local process | **No** | Denied by the endpoint DACL / socket permissions. |
| A browser page / renderer | **No** | Web content cannot open an arbitrary named pipe or Unix socket. It can only speak HTTP to the IRR server it was served from, and the IRR server is the only component that holds the endpoint identity. |
| **An arbitrary process running as the same OS user** | **PARTIALLY — see §4.4** | Permitted by the DACL. Stopped only by Control 2, the peer-process path check. |
| A fully compromised OS user account | **No guarantee** | See §4.4 and §8.3. |

### 4.4 Honest limitation — stated, not concealed

**Same-host OS-protected IPC authenticates the OS user account and the peer executable path. It
does NOT authenticate "the IRR application" as an abstract entity, and it does NOT protect
against a fully compromised operating-system user account or an equally privileged malicious
process.**

Specifically, and stated plainly:

- Control 1 excludes *other accounts*; it does **not** exclude *other processes of the same
  account*.
- Control 2 excludes processes whose **executable path** differs from the authorized IRR server
  binary. It does **not** exclude a malicious process that (a) runs the same authorized binary
  with attacker-chosen arguments or environment, (b) injects code into the authorized IRR server
  process, or (c) races the PID→path resolution.
- Nothing in this design claims protection against a compromised OS account. If the operator's
  Windows account is fully compromised, the attacker can run the authorized binary and control
  the IRR server; the boundary provides **no** defence at that point, and this proposal does not
  claim otherwise.

This limitation is the reason §8.3 records it as an accepted residual risk requiring an explicit
authority decision, rather than as a solved problem.

### 4.5 Windows and other runtimes — material differences **[UNV]**

| Control | Windows | POSIX (Linux/macOS) |
|---|---|---|
| Endpoint | Named pipe `\\.\pipe\<name>` | Unix domain socket (filesystem path) |
| Access control | Pipe DACL (SID-based) | Directory `0700` + socket file `0600` (uid-based) |
| Peer identity | `GetNamedPipeClientProcessId` + `QueryFullProcessImageNameW` | `SO_PEERCRED` + `/proc/<pid>/exe` |
| Path comparison | Case-insensitive, device-path form | Case-sensitive, resolved symlink |
| Revocation granularity | Per-pipe DACL; per-binary path | Per-file permissions; per-binary path |
| Additional concern | `SeImpersonatePrivilege` held by service accounts can permit token theft; the IPD process must **not** run as a privileged service account | — |

**The Windows path is the only one with attested deployment evidence in this repository. The
POSIX path is proposed by symmetry and is NOT validated.** No implementation of either has been
written or tested under this proposal.

---

## 5. BROWSER AND SERVER TRUST SEPARATION

### 5.1 Which component establishes the local application principal **[UNV]**

**The IRR Node server process establishes the local application principal. The browser never
does.**

```text
Browser (untrusted)
    |  HTTP to the IRR server only. Supplies NO identity, NO owner, NO tenant, NO principal.
    v
IRR Node server (trusted for principal derivation only)
    |  Derives the local principal from its OWN server-owned source
    |  (the operator-established local application identity), never from request content.
    v
OS-protected same-host IPC  (DACL + peer process identity, §4)
    v
IPD Node server (trusted for owner/tenant/portfolio authorization)
    |  Re-derives the authorized owner scope server-side.
    v
IPD durable portfolio store (applicationUserId + tenantId + portfolioId)
```

### 5.2 The server-owned source of the principal

The IRR server derives the principal from a **server-owned source established at process launch
by the operator** — for example a launch-time identity file or environment value written by the
operator's launcher, readable only by the operator account, and never exposed to the browser.
**The exact source is an unresolved assumption (§9, Q-1) and is deliberately not specified
here**, because specifying it without validating it against the actual deployment would be
inventing an implementation.

What is *not* acceptable, and is explicitly excluded: a request header, a request body field, a
cookie, a URL parameter, a `postMessage` value, `localStorage`, an `Origin`/`Referer` header, or
any value the browser can set or read.

### 5.3 What IPD refuses to accept from IRR

| Field | Behavior |
|---|---|
| Application principal | Not accepted. IPD derives it from the OS-verified peer, never from the request. |
| Portfolio owner (`applicationUserId`) | Not accepted. Re-derived from the provisioned local-principal binding. |
| Tenant identity / membership | Not accepted. Re-derived by `resolveTenant()`. `requestedTenantId` remains a hint only. |
| Portfolio authorization scope | Not accepted. Re-derived from the durable store. |
| `companyId` on a holding | Not accepted as canonical. See §7. |
| `identityStatus`, `resolutionDisposition` | **Not accepted. See §7.3 — this is a verified current defect.** |

### 5.4 Checks that remain authoritative within IPD regardless of what IRR supplies

These are **unchanged by this proposal** and remain enforced inside IPD on every operation:

1. `resolveTenant()` — fail-closed at every branch (`src/app_identity/service.ts` L466).
2. Portfolio ownership re-derivation from the durable store (`src/portfolio/repository.ts` L175).
3. Unauthorized-as-not-found non-disclosure (`ResourceNotFoundError`).
4. Revision conflict rejection (`expectedRevision` → 409).
5. Consolidation and content-hash idempotency (`src/portfolio/consolidation.ts`).
6. Transactional durability with no in-memory fallback (`src/persistence/connection.ts`).
7. Canonical company-identity resolution and DP-2 Option 2F refusal (§7).

---

## 6. PRINCIPAL, OWNER, TENANT AND PORTFOLIO BINDING

### 6.1 The binding model — a local principal is not an IPD owner **[UNV]**

The binding is an explicit, provisioned, revocable record created by a separate IPD act:

```text
LocalPrincipalBinding
  principalId         opaque, IPD-generated, stable
  applicationUserId   opaque, IPD-generated, stable   <-- the ONE owner
  authorizedPeerPath  the authorized IRR server executable path (Control 2 of §4.1)
  status              ACTIVE | REVOKED
  provisionedAt / revokedAt / provisionedBy
```

- **Allocation:** IPD allocates exactly one `applicationUserId` through an explicit provisioning
  act. It is never inferred, never derived from the peer's executable path, never derived from a
  hostname, never derived from an IRR identifier, and never supplied by the browser.
- **Resolution:** the local path replaces `resolveExternalIdentity(issuer, subject)` with
  `resolveLocalPrincipal(principalId)`, which reads the provisioned binding and **fails closed**
  if it is absent, revoked, or its `authorizedPeerPath` does not match the verified peer.
- **Revocation:** setting `status = REVOKED` takes effect on the next resolution. Stale contexts
  fail closed. No restoration-by-upsert behaviour is permitted on this table (§6.3).

### 6.2 Tenant membership — addressed explicitly, not inferred

**Finding (verified):** tenant membership cannot be waved through on single-user grounds.

`evidence/np04/NP04-GOVERNANCE-AUTHORITY-RECORD.md` §5 records, verbatim: **[AI]**

> Tenant source of truth = D115-deferred
> Tenant administration = **NOT AUTHORIZED**
> Tenant-admin authorization = **NOT AUTHORIZED**
> Tenant lifecycle expansion = DEFERRED
> Tenant membership audit = DEFERRED
> Cross-system security audit = UNRESOLVED / DEFERRED

and §4.4 records **[RV]** that `provisionTenantMembership` (`src/app_identity/service.ts` L418)
has **0 non-test callers, 0 HTTP endpoints, and 0 role/actor authorization guards**, that
`tenantId` has **no upstream authoritative source** in the repository, and that
`upsertTenantMembership` produces an implicit `REVOKED → ACTIVE` restoration.

**Therefore a single-user status does not establish an IPD owner, and a local principal does not
establish tenant membership.** Two options exist; **this proposal does not select between them**
and asks the authority to decide.

**Option T-1 — reuse the existing membership model with exactly one provisioned ACTIVE
membership.** One `(applicationUserId, tenantId)` row with `state = 'ACTIVE'`, created by an
explicit IPD provisioning act, plus an explicit, separately authorized tenant-provisioning
authority and an audit trail. `resolveTenant()` and the durable-store ownership key
(`applicationUserId + tenantId + portfolioId`) remain **unchanged**.
- *Cost:* requires tenant-administration authority that is currently **NOT AUTHORIZED** (§6.3),
  and requires fixing the missing audit and the implicit-restoration behaviour.
- *Benefit:* no schema change, no second isolation mechanism, no change to the authorizer's
  ownership key.

**Option T-2 — a distinct single-user owner-isolation contract that does not use
`tenant_memberships`.** The authorizer and durable-store ownership key change to an explicit,
IPD-established single-user owner scope that is not the tenant table.
- *Cost:* a **material change to the ownership key** of the durable store and the authorizer —
  a larger contract change than T-1, and it introduces a second isolation concept.
- *Benefit:* does not require tenant-administration authority.

**Recommendation: Option T-1**, because it preserves the existing authorizer, ownership key,
schema, and all `G24-E*`/`G24-H*` authorization semantics unchanged, and confines the contract
change to the trust-input clause. **This recommendation is not a decision.**

### 6.3 Blocking precondition for either option

Provisioning requires, at minimum, all of the following — **none of which is currently
authorized**:

1. Tenant provisioning authority (recorded as an open G29 item, unresolved).
2. An audit trail on `provisionTenantMembership` / `revokeTenantMembership` (currently generate
   **no** audit events).
3. Removal or explicit prohibition of the implicit `REVOKED → ACTIVE` restoration in
   `upsertTenantMembership`.
4. Role/actor authorization guards on provisioning and revocation (currently none exist).

**If these are not authorized, the local-principal contract cannot be made effective, and the
correct disposition is Option C (defer) with the 503 fence retained.**

### 6.4 Portfolio binding

Unchanged. Portfolio identity is allocated by IPD; ownership is re-derived from
`applicationUserId + tenantId + portfolioId` on every operation; isolation between the owner's
portfolios and every other owner's data is enforced by `findAuthorizedPortfolio()`
(`src/portfolio/repository.ts` L175) and verified by `G24-E2`, `G24-E3`, `G24-H7`.

---

## 7. CANONICAL COMPANY-IDENTITY CONTRACT

### 7.1 Existing IPD capability (verified, on IPD `main`) **[RV]**

`src/identity/` is present on IPD `main` (`70b24f0`):

| Module | Capability |
|---|---|
| `src/identity/security_master.ts` | `SecurityMaster.registerEntity()`, `getEntity()`, `listAllCompanyIds()`, `resolveCompanyId()` |
| `src/identity/mapping_store.ts` | `IdentityMappingStore.resolveCompanyId(IdentityQuery)` — effective-dated |
| `src/identity/quarantine.ts` | `IdentityAmbiguityError`, `IdentityQuarantineRecord` |

`IdentityQuery` is:

```typescript
interface IdentityQuery {
  identifierType: 'ISIN' | 'CIN' | 'NSE_SYMBOL' | 'BSE_SYMBOL' | 'COMPOSITE_TICKER';
  identifierValue: string;
  asOf?: string;   // ISO-8601 UTC
}
```

`resolveCompanyId()` fails closed: **0 matches →
`IdentityAmbiguityError(UNMAPPED_IDENTIFIER)`**; **>1 match with distinct companyIds →
`IdentityAmbiguityError(AMBIGUOUS_COLLISION)`**; >1 match converging on one companyId → that
companyId. Resolution is effective-dated and point-in-time.

### 7.2 The contract required for a successful holding write

1. **Canonical identity comes only from an authorized, provenance-supported resolution.**
   `SecurityMaster.resolveCompanyId()` / `IdentityMappingStore.resolveCompanyId()` is the
   candidate resolution capability, invoked **inside IPD**, on an IPD-controlled corpus.
2. **A ticker-shaped IRR `companyId` is never canonical.** It may be submitted as an *unresolved
   input* under `identifierType: 'NSE_SYMBOL' | 'BSE_SYMBOL' | 'COMPOSITE_TICKER'` for
   resolution, but the **returned** authoritative `companyId` — not the caller's string — is what
   is persisted. `identifierType: 'COMPANY_ID'` does not exist in `IdentityQuery` and must not be
   added to accept caller-supplied identity.
3. **Exactly one valid resolution is required.** Zero or multiple candidates are refusals.
4. **DP-2 Option 2F refusal is preserved.** Unresolved or ambiguous holdings are refused before
   any port call or persistence. No bypass and no exception may be introduced to enable saving.
5. **The resolution corpus and its provenance are IPD-owned.** The caller does not supply the
   corpus, the mapping rows, or the `asOf` used for resolution.

### 7.3 Verified current defect that must be closed before any write path **[RV]**

`src/server/http-server.ts` `validateHolding()` (L363–401; `companyId` L381, `identityStatus` L392, `resolutionDisposition` L393–396) currently **accepts
caller-supplied** `companyId`, `identityStatus`, and `resolutionDisposition` — including
`resolutionDisposition: 'NON_PRODUCTION_OPERATOR_BYPASS'`. `src/portfolio/consolidation.ts`
Save Guard 2 (L110–118) then computes:

```typescript
const isResolved = h.identityStatus !== 'UNRESOLVED' && !!h.companyId;
const isBypass = h.identityStatus === 'UNRESOLVED'
              && h.resolutionDisposition === 'NON_PRODUCTION_OPERATOR_BYPASS';
```

and admits a holding when either is true. **A caller can therefore assert
`identityStatus: 'RESOLVED'` with an arbitrary `companyId` and pass the save guard.** This is a
caller-controlled identity assertion and is incompatible with §7.2.

Note that `evidence/operator_drop/NON_PRODUCTION_SINGLE_OPERATOR_IDENTITY_BYPASS.md` (Block 3M-A)
authorizes a bypass **for the offline frontend portfolio store**, gated on
`executionEnvironment === 'NON_PRODUCTION'` **and** `allowNonProductionBypass === true`. That
authorization does not extend to the G24 HTTP boundary, and this proposal does not extend it.

**Required closure (part of the contract, not optional):** the boundary must refuse
caller-supplied `identityStatus` and `resolutionDisposition` outright, and must derive identity
status only from an IPD-performed resolution. Until this is closed, **no successful write may be
admitted under any principal model.**

---

## 8. THREAT MODEL AND FAIL-CLOSED BEHAVIOR

### 8.1 Trust assumptions

| # | Assumption |
|---|---|
| A1 | The operator's OS user account is not fully compromised. |
| A2 | The authorized IRR server binary at `authorizedPeerPath` is not attacker-controlled and is invoked only by the operator's launcher. |
| A3 | IPD and IRR run on the same host, launched by the same operator account. |
| A4 | The endpoint DACL / socket permissions are correctly applied at creation and cannot be modified by an unprivileged process. |
| A5 | The provisioned `LocalPrincipalBinding` and any tenant membership are created only by an authorized IPD act. |

### 8.2 Threats and enforcement points

| Threat | Enforcement point | Behavior |
|---|---|---|
| **Unauthorized local process (different account)** | Endpoint DACL / socket permissions (§3.4) | Connection refused by the kernel. Fail-closed. |
| **Unauthorized local process (same account, different binary)** | Peer process identity verification (§4.1, Control 2) | Disconnected before any request byte is read. Fail-closed. |
| **Arbitrary process running the authorized binary** | **Not fully prevented.** Depends on launcher integrity (A2). | Accepted — residual risk R1. |
| **Code injection into the authorized IRR server** | **Not prevented.** | Accepted — residual risk R1. |
| **Fully compromised OS user account** | **Not prevented.** | Accepted — residual risk R1. Explicitly not claimed as protected. |
| **Untrusted browser-originated request** | Browser cannot open the IPC endpoint; IRR server holds endpoint identity; IPD refuses browser-supplied identity (§5.2, §5.3) | Refused. Fail-closed. |
| **Remote client** | Endpoint is not routable | Unreachable. |
| **Forged owner claim** | `applicationUserId` re-derived from provisioned binding, never from request | Refused. Fail-closed. |
| **Forged tenant claim** | `resolveTenant()` fail-closed at every branch; `requestedTenantId` is a hint only | Refused. Fail-closed. |
| **Foreign portfolio access** | `findAuthorizedPortfolio()` + non-disclosure | `ResourceNotFoundError` — indistinguishable from absent. |
| **Endpoint compromise or exposure** | Random unguessable name held only in IPD memory; never browser-visible; DACL; unlink on shutdown | Stale endpoint removed before bind; bind failure fail-closed. |
| **Endpoint name disclosure** | Name is not an authenticator (§3.5) | Disclosure alone grants nothing; DACL and peer check still apply. |
| **Stale process state / restarted IRR server** | Peer identity re-verified per connection (§4.1) | New process must re-verify; stale authorization not inherited. |
| **Revoked binding** | `status = 'REVOKED'` checked at resolution | Fail-closed. No implicit restoration. |
| **Ambiguous holding identity** | `resolveCompanyId()` fail-closed; Save Guard 2 | Refused before persistence (DP-2 Option 2F). |
| **Caller-supplied identity disposition** | §7.3 closure | Refused. Fail-closed. |
| **Stale revision** | `expectedRevision` → 409 | Rejected. |
| **PID→path resolution race** | **Not fully prevented.** | Accepted — residual risk R2. |

### 8.3 Residual risks requiring explicit authority acceptance

| ID | Risk | Statement |
|---|---|---|
| R1 | Same-privilege / same-binary process | The boundary does not protect against a process running the authorized binary, code injected into it, or a fully compromised OS account. **This proposal does not claim such protection.** |
| R2 | PID→path race | Between `GetNamedPipeClientProcessId` / `SO_PEERCRED` and path resolution, the peer process could exit and its PID be reused. Mitigation (hold the process handle open across the check) is proposed but **unvalidated**. |
| R3 | Windows `SeImpersonatePrivilege` | If IPD runs as a privileged service account, token theft may defeat the account boundary. Mitigation: IPD runs as the ordinary operator user. **Unvalidated.** |
| R4 | POSIX path | Proposed by symmetry only; no POSIX deployment evidence exists in this repository. |

### 8.4 What the proposed boundary does NOT protect against

Stated plainly for the record: it does not protect against a fully compromised operating-system
user account; an equally privileged malicious process; a malicious or tampered authorized IRR
server binary; a compromised launcher; kernel-level compromise; or physical access to an unlocked
session. It also does not address availability, denial of service, or data-at-rest encryption.

---

## 9. RUNTIME AND DEPLOYMENT ASSUMPTIONS

### 9.1 Assumptions and their status

| # | Assumption | Status |
|---|---|---|
| U1 | Deployment host is Windows, single operator, single interactive session | **Verified** (Windows acceptance evidence) **[RV]** |
| U2 | IRR server and IPD server run as the same OS user, launched by the operator | **Assumed — unverified** |
| U3 | The IRR server binary path is stable and known at provisioning time | **Assumed — unverified** |
| U4 | IPD does **not** run as a privileged service account | **Assumed — unverified** |
| U5 | No reverse proxy, preview host, LAN binding, or remote browser access is in scope | **Assumed — unverified** |
| U6 | The IPD listener is not exposed beyond the IPC endpoint | **Assumed — unverified** |
| U7 | The principal source is a server-owned launch-time value, never browser-visible | **Proposed — unvalidated** |
| U8 | SQLite database at `IPD_PORTFOLIO_DB_PATH` is protected by OS file permissions | **Assumed — unverified** |
| U9 | POSIX support is required | **Unknown — no evidence** |

**Every unverified assumption above is an open question.** No implementation may proceed until
the assumptions material to the chosen design are confirmed by the operator.

### 9.2 Open questions requiring authority answers before contract approval

| # | Question |
|---|---|
| Q-1 | What exactly is the server-owned source of the local principal, and who controls and verifies it at launch? (§5.2) |
| Q-2 | Which tenant treatment is selected — **T-1** or **T-2**? (§6.2) |
| Q-3 | Are the §6.3 blocking preconditions (tenant provisioning authority, audit, no implicit restoration, actor guards) authorized? |
| Q-4 | Is the deployment strictly single-host, single-operator, with no remote or preview-host exposure? (§9.1, U5/U6) |
| Q-5 | Under which OS account and with which privileges do the IRR and IPD servers run? (§9.1, U2/U4) |
| Q-6 | What is the authorized IRR server executable path used for peer verification, and how is it kept current? (§9.1, U3) |
| Q-7 | Is the §7.3 caller-supplied identity-disposition defect in scope for closure as part of this contract, and by which act? |
| Q-8 | What separately authorized canonical resolution source and successful-write policy apply, if any? |
| Q-9 | Are residual risks R1–R4 explicitly accepted? |

### 9.3 Compatibility with the existing G24 implementation

#### What is reusable without change **[RV]**

| Component | Reusable? |
|---|---|
| `PortfolioAuthorizer.authorizeScope()` / `authorize()` steps 2–3 (tenant + portfolio) | **Yes, unchanged** |
| `IdentityService.resolveTenant()` | **Yes, unchanged** |
| `DurablePortfolioStore` (all operations, revisions, consolidation, transactions) | **Yes, unchanged** |
| `PortfolioRepository.findAuthorizedPortfolio()` | **Yes, unchanged** |
| Persistence, migrations, recovery, no-in-memory-fallback | **Yes, unchanged** |
| `SecurityMaster` / `IdentityMappingStore.resolveCompanyId()` | **Yes, unchanged** (and already on `main`) |
| `IpdHttpServer` routing, body limits, grace shutdown | **Partly** — transport substrate reusable; credential source replaced |

#### Critical admission constraint — the G24 implementation is NOT on IPD `main` **[RV]**

**Verified:** IPD `main` (`70b24f029842a7e9b7f615e4d9df7376fd4ff817`) contains **113** files under
`src/` and has **no** `src/portfolio/`, `src/auth/`, `src/persistence/`, `src/server/`, or
`src/app_identity/` directory at all. The complete G24 implementation exists only on
`arena/01a0e6d9-iips-production-market-data` at `6828155e` (**147** files under `src/`).

```text
ref                    src/portfolio  src/auth  src/persistence  src/server  src/app_identity
70b24f0 (main)         ABSENT         ABSENT    ABSENT           ABSENT      ABSENT
6828155e (arena/…)     PRESENT        PRESENT   PRESENT          PRESENT     PRESENT
```

**Consequence:** there is currently **no eligible durable portfolio implementation on IPD
`main`**. Under G-2 request §3.8 and §5 step 2, the correct next action if this proposal is
accepted is a **separately authorized IPD-`main` implementation plan** — not promotion, merge,
cherry-pick, or repinning of the off-main lineage. This proposal creates no such authority.

`src/identity/` (canonical company identity) **is** on `main` and is therefore the one reusable
capability available without any promotion.

---

## 10. REQUIRED TESTS AND QUALIFICATION EVIDENCE (future authorized implementation)

No test below is authorized to run now. They are the qualification evidence a future authorized
implementation must produce.

### 10.1 Principal-source tests (fail-closed)

Absent principal; malformed principal; changed principal; forged principal; browser-supplied
principal; direct-HTTP caller; cross-site-triggered request; a peer whose executable path does
not match; an unresolvable peer PID; a second process of the same user with a different binary.
**Each must fail closed with no identity or owner inferred.**

### 10.2 Endpoint and peer-authentication tests

Connection refused for a different OS user account; connection refused for an unprivileged local
process; DACL/socket permissions verified at creation; stale endpoint removed before bind; bind
failure fail-closed; endpoint unlinked on graceful shutdown and on `SIGINT`/`SIGTERM`; endpoint
name never present in any browser-visible response; peer identity re-verified per connection
(restart does not inherit authorization).

### 10.3 Authorization tests

Exactly one-owner access succeeds only within the approved boundary; foreign owner, foreign
tenant, and foreign portfolio attempts denied **without disclosure**; caller-supplied
`applicationUserId` / `tenantId` / `requestedTenantId` never selects another scope;
unauthorized-as-not-found preserved; revoked binding fails closed.

### 10.4 Binding-lifecycle tests

Provisioning creates exactly one binding; revocation takes effect on the next resolution;
revoked-then-re-provisioned requires an explicit act (no implicit restoration); audit event
emitted for provision and revoke; stale context fails closed.

### 10.5 Canonical-identity tests

Exactly one canonical match may proceed **only under a separately approved successful-write
policy**; zero matches refused; multiple distinct matches refused; multiple converging matches
resolve to the single companyId; ticker-shaped caller `companyId` never treated as canonical;
caller-supplied `identityStatus` / `resolutionDisposition` **refused** (§7.3); DP-2 Option 2F
refusal preserved for unresolved and ambiguous holdings.

### 10.6 Persistence tests

Existing store transaction, revision conflict (409), idempotency/consolidation,
read-after-write, and **separate-process restart durability** pass; **no parallel portfolio
store is created**.

### 10.7 Routed integration tests

IRR→IPD requests exercise the **real** approved boundary and authorizer, not store-level or
mocked tests; a browser cannot provide identity or credentials; the 503 fence behavior is
verified unchanged for every operation not admitted.

### 10.8 Environment limitation to be disclosed

`tsc` is **not available** in the authoring environment. Syntax was validated only via Node
`node:module` `stripTypeScriptTypes`. **No TypeScript compilation is claimed for this
document.** Future qualification must run the repository's real typecheck and report it.

---

## 11. ALTERNATIVES CONSIDERED AND REASONS FOR REJECTING UNSAFE SHORTCUTS

| Alternative | Verdict | Reason |
|---|---|---|
| **Reject the local-principal model (G-2 Option B)** | Held as the fallback | Correct if §4 cannot exclude unauthorized callers without a prohibited mechanism. The 503 fence is retained. |
| **Defer (G-2 Option C)** | Held as the fallback | Correct if §6.3 preconditions cannot be authorized. |
| **Trust a caller-supplied owner/tenant header** | **REJECTED** | Caller-controlled. Not authentication. |
| **Treat loopback / `127.0.0.1` as authentication** | **REJECTED** | Loopback binds a socket; it authenticates nothing. |
| **Treat `Origin` / `Host` / CORS as authentication** | **REJECTED** | Browser-controlled and spoofable. |
| **Treat possession of the endpoint name as authentication** | **REJECTED** | Explicitly excluded by the decision request §3.2. |
| **Shared secret / service credential** | **REJECTED** | Excluded by DP-1 Option 1A′; would require a new scope decision. |
| **OIDC / Keycloak / RBAC** | **REJECTED** | Out of scope; P-2 already excludes OIDC work. |
| **Multi-user or enterprise tenant infrastructure** | **REJECTED** | Out of scope; single-user only. |
| **PostgreSQL / new persistence technology** | **REJECTED** | Out of scope; `better-sqlite3@13.0.3` is the accepted driver. |
| **Promote / merge / cherry-pick / repin the off-main G24 lineage** | **REJECTED** | §9.3 — not on `main`; requires a separate IPD-`main` plan. |
| **Reuse the F-3 `ownerUserId` / `tenantId` pair as the principal** | **REJECTED** | Partition context only; not an authenticated principal, not a G24 `applicationUserId`, not a membership. |
| **Use D115's principal/company-binding contract as an identity shortcut** | **REJECTED** | Separate namespaces; creates no Company Identity Authority. |
| **Keep the Block 3M-A `NON_PRODUCTION_OPERATOR_BYPASS` reachable through the HTTP boundary** | **REJECTED** | §7.3 — caller-controlled identity assertion; the authorization covers the offline frontend store only. |
| **Add a parallel IRR portfolio store** | **REJECTED** | Violates IPD ownership of the portfolio domain. |
| **Infer a tenant from single-user status** | **REJECTED** | §6.2 — explicitly forbidden. |

---

## 12. EXPLICIT NON-GOALS

This proposal does **not**:

- approve, amend, or make effective any IPD security contract;
- authorize implementation, provisioning, qualification, admission, or release;
- permit any successful portfolio write;
- change DP-2 Option 2F, the G-2 IPD ownership boundary, or the single-user scope;
- reopen P-2, F5R, D115, or any historical governance record;
- designate a Company Identity Authority;
- introduce OIDC, Keycloak, RBAC, multi-user or enterprise tenant infrastructure, PostgreSQL,
  or enterprise deployment architecture;
- promote, merge, cherry-pick, or repin the off-main G24 lineage;
- modify the IRR 503 fence, the user's Library tracker, or any IRR authority record;
- change any IPD source, test, dependency, schema, or runtime behavior;
- resolve AG-5 or any company-level identity mapping.

---

## 13. THE EXACT IPD AUTHORITY WHOSE ACCEPTANCE IS REQUIRED

### 13.1 Required authority

**Ramki / Program Authority, acting explicitly in the capacity of IPD security-contract
acceptance authority for the authoritative IPD repository
`ramkivs/iips-production-market-data`.**

**Basis:** the antecedent decision request §4.2 requires that, because IPD owns the portfolio
domain and the changed trust boundary is enforced by IPD, the decision must be accepted **for the
authoritative IPD security/API contract**, and that if Ramki is the authority for both the
program-level and IPD-level decisions, the record must state that explicitly in both capacities
and identify the IPD authoritative repository and ref.

### 13.2 Requested decision (one of)

1. **ACCEPT** clauses C-1…C-4 with a selected tenant treatment (T-1 or T-2), accepting residual
   risks R1–R4, and issue the follow-on gates in §15; **or**
2. **REJECT** — retain the G24 OIDC trust contract and the IRR 503 fence unchanged; **or**
3. **RETURN** — name the specific unanswered questions from §9.2 that must be resolved first.

### 13.3 Explicitly not acceptance

This proposal's publication; a green CI check; an IRR-side note; G-2 architecture acceptance;
DP-1 Option 1A′; P-2 completion; standing routine-work authority; silence.

---

## 14. SEPARATE SUBSEQUENT GATES

Each is a distinct, separately authorized gate. **None is authorized by this proposal.**

| Gate | Subject | Precondition |
|---|---|---|
| **G-2.1 Provisioning (P-4)** | Create exactly one `LocalPrincipalBinding` and, if T-1, one `ACTIVE` tenant membership, through an explicit IPD-side act with audit | §13 ACCEPT; §6.3 preconditions authorized |
| **G-2.2 Implementation authority (P-6)** | Name exact IPD and IRR repositories, authoritative base refs, code/config/test surfaces, local trust mechanism, data effects, exclusions | G-2.1 complete; an eligible IPD-`main` durable-store basis named (§9.3) |
| **G-2.3 Qualification (P-8)** | Execute §10 evidence in non-production; report honestly including toolchain limits | G-2.2 complete |
| **G-2.4 Route admission** | Per-operation admission act naming exact operation(s), route(s), environment, and limitations; reads and writes admitted separately | G-2.3 complete and independently reviewed |

The prior OIDC-oriented P-8 plan is **not** qualification for a local-principal design. No route
or successful-write authority follows from accepting this proposal.

---

## 15. VERIFICATION PERFORMED FOR THIS PROPOSAL

| Check | Result |
|---|---|
| IPD branch tip | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| IPD `main` tip | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` |
| G24 implementation on IPD `main` | **ABSENT** — no `src/portfolio`, `src/auth`, `src/persistence`, `src/server`, `src/app_identity` |
| Canonical identity (`src/identity/`) on IPD `main` | **PRESENT** |
| G24 authorization tests | `G24-E1..E9`, `G24-F1..F15`, `G24-H1..H10` enumerated from source |
| `validateHolding` accepts caller-supplied identity disposition | **CONFIRMED** (`src/server/http-server.ts` L363–401; `companyId` L381, `identityStatus` L392, `resolutionDisposition` L393–396) |
| Save Guard 2 admits caller-asserted resolution | **CONFIRMED** (`src/portfolio/consolidation.ts` L110–118) |
| `provisionTenantMembership` callers / endpoints / guards | **0 / 0 / 0** (per `evidence/np04/…` §4.4) |
| IRR runtime | React/Vite + Node server, **no Electron** |
| IRR PR #117 | open, head `322a5095a`, base `main` @ `eb4bf820c` |
| IPD open PRs at time of writing | **none** |
| Protected blueprint `docs/FINAL_INTEGRATION_BLUEPRINT_2026-09-28.md` | sha256 `9d23f327b4cfd5757bcaf28cdf39f0665e2285430cb550c67cd4ffc1dcbf4ba3` — unchanged |
| Files changed by this proposal | **one** — this document only |
| `tsc` availability | **NOT AVAILABLE** — no typecheck claimed |

---

**END OF PROPOSAL — AWAITING EXPLICIT IPD SECURITY-AUTHORITY DECISION.**

*This document is a proposal. It is not approved, not effective, not implemented, not qualified,
and not admitted. No IPD security contract, source, test, dependency, schema, or runtime behavior
was changed by its creation. No IRR artifact was modified.*
