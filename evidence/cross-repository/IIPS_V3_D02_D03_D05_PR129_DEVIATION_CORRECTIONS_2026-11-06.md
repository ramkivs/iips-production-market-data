# IIPS V3 — D02/D03/D05 PR #129 post-merge static deviation corrections (IPD)

**Date:** 2026-11-06T12:35Z
**Repository:** `ramkivs/iips-production-market-data` (IPD)
**Branch:** `arena/cf50d9d8-iips-production-market-data`
**Status:** RECONSTRUCTION-LINEAGE ENGINEERING — bounded synthetic engineering only. **Not** the lost original implementation. **Not** Gate 4 / QE / D06 admission. Every H01–H12 row remains **NOT QUALIFIED**.
**Addresses:** the two confirmed static deviations identified in the read-only investigation of merged PR #129 (merge commit `1cde2324ed4b4d636248af9ea3d87b10cac3d031`).

---

## 1. Authority basis (unchanged; no contract or schema amendment)

- PA act `cea7fed5618ed08683cf9d12d22b0a6e02c557f4` — D02/D03/D05 EFFECTIVE 2026-11-06; stale-first ordering; duplicate no-op before cap rejection and after the stale check; v1 unchanged; implementation exclusively in IPD.
- Contract spec `38c435995fe4b3d9e434ec02432c59f944c49a7a` — §3 lifecycle (stale-first, no retry, exact unknown-outcome reconciliation: settled quiescence + consistent reads + exact revision/contribution/provenance evidence; "a receipt alone is insufficient"; absence while a writer could still commit is not proof).
- PA operative transcript `920c4dcff0a2488eca3ddf02ec147d00e01b811b` — unknown-outcome/lost-acknowledgement handling as adopted.
- This change **does not** change the adopted contract, the receipt schema, v1 semantics, the four-revision cap, IRR's v1 consumer, or any runtime/operational scope. No evidence-record digest persistence was introduced. W-1 remains hard-false. No operational store, provisioning or write path was touched.

## 2. Deviation 1 — stale-revision precedence (corrected)

**Confirmed deviation (investigation, PR #129).** A request whose `expectedRevision` was stale could be refused by *domain, provenance or identity* rejection before stale detection ran — e.g. `INVALID_REQUEST` from payload validation, `REFUSED_UNRESOLVED_IDENTITY` from the governed identity gate, or `InvalidPortfolioRequestError` from the store's pre-transaction validation — instead of `REVISION_CONFLICT`. D03 requires stale-revision detection to precede domain/provenance/identity rejection; only framing and security validation may legitimately run first.

**Correction (smallest contract-conforming change).**
- `src/persistence/portfolio_store.ts` — `validateSnapshotRequest` split into `validateSnapshotFraming` (phase A: object shape, key closure, C7 caller-authority refusal, portfolioId non-blank, safe-integer `expectedRevision >= 1`, 64-hex digest format, broker non-blank, sourceEvidence presence/key-closure/digest formats — **framing and security only**) and `validateSnapshotDomainAndProvenance` (phase B: UTC-instant provenance check, broker↔evidence consistency, per-row domain/identity validation, aggregate finiteness, weight-sum ±0.01, active-count ≥1, source-broker consistency). `saveSnapshotV2` now runs phase A pre-transaction, then inside the serialized transaction: binding revalidation → portfolio resolution → **stale-first `REVISION_CONFLICT`** → **phase B** → duplicate no-op (before cap) → cap refusal → atomic write.
- `src/persistence/brokerImportPersistence.ts` — `persistHoldingsSnapshotV2` keeps framing/security validation first, then performs an **authorized read-only current-revision probe** (new `currentRevision` writer method) and returns `REVISION_CONFLICT` (zero delta) **before** lineage-adjacent domain validation, `validateRequest` (importedAt round-trip, broker consistency) and the governed `resolveHoldings` identity gate. The store re-checks stale under the serialized transaction at commit time, so a concurrent commit cannot smuggle a stale write past the probe (no TOCTOU hole; on a tie, the transaction-time check governs).
- Retained (legitimate early): all framing and security validation — C7 recursive caller-authority rejection, key closure, size/type/format checks, and the dispatch-layer/W-1 refusals, which all still precede stale detection by design.
- v1 paths (`create`, `save`, `reset`, `delete`, `persistBrokerImport`) are byte-compatible — untouched. IRR's v1 consumer is untouched.

## 3. Deviation 2 — UNKNOWN/lost-acknowledgement reconciliation (corrected)

**Confirmed deviation (investigation, PR #129).** `reconcileSnapshotV2ByRead` classified an outcome from read state alone: contribution present (+ revision-number presence) → `COMMITTED`; otherwise → `NOT_COMMITTED`. It neither (a) proved the writer settled nor (b) verified exact correspondence of revision, provenance and snapshot — so an absent/empty/weak reading could be reported as `NOT_COMMITTED` while a lost-ack writer could still commit, and a bare presence could be reported as `COMMITTED` on weaker evidence than D03/spec §3 allows. No-retry behaviour was and remains mandatory.

**Correction (smallest contract-conforming change).**
- New zero-write settlement probe `proveSettledForReconciliation()` on the v2 writer surface (implemented in `DurablePortfolioStore`): outside any open transaction it performs `BEGIN IMMEDIATE;` then immediately `ROLLBACK;` — **zero bytes, zero domain effect**. It succeeds only when no writer holds the write lock (a lost-ack writer then either committed atomically before the lock was granted or is blocked behind it) and throws otherwise. Reconciliation inside an open transaction never proceeds (throws → `UNRESOLVED`). One attempt only — no retry.
- `reconcileSnapshotV2ByRead` now: (1) validates inputs (`contentDigest` lowercase 64-hex; `expectedSuccessorRevision`, when supplied, integer ≥ 2 — else `UNRESOLVED`); (2) requires the settlement probe to succeed — failure → `UNRESOLVED`; (3) performs **two consistent read passes** — any verdict change between them → `UNRESOLVED`; (4) classifies `COMMITTED` only with exact correspondence on both sides: contribution row with matching identity, matching stored digest copy, and complete non-null provenance (fileName, sourceBroker, round-trippable UTC `importedAt`, 64-hex lineageDigest) **and**, when the successor revision is supplied, a revision row that is `MERGE`, has `holdingsCount >= 1` (a real snapshot), finite non-negative `totalMarketValue`, non-blank commit instant and 64-hex provenance digest; (5) `NOT_COMMITTED` only when settlement is proven and both passes show the contribution AND successor revision absent; (6) everything else — disagreement, weak/legacy-NULL provenance, empty successor snapshot, non-MERGE successor, failed probe, read failure, malformed input → `UNRESOLVED`.
- No automatic retry, resend or resubmit exists anywhere on these paths, unchanged. Reconciliation performs zero writes (asserted in fixtures). A lost acknowledgement remains neither proof of failure nor a retry ticket.

## 4. Verification executed for THIS correction (2026-11-06T12:35Z)

Host: Linux sandbox, Node v22.22.3. Isolated synthetic fixtures only.

| Step | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run build:tsc` | exit 0 |
| `npm run build` (tsc + vite + packages) | exit 0 |
| `npm test` (guarded) | **1056 executed — 1055 passed — 0 failed — 1 skipped** |
| `node --test dist/tests/durable_holdings_contract_v1.test.js dist/tests/durable_holdings_recovery_v1.test.js` | 11/11 pass (V2-C01…C05, V2-R01…R06) |
| `npm run test:package-consumer` | PASS (browser bundle `forbiddenHits: []`; strict typecheck PASS) |

New regression tests (targeted, boundary-inclusive):
- `V2-C05` (contract): store-boundary and service-boundary assertions that stale `expectedRevision` yields `REVISION_CONFLICT` ahead of domain (NaN, weight-sum), provenance (non-round-trippable/offset `importedAt`, broker↔evidence mismatch), and identity (blank identity fields, unresolved identity gate) rejection; retained framing/security precedence (C7 identity-key injection, malformed digest, `expectedRevision: 0` → `INVALID_REQUEST`, never `REVISION_CONFLICT`); current-revision behaviour unchanged (`INVALID_REQUEST`/`REFUSED_UNRESOLVED_IDENTITY`/`ALREADY_IMPORTED_NO_OP`) including the boundary where an already-committed contribution digest replayed with an invalid payload yields `INVALID_REQUEST` (no success no-op for an unverifiable payload); zero domain delta on every refused path.
- `V2-R06` (recovery): settlement-proven `COMMITTED` with zero writes during reconciliation; settlement-probe failure → `UNRESOLVED` (state absent and present); absent+settled → `NOT_COMMITTED`; verdict change between the two read passes → `UNRESOLVED`; empty successor snapshot (`holdingsCount 0`) → `UNRESOLVED`; non-`MERGE` successor → `UNRESOLVED`; malformed successor provenance → `UNRESOLVED`; legacy/NULL lineage on a matching contribution row → `UNRESOLVED` (checked against a real store); malformed digest / `expectedSuccessorRevision < 2` → `UNRESOLVED`; `domainCounts` unchanged across all of it.

Baseline regressions: the guarded full suite passes unchanged except expected counts (+2 tests vs the merged-PR baseline of 1054).

Changed files (git blob on this branch at authoring):

```
src/persistence/portfolio_store.ts          (validateSnapshotFraming/validateSnapshotDomainAndProvenance split; saveSnapshotV2 stale-first; currentRevision; proveSettledForReconciliation)
src/persistence/brokerImportPersistence.ts  (writer surface +2 read methods; stale probe in persistHoldingsSnapshotV2; settlement/correspondence reconciliation)
tests/durable_holdings_contract_v1.test.ts  (V2-C05)
tests/durable_holdings_recovery_v1.test.ts  (V2-R06 + unreadable fixture carries the settlement probe)
```

File digests (SHA-256):

```
a9e4a8595ab603b2b2dc02fc5c474cb19526433c94d9dfad3ed1c6521db6e664  src/persistence/portfolio_store.ts
4a575b127a9e043459e843431c9f0bbfae12a84778ca89614974f59cac118804  src/persistence/brokerImportPersistence.ts
18a1ccfb4c08c2f0f4ebac52776ccbaa9bbd263af26fee467fca5b2f0a963909  tests/durable_holdings_contract_v1.test.ts
47076bae45bdc74e33ce35fdbdeafbc5cff8d7ef765a6b2ebbd75125bc0e5f1d  tests/durable_holdings_recovery_v1.test.ts
```

## 5. Explicitly NOT done / NOT authorized

No change to the adopted contract or receipt schema; no evidence-record digest persistence; no IRR change; no runtime/operational scope expansion; no operational database access, provisioning, writes, activation or W-1 relaxation; no REPLACE/RESET/DELETE; no QE, Gate 3/4/5 acceptance claim; H01–H12 remain **NOT QUALIFIED**. Reconstructed ≠ original. Synthetic PASS ≠ qualification.

## 6. Publication

- Branch `arena/cf50d9d8-iips-production-market-data`; **PR #130** → `main` (created 2026-11-06T12:47Z, head `7d99117`).
- CI run `42218869705` (pull_request, `7d99117`): `typecheck`, `build`, **Test (guarded)**, `Public package consumer` — all SUCCESS; the trailing `Publish executed test count` github-script step reported `tests=null, pass=null, fail=null` (the tee'd `test-output.log` did not match the step's anchored parse on the runner; the guarded runner itself passed and recorded 1056/1055/0 locally and on the runner's test step). A re-run request was rejected by the platform (`run 42218869705 cannot be rerun`); this document update re-triggers CI on a new head. If the step fails identically on re-trigger, the gap is in the runner/publish step, not in the code or the guarded test result — report, do not bypass.
- Merge is **not** authorized by this document — required CI must be green and a separate human/PA action is required to merge.
