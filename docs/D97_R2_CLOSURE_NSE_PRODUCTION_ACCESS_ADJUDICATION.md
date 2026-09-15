# D97: R-2 Closure and NSE Production Access Adjudication

## Executive Summary & Status Classification

- **Act ID:** `D97-R2-ENGINEERING-CLOSURE-NSE-ACCESS-ADJUDICATION`
- **R-2 Engineering Status:** **IMPLEMENTED / TESTED / READY** (Formally Closed)
- **Production Activation Status:** **EXTERNALLY BLOCKED — NSE LICENSING / CREDENTIALS / DATA ENTITLEMENTS**
- **Architecture:** Provider-neutral canonical market-data foundation; strictly NSE Capital Market Equities only; read/analysis only; zero trading/order routing; zero snapshot persistence spam.
- **Direction:** The accepted NSE direction is preserved without reopening provider selection. Kite Connect remains optional and non-authoritative.

---

## 1. R-2 Engineering Closure Status

The engineering portion of R-2 is officially **CLOSED** as **IMPLEMENTED / TESTED / READY**.

The following components are accepted and verified:
1. **Canonical Market Data Contract (v1.0)**: `frontend/server/market-data/canonical-contract.ts` (equities only, frozen structures, immutable quality propagation).
2. **Current NSE CM-UDiFF Parser**: `frontend/server/market-data/cm-udiff-parser.ts` (targets official SEBI/NSE-mandated CM-UDiFF Common Bhavcopy Final; zero dependency on legacy CSV).
3. **NSE-Equity Eligibility Filter**: Filters strictly for Segment `'CM'`, Series `EQ`, `BE`, `BZ`, `SM`, and valid Indian equity ISINs (`INE*` / `IN9*`). Debt (`GS`, `DBT`), corporate bonds, futures (`FO`), mutual funds, warrants, and indices are excluded.
4. **Data-Quality & OHLC Sanity Validation**: `frontend/server/market-data/normalizer.ts` (verifies positive prices, non-negative volume, and complete OHLC sanity: `High >= Low`, `High >= Open`, `High >= Close`, `Low <= Open`, `Low <= Close`).
5. **Quarantine & Reconciliation Controls**: Identical re-ingestions are idempotent; contradictory duplicate records without revision are quarantined under `RECONCILIATION_CONFLICT` without mutating surviving records.
6. **Provider/Adapter Boundary**: `frontend/server/market-data/provider-adapter.ts` (`MarketDataProviderAdapter` decouples internal analytics from exchange protocols).
7. **Deterministic Reference/Mock Adapter**: `ReferenceFileBasedAdapter` using synthetic CM-UDiFF test fixtures.
8. **15-Minute Scheduler Engine**: `frontend/server/market-data/current-state-scheduler.ts` (in-memory updates only; configurable cadence, retries, and backoff).
9. **Current-State Store**: `frontend/server/market-data/market-data-store.ts` (tracks canonical quotes; does **not** persist 15-minute snapshots).
10. **EOD Ingestion Pipeline**: `frontend/server/market-data/eod-pipeline.ts` (multi-stage parser, filter, validator, and store loader).
11. **Configurable 10-Year Backfill Capability**: Supports date ranges, default 10-year trading range (~2500 sessions), incremental backfill, and resumption.
12. **HTTP Transport Handlers**: `frontend/server/market-data/market-data-transport.ts` mounted at `/api/market-data/*` via `executive-transport.ts` and protected by canonical `guardRead`.
13. **UI / Data-Contract Integration**: `frontend/src/api/marketData.ts` and `frontend/src/components/data/MarketDataFreshnessBadge.tsx` mounted in `TopBar.tsx` (visible freshness: `CURRENT`, `STALE`, `UNAVAILABLE` and `GATE ACTIVE` warning).
14. **Automated Verification**:
    - Market Data Parser & Pipeline Suites: **18/18 passed**
    - Full Vitest Regression Suite: **1,103 passed / 0 failed**
    - P12 Gateway Suite: **154 passed / 0 failed**
    - P13 Integration Suite: **86 passed / 0 failed**
    - TypeScript Typechecks: **0 errors** across frontend and server.

---

## 2. Status Classification for Historical Data

In strict compliance with authoritative instructions, actual historical data is classified separately from backfill engineering:

- **10-Year Historical BACKFILL CAPABILITY:** **READY**
  - Fully implemented, verified against multi-day trading calendars, resumable, and idempotent.
- **ACTUAL 10-Year NSE Historical Data Population:** **PENDING EXTERNAL DATA ACCESS**
  - The repository currently contains clearly labelled **synthetic / reference test fixtures only** (`SYNTHETIC_VALID_BHAVCOPY_2026_09_14` and `SYNTHETIC_ANOMALOUS_BHAVCOPY`).
  - No synthetic data is or will be misrepresented as official production historical data.
  - Zero historical trading sessions are claimed as loaded until official NSE CM-UDiFF archive files are provisioned, ingested, and reconciled.

---

## 3. Exact External Dependency & Production Gate

The remaining production barrier is purely external:
1. **Commercial/Non-Commercial Licensing Agreement** with **NSE Data & Analytics Limited** (formerly DotEx International Ltd).
2. **Exchange Data Entitlements**:
   - Official daily **CM-UDiFF Common Bhavcopy Final** distribution entitlement (or authorized SFTP access).
   - Authorized **15-minute delayed equity market-data stream/snapshot entitlement**.
3. **Production Access Credentials**: Secure SFTP/API keys, access secrets, and IP allowlist registration.
4. **Strict Policy Compliance**:
   - Zero scraping or access of undocumented endpoints.
   - Zero commercial redistribution.
   - No automatic purchase of commercial redistributor feeds or Kite Connect.

---

## 4. Exact Authority / Commercial Decision Required

Program Authority (Sai / Ramki) must formally review and decide on the commercial acquisition pathway:
1. **Decision on NSE Commercial vs. Non-Commercial Route**:
   - Determine whether IIPS qualifies for non-commercial research, academic, or single-user tariff treatment under **Clauses 8.1–8.3 of the NSE Data Sharing & Usage Policy**.
   - If not eligible for a non-commercial waiver, determine whether a single-user internal-analysis tier or authorized delayed-data subscription applies.
2. **Kite Connect Status**:
   - Confirm Kite Connect is **not** an authorized market-data provider for IIPS and will not be used for market-data redistribution.
   - Kite Connect remains reserved solely as an optional future integration for personal account portfolio reading if authorized.

---

## 5. Formal Application Package for NSE Data & Analytics Limited

Program Authority should submit the following formal profile to **NSE Data & Analytics Limited (marketdata@nse.co.in / nsedata@nse.co.in)**:

### Deployment & Data Usage Profile
- **Entity & Deployment Model:** Single-user, private institutional investment intelligence platform (`IIPS`).
- **Nature of Use:** Strictly internal, private research, scoring, and analysis only (**non-trading**, **non-execution**, **non-commercial resale**).
- **Redistribution:** **Zero redistribution** to third parties, clients, or public websites (strictly private environment).
- **Target Domain & Universe:** National Stock Exchange of India (NSE) Capital Market segment — **Equities only** (`EQ`, `BE`, `BZ`, `SM` series). No derivatives (`FO`), debt, or currency.
- **Current-State Ingestion:** Approximately **15-minute delayed snapshot** refresh (in-memory state only; raw snapshots are not archived or redistributed).
- **EOD / Historical Ingestion:** Daily **CM-UDiFF Common Bhavcopy Final** file ingestion for 10-year longitudinal equity factor analysis.
- **Requested Determination from NSE Data & Analytics:**
  1. Formal determination whether this single-user, non-redistributed, non-trading research deployment qualifies under **NSE Data Sharing & Usage Policy Clause 8.3** (*"reduced fee arrangements or waivers for Non-Commercial Users / Researchers"*).
  2. In the absence of a waiver, quotation for the lowest-cost authorized tier for 15-minute delayed Capital Market equity data and 10-year EOD CM-UDiFF historical archives.

---

## 6. Production Activation Sequence (Post-Authorization)

Once Program Authority executes the agreement and receives official credentials:

```
[NSE Data & Analytics Authorization & Credentials]
                         ↓
1. Configure Environment Secrets (IIPS_NSE_API_KEY, IIPS_NSE_API_SECRET, IIPS_NSE_LICENSING_ID, IIPS_DATA_DIR)
                         ↓
2. Provision Production Adapter (NseProductionAcquisitionAdapter marked isEntitled = true)
                         ↓
3. Execute Initial Historical Backfill (10 years of official CM-UDiFF Bhavcopy archives via EodIngestionPipeline)
                         ↓
4. Verify Historical Reconciliation & Ingestion Audit Metrics
                         ↓
5. Start 15-Minute Scheduler (CurrentStateScheduler.start() polling authorized endpoint)
                         ↓
6. UI Freshness Badge Automatically Transitions from 'GATE ACTIVE' / 'UNAVAILABLE' to 'NSE CURRENT'
```

---

## 7. Current Git SHA & Working-Tree Status

- **Fixed Arena Branch:** `arena/01a0a438-iips-production-market-data`
- **Head Commit SHA:** `240303b` (and subsequent documentation commit `5ce81df`)
- **Working Tree:** Clean (`git status` reports nothing to commit).

---

## 8. Recommended Next Executable Action

1. **Engineering Action:** Stand down on market-data core engineering. The provider-neutral architecture is complete, verified, and frozen.
2. **Authority Action:** Program Authority (Sai / Ramki) to dispatch the formal application package to NSE Data & Analytics Limited to obtain the official pricing/waiver determination.
3. **No Unrelated Changes:** Maintain full governance over frozen routes and certified computation contracts until external credentials are provisioned.
