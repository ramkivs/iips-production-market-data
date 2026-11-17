# DHAN W-03 — Daemon Backend Selection and Honest Egress Diagnostics

**Status:** IMPLEMENTED — allow-listed backend selector, awaited readiness probe, D-7-aligned diagnostics
**Work item:** W-03 (roadmap v1.1)
**Decisions consumed:** D-7 (provider state model and diagnostics disclosure policy); W-02 backend contract
**Implementation repository:** `ramkivs/iips-production-market-data`
**Roadmap authority:** `ramkivs/iips-review-recovered` → `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` (v1.1)
**Date:** 2026-11-12

> No Dhan credential exists in this work item. No Dhan call was made, no real DPAPI call was made in
> the authoring environment (Linux), and no carrier was provisioned. Every value used by the tests is
> a synthetic fixture created and discarded by the test process. Nothing here claims live Dhan
> connectivity or production readiness: startup makes no vendor call at all.

---

## 1. Problem this work item closes

Two honesty defects, neither of which produced a crash, so neither was visible in any suite:

1. **No selection.** The daemon composed one hard-coded backend. `WindowsDpapiHostVaultBackend` was
   fully implemented and fully unreachable from the launcher: an operator who provisioned carriers
   had no governed way to have them used.
2. **A synchronous readiness verdict.** Startup read `describeBackendReadiness()`. For a backend that
   requires an I/O probe, that verdict is `liveResolutionSupported: false` **by design** until the
   probe has run. Startup never awaited the probe, so a correctly provisioned Windows host would have
   reported "not ready" forever and stayed at `DISABLED_PRE_ACCESS` with no error anywhere.

Both are fixed by deciding the backend explicitly, and by awaiting evidence before reporting anything.

## 2. Backend selector (governed vocabulary)

| Selector | Backend composed | Vendor egress |
| --- | --- | --- |
| `disabled` (**default**) | `DisabledWindowsHostVaultBackend` | always `DISABLED_PRE_ACCESS` |
| `windows-dpapi` | `WindowsDpapiHostVaultBackend` | `IPD_SERVER_HTTPS` **only** if the awaited probe reports supported **and** configuration resolved |

Variable: `IIPS_DHAN_VAULT_BACKEND` (`DHAN_VAULT_BACKEND_ENV`). Rules, all fail-closed:

- Absent, empty or whitespace → `disabled`. An unset or blank variable can never select a live store.
- Matching is exact and case-sensitive (`Disabled`, `WINDOWS-DPAPI`, `dpapi`, `windows_dpapi` are all
  **refused**). It is an allow-list, not a fuzzy parse.
- An unrecognised value refuses startup at phase `validate` with code `VAULT_BACKEND_NOT_ALLOWED`,
  **before** configuration resolution, vault construction or any socket. The offending value is
  never echoed — a mistyped selector is not permitted to reach a log.
- The selector is owned by exactly one source file. A repository-wide check (`D7-08`) fails if any
  other `src/` file names the variable, so a second, unaudited egress path cannot appear quietly.
- An explicitly injected backend (`options.vaultBackend`) still wins: the documented test seam for
  W-02/W-03 verification. It cannot weaken the selector check, which runs first regardless.

No new environment variable was introduced for the carrier directory: `vaultCarrierDirectory` is a
constructor/option seam only, defaulting to W-02's `DPAPI_CANONICAL_CARRIER_DIRECTORY`. Inventing a
second operational variable is a decision, and W-03 holds no authority to make one.

## 3. Startup sequencing (the ordering is the guarantee)

```
1 argv refused          2 production refused     3 SELECTOR validated (VAULT_BACKEND_NOT_ALLOWED)
4 host/port validated   5 transport token        6 config resolved (SecretRefs only)
7 backend composed from selector → AWAIT probeReadiness() → egress decided → service/server
8 bind + post-listen loopback verification → diagnostics published
```

The probe runs **before** the egress decision and before any diagnostic value exists, so nothing can
be published from the synchronous verdict. Concretely:

- `resolver.probeBackendReadiness()` is new on `LocalHostVaultDhanCredentialResolver`. It awaits the
  backend's `probeReadiness()` when present, and otherwise returns the Stage-1 synchronous verdict
  unchanged — so `DisabledWindowsHostVaultBackend` and every existing synthetic backend behave
  exactly as before.
- A probe that throws yields `NOT_READY` with a fixed summary. A readiness probe failure is a
  readiness verdict, **not** a startup failure: the daemon still starts, stays on loopback, and keeps
  vendor egress disabled. The thrown text is never republished.
- A probe that reports "not ready" **wins** over a synchronous "ready": evidence outranks the stale
  field in both directions.
- `vendorEgressMode` remains derived from `readiness && cfgResolution.ok`, so W-02's rule that
  readiness alone never authorizes egress is preserved.

## 4. Diagnostics and the D-7 state

`MarketDataDaemonDiagnostics` keeps every existing field and adds five facts, each of which an
operator needs and none of which locates a secret:

| Field | Meaning |
| --- | --- |
| `vaultBackendSelector` | which selector is in force (`disabled` / `windows-dpapi`) |
| `vaultBackendId` | the composed backend's own identifier (existing field) |
| `vaultBackendReadiness` | `READY` / `NOT_READY` — **local store** readiness, from the awaited probe |
| `vaultBackendReadinessDetail` | the backend's fixed, non-locating summary — **sanitised**: a summary that names a `vault://` reference, a carrier directory or a drive path is replaced wholesale with a withheld-notice, so the seam cannot become a disclosure channel |
| `credentialReadinessCode` | `CONFIGURED` / `CREDENTIALS_UNAVAILABLE` / `CREDENTIALS_EXPIRED` |
| `providerState` | the D-7 state, derived from local evidence only |
| `vendorEgressMode` | unchanged (`DISABLED_PRE_ACCESS` / `IPD_SERVER_HTTPS` / `SYNTHETIC_INJECTED`) |

`formatDaemonStartupLine` emits the same facts in one operator-safe line; the pre-existing
`vaultBackend=`, `liveCredentialResolution=` and `vendorEgress=` substrings are unchanged.

**Local readiness is not vendor connectivity.** `liveProviderConnectivity` stays
`NOT_CHECKED_PRE_ACCESS` and `providerQualification` stays `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED`
because startup makes no vendor call. The D-7 ceiling follows: startup can reach
`CREDENTIALS_RESOLVED` at most and can never assert `AUTHENTICATED` or `OPERATIONAL`.

`deriveDhanProviderState()` (new `dhan_provider_state.ts`) is the single derivation, in fail-closed
order: unusable evidence → `UNAVAILABLE`; no configuration → `UNCONFIGURED`; expired material →
`EXPIRED`; vendor-observed outcomes only when the store is supported; otherwise
`CREDENTIALS_RESOLVED` or `CONFIGURED`. Contradictions resolve **down**, never up.

## 5. Disclosure policy applied (D-7 §4.2)

`describeDhanConfig()` no longer publishes the access-token or client-id key path. IRR had been
copying those `vault://` references into its health report; W-03 stops the disclosure at the source.
It now reports `clientIdRefConfigured` / `accessTokenRefConfigured` (`YES`/`NO`) and the admitted
`vaultProvider`, both of which are on the D-7 MAY list and neither of which locates anything.

Verified absent from every surface (startup line, structured diagnostics, config summary, startup
refusal messages): `vault://` references, filesystem or carrier paths, DPAPI ciphertext, child-process
output, environment dumps, transport tokens, resolved credential values and SecretRef leaf names.

## 6. Acceptance mapping

| # | Criterion | Where it is proven |
| --- | --- | --- |
| 1 | unknown selector refuses startup | W-03-01/02/03/21 |
| 2 | `disabled` default reports `DISABLED_PRE_ACCESS` | W-03-04/05 |
| 3 | `windows-dpapi` + fake backend reports `IPD_SERVER_HTTPS` | W-03-06 |
| 4 | startup awaits `probeReadiness()` before publishing readiness or enabling egress | W-03-08 (gated probe), 06, 09, 10, 11 |
| 5 | diagnostics/startup carry the five new fields | W-03-12 |
| 6 | no `vault://`, paths, credentials or secrets in output | W-03-13, 13b, 14; D1-02; S1 admission |
| 7 | `describeDhanConfig` publishes no key paths | W-03-14; DHAN-D1-02; S1-01/02/09 |
| 8 | W-02 security/fail-closed/non-exposure intact | W-03-07/10/19/20; W-02 suites 34 pass |
| 9 | targeted regression tests for selector, sequencing, state mapping, sanitised diagnostics | `tests/dhan_w03_backend_selection_and_diagnostics.test.ts` (21) |

Negative controls were run to prove the assertions bite, then reverted: reading the synchronous
verdict fails W-03-06/08/09/10; silently defaulting an unknown selector fails W-03-01/02/03/21;
republishing a key path fails W-03-14, DHAN-D1-02, S1-01/02/09 and D7-08; bypassing the readiness
detail sanitiser fails W-03-13b.

## 7. What W-03 does not do

- It makes no vendor call and does not qualify anything live (E4 is untouched; W-07 onward).
- It does not provision, rotate or read a carrier; Windows DPAPI execution was **not** run here. The
  W-02 operator evidence remains the only Windows-host evidence, and it is unchanged.
- It adds no new operational variable beyond the selector and re-decides nothing in D-7.
- It does not widen the public package: the launcher, the selector and the state module stay out of
  `./dhan-server` and out of the browser closure (verified by the package-boundary scan).

## 8. Next roadmap activity

`W-04` — the next item on the roadmap v1.1 critical path
(`D-1 → D-2 → W-01 → W-02 → W-03 → W-04 → D-6 → W-06`). Not started, and not authorized by this
record.
