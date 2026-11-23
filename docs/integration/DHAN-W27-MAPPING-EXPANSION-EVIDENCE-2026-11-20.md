# DHAN-W27 — Repeatable Mapping Expansion Pipeline

**Task:** W-27. **Status:** implemented, verified, published for review (not merged).
**Date:** 2026-11-20. **Branch:** `arena/0a6b6000-iips-production-market-data`.

---

## 1. What was built

`DHAN-P7` qualified one retained snapshot once. W-27 makes that a
**operator-rerunnable pipeline** that grows mapping coverage and states, for every
input row, what happened to it and why.

| Requirement | Implementation |
|---|---|
| Ingest repository-held snapshots | `scripts/dhan-w27-expand.mjs` reads `evidence/dhan-p7/source/*.csv` only |
| Reconcile against P04 `SecurityMaster` | exact ISIN join, unchanged from P7 |
| Same governed exact-identity path as P7 | the pipeline **calls** `qualifyInstrumentMaster`; it never re-implements the rule |
| Deterministic manifest with SHA-256 provenance | no clock, no randomness, no I/O in the module; every input carries its SHA-256 |
| A disposition for every input row | `records` + `outOfScopeSummary`, reconciled to `counts.inputRows` |
| Reconciled counts | `counts`, `countsByDisposition`, `countsByReasonCode`, `reconciliation.reconciles` |
| Why each unmapped row was not mapped | closed `reasonCode` vocabulary plus a prose explanation and a per-row `reason` |
| Operator rerun & inspection | `npm run dhan:w27-expand`, `npm run dhan:w27-expand -- --check` |

**Identity rule (unchanged):** `companyId + exchangeSegment + ISIN + series`.
Every company is reached by exact ISIN through `SecurityMaster.resolveCompanyId`.
Symbol, company name and display name are never read as identity evidence — a
test renames every symbol in the fixture and asserts no disposition changes.

**Proposed ≠ qualified.** The disposition vocabulary contains no `QUALIFIED`
value. New rows are `PROPOSED_ADDITION`; `proposedMappings` is the review list a
W-14 promotion would act on. The pipeline never writes
`evidence/dhan-p7/qualification-manifest.json`.

### The additional proposal gate

P7 can qualify several series for one company. A proposal must be *stronger*,
because adding a row changes what the platform serves. A row is proposed only if:

1. the `(companyId, exchangeSegment)` pair is currently unmapped, and
2. the snapshot offers exactly **one** series for that `(companyId, segment, ISIN)`.

Otherwise it is rejected, never guessed:

- `REJECTED_WRONG_SERIES` — the same company+segment is already served by another
  series of the same ISIN (a same-company / wrong-series near-match).
- `REJECTED_AMBIGUOUS_IDENTITY` — several competing series with no authoritative
  series evidence. Row order and preference are irrelevant (asserted).

---

## 2. Files changed

| File | Change |
|---|---|
| `src/providers/dhan/dhan_mapping_expansion.ts` | **new** — pure, deterministic proposal generator (no I/O, no network, no clock) |
| `src/providers/dhan/index.ts` | exports the new module |
| `scripts/dhan-w27-expand.mjs` | **new** — operator runner; verifies SHA-256, writes artifacts, `--check` mode |
| `package.json` | `dhan:w27-expand` script |
| `tests/dhan_p7_instrument_master.test.ts` | +11 W-27 cases (fixtures in the real schemas, plus the published snapshot) |
| `evidence/dhan-w27/expansion-manifest.json` | **new** — the deterministic manifest |
| `evidence/dhan-w27/expansion-report.md` | **new** — operator report |
| `docs/integration/DHAN-W27-MAPPING-EXPANSION-EVIDENCE-2026-11-20.md` | **new** — this record |

Untouched by design: `dhan_instrument_master_qualification.ts`,
`dhan_instrument_master_parser.ts`, `dhan_local_daemon.ts`,
`evidence/dhan-p7/qualification-manifest.json`, `qualification authority`,
credentials, runtime config, local databases.

---

## 3. Inputs and provenance

Both are repository-held. **No network access, no Dhan call, no download path
exists in the code.**

| Role | File | Rows | SHA-256 | Retrieval |
|---|---|---|---|---|
| `PRIMARY_QUALIFICATION_SOURCE` | `api-scrip-master-detailed.csv` | 217,104 | `6f19feb4abd513843eaf2f139a27f17ccb660233f95ad385d11aa92c322a010d` | 2026-11-06T05:27:53Z |
| `RECONCILIATION_ONLY_NO_ISIN` | `api-scrip-master.csv` | 217,104 | `4366e41b115b00b7a84225d3506a3dbb6ef483cb3ba4d32ad5f23d72e9edcddd` | 2026-11-06T05:29:23Z |

Both hashes are computed from the exact bytes parsed and are checked against
`evidence/dhan-p7/source-retrieval-manifest.json`; a mismatch aborts the run and
the module refuses to build a manifest without a 64-hex SHA-256 per input.
The compact master carries no ISIN and is never a mapping source.

**P04 master:** `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`,
checksum `b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4`,
2,390 records.

---

## 4. Results of this run

| Disposition | Rows |
|---|---|
| `ALREADY_QUALIFIED` | 4,680 |
| `PROPOSED_ADDITION` | **0** |
| `REJECTED_NOT_EQUITY` | 193,340 |
| `REJECTED_INVALID_FIELD` | 24 |
| `REJECTED_NO_P04_CORRESPONDENCE` | 19,060 |
| `REJECTED_AMBIGUOUS_IDENTITY` | 0 |
| `REJECTED_DUPLICATE_IDENTITY` | 0 |
| `REJECTED_CONFLICTING_PROVIDER_ID` | 0 |
| `REJECTED_WRONG_SERIES` | 0 |
| **Total** | **217,104 = inputs** |

Reconciliation holds: `dispositionTotal = inputRows = 217,104`, and
`inScopeRows (23,764) + outOfScopeRows (193,340) = 217,104`.

### Why zero proposals — stated plainly

This is a **true finding, not a shortfall in the pipeline**.

- The P04 master has 2,390 companies with 4,680 ACTIVE listings (NSE 2,390,
  BSE 2,290). The existing P7 registry already holds **4,680** mappings —
  **100.00 %** of P04's active listings.
- Regenerating P7 against the same snapshot reproduces the published registry
  exactly: **0 novel, 0 lost**.
- The vendor master offers **18,697** distinct cash-equity ISINs. Only 2,390 of
  them exist in P04. **16,307 have no P04 company at all**
  (`NO_P04_COMPANY_FOR_ISIN`, 18,960 rows).

The binding constraint is therefore **P04 universe coverage**, not the mapping
rule and not the Dhan master. Assigning a `companyId` to those 16,307 ISINs would
require inventing identity, which is forbidden. Closing that gap is universe
expansion (**W-28**), which must arrive with its own authoritative ISIN evidence.

The 24 `REJECTED_INVALID_FIELD` rows are genuine vendor placeholders — ISIN
`0`, `NA`, and `DUMMYSAN001`–`DUMMYSAN022` — not real listings lost to validation.

### Correction to the task's stated baseline

The brief cites "48 companies / 96 rows". That figure is the *older* 2026-11-13
W04 assessment of a 96-row manifest. The current published registry is
**2,390 companies / 4,680 rows**, confirmed by reading the manifest and by
regenerating it. The pipeline is agnostic to the starting size: it reports
whatever the real baseline is.

---

## 5. Verification performed

Only targeted suites were run.

| Check | Result |
|---|---|
| Byte-identical manifest on rerun | `npm run dhan:w27-expand -- --check` → "committed artifacts are byte-identical to a fresh run" (exit 0). Manifest SHA-256 `3c228b3c…b7285` both runs; also asserted in-test by re-building twice |
| Every output row carries input provenance | `inputs[]` records file, URL, retrieval instant, SHA-256, byte size, row count, schema status, role; each record carries its `inputRow` line number |
| SHA-256 correctness | recomputed from the parsed bytes and compared with the retrieval manifest (asserted in the test suite and enforced by the runner) |
| Disposition counts reconcile with input counts | `reconciliation.reconciles === true`; asserted in tests and enforced by the runner (non-zero exit on failure) |
| Same-company / wrong-series near-match rejected | `REJECTED_WRONG_SERIES` / `SAME_ISIN_OTHER_SERIES_ALREADY_SERVED`; the served series is untouched |
| Ambiguous / conflicting / incomplete identities fail safely | competing series → `REJECTED_AMBIGUOUS_IDENTITY`; duplicate and conflicting provider id → distinct dispositions; malformed ISIN/series/security id → `REJECTED_INVALID_FIELD`; no P04 company or no active listing → `REJECTED_NO_P04_CORRESPONDENCE` |
| Proposed cannot become qualified via this pipeline | no `QUALIFIED` in the vocabulary; asserted that no record carries it, and that every proposal is absent from the qualified registry |
| Daemon still loads qualified-only and ignores proposed | loader fed a manifest containing one `QUALIFIED` and one `PROPOSED_ADDITION` row loads **1** mapping; the proposed identity resolves `UNRESOLVED`. Published manifest loads 4,680 mappings, all `DHAN_INSTRUMENT_MASTER` |

**Tests executed**

- `node --test dist/tests/dhan_p7_instrument_master.test.js` → **21 tests, 21 pass, 0 fail, 0 skipped** (10 pre-existing P7 cases + 11 new W-27 cases). Includes the W-27-AS1 anti-skip guard, because `node --test` exits 0 when every case skips.
- `node --test dist/tests/dhan_p7_transport_auth_parsing.test.js dist/tests/dhan_p6_exact_identity.test.js dist/tests/dhan_d3b_instrument_mapping.test.js` → **41 tests, 39 pass, 0 fail, 2 skipped** (adjacent P6/P7/mapping suites; no regression).
- `npx tsc` → clean.

---

## 6. Guarantees held

- **No live Dhan request.** No credentials, no vendor call. The new module has no
  network import; the runner contains no fetch path; both inputs are repository-held.
- **No runtime download mechanism.** A missing input produces the exact missing
  path and a non-zero exit — never a substitute.
- **No promotion.** No `PROPOSED_ADDITION` row was promoted, and
  `evidence/dhan-p7/qualification-manifest.json` was not written or modified.
- **Qualification authority unchanged.** P7's identity rules and dispositions are
  untouched; W-27 consumes them.
- **No unrelated workstream touched.** No credentials, runtime config, local
  databases or IRR-owned files were read or changed.

---

## 7. Remaining work and blockers

1. **W-28 (universe expansion)** is the real lever. The pipeline is ready to
   surface gains the moment P04 carries the ISINs: it will report them as
   `PROPOSED_ADDITION` with no code change. Subject to W-28's own access and scope.
2. **W-14 (promotion)** is required before any proposal becomes loadable; this
   pipeline deliberately stops at proposed.
3. **Snapshot freshness.** The retained snapshot is dated 2026-11-06. Refreshing
   it is an operator action under the existing retrieval evidence process, not a
   pipeline feature; W-27 adds no download path by design.

---

*Static instrument-master evidence only. No live quote qualification and no
production-readiness claim.*
