# IPD S1-to-D02 Ownership Relationship Specification

**Status: TECHNICAL SPECIFICATION ONLY — NOT APPROVED FOR IMPLEMENTATION.** This document
specifies a coherent S1-to-D02 ownership relationship for the approved architectural direction
(preserve S1 identity, relate it to D02 owner `owner-4dc756b3`). It distinguishes existing
verified behavior from proposed changes. No relationship row, owner-registry row, schema
migration, or database mutation is authorized by this document. Implementation requires
separate Program Authority Level C schema approval and Level D implementation authority.

**Source of truth:** This specification is derived from the approved architecture direction,
the revised technical design (§13), the independent acceptance review, and the current
implementation in `src/persistence/binding.ts`, `src/persistence/portfolio_store.ts`,
`src/ipc/protocol.ts`, `src/ipc/dispatch.ts`, and `src/persistence/brokerImportPersistence.ts`.

---

## 1. Approved direction (existing, verified behavior)

| Item | Value | Status | Source |
|------|-------|--------|--------|
| Overall portfolio owner | `owner-4dc756b3` | APPROVED (Level A) | IPD-D02 decision package |
| Tenant | `ipd-personal-local` | APPROVED (Level A) | IPD-D02 decision package |
| S1 principal label | `ramki-personal-local` | ESTABLISHED | S1 identity determination |
| S1 binding ID | `c5808abaffd072d6401ce63ad86c6ac0` | ESTABLISHED | S1 identity determination |
| S1 membership ID | `d25dcc5370100b00766efc5166f65cf3` | ESTABLISHED | S1 identity determination |
| S1 canonical owner | `ipd-owner-ramki-personal` | ESTABLISHED | S1 identity determination |
| S1 binding/membership | Unchanged | PRESERVED | Level B architecture direction |
| Direct P1 generic resolver | Unchanged | PRESERVED | Current implementation |
| D02 owner pair check | `owner-4dc756b3` / `ipd-personal-local` | Prospective (fail-closed) | `binding.ts` `resolveActiveHoldingsBinding` |
| Local single-user scope | One active binding/membership | ENFORCED | Migration 003 partial unique indexes |
| Gate 4 / Gate 5 | NOT MET on governed path | ENFORCED | `evaluatePortSaveGuard` |
| `IIPS_LOCAL_PERSONAL_USE=1` | Server env only | AUTHORIZED | Local personal-use persistence |
| v2 snapshot contract | Reads/refusals only; writes WRITE_NOT_AUTHORIZED | ENFORCED | `dispatch.ts`, `protocol.ts` |

**Existing verified behavior that must remain byte-for-byte unchanged:**
- S1 principal, binding, membership, tenant, and canonical owner values
- `resolveActiveBinding` generic resolver behavior for Direct P1
- `DurablePortfolioStore` owner-scoped read/write methods accepting `OwnerRef`
- `evaluatePortSaveGuard` default-deny with no context
- Gate 4/5 refusal reasons on the governed path
- v2 protocol frame validation and C7 caller-authority refusal
- One-request-per-connection settlement policy
- Migration 003 partial unique indexes (single active binding/membership)

---

## 2. Proposed relationship (not approved, not provisioned)

### 2.1 Relationship identity

The S1-to-D02 relationship is a separate explicit ownership link. It does **not** create a new
D02 principal, binding, or membership. It reuses the existing S1 identity as the FK subject and
adds a relationship row pointing to the D02 overall owner.

| Field | Value | Notes |
|-------|-------|-------|
| Relationship ID | Opaque UUIDv4 | Generated only by authorized provisioning; never derived |
| Membership ID (FK subject) | `d25dcc5370100b00766efc5166f65cf3` | Existing S1 membership |
| Membership tenant | `ipd-personal-local` | Existing S1 tenant |
| Owner tenant | `ipd-personal-local` | Same as membership tenant |
| Portfolio owner ID | `owner-4dc756b3` | D02 overall owner |
| Relationship type | `OVERALL_PERSONAL_PORTFOLIO_OWNER` | Closed vocabulary |
| Authority record ref | IPD record path + content digest | Traceability, not authorization |
| Status | `ACTIVE` or `REVOKED` | Revocation is terminal |

### 2.2 Cardinality and uniqueness

- **One active relationship per membership/type:** Partial unique index on
  `(membership_id, relationship_type) WHERE status = 'ACTIVE'`
- **One active membership per owner/tenant/type:** Partial unique index on
  `(owner_tenant_id, portfolio_owner_id, relationship_type) WHERE status = 'ACTIVE'`
- **Historical REVOKED rows:** Unlimited; retained as history, never silently reactivated
- **Scope:** Local single-user only; multi-principal/multi-device requires a new model

### 2.3 Owner registry

| Field | Value | Notes |
|-------|-------|-------|
| Tenant ID | `ipd-personal-local` | PK component |
| Portfolio owner ID | `owner-4dc756b3` | PK component |
| Owner kind | `PERSONAL_OVERALL` | CHECK constraint |
| Status | `ACTIVE` / `REVOKED` | Revocation is terminal |
| Revocation effect | Terminal for that identity; active relationships revoked atomically | One transaction |

### 2.4 Resolver and authorization behavior

**Resolution flow (fail-closed at every step):**

1. Resolve the sole ACTIVE S1 binding and membership via existing `resolveActiveBinding`
   checks (no cache, `BEGIN IMMEDIATE` serialization)
2. Validate the exact approved S1 tuple: binding ID, principal label, membership ID,
   tenant, and S1 canonical owner — all must match the approved values
3. Select exactly one ACTIVE `personal_identity_owner_relationships` row for the
   membership + `OVERALL_PERSONAL_PORTFOLIO_OWNER` type
4. Validate the `portfolio_owner_registry` row is ACTIVE with the exact D02 owner
   (`owner-4dc756b3`) on `ipd-personal-local`
5. Return a distinct `ResolvedD02PortfolioAccess` context with both
   `membershipOwnerId` (S1 owner) and `portfolioOwnerId` (D02 owner) kept strictly distinct

**Fail-closed conditions:** absent binding/membership, multiple binding/membership,
S1 tuple mismatch, no relationship, revoked relationship, inactive owner registry,
wrong owner/tenant, wrong relationship type, multiple active relationships,
cross-tenant link, detached membership.

**No caller-supplied owner or relationship ID:** The D02 owner comes only from validated
database rows. IPC/request data can never select the owner.

### 2.5 Transaction boundaries

- **Write mode:** One `BEGIN IMMEDIATE` transaction from relationship resolution through
  authorization and all portfolio/source writes; commit only after all checks succeed;
  any error rolls back the whole operation
- **Read mode:** Consistent read snapshot; relationship resolution and owner-scoped query
  share the same connection and snapshot
- **Nested operations:** Reuse the existing transaction/context; savepoints only for
  documented local atomic sub-operations; cannot commit/rollback the outer transaction;
  no second connection
- **Revocation/write race:** Revocation committed first causes refusal; otherwise write
  commits under validated active relation; atomic and auditable

### 2.6 Persistence and transaction semantics

| Aspect | Specification |
|--------|--------------|
| Schema migration | Append-only; parent indexes before FKs; `foreign_keys=ON`; no seed rows |
| Relationship table | `personal_identity_owner_relationships` with composite FKs, RESTRICT deletes |
| Owner registry table | `portfolio_owner_registry` with tenant-scoped PK |
| Source provider catalog | `portfolio_source_provider_catalog` with exact uppercase ASCII codes |
| Source records | `portfolio_source_records` with composite FK to portfolios and catalog |
| Source links | `portfolio_holding_source_links`, `portfolio_contribution_source_links` |
| UUID format | Canonical lowercase UUIDv4 with CHECK constraint |
| Timestamps | Canonical UTC ISO-8601 instants |
| `authority_record_ref` | Non-empty, canonical IPD record path + content digest |

### 2.7 Historical record treatment

**No re-key, no backfill, no inference.** The following is provisional pending PA decision
(D15):

| Table | Treatment |
|-------|-----------|
| `local_principal_bindings` | Never re-key or alter S1 |
| `local_principal_memberships` | Never re-key or alter S1; relationship references this row |
| `portfolios` | Candidate owner-key move only after PA decision and preflight inventory |
| `portfolio_revisions` | Move in same batch as parent portfolios |
| `portfolio_holdings` | Move without changing holding identity/provenance; source links move too |
| `portfolio_contributions` | Move without imputing NULLs; contribution-source links move too |
| `portfolio_restore_receipts` | Move with parent; recompute owner-dependent fingerprint; preserve old/new pair |
| `audit_events` | Do not rewrite; append re-key event referencing manifest digest |
| `_migration_ledger` | Do not modify; never delete/rewind |

**Collision policy:** Any destination `(owner-4dc756b3, portfolio_id)` collision,
duplicate source key, orphan/invalid FK, malformed owner/tenant, ambiguous source link,
or non-invertible restore receipt is a batch-wide STOP — no merge, overwrite, or partial
migration.

### 2.8 Migration and rollback requirements

- **Pre-migration:** Read-only inventory with pre/post SHA-256 manifests, `foreign_key_check`,
  collision detection, and ownership proof
- **Migration:** One `BEGIN IMMEDIATE` transaction with `PRAGMA defer_foreign_keys=ON`;
  validate destination keys inside the transaction; update owner columns in FK-safe order;
  run row-count/digest checks and `foreign_key_check` before commit
- **Rollback before commit:** Atomic transaction rollback on any error or mismatch
- **Rollback after commit:** Only under separately approved recovery action if no conflicting
  D02 writes exist; otherwise restore verified pre-migration backup
- **Audit:** Append-only; never delete or rewrite historical events or migration ledger

### 2.9 Required verification evidence

| Evidence | Description | Status |
|----------|-------------|--------|
| Schema migration on disposable DB | Fresh and current-schema migration passes `foreign_key_check` | Not yet performed |
| UUIDv4 CHECK syntax | Validated against supported SQLite build | Not yet validated |
| Partial unique indexes | Reject duplicate ACTIVE relationship/link | Not yet tested |
| Resolver fail-closed matrix | All 10 fail-closed conditions tested | Partially tested (synthetic, no relationship tables) |
| Direct P1 regression | S1 tuple unchanged with relationship absent/active/revoked | Not yet tested |
| Four portfolio independence | Dhan/Zerodha/Manual A/B distinct under one D02 owner | Not yet tested (no relationship rows) |
| Read-only inventory | Q01–Q14 executed on Windows host; pre/post byte-identical | EXECUTED 2026-11-16 |
| D5-T1 (approved mapping) | D01–D03 APPROVED; S1 tuple confirmed | PASS |
| D5-T2 (approved representation) | Level C schema approval | FAIL (pending PA) |
| D5-T3 (read-only verifier tests) | Implemented verifier with holdings-specific predicate | FAIL (not implemented) |
| D5-T4 (prescribed host evidence) | Read-only Windows-host inventory with integrity proof | PASS |
| D5-T5 (separate PA acceptance) | PA acceptance of verifier predicate and host evidence | PENDING |

---

## 3. Existing verified behavior vs. proposed changes

| Element | Existing (verified) | Proposed (not approved) |
|---------|---------------------|-------------------------|
| S1 identity | Binding `c5808...`, membership `d25dc...`, owner `ipd-owner-ramki-personal` | Unchanged |
| D02 owner | `owner-4dc756b3` / `ipd-personal-local` (prospective check only) | Same, via relationship |
| Relationship | Does not exist | Separate explicit link (not provisioned) |
| Owner registry | Does not exist | `portfolio_owner_registry` (not created) |
| Binding resolver | `resolveActiveBinding` returns S1 owner | Unchanged for Direct P1 |
| Holdings resolver | `resolveActiveHoldingsBinding` checks D02 pair directly | New `resolveD02PortfolioAccess` via relationship |
| D02 access | Fail-closed (no D02 owner pair match) | Fail-closed (no relationship provisioned) |
| Source catalog | Does not exist | `portfolio_source_provider_catalog` (not created) |
| Source records | Does not exist | `portfolio_source_records` + link tables (not created) |
| Historical re-key | None | Provisional only, pending PA decision |

---

## 4. Authority boundaries (preserved)

- **D01–D03:** APPROVED (identity subject, no-new-identity, tenant-scoped FKs)
- **D04–D20:** PENDING (Level C schema approval required)
- **D21:** NOT GRANTED (implementation authority for new relationship)
- **D22:** NOT AUTHORIZED (operational provisioning/migration)
- **Level C:** PENDING (detailed schema)
- **Level D:** NOT GRANTED (implementation)
- **Level E:** NARROW READ-ONLY INVENTORY ONLY (2026-11-16); all mutation NOT AUTHORIZED
- **D5:** BLOCKED (T2/T3 FAIL, T5 PENDING)
- **D6:** NOT STARTED

This specification does not override any of these boundaries. No code path in the current
implementation writes to `personal_identity_owner_relationships` or
`portfolio_owner_registry`. The new `resolveD02PortfolioAccess` function in
`src/persistence/binding.ts` fails closed because those tables do not exist.

---

## 5. Open decisions requiring Program Authority

The following Level C decisions are required before any implementation:

1. **D04:** Confirm one-to-one active uniqueness indexes for local single-user scope
2. **D05:** Confirm terminal revocation behavior and atomic relationship revocation
3. **D06:** Confirm UUIDv4 ID format, authority reference format, audit event fields
4. **D07:** Choose facade-vs-schema-FK for the non-bypassable authorization boundary
5. **D08:** Confirm D02 resolver output shape and transaction behavior
6. **D09:** Confirm same-connection transaction ownership and nested operation rules
7. **D10–D12:** Confirm provider catalog, account reference model, source cardinality
8. **D13:** Confirm root source registry vs. derived evidence; link table requirements
9. **D14:** Confirm NULL/unlinked historical provenance treatment (no backfill)
10. **D15:** Choose historical disposition: defer / alias / re-key
11. **D16:** Confirm collision/stop policy for migration preflight
12. **D17–D19:** Only if re-key is selected; require separate Level E authority
13. **D20:** Confirm local single-user scope limitation
14. **D21:** Issue separate Level D implementation authority after Level C approval
15. **D22:** Issue separate Level E provisioning/migration authority for each named operation
