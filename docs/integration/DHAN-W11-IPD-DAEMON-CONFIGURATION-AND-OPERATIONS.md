# W-11 — IPD Market-Data Daemon Configuration and Operational Specification

- **Document ID**: `IPD-DHAN-W11-DAEMON-CONFIGURATION-2026-11-16`
- **Repository**: `ramkivs/iips-production-market-data` (`IPD`)
- **Integration Base**: `main` at `b4a9f0f3601c2c56960aa15796370af0b7664d39` (W-11); DPAPI source restored from `8bbc299620bf4e88bd5f57f3f784b6894d99c3c9`
- **IPD W-11 Scope Status**: **COMPLETE (IPD-OWNED CONFIGURATION, RECONCILIATION & SYNTHETIC VERIFICATION); DPAPI RESTORATION VERIFIED ON THIS BRANCH**
- **Overall Roadmap W-11 Status**: **PARTIAL** *(pending separate operator-executed, version-correlated connected-daemon verification across IRR and IPD on the approved Windows host)*
- **Operating Boundary**: **LOCAL, SINGLE-USER, NON-PRODUCTION ONLY (`PRODUCTION_NOT_AUTHORIZED` IN PRODUCTION)**

> **Zero-Secret & Non-Live Evidence Notice (AD-17 / D-7):** This specification is derived
> from IPD's W-11 baseline plus the restored DPAPI lineage and verified exclusively with
> deterministic, offline synthetic tests. No live Dhan vendor requests were executed, no
> Dhan credentials or transport tokens were provisioned or inspected, and no secret values,
> operator-specific `vault://` paths, or credential-carrier filesystem locations appear in
> this document. Canonical logical key-path names below are identifiers, not OS paths.

---

## 1. Scope, Roadmap W-11 Boundary, and `main` Lineage Reconciliation

### 1.1 W-11 Baseline and Restored DPAPI Lineage

This document specifies the runtime configuration, environment-variable handling, defaults,
loopback transport contract, credential-backend behavior, startup/shutdown rules, HTTP
endpoints, and operational controls on this branch, which brings the known-good DPAPI lineage
(`8bbc299620bf4e88bd5f57f3f784b6894d99c3c9`) forward to the W-11 `main` baseline
(`b4a9f0f3601c2c56960aa15796370af0b7664d39`). The earlier W-11 document described
`main` at `1ce6a829a7ce65550356a0071c108a60f2d813be`; that description of a *past*
source tree is retained as history, not current runtime guidance:

- **Stage 1 & P4–P7 Foundation**: `src/providers/dhan/dhan_config.ts`,
  `src/providers/dhan/dhan_local_daemon.ts`, `src/providers/dhan/dhan_local_vault_resolver.ts`,
  `src/providers/dhan/dhan_market_data_http.ts`, `src/providers/dhan/dhan_market_data_service.ts`,
  `src/providers/dhan/dhan_operational_controls.ts`, `src/providers/dhan/dhan_server_egress.ts`,
  and `evidence/dhan-p7/qualification-manifest.json` (`4,680` `QUALIFIED` NSE/BSE mappings out of
  `5,180` retained records).
- **W-07 (`#168`)**: Versioned `ServiceHealth` contract (`DHAN_HEALTH_CONTRACT_VERSION = 2`) and
  fail-closed `validateDhanServiceHealth`.
- **W-08 (`#169`)**: Bounded in-process `DhanProviderStateRecorder` (`DHAN_AUTH_LATCH_THRESHOLD = 2`)
  and explicit single-shot `DhanMarketDataService.verifyConnection` / `DhanApiClient.probeOnce`.
- **W-09 (`#170`)**: Authenticated loopback `GET /v1/diagnostics` (`DHAN_DIAGNOSTICS_CONTRACT_VERSION = 1`)
  and `MarketDataTransportClient.diagnostics()` under D-7 §4.1 disclosure bounds.
- **W-10 (`#172`)**: Authenticated loopback `POST /v1/connection/verify`
  (`DHAN_VERIFICATION_CONTRACT_VERSION = 1`) and `MarketDataTransportClient.verifyConnection()`.
- **Restored DPAPI W-01..W-04 and W-06**: `WINDOWS_DPAPI` SecretRefs with two distinct
  logical key paths; owner-only ACL and per-user DPAPI carrier backend; fail-closed daemon
  selector (`IIPS_DHAN_VAULT_BACKEND`, default `disabled`); `dhan:credential` utility for
  provisioning/rotation/verification; strict UTC expiry; and bounded transport-token parsing.
  These additions are internal to IPD and do not remove or roll back W-07..W-11 endpoints.
- **Coordinated IRR Pin**: Authoritative IRR `main` (`ramkivs/iips-review-recovered`,
  re-verified in IRR PR `#572` at `752fb3e89da1f5e7f50802e15a7bf3b1af472e19` following IRR W-10
  PR `#569`) pins `iips-production-market-data` to `1ce6a829a7ce65550356a0071c108a60f2d813be`.
  This is a historical IRR pin, **not** evidence that IRR already consumes this restored branch;
  an operator must version-correlate and test both repositories before connected use.

### 1.2 Reconciliation of the Earlier Unmerged Candidate Lineage

The earlier W-11 audit correctly noted that the candidate DPAPI branch had **not** been merged
at its then-current `main` commit. This restoration intentionally brings the known-good
`8bbc2996` implementation onto the W-11 baseline; the old "not on main" guidance no longer
applies to the resulting code. Do not mistake the two independent settings below for aliases:

| Earlier discrepancy | Behavior after this restoration |
| :--- | :--- |
| `IIPS_DHAN_VAULT_BACKEND` | **Now supported** by the daemon (`DHAN_VAULT_BACKEND_ENV`): `disabled` by default, or explicitly `windows-dpapi`. Unknown values refuse startup at phase `validate` without echoing the value. An unset selector never enables vendor egress. |
| `WINDOWS_DPAPI` in `IIPS_DHAN_VAULT_PROVIDER` | **Now admitted** as `VaultProvider`; this selects the *SecretRef metadata format*, not the runtime backend. Config validation accepts separate `vault://` paths with the correct `client-id` and `access-token` leaf names; actual D-1 carriers use `DHAN_CLIENT_ID_KEY_PATH` and `DHAN_ACCESS_TOKEN_KEY_PATH` so mismatched scopes cannot read them. To use DPAPI at runtime also select `windows-dpapi`, provision both carriers and pass the readiness probe on an approved Windows host. |
| `IIPS_DHAN_QUOTE_MAX_ATTEMPTS` | **Still unsupported.** Quote retry attempts remain the governed code constant (`maxAttempts = 3`); this variable is not read. |
| Zone-less `IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT` | **Now refused** by `parseStrictUtcTimestamp` across config, resolver, API client, and diagnostics. An explicit `Z` or numeric timezone offset is required; no host-local interpretation or implicit `Z` is permitted. |
| Pre-W-07..W-10 route surface | **Not restored over newer routes.** W-07 health v2, W-08 recorder, W-09 diagnostics, W-10 connection verification, and all nine IPD routes remain available. |

---

## 2. Environment Variables Read by IPD (Exact `main` Implementation)

IPD intentionally ships **no `.env` or `.env.example` file** in the repository so placeholder
files are never confused with active runtime configuration or accidentally populated with live
secrets in a tracked working tree. All runtime configuration is read from the process
environment (`process.env` or an explicitly passed `DhanEnvSource` in programmatic tests).

### 2.1 Daemon Listener & Transport Authentication Variables

| Environment Variable | Source Constant & Module | Default Value | Validation & Exact Runtime Behavior on `main` |
| :--- | :--- | :--- | :--- |
| `IIPS_MARKET_DATA_DAEMON_HOST` | `MARKET_DATA_DAEMON_HOST_ENV` (`src/providers/dhan/dhan_local_daemon.ts`) | `'127.0.0.1'` (`DEFAULT_MARKET_DATA_DAEMON_HOST`) | Defaults to `'127.0.0.1'` when **unset (`undefined`)**. Validated case-insensitively after `.trim()` by `isLoopbackTransportHost`: only `'127.0.0.1'`, `'::1'`, `'[::1]'`, and `'localhost'` are accepted. Empty/whitespace strings (`''`), `'0.0.0.0'`, `'::'`, LAN IPs, and external DNS names fail closed at startup phase `'validate'` with code `NON_LOOPBACK_HOST_REFUSED` before any socket is created. |
| `IIPS_MARKET_DATA_DAEMON_PORT` | `MARKET_DATA_DAEMON_PORT_ENV` (`src/providers/dhan/dhan_local_daemon.ts`) | `8791` (`DEFAULT_MARKET_DATA_DAEMON_PORT`) | Absent or whitespace-only falls back to `8791`. When non-empty, `.trim()` must match `/^\d+$/` and parse as an integer in `1..65535`. `'0'`, negative numbers, decimals, ports `> 65535`, or non-numeric strings fail closed at phase `'validate'` with code `INVALID_PORT`. *(Programmatic `options.port = 0` ephemeral port binding exists solely as an in-process `startMarketDataDaemon` test seam, never via the environment variable.)* |
| `IIPS_MARKET_DATA_TRANSPORT_TOKEN` | `MARKET_DATA_TRANSPORT_TOKEN_ENV` (`src/providers/dhan/dhan_market_data_http.ts`) | *(none — required)* | Required local server-to-server bearer secret. `validateTransportToken` refuses missing/blank (`TRANSPORT_TOKEN_MISSING`), non-ASCII/control (`TRANSPORT_TOKEN_NOT_ASCII`), and leading/trailing/interior whitespace (`TRANSPORT_TOKEN_WHITESPACE`) before binding. `createMarketDataHttpServer` also validates direct callers. Captured once for the daemon lifetime; rotation requires a restart. **Never** a Dhan API credential. |
| `IIPS_DHAN_VAULT_BACKEND` | `DHAN_VAULT_BACKEND_ENV` (`src/providers/dhan/dhan_local_daemon.ts`) | `'disabled'` | Exact, case-sensitive allow-list: `'disabled'` or `'windows-dpapi'`; unset/blank means `'disabled'`. Unknown values fail closed at phase `'validate'` with `VAULT_BACKEND_NOT_ALLOWED` before any vault or socket work, without echoing input. `windows-dpapi` awaits the backend probe and permits egress only when both configuration and backend readiness are valid. This selector is **not** `IIPS_DHAN_VAULT_PROVIDER`. |

### 2.2 Dhan Provider & `SecretRef` Metadata Variables (`DHAN_ENV_KEYS`)

All provider configuration keys are defined in `DHAN_ENV_KEYS` (`src/providers/dhan/dhan_config.ts`)
and evaluated by `resolveDhanProviderConfig(env, now)`:

| Environment Variable | `DHAN_ENV_KEYS` Property | Default Value | Validation & Exact Runtime Behavior on `main` |
| :--- | :--- | :--- | :--- |
| `IIPS_DHAN_BASE_URL` | `baseUrl` | `'https://api.dhan.co/v2'` (`DHAN_DEFAULT_BASE_URL`) | Absent or empty falls back to `'https://api.dhan.co/v2'`; trailing slashes are stripped (`replace(/\/+$/, '')`). Whitespace-only is **not** a valid HTTPS URL. When `DhanServerHttpsTransport` is constructed, the URL must parse as `https:` with no embedded `username`, `password`, or query string (`search === ''`), and every outbound request URL must stay within the configured origin and path prefix. |
| `IIPS_DHAN_TIMEOUT_MS` | `timeoutMs` | `5000` (`DHAN_DEFAULT_TIMEOUT_MS`, in ms) | Parsed via `Number.parseInt(raw, 10)`. Absent, empty, non-numeric (`NaN`), or `<= 0` falls back to `5000`. Controls per-attempt outbound Dhan HTTPS timeout (`AbortSignal.timeout(request.timeoutMs)`), distinct from the `10,000` ms loopback HTTP request timeout. |
| `IIPS_DHAN_CLIENT_ID_SECRET_PATH` | `clientIdSecretPath` | *(unset)* | External `SecretRef.keyPath` pointer to the Dhan client identifier (must begin with `'vault://'`, never a plaintext client ID). See §2.4 for exact readiness matrix. |
| `IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH` | `accessTokenSecretPath` | *(unset)* | External `SecretRef.keyPath` pointer to the Dhan access token (must begin with `'vault://'`, never a plaintext token). See §2.4 for exact readiness matrix. |
| `IIPS_DHAN_VAULT_PROVIDER` | `secretVaultProvider` | `'LOCAL_MOCK_VAULT'` | `SecretRef.vaultProvider` metadata (not a backend selector). Absent defaults to `'LOCAL_MOCK_VAULT'`. Admitted values: `'LOCAL_MOCK_VAULT'`, `'AWS_SECRETS_MANAGER'`, `'HASHICORP_VAULT'`, `'AZURE_KEY_VAULT'`, `'TEST_ENCLAVE'`, `'WINDOWS_DPAPI'`. For `'WINDOWS_DPAPI'`, `validateDhanSecretKeyPaths` additionally requires a separate role-specific key path for each secret; unknown provider or malformed pair refuses startup with `CONFIGURATION_INCOMPLETE`. |
| `IIPS_DHAN_SECRET_VERSION` | `secretVersion` | `'v1'` | Optional `SecretRef.version`. Absent or empty defaults to `'v1'`. Match the version stamped into each carrier by `dhan:credential`; a mismatch against the backend's record fails closed with `CREDENTIALS_UNAVAILABLE`. |
| `IIPS_DHAN_SECRET_STATUS` | `secretStatus` | `'ACTIVE'` | Optional `SecretRefStatus` (`'ACTIVE'`, `'ROTATING'`, `'REVOKED'`, `'EXPIRED'`). Absent or empty defaults to `'ACTIVE'`. With both secret paths configured: any unknown status (including whitespace-only) yields `CONFIGURATION_INCOMPLETE` (phase `'configure'`); `'EXPIRED'` or `'REVOKED'` yields `CREDENTIALS_EXPIRED` (loopback listener starts with egress off and `providerState: 'EXPIRED'`). |
| `IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT` | `accessTokenExpiresAt` | *(unset)* | Optional timestamp evaluated when both secret paths are present. `parseStrictUtcTimestamp` requires explicit `Z` or a numeric timezone offset, real calendar time and valid offset; malformed and zone-less values yield `CONFIGURATION_INCOMPLETE` (phase `'configure'`). An instant `<= now` yields `CREDENTIALS_EXPIRED` (loopback listener remains fail-closed with `providerState: 'EXPIRED'`). Expiry is checked again during credential resolution, API preflight, and diagnostics; the input value is never echoed on refusal. |

For `'WINDOWS_DPAPI'`, use the *logical* (non-filesystem) `DHAN_CLIENT_ID_KEY_PATH`
(`vault://dhan/client-id`) and `DHAN_ACCESS_TOKEN_KEY_PATH` (`vault://dhan/access-token`)
for `clientIdSecretPath` and `accessTokenSecretPath`, respectively. Both must be distinct and
role-specific. These references alone never make a backend ready or prove vendor connectivity.

### 2.3 Deployment & TLS Guard Environment Variables

| Environment Variable | Checked By | Guard Rule on `main` |
| :--- | :--- | :--- |
| `NODE_ENV` | `isDhanProductionEnvironment` (`dhan_config.ts`, enforced in daemon, config, vault resolver, API client, HTTPS egress, HTTP server, and HTTP client) | Trimmed case-insensitive `'production'` fails closed immediately with `PRODUCTION_NOT_AUTHORIZED` (daemon startup refused at phase `'validate'`, exit code `1`). |
| `IIPS_DEPLOYMENT_ENV` | `isDhanProductionEnvironment` (same 7 enforcement points as `NODE_ENV`) | Trimmed case-insensitive `'production'` fails closed immediately with `PRODUCTION_NOT_AUTHORIZED`. |
| `NODE_TLS_REJECT_UNAUTHORIZED` | `DhanServerHttpsTransport` (`dhan_server_egress.ts`) | Trimmed value `'0'` is refused fail-closed (`DhanTransportUnavailableError` -> `TRANSPORT_FAILURE`) both at transport construction and before every `send()` call. TLS certificate verification cannot be disabled. |

### 2.4 Startup Outcome Matrix for Credential Configuration States

| Secret-Path & Metadata State | `resolveDhanProviderConfig` Result | Daemon Startup Outcome (`startMarketDataDaemon`) | Loopback `/v1/health` & `/v1/diagnostics` State |
| :--- | :--- | :--- | :--- |
| Both `IIPS_DHAN_*_SECRET_PATH` unset or blank | `ok: false`, `failure.code: 'CREDENTIALS_UNAVAILABLE'`, `config.readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'` (`missingKeys.length === 2`) | **Starts and listens** (`vendorEgressMode: 'DISABLED_PRE_ACCESS'`) | `service: 'UP'`, `providerConfiguration: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'`, `providerState: 'UNCONFIGURED'` |
| Exactly one `IIPS_DHAN_*_SECRET_PATH` set (`missingKeys.length === 1`) | `ok: false`, `failure.code: 'CREDENTIALS_UNAVAILABLE'`, `config.readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'` | **Starts and listens** (`vendorEgressMode: 'DISABLED_PRE_ACCESS'`) | `service: 'UP'`, `providerConfiguration: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'`, `credentialResolutionOutcome: 'CONFIGURATION_INCOMPLETE'`, `providerState: 'UNAVAILABLE'` |
| Both `vault://` paths valid (governed pair for `WINDOWS_DPAPI`), status `'ACTIVE'` / `'ROTATING'`, `expiresAt` absent or future | `ok: true`, `config.readiness: 'CREDENTIAL_REFERENCES_CONFIGURED'` | **Starts and listens** with egress off when selector is absent/`disabled`. When explicitly `windows-dpapi`, vendor egress is **permitted** only after the awaited probe reports ready on a provisioned, approved Windows host; an injected backend is a controlled test seam. | `service: 'UP'`, `providerConfiguration: 'CONFIGURED'`; `providerState: 'UNAVAILABLE'` if the backend is not ready, or at most `'CREDENTIALS_RESOLVED'` on local evidence when it is ready — never vendor-authenticated by startup alone. |
| Both `vault://` paths valid, but `IIPS_DHAN_SECRET_STATUS` is `'EXPIRED'`/`'REVOKED'` or `IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT <= now` | `ok: false`, `failure.code: 'CREDENTIALS_EXPIRED'`, `config.readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'` | **Starts and listens** (`vendorEgressMode: 'DISABLED_PRE_ACCESS'`) | `service: 'UP'`, `providerConfiguration: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'`, `providerState: 'EXPIRED'` |
| Both secret paths non-empty, but non-`vault://` URI, an invalid/shared Windows key-path pair, invalid `VaultProvider`/`SecretRefStatus`, or malformed/zone-less `expiresAt` | `ok: false`, `failure.code: 'CONFIGURATION_INCOMPLETE'` | **Refuses startup** at phase `'configure'` (`code: 'CONFIGURATION_INCOMPLETE'`, exit code `1`, no socket opened) | *(daemon not listening)* |

---

## 3. Compatibility Distinction vs IRR Consumer Environment Variables

IRR (`ramkivs/iips-review-recovered`) owns its own server-side consumer configuration. IPD's
daemon **does not read** IRR's URL or timeout variables, and neither repository treats IRR's
two URL settings as aliases or fallbacks for each other:

| IRR Consumer Variable (Read by IRR Only) | Consumed By (in IRR) | IRR Default | Relationship to IPD Daemon |
| :--- | :--- | :--- | :--- |
| `IIPS_MARKET_DATA_TRANSPORT_URL` | IRR offline identity HTTP consumer (`/v1/instruments/search`, `/v1/identity/resolve`, `/v1/identity/qualify`) | *(none — required by IRR identity path; fixed `10,000` ms client timeout in IRR)* | **Not read by IPD.** Must be set in IRR's environment to the exact `http://<host>:<port>` where IPD's daemon is listening (by default `http://127.0.0.1:8791`). |
| `IIPS_MARKET_DATA_BASE_URL` | IRR quote, historical, health, freshness, diagnostics, and connection-verify consumer (`MarketDataTransportClient`) | `http://127.0.0.1:8791` | **Not read by IPD.** Matches IPD's default listener (`127.0.0.1:8791`). Must address the **same** IPD daemon listener as `IIPS_MARKET_DATA_TRANSPORT_URL`. |
| `IIPS_MARKET_DATA_TIMEOUT_MS` | IRR `MarketDataTransportClient` `options.timeoutMs` override | `10000` (`10,000` ms) | **Not read by IPD.** Governs IRR's client-side `AbortSignal.timeout` on quote/history/health/diagnostics/verify calls, not IRR's identity path and not IPD's `IIPS_DHAN_TIMEOUT_MS` (`5,000` ms) or IPD's server-side `MARKET_DATA_REQUEST_TIMEOUT_MS` (`10,000` ms). |
| `IIPS_MARKET_DATA_TRANSPORT_TOKEN` | Shared name read by **both** IPD server (`createMarketDataHttpServer` / `startMarketDataDaemon`) and IRR HTTP clients | *(none — required in both processes)* | Both processes must receive the identical non-empty bearer token from operator-managed process environment injection. Never hardcode, log, or commit. |

---

## 4. Daemon Port (`8791`), Loopback Binding, and Network-Access Behavior

1. **Default Listener**: `http://127.0.0.1:8791` (`DEFAULT_MARKET_DATA_DAEMON_HOST = '127.0.0.1'`,
   `DEFAULT_MARKET_DATA_DAEMON_PORT = 8791`). When `IIPS_MARKET_DATA_DAEMON_HOST` is `'::1'` or
   `'[::1]'`, `startMarketDataDaemon` normalizes the socket listen host to `'::1'` and formats
   `diagnostics.baseUrl` as `http://[::1]:<port>`.
2. **Three-Layer Loopback Listener Enforcement**:
   - **Pre-socket validation (`startMarketDataDaemon` & `createMarketDataHttpServer`)**:
     `isLoopbackTransportHost` accepts only `'127.0.0.1'`, `'::1'`, `'[::1]'`, and `'localhost'`.
     Public/wildcard/LAN addresses (`'0.0.0.0'`, `'::'`, `'192.168.x.x'`, `'10.x.x.x'`, external
     hostnames) are rejected before `server.listen` is invoked.
   - **Wrapped `server.listen` guard (`dhan_market_data_http.ts`)**: `createMarketDataHttpServer`
     patches `server.listen` so callers cannot bypass the loopback restriction when passing a
     port or `ListenOptions`.
   - **Post-bind kernel verification (`dhan_local_daemon.ts`)**: After `server.listen` succeeds,
     `startMarketDataDaemon` inspects `server.address()` (`AddressInfo`) via
     `isVerifiedLoopbackBoundAddress` and requires the kernel-resolved bound address to be
     `'127.0.0.1'`, `'::1'`, or `'::ffff:127.0.0.1'`. Any other resolved address (for example,
     if a tampered hosts file mapped `localhost` to a non-loopback interface) triggers immediate
     `service.stop()` + `server.close()` rollback and fails closed with
     `NON_LOOPBACK_HOST_REFUSED`. Port collisions (`EADDRINUSE`) roll back with `BIND_FAILED`.
3. **Client Loopback Preflight (`MarketDataTransportClient`)**:
   - Accepts **only** `http://` URLs whose `hostname` passes `isLoopbackTransportHost`, with
     empty `username`, `password`, and `search`, and sets `redirect: 'error'` on `fetch`.
   - Rejects `https://` loopback URLs, remote/LAN hosts, `api.dhan.co` URLs, query parameters,
     and embedded URL credentials with `{ ok: false, failure: { code: 'TRANSPORT_FAILURE' } }`
     before issuing any network call.
4. **Outbound Vendor Egress Control (`DhanServerHttpsTransport` vs `PreAccessNoNetworkTransport`)**:
   - Outbound vendor egress (`DhanServerHttpsTransport`) is wired **only** when the awaited
     `probeBackendReadiness()` reports `liveResolutionSupported: true` **and**
     `resolveDhanProviderConfig` returns `ok === true`. The default `disabled` backend keeps
     egress off; `windows-dpapi` does **not** imply readiness just because it was selected.
   - Otherwise (including every unprovisioned, non-Windows, invalid-DACL, missing-carrier or
     expired configuration), the daemon wires `PreAccessNoNetworkTransport`
     (`vendorEgressMode: 'DISABLED_PRE_ACCESS'`), which never opens a vendor socket.
   - When active on an approved Windows host (or via a controlled injected test backend),
     `DhanServerHttpsTransport` enforces
     `https:` protocol, exact origin + path-prefix pinning against `config.baseUrl`
     (`https://api.dhan.co/v2`), `redirect: 'error'`, TLS verification
     (`NODE_TLS_REJECT_UNAUTHORIZED !== '0'`), and `AbortSignal.timeout(request.timeoutMs)`.

---

## 5. Transport Authentication, Dhan Backend Selection, and Credential Configuration

### 5.1 Loopback Transport Authentication (`IIPS_MARKET_DATA_TRANSPORT_TOKEN`)

- Every route on `createMarketDataHttpServer` authenticates **before** route dispatch or JSON
  body parsing.
- Expected header: `Authorization: Bearer <token>`. `parseBearerAuthorization` accepts the
  scheme **case-insensitively** and an SP/HTAB separator (RFC 7235 §2.1), but refuses malformed
  or whitespace-contaminated credentials; it never repairs or trims a token into a match.
- `validateTransportToken` refuses an untransmittable token at startup; the client uses the same
  validation. `tokenMatches` checks equal UTF-8 byte length before `node:crypto`'s
  `timingSafeEqual` comparison.
- Missing/invalid `Authorization`, a different scheme, or a mismatched credential returns HTTP
  `401` with `{"error":{"code":"UNAUTHENTICATED","message":"missing or invalid transport credential"}}`.
- Transport tokens are strictly local IPC bearer secrets between authorized local processes
  (e.g. IRR backend -> IPD daemon) and are **never** forwarded to Dhan or accepted from URLs.

### 5.2 Dhan Vault Backend Selection (W-03 / D-1)

- `src/providers/dhan/dhan_local_vault_resolver.ts` defines the internal
  `LocalHostVaultSecretBackend` SPI (`describeReadiness()`, optional async
  `probeReadiness()`, `readSecret(ref, asOfUtc)`) and `LocalHostVaultDhanCredentialResolver`.
- The resolver alone defaults to `DisabledWindowsHostVaultBackend`; the **daemon** reads
  `IIPS_DHAN_VAULT_BACKEND` via `parseDhanVaultBackendSelector`. Unset/blank/`disabled` selects
  that disabled backend (`UNPROVISIONED_WINDOWS_HOST_VAULT`, `liveResolutionSupported: false`).
  This remains the fail-closed default on every platform.
- Explicit `windows-dpapi` selects `WindowsDpapiHostVaultBackend`
  (`WINDOWS_DPAPI_USER_SCOPE`). Startup **awaits** `probeReadiness()` before reporting
  `vaultBackendReadiness` and `credentialReadinessCode` or permitting egress. The backend checks
  an approved Windows host, carrier location, **both** carriers, owner-only ACLs, envelope schema
  and a DPAPI read. If any check fails, `liveResolutionSupported` is false, vendor egress stays
  `DISABLED_PRE_ACCESS`, and a sanitized diagnostic explains non-readiness without a location.
  A successful local probe is **not** vendor authentication.
- `StartMarketDataDaemonOptions.vaultBackend` / `credentialResolver` remain **controlled test
  seams**, not the only production means of selecting DPAPI. `vaultCarrierDirectory` is a
  test/operator seam for an explicitly selected DPAPI backend; do not use it to bypass the
  governed location or DACL policy.
- `sanitizeVaultBackendId` (`src/providers/dhan/dhan_api_client.ts`) enforces the D-7 §4.1/§4.2
  format `/^[A-Z][A-Z0-9_]{1,63}$/`; invalid strings are coerced to
  `'UNKNOWN_VAULT_BACKEND'`. The daemon startup line reports only sanitized identifiers and
  readiness, never the logical key paths, carrier locations or secrets.

### 5.3 `SecretRef` Contract and Per-Request Credential Handling

- Dhan credentials are represented in configuration exclusively as `SecretRef` metadata objects
  (`src/security/secret_ref.ts`):
  `{ secretId: string, vaultProvider: VaultProvider, keyPath: 'vault://...', version: string, status: SecretRefStatus, expiresAt?: string }`.
- Neither `resolveDhanProviderConfig` nor `DhanMarketDataService` ever stores plaintext
  `client-id` or `access-token` values on configuration objects, caches, envelopes, health
  responses, diagnostics responses, startup logs, or exceptions.
- When live resolution is active through an explicitly selected, ready DPAPI backend (or an
  injected test backend):
  1. `LocalHostVaultDhanCredentialResolver.resolve(config)` checks non-production mode,
     re-validates both `SecretRef`s (`validateSecretRef`), checks status and strict UTC expiry,
     reads both references, verifies non-empty values, checks record status/expiry, and enforces
     `record.version === ref.version` when present. A backend exception becomes a scrubbed,
     typed failure without raw OS/vault output.
  2. `DhanApiClient` uses resolved values in outbound per-request headers (`access-token`,
     `client-id`) only for that call; no credential is stored in a service field, cache, response,
     envelope, diagnostic, error, or log. JS memory cannot be claimed to be securely zeroized.

### 5.4 W-04 Local Credential Utility and D-1 Carrier Contract

After a clean TypeScript build, an authorized owner on the approved Windows host can run
`npm run dhan:credential -- --help` for the exact CLI vocabulary and
`npm run dhan:credential -- verify all` for a location-free, value-free local status.
`provision client-id`, `provision access-token`, `rotate client-id`, and `rotate access-token`
are deliberate, separate operations; supply the value through a hidden interactive prompt or
stdin, **never** as an argument, environment variable, tracked file, or log. For an access
token, set strict UTC expiry with `--expires-at <UTC-Z-timestamp>` or
`--expires-in-hours <positive-hours>`. The CLI refuses provisioning off Windows or inside a Git
working tree. See `docs/integration/DHAN-W04-CREDENTIAL-PROVISIONING-AND-ROTATION-2026-11-12.md`
and the D-6 operator procedure for guarded execution and rehearsal prerequisites.

Each role has a separate DPAPI CurrentUser ciphertext-only carrier and a versioned envelope:
`schemaVersion`, `secretId`, `vaultProvider`, `version`, `createdAtUtc`, `rotatedAtUtc`,
optional token `expiresAtUtc`, and `ciphertext`. Rotation applies owner-only DACLs to the
beside-file, writes and decrypts it for round-trip verification, then atomically swaps it;
failures retain the previous carrier and remove temporary files. `verify` reports metadata and
readability without exposing a value, logical key path, or filesystem location. Both carriers
must pass the daemon's awaited readiness probe; even then local readiness is not proof of a
vendor request or successful authentication.

---

## 6. Build, Startup, Lifecycle, and Shutdown Requirements

1. **Runtime Prerequisite**: Node.js **`>= 22.13.0`**, non-production environment
   (`NODE_ENV` and `IIPS_DEPLOYMENT_ENV` must **not** equal `'production'`).
2. **Build Step Required Before CLI Launch**:
   - `package.json` defines `"start:market-data-daemon": "node dist/src/providers/dhan/dhan_local_daemon.js"`.
   - Run `npm run build` (full repository + subpackage build) or `npm run build:tsc` first.
     The npm `prebuild` / `prebuild:tsc` hooks purge old compiled output before `tsc` emits
     current modules; `npm run clean:dist` explicitly purges all `dist/` and frontend output.
     Never execute a stale `dist/src/providers/dhan/dhan_credential_store_cli.js` left over
     from another commit: TypeScript does not delete orphaned `.js` files on its own.
3. **Standalone Launch Command**:
   - Inject `IIPS_MARKET_DATA_TRANSPORT_TOKEN` (and optional `IIPS_MARKET_DATA_DAEMON_HOST`,
     `IIPS_MARKET_DATA_DAEMON_PORT`, `IIPS_DHAN_*` variables) via the operator's external
     process environment, then run:
     ```text
     npm run start:market-data-daemon
     ```
   - **Zero CLI Arguments Allowed**: Passing any command-line argument after the script path
     (`process.argv.slice(2).length > 0`) causes immediate refusal at phase `'validate'` with
     `CLI_ARGUMENTS_FORBIDDEN` and exit code `1`, **without** echoing `argv` values. Never pass
     `--port`, `--host`, or tokens on the command line.
4. **Relationship to `windows-setup/03-Start-IipsServers.ps1`**:
   - The checksum-pinned `windows-setup/` bundle (`03-Start-IipsServers.ps1`) starts IRR
     (`127.0.0.1:8787` API, `127.0.0.1:5176` frontend) and optional IPD portfolio IPC; it
     **does not** start `start:market-data-daemon` (`127.0.0.1:8791`).
   - Start the IPD market-data daemon **before** starting IRR market-data/identity consumers,
     and stop IRR consumers **before** stopping the daemon.
5. **Offline Registry Loading & Sanitized Startup Output**:
   - During startup, the daemon loads `getGovernedBroadSecurityMaster()` and
     `loadGovernedP7InstrumentRegistry()` from local `evidence/dhan-p7/qualification-manifest.json`
     (`4,680` `QUALIFIED` mappings on `main`) with **zero** network requests.
   - On successful bind, `runMarketDataDaemonCli` writes one sanitized line to `stderr`
     (`DaemonCliIo.writeStderr`, defaulting to `console.error`) via `formatDaemonStartupLine`:
     ```text
     [ipd-market-data-daemon] listening on http://127.0.0.1:8791 (providerReadiness=..., vaultBackend=UNPROVISIONED_WINDOWS_HOST_VAULT, vaultBackendSelector=disabled, vaultBackendReadiness=NOT_READY, liveCredentialResolution=false, credentialReadiness=CREDENTIALS_UNAVAILABLE, providerState=UNCONFIGURED, vendorEgress=DISABLED_PRE_ACCESS, qualifiedMappings=4680)
     ```
6. **Graceful Shutdown & Configuration Reload**:
   - `runMarketDataDaemonCli` registers `SIGINT` and `SIGTERM` handlers (`once`) that invoke
     idempotent `handle.shutdown()` (`service.stop()` — clearing the in-memory quote cache and
     halting new refreshes — followed by `server.close()` bounded by
     `DEFAULT_DAEMON_SHUTDOWN_TIMEOUT_MS = 5,000` ms, after which `server.closeAllConnections()`
     is called if needed).
   - Environment variables are read at startup/request preflight; changing
     `IIPS_MARKET_DATA_TRANSPORT_TOKEN`, listener host/port, or `IIPS_DHAN_*` variables requires
     a clean daemon restart.

---

## 7. Authenticated Loopback HTTP Endpoints (`MARKET_DATA_ROUTES`)

All **9** routes require `Authorization: Bearer <IIPS_MARKET_DATA_TRANSPORT_TOKEN>`, return
`application/json`, enforce `MARKET_DATA_MAX_REQUEST_BYTES = 16,384` bytes (`16 KiB`) on `POST`
bodies (`413 REQUEST_TOO_LARGE`), and emit transport errors as
`{"error":{"code":"<CODE>","message":"<MESSAGE>"}}`:

| Method & Path (`MARKET_DATA_ROUTES`) | Purpose & Request Contract | Success Payload (`HTTP 200`) | Error Status Mapping | Outbound Vendor Call Possible? |
| :--- | :--- | :--- | :--- | :--- |
| `GET /v1/health` (`health`) | Observational service & provider health (`ServiceHealth`, W-07 `contractVersion: 2`). | `{ service: 'UP' \| 'DOWN', providerConfiguration: 'CONFIGURED' \| 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE', liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS' \| 'CONNECTED_LIVE', providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED' \| 'LIVE_QUALIFIED', contractVersion: 2 }` | `401` (`UNAUTHENTICATED`), `404` (wrong method) | **Never** (reads W-08 in-memory recorder only). |
| `GET /v1/diagnostics` (`diagnostics`) | Sanitized D-7 §4.1 operational diagnostics (`ServiceDiagnostics`, W-09 `contractVersion: 1`; 8-state `providerState`: `'UNCONFIGURED' \| 'CONFIGURED' \| 'CREDENTIALS_RESOLVED' \| 'AUTHENTICATED' \| 'OPERATIONAL' \| 'EXPIRED' \| 'DEGRADED' \| 'UNAVAILABLE'`). Rejects any query string or `req.url.length > 2048` with `400`. | `{ contractVersion: 1, service, providerState, providerConfiguration, providerReadiness, vaultBackendId, liveCredentialResolutionSupported, vendorEgressMode, credentialResolutionOutcome, liveProviderConnectivity, providerQualification, lastSuccessAt, lastFailureCategory, lastFailure, lastAuthOutcome, lastLatencyMs, consecutiveAuthFailures, authLatched, requestCounters, qualifiedMappingsLoaded, quoteCache }` | `400` (`MALFORMED_REQUEST`), `401` (`UNAUTHENTICATED`), `404` (wrong method) | **Never** (pure read-only snapshot; never mutates state or reads secrets). |
| `POST /v1/connection/verify` (`verifyConnection`) | Explicit operator-initiated single-shot connection verification (`ServiceConnectionVerification`, W-08 / W-10 `contractVersion: 1`). Rejects query params; empty `{}` or `{ mode?: 'LIVE_PROBE' \| 'LOCAL_ONLY' }` body (`mode` defaults to `'LIVE_PROBE'`). | `{ contractVersion: 1, mode, outcome, providerState, localReadinessEstablished, probeAttempted, probeCount, failureCategory, checkedAt, latencyMs, observedState, diagnostics }` | `400` (`MALFORMED_REQUEST`), `401` (`UNAUTHENTICATED`), `413` (`REQUEST_TOO_LARGE`), `504` (`REQUEST_TIMEOUT`) | **`LOCAL_ONLY`: Never.** **`LIVE_PROBE`:** At most **1** probe (`probeCount <= 1`, zero retries), only when service is running, credentials resolve, auth latch is clear, rate permit succeeds, and vendor egress is enabled. |
| `GET /v1/freshness` (`freshness`) | Read-only cache/observation freshness (`FreshnessStatus`, P5). Query params: `?domain=D02_OHLCV` (alone) or `?domain=D01_QUOTES&companyId=<id>&exchangeSegment=NSE_EQ\|BSE_EQ&securityId=ISIN:<isin>:<series>`. | `{ domain, cacheState: 'CURRENT' \| 'STALE' \| 'UNAVAILABLE' \| 'MISS' \| 'NOT_AVAILABLE', asOf, receivedAt, evaluatedAt, observationEvaluatedAt, timestampEvidence, thresholdSeconds, ageSeconds, verdict: 'GOOD' \| 'STALE' \| 'UNAVAILABLE' \| 'UNKNOWN', staleConcessionActive, suppressExecution, eligibleForUse, lastRefresh: { outcome, lastFailure } }` *(Note: `D02_OHLCV` currently returns `cacheState: 'NOT_AVAILABLE'`, `verdict: 'UNKNOWN'`, `lastRefresh.outcome: 'UNKNOWN'` because `DhanHistoricalAdapter` is uncached pending W-19.)* | `400` (`MALFORMED_REQUEST`), `401` (`UNAUTHENTICATED`), `404` (wrong method) | **Never** (`cache.peek` only; never refreshes or touches LRU order). |
| `POST /v1/quotes` (`quotes`) | Canonical D01 quote fetch via P4 orchestrator. Body: `{ companyId, securityId: 'ISIN:<isin>:<series>', exchangeSegment?: 'NSE_EQ' \| 'BSE_EQ' }` (`exchangeSegment` defaults to `'NSE_EQ'`). | `{ ok: true, envelope: CanonicalEnvelope<MarketQuotePayload>, freshness: 'CURRENT' \| 'STALE' }` | `400` (`MALFORMED_REQUEST`), `401` (`UNAUTHENTICATED`), `413` (`REQUEST_TOO_LARGE`), `429` (`RATE_LIMITED`), `502` (provider/domain failure), `504` (`REQUEST_TIMEOUT`) | **Yes, on cache miss/stale** when identity resolves and live credentials + egress are active (otherwise fails closed before socket I/O). |
| `POST /v1/historical` (`historical`) | Canonical D02 daily OHLCV fetch. Body: `{ companyId, exchangeSegment?, isin?, interval, fromDate, toDate, isAdjusted? }`. | `{ ok: true, result: DhanHistoricalNormalizationResult }` | `400` (`MALFORMED_REQUEST`), `401` (`UNAUTHENTICATED`), `413` (`REQUEST_TOO_LARGE`), `429` (`RATE_LIMITED`), `502` (provider/domain failure), `504` (`REQUEST_TIMEOUT`) | **Yes**, single-shot when identity resolves and live credentials + egress are active. |
| `POST /v1/instruments/search` (`instrumentSearch`) | Offline P4 registry + P04 master search (`DhanIdentityApiService.search`). Body: `{ query: string }` (non-empty trimmed, `<= 100` chars). | `{ results: InstrumentSearchResult[] }` (at most `100` rows) | `400` (`MALFORMED_REQUEST`), `401` (`UNAUTHENTICATED`), `413` (`REQUEST_TOO_LARGE`) | **Never** (offline local master/registry only). |
| `POST /v1/identity/resolve` (`identityResolve`) | Offline exact D114 identity resolution (`DhanIdentityApiService.resolve`). Body: `{ companyId, exchange: 'NSE' \| 'BSE', securityId: 'ISIN:<isin>:<series>' }`. | `IdentityApiResult` (`QUALIFIED` \| `UNRESOLVED` \| `AMBIGUOUS`, HTTP `200`) | `400` (`MALFORMED_REQUEST`), `401` (`UNAUTHENTICATED`), `413` (`REQUEST_TOO_LARGE`) | **Never** (offline local master/registry only). |
| `POST /v1/identity/qualify` (`identityQualify`) | Offline holding identity qualification (`DhanIdentityApiService.qualify`). Body: `{ isin?: string, exchange: 'NSE' \| 'BSE', symbol?: string }`. | `IdentityApiResult` (`QUALIFIED` \| `UNRESOLVED` \| `AMBIGUOUS`, HTTP `200`) | `400` (`MALFORMED_REQUEST`), `401` (`UNAUTHENTICATED`), `413` (`REQUEST_TOO_LARGE`) | **Never** (offline local master/registry only). |

Any unknown path or unsupported HTTP method (after bearer authentication) returns HTTP `404`
with `{"error":{"code":"NOT_FOUND","message":"unknown route"}}`. Note that when
`createMarketDataHttpServer` is instantiated directly without `options.identityService`, the
three identity routes also return `404 NOT_FOUND`; `startMarketDataDaemon` always wires
`DhanIdentityApiService` from `securityMaster` and `instrumentRegistry`.

---

## 8. Timeout Settings and Operational Controls Summary

| Control / Setting | Default Value on `main` | Configuration Surface | Scope & Fail-Closed Behavior |
| :--- | :--- | :--- | :--- |
| **Outbound Dhan HTTP timeout** | **`5,000` ms** (`DHAN_DEFAULT_TIMEOUT_MS`) | `IIPS_DHAN_TIMEOUT_MS` env var | Per-attempt `AbortSignal.timeout` inside `DhanServerHttpsTransport` -> `DhanTransportTimeoutError` -> `TIMEOUT`. |
| **Loopback HTTP server execution timeout** | **`10,000` ms** (`MARKET_DATA_REQUEST_TIMEOUT_MS`) | Programmatic `requestTimeoutMs` option only *(no env var)* | Bounds `POST /v1/quotes`, `POST /v1/historical`, and `POST /v1/connection/verify` -> HTTP `504` (`REQUEST_TIMEOUT`). |
| **IPD `MarketDataTransportClient` timeout** | **`10,000` ms** (`MARKET_DATA_REQUEST_TIMEOUT_MS`) | `new MarketDataTransportClient(url, token, { timeoutMs })` *(IRR passes `IIPS_MARKET_DATA_TIMEOUT_MS`, default `10,000` ms)* | Client-side `AbortSignal.timeout` -> `{ ok: false, failure: { code: 'TIMEOUT' } }`. |
| **Daemon shutdown drain timeout** | **`5,000` ms** (`DEFAULT_DAEMON_SHUTDOWN_TIMEOUT_MS`) | Programmatic `shutdownTimeoutMs` option only *(no env var)* | Bounds `server.close()` during `shutdown()` / `SIGINT` / `SIGTERM`, then forces `closeAllConnections()`. |
| **Loopback HTTP `POST` body cap** | **`16,384` bytes (`16 KiB`)** (`MARKET_DATA_MAX_REQUEST_BYTES`) | Fixed constant | Streams exceeding `16 KiB` abort immediately with HTTP `413` (`REQUEST_TOO_LARGE`). |
| **Quote LRU cache (`DhanBoundedCache`)** | **`256` entries** | Programmatic `DhanMarketDataServiceOptions.cache` | Keyed by `COMPANY_ID\|SEGMENT\|ISIN\|SERIES`. Freshness is evaluated from `provenance.asOf` (AD-12 D01 threshold `900s`: `<= 900s` `CURRENT`/`GOOD`, `> 900s..1,800s` `STALE` with concession, `> 1,800s` suppressed/`UNAVAILABLE`), never from insertion time. Cleared on `service.stop()`. |
| **Refresh status diagnostic map** | **`256` entries** | Fixed internal bound (`DhanMarketDataService`) | Retains per-scope last refresh outcome for `/v1/freshness` without affecting quote execution. |
| **Shared rate limiter (`DhanRateLimiter`)** | **`60` requests / `60,000` ms** | Programmatic `DhanMarketDataServiceOptions.limiter` | Sliding-window permit shared across quote cache-miss refreshes, `getHistorical`, and `verifyConnection` `LIVE_PROBE` attempts. Exhaustion fails closed with `RATE_LIMITED` (HTTP `429` on `/v1/quotes` and `/v1/historical`). |
| **Quote concurrency limiter (`DhanConcurrencyLimiter`)** | **`8` max in-flight**, **`1,024` max queued waiters** | Programmatic `DhanMarketDataServiceOptions.concurrency` | Bounds concurrent quote fetches in `DhanRefreshOrchestrator`; queue overflow fails closed with `TRANSPORT_FAILURE`. |
| **Duplicate quote request coalescer** | Enabled per `COMPANY_ID\|SEGMENT\|ISIN\|SERIES` | Programmatic `DhanMarketDataServiceOptions.coalescer` | Concurrent requests for the identical security scope share one in-flight execution. |
| **Quote transient retry (`withBoundedRetry`)** | **`3` max attempts** (`100` ms base exponential backoff + `0..50%` jitter) | Fixed in `DhanRefreshOrchestrator` | Retries **only** transient codes (`RATE_LIMITED`, `TIMEOUT`, `TRANSPORT_FAILURE`, `HTTP_ERROR` with `httpStatus >= 500`). Permanent failures (`AUTHENTICATION_FAILURE`, `CREDENTIALS_UNAVAILABLE`, `CREDENTIALS_EXPIRED`, `UNRESOLVED_INSTRUMENT`, `HTTP_ERROR` `< 500`) are **never** retried. `getHistorical` and `verifyConnection` perform **0** retries (`1` attempt max). |
| **Consecutive auth-failure latch (`W-08`)** | **`2` consecutive `AUTHENTICATION_FAILURE`s** (`DHAN_AUTH_LATCH_THRESHOLD`) | Fixed in `DhanProviderStateRecorder` | Latches `authLatched: true` (`providerState: 'DEGRADED'`, `lastAuthOutcome: 'AUTHENTICATION_FAILURE'`) and blocks further `verifyConnection` live probes until a non-auth reset/success path or process restart. |

---

## 9. W-11 Documentation Reconciliation Log, Verification Evidence, and Remaining Dependencies

### 9.1 W-11 Documentation Inconsistencies Audited and Corrected in IPD

1. **W-11 configuration specification reconciled with restored DPAPI**: The original
   W-11 document correctly identified DPAPI as unmerged at its old `main` pin. This branch
   restores `IIPS_DHAN_VAULT_BACKEND`, `WINDOWS_DPAPI`, the two governed key paths, W-04 CLI,
   and strict UTC expiry without losing W-07..W-11. Only `IIPS_DHAN_QUOTE_MAX_ATTEMPTS`
   remains an unsupported candidate setting. This document now describes that combination.
2. **`docs/DHAN-D1-PROVIDER-FOUNDATION.md` (§3 & §4)**: Added `IIPS_DHAN_SECRET_STATUS` (default
   `'ACTIVE'`) and `IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT` (optional expiry timestamp) to complete
   all 8 `DHAN_ENV_KEYS`, documented the `NODE_ENV` / `IIPS_DEPLOYMENT_ENV` non-production
   guard, added `CREDENTIALS_EXPIRED` and `PRODUCTION_NOT_AUTHORIZED` to the failure taxonomy
   list, and linked this W-11 specification.
3. **`docs/integration/DHAN-STAGE1-CREDENTIAL-AND-TRANSPORT-ADMISSION-2026-11-08.md`**: Added an
   explicit current-`main` reconciliation note preserving the 2026-11-08 Stage 1 historical
   record while correcting stale readers on post-Stage-1 `main` facts (`4,680` qualified P7
   mappings after PR `#164` vs historical `96`; actual `DhanMarketDataService` operational
   defaults of `256` quote cache / `60 per 60,000 ms` shared rate limiter / `8` concurrency /
   uncached D02 historical pending W-19 vs historical narrative numbers; and the complete 9-route
   HTTP surface including P4 identity, P5 `/v1/freshness`, W-07 `ServiceHealth` v2, W-09
   `/v1/diagnostics`, and W-10 `POST /v1/connection/verify`).
4. **`docs/integration/DHAN-W07-HEALTH-CONTRACT-HANDOFF.md`**: Added a post-merge status banner
   clarifying that W-07 (`#168` + IRR `#567`), W-08 (`#169`), W-09 (`#170`), and W-10 (`#172` +
   IRR `#569`) are merged on `main` and pointing to this W-11 operational specification.
5. **`src/providers/dhan/dhan_market_data_http.ts` integration**: Preserved all **9**
   routes in `MARKET_DATA_ROUTES` (including `/v1/freshness`, `/v1/instruments/search`,
   `/v1/identity/resolve`, and `/v1/identity/qualify`) while restoring strict bearer-token
   validation and parser behavior from the DPAPI/P7 lineage.

### 9.2 Synthetic Offline Verification Evidence

- **`tests/dhan_w11_daemon_configuration.test.ts` (`W11-01..06`)**: Verifies parity between
  documented constants/defaults/routes and this branch's exports, non-alias isolation against IRR
  consumer variables, the restored DPAPI selector and SecretRef pair, strict UTC expiry,
  loopback/port/CLI-arg/bearer/production refusal guards, full 9-route loopback HTTP
  compatibility (`health`, `diagnostics`, `connection/verify`, `freshness`, `quotes`,
  `historical`, `instruments/search`, `identity/resolve`, `identity/qualify`), `./dhan-server`
  vs browser export boundaries, and AD-17 / D-7 secret-scanner compliance (`scanTextForSecrets`:
  zero violations).
- **Current restoration verification**: `npx tsc --noEmit` and `npm run build` passed;
  the guarded `npm test` executed **1,902 tests** (**1,898 passed, 0 failed, 4 skipped**).
  `windows-setup/.validate-scripts.py` reported **310 pass / 0 fail**. All tests are
  synthetic/offline; no live Dhan credentials or vendor calls were used.
- **Installed-package consumer**: `npm run test:package-consumer` packed, installed,
  imported (ESM + CJS), typechecked, and exercised the installed package successfully,
  but its verbatim pinned IRR importer fetch returned **GitHub HTTP 403** because this
  sandbox's GitHub integration lacks read access to the private IRR repository. The full
  cross-repository command therefore **did not pass**; it must be rerun with authorized IRR
  read access. A separate installed-package browser-bundle scan completed with
  `forbiddenHits: []` and no server/DPAPI symbol in the closure.

### 9.3 Remaining Cross-Repository / Operator Dependencies for Overall Roadmap W-11

Completing IPD's W-11 configuration, compatibility, and synthetic verification deliverables does
**not** mark overall roadmap W-11 complete. Overall W-11 remains **`PARTIAL`** pending:

1. **Operator-Executed Connected-Daemon Dry-Run (IRR + IPD on Approved Host)**: An authorized
   operator starting IPD's `npm run start:market-data-daemon` and IRR on version-correlated,
   owner-approved checkouts with matching `IIPS_MARKET_DATA_TRANSPORT_TOKEN` and
   `IIPS_MARKET_DATA_TRANSPORT_URL` / `IIPS_MARKET_DATA_BASE_URL` pointing to
   `http://127.0.0.1:8791`, recording sanitized evidence across all four capabilities (Status,
   Quotes, History, Freshness).
2. **Separate IPD Roadmap Prerequisites for Live Vendor Traffic & D02 Freshness**:
   - **Approved Host Provisioning and Live Vendor Verification**: The restored source includes
     an opt-in Windows DPAPI backend, but the selector still defaults to `disabled` and egress
     stays fail-closed until an approved Windows host has both carriers, conforming ACLs,
     valid configuration, and a successful readiness probe. An authorized operator must
     perform and retain the separate live vendor verification; these synthetic tests do not
     qualify that operation.
   - **W-19 D02 Historical Freshness / Cache Wiring**: `GET /v1/freshness?domain=D02_OHLCV`
     honestly reports `cacheState: 'NOT_AVAILABLE'` (`verdict: 'UNKNOWN'`,
     `lastRefresh.outcome: 'UNKNOWN'`) in this branch until `DhanHistoricalCache` is wired
     under roadmap W-19.

### 9.4 DPAPI Restoration and Clean-Build Root Cause

The DPAPI lineage split from `main` after merge base
`a624d06f66c376f03a29571cb24c3f0f77f0c24d` and advanced to known-good
`8bbc299620bf4e88bd5f57f3f784b6894d99c3c9` without being merged into the later
W-07..W-11 `main` baseline (`b4a9f0f3601c2c56960aa15796370af0b7664d39`).
That is why the original W-11 audit saw neither the DPAPI backend nor the W-04 CLI on `main`.
The two histories are now intentionally reconciled rather than replacing newer contracts.

There was also a distinct **build-artifact** failure mode: a plain `tsc` overwrites the current
`dist/src/security/secret_ref.js` but never removes compiled Dhan modules whose sources are
absent from the checkout. Running it on `main` over an old DPAPI `dist/` left an orphaned
`dhan_credential_store_cli.js` importing `DHAN_ACCESS_TOKEN_KEY_PATH` from a newly emitted
`secret_ref.js` that no longer exported it. Compilation succeeded, but Node ESM import failed.
This was neither a trustworthy clean build nor a source-level incompatibility.

`npm run build` now removes `dist/` before compiling; `npm run build:tsc` clears only its
TypeScript emit (`dist/src`, `dist/tests`, `dist/frontend`) while preserving package outputs;
`pretest:package-consumer`, `prepack`, and `prepare` clean `dist/package` before rebuilding all
public subpaths. `scripts/run-tests.mjs` also fails closed if it sees compiled `.test.js` or
`dist/src/**/*.js` with no TypeScript source counterpart. The dedicated DPAPI restoration
regression suite exercises the cleanup modes, orphan refusal, actual built ESM imports, and
synthetic provision/rotate/verify with a fake DPAPI child process. No real credentials,
Windows host, or vendor access are needed for these repository tests.
