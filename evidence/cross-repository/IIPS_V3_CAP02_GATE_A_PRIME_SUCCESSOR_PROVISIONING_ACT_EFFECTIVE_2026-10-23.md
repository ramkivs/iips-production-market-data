# CAP-02 — Gate A′ Successor Provisioning Act — **RENDERED — EFFECTIVE ON PUBLICATION (SUCCESSOR BASIS + BOUNDED ENTRYPOINT AUTHORITY)**

> ## STATUS: **RENDERED — EFFECTIVE ONLY ON PUBLICATION TO IPD `main` (§13) · successor basis designated · 2026-10-17 execution basis superseded · bounded entrypoint implementation authority granted · PROVISIONING EXECUTION *NOT* AUTHORIZED (three identity values unresolved)**
>
> **Until this content is merged to `ramkivs/iips-production-market-data` `refs/heads/main` with green CI and remote read-back, this instrument is `RENDERED — NOT EFFECTIVE` and grants nothing.**
>
> This is a **Program Authority determination**, not a proposal. It discharges the decision request
> recorded at `IIPS-V3-CAP02-SUCCESSOR-GATE-A-PRIME-PROPOSAL-2026-10-23-01` (IPD, blob
> `9eb99fc6…`-class record, **PROPOSED — NOT EFFECTIVE**, preserved unmodified) and satisfies the
> exact missing act identified at that record's §4, **except** for the three identity values, which
> have no authoritative source in either repository and are recorded here as precise unresolved
> fields rather than invented (§4).
>
> **What this act does:** selects the current IPD commit/tree as the successor Gate A′ basis; supersedes
> the *execution basis* of the 2026-10-17 Gate A′ act without deleting or rewriting it; authorizes one
> precisely bounded provisioning entrypoint, its read-only validator and its tests; fixes fail-closed
> behaviour, authorization checks, duplicate handling, the desktop-host procedure and the
> V-A2-1…V-A2-8 evidence; and preserves every unrelated authorization and persistence restriction.
>
> **What this act does not do:** it provisions nothing, creates no store, inserts no row, selects no
> identity value, executes no Gate C or Gate 4 item, accepts no result, admits nothing, authorizes no
> operational write, changes no W-1 predicate, and touches no IRR file.

| Field | Value |
|---|---|
| **Act ID** | `IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01` (census: string absent from both repositories before this record) |
| **Record type** | Rendered Program Authority decision — successor Gate A′ provisioning basis, bounded implementation authority, validation and runbook |
| **Rendered / decision date** | `2026-10-23` (UTC) — actual date, not backdated |
| **Deciding authority** | **Ramki — Program Authority**, acting in the **IPD security-contract capacity** that rendered `IIPS-V3-G2-IPD-GATE-A-PRIME-PA-DECISION-2026-10-17-01` |
| **Authority exercised** | The recorded global standing approval — F-3 §1.2, transcribed verbatim, IRR blob `c4c9f7d79ef181af96f6c4e5cc108288ef22fd02` — as construed by DEC-06 (`IIPS-V3-DEC06-AUTHORITY-RECONCILIATION-IRR-2026-10-21-01`, IRR blob `4be3ea578a51a1a949337e5d218b89841c04892d`) rules R-1/R-3, **plus** the Program Authority's explicit direction of `2026-10-23` requiring this decision to be rendered in this pass |
| **Governing prior act (preserved)** | `IIPS-V3-G2-IPD-GATE-A-PRIME-PA-DECISION-2026-10-17-01` — `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PRIME_PA_DECISION_RENDERED_2026-10-17.md`, blob `c04f8a304acaffe49f92a5aac2ce2242673e9a51` — **APPROVED / NOT EXECUTED / one execution**; **not modified, not deleted, not rewritten**; superseded as to its **execution basis only** (§3) |
| **Repository and locus** | `ramkivs/iips-production-market-data` — rendered in the PA's IPD security-contract capacity. IRR is read-only in this pass: no IRR file, branch, PR, issue, comment or tracker was modified |
| **Successor implementation basis (selected)** | IPD `refs/heads/main` @ **`5fc74085ade980846ff4a07b36415b6d49446486`**, root tree **`7226ef0033b3a7049169d8fcf9bcbc9908e2590b`** (re-verified live at publication: `git ls-remote` = fetched `origin/main`; designated blobs unchanged; §2.3 drift record) |
| **Identity values** | **UNRESOLVED — `principal_label`, `tenantId`, `canonicalOwnerId`** · no authoritative source located · **no value selected** (§4) |
| **Provisioning execution** | **NOT AUTHORIZED** — blocked by §4 (values) and by the host prerequisite; this act authorizes **code and validation only** |
| **Status** | **RENDERED — EFFECTIVE** on completion of §13 (merge to IPD `main`, green CI, remote read-back). Effectiveness is a publication condition, not a second decision |
| **Publication receipt** | Recorded in `evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md` **after** merge. This instrument's text is not edited after merge |

---

## 1. The decision, in five sentences

1. The **current IPD commit and tree** named in the header is selected as the successor Gate A′
   provisioning basis, replacing the 2026-10-17 act's execution basis, which cannot be executed
   against `main` (§2, §3).
2. The 2026-10-17 act's **historical record is preserved byte-identically**; only its *execution
   basis* is superseded, and its authorization is neither re-opened, extended nor re-consumed.
3. **Exactly one** bounded implementation authority is granted — the four-path entrypoint/validator/
   test change specified in §5 — and nothing else in the repository may change.
4. The **three identity values** required to execute any provisioning have no authoritative IPD-owned
   source; they are recorded as unresolved, and the entrypoint must therefore refuse execution
   (§4, §7). Selecting them is a **separate determination**, not a routine approval.
5. **Nothing is provisioned** by this act; the host procedure and evidence in §8 exist so that a
   future authorized execution is bounded, reproducible and single-use.

## 2. Verified basis — measured in this pass, not assumed

| Item | Verified value | Method |
|---|---|---|
| IPD `main` | `5fc74085ade980846ff4a07b36415b6d49446486` / tree `7226ef0033b3a7049169d8fcf9bcbc9908e2590b` | `git ls-remote origin main` == `git rev-parse origin/main` == fetched tip; `git rev-parse origin/main^{tree}` |
| **Drift since the first draft of this act** | `ddaaef98…`/`29cdf772…` → `5fc74085…`/`7226ef00…`: **8 commits**, PRs **#64**, **#65**, **#66**, all **documentation/evidence only** (51×17 capability-matrix reconstruction, artifacts and receipts). `git diff --name-only <old> <new> -- src tests scripts frontend package.json package-lock.json tsconfig*.json vite.config.ts .github` = **0 paths**. All 12 designated blobs of §2.1 resolve to identical object ids at the new tip. The basis is therefore **re-pinned to the true current tip** rather than left stale; nothing in the act's substance changed |
| Preceding merges reconciled | PR **#62** merged `a3ababf183b118a7c5dd9ab31cd6dddc02d1905d` at `2026-10-23T14:08:35Z`; PR **#63** merged `ddaaef98…` at `2026-10-23T14:11:22Z` | `gh pr view 62/63` — both `MERGED`, `mergeCommit` values match the receipt recorded in the tracker |
| Local validation at the selected basis | `npm ci` exit 0 · `npx tsc --noEmit` exit 0 · `npm run build` exit 0 · `npm test` exit 0 — **875 executed / 874 passed / 0 failed / 1 skipped** | Executed in this pass on this exact tree (Linux, Node v22.22.3). **Repository-level evidence only; not host qualification** |

### 2.1 Designated blob identities (verified in the Git object database at the selected basis)

| # | Path | Blob | Role |
|---|---|---|---|
| 1 | `src/persistence/provisioning.ts` | `dc844189a1c92f00acc3d7572c22f3e28e138eb6` | the library-only mutator (`provisionActiveBinding`), module-private brand |
| 2 | `src/persistence/binding.ts` | `96d0079dd04b75c6f257a2001c8f7eff1ffc560a` | `resolveActiveBinding` / in-transaction revalidation |
| 3 | `src/persistence/audit.ts` | `273ccd3be29d7aca971933b6a28a4b4703504bf2` | hash-chained `appendAuditEvent` |
| 4 | `src/persistence/connection.ts` | `5169e402707cf1a73f16bfb15ffe0b1d395165ff` | `node:sqlite` connection + runtime guard |
| 5 | `src/persistence/migrations/001_initial_schema.ts` | `f594a18264c45ccdcbfa2381592820a72d3c453b` | frozen migration 001 |
| 6 | `src/persistence/migrations/002_audit_event_sequence.ts` | `932af8e603c4be41c9f0d8a6b051f41836c1fee8` | migration 002 |
| 7 | `src/persistence/migrations/003_local_principal_bindings.ts` | `32b125bf962bb76a6ae59d3b262203dbbb988197` | `local_principal_bindings` + `local_principal_memberships` + single-`ACTIVE` partial unique indexes |
| 8 | `src/persistence/migrations/004_portfolio_contribution_provenance.ts` | `6bad5a5095b6bb94ce91a86a4b65f7ab915c516c` | provenance migration 004 |
| 9 | `src/ipc/dispatch.ts` | `27becc76749f5b11a37ca4e6254d58132620f57f` | W-1 write refusal before mutation |
| 10 | `src/persistence/portfolio_store.ts` | `4a005b737de26443e261156a3102d553dd90b726` | `evaluatePortSaveGuard()` hard-false |
| 11 | `package.json` | `51796e63280c1abb368c27bf8811cc6bad46e132` | **must not change** under this act |
| 12 | `tests/g3_startup_validation.test.ts` | `9a5fd9e3b22693e95304a1cd2df812bbf9ea2299` | existing static-unreachability regression (bounded addition permitted, §5) |

### 2.2 Why the 2026-10-17 basis remains inapplicable (unchanged facts, re-verified)

D-A′-1 of the 2026-10-17 act pins `refs/heads/gate-a/local-principal-enablement-2026-10-16` @
`2ded0e98…` and four blobs. On the selected basis, three of those four paths **do not exist**
(`src/gate_a/provision.ts`, `src/gate_a/validate.ts`, `src/app_identity/local_principal.ts`) and
migration `003` differs (`9ba884ac…` vs `32b125bf…`). The two schemas are mutually incompatible
(the old basis provisions `application_users`, `tenant_memberships`, `local_principal_audit_events`;
`main` has none of them and its `local_principal_bindings` has different columns). Applying `main`'s
migration set over a basis-schema store fails closed (`table portfolio_revisions already exists`).
Gate E §4 requires qualification against the implementation actually under qualification, so a store
the qualified build cannot open would satisfy no QE item. **This is why a successor act is required,
and it is a measured fact, not a preference.**

## 3. Supersession of the 2026-10-17 execution basis — exact scope

**Superseded (for all future execution):**

- D-A′-1 (execution basis: the `2ded0e98…` ref, tree and four blobs);
- D-A′-4 items 2–6, D-A′-5, D-A′-6, D-A′-7 and D-A′-9 **only insofar as they bind execution to that
  basis, its tools and its V-A1…V-A8 validation over the old schema**;
- the correspondence of the 2026-10-17 act to the current `main` schema, tools and validation.

**Preserved, unchanged, and not re-opened:**

- the 2026-10-17 record itself — same path, same blob `c04f8a30…`, same text, still
  `APPROVED / NOT EXECUTED`;
- its **single execution** is not carried over, not re-issued and not increased by this act; no
  execution occurred under it;
- D-A′-2 (host identity), D-A′-3 (rule P-1), D-A′-8 (one execution, consumed on success **or**
  failure), D-A′-10 (non-grants) — re-adopted verbatim in §8/§9 below as the successor act's own
  terms, without amending the original;
- every Gate 3, `G3-AMEND-01`, Gate E, contract v1, Q1/Q1-b and Gate 4 instrument.

**No retroactive effect.** This act does not ratify anything previously done, does not create
authority for any past act, and does not repair the inapplicable basis — it replaces it prospectively.

## 4. The three identity values — **UNRESOLVED** (precise record, no fabrication)

The current schema represents the principal only as `local_principal_bindings.principal_label`
(plain `TEXT`), and the owner context only as `local_principal_memberships.(tenant_id,
canonical_owner_id)`. Execution therefore requires three verbatim values. **This act names none of
them, because no authoritative source exists.**

| Field | Column | Authoritative IPD-owned source located | Status |
|---|---|---|---|
| `principal_label` | `local_principal_bindings.principal_label` | **None.** No IPD act, decision, manifest or data set names the operator's IPD principal label. The 2026-10-17 act deliberately generated its principal identifiers at execution (`UUIDv4`, "never derived") and therefore names no label that survives into this schema | **UNRESOLVED** |
| `tenantId` | `local_principal_memberships.tenant_id` | **None.** No IPD-owned record fixes an IPD tenant identifier. `Tenant administration = NOT AUTHORIZED` (`NP04-GOVERNANCE-AUTHORITY-RECORD.md` §5.1) remains in force and supplies no value | **UNRESOLVED** |
| `canonicalOwnerId` | `local_principal_memberships.canonical_owner_id` | **None.** No IPD-owned record fixes an IPD canonical owner identifier | **UNRESOLVED** |

**Why the value could not be sourced, stated plainly.**

1. The only concrete owner-context pair in the programme is **IRR's**: `owner-7f3a91c2` /
   `irr-domain-4b82d6e1` (F-3, IRR blob `c4c9f7d7…`). F-3 records **"Value-selection authority: NOT
   EXERCISED"**; the pair is IRR-domain, the tenant value literally names the IRR domain, and no
   effective act establishes namespace equivalence with IPD. Copying it across the repository
   boundary is prohibited by the governing rule and by F-3 §5's own no-inference limit.
2. **Derivation is prohibited.** The label and owner must not be derived from hostname, Windows
   account, SID, e-mail, machine id, `companyId`, issuer, subject, portfolio id, or any other
   domain's identifier.
3. **The executing agent may not invent them.** An agent-selected value would be an unrelated scope
   expansion under the standing grant's own limits and DEC-06 R-2.

**What this means, operationally.**

- The bounded implementation in §5 may proceed **now**, with the three compiled constants left
  `null`. In that state `--mode=execute` **must refuse** with `IDENTITY_VALUES_UNRESOLVED` before any
  SQL, and a test must assert it (§5.4 item T-4).
- **Provisioning execution remains NOT AUTHORIZED** until a **separate Program Authority
  identity-value determination** names all three values verbatim, states the act under which it is
  rendered, and (if any value is reused from another domain) says so expressly. That determination is
  **not** a routine approval request: it is the one value-selection act the standing grant withholds.
- Creating that determination requires no code change: its values become the three compiled constants
  in a follow-up commits under this act's file set, and execution then follows §8.

**No store, row, path, tenant, principal or owner was selected in this pass.**

## 5. Bounded implementation authority — the single entrypoint and its validation

### 5.1 File set (exhaustive — no other path may change)

| # | Path | Change | Purpose |
|---|---|---|---|
| 1 | `src/persistence/gateAPrimeProvisioning.ts` | **new** | the **only** act-bound provisioning entrypoint; mints the module-private brand internally; compiled constants; argument parsing; refusal states |
| 2 | `src/persistence/gateAPrimeValidation.ts` | **new** | read-only validator implementing V-A2-1…V-A2-8; returns a JSON report; performs no `INSERT`/`UPDATE`/`DELETE`/`BEGIN IMMEDIATE` |
| 3 | `tests/g3_gate_a_prime_successor_provisioning.test.ts` | **new** | T-1…T-9 below |
| 4 | `tests/g3_startup_validation.test.ts` | **modified (bounded)** | extend the existing static import-edge regression to the new module: no `src/ipc/**`, no startup/composition module and no `frontend/**` module may import it |

**Prohibited without a further act:** any change to `package.json` (including `scripts`),
`package-lock.json`, `tsconfig*.json`, `vite.config.ts`, `.github/workflows/**`, any migration, any
existing `src/` module (including `provisioning.ts`, `binding.ts`, `audit.ts`, `connection.ts`,
`portfolio_store.ts`, `dispatch.ts`), any existing test other than item 4, and any IRR path.

### 5.2 Compiled constants (fixed by this act; changed only by a later act)

`GATE_A_PRIME_ACT_ID` = `IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01`;
`BASIS_COMMIT` = `5fc74085ade980846ff4a07b36415b6d49446486`; `BASIS_TREE` =
`7226ef0033b3a7049169d8fcf9bcbc9908e2590b`; `PRINCIPAL_LABEL` = `null` (**§4 unresolved**);
`TENANT_ID` = `null` (**§4**); `CANONICAL_OWNER_ID` = `null` (**§4**); the §2.1 migration blob ids.

### 5.3 Authorization semantics — how the brand stays unforgeable

- `provisionActiveBinding()`'s existing brand gate is **preserved unchanged**. Every existing caller
  still cannot mint the brand; the new module mints it internally **only** after all of the following
  hold, and the checks run **before the database connection is opened**:
  1. `--act-id` equals `GATE_A_PRIME_ACT_ID` exactly;
  2. `--principal-label`, `--tenant-id` and `--canonical-owner-id` are present **and** each equals the
     compiled constant — while any constant is `null`, execution refuses;
  3. the values were supplied on the command line, and **no environment variable** supplies,
     overrides or defaults any of them; `GATE_A_PRIME_*`-shaped environment variables cause an
     outright refusal (the `T-G` "env flag enables a write" pattern is prohibited);
  4. `process.platform === 'win32'` and Node satisfies `>=22.13.0 <23`;
  5. the store path is absolute and the store file **does not exist** (P-1.6).
- The authorization is bound to the act **by construction**: the constants cannot exist without the
  act, and any different value or basis requires a new act and a new commit. There is no token to
  forge and no externally mintable authorization.
- `--mode=validate` runs only the read-only validator and never opens a write path.

### 5.4 Required tests (T-1…T-9, all in file 3)

| # | Test | Required result |
|---|---|---|
| T-1 | execution with a wrong `--act-id` | refuses before any SQL; store absent afterwards |
| T-2 | execution with any identity value absent or differing from the compiled constant | refuses `IDENTITY_VALUES_UNRESOLVED` / `IDENTITY_VALUE_MISMATCH`; zero rows, zero audit entries |
| T-3 | execution with an environment variable supplying any value | refuses; no mutation |
| T-4 | execution while the compiled constants are `null` (the state delivered by this act) | refuses `IDENTITY_VALUES_UNRESOLVED`; creates no store file |
| T-5 | execution on a store that already contains a binding or membership row (any status) | refuses `ALREADY_PROVISIONED`; row counts before = after |
| T-6 | execution on a non-`win32` platform (including this Linux CI) | refuses; no store file |
| T-7 | forged authorization shapes against `provisionActiveBinding` (unchanged) | 4/4 still refused; zero delta |
| T-8 | static import-edge regression: `src/ipc/**`, startup/composition, `frontend/**` | no import edge to the new module; only the entrypoint imports `provisioning.ts` |
| T-9 | `--mode=validate` against a temp store with no rows / with exactly one valid pair | reports V-A2 failures / passes read-only; store bytes unchanged |

`T-4` is the test that keeps this act honest: **the delivered state must be inert.**

## 6. Validation — V-A2-1 … V-A2-8 (read-only, to be used at execution)

Restated against the current schema; no criterion of the 2026-10-17 V-A1…V-A8 shape is removed.

| # | Validation | Pass condition |
|---|---|---|
| V-A2-1 | schema and ledger | `_migration_ledger` holds `001`–`004` with the checksums the selected basis computes; schema version 004; migration `001` blob `f594a182…` unchanged |
| V-A2-2 | binding cardinality | exactly **one** row, `status='ACTIVE'`, `revoked_at IS NULL`, `binding_id` = the deterministic id the entrypoint computes |
| V-A2-3 | membership cardinality | exactly **one** row, `status='ACTIVE'`, attached to V-A2-2's binding, `tenant_id`/`canonical_owner_id` equal the act's named values |
| V-A2-4 | no other rows | `portfolios`, `portfolio_revisions`, `portfolio_holdings`, `portfolio_contributions` all **0** |
| V-A2-5 | audit | exactly **one** hash-chained `audit_events` row, `event_type='local_principal_binding.provisioned'`, `subject_type='local_principal_binding'`, `subject_id` = `principal_label`, detail = the owner pair; chain verifies |
| V-A2-6 | resolution | `resolveActiveBinding()` returns exactly the provisioned context; before provisioning it throws `BindingAbsentError`; a second `ACTIVE` row is impossible at the storage layer and refused by the resolver |
| V-A2-7 | refusal preservation | IPC still returns `WRITE_NOT_AUTHORIZED` before mutation; `evaluatePortSaveGuard()` still hard-false; no write became possible as a side effect |
| V-A2-8 | idempotence/consumption | a second invocation is refused and changes nothing; the act is recorded consumed |

## 7. Fail-closed behaviour, duplicate handling and the no-unintended-mutation rule

1. **Refuse before SQL.** Every authorization, argument, platform, runtime, path and pre-existence
   check precedes `connect` and every statement. A refusal leaves **zero** files and **zero** rows.
2. **One transaction.** On success: exactly one `BEGIN IMMEDIATE`, one binding row, one membership
   row, one audit row, then `COMMIT`. Any error ⇒ `ROLLBACK`, non-zero exit, act consumed.
3. **Duplicate handling.** Any pre-existing binding **or** membership row in **any** state ⇒
   `ALREADY_PROVISIONED`, no mutation, no repair, no "re-activate". `ACTIVE → REVOKED` remains
   one-way; no restoration path is created by this act.
4. **No unintended mutations.** The entrypoint may not create, alter or delete any table, index,
   migration, portfolio, revision, holding, contribution, provenance, credential or mapping row; it
   may not delete a store file it created; and no portfolio-table row count may change.
5. **No retry, no fallback, no repair, no manual adjustment.** A failure is recorded as
   `FAILED / ROLLED BACK` or `NOT EXECUTED — <reason>`.
6. **No fixture substitution.** Demonstrating provisioning against a temporary database is not the
   act; a fixture result may never be reported as a provisioning result.

## 8. Desktop-host provisioning procedure (execution requires §4 resolution first)

**Host (D-A′-2, re-adopted):** `desktop-no0nhtp`, Windows 11 Home Single Language, the **non-elevated**
operator account, `process.platform === 'win32'`. **Runtime:** Node 22.x, `>=22.13.0 <23`, and
`node:sqlite` available **without** an experimental flag. The historical Gate A′ measurement
`v24.14.0` is outside the required major and is **not** acceptable preflight evidence.

**Sequence — stop on any mismatch:**

0. **Preflight capture** (raw stdout+stderr, exit codes, UTC timestamps per command): `hostname`,
   Windows edition, non-elevation proof, `node -v`, `node:sqlite` flag-free probe,
   `git rev-parse HEAD HEAD^{tree}` equal to the act-designated pin, `git status --porcelain` empty,
   sha256 of `src/persistence/gateAPrimeProvisioning.ts`, `provisioning.ts`, `binding.ts`.
1. **P-1 store path**: absolute; outside every Git working tree; local fixed NTFS; not a synchronized
   folder; operator-writable without elevation; **file must not pre-exist** (`Test-Path` = `False`,
   recorded verbatim). Any unmet condition stops the act.
2. **Pre-state inspection (read-only):** run `--mode=validate` first and record that bindings = 0 and
   memberships = 0. A pre-existing `ACTIVE` row means this act does not apply.
3. **Provisioning (single invocation):** `--mode=execute --act-id <ID> --store <absolute path>
   --principal-label <v> --tenant-id <v> --canonical-owner-id <v> --actor <label>`; capture verbatim
   stdout/stderr and the exit code; record the store sha256 and size after commit.
4. **Validation (read-only):** `--mode=validate` with the same arguments; capture the full
   V-A2-1…V-A2-8 report.
5. **Post-state checks:** V-A2-4 table counts, V-A2-7 refusal preservation (IPC still
   `WRITE_NOT_AUTHORIZED`; `evaluatePortSaveGuard()` still hard-false), V-A2-8 second invocation
   refused with zero change.
6. **Evidence publication** under §8.1, then the receipt. **No receipt may be written before the raw
   evidence exists.**

### 8.1 Required evidence (V-A2 receipt)

Verbatim tool stdout/stderr per mode; exact command lines and exit codes; UTC start/end; pre-run proof
the store file did not exist; read-only validation output for V-A2-1…V-A2-8; store sha256 + size;
migration ledger dump with checksums; host identity re-measured; table counts before/after; and the
remote read-back of every published artifact.

### 8.2 Stop conditions

Basis commit/tree or any designated blob differs · host differs, is elevated, or Node is outside
`>=22.13.0 <23` · any P-1 condition unmet or the file exists · a pre-existing binding/membership row ·
identity values absent, ambiguous or requiring invention · any V-A2 failure · any temptation to
repair, re-run or adjust the store. In every case: stop, record, **do not proceed**.

## 9. Single execution, consumption, and what this act never grants

**One execution, one host, one path.** The authority is **consumed on completion whether the act
succeeds or fails**. A failure is recorded `FAILED / ROLLED BACK` or `NOT EXECUTED — <reason>` and any
re-attempt requires a fresh rendering. No standing provisioning capability is created.

**This act grants none of:** a second identity, binding, membership, tenant or user; multi-user,
tenant-directory, login, OIDC, credential, RBAC, role, scope, session or claim work; external-identity
mappings; portfolio/revision/holding/contribution/provenance rows; operational writes; any
`WRITE_NOT_AUTHORIZED` relaxation; `durable:true`; endpoint service admission; Gate C or Gate 4
execution; result acceptance; Gate 5 admission; any IRR change; purge, re-association or restoration of
revoked-binding data; production eligibility; any change to W-1, to the brand gate beyond the single
named entrypoint, or to the existing refusal semantics; and any claim that qualification or
operability has been established.

**Query of record on Gate E §4 ordering.** Gate E §4 runs qualification on the Windows host *after*
Gate A′ provisioning. Until §4 is resolved, that ordering makes Gate 4 QE execution unreachable
regardless of any Gate 4 authority — recorded in the Gate 4 act as a hard prerequisite, not waived.

## 10. Relationship to the other gates (unchanged separations)

| Gate | Relation |
|---|---|
| **U3 / Gate 4** | Provisioning is a **precondition**, not a component. This act makes no QE item pass and does not qualify anything. Gate 4 authority is a **separate** instrument (`IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01`) |
| **U4 result acceptance** | Independent and downstream; requires executed QE evidence on the designated host at a fixed commit. A provisioned binding is not evidence for any criterion |
| **U5 Gate 5 admission** | Independent; requires effective U4 plus its own act |
| **U6 operational writes** | **Unaffected.** W-1's four conditions are unchanged and none is supplied here; `SESSION_ONLY` / `durable:false` remain accurate |
| **IRR** | Read-only in this pass; unchanged |

## 11. Verification performed in this pass

| # | Check | Result |
|---|---|---|
| GA-V1 | IPD live `main` = `5fc74085…` / tree `7226ef00…` (fetched tip); drift from `ddaaef98…` audited as documentation-only, 0 source/test/script/CI/package paths (§2) | **Verified** |
| GA-V2 | Designated blobs (§2.1) resolved from the object database at the selected basis | **Verified** |
| GA-V3 | 2026-10-17 act blob `c04f8a30…`, Gate E policy `4a9501bf…`, Gate 3 lineage (`4744e6f4…`, `85ba78e6…`, `f3a6c9a3…`), Q1 act `de786032…`, F-3 `c4c9f7d7…`, DEC-06 `4be3ea57…` all unchanged | **Verified** |
| GA-V4 | No IPD-owned record names `principal_label`, an IPD `tenantId` or an IPD `canonicalOwnerId`; IRR's pair is IRR-domain and F-3 exercises no value selection | **Verified — values unresolved** |
| GA-V5 | No provisioning entrypoint exists at the basis; `provisionActiveBinding` remains brand-gated; no `src/` importer | **Verified** (prior executed probes, re-confirmed by source identity: `provisioning.ts` unchanged, blob `dc844189…`) |
| GA-V6 | Local suite at the selected basis: 875 executed / 874 passed / 0 failed / 1 skipped; `git diff --check` clean | **Verified** |
| GA-V7 | No implementation, no provisioning, no store, no row, no identity value, no IRR write in this pass | **Verified** |

## 12. Attestation

| Claim | Value |
|---|---|
| PA determination rendered by this record | **YES — this record** |
| Identity values selected or invented | **NO** — recorded unresolved (§4) |
| Provisioning executed / store created / row inserted | **NO / NO / NO** |
| Source, test, runner, CI, manifest or migration change made by this record | **NO** (documentation only) |
| IRR modified | **NO** |
| W-1 / `SESSION_ONLY` / `durable:false` changed | **NO** |
| Gate 4 qualified, result accepted, Gate 5 admitted, writes enabled | **NO** |
| Handwritten signature, approval number or third-party attestation claimed | **NO** — recorded under the standing grant's established form |

## 13. Effectiveness

This instrument is the Program Authority determination. It becomes **EFFECTIVE** on publication of
this exact content to `ramkivs/iips-production-market-data` `refs/heads/main` (merge commit, green
CI, remote read-back of this blob). Its publication receipt — PR, merge commit, tree, CI runs and
read-back — is recorded **separately** in the CAP-02 tracker; this file is not edited after merge.
Effectiveness is a publication condition; it is not a second decision and it provisions nothing.

*End of `IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01`. On publication, the Gate A′
successor basis and the bounded entrypoint authority become EFFECTIVE. Provisioning execution is NOT
AUTHORIZED pending the identity-value determination at §4, whether or not this act is published.*
