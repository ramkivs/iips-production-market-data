# DHAN D-6 — Windows-Host Credential Rehearsal Evidence (2026-11-12)

**Status:** EVIDENCE RECORD — rehearsal **executed on the governed Windows host** and recorded here.
**Subject:** the D-6 exit criterion of roadmap v1.1 — *procedure documented and rehearsed once with a throwaway value*.
**Procedure:** `docs/integration/DHAN-D6-OPERATOR-TOKEN-ACQUISITION-AND-REPLACEMENT-2026-11-12.md` (authoritative; this file records the run of it, and does not replace it).
**Rehearsed tree:** `ramkivs/iips-production-market-data` @ `2cced8f3a384609fe8389d42a4821508433e9fcb`, branch `arena/84d1e063-iips-production-market-data`.
**Date:** 2026-11-12.
**Host-independent counterpart:** procedure §14.1 (the Arena-emulated mechanical rehearsal). The two records are deliberately separate; see §3.

> **This file contains no credential.** Every value used was a synthetic throwaway string. The
> `sha256:` strings below are the CLI's own truncated output identifiers (12 hex characters of a
> digest), not credentials, not reversible, and not reusable. No Dhan credential was obtained,
> pasted, provisioned or transmitted during this rehearsal, and no vendor request was made.

---

## 1. Purpose and scope

D-6 is closed by a rehearsal, not by an argument. This record preserves what the operator observed on
the governed workstation, checks each observation against the shipped CLI contract, and states exactly
which D-6 claims the evidence supports.

In scope: the credential **lifecycle mechanics** of W-04 on the real host — empty-store verification,
refusal paths, provisioning, verification, rotation, duplicate-provision refusal, cleanup.

Out of scope, and not evidenced anywhere in this file: real Dhan credentials, authenticated vendor
connectivity, W-06, live market data, and production readiness.

---

## 2. Execution environment

| Field | Evidence |
| --- | --- |
| Execution environment | Windows PowerShell |
| Working directory | `H:\IIPS\iips-production-market-data` |
| Repository branch | `arena/84d1e063-iips-production-market-data` |
| Verified D-6 commit | `2cced8f3a384609fe8389d42a4821508433e9fcb` |
| TypeScript CLI build | PASS (the launcher resolved the built CLI, so `dist/` was current for that commit) |
| Rehearsal date | 2026-11-12 |
| Isolated credential directory | `H:\IIPS\runtime\d6-rehearsal-20261112-231202` |
| Credential values | synthetic throwaway values only |
| Real Dhan credentials | **not used** |
| Dhan vendor requests | **none** |
| Final cleanup | PASS — the isolated directory was removed |

The rehearsal directory was created **outside the Git working tree and outside the default carrier
directory** (`H:\IIPS\runtime\dhan-secrets`), and every command carried `--carrier-directory
"$TestDir"`. The default store was therefore never the target of a rehearsal write. The scratch
directory name embeds a local wall-clock stamp (`231202`); the `…Utc` fields in the CLI output are the
authoritative times, and they are consistent with the host's local offset (first recorded write
`17:44:42Z` ≈ 23:14 local). The directory no longer exists, so no post-hoc inspection of it is
possible or claimed.

---

## 3. Two rehearsals, kept distinct

| | Mechanical rehearsal (procedure §14.1) | **Windows-host rehearsal (this file)** |
| --- | --- | --- |
| Where | Arena workspace, Linux container | the governed Windows workstation |
| DPAPI | emulated child (`protect`/`unprotect`/`read-acl`/`apply-acl`/`describe-acl`) | **real** Windows DPAPI, user scope |
| What it can prove | the document and the shipped CLI agree; every documented invocation, exit code, status and failure code is reproduced | the whole procedure works on the host that will run it: real DPAPI round-trip, real DACL, real filesystem, real launcher, real timestamps |
| What it cannot prove | anything about Windows | anything about Dhan (no vendor call was made) |
| Recorded in | procedure §14.1 | this file, §4–§13 |
| Suite | `tests/dhan_d6_operator_procedure_conformance.test.ts` (host-independent) | operator run under PowerShell; the evidence is cross-checked against the same suite's vocabulary in §14 |

Neither rehearsal provisions a real credential, and neither proves vendor acceptance.

---

## 4. Evidence index

| # | Test | Exit code captured | Disposition |
| --- | --- | --- | --- |
| E1 | verify against an empty store | `6` | **PASS** |
| E2 | provision `client-id` with an expiry supplied | not captured | **PASS** (rejection observed; see §6 for exactly what it does and does not evidence) |
| E3 | provision synthetic `client-id` | not captured (`OK` line) | **PASS** |
| E4 | provision synthetic `access-token` with `--expires-at` | not captured (`OK` line) | **PASS** |
| E5 | verify both carriers | `0` | **PASS** |
| E6 | rotate synthetic `access-token` with `--expires-at` | not captured (`OK` line) | **PASS** |
| E7 | verify both carriers after rotation | `0` | **PASS** |
| E8 | provision `client-id` again (duplicate) | `7` | **PASS** |
| E9 | remove the isolated rehearsal store | n/a (confirmation line) | **PASS** |

"Exit code captured" means the operator transcript shows the number. Where it does not, this record
says so and does not infer one; the `OK` lines and the operator's own `PASS:` confirmations are quoted
as what they are.

---

## 5. E1 — empty-store verification

```text
npm.cmd run dhan:credential -- verify --carrier-directory "$TestDir"
```

Observed: both credential roles **absent**; exit code **`6`**; operator confirmation
`PASS: Empty store confirmed.`

Consistent with the implementation: `verify` is read-only and fails closed — with no carriers it
reports both entries `ABSENT` and exits `VERIFY_FAILED` (`6`), never `0`. An empty store is a finding,
not a success, and the procedure's §10 depends on that distinction.

Not captured: the individual status lines of this run.

---

## 6. E2 — client-id provisioning with an expiry supplied

```text
npm.cmd run dhan:credential -- provision client-id --expires-at 2020-01-01T00:00:00.000Z --carrier-directory "$TestDir"
```

Observed: the provisioning was **rejected**; operator confirmation
`PASS: Expired Client ID rejected.` The operator transcript did not capture the failure line or the
exit code.

**What this actually exercises.** The implementation refuses *any* `--expires-at` on the `client-id`
role before it ever looks at the date: the rule is `EXPIRY_INVALID` —
*the client id has no lifecycle of its own and takes no expiry* — returning exit `3`
(`src/providers/dhan/dhan_credential_store_utility.ts`, expiry block). The `2020-01-01` instant is
therefore **not** the deciding factor in this refusal, and this record does not claim it is.

Consequences for the evidence, stated plainly:

- E2 evidences the **role rule** (a client id carries no expiry) on the real host — correctly PASS.
- E2 does **not** independently evidence the past-instant rule for the access token. That rule
  (`EXPIRY_INVALID`, *the expiry is not in the future; an already-expired credential is refused*, exit
  `3`) is exercised host-independently by suite case D6-15 in
  `tests/dhan_d6_operator_procedure_conformance.test.ts`, not by this observation.
- The refusal is raised **after** the secret is read: the CLI shows its hidden credential prompt
  first. Nothing here should be read as "expiry is validated before the operator is asked for the
  value" — the observed prompt is consistent with validation order, and the prompt is exactly why the
  transcript shows no value.

---

## 7. E3 — synthetic client-id provisioning

```text
npm.cmd run dhan:credential -- provision client-id --carrier-directory "$TestDir"
```

Observed output, verbatim:

```text
[ipd-dhan-credential] provision client-id: OK
secretId     : dhan-vault-dhan-client-id
version      : v1
fingerprint  : sha256:d870961faf91
createdAtUtc : 2026-11-12T17:44:42.379Z
rotatedAtUtc : 2026-11-12T17:44:42.379Z
replaced     : no
aclRewritten : yes
roundTrip    : verified before swap
location     : withheld
```

| Observation | Meaning under the implementation |
| --- | --- |
| `secretId dhan-vault-dhan-client-id`, `version v1` | the envelope identity for the `clientId` role at the default version |
| `fingerprint sha256:d870961faf91` | the CLI's truncated digest identifier for the stored value — an identifier, not the value |
| `createdAtUtc` = `rotatedAtUtc` | a first write is a creation: the two stamps coincide |
| `replaced : no` | `provision` never overwrites; nothing existed to replace |
| `aclRewritten : yes` | this was the **first** write in a fresh directory, so the directory DACL was created/restored to owner-only |
| `roundTrip : verified before swap` | the value was protected, read back, unprotected and compared **before** the carrier replaced anything — the W-01/W-02 round-trip proof |
| `location : withheld` | D-7 disclosure: no path, no `vault://` reference, no value |

No expiry line appears, which is correct for the client-id role.

---

## 8. E4 — synthetic access-token provisioning

```text
npm.cmd run dhan:credential -- provision access-token --expires-at $Expiry --carrier-directory "$TestDir"
```

Observed output, verbatim:

```text
[ipd-dhan-credential] provision access-token: OK
secretId     : dhan-vault-dhan-access-token
version      : v1
fingerprint  : sha256:75cc355bf6cf
createdAtUtc : 2026-11-12T17:46:14.471Z
rotatedAtUtc : 2026-11-12T17:46:14.471Z
expiresAtUtc : 2026-11-13T17:45:16.709Z
replaced     : no
aclRewritten : no
roundTrip    : verified before swap
location     : withheld
```

Points that matter:

- The expiry is present and is a **future** instant, which is why the write was accepted.
- `expiresAtUtc` precedes `createdAtUtc` by ~58 s because the operator computed `$Expiry` (now + 24 h)
  **before** the hidden prompt was answered; the recorded instant is still in the future, so the rule
  is satisfied. A 24-hour token is therefore provisioned with slightly less than 24 hours of life
  remaining — the same margin the procedure's §9 replacement routine assumes.
- `aclRewritten : no` — the directory was already owner-only after E3; only the carrier was written.
- `roundTrip : verified before swap`, `location : withheld` — as in E3.

---

## 9. E5 — verification of both carriers (limited record)

```text
npm.cmd run dhan:credential -- verify --carrier-directory "$TestDir"
```

Observed:

```text
VERIFY_EXIT=0
PASS: Both synthetic credentials verified.
```

Consistent with the implementation: `verify` exits `0` only when the platform and location gates are
admissible **and** every entry is `PRESENT_OK`.

**Limitation:** the individual status lines of this run were not supplied in the operator transcript,
so they are **not** reproduced here. The richer per-role output in E7 (same store, later state) shows
the shape that a `PRESENT_OK` verification produces; inventing the intermediate lines would be
fabrication.

---

## 10. E6 — synthetic access-token rotation

```text
npm.cmd run dhan:credential -- rotate access-token --expires-at $NewExpiry --carrier-directory "$TestDir"
```

Observed output, verbatim:

```text
[ipd-dhan-credential] rotate access-token: OK
secretId     : dhan-vault-dhan-access-token
version      : v1
fingerprint  : sha256:c17b225823cf
createdAtUtc : 2026-11-12T17:46:14.471Z
rotatedAtUtc : 2026-11-12T17:48:08.399Z
expiresAtUtc : 2026-11-13T17:47:37.529Z
replaced     : yes
aclRewritten : no
roundTrip    : verified before swap
location     : withheld
```

Verified against the contract:

| Claim | Evidence in the output |
| --- | --- |
| replacement succeeded | `rotate access-token: OK`, `replaced : yes` |
| original creation preserved | `createdAtUtc` unchanged from E4 (`2026-11-12T17:46:14.471Z`) |
| rotation stamp advanced | `rotatedAtUtc` moved from `17:44…/17:46…` to `2026-11-12T17:48:08.399Z` |
| fingerprint changed | `sha256:75cc355bf6cf` → `sha256:c17b225823cf` (new value, new identifier) |
| new expiry recorded | `expiresAtUtc : 2026-11-13T17:47:37.529Z` (again computed before the prompt, still future) |
| round-trip proven before the swap | `roundTrip : verified before swap` |
| no location disclosed | `location : withheld` |

This is the operation the 24-hour lifecycle depends on (§9 of the procedure): replacement is `rotate`,
never `provision`, and rotation preserves the creation identity while advancing the rotation stamp.

---

## 11. E7 — verification after rotation

```text
npm.cmd run dhan:credential -- verify --carrier-directory "$TestDir"
```

Observed output, verbatim:

```text
[ipd-dhan-credential] verify: platformAdmissible=yes locationAdmissible=yes
  client-id    : PRESENT_OK (present=yes readable=yes aclOwnerOnly=yes schemaValid=yes expired=no version=v1)
  access-token : PRESENT_OK (present=yes readable=yes aclOwnerOnly=yes schemaValid=yes expired=no version=v1 expiresAtUtc=2026-11-13T17:47:37.529Z)

VERIFY_EXIT=0
PASS: Credentials verified after rotation.
```

The line shape matches the shipped renderer exactly: the header carries
`platformAdmissible`/`locationAdmissible`, each entry carries `present`, `readable`, `aclOwnerOnly`,
`schemaValid`, `expired`, `version`, and the access token additionally carries its `expiresAtUtc`.
Both carriers are `PRESENT_OK`, so the store is fully resolvable by the daemon — and, per D-7, that is
the `CREDENTIALS_RESOLVED` ceiling: **local resolution, no vendor contact.**

---

## 12. E8 — duplicate-provision refusal

```text
npm.cmd run dhan:credential -- provision client-id --carrier-directory "$TestDir"
```

Observed output, verbatim:

```text
[ipd-dhan-credential] refused [ALREADY_PROVISIONED]: a carrier for this secret already exists; use rotate to replace it
DUPLICATE_PROVISION_EXIT=7
```

Consistent with the implementation: `provision` never overwrites an existing carrier —
`ALREADY_PROVISIONED` maps to `STATE_REFUSED` (exit `7`), and the message names the correct
replacement verb. The refusal protects an installed credential from a silent, accidental overwrite;
replacement is an explicit `rotate` (E6).

---

## 13. E9 — cleanup

The operator removed only the isolated rehearsal directory `H:\IIPS\runtime\d6-rehearsal-20261112-231202`
and confirmed:

```text
PASS: Synthetic rehearsal store removed.
```

The confirmation was produced by a check that the directory no longer exists. Consequences and
limits:

- No carrier from the rehearsal remains on the host, so nothing in this evidence can be re-animated
  into a working credential configuration.
- The rehearsal never wrote to the default store `H:\IIPS\runtime\dhan-secrets`; all commands carried
  `--carrier-directory "$TestDir"`.
- The default store was not inspected during this rehearsal, so this record makes **no** claim about
  its contents. Deleting the scratch directory does not disturb it either way.

---

## 14. Cross-check against the implemented contract

| Observation | Implemented rule it matches | Where |
| --- | --- | --- |
| empty store → exit `6`, roles absent | `VERIFY_FAILED` for anything that is not `PRESENT_OK` | `dhan_credential_store_cli.ts` (`DHAN_CREDENTIAL_EXIT`), `dhan_credential_store_utility.ts` (verification) |
| `client-id` + `--expires-at` → rejection | `EXPIRY_INVALID`: the client id takes no expiry | `dhan_credential_store_utility.ts`, expiry block |
| `provision … : OK` + the ten-line report | `renderProvisionReport` field order and spacing | `dhan_credential_store_cli.ts` |
| `aclRewritten : yes` then `no` | `directoryAclRewritten` is true only when the directory DACL had to be created/restored | `dhan_dpapi_acl.ts`, utility write path |
| `roundTrip : verified before swap` | protect → unprotect → compare before the atomic replace | `dhan_dpapi_carrier.ts`, utility write path |
| `location : withheld` | D-7 disclosure: no path, no reference, no value | `dhan_credential_store_cli.ts` |
| `rotate … replaced : yes`, `createdAtUtc` preserved | rotation keeps the creation identity and advances `rotatedAtUtc` | `dhan_credential_store_utility.ts` |
| duplicate `provision` → `ALREADY_PROVISIONED`, exit `7` | `STATE_REFUSED`; provision never overwrites | `dhan_credential_store_utility.ts`, `dhan_credential_store_cli.ts` |
| `verify` output shape with `platformAdmissible`/`locationAdmissible` | `renderVerificationReport` / `renderVerificationEntry` | `dhan_credential_store_cli.ts` |

Suite case **D6-14** asserts this record's internal consistency (documented commands, exit codes,
statuses, fingerprint shape, the four-way distinction and the absence of credential material);
**D6-15** executes the E2/E8-style refusals and the expiry rules against the real CLI with a synthetic
value, so the rules quoted in §6 and §12 cannot drift from the code.

---

## 15. Evidence limitations (none of these is closed by this record)

1. **No vendor contact.** Zero Dhan requests. Nothing here shows that Dhan accepts any credential, and
   the provider state ceiling reached is `CREDENTIALS_RESOLVED`.
2. **Synthetic values.** The values were throwaway strings, so this rehearsal says nothing about the
   vendor's validation of a real client id or token (length, format, environment binding).
3. **Not a real token lifecycle.** The 24-hour expiry arithmetic was exercised (future instant
   accepted, role rule enforced), but no real token was ever near expiry, so time-driven expiry
   observation of a real token (procedure §9, `EXPIRED` status, the `CREDENTIALS_EXPIRED` pre-flight)
   is **not** evidenced here.
4. **Partial transcripts.** E5's per-role status lines and E2's failure line and exit code were not
   captured; they are not reconstructed. E3/E4/E6 exit codes were not captured explicitly; their `OK`
   lines are quoted as observed.
5. **Deleted store.** The rehearsal directory is gone, so the evidence is the operator's transcript
   plus the contract cross-check in §14; no artifact can be re-inspected.
6. **Single host, single account, single run.** Reproducibility rests on the procedure and the
   host-independent suite, not on repeated on-host runs.
7. **Not production readiness.** No configuration was left installed, no daemon was pointed at a real
   credential, and no operational claim is made.

---

## 16. Security handling of this record

- No credential value, no client id, no token, no ciphertext, no `vault://` reference and no carrier
  path from a live configuration appears in this file.
- The `sha256:` strings are the CLI's truncated digest identifiers (12 hex characters of a digest),
  recorded because they are the only way to evidence that a rotation produced a *different* value.
  They are not secrets and cannot be inverted.
- The rehearsal directory path appears only to evidence isolation and cleanup; it no longer exists and
  is explicitly **not** a usable credential configuration.
- No screenshot of a console holding a secret is included, and the hidden-prompt behaviour is recorded
  as observed rather than circumvented.
- Nothing here authorises a real credential to be written, shared or committed — the procedure's rule
  stands: this documentation must never be edited to contain a real credential.

---

## 17. Acceptance record

| Item | State after this record |
| --- | --- |
| D-6 documentation (roadmap v1.1, lines 182–196) | **complete** — procedure published at `2cced8f` |
| Mechanical rehearsal (host-independent, §14.1 of the procedure) | **complete** — suite D6-01…D6-15 |
| **D-6 exit criterion: "procedure documented and rehearsed once with a throwaway value"** | **SATISFIED** — documented, and rehearsed on the governed Windows host with synthetic values (this file, E1–E9) |
| D-6 verification clause: token value never written to a document or a log | **satisfied** — no value was ever recorded; only truncated identifiers and metadata are preserved |
| Operator's real Dhan credential provisioned | **not performed** (W-06 prerequisite, outstanding) |
| Authenticated vendor connectivity | **not tested** (W-06) |
| W-06 | **not started**, not authorised by this document |
| Production readiness | **not established** |

**D-6 is closed for the rehearsal criterion.** What remains before live data is W-06 — one controlled
authenticated request, with its own prerequisites and its own explicit authorisation, recorded
separately and never inferred from this evidence.
