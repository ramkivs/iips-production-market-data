# IIPS v3.0 — G-2 Gate 3: Implementation-Authority Request for the IPD Durable User-Portfolio Store and Same-Host IPC Path (CV-39)

| Field | Value |
|---|---|
| **Request ID** | `IIPS-V3-G3-IMPLEMENTATION-AUTHORITY-REQUEST-2026-10-18-01` |
| **Status** | **G3-D0 RESOLVED: RE-AUTHOR THE INTENDED IMPLEMENTATION BASIS ON IPD `main`.** The prior designated-ref Gate B D-4 remains an authentic historical grant at its original scope, but its implementation is superseded as the basis for the intended G3 path and is reference-only. **No new implementation authority is granted by G3-D0.** The remaining scope decisions and exact new Gate 3 act are still required; see the additive G3-D0 record and §11.6. |
| **Decision authority** | **Program Authority** (Ramki). IPD security-contract authority for the IPD files. IRR capacity for the IRR files (IRR Gate 3 scope is separately named in §6.3). |
| **Gate** | Gate 3 = implementation authority (CV-39) in the CV-20 Option A sequence (designation record §6). Named as *Gate B* in L-IPC-1 §14 and as *Gate 3* in the Gate 2 request §3. |
| **Predecessors (all satisfied or recorded)** | CV-20 Option A designation `IIPS-V3-CV20-OPTION-A-OWNERSHIP-SOURCE-DESIGNATION-2026-10-18-01` (Gate 1). Gate 2 acceptance `IIPS-V3-G2-GATE2-ACCEPTANCE-AUTHORITY-REQUEST-2026-10-18-01` §6 (G2-D1 to G2-D5). Consumer contract v1.0.0 **ACCEPTED**. Gate E write policy rev 1 **ACCEPTED**. |
| **Baselines at preparation** | IPD `main@b16d79fa116007f793620119c4c943996a286da2`. IRR `main@b1f1ea0fe9fba31aacae54180e1231f2b06014ba`. Both verified remotely on 2026-10-18. These are historical preparation baselines, not current refs. Additive current IPD verification: `main@f678363de5db1486aa6c52be79e4d290380fdd27`; current IRR verification is recorded in the separate Windows handoff manifest. |
| **Label** | `non-production, single-principal, same-host IPC`. Single user, one laptop, non-production. |
| **Production status** | `NON_PRODUCTION`. Production is **NOT AUTHORIZED**. |

> **Non-grant.** Acceptance of Gate 2 did not grant this authority. This request asks the Program Authority to decide the questions in §9. Until a separate Gate 3 act names the exact basis, file set and tests, **no implementation, durable store, IPC endpoint, migration, provisioning, write path or IRR adapter may be created or enabled**. Gate 4 qualification, result acceptance, Gate 5 admission and the IRR `503` fence are separate and are not requested here.

---

## 1. Why this request is needed, and what it changes

Gate 2 is now satisfied for the contract and the write policy. Gate E W-1 condition 2 requires a Gate 3 act "that names the exact repository, IPD-`main` basis, file set and tests for the write path." Nothing on IPD `main` satisfies that today. This request prepares the act. It names the choices the Program Authority must make first, and it proposes the smallest viable scope so the choices can be made in one step.

## 2. Prerequisite status

| # | Prerequisite | Status at preparation | Evidence |
|---|---|---|---|
| P1 | CV-20 item (b): ownership source | **Met** (Option A, Gate 1) | CV-20 designation record §1, §6 |
| P2 | Gate 2: consumer contract v1.0.0 | **Met** (ACCEPTED 2026-10-18, G2-D1) | Contract header; decision request §6.1 |
| P3 | Gate 2: Gate E write policy rev 1 | **Met** (ACCEPTED 2026-10-18, G2-D2) | Policy header; decision request §6.1 |
| P4 | G2-D3 meaning of "stop both processes" | **Met** (option (b): stop and restart both IRR and IPD) | Policy §4 precondition; decision request §6.1 |
| P5 | G2-D4 tenant-hint reading | **Met** (non-authoritative; IPD binding is the sole tenant source) | Decision request §6.3 |
| P6 | G2-D5 revoked-binding data disposition | **Met as policy** (for future implementation; not implemented or tested) | Contract §7; policy W-16 |
| P7 | CV-20 item (a): qualification-authority choice for the existing durable line | **OPEN, PA-reserved** | CV-20 record R-1, R-8(a); decision in §9 |
| P8 | CV-20 item (c): storage technology within IPD ownership | **OPEN, PA-reserved** | CV-20 record R-8(c) and §5 element 14 (durable storage); decision in §9 |
| P9 | CV-20 item (d): G-2 §3 owner/isolation/audit/durability requirements in a single-user non-production mechanism | **OPEN, PA-reserved** | CV-20 record R-8(d); decision in §9 |
| P10 | Gate 3 IPD-`main` basis (CV-20 record R-3) | **OPEN.** A basis is proposed in §3 for the PA to approve. The agent does not select it. | §3 |
| P11 | IRR C8 loopback and CORS posture for owner-scoped surfaces | **NOT MET on IRR `main`** (verified; see §2.1). IRR scope. | §2.1 |
| P12 | Gate A (provisioning) on the Windows deployment host | **APPROVED, NOT EXECUTED** (CV-20 record R-2) | CV-20 record §4.4 |
| P13 | Gate C read-only subset Q1–Q4, Q9–Q11, including C5.1/Q9 zero bytes | **NOT EXECUTED** | Gate E §4 QE-11; readiness reconciliation §7 |
| P14 | Windows endpoint ACL/SDDL, cross-account, remote isolation, pipe collision (V-1, V-4, second account, remote) | **Technically unverified.** PA-waived as test requirements; waivers are not proof. | CV-20 record §4.9; L-IPC-1 §9 |
| P15 | Host preconditions (single interactive user; inbound sharing off; browser loopback under C8) | **Not recorded** (L-IPC-1 U-2) | L-IPC-1 §15 |

### 2.1 Verified facts at preparation (repository state, not qualification)

| Fact | Verification | Result |
|---|---|---|
| IPD `main` has no durable store, no IPC endpoint, no SQLite dependency | `git ls-tree` of `src/` at `b16d79f`: no `src/persistence`, `src/ipc`, `src/server`, `src/app_identity` or `src/auth`. `package.json` dependencies: `react-router-dom` only. | **Verified** |
| The IPD portfolio store on `main` is in-memory and `SESSION_ONLY` | `frontend/src/features/portfolio/portfolio-store.ts` (blob `3bf852b99e300a8dfa71d3b1b04ed0f7b947b4a5`); `portfolioStorePort.ts` (blob `d61f18dfdce12a7f0c4377a3c6d410026d454089`) declares `SESSION_ONLY` and `durable: false` | **Verified** |
| The IPD identity authority exists on `main` | `src/identity/mapping_store.ts` (blob `eec60c09…`) `IdentityMappingStore.resolveCompanyId` emits `UNMAPPED_IDENTIFIER` and `AMBIGUOUS_COLLISION`. `src/identity/security_master.ts` (blob `e260fd90…`); `src/identity/quarantine.ts` (blob `70c6f658…`) | **Verified** |
| IRR `/api/user-portfolios*` returns the 503 fence and never calls the port | `frontend/server/user-portfolio-transport.ts` (blob `51704c12…`) calls only `respondOwnerContextUnavailable`; `owner-context-unavailable.ts` (blob `cb8db45d…`) returns 503; `executive-transport.ts` (blob `d1c52fe6…`) routes to the transport; no concrete `UserPortfolioPort` is instantiated on `main` | **Verified** |
| IRR C8 is **not** met | `frontend/server/executive-transport.ts` line 693 sets `Access-Control-Allow-Origin: *`; line 926 calls `server.listen(port, …)` with no host, so the server binds all interfaces. `frontend/vite.config.ts` sets `host: '0.0.0.0'`. | **Verified** |
| IRR configuration names in the contract are not on IRR `main` | `git grep` for `IIPS_G2_IPC_ENDPOINT` and `IIPS_G2_IPC_TENANT_HINT` at `b1f1ea0`: no match | **Verified** |
| Off-`main` G24 durable store (`6828155e`, tag `iips-pin-g24-6828155e`) contains `DurablePortfolioStore` on `better-sqlite3` | Commit exists on the remote (GitHub API). Store internals and "84/84 G24 tests" are **source-reported** in the readiness reconciliation §3.1 and the IRR G-2 implementation record. Not rerun here. | **Commit verified; contents source-reported** |
| Off-`main` Gate B (`cec70802`) refuses every write (`WRITE_NOT_AUTHORIZED`) | Commit exists on the remote. Read-only design evidence per readiness reconciliation §3.1. | **Commit verified; behaviour source-reported** |

## 3. Proposed IPD-`main` basis (for PA approval; not selected by the agent)

**Proposed basis.** IPD `main` at the commit current when the Gate 3 act is issued. No off-`main` ref, branch or tag is promoted, merged, cherry-picked or re-pinned. The off-`main` lineage (`6828155e`, `2ded0e98`, `cec70802`, `6c654be7`, `110e221f`, `470cc698`/`5eba01b6`) is **reference evidence only**. Any code taken from it is **re-authored on `main`** under the Gate 3 act, and each re-authored file is reviewed against the contract and the Gate E policy.

**Why IPD `main` and not the off-`main` lineage.** Gate A Decision 1, Gate B act §5.6 and D-1 prohibit off-`main` admission. The off-`main` lineage was designed around an OIDC-verified identity that the corrected scope excludes (CV-20 record §3). Using it as a base would import that design.

**Proposed host locations on IPD `main`.** Names are proposals for the Gate 3 act to fix.

| Area | Existing on `main` (reused, unchanged unless listed) | New on `main` (proposed) |
|---|---|---|
| Portfolio port and domain | `frontend/src/features/portfolio/portfolioStorePort.ts` (`PortfolioStorePort`, refusal codes, 29-key guard); `portfolio-store.ts` (merge, REPLACE, contributions, `contentDigest`, consolidation guards) | A durable **adapter** implementing the existing `PortfolioStorePort` (no new port; the UI `SessionPortfolioStorePort` stays `SESSION_ONLY`) |
| Canonical identity (W-6) | `src/identity/mapping_store.ts`, `security_master.ts`, `quarantine.ts` (used unchanged) | None |
| Durable persistence | None | `src/persistence/` (proposed): connection, IMMEDIATE transactions, migration ledger, schema for portfolios, revisions, holdings, contributions and A-2 `local_principal_bindings` (plus A-3 audit lines) |
| Same-host IPC endpoint | None | `src/ipc/` (proposed): UNIX socket with owner-only modes on POSIX; named-pipe creation for Windows (verified only at Gate 4); framing per contract T-1 to T-8; dispatch and Class P/A mapping per contract §5 |
| Tests | `tests/bi07_portfolio_store_port.test.ts`, `tests/bi07_portfolio_ui_integration.test.ts` (must keep passing) | New tests in §6.1 |

The port types are imported from `frontend/src/features/portfolio/` by the Node-side modules. The root `tsconfig.json` already compiles both `src/**` and `frontend/**`. No new package is added without a separate decision (see §9, G3-D2).

## 4. Storage technology (CV-20 residual (c)) — PA decision required

Gate E W-11 is technology-neutral. The choice belongs to the PA (CV-20 residual (c)). The options below are facts for the decision, not a recommendation.

| Option | Description | Known facts | Unknowns to resolve before Gate 4 |
|---|---|---|---|
| **A** | SQLite through a native Node driver (`better-sqlite3`, as in the off-`main` G24 lineage) | Used by the off-`main` lineage (source-reported). Gives IMMEDIATE transactions and a single-file store. | Adds a native dependency and a Node-ABI pin. Requires a native build on the Windows host. Must be verified there. |
| **B** | SQLite through Node's built-in `node:sqlite` module | No native dependency. The sandbox Node v22.22.3 exposes the module. | Stability and warning status on the pinned Node 22 line, and behaviour on the Windows host, are **not verified** in this pass. |
| **C** | Another embedded engine, or a non-SQL store | Not evaluated | Would need its own evidence and authority. Not recommended by this request. |

## 5. Smallest viable implementation (local, single-user)

1. **Startup order (C2, C5.3).** `validate → connect → migrate → verify → bind`. An unverified migration, a store fault or an endpoint-name collision creates **no** endpoint and has no fallback.
2. **Storage.** One operator-local database file on the deployment host. Single writer, IMMEDIATE transactions, commit-on-acknowledge, migration ledger verified at startup. Backup and restore are operator-local (W-12). No automated backup is claimed.
3. **Schema.** The A-2 `local_principal_bindings` table and the A-3 audit lines (CV-20 record §4.4). The portfolio tables for portfolios, immutable revisions, holdings and BrokerContributionRecord lineage with SHA-256 and `contentDigest` (W-13). **No** schema change at request time (W-4).
4. **Principal.** The single `ACTIVE` binding is resolved **per request** from the store, with no cache (OC-2, C5.2). Ownership is authorized against `(applicationUserId, tenantId, portfolioId)` (W-2). Unauthorized is indistinguishable from missing (C6).
5. **Endpoint.** Only the same-host IPC endpoint. **No** TCP, HTTP or URL listener is created by IPD (C1, T-1). Zero bytes before a valid, authorized request (T-5, C5.1).
6. **Read operations (contract §6).** `portfolio.list`, `portfolio.get`, `portfolio.revisions`. `portfolio.analytics` is **reserved** and refused as `UNKNOWN_OPERATION` (Class P).
7. **Write operations.** Two options for the PA (decision G3-D3). **Option 3a (smallest):** no write code. Every write operation is refused as `WRITE_NOT_AUTHORIZED` (Gate E W-1), so the Gate 3 act names the read path and the refusal path only. A later Gate 3 act would be needed before any write code exists. **Option 3b:** write code is implemented on `main` but **disabled by default** behind a fail-closed gate that requires all four W-1 conditions. Nothing in 3b enables writes.
8. **Durability claims.** `durable: true` / `'DURABLE'` is reported only for a result served from or committed to the designated durable store (W-11). The UI remains `SESSION_ONLY` until a separate admission act.
9. **Provisioning (Gate A).** The one-time provisioning act is **not** executed by Gate 3. Whether Gate 3 includes provisioning **code** is decision G3-D4. Execution is always a separate operator act.

### 5.1 IRR scope (IRR authority; named here only so the Gate 3 act is complete)

- C8: loopback-bind and remove wildcard CORS on owner-scoped surfaces (§2.1 verified not met). Under IRR authority.
- An IPC client adapter that re-enforces OC-7 and C7 before sending, with no retry of writes (W-9, IRR-7).
- Revision of `frontend/server/user-portfolio/userPortfolioContract.ts` (`G2_CONTRACT_VERSION = '2'`, blob `0dec72eb…`) for the IPC path. Contract V-5 says this supersedes the HTTP wire description on acceptance. Its IRR revision is IRR Gate 3 scope.
- **All** `/api/user-portfolios*` routes **stay at 503** until Gate 5. The `GET`/`HEAD …/context` route maps to no v1 operation (contract §6 note).

## 6. Files, tests and observable acceptance criteria (proposed; the Gate 3 act fixes the exact list)

### 6.1 Proposed IPD files

| File | Change | Gate 3 scope |
|---|---|---|
| `src/persistence/*` (new) | Connection, migrations, ledger, schema, transactions | Proposed |
| `src/ipc/*` (new) | Endpoint, framing, dispatch, Class P/A mapping, C7 key refusal | Proposed |
| `src/identity/*` | **No change** (W-6) | — |
| `frontend/src/features/portfolio/*` | **No change** to `PortfolioStorePort`, the UI `SessionPortfolioStorePort` or its `SESSION_ONLY` labelling. Durable adapter added alongside (proposed) | Proposed |
| `tests/*` (new) | Tests in §6.2 | Proposed |
| `package.json` / lockfile | Only if G3-D2 selects a driver, under a separate line item | Conditional |

### 6.2 Proposed tests (Gate 3, run in CI; not qualification)

| ID | Test | Observable result |
|---|---|---|
| T-A | Framing: oversize (>64 KiB request), malformed, `v ≠ 1`, unknown op, pipelined frames | Zero bytes; connection closed (Class P) |
| T-B | Caller-authority refusal: each of the 29 IPD keys and each C7 key, at top level and in `options` | Zero bytes; no store access |
| T-C | Binding: zero, two, malformed, or `REVOKED` binding/membership | Zero bytes; no owner disclosure |
| T-D | Read path: missing, foreign and tombstoned portfolio | Identical `RESOURCE_UNAVAILABLE` envelope; no identifiers in any response |
| T-E | Startup: unverified migration; store fault; endpoint-name collision | No endpoint created; process exits non-zero |
| T-F | No network listener: IPD opens no TCP, HTTP or URL server | Verified by test |
| T-G | Writes (3a: refused; 3b: disabled by default) | `WRITE_NOT_AUTHORIZED`; zero row delta on the database |
| T-H | Durability vocabulary: `SESSION_ONLY` / `durable:false` for the session adapter; `DURABLE` only from committed durable reads | Verified by test |
| T-I | Existing `bi07_*` store-port tests | Still pass unchanged |
| T-J | IRR: all 6 route paths (12 route/method pairs) still return 503, and the boundary never calls the port | IRR fence and boundary suites still pass |

**Acceptance (Gate 3 level).** All proposed tests pass in CI for the recorded commits. Typecheck, build and the guarded test run (IPD `ci.yml`) pass. The record shows the test counts, which are not qualification evidence (Gate E W-11; L-IPC-1 §10).

### 6.3 What Gate 3 does not prove

Passing CI tests does **not** establish: restart durability on the host (QE-4); Windows named-pipe ACL and collision behaviour; C5.1 zero bytes on the host (Q9); crash atomicity (QE-7); or revocation behaviour after restart (QE-8). Each is a Gate 4 item.

## 7. Boundaries (kept separate; none implied by another)

| Act | What it means | Status |
|---|---|---|
| **Gate 3 — implementation authority** (this request) | Permission to write the named code and tests on IPD `main` and the named IRR code | **NOT GRANTED. G3-D0 selected a main-line re-authoring basis only; a new authority act must still name exact post-publication main SHA, file set, tests, and scope.** |
| **Implementation** | Code written and merged under the Gate 3 act | **No new main-line implementation has begun or is authorized. The designated Gate B ref contains 15 historically D-4-authorized files, but is superseded as the basis for the intended G3 path and is reference-only; see §11.6.** |
| **Gate 4 — qualification** | Execution of Gate E §4 QE-1 to QE-11 and Gate C Q1–Q4, Q9–Q11 on the Windows deployment host, at recorded digests, with raw output | **NOT EXECUTED** |
| **Result acceptance** | A separate act accepting a Gate 4 result | Not requested |
| **Gate 5 — admission** | A separate act naming qualified commits and lifting the IRR `503` for named operations | **NOT GRANTED** |
| **Production** | Not claimed | **NOT AUTHORIZED** |

## 8. Preserved invariants (unchanged by any answer to this request)

IRR `/api/user-portfolios*` stays at HTTP `503 owner-context-unavailable`. IPD stays `SESSION_ONLY` / `durable: false` on `main`. DP-2 Option 2F stays in force. The off-`main` lineage is not admitted. No authentication, OIDC, RBAC, multi-user, tenant-directory, PostgreSQL or enterprise element is introduced. G-2, D-2, H-18, L-IPC-1 clauses and the DP-1 amendment's non-tenant clauses are not changed.

## 9. Decisions requested from the Program Authority

Respond with one line per item. Each is independent.

```text
I, Ramki, as Program Authority (IPD security-contract authority; for the IRR items also in the IRR capacity), decide:
G3-D0 Relationship to rendered Gate B D-4: RESOLVED — supersede the off-main implementation basis; re-author intended basis on IPD main; preserve the historical D-4 record and reconcile as in the additive decision record. This grants no new implementation authority.
G3-D1 Main-line basis principle: RESOLVED — re-author on IPD main; the separate implementation act must pin the exact then-current main SHA and scope.
G3-D2 through G3-D7 remain decisions required as listed below.
G3-D1 IPD-main basis = IPD main at act time, new authored code only, off-main reference only ........ ACCEPT / CHANGE: ... / DEFER
G3-D2 Storage technology (CV-20 (c)) ........................................ A (better-sqlite3) / B (node:sqlite) / C: ... / DEFER
G3-D3 Write slice ........................................................... 3a (reads and refusal only) / 3b (writes disabled by default) / DEFER
G3-D4 Provisioning code (execution stays a separate Gate A act) ............. INCLUDE CODE / EXCLUDE / DEFER
G3-D5 Off-main 2026-10-07 durable line (CV-20 (a)/R-8(a)) ................... REFERENCE ONLY / OTHER: ... / DEFER
G3-D6 G-2 §3 single-user reading (CV-20 (d)) ................................ CONFIRM / CHANGE: ... / DEFER
G3-D7 IRR scope in §5.1 (C8 remediation, IPC client, contract-version revision) under IRR authority ... ACCEPT / ACCEPT WITH CHANGES: ... / DEFER
This act grants no implementation, qualification, admission, fence-lift or production authority.
```

## 10. Not requested by this document

Gate 4 qualification and its execution; result acceptance; Gate 5 admission; lifting the 503 fence; any durable write; any `durable: true` claim on IPD `main`; execution of Gate A′ or Gate C; any promotion, merge or re-pin of off-`main` code; any production eligibility.

---

*Prepared by Arena Agent Mode as a Gate 3 decision request. It is not an authority act, grants nothing, and has no effect until the Program Authority responds by a separate act. The agent renders no decision and selects no storage technology, basis or slice.*

---

## 11. Post-publication correction (2026-10-18, additive) — existing Gate B grant and an open contradiction

**Why this section exists.** On verification after merge, sections 2, 3, 7 and 9 of this request omitted an existing grant and an existing implementation. This section corrects the record. It does not alter the request's non-grant: **Gate 3 implementation authority is still NOT GRANTED.**

### 11.1 Facts (verified against remote refs and rendered records)

| # | Fact | Verification |
|---|---|---|
| F-1 | IPD Program Authority rendered **Gate B implementation authority D-4 = ACCEPT** on 2026-10-17, at the full prepared scope: **exactly 15 new files, on the designated Gate B ref only** (`refs/heads/gate-b/local-principal-ipc-implementation`, baseline `2ded0e981407b38c73bdea164153f53856aa7217`). No durable portfolio writes, no G24 promotion, no PR merge, no Gate C/D/E authority. | `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_IMPLEMENTATION_AUTHORITY_PA_DECISION_RECORD_RENDERED_2026-10-17.md` on IPD `main` (merged via PR #8, merge `467eb529`). |
| F-2 | D-4 was conditional on a **paired IRR D-4 act**. The IRR D-4 was rendered on 2026-10-17 at an **eight-file, IRR-side** scope; implementation **not begun**; `/api/user-portfolios*` stays HTTP 503; IRR listen host, CORS and `allowedHosts` changes and any IPD code change are excluded absent separate authority. | `docs/integration/IIPS_v3.0_G2_IRR_GATE_B_D4_IMPLEMENTATION_AUTHORITY_PA_DECISION_RENDERED_2026-10-17.md` on IRR `main` (`b1f1ea0`). |
| F-3 | The 15 files were **published** on the designated ref as a non-forced fast-forward: `gate-b/local-principal-ipc-implementation` head = **`cec7080252183a6a5332efe351e61c254d342a2d`** (verified via GitHub refs API). GitHub compare `2ded0e98…` → `cec70802…`: **15 added, 0 modified, 0 deleted**: `src/ipc/{endpoint,entrypoint,errors,framing,index,server}.ts`; `src/user_portfolio/{canonical_identity,errors,index,operations}.ts`; `tests/gate_b_{canonical_identity,ipc_endpoint,ipc_refusals,support,user_portfolio_operations}.test.ts`. | GitHub refs and compare APIs (verified). Completion record: `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_COMPLETION_EVIDENCE_HANDOFF_2026-10-17.md`. |
| F-4 | Source read of the designated-ref files (verified by GitHub contents API at `cec70802`): `src/ipc/server.ts` creates a `net` server for one endpoint and owns no durable state; `src/user_portfolio/operations.ts` states that its operations are read-only owner-scoped and that **no durable write occurs on this path**. `src/ipc/entrypoint.ts` imports `src/persistence/*` and `src/portfolio/durable-store.ts`. **Those modules are not among the 15 added files**, so they are inherited from baseline `2ded0e98` (inferred from the file list; not separately verified file by file). | GitHub contents API (verified for the four files named). |
| F-5 | **IPD `main` still contains none of these files**: no `src/ipc`, no `src/user_portfolio`, no `gate_b` test (verified at `324ae46`). PR #8 added portfolio UI and port files and evidence to `main`; its non-evidence paths are `frontend/src/features/portfolio/*` and `tests/bi07_portfolio_store_port.test.ts`. | `git ls-tree` at `origin/main` and PR #8 file list (verified). |
| F-6 | IRR D-4 names the IPD Gate A derivative ref `2ded0e98…` among the things IRR must not promote, merge, cherry-pick, re-pin or admit. | IRR rendered D-4 §4 item 5 (verified). |
| F-7 | L-IPC-1 rev 2 §14, row **B — Implementation authority**, requires the Gate B act to "state whether an IPD-`main` implementation basis exists or must be created", and its 2026-10-16 dated note says "gate B must still name an IPD-`main` implementation basis, and the off-main G24 lineage remains **not** a base". | `evidence/np04/IIPS_v3.0_G2_IPD_LOCAL_PRINCIPAL_OS_IPC_SECURITY_CONTRACT_PROPOSAL_2026-10-16.md` §14 (verified). |

### 11.2 The contradiction (not resolved here)

- **Position A (the PA's rendered D-4):** Gate B implementation is permitted, and it has been published, on the **designated off-`main` ref** (baseline `2ded0e98`).
- **Position B (L-IPC-1 §14 row B and its dated note):** Gate B must **name an IPD-`main` implementation basis**, and no off-`main` lineage is a base.
- **Position C (this request, sections 2, 3, 7 and 9 as published):** the `main` basis is the proposal, "Implementation: Not begun", and no grant exists. Section 7 is **wrong** on the implementation status and section 9 omitted D-4.

The agent does **not** resolve A against B. Each reading would change what Gate 3 would be. A and B cannot both be applied without a Program Authority act that says which governs.

### 11.3 Effect on the Gate 3 request

- **Gate 3 implementation authority: still NOT GRANTED.** D-4 is an implementation grant on a designated ref. It is not a main-basis grant, not a write-path grant, and not a Gate 3 act in this request's sense. Nothing in this correction grants anything.
- **Nothing on the designated ref may be treated as admitted, promoted, or qualified.** Its existence does not change `main` (`SESSION_ONLY` / `durable: false`), the IRR 503 fence, Gate E W-1, or the non-grants above.
- **The G3-D1 proposal in section 9 is one of several options and must be read with G3-D0.** It assumed no Gate B designated ref existed. That assumption was false.

### 11.4 Decision added — G3-D0

**G3-D0 — Relationship to the rendered Gate B D-4 grant and its designated ref.** The Program Authority is asked to choose one reading:

| Option | Meaning | Consequence |
|---|---|---|
| (i) **Continue on the designated ref** | D-4 remains the implementation basis; any later Gate 3 act names `gate-b/…@cec7080` and the designated ref only. | Conflicts with L-IPC-1 §14 row B's `main`-basis expectation unless the PA amends that clause by separate act. Still needs a main admission act later. |
| (ii) **Re-author on `main`** | The 15-file designated-ref code is reference only. Any implementation is re-authored on `main` under a Gate 3 act (the proposal in §9 G3-D1). | Satisfies L-IPC-1 row B. D-4 is left in place but superseded for implementation. |
| (iii) **Supersede D-4** | The PA withdraws or narrows D-4 by a separate act, then selects (i) or (ii). | Requires a PA act naming D-4 and its record IDs. |
| (iv) **Defer** | No choice now. The designated ref stays as published. No further implementation on it, and no Gate 3 act. | Gate 3 cannot be scoped until a choice is made. |

**Agent recommendation: none.** The choice is the Program Authority's. The agent did not select a basis for IPD-`main` and did not change the designated ref.

### 11.5 Non-grant and fences (unchanged)

No implementation authority is granted by this correction. No ref is moved, created, merged or re-pinned. IRR `/api/user-portfolios*` remains HTTP `503`. IPD `main` remains `SESSION_ONLY` / `durable: false`. No durable write is authorized. No off-`main` ref is admitted or promoted. No qualification, admission, or production claim is made.


---

## 12. G3-D0 disposition (2026-10-18, additive)

The Program Authority selected **re-author the intended implementation basis on IPD `main`**, superseding the off-main Gate B implementation as a basis for the intended G3 path. The historical D-4 decision remains accurately recorded: it accepted exactly 15 files on `refs/heads/gate-b/local-principal-ipc-implementation` from baseline `2ded0e981407b38c73bdea164153f53856aa7217`, and the published ref remains `cec7080252183a6a5332efe351e61c254d342a2d`. G3-D0 does not retroactively erase or misrepresent that grant; it means that the off-main code cannot be used as the admitted base or continued as the intended implementation path. Further work on that ref would require separate authority.

IPD `origin/main` was independently verified at `f678363de5db1486aa6c52be79e4d290380fdd27` before these documentation changes. The next implementation-authority act must identify the exact post-documentation-merge `main` SHA, bounded file set, tests, restrictions, and prerequisites. G3-D0 and the main-basis selection do **not** authorize implementation. No durable-write, qualification, admission, route, fence-lift, or production authority is granted. The IPD `SESSION_ONLY` / `durable: false` and IRR HTTP 503 fences remain.

Authoritative record: `evidence/cross-repository/IIPS_V3_G3_D0_DISPOSITION_2026-10-18.md`. This resolution does not amend the IRR-side D-4 record or authorize IRR work.

> **Additive clarification to §3 after G3-D0 (2026-10-18).** The Program Authority selected the main-line re-authoring principle, not a particular implementation scope or immutable commit. The proposed areas and tests in this request remain proposals until the separate authority act specifies the exact file set, tests, prerequisites and exact post-publication IPD `main` SHA.
