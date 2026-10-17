# IIPS v3.0 — G-2: **IPD GATE C QUALIFICATION AUTHORITY (D-GC) — RENDERED DECISION RECORD**

> ## STATUS: **RENDERED — D-GC = ACCEPT AT THE BOUNDED READ-ONLY SUBSET**
> **Gate C execution authority is GRANTED for exactly seven items — Q1, Q2, Q3, Q4, Q9, Q10, Q11.**
> **Q5–Q8 are formally DEFERRED to a Gate E-dependent phase.** Gate C is **NOT** complete, **NOT**
> accepted, and **NOT** closed. **No qualification has been executed**, no fixture exists, and **no
> result of any kind is accepted by this act.**
>
> This record **renders** the Principal Authority's decision, supplied in the G-2 task channel on
> 2026-10-17, in the established decision-record format. The decision is the **Authority's**; the
> recording is the **Recording Agent's**. The artifact does **not** create, replace, extend or
> construe the decision, and it does **not** rewrite the proposal it renders (§1.3).

| Field | Value |
|---|---|
| **Act identifier** | `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-AUTHORITY-2026-10-17-01` |
| **Artifact type** | **Rendered authority act** (records the Authority's decision on the prepared act) |
| **Authority** | **RAMKI — Program Authority**, acting as the **IPD qualification authority** for `ramkivs/iips-production-market-data` |
| **Rendered** | 2026-10-17 (Asia/Calcutta) · recorded and published at `2026-10-17T06:30:23Z` (authoritative GitHub API HTTP `Date`) |
| **Channel** | the **G-2 task channel** for this workstream; recorded here as such |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream, open, unmerged) |
| **Proposed act rendered (byte-preserved, not modified)** | `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_QUALIFICATION_AUTHORITY_ACT_2026-10-17.md` — commit `21135b1e254a2fda8a5f0ec378d5c13533577a42`, blob `91a952a291afe4a766801247bc2b12f7ed96ccb2`, sha256 `8c12bc00…` |
| **Readiness assessment of record** | commit `b28bdc9f49943433befdc4ffce6a918c0856ba85`, blob `efc2d0d210922cddb11e17b2de6f0570c1772a51`, sha256 `93144553…` |
| **Procedure of record** | `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-PROCEDURE-2026-10-17-01` — commit `34fcafc69765461a1abc140e7ce4c606498e691f`, blob `a263a05ca45e7304f016013ce78a338808ab04c0`, sha256 `13f8d0b3…` |
| **Implementation under qualification** | `refs/heads/gate-b/local-principal-ipc-implementation` @ `cec7080252183a6a5332efe351e61c254d342a2d`, tree `22a7438bc41e5b9853700c5a3737702898da8c53`, parent `2ded0e981407b38c73bdea164153f53856aa7217` |
| **Governing contract** | `L-IPC-1` rev 2, C1–C12 — accepted text blob `cab04b6f94618c9afad1440882ebf63437fdf6f8`; §10 defines Q1–Q11 |
| **Production status** | NON_PRODUCTION — one user, one personal laptop, H-18 scope |

---

## 1. SOURCE, CAPACITY AND RECORDING DISCIPLINE

### 1.1 The decision

The Principal Authority directed, in the G-2 task channel on 2026-10-17, that the recommended
**bounded** Gate C approach be adopted and that the proposed decisions be resolved **in one pass**,
with the specific dispositions recorded in §4–§6 below. Those directions are the operative act.

### 1.2 What this record is, and is not

| This record **is** | This record **is not** |
|---|---|
| A durable record of the Authority's rendered decision | A new decision, or an interpretation of one |
| The authorization instrument for the seven-item subset | An acceptance of any qualification result |
| Additive documentation on the existing PR #8 workstream | A modification of any governance record |

### 1.3 The proposal is preserved, not rewritten

The prepared act (`21135b1`, blob `91a952a2…`) remains **byte-unchanged** as the historical proposal.
Its `STATUS: PROPOSED — NOT APPROVED — NOT AUTHORITY TO EXECUTE` banner is **not** edited: it was true
when written and it remains the correct description **of that artifact**. This document is the
rendered act; the proposal is the record of what was put to the Authority.

---

## 2. VERIFIED STATE AT RENDERING (live remote, read-only)

| # | Check | Verified value |
|---|---|---|
| 1 | Proposed act at the supplied commit | `21135b1e254a2fda8a5f0ec378d5c13533577a42` — **matches** |
| 2 | Proposed act blob / sha256 | `91a952a2…` / `8c12bc00…` — **match the prepared artifact** |
| 3 | Readiness assessment at the supplied commit | `b28bdc9…`, blob `efc2d0d2…`, sha256 `93144553…` — **matches** |
| 4 | Procedure at the supplied commit | `34fcafc…`, blob `a263a05c…`, sha256 `13f8d0b3…` — **matches** |
| 5 | IPD `main` | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` — **unmoved** |
| 6 | `gate-a/local-principal-enablement-2026-10-16` | `2ded0e981407b38c73bdea164153f53856aa7217` — **unmoved** |
| 7 | `gate-b/local-principal-ipc-implementation` | `cec7080252183a6a5332efe351e61c254d342a2d`, tree `22a7438c…` — **unmoved** |
| 8 | Working tree at verification | clean — **0 modifications** |
| 9 | PR #8 | **OPEN, unmerged** |
| 10 | IRR repository | **not accessed** — no cross-repository action of any kind |

---

## 3. RECONCILIATION NOTES (FLAGGED, NOT SILENTLY RESOLVED)

Two **structural** properties of the published §16 were examined against the Authority's directions,
as required. **Neither is a conflict that prevents consistent rendering**, and both are recorded
rather than glossed.

### 3.1 §16 presents `D-GC-E` as one decision; §8 defines `D-GC-E1` and `D-GC-E2`

| Observation | Determination |
|---|---|
| §16 contains a single line: *"**D-GC-E** — adopt procedure `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-PROCEDURE-2026-10-17-01` and the operator-side harness pattern; no repository file added."* §8 of the same act defines **two** decisions: **D-GC-E1** (adopt the procedure) and **D-GC-E2** (approve the harness pattern and constraints). | §16's single line contains **exactly** those two elements, in the same order, with the same content. The Authority's direction names **E1** and **E2** separately. Rendering them as two decisions is a **faithful decomposition** of the §16 line — the union of E1 and E2 equals D-GC-E, with **nothing added, narrowed, or changed**. Recorded as such; **no inconsistency**. |

### 3.2 §16 references `H-1…H-13` without restating them

| Observation | Determination |
|---|---|
| §16 line: *"**D-GC-H** — derived criteria H-1…H-13: — `RATIFY AS WRITTEN` / `REPLACE…` / `REJECT`"* — the criteria themselves are **not** reproduced in §16. Their operative text is **§11.1** of the same proposed act. | §16 **incorporates §11.1 by reference**. "As presented in the proposed act" therefore means **§11.1 of blob `91a952a2…`**, which is reproduced **verbatim** in §6 below. **No H-item wording is altered.** Recorded as such; **no inconsistency**. |

**No other discrepancy was found.** Every disposition the Authority directs is available in the §16
option set for that decision (`ACCEPT`, `Option 1`, `ACCEPT`, `ACCEPT`, `ACCEPT`, `ACCEPT`,
`ACCEPT`, `RATIFY AS WRITTEN`, `ACCEPT`), so **no decision was rendered inconsistently** and no stop
was required under the task's conflict rule.

---

## 4. THE RENDERED DISPOSITIONS

| Decision | Subject | Disposition | Approved scope (summary) |
|---|---|---|---|
| **D-GC-A** | Gate C scope | **`ACCEPT`** | Seven-item read-only subset only; Q5–Q8 excluded and deferred; result to be recorded `PARTIAL — Q5–Q8 DEFERRED` |
| **D-GC-B** | G-1 — V-E reading | **`ACCEPT`** | The waivers govern; no V-1/V-3/V-4 re-run; waivers unamended and not technical proof |
| **D-GC-C** | G-2 — gate order | **`Option 1`** | Bounded subset; §14 gate order preserved; no reordering |
| **D-GC-D** | G-3 — V-6 send half | **`ACCEPT`** | Out of Q1 scope; status remains **NOT TESTED**; not satisfied, not executed |
| **D-GC-E1** | G-4 — procedure | **`ACCEPT`** | Adopt `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-PROCEDURE-2026-10-17-01` |
| **D-GC-E2** | G-5 — harness | **`ACCEPT`** | Operator-side temp-directory pattern only; `package.json`/`tsconfig`/implementation untouched; **no repository runner** |
| **D-GC-F** | G-6 — environment | **`ACCEPT`** | Windows laptop is the qualification host; POSIX evidence non-qualifying |
| **D-GC-G** | G-7 — Q8 meaning | **`ACCEPT`** | Q8 stays deferred and **unresolved**; no restart test authorized |
| **D-GC-H** | G-8 — derived criteria | **`RATIFY AS WRITTEN`** | H-1…H-13 approved as operational criteria, **not** evidence of any pass |
| **D-GC-I** | G-9 — fixtures | **`ACCEPT`** | Disposable isolated copies only; authoritative store never opened, written or used |

**Disposition of the act as a whole: `ACCEPT`** — at the bounded read-only subset, under the
conditions of §5–§8 below, and **with nothing granted beyond them**.

---

## 5. DECISIONS RECORDED INDIVIDUALLY

### 5.1 D-GC-A — Gate C scope — `ACCEPT`

**Rendered scope.** A **bounded, read-only** Gate C qualification of **exactly**:

> **Q1, Q2, Q3, Q4, Q9, Q10, Q11**

**Expressly excluded and deferred:** **Q5, Q6, Q7, Q8** — deferred to a **Gate E-dependent phase**
because each requires the write policy Gate E owns, which is **not granted**. No substitution,
in-process test, or interpretation closes them.

**Recording obligation.** Any Gate C disposition produced under this act must be recorded as
**`PARTIAL — Q5–Q8 DEFERRED`**. It must **never** be described as "Gate C complete", "Gate C closed",
or "Q1–Q11 qualified" while Q5–Q8 remain deferred.

**Conditions.** The subset runs only on the designated Windows host (§5.6), only under the adopted
procedure (§5.5), only with the harness pattern of §5.5, only with fixtures per §5.9, and only
against the published implementation `cec7080…` with the drift manifest of H-12 satisfied.

---

### 5.2 D-GC-B — G-1: applied V-E reading — `ACCEPT`

**Rendered reading.** **The waivers govern at Gate C.** No V-1, V-3 or V-4 measurement is re-run
against the production endpoint under this act. Q1 is discharged by **(i)** the four waivers standing
unamended and **(ii)** a **V-5 endpoint-phase inventory** recorded at qualification time.

**Recorded, as directed:**

- The four existing waivers **remain waivers**. They are **not technical proof**.
- **No waived measurement is to be re-run** under this decision.
- The waived properties — effective ACL/SDDL, cross-account isolation, remote isolation, lifecycle
  fail-closed behaviour — remain **technically unverified**, and must not be recorded as PASS, FAIL,
  or BLOCKED.
- This reading does **not** revoke, amend, narrow or extend any waiver. If the Authority later wishes
  a waived measurement re-run at V-E, that requires **narrower scoping recorded in a separate act**,
  and a procedure revision.

**Documentary basis, as rendered:** the Authority's own acceptance decision §6(4) and the dated note
appended to the proposal §9 at acceptance, both of which provide that *"the waiver governs"* where a
V-E item would repeat a PA-waived measurement.

---

### 5.3 D-GC-C — G-2: gate order — `Option 1`

**Rendered choice.** **Option 1** — a bounded read-only Gate C subset with Q5–Q8 **explicitly
deferred**, preserving the gate order of the contract (S-1 §14: A → B → C → D → E).

**Consequences recorded:**

- The gate order is **unchanged**. No gate is reordered, merged, or skipped.
- Gate C's **scope of closure is narrowed**, and its incompleteness is recorded rather than implied
  away (§5.1's `PARTIAL` obligation).
- **Option 2** — a different gate order requiring Gate E before the write-dependent portion — is
  **not** adopted and would require **separate governance authorization**.

---

### 5.4 D-GC-D — G-3: V-6 send half — `ACCEPT`

**Rendered disposition.** The **V-6 send half is OUT of Q1's scope**.

**Recorded, as directed:**

- V-6's actual status is **`PARTIAL — connect demonstrated; send NOT TESTED`**. It is **not
  satisfied**, and this act must not be read as claiming that it is.
- The send half is **not executed** under this act.
- The **same-account residual remains disclosed and unmitigated**: a process running as the
  operator's own account — including malware — is **outside** the protection boundary (F-3: CREATOR
  OWNER full control). Excluding V-6 from Q1 **does not weaken that disclosure**; it declines to make
  an unmeasured, corroborative item a qualification criterion.
- **Documentary basis, as rendered:** S-6 §9.4 records V-6 as *"corroborative, not a §9 criterion,
  and is not a blocker"*, and Q1's governing text cites *"Gate V (§9)"*, whose measurement set is
  V-1…V-5.

---

### 5.5 D-GC-E1 / D-GC-E2 — G-4 / G-5: procedure and harness — `ACCEPT` / `ACCEPT`

#### D-GC-E1 — procedure adoption

**Adopted:** `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-PROCEDURE-2026-10-17-01`
(`evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_QUALIFICATION_PROCEDURE_2026-10-17.md`,
commit `34fcafc…`, blob `a263a05c…`, sha256 `13f8d0b3…`), **version 2026-10-17-01**, as the Gate C
procedure of record — **as published, without amendment**.

#### D-GC-E2 — operator-side harness pattern

**Approved pattern, exactly as proposed (procedure §4.2):**

| Element | Approved constraint |
|---|---|
| Location | A **temp directory outside the repository** |
| Form | An **ESM `.mjs`** script importing the **built** module by absolute file URL (`dist/src/ipc/entrypoint.js`) |
| Entry point | `startIpcEndpoint({ endpointName })` — the published API |
| Output | Operator-side JSONL: `phases`, `principal`, `schemaVersion`, `layout.modeEnforced`, `stats`, local refusal sink — **never on the wire** |
| Build | The **existing** compiler invocation (`npx tsc`) — **no new script** |
| Repository changes | **NONE** |

**Binding prohibitions, as directed:**

- **`package.json` must not be modified.** Its scripts are inside the D-4 byte-unchanged set.
- **`tsconfig.json` must not be modified.**
- **No repository implementation file may be modified.**
- **No repository runner may be added or implemented.**

---

### 5.6 D-GC-F — G-6: qualification environment — `ACCEPT`

**Rendered designation.** The **Windows laptop** — the deployment host, one ordinary operator account,
**no elevation** — is the **qualification host**.

**Recorded classification, as directed:** **all POSIX evidence is non-qualifying for Windows
qualification**, including:

- the complete Gate B suite (**41/41**) — **implementation/execution evidence, not qualification**;
- the full repository suite (**823/823**);
- every POSIX UNIX-socket result;
- the POSIX socket-permission results (0600 read back inside a 0700 directory), which **do not
  transfer** — on Windows `modeEnforced = false` and the ACL is waived.

**No local Windows testing** is performed by this act, and **no POSIX substitution** may be recorded
as a qualification result.

---

### 5.7 D-GC-G — G-7: Q8 process ambiguity — `ACCEPT`

**Rendered disposition.** **Q8 stays deferred and the ambiguity stays UNRESOLVED.**

**Recorded:**

- The phrase *"stop both processes"* in Q8 has **no definition** in any governing record, in a design
  where **one IPD process owns the store**. This act **does not choose** a meaning.
- **No Q8 restart test is authorized** under any reading.
- Resolving the meaning is an **express precondition of any future Q8 authority**, and must be done
  by the Authority, not inferred at execution time.

---

### 5.8 D-GC-H — G-8: derived criteria — `RATIFY AS WRITTEN`

**Rendered disposition.** **H-1 through H-13 are approved exactly as presented in §11.1 of the
proposed act** (blob `91a952a2…`), **without alteration of wording or scope**. They are reproduced
verbatim in §6 below.

**Recorded status.** These are **approved operational criteria**. They are **not evidence that any
qualification has passed**, and approving them **does not qualify anything**. They become binding on
the execution and on the acceptance review.

---

### 5.9 D-GC-I — G-9: disposable fixtures — `ACCEPT`

**Rendered boundary.** Fixture creation is permitted **only in isolated disposable store copies**,
under the provenance, isolation and evidence constraints of the proposed act §12.1:

| Rule | Rendered constraint |
|---|---|
| Store under test | A **disposable copy**, absolute path **outside the repository**, supplied via `IPD_PORTFOLIO_DB_PATH` |
| **Authoritative store** | **NEVER opened, NEVER written, NEVER used for fixtures** — **permanently prohibited** |
| Provenance | Source path, source sha256, copy sha256 and copy timestamp recorded **before** any write |
| Isolation | **One copy per scenario** (C-A…C-E); no reuse across scenarios; no shared or sync-backed directory |
| Permitted content | Application users, tenant memberships, local principal bindings (create/revoke), portfolios, and the A-2 table removal — **on the copy only** |
| Prohibited content | Any real operator data; any credential; any write that could reach the authoritative store; any modification of the provisioned database file |
| Destruction | Copies retained as evidence until the acceptance act disposes of them; deletion recorded |

**No fixture is created by this act.** Fixture writes occur on **copies of a file**, not through the
endpoint, and exercise no Gate E policy — this is **not** durable-write expansion.

---

## 6. H-1 THROUGH H-13 — RECORDED EXACTLY AS APPROVED

> Transcribed **verbatim** from §11.1 of the proposed act (blob `91a952a291afe4a766801247bc2b12f7ed96ccb2`,
> commit `21135b1…`). **Only the disposition column is added**; the criterion, governing-source and
> interpretation columns are reproduced without alteration.

| # | Criterion as proposed | Governing source (the requirement) | Proposed operational interpretation | Disposition |
|---|---|---|---|---|
| **H-1** | **N ≥ 10 repetitions**, cold and warm | Q9 text contains no repetition count | 10 runs cold + 10 warm, each identical | **`APPROVED AS WRITTEN`** |
| **H-2** | **Idle-timeout observation:** the read-only connection stays open until the 5 s idle timeout, then is closed by the server; closure at the timeout with 0 bytes is acceptable | Q9 requires "no bytes"; the timeout value is `server.ts:71` (implementation), not a contract clause | Accept closure **only** at ≈5 s; earlier closure recorded and investigated | **`APPROVED AS WRITTEN`** |
| **H-3** | **Counter observation:** server `acceptedConnections` +1 and **no refusal** per probe (`server.ts:126`) | None in the contract — counters are an implementation facility | Use counters to prove **admission** (distinguishing zero bytes from an OS-level refusal) | **`APPROVED AS WRITTEN`** |
| **H-4** | **Liveness control** immediately before and after each probe (valid request ⇒ response) | Implied by "not a dead endpoint"; not stated | Control failure ⇒ **INVALID RUN**, not a pass | **`APPROVED AS WRITTEN`** |
| **H-5** | **Direction control:** an `InOut` connection with a valid frame **must** receive a response | Implied by the need to prove the harness can observe bytes | Zero bytes on the control ⇒ **INVALID RUN** | **`APPROVED AS WRITTEN`** |
| **H-6** | **Invalid vs failed run:** invalid = control/drift/host failure (discard and repeat, recording why); failed = a valid run missing a criterion (record FAIL, never re-run silently to a pass) | Not stated in any governing record | As defined in procedure §4.6 | **`APPROVED AS WRITTEN`** |
| **H-7** | **Evidence format:** raw unedited logs + JSONL rows + sha256 of every artifact, harness, and the 15 files; no synthesised rows | S-5 §5 requires publication of real output only ("No projected, illustrative, or synthesised results") | JSONL + manifests + run id `GQ-<yyyymmdd>-<nn>` | **`APPROVED AS WRITTEN`** |
| **H-8** | **Q2 control-first ordering** (S4 before S1–S3) and "no TCP listener" check | Q2 requires "no endpoint, no fallback" | Sequencing + listener check | **`APPROVED AS WRITTEN`** |
| **H-9** | **Q3 cross-class equality:** all seven claim classes must be **byte-identical** in outcome | C6 ("no owner disclosure") | Equality asserted rather than per-class refusal alone | **`APPROVED AS WRITTEN`** |
| **H-10** | **Q4 serial-binding design** (revoke → create, or a second copy) because exactly-one-`ACTIVE` forbids coexistence | Q4's isolation requirement; implementation rule | Fixture copies C-A/C-B/C-C | **`APPROVED AS WRITTEN`** |
| **H-11** | **Q10 runtime inventory** (data-directory scan, single owning process) | C11 | Method chosen without third-party tooling | **`APPROVED AS WRITTEN`** |
| **H-12** | **Q11 digest set:** 15 implementation files + `package.json` + `tsconfig.json`, before **and** after; any drift ⇒ run **invalid** | Q11 requires "digests recorded" | Exact file set and timing | **`APPROVED AS WRITTEN`** |
| **H-13** | **Q1 recording format** for the V-5 inventory and the applied V-E reading | Q1 requires the Gate V result "passed and published" | JSON inventory + the §5.2 reading recorded verbatim | **`APPROVED AS WRITTEN`** |

**Thirteen criteria, thirteen approvals, no replacements, no alterations.**

---

## 7. AUTHORIZED SCOPE, IN FULL

| Item | Requirement (`L-IPC-1` §10) | Status under this act |
|---|---|---|
| **Q1** | Gate V passed and published, on the deployment host | **AUTHORIZED — records only** (V-5 inventory + the D-GC-B reading) |
| **Q2** | Startup fail-closed | **AUTHORIZED** |
| **Q3** | Claim-refusal matrix | **AUTHORIZED** |
| **Q4** | Owner/tenant isolation | **AUTHORIZED** |
| **Q5** | Canonical identity under the write policy | **DEFERRED — blocked on Gate E** |
| **Q6** | DP-2 2F | **DEFERRED — blocked on Gate E** |
| **Q7** | Revision / lifecycle | **DEFERRED — blocked on Gate E** |
| **Q8** | Durability across restart | **DEFERRED — Gate E + unresolved meaning (D-GC-G)** |
| **Q9** | C5.1 zero-bytes — **MANDATORY** | **AUTHORIZED — mandatory; still unexecuted** |
| **Q10** | Exactly one portfolio store | **AUTHORIZED** |
| **Q11** | Drift check | **AUTHORIZED** |

**Authorized: 7. Deferred: 4. Qualified: 0. Accepted: 0.**

---

## 8. PRESERVED BOUNDARIES (BINDING ON EXECUTION AND ACCEPTANCE)

| # | Boundary | State |
|---|---|---|
| 1 | **H-18** — one user, one personal laptop, non-production | **In force** |
| 2 | **DP-2 Option 2F** — unresolved/ambiguous holdings refused before serialization/port/persistence | **In force, un-relaxed** |
| 3 | **`L-IPC-1` C1–C12** as accepted (blob `cab04b6f…`) | **In force, no clause relaxed** |
| 4 | **C11** — the G24 durable store remains the only portfolio store | **In force** |
| 5 | **Gate B implementation boundaries** — fifteen files, byte-unchanged set, tree `22a7438c…`, ref `cec7080…` | **In force; unmoved** |
| 6 | **Four Gate V waivers** — `NOT REQUIRED — PA-WAIVED`, **waivers, not technical proof** | **Unchanged** |
| 7 | **C5.1/Q9 mandatory zero-bytes** | **In force; unexecuted; unauthorized to omit** |
| 8 | **Implementation tests ≠ qualification evidence** (D-4 act §5.4) | **In force** |
| 9 | IRR HTTP `503 owner-context-unavailable` fence | **In force** |
| 10 | PR #8 open and unmerged; no competing PR | **Preserved** |
| 11 | **Authoritative portfolio store** | **Untouched; never to be opened, written, or used for fixtures** |

---

## 9. EXPRESSLY WITHHELD — SILENCE APPROVES NOTHING

Rendering this act — **in any disposition** — does **not** grant, and must not be read as approving:

| Withheld | Note |
|---|---|
| **Acceptance of any qualification result** | Separate act, after evidence review under §6 criteria |
| **Gate C closure or completeness** | Q5–Q8 deferred ⇒ the result is `PARTIAL` |
| **Gate D route admission** | Not granted; the 503 fence stands |
| **Gate E write policy** | Not granted; Q5–Q8 remain blocked |
| **P-6 / P-8** | Not granted |
| **Production eligibility** | Not claimed or granted |
| **Durable-write expansion** | Not granted |
| **G24 promotion, merge, cherry-pick, re-pin** | Not granted for any lineage or derivative ref |
| **Merge of PR #8** | Not granted |
| **Q8 restart testing** | Not granted (D-GC-G) |
| **V-6 send-half execution** | Not granted (D-GC-D) |
| **Any waived measurement** | Not granted (D-GC-B) |
| **Any IRR action** | Out of scope; not accessed |
| **Any matter outside D-GC-A…I** | Not approved by silence |

---

## 10. ATTESTATION — WHAT THIS TASK DID NOT DO

- **No qualification was executed.** No endpoint was started, no named pipe opened, no frame sent, no
  probe run, **C5.1/Q9 was not executed**, and no suite was run for qualification purposes.
- **No fixture was created**; no store copy was made; no store of any kind was opened or written.
- **No implementation, test, configuration, or unrelated file was changed.** This is a **single
  additive documentation artifact**.
- **No ref was moved** other than the ordinary additive advance of the existing evidence branch.
- **No PR was created, and PR #8 was not merged.**
- **No IRR access** occurred.
- **No authority was expanded beyond the Authority's own rendered words**; no decision was rendered
  inconsistently, and both §3 reconciliation notes are recorded rather than silently applied.

---

## 11. NEXT AUTHORIZED ACTION — NOT TAKEN IN THIS TASK

> **The next authorized action is the execution of the bounded read-only Gate C qualification on the
> Windows deployment laptop, under the adopted procedure and the ratified H-1…H-13 criteria.**

Its ordered steps, per procedure §5:

1. **Prerequisites** — clean checkout at `cec7080`, tree `22a7438c…`; build with the existing
   compiler invocation; harness + client + frame generator in a temp directory with recorded sha256;
   disposable copies C-A…C-E created with recorded provenance.
2. **Q11 (before)** — drift manifest over the 15 files + `package.json` + `tsconfig.json`.
3. **Q2** — control S4, then S1 (missing store), S2 (absent binding), S3 (unverified migrations).
4. **Q10** — static + runtime single-store inventory.
5. **Q9** — **mandatory** C5.1 zero-bytes probe, cold and warm, N ≥ 10, with liveness and direction
   controls and the refusal-path probes.
6. **Q3** — seven-class claim matrix plus the nested case, with cross-class byte equality.
7. **Q4** — isolation across the disposable copies.
8. **Q1** — V-5 endpoint-phase inventory + the D-GC-B reading, recorded in the H-13 format.
9. **Q11 (after)** — post-run drift; any drift makes the run **invalid**.
10. **Publication of raw evidence** — unedited logs, JSONL rows, manifests, digests (H-7).

**Then, and only then**, does a **separate acceptance act** (act 3 of the four) become available.
**Nothing in this record authorizes step 1 to be short-circuited, and nothing authorizes Q5–Q8.**

*End of rendered act `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-AUTHORITY-2026-10-17-01`.*
