# Stage 1 Admission Decision Record — Dhan Credential and Authenticated Transport Admission

- **Document ID**: `IPD-DHAN-STAGE1-ADMISSION-2026-11-08`
- **Date**: `2026-11-08`
- **Status**: **ADMITTED FOR LOCAL NON-PRODUCTION SERVER-SIDE FOUNDATION ONLY** (`SYNTHETIC_VERIFIED / NOT_LIVE_VERIFIED / PRODUCTION_NOT_AUTHORIZED`)
- **Authoritative Provider Repository (IPD)**: `ramkivs/iips-production-market-data` (evaluated from `main` baseline `59fdfd157632dbdbc220ae03d9d0b8e047d4ef19`)
- **Downstream Consumer Repository (IRR)**: `ramkivs/iips-review-recovered` (inspected read-only at `main` `820e7efced6800ec077c021d1c7fafaeb093e1fc`; **unmodified**; PR #515 and PR #516 untouched)
- **Governed Authorities**: `AD-01..AD-18`, `AD-CHARTER-2026-01`, `AD-17` (Zero-Plaintext Secret Governance), `WS-A P03` (`SecretRef`), `WS-A P04` (`D114SecurityIdentity`), `Gate 3` (Portfolio Write Fence), `DHAN-D1`, `DHAN-D2`, `DHAN-P4..P7`

---

## 1. Decision and Scope

### 1.1 Admission Decision

Stage 1 establishes the binding governance and technical boundary for Dhan credential ownership and authenticated market-data transport across IPD (`ramkivs/iips-production-market-data`) and IRR (`ramkivs/iips-review-recovered`) in a **local, single-user, non-production** environment:

1. **IPD Exclusive Ownership**: IPD exclusively owns Dhan credentials, `SecretRef` pointers, credential resolution/lifecycle, vendor DTO normalization, and authenticated Dhan provider transport.
2. **Server-Side Secret Storage**: Dhan credentials (`client-id`, `access-token`) must remain exclusively inside IPD-controlled server-side secret storage referenced by `vault://` `SecretRef` pointers (`src/security/secret_ref.ts`).
3. **Single Permitted Vendor Egress**: Network egress to `https://api.dhan.co/v2` is permitted **only** through IPD's server-side provider transport (`DhanApiClient` + IPD-internal `DhanServerHttpsTransport`), never from IRR and never from browser code.
4. **Permitted IRR Consumption Surface**: IRR is authorized (for Stage 2 server-side integration) to consume **only** IPD's provider-neutral `MarketDataTransportClient` over local loopback HTTP (`http://127.0.0.1:<port>`) authenticated with `IIPS_MARKET_DATA_TRANSPORT_TOKEN`.
5. **Prohibition on IRR Provider Access**: IRR must never receive raw Dhan credentials, resolve Dhan `SecretRef` pointers, instantiate `DhanApiClient` / `DhanServerHttpsTransport`, or open connections to `api.dhan.co`.
6. **Browser Credential & Transport Isolation**: Browser bundles (`./portfolio-ui`, IPD `dist-frontend`, IRR client bundle) must never contain or access Dhan credentials, transport tokens, `MarketDataTransportClient`, `DhanApiClient`, or authenticated Dhan endpoints.
7. **Non-Production Local Scope**: Admission is strictly restricted to a **local, single-user, non-production** workstation environment bound to local loopback (`127.0.0.1` / `::1` / `localhost`).
8. **Production Exclusion**: Production Dhan credentials, production vendor egress, and production deployment are **NOT AUTHORIZED** and fail closed at runtime with `PRODUCTION_NOT_AUTHORIZED`.
9. **Fail-Closed Typed Outcomes**: Missing credentials, invalid/expired/revoked credentials, authentication failures, malformed canonical identities, rate limits, timeouts, and transport errors fail closed with explicit typed outcomes and zero credential leakage.
10. **Portfolio Immutability & Write Fence Preservation**: Quote and historical market-data retrieval are strictly read-only, have zero coupling to portfolio persistence (`src/persistence/**`, `src/ipc/**`), and leave the Gate 3 portfolio write fence (`evaluatePortSaveGuard` -> `WriteNotAuthorizedError`) completely intact.

### 1.2 Explicit Non-Conflation Statement (No Live Access Claimed)

- **No Dhan credentials have been provisioned or fabricated** during Stage 1, and **no live authenticated request to `api.dhan.co` was executed**.
- Service readiness (`service: 'UP'`, `providerConfiguration: 'CREDENTIAL_REFERENCES_CONFIGURED' | 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'`) and `describeDhanConfig(...)` confirm local process/configuration structure only; `ServiceHealth` explicitly reports `liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS'` and `providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED'`.
- The static P7 instrument-master artefact (`evidence/dhan-p7/`, 96 NSE/BSE rows from public unauthenticated scrip-master CSVs dated `2026-11-06`) proves deterministic CSV normalization only, **not** authenticated Dhan API connectivity or live quote entitlement.

### 1.3 Four-Way Capability Inspection Matrix Across IPD

| Inspected IPD Area | (a) Implemented & Tested (Synthetic / Local Loopback) | (b) Implemented, Not Live-Verified | (c) Missing (Out of Stage 1 or Deferred Operational Wiring) | (d) Blocked by External Credential Provisioning / Provider Access |
| :--- | :--- | :--- | :--- | :--- |
| **1. Secret-ref & config resolution** (`src/security/secret_ref.ts`, `src/providers/dhan/dhan_config.ts`, `src/security/scanner.ts`) | `validateSecretRef` (`vault://`, status enum, ISO `expiresAt`), `resolveDhanProviderConfig` (`CREDENTIALS_UNAVAILABLE`, `CONFIGURATION_INCOMPLETE`, `CREDENTIALS_EXPIRED`, `PRODUCTION_NOT_AUTHORIZED`), `describeDhanConfig` pointer-only summary, `SEC-01` zero-plaintext scan. | Resolution against a live host secret store populated with real non-production Dhan `vault://` entries. | Concrete host OS / local vault `DhanCredentialResolver` adapter (currently `PreAccessDhanCredentialResolver` returns `null` by default; `MockEnterpriseVaultDriver` is OQ test-only). | Provisioning of non-production Dhan `client-id` and `access-token` in local IPD secret storage. |
| **2. Authenticated transport composition** (`src/providers/dhan/dhan_api_client.ts`, `dhan_server_egress.ts`, `dhan_market_data_service.ts`, `dhan_market_data_http.ts`) | `DhanApiClient` per-request header injection (`access-token`, `client-id`), `PreAccessNoNetworkTransport` default, IPD-internal `DhanServerHttpsTransport` (HTTPS, origin-pinned, TLS-verified, `redirect: 'error'`), `DhanMarketDataService` composition, loopback `createMarketDataHttpServer` (`IIPS_MARKET_DATA_TRANSPORT_TOKEN`, `timingSafeEqual`, 16 KiB body cap, 10s timeout). | End-to-end `DhanApiClient` + `DhanServerHttpsTransport` wire exchange with `https://api.dhan.co/v2`. | Standalone local daemon CLI entrypoint starting `createMarketDataHttpServer` with a live host vault resolver (currently composed programmatically). | Live Dhan sandbox / non-production API access & local `IIPS_MARKET_DATA_TRANSPORT_TOKEN` operator secret provisioning. |
| **3. `MarketDataTransportClient` & `./dhan-server` export** (`src/providers/dhan/dhan_market_data_http.ts`, `src/providers/dhan/package.ts`) | Exported from `iips-production-market-data/dhan-server` with provider-neutral typed outcomes (`MarketDataTransportQuoteOutcome`, `MarketDataTransportHistoricalOutcome`, `MarketDataTransportHealthOutcome`); enforces `http://` loopback-only URLs, non-empty bearer token, canonical `D114SecurityIdentity`, and non-production runtime; `DhanServerHttpsTransport` withheld from `./dhan-server`. | Exercise from IRR's live local server process against a running IPD market-data daemon backed by Dhan. | Stage 2 IRR migration (`frontend/server/market-data/dhanMarketDataRoute.ts` in IRR at `820e7efc` currently calls `resolveDhanProviderConfig` / `describeDhanConfig` in pre-access mode rather than `MarketDataTransportClient`). | Non-production Dhan credentials for live quote responses through the local daemon. |
| **4. Provider auth & token-expiry handling** (`src/providers/dhan/dhan_failures.ts`, `dhan_config.ts`, `dhan_api_client.ts`) | Pre-flight `SecretRef` `EXPIRED`/`REVOKED` & `expiresAt` checks, vault `EXPIRED`/`REVOKED` error classification -> `CREDENTIALS_EXPIRED`, resolved `credentials.expiresAt` pre-flight check (zero network calls on expired token), HTTP `401`/`403` -> `AUTHENTICATION_FAILURE`, zero secret echoing. | Behaviour against real Dhan 24-hour JWT expiry responses and vendor `errorCode` bodies on `/v2/marketfeed/quote`. | Automated or operator-assisted 24-hour Dhan `access-token` rotation / renewal workflow in local secret storage. | External Dhan account token issuance (Dhan access tokens expire every 24 hours unless renewed). |
| **5. Network-egress boundaries** (`dhan_server_egress.ts`, `dhan_market_data_http.ts`, `tests/g3_no_network_listener.test.ts`) | Loopback-only binding (`127.0.0.1`/`::1`/`localhost`) enforced on `createMarketDataHttpServer` and `MarketDataTransportClient`; `DhanServerHttpsTransport` enforces `https:`, `DHAN_DEFAULT_BASE_URL` origin/path prefix, `NODE_TLS_REJECT_UNAUTHORIZED !== '0'`, `redirect: 'error'`, no URL credentials/query; G3 IPC has zero TCP listeners. | Live TLS handshake and certificate chain validation against `api.dhan.co` from the target workstation. | None for Stage 1 boundary enforcement. | External network route & entitlement to `https://api.dhan.co/v2` in the operator's local environment. |
| **6. Operational controls & failure reporting** (`dhan_operational_controls.ts`, `dhan_normalizer.ts`, `dhan_historical_adapter.ts`) | P4 bounded caches (`2048` quote / `512` historical), token-bucket rate limiter (`5/s` quote, `2/s` historical), concurrency limiter (`4`/`2`), in-flight coalescing, non-transient retry exclusion (auth/expiry/config never retried), stale quote suppression (`STALE_DATA_SUPPRESSED`), failure code/message preservation across `RefreshOutcome`. | Calibration of rate-limit budgets and IST trade-timestamp parsing against live Dhan market-hours traffic and `429` headers. | Persistent cross-restart telemetry/audit sink (intentionally in-memory for local non-production scope). | Live Dhan market-feed traffic and vendor rate-limit header observation. |
| **7. Tests & package-consumer verification** (`tests/dhan_*.test.ts`, `scripts/verify-public-package.mjs`, `scripts/public-package-consumer.mts`) | `1351` unit/integration tests across `104` suite files (`1350` pass, `0` fail, `1` skipped), including `tests/dhan_stage1_admission.test.ts`, `dhan_p5_service_transport.test.ts`, `dhan_p6_exact_identity.test.ts`, `dhan_d3d_contract_drift.test.ts`, `package_dhan_server_export.test.ts`, and `npm run test:package-consumer` (`PASS`, `forbiddenHits: []`). | Live qualification test suite (`DHAN-OQ-LIVE`, gated on external non-production credentials). | Stage 2 cross-repo IRR route integration test invoking `MarketDataTransportClient`. | External non-production Dhan credentials required before any live qualification test can run. |

---

## 2. Credential Ownership and Storage Boundary

1. **Exclusive IPD Ownership**: Only IPD server-side code may reference, resolve, or hold Dhan credentials (`client-id` and `access-token`).
2. **Pointer-Only Configuration (`AD-17` / `P03`)**:
   - `resolveDhanProviderConfig` (`src/providers/dhan/dhan_config.ts`) accepts **only** `vault://` secret paths via `IIPS_DHAN_CLIENT_ID_SECRET_PATH` and `IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH`, plus optional metadata (`IIPS_DHAN_VAULT_PROVIDER`, `IIPS_DHAN_SECRET_VERSION`, `IIPS_DHAN_SECRET_STATUS`, `IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT`).
   - Any raw credential, `http(s)://` URL, relative path, or non-`vault://` string in secret-path environment variables fails `validateSecretRef` (`src/security/secret_ref.ts`) and returns `CONFIGURATION_INCOMPLETE`.
3. **Ephemeral In-Memory Resolution**:
   - `DhanApiClient` (`src/providers/dhan/dhan_api_client.ts`) resolves `DhanCredentialMaterial` per outbound call via `DhanCredentialResolver`, constructs the outbound `access-token` and `client-id` HTTP headers solely on the ephemeral `DhanHttpRequest`, and never caches, logs, serializes, or returns credential values.
   - By default, `DhanApiClient` uses `PreAccessDhanCredentialResolver`, which returns `null` and fails closed with `CREDENTIALS_UNAVAILABLE`.
4. **Static Secret Scanning**: `SecretScanner` (`src/security/scanner.ts`, enforced in `tests/cross_cutting_security_and_governance.test.ts` `SEC-01`) scans source trees to prevent hardcoded tokens, API keys, or bearer secrets from entering Git.

---

## 3. Authenticated Transport Ownership

1. **Two Strictly Separated Transport Layers**:
   - **Layer A — Vendor Egress (`IPD Server -> https://api.dhan.co/v2`)**: Owned exclusively by IPD (`DhanApiClient` + `DhanServerHttpsTransport` in `src/providers/dhan/dhan_server_egress.ts`). Authenticates to Dhan using `access-token` and `client-id` headers resolved from IPD's vault. `PreAccessNoNetworkTransport` remains the unconditional default on `DhanApiClient` so unconfigured instances cannot open network sockets.
   - **Layer B — Local Consumer Transport (`IRR Server -> IPD Server`)**: Owned and served by IPD (`createMarketDataHttpServer` in `src/providers/dhan/dhan_market_data_http.ts`). Authenticates local server-to-server callers via `Authorization: Bearer <IIPS_MARKET_DATA_TRANSPORT_TOKEN>` verified with `node:crypto` `timingSafeEqual`.
2. **Credential Domain Separation**: `IIPS_MARKET_DATA_TRANSPORT_TOKEN` is a local inter-process shared secret between IRR's server and IPD's local market-data server. It is **never** a Dhan credential and is never forwarded to `api.dhan.co`; conversely, Dhan `access-token` / `client-id` values never cross Layer B to IRR.
3. **Public Export Withholding**: `DhanServerHttpsTransport` is exported only from IPD's internal barrel (`src/providers/dhan/index.ts`) and is **deliberately excluded** from the public package subpath `iips-production-market-data/dhan-server` (`src/providers/dhan/package.ts`), verified by `tests/dhan_stage1_admission.test.ts` (`S1-03`) and `scripts/verify-public-package.mjs`.

---

## 4. Permitted IRR Consumption Interface

1. **Authorized Interface**: On the server side only, IRR is authorized to import and invoke `MarketDataTransportClient` (and its provider-neutral types) from `iips-production-market-data/dhan-server`:
   - `MarketDataTransportClient`
   - `MARKET_DATA_ROUTES`, `MARKET_DATA_TRANSPORT_TOKEN_ENV`
   - `QuoteRequest`, `HistoricalServiceRequest`, `ServiceHealth`
   - `MarketDataTransportClientOptions`, `MarketDataTransportFailure`, `MarketDataTransportFailureCode`
   - `MarketDataTransportQuoteOutcome`, `MarketDataTransportHistoricalOutcome`, `MarketDataTransportHealthOutcome`
2. **Provider-Neutral Wire Contract**:
   - Requests carry canonical IPD identifiers only (`companyId` and exact P04 `D114SecurityIdentity` `ISIN:<isin>:<series>`). Dhan numeric `dhanSecurityId` values, vendor DTOs, and Dhan headers never cross the `MarketDataTransportClient` boundary.
   - Responses carry canonical `CanonicalEnvelope<MarketQuotePayload>` (`D01_QUOTES` with `freshness: 'CURRENT' | 'STALE'`), canonical `DhanHistoricalNormalizationResult` (`D02`), or `ServiceHealth`.
3. **Prohibited IRR Usage**:
   - IRR **must not** import or instantiate `DhanApiClient`, `DhanMarketDataSource`, `DhanMarketDataService`, `createMarketDataHttpServer`, `resolveDhanProviderConfig`, or `PreAccessNoNetworkTransport` in Stage 2+ quote-retrieval paths, and **must never** receive `IIPS_DHAN_*` environment variables.
   - *Backward-compatibility note*: Existing symbol exports on `./dhan-server` remain intact in Stage 1 (`tests/dhan_d3d_contract_drift.test.ts` `D3D-05`) so IRR `main` (`820e7efced6800ec077c021d1c7fafaeb093e1fc`, merged PR #516) continues to compile without modification until Stage 2 migrates `frontend/server/market-data/dhanMarketDataRoute.ts` onto `MarketDataTransportClient`.

---

## 5. Network-Egress Boundary

```text
[Browser UI (IRR / IPD)]
   |  (Same-origin local HTTP; ZERO Dhan credentials, ZERO transport tokens, ZERO Dhan DTOs)
   v
[IRR Server Process (local non-production)]
   |  MarketDataTransportClient (Bearer IIPS_MARKET_DATA_TRANSPORT_TOKEN)
   |  Permitted target: ONLY http://127.0.0.1:<port> | http://[::1]:<port> | http://localhost:<port>
   v
[IPD Market-Data HTTP Server (createMarketDataHttpServer, loopback-only)]
   |  DhanMarketDataService -> P4 Operational Controls -> DhanApiClient -> DhanServerHttpsTransport
   |  Permitted vendor egress: ONLY https://api.dhan.co/v2/* (TLS verified, redirect: 'error')
   v
[Dhan External API (https://api.dhan.co/v2)]  <-- NOT INVOKED IN PRE-ACCESS MODE
```

Technical enforcement implemented in IPD:
- **Loopback Server Binding (`createMarketDataHttpServer`)**: Rejects non-loopback `host` options (`0.0.0.0`, `::`, external IPs) both at construction and inside a guarded `server.listen` wrapper (`isLoopbackTransportHost` allows only `127.0.0.1`, `::1`, `[::1]`, `localhost`).
- **Loopback Client Pinning (`MarketDataTransportClient`)**: Validates `baseUrl` prior to `fetch`; rejects non-`http:`, non-loopback hostnames (including `https://api.dhan.co/v2`), embedded URL credentials, and query strings with `{ ok: false, failure: { code: 'TRANSPORT_FAILURE', ... } }` before opening any socket.
- **Hardened Vendor HTTPS Egress (`DhanServerHttpsTransport`)**:
  - Requires `https:` protocol and exact origin + path prefix match against `allowedBaseUrl` (default `https://api.dhan.co/v2`).
  - Refuses execution if `NODE_TLS_REJECT_UNAUTHORIZED === '0'` (preserving full TLS certificate verification).
  - Rejects URLs containing `username`, `password`, or query strings (`search`).
  - Sets `redirect: 'error'` so `access-token` and `client-id` headers can never be redirected to a third-party host.
  - Enforces bounded per-request `AbortSignal.timeout(request.timeoutMs)`.

---

## 6. Authentication, Expiry, and Failure Behaviour

Every failure across `resolveDhanProviderConfig`, `DhanApiClient`, `DhanMarketDataService`, `createMarketDataHttpServer`, and `MarketDataTransportClient` fails closed with an explicit typed code and without throwing unhandled exceptions to `MarketDataTransportClient` callers:

| Failure Condition | Layer Detecting | Typed Code Returned | HTTP Status (Layer B) | Retry Policy (P4) |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV=production` or `IIPS_DEPLOYMENT_ENV=production` | Config / ApiClient / Egress / HTTP Server / TransportClient | `PRODUCTION_NOT_AUTHORIZED` | Server refuses start; Client fails pre-flight | Never retried |
| Missing/blank `IIPS_MARKET_DATA_TRANSPORT_TOKEN` | HTTP Server / TransportClient | `UNAUTHENTICATED` | Server refuses start; Client fails pre-flight | Never retried |
| Invalid `Authorization: Bearer` token on `/v1/*` | HTTP Server -> TransportClient | `UNAUTHENTICATED` | `401` | Never retried |
| Missing `IIPS_DHAN_*_SECRET_PATH` or `PreAccessDhanCredentialResolver` | Config / ApiClient | `CREDENTIALS_UNAVAILABLE` | `502` | Never retried |
| Non-`vault://` secret path or invalid `expiresAt` timestamp | Config / ApiClient | `CONFIGURATION_INCOMPLETE` | `502` | Never retried |
| `SecretRef` status `EXPIRED`/`REVOKED`, vault `EXPIRED`/`REVOKED`, or `expiresAt <= now` (24h token expiry) | Config / ApiClient | `CREDENTIALS_EXPIRED` | `502` | Never retried |
| Dhan HTTP `401` or `403` | ApiClient | `AUTHENTICATION_FAILURE` | `502` | Never retried |
| Dhan HTTP `429` or local P4 rate/concurrency budget exhausted | ApiClient / OperationalControls | `RATE_LIMITED` | `429` | Bounded backoff (vendor) |
| Malformed `D114SecurityIdentity` or missing `companyId` | TransportClient / HTTP Server | `MALFORMED_REQUEST` | `400` (or client pre-flight) | Never retried |
| Unmapped canonical `(companyId, securityId)` in `DhanInstrumentRegistry` | MarketDataSource | `UNMAPPED_INSTRUMENT` | `502` | Never retried |
| Quote trade timestamp older than staleness threshold | QuoteNormalizer | `STALE_DATA_SUPPRESSED` | `502` | Never retried |
| Request exceeds timeout (`timeoutMs`) | ApiClient / HTTP Server / TransportClient | `TIMEOUT` / `REQUEST_TIMEOUT` | `502` / `504` | Bounded (max 1 retry) |
| Non-JSON body or invalid DTO/envelope | ApiClient / Normalizer / TransportClient | `MALFORMED_RESPONSE` | `502` | Never retried |
| Socket error, TLS refusal, redirect refusal, or `PreAccessNoNetworkTransport` | Egress / ApiClient / TransportClient | `TRANSPORT_FAILURE` | `502` | Bounded (transient only) |

---

## 7. Browser Credential Isolation

Browser isolation is enforced across four independent controls:
1. **Public Browser Subpath (`./portfolio-ui`)**: `src/ui/portfolio_ui_package.ts` exports exactly 22 broker-import UI/contract symbols (`SessionPortfolioStorePort` with `SESSION_ONLY` / `durable: false`) and imports nothing from `src/providers/dhan/**`, `src/ipc/**`, or `src/persistence/**` (`tests/dhan_stage1_admission.test.ts` `S1-06`).
2. **Package Export Map (`package.json`)**: `./dhan-server` is an explicit Node/server-only subpath compiled via `tsconfig.dhan-package.json`; `scripts/verify-public-package.mjs` bundles `./portfolio-ui` for `--platform=browser` with esbuild and asserts zero occurrences (`forbiddenHits: []`) of `DhanApiClient`, `PreAccessNoNetworkTransport`, `DhanServerHttpsTransport`, `MarketDataTransportClient`, `IIPS_MARKET_DATA_TRANSPORT_TOKEN`, `IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH`, `api.dhan.co`, and `dhan-server`.
3. **Production Frontend Bundle (`dist-frontend`)**: Vite production build output (`dist-frontend/assets/*.js`) contains zero references to Dhan server modules, endpoints, or credential/transport environment variable names.
4. **Dev-Only Offline Fixture Harness**: `frontend/src/features/dev/dhan-d2-dev-harness.ts` is gated behind `import.meta.env.DEV` and uses static in-memory fixtures only, with zero credential or network access (`tests/dhan_d2_ui_mock_demonstration.test.ts`).

---

## 8. Non-Production Scope Restrictions & Portfolio Write Fence

1. **Local Single-User Workstation Scope**: Stage 1 admits local loopback execution for a single operator on a non-production machine only. Multi-user, multi-tenant, LAN-exposed, container-ingress, or cloud-hosted execution is outside scope.
2. **Operational Guardrails**: All requests traverse `DhanMarketDataService` (`src/providers/dhan/dhan_operational_controls.ts`), enforcing bounded caches, per-endpoint rate limits, concurrency caps, in-flight request coalescing, and non-transient retry suppression.
3. **Portfolio State Immutability & Write Fence Integrity**:
   - `src/providers/dhan/**` has **zero imports** from `src/persistence/**` or `src/ipc/**`.
   - Quote and historical retrieval return read-only canonical envelopes and never mutate `SessionPortfolioStorePort` or `DurablePortfolioStorePort`.
   - Gate 3's write fence (`evaluatePortSaveGuard()` in `src/persistence/portfolio_store.ts` and `DurablePortfolioStorePort` in `src/persistence/durablePortfolioStorePort.ts`) remains unconditionally disabled-by-default, rejecting all durable write attempts with `WriteNotAuthorizedError` (`tests/dhan_stage1_admission.test.ts` `S1-10`, `tests/g3_write_gate.test.ts`).

---

## 9. Explicit Production Exclusion

**PRODUCTION ACCESS IS NOT AUTHORIZED.**

- **Production Dhan Credentials**: Prohibited. Neither live trading credentials nor production market-data credentials may be configured or admitted under Stage 1.
- **Production Vendor Egress**: Prohibited. `DhanServerHttpsTransport` and `DhanApiClient` check `isDhanProductionEnvironment` (`NODE_ENV === 'production'` or `IIPS_DEPLOYMENT_ENV === 'production'`) on every call and fail closed with `PRODUCTION_NOT_AUTHORIZED` before credential resolution or socket creation.
- **Production Service / Client Deployment**: Prohibited. `resolveDhanProviderConfig`, `createMarketDataHttpServer`, and `MarketDataTransportClient` all refuse execution when `NODE_ENV=production` or `IIPS_DEPLOYMENT_ENV=production`.
- Any future production admission requires separate program-level governance gates, live operational qualification (`DHAN-OQ-LIVE`), security review, and explicit written authorization.

---

## 10. Remaining External Prerequisites and Blockers

Before live non-production Dhan quote retrieval can occur in Stage 2+, the following external prerequisites and downstream tasks must be satisfied:

1. **External Blocker — Non-Production Dhan Credential Provisioning**: An operator-owned non-production Dhan `client-id` and `access-token` must be externally provisioned and stored in IPD-controlled local secret storage (`vault://...`).
2. **IPD Local Host Vault Resolver & 24h Renewal Operationalization**: Wiring a concrete local host `DhanCredentialResolver` implementation (reading from the operator's local secret store rather than `PreAccessDhanCredentialResolver`) and an operator renewal procedure for Dhan's 24-hour `access-token` validity window, plus local daemon startup wiring for `createMarketDataHttpServer` with `IIPS_MARKET_DATA_TRANSPORT_TOKEN`.
3. **Live Wire & Rate-Limit Qualification (`NOT_LIVE_VERIFIED`)**: Executing controlled non-production verification against `https://api.dhan.co/v2/marketfeed/quote` and `/v2/charts/historical` to confirm live DTO field shapes, IST `last_trade_time` formatting, and rate-limit behaviour prior to changing `providerQualification` from `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED`.
4. **Stage 2 IRR Server Route Migration**: Updating IRR (`ramkivs/iips-review-recovered`, untouched in Stage 1) so `frontend/server/market-data/dhanMarketDataRoute.ts` consumes IPD's `MarketDataTransportClient` over local loopback instead of calling pre-access config helpers directly.

---

## 11. Acceptance Criteria and Verification Evidence

| # | Stage 1 Policy Criterion | Enforcing Implementation | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **1** | IPD exclusively owns Dhan credentials, `SecretRef`s, lifecycle & provider transport | `src/providers/dhan/dhan_config.ts`, `dhan_api_client.ts`, `dhan_server_egress.ts` | `tests/dhan_d1_provider_foundation.test.ts`, `tests/dhan_stage1_admission.test.ts` (`S1-01`, `S1-03`) |
| **2** | Credentials remain in IPD server-side `vault://` secret storage | `src/security/secret_ref.ts`, `src/security/scanner.ts`, `dhan_config.ts` | `tests/wsa_p03_secret_ref.test.ts`, `tests/cross_cutting_security_and_governance.test.ts` (`SEC-01`), `S1-01/02` |
| **3** | Vendor egress permitted only via IPD authenticated server-side transport | `src/providers/dhan/dhan_server_egress.ts` (HTTPS, origin-pinned, TLS-intact, `redirect: 'error'`) | `tests/dhan_stage1_admission.test.ts` (`S1-03/05`) |
| **4** | IRR authorized to consume provider-neutral `MarketDataTransportClient` server-side | `src/providers/dhan/dhan_market_data_http.ts`, `src/providers/dhan/package.ts` | `tests/dhan_p5_service_transport.test.ts` (`P5-05..08`), `scripts/public-package-consumer.mts`, `S1-04` |
| **5** | IRR never receives raw Dhan credentials or instantiates vendor egress | `DhanServerHttpsTransport` withheld from `./dhan-server`; no Dhan secrets on wire | `tests/package_dhan_server_export.test.ts`, `scripts/verify-public-package.mjs`, `S1-03/05` |
| **6** | Browser code never accesses Dhan credentials, transport, or endpoints | `src/ui/portfolio_ui_package.ts`, `scripts/verify-public-package.mjs` | `verify-public-package.mjs` (`forbiddenHits: []`), `tests/dhan_d2_ui_mock_demonstration.test.ts`, `S1-06` |
| **7** | Restricted to local, single-user, non-production loopback environment | `isLoopbackTransportHost` in `dhan_market_data_http.ts` (server + client) | `tests/dhan_stage1_admission.test.ts` (`S1-04`, `S1-07`), `tests/g3_no_network_listener.test.ts` |
| **8** | Production credentials, egress & deployment NOT AUTHORIZED | `isDhanProductionEnvironment` -> `PRODUCTION_NOT_AUTHORIZED` across all 5 entrypoints | `tests/dhan_stage1_admission.test.ts` (`S1-07/08`) |
| **9** | Missing/expired/invalid credentials, auth & transport failures fail closed with typed outcomes | `dhan_failures.ts`, `dhan_config.ts`, `dhan_api_client.ts`, `dhan_market_data_http.ts`, `dhan_operational_controls.ts` | `tests/dhan_stage1_admission.test.ts` (`S1-01/02/09`, `S1-04/09`), `tests/dhan_p4_operational_controls.test.ts` |
| **10** | Quote retrieval does not mutate portfolio state; G3 write fence intact | Zero persistence imports in `src/providers/dhan/**`; `DurablePortfolioStorePort` guard | `tests/dhan_stage1_admission.test.ts` (`S1-10`), `tests/g3_write_gate.test.ts` |

### Executed Verification Summary (IPD Workspace)

- `npx tsc --noEmit`: **PASS** (`0` errors)
- `npm run build`: **PASS** (`tsc`, `vite build`, `build:portfolio-ui-package`, `build:pit-package`, `build:dhan-package` all exit `0`)
- `npm test`: **PASS** (`104` suite files, `1351` tests executed, `1350` passed, `0` failed, `1` skipped; `[test-guard] OK`)
- `npm run test:package-consumer`: **PASS** (`result: "PASS"`, strict TypeScript consumer compilation with `exactOptionalPropertyTypes: true` and `skipLibCheck: false`, verbatim IRR consumer compilation & runtime check PASS, browser bundle `forbiddenHits: []`)
