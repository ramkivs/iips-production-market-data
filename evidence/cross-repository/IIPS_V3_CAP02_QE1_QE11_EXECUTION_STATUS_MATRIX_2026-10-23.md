# CAP-02 — QE-1 … QE-11 execution status matrix (Gate 4 target-host qualification)

> ## STATUS: **NO QE ITEM EXECUTED — ALL ITEMS BLOCKED / NOT RUN — THIS IS NOT A QUALIFICATION RESULT**
>
> Every row below is a **prerequisite assessment**, not an outcome. No criterion is marked `PASS`,
> `FAIL` or `INCONCLUSIVE`; none was executed. The authoritative criteria are Gate E §4 (unchanged at the
> current baseline); this record adds no criterion and removes none. Local fixture tests are listed only
> to state explicitly what they **cannot** substitute for.

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-CAP02-QE-MATRIX-EXECUTION-STATUS-2026-10-23-01` |
| Criteria source | Gate E write policy rev 1 §4 — IPD `evidence/cross-repository/IIPS_V3_G2_GATE_E_PORTFOLIO_WRITE_POLICY_2026-10-18.md`, blob `4a9501bffb49abbbc0ba5b5c4f81d2841812913e`, sha256 `6385345b98fe33dc294212b37592ff455589b7656aa42bf05fdb29e04c57e7cf` (re-verified at `main@2d9130e`) |
| Executing authority | **none effective** — the Gate 4 act is `PROPOSED — NOT EFFECTIVE` (see `IIPS_V3_CAP02_U3_GATE4_ACT_RECONCILIATION_2026-10-23.md`) |
| Intended IPD commit | **not designated.** The proposal pins `1cceacff…` (29 commits stale); the execution commit must be named after the act is effective and Limb A is reconciled |
| Intended host | `desktop-no0nhtp` — **unreachable from this pass** (`ping: Name or service not known`; host platform `linux`, `process.platform = 'linux'`) |
| Authorized store path | **none selected** (rule P-1 has never been exercised; no provisioning executed) |
| Authorized IPC endpoint | **none designated** (`IIPS_G2_IPC_ENDPOINT` / `IIPS_G3_LOCAL_STATE_DIR` unset; no endpoint opened) |
| Start / end timestamps | **n/a** — nothing was started |
| Exit codes | **n/a** — nothing was run |
| Evidence | this assessment only |

---

## 1. Blocking prerequisite classes

Each item is blocked by one or more of these. They are listed so the unblocking owner and sequence are
unambiguous.

| Code | Blocking condition | Owner | Closure evidence |
|---|---|---|---|
| **B1** | No effective Gate 4 execution authority (act §9 determination Q1–Q12 + Act ID) | PA (Ramki) | rendered, published, remotely verified act |
| **B2** | Pinned basis stale by 29 commits; qualified components materially changed; silent re-pin prohibited (act §14.5) | PA | re-pinned exact commit/tree inside the determination |
| **B3** | Gate A′ provisioning not executed; no compatible provisioning path exists on `main` | PA (authority) → operator (execution) | `IIPS_V3_CAP02_SUCCESSOR_GATE_A_PRIME_PROVISIONING_ACT_PROPOSED_2026-10-23.md` + host receipt |
| **B4** | No native Windows host access; runtime floor `Node 22.x >=22.13.0 <23` unverified on that host | operator | host preflight transcript |
| **B5** | Limb A / `scripts/run-tests.mjs` line unreconciled; mandatory parser test absent | PA | reconciled Limb A act + `tests/g4_run_tests_summary_parsing.test.ts` |
| **B6** | H-12 basis not adopted (partial validation only) | PA | full validation + express adoption at the final commit |
| **B7** | QE-11 additionally requires a **separate** Gate C acceptance determination | Gate C acceptance authority | separate accepted result |

Two structural constraints apply to every row and are **not** negotiated by this record:

- **`WRITE_NOT_AUTHORIZED` remains enforced.** `evaluatePortSaveGuard()` returns
  `{authorized:false, reasons:['W-1(3): Gate 4 qualification not accepted','W-1(4): Gate 5 admission not accepted']}`
  and `src/ipc/dispatch.ts` refuses all four write operations before any store mutation. Therefore **no
  admitted endpoint write exists to measure**, and any item requiring a real application write path is a
  *limitation finding* until U6 — not a pass. The three-tier T1/T2/T3 mechanism in the proposal §5.5 is
  **[P] — proposed, not adopted**; until the PA adopts it (Q4), affected items stop rather than proceed
  on a substitute mechanism.
- **Component evidence is never PASS** for a full-path criterion (proposal §14.2 categories 1–4).

## 2. Status matrix

Legend for **Class** (forward-looking only): `1` full-path qualification possible once unblocked ·
`2` component-level only under current safeguards · `3` structurally unreachable under current
safeguards (limitation finding until U6).

| QE | Purpose (verbatim requirement, abridged of the full Gate E text) | Blocks | Class | Status | Deviation / findings | Required corrective action | Owner |
|---|---|---|---|---|---|---|---|
| **QE-1** | Canonical identity: exactly one match persists; zero/conflicting refused **before** serialization/port/store with quarantine evidence; caller identity fields refused | B1 B2 B3 B4 B6 | 1 | **NOT RUN** | The resolver (`src/identity/broker_observation_resolver.ts`), the governed-source validation and the caller-field refusal are implemented and covered by 4 executed local tests — **not** host evidence; no store exists to persist into | execute the scenario set on the host at the designated commit after Gate A′ | PA → operator |
| **QE-2** | DP-2 2F: unresolved/ambiguous **write** refused; **no bypass emitted**; no partial revision | B1 B2 B3 B4 B6 | 2 | **NOT RUN** | Requires a write to reach the store boundary; admission is fenced by W-1, so only the T2 disposable-copy harness (proposed) could measure it. Local evidence shows the refusal path only | PA to adopt the mechanism (Q4); then execute | PA → operator |
| **QE-3** | Revision/lifecycle: stale or missing `expectedRevision` rejected; tombstoned portfolio not disclosed; `reset`/`delete` per W-10 | B1 B2 B3 B4 B6 | 2 | **NOT RUN** | Revision arithmetic and mandatory `expectedRevision` are implemented and locally tested; tombstone disclosure and `reset`/`delete` behaviour were **not** re-verified against the host and are not accepted | re-verify locally at the designated commit, then host-execute | PA → operator |
| **QE-4** | create → durable commit → **stop both processes** → restart both → byte-for-byte identical holdings, contributions, revisions (G2-D3 option (b)) | B1 B2 B3 B4 B6 | 3 | **NOT RUN** | No durable commit can occur while W-1 refuses; a restart read-back of a refused write is meaningless. Local restart tests use disposable in-memory/file fixtures — different evidence class | requires U6-adjacent mechanism or the adopted T2/T3 approach; then host-execute | PA |
| **QE-5** | Idempotent re-import: identical `contentDigest` → `ALREADY_IMPORTED_NO_OP`, no new revision, **before and after restart** | B1 B2 B3 B4 B6 | 2 | **NOT RUN** | Local tests cover the pre-restart and post-reopen no-op; neither is a host restart against the authorized operator store | host-execute after prerequisites | PA → operator |
| **QE-6** | Lineage: contribution SHA-256 lineage and broker attribution identical after restart and after `REPLACE`/`RESET` | B1 B2 B3 B4 B6 | 2 | **NOT RUN** | Six provenance columns exist (migration 004) and are asserted locally on insert and after reopen; `REPLACE`/`RESET` lineage equality was not host-verified | host-execute after prerequisites | PA → operator |
| **QE-7** | Recovery: forced termination during a write leaves the full revision or none; startup refuses on tampered/unverified migrations | B1 B2 B3 B4 B6 | 2 | **NOT RUN** | Fault-injection rollback and migration-checksum refusal are locally tested (six fault points; ledger checksum mismatch throws). No **forced termination** on the host, and no destructive scenario may run against the operator store (D-GC-I extension is [P]) | adopt the destructive-fixture rule; then host-execute on disposable copies | PA → operator |
| **QE-8** | Revocation: after revocation, writes and reads refused including after restart; a revocation racing a write never yields a post-revocation commit | B1 B2 B3 B4 B6 | 3 | **NOT RUN** | Requires a provisioned ACTIVE binding to revoke — **none exists**, and provisioning is not authorized (§ Phase B record). In-transaction revalidation and the four failure shapes are locally tested only | Gate A′ successor act + provisioning receipt first | PA |
| **QE-9** | Refusal matrix: every W-15 condition produces its class and **no store effect** (row counts before = after) | B1 B2 B3 B4 B6 | 2 | **NOT RUN** | `WRITE_NOT_AUTHORIZED` is asserted pre-mutation locally with zero-delta proofs; the remaining W-15 classes were not exercised on the host | host-execute after prerequisites | PA → operator |
| **QE-10** | Outcome-unknown: timeout after send yields **no** IRR auto-retry; reconcile-by-read demonstrated | B1 B2 B3 B4 B6 | 3 | **NOT RUN** | Requires the IRR consumer process and a real IPC round trip; IRR is read-only to this pass and no endpoint exists. The IPD-side `OUTCOME_UNKNOWN` + `reconcileBrokerImportByRead` behaviour is locally tested | requires IRR consumer pin + host endpoint + effective act | PA + IRR capacity |
| **QE-11** | Gate C read-only subset Q1–Q4, Q9–Q11 passed **and accepted**, including C5.1/Q9 zero bytes | B1 B2 B3 B4 B6 **B7** | 1 | **NOT RUN** | Gate C itself is `PARTIAL — Q5–Q8 DEFERRED`; its seven-item subset has never been executed on the host. Even a perfect measurement would not be acceptance | execute the subset under an effective act; then a **separate** Gate C acceptance determination | PA + Gate C acceptance authority |

**Counts: 11 blocked / 11 not run / 0 executed / 0 pass / 0 fail / 0 inconclusive.**

## 3. What this pass *did* execute (implementation evidence — explicitly not QE)

Recorded so the two evidence classes are never confused:

| Suite | Tests | Result | Class |
|---|---|---|---|
| `npm test` (full, `scripts/run-tests.mjs`) | 875 | 874 pass / 0 fail / 1 skipped, exit 0 | implementation |
| `g3_startup_validation` (provisioning unreachable, startup guards) | 20 | 20 pass | implementation |
| `q1_ownership_source_readiness` (Gate A′ unreachable / unforgeable) | 4 | 4 pass | implementation |
| `g3_write_gate` (`WRITE_NOT_AUTHORIZED`, zero delta) | 9 | 9 pass | implementation |
| `g3_durability_vocabulary` (`SESSION_ONLY` / `durable:false`) | 6 | 6 pass | implementation |
| `g3_binding_resolution` (ACTIVE/membership shapes, fail-closed) | 13 | 13 pass | implementation |
| `q1_broker_import_durability` (atomicity, idempotency, unknown outcome, revocation race) | 18 | 18 pass | implementation |
| `g3_caller_authority` (29-key caller-authority refusal matrix) | 103 | 103 pass | implementation |
| `npx tsc --noEmit`, `npm run build` | — | exit 0 / exit 0 | build |

None of these is a QE result: they run on Linux, against disposable fixtures, under the unchanged
fences, without a provisioned binding, without the operator store and without the designated host.

## 4. Prohibited substitutes (restated)

The following were **not** done and must not be done to manufacture a Gate 4 result: a mocked IPC call;
a temporary fixture database presented as the operator store; a source-inspection-only "verification"; a
Linux or hosted-CI run labelled as host evidence; a direct-TAP run promoted to a canonical pass; relabel
of `WRITE_NOT_AUTHORIZED` refusal behaviour as a successful write; any `durable:true` claim without a real
commit and receipt.

*End of `IIPS-V3-CAP02-QE-MATRIX-EXECUTION-STATUS-2026-10-23-01` — 0 of 11 executed.*
