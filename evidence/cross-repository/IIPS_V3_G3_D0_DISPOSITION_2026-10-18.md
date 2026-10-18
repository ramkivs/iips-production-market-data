# IIPS v3.0 — G3-D0 Resolution: IPD Gate B D-4 and the IPD-main Implementation Basis

| Field | Value |
|---|---|
| Decision ID | `IIPS-V3-G3-D0-DISPOSITION-2026-10-18-01` |
| Decision authority | Program Authority (Ramki), IPD authority capacity |
| Decision source | The Program Authority's explicit disposition supplied for this G3-D0 handoff on 2026-10-18; recorded here without enlarging it |
| IPD repository | `ramkivs/iips-production-market-data` |
| IPD `main` at independent verification | `f678363de5db1486aa6c52be79e4d290380fdd27` (remote `refs/heads/main`; verified before this documentation change) |
| Related records | G3 request `IIPS-V3-G3-IMPLEMENTATION-AUTHORITY-REQUEST-2026-10-18-01`; rendered Gate B D-4 `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-DECISION-2026-10-17-01`; L-IPC-1 rev 2 §14 row B |
| Status | **G3-D0 RESOLVED — RE-AUTHOR THE INTENDED IMPLEMENTATION BASIS ON IPD `main`. IMPLEMENTATION AUTHORITY FOR THE NEW BASIS IS NOT GRANTED BY THIS DISPOSITION.** |

## 1. Rendered disposition

> **G3-D0 — RESOLVED: Supersede the off-main implementation basis and re-author the intended implementation basis on IPD `main`, explicitly reconciling the existing Gate B grant before any implementation proceeds.**
>
> The intended implementation basis is IPD `main`; any future implementation must be newly authored on that basis under a separate, explicit authority act. The existing Gate B designated-ref implementation is not an admitted base, must not be promoted, merged, cherry-picked, re-pinned, or treated as the basis for the intended implementation. This disposition does not itself authorize any new implementation, durable write, qualification, admission, route activation, fence lift, or production use.

This records the user's explicit decision. It does not infer authority beyond its words and the boundaries below.

## 2. Reconciliation of the prior Gate B D-4 grant

The rendered IPD Gate B decision record remains historically intact and accurately records **D-4 = ACCEPT** for its original scope: exactly the 15 enumerated new files on `refs/heads/gate-b/local-principal-ipc-implementation`, based on `2ded0e981407b38c73bdea164153f53856aa7217`, subject to its recorded paired-IRR-D-4 precondition and its express restrictions. The published ref is independently verified at `cec7080252183a6a5332efe351e61c254d342a2d`. The grant did not authorize durable portfolio writes, G24 promotion, Gate C qualification, route admission, Gate E write policy, production, or merge to `main`.

This G3-D0 disposition does **not** rewrite or retroactively misstate that historical grant or its already-published result. It prospectively supersedes the designated-ref implementation as the basis for the intended implementation path under G3: the `cec7080` code remains historical/reference evidence only and is **not** to be reused as an admitted implementation base. Any further work on that ref, or any reliance on its grant for the re-authored main-line scope, requires an explicit separate authority act. Nothing here creates, moves, deletes, merges, or admits a Git ref.

The separate IRR Gate B D-4 record is IRR-owned. This IPD disposition neither amends nor withdraws that IRR act, and does not authorize IRR implementation or change IRR runtime behavior.

## 3. Main baseline and next authority act

At the time of independent verification, IPD `origin/main` was exactly `f678363de5db1486aa6c52be79e4d290380fdd27`, matching the reported starting SHA. This is the verified pre-documentation baseline for this disposition. The documentation publication will advance `main`; therefore a subsequent authority act **must name the exact post-publication IPD `main` commit SHA** as its implementation basis and may not rely on a floating `main` label or on `f678363` if the branch has advanced.

The next authority act must separately name the exact repository and main commit, bounded file set, tests, restrictions, and any required prerequisites. The remaining requested decisions in G3-D2 through G3-D7 (including storage technology, write slice, provisioning-code inclusion, treatment of the older durable line, single-user reading, and IRR scope) remain open unless separately answered by the Program Authority. No implementation scope is granted here.

## 4. L-IPC-1 §14 reconciliation and preserved scope

L-IPC-1 rev 2 §14 row B requires the Gate B act to state whether an IPD-`main` implementation basis exists or must be created, and its dated note excludes the off-main lineage as a base. G3-D0 resolves the previously recorded contradiction consistently with that requirement: the intended basis will be re-authored on IPD `main`; the designated-ref implementation is reference evidence only. This does not amend L-IPC-1, G-2 architecture, the consumer contract, or Gate E policy.

Preserved without relaxation:

- IPD portfolio persistence on `main` remains `SESSION_ONLY` / `durable: false`.
- IRR `/api/user-portfolios*` remains HTTP 503 (`owner-context-unavailable`).
- No durable writes, off-main promotion, route admission, 503 lift, qualification, or production release.
- Windows Gate A′ and Gate C remain unexecuted unless separately performed under their applicable authority.
- No authentication, OIDC, RBAC, multi-user/tenant architecture, PostgreSQL, enterprise deployment assumptions, runtime configuration change, or broader scope is introduced.

## 5. Verification and publication facts

Before authoring this record, the IPD worktree was clean at `f678363de5db1486aa6c52be79e4d290380fdd27`; `git ls-remote origin refs/heads/main` independently returned that same SHA. The Gate B ref independently resolved to `cec7080252183a6a5332efe351e61c254d342a2d`. The rendered D-4 record and L-IPC-1 §14 row B were read from the IPD repository. The G3 request and CV-20 designation record identified the contradiction and cross-references.

This file is an additive decision record and does not itself implement or qualify product behavior. PR, CI, merge, and post-merge remote verification are recorded in the publication receipt added after the documentation PR completes.
