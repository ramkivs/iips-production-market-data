# IIPS v3.0 — G-2: **GATE C QUALIFICATION — READINESS ASSESSMENT**

> ## STATUS: **ASSESSMENT ONLY · GATE C NOT EXECUTED · NO QUALIFICATION CLAIMED**
> This document determines **what Gate C would require**, what evidence exists today, and what is
> missing. **No qualification probe, test, or production-like run was executed** in producing it.
> **No Q item is qualified**, **no Q item is marked PASS**, and the four Gate V waivers remain
> **waivers, not technical proof**. Nothing here authorizes Gate C execution, Gate D, Gate E,
> P-6/P-8, production eligibility, durable writes, G24 promotion, or any merge.

| Field | Value |
|---|---|
| **Assessment identifier** | `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-READINESS-ASSESSMENT-2026-10-17-01` |
| **Artifact type** | **Readiness assessment** (investigation/documentation only; renders no authority and no result) |
| **Repository / branch** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (**PR #8**, open, unmerged) |
| **Governing qualification scope** | `L-IPC-1` rev 2 **§10 / Q1–Q11** (accepted text blob `cab04b6f…`) + acceptance decision **§6 (V-E)** and **§8 row 4** |
| **Implementation under assessment** | `refs/heads/gate-b/local-principal-ipc-implementation` @ `cec7080252183a6a5332efe351e61c254d342a2d`, tree `22a7438c…`, parent `2ded0e98…` |
| **Implementation authority** | D-4 act `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01` (blob `7eeff93b…`) as rendered `ACCEPT` (blob `ee6122e8…`, commit `d5c8192…`) |
| **Gate C authority** | **NOT GRANTED** — separate qualification authority required (acceptance decision §8 row 4) |
| **Recorded at (UTC / local)** | `2026-10-17T05:28:49Z` (authoritative GitHub API HTTP `Date`) / 2026-10-17 10:58 IST |
| **Production status** | NON_PRODUCTION — one user, one personal laptop (H-18) |

---

## 0. METHOD, AND WHAT THIS DOCUMENT IS NOT

**Read (not executed):** the accepted contract and its §10 Q-list; the acceptance decision and its
§6 V-E requirements; the D-4 act and its rendered decision; the Gate V procedure and the Gate V
reconciliation/waiver record; the trust-boundary verification; the Gate A reconciliation; the Gate B
completion handoff; and the **published** Gate B object (`cec7080`), from which every implementation
reference below is cited by path and line.

**Not done:** no endpoint was started; no frame was sent; no probe ran; no fixture was created; no
test suite was re-run; **the IRR repository was not accessed**.

**What this document cannot do.** It cannot convert implementation tests into qualification
evidence. The D-4 act is explicit (§5.4): the five `tests/gate_b_*` suites are *"explicitly
implementation evidence, NOT qualification evidence"*, and *"No Gate B test result may be recorded,
cited, or published as the Q9 zero-bytes qualification"*. Every evidence citation below is labelled
accordingly.

---

## 1. SOURCES OF RECORD

| # | Record | Blob (this branch) | What it governs here |
|---|---|---|---|
| S-1 | `IIPS_v3.0_G2_IPD_LOCAL_PRINCIPAL_OS_IPC_SECURITY_CONTRACT_PROPOSAL_2026-10-16.md` — rev 2, **accepted text** `cab04b6f…`; current file `d4aaf4ca…` (identical text + mandated dated notes) | `d4aaf4ca…` | **§10 defines Q1–Q11**; §9 defines Gate V / V-P / V-E; §14 defines Gate C as *"Execute §10 on the laptop; publish raw evidence including gate V"* under a **separate qualification authority** |
| S-2 | `IIPS_v3.0_G2_IPD_SECURITY_CONTRACT_ACCEPTANCE_DECISION_2026-10-16.md` | `f7086304…` | **§4.3(3)** C5.1/Q9 mandatory; **§6** V-E requirements and the waiver-precedence rule; **§7** limits; **§8 row 4** Gate C not granted |
| S-3 | `IIPS_v3.0_G2_IPD_GATE_B_IMPLEMENTATION_AUTHORITY_ACT_2026-10-17.md` | `7eeff93b…` | **§5.4** tests are not qualification evidence; **§7** Gate C deferred list |
| S-4 | `IIPS_v3.0_G2_IPD_GATE_B_IMPLEMENTATION_AUTHORITY_PA_DECISION_RECORD_RENDERED_2026-10-17.md` | `ee6122e8…` | **§4 LIMITS** — Gate C incl. Q1–Q11 and C5.1/Q9 remains separate and deferred |
| S-5 | `IIPS_v3.0_G2_GATE_V_WINDOWS_TEST_PROCEDURE_AND_SEQUENCING_2026-10-16.md` | `a85e5554…` | The only executable procedure in the repository; **§3** maps C5.1 to *"Not provable"* in V-P and *"Required (gate C, Q9)"*; §3 dated updates; §5 publication rule |
| S-6 | `IIPS_v3.0_G2_GATE_V_EVIDENCE_RECONCILIATION_AND_PA_WAIVER_RECORD_2026-10-16.md` | `8731a86c…` | V-P CLOSED; V-1–V-4 `NOT REQUIRED — PA-WAIVED`; **V-5 SATISFIED** (OS build 26200, Node v24.14.0 probe, libuv 1.51.0); **V-6 partial — connect only** |
| S-7 | `IIPS_v3.0_G2_LOCAL_IPC_TRUST_BOUNDARY_VERIFICATION_AND_RECOMMENDATION_2026-10-16.md` | `c098cb77…` | **F-5** — a read-only client open is legal on a duplex pipe; C5.1 is the compensating control |
| S-8 | `IIPS_v3.0_G2_IPD_GATE_A_RECONCILIATION_AND_GATE_B_READINESS_DISPOSITION_2026-10-16.md` | `b1353d5b…` | Qualification is **Gate C's**; the V-E items remain |
| S-9 | `IIPS_v3.0_G2_IPD_GATE_B_COMPLETION_EVIDENCE_HANDOFF_2026-10-17.md` | `7ffed054…` | The published implementation evidence reused here |

**There is no standalone Gate C procedure record.** A repository-wide search found no Gate C
procedure, script, harness, or prior Q-matrix. **S-1 §10 and S-2 §6 are therefore the entire
governing definition**, and every operational procedure in §4–§5 below is **derived** from those
texts and marked as such.

---

## 2. VOCABULARY USED IN THIS DOCUMENT

**Qualification status** (deliberately conservative — nothing below is "PASS"):

| Term | Meaning |
|---|---|
| `NOT TESTED` | No qualification evidence exists. Applies to **all eleven items**. |
| `WAIVER-DISCHARGED` | A governing waiver removes the measurement; **not** a result and never PASS/FAIL/BLOCKED (S-5 §3 rule). |
| `IMPLEMENTATION EVIDENCE ONLY` | Code + Gate B tests exist; explicitly not qualification evidence (S-3 §5.4). |
| `BLOCKED — <prerequisite>` | A named, un-granted prerequisite forbids execution. |

**Evidence classes:** `implementation` (code), `static` (source/inventory inspection), `test`
(Gate B suites — in-process, POSIX), `qualification` (**none exists**).

**Readiness classification** (from the task's five): `READY` · `PREP REQUIRED` · `BLOCKED` ·
`QUALIFIED` · `INDETERMINATE`. **No item is `QUALIFIED`.**

---

## 3. SUMMARY MATRIX

| ID | Requirement (verbatim, S-1 §10) | Qualification status | Strongest evidence today | Class | Readiness | Gate dependency |
|---|---|---|---|---|---|---|
| **Q1** | Gate V (§9) passed and published, on the deployment host | `WAIVER-DISCHARGED` (V-1–V-4) + V-5 at V-P | V-P CLOSED; V-5 SATISFIED | static/platform | **PREP REQUIRED** (record-only) | none (C-1) |
| **Q2** | Startup fail-closed: missing/invalid binding, missing store, unverified migrations ⇒ no endpoint, no fallback | `NOT TESTED` | E1/E3/E5/E6/E7 | implementation + test | **PREP REQUIRED** | — |
| **Q3** | Claim-refusal matrix … each refused; no owner disclosed; no write | `NOT TESTED` | R5/R6/O9 | implementation + test | **PREP REQUIRED** | — |
| **Q4** | Owner/tenant isolation … fails indistinguishably from "not found" | `NOT TESTED` | O3/O4/R8 | implementation + test | **PREP REQUIRED** | fixture scoping (G-9) |
| **Q5** | Canonical identity … one match proceeds **only under the separately authorized write policy**; zero/conflicting refused before serialization/port/store | `BLOCKED — Gate E` | C1–C9 (in-process only) | implementation + test | **BLOCKED** | **Gate E** (G-2) |
| **Q6** | DP-2 2F: unresolved/ambiguous writes refused; no bypass emitted; no partial revision | `BLOCKED — Gate E` (write branch) | C3/C6/C7; no bypass path | implementation + test | **BLOCKED** | **Gate E** |
| **Q7** | Revision/lifecycle: stale `expectedRevision` rejected; duplicate-content no-op; tombstoned not disclosed | `BLOCKED — Gate E` | store-layer tests only (G24 suite, not IPC) | test | **BLOCKED** | **Gate E** |
| **Q8** | Durability: write → stop both processes → restart → read back; revoked binding fails closed after restart | `BLOCKED — Gate E` (write half) | revocation path exists (A-2) | implementation | **BLOCKED** | **Gate E** |
| **Q9** | **C5.1 negative test: a read-only connection receives no bytes** (no banner, no data) | `NOT TESTED` — **MANDATORY** | R1/R2 (in-process, POSIX) | implementation + test | **PREP REQUIRED** | — |
| **Q10** | No parallel store: inventory confirms exactly one portfolio store | `NOT TESTED` (runtime half) | single call site `entrypoint.ts:214` | static | **READY** | — |
| **Q11** | Drift check: qualified surfaces byte-identical to what was tested (digests recorded) | `NOT TESTED` | 15 blob ids at `cec7080` | static | **READY** | — |

**No row above is closed. No row is a qualification result.**

---

## 4. DETAILED ENTRIES

Each entry follows the ten required elements. Line references are to the **published object**
`cec7080` (read via `git show <ref>:<path>`).

### Q1 — Gate V passed and published, on the deployment host

| # | Element | Content |
|---|---|---|
| 1 | Requirement | S-1 §10 Q1, verbatim above; S-1 §9 defines V-1…V-5. |
| 2 | Disposition | `WAIVER-DISCHARGED (V-1–V-4)` + `V-5 SATISFIED at V-P`; **endpoint-phase V-5 re-record outstanding**; V-P **CLOSED**. |
| 3 | Existing evidence | S-6 §2/§5/§8/§9 (waivers, V-P closure); S-6 §4 (V-5: OS build 26200, Node v24.14.0 probe vs v22.22.3 facts, libuv 1.51.0); S-5 §3 dated updates (procedure **not to be run**). |
| 4 | Class | waiver record + version inventory — **not** a measurement of the endpoint. |
| 5 | Gap | (a) V-5 re-recorded for the endpoint phase; (b) the Gate C act must record **which reading** of V-E applies (see **G-1**); (c) **V-6 send half** disposition (see **G-3**). |
| 6 | Probe | **No probe.** V-1/V-3/V-4 re-runs are governed by the waivers (S-2 §6.4) unless the PA records narrower scoping. Only V-5 is re-executed. |
| 7 | Fixtures / expected | Running endpoint (Q2); record OS build, Node, libuv, endpoint name format, account/SID, elevation. Expected: record complete, deviations reconciled. Failure: an unreconciled deviation from F-1…F-9 triggers a design re-read. |
| 8 | Permitted now | **No** (qualification authority required). Record preparation: yes, as documentation. |
| 9 | Dependencies | Q2 (a process must exist); **G-1**. |
| 10 | Criterion | May be recorded **only** as *"closed by waiver (V-1–V-4) + V-5 re-recorded"*. The waived rows must **never** be recorded PASS/FAIL/BLOCKED (S-5 §3). If narrower V-E scoping is recorded, the corresponding re-runs become required and Q1 reopens. |

### Q2 — Startup fail-closed

| # | Element | Content |
|---|---|---|
| 1 | Requirement | S-1 §10 Q2; clauses C2, C5.3, C5.5, C6 (S-1 §3). |
| 2 | Disposition | `NOT TESTED` (implementation evidence only). |
| 3 | Existing evidence | `entrypoint.ts:51` (`IPC_STARTUP_PHASES`), `:93` (`resolveProvisionedPrincipal`), `:184` (`startIpcEndpoint`); `config.ts:50–62` (missing/relative path refused); `migrations/runner.ts:31` (`schema_migrations`), `:202` (`readSchemaVersion`); tests **E1** (phase order), **E3** (live endpoint refused), **E5** (non-socket refused), **E6** (absent binding ⇒ no endpoint), **E7** (close removes socket). |
| 4 | Class | implementation + test (POSIX, in-process). |
| 5 | Gap | No execution against a realized endpoint on Windows; no raw capture; no proof that a failed start leaves the pipe **unbound**; no operator-visible refusal record. |
| 6 | Probe (derived) | Four scenarios on the deployment host: **S1** missing store (`IPD_PORTFOLIO_DB_PATH` unset); **S2** missing/invalid binding (disposable copy, 0 `ACTIVE` bindings); **S3** unverified migrations (disposable copy, ledger version ≠ target); **S4** control (valid ⇒ binds and serves). |
| 7 | Fixtures / expected / failure | Fixtures: disposable store copies; never the provisioned store (§G-9). Expected: S1–S3 terminate without any connectable endpoint and without fallback; S4 listens. Failure: any listener created in S1–S3, any fallback, or a start that "succeeds" while a precondition failed. |
| 8 | Permitted now | **No.** |
| 9 | Dependencies | Q11 (trust anchor); Q9 depends on Q2. |
| 10 | Criterion (derived) | For each of S1–S3: **no endpoint is connectable at any point**, the process refuses, and no partial startup occurs. |

### Q3 — Claim-refusal matrix

| # | Element | Content |
|---|---|---|
| 1 | Requirement | S-1 §10 Q3; clause **C7** (refuse, not ignore) + **C6** (no owner disclosure). |
| 2 | Disposition | `NOT TESTED`. |
| 3 | Existing evidence | `framing.ts` forbidden-key set (`FORBIDDEN_AUTHORITY_KEYS`, incl. `companyId`, `identityStatus`, `resolutionDisposition`) + `assertNoCallerSuppliedAuthority`; `operations.ts` `assertPayloadShape`/`assertListPayload`; `server.ts:264` (`handleFrame`); tests **R5** (25 claim fields + nested), **R6** (bypass token as key and value), **O9** (dispatcher refusal). |
| 4 | Class | implementation + test. |
| 5 | Gap | No raw captured matrix on the realized endpoint; "refused" must be evidenced as **zero bytes + closed connection + endpoint still live**, not as an error code — this implementation never writes a refusal to the wire. |
| 6 | Probe (derived) | For each of the seven claim classes (principal / owner / tenant / scope / `companyId` / `identityStatus` / `resolutionDisposition`) plus one nested case: send a valid frame carrying the claim; record bytes received; record store digest before/after; send a control request afterwards. |
| 7 | Fixtures / expected / failure | Disposable copy with one portfolio. Expected: **0 bytes** for 7/7, identical across classes; store digest unchanged; control request succeeds. Failure: any byte returned, any store change, or any class distinguishable from another. |
| 8 | Permitted now | **No.** |
| 9 | Dependencies | Q2 (endpoint), Q11 (drift). |
| 10 | Criterion (derived) | 7/7 refusals byte-identical (zero bytes); no owner disclosure; no write; endpoint remains live. |

### Q4 — Owner/tenant isolation

| # | Element | Content |
|---|---|---|
| 1 | Requirement | S-1 §10 Q4; clauses C3, C5.5, C6. |
| 2 | Disposition | `NOT TESTED`. |
| 3 | Existing evidence | `local_principal.ts` `resolveActiveBinding` (exactly one `ACTIVE` or throws); tests **O3** (foreign ≡ missing), **O4** (tenant is part of the scope), **R8** (foreign and missing indistinguishable on the wire). |
| 4 | Class | implementation + test. |
| 5 | Gap | No realized-endpoint isolation run; the exactly-one-`ACTIVE` rule means a "second binding" cannot coexist and must be exercised **serially** (revoke → create) or on a **second copy**. |
| 6 | Probe (derived) | Copy A: bound principal reads its own portfolio (success), a foreign portfolio id (0 bytes), an other-tenant id (0 bytes). Copy B: revoke binding ⇒ startup refuses (cross-checks Q2/S2); create a binding for user B plus a portfolio owned by user A; B's request for A's portfolio must be byte-identical to a nonexistent id. |
| 7 | Fixtures / expected / failure | Fixture writes (portfolio, binding) **only** on disposable copies. Expected: success only for the bound principal's own `(applicationUserId, tenantId, portfolioId)`; everything else byte-identical zero bytes. Failure: any success outside the triple; any difference between foreign and missing; any owner disclosure. |
| 8 | Permitted now | **No** (needs qualification authority + fixture scoping, **G-9**). |
| 9 | Dependencies | Q2, Q3, Q11. |
| 10 | Criterion | Success **iff** the triple matches the bound principal; all other cases indistinguishable from "not found". |

### Q5 — Canonical identity (write-dependent)

| # | Element | Content |
|---|---|---|
| 1 | Requirement | S-1 §10 Q5; clause **C12**; **DP-2 Option 2F**. |
| 2 | Disposition | **`BLOCKED — Gate E`** for the endpoint-level item. |
| 3 | Existing evidence | `canonical_identity.ts` (resolve-or-refuse; status fields produced only by a real match; quarantine evidence local); tests **C1–C9** (in-process). |
| 4 | Class | implementation + test — **not** on the wire. |
| 5 | Gap | **No wire path reaches the canonical boundary.** `operations.ts:307` (`save`) refuses `WRITE_NOT_AUTHORIZED` *before* any identity work, and `resolveHoldingIdentity` is **not** in the four-operation surface (`entrypoint.ts:143`). The phrase *"one match proceeds only under the separately authorized write policy"* cannot be exercised while the policy is ungranted. |
| 6 | Probe | None possible on the wire today. After Gate E: write with one canonical match under the authorized policy; write with zero/conflicting matches ⇒ refused **before** serialization/port/store, with quarantine evidence; record all store rows. |
| 7 | Fixtures / expected / failure | Gate E fixtures. Expected: refusal branch produces no rows and no partial revision; success branch only under the granted policy. Failure: any write on an unresolved/ambiguous holding; any empty/invented `companyId`. |
| 8 | Permitted now | **No.** |
| 9 | Dependencies | **Gate E** (G-2); Q3 for the claim half. |
| 10 | Criterion | As written, the success branch is **vacuously refused** while writes are unauthorized; that is a precondition, **not** a qualification. Full Q5 closure requires Gate E. |

### Q6 — DP-2 Option 2F (write-dependent)

| # | Element | Content |
|---|---|---|
| 1 | Requirement | S-1 §10 Q6; DP-2 Option 2F; C12. |
| 2 | Disposition | **`BLOCKED — Gate E`** (the write path); the *no-bypass* half is statically observable. |
| 3 | Existing evidence | No bypass token exists in `src/ipc/**` or `src/user_portfolio/**`; `save` always refuses (`operations.ts:307`); tests **C3** (ambiguous ≡ unmapped), **C6/C7** (claims and bypass refused), **R7** (`portfolio.save` ⇒ zero bytes). Note: the legacy bypass in `src/portfolio/consolidation.ts` (L113/263) is **byte-unchanged** and **unreachable** from the read-only IPC path because `save` refuses first. |
| 4 | Class | implementation + test + static. |
| 5 | Gap | *"No partial revision"* and *"unresolved/ambiguous writes refused"* require a save attempt that reaches persistence — impossible while writes are ungranted. |
| 6 | Probe | After Gate E: attempt unresolved/ambiguous saves; assert refusal **before** serialization/port and **zero** revision rows; assert no bypass token in any emitted byte. |
| 7 | Fixtures / expected / failure | Gate E fixtures. Expected: no revision created, no bypass emitted. Failure: any partial revision, any bypass path reachable. |
| 8 | Permitted now | **No.** |
| 9 | Dependencies | **Gate E**. |
| 10 | Criterion | No write on unresolved/ambiguous input; no bypass emitted; no partial revision. |

### Q7 — Revision / lifecycle (write-dependent)

| # | Element | Content |
|---|---|---|
| 1 | Requirement | S-1 §10 Q7. |
| 2 | Disposition | **`BLOCKED — Gate E`**. |
| 3 | Existing evidence | Store-layer behaviour is exercised by the certified G24 suite (not the IPC path); no IPC operation exposes revision mutation. |
| 4 | Class | test (store layer) — **not** qualification. |
| 5 | Gap | Stale `expectedRevision`, duplicate-content no-op and tombstone behaviour are **save/delete** behaviours; none is reachable over the read-only endpoint. The tombstone-read sub-item is reachable **only** if a fixture may write a tombstoned row (G-9). |
| 6 | Probe | After Gate E: stale revision ⇒ rejection; identical content ⇒ no-op with unchanged revision; tombstoned id ⇒ indistinguishable from missing (zero bytes). |
| 7 | Fixtures / expected / failure | Gate E fixtures. Failure: a stale revision accepted, a duplicate creating a revision, or a tombstoned id distinguishable from a missing one. |
| 8 | Permitted now | **No.** |
| 9 | Dependencies | **Gate E**. |
| 10 | Criterion | All three behaviours observed on the realized endpoint. |

### Q8 — Durability across restart (write-dependent)

| # | Element | Content |
|---|---|---|
| 1 | Requirement | S-1 §10 Q8. |
| 2 | Disposition | **`BLOCKED — Gate E`** (write half); the revocation/restart half is qualifiable. |
| 3 | Existing evidence | `LocalPrincipalService.revokeBinding` (`local_principal.ts:401`); `resolveActiveBinding` refuses when no `ACTIVE` binding exists; test **E6** (startup refuses without a binding). |
| 4 | Class | implementation (+ test). |
| 5 | Gap | *"write → stop both processes → restart → read back"* requires a durable write. **"Both processes" is ambiguous** in this single-process design — one IPD process owns the store (see **G-7**). |
| 6 | Probe | Revocation half: revoke on a disposable copy ⇒ restart ⇒ the endpoint refuses to start; read-back half only after Gate E. |
| 7 | Fixtures / expected / failure | Disposable copy; restart cycle. Expected: no endpoint after revocation; data read back identical after Gate E. Failure: an endpoint serving after revocation, or data loss after restart. |
| 8 | Permitted now | **No** (revocation half needs qualification authority; write half needs Gate E). |
| 9 | Dependencies | **Gate E**; Q2. |
| 10 | Criterion | Written data readable after restart; revoked binding fails closed after restart. |

### Q9 — Mandatory C5.1 negative test

See **§5** for the full specification. Summary:

| # | Element | Content |
|---|---|---|
| 1 | Requirement | S-1 §10 Q9 + S-2 §4.3(3) + S-2 §6(1). |
| 2 | Disposition | `NOT TESTED` — **MANDATORY**; S-5 §3 records C5.1 as *"Not provable"* in V-P and *"Required (gate C, Q9)"*. |
| 3 | Existing evidence | `server.ts` zero-bytes refusals + `IpcServerStats`; tests **R1** (silent connection, 0 bytes), **R2** (idle timeout, 0 bytes), **R10** (valid request does receive bytes). Implementation/test only. |
| 4 | Class | implementation + test (POSIX, in-process). |
| 5 | Gap | No probe against a **Windows named pipe**, no genuine **read-only client open** (F-5), no raw byte capture, no liveness control, no repeatability. |
| 6 | Probe | §5. |
| 7 | Fixtures / expected / failure | §5. |
| 8 | Permitted now | **No.** |
| 9 | Dependencies | Q2 (endpoint), Q11 (drift), Q10 (single store). |
| 10 | Criterion | §5.4. |

### Q10 — No parallel store

| # | Element | Content |
|---|---|---|
| 1 | Requirement | S-1 §10 Q10; clause **C11**. |
| 2 | Disposition | Static half verified; `NOT TESTED` at runtime. |
| 3 | Existing evidence | Exactly **one** `initializePersistenceWithConfig` call site in `src/` — `entrypoint.ts:214` — used **only** when no handle is supplied (`:200–215` reuses a supplied handle); `PersistenceHandle` is single-open; test **SUPPORT** (one store per fixture). |
| 4 | Class | static + implementation. |
| 5 | Gap | No runtime inventory on the host (one process, one store file, no second database, no second connection). |
| 6 | Probe (derived) | Inventory of import sites for the store module; enumerate `*.sqlite`, `-wal`, `-shm` in the data directory before/after start; confirm exactly one process holds the file; confirm the endpoint opens no second path. |
| 7 | Fixtures / expected / failure | Disposable copy. Expected: exactly one store file and one owning process. Failure: a second store file, a second connection, or a second store module on the IPC path. |
| 8 | Permitted now | Static half: yes. Runtime half: **No.** |
| 9 | Dependencies | Q2. |
| 10 | Criterion | Inventory shows exactly one portfolio store; runtime shows exactly one open handle. |

### Q11 — Drift check

| # | Element | Content |
|---|---|---|
| 1 | Requirement | S-1 §10 Q11. |
| 2 | Disposition | `NOT TESTED`; the manifest basis exists. |
| 3 | Existing evidence | Implementation tree `22a7438c…`; the fifteen blob ids are recorded in S-9 §2; published tree = tested tree. |
| 4 | Class | static. |
| 5 | Gap | No qualification-time digest manifest and no before/after comparison. |
| 6 | Probe (derived) | `sha256` of the fifteen files + `package.json` + `tsconfig.json` at qualification time; compare with the manifest derived from `cec7080`; re-check **after** the run. |
| 7 | Fixtures / expected / failure | Expected: 15/15 identical and tree hash identical. Failure: any drift ⇒ the whole qualification is invalid. |
| 8 | Permitted now | Manifest preparation: yes. Execution: **No.** |
| 9 | Dependencies | none (must run **first**). |
| 10 | Criterion | Byte-identical surfaces, digests recorded before and after. |

---

## 5. MANDATORY C5.1 / Q9 — FULL SPECIFICATION

### 5.1 Governing requirement

- **S-2 §4.3(3):** *"C5.1 / Q9 is preserved as a MANDATORY qualification requirement: the endpoint
  must emit **no bytes before a valid, authorized request** — no greeting, banner, version, or data.
  This is load-bearing because a read-only client open is legal on a duplex pipe (F-5) and read-only
  reachability is now **unmeasured** rather than measured-and-qualified."*
- **S-1 §10 Q9:** *"C5.1 negative test: a read-only connection receives **no** bytes (no banner, no
  data)."*
- **S-5 §3:** C5.1 is *"Not provable"* at V-P; *"Required (gate C, Q9 negative test)"*; **`NOT TESTED`**.
- **S-3 §5.4:** Gate B test results **may not** be recorded, cited or published as the Q9
  qualification.

### 5.2 Event boundary at which zero bytes must hold

**From the instant the OS admits the connection** (client handle open succeeds / server `accept`
completes) **until the first complete, valid, authorized request frame has been received and
authorized.** In that interval the server must emit **exactly 0 bytes**. The boundary extends to
every refusal path: malformed frame, oversize frame, unknown version, unknown operation, missing
binding, claim, unknown resource, write attempt — each must emit 0 bytes.

### 5.3 Required conditions

1. **Windows named pipe** on the deployment host — the qualification target. POSIX socket results do
   not transfer: on Windows `modeEnforced=false` and the ACL is waived (S-6), which is precisely why
   C5.1 is the compensating control.
2. **A genuine read-only client open** (`GENERIC_READ` only / `PipeDirection.In`), not an
   application-level mock. F-5 (S-7) is the reason.
3. **The connection is admitted**, not refused: the client must show a successful open. A failed
   open is a different outcome and must be recorded as such, not as a zero-byte pass.
4. **The endpoint remains live** across the probe: a valid, authorized control request on a separate
   connection must receive a well-formed response immediately before and after each probe.
5. **At least one direction-restricted control**: an `InOut` connection with a valid authorized
   frame must receive a response (proves the harness can observe bytes at all — a harness that
   never reads would produce a false zero).
6. **Both cold-start and warm** endpoint states, and **N ≥ 10 repetitions**.

### 5.4 Observable evidence and acceptance criteria

| # | Observation | Acceptance |
|---|---|---|
| 1 | Bytes received by the read-only client over the observation window | **0** |
| 2 | Client open result | **success** (admitted) |
| 3 | Connection state during the window | open until the server's idle timeout (5 s, `server.ts:71`), then closed by the server |
| 4 | Server-side counters (`acceptedConnections`, `refusedConnections`, `activeConnections`; `server.ts:126`) | accepted +1 per probe; no refusal recorded for the probe |
| 5 | Control request before/after | valid response received (liveness) |
| 6 | Repeatability | 10/10 identical, cold and warm |

**Distinguishing zero bytes from the confusable outcomes** (this is the criterion that the Q-item's
one-line text does not spell out, and it is **derived**):

| Confusable outcome | Discriminator |
|---|---|
| Clean close / refusal at the OS | Open **succeeded** (row 2) and server counter shows **accepted** (row 4). |
| Idle timeout only | 0 bytes with closure **at** the 5 s timeout is acceptable; closure **before** it with 0 bytes is recorded and investigated. |
| Dead endpoint | Liveness control (row 5) fails ⇒ the probe is **invalid**, not a pass. |
| Harness artifact | Control direction (5.3(5)) must show non-zero bytes for a valid request. |
| Refusal path | Recorded separately: 0 bytes + closed socket; must be indistinguishable between classes (Q3). |

### 5.5 Instrumentation, fixture and artifact (derived)

- **Harness:** an operator-side script (Gate V precedent, S-5: scripts written to a temp directory,
  nothing added to the repository) that imports the **built** module and calls `startIpcEndpoint`
  with a fixed endpoint name, logging `phases`, `principal`, `schemaVersion`, `stats` and the
  refusal sink to a raw log.
- **Client:** the Gate V client pattern extended — `In` / `Out` / `InOut`, `bytesReceived`,
  `elapsedMs`, exception type, timestamp.
- **Fixture:** disposable store copy; endpoint name fixed and recorded; no production data.
- **Artifact:** raw console/log output + a JSON manifest (harness sha256, Node/libuv/Windows
  versions, endpoint name, timestamps, per-iteration rows, control results). No projected,
  illustrative or synthesised results (S-5 §5 rule).

### 5.6 Blockers

| Blocker | Effect |
|---|---|
| **No qualification authority** | Cannot execute anything. |
| **No Gate C procedure/harness** | Must be authored (documentation) and authorized. |
| **No packaged runner** | The endpoint can only be realized by an operator harness importing the built module; `package.json` scripts are in the D-4 byte-unchanged set (see **G-5**). |
| **Host mismatch** | This assessment was produced on a POSIX host; Q9 must run on Windows (**G-6**). |
| **Fixtures require writes** | Must be scoped to a disposable copy (**G-9**). |

---

## 6. READINESS DETERMINATION AND ORDERED PIPELINE

### 6.1 Classification

| Classification | Items |
|---|---|
| **READY** (procedure defined; may execute immediately under a Gate C act) | **Q10**, **Q11** |
| **PREP REQUIRED** (procedure/fixtures/records must be authored) | **Q2**, **Q3**, **Q4**, **Q9**, **Q1** |
| **BLOCKED** (named prerequisite not granted) | **Q5**, **Q6**, **Q7**, **Q8** — all on **Gate E** |
| **QUALIFIED** | **none** |
| **INDETERMINATE** | **none** in substance; **Q1** is indeterminate only as to *which V-E reading* applies (**G-1**), and **V-6** has no recorded disposition (**G-3**) |

### 6.2 Minimum prerequisites before any qualification can start

1. **A Gate C qualification authority act** (separate act; S-2 §8 row 4) that names:
   (a) the executable subset — Q1–Q4, Q9–Q11; (b) the harness pattern and that no repository file is
   added; (c) **fixture-write scoping** to a disposable store copy; (d) the endpoint profile;
   (e) the **V-E waiver-precedence reading** (G-1) and the **V-6** disposition (G-3);
   (f) whether Q5–Q8 are deferred to a Gate E-dependent phase (G-2).
2. **A Gate C procedure document** — authorable now as documentation, executable only after (1).
3. **Fixture set** — disposable copy(ies) of the provisioned store, plus the scenario matrix.
4. **Operator availability on the Windows host** — qualification cannot run in this POSIX
   environment.

### 6.3 Ordered pipeline (minimises duplication)

| Step | Action | Why this order |
|---|---|---|
| **P0** | This assessment; then a Gate C procedure document (documentation only) | No authority needed; removes ambiguity before execution |
| **P1** | **Gate C act** (authority) | Nothing executes before it |
| **P2** | Build harness + fixtures from the disposable copy | One harness serves Q2/Q3/Q4/Q9/Q10 |
| **P3** | **Q11** drift manifest (before) | Trust anchor for every later result |
| **P4** | **Q2** startup scenarios (S1–S4) | The endpoint must exist before anything is measured |
| **P5** | **Q10** single-store inventory (static + runtime) | Validates the process under test |
| **P6** | **Q9** zero-bytes probe — **mandatory**, highest weight | Independent of Q3/Q4; uses the same harness |
| **P7** | **Q3** claim-refusal matrix | Needs a live, trusted endpoint |
| **P8** | **Q4** isolation (serial binding exercise on copies) | Builds on Q2/Q3 |
| **P9** | **Q1** V-5 re-record + waiver-precedence record | Last; records-only |
| **P10** | **Q11** drift manifest (after) + raw evidence publication + qualification record | Closes the run |
| **P11** | **Q5–Q8** — deferred to a Gate E-dependent phase (subject to P1's decision) | Cannot run before Gate E |

### 6.4 Work bundles by authority

| Bundle | Content | Authority |
|---|---|---|
| **May be prepared now** | This assessment; procedure document; harness source; fixture plan; digest manifest; Q-matrix | Documentation authority (no execution) |
| **Requires a separate act** | The Gate C act; execution; raw evidence publication; the qualification disposition; fixture writes on copies; **Gate E** for Q5–Q8 | PA / qualification authority |
| **Prohibited now** | Any probe or qualification run; any write to the provisioned store; any change to the 15 files, `package.json`, `tsconfig`, or the implementation ref; Gate D admission; P-6/P-8; production claims; G24 promotion; merge | — |

---

## 7. AUTHORITY GAPS, CONFLICTS AND UNRESOLVED QUESTIONS

> These are recorded, **not reconciled**. Nothing below is decided by this document.

| ID | Issue | Effect |
|---|---|---|
| **G-1** | **V-E vs the waivers — textual conflict.** S-1 §9 says *"V-1/V-3/V-4 are **re-run against the production endpoint** after gate B"*; S-2 §6.4 says *"Where a V-E item would repeat one of the four PA-waived measurements, **the waiver governs** unless the Program Authority records narrower scoping"*; S-5 §3 still lists V-1/V-4 V-E as *"Re-run"*. | Precedence exists (later, explicit), but the Gate C record **must state which reading it applies**. Absent that, Q1 is ambiguous. If the PA wants re-runs, a narrower-scoping act is required. |
| **G-2** | **Sequencing inversion.** S-1 §14 orders Gate C *before* Gate D/E, yet **Q5, Q6, Q7 and Q8 require writes** that Gate E owns, while S-3/S-5 and the contract presume **no successful writes**. | Gate C **cannot close Q1–Q11 in full** before Gate E. The PA must choose: (i) a read-only Gate C subset with Q5–Q8 deferred; or (ii) Gate E before the write-dependent portion. This is a **concrete governance gap**, not an inference. |
| **G-3** | **V-6 has no recorded disposition.** S-5 §3 records V-6 as *"partial — connect only"*; the send half was never executed and is **not** among the four waivers. V-6 is not in S-1 §9's V-1…V-5 list. | An implicit unqualified residue. The Gate C act should record whether V-6 is in or out of scope for Q1. |
| **G-4** | **No Gate C procedure exists.** §10 gives one-line evidence items with no procedures; the only executable procedure in the repo is Gate V's (and it is *"not to be run"*). | Procedures must be authored before qualification; scheduling risk. |
| **G-5** | **No packaged runner.** The endpoint can only be realized by an operator harness importing the built module. `package.json` scripts are in the D-4 byte-unchanged set (S-4 item 3), so no runner script can be added to the repository under the current act. | The Gate V precedent (embedded scripts, temp directory) is the lawful pattern; the Gate C act must adopt it explicitly. |
| **G-6** | **Host mismatch.** Qualification is defined *"on the deployment host"* (Windows). All current evidence is POSIX/in-process; POSIX permission results do not transfer, and the Windows ACL is waived. | Execution must occur on the laptop; no result from this environment may be recorded as qualification. |
| **G-7** | **Q8 "both processes" is ambiguous** in a single-process design — one IPD process owns the store. | Needs interpretation in the Gate C act. |
| **G-8** | **Q-items are one-line evidence descriptions**, not testable specifications: no per-item pass thresholds, no fixtures, no artifacts. | Every criterion in §4 marked *(derived)* is authored here and must be ratified by the Gate C act, not assumed. |
| **G-9** | **Fixture writes.** Isolation, revision, tombstone and durability scenarios need portfolios/bindings created or revoked; doing this on the provisioned store would destroy Gate A provisioning. | Fixtures must run on **disposable copies**; the Gate C act must scope this explicitly, otherwise no fixture may be written. |

---

## 8. NON-CLAIMS AND PRESERVATIONS

- **Gate C was not executed.** No probe ran, no endpoint was started, no frame was sent, no fixture
  was created. **No Q1–Q11 item is qualified**, and **C5.1/Q9 is NOT qualified**.
- **No Gate D** route admission, **no Gate E** write policy, **no P-6/P-8**, **no production
  eligibility**, **no durable-write expansion**, **no G24 promotion**, **no merge** is authorized or
  implied.
- **The four Gate V waivers are preserved exactly:** `V-1 ACL/SDDL capture`, `V-4 pipe collision and
  re-bind testing`, `Second-account access test`, `Remote-machine access test` —
  **`NOT REQUIRED — PA-WAIVED`**. They are **waivers, not technical proof**, and are never recorded
  PASS/FAIL/BLOCKED.
- **H-18** (one user / one personal laptop / non-production), **DP-2 Option 2F**, **C11** single
  store, **`L-IPC-1` C1–C12**, the IRR `503 owner-context-unavailable` fence and the effective DP-1
  amendment all remain in force and un-reopened.
- **No cross-repository verification** is claimed; the IRR repository was not accessed.
- **No implementation file, test, ref, baseline or prior record was modified.** This is an additive
  documentation artifact.

---

## 9. VERIFICATION OF THIS DOCUMENT

| Item | Method |
|---|---|
| Paths and identifiers | Every cited path resolved on this branch; the implementation citations resolved against the **published object** `cec7080` |
| Q1–Q11 coverage | All eleven quoted verbatim from S-1 §10; no item omitted, added, or renumbered |
| Implementation evidence | Test identifiers taken from the published suites, not from memory |
| Execution status | Confirmed: no endpoint process started, no probe run, no suite re-run |

*End of readiness assessment.*
