# DHAN W-06 — Local Transport Authentication: Root Cause and Recovery Procedure

**Status:** FIXED and PUBLISHED — implementation `P7` (transport auth parsing and startup credential validation), plus this recovery procedure.
**Scope:** the **local** loopback shared secret `IIPS_MARKET_DATA_TRANSPORT_TOKEN`, between the operator's shell and the IPD market-data daemon. **Not** a Dhan credential, **not** DPAPI, **not** the vendor.
**Origin:** the W-06 investigation (2026-11-12), which found `/v1/health` answering `401 UNAUTHENTICATED` on every attempt while the operator re-entered the same token.
**Roadmap authority:** `ramkivs/iips-review-recovered` → `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` (v1.1), W-06
**Related:** W-06 evidence record `DHAN-W06-FIRST-AUTHENTICATED-REQUEST-EVIDENCE-2026-11-12.md`; D-6 operator procedure; W-03 daemon selector; D-7 state model

> **W-06 remains open.** Fixing this defect does not authenticate anything against Dhan, does not
> close M1, and does not authorise another vendor request. The recorded vendor verdict
> (`502 AUTHENTICATION_FAILURE`) is unchanged by this work.

---

## 1. What was wrong

The transport gate was *correct* and *unusable* at the same time. Three defects, all confirmed by
executing the shipped server:

| # | Defect | Where |
| --- | --- | --- |
| 1 | The auth scheme was matched with a literal `startsWith('Bearer ')` — **case-sensitive**, exactly one ASCII space, stricter than RFC 7235 §2.1 | `dhan_market_data_http.ts` `parseBearerAuthorization` (formerly inline) |
| 2 | The configured value was never checked for **transmittability**. A NBSP, a zero-width space, a BOM or a trailing CR produced a listener that rejected every request forever | `createMarketDataHttpServer` / `startMarketDataDaemon` |
| 3 | The value is captured **once at startup** and never re-read, so no client-side re-entry could ever repair defect (2) — and nothing said so | `dhan_local_daemon.ts` §5 |

The 401 body is deliberately uniform (`missing or invalid transport credential`) for every failure —
absent header, wrong scheme, wrong value, invisible character. That uniformity is a security property
worth keeping, but it made the three causes indistinguishable to the operator.

## 2. What changed

| Change | Effect |
| --- | --- |
| `parseBearerAuthorization()` | Scheme matched **case-insensitively**; one or more SP/HTAB accepted as the separator; surrounding whitespace tolerated; anything malformed returns `undefined` and is refused — never coerced into a partial value |
| `validateTransportToken()` | One validator, used by the **server at startup** and by the **client at preflight**. Accepts printable ASCII only; classifies the refusal as `TRANSPORT_TOKEN_MISSING`, `TRANSPORT_TOKEN_NOT_ASCII` or `TRANSPORT_TOKEN_WHITESPACE` |
| Daemon `startMarketDataDaemon` | Refuses to bind on an untransmittable token, with a typed code and a message that names the problem and **never echoes the value** |
| `MarketDataTransportClient` preflight | Refuses an untransmittable credential **before sending**, instead of spending a request on a guaranteed 401 |
| Comparison | Unchanged in substance: length guard, then `timingSafeEqual` on equal-length byte buffers |

**Unchanged, deliberately:** the token is still captured once at startup; the 401 status and body are
identical for every failure; there is no default token; nothing is trimmed into acceptance; DPAPI,
the carriers and both Dhan credentials are untouched.

## 3. How the failure is now diagnosed

At startup — the only place the cause is still knowable:

| Startup code | Meaning | Fix |
| --- | --- | --- |
| `TRANSPORT_TOKEN_MISSING` | unset, empty, or whitespace-only | enter the value (§4) |
| `TRANSPORT_TOKEN_WHITESPACE` | leading, trailing or interior whitespace in the **configured** value | re-enter it; do not "fix" it in the client |
| `TRANSPORT_TOKEN_NOT_ASCII` | a character above U+007E or a control byte | re-enter it as plain ASCII — usually a pasted NBSP, zero-width space or smart quote |

At request time the answer is still the uniform `401 UNAUTHENTICATED`. What changed is that a
*transmittable* token can now only fail for one reason: the client's value differs from the daemon's.
And the remedies below make that difference observable without printing anything.

## 4. Recovery procedure — enter the token once, share it

The invariant: **one entry, two readers.** The token is entered once into a session, the daemon is
launched **from that session** so it inherits the exact value, and the health check reads the same
variable. Nothing is retyped, copied, written to disk or passed on a command line.

The transport token is **process environment only** — it is not in DPAPI. Restarting the daemon
re-reads the DPAPI carriers — with `IIPS_DHAN_VAULT_BACKEND=windows-dpapi` the startup readiness probe
actually **decrypts** both of them before it can report `READY` — and it does not rotate, replace or
disturb them. (Source: `dhan_dpapi_vault_backend.ts` `evaluateReadiness`; the recovery record §3.1
traces it end to end.)

### 4.1 Enter the value and record a value-free fingerprint

```powershell
# Hidden input, once per session. The value is never echoed, logged or written to disk.
$ss    = Read-Host -AsSecureString 'Transport token (hidden input, ASCII only)'
$plain = [System.Net.NetworkCredential]::new('', $ss).Password
Remove-Variable ss

$bytes = [Text.Encoding]::UTF8.GetBytes($plain)
$sha   = [Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
"length   = $($bytes.Length)"
"sha256x8 = " + (($sha[0..7] | ForEach-Object { $_.ToString('x2') }) -join '')
"nonAscii = " + (@($bytes | Where-Object { $_ -gt 127 }).Count)
Remove-Variable bytes, sha

$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN = $plain
Remove-Variable plain
```

Read the three lines, never the token:

- `nonAscii` **must be 0.** Anything else means the value can never be transmitted — re-enter it,
  typing rather than pasting. This is the single most common cause of the symptom.
- A `sha256x8` of the *configured* value can be compared later against the daemon's copy (§4.4)
  without either side revealing the secret.

### 4.2 Configure and launch the daemon from the same session

```powershell
# DPAPI configuration: unchanged values, no secret, nothing rotated.
$env:IIPS_DHAN_VAULT_BACKEND            = 'windows-dpapi'
$env:IIPS_DHAN_VAULT_PROVIDER           = 'WINDOWS_DPAPI'
$env:IIPS_DHAN_CLIENT_ID_SECRET_PATH    = 'vault://dhan/client-id'
$env:IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH = 'vault://dhan/access-token'
$env:IIPS_MARKET_DATA_DAEMON_HOST       = '127.0.0.1'
$env:IIPS_MARKET_DATA_DAEMON_PORT       = '8791'
# IIPS_DHAN_SECRET_VERSION and IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT: keep your existing values.

# Stop ONLY a previously running daemon (no vault work, no credential work).
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*dhan_local_daemon.js*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

# The start script does not rebuild: build first, so the running code is the current code.
npm run build:tsc

# Launch in the background INHERITING this session's environment. The token crosses the process
# boundary by inheritance only — never via argv, a file or a prompt.
$daemon = Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','start:market-data-daemon' `
          -WorkingDirectory (Get-Location) -NoNewWindow -PassThru
```

Wait for the startup line and read it:

```text
[ipd-market-data-daemon] listening on http://127.0.0.1:8791 (providerReadiness=CREDENTIAL_REFERENCES_CONFIGURED,
vaultBackend=WINDOWS_DPAPI_USER_SCOPE, vaultBackendSelector=windows-dpapi, vaultBackendReadiness=READY,
liveCredentialResolution=true, credentialReadiness=CONFIGURED, providerState=CREDENTIALS_RESOLVED,
vendorEgress=IPD_SERVER_HTTPS, qualifiedMappings=96)
```

A startup **refusal** instead of that line is the new, actionable outcome — the code names the
problem (§3) and the value is not echoed. `startup refused at phase validate [TRANSPORT_TOKEN_NOT_ASCII]`
means: go back to §4.1, do not touch anything else.

### 4.3 Health check from a second window, reading the same variable

```powershell
# Second window: enter the token ONCE, exactly as in §4.1 (do not retype it "from memory").
$ss    = Read-Host -AsSecureString 'Transport token (hidden input, same value)'
$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN = [System.Net.NetworkCredential]::new('', $ss).Password
Remove-Variable ss

Invoke-WebRequest -Uri 'http://127.0.0.1:8791/v1/health' `
  -Headers @{ Authorization = "Bearer $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN" } `
  -UseBasicParsing | Select-Object StatusCode, Content
```

Expect `200` with `"liveProviderConnectivity":"NOT_CHECKED_PRE_ACCESS"` — health never proves vendor
connectivity and never calls the vendor.

The client's `Authorization` header is built from the variable, so the scheme, spacing and transport
encoding are the implementation's problem, not yours. `bearer`, `BEARER` and tab-separated forms all
authenticate identically now.

### 4.4 If it still returns 401, compare the two copies without printing either

```powershell
# In the DAEMON's session (the process that captured the value), print only the fingerprint:
$b = [Text.Encoding]::UTF8.GetBytes($env:IIPS_MARKET_DATA_TRANSPORT_TOKEN)
$b.Length
([Security.Cryptography.SHA256]::Create().ComputeHash($b)[0..7] | ForEach-Object { $_.ToString('x2') }) -join ''
```

| Outcome | Diagnosis |
| --- | --- |
| lengths differ | the two windows hold different values — re-enter from the same source in both |
| lengths equal, fingerprints differ | same length, different bytes: an invisible character or a transcription difference. Re-enter by typing; verify `nonAscii = 0` |
| fingerprints equal but still 401 | impossible for an ASCII token under this gate. Look outside it: an intercepting proxy, a `HttpClient.DefaultRequestHeaders.Authorization` left over from an earlier attempt, or a client that adds its own `Authorization` header in front of the documented one |

## 5. What does **not** need to be done

| Do not | Why |
| --- | --- |
| Rotate or replace the Dhan client id or access token | unrelated: this gate runs **before** the resolver and the vendor |
| Re-run `npm run dhan:credential` or touch the DPAPI carriers | the store is untouched by this defect and this fix |
| Generate or rotate the transport token | the same value works once entered cleanly; rotation is not remediation |
| Bypass, disable or "temporarily" open up authentication | there is no unauthenticated path to the service, including `/v1/health`, by design |
| Re-run a `/v1/quotes` probe to "confirm the fix" | this fix authenticates nothing against Dhan; W-06's vendor verdict stands and no further vendor request is authorised |

## 6. Regression coverage

`tests/dhan_p7_transport_auth_parsing.test.ts` (added with this fix):

| Case | Covers |
| --- | --- |
| `P7-01` | scheme case-insensitivity, and refusal of non-Bearer schemes |
| `P7-02` | SP/HTAB separators and surrounding whitespace |
| `P7-03` | malformed headers never yield a partial value; repeated headers refused |
| `P7-04` | the captured forms authenticate end-to-end, and only those |
| `P7-05`, `P7-06` | constant-time path exercised by a same-length, one-character-different credential |
| `P7-07`, `P7-08`, `P7-09` | missing/blank, whitespace-contaminated and non-ASCII refusals, with no value echoed |
| `P7-10` | accepted ASCII forms |
| `P7-11` | capture-at-startup: mutating the source after launch does not change the accepted value |
| `P7-12` | the daemon refuses to listen on an untransmittable token, with typed codes |
| `P7-13` | `/v1/health` behind the same gate as every other route; the provider is never called |
| `P7-14`, `P7-15` | the client preflight refuses before sending, using the same rules as the server |
| `W06-WIN-01..03` | this procedure: one entry, no persistence, no DPAPI contact, value-free fingerprint |
| `W06-PS-01`, `W06-PS-02` | the documented PowerShell client executed for real (`IIPS_POWERSHELL_RUNTIME_TESTS=1`) |

The Windows PowerShell cases are opt-in for the same reason as `w02_acceptance_process.test.ts`:
whether a CI image ships `pwsh` is not this repository's contract, and a skipped case is not evidence.
On the governed Windows host:

```powershell
$env:IIPS_POWERSHELL_RUNTIME_TESTS = '1'
npm run build:tsc
node --test dist/tests/dhan_p7_transport_auth_parsing.test.js
```

## 7. Boundaries observed

No Dhan credential was read, rotated, replaced or verified by this work; the DPAPI store, its ACLs and
its security model are untouched; no transport token was generated, defaulted or persisted; no vendor
request of any kind was made; authentication was neither weakened nor bypassed — the gate is stricter
at startup and equivalent at request time; and no quote, historical or freshness behaviour changed.
