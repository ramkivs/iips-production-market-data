# Institutional Investment Platform System (IIPS)
# P01-01 CANONICAL IDENTIFIERS — EXECUTION RECORD

**Record ID:** `p01-01-canonical-identifiers-execution-record-2026-09-27-001`
**Record Type:** EXECUTION_RECORD (executor-side evidence only — **not** an acceptance act, **not** a certification act, **not** a tracker status mutation)
**Item:** P01-01 (Work Tracker, Production Schedule)
**Work Item:** Canonical identifiers
**Governing authority act:** `evidence/target-shell-integration/P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md`
**Authority commit:** `6b7552b642b92c0b783d4c190e409c4ce116e932` (holder RAMKI; scope: P01-01 + P01-02 bounded Wave-1; acceptance authority UNRESOLVED / NOT YET DESIGNATED)
**Executed By:** Arena (Recording Agent) under the holder's explicit P01-01 execution instruction for this gate
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV (offline fixtures only; zero network, zero production credentials)
**Recorded At (local, Asia/Calcutta):** 2026-09-27

---

## 0. PRE-GATE STATE (fail-closed verification)

- Repository/branch: `ramkivs/iips-production-market-data` / `arena/01a0e30c-iips-production-market-data`.
- Environment note: sandbox re-clone recurred at gate start; documented recovery applied (remote verified authoritative, **21/21 untracked files byte-identical**, ancestor check, `--mixed` reset) — no content mutation, no history rewrite.
- Post-restore HEAD == remote == `ls-remote` == `6b7552b642b92c0b783d4c190e409c4ce116e932`; worktree clean.
- Authority artifact exists, introduced exactly at `6b7552b`; states scope-C (both Wave-1 items) and acceptance-unresolved.
- P01-01 = NOT STARTED; P01-02 = NOT STARTED (tracker re-read verbatim).
- P01-01 dependency `P00-02` (Hard) satisfied by accepted P00-02 act (`2d3c971…`); entry criterion "Baseline reconciled" supported.
- No prior P01-01 execution record or acceptance act existed (checked by absence).
- Compile baseline before any change: `tsc --noEmit` across the whole repository = **clean (exit 0)**.

## 1. P01-01 IDENTITY (tracker verbatim, re-read at execution time)

`P01-01 | P01 | Contracts | Canonical identifiers | Define instrument/company/portfolio/research/event identifiers and cross-provider mapping semantics. | Canonical ID specification | P00-02 | Hard | Baseline reconciled | IDs versioned and testable | Contract tests | ID contract + fixtures | Phase gate | NOT STARTED | High | W1 | WS-A Governance & Contracts | YES | — | Phase-gate dependency controls entry/exit; no dependency bypass.`

## 2. EXISTING CAPABILITY DISCOVERED (concept-first survey; no assumed filenames)

| What | Where | Classification |
| --- | --- | --- |
| Point-in-time effective-dated identifier→companyId resolution; fail-closed quarantine (`UNMAPPED_IDENTIFIER`, `AMBIGUOUS_COLLISION`), normalization `trim().toUpperCase()` | `src/identity/mapping_store.ts`, `quarantine.ts` | **Reusable existing capability (certified layer)** — referenced, not reimplemented |
| Composite ticker construction `NSE:<SYMBOL>` / `BSE:<SYMBOL>` / `BSE:<SCRIPCODE>`; entity registration | `src/identity/security_master.ts` | **Reusable existing capability (certified layer)** |
| Governed company-ID convention `EQ_<BASE>_IN` (reliance/infy/tcs/hdfcbank/axisbank/agi + broad-universe dataset) | `src/identity/governed_fixture_master.ts`, `d05_broad_universe_data.ts` | **Certified-baseline evidence → adopted as canonical grammar** |
| ISIN structural validation regex | `src/contracts/d05_security_master.ts` | **Certified-baseline evidence → reused identically** (structural-only limitation shared) |
| `companyId` as opaque mandatory non-empty string | `src/contracts/d05_security_master.ts` | **Existing but incomplete** (no grammar/versioning) |
| Legacy opaque companyId fixture values `INFY`, `TCS` (d05), `INFY` (d06) | `tests/fixtures/d05_fixtures.json`, `d06_fixtures.json` | **Existing but incomplete — recorded as legacy evidence; NOT repaired** |
| Legacy event-style id `NEWS-INFY-20260918-01` | `tests/fixtures/d06_fixtures.json` | **Certified-era evidence → model for canonical EVENT_ID form (no rewrite)** |
| Legacy portfolio ids `DEFAULT`, `DEFAULT_PORTFOLIO` | `tests/bi07_*.test.ts` | **Existing but incomplete — recorded; no mapping invented** |
| `researchId` / `eventId` concepts | none found (0 files) | **New P01-01 requirement** (NEW program definitions) |
| Broad-universe dataset rows (1.8MB reference data) | `src/identity/d05_broad_universe_data.ts` | **Unrelated capability** (reference data volume, not an ID specification) |

## 3. REUSE DECISIONS

- Cross-provider mapping semantics = **normative reference** to `src/identity/mapping_store.ts` (taxonomy ISIN|CIN|NSE_SYMBOL|BSE_SYMBOL|COMPOSITE_TICKER; PIT effective dating; fail-closed quarantine). No second mapping implementation was introduced (prove-test T14).
- ISIN grammar copied identically from the D05 contract; normalization seam identical to mapping-store semantics; error-code vocabulary (`MISSING_MANDATORY_FIELD`/`STRUCTURAL_MALFORMATION`) reused from `src/contracts/types.ts`.
- Reuse-anchor entities (RELIANCE, INFY) transcribed verbatim from `GOVERNED_OFFLINE_REFERENCE_ENTITIES` into the P01-01 fixture set (provenance recorded in the fixture file).
- No existing certified artifact was modified (validated: git diff on tracked files = additions only).

## 4. IMPLEMENTATION CHANGES (four NEW files; zero modifications)

| Path | Role |
| --- | --- |
| `src/contracts/canonical_id_specification.ts` | Versioned executable contract: spec id + version constant, 7 ID-kind grammars, strict validators, typed fail-closed error, deterministic descriptor with evidence basis + 7 recorded limitations |
| `tests/fixtures/p01_01_canonical_id_fixtures.json` | Deterministic offline fixtures (28 valid / 31 invalid values, 4 normalization cases, 2 reuse-anchor entities, 1 PIT mapping, 5 recorded legacy-evidence entries) |
| `tests/p01_01_canonical_identifiers.contract.test.ts` | Contract-test suite T01–T14 (node:test / node:assert, offline) |
| `docs/P01-01-CANONICAL-ID-SPECIFICATION.md` | The tracker's "Canonical ID specification" deliverable (grammars, evidence basis, versioning policy, limitations, normative mapping semantics) |

## 5. CANONICAL-ID CONTRACT REFERENCE + VERSION

- Contract module: `src/contracts/canonical_id_specification.ts`
- **Version identifier:** `P01-01-CANONICAL-ID-SPECIFICATION` / **`1.0.0`** (`CANONICAL_ID_SPECIFICATION_VERSION`, MAJOR.MINOR.PATCH; fixture-pinned and asserted by test T01).

## 6. TESTS EXECUTED (actual, on compiled artifacts)

1. Build: `npx tsc` (whole repo, emit → `dist/`) — exit 0 (baseline `tsc --noEmit` was already clean pre-change).
2. Contract suite: `node --test dist/tests/p01_01_canonical_identifiers.contract.test.js` (Node v22.22.3).
3. Determinism re-run of the same suite (identical result).
4. Bounded coexistence: `node --test dist/tests/wsa_p01_contracts.test.js` — **7/7 PASS** (certified suite untouched by the additive module and still green).

## 7. TEST RESULTS (honest run history — no green-washing)

- Run 1: **11/14 PASS** — three failures, all executor-side defects: RESEARCH_ID grammar minimum (`{1,38}` too strict for `RSRCH_A`), fixture ISIN invalid-case `INE02A010180` (structurally valid per grammar), T09 legacy evidence list incomplete for `TCS`.
- Corrections (recorded, not hidden): grammar `RSRCH_[A-Z0-9][A-Z0-9_-]{0,38}`; invalid ISIN replaced with `IN_002A01018`; legacy-evidence fixture entries completed (`TCS` added; module/doc limitation text updated to list `INFY`, `TCS`).
- Run 2: **12/14 PASS** — two further executor-side defects: `EVT_A_…` base below grammar minimum (2), and `BSE:50032` (5-digit) contradicting the 6-digit scrip bound.
- Corrections: fixture event value → `EVT_AB_20260101_99`; composite-ticker grammar tightened to `[0-9]{6}` (observed governed scrip codes are 6-digit; conservative bound recorded in module, spec doc).
- Run 3 (final): **14/14 PASS**; determinism re-run: **14/14 PASS** (identical); `tsc` exit 0; certified coexistence 7/7.

## 8. EXACT EVIDENCE LOCATIONS

- Specification deliverable: `docs/P01-01-CANONICAL-ID-SPECIFICATION.md`
- Executable contract (version of record): `src/contracts/canonical_id_specification.ts`
- Fixtures: `tests/fixtures/p01_01_canonical_id_fixtures.json`
- Tests: `tests/p01_01_canonical_identifiers.contract.test.ts`
- Normative reuse sources (unmodified): `src/identity/mapping_store.ts`, `src/identity/security_master.ts`, `src/identity/quarantine.ts`, `src/contracts/d05_security_master.ts`, `src/contracts/types.ts`, `src/identity/governed_fixture_master.ts`

## 9. EXIT-CONDITION ASSESSMENT — "IDs versioned and testable"

- **Versioned:** single version constant of record, MAJOR.MINOR.PATCH, fixture-pinned (`specificationVersion` assert, T01), descriptor exposes version deterministically (T02).
- **Testable:** 14 offline deterministic contract tests prove strict validation of all 7 kinds (T03–T05), normalization seam (T06), fail-closed parse (T07), determinism (T08), certified-layer retention & legacy boundary (T09), cross-provider/PIT/quarantine/ambiguity reuse semantics (T10–T13), and non-duplication of mapping implementations (T14).
- Executor-side assessment: **"IDs versioned and testable" — supported (YES) as execution evidence.** This is NOT an exit acceptance (phase gate + acceptance authority reserved; §13).

## 10. UNRESOLVED LIMITATIONS

1. The module's own **7 recorded limitations** stand verbatim (legacy opaque forms INFY/TCS/DEFAULT…; NEWS- legacy event form; real-world symbol characters excluded fail-closed; ISIN structural-only; PF/RSRCH/EVT grammars are NEW without baseline precedent; COMPANY_ID range deliberately bounded).
2. **U1 (INT-001 interface mapping)** from the P00-02 reconciliation remains **UNRESOLVED — carried**, per its own routing (P00/P01 discovery); this gate executed P01-01 only and did not adjudicate U1.
3. Real-world (production) identifier coverage beyond the offline governed corpus is **out of scope by design** (NON_PRODUCTION mode).
4. Cross-provider mapping semantics are asserted as **retained** (T10–T14); no new provider taxonomy was defined (none was authorized under P01-01).

## 11–13. EXPLICIT STATEMENTS

- **P01-01 ACCEPTANCE NOT PERFORMED** (acceptance authority UNRESOLVED / NOT YET DESIGNATED; no tracker status change made; exit satisfaction formally only via a later designated acceptance act).
- **P01-01 CERTIFICATION NOT PERFORMED** (tests are execution evidence, not certification; no certification act exists or is implied).
- **P01-02 NOT EXECUTED** (authorized by the Wave-1 act but explicitly excluded from this gate).

## 14. DOWNSTREAM BOUNDARY

Nothing beyond P01-01 was executed or authorized: no P01-02/P01-03/P01-04/P01-05 start; no P02–P07 work; no INT-011; no Watchlists/SG-4/SG-5 changes; no persistence/D115/Dhan/NSE/OIDC/production changes; no modification of certified corpus, baseline matrix, P00-02 artifacts, or tracker. The P01-03 entry criterion ("ID contract drafted") is visible but its satisfaction is **not** determined here — it follows only from a later P01-01 acceptance and its own governed determination.

## 15. SINGLE-PASS ATTESTATION

One governed item (P01-01), one execution pass (with fully recorded failure→fix rounds inside the same test session), five additive files total (4 implementation + this record), zero modifications, zero deletions, one checkpoint to follow.
