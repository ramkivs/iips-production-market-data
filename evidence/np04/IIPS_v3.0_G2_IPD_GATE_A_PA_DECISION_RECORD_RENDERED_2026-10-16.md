# IIPS v3.0 — G-2: **GATE A — PA DECISION RECORD — RENDERED**

> ## STATUS: **RENDERED PA DECISION — GATE A = `APPROVE WITH CHANGES`**
> This artifact records the **Program Authority's rendered decision** on the Gate A
> local-provisioning authority request. **Gate A execution must not begin until decision 2 below is
> satisfied and independently verified.** Nothing has been provisioned; no database exists; no code
> was written; no ref was moved.

| Field | Value |
|---|---|
| **Act identifier** | `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01` |
| **Artifact type** | **Rendered PA decision record** (separate durable decision artifact; recording only — nothing executed) |
| **Authority** | **RAMKI — Program Authority**, acting as the IPD security-contract authority for `ramkivs/iips-production-market-data` |
| **Rendered at (local, Asia/Calcutta)** | 2026-10-16 |
| **Disposition** | **APPROVE WITH CHANGES** |
| **Governing request** | `IIPS-V3-G2-GATE-A-LOCAL-PROVISIONING-AUTHORITY-REQUEST-2026-10-16-01` — `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_LOCAL_PROVISIONING_AUTHORITY_REQUEST_2026-10-16.md` |
| **Proposal rendered** | `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-RECORD-DRAFT-2026-10-16-01` — `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PA_DECISION_RECORD_DRAFT_PROPOSED_2026-10-16.md` @ blob `63837ae05b71856e41af6b66633bf0d5279c55fa` (PR #8 head `f4726a9…`) |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream) |
| **Execution status** | **NOT BEGUN — BLOCKED** by decision 2 (IRR DP-1 amendment effective on authoritative IRR `main` and independently verified) |
| **Production status** | NON_PRODUCTION |

---

## 1. EFFECT OF THIS DECISION

```
GATE A DISPOSITION = APPROVE WITH CHANGES
```

**Gate A is approved with the changes recorded below.** The approval is **conditional on
satisfaction of decision 2** before any execution step, and is limited strictly by decision 6 and §6
of this record. **This act authorizes no immediate provisioning**: no database may be created, no
identity, tenant, membership, or binding may be provisioned, and no application code may be written
or changed until the decision 2 prerequisite is satisfied and independently verified.

**No changes beyond the proposal were required.** The rendering adopts the proposal's content in
full: the proposal's two attached changes (execution basis at the exact accepted commit object;
DP-1 ordering precondition) are rendered as decisions 1 and 2, and the proposal's six confirmations
are rendered as decisions 3–8. **The proposal's history is preserved** (§3); the proposal file is
**not** altered, and it remains in the workstream marked
`PROPOSED — NOT YET AUTHORIZED — NOT A PA DECISION`. This artifact is its rendered conversion and,
for effect, supersedes the proposal.

---

## 2. THE EIGHT RENDERED DECISIONS

### 2.1 Decision 1 — Execution basis (rendered)

> **The execution basis is the exact accepted commit object
> `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`** (tree `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5`),
> carried for the executed record at `refs/heads/arena/01a0f308-iips-production-market-data` —
> live-verified to have that object as its current tip.
>
> **The tree-identical descendant `c1b955b427486dbce6d6a159a448065b9db45dc9` is NOT designated and
> must not be substituted.** No ref is promoted, merged, cherry-picked, re-pinned, or admitted by
> this designation, and the G24 lineage is unchanged.

**Basis of the rendering (verified — §4):** the acceptance act binds the accepted state as the
target branch **at** `6828155…` and states that acceptance *"does not extend to any descendant
commit, any other branch, any later mutation of the target"*; the governing request §3.2 item 2
names the basis as `arena/01a0f308-…` @ `6828155…` (tree `eb07ea36…`). The descendant's identical
tree is **not** Git object identity.

### 2.2 Decision 2 — DP-1 ordering precondition (rendered)

> **The IRR DP-1 amendment must be effective on authoritative IRR `main` and independently verified
> before Gate A execution.** Publication of the amendment on open IRR PR #118 **alone is
> insufficient**. **Gate A execution must not begin until** the amendment is merged to IRR `main`
> under its own separate IRR decision, and the resulting IRR `main` state is independently verified.
>
> **PR #118 is not merged by this act.** Merging PR #118 **remains a separate decision** to be taken
> on the IRR side.

**Basis of the rendering (verified — §4):** IRR `main` = `eb4bf820c62eb3e2f5c628a95d59c8f967e3f629`;
the amendment file is **absent** from IRR `main` (content lookup 404) and present only on PR #118
head `dc47dd2eb0989439c045e272ce7fed3b909e3c6e` (blob `c71661a1ee445b2348cedfedae4aef6449029ebb`),
which is **OPEN and unmerged**.

### 2.3 Decision 3 — Identifier rules (rendered)

> **Tenant IDs: `t-` + lowercase UUIDv4** — generated **once** at execution **and immutable**
> thereafter; opaque; never derived from any host, account, user, issuer, subject, or other
> identifier. **Endpoint IDs: `ep-` + lowercase UUIDv4** — generated **once** at execution **and
> immutable**; opaque; never a wire field. **No concrete identifier values are invented or recorded
> in this decision**; the concrete values are generated when the (still-blocked) Gate A act is
> executed and are recorded in its executed record.

### 2.4 Decision 4 — Revocation semantics (rendered)

> **Revocation is one-way. There is no `REVOKED → ACTIVE` restoration.** Binding and membership
> revocation are explicit, transactional, and fail-closed thereafter; the implicit restoration
> behaviour of the existing upsert remains the recorded DEFERRED governance item and is not
> authorized for use. Re-provisioning after revocation requires a new explicit act.

### 2.5 Decision 5 — A-3 audit scope (rendered)

> **The A-3 audit is local-only.** It covers binding and membership lifecycle mutations on the local
> store, written in the same transaction as each mutation. **No cross-system audit destination is
> created, configured, implied, or authorized**; cross-system security-audit delivery remains
> **NOT ESTABLISHED**.

### 2.6 Decision 6 — Gate A scope (rendered)

> **Gate A is authorized only for the specified A-2/A-3 enablement** — as scoped in the governing
> request (§5 in-scope items 1–5: the additive `003` migration for `local_principal_bindings`, the
> local audit line and its event writes, the one-time local provisioning, and the
> validation/evidence of request §2.7–§2.8) — **with the request's §3.1 and §5 exclusions preserved
> verbatim.**
>
> **No endpoint/resolver implementation, no route admission, and no portfolio writes are authorized
> by this act.**

### 2.7 Decision 7 — Publication form (rendered)

> **The rendered decision is recorded as a separate durable PA decision artifact in the existing IPD
> PR #8 workstream** — this artifact, committed and pushed to
> `arena/21c63aef-iips-production-market-data` and remotely verified (blob/sha256/byte identity).
> **No new PR; no competing branch.** The ChatGPT Library tracker and the IRR repository are **not**
> modified by this record.

### 2.8 Decision 8 — Validation, rollback, and evidence (rendered)

> **The existing requirements are preserved in force and unchanged:**
> **V-A1–V-A8** validation (request §7); **rollback / fail-closed** conditions (single
> `immediateTransaction`, pre-run backup, backup-restore on failure, no in-place un-revoke, no
> manual repair — request §2.7); **evidence-pack** requirements (request §2.8);
> **DP-2 Option 2F** (request §4.1); **H-18** single-user personal-use scope (request §4.2);
> the **IRR HTTP 503 `owner-context-unavailable` fence** (request §4.3); and **all four previously
> approved Gate V waivers** (request §4; accepted decision §5; IRR amendment §7) — **no new controls
> are invented, and the accepted contract semantics are unchanged.**

---

## 3. PROPOSAL HISTORY — PRESERVED

The proposal remains in the workstream **unmodified**, marked
`PROPOSED — NOT YET AUTHORIZED — NOT A PA DECISION`, as the preserved proposal record:

| Proposal revision | Commit | Content | Blob / sha256 |
|---|---|---|---|
| `…DRAFT_PROPOSED_2026-10-16.md` published | `73662eab018f18ca106922531b789b75d58af9e9` (parent `1cb7511347cb…`; added `+245`) | eight `PROPOSED` fields; unresolved basis-object field | blob `f4daeef02a77ad745385250f806c79d815e18c30`, sha256 `7862b2f817dda03ba860a8f33a14ae9a3cca2abf716cd099f1a613fd774aa10f` |
| corrected in place (basis at object level; DP-1 shown as proposal) | `f4726a9ab4c473491275a78c0b53a2b5bb171b62` (parent `73662eab…`; `+61/−29`) | **the version rendered by this act** | blob `63837ae05b71856e41af6b66633bf0d5279c55fa`, sha256 `d8b03411c8b21936067eec8abadf70fb3ca1cd0511d0ec9eb984a2221316a94d` |

**Field mapping (proposal → rendered):** proposal §1.1 → decision 1; §1.8 → decision 2; §1.2/§1.3 →
decision 3; §1.4 → decision 4; §1.5 → decision 5; §1.6 → decision 6; §1.7 → decision 7; proposal §4
(preserved requirements) → decision 8. **No proposal content is withdrawn or altered.**

**Proposal open fields — resolution in this act:** (i) PA rendering → **this act**; (ii) basis field
→ **resolved**: exact accepted commit object `6828155…`, descendant not designated; (iii) DP-1
reading → **resolved**: reading (B) — effectiveness on IRR `main` required; (iv) concrete identifier
values → **remain generated at execution, not invented**; (v) finalization location → **this
separate artifact** (decision 7).

---

## 4. VERIFIED REFERENCES AT RENDERING (live remote, read-only)

| # | Reference | Verified value |
|---|---|---|
| 1 | Designated basis commit object | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`; tree `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5`; parent `d4fdb33d9810b0736a9a382d6ab35b7ce2a7480e` |
| 2 | Carrier ref of the basis object | `refs/heads/arena/01a0f308-iips-production-market-data` (@ `6828155…`) |
| 3 | Designated promotion target ref (descendant) | `refs/heads/arena/01a0e6d9-iips-production-market-data` @ `c1b955b427486dbce6d6a159a448065b9db45dc9` — **descendant, not designated** |
| 4 | Acceptance binding | Accepted state = the target branch **at** `6828155…` (target SHA = accepted implementation SHA); acceptance does not extend to descendants |
| 5 | IRR `main` | `eb4bf820c62eb3e2f5c628a95d59c8f967e3f629` |
| 6 | IRR PR #118 | **OPEN, unmerged**; head `dc47dd2eb0989439c045e272ce7fed3b909e3c6e` |
| 7 | DP-1 amendment on IRR `main` | **ABSENT** (content lookup 404); present only on PR #118 head (blob `c71661a1ee445b2348cedfedae4aef6449029ebb`) |
| 8 | IPD `main` | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` (unmoved) |
| 9 | PR #8 | **OPEN, unmerged**; head `f4726a9ab4c473491275a78c0b53a2b5bb171b62`; proposal blob `63837ae0…` |
| 10 | A-2/A-3 artefacts on the basis | **0** — Gate A is the act that creates them (request §5 items 1–2) |

---

## 5. PREREQUISITES BEFORE ANY EXECUTION STEP

1. **Decision 2 satisfied** — DP-1 amendment effective on authoritative IRR `main` **and
   independently verified**; this includes the separate IRR decision to merge PR #118.
2. **Operator execution, offline** — per request §3.2 items 3–4 (local store via
   `IPD_PORTFOLIO_DB_PATH`, absolute; the Recording Agent prepares and records — it does not
   provision).
3. **Executed-act record and evidence pack** — validation V-A1–V-A8 outputs and evidence per
   request §2.8, published durably under this workstream.

Until (1) is satisfied and verified, **Gate A execution is NOT AUTHORIZED TO BEGIN.**

---

## 6. AUTHORITY LIMITS OF THIS ACT

This act **does not**:

- authorize immediate provisioning, or any provisioning before decision 2 is satisfied and verified;
- authorize creating a database, or provisioning identities, tenants, memberships, or bindings;
- authorize endpoint/resolver implementation, route admission, or portfolio writes;
- merge **PR #8** or **PR #118**, or modify the IRR repository from this IPD checkout;
- advance Gates **B/C/D/E** or grant **P-6 / P-8** (each remains a separate required act);
- remove, alter, or relax the IRR HTTP 503 fence, **DP-2 Option 2F**, or **H-18** scope;
- promote, merge, cherry-pick, re-pin, or admit any G24 lineage ref, or move any ref at all;
- alter any accepted contract semantic or introduce any new control.

---

## 7. RECORDING ATTESTATION

| Check | Result |
|---|---|
| Decision rendered by | **RAMKI — Program Authority** (the act is the Authority's; the recording below is the agent's) |
| Authority act performed by the Recording Agent | **NONE** — Arena records the rendered decision only and renders nothing on its own |
| Provisioning performed | **NO** |
| Database created or modified | **NO** (no `.db` / `.sqlite*`) |
| Identities / tenants / memberships / bindings created | **NONE** |
| Application code / endpoint / resolver implemented | **NO** |
| IRR modified | **NO** (read-only API verification only) |
| PR #8 / PR #118 merged | **NO** (both OPEN, unmerged) |
| Refs promoted, merged, cherry-picked, re-pinned, admitted, or moved | **NO** |
| Gates B/C/D/E advanced; P-6/P-8 granted | **NO** |
| New artefacts | exactly one — this rendered decision record |

**Rendered decision (verbatim disposition):** `GATE A = APPROVE WITH CHANGES` — subject to the
eight decisions above, the conditional execution prerequisite of decision 2, and the scope limit of
decision 6.

---

*End of rendered PA decision record `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01` —
**RENDERED · GATE A = APPROVE WITH CHANGES · EXECUTION NOT YET AUTHORIZED TO BEGIN**.*
