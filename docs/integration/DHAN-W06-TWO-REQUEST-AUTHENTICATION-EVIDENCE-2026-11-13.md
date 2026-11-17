# DHAN W-06 — Two-Request Authentication Attempt: EXECUTION BLOCKED (2026-11-13)

**Outcome: BLOCKED — ZERO of the two authorized vendor requests were made.**
**Reason: the required execution environment (the operator's Windows host with its DPAPI-provisioned
credentials) is not reachable from this session, and the alternative — a stand-in environment — is
explicitly prohibited.**

**Starting HEAD:** `a624d06f66c376f03a29571cb24c3f0f77f0c24d` (see §2 — did not match the expected
`9d8c920`; investigated and reconciled without content loss).
**Final HEAD:** `9d8c9209c1b8c6ad91ea653bc46ecfb4466c1b63` (== remote).
**Authorization status:** the two-request authorization granted for this work item is **UNSPENT** and
**EXPIRES WITH THIS ATTEMPT** (operator statement). No request was made under it.

---

## 1. Summary

| Item | Result |
| --- | --- |
| Branch verified | ✅ `arena/84d1e063-iips-production-market-data` |
| HEAD verified | ⚠️ was `a624d06` (expected `9d8c920`) — investigated, reconciled by content, §2 |
| Working tree clean at attempt start | ⚠️ was dirty (59 entries) — all byte-identical to `9d8c920`, §2 |
| Correction A (vendor status diagnostic) present | ✅ |
| Correction B (strict UTC expiry) present | ✅ |
| Daemon started on the operator's Windows laptop | ❌ **NOT POSSIBLE** |
| Local readiness confirmed | ❌ **NOT POSSIBLE** |
| Request 1 issued | ❌ **NOT ISSUED** |
| Request 2 issued | ❌ **NOT ISSUED** |
| Evidence captured | none — no request existed to capture |
| **Vendor authentication outcome** | **UNKNOWN — not observed, not inferred** |
| **M1 achieved** | **NO** — unchanged |
| **W-06** | **OPEN** — unchanged |

**This is a blocked execution, not a failed authentication.** Nothing here says anything about whether
the Dhan credentials are valid. The decisive point: no vendor request was made, so there is no vendor
status to classify, and the classification table in the work item has no rows to fill.

---

## 2. Repository reconciliation (required by the work item's discrepancy clause)

The work item instructed: *"If the branch or HEAD differs, investigate and report the discrepancy
before making changes. Do not reset, overwrite or discard unrelated work."* Both of those instructions
were followed, and both conditions applied.

### 2.1 What was found

| Observation | Detail |
| --- | --- |
| Branch | `arena/84d1e063-iips-production-market-data` — **as expected** |
| HEAD | `a624d06…` — **NOT** the expected `9d8c920…` |
| Reflog | Only two entries: `clone` → `checkout … to arena/84d1e063-…`. No commit was lost. |
| Remote branch | `9d8c920…` — **as expected**; the published work was intact |
| Working tree | **59 dirty entries**: 18 modified tracked files + 41 untracked paths |
| `git cat-file 9d8c920` | Absent locally until `git fetch` |
| Platform | Linux 6.1, `process.platform === 'linux'` |

The session workspace had been re-provisioned at the branch's base commit, with the full contents of
`9d8c920` — including this branch's committed work — left present on disk but **untracked/unstaged**.
That is why `docs/integration/DHAN-W06-AUTHENTICATION-*.md`, `dhan_utc_timestamp.ts` and the W-06 test
suites were all present as untracked files while `HEAD` sat at the base.

### 2.2 How it was validated before any pointer moved

Nothing was reset, discarded or overwritten. The reconciliation was proven content-identical first:

- **Every one of the 59 dirty paths was byte-identical to its `9d8c920` blob** — 0 differences,
  0 files in `9d8c920` missing locally (exhaustive recursive comparison, including the untracked
  `windows-acceptance/` directory).
- A SHA-256 manifest of all 61 affected files was taken **before** the pointer move.
- `git merge --ff-only 9d8c920` was attempted first and **correctly refused** ("untracked working tree
  files would be overwritten") — no changes were made by the attempt.
- With byte-identity established, the pointer was moved with `git reset --mixed 9d8c920`. No working-tree
  file was touched (`--mixed` never writes files).
- The manifest was re-taken **after**: **61/61 files identical — no content lost.**
- Result: `HEAD = 9d8c920`, tree clean, local == remote.

No force-push, no history rewrite, no `--hard`, no branch change. The published history was already
intact; only this checkout's pointer was out of date.

---

## 3. Corrections verified present (step 2)

| Correction | Evidence |
| --- | --- |
| A — `vendorHttpStatus` diagnostic | `dhan_market_data_http.ts` contains 10 `vendorHttpStatus` occurrences (writer, allowlist, reader, docs) |
| B — strict UTC expiry | `dhan_utc_timestamp.ts` present (7,043 bytes); `parseStrictUtcTimestamp` used in `dhan_config.ts` (2), `dhan_api_client.ts` (3), `dhan_local_vault_resolver.ts` (3) |
| Test coverage | `tests/dhan_w06_auth_diagnostics.test.ts`, `tests/dhan_w06_expiry_strict_utc.test.ts` present |

Both corrections are exactly as published in
`DHAN-W06-AUTHENTICATION-DIAGNOSTICS-AND-EXPIRY-CORRECTIONS-2026-11-13.md`. Step 2 **PASSED**.

---

## 4. Why the requests could not be executed (steps 3–9)

Step 3 requires: *"Start the daemon **on the operator's Windows laptop** using the existing DPAPI
backend and current credentials."* Step 9 of the restrictions forbids the obvious workaround: *"Do not
use synthetic credentials or a cloud environment as a substitute for the operator's local DPAPI
credentials."*

### 4.1 The environment is Linux, and the backend refuses by construction

Direct probe of the production backend on this host (non-vendor; reads no carrier, decrypts nothing):

```text
WindowsDpapiHostVaultBackend.describeReadiness()
{
  "backendId": "WINDOWS_DPAPI_USER_SCOPE",
  "liveResolutionSupported": false,
  "prerequisiteSummary": "Windows DPAPI is only available on the Windows platform;
                          live credential resolution is disabled."
}
```

Enforced at `dhan_dpapi_vault_backend.ts:182` (`if (this.platform() !== 'win32') → unready`). This is
not a misconfiguration to work around; it is the backend correctly refusing.

### 4.2 The operator's credentials are not present here, and could not be used here

| Requirement | Status on this host |
| --- | --- |
| Windows platform (`process.platform === 'win32'`) | ❌ `linux` |
| Carrier directory (e.g. `C:\IIPS\…\dhan-secrets`) | ❌ absent; no `C:\` or `/mnt/c` |
| DPAPI `CryptUnprotectData` | ❌ unavailable off-Windows |
| PowerShell / Windows tooling | ❌ none installed |

DPAPI protection is **user-scope** (`WINDOWS_DPAPI_USER_SCOPE`): the ciphertext is bound to the
operator's Windows user profile and cannot be decrypted by any other machine or account. So this is
not merely "a file that is missing here" — the material is cryptographically unusable outside that
profile.

### 4.3 Every alternative is prohibited

| Candidate route | Why it is not permitted |
| --- | --- |
| Run the daemon here with DPAPI | Off-Windows; backend refuses; no carriers |
| `windows-latest` CI runner (`stage4-evidence-collector.yml`) | A **cloud environment** (explicitly prohibited) *and* still cannot decrypt user-scope DPAPI from another machine |
| Synthetic or mocked credentials | Explicitly prohibited — and would not be an authentication request at all |
| Ask the operator to paste a token or carrier here | Prohibited: no plaintext credentials, no request to paste secrets |
| Copy DPAPI carriers into this sandbox | Prohibited (would modify/expose vault contents) and cryptographically useless anyway |

There is no path to steps 3–9 that does not violate a stated restriction. The work item's own clause
governs: *"If a genuine blocker prevents publication, report exact evidence and clearly identify
unpublished work."*

---

## 5. What this attempt therefore records

| Work-item field | Value |
| --- | --- |
| Request 1 — timestamp | **not made** |
| Request 1 — elapsed | **n/a** |
| Request 1 — daemon HTTP status | **n/a** |
| Request 1 — `vendorHttpStatus` | **n/a** |
| Request 1 — provider error code | **n/a** |
| Request 1 — dispatch outcome | **NOT DISPATCHED** (blocked before the daemon could start) |
| Request 2 — all fields | **n/a — not made** (correctly: request 2 depends on request 1) |
| Automatic retries | **n/a** — no request exists to retry |
| Daemon start/stop | **not started** |

Per the work item's classification scheme, both requests classify as **"no qualifying vendor
response"** — but that label describes an attempt that reached the network and returned nothing. These
attempts never left the host, so the honest statement is simpler and stronger: **there was no vendor
interaction of any kind.**

**No inference about the credentials is drawn.** Local daemon health, `CREDENTIALS_RESOLVED`, DPAPI
`READY` and any local HTTP status remain, as always, incapable of testifying to vendor authentication —
and none were even obtained here.

---

## 6. Safety confirmation

| Prohibition | Status |
| --- | --- |
| HTTP request to Dhan or any vendor | **none — zero requests** |
| Quote, history or freshness request | **none** |
| Third authentication request | **n/a** (zero made) |
| Credential rotation or modification | **none** |
| DPAPI or ACL changes | **none** — no carrier read, no carrier written |
| Secret values / authorization headers / vendor bodies in logs or evidence | **none** |
| Synthetic credentials or cloud environment as a substitute | **none used** — refused as prohibited |
| PR #156 merged or status changed | **no** — still OPEN / MERGEABLE / UNMERGED |
| IRR or other repository written | **no** |
| Unrelated work discarded | **no** — reconciled by content identity, 61/61 files verified intact (§2) |

The one environment change made was installing dependencies and compiling (`npm ci`, `tsc`) so the
readiness probe could run; `node_modules/` and `dist/` are ignored build artefacts and neither is
committed. The probe itself made no network call and read no secret.

---

## 7. Status of W-06 and M1

| Item | Status |
| --- | --- |
| **M1** | **NOT ACHIEVED** — no vendor request was made, so no authentication outcome exists |
| **W-06** | **OPEN** |
| Corrections A and B | published at `9d8c920`, unchanged by this attempt |
| Two-request authorization | **UNSPENT**, expires with this attempt per the operator |

Nothing about the credentials has been learned. The `401` vs `403` question that the whole diagnostic
correction was built to answer **remains unanswered**, and now cannot be answered under this
authorization.

---

## 8. What is required to actually execute

The execution must happen in an environment that satisfies all of:

1. **The operator's Windows laptop**, under the operator's own Windows user profile (DPAPI user scope).
2. The repo at `9d8c920` (or later), with the two corrections present — §3 confirms they are.
3. The existing DPAPI carriers in place and unmodified.
4. `IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT` carrying an explicit `Z` or numeric offset — **this is now a hard
   startup requirement** (correction B). A zone-less value will stop the daemon with
   `CONFIGURATION_INCOMPLETE` naming the variable. That is the correction working, but it will look
   like a new fault if it is not expected.
5. Automatic retries disabled, and exactly two independent requests issued sequentially.
6. Fresh operator authorization — the current one is spent.

The procedure and interpretation matrix are already specified in
`DHAN-W06-AUTHENTICATION-FAILURE-INVESTIGATION-2026-11-13.md` §11: a `vendorHttpStatus` of `401` means
the token is invalid/expired at Dhan, `403` means the pair or entitlement is refused, and an auth
failure carrying **no** vendor status means the instrumentation failed and must be fixed before any
further request. That matrix is the entire reason correction A was built; it is ready and waiting for
a host that can use it.

---

## 9. Safety footer

Zero HTTP requests were made to Dhan or any vendor endpoint. No quote, history or freshness request was
made. No credential was read, printed, rotated or modified. No DPAPI carrier, ACL or vault content was
read or written. No secret value, authorization header or vendor response body appears in this record.
No synthetic credential or cloud environment was substituted. PR #156 was not merged and its status did
not change. `HEAD` is `9d8c920`, identical to the published remote, with no content lost during the
reconciliation.
**W-06 remains OPEN. M1 remains NOT ACHIEVED. No vendor authentication outcome was observed or inferred.**
