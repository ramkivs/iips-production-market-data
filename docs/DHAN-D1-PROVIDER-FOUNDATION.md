# DHAN-D1 — Dhan Provider Foundation (Pre-Access Development Gate)

**Status:** PRE-ACCESS DEVELOPMENT ONLY
**Gate:** DHAN-D1
**Operating mode:** `PRE_ACCESS_NO_LIVE_CREDENTIALS`

> No real Dhan API credentials exist in this gate. No real Dhan authentication has been
> attempted, no live Dhan call has been made, and nothing in this gate demonstrates Dhan
> connectivity or production readiness. All evidence is derived from locally authored
> synthetic fixtures.

---

## 1. Governing architecture

Dhan is implemented as **a provider behind the existing provider-neutral market-data
architecture**. No Dhan-specific market-data contract is introduced for IIPS consumers.

```
Dhan API (not reachable in this gate)
  ↓
DhanApiClient                      src/providers/dhan/dhan_api_client.ts
  ↓  (vendor DTOs, provider-internal only)
DhanMarketDataSource               src/providers/dhan/dhan_market_data_source.ts
  ↓  implements MarketDataSource<T>  (EXISTING SPI, src/spi/provider_spi.ts)
CanonicalEnvelope<MarketQuotePayload>  (EXISTING contract, src/contracts)
  ↓
Existing IIPS consumers (transports / engines / UI view models)
```

Reused, unmodified authoritative components:

| Concern | Existing component reused |
| --- | --- |
| Provider-neutral interface | `MarketDataSource<T>`, `SnapshotQuery`, `ProviderHealth` (`src/spi`) |
| Canonical payload | `MarketQuotePayload` + `validateMarketQuotePayload` (`src/contracts/d01_quotes.ts`) |
| Canonical envelope | `CanonicalEnvelope`, `createCanonicalEnvelope` (`src/contracts/envelope.ts`) |
| Lineage / provenance | `computeLineageHash`, `DataProvenanceDTO` (`src/contracts/provenance.ts`) |
| Freshness / AD-12 concession | `evaluateFreshness` (`src/quality/freshness_evaluator.ts`) |
| Secret handling | `SecretRef`, `validateSecretRef` (`src/security/secret_ref.ts`) |
| Secret scanning | `scanDirectoryForSecrets`, `scanTextForSecrets` (`src/security/scanner.ts`) |

## 2. Package layout

```
src/providers/index.ts                      provider package index
src/providers/dhan/index.ts                 Dhan package index
src/providers/dhan/dhan_failures.ts         deterministic failure taxonomy
src/providers/dhan/dhan_config.ts           configuration + credential readiness
src/providers/dhan/dhan_dto.ts              vendor DTO boundary + structural parsing
src/providers/dhan/dhan_instrument_map.ts   IIPS companyId → Dhan securityId boundary
src/providers/dhan/dhan_api_client.ts       HTTP client foundation (injected transport)
src/providers/dhan/dhan_normalizer.ts       Dhan → canonical D01 transformation
src/providers/dhan/dhan_market_data_source.ts  adapter implementing the existing SPI
```

## 3. Configuration and credentials

Credentials are supplied **externally** and referenced only as `SecretRef` vault pointers.
No token, client id or secret value is present in source, fixtures, docs or tests.

| Configuration key | Purpose | Committed? |
| --- | --- | --- |
| `IIPS_DHAN_BASE_URL` | Provider base URL override | No (default is the public documented base URL) |
| `IIPS_DHAN_TIMEOUT_MS` | Request timeout (default 5000 ms) | No |
| `IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH` | `vault://...` pointer to the access token | No |
| `IIPS_DHAN_CLIENT_ID_SECRET_PATH` | `vault://...` pointer to the client id | No |
| `IIPS_DHAN_VAULT_PROVIDER` | SecretRef vault provider enum | No |
| `IIPS_DHAN_SECRET_VERSION` | SecretRef version | No |

Credential-readiness is a first-class state:

* `PRE_ACCESS_CREDENTIALS_UNAVAILABLE` — default. Every request short-circuits with
  `CREDENTIALS_UNAVAILABLE` **before** the transport is invoked.
* `CREDENTIAL_REFERENCES_CONFIGURED` — vault pointers present. Values are resolved at call
  time by an injected `DhanCredentialResolver` and are never stored, logged or serialized.

Injecting real credentials later requires replacing the resolver and supplying a real
transport. No architectural rework of the adapter, DTO boundary or normalizer is needed.

## 4. Deterministic failure taxonomy

Every boundary failure maps to exactly one code and fails closed — partial or unvalidated
market data is never emitted:

`CREDENTIALS_UNAVAILABLE`, `CONFIGURATION_INCOMPLETE`, `AUTHENTICATION_FAILURE`,
`RATE_LIMITED`, `TIMEOUT`, `TRANSPORT_FAILURE`, `HTTP_ERROR`, `PROVIDER_STATUS_FAILURE`,
`MALFORMED_RESPONSE`, `MISSING_REQUIRED_FIELD`, `INSTRUMENT_NOT_IN_RESPONSE`,
`UNRESOLVED_INSTRUMENT`, `CANONICAL_VALIDATION_FAILURE`, `STALE_DATA_SUPPRESSED`,
`UNSUPPORTED_DOMAIN`, `UNSUPPORTED_PRE_ACCESS_OPERATION`.

## 5. Instrument mapping boundary

`DhanInstrumentRegistry` defines how an IIPS `companyId` resolves to a Dhan
`securityId` + `exchangeSegment`. **It ships empty**: no real Dhan security identifiers are
invented or committed. Unresolved lookups return an explicit
`UNRESOLVED / NO_MAPPING_DATA_LOADED` or `UNRESOLVED / UNMAPPED_COMPANY_ID` result, and the
adapter raises `UNRESOLVED_INSTRUMENT` without issuing a provider request. Test mappings are
tagged `SYNTHETIC_PRE_ACCESS_FIXTURE` and are never authoritative.

## 6. Provider masking (NFR-06)

The canonical envelope carries `sourceClassification: CANONICAL_MARKET_DATA` and the generic
`vendorTier: TIER_2_COMMERCIAL`. Canonical payloads are constructed field-by-field, so no
vendor key (`last_price`, `ohlc`, `net_change`, `last_trade_time`, `NSE_EQ`, security ids) and
no vendor name can reach downstream consumers. This is asserted by test DHAN-D1-07.

## 7. Provisional response shape

Vendor DTO field names follow Dhan's published market-quote documentation and remain
**provisional** until a live response can be observed under a later gate. Any divergence is
absorbed inside `dhan_dto.ts` / `dhan_normalizer.ts` without touching the canonical contract.

## 8. Explicitly out of scope for DHAN-D1

Real authentication, real API calls, streaming/websocket feeds, production activation, D115
authorization, merge into the authoritative production branch, and any NSE changes.
