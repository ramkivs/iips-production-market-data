# DHAN-D1 — Provider Foundation / Pre-Access Development Gate — Evidence Report

**Gate:** `DHAN-D1-PROVIDER-FOUNDATION`
**Governing standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Execution mode:** `PRE_ACCESS_NO_LIVE_CREDENTIALS` / `LOCAL_FIXTURE_AND_OFFLINE_DEV`
**Date:** 2026-09-25

## 0. Access disclaimer

Real Dhan API credentials were **not available** for this gate. No real Dhan authentication was
attempted, no real Dhan API call was made, and no Dhan connectivity is claimed or demonstrated.
All results below are derived from locally authored, deterministic synthetic fixtures and prove
**pre-access implementation correctness only** — not production readiness.

## 1. Authoritative baseline

| Item | Value |
| --- | --- |
| Remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` |
| Authoritative branch | `main` (= `origin/main`) |
| Baseline SHA | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` |
| Accepted production baseline modified | No |

## 2. Architecture implemented

```
Dhan API → DhanApiClient → DhanMarketDataSource (existing MarketDataSource<T> SPI)
        → CanonicalEnvelope<MarketQuotePayload> (existing contract) → IIPS consumers
```

No Dhan-specific market-data contract was created for IIPS consumers. The existing canonical
contract, envelope, provenance, freshness and SecretRef components were reused unmodified.

## 3. Synthetic fixture coverage (`tests/fixtures/dhan_d1_fixtures.json`)

| Required scenario | Fixture key |
| --- | --- |
| Valid quote | `validQuote` |
| Stale quote / old timestamp | `staleQuoteConcession` (AD-12 concession) and `staleQuoteSuppressed` (beyond 2× threshold) |
| Malformed response | `malformedResponse` |
| Missing required field | `missingRequiredField`, `missingOhlcField` |
| Unknown / unresolved instrument | empty registry + `instrumentAbsentFromResponse` |
| Simulated authentication failure | `authenticationFailure` (HTTP 401) |
| Simulated timeout / transport failure | `transportTimeout`, `transportFailure` |
| Additional | `providerStatusFailure`, `rateLimited`, `serverError` |

## 4. Test results

| Suite | Command | Result |
| --- | --- | --- |
| Typecheck | `npx tsc --noEmit` | PASS (0 errors) |
| Build | `npx tsc` | PASS |
| DHAN-D1 gate suite | `node --test dist/tests/dhan_d1_provider_foundation.test.js` | **21/21 PASS** |
| Full repository suite | `npm test` | **563/563 PASS, 0 FAIL** |

Proof map (DHAN-D1-01 … DHAN-D1-21): configuration pre-access state; SecretRef-only credential
references; credential-absent short-circuit before transport; no-network default transport;
expected provider response shape accepted with per-request header injection; canonical
normalization; zero vendor-DTO leakage; downstream product-transport consumability; SPI
conformance; AD-12 stale concession; stale suppression fails closed; malformed rejection;
missing-field rejection with field path; unresolved-instrument fail-closed (three variants);
deterministic auth/throttle/HTTP/timeout/transport failures; health never HEALTHY pre-access;
unsupported domain rejection; deterministic timestamp conversion; canonical validation
fail-closed; zero credential emission in errors/envelopes/config summaries/console; zero
plaintext credentials in the provider tree and fixtures.

## 5. Security / secret scan

| Check | Result |
| --- | --- |
| Dhan token in source | NONE |
| Credential in fixtures | NONE |
| Credential in documentation | NONE |
| Credential in committed logs | NONE (no logs committed) |
| Credential printed by tests | NONE (console output asserted empty; synthetic placeholders asserted absent) |
| `scanDirectoryForSecrets(src, tests, frontend)` | PASS — 0 violations |

## 6. Scope control

No NSE changes, no UI redesign, no unrelated refactoring, no replacement of the canonical
market-data architecture, no production activation, no D115 authorization, no merge into the
authoritative production branch.

## 7. Next gate

`DHAN-D2` — not started. Requires separate authorization and, for any live behaviour, real
Dhan credentials supplied through approved external secret handling.
