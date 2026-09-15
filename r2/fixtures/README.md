# R-2 TEST FIXTURES — ⚠ SYNTHETIC / REFERENCE DATA

## ⚠ THESE ARE NOT NSE DATA. THEY ARE SYNTHETIC TEST FIXTURES.

Every file in this directory is **fabricated test data**, created for R-2 §G.46 because no
Bhavcopy sample or equivalent fixture exists anywhere in this repository (verified: `Bhavcopy`,
`UDiFF` and `CM-UDiFF` each return **0 hits** across `docs/`, `p05/` and `p06/`).

Per R-2 §G.46, no data has been fabricated and represented as official NSE data. Per §G.48, all
fixtures are labelled here and inside each file.

- **Symbols** are invented (`SYNTHALPHA`, `SYNTHBETA`, …). They are not NSE-listed securities.
- **ISINs** are invented. `INE000A01001` and similar are **not** real ISINs. The check digit is
  *not* computed to the real ISO-6166 algorithm; it is chosen only to satisfy the shape check.
- **Prices, volumes and traded values** are invented round numbers.
- **Company names** are invented and prefixed `SYNTHETIC`.
- **Dates** are invented (`2026-01-xx`).

## What IS real

Only the **structure** is real, and it is taken from the published UDiFF standard rather than
invented:

- the CM-UDiFF **ISO tag names** (`TradDt`, `BizDt`, `Sgmt`, `Src`, `FinInstrmTp`, `FinInstrmId`,
  `ISIN`, `TckrSymb`, `SctySrs`, `XpryDt`, `TtlNbOfTxsExctd`, `PrvsClsgPric`, `OpnPric`,
  `HighPric`, `LowPric`, `LastPric`, `ClsPric`, `TtlTradgQty`, `TtlTradgVal`, `NewBrdLotQty`,
  `FaceVal`, `Rsvd01`–`Rsvd04`);
- the UDiFF **file-name convention** `BhavCopy_NSE_CM_0_0_0_YYYYMMDD_F_0000.csv`;
- the **equity vs non-equity series classes** observed in real CM content: `EQ`/`BE` for equities,
  `N`-prefixed (`N2`, `N5`, `N6`, `N8`, `ND`) for debt/NCD, `GB` for Sovereign Gold Bonds.

⚠ The exact **required-tag set** must still be reconciled against NSE's current Format Master
catalogue before any production use. See `docs/r2/R2_READINESS_REPORT.md` §9.

## Files

| File | Purpose (§G.47 case) |
|---|---|
| `BhavCopy_NSE_CM_0_0_0_20260102_F_0000.csv` | **normal daily record** — clean, fully eligible equities |
| `BhavCopy_NSE_CM_0_0_0_20260105_F_0000.csv` | **non-equity instruments** — debt/NCD (`N2`, `ND`) and SGB (`GB`) mixed with equities |
| `SYNTHETIC_quality_cases_20260106.csv` | **missing value**, **malformed record**, **duplicate**, **invalid numeric**, **impossible OHLC** |
| `SYNTHETIC_invalid_date_20260107.csv` | **stale/invalid date** — `tradeDate` after `sourceTimestamp` |
| `SYNTHETIC_legacy_cm_format.csv` | **discontinued legacy CM CSV** — must be **refused** per §F.35 |
| `SYNTHETIC_missing_required_tags.csv` | header lacking required ISO tags — must fail E5 |

## Loading

Use `r2/src/fixtures.js` (`loadFixtures()`), which reads these files and attaches
`synthetic: true` to every resolved source, so R-2 §I.56 (never silently substitute synthetic
data for real historical data) is enforceable by test.
