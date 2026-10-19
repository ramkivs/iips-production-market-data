# IIPS v3.0 IPD Follow-up — AIIL Identity Reconciliation and Provenance Integrity

| Field | Value |
|---|---|
| Record type | Follow-up investigation, bounded implementation, regression and evidence record (not a new C1–C7 semantic decision) |
| Repository | `ramkivs/iips-production-market-data` (IPD only) |
| Date | 2026-10-19 (UTC) |
| Workstreams | A — AIIL identity reconciliation; B — remaining provenance/quality assertions; C — integrated regression validation |
| Initial remote baseline | `origin/main` and `git ls-remote origin refs/heads/main` = `29b8351873866eeaafd9b22616458cb60af12e50` (PR #29 post-merge tracker verification) |
| Session branch | `arena/0e1c1f3b-iips-production-market-data` |
| Governing semantic direction | `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-PROGRAM-AUTHORITY-DECISION-2026-10-19-01` (C1–C7) |
| Prior implementation record | `IIPS-V3-IPD-SECURITY-MASTER-INTEGRITY-IMPLEMENTATION-ACT-2026-10-19-01`, §4 B4 and §5: no AIIL mapping change had been authorized in that earlier implementation scope |

## 1. Authority, scope and exclusions

This record executes the explicit IPD follow-up request for conditional, evidence-backed runtime correction and the named provenance/quality audit. The C1–C7 decision supplies the governing semantic rules; this follow-up does **not** claim that the semantic decision alone authorized implementation. It records the narrower direct follow-up scope: use authoritative exchange/issuer filing evidence to correct the false runtime association of `BSE:543989` with Authum, and correct the confirmed provenance/quality defects found in the requested UI, lineage and directly connected transformation paths.

The scope remains single-user and personal-use. No authentication, authorization/RBAC, service, route, persistence, database, feed, provider, consumer integration, universe expansion, or new infrastructure was added. No IRR repository, branch, PR, code, data, documentation, tracker, or release was written or changed. IRR was not accessed during this pass.

Preservation controls:

- The D05 deposited JSON, generated TypeScript mirror and manifest remain byte-for-byte unchanged; no new manifest, checksum, `effectiveFrom`, `effectiveTo`, issuer row or listing date was manufactured.
- The D05 source row and earlier evidence reports remain available as historical source records. The correction is an explicit runtime projection overlay with a stable correction ID, not a silent corpus rewrite.
- No Sai Silks record is added to D05. `BSE:543989`, Sai Silks ISIN `INE438K01021`, and symbol `KALAMANDIR` continue to fail closed in IPD because that issuer is not in the governed D05 universe.
- CV-22 Option C, the existing 13-row governed sector-reference behaviour, and `404 governed-row-not-found` are preserved. No consumer is admitted and no real-only subset is introduced.

## 2. Authoritative identity evidence

### 2.1 Exchange and issuer evidence

| Identity relationship | Authoritative record reviewed | Finding |
|---|---|---|
| BSE `543989` → Sai Silks (Kalamandir) Limited | BSE security detail: <https://m.bseindia.com/StockReach.aspx?scripcd=543989> | The BSE page captured for 2026-10-19 reports Security ID `KALAMANDIR`, Security Code `543989`, Category `Listed`, and names Sai Silks (Kalamandir) Limited. |
| BSE `543989` → Sai Silks (Kalamandir) Limited | Sai Silks filing hosted by BSE, dated 2023-10-13: <https://www.bseindia.com/xml-data/corpfiling/AttachHis/2fa67ee1-a26e-40bc-8c28-4fa8602a6075.pdf> | The BSE filing reference is `Scrip Code 543989`; the attached financial results state Sai Silks shares were listed on BSE and NSE on **2023-09-27**. |
| BSE `543989`, NSE `KALAMANDIR`, ISIN `INE438K01021` → Sai Silks | Sai Silks Regulation 31 filing (general information about the listed entity), hosted on the issuer website: <https://sskl.co.in/wp-content/uploads/2024/11/CG-30.06.2024.pdf> | The filing records `543989`, `KALAMANDIR`, `INE438K01021`, and `SAI SILKS (KALAMANDIR) LIMITED` together. This is issuer-filed listing information, not an IPD inference. |
| Sai Silks listing commencement | NSE archives, Sai Silks basis-of-allotment/listing notice dated 2023-09-26: <https://nsearchives.nseindia.com/corporate/ADV_INE438K01021_26SEP2023.pdf> | The exchange-hosted notice states trading was to commence on **2023-09-27**. The BSE filing above independently pairs BSE code `543989` with the issuer and listing date. |
| BSE `539177` → Authum Investment & Infrastructure Limited | BSE security detail: <https://m.bseindia.com/StockReach.aspx?scripcd=539177> | BSE reports Security ID `AIIL`, Security Code `539177`, and Category `Listed` (the captured page is dated 2026-08-13). |
| BSE `539177`, NSE `AIIL`, ISIN `INE206F01022` → Authum | Authum filing hosted by BSE, dated 2026-04-17: <https://www.bseindia.com/xml-data/corpfiling/AttachHis/4e085c0a-b167-455b-917a-69cf95837e6f.pdf> | The exchange-hosted filing carries BSE Scrip Code `539177`, NSE Symbol `AIIL`, ISIN `INE206F01022`, and names Authum Investment & Infrastructure Limited. |
| BSE `539177`, NSE `AIIL` → Authum | Authum filing hosted by BSE, dated 2026-10-10: <https://www.bseindia.com/xml-data/corpfiling/AttachHis/cf3751ee-37d7-49e3-9317-ce2af1c61e12.pdf> | A post-cutoff current filing continues to address BSE under Scrip Code `539177` and NSE under Symbol `AIIL`, and identifies Authum Investment & Infrastructure Limited. |
| BSE `539177` → Authum (historical evidence) | BSE-hosted Authum annual report for FY 2015–16, filed 2016-10-06: <https://www.bseindia.com/bseplus/AnnualReport/539177/5391770316.pdf> | The Authum annual report records BSE script code `539177` and the BSE listing for FY 2015–16. The ISIN at that time was `INE206F01014`, so this establishes the code/issuer relationship by that report, not the current ISIN’s first trading date. |
| BSE `539177`, new ISIN `INE206F01022` after sub-division | Authum issuer filing dated 2021-10-12, addressed to BSE and containing an NSDL activation letter dated 2021-10-08: <https://www.authum.com/AuthumPapers/ISIN-Split-12102021.pdf> | The filing identifies Script ID `AIIL`, Script Code `539177`, Authum, and the new ISIN `INE206F01022`; the embedded NSDL letter records activation on 2021-10-08. Exact first BSE trading date under the new ISIN was not established from this evidence. |

### 2.2 Relationship dates and limits

| Relationship | Start evidence | End evidence |
|---|---|---|
| BSE `539177` → Authum | Present by the FY 2015–16 annual report filed to BSE on 2016-10-06. For the current post-subdivision ISIN `INE206F01022`, NSDL activation is dated 2021-10-08 and Authum’s BSE-addressed notice dated 2021-10-12 associates it with code `539177`. The exact original BSE listing date and exact first trading date under the new ISIN were not established. | No authoritative `effectiveTo`/cessation date was found. BSE identifies the code as listed, and Authum’s BSE filing dated 2026-10-10 still uses `539177`/`AIIL`. The evidence indicates the relationship remains active through the latest filing reviewed; no end date is assigned. |
| BSE `543989` → Sai Silks | BSE filing states listing on 2023-09-27; the exchange-hosted listing notice gives the same commencement date. | No end date was established. The BSE page captured on 2026-10-19 still marks the security listed. |
| BSE `543989` → Authum | No authoritative evidence of an Authum relationship was found. The D05 association conflicts with BSE’s current security identity and the Sai Silks listing/issuer filings. | Not applicable: no supported Authum relationship or date window was established. The runtime correction removes the unsupported association; it does not create an `effectiveTo`. |

**Effective-date conclusion for `539177`:** No authoritative `effectiveTo` date was established. The code remains listed for Authum in the latest BSE evidence reviewed. It would be incorrect to infer cessation merely because another code appears in the D05 record.

**Genuinely unresolved temporal detail:** the exact original BSE listing date of code `539177` for Authum, and the exact first BSE trading date for Authum’s post-subdivision ISIN `INE206F01022`, were not established. No date is manufactured. The deposited entity-level `effectiveFrom: 2015-01-01` is preserved as source data and is not re-labelled as a listing-specific effective date; listings remain disclosed as not listing-effective-dated.

## 3. Repository provenance of the discrepancy

The complete IPD Git history was fetched before tracing history (`git fetch --unshallow origin main`). The initial working tree was clean, and both `origin/main` and `git ls-remote origin refs/heads/main` were verified at `29b8351873866eeaafd9b22616458cb60af12e50`.

The repository trace shows:

1. Commit `407d9c7e655ffed2c501b5e0072895d1e6ea4abc` deposited `evidence/operator_drop/d05_security_master_broad_universe.json` and its manifest. The `EQ_AIIL_IN` record has top-level `bseScripCode: "543989"`, BSE listing rows `543989` and `539177`, `effectiveFrom: "2015-01-01T00:00:00.000Z"`, no `effectiveTo`, and no listing-level effective dates. The manifest contains `aiilRuling: "RULING_3_DUAL_EFFECTIVE_DATED_MAPPING"`. The commit message calls this “Ruling 3” but includes no ruling text or linked exchange filing.
2. Commit `145466e05f67e51a2e2f6d3621905bd84deebb10` promoted the broad master and repeated “SteerCo Ruling 3” in the implementation narrative; registration of the record auto-indexed both BSE listing rows.
3. Commit `511bf634a39360aeadff66d86383f36ebfb1a311` added tests whose positive assertions repeated the deposited mapping. They tested internal consistency, not issuer identity against BSE records.
4. Commit `74dbc952568d34e965eb0569eb6f91ccc9e6465f` generated the TypeScript mirror and browser hydration report, repeating the “543989 current / 539177 historical” wording without listing-level dates.
5. Later release, Windows-acceptance and integration evidence repeated those assertions. They are retained unchanged as historical records and listed by path in the repository-wide search below.

Repository-history search for `RULING_3`, `Ruling 3`, `SteerCo`, `539177`, and `543989` found no separate governing SteerCo ruling record, no minutes defining “Ruling 3”, and no linked BSE listing-history evidence in the deposited package. The only ruling provenance is the manifest string, commit-message wording, and later reports/tests. **No contents or effective dates have been fabricated for the missing ruling.**

There is no separate static source mapping table for these scrip codes. `SecurityMaster.registerEntity()` indexes BSE `scripCode` values from each entity’s `listings`, using the entity-level date window; `IdentityMappingStore.resolveCompanyId()` then matches the identifier and date window. The duplicated source rows therefore made both BSE codes resolve to `EQ_AIIL_IN` at the same dates. This was a test of the repository’s own data, not external identity evidence.

### 3.1 Occurrence inventory

The repository-wide textual search (`rg --hidden --text '539177|543989|RULING_3|Ruling 3'`, excluding generated output and `.git`) found the following groups. The compressed root `.xlsx`/`.docx` were also searched inside their XML parts; neither contains these literals.

| Group | Paths | Disposition |
|---|---|---|
| Deposited source record / manifest | `evidence/operator_drop/d05_security_master_broad_universe.json`; `evidence/operator_drop/d05_security_master_manifest.json` | Deliberately unchanged to preserve original bytes and checksum. The source contains the wrong AIIL `543989` link; the manifest’s RULING_3 label remains unverified, not an operative ruling. |
| Generated D05 mirror / runtime | `src/identity/d05_broad_universe_data.ts`; `src/identity/governed_fixture_master.ts`; new `src/identity/d05_listing_corrections.ts` | Mirror remains unchanged; runtime projection applies correction ID `IPD-AIIL-BSE-SCRIP-CORRECTION-2026-10-19-001`, removes only BSE `543989` from Authum, retains `539177`, and fails closed for `543989`. |
| Direct D05 and integration tests | `tests/d05_browser_runtime_hydration.test.ts`; `tests/d05_identity_eligibility_characterization.test.ts`; `tests/d05_security_master_integrity_semantics.test.ts`; `tests/e2e_broad_universe_multi_broker_integration.test.ts`; `tests/p04_expanded_broad_universe_runtime_qualification.test.ts`; `tests/shell_security_master_surface.test.ts`; new `tests/d05_aiil_identity_reconciliation.test.ts` | Unsupported “current/historical/dual effective-dated” assertions are replaced with evidence-backed identity, source-preservation, and fail-closed regression guards. The raw manifest label is tested only as historical metadata. |
| Active convergence planning | `docs/FULL_IIPS_BI08_CONVERGENCE_PLAN.md`; `docs/FULL_IIPS_BI08_CONVERGENCE_FILE_MATRIX.md` | Updated with a dated correction note and current runtime-only correction status. |
| Historical operator/release/acceptance records | `BLOCK-3L-BROKER-CSV-FULL-RESOLUTION-AUDIT.md`; `evidence/operator_drop/BLOCK-3L-BROKER-CSV-FULL-RESOLUTION-AUDIT.md`; `evidence/operator_drop/NON_PRODUCTION_SINGLE_OPERATOR_IDENTITY_BYPASS.md`; `evidence/operator_drop/d05_browser_runtime_hydration_report.md`; `evidence/operator_drop/windows_bi08_visual_acceptance_manifest.md`; `evidence/operator_drop/windows_visual_acceptance_manifest.md`; `evidence/release-v1.0.0-rc1/release-signoff-and-archival-manifest.md`; `evidence/release-v1.0.0-rc1/release-signoff-and-archival-manifest.json`; `evidence/target-shell-integration/BI08-MASTER-IIPS-INTEGRATION-FINAL-RECONCILIATION.md`; `evidence/target-shell-integration/PHASE1B-WINDOWS-EVIDENCE-INTAKE-MANIFEST.md`; `evidence/target-shell-integration/phase1b-windows-evidence-intake-manifest.json` | Deliberately unchanged point-in-time evidence. Their assertions are superseded as descriptions of current runtime behavior by this follow-up; they are not treated as fresh evidence for the code mapping. |
| Earlier governance request/review/decision/implementation records | `evidence/cross-repository/IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_AUTHORITY_DECISION_REQUEST_2026-10-19.md`; `…DECISION_REVIEW_2026-10-19.md`; `…PROGRAM_AUTHORITY_DECISION_2026-10-19.md`; `…SECURITY_MASTER_INTEGRITY_IMPLEMENTATION_ACT_2026-10-19.md`; tracker A1 in `evidence/np04/IIPS_v3.0_IPD_IRR_CAPABILITY_INVENTORY_AND_TRACKER_RECONCILIATION_2026-10-17.md` | Deliberately preserved as records of the earlier decision state (B4 unresolved before exchange evidence was obtained). This follow-up records the later evidence and separately scoped correction; it does not rewrite their history. |

## 4. Workstream A result and minimal correction

**Finding:** BSE `543989` is Sai Silks (Kalamandir), not Authum. BSE `539177` is Authum’s BSE code; the current Authum ISIN `INE206F01022` is paired with it in BSE-hosted filings. The evidence does not support an Authum dual mapping of these two codes or the “current/historical” description. No BSE record was found showing that `539177` ceased to be valid for Authum.

**Correction:** `getGovernedBroadSecurityMaster()` now applies the narrow `applyD05AiilListingCorrection()` runtime overlay. It is guarded against an unexpected source-row shape. The runtime Authum projection carries `bseScripCode: "539177"` and only the BSE `539177` listing; `BSE:543989` is unmapped and fails closed. `INE438K01021` and `KALAMANDIR` remain unmapped because Sai Silks is not in the governed D05 universe. No `EQ_SAI_SILKS` identity is created.

**Traceability:** the source JSON and generated TypeScript mirror still contain the original row, and the original manifest/checksum remain unchanged. The correction is explicit in code, tests and this evidence record. It introduces no listing-level `effectiveFrom` or `effectiveTo` and does not rewrite the existing entity-level window.

## 5. Workstream B audit and dispositions

C1 prohibits unsupported `REAL`; C2 requires independently verifiable, record-specific evidence; C3 keeps provenance, origin, quality and consumer eligibility distinct; C4 prohibits silent substitution; C6/C7 keep producer assertions separate from consumer admission. The audit followed the data paths, not just literal searches.

| Occurrence/path | Source/execution path and defect | Disposition |
|---|---|---|
| `src/e2e/lineage_verifier.ts` | Raw fixture values were hard-coded as `REAL` and Hop 1 as `GOOD` before domain validation. The market DTO used `REAL`/`GOOD` and incorrectly copied the engine-score digest as quote lineage. Empty mock intelligence was also `GOOD`. | Raw fixture/ingress is `UNCLASSIFIED`; Hop 1 is `UNAVAILABLE` until validation; Hop 2/3 and the market DTO carry the ingress envelope’s classification, quality and lineage; empty mock intelligence is `UNCLASSIFIED`/`PARTIAL` with a content-derived digest; final view-model hop is `DERIVED`. Hop records now expose classification and quality so regression tests verify they are not conflated. |
| `src/ui/view_models/ui07_pit_corporate_actions.ts` | View-model assembly unconditionally asserted `REAL`/`GOOD`, used a placeholder lineage digest, and silently substituted factor `1.0` if an adjustment factor was absent. Input records come from PIT D04 envelopes. | Carries a single consistent input classification, otherwise `UNCLASSIFIED`; rolls up envelope quality; computes a digest from the actual input lineage and output; no input yields `UNAVAILABLE`/`UNCLASSIFIED`; missing/invalid factors are `null`, flagged, and make the cumulative factor unavailable/partial. D04 contract validation is unchanged. |
| `src/ui/view_models/ui09_restatement_timeline.ts` | `REAL` was unsupported (financial statements do not carry record-origin evidence); the digest was constant; `GOOD`/`PARTIAL` was selected from whether a restatement crossed a materiality threshold; missing revenue/PAT silently became zero or copied the original value. | The view model is `DERIVED`; its digest binds the actual input statements and comparisons; quality rolls up input statement quality plus comparison completeness, not materiality; absent/unusable values and deltas are `null`, with anomaly codes. The materiality conclusion is `null` if required inputs are missing. |
| `src/fundamentals/statement_normalizer.ts` → UI09 | Normalization could compute a numeric PAT from defaulted values and emit `GOOD` even when UI09’s revenue/PAT comparison inputs were missing. This is the direct D03 producer path for the named UI09 view model. | Narrowly records missing UI09 comparison inputs in `normalizationAnomalyCodes` and returns `PARTIAL` for those omissions. Legacy numeric normalization is preserved internally; UI09 reads the anomaly and does not present the missing metric as zero. No general D03 schema/normalization redesign was performed. |
| `frontend/src/features/portfolio/import/broker-holdings-mapper.ts`, `broker-import-ingress.ts`, `frontend/src/features/portfolio/portfolio-store.ts` | `REAL` was used as a hash-domain label for user-supplied broker CSV data, including terminal/rejected results. Broker-format detection and a file digest do not independently authenticate the file or establish real-market record origin. | Hash metadata is `UNCLASSIFIED`; broker label, content digest, deterministic lineage, fail-closed identity and save behavior remain. No provenance class is promoted from format detection. |
| `src/transports/engine_api_adapter.ts` | An omitted quote quality was silently defaulted to `GOOD` while constructing a transport DTO. | Omitted quality is `UNAVAILABLE`; an explicit validation-derived quality is preserved. No market quote contract behavior is otherwise changed. |
| `src/contracts/envelope.ts` | A structurally valid envelope with a missing runtime `qualityState` could be upgraded by `|| 'GOOD'`. | Missing quality now resolves to `UNAVAILABLE`; structural validation behavior is preserved. |
| `src/transports/screener_service.ts`, `src/ui/view_models/ui06_multifactor_screener.ts` | The derived screener response and UI06 indicator asserted `GOOD` even with no matching candidates or partial-quality candidates. | Screener quality is the rollup of matched candidate qualities (`UNAVAILABLE` for no matches); UI06 follows response quality. The UI06 route/presentation boundary remains unchanged. |
| `src/ui/view_models/ui10_anomaly_monitor.ts` | The no-payload path could report `GOOD`, and lineage was a fixed placeholder string. | No sample → `UNAVAILABLE`; supplied sample quality rolls up with freshness/anomaly results; digest is content-derived. |
| `src/ui/view_models/ui13_macro_vintage_tracker.ts`, `src/intelligence/macro_engine.ts` | UI13 asserted `GOOD` with no query results and used a fixed digest. Macro ingestion checked only a numeric value while the view consumed the result as validated. | UI13 rolls up actual query quality, returns `UNAVAILABLE` for no data, and hashes query inputs. Macro ingestion now validates the D08 payload and the release date before a query can produce `GOOD`; the PIT vintage filter remains unchanged. |
| `src/fundamentals/ratio_engine.ts` | Optional `quoteQuality` silently defaulted to `GOOD`. | Missing quote quality now defaults to `UNAVAILABLE`; tests pass the D01 validation result when claiming `GOOD`. Other ratio calculations remain unchanged. |
| `frontend/src/features/portfolio/import/ui-broker-import-view-model.ts` | A new/idle import view model began at `GOOD` before any data existed. | Default is `UNAVAILABLE`; `GOOD` is only emitted for successful/ready import states, and partial/blocked behavior is unchanged. |
| Test fixtures in `tests/wse_*`, `tests/wsf_*`, `tests/shell_executive_surface.test.ts`, `tests/e2e_broad_universe_multi_broker_integration.test.ts`, `tests/bi07_browser_runtime_compatibility.test.ts` | Synthetic/mocked quotes and test-only hash metadata had used `REAL` without record-specific evidence. | Fixtures use `UNCLASSIFIED`; assertions for cryptographic integrity, engine execution and product behavior remain. |
| `src/contracts/types.ts` | `SourceClassification` still includes the type literal `'REAL'`. | Deliberately unchanged: a type member is not an assertion or a record-level roster. Active IPD code paths no longer stamp literal `REAL` into provenance. |

Other `GOOD` uses were inspected and retained only where they are derived from an explicit control: domain validators return `GOOD` only when validation passes; freshness returns `GOOD` only inside the configured age threshold; D05 object resolution derives it from source-provided descriptors and current-snapshot status; `DataBoundExecutor` derives it when no sector defaults are injected; estimates require at least three active estimates and exclude stale inputs; alternative data quality follows its confidence threshold; D114 accepted records pass the D01/D02 validators; news quality depends on whether items exist; and `UI01`/`UI02` use worst-case input quality rollups. These values do not assert record origin or consumer eligibility.

No UI07/UI09 view-model property or transformation now promotes provenance or quality to consumer eligibility. No eligibility field or admission decision was added.

## 6. Workstream C regression and control coverage

Focused regressions cover:

- D05 source checksum/manifest preservation, Authum ISIN and BSE `539177`, fail-closed BSE `543989`, Sai Silks ISIN/symbol fail-closed, no extra D05 row, and no new effective dates.
- UI07 empty/malformed/valid PIT action data; unknown origin; input quality rollup; null instead of a fabricated adjustment factor; digest shape.
- UI09 complete material-restatement control (materiality does not downgrade quality), partial-input propagation, unknown metric/delta behavior, and digest/provenance separation.
- E2E lineage hop classifications and qualities, no `REAL` claims from fixture data, and no fabricated `GOOD` for unvalidated/empty inputs.
- UI06 empty/partial results, UI10 missing sample, UI13 missing series, missing transport/envelope/ratio quality defaults, and portfolio-import idle/partial/success controls.

Existing personal-use functionality is preserved: all 2,250 D05 entities still hydrate; Authum remains resolvable by its NSE symbol and ISIN; AGI GREENPAC remains an exact alias; broker CSV parsing, weighting, idempotency, session-only portfolio save, and unresolved handling remain covered by existing tests. No test was weakened to accept the old AIIL conflation or to preserve a false quality/provenance assertion. The previous UI06 byte-identity pin was replaced by behavioral regression coverage for the newly authorized quality correction; route, service binding and no-fabricated-payload guards remain.

## 7. Local validation and publication record

Local validation on the follow-up working tree:

| Check | Result |
|---|---|
| Focused Workstreams A–C regression set | **164 tests passed, 0 failed** |
| Full guarded suite (`npm test`) | **584 tests passed, 0 failed across 90 suites**; test runner executed 584, not a zero-test pass |
| Typecheck (`npx tsc --noEmit`) | **0 errors** |
| Production build (`npm run build`, TypeScript + Vite) | **Success**; Vite emitted the existing >500 kB chunk-size advisory only |
| Frontend checks | Vite production bundle succeeded; shell security-master, UI06 route, P13 surfaces and UI view-model tests passed in the focused/full suites |
| Dependency boundary | `npm ci` installed from the existing lockfile; `package.json`/lockfile were not changed. npm reported 3 audit advisories (2 moderate, 1 high), not remediated in this provenance-focused scope. |
| Repository/data boundary | D05 deposited JSON, generated D05 data module and manifest are unchanged; no IRR write occurred |

The authoritative final `main` SHA, PR/CI run, merge, post-merge `main` CI, remote file/blob verification and tracker reconciliation are recorded additively in the IPD capability tracker’s follow-up addendum after publication. Those remote facts are not inferred from this local test run.

## 8. Residual unresolved evidence

1. No separate authoritative text for `RULING_3_DUAL_EFFECTIVE_DATED_MAPPING` was located in the complete IPD repository history. The manifest label remains preserved but semantically unverified; no ruling contents are fabricated.
2. The exact original BSE listing date of code `539177` for Authum and exact first BSE trading date for Authum’s post-subdivision ISIN were not established. The code/issuer relationship is evidenced at least by the FY 2015–16 BSE annual report and remains current in 2026 exchange filings.
3. No authoritative `effectiveTo` date or cessation evidence for Authum’s BSE `539177` was found. BSE records continue to list it; no end date is entered.
4. Sai Silks is not present in D05. Its identity is therefore intentionally not resolvable by IPD; no universe widening was authorized.

*End of follow-up evidence record.*
