# Governed Schema Specification: Dhan Web UI Summary V1 Format

- **Variant Identifier**: `DHAN_WEB_UI_SUMMARY_V1`
- **Source**: Dhan Web UI Portfolio / Holdings View Summary CSV Export
- **Governance Authority**: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-04-AUTH-2026-01 / BI-07-ACCEPTANCE-2026-01
- **Effective Date**: 2026-09-21
- **Execution Mode**: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
- **Status**: AUTHORIZED_OFFLINE_FORMAT_VARIANT

---

## 1. Context & Motivation

During BI-07 Windows acceptance testing, user testing utilized an actual holdings export generated from the Dhan Web UI (`Portfolio(2).csv`). Under initial BI-04 governance, only the Dhan Detailed Holdings Report format (`DHAN_DETAILED_HOLDINGS_V1`) was authorized. The detector properly failed closed with `UNKNOWN` on the un-governed Web UI layout.

This schema amendment establishes `DHAN_WEB_UI_SUMMARY_V1` as a formally governed, deterministic, fail-closed offline broker import variant within IIPS.

---

## 2. Governed Header Signatures

### 2.1 Existing Governed Variant: `DHAN_DETAILED_HOLDINGS_V1`
- **Header Layout**:
  `Trading Symbol, ISIN, Exchange, Total Qty, DP Qty, Available Qty, Average Buy Price, Last Traded Price, Current Value, Profit / Loss, P&L %`
- **Characteristics**: Contains explicit ISIN, Exchange, and full breakdown of depository / trading quantities.

### 2.2 New Governed Variant: `DHAN_WEB_UI_SUMMARY_V1`
- **Canonical Header Layout**:
  `Name, Quantity, Avg Price, Last Traded, Investment, Current Value, P&L, P&L %`
- **Detector Invariant Signature**:
  Row must contain all core distinctive headers: `Name`, `Quantity` (or `Qty`), `Avg Price`, `Last Traded`, `Investment`, `Current Value`.
- **Ambiguity Guard**: Generic financial headers with only 1–2 columns fail closed as `UNKNOWN`.

---

## 3. Deterministic Field Mapping

| Dhan Web UI Column | Canonical Ingress Field | Target Type | Normalization & Mapping Semantics |
| :--- | :--- | :--- | :--- |
| `Name` | `symbol` / `securityName` | `string` | Converted to uppercase trimmed string; serves as security identifier for P04/P12 master lookup. |
| `Quantity` | `quantity` | `number` | Positive float/integer; non-positive or NaN values are rejected under `NON_POSITIVE_QTY`. |
| `Avg Price` | `averageBuyPrice` | `number` | Positive cost basis per share; parsed via `parseNumericCell`. |
| `Last Traded` | `currentPrice` (LTP) | `number` | Positive market price per share; fallback to `averageBuyPrice` if zero, or rejected if non-positive. |
| `Investment` | `investedValue` | `number` | Total cost basis as reported by broker (`Quantity * Avg Price`); preserved in row metadata. |
| `Current Value` | `marketValue` | `number` | Total market valuation (`Quantity * Last Traded`); used for 100.0000% portfolio weight normalization. |
| `P&L` | `pnl` | `number` | Absolute profit / loss as reported by broker; preserved in row metadata. |
| `P&L %` | `pnlPercentage` | `number` | Percentage profit / loss as reported by broker; preserved in row metadata. |
| *[Omitted]* | `isin` | `undefined` | Never fabricated or guessed from CSV text. |
| *[Omitted]* | `exchange` | `undefined` | Never fabricated or guessed from CSV text; defaults to NSE/BSE resolution during P04 lookup. |

---

## 4. P04 / P12 Security Master Identity Resolution Rules

Because `DHAN_WEB_UI_SUMMARY_V1` omits explicit `ISIN` and `Exchange` columns:
1. **Resolution Path**:
   - The uppercase `Name` field is first queried against `SecurityMaster` with `identifierType: 'NSE_SYMBOL'`.
   - If not resolved on NSE, it is queried against `SecurityMaster` with `identifierType: 'BSE_SYMBOL'`.
2. **Fail-Closed Constraints**:
   - If no active mapping is found at the given `asOf` date: `SecurityMaster` throws `IdentityAmbiguityError('UNMAPPED_IDENTIFIER')`. Ingress halts with `REJECTED` disposition and reason `UNMAPPED_IDENTITY`.
   - If multiple conflicting canonical entities match the symbol: `SecurityMaster` throws `IdentityAmbiguityError('AMBIGUOUS_COLLISION')`. Ingress halts with `REJECTED` disposition and reason `IDENTITY_AMBIGUITY`.
   - **Prohibitions**: Under NO circumstances is a `companyId` fabricated from the raw `Name` string, nor is any non-deterministic guessing permitted.

---

## 5. Weight Normalization & Provenance Guarantees

- **Weight Normalization**: Individual constituent weights are derived from `marketValue / totalPortfolioMarketValue * 100` and normalized to sum to exactly `100.0000%` across all active constituents.
- **Cryptographic Provenance**: Deterministic SHA-256 content digest computed over raw CSV bytes; SHA-256 lineage digest computed over normalized holdings payload.
- **Atomic Persistence**: Validated holding vectors are committed atomically via `PortfolioStore.saveHoldings()`.

---

## 6. Backward & Cross-Broker Compatibility

- **Zerodha Kite CSV**: Fully preserved with zero regressions.
- **Dhan Detailed Holdings CSV (`DHAN_DETAILED_HOLDINGS_V1`)**: Fully preserved with zero regressions.
- **Groww Stocks CSV**: Fully preserved with zero regressions.
- **XLSX Format**: Remains explicitly blocked and deferred to milestone BI-06.
- **Live Providers**: 0 active / offline local fixture execution only.
