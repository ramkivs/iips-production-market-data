# IIPS v3.0 CAP-02 — B-1R IPD PIT/D114 package-compatibility implementation act

> **STATUS: RENDERED — EFFECTIVE FOR THE EXACT SEMANTIC SCOPE AND FILE MANIFEST BELOW.**
> This is an IPD-owned, narrow implementation act for the existing non-production IRR consumers. It
> authorizes no operational write, production acquisition, consumer admission, gate movement, identity
> provisioning, binding provisioning, durable capability or IRR mutation.

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-CAP02-B1R-IPD-COMPATIBILITY-IMPLEMENTATION-ACT-2026-10-23-01` |
| Date | `2026-10-23` (UTC) |
| Repository | `ramkivs/iips-production-market-data` only |
| Verified authoritative baseline | IPD `main@b3428f3f431eceb1dcde60e3b120bbd1888622bb`, tree `e4825caa911afa4f1cfe752442b31b6f755417c7`; clean session worktree at the same commit/tree |
| Read-only consumer baseline | IRR `main@98cd56a9a568f431ea31d5515e515a1b6cbb91ba`, tree `001d7e8addcc49c9a6c7d536d24c1056e2733a26` |
| Decision authority | Ramki, Program Authority; standing global decision/execution grant of 2026-10-12 as construed by DEC-06 R-1/R-3/R-6/R-7, together with the current explicit CAP-02 one-pass execution direction |
| Publication authority | Existing IPD PR-lifecycle execution and merge authorization; session branch → PR → required checks → merge → remote read-back |
| Operating disposition | `NON_PRODUCTION / OFFLINE_BOOTSTRAP / LOCAL_FIXTURE_AND_OFFLINE_DEV` — unchanged |

## 1. Why this act is renderable and necessary

The Increment A act is effective only for `./portfolio-ui`; the U2 acts govern broker-import
persistence and do not govern this read-only market-data surface; the U7 provider act governs outcome
semantics but expressly left the package entry's type-export set unchanged. None covers this manifest.
The effective IRR composition act is consumer-side authority only and is not cited as IPD authority.
Its dated corrections are used solely as evidence of the actual package prerequisite.

The standing PA grant is the recorded basis for rendering a specific IPD act, not a reason to stretch
an older act. The current PA direction expressly requires the precise boundary to be reconciled and a
narrow IPD-owned decision to be rendered when the standing authority permits it. This record is that
specific decision. Its scope is limited to established CAP-02/B-1R compatibility work, is additive and
reversible, and preserves every write and gate fence.

Effective semantic inputs independently support the required design:

* IPD's approved provenance/eligibility decision C6 keeps D05 `companyId`, IRR identity and PIT
  `securityId = ISIN:<isin>:<series>` distinct and prohibits namespace collapse.
* IPD's D114 Stage-5 act authorizes local offline/non-production PIT ingestion only; production
  acquisition, live network execution and production deployment remain unauthorized.
* The actual IRR consumers require a read-only, series-qualified PIT facade and deterministic local
  D114 population. They do not require or receive production persistence, tenant identity or a
  company/security mapping service.
* The off-main IU-1/IU-2 records and `2e11fa3b…` implementation are comparison evidence only. They are
  not current-main authority and no branch, commit or file is promoted wholesale.

## 2. Authority determination by API group

| API group | Effective authority and exact permitted scope | Action under this act |
|---|---|---|
| PIT read service | This act: one synchronous, read-only `PitReadService` over an injected `PointInTimeStore`; exact request/hit/miss types; no store construction, mutation method, persistence, IPC or provisioning | Implement and export through `./pit` |
| Security identity/store semantics | This act, applying approved C6: additive optional series-aware identity on canonical D01/D02/envelope records; explicit `${companyId}:${domain}[:${securityId}]` keys; no equality or derivation between company and security IDs; fail closed on malformed, missing-required or conflicting identity | Implement only the additive semantics in §3 |
| Admitted-series lookup | This act: deterministic, read-only enumeration of keys actually admitted by successful `append`; no classification-based eligibility inference and no hard-coded series list | Implement `listAdmittedSeriesKeys` and tests |
| D114 population | This act plus the existing Stage-5 non-production boundary: embedded local CSV fixtures through the authoritative parsers/normalizer/loader into a caller-supplied in-memory PIT store; exact consumer helpers/constants; no network or production acquisition | Implement and export through `./d114-non-production` |
| PIT/D114 package exports | This act: exact `./pit` and `./d114-non-production` manifest entries, runtime/declaration builds and packed-consumer tests; preserve `./portfolio-ui`; no `./persistence`, wildcard or internal privileged export | Build, pack and publish |
| U7 receipt/refusal package surface | This act supplements the effective U7 provider act only at its package/type vocabulary boundary: re-export the three existing receipt/outcome type names and add the two established Class A refusal codes to the existing union; no behavior, retry, receipt, durability or write change | Complete and verify through the real public package |

## 3. Governed semantics fixed by this act

1. **Identity separation.** `companyId` remains the company/resource key. A series-qualified
   `securityId` is separate market-data identity. Neither is fabricated from the other, from a symbol,
   sector or tenant. The only accepted public read grammar is exactly `ISIN:<isin>:<series>` with a
   structurally valid 12-character alphanumeric ISIN and a nonblank, delimiter-free series.
2. **Source propagation.** D114 identity comes only from the raw archive's validated ISIN and
   `SctySrs`/`SERIES` fields. `isinAuthority` remains `NON_AUTHORITATIVE`: structural identity is not
   issuer certification, eligibility, entitlement or production approval. Missing/malformed required
   series data rejects the archive; there is no company-only fallback for such a D114 record.
3. **Additive storage.** Existing envelopes without `securityId` retain their legacy
   `${companyId}:${domain}` key and query behavior. An envelope with `securityId` uses
   `${companyId}:${domain}:${securityId}`. If a payload carries `securityIdentity`, the envelope must
   carry the same explicit `securityId`; missing, malformed or disagreeing identities are rejected at
   admission rather than collapsed.
4. **Unambiguous legacy query.** A company/domain query without `securityId` reads the sole admitted
   key for that company/domain. If multiple distinct series-aware keys exist, it throws an ambiguity
   error rather than selecting one. A query with `securityId` never falls back to a company-only or
   different-series key.
5. **Read result.** The service returns the newest admitted envelope whose `provenance.asOf` is at or
   before the requested UTC instant. It returns typed `NOT_FOUND`, `AMBIGUOUS`, `INVALID_ASOF`,
   `INVALID_IDENTITY` or `INVALID_DOMAIN` misses. It never invents an observation and never exposes
   `companyId` in a hit. Impossible calendar dates are invalid; Date.parse rollover is not acceptance.
6. **Admission enumeration.** `listAdmittedSeriesKeys()` enumerates the store's actual successfully
   admitted keys in lexical order, including any legacy company/domain keys for backward-compatible
   introspection. The read service considers only keys matching the complete requested domain and
   series-qualified identity. Multiple company mappings for the same requested identity/domain are
   `AMBIGUOUS`. Source classification and quality are not repurposed as eligibility flags.
7. **PIT invariants.** Append-only ordering, deep-copy admission, range/as-of selection, idempotent
   D114 signatures, future-vintage exclusion and verbatim provenance projection are preserved.
8. **D114 population.** The three frozen local archives cover both existing parser eras and two
   distinct series over three dates. Population uses the existing loader and the same caller-supplied
   store for D01/D02; replay through the returned loader is idempotent. No second store or PIT
   authority is created.
9. **U7 preservation.** Only a real receipt establishes committed success and receipt-driven
   durability. Refusal remains fabrication-free, `OUTCOME_UNKNOWN` remains distinct with no automatic
   retry, `getAnalytics` remains optional, and the shipped adapter remains `SESSION_ONLY` /
   `durable:false`.

## 4. Exact public surfaces

### `./pit`

Runtime: `PointInTimeStore`, `PitReadService`.

Types: `PITQuery`, `PitReadRequest`, `PitReadResult`, `PitReadHit`, `PitReadMiss`,
`PitReadFailureReason`, `CanonicalEnvelope`, `DataDomain`, `DataProvenanceDTO`.

`buildPitKey`, D114 construction helpers, persistence, IPC and provisioning are not public package
exports. `PointInTimeStore.append` remains the existing store API needed by the admitted
non-production consumers; the read service itself exposes no mutation.

### `./d114-non-production`

Runtime: `createNonProductionD114PitStore`, `populateNonProductionD114Pit`,
`ingestNonProductionD114Archives`, `NON_PRODUCTION_D114_EQ`, `NON_PRODUCTION_D114_BL`,
`NON_PRODUCTION_D114_VINTAGE_1`, `NON_PRODUCTION_D114_VINTAGE_2`,
`NON_PRODUCTION_D114_VINTAGE_3`.

Types: `NonProductionD114Population`, `ArchiveIngestionResult`.

The archive corpus, loader class, parsers, acquisition helpers and all other D114 modules remain
internal to this subpath's dependency closure. No production population entry point is created.

### `./portfolio-ui`

All 22 existing runtime exports remain. Add type-only re-exports for the already-existing
`PortfolioCommitDisposition`, `PortfolioCommitReceipt` and `PortfolioPortSaveOutcomeUnknown` names.
Add `WRITE_NOT_AUTHORIZED` and `RESOURCE_UNAVAILABLE` to `PortfolioPortRefusalCode`. No new runtime
export is required and no write behavior changes.

## 5. Exact authorized file manifest

| Path | Authorized change |
|---|---|
| `src/contracts/types.ts` | Add the D114 series-identity type, grammar constants and fail-closed constructors/guards only |
| `src/contracts/d01_quotes.ts` | Add optional `securityIdentity` to the canonical payload |
| `src/contracts/d02_ohlcv.ts` | Add optional `securityIdentity` to the canonical payload |
| `src/contracts/envelope.ts` | Add optional explicit `securityId` to the envelope/factory; preserve the existing quality fallback and all unrelated validation |
| `src/d114/cm_udiff_parser.ts` | Propagate validated ISIN+`SctySrs` at the two existing normalization seams; reject missing/blank required series |
| `src/d114/legacy_bhavcopy_parser.ts` | Propagate validated ISIN+`SERIES` at the two existing normalization seams; reject missing/blank required series |
| `src/d114/pit_ingestion_loader.ts` | Require validated D114 identity for parser-produced records, carry it into envelopes and series-aware idempotency/envelope IDs; keep diagnostic report generation fail-closed on ambiguous samples |
| `src/pit/pit_store.ts` | Add the exact key/index/query/enumeration semantics in §3; preserve legacy APIs |
| `src/pit/pit_read_service.ts` **new** | Implement only the read-only contract in §§3–4 |
| `src/pit/package.ts` **new** | Re-export only the `./pit` surface in §4 |
| `src/d114/non_production_pit_population.ts` **new** | Implement the frozen local corpus and three population helpers; no network/acquisition code |
| `src/d114/non_production_package.ts` **new** | Re-export only the `./d114-non-production` surface in §4 |
| `frontend/src/features/portfolio/portfolioStorePort.ts` | Add the two established refusal-code union members only |
| `src/ui/portfolio_ui_package.ts` | Add the three type-only U7 re-exports only |
| `package.json` | Add the two exact exports and PIT package build wiring; add the public-consumer verification script; no dependency/version/engine change |
| `tsconfig.pit-package.json` **new** | Build exactly the PIT and D114 package roots to `dist/package` with declarations |
| `tests/cap02_pit_d114_package.test.ts` **new** | Focused identity/store/read/D114/manifest/closure tests |
| `tests/portfolio_ui_package.test.ts` | Reconcile only the export-count/build assertions with the three-subpath manifest; retain every browser/write safeguard |
| `tests/q1_cap02_u7_provider_outcomes.test.ts` | Add narrow compile/source assertions for the completed refusal/type surface; retain every existing assertion |
| `scripts/public-package-consumer.mts` **new** | Compile-time/runtime consumer of the actual public subpaths, including all U7 type names and refusal codes |
| `scripts/verify-public-package.mjs` **new** | Pack, install into an isolated temporary consumer, run runtime/type/declaration/content/browser-closure checks |
| `.github/workflows/ci.yml` | Add the public-package consumer verification step after the guarded repository tests; no runner, permission or gate change |
| `evidence/cross-repository/IIPS_V3_CAP02_B1R_IPD_COMPATIBILITY_IMPLEMENTATION_ACT_EFFECTIVE_2026-10-23.md` **new** | This act |
| `evidence/cross-repository/IIPS_V3_CAP02_B1R_IPD_COMPATIBILITY_EXECUTION_EVIDENCE_2026-10-23.md` **new** | Consumer matrix, design reconciliation, validation and publication evidence |
| `evidence/cross-repository/IIPS_V3_CAP02_B1R_IPD_COMPATIBILITY_FINAL_REPORT_2026-10-23.md` **new** | Consolidated final report; distinguish package compatibility from Gate 4 and IRR E2E |
| `evidence/cross-repository/IIPS_V3_CAP02_B1R_PACKAGE_AND_GATE4_PREPARATION_2026-10-23.md` | Append outcome; preserve all earlier findings |
| `evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md` | Append actual implementation/publication state; preserve gate distinctions |

No other source, schema, migration, persistence, IPC, identity-master, corpus, route, UI composition or
IRR path is authorized. In particular, `src/persistence/**`, `src/ipc/**`, `src/identity/**`, the D05
corpus, `package-lock.json`, `tsconfig.json`, `tsconfig.portfolio-ui-package.json` and IRR are unchanged.

## 6. Required verification and non-claims

Required: typecheck; production build; focused PIT/D114/U7/refusal/authority/binding suites; full
repository suite; exact runtime and TypeScript resolution of all public subpaths from an installed
pack; compilation of the five actual IRR importing files in a disposable consumer copy; PIT/D114
runtime consumer tests; packed-content and declaration-reference checks; browser-platform UI bundle
and forbidden-closure scan; `npm pack --dry-run`; `git diff --check`; PR and post-merge CI; remote
commit/tree/blob read-back; and merged-commit consumer re-proof.

Linux fixtures, package tests and CI are not target-host qualification. This act does not execute or
qualify Gate 4, render U4, grant U5/U6, provision Gate A′ identities/bindings, authorize a durable
write, mount an IRR modal, execute the IRR B-1R repin or claim cross-repository production E2E.
`WRITE_NOT_AUTHORIZED`, `SESSION_ONLY` and `durable:false` remain operative.

*Rendered under the standing Program Authority grant and the current explicit CAP-02 one-pass
execution direction. No signature, approval identifier, host result or independent agent jurisdiction
is fabricated.*
