# IPD Program Authority decision package — D02 overall personal portfolio ownership

**Prepared:** 2026-11-15 (filename follows the requested 2026-11-16 package identifier; updated 2026-11-16 to record the narrow PA read-only D5/D16 evidence inventory approval)
**Owner:** IPD (`ramkivs/iips-production-market-data`)
**Decision status:** **D01–D03 APPROVED as recorded (2026-11-15); narrow Level E read-only D5/D16 evidence inventory APPROVED as recorded (2026-11-16); D04–D22 register dispositions PENDING. Pending proposed defaults remain NOT APPROVED until explicitly accepted by the Program Authority.**
**Approval boundary:** This package requests decisions; except as recorded in the linked [approval record](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md) (D01–D03 discrete Level C defaults on 2026-11-15, and a strictly non-mutating Level E read-only D5/D16 evidence inventory of the existing local database on 2026-11-16), it grants no schema approval, implementation instruction, database mutation, identity/relationship/owner/source provisioning, migration authorization, D5 acceptance or D6 authorization.

## Executive summary

Product ownership and the high-level architecture are already approved: `owner-4dc756b3` is the overall owner for personal investment portfolios, and the existing S1 identity, binding, membership, S1 owner value and Direct P1 behavior are preserved while a separate explicit relationship connects the existing personal identity to D02. The four portfolios—Dhan, Zerodha, Manual Portfolio A and Manual Portfolio B—must remain four distinct portfolio identities with their own source evidence, provenance and history under that overall owner.

The detailed schema is **AWAITING APPROVAL**. The current design baseline proposes a relationship anchored to the established S1 membership, a tenant-safe owner registry, constrained relationship/source records, explicit source-to-holding and source-to-contribution links, a transaction-bound D02 access boundary, and a separate, later-authorized historical-data decision. The independent review's outcome remains **ACCEPTED WITH CONDITIONS** as a design baseline only.

This register contains **22 decision items**: **D01–D03 APPROVED** (2026-11-15) and a **narrow Level E read-only D5/D16 evidence inventory APPROVED** (2026-11-16) by the explicit PA directions recorded in the [approval record](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md); **D04–D22 register items remain PENDING**. Recommendations for pending items remain NOT APPROVED. Historical-data choices cannot be finalized until the authorized read-only live database inventory identifies actual rows, null provenance, foreign-key state and destination collisions on the Principal's local Windows host. In the 2026-11-16 Arena Linux sandbox run, the designated Windows database (`C:\iips-data\iips\user-portfolio.sqlite`) was unreachable/absent (`IIPS_G3_DATABASE_PATH` unset; zero SQLite files present), so safe execution stopped without touching or creating any database; see the [D5/D16 read-only inventory and host-blocker report](IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md).

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
| **E — Operational provisioning and migration** | **NARROW READ-ONLY INVENTORY AUTHORIZED (2026-11-16); ALL PROVISIONING AND MIGRATION NOT AUTHORIZED** | On 2026-11-16, the Program Authority authorized strictly non-mutating read-only inspection of the existing local database solely for D5 identity-mapping evidence and D16 historical inventory/collision assessment (recorded in the [approval record](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md#2-narrow-level-e-read-only-d5d16-evidence-inventory-approved-on-2026-11-16)). Schema changes, migration execution, `_migration_ledger` writes, portfolio/holding writes, identity/relationship/owner/source row creation, historical re-keying, tombstone restoration, reset/replacement, startup invoking migrations, D5 acceptance and D6 execution remain **NOT AUTHORIZED**. |

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

- **What / why:** Decide whether one S1 membership may have multiple active overall-owner relationships and whether one overall owner may be linked to multiple active memberships. This is an explicit single-user model choice.
- **Alternatives and consequences:** (a) one active relationship per membership/type and one active membership per tenant/owner/type; (b) permit multiple memberships per owner for multiple devices/principals; (c) allow multiple active owners for a membership. (b)/(c) need different identity and authorization semantics and can make owner resolution ambiguous.
- **Technical recommendation — NOT APPROVED:** Keep both partial unique indexes enforcing one-to-one active linkage for this local single-user scope. Multiple historical REVOKED rows remain allowed.
- **Risk / S1 effect / approval:** This intentionally blocks future multi-device or multi-principal use until a new authority-approved design. It does not alter current S1 values. **Level C approval requested; scope expansion requires a new Level B/C decision, not an ad-hoc index relaxation.**

### D05 — Owner registry lifecycle and revocation

- **What / why:** Decide whether owner-registry entries can be revoked, whether revocation is terminal, and what happens to active relationships pointing at a revoked owner. FKs prove existence, not active authorization.
- **Alternatives and consequences:** (a) terminal REVOKED state and atomically revoke all active relationships with audit; (b) leave active relationships in place but make every resolver reject them; (c) allow owner reactivation or silent relationship reactivation. (b) leaves confusing stale rows; (c) weakens revocation history.
- **Technical recommendation — NOT APPROVED:** Registry revocation is terminal for that identity; one transaction marks the owner and its active relationships revoked and appends audit events. Every access also checks both states. Re-establishment requires renewed authority and a new relationship ID; do not silently reactivate.
- **Risk / S1 effect / approval:** Recovery from mistaken revocation requires a new explicit authority path; S1 itself remains untouched. **Level C approval requested.**

### D06 — Relationship/source IDs, authority reference and audit event

- **What / why:** Decide ID format/generation, collision response, authority-reference form, and which actor/reason/audit fields are mandatory. IDs and audit records are evidence and lifecycle controls, not arbitrary labels.
- **Alternatives and consequences:** (a) canonical UUIDv4 with NOT NULL/format checks, cryptographic generation after authorization, collision abort; (b) derive IDs from S1/source/account values, risking leakage/correlation and deterministic collisions; (c) application-only format checks. Authority reference could be a canonical IPD record plus content digest, or an authority-defined immutable catalogue.
- **Technical recommendation — NOT APPROVED:** Opaque canonical lowercase UUIDv4; DB-level NOT NULL and check constraints; collision abort/transaction rollback; non-empty canonical authority record reference with digest. Append-only event records action, prior/new state, membership/binding/tenant, owner/tenant, authority reference, UTC time, actor reference and reason code—never credentials or account tokens. Do not invent actor identity or reason vocabulary.
- **Risk / S1 effect / approval:** SQLite CHECK support and actor evidence source remain to validate/define; no ID is generated now. **Level C approval requested for exact fields, reference, actor source and reason taxonomy.**

### D07 — Portfolio-to-owner registry FK versus complete access facade

- **What / why:** Current portfolios do not FK to the proposed owner registry. Decide whether the production D02 boundary is a private capability-gated facade or a schema rebuild adding a portfolio-to-registry FK.
- **Alternatives and consequences:** (a) make the private transaction-bound facade the only production-facing store API and prove no dispatcher can call raw owner-taking methods; (b) add a schema-level FK, potentially requiring table rebuild/compatibility work; (c) retain today's raw `OwnerRef` access, which leaves an internal bypass.
- **Technical recommendation — NOT APPROVED:** Adopt (a) only if architecture/import-graph tests prove every D02 read/write path is behind the capability; otherwise require (b) before implementation. Never accept (c).
- **Risk / S1 effect / approval:** Facade completeness is an implementation risk; a schema change has migration/compatibility risk. Direct P1 remains on its generic S1 path. **Level C approval requested for the boundary and fallback; no code or migration authority follows.**

### D08 — D02 resolver and authorization contract

- **What / why:** Decide how the relationship becomes a D02 owner context, what exact checks are mandatory, which IDs are derived versus request-controlled, and refusal behavior. This prevents request data or a constant from selecting the owner.
- **Alternatives and consequences:** (a) resolve fresh from the sole active S1 tuple, relationship and active owner registry; return a distinct D02 context; (b) accept owner/relationship IDs from IPC or cache the result; (c) change generic `ActiveOwner` globally. (b)/(c) create spoofing/race or Direct P1 regression risk.
- **Technical recommendation — NOT APPROVED:** D02-only context derived solely from verified DB rows; all SQL predicates include resolved tenant, D02 owner, exact portfolio and revision/status; absent, duplicate, revoked, malformed, cross-tenant or foreign context yields sanitized no-data/no-effect refusal. No IPC-supplied owner/relationship.
- **Risk / S1 effect / approval:** Every consumer path must be inventoried; fail-closed behavior can temporarily make D02 unavailable. S1/Direct P1 must remain byte-for-byte semantically unchanged. **Level C approval requested.**

### D09 — Transaction boundaries, nested work and concurrency

- **What / why:** Decide how validation remains consistent with the read or mutation, and who owns the DB connection/transaction. Separate relation-resolution and data queries allow revocation races.
- **Alternatives and consequences:** (a) same-connection read snapshot; writes use `BEGIN IMMEDIATE` from relation resolution through authorization and all writes; (b) resolve/commit then query separately; (c) open nested independent transactions/connections. (b)/(c) permit time-of-check/time-of-use races or partial writes.
- **Technical recommendation — NOT APPROVED:** One wrapper owns the transaction; resolver and data query share the same snapshot/connection. A write validates, authorizes, writes source/portfolio/link rows and commits atomically; errors roll back all. Nested operations reuse the context/savepoint; they cannot commit the outer transaction or open another connection.
- **Risk / S1 effect / approval:** Locking/concurrency and transaction API need synthetic tests. Keep the existing generic resolver behavior for Direct P1. **Level C approval requested; no implementation is authorized.**

### D10 — Provider taxonomy, normalization and catalog governance

- **What / why:** Decide whether source providers are a controlled catalog or arbitrary strings, which codes are initially recognized, who can add/revoke a code, and how adapter aliases map to a canonical code.
- **Alternatives and consequences:** (a) exact uppercase ASCII catalog keys such as `DHAN`, `ZERODHA`, `MANUAL_PERSONAL`; adapters map known aliases to one active key; (b) persist caller strings; (c) hard-code only the current two brokers. (b) enables spelling/identity drift; (c) blocks future approved providers.
- **Technical recommendation — NOT APPROVED:** Catalog with unique exact codes and `BROKER`/`MANUAL` type; alias normalization must resolve exactly one active code; unknown/ambiguous inputs refuse. Catalog expansion/revocation is separately governed, and revoked codes remain readable in history but unavailable for new source/import use.
- **Risk / S1 effect / approval:** The approved product scope includes other supported brokers, but their exact code list and governance are not established. No S1 effect. **Level C/product taxonomy approval requested.**

### D11 — Broker-account identity and normalization

- **What / why:** Decide what stable key distinguishes a broker source stream without storing account numbers, usernames, credentials or tokens. The current authority does not specify provider account-ID formats or same-account cross-import deduplication.
- **Alternatives and consequences:** (a) server-issued opaque canonical UUIDv4 stable for one provider/account stream; (b) store normalized provider account identifiers, adding sensitive-data and provider-specific normalization risk; (c) random token per import, which cannot recognize a continuing source stream; (d) provenance digest alone, which identifies an artifact, not necessarily an account.
- **Technical recommendation — NOT APPROVED:** Use a server-owned opaque UUID token stable across imports for the same source stream; reject raw account/credential strings. Ask PA to confirm whether that provenance-level token is sufficient or provider-specific evidence/deduplication is required before asserting two streams are the same account.
- **Risk / S1 effect / approval:** Token issuance/stability and cross-file deduplication remain unspecified. No S1 effect. **Level C and provider-identity policy approval requested; no real token/account lookup is authorized.**

### D12 — Portfolio source cardinality and active uniqueness

- **What / why:** Decide how many source records a portfolio may have, including whether hybrid portfolios and multiple streams of one provider are allowed, and what active tuple is unique.
- **Alternatives and consequences:** (a) zero-or-more over lifecycle, with one active source per `(tenant, owner, portfolio, provider, opaque account ref)`; manual uses `MANUAL_PERSONAL`/NULL and is unique per portfolio; (b) exactly one source per portfolio; (c) unrestricted duplicates. (b) rules out explicit hybrid/import provenance; (c) permits duplicate active origins.
- **Technical recommendation — NOT APPROVED:** Use (a), with partial unique index; revoked source remains historical and cannot receive new links. Distinct portfolios remain distinct even when provider is the same.
- **Risk / S1 effect / approval:** Hybrid workflows add validation complexity and may need provider-level duplicate-account rules. No S1 effect. **Level C approval requested, including manual/hybrid policy.**

### D13 — Root source registry versus derived evidence; row-level links

- **What / why:** Decide whether a portfolio-level source registry is required or whether source should be derived from existing holding/contribution evidence. If a registry is kept, decide how every new holding revision and import contribution binds to it and how mismatches are refused.
- **Alternatives and consequences:** (a) proposed root `portfolio_source_records` plus restrictive per-holding-revision and per-contribution link tables; (b) derive source only from existing row evidence, avoiding a root table but making portfolio-level origins/cardinality less explicit; (c) root table without links, which permits a Dhan root to disagree with Zerodha/manual rows.
- **Technical recommendation — NOT APPROVED:** Keep the root registry and both link tables; each new row has exactly one link, written in the same transaction; validate provider/source against `source_broker`/contribution evidence. Permit mixed-source portfolios only with distinct explicit records and links.
- **Risk / S1 effect / approval:** Additional schema and historical link treatment are required. Existing provenance must not be overwritten. **Level C approval requested.**

### D14 — Historical source/provenance with NULL or no link

- **What / why:** Decide how existing contribution/holding records that predate the source registry are displayed and whether any are backfilled. Migration 004 deliberately left some historical import provenance NULL; no operational rows have been inspected.
- **Alternatives and consequences:** (a) leave NULL/unlinked as `UNKNOWN` until evidence-backed disposition; (b) backfill from reliable original import records; (c) infer from symbol, portfolio name or likely broker. (c) fabricates provenance; (b) requires evidence review and scope.
- **Technical recommendation — NOT APPROVED:** Preserve current values and label unknown/unlinked; only evidence-backed, separately authorized corrections may create links. Never infer from symbol/name or normalize away existing NULLs.
- **Risk / S1 effect / approval:** Historical provenance can remain incomplete in D02 listings. S1/Direct P1 is unaffected. **Level C approval for treatment; each future correction needs its own operational authorization.**

### D15 — Historical S1-owner portfolio disposition

- **What / why:** Choose whether historical portfolios owned by `ipd-owner-ramki-personal` are initially separate from D02, exposed through an explicit alias/read projection, or re-keyed to `owner-4dc756b3`. The high-level ownership direction does not decide where existing rows live.
- **Alternatives and consequences:** (a) defer/keep separate—safest and no data movement, but D02 cannot claim complete history; (b) a fully specified alias/read projection—avoids rewriting keys but adds dual-owner query, authorization, provenance and lifecycle complexity; (c) exact audited re-key—aligns storage with D02 owner but changes existing keys and needs inventory, collision policy, backup and separate authority.
- **Technical recommendation — NOT APPROVED:** Do not move rows now. PA should first choose defer as the immediate safe state; decide alias versus re-key only after read-only inventory. If re-key is later chosen, migrate only rows proven to belong to the exact S1 personal identity/tenant; never merge.
- **Risk / S1 effect / approval:** Defer means historical portfolios may not appear in D02 until a later decision. Alias can expose query leaks; re-key can affect recovery/idempotency. S1 identity itself stays unchanged, but row owners might change under (c). **Level C disposition now; separate Level E approval for any inventory/movement.**

### D16 — Inventory scope, ownership proof and collision policy

- **What / why:** Decide the exact preflight evidence and what happens when the live store has an existing D02 destination, orphan, cross-tenant row, duplicate key, ambiguous provenance or non-invertible restore receipt. Repository migrations 001–006 give a schema inventory, not actual row state.
- **Alternatives and consequences:** (a) read-only inventory/manifest, exact ownership proof, batch-wide stop on any inconsistency; (b) resolve collisions by merging/overwriting/choosing a winner; (c) skip conflicting rows and partially migrate. (b)/(c) risk silent data loss, mixed ownership and partial history.
- **Technical recommendation — NOT APPROVED (narrow Level E read-only inventory authorized 2026-11-16; Level C collision/stop policy still PENDING):** Require a separately authorized, read-only inventory first; exact table/FK/row count/key/null/digest report, source records/links if present, `foreign_key_check`, and hashed manifest. Any collision, orphan, unknown owner, ambiguous row or restore receipt stops the whole proposed batch; no merge, overwrite, winner selection or partial migration. PA decides disposition after seeing evidence.
- **Risk / S1 effect / approval:** On 2026-11-16 the Program Authority granted narrow Level E read-only inspection authority for D5/D16 evidence collection (see [approval record](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md#2-narrow-level-e-read-only-d5d16-evidence-inventory-approved-on-2026-11-16)); in the 2026-11-16 Linux sandbox pass, the local Windows database (`C:\iips-data\iips\user-portfolio.sqlite`) was unreachable/absent, so actual counts, candidate IDs and collisions remain unknown pending Windows host execution (see [D5/D16 inventory and blocker report](IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md)). No S1 change occurs during read-only inventory. **Level C policy disposition still PENDING; narrow Level E read-only inventory APPROVED (2026-11-16); separate Level E migration authority still NOT AUTHORIZED.**

### D17 — Re-key scope and affected records

- **What / why:** If PA later allows re-key, decide exactly which tables/fields move, and how restore idempotency and source lineage are preserved. A partial table list breaks FKs or auditability.
- **Alternatives and consequences:** (a) exact proven portfolio rows and all owner-key children in one authorized batch; (b) only change `portfolios`; (c) migrate holdings but omit contributions, restore receipts, sources or links. (b)/(c) leave dangling or inconsistent history.
- **Technical recommendation — NOT APPROVED:** Include `portfolios`, revisions, holdings, contributions, restore receipts and any approved source records/holding links/contribution links; preserve portfolio/source/revision IDs and evidence. Recompute owner-dependent restore fingerprints while recording old/new values in a hashed manifest; never rewrite the audit hash chain or migration ledger.
- **Risk / S1 effect / approval:** Exact applied schema and live data must be verified before SQL is designed. S1 principal/membership values remain unchanged, but portfolio owner keys would change if re-key is authorized. **Level C migration design only; actual movement requires Level E.**

### D18 — Schema migration boundaries and SQLite mechanics

- **What / why:** Decide whether new relationship/source schema is an append-only migration, how supported SQLite features and existing migration-ledger behavior are validated, and whether schema changes ever seed records.
- **Alternatives and consequences:** (a) append-only atomic schema migration with parent indexes first, foreign keys enabled, checksummed ledger; no data rows; (b) edit old migrations, risking checksum/history breakage; (c) combine schema and operational row creation/data movement, coupling rollback and authority.
- **Technical recommendation — NOT APPROVED:** (a), tested against fresh/current synthetic schemas on the supported SQLite build: composite FKs, `RESTRICT`, partial/expression indexes, CHECK syntax, deferred-FK behavior and rollback. Schema change creates definitions only—not owner, relationship, provider seed, source or portfolio rows. Never edit applied migrations.
- **Risk / S1 effect / approval:** Actual SQLite version/behavior is not yet evidenced in this package; incompatible syntax must block approval. No S1 data effect. **Level C schema approval; migration implementation remains Level D and no database operation is authorized.**

### D19 — Re-key atomicity, rollback and recovery cutoff

- **What / why:** Decide when a failed or post-commit migration can be reversed, and what happens after new D02 writes make reversal unsafe.
- **Alternatives and consequences:** (a) one transaction, pre-commit rollback on any mismatch, reverse only before new/conflicting D02 writes; otherwise restore verified backup/reconcile under separate authority; (b) partial compensation; (c) unconditional inverse update. (b)/(c) can overwrite new writes or create split ownership.
- **Technical recommendation — NOT APPROVED:** Atomic `BEGIN IMMEDIATE`, pre/post manifests, FK/count/digest checks and all-or-nothing rollback; post-commit reverse only if manifest proves no new D02 writes or conflict. Otherwise no partial reversal: use verified backup/recovery procedure and audit reconciliation under a separate approval. Never delete audit history or rewind migration ledger.
- **Risk / S1 effect / approval:** Recovery may require downtime and backup reconciliation; a post-write rollback may be impossible without a recovery plan. No operation authorized. **Level C procedure approval; actual recovery/migration is Level E.**

### D20 — Local single-user security scope

- **What / why:** Confirm the one-active-membership/one-active-owner constraint is intentionally local single-user and not a hosted, multi-user, multi-device or institutional authorization model.
- **Alternatives and consequences:** (a) approve current local-only boundary and stop if scope grows; (b) weaken unique indexes now; (c) design a multi-principal model. (b) introduces ambiguity without solving authorization; (c) is broader work.
- **Technical recommendation — NOT APPROVED:** Accept (a). Preserve strict indexes; any future scope expansion requires a new identity, revocation and isolation design.
- **Risk / S1 effect / approval:** Does not support later multi-device/multi-user use without redesign. No S1 effect. **Level C scope approval; a changed product scope requires a new Level B/C decision.**

### D21 — Implementation authority

- **What / why:** Decide whether engineering may implement the approved detailed schema, resolver, authorization facade, source links and synthetic tests. Review acceptance and schema approval are not implementation authority.
- **Alternatives and consequences:** (a) grant a narrowly scoped Level D authority after Level C approval; (b) defer; (c) allow implementation based only on the current architecture direction. (c) violates the documented approval boundary.
- **Technical recommendation — NOT APPROVED:** Keep **NOT GRANTED** until all Level C choices and acceptance criteria are explicitly accepted and a separate implementation scope is issued. No code, migrations or verifier work under this package.
- **Risk / S1 effect / approval:** Deferral keeps D02 fail-closed and unavailable through this new relationship; implementation after approval still needs S1/Direct P1 regression evidence. No current S1 change. **Separate Level D statement required; Level C cannot imply it.**

### D22 — Operational provisioning, historical operation, D5 evidence and D6

- **What / why:** Decide later whether to create owner/relationship/provider/source rows, inspect or move live records, perform host-specific D5 verification, or begin D6. These are different operational acts with different risk and evidence.
- **Alternatives and consequences:** (a) no operations now and request each separately after design/implementation; (b) combine relationship provisioning, data migration and D5 in one run; (c) infer success from synthetic tests/readiness. (b)/(c) bypass independent controls and do not establish host evidence.
- **Technical recommendation — NOT APPROVED (narrow Level E read-only D5/D16 evidence inventory authorized 2026-11-16; all provisioning, mutation, migration, D5 acceptance and D6 remain NOT AUTHORIZED):** Keep operational provisioning/database modification **NOT AUTHORIZED**, D5 **BLOCKED**, D6 **NOT STARTED**. Execute the separately authorized 2026-11-16 read-only inventory on the Windows host without database mutation; request any approved migration/provisioning separately; D5 needs the prescribed read-only verifier and exact host evidence; D6 needs its own prerequisites and authority.
- **Risk / S1 effect / approval:** D02 remains blocked until independently authorized and verified. D5/D6 are not S1 changes but must preserve Direct P1. **Narrow Level E read-only D5/D16 inventory APPROVED on 2026-11-16 ([approval record](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md#2-narrow-level-e-read-only-d5d16-evidence-inventory-approved-on-2026-11-16)); separate Level E authorization still required for each provisioning/migration operation, separate D5 acceptance/evidence decision, and separate D6 authority.**

## Dependencies and safe sequencing

1. D01–D03 establish the approved identity subject, no-new-identity rule and tenant-scoped FK direction. D04–D06 remain pending for multiplicity, lifecycle and audit. Do not assign a relationship ID or row before separate authority and implementation/operational approvals.
2. D07–D09 establish the non-bypassable resolver/authorization boundary and its transaction semantics. D07 must be resolved before implementation because a facade that cannot be proven complete requires the schema-FK alternative.
3. D10–D14 establish provider/account identity, source cardinality, row links and historical unknown-provenance behavior. D13 depends on D10–D12; D17 depends on D13–D16.
4. D15 chooses a high-level historical disposition, but D16 evidence is required before deciding which actual rows can safely be re-keyed or whether collisions exist. Thus no final per-row re-key decision can precede completion of the authorized read-only live inventory on the Windows host.
5. D17–D19 apply only if re-key is selected; they require D18 schema mechanics, D16 preflight and separate Level E authority. No schema migration should seed or reassign data.
6. D20 limits the design to local single-user use. D21 comes only after Level C decisions; remaining D22 operational acts come only after their own scope/evidence approvals. D5 and D6 do not follow automatically from any prior level or from read-only inventory completion.

## Decisions blocked on unavailable live evidence

The repository schema inventory (migrations 001–006) identifies possible owner-bearing tables, including `portfolio_restore_receipts`; the revised design additionally lists proposed source records and source-link tables. It is not a live data inventory. On **2026-11-16**, the Program Authority authorized a narrowly scoped, strictly non-mutating read-only D5/D16 evidence inventory of the existing local database ([approval record](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md#2-narrow-level-e-read-only-d5d16-evidence-inventory-approved-on-2026-11-16)). In the 2026-11-16 Arena Linux sandbox execution ([D5/D16 inventory and blocker report](IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md)), safe preflight established a genuinely read-only `node:sqlite` inspection method and verified why normal startup (`src/ipc/entrypoint.ts`) must not be used, but confirmed that the designated local database (`C:\iips-data\iips\user-portfolio.sqlite`) resides on the Principal's local Windows host and does not exist in the Linux sandbox (`IIPS_G3_DATABASE_PATH` unset; zero SQLite files present). Accordingly, execution stopped safely without creating or touching any database, and actual row counts, candidate historical portfolio IDs, destination collisions, orphan rows, live migration-ledger state, and the presence of any proposed source rows remain **unknown / not obtained** until the read-only query set is executed on the Windows host.

Consequently, D15 cannot choose safely between full historical inclusion, a particular alias scope and re-key readiness; D16 cannot finalize collision disposition or ownership proof; D17 cannot produce exact row coverage or fingerprints; D19 cannot finalize a real recovery manifest. Even when the authorized read-only inventory is completed on the Windows host, inventory completion does not constitute D5 acceptance, schema approval, implementation authorization, provisioning/migration authorization or D6 authorization; the resulting evidence must be presented for separate review and acceptance.

Other evidence gaps: supported SQLite runtime behavior for candidate D02 DDL has not been validated as a schema-acceptance gate; no provider-specific account ID contract or stable opaque-token issuance evidence exists in the cited authority; no actor identity/reason-code evidence procedure is established. These are explicit inputs to D06, D10–D11 and D18, not facts to infer.

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
- [ ] Keep historical row treatment provisional until the authorized live Windows host inventory and collision evidence are collected and separately reviewed.
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
- Narrow Level E read-only D5/D16 evidence inventory: **APPROVED** as recorded (2026-11-16; Linux sandbox run safely stopped on Windows host database unreachability — host execution pending).
- Detailed schema approval: **PENDING**.
- Implementation authority: **NOT GRANTED**.
- Operational provisioning, database mutation and migration: **NOT AUTHORIZED**.
- D5: **BLOCKED**.
- D6: **NOT STARTED**.

**Except for the recorded D01–D03 design defaults (2026-11-15) and the narrowly scoped, strictly non-mutating read-only D5/D16 evidence inventory (2026-11-16), this package remains a decision request, not an approval. No implementation, database modification, migration execution, identity or relationship provisioning, owner reassignment, tombstone restoration, reset/replacement, D5 verifier implementation/acceptance, D6 operation, IPC/live holdings startup, dependency installation or IRR change is authorized.**
