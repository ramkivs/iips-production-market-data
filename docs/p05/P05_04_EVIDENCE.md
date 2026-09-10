# P05-04 — EVIDENCE RECORD (ingestion orchestration)

> **Authority: D10-1** — `docs/p00/P00_DECISION_LOG.md` §8.1, commit
> `b41240c406914f34f06c2f7bc3986bdeb436018d`: *"P05-04 — ingestion orchestration — is
> AUTHORIZED … Scheduling · retry execution · idempotent checkpointing · the tracker
> `Work Tracker`!P05-04 exit criterion 'Replay does not duplicate data' with failure/replay tests
> and run logs."*
>
> D10-1 is the *"further explicit act"* that D9 §3.1 **N-3** required
> (`docs/d9/D9_P05_ENTRY_AUTHORIZATION.md`:89 — *"Not included in the approved scope … requires a
> further explicit act"*).
>
> ⚠ **This record is ADDITIVE.** It edits no historical authority record. In particular it does
> **not** rewrite `P05_GATE_ACCEPTANCE.md` (R-13/R-14) or `P05_ACCEPTANCE_CRITERIA.md` (C-4), which
> remain **historically true and unedited**; they are superseded as to current state **by citation,
> never by edit** — the same discipline D10-5 applied to ADR-01 §I.

---

## 1. The authoritative scope — taken from the repository, not invented

`Work Tracker`!P05-04 (TRACKER, unmodified) is the sole definition of this work item. Recorded
verbatim:

| Field | Value |
|---|---|
| Work Item | **Ingestion orchestration** |
| Requirement | **Scheduling, retries, idempotency and checkpointing.** |
| Deliverable | **Ingestion orchestrator** |
| Dependencies | `P05-01,P05-02` (Hard) |
| Entry Criteria | **Adapters conform** |
| Exit Criteria | **Replay does not duplicate data** |
| Test / Validation | **Failure/replay tests** |
| Evidence | **Run logs** |
| Critical Path | YES |

The identical exit criterion / validation / evidence triple is recorded at
`docs/p05/P05_ACCEPTANCE_CRITERIA.md`:63 as criteria **C-4**, which at the moment of P05 acceptance
read **`NO EVIDENCE EXISTS`** — correctly, because no evidence existed. **Evidence now exists and is
recorded below.** C-4's historical text is not edited.

**Scope discipline.** Nothing outside these four requirement elements was built. No requirement was
substituted, widened or reinterpreted.

---

## 2. Implementation

| Component | File | What it provides |
|---|---|---|
| Scheduling | `p05/src/ingestionOrchestrator.js` · `buildRunPlan` | a fully materialized, ordered tick table over a **virtual** timeline; `planId` is a pure function of its inputs |
| Retry execution | same · `executeTick`, `isRetryableCode`, `backoffForAttempt` | a **bounded** deterministic retry loop with capped exponential backoff in **virtual** milliseconds |
| Idempotency | **reuses** `CanonicalRecordStore` (`p05/src/replay.js`) | `INSERTED` / `IDEMPOTENT_NOOP` / `CONFLICT_REJECTED` — the P05-01 governed record identity, not a second one |
| Checkpointing | same · `CheckpointLedger` | idempotent, immutable checkpoints keyed by `(runId, tickIndex, taskRef)`; **checkpoint-first** execution |
| Orchestration | same · `IngestionOrchestrator` | drives the plan; refuses a live-connectivity adapter outright |
| Failure injection | same · `withDeterministicFaults`, `RunAbortedError` | an **explicit table** of faults and interruptions — no randomness |

### 2.1 Reuse, not duplication

Per the instruction not to duplicate authority, namespace, collision or fail-closed logic:

- **Retryability is NOT re-decided.** The orchestrator *imports* `RETRY_PROHIBITED` and reads
  `DISPOSITION[code].retryable` from `p05/src/errors.js` — the accepted P02 taxonomy. It declares no
  retryability table of its own (asserted: no literal `retryable: true|false` exists in the module).
  Retryable set = **`E4`, `E7`** only. ES-4 (never retry a deterministic failure) holds.
- **Canonical-record idempotency is NOT re-implemented.** The P05-01 `CanonicalRecordStore` is
  injected and remains the sole authority on record identity and INV-2 immutability.
- **Namespace / C1–C6 is untouched.** No namespace, collision or fail-closed logic was added. The
  guard is reached only through the feed's existing validation. `MD:` remains the exact token.
  **No methodology variation** (D8:35 *"no variation authorized"*).
- **No new dependency.** `package.json` still declares **zero** runtime and dev dependencies; no
  lockfile, no `node_modules`.

### 2.2 Determinism

Fully **synchronous**. No wall clock, no randomness, no ambient input (D-3). Time is a virtual clock
advanced by declared increments; **backoff is computed and recorded, never slept**. Verified: no
`Date.now()`, `new Date()`, `Math.random()`, `crypto.randomUUID()` or ambient-environment lookup
appears in the module, and no scheduler or async orchestration appears anywhere in `p05/src/`.

---

## 3. Exit-criteria results — exact

The tracker's exit criterion is **"Replay does not duplicate data"**. Six independent proofs, each
asserted in `p05/tests/orchestration.test.js` and recorded in
`p05/evidence-p05-04/04-exit-criterion-replay-no-duplication.json`:

| # | Proof | Measured | Result |
|---|---|---|---|
| **X-1** | re-acquiring the same task within one run does not duplicate data | 12 ticks → **4** canonical records; `recordsInserted` **4**, `recordsIdempotentNoop` **8** | ✅ **TRUE** |
| **X-2** | a full replay of the plan creates zero new records and zero new checkpoints | `skippedCheckpointed` **8/8**, `recordsInserted` **0**, record count and checkpoint count unchanged | ✅ **TRUE** |
| **X-3** | the checkpoint history is unchanged by a replay | ledger digest identical before and after | ✅ **TRUE** |
| **X-4** | the replayed canonical corpus is **byte-identical** to the original | identical `effectiveReplayIdentity` and `canonicalSerialization` | ✅ **TRUE** |
| **X-5** | a replay never produces a conflicting vintage (INV-2) | `CONFLICT_REJECTED` events = **0** | ✅ **TRUE** |
| **X-6** | a checkpointed tick performs **no adapter work** on replay | adapter invocations on replay = **0** (counted by a spy adapter, test C/3) | ✅ **TRUE** |

**Plus the checkpointing case the exit criterion most needs** — an interrupted run:

| Step | Measured |
|---|---|
| run interrupted at tick 2 (`RunAbortedError`, thrown **before** the tick executes and **before** its checkpoint is written) | 2 canonical records, 2 checkpoints |
| resume on the **same** ledger and store | `skippedCheckpointed` **2**, `acquired` **2**, `recordsInserted` **2**, `recordsIdempotentNoop` **0** → total **4** records |
| a further full replay | `recordsInserted` **0**, record count still **4** |

**Verdict: the exit criterion "Replay does not duplicate data" is MET within the D10-1 boundary.**

---

## 4. Test result — 263 / 263 PASS

```
cd p05 && node --test "tests/**/*.test.js"
# tests 263
# pass  263
# fail  0
```

| File | Tests |
|---|---|
| `tests/adapter-contract.test.js` | 82 |
| `tests/orchestration.test.js` **(NEW — P05-04 failure/replay tests)** | **34** |
| `tests/historical-adapter-contract.test.js` | 28 |
| `tests/identity-collision.test.js` | 24 |
| `tests/negative.test.js` | 21 |
| `tests/namespace.test.js` | 15 |
| `tests/no-provider-dependency.test.js` | 15 |
| `tests/provenance.test.js` | 13 |
| `tests/determinism.test.js` | 12 |
| `tests/existing-iips-boundary.test.js` | 11 |
| `tests/replay-idempotency.test.js` | 8 |
| **TOTAL** | **263** |

Baseline at D10 was **229**. **+34 new tests; 0 pre-existing tests removed; 0 assertions deleted.**
The 229 pre-existing tests all still pass.

`tests/orchestration.test.js` groups: **S** scheduling (3) · **R** retries (5) · **C** checkpointing
(3) · **I** the exit criterion (5) · **F** failure handling (3) · **L** run logs (3) · **B**
boundary (7) · **E** evidence integrity (5).

---

## 5. ⚠ Evidence classification — the four kinds, kept strictly apart

| Kind | Produced here? | Where |
|---|---|---|
| **Implementation evidence** | ✅ **YES** | `p05/src/ingestionOrchestrator.js`; 263 passing tests; `p05/evidence-p05-04/` |
| **Synthetic / local test evidence** | ✅ **YES** — and this is exactly what the run logs are | `p05/evidence-p05-04/02`, `03` — local fixture feed, explicit fault table, virtual clock |
| **Contract / lifecycle evidence** | ⚠ **NO — unchanged** | P05-02 / P05-03 remain specification and adapter-contract work only. **This act adds nothing to them** |
| **Provider execution evidence** | ❌ **ABSENT — AND MUST REMAIN ABSENT** | No provider was selected, named, contacted or bound. No credential or entitlement was provisioned. No network call was made. P05-02 live provider execution remains **`NOT_AUTHORIZED`** (D9 **N-1**, D10 §8.2) |

⚠ **The run logs in this package are LOCAL SYNTHETIC run logs.** They satisfy the tracker's
*Evidence* column in form, and they genuinely demonstrate the exit criterion — but they are **not**
provider run logs and must never be cited as such. Every file in `p05/evidence-p05-04/` carries
`classification.isProviderEvidence: false` and `classification.phaseScope: "P05-04"`, and that
classification is **asserted by test** (E/4), not merely stated.

### 5.1 The boundary is enforced in code, not in prose

`assertOrchestrationPermitted` **fails closed** and refuses:

| Refused case | Reason |
|---|---|
| a `LIVE` `providerKind` adapter | live provider execution is `NOT_AUTHORIZED` (D9 N-1, D10 §8.2) |
| a `LOCAL_FIXTURE` adapter that **declares live connectivity** | same — refusal is not bypassable by relabelling the kind |
| an adapter requiring **credentials** | no credential handling is authorized in P05-04 |
| an adapter requiring **entitlement** | no entitlement handling is authorized in P05-04 |
| an adapter declaring **no capability** | an undeclared surface is refused, not assumed safe |
| an adapter with **no `snapshot()` ingress** | structural |

All six refusals are recorded as measured results in
`p05/evidence-p05-04/07-boundary-attestations.json` and asserted by tests B/1–B/3. The orchestrator
**cannot even be constructed** around a live adapter.

---

## 6. ⚠ Recorded limitations — first-class content, not omissions

| # | Limitation | Cause |
|---|---|---|
| **L-1** | **The orchestration path has NOT been exercised against a live P05-02 adapter.** It is exercised against the **P05-01 local deterministic feed** with an explicitly tabled fault plan. | A **standing non-authorization** (D9 N-1, D10 §8.2) — no live adapter exists and live provider execution is not authorized. **Not a defect in P05-04.** Discharged only by a future explicit provider-execution authorization, which does not exist |
| **L-2** | Scheduling is a deterministic **virtual** timeline. No wall-clock scheduler, cron entry or timer is installed. | Determinism requirement **D-3** — a wall-clock read would break byte-reproducibility |
| **L-3** | The checkpoint ledger is **in-process**. No durable checkpoint store is written. | No storage-technology decision is authorized in this scope |
| **L-4** | This act does **not** retroactively create P05-04 completion evidence inside the P05 gate acceptance record. `P05_GATE_ACCEPTANCE.md` **R-13/R-14** (*"NO COMPLETION EVIDENCE"*) and `P05_ACCEPTANCE_CRITERIA.md` **C-4** (*"NO EVIDENCE EXISTS"*) remain **historically true and unedited**. | Append-only governance rule (`P00_DECISION_LOG.md` §5 rule 1). Supersession is by citation, never by edit |

⚠ **No limitation was resolved by reclassification, and no synthetic evidence is presented as
provider evidence.** Where a requirement could not be evidenced without provider access, that is
stated above rather than papered over.

---

## 7. ⚠ Disclosure — one existing governance guard was superseded, not weakened

`p05/tests/no-provider-dependency.test.js` contained the test
**`'P05-04 — no orchestration (scheduling, retries, checkpointing) is implemented'`**. It asserted,
**by absence**, that no module under `p05/src/` contained a scheduler, async orchestration or
checkpointing. That was **correct and load-bearing** while P05-04 was `NOT_AUTHORIZED` (D9 **N-3**):
it made an unauthorized P05-04 build-out impossible to commit silently.

**D10-1 is precisely the explicit act that guard was waiting for**, so it is replaced — on the terms
the P05 acceptance record itself set at `docs/p05/P05_GATE_ACCEPTANCE.md` §9 for the analogous
`NOT_ACCEPTED` tripwire: ***the protective surface is enlarged, not reduced.***

| Condition the old guard protected | Status now |
|---|---|
| **No scheduler anywhere in `src/`** | ✅ **STILL UNIVERSAL** — now covers the orchestrator too, and the orchestrator satisfies it (synchronous, virtual clock). **Nothing was carved out** |
| **No async orchestration anywhere in `src/`** | ✅ **STILL UNIVERSAL** — same |
| **No wait primitive** | ✅ **STILL UNIVERSAL, and NEW** — extended from the contract files to every module |
| **No module implements checkpointing** | ⚠ **RESCOPED**, because D10-1 authorizes exactly that in exactly one module. Replaced by: no module **other than** the enumerated D10-authorized orchestrator implements checkpointing, **plus** the behavioural idempotency proofs (C/1–C/3, I/1–I/5) that an absence-based rule could never make |
| **P05-01 modules never even name retry** | ✅ **UNCHANGED** — applied to byte-for-byte the same eight modules (asserted: `P05_01_SOURCE_FILES.length === 8`) |
| **A contract may classify retryability but implement no policy** | ✅ **UNCHANGED** — all four rules still applied to both contract modules |

**New assertions added** (surface enlarged): retryability must be *imported* from the accepted
taxonomy and not re-declared · no wait primitive in any module · the provider-execution guard must
exist and must refuse live connectivity · the orchestrator must introduce **no** P06 normalization
vocabulary and must declare `phaseScope: 'P05-04'` / `p06Implemented: false` **in code** · the
orchestrator module must actually implement checkpointing, idempotent no-op, conflict rejection and
cite INV-2 (so the guard cannot be satisfied by deleting the feature).

The scope correction is documented in the test file itself as **P05-04-A**, of exactly the same kind
as the pre-existing **P05-03-A** correction. **No assertion was deleted and no other test file's
assertions were altered.**

---

## 8. Guard teeth — negative-tested

Each guard was verified to fail when the property it protects is broken (throwaway `/tmp` copies,
discarded):

| Mutation injected | Tests failing (measured) |
|---|---|
| disable store deduplication (`existing` forced `undefined`, so every ingest is `INSERTED`) | **4** — **I/1, I/2, L/2, B/4** |
| tamper an evidence file after generation | **1** — **E/1** (the index digest no longer matches the committed bytes) |
| neuter `assertOrchestrationPermitted` entirely | **3** — **B/1, B/2, B/3** |
| relabel synthetic evidence as `isProviderEvidence: true` | **2** — **E/4, E/5** |
| control, restored | **34 / 34 pass** |

⚠ **Recorded finding, not an omission.** Disabling store-level deduplication does **not** fail I/3
(interrupted-run resume) or I/4 (byte-identical replayed corpus). That is not a guard gap — it is
**defence in depth**: the **checkpoint-first** rule stops an already-completed tick from reaching the
store at all, so with deduplication removed the resume and full-replay paths still ingest each record
exactly once. Non-duplication is therefore enforced at **two independent layers**, and I/1, I/2, L/2
and B/4 are the tests that isolate the store layer. Each layer is covered.

---

## 9. Evidence package — `p05/evidence-p05-04/` (9 files)

| File | Content |
|---|---|
| `00-INDEX.json` | index, authority, tracker row, exit-criteria assessment, gate status |
| `01-run-plan.json` | the scheduling artifact: `planId`, tick table, refusal cases |
| `02-run-log-baseline.json` | **RUN LOG** — clean baseline, 12 ticks / 4 records |
| `03-run-log-with-failures.json` | **RUN LOG** — failure/replay exercise (E4 retried, E7 retried, E5 rejected at once) |
| `04-exit-criterion-replay-no-duplication.json` | **X-1…X-6**, each with measured values and a boolean result |
| `05-checkpoint-resume-after-interruption.json` | the interrupted-run / resume proof |
| `06-retry-classification.json` | all eight classes, taxonomy retryability vs. P05-04 behaviour, backoff table |
| `07-boundary-attestations.json` | the six measured refusals; standing non-authorizations; `MD:` and C1–C6 status |
| `08-limitations-and-open-items.json` | L-1…L-4, unchanged open items, explicit list of what this act did **not** do |

**Determinism:** regenerating produces **byte-identical** output — verified
(`diff -r -q` on a full regeneration: identical). `00-INDEX.json` records a `sha256` per file, and
test **E/1** recomputes each digest from the committed bytes, so hand-editing an evidence file after
generation is a test failure.

Reproduce: `cd p05 && npm run evidence:p05-04`.

---

## 10. Gate position — UNCHANGED

| Field | Status |
|---|---|
| `formal_gate_status` | **6 of 18 accepted — P00, P01, P02, P03, P04, P05** *(unchanged — this act accepts no gate)* |
| `p05_acceptance_status` | **`ACCEPTED`** *(unchanged; recorded by `docs/p05/P05_GATE_ACCEPTANCE.md`)* |
| **`p05_04_status`** | **`IMPLEMENTED + EVIDENCED` within the D10-1 boundary** *(was `AUTHORIZED`, D10-1; before that `NOT_AUTHORIZED`, D9 N-3)* — **limitation L-1 recorded** |
| `p06_entry_authorization_status` | **`AUTHORIZED`** for **P06-01 / P06-02 / P06-03 ONLY** *(D10-2, unchanged)* |
| `p06_acceptance_status` | **`NOT_ACCEPTED`** — **no `P06_GATE_ACCEPTANCE.md` exists**, and none is created *(D10-6)* |
| `p05_02_live_provider_execution` | **`NOT_AUTHORIZED`** (D9 N-1) |
| `licensed_historical_acquisition` | **`NOT_AUTHORIZED`** (D9 N-2) |
| `production_activation_status` | **`NOT_AUTHORIZED`** (A4 at P16 only) |
| `certification_status` | **`NONE_GRANTED`** — authority authorization is never certification |
| `track_b_to_main_merge` | **`NOT AUTHORIZED`** |

### 10.1 What this act did NOT do

No P06-01 / P06-02 / P06-03 implementation · no P06 acceptance artifact · no certification · no
production activation · no provider selection, entitlement, credential or provider configuration · no
licensed historical acquisition · no Track B → `origin/main` merge · no edit to any historical
P00–P05 authority record · no variation of ADR-01 C1–C6 · no change to the `MD:` namespace token ·
no modification of existing-IIPS (`ReplayService`, `DataBoundExecutor`, `LiveDataRuntime.ts`,
methodology, scoring, calibration, taxonomy, `NormalizedHolding` / `companyId`, CSIP).

### 10.2 Open items — unchanged

`OI-P04-03` · `OI-P04-04` · `DEP-P01-04` · `OI-D9-01` · `M-1 / AD-4` · `M-5` (blocks C12
certification) · `M-6` · `AD-17 / M-2` · **PIT-1…PIT-7 MISSING / NOT DEMONSTRATED** (travels to P08
undischarged) · `DO-P04-1…5` / `DO-1…DO-5`.

⚠ **No concessions register exists and none was created.** No concession mechanism was invoked.

---

## 11. P05-04 completion — precise meaning

**P05-04 is COMPLETE within the boundary D10-1 authorized**: its authoritative exit criterion
(*"Replay does not duplicate data"*) is demonstrated by six independent proofs, its
*Test / Validation* artifact exists (*failure/replay tests*, 34 tests), and its *Evidence* artifact
exists (*run logs*, 9 files).

⚠ **That statement is bounded and must be read with limitation L-1.** It means the orchestrator is
built and proven non-duplicating over the governed local surface. It does **not** mean the
orchestration path has been exercised against a provider, and it does **not** create provider
execution evidence.

⚠ **P05-04 completion does not re-open or alter the P05 gate acceptance.** P05 was accepted with
P05-04 inside the gate and `NOT_AUTHORIZED`; that record stands as written (L-4).

⚠ **P05-04 completion is not P06 authorization and not P06 acceptance.** D10-2 already authorized
P06 entry independently; D10-6 states that P06 authorization is not P06 acceptance.

### 11.1 Consequence for P06-02

`Work Tracker`!P06-02 carries `P05-04` as a **Hard** dependency (`Dependency Matrix`
Critical = **YES**, *"no dependency bypass"*). D10 discharged that dependency **at the authorization
level only**. **This act discharges it at the implementation level**: P05-04 is now built, tested and
evidenced, so the P06-02 blocker is satisfied in substance and not merely in authority.

⚠ Authorization was never completion, and completion is now separately evidenced — the two are
recorded distinctly and neither is inferred from the other.
