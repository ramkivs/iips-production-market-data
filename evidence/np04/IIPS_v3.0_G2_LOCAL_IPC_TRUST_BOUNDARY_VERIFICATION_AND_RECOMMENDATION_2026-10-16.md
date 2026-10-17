# IIPS v3.0 — G-2 — LOCAL IPC TRUST BOUNDARY — VERIFICATION AND DECISION-READY RECOMMENDATION

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-G2-LOCAL-IPC-TRUST-BOUNDARY-VERIFICATION-AND-RECOMMENDATION-2026-10-16-01` |
| **Record type** | **Assessment / design-proposal only.** Verification of the platform facts the local-principal design rests on, evaluation of the alternatives, and one concrete recommendation. It renders **no** authority, accepts **no** contract, approves **no** implementation, provisioning, write, route or admission, and states them as outstanding. |
| **Relates to** | `IIPS-V3-G2-IPD-LOCAL-PRINCIPAL-OS-IPC-SECURITY-CONTRACT-PROPOSAL-2026-10-16-01` (rev 2, §13 decision text) — this assessment **supports its recommendation and corrects one reachability statement** (§4.3/§5.3, correction recorded in the proposal itself). |
| **Repository / ref** | `ramkivs/iips-production-market-data` — branch `arena/21c63aef-iips-production-market-data`, in **PR #8** (existing workstream; no competing PR) |
| **Verified live state at this record** | PR #8 `OPEN`, head `aeb8c0e1ca715df3b8b1df1db0980c745a9833a1` (local == remote), base `main@70b24f0`, 8 files, +2046/−62, `MERGEABLE`/`CLEAN`, 0 comments, 0 reviews, no checks (docs-only PR) — **not merged** |
| **Verified runtime for the platform facts** | Node **v22.22.3**, libuv **1.51.0** (measured in the recording environment); deployment runtime is Windows on the operator's laptop |
| **Status** | **DESIGN / PROPOSAL ONLY — RECOMMENDATION A (retain local IPC) WITH EXACT CONTROLS AND MANDATORY WINDOWS PROOF. NO ACCEPTANCE, NO IMPLEMENTATION, NO PROVISIONING, NO WRITE, NO ROUTE. GATE V STILL NOT EXECUTED.** |

---

## 1. Question answered

*What is the least-complex, technically defensible way for this single-user, single-Windows-laptop application to authorize local portfolio writes, while preserving fail-closed refusal (DP-2 Option 2F, caller-authority refusal, no owner disclosure) and without enterprise infrastructure?*

Answer: **keep the OS-protected same-host local IPC endpoint (named pipe) as the one privileged surface — with the trust boundary stated as *the Windows user account*, not as process identity — and close the remaining empirical gap with gate V on the laptop.** §6–§8.

## 2. Verified live state (Phase 1)

| # | Item | Verified value |
|---|---|---|
| 2.1 | IPD PR #8 | `OPEN`, `MERGEABLE`/`CLEAN`, head `aeb8c0e1`, 8 files, +2046/−62, 0 comments/reviews, **not merged**; branch ref equals local (`git ls-remote`) |
| 2.2 | Security-contract proposal (rev 2) | `evidence/np04/IIPS_v3.0_G2_IPD_LOCAL_PRINCIPAL_OS_IPC_SECURITY_CONTRACT_PROPOSAL_2026-10-16.md`, blob `b49fb10c4ec2849add552ad65657fad59edaf852` — design only, decision requested in §13, nine gates in §14 |
| 2.3 | UI-store-port act | `np04-g2-portfolio-ui-store-port-2026-10-16-001` — **APPROVED as written** 2026-10-16; approval table published in §A.6 (with the disclosed recording correction at `aeb8c0e`) |
| 2.4 | UI-store-port implementation | `8c9ef08` — async port, session-only adapter, 2F refusal at the port/save boundary, bypass default off. **Session-only, non-durable**; forbidden-API scan (transport/storage/process) = 0 hits in product code; this act authorizes **no** IPC, provisioning, write, or admission |
| 2.5 | G24 identity/owner/tenant/write requirements (off-main `6828155e`, evidence only — **not admitted**) | `src/server/authorization.ts`: verified identity → **tenant membership as a separate authority** (`resolveTenant`) → `(applicationUserId, tenantId, portfolioId)` triple; every failure path → `ResourceNotFoundError` (unauthorized ≡ missing). `src/app_identity/service.ts`: mapping lifecycle `PENDING→APPROVED→ACTIVE→RETIRED`; `resolveTenant` requires **exactly one `ACTIVE`** membership — 0 → `TenantMembershipMissing/Revoked`, >1 → *"Ambiguous tenancy is not resolved by guessing"*. `src/portfolio/durable-store.ts`: `SaveHoldingsRequest` = `OwnershipScope{applicationUserId, tenantId}` + `portfolioId` + `holdings` + options + `expectedRevision` (optimistic concurrency); its Save Guard 2 still accepts a **caller-asserted** resolution → must be re-enforced IPD-side |
| 2.6 | Consumer transport / fence (IRR `main`) | `frontend/server/user-portfolio-transport.ts`: all six `/api/user-portfolios*` routes (incl. `PUT …/holdings`) end in `respondOwnerContextUnavailable`; **no** body, tenant claim or `Authorization` header is read. `frontend/server/owner-context-unavailable.ts`: `503` `{error:'owner-context-unavailable'}`. `frontend/server/user-portfolio/translationBoundary.ts`: `G2_TENANT_CLAIM_KEYS`, `G2_IDENTITY_CLAIM_KEYS` (incl. `companyId`, `runtimeCompanyId`, `identityStatus`, `resolutionDisposition`), `G2_DURABLE_IDENTITY_KEYS`, enforced by `assertNoG2CallerAuthority`. **Fence intact and fail-closed** |
| 2.7 | DP-1 | `docs/integration/IIPS_v3.0_GATE_C_S5A_DP1_OPTION_1A_PRIME_BINDING_CONTRACT_AND_PREREQUISITE_SPECIFICATION_2026-10-13.md`: DP-1 **Option 1A′ selected** (`GC-D3`); P-2 trust-anchor/issuer and P-3 credential path **specified but not stood up**; P-4 provisioning specified; **P-6 not granted**; P-8 plan fixed; 503 fence unchanged |
| 2.8 | Windows evidence already captured in the repo | Visual/host acceptance records only (`windows-acceptance-evidence/WINDOWS-FULL-SHELL-VISUAL-ACCEPTANCE-20260923.md`, `evidence/operator_drop/windows_*manifest*`). **No endpoint, DACL or reachability measurement exists in the repository.** The four POSIX probes (E1–E4) are the only executed boundary probes, and they are POSIX |
| 2.9 | Persistence prior art | G24 uses **`better-sqlite3`** (native module → build/prebuild dependency on Windows); IPD's `np04-governed-persistence-windows` (`2e11fa3b`) uses Node's built-in **`node:sqlite` `DatabaseSync`** (verified present in v22.22.3, experimental warning) with ownership `(tenantId,userId)` taken *"from the identity authority, never from request payloads"* and a **caller-supplied absolute** database path (no default location invented). Both are evidence; neither is admitted |

## 3. Platform facts, re-verified at source (Phase 2)

The previous report's Windows facts were treated as leads. Re-verified against the runtime actually bundled with the deployment version:

| # | Fact | Evidence (re-verified this pass) |
|---|---|---|
| **F-1** | Node has **no AF_UNIX on Windows**; the local domain is a **named pipe** | Node v22.22.3 `doc/api/net.md` L35, L58–59 |
| **F-2** | libuv creates the listening pipe with **`lpSecurityAttributes = NULL`** and **no** `PIPE_REJECT_REMOTE_CLIENTS`: `CreateNamedPipeW(handle->name, PIPE_ACCESS_DUPLEX \| FILE_FLAG_OVERLAPPED \| WRITE_DAC \| (firstInstance ? FILE_FLAG_FIRST_PIPE_INSTANCE : 0), PIPE_TYPE_BYTE \| PIPE_READMODE_BYTE \| PIPE_WAIT, PIPE_UNLIMITED_INSTANCES, 65536, 65536, 0, NULL)` | libuv **v1.51.0** `src/win/pipe.c` L541–550 (`pipe_alloc_accept`). **Confirmed exactly as previously stated** |
| **F-3** | With a `NULL` descriptor Windows applies the **default named-pipe DACL**: *"grant full control to the LocalSystem account, administrators, and the creator owner. They also grant **read access** to members of the Everyone group and the anonymous account."* | MS Learn, *Named Pipe Security and Access Rights* (quoted verbatim) |
| **F-4** | No `PIPE_REJECT_REMOTE_CLIENTS` (0x8) ⇒ **`PIPE_ACCEPT_REMOTE_CLIENTS`** — remote connections are *accepted and checked against the DACL*; the documented remedy for remote/other-session callers is the **logon SID on the DACL**, i.e. requires setting a security descriptor | libuv source (F-2); MS Learn, `CreateNamedPipeW` (`dwPipeMode`); MS Learn, *Named Pipe Security and Access Rights* (logon-SID sentence) |
| **F-5** | **New, material:** a client of a **duplex** pipe *"can specify GENERIC_READ or GENERIC_WRITE, or both"* — read-only open is legal. Therefore the default DACL's *read* ACE to Everyone **is sufficient to establish a connection** (it is **not** sufficient to send a request: that needs write access) | MS Learn, `CreateNamedPipeW` (`PIPE_ACCESS_DUPLEX` row) |
| **F-6** | libuv's own client reflects F-5: it opens `GENERIC_READ \| GENERIC_WRITE`, then falls back to `GENERIC_READ \| FILE_WRITE_ATTRIBUTES`, then `GENERIC_WRITE \| FILE_READ_ATTRIBUTES` | libuv v1.51.0 `src/win/pipe.c` L146–189 |
| **F-7** | Node's **only** pipe-permission knobs **widen**: `readableAll`/`writableAll` → `fchmod` → `uv_pipe_chmod`, which does `GetSecurityInfo` → `SetEntriesInAcl(SET_ACCESS, **Everyone**)` → `SetSecurityInfo`, granting `GENERIC_READ \| FILE_WRITE_ATTRIBUTES` (readable) / `GENERIC_WRITE \| FILE_READ_ATTRIBUTES` (writable) + `SYNCHRONIZE` | Node v22.22.3 `doc/api/net.md` L554–559, L589; `lib/net.js` L2139–2144; libuv `src/win/pipe.c` L2650–2705 |
| **F-8** | `FILE_FLAG_FIRST_PIPE_INSTANCE` + libuv's mapping of `ERROR_ACCESS_DENIED → UV_EADDRINUSE` ⇒ **squatting/collision fails closed at bind**; on a duplex pipe `FILE_GENERIC_WRITE` includes `FILE_CREATE_PIPE_INSTANCE`, so **additional instances** are creatable only by principals holding write access (owner/Admins/System) | libuv `src/win/pipe.c` L784–793; MS Learn, *Named Pipe Security and Access Rights* (FILE_GENERIC_WRITE / FILE_CREATE_PIPE_INSTANCE) |
| **F-9** | **No peer identity is obtainable** on this stack: the POSIX probe (E1) showed `remoteAddress/remoteFamily/remotePort` all `undefined`, and the in-scope Node/libuv API exposes no Windows client PID/SID. The server cannot attribute a connection to a process | executed probe E1 (proposal §4.5); Node/libuv API surface |

**Net effect of F-2/F-3/F-5/F-7:** the application **cannot narrow** the endpoint's permissions from supported Node APIs, and **can only widen** them. The endpoint's effective access control is therefore **the Windows default for a named pipe created by the operator's account, plus host configuration** — and that default is *not* "nothing": it denies **write/request submission** to Everyone, the anonymous account, and other local accounts.

## 4. What the boundary actually is (corrected statement)

**Boundary = the Windows user account that creates the endpoint.** Not the process, not the application, not a wire credential.

| Caller | Can connect? | Can **send** a request (write access)? | Basis |
|---|---|---|---|
| The operator's own processes — including **any** other process running as the operator (e.g. malware) | Yes | **Yes — full control** | F-3 (CREATOR OWNER) |
| A **different non-administrative local user** (any session) | **Yes — read-only** (F-5) | **No** | F-3 read ACE to Everyone; write denied |
| **Anonymous / remote caller** with a different account | **Yes — read-only**, if it can reach IPC$ | **No** | F-3, F-4; reachability depends on inbound SMB policy |
| **Remote caller authenticating as the operator's own account** | Yes | **Yes** — same account ⇒ CREATOR OWNER | F-3; requires network reachability + credential possession; host configuration decides |
| Administrator / LocalSystem | Yes | **Yes** — and both can read the store file directly anyway | F-3 |
| **Any browser / web page (any origin, local or remote)** | **No** — no OS API to open a named pipe | **No** | platform capability |

**Correction to the proposal's rev-2 text (applied in the proposal, §4.3/§5.3 note).** Rev 2 said a different local user is *"OS-level read-only at best"* and a remote caller is *"not for invocation (no write access)"*. The **invocation** conclusion is correct, but the **connection** conclusion is stronger than rev 2 implied: per F-5 **such a caller can complete a read-only connection**. Consequences: (a) C5 rule 1 — *never emit a byte before a valid, authorized request* — is **load-bearing**, not merely prudent; (b) gate V must include a **read-only connect attempt** by a different user, not only a DACL inspection; (c) a **raw client** (e.g. `.NET NamedPipeClientStream(..., PipeDirection.In)`) is the correct test instrument, because libuv's `net.connect` would fail earlier (F-6) and understate the exposure.

### 4.1 What is explicitly *not* protected (accepted, disclosed)
Any process running as the operator's Windows account — malware included — can send requests, and can also read or write the SQLite store file directly in the operator's profile. **No mechanism at this layer can prevent that** (a DACL that admits the application's own account admits all of that account's processes; F-9 means the endpoint cannot attribute the caller; administrators/System can do anything regardless).

## 5. Alternatives evaluated (bounded to what actually differs)

| Alternative | Trust boundary | OS/runtime enforcement | Who can **send** | Verdict |
|---|---|---|---|---|
| **A — Same-host named pipe** (current direction) | The Windows **account** owning the endpoint | Default named-pipe DACL (F-3), no remote-reject flag (F-4), first-instance bind (F-8); read-only reachability (F-5) must be neutralised app-side (C5.1) | Operator's account (+Admins/System) | **Recommended** |
| **B — Loopback TCP + app-level bearer** | *No per-account boundary at all* — loopback has no user ACL | None stronger than the app's own token check; fixed port ⇒ squatting risk; any local **page** can issue requests (CSRF/preflight only mitigates, never authenticates) | **Every** local process regardless of account, plus browsers | **Rejected — strictly weaker**, and more moving parts (issuer, token storage/rotation) |
| **C — Local bearer / locally issued credential** (DP-1 Option 1A′ P-2/P-3) | Same account (any file/key the account can read is readable by all its processes) | Issuer config, key custody, credential storage, rotation, revocation | Same as A — *no stronger*, because the credential must be available to a process in the same account | **Rejected as redundant for this capability**: equal boundary, strictly more infrastructure, and it reintroduces a credential where a transport fact suffices |
| **D — Separate privileged Windows service** | A *second* principal | Service SID, explicit pipe DACL, elevation, install/update/recovery | **Still the operator's account** (the user is the caller) — plus Admins/System | **Rejected — does not solve the demonstrated problem** and adds a privileged component and a higher-privilege parser of attacker-reachable input |
| **E — Native addon to set a stricter DACL / `PIPE_REJECT_REMOTE_CLIENTS` / logon SID** | Same account, minus other sessions | `SetSecurityInfo` on libuv's handle (it already holds `WRITE_DAC`, F-2) — requires a compiled addon | Operator's account; excludes same account's other sessions | **Deferred, not required**: F-3 already excludes other accounts; the logon-SID ACE would exclude *the operator's own* other sessions, which is a non-threat for a one-person laptop, at the cost of a native build chain on Windows |
| **F — No endpoint; store file only, in-process** | Same account (file ACL in the profile) | NTFS ACL | The owning process; other same-account processes can open the file directly | **Not sufficient alone** — the browser UI cannot reach an in-process store, and it adds no boundary; retained as **defence in depth** (same boundary as A) |

*(Per-alternative owner establishment, anti-impersonation and refusal: in all viable rows the owner is established **server-side from the provisioned binding** and can never be asserted by a caller; A/C/D/E differ only in what the OS adds — A adds an account-scoped endpoint with no wire credential, which is the minimum that admits the application and excludes other accounts and browsers.)*

## 6. Recommendation (Phase 3) — **Option A**, with the exact controls

**Retain the OS-protected same-host local IPC direction**, and state its boundary honestly as *the Windows account*. Proportionate because: one user, one laptop, one interactive account; the endpoint adds **no** exposure beyond the account that already owns the store file; it excludes **other accounts** and **all browsers** structurally; it fails closed on collision; and it needs no service, issuer, certificate, key custody, elevation, or domain.

Controls required (C5/C6 restated + sharpened by F-5):
1. **Never write a byte to a connection that has not supplied a valid, authorized request** — no greeting, banner, version, or data. This neutralises the read-only access other accounts and anonymous remote callers can obtain (F-5).
2. **Authorize every request from the endpoint's provisioned binding; never from the payload** (refuse, do not ignore, caller-supplied principal/tenant/owner/portfolio-scope/`companyId`/`identityStatus`/`resolutionDisposition`).
3. **One endpoint, bound once at startup, fail-closed if it cannot be bound** (including the collision case, F-8): no retry loop, no TCP fallback, no first-caller-wins.
4. **One client, capped connections and request size** — the endpoint serves exactly one consumer.
5. **Refuse unresolved/ambiguous holdings before any store mutation** (DP-2 Option 2F), and **refuse `PRODUCTION`-mode bypass**; the historical operator bypass is not restored.
6. **Startup fail-closed** on missing/invalid binding, missing store, or unverified migrations; **shutdown closes the endpoint**.
7. **No owner disclosure:** unauthorized ≡ missing, as G24 already does.
8. **Store file under the operator's profile, ACL'd by the OS** (defence in depth, same boundary); no second store.
9. **Host posture (assumptions, not new infrastructure):** one interactive account; inbound File-and-Printer-sharing/SMB **off**; browser surface **loopback-bound**; wildcard CORS never on owner-scoped routes.

## 7. Residual risk accepted by this boundary (exact)

1. **A malicious or arbitrary process running as the operator's Windows account can invoke the capability with the single principal's authority** — and can equally read/write the store file directly. *This is the accepted scope limit of a single-user personal application.*
2. **Administrators and LocalSystem** can do the same (they can do anything on the host).
3. **A remote party who can reach SMB/IPC$ *and* authenticate as the operator's account** has the same account ⇒ same authority. Mitigated by host posture (9) and measured by gate V-2; **not** mitigated by the application (it cannot set the logon SID, F-4).
4. Read-only connections by other accounts/anonymous are **possible** (F-5): they learn nothing (control 1) and cannot send (F-3), but the endpoint must never speak first.

**No claim is made that this design resists a fully compromised operator account, an administrator, or LocalSystem.**

## 8. Mandatory Windows proof — gate V (evidence that closes F-3/F-4/F-5 on the real host)

Run on the laptop, ordinary user, no elevation; capture raw output; publish with the qualification record.

| Gate | Procedure | Pass criterion |
|---|---|---|
| **V-1** | Start the IPD process; `accesschk64.exe -accepteula -l -v \pipe\<endpoint-name>`; cross-check `Get-Acl \\.\pipe\<endpoint-name>` | Write/`FILE_WRITE_DATA` **only** for the operator, Administrators, SYSTEM, CREATOR OWNER; Everyone/anonymous ACEs recorded as **read-only** (expected — record, do not hide) |
| **V-2** | From a second machine: `[System.IO.Directory]::GetFiles('\\<laptop>\pipe\')`; then a connect attempt to the endpoint name (both `PipeDirection.InOut` and `PipeDirection.In`); record laptop SMB inbound state (`Get-SmbServerConfiguration`, File-and-Printer-Sharing firewall rule state, `RestrictNullSessAccess`) | No remote **write** access; if read-only connect succeeds, **zero bytes** are received (control 1 demonstrated) |
| **V-3** | As a **second non-administrative local user** (or second session): `PipeDirection.InOut` then `PipeDirection.In`, and a send attempt | `InOut`/write ⇒ denied; `In` ⇒ connect may succeed with **zero bytes** received and no operation possible |
| **V-4** | Start a second process binding the same name; then clean shutdown | Second bind **fails** (`UV_EADDRINUSE`/`ERROR_ACCESS_DENIED`), no fallback; endpoint disappears on shutdown |
| **V-5** | Record `winver`/OS build, `node -v`, `process.versions.uv`, endpoint name format | Recorded; any deviation from F-1…F-9 triggers a re-read of this assessment |
| **V-6** | **Residual demonstration:** as the same account, connect with a raw client and show it **can** send | Confirms the accepted residual (§7.1) rather than leaving it asserted |

**Failure disposition.** If V-1 shows write access for any identity beyond the four named, or V-2 shows remote invocation, this design does **not** satisfy the boundary on Windows as written; the disposition is (a) a host-configuration mitigation that can be evidenced, or (b) rejection of the Windows-Node variant — **not** an implementation-time workaround and **not** a native addon without a separate decision (E).

## 9. Contract and authority consequences (Phase 4)

| # | Question | Answer |
|---|---|---|
| 9.1 | Does the **G24 identity-acquisition clause** have to change? | **Yes — exactly as rev 2 A-1 proposes and no more.** The OIDC-bearer position is replaced by *"accepted, with write access, on the IPD-owned endpoint carrying exactly one provisioned principal binding"*. This assessment **strengthens** the case: F-9 shows no peer identity exists, so the clause must bind the **provisioned endpoint**, and must not claim attribution to a caller |
| 9.2 | Does the **IPD proposal** need amendment? | **Substantively no** — A-1/A-2/A-3, C1–C12 and gates A–E stand as written. **Text correction required** (applied in the proposal this pass): rev 2's §4.3/§5.3 understated reachability (F-5) — a different local user and a remote different-account caller can complete a **read-only** connection. §9's gate V must therefore include a **read-only connect attempt** as a pass criterion (V-2/V-3) |
| 9.3 | Is a corresponding **IRR DP-1 amendment** required? | **Yes, and separately.** DP-1 Option 1A′ (P-2 trust anchor/issuer, P-3 credential acquisition) describes a locally issued bearer; for the durable user-portfolio capability that credential path is **superseded** by the IPD endpoint binding — there is no issuer, no key material and no stored credential in the simpler design. **P-4 provisioning survives** (IPD-side: one `application_user`, one tenant, exactly one `ACTIVE` membership, one binding, revocation defined). **P-6/P-8 survive** for the consumer's endpoint-client work |
| 9.4 | Who must accept each change? | Both acts are the **same human, Ramki, in two named capacities**, each recorded in its own repository/ref: (i) **IPD security-contract authority** — the §13 decision text on PR #8 (amends the G24 clause for this one deployment; grants no provisioning/implementation/qualification/write/route/admission); (ii) **IRR Program Authority** — a DP-1 amendment act recorded in IRR (§9.3), preserving DP-2 Option 2F, H-18 scope and the 503 fence. An act in one repository does **not** silently amend the other |
| 9.5 | Do the **gates stay**, and what closes each? | **IPD:** V (V-1…V-6 above, executed on the laptop) → contract acceptance (§13) → **A** provisioning (one user/tenant/membership/binding; tenant provisioning is *currently not authorized*) → **B** implementation authority (exact IPD+IRR files, endpoint name, store driver and path; note the **IPD-`main` durable-store basis does not exist** — G24 is off-main and **must not** be promoted; §2.9 driver fact is an input to B, not a decision taken here) → **C** qualification (Q1–Q11) → **D** route/consumer admission (the IRR **503 fence stays** until then) → **E** write policy + canonical-identity source (until then **no successful writes**; 2F unrelaxed). **IRR:** DP-1 amendment (§9.3) → P-6 → P-8. |
| 9.6 | Does the recommendation need a **new implementation-authority act**? | **Yes.** The UI-store-port act explicitly excludes IPC, the durable adapter, provisioning and writes, and renders none of them. The durable work needs its own **IPD** act (gate B) and a corresponding **IRR** act — neither is implied by this assessment |

## 10. What this record does not do

No application code, test, route, schema or configuration was changed by this record beyond the §9.2 text correction in the proposal. No IPC client or service was added; **no durable write path exists**; no identity was provisioned; the G24 off-main lineage was read as evidence only and is **not** promoted, merged, cherry-picked or repinned; IRR's transport and 503 fence are **untouched**; PR #8 was **not merged**; no wiring of the session-only UI port to any durable store was introduced. This assessment renders no authority of any kind and is **not** acceptance of the security contract.

## 11. Decision sought

Reuse the rev-2 §13 decision text verbatim (it already scopes the amendment to one clause, names A-2/A-3, requires gate V, and grants no provisioning/implementation/qualification/write/route/admission), **with two additions**:

> I additionally record, on this assessment (`IIPS-V3-G2-LOCAL-IPC-TRUST-BOUNDARY-VERIFICATION-AND-RECOMMENDATION-2026-10-16-01`), that the trust boundary of this deployment is **the Windows user account**, that a process running as that account (including malware), an administrator, LocalSystem, and a remote party able to authenticate as that account are **outside** the protection boundary, and that other local accounts and anonymous remote callers can obtain at most a **read-only** connection on which the application must emit nothing. I require gate V to include the read-only connect attempt, and I record that the corresponding IRR **DP-1 amendment is a separate act** in the IRR repository.

---

*Recording agent: Arena — verification, evaluation and recording only. Program Authority: Ramki. Nothing in this record is accepted, effective, implemented, qualified or admitted, and nothing here authorizes provisioning, implementation, a durable write, or route admission.*
