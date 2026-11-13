# DHAN W-06 — Local Transport Authentication Recovery: Windows-Host Evidence (2026-11-12)

**Status:** EVIDENCE RECORD — the P7 local transport authentication fix was **recovered and verified on
the governed Windows host**. This record documents that recovery and nothing beyond it.
**Subject:** the operational failure described in `DHAN-W06-TRANSPORT-AUTH-RECOVERY-2026-11-12.md`
(every request answered `401 UNAUTHENTICATED` while the operator re-entered the same token), and its
recovery under the published P7 implementation.
**Procedure:** `docs/integration/DHAN-W06-TRANSPORT-AUTH-RECOVERY-2026-11-12.md` §4 (authoritative; this
file records one run of it and does not replace it).
**Recovered tree:** `ramkivs/iips-production-market-data` @ `a1a3c60f3e20254bc70066b54dca9ddfb0fa8bc8`,
branch `arena/84d1e063-iips-production-market-data`.
**Roadmap authority:** `ramkivs/iips-review-recovered` →
`docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` (v1.1), §W-06 (read-only;
not modified by this record).
**Date:** 2026-11-12.

> **This file contains no credential.** The two `sha256`-prefixed strings in §6 are the **first 8 bytes
> of a SHA-256 digest of a transport token**, supplied by the operator as value-free fingerprints. They
> are one-way, truncated, and cannot be used to reconstruct, confirm or reuse the secret. No transport
> token value appears in this file, and no credential-bearing environment dump was taken.
>
> **No Dhan Client ID or Access Token was rotated, replaced, verified or transmitted during this work,
> and neither appears in this file.** The daemon *did* decrypt both carriers at startup, as it does on
> every start — that is what `vaultBackendReadiness=READY` entails, and §3.1 traces it to source. The
> distinction matters: reading is not verifying, and neither is authentication.

> **Scope warning, read before citing this record.** A local `HTTP 200` from `/v1/health` proves that the
> **operator-to-daemon transport credential matched**. It proves nothing about Dhan: no vendor request
> was made, no vendor authentication occurred, and no market data was retrieved. §9 states each of these
> exclusions individually, and §10 states what this record cannot claim at all.

---

## 1. Purpose and scope

The P7 implementation made the transport gate diagnosable, but a published fix is not evidence that a
real operator on a real host recovered. This record closes that gap: it preserves what the operator
observed on the governed Windows workstation, checks those observations against the shipped contract,
and separates the one claim they support from the several they do not.

**In scope:** the local, loopback, operator-to-daemon transport path — build, daemon startup state, the
initial second-session `401`, the fingerprint comparison that explained it, the corrected same-session
run, and the final `200`.

**Out of scope, and not evidenced anywhere in this file:** Dhan vendor authentication, live market-data
retrieval, quote or historical qualification, M1, M2a/M2/M3a/M3/M4, and production readiness.

---

## 2. What this recovery is, and what it is not

The defect was entirely local. `IIPS_MARKET_DATA_TRANSPORT_TOKEN` is a **loopback shared secret between
the operator's shell and the IPD daemon**; it is not a Dhan credential, it is never forwarded to
`api.dhan.co`, and it is not stored in DPAPI. The gate that rejected the requests runs **before**
credential resolution and **before** any provider or vendor code (`dhan_market_data_http.ts`, the auth
block that precedes every route).

Two independent authentication layers therefore exist in this integration, and this record is about
exactly one of them:

| Layer | What authenticates | Evidence state after this record |
| --- | --- | --- |
| **Layer A — local transport** (this record) | the operator's shell to the loopback daemon, via `IIPS_MARKET_DATA_TRANSPORT_TOKEN` | **recovered and verified**: `HTTP 200` from `/v1/health` (§8) |
| **Layer B — Dhan vendor** | IPD's server to `api.dhan.co`, via the DPAPI-resolved Client ID and Access Token | **unchanged and unproven**: the recorded vendor verdict is `502 AUTHENTICATION_FAILURE` (W-06 evidence record §12) |

**This recovery confirms the local operator-to-daemon transport path only.** A `200` at Layer A says
nothing about Layer B. The two are not on the same path, do not share a credential, and cannot
substitute for each other.

---

## 3. Execution environment

| Field | Value |
| --- | --- |
| Host | the governed Windows workstation |
| Shell | Windows PowerShell, two separate sessions (see §5) |
| Repository | `ramkivs/iips-production-market-data` |
| Branch | `arena/84d1e063-iips-production-market-data` |
| Tree under test | `a1a3c60f3e20254bc70066b54dca9ddfb0fa8bc8` (P7) |
| Daemon endpoint | `http://127.0.0.1:8791` (loopback only) |
| Vault backend in use | `windows-dpapi` (`WINDOWS_DPAPI_USER_SCOPE`) — **unchanged** by this work |

No credential was created, rotated, replaced or deleted, and the DPAPI store, its ACLs and both
carriers were **not modified**.

The carriers **were read**, however — and an earlier revision of this paragraph said they were not.
That was inaccurate, and §3.1 corrects it with the source path that establishes it: the daemon's
startup readiness probe **decrypts both Dhan secrets** before it reports `READY`.

### 3.1 What daemon startup actually does with the Dhan credentials

This was traced in source, not inferred from the diagnostic labels. The chain is short and, for this
question, conclusive.

| Step | Location | What it does |
| --- | --- | --- |
| 1 | `dhan_local_daemon.ts:446` | `resolveDhanProviderConfig(env, now())` — builds **`vault://` SecretRef pointers only**; `DhanProviderConfig` carries `accessTokenRef` / `clientIdRef` and no value field (`dhan_config.ts:61-65`) |
| 2 | `dhan_local_daemon.ts:161-166`, `:487-492` | the selector constructs the real `WindowsDpapiHostVaultBackend`, wrapped by `LocalHostVaultDhanCredentialResolver` |
| 3 | `dhan_local_daemon.ts:498` | `await resolver.probeBackendReadiness()` — called with **no ref**, so all roles are probed |
| 4 | `dhan_local_vault_resolver.ts:196-212` | delegates to the backend's `probeReadiness()` |
| 5 | `dhan_dpapi_vault_backend.ts:216-219` | `probeReadiness()` → `evaluateReadiness(undefined)` |
| 6 | `dhan_dpapi_vault_backend.ts:272-283` | `probeRoles` stays `['clientId', 'accessToken']` because no ref was supplied |
| 7 | **`dhan_dpapi_vault_backend.ts:284-292`** | **`await this.unprotect(envelope.ciphertext)` for each role; a failed or empty decrypt returns `unready`** |
| 8 | `dhan_dpapi_vault_backend.ts:475-515` | `unprotect()` runs the DPAPI child with operation `unprotect` and returns **`plaintext`** (`:511`, base64 → UTF-8) |
| 9 | `dhan_dpapi_vault_backend.ts:295-299` | only past step 7: `liveResolutionSupported: true` |
| 10 | `dhan_local_daemon.ts:626` | `vaultBackendReadiness` is `READY` **iff** that boolean is true |

**So startup does not merely validate references.** With the selector at `windows-dpapi`, startup
decrypts both the Client ID and the Access Token under the current Windows user, checks that each
yields non-empty plaintext, and discards it. It does **not** compare the secrets to anything, does not
send them anywhere, and does not retain them.

The inference is closed at the joins rather than assumed:

- `liveResolutionSupported: true` is set in **exactly one place** in the whole provider module
  (`dhan_dpapi_vault_backend.ts:297`), and the only path to it passes through the decrypt loop at
  `:284-292`.
- `vaultBackendReadiness` is derived from that single boolean at `dhan_local_daemon.ts:626`, so the
  observed `vaultBackendReadiness=READY` **entails** a successful decrypt of both carriers.
- `providerState=CREDENTIALS_RESOLVED` is likewise entailed: `deriveDhanProviderState` returns it only
  when configuration is `CREDENTIAL_REFERENCES_CONFIGURED` **and** `vaultReadiness === 'SUPPORTED'`
  (`dhan_provider_state.ts:163`), which is the same boolean. It is also **capped** there — the function
  cannot return `AUTHENTICATED` or `OPERATIONAL` without a vendor outcome, which is why this state is a
  statement about the local store and not about Dhan.

**No plaintext is retained.** `unprotect()`'s caller uses the decrypted value only for
`probe.plaintext.length === 0` (`:288`); the backend declares no field that can hold a secret — only
`lastProbe`, the verdict (`:153`) — and the module documents the invariant as "zero plaintext at rest in
this process" (`:18-20`). The plaintext transits the DPAPI child on **stdout**, with the request on
**stdin** (`dhan_dpapi_process.ts:13-16, 333`), never argv, never a file, never the environment.

**What this record cannot distinguish.** Everything above is established from source, and from the
operator's diagnostics. This record did **not** observe the host's decrypt operations directly — no
DPAPI audit log, no per-call trace from that host was captured — so the claim "both carriers were
decrypted on that specific run" rests on the `READY`/`CREDENTIALS_RESOLVED` entailment above, not on a
direct observation of the decrypt. That is a strong entailment, not a measurement, and it is stated as
such rather than upgraded.

### 3.2 Resolution is not authentication, and not rotation

Three things that are easy to conflate, kept apart:

| | What it means | Evidenced here? |
| --- | --- | --- |
| **Resolution** | the store was opened and the secrets were decrypted and returned to the caller — a *local* operation, no network | **yes**, at every startup with `READY` (§3.1) |
| **Authentication** | Dhan accepted those credentials as valid — a *vendor* operation | **no**; no vendor request was made (Layer B, §2) |
| **Rotation / replacement** | a new secret was written to the store, superseding the old | **no**; nothing was written, and §13 records that |

Two consequences worth stating plainly, because both were live confusions:

1. Startup reads the credentials **on every start**, so a `READY` daemon has demonstrably decryptable
   secrets — that is a genuine, useful fact, and it is *not* evidence that Dhan will accept them. The
   recorded vendor verdict remains `502 AUTHENTICATION_FAILURE`.
2. Because startup reads but never writes, restarting the daemon does **not** rotate, replace or
   invalidate either carrier. This is what the procedure means by "restart re-reads the DPAPI carriers";
   the read is real, the risk to the stored secrets is nil.

---

## 4. Build — E1

The operator confirmed the checkout was at the P7 commit and rebuilt from source, because
`npm run start:market-data-daemon` runs `dist/` and **does not rebuild**:

```powershell
git rev-parse HEAD          # a1a3c60f3e20254bc70066b54dca9ddfb0fa8bc8
npm.cmd run build:tsc
```

**Result:** successful TypeScript compilation, **no errors**.

This step matters for the evidence: without it, the daemon could have been running a `dist/` compiled
from an earlier commit, and the observed behaviour would not have been the P7 behaviour. With it, the
process whose startup line appears in §5 is the P7 code.

---

## 5. Daemon startup — E2, and the session that holds the token

The previously running daemon was already stopped. The rebuild was launched **in the foreground of the
original session**, which already held `IIPS_MARKET_DATA_TRANSPORT_TOKEN`:

```powershell
npm.cmd run start:market-data-daemon
```

Startup reported, verbatim in substance:

| Field | Observed value |
| --- | --- |
| Listen address | `http://127.0.0.1:8791` |
| `vaultBackend` | `WINDOWS_DPAPI_USER_SCOPE` |
| `vaultBackendSelector` | `windows-dpapi` |
| `vaultBackendReadiness` | `READY` |
| `liveCredentialResolution` | `true` |
| `credentialReadiness` | `CONFIGURED` |
| `providerState` | `CREDENTIALS_RESOLVED` |
| `vendorEgress` | `IPD_SERVER_HTTPS` |
| `qualifiedMappings` | `96` |

Two things follow, and both are required for the rest of this record to mean anything:

1. The daemon **started**, so P7's startup validation accepted the configured token. An untransmittable
   value can no longer reach a listening socket: it is refused at `phase: 'validate'` with a typed code
   (P7 startup refusal, `TRANSPORT_TOKEN_NOT_ASCII` / `TRANSPORT_TOKEN_WHITESPACE`). Nothing was refused.
2. Per D-7 vocabulary, `providerState=CREDENTIALS_RESOLVED` is the **ceiling for a process that has not
   called the vendor**, and `vendorEgress=IPD_SERVER_HTTPS` means egress is *permitted*, not *proven*.
   Neither value claims authentication. This is the same startup shape the earlier W-06 capture recorded,
   so the recovery changed nothing about provider readiness.
3. `vaultBackendReadiness=READY` is not a label for "references look configured": reaching it required a
   successful **decryption of both Dhan carriers** in this same startup (§3.1). The daemon therefore
   read the Client ID and Access Token at this point — a local read, not a vendor authentication, and
   not a rotation.

The daemon captured this session's token value **once, at startup**, and never re-reads it (P7 `P7-11`).

---

## 6. The failure — E3: second-session `401`, and the fingerprint that explained it

The first health check was performed **from a second PowerShell session**, where the token had been
re-entered independently:

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:8791/v1/health' `
  -Headers @{ Authorization = "Bearer $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN" } -UseBasicParsing
```

**Result — `401`:**

```json
{"error":{"code":"UNAUTHENTICATED","message":"missing or invalid transport credential"}}
```

This is the **same symptom the investigation recorded**, reproduced under the fixed build. It is worth
being precise about why: P7 did not make this failure disappear, and it was not supposed to. P7 removed
the *ambiguity* around it — value-free fingerprints now distinguish the possible causes — while keeping
the uniform 401 body so the gate leaks nothing to a caller.

The operator then compared the two copies **without displaying either value**:

| Measurement | Second PowerShell session | Original daemon-launching session |
| --- | ---: | ---: |
| UTF-8 byte length | 327 | 327 |
| SHA-256 first 8 bytes | `b51fd981f1429e1a` | `e2b0c8f08646ee1a` |
| Non-ASCII byte count | 0 | 0 |

**Reading of the evidence, per the procedure's own decision table (§4.4):**

- **UUID-shaped.** 327 bytes is consistent with a 32-hex-digit UUID carried through PowerShell's
  `[guid]` string form, not with a short typed passphrase. This is why the two values looked identical
  to a human eye and why repeated re-entry kept "confirming" the same value.
- **`nonAscii = 0` on both sides.** P7's startup encoding guard is therefore not the explanation here,
  and no invisible-character cause is claimed. It is worth stating plainly that the *earlier* diagnosis
  ranked a non-ASCII character first among the candidates; on this host that candidate is now **excluded
  by measurement**, not merely deprioritised.
- **Equal length, different digest.** Same number of bytes, different content — so the two sessions held
  **two genuinely different token values**, not the same value encoded differently.
- **Same length, same alphabet.** A different digest with an identical length is consistent with two
  distinct UUIDs (for example, the value regenerated between sessions, or a stale copy re-entered from a
  different source), but this record does **not** establish provenance for either value and does not
  claim to know how the divergence arose.

**Root cause of the observed failure, as evidenced:** the client and the daemon were comparing two
different secrets. The daemon held one value; the second session presented another. No defect in P7 is
implicated, and no P7 behaviour needed to change — the operator-side workflow was the fault, exactly as
the investigation's classification predicted ("operator configuration issue, with an implementation
contributing factor now removed").

---

## 7. The correction — E4: same-session daemon and client

The remediation applied is the procedure's invariant — **one entry, two readers**:

1. the daemon was **restarted in the background from the original PowerShell session**, inheriting that
   session's environment (no value re-typed, copied or written to disk);
2. the health check was then executed **from that same original session**, so the client read the very
   environment variable the daemon had inherited;
3. nothing about DPAPI, the `IIPS_DHAN_*` configuration or the Dhan credentials was touched.

```powershell
# In the ORIGINAL session, which already holds the token:
Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','start:market-data-daemon' `
              -WorkingDirectory (Get-Location) -NoNewWindow -PassThru
# ... then, from the same session:
Invoke-WebRequest -Uri 'http://127.0.0.1:8791/v1/health' `
  -Headers @{ Authorization = "Bearer $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN" } -UseBasicParsing
```

This is the procedure §4.2–§4.3, run as written. The value crossed the process boundary by **inheritance
only** — never argv, never a file, never a second hidden-input prompt.

---

## 8. The result — E5: local `HTTP 200`

**Result: `HTTP 200`.** The returned response began:

```text
{"service":"UP","providerConfiguration":"CONFIGURED","liveProviderConnectivity":"NOT_CHECKED_PRE_ACCESS","providerQualification":"SYNTHETIC_ONLY_NOT_LIVE...
```

### 8.1 The response was truncated in the capture

The console output was cut off. **The omitted fields are not reconstructed, completed or guessed here.**
The visible prefix is recorded exactly as supplied, ending at the ellipsis shown above.

This is a limitation, not a defect, and it is a small one — for the following reason, which is checked
against the shipped contract rather than assumed: the remaining field, `providerQualification`, is a
**literal type**. `ServiceHealth` declares `providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED'`
(`dhan_market_data_service.ts:59-70`), and the same literal is asserted by the existing W-06 suite. The
truncated tail can therefore only be `_LIVE_QUALIFIED"}`. This record states that reasoning explicitly
so that no reader mistakes a completed literal for an invented observation: the **observation** is the
visible prefix; the completion is a **contract fact**.

In Arena, the same endpoint was exercised against the P7 build with a synthetic in-process provider
transport stubbed to throw if called. It returned status `200` and a body whose prefix matched the
operator's capture character for character:

```text
{"service":"UP","providerConfiguration":"CONFIGURED","liveProviderConnectivity":"NOT_CHECKED_PRE_ACCESS","providerQualification":"SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED"}
```

The stub was never invoked: `/v1/health` performs **no network call** by design
(`dhan_market_data_source.ts:164-165`, "Reports provider health WITHOUT performing any network call").
So this corroboration involved no vendor request.

### 8.2 Why `providerConfiguration` is `CONFIGURED` on a fresh daemon

`providerConfiguration` is `PRE_ACCESS_CREDENTIALS_UNAVAILABLE` only when the provider health is `DOWN`
**and** readiness is `PRE_ACCESS_CREDENTIALS_UNAVAILABLE`. A freshly started daemon that has made no
vendor call reports `DEGRADED` internally (no prior success), so the visible value is `CONFIGURED`. This
is expected and says nothing about the vendor — which is precisely why `liveProviderConnectivity` is the
literal `NOT_CHECKED_PRE_ACCESS` rather than a claim.

---

## 9. What this recovery proves — and what it does not

**Proven, and only this:** on the governed Windows host, with the P7 build, a health request issued from
the session whose environment the daemon inherited **authenticated against the local transport gate and
returned `200`**. The transport-credential mismatch that produced the `401` was a difference between two
session-held secret values, demonstrated by value-free fingerprints, and was resolved by sharing one
entry rather than by changing authentication.

| Not proven here | Why not |
| --- | --- |
| **Dhan vendor authentication succeeded** | no vendor request was made at any point; Layer B was not exercised |
| **Live market data was retrieved** | `/v1/health` returns a local literal and performs no network call; nothing was quoted or fetched |
| **M1 achieved** | M1 requires one real authenticated **vendor** interaction to *succeed*; this record contains none |
| **Production qualification or readiness** | `providerQualification` is the literal `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED`; `vendorEgress` is permission, not proof |
| **W-06 closed** | the roadmap's W-06 clause concerns a vendor interaction and its redaction evidence, not the local gate; see §10 |
| **The corrected token will still work after a restart** | the corrective run used one session for both processes; whether the *other* session's value is a live credential is untested and is not this task's business |

---

## 10. Roadmap status after this record

This recovery is **operational evidence for the P7 fix**. It does not move the W-06 gate, and the status
model is preserved exactly as the W-06 evidence record states it:

| Item | Status | Basis |
| --- | --- | --- |
| **P7** — local transport authentication | **operationally verified** on the Windows host | this record (§4–§8) |
| **W-06** | **OPEN** — unchanged by this record | §2: layer A recovery is not a vendor interaction |
| W-06 evidence clause | satisfied (previously recorded, unchanged) | W-06 record §13: typed auth failure captured |
| **M1** | **NOT ACHIEVED** | the vendor rejected the credentials; nothing was authenticated |
| **D-6** | complete | unchanged by this work |
| M2a / M2 / M3a / M3 / M4 | retain their existing statuses | nothing in this record touches them |
| Further Dhan vendor requests | **not authorised** | no request was made, and none is needed for this recovery |

The distinction worth keeping in view: **W-06's evidence clause was already satisfied by a captured vendor
rejection** (the daemon answered `502 AUTHENTICATION_FAILURE`, produced only on a received vendor `401`
or `403`). The `401` in this record is a *different* status on a *different* layer — the local gate,
before any provider code ran. The two should never be conflated, in either direction: this record's `200`
does not repair the vendor rejection, and the vendor rejection does not indicate a transport defect.

---

## 11. Evidence index

| ID | Observation | Where |
| --- | --- | --- |
| E1 | Build from P7 tree, no compile errors | §4 |
| E2 | Daemon startup state, nine diagnostics | §5 |
| E3 | Second-session `401`, with value-free fingerprint comparison | §6 |
| E4 | Daemon restarted in background from the original session; client run in that same session | §7 |
| E5 | Local `HTTP 200`, response captured **partially** (truncated) | §8 |

Each entry records only what was observed. The fingerprint table in §6 is the sole quantitative evidence,
and it is one-way.

---

## 12. Evidence limitations (none of these is closed by this record)

1. **The health body is truncated** (§8.1). The visible prefix is recorded verbatim; the tail is a
   contract literal, not an observation.
2. **The fingerprints are truncated to 8 bytes.** They discriminate these two values; they do not prove
   either value's provenance, and they are not a general-purpose identifier for the secret.
3. **One corrective run.** Single observation, no repetition; no claim of reproducibility across restarts
   or hosts is made.
4. **Provenance of the divergence is unknown** (§6). The record shows *that* the two sessions differed,
   not how the second copy came to differ.
5. **Windows PowerShell only.** The executed path is PowerShell on the governed host; no other client is
   evidenced.
6. **Layer B is untouched** (§2). The recorded vendor verdict stands and is neither confirmed nor
   contradicted.
7. **The startup decryption is established by entailment, not direct observation** (§3.1). No DPAPI
   audit trace or per-call log from the host was captured. `READY` entails a successful decrypt, because
   the only path to `liveResolutionSupported: true` runs through the decrypt loop — but this record did
   not watch the host perform it.

---

## 13. Security handling of this record

- No transport token value, no Dhan Client ID, no Access Token and no DPAPI secret material appears here.
- The only secret-derived strings are the two truncated SHA-256 prefixes in §6, supplied by the operator
  as value-free evidence; they are one-way and cannot be reversed.
- No credential-bearing environment dump was taken, and none is reproduced.
- No new credential, fingerprint or measurement beyond those supplied has been added.
- The DPAPI store, its ACLs and both Dhan carriers were **not modified**, and no credential was rotated.
- The Dhan credentials **were decrypted by the daemon at startup** (§3.1), because the `windows-dpapi`
  readiness probe decrypts both carriers before reporting `READY`. No plaintext was retained by the
  backend, transmitted, logged or reproduced here — but "the carriers were not read" would be false, and
  an earlier revision of this record said exactly that.
- **No Dhan vendor request was made** in the course of the host work recorded here or in this Arena
  verification.
