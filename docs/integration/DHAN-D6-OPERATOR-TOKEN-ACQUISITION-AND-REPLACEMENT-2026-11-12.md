# DHAN D-6 — Operator Token-Acquisition and Replacement Procedure

**Status:** DOCUMENTED — procedure only. No credential is recorded here and none was obtained.
**Decision:** D-6 (roadmap v1.1) — owner of the procedure: the Operator; owner of this document: IPD.
**Roadmap authority:** `ramkivs/iips-review-recovered` → `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` (v1.1), §D-6
**Implementation this procedure drives:** W-02 (store backend), W-04 (provisioning/rotation/verification CLI, published at `0fa4da4`), W-03 (daemon selector and diagnostics), D-7 (state model and disclosure policy)
**Host:** the governed Windows workstation (`H:\IIPS\runtime\` runtime root)
**Date:** 2026-11-12

> **Read this first.** D-6 is a *procedure*, not an implementation. It contains no token, no client
> id, no ciphertext and no carrier content, and it must never be edited to contain one. Every command
> below exists in the shipped tree and was checked against it (see §13). Nothing in this document
> authorises live testing: the first authenticated vendor interaction is **W-06**, performed by the
> operator, once.

---

## 1. What this procedure does, and what it does not do

**It does:** take the two secrets the operator obtains from Dhan's own web console and place them in
the governed Windows DPAPI credential store, one carrier per secret, so that the IPD daemon can
resolve them.

**It does not:**

| Not done here | Owner / status |
| --- | --- |
| Acquire or renew a token automatically | **Deferred.** The roadmap records that no token endpoint is called by either repository (B-7) and that automated acquisition is out of scope unless a separate decision changes it. This procedure assumes **manual replacement for the token's whole 24-hour life** |
| Prove that the vendor accepts the credentials | **W-06.** One controlled authenticated request, recorded as evidence |
| Qualify quotes, history or freshness | W-07 onward. Nothing here qualifies any market data |
| Decide or change the store, the envelope, the DACL or the key paths | D-1 / W-02 / W-04, consumed as implemented |
| Run on a non-Windows host | Windows DPAPI user scope is the D-1 store; the utility refuses elsewhere |

### 1.1 Local provisioning is not authenticated connectivity

The distinction is the whole point of D-7, and the most common way to misread a successful run:

| What you did | What it proves | Highest D-7 state reachable |
| --- | --- | --- |
| `provision` / `rotate` succeeded | the secret was encrypted, written atomically and **decrypted back to the same value** on this host, under this Windows account | `CONFIGURED` |
| `verify` reports `PRESENT_OK` for both carriers | both carriers are present, owner-only, schema-valid, identity-matched, version-matched, unexpired and readable | `CREDENTIALS_RESOLVED` |
| the daemon starts with `vendorEgress=IPD_SERVER_HTTPS` | the daemon has a usable credential source **and** has made no vendor call | `CREDENTIALS_RESOLVED` |
| a vendor request is accepted (W-06) | Dhan actually accepts these credentials | `AUTHENTICATED` |

Startup makes **no vendor call**, so no local command in this document can produce `AUTHENTICATED` or
`OPERATIONAL`, and none of them says the provider is "connected". Anything that claims local
verification proves connectivity is wrong.

---

## 2. Prerequisites

**Host and software**

- [ ] The governed Windows workstation, with the `H:\IIPS\runtime\` runtime root present and outside
      any Git working tree (`H:\IIPS\runtime\dhan-secrets` is the default carrier directory).
- [ ] Node.js 22.x (the repository's pinned runtime) and a checkout of
      `ramkivs/iips-production-market-data` on the branch under test.
- [ ] `npm ci` and the build completed in that checkout, so `dist/src/providers/dhan/dhan_credential_store_cli.js`
      exists (the `dhan:credential` script points at it).
- [ ] The operator's own Windows account is the account that will run both the utility and the
      daemon. DPAPI user scope binds the carriers to this account: a carrier written by one account
      cannot be read by another, and that is intended.

**Account and entitlements (operator-owned, out of band)**

- [ ] An active Dhan account the operator is authorised to use for this workstation.
- [ ] Confirmation that the account's API access includes the market-data endpoints IPD needs. Vendor
      entitlements and any subscription are the operator's responsibility; IPD neither knows nor
      checks them.
- [ ] The Dhan Client ID for that account, and the ability to complete Dhan's own sign-in (including
      any second factor) in a browser on this host.

**Scope guards**

- [ ] `NODE_ENV` is **not** `production` and `IIPS_DEPLOYMENT_ENV` is **not** `production`. The daemon
      refuses production mode; non-production local execution is the Stage-1 scope.
- [ ] The operator knows which branch/commit is deployed and will record it (§12).

---

## 3. Step 0 — Pre-flight: know the state before you touch it

Run from the repository root. Always run `verify` first: it is read-only.

```powershell
npm run dhan:credential -- verify
```

Expected on a fresh host, exit code **6** (verification found nothing to confirm):

```
[ipd-dhan-credential] verify: platformAdmissible=yes locationAdmissible=yes
  client-id    : ABSENT (present=no readable=no aclOwnerOnly=no schemaValid=no expired=no)
  access-token : ABSENT (present=no readable=no aclOwnerOnly=no schemaValid=no expired=no)
```

Exit code 6 here is **correct and expected** — it means "not provisioned", not "broken". Only
`PRESENT_OK` for both carriers yields exit 0.

If instead you see `platformAdmissible=no`, you are not on Windows (or not running under the intended
account). If you see `locationAdmissible=no`, the carrier directory resolves inside a Git working
tree — choose a directory outside any checkout with `--carrier-directory` and stop and re-read D-1.

---

## 4. Step 1 — Obtain the client ID and access token from Dhan

This step happens in Dhan's own systems, **outside** IPD. No IPD component participates, observes it,
or can reproduce it.

Dhan's documented workflow for an individual trader (vendor-owned; labels may change — confirm on the
portal and treat the portal, not this document, as authoritative):

1. Sign in to Dhan's web platform at **`web.dhan.co`** in a browser on the governed host.
2. Open **My Profile** and navigate to the **Access DhanHQ APIs** section.
3. **Generate the Access Token** there. Dhan issues it with **24-hour validity**; the response also
   carries the expiry timestamp. An optional Postback URL may be offered — it is not used by IPD and
   can be left empty.
4. Copy the **Client ID** shown for the account and the **Access Token** just generated.

Dhan documents the same account values in its API authentication reference: the access token is a
JWT valid for 24 hours from generation, and the client ID is the account's own identifier
(`dhanhq.co/docs/v2/authentication`, *Authentication → Access for Individual Traders*). Dhan also
offers API-key/consent and TOTP-based token generation; **those routes are out of scope here** —
automated acquisition is deferred by the roadmap and must not be introduced by an operator runaround.

**Handle the two values as bearer secrets from the moment they exist:**

- Do **not** paste them into PowerShell, a command line, an environment variable, a `.env` file, a
  chat window, a ticket, a screenshot or a text file. The utility never accepts them that way, and
  nothing in this procedure asks you to.
- Prefer the interactive prompt (§5, §6): you type the value; it is not echoed, and it never enters
  PSReadLine history.
- Clear the clipboard once both carriers are provisioned (or immediately if you copied to a
  clipboard manager that persists history).
- Record only the **expiry timestamp** and the **fingerprint** the utility prints. Both are safe;
  neither is the secret.

---

## 5. Step 2 — Provision the client ID

The client ID is stable and has no expiry of its own. Provision it **once**; replace it only if the
account changes.

```powershell
npm run dhan:credential -- provision client-id
```

At the prompt, type the client ID (input hidden), press Enter, then type it again to confirm. Expected
on success, exit code **0**:

```
[ipd-dhan-credential] provision client-id: OK
  secretId     : dhan-vault-dhan-client-id
  version      : v1
  fingerprint  : sha256:xxxxxxxxxxxx
  createdAtUtc : 2026-11-12T06:30:00.000Z
  rotatedAtUtc : 2026-11-12T06:30:00.000Z
  replaced     : no
  aclRewritten : no
  roundTrip    : verified before swap
  location     : withheld
```

What this output already proves: the value was encrypted under **your** user profile, written beside
the old carrier and read back, decrypted and compared to what you typed, and only then swapped into
place. `roundTrip: verified before swap` is that proof. `location: withheld` is deliberate — the
utility never prints a path or a `vault://` reference.

`--version` defaults to `v1`; only change it if the SecretRef version in the daemon configuration is
changed to match, because the backend refuses a version mismatch.

---

## 6. Step 3 — Provision the access token **with its expiry**

The token is the 24-hour secret. Provision it with the expiry the vendor gave you. Two equivalent
forms — use exactly one:

```powershell
# A: the expiry timestamp Dhan reported (ISO-8601 UTC)
npm run dhan:credential -- provision access-token --expires-at 2026-11-13T06:30:00.000Z

# B: a duration from now, when you provisioned immediately after generating
npm run dhan:credential -- provision access-token --expires-in-hours 24
```

At the prompt, paste the token (hidden) and repeat to confirm. Expected, exit code **0**:

```
[ipd-dhan-credential] provision access-token: OK
  secretId     : dhan-vault-dhan-access-token
  version      : v1
  fingerprint  : sha256:yyyyyyyyyyyy
  createdAtUtc : 2026-11-12T06:30:00.000Z
  rotatedAtUtc : 2026-11-12T06:30:00.000Z
  expiresAtUtc : 2026-11-13T06:30:00.000Z
  replaced     : no
  aclRewritten : no
  roundTrip    : verified before swap
  location     : withheld
```

Notes on behaviour that matter:

- An **already-expired** expiry is refused (`EXPIRY_INVALID`, exit 3). The store will not hold a
  credential that is dead on arrival.
- A **client id with an expiry** is refused (`EXPIRY_INVALID`): only the token has a lifecycle.
- The expiry is stored **inside the envelope**, so from then on the backend itself refuses the
  credential once it passes — independently of any daemon configuration.
- `provision` refuses to overwrite an existing carrier (`ALREADY_PROVISIONED`, exit 7). Replacing a
  secret is `rotate`, on purpose — see §9.

---

## 7. Step 4 — Verify both credentials

```powershell
npm run dhan:credential -- verify
```

Expected, exit code **0** only when both carriers are confirmed:

```
[ipd-dhan-credential] verify: platformAdmissible=yes locationAdmissible=yes
  client-id    : PRESENT_OK (present=yes readable=yes aclOwnerOnly=yes schemaValid=yes expired=no version=v1)
  access-token : PRESENT_OK (present=yes readable=yes aclOwnerOnly=yes schemaValid=yes expired=no version=v1 expiresAtUtc=2026-11-13T06:30:00.000Z)
```

`verify` decides each carrier through the **same read path the daemon uses**, so it cannot drift from
what a quote request will experience. It reports presence, readability, DACL conformity, schema
validity, identity, version and expiry — and no content and no location.

| Status | Meaning | Safe next action |
| --- | --- | --- |
| `PRESENT_OK` | usable now | continue |
| `ABSENT` | that carrier was never provisioned (or the directory is wrong) | `provision` that role |
| `ACL_NOT_OWNER_ONLY` | another principal can read the carrier | stop; re-run the write so the owner-only DACL is applied, or fix the directory ACL; do not use it |
| `SCHEMA_INVALID` | corrupt carrier or unknown schema version | stop; do not hand-edit; re-provision (see §10) |
| `SECRET_ID_MISMATCH` | the carrier belongs to the other secret | stop; the files were mixed up — re-provision the correct role |
| `EXPIRED` | the envelope expiry has passed | `rotate` with a freshly generated token (§9) |
| `UNREADABLE` | present but DPAPI cannot decrypt it for this account | wrong account or damaged carrier; re-provision as the intended account |
| `UNAVAILABLE` | platform or location inadmissible | fix the environment; nothing was verified |

Machine-readable form, if you are filing evidence:

```powershell
npm run dhan:credential -- verify --json
```

---

## 8. Step 5 — Point the daemon at the store (pre-W-06 configuration)

This is configuration, not provisioning. It contains **no secret**: the values below are governed
identifiers, and every secret stays in the store.

| Variable | Value for the DPAPI store |
| --- | --- |
| `IIPS_DHAN_VAULT_BACKEND` | `windows-dpapi` (default is `disabled`, which keeps egress off) |
| `IIPS_DHAN_VAULT_PROVIDER` | `WINDOWS_DPAPI` |
| `IIPS_DHAN_CLIENT_ID_SECRET_PATH` | `vault://dhan/client-id` |
| `IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH` | `vault://dhan/access-token` |
| `IIPS_DHAN_SECRET_VERSION` | `v1` (must equal the envelope version you stamped) |
| `IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT` | the same expiry you provisioned (pre-flight guard) |
| `IIPS_MARKET_DATA_TRANSPORT_TOKEN` | a local transport token for the loopback daemon (not a Dhan secret) |
| `IIPS_DHAN_SECRET_STATUS` | omit, or `ACTIVE`; `EXPIRED`/`REVOKED` force the pre-flight refusal |

Start the daemon:

```powershell
npm run start:market-data-daemon
```

Read the startup line it prints. On a correctly provisioned host it must show:

```
[ipd-market-data-daemon] listening on http://127.0.0.1:8791 (providerReadiness=CREDENTIAL_REFERENCES_CONFIGURED, vaultBackend=WINDOWS_DPAPI_USER_SCOPE, vaultBackendSelector=windows-dpapi, vaultBackendReadiness=READY, liveCredentialResolution=true, credentialReadiness=CONFIGURED, providerState=CREDENTIALS_RESOLVED, vendorEgress=IPD_SERVER_HTTPS, qualifiedMappings=<n>)
```

How to read it (D-7 vocabulary, no interpretation needed):

- `vaultBackendReadiness=READY` — the awaited probe of **your local store** succeeded at startup.
- `providerState=CREDENTIALS_RESOLVED` — the ceiling for a process that has not called the vendor.
  `AUTHENTICATED`/`OPERATIONAL` cannot appear here, and if you ever see them without a vendor call,
  treat it as a defect.
- `vendorEgress=IPD_SERVER_HTTPS` — vendor egress is *permitted*, not *proven*.
- `CREDENTIALS_UNAVAILABLE` or `CREDENTIALS_EXPIRED` in `credentialReadiness` means the store or the
  configuration is wrong: go back to §7, not forward to W-06.

If `vaultBackendReadiness=NOT_READY`, the daemon refuses to enable egress and stays on
`DISABLED_PRE_ACCESS` — fail-closed by design. Fix the store; do not look for a flag to bypass it.

---

## 9. Token lifecycle and the replacement routine

Dhan issues the access token with **24-hour validity**. IPD does not renew it, and cannot: no token
call exists in either repository by decision (B-7), and automated acquisition is deferred.

**Lifecycle rule.** Treat the token as valid from issue until its `expiresAt` and no longer. Replace
it **before** expiry. A lapsed token stops all market data until it is replaced, and replacement is
the only recovery — there is no grace period, no refresh, and no cached fallback.

**Routine (do this every 24 hours, or before a session):**

1. Generate a new token in Dhan's console (§4). The old one is superseded.
2. Replace **only the token** — the client id does not rotate:

   ```powershell
   npm run dhan:credential -- rotate access-token --expires-at <iso-utc>
   ```

   Exit 0 with `replaced: yes`, a **new fingerprint**, the **same** `createdAtUtc` and the new
   `rotatedAtUtc`. The creation time is preserved on purpose: it records when this secret was first
   installed, not when it was last replaced.
3. Verify: `npm run dhan:credential -- verify access-token` → `PRESENT_OK`, exit 0.
4. Update `IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT` to the new expiry, then restart the daemon. Leaving the
   old timestamp is the single most common operator error: the daemon will report
   `CREDENTIALS_EXPIRED` and make **no vendor call** at all, because that check is a local pre-flight.
5. Record the new fingerprint and expiry in the run log (§12) — never the token.

**Replacing the client id** (account change or suspected exposure) is the same shape:

```powershell
npm run dhan:credential -- rotate client-id
```

**If you provisioned the wrong value** and no valid carrier exists yet, `rotate` still works (it
replaces whatever is there). If the carrier is unreadable, corrupt or belongs to another account, use
the recovery path in §10 rather than editing files.

Change the `--version` only together with `IIPS_DHAN_SECRET_VERSION`; a mismatch is refused by the
backend as a version error, by design.

---

## 10. Failure handling, recovery and safe retry

### 10.1 Utility exit codes

| Exit | Code shown | Meaning | Safe action |
| --- | --- | --- | --- |
| 0 | — | done | continue |
| 2 | usage text | the command or an option was refused (a secret on the command line is refused here) | fix the command; nothing was written |
| 3 | `SECRET_INVALID` / `VERSION_INVALID` / `EXPIRY_INVALID` / `ROLE_INVALID` | the input was refused before any encryption | re-paste carefully; check for stray spaces, a truncated copy, or a pasted newline |
| 4 | `NOT_WINDOWS` / `CARRIER_DIRECTORY_INVALID` | environment inadmissible | use the Windows host; choose a directory outside any Git tree |
| 5 | `DPAPI_PROTECT_FAILED` / `ACL_FAILED` / `ROUND_TRIP_FAILED` / `WRITE_FAILED` | the write did not complete | **the previous carrier is still authoritative**; fix the cause and retry the same command |
| 6 | verification not `PRESENT_OK` | the store is not usable as configured | see the status table in §7 |
| 7 | `ALREADY_PROVISIONED` / `NOT_PROVISIONED` | wrong subcommand for the observed state | `rotate` to replace, `provision` to install |

### 10.2 Recovery rules

- **Never hand-edit, copy, rename or delete a carrier file.** The envelope, the DACL and the
  ciphertext are one artefact; a hand-made carrier fails closed at best, and a copied one is a
  security incident.
- **Interrupted write is already safe.** If the utility is killed mid-run, the previous carrier
  remains valid and authoritative. Re-run the same command. A leftover `*.tmp` beside the carriers is
  inert: it is never selected, never trusted and does not block the next rotation; leave it for
  inspection and remove it only when you are satisfied it is not evidence.
- **Unreadable / corrupt / wrong-account carrier:** there is no in-place repair, by design. If a
  valid carrier cannot be read, that is a security-relevant condition: stop, capture the `verify`
  output (it contains no secret), decide whether the account or the store changed, and only then
  re-provision. If the carrier may have been exposed to another principal, treat the Dhan token as
  compromised, generate a new one in the console, and report it.
- **Repeated `ROUND_TRIP_FAILED`:** DPAPI is not returning the value that was submitted. Do not retry
  in a loop; stop and escalate with the exit code and the environment, not the value.
- **Retry discipline:** a failed write may be retried immediately (the store is unchanged). A failed
  *authentication* is different — see below.

### 10.3 Daemon-side failures and the W-06 boundary

| Symptom | Determination | What it means | Recovery |
| --- | --- | --- | --- |
| `credentialReadiness=CREDENTIALS_EXPIRED` / `providerState=EXPIRED` | **local pre-flight, no vendor call** | the configured expiry has passed | `rotate access-token`, update the expiry variable, restart |
| `credentialReadiness=CREDENTIALS_UNAVAILABLE` | local | a SecretRef is missing or a carrier is not readable | §7, then §8 |
| `vendorEgress=DISABLED_PRE_ACCESS` with `liveCredentialResolution=false` | local | the backend is not ready | fix the store; there is no override |
| `AUTHENTICATION_FAILURE` after a request | **vendor** | the credentials are present but Dhan rejected them (401/403) | one bounded re-read is already attempted by design (D-2); after that the daemon latches and does **no further re-reads**. Generate a new token, `rotate`, restart |
| `RATE_LIMITED` | vendor | request pressure | back off; not a credential problem |

`CREDENTIALS_EXPIRED` and `AUTHENTICATION_FAILURE` are **not** the same thing and must not be treated
as interchangeable: the first is a local determination that never touches the network, the second is
Dhan's own verdict. Retrying an expired token can never succeed, which is why no retry budget exists
for it.

---

## 11. Security precautions

- **Terminal history.** Never type or paste a secret into a PowerShell command line, a here-string, a
  variable assignment or a `-ArgumentList`: all of those are recorded in PSReadLine history. Use the
  utility's hidden prompt (typed interactively, not echoed) or pipe from a source you will delete.
  Do not build one-liners that place the value in the command.
- **Clipboard.** Copy from the browser, paste into the hidden prompt, then clear the clipboard. If a
  clipboard manager keeps history, clear that too. Never paste into a chat, ticket, note, screenshot,
  `.env` file, `.ps1` file, `.json` file or terminal.
- **Process arguments.** No IPD command accepts a secret on the command line; the utility refuses
  `--secret`, `--value`, `--token`, `--client-id`, `--access-token` and any unknown option, and does
  not echo the refused token. If you find yourself needing one of those flags, the procedure is being
  used wrongly.
- **Logs and transcripts.** Start-Transcript, `Tee-Object`, `Out-File` and shell redirection record
  everything they see. The utility prints no secret and no location, but a transcript also records
  your *typing* — so do not run these commands under a transcript, and do not capture the prompt.
- **Output hygiene.** Provisioning prints a truncated `sha256:` fingerprint (48 bits) and metadata
  only. It never prints the value, a `vault://` reference or a carrier path; `location: withheld` is
  literal. `verify` likewise reports state, not content.
- **Where the secret lives.** Two carrier files under `H:\IIPS\runtime\dhan-secrets` —
  `dhan-client-id.carrier.json` and `dhan-access-token.carrier.json` — each DPAPI-encrypted to your
  Windows user profile, each with an owner-only DACL (owner + SYSTEM).
  **Threat model, stated plainly:** user-scope DPAPI protects the carrier **at rest** — against other
  accounts on this host and against a copy taken to another machine or profile. It does **not**
  protect against code running as *you* (including any process that can run the utility), against an
  administrator who can act as you, against a memory dump or debugger while a value is held, or
  against keystroke capture while you type it.
- **What this document must never contain.** No token, no client id, no ciphertext, no fingerprint of
  a real value, no screenshot of the console. A fingerprint recorded in a run log is acceptable only
  because it is truncated and one-way; treat even that as evidence, not as a convenience.
- **If a secret is exposed** (pasted, logged, screen-shared, copied to another host): treat it as
  compromised. Generate a new token in Dhan's console immediately, `rotate access-token`, restart the
  daemon, and record the exposure and the replacement — not the value.

---

## 12. Evidence to record (and what stays out of the record)

For the rehearsal (D-6 exit criterion) and for W-06, record:

- date/time (UTC), operator, Windows account used, host, repository branch and commit;
- the **commands** run (the command lines contain no secret by construction);
- exit codes, and the utility output with the fingerprint and envelope metadata;
- the `verify` output for both roles;
- the daemon startup line (selector, backend id, readiness, egress mode, credential-readiness code,
  provider state);
- token **expiry** timestamp and the rotation time.

Never record: the token, the client id, a ciphertext, a `vault://` value, a carrier path from a
running system, or a screenshot of the console while a secret is on screen.

---

## 13. Command reference (checked against the implementation)

Every command below is the shipped surface of `npm run dhan:credential`
(`src/providers/dhan/dhan_credential_store_cli.ts` → `dist/src/providers/dhan/dhan_credential_store_cli.js`).

| Command | Writes | Exit codes it can return |
| --- | --- | --- |
| `npm run dhan:credential -- verify [client-id\|access-token\|all]` | nothing (read-only) | 0, 4→6 (see §10.1), 2 |
| `npm run dhan:credential -- provision client-id` | creates the client-id carrier; refuses if one exists | 0, 3, 4, 5, 7, 2 |
| `npm run dhan:credential -- provision access-token --expires-at <iso>` (or `--expires-in-hours <n>`) | creates the token carrier | 0, 3, 4, 5, 7, 2 |
| `npm run dhan:credential -- rotate client-id` | replaces the client-id carrier atomically | 0, 3, 4, 5, 7, 2 |
| `npm run dhan:credential -- rotate access-token --expires-at <iso>` | replaces the token carrier atomically | 0, 3, 4, 5, 7, 2 |
| `npm run dhan:credential -- --help` | nothing | 0 |

Recurring options: `--carrier-directory <dir>`, `--version <tag>`, `--expires-at <iso-utc>`,
`--expires-in-hours <n>`, `--json`. `--expires-at` and `--expires-in-hours` are mutually exclusive, and
both apply only to `provision`/`rotate` of the access token.

A documentation-conformance test (`tests/dhan_d6_operator_procedure_conformance.test.ts`) fails if this
document drifts from the implementation: the subcommands, options, exit codes, carrier directory and
filenames, environment keys, verification statuses and failure codes quoted above are all compared
against the shipped code, and the document is checked for anything that looks like a real credential.

---

## 14. Rehearsal (D-6 exit criterion) and the route to W-06

D-6 closes when this procedure has been **documented and rehearsed once with a throwaway value** —
exactly as written here, on the governed host, with a synthetic string in place of each real secret.
The rehearsal proves the mechanics: hidden prompt, atomic write, round-trip proof, `verify`,
`rotate`, expiry refusal and the failure messages. It cannot prove vendor acceptance, because it
never calls the vendor.

**W-06 (not started, and not authorised by this document) is the next step**, and its prerequisites
are:

1. W-03 (backend selection and honest diagnostics) — **published**;
2. W-04 (this utility) — **published**;
3. **D-6 (this procedure) — documented and rehearsed**;
4. the operator's real Dhan client id and a freshly generated 24-hour token, provisioned per §5–§6;
5. a loopback daemon started with the §8 configuration, showing `providerState=CREDENTIALS_RESOLVED`
   and `vendorEgress=IPD_SERVER_HTTPS`;
6. **one** controlled authenticated request, recorded with the startup line, the credential-resolution
   outcome, the request outcome and HTTP status class, and a full grep of all captured output for both
   secret values and any location string.

W-06 closes milestone **M1 only**. It does not qualify quotes, history or freshness, and it does not
authorise any subsequent live activity.
