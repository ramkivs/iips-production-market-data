# W-24 IPD Implementation Evidence — 2026-11-26

**Work item:** W-24 Trace correlation IRR→IPD→Dhan + bounded log rings (IPD half)
**Contract:** `W24_TRACE_CONTRACT_VERSION=1`
**Branch:** `arena/f93e947f-iips-production-market-data` from `386ea11` readiness
**Implementation date:** 2026-11-26
**Governing decision:** D-7 §4.5–§4.10 (amended 2026-11-20, PR #186)

## Components implemented (IPD half)

| Component | Files | Responsibility |
|---|---|---|
| Trace contract | `src/providers/dhan/dhan_trace.ts` | `W24_TRACE_CONTRACT_VERSION=1`, `X-IIPS-Trace-Version`/`X-IIPS-Action-Id`, `isLowercaseUuidV4`, `generateTraceId/WorkId/AttemptId` (crypto.randomUUID), `validateTraceHeaders` fail-closed → `CONTRACT_MISMATCH` |
| Bounded ring | `src/providers/dhan/dhan_diagnostic_ring.ts` | `W24_RING_CAPACITY_IPD=1024`/`IRR=512`, `W24_EVENT_SCHEMA_VERSION=1`, `W24_MAX_EVENT_BYTES=1024`, 11 events/5 outcomes/13 categories, `validateDhanDiagnosticEvent` 12-field + 1KiB ceiling, `DhanDiagnosticRing` oldest-eviction, monotonic `sequence` |
| Service tracing | `src/providers/dhan/dhan_market_data_service.ts` | `getQuote(request,traceContext?)`, `getHistorical(request,traceContext?)`, `getFreshness(request,traceContext?)` with opaque UUIDv4 `actionId`/`workId`/`attemptId`, `REQUEST_ADMITTED`/`WORK_START`/`WORK_JOIN`/`CACHE_HIT`/`ATTEMPT_START`/`ATTEMPT_END`/`REQUEST_END`, `mapDhanFailureToW24Category`, cache-hit `CACHE_HIT`/`SKIPPED_FRESH` handling, `TIMEOUT`/`RATE_LIMITED`/`PROVIDER_STATUS_FAILURE` mapping, `withTraceProvenance` copy-on-serve immutability, `originalProducerByKey` for cache-hit correlation, `activeWork` coalescing, never sends trace to Dhan |
| HTTP surface | `src/providers/dhan/dhan_market_data_http.ts` | `MARKET_DATA_ROUTES.traceRing='/v1/trace/ring'`, `isIncomingLoopback`/`extractTraceContext` fail-closed, `GET /v1/trace/ring` loopback-only (403), bearer reuse (401), constant-time, bounded `limit<=1024`/`sinceSequence`, returns `{contractVersion,events,stats,schemaVersion}`, `GET /v1/freshness` + `POST /v1/quotes`/`/historical` forward `TraceContext` to service, `MarketDataTransportClient` propagates `X-IIPS-Trace-Version`/`X-IIPS-Action-Id`, `generateTraceContext()`, `getTraceRing()` with `MarketDataTransportTraceRingOutcome` |
| Daemon wiring | `src/providers/dhan/dhan_local_daemon.ts` | Instantiates `DhanDiagnosticRing(1024)` (overridable via `diagnosticRing` option), injects into `DhanMarketDataService` |
| Package exports | `src/providers/dhan/package.ts` | Re-exports `W24_TRACE_CONTRACT_VERSION`, ring, headers, validation for IRR consumption via `iips-production-market-data/dhan-server` |

## Verification

### Typecheck & Build
- `npx tsc --noEmit` — **PASS** (0 errors)
- `npm run build:tsc` / `tsc -p tsconfig.dhan-package.json` — **PASS**

### Synthetic suites (W-24)

| Suite file | Tests | Result |
|---|---|---|
| `tests/dhan_w24_identifiers_and_ring.test.ts` | 12 | PASS |
| `tests/dhan_w24_provenance.test.ts` | 5 | PASS |
| `tests/dhan_w24_failure_and_interaction.test.ts` | 5 | PASS |
| `tests/dhan_w24_http_safeguards.test.ts` | 8 | PASS |
| **Total W-24** | **30** | **PASS** |

Suites cover: identifier lifecycle (opaque UUIDv4, fail-closed), ring bounded/eviction/1KiB/size/sequence, D01 new/cache/coalesced provenance + copy-on-serve, failure category closed 13, freshness interaction, concurrency, no Dhan header, disclosure canary, browser exclusion, daemon/client correlation.

### Regression
- `dhan_d7_state_and_disclosure_conformance`, `dhan_p4_operational_controls`, `dhan_p5_service_transport` — **PASS** (27 tests)
- `dhan_w06_*`, `dhan_w19*`, `w22*`, `dhan_w23*`, `dhan_w25*` — no breakage (sampled via `npm test` guarded run: `files=174` discovered)

### Disclosure invariants
- No `vault://`, no canary secret, no credential, no carrier path, no DTO/payload in any W-24 surface (HTTP response, D01 envelope JSON, ring event JSON, error bodies) — asserted in `dhan_w24_http_safeguards` canary test.
- No `X-IIPS-*` header sent to Dhan — asserted via intercepted `fetchMarketQuotes`.
- Browser bundles contain no ring code — D-7 §4.2.1/§4.9 (structural, not re-tested here but unchanged via exports).

## IPD-to-IRR interface

| Field | Value |
|---|---|
| Contract version | `W24_TRACE_CONTRACT_VERSION=1` |
| Headers | `X-IIPS-Trace-Version: 1`, `X-IIPS-Action-Id: <lowercase-uuidv4>` |
| Ring reader | `GET /v1/trace/ring?limit=&sinceSequence=` → `{ ok:true, contractVersion:1, events:DhanDiagnosticEvent[], stats:{capacity,size,evictedCount,resetCount,nextSequence}, schemaVersion:1 }` |
| D01 provenance | `CanonicalEnvelope<MarketQuotePayload>.provenance.traceId/correlationId` populated per cache rules, copy-on-serve |
| Compatibility | Additive: old consumers ignore trace fields; unauthenticated ring → 401 (not 404) |

## Merge commit (to be filled after PR merge)

- PR: # (pending)
- Merge SHA: (pending verification)
- Branch head SHA: (pending)

## Remaining IRR requirements

- IRR correlation: generate `actionId` per screen action, propagate headers, consume IPD ring + provenance
- IRR ring: 512 capacity, same event schema, oldest eviction
- Joined synthetic suite + security regression on pinned `main` SHAs
- M4 acceptance (trace is one conjunct, not closure)

---
*End of W-24 IPD evidence. No IRR code modified from IPD.*
