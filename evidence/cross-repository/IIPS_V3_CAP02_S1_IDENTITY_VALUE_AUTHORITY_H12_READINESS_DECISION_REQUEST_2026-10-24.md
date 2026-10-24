# CAP-02 — S1 Identity-Value Authority, Gate A′ Provisioning Readiness and H-12 R2 Adoption-Readiness — **DECISION-READY RECORD / PA DECISION REQUEST — PROPOSED, NOT EFFECTIVE**

> ## STATUS: **DECISION-READY — PROPOSED — NOT EFFECTIVE — RENDERS NO IDENTITY VALUE, NO APPROVAL, NO ADOPTION, NO PROVISIONING**
>
> This record is prepared under the standing preparation/investigation/publication authorization
> (F-3 §1.2, IRR blob `c4c9f7d79ef181af96f6c4e5cc108288ef22fd02`, as construed by DEC-06
> `IIPS-V3-DEC06-AUTHORITY-RECONCILIATION-IRR-2026-10-21-01`, IRR blob
> `4be3ea578a51a1a949337e5d218b89841c04892d`, rules R-1/R-2/R-3/R-9). It is **not** a rendered
> Program Authority determination. It selects no `principal_label`, `tenantId` or
> `canonicalOwnerId`; it invents, derives, copies or defaults no identity value; it does not
> provision, create a store, insert a row, contact the designated Windows host, execute any QE item,
> adopt H-12, accept a result, admit a gate or enable any write.
>
> Its purpose is to take the S1 identity question and the H-12 adoption question to the **furthest
> evidence-supported point**: a field-by-field authority/provenance matrix in which every candidate
> value is located to an exact path/commit/blob and either established or rejected on the record; a
> precise, decision-ready specification of the single PA determination that is missing; a
> criterion-by-criterion H-12 readiness table; and the dependency dispositions for CAP-03 DR-2, DR-3
> and DR-4r. Where authority runs out, this record stops and names the missing authority; it does not
> disguise the stop with a placeholder a runtime could accept (DEC-06 R-9).

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-CAP02-S1-IDENTITY-AUTHORITY-H12-READINESS-DECISION-REQUEST-2026-10-24-01` (census before this record: `0` assignments in either repository — see §12.6) |
| **Record type** | Decision-preparation / decision-request record (investigation, provenance matrix, readiness assessment, decision-ready PA request). Not an authority act, not an adoption act, not an execution receipt. |
| **Prepared** | `2026-10-24` (UTC) — actual date, not backdated |
| **Prepared by** | Arena Agent Mode, under the standing preparation/publication grant. The deciding authority for every open item is **Ramki — Program Authority** (IPD security-contract capacity); no PA determination is asserted here. |
| **Repository / locus** | `ramkivs/iips-production-market-data` (IPD). Additive documentation only. IRR (`ramkivs/iips-review-recovered`) was inspected **read-only**: no IRR file, branch, ref, PR, issue, comment or tracker was created or modified. |
| **IPD live baseline (verified this pass)** | `refs/heads/main` = **`5e4e54db752060f75c945eb437ab317b7b9f04bf`**, root tree **`9de03c775dbbc19f9e68b5e4931a94a6c70fa054`** (`git fetch --prune` + `ls-remote` agreed; clean tracked worktree) |
| **Final Limb A / QE-content pin** | **`a52b47b0f8ca448c8c9c195cf261e83ecf813ba3`**, tree `1467802e9b9497f84acb1bc6bb3ddd386792499a` — an ancestor of current `main`; `18` commits intervene, **all documentation/evidence only** (`0` non-`evidence/` paths; measured this pass) |
| **IRR live tip (read-only, verified this pass)** | **`4d14780f0db66a891f552926ee2badaf56acfa2d`**, tree `742ac4d4c8817bab9aa2cbeaac138d9a72c2934e` |
| **IRR designated consumer pin** | **`4740ba21ea6103f1a7ebc9768269ae7795920698`**, tree `23c5ca4ae1bfd481bcfc911c70b9e7dc090e1162` — an ancestor of the live tip; drift is `4` commits touching exactly one documentation file; the `27` manifest entries (`24` consumer + `3` criteria) are byte-identical at both commits (measured §12.3) |
| **Sandbox environment (not the designated host)** | Linux `x86_64`, Node `v22.22.3`, `process.platform = 'linux'`. `node:sqlite` loads without a flag (emits only an experimental warning). All local checks here are repository-level evidence, never host qualification. |
| **Headline result** | All three S1 fields — `principal_label`, `tenantId`, `canonicalOwnerId` — are **UNRESOLVED — AUTHORITY REQUIRED**. No authoritative IPD-owned value exists; every located candidate is another domain's identifier, an offline fixture, a spent historical act under an absent schema, or a test fixture, and is rejected under the no-copy rule. H-12 remains **NOT ADOPTED**; Gate A′ provisioning remains **NOT AUTHORIZED**; QE remains **0/11**. |

---

## 1. What this pass did, and the authority boundary it observed

1. Re-fetched and independently verified both remote baselines (§2), including ancestry and the
   documentation-only character of every commit since the final Limb A merge.
2. Re-read the complete effective instruments rather than relying on prior summaries: the Gate A′
   successor provisioning act, the Gate 4 target-host qualification act, the Alternative A amendment,
   both H-12 candidates and both validation records, the authoritative tracker, and the read-only IRR
   F-3 / DEC-06 / CAP-03 / D-7 governing records.
3. Built the field-by-field identity authority/provenance matrix (§3–§5), locating **every** concrete
   identity-like value in either repository to an exact path, commit, blob SHA-1 and raw SHA-256, and
   classifying each as established, candidate or rejected.
4. Reconciled the Gate A′ provisioning prerequisites, the P-1/V-A2 machinery, the designated-host
   requirements and the H-12 adoption criteria against the current implementation (§7–§9).
5. Disposed the CAP-03 DR-2/DR-3/DR-4r dependencies against the S1/H-12/Gate-5 critical path (§10).
6. Executed only non-mutating checks and read-only probes, with exact results (§12). No schema,
   migration, source, test, script, CI, package or IRR object was changed; no value was persisted.

**Authority boundary.** F-3 §1.2 authorizes "decisions, governance records, implementation, testing,
corrections, and publication within the established scope", but expressly not "fabricated evidence,
weakened safeguards, unrelated scope expansion, or claims of success without verification", and F-3 is
"**not** a value-selection act". DEC-06 R-2 fixes established scope by PA product decisions and
governing boundaries; R-9 requires genuine uncertainty to be named, not manufactured away. The
effective Gate A′ successor act §4 reserves the three identity values for "a **separate Program
Authority identity-value determination** … the one value-selection act the standing grant withholds".
That reservation is an *effective* boundary; this record respects it and prepares the determination
rather than performing it.

---

## 2. Live baseline verification (measured, not assumed)

### 2.1 IPD

| Item | Measured value | Method / result |
|---|---|---|
| Remote `main` commit | `5e4e54db752060f75c945eb437ab317b7b9f04bf` | `git fetch origin --prune`; `git ls-remote origin main` == `git rev-parse origin/main` |
| Root tree | `9de03c775dbbc19f9e68b5e4931a94a6c70fa054` | `git rev-parse origin/main^{tree}` — matches the reported authoritative tree |
| Working tree | clean; `0` tracked changes | `git status --porcelain` empty (`node_modules/`, `dist/`, `*.log` are git-ignored) |
| Limb A final merge | `a52b47b0f8ca448c8c9c195cf261e83ecf813ba3` / tree `1467802e9b9497f84acb1bc6bb3ddd386792499a` | ancestor of `main` (`merge-base --is-ancestor` true) |
| Drift since Limb A | `18` commits; changed paths = `5` Markdown + `2` JSON, **all under `evidence/`** | `git diff --name-only a52b47b0… origin/main`; non-`evidence/` count **`0`** |
| PR lineage at tip | PR #77 merge `5e4e54d…` (tracker-only receipt for PR #76); PR #76 merge `00cad5c3…` (the Alternative A amendment) | `git log --first-parent`; PR #77 changed only the tracker |
| Designated Gate A′ blobs (act §2.1, 12 paths) | all `12/12` resolve at current `main` to the exact blob IDs recorded in the effective act | enumerated in §7.3 |

### 2.2 IRR (read-only clone in `/tmp`, outside every IPD working tree; no write performed)

| Item | Measured value |
|---|---|
| Live `main` | `4d14780f0db66a891f552926ee2badaf56acfa2d` / tree `742ac4d4c8817bab9aa2cbeaac138d9a72c2934e` — re-derived live, matching the amendment's observation and superseding the older `4d14780f…`-era reports by direct measurement |
| Designated pin | `4740ba21ea6103f1a7ebc9768269ae7795920698` / tree `23c5ca4ae1bfd481bcfc911c70b9e7dc090e1162`, an ancestor of the live tip |
| Drift | `4` commits (PRs #231/#232 and their merges); exactly one changed file: `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` (documentation) |
| Manifest integrity | all `27/27` IRR-side R2 entries (`24` consumer + `3` criteria) resolve at **both** the pin and the live tip to their recorded blob SHA-1 — `0` mismatches (§12.3) |
| Mutation | none — no IRR ref, branch, file, issue, comment or PR was created or modified |

---

## 3. The three S1 fields — exact meaning, schema and validation (current `main`)

The current principal model exists entirely in migration `003`
(`src/persistence/migrations/003_local_principal_bindings.ts`, blob
`32b125bf962bb76a6ae59d3b262203dbbb988197`, raw SHA-256
`30b5eab65f24267e9b7f9992fc5a7fe2978f613a979f033265a228831656df28`, 1,649 B). The seven tables on
`main` are `portfolios`, `portfolio_revisions`, `portfolio_holdings`, `portfolio_contributions`,
`audit_events`, `local_principal_bindings`, `local_principal_memberships`. The old Gate A tables
(`application_users`, `tenant_memberships`, `local_principal_audit_events`, `external_identity_mappings`)
**do not exist on `main`** (measured: zero references in `main`'s migrations).

| Field | Column / type | Meaning and role in the running system | Deterministic identity derived from it | Validation in code |
|---|---|---|---|---|
| `principal_label` | `local_principal_bindings.principal_label TEXT NOT NULL` | The human-meaningful label of the single local principal; the one `ACTIVE` binding row. It is also the audit `subject_id` for the provisioning event. Plain `TEXT`; the schema imposes no format beyond non-null; the act requires a verbatim, non-empty value and forbids derivation. | `binding_id = sha256('binding:' + principal_label).slice(0,32)` | non-empty; must equal the compiled constant `PRINCIPAL_LABEL` (currently `null`); CLI-only, never env-supplied |
| `tenantId` | `local_principal_memberships.tenant_id TEXT NOT NULL` | The tenant of the single `ACTIVE` membership attached to the binding. Plain `TEXT NOT NULL`; no enum, no directory, no upstream source. | `membership_id = sha256('membership:' + tenantId + ':' + canonicalOwnerId).slice(0,32)` (combined with owner) | non-empty; must equal compiled `TENANT_ID` (currently `null`); CLI-only |
| `canonicalOwnerId` | `local_principal_memberships.canonical_owner_id TEXT NOT NULL` | The canonical owner of that membership; carried into the audit `detail = { tenantId, canonicalOwnerId }`. Plain `TEXT NOT NULL`. | contributes to `membership_id` (above) | non-empty; must equal compiled `CANONICAL_OWNER_ID` (currently `null`); CLI-only |

Storage-layer cardinality is enforced by partial-unique indexes
(`idx_local_principal_bindings_single_active`, `idx_local_principal_memberships_single_active`): at
most one `ACTIVE` binding and at most one `ACTIVE` membership; any number of `REVOKED` rows are
retained as history. Resolution (`src/persistence/binding.ts`, blob
`96d0079dd04b75c6f257a2001c8f7eff1ffc560a`) re-reads the single `ACTIVE` pair per request inside an
immediate transaction and fails closed on zero or multiple rows.

The shipped entrypoint (`src/persistence/gateAPrimeProvisioning.ts`, blob
`1fe6e6b3e87a4fbe082271be150c517e5e445423`) and validator
(`src/persistence/gateAPrimeValidation.ts`, blob
`be9ce404fd8077b9f57a71a846636d4fdc3e1769`) compile the three values as **`null`**
(`PRINCIPAL_LABEL = TENANT_ID = CANONICAL_OWNER_ID = null`, measured directly this pass). While any
constant is `null`, `--mode=execute` refuses with `IDENTITY_VALUES_UNRESOLVED` **before any database
connection is opened** (empirically reproduced, §12.4), and no store file is created.

---

## 4. Candidate-value register — every concrete identity-like value, located and classified

The no-copy rule (Gate A′ act §4; F-3 §5.3/§6.3; G2 contract OC-7) forbids copying or inferring a
value from an unrelated principal, another environment, an example, history, a fixture or an adjacent
record. Every concrete value located in either repository is therefore catalogued below with its exact
provenance and the reason it cannot establish the IPD principal for this environment.

### 4.1 IRR F-3 owner-context pair — **REJECTED (cross-domain, value-selection not exercised)**

| Item | Evidence |
|---|---|
| Values | `owner-7f3a91c2` (F-1 `ownerUserId`); `irr-domain-4b82d6e1` (F-2 `tenantId`) |
| Carrier code | IRR `frontend/server/owner-context-carrier.ts` (live-tip blob `a576e5af983c9351e2ea73202ef7f19d61788d13`): `APPROVED_OWNER_USER_ID = 'owner-7f3a91c2'`, `APPROVED_TENANT_ID = 'irr-domain-4b82d6e1'`, with a pinned canonical-byte `OWNER_CONTEXT_CARRIER_SHA256` |
| Governing record | F-3 `IIPS_v3.0_OWNER_CONTEXT_F3_MECHANISM_AND_IMPLEMENTATION_PA_DECISION.md`, IRR blob `c4c9f7d79ef181af96f6c4e5cc108288ef22fd02`: header states **"Value-selection authority: NOT EXERCISED … preserved unchanged"**; §1.2 "It is **not** a value-selection act"; §5.3 "Do not infer an owner or tenant identity … from … any other domain's identifier. No defaulting. No fallback identity. No synthetic principal."; §5.7/§6.5 "No IPD change, no IRR↔IPD mapping or equivalence"; scope limited to Watchlists NP-09 / Collaboration NP-10 / Settings NP-11 |
| IPD-side corroboration | CV-20 Option A record (blob `f15c6d40…`): the F-3 carrier "stays restricted to NP-09/10/11 and is refused as a principal (L-IPC-1 §4.1, §11 A5)"; G2 consumer contract v1 OC-7 forbids deriving owner context from the F-3 carrier; the Gate A′ act §4.1 records the pair "may not be copied" and notes the tenant value literally names the IRR domain |
| Classification | The pair is an **IRR-domain** partition carrier for three non-portfolio capabilities, materialised outside version control, with no namespace equivalence to IPD and no value-selection act behind it. It cannot supply `canonicalOwnerId`, `tenantId` or `principal_label` for the IPD local principal. **Rejected for all three fields.** |

### 4.2 `IIPS_OFFLINE_BOOTSTRAP` — **REJECTED (offline non-production provenance marker, different schema)**

| Item | Evidence |
|---|---|
| Value / location | literal `'IIPS_OFFLINE_BOOTSTRAP'` assigned to `provenance.tenantId` at `src/d114/pit_ingestion_loader.ts` lines 343 and 404 (blob `2c875f7019896288f145e5da66dc550e1522581a`, raw SHA-256 `7d2d3152…`, 18,518 B) — the only tenant-like string literal in IPD `src/` besides null constants |
| Operating mode | file header: "Operating Mode: `OFFLINE_BOOTSTRAP / LOCAL_FIXTURE_AND_OFFLINE_DEV`"; package export is restricted to the `./d114-non-production` subpath |
| Schema / purpose | it tags D01/D02 market-data **envelope provenance** (`vendorTier: 'OFFLINE_BOOTSTRAP'`), not `local_principal_memberships.tenant_id`; it has no binding, membership, owner or principal semantics |
| Classification | An offline historical-data bootstrap marker for a different contract and a non-production package. Using it as the principal tenant would conflate a data-provenance tag with an ownership identity and would violate the no-copy rule. **Rejected for `tenantId`; irrelevant to the other two fields.** |

### 4.3 Spent 2026-10-16 Gate A execution values — **REJECTED (spent act, absent schema, runtime UUIDs, different concepts)**

| Item | Evidence |
|---|---|
| Record | `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_EXECUTION_RAW_EVIDENCE_2026-10-16.md` (blob `b42c5c6dcbc5f5a5e3b4ef777bc88a6d0b9db229`, raw SHA-256 `712edd8f…`, 99,081 B), act `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01`, status "PROVISIONED / VALIDATED", one-time, spent |
| Concrete values | `applicationUserId = 4f423263-e85d-4133-9119-31832cb3e49d`; `tenantId = t-1c568b7e-d883-4d85-a7f6-7433a490165a`; `endpointId = ep-4851658e-149c-4b3c-85e0-ae76e5dceacc`, generated by `crypto.randomUUID()` at execution under rule "tenant = `t-` + lowercase(UUIDv4); endpoint = `ep-` + lowercase(UUIDv4); generated once, immutable" |
| Why inapplicable | (1) those rows lived in `application_users` / `tenant_memberships` / the old `local_principal_bindings(endpoint_id,…)` — tables **absent from `main`**; (2) the successor act §2.2 measured the two schemas mutually incompatible; (3) the 2026-10-17/2026-10-23 acts superseded that execution basis, and the successor act §4 states the historical approach "names no label that survives into this schema"; (4) there is no `principal_label` or `canonical_owner_id` value anywhere in that record — those columns did not exist; (5) the store at `/home/user/gate-a-store/ipd-portfolio.sqlite` is absent and no SQLite store exists anywhere in the current tree (measured) |
| Classification | Historical values from a spent, one-time act under an incompatible, off-`main` schema; runtime-generated and not durable authority for the current principal model. **Rejected for all three fields** (and not even type-matched to two of them). |

### 4.4 Test fixtures — **REJECTED (explicitly non-authoritative)**

| Item | Evidence |
|---|---|
| Locations | `tests/g3_gate_a_prime_successor_provisioning.test.ts` (blob `c13a52ec…`) uses `'ipd-principal-not-selected'`, `'ipd-tenant-not-selected'`, `'ipd-owner-not-selected'` (the default `args()` helper) and `'fixture-principal' / 'fixture-tenant' / 'fixture-owner'` for T-9; other suites use `'owner-local'/'tenant-local'`, `'owner-d'/'tenant-d'`, `'someone-else'/'tenant-other'`, `'TENANT_X'`, `'tenant-inst-1'`, `'operator'/'t'/'o'` |
| Classification | The names themselves declare non-selection; they exercise refusal and read-only validation against disposable temp stores. The T-9 fixture is expressly "without treating it as an execution result". **Rejected for all three fields.** |

### 4.5 Negative results — where no value exists at all

- A full-tree `git grep` for `principal_label = '<literal>'`, `canonical_owner_id = '<literal>'`,
  non-null `PRINCIPAL_LABEL/TENANT_ID/CANONICAL_OWNER_ID` assignments, `owner-…`/`irr-domain-…`
  literals, and `t-/ep-` UUIDs returns only the rejected classes above; the three compiled constants
  are the only production bindings and they are `null`.
- The 12-sheet program tracker workbook (`.xlsx`) and the integration-aligned specification (`.docx`)
  contain **zero** occurrences of `principal_label`, `canonical_owner*`, `tenantId/tenant_id`,
  `local_principal`, or the F-3 pair (measured by direct XML inspection).
- `docs/`, `BLOCK-3L-…md`, `run-d114-legacy-acquisition.ps1`, `frontend/` and the open GitHub
  issues/PRs contain no identity value or value-selection decision. The only open IPD PR (#42, draft)
  and open issues (#43 probe, #44 broker-import) are unrelated.
- The off-`main` G24 governance record (`NP04-GOVERNANCE-AUTHORITY-RECORD.md` §5.2, read at tag
  `iips-pin-g24-6828155e`, a reference-only lineage never admitted to `main`) states the standing
  rule: **"Tenant source of truth = D115-deferred; Tenant administration = NOT AUTHORIZED;
  Tenant-admin authorization = NOT AUTHORIZED; Tenant lifecycle expansion = DEFERRED."** It supplies
  no value and confirms none may yet be administered.
- The off-`main` Gate A branch `gate-a/local-principal-enablement-2026-10-16` (`2ded0e98…`) generates
  its identifiers with `randomUUID()` at run time and contains no hard-coded principal/owner value;
  its only tenant literal is again `IIPS_OFFLINE_BOOTSTRAP`.

---

## 5. Field-by-field authority and provenance matrix (the S1 determination)

| # | Field | Exact meaning / format | Authority permitted to select | Authoritative record establishing a value? | Binding target | This-pass classification |
|---|---|---|---|---|---|---|
| 1 | `principal_label` | non-empty `TEXT`; label of the single ACTIVE binding; audit `subject_id`; determines `binding_id`; no derivation from host/account/SID/email/machine/company/issuer/portfolio identifiers | **Program Authority only**, in the separate S1 identity-value determination (Gate A′ act §4). The standing grant withholds value selection; an agent choice is unrelated scope expansion (DEC-06 R-2) | **None.** No IPD act, manifest, workbook, spec, data set or historical record names an IPD principal label for this schema; the old Gate A model used `endpointId` (a different, absent column) and generated it at run time | immutable single-principal identity (one ACTIVE binding, partial-unique index); the act/basis commit through the compiled constant; this non-production single-user host environment | **UNRESOLVED — AUTHORITY REQUIRED** |
| 2 | `tenantId` | non-empty `TEXT`; tenant of the single ACTIVE membership; co-determines `membership_id` | **Program Authority only**; additionally constrained by "Tenant administration = NOT AUTHORIZED / source of truth D115-deferred" until an express carve-out (the successor act is that carve-out's *vehicle*, but §4 leaves the value itself unselected) | **None.** All four candidate classes (§4.1–§4.4) are rejected; no IPD-owned tenant identifier exists | the single membership/tenant; the compiled constant; the same environment; no tenant directory or multi-tenant semantics may be implied | **UNRESOLVED — AUTHORITY REQUIRED** |
| 3 | `canonicalOwnerId` | non-empty `TEXT`; canonical owner on the membership; audit `detail`; co-determines `membership_id` | **Program Authority only**; F-3's IRR `owner-7f3a91c2` is refused as a principal and no IRR↔IPD equivalence exists (F-3 §5.7; CV-20; OC-7) | **None.** The F-1 IRR owner is cross-domain; the historical `applicationUserId` belongs to an absent table and is a different concept; fixtures are non-authoritative | the single membership/owner; the compiled constant; the same environment | **UNRESOLVED — AUTHORITY REQUIRED** |

**Consistency constraints among the three (why one unresolved field blocks all of provisioning).**

1. The entrypoint requires all three CLI arguments present **and** each equal to its non-null compiled
   constant before a connection opens; any `null` constant ⇒ `IDENTITY_VALUES_UNRESOLVED` (act §5.3;
   reproduced §12.4). A placeholder that the runtime could accept is therefore prohibited by design
   and by this record's mandate.
2. `binding_id` is a pure function of `principal_label`; `membership_id` is a pure function of
   `(tenantId, canonicalOwnerId)`. The values are thus bound to immutable, content-derived row
   identities; changing a value after provisioning cannot be done by update (no repair/re-activation
   path exists; `ACTIVE → REVOKED` is one-way), only by a fresh governed act on a fresh store.
3. The partial-unique indexes make the three values a single-principal/single-membership fact: there
   is no second tenant, owner or binding, and no multi-user semantics may be read into them.
4. All three must be named **in one** determination, verbatim, with the act under which rendered and
   an express cross-domain statement if any value is reused (Gate A′ act §4). No environment variable
   may supply, default or override any of them (`GATE_A_PRIME_*` ⇒ outright refusal, reproduced).

**What prevents safe establishment under current authority (stated plainly).** (a) the standing grant
is explicitly not a value-selection act and forbids fabrication and scope expansion; (b) the effective
Gate A′ act §4 reserves a separate PA determination and ships null constants on purpose; (c) tenant
administration is NOT AUTHORIZED with a D115-deferred source of truth; (d) every concrete value in
evidence is cross-domain, offline-fixture, spent-historical or test-only, and the no-copy rule bars
each; (e) no derivation source is permitted. There is consequently no evidentiary path by which this
pass could establish any of the three without crossing an effective boundary. **None is established;
none is guessed.**

---

## 6. The exact missing determination — decision-ready specification (renders nothing itself)

The Program Authority is asked to render a **separate S1 identity-value determination** (a new
instrument; the successor act §4 requires no code change to author it). To be sufficient it must, at
minimum:

1. **Name all three values verbatim** — `principal_label`, `tenantId`, `canonicalOwnerId` — exact
   strings, with each value's provenance and the reason it applies to **this** principal on **this**
   non-production single-user host (not to an IRR domain, a fixture or a historical act).
2. **State the act under which it is rendered** and its relationship to
   `IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01` §4 (the reservation this
   determination discharges).
3. **Cross-domain statement:** if any value is reused from another domain, say so expressly and create
   the governed D-2 §8 translation/equivalence rule F-3 currently says does not exist; otherwise state
   that all three are newly selected IPD-owned values.
4. **Authorize the binding commit:** a follow-up commit within the successor act's existing four-path
   file set that sets the three compiled constants in
   `src/persistence/gateAPrimeValidation.ts` from `null` to the named values (and re-runs T-1…T-9).
   This is the "binding commit" of §4/§5.2; it changes post-G3 surface entries S-5/S-6 and therefore
   moves the final execution commit (§9).
5. **Reaffirm the execution guards unchanged:** CLI-only equality to the constants; no env supply;
   `win32` + Node `>=22.13.0 <23`; P-1 absolute non-existent store; single-use consumption; the
   fail-closed refusal codes.
6. **Record the evidence basis** for each value (or the PA's explicit selection rationale where no
   prior record exists), so the determination is itself auditable and does not rest on an agent's
   choice.

Permitted alternatives supported by the evidence, for the PA's decision (none is pre-selected here):
(a) select three new opaque IPD-owned values (the pattern historically used is act-chosen opaque
tokens, e.g. the old `t-/ep-` grammar, but that grammar is **not** carried forward automatically and
the new columns are free-form `TEXT`); (b) where a genuine same-principal equivalence can be governed,
expressly map an existing value under a new D-2 §8 rule — the evidence shows this does not yet exist
for the F-3 pair; (c) any other verbatim, provenance-backed selection the PA renders. Consequence of
leaving the determination unrendered: S1 stays blocked, which structurally blocks S2/S3/S4 (Gate 4 act
§6; Gate E §4 ordering), H-12 adoption and every QE item.

---

## 7. Gate A′ provisioning prerequisites — reconciled against the current implementation

### 7.1 Authority and ordering

| Question | Determination from the effective acts + current code |
|---|---|
| Exact authority required to provision | The effective successor act supplies the **basis and the bounded entrypoint/validator authority** (EFFECTIVE, PR #67/#68). The **execution** additionally requires the separate S1 identity-value determination (§4) and the host/P-1 conditions. Provisioning execution is therefore still **NOT AUTHORIZED**; only code, validation and preparation are. |
| Must the S1 identity-value act precede provisioning? | **Yes.** §5.3 runs the null-constant/equality checks before the DB connection; §8.2 lists "identity values absent, ambiguous or requiring invention" as a stop condition; Gate E §4 orders qualification after provisioning. The empirical probe (§12.4) confirms execution cannot begin while constants are null. |
| Is there any path that provisions today? | **No.** The brand-gated mutator `provisionActiveBinding` (`src/persistence/provisioning.ts`, blob `dc844189…`) is imported only by two test files; no `src/` runtime or `frontend/` module imports it. The Gate A′ entrypoint has no `src/`/`frontend` importer (measured via `git grep`). IPC remains `WRITE_NOT_AUTHORIZED` before mutation. |

### 7.2 Immutable code/schema identity

The entrypoint is bound by construction to `GATE_A_PRIME_ACT_ID = IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01`,
`BASIS_COMMIT = 5fc74085ade980846ff4a07b36415b6d49446486`, `BASIS_TREE = 7226ef00…` (measured in the
shipped constants). The module-private `unique symbol` brand cannot be minted outside the entrypoint.

### 7.3 The twelve act §2.1 designated blobs — all unchanged at current `main` (measured this pass)

`provisioning.ts dc844189…` · `binding.ts 96d0079d…` · `audit.ts 273ccd3b…` · `connection.ts
5169e402…` · migration `001 f594a182…` · `002 932af8e6…` · `003 32b125bf…` · `004 6bad5a50…` ·
`ipc/dispatch.ts 27becc76…` · `portfolio_store.ts 4a005b73…` · `package.json 51796e63…` ·
`tests/g3_startup_validation.test.ts edd0305e…` — every ID resolved identically at
`origin/main@5e4e54d…`. The four migration blobs also match the validator's
`DESIGNATED_MIGRATION_BLOBS`.

### 7.4 Designated host and execution prerequisites

- Host of record (2026-10-17 act D-A′-2, re-adopted by the successor act §8): machine
  **`desktop-no0nhtp`**, Windows 11 Home Single Language, build 26200, non-elevated account
  `desktop-no0nhtp\user`, SID `S-1-5-21-1872737340-673410177-2240931581-1001`,
  `process.platform === 'win32'`.
- Runtime: Node **`>=22.13.0 <23`** with flag-free `node:sqlite`. The historical host measurement
  Node **v24.14.0** is outside the required major and is expressly "not acceptable preflight
  evidence"; no runtime installation/switch is authorized (Gate 4 act §12/§14).
- Availability: the host is **unreachable from this sandbox** — a fresh `ping desktop-no0nhtp` this
  pass returned "Name or service not known" and DNS does not resolve, reproducing the recorded
  `cap02_2026-10-23_successor_execution_evidence/00_baseline_and_host_probe.txt`. No alternative host
  may be substituted.
- P-1 store: absolute, outside every Git working tree, local fixed NTFS, non-synchronized,
  operator-writable without elevation, file must not pre-exist. No P-1 path has been selected; no
  store exists.

### 7.5 P-1 steps and V-A2-1…V-A2-8 — fixed, none executed

The P-1 sequence (preflight capture → store path → read-only pre-inspection → single execute
invocation → read-only validation → post-state/refusal checks → evidence publication) and the eight
read-only validations are fixed in successor act §6/§8 and implemented in
`gateAPrimeValidation.ts` (V-A2-1 ledger 001–004 checksums; V-A2-2 one ACTIVE binding/deterministic id;
V-A2-3 one ACTIVE membership attached with the named owner pair; V-A2-4 zero portfolio-family rows;
V-A2-5 one hash-chained audit event; V-A2-6 resolver behaviour; V-A2-7 write guard still hard-false;
V-A2-8 single-use consumption). With null constants the validator honestly reports failures (an empty
temp store returns read-only `FAIL` at V-A2-1, measured §12.4) and never writes. **No V-A2 receipt
exists; provisioning is unperformed and unauthorized.**

### 7.6 Do the H-12 adoption criteria require an operation the effective acts do not yet authorize?

**Yes.** Adoption requires (inter alia) the S1 identity-value act + binding commit, an executed P-1
provisioning with V-A2 evidence, a native-Windows canonical `npm test` and a separate express PA
adoption act — none of which is authorized to *execute* from this Linux sandbox, and the first of
which no agent may render. The effective acts authorize preparation and the documentary sequence, not
those operations.

---

## 8. H-12 R2 adoption-readiness — criterion by criterion (current artifacts, current hashes)

| Required determination | Finding this pass (with evidence) | Status |
|---|---|---|
| **Membership amendment effective and verified** | `IIPS-V3-CAP02-G4-AMEND-01-H12-MEMBERSHIP-2026-10-23` (blob `21a0f9eb6cd7b1bbc4849d6dfd26c6c8025d60b8`, SHA-256 `ad20b02b…`, 43,608 B, PR #76, merge `00cad5c3…`) is **EFFECTIVE**: 32 mandatory IPD + 1 conditional helper + 24 IRR = **56** core entries; 7 post-G3 paths separate; 1,140 `dist/**` preserved; `ci.yml` corrected to `4614ee0e…`. Independently re-read at current `main`. | **Met** |
| **Manifest structure and membership vs amended requirements** | R2 (`G4-H12-MANIFEST-v3-CANDIDATE-2026-10-23-R2`, blob `9382d4b0…`, 498,153 B) carries `entries` length **56** (32 IPD `[0..31]` incl. parser test at `[23]` blob `49e901b6…`, 24 IRR `[32..55]`), 1 conditional helper, 9 criteria, 10 anchors, 7 post-G3, 1,140 dist. This pass re-verified **50/50** IPD-side manifest paths byte-identical at current `main` and **27/27** IRR paths byte-identical at pin and live tip; a fresh build reproduced **1,140/1,140** dist bytes. Content matches the amended membership. | **Content verified; candidate not adopted** |
| **Current code/commit binding (immutable)** | The QE-content pin is the Limb A final merge `a52b47b0…`/tree `1467802e…`. Current `main` is `5e4e54d…`, `18` commits later with **zero** non-`evidence/` drift, so every recorded source blob remains current. But the **final authorized execution commit does not yet exist**: the future S1 binding commit will change post-G3 entries S-5/S-6 and advance the pin, and Gate 4 §3.2 forbids silent re-pin. | **Outstanding — final pin designation and binding commit** |
| **S1 identity-value act, effective and bound** | Not rendered; all three fields UNRESOLVED (§5); compiled constants `null`; execute refuses `IDENTITY_VALUES_UNRESOLVED`. | **Outstanding — primary blocker** |
| **Gate A′ provisioning authority** | Basis/entrypoint authority EFFECTIVE; **execution explicitly NOT AUTHORIZED** (successor act header/§4); no store, no row, no P-1 path; host unreachable. | **Explicitly verified — withheld** |
| **P-1 provisioning and V-A2-1…V-A2-8 evidence** | None executed; no V-A2 receipt; the read-only validator and T-1…T-9 tests (7/7 pass) prove the machinery, not an execution. | **Outstanding** |
| **Windows designated host — identity and availability** | Identity known and fixed (§7.4); availability **not verifiable** from this sandbox (fresh DNS/ping failure); Node 22-range preflight never performed on the host; v24.14.0 history is out of range. | **Outstanding — host-gated** |
| **Canonical Windows `npm test`** | Never run under Node 22 on `desktop-no0nhtp`; the recorded native-Windows failure remains FAILED history; Linux CI/local runs (incl. this pass, 892/891/0/1) are explicitly not host evidence. | **Outstanding — host-gated** |
| **Manifest regeneration at the final authorized execution commit** | R2 is stamped **"RECONCILED CANDIDATE (PRE-PA-AMENDMENT) … NOT ADOPTED"**; its `membership_counts` still records the unamended 33 and the three alternatives, and its pins predate the amendment. It cannot be adopted as-is; regeneration/full re-validation under the amended §8 at the final execution commit (after the binding commit) is mandatory (§9). | **Outstanding** |
| **Remote publication and read-back** | R1/R2 and both validations were published and remotely read back as **candidates** (PRs #69/#74); adoption-level publication/read-back does not exist. This pass independently reproduced all blob identities from the fetched remote and a read-only IRR clone. | **Candidate publication met; adoption publication outstanding** |
| **Separate H-12 adoption act** | Not rendered — correctly. Gate 4 §8 requires a separate express PA act after full validation at the exact final commit and before preflight; the amendment and proposal (`ADOPT-REQ-01…08`, `Q-H12-4`) preserve this. | **Not rendered (correct); outstanding** |

**Adoption verdict:** H-12 remains **NOT ADOPTED**. The membership *content* question is fully settled
and byte-verified under the amendment; adoption is now gated on the S1 determination → binding commit
→ final-pin regeneration/revalidation → native-Windows evidence → the separate adoption act. No test
result, host fact or adoption is manufactured in this record.

---

## 9. Why R2 cannot simply be adopted, and exactly what must be regenerated

1. **Status and wording are pre-amendment.** R2's `status` and `membership_counts` encode the
   `33`-vs-`32` conflict and Alternatives A/B/C as *proposed*. The amendment has since selected
   Alternative A and fixed §8 at 32/24/56. R2 is preserved byte-identically as a historical candidate
   (amendment §8.2; amending it in place is prohibited), so the adopted manifest must be a **new
   generation** carrying the amended membership, not an edit of R2.
2. **The execution commit will move.** Gate 4 §3.2 makes the IPD QE pin the final post-Limb-A commit,
   designated before preflight. The S1 binding commit (setting the three constants) modifies
   `src/persistence/gateAPrimeProvisioning.ts`/`gateAPrimeValidation.ts` — post-G3 entries **S-5/S-6**
   (and the S-7 test if touched) — creating a new commit whose blobs differ from `a52b47b0…`. The
   adopted H-12 and its before/after digests must be regenerated at that exact commit; a silent
   re-pin is a stop condition.
3. **What is already reusable (no rework implied).** Because the drift since `a52b47b0…` is
   documentation-only and this pass proved all 50 IPD and 27 IRR manifest blobs and all 1,140 dist
   bytes identical at the current tips, regeneration is a **re-stamping and re-validation exercise**,
   not a new content discovery: re-hash at the final commit, refresh commit/tree pins and the
   membership/status fields to the amended values, regenerate `runtime_dist_set` from a fresh build,
   and leave `evidence_deposit_set` empty until QE actually executes (its explicit NOT_GENERATED state
   is correct, not a gap to fabricate).
4. **Sequence (from the effective acts).** S1 determination → binding commit (green CI, read-back) →
   regenerate H-12 at that final commit + full VAL-style validation → separate express PA adoption →
   host preflight (S3) → QE-1…QE-11 (S4) with before/after digest discipline → evidence deposit and
   read-back (S5) → separate acceptance/admission acts (S6).

---

## 10. CAP-03 dependencies — DR-2, DR-3, DR-4r — blocking dispositions

Source of truth: IRR `IIPS_v3.0_CAP03_PREREQUISITE_RESOLUTION_AND_DECISION_REGISTER_2026-10-23.md`
(live-tip blob `5af2a264…`, record `IIPS-V3-CAP03-PREREQUISITE-RESOLUTION-2026-10-23-01`, master
tracker §16.93/§16.94), read-only. Its critical path is CAP03-P01…P12; the S1 identity naming is
**P02**, provisioning P04, and the DR determinations are **P05–P07**.

| Item | Current disposition (live evidence) | Blocks S1 identity resolution? | Blocks Gate A′ provisioning? | Blocks H-12 adoption? | Blocks Gate 4 QE? | Blocks Gate 5? |
|---|---|---|---|---|---|---|
| **DR-2** G2 read-contract gap (7 missing fields + 3 renames; `isSaved` lifecycle; mapping authorization) | **UNRESOLVED — PA decision (class 4).** Adapter honestly refuses (`UPSTREAM_UNAVAILABLE`); alternatives prepared, none chosen | **No** | **No** | **No** (manifest is repository-content hashing, independent of the G2 wire contract) | Bounds it: per Gate 4 §5/ordering rule 3, affected QE read-backs are PASS only if implemented at the frozen pin, else recorded as **limitation findings** under the adopted Q4 three-tier mechanism — never silent passes | **Yes** — "Gate 5 cannot admit any read pair" while open |
| **DR-3** `durability`/`durable` on `PortfolioDetail` | **UNRESOLVED — PA decision; not blocking bounded implementation.** Interim position: keep absent; no `durable:true` before result acceptance; `durable:false` would be a false statement about a SQLite store | **No** | **No** | **No** | QE-4 carries the fixed measurement/claim split (D-10); no durability *claim** | **Yes** for a full-conformance/claim at acceptance (P10) |
| **DR-4r** `G2Contribution` compatibility | **Split.** IPD schema half **CLOSED** by effective migration `004` (`6bad5a50…`, six nullable provenance columns, historical NULLs retained). CAP-03 consumer half **UNRESOLVED**: non-null G2 fields + `holdingsCount`/`totalMarketValue` vs nullable IPD projection; decide mapping policy or scope contributions out | **No** | **No** | **No** | QE-6 scope is undefined until decided; runnable as a scoped/limitation item once the PA chooses | **Yes** for honest `portfolio.get` contribution mapping |
| **DR-1** successor provisioning basis (for completeness) | **Now EFFECTIVE** — the successor Gate A′ act (PR #67) and entrypoint (PR #68) discharged it. The capability-matrix O-01 text still saying "PROPOSED — NOT EFFECTIVE" is a preserved point-in-time (2026-10-23) statement, not a live conflict; the tracker's current rows and the act itself are authoritative. | n/a | n/a | n/a | n/a | n/a |

**Explicit finding.** None of DR-2/DR-3/DR-4r blocks S1 identity resolution, Gate A′ provisioning or
H-12 manifest regeneration/adoption. They are post-provisioning contract determinations (P05–P07) that
shape what the Gate 4 run can prove (PASS vs limitation) and gate Gate 5 read admission. The single
blocker of S1 is the missing PA identity-value determination (§5–§6); the single blocker of host
execution is the unreachable designated host plus its Node-runtime precondition. No schema change,
migration, operational write or persistence claim is made here; all no-copy and no-unsupported-write
prohibitions are preserved.

---

## 11. Documentary contradictions considered and reconciled

| # | Apparent contradiction | Reconciliation (no effective act edited) |
|---|---|---|
| 1 | Gate 4 act §8 literally says "33 mandatory IPD paths"; amendment says 32 | The amendment (EFFECTIVE) provides that §8 is **read as amended** (its §3.3) while the act body stays byte-identical (blob `66b56fd1…` unchanged, verified). No conflict remains in the effective requirement; R1's stop and R2's pre-amendment wording are correctly preserved history. |
| 2 | Capability matrix O-01: DR-1 successor act "PROPOSED — NOT EFFECTIVE" | Point-in-time text at 2026-10-23; the successor act has since been rendered EFFECTIVE (PR #67) and implemented (PR #68). The matrix is an assessment artifact and is not rewritten; the tracker and the act itself govern current state. |
| 3 | R2 manifest pins `a52b47b0…` while `main` is at `5e4e54d…` | Not a content conflict: 18 intervening commits are documentation-only; all manifest source blobs and dist bytes verify identical at the tip (§12). It remains an adoption-process gap requiring regeneration at the future final execution commit (§9), not a hash failure. |
| 4 | Historical host Node v24.14.0 vs required `>=22.13.0 <23` | The v24 measurement is recorded but ineligible as preflight; the runtime policy is fixed and no install/switch is authorized. Host Node 22 availability is an open operator precondition, not something this sandbox can satisfy. |
| 5 | Older tracker sections cite 875 tests; current run reports 892 | Point-in-time counts at earlier commits; the guarded suite grew with the authorized Limb A/Gate A′ tests. The current authoritative count is measured in §12.1 (892/891/0/1). |
| 6 | IRR live tip (`4d14780f…`) vs designated consumer pin (`4740ba21…`) | Reconciled: pin is an ancestor; drift is one documentation file; all 27 manifest entries are byte-identical at both. The pin stands; no re-pin is warranted or performed (IRR read-only). |

---

## 12. Non-mutating verification executed this pass — exact results

All commands ran on Linux Node `v22.22.3` against the checked-out `5e4e54d…` tree. Nothing here is host
qualification, QE, provisioning or an adoption.

### 12.1 Build and guarded suite

| Check | Command | Result |
|---|---|---|
| Dependency install | `npm ci --no-audit --no-fund` | exit 0 |
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npm run build` (tsc + vite + both package builds) | exit 0; only the pre-existing >500 kB chunk advisory; emitted **1,140** `dist/**` files |
| Full guarded suite | `npm test` (`scripts/run-tests.mjs`) | exit 0 — **892 tests, 891 pass, 0 fail, 1 skipped, 123 suites**; `[test-guard] OK — 892 test(s) executed, 891 passed, exit 0` (matches the amendment VM-11 count) |
| Package consumer | `npm run test:package-consumer` | `"result": "PASS"`, tarball shasum `cc2aa70186b8fd7bc7255452ac8d8b00d094f53e`, `durability: "SESSION_ONLY"`, `durable: false` (matches VM-12) |
| Focused Gate A′ | `node --test dist/tests/g3_gate_a_prime_successor_provisioning.test.js` | **7/7 pass, 0 fail** |
| Focused Limb A parser | `node --test dist/tests/g4_run_tests_summary_parsing.test.js` | **10/10 pass, 0 fail** |
| Write gate + startup | `node --test dist/tests/g3_write_gate.test.js dist/tests/g3_startup_validation.test.js` | **29/29 pass, 0 fail** |

### 12.2 Dist determinism against R2 `runtime_dist_set`

Fresh build vs the manifest's 1,140 recorded `(sha256, byte_length)` pairs: **missing 0, extra 0,
mismatched 0 — 1,140/1,140 byte-identical** (independently recomputed, not copied).

### 12.3 Cross-repository manifest integrity

- IPD: all **50** R2 paths (32 core entries + 1 conditional + 7 post-G3 + 10 anchors) resolve at
  `origin/main` to their recorded blob SHA-1 — 0 mismatches.
- IRR: all **27** R2 IRR entries (24 consumer + 3 criteria) resolve at both `4740ba21…` and live
  `4d14780f…` to their recorded blobs — 0 mismatches; drift limited to one tracker document.
- The 12 Gate A′ designated blobs and the four migration blobs match at the current tip (§7.3).

### 12.4 Inert-entrypoint and refusal probes (zero files created, zero rows)

| Probe | Observed result |
|---|---|
| Compiled constants | `PRINCIPAL_LABEL = TENANT_ID = CANONICAL_OWNER_ID = null`; act id/basis commit/tree equal the act |
| `--mode=execute` with any args while constants null | stderr `{"ok":false,"code":"IDENTITY_VALUES_UNRESOLVED","error":"the compiled identity constants are null; provisioning execution is not authorized"}`, exit 1; **no store file created** |
| `GATE_A_PRIME_TENANT_ID` set in env | `ENVIRONMENT_VALUES_NOT_AUTHORIZED`, exit 1 (T-3 shape) |
| Wrong `--act-id` | `ACT_ID_MISMATCH`, exit 1 (T-1 shape) |
| `--mode=validate` on a non-existent path | fail-closed `UNEXPECTED_FAILURE: the validation store file does not exist`; nothing created |
| `--mode=validate` on an empty temp SQLite file | read-only report `status: FAIL`, V-A2-1 `no such table: _migration_ledger`, STORE_SCHEMA failure; bindings/memberships/audit all 0; file untouched, then deleted by the probe |
| Write guard | `evaluatePortSaveGuard()` → `{authorized:false, reasons:['W-1(3): Gate 4 qualification not accepted','W-1(4): Gate 5 admission not accepted']}`; shipped UI adapter remains `SESSION_ONLY` / `durable:false` |
| Host reachability | `ping desktop-no0nhtp` → "Name or service not known"; no DNS resolution (fresh reproduction) |

### 12.5 Identity-value census (negative evidence)

`git grep` across the full IPD tree and the read-only IRR tree, plus direct XML inspection of the
`.docx` specification and `.xlsx` workbook, located no value for any of the three fields beyond the
four rejected candidate classes (§4); no rendered S1 identity-value act exists in either repository.

### 12.6 Identifier census for this record

The string `IIPS-V3-CAP02-S1-IDENTITY-AUTHORITY-H12-READINESS-DECISION-REQUEST-2026-10-24-01` and the
filename `IIPS_V3_CAP02_S1_IDENTITY_VALUE_AUTHORITY_H12_READINESS_DECISION_REQUEST_2026-10-24.md`
returned **0** prior hits in IPD and IRR before this record; the ID is newly assigned to a
decision-request, not to an effective act.

### 12.7 Mutation accounting

IPD: this record added; the tracker append in the same publication. No `src/`, `tests/`, `scripts/`,
`frontend/`, `package*.json`, `tsconfig*`, `vite.config.ts`, `.github/`, migration or schema path
changed. IRR: zero mutations of any kind. No store, row, tenant, principal, owner, mapping or
credential was created; `WRITE_NOT_AUTHORIZED`, `SESSION_ONLY` and `durable:false` are unchanged.

---

## 13. Remaining blockers and the smallest next authorized action

**Blockers, in critical-path order.**

1. **S1 identity-value determination (PA-only)** naming `principal_label`, `tenantId`,
   `canonicalOwnerId` verbatim with provenance (§6) — the sole unblock for provisioning; nothing an
   agent can do substitutes for it.
2. **Binding commit** setting the three compiled constants under the existing four-path file set, with
   T-1…T-9 green and remote read-back.
3. **H-12 regeneration + full revalidation** at the resulting final execution commit under amended
   §8 (32/24/56), then the **separate express PA H-12 adoption act**.
4. **Host availability and preflight** on `desktop-no0nhtp` (win32, non-elevated, Node
   `>=22.13.0 <23`, flag-free `node:sqlite`, clean trees), including a Node-22 runtime that currently
   is not evidenced on the host.
5. **Single P-1 provisioning** with V-A2-1…V-A2-8 receipt, then native-Windows canonical `npm test`,
   then QE-1…QE-11 under the tier rules with DR-2/DR-3/DR-4r limitations recorded honestly.
6. Separate Gate C / Gate 4 result-acceptance and Gate 5 admission acts (with DR-2/DR-3/DR-4r
   dispositions) before any fence lift or write.

**Smallest next authorized action.** For the **Program Authority**: render the S1 identity-value
determination specified in §6 (a documentation act; it requires no code change to author). For
**preparation under the standing grant** (any session, no new authority): keep the entrypoint inert,
keep the evidence current, and — once the determination exists — prepare the binding commit and the
H-12 regeneration as candidates for the normal PR/CI/read-back workflow. This pass has taken
everything up to that authority boundary and no further dependent operation is honestly available
without crossing it.

---

## 14. Non-grants and attestation

This record grants and claims **none** of the following: any identity value, label, tenant, owner or
mapping; any provisioning, store, row, audit event or binding; any host contact, preflight or QE
execution; any H-12 adoption; any Gate A′ execution authorization beyond the already-effective
basis/entrypoint; any Gate 4 qualification, result acceptance, Gate C acceptance or Gate 5 admission;
any operational/durable write, W-1 change, `durable:true` claim or `503` lift; any IRR mutation; any
schema, migration, source, test, script, CI or package change; any promotion of an off-`main`
lineage; any runtime installation; or any equivalence between an IRR identifier and an IPD principal.

| Claim | Value |
|---|---|
| PA determination rendered by this record | **NO** — decision-ready request only |
| Any identity value selected, derived, copied, defaulted or fabricated | **NO** — all three recorded UNRESOLVED — AUTHORITY REQUIRED with every candidate rejected on the record |
| Provisioning executed / store or row created | **NO / NO / NO**; inert refusal empirically reproduced |
| H-12 adopted | **NO — NOT ADOPTED**; content verified against the amended membership |
| QE item executed | **NO — 0 of 11** |
| Host contacted or Windows evidence claimed | **NO** — host unreachable; Linux-only repository evidence |
| Source, test, runner, CI, package, schema or migration changed | **NO** — additive documentation only |
| IRR modified | **NO** — strictly read-only |
| W-1 / `SESSION_ONLY` / `durable:false` changed | **NO** — re-verified operative |
| Handwritten signature, approval number or third-party attestation claimed | **NO** |

*End of `IIPS-V3-CAP02-S1-IDENTITY-AUTHORITY-H12-READINESS-DECISION-REQUEST-2026-10-24-01`. It is
PROPOSED — NOT EFFECTIVE and authorizes nothing. The furthest evidence-supported state is: membership
amendment effective and byte-verified; all three S1 identity fields UNRESOLVED — AUTHORITY REQUIRED;
Gate A′ provisioning NOT AUTHORIZED; H-12 NOT ADOPTED; QE 0/11; every fence unchanged.*
