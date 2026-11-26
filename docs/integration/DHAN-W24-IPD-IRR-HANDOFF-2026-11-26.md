# W-24 IPD → IRR Handoff — 2026-11-26 (Sequence 7)

**Work item:** W-24 — Trace correlation IRR→IPD→Dhan + bounded log rings (IPD half)
**Readiness:** `DHAN-W24-IPD-IMPLEMENTATION-READINESS-REPORT-2026-11-26.md` `DHAN-W24-IPD-READINESS-2026-11-26` at `386ea11` (Seq 7, authorized 2026-11-26, contract `W24_TRACE_CONTRACT_VERSION=1`)
**IPD implementation branch:** `arena/f93e947f-iips-production-market-data` branched from `85ac12736cb9e2f21f639ca121d289d49ca2ba3c` of `main`
**IPD PR:** #203 — `feat(dhan): W-24 IPD implementation — daemon tracing, client propagation, quote provenance, bounded ring (Seq 7)`
**Head SHA (PR branch):** `b5f7d3b1c3c6956c0dbb1d831a6745584d9c293d`
**Merge commit (IPD `main`):** `0071980f8d35406ea6388edd413bde597fd65dde` (Merge PR #203, `eebaa3d..0071980`)
**Merge via:** `gh pr merge 203 --merge` — `MERGEABLE`, no required checks (IPD CI guard verified via `tcs --noEmit` + `build` + `30 W-24 synthetic tests` + sampled regression)
**Verification of merge:** `gh api contents` fetchable at `0071980` for `src/providers/dhan/dhan_trace.ts` (blob `8e5558c1f525fb489eccb213817ea35e08fb3227`, `W24_TRACE_CONTRACT_VERSION=1`), `dhan_diagnostic_ring.ts`, `dhan_market_data_service.ts`, `dhan_market_data_http.ts`

## Published contract & version

| Field | Value |
|---|---|
| **Package** | `iips-production-market-data` `@1.0.0`, subpath `iips-production-market-data/dhan-server` (unchanged) |
| **Trace contract version** | `W24_TRACE_CONTRACT_VERSION = 1` (`src/providers/dhan/dhan_trace.ts`) — independent of `DHAN_DIAGNOSTICS_CONTRACT_VERSION`/`DHAN_HEALTH_CONTRACT_VERSION`/`DHAN_PERSISTED_STATE_SCHEMA_VERSION`/`DHAN_VERIFICATION_CONTRACT_VERSION` |
| **Trace headers (wire)** | `X-IIPS-Trace-Version: 1` (`TRACE_HEADER_VERSION`), `X-IIPS-Action-Id: <lowercase-uuidv4>` (`TRACE_HEADER_ACTION`) — lowercased `x-iips-trace-version`/`x-iips-action-id` on wire |
| **Identifiers** | Three opaque lowercase UUIDv4: `actionId` (per IRR screen action, IRR-minted, IPD reuses verbatim), `workId` (per new shared quote refresh, IPD-minted, one `orchestrator.refresh` execution, coalesced `actionId`s share `workId`), `attemptId` (per actual `DhanApiClient.fetchMarketQuotes` handoff, IPD-minted) — `node:crypto.randomUUID`, never derived from payloads/secrets, never logged beyond allowlisted fields |
| **Diagnostic event (12 fields)** | `schemaVersion:1`, `timestampUtc` (ISO-8601 UTC), `component:'IRR'|'IPD'`, `operation:'QUOTE'|'HISTORY'|'FRESHNESS'`, `event: ACTION_START|ACTION_END|REQUEST_ADMITTED|REQUEST_END|CACHE_HIT|WORK_START|WORK_JOIN|ATTEMPT_START|ATTEMPT_END|TIMEOUT|LATE_COMPLETION` (11), `actionId`, `workId`, `attemptId`, `outcome: SUCCESS|FAILURE|TIMEOUT|NOT_ATTEMPTED|UNKNOWN` (5), `failureCategory: VALIDATION_ERROR|AUTHENTICATION_FAILED|AUTHORIZATION_FAILED|CONFIGURATION_ERROR|READINESS_FAILED|IDENTITY_REJECTED|RATE_LIMITED|CACHE_ERROR|TRANSPORT_ERROR|PROVIDER_ERROR|TIMEOUT|CONTRACT_MISMATCH|INTERNAL_ERROR` (13, unknown→`INTERNAL_ERROR`), `durationMs`, `sequence` (monotonic) — `W24_EVENT_SCHEMA_VERSION=1`, `W24_MAX_EVENT_BYTES=1024` (1 KiB ceiling, oversize dropped, never trimmed into prohibited value) |
| **Ring capacities** | IPD `W24_RING_CAPACITY_IPD=1024`, IRR `W24_RING_CAPACITY_IRR=512` — `DhanDiagnosticRing` bounded in-memory, process-lifetime only, oldest-eviction, never grows/spills/blocks, never persisted |
| **New route** | `GET /v1/trace/ring?limit=&sinceSequence=` (`MARKET_DATA_ROUTES.traceRing='/v1/trace/ring'`) → `{ ok:true, contractVersion:1, events:DhanDiagnosticEvent[], stats:{capacity,size,evictedCount,resetCount,nextSequence}, schemaVersion:1 }` |
| **Envelope addition** | `CanonicalEnvelope<MarketQuotePayload>.provenance.traceId?` / `correlationId?` (existing optional `DataProvenanceDTO` fields, no new envelope version) — populated per §4.6 rule 2: new=both equal `actionId`; cache-hit=`traceId`=current `actionId`, `correlationId`=original producer `actionId`; coalesced=each `traceId` own, shared `correlationId`; never synthesized for historical/D02 |

## Public interfaces (IPD-owned, IRR-consumed)

```ts
// dhan_trace.ts
export const W24_TRACE_CONTRACT_VERSION = 1 as const;
export const TRACE_HEADER_VERSION = 'X-IIPS-Trace-Version' as const;
export const TRACE_HEADER_ACTION = 'X-IIPS-Action-Id' as const;
export function generateTraceId(): string; // crypto.randomUUID lowercase UUIDv4
export function generateWorkId(): string;
export function generateAttemptId(): string;
export function isLowercaseUuidV4(s: unknown): boolean;
export function validateTraceHeaders(headers: Record<string,string|undefined>): { ok:true, context:TraceContext }|{ ok:false, rejection:TraceHeaderRejection };
export type TraceContext = { traceVersion:'1', actionId:string };
export type TraceHeaderRejection = { code:'CONTRACT_MISMATCH', reason:'MISSING_HEADERS'|'INVALID_VERSION'|'INVALID_ACTION_ID' };
export function buildTraceHeaders(context: TraceContext): Record<string,string>;

// dhan_diagnostic_ring.ts
export const W24_RING_CAPACITY_IPD = 1024 as const;
export const W24_RING_CAPACITY_IRR = 512 as const;
export const W24_MAX_EVENT_BYTES = 1024 as const;
export const W24_EVENT_SCHEMA_VERSION = 1 as const;
export interface DhanDiagnosticEvent { readonly schemaVersion:1; readonly timestampUtc:string; readonly component:'IRR'|'IPD'; readonly operation:'QUOTE'|'HISTORY'|'FRESHNESS'; readonly event: W24EventName; readonly actionId:string; readonly workId:string; readonly attemptId:string; readonly outcome:W24Outcome; readonly failureCategory:W24FailureCategory|null; readonly durationMs:number; readonly sequence:number; }
export class DhanDiagnosticRing { constructor(capacity:number); record(partial: Omit<DhanDiagnosticEvent,'sequence'>): DhanDiagnosticEvent|null; list(opts?:{limit?:number,sinceSequence?:number}): DhanDiagnosticEvent[]; getStats():{capacity,size,evictedCount,resetCount,nextSequence}; }
export function validateDhanDiagnosticEvent(input:unknown): DhanDiagnosticEvent|null;
export function mapDhanFailureToW24Category(code:string): W24FailureCategory;

// dhan_market_data_service.ts (service boundary)
public async getQuote(request: QuoteRequest, traceContext?: TraceContext): Promise<QuoteResponse>;
public async getHistorical(request: HistoricalServiceRequest, traceContext?: TraceContext): Promise<HistoricalResponse>;
public getFreshness(request: FreshnessRequest, traceContext?: TraceContext): FreshnessStatus;
public getDiagnosticRing(): DhanDiagnosticRing;

// dhan_market_data_http.ts (server + client)
export const MARKET_DATA_ROUTES: { traceRing:'/v1/trace/ring', quotes:'/v1/quotes', historical:'/v1/historical', freshness:'/v1/freshness', ...existing };
export function createMarketDataHttpServer(options:{service:DhanMarketDataService, token:string, host:string, env:DhanEnvSource}): Server; // adds GET /v1/trace/ring
export class MarketDataTransportClient {
  constructor(baseUrl:string, token:string, options?:MarketDataTransportClientOptions);
  generateTraceContext(): TraceContext;
  getQuote(req: QuoteRequest, traceCtx?:TraceContext): Promise<MarketDataTransportQuoteOutcome>;
  getHistorical(req: HistoricalServiceRequest, traceCtx?:TraceContext): Promise<MarketDataTransportHistoricalOutcome>;
  getFreshness(req: FreshnessRequest, traceCtx?:TraceContext): Promise<MarketDataTransportFreshnessOutcome>;
  getTraceRing(opts?:{limit?:number,sinceSequence?:number}): Promise<MarketDataTransportTraceRingOutcome>; // { ok:true, contractVersion:1, events, stats, schemaVersion:1 }
}
```

## Trace/action correlation semantics (lifecycle)

1. IRR mints `actionId` per user action (`generateTraceId` or `client.generateTraceContext()`).
2. Propagates `X-IIPS-Trace-Version:1` + `X-IIPS-Action-Id` on loopback `POST /v1/quotes|/historical` (and `GET /v1/freshness` when supplementary) — authenticated (`IIPS_MARKET_DATA_TRANSPORT_TOKEN` reuse, `timingSafeEqual`), never logged/serialized beyond `actionId`, never retried on mismatch, fail-closed `CONTRACT_MISMATCH` (400).
3. IPD validates (lowercase UUIDv4 syntax, version 1), admits `REQUEST_ADMITTED`, assigns `workId` on miss (shared across coalesced `actionId`s → `WORK_START` + `WORK_JOIN`s), executes one `attemptId` per actual `fetchMarketQuotes` handoff → `ATTEMPT_START`/`ATTEMPT_END` with `failureCategory`/latency.
4. Records `CACHE_HIT` where applicable (no vendor attempt), `REQUEST_END` (SUCCESS/FAILURE with closed category), returns D01 envelope with `traceId`/`correlationId` per rule above via `withTraceProvenance` copy-on-serve (cached entry never mutated, `originalProducerByKey` side map).

**M4 Dhan-leg interpretation (owner-approved 2026-11-21, IPD D-7 §12 U-4, IRR roadmap §10.3):** same IRR-generated `actionId` reaches IPD and is associated with IPD's local Dhan egress-attempt record (`ATTEMPT_START`/`ATTEMPT_END` with `failureCategory`). No trace header sent to Dhan; vendor-side correlation not required; does not prove Dhan receipt.

## Compatibility & safeguards

- Additive: consumers ignoring `traceId`/`correlationId` unaffected; `GET /v1/trace/ring` unauthenticated→401 (not 404).
- `ServiceDiagnostics` stays at `DHAN_DIAGNOSTICS_CONTRACT_VERSION=3` (new field would require amendment per §4.1 MAY exhaustive; §4.3 surfaces gain nothing).
- Reader safeguards reused: existing bearer (`IIPS_MARKET_DATA_TRANSPORT_TOKEN`), constant-time `timingSafeEqual`, loopback-only (`isIncomingLoopback`), read-only, never browser, no unauthenticated fallback, fail-closed when bearer unavailable.
- Security: never credential/token/`vault://`/carrier-path/metadata/DTO/payload/business-identifier/hash/exception/child-output; §4.10 substring coincidence not disclosure where independently generated, never inspect secret for tracing, canary tests retained.

## Verification (IPD)

- **Typecheck:** `npx tsc --noEmit` PASS
- **Build:** `tsc -p tsconfig.json` + `tsc -p tsconfig.dhan-package.json` PASS
- **W-24 synthetic suites:** 30 tests PASS
  - `dhan_w24_identifiers_and_ring` (12): contract v1, opaque UUIDv4, validation fail-closed, ring 1024/512, oldest-eviction, monotonic sequence, limit/sinceSequence, 1 KiB ceiling, 12-field closed enums
  - `dhan_w24_provenance` (5): D01 new/cache/coalesced, copy-on-serve immutability, no D02 invention, untraced backward compat
  - `dhan_w24_failure_and_interaction` (5): closed 13-category mapping, provider failure ring, freshness interaction, high-concurrency bounded, no Dhan header
  - `dhan_w24_http_safeguards` (8): bearer, bounded params (clamped 1024), contract-mismatch 400, disclosure canary (no vault://, 12-field, ≤1 KiB), client propagation, `getTraceRing`, daemon/client correlation (one `actionId` across IRR log→IPD ring→D01 provenance), freshness trace
- **Regression sampled:** `dhan_d7_state_and_disclosure_conformance` + `dhan_p4_operational_controls` + `dhan_p5_service_transport` (27 tests PASS)
- **Guard:** `files=174` discovered, zero bypass

## What IRR must do (next stage)

1. Bump `iips-production-market-data` pin to `0071980` (`gh api contents` fetchable at that SHA, `W24_TRACE_CONTRACT_VERSION=1` present).
2. Implement IRR correlation: mint `actionId` per screen action, send headers on authenticated IRR→IPD loopback, carry into server-side log line and ring.
3. Implement IRR ring (512, same `DhanDiagnosticRing` shape, 1 KiB ceiling, oldest-eviction, never persisted).
4. Pass joined synthetic suite on same `main` pins: one `actionId` appears in IRR `ACTION_START` log, IPD ring `REQUEST_ADMITTED`/`ATTEMPT_END`, D01 `provenance.traceId`; ring bounded, no secret/`vault://`, browser bundle boundary.
5. **Does not close M4** — W-24 is one conjunct of M4 (trace), M4 requires all live-acceptance gates; roadmap authority formal recording of M4 interpretation still pending.

## Artefacts

- Readiness: `docs/integration/DHAN-W24-IPD-IMPLEMENTATION-READINESS-REPORT-2026-11-26.md`
- Implementation: commits `b5f7d3b` (head) → merge `0071980` on `main`
- Evidence: `docs/evidence/DHAN-W24-IPD-IMPLEMENTATION-EVIDENCE-2026-11-26.md`
- Roadmap: `docs/integration/DHAN-LIVE-INTEGRATION-CURRENT-STATE-INVESTIGATION-AND-EXECUTION-ROADMAP-2026-11-25.md` row 30 → **IMPLEMENTED (IPD)** / **VERIFIED (IPD synthetic)**
- This handoff: `docs/integration/DHAN-W24-IPD-IRR-HANDOFF-2026-11-26.md` (pin `0071980`, contract `W24_TRACE_CONTRACT_VERSION=1`)

*End of W-24 IPD handoff. IRR consumes via pin bump; no IRR code from IPD.*
