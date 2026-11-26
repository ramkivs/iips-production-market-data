# IPD independent technical acceptance review — D02 ownership relationship design

**Review outcome: ACCEPTED WITH CONDITIONS.**

This is an independent IPD engineering review of the published [D02 Ownership Relationship Technical Design](IPD-D02-OWNERSHIP-RELATIONSHIP-TECHNICAL-DESIGN-2026-11-15.md) at source branch commit `aae2eb4dcd57d2f14b8a6b1c8feefd9529fed396`. It accepts the **architectural design direction and the document as a reviewable design baseline, subject to the conditions and unresolved decisions below**. It does **not** approve the detailed schema, authorize implementation, provision identities/owners, approve historical data movement, pass D5, or start D6.

**Product ownership: APPROVED. Architectural direction: APPROVED. Detailed schema: AWAITING APPROVAL. Implementation authority: NOT GRANTED. Operational provisioning: NOT AUTHORIZED. D5: BLOCKED. D6: NOT STARTED.**

## 1. Scope and independent verification performed

Reviewed the remote IPD design, decision and tracker documents, and current IPD implementation at the branch tip identified above. Inspected the current binding resolver, migration 003, portfolio schema/migrations 001/004/006, store owner predicates, local single-user authorization, broker import path, manual portfolio mapper, and Direct P1 DP-V8 verifier. This review did not rely solely on the proposal's own claims.

The source confirms:

- S1's active membership carries tenant `ipd-personal-local` and owner `ipd-owner-ramki-personal`; its principal, binding and membership values are established separately by the S1 determination.
- `resolveActiveHoldingsBinding` currently accepts only a sole active membership whose owner is `owner-4dc756b3` and tenant is `ipd-personal-local`. The S1 tuple therefore correctly fails the current D02 resolver.
- Migration 003 has global partial-unique indexes for at most one ACTIVE binding and one ACTIVE membership, a membership-to-binding FK, and no context/role column.
- `localSingleUserAuthorization.ts` resolves the generic S1 membership and compares its owner/tenant directly to the requested target. Broker and manual write paths need the relationship-aware authorization the design proposes.
- Portfolio rows are keyed by `(canonical_owner_id, portfolio_id)` and carry tenant; revisions, holdings, contributions and restore receipts carry owner-scoped foreign keys. Portfolio rows have no source registry today. Holdings retain `source_broker`; migration 004 adds import/contribution provenance and deliberately leaves historical values NULL.
- Direct P1 DP-V8 checks the generic active binding against the S1 tuple. It does not call the D02 holdings resolver.

No database was opened. No code, migration, identity, environment, runtime, D5 or D6 operation was changed or run.

## 2. Verdict and acceptance boundary

### ACCEPTED WITH CONDITIONS

The architectural separation is sound for the approved local single-user scope: retain the existing S1 principal/binding/membership as the personal identity context, and resolve a separate explicit relationship to D02 overall owner `owner-4dc756b3`. This avoids rewriting S1 or creating a second broker-specific identity, and it gives D02 operations a distinct portfolio-owner context. The design correctly keeps current behavior fail-closed until a relationship implementation exists.

The detailed schema is **not accepted for implementation as written**. The draft is appropriately labelled unapproved, but several critical choices remain open or underspecified, especially source-record cardinality/linkage, read transaction boundaries, owner-registry consistency, and historical-row migration coverage. The conditions in §8 must be resolved in a revised, authority-approved schema before implementation authority is considered.

This review verdict is not a Program Authority act. It cannot supply approvals that the design explicitly reserves to the Program Authority.

## 3. Verification against required ownership examples

The design's intended post-approval mapping is one existing S1 personal identity → one D02 overall portfolio owner (`owner-4dc756b3`, tenant `ipd-personal-local`). Under that resolved D02 context, the following example is coherent:

| Portfolio | Distinct portfolio identity | Owner after approved implementation | Source evidence retained |
|---|---|---|---|
| Dhan | `portfolio-dhan-01` (illustrative) | `owner-4dc756b3` | Dhan source record; each import's file, content/lineage digest and timestamp; per-holding broker provenance. |
| Zerodha | `portfolio-zerodha-01` (illustrative) | `owner-4dc756b3` | Separate Zerodha source record and contribution/holding provenance. |
| Manual Portfolio A | `portfolio-manual-a` (illustrative) | `owner-4dc756b3` | Manual source record, manual-entry disposition, own holdings and revisions. |
| Manual Portfolio B | `portfolio-manual-b` (illustrative) | `owner-4dc756b3` | Independent ID/history and manual provenance; not merged into A. |

This is a design example, not evidence of provisioned rows. One authenticated personal identity may list all four while portfolio ID, revision history, holdings, broker/manual provenance and contribution lineage remain distinct. Intelligence aggregation can be a derived projection across the four, but must retain portfolio/source drill-down and uncertainty; it must not rewrite or collapse source records.

## 4. Requirement-by-requirement findings

| Review area | Finding | Acceptance condition / risk |
|---|---|---|
| Existing S1 and Direct P1 | **Pass at architecture level.** The proposal leaves the S1 tuple and generic resolver/DP-V8 unchanged and proposes a separate D02 context. | New D02 result types/call sites must not redefine `ActiveOwner` globally or alter the generic Direct P1 predicate. Regression tests required. |
| D02 overall ownership | **Pass at direction level.** All four source examples use one owner and tenant, with independent portfolio IDs. | Actual owner/link/source rows remain unprovisioned; detailed schema remains pending. |
| Relationship ID and lifecycle | **Partially specified.** UUIDv4, ACTIVE/REVOKED, retained revocation history and no silent reactivation are a coherent proposal. | DDL stores `TEXT` without a UUID format check; approved generator, collision/error behavior, actor/authority fields and re-establishment procedure remain to be fixed. Do not assign an ID before authorization. |
| Relationship foreign keys | **Promising, conditional.** Composite membership/tenant FK and owner-registry FK are proposed; the parent composite unique index is identified. | Validate FK creation/order and supported SQLite behavior with `foreign_keys=ON`; specify whether `authority_record_ref` is a free-form immutable reference or constrained catalogue. Active parent/relationship state cannot be enforced by FKs and needs resolver checks. |
| Uniqueness | **Conditionally suitable for the current one-user store.** Partial unique indexes enforce at most one active relationship per membership and per overall owner. | Explicitly limit to the single-user deployment. Multi-principal/multi-device use requires a new model. The database still allows an ACTIVE relationship whose owner-registry row is REVOKED; resolver and write transaction must refuse it. |
| D02 resolver | **Correct direction, incomplete execution contract.** It validates S1 plus one active owner relationship and distinguishes membership owner from portfolio owner. | Specify an in-transaction resolver shared by write authorization and mutation. For reads, relation resolution and owner-scoped query must share one read snapshot; the generic resolver currently owns and closes its own transaction, so it cannot simply be called and followed by a separate query without a race window. |
| Authorization checks | **Correct direction, major integration surface.** Server-owned environment switch and existing scope/default-deny behavior are preserved in principle. | Specify the exact D02 context passed through dispatcher, `DurablePortfolioStorePort`, broker consumer and manual CRUD. Every list/get/history/contribution/restore/delete/import/write path must derive—not accept—the owner. Retain Gate 4/5 default-deny. |
| Portfolio source records | **Not yet sufficiently specified.** Proposed records can represent broker/manual origins without using source as owner. Existing row-level evidence must remain. | `provider_code` permits empty/arbitrary values; normalized account-reference rules and active-source uniqueness are only described as “likely”; multi-source policy is open. There is no FK from a source record to an individual holding or contribution, so cross-row provenance consistency would be application-enforced unless further relations are designed. Decide whether a root source table is needed or source should be derived from current holding/contribution evidence. |
| Cross-user isolation | **Pass only for the stated local single-user scope.** One active binding/membership and one owner relationship prevent selecting a different principal in this database; owner/tenant/portfolio filters support isolation. | This is not a multi-user security design. Tests must verify foreign owner/tenant/portfolio refusals and non-disclosure; no hosted/multi-user claim is supported. |
| Missing/duplicate/revoked/conflicting relations | **Fail-closed behavior is specified.** Unique indexes plus resolver cardinality/status checks are complementary and necessary. | Tests must include corrupted/legacy duplicate fixtures despite indexes, revoked owner registry with active link, cross-tenant link, wrong membership attachment, concurrent revocation and invalid owner relationship. All refuse before store effect. |
| Historical portfolio/broker records | **Safe default stated; disposition unresolved.** No automatic backfill/re-key and historical NULL provenance stays unknown. | The proposed re-key list omits the newly proposed `portfolio_source_records` table. If introduced, all source rows must be included in inventory, collision checks, copy/re-key, checksum and rollback plan. Define whether existing S1-owner rows remain separate, use an approved alias, or are re-keyed; until then full historical D02 listing is not demonstrated. |
| Transaction boundary | **Writes are directionally sound; reads need precision.** `BEGIN IMMEDIATE` can serialize relationship validation with mutations and revocation. | Define same-connection transaction ownership, nested transaction rules, rollback-on-error, and read snapshot boundaries. Source/owner row creation must be atomic with portfolio creation/import. |
| Migration and rollback | **Safe principles, incomplete executable strategy.** New append-only migration, immutable old migrations, disposable tests, preflight and backup are right. | Schema migration must not seed rows. Owner-key movement is separate data migration; specify exact affected tables, FK-safe order, conflict handling and full restore-receipt/source-record coverage. Post-commit reversal must be prohibited after conflicting/new writes or use verified backup. |
| Existing record protection | **Pass as a no-change rule.** Existing S1 and broker evidence are not overwritten by the proposed link. | Future re-key, if selected, is a separately authorized data operation; preserve original IDs/revisions/digests and append audit evidence. Never edit the historical hash chain. |

## 5. Specific schema and implementation risks found

1. **No FK from the owner registry to `portfolios`.** The proposed source table has a composite FK to a portfolio, but `portfolios` themselves do not reference `portfolio_owner_registry`. A rogue/internal caller that bypasses D02 context could still insert an arbitrary owner through current low-level store methods. Decide whether the new access facade is the complete write boundary or whether a compatible schema-level owner FK is required.
2. **Status consistency is application-enforced.** A foreign key proves row existence, not ACTIVE status. The owner registry may be REVOKED while a relationship is ACTIVE. The new resolver must join/check all row statuses every time, and mutations that change status must use the same transaction discipline.
3. **Source identity/cardinality is incomplete.** The `portfolio_source_records` DDL allows duplicate active source origins and unconstrained empty provider values; its active uniqueness is not final. A `source_account_ref` is nullable and “normalized” rules are not defined. `source_record_id` also needs explicit SQLite-safe NOT NULL/format constraints. Provenance digests alone do not bind holdings/contributions to a source record.
4. **Read race if resolution and data query split.** The current generic resolver begins/commits a transaction. The design must define a new read API or outer transaction so revocation cannot occur between resolving the relationship and reading portfolio rows.
5. **Historical re-key omissions.** If source records exist, they are missing from the listed owner-key re-key set. Also validate all actual tables and restore receipts against current migration ledger before any future move; no operational DB was inspected in this review.
6. **SQLite text-primary-key nullability and identifier constraints.** The proposed `relationship_id TEXT PRIMARY KEY` and `source_record_id TEXT PRIMARY KEY` omit explicit `NOT NULL`. In ordinary SQLite rowid tables, a non-`INTEGER PRIMARY KEY` may accept NULL unless the table is `STRICT`/`WITHOUT ROWID` or the column explicitly says `NOT NULL`; that can undermine an opaque-ID guarantee. Add explicit `NOT NULL` (or a supported stricter table form), define UUIDv4 validation/generation and collision handling, and test NULL/empty/duplicate IDs. `authority_record_ref` is also not constrained to a non-empty immutable reference.
7. **Uniqueness overconstrains future models by design.** One active membership per owner matches today's local one-user scope, but would reject multiple principal/device memberships. Document deployment scope in schema and fail closed rather than relaxing indexes ad hoc.
8. **Portfolio source scope can drift from row evidence.** A root source record could say Dhan while holdings/contributions say Zerodha/manual. Define whether mixed-source portfolios are supported, and if so require explicit matching source records/contributions; otherwise reject source mismatch.

## 6. Unresolved decisions (complete closure list)

The following must be resolved in the detailed design before approval/implementation:

1. **Relationship target and schema subject:** confirm exact FK subject is the established S1 membership, while still validating binding/principal/tenant/S1 owner at resolution. The architecture approves the identity relationship, not every table/column choice.
2. **Owner registry lifecycle:** whether owner registry rows can be revoked, who/what can revoke them, and how active links are handled; exact D02 owner/tenant validation and uniqueness across tenant boundaries.
3. **Relationship identifier and audit:** explicit NOT NULL/UUIDv4 validation and generation, collision handling, immutable non-empty authority reference format, actor/reason fields, and audit event shape.
4. **Active uniqueness scope:** retain one-to-one indexes for local single-user use; explicitly document what happens if another principal/device is ever needed.
5. **Source taxonomy and source keys:** approved provider-code enum/extension policy; non-empty/normalized account references; source-record cardinality and uniqueness; whether manual portfolios can be hybrid; how each source record is linked to the relevant holdings/contributions or how consistency is validated.
6. **Resolver API and transaction boundaries:** exact read/write transaction entrypoints, nested transaction behavior, complete D02 call-site inventory, sanitized refusal classes and proof that owner/relationship cannot come from IPC/request data.
7. **Low-level write guard:** whether direct `DurablePortfolioStore` calls are reachable in production and how the relationship-aware facade prevents arbitrary owner writes; whether a schema FK from portfolios to owner registry is needed.
8. **Historical rows:** choose defer/separate, explicit alias/read projection, or separately authorized re-key. If re-key, include every owner-key table including restore receipts and any future source-record table, exact collision rules, pre/post manifests, audit handling and rollback cutoff.
9. **Schema migration mechanics:** supported SQLite version, migration ordering, FK enablement, composite parent indexes, checksums and recovery from partial migration; schema migration must not provision rows.
10. **Implementation, operational and D5 evidence:** separate implementation authority, provisioning procedure, host-specific D5 acceptance evidence, and D6 authority remain outstanding. This review grants none.

## 7. Conditions for a final ACCEPTED design

Before the detailed schema is accepted as implementation-ready, revise and obtain the applicable Program Authority approval for a design that:

- closes decisions 1–9 above without weakening S1, source provenance, owner isolation, or current fail-closed behavior;
- clearly distinguishes principal membership owner from D02 portfolio owner in types and SQL call paths;
- binds relationship resolution and portfolio access in the same consistent transaction/snapshot;
- makes source provenance consistency and multi-source behavior testable;
- inventories historical records without access in this task and gives a complete separately authorized migration/rollback plan;
- includes targeted tests for relationship cardinality/status, tenant/owner mismatch, revocation races, four independent portfolios, source mismatch, Direct P1 regression and zero-effect refusals.

Passing these conditions would accept the detailed schema design only. It would not grant implementation or provisioning authority, pass D5, or authorize D6.

## 8. Final status

- **Product ownership:** APPROVED.
- **Architectural direction:** APPROVED.
- **Independent design review:** **ACCEPTED WITH CONDITIONS** as a design baseline only.
- **Detailed schema:** AWAITING APPROVAL; not implementation-ready.
- **Implementation authority:** NOT GRANTED.
- **Operational provisioning:** NOT AUTHORIZED.
- **D5:** BLOCKED.
- **D6:** NOT STARTED.

No code, migration, identity, relationship row, database, environment, runtime, IRR artifact, D5 verifier, or D6 operation was changed or executed during this review.
