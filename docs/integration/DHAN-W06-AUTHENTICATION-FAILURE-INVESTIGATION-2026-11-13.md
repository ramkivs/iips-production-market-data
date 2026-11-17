# DHAN W-06 — Dhan Authentication Failure: Source-Level Investigation (2026-11-13)

**Status:** INVESTIGATION RECORD — read-only source analysis of the observed `AUTHENTICATION_FAILURE`.
**No vendor request was made, no credential was read, rotated or exposed, and no production code was
changed by this work item.**
**Repository:** `ramkivs/iips-production-market-data` @ `99b52131f703e30f097291754e7b72cb48b7fa77`,
branch `arena/84d1e063-iips-production-market-data`.
**Roadmap authority:** IRR repository, `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md`
(v1.1), §W-06 — read-only, not modified.
**Current milestone status:** **M1 NOT ACHIEVED. W-06 OPEN.** Unchanged by this record.
**Safety footer:** see §2 and §12. Nothing here authorises vendor egress.

---

## 1. Executive finding

**The observed rejection cannot be explained by any defect found in the IPD request path.** The
request the daemon sent was structurally what the implementation intends to send — correct endpoint,
correct method, correct content type, correct credential header names, correct role mapping, credentials
resolved fresh per request with no stale-cache path — and the code that produced
`AUTHENTICATION_FAILURE` is reachable only after a completed exchange with a vendor response of `401`
or `403`.

Three findings matter for the decision:

1. **The most probable cause is that Dhan did not accept the credential pair** (revoked, superseded,
   mismatched pair, or not entitled to the endpoint). Confidence **HIGH** that the rejection is
   vendor-side *given the observed code*, but **the specific cause among these cannot be determined
   from the evidence available**, and is classified UNVERIFIED.
2. **One genuine local defect was found — in observability, not in authentication:** the vendor's
   numeric status and error body are discarded before any caller can see them, so the existing
   evidence can never distinguish `401` from `403`, nor distinguish "bad token" from "bad client-id"
   from "not entitled" — three conditions with three different operator remedies. This did not cause
   the rejection; it prevents diagnosis of it.
3. **A second, narrower defect was found in expiry handling:** `Date.parse` silently accepts a
   zone-less timestamp and interprets it as **local** time, so a mis-typed `IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT`
   is not rejected and can make the local expiry pre-flight *too lenient* on hosts east of UTC. This
   cannot cause a `401/403`; it can only fail to catch an expired token locally.

**Recommendation: NOT READY** for a further controlled vendor request as the evidence stands — not
because the request would be unsafe, but because a repeat would produce a byte-identical, equally
undiagnosable outcome. §13 states the exact blocker and the two ways to clear it.

---

## 2. Scope and safety confirmation

| Constraint | Status |
| --- | --- |
| HTTP request to Dhan or any vendor | **none made** |
| Replay / retry / simulate the rejected request | **none performed** |
| Workflow that could initiate vendor egress | **none run** |
| Credential rotation, regeneration, revocation | **none** |
| DPAPI carriers, ACLs, vault contents, metadata | **unchanged** |
| Plaintext credentials printed, logged, copied | **none** |
| Authorization headers / tokens printed | **none** |
| Production source, provider behaviour, auth logic | **unchanged** (documentation only) |
| P7 transport authentication | **not reopened** |
| PR #156 | **untouched; still OPEN / MERGEABLE / UNMERGED** |

One inspection was considered and **deliberately not performed**: reading the DPAPI carriers or the
`IIPS_DHAN_*` environment values to confirm the configured expiry. Both would require handling secret
material, and neither is necessary — §6 works from the documented provisioning contract and from
source instead, and marks the result UNVERIFIED rather than obtaining it invasively.

The four distinctions this record keeps separate throughout:

| Layer | What it means | Status |
| --- | --- | --- |
| **Local credential resolution** | DPAPI decrypt succeeded, secret returned to the caller | **evidenced** (`CREDENTIALS_RESOLVED`, and §3.1 of the recovery record) |
| **Local transport authentication** | operator's shell ↔ daemon, `IIPS_MARKET_DATA_TRANSPORT_TOKEN` | **recovered and verified** (`HTTP 200`) |
| **Vendor authentication** | Dhan accepted the credential pair | **failed** — `AUTHENTICATION_FAILURE` |
| **Token rotation** | a new secret written to the store | **not performed, not claimed** |

Local `CREDENTIALS_RESOLVED`, DPAPI `READY` and local health `200` are **not** evidence of vendor
authentication, and are not used as such anywhere below.

---

## 3. Verified historical failure facts

Taken from the W-06 evidence record as captured, not re-derived:

| Fact | Value | Source |
| --- | --- | --- |
| Daemon HTTP status returned to the operator | `502` | `W06-03-quotes-attempt1.json` `httpStatus` |
| Daemon status class | `5xx` | same |
| Typed failure code | `AUTHENTICATION_FAILURE` | response body |
| Message | `Dhan rejected the request credentials` | response body |
| Probe elapsed | `5893` ms | probe `elapsedMs` |
| Probe completion | `2026-11-12T19:42:05.1740778Z` | probe `atUtc` |
| PowerShell's echo of the failure | `The remote server returned an error: (502) Bad Gateway.` | `exceptionMessage` |
| Startup state at the time | `providerState=CREDENTIALS_RESOLVED`, `vendorEgress=IPD_SERVER_HTTPS` | startup line |

**Established by these facts:** an HTTP response was received from Dhan, and its status was `401` or
`403` (§7.2).

**Not established:** which of `401`/`403` it was; Dhan's error code or message; whether one vendor send
or more occurred (§5.6); the vendor's own reason for refusing.

**The 502 is not the vendor's status.** `502` is the daemon's own status for every typed provider
failure (`dhan_market_data_http.ts:401`), and `(502) Bad Gateway` is PowerShell echoing the framework's
reason phrase for that status. No proxy is involved.

---

## 4. End-to-end request-path trace

The path for the operator's `/v1/quotes` probe, with the code that ran at the time (`dist/` built from
the then-current tree):

| # | Layer | Source | What happens |
| --- | --- | --- | --- |
| 1 | Operator → daemon | `dhan_market_data_http.ts` auth block (~`:266-270`) | `Authorization: Bearer <transport token>` checked; `401 UNAUTHENTICATED` if wrong. Passed (the probe reached the service). |
| 2 | Daemon route | same, quotes branch | body validated: `companyId` string + canonical `securityId` (`ISIN:<isin>:<series>`). `400 MALFORMED_REQUEST` on failure — not observed. |
| 3 | Bounded execution | same, `:387-397` | `service.getQuote(...)` raced against a 10 s layer timeout; `504 REQUEST_TIMEOUT` on expiry — not observed. |
| 4 | Service | `dhan_market_data_service.ts` → `dhan_market_data_source.ts` | registry lookup (`UNRESOLVED_INSTRUMENT` if absent), limiter `tryAcquire` (`RATE_LIMITED` if budget exhausted, **before any send**), concurrency acquire, then `withBoundedRetry(() => fetchQuote(...))` (`dhan_operational_controls.ts:340`). |
| 5 | Provider client | `dhan_api_client.ts::executeJsonPost` | pre-flight: production-env refusal, SecretRef status/expiry checks (`:196-215`), **per-request** `credentialResolver.resolve(config)` (`:214`), empty-credential check, resolved-expiry check. |
| 6 | Header construction | `dhan_api_client.ts:251-261` | `Content-Type: application/json`, `Accept: application/json`, `'access-token': <token>`, `'client-id': <clientId>`. Placed on the request object and discarded with it. |
| 7 | URL | `dhan_api_client.ts:95`, `dhan_config.ts:33` | `POST https://api.dhan.co/v2/marketfeed/quote` |
| 8 | Transport | `dhan_server_egress.ts:59-123` | production/TLS guards, origin + path-prefix boundary check, then `fetch` with `redirect: 'error'` and an `AbortSignal.timeout(request.timeoutMs)`. Returns `{ status, bodyText }`. |
| 9 | Status mapping | `dhan_api_client.ts::mapHttpStatus` (~`:302-315`) | `401`/`403` → `AUTHENTICATION_FAILURE` + message; `408`/`504` → `TIMEOUT`; `429` → `RATE_LIMITED`; other non-2xx → `HTTP_ERROR`; 2xx → body parsed. **Error bodies are never read for the message** — the message is a fixed IPD string. |
| 10 | Back-projection | `dhan_market_data_source.ts` | `lastFailure` set; refresh outcome `FAILURE`; freshness projects `REFRESH_FAILED`. |
| 11 | Daemon response | `dhan_market_data_http.ts:401` | every typed failure except `RATE_LIMITED` → `502`, body `{code,message}` only. |

**What this trace establishes:** the observed code could only have been produced at step 9, from a
`401`/`403` received at step 8. Every earlier step has its own distinct code, and none of them is
`AUTHENTICATION_FAILURE` (step 5's local refusals are `CREDENTIALS_UNAVAILABLE` /
`CREDENTIALS_EXPIRED` / `CONFIGURATION_INCOMPLETE`; step 4's limiter is `RATE_LIMITED`; step 3's layer
bound is `REQUEST_TIMEOUT`).

**What it cannot establish:** anything about *why* Dhan refused. That information was destroyed at
step 9 (§7).

---

## 5. Authentication construction review

Structural findings only; no secret value, length or fingerprint is reproduced here.

| Aspect | Implementation | Assessment |
| --- | --- | --- |
| **Client ID usage** | `'client-id': credentials.clientId` (`dhan_api_client.ts:259`) | Correct Dhan v2 header name, lowercase as Dhan documents. Emitted verbatim. |
| **Access token usage** | `'access-token': credentials.accessToken` (`:258`) | Correct header name. **Not** a `Authorization: Bearer` header — this is Dhan's scheme, not OAuth-style; the two must not be confused with the local transport bearer in §2. |
| **Header format** | plain `Record<string,string>` passed to `fetch` (`dhan_server_egress.ts:109`) | No manual quoting, escaping or concatenation. Values go on the wire as the runtime encodes them. |
| **Supplementary headers** | `Content-Type: application/json`, `Accept: application/json` | Appropriate for a JSON POST. No `User-Agent` override, no `Accept-Encoding` manipulation. |
| **Method / endpoint** | `POST` to `${baseUrl}${'/marketfeed/quote'}` | Matches the configured base `https://api.dhan.co/v2`. Path prefix boundary is enforced by the transport (`dhan_server_egress.ts:94-104`). |
| **URL construction** | template literal, no query string | Transport refuses any URL carrying a query or embedded credentials (`:88-92`) — cannot be the cause. |
| **Credential-role mapping** | `clientIdRef` → `clientId` carrier; `accessTokenRef` → `accessToken` carrier (`dhan_local_vault_resolver.ts:348-350`, `:369-373`) | **Correct and non-swapped.** `WindowsDpapiHostVaultBackend` maps `clientId → DHAN_CLIENT_ID_KEY_PATH`, `accessToken → DHAN_ACCESS_TOKEN_KEY_PATH` (`dhan_dpapi_vault_backend.ts:70-73`), and each carrier's `secretId` is checked against its ref on read (`:341-353`). A cross-wiring would surface as `INVALID_SECRET_REF`, not as a vendor 401. |
| **Whitespace / encoding** | provisioning rejects leading/trailing whitespace, control characters, and out-of-bounds lengths (`dhan_credential_store_utility.ts:259-296`); storage never trims or alters | A stored secret cannot carry a stray newline or NBSP. Residual risk is only for values that bypassed the CLI — see §5.a. |
| **Quoting / truncation** | none in the path; `fetch` handles encoding | No truncation point exists between the carrier and the wire. |
| **Env overrides** | `IIPS_DHAN_TIMEOUT_MS` only (`dhan_config.ts:44`); base URL is a constant unless the operator overrides it in config resolution | No override can alter the auth headers. |
| **Resolution timing** | **per request** (`dhan_api_client.ts:214`), not cached at startup | See §6.4: a daemon restart is **not** required for a credential change to take effect. |

### 5.a One residual, unverifiable-by-me risk

The provisioning validator is only as good as the path the value took. If the operator populated a
carrier by any route other than `npm run dhan:credential` (a manual DPAPI protect, a restored file),
the validator never ran. **This cannot be checked without reading the carriers**, which this work item
must not do. It is recorded as UNVERIFIED (§9) rather than assumed benign.

### 5.b What is *not* a defect here

- No auth header is logged, and none can be: `dhan_failures.ts` messages are fixed strings.
- The transport refuses non-HTTPS, off-origin, TLS-disabled and query-bearing URLs (`dhan_server_egress.ts:63-104`),
  so the request cannot be silently redirected or downgraded.
- `redirect: 'error'` (`:111`) means a vendor redirect to a login/SSO page fails closed instead of
  producing a misleading body.

---

## 6. Credential pairing and token-lifecycle review

### 6.1 When was the current token provisioned?

**Not recorded in any non-secret artefact available to this investigation.** The D-6 rehearsal used
synthetic throwaway values only (`DHAN-D6-WINDOWS-HOST-REHEARSAL-EVIDENCE-2026-11-12.md`), and the
real provisioning event's `createdAtUtc` / `rotatedAtUtc` live in the DPAPI envelope, which this work
item must not read. The W-06 record states the attempt was authorised "on the token that was
provisioned at the time, until its expiry", which establishes that a token existed and had an expiry,
but not the timestamp. **UNVERIFIED.**

### 6.2 Which expiry metadata is configured?

`IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT` (a `SecretRef` field), with the carrier's own `expiresAtUtc` as a
second source. The *value* is not visible to this investigation. D-6 §6 documents the expected shape as
explicit-UTC ISO-8601 (`2026-11-13T06:30:00.000Z`) but does not *require* the `Z`. **UNVERIFIED** as to
the actual configured value.

### 6.3 Is expiry checked correctly, and is it UTC?

Three separate checks exist, all using `Date.parse(...)` compared against `now()`:

| Check | Location |
| --- | --- |
| SecretRef pre-flight | `dhan_api_client.ts:196-215` |
| Resolver ref pre-flight | `dhan_local_vault_resolver.ts:238-253` |
| Resolver record check | `dhan_local_vault_resolver.ts:280-289` |

The comparison logic is sound: `NaN` → `CONFIGURATION_INCOMPLETE`; `expMs <= nowMs` → `CREDENTIALS_EXPIRED`.
**But the UTC claim is not enforced.** Empirically verified in this sandbox:

```text
TZ=UTC              "2026-11-12T19:00:00Z" -> 2026-11-12T19:00:00.000Z
TZ=UTC              "2026-11-12T19:00:00"  -> 2026-11-12T19:00:00.000Z   (treated as UTC)
TZ=America/New_York "2026-11-12T19:00:00"  -> 2026-11-13T00:00:00.000Z   (treated as LOCAL: +5h)
```

`Date.parse` accepts a zone-less string and interprets it in the host's local timezone, while the code's
own error text says "ISO-8601 UTC timestamp" (`dhan_local_vault_resolver.ts:244`). **Consequence:** on a
host east of UTC, a zone-less expiry is interpreted *later* than it should be, so the pre-flight is
**too lenient** and can let an already-expired token through to the vendor; on a host west of UTC it is
too strict and would report `CREDENTIALS_EXPIRED` prematurely. Either way a `401/403` is **not** the
symptom — an expired token either passes silently (and the vendor rejects it, which is exactly the
observed outcome) or is caught locally.

This is a real defect, and it is the one candidate that could produce the observation *without* any
vendor-side change: if the operator's token had in fact expired and the expiry string lacked a zone, the
daemon could have believed it valid and sent it. **MEDIUM** confidence, UNVERIFIED (§8.4).

### 6.4 Could the daemon use a stale in-memory credential?

**No, for the credential.** `credentialResolver.resolve(config)` is called per request
(`dhan_api_client.ts:214`); the resolver reads both carriers through the backend each time
(`dhan_local_vault_resolver.ts:347-350`). No credential is cached on the client or the resolver. A
restart is therefore **not** required for a credential change to take effect — though one *is* required
for an **environment** change (`IIPS_DHAN_*`, including the expiry timestamp), because configuration is
resolved once at startup (`dhan_local_daemon.ts:446`) and captured.

That asymmetry is worth stating plainly, because it is a plausible operator-error vector: rotating the
token in the store takes effect immediately, but leaving a *stale expiry* in the environment does not
correct itself. D-6 §9 step 4 warns about exactly this, and it produces `CREDENTIALS_EXPIRED` locally —
not the observed `401/403` — unless §6.3's zone-less case applies.

### 6.5 Are both credentials resolved from the intended references?

**Yes, structurally.** Each `readSecret` is given its own ref, and each carrier's `secretId` must match
that ref (`dhan_dpapi_vault_backend.ts:341-353`); the role→path map is fixed (`:70-73`). A mismatch
would raise `INVALID_SECRET_REF` → `CONFIGURATION_INCOMPLETE`, which was not observed.

**However:** "read from the intended reference" is not the same as "**paired** at Dhan". The Client ID
and access token are two independent secrets; nothing in the implementation can tell whether they belong
to the same Dhan account/session. That is §8.2, and it is the single most likely cause.

---

## 7. Response classification and observability review

### 7.1 Where the vendor status is captured and where it is destroyed

`DhanFailure` **does** carry an optional `httpStatus` (`dhan_failures.ts:38-46`), and
`mapHttpStatus` populates it (`dhan_api_client.ts`, `{ httpStatus: status }`). It is then dropped at every
caller-visible boundary:

| Boundary | Source | What survives |
| --- | --- | --- |
| Service refresh outcome | `dhan_market_data_source.ts` | `code` only (`REFRESH_FAILED` after D-7 redaction) |
| `/v1/freshness` projection | `dhan_freshness_status.ts:9` | literal `REFRESH_FAILED` + `priorPreserved` |
| Daemon error body | `dhan_market_data_http.ts:401` (`sendError`) | `{ code, message }` only — `httpStatus` is **not** serialised |

So the numeric status exists for a few microseconds inside the process and is then unrecoverable. D-7
redaction is deliberate and correct for a *consumer-facing* projection (`/v1/freshness` must not leak
provider internals), but the daemon's own operator-facing error body inherits the same silence without
that justification.

### 7.2 Can the existing evidence distinguish 401 from 403?

**No.** Both map to the same code and the same fixed message. The error body is never parsed (by design,
to avoid credential reflection), so Dhan's error code never enters the process either.

### 7.3 Why the daemon exposes 502

`dhan_market_data_http.ts:401`: every typed provider failure except `RATE_LIMITED` → `502`; `429` is
reserved for `RATE_LIMITED` so a caller can distinguish throttling. This is a coherent contract — the
daemon is saying "the provider layer failed", not "the vendor said 502" — but it means the daemon's HTTP
status carries no information about *which* provider failure occurred.

### 7.4 Does any implementation defect prevent reliable diagnosis of the next request?

**Yes, one — and it is the blocker in §13.** As implemented, a second controlled request would produce
exactly the same three bits as the first: `502`, `AUTHENTICATION_FAILURE`, and a fixed message. Three
distinct operator remedies (regenerate token / correct the pair / confirm entitlement) are
indistinguishable.

The good news: the fix is small and local — the vendor's numeric status is already in hand at
`mapHttpStatus` and is simply dropped at `sendError`. Adding it to the **daemon's** error body (the
loopback, already-authenticated operator surface, not `/v1/freshness`, which must stay redacted) would
make the next attempt interpretable at essentially no risk, since the status is one integer and Dhan's
error *body* would still never be echoed. **This work item does not implement it** (§10, §13).

---

## 8. Ranked root-cause hypotheses

Confidence is in the hypothesis, not in its remedy. No hypothesis is presented as fact.

### 8.1 H1 — The access token was revoked or superseded — **MEDIUM-HIGH**

- **Supporting:** Dhan tokens are 24-hour secrets; a token regenerated in the portal invalidates the
  prior one. The store held a token provisioned earlier and the request used it. A `401`/`403` for a
  previously-valid token is the classic shape.
- **Contradicting:** nothing directly; but the token's provisioning time is UNVERIFIED (§6.1), so
  "earlier" is assumed, not shown.
- **Source:** lifecycle contract in D-6 §9; `dhan_api_client.ts:214` (per-request resolve, so the store's
  current content is what was sent).
- **Resolvable locally?** Partially — the operator can compare the stored token's `createdAtUtc` against
  the portal. **Needs confirmation:** yes (portal), or a controlled request (§11).
- **Confidence: MEDIUM-HIGH.**

### 8.2 H2 — Client ID and access token are not a matched pair — **MEDIUM**

- **Supporting:** the two secrets are provisioned and rotated independently (D-6 §9), and nothing checks
  their pairing; a client-id rotation without a token rotation (or vice versa) yields a pair Dhan refuses.
- **Contradicting:** the code cannot detect this, but equally cannot cause it; no evidence either way.
- **Source:** independent carriers `dhan_local_vault_resolver.ts:347-350`; separate rotas in D-6 §9.
- **Resolvable locally?** **No** — pairing is a vendor-side fact.
- **Confidence: MEDIUM.**

### 8.3 H3 — The credential pair is not entitled to `/marketfeed/quote` — **LOW-MEDIUM**

- **Supporting:** entitlement is per data-product; a valid pair may still be refused a feed it has not
  subscribed to. This would plausibly appear as `403`.
- **Contradicting:** if this were entitlement, one would expect `403` specifically; unverifiable.
- **Source:** `dhan_api_client.ts:95` (endpoint), `:302-315` (403 → same code).
- **Resolvable locally?** **No.**
- **Confidence: LOW-MEDIUM.**

### 8.4 H4 — The token had expired and the local pre-flight missed it (zone-less `expiresAt`) — **MEDIUM**

- **Supporting:** §6.3's defect is real and demonstrated; on a host east of UTC a zone-less expiry is
  read as later than it is. The operator's host is in IST (UTC+05:30), which is exactly the direction
  that makes the check **too lenient**. If the configured expiry string omitted the zone, an expired
  token could pass pre-flight and be rejected by Dhan.
- **Contradicting:** D-6 documents explicit-UTC examples and the CLI writes `.000Z`; if the operator used
  form B (`--expires-in-hours`) or the documented shape, the string is zoned and this hypothesis fails.
  The actual string is UNVERIFIED.
- **Source:** `dhan_local_vault_resolver.ts:238-253`; `dhan_api_client.ts:196-215`.
- **Resolvable locally?** **Yes** — the configured string can be inspected for a timezone suffix
  **without printing the token** (the expiry is metadata, not secret) and corrected if unzoned.
- **Confidence: MEDIUM.**

### 8.5 H5 — Local defect in request construction — **LOW (largely excluded)**

- **Supporting:** nothing found.
- **Contradicting:** §5 reviewed header names, method, endpoint, role mapping, encoding and quoting;
  all correct. A construction defect would more plausibly yield `400`/`422` than `401/403`, and would
  have surfaced as `HTTP_ERROR`, not `AUTHENTICATION_FAILURE`.
- **Confidence: LOW.** Not fully excluded only because the wire bytes were never captured.

### 8.6 H6 — Response misclassification (a non-auth status reported as auth failure) — **LOW**

- **Supporting:** none.
- **Contradicting:** `mapHttpStatus` maps exactly `401`/`403` to this code and nothing else
  (`:302-315`); no local branch can produce it (§4). The mapping is exhaustive and simple.
- **Confidence: LOW.**

### 8.7 H7 — Credential-role inversion (client-id sent as token or vice versa) — **LOW (excluded)**

- **Contradicting:** role→carrier mapping is explicit and each carrier's `secretId` is verified against
  its ref (`dhan_dpapi_vault_backend.ts:70-73`, `:341-353`); an inversion raises `INVALID_SECRET_REF`,
  not a vendor 401.
- **Confidence: LOW.**

### 8.8 Summary ranking

| Rank | Hypothesis | Confidence | Local fix? | Needs vendor/portal? |
| --- | --- | --- | --- | --- |
| 1 | H1 token revoked / superseded | MEDIUM-HIGH | partly | yes |
| 2 | H4 expired token + zone-less expiry escaping pre-flight | MEDIUM | **yes** (§6.3) | no |
| 3 | H2 unmatched client-id/token pair | MEDIUM | no | yes |
| 4 | H3 not entitled to the endpoint | LOW-MEDIUM | no | yes |
| 5 | H5 construction defect | LOW | — | — |
| 6 | H6 misclassification | LOW | — | — |
| 7 | H7 role inversion | LOW | — | — |

---

## 9. Facts that remain unverified

Explicitly UNVERIFIED, not assumed:

1. **Whether the token was valid at 2026-11-12T19:42Z.** Requires the portal or a vendor call.
2. **The token's provisioning timestamp** (`createdAtUtc` / `rotatedAtUtc`) — in the DPAPI envelope,
   deliberately not read (§6.1).
3. **The configured `IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT` string**, including whether it carried a
   timezone suffix (§6.2, §8.4). Metadata, therefore inspectable without exposing the secret — but not
   inspected here, because reading it is outside this work item's read-only remit.
4. **Whether the Client ID and access token belong to the same Dhan session** (§8.2).
5. **Whether the credential pair was entitled to `/marketfeed/quote`** (§8.3).
6. **The vendor's numeric status (`401` or `403`) and error code/body** — destroyed at mapping (§7.1).
7. **How many vendor sends occurred** for the attempt (§5.6 below).
8. **Whether the stored secrets were written through the governed CLI** (and thus passed
   `validateCredentialSecret`) or arrived by another path (§5.a).
9. **The exact wire bytes of the request** — never captured; the review in §5 is of the code that
   builds them, not of a packet.

### 5.6 (referenced above) The 5893 ms and the number of sends

`AUTHENTICATION_FAILURE` is **not** in `TRANSIENT_CODES` (`dhan_operational_controls.ts:229-231`), so
`withBoundedRetry` never retries it — the captured code comes from the **last** send. Whether there was
one send or more cannot be settled without the configured timeout, which was not recorded. The
arithmetic is nonetheless informative:

- A single send returning `401/403` within a `5000` ms cap would complete in ≲5000 ms, not 5893 ms.
- First send timing out at the cap, then one retry returning `401/403`, costs
  `timeout + (100 ms base backoff + up to 50 % jitter)` ≈ `5000 + 100…150` = **5100–5150 ms**.
- So **neither model exactly reproduces 5893 ms**, and the ~740–790 ms residual is unexplained by the
  code alone. It may be DPAPI child-process overhead on the retry's credential resolution, TLS setup,
  or an operator-configured timeout above 5000 ms. **The count of vendor sends is therefore genuinely
  unknown**, and the W-06 record's "compatible with either, the verdict does not depend on it" remains
  the correct characterisation.

---

## 10. Local corrective actions justified by the evidence

Ranked by value per unit of risk. **None is implemented in this work item**; each needs its own
authorisation.

| # | Action | Justified by | Risk | Scope |
| --- | --- | --- | --- | --- |
| 1 | **Surface the vendor's numeric status in the daemon's operator error body** (add `httpStatus` to `sendError` for provider failures only; leave `/v1/freshness` redacted) | §7.1, §7.4 — it is already in hand and is the only thing that would make the next attempt interpretable | Low: one integer on a loopback, already-authenticated surface; Dhan's body still never echoed | Server-side, small |
| 2 | **Require an explicit timezone in `expiresAt`** (reject zone-less strings at config/provisioning time) | §6.3 defect; latent, will bite any host not on UTC | Low: turning a silent misread into a typed `CONFIGURATION_INCOMPLETE` | Config + CLI |
| 3 | **Inspect (not print) the configured expiry string for a zone suffix** | §8.4 — the only locally-resolvable hypothesis | None: metadata only, no secret | Operator, 1 command |
| 4 | Confirm whether the carriers were written via the governed CLI | §5.a | None | Operator statement |

Actions 1 and 2 are *implementation* changes and are explicitly **out of scope here**.

---

## 11. Proposed single-request verification procedure (PLAN ONLY — NOT EXECUTED)

To be run only under a **separate, explicit authorisation**. Nothing below has been executed, and this
work item does not request execution.

**Preconditions (all must hold, else stop):**

1. Action 1 above is implemented and deployed, so the next outcome carries the vendor's status.
2. Action 3 above has been performed: the configured expiry string carries an explicit UTC offset, and
   §6.3's zone-less case is excluded.
3. The operator has confirmed, from the Dhan portal, that the Client ID and access token in the store are
   the **pair currently displayed**, and that the account is entitled to Market Quote.
4. `npm run dhan:credential -- verify all` reports `PRESENT_OK` for both carriers and `expired=no`.
5. The daemon is started **after** those checks, with a recorded `IIPS_DHAN_TIMEOUT_MS` (so §5.6's
   ambiguity stops recurring).

**The single request:**

6. Exactly one `POST /v1/quotes` for the same canonical identity, through the existing capture harness
   (`w06-03-quotes-attempt*`), which records status, typed code, message, elapsed and body.
7. **No automatic retry beyond the implementation's own bounded retry**, and no other vendor route
   (`/v1/historical` and every non-quotes endpoint remain unauthorised).
8. Stop on the first captured outcome regardless of what it is. Decisive rows per the W-06 stop table.

**Interpretation matrix (what the new evidence would settle):**

| Captured | Reads as | Next step |
| --- | --- | --- |
| `200` + envelope | vendor authentication succeeded, quote produced | M1 candidate; separate evidence work |
| `502 AUTHENTICATION_FAILURE` + `vendorStatus=401` | token invalid/expired at Dhan | regenerate token, re-provision, one further request |
| `502 AUTHENTICATION_FAILURE` + `vendorStatus=403` | pair/entitlement refused | correct pairing or entitlement at Dhan; **do not** retry blindly |
| `502 AUTHENTICATION_FAILURE` + no status | instrumentation failed | fix instrumentation before any further request |
| other code | per the W-06 stop table | per that row |

This is the whole point of Action 1: without it, rows 2 and 3 are indistinguishable, which is precisely
the position this investigation is in.

---

## 12. M1 and W-06 status

| Item | Status |
| --- | --- |
| **M1** | **NOT ACHIEVED** — no successful authenticated vendor interaction has occurred |
| **W-06** | **OPEN** — its evidence clause was satisfied by the captured typed auth failure; a vendor rejection is not a completed authenticated interaction |
| W-06 evidence clause | satisfied (unchanged, previously recorded) |
| D-6 | complete (unchanged) |
| P7 local transport | operationally verified (unchanged) |
| M2a / M2 / M3a / M3 / M4 | unchanged; untouched by this record |
| Further vendor requests | **not authorised** by this work item |

This investigation changes no status. It is a diagnostic record, not a gate movement.

---

## 13. Recommendation

### **NOT READY** for one further controlled Dhan authentication request.

**Justification against the readiness criteria (§7 of the work item):**

| Criterion | Met? | Note |
| --- | --- | --- |
| Local request path traced | **yes** | §4, all eleven layers with source refs |
| No known local defect remains unresolved | **NO** | two defects: observability (§7.4) and expiry-zone (§6.3) |
| Credential references and role mapping understood | **yes** | §5, §6.5 — correct and verified against source |
| Current configuration usable without exposing secrets | **yes** | per-request resolution means no restart needed for the secret (§6.4) |
| Expiry handling understood | **yes**, with a caveat | understood *and found defective* when the timestamp is zone-less (§6.3) |
| Response classification sufficient to interpret the next outcome | **NO** | §7.2, §7.4 — status indistinguishable; the next attempt would be as opaque as the last |
| Exactly one request, no automatic retries | **yes** | achievable; the implementation's bounded retry is the only automatic repeat |

**Exact blocker:** the second-from-last row. A further request today would return
`502 AUTHENTICATION_FAILURE` for **any** of H1/H2/H3 and would not distinguish them, so it would
consume the authorisation without advancing diagnosis.

**Two ways to clear it:**

- **Cheapest (no code):** perform Action 3 (inspect the expiry string for a zone) and obtain operator
  confirmation from the portal that the stored pair is current and entitled. If both are clean, H4 and
  H2 collapse, and the remaining hypothesis is H1 — which a controlled request would confirm.
- **More durable (code):** implement Action 1 so the next outcome carries `vendorStatus`. This makes the
  request worthwhile whatever its result.

**READY is a technical recommendation only. It does not authorise vendor egress,** and this record
explicitly does not.

---

## 14. Evidence index and source references

| Reference | Purpose |
| --- | --- |
| `dhan_market_data_http.ts:401` | typed provider failure → `502`; `RATE_LIMITED` → `429` |
| `dhan_market_data_http.ts` auth block | transport gate (Layer A), before routing |
| `dhan_api_client.ts:183-299` | `executeJsonPost`: pre-flight, resolve, headers, transport, mapping |
| `dhan_api_client.ts:196-215` | SecretRef expiry pre-flight; **per-request** resolver call |
| `dhan_api_client.ts:251-261` | header construction (`access-token`, `client-id`) |
| `dhan_api_client.ts:302-315` | `mapHttpStatus` — the sole producer of `AUTHENTICATION_FAILURE` |
| `dhan_api_client.ts:95` | `DHAN_MARKET_QUOTE_PATH = '/marketfeed/quote'` |
| `dhan_server_egress.ts:59-123` | HTTPS/origin/path guards; `fetch` with `redirect:'error'` and abort signal |
| `dhan_local_vault_resolver.ts:238-253`, `:280-289` | expiry checks (`Date.parse`) |
| `dhan_local_vault_resolver.ts:347-373` | paired, per-request read of both carriers |
| `dhan_dpapi_vault_backend.ts:70-73`, `:341-353` | role→carrier mapping and `secretId` verification |
| `dhan_credential_store_utility.ts:259-296` | provisioning-time secret validation |
| `dhan_operational_controls.ts:229-237`, `:340` | transient-code set and the retry wrapper |
| `dhan_freshness_status.ts:9` | `REFRESH_FAILED` redaction (why freshness cannot testify) |
| `dhan_failures.ts:38-46` | `DhanFailure.httpStatus` — populated, then dropped at the boundary |
| `dhan_config.ts:33`, `:35`, `:44`, `:87-90` | base URL, default 5000 ms timeout, `IIPS_DHAN_TIMEOUT_MS` |
| `docs/integration/DHAN-W06-FIRST-AUTHENTICATED-REQUEST-EVIDENCE-2026-11-12.md` §12 | the captured attempt |
| `docs/integration/DHAN-W06-LOCAL-TRANSPORT-RECOVERY-EVIDENCE-2026-11-12.md` §3.1 | local resolution ≠ vendor auth |
| `docs/integration/DHAN-W06-TRANSPORT-AUTH-RECOVERY-2026-11-12.md` | the P7 procedure |
| `docs/integration/DHAN-D6-OPERATOR-TOKEN-ACQUISITION-AND-REPLACEMENT-2026-11-12.md` §6, §9 | provisioning and expiry contract |

---

## 15. Safety footer

No HTTP request was made to Dhan or any vendor endpoint. No rejected request was replayed, retried or
simulated. No credential was rotated, regenerated, replaced, revoked, printed or copied into this record.
No DPAPI carrier, ACL, vault entry or credential metadata was read or modified. No production source,
provider behaviour, authentication logic or configuration was changed — this work item added one
document and one conformance test. P7 was not reopened. PR #156 was not merged.
**W-06 remains OPEN and M1 remains NOT ACHIEVED.**
