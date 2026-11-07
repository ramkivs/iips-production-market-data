# IIPS V3 — D05 Wave-3 — Option B: Governed Replacement of the Security Master
## Design, Phased Migration Plan & Program Authority Decision Register

**Governing authorization:** Program Authority decision, 2026-11-07 — **Option B — Governed Replacement of the D05 Security Master** (supersedes the previously open choice among migration options A, B, C; A and C are closed by this decision).
**Baseline verified at:** `main@fb6cf91219c0a270d42c3618aa20ed6682699817` (post-PR #135 merge; branch of this work `arena/f9c95db1-iips-production-market-data`).
**Scope:** IPD (`ramkivs/iips-production-market-data`) only. IRR is untouched; no operational database, provisioning, SCM0 or deployment action is authorized or performed by this document.
**Status:** DESIGN + PLAN + DECISION REGISTER. Nothing in this document deposits, migrates, re-pins, or executes any replacement. The replacement corpus does not exist. Runtime consumers are unchanged.
**Prior art amended:** `evidence/cross-repository/IIPS_V3_D05_WAVE3_MIGRATION_OPTIONS_ASSESSMENT_2026-11-07.md` (see its 2026-11-07 amendment block). This document operationalizes Option B; the option analysis there remains factual record.

> **Option B in one sentence.** The Wave-1 2,250-record revision is retained exclusively as historical evidence; a NEW, evidence-deposited, all-or-nothing authenticated ACTIVE NSE CM equity universe replaces it as the current governed universe under a new act, a new manifest revision and a re-pinned runtime — the old corpus is never silently "restored" and never carries a record into the new universe by default.

---

## 1. Inspected implementation (verified in this pass, not assumed)

| Surface | Verified fact | Implication for replacement |
|---|---|---|
| Contract — `src/contracts/d05_security_master.ts` | 5 enforced rules only: `companyId` non-blank; ISIN `^[A-Z]{2}[A-Z0-9]{9}[0-9]$`; ≥1 symbol direct or via listings; `lotSize` positive int; `tickSize` > 0 (else `OUT_OF_RANGE_VALUE` CRITICAL) | Replacement must satisfy these — but the CONTRACT is weaker than the deposit policy; the act + gate add the 16-field/ACTIVE/uniqueness policy |
| Runtime store — `src/identity/security_master.ts` | `SecurityMaster.registerEntity` auto-indexes ISIN/CIN/NSE+BSE symbols/composite tickers; `sourceRevision` set at hydration; `GovernedSourceRevision` pins batchId/sha256/recordCount/authorizationRef/operatingMode | Hydration-time revision pointer is the single governed provenance anchor |
| Fixture provider — `src/identity/governed_fixture_master.ts` | Exports `D05_BROAD_UNIVERSE_SOURCE_REVISION` (Wave-1 pin verbatim: batch `BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001`, sha256 `7f53540b…74b5`, recordCount 2250, authorizationRef `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001`), hydration **fails closed** on `length !== 2250`, applies `applyD05AiilListingCorrection` at runtime | Replacement = new `GovernedSourceRevision` constant + new runtime asset + pointer flip; the hydration fail-closed length check moves with it |
| Runtime asset — `src/identity/d05_broad_universe_data.ts` | 76,538 lines; blob SHA-256 `6810c28e548cf37d3efd7f06a9488cc23aca7ba05fdc06085b33870dd83a24d5` (verified 2026-11-07) | Replaced wholesale under Option B (old asset retained in git history + Wave-1 evidence, never edited in place) |
| AIIL runtime overlay — `src/identity/d05_listing_corrections.ts` | Only `EQ_AIIL_IN`; removes BSE 543989 (Sai Silks evidence), retains 539177; runtime-only, deposit untouched | Under replacement, admission must embed the 539177 evidence natively; overlay becomes redundant and must be retired or explicitly preserved for the legacy provider only (see §9 D-6) |
| Gate — `src/identity/universe_expansion_gate.ts` | UNRESOLVED-never-invent; ACTIVE+≥1 NSE listing; Luhn; conflict indexing vs prior corpus AND within deposit; disposition ADDED/ALREADY_PRESENT/INELIGIBLE/UNRESOLVED | Correct instrument for candidate evaluation; execution task must evaluate candidates against the **replacement definition** (not the old corpus as an accepted base) |
| CLI — `scripts/wave3_universe_expansion.mjs` | Emits artifacts only for ADDED>0; expected-prior-checksum hard pin; refuses writes to src//evidence/; exit 3 on zero-ADDED | Replacement mode must bind prior = Wave-1 pin for LINEAGE reporting only (not for admission) |
| Source readiness — `scripts/source_readiness.mjs` + report version 2 | `DEPOSITION_READY` requires every MANDATORY D05 field positively established (incl. tickSize via `--tick-rules` or `--tick-size-uniform`); advisory rows never block | Is the required act precondition evidence (§7) |
| Corpus audit — `scripts/d05_corpus_audit.mjs` | 2250 records, 0 findings, markers 2198/free 52 reporter; read-only | Replacement candidate must pass this tool with 0 CRITICAL before deposition |
| Browser hydration — `tests/d05_browser_runtime_hydration.test.ts`, `SecurityMasterSurface.tsx` | Hydrates governed master; UI copy reads “2,250 canonical entities” (3 comment sites + `data-testid="security-master-source"` label) | Copy pins need updating in the execution PR; no logic depends on the number |
| Broker resolution — `src/identity/broker_observation_resolver.ts` | **Hard guard:** hydration refused unless `revision.recordCount === 2250` and authorizationRef equals the Wave-1 act ref | Deposition fails closed until re-pinned; a silent flush is impossible — good; this is the single most important runtime re-pin in Option B |
| Quarantine — `src/identity/quarantine.ts` | Fail-closed `IdentityAmbiguityError`; reasons UNMAPPED/AMBIGUOUS/EXPIRED/MISSING_EXCHANGE | Behavior unchanged under replacement; previously-unmapped ids keep failing closed |
| Persistent stores / holdings | Broker holdings + imported identifiers reference `companyId` values (e.g. `EQ_AIIL_IN`, `EQ_AGI_IN`, `EQ_RELIANCE_IN…`) | Replacement MUST define a deterministic id-stability policy (§9 D-4) |
| Test pins referencing pins/counts | integrity semantics (9 refs incl. revision↔manifest equality + sector distributions), `p04_expanded_broad_universe_runtime_qualification` (3), `d05_wave2_broad_universe_disposition` (4), `universe_expansion_gate` (2), `e2e_broad_universe_multi_broker_integration` (2), `d05_corpus_audit` (1), `d05_browser_runtime_hydration` (1), `d05_aiil_identity_reconciliation` (1), `d05_identity_eligibility_characterization` (2), `ws_a_dhan_broker_holdings_identity` (2), `shell_security_master_surface` (1) | 23-pin blast radius; §8 enumerates each |
| Historical evidence (immutable) | Wave-1 manifest `evidence/operator_drop/d05_security_master_manifest.json` sha256 `063288b3…`; Wave-2 disposition manifest `…21a6b473…` (+record `2186087c…`); Wave-3 attempt log `93c92ec4…`; receipt `a7cff9c6…`; hydration report `87e1b00f…`; corpus `7f53540b…` | All remain byte-identical forever; Option B adds a NEW manifest (§5 P5) |
| §7 provenance decision (2026-10-19-01 C1–C3) | Every record `UNCLASSIFIED`; markers are counts only; wave-1 is `OFFLINE_BOOTSTRAP`, not issuer verification | Replacement rows are `UNCLASSIFIED` at deposition too; fresh issuer verification is a follow-on program, not implied by Option B |

Commands used to verify (examples): `git show origin/main:<evidence> | sha256sum`, `sha256sum src/identity/d05_broad_universe_data.ts`, `grep -RIn -e '2250' -e 'BATCH-D05-Tier2…' -e 'AUTH-D05-BROAD…' src frontend tests scripts evidence/cross-repository`, direct file reads of every named module.

---

## 2. Exact replacement semantics (normative)

- **R-1 — The replacement is the current governed universe.** Upon the governed act (P6) and re-pinning merge (P7), the authoritative ACTIVE NSE CM equity universe is the NEW revision, effective as of the act’s declared effective date. The Wave-1 revision ceases to be the current universe at that instant; it does NOT cease to exist.
- **R-2 — Wave-1 remains preserved history.** All Wave-1/Wave-2 bytes (corpus, manifests, dispositions, logs, receipts) stay immutable and referenced as evidence. Historical citations of `7f53540b…` remain valid *as citations of history*.
- **R-3 — Zero default carry-over.** Admission order is evidence-first. No record — including all 2,198 generated-series records — is carried because it existed. A generated-series record can enter only as a fresh candidate passing the full pipeline against authoritative sources; it cannot enter by lineage.
- **R-4 — The 52 previously “real-looking” records are individually revalidated.** Each must independently satisfy the complete candidate pipeline (NSE+BSE evidence, MCA bridge, taxonomy, field completeness, tick-size evidence). None is authenticated by prior classification, by Nifty membership reputation, by AGI/AIIL history, or by being in the two hand-curated reference groups.
- **R-5 — Every admitted record traces to source evidence.** Per record: source act reference + source SHA-256 + as-of date + field-level coverage (MANDATORY fields `SOURCE_PROVIDED` or act-bound `DERIVED`, per `source_readiness` v2 semantics). Untraceable ⇒ not admitted.
- **R-6 — Deterministic, closed-set NSE/BSE/MCA/taxonomy mapping.** Join keys: ISIN (primary) for taxonomy/BSE; MCA via ISIN → SYMBOL → exact normalized COMPANY_NAME (punctuation/whitespace-collapsed, case-folded). **Fuzzy matching is forbidden; ambiguity is reported, counted, and the record is rejected** as `UNRESOLVED` for that candidate cycle — never guessed.
- **R-7 — tickSize mandatory and explicitly bound.** The CM price-band tick (0.01/0.05/0.10/0.25) is supplied as per-ISIN rule rows (`--tick-rules`) or a uniform act-bound value (`--tick-size-uniform`); the deposition contract requires positive tickSize; the value is never defaulted by code.
- **R-8 — Historical revision references and rollback survive, without ever silently restoring Wave-1.** The Wave-1 revision stays a legal historical reference. Rollback is defined as a governed act re-selecting a *replacement-lineage* revision (or first deposition failing verification ⇒ the pointer never moves at all, leaving the current legacy universe explicitly labelled unverified). “Restore Wave-1 as authenticated” is not an available state; Wave-1 is evidence forever. Any rollback drill (P8) must prove hydration from Wave-1 loads but is quarantined from “authenticated” semantics — e.g., the drill asserts resolve failures → `IdentityAmbiguityError` paths remain fail-closed and UIs display the banner “unverified bulk dataset (Wave-1), not an authenticated universe”.
- **R-9 — No operational promotion.** Nothing here enables SCM0 publication, production DB writes, deployment, or manual editing of corpora. All effects flow through reviewed PRs + CI.
- **R-10 — Provenance hygiene.** Deposited replacement provenance persists the same axes as before (dep160-style per-record provenance must be extended to carry `fieldSources` — see §5 P5). Option B authorizes the mechanics to record this; it does not certify issuer truth.

---

## 3. Treatment of the 2,198 generated records and the 52 previously classified real records

### 3.1 The 2,198 algorithmic-series records

- **Disposition: categorical exclusion from the replacement universe.** They are not admitted, not "carried with markers", not "grandfathered as unverified".
- Their **frozen historical existence** is untouched: the Wave-1 corpus bytes remain accessible and the corpus audit (`scripts/d05_corpus_audit.mjs`) still reports 2198 markers / 52 marker-free for the frozen revision.
- **Lineage tags (documentation only):** replacement admission candidates MAY carry a non-authoritative `priorLineage` hint (`WAVE1_GENERATED_SERIES` / `WAVE1_52` / `NEW`) recorded in the candidate worksheet and in THIN audit metadata, NEVER in any eligibility rule, runtime index, or promotion decision.
- If a generated-series record also exists as a real NSE-listed security (same ISIN), it is admitted exclusively as a fresh candidate with fresh evidence. The generator-token shape of a name is not disqualifying; it is simply not evidence.

### 3.2 The 52 previously “real-looking” records

- **Disposition: individual revalidation only.** Each of the 52 passes through §5 P1–P4 exactly as any new candidate. No automatic authentication; the marker census (`markerFree`) is metadata, not eligibility.
- Expected outcome distribution (estimate, to be evidenced): ≈the 50 Nifty-anchored names re-admit under identical `companyId`s (their ISINs/symbols/CINs are expected to match NSE/BSE/MCA identically, so admission is derivable, cheap-to-verify); **`EQ_AIIL_IN` and `EQ_AGI_IN` are gated individually**:
  - `EQ_AIIL_IN` — admitted only if the Wave-3/Option-B sources show the issuer ACTIVE on NSE CM as of the effective date AND the BSE scrip evidence is **539177** (the Wave-1 deposit's 543989 is a documented mis-code; the Sai Silks collision is recorded at `evidence/cross-repository/IIPS_V3_IPD_AIIL_IDENTITY_AND_PROVENANCE_FOLLOWUP_2026-10-19.md` and in §1). If sources show 543989-bound Sai Silks or mismatch, `EQ_AIIL_IN` is rejected that cycle.
  - `EQ_AGI_IN` (AGI GREENPAC; NSE symbol `AGI`; alias `AGI GREENPAC` since 2022) — admitted only with ACTIVE as-of evidence; the alias mapping must be re-registered in the new provider or the act explicitly retires it (§9 D-5/D-6).
- If revalidation admits an issuer under a different symbol/token, the `companyId` regenerates (or stays — see §9 D-4) by rule, never by guess; mismatches across the 52 and the B-06 scope are reported, never bridged.
- Failing revalidation for any of the 52 ⇒ that record is absent from the replacement; previously persisted references fail closed (UNMAPPED) — that is the mandated behavior, and §9 D-11 governs operational handling of such rows.

### 3.3 What Option B deliberately does NOT do

- Does **not** extend waves, does **not** perform acquisition inside this environment, does **not** decide the PA decisions in §9, does **not** alter the corpus/manifests/evidence, does **not** change any runtime export, does **not** re-pin any consumer, does **not** edit reconciliation v1/v2, W-1 stays hard-false.

---

## 4. Dataset construction rules (admission pipeline for the replacement candidate)

Ordered; failure at any stage ⇒ candidate rejected that cycle with reason recorded:

1. **Universe declaration.** Act whitelist of series (e.g. `EQ` only; explicit disposition of `BE`/`BZ`/`SM`/`ST`/`SZ`/illiquid series — §9 D-2) and ACTIVE status as of effective date.
2. **NSE as-of extract** (P1 bytes, sha256-pinned): every NSE CM equity row satisfying the whitelist; ISIN shape+Luhn; symbol non-blank; `ACTIVE`; series in whitelist; listing date present (else `effectiveFrom` = act-bound asOf, explicitly).
3. **BSE match** (P1 bytes, sha256-pinned): same ISIN in BSE extract; scrip code unique; name present; ACTIVE. Gap policy per §9 D-3.
4. **MCA bridge** (P1 bytes, sha256-pinned): ISIN bridge preferred; else SYMBOL; else exact normalized COMPANY_NAME. No fuzzy. Conflicting CINs for one ISIN ⇒ candidate rejected, enumerated.
5. **Taxonomy mapping** (P1 bytes, sha256-pinned): ISIN-mapped industry+sector (named source, per-record coverage 100%); ambiguity ⇒ rejected. Missing industry/sector is not admissible by absence.
6. **Field completeness.** All 16 deposit fields present; CIN MCA-like pattern; `listingStatus=ACTIVE`; `currency=INR` (act states derivation); `lotSize` positive int (NSE MARKET LOT; non-F&O CM default 1 must be an act statement, not a hidden default); `faceValue` from MCA.
7. **tickSize** positive; per-ISIN band rules or act-bound uniform (R-7). Uniform use requires explicit deviation notice if issued below 0.05 for CM EQ… (act chooses).
8. **Effective window.** `effectiveFrom` = listing date (unless act binds asOf); `effectiveTo` unset for ACTIVE; corporate actions are new candidates with new windows, never retroactive edits.
9. **Uniqueness.** Within deposit AND vs Wave-1 pin (conflict → reject that candidate, enumerate vs the 2,250); also vs among-themselves (duplicates impossible by construction if ISIN unique per stage-3).
10. **Corpus audit gate.** `scripts/d05_corpus_audit.mjs` on the candidate ⇒ `CRITICAL == 0` required for P5/P6. Marker census reported (informational).
11. **Gate pass.** `scripts/wave3_universe_expansion.mjs` policy re-used with prior-binding = Wave-1 pin for LINEAGE SIGNALS; eligibility is pipeline-based, not lineage-based. `ALREADY_PRESENT` is repurposed to a reporting disposition `CARRIED_REVALIDATED` (documentation rename only at execution; not now).

**Size and composition.** No target count is imposed; the admitted size is whatever stages 1–11 support. The count constant is re-pinned from fact (§8). Expectation (documentation, not a target): ≈ the full ACTIVE NSE CM population, which is NOT guaranteed to be 2,250 — the Wave-1 deposit is not the complete universe collected on 2026-09-22; today’s figure is an artifact of the act-declared extract.

---

## 5. Phased execution plan (design for a future authorized execution)

Each phase lists dependencies, accountable owner (A), execution owner (E), required evidence, blocking conditions and completion criteria. "PA" = Program Authority; "OPD" = authorized operator with egress; "IPD" = IPD engineering review; "REV" = independent reviewer.

| # | Phase | Owner A / E | Dependencies | Required evidence | Blocking conditions | Completion criteria |
|---|---|---|---|---|---|---|
| P0 | Replacement PA decision & act preparation pack | PA / IPD | P2 design complete (this document) | Signed act draft; §9 register answered; naming of batchId, effective date, tie-ins | Any open D-## unresolved; objections in review | Signed act exists; branch + act reference named |
| P1 | Authoritative acquisition & SHA-256 pinning | PA / OPD | P0 act names the as-of date & sources | Locally supplied, SHA-256-pinned: NSE extract, BSE extract, MCA master, taxonomy, tick-rule extract; acquisition receipts; custody log | Egress to NSE/BSE/MCA unreachable from sandbox (2026-11-06 attempt log) ⇒ acquisition occurs outside sandbox as an operator act; mirrors inadmissible; unpinned bytes inadmissible | All pins landed in `evidence/operator_drop/wave4-*/` with hashes + custody notes |
| P2 | Source-readiness validation | PA / IPD | P1 | `scripts/source_readiness.mjs` run on the pinned files; committed `source-readiness.{json,csv,md}`; verdict `DEPOSITION_READY`; tick mode documented | Any blocking reason; any unexplained conflict; tick gaps | READY report committed in PR by operator; reviewer countersigned |
| P3 | Replacement dataset construction | PA / IPD | P2 READY | Candidate JSON built solely by §4 pipeline (deterministic); `corpus-audit` output 0 CRITICAL; lineage tags only informational | Manual row edits; uncovered mandatory field; non-determinism between builds (two runs differ byte-wise) | Two consecutive builds byte-identical; audit 0 CRITICAL committed as evidence |
| P4 | Identity & consistency deep validation | PA / IPD | P3 | Gate dry-run over the full candidate set; ISIN/CIN/symbol/scripTool uniqueness; MCA/taxonomy ambiguity enumeration (expected 0 or explicitly dispositioned); B-06 68-row scope-covered report (0–67 admitted count with reasons); EQ_AIIL_IN/EQ_AGI_IN individual verdicts | Any ambiguity left UNRESOLVED; any candidate lacking as-of ACTIVE proof | Reviewed validation report; unresolved enumeration empty or act-dispositioned in writing |
| P5 | Replacement revision & manifest creation | PA / IPD | P4 pass | New runtime asset `d05_authenticated_universe_data.ts` (regenerates §2 R-2 — Wave-1 file untouched); new manifest with `kind: REPLACEMENT_DEPOSITION` (kind extended by execution act), prior-revision binding to Wave-1 batch, per-record `fieldSources` provenance | Any attempt to edit Wave-1 assets or manifests; missing source pins | Artifacts hashed; fresh manifest validated against schema; hydration probe passes |
| P6 | Deposition authorization & execution | PA / OPD + IPD | P5, P0 | PA sign-off; merge PR with FULL re-pin (§8 table) incl. `D05_BROAD_UNIVERSE_SOURCE_REVISION`→ new symbol decision (§9 D-7), resolver guard, count constants, tests re-pinned; hydration verification in CI | Any pin left at 2250/Wave-1 without explicit decision; green-but-blind re-pin (tests not updated) | Merge commit; CI green; hydration + browser surface tests pass |
| P7 | Runtime consumer re-pinning & verification | PA / IPD + REV | P6 | §8 table fully closed; `broker_observation_resolver` guard rewritten to replacement pin (code review); frontend copy updated; e2e brokering/hydration; holdings import smoke vs synthetic pilot | Resolver guard unchanged but hydration flipped (would throw) — i.e., anything skipped | All suites green; surface shows replacement count + revision id; broker smoke semantics unchanged in shape |
| P8 | Historical preservation & rollback drill | PA / IPD | P6 | Wave-1 bytes re-verified post-merge (`7f53540b…`); rollback drill: hydrated legacy master loads, resolves one pinned legacy ISIN, registers quarantine paths intact; drill is evidence-only (not a runtime toggle) | Drill requires flipping authoritative pointer outside act | Drill receipt in evidence; Wave-1 checksum re-computed = pin |
| P9 | B-06 reassessment vs replacement + closure | PA / IPD | P7, P8 | Re-run 68-row holdings identity reassessment against REPLACEMENT revision; result doc w/ admitted/quarantine enumeration; close or escalate residuals | B-06 rows predate replacement and are not re-run | Closure report; PA sign-off; residuals filed |

**Ordering principle:** P1–P4 are evidence and computation; nothing lands. P5–P7 land exactly one atomic governed unit (reviewable PR + act). P8–P9 prove custody and consume the outcome.

---

## 6. What the replacement authorizes — and what it never authorizes

Authorized by Option B (each requiring the act): new deposition, manifest, runtime asset, revision pin, consumer re-pins, B-06 reassessment, retirement of the AIIL overlay (if D-6), rollback drill.
Not authorized: modifying the Wave-1 corpus or any Wave-1/2/3 manifest/receipt; acquiring mirrors; IRR changes; DB/SCM0/deploy actions; widening reconciliation v1/v2; fabricating issuer truth; calling the universe "authoritative/active" before P6 merges; B-06 reassessment before P9.

---

## 7. Required source datasets and evidence (all locally supplied, SHA-256-pinned)

| Dataset | Publisher/form | Pin requirements | Minimum content | Failure mode if unavailable |
|---|---|---|---|---|
| NSE CM equity listing master as of effective date | NSE official extract (e.g. EQUITY_L/list of active CM securities); must be bytes from the publisher or an act-authorized operator pull (not screen-scraped mirrors) | sha256 + retrieval receipt + as-of date | ISIN, SYMBOL, SERIES, NAME, listing date, MARKET LOT, status ACTIVE, (FACE VALUE) | No candidacy can start |
| BSE equity listing master as of effective date | BSE official scrip/ISIN extract | sha256 + as-of | scrip code, ISIN, name, status | BSE linkage (R-6/D-3) unprovable → candidates lacking BSE are rejected unless D-3 excuses them |
| MCA company master extract | MCA master data or act-authorized extract | sha256 + as-of | CIN, company name, face value; bridge column (ISIN or SYMBOL) strongly preferred; else exact-normalized name bridge rule stated in act | CIN unavailable → mandatory coverage fails → no deposition |
| Industry/sector taxonomy | Named source (NSE Indices classification or licensed taxonomy), version identified | sha256 + version/as-of | ISIN→industry, ISIN→sector (or CIN→…) covering 100% of admitted candidates | Coverage < 100% → no deposition |
| Tick-size evidence | NSE CM price-band circular as of effective date (mapping price band→tick) or act-bound uniform | sha256 + reference | per-ISIN tick ∈ {0.01,0.05,0.10,0.25} OR uniform declared with deviation notice | tick contract unprovable → no deposition |
| Signing act + custody log | PA | names, dates, signatories (§9 D-13) | scope, series whitelist, effective date, admissions protocol §4, rollback definition R-8 | Process authority undefined |
| Prior-revision binding evidence | IPD | corpus sha256 `7f53540b…`, manifest `063288b3…` | chain of custody from Wave-1 to replacement act | Lineage unauditable |

---

## 8. Re-pinning blast radius (exhaustive path list)

Execution task P6/P7 must close every row; rows marked RO are doc-only edits.

| # | Path | Current pin | Replacement action | Change type |
|---|---|---|---|---|
| 1 | `src/identity/governed_fixture_master.ts` | `D05_BROAD_UNIVERSE_SOURCE_REVISION` (Wave-1) | New constant (proposed name §9 D-7); hydration length check → actual count; entity loop reads new asset; Wave-1 asset no longer imported at runtime | code |
| 2 | `src/identity/d05_broad_universe_data.ts` | 2,250 rows, sha `6810c28e…` | RETIRE from runtime; new `d05_authenticated_universe_data.ts`; Wave-1 file kept in git (delete import in #1) | code |
| 3 | `src/identity/d05_listing_corrections.ts` | AIIL 543989→539177 runtime overlay | Retire or re-scope to legacy provider only; replacement rows carry 539177 natively (§ D-6) | code |
| 4 | `src/identity/broker_observation_resolver.ts` | `recordCount === 2250` && act ref check | Revision-driven pin from new export (count-agnostic or manifest-matched) | code |
| 5 | `src/identity/index.ts` | re-export list | May add new constant export | code |
| 6 | `tests/d05_security_master_integrity_semantics.test.ts` | revision↔manifest equality; distribution pins (9 refs) | Re-pin manifest fixture; distributions from new universe; Wave-1 tests move to legacy-evidence pin set | test |
| 7 | `tests/d05_wave2_broad_universe_disposition.test.ts` | disposition pins (4 refs) | Historical-evidence assertions retained; any runtime facet re-pointed | test |
| 8 | `tests/p04_expanded_broad_universe_runtime_qualification.test.ts` | runtime qualification pins (3) | Re-pin to replacement hydration | test |
| 9 | `tests/d05_browser_runtime_hydration.test.ts` | hydration pins (1) + AIIL/AGI presence assertions | Update expected ids to replacement set | test |
| 10 | `tests/d05_aiil_identity_reconciliation.test.ts` | AIIL runtime-overlay expectations | Retire/replace with native-evidence expectations | test |
| 11 | `tests/d05_identity_eligibility_characterization.test.ts` | 2250/legacy eligibility (2) | Re-pin | test |
| 12 | `tests/d05_corpus_audit.test.ts` | corpus sha + 2250/2198/52 pins | Historical pins vs frozen bytes retained as LEGACY test; new replacement integration pins added | test |
| 13 | `tests/universe_expansion_gate.test.ts` | gate pins incl. 2,250-adjacent counts (2 refs) | Adjust lineage assertions only; gate semantics unchanged | test |
| 14 | `tests/e2e_broad_universe_multi_broker_integration.test.ts` | 2,250-era multi-broker wiring (2) | Re-pin | test |
| 15 | `tests/ws_a_dhan_broker_holdings_identity.test.ts` | 2,250-era identity expectations (2) | Re-pin vs replacement semantics | test |
| 16 | `tests/shell_security_master_surface.test.ts` | UI surface expectation (1 ref) | Update label expectation | test |
| 17 | `tests/wsd_p12_product_transports.test.ts`, `tests/non_production_operator_identity_bypass.test.ts`, `tests/bi08_idempotent_ingress.test.ts`, `tests/durable_*.test.ts`, `tests/portfolio_ui_package.test.ts`, `tests/shell_mount_bi08_route.test.ts`, `tests/v1_broker_import_reconciliation.test.ts`, `tests/q1_broker_import_durability.test.ts` | import via provider singleton | Behavioral assertions unchanged if ids preserved; otherwise re-pin | test (verify only) |
| 18 | `frontend/src/features/security-master/SecurityMasterSurface.tsx` | “2,250 canonical entities” copy + testid label; comment refs (3 sites incl. `navigation.ts`) | Copy/label updated to “authenticated deployment” phrasing with revision id | code+copy |
| 19 | `frontend/src/app/App.tsx`, `frontend/src/features/portfolio/PortfolioWorkspace.tsx`, `src/ui/portfolio_ui_package.ts`, `src/persistence/brokerImportPersistence.ts`, `src/persistence/portfolio_store.ts` | comments/types referencing broad universe/pin semantics | Update comments/docs-only where needed; no behavior | code+docs |
| 20 | `scripts/verify-public-package.mjs`, `scripts/wave3_universe_expansion.mjs` | references for evidence pins | Update doc/pin references; CLI prior-binding default kept for operator utility (documented legacy) | scripts |
| 21 | `evidence/cross-repository/*` historical reports/manifests | 2026-10..11 historical claims | NEVER edited; P8 adds NEW receipt only | evidence (append new only) |
| 22 | `docs/d05_audit_and_source_readiness_tools.md` + this repository’s D05 runbooks | tool docs | Add replacement runbook post-P7 (documentation-only, in P9) | docs |
| 23 | All `count===2250`/`recordCount` fusions & sector-distribution pins (integrity semantics, p04 qualification, disposition, browser hydration) | values | Exact re-pin from measured replacement bytes | test |

Total enumerated: 23 rows. None is modified by THIS work item (design boundary).

---

## 9. Remaining PA decisions genuinely required (beyond selecting Option B)

A/B/C is closed; these are the consequential sub-decisions Option B needs before P0 can sign. None re-opens the option.

| Id | Decision | Default recommendation (PA may override) |
|---|---|---|
| D-1 | Effective/as-of date of the authenticated universe + corpora windows (`effectiveFrom` for pre-existence listings) | act-declared as-of date = extraction date |
| D-2 | Series whitelist in scope (EQ only? BE? partial/suspended-adjacent series?) | EQ only; everything else excluded with reason code |
| D-3 | Is BSE linkage mandatory for admission, or a gapped universe with documented NSE-only exceptions? | Mandatory; exceptions enumerated IN writing or rejected |
| D-4 | companyId stability: (i) reuse `EQ_<TOKEN>_IN` where ISIN/symbol match legacy (strongly recommended for holdings stores), (ii) always regenerate, or (iii) sidecar lineage table | (i) — deterministic regeneration rule bound to NSE symbol tokens; persisted stores unaffected |
| D-5 | `EQ_AIIL_IN` disposition outcome enumeration (admit with native 539177 evidence / reject) — individual revalidation, two-step PA sign-off | Outcome reported BEFORE act; PA confirms |
| D-6 | Retire `applyD05AiilListingCorrection` at P6 (recommended) or keep as no-op for legacy provider | Retire for runtime; legacy provider retains frozen overlay for Wave-1 loads only |
| D-7 | Revision constant naming & export: `D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION` (recommended) vs rename Wave-1 constant | New export added; old constant kept `@deprecated` for legacy/tests |
| D-8 | New batchId + act reference form (e.g. `BATCH-D05-AUTHENTICATED-CM-2026-11-…`, `AUTH-D05-AUTHENTICATED-UNIVERSE-ACT-2026-11-…`) | PA to name explicitly |
| D-9 | tick-size evidence route: per-ISIN `--tick-rules` (recommended, strongest per-record binding) vs act-bound `--tick-size-uniform` (permitted with deviation notice) | per-ISIN rules if circular extract obtainable; else uniform 0.05 bound in act |
| D-10 | B-06 68-row reassessment sequencing | Only post-P6/P7 merge, against replacement (§5 P9) |
| D-11 | Persisted legacy references in operational stores for securities NOT admitted by replacement (archive as UNCLASSIFIED / re-key / mark quarantined) | No deletion of stored observations; provenance+status re-labelled by issuing act; W-1 stays hard-false |
| D-12 | Rollback triggers (hydration failure; integrity drift; fatal data defect post-merge) and drill evidence retention location | Rollback act pattern in R-8; drill receipt in `evidence/cross-repository/` |
| D-13 | Signatories/witnesses for the act + custody of acquisition bytes | PA + operator + independent reviewer |
| D-14 | Treatment of `priorLineage` audit-only tags in the candidate worksheet | Allowed; excluded from eligibility; retained in deposition evidence bundle |
| D-15 | Confirmation that reconciliation v1/v2 semantics remain untouched by this program | Presumed; PA states explicitly in act |

---

## 10. Known limitations & non-goals

- The authenticated universe **does not exist** as of this document; any statement of its size, composition or admission outcome would be fabrication.
- Option B does **not** by itself satisfy the Wave-3 blocked acquisition (sources §7 remain unavailable from this sandbox); P1 is an external operator action.
- Option B does **not** reclassify any 2,250 record to "authenticated"; the two universes are disjoint revisions.
- Option B does **not** authorize B-06 reassessment before P9, nor any production action at any phase without a dedicated PA act.
- Option B does **not** change IRR, does not inspect/modify IRR working trees, and does not authorize mirrors of any nature (NSE/BSE/MCA/taxonomy bytes must be locally deposited + pinned).
- This document itself carries no operational power; only the executed act + reviewed PR binds anything.

---

## 11. Verification executed in this pass (2026-11-07)

1. `git show origin/main:evidence/operator_drop/d05_security_master_broad_universe.json | sha256sum` ⇒ `7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5` ✓
2. `git show origin/main:evidence/operator_drop/d05_security_master_manifest.json | sha256sum` ⇒ `063288b3…` ✓ ; Wave-2 manifest `21a6b473…` ✓ ; attempt log `93c92ec4…` ✓ ; receipt `a7cff9c6…` ✓
3. `sha256sum src/identity/d05_broad_universe_data.ts` ⇒ `6810c28e548cf37d3efd7f06a9488cc23aca7ba05fdc06085b33870dd83a24d5` ✓
4. `git rev-parse origin/main` ⇒ `fb6cf91219c0a270d42c3618aa20ed6682699817`; branch `arena/f9c95db1-iips-production-market-data` == base ✓
5. Consumer census (§8) produced by `grep -RIn` across `src`, `frontend`, `tests`, `scripts` for: `BATCH-D05-TIER2…`, `AUTH-D05-BROAD…`, `D05_BROAD_UNIVERSE_SOURCE_REVISION`, `getGovernedBroadSecurityMaster`, `6810c28e`, `2250` — 23 enumerated rows; no file outside §8 references the pins.
6. `scripts/source_readiness.mjs` invoked on a 4-security synthetic fixture: no tick evidence ⇒ `DEPOSITION_BLOCKED` (exit 4, MANDATORY tickSize); with `--tick-size-uniform 0.05` ⇒ `DEPOSITION_READY` (exit 0). Confirms R-7 feasibility requirement.
7. This document is the **only** new content; corpus/manifests/evidence untouched (working tree diff confined to this file, its amendment, one test).
8. PR #136, first CI attempt (run 42344399882): all substantive steps passed on the runner — Install, `tsc --noEmit`, `npm run build`, guarded `npm test`, Public package consumer — but the bookkeeping step "Publish executed test count" published `tests=null, pass=null, fail=null` from its tee'd `test-output.log` and marked check `executed test count` as failure. The same command sequence parsed locally emits `tests=1143 pass=1142 fail=0`, and CI on PR #135 (identical workflow) published the count successfully minutes earlier — the step proved intermittent, not definitional, so content was unchanged for the re-push. Recorded here for evidence-keeping; re-pushed (this revision) re-triggers CI on the same commit tree with one new sentence in this section. If this issue recurs after the re-push it will be escalated against the workflow itself, not silently tolerated.
