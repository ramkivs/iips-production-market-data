# IIPS v3.0 — G-2: IPD-Side Security-Contract Proposal — Single-User Local Principal over Same-Host IPC (Personal-Laptop Scope)

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-G2-IPD-LOCAL-PRINCIPAL-OS-IPC-SECURITY-CONTRACT-PROPOSAL-2026-10-16-01` |
| Revision | **2** (2026-10-16, Asia/Calcutta) — scope-refined: one user, one personal laptop, non-production. Supersedes the revision-1 framing published in IPD PR #8; revision-1 analysis is retained wherever it remains valid. |
| Record type | **IPD-side security-contract proposal** — decision-ready input for one explicit IPD security-authority act. **Not** an authority act, **not** a contract amendment, **not** effective. |
| Status | **PROPOSED — NOT APPROVED · NOT EFFECTIVE · NOT IMPLEMENTED · NOT QUALIFIED · NOT ADMITTED · NO IMPLEMENTATION AUTHORITY** *(as first published; **superseded by the acceptance act below**)* |
| **Acceptance act (2026-10-16)** | **ACCEPTED WITH CHANGES** by Ramki, Program Authority acting as the IPD security-contract authority — decision record `IIPS-V3-G2-IPD-SECURITY-CONTRACT-ACCEPTANCE-DECISION-2026-10-16-01`; accepted text = revision-2 file at blob `cab04b6f94618c9afad1440882ebf63437fdf6f8`. Acceptance is scoped to one user / one personal laptop / non-production, is **not** a demonstration that the boundary works on the host, and grants **no** provisioning, implementation, qualification, successful-write, route or admission authority. || Status | **PROPOSED — NOT APPROVED · NOT EFFECTIVE · NOT IMPLEMENTED · NOT QUALIFIED · NOT ADMITTED · NO IMPLEMENTATION AUTHORITY** |
| Requested decision authority | **Ramki — Program Authority and IPD repository owner/admin, acting in the IPD security-contract capacity** (§13) |
| Authoritative repository for the proposed contract | `ramkivs/iips-production-market-data` (IPD) |
| Upstream record | IRR `ramkivs/iips-review-recovered` PR **#117** — `docs/integration/IIPS_v3.0_G2_SINGLE_USER_LOCAL_PRINCIPAL_SECURITY_CONTRACT_DECISION_REQUEST_2026-10-16.md` (Recorded Program Authority direction: Option A in principle, **design only**, same-host OS-protected local IPC) |
| Publication vehicle | IPD PR **#8** (this same file; no competing proposal is created) |
| Baselines inspected | IPD `main@70b24f029842a7e9b7f615e4d9df7376fd4ff817`; IPD G24 lineage (off-main, evidence only) `arena/01a0e6d9-iips-production-market-data@6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`; IRR `main@eb4bf820c62eb3e2f5c628a95d59c8f967e3f629` |
| Deployment scope | One operator, one personal laptop, one OS account, non-production. Production is out of scope. |

**Revision-2 change summary (what this revision does differently).** (1) The deployment scope is narrowed to one user on one personal laptop and the enterprise-oriented scaffolding of revision 1 (multi-gate provisioning programme, cross-system audit, dedicated service-account alternative as a live option) is removed or demoted. (2) The **Windows named-pipe endpoint-permission reality is now verified from primary sources** (libuv source, Microsoft documentation, Node documentation/source), and the proposal **no longer claims that the application restricts the endpoint's OS permissions on Windows** — that claim was incorrect for this runtime, and §4 replaces it with measured facts, design rules that compensate, and a mandatory host verification gate. (3) The same-user-process exposure is stated with its exact mechanism (the default named-pipe DACL grants **full control to the creating user**), not as a generic disclaimer. (4) The separate privileged service is explicitly **not** proposed, with the technical reason it would not help on this runtime (§11, A7). (5) The required decision is reduced to **one clause plus two narrow additions** (§2.4, §6.3).

**Evidence classes.** **[V]** verified — reproducible from the cited path, ref, source line, or executed probe (revision-2 probes are listed in §4.5 and were executed in this session). **[D]** documented platform behaviour — cited to the vendor's own documentation or upstream source. **[P]** proposed design — not implemented, creates no authority. **[U]** unresolved / not yet verified on the deployment host.

---

## 1. Purpose, scope, and decision sought

### 1.1 What this is

The Program Authority selected the **same-host OS-protected local IPC** direction in principle, for design only. This proposal supplies the **IPD-side contract** for that direction, at the smallest scope that satisfies it: **one user, one personal laptop, one OS account, non-production, no enterprise identity infrastructure.**

This is deliberately not an enterprise platform design. There is no identity provider, no directory, no role model, no multi-user or multi-tenant capability, no service account, no network listener for the privileged operation, and no new portfolio store. The design is two local processes on one machine, talking over an OS-provided same-host IPC endpoint, with the durable store staying exactly where G-2 already put it (IPD).

### 1.2 Decision sought

One explicit decision on the proposed contract **`L-IPC-1`** (binding clauses **C1–C12**, §3–§7), rendering exactly one of:

- **Option A — Accept `L-IPC-1` as specified.** One material amendment to the G24 identity-acquisition clause (§2.4) plus two narrow additions (§6.3), scoped to this one deployment. Grants no provisioning, no implementation, no qualification, no successful write, no admission, and removes no fence.
- **Option B — Accept with named clause changes**, stating the changed text.
- **Option C — Reject.** Record that a same-host IPC boundary cannot satisfy IPD's security requirements within this scope; keep the existing fail-closed surfaces unchanged.
- **Option D — Defer**, treating §15 as the prerequisite set for a later decision.

### 1.3 What acceptance would not do

Acceptance of `L-IPC-1` would **not** authorize implementation, provisioning, credentials, database writes, a successful portfolio save, route or UI activation, or the removal/relaxation of IRR's HTTP 503 fence, DP-2 Option 2F, or any existing authority record; and it would not promote, merge, cherry-pick, or re-pin the off-main G24 lineage. Those remain separate acts (§14).

---

## 2. Existing contract and the precise incompatibility

### 2.1 Where the IPD-owned G24 security contract is defined

The contract is **enforced in code and recorded by the NP04 governance record**, not in a single prose document:

| Layer | Location | Status |
|---|---|---|
| Authentication on every `/api/ipd/*` route | `src/server/http-server.ts`, `src/auth/oidc-verifier.ts` | **[V]** off-main G24 ref |
| Trust configuration (issuer, JWKS, audience `ipd-user-portfolio-api`, `RS256`/`ES256` only, fail-closed when unconfigured) | `src/auth/config.ts` | **[V]** off-main G24 ref |
| Identity → tenant → portfolio authorization | `src/server/authorization.ts` | **[V]** off-main G24 ref |
| Identity and tenant services | `src/app_identity/service.ts` (`resolveExternalIdentity`, `resolveTenant`, `provisionTenantMembership`, `revokeTenantMembership`) | **[V]** off-main G24 ref |
| Durable store, revisions, consolidation guards | `src/portfolio/durable-store.ts`, `src/portfolio/repository.ts`, `src/portfolio/consolidation.ts` | **[V]** off-main G24 ref |
| Storage contract | `src/persistence/migrations/001_initial_schema.ts` | **[V]** off-main G24 ref |
| Governance record of the IPD-side contract | `evidence/np04/NP04-GOVERNANCE-AUTHORITY-RECORD.md` (NP04-G32) | **[V]** off-main G24 ref |

**IPD `main@70b24f0` contains none of this** (`git grep` for `NP04`, `G24`, or `applicationUserId` returns **0** matches; no `src/server/`, no `src/persistence/`), and the off-main G24 lineage is **reference evidence only** — not admitted to `main`. **[V]**

### 2.2 The checks that require OIDC, an external-identity mapping, and an active membership

Verified sequence, from `src/server/authorization.ts` (module header and `authorize()`):

```text
verified OIDC identity → issuer + subject → applicationUserId
                       → tenant membership → tenantId
                       → portfolio authorization (applicationUserId + tenantId + portfolioId)
```

| Requirement | Exact current behaviour | Ref |
|---|---|---|
| Bearer on every call | `verifyAuthorizationHeader()` runs before routing on every `/api/ipd/*` route; trusted `alg` only (`RS256`/`ES256`), valid signature, `iss`/`aud` match, `exp` not past | **[V]** |
| Mapping | `(issuer, subject)` → **exactly one** opaque `applicationUserId`; lifecycle `PENDING → APPROVED → ACTIVE → RETIRED`; unmapped/conflicting fails closed; never derived from a subject, username, browser value, or `companyId` | **[V]** |
| Active membership | `resolveTenant()`: none → Missing; explicit tenant absent → Missing; not `ACTIVE` → Revoked; **more than one `ACTIVE` with no tenant supplied → Missing (never guessed)**; zero `ACTIVE` → Revoked | **[V]** |
| Caller tenant value | `x-ipd-tenant-id` is a **hint only**, validated against memberships, fail-closed on mismatch | **[V]** |
| Ownership | Never taken from the browser; re-derived from the governed mapping and the store; unauthorized ≡ missing | **[V]** |
| Provisioning | `provisionTenantMembership`/`revokeTenantMembership`: transactional upserts with **0 non-test callers, 0 HTTP endpoints, 0 authorization guards, and no audit events**; `tenantId` has no upstream authoritative source in the repository | **[V]** NP04-G32 §4.4, §5.4 |

### 2.3 Why a local principal is not an interpretation of the existing contract

The accepted trust path (`DP-1 Option 1A′`) expressly excludes, as implemented exclusions in `src/auth/config.ts`: caller-service authentication, mTLS, token exchange, **service credentials, forwarded IRR-principal trust, browser identity trust, and operator bypass**. **[V]** A locally established principal therefore requires an explicit contract clause; it cannot be reached by interpretation. Conversely, being *local* proves nothing by itself (§4.1).

### 2.4 The precise clause to be amended — and everything that stays

```text
CURRENT (G24):
  Credential position = a caller-presented, IPD-verified OIDC bearer at the TCP HTTP boundary.
  Identity  = issuer+subject → applicationUserId.   Tenant = ACTIVE membership required.

PROPOSED (L-IPC-1, ONE deployment, ONE principal):
  Credential position = "this request was accepted, with write access, on the IPD-owned
  named-pipe endpoint carrying exactly ONE provisioned principal binding."
  Identity  = the endpoint's provisioned binding; never a wire field.
  Tenant    = ACTIVE membership required — UNCHANGED, exactly one row.
```

**Amendment scope: this clause only.** The `applicationUserId` model, the external-identity mapping table and lifecycle, `resolveTenant` and the exactly-one-`ACTIVE` rule, the `(applicationUserId, tenantId, portfolioId)` authorization triple, "unauthorized ≡ missing", revision/optimistic-concurrency checks, tombstone behaviour, consolidation guards, canonical-identity validation, and DP-2 Option 2F refusal are all proposed to remain **in force and unchanged**. Two narrow additions are required (§6.3).

---

## 3. Proposed trust boundary (proportionate form)

### 3.1 Topology

```text
  ┌───────────── one personal laptop · one user · one OS account · non-production ─────────────┐
  │                                                                                            │
  │ Browser (first-party UI)  ── HTTP on loopback only; carries NO authority                   │
  │      │                                                                                     │
  │      ▼                                                                                     │
  │ IRR server process (Node)  ── same-host IPC to the IPD endpoint; supplies                  │
  │                               no principal, owner, tenant, or scope                        │
  │      │                                                                                     │
  │      ▼                                                                                     │
  │ IPD portfolio process (Node)  ── owns the endpoint, the single-principal                   │
  │                                  binding, and the durable store                            │
  │      └─► SQLite store (IPD_PORTFOLIO_DB_PATH)                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────┘
```

**C1 — One privileged surface.** Owner-scoped portfolio operations are reachable **only** through the same-host IPC endpoint. No TCP port, HTTP route, URL, or other network surface serves them. **[P]**

**C2 — Endpoint owned by IPD.** IPD creates the endpoint, only after configuration validation, store connection, and migration verification succeed — preserving the existing `validate → connect → migrate → verify → listen` discipline (**[V]** in the G24 source), with "listen" becoming "bind the endpoint". **[P]**

**C3 — One principal, no wire identity.** The endpoint carries exactly one provisioned principal binding. IPD never accepts a principal, owner, tenant, or portfolio-scope value from the wire for the purpose of establishing identity. **[P]**

**C4 — Two ordinary local processes, no service, no elevation.** The IPD process runs as the operator's own account, started by the operator, with no Windows service installation, no separate privileged account, and no administrator rights beyond what the operator normally uses. **[P]** (§11, A7 explains why a separate account is *not* proposed.)

---

## 4. Peer authentication and endpoint permissions — what is actually true on this runtime

### 4.1 Explicit rejections (nothing here is authentication)

| Not a credential | Why |
|---|---|
| `localhost` / `127.0.0.1` / any loopback address | Reachable by every local process and by browser pages. **[D]** |
| The endpoint *name* | Possession, not proof; names leak via config, logs, and process listings. |
| Caller-supplied principal / owner / tenant / scope | Refused outright (§5.2); never promoted to authority. |
| Browser `Origin`, `Host`, `Referer`, CORS, same-origin policy | Access-control conveniences, not authentication. |
| The single-user scope label (H-18) | Product scope is not a credential. **[V]** |
| The F-3 carrier pair (`owner-7f3a91c2` / `irr-domain-4b82d6e1`) | Materialisation, never authority; not an `applicationUserId`, not a membership. **[V]** IRR `frontend/server/owner-context-carrier.ts` |

### 4.2 Verified platform facts — Windows named pipes from Node (this is the deployment runtime)

These are source- and documentation-level facts, cited so the design does not rest on invention:

| # | Fact | Source |
|---|---|---|
| F1 | Node has **no AF_UNIX on Windows**: "On Windows, the local domain is implemented using a **named pipe**." | **[D]** Node v22.22.3 `doc/api/net.md` L58–59; libuv AF_UNIX-on-Windows request still open (libuv issue #2537) |
| F2 | libuv creates the listening pipe with **`lpSecurityAttributes = NULL`**: `CreateNamedPipeW(name, PIPE_ACCESS_DUPLEX \| FILE_FLAG_OVERLAPPED \| WRITE_DAC \| (first ? FILE_FLAG_FIRST_PIPE_INSTANCE : 0), PIPE_TYPE_BYTE \| PIPE_READMODE_BYTE \| PIPE_WAIT, PIPE_UNLIMITED_INSTANCES, 65536, 65536, 0, NULL)` | **[V]** libuv v1.51.0 `src/win/pipe.c`, `pipe_alloc_accept()` |
| F3 | With a `NULL` security descriptor Windows applies its **default** named-pipe DACL: "full control to the LocalSystem account, administrators, and the **creator owner**", and "**read access** to members of the **Everyone** group and the **anonymous** account" | **[D]** Microsoft, `CreateNamedPipeW` (`lpSecurityAttributes`); *Named Pipe Security and Access Rights* |
| F4 | libuv does **not** set `PIPE_REJECT_REMOTE_CLIENTS` (0x8), so **`PIPE_ACCEPT_REMOTE_CLIENTS`** applies — "connections from remote clients can be accepted and checked against the security descriptor" | **[V]** libuv source (F2); **[D]** Microsoft, `CreateNamedPipeW` (`dwPipeMode`) |
| F5 | Microsoft's documented remedy for remote/session access is to put the **logon SID** on the pipe DACL — i.e. it requires setting a security descriptor, which (F2) the in-scope runtime does not do | **[D]** Microsoft, *Named Pipe Security and Access Rights* |
| F6 | Node's **only** pipe-permission control **widens** access: `readableAll` / `writableAll` "makes the pipe readable/writable **for all users**" (`net.js` → `fchmod` → `uv_pipe_chmod`), which adds an ACE for the **Everyone** well-known SID with `SET_ACCESS` | **[D]** Node `doc/api/net.md` L554–559; **[V]** Node `lib/net.js` (fchmod path), libuv `uv_pipe_chmod` |
| F7 | The same `FILE_FLAG_FIRST_PIPE_INSTANCE` flag makes **squatting fail closed**: an existing pipe of that name makes creation fail with `ERROR_ACCESS_DENIED`, which libuv maps to `UV_EADDRINUSE` (bind error) | **[V]** libuv `src/win/pipe.c` (`uv_pipe_bind2` error mapping) |

**Consequences for the design (stated plainly).** On the actual deployment runtime, **the application cannot narrow the endpoint's OS permissions.** It cannot set a DACL at creation (F2), and the only permission knob it has widens rather than narrows (F6). Therefore `L-IPC-1` **makes no claim that IPD restricts the Windows endpoint to the operator's account**; what protects the endpoint is the *default* DACL (F3) plus host configuration (§9), and what must be *measured* is exactly which principals that DACL admits (§9 gate V-1).

### 4.3 What that means concretely — who can and cannot invoke the operation

Reading F3 against the operations: opening a client connection that can **send** a request requires write access; the default DACL grants write/full control only to LocalSystem, Administrators, and the **creating user** — the operator — and grants only *read* to Everyone/anonymous.

| Caller | Can it reach the endpoint? | Can it invoke an owner-scoped operation? | Basis |
|---|---|---|---|
| The operator's own processes (IRR, and any other process running as the operator) | Yes | **Yes — full control** | **[D]** F3 (creator owner) |
| Any other process running as the operator (including malware) | Yes | **Yes — outside the protection boundary** | **[D]** F3 |
| A different non-administrative local user | OS-level read-only at best | **No** (no write access) — **but this must be measured, not assumed** | **[D]** F3 + §9 gate V-1 |
| A different local user on another Windows session | As above; the logon-SID remedy that would exclude it is unavailable (F5) | **No** (no write access) — **to be measured** | **[D]** F3/F5 + §9 |
| A remote/LAN caller | Possible: remote clients are accepted and checked against the DACL (F4) | **No** (no write access) — **to be measured**; host must also block SMB/file-sharing inbound | **[D]** F4 + §9 |
| A browser page (any site, any origin) | **No** — no API to open a named pipe | **No** — unreachable | **[D]** platform capability |
| An administrator | Yes | **Yes — and it can read the store file directly anyway** | **[D]** F3 (Administrators) |

**Correction (2026-10-16 verification pass).** The row for a *different non-administrative local user* above is correct about **invocation** but must be read with one addition: for a **duplex** pipe a client may connect specifying `GENERIC_READ` alone (Microsoft, `CreateNamedPipeW`, `PIPE_ACCESS_DUPLEX`), so a different local account — and a remote caller authenticating as a different account, if it can reach IPC$ — can complete a **read-only connection**; it still cannot **send** a request, because that requires write access. C5 rule 1 (never emit a byte before a valid, authorized request) is therefore a **load-bearing** control, and gate V must include a **read-only connect attempt** by a different user rather than only a DACL inspection. See `IIPS-V3-G2-LOCAL-IPC-TRUST-BOUNDARY-VERIFICATION-AND-RECOMMENDATION-2026-10-16-01` §3 F-5 / §4 / §8.

**C5 — Design rules that compensate (all app-level, all testable).** **[P]**

1. **Never write data to a connection that has not yet supplied a valid request.** No greeting, banner, version string, or portfolio data before the request is parsed and authorized. This removes the value of a *read-only* open — which is the only access the default DACL grants to other users and, potentially, to remote clients (F3/F4).
2. **Authorize every request from the binding, never from the payload** (§5.2, §6.1).
3. **Bind the endpoint once, at startup, and fail closed if it cannot be bound** — including when the name is already taken (F7 squatting case). No retry loop, no fallback to TCP, no "first caller wins".
4. **Cap concurrent connections and total request size**, so a caller that can open the endpoint cannot exhaust the process. **[P]** (proportionate: the endpoint serves exactly one client)
5. **Close the endpoint on shutdown and refuse to serve requests when the binding is absent, malformed, or not `ACTIVE`.**

**C6 — Fail closed, uniformly.** A connection the OS does not admit fails at the OS level. A connection that is admitted but carries no valid request, or where the binding is not `ACTIVE`, fails closed with **no owner disclosure**: the response must not reveal whether a principal, portfolio, or owner exists. **[P]** *(existing posture: unauthorized ≡ missing — `ResourceNotFoundError` in `src/server/authorization.ts`.)*

### 4.4 Peer *process* identity is not available, and is not claimed

`L-IPC-1` does **not** claim that IPD can distinguish the authorized IRR process from another process running as the operator. Empirically, on the in-scope stack, a UNIX-socket/named-pipe server learns **no** peer identity at all (probe E1, §4.5); the Windows equivalent (client process id/SID) is likewise not exposed through the in-scope API. The contract's claim is therefore limited to: *requests arriving on this endpoint act as the single provisioned principal*, plus C5. The same-user exposure is disclosed, not mitigated, and is explicitly accepted or rejected as part of the decision (§13).

### 4.5 Executed probes (revision-2; POSIX host, Node v22.22.3, libuv 1.51.0)

These were run in this session to replace assumption with measurement. They establish the *POSIX* half of the platform matrix; they do **not** stand in for the Windows measurement (§9), which cannot be run in this environment.

| # | Probe | Result |
|---|---|---|
| E1 | What a same-host endpoint server learns about its peer | `remoteAddress` / `remoteFamily` / `remotePort` all **undefined** — **no peer identity is available** |
| E2 | Cross-user connect matrix (dir mode / socket mode) | `0700 / 0600` → other user `EACCES`; `0700 / 0666` → `EACCES` (directory decides); `0777 / 0600` → `EACCES` (socket mode decides); `0777 / 0666` → **other user connected** |
| E3 | Default endpoint mode created by Node | socket created **`0755`** under umask `022` — i.e. *not* private by default; the app must set and verify it |
| E4 | Abnormal termination (SIGKILL) | endpoint file **persists**; connect → `ECONNREFUSED`; re-bind → `EADDRINUSE`; unlink then re-bind → succeeds |

**Design consequence:** on POSIX the application **can** enforce the boundary (E2 — either the directory mode or the socket mode alone suffices) and must set it explicitly (E3) and clean up stale endpoints (E4). On Windows it **cannot** (F2/F6), so the boundary rests on the platform default and host configuration (§9). This is a genuine platform difference and is stated as such rather than smoothed over.

### 4.6 Platform matrix (material differences)

| Concern | Windows — the deployment | POSIX — dev/CI |
|---|---|---|
| Mechanism | Named pipe (F1) | UNIX domain socket |
| Who sets permissions | Windows, from the default DACL (F2/F3) | The application (directory + socket mode) |
| Other local users | No write access by default — **measure** | Excluded by application-set modes (E2) |
| Remote callers | Accepted and DACL-checked (F4); additionally block inbound SMB on the host | Not applicable (AF_UNIX is host-local) |
| Same-user processes | **Full control** (F3) — disclosed, not mitigated | Same (same uid) — disclosed |
| Stale endpoint | Pipe object disappears with its last handle | File persists; app must unlink (E4) |
| Peer identity | Not available | Not available (E1) |

---

## 5. Browser/server trust separation

### 5.1 Who establishes the principal

**IPD establishes it — as the endpoint's provisioned binding (C3).** IRR's role is to be the only component that opens the endpoint and to relay portfolio operations; IRR never mints, asserts, or forwards a principal, and no user or delegated credential is involved.

### 5.2 What IPD refuses, always

**C7 — Refusal of caller-supplied authority.** IPD must **refuse** (not ignore) any request carrying: an application principal, user id, subject, or credential material; a portfolio owner claim; a tenant identity or membership claim; or a caller-selected portfolio scope. The IRR side already enumerates and refuses exactly these classes (`G2_TENANT_CLAIM_KEYS`, `G2_IDENTITY_CLAIM_KEYS` — including `companyId`, `runtimeCompanyId`, `identityStatus`, `resolutionDisposition` — and `G2_DURABLE_IDENTITY_KEYS`) via `assertNoG2CallerAuthority` / `classifyG2Claims` in `frontend/server/user-portfolio/translationBoundary.ts` **[V]**; `L-IPC-1` requires **IPD to re-enforce the same refusal at its own boundary**, so the guarantee does not depend on IRR's cooperation.

### 5.3 Can a browser or remote client invoke the privileged operation?

| Path | Answer | Basis |
|---|---|---|
| Browser → IPC endpoint | **No** | Browsers cannot open named pipes/sockets **[D]** |
| Remote client → IPC endpoint | **Not for invocation** (no write access by default) — **to be measured**; disclosure and host hardening in §8/§9 | F4, §9 V-2 |
| Browser → IRR `/api/user-portfolios*` | **Yes, and refused: HTTP 503 `owner-context-unavailable`** before any domain or persistence access | **[V]** IRR `frontend/server/user-portfolio-transport.ts`, `owner-context-unavailable.ts` |
| Browser → IRR after any future admission | It would act **as the operator's principal** (it cannot impersonate a *different* user, since no user identity is supplied) | **[P]** → hence C8/C9 |

**Correction (2026-10-16 verification pass).** The *remote client* row above is correct for **invocation**, but note the same read-only case as §4.3: a remote caller authenticating as a **different** account can complete a read-only connection if it can reach IPC$ (no bytes may be emitted — C5 rule 1), while a remote caller authenticating as the **operator's own account** would be the CREATOR OWNER and could send. Remote reachability therefore rests on host configuration and is measured by gate V-2. See `IIPS-V3-G2-LOCAL-IPC-TRUST-BOUNDARY-VERIFICATION-AND-RECOMMENDATION-2026-10-16-01` §3 F-4/F-5 / §7 / §8.

**C8 — Loopback-only deployment posture.** The browser-facing surface that can reach owner-scoped operations must be bound to loopback on this laptop. LAN, hosted-preview (e.g. `*.e2b.app`), reverse-proxied, and shared-host deployments are **outside** the trust assumption and must not serve the capability. Wildcard CORS must not apply to owner-scoped routes. **[P]** — current IRR code listens without a host argument (all interfaces) and sets `Access-Control-Allow-Origin: *` **[V]** `frontend/server/executive-transport.ts`; its dev server uses `host: '0.0.0.0'` and `allowedHosts: ['.e2b.app']` **[V]** `frontend/vite.config.ts`.

**C9 — Cross-site request hardening (not authentication).** Because a cross-site request that reaches IRR would act as the operator's principal, owner-scoped state changes must require a first-party signal (a non-simple header/JSON content type forcing a preflight, plus an `Origin`/`Sec-Fetch-Site` consistency check). This is CSRF hardening only and must **never** be recorded as authentication. **[P]**

---

## 6. Principal, owner, tenant, and portfolio binding

### 6.1 Principal and owner

**C10 — Binding is provisioned, opaque, and one-to-one.** **[P]** IPD allocates **one** opaque `applicationUserId` (existing random-UUID semantics — never derived from any identifier **[V]**) by a **single, one-time, local, offline operator act** (§14, gate A). The binding associates: endpoint/deployment identity → `applicationUserId` → tenant → lifecycle state (`ACTIVE`/`REVOKED`) → creation/revocation timestamps. **No equivalence is created or implied** between this binding and the F-3 `ownerUserId`/`tenantId` pair, an IRR principal, an OIDC subject, a browser value, `companyId`/`runtimeCompanyId`, or any other domain's identity **[V]** (D-2 §8; NP08-D115: `companyId` is not an owner identity).

### 6.2 Tenant — the minimum the current contract requires, and nothing more

The current IPD contract requires a `tenantId` and an `ACTIVE` membership (`tenant_memberships.tenant_id`, `user_portfolios.tenant_id NOT NULL`, `resolveTenant()`) **[V]**. The proportionate treatment is therefore **exactly one row, and no tenant platform**:

| Option | Content | Assessment |
|---|---|---|
| **T1 — One local membership row (recommended)** | The same one-time act creates one `application_user` and **exactly one** `ACTIVE` `tenant_memberships` row with an opaque, act-chosen personal value; `resolveTenant()` and its exactly-one-`ACTIVE` fail-closed rule stay unchanged; `user_portfolios.tenant_id` keeps its one-tenant-per-portfolio constraint | **+** No change to the tenant contract, schema, or isolation invariant; no tenant directory, no roles, no admin endpoints, no self-service, no cross-system audit. **−** Requires the provisioning authority act and a local audit line for the mutation (currently absent — §2.2). |
| **T2 — Make the tenant optional on this path** | Contract/schema change allowing a null tenant | **Rejected** — it weakens a governed isolation dimension to save one row; strictly worse than T1. |
| **T3 — Defer** | Decide nothing; capability stays unavailable | **Valid fallback** (Option D). |

**Explicitly not introduced:** tenant administration endpoints, tenant lifecycle/restoration semantics, multi-tenant semantics, role-based access control, or any assertion that `tenant_memberships` is an enterprise tenant source of truth (NP04-G32 §5/§9 preserved). **[V]**

### 6.3 The two narrow additions required (and the one amendment)

| # | Change | Size |
|---|---|---|
| A-1 | **One clause amended** (§2.4): credential position becomes "accepted on the IPD-owned, single-principal local IPC endpoint" for this one deployment | One clause, one deployment |
| A-2 | **One additive binding record** + migration, e.g. `local_principal_bindings(endpoint_id, application_user_id → application_users, tenant_id, state ∈ {ACTIVE, REVOKED}, created_at, updated_at, revoked_at)` — deliberately **not** reusing `external_identity_mappings`, to avoid conflating a transport fact with an external identity claim | One table |
| A-3 | **Local audit line** on binding and membership lifecycle mutations (both currently unaudited) — local only; no cross-system audit destination is created or implied | One narrow addition |

No other schema, contract, or identity change is required.

### 6.4 Compatibility with the existing G24 pieces (reuse, not reimplementation)

| Component | Under `L-IPC-1` |
|---|---|
| `PortfolioRepository`, `DurablePortfolioStore` (owner/tenant scoping, revisions, tombstones) | **Reused unchanged** — exactly the semantics this contract needs |
| `resolveTenant()` + exactly-one-`ACTIVE` rule | **Reused unchanged** (T1). Caller tenant *hint* is unnecessary on this path: the binding's membership is the sole tenant source for the endpoint |
| `consolidation.ts` (MERGE/REPLACE, idempotency, weight guard) | **Reused**, with the canonical-identity override in C12 |
| `IdentityService` mapping lifecycle + `mapping_audit_events` transaction pattern | **Pattern reused** for A-2/A-3 |
| `OidcVerifier`, `src/auth/config.ts` | **Not on this path**; unchanged for any other surface |
| `src/server/http-server.ts` `validateHolding()` defaults | **Not carried over** — §7.3 |
| `src/persistence/*` (bootstrap, migrations, ledger) | **Reused unchanged** (C2) |

**C11 — No parallel store.** The G24 durable store remains the only portfolio store. **[P]** (G-2 architectural decision: extend, do not replace or duplicate **[V]**.)

---

## 7. Canonical company identity and DP-2 Option 2F

Company identity stays **entirely separate** from authentication and ownership **[V]** (D-2 §8; DP-2).

### 7.1 Existing IPD capability that can provide the resolution

| Capability | Path | Verified properties |
|---|---|---|
| Security Master (D05) — **sole identity authority** | `src/identity/security_master.ts`; contract `src/contracts/d05_security_master.ts`; pinned fixture `evidence/operator_drop/d05_security_master_broad_universe.json` (SHA-256 `7f53540b…4b74b5`, pinned in `docs/FULL_IIPS_BI08_CONVERGENCE_FILE_MATRIX.md`) | `companyId` is the authoritative internal id; entity registration indexes ISIN, CIN, NSE/BSE symbols and scrip codes, composite tickers |
| Point-in-time resolution | `src/identity/mapping_store.ts` (`IdentityMappingStore.resolveCompanyId`) | Effective-dated; **fails closed** with `IdentityAmbiguityError` on zero matches (`UNMAPPED_IDENTIFIER`) or conflicting matches (`AMBIGUOUS_COLLISION`) |
| Quarantine reason codes | `src/identity/quarantine.ts` | `UNMAPPED_IDENTIFIER`, `AMBIGUOUS_COLLISION`, `EXPIRED_EFFECTIVE_DATE`, `MISSING_EXCHANGE` |
| Governed fixture master | `src/identity/governed_fixture_master.ts`, `src/identity/d05_broad_universe_data.ts` | Fixture-backed, offline |

All **[V]** on IPD `main@70b24f0`. The competing resolver `frontend/server/portfolio/portfolio-resolver.ts` (FIGI/`canonicalSecurityId`) is already recorded **DEFER — conflicts with `SecurityMaster`** in the convergence matrix; `SecurityMaster` is the sole identity authority, and the deferred resolver must not be resurrected. **[V]**

### 7.2 Required contract for a successful holding write

**C12 — Canonical identity contract.** **[P]**

1. A holding persists only with a canonical `companyId` obtained from an **authorized, provenance-supported resolution performed or verified IPD-side** (capability above, or another source separately designated by authority).
2. **Ticker-shaped and caller-supplied identity values are never canonical identity** — not IRR's `companyId` field, not symbol/ISIN/exchange, not any client value.
3. **Exactly one** resolution is admissible; zero (`UNMAPPED_IDENTIFIER`) or conflicting (`AMBIGUOUS_COLLISION`) ⇒ **refused**.
4. **DP-2 Option 2F remains in force, unchanged and unrelaxed**: unresolved or ambiguous holdings are refused **before** serialization, port call, or persistence; neither `NON_PRODUCTION_OPERATOR_BYPASS` nor a false canonical-provenance declaration is emitted.
5. **No bypass may be introduced to enable saving.** The existing non-production single-operator bypass governs an offline UI-qualification path (`evidence/operator_drop/NON_PRODUCTION_SINGLE_OPERATOR_IDENTITY_BYPASS.md`, `GOV-REC-2026-NON-PROD-OPERATOR-BYPASS-01`); it is **not** extended, ported, or admitted to this path.
6. Refused writes create no revision, no holding row, and no success response.

### 7.3 Verified gap the future implementation must close

The off-main G24 write path currently **accepts caller-supplied identity claims**: `validateHolding()` in `src/server/http-server.ts` **defaults** `companyId` to `''`, `identityStatus` to `'RESOLVED'`, and `resolutionDisposition` to `'CANONICAL_P04'`; `consolidation.ts` Save Guard 2 treats a holding as resolved when `identityStatus !== 'UNRESOLVED' && !!companyId` and accepts the `NON_PRODUCTION_OPERATOR_BYPASS` branch. **[V]** Therefore the implementation must (a) refuse those fields on the IPC boundary and (b) perform IPD-side canonical resolution or refusal before persistence. **Reusing the off-main guard as-is would violate C12.**

---

## 8. Threat model, fail-closed behaviour, and required disclosures

### 8.1 Trust assumptions

1. The operator's OS account and the host OS are trusted.
2. The browser is **never** trusted for authority; the first-party UI only renders and relays.
3. IRR and IPD are the operator's own code at authorized refs, running as the operator.
4. One human operator, one laptop, one account, non-production.

### 8.2 Threats and enforcement points

| # | Threat | Enforcement | Required outcome |
|---|---|---|---|
| T-1 | Unintended access by another **local user** | Windows default DACL (F3) + §9 V-1 measurement | No write access; the app additionally never emits data before a valid request (C5.1); **measured**, not assumed |
| T-2 | **Remote/LAN caller** | DACL check (F4) + host SMB/file-sharing blocked + §9 V-2 | Not able to invoke operations; exposure disclosed if measurement disagrees |
| T-3 | Untrusted **browser** request | No browser-reachable path to the endpoint; C8 loopback posture; C9 CSRF hardening | Cannot reach IPD; cross-site request to IRR rejected |
| T-4 | Forged **owner/tenant/scope/principal** claim | C7 refusal + §5.2 IPD-side authority | Refused; no owner disclosed; no partial effect |
| T-5 | **Endpoint squatting** / name taken | `FILE_FLAG_FIRST_PIPE_INSTANCE` → bind fails (F7) | Startup fails closed; no fallback |
| T-6 | **Stale endpoint** / abnormal exit | C5.5, E4 | Connection refused / binding absent ⇒ refused; no data served |
| T-7 | **Ambiguous or unresolved** holding | C12 / DP-2 2F | Refused before persistence; quarantine evidence |
| T-8 | **Concurrent write** / lost update | Existing `expectedRevision` + immediate-transaction semantics **[V]** | Revision conflict reported; no silent overwrite |
| T-9 | Cross-owner/tenant probe | Existing authorization triple + "unauthorized ≡ missing" **[V]** | Indistinguishable refusal |
| T-10 | Request flooding by a caller that can open the endpoint | C5.4 caps | Bounded; no availability claim is made |
| T-11 | Missing/partial configuration at startup (no binding, no store, unverified migrations) | C2, C5.3 | Capability unavailable; endpoint not created |
| T-12 | Binding revoked while IRR keeps calling | C10 lifecycle | Refused for new connections; audited (A-3) |

### 8.3 What this boundary does **not** protect against — required disclosure

- **Another process running as the operator's own account — including malware.** By the platform default, the creating user receives **full control** of the endpoint (F3), and peer process identity is not available to the server (E1). Such a process can connect and invoke operations. **This is outside the protection boundary and is not mitigated by this design.**
- **Administrators and LocalSystem**, which the default DACL also grants full control (F3); an administrator can read the store file directly in any case.
- A **fully compromised OS** or host.
- **Confidentiality beyond the OS account**: the proposal claims protection for portfolio data **only** to the level of the OS-account protection applied to the store file itself.
- **Availability/denial of service** and **cross-system security audit** (still deferred per NP04-G32 §5.4).
- **User attribution/non-repudiation** beyond "the single provisioned principal performed this operation".
- Anything on a **LAN, hosted preview, shared host, or remote browser** — outside the trust assumption by C8.

### 8.4 Residual-risk acceptance

T-1/T-2 residuals are inherent to a personal-laptop, single-account deployment and must be **explicitly accepted** (or rejected) as part of the §13 decision. They must never be recorded in the contract, evidence, or UI as "protected".

---

## 9. Mandatory Windows verification (gate V) — not yet executed

**Sequencing clarification (2026-10-16 verification pass).** V-1's procedure begins *"Start the IPD process"*, but no IPD process binds an endpoint today and creating one is not yet authorized (gates B/C). Gate V therefore has **two phases, both mandatory**:

- **V-P — platform/host phase.** F-3/F-4/F-5/F-7/F-8 are properties of Windows + libuv + the owning account, not of the application. They are measured on a **disposable probe** created through the *identical* libuv path (`src/win/pipe.c` has exactly one `CreateNamedPipeW` call site, L546, with `lpSecurityAttributes = NULL`), in the same account, on the same host — no application code, no production name, no new authority. V-5 closes here; a V-P failure on V-1/V-2/V-3 is decisive **against** this design, because those are runtime facts.
- **V-E — endpoint phase.** V-1/V-3/V-4 are **re-run against the production endpoint** after gate B, together with the application-level controls C5.1/C5.3/C6 at gate C (Q9/Q2/Q4).

A V-P result is a legitimate input to gate V but **closes nothing by itself**; only V-E closes V-1/V-3/V-4 for the realized design, and neither phase substitutes for the other. Procedure: `IIPS-V3-G2-GATE-V-WINDOWS-TEST-PROCEDURE-AND-SEQUENCING-2026-10-16-01` §1.3. **This clarification changes no clause C1–C12 and no gate.**

**PA waiver note (2026-10-16).** The Program Authority has decided that **V-2 (remote-machine access test)** and **V-3 (second-account access test)** are **NOT REQUIRED — PA-WAIVED**: only **one** Windows user account exists on the laptop and **no separate remote machine** is available. Those two rows are therefore **not pending and not failed**, and must never be recorded as PASS/FAIL/BLOCKED. The waivers do **not** demonstrate remote or cross-account isolation, and they change **no** clause and **no** other gate. **V-1 and V-4 remain outstanding** local criteria (they need neither waived resource), together with the whole V-E phase. Evidence: `IIPS-V3-G2-GATE-V-EVIDENCE-RECONCILIATION-AND-PA-WAIVER-2026-10-16-01`.

**Superseding waiver note (2026-10-16, later the same day).** The Program Authority has now also
waived **V-1 (ACL/SDDL capture)** and **V-4 (pipe collision and re-bind testing)** as **NOT REQUIRED
— PA-WAIVED** (the V-1 capture attempts on the disposable probe failed — `GetNamedSecurityInfo`
error 87 and `Get-Acl` error 231 — and neither error was diagnosed; with the waiver no further
attempt is made). **All four Gate V measurements are therefore waived**: V-1, V-2, V-3 and V-4. The
**V-P platform phase is dispositioned CLOSED** — closed by waiver where unmeasured, satisfied by
evidence where measurable (V-5) — and **V-1/V-4 must no longer be read as pending**. This is **not**
a demonstration of ACL structure, cross-account isolation, remote isolation or lifecycle fail-closed
behaviour: those remain **technically unverified**, F-1…F-9 remain source-verified platform facts
rather than host measurements, and this changes **no** clause and **no** other gate. The V-E phase
remains as described above and in the reconciliation record §9.5. Evidence:
`IIPS-V3-G2-GATE-V-EVIDENCE-RECONCILIATION-AND-PA-WAIVER-2026-10-16-01` §9.

The deployment runtime's endpoint permissions **have not been measured on the operator's laptop** in this work, and this proposal therefore does **not** claim the design works on Windows. The following must be executed and published **before** any implementation-authority act is exercised, and before any claim of operability:

| Gate | Procedure (run on the operator's laptop, ordinary user, no elevation) | Pass criterion |
|---|---|---|
| **V-1** | Start the IPD process; then inspect the endpoint's effective permissions: `accesschk.exe -accepteula -l -v \pipe\<endpoint-name>` (Sysinternals; `\pipe\` prefix selects named-pipe paths) and, as a cross-check, `Get-Acl \\.\pipe\<endpoint-name>`. Capture raw output. | Output shows `FILE_WRITE_DATA`/write access **only** for the operator account, Administrators, SYSTEM, and CREATOR OWNER; no other identity receives write access. Read-only ACEs for Everyone/anonymous are expected (F3) and **must be recorded, not hidden**. |
| **V-2** | From a second machine, attempt remote enumeration/connection: `[System.IO.Directory]::GetFiles('\\<laptop>\pipe\')` and a connect attempt to the endpoint name; record the laptop's File-and-Printer-Sharing/SMB inbound state. | The endpoint is not remotely connectable with write access; if it is reachable read-only, that is recorded, and C5.1 (no data before a valid request) is demonstrated as the compensating control. |
| **V-3** | As a second, non-administrative local user (or second session), attempt to connect and to send a request. | Connection denied, or accepted read-only with no operation possible and no data emitted. |
| **V-4** | Confirm the endpoint disappears on clean shutdown and that a stale/colliding endpoint at startup yields a **failed start**, not a silent fallback. | Fail-closed behaviour observed; raw output captured. |
| **V-5** | Record the exact versions: Windows build, Node version, libuv version, and the endpoint name format actually used. | Recorded; any deviation from F1–F7 assumptions triggers a re-read of the design. |

**Failure disposition.** If V-1 shows write access for any identity other than the operator, Administrators, SYSTEM, or CREATOR OWNER, or if V-2 shows remote invocation capability, then **this design does not satisfy `L-IPC-1` on Windows as written**. The correct disposition is then: (a) a host-configuration mitigation that can be evidenced (e.g. disabling inbound file-and-printer sharing, single-account host), or (b) rejection of the Windows-Node variant — **not** a compensating workaround invented at implementation time, and **not** a native addon added without a separate decision (§11, A8).

**Failure-disposition scope (dated note, 2026-10-16 — acceptance act).** The failure disposition
above may fire **only** on **V-E (production-endpoint) evidence**. Because **V-1 and V-2 are `NOT
REQUIRED — PA-WAIVED`**, it **cannot** be used to reopen the four waived V-P measurements (V-1
ACL/SDDL capture, V-4 collision/re-bind, second-account, remote-machine), and the V-P phase is
**CLOSED** (V-5 satisfied by evidence). Where a V-E item would repeat a waived measurement, **the
waiver governs** unless the Program Authority records narrower scoping for the production endpoint.
See `IIPS-V3-G2-IPD-SECURITY-CONTRACT-ACCEPTANCE-DECISION-2026-10-16-01` §4.4 and §6, and
`IIPS-V3-G2-GATE-V-EVIDENCE-RECONCILIATION-AND-PA-WAIVER-2026-10-16-01` §9.

**Host preconditions (part of the contract's assumptions, not new infrastructure).** One interactive user in scope; inbound SMB/file-and-printer sharing off; the laptop's browser surface loopback-bound (C8). These are local settings on the operator's own machine, verifiable by the operator, with no service, domain, or enterprise component.

---

## 10. Verification and qualification scope (proportionate)

Once implementation is separately authorized, the following evidence is sufficient for this single-user, non-production scope. It is intentionally smaller than an enterprise qualification programme, and every item is measurable on the one laptop.

| ID | Evidence |
|---|---|
| Q1 | Gate V (§9) passed and published, on the deployment host |
| Q2 | Startup fail-closed: missing/invalid binding, missing store, unverified migrations ⇒ no endpoint, no fallback |
| Q3 | Claim-refusal matrix: principal/owner/tenant/scope/`companyId`/`identityStatus`/`resolutionDisposition` claims each refused; no owner disclosed; no write |
| Q4 | Owner/tenant isolation: the provisioned principal succeeds; any other/absent binding fails indistinguishably from "not found" |
| Q5 | Canonical identity: one match proceeds only under the separately authorized write policy; zero/conflicting matches refused **before** serialization/port/store, with quarantine evidence |
| Q6 | DP-2 2F: unresolved/ambiguous writes refused; no bypass emitted; no partial revision |
| Q7 | Revision/lifecycle: stale `expectedRevision` rejected; duplicate-content no-op; tombstoned portfolio not disclosed |
| Q8 | Durability: write → stop both processes → restart → read back; revoked binding fails closed after restart |
| Q9 | C5.1 negative test: a read-only connection receives **no** bytes (no banner, no data) |
| Q10 | No parallel store: inventory confirms exactly one portfolio store |
| Q11 | Drift check: the qualified surfaces are byte-identical to what was tested (digests recorded) |

A green preview, a unit-test pass, or a store-level test does **not** qualify the boundary.

---

## 11. Alternatives considered

| Alt | Description | Verdict |
|---|---|---|
| A1 | Loopback TCP + `Origin`/`Host` checks | **Rejected** — loopback is reachable by every local process and by browser pages; those headers are not authentication |
| A2 | Static shared secret in a file/header/env | **Rejected** — a same-account process can read it, so it adds no boundary and creates credential-handling obligations |
| A3 | OIDC / Keycloak / issuer / token exchange | **Rejected as an assumed solution** — out of scope for a personal laptop (H-18) and excluded by the recorded Gate C P-2 scope |
| A4 | In-process library import of the IPD package (IRR already imports IPD in-process for other domains **[V]**) | **Rejected for this capability** — no OS-enforced separation; any code reachable from the HTTP surface would hold direct store access |
| A5 | Reuse the F-3 owner-context carrier as the principal | **Rejected** — materialisation, not authority; not an `applicationUserId`; equivalence forbidden by D-2 §8 |
| A6 | Forwarded/asserted principal header from IRR | **Rejected** — caller-supplied identity is not authentication; expressly excluded by the current trust contract |
| A7 | Run the IPD process under a **separate low-privilege Windows account** (previously floated as a hardening option) | **Not proposed.** On this runtime it does not work without a DACL the application cannot set (F2/F6): the default DACL gives read-only to Everyone, so the operator's own IRR process could not obtain write access to a pipe owned by another account — and widening it via `writableAll` would grant **all users** write (F6), which is worse than the default. Concrete necessity is therefore not demonstrated; this stays closed unless §9 V-1 fails in a way that host configuration cannot fix |
| A8 | **Native addon** to set the pipe DACL (`SetSecurityInfo`; the libuv handle is even created with `WRITE_DAC` **[V]**) or a logon-SID DACL per Microsoft's remedy (F5) | **Deferred, not proposed.** It would be the technically correct way to exclude other users/sessions and remote callers, but it adds native compilation, per-Node-version build artefacts, and a new supply-chain surface for a single-user personal application — disproportionate unless §9 shows the default DACL is insufficient. If it ever becomes necessary, it needs its own decision and its own qualification |
| A9 | AF_UNIX on Windows (filesystem-ACL'd socket) | **Unavailable** — Node on Windows uses named pipes for the local domain (F1) |
| A10 | File-drop rendezvous in an ACL-protected directory | **Rejected** — NTFS ACLs on a user-profile directory grant the *same* principals as the pipe's default DACL, at the cost of a hand-rolled protocol (torn writes, stale files, polling). Not a security gain |

---

## 12. Non-goals

This proposal and any acceptance of `L-IPC-1` do **not**: authorize implementation, provisioning, credentials, database writes, or successful saves; approve, qualify, admit, or enable any route/UI/capability; modify IRR's 503 fence, DP-2, DP-1 Option 1A′, or any authority record; promote, merge, cherry-pick, or re-pin the off-main G24 lineage; introduce OIDC, Keycloak, RBAC, multi-user or enterprise tenant infrastructure, PostgreSQL, enterprise deployment architecture, a second portfolio store, a Windows service, a separate service account, or a native addon; designate a company-identity authority, canonical-identifier policy, or successful-write policy; extend or admit the non-production operator bypass; create or infer any owner, tenant, principal, or company identifier; create tenant administration, tenant lifecycle, or cross-system audit capability; or assert production, deployment, or runtime readiness of anything.

---

## 13. Exact IPD authority and requested decision

**Accepting capacity:** **Ramki — Program Authority, acting as the IPD security-contract authority for `ramkivs/iips-production-market-data`**, recorded durably in IPD (a new IPD-side decision record naming this proposal and its ref). IPD owns the portfolio domain and enforces the changed boundary; an IRR-only note does not amend the IPD contract.

**Requested decision (verbatim-quotable):**

> I, Ramki, as Program Authority and IPD security-contract authority, decide on `IIPS-V3-G2-IPD-LOCAL-PRINCIPAL-OS-IPC-SECURITY-CONTRACT-PROPOSAL-2026-10-16-01` (revision 2), clauses C1–C12, for **one user, one personal laptop, non-production**: accept / accept with these clause changes / reject / defer.
> If accepted, I amend **only** the G24 identity-acquisition clause for this one deployment — the credential position becomes "accepted on the IPD-owned, single-principal, same-host IPC endpoint" — with the `applicationUserId` model, external-identity mapping, tenant membership (exactly one `ACTIVE` row), the authorization triple, revision checks, canonical-identity validation, and DP-2 Option 2F **unchanged**; I accept the two narrow additions A-2 (binding record) and A-3 (local audit line).
> I record that the application does **not** enforce the endpoint's OS permissions on Windows, that another process running as the operator's own account (including malware) is **outside** the protection boundary, and that gate V (§9) must be executed and published before any operability claim. I grant **no** provisioning, implementation, qualification, successful-write, route, or admission authority by this act.

**DECIDED (2026-10-16) — `ACCEPT WITH CHANGES`.** The Program Authority accepted this proposal
(revision 2, clauses C1–C12) for one user / one personal laptop / non-production, subject to five
recorded change groups, in the durable IPD-side decision record
`IIPS-V3-G2-IPD-SECURITY-CONTRACT-ACCEPTANCE-DECISION-2026-10-16-01`. The requested decision above
is therefore **rendered, not pending**. Acceptance: (a) amends only the G24 identity-acquisition
clause — credential position = "Accepted on the IPD-owned, single-principal, same-host IPC
endpoint", identity from the provisioned binding, never a wire field; (b) accepts **A-2** and
**A-3**; (c) preserves the `applicationUserId` model, external-identity mapping,
exactly-one-`ACTIVE` membership, the authorization triple, revision checks, canonical-identity
validation and **DP-2 Option 2F** unchanged; (d) records that the application does **not** enforce
the endpoint's OS permissions on Windows and that a process running as the operator's own account
(including malware) is **outside** the protection boundary; (e) preserves **C5.1/Q9** as a
**mandatory** qualification requirement and claims **no** security of a future production endpoint
from the disposable probe; and (f) grants **no** provisioning, implementation, qualification,
successful-write, route or admission authority, and does **not** merge PR #8. A **V-P** result still
closes nothing about the production endpoint; the §10/Q-list items that depend on the realized
endpoint remain **V-E** requirements.

**Interdependent IRR-side act (separately required, not inferred):** an explicit IRR-side amendment to the DP-1 Option 1A′ identity/credential trust clauses, preserving DP-2 Option 2F, H-18 scope, and the 503 fence. The same human may act in both capacities; each act must state its capacity and its repository/ref.

---

## 14. Next gates (none opened by this proposal)

| Gate | Content | Authority |
|---|---|---|
**Dated note (2026-10-16 — acceptance act).** Acceptance of the contract opened **none** of these
gates: every row below remains a **separate act** and **none is granted**. Gate A (provisioning)
remains **NOT AUTHORIZED**; gate B must still name an IPD-`main` implementation basis, and the
off-main G24 lineage remains **not** a base. See
`IIPS-V3-G2-IPD-SECURITY-CONTRACT-ACCEPTANCE-DECISION-2026-10-16-01` §7/§8.

| **A — Local provisioning** (one-time, offline, operator-run) | Create one `application_user`, one opaque personal tenant, exactly one `ACTIVE` membership, and the principal binding; define revocation; add the A-3 audit line. Runs on the laptop, against the local store; no network, no admin, no enterprise component | Separate explicit IPD provisioning act (tenant provisioning is currently **NOT AUTHORIZED**, NP04-G32 §5) |
| **B — Implementation authority** (local, single-user) | Name the exact IPD and IRR files/tests, the mechanism, the C5 rules, and the exclusions; state whether an IPD-`main` implementation basis exists or must be created | Separate IPD and IRR implementation-authority acts (the off-main lineage is **not** a base) |
| **C — Qualification** | Execute §10 on the laptop; publish raw evidence including gate V | Separate qualification authority |
| **D — Route/consumer admission** | Per-operation admission; IRR's 503 fence stays in force until then | Separate admission act |
| **E — Write policy / canonical identity** | Designate the resolution source for the write path and the successful-write policy | Separate act; `L-IPC-1` presumes **no** successful writes |

---

## 15. Unresolved items

| ID | Item |
|---|---|
| **U-1** | Gate V results on the actual laptop (endpoint DACL, remote reachability, second-user test, version inventory) — the single most important open item. **(Superseded 2026-10-16 — see the dated note below this table.)** || **U-1** | Gate V results on the actual laptop (endpoint DACL, remote reachability, second-user test, version inventory) — the single most important open item |
| **U-2** | Whether the operator's host configuration (single account, inbound sharing off) is confirmed and recorded |
| **U-3** | Whether peer process identity is obtainable in the in-scope toolchain (currently: no — E1; Windows equivalent not exposed) |
| **U-4** | The tenant value rule for the one personal row (opaque, act-chosen; no value is invented here) |
| **U-5** | Whether the operator accepts the same-user (T-1) residual explicitly, as required by §8.4 |
| **U-6** | Whether A-2's binding record shape is accepted as proposed |

**Dated note on §15 (2026-10-16 — acceptance act).** **U-1 is reconciled and no longer reads as a
blanket open item.** The **V-P** platform phase is **CLOSED** (V-5 satisfied by evidence; **V-1
ACL/SDDL capture**, **V-4 collision/re-bind**, **second-account** and **remote-machine** all `NOT
REQUIRED — PA-WAIVED`). The waived properties — effective ACL/SDDL, cross-account isolation, remote
isolation and lifecycle fail-closed behaviour — remain **technically unverified**. The parts of U-1
that concern the **realized endpoint** are **V-E** requirements, kept distinct from the V-P waivers
and listed in `IIPS-V3-G2-IPD-SECURITY-CONTRACT-ACCEPTANCE-DECISION-2026-10-16-01` §6. **U-5**
(same-user residual) and **U-6** (A-2 shape) are resolved by the acceptance act; **U-2** (host
configuration) and **U-4** (tenant value rule) remain as gate A/C details, not acceptance blockers.

---

## 16. Closing statement

This record is a **proposal**. It is **not approved, not effective, not implemented, not qualified, and not admitted**, and it does not claim that the design works on Windows — gate V (§9) has not been executed. It changes no IPD security contract, implementation, test, schema, dependency, or runtime configuration; it creates no owner, tenant, principal, or company identity; it does not touch IRR's 503 fence, DP-2, or any authority record; and it does not promote, merge, cherry-pick, or re-pin the off-main G24 lineage. **No implementation may begin because this proposal exists, is published, or is reviewed.** The next authorized action is the single explicit IPD-side security-authority decision requested in §13, followed by gate A (local provisioning) and gate V.

*End of proposal `IIPS-V3-G2-IPD-LOCAL-PRINCIPAL-OS-IPC-SECURITY-CONTRACT-PROPOSAL-2026-10-16-01`, revision 2.*
