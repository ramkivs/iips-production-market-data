# IPD D02 Local Single-User Scope and Decision Applicability Review

**Review type:** IPD engineering applicability analysis; recommendations only.
**Scope:** Windows laptop-hosted, personal, local, non-production application; one user; four independently identifiable portfolios—Dhan, Zerodha, Manual Portfolio A and Manual Portfolio B—all under approved D02 owner `owner-4dc756b3`; no current multi-user, multi-tenant, hosted or commercial requirement.
**Source branch reviewed:** `arena/14cbd9d2-iips-production-market-data`, head `53c4a263572a51ace4516a4ce087060c8b33e10f`.
**Authority boundary:** D01–D03 remain **APPROVED**; D04–D22 remain **PENDING**. This review neither approves nor rejects any pending decision, grants implementation/operational authority, nor changes D5/D6 status.

## Executive conclusion

The 22-item register mixes real local correctness requirements with optional source-registry design, future account identity, re-key work that may not be needed, and approval steps that assume a more formal or hosted deployment than the approved IPD operating model. The minimum safe local model is smaller than the full candidate schema:

- Keep the existing S1 principal, binding, membership, tenant and S1 owner intact. The three already-approved decisions establish one explicit durable relationship from the existing S1 membership to D02 owner `owner-4dc756b3`; do not create a second user identity or D02 identity tuple.
- Preserve the approved tenant match and scoped references. One local tenant does not make inconsistent tenant values safe, but it does not justify a general tenant-administration system.
- Resolve the relationship from the existing local database, fail closed on missing, revoked, duplicate or mismatched state, and derive—not accept from IPC/request data—the D02 portfolio owner. Keep portfolio ID, owner, revision and existing source/provenance checks.
- Retain transactional atomicity for identity resolution and writes, a consistent snapshot for reads, existing S1/Direct P1 behavior, source evidence and recoverability. These are data-integrity needs even for one user.
- For the four stated portfolios, use separate portfolio IDs and the current per-holding/import/manual provenance fields. Do not require a dynamic provider registry, opaque account token per broker account, root source-record table and two link tables unless a real hybrid or multi-account use case appears. A simple controlled provider value and source-match check is sufficient now.
- Do not re-key historical S1-owner rows by assumption. Whether historical rows exist or conflict is **UNRESOLVED — EVIDENCE REQUIRED**; no operational database was read. Any later re-key is conditional on a specific choice, inventory and recovery plan.
- Avoid imposing multi-user administration or a second approval ceremony. The current IPD operating model says the local owner is the sole operational authority for routine in-scope work. However, the D02 determination also records a specific restriction on operational provisioning/migration; its scope relative to the later operating model must be reconciled before any such action. This review does not lift it.

Applicability labels below describe the decision’s necessity in this scope; they do **not** alter formal status. In particular, recommendations to simplify or defer D04–D22 are not dispositions or approvals. Classification totals: **ESSENTIAL 8; SIMPLIFY 8; NOT APPLICABLE TO CURRENT SCOPE 1; DEFER TO FUTURE SCOPE 2; UNRESOLVED — EVIDENCE REQUIRED 3.**

## Scope assumptions and exclusions

1. The [IPD operating model](../IPD-OPERATING-MODEL.md), §Operating context and authority, defines personal use, one user, local Windows, non-production and owner-directed execution. It says routine work does not require a committee or repeated approval; its safeguards and specific technical boundaries remain applicable. §Scope exclusions excludes hosted/SaaS, institutional, commercial and multi-user operation.
2. The [D02 ownership determination](IPD-D02-OVERALL-PERSONAL-PORTFOLIO-OWNERSHIP-DETERMINATION-2026-11-15.md), §1, and [architecture decision](IPD-D02-OWNERSHIP-ARCHITECTURE-DECISION-2026-11-15.md), §§1–2, establish the owner/tenant and preservation direction. The [approval record](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md) records D01–D03 only.
3. The current repository schema and written operating model are evidence about product architecture, not evidence of the contents of the live local database. No database was opened for this review.
4. Dhan, Zerodha, Manual A and Manual B are distinct illustrative portfolio identities, not a claim that any such rows currently exist. Their separation is required; source-registry implementation is not assumed by the product decision.
5. This review is limited to IPD-owned local non-production behavior. It makes no claim about third-party broker account contracts, source licences, live market operations, production qualification or another repository’s authority.

## Applicability matrix — D01–D22

| ID | Decision | Primary classification | Current-scope finding | Minimum safe local disposition (recommendation only) |
|---|---|---|---|---|
| D01 | Relationship subject and exact identity fields | **ESSENTIAL** | Existing S1 identity must resolve to the approved D02 owner without replacing S1. Already approved. | Use the existing S1 membership as relationship subject; verify its existing binding/principal/tenant/S1 owner and ACTIVE state. |
| D02 | No new D02 principal/binding/membership | **ESSENTIAL** | A second identity tuple is unnecessary and risks conflicting with Direct P1. Already approved. | Reuse the S1 identity; represent portfolio ownership separately. |
| D03 | Tenant-scoped relationship and matching references | **ESSENTIAL** | Tenant/owner mismatch can still corrupt isolation in a single-user database. Already approved. | Keep `ipd-personal-local` and tenant-matching constraints; no multi-tenant administration. |
| D04 | Relationship multiplicity and active uniqueness | **SIMPLIFY** | One unambiguous active relation is essential; the current schema already has a global single-active membership. | Enforce one active relationship for the configured S1 membership; avoid designing for multiple principals/devices. |
| D05 | Owner registry lifecycle and revocation | **SIMPLIFY** | A formal owner-administrator workflow is not evidenced for one fixed local owner; relationship revocation/fail-closed behavior can still matter. | Keep a simple active/revoked relationship state and local durable audit; do not add admin roles or lifecycle bureaucracy. |
| D06 | UUIDs, authority references and audit fields | **SIMPLIFY** | Durable key uniqueness and lifecycle evidence matter; cryptographic IDs, actor administration and external authority-reference workflows are not established as local needs. | Use a stable database key and existing append-only local audit chain; never store credentials or infer identity. |
| D07 | Portfolio-to-owner registry FK versus private facade | **SIMPLIFY** | Owner derivation and store predicates matter; hostile multi-tenant/organization administration does not. | Use a narrow server-side D02 service that derives owner from the approved relationship; do not accept owner from request input. Avoid complex capability machinery unless a real bypass remains. |
| D08 | D02 resolver and authorization contract | **ESSENTIAL** | Current S1 and D02 owner values differ, so a relationship-aware context is needed. | Resolve the one approved relationship, use the derived D02 owner for all portfolio predicates, preserve default-deny and Direct P1. |
| D09 | Transaction boundaries and concurrency | **ESSENTIAL** | Locality does not remove crash, concurrent IPC/import or time-of-check/time-of-use risks. | Resolve and mutate in one SQLite write transaction; use one read snapshot for resolution plus query; roll back all effects on error. |
| D10 | Provider taxonomy/catalog governance | **SIMPLIFY** | Dhan/Zerodha/manual identity must be distinguishable; dynamic catalog administration is not needed for four known origins. | Use a closed normalized provider/source enum or allowlist; defer runtime catalog lifecycle. |
| D11 | Broker-account opaque identity and deduplication | **DEFER TO FUTURE SCOPE** | No requirement identifies multiple accounts under one provider or cross-file account deduplication for the four portfolios. | Preserve provider/file/content/lineage provenance; never store credentials or raw account secrets. Add opaque account identity only if a real multi-account workflow requires it. |
| D12 | Source cardinality and active-source uniqueness | **SIMPLIFY** | The four portfolios each have a distinct portfolio ID and one stated origin; hybrid portfolios are not required. | One source class per portfolio in current scope; portfolio ID and source value distinguish the four. Defer hybrid tuple indexes. |
| D13 | Root source registry and per-row source-link tables | **SIMPLIFY** | Current holdings and contribution records already carry source/provenance fields; no current cross-source portfolio is required. | Reuse row-level `source_broker`, file/content/lineage digests and manual disposition; validate source against the selected portfolio path. Defer the three proposed source/link tables. |
| D14 | Historical NULL/unlinked provenance | **ESSENTIAL** | Existing NULL provenance is an explicit unknown, not a safe inference opportunity. | Preserve NULL/unlinked as unknown; backfill only from specific evidence under an authorized operation. |
| D15 | Historical S1-owner portfolio disposition | **UNRESOLVED — EVIDENCE REQUIRED** | Whether relevant historical rows exist and whether D02 needs them is unknown. | Do not re-key or expose by inference. Decide defer/alias/re-key only after a separately authorized read-only inventory. |
| D16 | Inventory scope, ownership proof and collision policy | **UNRESOLVED — EVIDENCE REQUIRED** | Actual row counts, destinations, orphans, provenance and migration-ledger state are unavailable without live inventory. | If migration is contemplated, inventory first and stop on any ambiguity/collision; no merge/overwrite/partial move. |
| D17 | Re-key scope and affected records | **DEFER TO FUTURE SCOPE** | Only applies if D15 later selects re-key after evidence. | No migration now. If later approved, include every actual owner-key child, restore receipt and any then-existing source/link table. |
| D18 | Schema migration boundaries and SQLite mechanics | **ESSENTIAL** | A durable relationship needs a compatible representation; changing schema incorrectly can break existing persistence. | If schema change is required, append a checksummed transactional migration, preserve old migrations, validate SQLite/FKs, and insert no operational rows. |
| D19 | Re-key atomicity, rollback and recovery cutoff | **ESSENTIAL** | Any owner-key data move can damage durable history; recovery remains important for a local user. | Prefer no re-key; if later approved, use verified backup, one atomic transaction, pre/post integrity checks and a documented recovery path. No enterprise approval chain is needed for the engineering safeguard itself. |
| D20 | Confirm local single-user security scope | **NOT APPLICABLE TO CURRENT SCOPE** | The environment is already defined by the user and current IPD operating model; no extra PA reconfirmation adds protection. | Record the scope and stop if it changes. Defer multi-user/hosted design until actually required. |
| D21 | Separate Level D implementation-authority gate | **SIMPLIFY** | The current operating model gives the local owner authority over routine in-scope implementation; a second permission ceremony duplicates it. | Keep detailed design correctness and safeguards; use owner-directed work once required design decisions are settled. This review does not grant implementation or change the current recorded status. |
| D22 | Level E operations, D5 evidence and D6 start decision | **UNRESOLVED — EVIDENCE REQUIRED** | Routine local operations are owner-directed under the operating model, but the D02 determination specifically says its adopted authority prohibits operational provisioning/migration; D5/D6 also have distinct historical gates. | Reconcile the specific D02 restriction and operating model before relationship-row provisioning or migration. Keep D5 blocked and D6 unstarted meanwhile; no action is authorized here. |

## Detailed decision rationale

### D01 — ESSENTIAL: relationship subject and exact S1 checks

**Problem and scope fit.** D02 needs to resolve to `owner-4dc756b3`, while the established S1 membership carries `ipd-owner-ramki-personal`. That mismatch exists in the local environment; without an explicit relationship, current D02 resolution fails closed. Connecting the established S1 membership preserves the approved identity while giving the four portfolio records one D02 owner.

**Simpler mechanism / minimum.** Use the already-approved S1 membership as the relation subject and verify its exact existing binding, principal, tenant, S1 owner and active status on resolution. This is not an external identity-provider federation or a new user registry. The approved architecture and D01 already settle this choice; no multi-user capability is implied.

**Dependency and evidence.** D01 is approved. See package D01; approval record D01; architecture decision §1/table and §3; technical design §§2, 13.2, 13.5; determination §2. The application’s current resolver confirms the S1/D02 owner distinction (`src/persistence/binding.ts`, `assertHoldingsOwner`).

### D02 — ESSENTIAL: no second identity tuple

**Problem and scope fit.** Creating another personal login, principal, binding or membership does not solve a current one-user need; it duplicates identity and risks changing the S1 tuple observed by Direct P1.

**Simpler mechanism / minimum.** Preserve S1 unchanged and store the separate ownership relationship. The relationship is not a new principal. This matches the explicit approved direction; the current global single-active binding/membership constraint in migration 003 is not a reason to invent a second identity.

**Dependency and evidence.** D02 is approved. See package D02 and approval record D02; architecture decision §§1–4; determination §§2–4; migration `003_local_principal_bindings.ts`.

### D03 — ESSENTIAL: tenant-scoped, matching references without multi-tenant machinery

**Problem and scope fit.** A single user still needs consistent membership and portfolio tenant references: a mismatch can route a local query to the wrong data scope or make an ownership link invalid. The same `ipd-personal-local` value is already part of S1 and the D02 holdings owner requirement.

**Simpler mechanism / minimum.** Retain the approved tenant-scoped relationship and matching membership/tenant references (including the composite FK direction in approved D03). Treat the tenant as a fixed local scope, not a tenant directory, tenant switcher or organization administration service. Keep D03’s approved owner-registry and membership/binding status checks; their DDL still needs schema validation.

**Dependency and evidence.** D03 is approved; no status change is proposed. Retain its owner-registry composite FK target if that approved schema direction is used, but a single fixed owner row does not imply dynamic registry administration. See package D03 and approval record D03; architecture decision §1; determination §2; technical design §13.2; migration 003; initial portfolio schema migration 001.

### D04 — SIMPLIFY: active relationship uniqueness

**Problem and scope fit.** Two active D02 relationships for the same S1 identity could make owner resolution ambiguous; that is a correctness issue even for one person. However, migration 003 already enforces at most one active binding and one active membership globally, and approved D01 fixes the relationship subject to that membership.

**Simpler mechanism / minimum.** Enforce at most one active overall-owner relationship for the configured membership/type. The proposed reciprocal uniqueness by owner is a cheap integrity defense if a stale active row can remain after membership replacement; the tenant column may remain in that key for D03 consistency, but it does not provide a current multi-tenant feature. Migration 003 already globally limits active memberships, so do not build separate principal/device cardinality. Maintain revocation/uniqueness tests; do not weaken the existing singleton guard.

**Future / dependency.** Multi-device or multi-principal ownership is deferred. D04 remains formally pending. Evidence: package D04; migration 003’s global partial unique indexes; design §§3.2, 13.2, 13.8; review §§4–5 (single-user scope and uniqueness condition).

### D05 — SIMPLIFY: owner registry lifecycle and revocation

**Problem and scope fit.** The relationship must stop resolving if the S1 membership is revoked or the mapping is deliberately disabled. A full owner-administrator lifecycle, multiple actors and terminal revocation workflow are not evidenced for one fixed personal owner.

**Simpler mechanism / minimum.** Keep the D03-approved single owner-registry key stable and continue checking that its status is ACTIVE; no UI or administrator workflow is needed for the fixed local owner. Keep an explicit relationship active/revoked state, reject inactive membership/relation, and record an intentional state transition in the existing durable audit event chain. Do not silently reactivate. Owner change remains a new product decision, not a routine registry-admin feature.

**Future / dependency.** Add multi-actor revocation and broader lifecycle rules only if the deployment actually gains administrators or multiple owners. D05 remains pending. Evidence: package D05; design §§3.1, 4, 13.2 and 13.5; `docs/LOCAL-PERSONAL-USE-PERSISTENCE.md` §1 confirms a local append-only audit chain; operating model §Proportionate safeguards says preserve audit history.

### D06 — SIMPLIFY: local keys and durable lifecycle evidence

**Problem and scope fit.** A relationship row needs a stable unique database key and an auditable lifecycle; the user does not need an externally exposed, unguessable identity token or a multi-actor approval trail. The current local database uses internal row keys and a hash-chained `audit_events` table.

**Simpler mechanism / minimum.** Keep NOT NULL/unique row identity and transactional status/audit consistency. A local integer surrogate or natural membership/type key may suffice if lifecycle/history requirements are met; a UUID is an implementation choice, not a local security boundary. Use the existing append-only audit chain with event, affected local membership/owner, state change and timestamp. A static reference to the approved decision record is enough if the application needs traceability; no external authority service, actor directory or separate evidence catalogue is established. Never store credentials/account secrets.

**Future / dependency.** UUIDv4 or richer actor/reason/evidence fields may be chosen for interoperability, correlation control or multi-actor audit if a demonstrated use arises. D06 is pending. Evidence: package D06; design §§13.1–13.2; migration 002 `audit_events`; local persistence §§1, 7.2–7.3.

### D07 — SIMPLIFY: owner access boundary, not enterprise capability security

**Problem and scope fit.** Low-level store methods accept owner references, so an internal caller could select the wrong portfolio owner. That is a real data-integrity bug surface even on one laptop; a remote hostile tenant is not the current threat model.

**Simpler mechanism / minimum.** Keep owner derivation server-side from the approved relationship, pass a small typed D02 context through the existing application/composition boundary, reject caller-supplied owner values, and ensure all D02 SQL uses the resolved owner/tenant/portfolio. Protect the boundary with focused call-site tests and the existing request-key/authorization guards. Do not build a transaction-nonce capability framework or rebuild portfolio tables to add a registry FK unless a concrete path bypasses the facade. This review does not implement that facade.

**Future / dependency.** A security review for multi-user, plug-in or hosted composition may justify stronger capability isolation and database FKs. D07 remains pending. Evidence: package D07; review §5.1 identifies arbitrary low-level owner writes; design §13.5; `docs/LOCAL-PERSONAL-USE-PERSISTENCE.md` §§7.2–7.4 (server-only env, binding re-resolution, single composition path).

### D08 — ESSENTIAL: relationship-aware owner resolution

**Problem and scope fit.** The current `resolveActiveHoldingsBinding` directly requires S1 membership owner to equal D02 owner; source review says the established S1 tuple therefore fails that predicate. The approved relationship is needed to list and operate the four portfolios without rewriting S1.

**Simpler mechanism / minimum.** Implement no general authorization framework: read the one approved relationship from the local store, validate exact S1 subject and D02 owner/tenant, derive an internal D02 context, and filter each operation by it. Keep unavailability non-disclosing and fail closed. Do not accept owner ID from IPC or use a constant fallback. Existing `ActiveOwner` and Direct P1 remain unchanged.

**Future / dependency.** Multiple identity contexts, principals or tenants require a new scope/design. D08 remains pending. Evidence: package D08; approval record D01–D03; design §§5.2–5.3, 13.5; review §§1, 4; `src/persistence/binding.ts`.

### D09 — ESSENTIAL: atomic local resolution and access

**Problem and scope fit.** A local app can have concurrent IPC requests, an import overlapping a save, or a process interruption. If relationship validation commits before a portfolio query/write, the relation or row can change between check and use; partial import/source writes can corrupt provenance.

**Simpler mechanism / minimum.** Reuse SQLite transaction machinery: one `BEGIN IMMEDIATE` write transaction from relationship resolution through authorization and all row effects; one read transaction/snapshot for resolution plus query; one connection and rollback on failure. Do not add distributed locks, quorum, queue services or cross-database consistency infrastructure. Existing persistence already uses `BEGIN IMMEDIATE` for protected writes and migration ledger operations.

**Future / dependency.** Distributed transactions/concurrency controls are out of scope unless storage becomes remote or multi-process with different guarantees. D09 remains pending. Evidence: package D09; design §§5.2, 13.5, 13.7; `src/persistence/binding.ts`; local persistence §§1, 7.2–7.3.

### D10 — SIMPLIFY: closed provider normalization, not a dynamic catalog

**Problem and scope fit.** Dhan, Zerodha and manual inputs must remain distinguishable; arbitrary aliases can weaken provenance or allow a wrong-source write. Current scope names only these origins, while product policy separately allows future supported brokers.

**Simpler mechanism / minimum.** Normalize adapter output to a closed canonical source enum (`DHAN`, `ZERODHA`, `MANUAL_PERSONAL`) and refuse unknown values. Reuse provider adapter/source labels and stored `source_broker` where possible. No SQLite provider catalog, status administration, alias registration UI or catalogue audit lifecycle is needed for the four portfolios.

**Future / dependency.** Add new compile-time codes or a governed table if the supported provider set becomes dynamic or external configuration is required. D10 remains pending. Evidence: package D10; design §§13.3–13.4; existing Dhan/Zerodha adapters in `src/ui/portfolio_ui_package.ts`; local persistence §§3–4.

### D11 — DEFER TO FUTURE SCOPE: account identity tokens

**Problem and scope fit.** A stable account token is useful to distinguish two accounts under the same broker or deduplicate imports across portfolios. The approved example has one Dhan portfolio and one Zerodha portfolio, with separate portfolio IDs; no multi-account same-provider requirement or provider account-ID contract is documented.

**Simpler mechanism / minimum.** Preserve broker code, file name, content digest, lineage digest and import time. Never store credentials, API tokens or raw sensitive account identifiers. Do not create per-account UUIDs or claim same-account deduplication without a stable source contract.

**Future / dependency.** Revisit if the operator uses multiple accounts for one broker, consolidates accounts into one portfolio, or requires cross-import account matching. D11 remains pending. Evidence: package D11; design §§13.3, 13.6; migrations 001/004 and local persistence §3; no account-key authority appears in the reviewed decision records.

### D12 — SIMPLIFY: source cardinality and uniqueness

**Problem and scope fit.** Duplicate source rows or mixed provider claims can make import ownership ambiguous. But the four required examples already provide distinct portfolio identities, and no hybrid portfolio is in current scope.

**Simpler mechanism / minimum.** Give each portfolio one explicit source kind for this use case: Dhan, Zerodha or manual. Dhan and Zerodha have distinct IDs; Manual A and B each have distinct IDs despite sharing manual source kind. Enforce uniqueness of portfolio ID under the approved owner and check incoming source kind against the selected portfolio. No active `(provider, account token)` expression index is needed without multiple source records/accounts.

**Future / dependency.** If hybrid portfolios or multiple accounts per portfolio are introduced, define source cardinality, de-duplication and uniqueness before writes. D12 remains pending. Evidence: package D12; determination §1; architecture decision §2; design §§6–7, 13.4, 13.6; migration 001 portfolio key.

### D13 — SIMPLIFY: root source registry and link tables

**Problem and scope fit.** A root source row plus holding and contribution link tables provide strong relational lineage for multiple source streams within one portfolio. Existing schema already stores `source_broker` and `lineage_digest` on holdings, and migration 004 stores broker/file/content/lineage/import fields on contributions. Manual input has a distinct `MANUAL_PERSONAL_ENTRY` disposition. The current four-portfolio model is one source kind per portfolio.

**Simpler mechanism / minimum.** Keep the four portfolio IDs separate and preserve all current row-level provenance. Validate at the importer/manual path that Dhan cannot write to the Zerodha/manual portfolio and vice versa; do not infer source from a name/symbol. If that mismatch check needs durable portfolio metadata, one `origin_kind` enum on the portfolio (or an equally small server-owned portfolio/source mapping) is smaller than a source catalog plus two link tables. Do not add a relational source graph until a true hybrid-source requirement demonstrates that current row evidence is insufficient.

**Future / dependency.** Hybrid portfolios, multiple concurrent account streams per portfolio, or audited source revocation may justify a registry and explicit FKs. D13 remains pending. Any chosen simplification must not erase existing row provenance. Evidence: package D13; review §§4–5.3, 5.8; migrations 001, 004, 005; design §§6–7, 13.4, 13.6.

### D14 — ESSENTIAL: historical provenance remains unknown when absent

**Problem and scope fit.** Missing import provenance cannot be reconstructed safely from the fact that a local user owns four portfolios. A guessed Dhan/Zerodha/manual origin can corrupt lineage and historical reports.

**Simpler mechanism / minimum.** Keep historical NULL fields and unlinked rows as unknown. Preserve their IDs, revisions and digests. Only fill a missing fact from a direct retained source record and a separately authorized correction; never infer from names, symbols, or current portfolio assignment.

**Future / dependency.** Evidence-backed remediation can be scoped after an authorized read-only inventory. D14 remains pending. Evidence: package D14; review §§1, 4 (migration 004 deliberately leaves NULL); design §§9, 13.4, 13.7; migration 004 comment.

### D15 — UNRESOLVED — EVIDENCE REQUIRED: existing S1-owner portfolios

**Problem and scope fit.** If any of the four portfolios already exist under `ipd-owner-ramki-personal`, their visibility under the new D02 owner depends on a policy choice. If none exist, re-keying is unnecessary. A single user does not establish whether those rows exist or whether they collide with D02 IDs.

**Simpler mechanism / minimum.** Make no automatic move, alias or merge now. New D02-scoped portfolios can be separately created later under valid authority; existing S1 rows remain untouched pending an explicit compatibility decision.

**Future / dependency.** Need exact row counts, IDs, owner/tenant/FK checks, provenance and target collisions before selecting alias or re-key. D15 remains pending; no DB access occurred. Evidence: package D15; determination §§2–4; design §13.7; review §4 historical-record finding and §6.8; migration 001 portfolio owner key and migration 006 restore receipts.

### D16 — UNRESOLVED — EVIDENCE REQUIRED: live inventory and collision rules

**Problem and scope fit.** An inventory is not necessary merely to design the relation, but is necessary before claiming historical coverage or moving rows. The repository migration list cannot show live counts, orphan rows, destination collisions, current ledger state or any operational source rows.

**Simpler mechanism / minimum.** Do not inspect or change the DB in this review. If D15 later selects data compatibility, separately authorize a read-only snapshot/inventory and stop on any unexplained row, conflict, orphan, NULL lineage or non-invertible restore receipt. Do not merge, overwrite or partially move.

**Future / dependency.** D16 depends on D15 and any later Level E/scope authority. D16 remains pending. Evidence: package D16; review §§1, 4 historical records, 6.8; design §13.7 explicitly calls live data unknown; tracker historical inventory row.

### D17 — DEFER TO FUTURE SCOPE: exact migration row scope

**Problem and scope fit.** A complete affected-table set matters only if a historical owner-key re-key is selected. No such choice or live row inventory exists. The design already identifies repository candidates: portfolios, revisions, holdings, contributions, restore receipts; proposed source records/links only if those tables are adopted; audit history is append-only and migration ledger immutable.

**Simpler mechanism / minimum.** No migration now. If later approved, update every actual owner-key child in one batch, preserve portfolio/revision/provenance identity, and leave S1 bindings/membership and prior audit events untouched. Do not build a generic migration framework for four unverified examples.

**Future / dependency.** D17 depends on D15–D16 and D13’s source-table choice. D17 remains pending. Evidence: package D17; design §13.7 inventory and re-key proposal; migrations 001, 004, 006; review §5.5.

### D18 — ESSENTIAL: safe additive migration mechanics

**Problem and scope fit.** If the approved relation needs durable schema representation, changing tables incorrectly can invalidate existing local data/checksums. This remains a correctness issue regardless of user count.

**Simpler mechanism / minimum.** Use the repository's existing migration runner and append-only checksum ledger. An additive schema migration, if later approved, should create only required relationship constraints; do not edit old migration SQL or seed any owner/relationship/source/portfolio row. Validate FK order, parent keys, SQLite feature support and full rollback on disposable DBs.

**Future / dependency.** Dynamic catalogs, hybrid link tables and account-token schema are not minimum needs unless D10–D13 are approved for those cases. D18 remains pending. Evidence: package D18; design §13.7; `src/persistence/migration_ledger.ts`; migrations 001–006; local persistence §§1, 5.

### D19 — ESSENTIAL: proportionate rollback and recovery

**Problem and scope fit.** A broken local portfolio-owner change can strand or misattribute durable rows; a single operator still needs recoverable data. The current operating model expressly requires verified backups for difficult-to-reverse work and recovery before claiming success.

**Simpler mechanism / minimum.** For any future schema/data change, use an atomic transaction, pre/post integrity checks and a verified backup/restore path proportionate to destructiveness. If a re-key is later chosen, stop on conflict and do not partially reverse after new writes; restore/reconcile from verified evidence under the then-applicable authority. No separate committee or external immutable-manifest service is needed absent an actual requirement.

**Future / dependency.** Detailed reverse-mapping cutoff applies only if D15 selects re-key. D19 remains pending. Evidence: package D19; operating model §Proportionate safeguards; design §§9, 13.7; review §4 migration/rollback.

### D20 — NOT APPLICABLE TO CURRENT SCOPE: confirming local-only deployment

**Problem and scope fit.** The current scope is already explicit in the task and `docs/IPD-OPERATING-MODEL.md`. A second PA decision to confirm “single user/local” adds no current correctness control.

**Simpler mechanism / minimum.** Treat the current app as local/single-user/non-production and document assumptions in the technical design; keep one active local S1 binding/membership. Do not build multi-tenant or organization administration. If the requirement changes, stop and redesign before relaxing uniqueness.

**Future / dependency.** Hosted, multi-user, institutional or commercial expansion is excluded. D20 remains formally pending; this applicability label does not disposition it. Evidence: package D20; operating model §Operating context and authority / §Scope exclusions; local persistence §§1, 5.

### D21 — SIMPLIFY: separate implementation-authorization ceremony

**Problem and scope fit.** The package describes a distinct Level D approval after schema approval. The current IPD operating model says the application owner is the sole authority for routine implementation/testing in this local non-production environment and expressly rejects repeated approvals or committee/change-control ceremonies. A separate Level D gate is therefore not a demonstrated technical requirement.

**Simpler mechanism / minimum.** Keep Level C technical correctness and applicable boundaries. Once design choices are settled, implementation can be owner-directed routine work under the operating model's preservation, testing and recovery safeguards, rather than an additional authority tier. This review does not authorize implementation and does not change the package/tracker’s existing “NOT GRANTED” status.

**Future / dependency.** Production activation, hosted service, third-party restrictions or another repository’s controlled surface may impose separate genuine authority; those are not the current scope. D21 remains formally pending. Evidence: package D21; `docs/IPD-OPERATING-MODEL.md` §Operating context and authority / §Proportionate safeguards / §Scope exclusions; architecture decision §§3, 6; current D5 tracker status.

### D22 — UNRESOLVED — EVIDENCE REQUIRED: local operations versus specific D02 restriction

**Problem and scope fit.** Under the current operating model, ordinary local data operations, verification and recovery are owner-directed; an additional Level E ceremony is generally not needed for personal non-production activity. But the D02 ownership determination specifically states that the adopted D02/D03/D05 act prohibits operational provisioning or migration and limits D05 to bounded engineering/synthetic tests. That is a specific technical/authority boundary, not merely a generic multi-tenant approval workflow. D5/D6 have separate recorded gates.

**Simpler mechanism / minimum.** Do not infer that the broad Level E package gate survives unchanged for all routine local actions, and do not infer that the operating model silently repeals the specific D02 prohibition. Resolve the exact scope of that adopted restriction (or obtain an explicit amendment) before creating the D02 relationship/owner/source rows or moving historical data. Routine local portfolio CRUD under existing authority is distinct from D02 identity provisioning. Keep D5 blocked and D6 unstarted under current records.

**Future / dependency.** D22 depends on reconciling the D02/D05 authority with the operating model and on decisions D15–D19 if historical data is involved. D22 remains pending and no operational authorization is granted by this review. Evidence: package D22; determination §2 (specific D05/provisioning wording) and §7; architecture decision §§3–6; operating model §§Operating context and authority, §Scope exclusions; D5 tracker.

## Minimum viable local single-user ownership model

For later detailed design work—subject to the already-recorded authority boundaries and without implementing anything here—the proportionate minimum is:

1. Keep the approved S1 identity tuple intact and use its existing membership as the approved relationship subject. Do not create a second local user, D02 binding or membership.
2. Preserve D03’s tenant-scoped relationship and exact matching local tenant. Keep a small durable relationship mapping to D02 owner `owner-4dc756b3`; require one valid active relation for the configured membership.
3. Resolve the mapping on the server, fail closed on missing/mismatched/revoked state, derive the owner, and retain owner/tenant/portfolio/revision predicates. Do not accept ownership from the IPC payload. Leave generic S1/Direct P1 resolution unchanged.
4. Reuse SQLite’s local transaction discipline: one write transaction for resolution/authorization/mutation; a consistent snapshot for reads. No distributed locks or hosted authorization service.
5. Keep four distinct portfolio IDs. Use existing holding/contribution/manual provenance: canonical broker/source value, file/content/lineage digest and timestamps where present, manual disposition, portfolio/revision IDs. No merging by owner equality.
6. Avoid dynamic provider registry, broker account UUIDs, source-record graph and per-row link tables for the present one-source-per-portfolio example. Validate source at the importer/manual boundary; if durable cross-source enforcement needs it, store one portfolio-level origin enum/mapping. Reconsider the richer graph only if hybrid or multiple-account portfolios become real requirements.
7. Preserve historical NULL/unlinked values and current S1 rows. No re-key until inventory proves it is needed and the specific D02 provisioning restriction is resolved.
8. Use existing append-only local audit and migration-ledger mechanisms. Apply verified backup, integrity checks and a tested restore/recovery path for any difficult-to-reverse future change.

This is an applicability recommendation, not approval of a reduced schema. In particular, the already-approved D03 default must not be weakened by this review; any change to an approved decision requires the authority's own explicit amendment.

## Decisions to simplify, remove from current scope or defer

- **Simplify:** D04’s one-active-link invariant (retain only the local cardinality needed); D05’s admin lifecycle; D06’s UUID/actor/authority-reference machinery; D07’s capability framework; D10’s dynamic provider catalog; D12’s hybrid/account uniqueness; D13’s root source/link tables; D21’s separate implementation approval tier. Apply D19’s recovery safeguards proportionately rather than adding approval ceremony.
- **Defer:** D11 account-level opaque IDs/deduplication; D17 re-key row mechanics until a re-key is selected and evidence exists.
- **Not applicable now:** D20 reconfirmation of local-only scope; future multi-user/hosted requirements are out of scope.
- **Must remain:** D01–D03 approved identity/tenant decisions; D08 relationship-aware owner resolution; D09 transactional consistency; D14 no-inference provenance; D18 safe append-only schema evolution; D19 recovery safeguards.
- **Evidence/authority unresolved:** D15/D16 historical data and collisions; D22 scope of the specific D02/D05 provisioning restriction and D5/D6 applicability.

These classifications do not change any package status. D04–D22 remain pending unless the Program Authority separately approves or formally dispositions them.

## Dependencies and unresolved questions

1. D08 depends on the approved D01–D03 identity/tenant direction. D04’s cardinality should be the minimum that keeps this single relation unambiguous.
2. D05/D06 simplify if the source registry is reduced; a local relation lifecycle can use existing audit. They do not justify a multi-actor admin model.
3. D10–D13 are interdependent: if four single-source portfolios are sufficient, a normalized source code plus existing row evidence avoids source account tables and link graph. If PA chooses hybrid portfolios, revisit these decisions together before implementation.
4. D15 and D16 require separately authorized live evidence before any historical listing/re-key choice; current repository migrations cannot answer row existence/collision questions.
5. D17/D19 only become concrete if D15 selects re-key. Recovery safeguards remain essential even if a future re-key is deferred.
6. D21 should be reconciled with the authoritative local operating model; this recommendation does not alter “NOT GRANTED” in the tracker.
7. D22 requires explicit resolution of the specific D02/D05 prohibition versus the current local operating model. Do not infer repeal or grant provisioning permission.
8. The exact supported SQLite runtime and whether a migration is necessary for the minimum relationship representation remain untested. DDL acceptance needs a disposable schema test—not an operational database.

## Revised minimum acceptance criteria for detailed schema approval

A proportionate local schema proposal should demonstrate, at minimum:

- **Identity correctness:** exact approved S1 membership subject and existing tuple checks; D02 owner is distinct from S1 owner and derived only from the relationship; no second identity tuple.
- **Tenant/data integrity:** the approved matching-tenant invariant is enforced; relationship and portfolio queries cannot cross owner/tenant/portfolio boundaries.
- **Singleton behavior:** absent, duplicate, revoked or mismatched relationship refuses; there is no arbitrary owner fallback. Avoid extra cardinality design for principals/devices.
- **Direct P1 compatibility:** existing S1 tuple, generic resolver and DP-V8 behavior remain unchanged.
- **Atomicity:** relationship resolution and protected write share one transaction; reads use one consistent snapshot; failures have zero partial store effect.
- **Source independence:** four separate portfolio IDs; Dhan/Zerodha/manual origin remains correctly recorded at holding/import/manual level; a source-specific operation cannot mutate another portfolio; no forced multi-source schema.
- **Unknown-history preservation:** existing NULL/unlinked provenance remains unknown; no backfill by names/symbols. Any claimed historical D02 coverage is supported by evidence.
- **Schema/recovery integrity:** append-only checksummed migration if needed, no data seeding, supported SQLite/FK behavior tested in disposable DB, verified backup and restore for destructive work.
- **Scope controls:** no hosted/multi-user/administrator functionality assumed; no implementation, provisioning, D5 or D6 authority inferred from schema approval.

Detailed schema approval does not require a dynamic provider registry, opaque broker-account IDs, three new source/link tables, or a re-key plan to be executed when their corresponding feature/history is not in current scope. If the Program Authority keeps those options, the necessity and tests should be justified by a concrete requirement.

## Recommended next Program Authority approval group

Recommend a single **minimum-local-schema disposition group**, not 22 separate ceremonial approval events:

1. **Formally disposition D20 as not applicable** (the local scope is already established) and reconcile D21/D22’s proposed separate approval tiers with the local owner-directed model and the specific D02/D05 restriction. This is a governance/evidence clarification, not permission to provision.
2. **Approve or amend a reduced D04–D14 local design** that retains essential singleton, lifecycle, transaction, audit and existing-row provenance behavior while deferring dynamic provider/account/source graph features. D01–D03 remain approved; do not reopen them absent explicit amendment.
3. **Defer D15–D17** until a need for historical inclusion is established; if needed, obtain the explicit scope authority for read-only inventory, then decide alias versus re-key only from evidence. Keep D19 recovery safeguards in any future data operation.
4. **Resolve D18** as an append-only, schema-only migration mechanics choice after disposable SQLite compatibility validation, if the minimum relationship cannot fit existing schema.
5. Keep D21, D22 and the tracker’s recorded statuses unchanged until the Program Authority explicitly records any formal disposition. This review itself grants no implementation or operational permission.

## Formal status and non-actions

- D01–D03: **APPROVED** (unchanged).
- D04–D22: **PENDING** (unchanged; this review does not approve or reject them).
- Detailed schema: **PENDING**.
- Implementation authority: **NOT GRANTED**.
- Operational provisioning/migration: **NOT AUTHORIZED**.
- D5: **BLOCKED**.
- D6: **NOT STARTED**.

No code, schema, migration, database, identity, owner, relationship row, portfolio row, D5 verifier, D6 or IPC/live holdings operation was changed or run. No IRR material was modified.

## Evidence reviewed

- Published decision package (all D01–D22 text, alternatives, recommendations, dependencies and status): [`IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md`](IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md).
- D01–D03 approval record: [`IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md`](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md).
- Revised technical design, §§1–13: [`IPD-D02-OWNERSHIP-RELATIONSHIP-TECHNICAL-DESIGN-2026-11-15.md`](IPD-D02-OWNERSHIP-RELATIONSHIP-TECHNICAL-DESIGN-2026-11-15.md).
- Independent technical acceptance review: [`IPD-D02-OWNERSHIP-RELATIONSHIP-DESIGN-ACCEPTANCE-REVIEW-2026-11-15.md`](IPD-D02-OWNERSHIP-RELATIONSHIP-DESIGN-ACCEPTANCE-REVIEW-2026-11-15.md).
- Product ownership determination: [`IPD-D02-OVERALL-PERSONAL-PORTFOLIO-OWNERSHIP-DETERMINATION-2026-11-15.md`](IPD-D02-OVERALL-PERSONAL-PORTFOLIO-OWNERSHIP-DETERMINATION-2026-11-15.md).
- Approved architecture decision: [`IPD-D02-OWNERSHIP-ARCHITECTURE-DECISION-2026-11-15.md`](IPD-D02-OWNERSHIP-ARCHITECTURE-DECISION-2026-11-15.md).
- Current D5 tracker: [`IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md`](IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md).
- Current owner-directed local operating model: [`../IPD-OPERATING-MODEL.md`](../IPD-OPERATING-MODEL.md).
- Local persistence contract and safeguards: [`../LOCAL-PERSONAL-USE-PERSISTENCE.md`](../LOCAL-PERSONAL-USE-PERSISTENCE.md).
- Current resolver: [`../../src/persistence/binding.ts`](../../src/persistence/binding.ts).
- Existing schema evidence: [`../../src/persistence/migrations/001_initial_schema.ts`](../../src/persistence/migrations/001_initial_schema.ts), [`003_local_principal_bindings.ts`](../../src/persistence/migrations/003_local_principal_bindings.ts), [`004_portfolio_contribution_provenance.ts`](../../src/persistence/migrations/004_portfolio_contribution_provenance.ts), [`006_portfolio_restore.ts`](../../src/persistence/migrations/006_portfolio_restore.ts).

**No operational database access was attempted. No approval, implementation authority or provisioning authority is created by this review.**
