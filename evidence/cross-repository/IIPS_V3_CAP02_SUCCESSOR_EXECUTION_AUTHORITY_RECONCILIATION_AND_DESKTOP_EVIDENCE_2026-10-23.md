# CAP-02 — One-pass successor execution: authority reconciliation, Gate A′ / Gate 4 re-basing, desktop-evidence preparation — 2026-10-23

> ## STATUS: **EXECUTED TO THE VERIFIED AUTHORITY BOUNDARY — NO GATE RENDERED, NOTHING PROVISIONED, NO QE ITEM EXECUTED**
>
> This pass applied the recorded global standing approval first, per explicit PA direction, and
> completed every independently authorized action: baseline re-verification, clause-by-clause
> authority reconciliation, fresh refusal/parser probes, full validation at the current commit,
> a re-pinned decision-ready Gate 4 determination sheet, and an exact desktop-host operator
> runbook. It did **not** implement the provisioning entrypoint, render the successor Gate A′ act
> or the Gate 4 act effective, execute QE-1…QE-11, or change U4/U5/U6 — each for an exact,
> cited, *effective*-record reason (§2), not by routine deference. `WRITE_NOT_AUTHORIZED`,
> `SESSION_ONLY` and `durable:false` remain in force.

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-CAP02-SUCCESSOR-EXECUTION-2026-10-23-01` |
| Predecessor (used, not repeated) | PR #60 one-pass report + PR #61 receipt, merged at IPD `main@bb4101b…`; successor Gate A′ proposal `IIPS-V3-CAP02-SUCCESSOR-GATE-A-PRIME-PROPOSAL-2026-10-23-01`; U3 reconciliation `IIPS-V3-CAP02-U3-GATE4-ACT-RECONCILIATION-2026-10-23-01`; QE matrix (11/11 BLOCKED) |
| IPD baseline (start=end of investigation) | `main@bb4101b5d16546a1327227258a947e9cbe463900`, tree `b02ef11c61bb87e64c3effb5d252566f43ef26c5`, working tree clean; `origin/main` identical (`ls-remote` verified); post-merge CI run `39964704258` **success** |
| IRR baseline (read-only) | `ramkivs/iips-review-recovered main@409604e4dfefbe6aa966113f52af607995b5f297`, tree `297ce6aebd9a4d93b8e3fc572720aa18a8e682ca` — cloned to `/tmp`, inspected only, never pushed |
| Raw evidence | `evidence/cross-repository/cap02_2026-10-23_successor_execution_evidence/` (baseline/host probe, reachability re-run, parser probe, validation summary, with sha256 in §7) |
| Environment | Linux `6.1.158+ x86_64`, Node `v22.22.3`, 2026-10-23T14:03Z. **Not** the designated host (§5) |

---

## 1. Authoritative starting state (verified, not assumed)

| Item | Verified value |
|---|---|
| IPD `main` | `bb4101b…` / tree `b02ef11c…` (= PR #61 merge; contains PR #60 CAP-02 findings) |
| Drift since prior pass (`2d9130e…` → `bb4101b…`) | 13 paths, **documentation/evidence only** — `src/`, `tests/`, `scripts/`, `package.json` diff is **empty**. Prior probes therefore remain valid and were re-run, not re-derived (§3, §7) |
| Gate 4 pinned IPD basis | `1cceacfff40f22dbc9cd64906bf26a5feac1075e`, tree `b2dd2debb295fa28bda7efdd70a66b4cfe9337a9`; GitHub compare `pin...bb4101b`: **ahead_by 33, behind_by 0** (was 29 at the prior pass; +4 documentation merges, no source drift among them) |
| Gate A′ 2026-10-17 basis ref | `refs/heads/gate-a/local-principal-enablement-2026-10-16` = `2ded0e98…` still on remote; still not on `main` |
| Key blobs at `bb4101b…` | `src/persistence/provisioning.ts` `dc844189…` (unchanged); `scripts/run-tests.mjs` `4a90d935…` (pin: `fe1ab1a3…`); Gate E policy `4a9501bf…` |
| IRR records re-read read-only | F-3 standing grant §1.2 (blob `c4c9f7d7…` ✓ byte-identical hash), DEC-06 reconciliation (blob `4be3ea57…` ✓), `G3-AMEND-01` (blob `85ba78e6…` ✓), Gate 4 proposed act rev.4 (blob `c02093e0…` ✓), determination packet D-1…D-12 §6, H-12 candidate + validation, authority-traceability proposal |

## 2. Global standing-approval reconciliation (performed before any PA return)

**The grant (verbatim, F-3 §1.2, blob `c4c9f7d79ef181af96f6c4e5cc108288ef22fd02`).** “The single user
is the Program Authority and has explicitly granted global decision and execution authority for
this project. This standing authorization covers the necessary decisions, governance records,
implementation, testing, corrections, and publication **within the established scope**. Do not
request repeated approval for individual decisions or routine implementation steps. The
authorization does not permit fabricated evidence, weakened safeguards, unrelated scope
expansion, or claims of success without verification.”

**Construction (DEC-06, blob `4be3ea57…`).** R-1: the four limits are the only textual limits;
per-decision re-approval is forbidden. R-2: “established scope is set by PA product decisions
and governing boundaries, not by the agent's convenience.” R-3: authorization ≠ act ≠ proof —
the grant authorizes *making* a bounded act; the act must be its own recorded instrument; proof
is remote state. DEC-06 §3 rule: *later explicit acts are the operative interpretation of an
earlier general grant.*

**Correction to the prior pass, recorded plainly.** The prior pass partly rested its stop on
Gate 4 proposal §14.6 (“no new provisioning.ts entrypoint … authorized here”). That act is
**PROPOSED — NOT EFFECTIVE**; a proposal's non-grant is not a controlling restriction and is
**not** relied on below. The stop stands, but on effective records only.

| # | Proposed action | Standing-grant clause | Effective restriction / reservation | Verdict |
|---|---|---|---|---|
| A1 | Investigation, probes, tests, documentation, publication, remote verification (this record, runbook, tracker) | “decisions, governance records, implementation, testing, corrections, and publication within the established scope”; R-1 | none | **AUTHORIZED — executed this pass** |
| A2 | Render bounded IPD acts where PA has already decided the scope (precedent: Increment A, U2, B1R acts) | R-3 (grant authorizes making the act) | R-2: scope must be PA-decided | **AUTHORIZED in principle** — but see A3/A5: the specific scopes here are not PA-decided |
| A3 | Implement provisioning entrypoint (D-A2-4 option B) + render successor Gate A′ effective | “implementation … within established scope” | (i) No PA decision adopts option B, its file set, or the identity values (`principal_label`, `tenant_id`, `canonical_owner_id` — **[GAP]**, successor proposal D-A2-1/D-A2-2); F-3 record expressly exercises **no value-selection authority** and §5 forbids inferring values from another domain (IRR `owner-7f3a91c2`/`irr-domain-4b82d6e1` may not be silently copied). (ii) Gate 3 lineage manifests are exact; `provisioning.ts` entrypoint is named by no effective act. (iii) Minting the brand in-repo would breach the grant's own “no weakened safeguards” limit (it destroys the structural unreachability proven in §3) | **NOT AUTHORIZED — genuine boundary.** Agent-selected identity values or entrypoint scope would be “unrelated scope expansion” under the grant itself + R-2. Preparatory work (A1) completed instead |
| A4 | Execute Gate A′ provisioning on the host (operational identity write) | — | 2026-10-17 act: one execution on its pinned basis only, no repository change (basis now schema-incompatible, prior-pass probe `02_…`); accepted Gate E rev.1 §5: executing Gate A′ “explicitly not authorized by this policy”; `G3-AMEND-01` non-grants preserved: “no Gate A′ execution”. Standing grant does not supersede these later explicit acts (DEC-06 §3) | **PROHIBITED until successor act effective.** Not attempted; no store, no row |
| A5 | Limb A: repair `scripts/run-tests.mjs` / add `tests/g4_run_tests_summary_parsing.test.ts` | “corrections … within established scope” | **Effective** `G3-AMEND-01` §6.4(1): “Any bounded repair of `scripts/run-tests.mjs`'s Windows summary parsing is **deferred to a separate PA act within Gate 4**. It is not authorized here…”; §1.4/line 62: no authorization to change the runner. The existing `--test-reporter=tap` line is recorded (traceability proposal, consistent with the effective records) as outside located effective authority and is **not ratified** by this pass | **RESERVED to the Gate 4 PA act — not implemented.** Investigation (A1) executed: §4 |
| A6 | Render Gate 4/U3 act effective (adopt act, assign Act ID, resolve Q1–Q12 incl. Q4 D-4 mechanism, re-pin basis) | R-3 act-making | Effective Q1 act + `G3-AMEND-01` §6.4 reserve Gate 4 execution/runner repair to a separate Gate 4 PA act; the proposed act's §9 implements that reservation (express PA determination; standing grant “does not supply this specific Gate 4 execution or runner-modification decision”). Q1–Q12 contain material PA choices (Act ID, D-4 three-tier mechanism, H-12 deferral) that no instruction in this session has made. Re-pinning silently is prohibited (act §14.5; recorded as requirement, not as authority) | **NOT RENDERABLE by the agent.** Decision-ready re-pinned sheet prepared: §4.3 |
| A7 | Execute QE-1…QE-11 | — | Requires A4+A6 effective + designated host (Gate E §4 ordering: on Windows host, *after* Gate A′ provisioning) | **BLOCKED — 0 executed.** Runbook prepared: §5 |
| A8 | U4 acceptance / U5 admission / U6 write authorization | — | Each is a separate downstream act; W-1 four-condition conjunction unmet (W-1(3) Gate 4 acceptance, W-1(4) Gate 5 admission both false — re-verified §6/§7) | **NOT RENDERED / NOT GRANTED / NOT AUTHORIZED** (§6) |

**Conclusion of reconciliation.** Everything the standing approval actually covers was done
without further approval (A1, and A2's preparatory instruments). The remaining items are not
“returned to PA because they involve a gate”: each is stopped by a named effective clause or by
a value/scope choice the grant itself (R-2; F-3 no-value-selection) withholds from the agent.

## 3. Workstream A — Successor Gate A′ (revalidated at `bb4101b…`)

Prior findings stand unchanged because the code is unchanged (§1): 3 of 4 D-A′-1 paths absent on
`main`, migration `003` differs, schemas mutually incompatible (main migrations over a
Gate-A′-basis store fail closed), IDs derived not random, 1 hash-chained audit row not 2 A-3 rows.

**Fresh executable evidence this pass** (`01_gate_a_prime_reachability_rerun_bb4101b.json`,
prior probe source re-run against the `bb4101b…` build): all 4 forgeable authorization shapes
refused with `ProvisioningNotAuthorizedError` before any SQL; bindings `[]→[]`, memberships
`[]→[]`; `audit_events` `0→0`; `in_repo_importers_of_provisioning: []`; pure statement builder
works (text only). Ledger checksums 001–004 as recorded in the artifact. This satisfies the
prompt's negative requirements as far as they are testable today: forged authorization,
wrong/absent principal context and unauthorized membership attempts produce **no binding,
membership or audit mutation**; duplicate/invalid-state provisioning cannot be attempted at all
because no entrypoint exists (the same structural fact).

**Applicable contracts (unchanged, blob `dc844189…`).** One ACTIVE binding (`local_principal_bindings`,
partial unique index) + one ACTIVE membership (`local_principal_memberships`, FK) + exactly one
`audit_events` row `local_principal_binding.provisioned`, all in one transaction; in-transaction
revalidation on every write path; `ACTIVE→REVOKED` one-way.

**Minimum compatible entrypoint (determined, not implemented).** D-A2-4 option B remains the only
coherent option: one additive, act-named entrypoint over `provisionActiveBinding`, unreachable
from `src/ipc/**`/startup, preserving the brand gate for every other caller, act-bound and
single-use, with a read-only validation mode implementing V-A2-1…V-A2-8. Per §2-A3 it requires
the successor act to first name: file set, invocation surface, authorization-value provenance,
and the verbatim `principal_label` / `tenant_id` / `canonical_owner_id`. The decision-ready
successor act (D-A2-1…D-A2-8) is already published; this pass adds the operator procedure (§5.1).
**No production/operational state was provisioned; implementation tests passing would not have
authorized provisioning in any case.**

## 4. Workstream B — Gate 4 / U3 re-basing

### 4.1 Basis and drift (re-measured)
Proposed act blob `c02093e0…` unchanged, still `PROPOSED — NOT EFFECTIVE`, Act ID `PENDING
ASSIGNMENT`. IPD pin `1cceacff…` is now **33 commits** behind `bb4101b…` (API `ahead_by:33`);
the material source drift is exactly the prior-pass table (+2,076/−164 across 24 `src/`+`scripts/`
paths pin→HEAD, incl. `brokerImportPersistence.ts` +356, `portfolio_store.ts` +435/−…,
`binding.ts` rewrite, migration `004` added) — no *new* source drift since the prior pass. Gate E
§4 matrix blob/sha256 unchanged; QE-1…QE-11 criteria therefore unchanged.

### 4.2 `scripts/run-tests.mjs` discrepancy (fresh probe)
`02_run_tests_parser_probe.txt` against the current parser `/^# tests (\d+)$/m`: TAP `# tests 875`
→ 875; TAP+CRLF → 875 (parser is CRLF-safe); spec `ℹ tests 875` (LF or CRLF) → **NULL
(fail-closed)**; `# tests 0` → 0 (then zero-guard fails the run); no summary → NULL. The wrapper
spawns the child with piped stdio and forces `--test-reporter=tap`, under which Node 22 emits
`# tests N` — consistent with this pass's `npm test`: **875 executed / 874 pass / 0 fail / 1
skipped, exit 0**. Narrowed root-cause statement: the recorded native-Windows canonical failure
predates the (unauthorized) `tap` line, when the host child emitted the spec summary; whether
the *current* wrapper passes on `desktop-no0nhtp` under Node `>=22.13.0 <23` is **unproven and
only host-provable** (host Node was historically `v24.14.0`, outside the required major).
`tests/g4_run_tests_summary_parsing.test.ts` is still **absent** (verified; H-12 mandatory path).
Per §2-A5 neither the parser nor the test was touched. Required test content, decision-ready for
Limb A: TAP LF, TAP CRLF, spec `ℹ` LF/CR, zero-count, missing-summary, non-zero runner exit,
stale/missing compiled counterpart — each asserting fail-closed behaviour, none weakening CV-35.

### 4.3 H-12 and re-pinned Q1–Q12 determination sheet (PROPOSED — for PA rendering)
H-12 candidate `G4-H12-MANIFEST-v2-CANDIDATE-2026-10-22.json` remains a candidate; its validation
itself records the missing mandatory test as a BLOCKER, so adoption now would adopt a known
incomplete manifest. Correct order (unchanged): effective Gate 4 act → Limb A implementation →
regenerate/validate H-12 at the final Limb A commit → express PA adoption → host preflight.

Re-pinned determination sheet (determination packet §6, updated only where facts moved; every
row remains **UNRESOLVED — PA to render**):

| Q | Determination required | This pass's re-based proposal |
|---|---|---|
| Q1 | Act ID | Assign `IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-22-01` (census: unused) |
| Q2 | Pins | Replace stale IPD base `1cceacff…` with `bb4101b…`/tree `b02ef11c…` as the reconciliation base; QE execution pin remains the *future* final Limb A merge commit, designated only after it exists. IRR pins (`d355d904…`, `f741298…`) to be re-confirmed at rendering against IRR `409604e4…` |
| Q3 | Limb A boundary | Confirm three-path boundary (§4.2 of act) **as re-scoped**: ratify-or-replace the already-merged `--test-reporter=tap` line expressly (it cannot be “implemented” retroactively), add the §4.2 test file, no runner redesign |
| Q4 | D-4 mechanism | Adopt/reject the three-tier fence-preserving mechanism — material PA choice; if declined, QE-2…QE-9 stop |
| Q5 | Sequence S0–S6+S2a | Confirm, incl. Gate A′ successor **before** QE, Node `>=22.13.0 <23` |
| Q6 | QE-11 execution grant | Re-issue on current commits; acceptance stays separate; G-12 reading to choose |
| Q7 | H-12 | **Defer adoption** until post-Limb-A regeneration + full validation (see above) |
| Q8–Q10 | Evidence layout; failure-status/D-GC-I; claim split | Adopt as proposed (packet §6 defaults) |
| Q11 | Executor | Operator on `desktop-no0nhtp`; Arena preparation/verification only |
| Q12 | Registration | §16.81+ at determination; event-driven transitions only |

Repository-level validation (done, §7) is expressly **not** desktop-host qualification.

## 5. Workstream C — Desktop host `desktop-no0nhtp`: availability and operator runbook

**Availability this pass: UNREACHABLE** — `ping: desktop-no0nhtp: Name or service not known`;
no DNS resolution; this environment is Linux (not `win32`); no operator store path, no
`IIPS_G2_IPC_ENDPOINT`/`IIPS_G3_LOCAL_STATE_DIR` designation, no remote-execution channel or
recorded access authorization. No native execution was simulated and nothing is marked passed.
No alternative host is substituted (Gate E §4/Gate 3 §8 designate this host class conjunctively).

### 5.1 Operator runbook (execute only when §2-A3/A4/A6 are effective; stop on any mismatch)
0. **Preflight capture** (raw stdout+stderr, exit codes, UTC start/end per command): `hostname`
   (= `desktop-no0nhtp`), Windows edition, non-elevated account proof, `node -v` (must be
   `>=22.13.0 <23`; `v24.x` = STOP), `git rev-parse HEAD HEAD^{tree}` (= act-designated pin),
   `git status --porcelain` (empty), sha256 of `scripts/run-tests.mjs`, `src/persistence/provisioning.ts`.
1. **P-1 store path**: absolute, outside every Git tree, local fixed NTFS, non-synchronized,
   operator-writable unelevated, **file must not pre-exist** (`Test-Path` = False, recorded).
2. **Gate A′ provisioning** (only under the effective successor act + its entrypoint): single
   invocation with act-named values; capture verbatim stdout/exit; then validation mode
   V-A2-1…V-A2-8 (ledger 001–004 checksums; exactly 1 ACTIVE binding + 1 ACTIVE membership;
   portfolio tables 0; exactly 1 audit row + `verifyAuditChain()=true`; resolver returns the
   provisioned context; IPC still `WRITE_NOT_AUTHORIZED`; second invocation refused, no change).
   Record store sha256+size. Any failure = act consumed, `FAILED/NOT EXECUTED`, no repair/re-run.
3. **Canonical suite**: `npm ci; npm run build; npm test` — raw logs preserved including
   summary bytes (settles §4.2 on-host). A parser failure is recorded FAILED, never relabelled.
4. **QE-1…QE-11** in act order at recorded digests (H-12 as adopted): per item capture command,
   host, versions, before/after row counts, IPC round-trip transcripts, restart read-backs
   (QE-4: stop **both** IRR+IPD processes per G2-D3(b), byte-for-byte compare), refusal matrix
   (QE-9), forced-termination (QE-7) only under the adopted destructive-fixture rule,
   revocation (QE-8) against the provisioned binding. Failures/refusals preserved verbatim.
5. **Publication**: deposit raw evidence under the act's layout (Q8), hash every artifact
   (sha256), publish via PR to the act-designated repo/ref, verify remote blobs byte-identically.
QE status after this pass remains: **0 executed · 0 pass · 0 fail · 11 BLOCKED** (matrix record unchanged).

## 6. Workstream D — U4 / U5 / U6 determinations

| Item | Determination | Exact missing criteria / evidence |
|---|---|---|
| **U4** Gate 4 result acceptance | **NOT RENDERED** | Executed QE-1…QE-11 host evidence at a fixed commit (none exists); then a separate acceptance act. Local 875-test pass is implementation evidence only |
| **U5** Runtime (Gate 5) admission | **NOT GRANTED** | Effective U4 + its own admission act. Preparation/validation done to the boundary (§7); admission not inferable from U2, packaging, CI or a future provisioned binding |
| **U6** Operational-write authorization | **NOT AUTHORIZED** | W-1 conjunction: (3) Gate 4 qualification accepted — false; (4) Gate 5 admission — false. `evaluatePortSaveGuard()` hard-false; dispatch refuses pre-mutation; no env flag enables writes. Controls re-validated §7. No write enabled, none implied |

## 7. Validation executed (this environment; repository-level only)

| Command | Exit | Result |
|---|---|---|
| `npm ci` · `npx tsc --noEmit` · `npm run build` | 0 · 0 · 0 | clean (pre-existing chunk advisory only) |
| `npm test` | 0 | **875 executed / 874 passed / 0 failed / 1 skipped** (66 suite files) |
| Focused: `g3_write_gate` 9, `g3_caller_authority` 103, `g3_binding_resolution` 13, `g3_durability_vocabulary` 6, `g3_startup_validation` 20, `q1_broker_import_durability` 18 | 0 | all pass — `WRITE_NOT_AUTHORIZED` pre-transaction, forged principals refused, `durable:true` unreachable, no retry after `OUTCOME_UNKNOWN` |
| Gate A′ reachability probe (re-run) | 0 | 4/4 refused; 0 binding/membership/audit mutations; 0 importers |
| Parser probe | — | TAP/TAP-CRLF parsed; spec/zero/missing fail closed (§4.2) |
| Blocked / N-A here | — | All QE items, provisioning, restart durability vs an operator store: require `win32` host + effective acts |

Artifact sha256: `00_baseline_and_host_probe.txt` `6ec3fa7f…`, `01_…rerun_bb4101b.json`
`c58d3f9d…`, `02_run_tests_parser_probe.txt` `292ee39d…`, `03_validation_summary.txt` `a9041e15…`.

Safeguards preserved: fail-closed authorization/binding checks; no forged-principal/owner
acceptance; no durable writes; no fabricated provenance/evidence; no route-fence weakening; IRR
untouched. **No `src/`, `tests/`, `scripts/`, CI or manifest change was made this pass.**

## 8. Publication

This record + tracker addendum + evidence directory are published from
`arena/f9358f79-iips-production-market-data` via PR with CI; the verified merge receipt is
appended to the tracker after remote read-back (same pattern as PR #60/#61). Nothing in this
record claims publication before that verification.

## 9. Remaining blockers

| # | Blocker | Owner | Closure evidence |
|---|---|---|---|
| 1 | Successor Gate A′: adopt act at named commit + name `principal_label`/`tenant_id`/`canonical_owner_id` verbatim + grant D-A2-4(B) entrypoint authority | **PA (Ramki)** | Rendered act published + remotely verified |
| 2 | Entrypoint implementation + tests (follows #1 automatically under standing grant) | Arena/operator | Merged PR + refusal/no-mutation tests + V-A2-1…8 host receipt |
| 3 | Gate 4 act: PA determination Q1–Q12 + Act ID (§4.3 sheet), incl. express disposition of the merged `tap` line | **PA (Ramki)** | Effective act at the PA-named locus (IRR or directed) |
| 4 | Limb A execution + H-12 regeneration/adoption (follows #3) | Arena → PA adoption | Final-commit manifest fully validated + adoption record |
| 5 | Host access: `desktop-no0nhtp` reachable, Node 22.x, P-1 store path, IPC endpoint | Operator | §5.1 preflight + raw QE transcripts published |
| 6 | U4 → U5 → U6 (sequential, separate acts) | PA | Acceptance, admission, write-authorization acts each referencing the executed evidence |

*End of `IIPS-V3-CAP02-SUCCESSOR-EXECUTION-2026-10-23-01`. Completed-and-authorized work is
distinguished above from authorized-but-unexecuted preparation (§5.1 runbook) and genuinely
blocked work (§9). No qualification, acceptance, admission or operational-write authorization
is claimed.*
