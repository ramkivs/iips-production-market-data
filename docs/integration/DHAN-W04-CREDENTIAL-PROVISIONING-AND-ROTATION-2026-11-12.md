# DHAN W-04 — Credential Provisioning, Rotation and Verification Utility

**Status:** IMPLEMENTED — DPAPI `protect` in the shipped tree, round-trip-proven atomic provisioning, independent per-secret rotation, non-disclosing verification
**Work item:** W-04 (roadmap v1.1)
**Decisions consumed:** D-1 (store, carriers, envelope, DACL, atomicity), D-2 (read posture — unchanged here)
**Depends on:** W-01 (two-key-path convention), W-02 (carrier grammar, DACL, atomic writer, backend), W-03 (daemon selection — not modified)
**Implementation repository:** `ramkivs/iips-production-market-data`
**Roadmap authority:** `ramkivs/iips-review-recovered` → `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` (v1.1)
**Date:** 2026-11-12

> No Dhan credential exists in this work item. No real DPAPI call was made in the authoring
> environment (Linux), no carrier was provisioned on a host, and no vendor call was made. Every
> value used by the tests is a synthetic fixture created and discarded by the test process. Nothing
> here claims live connectivity, and no Windows result is reported.

---

## 1. What the roadmap asked for, and where it landed

| W-04 requirement (roadmap verbatim intent) | Implementation |
| --- | --- |
| A local script that accepts a secret **interactively or on stdin** — never argv, never a history-bearing pipe | `dhan_credential_store_cli.ts`: hidden prompt (echo off, entered twice) when stdin is a TTY, stdin read otherwise; `--secret`/`--value`/`--token`/`--client-id`/`--access-token` are refused and the refused token is **not** echoed |
| DPAPI-protect it into the D-1 carrier with the full metadata envelope | `protect` program added to `dhan_dpapi_process.ts` (static, `-EncodedCommand`, payload on stdin only); envelope built with schemaVersion, secretId, provider, version, created/rotated, token expiry |
| **Re-read to prove the round trip before replacing anything** | `verifyBeside` decrypts the beside-carrier and compares it to the input (digest comparison) **before** the swap; no swap can publish unproven bytes |
| Only a non-reversible fingerprint (algorithm tag + truncated digest) plus envelope metadata | `fingerprintCredentialValue()` → `sha256:<12 hex>`; report carries version, created/rotated, expiry, `replaced`, `directoryAclRewritten`; never the value |
| Atomic replace per D-1: write-beside, verify, swap; on any failure the previous carrier remains authoritative | W-02's `writeDpapiCarrierAtomically` composed unchanged, with W-04's proof injected as its `verify` hook |
| Independent subcommands per secret | `provision <client-id\|access-token>`, `rotate <client-id\|access-token>`; one carrier each, never a shared blob |
| `--verify` reports presence, readability, DACL conformity, schema validity, expiry — **without** content or location | `verifyDhanCredentialStore()` decides each carrier through the production read path (`WindowsDpapiHostVaultBackend.readSecret`); the report has no path and no key path |
| No network, no cloud | No network import in either module; nothing is fetched, uploaded or synchronized |

`provision` refuses to overwrite an existing carrier and `rotate` refuses to create one, so
"installing" and "replacing" can never be confused — and the atomic-replace path is always the one
that runs when something is already installed.

## 2. Files

| File | Change |
| --- | --- |
| `src/providers/dhan/dhan_credential_store_utility.ts` **(new)** | Provisioning/rotation/verification core: validation, `protect` call, envelope assembly, round-trip proof, typed failures, verification report |
| `src/providers/dhan/dhan_credential_store_cli.ts` **(new)** | Operator surface: argument allow-list, hidden/piped secret acquisition, rendering, exit codes |
| `src/providers/dhan/dhan_dpapi_process.ts` (+34) | `protect` program added to the static child-process boundary (W-04 owns it; the W-02 acceptance harness keeps its own copy so its evidence stays reproducible) |
| `src/providers/dhan/index.ts` (+1) | server-side barrel export of the utility |
| `scripts/verify-public-package.mjs` (+3) | browser-closure guard extended with the W-04 symbols (and the W-03 selector) |
| `package.json` (+1) | `dhan:credential` script |
| `tests/dhan_w04_credential_store_utility.test.ts` **(new, 30 cases)** | Round trip, rotation, interrupted write, validation, boundary, verification, CLI |
| `docs/integration/DHAN-W04-...md` **(this file)** | W-04 record |

Not touched: the daemon, the resolver, `dhan_config.ts`, the D-7 record, the W-02 acceptance
harness and its evidence, and every IRR artefact.

## 3. The two rules that make this safe

**The plaintext crosses exactly one boundary, once, on stdin.** The secret is read from a TTY
without echo or from a pipe; it is handed to the static PowerShell program as `plaintextB64` on
stdin; it never touches argv (the argument vector is six fixed tokens), an environment variable, a
temporary file, a shell string or any log line. The child writes only `ciphertextB64` to stdout and
never echoes its input. Every later `unprotect` receives ciphertext only.

**Nothing becomes authoritative before it is proven.** The beside-file is written with the
owner-only DACL applied **before** content, read back, parsed, decrypted and compared to the input.
Only then is it renamed over the carrier. On any failure — a validation refusal, an ACL refusal, a
protect failure, a mismatched round trip, or a process death between proof and swap — the previous
carrier is byte-identical and still decrypts, and the beside-file is removed.

## 4. Failure taxonomy (all typed, all non-echoing)

| Code | Meaning | Exit |
| --- | --- | --- |
| `SECRET_INVALID` | empty, whitespace-only, padded, control-bearing, or outside the governed length bounds | 3 |
| `VERSION_INVALID` / `EXPIRY_INVALID` / `ROLE_INVALID` | metadata refused; a client id takes no expiry; an expiry must be strict ISO-8601 UTC and in the future | 3 |
| `NOT_WINDOWS` / `CARRIER_DIRECTORY_INVALID` | platform or location inadmissible (a Git working tree is never a store) | 4 |
| `DPAPI_PROTECT_FAILED` | the child could not protect; no carrier was written | 5 |
| `ACL_FAILED` | the owner-only policy could not be applied or verified | 5 |
| `ROUND_TRIP_FAILED` | the beside-carrier did not decrypt back to the input | 5 |
| `WRITE_FAILED` | write/swap failure; the previous carrier remains authoritative | 5 |
| `ALREADY_PROVISIONED` / `NOT_PROVISIONED` | wrong subcommand for the observed state | 7 |
| verification not `PRESENT_OK` | per-carrier status: `ABSENT`, `ACL_NOT_OWNER_ONLY`, `SCHEMA_INVALID`, `SECRET_ID_MISMATCH`, `EXPIRED`, `UNREADABLE`, `UNAVAILABLE` | 6 |

No message contains the value, a `vault://` reference, a carrier path or child-process text. The
child's stderr is captured as a byte count only, so it can classify a failure and can never be
surfaced.

## 5. Interrupted rotation and recovery

| Scenario | Behaviour |
| --- | --- |
| Crash between write and swap | previous carrier byte-identical and readable; no beside-file left by this implementation; the next `rotate` succeeds |
| Round trip mismatched | `ROUND_TRIP_FAILED`, carrier untouched |
| Stale `.tmp` from a `kill -9` during an earlier attempt | never selected, never trusted, does not affect reads or `verify`; survives on disk for the operator to inspect, and the next rotation succeeds |
| Previous envelope unreadable | rotation starts a fresh `createdAtUtc` rather than inventing history; `rotatedAtUtc` is always now |

## 6. Threat model, stated rather than assumed

DPAPI **user scope** protects a carrier at rest. It defends against: another account on the same
host reading the file; a copy of the carrier taken to another machine or user profile; casual
inspection of the disk. The owner-only DACL narrows the at-rest window further.

It does **not** defend against: code running as the same user (which can unprotect it — and this
utility is exactly such code, which is why the plaintext lifetime is one function call); an
administrator who can act as that user; a memory dump or debugger attached while the secret is
held; keystroke capture at the moment the secret is typed; or a secret that is already compromised
at the vendor. The fingerprint is a confirmation aid, not a security control: it is truncated to
48 bits precisely so it cannot serve as an offline oracle.

## 7. Acceptance mapping and verification results

| Criterion (roadmap W-04 Verification) | Test | Result |
| --- | --- | --- |
| Synthetic round trip | W-04-01/02 (provision → production backend read) | pass |
| Missing carrier | W-04-19 (`ABSENT`), W-04-07 | pass |
| Corrupt carrier | W-04-20 (`SCHEMA_INVALID`, unknown schema version) | pass |
| Wrong-user carrier | W-04-21 (`UNREADABLE`) | pass |
| Interrupted write (crash between write and swap) | W-04-08 (+ 09, 10) | pass |
| Expired envelope | W-04-22 (`EXPIRED` before and after the 24h mark) | pass |
| Grep of output, transcript and any log for the value | W-04-16/25/27/29 (reports, CLI stdout/stderr, JSON, carrier bytes) | pass |
| Secret never on argv / env / temp file | W-04-15/16 | pass |
| Independent subcommands per secret | W-04-06/07 | pass |

Additionally: W-04-04 (fingerprint properties), W-04-05 (secretId convention pinned against the
refs the daemon resolves), W-04-11/12/13/14 (input, metadata, environment, ACL refusals),
W-04-17/18 (protect failure, transport framing), W-04-23/24 (secret-id mismatch, inadmissible
environment), W-04-26/28/30 (interactive confirm, exit-code taxonomy, help and defaults).

**Test totals.** W-04 suite **30/30**. Regression across W-02/W-03/D-7/D-1/S1 and the acceptance
harness: **95 passed, 0 failed, 1 skipped** (the Windows-only skip that predates this work).

**Negative controls** (each applied, observed, reverted): bypassing the round-trip proof fails
W-04-08/09/16; neutering secret validation fails W-04-11/28; putting anything on the `protect`
argv fails W-04-15; adding a carrier path to the verification report fails W-04-19/22/29.

## 8. Build and structural validation

- `tsc` clean; full build (`vite build` + the three package builds) succeeds.
- `scripts/verify-public-package.mjs`: overall PASS, browser closure PASS, 0 FAIL — the utility,
  the CLI, `WindowsDpapiHostVaultBackend`, `createPowerShellDpapiProcessRunner` and
  `IIPS_DHAN_VAULT_BACKEND` are all absent from the browser bundle and from `./dhan-server`.
- Script validators unchanged and green: `windows-setup` **310 pass / 0 fail**,
  `windows-acceptance` **43 pass / 0 fail** (no PowerShell was modified).

## 9. What W-04 does not do

- It does not run on Windows here, produce a Windows result, or claim one. The W-02 operator
  evidence remains the only Windows-host evidence and is unchanged.
- It does not acquire a Dhan token (D-6, manual, out of scope), does not call the vendor, and does
  not change the daemon's egress decision, D-7 provider states or any diagnostics field.
- It does not implement W-05's session holder or bounded re-read, and does not touch the runbook
  (W-15/W-36).

## 10. Next roadmap activity

`D-6` — the operator procedure step that follows W-04 on the critical path
(`D-1 → D-2 → W-01 → W-02 → W-03 → W-04 → D-6 → W-06`), then W-06. Neither is started, and this
record authorizes neither.
