# DHAN-W19 — D02 Cache and Four-Timestamp Freshness

**Task:** W-19. **Status:** implemented, verified, published for review (not merged).
**Date:** 2026-11-20. **Branch:** `arena/2c0f06ee-iips-production-market-data`.
**Authority:** D-4.3 (approved under D-4 Option C), IPD mirror acceptance `df74b50` (PR #191 merged 2026-11-23T17:56:35Z).
**Predecessor:** PR #190 (W-14 / E4 readiness, open) — W-19 is stacked on it.

---

## 1. What was wrong, stated precisely

D-4.3 required D02 freshness to be reported **strictly from IPD evidence**, using four named instants, and required unknown evidence to stay unknown. Inspection before any edit established the actual gap — and corrected one assumption about it:

| Claim | Verdict | Evidence |
|---|---|---|
| The four-timestamp vocabulary exists somewhere in `src/` | **False** | `grep -rn 'marketTimestamp\|providerResponseTimestamp\|retrievalTimestamp\|cacheTimestamp' src/` returned nothing. Genuinely unimplemented. |
| D02 freshness is hardcoded `SNAPSHOT` | **False for the D02 path** | `getFreshness({domain:'D02_OHLCV'})` already returned honest unknown: `cacheState NOT_AVAILABLE`, `verdict UNKNOWN`, `suppressExecution true`. The `SNAPSHOT` literals in `src/` (`dhan_market_data_source.ts:152`, `dhan_normalizer.ts:247`, `operator_drop/parser.ts:98`, `oq/runtime_readiness.ts:33`, `e2e/lineage_verifier.ts:113,199`) are **D01/envelope/runtime-mode** values and are not on the D02 freshness surface. |
| The composed D02 path bypasses the historical cache | **True** | `dhan_market_data_service.ts:841` said so in a comment; `DhanHistoricalCache` existed but nothing constructed it. |

So the honest statement is: **D02 freshness was already not misleading, but it was empty** — no observation, no provenance, no cache, and therefore no way ever to become non-unknown. W-19 makes it capable of reporting real evidence without ever inventing any. The `SNAPSHOT` requirement in D-4.3 is satisfied by an enforced invariant and a test (`W19-101`, `W19-504`), not by deleting an unrelated literal.

## 2. Architecture

Three new modules, one additive contract change, and a wiring change in the composed service.

| File | Role |
|---|---|
| `src/providers/dhan/dhan_historical_provenance.ts` | **New.** The four-timestamp vocabulary, per-field evidence states, revision model, canonical content digest, and the all-unknown projection. Pure: no clock, no I/O. |
| `src/providers/dhan/dhan_historical_freshness.ts` | **New.** Read-only projection from a retained observation into freshness evidence, evaluated by the **existing** `evaluateFreshness` authority. |
| `src/providers/dhan/dhan_historical_adapter.ts` | `DhanHistoricalNormalizationResult` now carries optional `provenance`; the normalizer builds it from the resolved mapping and the receipt instant supplied by the fetch boundary. |
| `src/providers/dhan/dhan_operational_controls.ts` | `DhanHistoricalCacheEntry` gains optional `provenance`; `set` accepts it; **`peek` added** so a read-only status read cannot mutate LRU order. |
| `src/providers/dhan/dhan_market_data_service.ts` | Wires the cache into `getHistorical`, retains per-identity digests, and reports D02 freshness from retained evidence. |
| `src/providers/dhan/dhan_freshness_status.ts` | `FreshnessStatus` extended **additively** with optional `timestamps`, `timestampStates`, `revision`, `evidenceSource`, `refreshOutcome`. |
| `src/providers/dhan/package.ts` | Exports the new vocabulary on the server-only package. |

**No new freshness authority.** `evaluateFreshness` and `DEFAULT_FRESHNESS_CONFIG` remain the single evaluator; W-19 supplies it better evidence, it does not re-implement thresholds.

**No governed wire-contract change.** The `historicalCacheHits` counter is deliberately **not** added to `/v1/diagnostics`: that is a governed D-7 §4.1 contract and widening it is out of W-19's scope. Retention observability is exposed through `getHistoricalRetentionSummary()` (counts only, no identities) instead.

## 3. The four timestamps, and what each one is not

| Field | Source | Never |
|---|---|---|
| `marketTimestamp` | Newest **source-declared** candle period start, labelled `SOURCE_DECLARED_CANDLE_PERIOD_START` | Never used as `asOf`; never an availability claim |
| `providerResponseTimestamp` | Nothing — Dhan's historical DTO has no publication field | **Never inferred** from a candle or from IPD's clock; always `NOT_DECLARED`, null |
| `retrievalTimestamp` | Captured at the fetch boundary immediately after the transport call | Never substituted into `asOf`; never used as a freshness basis |
| `cacheTimestamp` | The cache entry's own `cachedAt` | Never fabricated for a just-fetched observation (it is `null` there, because nothing is stored at that moment) |

Two deliberate asymmetries, both fail-closed:

- `providerResponseTimestamp` is `NOT_DECLARED` **only once an observation exists**. For a process with no observation at all, all four read `NOT_AVAILABLE` (`NO_DHAN_FRESHNESS_TIMESTAMPS`) — the process cannot claim a structural property about evidence it has never seen.
- A normalizer called directly with a payload the caller did not receive from the provider gets **no** `retrievalTimestamp`, and the field stays `NOT_AVAILABLE`. The value is only ever supplied by the boundary that actually received the response.

`verdict` is evaluated from `marketTimestamp` alone. `asOf`, `observationEvaluatedAt` and `timestampEvidence` remain null/`NOT_AVAILABLE` for D02, because IPD refuses to infer an availability timestamp from a candle (`docs/IPD-P5-FRESHNESS-HTTP.md`). A recent retrieval therefore cannot mask an old observation — proven by `W19-203`: a 31-day-old candle retrieved seconds ago is `UNAVAILABLE` and suppressed.

## 4. Cache behaviour

- **Identity:** `dhanHistoricalCacheKey` over the **resolved** identity (company, segment, ISIN, interval, date range, adjustment). Resolved by the governed registry, never echoed from caller input. Unresolvable → no key → nothing cached and nothing served from cache (`W19-303`).
- **Bounded:** `DhanHistoricalCache`, default 256 entries, LRU eviction, deterministic (`W19-305`).
- **Only successes:** failures are never cached and never overwrite a retained observation (`W19-102`).
- **Zero-call reuse:** a repeated identical request is served from retention with no provider call (`W19-301`).
- **Non-coalescing:** different intervals and ranges never share an entry (`W19-302`).
- **Read-only reads:** freshness reads use `peek` and never touch LRU order or invoke the provider (`W19-304`).

### Provenance survives caching

A cache hit preserves the original `retrievalTimestamp`, `marketTimestamp`, freshness evaluation and revision state, and **adds** `cacheTimestamp`. It is never re-stamped as if the provider had just replied, and a re-read of identical content is not reported as a revision (`W19-404`).

### Revisions

`revision.state` is `BASELINE` (no retained observation of this identity — **no claim** that the content never existed at the vendor), `UNCHANGED`, or `REVISED` with `priorContentDigest`. `contentDigest` is SHA-256 over canonical candle fields only, so a different retrieval instant yields the same digest (`W19-403`) while changed content yields a different one (`W19-402`).

## 5. Scope preserved

- **D02/D114 separation:** no D114 import is added and no D114/PIT path is touched; `B2`/`CV-32` non-production boundary stands (D-4.5). `W19-502` asserts the provenance carries only provider-neutral canonical identity.
- **Provider-neutral consumer boundary:** an early draft carried `provider: 'DHAN'` in provenance and the existing IRR test `IRR-02` failed on it — correctly. The vendor name was removed; `W19-502` now asserts no vendor name, vendor id, credential or `vault://` reference can appear.
- **IID valuation safeguards:** `isAdjusted: false` remains **declared, not assumed** (D-4.4), `coverageClaim: ACCESS_PENDING_UNVERIFIED` is unchanged, no adjustment model is added, and `margin.ts`'s `UNADJUSTED_PRICE_ACROSS_CORPORATE_ACTION` refusal is untouched.
- **D01 freshness:** unchanged. `W19-505` asserts D01 reports no four-timestamp block and no `refreshOutcome`.

## 6. Tests

New: `tests/dhan_w19_d02_freshness_cache.test.ts` — **25 cases, 25 pass, 0 fail, 0 skipped**.

| Group | Cases |
|---|---|
| Unknown stays unknown (`W19-1`) | untouched process; failed retrieval; pre-provider refusal; empty series |
| Four independent instants (`W19-2`) | distinctness + `NOT_DECLARED`; `asOf` never populated; recent retrieval ≠ fresh data; AD-12 band |
| Cache determinism (`W19-3`) | zero-call reuse; non-coalescing; unresolvable identity; read-only reads; bounded LRU; cache instant ≠ retrieval instant; eviction does not blind the report |
| Revisions (`W19-4`) | `UNCHANGED`; `REVISED`; digest excludes provenance; cached revision preserved |
| Safeguards (`W19-5`) | unadjusted + unverified; no vendor leakage; invalid instants refused; HTTP parity; D01 unchanged; anti-skip guard (`W19-AS1`) |

Two existing suites changed behaviour and both changes are corrections, not accommodations:

- `tests/dhan_w11_daemon_configuration.test.ts` — `lastRefresh.outcome` for D02 after a failed pre-flight fetch is now `FAILURE`, not `UNKNOWN`. `UNKNOWN` there would have been the fabrication: an attempt was made and it failed. A request refused *before* the provider path still leaves `UNKNOWN` (`W19-103`).
- `tests/irr_stage2_market_data_route.test.ts` — unchanged; it **caught** the vendor-name leak described in §5. No test was weakened to satisfy it.

### Validation

`npx tsc` → clean. Targeted suites, **154 tests, 154 pass, 0 fail**:

| Suite | Pass |
|---|---|
| `dhan_w19_d02_freshness_cache` | 25 |
| `dhan_d2_integration_qualification` | 23 |
| `irr_stage2_market_data_route` | 12 |
| `dhan_d3c_historical` | 11 |
| `dhan_p4_operational_controls` | 11 |
| `dhan_w08_provider_state_recorder` | 11 |
| `dhan_daily_request_boundary` | 10 |
| `w22_session_freshness` | 9 |
| `w22_real_calendar` | 9 |
| `w22_bse_bounded_calendar` | 8 |
| `dhan_p5_service_transport` | 8 |
| `dhan_w09_diagnostics_endpoint` | 8 |
| `dhan_w11_daemon_configuration` | 6 |
| `ipd_p5_freshness_http` | 3 |

## 7. What this does NOT establish

- **No live provider egress was performed.** No Dhan request, no credential read, no E4 burst. Every test runs on synthetic transports and synthetic credential values; the client's `now` is injected.
- **Not live runtime readiness.** Source inspection plus synthetic tests prove contract behaviour, not vendor behaviour. Real Dhan historical payloads remain unqualified; `coverageClaim` stays `ACCESS_PENDING_UNVERIFIED`.
- **`providerResponseTimestamp` remains structurally absent for Dhan.** W-19 makes that absence explicit and machine-readable; it does not create the field. If the vendor later declares a publication instant, that is a new evidence source and a new decision.
- **No correction feed.** `REVISED` is detected by re-fetch comparison of the same identity, not by a vendor revision stream. Historical observations are expected immutable; W-19 reports divergence when it happens rather than assuming it cannot.
- **No product-grade persistence.** Retention is in-process and bounded; a restart retains nothing, and the status correctly returns to `NO_OBSERVATION`.
- **D-4.4 adjustment modelling is not addressed** — out of scope by decision.

## 8. Roadmap position

**W-19 status: implemented and published for review.** It closes the D-4.3 open obligation ("the composed D02 path calls the adapter directly and does not wire the historical cache/orchestrator, so `providerResponseTimestamp` and `cacheTimestamp` are not yet produced for D02") so far as IPD can close it: `cacheTimestamp` is now produced, `providerResponseTimestamp` is now explicitly and structurally `NOT_DECLARED` rather than silently absent, and both are reported per field with their own evidence state.

**Next step:** **W-20** (real-holder E2E acceptance) lists W-19 as a precondition; that precondition is now satisfied on the IPD side and the remaining W-20 blockers are the IRR/IID side and rights/access, not D02 freshness. The separately-owned obligations that remain open are D-4.4 (adjustment disclosure and `margin.ts` enforcement, IRR/IID-owned) and D-4.5 admission of D114/PIT beyond `B2`/`CV-32`.
