# D05 Wave-3 — Authoritative Source Readiness

- Verdict: **DEPOSITION_READY** (all MANDATORY D05 fields are SOURCE_PROVIDED or explicitly DERIVED from supplied local evidence)
- Missing sources: none

## Tick-size evidence

- mode: uniform
- uniformValue: 0.05 (act-bound, never a hidden default)
- universe coverage denominator (securities): 2390

## Sources

| Source | Path | Status | SHA-256 | Rows (valid/total) | Distinct ISIN | Duplicates |
|---|---|---|---|---|---|---|
| nse | /tmp/nse_eq_master.csv | OK | `620789245fe50170…` | 2390/2390 | 2390 | 0 |
| bse | evidence/D05-Wave3/deposit-2026-11-08/arena_bse_identity_bridged.deposit.csv | OK | `307cf96d3afb2568…` | 2390/2390 | 2390 | 0 |
| mca | /tmp/b05/extracted/arena_mca_identity_bridged.csv | OK | `930df3ca9d3365b1…` | 2390/2390 | 2390 | 0 |
| taxonomy | /tmp/b05/extracted/arena_taxonomy_submission.csv | OK | `4965ad0c9086c722…` | 2390/2390 | 2390 | 0 |

## Blocking reasons

- none

## PA act-bound governed exceptions

- authorization: IIPS-PA-DIRECTIVE-2026-11-08-FINAL-RECONCILIATION-AND-GOVERNED-REPLACEMENT
- effective as-of: 2026-11-08
- D-3 BSE exclusion ISINs: 100
- MCA governed exemptions: 27 · aliases: 7 · unlinked (claim rescinded): 58
- faceValue source binding: NSE listing master
- flagged ISINs all located in supplied sources

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
| faceValue | SOURCE_PROVIDED | nse | MANDATORY | faceValue ← NSE listing master (as-of face value per listing), bound by the deposition act; the MCA extract carries no faceValue column and no NSE↔MCA cross-check was applicable |
| currency | DERIVED | derived | ADVISORY | INR uniform for the NSE/BSE CM universe; DERIVATION must be stated by the deposit act (never inferred into corpus silently) |
| cin | GOVERNED_EXCEPTION | mca | MANDATORY | 2298 record(s) carry a format-valid CIN; MCA_UNLINKED_UNSUPPORTED_CLAIM_RESCINDED=58, MCA_GOVERNED_EXEMPTION=27, MCA_ALIAS_MATCH=7 — act-bound governed dispositions (never registry matches); unsupported claims rescinded/reclassified per the act, not misrepresented |
| industry | SOURCE_PROVIDED | taxonomy | MANDATORY | taxonomy deposit |
| sector | SOURCE_PROVIDED | taxonomy | MANDATORY | taxonomy deposit |
| bseSymbol | SOURCE_PROVIDED | bse | MANDATORY | BSE listing master |
| bseScripCode | GOVERNED_EXCEPTION | bse | MANDATORY | 2290 record(s) match the BSE listing master; 100 record(s) carry the act-bound D-3 UNLISTED-BSE governed exclusion marker (never a scrip code; never a claim of permanent NSE exclusivity) |

## Cross-source mapping

- unionIsins: 2390
- isinsPresentInAll: 2390
- NSE without BSE: 0; NSE without MCA: 0; NSE without taxonomy: 0
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
