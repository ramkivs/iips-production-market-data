# IIPS v3.0 — IPD `CV-25` — G24 SECOND-PIN RECONCILIATION ACT

> ## STATUS: **RENDERED — AUTHORIZES ONE EXACT ANNOTATED TAG — NO OTHER G24 RELIEF**
> This is the narrow reconciliation act required by the CV-25 determination. It authorizes one tag
> on the still-designated `6828155e` commit, and nothing else. The act does not move or rewrite the
> protected branch, does not change the `AD-03` designation, and does not authorize promotion,
> merge, cherry-pick, admission, or any other G24 re-pin.

| Field | Value |
|---|---|
| **Act ID** | `IIPS-V3-IPD-CV25-G24-SECOND-PIN-RECONCILIATION-ACT-2026-10-18-01` |
| **Type** | Program Authority ref-creation act and narrow G24 reconciliation |
| **Authority** | Program Authority / owner, as named in the governing records; the 2026-10-18 task instruction directs CV-25 to closure and directs this required act to be rendered without redundant approval. The instruction supplies the authority; this record fixes its narrow operative terms. |
| **Repository** | `ramkivs/iips-production-market-data` (IPD) only |
| **Rendered** | 2026-10-18 (UTC) |
| **Production status** | `NON_PRODUCTION` |
| **Companion determination** | `IIPS_v3.0_IPD_CV25_G24_TAG_REQUIREMENT_DETERMINATION_2026-10-18.md` |
| **Publication ref for this act** | Current session branch `refs/heads/arena/fb46926b-iips-production-market-data`; additive documentation only; no PR or merge is authorized by this act. |

---

## 1. VERIFIED GOVERNING STATE AND ACCEPTANCE CRITERION

The following controlling material was re-read before rendering:

1. The complete CV-25 determination, especially §§2–6: it identifies the conflict, says a tag on
   `6828155e` is a durable re-pin in substance, and requires an express decision, exact name and
   target, explicit tag format, preservation of all other G24 limits and the standard ref-act
   evidence set.
2. The rendered Gate B implementation-authority decision, §4: it withholds **“G24 promotion,
   merge, cherry-pick, re-pin, or admission”** and prohibits moving `main` or any other ref.
3. The Gate A rendered decision and execution record, and the Gate A derivative-ref publication
   record: they preserve the exact accepted G24 basis and record that G24 lineage was not promoted,
   merged, cherry-picked, re-pinned, or admitted.
4. The current authoritative IRR tracker, read-only at `ramkivs/iips-review-recovered` `main`:
   commit `a0a897045880878cbbdd30e3cc17747164b3b3de`, tracker blob
   `6c1ad8acf0becaf3e45b0852471dde2d2d0ed799`, §16.4.2. Its CV-25 row records **PARTIALLY
   EXECUTED (1 OF 2 TAGS)**, names `iips-pin-np04-2e11fa3b` on `2e11fa3b…` as the verified first
   limb, and defines acceptance as `git ls-remote origin 'refs/tags/*'` showing **both pins by tag**.
   The required second pin is `6828155e…` while it remains the `AD-03` designated reference.
   IRR and its tracker are read-only and will not be modified in this task.

### Live preconditions re-verified

| Check | Result before act publication / tag execution |
|---|---|
| Required second target | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`, object type `commit` |
| Protected ref | Remote `refs/heads/arena/01a0f308-iips-production-market-data` = `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| Existing first tag | Remote `refs/tags/iips-pin-np04-2e11fa3b` = annotated tag object `8e91cc7029ce14cf353a9f138c826906239b05c6`; peeled target `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494` |
| Proposed second tag name | `iips-pin-g24-6828155e`; no such remote tag ref exists |
| Current distinct tag count | 5 tags (6 `ls-remote --tags` lines, because the existing annotated tag has a peeled line) |

The two source targets are distinct. The first tag and its tag object are explicitly preserved.

---

## 2. EXPRESS RECONCILIATION DECISION — ELEMENT 1

**Decision:** Creating a durable, read-only tag on `6828155e` **does constitute a “re-pin” in
substance for purposes of the existing G24 prohibition**. The tag's read-only character does not
make it fall outside that prohibition: it creates a durable ref to the protected G24 object. This
follows the CV-25 determination and does not reinterpret the existing Gate A / Gate B records.

**Narrow resolution:** The Program Authority expressly authorizes a **single, one-object exception
only to the “re-pin” limb** of the G24 restriction, solely to create the exact tag and target in §3
for the CV-25 acceptance test. It is not a general rule that tags are outside G24, and it does not
permit another name, target, tag, or re-pin. The new ref is a tag ref; no existing ref is moved.

This is the narrowest decision that reconciles the known prohibition with the live CV-25 acceptance
criterion without treating a tag as harmless by definition or implying broader authority.

---

## 3. EXACT AUTHORIZED REF — ELEMENTS 2–4

Create **exactly one annotated tag**:

| Field | Exact authorization |
|---|---|
| **Tag name** | `iips-pin-g24-6828155e` |
| **Full ref** | `refs/tags/iips-pin-g24-6828155e` |
| **Target commit** | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| **Format** | **Annotated** (`git tag -a`), not lightweight |
| **Annotation message** | `IIPS v3.0 G24 AD-03 designated-reference pin — 6828155e — CV-25 durable reference` |
| **Tagger** | `ramkivs <302525469+ramkivs@users.noreply.github.com>` (repository-configured identity) |
| **Signing** | Not required; unsigned status must be recorded accurately. |

The second-limb tracker acceptance test requires both target commits to resolve from tag refs; it does
not require that the second tag be lightweight. Annotated format is selected expressly here for an
inspectable tag object and full object/peeled-target evidence. No existing tag will be changed.

---

## 4. EXPLICIT LIMITS — ELEMENT 5

Only the one exact `re-pin` described in §3 is excepted. **No other G24 §4 prohibition is lifted.**
In particular, this act does not authorize:

- G24 promotion, merge, cherry-pick, or admission;
- any other G24 re-pin or any other tag, target, branch, or ref creation;
- moving `main` or any existing ref, or rewriting, deleting, or force-updating any ref;
- changing the `AD-03` designation or replacing the designated commit with a descendant;
- changing the IRR dependency, package pin, lockfile, or tracker;
- reopening or acting on D2b, Windows Gate C, or any excluded work; or
- any implementation, product admission, durable-write, production, deployment, or certification
  authorization.

The act is non-production and additive. It creates only the named tag after publication of this act.

---

## 5. PROTECTED REF PRESERVATION — ELEMENT 6

`refs/heads/arena/01a0f308-iips-production-market-data` **must remain exactly at**
`6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`. It will not be moved, rewritten, deleted, or
force-updated. The tag is additive and does not replace that branch or the `AD-03` designation.
The existing `iips-pin-np04-2e11fa3b` tag object and peeled target must also remain unchanged.

---

## 6. REQUIRED STANDARD REF-ACT EVIDENCE — ELEMENT 7

The separate execution receipt must record and verify all of the following before CV-25 is reconciled:

1. The created tag-object SHA and object type (`tag`), plus the peeled target SHA and object type
   (`commit`).
2. Exact remote `git ls-remote --tags` read-back for the tag object and peeled `^{}` line.
3. Independent fresh-clone resolution of the tag to the exact target, including object/type checks.
4. Reachability of the target from the preserved `arena/01a0f308-…` ref and its unchanged remote tip.
5. Distinct tag count before and after (with annotated-tag peel lines not miscounted as separate
   tags), plus the original `iips-pin-np04-2e11fa3b` object and peeled target before/after.
6. A complete advertised-ref inventory before and after the tag push, compared by ref name and
   object ID, confirming that the only ref change in the tag-execution step is creation of the
   authorized `refs/tags/iips-pin-g24-6828155e`.

No execution or completion is claimed by this act file alone. The act is to be durably published on
the current session branch before the authorized tag is created; its publication must itself be
read back from the remote. The execution receipt and CV-25 record update will follow only after
independent remote verification.

---

*End of act `IIPS-V3-IPD-CV25-G24-SECOND-PIN-RECONCILIATION-ACT-2026-10-18-01` — one exact tag only; all other G24 restrictions and protected refs preserved.*
