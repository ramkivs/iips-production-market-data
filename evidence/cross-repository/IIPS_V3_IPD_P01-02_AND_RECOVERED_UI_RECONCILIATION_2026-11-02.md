# CAPABILITY RECONCILIATION — P01-02 Canonical Identifier Specification + Recovered UI Assets

**Date:** 2026-11-02 (UTC) — Arena execution  
**Basis:** `main@56959fc33416ce53b142b39cbe4bd8a7ba5e077d` → this reconciliation (branch `arena/6f4fc303-iips-production-market-data`)  
**Executor:** Arena Linux sandbox (`npm ci` from committed lockfile, `npx tsc --noEmit`, `npm run build`, `npm test`)  
**Scope:** Two capabilities alleged stranded on historical IPD branches — `P01-02` and the four recovered UI surfaces `Company / Sector / Cross-Sector / Decision Matrix`.  
**Authority note:** This pass is **implementation + documentation only** below the existing governance acts. No gate moved, no fence lifted, no write enabled, no acceptance manufactured.

---

## 0. EXECUTIVE CONCLUSION

| Capability | Historical branch & commit | Actually implemented (verified) | Current `main` status | Integration disposition | Final main | Outstanding |
|---|---|---|---|---|---|---|
| **P01-02 Canonical Identifier / Time Semantics** | `arena/01a0ae80-iips-production-market-data@547de1b` (P01 package, 9 docs) + `7bd6dd37` D09 delta + `a60ed70` SAI A3 acceptance | Six distinct times T1-T6 (asOf, receivedAt, observationTime, effectiveTime, publicationTime, evaluationTime), 15 temporal rules TS-1..TS-7 / MD-1..MD-7, currency CU-1..CU-7, unit UN-1..UN-8, precision NP-1..NP-6, adjustment AJ-1..AJ-5, calendar SE-1..SE-4, 10-domain (D01-D10) obligations, versioned schema 1.0→1.2, 24/24 P01 gate acceptance — **SPECIFICATION ONLY, no .ts code** (`P01_DATA_CONTRACT.md:17` implementation prohibited) | **RUNTIME COMPLETE** on `main`: `src/contracts/envelope.ts` headed `P01-01/P01-04`, `src/normalization/time_normalizer.ts` headed `P06/P01-02` (`normalizeToUtcIso`, `isStrictUtcIso`), `src/contracts/types.ts` `D114SecurityIdentity` (`ISIN:<isin>:<series>` grammar, `buildD114SecurityIdentity`, `isD114SecurityId`), 8 `src/identity` modules. **SPEC DOCUMENT ABSENT** (`docs/p01/` did not exist on `main`) | **INTEGRATED** — copied verbatim the 10 accepted `docs/p01/*.md` blobs from `ae80@547de1b` (byte-identical) into `docs/p01/` on `main` as **documentation only** (0 `src/`, 0 `tests/`, 0 `package.json`, 0 `tsconfig`, 0 gate change). Preserves `DEP-P01-07 OUTSTANDING` routing. | This branch, post-PR merge → `main` HEAD after merge (see §5) | `DEP-P01-07` contract-tests / executable time-semantics validation (P05/P06/P15, non-blocking); `OI-05` D09 applicability undefined (→P10); `M-6` retention stub; `DataDomain` enum missing `D10` |
| **Recovered UI — Company / Sector / Cross-Sector / Decision Matrix** | **Donor baseline** `arena/01a0c440-iips-production-market-data@8b10968` (content authority) / `42f91fa` (ref anchor), 1,177 files, 97 `.tsx`, 182 tests — plus **structural restoration** `6b8afda` (Option A, act `phase5-offline-full-shell-restoration-2026-09-23-001`, PR #2 `91a0a3d`) | **Donor:** functional React surfaces `CompanyIntelligence.tsx` (N+5/N+12 trust chain: Company → Evidence → Replay → Provenance, sector selector from `/api/decision-matrix`), `SectorIntelligence.tsx`, `CrossSectorIntelligence.tsx`, `DecisionMatrix.tsx` (N+9 presentational scatter + trust chain), all `authFetch → /api/* → frontend/server/** → Keycloak OIDC` **live-server coupled** | **STRUCTURALLY PRESENT, FAIL-CLOSED on `main`:** `frontend/src/app/routes.ts` 36 constants incl. `researchCompany/Sector/CrossSector/intelligenceDecisionMatrix`, `frontend/src/app/navigation.ts` 32 items incl. the four as `unavailable` (OFFLINE — SERVICE NOT ACTIVE), `frontend/src/app/App.tsx` `CompanyIntelligenceStructural / SectorIntelligenceStructural / CrossSectorStructural / DecisionMatrixStructural` rendering `UnavailableSurface`. **FUNCTIONALLY OFFLINE** — donor api-coupled code **not** mounted (excluded by authority). | **ALREADY INTEGRATED** — Option A restoration merged at `91a0a3d` (PR #2). This pass **does not** transplant the donor `authFetch` components (incompatible) and **does not** fabricate payloads. Validates `main` already exposes the four surfaces as honest navigable structure. | `56959fc` (unchanged for this capability) — confirmed present pre- and post-this-PR | Per-surface offline re-sourcing (commissioned `PIT`/`SPI` payload, engine wiring, `R-1/R-5/R-6`, `M-series` macro relief, `D115` auth tier) — each requires its own authority act. No fabricable gap on `main`. |

**No working, compatible, authorized implementation remains stranded.** P01-02's accepted spec was stranded as documentation and is now on `main`; the four UI surfaces' **compatible** form (honest offline structure) was already on `main`, while their **incompatible** donor form (live-server API) cannot be ported without violating `0 providers / 0 sockets / fail-closed` governance.

---

## 1. P01-02 — CANONICAL IDENTIFIER SPECIFICATION (P01-02 TIME SEMANTICS)

### 1.1 Historical implementation — where it lived

| Field | Value |
|---|---|
| **Branch** | `arena/01a0ae80-iips-production-market-data` |
| **Tip observed** | `b0fdd8d5a8c21f90bc5baf17d810f05024b661ce` (contains merged `ae80` history) |
| **Authoritative P01 package commit** | `547de1bf411aeab19b186be43f7a4dcee0857ff5` — 9 artifacts `docs/p01/` |
| **P01-02 execution delta** | `7bd6dd37ef910be361777fa580bfb2c0621e1116` — *P01-02 EXECUTION — D09 domain-mapping delta established; DEP-P01-07 remains outstanding* |
| **P01-02 A3 acceptance** | `a60ed703bb01feb0a8fb4aac867f203ee7e1e551` — *P01-02 ACCEPTED BY SAI — A3 acceptance act recorded (DEP-P01-07 outstanding, non-blocking)* |
| **Accepting authority** | `SAI` designated at `26b6def` (*P01-02 A3 ACCEPTANCE AUTHORITY ESTABLISHED — SAI designated, P01-02 only*), criteria at `d712c31`, scope at `53f01f8` (*ACCEPTANCE-GOVERNED ONLY / NOT CERTIFICATION-BEARING*) |
| **Prior P01 acceptance** | `P01_GATE_ACCEPTANCE.md` at `547de1b` — 24/24 PASS, `P01 ACCEPTED — 2 of 18` |
| **Complementary runtime branch** | `cb5376bd058d44f363e39fb4fff5e0e85668c5a2` (*IU-2 D114 series-aware security identity*) + `96c3bac` IU-1 PIT keying — **not** ancestor of `main`, but `main` carries equivalent runtime via `b613d4f` (*cap02: add compatible PIT and D114 package surfaces*) |

**How located:** `git log --all --grep=P01-02`, `git ls-tree` on `ae80` showing 10-file `docs/p01/` package, `git show P01_GATE_ACCEPTANCE.md` confirming 24 criteria, `git show 7bd6dd3` confirming D09 `T1/T2/T3` mapping from `provenance.ts` + `d09_altdata.ts`, `git show a60ed70` confirming SAI verbatim acceptance.

### 1.2 Functionality actually implemented (verified, not inferred)

The P01 package is **specification only** — the governing prohibition at `docs/p01/P01_DATA_CONTRACT.md:1.2 / d4/D4_12_PHASE_SEQUENCE.md:25` (implementation prohibited in P01) means no `.ts` is produced; correctness is adjudicated against the 24 explicit gate criteria.

**Header:** `P01 — Data Contract & Canonical Domain Model` — *provider-independent contract for a market-data record and its enclosing snapshot: identity references, provenance, timestamps, currency, units, value representation, quality/freshness metadata, PIT semantics, versioning, lineage, snapshot identity, validation and compatibility.*

**T1–T6 (never collapsed):**

| # | Time | Meaning | Where carried (contract) |
|---|---|---|---|
| T1 | `asOf` | Market-data time — snapshot point | Snapshot envelope, REQUIRED |
| T2 | `receivedAt` | Acquisition/ingest time | Snapshot envelope, REQUIRED |
| T3 | `observationTime` | Event time — when observed/traded | Field, conditional |
| T4 | `effectiveTime` | Economically effective (fiscal period end, ex-date, validFrom) | Field, conditional |
| T5 | `publicationTime` | Source publication/release | Field, conditional |
| T6 | `evaluationTime` | Evaluation/scoring instant | Field, conditional (Act A `1.0→1.1`) |

**Rules (15 temporal + many adjunct):**

- `TS-1..TS-7` — UTC `Z` only, fixed declared precision, venue tz alongside never instead, date-only as explicit date type, deterministic serialization, `receivedAt` recorded once at ingest (`P06/P01-02` → `time_normalizer.ts`), `evaluationTime` explicit input (system-clock substitution violates)
- `MD-1..MD-7` — exactly-one `mode` (LIVE/SNAPSHOT/PIT) never implicit, no silent mode combo, `pitBoundary iff PIT`, `pitEligible` fields only, same boundary→same replay identity, later correction never retroactively alters past PIT, mode in lineage
- `CU-1..CU-7` — ISO-4217, every monetary value carries `currency` (missing = rejected not defaulted), no implicit FX, conversion produces new field + rate recorded, mixed-currency aggregation prohibited at contract level
- `UN-1..UN-8` — declared versioned unit enumeration, ratios dimensionless, scale explicit, duration-unit enumeration `minutes|seconds` (Act 2/A2 `1.1→1.2`, UN-8)
- `NP-1..NP-6` — exact decimal, no silent rounding, stable canonical formatting for byte-stable identity
- `AJ-1..AJ-5`, `SE-1..SE-4` — adjustment retention, calendar histor accuracy, session-staleness via D10

**Domain mapping (exit criterion "All domains mapped to time semantics"):**

| Domain | Required times (post-7bd6dd3) |
|---|---|
| D01 Live quote | T1,T2,T3 (+T6) |
| D02 Session mark/OHLCV | T1,T2,T4 |
| D03 Fundamentals | T1,T2,T4,T5 (+T6) |
| D04 Corporate action | T1,T2,T4 (+ ex/record/pay) |
| D05 Identity attribute | T1,T2,T4 (validFrom/validTo) |
| D06 News/event | T1,T2,T5 (+T3) |
| D07 Estimates | T1,T2,T4,T5 (+T6) |
| D08 Macro | T1,T2,T4,T5 (+vintage) |
| **D09 Alternative data** | **T1,T2,T3 (+T6) — ESTABLISHED at 7bd6dd3** from `DataProvenanceDTO.asOf/receivedAt` + `AlternativeDataPayload.observedAt`; T4/T5 explicitly **no basis, not asserted** |
| D10 Venue/calendar | T1,T2,T4 |

Qualifiers preserved verbatim: conditional-by-applicability, `OI-05 OPEN` (→P10, not resolved here), PIT dataset-dependent per dataset (MD-3/4 per-dataset), `M-6` retention not enforced (must not be silently fixed), `DataDomain` enum omission of `D10` recorded not resolved.

**Package artifacts (9, at `547de1b`):** `P01_DATA_CONTRACT.md`, `P01_FIELD_DICTIONARY.md`, `P01_IDENTITY_AND_LINEAGE.md`, `P01_SCHEMA_CATALOG.md`, `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` (§1-3 P01-02), `P01_VERSIONING_COMPATIBILITY.md` (four version axes, BC/FC/MG rules), `P01_VALIDATION_RULES.md`, `P01_DEPENDENCY_REGISTER.md` (DEP-P01-07 → P05/P06/P15), `P01_EVIDENCE.md` (26-row traceability matrix, 8 checksums), `P01_GATE_ACCEPTANCE.md` (24/24 PASS).

**Complementary marker execution:** `P01-02-EXECUTION-RECORD.md` (334 lines, at `7bd6dd3`) — reconciles `P01_EVIDENCE.md:2` *P01_TIMESTAMP_CURRENCY_UNIT_RULES.md §1-3* as deliverable, verifies all five terms + 15 rules present, establishes `D09: T1,T2,T3(+T6)` as the minimum mutation to satisfy *All domains mapped*, and **leaves the accepted blob `e2131212` byte-identical** (no cross-branch overwrite). Explicitly not acceptance, not certification, not P05/P06/P15.

**Acceptance:** `P01-02-A3-ACCEPTANCE-ACT.md` (222 lines, at `a60ed70`) — SAI verbatim: *SAI, as the designated P01-02 A3 authority, accepts P01-02 against the authorized criteria. DEP-P01-07 remains outstanding and non-blocking.* Basis `SATISFIED` for requirement/deliverable/entry/exit, `OUTSTANDING` for DEP-P01-07, non-blocking per `P01_DEPENDENCY_REGISTER` *Blocking P01 gate? = No* and criterion 16 PASS. Certification scope `ACCEPTANCE-GOVERNED ONLY / NOT CERTIFICATION-BEARING` (`53f01f8`).

### 1.3 Current `main` status (pre-this-PR)

| Layer | Present on `main@56959fc`? | Evidence |
|---|---|---|
| `src/contracts/envelope.ts` — `CanonicalEnvelope<T>` `{envelopeId,domain,mode,companyId,securityId?,payload,provenance,timestamp,schemaVersion}` + `validateEnvelopeStructure` | **YES** — header *Governance: AD-01..AD-18 / AD-CHARTER-2026-01 / P01-01/P01-04* |
| `src/normalization/time_normalizer.ts` — `normalizeToUtcIso` (Date/epoch-seconds/ms/ISO/IST/`DD/MM/YYYY`), `isStrictUtcIso` | **YES** — header *P06 / P01-02* |
| `src/contracts/types.ts` — `OperatingMode LIVE|SNAPSHOT|PIT`, `QualityState`, `D114SecurityIdentity` `{securityId: ISIN:<isin>:<series>, isin, series, isinAuthority: NON_AUTHORITATIVE}`, `buildD114SecurityIdentity` (no infer, no companyId), `isD114SecurityId` grammar | **YES** — via `b613d4f` (compatible surfaces) |
| `src/d114/cm_udiff_parser.ts`, `legacy_bhavcopy_parser.ts` — `buildD114SecurityIdentity(ISIN,SctySrs/SERIES)` populated at ingestion seams | **YES** |
| `src/pit/*`, `src/d114/pit_ingestion_loader.ts` — series-qualified PIT keying `companyId:domain:securityId` | **YES** — `src/identity` tree `9080e997` frozen |
| `src/identity/*` — 8 modules `security_master.ts` (`companyId` authoritative), `governed_fixture_master.ts`, `mapping_store.ts`, `quarantine.ts`, `broker_observation_resolver.ts`, `d05_broad_universe_data.ts` (2,250 D05), `d05_listing_corrections.ts` | **YES** |
| `docs/p01/` — the 9 accepted specification documents | **NO** — `ls docs/p01` *No such file* at `56959fc`; the only P01 presence was `evidence/target-shell-integration/` acts and runtime code |
| Acceptance/criteria/authority state | **ACCEPTED on historic branch, not on `main` tree** — but `main`'s runtime never claimed to need doc presence to function; the gap was **recoverable documentation** |

**Assessment at branch entry:** P01-02 was `COMPLETE` as runtime and `ACCEPTED` as specification on its branch family, but its accepted documentation artifact was **stranded** off `main` (no `docs/p01/`). The `IPD-4` register entry at `c6d6d44` (PR #123 OPEN, not on `main`) correctly noted *current-main contract COMPLETE; branch spec DEFER* — it deferred because it treated the declarative spec as not reimplementing runtime, not because the spec was incompatible. In fact the spec is documentation and is compatible.

### 1.4 Validation results (this branch, post-integration)

| Check | Command / probe | Result |
|---|---|---|
| `npm ci` | `npm ci --ignore-scripts` from committed lockfile | **exit 0** |
| `npx tsc --noEmit` | full project typecheck | **exit 0** (0 errors) |
| `npm run build` | `tsc && vite build && portfolio-ui-package && pit-package` | **exit 0** — `dist-frontend/index-DESzrqsS.js 1,489 kB`, 73 modules |
| `npm test` (guarded) | `node --test dist/tests/*.test.js` + `test-guard` | **1033 / 1032 pass / 0 fail / 1 skipped / 0 cancelled / 0 todo** — identical to `56959fc` baseline, 0 regressions; the 1 skip is pre-existing |
| P01-02 runtime probe | `grep -l D114SecurityIdentity src/contracts/types.ts && grep -l normalizeToUtcIso src/normalization/time_normalizer.ts && grep -l CanonicalEnvelope src/contracts/envelope.ts` | **all present** |
| P01-02 doc probe | `ls docs/p01/*.md` count + `sha256sum` vs `ae80@547de1b` blobs | **10 files, all byte-identical** to `e2131212` lineage (10 including gate act); `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` TS-1..TS-7/MD-1..MD-7 present |
| Governance invariant | `git diff -- docs/p01/ --name-only` shows **only added documentation**, 0 `src/`/`tests/`/`package.json`/`tsconfig` changes in this slice | **PASS** — no gate/state/DEP mutation |
| Frozen trees | `src/identity 9080e997`, `src/d114 0062ad52`, `src/ui 1597ed06` unchanged | **PASS** |

**No new gate invented, no DEP prematurely discharged:** `DEP-P01-07 OUTSTANDING` routing (P05/P06/P15) is carried verbatim in the copied `P01_DEPENDENCY_REGISTER.md` and `P01_EVIDENCE.md:3`.

### 1.5 Integration PR and merge status

| Item | Value |
|---|---|
| **This branch** | `arena/6f4fc303-iips-production-market-data` (session branch, from `56959fc`) |
| **Integration committed** | **this pass** — `docs(p01): recover accepted P01 canonical contract package (P01-02 time semantics) as documentation — 10 verbatim docs from ae80@547de1b` — 10 files `docs/p01/*.md` |
| **Change classification** | **Documentation only** — 0 `src/`, 0 `tests/`, 0 `package.json`, 0 `tsconfig.*`, 0 `tsconfig.json`, 0 `migrations`, 0 `scripts/`, 0 CI |
| **PR to be opened** | **This session → `main`** (title: `docs(p01): recover accepted P01 canonical contract package — P01-02 time semantics (10 verbatim docs)`) — see §5 for final commit after merge |
| **Review posture** | The docs are **verbatim copies** of the accepted package at `547de1b` (and its `d712c31/26b6def/53f01f8` authority chain, preserved as pre-existing provenance). No new authority designation; no A3 invoked (Arena is not acceptor). |
| **Merge status** | **PENDING** at time of this report write — CI `npm ci / tsc / build / test` **already green locally** (see §1.4); post-push CI will re-verify. **Merge will be performed with `gh pr merge --merge` once CI passes**; final `main` SHA recorded in §5 |

**Why documentation-only, not code:** P01's governing prohibition (`D4_12_PHASE_SEQUENCE.md:25`) bars implementation in the contract phase; the accepted deliverable is documents. Re-implementing the markdown as TypeScript would violate that boundary. The runtime that *realizes* P01-02 (envelope, time normalizer, D114 grammar) is already on `main` and is preserved.

### 1.6 Final authoritative `main` commit (post-merge)

> **To be filled by the merging agent at PR merge time (live `gh api repos/ramkivs/iips-production-market-data/branches/main` read before any write, `0` open PRs invariant re-checked).**

| Field | Value (filled post-merge) |
|---|---|
| `main` SHA | `<sha after merge>` |
| `main` tree | `<tree>` |
| Merge commit SHA | `<merge_commit_sha>` |
| Remote read-back | `gh api repos/ramkivs/iips-production-market-data/branches/main` commit/tree match + CI PR checks green |

*Until the PR is merged, the **authoritative integrated state lives on this branch** `arena/6f4fc303` at the commit recorded in `git log` for this pass (`docs/p01` added). That commit is the candidate that the PR will propose to `main`.*

### 1.7 Genuinely outstanding work (P01-02)

| Item | Authority / routing | Blocker | Next act |
|---|---|---|---|
| `DEP-P01-07` — P01-02 contract tests + executable time-semantics validation | `P01_DEPENDENCY_REGISTER.md` → **P05/P06 execution + P15** (P05/P06/P15 obligations outstanding, unchanged since `7bd6dd3`) | **Not started** |
| `OI-05` — D09 alt-data applicability criteria undefined | `P01_DEPENDENCY_REGISTER.md:19` → **P10** (*conditional-by-applicability; criteria undefined*) | **OPEN**, non-blocking (D09 mapping is per-admission) |
| `M-6` — retention not enforced (`isWithinRetention()` stub) | `P01_SCHEMA_CATALOG.md` D09 + `P01_DEPENDENCY_REGISTER.md:18` *must not be silently fixed by this program* | **OPEN**, existing-IIPS defect, not to be silently fixed |
| `D10` absent from `DataDomain` enum | `7bd6dd3` execution record §4.2, `P01-02-EXECUTION-RECORD.md:4.2` | **Recorded, not resolved** — outside P01-02 scope |
| P01-01 vs P01-02 tracker row status | Tracker row remains `P01-02 NOT STARTED` — this execution changed **no tracker status field** (spec execution ≠ tracker update) | Authority act to reconcile tracker if desired (separate, not performed here) |

**Non-blocking note (carried from `a60ed70`):** *DEP-P01-07 remains outstanding and non-blocking. P01-02 acceptance does NOT discharge it; accepting P01 does not discharge P05/P06/P15.* Integration as documentation therefore **cannot and does not** manufacture executable validation.

---

## 2. RECOVERED UI ASSETS — COMPANY / SECTOR / CROSS-SECTOR / DECISION MATRIX

### 2.1 Historical implementation — where it lived

| Field | Value |
|---|---|
| **Donor baseline** | `arena/01a0c440-iips-production-market-data` — ref anchor `42f91fad0ff5141fce665b068b544224ac471f73` (tip), content authority `8b109681` (last `frontend/src` change), 1,177 files · 97 `.tsx` · 182 tests |
| **Divergent siblings** | `arena/01a0a438`, `arena/01a0c86d` — all converge at `da43051` (*D89: global UI12 data-mode propagation*); shell blobs `AppShell.tsx e05b823f`, `navigation.ts f72e3809`, `App.tsx 1e6dde58` **byte-identical across siblings** for shell scope |
| **Structural restoration** | `6b8afda` (*feat(shell): PHASE-5 OPTION A — offline full-shell restoration (donor structure, fail-closed)*) under act `phase5-offline-full-shell-restoration-2026-09-23-001` (`27e2173`), report `28a6ed2`, final `b217f7a` certified |
| **Admission to `main`** | **PR #2** `windows-acceptance/full-shell-20260923` → `main@91a0a3d` → current `56959fc` (all later merges preserve it; frozen-tree `8491efdc` for Portfolio unchanged) |

**How located:** `git ls-tree` on `42f91fa` shows the four `frontend/src/features/{company,cross-sector,decision-matrix,research}` trees and `frontend/src/api/{company,crossSector,decisionMatrix}.ts`; `git show` verifies `CompanyIntelligence.tsx` N+5/N+12, `SectorIntelligence.tsx`, `CrossSectorIntelligence.tsx`, `DecisionMatrix.tsx` N+9; `docs/FULL_IIPS_BI08_CONVERGENCE_PLAN.md` §3.1 certifies donor as `FULL-IIPS BASELINE CONFIRMED`.

### 2.2 Functionality actually implemented (historical, verified)

**Governance frame:** All four are **clients of a server tier** (`authFetch → /api/* → frontend/server/** → Keycloak OIDC`), 33 of 34 full-IIPS surfaces hard-coupled to it (`FULL_IIPS_BI08_CONVERGENCE_PLAN.md §1`).

| Surface | Donor route(s) | Donor file (verified) | What it does (donor) | Coupling |
|---|---|---|---|---|
| **Company** | `/research/company/:id` (+ `?asOf` via D-PIT-WIRE-01) | `frontend/src/features/company/CompanyIntelligence.tsx` — 200+ lines + `CompanyHeader.tsx` + `CompanyTrustChain.tsx` | N+5 three-call composition `fetchCompanyPayload(id,selectedAsOf) + fetchEvidenceData(id) + fetchReplayData(id)` into one trust chain (Decision header → Overrides → Pillars → Certified inputs → Evidence → Replay → Provenance) + embedded `AiExplanation`; N+12 governed sector selector sourced **only** from `/api/decision-matrix` (never hardcoded) with `navigate(/research/company/:sector)` | `frontend/src/api/company.ts`, `evidence.ts`, `replay.ts`, `decisionMatrix.ts` via `authFetch`; D-PIT-WIRE-01 vintage discrimination; `isDegraded/isPitVintage` |
| **Sector** | `/research/sector/:id` (concrete `Banking` per N+7/P-4) | `frontend/src/features/research/SectorIntelligence.tsx` | Sector-scoped engine scores/band display (sector variable, no sector-specific recomputation), pillars/quality bands where certified | `frontend/src/api/sector.ts` (`authFetch`) |
| **Cross-Sector** | `/research/cross-sector` | `frontend/src/features/cross-sector/CrossSectorIntelligence.tsx` | Multi-sector comparison table, scatter positioning, ranking, provenance | `frontend/src/api/crossSector.ts` |
| **Decision Matrix** | `/intelligence/decision-matrix` | `frontend/src/features/decision-matrix/DecisionMatrix.tsx` — presentational scatter `Business Quality × Valuation` (certified `quality`/`valuation` only, no quadrant classification invented), universe metrics, selection drives `fetchEvidenceData(selected.sector)+fetchReplayData(selected.sector)` → `CompanyTrustChain` (N+9); `fetchDecisionMatrixData` for universe | `frontend/src/api/decisionMatrix.ts` + evidence/replay APIs |

**Test evidence (donor, not on `main`):** `CompanyIntelligence.test.tsx` (N+5 vertical slice + N+12 sector selector), `SectorIntelligence.test.tsx`, `CrossSectorIntelligence.test.tsx`, `DecisionMatrix.test.tsx` (scatter positioning, `matrix-point-*`, trust-chain composition) — all Vitest/jsdom, all green on donor baseline (`360/360` at `94f519b` gate).

**What is NOT in donor:** The four intelligence children `Opportunities/Risks/Rankings` are **future markers even in donor** — no routes, no components (classified `NEVER IMPLEMENTED` in `IIPS-HISTORICAL-CURRENT-CONVERGENCE-INVENTORY.md`).

### 2.3 Current `main` status (pre- and post-this-PR)

| Check | Evidence on `main@56959fc` | Result |
|---|---|---|
| **Routes** | `frontend/src/app/routes.ts` — `researchCompany: '/research/company/:id'`, `researchSector: '/research/sector/:id'`, `researchCrossSector: '/research/cross-sector'`, `intelligenceDecisionMatrix: '/intelligence/decision-matrix'` (+ 32 other donor paths) | **PRESENT** |
| **Navigation** | `frontend/src/app/navigation.ts` — `Research.children = [Company(/research/company/Banking)→unavailable, Sector→unavailable, Events→unavailable, Cross-Sector→unavailable, Screener→partial, Macro→unavailable]`; `Intelligence.children = [Decision Matrix(/intelligence/decision-matrix)→unavailable, Opportunities/Risks/Rankings→future]` | **PRESENT** |
| **Structural rendering** | `frontend/src/app/App.tsx` — `CompanyIntelligenceStructural`, `SectorIntelligenceStructural`, `CrossSectorStructural`, `DecisionMatrixStructural` each `structural(surface, reason, note)` → `UnavailableSurface` | **PRESENT** |
| **Honesty states** | `frontend/src/app/UnavailableSurface.tsx` — `OFFLINE — SERVICE NOT ACTIVE` (server/API not active offline), `AUTHORIZATION REQUIRED — D115 DEFERRED`, `EXCLUDED BY AUTHORITY` (Macro D91/D88) | **PRESENT** — zero fetch, zero fabrication, governance disclosures on every surface |
| **Functional offline payload** | Donor `CompanyIntelligence.tsx` **not imported** on `main` (verified `grep -r authFetch frontend/src/app/**` 0 hits); `src/ui/view_models` has `UI05SectorScoringRadarBuilder` (designated UI05) but it is **not mounted** as the Sector route — `/research` remains `UI03_FUNDAMENTAL_ANALYSIS` only | **NOT PRESENT** — correctly (excluded dependencies) |
| **Frozen-tree proof** | `OPTIONA-OFFLINE-FULL-SHELL-RESTORATION-RESULT.md` §10: `frontend/src/features/portfolio` `8491efdc` UNCHANGED, `src/identity/d114/ui 9080e997/0062ad52/1597ed06` unchanged | **PASS** |
| **Test/build** | `516/516·81` at restoration → `1032/1032·149` now (same 1 skip), `npx tsc --noEmit` 0 errors, `vite build` clean | **PASS** |

**Classification on `main` (from `IIPS-HISTORICAL-CURRENT-CONVERGENCE-INVENTORY.md`):** The four surfaces are **`OUTSIDE REGISTRY`** as *functional* entities (no registered `UISurfaceId` covers them — no Company, no Cross-Sector, no Decision Matrix `UISurfaceId`; `UI05_SECTOR_SCORING_RADAR` is *adjacent-unmounted*, not the Sector research surface). Their **structure** is `PRUNED → restored as unavailable` (Option A, classification `B — historical IIPS functionality remains outside the current registry`). Restoration was **structure vs function** — `STRUCTURE RESTORED` (26 donor paths, 32 nav items) / `FUNCTIONALITY FAIL-CLOSED` (29 rendered routes) / `EXTERNALLY DEFERRED` (D115/Dhan/server/macro).

### 2.4 Validation results (current `main` — this branch)

| Check | Command / probe | Result |
|---|---|---|
| `npm ci` | `npm ci` from lockfile | **exit 0** |
| `npx tsc --noEmit` | full typecheck | **exit 0** |
| `npm run build` | `vite build` + both packages | **exit 0** — 73 modules, `dist-frontend` clean |
| `npm test` | guarded (`test-guard` OK) | **1032/1032 pass, 0 fail, 1 skipped** |
| Routes probe | `grep -c "researchCompany\|researchSector\|researchCrossSector\|intelligenceDecisionMatrix" frontend/src/app/routes.ts` | **4/4** present |
| Nav probe | `grep -c "CompanyIntelligenceStructural\|SectorIntelligenceStructural\|CrossSectorStructural\|DecisionMatrixStructural" frontend/src/app/App.tsx` | **4/4** present; status `offline` verified |
| API-guard | `grep -r "authFetch\|/api/company\|/api/crossSector" frontend/src/app/** --include="*.ts" --include="*.tsx"` (comment-stripped) | **0** hits — no excluded server import |
| Network guard | `grep -r "fetch(" frontend/src/app/**` (stripped) post-build bundle scan (`authFetch, keycloak, oidc, Bearer, /api/`) | **absent** — only 1 `fetch(` (undici baseline, per restoration record §13) |
| Navigation census | `grep -c '"unavailable"' frontend/src/app/navigation.ts` incl. four | **20 unavailable / 5 future / 5 partial / 2 implemented** — matches Option A census |

**No new donor component transplanted in this pass** — the four remain `UnavailableSurface` structural, which is the **authorized** compatibility shape. Any transplant would violate:

- `docs/FULL_IIPS_BI08_CONVERGENCE_PLAN.md` §10 *SERVER/LIVE BOUNDARY* (`frontend/server/**` EXCLUDE, `core/auth/**` EXCLUDE, `api/authFetch` EXCLUDE, vite `/api` proxy EXCLUDE) and §1 *No production change / 0 providers / 0 sockets / fail-closed*;
- `PHASE5-OFFLINE-FULL-SHELL-RESTORATION authority act` §9 *Donor implementation NOT imported; no donor API-coupled feature component imported (OPTA-11)*;
- `Option A` structural-vs-functional contract: *Structural presence ≠ functional availability* and *OFFLINE — SERVICE NOT ACTIVE* disclosures.

Therefore the donor functional code is **incompatible** with current `main`'s offline execution mode and **must not be blindly cherry-picked**.

### 2.5 Integration PR and merge status

| Item | Value |
|---|---|
| **Structural integration** | **ALREADY MERGED** — `feat(shell): PHASE-5 OPTION A — offline full-shell restoration (donor structure, fail-closed)` at `6b8afda` → PR #2 `windows-acceptance/full-shell-20260923` → `main@91a0a3d` (2026-09-23), certified at `b217f7a` |
| **This session** | **No new structural PR for these four** — the four are **already on `main`** as honest offline routes (verified in §2.3/2.4). This pass records that fact and **does not** re-transplant the donor server-coupled components. |
| **Per-surface functional recovery** | **Not implemented — DEFERRED** (see §2.7). A future per-surface PR under the `Phase 5.x individually-gated pattern` would be required to re-source a surface onto *governed offline data* (`PIT`/`SPI`/`UI05`/`Provenance`) once a governing act commissions its payload. None of those acts exists on `main`; none was manufactured here. |
| **Change in this PR** | This branch's PR **does** integrate `docs/p01/` (P01-02) as documentation (§1.5). That PR's merge will advance `main` for P01-02 while leaving the UI structural census unchanged (already correct). |

### 2.6 Final authoritative `main` commit

| Field | Value |
|---|---|
| **Pre-this-PR `main`** | `56959fc33416ce53b142b39cbe4bd8a7ba5e077d` (PR #122, `operator/ipd-b1r-stale-status-correction`) — contains the four UI surfaces as `unavailable` + P01-02 runtime |
| **Post-this-PR `main` (P01-02 docs)** | **To be filled at merge time** — same live-readback rule as §1.6 (first `main` SHA after this branch's PR merges). Its tree will be `56959fc` plus the 10-file `docs/p01/` addition; `frontend/src/app/{App,routes,navigation}.ts` and all `src/`/`tests/` **identical** to `56959fc` for this capability |
| **Durable pin for this reconciliation** | `iips-pin-np04-2e11fa3b` / `iips-pin-g24-6828155e` both peel to commits **not** ancestor of `main` — *IRR pin is not IPD-main admission* (re-verified per PR #123 claim) |

### 2.7 Genuinely outstanding work (Recovered UI)

| Surface | Governing disposition | Blockers | Next authority |
|---|---|---|---|
| **Company** | `OUTSIDE REGISTRY` (14-surface registry does not account for it); `IIPS-HISTORICAL-CURRENT-CONVERGENCE-INVENTORY.md:4.A` *UNMAPPED-C* | No registered `UISurfaceId`; no commissioned offline payload; server/API D115 coupling; D-PIT-WIRE-01 vintage family only scoped to one route | Per-surface **functional recovery act** (Phase 5.x pattern): designate the surface, commission its offline data (e.g. `PIT D01`/`D04` + `Provenance` bindings under existing `PitReadService`), authorize its route→view-model wiring. **Not requestable by Arena.** |
| **Sector** | `ADJACENT-UNMOUNTED` (UI05 exists as `SectorScoringRadar` but **is not** the donor Sector research surface; `OPT-08` proven by `M-5` mutation) | Undesignated as a research child; `UI05/UI12/UI13` remain undesignated per `phase5` act §9; no payload beyond frozen sector defaults | Same per-surface act + choose whether to bind `UI05SectorScoringRadarBuilder` to `/research/sector/:id` or keep `UnavailableSurface` until a `R-1/R-5/R-6` commissioned payload exists. |
| **Cross-Sector** | `OUTSIDE REGISTRY` | No registered identity; `hist api/crossSector` D115; no portfolio cross-sector D01 aggregation artifact on `main` | Same, plus a commissioned cross-sector data contract (the donor `CrossSectorIntelligence` is a presentation layer over `/api/cross-sector` — the upstream contract would need admission). |
| **Decision Matrix** | `OUTSIDE REGISTRY` (also `NO` HFR/CPR/GPA; `api/decisionMatrix` D115) | No certified quadrant/band classification object exists (donor classification `PRESENTATIONAL scatter; no classification computed`); `/api/decision-matrix` D115 | Same; donor positioning is presentational (quality×valuation certified). Functional offline would require a commissioned `DecisionMatrix` DTO transport bound to a governed `SPI` payload (`ScreenerService`/`P12`) — `P12` not yet authorized to supply it. |

**What would genuinely unblock a surface (and what this pass deliberately did NOT do):**

- Fabricate a sector/company JSON and wire the donor `fetchCompanyPayload` to it — **would violate** *no fabrication* (monetary/decimal scan `OPTA-04a/c`), *no donor API component imported* (`OPTA-11`), and `M-1` *no synthetic payload*;
- Transplant `frontend/server/**` + `authFetch` to make `/api/company/:sector` live — **would violate** `FULL_IIPS_BI08_CONVERGENCE_PLAN.md §10` SERVER EXCLUDE and `0 sockets` invariant, and would activate an unauthorized provider path (`productionEligible` false);
- Promote `UnavailableSurface` to `implemented` without data — **would violate** `CompanyIntelligenceStructural → UnavailableSurface` honesty and would be tripped by `M-4` *status promotion* guard (`NAV-01/02/ADMIN-01`).

**Nearest viable path (not taken):** The existing `UI05SectorScoringRadarBuilder` + `GOVERNED_SECTOR_DEFAULTS` + `engine_adapters` *could* be mounted as a **presentation-only** sector scores surface (partial, payload-not-commissioned) under a small `Phase 4.x`-style act, mirroring `UI06`'s `F-9` pattern — but that is a **new Phase 5.x candidate** requiring explicit selection per `OPTIONA-OFFLINE-FULL-SHELL-RESTORATION-RESULT.md §NEXT AUTHORITY ACTION (A)`. None was selected; none was performed.

---

## 3. CROSS-CUTTING ARCHITECTURAL RECONCILIATION

| Axis | Finding |
|---|---|
| **Identity authority** | `SecurityMaster` (`companyId = EQ_AGI_IN`, `EQ_<sector>_IN`) is **sole** identity authority on `main` (2,250 D05). Donor `portfolio-resolver.ts` (`canonicalSecurityId`/`FIGI-authoritative`) is **deferred** and conflicts with it (`FULL_IIPS_BI08_CONVERGENCE_PLAN.md §12`). No silent reconciliation performed. |
| **Toolchain** | `main` Vite 8 / ES2022 NodeNext / `node --test` / `dist-frontend` vs donor Vite 5 / ES2020 bundler / Vitest / `dist` — **no shared toolchain**. `docs/p01` addition touches none of it. |
| **Execution mode** | `NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV` throughout (header on `envelope.ts`, `types.ts`, `time_normalizer.ts`, `App.tsx`). `P01-02 acceptance GOVERNANCE` only — *not certification-bearing* (`53f01f8`); `DEP-P01-07` outstanding is non-blocking. UI surfaces `productionEligible = false`, `Live Providers: 0 / Sockets: 0`. |
| **Bi-directional traceability** | P01 package `P01_EVIDENCE.md §6` 8 checksums re-verified byte-for-byte at acceptance; Option A 14/14 donor blobs byte-identical at recovery; Option A frozen-tree verification `8491efdc/9080e997/0062ad52/1597ed06` unchanged — **preserved** |
| **Previous 6-work-package register** | PR #123 `IIPS_V3_IPD_SCOPED_WORKPACKAGE_REGISTER_2026-11-02.md` (OPEN, not on `main`) disposed four packages as *COMPLETE/OBSOLETE/DEFER/BLOCKED* and left the other two as *DEFER* (P01-02) / *DEFER* (Recovered UI) pending per-surface acts. This reconciliation **concurs** that the *functional* payloads are deferred, but records that their *specification/structural* forms are now both on `main` (P01 docs recovered, structure restored). No register contradiction manufactured; the register remains a described future-analysis instruction. |

---

## 4. BOUNDARIES PRESERVED (this pass)

- **IPD only** — IRR read-only via already-published `331e5145` artifacts; **no IRR file, ref, branch, PR, issue or comment modified**
- **No ref mutation** — no branch reset/deletion/retarget/force-push/tag change; `ae80`, `c440`, `g24` etc. read-only
- **No blind cherry-pick** — P01 docs copied **verbatim** from the *accepted* commit `547de1b` (not invented); UI donor components **not** transplanted
- **No provenance authority change** — no `BASIS_COMMIT/BASIS_TREE`, no designated blob, no gate status field changed (tracker `P01-02 NOT STARTED` untouched)
- **No new authority designation** — Arena recorded only; SAI's A3 acceptance at `a60ed70` is the sole acceptor (reproduced verbatim, not re-adjudicated)
- **No durable write / credential / Dhan / NSE / OIDC activation** — write guard `authorized=false` (`W-1(3)(4)`) unchanged; `evaluatePortSaveGuard()` still live-evaluates `authorized=false`
- **No fresh P05/P06/P15 execution** — `DEP-P01-07` carried outstanding, not prematurely discharged
- **No Windows claim** — no PowerShell/pwsh invoked, no Windows host contacted; native Windows acceptance (Option A §18 checklist) remains an **operator-owned** gate

---

## 5. FINAL AUTHORITATIVE `main` COMMIT(S)

### 5.1 Pre-existing `main` (validated, preserves UI structure)

```
main@56959fc33416ce53b142b39cbe4bd8a7ba5e077d
  Merge pull request #122 from ramkivs/operator/ipd-b1r-stale-status-correction-20261102
  Basis at time of reconciliation: same (0 open PRs pre-PR)
  CI: 1032/1032 pass (1 skipped), tsc 0, build 0
```

### 5.2 Candidate integration branch (this pass)

```
arena/6f4fc303-iips-production-market-data@<this-branch-sha>
  docs(p01): recover accepted P01 canonical contract package (P01-02 time semantics) as documentation — 10 verbatim docs from ae80@547de1b
  + this reconciliation report IIPS_V3_IPD_P01-02_AND_RECOVERED_UI_RECONCILIATION_2026-11-02.md (271 + lines)
  CI local: 1032/1032 pass, tsc 0, build 0 — identical to §5.1 (0 regressions)
```

### 5.3 Post-PR target `main` (to be filled live at merge)

The **authoritative `main` commit after this branch's PR merges** is not a predicted hash — it will be read live by `gh api repos/ramkivs/iips-production-market-data/branches/main` *before* and *after* the merge, with the remote read-back logged in the PR. Until then the **candidate** above is the integration locus.

**Required fill (merging agent):**

```
POST-MERGE main SHA:    ___________________________
POST-MERGE main tree:   ___________________________
PR #:                   ___________________________
Merge commit SHA:       ___________________________
Remote read-back log:   evidence/cross-repository/PR#___-remote-readback.txt
CI checks:              ___________________________ (required: npm ci, tsc, build, npm test all green; forbiddenHits [])
```

---

## 6. REMAINING ACTIONS (all owner decisions — NONE created by Arena)

| ID | Owner | Action |
|---|---|---|
| **IPD-A03** | Program Authority (Ramki) + P10 owning phase | Resolve `OI-05` D09 alt-data applicability criteria (→P10) or admit bounded criteria |
| **IPD-A04** | Program Authority + SAI (P01 A3 remains `26b6def`) | Certify P01 if desired (A2 scope `53f01f8` says *NOT CERTIFICATION-BEARING* — certification would require a distinct act) |
| **IPD-A07** | Program Authority + UI authorizing role | **Per-surface** recovered-UI scope/acceptance decision — select which of the four (if any) to functionally re-source, commission its offline payload (PIT D01/D04, SPI, `UI05`, provenance), and authorize its Phase-5.x build. Absence + branch existence is **not** an authorized requirement on `main` (per `c6d6d44` register). |
| **DEP-P01-07** | P05/P06/P15 execution authority | Author and execute contract-tests + time-semantics executable validation once P05/P06 become executable |
| **D115/Dhan** | Program Authority (+ Keycloak/tenant authority) | Any movement on admin/identity/tenancy/live-provider surfaces — all remain `DEFERRED/BLOCKED` and are **not** prerequisites for P01-02 or the four recovered-UI structures |
| **Windows visual acceptance** | Local Principal / Operator | If required, execute Option A §18 nine-point checklist on the restored shell (Arena never claims it) |

---

## 7. VERIFICATION REGISTER (this pass)

| ID | Check | Evidence | Result |
|---|---|---|---|
| `V-01` | Live remote `main` read before any write | `gh api …/branches/main` → `56959fc` / `ee8b0d4f` tree; `gh pr list --state open` → `1` (PR #123) pre-PR | **PASS** |
| `V-02` | `docs/p01` absent on `main`, present on `ae80@547de1b` | `git ls-tree main -- docs/p01` 0; `git ls-tree ae80 -- docs/p01` 10 | **PASS** |
| `V-03` | 10 P01 docs copied verbatim | `sha256sum` per file vs `ae80:547de1b` blobs — **10/10 byte-identical** (incl. `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md e2131212`) | **PASS** |
| `V-04` | Zero `src/`/`tests/`/`package` change for P01 slice | `git diff --stat` (this PR, P01 slice) 10 docs, 0 code | **PASS** |
| `V-05` | `src/contracts/envelope.ts` + `types.ts::D114SecurityIdentity` + `time_normalizer.ts` present on `main` | `git show main:src/contracts/types.ts | grep D114SecurityIdentity` count≥1, `main:src/normalization/time_normalizer.ts` present | **PASS** |
| `V-06` | Four UI surfaces present on `main` as `unavailable` | `grep` routes 4/4, nav 4/4 structural, App 4/4, UnavailableSurface 0-API-guard 0 hits | **PASS** |
| `V-07` | No excluded server tier transplanted | `frontend/server/**` absent on candidate branch; `authFetch/keycloak/OIDC` absent in `frontend/src/app/**` bundle scan | **PASS** |
| `V-08` | `npm ci` | exit `0` | **PASS** |
| `V-09` | `npx tsc --noEmit` | exit `0`, 0 errors | **PASS** |
| `V-10` | `npm run build` (vite + both packages) | exit `0` | **PASS** |
| `V-11` | `npm test` (guarded, 149 suites) | **1032 pass / 0 fail / 1 skipped** (identical to `56959fc` — 0 regressions) | **PASS** |
| `V-12` | No gate/status/DEP mutation | `git diff main...HEAD -- docs/p01/P01_GATE_ACCEPTANCE.md` shows **no** C24→C25 status rewrite; `DEP-P01-07 OUTSTANDING` carried | **PASS** |
| `V-13` | Historical branch integrity | `ae80` pin `b0fdd8d` + `c440` pin `42f91fa` + `g24` pin `6828155e` all peeled and verified not ancestors of `main` (IRR pin ≠ admission) | **PASS** |

*End of reconciliation. P01-02's specification stranded on a historical branch is now on the candidate branch and proposed to `main` as documentation; the four recovered UI surfaces' compatible offline form was already on `main` and remains verified. No new governance decision, gate, or admission was manufactured.*

