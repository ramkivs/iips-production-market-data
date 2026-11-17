# IPD D02 — D5 / D16 Live Evidence Reconciliation (Windows-host read-only inventory, 2026-11-16)

**Document ID:** `IPD-D02-D5-D16-LIVE-EVIDENCE-RECONCILIATION-2026-11-16`<br>
**Date:** `2026-11-16`<br>
**Repository:** `ramkivs/iips-production-market-data` (`IPD`)<br>
**Branch:** `arena/c32aea42-iips-production-market-data`<br>
**Evidence bundle:** `d02-d5-d16-inventory-20261116T143819255Z-96672044` (generated `2026-11-16T14:38:20.857Z`, disposition `INVENTORY_COMPLETE_READ_ONLY_VERIFIED`, exit code `0`)<br>
**Governing approval:** Narrow Program Authority approval (`2026-11-16`) for strictly non-mutating read-only D5 / D16 SQLite inventory and provenance discovery only — [`IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md`](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md#2-narrow-level-e-read-only-d5d16-evidence-inventory-approved-on-2026-11-16)

## 1. Purpose, status and non-acceptance boundary

This report reconciles the live Windows-host read-only D5 / D16 SQLite inventory (executed `2026-11-16` on the Principal's physical Windows host at `C:\iips-data\iips\user-portfolio.sqlite`) against the registered IPD documents: the Stage 5 D5 identity-mapping tracker, the Program Authority decision package (D01–D22), the D5/D16 read-only inventory and blocker report, and the Windows-host operator package.

**No application code, identity record, database, migration, environment, or runtime was modified or provisioned by this reconciliation.** The inventory executed inside a read-only `BEGIN DEFERRED ... ROLLBACK` with `PRAGMA query_only = ON;`; pre/post database SHA-256 are byte-identical and no `-wal`/`-shm`/`-journal` sidecars existed before or after.

Inventory completion is **not** D5 acceptance, schema approval, implementation authority, provisioning/migration authorization, or D6 authorization. All formal statuses remain unchanged:

| Item | Status (unchanged by this reconciliation) |
|---|---|
| D5 (`D5-T1`–`D5-T5`) acceptance | **BLOCKED** — separate gate; pending separate PA acceptance of the verifier predicate and prescribed host evidence |
| D6 (`IRR` integration) | **NOT STARTED** |
| D04–D22 register dispositions | **PENDING** (proposed defaults NOT APPROVED) |
| Level C — detailed technical schema | **PENDING** / awaiting approval |
| Level D — implementation authority | **NOT GRANTED** |
| Level E — operational provisioning / migration | **NOT AUTHORIZED** (narrow 2026-11-16 read-only inventory grant is inspection-only) |

## 2. Evidence base and execution integrity

| Artifact | Location | SHA-256 |
|---|---|---|
| Published Level E read-only inventory archive | `evidence/d02-inventory-2026-11-16/windows-host/d02-d5-d16-inventory-20261116T143819255Z-96672044.zip` | `813183b382a26d0b6affeeaee04d44b0ea0057bea140a83221b460d8720da1b3` |
| Published manifest (5 lines) | `evidence/d02-inventory-2026-11-16/sha256s.txt` | see manifest |
| Historical Linux-sandbox preflight / blocker status | `evidence/d02-inventory-2026-11-16/d5-d16-readonly-inventory-status-2026-11-16.json` | `03f19477eac987ed11e2037eb4986c961868455193eb1ae8c61df97dd32b1735` |
| D5/D16 read-only inventory and blocker report (pinned) | `docs/integration/IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md` | `2f5a7b846fb250be031808e9541d2acc366c94224b9bae5aadc85f561d9ba4da` |
| Windows-host operator package (pinned) | `docs/integration/IPD-D02-D5-D16-WINDOWS-HOST-OPERATOR-PACKAGE-2026-11-16.md` | `15939002fb1973739a81ce83ab32f96cf640124f019a33b06c7c73c7cdbe8960` |
| PowerShell operator entrypoint | `scripts/Invoke-D02D5D16ReadOnlyInventory.ps1` | `e86286ef5390c6f87bffece176ee4534d79a608676d1d2a0799b8efded0e7f29` |
| Node read-only inventory runner | `scripts/d02-d5-d16-readonly-inventory-runner.mjs` | `7d92d11fe970a55c1fb3274e635525af8f779257487546fd4d2d63effb288f77` |
| Q01–Q14 query catalog | `scripts/d02-d5-d16-query-catalog.mjs` | `484640be587c88bec90239d05fb983205125070aea3e023b4b9b35eb561002fe` |

Execution integrity (from the evidence bundle `01-preflight-and-database-metadata.json` / `d5-d16-inventory-report.md`):

- Host: Windows (`win32` / `x64`, PowerShell 5.1), Node.js `22.16.0`, bundled SQLite `3.49.1`; `node:sqlite` capability probe `PASS`.
- Target: `C:\iips-data\iips\user-portfolio.sqlite`, 176,128 bytes, SHA-256 `6d683b3b897f09156fd51bd7ba6e5cfc3a69f734a00da9f12c103da720b70673` — **pre-inspection identical to post-inspection**; mtime `2026-11-12T10:45:20.439Z` unchanged; SQLite header legacy rollback format (write/read version `1`), not WAL-flagged.
- Sidecars: none before, none after (`-wal`, `-shm`, `-journal`, `-mj*`).
- Query scope: exact `Q01`–`Q14` catalog (21 statements across 14 query groups, combined SQL SHA-256 `af494435061555a33c289f2730d463576d6cf58c9d4f2582341e5f97bc87b937`), all `EXECUTED_OK`, inside `BEGIN DEFERRED; ... ROLLBACK;`; `Q14` (`PRAGMA query_only` inside snapshot) returned `1` (verified).
- `PRAGMA integrity_check`: `ok`; `PRAGMA foreign_key_check`: 0 violations.
- Audit hash chain (`audit_events`, 2 rows): verified in memory, genesis checksum `0`×64, terminal checksum `edbf27d8fd26a5c8954c95743dada00cb04ed60bbb78c6bb5ba859d4fb61f15f`.
- Zero mutations: no application startup, no `openDatabase()`/`ensureMigrations()`/binding resolvers, no Direct P1 provisioning, no `npm`/`npx`, no DDL/DML.

## 3. Live observations vs registered expectations

### 3.1 Identity, schema and migration ledger (`Q01`–`Q05`)

| Observation | Live value |
|---|---|
| Applied migrations (`_migration_ledger`) | `001`–`006`; all six match repository SQL-text checksums; none missing |
| D02 candidate ledger tables | Absent: `NO_D02_LEDGER_TABLES_PRESENT` (`canonical_owner_registry`, `portfolio_ownership_relationships`, `portfolio_source_registry` not present) |
| Migration `006` / `portfolio_restore_receipts` | Applied / present |
| Total tables | 13 |
| Active bindings | 1: `c5808abaffd072d6401ce63ad86c6ac0`, principal `ramki-personal-local` (ACTIVE) |
| Active memberships | 1: `d25dcc5370100b00766efc5166f65cf3`, tenant `ipd-personal-local`, `canonical_owner_id = ipd-owner-ramki-personal` (ACTIVE) |
| Approved D02 target owner `owner-4dc756b3` / tenant `ipd-personal-local` | **Zero rows anywhere** for `owner-4dc756b3`; the ACTIVE membership's `canonical_owner_id` is `ipd-owner-ramki-personal`, **not** `owner-4dc756b3` (`matchesApprovedD02TargetOwnerAndTenant: false`) |
| Active identity state | `ACTIVE_ESTABLISHED_S1_TUPLE` |
| Partial-unique active binding/membership invariant | Not violated (1 active binding, 1 active membership) |

Reconciliation: the live store confirms the established S1 tuple, but the S1 identity and the approved D02 overall owner `owner-4dc756b3` are currently **unlinked** — no relationship row, owner-registry row, or D02-owned portfolio exists. This matches the registered direction (separate explicit relationship, not yet provisioned) and `binding.ts` fail-closed behavior (`resolveActiveHoldingsBinding` requires `canonicalOwnerId === 'owner-4dc756b3' && tenantId === 'ipd-personal-local'`; the live ACTIVE tuple resolves to `ipd-owner-ramki-personal`, so holdings-domain resolution fails closed today).

### 3.2 Portfolio inventory (`Q06`–`Q14`) and the `DEFAULT_PORTFOLIO` exclusion

All 3 portfolios, 13 revisions, 142 holding rows (139 active), 6 contributions, and 1 restore receipt sit under `canonical_owner_id = ipd-owner-ramki-personal` / `ipd-personal-local`. Distinct owners: 1; distinct tenants: 1.

**Excluded pre-existing data — `DEFAULT_PORTFOLIO` (operational/test data, not a D02 target-owner migration subject):**

- `status = TOMBSTONED`, `current_revision = 9`, `deleted_at = 2026-11-11T17:05:10.292Z`, created `2026-11-08T17:32:19.410Z`; 10 revisions (revs 3 and 10 are `DELETE` with `content_digest = NULL`, per `portfolio_store.ts` tombstone semantics); 75 holding rows (74 `NULL` `security_identity`, 1 populated in rev 7); 4 contributions (3 `DHAN` `MERGED_INTO_EXISTING`, 1 manual `REPLACE` at rev 6 with all six migration-`004` broker-import columns `NULL`).
- `Q12b` flags 1 current_revision/tombstone anomaly on `DEFAULT_PORTFOLIO` (pointer `current_revision = 9` matches revision 9, a `MERGE`, on a `TOMBSTONED` portfolio whose max revision is 10); `Q07` flags 2 NULL `content_digest` revisions (revs 3 and 10, both `DELETE`).
- Disposition: these are non-applicable test-data artifacts under the S1 owner, not D02 target-owner (`owner-4dc756b3`) migration blockers. `DEFAULT_PORTFOLIO` is excluded from the active D02 candidate set and left untouched unless a future mutating disposition is separately authorized. The `DEFAULT_PORTFOLIO` exclusion is **never generalized** to other portfolios.

**Active historical candidate set (excluding `DEFAULT_PORTFOLIO`): 2 ACTIVE portfolios, 0 TOMBSTONED, 0 `Q12b` anomalies, 0 NULL `content_digest` revisions:**

1. `DHAN_PORTFOLIO` (`portfolio_name = "Dhan Broker Holdings"`, `created_at = 2026-11-11T17:05:50.679Z`, `current_revision = 1` `INITIAL`, `source_broker = DHAN`): 64 active holding rows (`total_market_value = 3353794.55`, `weight_sum_percentage = 100.01`), `identity_status = RESOLVED`, `resolution_disposition = CANONICAL_P04`; 1 populated D114 `security_identity` and 63 `NULL` `security_identity` imported before the `2026-11-15` P7 4,680-mapping regeneration; 1 contribution (`SAVED_NEW_BATCH`, all six migration-`004` provenance columns populated).
2. `PERSONAL-fa8ad7bc-efec-5562-cfbd-de362b782fa2` (`portfolio_name = "TEST"`, `created_at = 2026-11-12T10:44:57.629Z`, `current_revision = 2`): rev 1 `INITIAL` (2 `active = 1` holdings worth 889); rev 2 `REPLACE` (1 `active = 0` holding worth 500); all `source_broker = manual-personal`, `identity_status = UNRESOLVED`, `resolution_disposition = MANUAL_PERSONAL_ENTRY`, `security_identity = NULL`; 1 contribution (`1e55888fc4ad57343307c444cfda5d54fdd0755ad9d6590f350580ba56748466`, `amount = 500`) with all six migration-`004` columns `NULL`, as designed in `portfolio_store.ts` when `brokerImportProvenance` is absent.
- Kept in the active candidate set; `portfolio_name = "TEST"` and rev-2 `active = 0` are flagged for explicit Principal/PA disposition under D15/D16 — never inferred from the name.

**Other NULL patterns:** `NULL` `security_identity` is nullable under migration `005` and is **not** a D02 ownership-key / foreign-key blocker (technical design §13.7); 140 of 142 holding rows have `NULL` `security_identity` and downstream W04 / W08 / W11 security-level consumers remain constrained until separately re-qualified. Two contributions carry `NULL` migration-`004` provenance fields (expected pre-`004`/manual rows; recorded factually, never backfilled or inferred — D14).

### 3.3 Integrity, collisions and provenance (`Q07`–`Q14`)

- `Q11a` S1-vs-D02 `portfolio_id` collisions: 0; `Q11b` duplicate normalized symbols per revision: 0; `Q12a` orphan/inactive-parent memberships: 0; `Q12c` declared-vs-actual `holdings_count` mismatches: 0.
- Only blocker-unresolved record: the `DEFAULT_PORTFOLIO` `Q12b` current_revision/tombstone anomaly (severity BLOCKER, category `PORTFOLIO_CURRENT_REVISION_OR_TOMBSTONE_ANOMALY`) — confined to the excluded test-data portfolio.
- 14 non-inferential observations recorded (NULL `security_identity` groups, NULL `004` contribution provenance); no ownership inferred from portfolio names, broker names, file names, symbols, or company IDs; `Q09` never projects raw `file_name`.
- Restore receipts: 1 (`EXECUTED_OK`); audit events: 2 (`RESTORE` portfolio ×1, `local_principal_binding.provisioned` ×1); chain verified.

## 4. D5-T1–D5-T5 and D16 reconciliation

**D5 (`D5-T1`–`D5-T5`) acceptance** remains a separate, closed gate. The narrow 2026-11-16 Level E grant covered strictly read-only inspection only; it delivered the inventory evidence above but does not constitute acceptance. D5 stays **BLOCKED** pending separate PA acceptance of the verifier predicate and prescribed host evidence; inventory completion alone is insufficient.

**D16** (inventory scope, ownership proof, collision policy):
- The separately authorized read-only inventory was executed on the Windows host `2026-11-16` with a hashed manifest and pre/post integrity proof; actual schema, ledger, counts, keys, NULL patterns, integrity/FK results, collisions and orphans are now obtained (see §3).
- S1-vs-D02 collisions: 0; the sole blocker-unresolved record (`DEFAULT_PORTFOLIO` `Q12b`) is excluded test data, not a live D02 destination collision — there is no existing D02 destination (`owner-4dc756b3` portfolios: 0) to collide with.
- The D16 technical recommendation's batch-wide stop rule applies to any future migration batch: stop on any collision, orphan, unknown owner, ambiguous row, or affected restore receipt; no merge, overwrite, winner selection, or partial migration.
- Level C collision / stop policy: still **PENDING**; separate Level E migration authority: **NOT AUTHORIZED**.

No historical row is moved, aliased, re-keyed, merged, or exposed by this reconciliation. D15 (defer / keep separate) remains the consistent interim posture: live S1-owner historical portfolios exist (`DHAN_PORTFOLIO`, `PERSONAL-...TEST`) under `ipd-owner-ramki-personal`, and no ownership is inferred from their labels.

## 5. Exact remaining blockers

| Blocker | Evidence basis | Required to unblock |
|---|---|---|
| D5 acceptance (`D5-T1`–`D5-T5`) | Separate gate; read-only inventory evidence delivered but not accepted | Separate PA acceptance of verifier predicate + host evidence |
| D16 detailed schema & collision/stop policy approval | Inventory executed; Level C policy not yet disposed | Separate Level C approval |
| D15 final historical disposition (alias / re-key / defer) | 2 active S1-owner candidate portfolios obtained; no collisions | Separate PA disposition with operator intent evidence |
| D17 re-key scope / fingerprints / recovery manifest | Not selected; no D02 destination rows exist | Separate decision only if re-key is later required |
| D19 real recovery manifest / backup restore path | Not established | Separate approval |
| Implementation authority (Level D) | Not granted | Separate explicit Level D statement |
| Provisioning / migration / D6 (`IRR` integration) | Not authorized / not started | Separate Level E + D6 authority |

## 6. What was explicitly NOT done

No relationship, owner, provider, source, or portfolio row was created; no schema change, migration execution, `_migration_ledger` write, portfolio/holding/write, identity provisioning or reassignment, historical re-key, tombstone restoration, reset/replacement, or startup invoking migrations occurred; `DEFAULT_PORTFOLIO` was left untouched; no inference of ownership from names, brokers, files, symbols, or company IDs; no D5 acceptance and no D6 activity.

## 7. Next actions

1. **Separate review:** present this reconciliation and the returned evidence bundle (`d02-d5-d16-inventory-20261116T143819255Z-96672044`, archived under `evidence/d02-inventory-2026-11-16/windows-host/`) for separate Program Authority review; D5 acceptance remains a distinct decision.
2. **D15/D16 disposition:** PA to disposition `DEFAULT_PORTFOLIO` exclusion standing, `DHAN_PORTFOLIO`, and `PERSONAL-fa8ad7bc-efec-5562-cfbd-de362b782fa2` ("TEST", rev-2 `active = 0`) under explicit operator intent; preserve all recorded NULLs.
3. **Do not implement:** no D02 resolver, schema, source registry, links, or verifier implementation until Level C approval and a separate Level D implementation statement.
4. **Re-run only under separate authority:** any future Windows-host read-only re-inventory uses the pinned operator package/catalog (`2026-11-16.1`) with the same fail-closed preflight/postflight proof.

## 8. Linked records

- [`IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md`](IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md) — D5 tracker (updated with this reconciliation)
- [`IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md`](IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md) — decision register D01–D22 (updated with this reconciliation)
- [`IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md`](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md) — recorded approvals (D01–D03; narrow 2026-11-16 read-only D5/D16 inventory)
- [`IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md`](IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md) — pinned preflight, blocker report, and exact `Q01`–`Q14` catalog
- [`IPD-D02-D5-D16-WINDOWS-HOST-OPERATOR-PACKAGE-2026-11-16.md`](IPD-D02-D5-D16-WINDOWS-HOST-OPERATOR-PACKAGE-2026-11-16.md) — pinned operator execution package (live inventory status fields reflect execution completion)
- [`IPD-D02-D15-D19-LOCAL-SINGLE-USER-RECONCILIATION-2026-11-15.md`](IPD-D02-D15-D19-LOCAL-SINGLE-USER-RECONCILIATION-2026-11-15.md) — D15–D19 recommendations (unchanged; not PA dispositions)
- [`IPD-D02-OWNERSHIP-RELATIONSHIP-TECHNICAL-DESIGN-2026-11-15.md`](IPD-D02-OWNERSHIP-RELATIONSHIP-TECHNICAL-DESIGN-2026-11-15.md) — §10 D5 acceptance criteria, §13.7 NULL `security_identity` treatment, §§13.8–13.11 historical/inventory/re-key/rollback design
- [`src/persistence/binding.ts`](../../src/persistence/binding.ts) — active-binding/membership resolution and D02 holdings-domain fail-closed predicate
- [`evidence/d02-inventory-2026-11-16/sha256s.txt`](../../evidence/d02-inventory-2026-11-16/sha256s.txt) — published 5-line manifest
- [`evidence/d02-inventory-2026-11-16/README.md`](../../evidence/d02-inventory-2026-11-16/README.md) — evidence directory contents

**End of report.**
