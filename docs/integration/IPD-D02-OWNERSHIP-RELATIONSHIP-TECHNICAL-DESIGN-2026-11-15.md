# IPD detailed technical design proposal — S1 identity to D02 portfolio ownership

**Status: REVISED DETAILED DESIGN PROPOSAL — TECHNICAL ACCEPTANCE WITH CONDITIONS; PROGRAM AUTHORITY APPROVAL REQUIRED BEFORE IMPLEMENTATION.** The condition-closure addendum in §13 supersedes conflicting earlier illustrative details in §§3, 8–11. The architectural direction is approved by [IPD-D02-OWNERSHIP-ARCHITECTURE-DECISION-2026-11-15](IPD-D02-OWNERSHIP-ARCHITECTURE-DECISION-2026-11-15.md). This document specifies a candidate implementation contract, not approved DDL, an implementation instruction, provisioning authority, D5 acceptance, or D6 authorization.

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


Owner registry lifecycle proposal: owner targets are created only by separate authority; `REVOKED` is terminal for that registry identity. Revoking an owner and its active relationships is one `BEGIN IMMEDIATE` transaction: mark the owner REVOKED, mark every linked ACTIVE relationship REVOKED with timestamps, append one auditable event per relationship plus the owner event, validate affected-row counts, then commit. Any inconsistency rolls back. Resolver and write transaction independently check both statuses, so even a legacy ACTIVE link to a REVOKED owner refuses. Reinstatement under the same owner key is not automatic; authority must decide whether a new registry identity is needed.

Relationship audit event proposal: append-only event includes event type, relationship ID, exact S1 membership/binding/principal and tenant, D02 owner/tenant, prior/new status, authority-record reference, UTC timestamp, actor reference and reason code. Do not include credentials, account identifiers or tokens. The exact actor source, reason-code vocabulary, owner-revocation policy and whether an external immutable evidence manifest is additionally required are explicit PA decisions; do not synthesize actor identity.

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
- Independent review condition closure: **ACCEPTED WITH CONDITIONS** as revised design baseline only; §13.10 maps each condition and §13.11 identifies remaining authority decisions.
- Detailed schema: **AWAITING PROGRAM AUTHORITY APPROVAL**.
- Implementation authority: **NOT GRANTED**.
- Operational provisioning: **NOT AUTHORIZED**.
- D5: **BLOCKED**.
- D6: **NOT STARTED**.

No database, S1 row, identity, relationship, owner, portfolio or source record was modified. No migration, verifier, IPC call, live holdings read, dependency install, or IRR change occurred.

## 13. Independent-review condition closure — revised design addendum

**Supersession rule:** this §13 is the revised normative proposal for source IDs, relationship/source cardinality, source linkage, transaction boundaries, authorization boundary and historical-data treatment. Where earlier illustrative fragments conflict with §13, §13 controls. The schema remains **AWAITING PROGRAM AUTHORITY APPROVAL**; no code, migration or operational action is authorized.

### 13.1 Identifier and state constraints

Use canonical lowercase UUIDv4 text for `relationship_id`, `source_record_id`, and opaque broker `source_account_ref`. Generate them from a cryptographically secure random UUIDv4 source only within a later authorized local operation; never derive from the S1 tuple, broker name/account number, owner, timestamps or formulas. On uniqueness conflict, abort that transaction and record a sanitized failure; do not silently reuse or deterministically regenerate a known ID.

Every textual UUID key is declared `TEXT NOT NULL PRIMARY KEY` (or `TEXT NOT NULL` within a composite PK); do not rely on SQLite's legacy rowid-table handling of non-integer primary keys. Enforce canonical UUIDv4 spelling with a CHECK such as:

```sql
CHECK (
  length(id) = 36 AND id = lower(id) AND
  substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND
  substr(id, 15, 1) = '4' AND substr(id, 19, 1) = '-' AND
  substr(id, 20, 1) IN ('8','9','a','b') AND substr(id, 24, 1) = '-' AND
  length(id) - length(replace(id, '-', '')) = 4 AND
  id NOT GLOB '*[^0-9a-f-]*'
)
```

Apply the corresponding check to relationship, source-record and source-account opaque UUID fields. This representation/check syntax must be verified on the supported SQLite build in disposable tests before schema approval. All IDs and provider/reference strings are non-empty. `created_at`/`revoked_at` are canonical UTC instants at the API boundary; invalid or inconsistent status/time pairs refuse.

Relationship rows have `ACTIVE` or `REVOKED` status only. `ACTIVE` iff `revoked_at IS NULL`; `REVOKED` iff it is non-NULL. Revoke by status transition plus append-only audit event. Never delete or silently reactivate a revoked row; re-establishment is a new UUIDv4 relationship after new applicable authority. `authority_record_ref` must be non-empty, canonical IPD record path/identifier plus recorded content digest; it is traceability, not an authorization substitute.

### 13.2 Proposed relationship schema and exact keys

The owner registry and relationship table from §§3.1–3.2 remain the candidate shape, with these mandatory corrections:

- `relationship_id TEXT NOT NULL PRIMARY KEY` plus canonical UUIDv4 CHECK.
- `membership_id`, both tenant fields, owner ID, type, status, authority reference and timestamps all `NOT NULL` where status permits.
- the composite parent index `(membership_id, tenant_id)` is created before the relation table and retained for its composite FK.
- FK delete actions are `RESTRICT`; relationship history is never cascade-deleted.
- partial unique indexes are the approved **proposal** for the local single-user scope: one ACTIVE overall-owner relationship per membership/type and one ACTIVE membership per owner/tenant/type. No current multi-user/multi-device deployment is implied.
- resolver checks owner-registry ACTIVE status as well as relationship and membership/binding status; SQLite FK presence alone is insufficient.

Normative candidate DDL fragment for the relationship row (the earlier §3.2 block is superseded for identifier nullability):

```sql
CREATE UNIQUE INDEX uq_membership_id_tenant
  ON local_principal_memberships (membership_id, tenant_id);

CREATE TABLE personal_identity_owner_relationships (
  relationship_id TEXT NOT NULL PRIMARY KEY
    CHECK (length(relationship_id)=36 AND relationship_id=lower(relationship_id)
      AND substr(relationship_id,9,1)='-' AND substr(relationship_id,14,1)='-'
      AND substr(relationship_id,15,1)='4' AND substr(relationship_id,19,1)='-'
      AND substr(relationship_id,20,1) IN ('8','9','a','b')
      AND substr(relationship_id,24,1)='-'
      AND length(relationship_id)-length(replace(relationship_id,'-',''))=4
      AND relationship_id NOT GLOB '*[^0-9a-f-]*'),
  membership_id TEXT NOT NULL,
  membership_tenant_id TEXT NOT NULL,
  owner_tenant_id TEXT NOT NULL,
  portfolio_owner_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type='OVERALL_PERSONAL_PORTFOLIO_OWNER'),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','REVOKED')),
  authority_record_ref TEXT NOT NULL CHECK (length(trim(authority_record_ref)) > 0),
  created_at TEXT NOT NULL, revoked_at TEXT,
  CHECK (membership_tenant_id=owner_tenant_id),
  CHECK ((status='ACTIVE' AND revoked_at IS NULL) OR
         (status='REVOKED' AND revoked_at IS NOT NULL)),
  FOREIGN KEY (membership_id,membership_tenant_id)
    REFERENCES local_principal_memberships(membership_id,tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY (owner_tenant_id,portfolio_owner_id)
    REFERENCES portfolio_owner_registry(tenant_id,portfolio_owner_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX uq_active_relationship_per_membership
  ON personal_identity_owner_relationships(membership_id,relationship_type)
  WHERE status='ACTIVE';
CREATE UNIQUE INDEX uq_active_membership_per_overall_owner
  ON personal_identity_owner_relationships(owner_tenant_id,portfolio_owner_id,relationship_type)
  WHERE status='ACTIVE';
```

All parent tables/indexes are created before these FKs. Confirm the UUID CHECK against the actual bundled SQLite version in disposable tests; if unsupported, validate exact canonical UUIDv4 in a non-bypassable insert boundary and preserve NOT NULL/unique DB constraints.

The S1 subject is the existing membership `d25dcc5370100b00766efc5166f65cf3` attached to existing binding `c5808abaffd072d6401ce63ad86c6ac0` and principal label `ramki-personal-local`. Its membership tenant and S1 owner stay `ipd-personal-local` / `ipd-owner-ramki-personal`. The related owner target is `owner-4dc756b3` on `ipd-personal-local`. These are mapping inputs approved at architecture level; relationship row/UUID and schema are not yet approved or provisioned.

### 13.3 Provider and account-reference normalization

Use a provider catalogue rather than free-form request strings:

```sql
CREATE TABLE portfolio_source_provider_catalog (
  provider_code TEXT NOT NULL PRIMARY KEY COLLATE BINARY,
  source_kind  TEXT NOT NULL CHECK (source_kind IN ('BROKER','MANUAL')),
  status       TEXT NOT NULL CHECK (status IN ('ACTIVE','REVOKED')),
  created_at   TEXT NOT NULL,
  revoked_at   TEXT,
  UNIQUE (provider_code, source_kind),
  CHECK (provider_code <> '' AND provider_code = upper(trim(provider_code))
         AND provider_code NOT GLOB '*[^A-Z0-9_]*'),
  CHECK ((status = 'ACTIVE' AND revoked_at IS NULL) OR
         (status = 'REVOKED' AND revoked_at IS NOT NULL))
) WITHOUT ROWID;
```

Canonical provider codes are exact uppercase ASCII catalogue keys: `DHAN`, `ZERODHA`, one separately registered key for each other supported broker, and `MANUAL_PERSONAL`. The broker adapter maps known aliases to exactly one active code before persistence; unknown/ambiguous values refuse. Never persist a caller-invented provider label as authority. Registration of new broker keys is a separately governed catalogue change.

For BROKER, `source_account_ref` is a server-issued opaque UUIDv4 token stable for one broker account/source stream; it is **not** the raw account number, username, credential, or token. Normalize by canonical lowercase UUIDv4 form only. For MANUAL, provider is exactly `MANUAL_PERSONAL` and account reference is NULL. Do not guess broker-specific normalization of account numbers; the opaque token avoids storing or deriving identity from them. If a provider cannot provide a stable server-owned source stream, refuse to claim an account-level source match; PA/product review must decide a fallback.

### 13.4 Portfolio-source cardinality, uniqueness and row links

**Cardinality proposal:** a portfolio has zero or more active source records over its lifecycle; an empty initial portfolio may temporarily have none. Multiple records are permitted only for distinct provider/account source streams. A single active source record exists for each `(tenant, owner, portfolio, provider_code, source_account_ref)` tuple. The source-record DDL, using the provider catalogue defined once in §13.3, is:

```sql
-- Reuse portfolio_source_provider_catalog defined in §13.3; do not recreate it.

CREATE UNIQUE INDEX uq_portfolio_tenant_owner_id
  ON portfolios (tenant_id,canonical_owner_id,portfolio_id);

CREATE TABLE portfolio_source_records (
  source_record_id TEXT NOT NULL PRIMARY KEY
    CHECK (length(source_record_id)=36 AND source_record_id=lower(source_record_id)
      AND substr(source_record_id,9,1)='-' AND substr(source_record_id,14,1)='-'
      AND substr(source_record_id,15,1)='4' AND substr(source_record_id,19,1)='-'
      AND substr(source_record_id,20,1) IN ('8','9','a','b')
      AND substr(source_record_id,24,1)='-'
      AND length(source_record_id)-length(replace(source_record_id,'-',''))=4
      AND source_record_id NOT GLOB '*[^0-9a-f-]*'),
  tenant_id TEXT NOT NULL, canonical_owner_id TEXT NOT NULL, portfolio_id TEXT NOT NULL,
  source_kind TEXT NOT NULL, provider_code TEXT NOT NULL, source_account_ref TEXT,
  provenance_digest TEXT CHECK (provenance_digest IS NULL OR
    (length(provenance_digest)=64 AND provenance_digest NOT GLOB '*[^0-9a-f]*')),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','REVOKED')),
  created_at TEXT NOT NULL, revoked_at TEXT,
  CHECK ((source_kind='MANUAL' AND provider_code='MANUAL_PERSONAL' AND source_account_ref IS NULL) OR
         (source_kind='BROKER' AND provider_code<>'MANUAL_PERSONAL' AND source_account_ref IS NOT NULL)),
  CHECK (source_account_ref IS NULL OR
         (length(source_account_ref)=36 AND source_account_ref=lower(source_account_ref)
          AND substr(source_account_ref,9,1)='-' AND substr(source_account_ref,14,1)='-'
          AND substr(source_account_ref,15,1)='4' AND substr(source_account_ref,19,1)='-'
          AND substr(source_account_ref,20,1) IN ('8','9','a','b')
          AND substr(source_account_ref,24,1)='-'
          AND length(source_account_ref)-length(replace(source_account_ref,'-',''))=4
      AND source_account_ref NOT GLOB '*[^0-9a-f-]*')),
  CHECK ((status='ACTIVE' AND revoked_at IS NULL) OR
         (status='REVOKED' AND revoked_at IS NOT NULL)),
  UNIQUE (tenant_id,canonical_owner_id,portfolio_id,source_record_id),
  FOREIGN KEY (provider_code,source_kind)
    REFERENCES portfolio_source_provider_catalog(provider_code,source_kind) ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id,canonical_owner_id,portfolio_id)
    REFERENCES portfolios(tenant_id,canonical_owner_id,portfolio_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX uq_active_source_per_portfolio_provider_account
  ON portfolio_source_records(tenant_id,canonical_owner_id,portfolio_id,provider_code,
                              COALESCE(source_account_ref,''))
  WHERE status='ACTIVE';
```

`portfolio_holding_source_links` and `portfolio_contribution_source_links` DDL is the block immediately below; each has a child-row primary key and restrictive FKs to both child and matching source row.

The manual NULL account token is collapsed to a fixed internal sentinel in the uniqueness index, giving at most one active manual origin for a portfolio. Revoked source records remain historical and do not block a later explicitly re-established source record with a new source-record ID. This permits explicit hybrid portfolios without merging their source evidence; the four required examples each use one source record.

Candidate source table constraints:

- `source_record_id TEXT NOT NULL PRIMARY KEY` plus canonical UUIDv4 CHECK.
- portfolio FK to `(tenant_id, canonical_owner_id, portfolio_id)` with a unique parent index on `portfolios`; provider/source-kind FK to the catalogue; all deletes RESTRICT.
- `source_kind` is read from/checked against the catalog, never trusted from IPC.
- non-empty provider/account values; broker requires an opaque UUIDv4 account ref, manual requires NULL.
- unique partial index for active source tuple: `(tenant_id, canonical_owner_id, portfolio_id, provider_code, COALESCE(source_account_ref,'')) WHERE status='ACTIVE'`.
- a revoked provider catalogue entry cannot be used for a new source or import; revocation does not erase historical source/holding/contribution evidence. Existing reads may display that historical evidence with its revoked status, but may not present it as a currently authorized import source.

Create explicit normalized association tables so source lineage is relational, not just inferred from a text label:

```sql
CREATE TABLE portfolio_holding_source_links (
  tenant_id TEXT NOT NULL, canonical_owner_id TEXT NOT NULL,
  portfolio_id TEXT NOT NULL, revision INTEGER NOT NULL,
  holding_key TEXT NOT NULL, source_record_id TEXT NOT NULL,
  PRIMARY KEY (canonical_owner_id, portfolio_id, revision, holding_key),
  FOREIGN KEY (canonical_owner_id, portfolio_id, revision, holding_key)
    REFERENCES portfolio_holdings(canonical_owner_id, portfolio_id, revision, holding_key)
    ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, canonical_owner_id, portfolio_id, source_record_id)
    REFERENCES portfolio_source_records(tenant_id, canonical_owner_id, portfolio_id, source_record_id)
    ON DELETE RESTRICT
);

CREATE TABLE portfolio_contribution_source_links (
  tenant_id TEXT NOT NULL, canonical_owner_id TEXT NOT NULL,
  portfolio_id TEXT NOT NULL, contribution_id TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  PRIMARY KEY (canonical_owner_id, portfolio_id, contribution_id),
  FOREIGN KEY (canonical_owner_id, portfolio_id, contribution_id)
    REFERENCES portfolio_contributions(canonical_owner_id, portfolio_id, contribution_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, canonical_owner_id, portfolio_id, source_record_id)
    REFERENCES portfolio_source_records(tenant_id, canonical_owner_id, portfolio_id, source_record_id)
    ON DELETE RESTRICT
);
```

`portfolio_source_records` must expose a unique parent key `(tenant_id, canonical_owner_id, portfolio_id, source_record_id)`. One source link per holding revision and one per import contribution is enforced by the link-table primary keys. New writes create the source row and associated holding/contribution links in the same transaction; missing link or provider/sourceBroker mismatch refuses the whole transaction. For each link, verify the catalog-derived `source_kind` and provider against the holding `source_broker` or contribution/import provider evidence (with a documented deterministic alias map); manual rows require a manual-entry disposition and cannot claim broker provenance. Reject incompatible evidence, not silently rewrite it. Existing migration-004 NULL provenance and pre-link historical rows remain NULL/unlinked/UNKNOWN until evidence-backed treatment; never backfill by symbol or guess. A source row can serve many holding and contribution rows within its portfolio, but never across tenants/owners/portfolio IDs.

### 13.5 D02 resolver, consistent access and non-bypassable authorization boundary

Define one internal transaction wrapper, conceptually `withD02PortfolioAccess(db, mode, work)`, with distinct read and write modes:

- **Write:** start `BEGIN IMMEDIATE`; on the same connection resolve the sole ACTIVE S1 binding/membership and relationship, validate owner registry, then run authorization and all portfolio/source writes; commit only after all checks and effects succeed. Any error rolls back the whole operation.
- **Read:** start an explicit read transaction/snapshot; resolve the same context and execute owner-scoped list/get/history/contribution/source query on the same connection and snapshot; end after projection. Do not call the generic resolver that opens/commits its own transaction and then issue a separate query.
- The wrapper owns the outer transaction. Nested calls must accept the existing transaction/context and use savepoints only for documented local atomic sub-operations; they may not commit/rollback the outer transaction. No callback may open a second connection. On any exception, abort the whole unit; on read refusal, return no partial rows. Enumerate and route every production entrypoint: dispatcher/list/get/history/contribution, restore/delete, manual CRUD, broker import/consumer and source creation.
- Check exact S1 principal, binding ID, membership ID, tenant and S1 canonical owner; relationship membership/tenant, relationship type/status, owner-registry tenant/owner/status and uniqueness. D02 owner comes only from the relationship, never from request data or a constant fallback.
- Relationship subject is the established S1 membership, not the binding row or a new principal. Resolve by exact membership ID, then verify its parent binding ID, principal label, ACTIVE states, tenant and S1 owner against the effective determination. Treat missing, duplicate, cross-tenant or mismatched parent rows as refusal.
- Return a new D02 owner context distinct from `ActiveOwner`. Each SQL operation filters by resolved tenant, D02 owner, exact portfolio ID and applicable revision/status. Missing/foreign/tombstoned IDs remain non-disclosing.

**Low-level bypass prevention:** no production-facing persistence method accepts arbitrary `OwnerRef` for D02. Hide raw `DurablePortfolioStore` construction and owner-taking methods from IPC/composition exports. The sole production facade receives an unforgeable, in-process D02 access capability created only inside the transaction wrapper; the capability carries a private runtime brand/transaction nonce and is rejected unless registered for that same DB connection and the transaction is still open. It cannot be serialized, accepted from IPC, reused after transaction end, or chosen by a caller. All reads and writes—including restore/delete—require it. Add architecture/import-graph tests proving product dispatch cannot import/call low-level methods directly. Test-only fixtures use a separate internal test factory, not a production bypass.

Writes still require the server-owned `IIPS_LOCAL_PERSONAL_USE=1`, appropriate manual/broker scope and all existing Gate 4/5 default-deny checks. Relationship presence alone grants neither write authority nor production access. Direct P1 continues using generic S1 resolution; it never consumes the D02 capability.

### 13.6 Four-portfolio behavior and source ownership

After separately authorized relationship and source records exist, all four rows have owner `owner-4dc756b3`, tenant `ipd-personal-local`, distinct `portfolio_id`, revisions and source links:

| Portfolio | Example ID | Provider/source key | Linked holdings/contributions |
|---|---|---|---|
| Dhan portfolio | `portfolio-dhan-01` | `DHAN` plus its opaque source-account UUID | Dhan holdings and each import contribution link to that Dhan source record. |
| Zerodha portfolio | `portfolio-zerodha-01` | `ZERODHA` plus its distinct source-account UUID | Separate Zerodha holdings/import lineage. |
| Manual Portfolio A | `portfolio-manual-a` | `MANUAL_PERSONAL`, NULL account ref | Manual A holdings/revisions link to its manual source record. |
| Manual Portfolio B | `portfolio-manual-b` | `MANUAL_PERSONAL`, NULL account ref | Separate ID/source record/revisions; not merged into A. |

The manual active-source uniqueness is portfolio-scoped, so A and B each have their own source record. A Dhan import cannot mutate Zerodha or manual rows through owner equality, matching symbols, or guessed IDs. A multi-source portfolio is permitted only by adding distinct source records and explicit per-row/contribution links; provenance remains visible. Investment intelligence may derive a cross-portfolio view but retains portfolio/source links and uncertainty.

### 13.7 Complete repository-level owner-key inventory and historical re-key

**Repository schema inventory (complete for migrations 001–006 on the reviewed branch; not a claim about an operational DB's row contents):**

| Table | Owner/identity keys | Re-key treatment |
|---|---|---|
| `local_principal_bindings` (003) | binding ID/principal/status; no portfolio owner column | Never re-key or alter S1. |
| `local_principal_memberships` (003) | membership/binding, tenant, S1 canonical owner | Never re-key or alter S1. Relationship references this row. |
| `portfolios` (001) | canonical owner + portfolio ID PK; tenant; name/revision/status | Candidate owner-key move from exact S1 owner to D02 only after PA decision and preflight. |
| `portfolio_revisions` (001/006) | owner + portfolio + revision PK/FK | Move in same batch as parent. |
| `portfolio_holdings` (001/005/006) | owner + portfolio + revision + holding PK/FK; source broker, lineage, identity | Move without changing holding identity/provenance; source links move too. |
| `portfolio_contributions` (001/004) | owner + portfolio + contribution PK/FK; broker/import provenance fields (historical NULLs possible) | Move without imputing NULLs; contribution-source links move too. |
| `portfolio_restore_receipts` (006) | owner + tenant + portfolio, idempotency key, revision FK; request fingerprint includes owner | Move with parent; recompute the owner-dependent fingerprint and preserve old/new fingerprint pair in migration manifest/audit evidence. |
| `audit_events` (002) | no structured owner FK; `detail_json` may contain historic owner IDs; hash chain | Do not rewrite any historical event/checksum. Append a re-key event that references the manifest digest. |
| `_migration_ledger` | migration IDs/checksums/timestamps only | Do not modify; never delete/rewind applied migration history. |
| Proposed owner registry/relationship/source provider catalog/source records/source links | target owner, membership, portfolio and source keys | Registry/provider rows are not rewritten; source records and both source-link tables are included in any authorized portfolio re-key. |

The prior review prohibited operational DB inspection; this design task likewise did not open a database. Therefore actual row counts, candidate historical portfolio IDs, collisions, orphan rows, and current schema ledger state are **unknown**. The exact operational inventory is a precondition to a later separately authorized data action, not something to fabricate in this design report.

**Recommended data compatibility policy (proposal, PA decision required):** preserve all existing S1 rows untouched until a read-only inventory and a separately approved owner-key data migration. For every portfolio proven to belong to the S1 personal identity under the exact S1 owner/tenant, propose migrating the owner key to D02 while preserving portfolio ID/revision/holding/contribution/source IDs and evidence. Do not migrate rows from any other owner, infer membership from names/symbols, or merge portfolios. If the PA rejects re-key, the alternative is an explicitly authorized owner-key alias/read projection; until a complete alias contract is approved, those historical rows remain outside the D02 projection and D02 rollout stays blocked.

**Preflight and collision policy:** inventory every table above plus foreign-key edges; record exact row counts, keys, digest/null patterns and `PRAGMA foreign_key_check` results in a signed/hashed manifest. If a destination `(owner-4dc756b3, portfolio_id)` already exists, any duplicate source key, orphan/invalid FK, malformed owner/tenant, ambiguous source link, or non-invertible restore receipt is a batch-wide STOP: do not merge, overwrite, pick a winner, or partially migrate. The responsible PA must decide the conflicting portfolio's disposition from evidence.

**Atomic re-key proposal:** after separate PA and operational approval, verified backup, quiescence and preflight; use one `BEGIN IMMEDIATE` transaction with supported `PRAGMA defer_foreign_keys=ON`. Validate destination keys again inside the transaction; update owner columns in `portfolio_holdings`, `portfolio_revisions`, `portfolio_contributions`, `portfolio_restore_receipts`, `portfolio_source_records`, `portfolio_holding_source_links`, and `portfolio_contribution_source_links`, then `portfolios` (or use a tested shadow-copy equivalent). Preserve all portfolio/source IDs and original revision values. Recompute restore request fingerprints for the D02 owner; record original and replacement fingerprint values in the immutable external manifest whose digest is appended to `audit_events`. Run in-transaction row-count/digest checks and `PRAGMA foreign_key_check`; commit only if all match, otherwise ROLLBACK. Existing audit chain is append-only.

**Rollback/recovery:** before commit, any error or mismatch rolls back atomically. After commit, reverse re-key is allowed only under a separately approved recovery action if no D02 write/new row or destination conflict has occurred; use the manifest to restore old fingerprints and owner keys, then verify the original backup digest. If subsequent writes make reversal non-invertible, do not partially reverse—restore a verified pre-migration backup under approved recovery authority and reconcile later writes from audit evidence. Never drop/rewind the schema migration or delete audit history. Schema migration itself is append-only and transactional under the existing migration ledger; it creates no owner, relationship, provider, source or portfolio data rows.

**Schema migration mechanics:** a future append-only migration is ordered after all current parents and required composite parent indexes, runs with SQLite foreign keys enabled, and is applied atomically by the existing migration runner/ledger; nested migration transactions are forbidden. Verify actual bundled SQLite support for partial/expression indexes, CHECKs, deferred FK behavior and UUID checks in disposable fresh/current-schema tests. Migration checksum/ledger is immutable; any failure rolls back schema and ledger together. It creates schema/catalog definitions only—not owner, relationship, provider seed, source or portfolio rows. Any incompatibility blocks approval rather than changing old migrations.

### 13.8 Explicit local single-user security scope

This design assumes the existing operator-local SQLite store and one S1 active binding/membership. It is not a multi-user, hosted, SaaS, network-identity, or institutional authorization design. Tenant/owner/portfolio predicates and the relationship/capability boundary prevent a different owner from being selected within this scope. If multi-user or multiple devices are later required, stop and obtain a new authority-approved identity, uniqueness, revocation and data-isolation design; do not weaken the one-to-one active indexes.

### 13.9 Targeted test plan and implementation acceptance criteria

All future tests are synthetic and disposable; no operational database is used.

1. **DDL/IDs:** migration on fresh/current schema; `foreign_keys=ON`; reject NULL, empty, malformed/noncanonical UUID, invalid UUID version/variant, duplicate IDs, blank authority refs, invalid statuses/times; verify transaction rollback and checksum immutability.
2. **Relationship FKs/lifecycle:** valid exact S1 membership link; missing membership, tenant mismatch, nonexistent owner registry, revoked owner registry, revoked membership, duplicate ACTIVE link, second active membership for owner, re-established link with new UUID; all invalid cases fail closed. Existing S1 values remain byte/value unchanged.
3. **Source normalization/cardinality:** provider aliases normalize to a single registered uppercase provider code; unknown or ambiguous providers refuse; account token is opaque UUIDv4 and raw credentials/account strings are rejected/not stored; duplicate active source tuple fails; revoked historical source remains; manual source has NULL account ref and is unique per portfolio.
4. **Source linkage:** each new holding revision and broker-import contribution has exactly one source link in the same transaction; wrong owner/tenant/portfolio/provider link fails; duplicate links fail; new source mismatch rolls back all rows. Historical rows with no link remain explicitly UNKNOWN, not guessed.
5. **Resolver/transaction:** owner relationship and list/get/read occur in one read snapshot; owner relationship and each mutation occur in one `BEGIN IMMEDIATE`; concurrent revocation ordering is deterministic; no cached or caller-selected context. Missing, duplicate/corrupt, revoked, conflicting and foreign relations yield no data/store effect.
6. **Authorization boundary:** fuzz raw OwnerRef and forged capability; assert no low-level API is reachable from product dispatch; transaction-bound capability cannot be serialized/reused; server env and scope checks remain; Gate 4/5 remain default-deny; every manual/broker/read/list/history/contribution/restore/delete route uses the wrapper.
7. **Direct P1:** DP-V8/generic resolver continues to return exact S1 values with relationship absent, active, and revoked; no D02 context leaks into P1.
8. **Four portfolios/provenance:** Dhan, Zerodha, Manual A and Manual B all resolve to D02 owner but remain four IDs, each with source record/links, separate revisions and lineage; source-specific mutations cannot affect another portfolio; derived intelligence projection preserves source identity.
9. **Historical migration:** dry-run report, missing/null provenance, duplicate destination, cross-tenant/orphan, restore receipt fingerprint rewrite, source-record/link movement, audit immutability, all-or-nothing rollback and recovery after/no subsequent writes. Do not perform on actual DB until separate authorization.

**Acceptance criteria for the design itself:** revised schema provides NOT NULL/UUID constraints; exact source and link cardinalities; transaction and capability boundaries; complete repository owner-key inventory including source records/links and restore fingerprints; collision/rollback/recovery rules; S1 regression and four-source examples; explicit PA decisions below. A design pass does not pass tests or authorize implementation.

### 13.10 Traceability to each independent review condition

Every unresolved review item is assigned below. “Resolved in design” means the candidate contract and testable acceptance criterion are now stated; it does not mean Program Authority approved it, code/tests passed, or operational rows were inspected.

| Review condition / finding | Resolution and evidence in this revision | Explicit acceptance check | Remaining authority / evidence gate |
|---|---|---|---|
| Exact relationship subject; verify existing membership, binding, principal and S1 tuple | §13.5 names the existing S1 membership as the FK subject and requires exact parent binding/principal/tenant/S1 owner checks; §§13.2 and 13.9 | Valid exact tuple resolves; wrong/missing/duplicate/cross-tenant parent refuses before data access; S1 bytes remain unchanged | PA approves detailed schema; future implementation tests |
| Owner-registry lifecycle/status and active links to revoked owner | §§3.1, 4 and 13.5 require status join/check; §13.4 prevents revoked catalog providers on new use; §13.9 tests revoked owner/provider | Revoking owner and links is one auditable transaction; any stale active link to revoked owner refuses | PA approves terminal revocation, actor/reason and audit policy |
| Relationship identifier, NOT NULL/UUIDv4, collision, authority ref and audit | §§13.1–13.2 give canonical UUIDv4 DDL, secure generation/collision abort, non-empty authority reference; §4 and §13.2 describe audit | SQLite rejects NULL/empty/malformed/version/variant/duplicate ID; no ID generated before authority | PA approves fields/reference/audit; disposable SQLite tests |
| FK order and supported SQLite behavior | §§13.2, 13.4, 13.7 list composite parent indexes, restrictive FKs, migration ordering/foreign-key enablement/checksums | Fresh and current-schema migration passes `foreign_key_check`; invalid composite references reject | PA schema approval and supported-build test |
| Active uniqueness and one-user-only scope | §§13.2, 13.8 preserve both partial unique indexes and exclude multi-user/multi-device | Duplicate active relationship/link fails; no silent weakening | PA approves scope/indexes; any expansion needs new authority-approved model |
| Source taxonomy, provider/account normalization, cardinality, manual/hybrid policy | §§13.3–13.4 specify catalog, uppercase ASCII codes, exact alias mapping, opaque stable account UUID, manual NULL, zero-or-more and tuple uniqueness | Unknown/ambiguous code, malformed token, duplicate active tuple or unauthorized hybrid use refuses | PA confirms catalogue/extensions, stable-token semantics and hybrid/multi-source policy |
| Holding/contribution source linkage and source mismatch | §13.4 adds restrictive per-row links and source-evidence/provider checks; §13.6 has four distinct source records | Every new holding revision/contribution has exactly one in-transaction link; wrong provider/tenant/portfolio/source fails with zero effect | PA approves source registry/link extension; implementation tests |
| Resolver and read/write transaction consistency; nested transactions/call sites | §13.5 requires same connection/snapshot or `BEGIN IMMEDIATE`, wrapper ownership and enumerated read/write/import/restore/delete entrypoints | Relationship revocation and query/mutation serialize; split connections, nested commit, partial result/effect fail | PA approves API/boundary; implementation concurrency tests |
| Authorization and low-level persistence bypass | §13.5 defines private store and transaction-bound capability; request cannot carry owner or capability; architecture tests required | Forged raw owner/capability and direct dispatch path cannot read/write; server/Gate 4/5 default-deny still applies | PA chooses facade vs schema FK/rebuild; implementation/import-graph tests |
| Historical data inventory and S1-owner treatment | §13.7 inventories every owner-bearing table in migrations 001–006; live counts/keys/collisions explicitly UNKNOWN; re-key is separate | No live DB accessed now; future preflight lists all tables/FKs/counts and pauses on any ambiguity | PA chooses defer/alias/re-key; separate read-only and migration authority |
| Include proposed `portfolio_source_records` and source links in re-key | §13.7 includes source records and both link tables, as well as restore receipts/fingerprints | If such tables are approved, dry-run, collision check, re-key, digest and rollback include each | PA approves source schema and any data action |
| Collision, rollback, recovery and audit-chain preservation | §13.7 provides batch-wide stop, manifest/digest, atomic deferred-FK transaction, fingerprint handling, rollback cutoff and backup recovery | Synthetic collision/orphan/null-provenance/fingerprint tests all rollback atomically; audit history unchanged | PA and separate operational authority; executable tested procedure |
| Migration ordering, partial failure and supported schema behavior | §13.7 defines append-only transactional migration, `foreign_keys=ON`, parents first, ledger/checksum immutability and failure rollback | Injected migration failure leaves schema and ledger unchanged | PA schema approval; disposable current-version testing |
| S1 and Direct P1 compatibility | §§13.2, 13.5, 13.9 keep generic resolver/DP-V8 independent and S1 immutable | DP-V8 returns exact established S1 tuple with D02 relation absent/active/revoked; D02 never changes `ActiveOwner` | Implementation regression tests; no authority to alter P1 |
| Dhan, Zerodha, Manual A and Manual B independence/provenance | §§13.3–13.6 retain same D02 owner but four distinct IDs, source records, revisions and row links | Mutating one source cannot affect another; derived view retains drill-down lineage | PA approves source/hybrid policy; synthetic tests |
| Explicit local single-user security scope | §13.8 excludes hosted/multi-user/institutional scope | Any multi-user/multi-device requirement stops for new design; indexes remain strict | New PA approval for changed scope |

### 13.10.1 Design acceptance criteria and outcome

The revised candidate design meets the **document-level closure criteria** only when each item above has a defined rule and test: (a) relationship/source identifiers and exact FK subject; (b) provider/account rules and source cardinality/links; (c) consistent read/write access plus non-bypassable authorization; (d) complete schema inventory including `portfolio_source_records`, links and restore receipts; (e) collision/rollback/recovery and append-only migration; (f) unchanged S1/Direct P1; (g) four independent source portfolios; (h) explicit local single-user boundary. The detailed DDL must still pass disposable SQLite validation before schema approval.

**Outcome for the review conditions: ACCEPTED WITH CONDITIONS — revised design baseline only.** The engineering conditions have been translated into normative candidate rules and explicit acceptance checks above. Outstanding Program Authority choices and unperformed evidence gates remain precisely listed in §13.11; therefore this is not an `ACCEPTED` detailed schema, implementation acceptance, D5 pass or operational authorization. If the PA choices are not approved, the D02 resolver remains fail-closed.

### 13.11 Exact Program Authority decisions still required

The existing authority approves the identity-to-D02-owner **architecture**, not this detailed schema or historical data operation. Before implementation, request an explicit IPD decision that:

1. approves/amends the relationship subject and exact S1 membership/binding/principal checks; owner registry identity, terminal revocation behavior and atomic relationship revocation; UUIDv4/NOT NULL constraints, FKs, one-to-one active indexes; actor/reason fields, authority-reference format and audit event/evidence requirements;
2. approves/amends the provider catalogue, opaque account-reference model, source cardinality, per-row link tables, and whether multi-source portfolios are allowed; confirms whether per-source opaque tokens suffice for provenance or whether provider-specific evidence/deduplication of the same external account is required (current authority establishes source provenance, not broker account ID formats);
3. approves the transaction-bound capability/private persistence authorization boundary, or requires a schema-level owner FK/rebuild alternative; accepts the enumerated D02 entrypoint coverage, transaction nesting/connection ownership, sanitized refusal behavior and source/provider match rules;
4. chooses the historical S1-owner row treatment: (a) leave separate until later, (b) use an explicitly specified alias/read projection, or (c) allow the described exact, audited owner-key re-key after read-only inventory. No current direction authorizes data movement;
5. separately authorizes implementation and, if option (c) or any relationship/source row creation is selected, names the applicable operational provisioning/migration authority and evidence procedure.

If any decision is deferred, current D02 exact-membership-owner resolver remains in force and fails closed for the S1 tuple. No automatic mapping, schema inference, row change, D5, or D6 follows.
