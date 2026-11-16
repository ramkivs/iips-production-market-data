# IPD detailed technical design proposal — S1 identity to D02 portfolio ownership

**Status: DETAILED SCHEMA PROPOSAL — AWAITING APPROVAL.** The architectural direction is approved by [IPD-D02-OWNERSHIP-ARCHITECTURE-DECISION-2026-11-15](IPD-D02-OWNERSHIP-ARCHITECTURE-DECISION-2026-11-15.md). This document specifies a candidate implementation contract, not approved DDL, an implementation instruction, provisioning authority, D5 acceptance, or D6 authorization.

| Required status | Current status |
|---|---|
| Product ownership | **APPROVED** |
| Architectural direction | **APPROVED** |
| Detailed schema | **AWAITING APPROVAL** |
| Implementation authority | **NOT GRANTED** |
| Operational provisioning | **NOT AUTHORIZED** |
| D5 | **BLOCKED** |
| D6 | **NOT STARTED** |

## 1. Purpose and boundaries

Translate the approved architectural direction—preserve the existing S1 identity/binding/membership and relate that identity to D02 owner `owner-4dc756b3`—into a detailed schema, resolver and test proposal. The schema is additive and contextual: a local-principal membership proves the personal identity; a separate ownership relationship supplies the overall portfolio owner. The D02 owner is not copied into, substituted for, or derived from S1's membership owner.

No code or migration is changed here. No database was opened. No ownership row or owner-registry row is inserted. All SQL below is **illustrative, unapproved pseudocode** requiring review against the supported SQLite version and migration ledger. No implementation or operational action is authorized.

## 2. Approved mapping direction and fixed identifiers

The architectural mapping direction connects the existing S1 identity to D02 overall owner. The unchanged S1 identity is:

| Field | Current approved value |
|---|---|
| principal label | `ramki-personal-local` |
| tenant | `ipd-personal-local` |
| S1 canonical owner | `ipd-owner-ramki-personal` |
| binding ID | `c5808abaffd072d6401ce63ad86c6ac0` |
| membership ID | `d25dcc5370100b00766efc5166f65cf3` |
| D02 portfolio owner | `owner-4dc756b3` |

The effective S1 value decision is `IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md`. The approved architectural direction comes from the Program Authority decision record linked above. The relationship's **future** `relationship_id` is deliberately not assigned. No separate D02 principal label, D02 binding ID, or D02 membership ID is proposed: the direction preserves and reuses the S1 identity and adds a separate ownership relation.

## 3. Proposed data model

### 3.1 Owner registry

Candidate `portfolio_owner_registry` catalogues owner identities that can be targets of a personal portfolio relationship. It is not an authentication table and does not create an owner by itself.

```sql
CREATE TABLE portfolio_owner_registry (
  tenant_id          TEXT NOT NULL,
  portfolio_owner_id TEXT NOT NULL,
  owner_kind         TEXT NOT NULL CHECK (owner_kind = 'PERSONAL_OVERALL'),
  status             TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
  created_at         TEXT NOT NULL,
  revoked_at         TEXT,
  PRIMARY KEY (tenant_id, portfolio_owner_id),
  CHECK ((status = 'ACTIVE' AND revoked_at IS NULL) OR
         (status = 'REVOKED' AND revoked_at IS NOT NULL))
);
```

The future approved owner row would name `(ipd-personal-local, owner-4dc756b3)`. This is a schema example, not a row insert. Only applicable later authority may provision it.

### 3.2 Principal-to-owner relationship

Candidate `personal_identity_owner_relationships` links one existing local-principal membership to a portfolio owner. Keep the S1 membership row and its `canonical_owner_id` unchanged.

```sql
-- Parent-key support for tenant-safe composite membership FK.
CREATE UNIQUE INDEX uq_membership_id_tenant
  ON local_principal_memberships (membership_id, tenant_id);

CREATE TABLE personal_identity_owner_relationships (
  relationship_id       TEXT PRIMARY KEY,
  membership_id         TEXT NOT NULL,
  membership_tenant_id  TEXT NOT NULL,
  owner_tenant_id       TEXT NOT NULL,
  portfolio_owner_id    TEXT NOT NULL,
  relationship_type     TEXT NOT NULL
    CHECK (relationship_type = 'OVERALL_PERSONAL_PORTFOLIO_OWNER'),
  status                TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
  authority_record_ref  TEXT NOT NULL,
  created_at            TEXT NOT NULL,
  revoked_at            TEXT,
  CHECK (membership_tenant_id = owner_tenant_id),
  CHECK ((status = 'ACTIVE' AND revoked_at IS NULL) OR
         (status = 'REVOKED' AND revoked_at IS NOT NULL)),
  FOREIGN KEY (membership_id, membership_tenant_id)
    REFERENCES local_principal_memberships (membership_id, tenant_id),
  FOREIGN KEY (owner_tenant_id, portfolio_owner_id)
    REFERENCES portfolio_owner_registry (tenant_id, portfolio_owner_id)
);

CREATE UNIQUE INDEX uq_active_relationship_per_membership
  ON personal_identity_owner_relationships (membership_id, relationship_type)
  WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX uq_active_membership_per_overall_owner
  ON personal_identity_owner_relationships
     (owner_tenant_id, portfolio_owner_id, relationship_type)
  WHERE status = 'ACTIVE';
```

**Identifier specification:** `relationship_id` is an opaque UUIDv4 generated by a later authorized provisioning transaction. It is not a hash, formula, S1 ID, owner ID, principal label, or value to calculate in this task. Revocation preserves the row and ID; a later re-establishment, if separately authorized, creates a new ID and a new audit event rather than silently reactivating history. `authority_record_ref` identifies the approving IPD record; it is not authority by itself.

**Uniqueness scope:** the two partial unique indexes intentionally enforce a one-to-one active relationship for this single-user personal environment: a membership cannot have two active overall-owner links, and one overall owner cannot have two active memberships. If a future approved environment supports multiple principals/devices per owner, this uniqueness policy must be reconsidered by authority; do not weaken it implicitly.

**Foreign-key note:** migration 003 makes `membership_id` a primary key, but the composite `(membership_id, tenant_id)` parent key needs an explicit unique index for SQLite's composite FK. Membership and relationship ACTIVE status cannot be enforced through an FK; the resolver must validate both in one transaction. Relationship insert/revoke also appends to the existing audit chain; audit event details include relationship ID, membership ID, owner/tenant, authority reference and action, without credentials/secrets.

### 3.3 Portfolio ownership and source records

Existing `portfolios` are keyed by `(canonical_owner_id, portfolio_id)` and carry `tenant_id`; D02 rows use `canonical_owner_id=owner-4dc756b3` and tenant `ipd-personal-local`. Portfolio ID remains unique within the owner and is not calculated from broker or account identifiers.

Candidate `portfolio_source_records` preserves portfolio-level origin without putting the source in the owner or portfolio ID. It allows multiple source records for a portfolio only where a future approved hybrid/import workflow needs them; each holding and contribution retains its own source details.

```sql
-- Parent key for a tenant-safe portfolio source FK; portfolios' existing
-- (canonical_owner_id, portfolio_id) primary key remains unchanged.
CREATE UNIQUE INDEX uq_portfolio_tenant_owner_id
  ON portfolios (tenant_id, canonical_owner_id, portfolio_id);

CREATE TABLE portfolio_source_records (
  source_record_id    TEXT PRIMARY KEY,
  tenant_id           TEXT NOT NULL,
  canonical_owner_id  TEXT NOT NULL,
  portfolio_id        TEXT NOT NULL,
  source_kind         TEXT NOT NULL CHECK (source_kind IN ('BROKER', 'MANUAL')),
  provider_code       TEXT NOT NULL,
  source_account_ref  TEXT,
  provenance_digest   TEXT,
  status              TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
  created_at          TEXT NOT NULL,
  revoked_at          TEXT,
  CHECK ((source_kind = 'MANUAL' AND provider_code = 'MANUAL_PERSONAL') OR
         (source_kind = 'BROKER' AND provider_code <> 'MANUAL_PERSONAL')),
  CHECK ((status = 'ACTIVE' AND revoked_at IS NULL) OR
         (status = 'REVOKED' AND revoked_at IS NOT NULL)),
  FOREIGN KEY (tenant_id, canonical_owner_id, portfolio_id)
    REFERENCES portfolios (tenant_id, canonical_owner_id, portfolio_id)
);
```

A source record ID is also opaque and generated only during authorized portfolio creation/import; no source ID is created here. Store only an opaque source-account reference, never credentials or access tokens. Provider codes include Dhan, Zerodha, other supported brokers, and `MANUAL_PERSONAL`. Proposed active-source uniqueness needs final product/schema approval: likely unique on `(tenant_id, canonical_owner_id, portfolio_id, source_kind, provider_code, normalized source_account_ref)` while allowing one portfolio to contain separate source contributions where explicitly supported. Existing `portfolio_holdings.source_broker`, `lineage_digest`, and `portfolio_contributions` import metadata remain row-level evidence and are not replaced by this registry.

The source table is a proposed addition, not part of the approved relationship direction. If portfolio-level origin is intentionally derived from existing holding/contribution evidence instead, the PA/product decision should say so and the new table should be omitted; do not duplicate or contradict provenance.

## 4. Relationship lifecycle and state transition

1. **Not present:** no owner link is assumed from the S1 owner string or D02 constant. D02 access fails closed.
2. **Provisioned ACTIVE (future authority only):** in one transaction, validate the exact current S1 active binding/membership and owner-registry target; insert a new UUIDv4 relationship with matching tenant and approved authority reference; append audit event; commit atomically. Partial unique indexes reject a second active row.
3. **Resolved:** every D02 read/write resolves fresh from SQLite. No process-global cache or caller-selected relationship ID.
4. **Revoked:** later authorized revocation updates the status and `revoked_at` and appends an immutable audit event in the same transaction. Existing data remains unchanged; subsequent D02 resolution refuses.
5. **Re-established:** never reactivate a revoked relationship silently. A new active row/ID requires renewed applicable authority and must not coexist with another active row.

Relationship creation, revocation, reactivation, owner registry insertion, and portfolio source records are **not authorized by this design document**.

## 5. D02 resolver and authorization contract proposal

### 5.1 Distinct result types

Do not return S1 `canonicalOwnerId` as if it were the D02 owner. Proposed distinct internal context:

```ts
interface ResolvedD02PortfolioAccess {
  principalLabel: string;
  bindingId: string;
  membershipId: string;
  membershipOwnerId: string; // remains ipd-owner-ramki-personal
  tenantId: string;          // ipd-personal-local
  relationshipId: string;
  portfolioOwnerId: string;  // owner-4dc756b3
}
```

This is an illustrative type, not an implementation. Callers must not accept any of these fields from IPC/request data.

### 5.2 Read/write resolution

For each D02 request:

1. Resolve exactly one ACTIVE binding and exactly one ACTIVE membership using the existing generic checks; require binding/membership attachment.
2. Check the full established S1 tuple (`principal_label`, binding ID, membership ID, tenant, and S1 owner) without modifying it. A future superseding S1 authority decision would require a separately reviewed contract.
3. Select relationship rows for that membership and `OVERALL_PERSONAL_PORTFOLIO_OWNER`. Require exactly one ACTIVE row, correct membership tenant, owner-registry row ACTIVE, and exact D02 owner `owner-4dc756b3` on `ipd-personal-local`.
4. For writes, perform steps 1–3 inside the same `BEGIN IMMEDIATE` transaction as the portfolio mutation. Reads use a consistent read snapshot and the same cardinality/status predicates.
5. Derive the D02 owner from the validated relationship. Compare target portfolio tenant, owner, ID and status against this context; never use a request-supplied owner or infer from source.

`resolveActiveBinding` remains unchanged for S1/Direct P1. A future D02 resolver must no longer call the current `resolveActiveHoldingsBinding` equality predicate as its final check, because that predicate expects the S1 membership itself to be D02 owner. It must use the explicit relationship contract instead. `localSingleUserAuthorization`/`DurablePortfolioStorePort` must also use this validated relationship for D02 target-owner decisions while preserving the server-only `IIPS_LOCAL_PERSONAL_USE=1`, scope checks and Gate 4/5 default-deny behavior.

### 5.3 Fail-closed matrix

| Condition | Proposed D02 result | Store effect |
|---|---|---|
| No active binding or no active membership | Refuse with existing non-disclosing unavailable/authorization refusal | None |
| More than one active binding/membership | Refuse; do not choose the first row | None |
| Membership not attached to active binding, or S1 tuple differs | Refuse; no automatic repair/rebind | None |
| No owner relationship, revoked relationship, inactive owner registry | Refuse; no fallback to S1 owner or D02 constant | None |
| More than one active relationship for membership/owner, despite index or corrupt fixture | Refuse; expose no row data | None |
| Wrong relationship type, foreign membership, tenant mismatch, wrong owner | Refuse uniformly; do not disclose which owner exists | None |
| Target portfolio absent, foreign, tombstoned, or source record conflicts | Existing non-disclosing unavailable/refusal class | None |
| Relationship revoked concurrently with write | Transaction ordering: revocation committed first causes refusal; otherwise write commits under validated active relation | Atomic, auditable |

Database uniqueness protects normal inserts; resolver cardinality checks remain mandatory for corrupted/legacy databases and adversarial fixtures.

## 6. Portfolio and source ownership checks

### Common portfolio checks

All list/get/revision/contribution/restore/delete and broker/manual mutation paths must obtain the D02 access context server-side. Query predicates include `tenant_id`, D02 `portfolioOwnerId`, exact `portfolio_id`, and applicable revision/status. Missing, foreign and tombstoned records remain non-disclosing. The client cannot choose owner or relationship ID. A portfolio's owner does not depend on provider/source.

### Broker-imported portfolios

For a Dhan or Zerodha import, dispatcher and durable persistence resolve D02 access, then validate the exact portfolio ID under that owner. The request retains `sourceBroker`, file name, content digest and imported timestamp; the importer validates every holding and stores the contribution evidence and holding source. A portfolio-source record must be compatible with the import's provider/account reference. A broker mismatch refuses unless a future approved explicit multi-source portfolio policy permits the additional source; even then contributions and holding provenance stay distinct. Importing Dhan must not overwrite Zerodha or manual portfolios by matching symbols.

### Manual portfolios

Manual create/save/reset/delete resolves the same D02 owner relationship but remains in the manual authorization scope. A manual source record uses `MANUAL_PERSONAL`; holdings keep `source_broker='manual-personal'`, manual disposition and lineage digest. Manual A and B have different portfolio IDs and independent revisions/lifecycle. A broker import cannot convert a manual portfolio by changing the owner or source label.

## 7. Concrete four-portfolio example

The names below are examples only; IDs are illustrative, not assigned values.

| Portfolio | `portfolio_id` | Stored owner/tenant after approved implementation | Source record and retained row provenance |
|---|---|---|---|
| Dhan | `portfolio-dhan-01` | `owner-4dc756b3` / `ipd-personal-local` | BROKER/DHAN; import file, content/lineage digest, time and contribution semantics; holdings retain Dhan source. |
| Zerodha | `portfolio-zerodha-01` | Same D02 owner/tenant | BROKER/ZERODHA; separate import contribution, source account reference and holdings lineage. |
| Manual A | `portfolio-manual-a` | Same D02 owner/tenant | MANUAL/MANUAL_PERSONAL; separate manual holdings, revisions and lineage. |
| Manual B | `portfolio-manual-b` | Same D02 owner/tenant | Different portfolio ID and manual history; never merged into A merely because both are manual. |

One validated personal identity relationship grants the single personal user's D02 portfolio context; it does not merge these portfolios. A cross-portfolio intelligence view may read all four for this authorized owner and derive an aggregate by qualified security identity, but each input retains portfolio ID, source record, broker/manual provenance, revision and lineage for drilldown. Aggregation is a derived projection, never a destructive consolidation or proof of current/complete market coverage.

## 8. Direct P1 compatibility

- Keep all S1 tuple values and S1 membership row unchanged.
- Keep generic `resolveActiveBinding` behavior unchanged for Direct P1.
- Keep DP-V8's transactional generic resolver check and its expected S1 tuple unchanged.
- D02-specific context is resolved by a new separate relationship function/type. Do not globally redefine `ActiveOwner` to pretend the membership owner changed.
- Preserve old Direct P1 error handling, write guards, audit behavior and owner-scoped SQL. Add regression tests that seed S1 values and prove D02 link creation/revocation does not alter Direct P1 resolution.
- Local write authorization must retain the server-only environment switch, scope separation, request-key rejection and Gate 4/5 default-deny. D02 relationship validation grants no environment or production authority.

## 9. Historical-record compatibility, migration and rollback proposal

No operational database was inspected; the existence and contents of historical rows are unknown. Do not backfill, re-key, or expose them by inference.

### Schema-only migration

If the design is approved, append a new checksummed migration; never edit migrations 001–006. Proposed schema migration adds owner registry, relationship table, source table (if separately approved), composite parent unique indexes and partial uniqueness indexes. It inserts no owner, relationship, source, or portfolio rows and does not modify S1 or portfolio owner keys. Upgrade tests run only on disposable databases with foreign keys enabled and valid/invalid fixture shapes.

### Existing portfolios under the S1 owner

The current portfolio schema may contain rows keyed to `ipd-owner-ramki-personal`; this design cannot assume whether it does. The ownership relationship establishes identity-to-D02 owner but does not silently rewrite existing portfolio rows.

Proposed separate data-compatibility phase, only after a read-only authorized inventory and a separately approved migration plan:

1. Capture a consistent read-only inventory of all candidate portfolios and child rows keyed by the exact S1 tenant/owner. Record counts, IDs, revisions, provenance fields and checksums; do not classify rows from display names or source alone.
2. Check collisions for each `(owner-4dc756b3, portfolio_id)` and tenant/owner/FK consistency. Any collision, incomplete revision chain, malformed or foreign row blocks the migration for that portfolio; no merge or overwrite.
3. PA/operations approve one explicit treatment: (a) keep legacy rows separate until a later design; (b) add an explicit owner-key compatibility alias/read projection with its own constraints and authorization tests; or (c) transactionally re-key all selected portfolio/revision/holding/contribution/restore references to D02 while retaining IDs, revisions, content/provenance and an auditable old-to-new mapping. The recommendation is option (c) only if the preflight is exact and authority specifically approves data movement; option (a) is the safe default until then.
4. If re-key is approved, use a verified backup, exact precondition manifest and one atomic FK-safe copy/re-key transaction; compare counts/digests and run owner-isolation checks before commit. Append an audit event with authority reference and old/new owner keys. Do not rewrite the existing hash-chained audit history; preserve old event details as historical evidence.
5. Rollback before commit is transaction rollback. After commit, rollback is a separately authorized reverse mapping only if no conflicting D02 rows or subsequent writes exist; otherwise restore a verified pre-migration backup under an approved recovery procedure. Never delete migration-ledger rows or reverse a checksummed schema migration by dropping tables.

A schema approval alone does not authorize any relationship row, owner registry row, portfolio source row, data backfill, re-key, provisioning, or database operation.

## 10. Targeted tests and acceptance criteria (future, not implemented)

### Schema and lifecycle tests

- Fresh migration creates all approved tables/indexes and preserves migration checksums 001–006.
- S1 membership/tenant composite FK accepts a valid link and rejects missing membership or tenant mismatch.
- Owner registry FK rejects missing/wrong-tenant owner; CHECK constraints reject invalid owner kind, relation type, status and revoked timestamp combinations.
- Partial indexes reject two ACTIVE relationships for one membership and two active memberships for the same owner; REVOKED history remains and a separately authorized new relationship can be created without modifying old history.
- Relationship UUID is opaque/random; no deterministic derivation; audit event and row lifecycle are atomic.

### Resolver/security tests

- Exact S1 tuple plus exactly one active relation resolves D02 owner `owner-4dc756b3` and retains both identity/owner fields distinctly.
- Direct P1 generic resolver/DP-V8 returns unchanged S1 tuple before/after D02 relationship fixture activation and revocation.
- Missing, multiple, revoked, detached, wrong-tenant, wrong-owner, wrong-type and malformed relations fail closed; no fallback to S1 owner, D02 constant, request owner, first row, or stale cache.
- Foreign/missing/tombstoned portfolio IDs are indistinguishable externally and have zero store effect; SQL read/write filters include tenant, D02 owner, portfolio ID and revision.
- Revocation/write race proves transaction ordering and no write after committed revocation.
- Server environment switch and write-scope gates remain required; no weakening of Gate 4/5 or request-supplied authority.

### Portfolio/provenance tests

- Dhan, Zerodha, Manual A and Manual B fixtures all resolve under one D02 owner but return distinct portfolio IDs and revisions.
- Dhan import cannot mutate Zerodha/manual portfolio by source, symbol, or guessed ID; provider mismatch refuses unless a future hybrid-source policy is explicitly approved.
- Manual A and B remain independently editable/deletable; manual source and lineage remain intact.
- Contribution metadata, holding source, portfolio source record and revision provenance survive restart/restore as governed; historical NULL provenance remains NULL/unknown.
- Intelligence aggregation is a read-only derived view preserving source/portfolio lineage and uncertainty.

### Historical migration tests and release gates

- Dry-run inventory is read-only; missing evidence/collisions block; no automatic re-key.
- Approved owner-key migration preserves portfolio IDs, revisions, contribution digests and all child rows; rollback is tested on disposable DB and audit history remains append-only.
- All tests use disposable synthetic databases; no operational DB or live holdings. D5 verifier work waits for approval of this schema and mapping contract; synthetic tests do not pass D5. D6 remains out of scope until D5 passes plus its own authority.

## 11. Decisions still required before implementation

Although the architecture direction is approved, the Program Authority must approve or amend this detailed design before schema implementation:

1. `portfolio_owner_registry` and `personal_identity_owner_relationships` table/column names, relationship type and source-of-authority field.
2. UUIDv4 relationship ID generation rule and the one-to-one active uniqueness constraints (one active owner per membership, one active membership per owner) for this single-user scope.
3. Composite membership/tenant FK and owner-registry FK design; whether the added composite parent indexes are acceptable.
4. Exact D02 resolver output/transaction behavior and narrowly scoped changes to `resolveActiveHoldingsBinding`, local authorization, broker/manual paths; confirm generic S1 resolver and DP-V8 remain unchanged.
5. Whether `portfolio_source_records` is required, its allowed source kinds/providers, multi-source semantics and active-source uniqueness. Existing per-holding/per-import provenance must not be lost.
6. Historical row policy: defer, explicit alias/read projection, or separately authorized owner-key re-key after a read-only inventory. No silent reassignment.
7. Separate implementation authority and any operational provisioning/data-migration authority, including procedure, host and evidence requirements. This document grants none.

## 12. Disposition

- Product ownership: **APPROVED**.
- Architectural direction: **APPROVED**.
- Detailed schema: **AWAITING APPROVAL**.
- Implementation authority: **NOT GRANTED**.
- Operational provisioning: **NOT AUTHORIZED**.
- D5: **BLOCKED**.
- D6: **NOT STARTED**.

No database, S1 row, identity, relationship, owner, portfolio or source record was modified. No migration, verifier, IPC call, live holdings read, dependency install, or IRR change occurred.
