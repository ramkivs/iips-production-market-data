# W-25 — Configurable Freshness Thresholds: Configuration Contract

**Repository:** `ramkivs/iips-production-market-data` (IPD)
**Work item:** W-25 — Dhan Live Integration: Configurable Freshness Thresholds
**Date:** 2026-11-25
**Status:** contract fixed **before** implementation, as required by the work item.
**Governing decisions:** AD-12 (GOOD / STALE / UNAVAILABLE bands), D-4.3 (D02 freshness from IPD
evidence only), D-3 (market-closed freshness — untouched by this change).

> This document is the specification. It is written first and the implementation follows it
> literally. Where implementation and this document disagree, this document is the defect report.

---

## 1. Why this exists

The worksheet claim for W-25 was verified at `7e42e3d` and is **correct**:

| Worksheet claim | Verified? | Evidence |
|---|---|---|
| Thresholds are compile-time constants | **Yes** | `DEFAULT_FRESHNESS_CONFIG` in `src/quality/freshness_evaluator.ts`; `D02_NOMINAL_THRESHOLD_SECONDS = DEFAULT_FRESHNESS_CONFIG.D02_OHLCV` in `dhan_historical_freshness.ts:153` |
| No override source | **Yes** | No freshness key exists in `DHAN_ENV_KEYS` (`dhan_config.ts:43`); no constructor option on `DhanMarketDataServiceOptions`; no field on `MarketDataDaemonDiagnostics` |
| No validation | **Yes** | The only `parseTimeout`-style parser in the provider validates a timeout, not a threshold |
| No effective-value exposure in diagnostics | **Yes** | `MarketDataDaemonDiagnostics` (daemon L189-211) and `ServiceDiagnostics` (service L188-210) carry no threshold field |

One additional defect was found during the investigation and is corrected here because it is the
same defect class:

- `evaluateFreshness` resolves the threshold at **three** places, and the third one disagrees with
  the first two. Lines 61 and 72 (the invalid-timestamp and invalid-session early returns) use
  `DEFAULT_FRESHNESS_CONFIG[domain]` raw, while line 106 (the classifying return) uses
  `DEFAULT_FRESHNESS_CONFIG[domain] || 3600`. The `|| 3600` fallback is unreachable for a well-formed
  `DataDomain`, so the practical effect is latent — but a configured threshold that an early return
  does not see would make `nominalThresholdSeconds` disagree with the classification applied two
  lines later. W-25 makes the resolution single-sourced, which removes the divergence by construction.

---

## 2. Which thresholds are configurable

**Scope: all nine `DataDomain` values.** Nothing in AD-12 or D-4.3 distinguishes the domains; the
threshold is a per-domain operational tolerance, so the override surface is per-domain and complete.
Declaring only D01/D02 would leave the other seven permanently un-tunable for no stated reason.

| Domain | Default (seconds) | Human equivalent | Permitted override range (seconds) |
|---|---:|---|---|
| `D01_QUOTES` | 900 | 15 minutes | 1 … 604 800 (7 days) |
| `D02_OHLCV` | 86 400 | 24 hours | 1 … 604 800 |
| `D03_FUNDAMENTALS` | 9 072 000 | 105 days | 1 … 31 536 000 (365 days) |
| `D04_CORPORATE_ACTIONS` | 604 800 | 7 days | 1 … 31 536 000 |
| `D05_SECURITY_MASTER` | 2 592 000 | 30 days | 1 … 31 536 000 |
| `D06_NEWS` | 21 600 | 6 hours | 1 … 604 800 |
| `D07_ESTIMATES` | 2 592 000 | 30 days | 1 … 31 536 000 |
| `D08_MACRO` | 3 888 000 | 45 days | 1 … 31 536 000 |
| `D09_ALTDATA` | 1 209 600 | 14 days | 1 … 31 536 000 |

The default column is **exact and unchanged** — `DEFAULT_FRESHNESS_CONFIG` is not edited by this work
item. It remains the source of every default.

### 2.1 Why the bounds are these bounds

A threshold answers "how old may an observation be before AD-12 starts conceding or suppressing it".
Two failure directions matter, and both are bounded:

- **Too small** collapses the GOOD band to nothing: a threshold of `0` makes every observation
  `STALE` at best and `UNAVAILABLE` past an instant, which silently suppresses execution. The lower
  bound is therefore **1 second**, not 0.
- **Too large** makes the platform accept arbitrarily old data as fresh, defeating AD-12. The upper
  bound is therefore a **per-class horizon** rather than one global number: intraday domains (`D01`,
  `D02`, `D06`) are bounded at 7 days, and everything calendar-scaled (filings, corporate actions,
  masters, estimates, macro, alt-data) at 365 days.

`365 days` is the largest horizon at which a "fresh" verdict still describes a *current* fact for
these domains — beyond it, "fresh" and "arbitrary history" are indistinguishable. `7 days` for the
intraday domains is the point past which a quote or a daily close is not a current-market statement at
all, so a larger override would be a misconfiguration rather than a tuning decision.

**The bounds are inclusive.** `1`, `604800`, `31536000` are valid. `0`, `-1`, `604801`, `31536001`,
`1.5`, `NaN`, `Infinity`, `'900'` (a string) are not.

---

## 3. Override source

**Environment variables**, one per domain, chosen in preference to a file because:

1. the operator already drives the daemon through environment configuration (`DHAN_ENV_KEYS`,
   `IIPS_TRADING_CALENDAR_PATH`, `IIPS_DHAN_VAULT_BACKEND`), so there is one configuration idiom and
   no second parsing surface to harden;
2. a threshold is a scalar, not a document — a JSON file would add a schema, a file-not-found path and
   a partial-write path for no benefit;
3. it keeps the change inside the pre-access, no-I/O posture of the provider: nothing new is read from
   disk, so no new path is exposed and no new secret-adjacent surface is created.

**Naming:** `IIPS_FRESHNESS_THRESHOLD_SECONDS_<DOMAIN>`, with `<DOMAIN>` the bare domain tag.

```
IIPS_FRESHNESS_THRESHOLD_SECONDS_D01_QUOTES=300
IIPS_FRESHNESS_THRESHOLD_SECONDS_D02_OHLCV=43200
IIPS_FRESHNESS_THRESHOLD_SECONDS_D03_FUNDAMENTALS=7776000
IIPS_FRESHNESS_THRESHOLD_SECONDS_D04_CORPORATE_ACTIONS=518400
IIPS_FRESHNESS_THRESHOLD_SECONDS_D05_SECURITY_MASTER=2592000
IIPS_FRESHNESS_THRESHOLD_SECONDS_D06_NEWS=10800
IIPS_FRESHNESS_THRESHOLD_SECONDS_D07_ESTIMATES=2592000
IIPS_FRESHNESS_THRESHOLD_SECONDS_D08_MACRO=3888000
IIPS_FRESHNESS_THRESHOLD_SECONDS_D09_ALTDATA=1209600
```

The full key for a domain is derivable by pure concatenation
(`freshnessThresholdEnvKey(domain) === 'IIPS_FRESHNESS_THRESHOLD_SECONDS_' + domain`), so a consumer
never needs a lookup table and the set cannot silently fall out of step with `DataDomain`.

**A direct caller may also pass a resolved map.** `DhanMarketDataServiceOptions.freshnessThresholds`
accepts `Partial<Record<DataDomain, number>>`, resolved through the same validator. This exists so an
embedding consumer (and the test suite) can configure the service without touching `process.env`; it
is not a second precedence tier to reason about, because the two are merged before validation and the
same rule decides both — see §3.1.

### 3.1 Precedence

Explicit option value **wins over** the environment for the same domain. This matches the rest of the
provider (`now`, `cache`, `historicalCache`, `tradingCalendar` are all injected and override ambient
configuration). Domains not supplied by either source use `DEFAULT_FRESHNESS_CONFIG`.

---

## 4. Required validation behaviour

Validation is **per domain and non-fatal**, following the existing `parseTimeout` precedent in
`dhan_config.ts` — the platform must start on a bad threshold, because refusing to boot over a tuning
value trades a degraded freshness band for a total outage.

For each domain, independently:

| Input | Outcome |
|---|---|
| Key absent (and no option value) | `default`, source `DEFAULT`, no issue |
| `'900'` / `' 900 '` | `900`, source `ENVIRONMENT` / `OPTION` |
| `'0'`, `'-5'`, `'604801'`, `'31536001'` | `default`, source `DEFAULT`, issue `OUT_OF_RANGE` |
| `'abc'`, `''`, `'1.5'`, `'NaN'`, `'Infinity'`, `'1e3'` | `default`, source `DEFAULT`, issue `INVALID_NUMBER` |
| Type other than finite integer number (option path) | `default`, source `DEFAULT`, issue `INVALID_NUMBER` |

Two rules that are easy to get wrong and are therefore stated explicitly:

- **Rejection is silent at the point of use but visible in diagnostics.** The evaluator never throws
  and never emits a warning; the rejected value is reported in the diagnostics `freshness` block as
  `source: 'DEFAULT'` with the `issue` naming the reason. The operator sees the fallback in the same
  place they would see the accepted override, so "my override did not apply" is answerable without
  reading logs. This is the `parseTimeout` behaviour plus the observability the worksheet asks for.
- **Partial validity is per-domain.** A valid `D02` override is applied even when `D01` is invalid.
  One bad key never discards the operator's other nine decisions.

`1e3` is rejected rather than accepted as `1000`: the parser accepts only an optionally-signed run of
decimal digits, so the unit is unambiguous and a value can never be read as a different magnitude than
it looks.

---

## 5. Effective values in diagnostics

Diagnostics gain **one** field, `freshness`, on `ServiceDiagnostics`:

```ts
readonly freshness: {
  readonly thresholds: Readonly<Record<DataDomain, number>>;   // effective, every domain
  readonly overrides: readonly {
    readonly domain: DataDomain;
    readonly seconds: number;                                  // effective
    readonly source: 'ENVIRONMENT' | 'OPTION';
    readonly raw: string;                                      // the rejected/supplied literal, sanitized
    readonly issue: 'INVALID_NUMBER' | 'OUT_OF_RANGE' | null;   // null = accepted
  }[];
}
```

Properties that make this an answer rather than a hint:

- **`thresholds` is complete.** All nine domains, always. A consumer never has to merge the response
  with a compiled-in default to learn the effective value, and a domain missing from the map is
  impossible by construction (the map is built by iterating `DataDomain`).
- **`overrides` reports only domains that were *mentioned*, accepted or rejected.** An absent domain is
  unmentioned, which is a different fact from "mentioned and rejected" — collapsing them would hide
  exactly the bug the operator needs to see.
- **`raw` is echoed so the operator can see what was ignored**, and it is a numeric literal by
  construction (it only reaches the payload if it was a string or number that failed validation).
  It never carries anything but the offending scalar; there is no free-form text channel here.

The full map is on **`ServiceDiagnostics`** (the `/v1/diagnostics` payload), not on
`MarketDataDaemonDiagnostics`. The daemon's own diagnostics describe the *process* (host, port, vault
backend, bind outcome); the thresholds are a property of the *service* that evaluates freshness, and
the service is what `/v1/diagnostics` already publishes. Putting the map on the daemon would create a
second copy that could disagree with the served one.

---

## 6. Effect on D02 freshness evaluation

`evaluateFreshness` stays **the owner of the arithmetic** (worksheet scope, verbatim). The change is
only in where it gets the threshold, plus the removal of the three-way divergence:

1. `evaluateFreshness` gains an optional fifth parameter carrying a **resolved** threshold map
   (`ResolvedFreshnessThresholds`), defaulting to `DEFAULT_FRESHNESS_CONFIG` unchanged.
2. A single internal expression resolves the threshold once per call; the three existing uses
   (`nominalThresholdSeconds` on the two early returns, and the classifying threshold) read that one
   value. `|| 3600` is deleted: it was unreachable for a valid domain and it was the only place the
   evaluator could invent a number the configuration did not state.
3. Bands are untouched: `≤ threshold` GOOD, `≤ 2 × threshold` STALE with concession, beyond
   UNAVAILABLE with suppression. `2 ×` is *derived from* the effective threshold, so an override
   moves both the GOOD/STALE edge and the STALE/UNAVAILABLE edge together — the AD-12 contract is not
   re-parameterised, it is re-anchored.

Every D02 consumer therefore follows configuration automatically:

- `projectHistoricalFreshness` (retained-evidence projection) passes the resolved map through;
- `DhanMarketDataService.getFreshness` **stops forcing** `thresholdSeconds: D02_NOMINAL_THRESHOLD_SECONDS`
  and takes the effective value. This is the one deliberate behavioural correction: today a service
  configured for D02 would still *report* the compiled default. `D02_NOMINAL_THRESHOLD_SECONDS`
  remains exported and unchanged as the immutable "what the platform was built with" reference, and
  is what the `NO_OBSERVATION` path reports — there is no observation, so there is no evaluation, so
  the only honest statement is the configured nominal value.
- `freshnessStatus` resolves from the same map for the sites that have no evaluation to read
  (`evaluation?.nominalThresholdSeconds ?? resolved[domain]`).

`D01` quote normalisation, the quote cache, `degraded_state_qualifier` and the UI anomaly monitor call
`evaluateFreshness` with no map and therefore keep compiled defaults exactly; wiring a threshold
source into those layers is a separate decision (see §8).

---

## 7. Compatibility

- **`DEFAULT_FRESHNESS_CONFIG` is unchanged in value and type.** Callers that pass four arguments get
  the same object and the same numbers.
- **`ServiceDiagnostics` gains a required field**, so its contract version moves `1 → 2`, matching the
  W-07 precedent for an additive-but-required field. `validateDhanServiceDiagnostics` validates the new
  block fail-closed (complete map, integer values, whitelisted sources and issues) and rejects `1`.
  The version constant is the contract; leaving it at `1` while the validator rejects `1` payloads
  would be a lie.
- **The `/v1/freshness` response shape is unchanged.** Its `thresholdSeconds` value may differ only
  when an override is configured; with no configuration it is byte-identical to today's.
- Freshness *semantics* — bands, suppression, D02 evidence rules, D-3 market-closed handling — are
  untouched.

## 8. Explicit non-goals

- No threshold source for the non-Dhan call sites (`ingress/pipeline.ts`, `degraded_state_qualifier.ts`,
  `ui10_anomaly_monitor.ts`, `runbooks_harness.ts`). Those layers are not part of the Dhan integration
  and their thresholds are not what the operator tunes. They keep compiled defaults.
- No runtime mutation API. Configuration is read once at construction, so a threshold cannot change
  under a request that is mid-flight, and the diagnostics value cannot drift from the value the
  evaluator used.
- No relaxation of the AD-12 `2 ×` ratio into a second configurable number. One knob per domain.
- No `0` or `Infinity` escape hatch for "never stale". A domain that should not suppress is a policy
  decision for AD-12, not an environment variable.
