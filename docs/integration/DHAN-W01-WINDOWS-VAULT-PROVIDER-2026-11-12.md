# DHAN W-01 — Windows `VaultProvider` and the Two-Key-Path Convention

**Status:** IMPLEMENTED — provider admission and key-path convention only
**Work item:** W-01 (roadmap v1.1)
**Decision:** D-1 — Windows secret-store selection and `SecretRef` provider admission
**Implementation repository:** `ramkivs/iips-production-market-data`
**Roadmap authority:** `ramkivs/iips-review-recovered` → `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` (v1.1), PR #560, merge commit `07808f6ed7fc2c7897af2040b0c385eb78e554d7`
**Date:** 2026-11-12

> No credential value exists in this work item. No Dhan call was made, no Windows DPAPI API was
> invoked, no carrier was created or read, and no vault was provisioned. W-01 admits a value
> *shape*; it does not resolve a secret.

---

## 1. What W-01 had to produce

From the roadmap:

| Requirement | Source | Implemented |
| --- | --- | --- |
| One new member on the `VaultProvider` union | W-01 scope | ✅ `WINDOWS_DPAPI` |
| The same member in the validation array | W-01 scope | ✅ `VAULT_PROVIDERS` (single source of truth) |
| Extend the P03 test's accepted-provider set | W-01 scope | ✅ `WSA-P03` case P03-04 |
| Two-key-path convention: one path per secret, never one path for both | W-01 scope / D-1 | ✅ governing constants + structural validation + Dhan pair rule |
| Purely additive; no existing provider changes behaviour | W-01 scope | ✅ regression case W-01-08 + pre-W-01 behaviour pinned in W-01-04 |
| `dhan_d1_provider_foundation` still green | W-01 verification | ✅ |

## 2. D-1 as rendered

| Element | Value |
| --- | --- |
| Store | **Windows DPAPI, user scope** (D-1 recommended option; Credential Manager and a native addon rejected) |
| Carrier model | **Two separate carriers, never one blob** — `dhan-client-id` (stable) and `dhan-access-token` (24-hour) |
| **Admitted `VaultProvider` member** | **`WINDOWS_DPAPI`** |
| **Client id key path** | **`vault://dhan/client-id`** |
| **Access token key path** | **`vault://dhan/access-token`** |

The provider member and both key paths were selected by the Program Authority for this work item
(2026-11-12) and are recorded here as the convention W-02 and W-04 must implement against.

**At-rest-only limitation (carried from D-1, not a W-01 property):** DPAPI user scope protects the
secret at rest against other users, offline disk inspection and file copying. It does **not**
protect against another process running as the same Windows user. Nothing in this work item may be
read as claiming otherwise.

## 3. Governance units

`src/security/secret_ref.ts` now exports:

| Symbol | Purpose |
| --- | --- |
| `VaultProvider` (extended) | `… \| 'TEST_ENCLAVE' \| 'WINDOWS_DPAPI'` |
| `VAULT_PROVIDERS` | The admitted set, used directly by `validateSecretRef` — a provider cannot be documented without being validated |
| `WINDOWS_DPAPI_VAULT_PROVIDER` | The admitted member as a value (`'WINDOWS_DPAPI'`) |
| `DHAN_CLIENT_ID_SECRET_NAME` / `DHAN_ACCESS_TOKEN_SECRET_NAME` | `'client-id'` / `'access-token'` |
| `DHAN_CLIENT_ID_KEY_PATH` / `DHAN_ACCESS_TOKEN_KEY_PATH` | `vault://dhan/client-id` / `vault://dhan/access-token` |
| `DHAN_SECRET_KEY_PATHS` | The pair, addressable by role |
| `parseVaultKeyPath` | Structural parse of `vault://<scope…>/<secret>` |
| `validateDhanSecretKeyPaths` | The D-1 pair rule |

### 3.1 Validation rules

`validateSecretRef` — for `WINDOWS_DPAPI` only, in addition to the existing P03 checks:

* the `keyPath` must parse as `vault://<scope…>/<secret>` and identify **exactly one** secret;
* rejected: a bare namespace (`vault://dhan`), empty segments (`vault://dhan/`, `vault:///client-id`,
  `vault://dhan//access-token`), query strings, fragments, whitespace-padded segments, and anything
  not using the `vault://` scheme.

Existing providers are untouched: they still only require the `vault://` scheme, so a bare
namespace or a single-segment path remains valid for them exactly as before (W-01-04).

`validateDhanSecretKeyPaths` (used by Dhan configuration when `IIPS_DHAN_VAULT_PROVIDER=WINDOWS_DPAPI`):

1. both paths must be governed `vault://` paths identifying exactly one secret;
2. the client path must name `client-id`, the token path must name `access-token` (roles are not
   interchangeable — a swapped pair is refused);
3. the two paths must be **distinct** — one path may never address both secrets.

Deeper scopes (`vault://dhan/local-nonprod/access-token`) parse successfully as long as the final
segment names the secret, so a per-environment scope remains expressible without reintroducing a
shared path.

Error strings are generic and never echo the offending path.

## 4. Changed files

| File | Change |
| --- | --- |
| `src/security/secret_ref.ts` | `WINDOWS_DPAPI` admitted; `VAULT_PROVIDERS`; key-path constants; `parseVaultKeyPath`; `validateDhanSecretKeyPaths`; Windows key-path rule in `validateSecretRef` |
| `src/providers/dhan/dhan_config.ts` | Enforces the two-key-path convention when the Windows provider is selected; fails closed as `CONFIGURATION_INCOMPLETE` without emitting references |
| `tests/wsa_p03_secret_ref.test.ts` | P03-04: accepted-provider set, both governed paths, unknown provider rejected |
| `tests/dhan_w01_windows_vault_provider.test.ts` | New W-01-01…W-01-08 suite |

No public package export surface changed (`./dhan-server`, `./portfolio-ui`, `./pit`,
`./d114-non-production`, `./operator-drop`); `verify-public-package` reports no new forbidden hits.

## 5. Tests

| Case | Proves |
| --- | --- |
| W-01-01 | `WINDOWS_DPAPI` admitted exactly once; a `SecretRef` carrying it validates; unknown providers (including near-miss spellings) still rejected |
| W-01-02 | Both governed paths are distinct, role-specific, non-locating, and parse correctly |
| W-01-03 | Invalid Windows references rejected (shared/namespace-only/malformed/non-vault), plus missing version/status |
| W-01-04 | Non-Windows providers keep their pre-W-01 behaviour |
| W-01-05 | Pair validator accepts the governed pair; refuses shared, swapped, ambiguous and non-vault paths; errors do not echo the path |
| W-01-06 | Dhan configuration resolves `WINDOWS_DPAPI` pair to `CREDENTIAL_REFERENCES_CONFIGURED`, refs carry pointers only |
| W-01-07 | Dhan configuration fails closed (`CONFIGURATION_INCOMPLETE`) for shared/malformed/swapped paths, with no references emitted |
| W-01-08 | Existing `LOCAL_MOCK_VAULT` configuration and the `CREDENTIALS_UNAVAILABLE` pre-access state are unchanged |
| P03-04 | The P03 accepted-provider set includes the new member and every admitted provider validates |

Full suite: **1496 tests executed / 1495 passed / 0 failed / 1 pre-existing skip**
(baseline before the change: 1487 / 1486 / 0 / 1). `tsc` (all four project files), `vite build`,
and `verify-public-package` (strict typecheck **PASS**) are green.

## 6. Explicitly out of scope for W-01

Windows DPAPI invocation, carrier files, the versioned envelope (`schemaVersion`, `rotatedAtUtc`,
`expiresAtUtc`), the DACL requirement, `WindowsDpapiHostVaultBackend`, the backend selector,
credential-read posture and the provisioning utility. `DisabledWindowsHostVaultBackend` remains the
default and was not modified — live credential resolution is still disabled.

## 7. Dependency handed to W-02

W-02 may now construct `SecretRef`s with `vaultProvider: 'WINDOWS_DPAPI'` and
`keyPath: DHAN_CLIENT_ID_KEY_PATH` / `DHAN_ACCESS_TOKEN_KEY_PATH`; they validate without further
changes. W-02 still owes the parts of D-1 that W-01 deliberately did not implement:

1. the **carrier specification** — file names/locations under a local runtime directory outside Git,
   and the versioned envelope with `schemaVersion`, `secretId`, `vaultProvider`, `version`,
   `createdAtUtc`, `rotatedAtUtc`, `expiresAtUtc` (token only) plus the DPAPI ciphertext blob;
2. the **DACL requirement** (inheritance disabled; owner + SYSTEM only) and the rule that a carrier
   readable by another principal is unusable;
3. the **atomicity rule** (write-beside, verify by read-back, then swap);
4. `WindowsDpapiHostVaultBackend` with `liveResolutionSupported` gated on both carriers existing,
   passing the DACL check, parsing against a known `schemaVersion`, and a probe read — plus the
   per-failure `reason` taxonomy, stdin/stdout-only child-process communication, and scrubbed errors;
5. `secretId` and `version` values that must agree between the emitted `SecretRef` and the carrier
   envelope — the mapping from `vault://dhan/client-id` to a carrier is W-02's to define and must
   not collapse the two paths onto one carrier.

W-04 then owns the interactive provisioning/rotation utility, and W-03 the allow-listed backend
selector (`IIPS_DHAN_VAULT_BACKEND=disabled/windows-dpapi`, default `disabled`).
