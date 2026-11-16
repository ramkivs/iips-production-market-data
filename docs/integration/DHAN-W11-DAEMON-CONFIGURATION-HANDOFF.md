# W-11 — IPD daemon configuration handoff

**Status: IPD branch candidate; W-11 remains PARTIAL.** This document describes the IPD daemon lineage at `a8ffd10ab4ba5d3b024bedc522da531b4c1bebbf` and the documentation/test-only descendants that retain its behavior. It does not establish what is installed or running on the owner's Windows host. The owner must independently identify and approve the actual daemon revision and admission path before using this procedure. No host, configuration, credential, store, service or running process was inspected or modified for this handoff.

## Lineage and selection boundary

- The separately published IPD branch `arena/9015787b-iips-production-market-data` contains `a8ffd10...`. The IRR package pin `af4460eeab9bb0544e009322526a5498df0d5909` is an ancestor of this candidate, **not** proof of the daemon checkout. The candidate additionally includes the retry and batch changes documented in [the quote policy](DHAN-QUOTE-RETRY-POLICY-WORK-IN-PROGRESS.md).
- Read-only GitHub comparison on this execution found IPD `main` at `901e4791e271cafdb777d56f9f66f6867b3f60c6`; main and this candidate diverge (candidate is 42 commits ahead and 35 behind in the main-to-candidate comparison). The inspected main daemon does not contain the W-03 `IIPS_DHAN_VAULT_BACKEND` selector: do **not** apply the candidate's `windows-dpapi` instructions to main. Main-to-Windows-backend convergence is not authorized or implemented here.
- The candidate includes the W-01 provider admission, W-02 Windows DPAPI backend and W-03 selector/probe path. Its selector can choose that backend, but selection or local readiness is not proof of configured credentials, vendor entitlement, connectivity or live qualification. See the historical W-01/W-02/W-03 records and W-06 final owner attestation for their actual scope; none is replaced by this handoff.
- Until an authorized owner identifies an approved running revision and admission path, the **actual host lineage is unknown**. If the host uses the inspected main lineage, its Windows-backend path is blocked pending a separate IPD-owned convergence decision. Do not merge, install, synchronize or restart anything merely because this candidate is published.

## IPD daemon environment for the candidate

These names are exact. Values, SecretRef locations, carrier paths and credentials must not appear in published evidence. No daemon environment template was found in this repository; this table is the version-specific reference, not a file containing operational values.

| Name | Candidate behavior |
| --- | --- |
| `IIPS_MARKET_DATA_DAEMON_HOST` | Defaults to `127.0.0.1`; accepts only loopback (`127.0.0.1`, `localhost`, `::1` / `[::1]` as supported by the loopback guard). Post-bind address is checked again. No public listener. |
| `IIPS_MARKET_DATA_DAEMON_PORT` | Defaults to `8791` when absent or blank; decimal integer 1–65535. Invalid values refuse startup. The programmatic `port: 0` test seam is not an environment default. |
| `IIPS_MARKET_DATA_TRANSPORT_TOKEN` | Required local HTTP bearer, validated at startup. Empty, non-ASCII/control or whitespace-containing values are refused, not echoed. Captured for the lifetime of the process. This is **not** a Dhan credential; server and authorized local clients must receive the matching value through their approved secret handling. |
| `IIPS_DHAN_VAULT_BACKEND` | Absent/blank selects `disabled`; admitted values after trimming are case-sensitive `disabled` and `windows-dpapi`. Any other value refuses startup before vault or socket work. `windows-dpapi` runs an awaited local readiness probe; egress is enabled only when that probe supports resolution **and** provider configuration is usable. No carrier-directory environment override is provided. |
| `IIPS_DHAN_BASE_URL` | Default `https://api.dhan.co/v2`. Server egress enforces HTTPS, configured-origin/path pinning, TLS verification and redirect refusal. Do not disable TLS verification. |
| `IIPS_DHAN_TIMEOUT_MS` | Provider request timeout, default 5000 ms. The existing parser uses a positive `parseInt` result; missing, nonnumeric or nonpositive input falls back to 5000. This is distinct from both local HTTP and IRR client timeouts. |
| `IIPS_DHAN_CLIENT_ID_SECRET_PATH`, `IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH` | Separate **references**, not credential values. Missing either produces `CREDENTIALS_UNAVAILABLE`; the loopback daemon can start in pre-access mode with vendor egress disabled. When both are supplied, malformed configured references cause `CONFIGURATION_INCOMPLETE` and startup refusal. With `WINDOWS_DPAPI`, each governed `vault://` reference must address a distinct secret with its correct client-id or access-token role; the exact paths are private. |
| `IIPS_DHAN_VAULT_PROVIDER` | SecretRef provider, default `LOCAL_MOCK_VAULT`; `WINDOWS_DPAPI` is the admitted Windows provider for this lineage. This metadata is distinct from the `windows-dpapi` backend selector; setting either alone does not prove readiness or authorize egress. Other values must be in the code's admitted SecretRef provider set. |
| `IIPS_DHAN_SECRET_VERSION` | SecretRef version; defaults to `v1` when absent or empty. The local resolver validates the resolved record and checks its version when the record supplies one. |
| `IIPS_DHAN_SECRET_STATUS` | Defaults to `ACTIVE`; admitted statuses are `ACTIVE`, `ROTATING`, `REVOKED`, `EXPIRED`. Expired/revoked material cannot be used for egress. |
| `IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT` | Optional metadata; if present it must be a real ISO timestamp with seconds and explicit `Z` or `±HH:MM` timezone, optional 1–3 fractional digits. Zone-less, impossible dates and invalid offsets are rejected; no timezone is guessed. Expired metadata yields `CREDENTIALS_EXPIRED`, not successful access. |
| `IIPS_DHAN_QUOTE_MAX_ATTEMPTS` | Quote total-attempt limit: default `3`, exact integer text `1`–`10`; malformed values refuse startup. Retries, pacing, cancellation and batch limitations are described in the quote policy. |
| `NODE_ENV`, `IIPS_DEPLOYMENT_ENV` | A case-insensitive, trimmed value `production` on either is refused before credentials or sockets. This candidate is local non-production only. |
| `NODE_TLS_REJECT_UNAUTHORIZED` | Value `0` causes HTTPS egress refusal; it is not a way to override TLS checks. |

There is no daemon environment setting for the local HTTP execution deadline in this candidate: its default is 10 seconds (a programmatic test seam exists). The HTTP timeout cancels quote work; a provider may already have received an aborted request. Historical endpoint behavior is described separately in the quote policy.

## IRR compatibility — separate ownership and non-alias settings

The following is the IRR handoff contract, not new IPD environment aliases. The daemon does **not** read these as its host or port:

| IRR setting | Handoff meaning |
| --- | --- |
| `IIPS_MARKET_DATA_TRANSPORT_URL` | IRR identity path's local base URL. |
| `IIPS_MARKET_DATA_BASE_URL` | IRR quote/history/health/freshness path's local base URL. |
| `IIPS_MARKET_DATA_TIMEOUT_MS` | IRR timeout for the latter path; not the identity-path timeout or IPD provider timeout. |

Both IRR URL settings should address the **same** approved loopback HTTP listener, including its actual port. They are separate reader names, not aliases or fallback substitutes. Neither changes IPD listener configuration. No defaults or aliases are changed by this handoff; IRR owns its configuration and must independently verify its two consumers against the eventual approved IPD revision.

## Safe operation and verification sequence

1. Independently confirm the approved IPD repository, commit and Windows admission path with the owner; build that revision in the approved environment. Do not assume a package pin identifies a running daemon. Establish non-production mode, governed registry and the separately approved vault readiness prerequisites without copying private values into evidence. Never put tokens, credentials, references or locations in command-line arguments, logs or screenshots.
2. Start the IPD daemon first using the repository's `npm run start:market-data-daemon` entry point after the approved build and externally managed environment are in place. Pass **no CLI arguments**. Review only sanitized startup status, selector, local readiness and egress mode. Startup itself makes no Dhan request. `disabled`, unavailable/expired references, or an unready probe can leave the daemon listening but unable to access the provider; invalid selector/configuration/host/port/token can refuse startup entirely.
3. Using an approved local client with the separately handled transport bearer, perform authenticated `GET /v1/health`. Do not publish the bearer or authorization header. An unauthenticated request receives 401. Health reports process/provider-configuration state, not vendor connectivity; it does not establish entitlement or live data. Start the authorized IRR server only after the daemon is ready, configuring its two URL names to that same listener.
4. The roadmap's connected-daemon verification of all four capabilities remains a separate owner-authorized activity. Identity/health alone are not quote/history proof. Quote/history/vendor traffic requires explicit separate authorization and a request-budget review; capture only approved sanitized evidence. Do not infer W-14 live mapping correctness or W-12/M2 qualification from synthetic tests or health.
5. Stop the IRR consumer before the daemon. Stop/restart the daemon only under the owner's operational authorization through its managed process control; its CLI handles SIGINT/SIGTERM and attempts bounded graceful shutdown. A changed bearer or configuration is not picked up by the running daemon: a separately authorized restart is required. Recheck local authenticated health after an authorized restart; no restart was performed here.

W-06 remains **COMPLETE — OWNER ATTESTED**. The owner-attested Friday closing snapshot and its `UNAVAILABLE` freshness remain unchanged. W-11 remains partial until the approved revision/path is identified and the roadmap's connected-daemon verification is independently completed. W-07 is separately scoped after tracking this dependency.
