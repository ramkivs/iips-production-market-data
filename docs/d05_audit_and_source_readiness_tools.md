# D05 Wave-3 — Audit & Source Readiness Tooling

**Scope:** IPD (`ramkivs/iips-production-market-data`). These two tools are evidence-producing,
read-only instruments. They **do not modify** the deposit corpus, any manifest, any Wave-1/2/3
disposition, any record, or any runtime identity resolution. Outputs go only to a designated audit
directory (default `audits/`, git-ignored), never into authoritative source data.

What they deliver: (A) a deterministic audit of the Wave-1 D05 broad-universe deposit and
(B) a deterministic readiness assessment of *locally supplied* candidate sources for a governed
Wave-3 expansion. Neither tool authorizes, performs, or even partially performs an expansion.
The ACTIVE NSE CM universe is NOT expanded by running them.

## 1. A. Corpus audit — `scripts/d05_corpus_audit.mjs`

### Run

```bash
npm run build          # or npm run build:tsc — audit imports dist/src/audit/d05_corpus_audit.js
node scripts/d05_corpus_audit.mjs [--corpus <file>] [--output-dir <dir>]
```

Defaults: `--corpus evidence/operator_drop/d05_security_master_broad_universe.json`,
`--output-dir audits/d05-corpus`.

### What it reports (all machine-readable + human summary)

- Totals: record count, distinct companyId / ISIN / CIN / NSE symbol / BSE symbol / BSE scrip code.
- Full identifier conformance: ISO-6166 ISIN shape + check digit; MCA-like CIN pattern;
  `EQ_<TOKEN>_IN` company-id convention (WARNING); BSE scrip-code presence.
- Uniqueness across companyId / ISIN / CIN / NSE & BSE symbols / scrip codes (duplicates ⇒ CRITICAL).
- Field completeness for the 16 top-level deposit fields; listings array structural + enum checks
  (NSE/BSE exchange enum, ACTIVE/SUSPENDED/DELISTED enums, positive-int `lotSize`, positive
  `tickSize`, at least one ACTIVE NSE listing per record), positivity checks, ISO-8601 UTC-instant
  effective-date checks (`effectiveFrom`, optional `effectiveTo`, window order).
- Distributions: listingStatus, currency, sector (15), industry (75), lotSize, tickSize, faceValue,
  listings-per-record, exchange pairs, effectiveFrom.
- Synthetic-series markers: `companyName` `^<TOKEN>\d{4} India Limited$` with the same token inside
  `companyId^EQ_<TOKEN>_IN$`. Reported **as counts only** (`CHECK-GENERATED-MARKERS`).
- Per-record origin classification is **always `UNCLASSIFIED`** (PA decision 2026-10-19-01 C1–C3).
  The audit never promotes, ranks, or "verifies" authenticity; a marker is not an authenticity
  verdict either way, and a marker-free record is not issuer-verified. ISIN validity is a syntax
  property, not evidence. The report embeds this policy and refuses any other classification.
- Provenance traceability: embeds `evidenceRefs` with SHA-256 for the Wave-1 manifest, Wave-2
  disposition manifest + JSON, Wave-3 acquisition attempt log, the Wave-3 expansion receipt and the
  browser runtime-hydration report. Missing/unreadable evidence is reported `present:false` — never
  fabricated, never fatal.

### Inputs & outputs

Input corpus: JSON array (or `{ "records": [...] }`) of the 16-field Security Master records.
Outputs (created via `mkdir -p`):

| File | Format | Use |
|---|---|---|
| `audits/d05-corpus/corpus-audit.json` | JSON (2-space) | machine consumption; embedded sha256 + all findings |
| `audits/d05-corpus/corpus-audit.csv` | CSV | finding triage (index,companyId,severity,code,field,detail) |
| `audits/d05-corpus/corpus-audit.md` | Markdown | review summary (checks, distributions, evidence table) |

Exit codes: `0` audit produced (findings never fail the CLI); `2` usage/output-dir violation;
`3` corpus unreadable/invalid. `--output-dir` inside `evidence/`, `src/`, `tests/` or `docs/` is refused.

### Specialist notes / limitations

- `listings[2]`, `listings[3]` etc. findings reference the per-record listing index.
- `DUPLICATE_*` findings carry `index: -1` with `companyId: (corpus)`.
- Distributions are **distributions, not verdicts** (15 sectors ≈147–154 each mirrors the deposit design).
- The deposit is **byte pinned**: corpus SHA-256 `7f53540b…74b5`, records 2250, markers 2198,
  marker-free 52, findings 0 CRITICAL — these are integration-test pins; drift fails the test loudly.

## 2. B. Authoritative source readiness — `scripts/source_readiness.mjs`

### Run

```bash
node scripts/source_readiness.mjs \
  [--nse <nse.csv>] [--bse <bse.csv>] [--mca <mca.csv>] [--taxonomy <taxonomy.csv>] \
  [--tick-rules <ticks.csv>]           # optional — per-ISIN tick bands: isin,tickSize ∈ {0.01,0.05,0.10,0.25,0.50,1.00,5.00}
  [--tick-size-uniform 0.05]           # optional — single value, must be explicitly act-bound
  [--output-dir <dir>]                 # default audits/source-readiness
```

`--tick-rules` expects CSV `ISIN,TICK_SIZE` (header aliases: `isin`/`isinnumber`; `ticksize`/`tick_size`/`tick`/`tickband`). Every supplied row is validated (ISIN shape+Luhn; tick ∈ {0.01, 0.05, 0.10, 0.25, 0.50, 1.00, 5.00} — the union of the pre-June-2024 tick regime and the price-linked ticks introduced by NSE CM circulars in 2024/2025 (price < ₹250 ⇒ 0.01 … price > ₹20,000 ⇒ 5.00) — any other value is an invalid row, rejected, never admitted); divergent duplicates of the same ISIN are blocking conflicts; identical duplicates are tolerated with a warning. Coverage is measured against the deposit-intended universe (NSE set, or the union when NSE is absent) and every deposit-intended security must be covered.

`--tick-size-uniform <0.01|0.05|0.10|0.25|0.50|1.00|5.00>` accepts a single uniform tick bound by the Wave-3 deposition act (as-of NSE CM price-band circular). It is recorded as `DERIVED` with the binding note, never as a silent default. Any other value exits `2` (usage error).

**`DEPOSITION_READY` semantics (since 2026-11-07):** every MANDATORY D05 coverage row must be `SOURCE_PROVIDED` or explicitly `DERIVED`, and all supplied files must be structurally valid and mutually consistent. Unresolved tickSize — from absent evidence, partial tick-rules coverage, band-invalid rows or conflicting rules — is **blocking**, like every other mandatory field. `DEPOSITION_READY` still does not authorize or itself create a deposition act, corpus revision, governed-constant re-pin or PR disposition.

Coverage rows are tagged `kind`: **MANDATORY** (UNRESOLVED ⇒ blocks `DEPOSITION_READY`) or **ADVISORY** (reported for the act; never affects the verdict). Mandatory: isin, nseSymbol, companyName, series/EQ filter, listingStatus(as-of), effectiveFrom(listing date), lotSize, tickSize, faceValue, cin, industry, sector, bseSymbol, bseScripCode. Advisory: `currency` (INR derivation to be stated by the act) and the optional `faceValue cross-check (NSE vs MCA)` advisory row (present only when both files carry face value).

Validates **locally supplied** files only. It NEVER downloads, never resolves mirrors, never
"verifies" a source by network; supplied bytes are treated as untrusted evidence whose integrity is
recorded (SHA-256) not laundered by tool execution. Exit codes: `0` DEPOSITION_READY,
`4` DEPOSITION_BLOCKED, `2` usage/output-dir violation, `3` unreadable input.

### Accepted headers (case- and punctuation-insensitive; first alias wins)

| Source | Required columns (aliases) | Optional columns |
|---|---|---|
| NSE | `ISIN` (`isin`, `isinnumber`, `isincode`); `SYMBOL`; `NAME OF COMPANY` (`nameofcompany`, `companyname`, `securityname`, `name`) | `SERIES` (`series`) — **required for Tier-2 CM EQ filtering**; absent ⇒ warning + `series/segment` coverage UNRESOLVED; `DATE OF LISTING` (`dateoflisting`, `listingdate`) → `effectiveFrom` evidence; `MARKET LOT` (`marketlot`, `marketlotshare`) → `lotSize`; `PAID UP VALUE`, `FACE VALUE` |
| BSE | `Scrip Code` (`scripcode`, `securitycode`, `code`, `bssescripcode`); `ISIN Number`; `Security Name` (`securityname`, `companyname`, `name`, `security`) | — |
| MCA | `CIN` (`cin`, `cinnumber`, `corporateidentificationnumber`, `cinno`); `Company Name` (`companyname`, `company`, `company_name`) | `FACE VALUE` (`facevalue`, `facevalueofequityshare`, `facevaluepershare`) → `faceValue`; bridge columns `ISIN` / `SYMBOL` — **without one, CIN is bridged to NSE by exact normalized COMPANY_NAME match only** (case-folded, all punctuation/whitespace collapsed). **No fuzzy matching, ever.** Ambiguous candidates are reported, never guessed. |
| Taxonomy | `Industry` (`industry`, `industryname`, `basicindustry`); `Sector` (`sector`, `sectorname`) **plus at least one of `ISIN` or `CIN`** | `BASIC INDUSTRY` / `SUB INDUSTRY` |

Rows are validated cell-by-cell: ISIN shape + Luhn (NSE/BSE/Taxonomy), MCA-like CIN (`L|U` + 5 digits +
state code + 4-digit year + 3-letter ownership + 6-digit ROC number), blank industry/sector/name/symbol,
scrip-code presence, ragged CSV lines (reported, not silently tolerated). Valid rows feed cross-source
mapping; invalid rows are excluded and reported (`invalidRowSamples`, capped at 10 for display).

### What it reports

- Tick-size evidence: `tickSizeEvidence` object (mode absent|rules|uniform, sha256 for rules, coverage counts, samples); invalid rule rows and missing ISINs are also emitted into `source-readiness.csv` as `INVALID_TICK_RULE_ROW` / `TICK_SIZE_MISSING_ISIN`.
- Per source: SHA-256, bytes, header status (`OK`/`MISSING_COLUMNS`/`UNUSABLE`), matched columns,
  ISO-Luhn/Luhn failures, totals (total vs valid rows), duplicate ISIN/CIN counts + samples,
  NSE `SERIES` distribution and out-of-Tier-2-scope row counts (series ≠ `EQ`).
- Cross-source: union ISINs; ISIN present in all four; NSE-without-BSE / without-MCA / without-taxonomy;
  MCA unmapped + ambiguous-name bridges (with samples, cap 20); taxonomy unmapped (samples, cap 20);
  conflicts (`DUPLICATE_ISIN_IN_SOURCE`, `SYMBOL_MISMATCH_IN_NSE`, `SCRIP_MISMATCH_IN_BSE`).
- **D05 field coverage** for every corpus field: `SOURCE_PROVIDED` / `DERIVED` / `UNRESOLVED` with the
  exact source or note; mandatory gaps (BSE match, MCA linkage, taxonomy coverage for deposit-intended
  securities; listing date for `effectiveFrom`; faceValue; industry/sector; series for Tier-2 filter)
  are **blocking**. `tickSize` is **mandatory**: no listing-master file can assert price-linked
  tick values on its own, so without `--tick-rules` full coverage or a `--tick-size-uniform` act binding
  it stays UNRESOLVED and the verdict is BLOCKED — the deposit act must bind it explicitly
  (uniform 0.05 with deviation notice, or an as-of NSE CM circular extract). The tool never
  defaulted tickSize, lotSize, or any face value.
- Taxonomy input contract: **one** CSV — `isin` or `cin` (at least one; industry + sector required non-blank) —
  keyed by ISIN or by CIN bridged through MCA. No PDF, codebook or second mapping file is an input.
- Verdict: `DEPOSITION_READY` (0 blocking reasons; every MANDATORY field positively established)
  or `DEPOSITION_BLOCKED` with `blockingReasons[]` (missing sources, header failure,
  duplicates/conflicts, MANDATORY unresolved coverage incl. tickSize) and
  `requiredEvidenceForFullCoverage[]` stating exactly what to add (mentions `--tick-rules`
  coverage or `--tick-size-uniform` when tick evidence is missing). Outputs now carry
  `tickSizeEvidence` (mode, path, sha256, validRows, coveredIsins/denominator, missing/invalid samples)
  and `reportVersion: 2`.

Outputs: `audits/source-readiness/source-readiness.{json,csv,md}` (JSON 2-space; CSV lists problem rows
for triage; MD is the review summary). Exit `4` on BLOCKED — scriptable in the deposit runbook.

### Interpretation guide

| Signal | Meaning / required action |
|---|---|
| `present:false` / missing source | acquire the authoritative extract under Wave-3 act; never substitute a mirror |
| `MISSING_COLUMNS`/`UNUSABLE` | the file is not the expected extract; obtain the correct one (or the act’s stated bridge rule) |
| duplicates in a source | resolve at the source; do not de-duplicate by preference |
| `SYMBOL_MISMATCH_IN_NSE`/`SCRIP_MISMATCH_IN_BSE` | the same ISIN is presented under two identifiers — data conflict; the act must resolve |
| MCA ambiguous/unmatched bridges | no ISIN/SYMBOL bridge in the MCA extract; supply one (preferred) or legalize an exact-normalized-name mapping rule in the act |
| `UNRESOLVED` field | cannot be provisioned for deposit; supply the column/file named in the note |
| `DEPOSITION_READY` | files are structurally valid and mutually consistent; **still requires the Wave-3 act + gate run + reviewed re-pinning PR** — never sufficient alone |

## 3. Safety posture (both tools)

- Inputs (corpus, sources, manifests, evidence) are opened read-only; checksums are computed, never
  written. `--output-dir` under `evidence/`, `src/`, `tests/` or `docs/` is refused with exit 2.
- No network access; no downloads; no "verification" by remote fetch; no mirror treated as authoritative.
- No record promotion to authenticated; no runtime identity-resolution change; no IRR, SCM0, DB,
  deployment or operational writes; reconciliation v1/v2 untouched.
- Deterministic: identical inputs ⇒ byte-identical reports (guarded by tests). No clock, no randomness.
- TickSize/lotSize/faceValue never invented; silence beats invention everywhere.

## 4. Tests / CI

Targeted suites: `tests/d05_corpus_audit.test.ts`, `tests/source_readiness.test.ts` (spawn the CLIs as
CI does; tmpdir outputs; byte-determinism; read-only corpus assertion; pinned corpus SHA-256 and
evidence-ref hashes; synthetic fixture CSVs with checksum-valid ISINs). Repository gate: `npm test`
(guarded suite; the same gate CI runs for PRs). Neither tool touches or requires anything outside
its own tests and the `audits/` ignore rule.

## 5. Related artifacts

- Migration/replacement assessment: `evidence/cross-repository/IIPS_V3_D05_WAVE3_MIGRATION_OPTIONS_ASSESSMENT_2026-11-07.md` (options A/B/C; **PA decides**)
- Wave-3 machinery: `scripts/wave3_universe_expansion.mjs`, `src/identity/universe_expansion_gate.ts`
- Contract: `src/contracts/d05_security_master.ts` (5 enforced rules only); deposit policy carries the rest
- Wave-3 receipt (blocker): `evidence/cross-repository/IIPS_V3_D05_WAVE3_UNIVERSE_EXPANSION_RECEIPT_2026-11-06.md`

## 6. 2026-11-08 — Fail-closed addendum (PR #139)

`source_readiness.ts` now enforces that a BSE `scrip_code` row must match `^[0-9]{6}$`.
Placeholder tokens such as `UNLISTED-BSE` / `NSE-EXCLUSIVE` are **not identity claims**: rows carrying them are rejected as invalid for coverage purposes, so they cannot close the NSE↔BSE linkage gap; verification of the linkage therefore still fails closed until an authentic exchange master is supplied. The MCA side already enforced C-20 CIN format (`^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$`), which rejects `EXEMPT-STRUCT-*` / `ALIAS-MATCH-*` tokens the same way. Behaviour tests: `tests/source_readiness.test.ts` (2 new cases) and `tests/d05_wave3_evidence_reconciliation.test.ts` pin the 2026-11-08 publication and verdict. See `evidence/cross-repository/IIPS_V3_D05_WAVE3_EQ_EVIDENCE_RECONCILIATION_2026-11-08.md` for the full findings. No weakening, no defaults, no tolerated placeholders.
