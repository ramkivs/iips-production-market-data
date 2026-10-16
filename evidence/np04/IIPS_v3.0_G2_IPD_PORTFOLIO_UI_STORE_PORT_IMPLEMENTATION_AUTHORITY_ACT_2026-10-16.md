# IIPS v3.0 — G-2 — IPD PORTFOLIO-UI STORE PORT — IMPLEMENTATION AUTHORITY ACT (PROPOSED)

**Act ID:** `np04-g2-portfolio-ui-store-port-2026-10-16-001`

**Act type:** IMPLEMENTATION AUTHORITY ACT — bounded, non-production, IPD-side UI only.

**Decision authority:** RAMKI / Program Authority (IPD side).

**Recording agent:** Arena — recording only. This act authorizes nothing by itself (§A.4).

**Date:** 2026-10-16 (Asia/Calcutta).

**Execution mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED.

**Publication channel:** IPD PR #8 (existing), branch `arena/21c63aef-iips-production-market-data`,
base `main@70b24f0`. No competing PR may be created.

**Status:** `APPROVED — EFFECTIVE (recorded 2026-10-16; see §A.6)`

---

## A.1 Antecedent state (verified before this act was prepared)

| # | Item | Verified value |
|---|---|---|
| 1 | IPD `main` | `70b24f0` — unchanged; no G-2 implementation artifact exists on it |
| 2 | Publication branch / PR | `arena/21c63aef-…` @ `b9f82a6`; PR #8 OPEN/MERGEABLE, 1 file, **0 comments, 0 reviews** |
| 3 | Assessment verdict (G-2 UI reuse) | **UI EXISTS BUT PERSISTENCE PATH MUST BE REPLACED** — workspace, import dialog, broker detection, parsing, normalization, P04 identity resolution, validation and analytics are real and tested; the save target is an in-memory `Map` singleton and no transport/backend exists in IPD `main` |
| 4 | Authority search (read-only) | No IPD authority act exists for the portfolio-UI store port: no act file, no PR comment/review, no repository issue, no branch artifact |
| 5 | Design-only approval | The Program Authority's Option A selection ("in principle, for design only", same-host OS-protected local IPC) **is not implementation authority** and is not relied on here (IRR PR #117 records: no source/configuration change, provisioning, implementation, qualification, successful-write, release, or route-admission authority granted) |
| 6 | Off-main G24 lineage | `6828155e` — evidence only, **not admitted**, not to be promoted, merged, cherry-picked or repinned |
| 7 | DP-2 Option 2F | In force and unrelaxed: unresolved or ambiguous holdings may be previewed and explained, and must be refused for successful persistence |
| 8 | Historical operator bypass | `allowNonProductionBypass` defaulting to `true` in `BrokerImportModal.tsx` is the historical non-production operator bypass shown in the user-provided reference screenshots; it must not be restored or enabled on this path |

**Finding:** the bounded implementation authority required to execute assessment steps 1–3 of the
G-2 report is **not currently recorded**. This act is the instrument by which it may be granted.

## A.2 Purpose

Authorize exactly one bounded change: make the existing IPD portfolio UI depend on an
**asynchronous portfolio store port** instead of an in-memory `Map` as its authority, so that a
durable implementation can later be substituted behind one interface without rebuilding the UI —
**without** creating any durable write, transport, identity mechanism or persistence in this act.

This act is not a security-contract amendment, is not a proposal, and claims no G-2 architecture
approval. It authorizes UI-side dependency inversion only.

## A.3 Authorized scope (exact — nothing outside this table)

| # | File | Permitted change |
|---|---|---|
| 1 | **create** `frontend/src/features/portfolio/portfolioStorePort.ts` | The narrow asynchronous port: portfolio reads, analytics, save; save-refusal vocabulary (including the DP-2 2F refusal); session-scoped adapter over the existing in-memory store; pure helpers for the port save guard and for truthful persistence-status wording. **The interface must contain no owner, tenant, principal, credential, or authorization-scope parameter**, and must refuse a request that carries caller-supplied identity/scope claims. |
| 2 | **modify** `frontend/src/features/portfolio/portfolio-store.ts` | Additive only: identify the in-memory store explicitly as **session-only / non-durable** (documentation and explicit durability markers). Save guards, MERGE/REPLACE consolidation, weight normalization, SHA-256 provenance/lineage digests, broker contribution records and BI-08 content-hash idempotency are **preserved unchanged**; existing public method signatures and behaviour stay intact. |
| 3 | **modify** `frontend/src/features/portfolio/import/ui-broker-import-view-model.ts` | Add an **asynchronous port save path** (await the port, map success/refusal into the existing view-model states) and expose the port save guard and any refusal/durability information for display. Existing synchronous methods (`selectAndProcessFile`, `confirmAndSave`, `buildViewModel`) and their contracts are preserved unchanged. Mapper/ingress semantics are **not** rewritten. |
| 4 | **modify** `frontend/src/features/portfolio/PortfolioWorkspace.tsx` | Consume the port asynchronously for reads/analytics with pending and error states; surface revision conflicts; display **truthful** persistence status; remove any caption that asserts durable persistence where none exists. |
| 5 | **modify** `frontend/src/features/portfolio/BrokerImportModal.tsx` | Set the non-production unresolved-holdings bypass default explicitly **off** for this path; perform the save through the port with a pending state; present the DP-2 2F refusal and the preview-only explanation for unresolved/ambiguous holdings; make no durability claim after a session-scoped save. |
| 6 | **create** `tests/` — one focused port test file | Port-conformance tests (parity of reads, analytics, save outcome and idempotency with the existing store) and save-refusal tests (2F refusal, caller-supplied identity/scope refusal, revision conflict, no mutation on refusal, durability honesty, UI-default and persistence-status truthfulness). |

## A.4 Required behaviours settled by this act

| Ref | Requirement |
|---|---|
| **A** | **DP-2 Option 2F refusal is enforced at the port/save boundary and at the modal default.** Unresolved or ambiguous holdings are refused for persistence on this path. Existing mapper/ingress semantics are **not** rewritten merely to disable the bypass on this UI path. |
| **B** | **The asynchronous port is added alongside the existing synchronous API.** Existing synchronous callers and their contracts are preserved: `PortfolioStore.saveHoldings(portfolioId, holdings, options)`, `PortfolioBrokerImportController.selectAndProcessFile(...)` and `PortfolioBrokerImportController.confirmAndSave({ portfolioStore, ... })` keep today's signatures and behaviour. |
| **C** | **Existing portfolio arithmetic, consolidation, idempotency and provenance behaviour is preserved** — including exact-100.0000% weight normalization, volume-weighted merge consolidation, content-hash idempotency, and the SHA-256 provenance/lineage digests. The session adapter delegates to the existing store rather than reimplementing it. |
| **D** | **The UI must not represent an in-memory save as durable, and must not display `COMMITTED (Atomic)` without a real durable commit.** Persistence wording is driven by the port's declared durability; on the session-only adapter the workspace and modal must state the session-only, non-durable condition. |
| **E** | **Unresolved or ambiguous holdings may be previewed and explained, but cannot be saved through this path** — refusal, not silent acceptance and not fabricated identity. No canonical `companyId` may be invented to make a save succeed. |

## A.5 Explicit exclusions (this act grants none of these)

- No IPC client, endpoint, service, or transport of any kind.
- No durable adapter, SQLite, file store, or G24 integration; **no promotion, merge, cherry-pick or repin of the off-main G24 lineage**.
- No provisioning and no identity mechanism (no owner, tenant, principal, credential or authorization-scope acquisition).
- **No durable writes**; nothing may be persisted anywhere outside the existing in-memory session store.
- No amendment to the IPD security contract; the rev-2 proposal on PR #8 remains a proposal.
- No change to IRR's HTTP 503 fence and no route admission of any capability.
- No modification of unrelated files, no new governance document other than this act, and no second/competing PR.
- No qualification, certification, release, or production authority of any kind.
- This act does not authorize its own scope beyond the table in §A.3 and the behaviours in §A.4.

## A.6 Approval block — the act is ineffective until this table is completed

| Field | Value |
|---|---|
| Approver | RAMKI / Program Authority (IPD side) |
| Decision | `APPROVED` — as written (no limits recorded, no scope expansion) |
| Decision date | 2026-10-16 (Asia/Calcutta) |
| Decision channel | Arena session decision — Program Authority approval relayed through the operator session |
| Verbatim decision wording | "APPROVED as written — record and execute steps 1–3" (selected decision option, 2026-10-16) |
| Recorded by / recording commit | Arena (recording agent) — approval recorded on branch `arena/21c63aef-iips-production-market-data` (PR #8): status line and closing note in `f9a499a`; approval table completed in the commit that follows `8c9ef08` |

**Recording correction (2026-10-16).** The approval decision was taken before any source edit and the
status line plus closing note were published in `f9a499a`. That commit did **not** include the approval
table above (a concurrent-edit artifact left it reading `PENDING`), so at implementation commit `8c9ef08`
the published act was internally inconsistent — it asserted approval while the table was incomplete.
The table is completed by the commit immediately following `8c9ef08`. The decision itself, its date, its
channel and its verbatim wording are unchanged, and the executed scope is exactly §A.3 under §A.4.

**Effect of approval:** only the bounded scope of §A.3 under the requirements of §A.4, executed on the
existing branch and PR #8. **No approval of this act may be inferred from:** the design-only Option A
selection; the existence of this document; PR #8 being open, reviewed, or merged; the single-user
product scope; any standing or routine-work authority; or G-2 architecture acceptance.

## A.7 Verification and evidence required before this act is closed

1. Focused port test file passes (conformance + refusal + durability honesty).
2. Existing BI-07 and BI-08 suites pass **unchanged** (no edits to those test files).
3. Type check (`tsc`) clean.
4. Full diff reviewed; scope confined to §A.3.
5. Publication on branch `arena/21c63aef-…` (PR #8) with remote verification of the published commit.
6. Written confirmation that no durable write, IPC, G24 promotion, provisioning, identity mechanism,
   security-contract change, IRR fence change, or route admission occurred.

## A.8 Relationship to other records

- `evidence/np04/IIPS_v3.0_G2_IPD_LOCAL_PRINCIPAL_OS_IPC_SECURITY_CONTRACT_PROPOSAL_2026-10-16.md` — the rev-2 security-contract **proposal** (design only; unchanged by this act).
- IRR PR #117 — the G-2 decision request recording Option A "in principle, design only".
- Off-main G24 lineage `6828155e` — evidence only, not admitted.
- Round-3 assessment (delivered in session) — the A–G verification this act implements steps 1–3 of.

---

*Recording agent note: the approval block in §A.6 is completed and this act is effective for the bounded
scope of §A.3 only. Approval was recorded on the branch before any source edit. The executed change set,
tests and remote verification are reported separately (session report and PR #8).*
