# 4 — Existing IPD Implementation Mapping

**Purpose:** a factual, file-and-symbol-cited inventory of what IPD actually implements for Dhan,
what it deliberately does not expose, and where the boundaries sit.

**Baseline:** commit `c260a8222661519c317183dc62c501d1b7a4cdae`.
**Verification:** `npx tsc` exit 0; `npm test` → **1712 executed, 1708 passed, 0 failed, 4 skipped**
(`scripts/run-tests.mjs` compiled-mode guard satisfied).

---

## 4.1 The Dhan provider surface in code

`src/providers/dhan/` — **32 files**. Public surface is fixed by `src/providers/dhan/package.ts`,
which is itself pinned by a drift test.

| File | Role | Key symbols | Vendor surface touched |
|---|---|---|---|
| `dhan_api_client.ts` | HTTP transport | `DhanApiClient`, `mapHttpStatus`, `DHAN_MARKET_QUOTE_PATH` | `POST /marketfeed/quote` |
| `dhan_historical_dto.ts` | Historical DTO + path | `DHAN_HISTORICAL_PATH`, `DHAN_SUPPORTED_HISTORICAL_INTERVALS`, `dhanIntervalToCanonical`, `dhanIntervalMs` | `POST /charts/historical` |
| `dhan_historical_adapter.ts` | Historical normaliser | `DhanHistoricalAdapter`, `normalizeDhanHistoricalToCandles` | — |
| `dhan_instrument_master_source.ts` | CSV acquisition | `DHAN_INSTRUMENT_MASTER_DETAILED_URL`, `DHAN_INSTRUMENT_MASTER_COMPACT_URL` | 2 CSV GETs |
| `dhan_instrument_master_parser.ts` | CSV → rows | parser | — |
| `dhan_instrument_master_qualification.ts` | Row qualification | qualification | — |
| `dhan_instrument_map.ts` | Provider identity registry | `DhanInstrumentRegistry`, `resolveExactIdentity`, `resolveListing` | — |
| `dhan_security_identity_service.ts` | Holding identity qualification | `qualifyHoldingSecurityIdentity` | — |
| `dhan_identity_api.ts` | Identity API facade | `DhanIdentityApiService` | — |
| `dhan_normalizer.ts` | Quote → canonical D01 | `normalizeDhanQuoteToCanonical`, `topOfBook` | — |
| `dhan_dto.ts` | Vendor wire DTOs + guards | `DhanQuoteDto`, `DhanDepthDto`, `DhanMarketQuoteResponseDto`, `REQUIRED_QUOTE_FIELDS` | — |
| `dhan_market_data_source.ts` | `MarketDataSource` SPI impl | `DhanMarketDataSource` | — |
| `dhan_market_data_service.ts` | Orchestrator | `DhanMarketDataService`, `getQuote`, `getHistorical` | — |
| `dhan_market_data_http.ts` | Local transport surface | POST-only, `MARKET_DATA_MAX_REQUEST_BYTES`, `VENDOR_STATUS_BEARING_CODES` | loopback only |
| `dhan_operational_controls.ts` | Rate/concurrency/cache | `DhanRateLimiter`, `DhanConcurrencyLimiter`, `DhanBoundedCache`, `observeThrottle` | — |
| `dhan_freshness_status.ts` | Freshness projection | `FreshnessStatus`, `RefreshStatus` | — |
| `dhan_failures.ts` | Failure vocabulary | `DhanFailure`, `DhanFailureCode` | — |
| `dhan_config.ts`, `dhan_credential_store_*.ts`, `dhan_dpapi_*.ts`, `dhan_local_vault_resolver.ts` | Credential handling | — | — |
| `dhan_local_daemon.ts` | Local daemon | — | loopback |
| `dhan_provider_state.ts` | Provider state | — | — |
| `dhan_server_egress.ts` | Egress guard | — | — |
| `dhan_utc_timestamp.ts`, `dhan_instrument_mapping_integration.ts`, `index.ts` | Support | — | — |

### 4.1.1 Vendor surfaces actually called — four (two API endpoints, two CSV downloads)

```
POST https://<dhan>/marketfeed/quote      (dhan_api_client.ts:96)
POST https://<dhan>/charts/historical     (dhan_historical_dto.ts:42)
GET  https://images.dhan.co/api-data/api-scrip-master-detailed.csv   (dhan_instrument_master_source.ts:22)
GET  https://images.dhan.co/api-data/api-scrip-master.csv            (dhan_instrument_master_source.ts:23)
```

Everything else in the nine documents — `/marketfeed/ltp`, `/marketfeed/ohlc`, `/charts/intraday`,
`/data/technical`, `/data/companyinfo`, `/data/marketmovers`,
`/v2/instrument/{exchangeSegment}`, and all three WebSocket endpoints — is **not called**.

**Verification method:** repository-wide grep across `src/`, `frontend/src/`, `scripts/` for
`marketfeed`, `charts/`, `scrip-master`, `data/technical`, `companyinfo`, `marketmovers`,
`websocket`, `api-feed`, `depth-api`, `twentydepth`, `twohundreddepth`. The only matches outside
`src/providers/dhan/` are the constants above and the fixture harness
(`frontend/src/features/dev/dhan-d2-dev-harness.ts`).

---

## 4.2 Area-by-area implementation mapping

### A — Instrument master and identity

| Capability | IPD state | Evidence |
|---|---|---|
| Fetch detailed CSV | `IMPLEMENTED` | `dhan_instrument_master_source.ts:22` |
| Fetch compact CSV | `IMPLEMENTED` | `dhan_instrument_master_source.ts:23` |
| Parse rows | `IMPLEMENTED` (ISIN, SERIES, LOT_SIZE, instrument, segment, symbol) | `dhan_instrument_master_parser.ts` |
| Produce `faceValue` | **`MISSING`** | not parsed; not a column in P9 either |
| Produce `industry` / `sector` | **`MISSING`** | not parsed; only available via `/data/companyinfo` (unimplemented) |
| Produce `tickSize` | **`MISSING`** in the D05 path | the CSV *has* `TICK_SIZE`, but IPD's D05 identity path does not carry it to canonical D05 |
| Security-level identity registry | `IMPLEMENTED` | `dhan_instrument_map.ts:124–134`, `:192` |
| Holding identity qualification | `IMPLEMENTED` | `dhan_security_identity_service.ts` / `dhan_identity_api.ts:20–40` |
| Segment REST endpoint `/v2/instrument/{seg}` | `MISSING` | not called |

**Coverage reality:** 96 of 23,764 equity candidates qualified (P7). 23,644 rejected
`REJECTED_NO_P04_CORRESPONDENCE`; 24 `REJECTED_INVALID_FIELD`
(`evidence/dhan-p7/qualification-report.md`).

### B — Historical

| Capability | IPD state | Evidence |
|---|---|---|
| Daily candles `/charts/historical` | `IMPLEMENTED` | `dhan_historical_adapter.ts`; path at `dhan_historical_dto.ts:42` |
| Intraday `/charts/intraday` | `MISSING` | never called |
| Interval vocabulary | **IPD's own**, explicitly marked provisional | `dhan_historical_dto.ts:19–24`: "Vendor interval vocabulary is PROVISIONAL (published docs only, not live-qualified)". Values: `1m, 5m, 15m, 1h, 1D` |
| Candle boundary convention | epoch seconds at candle **start**; `dhanIntervalMs` | `dhan_historical_dto.ts:31–33` |
| Duplicate / out-of-order candles | fail closed | `dhan_historical_adapter.ts` |
| Adjustment policy | **`MISSING` / `UNCERTAIN`** | `isAdjusted` is a **mandatory** D02 field (`d02_ohlcv.ts:24`); Dhan documents no adjustment policy, so IPD's value is not vendor-grounded |

**Important:** IPD's supported intervals are `1m|5m|15m|1h|1D` while the canonical D02 vocabulary is
`1m|5m|15m|1h|1d|1w|1M` (`d02_ohlcv.ts:11`). IPD supports **none** of the weekly/monthly
canonical intervals, and uses `1D` (upper-case D) as the vendor-side spelling which
`dhanIntervalToCanonical` maps to `1d`.

### C — Market Quote / OHLC

| Capability | IPD state | Evidence |
|---|---|---|
| `/marketfeed/quote` | `IMPLEMENTED` | `dhan_api_client.ts:96` |
| `/marketfeed/ohlc` | `MISSING` | — |
| `/marketfeed/ltp` | `MISSING` | — |
| Quote → canonical D01 | `IMPLEMENTED` | `dhan_normalizer.ts:61–` |
| `previousClose` derivation | `IMPLEMENTED` — derived as `last_price − net_change`; **fails closed** if `net_change` is absent, explicitly refusing `ohlc.close` as a substitute | `dhan_normalizer.ts:101–110` |
| `pctChange` denominator guard | `IMPLEMENTED` — non-finite/zero/negative `previousClose` never yields `pctChange = 0` | `dhan_normalizer.ts:113–` |
| Depth → `bid`/`ask` | `IMPLEMENTED` — `depth.buy[0].price` → `bid`, `depth.sell[0].price` → `ask`; **no ordering validation** | `dhan_normalizer.ts:50–54`, `:132–133` |
| `bid`/`ask` presence validation in D01 | **not validated** — D01 requires the fields to be present but not to be positive | `src/contracts/d01_quotes.ts` |

> **Consequence of the last two rows:** `topOfBook` returns `0` when the level is missing or
> non-positive (`dhan_normalizer.ts:50–54`), and D01 does not reject `bid = 0`. A quote with an
> absent depth therefore produces a **valid** canonical envelope with `bid = 0`, `ask = 0` — which
> reads as "no bid / no ask" rather than "depth unavailable". This is a data-quality hazard, recorded
> as gap **G-05**.

### D — Live Market Feed

`MISSING` — no WebSocket code exists in the repository.

### E — Market depth

| Product | IPD state | Evidence |
|---|---|---|
| REST Full Quote depth (5-level, undocumented) | `PARTIALLY_IMPLEMENTED` — read, top-of-book only | `dhan_dto.ts:38–41`; `dhan_normalizer.ts:50–54` |
| Live-feed 5-level depth | `MISSING` | — |
| 20-level depth | `MISSING` | — |
| 200-level depth | `MISSING` | — |
| Depth level count validation | `MISSING` | no check that `depth.buy.length` equals an expected level count |
| Book ordering validation | `MISSING` | no check that prices are monotonic across levels |

### F — Market analytics / company info / movers

`MISSING` across the board. No call, no DTO, no normaliser, no contract binding.

### G — Rate limiting and operational controls

| Control | IPD state | Evidence |
|---|---|---|
| Token-bucket rate limiter | `IMPLEMENTED` — `maxRequests: 60`, `windowMs: 60_000` | `dhan_market_data_service.ts:114` |
| Concurrency limiter | `IMPLEMENTED` — 8 in flight, queue 1,024 | `dhan_market_data_service.ts:115`; `dhan_operational_controls.ts` |
| Bounded cache | `IMPLEMENTED` — 256 entries | `dhan_market_data_service.ts:113` |
| Request coalescing | `IMPLEMENTED` | `dhan_operational_controls.ts` (`DhanRequestCoalescer`) |
| `Retry-After` handling | `IMPLEMENTED` — `observeThrottle` honours it, zeroes the bucket, blocks the window | `dhan_operational_controls.ts:151–152` |
| Endpoint-family-aware budgets | **`MISSING`** — one shared 60/min bucket for all Dhan traffic | `dhan_market_data_service.ts:114` |
| Vendor rate-limit signal parsing (`RL001`, `errorType`) | **`MISSING`** | no parsing in `src/providers/dhan/` |
| `Retry-After` **header** reading | **not present** — `observeThrottle` exists and is tested, but **no production call site passes a vendor `Retry-After` value** | verified: `observeThrottle` is defined once (`dhan_operational_controls.ts:152`) and its only caller in the whole repository is the test (`tests/dhan_p4_operational_controls.test.ts:163`) |

### H — Error taxonomy

| Capability | IPD state | Evidence |
|---|---|---|
| HTTP-status → canonical failure | `IMPLEMENTED` | `dhan_api_client.ts:311–325` |
| Vendor application code (`800`–`814`, `DH-9xx`) parsing | **`MISSING`** | no parser in `src/providers/dhan/` |
| Rate-limit code `RL001` parsing | **`MISSING`** | — |
| Vendor error body reflection | **deliberately absent** — bodies are never echoed (credential-reflection defence) | `dhan_api_client.ts:307–310` |
| `remarks` field | declared `unknown`, never read | `dhan_dto.ts:62` |
| WebSocket feed/disconnect code handling | `MISSING` (no WS) | — |

---

## 4.3 Consumer mapping — who actually reads Dhan data in code

A repository-wide search for imports of `src/providers/dhan/**` returns exactly these consumers:

| Consumer | File | Nature of consumption |
|---|---|---|
| Broker-import composition | `src/ipc/brokerImportComposition.ts:35,38` | uses `DhanInstrumentRegistry` + `dhan_local_daemon` for identity resolution during import |
| Broker-import consumer | `src/ipc/brokerImportConsumer.ts:32` | uses `DhanInstrumentRegistry` |
| Broker-import persistence | `src/persistence/brokerImportPersistence.ts:10–11` | uses `DhanSecurityIdentityService` + `DhanInstrumentRegistry` |
| Market-data route (IRR-facing boundary) | `src/server/market-data/dhanMarketDataRoute.ts:62` | consumes IPD's provider-neutral `MarketDataTransportClient` over loopback; **never** touches Dhan credentials |
| Dev harness (fixture only) | `frontend/src/features/dev/dhan-d2-dev-harness.ts:45,54,229` | fixture JSON → in-memory transport → `DhanApiClient` → `DhanMarketDataSource`; **no network** |

**Negative finding, stated explicitly because it is a substantive result:**

> **No IRR, no engine, no UI component, and no report generator consumes Dhan market data.**
> The only runtime consumers are the broker-import identity path and the local market-data route.
> The IRR-facing route is explicitly provider-neutral: it never reads `IIPS_DHAN_*`, never resolves a
> Dhan `SecretRef`, and never constructs a Dhan client
> (`dhanMarketDataRoute.ts:20–32`).

This is **consistent with**, and independently corroborates, the governing constraint that Dhan data
is **supporting evidence only, never an independent decision authority**: there is currently no path
by which a Dhan number could become an IIPS decision input, because there is no such path at all.

**Boundary rule confirmed in code:** `src/server/market-data/dhanMarketDataRoute.ts:9–13` states the
route lives under `src/server/` because IPD runs a structural gate
(`tests/q1_ipc_read_contract_conformance.test.ts`) forbidding a `frontend/server` route tier in this
repository — that tier belongs to IRR.

---

## 4.4 Test coverage

`tests/` contains **30 Dhan test files**. The most load-bearing for this assessment:

| Test | What it pins | Why it matters here |
|---|---|---|
| `tests/dhan_d3d_contract_drift.test.ts` | **D3D-01** exact D01 key set; **D3D-02** exact D02 key set; **D3D-03** identity separation; **D3D-04**/**D3D-05** **exact package export map**; **D3D-06**, **D3D-07** | Any new Dhan surface (depth, WebSocket, analytics) **requires an export-map update**, or D3D-04/D3D-05 will fail. This is the principal regression risk to any future expansion. |
| `tests/dhan_p4_operational_controls.test.ts` | Rate limiter, concurrency limiter, cache, `observeThrottle` | The 60/min + 8-in-flight budget is a **tested contract**, so changing it is a contract change, not a tuning change |
| W-06 suites | Authentication/401 classification, request conformance, transport recovery | Preserve the W-06 boundary |

**Overall baseline:** 1712 tests executed, 1708 passed, 0 failed, 4 skipped.

---

## 4.5 Architectural observations

1. **Provider-neutral by construction.** The Dhan package exposes canonical `MarketDataSource` and
   `MarketDataDTO` (`package.ts:126–127`), and the IRR-facing route never sees Dhan types. Provider
   substitution for a future second vendor is therefore structurally possible — a fact that should
   protect IPD when the vendor's depth/analytics products are eventually added.
2. **Internal DTOs are internal by construction.** `package.ts:9–18` documents that `dhan_dto`,
   `dhan_normalizer` and the mapping machinery are deliberately **not** exported, so vendor shapes
   cannot leak into canonical contracts. Verified by `D3D-04`/`D3D-05`.
3. **Fail-closed is systematic.** The normaliser refuses rather than substitutes (§4.2, C). This
   matters for the assessment: several of the gaps below can be closed *safely* (a refused value
   never becomes a fabricated one), which is why "fill in the blank" is not proposed anywhere.
4. **REST-only, poll-based.** There is no push transport, no streaming, no subscription lifecycle.
   The 15-minute D01 freshness threshold (`src/quality/freshness_evaluator.ts:16`) is therefore
   reachable by polling — but only with an entitled, working account, which does not exist today.
5. **The orchestrator is the right place for future limits.** `dhan_market_data_service.ts` already
   owns the limiter, the cache, the coalescer and the freshness evaluator; a per-family budget, a
   vendor-signal-aware throttle, and a WebSocket lifecycle would all belong there rather than in a
   new parallel stack.
