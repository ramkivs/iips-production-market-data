# D05 Wave-3 — Authoritative Source Readiness

- Verdict: **DEPOSITION_BLOCKED** (at least one MANDATORY D05 field is unresolved/conflicting — see blocking reasons)
- Missing sources: none

## Tick-size evidence

- mode: uniform
- uniformValue: 0.05 (act-bound, never a hidden default)
- universe coverage denominator (securities): 2390

## Sources

| Source | Path | Status | SHA-256 | Rows (valid/total) | Distinct ISIN | Duplicates |
|---|---|---|---|---|---|---|
| nse | /tmp/nse_eq_master.csv | OK | `620789245fe50170…` | 2390/2390 | 2390 | 0 |
| bse | /tmp/b05/extracted/arena_bse_identity_bridged.csv | OK | `a4d0ac883b3dcde4…` | 2290/2390 | 2290 | 0 |
| mca | /tmp/b05/extracted/arena_mca_identity_bridged.csv | OK | `930df3ca9d3365b1…` | 2298/2390 | 2298 | 0 |
| taxonomy | /tmp/b05/extracted/arena_taxonomy_submission.csv | OK | `4965ad0c9086c722…` | 2390/2390 | 2390 | 0 |

## Blocking reasons

- 100 of 2390 NSE securities have no BSE listing match (bseSymbol/bseScripCode cannot be provisioned)
- 92 of 2390 NSE securities have no MCA linkage (cin/faceValue cannot be provisioned)
- D05 field unresolved: faceValue — supply MCA company master with CIN + face value, or act-bind the NSE listing master as faceValue source

## D05 field coverage

| Field | Status | Source | Kind | Note |
|---|---|---|---|---|
| isin | SOURCE_PROVIDED | nse | MANDATORY | NSE listing master |
| nseSymbol | SOURCE_PROVIDED | nse | MANDATORY | NSE listing master |
| companyName | SOURCE_PROVIDED | nse | MANDATORY | NSE listing master (issuer name) |
| series/segment (Tier-2 EQ filter) | SOURCE_PROVIDED | nse | MANDATORY | series column present |
| listingStatus (as-of) | SOURCE_PROVIDED | nse | MANDATORY | status asserted for the listing as of the deposition asOf; no assertion of future status |
| effectiveFrom (listing date) | SOURCE_PROVIDED | nse | MANDATORY | effectiveFrom ← listing date of the listing master; the deposit act must bind this mapping, or supply an act-bound asOf effective date instead |
| lotSize | SOURCE_PROVIDED | nse | MANDATORY | per-row MARKET LOT column required; for non-F&O cash equities the CM default is 1 and must be recorded as such in the deposit act, not as a hidden default |
| tickSize | DERIVED | derived | MANDATORY | uniform tickSize 0.05 bound by the Wave-3 deposition act (as-of NSE CM price-band circular); stated explicitly by --tick-size-uniform, never a hard default |
| faceValue | UNRESOLVED | — | MANDATORY | supply MCA company master with CIN + face value, or act-bind the NSE listing master as faceValue source |
| currency | DERIVED | derived | ADVISORY | INR uniform for the NSE/BSE CM universe; DERIVATION must be stated by the deposit act (never inferred into corpus silently) |
| cin | SOURCE_PROVIDED | mca | MANDATORY | MCA master data (bridged via ISIN/SYMBOL/exact COMPANY_NAME) |
| industry | SOURCE_PROVIDED | taxonomy | MANDATORY | taxonomy deposit |
| sector | SOURCE_PROVIDED | taxonomy | MANDATORY | taxonomy deposit |
| bseSymbol | SOURCE_PROVIDED | bse | MANDATORY | BSE listing master |
| bseScripCode | SOURCE_PROVIDED | bse | MANDATORY | BSE listing master scrip codes |

## Cross-source mapping

- unionIsins: 2390
- isinsPresentInAll: 2202
- NSE without BSE: 100; NSE without MCA: 92; NSE without taxonomy: 0
- MCA unmapped: 0; ambiguous name bridge: 0; taxonomy unmapped: 0
- conflicts: 0

## Required additional evidence

- tickSize: evidence accepted (mode=uniform) — record the binding in the act
- industry/sector: an authoritative taxonomy deposit with named provenance covering EVERY admitted security (a single industry/sector keyed by ISIN, or CIN bridged through MCA — no PDF or secondary mapping file is an input)
- MCA linkage: either an ISIN or SYMBOL bridge column in the MCA extract, or exact COMPANY_NAME matching against the NSE file (fuzzy is never used)

## Disclaimers

- Source files are validated as supplied; this tool never downloads anything and never treats mirrors as authoritative.
- A CLEAN report means the files are structurally valid and internally consistent — it does NOT prove issuer truth, ACTIVE listing truth, realtime staleness or eligibility for any downstream use.
- COMPANY_NAME bridging (when no ISIN/SYMBOL bridge exists in MCA) uses exact normalized string equality only; ambiguous candidates are reported, never guessed.
- tickSize is never defaulted by this tool: DEPOSITION_READY is impossible without --tick-rules covering every deposit-intended security or --tick-size-uniform bound in the act.
- DEPOSITION_READY means every MANDATORY D05 field is positively established from supplied local evidence (SOURCE_PROVIDED) or explicitly derived and stated (DERIVED), AND the files are structurally consistent. It does NOT authorize a deposit act, create a corpus revision, re-pin governed constants, or substitute for the Wave-3 gate and reviewed PR.
- ADVISORY coverage rows (kind=ADVISORY, e.g. currency derivation, NSE↔MCA faceValue cross-check) are reported for the act’s attention and never affect the verdict.
- A DEPOSITION_READY verdict still requires a separate Wave-3 deposition act, the merged corpus re-render, governed-constant re-pinning and a reviewed PR.
