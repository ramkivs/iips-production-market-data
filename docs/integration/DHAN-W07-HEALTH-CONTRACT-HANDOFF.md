# W-07 — IPD Health Contract and IRR Coordination Handoff

**Status:** Focused, `main`-based IPD W-07 implementation published from `901e4791e271cafdb777d56f9f66f6867b3f60c6` on branch `arena/a2e97767-iips-production-market-data`. Coordinated W-07 remains **PARTIAL** until IRR PR [#567](https://github.com/ramkivs/iips-review-recovered/pull/567) (`arena/4bdc1e8b-iips-review-recovered`, head `2a45f675840be95671c520b66857b4bfde99f1d3`) advances its `iips-production-market-data` pin to the exact published head commit SHA recorded on this IPD PR and completes cross-repository verification. Do not merge either leg or start W-08 on the basis of this record alone.

## Authority and Clean `main` Baseline

- **Starting IPD `main` baseline:** `901e4791e271cafdb777d56f9f66f6867b3f60c6` (`ramkivs/iips-production-market-data`).
- **Publication branch:** `arena/a2e97767-iips-production-market-data` (the exact published IPD PR number and immutable final commit SHA are recorded in the PR description's IRR Handoff block; historical diverged PR #167 is untouched and superseded for W-07).
- **D-7 authority:** D-7 provider state model and diagnostics disclosure policy adopted for IPD (2026-11-12, candidate-line record `bcfa6cbbcaff63a8c55f4d7395c4cbb5d0088d52`) and accepted for IRR via merged IRR PR [#565](https://github.com/ramkivs/iips-review-recovered/pull/565) (`3cc99a1f170cd19771f992160d903f8b8cb9fee3`, `docs/integration/DHAN-D7-IRR-ACCEPTANCE-2026-11-16.md`).

## Governed W-07 Contract (for IRR PR #567 Pin Bump)

- **Package name and version:** `iips-production-market-data@1.0.0` (server subpath `iips-production-market-data/dhan-server`).
- **Exported runtime symbols added on `./dhan-server`:** `DHAN_HEALTH_CONTRACT_VERSION` (`2`), `DHAN_HEALTH_CONTRACT_LEGACY_VERSION` (`1`), `validateDhanServiceHealth`.
- **Exported type symbols added on `./dhan-server`:** `DhanLiveProviderConnectivity`, `DhanProviderQualification`, `DhanHealthContractVersion` (plus widened `ServiceHealth` and `MarketDataTransportHealthOutcome`).

| Field | Accepted / Supported Values | Emitted by IPD in W-07 |
| --- | --- | --- |
| `service` | `'UP'`, `'DOWN'` | `'UP'` when started, `'DOWN'` when stopped |
| `providerConfiguration` | `'CONFIGURED'`, `'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'` | Unchanged (`'CONFIGURED'` or `'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'`) |
| `liveProviderConnectivity` | `'NOT_CHECKED_PRE_ACCESS'` (legacy), `'CONNECTED_LIVE'` | `'NOT_CHECKED_PRE_ACCESS'` only (no live claim prior to W-08) |
| `providerQualification` | `'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED'` (legacy), `'LIVE_QUALIFIED'` | `'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED'` only (no live claim prior to W-08) |
| `contractVersion` | Marker absent (legacy), numeric `1` (legacy), numeric `2` (W-07) | Numeric `2` (`DHAN_HEALTH_CONTRACT_VERSION`) |

### Legacy Compatibility and Fail-Closed Guarantees

1. **Legacy compatibility:** Payloads without `contractVersion` remain parseable; omission is preserved as omission (`!('contractVersion' in result)`, never fabricated). Explicit numeric `1` and `2` are accepted and preserved verbatim.
2. **Independent governed vocabularies:** All four `(liveProviderConnectivity, providerQualification)` value pairs are accepted across `contractVersion` absent, `1`, and `2`, matching IRR PR #567. Accepting a wire value does not infer or claim live provider evidence.
3. **Fail-closed validation:** `validateDhanServiceHealth` and `MarketDataTransportClient.health()` share identical validation logic. Unknown `service`, `providerConfiguration`, `liveProviderConnectivity`, or `providerQualification` values; unsupported `contractVersion` values (e.g. `0`, `3`, `99`, `'1'`, `'2'`, `null`, `1.5`, booleans, objects); non-object or incomplete bodies; and contradictory failure-shaped bodies (`ok !== true` when `ok` is present, or any `error` / `failure` property) are rejected fail-closed (`null` from `validateDhanServiceHealth`; `{ ok: false, service: 'DOWN', failure: { code: 'MALFORMED_RESPONSE', ... } }` from `MarketDataTransportClient.health()`). Untrusted extra properties are stripped rather than reflected.
4. **No premature live claims:** `DhanMarketDataService.health()` emits `contractVersion: 2` while continuing to emit `liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS'` and `providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED'`. Zero vendor probes, observers, or network requests are introduced in W-07; real live state observation belongs to W-08.

## Verification Evidence

- **W-07 contract drift suite (`tests/dhan_d3d_contract_drift.test.ts`):** `11` executed, `11` passed, `0` failed (`D3D-01..07` + `W07-01..04`, covering all 48 `service × providerConfiguration × liveProviderConnectivity × providerQualification × contractVersion` valid combinations, 27 malformed/unknown/contradictory fail-closed inputs, and loopback HTTP `DhanMarketDataService` -> `MarketDataTransportClient.health()` round-trip).
- **Focused provider, daemon, route, package, and P7 registry regressions (19 test files):** `185` executed, `185` passed, `0` failed (including `dhan_p7_instrument_master`, `dhan_p7_registry_regeneration`, and `w04_p7_published_manifest_qualification` reconciled cleanly against current `main`).
- **Installed-package consumer and round-trip verification (`npm run test:package-consumer` / `scripts/verify-public-package.mjs`):** `PASS` — packs `iips-production-market-data@1.0.0`, installs into an isolated consumer, validates ESM + CJS `./dhan-server` resolution, strict TypeScript (`exactOptionalPropertyTypes: true`) declaration checking of W-07 types/exports, synthetic 12-combination wire round-trips and fail-closed rejections, real loopback HTTP `createMarketDataHttpServer` + `MarketDataTransportClient.health()` round-trip (`contractVersion: 2`, pre-access non-live claims preserved), verbatim IRR consumer compilation/execution, and browser bundle boundary scan (`forbiddenHits: []`).
- **Typecheck and build:** `npm run build` (`tsc`, `vite build`, `build:portfolio-ui-package`, `build:pit-package`, `build:dhan-package`) and `--noEmit` across all four `tsconfig*.json` configurations: `PASS`.
- **Full-suite acceptance gate (`npm test`):** `1,658` executed (`230` suites), `1,657` passed, `0` failed, `1` skipped (unchanged baseline skip; `+4` W-07 tests over `main` baseline `1,654` executed / `1,653` passed / `1` skipped).
