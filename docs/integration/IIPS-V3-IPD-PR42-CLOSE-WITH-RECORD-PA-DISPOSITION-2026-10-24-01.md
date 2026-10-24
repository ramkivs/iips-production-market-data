# IIPS v3.0 — IPD PR #42 Program Authority Disposition: Close With Record

| Field | Value |
|---|---|
| **Record** | `IIPS-V3-IPD-PR42-CLOSE-WITH-RECORD-PA-DISPOSITION-2026-10-24-01` |
| **Subject** | IPD PR **#42** — `Gate 3: act-conformant IPC candidate with connection-slot release`, branch `arena/feda2d8c-iips-production-market-data`, head `afa430900c3e928773bd35a3718bf3d6c94ccff5`, tree `f0b27857574e651f42a848deb137bc050f0f2b74` |
| **Decision-maker** | Program Authority (PA) |
| **Decision date** | `2026-10-24` (Asia/Kolkata; no time-of-day supplied) |
| **Decision source** | The PA's explicit approved disposition, issued as a one-pass execution authorization to the operating session on 2026-10-24, prepared against decision package §3 of the same date and DQ-6a option **(i)** of `IIPS-V3-CAP03-PA-DECISION-PACKET-DQ1-DQ7-2026-10-24-01` |
| **Status** | **DECIDED — PR #42 TO BE CLOSED AS A HISTORICAL CANDIDATE; NO ADMISSION PATH OPENED** |
| **Governing locus** | **IPD `ramkivs/iips-production-market-data`** (this record + the IPD execution tracker). This is a *provider-locus* disposition and renders nothing in the IRR locus; IRR registers it by dated receipt only |
| **IPD baseline verified before preparation** | `main@5a34fa880c441cc21c1dee653784308beb2265d3` (tree `5e239c7338c2016ce12fc7d3ae9254cbdbfadd60`) — the instruction's baseline, zero drift |
| **Companion authority** | `IIPS-V3-G3-ACCEPTANCE-2026-10-22-01` (Gate 3 `ACCEPTED — bounded implementation scope only`) — **preserved unchanged** by this record; PR #41 merge `d15582d68167461e814ec8f7873dc18e3df5ab71` at `main@1cceacff…`, post-merge CI `39765365164` `success` (`784 / 783 / 0`) |

> **Rendered PA decision — IPD PR #42: CLOSED AS A HISTORICAL CANDIDATE, WITHOUT MERGING.**
>
> No admission path is opened. Nothing in PR #42's content is transferred, merged, rebased or cherry-picked.

## 1. Identity and disambiguation (mandatory first section)

**This record concerns IPD PR #42 only.** Two distinct records carry the number *42*, and conflating them has caused recurring confusion:

| | **IPD PR #42 — this disposition** | **IRR historical PR #42 — NOT this disposition** |
|---|---|---|
| Repository | `ramkivs/iips-production-market-data` | `ramkivs/iips-review-recovered` |
| Subject | Gate 3 IPC candidate (22 files, `+5,137/−0`) | 2026-10-06 Reports-domain paths |
| State | `OPEN` / draft / `CONFLICTING` | merged 2026-10-06 **without effective authority** |
| Recorded disposition | **this record** | `R4-B` (CV-09) + the H-4/H-16 errata record (`9303ae5c…`, IRR PR #154 merge `c6240fa4…`, CI `39222216957` `SUCCESS`) — **CLOSED (documentary correction applied)** |
| Touched here | yes (close) | **no** — not re-opened, not amended, not re-litigated |

## 2. Decision

1. **IPD PR #42 is CLOSED, NOT MERGED.** Its head and tree — `afa430900c3e928773bd35a3718bf3d6c94ccff5` / `f0b27857574e651f42a848deb137bc050f0f2b74` — and its second commit `54123307dd0c5576f46a756bda26e2b74b9b85d8` are **preserved on the record** as historical candidate identity. The head is **not an ancestor** of `main` and, on close, remains reachable from the retained branch ref for audit.
2. **No rebase, cherry-pick, force-push, content transfer or re-creation** of any PR #42 byte is authorized. The branch is **not a basis for any work**.
3. **PR #42 contributed and contributes zero Gate 3 evidence.** It was never part of the accepted baseline (`IIPS-V3-G3-ACCEPTANCE-2026-10-22-01`). PR #41's native-Windows result does **not** transfer to any PR #42 head (`Q3-A`; two `§4.2` implementation files and three `§4.3` test files differ).
4. **No admission path is opened.** No file of PR #42 is admitted by this record, and closing the PR grants nothing.
5. **Conditional future trigger (recorded, not activated).** *If* Gate 4 host execution identifies a **Windows pipe-collision defect** attributable to the accepted line, the PA **may** authorize a **bounded port re-derived on current `main`** — limited to `src/ipc/endpoint.ts`, `src/ipc/entrypoint.ts` and the three corresponding test files, with fresh exact-head native-Windows validation — **under a separate PA act**. This record does not authorize that port, does not schedule it, and creates no expectation of it. Absent such an act, the default is **no action**.
6. **Preserved unchanged:** Gate 3 acceptance and the accepted Gate 3 implementation; PR #41 and PR #34 history; Gate A′ / Gate 4 (`AUTHORIZED — NOT STARTED`, `QE 0/11`) / Gate C / Gate 5; `SESSION_ONLY` / `durable:false`; `WRITE_NOT_AUTHORIZED`; all `503` fences; provisioning (not executed); H-12 (**NOT ADOPTED**); DR-2/DR-3/DR-4r (**UNRESOLVED**); DQ-1…DQ-7 (**PROPOSED — NOT EFFECTIVE**).
7. **DQ-6b is untouched.** The `iips-broker-import` alias pin `70b24f029842a7e9b7f615e4d9df7376fd4ff817` and the primary pin `2d9130e76bb0dc89daeefabaf297e27bdaa84250` are unchanged; the dual-pin question remains sequenced at the DQ-4 freeze and is **not** answered here.

## 3. Evidence basis (re-verified at this head; nothing re-investigated)

| # | Fact | Verified value (`2026-10-24`, read-only GitHub API + full-history clone) |
|---|---|---|
| E1 | PR state | `OPEN`, **draft**, `mergeable: CONFLICTING`, `mergeStateStatus: DIRTY`; `createdAt 2026-10-22T10:43:47Z`; `updatedAt 2026-10-22T10:53:06Z` — **no activity for two days** |
| E2 | Head / tree / parent | `afa430900c3e928773bd35a3718bf3d6c94ccff5` / `f0b27857574e651f42a848deb137bc050f0f2b74` / `54123307dd0c5576f46a756bda26e2b74b9b85d8` (2 commits, 22 files, `+5,137 / −0`) |
| E3 | Distance to `main` | **2 ahead / 89 behind** `main@5a34fa88…` (full history; the DQ packet recorded 2 / 79 — the gap has widened by 10) |
| E4 | Merge-base | `c0e1b56…` (2026-10-21) |
| E5 | Content identity vs **current** `main` | **12 of 22 blobs byte-identical** to `main`; **10 differ** (6 source + 4 test). §4 lists them |
| E6 | `main`-only files absent from #42 | `src/persistence/brokerImportPersistence.ts`, `gateAPrimeProvisioning.ts`, `gateAPrimeValidation.ts`, `migrations/004_portfolio_contribution_provenance.ts` |
| E7 | Unique residual substance | `main`'s `src/ipc/endpoint.ts` (`e565aa5b…`) **has** `EndpointCollisionError` but **no** `EACCES`/`EPERM`/`EBUSY` mapping; #42's `fe49c783…` adds that mapping (Windows named-pipe first-instance codes). This is the **only** clearly unique hardening, and it is observable only on a Windows host |
| E8 | Superseded content | #42's second commit already adopted PR #41's connection-slot release, which is **on `main`**. `binding.ts`, `portfolio_store.ts` and `durablePortfolioStorePort.ts` differ because **`main` advanced** (U7 `WRITE_NOT_AUTHORIZED`, CAP-02, contribution provenance), not because #42 leads |
| E9 | Evidence class | **Zero Gate 3 contribution**; native Windows **NOT RUN** for this head; hosted CI `39765282842` was green at that head — **diagnostic only**, never authority |
| E10 | Merge availability | Merging as-is is **prohibited**: `CONFLICTING`, outside any effective act, and duplicating accepted work (DQ-6a option **C** was recorded `Not available`) |

## 4. The exact ten-file boundary (`main@5a34fa88…` vs `afa4309…`)

| Path | `main` blob | PR #42 blob | Class |
|---|---|---|---|
| `src/ipc/dispatch.ts` | `27becc76…` | `6c8fcbc8…` | source (`main` advanced) |
| `src/ipc/endpoint.ts` | `e565aa5b…` | `fe49c783…` | source — **unique Windows collision-code hardening** |
| `src/ipc/entrypoint.ts` | `ae3edd12…` | `5189ac1a…` | source (`main` advanced) |
| `src/persistence/binding.ts` | `96d0079d…` | `4c5ea0d5…` | source (`main` advanced) |
| `src/persistence/durablePortfolioStorePort.ts` | `d95608d9…` | `97c5bc65…` | source (`main` advanced — U7) |
| `src/persistence/portfolio_store.ts` | `4a005b73…` | `2ee96301…` | source (`main` advanced) |
| `tests/g3_ipc_framing.test.ts` | `c4a4a88a…` | `87154445…` | test |
| `tests/g3_no_network_listener.test.ts` | `b1e48c70…` | `57b3381d…` | test |
| `tests/g3_portfolio_read_isolation.test.ts` | `69e36f68…` | `7b978625…` | test |
| `tests/g3_startup_validation.test.ts` | `edd0305e…` | `9514e4ce…` | test |

**Byte-identical (12):** `src/ipc/protocol.ts`, `src/persistence/audit.ts`, `connection.ts`, `migration_ledger.ts`, `migrations/001_initial_schema.ts`, `migrations/002_audit_event_sequence.ts`, `migrations/003_local_principal_bindings.ts`, `provisioning.ts`, `tests/g3_binding_resolution.test.ts`, `tests/g3_caller_authority.test.ts`, `tests/g3_durability_vocabulary.test.ts`, `tests/g3_write_gate.test.ts`.

## 5. Explicit non-grants

Not granted, implied or scheduled by this record: any merge or admission of PR #42 or of any of its blobs; any rebase, cherry-pick, force-push or content transfer; the conditional port (which requires its own act); any Gate 3/4/5 movement or re-acceptance; result acceptance; qualification; provisioning; H-12 adoption; `durable:true`; any `503` fence lift; production eligibility; any pin change (primary or alias) or any DQ answer — **DQ-6b remains open and untouched**; any IRR-locus change; any re-opening of the IRR historical PR #42 matter.

## 6. Effectiveness and the closure act

The disposition is **rendered by this record** and is effective on publication to IPD `main` with green exact-head CI and independent remote read-back, per the locus's own effectiveness terms. The **closure act** (setting PR #42 to `closed`, without merging) is executed by the operating session immediately after that publication and is recorded — with its verified post-state, timestamps and immutability evidence — in the tracker receipt of the same date. **A record is not effectiveness; the closure is not admission.**

## 7. Non-transfer to the IRR locus

This record renders **no** IRR decision. The IRR-side counterpart acts of the same date (`CV-23`, `CV-43`) are rendered in their own locus and are independent of this disposition. IRR's registration of this IPD act is by dated receipt only and imports no authority back.

---

*Prepared by Arena Agent Mode from the PA's approved disposition; recording, publication and closure execution only. No independent authority is rendered by the recording agent.*
