# IIPS v3.0 — G-2: **GATE A LOCAL PROVISIONING — AUTHORITY REQUEST** (IPD side)

**Request ID:** `IIPS-V3-G2-GATE-A-LOCAL-PROVISIONING-AUTHORITY-REQUEST-2026-10-16-01`
**Act type:** AUTHORITY-REQUEST (preparation only — **NOT** an authority act, **NOT** a provisioning
act, **NOT** an implementation, **NOT** a qualification, **NOT** an admission, **NOT** a merge)
**Prepared by:** Arena (Recording Agent only) under the operating-session direction of the Program
Authority; **rendered by no authority** — this artifact requests a disposition, it does not record
one
**Governing standards:** AD-01..AD-18 / AD-CHARTER-2026-01 · Execution mode: **NON_PRODUCTION**
**Repository / branch (this record):** `ramkivs/iips-production-market-data` /
`arena/21c63aef-iips-production-market-data` (the existing authorized **PR #8** workstream)
**Requested decision-maker / capacity:** **Ramki — Program Authority, acting as the IPD
security-contract authority** for `ramkivs/iips-production-market-data`
**Recorded at (local, Asia/Calcutta):** 2026-10-16

---

## 0. ANTECEDENT STATE — VERIFIED READ-ONLY BEFORE THIS REQUEST

| # | Fact | Verified value |
|---|---|---|
| 0.1 | Accepted contract (`L-IPC-1`) | `IIPS-V3-G2-IPD-LOCAL-PRINCIPAL-OS-IPC-SECURITY-CONTRACT-PROPOSAL-2026-10-16-01`, **rev 2, clauses C1–C12** — accepted **WITH CHANGES** for one user / one personal laptop / non-production |
| 0.2 | Accepted revision-2 text blob | `cab04b6f94618c9afad1440882ebf63437fdf6f8` (as accepted at commit `ccba11e`); the acceptance commit `66be695` appended the mandated dated notes, so the file at the PR #8 head is blob `d4aaf4caef4a42a0fbfa74567b486df2a9a38359` — **text unchanged except the directed dated notes** |
| 0.3 | Acceptance record | `IIPS-V3-G2-IPD-SECURITY-CONTRACT-ACCEPTANCE-DECISION-2026-10-16-01` — `evidence/np04/IIPS_v3.0_G2_IPD_SECURITY_CONTRACT_ACCEPTANCE_DECISION_2026-10-16.md`, blob `f708630436358097c11c167d3d8ab1a6c8a54095` |
| 0.4 | Other G-2 records in the workstream | Gate V reconciliation/waiver record blob `8731a86cff5ae8463c59e4d68cf708cb2b706f96`; store-port authority act blob `d0657706848d444189ea97358c3e51cd2b953b88` (+ implementation `8c9ef08`) |
| 0.5 | PR #8 | **OPEN, not merged**; head `arena/21c63aef-iips-production-market-data` @ `66be69518eb3b66b3edac88a64363ca85f99688f`; base `main`; `MERGEABLE` / `CLEAN`; **no competing PR** exists for this workstream |
| 0.6 | IPD `main` | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` — **`src/persistence` files: 0** (no IPD-`main` durable-store basis exists) |
| 0.7 | Accepted G24 lineage (off-main) | `arena/01a0f308-…` @ `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`, tree `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5` — **13 `src/persistence` files**; the only head carrying the durable store |
| 0.8 | Act/governance refs (unmoved) | `arena/01a0e6d9-…` @ `c1b955b42748…` (carries the revert `c1b955b` of the superseded `docs/` G-2 proposal commit `f7513943`, superseded by this PR #8 workstream); governance branch `arena/01a0f839-…` @ `12c480b5bf5c…`; NP-04 pin `np04-governed-persistence-windows` @ `2e11fa3b689d…` |
| 0.9 | Gate A status | **NOT AUTHORIZED** — tenant provisioning is currently **NOT AUTHORIZED** (NP04-G32 §5); this request is the instrument that would change **only** that, for **one** one-time local act |
| 0.10 | IRR state (verified live) | IRR `main` @ `eb4bf820c62eb3e2f5c628a95d59c8f967e3f629`; DP-1 Option 1A′ selected (`GC-D3`, 2026-10-13) with GC-D1 prohibitions + GC-D2 in force; **no IRR DP-1 amendment act rendered** (search: 0); DP-2 Option 2F effective; fence bytes present (see §4) |
| 0.11 | Database state | **No database was created, opened, or modified by this request. No record exists.** Gate A provisioning is prospective only |

---

## 1. PURPOSE AND DECISION SOUGHT

Gate A of the accepted `L-IPC-1` contract is the **one-time, offline, operator-run local
provisioning act**: create one `application_user`, one opaque personal tenant, exactly one `ACTIVE`
membership, and the principal binding; define revocation; add the A-3 audit line.

This artifact prepares that act for disposition. It fixes the **rules, shapes, boundaries, risks,
validation and evidence**; it fixes **no identifier values** (none is invented here) and performs
**no** provisioning.

**Decision sought (single):** the exact wording in **§8** — approve / approve with changes / reject /
defer the Gate A local provisioning act, as scoped in §5, executed once, locally and offline, by the
operator, and recorded per §8.3.

---

## 2. THE PROPOSED GATE A PROVISIONING (items 1–8)

### 2.1 Proposed single `application_user`

| Element | Proposed content |
|---|---|
| Table | `application_users` (existing G24 schema — **unchanged**) |
| Cardinality | **exactly one row** created by Gate A; no other row may be created by this act |
| `application_user_id` | **UUIDv4**, generated at execution via the existing generation path (`IdentityService` → `randomUUID()`, `node:crypto`); opaque; **never derived** from any identifier (no email, hostname, OS account, issuer/subject, `companyId`, or any browser/wire value) |
| `status` | `'ACTIVE'` |
| `created_at` / `updated_at` | the act timestamp, ISO-8601 UTC (existing convention) |
| Creation path | `IdentityService.createApplicationUser(...)` (the existing implementation surface) |
| Explicitly **not** created | **no** `external_identity_mappings` row (deliberately not reused — A-2 rationale); **no** OIDC issuer/subject, no credential, no Keycloak artefact |
| Value rule | the concrete UUID is generated **at execution** and recorded in the executed act; **no value is invented in this request** |

### 2.2 Opaque tenant identifier and its selection rule (proposed rule **T1-r**)

| Element | Proposed content |
|---|---|
| Table | `tenant_memberships` (existing G24 schema — **unchanged**) |
| **Selection rule** | `tenant_id = "t-" + lowercase(crypto.randomUUID())` — 38 characters, opaque, carrying **no semantics** (not a name, not a host, not an account, not an issuer/tenant of any external system) |
| Generation | generated **once**, by the one-time act, at execution; recorded in the executed act |
| Immutability | immutable thereafter; **never re-derived, never reused, never rotated** except by a separately authorized act |
| Prohibited derivations | must not contain or encode: hostname, OS account name, e-mail, machine id, `companyId`/`runtimeCompanyId`, issuer/subject, portfolio or app-user values |
| Scope of appearance | only in `tenant_memberships.tenant_id` and `local_principal_bindings.tenant_id` (and later in `user_portfolios.tenant_id` only under separately authorized gates) |
| Explicitly not created | no tenant directory, no tenant administration endpoint, no roles/RBAC, no self-service, no restoration semantics, no cross-system audit — `tenant_memberships` is **not** an enterprise tenant source of truth (NP04-G32 §5/§9 preserved) |
| Open item | this rule is the response to the contract's **U-4** ("tenant value rule … no value is invented here"); the **value** is generated at execution, not by this request |

### 2.3 Requirement for exactly one `ACTIVE` tenant membership

| Element | Proposed content |
|---|---|
| Row | `(application_user_id, tenant_id, state = 'ACTIVE', created_at, updated_at)`; PK `(application_user_id, tenant_id)` — existing schema, **unchanged** |
| Cardinality | **exactly one** membership row in total for this principal; **exactly one** may ever be `ACTIVE` on this store |
| Creation path | `IdentityService.provisionTenantMembership(...)` — *"the ONLY way a membership comes into existence — it is never inferred from request context"*; executed inside `immediateTransaction` |
| Invariant basis | `resolveTenant()` fails closed, unchanged: no membership → `Missing`; explicit tenant absent → `Missing`; not `ACTIVE` → `Revoked`; **>1 `ACTIVE` with no tenant supplied → `Missing` (never guessed)**; zero `ACTIVE` → `Revoked` |
| Caller hints | unnecessary on this path: the binding's membership is the sole tenant source; `x-ipd-tenant-*` hints are not used (C3/C7) |
| Forbidden | a second tenant, a second membership row, any membership-state invention, any change to the fail-closed rule |

### 2.4 A-2 — local principal binding record and required lifecycle

**Additive migration `003_local_principal_bindings`** (append-only registry; migrations `001`/`002`
are applied and **must never be edited**). Proposed DDL (draft; exact text is the implementation's,
under this act's acceptance):

```sql
CREATE TABLE local_principal_bindings (
    endpoint_id         TEXT PRIMARY KEY,
    application_user_id TEXT NOT NULL REFERENCES application_users(application_user_id),
    tenant_id           TEXT NOT NULL,
    state               TEXT NOT NULL CHECK (state IN ('ACTIVE','REVOKED')),
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL,
    revoked_at          TEXT
);
CREATE INDEX idx_local_principal_bindings_user
    ON local_principal_bindings (application_user_id, state);
```

| Element | Proposed content |
|---|---|
| `endpoint_id` rule | `"ep-" + lowercase(crypto.randomUUID())` — opaque, act-chosen, generated at execution; **never a wire field** (C3/C7); recorded in the executed act |
| Cardinality | **exactly one** row; one deployment, one principal |
| Lifecycle | created `ACTIVE` by the same one-time act → `REVOKED` by explicit revocation (§2.5); **one-way**; no `PENDING` phase (provisioning is atomic and offline) |
| Resolution rule | require **exactly one `ACTIVE`** binding; zero or more than one → **refuse** (fail-closed, no owner disclosed) |
| Deliberate non-reuse | **not** `external_identity_mappings` (a transport fact must not be conflated with an external-identity claim); **no** issuer/subject columns; no mapping lifecycle reuse |
| Deletion | none — rows are retained after revocation (audit); no cascade delete |
| Associated additions | the A-3 audit line (§2.6), written in the same transaction as every binding/membership lifecycle mutation |

### 2.5 Revocation semantics (proposed; one-way)

| Event | Mechanism | Effect |
|---|---|---|
| Binding revocation | set `state='REVOKED'`, `revoked_at`, `updated_at` — one transaction | endpoint resolves no `ACTIVE` binding → **refuses**; no owner disclosed |
| Membership revocation | `IdentityService.revokeTenantMembership(...)` → `state='REVOKED'` | `resolveTenant()` → `TenantMembershipRevokedError` (fail-closed) |
| Application-user status | out of scope | `SUSPENDED` is **not** authorized by Gate A |
| **Restoration** (`REVOKED → ACTIVE`) | **NOT authorized** | The implicit restoration behaviour of `upsertTenantMembership` (`ON CONFLICT … DO UPDATE SET state = excluded.state`) is the **recorded DEFERRED governance item** (NP04-G32 §5.3); Gate A neither exercises nor relies on it, and approval of Gate A must not be read as approving restoration semantics |
| Audit | each revocation writes its A-3 audit line in-transaction | refuses without partial effect |
| Re-provisioning | after revocation, re-provisioning requires a **new explicit act** | no in-place un-revoke, no re-bind by reuse |

### 2.6 A-3 — the local audit line (proposed)

| Element | Proposed content |
|---|---|
| Purpose | audit **binding and membership lifecycle mutations** — both currently **unaudited** (NP04-G32 §5.4) |
| Shape | one additive table mirroring the existing `mapping_audit_events` pattern: `local_principal_audit_events(seq INTEGER PRIMARY KEY AUTOINCREMENT, audit_id TEXT NOT NULL UNIQUE, subject_type TEXT NOT NULL, subject_id TEXT NOT NULL, action TEXT NOT NULL, previous_state TEXT, new_state TEXT, actor TEXT NOT NULL, context TEXT, occurred_at TEXT NOT NULL)` — deterministic ordering by `seq`, reads `ORDER BY seq ASC` |
| Events written by Gate A | `BINDING_CREATED`, `MEMBERSHIP_CREATED`; on revocation: `BINDING_REVOKED`, `MEMBERSHIP_REVOKED` |
| Actor | the operator's `GovernanceActorContext` (`actor` per the existing convention; `context` = the provisioning reference) |
| Transaction | written **in the same transaction** as the mutation it audits |
| Destination | **local only** — no cross-system audit destination is created or implied; cross-system security-audit delivery remains **NOT ESTABLISHED / DEFERRED** |
| Prohibited | no audit-table rewriting of historical rows; no destination configuration; no external transmission |

### 2.7 Validation and rollback expectations

| Step | Expectation |
|---|---|
| Pre-run record | absolute `IPD_PORTFOLIO_DB_PATH`; sha256 of the DB file; migration-ledger rows; row counts; the referenced `main`/lineage refs |
| Pre-run backup | one same-directory file copy (`journalMode = DELETE`, `synchronous = FULL` — no WAL side-files); backup name + hash recorded |
| Atomicity | all Gate A writes inside **one `immediateTransaction`** (existing pattern, reused); any failure ⇒ automatic rollback; **no partial state** is possible |
| Post-run validation | V-A1…V-A8 (§7) executed **read-only** |
| On validation failure | **restore the pre-run backup** (file copy), halt, report; **no** manual repair, **no** in-place un-revoke; a failed Gate A leaves no authorized state and may be re-attempted only under a fresh act |
| Revocation rehearsal | optional and **only on a disposable copy** of the DB: revoke on the copy, assert fail-closed `resolveTenant`, discard the copy; the live row stays `ACTIVE` |
| Prohibited | editing migrations `001`/`002`; schema changes beyond migration `003` + the A-3 table; any write performed by validation tooling |

### 2.8 Evidence needed to prove the provisioning state

1. **Executed-act record** (durable, published per convention): timestamp (local + UTC); executor = the operator, offline; the **named basis ref** used (see §3.2) with blob hashes of migration `003` and the A-3 module; Node and `better-sqlite3` versions; DB path.
2. **Read-only SQL outputs**: exact contents of the three rows (`application_users` ×1; `tenant_memberships` ×1 `ACTIVE`; `local_principal_bindings` ×1 `ACTIVE`); counts for each; the `local_principal_audit_events` rows with `seq`; the migration ledger covering `001`–`003`; schema version `003`.
3. **Absence checks**: `external_identity_mappings` = 0; `user_portfolios` = 0; portfolio/revision rows = 0; any other user/membership/binding = 0.
4. **File evidence**: pre/post sha256 of the DB file; backup file name + hash.
5. **Invariant re-verification at evidence time**: IRR fence blobs unchanged (§4.3); IPD `main` unmoved; PR #8 unmerged; no promotion of the off-main lineage.
6. **Durability**: the executed record is committed and pushed; remote ref/commit/blob/tree verified; byte identity checked.

---

## 3. DEPENDENCIES AND THE GATE BOUNDARY (item 9)

### 3.1 Boundary between provisioning, implementation authority, and qualification

| Gate | Content | State |
|---|---|---|
| **A — Local provisioning** *(this request)* | **only**: (i) the two narrow accepted additions **A-2** (migration `003`) and **A-3** (audit line); (ii) the **one-time data provisioning** (3 rows + audit rows); (iii) revocation defined; (iv) validation + evidence of §2.7–§2.8. **No endpoint, no resolver/runtime wiring, no IPC transport, no refusal-matrix, no canonical-identity code, no IRR change, no route/UI, no write policy** | **REQUESTED — NOT AUTHORIZED** |
| **B — Implementation authority** | the endpoint, its resolver wiring, the C5/C7 rules, canonical identity (§7.3), and the exact IPD+IRR files/tests; must also state **whether an IPD-`main` implementation basis exists or must be created** — `main` has **none** (§0.6), and the off-main lineage is **not** a base | **NOT AUTHORIZED — not granted or inferred here** |
| **C — Qualification** | execute §10 / Q1–Q11 **including the V-E items** on the realized endpoint; publish raw evidence | **NOT AUTHORIZED — not granted or inferred here** |
| **D — Route/consumer admission** | per-operation admission; IRR's 503 fence stays in force until then | **NOT AUTHORIZED — not granted or inferred here** |
| **E — Write policy / canonical identity** | designate the resolution source for the write path and the successful-write policy; `L-IPC-1` presumes **no** successful writes | **NOT AUTHORIZED — not granted or inferred here** |

**Provisioning ≠ implementation ≠ qualification.** Gate A creates data (and only the two accepted
enabling additions); it proves nothing about the endpoint, produces no successful write, and
constitutes no qualification evidence. A completed Gate A does **not** advance B/C/D/E by
implication, and none of them may begin on the strength of this request.

### 3.2 Explicit dependencies

1. **This disposition** (§8) by the Program Authority in the IPD security-contract capacity.
2. **A named non-`main` execution basis.** Gate A must run against a named local checkout whose ref
   is identified in the executed record. `main` has no `src/persistence`; the durable store exists
   only on the off-main G24 lineage (`arena/01a0f308-…` @ `6828155…`, tree `eb07ea36…`) or on a
   derivative local branch carrying the accepted A-2/A-3 additions. **The off-main lineage is not
   promoted, merged, cherry-picked, re-pinned, or admitted by Gate A** — nor by this request.
3. **A local store** created at execution via `IPD_PORTFOLIO_DB_PATH` (absolute path required;
   foreign keys enforced; `DELETE` journal; `synchronous = FULL`).
4. **The operator** executes the act offline; the Recording Agent prepares and records — it does not
   provision.
5. **IRR-side acts remain separate and are NOT satisfied or inferred here**: the **IRR DP-1
   amendment** is still required and unrendered (§4.2); the IRR-side prerequisites (P-1, P-2, P-4
   operator-only offline provisioning acts, P-6, P-8) remain IRR-side governance. An act in one
   repository does not amend the other.
6. **PR #8** remains unmerged; this request neither merges it nor creates a competing PR.

---

## 4. INVARIANTS — EXPRESSLY CONFIRMED (item 10)

### 4.1 DP-2 Option 2F

**In force, unchanged, unrelaxed.** DP-2 Option 2F (approved narrowly as `GC-D2`) refuses
unresolved/ambiguous holdings **before serialization and before persistence-port invocation**; the
non-production operator bypass is not restored, ported, or admitted; no false canonical-provenance
declaration is emitted. Its implementation (S2–S4) is published and independently verified, and
remains byte-present on IRR `main`. Nothing in this request touches it.

### 4.2 IRR DP-1 — status of the amendment

**The IRR DP-1 amendment remains REQUIRED and NOT RENDERED.** Verified at preparation time: DP-1
Option 1A′ remains the selected direction (`GC-D3`, 2026-10-13); GC-D1's operational prohibitions
(no issuer, no OIDC/Keycloak configuration, no delegated credential, no mapping, no provisioning, no
tenant membership) and all of `GC-D2` remain in force; **no DP-1 amendment act exists in IRR** (search
result: 0). The IPD security-contract acceptance did not amend IRR, is not inferred to have done so,
and neither does this request. The DP-1 amendment remains a separate IRR-side act under its own
explicit authority, preserving DP-2 Option 2F, H-18 scope, and the 503 fence.

### 4.3 HTTP 503 `owner-context-unavailable` fence

**Intact and fail-closed** at IRR `main` @ `eb4bf820c62eb3e2f5c628a95d59c8f967e3f629`:

| File | Blob | Property |
|---|---|---|
| `frontend/server/owner-context-unavailable.ts` | `cb8db45d668d28cee7e0a52721001d579a872733` | `res.writeHead(503 …)`, body `{ error: 'owner-context-unavailable' }` |
| `frontend/server/user-portfolio-transport.ts` | `51704c12a467cd2f718a030b5036bc55c9afa73f` | all **six** `/api/user-portfolios*` routes (incl. `PUT …/holdings`) end in `respondOwnerContextUnavailable`; no body, tenant claim, or `Authorization` header is read |

Both blobs are **identical** to the fence hashes independently verified and recorded in the
preceding G-2 records (`…/51704c12…/cb8db45d…`) — the fence is byte-unchanged since that
verification. `L-IPC-1` acceptance and this request remove no fence; the fence stays until Gate D.

---

## 5. CONCRETE SCOPE OF THE REQUESTED GATE A ACT

**In scope (exhaustive):**

1. additive migration `003_local_principal_bindings` (one table, one index) — the A-2 record;
2. the A-3 local audit table + the four event writes (create/revoke × binding/membership), in-transaction;
3. creation of **exactly one** `application_users` row (UUIDv4, `ACTIVE`);
4. creation of **exactly one** `tenant_memberships` row (`ACTIVE`, opaque `t-<uuidv4>` tenant, per §2.2);
5. creation of **exactly one** `local_principal_bindings` row (`ACTIVE`, opaque `ep-<uuidv4>` endpoint, per §2.4);
6. definition (not execution) of the one-way revocation semantics of §2.5;
7. execution of the validation of §2.7 / §7 and publication of the evidence of §2.8;
8. the durable authority/execution record of §8.3.

**Out of scope (exhaustive):** any endpoint or IPC server; any resolver/runtime wiring; any
refusal-matrix or canonical-identity code; any IRR file; any route/UI activation; any consumer
admission; any write policy or successful write; any portfolio/`user_portfolios` row; any
`external_identity_mappings` row; any issuer/credential/OIDC/Keycloak artefact; tenant
administration/lifecycle/restoration/audit-expansion; multi-user or enterprise tenancy; any
promotion, merge, cherry-pick, or re-pin of the off-main G24 lineage; modification of `main`, of
`arena/01a0e6d9-…`, of `arena/01a0f308-…`, or of the governance branch; merging PR #8; any ChatGPT
Library tracker change; any production activity; Gate B/C/D/E.

---

## 6. RISKS AND DISCLOSURES (for the disposition)

| # | Risk | Statement |
|---|---|---|
| R-1 | **Authority gap (the current blocker)** | Tenant provisioning is currently **NOT AUTHORIZED** (NP04-G32 §5). This request is the enabling instrument; it would authorize **only** the single bounded act of §5 — no standing provisioning capability |
| R-2 | **Misreading `tenant_memberships` as an enterprise tenant register** | Explicitly not: one opaque local row, no directory, no roles, no admin surface (T1; NP04-G32 §9 preserved) |
| R-3 | **Restoration semantics** | The implicit `REVOKED → ACTIVE` behaviour of `upsertTenantMembership` is **DEFERRED governance**; Gate A revocation is one-way, and approval must not be read as approving restoration |
| R-4 | **Audit gap** | Membership mutations are currently unaudited; A-3 adds the local line only. Cross-system security-audit delivery remains **NOT ESTABLISHED** — and is not created or implied |
| R-5 | **Same-user residual (T-1)** | The PA's acceptance records that a process running as the operator's own account (including malware) is **outside** the protection boundary; Gate A does not mitigate it and makes no security claim |
| R-6 | **Identifier entanglement** | Both opaque values and the endpoint id are generated, never derived; this prevents any equivalence with IRR principals, `ownerUserId`/F-3 pairs, OIDC subjects, or `companyId` |
| R-7 | **Store basis** | Executing against `main` is impossible (no persistence code); executing against the off-main lineage must not slide into promotion. The named basis is recorded and verified; promotion remains prohibited |
| R-8 | **Rollback/irreversibility** | Provisioning is transaction-atomic; a failed validation restores the pre-run backup; there is no in-place un-revoke and no silent re-provisioning. A revoked state is a governance state, not a reversible toggle |
| R-9 | **Single-ACTIVE invariant** | Any second `ACTIVE` membership would make `resolveTenant()` ambiguous (`Missing`, never guessed) — Gate A forbids and must evidence the absence of any second row |
| R-10 | **Non-production boundary** | No production readiness, deployment, operability, successful-write, or admission claim arises from Gate A or from this request |

---

## 7. VALIDATION CRITERIA FOR GATE A (post-execution, read-only)

| # | Criterion | Expectation |
|---|---|---|
| V-A1 | Schema | migration ledger shows `001`–`003` applied with recorded checksums; schema version `003`; migrations `001`/`002` **unmodified** (checksums unchanged) |
| V-A2 | Single application user | `SELECT COUNT(*) FROM application_users` = **1**; `status='ACTIVE'`; id is a valid opaque UUIDv4 not derivable from any other recorded value |
| V-A3 | Single ACTIVE membership | exactly one `tenant_memberships` row for that user; `state='ACTIVE'`; `tenant_id` matches the recorded `t-<uuidv4>`; no other membership row exists |
| V-A4 | Single ACTIVE binding | exactly one `local_principal_bindings` row; `state='ACTIVE'`; FK → the provisioned user; `tenant_id` matches; `endpoint_id` matches the recorded `ep-<uuidv4>` |
| V-A5 | Audit line | `local_principal_audit_events` contains `BINDING_CREATED` and `MEMBERSHIP_CREATED` for this act, with `actor`/`context`/`occurred_at`, ordered by `seq`; rows were written in the same transaction as their mutations |
| V-A6 | Absences | `external_identity_mappings` = 0; `user_portfolios` = 0; portfolio/revision rows = 0; no other users/memberships/bindings |
| V-A7 | Fail-closed resolution | `resolveTenant(applicationUserId)` returns exactly the provisioned tenant in a read-only check; a probe for any other/absent membership/id fails **indistinguishably** from "not found" |
| V-A8 | Invariants | IRR fence blobs unchanged; IPD `main` unmoved; PR #8 unmerged; no ref promoted or merged; no endpoint or IRR change attributable to Gate A |

Any failed criterion ⇒ §2.7 rollback; the act reports `GATE A — FAILED` and executes nothing further.

---

## 8. THE EXACT GATE A DECISION SOUGHT

### 8.1 Verbatim-quotable decision wording (proposed for the Program Authority)

> I, Ramki, as Program Authority and IPD security-contract authority, decide on
> `IIPS-V3-G2-GATE-A-LOCAL-PROVISIONING-AUTHORITY-REQUEST-2026-10-16-01`, for **one user, one
> personal laptop, non-production**: **APPROVE / APPROVE WITH CHANGES / REJECT / DEFER** the Gate A
> local provisioning act — one `application_user` (UUIDv4, `ACTIVE`); one opaque, act-chosen tenant
> `t-<uuidv4>`; **exactly one** `ACTIVE` `tenant_memberships` row; the A-2 binding record
> (migration `003`, one `ACTIVE` `local_principal_bindings` row `ep-<uuidv4>`); the A-3 local audit
> line; one-way revocation with **no** restoration; the validation and evidence of §2.7–§2.8 —
> executed **once**, locally and offline, by the operator, against the local store on the named
> non-`main` basis recorded in the executed act.
> I record that Gate A grants **no** endpoint implementation, **no** resolver/runtime wiring, **no**
> IRR change, **no** route admission, **no** write policy, and **no** successful-write authority;
> that DP-2 Option 2F, the IRR DP-1 status (amendment still required and not rendered), and the
> HTTP 503 `owner-context-unavailable` fence remain in force; that the off-main G24 lineage is not
> promoted, merged, cherry-picked or re-pinned; that PR #8 is not merged; and that Gates B, C, D
> and E remain separate, un-granted authority gates.

### 8.2 What approval would and would not do

| Approval **would** | Approval **would not** |
|---|---|
| Authorize the single bounded act of §5, once | Create any standing provisioning capability |
| Permit the A-2/A-3 additions (already accepted in principle) to be realized | Authorize the endpoint or any runtime code (Gate B) |
| Permit the three rows + audit rows to exist on the local store | Produce any successful write, admission, or operability claim |
| Define revocation (one-way) | Authorize restoration, tenant administration, or audit expansion |
| Require validation + evidence + rollback | Authorize `main`, promotion, merge, or PR #8's merge |

### 8.3 Recording and durability (proposed mechanics)

1. The decision is **not** recorded in this request. It is rendered by the Program Authority and
   then recorded as a **separate durable IPD-side record** in the G-2 workstream
   (`evidence/np04/`, same branch/PR #8), per the established convention (commit + push +
   remote verification + byte identity).
2. The **executed** Gate A act later publishes its own record (scope of §5, evidence of §2.8,
   disposition `GATE A — PROVISIONED / VALIDATED` or `GATE A — FAILED / ROLLED BACK`).
3. No record is written into IRR, and the ChatGPT Library tracker is not modified, by any step of
   this proposal.

---

## 9. EXPLICIT AUTHORIZATION REQUIRED FROM THE PROGRAM AUTHORITY

1. **The single decision in §8.1** (approve / approve with changes / reject / defer), rendered in
   the **IPD security-contract authority capacity**.
2. **Confirmation of the two open value rules** (contract items `U-4`/`U-6` disposition): the
   **tenant rule T1-r** (§2.2) and the **endpoint-id rule** (§2.4) — or amended rules.
3. **Designation of the named non-`main` execution basis** for the act (§3.2 item 2), or a
   direction that Gate B must first create the basis.
4. **Confirmation of the revocation position**: one-way revocation; no restoration; re-provisioning
   only under a new act (§2.5).
5. **Confirmation of the A-3 scope**: local line only; no cross-system destination (§2.6).
6. **Confirmation that Gate A includes the A-2/A-3 enablement change** as its only code/schema
   scope (§3.1 item 1) — with everything else deferred to B/C/D/E.
7. **Confirmation of the publication form** (§8.3): the decision recorded as a separate durable
   record in the PR #8 workstream.

---

## 10. WHAT THIS REQUEST DOES NOT DO

This request: **creates no database record and opens no database**; **provisions no tenant,
principal, or binding**; **implements no endpoint** and no runtime code; **grants and infers no**
Gate B, C, D, or E authority; **does not** promote, merge, cherry-pick, or re-pin the unadmitted
G24 lineage; **does not** merge PR #8 and creates no competing PR; **does not** modify the ChatGPT
Library tracker or any IRR artifact; **does not** amend DP-1, DP-2 Option 2F, or the 503 fence;
**does not** authorize production, certification, or any successful write; and **renders no
authority** — every decision in this artifact is a proposal for the Program Authority's disposition.

---

## 11. PUBLICATION OF THIS REQUEST

Published through the **existing authorized PR #8 workstream**
(`arena/21c63aef-iips-production-market-data`) — one added governance artifact, no competing PR, no
implementation file, no schema change, no database change. The added file is the only change in its
commit; the IPD implementation refs, the target branch, the governance branch and `main` are
untouched.

*End of request `IIPS-V3-G2-GATE-A-LOCAL-PROVISIONING-AUTHORITY-REQUEST-2026-10-16-01` —
**PREPARED, NOT AUTHORIZED, NOT EXECUTED**.*
