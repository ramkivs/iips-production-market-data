# IIPS v3.0 — G-2: **GATE A DERIVATIVE-REF PUBLICATION — AUTHORITY REQUEST — PREPARED**

> ## STATUS: **PREPARED — NOT AUTHORIZED — NOT A DECISION — NO PUBLICATION PERFORMED**
> This artifact **requests** one decision from the Program Authority. It **renders no authority**,
> grants nothing, infers nothing, and **performs no push**. The Gate A derivative commit remains
> **local-only**; **no ref on the IPD remote carries it** (verified below, §8).

| Field | Value |
|---|---|
| **Request identifier** | `IIPS-V3-G2-IPD-GATE-A-DERIVATIVE-REF-PUBLICATION-AUTHORITY-REQUEST-2026-10-16-01` |
| **Artifact type** | **Prepared authority request** (recording only — **not** a decision, **not** an authorization, **not** an act) |
| **Prepared by** | Recording Agent (Arena), at the direction of the current G-2 task — the PA's act, if any, is the PA's own |
| **Prepared at (local, Asia/Calcutta)** | 2026-10-16 |
| **Repository / branch (this request)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream) |
| **Governing rendered decision** | `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01` — rendered record blob `08df3b9eb98264e50464f848a96104883f3c624b` (commit `f3ca83881fcdf67520433a0d6b3bbd216d76aa2e`) |
| **Executed-act record (published)** | `…GATE_A_EXECUTION_RECORD_2026-10-16.md`, blob `2043e8765777f70ebc109656cd7b0156ee47c739`; raw-evidence companion blob `b42c5c6dcbc5f5a5e3b4ef777bc88a6d0b9db229` |
| **Subject object** | derivative commit `2ded0e981407b38c73bdea164153f53856aa7217` (parent `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`; tree `9069045d3daf22156020188696fc2f9c2f32bf27`) |
| **Current publication status of the subject object** | **LOCAL ONLY** — no remote ref carries it; retained as a local branch and a git bundle (sha256 `eeb7355358907fb28fa6789fc4a7b13ea8f9ea8ed5c07ef21bfc71b8a62be201`) |
| **Disposition requested** | one decision: `APPROVE` / `APPROVE WITH CHANGES` / `REJECT` / `DEFER` on **one** remote-ref publication (§1, §5) |
| **Production status** | NON_PRODUCTION — Gate A scope only; no endpoint, no route, no write |

---

## 1. THE QUESTION, AND THE SINGLE DECISION REQUESTED

Gate A was executed and validated (`GATE A — PROVISIONED / VALIDATED`) on the designated basis, and
the executed record plus its raw-evidence companion are durably published in PR #8. That act
produced the A-2/A-3 enablement as a commit — `2ded0e981407b38c73bdea164153f53856aa7217` — on a
**local** branch. Its record states, accurately, that the derivative ref is **not pushed** and that
pushing it is *"an outstanding step for the Program Authority, if required"* (record §4).

**The one question this request puts to the Program Authority:**

> Does the rendered Gate A authority (or any other existing governance record) authorize **creating
> one new ref on the IPD remote** that publishes this exact derivative commit — and if it does not,
> is the Program Authority prepared to render that publication?

**The one operation it asks the Program Authority to authorize (§4):** create **exactly one** new
remote ref, `refs/heads/gate-a/local-principal-enablement-2026-10-16`, pointing at the **exact**
commit `2ded0e981407b38c73bdea164153f53856aa7217` — no rewrite, no amend, no rebuild, no
substitution — and nothing else.

**This request does not assume the answer.** §2 records the finding that the existing authority does
**not** cover the operation, and states the single textual passage that could be read otherwise, so
the Program Authority can resolve it rather than the Recording Agent inferring it.

---

## 2. FINDING — WHY THE EXISTING AUTHORITY DOES NOT COVER THIS OPERATION

**Finding (recorded, not decided): the rendered Gate A authority does not permit creating this new
remote ref.** The finding rests only on the governance texts below — **not** on the fact that
provisioning succeeded, that the derivative exists locally, that a bundle exists, that the tests
passed, or that PR #8 is open and mergeable. Those facts are all true and none of them is treated as
authority.

### 2.1 The rendered decision names one publication form, and it is a documentation form

Decision 7 (§2.7 of the rendered record) renders the **publication form** as:

> *"The rendered decision is recorded as a separate durable PA decision artifact in the existing IPD
> PR #8 workstream — this artifact, committed and pushed to
> `arena/21c63aef-iips-production-market-data` and remotely verified (blob/sha256/byte identity).
> No new PR; no competing branch."*

The PA was asked this precise question — request §9 item 7, *"Confirmation of the publication form
(§8.3): the decision recorded as a separate durable record in the PR #8 workstream"* — and answered
it by naming the **decision record**. No rendered decision names a code ref, a derivative branch, or
any ref operation beyond the additive documentation commit.

### 2.2 The rendered decision limits ref operations

§6 of the rendered record: this act **does not** *"promote, merge, cherry-pick, re-pin, or admit any
G24 lineage ref, **or move any ref at all**."* Creating a new remote head is not a *move* of an
existing ref; it is nonetheless a **ref-inventory mutation** on the authoritative remote
(`34 heads / 4 tags / 9 pull refs` → `35 heads`), and it is not among the operations the eight
decisions name.

### 2.3 The governing request's in-scope list is declared exhaustive, and it enumerates publication only twice

Request §5 in-scope, *"In scope (exhaustive)"*, enumerates publication **only** as item 7
(*"...publication of the evidence of §2.8"*) and item 8 (*"the durable authority/execution record of
§8.3"*). Request §8.3 item 2 likewise provides that *"the **executed** Gate A act later publishes
its own **record**"*. Publishing a **code ref** is not enumerated in an exhaustive in-scope list.

### 2.4 The repository's own convention requires a permitted publication to be named explicitly

The established pattern in this governance lineage always **names** the permitted publication and
its ref. The NP04 post-promotion acceptance act (§11) phrases its limit as *"move any ref **other
than adding this single governance artifact to the governance branch**"*, and makes durability
(*"a record that is only local is **not** durable"*) a property of that **named** artifact verified
on its remote ref. Applying that convention, a derivative **code** ref requires its own explicit
naming. None exists.

### 2.5 The authoritative executed record states the opposite, and its evidence captures it as an invariant

Executed record §4, *"Publication status of the derivative ref — STATED, NOT DECIDED"*: the
derivative branch is *"**local-only** (not pushed; remote ref inventory unchanged…)"* and pushing it
*"is an **outstanding step** for the Program Authority, if required — it is not performed"*. The raw
evidence captures the same as a checked invariant: `no derivative ref pushed: 0 (must be 0 — the
derivative branch is local-only by this act)`. Both artifacts are **published and byte-verified**.
A push under existing authority would therefore contradict the operative record it is supposedly
executing under, and repairing that contradiction would require modifying published evidence — which
is not authorized either. The two positions cannot both stand; the record is the operative one.

### 2.6 The one passage that could be read otherwise — disclosed, and why it is not an authorization

Request §3.3, fact 1 contains the single passage on this question:

> *"...a local checkout of the designated ref, **expected to be published as a derivative branch
> under this act**, without promoting or admitting it."*

It is disclosed here in full because it is the closest thing to a basis for publication. It does not
constitute one:

1. §3.3 is self-labelled **"Execution-basis candidates (informational — NOT designated by this
   request)"**; its content is candidate-fact material offered to the PA for the **basis**
   designation, not a rendered authorization.
2. It says **"expected"** — an anticipation of mechanics by the requester, not a grant.
3. The request's own §10 states it *"**renders no authority** — every decision in this artifact is a
   proposal for the Program Authority's disposition."*
4. The PA rendered the request's eight items into eight decisions **without** rendering this
   sentence as a decision, and answered the publication-form question narrowly (§2.1).

**Therefore:** the passage is recorded as the residual ambiguity, and the Program Authority is asked
to resolve it in §5 rather than have it resolved by the agent's inference — including the option of
rendering it as *already* authorized, if that is the PA's reading.

---

## 3. THE EXACT OBJECT PROPOSED FOR PUBLICATION (verified 2026-10-16)

| Property | Value |
|---|---|
| Commit | `2ded0e981407b38c73bdea164153f53856aa7217` |
| Parent (the designated basis object, unsubstituted) | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| Tree | `9069045d3daf22156020188696fc2f9c2f32bf27` |
| Scope | 10 files, `+1,572 / −19` — **A-2/A-3 enablement only**, plus three necessary mechanical test-expectation updates |
| Deletions / renames / mode changes | **none** |
| Out-of-`src`/`tests` changes | **none**; no database, bundle, or binary artifact committed |
| Accepted migrations `001` / `002` | **byte-unchanged** (`48fcf4d9…`, `dfe9f027…`) |
| Integrity | locally re-verified: commit/parent/tree/blob SHAs recomputed from the object store; the git bundle reproduces the identical commit, tree and blobs |

**Files (blob SHAs):** `003_local_principal_bindings.ts` `9ba884ac…` (A-2 table+index, A-3 audit
table) · `local_principal.ts` `710a47e2…` · `gate_a/provision.ts` `b6f780f6…` · `gate_a/validate.ts`
`550b9f4b…` · `registry.ts` `5d3ab64a…` · `migrations/index.ts` `92a7b613…` · `app_identity/index.ts`
`0fcc7aa1…` · test files `68a29288…`, `8395fcc9…`, `86928951…`.

**Already published in this workstream, and not re-created by this request:** the complete unified
diff (raw evidence; sha256 `0f4f323a8b3237df7b3a0850c6095465aff3e95fd434a7fcc1eb5d9756869c1a`), the
per-file blob/sha256 inventory, and the executed-act validation results (record §§4–7; the
derivative's validation: `tsc` 4 pre-existing errors/0 new, g24 **84/84**, full suite **782/782**,
`vite build` exit 0).

---

## 4. THE EXACT OPERATION PROPOSED (one ref; nothing else)

**Proposed (subject to the PA's amendment):**

1. **One new ref**: `refs/heads/gate-a/local-principal-enablement-2026-10-16` — the **same name as
   the local branch and the bundle's recorded ref**, which keeps the executed record's identifiers
   consistent — created at exactly `2ded0e981407b38c73bdea164153f53856aa7217`.
2. **Push form**: a single non-forced push of that one ref, `2ded0e9…` → the new ref. **No
   force-push, no ref update, no ref deletion, and no change to any existing ref** (`main`,
   `arena/01a0f308-…`, `arena/01a0e6d9-…`, `arena/01a0f839-…`, `np04-governed-persistence-windows`,
   and the PR #8 branch all remain exactly where they are).
3. **No pull request** is opened from the new ref; **PR #8** is not merged and not otherwise
   modified; **PR #118** is untouched; `main` is untouched.
4. **No promotion, merge, cherry-pick, re-pin or admission** of the off-main G24 lineage, and the
   designated execution basis remains `6828155…` — the new ref is **not** substituted for it.
5. **No re-execution**: provisioning is not repeated and the live store is not touched; the ref
   publishes the existing commit only.
6. **If the PA approves**: the publication is performed as a **separate subsequent act**, and that
   act appends a short publication note to the executed record (§14) or adds a companion record in
   this same workstream — so that the record's *executed-act* statements remain historically
   accurate and the new ref state is durably recorded. The existing evidence files are otherwise
   unmodified.
7. **If the PA declines, amends, or defers**: the derivative remains local-only, the published
   record remains accurate as it stands, and no further action is taken. No substitute ref, bundle
   location, or informal channel is created in place of the decision.

---

## 5. EXACT PROPOSED DECISION TEXT (for the Program Authority to render)

> **Proposed decision — derivative-ref publication.** Publish the exact Gate A derivative commit
> `2ded0e981407b38c73bdea164153f53856aa7217` (parent `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`,
> tree `9069045d3daf22156020188696fc2f9c2f32bf27`) to **one new ref** on
> `ramkivs/iips-production-market-data`, `refs/heads/gate-a/local-principal-enablement-2026-10-16` —
> created by a single non-forced push of that exact object, with **no** rewrite, amend, or
> substitution; **no other ref created, moved, or deleted**; **no pull request opened** from it;
> **PR #8** and **PR #118** unmerged; **`main`** untouched; **no promotion, merge, cherry-pick,
> re-pin, or admission** of the off-main G24 lineage, which remains unadmitted, and the designated
> execution basis remains `6828155…`. The ref is **NON_PRODUCTION**, carries the A-2/A-3 enablement
> only, is **not** an implementation basis for any later gate, and confers no Gate B/C/D/E, no
> route or write authority, and no P-6/P-8. Publication is performed as a **separate subsequent
> act** that appends a publication note to the executed record (or adds a companion record in the
> same workstream); the existing evidence is otherwise unmodified. **Disposition:**
> `APPROVE` / `APPROVE WITH CHANGES` / `REJECT` / `DEFER`.

**Required confirmations, if the disposition is not `REJECT`/`DEFER`:** (i) the exact ref name;
(ii) that publication constitutes no promotion/admission and does not alter the designated basis;
(iii) that no PR is opened and PR #8 remains unmerged; (iv) the record-keeping form in §4 item 6.

**If the PA's reading is that request §3.3 already authorized this publication** (§2.6), the
disposition may record that finding; the publication would then be executed as a subsequent act on
the strength of **the PA's rendered reading**, not of the agent's inference — and this request
records that it was not so executed at preparation time.

---

## 6. WHAT THIS REQUEST DOES NOT DO

This request: **renders no authority and is not a decision**; **performs no push, no ref creation,
no ref move, no force-push and no deletion**; **creates no pull request and merges nothing**;
**does not modify, re-execute, or re-provision anything** — the live store, the executed record and
the raw-evidence companion are untouched and their published byte identities are unchanged;
**does not repeat Gate A execution, re-run validation, or re-create evidence**; **does not promote,
merge, cherry-pick, re-pin, or admit** any G24-lineage ref; **does not grant or infer** Gates
B/C/D/E, P-6/P-8, route admission, write policy, or any production status; **does not modify the
IRR repository or the ChatGPT Library tracker**.

---

## 7. VERIFIED REFERENCES AT PREPARATION (live remote, read-only)

| # | Reference | Verified value |
|---|---|---|
| 1 | Derivative ref on the remote | **NONE** — `git ls-remote` shows no ref containing `gate-a/local` or `2ded0e9`; ref inventory `heads=34 / tags=4 / pull refs=9` |
| 2 | Designated basis object / carrier ref | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` @ `refs/heads/arena/01a0f308-iips-production-market-data` (unmoved) |
| 3 | `main` (IPD) | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` (unmoved) |
| 4 | Target / governance / pin refs | `arena/01a0e6d9-…` `c1b955b427486dbce6d6a159a448065b9db45dc9`; `arena/01a0f839-…` `12c480b5bf5cfbe0f296fcd12c9189328b915417`; `np04-governed-persistence-windows` `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494` — all unmoved |
| 5 | PR #8 | **OPEN, unmerged** (`mergedAt` null); head `2bde7f9a920671ffdbebc67b50af93a651934753`; 17 files |
| 6 | Executed act record / raw evidence | blobs `2043e876…` / `b42c5c6d…` at that head — unchanged, byte identity previously verified |
| 7 | IRR `main` | `10584439f33dfa9192955c3f74879f20ccaf111e`; IRR PR #118 **MERGED** 2026-10-16T17:52:23Z; DP-1 amendment on `main` (`c71661a1…`) |
| 8 | IRR 503 fence blobs | `frontend/server/owner-context-unavailable.ts` `cb8db45d…`; `frontend/server/user-portfolio-transport.ts` `51704c12…` — **unchanged** |
| 9 | Live store | `/home/user/gate-a-store/ipd-portfolio.sqlite` sha256 `7794e281…ab99e3` — **unchanged**; not opened, not read, not written by this request |

---

## 8. PUBLICATION OF THIS REQUEST

Published through the **existing authorized PR #8 workstream** (`arena/21c63aef-…`) — one added
governance artifact, no competing PR, no implementation file, no schema change, no database change,
no ref created or moved. The added file is the only change in its commit. Nothing else in the
repository, the IRR repository, or the tracker is modified.

*End of request `IIPS-V3-G2-IPD-GATE-A-DERIVATIVE-REF-PUBLICATION-AUTHORITY-REQUEST-2026-10-16-01`
— **PREPARED · NOT AUTHORIZED · NOT A DECISION · NO PUBLICATION PERFORMED**.*
