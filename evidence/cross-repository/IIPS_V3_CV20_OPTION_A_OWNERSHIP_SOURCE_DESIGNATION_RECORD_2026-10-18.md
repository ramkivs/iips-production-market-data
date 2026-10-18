# IIPS v3.0 — CV-20 Option A: Non-Authentication Portfolio Ownership Source Designation Record

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-CV20-OPTION-A-OWNERSHIP-SOURCE-DESIGNATION-2026-10-18-01` |
| **Tracker item** | `CV-20`: User Portfolios, specifically the **non-authentication ownership source** element (IRR master tracker §16.4 `CV-20` "genuinely reserved to the PA", item **(b)**) |
| **Responds to** | `IIPS-V3-CV20-PA-DECISION-REQUEST-2026-10-18-01`: `evidence/cross-repository/IIPS_V3_CV20_PROGRAM_AUTHORITY_DECISION_REQUEST_2026-10-18.md` (IPD `main@2d12413`, blob `4067f49b9321c4763ef96b6f9001ee2c0f0f0dc1`) |
| **Authority disposition** | **OPTION A — DESIGNATE**, selected by the **Program Authority** (Ramki; Single-User Application Product Owner and Governance Authority for IIPS v3.0 across IPD and IRR) |
| **Decision channel** | The Program Authority's selection was relayed in the operating session on 2026-10-18 and is recorded here by the recording agent. The PA instruction (verbatim excerpt): *"The Program Authority has selected Option A. This is the authority disposition to execute … Inspect the same-host IPC binding described by the existing L-IPC-1/DP-1 evidence as the leading candidate … If the evidence supports the candidate and all required designation semantics can be stated precisely, publish the CV-20 Option A decision record."* |
| **Basis of source identification** | The PA selected the disposition and named the candidate. The recording agent checked the candidate against the PA's stated condition using authoritative records (§3–§5). The condition is **met**: every required designation semantic is stated below from accepted records, and the residual limitations are listed in §7. The agent renders **no** authority of its own. |
| **Date** | 2026-10-18 (UTC) |
| **Deployment scope** | One operator, one personal laptop, one OS account, **non-production** (`L-IPC-1` rev 2 acceptance scope; H-18) |
| **IPD baseline (verified)** | `refs/heads/main` = `2d12413446c29c08f6f357b8ac67e34594f30286` (PR #13 merge; tree `75e298fc844188aa9ea2a0914824131df8f06280`; CI run `39133488770` `success`) |
| **IRR baseline (verified)** | `refs/heads/main` = `d32c8122f0ba3cee7f1549c7279d1d53c45cb1d9` (PR #133 merge; tree `10586afbcc7c56f2758d7ac867415ecdd81a267d`; CI run `39132694569` `success`) |
| **Resulting CV-20(b) status** | **DESIGNATED: OPTION A RECORDED.** This resolves Gate 1 of the five-gate chain only. |
| **Fences** | **UNCHANGED.** IRR `/api/user-portfolios*` stays at HTTP `503 owner-context-unavailable`. IPD `main` stays `SESSION_ONLY` / `durable: false`. DP-2 Option 2F stays in force. |
| **Production status** | `NON_PRODUCTION`; production is **NOT AUTHORIZED** |

> **Dated note (2026-10-18, later the same day; additive) — Gate 2 dispositions recorded.** The Program Authority approved G2-D1 to G2-D5 in full on 2026-10-18 (decision request `IIPS-V3-G2-GATE2-ACCEPTANCE-AUTHORITY-REQUEST-2026-10-18-01` §6). Effects on this record, without changing the designation itself: (i) **D-3 (tenant hint)** is resolved under G2-D4 as recorded in decision request §6.3. The IRR-side wording clarification is recorded in IRR (DP-1 amendment addendum, PKG-02A addendum, tracker §16.51), and the IPD-side clarification in L-IPC-1 by dated note. (ii) **R-5 (Q8 meaning)** is resolved as option (b): stop and restart both IRR and IPD processes (G2-D3). (iii) **R-6** default disposition is resolved by G2-D5: data under a revoked binding is retained and inaccessible, is not transferred automatically or silently deleted, and requires an explicit governed action. A future re-association mechanism, if ever wanted, remains a separate act. (iv) **R-4** IRR-side items are recorded in IRR; the IRR DP-1 §4 restatement is recorded there. (v) **D-8** (contract §5.1 key count, 26 → 29) is applied in the contract. **D-9** is unchanged. (vi) **Gate 1** is unchanged. **Gate 2** is satisfied for contract v1.0.0 and Gate E rev 1 only. The Gate 3 authority request is prepared (`IIPS_V3_G3_IMPLEMENTATION_AUTHORITY_REQUEST_2026-10-18.md`) and **NOT GRANTED**. Gates 4 and 5, the fences and production status are unchanged.
>
> **Non-authorization statement.** This record designates an ownership **source** (a policy fact). It does **not** authorize implementation, provisioning beyond the already-rendered Gate A′ act, qualification, result acceptance, route admission, removal of the HTTP `503` fence, durable writes, promotion or admission of any off-`main` lineage, release readiness, or production use. It introduces no login, OIDC, authentication, RBAC, multi-user, tenant-directory or enterprise architecture, and it does not revive the retired `P-4 → P-6 → P-8` OIDC path (`CV-50`, terminal).

---

## 1. The designation

> **CV-20 Option A designation.** For the IIPS v3.0 single-user, single-personal-laptop, non-production application, the **sole non-authentication ownership source for user portfolios** is:
>
> **the single `ACTIVE` provisioned local-principal binding (A-2 `local_principal_bindings` row) held in the IPD-owned portfolio store, as consumed exclusively by the IPD-owned, single-principal, same-host IPC endpoint under `L-IPC-1` revision 2 (accepted text blob `cab04b6f94618c9afad1440882ebf63437fdf6f8`) and the IRR DP-1 amendment (blob `c71661a1ee445b2348cedfedae4aef6449029ebb`).**
>
> Portfolio ownership scope is the pair `(applicationUserId, tenantId)` read from that binding, and from nothing else, **at the time of each request**. Owner-scoped operations are authorized against the existing `(applicationUserId, tenantId, portfolioId)` triple.

**Repository that owns the authoritative binding record:** **IPD** (`ramkivs/iips-production-market-data`). The binding row, its tenant membership, the A-3 audit lines, and the endpoint that consumes them are all IPD-owned. IRR owns **no** identity, binding, membership or tenant state.

**Label to carry downstream (verbatim, per DP-1 amendment §4):** `non-production, single-principal, same-host IPC`.

---

## 2. Phase 1: Verified baseline and baseline discrepancy

### 2.1 Remote refs (fetched in this pass)

| Repository | Ref | Commit | First parent | Second parent (PR head) | CI on `main` |
|---|---|---|---|---|---|
| IPD | `refs/heads/main` | `2d12413446c29c08f6f357b8ac67e34594f30286` | `adb5d9899206bc71825ecc1919e56d6d3a3ed0f5` (PR #12) | `57ea823427c5714c31b7272d61bc284d91232715` (PR #13) | run `39133488770`: `completed/success` |
| IRR | `refs/heads/main` | `d32c8122f0ba3cee7f1549c7279d1d53c45cb1d9` | `e9bb64c2e5aa5c888b689f6e40fc5ae3875ccab6` (PR #132) | `be1bd01d076c8fc895cf33381a6fbf76a6537da4` (PR #133) | run `39132694569`: `completed/success` |

Open PRs at the start of this pass: IPD **none**; IRR **#114** only (broker preview, unrelated to portfolio ownership). No existing branch or PR carries a CV-20 designation, consumer contract, or Gate E write policy, so the artifacts in this pass do not duplicate anything.

### 2.2 Baseline discrepancy: `e9bb64c…` versus `d32c812…` (RESOLVED)

| Fact | Evidence |
|---|---|
| The IPD CV-20 decision request (PR #13) recorded IRR `main` = `e9bb64c2…` (PR #132 merge). | Request header, "IRR Authoritative `main` Baseline Inspected" |
| IRR PR #133 merged at **2026-10-18T13:42:02Z** as `d32c8122…`, with first parent `e9bb64c2…`. | `gh pr view 133`; `git show d32c812` |
| IPD PR #13 merged at **2026-10-18T13:51:59Z**, about ten minutes **after** IRR PR #133. | `gh pr list` |
| IRR PR #133 changed **7 Markdown files only** (tracker, packet index, PKG-02/03/04, PKG-01/09 records). It made **no** change under `frontend/` or `src/`. | `git diff --stat e9bb64c d32c812 -- frontend src` → empty |
| All six portfolio fence and boundary blobs are byte-identical at `e9bb64c` and `d32c812`: `user-portfolio-transport.ts` `51704c12…`, `owner-context-unavailable.ts` `cb8db45d…`, `userPortfolioPort.ts` `ba0001e8…`, `userPortfolioBoundary.ts` `b8024c6b…`, `translationBoundary.ts` `93f602fd…`, `executive-transport.ts` `d1c52fe6…`. | `git rev-parse <commit>:<path>` in this pass |

**Resolution.** Both SHAs were correct when observed. `e9bb64c…` was IRR `main` when the PR #13 request was **inspected**. It went stale before PR #13 **merged**, because IRR PR #133 merged in between. **The authoritative IRR `main` for this pass is `d32c8122f0ba3cee7f1549c7279d1d53c45cb1d9`.** The change was documentation-only, so every IRR fence fact in the decision request still holds at `d32c812`. A similar pre-existing staleness also exists in the other direction: IRR tracker §16.49.4 records IPD `main` = `9130c259…`, while IPD `main` is now `2d12413…`, and the intervening IPD PRs #12/#13 are evidence-only.

### 2.3 Authoritative versions relied upon

| Authority | Repository / path | Blob at verified `main` | Status relied upon |
|---|---|---|---|
| CV-20 decision request | IPD `evidence/cross-repository/IIPS_V3_CV20_PROGRAM_AUTHORITY_DECISION_REQUEST_2026-10-18.md` | `4067f49b9321c4763ef96b6f9001ee2c0f0f0dc1` | Published request (Options A/B/C) |
| **G-2** durable user-portfolio architecture | IRR `docs/integration/IIPS_v3.0_G2_DURABLE_USER_PORTFOLIO_ARCHITECTURAL_DECISION.md` | `7e83946b470bcc6f4751fb1a67e832ac66128c5c` | ACCEPTED 2026-09-30. IPD owns the domain and the durable boundary; 13 §3 requirements |
| G-2 implementation record | IRR `docs/integration/IIPS_v3.0_G2_DURABLE_USER_PORTFOLIO_IMPLEMENTATION_RECORD.md` | `8486a5708c6a3f616718a6021afa13508a4227ef` | §8 deferrals, including retention posture "indefinite preservation; no automatic purge" |
| **H-18** single-user scope | IRR `docs/integration/IIPS_v3.0_H18_PRODUCT_SCOPE_SINGLE_USER_PERSONAL_USE.md` | `a13f7a3469268c329d1e676ee85c44906e98d61c` | Operative per `GC-P2-SCOPE-CORR-01` (§15.19); the banner discrepancy is noted in §8 |
| Global NO-AUTH | IRR `docs/integration/IIPS_v3.0_GLOBAL_NO_AUTH_PROGRAM_AUTHORITY_DECISION.md` | `595633e0ba0b1d8ad4a8369abb7c41c132fefeed` | Regime treated as operative by the tracker (PRs #60–#70); the banner discrepancy is noted in §8 |
| **D-2** identity/tenant domain scope (§8) | IRR `docs/integration/IDENTITY-TENANT-DOMAIN-SCOPE-DECISION.md` | `ec80ef89aba3deb2ef1c7ae26afb52e9b8085ee9` | §8 translation boundary rule (15 elements) |
| DP-1 Option 1A′ (incl. §4 15-element contract) | IRR `docs/integration/IIPS_v3.0_GATE_C_S5A_DP1_OPTION_1A_PRIME_BINDING_CONTRACT_AND_PREREQUISITE_SPECIFICATION_2026-10-13.md` | `c3a5596af0469f2f4316ffe9b0da522fefeba96b` | Historical; §4 is **not** amended by the DP-1 amendment (see §5) |
| **DP-1 amendment** | IRR `docs/integration/IIPS_v3.0_G2_IRR_DP1_IDENTITY_CREDENTIAL_TRUST_AMENDMENT_2026-10-16.md` | `c71661a1ee445b2348cedfedae4aef6449029ebb` | AMENDED FOR ONE DEPLOYMENT: contract position only |
| **L-IPC-1 rev 2** (accepted text) | IPD `evidence/np04/IIPS_v3.0_G2_IPD_LOCAL_PRINCIPAL_OS_IPC_SECURITY_CONTRACT_PROPOSAL_2026-10-16.md` | accepted blob `cab04b6f94618c9afad1440882ebf63437fdf6f8` (present in the object store); current file blob `d4aaf4caef4a42a0fbfa74567b486df2a9a38359` = accepted text plus dated notes | ACCEPTED WITH CHANGES |
| L-IPC-1 acceptance decision | IPD `evidence/np04/IIPS_v3.0_G2_IPD_SECURITY_CONTRACT_ACCEPTANCE_DECISION_2026-10-16.md` | `f708630436358097c11c167d3d8ab1a6c8a54095` | A-1 amended; A-2/A-3 accepted |
| Gate A rendered decision | IPD `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PA_DECISION_RECORD_RENDERED_2026-10-16.md` | `08df3b9eb98264e50464f848a96104883f3c624b` | Identifier rules, one-way revocation, local-only A-3 |
| Gate A′ rendered decision | IPD `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PRIME_PA_DECISION_RENDERED_2026-10-17.md` | `c04f8a304acaffe49f92a5aac2ce2242673e9a51` | APPROVED, rule P-1, **NOT EXECUTED** |
| Gate B (IPD) rendered decision | IPD `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_IMPLEMENTATION_AUTHORITY_PA_DECISION_RECORD_RENDERED_2026-10-17.md` | `ee6122e82581c9b1496a4b7413933c499db71446` | Read-only off-`main` implementation only |
| Gate C rendered decision | IPD `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_QUALIFICATION_AUTHORITY_DECISION_RENDERED_2026-10-17.md` | `9befe6d888f6205d8d3df6ed3d873b0c71ee6336` | 7-item read-only subset; Q5–Q8 DEFERRED; Q8 meaning unresolved (D-GC-G) |
| **CV-50** closed OIDC path | IRR tracker §16.4.4 row `CV-50`; `docs/integration/IIPS_v3.0_GATE_C_P2_SCOPE_CORRECTION_AND_F5R_DISPOSITION_2026-10-14.md` | tracker `d6d5617ff12a42b2b73229e7d690360c34bb8be9`; scope correction `516c3159d27af3d7f19b3105687e0086dfff8861` | Terminal: "nothing downstream of it may be sequenced" |
| IRR master tracker | IRR `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` | `d6d5617ff12a42b2b73229e7d690360c34bb8be9` | CV-20 `DECISION REQUIRED` at `d32c812` |
| IPD portfolio port / store | IPD `frontend/src/features/portfolio/portfolioStorePort.ts`, `portfolio-store.ts` | `d61f18dfdce12a7f0c4377a3c6d410026d454089`, `3bf852b99e300a8dfa71d3b1b04ed0f7b947b4a5` | `SESSION_ONLY` / `durable: false` |
| IRR portfolio route / fence / boundary | IRR `frontend/server/user-portfolio-transport.ts`, `owner-context-unavailable.ts`, `user-portfolio/*.ts` | `51704c12…`, `cb8db45d…`, `ba0001e8…`, `b8024c6b…`, `93f602fd…`; contract `0dec72eb750206603196c67f6b27947420d7e6ac` | HTTP `503` on all six route/method pairs |

**Off-`main` corroborating evidence (source inspection only; not admitted, not qualified):** IPD Gate A `2ded0e981407b38c73bdea164153f53856aa7217`; IPD Gate B `cec7080252183a6a5332efe351e61c254d342a2d` (`src/ipc/entrypoint.ts` `02a692d6…`, `server.ts` `828fa8ed…`, `framing.ts` `d0f4d92d…`, `errors.ts` `ded86fcf…`); IRR Gate B D12 `110e221fe7ca335c4571adb93d6c629c061f84e0` (`ownerContextFromBinding.ts` `172f1c71…`, `ipcClient.ts` `e4050517…`).

---

## 3. Qualification of the candidate: why it is a qualifying non-authentication source

| Test (from the CV-20 request §3.3 Option A) | Finding | Evidence |
|---|---|---|
| Non-authentication: no login, credential, OIDC, RBAC, multi-user, tenant directory | **Met.** The credential position is "Accepted on the IPD-owned, single-principal, same-host IPC endpoint". The binding is a provisioned **transport fact**, deliberately **not** stored in `external_identity_mappings` so that it cannot be conflated with an external identity claim. No user presents anything. | L-IPC-1 §2.4, §6.3 A-2; acceptance §2 |
| Server/host-controlled, not caller-controlled | **Met.** The row is created only by a one-time, local, offline operator act (Gate A/A′), never at request time and never through IRR. | L-IPC-1 C10; Gate A Decision 6; Gate A′ |
| Accepted by authority in **both** repositories | **Met.** IPD acceptance `IIPS-V3-G2-IPD-SECURITY-CONTRACT-ACCEPTANCE-DECISION-2026-10-16-01`; IRR DP-1 amendment `IIPS-V3-G2-IRR-DP1-IDENTITY-CREDENTIAL-TRUST-AMENDMENT-2026-10-16-01` (on IRR `main`) | §2.3 |
| Consistent with G-2 (IPD owns the domain; extend, don't duplicate) | **Met.** Source, store and endpoint are IPD-owned; IRR consumes only. | G-2 §1–§2; L-IPC-1 C11 |
| Independent of the retired OIDC path (CV-50) | **Met.** No issuer, JWKS, bearer, `(issuer, subject)` mapping or `P-4/P-6/P-8` step participates. | CV-50; L-IPC-1 §6.4 ("`OidcVerifier` … not on this path") |
| Not the F-3 carrier | **Met.** The `(owner-7f3a91c2, irr-domain-4b82d6e1)` carrier stays restricted to NP-09/10/11 and is refused as a principal (L-IPC-1 §4.1, §11 A5). | Owner-context PA decision §4.4, §7.4–§7.5 |

The alternatives were already assessed and rejected under L-IPC-1 §11: loopback TCP, shared secrets, OIDC, in-process import, F-3 reuse, forwarded headers, separate service account, native addon, and file-drop. No other accepted non-authentication source exists in either repository.

---

## 4. Required designation semantics

### 4.1 Exact source and its authority

| Element | Designated value |
|---|---|
| Source record | Exactly **one** row in `local_principal_bindings(endpoint_id, application_user_id → application_users, tenant_id, state ∈ {ACTIVE, REVOKED}, created_at, updated_at, revoked_at)` with `state = 'ACTIVE'` (A-2) |
| Paired tenancy | Exactly **one** `ACTIVE` `tenant_memberships` row for that `application_user_id` and `tenant_id`. `resolveTenant()` and the exactly-one-`ACTIVE` rule are unchanged (L-IPC-1 §6.2 T1). |
| Identifier forms | `applicationUserId`: opaque random UUID (existing semantics). `tenant_id`: `t-` + lowercase UUIDv4. `endpoint_id`: `ep-` + lowercase UUIDv4. Each is generated **once** at provisioning, **immutable**, and never derived from a host, account, user, issuer, subject or other identifier (Gate A Decision 3). |
| Consumer | Only the IPD-owned same-host IPC endpoint (C1–C3). No TCP/HTTP/URL surface serves owner-scoped operations (C1). |
| Authority chain | L-IPC-1 rev 2 acceptance (IPD) → DP-1 amendment (IRR) → Gate A (rendered) / Gate A′ (rendered, rule P-1) for provisioning → **this record** for ownership-source designation |
| Owning repository | **IPD** |

### 4.2 Trust boundary and why it is trusted

- **Boundary:** two ordinary local processes on one laptop under one OS account, the IRR server process and the IPD portfolio process, joined by an IPD-owned same-host endpoint. On the Windows deployment host this is a named pipe; on POSIX dev/CI it is a UNIX socket with owner-only modes set and verified. The browser carries **no** authority and cannot open the endpoint (L-IPC-1 §3.1, §5.3).
- **Why trusted:** the operator's OS account and host OS are trusted (L-IPC-1 §8.1). On Windows, write access to the pipe is limited by the platform's **default** named-pipe DACL (creator owner, Administrators, LocalSystem) and host configuration. The application **cannot** narrow it (F2/F6). The guarantee is limited to: *requests arriving on this endpoint act as the single provisioned principal*, plus C5/C6/C7 (L-IPC-1 §4.4; acceptance §4.3).
- **Outside the boundary (disclosed, accepted, not mitigated):** any process running as the operator's own account, including malware; Administrators and LocalSystem; a compromised OS; anything on a LAN, hosted preview, shared host or remote browser (C8). No peer process identity is claimed.

### 4.3 How the single-user context is bound to portfolio operations

1. IPD starts in the fixed order `validate → connect → migrate → verify → bind` and creates the endpoint only after all four succeed (C2/C5.3).
2. For **each request**, after the frame validates and caller-supplied authority is refused, IPD resolves the single `ACTIVE` binding **from the store** and derives `{applicationUserId, tenantId}` (C3, C5.2, C5.5). The off-`main` Gate B source corroborates this: `IpcServer` calls `resolvePrincipal()` per request, and that function performs a fresh `LocalPrincipalService.resolveActiveBinding()` store read with no cache, one request per connection.
3. Every owner-scoped operation is then authorized against `(applicationUserId, tenantId, portfolioId)`, and unauthorized is treated as missing (C6; DP-1 amendment §6(5)).
4. IRR supplies **no** principal, owner, tenant, membership or scope on the wire. Its server-owned configuration (`IIPS_G2_IPC_ENDPOINT`, `IIPS_G2_IPC_TENANT_HINT`) only tells IRR *where* the endpoint is and whether a binding has been provisioned for it. The endpoint name is **not** a credential (L-IPC-1 §4.1). The tenant hint is never transmitted and is never authority (see §5, element 8, and discrepancy D-3).

### 4.4 Lifecycle: creation and retention

| Phase | Semantics | Basis |
|---|---|---|
| Creation | One-time, local, offline operator act on the deployment host. It applies migrations `001`–`003` and creates exactly one `application_users` row, one `ACTIVE` membership, one `ACTIVE` binding, and their two A-3 audit rows in one `immediateTransaction`, with a pre-run backup and backup-restore on failure. | Gate A Decisions 6/8; Gate A′ §1 |
| Current state | **No binding exists on the Windows deployment host.** Gate A ran in an ephemeral Linux sandbox. Gate A′ (Windows, rule P-1) is **APPROVED and NOT EXECUTED**. | Gate A execution record; Gate A′ |
| Validation per call | Per request, from the store; no in-memory identity cache; no session or connection reuse of identity | C5.2/C5.5; §4.3 |
| Retention of the binding | The row persists in the durable store across restarts. A revoked row is **retained** with `state = 'REVOKED'` and `revoked_at` set, and is never deleted or reactivated. Lifecycle mutations are audited in the local A-3 line in the same transaction. | A-2; Gate A Decisions 4/5 |
| Retention of portfolio data | **Indefinite preservation; no automatic purge.** No purge or retention-policy authority exists. | G-2 implementation record §8 item 3; G-2 §3 lifecycle requirement remains to be met by Gate E/qualification |

### 4.5 Immediate reset and revocation

- **Revocation** is explicit, transactional, operator-only, local and **one-way**: there is no `REVOKED → ACTIVE` restoration (Gate A Decision 4). Binding and/or membership revocation is audited in the same transaction (A-3).
- **Effect is immediate per request.** The binding is re-read from the store on every request, so any request whose binding resolution starts after the revocation transaction commits is refused (`BINDING_ABSENT`/`BINDING_INVALID`, zero bytes on the wire). An in-flight request whose resolution completed before the commit may finish. For writes, Gate E policy rule W-3 requires binding re-validation **inside** the mutating transaction, which closes that window for mutations.
- **Reset or rotation** of the ownership source means revocation followed by a **new, separately authorized provisioning act** (Gate A Decision 4: "Re-provisioning after revocation requires a new explicit act"). The current tooling refuses re-binding by reuse (`LOCAL_PRINCIPAL_BINDING_CONFLICT`) and re-provisioning over a revoked membership (`LOCAL_PRINCIPAL_MEMBERSHIP_CONFLICT`) (Gate A execution record §7).
- **Portfolio data under a revoked binding** is **retained and inaccessible**. No archive, purge or re-association is authorized. Whether a future re-provisioning act may re-associate prior `(applicationUserId, tenantId)` data is **not determined** (residual R-6).
- Portfolio-level `RESET`/`DELETE` are **write operations** governed by Gate E (W-10 mutation semantics; W-16 retention), not lifecycle events of the ownership source.

### 4.6 Restart and loss of the binding

| Condition | Behaviour |
|---|---|
| Normal restart of IPD | The binding persists in the store. IPD re-runs `validate → connect → migrate → verify → bind`. Each request re-resolves the binding. A binding revoked before the restart stays revoked (Q8 clause "revoked binding fails closed after restart"; qualification still outstanding). |
| Store missing, unreadable, or migrations unverified at startup | Endpoint **not created**; no fallback (C2, C5.3, T-11) |
| Endpoint name already taken (squatting or stale) | Bind fails (`FILE_FLAG_FIRST_PIPE_INSTANCE` → `EADDRINUSE`); startup fails closed; no retry loop or TCP fallback (C5.3, F7, T-5) |
| IPD process exits while IRR runs | IRR's connect fails (absent, refused, reset or timeout). IRR treats this as owner context unavailable and fails closed; it never falls back to a session-only store, a default owner, or another surface. |
| IRR restart | IRR holds no identity state and re-reads its server-owned configuration per call. Nothing to restore. |

### 4.7 Fail-closed behaviour

Each of the following yields **no read, no write, no owner disclosure, and no inferred owner**:

| Class | IPD side | IRR side (now, and after any future admission) |
|---|---|---|
| **Absent**: no binding row, zero `ACTIVE`, IRR configuration missing | Refuse before dispatch; zero bytes (C5.1/C5.5/C6) | Now: HTTP `503 owner-context-unavailable` (fence). After admission: the same `503` |
| **Invalid**: malformed row, blank field, state not `ACTIVE`, malformed configuration | Refuse; zero bytes | `503 owner-context-unavailable` |
| **Ambiguous**: more than one `ACTIVE` binding or membership | Refuse, **never guess** (C3; `resolveTenant`) | `503 owner-context-unavailable` |
| **Stale**: revoked binding, rotated endpoint, IRR configuration pointing to a dead endpoint | Refused per request (no cache) | Connection failure → `503` |
| **Unavailable**: store fault, IPD down, timeout | Endpoint absent or refused | `503`; no `SESSION_ONLY` fallback while claiming durability |

### 4.8 Why caller-supplied values cannot establish ownership

- **Contract:** C3 ("IPD never accepts a principal, owner, tenant, or portfolio-scope value from the wire") and C7 (such values are **refused, not ignored**, and IPD re-enforces this independently of IRR).
- **Transport:** headers, cookies, query parameters and bodies exist only on IRR's HTTP surface. They never cross the IPC boundary as authority, and IRR's client refuses forbidden keys before encoding. The IRR route **today** never parses the body or inspects headers, cookies or query for identity (fence `51704c12…`).
- **Existing guards on `main`:** IPD `findCallerSuppliedIdentityKeys` / `CALLER_SUPPLIED_IDENTITY_KEYS` (29 keys at blob `d61f18df…`; corrected 2026-10-18 from "26", see D-8) refuse with `INVALID_REQUEST`. IRR `assertNoG2CallerAuthority` / `classifyG2Claims` and `FORBIDDEN_CALLER_FIELDS` refuse caller authority keys.
- **Not authentication:** browser `Origin`/`Host`/`Referer`/CORS, the endpoint name, the H-18 scope label, and C9 first-party signals are access-control or CSRF conveniences. C9 must **never** be recorded as authentication.

### 4.9 Host-level assumptions and evidence gaps (unproven)

| Item | State |
|---|---|
| Effective Windows pipe ACL/SDDL; cross-account isolation; remote isolation; collision and re-bind fail-closed | **Technically unverified.** V-1/V-4/second-account/remote tests are **NOT REQUIRED — PA-WAIVED**; waivers are not proof. V-E items remain. |
| Host preconditions (one interactive user; inbound SMB/file sharing off; browser surface loopback-bound under C8) | Operator-verifiable; **not recorded** (L-IPC-1 U-2) |
| C5.1/Q9 zero bytes before a valid authorized request | **Mandatory** qualification item; **not executed** on the host |
| IRR loopback posture (C8) | **Not met by current IRR code:** IRR listens on all interfaces with `Access-Control-Allow-Origin: *` (L-IPC-1 C8 [V]). Must be addressed in IRR's own implementation scope before any admission. |

---

## 5. D-2 §8: ownership-scope mapping across IPD and IRR

**Rule.** D-2 §8 forbids **assuming** that any IRR identifier equals an IPD `applicationUserId`/`tenantId` without a governed translation contract. Under this designation **no IRR identifier is equated with, translated to, or transmitted as an IPD identifier.** IRR contributes **no** source identifier. The owner scope is created and resolved entirely inside IPD. D-2 §8 is satisfied by **non-equivalence** rather than by a mapping table. For completeness and auditability, the fifteen elements are stated for the IPC position:

| # | D-2 §8 element | Value under the CV-20 Option A designation |
|---|---|---|
| 1 | Source authority | The IPD-owned provisioned binding (A-2) created by the Gate A/A′ operator act. **Not** an OIDC issuer; **not** IRR; **not** the F-3 carrier. |
| 2 | Target authority | IPD portfolio domain authorization: `resolveTenant` + the `(applicationUserId, tenantId, portfolioId)` triple. Unchanged and exclusive. |
| 3 | Source identifier | `endpoint_id` (`ep-` + UUIDv4) as the binding key. It is a transport fact, never a wire field, and never presented by IRR. |
| 4 | Target identifier | `application_user_id` (opaque UUID) and `tenant_id` (`t-` + UUIDv4), both carried in the same IPD row. IRR stores neither as authority. |
| 5 | Mapping lifecycle | Binding `ACTIVE → REVOKED`, one-way. Live only while `ACTIVE`. No implicit, bulk, scheduled, request-time or migration-driven transition. |
| 6 | Provisioning authority | Operator-only, offline, under the Gate A/A′ acts; never via IRR or at request time |
| 7 | Revocation authority | Operator-only, offline, transactional, one-way (Gate A Decision 4); not delegable to IRR, a caller, a request or a timer |
| 8 | Tenant boundary | Exactly one tenant and exactly one `ACTIVE` membership. Zero → refused; more than one `ACTIVE` → refused, never guessed. **The binding's membership is the sole tenant source** (L-IPC-1 §6.4). IRR's `IIPS_G2_IPC_TENANT_HINT` is IRR-local configuration only and is **never transmitted** (see D-3). |
| 9 | Ownership boundary | Ownership is re-derived by IPD from the binding on every request. Caller or browser ownership is never trusted. |
| 10 | Authorization boundary | Identity → tenant → portfolio, every check mandatory and fail-closed; unauthorized ≡ missing; no IRR flag, header or configuration can skip a step |
| 11 | Audit requirements | Local A-3 audit line for binding and membership lifecycle mutations, in the same transaction. No cross-system audit destination. IRR persists no identity state. |
| 12 | Failure behaviour | §4.7 |
| 13 | Security / trust model | §4.2. Same-host IPC, single principal, default DACL plus host configuration. Excluded: forwarded principal, browser trust, caller identity, static/service credentials, OIDC, token exchange, mTLS-as-substitute, operator bypass. |
| 14 | Durable storage | IPD-owned portfolio store. L-IPC-1 C11 names the G24 store as "the only portfolio store", but G24 remains off-`main` and unadmitted, and **storage technology on an IPD-`main` basis is not chosen** (CV-20 residual (c)). |
| 15 | Package / API contract | IPC wire protocol `v = 1`, specified by the proposed consumer contract `IIPS-V3-G2-IPD-IRR-PORTFOLIO-CONSUMER-CONTRACT` v1.0.0 (Gate 2; **not yet accepted**). No HTTP `/api/ipd/*` surface and no IRR package pin for this capability. |

**Relationship to DP-1 §4.** The DP-1 record's §4 rows 1, 3, 5, 7, 11, 13 and 15 carry **OIDC/HTTP-position values**: issuer/subject, `retireMapping`, `mapping_audit_events`, the RS256 bearer, and HTTP `/api/ipd/portfolios`. The DP-1 amendment explicitly left §4 un-amended. The table above states the IPC-position values that follow from the amended credential position. Formal IRR-side recording of this restatement is an **IRR-side reconciliation act** (residual R-4). It changes no authority already granted and does not block this designation, because no cross-domain equivalence is created.

---

## 6. Effect on downstream gates

| Gate | Effect of this record |
|---|---|
| Gate 1: CV-20 ownership source | **Resolved (Option A designated)** |
| Gate 2: consumer contract + Gate E write policy | **Unlocked for preparation and PA review.** Drafts were published in this pass as **PROPOSED** (see §9). Acceptance requires a separate PA act. |
| Gate 3: implementation authority (CV-39) | **Not granted** |
| Gate 4: qualification and result acceptance (Gate A′, Gate C, Q5–Q8, CV-24/CV-38) | **Not granted / not executed** |
| Gate 5: route admission and fence lift (CV-52, Gate D) | **Not granted.** The `503` fence remains. |
| Production | **NOT AUTHORIZED** |

---

## 7. Residual limitations and unresolved properties (none blocks the designation)

| ID | Residual | Owner | Needed before |
|---|---|---|---|
| R-1 | Windows endpoint ACL, cross-account and remote isolation, and lifecycle fail-closed behaviour: PA-waived at V-P and technically unverified; V-E items remain | PA (scope); operator (V-E execution) | Gate 4 |
| R-2 | **No live binding exists on the deployment host.** Gate A′ is APPROVED, NOT EXECUTED. | Operator (Windows host) | Gate C / Gate 4 |
| R-3 | Realization basis: migration `003`, `LocalPrincipalService` and the endpoint exist only off-`main` (`2ded0e98`, `cec70802`). IPD `main` has no `src/persistence`, `src/app_identity`, `src/ipc` or `src/server`. Gate 3 must name an IPD-`main` basis; the G24 lineage is not a base. | PA | Gate 3 |
| R-4 | IRR-side reconciliation: (i) DP-1 amendment §3 (amended-clause row "§6.4") wording "the hint remains a hint, **validated by IPD**" (D-3); (ii) DP-1 §4 OIDC-position rows (§5) | PA in IRR capacity; IRR session | Gate 3 (IRR adapter) |
| R-5 | Q8 meaning ("stop both processes") is unresolved and must be decided by the Authority (D-GC-G) | PA | Q8 authority (Gate 4) |
| R-6 | Disposition of data under a revoked binding when re-provisioning occurs (re-associate vs. new principal); purge policy deferred | PA | Any re-provisioning act; Gate E W-16; Gate 2 request G2-D5 |
| R-7 | Host preconditions (U-2) and IRR C8 loopback/CORS posture | Operator (host); IRR implementation scope | Gate 4 / Gate 5 |
| R-8 | CV-20 residual items **(a)** re-qualification of the unadmitted 2026-10-07 durable line (OIDC-era `470cc698`/`6828155e`, barred under D-1/CV-50), **(c)** storage technology within IPD ownership, **(d)** G-2 §3 single-user reading beyond owner identity and isolation | PA | Gate 3 / Gate 4 |

---

## 8. Discrepancies identified in this pass

| # | Discrepancy | Resolution |
|---|---|---|
| D-1 | IRR `main` recorded as `e9bb64c…` in IPD PR #13; actual `main` is `d32c812…` | Resolved in §2.2 (timing; docs-only delta; fence blobs identical) |
| D-2 | IRR tracker §16.49.4 records IPD `main` = `9130c259…`; actual is `2d12413…` | Stale by IPD PRs #12/#13 (evidence-only). Recorded; IRR-side tracker update deferred to an IRR session (§10). |
| D-3 | **Tenant hint.** DP-1 amendment §3, amended-clause row "§6.4", says the hint is "validated by IPD". L-IPC-1 §6.4 says "Caller tenant hint is unnecessary on this path: the binding's membership is the sole tenant source"; C7 requires IPD to **refuse** tenant claims; the IRR D12 client lists `tenantHint`/`tenantId` in `IPC_FORBIDDEN_WIRE_KEYS` and never transmits them. | **Governing reading:** IPD's binding is the sole tenant source. The hint has **no** authority and is **never transmitted**. Its only role is an IRR-local "binding provisioned" configuration precondition. This follows the IPD-owned contract (L-IPC-1 C7/§6.4) on the IPD-owned domain, and is fixed in consumer contract v1 §3. The DP-1 §6.4 wording needs an IRR-side clarifying note (R-4). |
| D-4 | IRR `main` `userPortfolioContract.ts` (`G2_CONTRACT_VERSION = '2'`, blob `0dec72eb…`) describes the G24 **HTTP** wire with `x-ipd-tenant-id`, `IPD_AUTH` (401) and `FORBIDDEN` (403). That path is closed by CV-50. | Not changed (IRR product code; no IRR implementation authority). Consumer contract v1 §8 records that, for the IPC path, it supersedes the HTTP wire description upon acceptance. The IRR code revision is IRR Gate 3 scope. |
| D-5 | H-18 and global NO-AUTH records still carry CANDIDATE/PROPOSED banners while the tracker treats their exclusions as operative (§16.13 note 8; PRs #60–#70) | Pre-existing; **not adjudicated here**. This record relies only on the exclusions the PA restated at §15.19 (`GC-P2-SCOPE-CORR-01`). |
| D-6 | The off-`main` IPD Gate B design emits **zero bytes** for every refusal, including post-authorization outcomes. Write semantics (revision conflict, 2F refusal) need distinguishable post-authorization outcomes. | Addressed as a proposed contract point in consumer contract v1 §5 (pre-authorization refusals stay zero-byte; post-authorization outcomes are typed and non-disclosing). This needs PA acceptance. |
| D-7 | **Post-publication (IRR `main` moved during this pass).** IRR PR #134 (`b1f1ea0fe9fba31aacae54180e1231f2b06014ba`, merged 2026-10-18T14:06:28Z, before IPD PR #14 at 14:23:10Z) added tracker §16.50 / `CV-CORR-33` and PKG-02A. They register the CV-20 **request** with CV-20 still `DECISION REQUIRED`, and state that Gate 2 contract work depends on the unresolved disposition. | Docs-only, 3 files. Fence, boundary, G-2, DP-1 amendment and D-2 blobs are unchanged at `b1f1ea0` (verified). The entry predates this designation and is sequential, not conflicting. Its "Gate 2 depends on CV-20" statement is now satisfied on the IPD side. The tracker update stays IRR-owned (§10). |
| D-8 | **CV-20 request §2.2 enumerative detail** (raised by IRR PKG-02A D-2(a)): it says "26 forbidden keys including `ownerUserId`, `tenantHint`, `idToken`, `bearerToken`, `cookie`, `sessionToken`" and gives `getAnalytics(portfolioId, currentPrices, priceAsOf?)`. **Verified** at `portfolioStorePort.ts` blob `d61f18df…`: **29** keys, none of the six named keys present, and `getAnalytics(portfolioId?: string)`. This record (§4.8) and contract v1 (§2) initially repeated "26". | Non-material: the fail-closed property holds exactly. Corrected additively. The CV-20 request carries a dated correction note, this record and the contract are corrected in place with a visible note, and contract `portfolio.analytics` is marked RESERVED (G-2 §7). |
| D-9 | **`cab04b6f` resolution** (IRR PKG-02A D-2(b) "Unresolved"). **Resolved:** `cab04b6f94618c9afad1440882ebf63437fdf6f8` is a **blob**, not a commit. It is the L-IPC-1 proposal text as accepted: introduced at `ccba11e` and named explicitly as "blob accepted" in the acceptance decision (blob `f7086304…`, header row "Subject of the decision"). Acceptance commit `66be695` then added the acceptance banner and dated notes, producing the current `main` blob `d4aaf4ca…`. | IPD-side resolution recorded here and on the CV-20 request. The IRR-side PKG-02A/tracker follow-up is IRR-owned (§10). |
| D-10 | **Erroneous full SHAs in pre-existing IPD records** (found by a resolution scan of all 57 unique 40-hex values in `evidence/cross-repository/`; 56 resolve, 55 locally and `2e11fa3b…` on GitHub only). Unresolvable values, each with a correct 8-hex prefix: `9be364b13c6b…` (CV-20 request; one-pass continuation §1) → actual `9be364b11631291a8602e07fcbdd0c7a9cc6ed06`; `470cc6983952…` (CV-20 request) → actual `470cc698924ebecf8ce51cf7291b48f3fc1c7da7`; tag object `8e91cc707a60…` (CV-20 request) → actual `8e91cc7029ce14cf353a9f138c826906239b05c6`. | Non-material; no conclusion depends on the suffixes. Corrected by additive dated notes. This record's own citations resolve 100%. |

---

## 9. Artifacts published with this record (Gate 2 preparation; all PROPOSED)

| Artifact | Path | Status |
|---|---|---|
| Versioned IPD-to-IRR consumer contract v1.0.0 | `evidence/cross-repository/IIPS_V3_G2_IPD_IRR_PORTFOLIO_CONSUMER_CONTRACT_V1_2026-10-18.md` | **PROPOSED: not accepted** |
| Gate E portfolio write policy rev 1 | `evidence/cross-repository/IIPS_V3_G2_GATE_E_PORTFOLIO_WRITE_POLICY_2026-10-18.md` | **PROPOSED: not accepted; grants no implementation authority** |
| Gate 2 acceptance authority request | `evidence/cross-repository/IIPS_V3_G2_GATE2_ACCEPTANCE_AUTHORITY_REQUEST_2026-10-18.md` | **DECISION REQUIRED** |

### 9.1 Checks executed in this pass (sandbox, Linux; exact results)

These checks only show that the published `main` baselines are unchanged and that their existing invariants still hold. They are **not** qualification evidence, Windows evidence, or Gate C/Q-series results.

| Repository @ commit | Check | Result |
|---|---|---|
| IPD `2d12413` | `npx tsc --noEmit`; `npm run build` | pass; exit 0 |
| IPD `2d12413` | `npm test` (full suite, `scripts/run-tests.mjs`) | **556 tests / 84 suites: 556 pass, 0 fail, 0 skipped** |
| IPD `2d12413` | `node --test dist/tests/bi07_portfolio_store_port.test.js dist/tests/bi07_portfolio_ui_integration.test.js` (session-only store invariants) | **29/29 pass** |
| IRR `d32c812` | `npx vitest run server/user-portfolio-transport.test.ts server/user-portfolio/` (503 fence and boundary) | **5 files, 49/49 pass** |
| IRR `d32c812` | `npx vitest run` (full frontend suite) | **73 files, 814/814 pass** |

The change set in this pass touches only `evidence/**/*.md` in IPD, and **no IRR file** was changed.

---

## 10. Records to update (evidence-justified)

| Record | Change | Where |
|---|---|---|
| IPD CV-20 decision request | Dated note: Option A selected and recorded here; later, a dated correction note for D-8/D-9 | PR #14; post-publication follow-up PR |
| IPD readiness reconciliation §3.3 / one-pass continuation | Dated note pointing to this record | PR #14 |
| **IRR master tracker `CV-20` row, §16.12/§19 counts, §16.49.4 IPD SHA** | Proposed: `CV-20` status `DECISION REQUIRED` → `OPTION A DESIGNATED (ownership source, item (b)); items (a)/(c)/(d) and Gates 2–5 outstanding`. Next action → Gate 2 acceptance act. | **Not applied in this pass.** This session may push only to its IPD branch. Applying the change is an IRR-session action (owner: PA / IRR session). No competing tracker is created. |
| **IRR PKG-02A D-2(a)/D-2(b); tracker §16.50.3** | Proposed: close D-2(a) as corrected on the IPD side (D-8), and close D-2(b) as resolved: `cab04b6f` is the accepted **blob** (D-9). Also record IRR `main` `b1f1ea0` as the IRR baseline at publication (D-7). | **Not applied.** IRR-owned; left for an IRR session. |

---

*Recording agent: Arena Agent Mode. It recorded the Program Authority's Option A disposition, checked the PA-named candidate against the PA's stated evidentiary condition, and published the result. No authority is rendered or inferred by the agent. Nothing here provisions, implements, qualifies, admits, writes, merges product code, or lifts any fence.*
