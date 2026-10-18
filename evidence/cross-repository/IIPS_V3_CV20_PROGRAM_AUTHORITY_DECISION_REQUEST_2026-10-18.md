# IIPS 3.0 — CV-20 Program Authority Decision Request & Cross-Repository Evidence Reconciliation

| Field | Value |
|---|---|
| **Document ID** | `IIPS-V3-CV20-PA-DECISION-REQUEST-2026-10-18-01` |
| **Tracker Item** | `CV-20` — Single-User Non-Authentication Portfolio Ownership Source Designation |
| **Task Classification** | Authority-Resolution Preparation & Evidence Reconciliation (**not** implementation, qualification, admission, or production authorization) |
| **Date** | `2026-10-18` (UTC) |
| **Current `CV-20` Status** | **`DECISION REQUIRED`** (No Program Authority selection has been rendered or accepted in this pass) |
| **Decision Authority (by Role)** | **Program Authority** — Single-User Application Product Owner & Governance Authority for the IIPS v3.0 Program across `ramkivs/iips-production-market-data` (IPD) and `ramkivs/iips-review-recovered` (IRR) |
| **IPD Authoritative `main` Baseline Inspected** | `adb5d9899206bc71825ecc1919e56d6d3a3ed0f5` (`origin/main`, PR #12 merge commit; CI run `39131311372` `success`) |
| **IRR Authoritative `main` Baseline Inspected** | `e9bb64c2e5aa5c888b689f6e40fc5ae3875ccab6` (`origin/main`, PR #132 merge commit; CI run `39129422038` `success`) |
| **Portfolio Safety Boundary** | **PRESERVED UNCHANGED** — IRR `/api/user-portfolios*` remains fail-closed at HTTP `503 owner-context-unavailable`; IPD `main` `PortfolioStorePort` / `PortfolioStore` remains `SESSION_ONLY` (`durable: false`); DP-2 Option 2F unresolved-holding write refusal remains in force |
| **Production Status** | `NON_PRODUCTION` (`NOT AUTHORIZED` for production use) |


> **Dated note (2026-10-18, post-publication; additive, historical text preserved).** The Program Authority has **selected Option A — Designate**. The disposition and the designated source (the single `ACTIVE` A-2 provisioned local-principal binding in the IPD store, consumed only by the IPD-owned same-host IPC endpoint under `L-IPC-1` rev 2 and the IRR DP-1 amendment) are recorded in `evidence/cross-repository/IIPS_V3_CV20_OPTION_A_OWNERSHIP_SOURCE_DESIGNATION_RECORD_2026-10-18.md` (`IIPS-V3-CV20-OPTION-A-OWNERSHIP-SOURCE-DESIGNATION-2026-10-18-01`). That record also resolves the IRR baseline citation in this request's header: IRR `main` advanced from `e9bb64c2…` to `d32c8122f0ba3cee7f1549c7279d1d53c45cb1d9` (PR #133, documentation-only) before this request merged. The "Current `CV-20` Status: DECISION REQUIRED" field above is historical as of this request's publication. **Every fence and non-authorization in this request remains in force.**
>
> **Dated correction note (2026-10-18, post-publication; additive).** (1) **§2.2 and the evidence-index row describing `CALLER_SUPPLIED_IDENTITY_KEYS` / the port signature are corrected:** at IPD `main` blob `frontend/src/features/portfolio/portfolioStorePort.ts` `d61f18dfdce12a7f0c4377a3c6d410026d454089`, the list has **29** keys (`owner`, `ownerId`, `tenant`, `tenantId`, `applicationUserId`, `applicationUser`, `userId`, `user`, `principal`, `principalId`, `membership`, `membershipId`, `credential`, `credentials`, `password`, `secret`, `token`, `accessToken`, `refreshToken`, `authorization`, `authHeader`, `claims`, `scope`, `scopes`, `role`, `roles`, `identity`, `sessionId`, `applicationPrincipal`). None of the six keys named in §2.2 is in the list, and the port signature is `getAnalytics(portfolioId?: string)`. The material property (caller-supplied identity/scope keys refused; no owner/tenant parameter) is **unchanged**. Raised by IRR PKG-02A D-2(a); independently re-verified. (2) The `L-IPC-1` rev 2 pin `cab04b6f…` cited in §2.6/§3.4 is the **accepted blob** of the proposal file, named in the acceptance decision. It is not a commit. See designation record D-9. (3) **Full-SHA corrections.** Three 40-hex values in this request do not exist as Git objects in either repository or on GitHub; their 8-hex prefixes are correct. Read `9be364b13c6b5ba1a1d6f85c49efda9dfef8158d` as **`9be364b11631291a8602e07fcbdd0c7a9cc6ed06`** (IRR first parent of `e9bb64c`); `470cc6983952329591d42a3cc39689a3501c31bb` as **`470cc698924ebecf8ce51cf7291b48f3fc1c7da7`** (in the ancestry of IRR `5eba01b6`); and tag object `8e91cc707a606c08f605d5a7e8ebfd883c17cc1c` as **`8e91cc7029ce14cf353a9f138c826906239b05c6`** (`refs/tags/iips-pin-np04-2e11fa3b` → `2e11fa3b…`). No conclusion of this request depends on the erroneous suffixes. See designation record D-10.

---

## 1. Purpose, Scope, and Authority Boundary

This document prepares the formal, evidence-backed **Program Authority decision request** required to resolve tracker item **`CV-20`** for durable user-portfolio readiness across:

- **IPD (`ramkivs/iips-production-market-data`):** authoritative owner of the user-portfolio domain, broker/Dhan ingestion, canonical security-master resolution, and durable portfolio persistence boundary under the accepted G-2 architecture (`docs/integration/IIPS_v3.0_G2_DURABLE_USER_PORTFOLIO_ARCHITECTURAL_DECISION.md`).
- **IRR (`ramkivs/iips-review-recovered`):** executive analytical consumer whose `/api/user-portfolios*` transport boundary is intentionally held fail-closed at HTTP `503 owner-context-unavailable` pending `CV-20` and its downstream governance gates.

This artifact reconciles the existing cross-repository records (`evidence/cross-repository/IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md`, `evidence/cross-repository/IIPS_V3_IPD_ONE_PASS_CONTINUATION_2026-10-18.md`, IRR `docs/integration/2026-10-18/PKG-02-PORTFOLIO-CROSS-REPOSITORY-DEPENDENCY.md`, and IRR `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md`) into a single decision instrument.

> **Explicit Non-Authorization Statement:**
> This document is a decision request only. **No Program Authority decision has been made or accepted in this task, and `CV-20` remains explicitly `DECISION REQUIRED`.** Furthermore, even if the Program Authority selects **Option A — Designate**, **a designation alone does NOT authorize implementation, qualification, admission, or production use.** It does not lift the IRR HTTP `503 owner-context-unavailable` fence, does not enable durable portfolio writes, does not promote IPD `SESSION_ONLY` (`durable: false`) or off-`main` lineages (`6828155e`, `2ded0e98`, `cec70802`, `6c654be7`, `110e221f`, `470cc698`) to admitted capability, does not modify the accepted G-2 architecture, and does not grant consumer-contract acceptance, implementation authority, qualification acceptance, route admission, or production authorization.

---

## 2. Repository Boundaries & Reconciled Evidence

### 2.1 Verified Repository Baselines and Remote References

| Repository | Ref / Pointer | Verified Commit / Object SHA | Role & Verified Status |
|---|---|---|---|
| **IPD** (`ramkivs/iips-production-market-data`) | `refs/heads/main` | `adb5d9899206bc71825ecc1919e56d6d3a3ed0f5` | Authoritative IPD `main` at start of pass (PR #12 merge of `80da034be26eae6b66dba8ffb9a6d7fab27cb6fd` onto `9130c259ee753bad63611b256f67a470f715e37f`; GitHub Actions run `39131311372` `success`). Contains `PortfolioStorePort` (`467eb52`, PR #8) and CI workflow (`e040002`, PR #9). |
| **IPD** | `refs/heads/arena/01a0f308-iips-production-market-data` & `refs/tags/iips-pin-g24-6828155e` | Commit `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` (tag object `dcdaaa94e8e050ba132a19813d2f22f214dca7d3`) | Off-`main` G24 SQLite durable portfolio lineage (`DurablePortfolioStore`, migrations `001`–`002`, HTTP server, OIDC-era verifier). Tagged for ref durability only under `CV-25`. **Unmerged, unqualified for `main`, and not an admitted capability.** |
| **IPD** | `refs/heads/gate-a/local-principal-enablement-2026-10-16` | `2ded0e981407b38c73bdea164153f53856aa7217` | Off-`main` Gate A derivative ref atop `6828155e` (adds migration `003_local_principal_bindings` + A-3 local audit events). Initial execution was in an ephemeral Linux sandbox; Windows host provisioning under Gate A′ (`P-1`) remains `NOT EXECUTED`. |
| **IPD** | `refs/heads/gate-b/local-principal-ipc-implementation` | `cec7080252183a6a5332efe351e61c254d342a2d` (tree `22a7438bc41e5b9853700c5a3737702898da8c53`) | Off-`main` Gate B 15-file read-only IPC endpoint atop `2ded0e98`. `portfolio.save` unconditionally returns `WRITE_NOT_AUTHORIZED`. Windows Gate C qualification (`D-GC`) is `NOT EXECUTED`. **Not on `main`; not an admitted capability.** |
| **IPD** | `refs/heads/np04-governed-persistence-windows` & `refs/tags/iips-pin-np04-2e11fa3b` | Commit `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494` (tag object `8e91cc707a606c08f605d5a7e8ebfd883c17cc1c`) | Off-`main` NP-04 runtime pin consumed by IRR `frontend/package.json` for `./pit` and `./d114-non-production` under `AD-02` only. Its `./persistence` export has zero consumers on IRR `main`. |
| **IRR** (`ramkivs/iips-review-recovered`) | `refs/heads/main` | `e9bb64c2e5aa5c888b689f6e40fc5ae3875ccab6` | Authoritative IRR `main` at start of pass (PR #132 merge of `c8fe209ec691dd3673ba9fbd14fb2dd7fba70ec3` onto `9be364b13c6b5ba1a1d6f85c49efda9dfef8158d`; GitHub Actions run `39129422038` `success`). |
| **IRR** | `refs/heads/gate-b/local-principal-ipc-implementation` | `6c654be728ef0c90c69f7184f3a5e1625e71057d` | Off-`main` initial Gate B 8-file read-only IPC adapter on historical baseline `10584439`. Preserved immutable per D12 (`C-1`). **Unmerged, no PR, not an admitted capability.** |
| **IRR** | `refs/heads/gate-b/local-principal-ipc-implementation-r2` | `110e221fe7ca335c4571adb93d6c629c061f84e0` (tree `ed54ced73a9f647dc0b047533ccb3fbdd9304c96`) | Off-`main` D12 re-baselined 8-file read-only IPC adapter on `4368a8d407f71dd84633a501ae1a003612fd28fe`. Refuses all writes locally (`refuseUnresolvedPortfolioWrite` / `G2_WRITE_POLICY_UNDEFINED_MESSAGE`). **Unmerged, no PR (`P-1`), not an admitted capability.** |
| **IRR** | `refs/heads/arena/a2df3b85-iips-review-recovered` | `5eba01b6e818a261230725761b7797b68782e883` (contains `470cc6983952329591d42a3cc39689a3501c31bb`) | Off-`main` 2026-10-07 branch (149+ commits behind `main`) containing historical HTTP `ipdUserPortfolioAdapter.ts`, `contractStub.ts`, `CV-38` restart-proof trio, and retired OIDC/auth-era code. **Prohibited from `main` admission under `D-1`, `H-18`, and G-2 implementation record §8.5.** |

### 2.2 Current State of IPD `PortfolioStorePort` and the `SESSION_ONLY` / `durable:false` Boundary

Direct source inspection of IPD `main` at `adb5d9899206bc71825ecc1919e56d6d3a3ed0f5` verifies:

1. **`PortfolioStorePort` Contract (`frontend/src/features/portfolio/portfolioStorePort.ts`, blob `d61f18dfdce12a7f0c4377a3c6d410026d454089`):**
   - Introduced under bounded UI dependency-inversion act `np04-g2-portfolio-ui-store-port-2026-10-16-001` and merged to `main` via PR #8 (`467eb529f52820032b17ea0212c92362a96dfe18`).
   - Exposes `readonly durability: PortfolioDurability` (`'SESSION_ONLY' | 'DURABLE'`), `readonly durable: boolean`, `getPortfolio(portfolioId)`, `getAnalytics(portfolioId, currentPrices, priceAsOf?)`, `getRevision(portfolioId)`, and `saveHoldings(request)`.
   - Deliberately omits any owner, tenant, principal, credential, or authorization-scope parameter. `findCallerSuppliedIdentityKeys` inspects top-level request keys and nested `options` against `CALLER_SUPPLIED_IDENTITY_KEYS` (26 forbidden keys including `ownerId`, `ownerUserId`, `applicationUserId`, `tenantId`, `tenantHint`, `principalId`, `authorization`, `idToken`, `accessToken`, `bearerToken`, `cookie`, `sessionToken`, etc.) and fails closed with `INVALID_REQUEST` before any store access.
   - Enforces **DP-2 Option 2F** via `evaluatePortSaveGuard(request.holdings)`: any holding without `identityStatus === 'RESOLVED'` or with a missing/blank/`UNKNOWN` `companyId` is refused with `REFUSED_UNRESOLVED_IDENTITY` before any mutation.
2. **In-Memory `SessionPortfolioStorePort` & `PortfolioStore` (`frontend/src/features/portfolio/portfolio-store.ts`, blob `3bf852b99e300a8dfa71d3b1b04ed0f7b947b4a5`):**
   - The sole implementation on IPD `main` is `SessionPortfolioStorePort`, which wraps the in-memory `PortfolioStore` (`private portfolios: Map<string, PortfolioRecord> = new Map()`).
   - Both `PortfolioStore` and `SessionPortfolioStorePort` hard-code `readonly durability = 'SESSION_ONLY' as const` and `readonly durable = false as const`.
   - Every save returns `durability: 'SESSION_ONLY'` and `durable: false`; all state is lost when the browser tab reloads or the process terminates.
   - `describePersistenceStatus` maps `isSaved && !durable` to `{ state: 'SESSION_ONLY', label: 'SAVED (SESSION ONLY - NOT DURABLE)', isDurable: false }`. `PortfolioWorkspace.tsx` (`068eed36...`) and `BrokerImportModal.tsx` (`f2ed480f...`) depend exclusively on `PortfolioStorePort` and never display `COMMITTED (Atomic)` on the session-only path.
   - IPD `main` contains **zero files** under `src/persistence`, `src/portfolio`, `src/app_identity`, `src/ipc`, or `src/server`.

### 2.3 Off-`main` Durable and IPC Lineages (Not Admitted Capability)

1. **IPD G24 SQLite Lineage (`6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`, tag `iips-pin-g24-6828155e`):**
   - Implements `DurablePortfolioStore` (`src/portfolio/durable-store.ts`), SQLite schema/migrations `001`–`002` (`src/persistence/**`), `src/app_identity/**`, and `src/server/http-server.ts`.
   - Built around an OIDC JWT verifier (`P-4 → P-6 → P-8` chain) that is **terminally closed out of scope** for the single-user personal-use product under `H-18`, `GC-P2-SCOPE-CORR-01`, and `CV-50`.
   - Standing `D-1` (`PERSISTENCE-DOMAIN-OWNERSHIP-DECISION.md`) and G-2 implementation record §8.5 explicitly bar promoting, merging, or admitting `6828155e` to `main` without separate qualification and admission acts. The annotated tag `iips-pin-g24-6828155e` was created solely for Git object durability under `CV-25`.
2. **IPD Gate A (`2ded0e981407b38c73bdea164153f53856aa7217`) and Gate B (`cec7080252183a6a5332efe351e61c254d342a2d`) Off-`main` Refs:**
   - Gate A added migration `003_local_principal_bindings.ts` and A-3 local audit logging atop `6828155e`. Because its initial execution ran in an ephemeral Linux container, Gate A′ (`IIPS-V3-G2-IPD-GATE-A-PRIME-PA-DECISION-2026-10-17-01`) authorized one-time Windows host store provisioning under rule `P-1`, which remains **unexecuted**.
   - Gate B (`cec70802`) added a 15-file same-host IPC server (`src/ipc/**`, `src/user_portfolio/**`) atop `2ded0e98`. By explicit authority constraint (`IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01`), it is **strictly read-only**: `portfolio.save` always returns `WRITE_NOT_AUTHORIZED` and performs zero database writes.
   - Gate C (`D-GC`, `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-AUTHORITY-2026-10-17-01`) authorized executing only the 7-item read-only qualification subset (`Q1, Q2, Q3, Q4, Q9, Q10, Q11`) on the Windows host (currently **unexecuted**), while write/restart items `Q5–Q8` are formally **`DEFERRED`** behind Gate E write-policy authority.
3. **IRR Gate B (`6c654be7` / D12 `110e221fe7ca335c4571adb93d6c629c061f84e0`) and 2026-10-07 (`470cc698` on `5eba01b6`) Off-`main` Refs:**
   - IRR Gate B (`110e221f`) contains 8 files (`ipcClient.ts`, `ownerContextFromBinding.ts`, `ipcPortAdapter.ts`, `firstPartySignal.ts`, and 4 test files). It is read-only (`saveHoldings` refuses locally via `refuseUnresolvedPortfolioWrite()`, and create/lifecycle methods refuse with `G2_WRITE_POLICY_UNDEFINED_MESSAGE`), unmerged, with no open PR (`P-1`), and unreachable at runtime because `user-portfolio-transport.ts` (`51704c12...`) is untouched.
   - IRR `arena/a2df3b85-iips-review-recovered` (`5eba01b6`, carrying `470cc698`) is a historical branch 149+ commits behind `main` mixed with retired OIDC/auth code and is barred from admission.

### 2.4 IRR `/api/user-portfolios*` Fail-Closed HTTP `503` Boundary

Direct source inspection of IRR `main` at `e9bb64c2e5aa5c888b689f6e40fc5ae3875ccab6` verifies:

1. **Transport Handler (`frontend/server/user-portfolio-transport.ts`, blob `51704c12a467cd2f718a030b5036bc55c9afa73f`):**
   - Dispatched from `frontend/server/executive-transport.ts` for `/api/user-portfolios` and `/api/user-portfolios/*`.
   - Validates path and HTTP method across the 6 route/method pairs (`GET /api/user-portfolios`, `POST /api/user-portfolios`, `GET /api/user-portfolios/:id`, `PUT /api/user-portfolios/:id/holdings`, `DELETE /api/user-portfolios/:id`, `GET /api/user-portfolios/:id/revisions`), returning `404` for unknown subpaths and `405` (with `Allow`) for unsupported methods.
   - For every valid route/method pair, unconditionally calls `respondOwnerContextUnavailable(res)` (`frontend/server/owner-context-unavailable.ts`, blob `cb8db45d668d28cee7e0a52721001d579a872733`), returning HTTP **`503`** with payload:
     ```json
     {
       "error": "owner-context-unavailable",
       "detail": {
         "reason": "No non-authentication ownership source has been established. No owner is inferred; no data is read or changed."
       }
     }
     ```
   - Never parses the request body, never inspects headers/cookies/query parameters for identity, never constructs a `G2Scope`, and never invokes `UserPortfolioPort` (`frontend/server/user-portfolio/userPortfolioPort.ts`, blob `ba0001e88c83b070e4f16a3cdb35d34c82ec0200`).
2. **Boundary & Translation Guards (`frontend/server/user-portfolio/userPortfolioBoundary.ts`, blob `b8024c6b...`, and `translationBoundary.ts`, blob `93f602fd...`):**
   - Even behind the transport fence, `userPortfolioBoundary.ts` rejects caller-supplied authority keys (`FORBIDDEN_CALLER_FIELDS`) and unconditionally calls `refuseUnresolvedPortfolioWrite()` on `saveHoldings` (enforcing GC-D2 / DP-2 Option 2F).
   - `translationBoundary.ts` enforces `D-2` §8 (`IDENTITY-TENANT-DOMAIN-SCOPE-DECISION.md`): IRR domain identifiers may not be equated with IPD `applicationUserId`/`tenantId` absent an accepted 15-element cross-domain translation contract.
3. **Exclusion of the F-1/F-2/F-3 Local Owner-Context Carrier:**
   - The file-backed local owner-context carrier (`IIPS_OWNER_CONTEXT_PATH`, `(owner-7f3a91c2, irr-domain-4b82d6e1)`) accepted under `IIPS_v3.0_OWNER_CONTEXT_PA_DECISION_FINAL.md` (§4.4, §7.4–§7.5) is explicitly restricted to **Watchlists (NP-09), Collaboration (NP-10), and Settings (NP-11)**. It is forbidden from satisfying User Portfolios (G-2) or Reports (NP-06).

### 2.5 Accepted G-2 IPD-Owned Durable Portfolio Architecture

`docs/integration/IIPS_v3.0_G2_DURABLE_USER_PORTFOLIO_ARCHITECTURAL_DECISION.md` (blob `7e83946b470bcc6f4751fb1a67e832ac66128c5c`, accepted 2026-09-30 on IRR `main`) establishes the binding architecture that must remain unchanged:

- **Domain Ownership (§1):** IPD owns the user-portfolio domain and its durable persistence boundary. The existing IPD `PortfolioStore` (`frontend/src/features/portfolio/portfolio-store.ts`) and broker/Dhan ingestion capability are the authoritative baseline to be extended—not replaced or duplicated. IRR may consume the capability only through a separately governed, explicit, additive, minimal, contractually defined, and independently testable boundary. The certified IRR reference portfolio and user-owned portfolio remain strictly distinct.
- **Preserved IPD Baseline (§2):** Broker CSV/JSON ingestion (`BrokerCsvService`), broker adapters (`DhanAdapter` + 5 peer adapters), holding normalization, `SecurityMaster` canonical company-identity mapping, `UserHoldingInput`, `PortfolioRecord`, `BrokerContributionRecord` SHA-256 lineage, MERGE/REPLACE consolidation, weight normalization, and BI-08 `contentDigest` idempotency.
- **Thirteen Durable Requirements (§3):** Explicit owner/principal identity, explicit tenant/company context, stable durable portfolio identity, restart-durable persistence, versioned serialization/deserialization, schema/version migration, lifecycle/retention, reset/deletion, concurrency/version semantics, server-side authorization, tenant/owner isolation, governed auditability, and durable preservation of contribution/lineage/idempotency.
- **Exclusions & Non-Grants (§4–§8):** PIT is not used for portfolio persistence; certified analytics integration and Reports remain excluded; the architectural decision grants no implementation, qualification, admission, or production authority.

### 2.6 Reconciled Governance Chain & Discrepancies Across Prior Records

Review of all governing acts and tracker artifacts across IPD and IRR identified five cross-record discrepancies, which are reconciled below:

| # | Discrepancy Across Existing Records | Verified Reconciliation |
|---|---|---|
| **1** | **Stale IPD `main` baseline SHAs in 2026-10-18 documents:** IRR `PKG-02-PORTFOLIO-CROSS-REPOSITORY-DEPENDENCY.md` and IPD `IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md` cited IPD `main` at `467eb529f52820032b17ea0212c92362a96dfe18` (PR #8), and `IIPS_V3_IPD_ONE_PASS_CONTINUATION_2026-10-18.md` cited `9130c259ee753bad63611b256f67a470f715e37f` (PR #11). | Authoritative IPD `main` at the start of this pass is `adb5d9899206bc71825ecc1919e56d6d3a3ed0f5` (PR #12 merge). All 6 portfolio product/test file blobs from PR #8 (`467eb52`) and all 48 PR #8 paths are verified byte-identical at `adb5d989`. |
| **2** | **Two-track `CV-20` framing across 2026-10-14 vs. 2026-10-16..18 records:** IRR Master Tracker §16.4.2 / §16.7.1 Q1 originally framed `CV-20` around re-qualifying 2026-10-07 commit `470cc698` (HTTP/OIDC-era adapter) plus a separable ownership-source designation act, whereas 2026-10-16..17 Gate A/B/C records (`L-IPC-1` rev 2 `cab04b6f`, IRR `DP-1` amendment `c71661a1`, IPD `cec70802`, IRR `110e221f`) adopted a provisioned same-host IPC endpoint binding contract position for one single-user deployment while withholding route admission (Gate D) and write policy (Gate E). | Both tracks confirm that `CV-20` remains **`DECISION REQUIRED`**: (a) the 2026-10-07 `470cc698`/`6828155e` HTTP/OIDC credential path is terminally closed out of scope (`CV-50`), and (b) the 2026-10-16 `L-IPC-1` / `DP-1` amendment explicitly granted **contract position only** for read-only Gate B refs (`cec70802` / `110e221f`) and withheld `CV-20` route enablement, Gate E write policy, Windows Gate A′/C execution, and any lifting of the HTTP `503` fence. Thus, a formal Program Authority disposition (Option A, B, or C) remains required. |
| **3** | **IRR Master Tracker internal residue on `CV-25`:** In IRR `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` (`main@e9bb64c`), §16.4.2 (`CV-25`) and §16.48.3 row 7 record `COMPLETE (2 OF 2 TAGS)`, but the header banner (line 10) and §16.48.4 (line 3045) retain earlier `CV-CORR-31` text stating `CV-25` is `DECISION REQUIRED (pin still untagged)`. | Direct `git ls-remote` against IPD verifies **both** annotated tags exist on `origin`: `iips-pin-np04-2e11fa3b` (tag object `8e91cc70...` → `2e11fa3b...`) and `iips-pin-g24-6828155e` (tag object `dcdaaa94...` → `6828155e...`). The second tag's act/receipt markdown files sit on unmerged IPD branch `arena/fb46926b-iips-production-market-data@9ff9bb3e`. Neither tag grants G24 admission or resolves `CV-20`. |
| **4** | **Stale branch tip citation for `arena/a2df3b85-iips-review-recovered`:** IRR Master Tracker §16.4.3 (`CV-38`) and §16.17 cite `origin/arena/a2df3b85-iips-review-recovered` at `6f521f9`. | `git ls-remote` against IRR verifies the current remote head of `refs/heads/arena/a2df3b85-iips-review-recovered` is `5eba01b6e818a261230725761b7797b68782e883` (which contains `6f521f9` and `470cc698` in its ancestry). |
| **5** | **Absence of a standalone `CV-20` decision instrument on IPD `main`:** Prior IPD records (`IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md` §3.3 and `IIPS_V3_IPD_ONE_PASS_CONTINUATION_2026-10-18.md` §2) and IRR `PKG-02` summarized `CV-20` inside broader readiness reports without providing a dedicated Option A / Option B / Option C decision record. | Resolved by publishing this authoritative decision request and cross-referencing it from the existing `evidence/cross-repository/` records so there is no competing artifact. |

### 2.7 Verification Classification Matrix (Independently Verified vs. Reused Valid Evidence vs. Source-Reported)

| Finding / Evidence Item | Classification | Basis / Source |
|---|---|---|
| IPD `main` at `adb5d9899206bc71825ecc1919e56d6d3a3ed0f5`, CI run `39131311372` (`success`), and byte-identical preservation of all 48 PR #8 paths (including `portfolioStorePort.ts` `d61f18df...` and `portfolio-store.ts` `3bf852b9...`) | **Independently Verified (this pass)** | Direct `git`, `git rev-parse`, and `gh run list` inspection in IPD workspace. |
| IPD `PortfolioStorePort` & `PortfolioStore` enforcing `SESSION_ONLY` / `durable: false`, DP-2 Option 2F (`evaluatePortSaveGuard`), and 26-key `CALLER_SUPPLIED_IDENTITY_KEYS` refusal; zero files under `src/persistence`, `src/portfolio`, `src/app_identity`, `src/ipc`, `src/server` on IPD `main` | **Independently Verified (this pass)** | Direct source read of `frontend/src/features/portfolio/portfolioStorePort.ts` and `portfolio-store.ts` and tree check on `main@adb5d989`. |
| IPD off-`main` refs & tags: `6828155e` (`iips-pin-g24-6828155e`), `2ded0e98` (Gate A), `cec70802` (Gate B read-only IPC), `2e11fa3b` (`iips-pin-np04-2e11fa3b`), `9ff9bb3e` | **Independently Verified (this pass)** | Direct `git ls-remote` and commit/tree inspection against `ramkivs/iips-production-market-data`. |
| IRR `main` at `e9bb64c2e5aa5c888b689f6e40fc5ae3875ccab6`, CI run `39129422038` (`success`), and off-`main` refs `6c654be7`, `110e221f` (D12 Gate B), `5eba01b6` (`arena/a2df3b85-iips-review-recovered`), and open PR #114 (`e331995a`) | **Independently Verified (this pass)** | Direct `git ls-remote`, `gh pr list`, `gh run list`, and read-only inspection of `ramkivs/iips-review-recovered`. |
| IRR `/api/user-portfolios*` returning HTTP `503 owner-context-unavailable` on all 6 route/method pairs (`user-portfolio-transport.ts` `51704c12...`, `owner-context-unavailable.ts` `cb8db45d...`) without calling `UserPortfolioPort`; `userPortfolioBoundary.ts` (`b8024c6b...`) & `translationBoundary.ts` (`93f602fd...`) enforcing Option 2F and `D-2` §8 | **Independently Verified (this pass)** | Direct source read and blob hash verification on IRR `main@e9bb64c2`. |
| IRR off-`main` Gate B adapter (`110e221f`) reading `IIPS_G2_IPC_ENDPOINT` / `IIPS_G2_IPC_TENANT_HINT` (`ownerContextFromBinding.ts` `172f1c71...`) and refusing all writes locally (`ipcPortAdapter.ts` `74f0e652...`) | **Independently Verified (this pass)** | Direct source inspection of commit `110e221fe7ca335c4571adb93d6c629c061f84e0`. |
| IPD `main` test & build suite (`npm run build`, `npm test` — 49 files, 84 suites, 556/556 tests passing, including `bi07_portfolio_store_port.test.ts` 14/14 and `bi07_portfolio_ui_integration.test.ts` 15/15) | **Reused Valid Test Evidence (not redundantly rerun)** | Executed and verified on identical product/test blobs in 2026-10-18 pass (`IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md` §1.4) and GitHub Actions CI runs `39101468718` and `39131311372`. |
| IRR `main` test & build suite (73 files / 814 tests passing; focused 4-file / 64-test route & PIT certification suite; `npm run typecheck`; `npm run build`) | **Reused Valid Test Evidence (not redundantly rerun)** | Executed and verified in 2026-10-18 pass (`IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md` §2.4) and IRR PR #132 CI run `39129422038`. |
| Off-`main` G24 `84/84` suite (`6828155e`), off-`main` IPD Gate B `41/41` (`823/823` full) POSIX suite (`cec70802`), off-`main` IRR Gate B D12 `60/60` (`868` full) POSIX suite (`110e221f`), and 2026-10-07 IRR `59/59` suite (`470cc698`) | **Source-Reported (non-qualifying / off-`main`)** | Reported in `IIPS_v3.0_G2_DURABLE_USER_PORTFOLIO_IMPLEMENTATION_RECORD.md`, `IIPS_v3.0_G2_IPD_GATE_B_COMPLETION_EVIDENCE_HANDOFF_2026-10-17.md`, and commit `110e221f`. POSIX runs are explicitly non-qualifying for Windows Gate C. |
| `D4` owner broker-preview visual confirmation (`2026-10-17` capture + `2026-10-18` owner confirmation) and D05 `52` real vs. `2,198` synthetic issuer classification | **Source-Reported / Owner-Attributed** | Recorded in `IIPS_v3.0_D4_BROKER_PREVIEW_OWNER_ACCEPTANCE_RECORD_2026-10-18.md` and `BLOCK-3L-BROKER-CSV-FULL-RESOLUTION-AUDIT.md`. |

---

## 3. The Explicit `CV-20` Program Authority Decision Specification

### 3.1 Decision Authority (Identified by Role)

- **Decision Authority Role:** **Program Authority** (Single-User Application Product Owner and Governance Authority for IIPS v3.0 across `ramkivs/iips-production-market-data` and `ramkivs/iips-review-recovered`).
- No individual decision-maker is invented or inferred by the agent, and no agent session may self-authorize or substitute for the Program Authority.

### 3.2 Exact Decision Question

> **Decision Question (`CV-20`):**
> *"Under standing single-user personal-use product scope (`H-18` / `IIPS_v3.0_GLOBAL_NO_AUTH_PROGRAM_AUTHORITY_DECISION.md` — no login, OIDC, RBAC, multi-user, or tenant-directory architecture) and the accepted G-2 IPD-owned durable user-portfolio architecture (`IIPS_v3.0_G2_DURABLE_USER_PORTFOLIO_ARCHITECTURAL_DECISION.md`), which disposition does the Program Authority select for **`CV-20`** regarding a non-authentication ownership source for user portfolios:*
> - ***Option A — Designate*** *a qualifying non-authentication ownership source for the single-user application (identifying the source and defining its trust boundary, lifecycle, reset/revocation behavior, and failure handling);*
> - ***Option B — Decline*** *to designate an ownership source at this time, recording the rationale and preserving the existing fail-closed behavior; or*
> - ***Option C — Defer*** *the decision explicitly, recording the reason and prerequisites for reconsideration while preserving the existing fail-closed behavior?"*

### 3.3 The Three Dispositions and Their Consequences

#### Option A — Designate

**Definition:**
Designate a qualifying **non-authentication** ownership source for the single-user application, without introducing login, OIDC, RBAC, multi-user, or tenant-directory architecture. To be complete and actionable for downstream contract specification, an **Option A** selection must specify five elements:

1. **Ownership Source Identity & Authoritative Record:** Identify the exact server/host-controlled non-authentication source for the single-user application (for example, whether the provisioned same-host IPC principal binding record in IPD `local_principal_bindings` paired with server-owned environment configuration `IIPS_G2_IPC_ENDPOINT` / `IIPS_G2_IPC_TENANT_HINT` under `L-IPC-1` rev 2 and the `DP-1` amendment is designated for full user-portfolio ownership, or another explicit operator-provisioned host/file source is designated) and state which repository owns the authoritative binding record. Caller-supplied headers, cookies, query parameters, and request body fields remain unconditionally forbidden.
2. **Trust Boundary & Cross-Domain Scope Mapping:** Define the host/process trust boundary (e.g., same-host OS user ACL + single active binding row) and how IRR's consumer scope maps to IPD's `(applicationUserId, tenantId)` portfolio ownership boundary in compliance with `D-2` §8 (confirming that IRR's F-1/F-2/F-3 Watchlist/Collaboration/Settings carrier `(owner-7f3a91c2, irr-domain-4b82d6e1)` is not implicitly equated with IPD portfolio ownership without an explicit rule).
3. **Lifecycle Semantics:** Define how the ownership binding is provisioned, initialized, validated per call (with no unrevoked in-memory identity caching), and preserved across process restarts in the single-user environment.
4. **Reset and Revocation Behavior:** Define how the single-user operator resets, rotates, or revokes the ownership binding, confirming immediate per-call effect upon revocation/deactivation and specifying whether portfolio data under a reset/revoked binding is retained, archived, or cleared via governed administrative action.
5. **Failure Handling:** Confirm that any absent, unprovisioned, unreadable, malformed, mismatched, or revoked ownership source fails closed immediately—inferring no default owner, performing no read or write, never falling back to `SESSION_ONLY` while claiming durability, and returning HTTP `503 owner-context-unavailable` (or the closed `G2FailureReason` refusal vocabulary) at the boundary.

**Consequences of Option A:**
- Resolves the `CV-20` ownership-source designation gate (**Gate 1** only).
- Unlocks preparation and Program Authority review of **Gate 2** (the versioned IPD-to-IRR consumer contract and Gate E write-policy / canonical-identity resolution rules).
- **Does NOT** by itself lift the IRR HTTP `503 owner-context-unavailable` fence, enable durable writes, or authorize implementation, qualification, admission, or production use.

---

#### Option B — Decline

**Definition:**
Decline to designate a non-authentication ownership source for user portfolios at this time and record the Program Authority's rationale (for example, that session-only broker import and portfolio analytics in IPD are sufficient for current personal-use operations).

**Consequences of Option B:**
- IRR `/api/user-portfolios*` remains permanently fail-closed at HTTP `503 owner-context-unavailable` unless and until a future Program Authority act reverses the decision.
- IPD `main` `PortfolioStorePort` / `PortfolioStore` remains `SESSION_ONLY` (`durable: false`, labeled `'SAVED (SESSION ONLY - NOT DURABLE)'`).
- DP-2 Option 2F unresolved-holding write refusal remains active on both IPD and IRR boundaries.
- Off-`main` G24 (`6828155e`), Gate A (`2ded0e98`), and Gate B (`cec70802`, `6c654be7`, `110e221f`, `470cc698`) lineages remain unadmitted and unmerged.
- Downstream Gates 2–5 (consumer contract, implementation authority, qualification, and admission) are not pursued.

---

#### Option C — Defer

**Definition:**
Explicitly defer the `CV-20` ownership-source decision, recording:
1. **Reason for Deferral:** e.g.,sequencing priority given to completing already-authorized Windows-host read-only IPC verification (Gate A′ store provisioning + 7-item read-only Gate C qualification run `Q1–Q4, Q9–Q11`) or resolving `CV-22` security-master universe coverage before establishing durable write ownership.
2. **Known Prerequisites for Reconsideration:** Concrete conditions that must be met before `CV-20` is re-presented to the Program Authority (such as Windows host execution and acceptance of Gate A′ and read-only Gate C, or a Gate E write-policy specification).

**Consequences of Option C:**
- Preserves all current fail-closed safety fences (`503 owner-context-unavailable` on IRR `/api/user-portfolios*`, `SESSION_ONLY` / `durable: false` on IPD `main`, DP-2 Option 2F write refusal).
- Leaves `CV-20` recorded in program trackers as deferred / `DECISION REQUIRED` pending the recorded prerequisites.
- Prohibits starting downstream consumer-contract implementation, durable write enablement, or route admission during the deferral period.

---

### 3.4 Technical Recommendation (Clearly Distinguished from the Authority Decision)

> **Advisory Status:** The recommendation below is an evidence-based technical assessment only. **It is NOT a Program Authority decision**, does not select an option on the Program Authority's behalf, and leaves `CV-20` at **`DECISION REQUIRED`**.

- **Assessment of the Evidence:**
  1. Both repositories have already accepted a narrow, non-authentication single-user security contract position for one non-production deployment—**IPD `L-IPC-1` rev 2 (`cab04b6f`)** and **IRR `DP-1` amendment (`c71661a1`)**—which uses a provisioned same-host IPC endpoint binding (`A-1` OS/filesystem ACL, `A-2` single active `local_principal_bindings` row in IPD SQLite, `A-3` local audit logging, and IRR server-owned env vars `IIPS_G2_IPC_ENDPOINT` / `IIPS_G2_IPC_TENANT_HINT`) without any login, OIDC, RBAC, multi-user, or tenant-directory infrastructure.
  2. However, that contract position is currently limited to **read-only Gate B off-`main` branches** (`cec70802` on IPD and `110e221f` on IRR), its Windows host provisioning (Gate A′) and 7-item read-only qualification run (Gate C `Q1–Q4, Q9–Q11`) have **not yet been executed on the Windows host**, and **Gate E write policy** (needed for durable writes and `Q5–Q8`) has not been specified or authorized.
- **Technical Recommendation:**
  - **If the Program Authority wishes to validate the Windows host IPC transport before authorizing full read/write portfolio ownership:** select **Option C — Defer**, recording completion of the already-authorized Windows host Gate A′ store provisioning (`P-1`) and the 7-item read-only Gate C qualification run (`Q1–Q4, Q9–Q11`)—together with a Gate E write-policy draft—as the explicit prerequisites for reconsidering `CV-20`.
  - **If the Program Authority wishes to proceed directly to defining full durable read/write portfolio ownership now:** select **Option A — Designate**, designating the provisioned single-principal host/IPC binding (`A-1`/`A-2`/`A-3` under `L-IPC-1` rev 2 and the `DP-1` amendment) as the single-user non-authentication ownership source and directing preparation of the Gate 2 IPD-to-IRR consumer contract and Gate E write-policy specification as the next gated artifact.

---

## 4. Downstream Dependency Chain and Outcome Matrix

### 4.1 Ordered Five-Gate Dependency Chain (Why Designation Alone Authorizes No Implementation or Admission)

Even if the Program Authority selects **Option A — Designate**, four additional sequential gates remain mandatory before durable portfolio capability can become operational or admitted:

1. **Gate 1 — `CV-20` Ownership Source Designation (this decision request):** Program Authority selects Option A and defines source, trust boundary, lifecycle, reset/revocation, and fail-closed failure handling. *(Selects policy only; zero code or fence changes.)*
2. **Gate 2 — Versioned IPD-to-IRR Consumer Contract & Gate E Write Policy:** Specify and obtain Program Authority acceptance of the versioned IPD-to-IRR contract covering transport/framing, operation/request/response schemas, deterministic owner/scope binding under `D-2` §8, refusal of all caller-supplied identity/tenant claims, closed failure vocabulary, BI-08 `contentDigest` idempotency, revision/concurrency semantics, DP-2 Option 2F unresolved-holding refusal, and `CV-22` security-master universe scope.
3. **Gate 3 — Bounded Implementation Authority (`CV-39`):** Separate Program Authority act(s) naming the exact target repository, baseline commit, permitted file set, and how IPD `PortfolioStorePort` / durable store lineage will be wired behind IPD's portfolio domain without silent G24 promotion or unauthorized cross-repo edits.
4. **Gate 4 — Qualification Execution & Result Acceptance (`CV-24` / `CV-38` / Gate C):**
   - Execute Windows host store provisioning (Gate A′ `P-1`) and read-only Gate C (`Q1–Q4, Q9–Q11`).
   - After Gate E write policy and `INV-06` (`Q8` process-stop definition), execute full durable write/restart qualification (`Q5–Q8` / `CV-24` / `CV-38`) proving: create → durable commit → real process stop and restart → read-back; repeated import with identical `contentDigest` producing an idempotent no-op (`BI-08`); broker contribution and SHA-256 lineage preservation across restart; unresolved holding refusal (`DP-2 Option 2F`); and reset/delete/revision conflict recovery—followed by a separate qualification result-acceptance act.
5. **Gate 5 — Route Admission & Fence-Lift Act (`CV-52` / Gate D):** Separate Program Authority admission act naming the exact qualified IPD and IRR commits/tags and explicitly authorizing IRR `/api/user-portfolios*` to wire the qualified adapter and lift the HTTP `503 owner-context-unavailable` fence. *(Production eligibility remains `NOT AUTHORIZED` even after non-production admission.)*

### 4.2 Outcome Matrix by Disposition

| Dimension / Downstream Gate | If **Option A — Designate** is Selected | If **Option B — Decline** is Selected | If **Option C — Defer** is Selected |
|---|---|---|---|
| **`CV-20` Tracker Status** | Transitions to `DECISION ACCEPTED (OPTION A)` in a subsequent signed PA act | Transitions to `DECLINED (FAIL-CLOSED PRESERVED)` | Remains `DEFERRED / DECISION REQUIRED` with recorded prerequisites |
| **IRR `/api/user-portfolios*` HTTP `503` Fence** | **Remains fail-closed at HTTP `503`** until Gates 2–5 complete | **Remains fail-closed at HTTP `503`** | **Remains fail-closed at HTTP `503`** |
| **IPD `main` `PortfolioStorePort` (`SESSION_ONLY` / `durable:false`)** | **Remains `SESSION_ONLY` (`durable: false`)** until Gates 2–5 complete | **Remains `SESSION_ONLY` (`durable: false`)** | **Remains `SESSION_ONLY` (`durable: false`)** |
| **DP-2 Option 2F Unresolved-Write Refusal** | **Preserved** (`evaluatePortSaveGuard` & `refuseUnresolvedPortfolioWrite`) | **Preserved** | **Preserved** |
| **Gate 2: IPD-to-IRR Consumer Contract & Gate E Write Policy** | Eligible to be drafted and submitted for separate PA acceptance | Not pursued | Held until deferral prerequisites are satisfied |
| **Gate 3: Implementation Authority (`CV-39`)** | **Not granted by Option A**; requires separate PA act after Gate 2 | Not pursued | Held |
| **Gate 4: Qualification (`CV-24` / `CV-38` / Gate C)** | **Not granted by Option A**; requires execution + separate acceptance act | Not pursued | Pre-authorized read-only Windows Gate A′/C may proceed if cited as prerequisite |
| **Gate 5: Route Admission (`CV-52` / Gate D)** | **Not granted by Option A**; requires separate PA act after Gate 4 | Not pursued | Held |
| **Production Authorization** | **`NOT AUTHORIZED`** | **`NOT AUTHORIZED`** | **`NOT AUTHORIZED`** |

---

## 5. Preserved Portfolio Safety Fences (Verified In Force)

1. **IRR `/api/user-portfolios*` Fail-Closed at HTTP `503`:** `frontend/server/user-portfolio-transport.ts` (`51704c12a467cd2f718a030b5036bc55c9afa73f`) and `frontend/server/owner-context-unavailable.ts` (`cb8db45d668d28cee7e0a52721001d579a872733`) on IRR `main@e9bb64c2e5aa5c888b689f6e40fc5ae3875ccab6` are untouched and return HTTP `503 owner-context-unavailable` on all 6 route/method pairs.
2. **No Durable Portfolio Writes Implemented or Enabled:** IPD `main` `PortfolioStorePort` (`d61f18dfdce12a7f0c4377a3c6d410026d454089`) and `PortfolioStore` (`3bf852b99e300a8dfa71d3b1b04ed0f7b947b4a5`) remain `SESSION_ONLY` / `durable: false`.
3. **No Promotion of Session-Only or Off-`main` Work as Admitted Capability:** Off-`main` refs (`6828155e`, `2ded0e98`, `cec70802`, `2e11fa3b` on IPD; `6c654be7`, `110e221f`, `5eba01b6`/`470cc698` on IRR) remain unmerged to `main` and are explicitly recorded as non-admitted.
4. **Accepted G-2 Architecture Unchanged:** IPD remains the sole owner of the user-portfolio domain and its persistence boundary (`IIPS_v3.0_G2_DURABLE_USER_PORTFOLIO_ARCHITECTURAL_DECISION.md`).
5. **No Claims of Readiness, Qualification, Admission, or Production Authorization:** Durable user-portfolio capability across IPD and IRR remains **unqualified, unadmitted, and `NOT AUTHORIZED` for production**.

---

## 6. Program Authority Response Template

To resolve `CV-20`, the **Program Authority** may render a decision by selecting exactly one option below:

- [ ] **Option A — Designate:** Designate `[specify non-authentication ownership source]` for the IIPS v3.0 single-user application with:
  - **Trust Boundary & Cross-Domain Scope Mapping:** `[specify]`
  - **Lifecycle Semantics:** `[specify]`
  - **Reset / Revocation Behavior:** `[specify]`
  - **Failure Handling:** Fail closed (`503 owner-context-unavailable` / closed refusal vocabulary; no inferred owner; no partial write).
  - *Acknowledged restriction:* This designation resolves `CV-20` (Gate 1) only and does not authorize implementation, qualification, admission, or production use.
- [ ] **Option B — Decline:** Decline to designate a non-authentication ownership source at this time. Rationale: `[specify]`. Preserve HTTP `503 owner-context-unavailable` on IRR `/api/user-portfolios*` and `SESSION_ONLY` (`durable: false`) on IPD `main`.
- [ ] **Option C — Defer:** Defer the `CV-20` decision. Reason: `[specify]`. Prerequisite(s) for reconsideration: `[specify, e.g., Windows host Gate A' provisioning + 7-item read-only Gate C execution and/or Gate E write-policy draft]`. Preserve all existing fail-closed behavior.
