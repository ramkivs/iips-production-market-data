# CAP-02 — S1 Identity-Value Determination — **RENDERED — EFFECTIVE ON PUBLICATION**

> ## STATUS: **RENDERED BY THE PROGRAM AUTHORITY · EFFECTIVE ON PUBLICATION (§13) · NAMES ALL THREE VALUES VERBATIM · AUTHORIZES THE BINDING COMMIT ONLY · PROVISIONING EXECUTION REMAINS BLOCKED BY THE DESIGNATED-HOST PREREQUISITE**
>
> **Until this content is merged to `ramkivs/iips-production-market-data` `refs/heads/main` with green
> CI and remote read-back, this instrument is `RENDERED — NOT EFFECTIVE` and grants nothing.**
>
> This is the **separate Program Authority identity-value determination** reserved by §4 of the
> effective Gate A′ successor provisioning act
> `IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01`. That act's §4 states:
> *"Provisioning execution remains NOT AUTHORIZED until a **separate Program Authority identity-value
> determination** names all three values verbatim, states the act under which it is rendered"* and
> *"Creating that determination requires no code change: its values become the three compiled
> constants in a follow-up commits under this act's file set."* This record **is** that determination;
> the binding commit in the same publication is that follow-up commit.
>
> **What this determination does:** records the PA's verbatim selection of the three S1 identity
> values for the intended personal, local, single-user IPD application; states their provenance
> honestly (PA designation, not a pre-existing record and not an identity provider); validates them
> against the actual schema, identity contract, uniqueness constraints and validation rules; fixes the
> exact authorized implementation scope; restates T-1…T-9 and their acceptance criteria; and defines
> what it does not authorize.
>
> **What it does not do:** it provisions nothing, creates no store, row, binding, membership or audit
> event, contacts no host, executes no QE item, adopts no H-12 manifest, accepts no result, admits no
> gate, enables no durable or operational write, changes no W-1 predicate, and touches no IRR file.

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01` (census: the string returned **`0`** hits in this repository at the pre-publication baseline — §12.6; the only occurrences now are this record and the provenance comments it authorizes) |
| **Record type** | **Rendered Program Authority decision** — S1 identity-value determination. Not a proposal, not a decision request, not an execution receipt. |
| **Rendered / decision date** | `2026-10-24` (UTC) — actual date, not backdated |
| **Deciding authority** | **Ramki — Program Authority**, acting in the IPD security-contract capacity that rendered `IIPS-V3-G2-IPD-GATE-A-PRIME-PA-DECISION-2026-10-17-01` and the successor act |
| **Authority exercised** | The PA's explicit S1 value selection of `2026-10-24`, recorded here verbatim; discharging the reservation in the effective successor act §4. The standing preparation/publication grant (F-3 §1.2, as construed by DEC-06 rules R-1/R-2/R-3/R-9) is **not** the source of value-selection authority — it expressly is not a value-selection act |
| **Governing instrument discharged** | `IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01` §4 (identity values) — `evidence/cross-repository/IIPS_V3_CAP02_GATE_A_PRIME_SUCCESSOR_PROVISIONING_ACT_EFFECTIVE_2026-10-23.md`, blob `528de6aeddbc8e5f3191be8792f3937d77de4037`, preserved unmodified |
| **Predecessor artifact** | `IIPS-V3-CAP02-S1-IDENTITY-AUTHORITY-H12-READINESS-DECISION-REQUEST-2026-10-24-01` — `evidence/cross-repository/IIPS_V3_CAP02_S1_IDENTITY_VALUE_AUTHORITY_H12_READINESS_DECISION_REQUEST_2026-10-24.md`, blob `b11cc457805a7947bd2d90c9d8185b225c5722ff` at the pre-publication baseline. It is **preserved byte-identically** as the decision-ready request this determination answers; its "UNRESOLVED — AUTHORITY REQUIRED" findings were correct **as of its own pass** and are not rewritten (§11.4). |
| **Repository / locus** | `ramkivs/iips-production-market-data` (IPD). IRR (`ramkivs/iips-review-recovered`) was **not** contacted or written in this pass: no IRR file, branch, ref, PR, issue, comment or tracker was created or modified. |
| **Pre-publication baseline (verified this pass)** | `refs/heads/main` = **`6d8f161118a26ddb1486b3c5f1365f391cfaed8c`**, root tree **`6c8cb2afff91a2cb92b52e69ad528f3377e557e3`** (`git fetch --unshallow` + `git rev-parse origin/main` and `origin/main^{tree}`; clean tracked worktree; PR #79 merge) |
| **Identity values determined** | `principal_label` = **`ramki-personal-local`** · `tenantId` = **`ipd-personal-local`** · `canonicalOwnerId` = **`ipd-owner-ramki-personal`** |
| **Provisioning execution** | **NOT EXECUTED.** The value-selection blocker is discharged; execution remains gated by successor act §8 (designated Windows host, Node `>=22.13.0 <23`, non-existent P-1 store). No store, row, binding, membership or audit event exists. |
| **Status** | **RENDERED — EFFECTIVE** on completion of §13 (merge to IPD `main`, green CI, remote read-back). Effectiveness is a publication condition, not a second decision. |
| **Publication receipt** | Recorded in `evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md` **after** merge. This instrument's substantive text is not edited after merge. |

---

## 1. The determination, in six sentences

1. For the **personal, local, single-user IPD application** governed by this programme, the Program
   Authority determines the single local principal's three identity values to be exactly
   `principal_label` = `ramki-personal-local`, `tenantId` = `ipd-personal-local`,
   `canonicalOwnerId` = `ipd-owner-ramki-personal`.
2. These are **PA-designated IPD-owned strings**, selected for this one local environment; they were
   **not** previously present in any authoritative record, were **not** issued by any identity
   provider, and are **not** derived from any host, account, credential or other domain.
3. They **discharge §4 of the effective successor act**, and that act's §4/§5.2 machinery makes them
   the three compiled constants in the existing entrypoint file set — no new authority and no schema
   change is required or created.
4. The **implementation scope is exactly the successor act's four-path file set** (§7 below); no other
   path may change, and no new file outside it is authorized.
5. `T-1`…`T-9` are restated with acceptance criteria and executed results (§8); the null-constant
   refusal path is deliberately **retained** so a partially-bound or unbound build still fails closed.
6. **Everything else is unchanged**: Gate A′ execution still requires the designated Windows host and
   its unmet prerequisites, H-12 remains NOT ADOPTED (and R2 is now measurably staler, §9), Gate 4
   remains AUTHORIZED — NOT STARTED at 0/11, U4/U5/U6 are untouched, W-1 stays hard-false,
   `SESSION_ONLY` / `durable:false` stay unchanged, and IRR stays read-only.

---

## 2. Authoritative baseline verified before any mutation

| Item | Measured value | Method |
|---|---|---|
| Remote `main` commit | `6d8f161118a26ddb1486b3c5f1365f391cfaed8c` | `git fetch --prune`; `git rev-parse origin/main` |
| Root tree | `6c8cb2afff91a2cb92b52e69ad528f3377e557e3` | `git rev-parse origin/main^{tree}` |
| Working tree | clean, `0` tracked changes | `git status --porcelain` empty |
| History completeness | `287` commits after `git fetch --unshallow` (the initial clone was shallow) | `git rev-list --count HEAD`; ancestry checks below require full history |
| Tip lineage | PR #79 merge `6d8f161…` over PR #78 merge `4b84dc8…`; PR #78 head `d3a0fcf…` (the S1 decision request) | `git log --first-parent` |
| Drift since the S1 request's own baseline `5e4e54d…` | `4` commits, `2` changed paths, **both under `evidence/`**, **`0`** source/test/script/CI/package paths | `git log 5e4e54d…HEAD`; `git diff --name-only` |
| Successor act §2.1 designated blobs (12) | **`12/12`** identical at this baseline | `git rev-parse HEAD:<path>` — enumerated §12.2 |

**Why the baseline is stated rather than assumed.** The predecessor record cites
`main@5e4e54d…`; the tip has since advanced by the merge of that record itself plus its tracker
receipt. Both are documentation-only, so no implementation fact changed, but the coordinates are
recorded as measured so that the binding commit's parent is unambiguous.

---

## 3. The determined values — verbatim, with provenance

| Field | Determined value | Bytes | SHA-256 of the value | Deterministic identity derived from it |
|---|---|---|---|---|
| `principal_label` | **`ramki-personal-local`** | 20 | `2df04453ca2845fcbaea0e496bbc2da4c056a2f40e9b83b72c10c88190858324` | `binding_id` = **`c5808abaffd072d6401ce63ad86c6ac0`** |
| `tenantId` | **`ipd-personal-local`** | 18 | `ae82ba19825eaae52f3732e6b6b1302c672f6548b830b883f377822d1876a730` | (with the owner) `membership_id` = **`d25dcc5370100b00766efc5166f65cf3`** |
| `canonicalOwnerId` | **`ipd-owner-ramki-personal`** | 24 | `3084b2ed3e43a85b668368268ff798da6633ce5e629f3948654ebb1c429e47c8` | (with the tenant) as above |

Derivation, unchanged from the shipped implementation and re-verified by execution this pass:

```text
binding_id     = sha256('binding:'     + principal_label).slice(0, 32)                        = c5808abaffd072d6401ce63ad86c6ac0
membership_id  = sha256('membership:'  + tenantId + ':' + canonicalOwnerId).slice(0, 32)       = d25dcc5370100b00766efc5166f65cf3
```

**Provenance — stated exactly.**

1. **PA designation.** The three values are selected by the Program Authority for this personal,
   local, single-user IPD application. Their authority derives from that selection, recorded here.
2. **They were not previously in an authoritative record.** A `git grep` across the entire IPD tree at
   the pre-publication baseline for each of the three strings returned **`0` occurrences**
   (§12.6). Nothing is being "found", "recovered" or "restored".
3. **They were not issued by an external identity provider.** No OIDC issuer, subject, claim, SID,
   Windows account, machine id or e-mail is involved; no such source is consulted by any code path.
4. **They are not derived.** Successor act §4.2 prohibits derivation from hostname, Windows account,
   SID, e-mail, machine id, `companyId`, issuer, subject or portfolio id. These strings are chosen
   labels, and the `ipd-`/`-personal-local` morphology is a deliberate domain and environment marker,
   not a computed value.
5. **The intended scope is one principal on one local environment.** The values deliberately say
   "personal", "local" and "single": they describe a non-production, single-user application. They
   carry no multi-user, tenant-directory, role, scope or claim semantics and must never be read as
   such.

---

## 4. Compatibility validation against the actual schema, contract and validation rules

Measured against `src/persistence/migrations/003_local_principal_bindings.ts` (blob
`32b125bf962bb76a6ae59d3b262203dbbb988197`, unchanged by this determination), `binding.ts` (blob
`96d0079d…`), `provisioning.ts` (blob `dc844189…`) and the act-bound entrypoint.

| Requirement | Measured constraint | Result for the three determined values |
|---|---|---|
| `principal_label` type/nullability | `TEXT NOT NULL`, no `CHECK`, no length cap, no format rule in the schema | **COMPATIBLE** — 20 ASCII bytes, non-empty, no whitespace |
| `tenant_id` type/nullability | `TEXT NOT NULL`, no enum, no directory, no foreign key | **COMPATIBLE** — 18 ASCII bytes, non-empty |
| `canonical_owner_id` type/nullability | `TEXT NOT NULL`, no enum, no foreign key | **COMPATIBLE** — 24 ASCII bytes, non-empty |
| Normalization | No collation, case-folding or trimming anywhere in schema or code; the entrypoint compares with strict `!==` and rejects whitespace-only values via `nonEmpty` | **COMPATIBLE** — all three are already trim-stable, lower-case, no leading/trailing whitespace; no normalization can alter them |
| Uniqueness / cardinality | `binding_id` and `membership_id` are `PRIMARY KEY`; `idx_local_principal_bindings_single_active` and `idx_local_principal_memberships_single_active` are partial-unique on `((1)) WHERE status='ACTIVE'` — at most one ACTIVE binding and one ACTIVE membership ever | **COMPATIBLE** — one principal, one membership, exactly as intended |
| Collision with existing rows | No store exists anywhere in the tree (`find` for `*.sqlite`/`*.db`: **0** files); no binding/membership row exists | **NO COLLISION** |
| Derived identifier collision | `binding_id` `c5808abaffd072d6401ce63ad86c6ac0` and `membership_id` `d25dcc5370100b00766efc5166f65cf3` are 32-hex; neither appears anywhere in the repository | **NO COLLISION** |
| Cross-field consistency | `membership.binding_id REFERENCES local_principal_bindings(binding_id)`; the resolver requires the single ACTIVE membership to be attached to the single ACTIVE binding | **CONSISTENT** — the entrypoint writes the derived pair in one transaction |
| Audit-subject compatibility | audit `subject_id` = `principal_label`; audit `detail = { tenantId, canonicalOwnerId }` | **COMPATIBLE** — strings serialize into the existing hash-chained event shape |
| Entrypoint equality check | strict equality to the compiled constants, CLI-only; any `GATE_A_PRIME_*` environment key refuses outright | **COMPATIBLE** — values are supplied on the command line verbatim |
| Validator expectations | `expectedValue(supplied, compiled)` compares binding label and owner pair | **CONSISTENT** — validator now has a non-null expectation, so V-A2-2/V-A2-3/V-A2-5 become genuinely evaluable |

**No conflict was found between the PA-approved values and any effective governing act, schema
constraint, identity contract, uniqueness constraint or validation rule.** Tenant administration
being "NOT AUTHORIZED / D115-deferred" (G24 governance) is not a conflict: the successor act §4 is
the express carve-out whose vehicle names this single local tenant, and no tenant *administration*
(directory, lifecycle, additional tenants) is performed or authorized here.

---

## 5. Domain separation and the preserved no-copy prohibition

The determination is only valid because none of the rejected candidate classes is reused. Each
remains excluded, with the governing refusal preserved:

| Rejected source | Value(s) | Why still excluded |
|---|---|---|
| IRR F-3 owner-context carrier | `owner-7f3a91c2`, `irr-domain-4b82d6e1` | IRR-domain partition carrier for NP-09/10/11; F-3 records **"Value-selection authority: NOT EXERCISED"**; no F-3 §5.7 / OC-7 namespace equivalence exists; no D-2 §8 translation rule is created here. **Not copied, not referenced, not equivalent.** |
| Offline provenance marker | `IIPS_OFFLINE_BOOTSTRAP` | A D01/D02 market-data envelope provenance tag in the `./d114-non-production` surface, not an ownership identity. **Not copied.** |
| Spent 2026-10-16 Gate A execution | `applicationUserId 4f423263…`, `tenantId t-1c568b7e…`, `endpointId ep-4851658e…` | Generated by `randomUUID()` under an act whose execution basis was superseded; the tables do not exist on `main`; two of the three concepts do not exist in the current schema. **Not copied, not revived.** |
| Test fixtures | `fixture-*`, `ipd-*-not-selected`, `owner-local`, … | Explicitly non-authoritative. **Not copied.** |

**Domain separation properties of the determined values.** They are IPD-owned by construction and by
morphology: `ipd-` prefixes mark the owning IPD domain, `-personal-local` marks the environment
(a personal, local, single-user application), and `ipd-owner-ramki-personal` is an owner identifier
inside that domain. They therefore cannot be confused with, mapped to, or used to infer any IRR
identifier, any corporate/enterprise identity, or any offline data-provenance tag. **No
IRR↔IPD equivalence is created, implied or authorized by this record.**

---

## 6. What kind of act this is — and what it is not

| Question | Answer |
|---|---|
| Is this a PA determination? | **YES** — a rendered Program Authority decision, in the IPD security-contract capacity, selecting the three values. |
| Were the values previously present in an authoritative record? | **NO.** Pre-publication census: `0` hits for each string. This record is their first authoritative statement. |
| Were they issued by an external identity provider? | **NO.** No IdP, directory, credential or account lookup is involved, and this act creates no external-identity mapping. |
| Are they proposed or effective? | **RENDERED — EFFECTIVE ON PUBLICATION (§13).** They are not presented as effective before the merge. |
| Is this a blanket operational authorization? | **NO.** §10 lists the non-grants exhaustively; provisioning execution remains blocked by the host prerequisite. |
| Does it amend the successor act? | **NO.** The act is preserved unmodified. This determination supplies the values whose absence §4 recorded; §5.2 anticipates exactly this follow-up. |
| Does it resolve H-12 adoption? | **NO.** It moves one prerequisite of H-12 forward (§9) and adopts nothing. |

---

## 7. Authorized implementation scope — the binding commit

**Exhaustive file set** (identical to successor act §5.1; no other path may change):

| # | Path | Change made | Scope check |
|---|---|---|---|
| 1 | `src/persistence/gateAPrimeProvisioning.ts` | the pure identity gate is extracted as `assertIdentityValuesResolved(supplied, compiled)` and called by `authorizeExecution` with the module constants; behaviour, check order and refusal codes are unchanged | within §5.1 item 1 |
| 2 | `src/persistence/gateAPrimeValidation.ts` | `PRINCIPAL_LABEL`, `TENANT_ID`, `CANONICAL_OWNER_ID` set from `null` to the three determined values, with provenance comment; the `string \| null` type retained so the null guard stays meaningful | within §5.1 item 2 |
| 3 | `tests/g3_gate_a_prime_successor_provisioning.test.ts` | T-2 split into absent/mismatch cases; T-4 re-expressed (§8); T-6, T-7, T-8 added; `args()` default now carries the determined triple | within §5.1 item 3 |
| 4 | `tests/g3_startup_validation.test.ts` | **unchanged** — its existing static import-edge regression already covers both provisioning modules and continues to pass | within §5.1 item 4 |

**Why the entrypoint changed at all.** `T-4` requires that an unbound build still refuse. Once the
shipped constants are non-null, a purely behavioural test of the null guard is impossible unless the
guard is a callable unit. Extracting it preserves the exact production behaviour (same order, same
codes) and creates **no injectable bypass**: `authorizeExecution` is the only production caller and
always passes this module's compiled constants. The module-private brand, the pre-connection ordering
and the refusal semantics are untouched.

**Explicitly not changed:** `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`,
`.github/workflows/**`, any migration, `provisioning.ts`, `binding.ts`, `audit.ts`, `connection.ts`,
`portfolio_store.ts`, `dispatch.ts`, any other test, and any IRR path. `BASIS_COMMIT`
(`5fc74085…`) and `BASIS_TREE` (`7226ef00…`) also remain exactly as the successor act fixed them —
they identify the act's selected basis and are not a pointer to the current tip; changing them would
require a new act.

**Final execution commit.** Per predecessor §6 item 4, the binding commit moves the post-G3 surface
entries S-5/S-6 (and their compiled `dist/**` outputs), so it also moves the future final execution
commit. No commit is declared here to be that final execution commit; it is fixed only when the
provisioning/QE sequence actually runs (§9).

---

## 8. T-1 … T-9 — restated criteria and executed results

Executed on Linux `x86_64`, Node `v22.22.3`, against the built `dist/` of this branch. These are
repository-level implementation tests; they are **not** host qualification, QE, or provisioning.

| # | Criterion (successor act §5.4) | Test | Result |
|---|---|---|---|
| T-1 | wrong `--act-id` ⇒ refuse before any SQL; store absent afterwards | `T-1 refuses a wrong act id…` → `ACT_ID_MISMATCH`; `existsSync(store) === false` | **PASS** |
| T-2 | any identity value absent or differing ⇒ `IDENTITY_VALUES_UNRESOLVED` / `IDENTITY_VALUE_MISMATCH`; zero rows, zero audit | two tests: three absent-field shapes + whitespace-only ⇒ `UNRESOLVED`; three differing-field shapes ⇒ `MISMATCH`; store never created | **PASS** |
| T-3 | an environment variable supplying any value ⇒ refuse; no mutation | `GATE_A_PRIME_TENANT_ID` set ⇒ `ENVIRONMENT_VALUES_NOT_AUTHORIZED`; store absent | **PASS** |
| T-4 | the unbound-constants state ⇒ `IDENTITY_VALUES_UNRESOLVED`; creates no store file | **re-expressed (see below)**: (a) shipped constants are exactly the determined triple and all-string, never partially bound; (b) `assertIdentityValuesResolved` refuses both an all-null and a partially-null compiled triple with `IDENTITY_VALUES_UNRESOLVED`; (c) it accepts and returns exactly the bound triple; (d) no store file is created by a refusal | **PASS** |
| T-5 | execution on a store that already holds a binding or membership row (any status) ⇒ `ALREADY_PROVISIONED`; counts before = after | `T-5 classifies an existing provisioned store without changing its bytes` — read-only classification, SHA-256 unchanged; the `ALREADY_PROVISIONED` refusal path is retained in `authorizeExecution` and `executeWithAuthorization` | **PASS** |
| T-6 | non-`win32` platform ⇒ refuse; no store file | `linux` and `darwin` with the correct values ⇒ `PLATFORM_UNSUPPORTED`, store absent; `win32` + Node `24.14.0` ⇒ `RUNTIME_UNSUPPORTED`, store absent | **PASS** |
| T-7 | forged authorization shapes against `provisionActiveBinding` ⇒ 4/4 refused, zero delta | `undefined`, `{}`, structural `{act:'gate-a-prime'}`, and a foreign-symbol forgery ⇒ all four `ProvisioningNotAuthorizedError`; bindings/memberships/audit all `0` before and after | **PASS** |
| T-8 | static import-edge regression over `src/ipc/**`, startup/composition, `frontend/**` | guarded paths contain no import of either provisioning module; a full scan of `src/**` and `frontend/src/**` yields **0** importers of `provisioning.js` or `gateAPrimeProvisioning.js` | **PASS** |
| T-9 | `--mode=validate` on a temp store with no rows ⇒ V-A2 failures; with exactly one valid pair ⇒ passes read-only; bytes unchanged | empty store ⇒ `status: FAIL`, bindings/memberships `0`, file bytes identical; valid fixture pair ⇒ `status: PASS`, all checks ok, bytes identical | **PASS** |
| — | CLI strictness: no implicit identity or environment defaults | unknown argument, missing `--act-id` and omitted identity args all refuse | **PASS** |

**Focused suite result:** `node --test dist/tests/g3_gate_a_prime_successor_provisioning.test.js` →
**12 tests, 12 pass, 0 fail** (previously 7). The `dist/` build is current (guard script verifies
staleness).

**T-4 re-expression — justification, stated openly.** Successor act §5.4 describes T-4's subject as
*"the state delivered by this act"*, i.e. null constants. §4 of the same act expressly contemplates
the successor state: the determination's *"values become the three compiled constants in a follow-up
commits under this act's file set"*. T-4's purpose — *"the delivered state must be inert"* — is
therefore preserved in the only honest form available after binding: the null/partial-constant refusal
must still exist, still execute, and still precede any connection; and the shipped constants must be
exactly the determined triple, never partially bound. Both are asserted by execution above. Nothing
was deleted to make the suite green: the previously-asserted `null` constants were replaced by
assertions of the determined triple **plus** a direct execution of the surviving null guard. The
earlier statement of T-4 against the pre-binding state is preserved in the predecessor record and in
the published pre-binding commit history.

---

## 9. Effect on H-12, Gate 4 and the downstream gates — measured, not inferred

| Item | State after this determination |
|---|---|
| **H-12 manifest** | **STILL `NOT ADOPTED`.** This act adopts nothing and authorizes no manifest promotion. |
| **R2 candidate (`9382d4b0…`) — newly measured staleness** | The binding commit changes `post_g3_cap02_qualified_surface_entries[4..6]` (`gateAPrimeProvisioning.ts`, `gateAPrimeValidation.ts`, `tests/g3_gate_a_prime_successor_provisioning.test.ts` — all three recorded at Limb A and verified `7/7` at the pre-publication baseline) and **`10` of the `1,140` `runtime_dist_set` files** (8 compiled module artifacts + the compiled test `.js` and its `.map`). Measured: `1,130/1,140` dist files still byte-identical, `0` missing, `10` changed. **R2 is therefore confirmed — by measurement, not by assertion — to be unadoptable as-is**, exactly as the predecessor record predicted. A regenerated manifest must be produced at the final execution commit (successor act §8 / Gate 4 act §8, amended to 32 + 1 + 24 = 56 core entries) and separately adopted. |
| **Gate 4 / U3** | **`AUTHORIZED — NOT STARTED`, `0/11`.** Gate E §4 orders qualification *after* Gate A′ provisioning; the host remains unreachable and no Node `>=22.13.0 <23` preflight is evidenced. No QE item was started. |
| **Gate A′ provisioning execution** | Value blocker **DISCHARGED**; execution **NOT EXECUTED** and still gated by successor act §8: `win32` only (enforced and empirically verified — a Linux run refuses `PLATFORM_UNSUPPORTED` before any connection), Node `>=22.13.0 <23`, non-existent absolute P-1 store outside every Git worktree, one execution. |
| **U4 / Gate C / Gate 5 / U6** | Unchanged: not rendered / not accepted / not granted / not authorized. `WRITE_NOT_AUTHORIZED` and `W-1(3)`/`W-1(4)` hard-false; `SESSION_ONLY` and `durable:false` unchanged. |
| **CAP-03 DR-2 / DR-3 / DR-4r** | Unchanged — **UNRESOLVED — PA decisions required**. This act supplies no CAP-03 authority. |
| **IRR** | Read-only; **0** mutations. |

---

## 10. What this determination does not authorize

This act grants **none** of the following, and a passing test or a successful commit does not supply
any of them:

- any provisioning execution (P-1), any store, binding, membership, tenant, principal or audit row;
- any second identity, second principal, multi-user, tenant-directory, RBAC, role, scope, session,
  claim, login, OIDC or credential work; any external-identity mapping; any cross-domain equivalence;
- any change to the schema or to any migration; any change outside the four-path file set of §7;
- any change to `BASIS_COMMIT`/`BASIS_TREE`/`GATE_A_PRIME_ACT_ID`, to the module-private brand, to the
  pre-connection check ordering, or to any refusal code;
- any operational or durable write; any change to W-1; any lift of `WRITE_NOT_AUTHORIZED`; any
  `durable:true`; any relaxation of `SESSION_ONLY`;
- any H-12 adoption or manifest promotion (including the pre-amendment `R2` candidate), any Gate 4
  qualification or QE execution, any result acceptance (U4), Gate 5 admission (U5), Gate C
  acceptance, or operational write authorization (U6);
- any host contact, preflight or native-Windows evidence claim;
- any IRR mutation, repin or comment;
- any resolution of CAP-03 DR-2, DR-3 or DR-4r;
- any production eligibility, purge, re-association, restoration or repair of binding data;
- any change to the Gate A′ successor act, the Gate 4 act or any other effective instrument.

---

## 11. Consistency reconciliation of the governing corpus (additive, nothing rewritten)

1. **Successor act §4 table** ("`principal_label` … UNRESOLVED"): that text records the state of the
   act's own pass and its own reservation. It is **not edited**; §4 itself defines the mechanism by
   which a later determination populates the constants. No conflict arises — the act's own §4 sentence
   *"Provisioning execution remains NOT AUTHORIZED until a separate Program Authority identity-value
   determination names all three values verbatim"* is precisely what is now satisfied.
2. **Gate A′ act §5.2** ("changed only by a later act"): this determination **is** that later act, and
   §4 last paragraph of the same act expressly authorizes the follow-up commit under the same file set.
   The constants are the only field changed; the act id, basis commit/tree and migration blob ids are
   untouched.
3. **Predecessor S1 decision request**: preserved byte-identically, including its
   `UNRESOLVED — AUTHORITY REQUIRED` classification and its rejection of every candidate class. Those
   findings were correct in its pass and remain correct about *those candidates*; none of them is
   revived here. Its §6 decision-ready specification is discharged item by item by §3–§8 above.
4. **Tracker rows** citing "identity values UNRESOLVED": reconciled additively in the tracker append of
   this publication, with the superseded status preserved as history rather than deleted.
5. **Test-file comment** that previously described the constants as null: updated in place, since it
   is the file whose behaviour the binding commit changes.

---

## 12. Verification executed this pass — exact commands and results

All commands ran in the IPD worktree on Linux `x86_64`, Node `v22.22.3`, `process.platform = 'linux'`.
Nothing here is host qualification, QE, provisioning or adoption.

### 12.1 Baseline (before any mutation)

| Check | Command | Result |
|---|---|---|
| Install | `npm ci --no-audit --no-fund` | exit `0` |
| Typecheck | `npx tsc --noEmit` | exit `0` |
| Build | `npm run build` | exit `0` |
| Guarded suite | `npm test` | exit `0` — **892 tests, 891 pass, 0 fail, 1 skipped, 123 suites**, `[test-guard] OK` |

### 12.2 Designated blob check at the pre-publication baseline (§3 baseline discipline)

`12/12` of the successor act §2.1 paths resolve as designated: `provisioning.ts dc844189…` ·
`binding.ts 96d0079d…` · `audit.ts 273ccd3b…` · `connection.ts 5169e402…` · `001 f594a182…` ·
`002 932af8e6…` · `003 32b125bf…` · `004 6bad5a50…` · `dispatch.ts 27becc76…` ·
`portfolio_store.ts 4a005b73…` · `package.json 51796e63…` · `tests/g3_startup_validation.test.ts
edd0305e…`. The four migration blobs also match `DESIGNATED_MIGRATION_BLOBS` in the validator.

> **Dated pointer — added `2026-10-28` (UTC) under Program Authority ruling `A-GAP1` · record
> `IIPS-V3-CAP03-S1-POINTER-ACT-01-2026-10-28-01`
> (`evidence/cross-repository/IIPS_V3_CAP03_S1_POINTER_ACT_01_EFFECTIVE_2026-10-28.md`).**
> **§12.2 above is preserved verbatim and is NOT corrected in place.**
>
> 1. **`act §6 row S1` governs S1.** The governing text for step S1 is the effective Gate 4
>    target-host qualification act `IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01`,
>    §6 *"Q5 — Required execution ordering and dependencies"*, row **S1**: *"**Gate A′ provisioning
>    execution** on `desktop-no0nhtp` — **BLOCKED** …"*. This determination's §12.2 does **not**
>    govern S1.
> 2. **The `12/12` statement in §12.2 does not reproduce for items 10 and 12.** Measured at IPD
>    `1ba0740a32e69284d7c524fd6ac8daf5455038d0` against act §2.1 as then designated: item 10
>    `src/persistence/portfolio_store.ts` actual `540d49f2deb2c8d600b5b866675d145cf76a1e46` vs
>    designated `4a005b737de26443e261156a3102d553dd90b726`; item 12
>    `tests/g3_startup_validation.test.ts` actual `edd0305e3e5891020b2b045ab2cf082cd6cf788f` vs
>    designated `9a5fd9e3b22693e95304a1cd2df812bbf9ea2299`. The measured result is **`10/12`**. The
>    other ten items reproduce.
> 3. **Current state.** Items 10 and 12 were re-designated to the actual blobs by the separate
>    amendment act `IIPS-V3-CAP02-GATE-A-PRIME-AMEND-01-DESIGNATED-BLOBS-2026-10-28-01` (PA ruling
>    `A-Q5`, mechanism `A-O3`), published at IPD `0edadb2d128c9cf85e1522f0b7828d9e99d6d5cf`. §12.2's
>    enumeration remains a record of the pre-publication baseline and is not amended by this pointer.
>    **Source-attribution correction 2026-10-29 (`IPD-AQ4-AQ5-SOURCE-ATTRIBUTION-2026-10-29-01`).** The phrase
>    "(PA ruling `A-Q5`, mechanism `A-O3`)" above is **not supported by the IRR rulings record**. That record
>    (blob `7c1fe112…` at IRR `main`) lists the A-Q5 mechanism as **open**, with `A-O3` **recommended, not
>    ruled**; `06-recommendations.tsv` marks A-Q4/A-Q5/A-Q6 `RECOMMENDATION ONLY - NOT ADOPTED`. The amendment
>    act's **executed content** — designated blobs for §2.1 items 10 and 12 at `a891802e` — is **unchanged and
>    unaffected** (IRR `CV-CORR-178`, §16.198). Only the mechanism attribution is unverified; **A-Q5/A-O3 remain
>    PA-reserved**. See the dated pointer in
>    `IIPS_V3_CAP02_GATE_A_PRIME_AMEND_01_DESIGNATED_BLOBS_EFFECTIVE_2026-10-28.md`.
> 4. **No effect on any gate, status or designation.** This pointer re-designates nothing and executes
>    nothing. S1 remains **`BLOCKED`**; Gate A′ provisioning remains **`NOT AUTHORIZED`**; Gate 4
>    remains **`AUTHORIZED — NOT STARTED`**; `H-12` remains **`NOT ADOPTED`**.

### 12.3 After the binding change

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit `0` |
| Build | `npm run build` | exit `0` (pre-existing large-chunk advisory only) |
| Guarded full suite | `npm test` | exit `0` — **897 tests, 896 pass, 0 fail, 1 skipped**; `[test-guard] OK — 897 test(s) executed, 896 passed, exit 0` |
| Package consumer | `npm run test:package-consumer` | `"result": "PASS"`, shasum `cc2aa70186b8fd7bc7255452ac8d8b00d094f53e`, `"durability": "SESSION_ONLY"`, `"durable": false` |
| Focused Gate A′ | `node --test dist/tests/g3_gate_a_prime_successor_provisioning.test.js` | **12/12 pass, 0 fail** |
| Focused regressions | `g3_startup_validation` · `g3_binding_resolution` · `g3_write_gate` · `q1_ownership_source_readiness` · `g3_caller_authority` | **20/20 · 13/13 · 9/9 · 4/4 · 103/103**, 0 fail |
| Write guard | `evaluatePortSaveGuard()` | `{"authorized":false,"reasons":["W-1(3): Gate 4 qualification not accepted","W-1(4): Gate 5 admission not accepted"]}` — hard-false, unchanged |
| Operational-state check | `find` for `*.sqlite` / `*.db` outside `node_modules` | **`0` files** — building and testing created no store |
| Diff scope | `git diff --name-only` | exactly the `3` source/test paths of §7 (`tests/g3_startup_validation.test.ts` not modified); **no** guard, migration, package, CI or frontend path |

### 12.4 Empirical refusal probes (built entrypoint, zero files created)

| Probe | Observed |
|---|---|
| `--mode=execute` with all three determined values on Linux | `{"ok":false,"code":"PLATFORM_UNSUPPORTED","error":"provisioning is restricted to win32; observed linux"}`, exit `1`, **store file absent** |
| wrong `--act-id` | `ACT_ID_MISMATCH`, exit `1`, store absent |
| one differing value | `IDENTITY_VALUE_MISMATCH`, exit `1`, store absent |
| `GATE_A_PRIME_TENANT_ID` in the environment | `ENVIRONMENT_VALUES_NOT_AUTHORIZED`, exit `1`, store absent |
| `--mode=validate` on a non-existent path | `UNEXPECTED_FAILURE: the validation store file does not exist`, exit `1`, nothing created |
| directory listing after all probes | probe directory **empty** |

### 12.5 Renderer-side capability check

Shipped UI port still declares `SESSION_ONLY` / `durable: false`; no durable path was introduced or
enabled.

### 12.6 Identifier and value census

- `IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01`: **`0`** prior occurrences at the
  pre-publication baseline (now present only in this record, the tracker append, the provenance
  comments it authorizes, and the tests that assert the values).
- `ramki-personal-local`, `ipd-personal-local`, `ipd-owner-ramki-personal`: **`0`** prior occurrences
  anywhere in the tree before this pass; **`0`** occurrences of the IRR pair, the offline marker and
  the spent Gate A values were introduced or reused.
- No record ID, act ID or blob in this pass reuses a previously assigned identifier.

---

## 13. Effectiveness

This instrument is a Program Authority determination. It becomes **EFFECTIVE** on publication of this
exact content to `ramkivs/iips-production-market-data` `refs/heads/main` (merge commit, green CI,
remote read-back of this blob), together with the binding commit it authorizes. Its publication
receipt — PR, merge commit, tree, CI runs, changed paths and read-back — is recorded **separately** in
the CAP-02 tracker; this file's substantive text is not edited after merge.

Effectiveness of this determination is **not** effectiveness of anything downstream: provisioning
execution, H-12 adoption, Gate 4 qualification, result acceptance, Gate 5 admission and U6 write
authorization each require their own conditions and, where applicable, their own acts.

---

## 14. Attestation

| Claim | Value |
|---|---|
| PA determination rendered by this record | **YES — this record**, selecting all three values verbatim |
| Values previously present in an authoritative record / issued by an identity provider | **NO / NO** — census `0`; PA designation only |
| Values derived, defaulted, fabricated or copied from another domain | **NO** — no derivation source, no IRR value, no offline marker, no spent historical value, no fixture |
| Provisioning executed / store, binding, membership or audit row created | **NO / NO / NO / NO** |
| H-12 adopted or manifest promoted | **NO** — `R2` measurably staler (`10` of `1,140` dist files and `3` post-G3 source entries), adoption untouched |
| Gate 4 qualified, QE executed, result accepted, Gate 5 admitted, writes enabled | **NO / NO (0 of 11) / NO / NO / NO** |
| W-1 / `SESSION_ONLY` / `durable:false` changed | **NO** — re-verified operative by execution |
| Schema, migration, package, CI, runner or frontend changed | **NO** — three files, all inside successor act §5.1 |
| IRR modified | **NO** — not contacted in this pass |
| Handwritten signature, approval number or third-party attestation claimed | **NO** |

*End of `IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01`. On publication, the three S1
identity values for the personal, local, single-user IPD application are `ramki-personal-local`,
`ipd-personal-local` and `ipd-owner-ramki-personal`, and the binding commit authorized by successor
act §4 is effective. Nothing was provisioned; every gate, guard and durability marker is unchanged.*
