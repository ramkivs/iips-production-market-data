# CAP-02 — U3 / Gate 4 qualification act: authority and drift reconciliation

> ## STATUS: **RECONCILIATION ONLY — RENDERS NO ACT — GATE 4 REMAINS `NOT AUTHORIZED / NOT STARTED`**
>
> This record establishes, from executed verification, whether the narrow U3 / Gate 4 qualification act
> can be rendered under existing authority, and what exactly is missing. **It is not the act.** It
> renders no decision, authorizes no execution, qualifies nothing, and accepts nothing.
>
> **Result: the act already exists as `PROPOSED — NOT EFFECTIVE` and cannot be rendered by this pass.**
> Its own §9 requires an express Program Authority determination (Q1–Q12 plus an Act ID); publication
> and merge confer no effectiveness; and its publication locus is IRR, which this pass is prohibited
> from modifying. Independently, its pinned IPD basis is **29 commits stale**, and the components the
> qualification matrix measures were materially rewritten after that pin.

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-CAP02-U3-GATE4-ACT-RECONCILIATION-2026-10-23-01` |
| Record type | Investigation / reconciliation / decision-preparation. Renders no authority. |
| Prepared | `2026-10-23` (UTC), Arena Agent Mode, under the standing preparation/publication authorization (F-3 §1.2, IRR blob `c4c9f7d7…`) as construed by `DEC-06` R-1/R-2/R-3 |
| Verified IPD baseline | `main@2d9130e76bb0dc89daeefabaf297e27bdaa84250`, tree `4658699180ef161aae3c1b33d3946e918d6fb9b2` |
| Read-only IRR baseline | `main@409604e4dfefbe6aa966113f52af607995b5f297`, tree `297ce6aebd9a4d93b8e3fc572720aa18a8e682ca` |
| Raw evidence | `evidence/cross-repository/cap02_2026-10-23_authority_and_gate_evidence/` |

---

## 1. What the effective records actually say about U3 / Gate 4

| Record | Coordinates | Established status |
|---|---|---|
| Gate E write policy rev 1 (PA-accepted, G2-D2) | IPD `evidence/cross-repository/IIPS_V3_G2_GATE_E_PORTFOLIO_WRITE_POLICY_2026-10-18.md`, blob `4a9501bffb49abbbc0ba5b5c4f81d2841812913e`, sha256 `6385345b…` — **re-verified unchanged at `main@2d9130e`** | §4 "Evidence required for later qualification (Gate 4; **not authorized here**)" defines QE-1…QE-11. §5 explicitly does **not** authorize executing Gate C/Q5–Q8, durable writes, result acceptance |
| Gate 3 implementation act (`…-2026-10-19-02`) | IRR blob `4744e6f44e0caea55e980756aeef90a5046ec87e` (read-only) | Exact file/test manifests; runner and script changes excluded; Gate 4 excluded |
| `G3-AMEND-01` | IRR blob `85ba78e6cbfe20ed146a53abbfa23a3350140fcf` (read-only) | §1.4 preserves the runner exclusion; §6.4(1) defers the Windows parser repair to **a separate PA act within Gate 4** |
| Gate 3 acceptance record | IRR blob `f3a6c9a3d15985a78a0945ecfc96019b3a5c425a` (read-only) | **`ACCEPTED — BOUNDED GATE 3 IMPLEMENTATION SCOPE ONLY`**; Gate 4 qualification + runner repair `NOT EXECUTED / NOT STARTED`; requires their own Gate 4 authority/execution sequence |
| Gate 4 qualification act | IRR `docs/integration/IIPS_v3.0_G4_TARGET_HOST_QUALIFICATION_AUTHORITY_ACT_PROPOSED_2026-10-22.md`, blob `c02093e051155ac54adc56985bcef0d819b06fa5`, sha256 `cb91e7a1…`, 75,351 B | **`PROPOSED — NOT EFFECTIVE — GRANTS NO AUTHORITY`**; Act ID `PENDING ASSIGNMENT` |
| Gate 4 QE matrix | IRR `…G4_QE_1_TO_QE_11_QUALIFICATION_MATRIX_2026-10-22.md`, blob `b18a48a2…` | Prepared reference — **not authority, not a result**; reproduces the Gate E §4 criteria verbatim |
| Gate 4 evidence packet | IRR `…G4_TARGET_HOST_QUALIFICATION_EVIDENCE_PACKET_2026-10-22.md`, blob `dc945165…` | Prepared evidence packet — not authority |
| Gate 4 determination packet D1–D12 | IRR `…G4_DETERMINATION_RESOLUTION_PACKET_D1_TO_D12_2026-10-22.md`, blob `7d3b143e…` | Recommended resolutions + the PA decision sheet Q1–Q12; asserts no PA decision |
| U4 result acceptance | — | **none exists** in either repository |
| U5 Gate 5 admission | — | **none exists** |
| U6 / W-1 operational write act | — | **none exists**; `evaluatePortSaveGuard()` still returns `authorized:false` |

## 2. Why this pass cannot render the U3 act

The act's own effectiveness rule (§9) is exhaustive and self-binding:

1. It becomes effective **only** on an express PA determination that (a) adopts it in whole or with
   recorded changes, (b) **assigns its Act ID**, (c) confirms or revises the pinned baselines and commit
   rule, and (d) resolves **Q1–Q12**, including the material D-4 fence-preserving write mechanism at Q4.
2. "**Publication or merge of this proposal confers no effectiveness.** … No tracker row, CI run,
   commit, or PR may be cited as making it effective."
3. "Q1 (portfolio decision) and the standing preparation/publication grant do **not** supply this
   specific Gate 4 execution or runner-modification decision."

`DEC-06` R-2 states the same boundary in general form: established scope is set by PA product decisions
and **governing boundaries**, not by agent convenience — and this boundary is named explicitly, in the
governing record, as one the standing grant does not supply. Rendering it anyway would be exactly the
"unrelated scope expansion" F-3 §1.2 forbids, and would fabricate a PA determination.

Two further, independent obstacles:

- **Publication locus.** The proposal and all its companions live in IRR `docs/integration/`. This pass
  may inspect IRR read-only and must not modify IRR files, branches, PRs or tracker. Rendering an
  effective act at that locus is therefore unavailable to this pass even if the determination existed.
  A competing instrument published in IPD would create two loci for one act — a governance defect, not
  a solution.
- **Baseline drift** (§3) makes the pinned act unrunnable as written even if adopted verbatim.

## 3. Drift: the pinned basis is 29 commits stale and the qualified components changed materially

The act pins IPD `main@1cceacfff40f22dbc9cd64906bf26a5feac1075e` (tree `b2dd2deb…`). Current `main` is
`2d9130e7…`: **29 commits ahead, 0 behind, 54 files changed** (`compare` API, executed this pass).

Changes on paths the qualification matrix directly measures:

| Path | Change since the pin | Why it matters |
|---|---|---|
| `src/identity/broker_observation_resolver.ts` | **added** (+82) | the canonical-identity resolution QE-1 measures did not exist in this form at the pin |
| `src/persistence/brokerImportPersistence.ts` | **added** (+356) | QE-1/2/3/5/9 measure this boundary; absent at the pin |
| `src/persistence/portfolio_store.ts` | **+372 / −63** | QE-3/4/5/7/9 semantics (transaction, revision, idempotency) rewritten |
| `src/persistence/binding.ts` | **+45 / −37** | QE-8 revocation/binding revalidation rewritten; new in-transaction resolver |
| `src/persistence/durablePortfolioStorePort.ts` | +10 | write-guard adapter |
| `src/persistence/migrations/004_portfolio_contribution_provenance.ts` | **added** (+15) | QE-6 lineage/provenance columns did not exist at the pin |
| `src/ipc/dispatch.ts` / `src/ipc/entrypoint.ts` | +9/−3, +2 | refusal ordering and migration registration |
| `scripts/run-tests.mjs` | **+1 / −1** (`--test-reporter=tap`) | Limb A target; see §5 |
| `tests/q1_broker_import_durability.test.ts` (+601), `tests/q1_ownership_source_readiness.test.ts` (+185), `tests/q1_cap02_u7_provider_outcomes.test.ts` (+474), `tests/q1_ipc_read_contract_conformance.test.ts` (+259), `tests/cap02_pit_d114_package.test.ts` (+383), `tests/portfolio_ui_package.test.ts` (+563) | added | the executed local matrices that exist today did not exist at the pin |

Consequence, stated plainly: qualifying at the pinned commit would qualify code that is **not** the
code on `main` — and every QE criterion touching identity resolution, atomicity, binding revalidation,
provenance or idempotency would be measuring superseded behaviour. Qualifying at current `main` requires
the act to be re-pinned, which the act's own §14.5 stop rule forbids doing silently ("any
non-documentation drift from the accepted implementation baseline … is a stop and requires explicit
reconciliation, never a silent re-pin").

## 4. The authoritative qualification matrix (unchanged, re-verified)

The matrix is Gate E §4, re-read at the current baseline. Its blob and sha256 are **identical** to the
values the Gate 4 proposal pins, so no criterion has drifted:

```text
Gate E §4 (blob 4a9501bf…, sha256 6385345b98fe33dc294212b37592ff455589b7656aa42bf05fdb29e04c57e7cf)

QE-1  canonical identity: one match persists; zero/conflicting refused before serialization/port/store
      with quarantine evidence; caller identity fields refused
QE-2  DP-2 2F: unresolved or ambiguous write refused; no bypass emitted; no partial revision
QE-3  revision and lifecycle: stale or missing expectedRevision rejected; tombstoned portfolio not
      disclosed; reset/delete semantics as W-10
QE-4  create → durable commit → process stop → restart → read-back, byte-for-byte equal holdings,
      contributions and revisions
QE-5  idempotent re-import: identical contentDigest → ALREADY_IMPORTED_NO_OP, no new revision, before
      and after restart
QE-6  lineage: contribution SHA-256 lineage and broker attribution identical after restart and after
      REPLACE/RESET
QE-7  recovery: forced termination during a write leaves either the full revision or none; startup
      refuses on tampered/unverified migrations
QE-8  revocation: after binding revocation, writes and reads refused, including after restart;
      revocation racing a write never yields a post-revocation commit
QE-9  refusal matrix: every W-15 condition produces its class and no store effect (row counts
      before = after)
QE-10 outcome-unknown: timeout after send yields no IRR auto-retry; reconcile-by-read procedure
      demonstrated
QE-11 Q1–Q4 and Q9–Q11 (read-only Gate C subset) passed and accepted, including C5.1/Q9 zero bytes
```

Two framing constraints attach to the whole matrix and are preserved: the run happens **on the Windows
deployment host, after Gate A′ provisioning, at recorded digests, with raw output published** (Gate E §4
preamble); and the QE-4 "stop both processes" meaning is **G2-D3 option (b)** — stop and restart both
the IRR and IPD processes; no OS reboot.

Per-item execution status in this pass is recorded separately in
`IIPS_V3_CAP02_QE1_QE11_EXECUTION_STATUS_MATRIX_2026-10-23.md`: every item is **BLOCKED / NOT RUN**, for
reasons that are prerequisites rather than results.

## 5. Limb A — the Windows canonical test wrapper: measured facts and an unresolved authorization

Limb A of the proposal is the bounded repair of `scripts/run-tests.mjs` summary parsing. This pass
established the following by execution, without changing the file:

| # | Fact | Evidence |
|---|---|---|
| 1 | The only difference between the **Gate 3-accepted** wrapper (`fe1ab1a3…`, at the pinned basis) and the wrapper on current `main` (`4a90d935…`) is the insertion of `'--test-reporter=tap'` into the runner arguments | `diff` in `00_command_transcript.txt`; accepted-baseline snapshot preserved as `03_run-tests_fe1ab1a3_…txt` |
| 2 | That change arrived in commit `196a0e8804446efe32a21000bbf9f0a1e44954af` (2026-10-22T16:55:38Z, PR #45 head) — i.e. **after** the Gate 3 accepted baseline | `commits?path=scripts/run-tests.mjs` (API, executed) |
| 3 | The parser is **CRLF-safe**: `'# tests 875\r\n'` matches `/^# tests (\d+)$/m` | regex probe in transcript (`crlf.t = "875"`) |
| 4 | The parser **fails against the spec reporter's marker**: `'ℹ tests 875'` matches neither expression | same probe (`info_marker.t = null`) |
| 5 | On this host (Node `v22.22.3`) the child reporter emits `# tests N` when stdout is a pipe (default reporter **and** tap) and `ℹ tests N` (with CR) when stdout is a TTY | PTY probe in transcript |
| 6 | `npm test` on current `main` executes **875 tests, 874 pass, 0 fail, 1 skipped**, exit 0 | transcript |

**What cannot be established here:** why the operator's native-Windows canonical run failed. The
wrapper captures the child through a pipe, so the TTY-only spec-reporter path should not apply — yet the
recorded failure was "no `# tests <n>` line found". On the host the child's reporter selection, its Node
major (the historical Gate A′ value `v24.14.0` is outside the required `>=22.13.0 <23`), and the
observed summary bytes were never captured verbatim. **Only that host can settle it.**

**Authorization status — unresolved, and material.** No effective IPD act naming `scripts/run-tests.mjs`
was located in this pass. The governing records point the other way: the Gate 3 act excludes runner and
script changes, `G3-AMEND-01` §1.4 preserves that exclusion, and §6.4(1) defers the repair to a separate
PA act within Gate 4 — which is not effective. IRR's own authority-traceability proposal (`PROPOSED`,
blob per its §3 table) records exactly this path transition (`fe1ab1a3… → 4a90d935…`) as
**"UNAUTHORIZED under located effective authority"** and rejects the unlocated "directive" claim. This
pass neither adopts nor disputes that characterisation; it records that the characterisation exists, that
it is consistent with the governing records it cites, and that **no later IPD act amends either**.

Two consequences, both for the PA:

1. **Limb A must be re-scoped before the Gate 4 act can be effective.** A repair act cannot "implement"
   a change that is already on `main`; it must either (a) ratify/replace the present line with an
   explicit determination, or (b) supersede it with a properly authorized, tested implementation (the
   mandatory `tests/g4_run_tests_summary_parsing.test.ts` is still absent — an unresolved required
   absence, per the H-12 validation report).
2. **The runner line is not settled evidence.** The 875/874 counts recorded from `main` were produced by
   a wrapper whose own provenance is unreconciled. They remain valid *implementation* evidence for this
   repository's suite (the same suite passes under `node --test` directly), but they must not be
   presented as Gate 4 qualification evidence.

## 6. H-12 basis

`G4-H12-MANIFEST-v2-CANDIDATE-2026-10-22.json` is a candidate only. Its exact-byte checks pass for the
entries present, but the mandatory qualified-tree path `tests/g4_run_tests_summary_parsing.test.ts` does
not exist — and it also does not exist at the current baseline, verified by inspection of `tests/` and
by the test count (875). It therefore cannot be adopted now, and a manifest regenerated at the current
commit would still lack that path. Adoption is a separate PA step that must follow, not precede, an
effective Limb A act.

## 7. Exactly what is required to render the U3 act (for the tracker and the PA)

```text
MISSING (all of the following, in this order):
  1. A PA determination expressly adopting the Gate 4 act, assigning its Act ID, and resolving
     Q1–Q12 (incl. Q4 D-4 mechanism adoption), per act §9.1.
  2. A re-pinned IPD basis at an exact commit/tree — the current pin (1cceacff) is 29 commits
     stale and the qualified components changed materially (§3). Silent re-pinning is prohibited
     by act §14.5; the re-pin must be part of the determination.
  3. Reconciliation of the Limb A / scripts/run-tests.mjs line (§5), including the mandatory
     parser test, before any wrapper repair can be claimed.
  4. Full H-12 validation + express PA adoption at the finally designated commit (§6).
  5. The Gate A′ predecessor (see IIPS_V3_CAP02_SUCCESSOR_GATE_A_PRIME_PROVISIONING_ACT_PROPOSED_
     2026-10-23.md) — Gate E §4 orders the run after provisioning, and no compatible provisioning
     path exists today.
  6. The designated native-Windows host with Node 22.x >=22.13.0 <23 — not reachable from this pass.
OWNER: Ramki — Program Authority (1–5); operator of desktop-no0nhtp (6 execution).
RENDERING LOCUS: IRR docs/integration/ (read-only to this pass) or an explicit PA direction
  naming a different locus.
```

## 8. Attestation

| Claim | Value |
|---|---|
| U3 / Gate 4 act rendered | **NO** |
| QE item executed | **NO** |
| Gate 4 status changed | **NO** — `NOT AUTHORIZED / NOT STARTED` |
| `scripts/run-tests.mjs` modified | **NO** |
| Any IPD source/test/CI change | **NO** |
| IRR modified | **NO** |
| Qualification inferred from CI or local fixtures | **NO** |
| PA determination asserted | **NO** |

*End of `IIPS-V3-CAP02-U3-GATE4-ACT-RECONCILIATION-2026-10-23-01`.*
