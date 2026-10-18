# IIPS v3.0 — G-2 Gate 2: Versioned IPD-to-IRR User-Portfolio Consumer Contract — v1.0.0

| Field | Value |
|---|---|
| **Contract ID** | `IIPS-V3-G2-IPD-IRR-PORTFOLIO-CONSUMER-CONTRACT` |
| **Contract version** | **`1.0.0`** (document). Wire protocol version **`v = 1`**. |
| **Record ID** | `IIPS-V3-G2-IPD-IRR-PORTFOLIO-CONSUMER-CONTRACT-V1-2026-10-18-01` |
| **Status** | **ACCEPTED by the Program Authority on 2026-10-18 under decision G2-D1 (approved in full)** — recorded in `IIPS-V3-G2-GATE2-ACCEPTANCE-AUTHORITY-REQUEST-2026-10-18-01` §6. **ACCEPTED is not IMPLEMENTED · NOT QUALIFIED · NOT ADMITTED · NOT AUTHORIZED FOR WRITES.** Write operations remain refused under Gate E W-1 until Gates 3, 4 and 5 are separately satisfied. Acceptance-time corrections C-1 to C-4 are listed in the "Acceptance-time corrections" row below. |
| **Owning repository** | **IPD** (`ramkivs/iips-production-market-data`). IPD owns the portfolio domain, persistence/store, the IPC endpoint and this read/write service contract (G-2 §1; L-IPC-1 C2). |
| **Consumer** | **IRR** (`ramkivs/iips-review-recovered`). IRR owns its consumer adapter, its `/api/user-portfolios*` HTTP routes, the HTTP status mapping, and UI. IRR obligations are stated as **conformance requirements on IRR**. This document changes no IRR file. |
| **Ownership source** | `IIPS-V3-CV20-OPTION-A-OWNERSHIP-SOURCE-DESIGNATION-2026-10-18-01`: the single `ACTIVE` A-2 binding in the IPD store |
| **Security contract** | `L-IPC-1` rev 2 (accepted blob `cab04b6f94618c9afad1440882ebf63437fdf6f8`), clauses C1–C12, plus the acceptance decision; IRR DP-1 amendment (`c71661a1…`) |
| **Write semantics** | Governed by the Gate E write policy `IIPS-V3-G2-GATE-E-PORTFOLIO-WRITE-POLICY-2026-10-18-01` (ACCEPTED, revision 1, under G2-D2; fail-closed). Write operations are **defined but not authorized** by this contract. |
| **Baselines** | As published: IPD `main@2d12413446c29c08f6f357b8ac67e34594f30286`; IRR `main@d32c8122f0ba3cee7f1549c7279d1d53c45cb1d9`. Verified at acceptance: IPD `main@b16d79fa116007f793620119c4c943996a286da2` and IRR `main@b1f1ea0fe9fba31aacae54180e1231f2b06014ba` (intervening changes are documentation-only; see the decision request §6.4). |
| **Label** | `non-production, single-principal, same-host IPC` |
| **Pre-acceptance corrections** | 2026-10-18, post-publication (IPD PR #14 → follow-up): (1) `portfolio.analytics` marked **RESERVED / not available in v1**; the original row's `{ portfolioId, currentPrices?, priceAsOf? }` shape matched neither IPD `main` nor G-2 §7. (2) Caller-identity key count corrected from 26 to **29** (verified at `d61f18df…`). Both corrections were made while the contract is PROPOSED, so the version stays `1.0.0`. Source: IRR PKG-02A D-2(a), independently re-verified. |
| **Acceptance-time corrections** | 2026-10-18, at Program Authority acceptance under G2-D1 (decision request §6.2): **C-1** §5.1 caller-identity key count corrected from 26 to **29** (matches §2 and CV-20 record D-8). **C-2** §2 and §6 IRR route facts corrected: 6 route paths and 12 route/method pairs including `HEAD`; the fenced `POST /api/user-portfolios/:portfolioId/reset` route exists on IRR `main`; the fenced `GET`/`HEAD /api/user-portfolios/context` route maps to no v1 operation. **C-3** OC-3: `IIPS_G2_IPC_ENDPOINT` and `IIPS_G2_IPC_TENANT_HINT` are not on IRR `main`; their existence is Gate 3 scope. **C-4** §5.1 and §7: revoked is non-`ACTIVE` (Class P). No operation, payload, result, outcome or wire rule changed; version stays `1.0.0` (clarifying correction, V-1). |

---

## 1. Scope

This contract specifies the wire boundary between the IRR server process (client) and the IPD portfolio process (server) for **user-owned portfolios** in the single-user, one-laptop, non-production deployment. It covers:

- owner-context input and provenance (§3);
- transport and framing (§4);
- operation set and semantics (§6);
- errors and refusals (§5);
- lifecycle, reset and revocation effects (§7);
- compatibility and versioning (§8);
- IRR conformance requirements (§9);
- what it does **not** authorize (§10).

**Excluded:** the certified IRR reference portfolio, which stays distinct (G-2 §1); Reports (G-2 §8; CV-21); PIT; watchlists, collaboration and settings (the F-3 carrier regime); the HTTP `/api/ipd/*` G24 surface (CV-50 closed path).

---

## 2. Reused artifacts (not redefined here)

| Concern | Reused source on `main` | Blob |
|---|---|---|
| Durability vocabulary `'SESSION_ONLY' \| 'DURABLE'` | IPD `frontend/src/features/portfolio/portfolioStorePort.ts` | `d61f18dfdce12a7f0c4377a3c6d410026d454089` |
| Post-authorization refusal codes `REFUSED_UNRESOLVED_IDENTITY`, `REFUSED_STORE_GUARD`, `REVISION_CONFLICT`, `INVALID_REQUEST`, `UNAVAILABLE` | same file, `PortfolioPortRefusalCode` | same |
| Caller-identity key refusal (29 keys at blob `d61f18df…`) | same file, `CALLER_SUPPLIED_IDENTITY_KEYS` / `findCallerSuppliedIdentityKeys` | same |
| Portfolio record, contribution SHA-256 lineage, BI-08 `contentDigest`, MERGE/REPLACE | IPD `frontend/src/features/portfolio/portfolio-store.ts` | `3bf852b99e300a8dfa71d3b1b04ed0f7b947b4a5` |
| Canonical identity authority | IPD `src/identity/security_master.ts`, `src/identity/mapping_store.ts` (`resolveCompanyId`: `UNMAPPED_IDENTIFIER` / `AMBIGUOUS_COLLISION`) | `e260fd90…`, `eec60c09…` |
| IRR route table (**6 route paths; 12 route/method pairs including `HEAD`**) and HTTP `503` fence | IRR `frontend/server/user-portfolio-transport.ts`, `owner-context-unavailable.ts` | `51704c12…`, `cb8db45d…` |
| IRR port shape (7 operations) | IRR `frontend/server/user-portfolio/userPortfolioPort.ts` | `ba0001e88c83b070e4f16a3cdb35d34c82ec0200` |

The off-`main` read-only Gate B refs (IPD `cec70802…`, IRR `110e221f…`) are **design evidence only**. They are not admitted, and they are not bound by this contract until a Gate 3 act names a conforming implementation.

---

## 3. Owner-context input and provenance

| # | Rule |
|---|---|
| OC-1 | **No owner context crosses the wire.** Requests carry no principal, user id, subject, credential, owner, tenant, membership, scope, endpoint id, or identity field (C3, C7). |
| OC-2 | IPD derives `{applicationUserId, tenantId}` **per request** from the single `ACTIVE` A-2 binding in its store, after framing validation and caller-authority refusal and before dispatch (C5.2, C5.5). No identity caching across requests; one request per connection. |
| OC-3 | **The tenant hint is non-authoritative input** (Program Authority decision G2-D4, 2026-10-18). It does not establish ownership. IPD's **ACTIVE binding** (one `ACTIVE` A-2 row plus exactly one `ACTIVE` membership) is the **sole** ownership and tenant source. IPD validates any hint against that binding; no request header, cookie, query parameter, body or other request-supplied value can override it (OC-7). **In v1 no hint is transmitted:** IRR must not send one, and IPD refuses any frame that carries a tenant hint or tenant-identity key (C7; §5.1). IRR's server-owned configuration is intended to be limited to an endpoint setting and an IRR-local "binding provisioned" precondition. **Acceptance-time note:** neither `IIPS_G2_IPC_ENDPOINT` nor `IIPS_G2_IPC_TENANT_HINT` exists on IRR `main@b1f1ea0`. Both names appear only in the off-`main` Gate B design evidence (CV-20 record §3). Their existence and naming are Gate 3 scope. Resolves CV-20 record discrepancy D-3 and the wording discrepancy with DP-1 §6.4 (decision request §6.3). |
| OC-4 | The endpoint name is not a credential (L-IPC-1 §4.1). Possessing it grants nothing beyond what the OS DACL already grants. |
| OC-5 | IRR reads its configuration **per call** (no cache), so changes and removal take effect on the next request. |
| OC-6 | **Responses never disclose owner identifiers.** No `applicationUserId`, `tenantId` or `endpointId` appears in any result or outcome payload. |
| OC-7 | IRR must never derive owner context from HTTP headers, cookies, query parameters, request bodies, browser origin, the F-3 carrier `(owner-7f3a91c2, irr-domain-4b82d6e1)`, or any OIDC artifact. |

---

## 4. Transport and framing

| # | Rule |
|---|---|
| T-1 | Same-host endpoint owned and bound by IPD: a Windows named pipe on the deployment host; a UNIX domain socket with owner-only directory/socket modes on POSIX dev/CI (L-IPC-1 §4.6). No TCP, HTTP, URL or network listener serves this contract (C1). |
| T-2 | Frame = `uint32` big-endian length prefix + UTF-8 JSON object. **One request and at most one response per connection**; extra pipelined frames are a protocol violation. |
| T-3 | **Request envelope** keys are exactly `v` (integer `1`), `op` (one of §6), `payload` (operation-specific, optional where stated), and `requestId` (optional opaque correlation string; **not** an idempotency key and not authority). Any other key is refused. |
| T-4 | v1 size caps: request ≤ **64 KiB**; response ≤ **256 KiB**. A larger request is refused before parsing. IPD caps concurrent connections (C5.4). |
| T-5 | **No bytes before a valid, authorized request** (C5.1/Q9): no greeting, banner, version, or data. |
| T-6 | **Success envelope:** `{ "v": 1, "ok": true, "op": <op>, "requestId"?: <echo>, "result": <operation result> }`. |
| T-7 | **Post-authorization outcome envelope:** `{ "v": 1, "ok": false, "op": <op>, "requestId"?: <echo>, "outcome": <code from §5.2>, "detail"?: <non-disclosing evidence> }`. |
| T-8 | Client timeouts are IRR-owned. Default and maximum are set in IRR's implementation scope. A timeout is treated as §5.1 class "unavailable". For writes it is **outcome-unknown** (Gate E W-9). |

---

## 5. Errors and refusals

### 5.1 Class P: pre-authorization refusals (wire: **zero bytes, connection closed**)

These are emitted **uniformly**: the caller cannot tell them apart, and nothing about owners, portfolios or bindings is disclosed (C6). Reasons are recorded only in IPD's bounded in-memory diagnostic sink (local; never serialized, never durable).

| Internal reason | Trigger |
|---|---|
| `MALFORMED_FRAME`, `OVERSIZE_FRAME`, `PROTOCOL_VERSION_UNSUPPORTED`, `UNKNOWN_OPERATION` | Framing/envelope violations, `v ≠ 1`, `op` outside §6 |
| `CALLER_SUPPLIED_AUTHORITY` | Any C7 key anywhere in the envelope or payload, including `companyId`, `runtimeCompanyId`, `identityStatus`, `resolutionDisposition`, `tenantHint`, `tenantId` and the **29** IPD caller-identity keys (`CALLER_SUPPLIED_IDENTITY_KEYS`, IPD blob `d61f18df…`) |
| `BINDING_ABSENT`, `BINDING_INVALID` | Zero, more than one, malformed, or non-`ACTIVE` binding/membership (**a `REVOKED` binding is non-`ACTIVE`**, so revocation is refused here; see §7); store fault during resolution |
| `CAPACITY_EXCEEDED`, `IDLE_TIMEOUT` | C5.4 caps |

### 5.2 Class A: post-authorization outcomes (wire: typed, non-disclosing envelope)

These are emitted only **after** the provisioned principal has been resolved. They concern only that principal's own resources.

| `outcome` | Meaning | Disclosure rule |
|---|---|---|
| `RESOURCE_UNAVAILABLE` | Portfolio missing, **foreign, tenant-mismatched, or tombstoned**: deliberately indistinguishable (unauthorized ≡ missing) | Never states which |
| `INVALID_REQUEST` | Payload fails per-operation shape validation (non-identity fields) | Field path only; no values echoed |
| `REVISION_CONFLICT` | `expectedRevision` ≠ current revision | May return the current revision number of the principal's own portfolio |
| `REFUSED_UNRESOLVED_IDENTITY` | DP-2 Option 2F / C12: any holding without exactly one IPD-side canonical resolution | Per-holding `UNMAPPED_IDENTIFIER` / `AMBIGUOUS_COLLISION` evidence (symbol/ISIN as supplied); no partial save |
| `REFUSED_STORE_GUARD` | Existing consolidation guards (empty vector, weight sum, invalid fields) | Guard name only |
| `WRITE_NOT_AUTHORIZED` | Any write operation while the Gate E/3/4/5 chain is unsatisfied (Gate E W-1) | None |
| `UNAVAILABLE` | Post-authorization store fault | None; no internals (no SQL, path, driver, stack) |

**C6 application (stated for acceptance, no clause amended).** L-IPC-1 C6 requires uniform fail-closed behaviour with **no owner disclosure**. Class P satisfies it by emitting zero bytes. Class A satisfies it because every Class A outcome concerns only the single provisioned principal's own resources, and `RESOURCE_UNAVAILABLE` folds missing, foreign and tombstoned together. The off-`main` read-only Gate B design (zero bytes for *all* refusals) is stricter. It does not conform to v1 for write outcomes and is not admitted. A Gate 3 implementation must conform to v1.

---

## 6. Operation set (closed; no dynamic dispatch)

| `op` | Kind | Payload (v1) | Result (v1) | IRR route it would back (after Gate D only) |
|---|---|---|---|---|
| `portfolio.list` | Read | none | `PortfolioSummary[]`: `portfolioId`, `portfolioName`, `revision`, `holdingsCount`, `totalMarketValue`, `lastUpdated` | `GET /api/user-portfolios` |
| `portfolio.get` | Read | `{ portfolioId }` | `PortfolioDetail`: summary fields + `holdings`, `contributions` (with SHA-256 lineage), `weightSumPercentage`, `provenanceDigest`, `durability`, `durable` | `GET /api/user-portfolios/:id` |
| `portfolio.revisions` | Read | `{ portfolioId }` | `RevisionEntry[]`: `revision`, `operation ∈ {INITIAL, MERGE, REPLACE, RESET, DELETE}`, `committedAt`, `contentDigest?` | `GET /api/user-portfolios/:id/revisions` |
| `portfolio.analytics` | **RESERVED: not available in v1** | n/a. *(IPD `main` exposes only the session-local `getAnalytics(portfolioId?: string)`.)* | n/a. A reserved `op` is outside the v1 operation set: IPD refuses it as `UNKNOWN_OPERATION` (Class P, §5.1). | **None.** G-2 §7 excludes connecting user-owned portfolio data to the certified scoring/analytics path pending a separate governance decision. Enabling it needs that decision plus a contract minor revision (§8). |
| `portfolio.create` | **Write** (Gate E) | `{ portfolioName? }` | `PortfolioDetail` at `revision: 1`, `operation: INITIAL` | `POST /api/user-portfolios` |
| `portfolio.save` | **Write** (Gate E) | `{ portfolioId, expectedRevision, mode ∈ {MERGE, REPLACE}, holdings[], contentDigest?, broker? }` | `{ disposition ∈ {SAVED_NEW_BATCH, MERGED_INTO_EXISTING, ALREADY_IMPORTED_NO_OP}, revision, durability, durable }` | `PUT /api/user-portfolios/:id/holdings` |
| `portfolio.reset` | **Write** (Gate E) | `{ portfolioId, expectedRevision }` | `PortfolioDetail` (empty holdings; new `RESET` revision) | `POST /api/user-portfolios/:portfolioId/reset` (**fenced route present on IRR `main`; returns 503**; corrected at acceptance, C-2) |
| `portfolio.delete` | **Write** (Gate E) | `{ portfolioId, expectedRevision }` | `{ portfolioId, deletedAt }` (tombstone) | `DELETE /api/user-portfolios/:id` |

**Holding payload rules (all writes):** holdings carry broker-observed fields (symbol, ISIN, exchange, quantity, prices, broker). **`companyId`, `runtimeCompanyId`, `identityStatus` and `resolutionDisposition` are refused (Class P)**. Canonical identity is resolved IPD-side only (C12; Gate E W-6).

**Fenced IRR route without a v1 operation (acceptance-time note, C-2).** `GET` and `HEAD` `/api/user-portfolios/context` exist on IRR `main` and return the HTTP `503` fence. They map to **no** v1 operation and carry no owner context. Whether IRR keeps, renames or removes that route is IRR Gate 3 scope. It may not carry any v1 operation without a contract revision.

**Durability fields:** `durability`/`durable` report what the serving store actually is. `durable: true` / `'DURABLE'` is permitted **only** for a result served from, or committed to, the designated durable store (Gate E W-11). IRR must surface the value unchanged and must never synthesize it.

---

## 7. Lifecycle, reset and revocation effects

| Event | Effect on this contract |
|---|---|
| Binding not yet provisioned (current state: Gate A′ NOT EXECUTED) | IPD does not bind the endpoint, or refuses every request with Class P. IRR returns `503 owner-context-unavailable`. |
| Binding **revoked** (one-way) | Every request whose binding resolution starts after the revocation commit is refused (Class P). Writes re-validate the binding inside the mutating transaction (Gate E W-3). Data is retained and inaccessible. **Accepted disposition (G2-D5):** reads and writes through the revoked binding are denied; data is **not** transferred to a replacement binding; data is **not** silently deleted; any recovery, reassignment or deletion requires an explicit, governed act (Gate E W-16). Failure behaviour must be defined and tested before qualification or admission (Gate E QE-8). This is an approved policy for future implementation, **not** an implemented or tested behaviour. |
| Binding **reset/rotated** | Revocation followed by a new, separately authorized provisioning act. Between the two, the state is "not provisioned". Whether old data is re-associated is **not determined** (CV-20 record R-6). |
| IPD restart | No contract state survives except the store. The binding is re-resolved per request. A revoked binding stays revoked. |
| IPD unavailable / endpoint absent | IRR connection failure → `503 owner-context-unavailable`. No fallback store, owner or surface. |
| IRR restart | No effect (IRR holds no identity or portfolio state). |
| Portfolio `RESET` / `DELETE` | Write operations (§6), not ownership-lifecycle events; Gate E W-10/W-16. |

---

## 8. Compatibility and versioning

| # | Rule |
|---|---|
| V-1 | The document version is semver: **major** for any breaking change to envelope, operation set, payload/result required fields, outcome vocabulary or semantics; **minor** for additive optional result fields or new Class A detail fields; **patch** for editorial changes. Every version requires PA acceptance before it is effective. |
| V-2 | Wire `v` is an integer that changes only with a major version. IPD refuses unknown `v` (Class P). IRR must refuse to send to a server whose contract version it does not implement. No silent negotiation or downgrade. |
| V-3 | Unknown request keys are refused (T-3). IRR must ignore unknown **optional** result fields only within the same major version. |
| V-4 | Adding an operation is a **minor** change only if it is a read. Adding or changing any write operation is a **major** change and requires a Gate E policy revision. |
| V-5 | **Relationship to IRR `G2_CONTRACT_VERSION = '2'`** (`frontend/server/user-portfolio/userPortfolioContract.ts`, blob `0dec72eb…`). That IRR document describes the G24 **HTTP** wire (`/api/ipd/portfolios`, `x-ipd-tenant-id`, `IPD_AUTH`/401, `FORBIDDEN`/403) of the CV-50-closed path. Upon acceptance of v1, **for the IPC path this contract supersedes that wire description**. The IRR-side revision of that file is IRR implementation scope (IRR Gate 3) and is **not** made here. |
| V-6 | Drift control: an implementation claiming conformance must record the contract version and the blob digests of its conforming surfaces (Q11). |

---

## 9. IRR conformance requirements (IRR-owned implementation; future)

| # | Requirement |
|---|---|
| IRR-1 | Until a **Gate 5** admission act names qualified IPD and IRR commits, every `/api/user-portfolios*` route/method pair stays at HTTP `503 owner-context-unavailable` exactly as on `main@d32c812`. |
| IRR-2 | After admission: Class P, connection failure, timeout, and configuration-absent/invalid all map to `503 owner-context-unavailable`, indistinguishably. `RESOURCE_UNAVAILABLE` → `404`. `REVISION_CONFLICT` → `409`. `INVALID_REQUEST` → `400`. `REFUSED_UNRESOLVED_IDENTITY` / `REFUSED_STORE_GUARD` → IRR's existing non-2xx 2F refusal shape. `WRITE_NOT_AUTHORIZED` → non-2xx refusal. `UNAVAILABLE` → `503`. Exact status codes for the refusal rows are IRR's choice within "non-2xx, no partial success". |
| IRR-3 | `IPD_AUTH` (401) and `FORBIDDEN` (403) are **not used** on the IPC path. There is no credential, and a binding failure is "owner context unavailable". |
| IRR-4 | IRR re-enforces OC-7 and C7 before sending (forbidden wire keys), and enforces DP-2 Option 2F pre-port refusal as on `main` today. |
| IRR-5 | C8: the browser-facing surface serving owner-scoped routes is loopback-bound, with no wildcard CORS on those routes. C9: a first-party signal is required for state changes; this is CSRF hardening only and **never** authentication. |
| IRR-6 | IRR creates no portfolio store, cache-of-record or identity state (C11; DP-1 amendment §6(8)). |
| IRR-7 | IRR does not auto-retry writes (Gate E W-9). |

---

## 10. What this contract does NOT authorize

Neither publication nor acceptance of this contract authorizes:

- any IPD or IRR implementation (Gate 3 / CV-39);
- promotion, merge, cherry-pick, re-pin or admission of `6828155e`, `2ded0e98`, `cec70802`, `6c654be7`, `110e221f`, `470cc698`/`5eba01b6`;
- provisioning beyond the rendered Gate A′ act;
- any durable write, or any `durable: true` claim on IPD `main`;
- qualification or result acceptance (Gate A′/Gate C/Q5–Q8; Gate 4);
- route admission or removal of the IRR `503` fence (Gate 5 / CV-52 / Gate D);
- any login, OIDC, authentication, RBAC, multi-user, tenant-directory or enterprise element;
- any change to G-2, D-2, H-18, DP-2 Option 2F, L-IPC-1 or the DP-1 amendment;
- connecting user-owned portfolio data to any scoring/analytics path (G-2 §7; `portfolio.analytics` is reserved);
- release readiness or production use.

---

*Prepared by Arena Agent Mode as a Gate 2 draft under the CV-20 Option A designation. Accepted by the Program Authority on 2026-10-18 under G2-D1 (`IIPS-V3-G2-GATE2-ACCEPTANCE-AUTHORITY-REQUEST-2026-10-18-01` §6). Acceptance is not implementation, qualification, admission, write authority or a fence lift.*
