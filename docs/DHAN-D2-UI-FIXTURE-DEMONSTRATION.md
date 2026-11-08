# DHAN-D2 — UI Fixture Demonstration (Development Only)

**Gate:** DHAN-D2 INTEGRATION & QUALIFICATION HARNESS — UI demonstration
**Execution Mode:** `PRE_ACCESS / SYNTHETIC / OFFLINE`
**Governed under:** AD-01..AD-18 / AD-CHARTER-2026-01
**Status:** development-only mechanism; no production behaviour is changed.

---

## 0. What this document is

It records the **supported development path** for displaying the already-committed DHAN-D2
synthetic fixtures through the **actual running IIPS user interface**, and the boundaries that
path must respect. It proves nothing about real Dhan access: no Dhan credential exists in this
repository, no Dhan endpoint is contacted, and every number rendered comes from
`tests/fixtures/dhan_d2_fixtures.json`.

## 1. Pre-existing mock mechanism: none

Before this demonstration the frontend had **no** mock, fixture, provider-development or
environment-variable mode:

| Probe (over `frontend/src`) | Result |
| --- | --- |
| `import.meta.env` usage | none |
| `VITE_*` variables | none |
| mock / fixture / dev-mode switch | none (only documentation comments) |
| surfaces fetching data | none — surfaces receive canonical payloads as props (`ExecutiveSurface`) or read governed in-process data (`SecurityMasterSurface`) |

The shell is offline by construction (`NON_PRODUCTION / OFFLINE_FIXTURE` governance strip,
footer `Live Providers: 0 (INACTIVE)`). Consequently the D2 fixtures could **not** be displayed
in the running UI without a new, minimal development-only hook.

## 2. The smallest additive mechanism that was added

Four additions, no redesign, no new architecture, no change to any existing surface, contract,
adapter, view model or route inventory:

| File | Role |
| --- | --- |
| `frontend/src/features/dev/dhan-d2-dev-harness.ts` | Wires the committed D2 fixtures through the **existing** path: fixture JSON → in-memory transport → `DhanApiClient` → `DhanMarketDataSource` → `ProviderMarketDataRoute` → `CanonicalEnvelope` → `MarketDataDTO` → `buildProviderRouteDataStateView` → `revaluePortfolioHoldings`. |
| `frontend/src/features/dev/DhanD2DevSurface.tsx` | Presentation only, built from the existing shared components (`DataTable`, `MetricCard`, `MetricGroup`, `FreshnessBadge`, `LoadingState`). Scenario selected from the URL (`?scenario=`), following the `SecurityMasterSurface` precedent. |
| `frontend/src/app/App.tsx` | Adds `DEV_ROUTES_ENABLED` + `DEV_DHAN_D2_ROUTE` and mounts the surface **only** when `import.meta.env.DEV` is true, via `React.lazy`. |
| `frontend/src/vite-env.d.ts` | Ambient typing for the two standard Vite build-mode booleans (`DEV` / `PROD`). No configuration, endpoint, flag or credential is read from the environment. |

Supporting change: `tsconfig.json` gains `"resolveJsonModule": true` so the harness can import
the **existing** fixture file instead of duplicating it. `tests/dhan_d2_ui_mock_demonstration.test.ts`
(10 cases) locks the behaviour down.

### Deliberately NOT done

* The development path is **not** added to the governed `ROUTES` inventory (`frontend/src/app/routes.ts`
  is unchanged) — the certified donor/current-base route map stays exactly as accepted (OPTA-01).
* No navigation entry is added; the surface is reachable by URL only.
* No existing surface, test, contract or fixture was modified.

## 3. How to run it

```bash
npm run dev            # the repository's supported development command (vite, port 5173)
# then open:
http://localhost:5173/dev/dhan-d2                        # CURRENT (default scenario)
http://localhost:5173/dev/dhan-d2?scenario=stale         # STALE
http://localhost:5173/dev/dhan-d2?scenario=unavailable   # UNAVAILABLE
```

No configuration, no `.env` file, no token, no flag: the route exists whenever the Vite dev
server is running, and nowhere else.

## 4. Scenarios (all deterministic, all from the committed D2 fixture file)

| Scenario | Fixture key | Rendered outcome |
| --- | --- | --- |
| `current` | `twoInstrumentQuote` | INFY / TCS **CURRENT** with synthetic prices 1,520.35 / 3,850.5; UNMAPPEDCO **UNAVAILABLE** (`UNRESOLVED_INSTRUMENT`, no price) |
| `stale` | `twoInstrumentStaleQuote` | INFY / TCS **STALE** with the degraded indicator; UNMAPPEDCO **UNAVAILABLE** |
| `unavailable` | `invalidPriceQuote` | every position **UNAVAILABLE**, no price displayed anywhere, portfolio state UNAVAILABLE |

Portfolio section (CURRENT scenario) — produced by the existing BI-08 binding, not by the page:

| Symbol | Qty | Avg | LTP | Current | Unrealised P&L |
| --- | --- | --- | --- | --- | --- |
| INFY | 100 | 1,450.5 | 1,520.35 | 152,035 | 6,985 |
| TCS | 50 | 3,800 | 3,850.5 | 192,525 | 2,525 |
| UNMAPPEDCO | 10 | 100 | not displayed | not displayed | not displayed |

Unpriced positions are never valued at cost, are excluded from the totals, and drag the
portfolio state to UNAVAILABLE (worst-of semantics) — which is why the CURRENT scenario still
reports portfolio state `UNAVAILABLE`.

## 5. Guarantees enforced by the mechanism

| Requirement | How it holds |
| --- | --- |
| Deterministic D2 fixtures only | The harness imports `tests/fixtures/dhan_d2_fixtures.json`; no value is authored in the surface (test D2-UI-01 / D2-UI-10). |
| Clearly synthetic / pre-access | The page shows `PRE_ACCESS / SYNTHETIC / OFFLINE`, the route disclosure, the fixture path and the fixture notice (test D2-UI-07). |
| Never implies live data | No LIVE indicator can render; the banner states explicitly that this is not live Dhan data (test D2-UI-07). |
| Never requires a token | The credential resolver returns the same obviously-synthetic placeholders used by the D1/D2 suites; no secret material exists in source (secret scan: 0 violations). |
| No external call | The transport answers from memory; there is no `fetch` / `XMLHttpRequest` / `WebSocket` / auth in either dev file, and the page displays the external-request counter (always 0) (test D2-UI-08). |
| No production impact | `import.meta.env.DEV` is statically false in a production build, so the route, the surface, the harness and the fixture are eliminated from `dist-frontend` (verified by grep over the built bundle) and the route is not mounted under Node (test D2-UI-09). |
| Provider-neutral downstream | `DHAN` appears only as route/operator metadata (NFR-06); the canonical envelope, `MarketDataDTO` and the portfolio output carry no vendor field. |

## 6. Limitations (explicit)

* This demonstrates **synthetic fixture rendering only**. It is not evidence of Dhan
  authentication, connectivity, coverage, latency, streaming or production readiness.
* The development route is intentionally undiscoverable from the navigation model; it is not a
  product surface and must never be promoted to one without a governing authority act.
* All ACCESS-PENDING items recorded in `docs/DHAN-D2-INTEGRATION-QUALIFICATION.md` remain open.
