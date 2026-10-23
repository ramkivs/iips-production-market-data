# IIPS v3.0 CAP-02 — U2 provenance and contribution-schema act

> **STATUS: RENDERED — EFFECTIVE FOR THIS SEPARATE PART B MANIFEST ONLY.** This act authorizes additive persistence/read support for broker-import provenance. It does not authorize operational writes, does not satisfy Gate 4/5, and does not change Gate E W-1. The companion Part A decision is `IIPS_V3_CAP02_G3_AMEND_02_U2_EFFECTIVE_2026-10-23.md`.

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-CAP02-U2-PROVENANCE-SCHEMA-ACT-2026-10-23-01` |
| Decision date | 2026-10-23 (UTC) |
| Repository | `ramkivs/iips-production-market-data` |
| Decision/implementation baseline | `main@3dde26aa1cd29197c31498f380d9600aa5471222`; tree `62273fde60cba47986969be7c32cf30fbf7d4e1d` |
| Authority | Standing PA global decision/execution grant (2026-10-12), IRR F-3 record blob `c4c9f7d79ef181af96f6c4e5cc108288ef22fd02`; DEC-06 authority reconciliation, IRR main blob `4be3ea578a51a1a949337e5d218b89841c04892d` (R-1/R-3/R-6/R-7); current PA execution instruction; Part A U2 decision. |
| Prior proposal | `IIPS_V3_CAP02_U2_GATE3_MANIFEST_AMENDMENT_PROPOSED_2026-10-23.md` Part B; proposal status remains historically unchanged. |

## 1. Decision and exact manifest

The PA renders this standalone contribution-schema act effective. An import's computed provenance must be durably recoverable from the contribution read model without changing the meaning or key of any existing contribution row. Apply only these paths:

| Path | Exact authorized change |
|---|---|
| `src/persistence/migrations/004_portfolio_contribution_provenance.ts` (new) | Add nullable columns `file_name TEXT`, `source_broker TEXT`, `content_digest TEXT`, `lineage_digest TEXT`, `imported_at TEXT`, and `contribution_semantics TEXT` to `portfolio_contributions`. Semantics values for new broker imports are `SAVED_NEW_BATCH`, `MERGED_INTO_EXISTING`, `RESET`, or `REPLACE`, constrained to this set when non-null. Existing PK/FKs and all old columns remain unchanged. Nulls on pre-existing rows mean historical provenance was not recorded; no backfill or invented value. Migration must be additive and checksummed; migration 001 is immutable. |
| `src/ipc/entrypoint.ts` (modify) | Register migration 004 after migrations 001–003 in `GATE3_MIGRATIONS`; no other startup behavior change. |
| `src/persistence/portfolio_store.ts` (modify) | Accept contribution provenance on the broker-import write path, insert all six fields, and return them from the contribution read projection. Existing legacy callers retain their existing behavior and return null provenance fields where the row predates this migration. |
| `src/persistence/brokerImportPersistence.ts` (modify) | Pass the exact `computeBrokerImportProvenance` inputs/outputs through unchanged; no provenance field silently dropped or reconstructed from UI/consumer data. |
| `tests/q1_broker_import_durability.test.ts` (modify) | Add T-U2-9 migration upgrade/backward-compatibility, provenance round-trip after restart, required new-import field persistence, and legacy-row nullability assertions. |

Baseline blobs on verified IPD main: migration 001 `f594a18264c45ccdcbfa2381592820a72d3c453b` (must remain byte-identical); `src/ipc/entrypoint.ts` `e3727bb5859381df3e91a57be83b4802ce6047b9`; `src/persistence/portfolio_store.ts` `c48479dbcd7244b5dc5086d70a18534780409164`; `src/persistence/brokerImportPersistence.ts` `59bb09eb3ca5770ddc6c1484796f237fadd2fbb2`; test file `22981dec60f26a06d090f360f1f10a202292e9af`.

## 2. Required semantics and compatibility

1. Every field used by `computeBrokerImportProvenance` remains available to the store and is returned by the contribution read path. The migration does not weaken checksums or rewrite migration history.
2. Historical rows remain valid. Nullable columns are intentional; absence is represented as SQL `NULL`, not a fabricated timestamp, filename, digest, broker, or semantic disposition.
3. Newly persisted broker-import rows must provide provenance values and one allowed semantic. Validate before insert; reject incomplete new provenance without partial effects. Ordinary existing contribution paths must not gain fabricated broker metadata.
4. Existing contribution primary key, owner scope, foreign keys, amount, contributed/created times, and their meanings remain unchanged.
5. Schema registration and the complete broker import occur under the Part A request-wide transaction when that path is exercised. Migration application itself follows the existing migration-ledger transaction/checksum behavior.
6. This is persistence capability correctness only. It is not permission to execute a write: `evaluatePortSaveGuard()` remains hard false; IPC returns `WRITE_NOT_AUTHORIZED`; `durable:true` remains unavailable pending separate gates.

## 3. Tests and closure evidence

T-U2-9 must prove upgrade from a database already carrying 001–003, retention of existing rows with null new fields, insertion/readback of all six exact fields, restart persistence, rejection of incomplete provenance for the broker-import path, and migration-ledger idempotence/checksum integrity. Run the complete IPD suite, typecheck and build serially, record exit codes/test counts, review exact changed paths, then publish and verify remote merge commit/tree, migration/test blobs, and post-merge CI. Passing tests are not Gate 4 qualification or write authorization.

## 4. Exclusions

No edit to migration 001, no destructive rewrite/backfill, no IPC wire/operation/result change, no IRR change, no route, no W-1 guard modification, no write activation, no Gate 4 or Gate 5 disposition, and no retroactive authority for any earlier code. The seven-field/three-rename G2 view gap remains outside this contribution schema act.

## 5. Decision state

```text
Part B provenance/schema authority: EFFECTIVE for §1 exact manifest
Migration 001:                     immutable
Legacy contribution provenance:    NULL / explicitly unavailable
New broker-import provenance:       required, validated and persisted
Gate 3 accepted scope:               prior acceptance unchanged; this new act supplies only its named authority
Gate 4 / result acceptance:          not authorized / not rendered
Gate 5:                              not granted
Operational writes:                  NOT AUTHORIZED; WRITE_NOT_AUTHORIZED preserved
U2 completion:                        NOT YET — implementation/tests/publication pending
```

*Rendered under the recorded standing PA grant and current PA-directed execution. No signature, approval ID, spoken selection or independent authority is fabricated.*
