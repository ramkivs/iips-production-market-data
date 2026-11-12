# DHAN W-06 — First Authorised Authenticated Request: Execution Record and Evidence Assessment (2026-11-12)

**Status:** **W-06 NOT CLOSED.** One authorised request was executed and is recorded here; its typed
outcome was not captured and cannot be recovered from the daemon, the repository or any retained
artefact. A local `/v1/freshness` read of the same daemon (§2 step 8, §4.1) now shows that the request
**entered the provider refresh path and failed there** — one bit of narrowing, still no typed code, and
still no statement about what the vendor did. No second vendor request was made, and none is authorised
by this document.
**Roadmap authority:** `ramkivs/iips-review-recovered` → `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` (v1.1), §W-06 (read-only; not modified).
**Repository:** `ramkivs/iips-production-market-data`, branch `arena/84d1e063-iips-production-market-data`, W-06 executed against `2cced8f`/`a70ed15`.
**Host:** the governed Windows workstation, Windows PowerShell, market-data daemon on `http://127.0.0.1:8791`.

> **No credential appears in this file, and none was captured in the execution either.** The record
> contains no token, no client id, no ciphertext, no fingerprint identifier, no secret-reference
> pointer and no carrier path. It also contains **no inference** that the request reached the vendor or
> that the vendor accepted or rejected the credentials.

---

## 1. Authorisation and scope

| Item | State |
| --- | --- |
| Vendor requests authorised | **exactly one** controlled authenticated request |
| Vendor requests executed | **one** — `POST /v1/quotes` (§4) |
| Vendor requests made while preparing this record | **none** (this record is built from local code, local state and the operator's captured output) |
| Second request, retry, `/v1/historical` or any other vendor interaction | **not authorised**; not performed |

Roadmap W-06 (v1.1) is quoted verbatim for the criteria this record is assessed against:

- **Scope:** "…issues **one** controlled authenticated request. Record: startup diagnostics line, selector and backend readiness, credential-resolution outcome, request outcome, HTTP status class, and a full grep of daemon stdout/stderr and the response for both secret values and for any location string."
- **Verification:** "The previously observed `CREDENTIALS_UNAVAILABLE` no longer occurs; the outcome is a structural success or a typed auth failure; zero occurrences of either secret, any `vault://` string and any carrier path in all captured output."
- **Exit criteria:** "One authenticated vendor interaction completes; the secret and its location are absent from every artefact."

---

## 2. Execution record

| # | Step | Observed | Assessment |
| --- | --- | --- | --- |
| 1 | W-04 `verify all` before start | client-id `PRESENT_OK`, access-token `PRESENT_OK` (present/readable/owner-only/schema-valid/identity and version matched/unexpired), exit `0` | **recorded** — credential *references* are configured and resolvable locally |
| 2 | Daemon start (DPAPI backend, transport token set) | the startup diagnostics line in §3 | **recorded** — local composition complete, egress mode `IPD_SERVER_HTTPS`, no vendor call at startup |
| 3 | Local instrument discovery | `POST /v1/instruments/search` for `RELIANCE` → 2 qualified mappings; NSE one selected: `companyId EQ_RELIANCE_IN`, `securityId ISIN:INE002A01018:EQ`, `exchange NSE`, `status QUALIFIED`, `isinAuthority NON_AUTHORITATIVE` | **recorded** — no vendor call (local registry only) |
| 4 | The single vendor-touching request | `POST /v1/quotes` (§4) → `HTTP_STATUS=502`, response body **not captured** | **executed, outcome not retained** |
| 5 | Health check without the transport header | `401 {"error":{"code":"UNAUTHENTICATED","message":"missing or invalid transport credential"}}` | recorded — a Layer-B auth failure, **not** evidence about Dhan |
| 6 | Health check with the transport header | `{"service":"UP","providerConfiguration":"CONFIGURED","liveProviderConnectivity":"NOT_CHECKED_PRE_ACCESS","providerQualification":"SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED"}` | recorded — carries **no** information about the request (§6.3) |
| 7 | Daemon stderr | startup diagnostics line only; no per-request outcome or typed error | recorded — expected (§6.4) |
| 8 | Local `GET /v1/freshness` scoped to the same instrument, against the **same daemon process** | `domain D01_QUOTES`, `cacheState MISS`, `verdict UNKNOWN`, `lastRefresh.outcome FAILURE`, `lastFailure.code REFRESH_FAILED`, `priorPreserved false`, `eligibleForUse false`, `suppressExecution true`, `evaluatedAt 2026-11-12T18:58:23.526Z` | **recorded** — the request entered the provider refresh path and failed inside it; the typed code is still unknown (§4.1) |

**Not recorded at execution time:** the request's wall-clock time, its latency, and the response body.
No capture of those exists anywhere now, and they are not reconstructed here.

---

## 3. Startup diagnostics (verbatim, as observed)

```text
[ipd-market-data-daemon] listening on http://127.0.0.1:8791 (providerReadiness=CREDENTIAL_REFERENCES_CONFIGURED, vaultBackend=WINDOWS_DPAPI_USER_SCOPE, vaultBackendSelector=windows-dpapi, vaultBackendReadiness=READY, liveCredentialResolution=true, credentialReadiness=CONFIGURED, providerState=CREDENTIALS_RESOLVED, vendorEgress=IPD_SERVER_HTTPS, qualifiedMappings=96)
```

This satisfies the roadmap's "startup diagnostics line, selector and backend readiness,
credential-resolution outcome" items. It is a **startup** statement: `providerState=CREDENTIALS_RESOLVED`
is the local ceiling and does not describe what later happened on the wire.

---

## 4. The request, exactly as sent

```text
POST http://127.0.0.1:8791/v1/quotes
Authorization: Bearer <IIPS_MARKET_DATA_TRANSPORT_TOKEN>   (value withheld; transport credential, not a Dhan credential)
Content-Type: application/json
```

```json
{
  "companyId": "EQ_RELIANCE_IN",
  "securityId": "ISIN:INE002A01018:EQ",
  "exchangeSegment": "NSE_EQ"
}
```

Observed result: `HTTP_STATUS=502`. The response body was not captured by the caller's error handler.

### 4.1 Local refresh state for the same scope (recorded after the fact, no vendor interaction)

While the same daemon process was still running, `GET /v1/freshness` was called for the exact scope of
the request. The response, as observed:

```json
{
  "domain": "D01_QUOTES",
  "cacheState": "MISS",
  "verdict": "UNKNOWN",
  "lastRefresh": {
    "outcome": "FAILURE",
    "lastFailure": { "code": "REFRESH_FAILED", "priorPreserved": false }
  },
  "eligibleForUse": false,
  "suppressExecution": true,
  "evaluatedAt": "2026-11-12T18:58:23.526Z"
}
```

Only the fields above are recorded; the rest of the payload was not supplied and is not reconstructed.

| Field | What it establishes | What it does not |
| --- | --- | --- |
| `lastRefresh.outcome: FAILURE` | the request reached `DhanMarketDataSource.fetchSnapshot` — i.e. credential resolution and the provider call were **entered** and the attempt failed there, not before it | which failure it was: every provider-path failure, including a credential failure that never opened a socket, records exactly this |
| `lastFailure.code: REFRESH_FAILED` | the read-only surface is doing its job — the provider code is normalised away by D-7 disclosure and can never be read back from here | the typed failure code, the vendor status, or whether the vendor was contacted |
| `priorPreserved: false` | there was no earlier successful observation for this scope to preserve | anything about the attempt itself |
| `cacheState: MISS`, `verdict: UNKNOWN`, `eligibleForUse: false` | no quote envelope exists for this scope: nothing was produced and nothing was cached | why nothing was produced |
| `suppressExecution: true` | the **no-observation** branch of the projection (`evaluation?.suppressExecution ?? true`): absence of any observation suppresses execution | it is **not** the `STALE_DATA_SUPPRESSED` branch — no stale quote was suppressed here, because there was no quote at all |
| `evaluatedAt: 2026-11-12T18:58:23.526Z` | when the read ran; the request therefore preceded this instant, and the daemon that served the request was still the same live process | the request's own time, which was never recorded |

This is one bit of narrowing and no more. It rules out every explanation that would have been decided
**before** the provider refresh path, and it leaves the vendor question exactly where it was: a
credential failure that never reached the network and a vendor answer are recorded identically here.
Suite case **W06-07** proves that by producing the same projection from a credential-unavailable
service that makes zero vendor calls and from a service whose vendor call returns 401.

---

## 5. What the recorded outcome establishes — and what it does not

The route's status contract (`src/providers/dhan/dhan_market_data_http.ts`) is: `401` Layer-B auth,
`400` malformed request, `413` body too large, `504` layer-level execution timeout, `429` rate limit,
and **`502` for any other typed provider failure** — the body being `{ "error": { "code", "message" } }`.

**Established by the recorded `502`:**

1. The request passed Layer-B authentication (not `401`) — corroborated by the `401` the same token-less
   health call received at step 5, which shows the gate is live.
2. Its body passed the route's own validation (not `400`, not `413`): the identity grammar and
   `companyId` were accepted before the service was invoked.
3. The service was running and returned a **typed failure** (not `500`).
4. It was **not** a local rate limit (`429`) and **not** the layer-level 10 s bounded-execution timeout
   (`504`).
5. The failure occurred **inside the provider refresh path** (§4.1): credential resolution and the
   provider call were entered, and the attempt failed there. Everything decided earlier — request
   validation, identity resolution, service lifecycle — is therefore excluded as the explanation.

**Not established — and not inferable:**

- Whether any TCP/TLS connection to `api.dhan.co` was opened.
- Whether Dhan received the request at all.
- Whether Dhan accepted or rejected the credentials.
- The vendor's HTTP status, or even its status class.
- Whether the token was still unexpired *at request time*.
- The typed failure code: `REFRESH_FAILED` is a redacted projection, not the code (§4.1).
- Whether the failure was credentials, transport, timeout or a vendor answer — all four are recorded
  identically by the freshness read (§4.1, W06-07).

A `502` is equally consistent with a failure that never left the host (`CREDENTIALS_UNAVAILABLE`,
`TRANSPORT_FAILURE`, `TIMEOUT`) and with a vendor answer (`AUTHENTICATION_FAILURE`, `HTTP_ERROR`,
`STALE_DATA_SUPPRESSED`, `MALFORMED_RESPONSE`, `CANONICAL_VALIDATION_FAILURE`). §4.1 narrows the field
to exactly that set and no further: the two halves of it remain indistinguishable from the retained
evidence.

---

## 6. Why the outcome is not recoverable

### 6.1 The caller discarded it

PowerShell's `Invoke-RestMethod` throws on a non-2xx response; the body is reachable through
`$_.ErrorDetails.Message` (or `$_.Exception.Response`). The handler read neither, so the body was
discarded from the script's view. Nothing in IPD's contract caused this: the daemon **did** send
`{ "error": { "code", "message" } }` with the 502.

### 6.2 The daemon deliberately sends only a code and a message

`sendError(res, status, code, message)` writes exactly `{"error":{"code","message"}}`
(`dhan_market_data_http.ts:127-129`). The provider failure's `httpStatus` — the only place a vendor
numeric status would appear — is **not** echoed. So even a perfectly captured body would carry the
typed code, not the numeric vendor status.

### 6.3 The health endpoint cannot testify

`ServiceHealth` (`dhan_market_data_service.ts:60-70`) has `liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS'`
as a **literal**, assigned unconditionally in `health()` (`:248-258`). `providerConfiguration` only
distinguishes the pre-access configuration from a configured one. Nothing in that payload changes
because a request was made, so steps 5–6 are structurally incapable of reporting connectivity either
way. `healthCheck()` also performs no network call (`dhan_market_data_source.ts:162-168`).

### 6.4 Nothing per request is logged or persisted

The daemon writes to stderr only at startup and on shutdown signals (`dhan_local_daemon.ts:666,704-716`);
the HTTP layer, the service and the client contain no console output at all. The service keeps bounded
**in-memory** diagnostics only (`refreshStatus`, `:113`) and there is no telemetry sink, no audit file
and no persistence in the daemon path. Restarting the daemon clears the only trace that exists.

### 6.5 The repository holds nothing

No IPD file records requests or outcomes at runtime; the working tree at `a70ed15` is clean, and no
artefact of this execution was written to it.

---

## 7. Recovery paths that involve no vendor interaction

| Path | How | What it can yield | Limits |
| --- | --- | --- | --- |
| **A. The still-open PowerShell session** | In the *same* session that received the 502, inspect `$Error[0]` — specifically `$Error[0].ErrorDetails.Message` (and `$Error[0].Exception.Response` if present) | Possibly the full `{"error":{"code","message"}}` body — the only route to the typed code | Only while that session survives; if it was closed, the value is gone |
| **B. `/v1/freshness` scoped to the same instrument** | `GET /v1/freshness?domain=D01_QUOTES&companyId=EQ_RELIANCE_IN&exchangeSegment=NSE_EQ&securityId=ISIN:INE002A01018:EQ` with the transport header — **executed** at `2026-11-12T18:58:23.526Z`, result in §4.1 | One bit, and it has now been read: `lastRefresh.outcome = FAILURE` — the provider path was entered and failed | Exhausted. `lastFailure` is normalised to `{"code":"REFRESH_FAILED"}` by D-7 disclosure and the projection is identical for a credential failure and a vendor rejection (W06-07), so re-reading it cannot yield the code |
| **C. Host-side capture** | Any `Start-Transcript`, redirected console log, or terminal scrollback from the session | The body, if such a capture existed | Not claimed: the operator reports no such artefact |
| **D. Daemon files, logs, repo** | — | **Nothing** (§6.2–6.5) | — |

Path B is proven to be local-only and code-redacting by suite case **W06-03** in
`tests/dhan_w06_first_request_evidence.test.ts`; the daemon and its memory are the only remaining state,
and they die with the process.

---

## 8. What each recovery outcome would mean

| Recovered typed code | What it proves | W-06 consequence |
| --- | --- | --- |
| `AUTHENTICATION_FAILURE` | the vendor answered 401/403 — the credentials were presented and were not accepted | the roadmap's Verification clause ("…or a typed auth failure") is met; the credential problem remains to be fixed |
| `STALE_DATA_SUPPRESSED`, `MALFORMED_RESPONSE`, `CANONICAL_VALIDATION_FAILURE`, `HTTP_ERROR` | the vendor answered; the local pipeline then rejected the payload | an authenticated interaction is evidenced by the code path, but it is **not** a structural success and not an auth failure; the owner must decide the reading |
| `TRANSPORT_FAILURE`, `TIMEOUT` | no vendor verdict | W-06 open — no authenticated interaction evidenced |
| `CREDENTIALS_UNAVAILABLE` / `CREDENTIALS_EXPIRED` | refused locally, **no vendor call** | W-06 open — and the roadmap's `CREDENTIALS_UNAVAILABLE` verification clause would be violated |
| `UNKNOWN` from path B | the request never reached the provider path | **excluded** — path B was executed and returned `FAILURE` (§4.1) |

Only the first row would let W-06 close without another request; every other row leaves the exit
criterion unmet.

---

## 9. W-06 status

| Roadmap criterion | State | Basis |
| --- | --- | --- |
| One controlled authenticated request issued | **met** | §4 — exactly one |
| Startup diagnostics, selector/backend readiness, credential-resolution outcome recorded | **met** | §3 |
| Request outcome recorded | **not met** | only the daemon's `502` and a redacted `REFRESH_FAILED` projection survived; the typed code did not (§4.1) |
| HTTP status class recorded | **partially met** | the daemon's status is known; the vendor's class is not |
| `CREDENTIALS_UNAVAILABLE` no longer occurs | **not demonstrated** | a 502 is consistent with `CREDENTIALS_UNAVAILABLE`; nothing recorded excludes it |
| Outcome is a structural success or a typed auth failure | **not met** | neither is evidenced |
| Zero occurrences of either secret, any `vault://` string and any carrier path in captured output | **met (over what exists)** | the only captured output is §2–§7, and it contains none |
| One authenticated vendor interaction completes | **not demonstrated** | the attempt entered the provider refresh path and failed there (§4.1); whether the vendor saw it is unknown |

**W-06 is NOT closed.** The gap is precise and singular: **the typed failure code of the one
authorised request was never persisted**, and no retained artefact can distinguish a vendor answer
from a local refusal. §4.1 rules out the pre-provider explanations and stops there; it does not
recover the code, and it does not convert a failed attempt into an authenticated interaction.
Recording W-06 as complete on a bare `502` plus a redacted `REFRESH_FAILED` would be manufacturing
evidence.

**No second request is authorised.** Path B has been executed and exhausted (§4.1). Closing W-06 now
requires either a successful Path A recovery (the PowerShell error record) that identifies the typed
code, or an explicit new authorisation for one further controlled request run under the capture
protocol in §10.

---

## 10. Capture protocol for any future authorised request

Not performed here; recorded so the gap cannot recur:

1. Capture status **and** body together: PowerShell 7 `Invoke-WebRequest -SkipHttpErrorCheck`, or
   Windows PowerShell 5.1 `try/catch` reading `$_.ErrorDetails.Message`, or `curl.exe -i` — writing the
   exchange to a file, not to the scrollback.
2. Immediately before and after, run the two local reads that need no vendor call: `GET /v1/health` and
   the scoped `GET /v1/freshness` of §7-B.
3. Never retry: one authorised request means exactly one (the client has no retry path for
   auth/expiry by design).
4. Grep the captured file, the daemon stderr and the transcript for both secret values, any `vault://`
   string and any carrier path **before** the evidence is accepted.
5. Keep the capture file out of Git; record only the sanitised code, class and message.

---

## 11. Record integrity

- Captured output quoted here: the startup line, the two health responses, the `502` status, the
  discovery result, and the scoped `/v1/freshness` response of §4.1 — nothing else.
- Not quoted or reconstructed: the response body, the request time, latency, the vendor status.
- No credential value, client-id value, token, ciphertext, `vault://` reference or carrier path appears
  in this file; none was captured during the execution.
- This document grants no authorisation. The one-request authorisation was consumed.
