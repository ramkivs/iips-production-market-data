# IPD P5 — read-only freshness status

`GET /v1/freshness` uses the existing authenticated local non-production market-data HTTP server. It never starts a refresh, calls the provider, updates the cache/LRU, or schedules work. The daemon still has its existing startup/admission requirements; no new credentials or connectivity are needed to read status.

Queries (URL encoded):

* `domain=D01_QUOTES&companyId=<company>&exchangeSegment=NSE_EQ|BSE_EQ&securityId=ISIN:<isin>:<series>` inspects the exact quote-cache key, with no identity fallback. All four parameters are required exactly once. This is a cache/status lookup, not instrument qualification or a provider request.
* `domain=D02_OHLCV` returns the D02 historical freshness status. Since **W-19** the composed D02 service retains the historical observations it fetches, so this reports real evidence once an observation exists and stays **honestly unknown** before that. It never reports `SNAPSHOT` freshness, never infers an observation timestamp from a candle, and never claims a cache miss without evidence. Its domain threshold (86400 s) is always provided.

## Four-timestamp freshness (W-19 / D-4.3)

D02 freshness is reported from four **independent** instants, each with its own evidence state. None is ever substituted for another:

| Field | Meaning | How IPD obtains it |
|---|---|---|
| `marketTimestamp` | The market event the observation describes (the newest candle period start) | Source-declared; labelled `marketTimestampDerivation: SOURCE_DECLARED_CANDLE_PERIOD_START`, or `NO_OBSERVATION` when the series is empty |
| `providerResponseTimestamp` | When the exchange/provider published the response | Dhan's historical payload declares no such field, so this is `NOT_DECLARED` and null — it is **not** inferred from a candle or from IPD's clock |
| `retrievalTimestamp` | When IPD actually received the provider response | Captured at the fetch boundary, immediately after the transport call |
| `cacheTimestamp` | When IPD stored the observation | The cache entry's own storage instant; null for a just-fetched observation, because nothing is stored at the moment it is served |

`timestampStates` carries the four evidence states independently: `DECLARED`, `NOT_DECLARED` (the source structurally publishes no such instant) or `NOT_AVAILABLE` (nothing produced it yet). `evidenceSource` distinguishes `HISTORICAL_CACHE` (retained evidence backed the report) from `NO_OBSERVATION` (this process holds no historical observation, so the report is unknown — not fabricated). `refreshOutcome` is session history for the most recent historical request — `SUCCESS`, `SKIPPED_FRESH`, `FAILURE` or `UNKNOWN` — and is deliberately independent of retention: a later freshness read does not turn a failure into a success.

**`verdict` is evaluated from `marketTimestamp` only.** A recent `retrievalTimestamp` never makes old data fresh. `asOf`, `observationEvaluatedAt` and `timestampEvidence` stay null/`NOT_AVAILABLE` for D02, because IPD refuses to infer an availability instant from a candle; the declared market instant is reported in `timestamps` and cannot be mistaken for an availability claim.

`revision` describes the served observation's content: `BASELINE` (no retained observation of this identity to compare against — no revision claim is made), `UNCHANGED`, or `REVISED` (with `priorContentDigest`). `contentDigest` is a SHA-256 over canonical candle fields only, so a different retrieval instant does not look like a revision.

## Response fields

The JSON response includes `domain`, `cacheState` (`CURRENT`, `STALE`, `UNAVAILABLE`, `MISS`, or `NOT_AVAILABLE`), `asOf`, `receivedAt`, read-time `evaluatedAt`, original `observationEvaluatedAt`, `timestampEvidence` (`VALID`, `MISSING`, `INVALID`, `NOT_AVAILABLE`), `thresholdSeconds`, `ageSeconds`, `verdict` (`GOOD`, `STALE`, `UNAVAILABLE`, `UNKNOWN`), `staleConcessionActive`, `suppressExecution`, `eligibleForUse`, and `lastRefresh` (`outcome` and `lastFailure`). Null denotes unavailable evidence, including non-finite age for invalid timestamps. Missing/invalid timestamp evidence is never treated as fresh. With no observation, eligibility is false and suppression is true; the verdict is unknown, not a fabricated evaluation.

Quote cache classification and the response use the existing `evaluateFreshness` authority against provider `asOf` at read time. D01 threshold is 900 seconds; D02 is 86400 seconds. At or below the threshold is GOOD, above it through twice the threshold is STALE with concession, and beyond twice it is UNAVAILABLE and suppressed. The evaluator's existing handling of future timestamps remains unchanged. The status applies to freshness only; it does not assert other quality, execution or qualification checks have passed.

`lastRefresh.outcome` is `SUCCESS`, `SKIPPED_FRESH`, `FAILURE`, or `UNKNOWN`. For D01 it records completed quote orchestrator outcomes reached through the composed service, not failed validation before orchestration. For D02 it records historical request outcomes; a request refused before the provider path (service not started, rate limit) leaves it `UNKNOWN` rather than claiming an attempt failed. `lastFailure` is either null or `{ "code": "REFRESH_FAILED", "priorPreserved": boolean }`; provider messages, codes, HTTP details and credentials are deliberately omitted. It reflects the most recent failure even if a later refresh succeeds. `priorPreserved` is the orchestrator's indication that a prior cache entry existed; it is not a claim that entry remains fresh. Diagnostic history is bounded to 256 recently updated keys and is in-memory; `UNKNOWN` includes not-yet-run, evicted and restarted states. Cache eviction or service stop can leave refresh history without an observation. No refresh timestamp or live connectivity is inferred.

Requests with invalid, duplicate, extra or incomplete parameters get HTTP 400; missing/invalid bearer authentication gets 401. Unexpected errors use the existing sanitized HTTP 500 error envelope. Unsupported methods follow the existing 404 convention. The HTTP endpoint shares the existing loopback/production restrictions. The `FreshnessStatus`, `RefreshStatus`, `FreshnessDomain`, `FreshnessRequest`, `MarketDataTransportFreshnessOutcome` types and `validateDhanFreshnessStatus` validator are exported from the server-only `./dhan-server` package.

## Transport client (`MarketDataTransportClient.getFreshness`, W-26)

`MarketDataTransportClient.getFreshness(request)` provides the single shared client boundary for `GET /v1/freshness`. It enforces the exact same preflight and transport guards as `getQuote`, `getHistorical`, `health`, `diagnostics` and `verifyConnection` (non-production refusal, `http:` loopback-only host with no URL credentials or query string, printable ASCII non-whitespace bearer credential, bounded timeout, `redirect: 'error'`, and typed fail-closed error envelopes).

* `D02_OHLCV`: `{ domain: 'D02_OHLCV' }` (domain alone; extra fields fail closed with `MALFORMED_REQUEST`).
* `D01_QUOTES`: `{ domain: 'D01_QUOTES', companyId, exchangeSegment, securityIdentity }` or `{ domain: 'D01_QUOTES', companyId, exchangeSegment, securityId }` (canonical `ISIN:<isin>:<series>`).

Responses are validated fail-closed via `validateDhanFreshnessStatus` (and checked against the requested `domain`), returning `{ ok: true, status: FreshnessStatus }` with full W-19 D02 four-timestamp/revision evidence and W-22 session-calendar fields preserved verbatim, or `{ ok: false, failure: MarketDataTransportFailure }` on any transport, authentication, request, or response-schema failure.

## Historical retention (W-19)

The composed D02 path retains validated, successful historical observations in a bounded LRU (`DhanHistoricalCache`, default 256 entries). Identity is the **complete resolved request identity** — company, exchange segment, ISIN, interval, date range and adjustment — so different intervals and ranges never coalesce. Unresolvable identities are never cached and never reach the vendor. Failures are never cached and never overwrite a retained observation. A repeated identical request is served from retention with **zero provider calls**, reported as `refreshOutcome: SKIPPED_FRESH`.

A cache hit preserves the original `retrievalTimestamp`, `marketTimestamp`, freshness evaluation and revision state, and adds the `cacheTimestamp`; it is never re-stamped as if the provider had just replied. Reads of this status never touch LRU order, never invoke the provider and never mutate retention.
