# IIPS v3.0 — G-2 Gate E: User-Portfolio Write Policy and Canonical-Identity Source — Revision 1

| Field | Value |
|---|---|
| **Policy ID** | `IIPS-V3-G2-GATE-E-PORTFOLIO-WRITE-POLICY-2026-10-18-01` |
| **Revision** | **1** (2026-10-18) |
| **Status** | **PROPOSED: NOT ACCEPTED · NOT EFFECTIVE.** Acceptance requires a separate Program Authority act (`IIPS-V3-G2-GATE2-ACCEPTANCE-AUTHORITY-REQUEST-2026-10-18-01`, decision G2-D2). |
| **Gate** | **Gate E**: "Write policy / canonical identity: designate the resolution source for the write path and the successful-write policy" (L-IPC-1 §14; acceptance decision §8 row 5) |
| **Owning repository** | **IPD** (owner of the portfolio domain, store and write path; G-2 §1) |
| **Depends on** | CV-20 Option A designation `IIPS-V3-CV20-OPTION-A-OWNERSHIP-SOURCE-DESIGNATION-2026-10-18-01`; consumer contract `IIPS-V3-G2-IPD-IRR-PORTFOLIO-CONSUMER-CONTRACT` v1.0.0 (PROPOSED) |
| **Baselines** | IPD `main@2d12413446c29c08f6f357b8ac67e34594f30286`; IRR `main@d32c8122f0ba3cee7f1549c7279d1d53c45cb1d9` |
| **Production status** | `NON_PRODUCTION`; production is **NOT AUTHORIZED** |

> **This policy grants no implementation authority.** It defines what a *permitted* write would be **if and when** separately authorized, implemented, qualified and admitted. Defining permitted behaviour is **not** permission to build it, enable it, or claim it. Until W-1's four conditions are met, every write operation is refused (`WRITE_NOT_AUTHORIZED`), IPD `main` stays `SESSION_ONLY` / `durable: false`, and IRR `/api/user-portfolios*` stays at HTTP `503 owner-context-unavailable`.

---

## 1. Why Gate E is required and what it unblocks

- L-IPC-1 "presumes **no** successful writes" (§14 row E). Gate B (IPD/IRR, off-`main`) refuses every write (`WRITE_NOT_AUTHORIZED`; `refuseUnresolvedPortfolioWrite`).
- Gate C (`D-GC`) **deferred Q5–Q8** "to a Gate E-dependent phase because each requires the write policy Gate E owns" and fixed the result label `PARTIAL — Q5–Q8 DEFERRED`.
- G-2 §3 requires: lifecycle and retention; reset and deletion; concurrency and version semantics; server-side authorization; owner isolation; auditability; and durable preservation of contribution, lineage and idempotency. This policy states those rules for the write path.

Acceptance of this policy would **only** make Q5–Q8 *specifiable*. It would not make them *authorized* or *executed* (see §5).

---

## 2. Policy rules

### W-1 Authority preconditions (all four required; none implied by another)

A write operation (`portfolio.create`, `portfolio.save`, `portfolio.reset`, `portfolio.delete`) may succeed **only** when all of the following hold:

1. this policy is **accepted** by the Program Authority (Gate 2);
2. a **Gate 3** implementation-authority act names the exact repository, IPD-`main` basis, file set and tests for the write path;
3. a **Gate 4** qualification run covering §4 has been executed on the deployment host **and** accepted by a separate result-acceptance act;
4. a **Gate 5** admission act names the qualified IPD and IRR commits and lifts the IRR `503` fence for the named operations.

Otherwise IPD returns Class A `WRITE_NOT_AUTHORIZED` (after authorization) or refuses earlier, and performs **zero** store mutations.

### W-2 Authorization

- The principal is the single `ACTIVE` A-2 binding, resolved per request (CV-20 §4.3). There is no other source.
- Every write is authorized against `(applicationUserId, tenantId, portfolioId)`. For `create`, the new portfolio is bound to the resolved pair.
- Any caller-supplied principal, owner, tenant, scope or identity field is refused before any store access (C7; contract §5.1).

### W-3 Binding re-validation inside the transaction

The binding (and its single `ACTIVE` membership) is re-read and checked **inside the same immediate/serialized transaction** that performs the mutation. If the binding is not `ACTIVE` at that point, the transaction aborts with no effect. A revocation that commits first therefore always wins over a racing write.

### W-4 Atomicity and mutation boundary

- One request equals one transaction equals at most one new immutable revision. The outcome is all-or-nothing.
- A refused or failed write creates **no revision, no holding row, no contribution row and no success response** (C12.6).
- No write touches more than one portfolio. There are no batch or bulk writes, no cross-portfolio operations, no binding/membership/tenant mutation through the endpoint, and no schema or migration change at request time.

### W-5 Concurrency

- `expectedRevision` is **required** on `save`, `reset` and `delete`. A missing value is `INVALID_REQUEST`; a mismatch is `REVISION_CONFLICT`. *(Tightening relative to the off-`main` G24 store and the IRR port, where the field is optional. Stated here so it is decided, not assumed.)*
- `create` takes no `expectedRevision`. The new portfolio starts at `revision: 1`, operation `INITIAL`.
- Each committed mutation increments the revision by exactly 1. Revisions are immutable.

### W-6 Canonical-identity source (the Gate E designation)

- **Proposed source:** IPD's existing **Security Master (D05)** with point-in-time resolution via `IdentityMappingStore.resolveCompanyId` on IPD `main` (`src/identity/security_master.ts` `e260fd90d05e5bfcd4bdc037524722c6fccee16d`, `src/identity/mapping_store.ts` `eec60c09e08ec45a29979abf25b21efddef448ae`, quarantine codes `src/identity/quarantine.ts` `70c6f6580f6ade66eb31e7dee3adc4b52b10b010`). This reuses the "sole identity authority" recorded in L-IPC-1 §7.1. No new resolver is created, and the deferred FIGI resolver is not resurrected.
- A holding persists only with **exactly one** IPD-side resolution. Zero (`UNMAPPED_IDENTIFIER`) or conflicting (`AMBIGUOUS_COLLISION`) matches refuse the **whole** request with `REFUSED_UNRESOLVED_IDENTITY` **before** serialization, port call or persistence, with per-holding quarantine evidence (DP-2 Option 2F; C12.3–C12.4).
- Caller-supplied `companyId`, `runtimeCompanyId`, `identityStatus` and `resolutionDisposition` are refused (Class P). Ticker-shaped values are never canonical (C12.2).
- **No bypass.** `NON_PRODUCTION_OPERATOR_BYPASS` is neither emitted nor accepted. The offline UI-qualification bypass (`GOV-REC-2026-NON-PROD-OPERATOR-BYPASS-01`) is not extended to this path (C12.5).
- **Universe disclosure:** this policy does **not** widen the governed universe (CV-22). Holdings outside the Security Master coverage will be refused, and that is correct behaviour, not a defect to be bypassed.

### W-7 Store guards and prohibited reuse

- The existing consolidation guards apply (empty vector, weight-sum guard, invalid fields → `REFUSED_STORE_GUARD`).
- The verified off-`main` gap **must not be reused as-is**: `validateHolding()` defaults (`companyId: ''`, `identityStatus: 'RESOLVED'`, `resolutionDisposition: 'CANONICAL_P04'`) and the Save-Guard `NON_PRODUCTION_OPERATOR_BYPASS` branch (L-IPC-1 §7.3; Gate B act §5.3).

### W-8 Idempotency

- **Content idempotency (BI-08):** a `save` whose `contentDigest` matches an already-committed contribution, with mode ≠ `REPLACE`, returns `ALREADY_IMPORTED_NO_OP` and creates **no** revision.
- `requestId` is correlation only, never an idempotency key or authority. v1 defines no request-level idempotency key.
- `save`/`reset`/`delete` are protected against double application by W-5: a replay after a committed mutation yields `REVISION_CONFLICT`.

### W-9 Retry and outcome-unknown

- IRR must **not** automatically retry any write.
- A timeout or connection loss after a write request is sent is **outcome-unknown**. It is surfaced as unavailable, never as success or failure. The client reconciles by reading (`portfolio.get` / `portfolio.revisions` / `portfolio.list`) before any re-attempt.
- *Known limitation:* a re-attempted `create` after an outcome-unknown first attempt can produce a second portfolio. Mitigation in v1 is reconcile-by-list before retry. A request-level create key would be a contract major revision.

### W-10 Permitted mutation semantics

| Operation | Effect | Revision operation |
|---|---|---|
| `create` | New portfolio bound to the resolved owner pair; empty holdings | `INITIAL` |
| `save` `MERGE` | Merge canonically resolved holdings into the current set; new contribution record with SHA-256 lineage | `MERGE` |
| `save` `REPLACE` | Replace the current holding set; new contribution set started; prior revisions preserved | `REPLACE` |
| `reset` | Portfolio identity preserved; governed empty revision; new contribution set started; history preserved | `RESET` |
| `delete` | **Tombstone.** Historical revisions preserved; afterwards the portfolio is `RESOURCE_UNAVAILABLE` (never disclosed); no physical erase | `DELETE` |

No other mutation is permitted.

### W-11 Durability claims

- A write is acknowledged as successful **only after** its transaction is durably committed to the designated durable store. `durable: true` / `'DURABLE'` is reported only in that case.
- The `SESSION_ONLY` path (IPD `main` today) is never labelled durable or `COMMITTED`.
- **No "durable portfolio capability" claim** of any kind, whether in UI, documentation, tracker or evidence, is permitted before the Gate 4 result-acceptance act. A green unit-test, store-level or preview result does not qualify (L-IPC-1 §10).
- Storage technology on an IPD-`main` basis is **not** chosen by this policy (CV-20 residual (c)). The policy is technology-neutral: commit-on-acknowledge, crash atomicity, migration-ledger verification at startup.

### W-12 Recovery

- **Crash or kill during a write:** on restart the store holds either the full committed revision or none of it, with no partial state. This must be demonstrated (§4 QE-7).
- **Startup:** `validate → connect → migrate → verify → bind`. Unverified migrations or store faults mean no endpoint and no fallback (C2/C5.3).
- **Backup/restore:** operator-local only (the Gate A pattern of a pre-run backup and restore on failure). No automated backup is claimed. **No manual repair of rows.**
- **Revision conflict:** recovered by re-read, then explicit re-submission with the new `expectedRevision`.

### W-13 Lineage and contribution preservation

`BrokerContributionRecord` SHA-256 lineage, broker attribution and `contentDigest` are persisted with each committed contribution and are preserved across restart and across `REPLACE`/`RESET`, which start new sets without erasing history.

### W-14 Audit

- Portfolio mutations are auditable through their immutable revision records (operation, revision, timestamp, contribution lineage).
- Binding and membership lifecycle is audited by the local A-3 line (Gate A Decision 5).
- No cross-system audit destination is created or implied.

### W-15 Refusal conditions (exhaustive for writes)

Class P: framing/version/operation violation, caller-supplied authority, binding absent/invalid/ambiguous/revoked, capacity. Class A: `WRITE_NOT_AUTHORIZED` (W-1), `INVALID_REQUEST` (shape or missing `expectedRevision`), `RESOURCE_UNAVAILABLE` (missing/foreign/tombstoned), `REVISION_CONFLICT`, `REFUSED_UNRESOLVED_IDENTITY`, `REFUSED_STORE_GUARD`, `UNAVAILABLE`. Every refusal has **no store effect**.

### W-16 Retention

- Portfolio data: **indefinite preservation; no automatic purge** (G-2 implementation record §8 item 3). `delete` is a tombstone. Purge is **not authorized**.
- Data under a revoked binding is **retained and inaccessible**. Re-association to a re-provisioned principal or purge requires a separate act (CV-20 residual R-6).

---

## 3. Amendments

**This policy amends no accepted record.** Specifically:

- **L-IPC-1:** no clause amended. Contract v1 §5.2 records how C6 applies to post-authorization outcomes, for PA acceptance.
- **DP-2 Option 2F, G-2, D-2, H-18, DP-1 amendment:** unchanged.
- **Gate C (`D-GC`):** unchanged. Q5–Q8 remain deferred until a Gate 4 qualification authority act. Q8 remains unresolved until the Authority decides its meaning.
- **W-5** tightens future implementation behaviour (mandatory `expectedRevision`) relative to unadmitted off-`main` code and the IRR port signature. Neither is an accepted authority record, so this is not an amendment.

---

## 4. Evidence required for later qualification (Gate 4; not authorized here)

Executed on the **Windows deployment host**, after Gate A′ provisioning, against the Gate 3 implementation at recorded digests, with raw output published:

| ID | Evidence | Maps to |
|---|---|---|
| QE-1 | Canonical identity: one match persists; zero/conflicting refused before serialization/port/store with quarantine evidence; caller identity fields refused | Q5, W-6 |
| QE-2 | DP-2 2F: unresolved or ambiguous write refused; no bypass emitted; no partial revision | Q6, W-6/W-7 |
| QE-3 | Revision and lifecycle: stale or missing `expectedRevision` rejected; tombstoned portfolio not disclosed; `reset` and `delete` semantics as W-10 | Q7, W-5/W-10 |
| QE-4 | **Create → durable commit → process stop → restart → read-back**, byte-for-byte equal holdings, contributions and revisions | Q8, W-11 |
| QE-5 | **Idempotent re-import:** identical `contentDigest` → `ALREADY_IMPORTED_NO_OP`, no new revision, before and after restart | W-8 |
| QE-6 | **Lineage:** contribution SHA-256 lineage and broker attribution identical after restart and after `REPLACE`/`RESET` | W-13 |
| QE-7 | **Recovery:** forced termination during a write leaves either the full revision or none; startup refuses on tampered/unverified migrations | W-12 |
| QE-8 | **Revocation:** after binding revocation, writes and reads refused, including after restart; revocation racing a write never yields a post-revocation commit | W-3, CV-20 §4.5 |
| QE-9 | **Refusal matrix:** every W-15 condition produces its class and no store effect (row counts before = after) | W-15 |
| QE-10 | **Outcome-unknown:** timeout after send yields no IRR auto-retry; reconcile-by-read procedure demonstrated | W-9 |
| QE-11 | Q1–Q4 and Q9–Q11 (read-only Gate C subset) passed and accepted, including **C5.1/Q9 zero bytes** | Gate C |

**Precondition for QE-4/Q8:** the Authority must first decide the meaning of "stop both processes" (`D-GC-G`). This policy does not choose it. Candidate readings are listed in the Gate 2 authority request, decision G2-D3.

---

## 5. Explicitly not authorized by this policy (published or accepted)

Implementing durable writes · enabling IPD durable persistence · promoting off-`main` SQLite/G24, Gate A or Gate B work to `main` · executing Gate A′, Gate C, or Q5–Q8 · result acceptance · lifting the IRR `503` fence or enabling IRR portfolio routes · any `durable: true` claim on IPD `main` · purge · re-association of revoked-binding data · login/OIDC/auth/RBAC/multi-user/tenant-directory/enterprise elements · release readiness · production eligibility.

---

*Prepared by Arena Agent Mode as a Gate 2 draft. It is PROPOSED and has no effect until the Program Authority accepts it by a separate act; even then it grants no implementation authority (W-1).*
