# IIPS v3.0 — G-2: **GATE A DERIVATIVE REF — PUBLICATION RECORD**

> ## STATUS: **PUBLISHED — `refs/heads/gate-a/local-principal-enablement-2026-10-16` @ `2ded0e9…` — REMOTELY VERIFIED**
> The exact Gate A derivative commit is now on the IPD remote, under the Program Authority's narrow
> ref-publication authorization. **No other ref was created, moved, or deleted; no PR was opened or
> merged; nothing else was published, promoted, admitted, executed, or re-provisioned.**

| Field | Value |
|---|---|
| **Act identifier** | `IIPS-V3-G2-IPD-GATE-A-DERIVATIVE-REF-PUBLICATION-2026-10-16-01` |
| **Artifact type** | **Publication record** (recording the authorized publication and its verification — recording only; grants nothing) |
| **Authority** | **RAMKI — Program Authority**, **narrow ref-publication authorization only**, rendered 2026-10-16 in the G-2 channel (the authorization text is the Authority's; the publication and this record are the Recording Agent's) |
| **Governing prepared request** | `IIPS-V3-G2-IPD-GATE-A-DERIVATIVE-REF-PUBLICATION-AUTHORITY-REQUEST-2026-10-16-01` — blob `79b082c6afbf0e4cd4f2823bec469bfad9a7e36a`, commit `4358b144c61fde6f37b34572d7a868d414fd13e3` |
| **Rendered Gate A decision (underlying act)** | `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01` — blob `08df3b9eb98264e50464f848a96104883f3c624b` |
| **Executed-act record / raw evidence** | blobs `2043e8765777f70ebc109656cd7b0156ee47c739` / `b42c5c6dcbc5f5a5e3b4ef777bc88a6d0b9db229` — **unmodified by this act** |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream) |
| **Published object** | commit `2ded0e981407b38c73bdea164153f53856aa7217` (parent `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`; tree `9069045d3daf22156020188696fc2f9c2f32bf27`) |
| **Destination ref** | `refs/heads/gate-a/local-principal-enablement-2026-10-16` (new; the only ref created) |
| **Publication time (UTC)** | 2026-10-16T18:20Z (authoritative clock: GitHub API HTTP `Date` `2026-10-16T18:21:16Z`) |
| **Production status** | NON_PRODUCTION — A-2/A-3 enablement only; no endpoint, no route, no write |

---

## 1. THE AUTHORIZATION THAT WAS EXECUTED

The Program Authority **explicitly authorized** publication of the exact derivative commit
identified above, under the following terms (as rendered; the strict limits below are the PA's and
are recorded here in substance, not paraphrased into anything broader):

- **Authorized action:** re-verify the exact local commit/parent/tree; confirm the executed record
  and raw evidence identify that commit and remain unchanged; confirm the destination ref does not
  already exist; **push the exact existing commit to the specified new ref using one non-forced
  push**; independently verify the remote ref, commit, parent, tree and relevant source-file
  identities; record the publication result in the existing PR #8 workstream as a separate additive
  governance artifact; and verify that record remotely.
- **Stop condition:** if the commit identity, parent, tree, or destination-ref state differed from
  the specified values, **stop before pushing** and report the exact discrepancy; **no substitution**
  of another commit or destination, and no stop-and-improvise.
- **Strict limits:** create only the single authorized ref; no rewrite, amend, force-push or
  substitution; no PR from the derivative ref; no merge of PR #8; no move or modification of `main`,
  the accepted basis, the designated target, the governance branch, or the NP-04 pin; no promotion,
  merge, cherry-pick, re-pin or admission of G24 lineage; no modification of the live store and no
  repeat of Gate A provisioning; **no alteration of the existing execution record or raw evidence**;
  no advance of Gates B/C/D/E and no P-6/P-8; no endpoint, resolver, route-admission or
  portfolio-write implementation.
- **Channel note:** the authorization was rendered in the G-2 task channel and is recorded here as
  such. This record **does not create, replace, extend, or construe** it, and it is expressly limited
  to the one ref named above.

---

## 2. PRE-FLIGHT VERIFICATION — PERFORMED BEFORE THE PUSH (all four conditions PASS)

| # | Condition | Verified value | Result |
|---|---|---|---|
| 1 | Exact local commit | `2ded0e981407b38c73bdea164153f53856aa7217` (`git cat-file -t` = commit) | ✓ MATCH |
| 1 | Parent | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` | ✓ MATCH |
| 1 | Tree | `9069045d3daf22156020188696fc2f9c2f32bf27` | ✓ MATCH |
| 1 | Scope re-confirmed | 10 files, `+1,572 / −19`; no deletion, rename or mode change | ✓ |
| 2 | Execution record identifies this commit | blob `2043e876…` (sha256 `fcc9a1e9…`): commit ×1, parent ×2, tree ×1 | ✓ |
| 2 | Raw evidence identifies this commit | blob `b42c5c6d…` (sha256 `712edd8f…`): commit ×1, parent ×3, tree ×1 | ✓ |
| 2 | Both artifacts **unchanged** | remote blobs identical to their published values; not altered before or after the push | ✓ |
| 3 | Destination ref does not exist | `git ls-remote` for the ref returned **empty**; `refs/heads/gate-a/*` → **0** refs; inventory before push `34 heads / 4 tags / 9 pull refs` | ✓ ABSENT |
| — | Local object integrity | commit/tree/blobs recomputed from the object store and reproduced from the preserved bundle (sha256 `eeb73553…`) | ✓ |

No stop condition triggered; no discrepancy existed to report.

---

## 3. THE PUBLICATION — ONE NON-FORCED PUSH

```
$ git push origin 2ded0e981407b38c73bdea164153f53856aa7217:refs/heads/gate-a/local-principal-enablement-2026-10-16
 * [new branch]      2ded0e981407b38c73bdea164153f53856aa7217 -> gate-a/local-principal-enablement-2026-10-16
```

A single **non-forced** push of the exact object to a **new** ref (Git reported `[new branch]`,
i.e. a creation — not a forced update). No `--force`, no `+` refspec, no network-refspec deletion,
no other ref named in the command. GitHub's post-push "create a pull request" hint was **not**
acted on: **no PR was opened from this ref** (§5).

---

## 4. INDEPENDENT REMOTE VERIFICATION (post-push, read-only)

| Check | Verified value |
|---|---|
| Remote ref tip (`git ls-remote`, authoritative) | `2ded0e981407b38c73bdea164153f53856aa7217` @ `refs/heads/gate-a/local-principal-enablement-2026-10-16` |
| Remote commit SHA (API read-back) | `2ded0e981407b38c73bdea164153f53856aa7217` |
| Remote parent | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| Remote tree | `9069045d3daf22156020188696fc2f9c2f32bf27` |
| Commit message / author date | `feat(ipd): G-2 Gate A A-2/A-3 enablement on the exact accepted object 6828155` / `2026-10-16T18:04:24Z` (original object, unrewritten) |
| Remote change set | exactly 10 files: `+530` `local_principal.ts`, `+587` `validate.ts`, `+355` `provision.ts`, `+75` `003_local_principal_bindings.ts` (added); `+1`/`+2`/`+1` in `app_identity/index.ts`, `migrations/index.ts`, `migrations/registry.ts` (modified); tests `+3/−3`, `+14/−12`, `+4/−4` — total `+1,572 / −19` |

**Source-file identity — remote blobs vs the local object store (12/12 MATCH):**

| Path | Blob (remote = local) |
|---|---|
| `src/persistence/migrations/003_local_principal_bindings.ts` | `9ba884acc3c554c839a32ca41d0d16bda7e64690` |
| `src/app_identity/local_principal.ts` | `710a47e22e5afc99c1744e11926719fc8356f20a` |
| `src/gate_a/provision.ts` | `b6f780f63278d333fd38c66e1abd2f3b64dcc2ea` |
| `src/gate_a/validate.ts` | `550b9f4b83983d5d57aa29f565f371e5bcbed430` |
| `src/persistence/migrations/registry.ts` | `5d3ab64ae97ab5b6621d01775d4c69d4c0d3301e` |
| `src/persistence/migrations/index.ts` | `92a7b613eda6c8f900b295b23245dd710f199d10` |
| `src/app_identity/index.ts` | `0fcc7aa156fb17165bbc649d4fe181a3e00f2f06` |
| `tests/g24_a_persistence_foundation.test.ts` | `68a2928832099d63960487e4905528fdfc0e5623` |
| `tests/g24_b_migrations.test.ts` | `8395fcc9559677e5ae2990347f7d9d01e3131204` |
| `tests/g24_g_recovery.test.ts` | `86928951b83f9b6ffb37e182813a6055a2c24a96` |
| `src/persistence/migrations/001_initial_schema.ts` (**unchanged**) | `48fcf4d9ef802c2d7e83a6a9411b275221bf6ca6` |
| `src/persistence/migrations/002_audit_event_sequence.ts` (**unchanged**) | `dfe9f027ebeb9a35d47c47d63634a2aec7261944` |

**Agreement with the executed record and raw evidence:** commit, parent, tree and every per-file blob
at the new remote ref **equal the identities recorded in the published executed record (§4) and its
raw-evidence companion** — the publication reproduces the recorded object exactly, and neither
artifact was altered to accommodate it.

---

## 5. INVARIANTS — RE-VERIFIED AFTER THE PUSH

| Invariant | State |
|---|---|
| Other refs moved/modified | **NONE** — `main` `70b24f029842…`; `arena/01a0f308-…` `6828155ec6e8…`; `arena/01a0e6d9-…` `c1b955b42748…`; `arena/01a0f839-…` `12c480b5bf5c…`; `np04-governed-persistence-windows` `2e11fa3b689d…` — all unchanged |
| Ref inventory | `34 → **35** heads` (the single authorized new ref); tags `4` and pull refs `9` unchanged; refs containing `2ded0e9…` = **exactly 1** (the new ref) |
| PR opened from the derivative ref | **NONE** (no PR references that head; open PRs in the repository: 1) |
| PR #8 | **OPEN, unmerged** (`mergedAt` null); workstream branch advanced only by additive documentation commits |
| PR #118 / IRR | untouched; IRR `main` `10584439…`; both 503 fence blobs unchanged |
| Live store | `/home/user/gate-a-store/ipd-portfolio.sqlite` sha256 `7794e28144f29cf8235d5537d076408867636e03e77de996c303676823ab99e3` — **unchanged** (mtime still 18:04:30Z; not opened, not read, not written) |
| Gate A re-execution | **NONE** (no provisioning repeated; one-time act) |
| Execution record / raw evidence | **UNMODIFIED** — blobs `2043e876…` / `b42c5c6d…` unchanged before and after the push |
| G24 lineage | **not promoted, merged, cherry-picked, re-pinned, or admitted**; the designated execution basis remains `6828155…`, and the new ref is **not** substituted for it |
| Gates B/C/D/E; P-6/P-8 | **not advanced, not granted** |
| Endpoint / resolver / route admission / portfolio-write path | **not implemented, not authorized, not touched** |
| Force-push / rewrite / amend | **NONE** (one non-forced creation of a new ref) |

---

## 6. WHAT THIS RECORD DOES NOT DO

This record **grants no authority** and **extends nothing**: it records one authorized ref
creation and its verification, and it is limited to that. It does **not** make the new ref an
implementation basis, a promoted lineage, an admitted ref, or a Gate B precondition; it does **not**
authorize opening a PR from the ref, merging anything, advancing Gates B/C/D/E, granting P-6/P-8,
implementing the endpoint/resolver/route/write path, or touching the live store. The new ref is
**NON_PRODUCTION** and carries only the A-2/A-3 enablement already validated and recorded.

The executed record (§4) and its raw-evidence companion remain **historically accurate as statements
about the executed act** — as of execution, the derivative was local-only and publication was an
outstanding step. This **separate additive artifact** records that the outstanding step has since
been performed under the PA's narrow authorization; it does not amend, and was not permitted to
amend, those two files.

---

## 7. DURABILITY OF THIS RECORD

Committed and pushed as **one added governance artifact** in the existing authorized PR #8
workstream — no competing PR, no implementation file, no schema change, no database change, no
ref created or moved by this record's own commit. Remote ref/commit/blob/tree verification and
byte-identity checking are recorded in the accompanying verification output.

*End of publication record `IIPS-V3-G2-IPD-GATE-A-DERIVATIVE-REF-PUBLICATION-2026-10-16-01` —
**PUBLISHED · REMOTELY VERIFIED · LIMITED TO ONE REF · NON_PRODUCTION**.*
