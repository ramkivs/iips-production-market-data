# IIPS v3.0 — G-2: **GATE A — PA DECISION RECORD DRAFT** (PROPOSED — NOT YET AUTHORIZED)

> ## ⚠️ STATUS: **PROPOSED — NOT YET AUTHORIZED — NOT A PA DECISION**
> This artifact is a **draft decision record prepared for the Program Authority's explicit review**.
> It records **proposed** decisions only. **No decision in this record has been rendered, is
> effective, or may be relied upon.** The Program Authority's explicit rendering (approve as
> proposed / amend / reject / defer) is required before anything in it takes effect.

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-RECORD-DRAFT-2026-10-16-01` |
| **Record type** | **DRAFT decision record (preparation only)** — proposal for the Program Authority's explicit rendering. Not an authority act; grants nothing. |
| **Prepared by** | Arena Agent Mode (recording agent only — no authority is rendered or inferred by the agent) |
| **Prepared at (local, Asia/Calcutta)** | 2026-10-16 |
| **Governing request** | `IIPS-V3-G2-GATE-A-LOCAL-PROVISIONING-AUTHORITY-REQUEST-2026-10-16-01` — `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_LOCAL_PROVISIONING_AUTHORITY_REQUEST_2026-10-16.md` |
| **Proposed decision-maker / capacity** | **Ramki — Program Authority**, acting as the IPD security-contract authority for `ramkivs/iips-production-market-data` |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream) |
| **Related** | IRR **PR #118** (`arena/8aff8266-iips-review-recovered`) — DP-1 identity/credential trust amendment; **OPEN, unmerged**; absent from IRR `main` |
| **Execution mode** | NON_PRODUCTION |

---

## 0. WHAT THIS DRAFT IS AND IS NOT

**Is:** a pre-filled, decision-ready record of the **eight proposed decisions** requested for Gate A,
each marked `PROPOSED`, with the verified execution-basis facts and the exact unresolved fields, so
the Program Authority can render the decision by a minimal edit or an explicit approval instruction.

**Is not:** an executed PA decision; an approval of Gate A; an authorization of provisioning,
implementation, qualification, route admission, or writes; a merge of any PR; a change to IRR; or an
authority act of any kind. **Nothing here may be described as decided until the PA renders it.**

**Nothing is provisioned, implemented, or merged by this draft.** No database is created or
modified; no `application_user`, tenant, membership, or binding record exists; no endpoint/resolver
code; no IRR modification; no ref promoted, merged, cherry-picked, or re-pinned.

---

## 1. THE EIGHT PROPOSED DECISIONS (each `PROPOSED` — PA rendering required)

### 1.1 `PROPOSED` — Gate A disposition

> **APPROVE WITH CHANGES** — the Gate A local-provisioning act as scoped in the governing request
> (§5), subject to the changes recorded in §3 below (execution-basis designation and DP-1 ordering
> precondition), and subject to the PA's confirmation or amendment of the fields in §1.2–§1.8.

**Reference (not duplicated):** requested act and verbatim wording — request **§8.1**; scope and
exclusions — request **§5**; authority limits — request **§3.1**.

### 1.2 `PROPOSED` — Tenant identifier rule

> **`tenant_id = "t-" + lowercase(UUIDv4)`** — generated **once**, at execution, by the one-time
> act; **opaque**; **immutable** thereafter; **never derived** from any host, account, user, issuer,
> subject, `companyId`, or any other identifier; never reused or rotated except by a separate act.
> **No value is invented here** — the concrete value is generated at execution and recorded in the
> executed act.

**Reference:** request **§2.2** (`T1-r`; responds to contract item `U-4`).

### 1.3 `PROPOSED` — Endpoint identifier rule

> **`endpoint_id = "ep-" + lowercase(UUIDv4)`** — generated **once**, at execution; **opaque**;
> **immutable**; **never a wire field** (contract C3/C7); recorded in the executed act.

**Reference:** request **§2.4** (A-2; responds to contract item `U-6`).

### 1.4 `PROPOSED` — Revocation semantics

> **Revocation is one-way.** Binding and membership revocation are explicit, transactional, and
> fail-closed thereafter. **No `REVOKED → ACTIVE` restoration** is authorized or exercised; the
> implicit restoration behaviour of the existing upsert remains the recorded **DEFERRED** governance
> item (NP04-G32 §5.3). Re-provisioning after revocation requires a **new explicit act**.

**Reference:** request **§2.5**.

### 1.5 `PROPOSED` — A-3 audit scope

> **Local-only.** The A-3 audit line covers binding and membership lifecycle mutations on the local
> store, written in the same transaction as each mutation. **No cross-system audit destination is
> created, configured, or implied**; cross-system security-audit delivery remains **NOT ESTABLISHED**.

**Reference:** request **§2.6**.

### 1.6 `PROPOSED` — Gate A scope limit

> **Gate A is limited to the A-2/A-3 enablement** (additive migration `003` for
> `local_principal_bindings`; the local audit table and its four event writes) **plus the one-time
> data provisioning** of request §5 items 3–5 and the validation/evidence of §2.7–§2.8.
> **Nothing else is in scope.**

**Explicitly not granted by this approval (restated for the record):** Gates **B, C, D, E**;
**P-6** implementation authority; **P-8** qualification; endpoint/resolver implementation; IRR
integration; route admission; durable portfolio writes; successful-save authority; promotion, merge,
cherry-pick, or re-pinning of the off-main G24 lineage; merging PR #8 or PR #118.

**Reference:** request **§3.1**, **§5** (in-scope/out-of-scope lists), **§8.2**.

### 1.7 `PROPOSED` — Publication form

> The rendered decision is recorded as a **separate durable record in the existing IPD PR #8
> workstream** (this draft, finalized as the decision record), committed and pushed with remote
> verification and byte-identity evidence. **No new PR; no competing branch; the ChatGPT Library
> tracker and IRR are not modified by this record.**

**Reference:** request **§8.3**.

### 1.8 `PROPOSED` — DP-1 ordering precondition (reading **(B)**)

> **Gate A execution must not begin until the IRR DP-1 amendment is effective on authoritative IRR
> `main` and independently verified.** Publication on IRR PR #118 is **not sufficient** for
> execution: the amendment must be **merged to IRR `main`** under its own IRR authority decision and
> independently verified at the resulting `main` commit **before** any Gate A provisioning step is
> executed.
>
> Consequence: the **PR #118 merge decision is a separate, additional prerequisite**; Gate A's
> approval does not merge it, and this record does not merge it.

**Reference:** request **§4.2.1** — this proposed field **selects reading (B)**, which is expressly
*not* selected by the request itself; the request's amended-§9 field 8 remains open until the PA
renders this field.

> **Note for the PA:** choosing reading **(A)** instead would make publication sufficient and remove
> this precondition from execution timing; the draft does not decide it — it proposes **(B)** as
> instructed, and records that the alternative remains available to the PA.

---

## 2. EXECUTION BASIS — VERIFIED (read-only, live remote evidence)

**Proposed basis:** `arena/01a0e6d9-iips-production-market-data`.

| Property | Verified value |
|---|---|
| **Full ref name** | `refs/heads/arena/01a0e6d9-iips-production-market-data` |
| **Full commit SHA (tip)** | `c1b955b427486dbce6d6a159a448065b9db45dc9` |
| **Tree SHA** | `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5` |
| Tip parents | single parent `f7513943ce8a52b6ae403e4b989110273eba09af` |
| Tip message | `Revert "docs(g2): IPD-side single-user local-principal security-contract proposal (design only)"` |
| Tip composition | accepted object `6828155…` + two later **docs-only** commits (`f7513943` add; `c1b955b` revert) → **net tree change 0** |
| **Accepted-lineage comparison** | `arena/01a0f308-…` tip `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`, tree `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5` |
| **Tree identity** | **IDENTICAL** (`eb07ea36…` = `eb07ea36…`) |
| `src/persistence` files | 13 (durable store present) |
| `src/app_identity` files | 6 |
| **A-2/A-3 artefacts** | **0** — the accepted enablement does **not** exist on any ref; Gate A creates them on this basis (request §5 items 1–2) |

**Authorization evidence for this basis (established, not inferred from branch existence):**

| Element | Evidence |
|---|---|
| Designated NP-04 promotion target | `NP04-PROMOTION-AUTH-TARGET-DESIGNATION-AND-AUTHORITY-ACT.md`, blob `832003c6e319…` (governance branch `arena/01a0f839-…` @ `12c480b5bf5c…`) — first designation of this branch as the promotion target; scoped FF authority only |
| Promotion executed | Authorized **fast-forward** `0dab122..6828155` into this ref, reported and independently verified in the NP04-PROMOTION-EXEC gate; no force, no merge commit, no new object |
| Post-promotion acceptance | `NP04-POST-PROMOTION-ACCEPTANCE-ACT.md`, blob `f4e671555476…` — **`NP04 POST-PROMOTION ACCEPTANCE = ACCEPTED`**, bound to `6828155…` / tree `eb07ea36…`, one-time, state-scoped, non-transferable (governance branch only; not resident on the target branch) |

**Identity and authorization: ESTABLISHED.** The ref is the accepted NP-04 integration target and
its tree is identity-equal to the accepted lineage tree.

### 2.1 Unresolved field (stated, not decided) — basis *object* choice

The NP-04 post-promotion acceptance is bound to the **exact object** `6828155…` / tree `eb07ea36…`.
The basis ref's **current tip is a later object** (`c1b955b…`) whose **tree is identical** and whose
two intervening commits are docs-only (add + revert of the superseded `docs/` proposal, with the
G-2 workstream now living on PR #8). Both readings are factually available:

| Reading | Basis used for execution | Property |
|---|---|---|
| **(i)** branch tip | `c1b955b42748…` (tree `eb07ea36…`) | accepted **tree**; two docs-only commits beyond the accepted object |
| **(ii)** accepted object | `6828155ec6…` (tree `eb07ea36…`), reachable via `arena/01a0f308-…` | **exactly** the accepted object and tree |

**This draft does not choose between them.** It proposes the designated branch
(`arena/01a0e6d9-…`) as instructed, and flags the object-level choice as an unresolved field for the
PA's rendering (see §4 item 2). No ref is promoted, merged, cherry-picked, or re-pinned by this
draft, and the contract's prohibition on promoting the off-main lineage is unchanged.

---

## 3. CHANGES ATTACHED TO THE PROPOSED APPROVAL

The proposed disposition is **APPROVE WITH CHANGES**; the changes are:

1. **Execution basis designated:** `refs/heads/arena/01a0e6d9-iips-production-market-data`
   @ `c1b955b427486dbce6d6a159a448065b9db45dc9` (tree `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5`) —
   subject to the unresolved basis-object field (§2.1).
2. **DP-1 ordering precondition:** reading **(B)** — Gate A execution may not begin until the IRR
   DP-1 amendment is **effective on IRR `main` and independently verified** (§1.8).
3. **All other proposed fields** (§1.2–§1.7) are confirmed as proposed.

---

## 4. VALIDATION, ROLLBACK, EVIDENCE, AND PRESERVED BOUNDARIES (by reference)

| Requirement | Reference (not duplicated here) |
|---|---|
| **Validation criteria V-A1…V-A8** (post-execution, read-only) | Request **§7** |
| **Rollback / fail-closed** (single `immediateTransaction`; pre-run backup; backup-restore on failure; no in-place un-revoke; no manual repair) | Request **§2.7** |
| **Evidence required to prove provisioning** (executed-act record; read-only SQL outputs; absence checks; DB/backup hashes; invariant re-verification; durable publication) | Request **§2.8** |
| **Exact scope and exclusions preserved** | Request **§5**, **§3.1**, **§10** |
| **Risks and limitations** R-1…R-10 | Request **§6** |
| **DP-2 Option 2F** — in force, unrelaxed | Request **§4.1** |
| **H-18 single-user personal-use scope** — preserved | Request **§4.2**; IRR amendment §6.2 |
| **IRR HTTP 503 `owner-context-unavailable` fence** — in force (blobs `cb8db45d…` / `51704c12…` at IRR `main` `eb4bf820…`) | Request **§4.3** |
| **All four Gate V waivers** — V-1 ACL/SDDL capture; V-4 collision/re-bind; second-account; remote-machine — `NOT REQUIRED — PA-WAIVED`, preserved verbatim, not reopened, not presented as technical proof | Request **§4**; accepted decision §5; amendment §7 |
| **No new controls; no change to accepted contract semantics** | This draft adds none; all requirements are by reference to the accepted contract (C1–C12), the accepted decision, and the governing request |

---

## 5. UNRESOLVED FIELDS AT PUBLICATION OF THIS DRAFT

1. **PA rendering** — approve-as-proposed / amend / reject / defer, with the PA's exact wording,
   date, and capacity statement. *(Required; nothing is effective without it.)*
2. **Basis object choice** (§2.1) — branch tip `c1b955b…` (tree-identical, +2 docs-only commits) vs
   the exact accepted object `6828155…`.
3. **DP-1 alternative** — the draft proposes reading **(B)** (§1.8); reading **(A)** remains
   available to the PA and would remove the `main`-effectiveness precondition.
4. **Concrete identifier values** — none exist and none are invented; `t-<uuidv4>` and `ep-<uuidv4>`
   are generated at execution under the confirmed rules (§1.2–§1.3).
5. **Where the rendered record is finalized** — proposed: this same file, finalized in place in the
   PR #8 workstream with the PA's rendering recorded (§1.7), or a superseding dated record if the PA
   prefers.

---

## 6. ATTESTATION (preparation only)

| Check | Result |
|---|---|
| Provisioning performed | **NO** |
| Database created or modified | **NO** (no `.db` / `.sqlite*` file) |
| `application_user` / tenant / membership / binding records created | **NONE** |
| Endpoint, resolver, or application code implemented | **NO** |
| IRR modified | **NO** (IRR read via API only; no IRR checkout written) |
| PR #8 or PR #118 merged | **NO** (both OPEN, unmerged) |
| Refs promoted, merged, cherry-picked, re-pinned, or changed | **NO** |
| Gates B/C/D/E advanced; P-6/P-8 granted | **NO** |
| New controls invented; contract semantics changed | **NO** |
| New artefacts | exactly one — this draft |

**Recording attestation:** Prepared by Arena as **Recording Agent** only, from the operating
session's explicit instruction recording the **proposed** decisions. This draft **renders no
authority**, **decides nothing**, and must not be cited as a decision until the Program Authority
explicitly renders it.

---

*End of draft `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-RECORD-DRAFT-2026-10-16-01` —
**PROPOSED · NOT YET AUTHORIZED · NOT A PA DECISION**.*
