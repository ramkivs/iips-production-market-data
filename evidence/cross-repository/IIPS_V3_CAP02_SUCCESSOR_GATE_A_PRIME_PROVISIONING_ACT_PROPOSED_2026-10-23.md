# CAP-02 — Successor Gate A′ binding-provisioning act — **PROPOSED — NOT EFFECTIVE**

> ## STATUS: **PROPOSED — NOT EFFECTIVE — AUTHORIZES NOTHING — NOTHING PROVISIONED**
>
> This record determines, from executed evidence, **exactly what a successor Gate A′ act must contain**,
> why the effective 2026-10-17 Gate A′ basis cannot be executed against the current IPD baseline, and
> **which single Program Authority determination is missing** before any provisioning may occur.
>
> It is **not** a rendered act. It asserts no PA determination, no signature, no approval and no
> effective-act identifier. It created no store, inserted no row, selected no store path and executed no
> provisioning. `Gate A′` remains **`APPROVED (2026-10-17, superseded basis) / NOT EXECUTED`**, and the
> binding state of every IPD baseline inspected here remains **zero bindings, zero memberships**.

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-CAP02-SUCCESSOR-GATE-A-PRIME-PROPOSAL-2026-10-23-01` |
| Record type | Decision-preparation record (proposed successor act, decision-ready). Not an authority act. |
| Prepared | `2026-10-23` (UTC), by Arena Agent Mode under the standing preparation/publication authorization (IRR `IIPS_v3.0_OWNER_CONTEXT_F3_MECHANISM_AND_IMPLEMENTATION_PA_DECISION.md` §1.2, blob `c4c9f7d79ef181af96f6c4e5cc108288ef22fd02`) as construed by IRR `DEC-06` `IIPS-V3-DEC06-AUTHORITY-RECONCILIATION-IRR-2026-10-21-01` R-1/R-2/R-3 |
| Repository | `ramkivs/iips-production-market-data` (IPD) — this record is additive documentation only |
| Verified IPD baseline | `main@2d9130e76bb0dc89daeefabaf297e27bdaa84250`, tree `4658699180ef161aae3c1b33d3946e918d6fb9b2` (verified live at start of this pass; zero tracked working-tree changes) |
| Read-only IRR baseline | `main@409604e4dfefbe6aa966113f52af607995b5f297`, tree `297ce6aebd9a4d93b8e3fc572720aa18a8e682ca` — inspected only; nothing in IRR was modified |
| Governing prior act (superseded basis) | `IIPS-V3-G2-IPD-GATE-A-PRIME-PA-DECISION-2026-10-17-01` — `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PRIME_PA_DECISION_RENDERED_2026-10-17.md`, blob `c04f8a304acaffe49f92a5aac2ce2242673e9a51`, sha256 `6d712edf1d6f7653ae287abfc5ee0451a0941761e2fd154b3215c06098e70ee9` — **`APPROVED`, rule P-1, `NOT EXECUTED`, one execution** |
| Deciding authority required | **Ramki — Program Authority**, IPD security-contract capacity |
| Status | **PROPOSED — NOT EFFECTIVE** |
| Raw evidence | `evidence/cross-repository/cap02_2026-10-23_authority_and_gate_evidence/` (command transcript, two executed probes, probe sources, accepted-baseline runner snapshot) |

---

## 1. Why a successor act is required — executed evidence, not inference

The 2026-10-17 act is internally valid and unspent, but its **own** D-A′-1 pins a basis that no longer
exists as an executable path, and §4.9 makes any identifier difference a hard stop. This pass verified
that rather than assuming it.

### 1.1 The prior basis is intact on the remote, and is not on `main`

`refs/heads/gate-a/local-principal-enablement-2026-10-16` still exists at
`2ded0e981407b38c73bdea164153f53856aa7217`, tree `9069045d3daf22156020188696fc2f9c2f32bf27`, and all four
D-A′-1 blobs are byte-identical to the act:

| D-A′-1 file | Required blob | Found at the basis ref | On IPD `main@2d9130e` |
|---|---|---|---|
| `src/persistence/migrations/003_local_principal_bindings.ts` | `9ba884acc3c554c839a32ca41d0d16bda7e64690` | **match** | `32b125bf…` — **differs** |
| `src/gate_a/provision.ts` | `b6f780f63278d333fd38c66e1abd2f3b64dcc2ea` | **match** | **absent** |
| `src/gate_a/validate.ts` | `550b9f4b83983d5d57aa29f565f371e5bcbed430` | **match** | **absent** |
| `src/app_identity/local_principal.ts` | `710a47e22e5afc99c1744e11926719fc8356f20a` | **match** | **absent** (`src/app_identity/` does not exist) |

The 2026-10-17 act therefore cannot be executed "as written" against `main`: three of its four pinned
paths do not exist there and the fourth differs. Executing it would violate §4.9 and D-A′-8 (one
execution, no substitution). Equally, executing it **on the basis ref** would be permitted by the letter
of the act but is foreclosed by `G3-D0` (`evidence/cross-repository/IIPS_V3_G3_D0_DISPOSITION_2026-10-18.md`),
which designated the off-`main` lineage as **reference-only** and superseded as the intended basis.

### 1.2 The two schemas are mutually incompatible — measured, not asserted

Probe `02_gate_a_prime_basis_schema_compatibility.json` (source preserved alongside it):

| | Gate A′ approved basis (blobs `48fcf4d9` / `dfe9f027` / `9ba884ac`) | Current IPD `main` (blobs `f594a182` / `932af8e6` / `32b125bf` / `6bad5a50`) |
|---|---|---|
| tables | `application_users`, `external_identity_mappings`, `mapping_audit_events`, `tenant_memberships`, `user_portfolios`, `portfolio_revisions`, `portfolio_revision_holdings`, `portfolio_contributions`, `portfolio_events`, `local_principal_bindings`, `local_principal_audit_events` | `_migration_ledger`, `portfolios`, `portfolio_revisions`, `portfolio_holdings`, `portfolio_contributions`, `audit_events`, `local_principal_bindings`, `local_principal_memberships` |
| `local_principal_bindings` columns | `endpoint_id` (PK), `application_user_id` (FK), `tenant_id`, `state`, `created_at`, `updated_at`, `revoked_at` | `binding_id` (PK), `principal_label`, `status`, `created_at`, `updated_at`, `revoked_at` |
| principal table | `application_users` | **none** |
| tenant table | `tenant_memberships` | **none** |
| binding audit | `local_principal_audit_events` (A-3, `seq`-ordered) | `audit_events` (hash-chained, single row per provisioning) |

Three tables the 2026-10-17 act provisions **do not exist on `main`**: `application_users`,
`tenant_memberships`, `local_principal_audit_events`.

The incompatibility is directional and fatal, not cosmetic. Applying `main`'s migration set
(`main`'s startup path, `GATE3_MIGRATIONS`) over a store created from the Gate A′ basis schema **fails
closed**:

```text
main_migrations_applied_over_basis_schema:
  { "ok": false, "name": "Error", "message": "table portfolio_revisions already exists" }
```

So a Gate A′ execution on the approved basis would produce a store that the current IPD startup path
**cannot open** — and Gate E §4 requires qualification to run *after Gate A′ provisioning* against the
implementation under qualification. A store the qualified build cannot open satisfies no QE item.

### 1.3 Further direct conflicts between the 2026-10-17 act and the current implementation

| 2026-10-17 requirement | Current `main` behaviour |
|---|---|
| identifiers are `UUIDv4` from `crypto.randomUUID()`, **"never derived"** (D-A′-4 items 3–5) | `buildBindingProvisionStatements()` **derives** both ids: `sha256('binding:' + principalLabel)[0,32]` and `sha256('membership:' + tenantId + ':' + canonicalOwnerId)[0,32]` — deterministic, not random |
| exactly **2** A-3 audit rows (`MEMBERSHIP_CREATED`, `BINDING_CREATED`) | exactly **1** hash-chained `audit_events` row, `eventType = 'local_principal_binding.provisioned'` |
| CLI tool with `--execute`, `--actor`, `--context`, `--basis-ref`, `--basis-commit`, `--basis-tree` | **no executable entrypoint of any kind** — see §1.4 |
| validation tool V-A1…V-A8 | no validation entrypoint; `inspectBindings()` is read-only and returns raw rows only |

These are not gaps in an otherwise-usable tool. They are different designs, and the difference is
governance-relevant because the 2026-10-17 act's identity semantics were written around
`application_users` + `tenant_memberships`, which `main` does not have.

### 1.4 There is no reachable provisioning path on `main` — executed proof

`src/persistence/provisioning.ts` (blob `dc844189…`) gates its only mutating function on a
**module-private `unique symbol`** brand that no other in-repository module can name. Probe
`01_gate_a_prime_reachability_probe.json` (source preserved):

| Check | Result |
|---|---|
| authorization shapes attemptable from in-repo code (`undefined`, `null`, `{act:'gate-a-prime'}`, brand-less null-prototype object) | **4/4 refused** with `ProvisioningNotAuthorizedError` before any SQL |
| binding rows before → after | `[]` → `[]` |
| membership rows before → after | `[]` → `[]` |
| `audit_events` count before → after | `0` → `0` |
| modules under `src/` importing `provisioning` | **none** |
| pure statement builder without authorization | works (returns text; touches no database) |

The consequence is structural, and it is the second hard dependency:
**no Gate A′ execution on the current IPD baseline is possible without first adding an authorized
provisioning entrypoint to the repository.** That is an implementation change to a file the effective
Gate 3 lineage treats as frozen-adjacent (see §2), not an operational act.

---

## 2. Effective authority examined — what it does and does not permit

| Instrument | Verified coordinates | What it actually establishes here |
|---|---|---|
| Standing PA authorization (2026-10-12), transcribed verbatim | IRR `IIPS_v3.0_OWNER_CONTEXT_F3_MECHANISM_AND_IMPLEMENTATION_PA_DECISION.md` §1.2, blob `c4c9f7d7…` | Project-wide decision **and** execution authority within **established scope**; forbids asking for repeat approval; four limits: no fabricated evidence, no weakened safeguards, no unrelated scope expansion, no unverified success claims |
| `DEC-06` reconciliation | IRR blob `4be3ea578a51a1a949337e5d218b89841c04892d` | R-1 the grant is project-wide; R-2 **"established scope is set by PA product decisions and governing boundaries, not by the agent's convenience"**; R-3 authorization ≠ act ≠ proof — the grant authorises **making** a specific bounded act, and the act must be its own recorded, evidence-bound instrument |
| Gate A′ 2026-10-17 act §5, §4.10 | IPD blob `c04f8a30…` | Grants one provisioning execution; explicitly grants **no** repository change, no second identity, no endpoint, no qualification |
| Gate E write policy rev 1 §5 | IPD blob `4a9501bf…`, sha256 `6385345b…` (**unchanged at `main`**) | "Executing Gate A′, Gate C, or Q5–Q8" is **explicitly not authorized** by that policy |
| Gate 3 act + `G3-AMEND-01` (IRR blobs `4744e6f4…`, `85ba78e6…`, read-only) | — | Implementation manifests are exact; runner/script changes excluded; Gate A′/Gate C execution excluded |
| IPA CAP-02 Gate 3 Amendment 02 (U2) | IPD `IIPS_V3_CAP02_G3_AMEND_02_U2_EFFECTIVE_2026-10-23.md` | Excludes provisioning, W-1 changes, Gate 4/5; "no retroactive authorization of prior changes is created" |
| Gate 4 proposal rev 4 §14.6 | IRR blob `c02093e0…`, **PROPOSED — NOT EFFECTIVE** | Gate 4 requires the Gate A′ prerequisite; **"no new `provisioning.ts` entrypoint or Gate A′ re-baseline is authorized here"**; absent compatible evidence → stop |

**Conclusion on renderability.** `DEC-06` R-2/R-3 permits the agent to *record a bounded act* under the
standing grant, but only inside **established scope**, and the governing boundaries above exclude two of
the three things a viable successor act must do:

1. **Re-baseline Gate A′ onto current `main`** — excluded by `G3-D0` (basis designation) and by the
   Gate 4 proposal's express non-authorization.
2. **Add an authorized provisioning entrypoint** (`src/persistence/provisioning.ts` or an additive
   sanctioned harness) so that an execution is technically possible at all — an implementation change
   to a path no effective act names, in a lineage whose acts exclude provisioning changes.
3. **Perform the operational identity write on the designated host** — excluded by Gate E §5 and by the
   2026-10-17 act's own consumptive, single-basis construction.

Elements 1–2 are the actual blocker; the host is unavailable as well (§6), but availability is not what
makes this unrenderable. A record that purported to satisfy elements 1–2 under the standing grant alone
would be **unrelated scope expansion** under F-3 §1.2's own limits, and would contradict R-2. It is
therefore **not rendered**, and no provisioning was attempted.

### 2.1 The exact missing authority

> **A Program Authority determination that adopts a successor Gate A′ act at a named current IPD
> commit, and, as an inseparable part of the same determination, grants the bounded implementation
> authority for the single provisioning entrypoint that act designates — or adopts the alternative of
> executing on a re-designated basis and accepting the consequences for Gate E §4 compatibility.**

Nothing narrower is sufficient. Granting provisioning authority without the entrypoint produces an act
that cannot be executed. Granting the entrypoint without provisioning authority produces code that must
not be executed. Granting provisioning authority on the old basis produces a store the qualified build
cannot open (§1.2).

---

## 3. The decision-ready content of the successor act (D-A2-1 … D-A2-8)

Each determination below is written so that the PA can adopt it, adopt it with recorded changes, or
decline it. Bracketed tags follow the Gate 4 matrix convention: **[A]** established by a cited record,
**[P]** proposed here for PA determination, **[GAP]** established by no located record.

### D-A2-1 — The intended principal **[P]**

> Exactly **one** principal: the single named human operator of a single-user personal application,
> `NON_PRODUCTION`, H-18 scope, one laptop, no enterprise, no service account, no shared use.
>
> The principal is represented on `main` **only** by `local_principal_bindings.principal_label`, a plain
> text label. `main` has **no** `application_users` table, so there is no application-user row, no
> application-user status, and no FK from the binding to a user. **No successor act may assume an
> application-user object that the qualified schema does not contain**; the 2026-10-17 act's
> `application_users` requirement is not re-adopted by default.
>
> The label value must be **named by the act**. It may not be derived from hostname, Windows account,
> SID, e-mail, machine id, `companyId`, issuer, subject, or any other domain's identifier, and it may
> not be invented by the executing agent. **[A]** for the non-inference rule (F-3 §5 item 3; 2026-10-17
> D-A′-4 "never derived"); **[P]** for applying it to `principal_label`.

### D-A2-2 — Owner/context relationship and identity semantics **[P] + [GAP]**

> The owner context is the pair `(tenant_id, canonical_owner_id)` carried by
> `local_principal_memberships`; it is the same pair the persistence layer accepts as `OwnerRef`
> (`{canonicalOwnerId, tenantId}`) and the pair re-validated inside every write transaction
> (`resolveActiveBindingInCurrentTransaction`). The binding is the local record a same-host IPC request
> resolves against; the membership is the statement that this binding addresses this owner context.
>
> **Both values must be named verbatim by the act.** They may not be inferred at execution and they may
> not be silently copied from IRR's established owner-context values (`owner-7f3a91c2`,
> `irr-domain-4b82d6e1`): F-3 §5 item 3 forbids inferring an owner or tenant identity "from … any other
> domain's identifier", and no effective IPD act establishes that IPD membership ids and IRR owner
> context are the same namespace. Reusing them requires the PA to say so explicitly. **[GAP]** — no
> located record fixes the IPD-side values.
>
> The relationship is **one-to-one and total**: exactly one ACTIVE binding, exactly one ACTIVE
> membership, the membership attached to that binding, and no other row of either kind in any state.
> A binding without a membership, a membership without its binding, or a second row of either kind is a
> defect, not a variant (the resolver already fails closed on each of those four shapes).

### D-A2-3 — Permitted binding and membership state **[A] + [P]**

| Object | Permitted | Enforcement |
|---|---|---|
| `local_principal_bindings` | exactly **1** row, `status='ACTIVE'`, `revoked_at IS NULL`, `created_at = updated_at` at insert | partial unique index `idx_local_principal_bindings_single_active ON ((1)) WHERE status='ACTIVE'` — a second ACTIVE row is impossible at the storage layer |
| `local_principal_memberships` | exactly **1** row, `status='ACTIVE'`, `binding_id` = the provisioned binding, `revoked_at IS NULL` | partial unique index `idx_local_principal_memberships_single_active`; FK to the binding |
| `audit_events` | exactly **1** hash-chained row, `event_type='local_principal_binding.provisioned'`, `subject_type='local_principal_binding'`, `subject_id=principal_label`, `detail_json` = `{tenantId, canonicalOwnerId}` | `appendAuditEvent` computes `prev_checksum`/`entry_checksum` in the same transaction |
| anything else | **nothing** | no `portfolios`, no revision, no holding, no contribution, no provenance row, no credential, no external identity mapping |

`status` transitions are one-way `ACTIVE → REVOKED`; no restoration path exists and none is created.
**[P]**: whether the single hash-chained audit row is accepted as satisfying A-3 semantics for this act
(the 2026-10-17 act required two A-3 rows in the old schema, which no longer exists).

### D-A2-4 — The provisioning interface **[GAP] — this is the second blocker**

Three options exist. Only one can be adopted, and the act must name it.

| Option | What it requires | Assessment |
|---|---|---|
| **A — execute on the 2026-10-17 basis ref** | nothing new in code; uses `src/gate_a/provision.ts` at `2ded0e98` | **Rejected as self-defeating.** Produces the incompatible schema of §1.2; `G3-D0` makes that ref reference-only; Gate E §4 requires a store the qualified build can use |
| **B — add a bounded, act-named provisioning entrypoint on `main`** | one additive script or `--execute` mode over the existing `provisionActiveBinding`, reachable **only** under an explicit authorization value supplied by the act, plus a validation entrypoint, plus tests, plus a paired implementation act | **Only technically coherent option.** Requires the implementation authority identified in §2.1. Must not weaken the existing brand gate, must not be importable from `src/ipc/**` or startup, and must preserve the static unreachability regression except for the named entrypoint |
| **C — externally mint the brand** | the symbol is module-private by construction; no external harness can name it | **Impossible without a source change**, i.e. it reduces to B |

For **B**, the act must fix, exactly: the file set, the invocation surface, the authorization value's
own provenance (who supplies it, how it is bound to the act identifier, and how it cannot be reused),
the validation function, the tests, and the explicit statement that the entrypoint is inert without an
adopted act. Enabling the guard to be flipped by an environment variable is **prohibited** — that is
exactly the mechanism `T-G` exists to prevent.

### D-A2-5 — Required validation and evidence **[A] + [P]**

Adopted from the 2026-10-17 V-A1…V-A8 shape, restated against the current schema (no criterion removed):

| # | Validation | Pass condition |
|---|---|---|
| V-A2-1 | schema and ledger | `_migration_ledger` holds 001–004 with the exact checksums `main` computes; schema version 004; `001` blob `f594a182…` unchanged |
| V-A2-2 | binding cardinality | exactly one row, `ACTIVE`, expected `binding_id` |
| V-A2-3 | membership cardinality | exactly one row, `ACTIVE`, `binding_id` = V-A2-2, tenant/owner = the act's named values |
| V-A2-4 | no other rows | `portfolios`, `portfolio_revisions`, `portfolio_holdings`, `portfolio_contributions` counts all **0** |
| V-A2-5 | audit | exactly one `audit_events` row, the expected `event_type`/`subject`, `verifyAuditChain()` **true** |
| V-A2-6 | resolution | `resolveActiveBinding()` returns exactly the provisioned owner context; before provisioning it throws `BindingAbsentError`; a second ACTIVE row is refused |
| V-A2-7 | refusal preservation | IPC still returns `WRITE_NOT_AUTHORIZED` before mutation; `evaluatePortSaveGuard()` still hard-false; no write became possible as a side effect |
| V-A2-8 | idempotence/consumption | a second invocation is refused and changes nothing; the act is recorded consumed |

Evidence, to be published as raw output with the act receipt: verbatim tool stdout; exact command line
and exit code; pre-run proof the store file did not exist; read-only validation output for V-A2-1…8;
store file sha256 + size; migration ledger dump with checksums; host identity re-measured; UTC
timestamps. **No receipt may be written before these exist.**

### D-A2-6 — Target-host prerequisites **[A]**

> Host: the designated Windows deployment host — machine `desktop-no0nhtp`, Windows 11 Home Single
> Language, the **non-elevated** operator account, `process.platform === 'win32'`.
> Runtime: **Node 22.x, `>=22.13.0 <23`** (Gate 3 act §8.1/§8.3 conjunctive rule), `node:sqlite`
> available **without** an experimental flag. The historical Gate A′ measurement `v24.14.0` is outside
> the required major and is **not** acceptable preflight evidence for a Gate 4 run. No runtime
> installation or switch is authorized by this proposal.
> Store path: selected by the operator under **rule P-1**, re-adopted verbatim (absolute; outside every
> Git working tree; local fixed NTFS; not a synchronized folder; operator-writable without elevation;
> **file must not pre-exist**; any unmet condition stops the act).
> Endpoint: `IIPS_G2_IPC_ENDPOINT` (an absolute `\\.\pipe\…` name) or a bare name with
> `IIPS_G3_LOCAL_STATE_DIR` absolute — per `src/ipc/endpoint.ts`. Named by the act or by the operator
> under a stated rule; recorded verbatim before execution.

### D-A2-7 — Explicit scope exclusions **[A]**

The act grants **none** of: a second identity, binding, membership, tenant or user of any kind;
multi-user, tenant-directory, login, OIDC, credential, RBAC, role, scope, session or claim work;
`external_identity_mappings` or any external-identity claim; portfolio/revision/holding/contribution
rows; operational writes; `durable:true`; any `WRITE_NOT_AUTHORIZED` relaxation; any endpoint service
admission; qualification, result acceptance or admission; Gate C; any IRR change; purge, re-association
or restoration of revoked-binding data; production eligibility; any change to W-1, to the brand gate
beyond the single named entrypoint, or to the existing refusal semantics.

### D-A2-8 — Relationship to Gate 4 / U4 / U5 / U6 **[A]**

| Gate | Relation to this act |
|---|---|
| **U3 / Gate 4 qualification** | Gate A′ provisioning is a **precondition**, not a component. The Gate A′ receipt makes no QE item pass; Gate 4 additionally needs its own **effective** act (currently `PROPOSED — NOT EFFECTIVE`), a passing native-Windows canonical test run, and PA adoption of the H-12 basis |
| **U4 result acceptance** | Independent and downstream. Requires the executed QE matrix on the designated host at a fixed commit; a provisioned binding is not evidence for any QE criterion |
| **U5 Gate 5 admission** | Independent. Requires effective U4 plus its own act. Provisioning confers nothing |
| **U6 / Gate E W-1 operational writes** | **Strictly separate and unaffected.** W-1 requires four conditions; this act supplies none of them. Provisioning a binding does **not** lift `WRITE_NOT_AUTHORIZED`, does not make `evaluatePortSaveGuard()` true, and does not create a durable write. `SESSION_ONLY` / `durable:false` remain accurate |

---

## 4. Exact missing act (for the tracker and the PA)

```text
MISSING:   a Program Authority determination adopting a successor Gate A′ act
           (i)  naming the current IPD commit/tree as the basis, and
           (ii) granting the bounded implementation authority for the single
                provisioning entrypoint that act designates (D-A2-4 option B),
           with D-A2-1/D-A2-2 identity values named verbatim.
OWNER:     Ramki — Program Authority.
EVIDENCE TO CLOSE: the rendered act, published and remotely verified; then the
           host execution receipt with V-A2-1…V-A2-8.
BLOCKED UNTIL THEN: U3/Gate 4 execution (Gate E §4 ordering), U4, U5, U6.
NOT BLOCKED:        tracker reconciliation, regression evidence, decision preparation
                    (this record).
```

## 5. Stop conditions (carried forward and extended)

Any of the following stops execution; none may be worked around mid-act:

1. Basis commit/tree or any designated blob differs at execution.
2. Host is not `desktop-no0nhtp` as specified, or is elevated, or Node is outside `>=22.13.0 <23`.
3. Any P-1 condition unmet, or the store file already exists.
4. The store is not empty of bindings **before** execution (inspect first; a pre-existing ACTIVE row
   means the act does not apply).
5. The named identity values are absent from the act, ambiguous, or would have to be invented.
6. Any V-A2 validation fails → record `FAILED / ROLLED BACK` (or `NOT EXECUTED — <reason>`); **no
   repair, no re-run, no manual adjustment**; the authority is consumed.
7. Any temptation to demonstrate provisioning against a temporary local database and call it the act —
   **prohibited**; a fixture result is not a provisioning result.

## 6. Host availability recorded in this pass

This pass had no access to the designated host, and neither had a substitute: the sandbox platform is
`linux` (`Linux 6.1.158+ x86_64`), `process.platform === 'linux'`, and `desktop-no0nhtp` does not
resolve (`ping: desktop-no0nhtp: Name or service not known`). No store path, endpoint or operator
store was available. **Nothing was provisioned, and no local temporary database was substituted.**
Node here is `v22.22.3`, which satisfies the runtime floor — and is irrelevant, because the host
requirement is a conjunction with `win32`.

## 7. Attestation

| Claim | Value |
|---|---|
| PA determination rendered by this record | **NO** |
| Provisioning executed | **NO** |
| Store created | **NO** |
| Row inserted | **NO** |
| Store path selected | **NO** |
| Identity or binding invented | **NO** |
| `src/` or `tests/` change | **NO** |
| IRR modified | **NO** — read-only clone under `/tmp`, never pushed |
| W-1 / `SESSION_ONLY` / `durable:false` changed | **NO** |
| Claim resting on a blanket authority | **NO** — see §2 |

*End of `IIPS-V3-CAP02-SUCCESSOR-GATE-A-PRIME-PROPOSAL-2026-10-23-01` — **PROPOSED, NOT EFFECTIVE**, nothing provisioned, non-production.*
