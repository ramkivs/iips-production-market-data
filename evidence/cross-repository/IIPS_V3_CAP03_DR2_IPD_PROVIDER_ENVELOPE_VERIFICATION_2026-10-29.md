# CAP-03 — DR-2 / DQ-1 IPD provider envelope: independent closure verification and correction of the IRR readiness blocker attribution (2026-10-29)

**Record ID:** `IIPS-V3-CAP03-DR2-IPD-PROVIDER-ENVELOPE-VERIFICATION-2026-10-29-01`
**Repository:** `ramkivs/iips-production-market-data` (IPD). **IRR was read-only in this pass and was not written.**
**IPD basis:** `refs/heads/main` @ **`c3cfb7e690aefd2ceb0a8323052c9a6f38f4a032`**, tree
`e77aa335bbee9c60d3e3330a028fc985ccff83b4` (live remote read; `0` open IPD PRs)
**IRR basis (read-only):** `refs/heads/main` @ **`8634643144799d231d54ab53751f6313d495c82b`**, tree
`3f2d0490bf071f0318e3e18538e29671c4e5138c`
**Scope:** verification, contract comparison and documentation. **No IPD source or test file changed.
No gate, fence, pin, write authorization or durability value moved.**

---

## 1. Why this record exists

The IRR readiness evidence published 2026-10-29
(`evidence/integration/irr-nonprod-parallel-readiness-2026-10-29/01-readiness-verification-record.txt`,
IRR blob `0505b7ee125d96ca627328854a2b0b2fe8a8ea67`) lists, under *"GENUINE REMAINING BLOCKERS for the
read path (exact owners)"*:

> **(1) IPD-provider half of the envelope closure (IPD locus; then the recorded refusal paths in the new
> test flip only by a future authorized act)**

**That attribution is stale.** The IPD-provider half of the DR-2 / DQ-1 Option A envelope was implemented,
tested, merged and remote-verified by **IPD PR #89 on `2026-10-25`** — four days *before* the IRR record
was written. This pass re-verified that from live state rather than from the tracker's own claim.

Recording the correction here prevents duplicate IPD work against an already-closed gap. **No IRR file was
edited**; the IRR-side correction is described at §6 as a separate IRR-owned item.

## 2. Authoritative evidence that the IPD provider half is complete

| Fact | Verified value | Method |
|---|---|---|
| Implementing PR | **#89** — *"CAP-03: implement DR-2 Option A IPD provider read envelope (7 values + isSaved lifecycle, fail-closed)"* | `gh api …/pulls/89` |
| Merge commit | `79d06e3c5da60da2a234b7ac18c35df848bf9d11`, merged `2026-10-25T13:03:28Z` | `gh api …/pulls/89` |
| On `main`? | **YES** — `compare 79d06e3c…c3cfb7e6` → `status=ahead`, main **42 ahead**, **behind 0** | `gh api …/compare` |
| Conformance suite | `tests/q1_ipc_read_contract_conformance.test.ts`, blob `eddedd56449d6d0ac27dd394bd2a7262d0cb0c24`, **1,402 lines**, tracked at `main` | `git ls-files`, `git rev-parse` |
| Tracker statement | §"CAP-03 DR-2 — IPD provider half" = **`IMPLEMENTED / TESTED / PUBLISHED / REMOTE-VERIFIED`** (L1410) | tracker read |

## 3. Gap matrix — every element of the frozen `V1_TO_G2_ENVELOPE_GAP`, verified at `c3cfb7e6`

The authoritative gap definition is IRR's `V1_TO_G2_ENVELOPE_GAP`
(`frontend/server/user-portfolio/ipcPortAdapter.ts`, IRR blob `1e20e98023f20f80ed61d8d32d070fdde677d3c7`):
**7 missing fields + 3 renames**. Each element was traced to the IPD provider source and to an executed
assertion.

| Shape | Element | Required of provider | IPD provider behaviour | Evidence | Disposition |
|---|---|---|---|---|---|
| `portfolioSummary` | `weightSumPercentage` | finite number | Emitted from `r.weight_sum_percentage` of the **current** revision row | `portfolio_store.ts` L141, `list()` SQL + `projectCurrentRevision`; test L618 | **CLOSED** |
| `portfolioSummary` | `provenanceDigest` | string (empty is a stored fact) | Emitted from `r.provenance_digest`; empty string passed through, never defaulted | `portfolio_store.ts` L143; test L619, L676–685 | **CLOSED** |
| `portfolioSummary` | `isSaved` | boolean, DQ-1 materialized state | `isSavedForCurrentOperation()` — `true` for MERGE/REPLACE, `false` for INITIAL/RESET | `portfolio_store.ts` L145, L280; test L620, L738–768 | **CLOSED** |
| `portfolioSummary` | rename `holdingsCount`→`totalHoldingsCount` | **provider keeps `holdingsCount`** | v1 name preserved; rename happens only at the IRR adapter | `portfolio_store.ts` L125–131 comment; test L690–702 | **CLOSED** (correctly *not* renamed here) |
| `portfolioView` | `isSaved` | boolean | `PortfolioDetail extends PortfolioSummary` inherits it | `portfolio_store.ts` L177; test L642 | **CLOSED** |
| `portfolioView` | rename `holdingsCount`→`totalHoldingsCount` | provider keeps v1 name | as above | test L702, L911 | **CLOSED** |
| `revisionEntry` | `totalMarketValue` | number, from **that** row | `r.total_market_value` of the historical row; never borrowed from current | `portfolio_store.ts` L196–200; test L660, L864 | **CLOSED** |
| `revisionEntry` | `provenanceDigest` | string, from that row | `r.provenance_digest` of the historical row | `portfolio_store.ts` L203; test L661, L865 | **CLOSED** |
| `revisionEntry` | `holdingsCount` | non-negative int, from that row | `r.holdings_count`; explicitly **not** the G2 summary rename | `portfolio_store.ts` L204–205; test L662, L866 | **CLOSED** |
| `revisionEntry` | rename `committedAt`→`createdAt` | provider keeps `committedAt` | v1 name preserved from `portfolio_revisions.created_at` | `portfolio_store.ts` L192–199; test L706, L924 | **CLOSED** |

**Completeness assertion (executed):** *"the seven additions are exactly seven — no extra field was
admitted"* — summary additions `['isSaved','provenanceDigest','weightSumPercentage']`, view additions the
same, revision additions `['holdingsCount','provenanceDigest','totalMarketValue']` (test L710–732).

## 4. Envelope and boundary behaviours pinned by the IRR integration test — provider side verified

IRR's `frontend/server/user-portfolio/ipcPortAdapterIntegration.test.ts` (blob
`a688b6011be66c48918f7992ea197ff8308ba328`) drives the real `IpcUserPortfolioPort` over a unix socket
against a contract-v1 peer. The provider-side obligations it implies were each checked in IPD:

| Pinned behaviour | IPD provider | Evidence | Disposition |
|---|---|---|---|
| Request envelope keys are **exactly** `v`/`op`/`payload` (minimality) | Parser accepts `v`/`op`/`payload`/`requestId`; `requestId` **optional** — validated only when present. IRR's minimal envelope is accepted unchanged | `protocol.ts` L196, L214 (blob `f4dc72b1…`) | **COMPATIBLE** |
| Success frame `{v, ok:true, op, result}` | `successFrame` emits exactly that, plus `requestId` only if the request carried one | `protocol.ts` L158–166 | **COMPATIBLE** |
| Class A frame `{v, ok:false, op, outcome, detail?}` | `classAFrame` emits exactly that | `protocol.ts` L147–156 | **COMPATIBLE** |
| `WRITE_NOT_AUTHORIZED` on every write op | `dispatch.ts` refuses all `IPC_WRITE_OPERATIONS` **before any mutation**, via the hard-false `evaluatePortSaveGuard()` | `dispatch.ts` L228–233 (blob `27becc76…`); `portfolio_store.ts` L213–217 | **UNCHANGED — fail-closed** |
| Class P is a **zero-byte** close | `refuseClassP` calls `socket.destroy()` writing nothing, cancelling any queued write | `dispatch.ts` L49–55 | **COMPATIBLE** |
| Closed operation set | `default:` → `UNKNOWN_OPERATION`, fail-closed | `dispatch.ts` L255–258 | **COMPATIBLE** |
| Malformed stored row must not fabricate | Provider refuses → Class A `UNAVAILABLE`, no result | conformance suite `q1 / DR-2 provider refusal…`; test L1364 | **VERIFIED** |
| Missing / foreign / tombstoned portfolio | One byte-stable `RESOURCE_UNAVAILABLE`; no field emitted, including no `isSaved` | test L778–801, L1345 | **VERIFIED** |

**Consumer-side-only obligations** (no IPD action, correctly out of IPD scope): fail-closed before any
socket when the IRR-local binding precondition is unestablished; tenant-hint non-transmission; timeout
treated as outcome-unknown and never retried; least-disclosing mapping of `WRITE_NOT_AUTHORIZED` to
`UPSTREAM_UNAVAILABLE`.

## 5. Independent cross-check performed this pass (not previously covered)

IPD's conformance suite carries a **replica** of the IRR mapping rules (`irrMapSummary`, `irrMapView`,
`irrMapRevisionEntry`, test L315–395). A replica can silently drift from the real consumer. This pass
compared the replica against IRR's **actual** adapter source at `86346431` rather than assuming agreement:

| Shape | IRR actual requirement (`ipcPortAdapter.ts`) | IPD replica | Match |
|---|---|---|---|
| summary | `requireNumbers(['weightSumPercentage'])` L414; `requireStrings(['provenanceDigest'])` L415; `requireBoolean('isSaved')`; base `revision`/`holdingsCount`/`totalMarketValue` L529–531; emits `totalHoldingsCount: record.holdingsCount` | test L323–335 | **EXACT** |
| view | `requireNumbers(['weightSumPercentage'])` L463; `requireStrings(['provenanceDigest'])` L464; `requireBoolean('isSaved')` | test L343–364 | **EXACT** |
| revisionEntry | `requireNonNegativeInteger('revision')` L433; `requireStrings(['operation','committedAt'])` L434; `requireNonNegativeInteger('holdingsCount')` L438; `requireNumbers(['totalMarketValue'])` L439; `requireStrings(['provenanceDigest'])` L440; `contentDigest` optional L444; emits `createdAt: record.committedAt` | test L374–389 | **EXACT** |

**No drift.** The replica is a faithful mirror of the live consumer, so the conformance suite's conclusions
transfer to the real IRR adapter.

## 6. What actually remains — none of it IPD provider-side

The IPD tracker already separates these (L1410–1411): provider half **complete**; **cross-repository
closure `OPEN`**. Its remaining dependencies, re-verified 2026-10-29:

| Remaining dependency | Owner | Current verified state |
|---|---|---|
| IRR merge effectiveness of the read path | **IRR** | Advanced since the tracker line was written: IRR `main` `86346431` now carries `ipcPortAdapterIntegration.test.ts` and the readiness evidence. `frontend/server/user-portfolio-transport.ts` remains blob `51704c12a467cd2f718a030b5036bc55c9afa73f` — still importing only `respondOwnerContextUnavailable` (L10), called unconditionally (L68). **Route wiring is correctly held for Gate 5** |
| Gate 5 admission act (`CV-52`) | **PA** | `NOT INITIATED / NOT ADMITTED`; `CV-52` `BLOCKED – ACTIVE` |
| DR-4r / DQ-3 populated contribution view | **PA** | **Refused by decision** — not a defect |
| DQ-4 freeze | **PA** | No freeze exists |
| Gate A′ / P-1 provisioning | **PA** → operator | `NOT EXECUTED / UNSPENT / NOT AUTHORIZED` |

**IRR-owned correction, described and NOT performed here:** the readiness record's blocker list item (1)
should read *"cross-repository closure of DR-2 — Gate 5 admission, DR-4r/DQ-3 and the DQ-4 freeze
(governance/PA)"*, because the **IPD-provider half is already closed by IPD PR #89 (`79d06e3c`)**. Owner:
**IRR**. IRR was read-only in this pass.

## 7. Validation executed this pass (exact)

Environment: Linux sandbox, Node `v22.22.3`, `NODE_EXTRA_CA_CERTS` set for the sandbox CA.

| Command | Result |
|---|---|
| `npm ci --no-audit --no-fund` | exit **0** |
| `npx tsc` | exit **0** |
| `npm test` (`node scripts/run-tests.mjs`, the repository's own runner) | **932 tests / 124 suites / 931 pass / 0 fail / 1 skipped**; `[test-guard] OK — 932 test(s) executed, 931 passed, exit 0` |
| `node --test dist/tests/q1_ipc_read_contract_conformance.test.js` (conformance suite isolated) | **30 tests / 2 suites / 30 pass / 0 fail** — suites `q1 / IPC read path conforms to CAP-03 DR-2 Option A` and `q1 / DR-2 provider refusal: no fabricated zeros, strings or lifecycles` |
| `npm run test:package-consumer` | **PASS** — see §7.1 |

The single skip is the Windows-only named-pipe test (`tests/g3_no_network_listener.test.ts:141`) — skipped
by construction on Linux, not a failure.

**Two invocation failures recorded honestly, both mine, neither a product defect:**
`node --test --import tsx <file>` and `node --test --experimental-strip-types <file>` both fail with
`ERR_MODULE_NOT_FOUND: src/persistence/connection.js`. The repository's TS sources import compiled `.js`
specifiers, so a source-level single-file run cannot resolve them. The repository's own runner executes the
**compiled** tests from `dist/tests`, which is why `npm test` and the isolated `dist/tests/...` run both
succeed. No test, source file or assertion was changed to make anything pass.

### 7.1 Package consumer

| Field | Value |
|---|---|
| Result | `PASS` |
| Browser pack | `1,729,910` B, `forbiddenHits: []` |
| Strict typecheck (`strict: true`, `skipLibCheck: false`) | `PASS` |
| `routeIntegrationTests` | `TYPECHECK_ONLY_NOT_IRR_E2E` |

## 8. Safety and governance — nothing advanced

- `evaluatePortSaveGuard()` **unchanged and still hard-false** at `c3cfb7e6`: returns `authorized: false`
  with `W-1(3): Gate 4 qualification not accepted`, `W-1(4): Gate 5 admission not accepted`. Its comment —
  *"No environment flag, test result or operator assertion changes this"* — is unmodified.
- No durable write path created, widened or exercised. Every write operation still refuses with
  `WRITE_NOT_AUTHORIZED` before any mutation.
- No owner-context authorization change; no tenant hint or identity shortcut introduced.
- No Gate 4, QE, Gate 5, P-1, DQ-4 or production-eligibility movement. No host provisioning or host mutation.
- No PA decision made or inferred. No designated blob, pin, `BASIS_COMMIT` or `BASIS_TREE` change.
- No IRR file, branch, PR or tracker touched.
- **Zero IPD source or test files changed in this pass.** `src/` tree at `main` is
  `5e910c8f86df4dbec16427b8a7bfd3846214563d`, unchanged from before this pass.

**P-1-C NOT ESTABLISHED. P-1-D DESIGNATED, NOT VERIFIED FOR THE ATTEMPT. P-1 NOT EXECUTED / UNSPENT /
NOT AUTHORIZED.**

## 9. Verification register

| ID | Check | Evidence | Result |
|---|---|---|---|
| `V-DR2-01` | Live remote baselines read before any action; IPD `main` `c3cfb7e6` / tree `e77aa335…`; IRR `main` `86346431` / tree `3f2d0490…`; `0` open PRs both repos | `gh api …/branches/main`, `…/pulls` | **PASS** |
| `V-DR2-02` | PR #89 identity, merge commit and ancestry: `79d06e3c…`, merged `2026-10-25T13:03:28Z`, `status=ahead` main 42 / behind 0 | `gh api …/pulls/89`, `…/compare` | **PASS** |
| `V-DR2-03` | All 7 gap fields present, populated from the correct stored row, and asserted by an executed test | `portfolio_store.ts` L133–205; conformance test L607–662, L710–732 | **PASS** |
| `V-DR2-04` | All 3 renames correctly **not** applied provider-side (they belong to the IRR adapter) | `portfolio_store.ts` L125–131, L192–199; test L690–706, L900–925 | **PASS** |
| `V-DR2-05` | Additions are exactly seven — no extra field admitted | test L710–732 | **PASS** |
| `V-DR2-06` | Envelope compatibility: request key minimality, success/Class A frame shapes, Class P zero-byte, closed operation set | `protocol.ts` L147–166, L196, L214; `dispatch.ts` L49–55, L228–233, L255–258 | **PASS** |
| `V-DR2-07` | IPD's replica of the IRR mapping matches IRR's **actual** adapter source at `86346431` — no drift | IRR `ipcPortAdapter.ts` blob `1e20e980…` L414–464, L529–531 vs test L315–395 | **PASS** |
| `V-DR2-08` | Full suite re-executed at `main`: 932 / 931 / 0 / 1, guard OK | `npm test` | **PASS** |
| `V-DR2-09` | Conformance suite isolated: 30 / 30 pass, 0 fail | `node --test dist/tests/q1_ipc_read_contract_conformance.test.js` | **PASS** |
| `V-DR2-10` | Package consumer PASS; browser pack 1,729,910 B; strict typecheck PASS | `npm run test:package-consumer` | **PASS** |
| `V-DR2-11` | Write guard still hard-false and unmodified; `src/` tree unchanged; no IRR write | `portfolio_store.ts` L213–217; `git rev-parse HEAD:src`; IRR read-only | **PASS** |
| `V-DR2-12` | IRR readiness blocker (1) attribution is stale; the IPD half predates it by four days | PR #89 merged `2026-10-25` vs readiness record dated `2026-10-29` | **PASS** (correction recorded, not applied to IRR) |

*End of record. No implementation, no gate movement, no fence change, no write authorization, no PA
decision, no IRR write. The IPD provider half of the DR-2 / DQ-1 envelope is **COMPLETE and
independently re-verified**; the remaining DR-2 closure dependencies are governance- and IRR-owned.*
