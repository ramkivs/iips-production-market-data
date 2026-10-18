# IIPS v3.0 — G-2 Gate 2: Consumer Contract and Gate E Write Policy — Program Authority Acceptance Request

| Field | Value |
|---|---|
| **Request ID** | `IIPS-V3-G2-GATE2-ACCEPTANCE-AUTHORITY-REQUEST-2026-10-18-01` |
| **Status** | **DECIDED — ALL FIVE DISPOSITIONS (G2-D1 to G2-D5) APPROVED IN FULL BY THE PROGRAM AUTHORITY on 2026-10-18.** The approved dispositions and their precise terms are recorded in §6. The §§1–5 text below is preserved as published. The recording agent renders no decision of its own and grants no implementation, qualification, admission, fence-lift, write or production authority (see §6.5). |
| **Decision authority** | **Program Authority** (Ramki), acting as IPD security-contract authority. For G2-D4, also acting in the IRR capacity. |
| **Predecessor** | CV-20 Option A designation `IIPS-V3-CV20-OPTION-A-OWNERSHIP-SOURCE-DESIGNATION-2026-10-18-01` (Gate 1 resolved) |
| **Subjects** | Consumer contract `IIPS-V3-G2-IPD-IRR-PORTFOLIO-CONSUMER-CONTRACT` v1.0.0; Gate E policy `IIPS-V3-G2-GATE-E-PORTFOLIO-WRITE-POLICY-2026-10-18-01` rev 1. Both are in `evidence/cross-repository/` and both are PROPOSED. |
| **Baselines** | As published: IPD `main@2d12413446c29c08f6f357b8ac67e34594f30286`; IRR `main@d32c8122f0ba3cee7f1549c7279d1d53c45cb1d9`. **Current baselines verified at recording (see §6.4):** IPD `main@b16d79fa116007f793620119c4c943996a286da2`; IRR `main@b1f1ea0fe9fba31aacae54180e1231f2b06014ba`. |

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

## 6. Recorded Program Authority disposition (2026-10-18)

| Field | Value |
|---|---|
| **Authority** | **Program Authority** (Ramki). The one-pass instruction of 2026-10-18 states that the Program Authority **explicitly approved all five proposed dispositions, G2-D1 through G2-D5, in full**. This section records that approval as given. It does not treat the approval as tentative and does not ask for it again. |
| **Recording** | Arena Agent Mode, recording only. The agent adds no decision, no option and no authority. Where the approval needed a technical detail that the proposal left undefined, the narrowest evidence-backed correction is made in §6.2 and labelled. |
| **Effect** | Gate 2 is **satisfied** for consumer contract v1.0.0 (G2-D1) and Gate E write policy rev 1 (G2-D2), each to the extent stated in §6.5. **Gate 3 (CV-39) is NOT granted.** |

### 6.1 Approved dispositions and precise terms

| ID | Approved disposition | Precise recorded terms | Where recorded |
|---|---|---|---|
| **G2-D1** | **ACCEPT** consumer contract v1.0.0, including the §5.2 C6 application | Accepted as the governing IPD↔IRR interface for Gate 3 scoping, **subject to** the final record defining: the versioned consumer interface; IPD's ownership-resolution responsibility; failure behaviour for unavailable, invalid, ambiguous and revoked ownership; the supported operations and explicit refusal behaviour; and the IPD/IRR responsibility split. Checked against the record: each of these is defined in contract §4/§8 (versioned interface, wire `v = 1`), §3 OC-2 (IPD resolves ownership per request), §5.1 and §7 (failure classes), §6 (closed operation set, `portfolio.analytics` reserved) with §5.2 (typed refusals), and the "Owning repository" row with §9 IRR-1 to IRR-7 (split). The §5.2 C6 application is accepted as written. | Contract `evidence/cross-repository/IIPS_V3_G2_IPD_IRR_PORTFOLIO_CONSUMER_CONTRACT_V1_2026-10-18.md` (status now ACCEPTED); corrections C-1 to C-4 in §6.2 |
| **G2-D2** | **ACCEPT** Gate E write policy rev 1, including W-5 (mandatory `expectedRevision`) and the W-6 canonical-identity source | Accepted **fail-closed**. Q5–Q8 become *specifiable* for a future Gate 4 authority. Acceptance does **not** grant Gate 3 implementation authority, authorize durable writes, qualify any implementation, admit portfolio routes, lift the IRR HTTP 503 fence, or authorize production use. Every later prerequisite stays a separate explicit act (W-1). | Policy `evidence/cross-repository/IIPS_V3_G2_GATE_E_PORTFOLIO_WRITE_POLICY_2026-10-18.md` (status now ACCEPTED rev 1); W-16 and §4 updated per §6.2 |
| **G2-D3** | **Option (b): stop and restart both the IRR and IPD processes** | Recorded as the lifecycle and qualification requirement for the Q8 / QE-4 check: create → durable commit → **stop both IRR and IPD processes** → **restart both** → byte-for-byte read-back. **No OS reboot requirement is added.** Option (c) is **not** selected. Any later move to a host reboot requires documented evidence that restarting both processes is insufficient, and that change must itself be recorded. | Policy §4 precondition note (QE-4) and CV-20 record R-5 (dated notes) |
| **G2-D4** | **The tenant hint is non-authoritative input** | Recorded as the semantic rule in §6.3. The hint does not establish ownership. IPD validates any hint against the active provisioned local-user binding. Request headers, cookies, query parameters and request bodies cannot override the authoritative ownership source. IRR documentation must not describe the hint as an independent ownership source. IRR-side clarifications are recorded in IRR under IRR authority (DP-1 amendment, PKG-02A, tracker §16.51); IPD-side clarification is recorded in L-IPC-1 by dated note. | §6.3; contract OC-3; L-IPC-1 §4/§6.4 dated note; CV-20 record D-3 |
| **G2-D5** | **Retain data while denying access through the revoked binding** | Approved requirements: (1) deny subsequent reads **and** writes through the revoked binding; (2) do **not** automatically transfer data to a replacement binding; (3) do **not** silently delete data merely because a binding was revoked; (4) require an explicit, governed **recovery, reassignment or deletion** action before retained data can become accessible again; (5) define and test the failure behaviour before qualification or admission. This is an approved policy **for future implementation**. It is **not** represented as implemented or tested. | Contract §7 and Gate E W-16 (dated notes); CV-20 record §4.5 and R-6 |

### 6.2 Corrections made under this disposition (additive, narrow, labelled)

Each correction was checked against the cited source at the verified remote commit. No accepted decision (G-2, D-2, H-18, DP-2 Option 2F, L-IPC-1 clauses, the DP-1 amendment's other clauses) was changed.

| # | Record | Correction | Source verified |
|---|---|---|---|
| **C-1** | Consumer contract §5.1 (`CALLER_SUPPLIED_AUTHORITY` row) | "the **26** IPD caller-identity keys" corrected to **29**. The contract's own §2 and the CV-20 record §4.8 already state 29; this removes the residual "26". Correction D-8 (CV-20 record) is now applied throughout the contract. | IPD `main` `frontend/src/features/portfolio/portfolioStorePort.ts` blob `d61f18dfdce12a7f0c4377a3c6d410026d454089`, `CALLER_SUPPLIED_IDENTITY_KEYS` = 29 entries (counted), none of the six named keys present |
| **C-2** | Consumer contract §2 and §6 (IRR route facts) | The IRR route table is **6 route paths, 12 route/method pairs including HEAD** (not "6 route/method pairs"). The §6 `portfolio.reset` row said "none on IRR today"; the fenced route `POST /api/user-portfolios/:portfolioId/reset` **exists** on IRR `main` and returns 503. The fenced `GET`/`HEAD /api/user-portfolios/context` route maps to **no** v1 operation. | IRR `main` `b1f1ea0` `frontend/server/user-portfolio-transport.ts` blob `51704c12a467cd2f718a030b5036bc55c9afa73f`, `USER_PORTFOLIO_ROUTES` (6 entries) |
| **C-3** | Consumer contract OC-3 (IRR configuration) | `IIPS_G2_IPC_ENDPOINT` and `IIPS_G2_IPC_TENANT_HINT` are **not present on IRR `main`** (no reference in any tracked file at `b1f1ea0`). They appear only in off-main Gate B design evidence (CV-20 record §3). The contract now says so; the existence and naming of IRR configuration is Gate 3 scope. | IRR `main` `b1f1ea0` (`git grep` for both names: no match) |
| **C-4** | Consumer contract §5.1 (`BINDING_ABSENT` / `BINDING_INVALID`) and §7 | Makes explicit that **revoked** is a non-`ACTIVE` state and is therefore a Class P refusal, per the approved failure requirements. No new code is introduced. | CV-20 record §4.5 (revocation is one-way; `REVOKED` row retained) |

Status and baseline fields of the contract and of the Gate E policy were updated to ACCEPTED, with the baseline refresh in §6.4.

### 6.3 G2-D4 — tenant-hint reconciliation (precise references)

**Approved rule (core terms).** The hint is non-authoritative input. It does not establish ownership. IPD validates any hint against the active provisioned local-user binding. Headers, cookies, query parameters and bodies cannot override the authoritative source.

**The reported wording discrepancy.**

| Position | Source (precise reference) | Wording |
|---|---|---|
| Original DP-1 §6.4 (historical, 2026-10-13) | IRR `docs/integration/IIPS_v3.0_GATE_C_S5A_DP1_OPTION_1A_PRIME_BINDING_CONTRACT_AND_PREREQUISITE_SPECIFICATION_2026-10-13.md`, blob `c3a5596af0469f2f4316ffe9b0da522fefeba96b` | The hint "is validated by G24 against the membership table" (G24 = the CV-50-closed HTTP path). |
| DP-1 amendment §3, row "§6.4" (IRR, 2026-10-16) | IRR `docs/integration/IIPS_v3.0_G2_IRR_DP1_IDENTITY_CREDENTIAL_TRUST_AMENDMENT_2026-10-16.md`, blob `c71661a1ee445b2348cedfedae4aef6449029ebb` | "The hint remains a hint, **validated by IPD**, and fails closed." Same wording repeated in four IRR Gate B records (request and decision 2026-10-16; D4 decision and PA rendered decision 2026-10-17). |
| L-IPC-1 rev 2 §6.4 (accepted text blob `cab04b6f94618c9afad1440882ebf63437fdf6f8`) | IPD `evidence/np04/IIPS_v3.0_G2_IPD_LOCAL_PRINCIPAL_OS_IPC_SECURITY_CONTRACT_PROPOSAL_2026-10-16.md` | Row "`resolveTenant()` + exactly-one-`ACTIVE` rule": "Caller tenant *hint* is **unnecessary** on this path: the binding's membership is the **sole tenant source** for the endpoint." Clause **C7** requires IPD to refuse tenant claims. |
| L-IPC-1 rev 2 §4 table, row "Caller tenant value" | same file | "`x-ipd-tenant-id` is a **hint only**, validated against memberships" — this describes the **G24 HTTP** path, not the IPC path. |

**Origin of the discrepancy.** The DP-1 amendment's "validated by IPD" wording carries over the G24 HTTP validation semantics (the §4 row on `x-ipd-tenant-id`, and original DP-1 §6.4) into the IPC position. The amendment states that §6.4 was amended "in source attribution only", so the validation wording was not re-stated for the IPC path. L-IPC-1 §6.4, which governs the IPC path, says the hint is unnecessary.

**Reconciled reading recorded under G2-D4** (the narrowest reading consistent with the approval and with accepted L-IPC-1 C7 and §6.4):

1. The hint has **no authority**. It does not establish ownership.
2. IPD's **ACTIVE binding** (single `ACTIVE` A-2 row plus exactly one `ACTIVE` membership) is the **sole** source of ownership and tenant. This is the authoritative source named in G2-D4.
3. In contract v1 **no tenant hint is transmitted**. IRR must not send one (OC-3). IPD refuses any frame carrying a tenant hint or tenant-identity key as `CALLER_SUPPLIED_AUTHORITY` (C7; contract §5.1), so the only tenant value IPD ever uses is the one it derives from the binding.
4. IRR's server-side hint configuration, if it exists at Gate 3, is an **IRR-local "binding provisioned" precondition** and is not an input that IPD consumes.
5. The phrase "validated by IPD" in the IRR records is **historical G24-path wording**. It must not be read as making the hint an independent ownership source. Dated clarification notes are recorded in the IRR records listed above, under IRR authority.

**Open point for Program Authority attention (not blocking; not decided here).** Read literally, "IPD validates any hint against the active provisioned local-user binding" presupposes that IPD receives a hint. Accepted L-IPC-1 C7 and §6.4 forbid that on the wire. The reconciliation above keeps the approved semantics without changing the wire. If the Authority intends IPD to receive and check a hint on the wire, that is a **change to the accepted wire contract** (a C7 and contract revision), which requires a separate act. Nothing in this disposition implements or assumes it.

### 6.4 Baseline refresh verified at recording

| Repository | Cited in request | Current `main` verified | Intervening change |
|---|---|---|---|
| IPD | `2d12413446c29c08f6f357b8ac67e34594f30286` | `b16d79fa116007f793620119c4c943996a286da2` (PR #15 merge; follows PR #14) | Compare `2d12413…`→`b16d79f…`: 4 commits, **7 files, all under `evidence/cross-repository/`** (documentation only; no `src/`, `frontend/` or `tests/` change) |
| IRR | `d32c8122f0ba3cee7f1549c7279d1d53c45cb1d9` | `b1f1ea0fe9fba31aacae54180e1231f2b06014ba` (PR #134 merge) | `d32c812`→`b1f1ea0`: **3 documentation files**; **zero** changes under `frontend/`, `iips-platform/` or `src/` |

The fence, boundary and contract-relevant blob identities cited in the contract were checked at `b1f1ea0` and are unchanged from the values cited at `d32c812`.

### 6.5 Not granted by this disposition

Acceptance of G2-D1 and G2-D2 does **not**, and this disposition does **not**:

- grant Gate 3 implementation authority (CV-39) or authorize any IPD or IRR implementation;
- authorize durable portfolio writes, or enable any `durable: true` claim on IPD `main` (IPD remains `SESSION_ONLY` / `durable: false`);
- qualify any implementation, or execute or accept Gate A′, Gate C, or Q5–Q8 (Gate 4);
- admit any portfolio route, or lift the IRR `/api/user-portfolios*` HTTP `503 owner-context-unavailable` fence (Gate 5 / CV-52);
- promote, merge, cherry-pick or re-pin any off-`main` lineage (`6828155e`, `2ded0e98`, `cec70802`, `6c654be7`, `110e221f`, `470cc698`/`5eba01b6`);
- change G-2, D-2, H-18, DP-2 Option 2F, L-IPC-1 clauses, or the DP-1 amendment's non-tenant clauses;
- authorize login, OIDC, authentication, RBAC, multi-user, tenant-directory or enterprise elements, or production use.

### 6.6 Residual items after this disposition

| ID | Residual | Owner | Needed before |
|---|---|---|---|
| R-4 | IRR-side DP-1 §6.4 clarification and §4 IPC-position restatement | IRR (recorded in IRR under IRR authority) | Gate 3 (IRR adapter) |
| R-5 | Q8 meaning | **Resolved: G2-D3 option (b)** | — |
| R-6 | Mechanism for any future re-association of revoked-binding data | Program Authority (a separate act, if ever wanted). The default disposition is **resolved** by G2-D5. | Any re-provisioning act |
| CV-20 (a), (c), (d) | Qualification-authority choice; storage technology within IPD ownership; G-2 §3 single-user reading | Program Authority | Gate 3 request (`IIPS_V3_G3_IMPLEMENTATION_AUTHORITY_REQUEST_2026-10-18.md`) |
| Q5–Q8 | Gate 4 qualification on the Windows deployment host | Operator and Program Authority (separate acts) | Gate 4 |

---

*Prepared by Arena Agent Mode. No decision is rendered or inferred by the agent.*
