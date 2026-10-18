# IIPS v3.0 — G-2: **IPD GATE C QUALIFICATION AUTHORITY (D-GC) — ACT PREPARED FOR DECISION**

> ## STATUS: **PROPOSED — NOT APPROVED — NOT AUTHORITY TO EXECUTE**
> This artifact puts **one** matter to the Program Authority: **D-GC — the scoped authority to
> execute a bounded, read-only Gate C qualification** — and the nine subsidiary decisions
> (A–I) that the published procedure leaves open. **It contains no rendered approval, no
> approver, no acceptance, and no implied consent.** Nothing in it may be executed, cited as
> authority, or treated as a qualification result.
>
> **Gate C remains NOT GRANTED.** Qualification may begin **only after** the Authority renders
> this act in its own words, in this channel, recorded durably under the FORM precedent. An
> ACCEPT of this act authorizes **execution of the read-only subset only**; it does **not**
> accept any result (that is a separate act after evidence review) and does **not** open
> Gate D, Gate E, P-6/P-8, production eligibility, durable writes, G24 promotion, or any merge.

| Field | Value |
|---|---|
| **Act identifier** | `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-AUTHORITY-2026-10-17-01` |
| **Artifact type** | **Prepared qualification-authority act** — a *request for decision*; renders nothing |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream, open, unmerged) |
| **Authority capacity required to render** | **RAMKI — Program Authority**, acting as the **IPD qualification authority** for `ramkivs/iips-production-market-data` |
| **Subject of the authority** | A bounded, **read-only** Gate C qualification against the **published** Gate B implementation |
| **Implementation under qualification** | `refs/heads/gate-b/local-principal-ipc-implementation` @ `cec7080252183a6a5332efe351e61c254d342a2d`, tree `22a7438bc41e5b9853700c5a3737702898da8c53`, parent `2ded0e981407b38c73bdea164153f53856aa7217` |
| **Procedure of record** | `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-PROCEDURE-2026-10-17-01` — `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_QUALIFICATION_PROCEDURE_2026-10-17.md`, commit `34fcafc69765461a1abc140e7ce4c606498e691f`, blob `a263a05ca45e7304f016013ce78a338808ab04c0`, sha256 `13f8d0b3…` |
| **Readiness assessment of record** | `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-READINESS-ASSESSMENT-2026-10-17-01` — commit `b28bdc9f49943433befdc4ffce6a918c0856ba85`, blob `efc2d0d210922cddb11e17b2de6f0570c1772a51`, sha256 `93144553…` |
| **Governing contract** | `L-IPC-1` rev 2, C1–C12 — accepted text blob `cab04b6f94618c9afad1440882ebf63437fdf6f8`; §10 defines Q1–Q11 |
| **Governing gate-order record** | `IIPS-V3-G2-IPD-SECURITY-CONTRACT-ACCEPTANCE-DECISION-2026-10-16-01` — blob `f7086304…`, §6 (V-E), §7 (limits), §8 row 4 (Gate C **NOT GRANTED**) |
| **Production status** | NON_PRODUCTION — one user, one personal laptop, H-18 scope |
| **Prepared at (UTC / local)** | `2026-10-17T06:26:35Z` (authoritative GitHub API HTTP `Date`) / 2026-10-17 11:56 IST |

---

## 1. WHAT IS ALREADY ESTABLISHED — AND WHY THIS IS THE ONLY MATTER LEFT

| Matter | State | Record |
|---|---|---|
| Contract `L-IPC-1` rev 2, C1–C12 | **ACCEPTED WITH CHANGES** (2026-10-16) | acceptance decision, blob `f7086304…` |
| Gate A — local provisioning | **PROVISIONED · RECONCILED · PUBLISHED** (one-time act, spent) | execution record `2043e876…`; reconciliation `b1353d5b…` |
| Gate B — D-1/D-2/FORM | **RENDERED · EXECUTED** | act blob `d542ce4d…`; creation record `ba32b271…` |
| Gate B — D-4 implementation authority | **RENDERED — ACCEPT** | decision `ee6122e8…`, commit `d5c8192…` |
| Gate B — implementation | **PUBLISHED · VERIFIED · UNMERGED** | `cec7080…` on the designated ref, 15 added / 0 modified / 0 deleted |
| Gate B — completion handoff | **PUBLISHED** | `b21b367…`, blob `7ffed054…` |
| Gate C — readiness assessment | **PUBLISHED** | `b28bdc9…`, blob `efc2d0d2…` |
| Gate C — procedure (P0) | **PUBLISHED — preparation only** | `34fcafc…`, blob `a263a05c…` |
| **Gate C — qualification authority** | **NOT GRANTED — this act is the request** | acceptance decision §8 row 4 |

**Consequently** the procedural and evidentiary groundwork is complete; what remains is exactly one
authority decision, plus the nine subsidiary questions the procedure deliberately left open rather
than answering by inference.

---

## 2. VERIFIED STATE AT PREPARATION (live remote, read-only)

| # | Check | Verified value |
|---|---|---|
| 1 | IPD `main` | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` — **unmoved** |
| 2 | `gate-a/local-principal-enablement-2026-10-16` | `2ded0e981407b38c73bdea164153f53856aa7217` — **unmoved** |
| 3 | `gate-b/local-principal-ipc-implementation` | `cec7080252183a6a5332efe351e61c254d342a2d`, tree `22a7438c…` |
| 4 | Evidence branch tip | `34fcafc69765461a1abc140e7ce4c606498e691f` |
| 5 | Readiness assessment blob / sha256 | `efc2d0d2…` / `93144553…` — **match the supplied commit** |
| 6 | Procedure blob / sha256 | `a263a05c…` / `13f8d0b3…` — **match the supplied commit** |
| 7 | PR #8 | **OPEN, unmerged**, base `main`, evidence-only |
| 8 | PRs from the implementation ref | **none** |
| 9 | IRR repository | **not accessed** — no cross-repository action of any kind |

---

## 3. THE FOUR SEPARABLE ACTS — NOT INTERCHANGEABLE

The procedure (§0) distinguishes four acts. **This document concerns only the second**, and even
then only as a *request*:

| # | Act | What it produces | Status | What it does **not** do |
|---|---|---|---|---|
| **1** | **Preparation** — procedure, harness design, fixtures plan, manifests | Documents | **DONE** (P0 procedure) | authorize execution |
| **2** | **Execution authority** — *the subject of this act* | Permission to run the subset | **NOT GRANTED** | accept a result; open later gates |
| **3** | **Acceptance of results** | A qualification disposition | **NOT GRANTED** — requires actual evidence review under criteria approved in (2) | supply authority to *run* anything |
| **4** | **Subsequent gate authority** — Gate D, Gate E, P-6/P-8, production | Separate acts | **NOT GRANTED** | follow automatically from (2) or (3) |

**Rendering (2) does not render (3).** No item becomes "qualified" by being executed; execution
produces *evidence*, and acceptance of that evidence is a distinct subsequent act by the Authority.

---

## 4. DECISION A — GATE C SCOPE AND ORDER

### 4.1 Proposed subset — **PROPOSED, NOT APPROVED**

| Item | Requirement (`L-IPC-1` §10) | Proposed disposition |
|---|---|---|
| **Q1** | Gate V (§9) passed and published, on the deployment host | **IN SUBSET** — records only (V-5 endpoint-phase inventory + the applied V-E reading) |
| **Q2** | Startup fail-closed: missing/invalid binding, missing store, unverified migrations ⇒ no endpoint, no fallback | **IN SUBSET** |
| **Q3** | Claim-refusal matrix; no owner disclosed; no write | **IN SUBSET** |
| **Q4** | Owner/tenant isolation; other/absent binding fails indistinguishably from "not found" | **IN SUBSET** |
| **Q5** | Canonical identity; one match proceeds only under the separately authorized write policy | **EXCLUDED — deferred to a Gate E-dependent phase** |
| **Q6** | DP-2 2F: unresolved/ambiguous writes refused; no bypass; no partial revision | **EXCLUDED — deferred** |
| **Q7** | Revision/lifecycle: stale `expectedRevision`; duplicate no-op; tombstone non-disclosure | **EXCLUDED — deferred** |
| **Q8** | Durability: write → stop both processes → restart → read back; revoked binding fails closed | **EXCLUDED — deferred** |
| **Q9** | **C5.1 negative test** — a read-only connection receives **no bytes** | **IN SUBSET — MANDATORY** |
| **Q10** | No parallel store; exactly one portfolio store | **IN SUBSET** |
| **Q11** | Drift check; digests recorded | **IN SUBSET** |

**Proposed subset: Q1, Q2, Q3, Q4, Q9, Q10, Q11 (seven items). Deferred: Q5, Q6, Q7, Q8 (four items).**

### 4.2 Why Q5–Q8 are excluded

They require the **write policy that Gate E owns**, which is **not granted** (acceptance decision
§7: *"no durable integration or portfolio writes; no successful portfolio-save claims"*). On the
published object, `portfolio.save` **always refuses** (`src/user_portfolio/operations.ts:307`), and
`resolveHoldingIdentity` is **not** among the four wire operations
(`src/ipc/entrypoint.ts:143`). Q5's own text — *"one match proceeds only under the separately
authorized write policy"* — cannot be satisfied while that policy does not exist. **No substitution,
in-process test, or interpretation closes them.**

### 4.3 Consequence to be recorded

If the Authority renders A, the Gate C disposition produced later will be a **partial
qualification** covering seven of eleven items, with four items **expressly deferred**. It must be
recorded as `PARTIAL — Q5–Q8 DEFERRED`, never as "Gate C complete".

---

## 5. DECISION B — G-1: GATE V WAIVERS VERSUS V-E RERUN LANGUAGE

### 5.1 The exact conflict

| Record | Text | Date |
|---|---|---|
| **S-1** — contract rev 2 §9 (*proposal text*) | *"**V-E — endpoint phase.** V-1/V-3/V-4 are **re-run against the production endpoint** after gate B, together with the application-level controls C5.1/C5.3/C6 at gate C (Q9/Q2/Q4)."* | 2026-10-16 |
| **S-5** — Gate V procedure §3 (*"PER-REQUIREMENT DISPOSITION MAP"*) | V-1 V-E column: **"Re-run on the production name/process"**; V-4: **"Re-run + application-level C5.3/C6"** | 2026-10-16 |
| **S-2** — acceptance decision §6(4) (*the Authority's own act*) | *"Where a V-E item would repeat one of the four **PA-waived** measurements, **the waiver governs** unless the Program Authority records narrower scoping for the production endpoint (stated here so it is decided, not assumed)."* | 2026-10-16 |
| **S-1** — §9 dated note *added at acceptance* | Same rule restated in the proposal itself: *"Where a V-E item would repeat a waived measurement, **the waiver governs** unless the Program Authority records narrower scoping for the production endpoint."* | 2026-10-16 |

### 5.2 Proposed interpretation — **with documentary basis**

> **The waiver governs at Gate C.** No V-1, V-3 (second-account) or V-4 re-run is required against
> the production endpoint; Q1 is discharged by **(i)** the four waivers standing unamended and
> **(ii)** a V-5 endpoint-phase inventory recorded at qualification time.

**Basis:** the precedence rule is stated **twice** in records **later than or equal to** the re-run
language, once by the **authority itself** in its acceptance act (S-2 §6(4)) and once in a **dated
note appended to the proposal at acceptance** (S-1 §9). Both are explicit, both are the more recent
statement, and both contemplate the exact situation that now arises. The earlier S-1/S-5 "re-run"
phrasing **predates** the waivers and is subject to the later rule.

**This remains a proposal.** S-2 §6(4) is written as a rule the Authority applies — *"unless the
Program Authority records narrower scoping"* — so the rendered act should **record the applied
reading in one line**. Rendering A without it leaves Q1 ambiguous (the readiness assessment's G-1).

### 5.3 What this decision does **not** do

- It does **not** revoke, amend, narrow or extend any waiver. The four waivers stand **exactly**:
  `V-1 ACL/SDDL capture`, `V-4 pipe collision and re-bind testing`, `Second-account access test`,
  `Remote-machine access test` — all `NOT REQUIRED — PA-WAIVED.`
- It does **not** permit execution of any waived measurement.
- It does **not** describe any waiver as technical proof. The waived properties — effective ACL/SDDL,
  cross-account isolation, remote isolation, lifecycle fail-closed behaviour — remain **technically
  unverified**.
- It does **not** decide G-3 (V-6); see §7.

### 5.4 Decision required

**D-GC-B:** confirm, or replace, the applied reading in §5.2. If the Authority wishes any waived
measurement re-run at V-E, that requires **narrower scoping recorded here** — a separate, explicit
line — and this procedure must then be revised (§5.3 of the procedure; the readiness assessment G-1).

---

## 6. DECISION C — G-2: GATE ORDER

### 6.1 The conflict

S-1 §14 orders the gates **A → B → C → D → E**, with Gate C defined as *"Execute §10 on the laptop"*.
But §10's Q5–Q8 **require writes**, and S-2 §7 grants none. **Gate C cannot close Q1–Q11 in full
before Gate E.**

### 6.2 The two options — presented, not chosen

| # | Option | Effect | Authority needed |
|---|---|---|---|
| **1** | **Bounded read-only Gate C subset (Q1–Q4, Q9–Q11), with Q5–Q8 explicitly deferred to a Gate E-dependent phase; Gate C recorded as `PARTIAL`.** | Gate order **unchanged**; Gate C's *scope of closure* is narrowed and its incompleteness is recorded rather than papered over. | **This act** (§4) |
| **2** | **A different gate order** — e.g. Gate E write policy authorized before the write-dependent portion of Gate C, changing S-1 §14. | Gate order **changes**; the contract's §14 sequence is superseded by a later act. | **A separate governance act** — cannot be done here |

### 6.3 Proposed

**Option 1**, on the basis that it **does not alter the gate order**: it executes what the published
implementation can actually do, defers what it cannot, and records the result as partial. Option 2
would require the Authority to restate §14, which this act **does not propose and cannot do**.

**Whichever option is rendered must be stated explicitly.** Silence must not be read as Option 1.

### 6.4 Decision required

**D-GC-C:** select Option 1 or Option 2. If Option 2, this act's §4 scope lapses and a separate act
is required.

---

## 7. DECISION D — G-3: THE V-6 SEND HALF

### 7.1 Recorded status — **exact**

| Source | Recorded text |
|---|---|
| S-6 §5 | *"**V-6** — Same-account residual: connect **and send** demonstrable — **PARTIAL — connect demonstrated; send NOT TESTED** … Same-account **send/write** is source-evidenced only (F-3: CREATOR OWNER full control) and was not measured."* |
| S-6 §9.4 | *"**V-6** … is an item introduced by the trust-boundary assessment §8 for documenting the accepted residual; it is **corroborative, not a §9 criterion**, and is not a blocker."* |
| S-6 §5 / §3 | V-6 is **not** among the four waivers. It was neither waived nor satisfied. |

### 7.2 Proposed disposition — **with documentary basis**

> **The V-6 send half is OUT of Q1's scope.** It is not a `§9` criterion, it is recorded as *"not a
> blocker"*, and Q1's governing text cites *"Gate V (§9)"* — a section that does not contain V-6.

**Basis:** S-6 §9.4 is explicit on both points (not a §9 criterion; not a blocker), and S-1 §10 Q1
references *"Gate V (§9)"*, whose measurement set is V-1…V-5.

**This remains a proposal**, because S-6 never records a formal in/out decision and the Gate C act is
where Q1's composition must be fixed once and for all.

### 7.3 What must not be inferred

- **V-6 is not satisfied.** The send half was never measured.
- **The same-account residual remains disclosed and unmitigated** (F-3: CREATOR OWNER full control;
  a process running as the operator, including malware, is outside the boundary). Excluding V-6 from
  Q1 does not weaken the disclosure; it declines to make an unmeasured corroborative item a
  qualification criterion.
- **No execution of the send half** is authorized by this act in any disposition of it.

### 7.4 Decision required

**D-GC-D:** confirm V-6 **out of scope** for Q1, or bring it **in** (which would require its own
execution authority and a procedure amendment).

---

## 8. DECISION E — G-4 / G-5: PROCEDURE AND HARNESS

### 8.1 Procedure of record

| Field | Value |
|---|---|
| Identifier | `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-PROCEDURE-2026-10-17-01` |
| Path | `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_QUALIFICATION_PROCEDURE_2026-10-17.md` |
| Commit | `34fcafc69765461a1abc140e7ce4c606498e691f` |
| Blob / sha256 | `a263a05ca45e7304f016013ce78a338808ab04c0` / `13f8d0b3…` |
| Version | **P0 — procedure preparation, not authorized, not executed** |

**D-GC-E1:** adopt this procedure, a named variant, or reject it. Until adopted, no execution is
permitted on any reading.

### 8.2 Proposed harness pattern — **PROPOSED, NOT APPROVED**

| Element | Proposal |
|---|---|
| **Location** | A **temp directory outside the repository** (Gate V precedent, S-5 §2) |
| **Form** | An **ESM `.mjs`** script importing the **built** module by absolute file URL: `dist/src/ipc/entrypoint.js` (the package is `"type": "module"`) |
| **Entry point used** | `startIpcEndpoint({ endpointName })` — the published API |
| **Output** | JSONL operator-side log: `phases`, `principal`, `schemaVersion`, `layout.modeEnforced`, `stats`, and the local refusal sink — **never on the wire** |
| **Build** | The **existing** compiler invocation (`npx tsc`); no new script |
| **Repository modifications** | **NONE** — no file added, no `package.json`, `tsconfig.json`, or build configuration change |

**Constraints that bind this proposal:**

1. `package.json` **scripts** are inside the D-4 **byte-unchanged set** (act §5.3; rendered decision
   item 3). The procedure's `npm`-less build is a **consequence** of that invariant, not a preference.
2. **No runner may be committed or implemented** under this act. A repository-resident runner would
   require the byte-unchanged set to be amended — a separate authority matter this act does **not**
   propose.
3. The harness must not alter the implementation, must import the **published** build, and its
   sha256 must be recorded in the run manifest.

**D-GC-E2:** approve the operator-side harness pattern and its constraints, or specify another
lawful pattern within the existing invariants.

---

## 9. DECISION F — G-6: QUALIFICATION ENVIRONMENT

### 9.1 Requirement

Qualification is defined **"on the deployment host"** (S-1 §10 Q1) and against the **realized
endpoint** (S-2 §6). The deployment runtime is **Windows named pipes** (S-1 §4.2 F-1; §4.3).

### 9.2 Classification of existing evidence

> **All existing evidence — including the complete Gate B suite (41/41), the full repository suite
> (823/823), and every POSIX-socket result — is EXECUTION evidence on a POSIX host and is
> NON-QUALIFYING for Windows Gate C.**

Reasons, each sourced: on Windows `modeEnforced = false` (`src/ipc/endpoint.ts`, published object) and
the ACL is waived (S-6), so POSIX permission results do not transfer; the C5.1 compensations exist
precisely because the Windows DACL cannot be narrowed by the application (F-2/F-3/F-6); and a POSIX
socket **is unlinked on clean close**, which makes several Windows lifecycle observations
structurally different.

### 9.3 Decision required

**D-GC-F:** designate the Windows laptop as the qualification host and confirm that POSIX evidence is
non-qualifying. **No local Windows testing** is performed or authorized by this act, and **no POSIX
substitution** may be recorded.

---

## 10. DECISION G — G-7: Q8 PROCESS AMBIGUITY

### 10.1 The unresolved text

S-1 §10 Q8: *"Durability: write → stop both processes → restart → read back; revoked binding fails
closed after restart."*

**"Both processes" is undefined** in a design where **one IPD process owns the store** and the peer
is a transient client. Candidate readings — (a) IPD endpoint process + qualification client;
(b) IPD endpoint process + the process holding the store — are **not distinguished anywhere in the
records**.

### 10.2 Proposed treatment

**Q8 remains deferred** (it is write-dependent in any case — see §4.2) **and** the ambiguity remains
**UNRESOLVED**. It is not resolved here, and it must not be resolved by assumption when Gate E
arrives.

### 10.3 Decision required

**D-GC-G:** none is possible **now** without inventing a meaning. The act should **record the
ambiguity as open** and state that resolving it is a precondition of any future Q8 authority. **No
restart test is authorized** under any reading.

---

## 11. DECISION H — G-8: DERIVED ACCEPTANCE CRITERIA

Every criterion below is **authored in the procedure**, not quoted from a governing record. **None is
authorized by default.** Each requires **approval, replacement, or rejection**.

### 11.1 Derived criteria table

| # | Criterion as proposed | Governing source (the requirement) | Proposed operational interpretation | Status |
|---|---|---|---|---|
| **H-1** | **N ≥ 10 repetitions**, cold and warm | Q9 text contains no repetition count | 10 runs cold + 10 warm, each identical | **PROPOSED — new threshold** |
| **H-2** | **Idle-timeout observation:** the read-only connection stays open until the 5 s idle timeout, then is closed by the server; closure at the timeout with 0 bytes is acceptable | Q9 requires "no bytes"; the timeout value is `server.ts:71` (implementation), not a contract clause | Accept closure **only** at ≈5 s; earlier closure recorded and investigated | **PROPOSED** |
| **H-3** | **Counter observation:** server `acceptedConnections` +1 and **no refusal** per probe (`server.ts:126`) | None in the contract — counters are an implementation facility | Use counters to prove **admission** (distinguishing zero bytes from an OS-level refusal) | **PROPOSED** |
| **H-4** | **Liveness control** immediately before and after each probe (valid request ⇒ response) | Implied by "not a dead endpoint"; not stated | Control failure ⇒ **INVALID RUN**, not a pass | **PROPOSED** |
| **H-5** | **Direction control:** an `InOut` connection with a valid frame **must** receive a response | Implied by the need to prove the harness can observe bytes | Zero bytes on the control ⇒ **INVALID RUN** | **PROPOSED** |
| **H-6** | **Invalid vs failed run:** invalid = control/drift/host failure (discard and repeat, recording why); failed = a valid run missing a criterion (record FAIL, never re-run silently to a pass) | Not stated in any governing record | As defined in procedure §4.6 | **PROPOSED** |
| **H-7** | **Evidence format:** raw unedited logs + JSONL rows + sha256 of every artifact, harness, and the 15 files; no synthesised rows | S-5 §5 requires publication of real output only ("No projected, illustrative, or synthesised results") | JSONL + manifests + run id `GQ-<yyyymmdd>-<nn>` | **PROPOSED — format only** |
| **H-8** | **Q2 control-first ordering** (S4 before S1–S3) and "no TCP listener" check | Q2 requires "no endpoint, no fallback" | Sequencing + listener check | **PROPOSED** |
| **H-9** | **Q3 cross-class equality:** all seven claim classes must be **byte-identical** in outcome | C6 ("no owner disclosure") | Equality asserted rather than per-class refusal alone | **PROPOSED** |
| **H-10** | **Q4 serial-binding design** (revoke → create, or a second copy) because exactly-one-`ACTIVE` forbids coexistence | Q4's isolation requirement; implementation rule | Fixture copies C-A/C-B/C-C | **PROPOSED** |
| **H-11** | **Q10 runtime inventory** (data-directory scan, single owning process) | C11 | Method chosen without third-party tooling | **PROPOSED** |
| **H-12** | **Q11 digest set:** 15 implementation files + `package.json` + `tsconfig.json`, before **and** after; any drift ⇒ run **invalid** | Q11 requires "digests recorded" | Exact file set and timing | **PROPOSED** |
| **H-13** | **Q1 recording format** for the V-5 inventory and the applied V-E reading | Q1 requires the Gate V result "passed and published" | JSON inventory + the §5.2 reading recorded verbatim | **PROPOSED** |

### 11.2 What this section does **not** say

- It does **not** assert that any threshold above is authorized.
- It does **not** assert that a result measured against an unratified threshold is valid.
- **If the Authority renders A without H, the derived criteria remain proposals and no run may be
  measured against them** — meaning execution would be procedurally incomplete.

### 11.3 Decision required

**D-GC-H:** ratify H-1…H-13 as written, or replace any of them. **Silence is not ratification.**

---

## 12. DECISION I — G-9: DISPOSABLE FIXTURES

### 12.1 Proposed boundary

| Rule | Proposal |
|---|---|
| **Store under test** | **A disposable copy** of the provisioned SQLite file, at an absolute path **outside the repository**, supplied via `IPD_PORTFOLIO_DB_PATH` |
| **Authoritative store** | **NEVER opened, NEVER written, NEVER used for fixtures** — permanently prohibited |
| **Provenance** | The copy's source path, source sha256, copy sha256 and copy timestamp recorded in the run manifest **before** any write |
| **Isolation** | One copy **per scenario** (C-A…C-E); no copy reused across scenarios; no copy placed in a shared or sync-backed directory |
| **Permitted fixture content** | Application users, tenant memberships, local principal bindings (create/revoke), portfolios, and the A-2 table removal — **on the copy only** |
| **Prohibited fixture content** | Any real operator data; any credential; any write that could reach the authoritative store; any modification to the provisioned database file |
| **Destruction** | Copies retained as evidence until the acceptance act disposes of them; deletion recorded |

### 12.2 Rationale

Isolation (Q4), startup refusal (Q2/S2, S3), lifecycle and durability scenarios **cannot** be
exercised without creating or removing rows. Doing so on the provisioned store would destroy the
Gate A provisioning act — which was **one-time and spent** — and would itself be an unauthorized
durable write.

### 12.3 What this does **not** authorize

- **No fixture is created** by this act's preparation.
- **No write** to the authoritative store is authorized under any circumstance.
- **No durable-write expansion** is implied: fixture writes occur on **copies of a file**, not through
  the endpoint, and exercise no Gate E policy.

### 12.4 Decision required

**D-GC-I:** approve the disposable-copy boundary, or narrow it further. If it is **not** approved,
Q2/S2–S3, Q4 and the revocation checks **cannot run**, and the subset reduces to V-5 recording (Q1),
Q3, Q9, Q10 and Q11.

---

## 13. Q1–Q11 COVERAGE MAP

| Q | In proposed subset? | Procedure § | Deferral / blocking cause |
|---|---|---|---|
| Q1 | **Yes** (records only) | §6 Q1 | Depends on B (§5) and D (§7) |
| Q2 | **Yes** | §6 Q2 | Needs I (§12) for S2/S3 |
| Q3 | **Yes** | §6 Q3 | — |
| Q4 | **Yes** | §6 Q4 | Needs I (§12) |
| Q5 | **No** | §6 Q5 | **Gate E** write policy |
| Q6 | **No** | §6 Q6 | **Gate E** |
| Q7 | **No** | §6 Q7 | **Gate E** |
| Q8 | **No** | §6 Q8 | **Gate E** + unresolved process meaning (G) |
| Q9 | **Yes — MANDATORY** | §7 | H (§11) for derived criteria |
| Q10 | **Yes** | §6 Q10 | — |
| Q11 | **Yes** | §6 Q11 | — |

**Seven in, four out. No item is qualified, passed, or pre-judged by this act.**

---

## 14. PRESERVED BOUNDARIES (MUST SURVIVE ANY RENDERING)

| # | Boundary | Status under this act |
|---|---|---|
| 1 | **H-18** — one user, one personal laptop, non-production | **Preserved** |
| 2 | **DP-2 Option 2F** — unresolved/ambiguous holdings refused before serialization/port/persistence | **Preserved, un-relaxed** |
| 3 | **`L-IPC-1` C1–C12** as accepted (blob `cab04b6f…`) | **Preserved, no clause relaxed** |
| 4 | **C11** — the G24 durable store remains the only portfolio store | **Preserved** |
| 5 | **Gate B implementation boundaries** — the fifteen files, the byte-unchanged set, tree `22a7438c…`, ref `cec7080…` | **Preserved; no movement, no modification** |
| 6 | **All four Gate V waivers** — `NOT REQUIRED — PA-WAIVED`, **waivers, not technical proof** | **Preserved; none revoked, narrowed or extended** |
| 7 | **C5.1/Q9 mandatory zero-bytes** requirement | **Preserved as mandatory; still unexecuted** |
| 8 | **Implementation tests ≠ qualification evidence** (D-4 act §5.4) | **Preserved; no Gate B result may be cited as qualification** |
| 9 | IRR HTTP `503 owner-context-unavailable` fence | **Preserved** |
| 10 | PR #8 open and unmerged; no competing PR | **Preserved** |

---

## 15. EXPRESSLY WITHHELD

Rendering this act — **in any disposition** — does **not** grant:

| Withheld | Note |
|---|---|
| **Gate C execution before formal acceptance and rendering of this act** | Preparation ≠ execution |
| **Acceptance of any qualification result** | Separate act, after evidence review under §11 criteria |
| **Gate D route admission** | Not granted; the IRR 503 fence stands |
| **Gate E write policy** | Not granted; Q5–Q8 remain blocked |
| **P-6 / P-8** | Not granted |
| **Production eligibility** | Not claimed or granted |
| **Durable-write expansion** | Not granted; fixture writes are on disposable copies only |
| **G24 promotion, merge, cherry-pick, re-pin** | Not granted for any lineage or derivative ref |
| **Merge of PR #8** | Not granted |
| **Any IRR action** | Out of scope; not accessed |

---

## 16. EXACT PROPOSED DECISION TEXT (for the Authority to render — optional)

> **IPD Gate C — qualification authority (D-GC).** On the published Gate B implementation
> `cec7080252183a6a5332efe351e61c254d342a2d` (tree `22a7438c…`, baseline `2ded0e98…`), the published
> Gate C readiness assessment (`b28bdc9…`) and procedure (`34fcafc…`), I authorize a **bounded,
> read-only Gate C qualification** of **Q1, Q2, Q3, Q4, Q9, Q10 and Q11 only**, executed on the
> **Windows deployment host** under the operator-side harness pattern, with fixtures confined to
> **disposable copies** of the store and the authoritative store untouched.
>
> **D-GC-A** — scope: the seven-item subset; **Q5–Q8 expressly excluded and deferred** to a
> Gate E-dependent phase; the result to be recorded as **`PARTIAL — Q5–Q8 DEFERRED`**, never as
> Gate C complete. — `ACCEPT` / `ACCEPT WITH CHANGES` / `REJECT` / `DEFER`
> **D-GC-B** — applied V-E reading: **the waivers govern**; no V-1/V-3/V-4 re-run; V-5 endpoint-phase
> inventory recorded; the four waivers unamended. — `ACCEPT` / `REJECT`
> **D-GC-C** — gate order: **Option 1** (bounded subset, §14 unchanged) / **Option 2** (separate act
> required). — `Option 1` / `Option 2`
> **D-GC-D** — V-6 send half **out of Q1 scope**, not satisfied, not executed. — `ACCEPT` / `REJECT`
> **D-GC-E** — adopt procedure `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-PROCEDURE-2026-10-17-01` and the
> operator-side harness pattern; no repository file added. — `ACCEPT` / `ACCEPT WITH CHANGES` / `REJECT`
> **D-GC-F** — the Windows laptop is the qualification host; all POSIX evidence is non-qualifying. —
> `ACCEPT` / `REJECT`
> **D-GC-G** — Q8 "both processes" remains **unresolved**; Q8 stays deferred; no restart test. —
> `ACCEPT` / `REJECT`
> **D-GC-H** — derived criteria H-1…H-13: — `RATIFY AS WRITTEN` / `REPLACE: <ids and text>` / `REJECT`
> **D-GC-I** — disposable-copy fixture boundary: — `ACCEPT` / `NARROW: <text>` / `REJECT`
>
> This act grants **no** Gate C acceptance, **no** Gate D admission, **no** Gate E write policy, **no**
> P-6/P-8, **no** production eligibility, **no** durable-write expansion, **no** G24 promotion and
> **no** merge. It runs on one laptop, one account, non-production. DP-2 Option 2F, C11, H-18, C1–C12
> and all four Gate V waivers remain in force and un-reopened.
>
> **Disposition:** `ACCEPT` / `ACCEPT WITH CHANGES` / `REJECT` / `DEFER`.

---

## 17. UNRESOLVED MATTERS — REQUIRING THE AUTHORITY'S EXPLICIT DECISION

| # | Matter | Why it cannot be decided here | Consequence if left open |
|---|---|---|---|
| **U-1** | Whether the seven-item subset is authorized (A) | Only the Authority may grant Gate C | Gate C remains not granted |
| **U-2** | Which V-E reading applies (B/G-1) | S-2 §6(4) reserves the reading to the Authority | Q1 cannot be recorded |
| **U-3** | Option 1 versus Option 2 (C/G-2) | Changes gate order if Option 2 | Nothing may execute |
| **U-4** | V-6 in or out (D/G-3) | No formal in/out decision exists | Q1 ambiguous |
| **U-5** | Procedure adoption and harness pattern (E) | Procedure is prepared, not approved | No lawful execution path |
| **U-6** | Host designation (F) | Scope statement is the Authority's | Results non-qualifying |
| **U-7** | Q8 "both processes" (G) | Undefined in every record | Q8 cannot ever be authorized |
| **U-8** | H-1…H-13 ratification (H) | Derived, not governing | Results measured against unratified criteria |
| **U-9** | Fixture scoping (I) | Involves writes, albeit on copies | Q2/S2–S3, Q4 cannot run |

**None of these is decided by this document. No consensus is manufactured.**

---

## 18. WHAT THIS TASK DID NOT DO — ATTESTATION

- **No qualification was executed.** No endpoint was started, no frame was sent, no probe was run.
- **No fixture was created**; no store copy was made; no write of any kind occurred.
- **No waiver was granted, revoked, narrowed, extended, or described as technical proof.**
- **No gate order was changed**; Option 2 is presented, not adopted.
- **No interpretation was silently selected** — every applied reading is marked *proposed* with its
  documentary basis and left for rendering.
- **No implementation, test, configuration, ref, baseline or prior record was modified.** This is a
  single additive documentation artifact.
- **No IRR access** occurred.
- **No authority was exercised**, and nothing here may be cited as authority to execute.

*End of prepared act `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-AUTHORITY-2026-10-17-01`.*
