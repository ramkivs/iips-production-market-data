# IIPS v3.0 — G-2: IPD-Side Security-Contract Proposal — Single-User Local Principal over OS-Protected Same-Host IPC

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-G2-IPD-LOCAL-PRINCIPAL-OS-IPC-SECURITY-CONTRACT-PROPOSAL-2026-10-16-01` |
| Record type | **IPD-side security-contract proposal** — decision-ready input for an explicit security-authority act. **Not** an authority act, **not** a contract amendment, **not** effective. |
| Status | **PROPOSED — NOT APPROVED · NOT EFFECTIVE · NOT IMPLEMENTED · NOT QUALIFIED · NOT ADMITTED · NO IMPLEMENTATION AUTHORITY** |
| Date | 2026-10-16 (Asia/Calcutta) |
| Requested decision authority | **Ramki — Program Authority and IPD repository owner/admin, acting in the IPD security-contract capacity** (exact act and clause scope in §14) |
| Authoritative repository for the proposed contract | `ramkivs/iips-production-market-data` (IPD) |
| Cross-repository dependency (upstream request and recorded Program Authority direction) | IRR `ramkivs/iips-review-recovered` PR **#117** — `docs/integration/IIPS_v3.0_G2_SINGLE_USER_LOCAL_PRINCIPAL_SECURITY_CONTRACT_DECISION_REQUEST_2026-10-16.md` (open, mergeable, CI pass; does **not** amend the IPD contract) |
| Baselines inspected for this proposal | IPD `main@70b24f029842a7e9b7f615e4d9df7376fd4ff817`; IPD G24 reference lineage (off-main, evidence only) `arena/01a0e6d9-iips-production-market-data@6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`; IRR `main@eb4bf820c62eb3e2f5c628a95d59c8f967e3f629` |
| Scope | One single-user, personal-use, non-production deployment boundary on the operator's own host. Production is out of scope. |
| Placement rationale | `evidence/` is IPD's established governance/decision-record root (`evidence/np04/…`, `evidence/d114/…`, `evidence/target-shell-integration/…`); `np04` is the IPD-side scope that owns the G22–G32 chain containing G24. This file is **new**; it modifies no existing artifact and touches no implementation, test, dependency, schema, or runtime surface. |

**Evidence classes used throughout.** **[V]** verified — reproducible from the cited path and ref. **[P]** proposed design — not implemented, not validated, creates no authority. **[U]** unresolved assumption / unvalidated fact — listed again in §16.

---

## 1. Purpose and decision sought

### 1.1 Purpose

The Program Authority has selected the **same-host OS-protected local IPC** direction in principle, for **design only** (recorded in the IRR request §8). That selection resolved the *direction*; it did not define the trust boundary, the principal, the owner/tenant binding, the canonical-identity obligation, or the failure semantics — and it did not accept any IPD-side contract change.

This record supplies the missing IPD-side artifact: **one concrete, technically grounded security-contract proposal** for a single-user personal application, expressed as a bounded set of clauses that IPD's security authority can accept, amend, or reject **as written**. Its purpose is to let G-2 advance *without* inventing identity mappings and *without* weakening any existing safeguard.

### 1.2 Decision sought

The Program Authority is asked to render **one explicit decision** on the proposed contract `L-IPC-1` (binding clauses **C1–C13**, specified in §3–§7), in the IPD security-contract capacity identified in §14, choosing exactly one of:

- **Option A — Accept `L-IPC-1` as specified.** The proposed clauses become the binding IPD-side contract for one single-user local-principal deployment. This would be a **material amendment to the current G24/IPD identity-acquisition clause** (§2.4) and nothing else. It would **not** authorize provisioning, implementation, qualification, any successful write, route admission, or the removal of any fence.
- **Option B — Accept with named clause changes.** The authority accepts the boundary but amends specific clauses (for example the tenant treatment in §6.2, the binding-record shape in §10.2, or the peer-permission requirement in C4), stating the changed text.
- **Option C — Reject.** Record that a non-caller-controlled local principal cannot satisfy IPD's security requirements within the single-user, non-production scope; retain the existing fail-closed surfaces unchanged.
- **Option D — Defer.** Keep every existing contract unchanged and treat §16's unresolved items (U-1…U-8) as the prerequisite set for a later decision.

**What no option grants.** No option authorizes implementation, provisioning, credentials, database writes, a successful portfolio save, route/UI activation, the removal or relaxation of any current fence, or any change to IRR's DP-2 Option 2F, IRR's HTTP 503 fence, existing authority records, or the off-main G24 lineage. Those are separate acts (§15).

---

## 2. Existing contract and the precise incompatibility

### 2.1 Where the IPD-owned G24 security contract is defined

The contract is **enforced in code and defined by the governed G24/NP04 records**, not by a single prose document:

| Layer | Location | Status |
|---|---|---|
| Enforcement — authentication | `src/server/http-server.ts` (authentication required on **every** `/api/ipd/*` route), `src/auth/oidc-verifier.ts` | **[V]** off-main G24 ref only |
| Enforcement — trust configuration | `src/auth/config.ts` (`IPD_OIDC_ISSUER`, `IPD_OIDC_JWKS_URI`, `IPD_OIDC_AUDIENCE` = `ipd-user-portfolio-api`; trusted algorithms `RS256`/`ES256`; fail-closed when unconfigured) | **[V]** off-main G24 ref only |
| Enforcement — authorization | `src/server/authorization.ts` (`PortfolioAuthorizer.authorize`, `authorizeScope`) | **[V]** off-main G24 ref only |
| Enforcement — identity and tenant | `src/app_identity/service.ts` (`resolveExternalIdentity`, `resolveTenant`, `provisionTenantMembership`, `revokeTenantMembership`) | **[V]** off-main G24 ref only |
| Enforcement — durable scope, revisions, guards | `src/portfolio/durable-store.ts`, `src/portfolio/repository.ts`, `src/portfolio/consolidation.ts` | **[V]** off-main G24 ref only |
| Storage contract | `src/persistence/migrations/001_initial_schema.ts` (`application_users`, `external_identity_mappings`, `mapping_audit_events`, `tenant_memberships`, `user_portfolios`, `portfolio_revisions`, `portfolio_revision_holdings`, `portfolio_contributions`, `portfolio_events`) | **[V]** off-main G24 ref only |
| Governance record of the IPD-side contract | `evidence/np04/NP04-GOVERNANCE-AUTHORITY-RECORD.md` (NP04-G32; records G22/G24/G29/G30/G31, the authorization triple, the tenant dispositions, and the deferred items) | **[V]** off-main G24 ref only |

**Two facts constrain this proposal:**

1. **IPD `main` contains none of this.** `git grep` for `NP04`, `G24`, or `applicationUserId` against IPD `main@70b24f0` returns **zero** matches; `src/persistence/` and `src/server/` do not exist on `main`. **[V]**
2. **The off-main G24 lineage is reference evidence only.** It is not admitted to IPD `main`, and this proposal neither promotes, merges, cherry-picks, nor re-pins it. **[V]** (commits `8c99627`, `d4fdb33`, `6828155` sit on `arena/01a0e6d9-iips-production-market-data`, not on `main`).

### 2.2 The current checks that require OIDC credentials, external-identity mappings, and active tenant membership

The logical sequence, verified in `src/server/authorization.ts` (module header and `authorize()`):

```text
verified OIDC identity  →  issuer + subject  →  applicationUserId
                        →  tenant membership  →  tenantId
                        →  portfolio authorization (applicationUserId + tenantId + portfolioId)
```

| Requirement | Exact current behaviour | Ref |
|---|---|---|
| OIDC bearer on every call | `verifier.verifyAuthorizationHeader(req.headers.authorization)` is invoked for every `/api/ipd/*` route before any routing decision; token must be a 3-segment JWS with a trusted `alg` (`RS256`/`ES256` only — `none` and symmetric algorithms rejected), a `kid`, a valid signature, `iss` equal to the configured issuer, `aud` containing the configured audience, and a non-expired `exp` | **[V]** `src/server/http-server.ts`, `src/auth/oidc-verifier.ts`, `src/auth/config.ts` |
| External-identity mapping | `resolveExternalIdentity(credential.issuer, credential.subject)` — key `(issuer, subject)` mapped to **exactly one** `applicationUserId`; lifecycle `PENDING → APPROVED → ACTIVE → RETIRED`; missing/conflicting mappings fail closed; the application-user id is a random opaque UUID and is never derived from a token subject, username, browser value, `companyId`, portfolio id, or operator identity | **[V]** `src/app_identity/service.ts` (L379+), `migrations/001` |
| Active tenant membership | `resolveTenant(applicationUserId, requestedTenantId)`: no memberships → Missing; explicit tenant not found → Missing; state ≠ `ACTIVE` → Revoked; **more than one `ACTIVE` membership with no tenant supplied → Missing (never guessed)**; zero `ACTIVE` → Revoked | **[V]** `src/app_identity/service.ts` (L466+) |
| Tenant hint is caller-supplied but never trusted as such | `x-ipd-tenant-id` is a **hint only**; it is validated against memberships and fails closed on mismatch | **[V]** `src/server/http-server.ts`, `src/server/authorization.ts` |
| Owner/tenant scope is always re-derived | Browser-supplied ownership is never trusted; ownership is re-derived from the governed mapping and the durable store; an unauthorized portfolio is indistinguishable from a missing one (`ResourceNotFoundError`) | **[V]** `src/server/authorization.ts`, `src/portfolio/durable-store.ts` |
| Provisioning is a governed act | `provisionTenantMembership` / `revokeTenantMembership` are transactional upserts, **0 non-test callers, 0 HTTP endpoints, 0 authorization guards, and no audit events**; `tenantId` has **no upstream authoritative source** in the repository | **[V]** NP04-G32 §4.4, §5.4, §6 |

### 2.3 Why a local principal is not an interpretation of the existing contract

The current accepted trust path (`DP-1 Option 1A′`, IRR `docs/integration/IIPS_v3.0_GATE_C_S5A_DP1_OPTION_1A_PRIME_BINDING_CONTRACT_AND_PREREQUISITE_SPECIFICATION_2026-10-13.md`) expressly excludes, as implemented exclusions in `src/auth/config.ts`: caller-service authentication, mTLS, token exchange, **service credentials, forwarded IRR-principal trust, browser identity trust, and operator bypass**. **[V]**

A locally established principal is therefore **not** reachable by interpretation: it requires an explicit contract clause. Equally, the reverse is true — the *local* nature of a call establishes nothing by itself (§4.1).

### 2.4 The precise incompatibility, stated as the clause to be amended

```text
CURRENT (G24, as written):
  The credential is a caller-presented, IPD-verified OIDC bearer.
  Identity is resolved issuer+subject → applicationUserId.
  Authorization requires an ACTIVE tenant membership.

PROPOSED (L-IPC-1), scoped to ONE single-user deployment endpoint:
  The credential-position fact is "the request was accepted on the OS-protected
  same-host IPC endpoint that IPD itself created and that IPD bound to exactly
  ONE pre-provisioned principal at provisioning time."
  Identity is the endpoint's provisioned binding; it is never a wire field.
  An ACTIVE tenant membership is still required, and is still the only tenant source.
```

**This is a material security-contract change — it must be expressly accepted (§14), not inferred.** Everything downstream of the credential position (`applicationUserId` semantics, tenant resolution, portfolio authorization triple, revision and consolidation controls, tombstone behaviour, canonical-identity rules) is proposed to remain **unchanged**.

---

## 3. Proposed OS-protected IPC trust boundary

### 3.1 Topology (proposed)

```text
  ┌──────────────────────────── operator's host (single OS account, today) ────────────────────────────┐
  │                                                                                                    │
  │ Browser (first-party SPA)                                                                          │
  │    │  HTTP, loopback only, same-origin; carries NO authority                                       │
  │    │  (no principal, no owner, no tenant, no portfolio scope)                                      │
  │    ▼                                                                                               │
  │ IRR server process (frontend/server/executive-transport.ts, Node)                                  │
  │    │  same-host IPC on the OS-protected endpoint created by IPD;                                   │
  │    │  no bearer, no shared secret, no forwarded principal, no caller identity                      │
  │    ▼                                                                                               │
  │ IPD portfolio service process                                                                      │
  │    (owns the durable store; binds the endpoint to ONE provisioned principal)                       │
  │    │                                                                                               │
  │    └─► durable portfolio store (IPD_PORTFOLIO_DB_PATH, SQLite)                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**C1 — Single privileged surface.** In this deployment, owner-scoped portfolio operations are reachable **only** through the same-host IPC endpoint. No TCP socket, HTTP route, browser-reachable URL, or other network surface may serve those operations. **[P]**

**C2 — Endpoint ownership.** The endpoint is **created and owned by the IPD service process** (server side of the IPC), not by IRR and not by the browser. IPD creates it only after configuration validation, store connection, and migration verification succeed — preserving the existing `validate → connect → migrate → verify → listen` startup discipline, with "listen" replaced by "bind the IPC endpoint". **[P]** (the discipline is **[V]** in `src/persistence/bootstrap.ts` / `src/server/http-server.ts` at the G24 ref.)

**C3 — Single-principal binding.** The endpoint carries exactly one provisioned principal binding, established by a separate IPD-side provisioning act (§6, §15). IPD never accepts a principal, owner, tenant, or portfolio-scope value from the wire for the purpose of establishing identity. **[P]**

### 3.2 Operating-system primitive (per runtime)

| Runtime | Candidate primitive | Rationale | Status |
|---|---|---|---|
| **Windows** — the actual operator deployment (see §9) | **Named pipe** (`\\.\pipe\<name>`) created by the IPD process, access-restricted to the operator's account/session by the pipe's OS security descriptor | Native Windows same-host byte-stream IPC; the OS — not the application — decides which principals may open the endpoint | **[P]** — mechanism selection to be validated on the deployment host (**U-1**, **U-2**) |
| **POSIX** (developer/CI hosts; not the deployment) | **AF_UNIX socket** in a directory whose mode restricts access to the operator's uid (e.g. `0700` directory, socket reachable only by that uid) | Filesystem permissions are the OS-enforced control on the socket object | **[P]** — not applicable to the deployment host |
| Windows AF_UNIX / other transports | Not proposed | Would add a second, unvalidated code path for no security benefit over named pipes | **[U]** |

**Nothing in this proposal depends on which of these two is used**, beyond the requirement in C4 that the OS must be the enforcing authority for endpoint access. The selection is a validation item, not a design assumption.

### 3.3 How IPD determines that a request came from the authorized application process

This is the crux, and the proposal states it **without overclaiming**:

1. **Reachability is OS-enforced (C4).** The endpoint's OS permissions admit only the OS principal(s) the provisioning act designates. A process outside those permissions cannot open the endpoint at all. This excludes: remote/LAN callers, other OS users or sessions, and every browser — browsers expose no API that can open a named pipe or AF_UNIX socket.
2. **The single-principal binding (C3) means reachability is sufficient to attribute ownership, and only for this deployment.** Because the endpoint serves exactly one provisioned principal, "accepted on this endpoint" ⇒ "acts as the provisioned principal" — with no wire-supplied identity involved and no possibility of acting as a different principal.
3. **Peer *process* identity is NOT asserted (U-3, explicit non-claim).** The in-scope toolchain does not provide a public API for peer credentials on AF_UNIX or for the Windows `GetNamedPipeClientProcessId` equivalent. Therefore **`L-IPC-1` does not claim that IPD can distinguish the authorized IRR process from any other process running as the same OS account.** What the contract claims is the weaker, verifiable statement in item 1 + item 2, plus the compensating controls in C5.

**C4 — OS-enforced endpoint permissions.** The endpoint's OS permissions must be restricted to the operator's account/session and must be **verified on the deployment host** as part of qualification (§11, Q3–Q4). If, on the deployment host, the created endpoint cannot be shown to exclude at least: (a) other OS users, and (b) any caller that is not a local process on that host — then the boundary does **not** satisfy this contract and the correct disposition is rejection, not a compensating workaround. (Browser exclusion is structural, not permission-based: browsers expose no API that can open such an endpoint, and C1 removes the network path entirely.) **[P]**

**C5 — Compensating controls required by the contract.** Because peer process identity is not asserted, the following are required and must be qualified: (i) the principal binding is single and endpoint-scoped, so no request can escalate to another principal; (ii) all IPD authorization and integrity checks remain authoritative (§5.3); (iii) the durable store's protection level must be **equal to, and not claimed to exceed**, the OS-account protection already applied to the store file — the proposal makes no confidentiality claim against code running as the operator's own account; (iv) the residual same-account risk is recorded in §8 as an explicit non-guarantee, not silently accepted. **[P]**

### 3.4 Endpoint creation, lifecycle, stale endpoints, and cleanup

**C6 — Lifecycle.** **[P]**

1. **Creation:** only by the IPD service process, after full startup validation (C2). No endpoint is created if configuration, store, migrations, or the principal binding is missing, malformed, or inconsistent.
2. **Name/stale-endpoint handling:** the endpoint identifier is created per service start from OS-provided randomness; any pre-existing object at that identifier is either rejected or removed only by the owning process. **The identifier is not a secret and is never treated as a credential** (see §4.1).
3. **Cleanup:** on graceful shutdown the endpoint is closed and, where the platform requires it, the socket object removed. On abnormal termination the stale artifact must not be reusable as an authenticated channel: a stale endpoint yields either connection refusal or a request that IPD refuses because the binding for it does not exist (fail closed).
4. **Restart durability:** restart of the IPD process must not change the principal binding or lose persisted portfolios; restart of the IRR process must not invalidate the binding.
5. **Revocation:** the binding has an explicit state (`ACTIVE` / `REVOKED`). Revocation must take effect for **new connections** without requiring the store to be dropped, and must be observable in an audit record.
6. **No fallback:** if the endpoint cannot be created or validated, the capability is unavailable. There is no default owner, no in-memory fallback, no "first-caller becomes owner", and no degraded mode. **[V]** *(the no-fallback principle is already established for persistence in `src/persistence/errors.ts`/`bootstrap.ts` at the G24 ref; **[P]** for the endpoint.)*

---

## 4. Peer authentication and endpoint permissions — what is and is not claimed

### 4.1 Explicit rejections (required by the decision request)

The following are **not** authentication and are **not** used as identity evidence under this proposal:

| Non-credential | Why it is rejected |
|---|---|
| `localhost` / `127.0.0.1` / any loopback address | Reachable by every process on the host — including a browser page through `fetch`/`XHR` — and by anything the OS routes to loopback. **[V]** *(the current G24 HTTP boundary binds `127.0.0.1:8099` by default: `src/server/config.ts`.)* |
| A private or unguessable URL / endpoint name | Possession, not proof; names leak through logs, config, process listings, and memory; a name is not a capability. |
| A caller-supplied principal/owner/tenant/scope field | Refused outright (§5.2) and never promoted into authority. |
| Browser `Origin`, `Host`, `Referer`, CORS, or same-origin policy | Access-control conveniences, not authentication; `Origin` is attacker-influenced in some configurations and is not a cryptographic proof. |
| The single-user product scope label (H-18) | Product scope is not a credential. |
| The F-3 owner-context carrier pair (`owner-7f3a91c2` / `irr-domain-4b82d6e1`) | Materialisation, never an authority; it is not an `applicationUserId`, not a tenant membership, and it does not unlock the portfolio capability. **[V]** IRR `frontend/server/owner-context-carrier.ts`, `owner-context-resolver.ts` |
| A static or shared secret shipped in a file, header, or URL | Excluded by the existing trust contract; a same-account process can read a file the same account can read, so it adds no boundary *and* it invites credential-handling obligations this scope excludes. |

### 4.2 Unauthorized local access — required behaviour

**C7 — Fail closed, uniformly.** A connection that IPD's endpoint permissions do not admit fails at the OS level, with no application-visible distinction. A connection that is admitted but carries no valid binding, or a binding in a non-`ACTIVE` state, fails closed with **no owner disclosure**: the response must not reveal whether a principal, portfolio, or owner exists. **[P]** *(the existing posture: unauthorized portfolios are indistinguishable from missing ones — `ResourceNotFoundError` in `src/server/authorization.ts`.)*

### 4.3 Windows versus other runtime environments — material differences

| Concern | Windows (deployment) | POSIX (dev/CI only) |
|---|---|---|
| Endpoint object | Named pipe object; permissions are a security descriptor evaluated by the OS kernel | AF_UNIX socket file; permissions are filesystem mode/ownership (plus ACLs) |
| Attribute owner | Pipe creator's token/session semantics govern the descriptor | Directory + socket ownership/permissions applied at bind time |
| Peer identity available to the application | Not available through the in-scope Node public API (**U-3**) | Not available through the in-scope Node public API (**U-3**) |
| Stale-object behaviour | A pipe object disappears when its last handle closes; recreation semantics must be validated (**U-2**) | A socket file can persist after abnormal exit and must be handled per C6.2 |
| Additional requirement | The resulting descriptor must be **verified**, not assumed (**U-1**) | Directory mode must be set before the socket is created |

**These differences are material**: a design validated on a POSIX developer host does **not** establish the Windows deployment boundary. Qualification must run on the deployment host (§9, §11).

---

## 5. Browser and server trust separation

### 5.1 Which component is trusted to establish the principal

**The IPD service process establishes the principal — not the browser, not IRR, and not the wire.** Concretely: the principal is the endpoint's provisioned binding (C3); IRR's role is to be the *only* component permitted to open the endpoint, and to relay portfolio operations without ever supplying identity. IRR does **not** mint, assert, or forward a principal, and no user/delegated credential is introduced.

### 5.2 What IPD refuses, always

**C8 — Refusal of caller-supplied authority.** On the IPC boundary, IPD must **refuse** (not ignore) any request that carries:

1. an application principal, user id, subject, mapping id, or credential material;
2. a portfolio owner claim;
3. a tenant identity or membership claim;
4. a portfolio authorization scope (owner/tenant/portfolio scope) selected by the caller.

This is not a new invention: the IRR-side contract already enumerates and refuses exactly these classes — `G2_TENANT_CLAIM_KEYS`, `G2_IDENTITY_CLAIM_KEYS` (including `companyId`, `runtimeCompanyId`, `identityStatus`, `resolutionDisposition`), and `G2_DURABLE_IDENTITY_KEYS` — via `assertNoG2CallerAuthority` / `classifyG2Claims` in `frontend/server/user-portfolio/translationBoundary.ts`. **[V]** `L-IPC-1` proposes that **IPD** re-enforce the same refusal independently, at its own boundary, so the refusal does not depend on IRR's cooperation.

### 5.3 Checks that remain authoritative inside IPD (regardless of what IRR supplies)

**C9 — No delegation of authority.** IRR's behaviour, shape-validation, or claim-refusal never substitutes for IPD enforcement. IPD remains solely authoritative for: identity (the provisioned binding), tenant resolution and membership state, portfolio ownership and lifecycle, revision/optimistic-concurrency checks, duplicate/idempotency and consolidation semantics, canonical company-identity validation and DP-2 Option 2F refusals, and audit emission. **[P]**, reusing **[V]** mechanisms where possible.

### 5.4 Can an untrusted browser page, renderer, or remote client invoke the privileged operation directly?

| Path | Answer under `L-IPC-1` | Basis |
|---|---|---|
| Browser → IPC endpoint directly | **No.** Browsers expose no API to open a named pipe or AF_UNIX socket, and the endpoint is not a network service. | **[P]** design; **[V]** platform capability |
| Remote/LAN client → IPC endpoint | **No.** Same reason; nothing is published on any network interface for owner-scoped operations. | **[P]** |
| Browser → IRR HTTP (`/api/user-portfolios*`) | **Yes, today, and it is refused with HTTP 503 `owner-context-unavailable` for every recognized owner-scoped route** — the transport does not read the body, the tenant claim, or the `Authorization` header, and it returns 503 before any domain or persistence access. | **[V]** IRR `frontend/server/user-portfolio-transport.ts`, `owner-context-unavailable.ts` |
| Browser → IRR HTTP, **after any future admission** | It would reach the real capability, **acting as the provisioned operator principal** (the principal is not supplied by the browser, so a cross-site request cannot impersonate a *different* user — it can only drive the operator's own capability). | **[P]** — hence §5.5 |

### 5.5 Current IRR exposure posture is incompatible with this contract (material finding)

Verified IRR facts at `main@eb4bf82`:

- the API server listens **without a host argument** (`server.listen(port, …)`, port `8787` default) ⇒ all interfaces; **[V]** `frontend/server/executive-transport.ts`
- it sets `Access-Control-Allow-Origin: *` and answers `OPTIONS` with `204` unconditionally; **[V]** same file
- the dev server is configured `host: '0.0.0.0'` with `allowedHosts: ['.e2b.app']` and proxies `/api` to `http://localhost:8787`. **[V]** `frontend/vite.config.ts`

None of this is authentication and none of it is a boundary. Under `L-IPC-1` the owner-scoped capability requires (**[P]**):

- **C10 — Deployment posture.** The browser-facing surface that can reach owner-scoped operations must be **loopback-bound** on the operator's host; LAN, hosted-preview, reverse-proxied, and shared-host deployments are **outside** the trust assumption and must not serve the capability. CORS must not be wildcarded for owner-scoped routes.
- **C11 — Cross-site request hardening.** Because a cross-site request reaching IRR would act as the operator's principal, IRR must reject owner-scoped state changes that do not originate from the first-party application (for example a required non-simple header / JSON content type forcing a preflight, plus an `Origin`/`Sec-Fetch-Site` consistency check). **These are CSRF hardening only and must never be treated as authentication.** **[P]**

---

## 6. Principal, owner, tenant, and portfolio binding

### 6.1 Mapping the trusted local principal to an IPD `applicationUserId`

**C12 — Binding is provisioned, opaque, and one-to-one.** **[P]**

1. IPD allocates **exactly one** opaque `applicationUserId` (existing random-UUID semantics, never derived from any identifier) for the local principal, by a **separate, explicit, operator-only offline provisioning act** (§15, gate P-A).
2. The binding record associates: the endpoint instance (deployment identity) → `applicationUserId` → the tenant value → lifecycle state → creation/revocation metadata and audit.
3. **No equivalence is created or implied** between this binding and: the F-3 `ownerUserId`/`tenantId` pair, an IRR principal, a raw OIDC subject, a browser value, an IRR owner id, `companyId`/`runtimeCompanyId`, or any other domain's identity. **[V]** standing constraint (D-2 §8; NP-08-D115-D2-G2 reconciliation; NP08-D115 §"companyId is not an owner identity").
4. Binding revocation and change take effect per C6.5 and are audited.

### 6.2 Tenant membership — addressed explicitly, not inferred

**Do not infer membership from single-user status, and do not assume a local principal establishes an IPD owner.** The current contract requires an `ACTIVE` membership and the current model fails closed without one (`resolveTenant`). Three options, with a recommendation:

| Option | Content | Assessment |
|---|---|---|
| **T1 — Reuse the existing model (recommended)** | The provisioning act creates one `application_user` and **exactly one** `ACTIVE` `tenant_memberships` row using an opaque, act-created personal tenant value; `resolveTenant` stays unchanged and fail-closed; `user_portfolios.tenant_id` keeps its one-tenant-per-portfolio constraint | **+** No change to the tenant contract, schema, or isolation invariant; preserves "exactly one ACTIVE membership"; reuses the audited mapping/lifecycle pattern. **−** Requires tenant-provisioning authority (currently **NOT AUTHORIZED**, NP04-G32 §5) and requires the currently-missing **audit** for membership mutations. **Not** an assertion that `tenant_memberships` is an enterprise tenant source of truth. |
| **T2 — Make tenant optional for this endpoint** | Contract/schema change (`user_portfolios.tenant_id NOT NULL`, `resolveTenant`) allowing a null tenant | **Rejected**: it weakens a governed isolation dimension, reopens the D115-adjacent tenant question, and buys nothing that T1 does not already provide at lower risk. |
| **T3 — Defer the tenant treatment** | Decide nothing; keep the capability unavailable | **Valid fallback** (Option D, §1.2) — the honest disposition if T1's prerequisite acts are not granted. |

**Recommendation: T1.** The proposal does **not** create a tenant value, a membership, or an administration endpoint; it identifies precisely which act must.

### 6.3 Where the current IPD model must change (exact identification)

| Dimension | Change required? | Exact answer |
|---|---|---|
| Credential position / identity acquisition | **YES — material contract change** | The OIDC-bearer clause (§2.4) must be amended for this one deployment to "accepted on the IPD-owned, OS-protected, single-principal local IPC endpoint". Required source change is confined to the identity-acquisition seam; the `OidcVerifier` and the TCP surface simply are not on this path. |
| `applicationUserId` semantics | **No** | Opaque, stable, separately governed; unchanged. |
| External-identity mapping table | **No** — but see §10.2 for the binding-record recommendation | The `(issuer, subject)` mapping table is **not** proposed as the place to record a local-IPC principal (that would conflate a transport fact with an external identity claim). |
| Tenant resolution and membership invariant | **No** (T1) | `resolveTenant` and the exactly-one-`ACTIVE` behaviour remain unchanged. |
| Portfolio authorization triple, revisions, consolidations, tombstones | **No** | Unchanged; reused. |
| Store / schema / parallel store | **No new store.** One narrow additive record (or migration) is needed for the binding (see §10.2) | The G24 store remains the candidate persistence capability. |
| Audit | **Narrow addition required** | Membership provisioning/revocation are currently **not audited** (§2.2); the contract requires audit for the lifecycle operations it relies on. |

---

## 7. Canonical company identity — contract for a successful holding write

Company identity is kept **entirely separate** from authentication and ownership. **[V]** standing separation (D-2 §8; DP-2).

### 7.1 Existing IPD capability that can provide the resolution

| Capability | Path | Verified properties |
|---|---|---|
| Security Master (D05) — **sole identity authority** | `src/identity/security_master.ts`, contract `src/contracts/d05_security_master.ts`, pinned fixture `evidence/operator_drop/d05_security_master_broad_universe.json` (SHA-256 `7f53540b…4b74b5`, pinned in `docs/FULL_IIPS_BI08_CONVERGENCE_FILE_MATRIX.md`) | `companyId` is the authoritative internal id; registering an entity auto-indexes ISIN, CIN, NSE symbol, BSE symbol/scrip code, and composite tickers |
| Point-in-time identifier mapping and resolution | `src/identity/mapping_store.ts` (`IdentityMappingStore.resolveCompanyId`) | Effective-dated mappings (`effectiveFrom`/`effectiveTo`) resolved at an explicit `asOf`; **fails closed** with `IdentityAmbiguityError` when zero mappings match (`UNMAPPED_IDENTIFIER`, quarantined) or when multiple mappings collide on different `companyId`s (`AMBIGUOUS_COLLISION`, quarantined) |
| Quarantine semantics | `src/identity/quarantine.ts` | Reason codes `UNMAPPED_IDENTIFIER`, `AMBIGUOUS_COLLISION`, `EXPIRED_EFFECTIVE_DATE`, `MISSING_EXCHANGE` |
| Governed fixture master | `src/identity/governed_fixture_master.ts`, `src/identity/d05_broad_universe_data.ts` | Fixture-backed master used offline |

All **[V]** on IPD `main@70b24f0`. **The competing resolver is already dispositioned**: the IPD convergence matrix records `frontend/server/portfolio/portfolio-resolver.ts` (FIGI/`canonicalSecurityId`) as **DEFER** — conflicting with `SecurityMaster` — and states that `SecurityMaster` is the sole identity authority. `L-IPC-1` therefore nominates the Security Master family only, and an implementation must not resurrect the deferred resolver. This is the capability the proposal nominates for authorized canonical resolution — **subject to a separate authority act designating it for the G-2 write path**, which this proposal does **not** render.

### 7.2 Required contract for a successful holding write

**C13 — Canonical identity contract.** **[P]**

1. A holding may persist only with a canonical `companyId` obtained from an **authorized, provenance-supported resolution** performed or verified **IPD-side**, using the capability in §7.1 (or another source separately designated by authority).
2. **Ticker-shaped and caller-supplied identity values are not canonical identity.** IRR's `companyId` field, symbol, ISIN, exchange, or any client field must never be accepted as canonical by declaration.
3. **Exactly one** resolution is admissible. Zero resolutions (`UNMAPPED_IDENTIFIER`) or multiple conflicting resolutions (`AMBIGUOUS_COLLISION`) ⇒ the holding is **refused**.
4. **DP-2 Option 2F remains in force and is not relaxed**: unresolved or ambiguous holdings are refused **before** serialization, port call, or persistence; the boundary emits neither `NON_PRODUCTION_OPERATOR_BYPASS` nor a false canonical-provenance declaration.
5. **No bypass may be introduced to enable saving.** The existing non-production single-operator bypass governs an offline UI-qualification path (`evidence/operator_drop/NON_PRODUCTION_SINGLE_OPERATOR_IDENTITY_BYPASS.md`, `GOV-REC-2026-NON-PROD-OPERATOR-BYPASS-01`); this proposal **does not extend, port, or admit** it to the IPC write path.
6. Writes that fail C13 are refused **without** creating a revision, a holding row, or a successful-write response.

### 7.3 A verified gap this contract must close (material finding)

The off-main G24 write path currently **accepts caller-supplied identity claims**, which conflicts with C13/2F:

- `src/server/http-server.ts` → `validateHolding()` **defaults** `companyId` to `''`, `identityStatus` to `'RESOLVED'`, and `resolutionDisposition` to `'CANONICAL_P04'`. **[V]**
- `src/portfolio/consolidation.ts` → Save Guard 2 treats a holding as resolved when `identityStatus !== 'UNRESOLVED' && !!companyId`, and accepts the explicit bypass branch `identityStatus === 'UNRESOLVED' && resolutionDisposition === 'NON_PRODUCTION_OPERATOR_BYPASS'`. **[V]**

Consequences that must be fixed by the future authorized implementation, **not** by this proposal: a caller can assert resolution state, and the write path has no IPD-side canonical-resolution step. `L-IPC-1` therefore requires (a) IPD-side refusal of `identityStatus`/`resolutionDisposition`/`companyId` claims arriving on the IPC boundary, and (b) IPD-side canonical resolution (or refusal) before persistence. Any future implementation that reuses the off-main write-path guard **as-is** would violate C13.

---

## 8. Threat model and fail-closed behaviour

### 8.1 Trust assumptions (explicit)

1. The operator's OS account and the host's OS kernel are trusted. **Outside the boundary:** a fully compromised OS account, a malicious kernel/administrator, hardware compromise, and physical access.
2. The operator does not intentionally run hostile processes as the same account. *(If they do, see T-1 and §8.4.)*
3. The IRR and IPD processes are the operator's own deployed code at authorized refs.
4. The browser is **never** trusted for authority; the first-party UI is trusted only to render and to relay requests.

### 8.2 Threats, enforcement points, and required outcomes

| # | Threat | Enforcement point | Required outcome |
|---|---|---|---|
| T-1 | Unauthorized local process (same or different account) connects to the endpoint | OS endpoint permissions (C4) | Different account/session ⇒ refused by the OS; same account ⇒ **admitted** — this is the documented, accepted residual (C5(iv)); it must not be misrepresented as authenticated |
| T-2 | Untrusted browser page / renderer / remote client calls the privileged operation | No network surface for owner-scoped operations (C1); CORS not wildcarded (C10); CSRF hardening (C11) | Cannot reach IPD at all; a cross-site request to IRR is rejected by the CSRF control |
| T-3 | Forged principal/owner/tenant/scope in the request | C8 refusal + C9 IPD authority | Request refused; no owner disclosed; no partial effect |
| T-4 | Forged or replayed credential material | Not applicable — the contract introduces no bearer; any principal-shaped field is refused (C8) | Refused |
| T-5 | Endpoint exposure (name learned, endpoint discoverable, endpoint reachable from another interface) | Name is not a credential (C6.2, §4.1); endpoint is not a network service (C1) | Exposure of the name grants nothing beyond what the OS already permits |
| T-6 | Stale endpoint / stale process state after abnormal exit | C6.3, C6.5 — stale endpoints yield refusal; revoked binding yields refusal | Fail closed; no owner inferred; no fallback |
| T-7 | Ambiguous or unresolved holding | C13 (2F): refuse before persistence | Refusal; no revision, no partial write |
| T-8 | Concurrent write / lost update | Existing revision (`expectedRevision`) and immediate-transaction semantics **[V]** `src/portfolio/durable-store.ts` | Revision conflict reported; no silent overwrite |
| T-9 | Cross-owner / cross-tenant probe | Existing authorization triple + "unauthorized ≡ missing" **[V]** | Indistinguishable refusal; no disclosure |
| T-10 | Binding revoked while IRR keeps calling | C6.5 revocation takes effect for new connections | Refusal until the operator re-provisions |
| T-11 | Startup with missing/partial configuration (no binding, no store, no migrations) | C2, C6.1 | Capability unavailable; **no** endpoint creation |
| T-12 | Store or binding corruption | Fail-closed persistence **[V]** `src/persistence/errors.ts` (no in-memory fallback) | Refusal; no degraded mode |

### 8.3 What this boundary does **not** protect against (required disclosure)

- A **fully compromised OS account** or an **equally privileged malicious process** running as the operator's account. The design does **not** claim process-identity authentication (U-3), so such a process may open the endpoint exactly as IRR can.
- **Bypass of the store file's protection.** The proposal claims confidentiality/integrity for portfolio data **only** to the level of the OS-account protection applied to the store itself.
- **Supply-chain or code-integrity attacks** inside either process.
- **Hosted-preview, LAN, shared-host, or remote-browser operation** — explicitly outside the trust assumption (C10).
- **Availability** guarantees, and **cross-system audit delivery** (still unresolved/deferred per NP04-G32 §5.4).
- Any form of **user attribution or non-repudiation** beyond "the provisioned single principal performed this operation".

### 8.4 Residual risk acceptance

T-1's same-account residual is **inherent to the single-user, single-account deployment** and must be accepted explicitly as part of any Option A/B acceptance, or else the boundary must be strengthened beyond this scope (separate low-privilege service account — alternative **A7**, §12). It must **not** be recorded as "protected" anywhere in the contract, evidence, or UI.

---

## 9. Runtime and deployment assumptions

| Assumption | Value / status |
|---|---|
| Operator host | The operator's own machine, running Windows. Prior governed evidence records operator runs on Windows: IRR tracker §16.31 (`CV-CORR-19`) — operator run on `DESKTOP-NO0NHTP`, Windows PowerShell `5.1.26100.9444`, corroborated by hosted Windows runs (Windows PowerShell 5.1 and PowerShell 7.6); IPD `windows-acceptance-evidence/` records a Windows acceptance worktree at `G:\IIPS-IIPS-FULL-SHELL-WINDOWS-ACCEPTANCE`; IPD ships a Windows PowerShell operator script `run-d114-legacy-acquisition.ps1`. **[V]** |
| Node.js | Node 22 / npm 10 — the toolchain the recorded local validation evidence was produced with and which IRR CI pins. **[V]** IRR `.github/workflows/ci.yml`; sandbox-verified Node `v22.22.3` |
| Exact Windows build, pipe-descriptor behaviour, and Node patch level on the deployment host | **UNRESOLVED (U-1, U-2)** — must be probed, not assumed |
| IRR server surface | `frontend/server/executive-transport.ts`, `EXEC_TRANSPORT_PORT` (default `8787`), currently listening on all interfaces with wildcard CORS. **[V]** (§5.5) |
| IPD owner-scoped surface today | The G24 HTTP boundary (`IPD_HTTP_HOST` default `127.0.0.1`, `IPD_HTTP_PORT` default `8099`) exists **off-main only** and is not admitted. **[V]** |
| Durable store | SQLite via exact-pinned `better-sqlite3@13.0.3`, DB path from `IPD_PORTFOLIO_DB_PATH` (absolute). **[V]** NP04-G32 §4.1/§6 |
| Execution mode | NON_PRODUCTION. Production is out of scope. **[V]** |
| Preview / remote environments | Arena preview hosts (`*.e2b.app`) and any LAN/shared host are **not** the deployment environment and **must not** serve the owner-scoped capability (C10). A green preview is not qualification. **[P]** |
| Single operator | One human operator, one OS account, one host, one principal binding. **[P]** |

---

## 10. Compatibility with the existing G24 implementation

### 10.1 Reuse assessment (from the inspected off-main reference; no promotion implied)

| Component | Reuse under `L-IPC-1` | Note |
|---|---|---|
| `PortfolioRepository`, `DurablePortfolioStore` (scope triple, revisions, tombstone, consolidation delegation) | **Reusable unchanged** | Owner/tenant scoping is exactly what the contract needs |
| `consolidation.ts` semantics (MERGE/REPLACE, idempotency, weight guard) | **Reusable**, with C13 override | Save Guard 2's caller-claim acceptance must be superseded at the IPC boundary |
| `IdentityService` mapping lifecycle + `mapping_audit_events` | **Pattern reusable**; not used for a local-IPC principal by declaration | Audit-in-transaction pattern is the model for the binding record |
| `resolveTenant` + `tenant_memberships` | **Reusable unchanged** (T1) | Requires provisioning authority + audit (narrow addition) |
| `OidcVerifier`, `src/auth/config.ts`, trusted-algorithm set | **Not on this path** | Retained for any other surface; untouched by this proposal |
| `src/server/http-server.ts` (TCP `/api/ipd/*`) | **Not on this path** for owner-scoped operations (C1) | Its `validateHolding()` defaults must not be carried into the IPC path (§7.3) |
| `src/persistence/*` (bootstrap, migrations, ledger) | **Reusable unchanged** | Startup discipline preserved (C2) |

### 10.2 Binding-record shape — recommendation

Two shapes are technically possible. **Recommendation: shape (b).**

- **(a) Reuse `external_identity_mappings` with a synthetic non-OIDC issuer value.** Rejected: it would place a *transport/deployment* fact into a table whose governed meaning is "external identity claim", inviting exactly the identity-equivalence inference the program forbids.
- **(b) One narrow additive binding record (new migration), e.g. `local_principal_bindings(endpoint_id, application_user_id → application_users, tenant_id, state ∈ {ACTIVE, REVOKED}, created_at, updated_at, revoked_at)` plus an audit event on every lifecycle mutation.** Recommended: keeps namespaces separate, makes revocation explicit and auditable, and does not touch the OIDC mapping semantics. It adds **no** parallel portfolio store.

### 10.3 Answer to "can the current G24 architecture support this without a material contract change?"

**No — one material security-contract change is required**, and it is precisely the identity-acquisition/credential clause (§2.4). Everything else in the G24 architecture (authorization triple, store, revisions, consolidation, tenant model, migrations discipline) can be reused, with one narrow additive binding record and one narrow audit addition. **The off-main G24 lineage is not admitted, promoted, merged, cherry-picked, or re-pinned by this proposal.**

---

## 11. Required tests and qualification evidence (future authorized implementation)

**Evidence bar:** every item below must be executed on the **deployment host** (Windows), as a **separate OS process** pair (IRR server + IPD service), against **real** code — not mocks — with raw command output, exit codes, and artifact digests recorded. A green preview, unit suite, or store-level test alone does not qualify the boundary.

| ID | Required evidence | Pass criterion |
|---|---|---|
| Q1 | Endpoint creation probe: confirm the endpoint exists after IPD startup and that **nothing** is listening on TCP for owner-scoped operations | Endpoint present; TCP absent (both interrogated, output attached) |
| Q2 | Startup fail-closed: absent/malformed binding, absent store path, unverified migrations | No endpoint created; capability unavailable; no fallback |
| Q3 | **Endpoint permission verification on Windows**: enumerate the endpoint's effective permissions/DACL and the identities they admit | Output shows only the operator's account/session (plus OS-mandated principals, disclosed explicitly); if broader, **QUALIFICATION FAILS** |
| Q4 | Cross-account negative test: a second OS user/session attempts to connect | Connection refused/denied at the OS level |
| Q5 | Same-account non-IRR process attempts to connect | Expected result **recorded honestly** as ADMITTED (residual T-1); the report must state that peer process identity is not established |
| Q6 | Browser/remote reachability: browser page (including cross-origin) and a LAN peer attempt to reach the privileged operation | Both fail; no state change |
| Q7 | Claim-refusal matrix: requests carrying principal/owner/tenant/portfolio-scope/`companyId`/`identityStatus`/`resolutionDisposition` claims | Each refused; no owner disclosed; no write |
| Q8 | Owner/tenant isolation: matching binding succeeds; foreign tenant/portfolio attempts fail | Success only for the provisioned principal; foreign attempts indistinguishable from missing |
| Q9 | Canonical identity: one match; zero matches (`UNMAPPED_IDENTIFIER`); conflicting matches (`AMBIGUOUS_COLLISION`) | One match proceeds only under the separately authorized write policy; zero/multiple refused **before** serialization/port/store, with quarantine evidence |
| Q10 | Revision and integrity: stale `expectedRevision`, duplicate-content no-op, MERGE/REPLACE parity, tombstoned portfolio | Existing behaviour preserved; no silent overwrite; no cross-owner disclosure |
| Q11 | Durability across restart: write, stop both processes, restart, read back; plus binding revocation across restart | Data intact; revoked binding fails closed for new connections |
| Q12 | Audit evidence: binding lifecycle and any membership mutation emit auditable records | Records present, ordered, in-transaction |
| Q13 | No-parallel-store check: file/store inventory confirms exactly one portfolio store | One store; no second portfolio model |
| Q14 | Boundary-drift check: the qualified surfaces are byte-identical to what was tested (blob digests recorded) | Digests match; drift invalidates qualification |

*(Q14 note: the "published state is the tested state" discipline is already the program's established evidence bar — IRR F-3 qualification and the Gate C fence-blob verification pattern.)*

---

## 12. Alternatives considered, and why unsafe shortcuts are rejected

| Alt | Description | Verdict |
|---|---|---|
| **A1** | Loopback TCP + `Origin`/`Host` checks as the boundary | **Rejected.** Loopback is reachable by every local process and by browser pages; `Origin`/`Host` are not authentication; the existing G24 boundary already binds `127.0.0.1` and that fact proves nothing about the caller |
| **A2** | Static/shared secret in a file, header, env var, or "endpoint token" | **Rejected.** Excluded by the current trust contract; a same-account process can read it, so it adds no boundary and creates credential-handling obligations outside this scope |
| **A3** | OIDC / Keycloak / issuer / token exchange for the local app | **Rejected as an assumed solution.** Out of scope for the single-user product boundary (H-18) and excluded by Gate C P-2; the recorded P-2-class prerequisite chain is not reopened by this proposal |
| **A4** | In-process library import of the IPD package (IRR pins IPD as a Git dependency and already imports it in-process — **[V]** IRR `frontend/package.json` pins `2e11fa3b…`) | **Rejected for this capability.** No OS-enforced separation; any code path in the IRR process (including anything reachable from the HTTP surface) would hold direct object access to the store, and the boundary would no longer be independently enforceable or testable. It also does not implement the Program Authority's selected direction. Reserved: it remains the existing integration mechanism for other domains |
| **A5** | Reuse the F-3 owner-context carrier as the G24 principal | **Rejected.** F-3 is explicitly materialisation, not authority; it is not an `applicationUserId`, not a membership, does not unlock the portfolio capability, and D-2 §8 forbids the equivalence |
| **A6** | Forwarded/asserted principal header from IRR ("the caller says who it is") | **Rejected.** Expressly excluded by the current trust contract; caller-supplied identity is not authentication (§4.1) |
| **A7** | Run the IPD service under a **separate low-privilege OS account**, ACL the endpoint and store to that account, and constrain IRR's account to the endpoint only | **Not rejected — deferred as a scope question.** This is the only option that could raise the boundary above the same-account residual (T-1), but it introduces OS service/account administration, credential/ACL management, and deployment complexity beyond the single-user personal-application scope. Requires its own scope decision; it is out of scope here |
| **A8** | mTLS or TLS over a local TCP socket | **Rejected.** Needs certificates/key custody/rotation (out of scope), and the transport remains TCP: an OS-level endpoint permission model is strictly simpler and strictly narrower |

---

## 13. Explicit non-goals

This proposal and any acceptance of `L-IPC-1` do **not**:

- authorize implementation, provisioning, credentials, database writes, or a successful portfolio save;
- approve, qualify, admit, or enable any route, UI surface, or capability;
- modify or reinterpret the IRR HTTP 503 `owner-context-unavailable` fence, DP-2 Option 2F, DP-1 Option 1A′, or any existing authority record;
- promote, merge, cherry-pick, or re-pin the off-main G24 lineage, or admit it to IPD `main`;
- introduce OIDC, Keycloak, RBAC, multi-user or enterprise tenant infrastructure, PostgreSQL, enterprise deployment architecture, or a second portfolio store;
- designate a Company Identity Authority, a canonical-identifier policy, or a successful-write policy (§7 requires a separate act for the write path);
- remove, weaken, or extend the non-production operator-bypass record;
- create, infer, or alias any owner, tenant, principal, or company identifier;
- establish cross-system security-audit delivery, tenant administration, or tenant lifecycle policy;
- assert production, deployment, or runtime readiness of anything.

---

## 14. The exact IPD authority whose acceptance is required, and the requested decision

**Accepting capacity:** **Ramki — Program Authority, acting as the IPD security-contract authority for `ramkivs/iips-production-market-data` (repository owner/admin)**. The acceptance must be recorded **durably in the IPD repository** (a new IPD-side decision record naming this proposal and its ref), because IPD owns the portfolio domain and the changed trust boundary is enforced by IPD. **[V]** basis: the G-2 architectural decision assigns IPD ownership of the portfolio domain; the IPD-side contract currently exists only in the NP04-G24 series; "an IRR-only note does not silently change IPD's security contract" (IRR request §4.2).

**Requested decision text (accept/reject/amend, verbatim-quotable):**

> I, Ramki, as Program Authority and IPD security-contract authority, decide on the IPD-side security-contract proposal `IIPS-V3-G2-IPD-LOCAL-PRINCIPAL-OS-IPC-SECURITY-CONTRACT-PROPOSAL-2026-10-16-01` (`L-IPC-1`, clauses C1–C13). I accept / accept with the following clause changes / reject / defer:
> [ … ].
> If accepted, I amend, **for one single-user, non-production deployment only**, the G24 identity-acquisition clause: the credential position becomes "accepted on the IPD-owned, OS-protected, same-host IPC endpoint bound to exactly one pre-provisioned principal", with all downstream authorization, tenant-membership, revision, canonical-identity, and DP-2 Option 2F requirements unchanged. I grant **no** provisioning, implementation, qualification, successful-write, route, or admission authority by this act. I confirm that peer process identity is **not** claimed, and that the same-account residual (T-1) is accepted explicitly / is not accepted and requires alternative A7.

**Interdependent IRR-side act (separately required, none inferred):** an explicit IRR-side amendment act to the DP-1 Option 1A′ identity/credential trust clauses (preserving DP-2 Option 2F, H-18 scope, and the 503 fence) — the same human may act in both capacities, but each act must state its capacity and its repository/ref.

---

## 15. Separate subsequent gates (none opened by this proposal)

| Gate | Content | Authority required |
|---|---|---|
| **P-A — Provisioning** | Create exactly one `application_user`, one opaque personal tenant, exactly one `ACTIVE` membership, and one local-principal binding; name the endpoint/deployment identity; define revocation; add the required audit for membership mutations; run operator-only, offline, non-production | Separate explicit IPD provisioning act (tenant provisioning is currently **NOT AUTHORIZED**, NP04-G32 §5) |
| **P-B — Implementation authority** | Name the exact IPD and IRR repositories, base refs, files/config/tests to be created or changed, the IPC mechanism chosen from C4, and the exclusions; decide whether any IPD-main implementation basis exists or must be created | Separate explicit IPD and IRR implementation-authority acts (the off-main G24 lineage is **not** a base) |
| **P-C — Qualification** | Execute Q1–Q14 on the deployment host; publish raw evidence; independent review | Separate qualification/acceptance authority |
| **P-D — Route/consumer admission** | Per-operation admission (reads and writes separately), the fence reconsideration conditions, and any UI admission | Separate per-capability admission act; IRR's HTTP 503 fence stays in force until then |
| **P-E — Write policy / canonical identity** | Designate the authorized canonical resolution source for the write path and the successful-write policy | Separate act; `L-IPC-1` presumes **no** successful writes |

---

## 16. Unresolved assumptions and open questions (must be answered before or during P-B)

| ID | Item | Why it matters |
|---|---|---|
| **U-1** | The **effective OS permissions** of the endpoint created on the deployment host (Windows named pipe security descriptor), and whether the in-scope toolchain can set or verify it | C4 depends on it; if it cannot be shown to exclude other users/sessions, the boundary fails and the disposition is rejection |
| **U-2** | Stale-object and re-creation semantics for the chosen mechanism on the deployment host, including behaviour after abnormal termination | C6.3 |
| **U-3** | Availability of **peer process identity** (Windows `GetNamedPipeClientProcessId` equivalent; POSIX peer credentials) in the in-scope toolchain | Determines whether §3.3.3's non-claim can be narrowed; today it cannot |
| **U-4** | Whether the workspace/toolchain's Node version exposes any API relevant to endpoint permissions | Affects whether U-1 is achievable without native code (native code is **not** proposed) |
| **U-5** | Exact tenant value rule for the single personal tenant (opaque act-created value) | T1 prerequisite; no value is invented here |
| **U-6** | Whether the accepting authority requires the binding record shape (b) of §10.2 or prefers (a) | Clause-level acceptance |
| **U-7** | Audit destination/retention for binding lifecycle and membership mutations in the single-user, non-production regime | NP04-G32 §5.4 defers cross-system audit; a local-only answer is required |
| **U-8** | Whether the IRR-side CSRF hardening (C11) is acceptable within the existing no-auth program decision, or needs its own authorization | Warranted by §5.5; must not be treated as authentication |

---

## 17. Closing statement

This record is a **proposal**. It is **not approved, not effective, not implemented, not qualified, and not admitted**. It changes no IPD security contract, no implementation, no test, no dependency, no schema, no runtime configuration, and no IRR artifact; it does not create or modify any owner, tenant, principal, or company identity; it does not touch IRR's 503 fence, DP-2, or any existing authority record; and it does not promote, merge, cherry-pick, or re-pin the off-main G24 lineage. **No implementation may begin because this proposal exists or because it is published or reviewed.** The next authorized action is the explicit IPD-side security-authority decision requested in §14.

*End of proposal `IIPS-V3-G2-IPD-LOCAL-PRINCIPAL-OS-IPC-SECURITY-CONTRACT-PROPOSAL-2026-10-16-01`.*
