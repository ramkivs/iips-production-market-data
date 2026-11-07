# IIPS V3 D05 — Wave-3 Option B: Post-Merge P0/P1 Execution Record & Authoritative Acquisition Readiness

**Date:** 2026-11-07 · **Branch:** `arena/f9c95db1-iips-production-market-data` (merged; follow-up published from `arena/b33044c5-iips-production-market-data`) · **Program:** D05 / Wave 3 · **Audience:** Program Authority (PA) · **Tier:** Documentary preparation — **no corpus bytes are deposited by this record.**

**Status:** MERGED-BASELINE RECORDED (bb7e103…) · Option B decision carried forward intact · **P0 complete as analysis & records — P1 execution (acquisition) outstanding and external.**

---

## 0. Executive summary and non-claims

- **PR #136 (Option B plan + conformance suite) MERGED** on 2026-11-07T06:16:43Z; merge commit **`bb7e103ef3dd47177d8144c386b915c8a09d849a`** (parents `fb6cf912…` PR branch base and `e1d019f…`).
- **Merged-main CI was RED** on the merge (run `42346287726`): `tests=1143, pass=1141, fail=1`. Root-caused to a **pre-existing** load-sensitive race in `tests/durable_holdings_recovery_v1.test.ts` (V2-R04 two-process UNIQUE race; `busy_timeout=0` fixtures; both racers could refuse ⇒ `commits.length 0 !== 1`), **not** to the merged tree. Deterministic fix (sequential racer spawn) is published in this PR; full suite green locally (1151 executed / 1150 pass / 0 fail / 1 retained skip; re-verification runs after this PR merges). **No claim is made that merged-main CI is green until that post-merge run succeeds.**
- All Wave-1/2/3 pinned artifacts are **byte-identical on merged main** (§6). No manifest was rewritten, no corpus was modified, no runtime consumer was re-pinned, no identity code changed.
- **No universe is deposited or created by this document.** The ACTIVE NSE CM universe claimed by Wave 3 remains exactly what Wave 2 recorded: 2 hand-curated verified reference securities. The replacement remains *gated* on P1 (acquisition), P2 (SHA-256 source-readiness), P3 (act), … as defined in the Option B plan.
- The 2,198 broad-universe records remain **categorically excluded** from any replacement revision; the 52 UNCLASSIFIED candidate records remain **UNCLASSIFIED and individually revalidated post-execution** — never auto-authenticated.
- Tick-size handling in the source-readiness tool was **corrected this cycle** (§5.4/§5.2): the accepted CM cash tick set is now the union {0.01, 0.05, 0.10, 0.25} ∪ price-linked regimes {0.50, 1.00, 5.00}. This is a validation-correctness fix; it deposits nothing.

---

## 1. Merged-main baseline record (P0)

| Fact | Value | Verified |
|---|---|---|
| Base branch before merge | `fb6cf91219c0a270d42c3618aa20ed6682699817` (`main` pre-merge) | `git ls-remote origin main` during P0 |
| PR | #136 (merged, `--merge`, no protection bypass; `ci.yml` hunk reviewed: no gate/trigger/permission/timeout weakened, exit code strictly published) | merge output + review |
| Merge commit (new `origin/main`) | `bb7e103ef3dd47177d8144c386b915c8a09d849a` | `git ls-remote origin main` |
| Merge time | 2026-11-07T06:16:43Z | `gh pr view 136` |
| Merged-main CI run | `42346287726` → **failure** (1141/1143, `Test (guarded)`) | check-run API (run logs unavailable from sandbox: GitHub blob-storage EOF on every attempt — counts obtained from check-run summaries only) |
| Root cause | Pre-existing V2-R04 race in `tests/durable_holdings_recovery_v1.test.ts`; reproduced ~3/4 reds in a clean `/tmp` worktree at bb7e103; 6/6 green after deterministic stagger; **shipping `busy_timeout=0` posture unchanged; assertion semantics unchanged** | local loop, 2026-11-07 |
| Fix vehicle | This PR (new publication from a fresh branch after #136's branch was retired by the platform); the merged PR #136 is intentionally not reopened/rewritten | — |

**Historical preservation.** PR #136 merged exactly the audited plan and conformance suite. The ci.yml hardening it contained (publish npm's exit code to `GITHUB_STEP_SUMMARY` and exit non-zero) is what exposed the flake instead of masking it (previously `tests=null` on failure). That hardening is retained.

## 2. P0 decisions preserved (Option B carry-forward)

1. **Option B — Governed Replacement** stands as PA's 2026-11-07 decision. Options A (recertify in place) and C (staged certification) remain closed. See `IIPS_V3_D05_WAVE3_MIGRATION_OPTIONS_ASSESSMENT_2026-11-07.md` (append-only amended) and `IIPS_V3_D05_WAVE3_OPTION_B_GOVERNED_REPLACEMENT_PLAN_2026-11-07.md`.
2. **Revision semantics.** Replacement will be deposited as a *new* governed revision (next `D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION`, i.e. revision 3+) with Wave-1 evidence retained under a `@deprecated` pointer — **never** by silently restoring Wave-1 bytes. `D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION` semantics are unchanged this cycle.
3. **2,198 records — excluded.** Categorically out of the replacement candidate set; they remain in the corpus file for audit lineage only. Any appearance in a deposit is a **blocking integrity defect**.
4. **52 records — revalidated, not auto-admitted.** Each must independently pass the full §7 candidate pipeline plus tick-size evidence; AGI/AIIL history, Nifty membership reputation, or prior "real-looking" classification confers **zero** admissibility weight; marker-free ≠ authenticated; ambiguity (identity collision, ISIN/symbol conflict, MCA bridge failure, taxonomy conflict) ⇒ **reject, never guess**.
5. **AIIL correction** remains runtime-only (`d05_listing_corrections` rebasing `EQ_AIIL_IN`); Wave-1/2 evidence files untouched.
6. **B-06** (68 mis-attributed AGI GREENPAC / incentive-marker rows) stays frozen; reassessment happens **only against a deposited replacement revision** and remains UNCLASSIFIED until then (P9).
7. **Rollback** remains a governed act against the revision pointer (see plan §rollback and D-12); it never silently restores Wave-1. No rollback is performed or prepared here.
8. **W-1 hard-false, reconciliation v1/v2, and the W-W1..W1 evidence chain** are untouched.

## 3. P0 — companyId stability and consumer-compatibility findings

These findings are **requirements/analysis**, not a change. Identity resolution code is untouched.

### 3.1 What is durable vs what is derived

| Surface | Holds | Durability |
|---|---|---|
| `src/persistence/portfolio_store.ts` | `company_id` persisted verbatim in every holdings row and PIT snapshot (SELECTs at ~643/~867; write at ~1035/~1397; cast at ~925) | **Durable** — survives restarts; rows are append-only PIT snapshots |
| `src/persistence/brokerImportPersistence.ts` | `companyId: outcome.companyId` cast into stored holdings at resolution time (~139, ~174, ~1040); carry-forward across imports when `identityStatus === 'RESOLVED'` (~212 refused-key set guards re-derivation drift) | **Durable at write time; not rewritten later** |
| Runtime hydration (`governed_fixture_master.ts` + security-master hydration path) | Resolver re-derives from the hydrated revision each process start; outcomes are computed, not persisted | Derived |

### 3.2 Consequences for the replacement

1. **Continuing issuers keep byte-identical ids by construction.** Company-id convention across this codebase is `EQ_<NORMALIZED-NSE-TOKEN>_IN` (verified in canned fixtures and all persisted identifiers inspected, e.g. `EQ_RELIANCE_IN`, `EQ_AIIL_IN`). If replacement re-hydrates from a pinned revision that **retains the same NSE symbol alphabet for a surviving security**, regenerated ids are identical to Wave-era persisted ids. No id-rewriting pass over persisted holdings is required — **provided the allocation function itself is bound by the deposition act (D-4)** and not left emergent.
2. **2022-era persisted snapshots are PIT content.** `portfolio_store` snapshots keep the `company_id` that was correct when written; they are **not** re-resolved. Reads against a replacement revision therefore show mixed eras by design — any consumer assuming a single universal id era across history is non-compliant; none found in-repo.
3. **Non-admitted issuers fail closed.** A persisted id whose ISIN/symbol does not resolve in the replacement revision re-opens as `UNRESOLVED` at the next reconciliation — by design (fail-closed), never silently re-mapped to a near match. The ~2,198-generated-era rows cannot leak Active status through this path.
4. **AGI GREENPAC.** Any runtime identity outcome referencing `EQ_AGIGREENPAC_IN` (or the AGI/GREENPAC rebasing) is only re-verifiable against the replacement revision; until a deposited revision + reconciliation re-run exists, **B-06 stays frozen and the shipped Wave-3 outcome is not contradicted** (it is what the current revision says). P9 owns the reassessment.
5. **AIIL family.** `d05_listing_corrections.ts` re-points `EQ_AIIL_IN` at hydration only; it must continue to be applied at hydration against the replacement revision unchanged, or explicitly superseded by the act — but never edited into evidence.
6. **Consumer compatibility.** No consumer may assume pin presence, revision count, or id permanence; all resolve through the governed pointer. `tests/option_b_replacement_plan_conformance.test.ts` (9 guards) pins resolver/gate immutability and passes at bb7e103. The 23-row §8 blast-radius inventory stands as-is; nothing in P0/P1 re-pins any of it.
7. **Action for the PA (D-4 confirmation).** Before the deposit act, require the act to (a) bind the `EQ_<TOKEN>_IN` derivation for the new revision, and (b) require a post-deposition **id-stability report** comparing pre/post assignment per admitted ISIN; mismatches beyond expected-drift (delisted/unresolved securities) block promotion. This document does **not** perform that comparison — impossible without the replacement revision.

## 4. P1 — Authoritative acquisition readiness (executed externally)

### 4.1 Hard sandbox constraint (evidence-backed)

- Sandbox egress is allowlisted; on **2026-11-06T18:14Z the acquisition attempt failed** against all intended hosts (NSE, BSE, MCA) — see `evidence/operator_drop/wave3-2026-11-06/acquisition-attempt-log.json` (sha256 `93c92ec4…`), committed and unamended.
- Web verification from this session (2026-11-07) confirms live-archive paths resolve **from the public web**, not from this sandbox; operators must acquire on a host with exchange/MCA egress (or via an owner-licensed channel).
- NSE/BSE/MCA publish no automated bulk API suitable here; NSE/BSE operators run **zero public GitHub repositories**; npm/PyPI presence is client-side only. **No mirror may be substituted; unpinned bytes are inadmissible.**

### 4.2 Required inputs — exact implementation contract (corrected 2026-11-07)

**Correction note.** The earlier revision of this section required a two-part industry taxonomy ("codebook PDF + separate ISIN→industry mapping CSV") and entertained a "12-column" superset structure. **Neither exists in the implementation, the approved Option B decision, or any artifact in this repository, and both are withdrawn.** What follows is exactly what `src/audit/source_readiness.ts` consumes — `SPECS` column rules plus the coverage-row construction — and what `scripts/source_readiness.mjs` passes to it. Nothing more is required; nothing less suffices.

All four sources are MANDATORY for `DEPOSITION_READY` (an absent file ⇒ blocking `source file not supplied`):

| # | Source (`--flag`) | Required columns (exact rules) | Optional columns used | Supplies MANDATORY D05 fields |
|---|---|---|---|---|
| A | `--nse` — NSE CM equity listing master (`https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv`; legacy mirror `https://archives.nseindia.com/content/equities/EQUITY_L.csv`) | `isin` (shape + check digit), `symbol`, `name` (aliases `isinnumber`/`isincode`, `symbol`, `nameofcompany`/`companyname`/`securityname`); plus `series`, `dateoflisting`, `marketlot` — the last three back MANDATORY coverage rows | `paid_up_value`, `face_value` (advisory cross-check only) | isin, nseSymbol, companyName, series/segment (Tier-2 EQ filter), listingStatus (as-of), effectiveFrom ← DATE OF LISTING, lotSize ← MARKET LOT |
| B | `--bse` — BSE listing master ("List of Scrips" application `https://www.bseindia.com/corporates/List_Scrips.html` → Segment=Equity, Status=Active; layout confirmed at acquisition — samples show status/group/face value/ISIN/industry/scrip code/issuer name) | `scrip_code` (aliases `scripcode`/`securitycode`/`code`/`bssescripcode`), `isin` (valid), `name` | — | bseSymbol, bseScripCode |
| C | `--mca` — MCA company master, CURRENT as of the act's as-of date, license-permitted machine aggregation, sha256-pinned; portal reference `https://www.mca.gov.in` → MCA Services → Master Data (MCA21; sign-in required since 2025-12); licensed bulk extract preferred, owner-authorized per-CIN capture admissible only with structured verifiable records; **ISIN or SYMBOL bridge column strongly preferred** | `cin` (regex), `name` | `face_value`, `isin`, `symbol` (bridges) | cin, faceValue ← MCA master (mandatory); bridge for taxonomy CIN rows |
| D | `--taxonomy` — taxonomy CSV from a named, sha256-pinned, authoritative source (owner-licensed or official extract). **This file IS the ISIN/CIN → industry/sector mapping; there is no separate mapping file and no codebook input.** | `industry`, `sector` (both required, non-blank) + `isin` **or** `cin` (at least one; CIN rows are bridged through MCA). `basic_industry` optional (aliases `basicindustry`/`subindustry`) | basic_industry | industry, sector |
| E | tick evidence — `--tick-rules <isin,tickSize CSV>` (union bands `{0.01,0.05,0.10,0.25,0.50,1.00,5.00}`; aliases `isin/isinnumber`, `ticksize/tick_size/tick/tickband/tickbandpaise`) covering **every** deposit-intended security, or `--tick-size-uniform <value>` explicitly bound in the act | complete coverage of the deposit-intended universe; divergent duplicate ISIN rows block | — | tickSize |
| F | Bhavcopy (optional delta cross-check only) | — | — | none (not a gate input) |

**Explicitly NOT required by the implementation (do not request, do not construct):**

- **NSE Indices Industry Classification Structure PDF** — nothing in the tools consumes a PDF. At most, the act may name a taxonomy *source + version* as provenance; the PDF is neither an input nor admissible as evidence bytes.
- **A second, per-issuer "mapping" file** beyond the taxonomy input — redundant; the taxonomy CSV already keys ISIN/CIN → industry/sector.
- **A 12-column (or any superset) mapping/master CSV** — undefined in every schema, SPEC, test, plan and record in this repository; rejected as unsupported.
- **SME listings (`SME_EQUITY_L.csv`)** — out of the Tier-2 CM EQ filter; only in scope if the PA separately extends D-8, in which case this charter and the readiness spec change by a dedicated act.
- **NSE `FACE VALUE`** — used only for the advisory NSE↔MCA faceValue cross-check; mandatory `faceValue` comes from MCA. (`PAID UP VALUE` is captured for the act but is not a readiness input.)
- **Any MCA dataset that is stale, unverified or license-incompatible** — inadmissible. "Current as of the act's as-of date" with machine-aggregatable, pinned bytes is mandatory. Unverified public bulk resources (including unverified data.gov.in extracts) are not acceptable substitutes; PA/procurement must license, authorize, or direct an in-scope alternative. Per-CIN manual capture is admissible only with structured, verifiable records — hand transcription without verification is not.
- **BSE face value** — the tool requires no face value from BSE; the mandatory cross-check is NSE↔MCA (advisory).

**`DEPOSITION_READY` semantics (as implemented):** zero blocking reasons ⇔ all four files present and structurally valid; zero cross-source identifier conflicts; every NSE security matched in BSE, linked in MCA and covered by taxonomy; every MANDATORY coverage row `SOURCE_PROVIDED` or `DERIVED` (tickSize always from `--tick-rules` or act-bound `--tick-size-uniform`). The NSE↔MCA faceValue cross-check and the `currency` derivation are ADVISORY and never affect the verdict.

### 4.3 SHA-256 recording and custody procedure (operator charter)

1. Acquire every file on an egress-capable host to a quarantine directory `operator_drop/wave4-authentication-<YYYYMMDD>/` on a workstation (not committed yet).
2. Record per file: filename, **sha256** (`sha256sum`), byte size, source locator/URL, retrieval timestamp (UTC), as-of effective date, license/terms, acquiring person.
3. Verify counts: NSE rows, BSE rows, MCA rows, taxonomy rows; cross-count against the counts stated by the exchanges and by the licensor at acquisition time — a shortfall means incomplete acquisition, not a tool problem.
4. Compute a manifest `acquisition-custody-log.json` with the per-file custody fields (filename, sha256, bytes, locator, retrieval UTC, as-of date, license/terms, acquiring person); sign-off by the acquiring operator and (recommended) a second IIPS officer.
5. Copy files + custody log into the repository under `evidence/operator_drop/wave4-authentication-<YYYYMMDD>/` **only after operator sign-off**, in one commit, no transformation of bytes (no CSV re-save, no re-encoding).
6. Run the readiness check (§4.4). Commit `source-readiness.{json,csv,md}` into that same PR.
7. Any `DEPOSITION_BLOCKED` / conflicts: **do not edit files to force-pass**; enumerate dispositions and take them to PA (§4.5).
8. The deposit act (P3) then pins sha256 + recordCount + revision semantics; Wave-1 stays readable-deprecated, never deleted.

### 4.4 Validation invocation (after operator drop lands)

```bash
npm ci
npm run build:tsc                            # deterministic codegen/typecheck guard
node scripts/source_readiness.mjs \
  --nse <dir>/EQUITY_L.csv --bse <dir>/EQUITY.csv \
  --mca <dir>/mca_master.csv --taxonomy <dir>/taxonomy.csv \
  --tick-rules <dir>/tick-rules.csv \
  --output-dir audits/source-readiness-YYYYMMDD
```

Expect `verdict: DEPOSITION_READY` (exit 0) only if every deposit-intended security (NSE set) has: valid ISIN (shape+Luhn), matching identity across sources, positive lotSize, faceValue established from MCA, industry/sector coverage from the taxonomy deposit, tickSize evidence covering **every** record — plus zero blocking cross-source conflicts (NSE↔BSE symbols, MCA links, taxonomy coverage). Fallback when tick-rules cannot be obtained: `--tick-size-uniform 0.05` **only if** bound by the act (R-7; uniform 0.05 with explicit deviation notice referencing the 2024/2025 price-linked regime). The tool exits 4 (`DEPOSITION_BLOCKED`) with `tick-size` as a blocking reason otherwise — by design.

Output `audits/` is gitignored; the committed artifacts in the deposit PR are the pinned input files (evidence), custody log, and `source-readiness.{json,csv,md}`.

### 4.5 Failure handling (closed-loop with PA, never silent)

| Blocking class | Disposition path |
|---|---|
| `UNMAPPED` (equity in no source / ISIN no Luhn) | Enumerate; candidates excluded or evidence resupplied; PA sign-off per line |
| NSE↔MCA face-value conflict | Query MCA; if unresolved ⇒ reject record; never pick by heuristic |
| Symbol/ISIN divergent duplicates in tick-rules | Reject file back to operator; conflicting duplicate = not an admissible input |
| `.tickSize` gaps under price-linked regime | Re-extract band list as-of date; or act binds uniform + notice |
| Taxonomy missing ISIN/CIN rows | Operator re-supplies an extended taxonomy deposit (same named source, same as-of date) or the security is recorded as excluded in the act; never guess a sector |
| Universe size mismatch vs. exchange stated counts | Treat as incomplete acquisition; stop |

## 5. Findings that tighten the plan (amendments, append-only)

### 5.1 ci.yml hardening was load-bearing (PR #136)

Silent test-masking would have hidden the V2-R04 flake; keeping the hardened step is mandatory. The merged-main failure is traceable to it.

### 5.2 Source-readiness tool widened to the union tick regime (this PR)

`src/audit/source_readiness.ts`, `scripts/source_readiness.mjs`, `docs/d05_audit_and_source_readiness_tools.md`, and tests now accept `{0.01, 0.05, 0.10, 0.25, 0.50, 1.00, 5.00}`. Invalid-value messages list the full set. Full-coverage fixtures exercise 0.50 and 5.00. Suite green (1151 executed / 1150 pass; 1 retained skip).

### 5.3 Plan correction note appended

`IIPS_V3_D05_WAVE3_OPTION_B_GOVERNED_REPLACEMENT_PLAN_2026-11-07.md` receives a dated **Amendment A-1 (2026-11-07)** pointing at §5.2/§5.4 of this record (append-only; no prior text rewritten).

### 5.4 NSE CM tick regime (verified 2026-11-07 via public sources)

NSE moved the CM cash market to **price-linked ticks on 2024-06-10** (NSE circular 66/2024) and **revised tiers effective 2025-04-15** (CM + stock/index futures). Widely published current bands:

| Price band (₹) | Tick (₹) |
|---|---|
| < 250 | 0.01 |
| 250 – 1,000 | 0.05 |
| 1,000 – 5,000 | 0.10 |
| 5,000 – 10,000 | 0.50 |
| 10,000 – 20,000 | 1.00 |
| > 20,000 | 5.00 |

Band membership is reviewed monthly per security. Consequently a **static tick claim (e.g. uniform 0.05) is not universally true of CM EQ today**; uniform is only an *act-bound deviation-noticed* fallback. Primary route stays per-ISIN `--tick-rules` bound to an as-of circular extract. The tool never defaults; the act must bind whichever route is used. Uniform-below-0.05 used alone would mis-bind the low-price tier — if selected, the act must scope it explicitly.

### 5.5 No `.25` removal

0.25 remains in the accepted set (legacy/pre-2024 regime and any retained BSE-facing uses); it is **accepted but not asserted** to be the current CM tick anywhere in this record.

## 6. Immutability pins at bb7e103 (SHA-256, re-verified 2026-11-07)

| Artifact | Path | SHA-256 (16-hex prefix) |
|---|---|---|
| Verified corpus (2,250 records) | `evidence/operator_drop/d05_security_master_broad_universe.json` | `7f53540b…` |
| Wave-1 manifest | `evidence/operator_drop/d05_security_master_manifest.json` | `063288b3…` |
| Wave-2 disposition manifest | `evidence/operator_drop/d05_security_master_wave2_disposition_manifest.json` | `21a6b473…` |
| Wave-2 dynamic disposition | `evidence/operator_drop/wave2-2026-11-06/disposition-2026-11-06.json` | `2186087c…` |
| Wave-3 expansion receipt | `evidence/cross-repository/IIPS_V3_D05_WAVE3_UNIVERSE_EXPANSION_RECEIPT_2026-11-06.md` | `a7cff9c6…` |
| Acquisition attempt log | `evidence/operator_drop/wave3-2026-11-06/acquisition-attempt-log.json` | `93c92ec4…` |
| Runtime identity asset | `src/identity/d05_broad_universe_data.ts` | `6810c28e…` |
| Options assessment (amended) | `evidence/cross-repository/IIPS_V3_D05_WAVE3_MIGRATION_OPTIONS_ASSESSMENT_2026-11-07.md` | `f2b31a3f…` |
| Option B plan (merged) | `evidence/cross-repository/IIPS_V3_D05_WAVE3_OPTION_B_GOVERNED_REPLACEMENT_PLAN_2026-11-07.md` | `9b9940fb…` |

No corpus, manifest, receipt, attempt log, or runtime-asset byte changed in this PR. This PR touches only tool/test/doc surfaces listed in §0/§5 plus the pre-existing V2-R04 test fix.

## 7. Exact external blockers for P1 execution

1. **Egress** — NSE/BSE/MCA hosts are unreachable from this sandbox (2026-11-06 log). Acquisition must occur on a connected workstation/VM or via licensed channel. **Blocked on operator action.**
2. **MCA bulk** — no free official bulk CSV; requires licensed extract or per-CIN manual/semi-automated capture (thousands of lookups) or verified data.gov.in resource (currency unverified). **Requires PA/Procurement decision (cost/time).**
3. **Taxonomy deposit (industry + sector)** — an authoritative, named, sha256-pinned CSV keyed by ISIN (or CIN bridged through MCA), covering every deposit-intended security. No such bytes are fetchable from this sandbox (eligibility-governed); the operator must supply a licensed/official extract and pin it before the readiness run. (Whether a BSE List-of-Scrips industry column can be part of that provenance is verified at acquisition time; the NSE Indices codebook PDF is not an input and may only be cited as vocabulary provenance.) **External action required before P2.**
4. **Tick band as-of extract** — either a saved NSE circular/price-band list artifact (sha256) or the act-bound uniform fallback with deviation notice. **Decision required in the act (R-7/D-9).**
5. **SME scope (D-8)** — if in scope, A2 applies and face-value/tick evidence must cover SME series too. **Open PA decision.**
6. **As-of date** — effective date must be named by the act before bytes are pinned (all files same-date). **Open PA decision.**

## 8. Explicit non-goals

Corpus/manifest/receipt modification; revision re-pinning; identity-resolution behavior changes; reconciliation rewrite; production/DB/IRR actions; B-06 reclassification; AGI/AIIL fixture edits; substitute of unofficial sources; auto-admission of the 52; "universe expanded" claims; deployment.

## 9. Exit criteria for P1 → P2 hand-over

- `evidence/operator_drop/wave4-authentication-<YYYYMMDD>/` lands with A[/A2], B, C, D, E artifacts + custody log, sha256s recorded;
- `source-readiness` verdict is `DEPOSITION_READY` (or a PA-signed disposition memo for every blocking line, with counts reconciling to universe size);
- remediation PR carries pins (§4.3.5) + conformance additions for any admitted deltas;
- **then and only then** may the deposit act (P3) issue revision 3 (D-7) and P9/B-06 reassessment run.

*This record is documentary. It creates no security master, deposits nothing, and authorizes nothing beyond its stated scope.*

---

## Amendment A-2 (2026-11-07 — acquisition-requirements correction; append-only)

This record previously asked operators to acquire a two-part "industry taxonomy" (an NSE Indices classification codebook PDF plus a separate per-issuer ISIN→industry mapping CSV, with a suggested 12-column superset layout). An evidence-backed review against the implementation (2026-11-07, PR against `main`) established:

1. **No PDF input exists.** Nothing in `scripts/source_readiness.mjs`, `src/audit/source_readiness.ts` or `src/audit/d05_corpus_audit.ts` reads a PDF; the taxonomy input is a CSV with `industry` + `sector` keyed by ISIN or by CIN (bridged through MCA). A 12-column mapping/master structure is defined nowhere in this repository (schemas, SPECS, tests, plan, assessment) and is rejected as unsupported.
2. **No second mapping file exists.** The taxonomy CSV *is* the ISIN/CIN → industry/sector mapping; requesting a parallel artifact duplicates evidence in two custody chains and can only diverge.
3. **§4.2 has been rewritten** to the exact implementation contract — NSE `EQUITY_L`-class file, BSE listing master (`scrip code, ISIN, name`), MCA master (current, licensed, CIN + company name + face value, ISIN/SYMBOL bridge preferred), taxonomy CSV (industry + sector), tick-size evidence — with explicit non-inputs list (codebook PDF, separate mapping file, 12-column layout, SME list, stale MCA extracts, BSE face value).
4. Wave-1/2/3 bytes and all pins listed in §6 are unchanged by this correction; the corpus, manifests and receipts were not touched. B-06 remains frozen to P9. Option B and every other decision in the plan are carried forward unchanged.
5. The NSE Indices *codebook* may be cited in the act's provenance (named source of sector/industry vocabulary) but is never an input to the readiness run and confers no coverage.
