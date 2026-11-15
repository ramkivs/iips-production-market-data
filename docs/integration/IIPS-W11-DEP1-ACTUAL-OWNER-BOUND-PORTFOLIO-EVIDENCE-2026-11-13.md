# W11 acceptance dependency 1 — actual owner-bound portfolio evidence (2026-11-13)

> **Superseded in fact (2026-11-13).** After this record was written, the operator ran the merged capture utility on the Windows host. The review and disposition of that capture is in [`IIPS-W11-DEP1-CAPTURE-EVIDENCE-DISPOSITION-2026-11-13.md`](IIPS-W11-DEP1-CAPTURE-EVIDENCE-DISPOSITION-2026-11-13.md). The text below is kept unchanged as the record of the state at the time it was written.

**Result: BLOCKED. No actual persisted, owner-bound portfolio read was obtained. No `G2PortfolioView` is recorded here, because none was returned.**

**Cause: host access (roadmap blocker B02).** The execution environment for this work item holds no IPD service, no IPD endpoint configuration, no portfolio database and no owner binding. It is not an owner-binding refusal, a persistence fault or an API-contract refusal: the read never reached a point where any of those could occur.

**Scope:** IIPS Snapshot-to-Live only. Documentation-only, read-only. IPD repository only. Production out of scope. IRR was read, not modified. W11 acceptance is **not** claimed and cannot follow from this record.

Nothing in this record is a fixture, a constructed object or a copied sample response presented as operational evidence. Where a value is unknown it is written as NOT OBTAINED.

---

## 1. Repository and authority verification

All values below were read on 2026-11-13 (UTC) before any file was written.

| Check | Result |
|---|---|
| IPD remote | `https://github.com/ramkivs/iips-production-market-data.git` (public) |
| Authoritative branch | `main` = `a624d06f66c376f03a29571cb24c3f0f77f0c24d` (merge of PR #153), confirmed by `git ls-remote` |
| Working branch | `arena/5570860c-iips-production-market-data`, branched from `a624d06`; did not exist on the remote before this record |
| Open IPD PRs | #151 Stage 2 evidence collector (head `5312d49fb64e76adbfa3fe57a5134bc7c65abcbb`); #155 Stage 2 identity blockers (head `0b2815abbc7079d1739d05b80eafe234698498eb`); #156 DHAN Windows vault/DPAPI (head `05d2c78b9aea2efe4a017371a99ddad6ff22f649`). All three OPEN, base `main`, mergeable. None touched. |
| Roadmap read | `docs/integration/IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md`, blob `bbd944c56c227160720a3804b92299d7b3236c84`. W02, W03, W09, W11 specifications, the dependency graph and blocker register B01–B08 were read. |
| W02 merged implementation | `29caac3134ec1fb12e4d822c31a806d782cc3e1b` (read-snapshot fix) and `d71ac222e3dc3d0cde79ea1b4b365389b227ec0d` (interleaving tests and evidence note) are both ancestors of `main`, merged by PR #150 (`0b6a0bea173034e0822ddcda36cd176111a0a77a`). |
| W11 report | IRR `docs/integration/W11-ISSUER-ENGINE-EXECUTION-2026-11-12.md`, blob `ff1f8c825e836fbf0eb2ed7fc459329a6435ea8e`, at IRR `d10afbb31573d999f4b331484fcb79c510df1304` (head of IRR PR #563, OPEN, not on IRR `main`). |
| W03/W09 evidence | IRR `docs/integration/IIPS-CURRENT-PORTFOLIO-STAGE-2-IRR-RECORD-2026-11-10.md`, blob `723ede9e1e63fcadee86fbbbe934ba7b8b7de28b` (identical on IRR `main` `a835d4af019ab4f677ab238ec42d44326f06a771` and on `d10afbb`); IPD `docs/integration/IIPS-W02-IPD-READ-CONSISTENCY-EVIDENCE.md`, blob `6895913b92e6aa3fe176634626674c6c1e9aef66`; IPD PR #151 `docs/integration/IIPS-STAGE2-EVIDENCE-COLLECTOR.md`, blob `a110803c6a76255f9ebfcfcbba5508d07a702067`. |

Two naming points that affect how the rest of this record reads:

- **"W-01 … W-06" in IPD PR #156 are a different series** (DHAN Windows credential work). They are not roadmap W01–W06 and are not W03 evidence.
- **`G2PortfolioView` is not an IPD type.** In IPD it appears in no source or test file, only in four historical evidence files under `evidence/cross-repository/`. It is IRR's eleven-field mirror (`frontend/server/user-portfolio/userPortfolioContract.ts:249`, blob `b2185fe2773bbb55ed64651d28caf36523905158`). IPD's wire result for `portfolio.get` is `PortfolioDetail`, or `LocalPortfolioDetail` under the local personal-use switch (`src/persistence/portfolio_store.ts:264`, `:298`). IRR's adapter maps one to the other (`frontend/server/user-portfolio/ipcPortAdapter.ts:249`, `:475`, blob `0c1b4c44c4af3c9793f4c95150417eeb20b2ae1d`).

## 2. The existing IPD-supported read path

Read from source at `a624d06`; not altered.

| Step | Behaviour | Source |
|---|---|---|
| Address | Same-host endpoint named by `IIPS_G2_IPC_ENDPOINT`: AF_UNIX socket on POSIX, named pipe under `\\.\pipe` on Windows. No TCP or HTTP listener. | `src/ipc/endpoint.ts:25`, `:76` (blob `e565aa5b343266f62ffd411d17d74c89b9f29324`) |
| Frame | One length-prefixed JSON request and at most one response per connection; closed read set `portfolio.list`, `portfolio.get`, `portfolio.revisions`. | `src/ipc/protocol.ts` (blob `52fcc19e6f90cfebc23403c971626e88399b3310`) |
| Owner binding | Resolved afresh from the database on every request, with no cache. The caller cannot supply an owner: any identity key at any depth is refused with zero bytes. v1 frames use `resolveActiveBinding` (exactly one ACTIVE binding with exactly one ACTIVE membership attached to it); v2 frames additionally require the D02 holdings owner pair. | `src/ipc/dispatch.ts:381`; `src/persistence/binding.ts:85`, `:161` (blob `fa6cd3e94363ef9c9b353298d90535c571a9e177`) |
| Isolation | Every read predicate carries `canonical_owner_id` (and `tenant_id` when resolving the portfolio). Missing, foreign and tombstoned portfolios give one indistinguishable `RESOURCE_UNAVAILABLE`. | `src/persistence/portfolio_store.ts:749–773`, `:785–826` (blob `7e7f56e513ff41cadbd3a6972684a26dfeb1762b`) |
| Detail read | `store.get` runs the portfolio row, current revision row, holdings and contribution ledger inside one SQLite read snapshot. | `src/persistence/portfolio_store.ts:636–647`, `:781–783` |
| Service start | Fixed order validate → connect → migrate → verify → bind. `connect` creates the database directory and file if absent; `migrate` applies the schema. | `src/ipc/entrypoint.ts:124–142` (blob `5009e6c5bd0e336be9c8d9aafd4a80a1b6a9e06f`); `src/persistence/connection.ts:84–85` (blob `5169e402707cf1a73f16bfb15ffe0b1d395165ff`) |

The last row is why no service was started here: pointing the entrypoint at any path in this environment would have **created a new empty store and run migrations**. That is prohibited by this work item, and an empty store created today is not the actual persisted portfolio in any case.

## 3. The read attempt and its exact failure

### 3.1 Environment facts (probe window 2026-11-13T05:33:00Z)

| Probe | Observation |
|---|---|
| Host | Linux x86_64 sandbox, Node 22.22.3. Not the operator's Windows host. |
| `IIPS_G2_IPC_ENDPOINT` | UNSET |
| `IIPS_G3_LOCAL_STATE_DIR` | UNSET |
| `IIPS_G3_DATABASE_PATH` | UNSET |
| `IIPS_G3_DIAGNOSTIC_DIR` | UNSET |
| `IIPS_LOCAL_PERSONAL_USE` | UNSET |
| Any environment variable whose name contains IIPS, IPD, G2_, G3_, PORTFOLIO or DHAN | none |
| AF_UNIX sockets outside system directories | none |
| SQLite database, journal or WAL files outside system and dependency directories | none |
| Tracked database or socket files in the repository | none |
| Running IPD or IRR process | none |

### 3.2 Executed against IPD's own compiled modules

The probe (appendix A) imported the unmodified compiled output of `src/ipc/endpoint.ts` and `src/ipc/entrypoint.ts` and called the same functions the service and its consumers use. It opens no database, binds no endpoint, sends no frame and writes no file.

```json
{
  "probeStartedAt": "2026-11-13T05:33:00.543Z",
  "platform": "linux",
  "node": "22.22.3",
  "settings": {
    "IIPS_G2_IPC_ENDPOINT": "UNSET",
    "IIPS_G3_LOCAL_STATE_DIR": "UNSET",
    "IIPS_G3_DATABASE_PATH": "UNSET",
    "IIPS_G3_DIAGNOSTIC_DIR": "UNSET",
    "IIPS_LOCAL_PERSONAL_USE": "UNSET"
  },
  "resolveEndpointTarget": {
    "ok": false,
    "errorName": "EndpointConfigurationError",
    "errorMessage": "IIPS_G2_IPC_ENDPOINT is not set"
  },
  "startIpcServer": {
    "ok": false,
    "phase": "validate",
    "error": "IIPS_G2_IPC_ENDPOINT is not set",
    "handleCreated": false
  },
  "databaseConnectionOpened": false,
  "probeCompletedAt": "2026-11-13T05:33:00.543Z"
}
```

Side-effect check: the list of socket and database files outside system and dependency directories was identical before and after (zero entries both times), and `git status` reported no change.

### 3.3 Classification

| Candidate cause | Finding |
|---|---|
| **Host access** | **Yes — this is the blocker.** There is no endpoint to address and no store behind one. The failure is at endpoint resolution, before any connection. |
| Owner binding | Not reached. A binding fault would be a zero-byte Class P close (`BINDING_ABSENT` / `BINDING_INVALID`, `src/ipc/dispatch.ts:381–393`) on a live endpoint. No endpoint exists, so no binding was evaluated, and none was provisioned. |
| Persistence | Not reached. No database file exists here; none was created. Nothing is known about the state of the real store. |
| API contract | Not the cause of this failure. Contract findings that matter once the read is available are in §6; they do not excuse or explain the missing read. |

This does not establish an outage or a defect on the operator's host. It establishes only that the actual portfolio is unreachable from here.

## 4. Requested evidence items

| # | Item | Result |
|---|---|---|
| 1 | Actual persisted portfolio reachable | **NO** — `EndpointConfigurationError: IIPS_G2_IPC_ENDPOINT is not set` |
| 2 | Portfolio identifier | NOT OBTAINED |
| 3 | Authenticated owner binding and isolation context | NOT OBTAINED. The mechanism is described in §2; no actual binding was observed. |
| 4 | Actual `G2PortfolioView` response | NOT OBTAINED. None is reproduced or constructed. |
| 5 | Portfolio revision | NOT OBTAINED |
| 6 | Read source and observation timestamp | NOT OBTAINED. No read occurred, so there is no observation to timestamp. The probe time in §3 is the time of a failed attempt, not a portfolio observation. |
| 7 | Persistence state and operation | NOT OBTAINED |
| 8 | Holding count and exact security identifiers | NOT OBTAINED |
| 9 | Portfolio provenance and source/version identifiers | NOT OBTAINED for the portfolio. The code versions that a future read would run against are pinned in §1 and §2. |
| 10 | Consistency with existing W03 evidence | Cannot be assessed — see §7. |

## 5. W09 consistency checks

None of these can be verified on actual data. The second column records what the source and the merged synthetic tests establish, and nothing more.

| W09 check | On the actual read | What source and synthetic tests show at `a624d06` |
|---|---|---|
| Revision present and valid | NOT VERIFIED | `portfolio.get` projects the stored current revision and refuses, rather than defaults, when the current revision row is missing (`portfolio_store.ts:785–826`). |
| Owner binding preserved | NOT VERIFIED | Binding resolved per request and pinned for that request; a binding switch affects the next request. |
| Read provenance explicit | NOT VERIFIED | The wire carries `provenanceDigest` (stored value). It carries no read-source field — see §6 finding C-1. |
| Observation timestamp present | NOT VERIFIED | The wire carries `lastUpdated` (stored `updated_at`), which is a stored fact and not the time of the read — see C-1. |
| No revision mismatch or cross-owner leakage | NOT VERIFIED | Owner predicates on every read; foreign and missing indistinguishable. |
| Not inferred from separate unbound reads | NOT VERIFIED | Revision and holdings come from one snapshot in one call. Operation and persistence status do not — see C-2. |

Synthetic regression run at `a624d06` in this environment, to confirm the merged W02 implementation is intact. It uses temporary SQLite databases only and **is not operational evidence**:

| Test file | Result |
|---|---|
| `tests/stage2_portfolio_read_snapshot.test.ts` | 11 / 11 pass |
| `tests/stage2_binding_concurrency.test.ts` | 4 / 4 pass |
| `tests/g3_portfolio_read_isolation.test.ts` | 6 / 6 pass |
| `tests/q1_ipc_read_contract_conformance.test.ts` | 30 / 30 pass |

No cross-service atomicity is asserted. The W02 evidence note itself states that list, detail and history are separate observations and that its interleavings do not prove all schedules or cross-process deployments.

## 6. Contract findings that will matter when the read is available

These were found while establishing what "an independently verified owner-bound `G2PortfolioView`" would have to contain. They are recorded, not fixed. None is an IPD defect demonstrated on real data.

**C-1 — Three fields the W11 report attributes to `G2PortfolioView` are not in it.** The W11 report (§2, first row) lists `readSource`, `observedAt` and optional `ownerBindingRef` as part of the `G2PortfolioView` W09 contract. At the same IRR commit, `G2PortfolioView` has exactly eleven fields: `portfolioId`, `portfolioName`, `revision`, `holdings`, `totalMarketValue`, `totalHoldingsCount`, `weightSumPercentage`, `lastUpdated`, `provenanceDigest`, `isSaved`, `contributions`. The three named fields belong to a separate W11 type, `PortfolioRevisionEvidence` (`iips-platform/src/investment/execution/types.ts:56–67`, blob `8bf1577301e5917f332878f5136d7886c125dd30`), which the caller fills in. At `d10afbb` that type is referenced only by the W11 execution module, its test and the W11 report; no code builds it from an actual portfolio read. Consequences:

- *Read source* will be a caller-attested label, not something IPD returns.
- *Observation timestamp* will be the consumer's clock at the time of the call. IPD's `lastUpdated` must not be substituted for it.
- *Owner binding reference* cannot come from the wire at all. IPD deliberately discloses no owner, tenant or binding identifier on any response. On v1, the only wire-level evidence of binding is that a response was produced instead of a zero-byte close. The open collector documentation says the same: the server-resolved binding is not independently attested by these reads.

Ownership: the W11 type and its report are IRR's. Whether IPD should expose a non-identifying binding attestation is an open design question, not a demonstrated gap; no IPD change is proposed here.

**C-2 — Operation and persistence status need more than one call.** `portfolio.get` carries `isSaved` (derived from the current revision's operation) but not the operation itself. The operation is returned only by `portfolio.revisions`, which is a separate request with its own binding resolution and its own snapshot. There is no persistence-state field on any IPC read. A capture that reports both must therefore read detail, then history, then detail again; require the two detail reads to agree on `revision` and `provenanceDigest`; match the history entry by revision number, `provenanceDigest` and `holdingsCount`; and recapture on any mismatch. That is a consistency check at the times of the reads. It is not an atomic multi-call guarantee and must not be described as one.

**C-3 — v1 does not enforce the D02 holdings owner pair.** The running personal-use path is v1. v1 resolves the single ACTIVE binding and membership as stored; the additional check that the pair equals the designated holdings owner applies to v2 frames only (`dispatch.ts:381`). An actual v1 read therefore shows that *one* active binding served the request, not *which* one.

**C-4 — `importEvidence` is read outside the detail snapshot (source reading only, not reproduced).** The service entrypoint always enables the local personal-use switch (`entrypoint.ts:231`). On that path `portfolio.get` calls `store.get` (one read snapshot) and then makes a second, separate `store.contributions` call to build `importEvidence` (`dispatch.ts:174–191`). The merged W02 tests do not exercise this projection. Revision and holdings are unaffected, and `importEvidence` is not one of the eleven `G2PortfolioView` fields, so this does not bear on W11's inputs. It is noted so that the W02 evidence note's statement "Holdings and the current contribution ledger returned by a detail call reflect the same database snapshot" is not read as covering `importEvidence`. Whether another connection can commit between the two reads in the deployed single-process service was not tested.

**C-5 — Security identifiers available per holding.** IPD's stored holding projection carries `symbol`, `companyId`, `identityStatus`, `resolutionDisposition`, `lineageDigest` and a nullable `securityIdentity` object (`securityId` in the form `ISIN:<isin>:<series>`, `isin`, `series`, `isinAuthority`), per `portfolio_store.ts:1097–1135`. A null `securityIdentity` means explicitly unresolved. There is no top-level `isin` or `exchange` on IPD's holding rows. "Exact security identifiers" for W11 therefore means the `securityIdentity` objects where present and an explicit unresolved marker otherwise — never an identifier derived from the symbol.

## 7. Reconciliation with existing W03 evidence

**Existing W03 evidence remains insufficient, and nothing obtained here can be reconciled against it.**

| Existing evidence | What it actually establishes |
|---|---|
| IRR Stage 2 record §2 (2026-11-10) | W03 "PARTIAL": the report and artifact mechanism is inventoried from the repository; "Actual inventory NOT obtained — blocked by absent authorized host access (B02)". No count or revision. |
| IPD PR #151 collector (OPEN, unmerged) | A sanitized collection tool exists and passes synthetic Windows tests. The PR's own comment of 2026-11-11 states "Actual user-runtime verification has NOT occurred." |
| Operator runtime summary quoted in PR #151 | One run returned `UNKNOWN / UNKNOWN / []`. PR #154 established that the original collector swallowed the underlying failure, so that result is an unobserved discovery, not an observed empty portfolio, and its cause cannot be attributed. |
| Operator description quoted in PR #151 documentation | One portfolio at INITIAL revision 1 with 64 holdings, 64 active, `isSaved=false`, weight sum 100. This is a description of what the UI showed, used as the *expected* shape for a rerun; the same document says the runtime timestamp and digest "must be read, not prefilled from the incident report". No collector output file is tracked on `main` or on the heads of PRs #151, #155 or #156. |

The operator description is a useful prediction to test on the next capture. It is not a read, and this record does not treat it as one.

One statement in the existing evidence is now out of date and is reconciled here: the IRR Stage 2 record §6.3 found that the IPD W02 read-snapshot fix `29caac3` was not in IPD `main`. It now is (§1). That removes the IPD-side source precondition the record named for W09; W09 acceptance still requires actual revision evidence.

## 8. Operator action required

Only the host operator can clear this dependency. On the authorized **non-production** Windows host, under the operating user's existing access controls, with the existing IPD local service already running against its existing store:

1. Do not start, reconfigure, migrate, seed or re-import anything for the purpose of the capture. If the service is not running, start it only by its normal procedure against its existing database.
2. Through the existing v1 IPC read path, capture in this order: `portfolio.list`, `portfolio.get`, `portfolio.revisions`, `portfolio.get`. Record the consumer clock immediately before the first and after the last call.
3. Accept the capture only if both detail reads return the same `revision` and `provenanceDigest`, the history entry for that revision has the same `provenanceDigest` and `holdingsCount`, and the number of holdings returned equals `holdingsCount`. On any mismatch, recapture; do not merge values across attempts.
4. If a read returns zero bytes and closes, inspect the local Class P journal with the existing offline command (`node dist/src/ipc/inspectClassPDiagnostics.js --directory <journal directory>`) to distinguish `BINDING_ABSENT` or `BINDING_INVALID` from a framing fault. That would be an owner-binding blocker and must be reported as such, not worked around.
5. Record, alongside the capture: the IPD commit the running service was built from, the protocol version used, and the fact that the binding was server-resolved and not independently attested (C-1, C-3).

Two decisions the principal needs to make before that evidence is published, because this repository and IRR are both public:

- **Where identifier-bearing evidence lives.** Roadmap W03 requires sanitized output with no identifiers or values. This dependency asks for exact security identifiers. The PR #151 collector emits counts only and no raw response, so it can satisfy W03's sanitized inventory but cannot by itself supply the actual view W11 consumes. The existing path that yields a real `G2PortfolioView` is IRR's own consumer read on the host. Either W11 consumes that view locally on the host and publishes digests and counts, or the principal explicitly directs that identifiers be published.
- **Whether PR #151 is to be merged or used from its branch.** It is the only IPD tool for a sanitized cross-check and is currently unmerged. This record takes no merge action.

## 9. What was not done

- No portfolio data was created, seeded, imported, rewritten or modified. No database file was created.
- No owner was provisioned and no authentication or binding was changed or bypassed.
- IPD persistence and the W02 implementation were not altered. The only repository change is this document.
- No fixture, sample or hand-built object is presented as an actual read.
- IRR was not modified. It was read from a temporary clone outside this repository.
- No PR was merged, closed or retargeted in either repository.
- W11 acceptance is not claimed. W03 and W09 acceptance are not claimed.

## 10. Status

| Item | Status |
|---|---|
| W11 dependency 1 (actual owner-bound portfolio evidence) | **BLOCKED — host access (B02)** |
| W03 actual inventory | Unchanged: not obtained |
| W09 final acceptance | Unchanged: not accepted; IPD-side W02 source precondition now in `main` |
| W11 acceptance | Unchanged: not claimed (IRR PR #563 remains OPEN) |

**Next action:** the host operator performs the read-only capture in §8 on the non-production Windows host, after the principal settles where identifier-bearing evidence is kept. This record should then be superseded by one that contains the actual read.

---

## Appendix A — probe source

SHA-256 `9a9058463f3daf91578fc12f5db6c2ce0b85c9d4b7ff0bc88a9898d4c5da790d`. Run with `node probe.mjs` after `npm ci` and `npm run build:tsc` at `a624d06`. It was kept outside the repository and is reproduced here so the result can be re-run.

```js
// W11 dependency 1 — read-only reachability probe. Executes ONLY IPD's own compiled
// modules; opens no database, binds no endpoint, writes no file, sends no frame.
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
const root = '/home/user/iips-production-market-data/dist/src';
const imp = (p) => import(pathToFileURL(`${root}/${p}`).href);
const { resolveEndpointTarget, IPC_ENDPOINT_SETTING, IPC_STATE_DIR_SETTING } = await imp('ipc/endpoint.js');
const { startIpcServer, DATABASE_PATH_SETTING } = await imp('ipc/entrypoint.js');
const { LOCAL_PERSONAL_USE_SETTING } = await imp('ipc/localPersonalUse.js');
const { CLASS_P_DIRECTORY_SETTING } = await imp('ipc/classPJournal.js');
const { getProcessConnection } = await imp('persistence/connection.js');

const out = { probeStartedAt: new Date().toISOString(), platform: process.platform, node: process.versions.node };
out.settings = Object.fromEntries(
  [IPC_ENDPOINT_SETTING, IPC_STATE_DIR_SETTING, DATABASE_PATH_SETTING, CLASS_P_DIRECTORY_SETTING, LOCAL_PERSONAL_USE_SETTING]
    .map((k) => [k, process.env[k] === undefined ? 'UNSET' : 'SET(value withheld)']));
try {
  const t = resolveEndpointTarget(process.env, process.platform);
  out.resolveEndpointTarget = { ok: true, kind: t.kind, source: t.source, endpointExists: existsSync(t.path) };
} catch (e) {
  out.resolveEndpointTarget = { ok: false, errorName: e?.name, errorMessage: e?.message };
}
// Startup order is validate -> connect -> migrate -> verify -> bind. With the
// environment as found, the outcome is reported; `connect` is only reached if
// validate passes, and getProcessConnection() proves whether a DB was opened.
const outcome = await startIpcServer({ env: process.env });
out.startIpcServer = { ok: outcome.ok, phase: outcome.phase ?? null, error: outcome.error ?? null, handleCreated: Boolean(outcome.handle) };
out.databaseConnectionOpened = getProcessConnection() !== null;
out.probeCompletedAt = new Date().toISOString();
console.log(JSON.stringify(out, null, 2));
if (outcome.handle) { await outcome.handle.close?.(); }
```

`startIpcServer` was safe to call only because the environment had no endpoint setting: it returns at the `validate` phase before `connect`. On a host where the settings are present this probe must not be used, because the same call would open the real database and bind the endpoint.
