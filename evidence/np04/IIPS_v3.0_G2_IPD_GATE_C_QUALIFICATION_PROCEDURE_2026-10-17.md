# IIPS v3.0 — G-2: **GATE C QUALIFICATION PROCEDURE (P0)**

> ## STATUS: **PROCEDURE PREPARATION ONLY · NOT AUTHORIZED · NOT EXECUTED**
> This document defines **how** a future authorized Gate C qualification would be run. It **grants
> no authority**, **approves no subset**, **creates no fixture**, **starts no endpoint**, and
> **executes no probe**. Nothing in it is a result. **No Q item is qualified or passed**, and
> **C5.1/Q9 remains mandatory and unexecuted**. Q5–Q8 remain **blocked** pending Gate E.
>
> Every requirement below is tagged **`[AUTH]`** (required by a cited governing record) or
> **`[DERIVED]`** (harness/acceptance design authored here, **not authorized**, and requiring
> ratification by the future Gate C act). No derived threshold is presented as already authorized.

| Field | Value |
|---|---|
| **Procedure identifier** | `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-PROCEDURE-2026-10-17-01` |
| **Artifact type** | **Procedure (preparation only)** — renders no authority and no result |
| **Basis** | `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-READINESS-ASSESSMENT-2026-10-17-01` — `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_QUALIFICATION_READINESS_ASSESSMENT_2026-10-17.md`, commit **`b28bdc9…`**, blob `efc2d0d2…`, sha256 `93144553…` |
| **Repository / branch** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (**PR #8**, open, unmerged) |
| **Implementation under procedure** | `refs/heads/gate-b/local-principal-ipc-implementation` @ `cec7080252183a6a5332efe351e61c254d342a2d`, tree `22a7438c…`, parent `2ded0e98…` |
| **Governing qualification scope** | `L-IPC-1` rev 2 **§10 / Q1–Q11** (accepted blob `cab04b6f…`); acceptance decision **§6** and **§8 row 4** (blob `f7086304…`) |
| **Gate C authority** | **NOT GRANTED** — separate qualification authority required |
| **Recorded at (UTC / local)** | `2026-10-17T05:33:31Z` (authoritative GitHub API HTTP `Date`) / 2026-10-17 11:03 IST |
| **Production status** | NON_PRODUCTION — one user, one personal laptop (H-18) |

---

## 0. WHAT THIS DOCUMENT IS, AND THE FOUR SEPARABLE ACTS

**Four acts are distinct and none of them is this document:**

| # | Act | Who | Status |
|---|---|---|---|
| 1 | **Procedure preparation** (this document) | documentation | **DONE by this artifact — authorizes nothing** |
| 2 | **Qualification execution** | operator, under a Gate C authority act | **NOT AUTHORIZED** |
| 3 | **Qualification acceptance** (disposition of the raw evidence) | PA / qualification authority | **NOT GRANTED** |
| 4 | **Subsequent gate authority** (Gate D, Gate E, P-6/P-8, production) | PA, per gate | **NOT GRANTED** |

Preparing the procedure does **not** authorize (2), does **not** pre-decide (3), and does **not**
open (4). The procedure is written so that a single future act can authorize (2) by reference to this
identifier — but until that act exists, **nothing here may be executed**.

**No approval is implied.** The read-only subset in §3 is **proposed** to structure the future act.
The PA may accept, narrow, widen (within the records), or reject it. It is **not** an approved scope.

---

## 1. GOVERNING RECORDS

| ID | Record | Blob | Used for |
|---|---|---|---|
| **S-1** | `IIPS_v3.0_G2_IPD_LOCAL_PRINCIPAL_OS_IPC_SECURITY_CONTRACT_PROPOSAL_2026-10-16.md` — rev 2 (accepted text `cab04b6f…`; current file `d4aaf4ca…`) | `d4aaf4ca…` | **§10 Q1–Q11**; §9 Gate V/V-P/V-E; §14 gate order; clauses C1–C12 |
| **S-2** | `IIPS_v3.0_G2_IPD_SECURITY_CONTRACT_ACCEPTANCE_DECISION_2026-10-16.md` | `f7086304…` | **§4.3(3)** C5.1/Q9 mandatory; **§6** V-E; **§7** limits; **§8 row 4** Gate C not granted |
| **S-3** | `IIPS_v3.0_G2_IPD_GATE_B_IMPLEMENTATION_AUTHORITY_ACT_2026-10-17.md` | `7eeff93b…` | §5.4 tests are **not** qualification evidence; §7 Gate C deferred |
| **S-4** | `IIPS_v3.0_G2_IPD_GATE_B_IMPLEMENTATION_AUTHORITY_PA_DECISION_RECORD_RENDERED_2026-10-17.md` | `ee6122e8…` | §4 LIMITS; byte-unchanged set incl. `package.json` scripts |
| **S-5** | `IIPS_v3.0_G2_GATE_V_WINDOWS_TEST_PROCEDURE_AND_SEQUENCING_2026-10-16.md` | `a85e5554…` | Probe/client template; §3 disposition map; §4 misread rules; §5 publication rule |
| **S-6** | `IIPS_v3.0_G2_GATE_V_EVIDENCE_RECONCILIATION_AND_PA_WAIVER_RECORD_2026-10-16.md` | `8731a86c…` | V-P CLOSED; V-1–V-4 waived; V-5 satisfied; V-6 partial |
| **S-7** | `IIPS_v3.0_G2_LOCAL_IPC_TRUST_BOUNDARY_VERIFICATION_AND_RECOMMENDATION_2026-10-16.md` | `c098cb77…` | F-5 read-only open; C5.1 as compensating control |
| **S-8** | `IIPS_v3.0_G2_IPD_GATE_A_RECONCILIATION_AND_GATE_B_READINESS_DISPOSITION_2026-10-16.md` | `b1353d5b…` | Qualification belongs to Gate C |
| **S-9** | `IIPS_v3.0_G2_IPD_GATE_B_COMPLETION_EVIDENCE_HANDOFF_2026-10-17.md` | `7ffed054…` | The fifteen blob ids used by the drift manifest |
| **S-10** | Readiness assessment (basis of this procedure) | `efc2d0d2…` | Q-matrix, G-1…G-9 |

**Implementation citations** are to the published object `cec7080` (`git show <ref>:<path>`), not to
this branch, which does not contain the implementation.

---

## 2. TRACEABILITY — EVERY REQUIREMENT HAS A SOURCE

| Q | Governing requirement | Source |
|---|---|---|
| Q1 | Gate V passed/published on the deployment host | S-1 §10 Q1; §9 |
| Q2 | Startup fail-closed (binding / store / migrations) | S-1 §10 Q2; clauses C2, C5.3, C5.5, C6 |
| Q3 | Claim-refusal matrix; no owner disclosed; no write | S-1 §10 Q3; clause C7 + C6 |
| Q4 | Owner/tenant isolation ≡ not-found | S-1 §10 Q4; clauses C3, C5.5, C6 |
| Q5 | Canonical identity under the authorized write policy | S-1 §10 Q5; clause C12; DP-2 2F |
| Q6 | DP-2 2F; no bypass; no partial revision | S-1 §10 Q6; DP-2 2F; C12 |
| Q7 | Revision/lifecycle/tombstone | S-1 §10 Q7 |
| Q8 | Durability across restart; revoked binding fails closed | S-1 §10 Q8 |
| Q9 | **C5.1 negative test — read-only connection receives no bytes** | S-1 §10 Q9; **S-2 §4.3(3), §6(1)**; S-1 C5.1; S-3 §5.4 |
| Q10 | Exactly one portfolio store | S-1 §10 Q10; clause C11 |
| Q11 | Drift check; digests recorded | S-1 §10 Q11 |

No Q item in this procedure lacks a governing source. Where a **criterion** is not stated verbatim
in a governing record, it is tagged `[DERIVED]` and listed in the future act's decision table (§8
closing table).

---

## 3. PROPOSED READ-ONLY QUALIFICATION SUBSET — **PROPOSED, NOT APPROVED**

**PROPOSED-IN (read-only, executable in principle under a future act):** **Q1, Q2, Q3, Q4, Q9, Q10,
Q11.**

**DEFERRED — BLOCKED pending Gate E:** **Q5, Q6, Q7, Q8** (each requires the write policy that Gate E
owns; see **G-2**). They are **not** proposed for qualification now, and no procedure is authorized
for them (§6).

**Why this split is faithful to the records:** the contract presumes **no successful writes**
(S-1 §12 non-goals; S-2 §7), `portfolio.save` **always refuses** on the published object
(`operations.ts:307`), and the four operations on the wire are `list/get/analytics/save`
(`entrypoint.ts:143`). The proposed subset exercises only what the endpoint can actually do today.

**If the PA chooses option (ii) in G-2 — Gate E before the write-dependent portion — the subset
changes and this procedure must be revised; it must not be stretched by interpretation.**

---

## 4. RUN MODEL

### 4.1 Host and endpoint profile

| Element | Specification |
|---|---|
| Host | **The Windows deployment laptop**, ordinary operator account, **no elevation** `[AUTH — S-1 §10 "on the deployment host"; S-2 §4.3]` |
| Transport | **Named pipe** `\\.\pipe\<name>` — no POSIX substitution `[AUTH — S-2 §4.3(3) rests on F-3/F-5; S-7]` |
| Endpoint name | Opaque, operator-chosen, matching `^[a-z0-9][a-z0-9._-]{0,63}$` (e.g. `iips-gq-<yyyymmdd>`); recorded in the run manifest `[DERIVED]` |
| Store | **A disposable copy** of the provisioned SQLite file at an absolute path outside the repository, supplied via `IPD_PORTFOLIO_DB_PATH` `[DERIVED — see G-9]` |
| Authoritative store | **Never opened, never written, never used for fixtures** `[AUTH — S-2 §7; S-3 §5.3]` |
| Runtime | The Node version recorded in the run manifest; the endpoint process is the harness process `[DERIVED]` |

### 4.2 Harness — `[DERIVED]` design, **not authorized**

- A **`.mjs`** script in a **temp directory outside the repository** (the package is ESM —
  `"type": "module"`), importing the **built** module by absolute file URL:
  `dist/src/ipc/entrypoint.js`.
- It calls `startIpcEndpoint({ endpointName })` and logs, as JSONL to a raw log:
  `phases`, `principal`, `schemaVersion`, `layout.modeEnforced`, `stats` (`acceptedConnections`,
  `refusedConnections`, `activeConnections`), and the local refusal sink — **operator-side only,
  never on the wire**.
- **No repository file is added or changed**; `package.json` scripts are byte-unchanged
  (S-4 item 3) — the build uses the existing compiler invocation (`npx tsc`) `[DERIVED]`.
- Dependencies are installed at the pinned commit into the git-ignored `node_modules`.

### 4.3 Client — `[DERIVED]`, based on the Gate V template

- PowerShell `NamedPipeClientStream` with `PipeDirection.In`, `Out`, `InOut`, per **S-5** Blocks A/B
  (template), recording `connected`, `bytesReceived`, `elapsedMs`, exception type and UTC timestamp.
- Valid request frames (4-byte BE length + UTF-8 JSON) are generated **offline** with the published
  `encodeFrame` and passed to the client as hex — the client implements no protocol `[DERIVED]`.

### 4.4 Fixtures — disposable copies only

| Copy | Purpose |
|---|---|
| **C-A** | Bound principal + one owned portfolio; one foreign-owner portfolio; one other-tenant portfolio |
| **C-B** | Zero `ACTIVE` bindings (revoked) — startup refusal |
| **C-C** | Second principal bound; a portfolio owned by the first principal — isolation |
| **C-D** | A-2 table removed — unverified-migration refusal |
| **C-E** | Untouched valid copy — control scenario |

`[DERIVED]` — the **existence** of fixtures and their writes are exactly what **G-9** must authorize.
Until then, no copy may be created.

### 4.5 Evidence conventions `[DERIVED]`

- Raw stdout/stderr and JSONL logs, **unedited**; UTC timestamps; a run id `GQ-<yyyymmdd>-<nn>`.
- `sha256` of every artifact, of the harness, and of the fifteen implementation files.
- Host manifest: Windows build, Node, libuv, account, SID, elevation state, endpoint name.
- **No projected, illustrative, or synthesised results** (S-5 §5 rule) `[AUTH]`.

### 4.6 Invalid run vs failed run `[DERIVED]`

| Kind | Definition | Handling |
|---|---|---|
| **Invalid** | A control fails (endpoint should have started and did not; control request should have succeeded and did not); drift mismatch; wrong host/profile; harness crash; pipe contention | **Discard and repeat**, recording why. Never counted as a criterion result. |
| **Failed** | A **valid** run in which the item's acceptance criterion is not met | **Record FAIL** for that item. Never re-run until it passes without recording the first outcome. |

### 4.7 Prerequisite checklist `[AUTH + DERIVED]`

1. **Gate C authority act on file**, naming this procedure id (or a variant) and the subset (§3).
2. **G-1, G-2, G-3, G-7, G-8, G-9 resolved or explicitly scoped** by that act.
3. Pinned checkout at `cec7080`; `git rev-parse HEAD^{tree}` = `22a7438c…`.
4. Build succeeds with the existing scripts; no repository file changed.
5. Disposable copies created from a **copy** of the provisioned store (never the original).
6. Harness + client + frame generator present in the temp directory with recorded `sha256`.
7. Drift manifest (Q11) recorded **before** any probe.
8. Operator present on the Windows host; no elevation.

---

## 5. ORDERED SEQUENCE

| Step | Item | Rationale |
|---|---|---|
| 1 | **Q11 (before)** | Trust anchor — nothing else is valid if surfaces drifted |
| 2 | **Q2** (S4 control, then S1–S3) | The endpoint must exist and refuse correctly before anything is measured |
| 3 | **Q10** | Validates the process under test (one store) |
| 4 | **Q9** | Mandatory; uses the same harness; independent of Q3/Q4 |
| 5 | **Q3** | Needs a trusted, live endpoint |
| 6 | **Q4** | Needs Q2/Q3 plus the isolation copies |
| 7 | **Q1** | Records only (V-5 endpoint-phase inventory) |
| 8 | **Q11 (after)** | Post-run drift; closes the run |
| — | **Q5–Q8** | **Not executed** — blocked on Gate E (G-2) |

---

## 6. Q1–Q11 PROCEDURES

Each entry states: governing source; subset status; prerequisites/fixtures; procedure; observables;
acceptance; failure; artifact; derived items. **No entry is a result.**

### Q1 — Gate V on the deployment host

| Field | Content |
|---|---|
| Source | S-1 §10 Q1, §9 |
| Status | **PROPOSED-IN** — **records only**, no measurement (V-1–V-4 waived under S-6; subject to **G-1**) |
| Prerequisites | Running endpoint (Q2/S4); host manifest |
| Procedure | Record the **endpoint-phase V-5 inventory**: Windows build, Node version of the endpoint process, libuv (`process.versions.uv`), endpoint name format, account/SID, elevation state. Compare with the V-P record (`build 26200`, Node `v24.14.0` probe, libuv `1.51.0`). Record the **waiver-precedence reading** exactly as the Gate C act states it — this procedure does not choose the reading. |
| Observables | Inventory values; the act's recorded reading; any deviation |
| Acceptance | Inventory complete; deviations reconciled against F-1…F-9 with **no design change**; the act's recorded reading present `[AUTH]` |
| Failure | An unreconciled deviation; a missing or contradictory reading; any attempt to record Q1 as PASS |
| Artifact | `V5-endpoint-inventory.json` + raw console |
| Derived / open | The **recording format** `[DERIVED]`; the **reading itself** is **G-1** and **G-3** (V-6) |

### Q2 — Startup fail-closed

| Field | Content |
|---|---|
| Source | S-1 §10 Q2; clauses C2, C5.3, C5.5, C6 |
| Status | **PROPOSED-IN** |
| Prerequisites | Copies C-E (control), C-B (no binding), C-D (A-2 table removed); `IPD_PORTFOLIO_DB_PATH` unset scenario |
| Procedure | **S4 control** — valid copy: endpoint binds and answers a control request. **S1** — env var unset. **S2** — C-B: zero `ACTIVE` bindings. **S3** — C-D: A-2 table dropped, ledger still at `003`. For each: start the harness, capture phases, exit code, and the pipe state. |
| Observables | Phases reached (harness log); exit code; `Test-Path \\.\pipe\<name>` false / connect ⇒ `ERROR_FILE_NOT_FOUND`; no TCP listener `[DERIVED]`; refusal reason from the harness log only |
| Acceptance | S1–S3: **no connectable endpoint at any point**, no fallback, process refuses. S4: pipe present, control request succeeds `[AUTH — C2/C5.3/C5.5]` |
| Failure | Any listener in S1–S3; any fallback; a "successful" start with a failed precondition |
| Artifact | Per-scenario raw logs + `Q2-matrix.json` |
| Derived / open | The "no TCP listener" check and the exact scenario encodings `[DERIVED]`; fixture writes are **G-9** |

### Q3 — Claim-refusal matrix

| Field | Content |
|---|---|
| Source | S-1 §10 Q3; C7 + C6 |
| Status | **PROPOSED-IN** |
| Prerequisites | C-A; frame generator; store digest before/after |
| Procedure | For each of **7 classes** — `principal`, `owner`, `tenant`, `scope`, `companyId`, `identityStatus`, `resolutionDisposition` — send a valid frame carrying the claim; plus one **nested** case inside `holdings`. After each, send a control request. |
| Observables | Bytes received (must be **0**); connection closed; store `sha256` unchanged; control request succeeds; local refusal reason (`CALLER_SUPPLIED_AUTHORITY`) from the sink, not the wire |
| Acceptance | 7/7 + nested ⇒ **0 bytes**, byte-identical across classes; store unchanged; endpoint live `[AUTH — C7/C6]` |
| Failure | Any byte returned; any store change; any class distinguishable from another |
| Artifact | `Q3-matrix.jsonl` (one row per class) + raw client output |
| Derived / open | The **equality** requirement (indistinguishability between classes) is `[DERIVED]` from C6's "no owner disclosure"; the class list is `[AUTH]` from Q3 |

### Q4 — Owner/tenant isolation

| Field | Content |
|---|---|
| Source | S-1 §10 Q4; C3, C5.5, C6 |
| Status | **PROPOSED-IN** |
| Prerequisites | C-A (own / foreign-owner / other-tenant portfolios); C-C (second principal bound, portfolio owned by the first); C-B (revoked) |
| Procedure | (a) bound principal reads own portfolio ⇒ success; (b) foreign id ⇒ 0 bytes; (c) other-tenant id ⇒ 0 bytes; (d) C-B ⇒ startup refuses (cross-check Q2/S2); (e) C-C ⇒ second principal's request for the first's portfolio ⇒ 0 bytes **identical** to a nonexistent id |
| Observables | Bytes per case; success payload for (a); identity of (b)/(c)/(e) outcomes |
| Acceptance | Success **iff** the `(applicationUserId, tenantId, portfolioId)` triple matches the bound principal; every other case byte-identical to "not found" `[AUTH]` |
| Failure | Any success outside the triple; any difference between foreign and missing |
| Artifact | `Q4-matrix.jsonl` |
| Derived / open | Serial-binding design (the exactly-one-`ACTIVE` rule prevents coexistence) `[DERIVED]`; fixture writes **G-9** |

### Q5 — Canonical identity *(deferred)*

| Field | Content |
|---|---|
| Source | S-1 §10 Q5; C12; DP-2 2F |
| Status | **DEFERRED — BLOCKED (Gate E)**. No procedure is authorized. |
| Why blocked | No wire path reaches the canonical boundary: `save` refuses at `operations.ts:307` before identity work; `resolveHoldingIdentity` is not among the four wire operations (`entrypoint.ts:143`). The clause "one match proceeds only under the separately authorized write policy" cannot be exercised. |
| What would be required | The Gate E write policy; then a write with one match under that policy, and zero/conflicting matches refused **before** serialization/port/store with quarantine evidence. |
| Prohibited now | Any write; any claim that the in-process evidence qualifies Q5 |

### Q6 — DP-2 Option 2F *(deferred)*

| Field | Content |
|---|---|
| Source | S-1 §10 Q6; DP-2 2F |
| Status | **DEFERRED — BLOCKED (Gate E)** |
| Why blocked | "Unresolved/ambiguous writes refused" and "no partial revision" require a save that reaches persistence. The *no-bypass* half is statically observable today (no bypass token in `src/ipc/**` or `src/user_portfolio/**`; the legacy bypass in `src/portfolio/consolidation.ts` is byte-unchanged and unreachable because `save` refuses). |
| Prohibited now | Any write; any claim of Q6 qualification |

### Q7 — Revision / lifecycle *(deferred)*

| Field | Content |
|---|---|
| Source | S-1 §10 Q7 |
| Status | **DEFERRED — BLOCKED (Gate E)** |
| Why blocked | Stale `expectedRevision`, duplicate-content no-op and tombstone handling are save/delete behaviours. |
| Prohibited now | Any write; any claim of Q7 qualification. A read-only tombstone sub-check would still require a fixture write (G-9). |

### Q8 — Durability *(deferred)*

| Field | Content |
|---|---|
| Source | S-1 §10 Q8 |
| Status | **DEFERRED — BLOCKED (Gate E)** for the write half; the revocation/restart half is qualifiable in principle but is **not** authorized here |
| Why blocked | "write → stop both processes → restart → read back" requires a durable write. "Both processes" is ambiguous in a single-process design (**G-7**). |
| Prohibited now | Any write; any interpretation of "both processes"; any claim of Q8 qualification |

### Q9 — Mandatory C5.1 zero-bytes probe

Full specification in **§7**. Summary:

| Field | Content |
|---|---|
| Source | S-1 §10 Q9 + **S-2 §4.3(3), §6(1)**; S-1 C5.1; S-3 §5.4 |
| Status | **PROPOSED-IN — MANDATORY** |
| Prerequisites | Live endpoint (Q2/S4); Windows host; read-only client; control direction; harness counters |
| Acceptance | See §7.4 |
| Failure | See §7.5 |
| Artifact | `Q9-*.jsonl` + raw client/server logs + manifests |
| Derived / open | N, windows, controls, artifact format — **all `[DERIVED]`, G-8** |

### Q10 — Exactly one portfolio store

| Field | Content |
|---|---|
| Source | S-1 §10 Q10; C11 |
| Status | **PROPOSED-IN** |
| Prerequisites | Running endpoint on C-E |
| Procedure | **Static**: enumerate import sites of the store module; confirm one `initializePersistenceWithConfig` call site in `src/` (`entrypoint.ts:214`) and handle reuse (`:200–215`). **Runtime**: enumerate the data directory for `*.sqlite`, `-wal`, `-shm` before/after; confirm exactly one store file and one owning process; confirm the endpoint opens no second path. |
| Observables | File inventory; process/DB ownership; harness log showing a single open |
| Acceptance | Exactly one portfolio store, one owning process, no second store module on the IPC path `[AUTH — C11]` |
| Failure | A second store file, a second connection, or a second store module |
| Artifact | `Q10-inventory.txt` + `Q10-static.txt` |
| Derived / open | The runtime inventory method `[DERIVED]` (no Sysinternals dependency assumed) |

### Q11 — Drift check

| Field | Content |
|---|---|
| Source | S-1 §10 Q11 |
| Status | **PROPOSED-IN** |
| Prerequisites | Pinned checkout at `cec7080` |
| Procedure | Record `git rev-parse HEAD`, `HEAD^{tree}` (= `22a7438c…`), and `sha256` of the fifteen files (S-9 §2) + `package.json` + `tsconfig.json`, **before** and **after** the run. |
| Observables | Tree hash; 15/15 file digests; config digests |
| Acceptance | 15/15 identical and tree identical, before and after `[AUTH — Q11]` |
| Failure | Any drift ⇒ the run is **invalid**, not merely failed |
| Artifact | `Q11-manifest-before.json`, `Q11-manifest-after.json` |
| Derived / open | The digest set and format `[DERIVED]` |

---

## 7. MANDATORY C5.1 / Q9 — FULL PROBE SPECIFICATION

### 7.1 Authoritative requirements `[AUTH]`

1. **Mandatory, not optional:** S-2 §4.3(3) — *"preserved as a MANDATORY qualification requirement"*;
   S-2 §6(1) — *"probe that a read-only connection receives zero bytes (mandatory)"*.
2. **The boundary:** *"the endpoint must emit **no bytes before a valid, authorized request** — no
   greeting, banner, version, or data"* (S-2 §4.3(3); S-1 C5.1).
3. **The scenario:** *"a read-only connection receives **no** bytes"* (S-1 §10 Q9).
4. **Why it is load-bearing:** F-5 — a read-only client open is legal on a duplex pipe; the ACL is
   waived, so C5.1 is the compensating control (S-2 §4.3(3); S-7).
5. **On the realized endpoint, on the deployment host** — not a probe, not a POSIX substitute
   (S-1 §9 V-E; S-2 §6).
6. **Gate B tests are not the qualification:** S-3 §5.4 — *"No Gate B test result may be recorded,
   cited, or published as the Q9 zero-bytes qualification."*

### 7.2 Derived harness decisions — **`[DERIVED]`, not authorized**

| # | Decision | Status |
|---|---|---|
| D-1 | **N ≥ 10 repetitions**, cold and warm | `[DERIVED]` — no governing record states N |
| D-2 | Observation window **≥ the 5 s idle timeout** (`server.ts:71`), closing at the timeout accepted **only** with 0 bytes | `[DERIVED]` |
| D-3 | Direction control: an `InOut` connection carrying a valid authorized frame **must** receive a response | `[DERIVED]` from the need to prove the harness can observe bytes |
| D-4 | Liveness control immediately before and after each probe | `[DERIVED]` from "not a dead endpoint" |
| D-5 | Server counters must show **accepted +1** and **no refusal** for each probe connection (`server.ts:126`) | `[DERIVED]` |
| D-6 | JSONL evidence format and `sha256` manifest | `[DERIVED]` |

**None of D-1…D-6 may be cited as an existing requirement.** The Gate C act must ratify or replace
them (G-8).

### 7.3 Procedure

1. **Q11-before** manifest; record host manifest and endpoint name.
2. Start the harness on **C-E**; confirm `phases`, `principal`, `schemaVersion`.
3. **Liveness control:** `InOut` + valid `portfolio.list` frame ⇒ non-zero response.
4. **Direction control:** same frame ⇒ response (proves observability).
5. **Read-only probe ×N:** open `PipeDirection.In`, **no write**, read for the window; record
   `connected`, `bytesReceived`, `elapsedMs`, close reason.
6. **Refusal-path probes:** send malformed, oversize, unknown-version and unknown-operation frames;
   each must yield **0 bytes** and a closed connection (the same boundary, exercised on refusal).
7. **Liveness control** again; then stop the harness; **Q11-after** manifest.
8. Repeat the whole cycle cold (fresh process) and warm (restarted process).

### 7.4 Acceptance `[AUTH + DERIVED]`

| # | Observation | Criterion | Tag |
|---|---|---|---|
| 1 | Bytes received by the read-only client | **0** | `[AUTH]` |
| 2 | Client open | **succeeded** (admitted) | `[AUTH]` — F-5 read-only legality |
| 3 | Connection state | open until the idle timeout, then closed by the server | `[DERIVED]` |
| 4 | Server counters | accepted +1; no refusal for the probe | `[DERIVED]` |
| 5 | Liveness control | valid response before **and** after | `[DERIVED]` |
| 6 | Direction control | non-zero bytes for a valid request | `[DERIVED]` |
| 7 | Refusal paths | 0 bytes each | `[AUTH — C5.1/C6]` |
| 8 | Repetition | N/N identical, cold and warm | `[DERIVED — D-1]` |

### 7.5 Failure and invalid-run interpretation

| Situation | Interpretation |
|---|---|
| Any byte received before a valid, authorized request | **FAIL** of Q9 |
| Open **fails** (OS refusal) | Not a zero-byte result — record as a distinct outcome; the read-only scenario was not achieved (`[DERIVED]` distinction) |
| Endpoint closed before the window with 0 bytes | Record; acceptable **only** if closure is the idle timeout; otherwise investigate |
| Liveness control fails | **INVALID RUN** — not a pass (D-4) |
| Direction control yields 0 bytes for a valid request | **INVALID RUN** — the harness cannot observe bytes (D-3) |
| Refusal path returns bytes | **FAIL** of Q9 *and* of C6 |

### 7.6 Artifact

`Q9-<runid>.jsonl` (per-iteration rows), raw client console, raw harness log, host manifest, and the
Q11 manifests — all hashed. No synthesised or illustrative rows (S-5 §5).

---

## 8. GOVERNANCE ISSUES — WHAT A FUTURE ACT MUST DECIDE

> Each issue is **recorded, not resolved**. Nothing below grants or revokes a waiver, changes a gate
> order, or selects an interpretation.

### G-1 — V-E re-runs versus waiver precedence

**The texts.** S-1 §9: *"V-1/V-3/V-4 are **re-run against the production endpoint** after gate B"*.
S-2 §6.4: *"Where a V-E item would repeat one of the four PA-waived measurements, **the waiver
governs** unless the Program Authority records narrower scoping for the production endpoint."* S-5 §3
still lists V-1/V-4 V-E as *"Re-run"*.

**Question for the act.** Does the §6.4 precedence rule govern at Gate C, so that no V-1/V-3/V-4 V-E
re-run is required — and if not, what narrower scoping is recorded for the production endpoint?

**Prohibited until resolved.** Executing any waived measurement; recording Q1 as closed; treating V-P
evidence as endpoint evidence; recording V-1–V-4 as PASS/FAIL/BLOCKED.

### G-2 — Gate C sequencing versus Gate E-dependent Q5–Q8

**The texts.** S-1 §14 orders Gate C before Gate D/E; S-1 §10 Q5–Q8 require writes; S-2 §7 grants no
durable writes; S-3/S-4 forbid durable-write expansion.

**Question for the act.** May Gate C proceed on the read-only subset with **Q5–Q8 formally deferred**
to a Gate E-dependent phase, and is a Gate C record that closes only the subset consistent with §14?

**Prohibited until resolved.** Qualifying Q5–Q8; executing any write; describing Gate C as fully
complete; stretching this procedure to cover writes.

### G-3 — V-6 send-half disposition

**The texts.** S-5 §3 records V-6 as *"partial — connect only"*; the send half was never executed and
is **not** among the four waivers (S-6); V-6 is not in S-1 §9's V-1…V-5 list.

**Question for the act.** Is the V-6 send half **in or out of scope** for Q1, and if in scope, under
what authority is it executed?

**Prohibited until resolved.** Claiming V-6 satisfied; executing the send half.

### G-4 — No Gate C procedure existed until this document

**Question for the act.** Does the PA adopt this procedure (`…-PROCEDURE-2026-10-17-01`) as the Gate C
procedure, or a named variant?

**Prohibited until resolved.** Any execution.

### G-5 — Missing runner / unchanged `package.json`

**The texts.** No packaged runner exists; `package.json` scripts are in the byte-unchanged set (S-4
item 3).

**Question for the act.** Is the **operator-side harness pattern** (a `.mjs` script in a temp
directory importing the built module; no repository file added) authorized for the qualification?

**Prohibited until resolved.** Adding scripts or files to the repository; implementing a runner;
modifying `package.json`, `tsconfig`, or any build configuration.

### G-6 — Windows versus POSIX evidence

**Question for the act.** Confirm the designated host is the **Windows laptop**, and that POSIX test
results (including all Gate B suites) are **explicitly non-qualifying**.

**Prohibited until resolved.** Substituting POSIX results; recording any non-Windows run as
qualification.

### G-7 — Q8 "both processes"

**Question for the act.** In a design where one IPD process owns the store, what does *"stop both
processes"* mean — endpoint process and client, or endpoint process and store host?

**Prohibited until resolved.** Executing Q8's restart half under an assumed interpretation.

### G-8 — Derived criteria

**Question for the act.** Does the PA ratify the derived criteria in this procedure — N ≥ 10, the idle
window, the counters, the controls, the invalid/failed distinction, and the artifact format — or
replace them with different thresholds?

**Prohibited until resolved.** Treating any `[DERIVED]` criterion as authorized; publishing a result
measured against an unratified threshold.

### G-9 — Disposable-fixture write scoping

**Question for the act.** May qualification **create fixture data** (portfolios, a second principal, a
revoked binding, a dropped A-2 table) **in disposable copies only**, and what constraints apply
(copy provenance, path, destruction)?

**Prohibited until resolved.** Writing to the authoritative portfolio store (permanently prohibited);
creating any fixture; copying the store without recorded provenance.

---

## 9. VALIDATION AND NON-CLAIMS

| Check | Result |
|---|---|
| Q1–Q11 all covered | **Yes** — §6 has eleven entries; Q5–Q8 marked deferred |
| Every requirement has a source | **Yes** — §2 traceability table |
| Derived criteria identified | **Yes** — `[DERIVED]` tags throughout; consolidated in §8 G-8 |
| G-1…G-9 addressed | **Yes** — §8 |
| C5.1/Q9 mandatory and unexecuted | **Yes** — §7; nothing executed |
| Q5–Q8 blocked | **Yes** — §3, §6 |
| Qualification/acceptance claims | **None** |

**Explicit non-claims.** Gate C was **not** executed; no probe ran; no fixture was created; no
endpoint was started; no frame was sent; no test was re-run. **No Q item is qualified or passed.**
**C5.1/Q9 is not qualified.** The proposed subset is **not approved**. No Gate D/E, P-6/P-8,
production eligibility, durable-write expansion, G24 promotion or merge is authorized. The four Gate V
waivers remain `NOT REQUIRED — PA-WAIVED` and are **waivers, not technical proof**. H-18, DP-2 Option
2F, C11 and C1–C12 remain in force. **The IRR repository was not accessed.**

*End of procedure.*
