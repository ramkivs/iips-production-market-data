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

### 6.1 2026-11-08 — One-time governed reassessment addendum (PR #139)

Follow-on to the PA directive of 2026-11-08 ("Apply proportional evidence standards"). Two further facts, appended append-only:

1. **Fail-closed synonym correction.** The BSE spec listed `bssescripcode` (typo, four s's) among `scrip_code` header synonyms, so any master whose header normalises to `bsescripcode` was reported `MISSING_COLUMNS` even with a valid six-digit scrip column. The synonym is corrected to `bsescripcode` — fail-closed in every other respect: the `^[0-9]{6}$` rule is unchanged, placeholder tokens remain rejected, and the 2026-11-08 submitted evidence remains `DEPOSITION_BLOCKED` after re-running against corrected inputs (`audits/source-readiness-2026-11-08-corrected/`, not committed). This is a bug fix, not a weakening.
2. **Derived corrected artifacts + PA decision preparation.** `scripts/derive_d05_wave3_artifacts.py` now deterministically produces corrective replacements under `evidence/D05-Wave3/derived/` (B1 restored genuine registry-carried CINs; B2 exact-ISIN-join scrip codes; B3 classification-basis disclosure with correction pass; B4 fabricated references blanked and uniform-0.05 marked PENDING PA ACT BINDING). Behaviour tests: `tests/d05_wave3_evidence_reassessment.test.ts`. Full re-evaluation, the five-outcome decision table and the prepared PA decisions (D-3 / D-4 / D-9 / taxonomy acceptance / B5): `evidence/cross-repository/IIPS_V3_D05_WAVE3_EQ_EVIDENCE_REASSESSMENT_2026-11-08.md`. **The verdict remains `DEPOSITION_BLOCKED`; `recordCount !== 2250` guard intact; PR #139 unmerged; Option B (P0–P9) unexecuted.**

## 7. 2026-11-08 — One-time governed replacement executed (PR #139, NOT merging)

Append-only addendum. The PA directive of 2026-11-08 (IIPS-PA-DIRECTIVE-2026-11-08-FINAL-RECONCILIATION-AND-GOVERNED-REPLACEMENT)
is executed for the D05 instrument master as a single, one-time, verified replacement pass. Nothing in this section weakens §3.

1. **Deposit + verification layer** committed as `44040ca` (Wave-3 publication pin kept; B2 conditional acceptance REJECTED —
   the act binds the verified exact-ISIN join instead: 2,290 dual-listed scrips + 100 `UNLISTED-BSE` act-bound exclusions,
   exactly the rows absent from the supplied BSE active-equity master).
2. **Runtime flip.** `getGovernedBroadSecurityMaster()` now hydrates from the authenticated universe generated into
   `src/identity/d05_authenticated_universe_data.ts` (2,390 records, sha256 `b555fd28…`, byte-identical to the deposit
   `evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.json`). The Wave-1 hydration is retained, unweakened,
   under `getGovernedLegacyWave1SecurityMaster()`; no Wave-1 evidence bytes changed.
   `broker_observation_resolver.ts` hard guard re-pinned from `recordCount !== 2250` to `recordCount !== 2390` with the
   replacement act reference.
3. **Verification evidence.** `scripts/build_d05_authenticated_universe.py --check` reproduces the deposit byte-identically.
   Corpus audit: **0 CRITICAL**, 34 WARNING, 58 INFO (`audits/d05-corpus/2026-11-08-authenticated-universe/`; copies committed at
   `evidence/D05-Wave3/deposit-2026-11-08/corpus-audit/`). `npm run build:tsc` clean. `npm test`: **1179 executed, 1178 passed, 1 skipped, exit 0**.
4. **Test re-pins are behaviour deltas, re-verified row-by-row** — e.g. the Dhan 68-row intake now resolves GHCL and KROSS natively
   (AGI GREENPAC via the governed alias), AMBUJACEM/ZOMATO(as INE758T01015→`EQ_ETERNAL_IN`) resolve, the retired `TATAMOTORS` symbol
   is absent post-Oct-2025 demerger (`TMCV`/`TMPV` resolve), Sai Silks `543989` resolves to `EQ_KALAMANDIR_IN` never Authum,
   and 64 of the 67 Wave-2-disposition ISINs are now carried natively (nothing was "incorporated" by any Wave-2 act).
5. **Behaviour contracts unchanged:** resolution stays exact-identifier-only (no fuzzy matching), missing evidence stays fail-closed
   (`UNMAPPED_IDENTIFIER`), `UNLISTED-BSE` is never a resolvable code, tickSize ₹0.05 is act-bound not code-defaulted, the as-deposited
   Wave-1 corpus/runtime/tests remain byte- and result-pinned for the legacy drill.
6. **Stated limits.** CI record: `npm test` output for this pass is the gate; deposit CIN fields are record-keeping facts of the
   NSE CM EQ source (not independently verified — B1 discipline); no operational promotion; PR #139 remains unmerged and unauthorized;
   P9 / B-06 remain post-merge items; eligibility stays `NOT_ASSERTED`.

See `evidence/cross-repository/IIPS_V3_D05_AUTHENTICATED_UNIVERSE_REPLACEMENT_EXECUTION_2026-11-08.md` for the full execution,
decision mapping and verification transcript references.

## 8. 2026-11-08 — Post-merge: Wave-1 rollback drill (P8) and B-06 closure (P9) executed

Append-only addendum, post PR #139 merge (`b60db67`, 2026-11-08T05:49:40Z).

1. **P8 — historical preservation + rollback drill.** Wave-1 pins re-verified against the *merged* tree
   (corpus `7f53540b…`, manifest `063288b3…`, Wave-2 disposition manifest `21a6b473…`, runtime asset `6810c28e…`).
   The drill is encoded as `tests/d05_wave1_rollback_drill.test.ts` (RB-01 … RB-05) and its receipt lives at
   `evidence/cross-repository/IIPS_V3_D05_WAVE1_ROLLBACK_DRILL_2026-11-08.md`. Drill is evidence-only; no pointer flipped.
2. **P9 / B-06 — 68-row holdings identity reassessment, close or escalate.** Re-run against the authenticated
   replacement with the **unchanged** merged pipeline: 3/68 resolved (rows 1 `AGI GREENPAC`→`EQ_AGI_IN`,
   21 `GHCL`→`EQ_GHCL_IN`, 40 `KROSS`→`EQ_KROSS_IN`), 65 `UNRESOLVED` (`UNSCOPED_NAME_OR_SYMBOL` /
   `NO_AUTHORITATIVE_IDENTIFIER_MATCH`), disposition `REJECTED`, zero rows persisted. Residuals enumerated in
   `evidence/cross-repository/IIPS_V3_D05_B06_68ROW_REASSESSMENT_2026-11-08.md`; outcomes at
   `evidence/integration/ws-a-dhan-68-row/identity-outcomes-authenticated-2026-11-08.json`;
   WS-A record addendum appended (`docs/integration/WS-A-DHAN-BROKER-IDENTITY-EVIDENCE-RECORD-2026-11-05.md`).
3. **Gates at this tree:** `npm run build:tsc` clean; `npm test` 1179 executed / 1178 passed / 1 pre-existing
   windows-conditional skip (adds the 5 RB subtests); rollback suite RB-01…RB-05 pass.
4. **Limits:** B-06 closes subject to PA acknowledgement of the B06 record; 65 residual rows escalate, they do not
   disappear; eligibility `NOT_ASSERTED` everywhere; deposit CINs are record-keeping facts; no operational writes.

> **CORRECTION-2026-11-09 (append-only; the numbered items above are retained verbatim).** The §8 heading
> ("B-06 closure (P9) executed") and item 4 ("B-06 closes subject to PA acknowledgement") are
> **superseded**. The PA review disposition of record states: "**B-06: REMAINS OPEN.** This PA review
> accepts the reassessment, not B-06 closure. B-06 must not be marked complete, closed or
> production-accepted by any artifact derived from this decision." Source of record:
> `evidence/cross-repository/IIPS_V3_D05_B06_68ROW_REASSESSMENT_2026-11-08.md`
> ("APPEND-ONLY ADDENDUM — PA REVIEW DISPOSITION", item 5). Status at `main`
> `709fd13c77e90df05900859d23ba57d1004197a0`: **B-06 OPEN.**
>
> The three identity results quoted across this program are reconciled in
> `docs/integration/BROKER-IMPORT-IDENTITY-RECONCILIATION-AND-W1-ADMISSION-ASSESSMENT-2026-11-09.md`
> §1: item 2 above and §7 item 4 both quote the **3/68 name-surface** measurement against the
> authenticated master (`DHAN_WEB_UI_SUMMARY_V1`, no ISIN / no exchange), which is correct. The
> **65/68** figure is a *different* measurement — exact-ISIN against the authenticated master using
> the separately committed B-04 companion export — and is not a re-run of the summary surface.
