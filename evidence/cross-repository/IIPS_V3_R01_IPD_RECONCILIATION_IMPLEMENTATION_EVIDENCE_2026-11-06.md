# IIPS V3 — R01 IPD reconciliation implementation evidence — 2026-11-06

**Date:** 2026-11-06 (Asia/Calcutta)  **Executed on:** Linux sandbox, Node v22.22.3  **Repository:** `ramkivs/iips-production-market-data`  **Branch:** `arena/05376739-iips-production-market-data`  **Base (main at authoring):** `f9dac560b821476c417b963c83c80ad0e7747dc7`  **Investigation predecessor:** `adeb051dea27225f9ce031b8a6c6f44cf9076d2e`

**Disposition this document evidences:** the residual implementation deviation published in `evidence/cross-repository/IIPS_V3_R01_IPD_RECONCILIATION_INVESTIGATION_2026-11-06.md` (R01 — IPD owner) is closed inside the D05 file envelope. **No broader authority is claimed.**

## 1. Authority and scope

Implementation was executed under the PA authorization to land the R01 correction only, under the D05-named file envelope. The following were confirmed necessary *during* implementation and were confined to that envelope:

- `src/persistence/portfolio_store.ts` — gain `export function computeRevisionContentDigest(...)` (the §6-mandated recompute of `portfolio_revisions.content_digest` now has a single shared implementation); the narrowed settlement-probe doc (quiescence-only, necessary-never-sufficient, not held through the reads); and the **reconciliation-only** internal reads `revisionReconciliationEvidence(...)` (stored `content_digest` preserved, SQL NULL preserved, **fail-closed** through the same `stored*`/`refuseStoredValue` helpers as the §6 history projection — a malformed row refuses instead of coercing) and `holdingsForRevision(...)` (canonical `holding_key` order via `holdingFromRow`). Both are internal, are not §6 paths, and perform zero writes.
- `src/persistence/brokerImportPersistence.ts` — `reconcileSnapshotV2ByRead` rewritten onto intended-evidence fingerprints; the internal writer surface extended by exactly those two reads; the read-only helpers `deriveV2IntendedEvidence`, `readEvidenceFingerprint`, `holdingInputsEqual`, `holdingsSnapshotsEqual`, `verdictOfFingerprint`, `fingerprintOf`.
- `tests/durable_holdings_recovery_v1.test.ts` — named tests `R01-T1` … `R01-T12` (twelve) inside a nested block; V2-R06 mocks updated onto the two internal reads; call sites rebound to the intended resolver.
- `evidence/cross-repository/IIPS_V3_D02_D03_D05_PR129_DEVIATION_CORRECTIONS_2026-11-06.md` — append-only `§7` correction annotation (the P8 artifact).
- This document.

No change beyond the envelope was required; none was made silently.

## 2. What was implemented (P1–P8)

| # | Investigation prescription | Implementation |
|---|---|---|
| P1 | Successor evidence is mandatory: without the expected-successor contribution, revision and stored snapshot, no `COMMITTED` may be reached | `reconcileSnapshotV2ByRead` derives `intended = deriveV2IntendedEvidence(request, resolver)` first. If the intended evidence cannot be derived (shape, request validation, lineage, identity gate or provenance failure), the outcome is `UNRESOLVED` — no other verdict is reachable. The expected successor is always `request.expectedRevision + 1`. |
| P2 | Stored `portfolio_revisions.content_digest` must be re-verified, not merely present | `verdictOfFingerprint` requires `revision.contentDigest` to match `RECON_HEX_64` and to equal `intended.contentDigest = sha256(canonical JSON of intended holdings + intended provenance)` (the same digest the commit path stores). SQL NULL stored digests therefore never yield `COMMITTED` (R01-T12). `committedAt` must be a UTC ISO-8601 instant; `holdingsCount` a safe integer `≥ 1` equal to the intended holdings length; `totalMarketValue` finite, `≥ 0`, equal to both `contribution.amount` and the intended total. |
| P3 | Lineage/provenance cross-binding between contribution and successor revision | `contribution.lineageDigest` must equal `intended.provenanceDigest = computeBrokerImportProvenance(...)` (recomputed from the request through the commit path’s own binding) and `revision.provenanceDigest` must equal both. `revision.provenanceDigest !== contribution.lineageDigest` → `UNRESOLVED`. Provenance binds `request.broker`, `request.sourceEvidence.fileName/importedAt` and the observed holdings with per-row `rowLineageDigestOf`. |
| P4 | Holdings exact equality (row-exact) | `holdingsSnapshotsEqual` sorts both sides by `symbol` and requires `holdingInputsEqual` per row on every field, including `identityStatus` and `resolutionDisposition`. Stored holdings are read via the canonical `holding_key` ordering. |
| P5 | Two read passes compared as serialized evidence snapshots, never as verdict strings | `readEvidenceFingerprint` reads contribution (matched by `contributionId == request.contentDigest`), `revisionReconciliationEvidence` and `holdingsForRevision` for the expected successor. `fingerprintOf` serializes contributions, revision evidence and holdings to a fixed-key JSON string; pass 1 and pass 2 must be byte-equal, else `UNRESOLVED`. |
| P6 | Settlement probe is necessary, never sufficient; doc narrowed | Probe success is required but never upgrades any evidence gap. The probe doc now states quiescence-only semantics, that it is not held through the reads, and that it is necessary-never-sufficient for `COMMITTED`. |
| P7 | Conservative floor preserved; zero-write reconciliation preserved | `NOT_COMMITTED` only when settlement is proven **and** both passes show every leg absent (`verdictOfFingerprint === 'absent'`). Every other divergence/weak/NULL/failure case → `UNRESOLVED`. Reconciliation performs **zero writes** in all paths (R01-T9 asserts `domainCounts` unchanged; R01-T10 asserts a subsequent re-import of the same content is `ALREADY_IMPORTED_NO_OP`, i.e. no resend/resubmit). |
| P8 | #130 evidence doc gains a correction annotation; history preserved | Append-only `§7` added to `IIPS_V3_D02_D03_D05_PR129_DEVIATION_CORRECTIONS_2026-11-06.md` (historical text verbatim). |

Deliberate non-gaps (confirmed, not silently “fixed”): the ledger stores `sourceEvidence.sourceBroker` while provenance binds `request.broker` — the comparison is performed on stored values as-is; a provenance derived from real commit evidence matches by construction (R01-T2 exercises the foreign-lineage negative). v1 `reconcileBrokerImportByRead` remains out of scope with its separate PA finding retained. `portfolio_revisions.content_digest` is nullable by design and is handled as NULL-preserved evidence (T11/T12), not masked.

## 3. Named regression tests (`tests/durable_holdings_recovery_v1.test.ts`)

All twelve pass (`ok`) when run from compiled output (`node --test dist/tests/durable_holdings_recovery_v1.test.js`):

| Test | Asserts | Result |
|---|---|---|
| R01-T1 | same `COMMITTED`-looking verdict with different row evidence across passes → `UNRESOLVED` | ok |
| R01-T2 | well-formed but foreign contribution lineage vs successor provenance → `UNRESOLVED` | ok |
| R01-T3 | well-formed but foreign stored revision `content_digest` → `UNRESOLVED` | ok |
| R01-T4 | one perturbed holdings row → `UNRESOLVED`; untouched twin → `COMMITTED` | ok |
| R01-T5 | ledger match with the successor revision absent → `UNRESOLVED` (never `COMMITTED`) | ok |
| R01-T6 | evidence visible only under a foreign owner never yields `COMMITTED` | ok |
| R01-T7 | successor at the expected number but evidence belongs to a different import → `UNRESOLVED` | ok |
| R01-T8 | settlement probe failure → `UNRESOLVED` even when all reads would succeed | ok |
| R01-T9 | `COMMITTED` reconciliation performs zero writes (`domainCounts` unchanged) | ok |
| R01-T10 | after a `COMMITTED` reconciliation, the same re-import commits nothing (`ALREADY_IMPORTED_NO_OP`) | ok |
| R01-T11 | legacy/NULL evidence in the contribution leg never yields `COMMITTED` | ok |
| R01-T12 | 001-003-style rows missing stored snapshot evidence (NULL `content_digest`) → `UNRESOLVED`, never `COMMITTED` | ok |

Fixtures are verified-by-construction: intended evidence and cloned rows are always derived from `deriveV2IntendedEvidence(snapshotRequest(...))`/`resolvedResolver`, never from raw literal digests.

## 4. Verification executed for this correction (2026-11-06)

| Step | Result |
|---|---|
| `npm ci --no-audit --no-fund` (tree was absent) | 33 packages, exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run build` (tsc + vite + PIT packages) | exit 0 |
| `npm test` (guarded; stale-dist guard active) | **1068 executed — 1067 passed — 0 failed — 1 skipped**; `[test-guard] OK`; exit 0 |
| `node --test dist/tests/durable_holdings_recovery_v1.test.js` | 18/18 pass (V2-R01…R06 + R01-T1…T12) |
| `npm run test:package-consumer` | PASS (`result: "PASS"`; browser bundle `forbiddenHits: []`; strict typecheck PASS) |

The one `# SKIP` is the pre-existing platform-conditional "Windows endpoint is a named pipe" test, skipped on Linux; unrelated to this correction. The executed-test count rose from 1056 to 1068 exactly by the twelve new named tests.

One integration defect was caught and fixed during verification: a first draft of `revisionReconciliationEvidence` coerced absent stored columns with `?? ''`, which tripped the structural fence in `q1_ipc_read_contract_conformance` ("no `?? ''` empty-string default remains in the store"). It was rewritten to refuse non-conforming stored rows via the shared fail-closed helpers (§2 P2); the fence passes unchanged.

## 5. Invariants preserved (verified by the suite, not asserted)

- D03/D05 effective semantics; the four-revision cap; IRR v1 wire behaviour byte-compatible; no reconciliation writes or retries anywhere; W-1 remains hard-false; no schema/migration/wire/lock/fsync changes; no operational database access, provisioning or writes; v1 reconciliation untouched; no QE, Gate 3/4/5 or W-1 activation claim; H01–H12 remain **NOT QUALIFIED**; synthetic PASS ≠ qualification; reconstructed ≠ original.

## 6. Explicitly NOT done / NOT authorized

No contract or wire-schema change; no new IPC operation or route; no evidence-digest persistence; no IRR change; no operational scope expansion; no operational database execution; no `REPLACE`/`RESET`/`DELETE` change; no ordering change to the settlement probe; no Gate 4 acceptance, Gate 5 admission, QE completion or W-1 activation. v1 reconciliation keeps its separate PA finding.

## 7. Publication

This document is committed to `arena/05376739-iips-production-market-data` against base `f9dac560b821476c417b963c83c80ad0e7747dc7`. The branch carries the R01 implementation and this evidence; the changes are submitted as one pull request against `main`. Head CI, the merge commit, the merged-main CI run and the independent clean-clone readback are recorded in the R01 completion receipt delivered with the merging session; this document deliberately contains no post-merge facts and claims no outcome that has not occurred.

File digests (SHA-256, at authoring):

```
5147df19f4fdd0ab5c192d138ff953938455be30fd76539b23b3c7befa31032d  src/persistence/portfolio_store.ts
9b8ecf76b830ddc76f0864b0b01a16398c25e6c34277904493159286c31f2aaf  src/persistence/brokerImportPersistence.ts
36e91b2527c1a9919eb8ace2645386839dc9f0e62222556b7de2b15e6d3e86b3  tests/durable_holdings_recovery_v1.test.ts
8c0bf019577619e73ef28afc256b3979128bf1db38ded04902b31102747e4fa7  evidence/cross-repository/IIPS_V3_D02_D03_D05_PR129_DEVIATION_CORRECTIONS_2026-11-06.md
```
