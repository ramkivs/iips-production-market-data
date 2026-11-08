# DHAN-P7 — Dhan Instrument-Master Qualification

## Official sources (public, no credentials)

- Detailed (primary): `https://images.dhan.co/api-data/api-scrip-master-detailed.csv`
- Compact (security-ID cross-check only): `https://images.dhan.co/api-data/api-scrip-master.csv`

The masters are parsed from their **observed header rows** (never positional):
- detailed: `EXCH_ID, SEGMENT, SECURITY_ID, ISIN, INSTRUMENT, UNDERLYING_SECURITY_ID, UNDERLYING_SYMBOL, SYMBOL_NAME, DISPLAY_NAME, INSTRUMENT_TYPE, SERIES, LOT_SIZE, ...` — note `SECURITY_ID` (not `SEM_SMST_SECURITY_ID`); carries `ISIN` and `SERIES`.
- compact: `SEM_EXM_EXCH_ID, SEM_SEGMENT, SEM_SMST_SECURITY_ID, SEM_INSTRUMENT_NAME, ..., SEM_SERIES, SM_SYMBOL_NAME` — carries **no ISIN**.

Detailed↔compact reconciliation joins on the provider identity scope `exchange + segment + securityId` (Dhan IDs are not globally unique) and compares series where applicable.

## Identity relationship

`companyId + exchangeSegment + ISIN + series → Dhan securityId`

- Dhan's master does **not** establish IPD `companyId`. The join to authoritative P04 data is via **exact ISIN** (`SecurityMaster.resolveCompanyId({identifierType:'ISIN'})`) plus an ACTIVE P04 listing on the same exchange. companyId is never inferred from name/symbol/approximate matching.
- The canonical P04 `D114SecurityIdentity` (`ISIN:<isin>:<series>`) is built with `buildD114SecurityIdentity` from the exact source ISIN + SERIES.
- Qualified rows populate the P6 registry under the key `companyId|exchangeSegment|isin|series` with provenance `DHAN_INSTRUMENT_MASTER` and `lastVerifiedAt` = the master-file retrieval timestamp. `resolveExactIdentity` semantics are unchanged; no partial fallback exists.

## Qualification rules

A record is QUALIFIED only if: segment `E` + instrument `EQUITY` on NSE/BSE; valid non-empty `SEM_SMST_SECURITY_ID`; 12-char ISIN; non-empty SERIES; canonical D114 constructible; exact P04 ISIN correspondence with agreeing ISIN and an ACTIVE same-exchange listing; and no duplicate/conflicting prior identity. All other records are preserved in the manifest with explicit dispositions (`REJECTED_NOT_EQUITY`, `REJECTED_INVALID_FIELD`, `REJECTED_NO_P04_CORRESPONDENCE`, `REJECTED_AMBIGUOUS_IDENTITY`, `DUPLICATE_IDENTITY`, `CONFLICTING_PROVIDER_ID`) and never enter the registry.

## Evidence artifacts

- `evidence/dhan-p7/retrieval-log.json` — per-URL retrieval evidence (UTC timestamp, HTTP status, content-type/length, raw SHA-256, byte size, error).
- `evidence/dhan-p7/qualification-manifest.json` — machine-readable manifest (schema, counts, coverage by exchange:series, per-record dispositions, registry entries).
- `evidence/dhan-p7/qualification-report.md` — human-readable summary.
- `evidence/dhan-p7/api-scrip-master-detailed.csv` — raw snapshot **only when retrieval succeeded**; a snapshot is never claimed current beyond its retrieval timestamp.

Reproduce: `node scripts/dhan-p7-qualify.mjs` (live retrieval attempt) or `node scripts/dhan-p7-qualify.mjs --snapshot <file>` (deterministic re-run from a retained snapshot).

## Published evidence (2026-11-06)

Official snapshots were retrieved, SHA-256-verified and published (immutable; never redownloaded or altered):

- `evidence/dhan-p7/source/api-scrip-master-detailed.csv` — 217,104 rows, SHA-256 `6F19FEB4ABD513843EAF2F139A27F17CCB660233F95AD385D11AA92C322A010D`
- `evidence/dhan-p7/source/api-scrip-master.csv` — 217,104 rows, SHA-256 `4366E41B115B00B7A84225D3506A3DBB6EF483CB3BA4D32AD5F23D72E9EDCDDD`
- `evidence/dhan-p7/source-retrieval-manifest.json` — retrieval timestamps/URLs/hashes/columns.

Qualification result (deterministic, `scripts/dhan-p7-qualify.mjs`): 217,104 detailed rows → 23,764 equity candidates (segment `E` + instrument `EQUITY` on NSE/BSE) → **96 QUALIFIED** mappings entered the registry under `companyId|exchangeSegment|isin|series`; 23,644 rejected `REJECTED_NO_P04_CORRESPONDENCE` (governed P04 master has 2,250 entities); 24 `REJECTED_INVALID_FIELD`; 0 duplicates/conflicts; detailed↔compact reconciliation 23,764/23,764 CONSISTENT, 0 mismatches. Full counts/coverage in `evidence/dhan-p7/qualification-manifest.json`.

**Identity limitation (explicit):** P04 establishes `companyId` from exact ISIN plus the active exchange listing; it does not independently carry exchange series. The D114 series component is sourced from the official Dhan master `SERIES` column (vendor evidence). No symbol/name fallback is used, and Dhan does not independently verify P04 series.

## Safety boundaries

- No live quote request is made to prove the master downloaded; presence in the master does NOT prove live quote qualification or current tradability.
- P6 exact-series enforcement, fail-closed behaviour, authenticated transport, D01 canonical output, operational controls/cache isolation, G-2 persistence and IRR `SERIES_IDENTITY_UNAVAILABLE` are all unchanged. Historical D02 is out of scope.
