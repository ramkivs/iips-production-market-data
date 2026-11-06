# IIPS V3 — v1 `reconcileBrokerImportByRead` evidence-bound correction — completion receipt — 2026-11-06

**Date:** 2026-11-06 (Asia/Calcutta)  **Executed on:** Linux sandbox, Node v22.22.3  **Repository:** `ramkivs/iips-production-market-data` (IPD only)  **Branch:** `arena/2e580517-iips-production-market-data`  **Base (main at authoring):** `58fc8fb7f033650f40d61078d70e951f21dd033f`

**Scope of this receipt:** the v1 broker-import reconciler finding recorded at `src/persistence/brokerImportPersistence.ts:348–357` (at base `58fc8fb`) and published in `IIPS_V3_R01_IPD_RECONCILIATION_INVESTIGATION_2026-11-06.md` §4.5 (finding; “R01 does not direct changes to it”; “flagged for the PA, nothing more”). The user (PA session) authorized the bounded v1 correction for exactly this finding.

**Disposition this document evidences:** v1 lost-ACK reconciliation no longer treats a lone contribution-ledger row as sufficient. `COMMITTED` now requires settlement, evidence binding to the original request, cross-binding, and two consistent serialized evidence passes. The legacy four-argument call fails closed to `UNRESOLVED`. **No other behaviour was changed; nothing beyond IPD; no PRs #129–#131 reopened.**

## 1. Authority and limits

- Authorization is the PA-scoped task ordering this correction ("work exclusively in ramkivs/iips-production-market-data … use existing authorization"). No other authorization is claimed.
- **Explicitly excluded / unchanged:** v2 reconciliation semantics (R01/#130/#131 — untouched), `persistBrokerImport` commit path semantics, ALREADY_IMPORTED_NO_OP behaviour, the four-revision cap, v1 wire names, W-1 hard-false, no schema/migration/lock/fsync/wire changes, no operational database access, no provisioning, no external writes, no publication of qualification (QE 0/11), Gate 4/Gate 5, W-1 activation, or admission of any kind. Synthetic PASS ≠ qualification; reconstructed ≠ original.

## 2. Finding (before)

`reconcileBrokerImportByRead(writer, owner, portfolioId, contentDigest)` returned `COMMITTED` iff `contributions(owner, portfolioId)` contained `contributionId === contentDigest`, `NOT_COMMITTED` otherwise, `UNRESOLVED` on read error. No settlement probe, no successor-revision binding, no provenance/lineage cross-check, no holdings verification, no dual-pass consistency. Consequences:

- a lost-ACK writer could still commit after the read (no quiescence proof);
- a ledger row whose content belonged to a different import or was mid-transaction, malformed, or merely partially deletable was reported `COMMITTED`;
- `NOT_COMMITTED` was reported from an absence read with no writer-quiescence guarantee;
- read errors flattened into `UNRESOLVED`, but presence was never more than presence.

## 3. Correction (after) — bounded, fail-closed

`reconcileBrokerImportByRead(writer, owner, portfolioId, contentDigest, expectation?)` now returns `COMMITTED` only when ALL of the following hold; otherwise `UNRESOLVED` (or `NOT_COMMITTED` under the absence conjunction):

1. **Inputs.** Non-empty `contentDigest`; `expectation` supplied; `expectation.request` must be a shape-valid `BrokerImportRequest` whose `contentDigest` equals the argument and whose `portfolioId` equals the argument; intended evidence re-derived through the commit path (`deriveV1IntendedEvidence` — validation, lineage, governed identity gate, `computeBrokerImportProvenance`, `computeRevisionContentDigest`).
2. **Settlement (`writer.proveSettledForReconciliation`).** Mandatory and callable; any adapter lacking it, or a probe that throws, yields `UNRESOLVED`. Necessary, never sufficient; not held through the reads.
3. **Evidence binding (successor + provenance binding).** Expected successor = `request.expectedRevision + 1`; expected operation binds to v1 semantics (`expectedRevision === 0` ⇒ stored `INITIAL`; else `REPLACE` iff `request.mode === 'REPLACE'`; else `MERGE`); intended stored digest = `computeRevisionContentDigest(intendedHoldings, intendedProvenance)` (the same digest the v1 store persists at commit). The contribution must match on contributionId, stored contentDigest, lineage == recomputed provenance, fileName, sourceBroker, round-trippable UTC `importedAt`, and a persisted `ContributionSemantics` of `SAVED_NEW_BATCH|MERGED_INTO_EXISTING`.
4. **Cross-binding contribution ↔ successor revision ↔ snapshot.** Successor row at `expectedSuccessorRevision`, matching operation, UTC `committedAt`, `holdingsCount ≥ 1`, equal to intended length, finite `totalMarketValue ≥ 0` equal both to `contribution.amount` and the intended total; revision provenance digest 64-hex equal to the contribution lineage and to the intended provenance; stored revision `content_digest` equal to the intended digest; stored holdings row-exact to the intended snapshot (symbol-sorted full-field equality).
5. **Two consistent serialized evidence passes.** Contribution, revision evidence and holdings are read twice; byte-identical fingerprints required; any change → `UNRESOLVED`. All-legs absent on both passes with settlement proven ⇒ `NOT_COMMITTED`. Foreign-owner absence ⇒ `NOT_COMMITTED` (never `COMMITTED`; "absent under that owner's scope", not "provably never committed").

The v1 `OUTCOME_UNKNOWN` guidance message in `persistBrokerImport` now directs operators to reconcile against stored evidence via `reconcileBrokerImportByRead` with the original request; the no-retry rule is unchanged. The commit path, no-op idempotency and disposition semantics are untouched. Reconciliation performs **zero writes**.

**Determination of non-gaps:** the correction does not introduce new storage, does not read through any dispatch/§6 surface (writers only), does not touch the v2 surface, does not alter `PortfolioContribution`'s wire projection, and does not change any stored value or semantics.

**Backward-compatibility ruling:** the four-argument legacy call is kept source-compatible but is intentionally **not** verdict-compatible — it always returns `UNRESOLVED` (fail-closed), because with no original request the successor/provenance relationship is unbindable. This is the one behavioural break, made deliberately, documented here and in the PR; an evidence-bound call restores `COMMITTED` exactly when the import provably committed.

## 4. Tests (all added/updated in this pass)

| File | Suite | Result |
|---|---|---|
| `tests/v1_broker_import_reconciliation.test.ts` | **NEW — V1-T1 … V1-T15** (15 tests) covering: COMMITTED with evidence binding + zero writes (T1); legacy call → UNRESOLVED (T2); pre-commit rollback → `NOT_COMMITTED`, zero writes (T3); missing successor snapshot → UNRESOLVED (T4); contradicted stored content_digest → UNRESOLVED (T5); tampered contribution amount / lineage → UNRESOLVED (T6a/b); stale `expectedRevision`/successor mismatch → UNRESOLVED vs correct expectation → COMMITTED (T7); evidence for a different import at the same successor → UNRESOLVED (T8); foreign owner → `NOT_COMMITTED` never COMMITTED (T9); settlement-probe failure → UNRESOLVED (T10); two-pass flicker → UNRESOLVED (T11); malformed/mismatched inputs → UNRESOLVED (T12); REPLACE-mode create stores `INITIAL` and reconciles COMMITTED (T13); intended-evidence derivation fails closed under the identity gate (T14) and on provenance-broker mismatch (T15) | **15/15 pass** |
| `tests/q1_broker_import_durability.test.ts` | acknowledgement-loss test updated to the evidence-bound API (`{ request }`); all prior assertions intact | pass |

## 5. Verification executed for this correction (2026-11-06)

| Step | Result |
|---|---|
| `npm ci --no-audit --no-fund` | 33 packages, exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run build` (tsc + vite + PIT packages) | exit 0 |
| Full guarded `npm test` | **1083 executed — 1082 passed — 0 failed — 1 skipped** (`[test-guard] files=79`; the one skip is the pre-existing platform-conditional Windows named-pipe test) |
| `node --test dist/tests/v1_broker_import_reconciliation.test.js` | 15/15 pass |
| `npm run test:package-consumer` | see PR/merged-main comment (run locally: PASS) |

The executed-test count rose from 1068 to 1083 exactly by the fifteen new named tests.

## 6. Explicitly NOT done / NOT authorized

No v2 change; no commit-path, disposition, no-op or W-8/BI-08 change; no new IPC operation or route; no wire/protocol/binding/migration/lock/fsync changes; no operational database, provisioning or writes; no W-1 relaxation; no holdings REPLACE/RESET/DELETE change; no retention/deletion behaviour change; no claim of qualification, Gate 4/5 passage, QE completion or W-1 activation; PRs #129/#130/#131 unchanged and not re-merged.

## 7. Publication

Committed to `arena/2e580517-iips-production-market-data` against `main@58fc8fb7f033650f40d61078d70e951f21dd033f`; submitted as one pull request against `main`. Head CI and receipt check-runs, the merge commit, the merged-main CI and the independent clean-clone readback are recorded in the PR/merge record and the final PA receipt for this task; this document contains no post-merge facts and claims no outcome that has not occurred.

File digests (SHA-256, at authoring):

```
85ef2953ca22ddf64675d50b53b32325e43f5febb29cb86898edee744b192916  src/persistence/brokerImportPersistence.ts
664f84e6e28d7fd1c4b23a58d4fd932165abf8bab7349eb4245512a478dd23f0  tests/q1_broker_import_durability.test.ts
d3a23e8cc686445de13da08be9340d70c318d64d7447091e6286840fff6719a0  tests/v1_broker_import_reconciliation.test.ts
```
