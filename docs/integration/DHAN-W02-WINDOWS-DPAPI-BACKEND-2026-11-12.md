# DHAN W-02 — Windows DPAPI Secret-Store Backend

**Status:** IMPLEMENTED — backend, carrier grammar, DACL gate, atomic replacement and failure taxonomy
**Work item:** W-02 (roadmap v1.1)
**Decisions:** D-1 (store, carriers, envelope, DACL, atomicity) and D-2 (read posture — consumed, not re-decided here)
**Implementation repository:** `ramkivs/iips-production-market-data`
**Roadmap authority:** `ramkivs/iips-review-recovered` → `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` (v1.1), PR #560, merge `07808f6ed7fc2c7897af2040b0c385eb78e554d7`
**Date:** 2026-11-12

> No Dhan credential exists in this work item. No Dhan call was made, no real DPAPI call was made
> in the authoring environment (Linux), and no live carrier was provisioned. Every value used by
> the tests is a synthetic fixture created and discarded by the test process.

---

## 1. Decisions recorded for this work item

D-1 itself leaves two implementation slots open (exact carrier paths, and the engine that performs
the OS call). Both were resolved by the Program Authority on 2026-11-12 and are implemented here:

| Item | Rendered value |
| --- | --- |
| Store | **Windows DPAPI, user scope** (`DataProtectionScope::CurrentUser`) |
| Carrier directory | **`H:\IIPS\runtime\dhan-secrets\`** (established runtime root, outside both Git trees) |
| Client id carrier | **`dhan-client-id.carrier.json`** |
| Access token carrier | **`dhan-access-token.carrier.json`** |
| Key paths (W-01) | `vault://dhan/client-id` · `vault://dhan/access-token` |
| DPAPI engine | **PowerShell child process** with `[System.Security.Cryptography.ProtectedData]`; no native addon, no new dependency |

The directory remains a constructor option — W-03 threads it through configuration; the constant
`DPAPI_CANONICAL_CARRIER_DIRECTORY` is the default and the name W-03/W-04 use.

## 2. Carrier envelope (D-1)

Exactly the D-1 fields; no extras.

| Field | Rule |
| --- | --- |
| `schemaVersion` | integer; **`1`** is the known version. Unknown → refused, never guessed |
| `secretId` | must equal `SecretRef.secretId`, else `SECRET_ID_MISMATCH` |
| `vaultProvider` | must equal `SecretRef.vaultProvider` (`WINDOWS_DPAPI`), else corrupt |
| `version` | must equal `SecretRef.version`, else `VERSION_MISMATCH` |
| `createdAtUtc` | strict ISO-8601 UTC |
| `rotatedAtUtc` | strict ISO-8601 UTC; not before `createdAtUtc`; not >5 min in the future |
| `expiresAtUtc` | strict ISO-8601 UTC; **token only** — present on the client id carrier is a corrupt carrier |
| `ciphertext` | non-empty base64 of the DPAPI blob |

Serialisation is canonical: two-space indent, fixed key order, one trailing LF, optional field
omitted rather than written as `null`.

**Carrier mapping.** A reference's final `vault://` segment selects the carrier
(`client-id` → client carrier, `access-token` → token carrier). Any other secret name selects
nothing and fails as `INVALID_SECRET_REF`; the two paths therefore can never collapse onto one
carrier. Both governed paths remain addressable at deeper scopes (`vault://dhan/local-nonprod/…`)
without changing which carrier they reach.

## 3. Access restriction (D-1 DACL)

A carrier is usable only when **all** of the following hold for the carrier **and** its directory:

* inheritance disabled (`AreAccessRulesProtected`);
* every allowed ACE is the current user's SID or `S-1-5-18` (SYSTEM);
* the owner is the current user.

The check runs through the child process (`Get-Acl`), returns evidence only, and a permissive
carrier is refused as `CARRIER_PRINCIPAL_MISMATCH` **before** any decryption is attempted.

## 4. Atomicity (D-1)

`writeDpapiCarrierAtomically()` implements write-beside → apply owner-only DACL → verify by
read-back → swap:

1. the envelope is validated **before** any filesystem write (an invalid envelope never reaches disk);
2. the directory is created and its DACL applied;
3. a beside-file is created empty in the same directory (so the DACL is applied before content),
   then written;
4. the beside-file is re-read and verified (default: parse; W-04 supplies a full DPAPI round trip);
5. only then is it renamed over the target.

On any failure the beside-file is removed and the **previous carrier remains authoritative**.
Nothing is ever repaired in place: a carrier that fails validation is reported as invalid and left
untouched. A carrier location inside a Git working tree is refused (`LOCATION`).

## 5. Readiness gating

`probeReadiness(ref?)` returns `liveResolutionSupported: true` **only** when:

1. the platform is Windows;
2. the carrier directory is outside any Git working tree;
3. both carriers exist;
4. the directory and both carriers satisfy the owner-only DACL;
5. both envelopes parse against a known `schemaVersion`;
6. the requested carrier (or both, when no ref is given) decrypts in a probe read.

Every failure yields `false` plus a **non-locating** summary (no path, no secret id, no child text).

`describeReadiness()` — the synchronous Stage-1 shape — reports the last probed verdict and stays
`false` until a probe has run in that instance, so it can never claim live resolution optimistically.
`LocalHostVaultDhanCredentialResolver` now awaits `probeReadiness()` when a backend provides it;
`DisabledWindowsHostVaultBackend` does not, so its behaviour is byte-for-byte unchanged.

## 6. Failure taxonomy (distinct, scrubbed)

| Reason | Mapped code | Meaning |
| --- | --- | --- |
| `CARRIER_MISSING` | `CREDENTIALS_UNAVAILABLE` | carrier file absent |
| `CARRIER_UNREADABLE` | `CREDENTIALS_UNAVAILABLE` | present but unreadable, or DPAPI refused the blob |
| `CARRIER_PRINCIPAL_MISMATCH` | `CREDENTIALS_UNAVAILABLE` | DACL not owner-only / wrong owner / inheritance on |
| `CARRIER_CORRUPT` | `CONFIGURATION_INCOMPLETE` | not JSON, bad metadata, bad base64, wrong provider, expiry on the client carrier |
| `UNKNOWN_SCHEMA_VERSION` | `CONFIGURATION_INCOMPLETE` | schema version is not one this build knows |
| `SECRET_ID_MISMATCH` | `CONFIGURATION_INCOMPLETE` | carrier belongs to another secret |
| `VERSION_MISMATCH` | `CREDENTIALS_UNAVAILABLE` | envelope version ≠ `SecretRef.version` |
| `CARRIER_LOCATION_INVALID` | `CONFIGURATION_INCOMPLETE` | carrier directory inside a Git working tree |
| `EXPIRED` | `CREDENTIALS_EXPIRED` | `expiresAtUtc` passed — decided locally, no vendor call |
| `CHILD_PROCESS_FAILURE` | `CREDENTIALS_UNAVAILABLE` | spawn failed, non-zero exit, timeout, empty/overflowing/invalid stdout |
| `INVALID_SECRET_REF` | `CONFIGURATION_INCOMPLETE` | not a Windows DPAPI ref naming a governed secret |
| `BACKEND_FAILURE` | `CREDENTIALS_UNAVAILABLE` | unexpected internal failure, still fail-closed |

Messages are fixed strings. None contains a path, a value, a secret id or child output.

## 7. Child-process protocol

* static PowerShell program, delivered with `-EncodedCommand`; it contains no data;
* request JSON on **stdin**; result JSON on **stdout**; nothing on argv, no temporary file, no shell;
* the child never echoes its input, and reports a coarse failure category (`DPAPI_UNPROTECT_FAILED`,
  `ACL_READ_FAILED`) instead of exception text;
* stderr is reduced to a **byte count** at the runner boundary — the outcome object has no field
  that could carry stderr text;
* bound: 15 s timeout, 2 MiB stdout cap; both are classified (`timeout`, `output-overflow`);
* `Add-Type -AssemblyName System.Security` + `ProtectedData` are the only OS surface used.

## 8. In-process handling

The decrypted value exists as a single local binding inside `readSecret`, is returned once in the
ephemeral `LocalHostVaultSecretRecord`, and is never stored on the backend instance, cached, logged,
placed in a diagnostic object or attached to an error. The backend holds only the last readiness
verdict, which carries no secret.

## 9. Changed files

| File | Change |
| --- | --- |
| `src/providers/dhan/dhan_dpapi_carrier.ts` | **new** — locations, envelope grammar, canonical serialisation, structural + `SecretRef` validation, carrier mapping, Git-tree location policy, atomic replacement primitive |
| `src/providers/dhan/dhan_dpapi_process.ts` | **new** — child-process contract, static scripts, PowerShell runner, classified outcomes, stdin/stdout-only protocol |
| `src/providers/dhan/dhan_dpapi_vault_backend.ts` | **new** — `WindowsDpapiHostVaultBackend`: readiness probe, per-read validation, taxonomy mapping |
| `src/providers/dhan/dhan_local_vault_resolver.ts` | failure-reason union extended; optional `probeReadiness()` on the backend contract; resolver prefers it |
| `src/providers/dhan/index.ts` | internal exports for the three new modules (not on `./dhan-server`) |
| `tests/dhan_w02_dpapi_backend.test.ts` | **new** — W-02-01…W-02-12 |
| `tests/fixtures/fake_dpapi_child.mjs` | **new** — protocol stand-in child used by the runner tests |
| `docs/integration/DHAN-W02-WINDOWS-DPAPI-BACKEND-2026-11-12.md` | this record |

`DisabledWindowsHostVaultBackend` is unchanged and remains the default; no daemon default changed.

## 10. Tests

| Case | Proves |
| --- | --- |
| W-02-01 | decrypt path; ciphertext-only payload; no value on argv; script is static and never echoes |
| W-02-02 | carrier separation; path → role mapping; ungoverned secret name refused; wrong provider refused |
| W-02-03 | owner-only DACL: inheritance, extra principal, wrong owner, and a permissive directory |
| W-02-04 | atomic write: beside-file, ACL before content, verify-then-swap, failed verify leaves the previous carrier, invalid envelope never written, Git-tree refusal |
| W-02-05 | missing / unreadable / corrupt / unknown schema / invalid timestamps / bad base64 / expiry on client carrier |
| W-02-06 | `secretId`, `vaultProvider`, `version` and expiry against the `SecretRef`; `EXPIRED` is local pre-flight |
| W-02-07 | every child-process failure mode; no stderr text, no path, no value in any error |
| W-02-08 | readiness gating across platform, location, provisioning, DACL, schema and probe read |
| W-02-09 | resolver uses the probe; disabled backend unchanged; unready backend yields no material |
| W-02-10 | canonical location, filenames, schema version and serialisation are fixed |
| W-02-11 | real spawn: request on stdin, result on stdout, stderr only counted, exit/empty classified |
| W-02-12 | timeout, stdout overflow and missing executable are bounded and classified |

Full suite: **1506 executed / 1505 passed / 0 failed / 1 pre-existing skip** (W-01 baseline:
1496 / 1495 / 0 / 1). `tsc` (all four configs), `vite build` and `verify-public-package` (strict
typecheck PASS, `forbiddenHits: []`) are green.

## 11. Not proven here — Windows-host acceptance item

The roadmap's W-02 verification includes "one real Windows round trip using a generated throwaway
secret". The authoring environment is Linux, so **that round trip has not been executed** and W-02
is not evidence-complete for it. Everything else in the W-02 verification list is covered by
injected-runner and real-child-process tests above.

Procedure to close it (Windows host, no Dhan credential):

1. generate a throwaway value in the test process; never read it from a file or argv;
2. protect it with `ProtectedData.Protect(..., CurrentUser)` in the child process, write the
   envelope through `writeDpapiCarrierAtomically` into `H:\IIPS\runtime\dhan-secrets\`;
3. `readSecret()` the carrier and compare to the generated value;
4. assert the value appears in no argv, no test stdout, no log line and no error object;
5. delete the throwaway carrier and directory.

Until that runs, the backend's real `CryptUnprotectData` behaviour is unproven; the fail-closed
paths are proven.

> **Acceptance script (2026-11-12):** the procedure above is now executable —
> `windows-acceptance/Invoke-W02DpapiAcceptance.ps1` (harness:
> `windows-acceptance/w02_dpapi_acceptance.mjs`). It writes a per-test, timestamped evidence log and
> never records a value, a ciphertext or raw child-process stderr. See
> `docs/integration/DHAN-W02-WINDOWS-ACCEPTANCE-EVIDENCE-2026-11-12.md`. This item stays **PENDING**
> until that log exists from a Windows host.

## 12. Dependency handed to W-03

W-02 deliberately does not add runtime selection. W-03 must:

1. add the allow-listed selector (`IIPS_DHAN_VAULT_BACKEND=disabled/windows-dpapi`, default
   `disabled`) and construct this backend with the configured carrier directory;
2. **await `probeReadiness()` during daemon startup** before reporting backend readiness or enabling
   vendor egress — the daemon currently reads the synchronous `describeBackendReadiness()`, which is
   intentionally `false` until a probe has run;
3. surface backend id / readiness / credential-readiness code without exposing paths (D-7), and
   remove the key-path material currently derived from `describeDhanConfig`.

W-04 then owns the interactive provisioning/rotation utility that composes
`writeDpapiCarrierAtomically` with a real DPAPI round trip. W-05 owns read posture.
