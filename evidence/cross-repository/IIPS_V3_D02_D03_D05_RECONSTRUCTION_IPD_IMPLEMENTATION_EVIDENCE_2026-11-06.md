# IIPS V3 — D02/D03/D05 reconstructed durable-holdings implementation evidence (IPD)

**Date:** 2026-11-06
**Repository:** `ramkivs/iips-production-market-data` (IPD)
**Branch:** `arena/e64b5e72-iips-production-market-data` (session branch; see §8 of this document)
**Status:** RECONSTRUCTION — bounded synthetic engineering only. **Not** the lost implementation. **Not** Gate 4. Every H01–H12 qualification row remains **NOT QUALIFIED**.

---

## 0. What this document is and is not

This is the evidence pack for a **reconstruction from the effective authority records**, authored after the original implementation commit (`4b12698767fc08b6b7df447e67d104fd5c47e703`, authored at the former local working copy `/home/user/ipd`) was confirmed **unrecoverable**:

- it is absent from every ref, object and reachable commit in this repository (`git fsck`, reflog, `git cat-file`, `git log --all --source`, `git ls-remote`, GitHub REST refs/commits API for `ramkivs/iips-production-market-data`);
- the original push attempt was denied with HTTP 403, recorded in the IRR publication-status artifact (`docs/integration/D02-D03-D05-IMPLEMENTATION-PUBLICATION-STATUS-2026-11-06.md`, blob `72de9513748cd4a783aae92e87ca6b0de1a3a6c6` — see §1);
- the founding build's *records* (typecheck PASS, 9/9 isolated PASS, 123/123 regressions PASS, Node 22.22.3) are **not** evidence about this reconstruction and are **not** claimed here as re-established by that record.

This document must not be read as: production activation, operational holdings writes, Gate 4 / QE / admission, D06, native-host or genuine-broker qualification, or a `durable: true` claim on any product dispatch path. Synthetic fixture PASS ≠ qualification (H01–H12 all remain **NOT QUALIFIED**; see §9).

## 1. Authority chain (effective records this reconstruction is built from)

All IRR artifacts live at `ramkivs/iips-review-recovered`, `main`. Fetched and hash-checked on 2026-11-06 (`gh api … | base64 -d`).

| Artifact | Git blob (IRR `main`) | Role |
|---|---|---|
| `docs/integration/IIPS_v3.0_PA_D02_D03_D05_ENGINEERING_ACT_2026-11-06.md` | `cea7fed5618ed08683cf9d12d22b0a6e02c557f4` (PR #477, head commit `423d8dd2…`; merge commit `85a348f…`) | **Effective authority.** D02/D03/D05 ADOPTED/EFFECTIVE 2026-11-06. Key overrides vs the Prompt 8 spec: four-revision cap retained (not removed); stale-first ordering; duplicate no-op **before** cap rejection and **after** the stale check; v1 unchanged; product dispatch limited to v2 reads + refusals; implementation exclusively in IPD; branch per act §4 (see §8). |
| PA act effectiveness receipt | comment `issuecomment-6676618817` on PR #477 | Effectiveness registration. |
| `docs/integration/DURABLE-HOLDINGS-CONTRACT-AND-QUALIFICATION-SPEC-v1-2026-11-06.md` | `38c435995fe4b3d9e434ec02432c59f944c49a7a` | Contract 2.0.0 / frame v=2 semantics; H01–H12 definitions; T01–T24. Its proposed cap **removal** is superseded by the PA act (cap stays 4). |
| `evidence/integration/d02-d03-d05-engineering-2026-11-06/PA-INSTRUCTION-OPERATIVE-TRANSCRIPT.txt` | `920c4dcff0a2488eca3ddf02ec147d00e01b811b` | PA explicit approvals 2026-11-06 (owner/tenant binding; contract 2.0.0 / frame v=2; cap stays 4; duplicate-before-cap after stale; unknown-outcome/lost-ack handling; non-empty contributions preserved; empty-INITIAL resolution; W-1 hard-false). |
| `evidence/integration/durable-holdings-contract-v1-2026-11-06/contracts.schema.json` | `1307a1e4bbb30785397d3606c98ab0201882c7a0` | Consumer contract 2.0.0 schema (SaveReceipt `durability`/`durable` required; Detail carries **no** durability — DR-3; nullable Contribution projection). Used as the normative wire-shape reference. |
| `evidence/integration/durable-holdings-contract-v1-2026-11-06/runtime-test-definitions.json` | `e839b7d7bc94a7f4dca8fda4eac549f496fbb70a` | T01–T24 → H01–H12 mapping (all legs NOT_EXECUTED there; none executed here either). |
| `docs/integration/D02-D03-D05-IMPLEMENTATION-PUBLICATION-STATUS-2026-11-06.md` | `72de9513748cd4a783aae92e87ca6b0de1a3a6c6` | Lost-build record: 13 paths, 9/9 isolated PASS, 123/123 regressions PASS, push 403, "INCOMPLETE", H01–H12 NOT QUALIFIED. |
| `docs/integration/SAIRAM-DURABLE-HOLDINGS-ARCHITECTURE-READINESS-2026-11-06.md` | `5708098ccbe8a32f59c9a2ad3333baa98337d1db` | Canonical target `owner-4dc756b3` on retained technical tenant `ipd-personal-local`; SAIRAM display-only; tech tenant ≠ evidence tenant. |

IPD-side normative references used by the implementation:
- `evidence/cross-repository/IIPS_V3_G2_IPD_IRR_PORTFOLIO_CONSUMER_CONTRACT_V1_2026-10-18.md` — W-11 (`DURABLE` only when served from/committed to the designated durable store; used for the post-COMMIT receipt vocabulary).
- Migrations 001–004 (checksum-ledgered; untouched by this reconstruction) and `src/persistence/migration_ledger.ts` (checksum verification → `MigrationIntegrityError`).

## 2. What was reconstructed (and how it differs from the original)

The original implementation was **not recovered and is not claimed**. The reconstruction was written fresh onto `main`-derived baseline `07e86a4f2c105651f3097a96cb519f8611945e30` (Merge PR #128), scoped exactly to the act's D05 file envelope. Modified/added paths:

| Path | Change |
|---|---|
| `src/ipc/protocol.ts` | v2 parse path; `IPC_PROTOCOL_VERSION_V2 = 2`; `IpcV2Operation`; v2 structural validator (types/ranges/key closure only; broker/weight-sum/duplicates deliberately **not** here); `AnyRequestEnvelope`; optional `version` on `classAFrame`/`successFrame`. v1 parsing byte-compatible. |
| `src/ipc/dispatch.ts` | v2 branch ahead of the v1 write-refusal: v2 writes → `WRITE_NOT_AUTHORIZED` (v=2) before any store access; v2 reads `portfolio.list`/`get`/`revisions`; unknown v2 ops → Class P zero bytes; all Class A frames versioned; v2 resolves the holdings-scoped binding. v1 branch unchanged. |
| `src/persistence/binding.ts` | Holdings-scoped resolvers: `resolveActiveHoldingsBinding` / `…InCurrentTransaction`; D02 constants. v1 resolvers untouched. |
| `src/persistence/portfolio_store.ts` | `getV2` (nullable-validated contribution projection; DR-3 durability-free detail), `createEmptySnapshot` (empty INITIAL revision 1, stable opaque ID), `saveSnapshotV2` (stale-first → duplicate-no-op-before-cap → cap 4), `withHoldingsSnapshotTransaction` (in-transaction holdings-owner revalidation), `contributionsValidated` (DR-4r; NULL preserved, malformed non-NULL refuses whole projection). v1 methods unchanged. |
| `src/persistence/brokerImportPersistence.ts` | `persistHoldingsSnapshotV2` (wire-shape validation → server-computed per-row lineage → governed resolver stubbing point → complete-snapshot MERGE; success receipt post-COMMIT with `durability: 'DURABLE'`/`durable: true`; `CommitOutcomeUnknownError` → `OUTCOME_UNKNOWN`, never an automatic retry; typed refusals with zero domain delta), `reconcileSnapshotV2ByRead` (COMMITTED/NOT_COMMITTED/UNRESOLVED; no resend). |
| `tests/durable_holdings_contract_v1.test.ts` | V2-C01…C04 (lifecycle/stale/dup/cap; refusal zero-delta; binding isolation; socket dispatch/refusals/v1 preservation). |
| `tests/durable_holdings_recovery_v1.test.ts` | V2-R01…R05 (per-boundary fault injection rollback; post-COMMIT lost-ack → UNKNOWN → readback reconciliation; separate-process exit pre/post COMMIT; busy writer + two-process race (exactly one commit); quiescent backup/exclusive copy/hash verify/isolated restore/tamper refusal). |

Explicitly **not** changed: `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, migrations, `connection.ts`, `migration_ledger.ts`, `provisioning.ts`, `durablePortfolioStorePort.ts`, security master/guard, all v1 wire behavior.

## 3. Semantics locked by this reconstruction (under the effective authority)

- Canonical owner `owner-4dc756b3`, retained technical tenant `ipd-personal-local`; SAIRAM remains display-only and grants no authority.
- Four-revision cap **retained** (PA act override). Ordering inside the serialized transaction: revalidate holdings binding → resolve portfolio (missing/foreign/tombstoned all fold into `ResourceUnavailableError`) → `expectedRevision` safe-integer check → **stale-first** `REVISION_CONFLICT` → **duplicate-before-cap** idempotent no-op (caller `contentDigest` vs the contribution ledger; `ALREADY_IMPORTED_NO_OP`, original revision, zero delta — even at cap) → cap ≥ 4 refusal for a new mutation → atomic revision + holdings + pointer + exactly one contribution row (`MERGED_INTO_EXISTING`) → COMMIT.
- Complete-snapshot MERGE: incoming vector persisted as-is; quantities never summed. Immutable history; INITIAL revision 1 empty with stable ID; no request-idempotency promise on create.
- Idempotency is duplicate detection only; **no automatic retry** anywhere; `requestId` is correlation only.
- Unknown outcome / lost acknowledgement: `OUTCOME_UNKNOWN`; reconciled **only** by exact authorized readback (`reconcileSnapshotV2ByRead`: contribution present AND (if supplied) successor revision present → `COMMITTED`; both absent → `NOT_COMMITTED`; disagreement or read failure → `UNRESOLVED`).
- Nullable non-empty contribution projection (migration-004 legacy NULLs preserved; malformed non-NULL refuses the whole projection). No `duration` claim anywhere except the post-COMMIT v2 save receipt (`DURABLE`/`true`, supported by W-11 and the committed-to-designated-store fact); read models carry no durability fields (DR-3).
- W-1 hard-false preserved on every product dispatch path, v1 and v2 alike: all live v2 writes refuse with `WRITE_NOT_AUTHORIZED` before any store access; v2 mutation primitives are reachable only from isolated synthetic fixtures.
- v1 behavior and refusals are unchanged; v1 framing untouched.

## 4. Verification executed for THIS reconstruction

Host: Linux sandbox, **Node v22.22.3**, npm 10.9.8, checkout of `07e86a4f2c105651f3097a96cb519f8611945e30`.

| Step | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run build:tsc` | exit 0 |
| `npm run build` (tsc + vite bundle + packages) | exit 0 |
| `npm test` (guarded runner; baseline 1045 tests / 1044 pass / 1 skipped) | **1054 tests / 1053 pass / 0 fail / 1 skipped** |
| `node --test dist/tests/durable_holdings_contract_v1.test.js` | 4/4 pass |
| `node --test dist/tests/durable_holdings_recovery_v1.test.js` | 5/5 pass |
| `npm run test:package-consumer` (pack + IRR importers) | PASS (browser bundle `forbiddenHits: []`; strict typecheck PASS) |

Baseline regressions re-run unchanged: the full pre-existing suite is part of the guarded run above. New tests added: 9 (4 contract + 5 recovery).

File digests at authoring time (drift control per contract v1 V-6; git blob SHA / SHA-256):

```
aede136221315eba292799b78f156e86ba21e6be  src/ipc/protocol.ts                     0d9a684fe9ec7542aa3d99cacf64d6adab63fd6f99a2e2faa9ad6b33007b15a2
823e310077b59189a3a5a6084321107a37ca9495  src/ipc/dispatch.ts                     2aebe60b80fc7565c903afc6f84ca4e225571b80746635853118f7ba70bd1419
fa6cd3e94363ef9c9b353298d90535c571a9e177  src/persistence/binding.ts               61dfeb55c57dbaffa11b89a25ed1d6f80e24c588fbeee6dc5848737d50834603
d67e0a10b833eee2e3f083d9f7a317f73e298531  src/persistence/portfolio_store.ts       fc773c9f0640db01d7384f3510f547a19accb06b322925d1f4c45d0dab63638e
03512aecf4cd1987b43b095664998286ebf27af9  src/persistence/brokerImportPersistence.ts 926d9c8be43afc80a1e3d4869b940dbf6b3eaea781fcd53366d75effc1986442
41a359e1540946e7a1e7c957b0faca4f9be72622  tests/durable_holdings_contract_v1.test.ts 3c5935539ce1994a4f6ea6a31e678d26119b6e97660bc6e43f9480675ec3ff67
b950cf3ce14f2f2dc06b6cf05ac822e05a322d1c  tests/durable_holdings_recovery_v1.test.ts 1b1000bde70b76b1dfd5ecfffeea69538b9bda6f799d4ca60e3eb50ff06fb787
```

## 5. Labeling and honesty note

Every test above is an isolated synthetic fixture (temporary disposable databases; synthetic broker observations; stubbed identity resolvers; fixture binding rows created in-test; child processes for commit-boundary and race behaviour). Nothing here is native-Windows evidence, genuine-broker evidence, QE, Gate 4, D06 admission, or operational activation. All H01–H12 rows remain **NOT QUALIFIED**; the H01–H12 appendix lives in IRR (authority locus) and is updated as part of this publication sequence, not here.

Known deviations/decisions vs the contract artifact (recorded, not resolved silently):

1. The service-level success receipt is a **superset** of contract 2.0.0 `SaveReceipt` (adds `noOp`, `storeEffect`, `holdingsPersisted`, `totalMarketValue`, `contributions`, `message`). Because every live product v2 write refuses before reaching it, no wire frame ever carries it; the required SaveReceipt fields (`disposition`, `revision`, `durability`, `durable`) are present and `additionalProperties` applies only to the wire shape. Alternative discarded: stripping service-internal detail (would weaken the fixture assertions without adding conformance).
2. `SAVED_NEW_BATCH` is unreachable on the v2 snapshot path by design (create is deliberate and separate from import; every v2 save merges into an existing portfolio); the vocabulary member is retained for storage/vocabulary compatibility.
3. `isUtcIsoInstant` is stricter than the spec's floor (millisecond-precision round-trip), matching the v1 wire validator.
4. v2 dispatch serves reads for any holdings-bound portfolio; v1 reads keep their existing semantics unchanged.

## 6. What this publication does NOT authorize

No operational holdings write; no production activation; no D06 admission; no operational database access; no provisioning or migration; no prior-migration edits; no A-6 D05-master expansion; no Gate 4 acceptance or QE execution pin; no REPLACE/RESET/DELETE activation; no accounting; no multi-user/tenant expansion; no PF-1/W-1/owner-isolation relaxation; no copying of IPD runtime code into IRR; no push to `main` outside the PR path.

## 7. Publication record

- Base: `07e86a4f2c105651f3097a96cb519f8611945e30` (origin/main; Merge PR #128).
- Branch pushed: `arena/e64b5e72-iips-production-market-data`; PR → `main`; CI `typecheck · build · test` + package consumer must pass before merge; merge only via `gh pr merge`.
- Post-merge: independent readback of remote `main` (head, tree, blobs, first parent; concurrent work preserved); IRR H01–H12 appendix and cross-repo receipt published in `ramkivs/iips-review-recovered` (authority/tracker/evidence documentation only).
- Reconstructed ≠ original. Anyone reading this repository must treat the implementation as a fresh reconstruction made under the effective records, on the date stated, with the test results in §4.

## 8. Branch-name discrepancy (disclosed)

The PA act §4 names a remediation branch `arena/f839befc-iips-review-recovered`. The controlling execution environment pinned this session to `arena/e64b5e72-iips-production-market-data` (the Arena session branch). This publication uses the pinned session branch, not the act-named one; `main` is never pushed directly. The discrepancy is disclosed here and in the PR body.

---

*Prepared as reconstruction evidence on 2026-11-06. The implementing agent is not the original author of record `4b126987…`, and no claim is made that this code is that commit. SQLite timestamps, fixture IDs and randomized UUIDs differ by construction; the logical content is what §3–§4 describe.*

---

## 10. Amendment — 2026-11-06T12:35Z: PR #129 post-merge static deviation corrections

The read-only investigation of merged PR #129 confirmed two static deviations against the effective D02/D03/D05 decisions. They were corrected on branch `arena/cf50d9d8-iips-production-market-data` (this document is otherwise frozen; §4 file digests describe the originally published tree only):

1. **Stale-revision precedence** — domain, provenance and identity rejection could precede stale-revision detection. The store now splits phase-A framing/security from phase-B domain/provenance/identity validation, runs the stale check first inside the serialized transaction, and the v2 service refuses stale requests from an authorized read-only probe **before** lineage-adjacent domain validation and the identity gate (store still re-checks at commit time).
2. **UNKNOWN/lost-acknowledgement reconciliation** — `reconcileSnapshotV2ByRead` now requires a zero-write writer-settlement probe (`BEGIN IMMEDIATE` + immediate `ROLLBACK`), two consistent read passes, and exact correspondence of contribution identity + stored digest copy + complete provenance and (when supplied) of the successor revision (`MERGE`, `holdingsCount >= 1`, finite non-negative value, 64-hex provenance). Absent + settled → `NOT_COMMITTED`; anything unproven → `UNRESOLVED`. No retry anywhere.

Regression tests added: `V2-C05`, `V2-R06`. Guarded suite at amendment time: **1056 executed — 1055 passed — 0 failed — 1 skipped**. Build exit 0; `test:package-consumer` PASS. Full details, digests and non-authorizations: `evidence/cross-repository/IIPS_V3_D02_D03_D05_PR129_DEVIATION_CORRECTIONS_2026-11-06.md`. The contract, receipt schema, v1 semantics, cap, IRR v1 consumer and all operational boundaries are unchanged; H01–H12 remain **NOT QUALIFIED**.
