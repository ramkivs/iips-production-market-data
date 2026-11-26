# IPD architecture proposal — D02 personal portfolio ownership with S1 compatibility

**Document status:** **DESIGN PROPOSAL PREPARED / AWAITING PROGRAM AUTHORITY APPROVAL.** This document is not an approved identity mapping, schema decision, migration, provisioning instruction, D5 acceptance, or D6 authorization.

**Product ownership:** **APPROVED** — D02 owner `owner-4dc756b3` represents the overall owner of the user's personal investment portfolios across broker-imported and manually entered sources.
**Technical identity mapping:** **PENDING.**
**Schema design:** **PROPOSAL PREPARED / AWAITING APPROVAL.**
**Operational provisioning:** **NOT AUTHORIZED.**
**D5:** **BLOCKED.**
**D6:** **NOT STARTED.**

This IPD-owned proposal was prepared by inspecting current source and published IPD authority records on the designated IPD branch. No IRR repository was modified. No database, identity record, runtime, environment, migration, or verifier was changed or executed.

## 1. Executive summary

The product decision is clear: one IIPS personal user owns all personal portfolios under D02 owner `owner-4dc756b3`, irrespective of whether a portfolio came from Dhan, Zerodha, another supported broker, or manual entry. Distinct portfolios, their holdings, and source provenance must remain independently identifiable and manageable. Existing S1 identity and Direct P1 behavior must continue unchanged.

The current implementation does **not** yet implement that combined contract. S1's active membership is keyed to `ipd-owner-ramki-personal`; D02's holdings resolver accepts only a sole active binding/membership whose owner is `owner-4dc756b3` on `ipd-personal-local`. Migration 003 permits at most one ACTIVE membership per database, so one membership cannot simultaneously contain both owner values. The manual and broker write authorization path also compares the active membership's owner directly to the requested portfolio owner.

**Recommendation for Program Authority review:** preserve the existing S1 binding and membership as the local principal/Direct P1 identity; represent the overall portfolio owner as a distinct domain relationship from that membership to the already-approved D02 owner; resolve that relationship afresh and fail closed for every D02 portfolio operation; and use the D02 owner, tenant, and individual portfolio ID as the portfolio data key. Add an additive owner-link representation and portfolio-source metadata only after the authority contract is approved. Do not create a second principal or silently rewrite the S1 membership.

This recommendation requires an explicit Program Authority decision: it separates the D02 portfolio owner from the canonical owner stored on the S1 membership, whereas the current D02 resolver requires exact equality. Until that semantic change and schema design are approved, the current resolver must continue to refuse the S1 tuple for D02 holdings. This proposal does not authorize implementation or provisioning.

## 2. Authority and approved requirements

### Published governing records

- [IPD D02 overall personal portfolio ownership determination](IPD-D02-OVERALL-PERSONAL-PORTFOLIO-OWNERSHIP-DETERMINATION-2026-11-15.md) records the approved product direction and leaves technical mapping/schema pending.
- [IPD Stage 5 D5 identity mapping tracker](IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md) records the current D5 blocker and acceptance boundary.
- The effective [S1 identity-value determination](../../evidence/cross-repository/IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md) establishes S1 for its existing Direct P1 purpose.
- The IPD reconstruction of the adopted D02/D03/D05 authority is [here](../../evidence/cross-repository/IIPS_V3_D02_D03_D05_RECONSTRUCTION_IPD_IMPLEMENTATION_EVIDENCE_2026-11-06.md). It records the adopted holdings owner/tenant, strict fail-closed rule, and non-authorization of operational provisioning/migration. It does not approve this proposal's new mapping semantics.

### Approved product requirements

1. D02 owner `owner-4dc756b3` is the overall personal portfolio owner across all personal portfolio and holding sources.
2. Dhan, Zerodha, other supported broker imports, and manual holdings belong to that same overall personal owner.
3. There is one IIPS personal-user experience, not a separate personal account/login for each source.
4. Each portfolio remains individually identifiable and manageable; source and provenance are preserved.
5. S1 and Direct P1 remain valid for their established purpose and are not silently replaced or invalidated.

These requirements do not select a technical identity mapping, approve a schema alteration, or authorize operational data changes.

## 3. Current-state architecture and verified constraints

### S1 and Direct P1 identity

The effective S1 determination names Ramki acting as Program Authority and establishes:

| S1 field | Established value |
|---|---|
| Principal label | `ramki-personal-local` |
| Tenant | `ipd-personal-local` |
| S1 canonical owner | `ipd-owner-ramki-personal` |
| Binding ID | `c5808abaffd072d6401ce63ad86c6ac0` |
| Membership ID | `d25dcc5370100b00766efc5166f65cf3` |

These are not D02 owner values. The determination is for established Direct P1 purpose and says changes require a new Program Authority determination. `docs/DIRECT_P1_PROVISIONING.md` documents the corresponding S1 binding and membership fields.

### Resolvers and the present D02 refusal

[`src/persistence/binding.ts`](../../src/persistence/binding.ts) implements:

- `resolveActiveBinding` / `resolveActiveBindingInCurrentTransaction`: resolve the sole ACTIVE binding and membership across the database, require membership attached to that binding, and return the membership's stored tenant and owner. Missing, multiple, or detached rows fail closed; resolution is transactional and not cached.
- `resolveActiveHoldingsBinding`: add the exact D02 predicate that the resolved membership owner be `owner-4dc756b3` and tenant be `ipd-personal-local`. Any other pair is invalid. `withHoldingsSnapshotTransaction` in [`portfolio_store.ts`](../../src/persistence/portfolio_store.ts) repeats that check in the protected transaction and compares to the requested owner.

With the established S1 tuple, the D02 holdings resolver therefore refuses: the membership owner is `ipd-owner-ramki-personal`, not `owner-4dc756b3`. This is correct fail-closed behavior under the current predicate, not evidence that S1 is invalid or that the values should be substituted.

### Migration 003 and authorization consumers

[`003_local_principal_bindings`](../../src/persistence/migrations/003_local_principal_bindings.ts) defines binding and membership tables. A membership references its binding and stores `tenant_id` and `canonical_owner_id`. Partial unique indexes permit **at most one ACTIVE binding and at most one ACTIVE membership per database**; revoked rows remain history. There is no identity-context, ownership-role, or context discriminator. Existing migrations are checksummed/immutable; changes must be appended as a new migration.

[`localSingleUserAuthorization.ts`](../../src/persistence/localSingleUserAuthorization.ts) requires server-side `IIPS_LOCAL_PERSONAL_USE=1` and a validated active binding, then compares the active membership tenant/owner directly with the target owner. Authority is not accepted from a request. The governed write path remains default-deny. [`DurablePortfolioStorePort`](../../src/persistence/durablePortfolioStorePort.ts) checks this authorization for manual and broker write scopes. An owner-link proposal must therefore be integrated into the local authorization decision, not only into the D02 resolver.

### Portfolio, holding, broker and manual persistence

[`001_initial_schema`](../../src/persistence/migrations/001_initial_schema.ts) stores portfolios by `(canonical_owner_id, portfolio_id)` with a `tenant_id` on the portfolio row. Revisions, holdings and contributions are scoped by owner and portfolio ID through keys/foreign keys. List/get/history/contribution queries are owner-scoped; missing, foreign-owned and tombstoned portfolios are intentionally folded into a non-disclosing unavailable result.

The `portfolios` table has **no portfolio-level source field or principal/user foreign key**. `portfolio_holdings.source_broker` preserves per-holding source. [`004_portfolio_contribution_provenance`](../../src/persistence/migrations/004_portfolio_contribution_provenance.ts) adds broker, file, digest, import-time and semantics fields to contributions; historic values intentionally remain NULL. Migration 006 adds holding security identity while preserving owner/portfolio keys.

[`brokerImportPersistence.ts`](../../src/persistence/brokerImportPersistence.ts) requires an owner-scoped `portfolioId`, `sourceBroker`, file name, content digest and import time; all imported holdings must carry the same broker. It resolves every holding and refuses the whole import if any identity cannot be qualified. It records a provenance digest and contribution metadata. `withBrokerImportTransaction` re-resolves the generic active binding and currently requires its owner/tenant to equal the write target. The [Stage 4 IPC contract](STAGE-4-BROKER-IMPORT-IPC-CONTRACT.md) prohibits caller-supplied owner claims and requires dispatcher plus durable-port checks.

[`manualPersonalPortfolio.ts`](../../src/persistence/manualPersonalPortfolio.ts) assigns manual holdings `sourceBroker: 'manual-personal'`, `identityStatus: 'UNRESOLVED'`, and `resolutionDisposition: 'MANUAL_PERSONAL_ENTRY'`, and computes lineage/provenance digests. Distinct portfolio IDs can keep Manual A/B independently manageable without separate users. Manual provenance exists at holding/revision level; there is not a normalized portfolio-source registry.

### Direct P1, D5 and D6 boundary

DP-V8 in [`directP1Provisioning.ts`](../../src/persistence/directP1Provisioning.ts) resolves through the **generic S1 resolver** and checks the established S1 context; it is not a D02 mapping check. The [Stage 5 D5 tracker](IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md) requires approved mapping/representation before verifier work and read-only exact-field checks and negative cases. The [Stage 5 Gate 4/Gate 5 readiness assessment](STAGE-5-GATE-4-GATE-5-READINESS-ASSESSMENT-2026-11-09.md) is a distinct qualification/readiness record, not an owner-mapping decision; the [current portfolio roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md) does not settle the missing S1-to-D02 relationship. D6/live holdings is later work and remains not started. The existing synthetic [D02 contract fixtures](../../tests/durable_holdings_contract_v1.test.ts) and [recovery fixtures](../../tests/durable_holdings_recovery_v1.test.ts) seed an owner-4dc756b3 membership directly; they exercise the present D02 resolver but do not test or approve the S1-to-D02 mapping.

## 4. Alternatives evaluated

| Alternative | Description | Benefits | Costs, risks and compatibility consequences |
|---|---|---|---|
| **A — Explicit S1-to-D02 owner relationship** | Keep S1 binding/membership unchanged. Add a separate authority-approved relationship from the active S1 membership to D02 owner `owner-4dc756b3`. D02 resolves both layers; membership is principal context and relationship supplies portfolio-owner context. | Preserves Direct P1 identity; avoids second login/principal; explicitly models user-to-owner relationship; can be additive and fail closed. | Requires new representation and a change to current D02 membership-owner equality and local write authorization. PA approval required. Historical S1-owner rows require separate treatment; no automatic re-key. |
| **B — Separate portfolio ownership from active membership** | Treat active S1 membership as local principal evidence and D02 owner as a distinct owner-domain object linked through A. | Cleanly separates authentication/membership from data ownership; existing owner-scoped portfolio keys can continue to use D02 owner; one principal serves all source types. | `ActiveOwner` currently conflates these concepts. Resolver/types and manual/broker authorization must change. Without the explicit link it is implicit or guessed authority and unsafe. Conceptual model underlying the recommendation, not current implementation. |
| **C — Extend the schema** | Add owner-link and portfolio-source metadata through a new immutable migration; do not edit migrations 001–006. | Represents missing relation and source metadata without overwriting S1; supports status/history, explicit uniqueness and lineage. | New migration/checksum, FK/index design and back-compat review required. Historical source columns can be NULL. Applied migration rollback cannot safely be a blind DROP. Requires design and execution authority. |
| **D — Separate S1 and D02 identity contexts** | Create a context-scoped D02 binding/membership or separate identity store; change uniqueness/selection to be context-scoped. | May satisfy a requirement that the D02 owner itself appear on a separate active membership. | Current schema has one ACTIVE binding/membership globally and no context key. Risks duplicate/fragmented personal identities and complicates selection, revocation and P1 compatibility. Not needed if A/B are approved. |
| **E — Replace/rebind S1 membership to D02** | Change/revoke the existing membership and make D02 owner its active owner. | Satisfies direct equality in current D02 resolver. | Changes what DP-V8/Direct P1 verifies and can strand S1-scoped rows. Conflicts with preservation unless superseded by explicit authority. Not authorized or recommended. |

**Assessment:** A/B/C together are the least duplicative design that could preserve S1 while modeling the approved overall-owner concept. D is a fallback if PA insists the owner must be represented by a context-scoped membership. E conflicts with the preservation constraint absent a superseding decision.

## 5. Recommended architecture and proposed data model (not approved)

### Separate three concepts

1. **Principal context:** existing S1 principal, binding and membership. Keep unchanged for Direct P1.
2. **Overall portfolio owner:** D02 owner `owner-4dc756b3` on `ipd-personal-local`, already approved as product owner.
3. **Portfolio/source identity:** stable individual `portfolio_id`; source and provenance remain separately represented for portfolio, holding and import.

Do not equate or derive the owner IDs, and do not make broker source an owner.

### Proposed relationship resolution

After PA approval, add an explicitly scoped relationship (illustrative name `local_principal_portfolio_owner_links`) from a **specific membership row** to an overall portfolio owner and tenant. In a hypothetical approved mapping, the subject could be the existing S1 membership; this proposal does not create such a relationship or approve the mapping. No request field, source label, deterministic ID or database contents alone creates authority.

Each D02 request should resolve the active binding, its attached active membership, and exactly one active owner link for that membership. Require the link's tenant to match the membership tenant and its owner to equal `owner-4dc756b3`; validate within the protected transaction for writes. Missing, multiple, revoked, malformed, detached, cross-tenant or conflicting records fail closed. No cache, fallback, auto-link or owner discovery from portfolio rows. Generic S1 resolver and DP-V8 remain unchanged. D02 gets a distinct resolver result/type, so membership owner is not mislabeled as portfolio owner.

This proposal would replace the D02-only exact membership-owner equality predicate with a relationship predicate. The PA must approve that semantic change before code.

### Proposed portfolio and source model

Keep portfolio storage owner-scoped by tenant, D02 overall owner and distinct portfolio ID. Add an explicit `portfolio_source_records` relation rather than encoding source in owner or portfolio IDs. A record should identify source kind (`BROKER` or `MANUAL`), provider (Dhan/Zerodha/other where broker), opaque source/account reference when applicable, portfolio ID, effective/created time and provenance reference/digest. If a portfolio can have multiple source origins, represent them as multiple explicit records; otherwise enforce one active origin. Existing per-holding `source_broker` and per-contribution evidence remain authoritative for their rows and are not overwritten.

Illustrative logical schema only (**not executable DDL**):

```text
local_principal_bindings(binding_id PK, principal_label, status)
  1 -> local_principal_memberships(
         membership_id PK, binding_id FK, tenant_id,
         canonical_owner_id [S1 value], status)
       1 -> local_principal_portfolio_owner_links PROPOSED(
              link_id PK, membership_id FK, tenant_id,
              portfolio_owner_id, status, created_at, revoked_at)
            1 -> portfolios((canonical_owner_id, portfolio_id) PK,
                            tenant_id, portfolio_name, revision, status)
                  1 -> portfolio_revisions
                  1 -> portfolio_holdings(source_broker, lineage_digest,
                                           security_identity, revision)
                  1 -> portfolio_contributions(source_broker, content/lineage
                                                digests, file/import time, semantics)
                  1 -> portfolio_source_records PROPOSED(source kind/provider,
                                                          source reference,
                                                          provenance metadata)
```

Candidate constraints for review: at most one ACTIVE owner link per membership; at most one ACTIVE membership-to-owner link per `(tenant_id, portfolio_owner_id)` within this local single-user model; existing owner/portfolio keys prevent duplicate portfolio IDs under an owner; source records must reference a portfolio in the same tenant/owner. Active status consistency still requires transactional resolution: SQLite foreign keys do not enforce cross-row ACTIVE status. Exact multiplicity and whether multiple principals may map to one owner require design/authority review.

## 6. End-to-end example and intelligence projection

Assume a future approved mapping relates one S1 membership to D02. The relationship is hypothetical; no record is created by this proposal.

| Portfolio | Illustrative portfolio ID (not prescribed) | Overall owner | Independently retained provenance |
|---|---|---|---|
| Dhan | `portfolio-dhan-01` | `owner-4dc756b3` | Broker/Dhan source record; each import contribution retains file/content/import/lineage evidence; holdings retain `source_broker=Dhan`. |
| Zerodha | `portfolio-zerodha-01` | `owner-4dc756b3` | Broker/Zerodha source record and separate import evidence/holdings source. |
| Manual A | `portfolio-manual-a` | `owner-4dc756b3` | Manual source record; holdings retain `manual-personal`, `MANUAL_PERSONAL_ENTRY` and their own lineage. |
| Manual B | `portfolio-manual-b` | `owner-4dc756b3` | Separate portfolio ID, revision history and manual provenance; never merged into Manual A merely because both are manual. |

One personal-user view can list all four by resolved D02 owner while each portfolio maintains separate revisions, holdings, lifecycle and provenance. An import/edit targets the exact portfolio ID; source does not change owner. Direct P1 continues DP-V8 generic S1 resolution and is not rewritten to use D02 owner.

The intelligence layer may derive a cross-portfolio analysis for the authorized overall owner, grouped by approved security identity, while retaining `portfolio_id`, source record, holding `source_broker`, contribution/import evidence, identity status and lineage in each input/drill-down. Aggregation must not rewrite or collapse source portfolios, imply unsupported security equivalence, or hide unknown coverage/value. Existing production aggregation support must be separately verified before claiming it exists.

## 7. Security and access-control implications

- **No cross-user access:** caller supplies no owner authority. Resolve principal/relationship server-side; every portfolio query remains filtered by tenant, D02 owner and exact portfolio ID. Unknown, foreign and tombstoned IDs return the existing non-disclosing unavailable class.
- **No implicit reassignment:** never link based on name, formula, source, matching owner string or existing portfolio rows. Authority is required; future provisioning uses a separate approved procedure.
- **No ambiguous owner:** accept at most one active relationship for the membership; duplicates/conflicts refuse. Resolve afresh each request; revocation applies next transaction.
- **Fail closed:** absent/inactive binding or membership, detached membership, missing/revoked/multiple link, malformed fields, wrong tenant/owner or foreign portfolio all refuse. Do not fall back to S1 owner or D02 constant alone.
- **Atomicity:** resolve and write in the same `BEGIN IMMEDIATE` transaction so concurrent revocation cannot authorize a later commit. Read projections should resolve link and owner-scoped data consistently.
- **Existing gates remain:** local writes still require server-side `IIPS_LOCAL_PERSONAL_USE=1` and existing scope checks. A mapping does not satisfy Gate 4/5, weaken default-deny, or authorize hosted/multi-user operation.
- **Broker provenance:** retain broker, file name, content/lineage digests, import time, contribution semantics and per-holding source. Historical migration-004 NULLs remain unknown, not imputed.
- **Manual independence:** distinct portfolio IDs, revision history, `manual-personal` attribution and entry disposition remain independent.
- **Audit:** future relationship creation/revocation and source registration need an approved audit event with authority reference, reason, actor, old/new context and time; no secret logging.

## 8. Migration, compatibility and historical records

No migration is authorized or run. If approved, prepare a new additive migration; migrations 001–006 and their checksums remain immutable.

1. Approve exact tables/keys/indexes/FKs, SQLite constraints, uniqueness scope and audit contract before coding.
2. Add relationship and (if approved) portfolio-source tables only. Do not rewrite binding/membership/portfolio rows in the schema migration. Test on disposable copies covering empty, valid, duplicate, revoked, malformed and historical-NULL fixtures.
3. Do not insert an active link or backfill identities as part of generic schema migration. Validate preconditions/counts and never derive IDs or reassign automatically.
4. Preserve current owner-scoped SQL and add the resolved tenant/owner/portfolio predicates to every D02 path. Add explicit tests proving DP-V8 and S1 values remain unchanged.
5. No operational database was inspected; historical row count, contents and provenance are unknown. Inventory only in a separately authorized read-only evidence process. Keep existing owner keys intact by default. The product direction does not decide whether S1-owner history is exposed through a read-only legacy alias or re-keyed; any such treatment requires a separate PA decision and evidence-backed authorized plan.
6. Rollback is default-deny feature disablement with additive tables/rows retained for investigation. Do not drop an applied/checksummed migration or erase relationship history. Backup restoration or operational rollback requires separate authority.

## 9. Risks and unresolved questions

- **Authority mismatch:** D02 currently requires membership owner equality; the recommendation keeps S1 membership owner and uses a separate link. PA must approve or reject this semantic distinction.
- **Historical rows:** operational DB not inspected; old owner-key row treatment remains undecided.
- **Source granularity:** current source is holding/import-level, not portfolio-root. Decide whether hybrid/multi-origin portfolios are supported and how displayed.
- **Single-active constraints:** one global active binding/membership does not model multiple identity contexts. Link uniqueness/revocation semantics must be explicit.
- **Authorization coverage:** port, broker consumer, IPC, Direct P1, manual paths, list/get/history, restore/delete and v1/v2 holdings must be audited before implementation.
- **Intelligence aggregation:** security identity/value uncertainty must remain visible; symbol alone cannot establish equivalence.
- **Migration/rollback:** immutable checksums and historical NULL provenance constrain changes; additive schema does not make backfill safe.

## 10. Exact Program Authority decisions required

The product owner is approved; these technical choices are not. Before implementation, migration or D5 verifier work, the Program Authority should issue a new IPD technical determination answering:

1. **Relationship semantics:** approve/reject mapping the existing S1 membership (without changing its canonical owner) to D02 owner `owner-4dc756b3` through an active relationship. If approved, state explicitly that D02 authorization means active S1 principal/membership **plus** that relationship, not equality of S1 membership owner and D02 owner. If rejected, state whether a context-scoped D02 membership is required and how Direct P1 remains valid.
2. **Mapping subject/multiplicity:** specify whether the existing S1 membership is the subject or name an authority-selected alternative; define whether one membership has exactly one active owner link and whether an owner can have more than one active principal relationship. Do not derive new principal, binding or membership IDs.
3. **D02 resolver contract:** approve the fail-closed predicate and narrow D02 resolver/local authorization changes while preserving generic S1/DP-V8 behavior and Gate 4/5 default-deny.
4. **Schema:** approve/amend owner-link table, uniqueness/FK rules and portfolio-source granularity. Approval of design does not authorize migration execution or operational provisioning.
5. **Historical rows:** decide whether S1-owner records stay separate pending evidence, are exposed using an approved read-only alias, or can be re-keyed under a separately authorized migration. Mapping approval alone must not authorize automatic reassignment.

**Consequences:** approving the relationship avoids a second principal but requires schema and D02/write authorization changes; requiring a D02 context requires context-scoped identity/schema and more lifecycle complexity; replacing S1 conflicts with the preservation requirement and needs a superseding decision; deferring preserves current fail-closed behavior and keeps D02 access blocked.

## 11. Future implementation acceptance criteria (not authorization)

Only after the authority decisions and separate implementation/migration authority:

1. Technical determination names mapping, owner/tenant, uniqueness, schema and historical disposition; D02 owner stays `owner-4dc756b3`.
2. S1 fields, generic resolution, DP-V8 and Direct P1 behavior remain compatible.
3. D02 resolver accepts exactly one active attached same-tenant relationship and fails closed for absent, multiple, revoked, malformed, detached, conflicting, wrong-owner/tenant cases; tests show no fallback/cache/request authority/automatic rebind.
4. Every manual, broker, list/get/history/contribution, restore/delete, v1/v2 path uses the same approved relationship and tenant/owner/portfolio filters; Direct P1 remains on S1 resolver.
5. Foreign-user/portfolio access, duplicate links, revocation races and cross-tenant links fail with no data disclosure/store effect.
6. Synthetic Dhan, Zerodha, Manual A/B portfolios remain separately manageable under one D02 owner; source records, revisions, contribution evidence and lineage remain intact. Intelligence is a source-preserving derived projection.
7. Migration tests use disposable copies, preserve old data/checksums and historical NULLs, enforce approved constraints, and document rollback; no operational DB is used in tests.
8. D5 is a separate read-only bounded verifier implemented only after mapping/schema approval; synthetic fixtures alone do not constitute D5 pass.
9. D6/live IPC remains unimplemented/unexecuted until D5 passes and separate D6 authority/acceptance is recorded.
10. Approved documentation/build/typecheck/tests and independent evidence checks pass; no IRR changes.

## 12. Scope and disposition

This task prepared a design proposal and tracker update only. No owner link, schema, portfolio-source record, resolver, authorization change, D5 verifier or D6 operation was implemented. No operational database, live IPC, environment, S1 record or identity state was accessed or changed; no provisioning, migration, reassignment, dependency installation or IRR modification occurred.

**Product ownership: APPROVED. Technical identity mapping: PENDING. Schema design: PROPOSAL PREPARED / AWAITING APPROVAL. Operational provisioning: NOT AUTHORIZED. D5: BLOCKED. D6: NOT STARTED.**
