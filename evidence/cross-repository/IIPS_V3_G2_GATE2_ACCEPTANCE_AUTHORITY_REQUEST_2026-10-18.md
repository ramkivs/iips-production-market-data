# IIPS v3.0 — G-2 Gate 2: Consumer Contract and Gate E Write Policy — Program Authority Acceptance Request

| Field | Value |
|---|---|
| **Request ID** | `IIPS-V3-G2-GATE2-ACCEPTANCE-AUTHORITY-REQUEST-2026-10-18-01` |
| **Status** | **DECISION REQUIRED.** Nothing in this request is decided, granted or inferred by the recording agent. |
| **Decision authority** | **Program Authority** (Ramki), acting as IPD security-contract authority. For G2-D4, also acting in the IRR capacity. |
| **Predecessor** | CV-20 Option A designation `IIPS-V3-CV20-OPTION-A-OWNERSHIP-SOURCE-DESIGNATION-2026-10-18-01` (Gate 1 resolved) |
| **Subjects** | Consumer contract `IIPS-V3-G2-IPD-IRR-PORTFOLIO-CONSUMER-CONTRACT` v1.0.0; Gate E policy `IIPS-V3-G2-GATE-E-PORTFOLIO-WRITE-POLICY-2026-10-18-01` rev 1. Both are in `evidence/cross-repository/` and both are PROPOSED. |
| **Baselines** | IPD `main@2d12413446c29c08f6f357b8ac67e34594f30286`; IRR `main@d32c8122f0ba3cee7f1549c7279d1d53c45cb1d9` |

---

## 1. Why a separate act is required

The Option A selection resolves Gate 1 only. The CV-20 request §4.1 states that Gate 2 requires the contract and write policy to be specified **and accepted by the Program Authority**. Both are now specified. Acceptance is not implied by publication, by the Option A selection, or by any standing authorization.

## 2. Decisions requested

Each decision is independent. For each, the PA may choose **accept / accept with stated changes / reject / defer**.

| ID | Decision | Effect if accepted | Effect if not accepted |
|---|---|---|---|
| **G2-D1** | Accept consumer contract v1.0.0, including the §5.2 C6 application: pre-authorization refusals stay zero-byte; post-authorization outcomes are typed and non-disclosing | Contract becomes the governing IPD↔IRR interface for Gate 3 scoping | Gate 3 cannot be scoped against a governing interface |
| **G2-D2** | Accept Gate E write policy rev 1, including W-5 (mandatory `expectedRevision`) and the W-6 canonical-identity source (IPD Security Master D05 + `IdentityMappingStore.resolveCompanyId` on IPD `main`) | Q5–Q8 become **specifiable** for a future Gate 4 authority. **No** write, implementation or qualification is authorized (W-1). | Q5–Q8 stay blocked on Gate E |
| **G2-D3** | Decide the meaning of Q8 "stop both processes" (`D-GC-G` precondition). Candidate readings: **(a)** stop and restart the IPD process only, while IRR keeps running; **(b)** stop both IRR and IPD processes, then restart both; **(c)** (b) plus a full OS restart of the host. *(No reading is recommended as a decision. Technical note: (b) exercises IRR's statelessness and IPD's store recovery; (c) adds OS-level file-flush coverage.)* | Q8/QE-4 becomes definable for a later Gate 4 authority | Q8 stays unresolved (current state) |
| **G2-D4** | Confirm the tenant-hint reading in the CV-20 record (D-3): IPD's binding is the sole tenant source, and `IIPS_G2_IPC_TENANT_HINT` is IRR-local and never transmitted. **Direct** an IRR-side clarifying note to the DP-1 amendment §3 row for DP-1 clause §6.4 and an IPC-position restatement of DP-1 §4, recorded in IRR under IRR authority. | IRR records become consistent with L-IPC-1 C7/§6.4 | The discrepancy stays recorded (it does not block Gate 1) |
| **G2-D5** | Confirm the default disposition of data under a revoked binding: retained and inaccessible; re-association or purge only by a separate act | Lifecycle semantics fully closed for Gate 4 QE-8 | R-6 stays open (it does not block Gate 2) |

## 3. Explicitly NOT requested here

- **Gate 3 implementation authority (CV-39).** This request is deliberately later and separate, and it cannot be scoped until G2-D1/G2-D2 are decided. When prepared, it must answer at least the following.
  - **Basis:** which IPD-`main` basis hosts the durable store, the A-2 migration, `LocalPrincipalService` and the endpoint. IPD `main` has none today, and the off-`main` G24/Gate A/Gate B lineage is **not** a base (Gate A Decision 1; Gate B act §5.6; D-1).
  - **Storage technology:** which storage technology within IPD ownership (CV-20 residual (c)).
  - **Files and tests:** the exact IPD and IRR files and tests, including IRR C8 loopback/CORS remediation and the IRR `userPortfolioContract.ts` revision for the IPC path.
  - **Durability claims:** how the IPD UI `SessionPortfolioStorePort` stays `SESSION_ONLY` until admission.
- **Execution of Gate A′ or Gate C.** These are already authorized operator actions on the Windows host and are not re-requested.
- Any Gate 4 qualification authority for Q5–Q8, any result acceptance, any Gate 5 admission, any fence change, and any production eligibility.

## 4. Preserved invariants (unchanged by any answer to this request)

IRR `/api/user-portfolios*` stays at HTTP `503 owner-context-unavailable`. IPD stays `SESSION_ONLY`, `durable: false`. DP-2 Option 2F stays in force. No off-`main` lineage is admitted. Windows Gate A′ and read-only Gate C are **not executed**. Q5–Q8 stay outstanding. No release or production claim is made.

## 5. Response template

```text
I, Ramki, as Program Authority (IPD security-contract authority; for G2-D4 also in the IRR capacity), decide:
G2-D1 consumer contract v1.0.0 .......... ACCEPT / ACCEPT WITH CHANGES: … / REJECT / DEFER
G2-D2 Gate E write policy rev 1 ......... ACCEPT / ACCEPT WITH CHANGES: … / REJECT / DEFER
G2-D3 Q8 meaning ........................ (a) / (b) / (c) / OTHER: … / DEFER
G2-D4 tenant-hint reading + IRR note .... CONFIRM / CHANGE: … / DEFER
G2-D5 revoked-binding data disposition .. CONFIRM / CHANGE: … / DEFER
This act grants no implementation, qualification, admission, fence-lift or production authority.
```

---

*Prepared by Arena Agent Mode. No decision is rendered or inferred by the agent.*
