# DHAN-D2 — Integration & Qualification Harness (Pre-Access)

**Status:** PRE-ACCESS DEVELOPMENT ONLY — `PRE_ACCESS / SYNTHETIC / OFFLINE`
**Gate:** DHAN-D2-INTEGRATION-QUALIFICATION-HARNESS
**Builds on:** DHAN-D1 (`74c9065`)

> No real Dhan credentials exist. No real Dhan authentication was attempted, no real Dhan API
> call was made, and no Dhan connectivity, historical coverage or production readiness is
> claimed. Every result in this gate derives from deterministic synthetic fixtures.

---

## 1. Preserved architecture

D1's architecture is unchanged; D2 only extends it outward along the existing provider-neutral path:

```
Dhan API → DhanApiClient → DhanMarketDataSource → MarketDataSource<T> (existing SPI)
        → CanonicalEnvelope<MarketQuotePayload> (existing contract)
        → ProviderMarketDataRoute (provider-NEUTRAL) → MarketDataDTO (existing transport)
        → portfolio revaluation / UI data-state / UI view models
Historical: DhanHistoricalAdapter → OHLCVCandle (existing D02 contract)
```

`ProviderMarketDataRoute` is typed against the SPI, not against Dhan: it never imports the
Dhan package and works with any provider that emits canonical market data.

## 2. Modules added

| Module | Role |
| --- | --- |
| `src/providers/market_data_route.ts` | Provider-neutral route; CURRENT/STALE/UNAVAILABLE derivation; data-state view |
| `src/providers/dhan/dhan_instrument_mapping_integration.ts` | Mapping row validation, load report, conflict detection, P04 identity integration |
| `src/providers/dhan/dhan_historical_dto.ts` | Historical request/date-range model + vendor DTO boundary |
| `src/providers/dhan/dhan_historical_adapter.ts` | Historical → canonical D02 normalization |
| `frontend/src/features/portfolio/market-data/portfolio-market-data-binding.ts` | Canonical-only portfolio revaluation |

Extended: `dhan_failures.ts` (6 new codes), `dhan_instrument_map.ts` (conflict detection),
`dhan_api_client.ts` (shared `executeJsonPost` reused by quote + historical endpoints).

## 3. Data-state mapping

| Canonical quality | Product state | Behaviour |
| --- | --- | --- |
| `GOOD` | `CURRENT` | Canonical envelope + `MarketDataDTO` emitted |
| `STALE` | `STALE` | Emitted, flagged degraded (AD-12 concession preserved) |
| `PARTIAL` / `UNAVAILABLE` | `UNAVAILABLE` | No DTO emitted; deterministic failure code returned |
| provider failure | `UNAVAILABLE` | Route never throws; failure code is carried |

Stale data can never present as CURRENT: the state is derived solely from the canonical
quality produced by the existing `evaluateFreshness` implementation.

## 4. Portfolio binding rules

* Consumes `MarketDataDTO` only — no provider parsing, no vendor field names.
* Unpriced positions keep `ltp`/`currentValue`/`unrealizedPnl` as `null`; cost basis is never
  substituted for a market price.
* Portfolio state = worst position state; totals and weights are computed over priced
  positions only (`weightBasis: PRICED_POSITIONS_ONLY`).
* Existing import-time portfolio calculations (`broker-holdings-mapper`, `PortfolioStore`) are
  untouched.

## 5. Provider identity & NFR-06

The vendor label appears only as **route-level operator metadata**
(`providerRouteId` / `providerDisplayLabel`, derived from the SPI's symbolic provider id).
It never appears inside `CanonicalEnvelope`, `MarketDataDTO`, portfolio output or UI view
models; those carry the masked `TIER_2_COMMERCIAL` vendor tier and
`CANONICAL_MARKET_DATA` classification.

## 6. ACCESS-PENDING items

Real authentication, real endpoint/field verification, real instrument-master mappings, real
historical coverage/depth/adjustment policy, live latency and rate-limit behaviour, and
streaming. All are deferred to a later gate with real access inputs.
