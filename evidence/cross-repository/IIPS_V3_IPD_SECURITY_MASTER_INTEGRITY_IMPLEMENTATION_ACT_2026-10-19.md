# IIPS v3.0 — IPD Security Master Integrity Convergence: Implementation Act and Closure Record

| Field | Value |
|---|---|
| **Record type** | Implementation act (bounded, per decision §6) + closure record for findings B1–B4 |
| **Record identifier** | `IIPS-V3-IPD-SECURITY-MASTER-INTEGRITY-IMPLEMENTATION-ACT-2026-10-19-01` |
| **Authority** | **Program Authority (Ramki)** — execution assignment *"IPD Security Master Integrity Convergence — One-Pass Investigation, Implementation, Verification and Closure"* (2026-10-19), issued under the standing global and implicit one-pass authorization for routine in-scope investigation, implementation, testing, documentation, commits, publication, remote verification and tracker updates |
| **Governing decision** | `evidence/cross-repository/IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_PROGRAM_AUTHORITY_DECISION_2026-10-19.md` — `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-PROGRAM-AUTHORITY-DECISION-2026-10-19-01` (C1–C7, §5 integrity boundaries) |
| **What this record supplies** | The implementation-authority elements the decision §6 requires before any production change: exact baseline SHA, permitted file set, exclusions, required tests, acceptance evidence — plus the selected vocabulary that C1/C4/C5 left to "a separate implementation contract" |
| **Repository** | `ramkivs/iips-production-market-data` (IPD) only. IRR is read-only context. |
| **Date** | `2026-10-19` |
| **Product boundary** | Single-user, strictly personal-use application. No auth, RBAC, multi-user, new persistence, service, API or infrastructure. |

---

## 1. Stage A — Baseline and governance verification

### 1.1 Authoritative baseline (verified, not assumed)

| Check | Result |
|---|---|
| `git ls-remote origin refs/heads/main` (start of pass) | `77f843217593dfd0b33a106f27bafb432aa0b82d` — equals the reported baseline; no later authoritative commit exists |
| Merge parents of `77f8432` | `02a5803145cf215083caf80f54ba1ac458e1682c` (PR #26 merge) + `3d47bc6d6a23b6664891eef9f9f9d67662e84357` (PR #27 head) |
| PR #27 | `docs(governance): publish Program Authority decision — IPD provenance & eligibility C1–C7` — **MERGED** 2026-10-19T17:59:08Z, head `arena/e912ce0e-…`, 2 files (+696/−0): decision record + evidence review |
| PR #27 CI (head `3d47bc6`) | `typecheck · build · test` **SUCCESS** (run `39298654094`); `executed test count` **SUCCESS** |
| Post-merge `main` CI (`77f8432`, push) | run `39298753519` **SUCCESS**; `executed test count` check: **565 tests executed — 565 passed, 0 failed** |
| Local baseline re-run at `77f8432` | `npx tsc --noEmit` 0 errors; `npm run build` OK; `npm test` **565 / 565 pass, 88 suites** |

### 1.2 Provenance chain on authoritative `main@77f8432`

| Record | Identifier (verified in file) | Blob |
|---|---|---|
| Originating decision request | `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-DECISION-REQUEST-2026-10-19-01` | `82289a47…` |
| Evidence review | `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-DECISION-REVIEW-2026-10-19-01` | `f3106641…` |
| **Operative decision** | `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-PROGRAM-AUTHORITY-DECISION-2026-10-19-01` — Status **APPROVED BY PROGRAM AUTHORITY** | `ecbe48d7…` |

All seven dispositions are present on `main` (7 × `### C[1-7] —` headings, each `Disposition: APPROVED — …`): C1 prohibit unsupported `REAL`; C2 record-specific evidence tied to governed revision; C3 keep provenance / origin / quality / eligibility distinct; C4 prohibit silent substitution; C5 bounded non-production display with honest disclosure; C6 producer-scoped assertions, consumer-scoped eligibility; C7 strict gate, no real-only subset. **No material evidence conflict** was found between the request, review and decision.

### 1.3 IRR read-only verification (no write of any kind)

`GET repos/ramkivs/iips-review-recovered/commits/main` → `ad008e45e64f15e895043bd2c554a7c93a4c2dc1` (matches the decision's recorded IRR inspection point). `GET …/contents/docs/integration/IIPS_v3.0_CV22_OPTION_C_PA_DECISION_2026-10-19.md` (blob `0bdff614…`) → *"CV-22: OPTION C — DEFER EXPANSION PENDING DEFINED PREREQUISITES"*, 13-row sector-reference universe preserved, `404 governed-row-not-found` existing behaviour, probe **not mandatory**. Confirmed; not modified.

---

## 2. Implementation scope (decision §6 elements)

| Element | Content |
|---|---|
| **Baseline** | `origin/main` @ `77f843217593dfd0b33a106f27bafb432aa0b82d` (exact) |
| **Permitted source changes** | `src/transports/object_resolver.ts`; `src/ui/view_models/ui08_security_master_modal.ts`; `src/identity/security_master.ts` (optional `sourceRevision`, additive constructor option); `src/identity/governed_fixture_master.ts` (revision constant + binding); `src/contracts/types.ts` (additive `SourceClassification` member `'UNCLASSIFIED'`); `frontend/src/features/security-master/SecurityMasterSurface.tsx` (disclosure rows) |
| **Permitted test changes** | New `tests/d05_security_master_integrity_semantics.test.ts`; deliberate revision of the defect-pinning tests in `tests/d05_identity_eligibility_characterization.test.ts`; correction of the two assertions that encoded `REAL` as "governed" (`tests/wsd_p12_product_transports.test.ts` P12-05, `tests/shell_security_master_surface.test.ts` SM-05) |
| **Permitted documentation** | This record; additive addendum to the IPD capability tracker |
| **Exclusions (not authorized, not done)** | Any change to the D05 corpus (`src/identity/d05_broad_universe_data.ts`, `evidence/operator_drop/d05_security_master_broad_universe.json`), manifest, schema or roster; any AIIL data/manifest/report rewrite; historical-descriptor versioning; any eligibility roster or real-only subset; any IRR file, branch, PR or tracker; any consumer (IRR/PIT/portfolio/engine) admission or integration; making `CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` mandatory; auth/RBAC/multi-user/persistence/service/API/infra; non-Security-Master domains |
| **Required tests** | SMI-01…SMI-12; revised CHAR-A-01/02, B-01/03, C-02; unchanged controls CHAR-B-02, C-01, D-01; full guarded suite; `tsc --noEmit`; `npm run build` |
| **Acceptance evidence** | Green PR CI and post-merge `main` CI with executed-test-count check; remote verification of merged files (§10) |

---

## 3. Selected semantics (vocabulary contract C1/C3/C4/C5 deferred to implementation)

`ObjectResolverService.resolveObject` keeps seven concerns distinct. Each is exposed separately on `ResolvedSecurityObject` (`provenance` and the new `integrity` block); **none implies another**.

| # | Concern | Representation | Evidence source | Derivation | Limitation | Acceptance |
|---|---|---|---|---|---|---|
| 1 | **Identity resolution** | `companyId`; `integrity.temporal.identityResolution = 'EFFECTIVE_DATED_AS_OF'`, `identityAsOf` | `IdentityMappingStore` effective-dated mappings | Unchanged (approved invariant CHAR-C-01) | Mapping windows only; fail-closed unchanged | CHAR-C-01, SMI-06, SMI-07 |
| 2 | **Source provenance** | `integrity.sourceRevision` = `{batchId, fileChecksumSha256, recordCount, authorizationRef, operatingMode}` or `null`; lineage digest now chains the corpus checksum as `parentHash` | `evidence/operator_drop/d05_security_master_manifest.json` (transcribed into `D05_BROAD_UNIVERSE_SOURCE_REVISION`) | Set when the master is hydrated by `getGovernedBroadSecurityMaster()`; `null` for ad-hoc / reference-fixture masters | Says *which revision*, never *what origin* | SMI-02 (equality with manifest **and** SHA-256 of the deposited JSON) |
| 3 | **Record origin** | `provenance.sourceClassification = 'UNCLASSIFIED'`; `integrity.recordOrigin = {classification: 'UNKNOWN', basis: 'NO_RECORD_SPECIFIC_ORIGIN_EVIDENCE'}` | None exists: no D05 row field carries origin evidence (CHAR-A-01) | Constant **because** no evidence exists (C1/C2); never `REAL` | `UNCLASSIFIED` ≠ synthetic. A future `REAL` requires C2 evidence + a separate act | SMI-01, CHAR-A-01, P12-05, SMI-12 |
| 4 | **Descriptor completeness** | `faceValue: number \| null`, `currency: 'INR' \| 'USD' \| null`; `integrity.descriptor.{faceValue,currency} ∈ SOURCE_PROVIDED \| MISSING \| INVALID`, `complete` | The source entity's own fields | finite `> 0` number → provided; absent/null → MISSING; anything else → INVALID. `INR`/`USD` → provided; absent/null/`''` → MISSING; other → INVALID | Assessed attributes: `faceValue`, `currency` (the B2 scope). No replacement value is ever introduced | SMI-03, SMI-04, SMI-05, CHAR-B-01/02/03 |
| 5 | **Data quality** | `provenance.quality` (`GOOD` \| `PARTIAL`); `integrity.qualityAnomalyCodes` | Derived from rows 4 and 6 | `GOOD` iff descriptor complete **and** temporal status `CURRENT_SNAPSHOT`; else `PARTIAL` with codes `MISSING_MANDATORY_FIELD:<f>`, `OUT_OF_RANGE_VALUE:faceValue`, `CURRENCY_MISMATCH:currency`, `DESCRIPTOR_RECORD_NOT_EFFECTIVE_AT_AS_OF`, `DESCRIPTOR_NOT_AS_OF_SCOPED` | Completeness/currency only — not origin, not eligibility (C3). UI08 quality indicator now follows it | SMI-04, SMI-06, SMI-10 |
| 6 | **Historical correctness** | `integrity.temporal.{historicalAsOfRequested, descriptorBasis:'CURRENT_SNAPSHOT', descriptorStatus, descriptorHistoricallyVerified:false, listingsEffectiveDated:false}` | Entity `effectiveFrom`/`effectiveTo`; the corpus holds one unversioned snapshot per entity and no listing-level dates | `historicalAsOfRequested` = explicit `asOf` on a UTC day before evaluation. `descriptorStatus`: `OUTSIDE_RECORD_EFFECTIVE_WINDOW` if `asOf` ∉ record window; else `AS_OF_NOT_VERSIONED` if historical; else `CURRENT_SNAPSHOT` | Historical accuracy is **never** claimed (decision §5.1). Versioning is not implemented | SMI-06, SMI-11, CHAR-C-02 |
| 7 | **Real-market eligibility / consumer admission** | `integrity.consumerEligibility = 'NOT_ASSERTED'`; no other eligibility/admission field | — | IPD is producer-scoped (C6); consumers decide (C7) | No consumer is admitted | SMI-09 |

**UI08 surface (C5 honest disclosure).** `/security-master` now renders: *Source Classification* `UNCLASSIFIED`; *Record Origin* "Unknown — no record-specific origin evidence; not asserted as real-market or synthetic"; *Face Value / Currency* as the source value, or "Not provided by source (missing — no default substituted)" / "Invalid or unsupported in source (not displayed — no default substituted)"; *Identity As of*; *Descriptor Temporal Basis* (current snapshot / not historically verified / record not effective at asOf); *Descriptor Quality* with anomaly codes; *Governed Source Revision*; *Consumer Eligibility* "Not asserted by IPD — each consumer decides its own admission"; listings region labelled "current governed snapshot; not effective-dated"; and a non-production disclosure note. Display of records remains permitted in the bounded offline-bootstrap context (C5).

---

## 4. Stage B — Findings, causes, corrections, outcomes

### B1 — Unsupported provenance and quality classifications — **CORRECTED**

- **Verified cause.** `object_resolver.ts` (baseline lines 53/59/64) emitted `sourceClassification: 'REAL'` and `quality: 'GOOD'` as literals for every resolution, including modelled filler `IT0001` (`EQ_IT0001_IN`). A second path: `UI08SecurityMasterModalBuilder` hard-coded `getQualityIndicator('GOOD')`. Both were rendered by `SecurityMasterSurface`. The D05 row contract holds no field from which origin could be derived.
- **Change.** Classification → `UNCLASSIFIED` + `recordOrigin UNKNOWN` (no evidence ⇒ no assertion); quality derived (§3 row 5); UI08 indicator follows derived quality; provenance bound to the governed corpus revision. `SourceClassification` gained the additive member `'UNCLASSIFIED'` (documented as "not a synonym for synthetic").
- **Tests.** SMI-01 (all 2,250 records), SMI-02, SMI-09, SMI-10, SMI-12; CHAR-A-01/02 revised; P12-05 and SM-05 corrected.
- **Outcome.** No D05 record can receive `REAL`. ISIN validity, corpus position and the reported 52/2,198 split are not used.

### B2 — Missing descriptor fallbacks — **CORRECTED**

- **Verified cause.** Since `a222b5e` (PR #25) the resolver mapped `faceValue` when finite `> 0`, otherwise `1`; and `currency` as `'USD'` when `'USD'`, otherwise `'INR'` — so absent, zero, negative, NaN, non-numeric face values became `1`, and absent **or unsupported** currencies (e.g. `EUR`) became `INR`, all with `GOOD` + `REAL`. **Trace finding:** all 2,250 D05 corpus rows do carry valid `faceValue` and `currency: INR` (so corpus output is unaffected), but the 5-entity `GOVERNED_OFFLINE_REFERENCE_ENTITIES` fixture carries **neither** field — every resolution through `getGovernedOfflineSecurityMaster()` was silently showing fabricated `1`/`INR` as fact.
- **Change.** Missing/invalid → `null` with `MISSING`/`INVALID` status, anomaly code and `PARTIAL` quality; UI renders the gap explicitly. Valid sourced values are passed through byte-for-byte. No fixture data was added (no arbitrary replacement values).
- **Tests.** SMI-03 (every corpus descriptor preserved), SMI-04 (9-case matrix + USD control), SMI-05 (reference fixture), SMI-10, SMI-11; CHAR-B-01/03 revised; CHAR-B-02 control unchanged.
- **Outcome.** Fallback values can no longer masquerade as source-confirmed attributes or justify `GOOD`; `0` (INVALID) remains distinguishable from absent (MISSING).

### B3 — Historical descriptor correctness — **CORRECTED (disclosure semantics); versioning not implemented**

- **Verified cause.** `resolveObject` used `asOf` only for `resolveCompanyId`; `getEntity` is `Map.get` with no temporal dimension, and the provenance echoed the requested `asOf`, so a consumer could not tell the descriptor was present-day. Reproduction `UTIBANK@2005-01-01` remains applicable: identity → `EQ_AXISBANK_IN` (correct), descriptor/listings = present-day `AXISBANK` — and the resolved record's own `effectiveFrom` is `2015-01-01`, i.e. the record the resolver returned **declares itself not effective at the requested date**.
- **Change.** Defined and implemented the temporal semantics the data actually supports (§3 row 6). UTIBANK@2005 now reports `OUTSIDE_RECORD_EFFECTIVE_WINDOW`, `descriptorHistoricallyVerified: false`, `PARTIAL`; AXISBANK@2020 reports `AS_OF_NOT_VERSIONED`, `PARTIAL`; current queries unchanged (`CURRENT_SNAPSHOT`, `GOOD`). UI labels the basis. The present-day descriptor is still returned (it is the only data; nothing is invented) but is no longer silent.
- **Tests.** SMI-06, SMI-07, SMI-11; CHAR-C-02 revised; CHAR-C-01 unchanged.
- **Outcome.** No historical accuracy is claimed for any attribute. **Historical descriptor versioning remains a separate capability** (decision §5.1) — not authorized, not implemented.

### B4 — AIIL mapping inconsistency — **UNRESOLVED: authoritative evidence insufficient**

- **Verified state.** Manifest `aiilRuling: RULING_3_DUAL_EFFECTIVE_DATED_MAPPING`; hydration report §2.5 and `docs/FULL_IIPS_BI08_CONVERGENCE_PLAN.md` describe `543989` "current" / `539177` "historical"; corpus `EQ_AIIL_IN` has `effectiveFrom 2015-01-01`, no `effectiveTo`, and both BSE scrip rows `ACTIVE` with no listing-level dates; both resolve at every date (CHAR-D-01).
- **Evidence search.** Repository-wide search (full history fetched) for `RULING_3`, `Ruling 3`, `SteerCo`, `539177`, `543989`: the only sources are the manifest label, the hydration/convergence/audit narratives, and tests. **No SteerCo Ruling 3 record defining the semantics and no BSE listing-history evidence exists in IPD.** BSE sources are not reachable from this environment, and decision §5.2 forbids resolving by guessing and forbids AIIL data/manifest mutation.
- **Exact unresolved question.** *For ISIN `INE206F01022` (Authum Investment & Infrastructure Ltd), what does authoritative BSE listing history record for scrip codes `539177` and `543989` — the listing/effective date of each, and whether (and from what date) `539177` ceased to be valid — or are both concurrently valid?* The answer determines whether the corpus needs listing-level effective dates (governed re-deposition with new manifest/checksum) or the manifest/report wording must be re-described as a concurrent mapping.
- **What was done.** No AIIL change. Resolver now discloses `listingsEffectiveDated: false`, so neither scrip code is presented as current or historical. SMI-08 guards that data, manifest and behaviour stay unchanged until evidence arrives. CHAR-D-01 retains `[OBSERVED INCONSISTENCY — UNRESOLVED]`.
- **Observation (not changed).** Test titles in frozen suites (`e2e_broad_universe_multi_broker_integration` Phase 5 "543989 current & 539177 historical"; SM-08 "RULING_3 dual effective-dated") repeat the unsupported wording; their assertions only check concurrent resolution. They are listed in the convergence file matrix as **FREEZE** and are left untouched pending the B4 evidence.

---

## 5. Stage C — Eligibility: what can and cannot be asserted

| Can now be asserted from evidence | Basis |
|---|---|
| Which governed corpus revision a D05 resolution came from | Manifest + SHA-256 equality (SMI-02) |
| Effective-dated identity resolution for an identifier at an `asOf` | Mapping store (CHAR-C-01) |
| Whether `faceValue` / `currency` were supplied validly by the source | Entity fields (SMI-03/04) |
| Descriptor completeness/currency quality (`GOOD`/`PARTIAL`) | Derived (§3 row 5) |
| That the descriptor is the current snapshot, and whether the record is effective at `asOf` | Entity window (SMI-06) |

| Remains unverified | Why |
|---|---|
| Real-market vs. synthetic status of **any** individual D05 record | No record-specific, independently verifiable evidence (C2); 52/2,198 is a reported aggregate, not per-record truth |
| Historical correctness of any descriptor or listing | No versioned descriptor data; capability not authorized (§5.1) |
| AIIL scrip-code temporal semantics | B4 |
| Licensing / market-data entitlement | Separate from identity (C2); not assessed |
| Consumer eligibility/admission | Consumer-scoped (C6/C7); no roster, no admission |

**Unsupported eligibility claims remaining in the Security Master path: none.** The resolver and UI08 no longer assert `REAL`, no longer stamp literal `GOOD`, and declare `consumerEligibility: NOT_ASSERTED`.

---

## 6. Stage D — Validation

| Check | Baseline `77f8432` | After change |
|---|---|---|
| `npx tsc --noEmit` | 0 errors | 0 errors |
| `npm run build` (tsc + vite) | OK | OK (pre-existing >500 kB chunk warning only) |
| `npm test` (guarded) | 565 / 565, 88 suites | **577 / 577, 89 suites, 0 fail** (+12 SMI) |
| Frontend | — | UI08 surface SSR-rendered in SM-01…SM-15, CHAR-A-02, SMI-11; vite bundle built |
| Mutation check | — | New/revised guards run against the **baseline** resolver + UI08 builder: **17 of 20 fail** (all defect guards); the 3 that pass are preserved-behaviour controls (CHAR-C-01, CHAR-D-01, SMI-07) — proving the guards detect the original defects |

No test was weakened: the only removed assertions are the five defect pins (now inverted into corrected guards, per the original suite's explicit instruction) and the two `REAL`-as-"governed" assertions (replaced by stronger negative + positive assertions).

---

## 7. Stages E/F — Boundaries

- **Single-user, personal-use** product unchanged. No authentication, identity provider, RBAC, multi-user support, PostgreSQL/new persistence, service, API, route or infrastructure added. Changes are confined to an in-process resolver, its view model and one surface.
- **No IPD-to-IRR write** of any kind: no IRR commit, push, branch, PR, merge, file edit, tracker edit or indirect mechanism. IRR access was `GET` only (§1.3).
- **CV-22 Option C preserved** — not reopened, replaced, narrowed or broadened. IRR's 13-row sector-reference behaviour and `404 governed-row-not-found` are untouched. `CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` is not made mandatory.
- **No D05 expansion or mutation** — corpus SHA-256 `7f53540b…a2b74b5`, `recordCount 2250`, manifest unchanged (SMI-02/SMI-08). No roster, no eligibility classification invented, no consumer admitted.

## 8. Proposed IRR handoff (documented here only — NOT performed)

For a separate, IRR-authorized workflow, if and when it is undertaken:
1. IPD's resolved Security Master objects now carry `sourceClassification: 'UNCLASSIFIED'`, `integrity.recordOrigin.classification: 'UNKNOWN'` and `integrity.consumerEligibility: 'NOT_ASSERTED'`. This is a producer statement and **does not** satisfy CV-22 Option C prerequisite 1 (identity/eligibility contract); it confirms that no IPD field may be used as an eligibility basis.
2. Any future IRR consumption must treat `provenance.quality` as descriptor completeness only and must honour `integrity.temporal` (descriptor is a current snapshot).
3. The B4 AIIL question (§4) is an open data-evidence item relevant to any future exact-identity mapping (CV-22 prerequisite 3).

No IRR tracker or record was modified; IPD completion does not depend on any IRR change.

## 9. Remaining-work classification

| Item | Classification |
|---|---|
| A — PR #27 publication, CI, decision chain on `main` | **Completed and remotely verified** (§1) |
| B1 provenance/quality classification | **Completed** — remote verification recorded in §10 / tracker addendum A1 |
| B2 descriptor fallbacks | **Completed** — as above |
| B3 historical descriptor disclosure semantics | **Completed** — as above |
| B3′ historical descriptor *versioning* | **Unresolved because authoritative evidence is insufficient** (no versioned descriptor data) and separately unauthorized capability (decision §5.1) |
| B4 AIIL mapping | **Unresolved because authoritative evidence is insufficient** — exact question in §4 |
| Per-record real-market classification / roster | **Unresolved because authoritative evidence is insufficient** (C2) |
| IRR consumption, CV-22 prerequisites, real-only subset, identity probe | **Deferred consumer prerequisite** (CV-22 Option C, C7) |
| Same literal-`REAL`/`GOOD` pattern in non-D05 domains (`src/e2e/lineage_verifier.ts` D01 fixture lineage; `src/ui/view_models/ui07_pit_corporate_actions.ts` D04; `ui09_restatement_timeline.ts` D03) | **Observation outside this assignment's Security Master scope** — not changed; candidate for a separately scoped pass applying C1 to those domains |
| Genuine technical blockers | **None** |

## 10. Publication and remote verification

Recorded after merge in tracker addendum A1 (`evidence/np04/IIPS_v3.0_IPD_IRR_CAPABILITY_INVENTORY_AND_TRACKER_RECONCILIATION_2026-10-17.md`, §A1.4) via the standard post-merge remote-evidence reads: implementation PR number and CI, merge commit, post-merge `main` CI with executed-test count, and `git show <main>:<path>` presence of every changed file.

*End of implementation act and closure record.*
