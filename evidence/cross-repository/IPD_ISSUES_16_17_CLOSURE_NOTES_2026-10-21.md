# IPD issues #16 and #17 — closure notes (2026-10-21)

**Purpose.** This record makes durable the two issue-closure notes prepared in the Group B IPD pass of 2026-10-21, together with the evidence each rests on.

**Why the notes are published here rather than on the issues.** The governing token for that pass holds `contents: write` on this repository (branch push succeeded) but is refused `issues: write`: `POST /repos/…/issues/17/comments` and `…/issues/16/comments` both returned **HTTP 403 `Resource not accessible by integration`**. The issue comments and the state transitions therefore remain an **operator action** requiring a token with issue-write scope. The evidence below is unaffected by that permission boundary and is published so the closure decision is reviewable and reproducible.

**Status of each issue at the time of this record:** both **OPEN**, both with **zero comments**, neither labelled, neither linked to a PR.

---

## 1. Issue #17 — closure supported

**Initial verified state.** `#17 OPEN`, created `2026-10-18T14:51:16Z` by `ramkivs`, body = *"Handoff (IRR session `cca03e7d`): CV-39 Gate 3 implementation-authority request …"*, 0 comments.

**Item 1 — Gate 3 (`CV-39`) bounded implementation-authority request — PUBLISHED.**

| Field | Verified value |
|---|---|
| Durable artifact | `evidence/cross-repository/IIPS_V3_G3_IMPLEMENTATION_AUTHORITY_REQUEST_2026-10-18.md` |
| Blob at IPD `main` | **`ac4b402573b165faa771e451bbce6faeeaa4d2e0`** |
| Request ID | `IIPS-V3-G3-IMPLEMENTATION-AUTHORITY-REQUEST-2026-10-18-01` |
| Reconciliation section | **§13 — “Gate 3 authority reconciliation — one-pass verification and G3-D1 to G3-D7 classification”** |

Two honest corrections to the issue's own proposal:

1. The published path and ID differ from the proposed `IIPS_V3_CV39_GATE3_IMPLEMENTATION_AUTHORITY_REQUEST_2026-10-18.md` / `IIPS-V3-CV39-…-01`. The artifact that landed uses the `IIPS_V3_G3_…` name and ID above — same instrument, different label.
2. The request no longer stands as “REQUEST — NOT GRANTED” alone: it now carries additive **§12 (G3-D0 disposition)** and **§13 (G3-D1…G3-D7 classification)**. Downstream of it, `IIPS-V3-G3-IMPLEMENTATION-AUTHORITY-ACT-2026-10-19-02` was published in IRR with its §15 effectiveness rule satisfied (PR #148 → merge `c6fd8d93`; read-back SHA-256 `f4992f9c…`).

**Item 2 — editorial correction to consumer contract v1.0.0 §5.1 — ALREADY REMEDIATED by a better route.**

The residual `26` occurrence described in the issue **no longer exists** at `main`. It was corrected at Program Authority acceptance under **G2-D1** as correction **C-1**:

> **C-1** §5.1 caller-identity key count corrected from 26 to **29** (matches §2 and CV-20 record D-8).

§5.1 now reads “the **29** IPD caller-identity keys (`CALLER_SUPPLIED_IDENTITY_KEYS`, IPD blob `d61f18df…`)”. The header also records **C-2** (IRR route facts: 6 route paths / 12 route/method pairs), **C-3** (OC-3 endpoint/hint env vars are Gate 3 scope) and **C-4** (revoked = non-`ACTIVE`). Contract blob at `main`: **`163eb1f18ce023bb9a06917de99ca279fdb86bf7`**; `G2_CONTRACT_VERSION` stays `'2'`; version stays `1.0.0`.

The proposed editorial patch is **not applied** — applying it would duplicate an accepted correction and re-open settled text. The 29-key contract is authoritative as-is.

**Explicit distinction — what closure is NOT.** Closing #17 records publication of governance artifacts and one accepted editorial correction. It is **not** implementation (no durable store, IPC endpoint, migration or adapter exists on IPD `main`; `src/persistence/**` and `src/ipc/**` are absent), **not** validation (no Gate 3 suite has executed at any exact IPD head; PR #34's exact head carries **zero check-runs**), and **not** acceptance (Gate 3 remains **NOT ACCEPTED / NOT GRANTED**; act §10.1 unmet). It lifts no fence: the `503` owner-context fence, `SESSION_ONLY` / `durable:false` and the 29-key guard are unchanged. Gate 3 candidate PR #34 remains open and unmerged.

---

## 2. Issue #16 — closure supported

**Initial verified state.** `#16 OPEN`, created `2026-10-18T14:47:10Z` by `ramkivs`, title `PERMISSION-TEST-DELETE-ME`, body = `test`, 0 comments.

**Verified result.** A **deliberate repository write-permission probe**, not a defect, question or pending decision. It was created by the IRR-bound Arena session `cca03e7d` moments before that session filed the #17 handoff, and carries no content, acceptance criterion or decision.

**Read-only-boundary cross-reference.** Issue #17 records the boundary this probe established:

> “…verified that it has **read-only** access to this repository (git-receive-pack `403`; Git Data ref-create `403` — the same external-repo integration boundary recorded in the IRR tracker as **`XV-15` Phase 6**). Both items belong to IPD's ownership boundary and must be published from an IPD-bound session/operator, not edited into IRR.”

Two consequences, both preserved: the boundary is a **property of the execution environment**, not of this repository's permission model, and must not be read as an IPD access restriction on legitimate IPD sessions; and because the probing session could not PATCH issues, the probe was left open for an IPD-bound pass.

**Verified vs remaining work.** Verified: the issue is a probe artifact with no content or decision attached, and the boundary is recorded in `XV-15` Phase 6 and issue #17. **No implementation work** attaches to it, and **no acceptance** is claimed or implied by closure. Closing it changes no functionality, route, fence or governance state.

**Not deleted.** Closed, not deleted; the record of the permission boundary is retained. Deletion remains available only on explicit owner instruction.

---

## 3. Operator action required

To complete ROUT-05 / ROUT-06 at the issue layer, an actor with **`issues: write`** should:

1. Post §1 of this record as a comment on **#17** and close it (`completed`).
2. Post §2 of this record as a comment on **#16** and close it (`not planned` or `completed`).
3. Delete neither issue.

*End of record.*
