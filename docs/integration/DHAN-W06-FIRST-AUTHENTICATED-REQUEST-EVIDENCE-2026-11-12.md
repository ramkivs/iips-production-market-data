# DHAN W-06 — First Authorised Authenticated Request: Execution Record and Evidence Assessment (2026-11-12)

**Status:** **W-06's evidence clause is satisfied. M1 is NOT satisfied. W-06 remains open.**
Two controlled `/v1/quotes` requests were executed in total. The first returned `502` and its body was
lost (§4–§7). The second, at 2026-11-12T19:42:05Z, was captured in full (§12): daemon status `502`,
typed code **`AUTHENTICATION_FAILURE`**, message "Dhan rejected the request credentials", 5,893 ms.
That code has exactly one producer in this repository — `DhanApiClient.mapHttpStatus` — and it is
emitted only for a **received** vendor response with status `401` or `403` (§12.2). The vendor therefore
answered, and it rejected the credentials. Which of those two statuses it was, and the vendor's own
error text, are not in the capture and are not invented here. Because authentication did not succeed,
M1's definition and its exit criteria remain unmet (§13); no quote, history, freshness or
production-readiness claim is made. The stop rule was applied on the first decisive capture, and no
further vendor request is authorised or needed.

**Owner authorisation, 2026-11-12 (consumed):** multiple controlled `/v1/quotes` attempts were
authorised on the token that was provisioned at the time, until its expiry, to repair the capture
defect of the first attempt. §1.1 states how that sat against the roadmap's one-request scope; §10 is
the procedure that was run; §12 records what it produced. One attempt was used; the rest of the
authorisation lapsed unused because the first capture was decisive.
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
| Vendor requests authorised | **one** originally; **extended by the owner on 2026-11-12** to multiple controlled `/v1/quotes` attempts on the same provisioned token, until it expired; **the extension is now consumed** (one attempt used, the rest not needed) |
| Vendor requests executed | **two** — `POST /v1/quotes` (§4, outcome uncaptured) and `POST /v1/quotes` (§12, captured in full) |
| Capture attempts consumed | **one of the permitted attempts**; the stop rule of §10.4 was applied on the decisive capture (§12.3) |
| Vendor requests made while preparing this record | **none** (this record is built from local code, local state and the operator's captured output) |
| `/v1/historical`, or any vendor interaction other than `/v1/quotes` | **not authorised**; not performed |

Roadmap W-06 (v1.1) is quoted verbatim for the criteria this record is assessed against:

- **Scope:** "…issues **one** controlled authenticated request. Record: startup diagnostics line, selector and backend readiness, credential-resolution outcome, request outcome, HTTP status class, and a full grep of daemon stdout/stderr and the response for both secret values and for any location string."
- **Verification:** "The previously observed `CREDENTIALS_UNAVAILABLE` no longer occurs; the outcome is a structural success or a typed auth failure; zero occurrences of either secret, any `vault://` string and any carrier path in all captured output."
- **Exit criteria:** "One authenticated vendor interaction completes; the secret and its location are absent from every artefact."

### 1.1 How the owner's expanded authorisation sits against "one controlled request"

The roadmap is read-only here and its W-06 scope says **one** controlled authenticated request. The
owner's extension does not amend the roadmap; it governs the *attempts*, and it is recorded with these
bounds:

1. **The evidence unit is still one decisive interaction.** W-06 closes on the first attempt whose
   outcome is captured and decisive (§10.4) — a structural success, a typed authentication failure, or
   another vendor-answered rejection. Subsequent attempts do not add evidence and are not authorised
   once that happens.
2. **The extension repairs a capture defect, not an outcome.** Attempt #1 was made and its body lost to
   the caller's own error handling (§4, §6.1). The additional attempts exist because nothing about
   attempt #1 was recorded, not to retry a captured failure or to obtain a more favourable result.
3. **Every attempt is recorded.** Each `POST /v1/quotes` is a numbered, individually captured entry —
   status, typed code, class, timing, body — and the record states how many attempts were made. An
   attempt that is not captured is recorded as uncaptured; it is never silently dropped.
4. **One POST may be several vendor sends.** The service wraps each provider fetch in a bounded retry
   of at most **3** attempts for transient failures only (`RATE_LIMITED`, `TIMEOUT`, `TRANSPORT_FAILURE`,
   `HTTP_ERROR` with a 5xx status); auth, expiry, credential and validation failures are never retried
   (`dhan_operational_controls.ts`, `withBoundedRetry`). The roadmap's "one request" never governed that
   internal bound, and the record states the true range: vendor sends ≥ captured POSTs, ≤ 3 × the
   POSTs whose outcome was transient.
5. **No adaptation between attempts.** Same identity, same route, same body (§10.3). Nothing is tuned
   to make an attempt succeed; that would turn an observation into a search.

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

> **Scope of this section:** it assesses attempt #1 (§4) as it stood before any further request, and it
> is left as written. Its ambiguity was resolved by attempt #2's capture (§12), not by re-reading the
> evidence below; nothing in this section has been retro-fitted to the answer.

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
| One controlled authenticated request issued | **met** | §4 (attempt #1) and §12 (attempt #2), both `POST /v1/quotes` |
| Startup diagnostics, selector/backend readiness, credential-resolution outcome recorded | **met** | §3, plus §12.2 item 3 for the resolution outcome at request time |
| Request outcome recorded | **met** | §12 — attempt #2's daemon status, typed code and message were captured |
| HTTP status class recorded | **met, both layers** | daemon `5xx` (`502`, its own transport status); the vendor answered in the `4xx` auth class — `401` **or** `403`, not distinguishable from the capture (§12.2) |
| `CREDENTIALS_UNAVAILABLE` no longer occurs | **met** | the captured code cannot arise from a local credential refusal; those return before any send (§12.2 item 2) |
| Outcome is a structural success or a typed auth failure | **met** | typed auth failure — `AUTHENTICATION_FAILURE` (§12) |
| Zero occurrences of either secret, any `vault://` string and any carrier path in captured output | **met for the HTTP bodies and this record**; console and IRR log by operator statement only | §12.4 |
| One authenticated vendor interaction completes | **not met** | the vendor rejected the credentials: the interaction completed as a rejection, not as an authentication (§13) |

**W-06 remains open, but no longer for want of evidence.** The evidence clause of the roadmap's W-06
verification is satisfied: the outcome is a **typed auth failure**, established without inference
(§12.2). What remains open is the milestone itself — M1 requires that authentication *succeeds*
(§13), and a captured rejection cannot be converted into a success by any amount of record-keeping.

**Attempt #1 is still unexplained and is left that way.** Its typed failure code was never persisted,
and no retained artefact recovers it. That gap is now immaterial to the verdict — attempt #2 produced
a decisive code for the same route and the same scope — but it is not retroactively filled in, and
this record does not claim attempt #1 was an authentication failure.

**The authorisation is exhausted for evidence purposes.** The stop rule of §10.4 fired on the first
decisive capture; no further `/v1/quotes` attempt is authorised or needed, and none was made.

---

## 10. Capture procedure for the authorised attempts

Everything here runs on the workstation, against the daemon already running on `127.0.0.1:8791`.
Nothing in it makes a vendor request except the `/v1/quotes` probe in §10.3, and nothing in it puts a
secret on a command line, in the shell history or on disk.

### 10.1 Preconditions

- The daemon from the W-06 start is **still running** — do not restart it. Restarting clears the
  in-memory refresh state that §4.1 depends on, and loses the console text.
- The transport token is in the session environment. If it is not, enter it once with hidden input
  (§10.2); it is never typed into the command line.
- Evidence goes to `%TEMP%\w06-evidence` — outside the Git worktree, never committed.

### 10.2 Session setup and capture function (paste as one block)

```powershell
$Base = 'http://127.0.0.1:8791'
if (-not $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN) {
  $ss = Read-Host -AsSecureString 'Transport token (hidden input)'
  $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN = [System.Net.NetworkCredential]::new('', $ss).Password
  Remove-Variable ss
}
$Headers  = @{ Authorization = "Bearer $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN" }   # in-process only
$Evidence = Join-Path $env:TEMP 'w06-evidence'
New-Item -ItemType Directory -Force -Path $Evidence | Out-Null
$QuoteBody = '{"companyId":"EQ_RELIANCE_IN","securityId":"ISIN:INE002A01018:EQ","exchangeSegment":"NSE_EQ"}'
$FreshPath = '/v1/freshness?domain=D01_QUOTES&companyId=EQ_RELIANCE_IN&exchangeSegment=NSE_EQ&securityId=ISIN:INE002A01018:EQ'

function Invoke-IpdProbe {
  param([Parameter(Mandatory)][string]$Name, [Parameter(Mandatory)][string]$Path,
        [string]$Method = 'GET', [string]$Body)
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $status = $null; $text = $null; $caught = $null
  try {
    $p = @{ Uri = "$Base$Path"; Method = $Method; Headers = $Headers; TimeoutSec = 30 }
    if ($Body) { $p.Body = $Body; $p.ContentType = 'application/json' }
    if ($PSVersionTable.PSVersion.Major -ge 7) { $r = Invoke-WebRequest @p -SkipHttpErrorCheck }
    else                                       { $r = Invoke-WebRequest @p -UseBasicParsing }
    $status = [int]$r.StatusCode; $text = $r.Content
  } catch {
    $caught = $_.Exception.Message
    if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $text = $_.ErrorDetails.Message }
    elseif ($_.Exception.Response) {
      try {
        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $text = $sr.ReadToEnd(); $sr.Dispose()
      } catch { }
    }
  }
  $sw.Stop()
  $rec = [ordered]@{
    probe = $Name; method = $Method; path = $Path
    atUtc = (Get-Date).ToUniversalTime().ToString('o')
    elapsedMs = [int]$sw.ElapsedMilliseconds
    httpStatus = $status
    statusClass = if ($status) { '{0}xx' -f [int][math]::Floor($status / 100) } else { 'NO_RESPONSE' }
    typedCode = $null; message = $null; freshness = $null; exceptionMessage = $caught; body = $text
  }
  if ($text) {
    try {
      $j = $text | ConvertFrom-Json
      if ($j.error)        { $rec.typedCode = $j.error.code; $rec.message = $j.error.message }
      elseif ($j.ok)       { $rec.typedCode = 'OK'; $rec.freshness = $j.freshness }
      elseif ($j.service)  { $rec.typedCode = 'HEALTH' }
      elseif ($j.lastRefresh) { $rec.typedCode = $j.lastRefresh.outcome }
    } catch { $rec.typedCode = 'UNPARSEABLE' }
  }
  $rec | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 (Join-Path $Evidence "$Name.json")
  '{0} -> HTTP {1} ({2}) code={3} {4}ms' -f $Name, $rec.httpStatus, $rec.statusClass, $rec.typedCode, $rec.elapsedMs
}
```

The status is taken from the response object on success and from the exception's response on failure;
the body from the response on success and from `ErrorDetails.Message` (with a stream fallback) on
failure — the two paths whose absence lost the first attempt's body (§6.1). One JSON file is written
per probe; the console shows one summary line.

### 10.3 Sequence — five probes, then stop or repeat step 3

```powershell
Invoke-IpdProbe -Name 'w06-01-health-before'    -Path '/v1/health'
Invoke-IpdProbe -Name 'w06-02-freshness-before' -Path $FreshPath
Invoke-IpdProbe -Name 'w06-03-quotes-attempt1' -Method POST -Path '/v1/quotes' -Body $QuoteBody
Invoke-IpdProbe -Name 'w06-04-health-after'     -Path '/v1/health'
Invoke-IpdProbe -Name 'w06-05-freshness-after'  -Path $FreshPath
```

Read `w06-03-quotes-attempt1.json` against §10.4. **Decisive** → stop; do not repeat. **Not decisive** →
repeat probe 3 only, as `-Name 'w06-03-quotes-attempt2'`, then probes 4–5 again. Same identity, same
route, same body, one attempt at a time, never in a loop.

### 10.4 Stop table — what each captured outcome establishes

The daemon returns `200` with `{ok:true,…}`, `429` for a `RATE_LIMITED` failure, and `502` for every
other typed failure, always as `{"error":{"code","message"}}`. A single POST can be up to three vendor
sends (§1.1 item 4); the codes marked **vendor** are the ones that cannot arise without a vendor answer.

| Captured on the `/v1/quotes` probe | What it establishes | Action |
| --- | --- | --- |
| `200` `{ok:true, envelope, freshness}` | **vendor** 2xx, credentials accepted, quote produced | **decisive — M1 authentication established.** Stop. This is not quote qualification (W-06 qualifies nothing) |
| `502 STALE_DATA_SUPPRESSED` | **vendor** 2xx and a parseable quote: suppression happens after the call, when the quote is older than twice the 15-minute D01 threshold | **decisive for authentication.** Stop — expected outside market hours. Do not repeat for a "fresher" quote |
| `502 MALFORMED_RESPONSE` / `CANONICAL_VALIDATION_FAILURE` / `MISSING_REQUIRED_FIELD` | **vendor** 2xx with a body this pipeline rejects | **decisive for authentication.** Stop; record the payload-level defect separately |
| `502 AUTHENTICATION_FAILURE` | **vendor** 4xx (401/403): the credentials were presented and rejected | **decisive — typed auth failure.** Stop; fix the credential before any later work |
| `502 HTTP_ERROR` (message carries the number) | **vendor** answered non-2xx | decisive — vendor interaction with its class. Stop |
| `429 RATE_LIMITED` | ambiguous: the local per-minute budget (no vendor send) **or** a vendor 429 | wait ≥60 s, one more attempt |
| `502 TRANSPORT_FAILURE` / `502 TIMEOUT` | ambiguous: no vendor verdict (and up to 3 sends may have been attempted) | one more attempt after ≥5 s, at most 3 attempts in total |
| `502 CREDENTIALS_UNAVAILABLE` / `CREDENTIALS_EXPIRED` | local pre-flight, **no vendor send** | re-run the W-04 `verify all`, repair the store, then one more attempt |
| `401 UNAUTHENTICATED` | the transport token is wrong — the request never reached the service | fix the token in-session; recapture |
| `400 MALFORMED_REQUEST` | our body or scope was wrong — no vendor send | correct it and recapture; do not change the identity without recording why |
| `413 REQUEST_TOO_LARGE` | our body exceeded the daemon's configured limit — no vendor send | not expected with this 93-byte body; if captured, stop and report it rather than trimming and retrying |
| `504 REQUEST_TIMEOUT` (layer) | the call may have been in flight when the 10 s layer bound closed | ambiguous; one more attempt |

**Observed on 2026-11-12T19:42:05Z:** the `/v1/quotes` probe returned `502 AUTHENTICATION_FAILURE`
(§12). That is the decisive auth-failure row; the stop rule was applied and no further attempt was
made.

### 10.5 Redaction evidence — required before any attempt is accepted

```powershell
$ProbeFiles = (Get-ChildItem $Evidence -Filter *.json).FullName
Select-String -Path $ProbeFiles -Pattern 'eyJ','vault://','dhan-secrets','dhan-client-id\.carrier',
  'dhan-access-token\.carrier','H:\\IIPS\\runtime','1000\d{6}' -AllMatches |
  Select-Object Path, LineNumber, Pattern
```

Any output means the evidence is **not** acceptable — a JWT prefix, a secret reference, a carrier path
or a client-id-shaped number reached a captured artefact. Also run the same pattern list over the
daemon's console text.

Optional exact-value check, without exposing either value (hidden input, never printed, never on argv):

```powershell
$ss = Read-Host -AsSecureString 'Access token, one-shot grep (hidden)'
$plain = [System.Net.NetworkCredential]::new('', $ss).Password
if (Select-String -Path $ProbeFiles -Pattern ([regex]::Escape($plain)) -Quiet) { 'SECRET FOUND - REJECT EVIDENCE' } else { 'token absent' }
$plain = $null; Remove-Variable ss, plain
```

Repeat for the client id if it is available in the same form.

### 10.6 What to hand back, and what not to do

- **Hand back:** the `w06-0*.json` files (or their `httpStatus`, `statusClass`, `typedCode`, `message`,
  `elapsedMs`, `atUtc` and — for the quotes probe — `body` fields) and the daemon console text.
- **Do not:** restart the daemon; repeat after a decisive capture; use `/v1/historical`; change the
  identity or the body between attempts; put the token on a command line; commit the evidence files.

---

## 11. Record integrity

- Captured output quoted here: the startup line, the two health responses, the `502` status, the
  discovery result, the scoped `/v1/freshness` response of §4.1, and the five probe artefacts of §12.1
  reproduced from the files the operator supplied — nothing else.
- Not quoted or reconstructed: attempt #1's response body, its request time, its latency, its typed
  code, and in both attempts the vendor's numeric status and the vendor's own error text.
- No credential value, client-id value, token, ciphertext, `vault://` reference or carrier path appears
  in this file; none was captured during the execution.
- This document grants no authorisation of its own: it records the owner's 2026-11-12 extension (§1.1)
  and the procedure that operates it (§10).

---

## 12. The captured attempt — five probe artefacts (2026-11-12)

These are the files the operator produced with §10.2–§10.3 and supplied verbatim. Their contents
were re-parsed and checked field by field before being reproduced here; nothing in them has been
edited, reordered or rounded.

### 12.1 The artefacts

**`w06-01-health-before.json`**

```json
{
  "probe": "w06-01-health-before",
  "method": "GET",
  "path": "/v1/health",
  "atUtc": "2026-11-12T19:41:59.1168539Z",
  "elapsedMs": 68,
  "httpStatus": 200,
  "statusClass": "2xx",
  "typedCode": "HEALTH",
  "message": null,
  "exceptionMessage": null,
  "body": "{\"service\":\"UP\",\"providerConfiguration\":\"CONFIGURED\",\"liveProviderConnectivity\":\"NOT_CHECKED_PRE_ACCESS\",\"providerQualification\":\"SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED\"}"
}
```

**`w06-02-freshness-before.json`**

```json
{
  "probe": "w06-02-freshness-before",
  "method": "GET",
  "path": "/v1/freshness?domain=D01_QUOTES&companyId=EQ_RELIANCE_IN&exchangeSegment=NSE_EQ&securityId=ISIN:INE002A01018:EQ",
  "atUtc": "2026-11-12T19:41:59.2286663Z",
  "elapsedMs": 29,
  "httpStatus": 200,
  "statusClass": "2xx",
  "typedCode": "FAILURE",
  "message": null,
  "exceptionMessage": null,
  "body": "{\"domain\":\"D01_QUOTES\",\"cacheState\":\"MISS\",\"asOf\":null,\"timestampEvidence\":\"NOT_AVAILABLE\",\"receivedAt\":null,\"evaluatedAt\":\"2026-11-12T19:41:59.194Z\",\"observationEvaluatedAt\":null,\"thresholdSeconds\":900,\"ageSeconds\":null,\"verdict\":\"UNKNOWN\",\"staleConcessionActive\":false,\"suppressExecution\":true,\"eligibleForUse\":false,\"lastRefresh\":{\"outcome\":\"FAILURE\",\"lastFailure\":{\"code\":\"REFRESH_FAILED\",\"priorPreserved\":false}}}"
}
```

**`w06-03-quotes-attempt1.json`**

```json
{
  "probe": "w06-03-quotes-attempt1",
  "method": "POST",
  "path": "/v1/quotes",
  "atUtc": "2026-11-12T19:42:05.1740778Z",
  "elapsedMs": 5893,
  "httpStatus": 502,
  "statusClass": "5xx",
  "typedCode": "AUTHENTICATION_FAILURE",
  "message": "Dhan rejected the request credentials",
  "exceptionMessage": "The remote server returned an error: (502) Bad Gateway.",
  "body": "{\"error\":{\"code\":\"AUTHENTICATION_FAILURE\",\"message\":\"Dhan rejected the request credentials\"}}"
}
```

**`w06-04-health-after.json`**

```json
{
  "probe": "w06-04-health-after",
  "method": "GET",
  "path": "/v1/health",
  "atUtc": "2026-11-12T19:42:05.3305256Z",
  "elapsedMs": 67,
  "httpStatus": 200,
  "statusClass": "2xx",
  "typedCode": "HEALTH",
  "message": null,
  "exceptionMessage": null,
  "body": "{\"service\":\"UP\",\"providerConfiguration\":\"CONFIGURED\",\"liveProviderConnectivity\":\"NOT_CHECKED_PRE_ACCESS\",\"providerQualification\":\"SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED\"}"
}
```

**`w06-05-freshness-after.json`**

```json
{
  "probe": "w06-05-freshness-after",
  "method": "GET",
  "path": "/v1/freshness?domain=D01_QUOTES&companyId=EQ_RELIANCE_IN&exchangeSegment=NSE_EQ&securityId=ISIN:INE002A01018:EQ",
  "atUtc": "2026-11-12T19:42:14.4035727Z",
  "elapsedMs": 29,
  "httpStatus": 200,
  "statusClass": "2xx",
  "typedCode": "FAILURE",
  "message": null,
  "exceptionMessage": null,
  "body": "{\"domain\":\"D01_QUOTES\",\"cacheState\":\"MISS\",\"asOf\":null,\"timestampEvidence\":\"NOT_AVAILABLE\",\"receivedAt\":null,\"evaluatedAt\":\"2026-11-12T19:42:14.375Z\",\"observationEvaluatedAt\":null,\"thresholdSeconds\":900,\"ageSeconds\":null,\"verdict\":\"UNKNOWN\",\"staleConcessionActive\":false,\"suppressExecution\":true,\"eligibleForUse\":false,\"lastRefresh\":{\"outcome\":\"FAILURE\",\"lastFailure\":{\"code\":\"REFRESH_FAILED\",\"priorPreserved\":false}}}"
}
```

Summary, as captured (not re-derived):

| Probe | `atUtc` | `elapsedMs` | `httpStatus` | `statusClass` | `typedCode` |
| --- | --- | --- | --- | --- | --- |

| `w06-01-health-before` | 2026-11-12T19:41:59.1168539Z | 68 | 200 | 2xx | `HEALTH` |
| `w06-02-freshness-before` | 2026-11-12T19:41:59.2286663Z | 29 | 200 | 2xx | `FAILURE` |
| `w06-03-quotes-attempt1` | 2026-11-12T19:42:05.1740778Z | 5893 | 502 | 5xx | `AUTHENTICATION_FAILURE` |
| `w06-04-health-after` | 2026-11-12T19:42:05.3305256Z | 67 | 200 | 2xx | `HEALTH` |
| `w06-05-freshness-after` | 2026-11-12T19:42:14.4035727Z | 29 | 200 | 2xx | `FAILURE` |

Three timing facts follow from the captured pairs, and they are arithmetic on those pairs rather than
observation: the quotes probe's `atUtc` is its completion, so subtracting its 5,893 ms elapsed puts its
start at about 19:41:59.281Z — 52 ms after probe 2 returned; health-after then follows 156 ms after
the quotes probe completed; freshness-after follows 9.07 s after that. The sequence is therefore the
one §10.3 prescribes, run once, in order, with no repetition.

### 12.2 What the captured code establishes — and the only way it can arise

`AUTHENTICATION_FAILURE` with the exact message `Dhan rejected the request credentials` is produced in
exactly one place: `DhanApiClient.mapHttpStatus` (`dhan_api_client.ts:304-315`), which is applied to
the vendor response *after* it has been received (`:285`). Its whole mapping is:

| Vendor response | Code produced | Message |
| --- | --- | --- |
| `2xx` | none (`null`), body then parsed | — |
| `401` / `403` | `AUTHENTICATION_FAILURE` | `Dhan rejected the request credentials` |
| `408` / `504` | `TIMEOUT` | `Dhan reported a request timeout` |
| `429` | `RATE_LIMITED` | `Dhan rate limit exceeded` |
| any other non-`2xx` | `HTTP_ERROR` | `Dhan returned a non-success HTTP status (<n>)` |
| no response at all (transport exception, timeout, egress refusal) | `TRANSPORT_FAILURE` / `TIMEOUT` / `PRODUCTION_NOT_AUTHORIZED` | — |

1. **A response was received.** Every branch that has no response returns a different code, so the
   captured code cannot exist without one.
2. **That response carried `401` or `403`.** No other status maps to this code, and no local branch
   produces it: the credential resolver's refusals are `CREDENTIALS_UNAVAILABLE`,
   `CREDENTIALS_EXPIRED` and `CONFIGURATION_INCOMPLETE`, all raised before the request is built
   (`:196-215`), and the local rate limiter returns `RATE_LIMITED` before any send
   (`dhan_operational_controls.ts:332`). None of those can yield `AUTHENTICATION_FAILURE`.
3. **The credential material was resolved and sent.** Reaching `mapHttpStatus` requires a resolved
   credential pair (the resolver is called per request in this build) and a completed HTTP exchange.
   The vault read therefore succeeded for this call, which is the credential-resolution outcome W-06
   asks the record to show.
4. **It was not a locally-detected expiry.** The client checks the SecretRef's `expiresAt` before the
   call and returns `CREDENTIALS_EXPIRED` if it has passed. The captured code therefore means either
   that `expiresAt` had not passed, or that the reference carries no expiry and only the vendor could
   judge it; the capture does not distinguish these, and neither is assumed.
5. **The `502` is the daemon's, not a proxy's.** `dhan_market_data_http.ts:320-322` maps every typed
   provider failure except `RATE_LIMITED` to `502`; the framework's reason phrase for that status is
   what PowerShell echoes as `(502) Bad Gateway`. The vendor's numeric status never leaves the
   process — `sendError` emits only `{ code, message }` (§6.2, which applies to this attempt too).
6. **At least one send reached the vendor; how many sends there were is not captured.**
   `AUTHENTICATION_FAILURE` is not transient, so `withBoundedRetry` never retries it: the code comes
   from the *last* send. The 5,893 ms is compatible with a single send, and equally with a first send
   that hit the code default `IIPS_DHAN_TIMEOUT_MS` of 5,000 ms and a retry that then returned
   `401`/`403`. The capture does not distinguish these, the configured timeout was not recorded, and
   the verdict does not depend on which it was.

### 12.3 Why the stop rule was invoked

The captured code is the `AUTHENTICATION_FAILURE` row of §10.4 — a decisive outcome. Per §10.3 the
sequence stops there; probes 4 and 5 were already part of the fixed sequence and added nothing that
changes the verdict (`/v1/health` is constant, §6.3; `/v1/freshness` still projects `REFRESH_FAILED`,
which is D-7 redaction and cannot corroborate or contradict an auth verdict). No repeat attempt was
made, no identity or body was changed, and no further request is authorised or needed.

### 12.4 Redaction evidence — the checks that were run, and their results

This section applies the roadmap's W-06 grep clause and §9.4 (both secret values, any `vault://`
string, and any carrier-path fragment) to everything available here. The pattern set is the one §10.5
gives the operator; it is repeated here as a block so that no pattern literal sits loose in the prose
above or below:

```powershell
$Patterns = @('eyJ','vault://','dhan-secrets','dhan-client-id\.carrier','dhan-access-token\.carrier',
  'H:\\IIPS\\runtime','1000\d{6}','[A-Za-z0-9_-]{32,}','access-token','client-id','Bearer')
$ProbeFiles = (Get-ChildItem $Evidence -Filter *.json).FullName
$ProbeFiles | Select-String -Pattern $Patterns -AllMatches
```

| # | Pattern (category) | Hits in the five artefacts |
| --- | --- | --- |
| 1 | JWT prefix | 0 |
| 2 | vault-reference scheme | 0 |
| 3 | credential store directory name | 0 |
| 4 | client-id carrier file name | 0 |
| 5 | access-token carrier file name | 0 |
| 6 | carrier root path | 0 |
| 7 | Dhan client-id numeric shape (7 digits starting `1000`) | 0 |
| 8 | any run of 32+ token characters | **2** — both are the literal status constant `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED` in the two health probes; no secret material |
| 9 | `access-token` header name | 0 |
| 10 | `client-id` header name | 0 |
| 11 | `Bearer` | 0 |

Coverage, stated precisely:

| Artefact | Who checked it | Result |
| --- | --- | --- |
| The five probe JSON files (3,088 bytes as transcribed here) | this record, independently, with the pattern set above | clean, per the table |
| The same five files, against the two secret **values** | the operator, with §10.5's hidden-input exact-value grep | reported clean; the values were not available to this record, so this step is verified by statement only |
| Daemon console text | the operator, same pattern set | reported clean; the text was not supplied to this record, and §6.4 shows it holds no per-request output beyond the startup line already quoted in §3 |
| IRR log | not applicable — the IRR consumer was not run for this attempt | — |
| Built bundles | not applicable — nothing was rebuilt for this attempt | — |

### 12.5 What this capture does not contain

- **Which of `401`/`403`** the vendor returned, and its reason phrase.
- **The vendor's own error body.** Non-`2xx` bodies are never read: `mapHttpStatus` runs before parsing
  and the client deliberately never echoes an error body (`:302-303`). Any vendor error code that would
  name the exact cause (token vs client id vs IP binding vs subscription) is therefore absent, and no
  such cause is inferred.
- **The configured vendor timeout**, hence the split between the 5,893 ms and the number of sends.
- **The vendor's verdict for attempt #1**, which remains unknown beyond §4.1.

---

## 13. Gate decision, and what remains blocked

The roadmap contains two statements that must be read together, and they do not say the same thing:

- **G-M1** (`§9.2`) closes on: "`CREDENTIALS_UNAVAILABLE` no longer occurs; the outcome is a
  structural success **or a typed auth failure**; zero secret occurrences and zero location strings in
  logs."
- **M1** (`§10.1`) is defined as "one real authenticated interaction with Dhan **succeeds**", and its
  exit criteria (`§10.3`) require that "one authenticated vendor interaction **completes**".

| Criterion | Verdict | Basis |
| --- | --- | --- |
| W-06 verification — "structural success or a typed auth failure" | **satisfied** | §12.2: `AUTHENTICATION_FAILURE`, from a received `401`/`403` |
| W-06 verification — secret and location greps | **satisfied** over the bodies and this record; by statement for console and exact values | §12.4 |
| G-M1 evidence condition | **satisfied** | a typed auth failure, and not `CREDENTIALS_UNAVAILABLE` (§12.2 item 2) |
| M1 definition — "one real authenticated interaction with Dhan succeeds" | **NOT satisfied** | the interaction returned a rejection; nothing was authenticated |
| M1 exit criteria — "one authenticated vendor interaction completes" | **NOT satisfied** | the interaction completed as a rejection |
| M2a, M2, M3a, M3, M4 | untouched | no quote, history or freshness acceptance was attempted or claimed |

**Decision: W-06's evidence requirement is met and its work does not continue; M1 is not achieved.**
The two are consistent because they ask different questions. W-06 exists to remove a *doubt* — whether
a live request reaches Dhan and what kind of answer comes back — and that doubt is now settled by
direct capture. M1 asks whether authentication *works*, and the answer is no. Treating a captured
rejection as a closed milestone would be exactly the kind of manufactured evidence this record has
refused throughout; treating the capture as worthless would ignore the first real vendor verdict this
integration has produced. So: **gate G-M1's evidence condition satisfied, milestone M1 open, W-06 open
with no further vendor work required from IPD until the credential defect is addressed.**

**Remaining blockers, in order of what must be resolved first:**

1. **Dhan rejects the provisioned credential pair** (`401` or `403`). The cause is not in this capture
   and is not guessed at. Candidate causes that this evidence neither supports nor excludes: the
   access token was revoked or superseded after provisioning, the client id and token belong to
   different sessions, the token was issued for a different Dhan API surface, the request source IP is
   not the registered static IP, or the account is not entitled to the requested data. Any of these is
   a hypothesis until vendor-side evidence says otherwise.
2. **The vendor's numeric status and error body are not captured.** Closing this would need either a
   deliberate, redaction-safe way to surface the vendor's error code, or visibility on the Dhan side.
   That is a change of scope and is not authorised here.
3. **Everything downstream is untouched**: no quote has ever been parsed (M2a), no series
   (M3a), no in-session freshness (M4), and the `/v1/freshness` read remains `MISS`/`UNKNOWN`/`FAILURE`
   for a reason an auth rejection is sufficient to explain (§12.3) — though that read can never name
   the reason itself, and cannot be used as an auth verdict on its own.
4. **No further vendor request is authorised or needed.** Re-running `/v1/quotes` with the same rejected
   credential would only re-capture the same verdict; the next step is credential remediation (D-6 /
   W-04 territory), not more probing.

