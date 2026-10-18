# IIPS 3.0 — IPD/IRR Portfolio and Consumer Readiness Reconciliation

**Record date:** 2026-10-18 (UTC)  
**Record type:** Readiness and evidence reconciliation; not a decision, implementation authorization, qualification result, admission, or production authorization.  
**Scope:** Portfolio durability and CV-20; governed security universe and D05 identity; P11 engine-adapter boundary; PIT source/API boundary.  
**Ownership:** IPD records IPD findings. IRR was inspected read-only; no IRR-owned implementation or documentation was changed.

## 1. Executive disposition

The current IPD `main` has an asynchronous `PortfolioStorePort`, but its published implementation is explicitly session-only and non-durable. IPD also has a separate published G24 lineage containing an SQLite-backed durable store and a separate Gate B IPC implementation ref. Neither is the IPD `main` portfolio save path: the Gate B `portfolio.save` operation refuses writes, and Gate C qualification is only authorized for a bounded read-only subset and has not been executed. The existence of a port or of an off-main durable implementation is not proof of an admitted, qualified, restart-durable consumer capability.

IRR `main` has the `/api/user-portfolios*` consumer boundary and returns HTTP 503 `owner-context-unavailable` for valid owner-scoped operations. Its port is not called because no authorized non-authentication ownership source has been established. The exact blocker remains CV-20: the Program Authority must designate such a source or decline to do so. The decision and source/transport evidence must precede qualification and the separate admission decision; the 503 fence remains.

The supposed IRR “13-security baseline” is not a 13-instrument security master. The inspected IRR composition uses 13 certified **sector** reference rows and sets each `canonicalSecurityId` to a sector name. IPD's D05 source is a 2,250-entity universe. Existing IPD records report 52 real Indian equities and 2,198 synthetic broad-universe entities; the deposited D05 records have 2,250 unique company IDs but do not carry a machine-readable real/synthetic discriminator. Widening to all D05 rows without an explicit product/authority decision and approved classification would therefore conflate real and synthetic entities.

The IPD P11 adapter is tested as an IPD library boundary. IRR has a separate engine registry/adapter/API; no IRR source imports `CertifiedSectorEngineId` or IPD's `DataBoundExecutor`. No cross-layer P11 integration is established or required by the inspected G-2 scope (which excludes certified-analytics integration). Library tests do not prove composed IRR behavior.

The IPD PIT source is the `PointInTimeStore` and, at the exact commit pinned by IRR, the public `./pit` package and `PitReadService`. IRR owns the consumer HTTP route and client. The API is reachable and tested in IRR's source, but no UI feature consumes it. The bounded PIT panel versus API-only disposition is still an IRR/Program Authority decision (CV-32, linked to CV-22); IPD must not implement IRR UI.

**No portfolio, universe, identity, engine, PIT, or IRR route code was changed.** This pass records evidence and the smallest remaining decisions only.

## 2. Repositories, refs, and publication state inspected

| Repository | Starting authoritative ref/state | Current verified state | Publication/CI facts |
|---|---|---|---|
| IPD `ramkivs/iips-production-market-data` | Session branch `arena/8e767788-iips-production-market-data` at `467eb529f52820032b17ea0212c92362a96dfe18`; clean worktree at inspection start | `origin/main` also `467eb529f52820032b17ea0212c92362a96dfe18` (PR #8 merge); tags and G24/Gate B refs listed below | PR #8 merged 2026-10-18; check runs `39101407494` and `39101468718` succeeded. PR #9 is merged. No existing open IPD PR was found at inspection. |
| IRR `ramkivs/iips-review-recovered` | Shallow read-only clone of `main` at `9be364b11631291a8602e07fcbdd0c7a9cc6ed06` | GitHub API independently returned the same `main` SHA | PR #131 merged to that SHA; main CI run `39103203648` succeeded. PR #114 is open. No IRR refs or files were changed. |

IPD refs verified by remote query:

- `refs/heads/main` → `467eb529f52820032b17ea0212c92362a96dfe18`.
- `refs/heads/gate-b/local-principal-ipc-implementation` → `cec7080252183a6a5332efe351e61c254d342a2d`.
- `refs/heads/arena/01a0f308-iips-production-market-data` → `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`.
- Annotated tag `iips-pin-np04-2e11fa3b` peels to `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494`.
- Annotated tag `iips-pin-g24-6828155e` peels to `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`.

The IRR dependency is pinned in `frontend/package.json` to the exact IPD commit `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494`; the pin is now tagged. That is distinct from IPD `main` and from the G24 implementation ref. No inference of merge, admission, or qualification follows from the tag.

## 3. Portfolio durability and architectural dependency

### 3.1 Verified IPD implementation states

**IPD `main` (`467eb52`).** PR #8 published the UI port, in-memory store declarations, UI integration, tests, and governance records. In `frontend/src/features/portfolio/portfolioStorePort.ts`:

- `PortfolioStorePort` is an interface for portfolio reads, analytics, revision, and saves; it contains no owner, tenant, principal, credential, or authorization-scope parameter.
- The published implementation is `SessionPortfolioStorePort` over the existing in-memory `PortfolioStore`.
- Both expose `durability: 'SESSION_ONLY'` and `durable: false`. UI wording is explicitly non-durable.
- Save guard behavior refuses unresolved/ambiguous identity under DP-2 Option 2F and refuses caller-supplied identity/scope claims. Existing merge, contribution, content-digest idempotency, and lineage behavior are preserved within that session store.

This is an interface plus session adapter, not a durable backend. `PortfolioStore` uses in-memory state; a process restart loses it. No restart-durable portfolio write path is present on IPD `main`.

**G24 implementation lineage (off `main`).** The published `6828155` ref/tag contains `src/portfolio/durable-store.ts`, `src/persistence/**`, SQLite connection/configuration/migrations, and `tests/g24_a_*` through `g24_h_*`. Source inspection verifies `DurablePortfolioStore`, a `better-sqlite3` connection, IMMEDIATE transactions, and migration-ledger code. This is an actual durable-store implementation in an off-main lineage, not merely an interface. The IRR G-2 implementation record reports 84/84 G24 tests and store-level restart/recovery evidence; those branch tests were not rerun in this pass, and the cited record also says end-to-end process restart was not evidenced. The lineage remains distinct from IPD `main`; its publication does not itself admit it to the product path.

**Gate B IPC ref.** The published `cec7080` ref contains the 15-file Gate B implementation atop its G24 baseline. Its `portfolio.save` path is guarded with `WRITE_NOT_AUTHORIZED`; the Gate B completion handoff expressly says no Gate D/E, no durable-write expansion, no route admission, and no production eligibility. Gate B implementation tests are not durable-write qualification.

### 3.2 Accepted architecture and minimum safe path

The accepted G-2 architectural decision (IRR `main`, `docs/integration/IIPS_v3.0_G2_DURABLE_USER_PORTFOLIO_ARCHITECTURAL_DECISION.md`) sets IPD as owner of the portfolio domain and durable persistence boundary, directs extension/reuse of IPD's existing portfolio domain, preserves the IRR reference portfolio, excludes certified-analytics integration, and deliberately leaves storage technology open. It is architecture direction, not implementation or admission authority. The IPD store-port act is narrower: it authorized dependency inversion only and explicitly excluded a durable adapter, SQLite/G24 integration, endpoint, identity source, provisioning, and writes.

The smallest path consistent with that direction is to preserve the existing portfolio domain and import semantics, then add only an authorized durable adapter/transport behind an IPD-owned boundary. It is not to copy portfolio logic into IRR, turn the UI port into persistence, add a second portfolio store, promote G24 by inference, or start with authentication/OIDC/RBAC/multi-user/PostgreSQL/enterprise infrastructure. Which existing durable lineage is to be extended/reused and how the one-user local principal is established must be fixed by the applicable authority acts before write-capable implementation.

### 3.3 CV-20 and required IPD/IRR contract evidence

The latest inspected IRR tracker entry (CV-CORR-31 / PR #131) updates CV-25, D2b and D4 but does not close CV-20. The capability inventory describes CV-20 as **open / decision required**: no authorized non-authentication ownership source exists. This is the first stop, not a missing storage interface.

**Decision required:** the Program Authority must designate a non-authentication ownership source appropriate to the single-user personal-use scope, with its authority, lifecycle, revocation/reset behavior, failure mode, and exact trusted boundary—or explicitly decline to designate one and retain the fence. No branch-bound OIDC implementation is a substitute. No ambient machine/user identity or client claim is to be presumed authoritative.

**Before a dependent write implementation can proceed, the IPD/IRR evidence set must include:**

1. The rendered CV-20 disposition, naming the allowed ownership source and who may establish/revoke it, or an explicit “decline / remain fenced” result.
2. A versioned, accepted IPD consumer contract that identifies the actual transport/protocol chosen by authority (do not invent an HTTP endpoint), operation/request/response types, stable portfolio identity, owner/scope derivation, error/refusal vocabulary, idempotency/revision semantics, and how the IRR `UserPortfolioPort` is satisfied without a second portfolio domain.
3. A binding identity rule from an independently established local principal to IPD portfolio ownership; caller-supplied owner, tenant, company ID, or portfolio identity must not create authority. The accepted IPD `L-IPC-1` rev-2 clauses C1–C12 are a security-boundary contract, not by themselves the consumer API contract or proof that a non-authentication owner source has been designated.
4. An exact approved implementation object/ref and separate implementation authority, followed by qualification and a separate admission act. IPD implementation and qualification, IRR adapter/consumer integration, route admission, and production authorization remain distinct.
5. When durable writes are authorized: evidence for create → durable commit → process stop/restart → read-back; repeated import with content digest produces an idempotent no-op; contributions and lineage survive restart; unresolved/ambiguous identity refuses before durable mutation; reset/delete/revision semantics and failure recovery match the accepted contract.

The current IRR `userPortfolioPort.ts` declares seven operations and explicit `G2Scope`; the HTTP transport does not construct a scope or invoke that port. The routes currently fail at the owner-context boundary. These interfaces are not evidence that the contract is integrated or admitted.

### 3.4 IRR 503 boundary (verified from current source)

At IRR `main@9be364b`, `frontend/server/executive-transport.ts` dispatches `/api/user-portfolios` and its subpaths to `user-portfolio-transport.ts`. That module validates route/method then calls `respondOwnerContextUnavailable`, returning 503 with `error: 'owner-context-unavailable'` and the reason that no non-authentication ownership source is established. The handler does not read request body, tenant claims, or Authorization. Its tests assert the 503 for list/detail/holdings/reset/context, identical behavior with no bearer or an invalid bearer, and fail-closed path/method handling. Existing route/UI tests do not lift the fence.

The local IRR transport test suite was not executed in this pass: `npm ci` in a disposable IRR clone failed while fetching the pinned GitHub dependency with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. This is an environment/certificate blocker, not a product test failure. Source inspection and the successful IRR main CI run are recorded separately; no browser or local-host validation is claimed.

## 4. Governed universe and real-versus-synthetic distinction

### 4.1 What the two repositories actually contain

**IPD D05.** `src/identity/d05_broad_universe_data.ts` declares a governed broad universe of 2,250 canonical entities and cites the D05 expansion authority and canonical JSON SHA-256 `7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5`. The deposited JSON has 2,250 records and 2,250 unique `companyId` values. The existing IPD operator audit (`BLOCK-3L-BROKER-CSV-FULL-RESOLUTION-AUDIT.md`) and `NON_PRODUCTION_SINGLE_OPERATOR_IDENTITY_BYPASS.md` report the composition as **52 real Indian equities + 2,198 synthetic Tier-2 entities**, with synthetic records beginning at index 52. Treat that split as source-reported evidence; no external listing/issuer verification was performed in this pass. Direct inspection confirms the D05 payload has no explicit `isSynthetic`, entity-kind, or equivalent machine-readable real/synthetic field. IDs and generated-looking names are not a safe substitute for an authorized classification rule.

`SecurityMasterEntity` models canonical `companyId`, ISIN, optional CIN, NSE/BSE listings and scrip codes, status, industry/sector, and effective dates. `SecurityMaster` indexes exact identifiers into `IdentityMappingStore`. Existing code/tests establish effective-date handling and fail-closed unmapped/ambiguous resolution. The broad master includes explicit governed mappings such as AGI GREENPAC → EQ_AGI_IN and a historical UTIBANK mapping; this is not fuzzy matching.

**IRR consumer universe.** In IRR `frontend/server/executive-transport.ts`, `buildGovernedUniverseProvider()` maps the 13 certified decision-matrix **sector** rows and sets `canonicalSecurityId: c.sector`; IRR `EngineRegistry.ts` independently defines 13 certified sector engines. The tracker calls these 13 governed rows. They are not 13 actual tradable security identities. IRR's watchlist consumer accepts these current canonical IDs and its existing behavior returns `404 governed-row-not-found` for an unrepresented identifier. Thus “keep 13” means preserving the present sector-reference behavior; it does not mean retaining an instrument-grade 13-security master.

### 4.2 Source-of-truth options and proposed named acceptance probe

This is a consequential product/source-of-truth decision and is not made here:

- **Option A — retain current IRR 13 sector-reference rows.** Lowest change and preserves current certified-reference behavior. Consequence: it does not identify an owner's real listed holdings; real instrument-level watchlist/portfolio coverage remains unavailable and current missing-row/fail-closed behavior remains.
- **Option B — admit a governed real-equity subset of IPD D05 for the relevant IRR consumer.** The IPD D05 master, not an IRR-maintained duplicate, would own the canonical equity identity. Authority must specify the eligible real subset, how the synthetic 2,198 are excluded or visibly treated, and the consumer's exact identity mapping. A blanket 2,250-row widening is not supported by the current data shape because synthetic classification is not typed in the payload. Consequence: broader real-equity coverage only after an approved roster/identity contract and qualification; absent members still fail closed.
- **Option C — decline universe widening for this release.** Record the boundary explicitly and retain Option A behavior; no silent dependency-driven change.

**Proposed acceptance probe name:** `CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` (proposal for the CV-22 decision record; not executed and not a new authority act). Once the eligible roster is approved, run it through the actual IRR consumer boundary against the exact IPD D05 revision. Required assertions: (a) each approved real instrument resolves only by exact approved identifier(s) to exactly one expected D05 `companyId`, with exchange/listing/effective-date preserved; (b) no sector name, ambiguous collision, unknown instrument, or fuzzy/partial symbol produces an equity identity; (c) synthetic records are rejected from the “real equity” result set or labeled only under a separately approved non-production synthetic disposition; (d) the IRR consumer observes the same canonical identity and provenance; (e) misses retain the current explicit 404/refusal behavior and do not create/save a fallback identity. Include the audit's concrete out-of-baseline real examples (e.g. ASK AUTOMOTIVE, AMBUJACEM, HCLTECH, M&M, ZOMATO) only after their expected canonical identities are authority-checked; include unknown, ambiguous, and effective-dated negative cases.

**Fallback while undecided:** keep the current 13 sector-reference rows unchanged; return the existing not-governed 404/refusal for an unrepresented instrument; preserve DP-2 Option 2F refusal for unresolved holdings. Do not fall back to a synthetic D05 identity, infer by company name, or claim broader equity coverage. Consequence: no successful resolution or durable save for those securities; this is an explicit coverage limitation, not a fabricated success.

**Entitlement:** offline certification and static identity data do not establish rights to real-time, historical, display, or redistribution market data. IPD's D114/P17 records report NSE commercial entitlement/licensing as **not established / externally gated**. Any real-market-data use requires the relevant exchange/vendor agreement and evidence for the applicable fields, territory, user count, display/redistribution, historical retention, and vendor attribution. This pass did not acquire or establish entitlement.

## 5. D05 identity and WSD P11 certified-sector adapter boundary

### 5.1 Identity semantics and completion evidence

The canonical IPD identifier is `companyId` (e.g. `EQ_RELIANCE_IN`); exchange symbols, ISIN/CIN, BSE scrip codes, and effective dates are lookup attributes. The consuming IRR PIT contract is different: it accepts `securityId = ISIN:<isin>:<series>`, `domain`, and `asOf`; it intentionally does not accept `companyId` or infer a series. The D05 listing model alone does not establish the consumer's PIT series. No mapping from a sector archetype or arbitrary company ID to a series-qualified security ID may be invented.

The unresolved acceptance requirement is not “add fuzzy lookup.” It is (i) an authority-approved distinction between real and synthetic D05 records for any real-security consumer and (ii) a consumer-approved, exact identity contract at the point of use. Completion evidence must bind an approved corpus revision/hash and eligibility roster to exact positive, negative, ambiguous, and effective-date tests at the actual consumer boundary. External issuer/exchange correctness and data entitlement need their own evidence; source shape/tests cannot prove them.

### 5.2 P11 engine adapters

IPD `src/engine_adapters/types.ts` defines 13 `SECTOR_*` IDs plus `CSIP_COMPOSITE`; `DataBoundExecutor` applies identity lookup, namespaced inputs, defaults, frozen scoring, provenance and version vector. `tests/wsd_p11_engine_adapters.test.ts` covers normal execution, namespace rejection, unmapped identity failure, fallback quality, recalculation triggers, and deterministic coverage of all 13 sector models/CSIP. This is an IPD library/test contract.

IRR's `iips-platform/src/integration/EngineRegistry.ts` has a separate 13-engine taxonomy and `EngineApiAdapter`, composed by IRR `/api/engines`; IRR source does not import IPD `CertifiedSectorEngineId` or `DataBoundExecutor`. The identifier sets are not proven equivalent. The IPD P11 tests do not constitute a composed IRR application test, and IRR E2E-025 tests prove IRR's own API adapter only. No evidence found requires a new cross-layer endpoint/interface for the existing IPD library contract. If the intended acceptance is cross-repository scoring, the Authority must first specify taxonomy/identity equivalence and the consumer contract; G-2 §7 currently excludes certified-analytics integration. No interface or HTTP route is added here, and this is not an IPC qualification claim.

## 6. PIT source/API boundary and CV-32

IPD owns `PointInTimeStore`, its query semantics, source data, and PIT read-service/package boundary. IRR's pinned IPD commit `2e11fa3b` exposes the public `./pit` package (`src/pit/package.ts`): `PitReadService`, typed requests/results, and the point-in-time store. The request requires `securityId`, `domain`, and `asOf`; `securityId` is series-qualified `ISIN:<isin>:<series>`, misses are explicit, and results are not substituted. The public package does not make IRR the owner of PIT storage or vintage resolution.

IRR owns `frontend/server/pit-transport.ts`, `PitReadPort`, the IPD adapter, `/api/pit/market-data`, and `frontend/src/api/pit.ts`. The route is securityId-addressed and passes typed PIT misses/provenance; IRR tests include source-level boundary tests and a composed runtime test using the exact pinned IPD package. There is no current feature under `frontend/src` consuming `fetchPitAsOf`; CV-32 remains open. The repo inventory says its stop is a PA display decision: mount a bounded PIT panel or record the seam API-only.

**Evidence needed for the decision:** name the intended viewer/consumer and instrument identity source; define bounded panel fields/interactions (security, domain, as-of, provenance, typed miss/error and no live fallback) if UI is selected; then IRR-owned reachable UI/accessibility/browser acceptance evidence composed with the existing API. If API-only is selected, record the reason and retain API/runtime tests without implying UI readiness. Either route requires the existing IPD PIT contract and tests to remain unchanged absent an IPD decision. No IRR UI code was touched.

## 7. Validation and evidence limits

**Executed in IPD at the inspected source tree:**

- `npm ci` — PASS (33 packages installed; npm reported 3 dependency audit findings: 2 moderate, 1 high; no automated fix applied).
- `npm run build` — PASS (`tsc` plus Vite build; Vite emitted the existing large-chunk advisory).
- `npm test` — PASS: 49 compiled test files; 84 suites; 556 tests passed, 0 failed. This includes `bi07_portfolio_store_port`, `p04_governed_offline_security_master`, `p04_expanded_broad_universe_runtime_qualification`, and `wsd_p11_engine_adapters`.
- Remote ref inspection: `git ls-remote` for main, G24/Gate B refs and both pin tags; direct `git fetch` of G24 and Gate B refs; tree/source inspection at their exact published commits.
- D05 JSON inspection: 2,250 records and 2,250 unique company IDs. The real/synthetic composition remains source-reported, not independently validated against exchange data.

**IRR:** inspected a shallow read-only clone at `9be364b`; verified the current branch/commit with GitHub API; read the routes, ports, API tests, PIT composition, engine registry, tracker, and existing PR/CI state. GitHub main CI run `39103203648` succeeded. A local `npm ci` was attempted only in `/tmp/irr-audit/frontend` and stopped on `UNABLE_TO_VERIFY_LEAF_SIGNATURE` fetching IPD from `codeload.github.com`; no TLS verification bypass was used. No IRR test result is claimed from that attempt.

**Not established or claimed:** Windows host qualification, browser/localhost validation, current G24 full-suite execution, end-to-end durable portfolio create/restart/read, IRR portfolio admission, portfolio writes, D05 issuer truth beyond source records, commercial entitlement, PIT UI acceptance, cross-layer IPD P11 composition, release, or production readiness.

## 8. Remaining decisions, blockers, and next actionable task

1. **CV-20 (first dependency):** Program Authority designates or declines a non-authentication owner source for the single-user scope. Keep `/api/user-portfolios*` at 503 until this is recorded and all later gates are separately satisfied.
2. **G-2 storage/transport reconciliation:** after CV-20, name the permitted IPD durable lineage and exact IPD-to-IRR operation contract, then issue bounded implementation authority. Do not treat the session port, Gate B IPC ref, or a G24 tag as a write path.
3. **G-2 qualification/admission:** execute only the rendered, bounded Gate C procedure on its designated Windows host; the seven authorized read-only items are not a result, Q5–Q8 remain deferred, and a distinct result-acceptance/admission act is still required. Durable write evidence must include the cases in §3.3 when their applicable authority is granted.
4. **CV-22:** Program Authority decides whether to retain the current sector-reference behavior, admit a specifically classified real D05 subset, or defer widening; bind the choice to `CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` and explicit fallback/consequences.
5. **CV-32:** IRR/Program Authority records bounded PIT panel versus API-only disposition; any UI implementation and acceptance belong to IRR.
6. **P11:** no IPD action until the intended consumer is decided. Existing library tests are the current boundary; do not create an HTTP endpoint or bridge to IRR's distinct engine taxonomy by implication.
7. **Entitlement:** before real-market data use, supply applicable exchange/vendor licensing and attribution evidence; no entitlement is inferred from D05 membership or offline test success.

**Final package status:** IPD investigation/readiness work is documented and its source build/tests pass; durable portfolio implementation and all later gates remain separately bounded as above. IRR was verified read-only; its owner-context 503, open CV-20/CV-22/CV-32 decisions, and open PR #114 remain unchanged. No cross-repository implementation, qualification, admission, or production claim is made.
