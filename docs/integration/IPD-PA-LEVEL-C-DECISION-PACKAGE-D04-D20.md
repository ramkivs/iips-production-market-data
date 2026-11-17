# IPD PA Level C Decision Package — D04–D20 detailed technical schema

**Document ID:** `IPD-PA-LEVEL-C-DECISION-PACKAGE-D04-D20`<br>
**Date:** `2026-11-16`<br>
**Repository:** `ramkivs/iips-production-market-data` (IPD)<br>
**Branch:** `arena/c32aea42-iips-production-market-data`<br>
**Commit:** `3dc6663f472ee35f38d952b225a43fe8e756aebb`<br>
**Status:** Decision package submitted for Program Authority review — **PENDING PA DECISION**. This document requests a decision; it does not grant schema approval, implementation authority, provisioning authority, or permission to begin D6.

---

## 1. Decision requested

**Decision requested from the Program Authority:**

> Approve or amend the detailed Level C technical schema for D04–D20 (relationship lifecycle, owner registry, source taxonomy/cardinality/links, resolver/authorization contract, transaction boundaries, historical row treatment, migration mechanics, and single-user scope), as specified in the revised relationship technical design `IPD-D02-OWNERSHIP-RELATIONSHIP-TECHNICAL-DESIGN-2026-11-15.md` §§13.1–13.11.

**This decision is limited to Level C detailed design.** It does not:

- Grant D21 Level D implementation authority (remains **NOT GRANTED**)
- Grant D22 Level E operational provisioning/migration authority (remains **UNRESOLVED — NOT AUTHORIZED**)
- Constitute D5 acceptance (D5-T5 remains **PENDING**)
- Authorize D6 (remains **NOT STARTED**)
- Authorize any database write, migration, row creation, or provisioning

---

## 2. Executive summary

The approved architectural direction (Level B) preserves the existing S1 identity/binding/membership and connects that identity to D02 overall owner `owner-4dc756b3` through a separate explicit ownership relationship. D01–D03 are APPROVED as discrete Level C defaults. The remaining Level C design decisions D04–D20 are PENDING and require explicit Program Authority approval before any implementation can occur.

D5-T2 (Approved representation / Level C detailed schema approval) currently reads **FAIL** because Level C is not yet approved. This decision package is the evidence-backed input that would allow the PA to move D5-T2 from FAIL to PASS — but only if the PA explicitly approves Level C. D5-T3 (read-only verifier) remains separately gated by D21 Level D implementation authority, and D5-T5 remains a separate PA acceptance decision after T1–T4 are satisfied.

**Current gate snapshot (per decision package `IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md` and tracker `IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md`):**

| Item | Status | Decision needed |
|---|---|---|
| Level C detailed schema (D04–D20) | **PENDING / AWAITING APPROVAL** | PA explicit approval or amendment |
| D5-T2 (approved representation) | **FAIL** | Level C approval (this package) |
| D21 Level D implementation authority | **NOT GRANTED** | Separate Level D statement (after Level C) |
| D5-T3 (read-only verifier) | **FAIL** | Depends on T2 PASS + D21 grant |
| D5-T5 (separate PA acceptance) | **PENDING** | Depends on T1–T4 all satisfied |
| D22 Level E operational authority | **NOT AUTHORIZED** | Separate Level E authorization(s) |
| D6 | **NOT STARTED** | After D5 passes + D6 prerequisites |

---

## 3. Scope and exclusions

### In scope

- The complete detailed Level C technical schema as specified in `IPD-D02-OWNERSHIP-RELATIONSHIP-TECHNICAL-DESIGN-2026-11-15.md`, §§13.1–13.11:
  - D04: Relationship multiplicity and active uniqueness
  - D05: Owner registry lifecycle and revocation
  - D06: Relationship/source IDs, authority reference and audit event
  - D07: Portfolio-to-owner registry FK versus complete access facade
  - D08: D02 resolver and authorization contract
  - D09: Transaction boundaries, nested work and concurrency
  - D10: Provider taxonomy, normalization and catalog governance
  - D11: Broker-account identity and normalization
  - D12: Portfolio source cardinality and active uniqueness
  - D13: Root source registry versus derived evidence; row-level links
  - D14: Historical source/provenance with NULL or no link
  - D15: Historical S1-owner portfolio disposition
  - D16: Inventory scope, ownership proof and collision policy
  - D17: Re-key scope and affected records
  - D18: Schema migration boundaries and SQLite mechanics
  - D19: Re-key atomicity, rollback and recovery cutoff
  - D20: Local single-user security scope

### Explicitly out of scope

- D21 Level D implementation authority (**NOT GRANTED** — separate decision)
- D22 Level E operational provisioning/migration authorization (**NOT AUTHORIZED** — separate decision)
- D5-T5 separate PA acceptance (**PENDING** — separate decision)
- D6 IRR integration (**NOT STARTED** — separate decision)
- Any schema implementation, migration execution, database write, row creation, provisioning, or operational activation
- Any IRR repository change
- Any change to `main` branch
- Any PR merge

---

## 4. Authoritative source register

| Ref | Document | Location | Role |
|---|---|---|---|
| S1 | `IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md` | §Decision register D04–D20; §Current status; §Dependencies and safe sequencing | D04–D20 definitions, statuses, dependencies, approval boundary |
| S2 | `IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md` | §Recorded approvals; §Decisions not approved | PA approvals recorded (D01–D03; narrow read-only inventory); prohibitions; D5 BLOCKED; D6 NOT STARTED |
| S3 | `IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md` | Blocker and resolution criteria; D5-T1–T5 reconciliation table | D5-T2 FAIL; Level C PENDING; implementation authority NOT GRANTED |
| S4 | `IPD-D02-OWNERSHIP-RELATIONSHIP-TECHNICAL-DESIGN-2026-11-15.md` | §1, §2, §3–9, §10, §11, §13 (condition-closure addendum), §13.1–13.11 | Candidate detailed Level C schema; exact provisions; decisions still required |
| S5 | `IPD-D02-OWNERSHIP-RELATIONSHIP-DESIGN-ACCEPTANCE-REVIEW-2026-11-15.md` | Independent review outcome | ACCEPTED WITH CONDITIONS as design baseline only |
| S6 | `IPD-D02-D5-D16-LIVE-EVIDENCE-RECONCILIATION-2026-11-16.md` | §4 (D5-T1–T5 reconciliation); §5 (exact remaining blockers) | D5-T1–T5 results; host evidence bundle |
| S7 | `evidence/d02-inventory-2026-11-16/windows-host/d02-d5-d16-inventory-20261116T143819255Z-96672044.zip` | SHA-256 `813183b382a26d0b6affeeaee04d44b0ea0057bea140a83221b460d8720da1b3` | T4 host evidence bundle (T4 CONFIRMED) |
| S8 | `evidence/d02-inventory-2026-11-16/d5-d16-readonly-inventory-status-2026-11-16.json` | gateSeparationStatus | `d5Accepted: false`; `d16DetailedSchemaApproved: false`; `implementationAuthorized: false` |

Fixed approved identifiers (from S4 §2, confirmed by S1 D01–D03):

| Field | Approved value |
|---|---|
| Principal label | `ramki-personal-local` |
| Tenant | `ipd-personal-local` |
| S1 canonical owner | `ipd-owner-ramki-personal` |
| Binding ID | `c5808abaffd072d6401ce63ad86c6ac0` |
| Membership ID | `d25dcc5370100b00766efc5166f65cf3` |
| D02 portfolio owner | `owner-4dc756b3` |

---

## 5. D04–D20 provision-by-provision assessment

Each item below records its exact identifier, authoritative title, current status, technical requirement, source location, supporting evidence, outstanding questions, and whether it requires PA approval. Source terminology is preserved; no provisions are invented or silently reconciled.

### D04 — Relationship multiplicity and active uniqueness

| Field | Value |
|---|---|
| Identifier / title | D04 — Relationship multiplicity and active uniqueness |
| Current status | **NOT APPROVED** (Level C approval requested; proposed default NOT APPROVED) |
| Technical requirement | Decide whether one S1 membership may have multiple active overall-owner relationships and whether one overall owner may be linked to multiple active memberships. Single-user model choice. |
| Authoritative source | S1 §D04; S4 §13.2 partial unique indexes; S4 §13.8 single-user scope |
| Proposed default | One active relationship per membership/type and one active membership per tenant/owner/type; partial unique indexes `uq_active_relationship_per_membership` and `uq_active_membership_per_overall_owner`; multiple historical REVOKED rows remain allowed |
| Outstanding questions | Scope expansion to multi-device/multi-principal requires a new authority-approved design; no implicit weakening of one-to-one active indexes |
| Requires PA approval? | **Yes** — Level C |

### D05 — Owner registry lifecycle and revocation

| Field | Value |
|---|---|
| Identifier / title | D05 — Owner registry lifecycle and revocation |
| Current status | **NOT APPROVED** (Level C approval requested; proposed default NOT APPROVED) |
| Technical requirement | Decide whether owner-registry entries can be revoked, whether revocation is terminal, and what happens to active relationships pointing at a revoked owner. |
| Authoritative source | S1 §D05; S4 §3.1 owner registry; S4 §4 relationship lifecycle |
| Proposed default | Registry revocation is terminal; one transaction marks owner and active relationships revoked with audit; re-establishment requires renewed authority and new relationship ID |
| Outstanding questions | Actor identity/reason-code evidence procedure not established; exact revocation policy is a separate PA decision |
| Requires PA approval? | **Yes** — Level C |

### D06 — Relationship/source IDs, authority reference and audit event

| Field | Value |
|---|---|
| Identifier / title | D06 — Relationship/source IDs, authority reference and audit event |
| Current status | **NOT APPROVED** (Level C approval requested; proposed default NOT APPROVED) |
| Technical requirement | Decide ID format/generation, collision response, authority-reference form, and mandatory actor/reason/audit fields. |
| Authoritative source | S1 §D06; S4 §13.1 identifier and state constraints; S4 §13.2 relationship schema |
| Proposed default | Opaque canonical lowercase UUIDv4; DB NOT NULL + CHECK constraints; collision abort/transaction rollback; non-empty canonical authority record reference with digest; append-only audit events |
| Outstanding questions | SQLite CHECK support and actor evidence source not yet validated; no ID is generated now |
| Requires PA approval? | **Yes** — Level C |

### D07 — Portfolio-to-owner registry FK versus complete access facade

| Field | Value |
|---|---|
| Identifier / title | D07 — Portfolio-to-owner registry FK versus complete access facade |
| Current status | **NOT APPROVED** (Level C approval requested; proposed default NOT APPROVED) |
| Technical requirement | Decide whether the production D02 boundary is a private capability-gated facade or a schema rebuild adding a portfolio-to-registry FK. D07 must be resolved before implementation because a facade that cannot be proven complete requires the schema-FK alternative. |
| Authoritative source | S1 §D07; S4 §13.5 authorization boundary |
| Proposed default | Adopt capability-gated facade only if architecture/import-graph tests prove every D02 read/write path is behind the capability; otherwise require schema-level FK before implementation |
| Outstanding questions | Facade completeness is an implementation risk; Direct P1 remains on generic S1 path |
| Requires PA approval? | **Yes** — Level C |

### D08 — D02 resolver and authorization contract

| Field | Value |
|---|---|
| Identifier / title | D08 — D02 resolver and authorization contract |
| Current status | **NOT APPROVED** (Level C approval requested; proposed default NOT APPROVED) |
| Technical requirement | Decide how the relationship becomes a D02 owner context, mandatory checks, derived vs request-controlled IDs, and refusal behavior. Prevent request data or a constant from selecting the owner. |
| Authoritative source | S1 §D08; S4 §5 D02 resolver; S4 §13.5 resolver contract |
| Proposed default | D02-only context derived solely from verified DB rows; all SQL predicates include resolved tenant, D02 owner, exact portfolio and revision/status; absent/duplicate/revoked/malformed/cross-tenant/foreign context yields sanitized refusal; no IPC-supplied owner/relationship |
| Outstanding questions | Every consumer path must be inventoried; fail-closed behavior can temporarily make D02 unavailable |
| Requires PA approval? | **Yes** — Level C |

### D09 — Transaction boundaries, nested work and concurrency

| Field | Value |
|---|---|
| Identifier / title | D09 — Transaction boundaries, nested work and concurrency |
| Current status | **NOT APPROVED** (Level C approval requested; proposed default NOT APPROVED) |
| Technical requirement | Decide how validation remains consistent with read/mutation, and who owns the DB connection/transaction. Separate relation-resolution and data queries allow revocation races. |
| Authoritative source | S1 §D09; S4 §13.5 write/read modes; S4 §13.5 `withD02PortfolioAccess` wrapper |
| Proposed default | One wrapper owns transaction; resolver and data query share same snapshot/connection; `BEGIN IMMEDIATE` from relation resolution through authorization and all writes; nested operations reuse context/savepoint |
| Outstanding questions | Locking/concurrency and transaction API need synthetic tests; generic resolver behavior for Direct P1 must remain |
| Requires PA approval? | **Yes** — Level C |

### D10 — Provider taxonomy, normalization and catalog governance

| Field | Value |
|---|---|
| Identifier / title | D10 — Provider taxonomy, normalization and catalog governance |
| Current status | **NOT APPROVED** (Level C/product taxonomy approval requested; proposed default NOT APPROVED) |
| Technical requirement | Decide whether source providers are a controlled catalog or arbitrary strings, which codes are initially recognized, who can add/revoke a code, and how adapter aliases map to canonical code. |
| Authoritative source | S1 §D10; S4 §13.3 provider catalogue |
| Proposed default | Catalog with unique exact uppercase ASCII codes (`DHAN`, `ZERODHA`, `MANUAL_PERSONAL`, other supported brokers); alias normalization resolves exactly one active code; unknown/ambiguous inputs refuse |
| Outstanding questions | Exact code list for other supported brokers not established; catalog expansion/revocation is separately governed |
| Requires PA approval? | **Yes** — Level C |

### D11 — Broker-account identity and normalization

| Field | Value |
|---|---|
| Identifier / title | D11 — Broker-account identity and normalization |
| Current status | **NOT APPROVED** (Level C and provider-identity policy approval requested; proposed default NOT APPROVED) |
| Technical requirement | Decide what stable key distinguishes a broker source stream without storing account numbers, usernames, credentials or tokens. |
| Authoritative source | S1 §D11; S4 §13.3 provider/account-reference normalization |
| Proposed default | Server-owned opaque UUIDv4 token stable for one provider/account stream; reject raw account/credential strings; MANUAL uses NULL account ref |
| Outstanding questions | Whether provenance-level token suffices or provider-specific evidence/deduplication required before asserting two streams are same account; PA to confirm |
| Requires PA approval? | **Yes** — Level C |

### D12 — Portfolio source cardinality and active uniqueness

| Field | Value |
|---|---|
| Identifier / title | D12 — Portfolio source cardinality and active uniqueness |
| Current status | **NOT APPROVED** (Level C approval requested; proposed default NOT APPROVED) |
| Technical requirement | Decide how many source records a portfolio may have, including hybrid portfolios and multiple streams of one provider, and what active tuple is unique. |
| Authoritative source | S1 §D12; S4 §13.4 portfolio-source cardinality |
| Proposed default | Zero-or-more over lifecycle; one active source per `(tenant, owner, portfolio, provider_code, source_account_ref)`; manual unique per portfolio; revoked source remains historical |
| Outstanding questions | Hybrid workflows add validation complexity; may need provider-level duplicate-account rules |
| Requires PA approval? | **Yes** — Level C |

### D13 — Root source registry versus derived evidence; row-level links

| Field | Value |
|---|---|
| Identifier / title | D13 — Root source registry versus derived evidence; row-level links |
| Current status | **NOT APPROVED** (Level C approval requested; proposed default NOT APPROVED) |
| Technical requirement | Decide whether a portfolio-level source registry is required or whether source should be derived from existing holding/contribution evidence; if kept, how every new holding revision and import contribution binds to it. |
| Authoritative source | S1 §D13; S4 §13.4 source records and link tables |
| Proposed default | Keep root `portfolio_source_records` plus restrictive per-holding-revision and per-contribution link tables; each new row has exactly one link in same transaction; validate provider/source against evidence |
| Outstanding questions | Whether `portfolio_source_records` is required at all; existing per-holding/per-import provenance must not be lost |
| Requires PA approval? | **Yes** — Level C |

### D14 — Historical source/provenance with NULL or no link

| Field | Value |
|---|---|
| Identifier / title | D14 — Historical source/provenance with NULL or no link |
| Current status | **NOT APPROVED** (Level C approval for treatment; each future correction needs separate operational authorization) |
| Technical requirement | Decide how existing contribution/holding records predating source registry are displayed; whether any are backfilled. Migration 004 deliberately left some historical import provenance NULL. |
| Authoritative source | S1 §D14; S4 §13.4 historical NULL provenance |
| Proposed default | Preserve current values and label unknown/unlinked; only evidence-backed, separately authorized corrections may create links; never infer from symbol/name or normalize away NULLs |
| Outstanding questions | Historical provenance can remain incomplete in D02 listings; each correction needs operational authorization |
| Requires PA approval? | **Yes** — Level C |

### D15 — Historical S1-owner portfolio disposition

| Field | Value |
|---|---|
| Identifier / title | D15 — Historical S1-owner portfolio disposition |
| Current status | **NOT APPROVED** (Level C disposition now; separate Level E approval for any inventory/movement) |
| Technical requirement | Choose whether historical portfolios owned by `ipd-owner-ramki-personal` are initially separate from D02, exposed through explicit alias/read projection, or re-keyed to `owner-4dc756b3`. |
| Authoritative source | S1 §D15; S4 §13.7 historical-record compatibility |
| Proposed default | Do not move rows now; PA should first choose defer as immediate safe state; decide alias versus re-key only after read-only inventory |
| Outstanding questions | D15 cannot choose between full historical inclusion, alias scope and re-key readiness without separate PA disposition and operator intent evidence |
| Requires PA approval? | **Yes** — Level C (disposition); separate Level E for any movement |

### D16 — Inventory scope, ownership proof and collision policy

| Field | Value |
|---|---|
| Identifier / title | D16 — Inventory scope, ownership proof and collision policy |
| Current status | **NOT APPROVED** (narrow Level E read-only inventory authorized 2026-11-16; Level C collision/stop policy still PENDING) |
| Technical requirement | Decide exact preflight evidence and what happens when the live store has an existing D02 destination, orphan, cross-tenant row, duplicate key, ambiguous provenance or non-invertible restore receipt. |
| Authoritative source | S1 §D16; S4 §13.7 preflight and collision policy; S6 live evidence reconciliation |
| Proposed default | Read-only inventory first; exact table/FK/row count/key/null/digest report; any collision/orphan/unknown owner/ambiguous row/restore receipt stops the whole batch; no merge/overwrite/winner selection/partial migration |
| Outstanding evidence | Live inventory executed (2026-11-16): Q11a collisions 0, Q12b confined to excluded DEFAULT_PORTFOLIO test data; but Level C collision/stop policy not yet disposed |
| Requires PA approval? | **Yes** — Level C collision/stop policy |

### D17 — Re-key scope and affected records

| Field | Value |
|---|---|
| Identifier / title | D17 — Re-key scope and affected records |
| Current status | **NOT APPROVED** (Level C migration design only; actual movement requires Level E) |
| Technical requirement | If PA later allows re-key, decide exactly which tables/fields move and how restore idempotency and source lineage are preserved. |
| Authoritative source | S1 §D17; S4 §13.7 atomic re-key proposal |
| Proposed default | Include portfolios, revisions, holdings, contributions, restore receipts and approved source records/links; preserve IDs/revisions/provenance; recompute owner-dependent restore fingerprints; record old/new values in hashed manifest |
| Outstanding questions | Exact applied schema and live data must be verified before SQL is designed; no re-key selected yet |
| Requires PA approval? | **Yes** — Level C design; separate Level E for any movement |

### D18 — Schema migration boundaries and SQLite mechanics

| Field | Value |
|---|---|
| Identifier / title | D18 — Schema migration boundaries and SQLite mechanics |
| Current status | **NOT APPROVED** (Level C schema approval; migration implementation remains Level D) |
| Technical requirement | Decide whether new relationship/source schema is an append-only migration, how supported SQLite features and migration-ledger behavior are validated, and whether schema changes ever seed records. |
| Authoritative source | S1 §D18; S4 §13.7 schema migration mechanics |
| Proposed default | Append-only atomic schema migration; parent indexes first; foreign keys enabled; checksummed ledger; no data rows; never edit applied migrations |
| Outstanding questions | Supported SQLite runtime behavior for candidate D02 DDL not yet validated as schema-acceptance gate |
| Requires PA approval? | **Yes** — Level C schema approval |

### D19 — Re-key atomicity, rollback and recovery cutoff

| Field | Value |
|---|---|
| Identifier / title | D19 — Re-key atomicity, rollback and recovery cutoff |
| Current status | **NOT APPROVED** (Level C procedure approval; actual recovery/migration is Level E) |
| Technical requirement | Decide when a failed or post-commit migration can be reversed, and what happens after new D02 writes make reversal unsafe. |
| Authoritative source | S1 §D19; S4 §13.9 rollback/recovery |
| Proposed default | Atomic `BEGIN IMMEDIATE`; pre/post manifests; FK/count/digest checks; all-or-nothing rollback; post-commit reverse only if manifest proves no new D02 writes or conflict; otherwise verified backup recovery under separate approval |
| Outstanding questions | No operation authorized; recovery may require downtime and backup reconciliation |
| Requires PA approval? | **Yes** — Level C procedure |

### D20 — Local single-user security scope

| Field | Value |
|---|---|
| Identifier / title | D20 — Local single-user security scope |
| Current status | **NOT APPROVED** (Level C scope approval; proposed default NOT APPROVED) |
| Technical requirement | Confirm the one-active-membership/one-active-owner constraint is intentionally local single-user and not a hosted, multi-user, multi-device or institutional authorization model. |
| Authoritative source | S1 §D20; S4 §13.8 explicit local single-user security scope |
| Proposed default | Accept local-only boundary; preserve strict indexes; any future scope expansion requires new identity/revocation/isolation design |
| Outstanding questions | Does not support later multi-device/multi-user use without redesign |
| Requires PA approval? | **Yes** — Level C |

---

## 6. Complete detailed Level C schema

### Purpose and scope

The Level C representation translates the approved architectural direction (preserve S1 identity/binding/membership; connect to D02 owner `owner-4dc756b3` via separate explicit ownership relationship) into a detailed schema, resolver, lifecycle, history, tests and acceptance criteria. It is **additive and contextual**: a local-principal membership proves the personal identity; a separate ownership relationship supplies the overall portfolio owner. The D02 owner is not copied into, substituted for, or derived from S1's membership owner.

### Components and relationships

1. **`portfolio_owner_registry`** — catalogues owner identities that can be targets of a personal portfolio relationship. Not an authentication table; does not create an owner by itself. Future approved row: `(ipd-personal-local, owner-4dc756b3)`.
2. **`personal_identity_owner_relationships`** — links one existing local-principal membership to a portfolio owner. S1 membership row and its `canonical_owner_id` remain unchanged.
3. **`portfolio_source_provider_catalog`** — controlled provider catalogue (`DHAN`, `ZERODHA`, `MANUAL_PERSONAL`, other supported brokers).
4. **`portfolio_source_records`** — portfolio-level origin records linking portfolios to provider/source streams.
5. **`portfolio_holding_source_links`** — per holding revision, exactly one source record link.
6. **`portfolio_contribution_source_links`** — per import contribution, exactly one source record link.
7. **Composite parent unique indexes** — `uq_membership_id_tenant` on `local_principal_memberships(membership_id, tenant_id)`; `uq_portfolio_tenant_owner_id` on `portfolios(tenant_id, canonical_owner_id, portfolio_id)`.
8. **Partial unique active indexes** — one ACTIVE relationship per membership/type; one ACTIVE membership per owner/tenant/type; one active source per portfolio/provider/account tuple.

### Required fields, constraints and semantics

- All UUID keys (`relationship_id`, `source_record_id`, provider `source_account_ref`) are canonical lowercase UUIDv4, `TEXT NOT NULL PRIMARY KEY`, with CHECK constraints enforcing length 36, lowercase, hyphens at positions 9/14/19/24, version '4' at position 15, variant '8|9|a|b' at position 20, hex-only characters.
- `status` values restricted to `ACTIVE`/`REVOKED` with CHECK: `ACTIVE iff revoked_at IS NULL`; `REVOKED iff revoked_at IS NOT NULL`.
- `authority_record_ref` non-empty; canonical IPD record path/identifier plus recorded content digest (traceability, not authorization substitute).
- Composite FKs with `ON DELETE RESTRICT`; relationship history never cascade-deleted.
- `membership_tenant_id = owner_tenant_id` CHECK.
- Broker requires non-null opaque UUIDv4 account ref; manual requires NULL account ref and `MANUAL_PERSONAL` provider.
- `provenance_digest` when present: 64 hex chars.

### Validation and conformance requirements

- Fresh migration creates all approved tables/indexes and preserves migration checksums 001–006.
- SQLite `foreign_keys=ON`; `PRAGMA foreign_key_check` reports 0 violations.
- Composite parent indexes created before FK tables; partial unique indexes reject duplicate ACTIVE rows.
- UUID CHECK verified on supported SQLite build in disposable tests; if unsupported, validate canonical UUIDv4 in non-bypassable insert boundary.
- All tests use disposable synthetic databases; no operational DB or live holdings.

### Ownership and repository boundaries

- IPD repository only. No IRR changes.
- S1 identity, binding, membership remain byte-for-byte unchanged.
- Generic `resolveActiveBinding` and DP-V8 remain unchanged for Direct P1.
- D02-specific context resolved by separate relationship function/type; no global redefinition of `ActiveOwner`.
- Server-owned `IIPS_LOCAL_PERSONAL_USE=1`, scope checks, Gate 4/5 default-deny preserved.

### Dependencies on D01–D03 and other approved decisions

- D01 (APPROVED): existing S1 membership `d25dcc5370100b00766efc5166f65cf3` as FK subject; verify binding `c5808abaffd072d6401ce63ad86c6ac0`, principal `ramki-personal-local`, tenant `ipd-personal-local`, S1 owner `ipd-owner-ramki-personal`, ACTIVE statuses.
- D02 (APPROVED): no new D02 principal/binding/membership; relationship ID is separate opaque record ID, not new identity ID.
- D03 (APPROVED): composite tenant-scoped FKs; matching membership/tenant references; `RESTRICT` deletes.

### Unresolved technical or governance questions

- Exact SQLite version support for partial/expression indexes, CHECKs, deferred FK behavior and UUID CHECKs (not yet evidenced).
- Actor identity/reason-code evidence procedure not established.
- Provider catalogue extension governance not established.
- Stable-token sufficiency vs provider-specific evidence/deduplication not confirmed by PA.
- Historical S1-owner row treatment (defer/alias/re-key) not chosen; live inventory evidence obtained but disposition pending.
- Whether `portfolio_source_records` is required at all (product/schema decision).

### Classification of provisions

| Classification | Provisions |
|---|---|
| Existing approved provisions | D01–D03 (Level C defaults, APPROVED 2026-11-15); Level B architectural direction (APPROVED); Level A product ownership (APPROVED) |
| Proposed provisions awaiting approval | All of D04–D20 (Level C); schema DDL in §§3.1–3.4, 13.1–13.4; resolver contract §5/§13.5; migration mechanics §9/§13.7; test plan §10/§13.9 |
| Unresolved provisions | Actor/reason vocabulary; provider catalogue extensions; stable-token policy; historical row treatment choice; source registry requirement |
| Excluded matters | D21 implementation authority; D22 operational authorization; D5-T5 acceptance; D6; any database writes or migrations |

---

## 7. Technical validation and supporting evidence

| Validation item | Source evidence | Status |
|---|---|---|
| D01–D03 APPROVED (2026-11-15) | S2 §Recorded approvals; S1 §D01–D03 | CONFIRMED |
| Level C detailed schema AWAITING APPROVAL | S4 §Disposition; S4 §13.10.1 | CONFIRMED |
| Implementation authority NOT GRANTED | S1 Level D; S3 Implementation authority row | CONFIRMED |
| D5 BLOCKED | S1 Current status; S3 D5 completion row | CONFIRMED |
| D6 NOT STARTED | S1 Current status; S3 D6 row | CONFIRMED |
| Read-only inventory executed 2026-11-16 | S6 §4; S7 ZIP SHA-256 `813183b3...` | CONFIRMED (T4) |
| Q11a collisions 0 | S6 §5; S7 ZIP `05-collision...json` | CONFIRMED |
| Q12b confined to DEFAULT_PORTFOLIO test data | S6 §3.2; S7 ZIP | CONFIRMED (excluded test data) |
| d5Accepted: false | S8 gateSeparationStatus | CONFIRMED |
| d16DetailedSchemaApproved: false | S8 gateSeparationStatus | CONFIRMED |
| implementationAuthorized: false | S8 gateSeparationStatus | CONFIRMED |

No unsupported schema provisions have been introduced in this package; all technical statements cite S4 (technical design) or S1 (decision package). No conflicts have been silently resolved — where §13 supersedes earlier illustrative fragments (§§3, 8–11), that supersession rule is stated explicitly in S4 §13.

---

## 8. Outstanding issues and ambiguities

1. **SQLite version support** — candidate DDL (partial indexes, expression indexes, CHECKs, deferred FKs, UUID CHECKs) not yet validated against the supported SQLite build in disposable tests. This is an explicit input to D18.
2. **Actor identity and reason-code vocabulary** — not established; explicit input to D06, D10–D11 and D18 (per S1 "Decisions blocked on unavailable live evidence").
3. **Provider catalogue extension governance** — exact code list for other supported brokers not established; catalog expansion/revocation separately governed (D10).
4. **Stable-token sufficiency** — PA/product review must decide whether server-owned opaque UUIDv4 token suffices or provider-specific evidence/deduplication is required (D11).
5. **Source registry requirement** — whether `portfolio_source_records` is required at all, or source is derived from existing holding/contribution evidence (D13 product/schema decision).
6. **Historical S1-owner row treatment** — defer / alias / re-key not chosen; D15 cannot be finalized without separate PA disposition and operator intent evidence.
7. **Facade vs schema FK** — D07 must be resolved before implementation; a facade that cannot be proven complete requires the schema-FK alternative.

---

## 9. Dependencies and decision consequences

### Dependency chain

```
Level C approval (D04–D20, this package)
        │
        ▼
   D5-T2 may move from FAIL to PASS
        │
        ▼
   D21 Level D implementation authority (separate PA decision)
        │
        ▼
   D5-T3 verifier implementation (IPD engineering, after T2 + D21)
        │
        ▼
   D5-T5 separate PA acceptance (after T1–T4 all satisfied)
        │
        ▼
   D5 gate passes
        │
        ▼
   D6 start decision (separate PA decision, after D5 + D6 prerequisites)
```

### If PA approves Level C

- D5-T2 may be reconsidered against the approved representation (could move from FAIL to PASS).
- D5-T3 remains separately gated by D21 Level D implementation authority (still NOT GRANTED).
- D5-T5 still requires separate PA acceptance after T1–T4 are satisfied (still PENDING).
- D21 and D22 authority are NOT implied by Level C approval.

### If PA rejects Level C

- Affected provisions requiring revision: all of D04–D20 as amended or rejected.
- D5-T2 remains FAIL (Level C not approved).
- D5-T3 remains blocked (depends on T2).
- D5-T5 remains PENDING (depends on T1–T4).
- D5 remains BLOCKED; D6 remains NOT STARTED.
- D02 exact-membership-owner resolver remains in force and fails closed for the S1 tuple.

### If PA defers the decision

- Unresolved questions recorded in §8 above.
- Evidence required for reconsideration: PA disposition on each deferred item; SQLite validation results; actor/reason policy; provider catalogue confirmation.
- No automatic mapping, schema inference, row change, D5, or D6 follows.

---

## 10. Separate D21, D22 and D5-T5 boundaries

| Decision | Meaning | Current boundary | Separate from Level C? |
|---|---|---|---|
| Level C / D04–D20 | Approval of detailed technical schema | Submitted for PA decision (this package) | — |
| D21 / Level D | Implementation authority | **NOT GRANTED** | Yes — separate Level D statement required after Level C |
| D22 / Level E | Operational provisioning and related authorization | **UNRESOLVED — NOT AUTHORIZED** | Yes — separate Level E authorization(s) required |
| D5-T5 | Separate PA acceptance of completed D5 requirements | **PENDING** | Yes — separate PA acceptance decision after T1–T4 satisfied |
| D6 | IRR integration | **NOT STARTED** | Yes — after D5 passes + D6 prerequisites/authority |

Level C approval does not grant D21, D22, D5-T5, or D6 authority. Each requires its own explicit PA decision.

---

## 11. PA decision record section

**Status: PENDING PA DECISION.** This section is left explicitly unpopulated. The Program Authority must record its decision below; no fields are pre-filled on the PA's behalf.

| Field | Value (to be completed by PA) |
|---|---|
| Decision ID | |
| Decision date | |
| Authority reference | |
| Decision (APPROVE / AMEND / DEFER / REJECT) | |
| Approved scope (D04–D20 items, as amended) | |
| Conditions attached | |
| Level C detailed schema: APPROVE / AMEND / DEFER / REJECT | |
| D21 Level D implementation authority: (separate statement required; not granted here) | |
| D22 Level E operational authorization: (separate statement required; not authorized here) | |
| D5-T5 acceptance: (separate decision required; not accepted here) | |
| D6 start: (separate decision required; not started here) | |
| PA signature / authority confirmation | |

**Suggested form:**

> I, acting as Program Authority, approve/amend/defer decision IDs D04–D20 as follows: ____. My approval is limited to Level C detailed design unless a separate Level D implementation statement is explicitly included below. Except for the already-recorded narrow 2026-11-16 read-only D5/D16 evidence inventory, I do not authorize operational database mutation, provisioning or migration unless I separately state its exact scope, environment, evidence procedure and rollback authority. D5/D6 status is unchanged unless separately decided.

**If applicable, issue separately:**

- **Level C:** "I approve the remaining detailed design choices identified by D04–D20, as amended in the attached/referenced record." D01–D03 are already recorded as approved. Any such approval covers design only, not implementation or operations.
- **Level D:** "I grant implementation authority for the specifically named code/schema/test scope, with stated exclusions and acceptance evidence." This does not authorize live database operations.
- **Level E:** "I authorize only the named specific provisioning/migration operation, on the stated environment and records, with the named operator, backup, pre/post evidence, collision stop rules, rollback/recovery and audit procedure."
- **D5:** "I accept the named verifier predicate and host-specific evidence for this run." Synthetic tests or inventory completion alone are insufficient.
- **D6:** issue a separate start decision only after D5 and all D6 prerequisites are satisfied.

---

## Final report

- Assessment: **COMPLETE** (decision package prepared; awaiting PA decision)
- D04–D20 coverage: **All 17 items assessed** (D04, D05, D06, D07, D08, D09, D10, D11, D12, D13, D14, D15, D16, D17, D18, D19, D20) — all currently NOT APPROVED / Level C PENDING
- Exact outstanding PA questions: Level C schema approval (D04–D20); separate Level D implementation authority (D21); separate Level E operational authorization (D22); separate PA D5 acceptance (T5); separate D6 start
- Source records consulted: S1–S8 (decision package, approval record, tracker, technical design, acceptance review, live evidence reconciliation, evidence ZIP, status JSON)
- Validation results: all 17 D04–D20 items accounted for; every material technical statement cites S1 or S4; no unsupported provisions introduced; existing approvals not misrepresented; no conflicts silently resolved; D21/D22 separate; D5-T2 not marked PASS; D5-T3 unimplemented; D5-T5 pending; D6 NOT STARTED
- Files changed: `docs/integration/IPD-PA-LEVEL-C-DECISION-PACKAGE-D04-D20.md` (new)
- Published branch: `arena/c32aea42-iips-production-market-data`
- Published commit: to be published (see below)
- Remote verification: to be performed (see below)
- Explicitly untouched: `src/`, migrations, `DEFAULT_PORTFOLIO` test data, active portfolio data, IRR, D6, `main` branch, no PR merge, no PA approval recorded
- Package ready for PA review: **Yes** (all source records cited; all 17 items assessed; decision record section left PENDING)

Now let me validate the document and commit/publish it.
<tool_call>
<function=bash>