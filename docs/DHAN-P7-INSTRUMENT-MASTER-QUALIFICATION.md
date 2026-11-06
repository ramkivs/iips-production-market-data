# DHAN-P7 — Dhan Instrument-Master Qualification

## Official sources (public, no credentials)

- Detailed (primary): `https://images.dhan.co/api-data/api-scrip-master-detailed.csv`
- Compact (security-ID cross-check only): `https://images.dhan.co/api-data/api-scrip-master.csv`

The detailed master is parsed from its **observed header row** (never positional):
`EXCH_ID, SEGMENT, SEM_SMST_SECURITY_ID, ISIN, INSTRUMENT, SERIES, SYMBOL_NAME, INSTRUMENT_TYPE, ...`

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

## Current environment status (2026-11-06)

The sandbox network allowlist (github.com, npmjs, pypi only) blocks `images.dhan.co`, so the official master could not be retrieved in this environment; the retrieval log records the failure and **zero** mappings were qualified. The registry therefore remains empty and every quote fails closed — the required fail-closed behaviour. No unofficial mirror, guessed mapping or hardcoded security ID was used as a substitute.

## Safety boundaries

- No live quote request is made to prove the master downloaded; presence in the master does NOT prove live quote qualification or current tradability.
- P6 exact-series enforcement, fail-closed behaviour, authenticated transport, D01 canonical output, operational controls/cache isolation, G-2 persistence and IRR `SERIES_IDENTITY_UNAVAILABLE` are all unchanged. Historical D02 is out of scope.
