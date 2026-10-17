# IIPS v3.0 — G-2: **GATE A′ — WINDOWS DEPLOYMENT-HOST STORE PROVISIONING — AUTHORITY REQUEST**

> ## STATUS: **PROPOSED — NOT YET AUTHORIZED — NOT A PA DECISION**
> This artifact **requests** a disposition. It **records none**. It authorizes nothing, provisioned
> nothing, opened nothing, and executed nothing. **No store exists on the Windows host.** The
> Authority's rendering is the only thing that can turn this document into authority, and no such
> rendering has been supplied.

| Field | Value |
|---|---|
| **Request identifier** | `IIPS-V3-G2-IPD-GATE-A-PRIME-WINDOWS-STORE-PROVISIONING-AUTHORITY-REQUEST-2026-10-17-01` |
| **Act type** | AUTHORITY-REQUEST (preparation only — **NOT** an authority act, **NOT** a provisioning act, **NOT** an implementation, **NOT** a qualification, **NOT** a merge) |
| **Prepared by** | Arena (Recording Agent only) under the operating-session direction of the Program Authority; **rendered by no authority** |
| **Decision-maker required** | **Ramki — Program Authority**, acting as the **IPD security-contract authority** for `ramkivs/iips-production-market-data` (the capacity that rendered the original Gate A decision) |
| **Governing standards** | AD-01..AD-18 / AD-CHARTER-2026-01 · Execution mode **NON_PRODUCTION** |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (the existing authorized **PR #8** workstream, open, unmerged) |
| **Predecessor act (spent)** | `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01` — **executed once**, `GATE A — PROVISIONED / VALIDATED`, store `/home/user/gate-a-store/ipd-portfolio.sqlite` (**absent**) |
| **Gate C dependency** | `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-AUTHORITY-2026-10-17-01` — Q1–Q4, Q9–Q11 **granted**; every fixture requires a provisioned store |
| **Recorded at** | 2026-10-17 (Asia/Calcutta) |
| **Production status** | NON_PRODUCTION — one user, one personal laptop, H-18 scope |

---

## 0. ANTECEDENT STATE — VERIFIED THIS ROUND (read-only)

| # | Fact | Verified value |
|---|---|---|
| 0.1 | IPD `main` | `e040002a85097050720748af4e2cace06842700c`, tree `1a29f56737b375e80bd281738391c65a71d16ffc` |
| 0.2 | PR #8 | **OPEN, unmerged** — head `c9c80a3be33830bd21bb12bdef4700d126f701a2`, 39 files, +13 595/−62, 44 commits, `MERGEABLE`/`CLEAN`; CI run `39041587902` success, **556 executed / 0 failed** |
| 0.3 | Gate A derivative basis | `refs/heads/gate-a/local-principal-enablement-2026-10-16` @ `2ded0e981407b38c73bdea164153f53856aa7217`, **tree `9069045d3daf22156020188696fc2f9c2f32bf27`**; parent `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` (tree `eb07ea36…`) |
| 0.4 | Gate B basis | `refs/heads/gate-b/local-principal-ipc-implementation` @ `cec7080252183a6a5332efe351e61c254d342a2d`, tree `22a7438bc41e5b9853700c5a3737702898da8c53`; `src/persistence`, `src/gate_a`, `src/app_identity` **byte-identical** to 0.3 (`git diff --stat` empty) |
| 0.5 | Gate A act | `PROVISIONED / VALIDATED`, **one-time and spent**; store `/home/user/gate-a-store/ipd-portfolio.sqlite` — **an Arena sandbox path, now absent** |
| 0.6 | Tenant authority | **Tenant administration = NOT AUTHORIZED**; **Tenant-admin authorization = NOT AUTHORIZED** — `NP04-GOVERNANCE-AUTHORITY-RECORD.md` §5.1 (G31/D115), commit `6828155` |
| 0.7 | Gate C act | `RENDERED — D-GC = ACCEPT AT THE BOUNDED READ-ONLY SUBSET`; its approved harness pattern requires a **disposable copy of the provisioned store** and authorizes **no** repository change and **no** provisioning |
| 0.8 | Tags / pins | **4 tags**, none at any Gate A/B/C object; NP-04 pin `2e11fa3b` untouched; G24 lineage `6828155e` untouched |
| 0.9 | Store on the Windows host | **None.** The Gate V run there used a disposable pipe probe — no store, no principal, no binding |

---

## 1. WHY A NEW ACT IS REQUIRED — AND WHY REUSE IS IMPOSSIBLE

1. **The Gate A authority was consumed.** The rendered Gate A decision authorized **one** provisioning act, executed **once**, offline. The Gate A request states the rule that governs this situation verbatim: *"after revocation, re-provisioning requires a **new explicit act**"* (§2.5), and §8.2 records that approval would **not** *"create any standing provisioning capability"*.
2. **The Gate A artifact is gone, not recoverable.** `/home/user/gate-a-store/ipd-portfolio.sqlite` was created inside an **ephemeral Arena sandbox**. The execution record preserves the **pre-provision backup's** sha256 (`b100eb7a…`), and that backup contains **zero provisioned rows** by construction. Nothing on the Windows host derives from it.
3. **Gate C assumes a store; it does not create one.** The act's approved fixture rule is *"a disposable copy of the provisioned SQLite file"* (D-GC-I). There is no reading under which Gate C's own authority permits creating the source store.
4. **The tenant authority has not changed.** `Tenant administration = NOT AUTHORIZED` remains the recorded status. Only a new, bounded, explicitly rendered act can carve the single exception — exactly as Gate A did.

**Conclusion.** A second, bounded provisioning act — **Gate A′** — is the only lawful route to a store on the deployment host. No existing record may be reused, stretched, or re-executed, and this document does not do so.

---

## 2. WHAT IS GROUNDED, AND WHAT IS NOT

| Field | Status | Basis | Who must supply it |
|---|---|---|---|
| **Repository** | **GROUNDED** | `ramkivs/iips-production-market-data` — the only IPD remote | — |
| **Authoritative remote refs** | **GROUNDED** | §0.3 basis; §0.4 Gate C pin | — |
| **Provisioning basis (code)** | **GROUNDED** | `gate-a/local-principal-enablement-2026-10-16` @ `2ded0e9`, tree `9069045d…` — published and remotely verifiable; contains migration `003`, the A-3 table, `src/gate_a/provision.ts` and `src/gate_a/validate.ts` | — |
| **Schema target** | **GROUNDED** | migrations `001`, `002`, `003`; `SCHEMA_VERSION_TARGET = '003'` | — |
| **Host (machine)** | **IDENTIFIED, NOT PROVISIONING-DESIGNATED** | D-GC-F designates *the Windows laptop* as the **qualification host**; the Gate V record identifies it concretely (§3.1). No record names it as the **provisioning** host | The **act** must name it; the Authority renders |
| **Host (account / privilege)** | **GROUNDED** | one ordinary operator account, **not elevated** (Gate V; D-GC-F) | — |
| **Store path** | **NOT GROUNDED — UNRESOLVED** | **No record in the repository selects, proposes or fixes a Windows store path.** The Gate A act itself did **not** name its path: it authorized *"a local store created at execution via `IPD_PORTFOLIO_DB_PATH` (absolute path required)"*, and the operator's choice was recorded **after the fact**. `C:\iips-gq` in the Gate C readiness package is the **package work root**, not a store path, and carries no authority | Rule **P-1** (§4.3), or a path named by the Authority |
| **Operator** | **GROUNDED** | the Program Authority, on their own laptop, offline, non-elevated | — |

### 2.1 The precise missing input

> **The absolute store path is the one field this proposal cannot fill from evidence.** Every
> candidate would be the Recording Agent's own invention. The missing authoritative input is a
> single line from the Authority: either an absolute path, or an explicit adoption of rule **P-1**.

---

## 3. HOST

### 3.1 The identified machine (Gate V evidence, recorded as reported by the operator)

| Item | Value |
|---|---|
| Machine | `desktop-no0nhtp` |
| OS | Windows 11 **Home Single Language**, build **26200**, 64-bit |
| Account | `desktop-no0nhtp\user`, SID `S-1-5-21-1872737340-673410177-2240931581-1001`, **not elevated** |
| Node | `C:\Program Files\nodejs\node.exe`, **v24.14.0** (libuv 1.51.0) |
| Node evidence status | Gate V facts; **not** re-measured by this record |

### 3.2 What D-GC-F does and does not do

D-GC-F designates the Windows laptop as the **qualification host** and classifies POSIX evidence as
non-qualifying. It does **not** designate a provisioning host, and it does **not** authorize any
write on that machine. Gate A′ therefore must carry its own host term. If the machine used for Gate
A′ is not the machine of §3.1, this act does not carry over and a new rendering is required.

---

## 4. THE PROVISIONING OPERATION — EXACT, MINIMAL, PUBLISHED

### 4.1 Basis and tooling (all committed; nothing new is written)

| Item | Value |
|---|---|
| Basis ref | `refs/heads/gate-a/local-principal-enablement-2026-10-16` |
| Basis commit | `2ded0e981407b38c73bdea164153f53856aa7217` |
| Basis tree (must verify) | `9069045d3daf22156020188696fc2f9c2f32bf27` |
| Migration 003 | `src/persistence/migrations/003_local_principal_bindings.ts` — blob `9ba884acc3c554c839a32ca41d0d16bda7e64690` |
| Provisioning tool | `src/gate_a/provision.ts` — blob `b6f780f63278d333fd38c66e1abd2f3b64dcc2ea` |
| Validation tool | `src/gate_a/validate.ts` — blob `550b9f4b83983d5d57aa29f565f371e5bcbed430` |
| Binding service | `src/app_identity/local_principal.ts` — blob `710a47e22e5afc99c1744e11926719fc8356f20a` |
| Emitted tool | `dist/src/gate_a/provision.js` — sha256 `5a4da3b1bba57e901606ad5da22f8d3a27cdfc9ab0fb0f92c4dfe52a638cbae1` (POSIX emit at the basis; **the host must record its own**) |

**No file is added to the repository by Gate A′.** The tool is already published; the act executes it.

### 4.2 The single command

```powershell
# from a clean checkout of 2ded0e9 (tree 9069045d…), after `npm ci` and `npx tsc`
$env:IPD_PORTFOLIO_DB_PATH = '<ABSOLUTE STORE PATH>'      # per §2 / rule P-1
node .\dist\src\gate_a\provision.js --execute `
  --actor=operator:gate-a-prime-windows-provisioning `
  --context=IIPS-V3-G2-IPD-GATE-A-PRIME-PA-DECISION-2026-10-17-01 `
  --basis-ref=refs/heads/gate-a/local-principal-enablement-2026-10-16 `
  --basis-commit=2ded0e981407b38c73bdea164153f53856aa7217 `
  --basis-tree=9069045d3daf22156020188696fc2f9c2f32bf27
```

The tool prints **one JSON act record** to stdout and exits `0` only when its single transaction
committed **and** the post-state was read back. It applies the migrations, then writes a
same-directory backup **before any row insert**, and restores that backup over the store on any
failure.

`--context` is the **identifier the rendered act will carry**; the placeholder shown must be replaced
with the rendered decision's identifier before execution, and the executed record must quote the
identifier actually used.

**Expected build condition (recorded, not waived).** At the basis, `npx tsc` exits **2** with the
**four pre-existing test-file diagnostics** and still emits `dist/src/gate_a/provision.js`
(verified this round on `2ded0e9`). The operator must record the verbatim build output and exit code.
**If any diagnostic other than those four appears, the tool build is not usable → STOP.** Whether
Gate C's build prerequisite §4.7(4) is satisfied is a **separate** question, addressed in
`IIPS-V3-G2-IPD-GATE-C-BUILD-PREREQUISITE-ACCEPTANCE-REQUEST-2026-10-17-01`; **this act neither
waives nor interprets it**.

### 4.3 Rule P-1 — admissible store path (only if the Authority does not name one)

| # | Constraint |
|---|---|
| P-1.1 | **Absolute** path; the parent directory already exists (creating a directory is not provisioning) |
| P-1.2 | **Outside the repository** and outside any Git working tree (Gate C's copy rule, D-GC-I) |
| P-1.3 | Local fixed **NTFS** volume; **not** a network share, mapped drive, removable media, OneDrive/Dropbox-synced folder, or `%TEMP%` |
| P-1.4 | Writable by the **operator account only**; no elevation; no service account |
| P-1.5 | The **file must not exist** at execution. If it exists → **STOP** and report; the act does **not** overwrite, merge into, or repair a pre-existing store |
| P-1.6 | The chosen path is recorded **verbatim** in the executed record before any subsequent step |

### 4.4 What the act creates — exhaustive and minimal

| # | Object | Cardinality | Value rule |
|---|---|---|---|
| 1 | store file | 1 | created by the tool at `IPD_PORTFOLIO_DB_PATH`; `journalMode = DELETE`, `synchronous = FULL`, foreign keys enforced |
| 2 | migrations `001`,`002`,`003` | ledger rows 3 | existing published SQL; `001`/`002` **never edited**; schema version `003` |
| 3 | `application_users` | **exactly 1** | UUIDv4 generated by `crypto.randomUUID()` at execution; `status='ACTIVE'`; **never derived** from hostname, account, email, `companyId`, issuer or subject |
| 4 | `tenant_memberships` | **exactly 1** | `tenant_id = "t-" + lowercase(UUIDv4)`; `state='ACTIVE'`; opaque; no semantics |
| 5 | `local_principal_bindings` | **exactly 1** | `endpoint_id = "ep-" + lowercase(UUIDv4)`; `state='ACTIVE'`; FK → the row of (3); tenant matches (4) |
| 6 | `local_principal_audit_events` | **exactly 2** | `MEMBERSHIP_CREATED`, `BINDING_CREATED`; same transaction as their mutations; `actor` / `context` as supplied |

**No other row, table, column, index, view, trigger, or file may be created.** No `user_portfolios`,
no portfolio or revision row, no `external_identity_mappings`, no credential, no OIDC artefact.

---

## 5. FIXTURE DEPENDENCY — WHAT THIS UNBLOCKS

| Fixture | Built from | Depends on Gate A′ | Checks unlocked |
|---|---|---|---|
| **C-E** | untouched copy of the provisioned store | **yes** | Q2/S4 (control), Q9, Q10 runtime |
| **C-B** | C-E + one-way binding revocation | **yes** | Q2/S2, Q4(d) |
| **C-D** | C-E + `DROP TABLE local_principal_bindings` (ledger still `003`) | **yes** | Q2/S3 |
| **C-A** | C-E + three portfolio rows seeded **in the copy** | **yes** | Q3, Q4(a)(b)(c), Q1 |
| **C-C** | C-A + a second bound principal | **yes** | Q4(e) |

Q11 needs **no** store. Q2/S1 needs **no** store. Every other authorized check does. On a completed,
validated Gate A′, **all seven** authorized checks become executable (subject to the separate build
decision).

---

## 6. OWNERSHIP, SCOPE, BACKUP, INTEGRITY, CLEANUP

| Dimension | Rule |
|---|---|
| **Ownership** | the store file, its backup and its directory belong to the **operator account**; no elevation, no ACL change is authorized by this act |
| **Tenant scope** | exactly one opaque `t-…` tenant, one membership. This is **not** a tenant register, **not** a directory, **not** tenant administration, and confers no restoration, role, or lifecycle capability (NP04 §5.1 preserved) |
| **Pre-run backup** | the tool writes one same-directory copy **after** migration and **before** any row insert; path + sha256 recorded; on any failure it is restored over the store |
| **Atomicity** | all writes in **one** `immediateTransaction`; a failure leaves **no partial state** |
| **Integrity evidence** | pre-run `storeExisted=false`; post-run file sha256 + size; table counts for every table; the exact three rows; the two audit rows with `seq`; migration ledger `001`–`003` with checksums; `schemaVersion='003'` |
| **Absence evidence** | `external_identity_mappings` = 0; `user_portfolios` = 0; portfolio/revision rows = 0; any other user/membership/binding = 0 |
| **Cleanup** | **not authorized as part of the act.** The store is the **source** for Gate C's disposable copies; deleting it is a separate decision. Gate C copies are discarded by Gate C's own rule, not by this act |
| **Destructive actions** | **none authorized** — no `DROP`, no overwrite of an existing file, no deletion of any pre-existing data, no format/repair, no un-revoke |

---

## 7. VALIDATION AND ROLLBACK

The **Gate A validation set V-A1…V-A8 is re-used verbatim** (Gate A request §7); it is not replaced,
weakened or extended here. In summary: schema/ledger `001`–`003`; exactly one `ACTIVE` user;
exactly one `ACTIVE` membership; exactly one `ACTIVE` binding with correct FK and tenant; the two
audit rows in `seq` order; all absences zero; `resolveTenant` returns exactly the provisioned tenant
and any other/absent id fails **indistinguishably** from "not found"; and the invariants of §0
(`main` unmoved, PR #8 unmerged, tags unchanged, G24 untouched).

| Outcome | Effect |
|---|---|
| all criteria pass | record `GATE A′ — PROVISIONED / VALIDATED`; store becomes the Gate C copy source |
| any criterion fails | the tool's backup is restored over the store; record `GATE A′ — FAILED / ROLLED BACK`; **stop**; no manual repair, no partial retry |
| the file already existed at start | **do not execute**; record `NOT EXECUTED — PRE-EXISTING STORE` |
| any diagnostic beyond the four known ones at build | **do not execute**; report |

---

## 8. CONSUMPTION, EXPIRY, EVIDENCE

| Item | Term |
|---|---|
| **Consumption** | **one execution**, on **one** machine, at **one** path. Consumed on completion **whether it succeeds or fails** |
| **Re-attempt** | requires a **fresh** rendering; no re-run under this act |
| **Expiry** | the act lapses if not executed before the Gate C run it supports is abandoned, or if the basis commit, tree, or the four embedded blobs differ at execution time |
| **Evidence subject to publication** | the tool's **verbatim JSON act record**; the build log and exit code; the four diagnostics; the read-only validation output; the file hashes; the machine identity of §3.1; the exact command line |
| **Durability** | an **executed-act record** published additively in `evidence/np04/` on the existing PR #8 workstream, committed, pushed, non-forced, and verified remotely (ref/commit/blob/sha256, read back) |
| **Where it is NOT recorded** | IRR (no write), any tag, any ref move, any tracker |

---

## 9. EXACT SCOPE — IN AND OUT

**In scope (exhaustive):** create one store at the path; apply migrations `001`–`003`; insert the six
objects of §4.4; run the V-A1…V-A8 validation; publish the executed record.

**Out of scope (exhaustive):** any IPC endpoint or server start; any Gate C probe, fixture, or
check; any store **copy**; any portfolio or `user_portfolios` row; any `external_identity_mappings`
row; any credential/issuer/OIDC artefact; tenant administration, lifecycle, restoration or audit
expansion; any second user, tenant, membership or binding; any repository file change; any
promotion, merge, cherry-pick or re-pin of the G24 lineage or of `2ded0e9`; any movement of `main`,
`gate-a`, `gate-b`, `np04`; any tag; PR #8 merge; Gates B/C/D/E; production use; any IRR write.

---

## 10. RISKS

| # | Risk | Disclosure |
|---|---|---|
| R-1 | **Repeated authority gap** | Tenant provisioning is still `NOT AUTHORIZED`; this request is the enabling instrument for **one** act and confers **no standing capability** |
| R-2 | **"Second store" misreading** | Gate A′ creates the **only** store for the Gate C copies; it creates no parallel runtime store. Gate C's copies remain disposable and are discarded |
| R-3 | **Path ambiguity** | The path is the one unresolved field; rule P-1 constrains it but does not choose it |
| R-4 | **Native module on Windows** | `better-sqlite3@13.0.3` must install on the host; a `node-gyp`/prebuild failure blocks the act and is recorded, not worked around |
| R-5 | **Build exit 2** | The tool build shares the four pre-existing test-file diagnostics; a **fifth** diagnostic is a stop condition |
| R-6 | **Credential exposure** | none: no credential, token, secret or external identity is created or required |
| R-7 | **Irreversibility** | provisioning is transactional; a failure restores the backup; there is no un-revoke and no silent re-provision |
| R-8 | **Non-production boundary** | no production, operability, admission, or qualification claim arises from Gate A′ |

---

## 11. THE DECISION SOUGHT

### 11.1 Verbatim-quotable wording (for the Authority; not a decision, and not to be rendered by any agent)

> I, Ramki, as Program Authority and IPD security-contract authority, decide on
> `IIPS-V3-G2-IPD-GATE-A-PRIME-WINDOWS-STORE-PROVISIONING-AUTHORITY-REQUEST-2026-10-17-01`, for
> **one user, one personal laptop, non-production**: **APPROVE / APPROVE WITH CHANGES / REJECT /
> DEFER** one Gate A′ provisioning act — on the Windows deployment host identified in §3.1, at the
> absolute store path **`<PATH>`** *(or: under rule P-1, with the path selected by the operator and
> recorded before use)* — executed from the published basis
> `refs/heads/gate-a/local-principal-enablement-2026-10-16` @ `2ded0e9…`, tree `9069045d…`, creating
> **exactly** one `application_users` row, one `ACTIVE` `tenant_memberships` row, one `ACTIVE`
> `local_principal_bindings` row and their two A-3 audit rows, applying migrations `001`–`003`,
> validated by V-A1…V-A8 and evidenced per §8 — **executed once, offline, non-elevated**.
> I record that Gate A′ grants **no** endpoint, **no** Gate C execution or acceptance, **no**
> fixture, **no** portfolio write, **no** tenant administration beyond the single row set, **no**
> standing provisioning capability, **no** ref or tag change, **no** promotion of the G24 lineage
> or of `2ded0e9`, **no** PR #8 merge, and **no** production authority; and that it does **not**
> resolve Gate C's build prerequisite, which remains a separate decision.

### 11.2 What approval would and would not do

| Would | Would not |
|---|---|
| Create the one store Gate C's fixtures are copied from | Create any standing provisioning capability |
| Unblock Q1, Q2/S2–S4, Q3, Q4, Q9, Q10-runtime | Execute or accept any Gate C check |
| Permit the six §4.4 objects to exist on that host | Permit a portfolio write, a route admission, or a second principal |
| Require validation, backup, rollback and durable evidence | Waive build §4.7(4), or move any ref, tag, or PR |

---

## 12. WHAT THIS ARTIFACT DOES NOT DO

It does not provision, open, copy, validate or hash any store; it does not start any endpoint; it
does not create a fixture; it does not name a path that no authority has named; it does not render,
approve, or imply approval of itself; it does not modify any other record; and it does not advance
Gate C's build prerequisite, which is addressed separately.
