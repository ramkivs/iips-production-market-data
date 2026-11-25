# W-25 — Configurable Freshness Thresholds: Completion Record

**Repository:** `ramkivs/iips-production-market-data` (IPD)
**Work item:** W-25 — Dhan Live Integration: Configurable Freshness Thresholds
**Date:** 2026-11-25
**Branch:** `arena/f93e947f-iips-production-market-data`
**Contract (written first):** [`DHAN-W25-CONFIGURABLE-FRESHNESS-THRESHOLDS-CONTRACT-2026-11-25.md`](DHAN-W25-CONFIGURABLE-FRESHNESS-THRESHOLDS-CONTRACT-2026-11-25.md)

Exit criteria: **effective thresholds are visible and adjustable; defaults preserved.**

---

## 1. Investigation — the worksheet claim, verified

The worksheet said the thresholds are compile-time constants with no override source, no
validation and no effective-value exposure. Verified at `7e42e3d`, and **confirmed on all
three counts**:

| Claim | Verified | Evidence |
|---|---|---|
| Compile-time constants | Yes | `DEFAULT_FRESHNESS_CONFIG` (`src/quality/freshness_evaluator.ts`); `D02_NOMINAL_THRESHOLD_SECONDS = DEFAULT_FRESHNESS_CONFIG.D02_OHLCV` (`dhan_historical_freshness.ts:153`) |
| No override source | Yes | No freshness key in `DHAN_ENV_KEYS`; no option on `DhanMarketDataServiceOptions`; no field on either diagnostics contract |
| No validation | Yes | The only provider parser, `parseTimeout`, validates a timeout |
| No effective-value exposure | Yes | `ServiceDiagnostics` and `MarketDataDaemonDiagnostics` carried no threshold |

**One additional defect found and corrected.** `evaluateFreshness` resolved the threshold at
three points: lines 61 and 72 (the invalid-timestamp and invalid-session early returns) read
`DEFAULT_FRESHNESS_CONFIG[domain]` raw, while line 106 (the classifying return) read
`DEFAULT_FRESHNESS_CONFIG[domain] || 3600`. A configured threshold could therefore be *reported*
by one return and not *applied* by another. The `|| 3600` was also the only place the evaluator
could invent a number configuration never stated. W-25 resolves the threshold once per call, so
the divergence is removed by construction rather than patched at each site.

---

## 2. Configuration contract (summary — full text in the contract document)

| Item | Decision |
|---|---|
| Configurable thresholds | All nine `DataDomain` values |
| Defaults | `DEFAULT_FRESHNESS_CONFIG`, **unchanged in value and type** |
| Override source | `IIPS_FRESHNESS_THRESHOLD_SECONDS_<DOMAIN>` (environment), plus `DhanMarketDataServiceOptions.freshnessThresholds` for an embedding caller. Option wins over environment. |
| Permitted range | Whole seconds, `[1, max]` inclusive. `max` = 604 800 for `D01`/`D02`/`D06`; 31 536 000 for `D03`/`D04`/`D05`/`D07`/`D08`/`D09` |
| Validation behaviour | Per-domain, non-fatal, silent at the point of use (`parseTimeout` precedent). Rejection recorded for diagnostics with an explicit `issue`. `1e3`, `1.5`, `0x10` rejected rather than reinterpreted |
| Effective-value exposure | `ServiceDiagnostics.freshness` = complete `thresholds` map + `overrides` dispositions |
| D02 effect | Band arithmetic unchanged and still owned by `evaluateFreshness`; only the threshold it is anchored to becomes configurable. `2×` concession edge derives from the effective value |
| Non-goals | No source for the non-Dhan call sites; no runtime mutation; no separately configurable `2×` ratio; no "never stale" escape hatch |

---

## 3. Implementation

| Change | File |
|---|---|
| Resolver: domain list, env key derivation, bounds, per-domain adjudication, frozen output | `src/quality/freshness_thresholds.ts` (**new**) |
| `evaluateFreshness` accepts an optional threshold map; **single** resolution per call; `|| 3600` removed | `src/quality/freshness_evaluator.ts` |
| `export * from './freshness_thresholds.js'` | `src/quality/index.ts` |
| `projectHistoricalFreshness` accepts and forwards the map | `src/providers/dhan/dhan_historical_freshness.ts` |
| `freshnessStatus` accepts and forwards the map; fallback is the effective value | `src/providers/dhan/dhan_freshness_status.ts` |
| Service option `freshnessThresholds` + `freshnessEnv`; resolve once at construction; `getFreshness` stops forcing the compiled D02 constant; `freshness` block on diagnostics; `validateDhanDiagnosticsFreshness`; contract version `1 → 2` | `src/providers/dhan/dhan_market_data_service.ts` |
| Daemon passes its resolved environment | `src/providers/dhan/dhan_local_daemon.ts` |
| Package surface: `validateDhanDiagnosticsFreshness` + two types | `src/providers/dhan/package.ts` |
| W-11 operations doc: diagnostics row describes `contractVersion: 2` and the `freshness` block | `docs/integration/DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md` |

### Design points worth stating

1. **`evaluateFreshness` is still the sole owner of the arithmetic.** W-25 changes *which*
   threshold it is handed, never how AD-12 bands are applied.
2. **The service never reads `process.env` implicitly.** `freshnessEnv` is supplied, matching
   `resolveDhanProviderConfig(env)` and `DhanApiClient`'s `envOverride`. Tests stay hermetic
   regardless of the ambient environment; the daemon passes its own resolved environment.
3. **`D02_NOMINAL_THRESHOLD_SECONDS` is retained and unchanged** as the immutable compiled
   reference. The `NO_OBSERVATION` D02 path reports the *effective* value because there is no
   observation to evaluate — the honest statement is the configured nominal threshold.
4. **The contract version moved.** `freshness` is required on the payload, so leaving the
   version at `1` while `validateDhanServiceDiagnostics` rejects `1` would be a false contract.
   This follows the W-07 precedent for an additive-but-required field.

---

## 4. Completion evidence

| Field | Result |
|---|---|
| **Configuration implementation** | `src/quality/freshness_thresholds.ts` — `resolveFreshnessThresholds(env, overrides)` returns a frozen, complete `ResolvedFreshnessThresholds` plus the per-domain override dispositions. Wired into the evaluator, the D02 projection, `freshnessStatus` and the service. |
| **Override mechanism** | `IIPS_FRESHNESS_THRESHOLD_SECONDS_<DOMAIN>` environment keys (key = prefix + bare domain, no lookup table) and `DhanMarketDataServiceOptions.freshnessThresholds`. Option wins over environment; environment wins over the compiled default. Resolved once at construction, so no threshold can change mid-request. |
| **Validation** | Per domain, non-fatal. `INVALID_NUMBER` for anything that is not an optionally-signed decimal integer (`abc`, `''`, `1.5`, `1e3`, `NaN`, `Infinity`, `0x10`, non-integer/non-numeric option values); `OUT_OF_RANGE` outside `[1, max]` for the domain class. A rejected value reports `source: 'DEFAULT'`, the value that actually applies, the echoed `raw` literal, and the `issue`. One bad key never discards the others. |
| **Default preservation** | `DEFAULT_FRESHNESS_CONFIG` unchanged — asserted value-by-value in W25-102 and again in W25-101 for the resolver. W25-104 proves a four-argument (unconfigured) evaluation is byte-identical to an evaluation handed the default map. |
| **Effective-value diagnostics** | `ServiceDiagnostics.freshness` = `{ thresholds: Record<DataDomain, number> (complete), overrides: [{ domain, seconds, source, raw, issue }] }`, published on `/v1/diagnostics` and read through `MarketDataTransportClient.diagnostics()`. `validateDhanServiceDiagnostics` validates it fail-closed: a missing domain, an invented domain, a non-integer, a duplicate override domain, an unknown `source`/`issue`, or a reported `seconds` that disagrees with the map is rejected outright. |
| **D02 integration** | `projectHistoricalFreshness` forwards the map; `getFreshness` reports the effective `thresholdSeconds` instead of the forced compiled constant. W25-704 fetches through the real adapter and shows one and the same retained observation classified `cacheState: CURRENT` / `verdict: GOOD` under the 24h default, and `cacheState: STALE` / `verdict: STALE` (concession, still eligible) under a configured 3600s threshold — with the reported `thresholdSeconds` matching the effective value in both cases. Bands unchanged: W25-502 pins 300 GOOD / 301 STALE / 600 STALE / 601 UNAVAILABLE+suppressed. |
| **Regression tests** | New suite `tests/dhan_w25_configurable_freshness_thresholds.test.ts` — **37/37 pass**. W-19 `dhan_w19_d02_freshness_cache` 54 tests across the five freshness suites pass unchanged. Two suites were *updated for the deliberate contract bump*, not to make a failure disappear: `dhan_w09_diagnostics_endpoint` (version `1 → 2`, `freshness` in the governed key set, version-1 payload now rejected) and `dhan_w11_daemon_configuration` (constant and served version). |
| **TypeScript verification** | `npm run build:tsc` → exit 0, zero errors. |
| **Relevant CI** | Full guarded suite `npm test` → `[test-guard] OK — 2263 test(s) executed, 2249 passed, exit 0` (14 skipped, 0 failed). Package consumer `npm run test:package-consumer` → `PASS` (`forbiddenHits: []`, strict declaration check, loopback round-trip). |
| **Commit and PR** | See §7. |
| **Outstanding work** | None for W-25's stated scope. See §6 for what is deliberately out of scope. |

---

## 5. Sequence reconciliation — W-25 is independently executable

The worksheet calls W-25 independently executable. The parallel-lane table orders the IPD
freshness lane `W-26 → W-23 → W-25`. **Both are true, and they are not in conflict: the lane
order is scheduling, not a data dependency.** Recorded evidence:

| Question | Evidence |
|---|---|
| Does W-25 require W-26 (transport `getFreshness`)? | **No.** W-26 adds a method to `MarketDataTransportClient`. W-25's work is server-side: the evaluator, the resolver, the service, and the `/v1/diagnostics` payload that is *already* consumed by `diagnostics()`. W25-801/802 prove the freshness read and the diagnostics read work over loopback **as they exist today** — nothing W-26 adds was needed. |
| Does W-25 require W-23 (persistence)? | **No.** W-23 persists cache/freshness/observed state across restarts. W-25 configures the *threshold*, which is a start-up input. A persisted observation evaluated under a new threshold is correct behaviour with no dependency in either direction; W25-704 exercises exactly that (retain, then evaluate under a configured threshold) without any persistence store. |
| Does W-25 conflict with W-23's provider-package boundary? | **No.** W25 changes `DhanMarketDataServiceOptions` (two optional fields), `ServiceDiagnostics` (one field, versioned) and the package export list (one function, two types). W-23's boundary concern is *import isolation* for the storage port; no storage type is introduced here. |
| Does W-25 conflict with W-26? | **No.** W-26 must not change freshness semantics; W-25 changes thresholds, not semantics. The one shared surface is the `/v1/freshness` response, whose **shape** W-25 leaves untouched (W25-801 asserts the served shape end to end) and whose `thresholdSeconds` value W-26 will simply carry. |
| Does W-25 collide with W-24's daemon change? | Only at `dhan_market_data_service.ts`/`dhan_local_daemon.ts`, and by addition only. The roadmap's own mitigation ("keep clear of W-24's daemon change") is satisfied: the daemon edit is one added `freshnessEnv: env` line. |

**Conclusion.** W-25 has **no prerequisite**. Running it before W-26/W-23 is safe and, because
it touches the diagnostics contract that both of them read, running it **first** avoids a
sequence in which two other items' tests must be re-baselined for the version bump afterwards.
The `W-26 → W-23 → W-25` order stands as a lane-ordering preference, not a dependency.

---

## 6. Deliberately out of scope

- **Non-Dhan call sites keep compiled defaults.** `ingress/pipeline.ts`, `degraded_state_qualifier.ts`,
  `ui10_anomaly_monitor.ts` and `runbooks_harness.ts` call `evaluateFreshness` without a map. They
  are not the Dhan integration and their thresholds are not what the operator tunes. Extending the
  source to them is a separate decision with its own blast radius.
- **No runtime mutation.** Configuration is fixed at construction so the published value cannot
  drift from the applied value.
- **No second configurable edge.** `2 ×` remains derived; one knob per domain.
- **No "never stale" setting.** AD-12 conformance is not an environment variable.

---

## 7. Operator quick reference

## W-25 operator reference (effective-value tuning)

### Configure

```
# Environment, read once when the daemon constructs the service.
IIPS_FRESHNESS_THRESHOLD_SECONDS_D02_OHLCV=43200
```

Key = `IIPS_FRESHNESS_THRESHOLD_SECONDS_` + the bare `DataDomain` tag. Permitted values are
whole seconds in `[1, max]`, where `max` is 604 800 (7 days) for the intraday domains
`D01_QUOTES`, `D02_OHLCV`, `D06_NEWS`, and 31 536 000 (365 days) for the calendar-scaled
domains `D03`–`D05`, `D07`–`D09`.

### Confirm it applied

```
curl -s -H "authorization: Bearer $IIPS_MARKET_DATA_TRANSPORT_TOKEN" \
  http://127.0.0.1:8791/v1/diagnostics | jq '.freshness'
```

```json
{
  "thresholds": { "D01_QUOTES": 900, "D02_OHLCV": 43200, "...": 0 },
  "overrides": [
    { "domain": "D02_OHLCV", "seconds": 43200, "source": "ENVIRONMENT", "raw": "43200", "issue": null }
  ]
}
```

`thresholds` is always complete for all nine domains — it is what the evaluator used, not a
hint. `overrides` lists only domains you mentioned. A rejected value appears here with
`source: "DEFAULT"`, the value that actually applies, and `issue` naming the reason:

| `issue` | Meaning | What to do |
|---|---|---|
| `INVALID_NUMBER` | Not an optionally-signed run of decimal digits (`abc`, `1.5`, `1e3`, `0x10`) | Use whole seconds |
| `OUT_OF_RANGE` | Integer, but outside `[1, max]` for that domain class | Pick a value inside the class horizon |

A rejected override is **non-fatal**: the platform starts, that domain keeps its compiled
default, and the other domains keep whatever you configured. Nothing is logged and lost —
the disposition is in the payload you already read.

### Check classification too

`GET /v1/freshness?domain=D02_OHLCV` returns `thresholdSeconds` equal to the effective value
above, and classifies the retained observation against it. AD-12 bands are unchanged:
`≤ 1×` GOOD, `≤ 2×` STALE (concession, still usable), beyond `2×` UNAVAILABLE (suppressed).
Changing the threshold moves both edges together, because `2 ×` is derived, not configured.

---

## 8. Final status

**W-25 COMPLETE — exit criteria met.** Effective thresholds are visible (complete map on
`/v1/diagnostics`, aligned with the served `/v1/freshness` value) and adjustable (environment
or option, validated and bounded); defaults are preserved exactly and proven so by test.
`evaluateFreshness` remains the owner of the AD-12 arithmetic; only its anchor is configurable.

Freshness semantics, D-3 market-closed handling, D-4.3 D02 evidence rules and the W-19
four-timestamp model are untouched. No credential material enters the new payload; the only
echoed input is the rejected scalar literal, bounded to 64 characters.
