# IPD Program Authority decision package — D02 overall personal portfolio ownership

**Prepared:** 2026-11-15 (filename follows the requested 2026-11-16 package identifier; updated 2026-11-16 to record the narrow PA read-only D5/D16 evidence inventory approval)
**Owner:** IPD (`ramkivs/iips-production-market-data`)
**Decision status:** **D01–D03 APPROVED as recorded (2026-11-15); narrow Level E read-only D5/D16 evidence inventory APPROVED as recorded (2026-11-16); D04–D22 register dispositions PENDING. Pending proposed defaults remain NOT APPROVED until explicitly accepted by the Program Authority.**
**Approval boundary:** This package requests decisions; except as recorded in the linked [approval record](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md) (D01–D03 discrete Level C defaults on 2026-11-15, and a strictly non-mutating Level E read-only D5/D16 evidence inventory of the existing local database on 2026-11-16), it grants no schema approval, implementation instruction, database mutation, identity/relationship/owner/source provisioning, migration authorization, D5 acceptance or D6 authorization.

## Executive summary

Product ownership and the high-level architecture are already approved: `owner-4dc756b3` is the overall owner for personal investment portfolios, and the existing S1 identity, binding, membership, S1 owner value and Direct P1 behavior are preserved while a separate explicit relationship connects the existing personal identity to D02. The four portfolios—Dhan, Zerodha, Manual Portfolio A and Manual Portfolio B—must remain four distinct portfolio identities with their own source evidence, provenance and history under that overall owner.

The detailed schema is **AWAITING APPROVAL**. The current design baseline proposes a relationship anchored to the established S1 membership, a tenant-safe owner registry, constrained relationship/source records, explicit source-to-holding and source-to-contribution links, a transaction-bound D02 access boundary, and a separate, later-authorized historical-data decision. The independent review's outcome remains **ACCEPTED WITH CONDITIONS** as a design baseline only.

This register contains **22 decision items**: **D01–D03 APPROVED** (2026-11-15) and a **narrow Level E read-only D5/D16 evidence inventory APPROVED** (2026-11-16) by the explicit PA directions recorded in the [approval record](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md); **D04–D22 register items remain PENDING**. Recommendations for pending items remain NOT APPROVED. The authorized read-only live database inventory was executed on the Principal's Windows host `2026-11-16` (disposition `INVENTORY_COMPLETE_READ_ONLY_VERIFIED`, exit code `0`, zero mutations, pre/post SHA-256 byte-identical) and is reconciled in [`IPD-D02-D5-D16-LIVE-EVIDENCE-RECONCILIATION-2026-11-16.md`](IPD-D02-D5-D16-LIVE-EVIDENCE-RECONCILIATION-2026-11-16.md); actual rows, null provenance, foreign-key state and destination collisions are now obtained. Historical-data choices (D15 disposition, D16 collision policy, D17 scope, D19 recovery manifest) still require separate PA decisions; inventory completion is not D5 acceptance, schema approval, implementation authorization, provisioning/migration authorization, or D6 authorization. (In the 2026-11-16 Arena Linux sandbox run the designated Windows database was unreachable/absent (`IIPS_G3_DATABASE_PATH` unset; zero SQLite files present), so safe execution stopped without touching or creating any database; see the [D5/D16 read-only inventory and host-blocker report](IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md).)

The complete proposed technical detail and acceptance tests are in the [revised relationship technical design](IPD-D02-OWNERSHIP-RELATIONSHIP-TECHNICAL-DESIGN-2026-11-15.md), particularly §§13.1–13.11. The prior independent findings are in the [acceptance review](IPD-D02-OWNERSHIP-RELATIONSHIP-DESIGN-ACCEPTANCE-REVIEW-2026-11-15.md). This register makes the choices and approval boundaries explicit for PA disposition.

### Concrete ownership example (design illustration only)

| Portfolio | Illustrative ID | D02 owner / tenant after separately approved design and provisioning | Independent evidence that must remain |
|---|---|---|---|
| Dhan portfolio | `portfolio-dhan-01` | `owner-4dc756b3` / `ipd-personal-local` | Dhan source record, opaque Dhan source-stream reference, separate revisions and Dhan import/holding lineage. |
| Zerodha portfolio | `portfolio-zerodha-01` | `owner-4dc756b3` / `ipd-personal-local` | Distinct Zerodha source record/reference, revisions and import/holding lineage; not folded into Dhan. |
| Manual Portfolio A | `portfolio-manual-a` | `owner-4dc756b3` / `ipd-personal-local` | Its own `MANUAL_PERSONAL` source record, NULL account reference, entries and revisions. |
| Manual Portfolio B | `portfolio-manual-b` | `owner-4dc756b3` / `ipd-personal-local` | A different portfolio ID and manual source record, entries and revisions; never merged into A. |

These are illustrative IDs, not provisioned rows. Equality of overall owner does not merge portfolio identity, source, revisions or provenance. A decision to use the source registry/link tables is still pending in D13.

## Previously approved decisions and approval levels

| Level | Status | Scope and limit |
|---|---|---|
| **A — Product ownership** | **APPROVED** | `owner-4dc756b3` on tenant `ipd-personal-local` is the overall personal portfolio owner across Dhan, Zerodha, other supported brokers and manual entries. Portfolio identity and source/provenance remain distinct. This is product policy, not a schema or data-change approval. |
| **B — Architectural direction** | **APPROVED** | Preserve the existing S1 principal, binding, membership, tenant and S1 `canonical_owner_id`; connect that existing personal identity to D02 owner `owner-4dc756b3` using a separate explicit ownership relationship. Do not substitute the D02 owner into S1. The original Level B record did not select the relationship FK subject or detailed schema; the later D01–D03 approvals settle only their named defaults, not the rest of Level C. |
| **C — Detailed technical schema** | **PENDING / AWAITING APPROVAL** | D01–D03 are approved as discrete design decisions; the full schema and D04–D20 choices remain pending. Acceptance of a design does not authorize implementation. |
| **D — Implementation authority** | **NOT GRANTED** | Must be separately and explicitly granted. Level C approval does not grant it. |
| **E — Operational provisioning and migration** | **NARROW READ-ONLY INVENTORY AUTHORIZED AND EXECUTED (2026-11-16); ALL PROVISIONING AND MIGRATION NOT AUTHORIZED** | On 2026-11-16, the Program Authority authorized strictly non-mutating read-only inspection of the existing local database solely for D5 identity-mapping evidence and D16 historical inventory/collision assessment (recorded in the [approval record](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md#2-narrow-level-e-read-only-d5d16-evidence-inventory-approved-on-2026-11-16)). Schema changes, migration execution, `_migration_ledger` writes, portfolio/holding writes, identity/relationship/owner/source row creation, historical re-keying, tombstone restoration, reset/replacement, startup invoking migrations, D5 acceptance and D6 execution remain **NOT AUTHORIZED**. |

The product determination explicitly left the identity contract and technical mapping pending. The later architecture decision resolved the high-level choice in favor of preserving S1 and a separate relationship, but expressly left the membership FK role, schema, resolver, source design and historical treatment unapproved. No D02 principal, binding or membership values are established or needed by the recommended approach; do not invent or derive any. The later PA approvals recorded for D01–D03 settle only those three named defaults, and the 2026-11-16 PA approval authorizes only the strictly non-mutating read-only D5/D16 evidence inventory; neither approves remaining schema choices, implementation, provisioning or migration.

## Decision register

**Register count: 22 decision items; 3 discrete Level C decisions approved (D01–D03) and 19 register items pending (D04–D22), with a narrow Level E read-only D5/D16 evidence inventory separately approved on 2026-11-16.** D01–D03 and the narrow 2026-11-16 read-only inventory authorization are recorded in the linked [PA approval record](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md). D04–D22 register dispositions remain **PENDING**, and their proposed defaults are **NOT APPROVED**. “Approval requested” specifies the authority level only; it does not grant a later level automatically.

### D01 — Relationship subject and exact identity fields — APPROVED

- **What / why:** Decide which existing identity record anchors the new relationship, and which S1 fields the resolver must check. This determines whether the proposed relation is actually tied to the established user rather than a free-form principal label.
- **Alternatives and consequences:** (a) FK to the existing membership and also verify its binding, principal, tenant and S1 owner; (b) relation keyed only to a principal or binding, weakening database linkage to membership; (c) create another D02 context, which would amend the already-approved Level B direction and interacts with the current global single-active constraints.
- **Technical recommendation — APPROVED (D01):** Use the established membership `d25dcc5370100b00766efc5166f65cf3` as FK subject; on every resolve, verify binding `c5808abaffd072d6401ce63ad86c6ac0`, principal `ramki-personal-local`, tenant `ipd-personal-local`, S1 owner `ipd-owner-ramki-personal`, and ACTIVE statuses. Do not create another principal/binding/membership under this direction. Approval is limited to this decision default; it is not schema or implementation approval.
- **Risk / S1 effect / approval:** The membership row's continuing validity and exact parent checks must be tested; a stale or mismatched row must fail closed. This preserves S1 and Direct P1; using a changed S1 owner would break the recorded contract. **D01 Level C decision: APPROVED.** Any change to Level B needs a new architecture decision; no implementation authority follows.

### D02 — No new D02 principal, binding or membership; identity-value contract — APPROVED

- **What / why:** Explicitly confirm that D02 ownership is represented by the relationship, not by fabricating a second identity tuple or deriving new IDs. The earlier product determination left D02 identity values unresolved; the approved architecture says preserve the S1 identity.
- **Alternatives and consequences:** (a) keep the S1 identity and add only a separate ownership relationship; (b) create a distinct D02 identity context, which requires amending Level B, changing the current one-active-binding/membership model, and defining coexistence and Direct P1 behavior; (c) repoint S1's owner to D02, which conflicts with the approved preservation rule and changes generic S1 behavior.
- **Technical recommendation — APPROVED (D02):** Confirm (a); define no D02 principal/binding/membership ID. The relationship ID is a separate opaque record ID, not a new identity ID. Approval is limited to this identity-value decision; it is not provisioning or schema approval.
- **Risk / S1 effect / approval:** A later requirement for multiple principals/devices would need a new model. (a) leaves S1 unchanged; (b)/(c) affect S1 and require Level B reconsideration. **D02 Level C decision: APPROVED.** Any new identity or S1-value change requires a separate Level B determination and does not authorize provisioning.

### D03 — Relationship and owner tenant/FK requirements — APPROVED

- **What / why:** Decide the exact parent keys, tenant equality and delete behavior. A bare ID FK could accidentally connect a membership or D02 owner across tenants.
- **Alternatives and consequences:** (a) composite FK `(membership_id, membership_tenant_id)` and `(owner_tenant_id, portfolio_owner_id)`, require membership and owner tenant equality, restrictive deletes; (b) single-column IDs with tenant checks only in application logic; (c) no registry FK. (b)/(c) permit more inconsistent rows if a caller bypasses the resolver.
- **Technical recommendation — APPROVED (D03):** Use composite tenant-scoped FKs, parent unique indexes created first, `RESTRICT` deletes and explicit tenant equality. Resolver checks owner registry and membership/binding statuses because an FK cannot enforce ACTIVE state. This records the proposed D03 default only; DDL validation and full schema approval remain pending.
- **Risk / S1 effect / approval:** Composite parent keys and supported SQLite behavior require disposable validation; no S1 data change is needed. **D03 Level C decision: APPROVED.** No migration is authorized.

### D04 — Relationship multiplicity and active uniqueness

- **Decision ID and subject:** D04 — Relationship multiplicity and active uniqueness.
- **Existing technical recommendation:** Keep both partial unique indexes enforcing one-to-one active linkage for this local single-user scope. Multiple historical REVOKED rows remain allowed.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** One active relationship per membership/type and one active membership per owner/tenant/type become the storage-level invariant; resolver's cardinality check is defense in depth. Multi-device/multi-principal use is blocked until a new Level B/C decision.
  - **AMEND:** Relaxation of the single-active constraint; requires new Level B scope decision and redesign of resolver logic.
  - **DEFER:** Decision remains pending; resolver cannot be provisioned as relationship tables would lack the cardinality guard.
  - **REJECT:** No active-uniqueness constraint at the storage layer; resolver's runtime cardinality check becomes the sole guard (weaker).
- **Dependencies:** Depends on D01–D03 (identity subject, no-new-identity, tenant-scoped FKs). Blocks D08 (resolver contract depends on multiplicity semantics). Independent of D10–D14.

### D05 — Owner registry lifecycle and revocation

- **Decision ID and subject:** D05 — Owner registry lifecycle and revocation.
- **Existing technical recommendation:** Registry revocation is terminal; one transaction marks the owner and its active relationships revoked with audit events; every access checks both states.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** Terminal REVOKED state; `BEGIN IMMEDIATE` transaction marks owner REVOKED, linked relationships REVOKED with timestamps, appends audit events; resolver checks both relationship and owner-registry status.
  - **AMEND:** Different revocation semantics (e.g., non-terminal revocation, deferred relationship revocation).
  - **DEFER:** Decision remains pending; owner registry schema and revocation procedure cannot be finalized.
  - **REJECT:** No terminal revocation; owner registry would lack lifecycle enforcement.
- **Dependencies:** Depends on D06 (IDs, authority reference, audit event shape). Independent of D07–D09.

### D06 — Relationship/source IDs, authority reference and audit event

- **Decision ID and subject:** D06 — Relationship/source IDs, authority reference and audit event.
- **Existing technical recommendation:** Opaque canonical lowercase UUIDv4; DB-level NOT NULL and check constraints; collision abort/transaction rollback; non-empty canonical authority record reference with digest. Append-only event records action, prior/new state, membership/binding/tenant, owner/tenant, authority reference, UTC time, actor reference and reason code—never credentials or account tokens.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** Canonical UUIDv4 IDs with DB-level NOT NULL and CHECK constraints; collision aborts transaction; non-empty authority_record_ref; audit events append-only without credentials.
  - **AMEND:** Different ID format (e.g., derived IDs), different authority reference form, or different audit event fields.
  - **DEFER:** Decision remains pending; UUID CHECK syntax and actor evidence source remain undefined.
  - **REJECT:** No UUID format constraints at the schema layer; ID format left to application logic.
- **Dependencies:** Depends on D04 (multiplicity semantics affect ID generation), D05 (revocation affects audit event fields). Blocks D08 (resolver output includes relationship ID).

### D07 — Portfolio-to-owner registry FK versus complete access facade

- **Decision ID and subject:** D07 — Portfolio-to-owner registry FK versus complete access facade.
- **Existing technical recommendation:** Adopt facade approach only if import-graph tests prove every D02 read/write path is behind the capability; otherwise require schema FK before implementation. Never retain raw OwnerRef access.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** Facade approach (a) adopted with import-graph tests proving no dispatcher bypass; OR schema FK (b) required. Raw OwnerRef access (c) explicitly rejected.
  - **AMEND:** Different boundary approach, e.g., hybrid facade+FK or explicit bypass list with review.
  - **DEFER:** Decision remains pending; D02 implementation cannot proceed because the authorization boundary is undefined.
  - **REJECT:** No non-bypassable boundary decision; raw OwnerRef access may remain (not recommended).
- **Dependencies:** Depends on D04–D06 (relationship schema). Blocks D08 (resolver/authorization contract depends on boundary). Blocks D21 (implementation authority depends on boundary being resolved).

### D08 — D02 resolver and authorization contract

- **Decision ID and subject:** D08 — D02 resolver and authorization contract.
- **Existing technical recommendation:** D02-only context derived solely from verified DB rows; all SQL predicates include resolved tenant, D02 owner, exact portfolio and revision/status; absent, duplicate, revoked, malformed, cross-tenant or foreign context yields sanitized no-data/no-effect refusal. No IPC-supplied owner/relationship.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** Resolver resolves fresh from verified DB rows; returns distinct D02 context; fail-closed matrix covers all conditions; no caller-supplied IDs.
  - **AMEND:** Different resolver output shape, different check set, or caller-supplied ID allowance (not recommended).
  - **DEFER:** Decision remains pending; resolver output shape and call-site changes cannot be finalized.
  - **REJECT:** No formal resolver contract; fail-closed behavior remains informal.
- **Dependencies:** Depends on D04–D07 (multiplicity, lifecycle, IDs, boundary). Blocks D09 (transaction boundaries depend on resolver contract). Blocks D21 (implementation scope depends on resolver contract).

### D09 — Transaction boundaries, nested work and concurrency

- **Decision ID and subject:** D09 — Transaction boundaries, nested work and concurrency.
- **Existing technical recommendation:** One wrapper owns the transaction; resolver and data query share same snapshot/connection; `BEGIN IMMEDIATE` from relation resolution through authorization and writes; nested operations reuse context/savepoints; no second connection.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** Single `BEGIN IMMEDIATE` wrapper from relation resolution through writes; same connection/snapshot for resolver and data query; nested operations reuse context/savepoints.
  - **AMEND:** Different transaction ownership model, e.g., separate resolve/commit/query phases (not recommended due to TOU race risk).
  - **DEFER:** Decision remains pending; transaction wrapper API and savepoint semantics cannot be finalized.
  - **REJECT:** No formal transaction boundary; TOUCTOU races possible between resolver and writes.
- **Dependencies:** Depends on D08 (resolver contract defines what runs inside the transaction). Blocks D21 (implementation scope depends on transaction API).

### D10 — Provider taxonomy, normalization and catalog governance

- **Decision ID and subject:** D10 — Provider taxonomy, normalization and catalog governance.
- **Existing technical recommendation:** Catalog with unique exact codes and `BROKER`/`MANUAL` type; alias normalization must resolve exactly one active code; unknown/ambiguous inputs refuse. Catalog expansion/revocation is separately governed, and revoked codes remain readable in history but unavailable for new source/import use.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** Controlled catalog with exact uppercase ASCII keys (`DHAN`, `ZERODHA`, `MANUAL_PERSONAL`); adapter maps aliases to exactly one active code; unknown/ambiguous inputs refuse; revoked codes remain readable but unavailable for new import.
  - **AMEND:** Different code set, different normalization rules, or different revocation/governance approach.
  - **DEFER:** Decision remains pending; provider catalog schema cannot be created.
  - **REJECT:** No controlled catalog; `source_broker` remains free text (existing behavior preserved).
- **Dependencies:** Depends on D04–D06 (relationship schema context). Independent of D07–D09.

### D11 — Broker-account identity and normalization

- **Decision ID and subject:** D11 — Broker-account identity and normalization.
- **Existing technical recommendation:** Use a server-owned opaque UUID token stable across imports for the same source stream; reject raw account/credential strings. Ask PA to confirm whether that provenance-level token is sufficient or provider-specific evidence/deduplication is required before asserting two streams are the same account.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** Server-issued opaque UUIDv4 token stable per provider/account stream; raw account numbers/usernames/credentials/tokens rejected; provenance-level token suffices or provider-specific evidence is required for same-account deduplication.
  - **AMEND:** Different token model (e.g., provider-specific account identifiers), different stability guarantee, or different deduplication rule.
  - **DEFER:** Decision remains pending; `source_account_ref` column and token issuance cannot be designed.
  - **REJECT:** No opaque token; provider-specific account identifiers may be stored (sensitive-data risk).
- **Dependencies:** Depends on D10 (provider catalog). Independent of D04–D09.

### D12 — Portfolio source cardinality and active uniqueness

- **Decision ID and subject:** D12 — Portfolio source cardinality and active uniqueness.
- **Existing technical recommendation:** Use (a), with partial unique index; revoked source remains historical and cannot receive new links. Distinct portfolios remain distinct even when provider is the same.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** Zero-or-more active sources per portfolio; one active source per `(tenant, owner, portfolio, provider, opaque account ref)`; manual uses `MANUAL_PERSONAL`/NULL unique per portfolio; revoked source remains historical and cannot receive new links.
  - **AMEND:** Different cardinality model (e.g., exactly one source per portfolio, or unrestricted duplicates).
  - **DEFER:** Decision remains pending; source records table and partial unique index cannot be created.
  - **REJECT:** No active-source uniqueness constraint; duplicate active origins permitted.
- **Dependencies:** Depends on D10–D11 (provider taxonomy and account identity). Independent of D04–D09.

### D13 — Root source registry versus derived evidence; row-level links

- **Decision ID and subject:** D13 — Root source registry versus derived evidence; row-level links.
- **Existing technical recommendation:** Keep the root registry and both link tables; each new row has exactly one link, written in the same transaction; validate provider/source against `source_broker`/contribution evidence. Permit mixed-source portfolios only with distinct explicit records and links.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** Root `portfolio_source_records` plus per-holding-revision and per-contribution link tables; each new row has exactly one link in the same transaction; validate provider/source against evidence; mixed-source portfolios only with distinct explicit records.
  - **AMEND:** Derive source only from existing row evidence (no root table), or root table without links.
  - **DEFER:** Decision remains pending; source records and link tables cannot be created.
  - **REJECT:** No root registry; source remains derived from existing row evidence only.
- **Dependencies:** Depends on D10–D12 (provider taxonomy, account identity, source cardinality). Blocks D17 (re-key scope depends on source tables).

### D14 — Historical source/provenance with NULL or no link

- **Decision ID and subject:** D14 — Historical source/provenance with NULL or no link.
- **Existing technical recommendation:** Preserve current values and label unknown/unlinked; only evidence-backed, separately authorized corrections may create links. Never infer from symbol/name or normalize away existing NULLs.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** NULL/unlinked preserved as `UNKNOWN`; no backfill or inference from symbol/name/broker; only evidence-backed, separately authorized corrections may create links.
  - **AMEND:** Backfill from reliable original import records, or limited inference from explicit evidence.
  - **DEFER:** Decision remains pending; historical provenance treatment remains informal.
  - **REJECT:** Backfill or inference permitted (not recommended — risks fabricating provenance).
- **Dependencies:** Depends on D13 (source registry determines what NULL means). Independent of D04–D09 and D15–D20.

### D15 — Historical S1-owner portfolio disposition

- **Decision ID and subject:** D15 — Historical S1-owner portfolio disposition.
- **Existing technical recommendation:** Do not move rows now. PA should first choose defer as the immediate safe state; decide alias versus re-key only after read-only inventory. If re-key is later chosen, migrate only rows proven to belong to the exact S1 personal identity/tenant; never merge.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** Defer/keep separate as immediate safe state; no data movement; alias vs re-key decided only after read-only inventory evidence.
  - **AMEND:** Choose alias/read projection now, or choose re-key scope now (requires D16 evidence first).
  - **DEFER:** Decision remains pending; historical portfolios remain separate indefinitely until disposition.
  - **REJECT:** Immediate re-key or alias chosen without waiting for D16 evidence (risky — may collide with live data).
- **Dependencies:** Depends on D16 (inventory evidence required before deciding which rows can safely be re-keyed). Depends on D13–D14 (source treatment affects what moves). Blocks D17–D19 (re-key scope, atomicity, recovery depend on disposition).

### D16 — Inventory scope, ownership proof and collision policy

- **Decision ID and subject:** D16 — Inventory scope, ownership proof and collision policy.
- **Existing technical recommendation:** Require a separately authorized, read-only inventory first; exact table/FK/row count/key/null/digest report, source records/links if present, `foreign_key_check`, and hashed manifest. Any collision, orphan, unknown owner, ambiguous row or restore receipt stops the whole proposed batch; no merge, overwrite, winner selection or partial migration. PA decides disposition after seeing evidence.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** Read-only inventory/manifest with batch-wide stop on any inconsistency; exact ownership proof; collision/stop policy enforced; no merge/overwrite/partial migration.
  - **AMEND:** Different collision handling (e.g., merge/overwrite — not recommended due to data loss risk).
  - **DEFER:** Decision remains pending; collision/stop policy undefined; no migration can proceed.
  - **REJECT:** No formal collision/stop policy; inconsistent batches may proceed partially.
- **Dependencies:** Depends on D15 (historical disposition affects what inventory looks for). Evidence already obtained from the 2026-11-16 read-only inventory (Q01–Q14 executed, zero collisions, pre/post byte-identical). Blocks D17–D19 (re-key depends on collision policy).

### D17 — Re-key scope and affected records

- **Decision ID and subject:** D17 — Re-key scope and affected records.
- **Existing technical recommendation:** Include `portfolios`, revisions, holdings, contributions, restore receipts and any approved source records/holding links/contribution links; preserve portfolio/source/revision IDs and evidence. Recompute owner-dependent restore fingerprints while recording old/new values in a hashed manifest; never rewrite the audit hash chain or migration ledger.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** Re-key scope defined (all owner-key tables in one batch if re-key chosen); IDs/revisions/digests preserved; owner-dependent fingerprints recomputed; audit hash chain and migration ledger never rewritten.
  - **AMEND:** Partial re-key scope (e.g., portfolios only — not recommended due to dangling references).
  - **DEFER:** Decision remains pending; re-key cannot be designed without D15 disposition and D16 evidence.
  - **REJECT:** No re-key ever; historical portfolios remain separate permanently.
- **Dependencies:** Depends on D15 (disposition determines whether re-key is chosen), D16 (collision policy), D13–D14 (source/link treatment). Requires separate Level E for actual movement.

### D18 — Schema migration boundaries and SQLite mechanics

- **Decision ID and subject:** D18 — Schema migration boundaries and SQLite mechanics.
- **Existing technical recommendation:** Append-only atomic schema migration with parent indexes first, foreign keys enabled, checksummed ledger; no data rows; tested against fresh/current synthetic schemas on the supported SQLite build. Schema change creates definitions only—not owner, relationship, provider seed, source or portfolio rows. Never edit applied migrations.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** Append-only migration pattern validated; composite FKs, `RESTRICT`, partial/expression indexes, CHECK syntax, deferred-FK behavior tested on supported SQLite build; no seed rows in migrations.
  - **AMEND:** Different migration pattern (e.g., editable migrations — not recommended due to checksum breakage).
  - **DEFER:** Decision remains pending; no D02 schema migration can be authored.
  - **REJECT:** No append-only migration constraint; schema changes may seed data or edit old migrations.
- **Dependencies:** Depends on D04–D13 (schema content depends on earlier decisions). Blocks D19 (re-key atomicity depends on migration mechanics). Independent of D15–D17 content.

### D19 — Re-key atomicity, rollback and recovery cutoff

- **Decision ID and subject:** D19 — Re-key atomicity, rollback and recovery cutoff.
- **Existing technical recommendation:** Atomic `BEGIN IMMEDIATE`, pre/post manifests, FK/count/digest checks and all-or-nothing rollback; post-commit reverse only if manifest proves no new D02 writes or conflict. Otherwise no partial reversal: use verified backup/recovery procedure and audit reconciliation under a separate approval. Never delete audit history or rewind migration ledger.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** `BEGIN IMMEDIATE` with pre/post manifests; rollback before commit on any mismatch; post-commit reverse only under separate recovery authority if no conflicting writes; otherwise restore verified backup.
  - **AMEND:** Partial compensation or different rollback cutoff (not recommended — risks split ownership).
  - **DEFER:** Decision remains pending; no re-key migration can be executed.
  - **REJECT:** No formal rollback/recovery procedure; partial reversal may overwrite new writes.
- **Dependencies:** Depends on D18 (migration mechanics) and D17 (re-key scope). Requires separate Level E for actual execution.

### D20 — Local single-user security scope

- **Decision ID and subject:** D20 — Local single-user security scope.
- **Existing technical recommendation:** Accept current local-only boundary; preserve strict indexes; any future scope expansion requires a new identity, revocation and isolation design.
- **Exact proposed disposition:** NOT APPROVED — pending Level C disposition. PA must explicitly APPROVE, AMEND (with exact replacement), DEFER, or REJECT.
- **Material consequences:**
  - **APPROVE:** One-active-membership/one-active-owner constraint confirmed for local single-user only; no hosted/multi-user/institutional support implied.
  - **AMEND:** Weaken unique indexes now (not recommended — introduces ambiguity) or design multi-principal model (broader work requiring new Level B/C).
  - **DEFER:** Decision remains pending; scope boundary undefined.
  - **REJECT:** No local-only constraint; scope may expand without new design.
- **Dependencies:** Depends on D04 (multiplicity semantics). Independent of D10–D19.

### D21 — Implementation authority

- **Decision ID and subject:** D21 — Implementation authority.
- **Existing technical recommendation:** Keep **NOT GRANTED** for the new S1-to-D02 relationship implementation until all Level C choices and acceptance criteria are explicitly accepted and a separate implementation scope is issued.
- **Exact proposed disposition:** NOT GRANTED — pending separate Level D statement. PA must explicitly grant or deny.
- **Material consequences:**
  - **GRANT (after Level C):** Narrowly scoped Level D implementation authority for specifically named code/schema/test scope, with stated exclusions and acceptance evidence. Does not authorize live database operations.
  - **DEFER:** D21 remains NOT GRANTED; no implementation work for the new S1-to-D02 relationship may proceed.
  - **DENY:** Implementation authority explicitly withheld; existing code in binding.ts requires separate disposition (see Resolver Deviation decision below).
- **Dependencies:** Depends on Level C approval of D04–D20. Independent of D22 (operational authority is separate). Does not grant D5-T5 acceptance or D6 authorization.
- **Authority note:** Owner-directed routine implementation authority under IPD-OPERATING-MODEL.md covers other in-scope IPD implementation work, but is distinct from and outside the protected D02 relationship boundary.

### D22 — Operational provisioning, historical operation, D5 evidence and D6

- **Decision ID and subject:** D22 — Operational provisioning, historical operation, D5 evidence and D6.
- **Existing technical recommendation:** Keep operational provisioning/database modification **NOT AUTHORIZED for the new S1-to-D02 relationship**, D5 **BLOCKED**, D6 **NOT STARTED**.
- **Exact proposed disposition:** NOT AUTHORIZED — pending separate Level E authorization for each named operation. PA must explicitly authorize each provisioning/migration operation, D5 acceptance, and D6 start.
- **Material consequences:**
  - **AUTHORIZE (per operation):** Separate Level E authorization for each named provisioning/migration operation with operational safeguards; D5 acceptance only after T1–T4 collectively accepted; D6 start only after D5 prerequisites satisfied.
  - **DEFER:** D22 remains NOT AUTHORIZED; D5 remains BLOCKED; D6 remains NOT STARTED.
  - **DENY:** Operational authority explicitly withheld for specified operations.
- **Dependencies:** Depends on D21 (implementation must precede provisioning). Depends on D5-T5 (separate PA acceptance). Independent of D04–D20 Level C decisions except as prerequisites.
- **Authority note:** The narrow Level E read-only D5/D16 evidence inventory approved on 2026-11-16 is EXECUTED; all mutating Level E operations remain NOT AUTHORIZED.

## Dependencies and safe sequencing

1. D01–D03 establish the approved identity subject, no-new-identity rule and tenant-scoped FK direction. D04–D06 remain pending for multiplicity, lifecycle and audit. Do not assign a relationship ID or row before separate authority and implementation/operational approvals.
2. D07–D09 establish the non-bypassable resolver/authorization boundary and its transaction semantics. D07 must be resolved before implementation because a facade that cannot be proven complete requires the schema-FK alternative.
3. D10–D14 establish provider/account identity, source cardinality, row links and historical unknown-provenance behavior. D13 depends on D10–D12; D17 depends on D13–D16.
4. D15 chooses a high-level historical disposition, but D16 evidence is required before deciding which actual rows can safely be re-keyed or whether collisions exist. Thus no final per-row re-key decision can precede completion of the authorized read-only live inventory on the Windows host.
5. D17–D19 apply only if re-key is selected; they require D18 schema mechanics, D16 preflight and separate Level E authority. No schema migration should seed or reassign data.
6. D20 limits the design to local single-user use. D21 comes only after Level C decisions; remaining D22 operational acts come only after their own scope/evidence approvals. D5 and D6 do not follow automatically from any prior level or from read-only inventory completion.

## Decisions blocked on unavailable live evidence

The repository schema inventory (migrations 001–006) identifies possible owner-bearing tables, including `portfolio_restore_receipts`; the revised design additionally lists proposed source records and source-link tables. It is not, by itself, a live data inventory. On **2026-11-16**, the Program Authority authorized a narrowly scoped, strictly non-mutating read-only D5/D16 evidence inventory of the existing local database ([approval record](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md#2-narrow-level-e-read-only-d5d16-evidence-inventory-approved-on-2026-11-16)); it was executed on the Principal's Windows host and is reconciled in [`IPD-D02-D5-D16-LIVE-EVIDENCE-RECONCILIATION-2026-11-16.md`](IPD-D02-D5-D16-LIVE-EVIDENCE-RECONCILIATION-2026-11-16.md). The live store (`C:\iips-data\iips\user-portfolio.sqlite`, 176,128 bytes, SHA-256 `6d683b3b897f09156fd51bd7ba6e5cfc3a69f734a00da9f12c103da720b70673`, pre/post byte-identical, zero sidecars) holds 3 portfolios (2 ACTIVE, 1 TOMBSTONED `DEFAULT_PORTFOLIO`), 13 revisions, 142 holdings, 6 contributions, 1 restore receipt and 2 audit events, all under `ipd-owner-ramki-personal`/`ipd-personal-local`; the active S1 tuple (`binding c5808abaffd072d6401ce63ad86c6ac0`, membership `d25dcc5370100b00766efc5166f65cf3`) resolves to `canonical_owner_id = ipd-owner-ramki-personal`, and there are **zero rows** for D02 target owner `owner-4dc756b3`. `_migration_ledger` holds `001`–`006` with matching repository checksums and no D02 ledger tables; `integrity_check` is `ok`, `foreign_key_check` reports 0 violations, `Q11a` S1-vs-D02 `portfolio_id` collisions are 0, and `Q12a` orphan checks are 0. (The 2026-11-16 Arena Linux sandbox execution confirmed the designated local database resides on the Principal's local Windows host and does not exist in the sandbox (`IIPS_G3_DATABASE_PATH` unset; zero SQLite files present); normal startup `src/ipc/entrypoint.ts` is not a read-only inventory path.)

Actual row counts, candidate historical portfolio IDs, destination collisions, orphan rows, live migration-ledger state, and provenance/NULL patterns are now **obtained** (see the reconciliation report), so D15–D19 can be evidenced—but they cannot be finalized here: D15 cannot choose between full historical inclusion, a particular alias scope and re-key readiness without separate PA disposition and operator intent evidence; D16 cannot finalize collision disposition or ownership proof without separate Level C approval (the sole blocker-unresolved record, `DEFAULT_PORTFOLIO` `Q12b`, is excluded test data, not a live D02 destination collision); D17 cannot produce re-key scope or fingerprints without a later re-key selection; D19 cannot finalize a real recovery manifest without separate approval. Inventory completion does not constitute D5 acceptance, schema approval, implementation authorization, provisioning/migration authorization or D6 authorization; the resulting evidence must be presented for separate review and acceptance.

Other evidence gaps: supported SQLite runtime behavior for candidate D02 DDL has not been validated as a schema-acceptance gate; no provider-specific account ID contract or stable opaque-token issuance evidence exists in the cited authority; no actor identity/reason-code evidence procedure is established. These are explicit inputs to D06, D10–D11 and D18, not facts to infer.

## D5-T1–T5 and D16 reconciliation against live Windows-host evidence (2026-11-16)

The five D5 acceptance components were reconciled against the verified Windows-host read-only inventory evidence bundle (`d02-d5-d16-inventory-20261116T143819255Z-96672044.zip`, SHA-256 `813183b382a26d0b6affeeaee04d44b0ea0057bea140a83221b460d8720da1b3`). D5-T1–T5 are: approved mapping, approved representation, implemented read-only verifier tests, prescribed host evidence, and separate PA acceptance. Inventory completion alone is not D5 acceptance.

| D5-T | Required condition | Evidence observed | Evidence reference | Result | Exact reason | Remaining decision / dependency |
|---|---|---|---|---|---|---|
| **D5-T1** | Approved mapping: D01–D03 relationship direction (S1 preserved, separate explicit relationship to D02 owner `owner-4dc756b3`) | D01–D03 APPROVED (2026-11-15); architectural direction APPROVED; active S1 tuple confirmed (`binding c5808abaffd072d6401ce63ad86c6ac0`, membership `d25dcc5370100b00766efc5166f65cf3`, `canonical_owner_id = ipd-owner-ramki-personal`) | Decision package D01–D03; approval record; Q04a/Q04b | PASS | D01–D03 approved as recorded; S1 identity established and preserved | Relationship not provisioned (zero `owner-4dc756b3` rows); separate PA implementation authority required |
| **D5-T2** | Approved representation: Level C detailed technical schema approval | Level C PENDING / AWAITING APPROVAL; technical design §13 defines candidate schema but is not approved | Technical design §13; tracker blocker table | FAIL | Detailed schema not yet approved by PA | Separate Level C PA approval required; no schema change implemented |
| **D5-T3** | Implemented/read-only verifier tests: D5 verifier using holdings-specific acceptance predicate | Read-only D5 verifier NOT IMPLEMENTED; only after detailed schema approval and implementation authority | Tracker blocker table; technical design §10 | FAIL | Verifier not implemented; implementation authority NOT GRANTED | Separate Level C approval + Level D implementation authority required |
| **D5-T4** | Prescribed host evidence: read-only Windows-host inventory with pre/post integrity proof | INVENTORY_COMPLETE_READ_ONLY_VERIFIED (exit code 0); pre/post DB SHA-256 byte-identical (`6d683b3b...`); zero sidecars; Q01–Q14 all EXECUTED_OK (21 statements); `integrity_check ok`, `foreign_key_check 0 violations`; audit chain verified | ZIP bundle; `01-preflight`; `02-q01-q14`; `03-migration-ledger` | PASS | All 21 Q01–Q14 statements executed OK inside read-only `BEGIN DEFERRED ... ROLLBACK`; pre/post hash equality and zero sidecars verified | Evidence must be separately accepted by PA; inventory completion is not D5 acceptance |
| **D5-T5** | Separate PA acceptance: PA acceptance of verifier predicate and prescribed host evidence | Not yet accepted; separate gate remains closed; `d5Accepted: false` | `d5-d16-inventory-summary.json`; tracker blocker table | PENDING | Separate PA acceptance required; no D5 acceptance inferred from inventory completion | PA must explicitly accept D5-T1 through D5-T4 collectively; D5 remains BLOCKED |

**D5-T1–T5 overall:** D5 remains **BLOCKED**. D5-T1 (PASS) and D5-T4 (PASS) are established; D5-T2 (FAIL — Level C pending), D5-T3 (FAIL — not implemented), and D5-T5 (PENDING — separate PA acceptance) are outstanding. No D5 acceptance is inferred from T4 inventory completion alone.

### D16 reconciliation (kept distinct from D5 conclusions)

| D16 aspect | Evidence observed | Evidence reference | Result | Exact reason | Remaining decision / dependency |
|---|---|---|---|---|---|
| Inventory scope | Read-only inventory executed on Windows host 2026-11-16; Q01–Q14 all EXECUTED_OK; schema, ledger, counts, keys, NULL patterns, integrity/FK results, collisions and orphans obtained | ZIP bundle; live evidence reconciliation report | PASS | Full Q01–Q14 inventory delivered with hashed manifest | Level C collision/stop policy still PENDING |
| Ownership proof | Zero `owner-4dc756b3` rows anywhere; active membership `canonical_owner_id = ipd-owner-ramki-personal` ≠ `owner-4dc756b3`; no relationship row exists | Q04b, Q06 results | PASS (factual observation) | No D02 destination owner portfolios exist; S1→D02 link not established | Separate PA disposition (D15) for historical portfolios under `ipd-owner-ramki-personal` |
| Collision policy | Q11a S1-vs-D02 `portfolio_id` collisions: 0; Q11b duplicate normalized symbols: 0; sole Q12b blocker-unresolved record confined to excluded `DEFAULT_PORTFOLIO` test data, not a live D02 destination collision | Q11a, Q11b, Q12b results | PASS (no live collisions) | No existing D02 destination (`owner-4dc756b3` portfolios: 0) to collide with | Level C collision/stop policy approval; separate Level E migration authority NOT AUTHORIZED |
| Historical disposition | 2 active S1-owner candidate portfolios obtained (`DHAN_PORTFOLIO`, `PERSONAL-fa8ad7bc-efec-5562-cfbd-de362b782fa2`); `DEFAULT_PORTFOLIO` excluded test data | Q06, Q08, Q09 results | OBSERVATION | D15 cannot choose between full historical inclusion, alias scope, re-key readiness without separate PA disposition and operator intent evidence | Separate PA disposition under D15/D16; no re-key, merge, or overwrite |

### Active portfolio findings (excluding `DEFAULT_PORTFOLIO` test data)

| Portfolio | Status | Revision | Holdings | NULL `security_identity` | Populated `security_identity` | Contributions | Provenance |
|---|---|---|---|---|---|---|---|
| `DHAN_PORTFOLIO` ("Dhan Broker Holdings") | ACTIVE | 1 `INITIAL` | 64 active | 63 | 1 (`CANONICAL_P04`) | 1 (`SAVED_NEW_BATCH`, all six migration-`004` columns populated) | `source_broker = DHAN`; imported before 2026-11-15 P7 4,680-mapping regeneration |
| `PERSONAL-fa8ad7bc-efec-5562-cfbd-de362b782fa2` ("TEST") | ACTIVE | 2 (rev 1 `INITIAL`, rev 2 `REPLACE` with `active = 0`) | 3 total across revisions (2 active) | 3 | 0 | 1 (all six migration-`004` columns NULL, as designed when `brokerImportProvenance` absent) | `source_broker = manual-personal`; `portfolio_name = "TEST"` flagged for explicit Principal/PA disposition under D15/D16 — never treated as ownership evidence |

### NULL identity and provenance findings

- **140 of 142 holding rows** have `NULL` `security_identity`; 2 rows populated (both in `DHAN_PORTFOLIO` rev 1). `NULL` `security_identity` is nullable under migration `005` and is not a D02 ownership-key / foreign-key blocker (technical design §13.7).
- **2 contributions** carry `NULL` migration-`004` provenance fields (1 in `DEFAULT_PORTFOLIO`, 1 in `PERSONAL-fa8ad7bc-efec-5562-cfbd-de362b782fa2`). These are expected pre-`004`/manual rows; recorded factually, never backfilled or inferred (D14).
- Do not invent mappings for the 140 NULL identity rows. No ownership inferred from portfolio names, broker names, file names, symbols, or company IDs; `Q09` never projects raw `file_name`.

### D21 and D22 authority boundaries

| Item | Status | Basis |
|---|---|---|
| **D21** | **PENDING** | No authoritative evidence establishes otherwise; remains PENDING per register disposition |
| **D22** | **UNRESOLVED — EVIDENCE REQUIRED** | No authoritative evidence establishes otherwise; remains UNRESOLVED per register disposition |

Do not infer implementation or provisioning authority from inventory evidence. Inventory completion does not constitute D5 acceptance, schema approval, implementation authorization, provisioning/migration authorization, or D6 authorization.

## Resolver Deviation Disposition — D02 Relationship Resolver Implementation (RD-2026-11-16)

This is a **separate decision matter**, distinct from D04–D20 Level C design approval. It does not combine with D04–D20 approval and does not imply D21 or D22 authority.

### Decision ID and subject

RD-2026-11-16 — Disposition of `resolveD02PortfolioAccess()` and `resolveD02PortfolioAccessInCurrentTransaction()` in `src/persistence/binding.ts` and their 12 unit tests in `tests/durable_holdings_d02_d05_unit.test.ts`.

### Existing engineering authorization

**Governing provision:** Original D02/D03/D05 engineering act
(IIPS-V3-PA-D02-D03-D05-ENGINEERING-2026-11-06-01, blob cea7fed5618ed08683cf9d12d22b0a6e02c557f4,
5-file envelope).

| Element | Authorized scope | Governing provision |
|---------|-----------------|---------------------|
| File envelope | `src/ipc/protocol.ts`, `src/ipc/dispatch.ts`, `src/persistence/binding.ts`, `src/persistence/portfolio_store.ts`, `src/persistence/brokerImportPersistence.ts` | Engineering act §2 (file envelope) |
| Activity | Local non-production IPD engineering and isolated synthetic testing | Engineering act |
| Purpose | Approved v2/owner/snapshot contract | Engineering act |
| Test fixtures | Synthetic disposable fixture binding creation for tests only | Engineering act |
| Status | Not revoked by later PENDING statuses | Decision package D21 section |

**Previously authorized code in `binding.ts`:** `resolveActiveBinding`, `resolveActiveBindingInCurrentTransaction`, `resolveActiveHoldingsBinding`, `resolveActiveHoldingsBindingInCurrentTransaction`, `HOLDINGS_CANONICAL_OWNER_ID`, `HOLDINGS_TENANT_ID`, `BindingAbsentError`, `BindingInvalidError`, Direct P1 generic resolver behavior — all unchanged.

### Exact behavior implemented

| Element | Description |
|---------|-------------|
| `D02RelationshipAbsentError` | New error class for fail-closed D02 relationship resolution |
| `ResolvedD02PortfolioAccess` | New interface with distinct `membershipOwnerId`/`portfolioOwnerId` |
| `resolveD02PortfolioAccess(db)` | Opens own `BEGIN IMMEDIATE`; validates S1 tuple + relationship + owner registry; fails closed |
| `resolveD02PortfolioAccessInCurrentTransaction(db)` | Caller-held transaction variant; requires active transaction |
| 12 unit tests | Fail-closed matrix covering all resolver conditions, using synthetic disposable fixtures |

### Why the implementation may exceed approved design authority

- The resolver implements the **D08 resolver contract** (fresh resolution from S1 tuple + relationship + active owner registry), which depends on Level C decisions D04–D09 that remain **PENDING**.
- **D21 implementation authority is NOT GRANTED** for the new S1-to-D02 relationship.
- **D22 operational provisioning is NOT AUTHORIZED.**
- While the code resides in the authorized file envelope and is fail-closed (no tables created, no rows inserted, no data modified), it implements behavior whose governing design decisions have not been approved at Level C.

### Proposed disposition choices

PA must choose one:

1. **RATIFY:** Determine that the fail-closed, no-provisioning resolver code is covered by the existing engineering act's "local non-production IPD engineering and isolated synthetic testing" authorization for `binding.ts`. The code and tests remain as evidence. No D21 or D22 authority is implied.

2. **REQUIRE MODIFICATION/REMOVAL:** Determine that the D08 resolver contract implementation requires separate Level C approval before the code can remain. Direct removal or modification of the resolver code and its tests.

3. **DEFER PENDING LEVEL C APPROVAL:** Defer disposition until Level C decisions D04–D20 are explicitly accepted. Code and tests preserved as evidence; no action taken on them now.

### Authority boundaries preserved

- **Level C:** This deviation decision is separate from D04–D20 Level C design approval. Ratification does not approve the D08 resolver contract design.
- **Level D / D21:** Ratification does not grant implementation authority. D21 remains NOT GRANTED until separately issued after Level C approval.
- **Level E / D22:** Ratification does not authorize operational provisioning or migration. D22 remains NOT AUTHORIZED.
- **D5-T5:** Ratification does not constitute D5 acceptance. D5-T5 remains a separate acceptance requirement.

---

## Explicit Program Authority statements requested

The Program Authority has recorded `APPROVE` for D01–D03 (2026-11-15) and `APPROVE` for the narrowly scoped, strictly non-mutating Level E read-only D5/D16 evidence inventory (2026-11-16) in the linked [approval record](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md). For D04–D22 register dispositions, record explicitly `APPROVE`, `AMEND` (with exact replacement rule), or `DEFER/REJECT`. A non-response or general endorsement is not acceptance. Suggested form:

> I, acting as Program Authority, approve/amend/defer decision IDs ____. My approval is limited to Level C detailed design unless a separate Level D implementation statement is explicitly included below. Except for the already-recorded narrow 2026-11-16 read-only D5/D16 evidence inventory, I do not authorize operational database mutation, provisioning or migration unless I separately state its exact scope, environment, evidence procedure and rollback authority. D5/D6 status is unchanged unless separately decided.

Then, if applicable, issue separately:

- **Level C:** “I approve the remaining detailed design choices identified by D04–D20, as amended in the attached/referenced record.” D01–D03 are already recorded as approved. Any such approval covers design only, not implementation or operations.
- **Level D:** “I grant implementation authority for the specifically named code/schema/test scope, with stated exclusions and acceptance evidence.” This does not authorize live database operations.
- **Level E:** “I authorize only the named specific provisioning/migration operation, on the stated environment and records, with the named operator, backup, pre/post evidence, collision stop rules, rollback/recovery and audit procedure.” (The narrow 2026-11-16 read-only D5/D16 evidence inventory is already recorded; no blanket Level E grant is implied.)
- **D5:** “I accept the named verifier predicate and host-specific evidence for this run.” Synthetic tests or inventory completion alone are insufficient.
- **D6:** issue a separate start decision only after D5 and all D6 prerequisites are satisfied.

## Final approval checklist

- [ ] Confirm Levels A and B remain as already approved; do not conflate either with C–E.
- [x] D01–D03 approved exactly as recorded; do not infer approval beyond those defaults.
- [x] Narrow Level E read-only D5/D16 evidence inventory approved (2026-11-16) strictly without database mutation, migration execution, provisioning, D5 acceptance or D6 authorization.
- [ ] Record an explicit disposition for each **D04–D22**; their proposed defaults remain `NOT APPROVED` until accepted.
- [ ] Resolve any change to the high-level S1-preserving relationship direction through a new Level B decision.
- [ ] Approve/amend detailed schema, tenant FKs, multiplicity, lifecycle, source catalogue/cardinality/links and transaction/authorization boundaries (Level C).
- [ ] Confirm that the local single-user limitation is accepted; do not imply hosted/multi-user support.
- [ ] Keep historical row treatment provisional: the authorized live Windows host inventory and collision evidence were collected `2026-11-16` ([reconciliation report](IPD-D02-D5-D16-LIVE-EVIDENCE-RECONCILIATION-2026-11-16.md)) and await separate review.
- [ ] Keep migration/recovery design separate from migration execution; no partial or inferred re-key.
- [ ] If desired, issue Level D implementation authority separately and narrowly.
- [ ] If desired, issue each remaining Level E provisioning/migration authority separately with operational safeguards.
- [ ] Keep D5 **BLOCKED** until the approved verifier and prescribed host evidence pass and are separately accepted; keep D6 **NOT STARTED** pending its own authority.
- [ ] Confirm no relationship, owner, provider, source or portfolio rows are created by this decision package or by read-only inventory.

## Current status

- Product ownership: **APPROVED**.
- Architectural direction: **APPROVED**.
- Revised design baseline: **ACCEPTED WITH CONDITIONS** (independent engineering review only).
- D01–D03: **APPROVED** as recorded (2026-11-15); D04–D22 outstanding Program Authority register decisions: **PENDING** (19 items).
- Narrow Level E read-only D5/D16 evidence inventory: **APPROVED** as recorded (2026-11-16) and **EXECUTED** on the Principal's Windows host (`INVENTORY_COMPLETE_READ_ONLY_VERIFIED`, exit code `0`; Linux sandbox run safely stopped on Windows host database unreachability); inventory completion is not D5 acceptance.
- Detailed schema approval: **PENDING**.
- Implementation authority: **NOT GRANTED**.
- Operational provisioning, database mutation and migration: **NOT AUTHORIZED**.
- D5: **BLOCKED**.
- D6: **NOT STARTED**.

**Except for the recorded D01–D03 design defaults (2026-11-15) and the narrowly scoped, strictly non-mutating read-only D5/D16 evidence inventory (2026-11-16), this package remains a decision request, not an approval. No implementation, database modification, migration execution, identity or relationship provisioning, owner reassignment, tombstone restoration, reset/replacement, D5 verifier implementation/acceptance, D6 operation, IPC/live holdings startup, dependency installation or IRR change is authorized.**
