# DHAN-D2 — Integration & Qualification Harness — Evidence Report

**Gate:** `DHAN-D2-INTEGRATION-QUALIFICATION-HARNESS`
**Label:** `PRE_ACCESS / SYNTHETIC / OFFLINE`
**Governing standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Date:** 2026-09-25

## 0. Access disclaimer

Real Dhan API credentials were **not available**. No real Dhan authentication was attempted, no
real Dhan API call was made, no external network contact occurred, and **no Dhan connectivity,
no Dhan historical coverage and no production readiness is claimed**. All evidence below comes
from locally authored deterministic synthetic fixtures and proves integration correctness of
the pre-access harness only.

## 1. Baseline

| Item | Value |
| --- | --- |
| Authoritative baseline | `main @ 4d3e1cdca3a33da0ec3be8b336b17128108a502c` (unchanged) |
| D1 durability commit | `74c9065f5671fc71f4f9e0de55583f019631de8b` (verified present, LOCAL == REMOTE, clean) |
| Branch | `arena/01a0d943-iips-production-market-data` |

## 2. Architecture preserved

```
Dhan API → DhanApiClient → DhanMarketDataSource → MarketDataSource<T> (existing SPI)
        → CanonicalEnvelope<MarketQuotePayload> (existing contract)
        → ProviderMarketDataRoute (provider-NEUTRAL, imports no vendor code)
        → MarketDataDTO (existing product transport)
        → portfolio revaluation · UI data-state · UI11 provenance view model
Historical: DhanHistoricalAdapter → OHLCVCandle (existing canonical D02 contract)
```

No Dhan-specific downstream contract was introduced; the canonical architecture was not
redesigned; the provider-neutral layer was not bypassed.

## 3. Instrument mapping integration (Task 2)

| Behaviour | Evidence |
| --- | --- |
| Valid synthetic mapping | DHAN-D2-01 — 2 accepted, 0 rejected, `preAccessOnly: true` |
| Malformed mapping | DHAN-D2-02 — 6 malformed row shapes, all `MALFORMED_INSTRUMENT_MAPPING` with field path |
| Duplicate / conflicting | DHAN-D2-03 — `COMPANY_ID_REMAPPED` and `SECURITY_ID_REUSED` rejected; identical row idempotent |
| Missing mapping | DHAN-D2-04 — `NO_MAPPING_DATA_LOADED` (empty registry) |
| Unknown instrument | DHAN-D2-04 — `UNMAPPED_COMPANY_ID` → `UNRESOLVED_INSTRUMENT` |
| Identity integration | DHAN-D2-05 — ISIN resolved through the existing P04 SecurityMaster; result carries canonical identity only, no Dhan id; unmapped ISIN → `IDENTITY_RESOLUTION_FAILURE` |

No real Dhan security identifiers are present; synthetic rows are tagged
`SYNTHETIC_PRE_ACCESS_FIXTURE` and use visible `SYNTH-NSE-EQ-*` placeholders.

## 4. CURRENT / STALE / UNAVAILABLE (Task 3)

| Input | Canonical quality | Product state | Evidence |
| --- | --- | --- | --- |
| Valid + fresh | GOOD | **CURRENT** | DHAN-D2-06 |
| Valid + expired freshness (AD-12 band) | STALE | **STALE** (degraded flag) | DHAN-D2-07 |
| Beyond 2× threshold / absent instrument | — | **UNAVAILABLE** | DHAN-D2-08 |
| Invalid (missing field, bad price, bad timestamp, cross-field) | — | **UNAVAILABLE** | DHAN-D2-09 |

The existing `evaluateFreshness` implementation is used unchanged; stale data can never
present as CURRENT (state derives solely from canonical quality).

## 5. Portfolio integration (Task 4) — DHAN-D2-10 … 13

Synthetic worked example (fixture values, not real prices):

| Position | Qty | Avg buy | LTP | Prev close | Day change | Current value | Unrealized P&L | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INFY | 100 | 1450.50 | 1520.35 | 1508.00 | +1,235.00 | 152,035.00 | +6,985.00 (4.82%) | CURRENT |
| TCS | 50 | 3800.00 | 3850.50 | 3810.00 | +2,025.00 | 192,525.00 | +2,525.00 (1.33%) | CURRENT |
| UNMAPPEDCO | 10 | 100.00 | — | — | — | **null** | **null** | UNAVAILABLE |

Portfolio: invested 336,050.00 · current 344,560.00 · unrealized P&L +9,510.00 · day change
+3,260.00 · priced 2 / unpriced 1 · weights over priced positions sum to 100.00%.
Timestamps and source metadata (`asOf`, 64-char `lineageDigest`, `CANONICAL_MARKET_DATA`) are
carried per position. Stale prices degrade `portfolioState` to STALE (DHAN-D2-11). Unpriced
positions are never valued at cost (DHAN-D2-12). The binding is provider-neutral: the identical
path runs on canonical data built without any Dhan involvement (DHAN-D2-13). Existing
import-time portfolio calculations were not modified.

## 6. UI / data-state integration (Task 5) — DHAN-D2-14 … 16

`buildProviderRouteDataStateView` renders, using the existing `AccessibilityEngine` indicators:

```
Provider: DHAN     State: CURRENT     Price: 1520.35     Timestamp: 2026-09-25T09:59:58.000Z
Disclosure: PRE_ACCESS / SYNTHETIC / OFFLINE — qualification harness output; not live provider data
```

STALE (price 1519.00, degraded indicator) and UNAVAILABLE (price `null`, timestamp `null`,
reason `TRANSPORT_FAILURE`) are equally representable. The existing
`UI11ProvenanceAuditorBuilder` consumes the canonical provenance with the masked
`TIER_2_COMMERCIAL` vendor tier. No UI redesign was performed; no raw vendor DTO reaches the UI.

## 7. Historical adapter preparation (Task 6) — DHAN-D2-17 … 19

Request model, date-range model, instrument-mapping input, vendor DTO boundary, canonical
normalization to the **existing** `OHLCVCandle` (D02) contract and per-candle validation are in
place. Synthetic series of 3 daily candles normalizes correctly (`interval: 1d`,
`isAdjusted: false`). Deterministic failures: ragged series, missing series, empty series,
invalid price, invalid timestamp, authentication failure, unresolved instrument (no request
attempted) and credentials-unavailable (no request attempted).

**No live historical request was performed. Real coverage is
`ACCESS_PENDING_UNVERIFIED`; no number of years of real Dhan history is claimed.**

## 8. Failure / resilience matrix (Task 7) — DHAN-D2-20

15 cases, each asserted to yield state `UNAVAILABLE`, the expected deterministic code, **zero**
priced portfolio positions, `portfolioState = UNAVAILABLE` and `displayPrice = null`:
authentication failure · timeout · transport failure · HTTP 503 · rate limited · malformed
response · provider status failure · missing required field · unresolved instrument · stale
suppressed · instrument absent · invalid timestamp · invalid price · canonical cross-field
violation · credentials unavailable.

## 9. Provider boundary (Task 8) — DHAN-D2-21 / 22

Vendor tokens (`dhan`, `last_price`, `net_change`, `last_trade_time`, `nse_eq`, `synth-nse-eq`,
`securityid`) are absent from the canonical envelope, the `MarketDataDTO`, portfolio output, the
UI view model, canonical candles, coverage reports and canonical identities. The
`MarketDataDTO` key-set is unchanged. The vendor label exists **only** as route-level operator
metadata sourced from the symbolic SPI `providerId`.

## 10. Security validation (Task 9) — DHAN-D2-23

`scanDirectoryForSecrets` over `src/providers`, `frontend/src/features/portfolio/market-data`,
`evidence/dhan-d1` (plus the pre-existing SEC-01 scan of `src`, `tests`, `frontend`): **0
violations**. No credential in fixtures, documentation, evidence or test output; console output
during the full harness run is empty; synthetic identifiers remain visibly synthetic.

## 11. Validation (Task 10)

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npx tsc` (build) | PASS |
| `npx vite build` | PASS |
| DHAN-D1 suite | 21/21 PASS |
| DHAN-D2 suite | 23/23 PASS |
| `npm test` (full repository) | **586/586 PASS, 0 FAIL** |

No existing test was weakened or modified.

## 12. ACCESS-PENDING

Real authentication · real endpoint/field verification · real instrument-master mappings · real
historical coverage/adjustment policy · live latency and rate limits · streaming feed · live
freshness against the exchange clock.

**Next gate:** DHAN-D3 (not started; requires real Dhan access inputs and separate authorization).
