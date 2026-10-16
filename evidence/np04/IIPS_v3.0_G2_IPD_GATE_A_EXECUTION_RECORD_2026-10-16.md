# IIPS v3.0 — G-2: **GATE A — EXECUTION RECORD** (local principal provisioning)

> ## STATUS: **`GATE A — PROVISIONED / VALIDATED`**
> The already-rendered Gate A decision has been **executed once, locally and offline**, against the
> designated basis, after the decision's execution prerequisite (IRR DP-1 amendment effective on
> authoritative IRR `main` and independently verified) was satisfied. Exactly one
> `application_users` row, one `tenant_memberships` row, one `local_principal_bindings` row and
> their A-3 audit rows exist — on the local store named below and nowhere else.

| Field | Value |
|---|---|
| **Act identifier** | `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01` (rendered decision) — **executed** |
| **Artifact type** | **Executed-act record** (scope, evidence, disposition) — recording only; no authority rendered here |
| **Authority chain** | Accepted contract `L-IPC-1` rev 2 → Gate A request `IIPS-V3-G2-GATE-A-LOCAL-PROVISIONING-AUTHORITY-REQUEST-2026-10-16-01` → rendered decision (blob `08df3b9eb98264e50464f848a96104883f3c624b`) |
| **Execution mode** | NON_PRODUCTION · offline · operator-run · **one-time** |
| **Executor** | `operator:gate-a-local-provisioning` (operator tooling `src/gate_a/provision.ts`; Recording Agent prepared and recorded — it did not provision by itself) |
| **Disposition** | **`GATE A — PROVISIONED / VALIDATED`** |
| **Raw evidence companion** | `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_EXECUTION_RAW_EVIDENCE_2026-10-16.md` (verbatim outputs) |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream) |

---

## 1. PREREQUISITES — RE-VERIFIED BEFORE ANY MUTATION (Phase 1)

Only the *changed* prerequisites were re-verified; no completed investigation was repeated.

| # | Prerequisite | Verified value |
|---|---|---|
| 1 | IPD PR #8 live head and operative provisions | **OPEN, unmerged**, head `f3ca83881fcdf67520433a0d6b3bbd216d76aa2e`, 15 files; request blob `511d35a1b734906d5e2506e07715a40bf986c565`; rendered decision blob `08df3b9eb98264e50464f848a96104883f3c624b`; draft blob `63837ae05b71856e41af6b66633bf0d5279c55fa` — all unchanged; local copies byte-identical (`cmp`) |
| 2 | **IRR DP-1 amendment effective on authoritative IRR `main`** (decision 2) | **SATISFIED AND INDEPENDENTLY VERIFIED** — IRR `main` = `10584439f33dfa9192955c3f74879f20ccaf111e`, the expected merge commit (`Merge pull request #118 …`); IRR PR #118 **MERGED** 2026-10-16T17:52:23Z, head `7a07dc37490cfde8c250efedd09a26f28d91e726`; the amendment `docs/integration/IIPS_v3.0_G2_IRR_DP1_IDENTITY_CREDENTIAL_TRUST_AMENDMENT_2026-10-16.md` present on `main` (blob `c71661a1ee445b2348cedfedae4aef6449029ebb`, 17,128 bytes) — byte-identical to the artifact merged from PR #118 |
| 3 | Execution basis is the exact accepted commit object (decision 1) | **UNCHANGED** — `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`, tree `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5`, parent `d4fdb33d…`; carrier `refs/heads/arena/01a0f308-iips-production-market-data` tip = that object; the tree-identical descendant `c1b955b…` was **not** substituted |
| 4 | All other conditions required by the rendered decision and the request | request §3.2 items (disposition ✓, named non-`main` basis ✓, local store via `IPD_PORTFOLIO_DB_PATH` ✓, operator offline ✓, IRR-side prerequisite ✓ satisfied by the merge, PR #8 unmerged ✓); §2.7 prohibitions (no edit of `001`/`002`; no schema beyond migration `003` + the A-3 table) ✓; DP-2 Option 2F, H-18, the 503 fence and all four Gate V waivers untouched ✓; `A-2/A-3 artefacts = 0` on every ref before the act ✓ |

No mandatory prerequisite was unsatisfied. **No authority was inferred and no decision was changed.**

---

## 2. WHAT WAS EXECUTED (Phase 2) — EXACTLY, AND ONLY, THE AUTHORIZED SCOPE

Executed against a local checkout of the **designated basis commit object**
`6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` (tree `eb07ea36…`), offline, once:

1. **A-2 enablement** — additive migration `003_local_principal_bindings` (one table + one index);
2. **A-3 enablement** — `local_principal_audit_events` + the four lifecycle event writes, each written in the **same transaction** as the mutation it audits;
3. **one** `application_users` row (UUIDv4, `ACTIVE`) via `IdentityService.createApplicationUser`;
4. **one** `tenant_memberships` row (`ACTIVE`, `t-<lowercase UUIDv4>` per rule **T1-r**) via `IdentityService.provisionTenantMembership`;
5. **one** `local_principal_bindings` row (`ACTIVE`, `ep-<lowercase UUIDv4>`);
6. one-way revocation **defined** (and demonstrated on disposable copies, §7);
7. validation of §2.7/§7 and the evidence of §2.8;
8. this durable execution record.

All Gate A writes were performed inside **one `immediateTransaction`** (each service call nests as a savepoint), after a **same-directory pre-run backup**. The concrete identifiers were generated **during** the act by `crypto.randomUUID()` — **not** derived from hostname, OS account, email, company ID, issuer, or subject.

**Store:** `/home/user/gate-a-store/ipd-portfolio.sqlite` — did **not exist** before the act (`preRun.storeExisted = false`); created and migrated by the act.
`journalMode = DELETE`, `synchronous = FULL`, foreign keys enforced (verified at connection open; FK failure behaviour rehearsed — §6).

---

## 3. PROVISIONED STATE — THE EXACT ROWS

| Element | Value |
|---|---|
| `application_user_id` | `4f423263-e85d-4133-9119-31832cb3e49d` (`ACTIVE`) |
| `tenant_id` | `t-1c568b7e-d883-4d85-a7f6-7433a490165a` (`ACTIVE`) |
| `endpoint_id` | `ep-4851658e-149c-4b3c-85e0-ae76e5dceacc` (`ACTIVE`, `revoked_at = NULL`) |
| Act timestamp (rows + audit) | `2026-10-16T18:04:30.449Z` (= 2026-10-16 23:34:30.449 IST, UTC+05:30) |
| Store file | size 143,360 B; sha256 `7794e28144f29cf8235d5537d076408867636e03e77de996c303676823ab99e3` **before and after all validation/rehearsal** |
| Pre-run backup | `/home/user/gate-a-store/ipd-portfolio.sqlite.pre-provision-backup-2026-10-16T18-04-30-447Z.sqlite`, sha256 `b100eb7a73193a71a33fadff16a93ee2b014ccdf6171b1c6c39c4ac415b95c18` |
| A-3 audit rows | `seq=1` `MEMBERSHIP_CREATED` (audit `19c4ec68-4691-4fe1-84dd-41c1330942b7`), `seq=2` `BINDING_CREATED` (audit `6d11ab97-a138-4fe7-b160-d472bc0b5632`); actor `operator:gate-a-local-provisioning`; context = this act id; ordered by `seq` |
| Migration ledger | `001` `initial_schema` checksum `496650b3…a95a7`; `002` `audit_event_sequence` `fbfe6aff…d6eb`; `003` `local_principal_bindings` `38ed6e1b…49aac`; **schema version `003`** |
| Absences | `external_identity_mappings` 0 · `user_portfolios` 0 · `portfolio_revisions` 0 · `portfolio_contributions` 0 · `portfolio_events` 0 · `portfolio_revision_holdings` 0 · no other user/membership/binding |

Verbatim JSON for every value above: raw evidence §1–§2.

---

## 4. THE A-2/A-3 CHANGES — PATHS AND COMMIT IDENTIFIERS

**Derivative branch (LOCAL):** `gate-a/local-principal-enablement-2026-10-16`
**Derivative commit:** `2ded0e981407b38c73bdea164153f53856aa7217` (parent = the designated basis object
`6828155…`; tree `9069045d3daf22156020188696fc2f9c2f32bf27`) — 10 files, **+1,572 / −19**.

| Path | Git blob SHA | sha256 |
|---|---|---|
| `src/persistence/migrations/003_local_principal_bindings.ts` | `9ba884acc3c554c839a32ca41d0d16bda7e64690` | `2ccdab47…117b5` |
| `src/app_identity/local_principal.ts` | `710a47e22e5afc99c1744e11926719fc8356f20a` | `e4646bd0…3f0ac` |
| `src/gate_a/provision.ts` (operator tooling) | `b6f780f63278d333fd38c66e1abd2f3b64dcc2ea` | `e7bfb06a…22150` |
| `src/gate_a/validate.ts` (read-only validator/rehearsals) | `550b9f4b83983d5d57aa29f565f371e5bcbed430` | `2b829118…79ff58` |
| `src/persistence/migrations/registry.ts` | `5d3ab64ae97ab5b6621d01775d4c69d4c0d3301e` | `05a56558…ab9381e` |
| `src/persistence/migrations/index.ts` | `92a7b613eda6c8f900b295b23245dd710f199d10` | `bbd6f701…40b48b46` |
| `src/app_identity/index.ts` | `0fcc7aa156fb17165bbc649d4fe181a3e00f2f06` | `105e5e66…92064a8` |
| `tests/g24_a_persistence_foundation.test.ts` | `68a2928832099d63960487e4905528fdfc0e5623` | `491e42aa…df131ac` |
| `tests/g24_b_migrations.test.ts` | `8395fcc9559677e5ae2990347f7d9d01e3131204` | `59cc406a…b4d6136` |
| `tests/g24_g_recovery.test.ts` | `86928951b83f9b6ffb37e182813a6055a2c24a96` | `268966f6…1a63b07` |

**Migrations `001` and `002` are byte-unchanged** vs the designated object (blobs
`48fcf4d9ef802c2d7e83a6a9411b275221bf6ca6` and `dfe9f027ebeb9a35d47c47d63634a2aec7261944` — identical
to the basis). The three test-file edits are **necessary, mechanical consequences** of appending
migration `003` (ledger/version expectations `002 → 003`; synthetic probe migration ids bumped
`003 → 004` so they cannot collide with the real `003`) — disclosed here explicitly.

**Corrective verification on the enabled tree:** `tsc` = the same **4 pre-existing errors**, 0 new;
g24 suite **84/84**; full suite **782/782**; `vite build` exit 0 — i.e. identical results to the
accepted Phase-A baseline. Raw evidence §5.

**Publication status of the derivative ref — STATED, NOT DECIDED:** the derivative branch is
**local-only** (not pushed; remote ref inventory unchanged: 34 heads / 4 tags / 9 pull refs). The
exact change is durably published **as evidence** in this workstream (raw evidence §5, including the
complete unified diff, sha256 `0f4f323a8b3237df7b3a0850c6095465aff3e95fd434a7fcc1eb5d9756869c1a`),
and the local branch is preserved as a git bundle (`/home/user/gate-a-store/gate-a-derivative-2ded0e9.bundle`,
sha256 `eeb7355358907fb28fa6789fc4a7b13ea8f9ea8ed5c07ef21bfc71b8a62be201`). Pushing the derivative
ref to the IPD remote is an **outstanding step** for the Program Authority, if required — it is not
performed, and no promotion/merge/cherry-pick/re-pin/admission is performed by this act.

---

## 5. VALIDATION RESULTS (Phase 3) — V-A1 … V-A8

| # | Criterion | Result | Evidence |
|---|---|---|---|
| V-A1 | Schema/ledger: `001`–`003` applied with checksums; schema version `003`; `001`/`002` unmodified | **PASS** | raw §2 `V-A1`; ledger checksums equal the computed checksums of the immutable registry; `001`/`002` blobs identical to the basis (§4) |
| V-A2 | Exactly one `application_users` row, `ACTIVE`, opaque UUIDv4 | **PASS** | raw §2 `V-A2` |
| V-A3 | Exactly one `ACTIVE` membership; `tenant_id` matches rule T1-r | **PASS** | raw §2 `V-A3` |
| V-A4 | Exactly one `ACTIVE` binding; FK → provisioned user; tenant matches; `ep-<uuidv4>` | **PASS** | raw §2 `V-A4` |
| V-A5 | Audit contains `BINDING_CREATED` + `MEMBERSHIP_CREATED` with actor/context/occurred_at, ordered by `seq` | **PASS** | raw §2 `V-A5`; same-transaction proven independently by the atomicity rehearsal (§6) |
| V-A6 | Absences: `external_identity_mappings` 0; portfolio rows 0; no other users/memberships/bindings | **PASS** | raw §2 `V-A6` |
| V-A7 | Fail-closed resolution: `resolveTenant` returns exactly the provisioned tenant; absent-id and wrong-tenant probes fail **indistinguishably** (`TENANT_MEMBERSHIP_MISSING`) | **PASS** | raw §2 `V-A7` |
| V-A8 | Invariants: IRR fence blobs unchanged; IPD `main` unmoved; PR #8 unmerged; no promotion/merge of the lineage | **PASS** | raw §4 (read-only API: fence `cb8db45d…` / `51704c12…`; IPD `main` `70b24f029842…`; PR #8 OPEN; carrier/target/governance/pin refs unchanged; ref inventory unchanged) |

**No criterion failed; no rollback was triggered.** The validation tooling performed **only reads**
— the store file sha256 is provably unchanged across the whole validation and rehearsal run
(`7794e281…` → `7794e281…`).

---

## 6. ROLLBACK, ATOMICITY AND FAIL-CLOSED EVIDENCE (disposable copies only)

| Evidence | Result |
|---|---|
| Pre-run backup + restore semantics | backup sha256 `b100eb7a…` matches the act record; opened read-only it shows schema `003` and **zero** provisioned rows — a restore would leave **no authorized state** (raw §3 `backupRestoreCheck`) |
| Transactional atomicity | a rehearsal transaction that created a user + membership + binding and then **threw** left **no partial state** (`tableCountsBefore == tableCountsAfter`); rows and their audit rows roll back together (raw §3 `atomicityRehearsal`) |
| Foreign-key enforcement | direct insert of a binding with a non-existent `application_user_id` fails with `FOREIGN KEY constraint failed` (raw §3) |
| Live-effect isolation | both rehearsals ran **only** on disposable copies, which were discarded; the live store sha256 is unchanged (raw §3 `liveStore`) |

---

## 7. REVOCATION BEHAVIOUR — ONE-WAY, DEFINED AND DEMONSTRATED (on copies)

On a disposable copy: `BINDING_REVOKED` and `MEMBERSHIP_REVOKED` audit rows appear in `seq` order;
`resolveActiveBinding()` refuses (`LOCAL_PRINCIPAL_BINDING_UNRESOLVED`) with no owner disclosed;
a **repeat** revocation is refused (`LOCAL_PRINCIPAL_REVOCATION_INVALID`); re-binding by reuse is
refused (`LOCAL_PRINCIPAL_BINDING_CONFLICT`); after membership revocation `resolveTenant` fails
closed (`TenantMembershipRevokedError`); and re-provisioning is refused
(`LOCAL_PRINCIPAL_MEMBERSHIP_CONFLICT`) — the implicit `REVOKED → ACTIVE` upsert restoration is
**never exercised**. **The live row remains `ACTIVE`** (no live revocation was performed by Gate A).

---

## 8. ENVIRONMENT AND TIMESTAMPS

| Item | Value |
|---|---|
| Runtime | Node `v22.22.3`; `better-sqlite3` `13.0.3`; SQLite `3.53.4`; Linux |
| Clock | the environment clock was **verified against the authoritative GitHub API HTTP `Date` header** immediately before the act (environment `2026-10-16T17:59:55Z` vs authoritative `17:59:56Z`); act and ledger timestamps are therefore on the authoritative UTC timeline (local +05:30 equivalent given for the act timestamp) |
| Act timeline (UTC) | start `18:04:30.418Z` · backup `18:04:30.449Z` · provisioning commit `18:04:30.449Z` · finish `18:04:30.454Z` · validation+rehearsal `18:04:36Z` · invariants captured `18:04:50Z` |

---

## 9. INVARIANTS PRESERVED

DP-2 Option 2F **in force** · H-18 single-user personal-use scope **in force** · the IRR HTTP 503
`owner-context-unavailable` fence **byte-unchanged** at the current IRR `main` · all four Gate V
waivers **preserved, not reopened** · accepted contract semantics **unchanged, no new control
invented** · IPD `main` `70b24f029842…` **unmoved** · PR #8 **unmerged** · the G24 lineage **not**
promoted, merged, cherry-picked, re-pinned, or admitted · no `main`-targeted PR created · no
competing PR · the ChatGPT Library tracker untouched.

---

## 10. BOUNDARIES OF THIS ACT — NOT DONE, NOT AUTHORIZED

No IPC endpoint, resolver, refusal-matrix, canonical-identity or runtime wiring (Gate B) · no
qualification run (Gate C) · no route/consumer admission and no durable portfolio write (Gates D/E
and the write policy) · no `user_portfolios` row · no `external_identity_mappings` row · no
issuer/credential/OIDC/Keycloak artifact · no tenant administration, restoration, or
cross-system audit destination · no IRR modification · no P-6/P-8 · no production claim and **no
successful-write claim**. Gate A created data; it proves nothing about the endpoint.

---

## 11. DURABILITY

This record and its raw-evidence companion are published as **additive documentation** in the
existing authorized PR #8 workstream (`evidence/np04/`), committed and pushed, with remote
ref/commit/blob/tree verification and byte-identity checking recorded in the appended
publication-verification section of this file.

---

## 12. ATTESTATION

| Check | Result |
|---|---|
| Databases created/modified | **exactly one** — the named local store (`/home/user/gate-a-store/ipd-portfolio.sqlite`); nothing else |
| Rows created | exactly 1 application user + 1 membership + 1 binding (+2 audit rows); **no other row** |
| Provisioning performed by the Recording Agent | **NO** — the operator tooling executed the act; the agent prepared and recorded |
| Endpoint/resolver/route/write code | **NO** |
| IRR modified | **NO** (read-only API verification) |
| PR #8 / PR #118 merged | **NO** (PR #8 OPEN; PR #118 merged earlier by the IRR-side act, not by this act) |
| Refs promoted/merged/cherry-picked/re-pinned/admitted/moved | **NO** (ref inventory unchanged) |
| Gates B/C/D/E advanced; P-6/P-8 granted | **NO** |
| Rollback required | **NO** (all validations passed) |

---

---

## 13. PUBLICATION AND REMOTE VERIFICATION (appended 2026-10-16)

**Publication commit (this record + its raw-evidence companion):**
`22285d6a54315fe07601054276dd334f34806dae` — parent
`f3ca83881fcdf67520433a0d6b3bbd216d76aa2e`, tree
`01bb231d6b046852c549c462bb721f75e48c021d`, **+2,805 / −0** (exactly two added documentation
files; no other change).

| Artifact | Remote blob | sha256 (remote = local) | Byte identity |
|---|---|---|---|
| `…GATE_A_EXECUTION_RECORD_2026-10-16.md` | `853cc9d11da841b58f0c7ce48c6ab56d05443870` | `88965d7a3069f4f8987f2b386452c28bc3ef2e829fedd33555195c8f74d42988` | **IDENTICAL** (`cmp`) |
| `…GATE_A_EXECUTION_RAW_EVIDENCE_2026-10-16.md` | `b42c5c6dcbc5f5a5e3b4ef777bc88a6d0b9db229` | `712edd8f19bbfc4e0a3fbe7992336ecbaa3622396473b4158acd8c66490762bb` | **IDENTICAL** (`cmp`) |

PR #8 verified live: **OPEN, unmerged**, head `22285d6a54315fe07601054276dd334f34806dae`, 17 files.
This section is appended by a **subsequent** commit to the same workstream, so the record's own
identity is not self-referential.

---

*End of executed-act record `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01` —
**GATE A — PROVISIONED / VALIDATED** · one-time · local · offline · NON_PRODUCTION.*
