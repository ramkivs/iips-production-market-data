# IIPS v3.0 — G-2: **GATE A′ — PA DECISION RECORD — RENDERED**

> ## STATUS: **RENDERED — GATE A′ = `APPROVED` — RULE P-1 ADOPTED — NOT EXECUTED**
> The Program Authority's disposition on the Gate A′ request is recorded here. **Gate A′ is
> authorized** as one bounded, one-time provisioning act on the designated Windows host, under
> **rule P-1**. **Nothing has been provisioned**: no store exists, no row exists, no fixture exists,
> and Gate C has not begun. This record **authorizes**; it does not execute, and no execution receipt
> may be written before the operator's own evidence exists.

| Field | Value |
|---|---|
| **Act identifier** | `IIPS-V3-G2-IPD-GATE-A-PRIME-PA-DECISION-2026-10-17-01` |
| **Artifact type** | **Rendered PA decision record** (records the Authority's disposition; recording only — nothing executed) |
| **Authority** | **RAMKI — Program Authority**, acting as the **IPD security-contract authority** for `ramkivs/iips-production-market-data` (the capacity that rendered `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01`) |
| **Rendered** | 2026-10-17 (Asia/Calcutta) |
| **Channel** | the **G-2 task channel** for this workstream; recorded here as such |
| **Disposition** | **`APPROVED`** — bounded store provisioning on the designated Windows host, **path selected under rule P-1** |
| **Governing request (byte-preserved, not modified)** | `IIPS-V3-G2-IPD-GATE-A-PRIME-WINDOWS-STORE-PROVISIONING-AUTHORITY-REQUEST-2026-10-17-01` — `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PRIME_WINDOWS_STORE_PROVISIONING_AUTHORITY_REQUEST_2026-10-17.md` — commit `d60c9be0477ec192d64c5491a9fb2c49bc1e283c`, blob `b6140dffe23795cc97062cead2c78c89fdae0d33`, sha256 `ffb8c4b16d6285398eda41f8ea673849b72db0c72e5949fd6a16f8496aea9d0d`, 22 107 bytes |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream, open, unmerged) |
| **Execution status** | **NOT EXECUTED** — the act is an operator action on the Windows host; no part of it has occurred |
| **Production status** | NON_PRODUCTION — one user, one personal laptop, H-18 scope |

---

## 1. EFFECT OF THIS DECISION

```
GATE A′ DISPOSITION = APPROVED   ·   STORE-PATH RULE = P-1 (ADOPTED)   ·   EXECUTIONS = 1
```

**Gate A′ is approved** for **one** provisioning execution on the designated Windows host, at an
absolute store path selected and verified by the operator under **rule P-1**. The act creates
**exactly** one `application_users` row, one `ACTIVE` `tenant_memberships` row, one `ACTIVE`
`local_principal_bindings` row and their two A-3 audit rows, after applying migrations `001`–`003`,
using the **already-published** provisioning and validation tooling — and nothing else.

**This approval does not mean the store exists.** It does not mean provisioning has begun. It grants
no endpoint, no qualification, no fixture, and no admission. Until the operator publishes an executed
record showing the six objects and the V-A1…V-A8 validation, **the Gate C store prerequisite remains
open**.

---

## 2. SOURCE, CAPACITY AND RECORDING DISCIPLINE

### 2.1 The disposition

The Program Authority directed, in the G-2 task channel on 2026-10-17, that the Gate A′ request be
**rendered**: **adopt rule P-1** as the store-path selection rule and **authorize the precisely
bounded provisioning operation** it describes, preserving every condition in it — no fixed path
invented, no widening of scope, no additional users, tenants, memberships, bindings or unrelated
data, and no implication that the store already exists.

The Authority further directed that the rendering be completed and published in this pass, without a
further approval request.

### 2.2 On the claimed standing authorization — recorded accurately

The Authority's directive describes its approval as global, explicit and recorded. **This record does
not rest on any such standing instrument, because none exists in the repository:** a search of the
full `evidence/np04/` record set returns **no** global, blanket, standing or delegated authority
instrument, and the programme's own history is consistent with that — every rendered act to date
(`IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01`, the Gate B baseline and implementation acts, and
`IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-AUTHORITY-2026-10-17-01`) records the Authority's **specific
disposition supplied in the task channel**, never an archival blanket.

**The rendering therefore rests on the disposition in §2.1 — a direct, specific act of the Program
Authority in this channel — and on nothing broader.** No blanket authority is asserted, implied,
created or relied upon; and none would suffice on its own, because the disposition must be, and is,
specific as to scope, host, path rule, tools and limits.

### 2.3 What this record is, and is not

| This record **is** | This record **is not** |
|---|---|
| The durable record of the Authority's rendered decision | A new decision, or an interpretation of one |
| The authorization instrument for **one** provisioning execution | An execution, an execution receipt, or evidence of provisioning |
| Additive documentation on the existing PR #8 workstream | A modification of any governance record |
| The rendering of a **specific** disposition | Reliance on a standing or global authorization |

### 2.4 The request is preserved, not rewritten

The request (`d60c9be`, blob `b6140dff…`, sha256 `ffb8c4b1…`) remains **byte-unchanged**. Its
`PROPOSED — NOT YET AUTHORIZED` banner is **not** edited: it was true when written and it remains the
correct description **of that artifact**. This document is the rendered decision; the request is the
record of what was put to the Authority, and this record supersedes it **for effect only**.

---

## 3. VERIFIED STATE AT RENDERING (live remote, read-only)

| # | Check | Verified value |
|---|---|---|
| 1 | Branch head | `d60c9be0477ec192d64c5491a9fb2c49bc1e283c` — **matches** the checkpoint |
| 2 | Authoritative `main` | `e040002a85097050720748af4e2cace06842700c`, tree `1a29f56737b375e80bd281738391c65a71d16ffc` |
| 3 | PR #8 | **OPEN, unmerged** (`mergedAt: null`), 41 files, +14 196/−62, 45 commits, `MERGEABLE`/`CLEAN`; CI run `39048963744` success — **556 executed / 0 failed** |
| 4 | Request artifact | blob `b6140dff…`, sha256 `ffb8c4b1…`, 22 107 bytes — **byte-identical to the reported values** |
| 5 | Basis ref | `refs/heads/gate-a/local-principal-enablement-2026-10-16` @ `2ded0e981407b38c73bdea164153f53856aa7217`, tree `9069045d3daf22156020188696fc2f9c2f32bf27` — **live remote, unmoved** |
| 6 | Gate A act | `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01` — **executed once, spent**; store `/home/user/gate-a-store/ipd-portfolio.sqlite` **absent**; no reuse is possible or attempted |
| 7 | Tenant authority | `Tenant administration = NOT AUTHORIZED` (`NP04-GOVERNANCE-AUTHORITY-RECORD.md` §5.1, G31/D115) — **unchanged by this record except as expressly carved in §4** |
| 8 | Gate C act | `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-AUTHORITY-2026-10-17-01` — rendered, subset Q1–Q4/Q9–Q11, fixtures = disposable copies of **the** provisioned store |
| 9 | Tags / pins | **4 tags**; `np04` `2e11fa3b`; G24 `6828155e` — **all unmoved** |
| 10 | Store on the Windows host | **none** — this record changes that only prospectively |

---

## 4. THE RENDERED DECISIONS

### 4.1 D-A′-1 — Execution basis (code)

> The provisioning basis is **`refs/heads/gate-a/local-principal-enablement-2026-10-16` @
> `2ded0e981407b38c73bdea164153f53856aa7217`**, tree **`9069045d3daf22156020188696fc2f9c2f32bf27`**,
> with these blob identities verified at execution:
>
> - migration `003` — `src/persistence/migrations/003_local_principal_bindings.ts` — `9ba884acc3c554c839a32ca41d0d16bda7e64690`
> - provisioning tool — `src/gate_a/provision.ts` — `b6f780f63278d333fd38c66e1abd2f3b64dcc2ea`
> - validation tool — `src/gate_a/validate.ts` — `550b9f4b83983d5d57aa29f565f371e5bcbed430`
> - binding service — `src/app_identity/local_principal.ts` — `710a47e22e5afc99c1744e11926719fc8356f20a`
>
> **No substitution is permitted.** If any identifier differs at execution, the act **stops**: no
> provisioning, report the discrepancy. No ref is promoted, merged, cherry-picked, re-pinned or
> admitted by this designation.

### 4.2 D-A′-2 — Designated host

> The host is the **Windows deployment laptop** of record: machine **`desktop-no0nhtp`**, Windows 11
> **Home Single Language**, build **26200**, 64-bit, account **`desktop-no0nhtp\user`**, SID
> `S-1-5-21-1872737340-673410177-2240931581-1001`, **not elevated**, Node **v24.14.0**
> (`C:\Program Files\nodejs\node.exe`).
>
> The operator **re-verifies** these at execution (`whoami`, SID, `node -v`, OS build) and records
> them. **If the machine is not this host, the act does not carry over** — the operator stops and a
> new rendering is required.

### 4.3 D-A′-3 — Rule P-1 adopted (store-path selection)

> **The absolute store path is selected by the operator under rule P-1 and verified BEFORE
> provisioning. No fixed path is named by this act.**
>
> | # | Condition |
> |---|---|
> | **P-1.1** | The path is **absolute** |
> | **P-1.2** | The store is **outside the repository** and outside every Git working tree |
> | **P-1.3** | The location is on a **local fixed NTFS volume** — not a network share, mapped drive, removable medium, or `%TEMP%` |
> | **P-1.4** | The location is **not** inside a synchronized folder (OneDrive, Dropbox, or equivalent) |
> | **P-1.5** | The **operator account** has write access to the parent directory; **no elevation** is used |
> | **P-1.6** | The target **file does not already exist** — if it does, the act **stops**; the act never overwrites, merges into, or repairs a pre-existing store |
> | **P-1.7** | If **any** condition is unmet, execution **stops** and the condition is recorded; no workaround, no alternate path chosen mid-act |
>
> The chosen path is recorded **verbatim** in the executed record **before** any provisioning step.
> The parent directory must exist; creating that directory is operator preparation, not provisioning.

### 4.4 D-A′-4 — Authorized scope (exhaustive)

| # | Object | Cardinality | Rule |
|---|---|---|---|
| 1 | store file | **1** | created at the P-1 path; `journalMode = DELETE`, `synchronous = FULL`, foreign keys enforced |
| 2 | migrations `001`,`002`,`003` | ledger 3 | existing published SQL; `001`/`002` **never edited**; schema version **`003`** |
| 3 | `application_users` | **exactly 1** | UUIDv4 from `crypto.randomUUID()` at execution; `ACTIVE`; **never derived** |
| 4 | `tenant_memberships` | **exactly 1** | `t-<lowercase UUIDv4>`; `ACTIVE`; opaque |
| 5 | `local_principal_bindings` | **exactly 1** | `ep-<lowercase UUIDv4>`; `ACTIVE`; FK → (3); tenant = (4) |
| 6 | `local_principal_audit_events` | **exactly 2** | `MEMBERSHIP_CREATED`, `BINDING_CREATED`, in the same transaction as their mutations |

**No other row, table, index, view, trigger, file, user, tenant, membership or binding may be
created.** No `user_portfolios`, no portfolio or revision row, no `external_identity_mappings`, no
credential, issuer, or identity-provider artefact.

### 4.5 D-A′-5 — Tools (no repository change)

> Provisioning and validation are performed by the **existing** `src/gate_a/provision.ts` and
> `src/gate_a/validate.ts` at the basis of D-A′-1, compiled by the **existing** compiler invocation.
> **No repository file is added, modified or removed by Gate A′.** The tool is invoked with
> `--execute`, an `--actor`, the act identifier as `--context`, and the basis `--basis-ref`,
> `--basis-commit` and `--basis-tree`.

### 4.6 D-A′-6 — Validation (reused, not altered)

> **V-A1 … V-A8 of the Gate A request §7 are adopted verbatim**: schema and ledger `001`–`003`;
> exactly one `ACTIVE` user; exactly one `ACTIVE` membership; exactly one `ACTIVE` binding with the
> correct FK and tenant; the two audit rows in `seq` order; all absences zero; `resolveTenant`
> returning exactly the provisioned tenant while any other or absent identifier fails
> **indistinguishably** from "not found"; and the invariants of §3. **No criterion is added,
> removed, or weakened.**

### 4.7 D-A′-7 — Evidence required

| # | Evidence |
|---|---|
| 1 | the tool's **verbatim JSON act record** (stdout) |
| 2 | build output and exit code, with the four known test-file diagnostics recorded verbatim — and **any fifth diagnostic is a stop condition** |
| 3 | the exact command line, the P-1 path, and the pre-run confirmation that the file did not exist |
| 4 | read-only validation output for V-A1…V-A8 |
| 5 | store file sha256 + size, backup path + sha256, migration ledger with checksums, schema version |
| 6 | host identity of D-A′-2 as re-measured |
| 7 | an **executed-act record** published additively in `evidence/np04/` on the existing PR #8 branch, committed, pushed non-forced, and verified remotely (ref/commit/blob/sha256 read back) |

**No execution receipt exists in this record and none may be written before (1)–(6) exist.**

### 4.8 D-A′-8 — One execution; consumption

> **One execution, one host, one path.** The authority is **consumed on completion whether the act
> succeeds or fails**. A failure is recorded as `GATE A′ — FAILED / ROLLED BACK` (or `NOT EXECUTED —
> PRE-EXISTING STORE` / `NOT EXECUTED — BASIS MISMATCH`), and **any re-attempt requires a fresh
> rendering**. No standing provisioning capability is created.

### 4.9 D-A′-9 — Stop and failure conditions

| Condition | Required action |
|---|---|
| basis ref/commit/tree or any of the four blobs differs | **STOP** — no provisioning |
| host differs from D-A′-2 | **STOP** — new rendering required |
| any P-1.1…P-1.6 condition unmet, or the file exists | **STOP** — record the condition |
| a build diagnostic beyond the four known ones | **STOP** — tool build not usable |
| any V-A1…V-A8 criterion fails | tool restores its backup; record `FAILED / ROLLED BACK`; **STOP** |
| any temptation to "repair", re-run, or manually adjust the store | **prohibited** |

### 4.10 D-A′-10 — Non-grants

**Gate A′ grants none of the following:** any IPC endpoint or server; any Gate C execution,
probe, fixture (C-A…C-E) or acceptance; any store **copy**; any portfolio or `user_portfolios` row;
any write policy; any credential or external identity; tenant administration, lifecycle, restoration
or audit expansion; any second user/tenant/membership/binding; any repository change; any promotion,
merge, cherry-pick or re-pin of the G24 lineage or of `2ded0e9`; any movement of `main`, `gate-a`,
`gate-b`, `np04`, or any tag; the merge of PR #8; Gates B/C/D/E; CV-52 admission; production use; any
IRR write; and any claim that qualification or operability has been established.

---

## 5. RELATIONSHIP TO THE OTHER DECISIONS

| Instrument | Scope | Independent? |
|---|---|---|
| `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-AUTHORITY-2026-10-17-01` | qualification of Q1–Q4/Q9–Q11 | yes |
| **this record** | **one** store provisioning on the Windows host | **yes** — it neither waives nor satisfies Gate C's build prerequisite |
| `IIPS-V3-G2-IPD-GATE-C-BUILD-EXCEPTION-PA-DECISION-2026-10-17-01` | procedure §4.7(4) only | **yes** — it neither provisions nor relies on a store |

**Gate A′ does not make Gate C runnable.** Even after a successful Gate A′ execution, Gate C still
requires a **qualifying Windows-host build run** under the build-exception decision (or a repair), and
then its own execution and result acceptance.

---

## 6. ATTESTATION

| Claim | Value |
|---|---|
| Disposition rendered here | **YES** — `APPROVED`, P-1 adopted |
| Provisioning executed by this record | **NO** |
| Store created | **NO** |
| Fixture created | **NO** |
| Endpoint opened | **NO** |
| Gate C executed or accepted | **NO** |
| Ref, tag or PR moved | **NO** |
| IRR touched | **NO** |
| Reliance on an unrecorded blanket authority | **NO** — see §2.2 |

---

## 7. DURABILITY

This record is published as **additive documentation** in the existing authorized PR #8 workstream
(`evidence/np04/`), committed and pushed with one non-forced push, and verified remotely by path,
commit, blob and sha256 with a byte-identity read-back. The publication verification is appended to
this file after publication.
