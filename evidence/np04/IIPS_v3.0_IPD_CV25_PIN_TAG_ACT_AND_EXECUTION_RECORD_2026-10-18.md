# IIPS v3.0 — IPD GROUP 1 / `CV-25` — PIN TAG ACT AND EXECUTION RECORD

> ## STATUS: **RENDERED — AUTHORIZED — EXECUTED**
> `IIPS-V3-GROUP1-D3-IPD-PIN-TAG-ACT` is rendered by the Program Authority's instruction of
> **2026-10-18** and executed in this act: **one annotated tag**, `iips-pin-np04-2e11fa3b`, on
> `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494`. No branch was created or moved, no IRR file changed,
> no pin changed, and **`6828155e` was not tagged** — that item still has no act and no authority.

| Field | Value |
|---|---|
| **Act ID** | `IIPS-V3-GROUP1-D3-IPD-PIN-TAG-ACT` |
| **Act type** | Ref-creation act — one annotated tag, one target, nothing else |
| **Repository** | `ramkivs/iips-production-market-data` only |
| **Governing act text** | `IIPS_v3.0_GROUP1B_AUTHORITY_HOLDS_AND_PROPOSED_ACTS_2026-10-17.md` §3 (Proposed Act B) and `IIPS_v3.0_GROUP1B_IPD_CI_PUBLICATION_AND_VALIDATION_RECORD_2026-10-17.md` §4.4 |
| **Authority** | **Ramki** — Program Authority / owner / sole user; instruction of **2026-10-18** |
| **Prior disposition superseded** | **`2026-10-17`: "Create no tags — record CV-25 as still decision-required."** Superseded **only for the `2e11fa3b` tag**, by the later instruction (§1.2) |
| **Execution date** | 2026-10-18 (Asia/Calcutta) |
| **Production status** | NON_PRODUCTION |

---

## 1. Rendering, provenance, and why this is an act rather than a proposal

### 1.1 The PA instruction

> **"let proceed with IPD bound group 1 pending work items."** — Ramki, 2026-10-18, operating channel.

The instruction was supplied with the two IPD-bound Group 1 items identified by name, **`CV-25`** and
**`D2b`**, and with `CV-25` described as the pin/tag item to resolve. It is an instruction to
**proceed with the work**, not a request to prepare it.

### 1.2 The prior disposition, recorded rather than erased

On 2026-10-17 the Program Authority rendered, verbatim:

> **Create no tags — record CV-25 as still decision-required.**

That disposition stands in the record and is **not** rewritten. A later instruction by the same
authority supersedes it **for this act only**: the 2026-10-18 instruction directs the IPD-bound Group 1
pending items to proceed, and `CV-25` is one of the two. The `6828155e` item — which never had an act
and which the same instruction forbids touching — is **not** affected (§5).

### 1.3 Why the rendering requirement is satisfied

The 2026-10-17 record set an execution gate (Proposed Acts §5): the PA must render the act, and the
rendered text must name the exact object. Here:

- the **object is immutable and fully specified** by the governing text — tag name, target commit,
  annotated type, message and tagger are all fixed, so **no discretionary element remains** for the
  Authority to choose;
- the 2026-10-18 instruction **names the work item and directs it to proceed**;
- the acting session performed **no subjective selection**: it created the one tag, on the one
  commit, with the one message that the governing text fixes.

This record is the rendering record. Arena did not originate the decision, did not choose the target,
and did not widen the object.

---

## 2. The exact object authorised and created

| Field | Value |
|---|---|
| **Tag name** | `iips-pin-np04-2e11fa3b` |
| **Target commit** | `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494` |
| **Tag type** | **annotated** (`git tag -a`) — lightweight not acceptable |
| **Tag message** | `IIPS v3.0 NP04 governed-persistence runtime pin — 2e11fa3b — CV-25 durable reference` |
| **Tagger identity** | `ramkivs <302525469+ramkivs@users.noreply.github.com>` (repository-configured maintainer identity) |
| **Signing** | not required; **unsigned**, and that fact is recorded rather than implied |
| **Nothing else** | no branch created or moved, no other tag, no IRR change, no re-pin |

---

## 3. Preconditions — verified live before execution (2026-10-18)

| # | Precondition (governing text §3.B.2) | Verified value | Result |
|---|---|---|---|
| 1 | Target reachable and identical to the commit IRR consumes | `2e11fa3b…` is a **commit**, tree `7c1d516a43153f9c4e1b09bfa259d16da1704bb0`, parent `bd5229d01955feb0757bb1aa33252f9dc49dd68f`, dated 2026-10-02, subject *"Expose NP-04 persistence package"*; IRR `frontend/package.json:17` pins exactly that SHA (and `package-lock.json` carries it) | **PASS** |
| 2 | No tag of that name exists | `git ls-remote --tags origin` shows **4 tags**, none named `iips-pin-*`; the working repository has no such tag | **PASS** |
| 3 | The target exports the consumed subpaths | `package.json` at `2e11fa3b` exports **`./pit`**, **`./d114-non-production`**, **`./persistence`**; `tsconfig.pit-package.json` builds exactly `src/pit/package.ts`, `src/d114/non_production_package.ts`, `src/persistence/package.ts` | **PASS** |
| 4 | The only ref containing the target remains the np04 branch | Remote: `refs/heads/np04-governed-persistence-windows` → `2e11fa3b…` is the sole branch; local `git for-each-ref --contains 2e11fa3b` returns that ref alone | **PASS** |
| 5 | Protected ref untouched | `6828155e…` reachable only from `refs/heads/arena/01a0f308-iips-production-market-data`; **no tag**, no movement, no act | **PASS (untouched)** |

---

## 4. Execution and independent verification (2026-10-18)

| Step | Verified result |
|---|---|
| Local tag creation | `git tag -a iips-pin-np04-2e11fa3b 2e11fa3b… -m "IIPS v3.0 NP04 governed-persistence runtime pin — 2e11fa3b — CV-25 durable reference"` |
| **Tag object** | **`8e91cc7029ce14cf353a9f138c826906239b05c6`** — object type **`tag`** (annotated, not lightweight) |
| **Peeled target** | **`2e11fa3b689d1a3674a5e4ba1f1de9a559e20494`** — object type `commit` |
| Annotation body | `IIPS v3.0 NP04 governed-persistence runtime pin — 2e11fa3b — CV-25 durable reference` |
| Tagger | `ramkivs <302525469+ramkivs@users.noreply.github.com>` — epoch `1792300669` (`+0000`) |
| Signing | **unsigned** — no signing key is configured; recorded, not implied |
| Push | `git push origin refs/tags/iips-pin-np04-2e11fa3b` → `* [new tag]  iips-pin-np04-2e11fa3b -> iips-pin-np04-2e11fa3b` |
| Remote read-back (`git ls-remote --tags`) | `8e91cc7029ce14cf353a9f138c826906239b05c6  refs/tags/iips-pin-np04-2e11fa3b` **and** `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494  refs/tags/iips-pin-np04-2e11fa3b^{}` — the peeled line equals the target exactly |
| REST read-back | `GET /git/ref/tags/iips-pin-np04-2e11fa3b` → `{"ref":"refs/tags/iips-pin-np04-2e11fa3b","object":{"type":"tag","sha":"8e91cc70…"}}`; `GET /git/refs/tags` lists **5** tag refs |
| **Fresh-clone verification** | A new clone (`/tmp/tagverify`, depth 1) fetched the tag and the np04 branch: `cat-file -t` = **`tag`**; `rev-parse iips-pin-np04-2e11fa3b^{commit}` = **`2e11fa3b689d1a3674a5e4ba1f1de9a559e20494`**; annotation and tagger read back byte-identically |
| Tag count | **4 → 5** (four lightweight + one annotated; `ls-remote --tags` prints **6** lines because the annotated tag has a peeled `^{}` line — 6 lines ≠ 6 tags) |
| Branch heads | **All unmoved** — `main` `e040002a…`, `gate-a/…` `2ded0e98…`, `gate-b/…` `cec7080…`, `np04-…` `2e11fa3b…`, `6828155e…` on `arena/01a0f308-…` |
| `6828155e` | **No tag**; reachable only from its branch; untouched |

## 5. What this act does **not** authorise or establish

| Boundary | State |
|---|---|
| **`6828155e` (G24 lineage)** | **NOT tagged**, not moved, not re-pinned, not promoted, merged, cherry-picked or admitted. No act proposes it; the earlier record holds that a durable tag there would be a durable re-pin in substance and would need its own act reconciling that prohibition. **No such act exists** |
| Any other commit or tag | Not tagged; the act is single-object |
| Branch creation or movement | **None** — the np04 branch head is unchanged |
| IRR repository | **Not modified** — no `package.json`, lockfile, tracker or file changed; no re-pin |
| Durability of the store | The tag is a **reference**, not a store; no durable persistence is created, admitted or claimed (`SESSION_ONLY` remains) |
| Gate B / C / D / E, P-6, P-8, production | Untouched, unexecuted, not implied |
| Promotion / admission | None |

---

## 6. IRR-side follow-up (not executable from this session)

1. **`CV-25` register disposition** — the authoritative register lives in the IRR master tracker
   (`CV-25`, §16.4/§16.43.2). Updating it requires an IRR write-capable session; this record does not
   claim it was updated.
2. **`npm ci` against the pin** — the governing act requires an IRR-side read-only verification that
   the existing SHA pin still resolves. Nothing in this act changed IRR's pin, so the resolution
   target is unchanged by construction; the execution proof remains an IRR-side step.
3. Any future decision to re-pin IRR **to the tag** is a **separate IRR-owned act**; this act does
   not change the dependency string.

---

## 7. Publication and remote verification (appended 2026-10-18)

**Content commit:** `c53ac74` — parent `afa09e7` — the same commit that publishes the companion `D2b`
determination. CI on it: run **`39100067963`** — **success**, `typecheck · build · test`, **556
executed / 0 failed**.

The **execution and read-back in §4 occurred after** that publication, which is why they are recorded
here by this subsequent commit. The blob and SHA-256 of this record's **final** content are recorded
in the PR #8 verification comment and in the final report — deliberately **outside** the file, so the
record does not purport to hash itself.

**What is authoritative for the tag act is not this file's hash but the tag object:** `8e91cc70…`,
annotated, peeled to `2e11fa3b…`, read back from the remote and from a fresh clone (§4). The record
documents the act; the tag is the act.

---

*End of act `IIPS-V3-GROUP1-D3-IPD-PIN-TAG-ACT` — **RENDERED · EXECUTED · ONE ANNOTATED TAG ·
`6828155e` UNTOUCHED · NON_PRODUCTION**.*
