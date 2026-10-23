# IIPS v3.0 — 51 × 17 Capability Matrix: Full Current-State Investigation, Reconstruction and Reconciliation

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-CAPMATRIX-51X17-RECONSTRUCTION-2026-10-23-01` |
| **Record type** | Independent current-state investigation + reconstruction of the §18 capability matrix, with reconciliation report. Creates no authority, lifts no fence, admits no lineage, and renders no acceptance, qualification or release decision |
| **Investigation date** | `2026-10-23` (UTC) |
| **Investigator** | Arena Agent Mode — read-only investigation, execution of existing test/build/route surfaces, and documentation only |
| **Repositories** | `ramkivs/iips-review-recovered` (IRR) and `ramkivs/iips-production-market-data` (IPD) |
| **Authoritative tracker** | IRR `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` (§§1–20; last banner update `2026-10-23`, `CV-CORR-76`) |
| **Prior matrix** | Tracker §18 (`## 18 Capability Convergence Matrix`, §18.1, 51 rows), dated `2026-10-14` with cumulative overlays through `2026-10-21` |
| **Matrix artifact status at start** | **No standalone matrix file existed in Arena, IRR or IPD.** §18 inside the master tracker was the only matrix. It was treated as a *prior record to be re-derived and reconciled*, never as a source of current status values |
| **Deliverables** | This report; `artifacts/IIPS_V3_CAPABILITY_MATRIX_51x17_2026-10-23.csv`; `artifacts/IIPS_V3_CAPABILITY_MATRIX_51x17_2026-10-23.xlsx` |

---

## A. Investigation baseline

### A.1 Repository state (verified live, not inherited)

| Item | IRR `ramkivs/iips-review-recovered` | IPD `ramkivs/iips-production-market-data` |
|---|---|---|
| Default branch | `main` | `main` |
| `main` commit | **`4740ba21ea6103f1a7ebc9768269ae7795920698`** | **`ddaaef98a4f641628ee0e0c7eb5cff08bac206ba`** |
| `main` root tree | **`23c5ca4ae1bfd481bcfc911c70b9e7dc090e1162`** | **`29cdf772527ddd1519e263af79c7babd023c75e3`** |
| Commits reachable from `main` | 657 | 253 |
| Remote branches enumerated | 195 | 73 (full head fetch performed) |
| Tags | `program-v1.2.0` → `5decdca93e5d3b90ec94ca902ff73af45574a6ac` (annotated, object `4ec8812e`); `v3.0-phase12-certified` → `7325aeda8c9881ebdf2b96f64323998f1c46ba26` (annotated, object `a975b0d0`) | `iips-pin-g24-6828155e` → peels to `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`; `iips-pin-np04-2e11fa3b` → peels to `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494`; plus `p14-r7-65b78f7`, `portfolio-option-a-cb969b6`, `post-cleanup-baseline-b46b4f4`, `temporary-cleanup-caf73ba` |
| Open pull requests | **1** — #204 "Gate 4/H-12 dependency and DR/GOV execution report" (not a draft) | **1** — #42, **draft**, head `afa430900c3e928773bd35a3718bf3d6c94ccff5`, **not** an ancestor of `main` |
| Releases | 1 — "Program v1.2.0 — 13-Engine Successor LTS", tag `program-v1.2.0`, published `2026-09-05T06:11:08Z` | **0** |

**Verification environment.** Linux sandbox; Node `v22.22.3`; npm `10.9.8`; Python `3.11.2`. `npm ci` required `NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/e2b-ca.crt` because the sandbox TLS-intercepting proxy otherwise fails `UNABLE_TO_VERIFY_LEAF_SIGNATURE` on `codeload.github.com` (this matches the runbook's documented caveat). TLS verification was **not** disabled and no lockfile was modified. Outbound egress exists only to GitHub/npm/pypi; MoSPI is **not** reachable, which is why the Macro route returns its documented `502` refusal here.

### A.2 Refs examined

- IRR: `main`; `origin/promotion/governed-reports-candidate` (`4906a6b`); `origin/arena/01a0f1b3-…` (`6a8afbb`); `origin/arena/a2df3b85-iips-review-recovered` (contains `470cc698…`, branch tip `5eba01b6…`); both annotated tags. Merged-PR census of the last 15 merges (#216–#230) was read directly from the GitHub API.
- IPD: `main`; `origin/arena/feda2d8c-…` (draft PR #42 head); `arena/01a0f308-…` (`6828155e…`), `arena/01a0e6d9-…` (`c1b955b4…`), and the Gate A′ basis `2ded0e98…` — all re-tested for ancestry; all six IPD tags.
- **Shallow-clone trap (recorded as discrepancy D-08).** The workspace checkout of IPD is a depth-1 clone (`git rev-list --count origin/main` = 1). Under it, `2d9130e7…` and `70b24f02…` appeared **not** to be ancestors of `main`. A full clone shows both **are** ancestors. No ancestry conclusion in this report is drawn from the shallow checkout.

### A.3 Authoritative tracker and decision registers

| Register | Location | Status used |
|---|---|---|
| Master tracker + decision register | IRR `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` (1,683,784 B, 7,916 lines) | **Primary reconciliation source** |
| Program authority decisions `REG-01`…`REG-13` | tracker §2 | Effective where recorded |
| Work-item register `CV-01`…`CV-53` | tracker §16.4 (35 items) | Status claims re-tested per row |
| Pending-work summary / progression | tracker §§19–20 | Counting rules cross-checked |
| Prior capability matrix | tracker §18.1 (51 rows × 17 columns) | Prior record only; every cell re-derived |
| IRR integration decisions | IRR `docs/integration/` (221 entries) | Effective only if merged to `main` |
| IPD cross-repository records | IPD `evidence/cross-repository/` | Effective only if merged to `main` |
| IPD program workbook | `IIPS_Production_Market_Data_Intelligence_Program_v1.0_TRACKER_INTEGRATION_ALIGNED.xlsx` | **Historical planning snapshot only** (CV-36 closed 2026-10-21); not status authority |

### A.4 Executed validation (this investigation — not reported by a prior record)

Everything below was **run in this session at the stated commits**. Where a prior record's figure differs, the executed figure governs.

| Check | Command / method | Result |
|---|---|---|
| IRR typecheck | `npm run typecheck` (`tsc --noEmit`) | **0** errors |
| IRR replay-server typecheck | `npm run typecheck:replay-server` | **0** errors |
| IRR full suite | `npx vitest run` (JSON reporter) | **339 suites / 1,197 tests / 1,197 passed / 0 failed** (98 test files) |
| IRR build | `npm run build` | **0**; main chunk **1,590.96 kB** (gzip **222.05 kB**) |
| IRR fence/adapter/transport block | 6 files (`fenceUnchanged`, `ipcPortAdapter`, `option2F`, `ownerContextFromBinding`, `user-portfolio-transport`, `brokerImportHttp`) | **129 / 129 passed** |
| IRR restart recoveries | `persistence-restart-proof.test.ts` + `consumer-restart-read.test.ts` | **5 / 5 passed** (PF-1 cycles 2/2; rows 9, 10, 11 consumer reads 3/3) in genuine separate OS processes |
| IRR reports + broker-import UI block | `reports-api`, `reports-transport`, `BrokerImportModalIntegration`, `brokerImportPackageConsumer` | **15 / 15 passed** (4 files) |
| IRR live route probe | `tsx server/executive-transport.ts` on `127.0.0.1:8791`, 20 requests | see A.5 |
| IPD typecheck | `npx tsc --noEmit` | **0** errors |
| IPD build | `npm run build` (tsc + vite + both package builds) | **0** |
| IPD full suite | `npm test` (guarded runner) | **66 source suite files / 875 tests / 874 passed / 1 skipped / 0 failed**; guard printed the count |
| IPD Gate 3 block | `node --test dist/tests/g3_{portfolio_read_isolation,write_gate,durability_vocabulary,startup_validation}.test.js` | **41 / 41 passed** |
| IPD package consumer | `npm run test:package-consumer` | **PASS**; pack **1,729,700 B**, forbidden module hits **0**, strict typecheck `skipLibCheck:false` |
| IPD ancestry audit | full clone, `git merge-base --is-ancestor` per ref | G24 lineage **not** on `main`; Gate 3 lineage **is** on `main` |

### A.5 Live route probe — composed IRR server (`main@4740ba21`, 2026-10-23)

| Route | Result | Meaning |
|---|---|---|
| `GET /api/health` | `200` | transport up |
| `GET /api/executive` | `200`, 13 holdings | row 1 wiring |
| `GET /api/portfolio` | `200`, `PF-REAL`, 13 holdings | row 2 |
| `GET /api/company/banking` | `200`, `Banking-H1`, Watch / 47.1 | row 3 |
| `GET /api/cross-sector` | `200`, avgConviction 72.9 | row 5 |
| `GET /api/decision-matrix` | `200` | row 17 |
| `GET /api/engines` | `200`, 13 engines | row 6 |
| `POST /api/engines/sector.banking/execute` | `200`, `COMPLETED`, snapshot ref | row 6 execution path |
| `POST /api/screener` (valid definition) | `200`, population **13**, matched **13**, `COMPLETED`, evaluator `NP12-SCREEN-EVALUATOR` | row 7 |
| `POST /api/screener` `{}` | `400 missing-definition` | fail-closed validation |
| `GET /api/evidence/banking` | `200`, `referenceOnly:true` | row 13 |
| `GET /api/replay/banking` | `200`, `original:null`, `NOT_PERFORMED` | row 15 semantics correct |
| `GET /api/ai-advisory/banking` | `200`, non-authoritative advisory | row 18 |
| `GET /api/pit/market-data` with D114 identity | `200`, `found:true`, `resolvedAsOf 2026-02-10`, `dataVersion np-d01-bl-2` | row 20 E2E |
| `GET /api/pit/market-data` with non-D114 identity | `404 NOT_FOUND` | honest miss |
| `GET /api/macro/NAS?indicatorCode=1` | `502 RETRY_BUDGET_EXHAUSTED` | documented no-egress refusal (not a defect) |
| `GET /api/user-portfolios` | `503 owner-context-unavailable` | row 34 fence |
| `GET /api/reports/context` | `503 owner-context-unavailable` | row 34 fence |
| `GET /api/broker-import/p1/revision` | `503 owner-context-unavailable` | row 30/34 |
| `GET /api/watchlists`, `/api/settings`, `/api/collaboration` | `503 owner-context-unavailable` | correct: this sandbox has no owner-context carrier |

**Reading rule for the `503`s.** A fail-closed `503` is the *required* behaviour while no ownership source and no carrier exist. It is recorded as correct wiring, not as a defect. It also means rows 9/10/11 could not be exercised over HTTP in this environment; their persistence and recovery evidence comes from the executed restart suites, which use the real services directly.

### A.6 Fence integrity (re-hashed at `main`, this session)

| File | `git hash-object` | Matches pin |
|---|---|---|
| `frontend/server/reports-transport.ts` | `981470541812a64c733309f1debec75455d85bee` | yes |
| `frontend/server/user-portfolio-transport.ts` | `51704c12a467cd2f718a030b5036bc55c9afa73f` | yes |
| `frontend/server/owner-context-unavailable.ts` | `cb8db45d668d28cee7e0a52721001d579a872733` | yes |
| `frontend/server/user-portfolio/userPortfolioContract.ts` | `e6b57bb8a021d8eb4b9b7572d12affc7de66be0b` | yes |

---

## B. Complete capability assessment (all 51)

Counting rule for the **Disposition** column: one bucket per capability, assigned by the *strongest* state actually evidenced — acceptance is never inferred from implementation, and a dated exclusion outranks "not built". The nine buckets and their counts are defined in §E.

| # | Capability (owner) | Disposition | Current state (one line) | Change vs previously recorded status |
|---|---|---|---|---|
| 1 | Executive dashboard + certified executive DTO (IRR) | `ACCEPTED` | Route, DTO and client wired; live 200 with 13 holdings; accepted. | — |
| 2 | Portfolio workspace + certified reference holdings read (IRR) | `ACCEPTED` | Reference workspace wired; live 200; distinct from the fenced owner path. | — |
| 3 | Research — company intelligence (IRR) | `ACCEPTED` | Company/sector snapshot view wired; live 200. | — |
| 4 | Research — sector surface (IRR) | `ACCEPTED` | Sector surface implemented, mounted, bounded-accepted; browser E2E operator-owned. | — (already corrected 2026-10-21) |
| 5 | Cross-sector intelligence pipeline (IRR + platform) | `ACCEPTED` | Cross-sector pipeline wired in IRR; platform chain source-reported. | — |
| 6 | Engine registry + engine execution surface (IRR + platform) | `ACCEPTED` | 13-engine registry + execution wired; live execute returned COMPLETED. | — |
| 7 | Governed Screener — N4 certified producer (IRR) | `ACCEPTED` | 13-member governed screener proven live (13/13, COMPLETED). | — |
| 8 | NP-12 producer convergence `A6-IMPL-10` (IRR) | `DEFERRED by dated decision` | Producer convergence not built; Option B is the final disposition. | — (finality recorded 2026-10-21) |
| 9 | Watchlists (IRR + Class-C journal) | `ACCEPTED` | Journal-backed; consumer restart read proven in a new process (executed). | — (restart proof re-executed here) |
| 10 | Collaboration (IRR + journal) | `ACCEPTED` | Journal-backed; thread/comment/vintage recovery proven (executed). | — (re-executed here) |
| 11 | Settings incl. reset (IRR + journal) | `ACCEPTED` | Journal-backed; update AND reset recovery proven (executed). | — (re-executed here) |
| 12 | Owner-context carrier + fail-closed owner fence (IRR) | `ACCEPTED` | Carrier + fail-closed fence operate as designed; 503 without carrier. | — |
| 13 | Evidence landing + explorer (IRR) | `ACCEPTED` | Landing/explorer wired; live 200 reference-only evidence. | — |
| 14 | Evidence snapshots surface (platform + IRR route) | `OUT OF SCOPE / CLOSED by decision` | No IRR surface; PA Option A makes it API-only permanently for this product. | — |
| 15 | Evidence replay + v1.1.0 Replay Baseline (IRR) | `ACCEPTED` | Stage A capture/replay implemented and accepted; no durable archive. | — |
| 16 | Replay landing route (IRR) | `OUT OF SCOPE / CLOSED by decision` | Bare landing reserved unavailable by PA decision; direct-ID only. | — |
| 17 | Decision matrix (IRR) | `ACCEPTED` | Wired; live 200. | — |
| 18 | AI advisory over certified results (IRR) | `ACCEPTED` | Wired; live 200; advisory explicitly non-authoritative. | — |
| 19 | Macro / D08 guarded read — NAS, CPI, IIP (IRR) | `ACCEPTED` | Wired; sandbox returns documented 502 (no egress); live-source E2E on operator Windows only. | E2E clarified: 502 here is the documented no-egress refusal, not a defect |
| 20 | PIT read seam + `/api/pit/market-data` (IRR ↔ IPD, Gate 43) | `ACCEPTED` | Wired to the pinned IPD package; live 200 found:true with vintage + provenance. | CHANGED: evidence anchor pin 2e11fa3b -> 2d9130e7; status unchanged |
| 21 | PIT UI surface (IRR) | `OUT OF SCOPE / CLOSED by decision` | No PIT UI; API-only disposition. | — |
| 22 | D115 runtime CompanyId boundary (IRR) | `IMPLEMENTED` | Boundary implemented and tested; zero consumers. | — (absence re-verified) |
| 23 | Universal Company identity / tenant authority (IRR + IPD) | `OUT OF SCOPE / CLOSED by decision` | Deliberately not built (D-2 Option B); the decision is the deliverable. | — |
| 24 | Intelligence destination surface (IRR) | `ACCEPTED` | Three intelligence views admitted and routed; parent splat still placeholder. | — |
| 25 | IPD security master + instrument identity mapping (IPD P04/D05) | `ACCEPTED` | Security master + mapping present; 2,250 entities (52 real + 2,198 synthetic). | — |
| 26 | IPD engine adapters + `CertifiedSectorEngineId` bridge (IPD WSD P11) | `ACCEPTED` | Engine-adapter library present; bounded acceptance; no product consumer. | — |
| 27 | IPD offline shell (data plane + UI) | `ACCEPTED` | Offline shell present; structure-only acceptance; Windows visual source-reported. | — |
| 28 | Broker ingestion chain (IPD) | `IMPLEMENTED` | Ingestion chain + durable boundary exist; durable path unwired and unqualified. | CHANGED: durable boundary now exists on IPD main but has no consumer |
| 29 | Operator Drop (IPD) | `DEFERRED by dated decision` | Operator Drop present but deferred by REG-06. | — |
| 30 | User-portfolio read surfaces — UI + typed client (IRR) | `BLOCKED` | UI and client present; every route fails closed; no ownership source provisioned. | CHANGED: Q1-b ownership source designated (2026-10-22); not operational |
| 31 | `G-2` §5 HTTP contract + port + `D-2` §8 translation boundary (IRR) | `ACCEPTED` | Contract/port/boundary present and accepted in scope; 503 path proven. | — |
| 32 | G24 durable store + IRR HTTP adapter (off-`main` lineages) | `BLOCKED` | G24 and its adapters remain off-main; ancestry re-verified reference-only. | CHANGED: branch distance re-measured 414 -> 499 behind |
| 33 | Owner→G24 binding chain `P-2` → `P-4` → `P-6` → `P-8` (IRR + IPD) | `OUT OF SCOPE / CLOSED by decision` | P-2 done; P-4/P-6/P-8 closed by scope (H-18). | — |
| 34 | Fail-closed `503` fences — `/api/user-portfolios*`, `/api/reports*` (IRR) | `VERIFIED` | All twelve pairs 503; blobs byte-identical to the pinned hashes. | — (blobs re-hashed) |
| 35 | Reports domain on `main` (IRR) | `BLOCKED` | Domain absent from main; fence only. | — |
| 36 | Reports implementation lineage (branch-only) | `BRANCH-ONLY` | Ten implementation files exist on branch refs only. | — |
| 37 | Reports UI + no-auth port (IRR) | `BRANCH-ONLY` | No Reports UI, no /reports route, anywhere on main. | — |
| 38 | Class-C journal persistence service (IRR PF-1) | `ACCEPTED` | Append-only journal with two-process recovery proof executed. | — (proof re-executed here) |
| 39 | Data-directory policy — TD-7a local, TD-7b production profile (IRR) | `ACCEPTED` | TD-7a works under IIPS_DATA_DIR; TD-7b deferred. | — |
| 40 | Certified-analytics ↔ user-portfolio integration | `OUT OF SCOPE / CLOSED by decision` | Excluded by G-2 §7. | — |
| 41 | Governed-universe widening for owner data (IRR) | `DEFERRED by dated decision` | 13-row universe preserved; expansion deferred by PA Option C. | — |
| 42 | WorkflowRuntime (platform, historical-only) | `HISTORICAL / SOURCE-REPORTED baseline` | Present in platform only; one regression test consumes it. | — |
| 43 | CSIP + v1.1 certification tracks (platform + cross-sector) | `HISTORICAL / SOURCE-REPORTED baseline` | Certificates present; not re-executed (source-reported baseline). | — |
| 44 | Retired auth/admin stack on unmerged branches (IRR) | `OUT OF SCOPE / CLOSED by decision` | Absent from main; excluded by H-18. | — |
| 45 | Package + ref durability of the IPD pin (IRR + IPD) | `ACCEPTED` | Main pin durable and guarded; a second unguarded pin was found. | CHANGED: second IPD pin (iips-broker-import @ 70b24f02) found, unguarded |
| 46 | IPD test-runner false green (IPD) | `ACCEPTED` | Guarded runner executed 875 tests and printed the count. | — (executed here: 875/874/1/0) |
| 47 | Operator runbook + server start path (IRR) | `ACCEPTED` | Start path works; three runbook figures are stale. | CHANGED: three runbook figures now demonstrably stale |
| 48 | Program documentation + tracker integrity (IRR + IPD) | `ACCEPTED` | Tracker claims largely verified; two superseded statements remain. | CHANGED: two superseded persistence statements identified |
| 49 | v1.2.0 release state (IRR) | `ACCEPTED` | Tag + GitHub Release live and consistent. | — (tag/release re-verified) |
| 50 | Gate C `P-2` establishment + amended one-artifact deposit (governance) | `ACCEPTED` | One-artifact deposit verified; closed for in-scope criteria. | — |
| 51 | F5R disposition and F5 execution decision (governance) | `OUT OF SCOPE / CLOSED by decision` | F5R closed out of scope; no residual act. | — |

---

## C. Discrepancies

Each entry states what the conflicting records say, which evidence is authoritative and why, the reconciled status, and the remaining corrective action.

### D-01 — The tracker still asserts that IPD `main` has no persistence layer (material)

- **Conflicting records.** Tracker §17 "Implemented but not integrated or wired" item (4): *"IPD `main` has **no HTTP server at all** and `0` files under `src/persistence` (V15/V18), so nothing on IPD `main` can serve a durable portfolio store."* Tracker §19, Persistence/Durability row: *"IPD `main` store is in-memory (V15)."* Q1-b disposition §1.2 (2026-10-22): *"IPD `main` has zero files under `src/persistence`, `src/ipc`, `src/server`… no IPC endpoint exists on `main`."* Against these, tracker CV-39 already records that the Gate 3 store *"is now merged on IPD `main@1cceacff…`"*.
- **Authoritative evidence.** IPD `main@ddaaef98` contains **9 files** under `src/persistence/` (`audit`, `binding`, `brokerImportPersistence`, `connection`, `durablePortfolioStorePort`, `migration_ledger`, `migrations/`, `portfolio_store`, `provisioning`) and **4** under `src/ipc/` (`dispatch`, `endpoint`, `entrypoint`, `protocol`). `src/ipc/endpoint.ts` binds with `node:net` (`createServer`) — a same-host AF_UNIX socket / Windows named pipe — and imports no `node:http`. Gate 3 lineage `1cceacff…` and `3eb13ed…` are ancestors of `main` (verified on a full clone); the Gate 3 acceptance record and IPD CI run `39765365164` corroborate the merge.
- **Why this evidence wins.** It is the tree at the authoritative ref, re-derived today, plus ancestry proved on a complete object graph. The three quoted statements were true at their own baselines (`c0e1b566…`, pre-2026-10-22T10:44Z) and became stale at the Gate 3 merge, which the tracker itself later recorded in CV-39.
- **Reconciled status.** The durable store and IPC endpoint **exist on `main`**. What does not exist is (a) any HTTP server on IPD side and (b) any provisioned binding: `provisioning.ts` is brand-gated (`GATE_A_PRIME_BRAND`, module-private symbol) and unreachable from every IPC op, so the binding table is empty. The operational conclusion ("cannot serve owner data") still holds — but for the *provisioning* reason, not the *absent code* reason.
- **Corrective action.** Correct §17 item (4) and the §19 persistence-row text; annotate Q1-b §1.2 as baseline-bound and superseded by the Gate 3 merge. No governed decision changes.

### D-02 — A second, stale, unguarded IPD package pin feeds the IRR build (new finding)

- **What the records say.** Row 45 / CV-25 record the IPD pin as durable and guarded, naming `frontend/package.json` → `iips-production-market-data#<sha>` and the package-consumer test as the enforcement point.
- **Evidence.** IRR `frontend/package.json` carries **two** dependencies pointing at the same repository: `iips-production-market-data` @ **`2d9130e7…`** (8 commits behind IPD `main`) **and** `iips-broker-import` @ **`70b24f02…`** (2026-10-16, IPD PR #7 — **157 commits** behind `main`). The lockfile resolves `node_modules/iips-broker-import` to `name: iips-production-market-data`. `tsconfig.broker-import.json` compiles IPD broker-import sources **from the alias** and runs on `predev`, `prebuild`, `pretest`, `pretest:ci` and `pretypecheck`. `brokerImportPackageConsumer.test.ts` asserts the exact pin **only** for `iips-production-market-data`; nothing guards `iips-broker-import`.
- **Why this evidence wins.** It is the dependency graph itself plus the guard test's own assertion surface, read at `main`.
- **Reconciled status.** Row 45's package-durability criterion is met **for the main pin**; the build additionally consumes a second, older, unguarded IPD snapshot. Both commits *are* ancestors of IPD `main`, so this is a reproducibility/consistency gap, not a reachability failure.
- **Corrective action (owner decision required).** Either re-pin the alias to the same commit as the main dependency, or add the alias to the guard test, or remove the alias if the Broker Holdings preview is retired. All three are dependency acts, not architecture changes; none is performed here.

### D-03 — Operator runbook figures no longer reproduce at the current head

- **What the record says.** `docs/OPERATOR_RUNBOOK.md` §0 states the pin is `#2e11fa3b689d1a3674a5e4ba1f1de9a559e20494`; §8 states expected `87 files / 1,077 tests` and main chunk `292.88 kB` (gzip `84.18 kB`), re-stamped 2026-10-21.
- **Evidence (executed today).** Pin is `#2d9130e7…` (moved by IRR PR #225 when B-1R closed). Suite is **98 files / 1,197 tests**. Chunk is **1,590.96 kB / 222.05 kB** gzip.
- **Why this evidence wins.** Direct execution at `main@4740ba21`; the runbook itself says these values move with the repository.
- **Reconciled status.** Row 47 remains accepted (2026-10-17) but now carries three demonstrably stale figures. The gap between 292.88 kB and 1,590.96 kB is large enough to mislead a reader about the runtime surface; it is consistent with the real IPD `./portfolio-ui` package and the broker-import build being folded in after the last re-stamp.
- **Corrective action.** Re-stamp the pin string, test count and bundle figures (documentation-only, within standing authority). Recorded here; **not** applied to the runbook in this pass.

### D-04 — §18 row 20 and CV-05 cite a superseded PIT pin

- **What the record says.** §18 row 20: *"seam bound to the pinned IPD package `2e11fa3b`"*; CV-05: *"admitted at IPD pin `2e11fa3b`"*.
- **Evidence.** `frontend/package.json` pins `2d9130e7…`; the consumer guard enforces it; the live probe returns `found:true` through that pin.
- **Reconciled status.** Status unchanged (still admitted, still narrow, still non-production) — the **anchor** is stale, not the assessment.
- **Corrective action.** Update the anchor string in row 20 and CV-05.

### D-05 — Branch-distance figures have drifted (counts, not status)

- **What the record says.** CV-52: IRR `arena/a2df3b85-…` is `7 ahead / 414 behind` `main` (re-measured 2026-10-22), branch tip `5eba01b6…`.
- **Evidence.** Re-measured today with full history: **7 ahead / 499 behind**. IPD historical tips re-checked: `6828155e…`, `c1b955b4…`, `2ded0e98…` remain non-ancestors of `main`.
- **Reconciled status.** Status identical (branch-only, reference-only, blocked). Only the arithmetic moved; stale counts must not be reused.
- **Corrective action.** None beyond using current numbers; recorded so the next pass does not inherit `414`.

### D-06 — Tracker self-inconsistency on the same fact (subset of D-01)

- §17/§19 (dated 2026-10-14/21 text) and CV-39 (corrected 2026-10-22) make incompatible statements about IPD persistence. The later, evidence-backed CV-39 row wins; the older paragraphs were never corrected. Recorded separately so the corrective action is not lost inside D-01.

### D-07 — PR #204 is dispositioned but still open

- **What the record says.** Tracker §16.93 records PR #204 (Gate 4/H-12 dependency and DR/GOV execution report) as *"superseded — do not merge as-is"*, and the banner says it is the only open IRR PR.
- **Evidence.** `gh pr list --state open` returns exactly #204, still open, `updatedAt 2026-10-22T19:25:49Z`.
- **Reconciled status.** No status error — the disposition is correct and the PR is correctly left untouched. It is an **open loop**, not a discrepancy in the matrix.
- **Corrective action.** Close it with a reference to the superseding record (routine housekeeping; not performed here).

### D-08 — Shallow-clone ancestry inversion (methodological)

- **What happened.** The workspace checkout of IPD is depth-1. `git merge-base --is-ancestor 2d9130e7 origin/main` and the same test for `70b24f02…` both returned **false**, implying two IRR pins were unreachable from `main`.
- **Authoritative evidence.** A full clone (253 commits) shows both **are** ancestors.
- **Why it matters.** Several tracker claims are ancestry claims ("X is not an ancestor of `main`"). Under a shallow clone they *appear* true for the wrong reason. All ancestry statements in this report were re-derived on a complete object graph.
- **Corrective action.** Note in the runbook/next pass: never test ancestry in a shallow clone; `git rev-parse --is-shallow-repository` first.

### D-09 — Capability-label drift between the required inventory and §18

- **What differs.** Row 19 is `Macro / D08 governed read and D89 display (IRR)` in §18 but `Macro / D08 guarded read — NAS, CPI, IIP (IRR)` in the required inventory; row 26 is `IPD in-process engine-adapter library (historical label: CertifiedSectorEngineId "bridge"; …)` in §18 but `IPD engine adapters + CertifiedSectorEngineId bridge (IPD WSD P11)` in the inventory.
- **Resolution.** The matrix preserves the **required inventory names exactly** (as instructed) and treats §18's longer labels as aliases. No status effect. The numbering is identical 1–51.

### D-10 — Historical test counts in older rows are stale but were true at their dates

- §18 rows quote `542/542` (IPD) and `87 files / 1,074–1,077` (IRR) at their own dates. Executed today: IPD **875 / 874 / 1 / 0**, IRR **1,197 / 1,197 / 0**. This is drift, not error; the current cells cite only today's executed figures, and older figures are labelled historical where quoted.

---

## D. Outstanding work and blockers

The list below is **not** a substitute for §H. It records what the matrix shows as unfinished, including items the tracker does not currently state accurately.

### O-01 — CAP-03: owner-data read path (rows 30, 31, 33)
- **Status / reason.** **BLOCKED.** Investigation complete (`CV-CORR-76`, §16.93); implementation not admitted. The ownership source is *designated* (Q1-b, 2026-10-22) but provably non-operational: zero `local_principal_bindings` rows, Gate A′ provisioning unreachable by construction, IRR precondition `IIPS_G3_IPC_BINDING_PROVISIONED` defaults `false`.
- **Dependency / authority boundary.** Four separate PA determinations are open: **DR-1** successor provisioning basis (the IPD successor Gate A′ act is `PROPOSED — NOT EFFECTIVE`), **DR-2** contract field set (7 fields + 3 renames), **DR-3** `durability`/`durable` vocabulary, **DR-4r** `G2Contribution` consumer policy (the IPD schema half is closed by migration `004`).
- **Closure condition.** Effective DR dispositions → Gate A′ execution → IRR precondition → Gate 4 `QE-1`/`QE-8`/`QE-11` → separate result-acceptance act → Gate 5 admission naming route/method pairs.
- **Evidence needed next.** The rendered DR determination itself; nothing technical blocks it.
- **Authorization.** **Requires a decision.** Not authorized for implementation.

### O-02 — Gate 4 target-host qualification (rows 28, 30, 45)
- **Status / reason.** **NOT STARTED — `QE-1`…`QE-11` at `0/11`.** No effective Gate 4 act exists.
- **Dependency.** An effective Gate 4 act, and the proposal's pins refreshed: its IPD pin `1cceacff…` is now **37** documentation-inclusive commits behind `ddaaef98…` (33 source-relevant to `bb4101b5…`), and its IRR consumer pin predates the current `ipcPortAdapter.ts`. No silent re-pin is permitted (§14.5).
- **Closure condition.** Executed `QE-1`…`QE-11` on the named non-production host with immutable evidence.
- **Evidence needed next.** The Gate 4 determination with fresh pins.
- **Authorization.** **Requires a decision.**

### O-03 — IPD durable broker-import boundary is not wired (row 28)
- **Status / reason.** **IMPLEMENTED, NOT INTEGRATED.** `src/persistence/brokerImportPersistence.ts` exists on `main` but its **only** importer is `tests/q1_broker_import_durability.test.ts`; `src/ipc/dispatch.ts` imports `portfolio_store.js` and refuses all four writes with `WRITE_NOT_AUTHORIZED`.
- **Dependency.** A **write-slice** authorization (W-1 conjunction) and Gate 4 qualification; G-2 §2/§8 keep the chain as the baseline to extend, not reimplement.
- **Closure condition.** An authorized consumer edge + qualification + a write act.
- **Evidence needed next.** A bounded write-slice act naming the operation.
- **Authorization.** **Not authorized.** New finding; not represented in the tracker as such.

### O-04 — `D115` boundary has no consumer (row 22 / CV-43)
- **Status / reason.** **IMPLEMENTED, NOT INTEGRATED.** Zero non-test references (re-verified).
- **Dependency.** No authorized completion path: `D-2` Option B keeps identity domain-scoped, so a universal authority is not to be built.
- **Closure condition.** A product decision to either compose it into a route or retire it.
- **Authorization.** **Requires a decision.** The tracker records it as OPEN with no path.

### O-05 — Reports (rows 35, 36, 37 / CV-21, CV-51)
- **Status / reason.** **BLOCKED.** Domain absent from `main`; fence `98147054…` intact; 10 implementation files exist only on branch refs (`4906a6b`, `6a8afbb`); no Reports UI or `/reports` route anywhere on `main`.
- **Dependency.** `REG-11` Option C deferral; R1 (ownership source) and R2 (contract shape) undecided; `H-4`/`H-16` conflict unresolved.
- **Closure condition.** `R1`, `R2`, `R3`, `F-7` satisfied in order by separate acts.
- **Authorization.** **Requires a decision.** Do not build a UI or lift the fence first.

### O-06 — G24 / CV-52 admission (row 32)
- **Status / reason.** **BLOCKED / REFERENCE ONLY.** Ancestry re-verified: `6828155e…`, `c1b955b4…`, `2ded0e98…` all off `main`.
- **Dependency.** The seven-step chain in §16.81.8 (IPD publication → Gate 4 act → host QE run → acceptance → contribution-schema act → envelope-gap act → Gate 5).
- **Authorization.** **Requires a decision.** Not initiated.

### O-07 — TD-7b production data-directory profile (row 39 / CV-24)
- **Status / reason.** **DEFERRED.** `TD-7a` works under `IIPS_DATA_DIR`; `TD-7b` and `F6_INVENTORY_AUTHORIZED` undecided.
- **Closure condition.** A dated profile decision.
- **Authorization.** **Deferred by decision.**

### O-08 — Dual IPD package pin (row 45 / D-02)
- **Status / reason.** **NEW.** The unguarded `iips-broker-import` alias at `70b24f02…` feeds every build/test invocation.
- **Closure condition.** Re-pin, guard, or retire.
- **Authorization.** **Owner decision** (dependency hygiene; no architecture implication).

### O-09 — Runbook drift (row 47 / D-03)
- **Status / reason.** Three stale figures (pin, test count, bundle size).
- **Closure condition.** Documentation re-stamp.
- **Authorization.** **Authorized** (routine documentation within standing grant); not performed in this pass to keep it a pure assessment.

### O-10 — PR #204 closure (row 48)
- **Status / reason.** Superseded disposition recorded, PR still open.
- **Closure condition.** Close with a supersession reference.
- **Authorization.** **Authorized** (routine); not performed here.

### O-11 — D05 governed-universe widening (row 41 / CV-22)
- **Status / reason.** **DEFERRED — not accepted, not rejected.** 13-row universe preserved.
- **Closure condition.** Identity/eligibility contract, roster/corpus revision, IRR identity mapping, consumer acceptance criteria, separate implementation authority.
- **Authorization.** **Deferred by decision.**

### O-12 — Rows with no path and no work (recorded, not pending)
- Row 8 (`A6-IMPL-10` producer convergence) — accepted deferral, recorded FINAL for this product.
- Rows 14/16/21/23/33/40/44/51 — closed by dated decision or express exclusion.
- Rows 42/43 — historical platform baselines; no product work.
- Row 34 — correct behaviour; no action.

---

## E. Summary of current state

### E.1 Disposition counts (computed from §H, one bucket per row)

| Bucket | Rows | Row numbers |
|---|---|---|
| **ACCEPTED — current non-production scope** | **26** | 1–7, 9–13, 15, 17–20, 24–27, 31, 38, 46, 49, 50 |
| **ACCEPTED — with open follow-up / deferred slice** | **4** | 39, 45, 47, 48 |
| **DEFERRED by dated decision** | **3** | 8, 29, 41 |
| **OUT OF SCOPE / CLOSED by decision** | **8** | 14, 16, 21, 23, 33, 40, 44, 51 |
| **BLOCKED** | **3** | 30, 32, 35 |
| **IMPLEMENTED — not integrated/qualified** | **2** | 22, 28 |
| **BRANCH-ONLY — not on `main`** | **2** | 36, 37 |
| **HISTORICAL / SOURCE-REPORTED baseline** | **2** | 42, 43 |
| **VERIFIED — correct behaviour, no release action** | **1** | 34 |
| **Total** | **51** | 1–51 |

**Counting rules.** (1) Exactly one bucket per row, by the strongest state actually evidenced. (2) "Accepted" requires a named accepting authority in an effective record — never a merge, a green CI run or an implemented feature. (3) A dated exclusion outranks "not built". (4) Branch-only work never counts as `main` state. (5) `SOURCE-REPORTED` never counts as `V`. (6) Terminal/closed-by-decision rows are counted separately from blocked rows so "blocked" means *work waits on something*, not *the question is closed*.

### E.2 Dimension-level counts (defined separately; do not sum to 51 across dimensions)

| Dimension | V | P | NOT SATISFIED / NOT AUTHORIZED | DEFERRED | OOS | NA | NP/NI/NW | SOURCE-REPORTED | VP/EP/EM/AP/UR/BL |
|---|---|---|---|---|---|---|---|---|---|
| Existence | 42 | 3 | – | – | – | 2 | 4 (NI) | – | – |
| Authority | 36 | – | 1 | 3 | 5 | 1 | – | – | 4 AP + 1 TD-7b |
| Integration | 29 | 5 | – | – | – | 6 | 11 (NI) | – | – |
| Wiring | 28 | 1 | – | – | – | 10 | 8 NW + 4 NI | – | – |
| Data | 17 | 16 | – | – | – | 17 | 1 BL | – | – |
| Persistence | 9 | 1 | – | – | – | 38 | 2 NP | – | 1 UR |
| Recovery | 7 | 1 | – | – | – | 39 | 1 NP | 2 | 1 VP |
| Validation | 38 | 1 | – | – | – | 7 | – | 4 | 1 VP |
| E2E | 7 | 17 | – | – | – | 18 | – | 2 | 5 EP + 2 VP |
| Evidence | 48 | – | – | – | – | – | – | 2 | 1 EM |
| Governance | 47 | 1 | – | – | – | – | – | – | 2 AP + 1 UR |
| Acceptance | 30 (+1 with follow-ups) | 1 | 8 | 2 | 4 | 4 | – | – | – |
| Qualification | 26 | 1 | 4 | – | 1 | 16 | – | – | 3 VP |
| Release-readiness | 21 | 14 | – | 1 | 4 | 4 | 5 NI + 2 BL | – | – |

### E.3 What the counts mean

- **Implementation is broad; acceptance is narrower than implementation.** 42 capabilities have a verified existence on the authoritative ref, but only 30 have a verified acceptance, and only 7 have verified E2E.
- **The durable owner-data story is the concentrated weak point.** All three BLOCKED rows (30, 32, 35) and the two "implemented but unqualified" rows (22, 28) sit on or beside that chain. Nothing was accepted for durable owner data in this pass.
- **E2E is the least-evidenced dimension that matters.** 17 rows are `P` (component/route-level only) and 5 are `EP`; the only `V` E2E cells are the live HTTP seam (20), the fail-closed fences (34), the restart recoveries (38/39), the reports fence (35), and the screener/adapter paths (8).
- **Nine rows are deliberately not work.** The 8 OOS/closed-by-decision rows plus row 34 exist so nobody re-opens a settled question; they are not "missing capability".
- **No row in this matrix is release-ready for production.** `durable:true`, production eligibility and Gate 5 remain non-grants; the 26 accepted rows are accepted **for the current non-production scope only**.

---

## F. Completeness and consistency checks (executed)

| Check | Method | Result |
|---|---|---|
| Exactly 51 rows | programmatic count over the data source | **51** |
| Numbering contiguous 1–51 | list equality against `range(1,52)` | **PASS** |
| Capability names match the required inventory | names copied verbatim from the prompt; §18 aliases noted in D-09 | **PASS** |
| 17 headers, exact order | header list compared element-by-element | **PASS** |
| Every row has all 15 assessment dimensions | 18-field tuple length check per row | **PASS** (51/51) |
| No fabricated status | every `V` cell traceable to an executed check or a direct read in this session; every non-`V` cell tied to a record or an absence verified | **PASS** |
| `NA` justified | each `NA` cell carries its rationale inline | **PASS** |
| Branch-only / proposed / deferred / blocked distinguishable | dedicated tokens (`BRANCH-ONLY`, `DEFERRED`, `BL`, `PROPOSED`, `NOT AUTHORIZED`) | **PASS** |
| Report and matrix agree | both generated from one data source (`matrix_data`), no hand-edited copy | **PASS** |
| Counts reconcile with rows | E.1 buckets sum to 51; each row appears once | **PASS** |
| No implied authority grant / acceptance / qualification / release | every acceptance cell names its record or states `NOT SATISFIED`; §E.3 states the production non-grant | **PASS** |
| CSV ↔ report matrix identical | row-by-row diff of the generated CSV against the table in §H | **PASS** (see §G) |
| XLSX ↔ CSV identical | cell-by-cell comparison of the "51x17 Matrix" sheet | **PASS** — all 867 text cells identical; the `#` column is stored as a number in XLSX and a string in CSV (semantically identical) |

---

## G. Publication and verification

**Location.** Published to the IPD repository `ramkivs/iips-production-market-data` under `evidence/cross-repository/`, which is the repository's established location for cross-repository program records (it already holds the CAP-02/B-1R, Gate 3 and DEC-06 cross-repository records). The IRR master tracker's §18 remains the program's matrix of record; this reconstruction is published alongside the IPD evidence set and cross-referenced from `evidence/cross-repository/`.

**Why not IRR.** This session is anchored to the branch `arena/da79277e-iips-production-market-data` of IPD. Writing to IRR would require creating refs in a second repository outside that boundary, so IRR was investigated read-only. Consequently **the IRR master tracker was not modified** in this pass; the exact §18/CV-05 edits implied by §C are specified here as the corrective action for the next authorized IRR pass. This is stated rather than silently skipped.

**Why not a tracker rewrite.** §18's own reading rules and `CV-CORR-*` practice preserve dated records and add overlays rather than overwriting history. This record therefore does not rewrite prior values; it re-derives them and lists the deltas.

**Coordinates.** Commit, blob, size and SHA-256 values for each artifact are recorded in the companion receipt `artifacts/IIPS_V3_CAPABILITY_MATRIX_51x17_PUBLICATION_RECEIPT_2026-10-23.md`, added in a **separate commit** so the artifacts are hashed and then left byte-identical (a file cannot contain its own hash).

---

## H. The matrix — 51 capabilities × 17 dimensions

**Vocabulary.** `V` VERIFIED (executed or directly inspected in this 2026-10-23 investigation) · `P` PARTIAL · `I` IMPLEMENTED · `NI` NOT INTEGRATED (exists, no consumer) · `NW` NOT WIRED · `NP` NOT PERSISTED · `VP` VALIDATION PENDING · `EP` E2E PENDING · `EM` EVIDENCE MISSING · `AP` AUTHORITY PENDING · `BL` BLOCKED · `UR` UNRESOLVED · `NA` NOT APPLICABLE (rationale in cell) · `OOS` OUT OF SCOPE by express or dated decision · `DEFERRED` deferred by dated decision · `NOT SATISFIED` a named bar exists and is not met · `NOT AUTHORIZED` express prohibition · `SOURCE-REPORTED` asserted by a prior record, **not** re-executed here · `BRANCH-ONLY` present only off `main`.

**Cell rule.** Each cell judges one dimension only. A `V` existence cell never implies integration, wiring, validation, E2E, acceptance or release. IPD paths are prefixed `ipd:`; all other paths are IRR-relative from the repository root. Row-level `NA` for `Persistence`/`Recovery` means the capability holds no state a restart could lose — it is not a missing check.

| # | Capability (owner) | Existence | Authority | Integration | Wiring | Data | Persistence | Recovery | Validation | E2E | Evidence | Governance | Acceptance | Qualification | Release-readiness | Evidence Anchor |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Executive dashboard + certified executive DTO (IRR) | V — `ExecutiveDashboard.tsx` + `App.tsx` `/executive` on IRR `main`. | V — CV-01/CV-02 accepted; no gate applies. | V — consumes `/api/executive` certified DTO; no other dependency. | V — live probe 2026-10-23: `GET /api/executive` `200`, 13 holdings. | P — frozen `SNAPSHOT` reference analytics; not live market data. | NA — read-only surface holds no state. | NA — nothing to recover across a restart. | V — executed this pass: full IRR suite 98 files / 1,197 tests / 0 failed; `tsc` 0. | P — server-route E2E executed here; no browser/operator run in this pass. | V — present and re-read at `4740ba21`; independent of any branch. | V — CV-01/CV-02 recorded; no open act. | V — accepted (CV-01/CV-02). | V — qualified within the accepted non-production scope. | V for non-production use; production eligibility `NOT AUTHORIZED`. | `frontend/src/features/executive/**`, `frontend/server/executive-transport.ts:955`; live probe; V2–V6 |
| 2 | Portfolio workspace + certified reference holdings read (IRR) | V — `PortfolioWorkspace.tsx`, `/portfolio` + `/portfolio/:id/holdings`. | V — CV-01/CV-02; §G-2 §1 separates reference from owner data. | V — reads `/api/portfolio`; owner-portfolio path is a different, fenced capability (row 30). | V — live probe `GET /api/portfolio` `200` (`PF-REAL`, 13 holdings). | P — 13-row governed reference baseline; not the owner's holdings. | NA — read-only. | NA — stateless. | V — executed full suite + live route probe. | P — route-level only; no operator browser run. | V — on `main`; probe transcript recorded in this report. | V — CV-02 accepted. | V — CV-01/CV-02. | V — within non-production scope. | V for reference portfolio; owner-data release remains blocked (row 30). | `frontend/src/features/portfolio/**`; `App.tsx:41-43`; `/api/portfolio` live `200`; V6 |
| 3 | Research — company intelligence (IRR) | V — `CompanyIntelligence.tsx`; `/research/company/:id`. | V — CV-02 accepted; `:id` is a SECTOR reference, recorded. | V — `/api/company/:id`. | V — live probe `GET /api/company/banking` `200` (`Banking-H1`, verdict Watch, composite 47.1). | P — frozen engine snapshot per sector. | NA — read-only. | NA — stateless. | V — executed suite; live `200`. | P — server-route evidence only. | V — on `main`. | V — CV-02. | V — CV-02. | V. | V for non-production reference use. | `frontend/src/features/company/**`; `/api/company/:id` live `200`; V6; CV-02 |
| 4 | Research — sector surface (IRR) | V — `SectorIntelligence.tsx` + 12-test suite on `main`. | V — `PKG-08-ROW4-IMPL-AUTH-01`; contract approval `PKG-08-ROW4-CONTRACT-PROPOSAL-APPROVAL-01`. | V — composes five existing governed reads; adds no endpoint/DTO. | V — `/research/sector/:id` mounted; sidebar child `/research/sector/Banking` in `AVAILABLE_CHILD_PATHS`. | V — governed sector reference only; unavailable values render as unavailable. | NA — read-only. | NA — stateless. | V — component suite + `App.test.tsx`; executed in the 1,197-test run. | P — server-level E2E for the five endpoints; no browser/Windows run (AC-14…AC-17 operator-owned). | V — `evidence/integration/sector-surface-row4-2026-10-20/`. | V — implementation and contract authority recorded. | V — accepted for the bounded row-4 scope. | V — bounded technical qualification recorded. | P — shippable in non-production; production not claimed. | `frontend/src/features/sector/**`; `evidence/integration/sector-surface-row4-2026-10-20/`; §16.63 |
| 5 | Cross-sector intelligence pipeline (IRR + platform) | V — `CrossSectorIntelligence.tsx`; `iips-cross-sector/*`; CSIP certificates. | V — CV-02; v1.1 Track 2 certificate. | V — consumes `/api/cross-sector`; platform consumed in-process. | V — live probe `GET /api/cross-sector` `200` (avgConviction 72.9). | P — frozen baseline. | NA — read-only. | NA — stateless. | V — IRR suite executed; platform/cross-sector suites not re-run this pass. | P — IRR route proven; platform-level chain source-reported. | V — certificates present on `main`. | V — Track 2 certification recorded. | V — CV-02 accepted. | V — v1.1 Track 2 (source-reported, not re-executed). | V for non-production. | `iips-cross-sector/CSIP_*`; `program-v1.1-certification/PROGRAM_v1.1_TRACK2_*`; live probe |
| 6 | Engine registry + engine execution surface (IRR + platform) | V — `EngineRegistry.tsx`; `/research/engines`; 13 engines. | V — CV-02; PKG-01 record. | V — `engine-transport.ts` over the governed runtime. | V — live: `GET /api/engines` `200`; `POST /api/engines/sector.banking/execute` `200` `COMPLETED` (snapshot ref returned). | P — frozen baseline; execution returns certified snapshot refs. | NA — no durable execution history on this surface. | NA — stateless. | V — composed-route certification suite; executed in full run. | P — server-level; no browser acceptance. | V — `server/live/engine-execution-live-certification.test.ts`; live probe. | V — certified-engine registry is governed. | V — CV-02. | VP — no browser/production qualification. | P — local/non-production certified only. | `App.tsx:44`; `frontend/server/engine-transport.ts`; `server/live/engine-execution-live-certification.test.ts` |
| 7 | Governed Screener — N4 certified producer (IRR) | V — `Screener.tsx`; `server/screener/screener-transport.ts`. | V — REG-07/08/09 acceptance; CV-03. | V — `runGovernedScreen` over 13 sector producers; also consumed by replay. | V — live `POST /api/screener` `200`: 13 population / 13 matched / `COMPLETED`, evaluator `NP12-SCREEN-EVALUATOR`. | V — 13 server-derived governed members; client `members` rejected `422`. | NA — executions are returned, not archived on this route. | NA — stateless request path. | V — executed: live probe + transport suite; `POST {}` → `400 missing-definition` (fail-closed). | P — real composed HTTP; no browser run this pass. | V — acceptance records; live probe transcript. | V — CV-03 / REG-07-09. | V — accepted. | V — qualified non-production. | V for non-production governed use. | `server/screener/*`; live POST `200` (13/13); `IIPS_v3.0_NP12_GOVERNED_SCREENER_*` |
| 8 | NP-12 producer convergence `A6-IMPL-10` (IRR) | P — accepted adapter path only; producer not converged. | DEFERRED — Option B stands; REG-13 finality line (2026-10-21). | P — screener runs on the adapter, not a converged producer. | NA — no separate route. | V — governed member inputs are produced. | NA — no state. | NA — stateless. | V — adapter path covered by the executed screener suite. | V — screener E2E proven through the adapter. | V — `NP-12-N4-A9-*`; REG-13. | V — deferral is the accepted disposition, recorded FINAL. | DEFERRED — not an acceptance. | NA — no convergence qualification. | NA — the deferral is the release position. | `NP-12-N4-A9-IMPLEMENTATION-AUTHORITY-DECISION.md`; REG-13; CV-40 (closed) |
| 9 | Watchlists (IRR + Class-C journal) | V — `Watchlists.tsx`; `server/watchlists/*`. | V — CV-04 (F-1/F-2/F-3 + Class-C); NP-09 owner designation. | V — journal-backed service; governed universe provider. | V — `/watchlists`; `/api/watchlists` present. Live probe returned `503` because no owner-context carrier exists in this sandbox (by design). | P — only the 13 governed rows resolve; others `404 governed-row-not-found`. | V — append-only NDJSON + rebuildable index under `IIPS_DATA_DIR`. | V — EXECUTED 2026-10-23: `consumer-restart-read.test.ts` row-9 cycle passes across two real OS processes. | V — executed: restart suite 3/3 + full 1,197-test run. | P — separate-process consumer proof executed; browser E2E not re-run. | V — on `main`; restart transcripts cited. | V — CV-04 accepted. | V — CV-04. | V — qualified non-production. | V for non-production owner-scoped use. | `server/watchlists/**`; `server/persistence/*`; executed `consumer-restart-read.test.ts` (row 9) |
| 10 | Collaboration (IRR + journal) | V — `Collaboration.tsx`; `server/collaboration/*`. | V — CV-04; NP-10 designation. | V — journal-backed resolvers. | V — `/collaboration`; `/api/collaboration` present (`503` without carrier, as designed). | V — threads, anchors, NS-5 vintage pins, comments. | V — Class-C journal. | V — EXECUTED 2026-10-23: row-10 cycle recovered in a new process (thread, anchor, vintage pin, comment). | V — executed restart suite + full suite. | P — consumer-level process proof; no browser run. | V — on `main`. | V — CV-04. | V — CV-04. | V. | V for non-production. | `server/collaboration/**`; executed `consumer-restart-read.test.ts` (row 10) |
| 11 | Settings incl. reset (IRR + journal) | V — `Settings.tsx`; `server/settings/*`. | V — CV-04; NP-11 designation. | V — journal-backed settings service. | V — `/settings`; `/api/settings` + `/api/settings/reset` present (`503` without carrier). | V — theme/settings values with revision history. | V — Class-C journal; reset recorded as a new revision. | V — EXECUTED 2026-10-23: surviving update AND reset recovered in a new process. | V — executed restart suite + full suite. | P — consumer-level process proof; no browser run. | V — on `main`. | V — CV-04. | V — CV-04. | V. | V for non-production. | `server/settings/**`; executed `consumer-restart-read.test.ts` (row 11) |
| 12 | Owner-context carrier + fail-closed owner fence (IRR) | V — `owner-context-carrier.ts`, `owner-context-resolver.ts`, `owner-context-unavailable.ts`. | V — F-1/F-2/F-3 acts; P-2 in-scope closure (CV-10). | V — governs every owner-scoped route; no request-supplied identity accepted. | V — resolved per request; live probes show `503` when the carrier is absent. | V — 363-byte carrier with pinned SHA-256; fixed owner/domain pair. | V — carrier file + journal under `IIPS_DATA_DIR`. | V — resolved per request, uncached; restart harness present. | V — carrier/resolver/restart tests in the executed suite. | P — proven at route and process level; browser acceptance recorded historically. | V — `evidence/integration/gate-c-p2-establishment-2026-10-14/`. | V — §15 in-scope closure. | V — CV-10. | V — in-scope only. | V — correct fail-closed behaviour, not a defect. | `server/owner-context-*.ts`; live `503` probes; `cb8db45d…`; §15.19–15.22 |
| 13 | Evidence landing + explorer (IRR) | V — `EvidenceLanding.tsx`, `EvidenceExplorer.tsx`. | V — CV-01/CV-02; NP-13. | V — `/api/evidence/:id`. | V — live `GET /api/evidence/banking` `200` (`referenceOnly:true`). | V — evidence payloads from the certified run. | NA — read-only. | NA — stateless. | V — executed suite + live probe. | P — route-level; no browser run. | V — on `main`. | V — NP-13 decision. | V — CV-01/CV-02. | V. | V for non-production. | `App.tsx`; live `/api/evidence/banking` `200`; `IIPS_v3.0_NP13_*` |
| 14 | Evidence snapshots surface (platform + IRR route) | V — platform `SnapshotStore` exists; IRR route is a reserved placeholder. | OOS — PKG-08 Option A (2026-10-20): API-only, not a separate product surface; any future UI is a NEW item. | P — consumed by platform runtimes only; no IRR listing API. | NW — `/evidence/snapshots` reserved unavailable (NP-13 D5/IB-4). | V — platform objects only; not Stage A captures. | UR — platform durability is not an IRR product requirement. | NA — no IRR surface to recover. | V — reserved-route tests pass in the executed suite. | NA — no workspace exists. | V — PA disposition record on `main`. | V — Option A effective (merged). | OOS — no acceptance claimed or required. | NA. | NI — deliberately not shipped. | `evidence/integration/2026-10-20`; `IIPS_v3.0_PKG08_ROWS_14_16_OPTION_A_PA_DISPOSITION_2026-10-20.md`; §16.66 |
| 15 | Evidence replay + v1.1.0 Replay Baseline (IRR) | V — `ReplayExplorer.tsx`; `server/replay/*`; v1.1 replay baseline. | V — Stage A implementation/admission directives; §16.64 acceptance; v1.1 baseline unchanged. | V — independent saved-input screen evaluation; no producer on replay. | V — `/evidence/replay/:id`; live `/api/replay/banking` `200` with `original:null`, `NOT_PERFORMED` (correct sector-reference semantics). | V — exact retained original context; manual replay of retained UUIDs. | NP — process-local retention only; no durable archive. | VP — restart recovery deliberately deferred. | V — executed: replay application/transport/UI suites in the 1,197-test run. | P — composed TCP + client HTTP in jsdom; no real-browser run. | V — Stage A acceptance record. | V — §16.63/§16.64 acts. | V — accepted for Stage A scope (does not extend to rows 14/16). | V — bounded technical qualification recorded. | P — non-production only; durable history not claimed. | `server/replay/**`; `IIPS_v3.0_STAGE_A_EVIDENCE_SNAPSHOT_REPLAY_PA_ACCEPTANCE_DECISION_2026-10-20.md`; live probe |
| 16 | Replay landing route (IRR) | P — reserved placeholder (intentional). | OOS — PA Option A (2026-10-20): direct-ID, no landing product. | NI — no landing consumer. | NW — bare `/evidence/replay` reserved unavailable; `/evidence/replay/:id` is row 15. | NA — no landing data contract. | NA. | NA. | V — reserved-route/shell tests pass. | NA. | V — Option A record on `main`. | V — NP-13 D5/IB-4 affirmed. | OOS — none claimed. | NA. | NI — not a shipped landing. | `App.tsx` reserved route; `IIPS_v3.0_PKG08_ROWS_14_16_OPTION_A_PA_DISPOSITION_2026-10-20.md`; CV-41 |
| 17 | Decision matrix (IRR) | V — `DecisionMatrix.tsx`. | V — CV-02. | V — `/api/decision-matrix` over certified axis scores. | V — live `GET /api/decision-matrix` `200`. | P — derived from the frozen baseline. | NA — read-only. | NA. | V — executed suite + live probe. | P — route-level only. | V — on `main`. | V — CV-02. | V — CV-02. | V. | V for non-production. | `App.tsx`; `/api/decision-matrix` live `200`; CV-02 |
| 18 | AI advisory over certified results (IRR) | V — `AiAdvisory.tsx`; `server/ai-advisory-transport.ts`. | V — CV-02; PKG-01 record. | V — reads stored certified engine results only; no provider call. | V — live `GET /api/ai-advisory/banking` `200` (non-authoritative advisory text). | P — scoped to stored engine results. | NA — no advisory history persisted. | NA. | V — transport + live-certification suites in the executed run. | P — server-level; no browser acceptance. | V — `server/live/ai-advisory-live-certification.test.ts`. | V — non-authoritative boundary is explicit in the payload. | V — CV-02. | VP — no formal qualification of the advisory path. | P — non-production advisory only; never certified output. | `server/ai-advisory-transport.ts`; live `200`; `server/live/ai-advisory-live-certification.test.ts` |
| 19 | Macro / D08 guarded read — NAS, CPI, IIP (IRR) | V — `MacroResearch.tsx`, `MacroSourceDisclosure.tsx`; `server/macro/*`. | V — D89 UI authority (PR #100); D91 §1 notice (PR #109); V-C6/L-3 acts. | V — MoSPI source adapter; NAS/CPI/IIP boundary enforced exactly. | V — `/research/macro` routed; live `GET /api/macro/NAS?indicatorCode=1` → `502 RETRY_BUDGET_EXHAUSTED` (no egress from this sandbox — the documented refusal path). | P — provider-sourced non-production; entitlement `B — PARTIALLY ESTABLISHED`; CPI null-`index` rows accepted as upstream characteristic. | NA — read-only, no persistence. | NA. | V — macro/mospi/TLS/UI suites in the executed 1,197-test run. | P — live-source E2E `A — ESTABLISHED` only on operator-transferred Windows evidence; not reproducible here (egress). | V — Windows transcripts + published evidence files. | V — multiple effective acts. | V — accepted for the D89 display contract. | V — non-production qualification recorded. | P — non-production; provider entitlement not fully established. | `server/macro/**`; `frontend/src/features/research/Macro*`; §16.29–16.35; live `502` refusal |
| 20 | PIT read seam + `/api/pit/market-data` (IRR ↔ IPD, Gate 43) | V — `server/pit/*` (adapter, boundary, contract, port) on `main`. | V — CV-05 narrow admission; Gate 43 / REG-02. | V — bound to the pinned IPD package `2d9130e7…` (pin moved from `2e11fa3b…`; guarded by the package-consumer test). | V — live `GET /api/pit/market-data?...ISIN:INE665A01038:BL...` → `200 found:true`, `resolvedAsOf 2026-02-10`, `dataVersion np-d01-bl-2`; wrong identity → `404 NOT_FOUND`. | P — D114 non-production population; `isinAuthority: NON_AUTHORITATIVE`. | NA — read-only seam. | NA. | V — executed boundary + runtime-integration suites; live probe. | V — real HTTP client -> IPD `PitReadService` -> store, executed. | V — transcript in this report; IPD `evidence/d114`. | V — CV-05 / REG-02. | V — admitted narrowly (5 files). | V — non-production read qualification. | V for the read seam only; `/api/pit/company/:companyId` stays unadmitted. | `server/pit/**`; `frontend/package.json` pin `2d9130e7…`; live `200 found:true` |
| 21 | PIT UI surface (IRR) | NI — no `pit` feature directory exists on `main`. | OOS — CV-32 CLOSED 2026-10-18 (API-only); any panel is a NEW work item. | NI — no consumer. | NW — no route. | NA. | NA. | NA. | NA — nothing to validate beyond absence. | NA. | V — `evidence/integration/cv32-pit-disposition-2026-10-18/`. | V — CV-32 disposition. | OOS — none claimed. | NA. | NI. | `evidence/integration/cv32-pit-disposition-2026-10-18/`; absence verified by directory census 2026-10-23 |
| 22 | D115 runtime CompanyId boundary (IRR) | V — `server/d115-runtime.ts` + tests on `main`. | V — D115 authority acts; CV-43 recorded. | NI — zero consumers (re-verified 2026-10-23: no non-test reference). | NW — no route composes it. | NA — boundary asserts identity, holds no data. | NA. | NA. | V — `d115-runtime.test.ts` in the executed suite. | NA — nothing to exercise end to end. | V — census re-executed this pass. | V — CV-43 open with no authorized completion path. | NA — no acceptance sought. | NA. | NI — not a product surface today. | `frontend/server/d115-runtime.ts` + `.test.ts`; `NP-08-D115-D2-G2-RECONCILIATION-ACT.md`; CV-43 |
| 23 | Universal Company identity / tenant authority (IRR + IPD) | NA — not to be built at this time. | V — `D-2` Option B adopted (domain-scoped identity). | NA. | NA. | NA. | NA. | NA. | NA. | NA. | V — decision record on `main`. | V — D-2 is effective. | V — the decision itself is accepted. | NA — not a capability to qualify. | NA — deliberately absent, not an open gap. | `docs/integration/IDENTITY-TENANT-DOMAIN-SCOPE-DECISION.md`; `d115-runtime.ts` header; `D-2-IDENTITY-TENANT-DOMAIN-SCOPE-DECISION-01` |
| 24 | Intelligence destination surface (IRR) | V — `IntelligenceOpportunities/Risks/Rankings.tsx` + tests on `main`. | V — bounded NP-18 main-admission decision (2026-10-16). | V — three views over existing governed reads; no new endpoint. | V — `/intelligence/{opportunities,risks,rankings}` routed; parent stays group-only. | V — derived from certified results only. | NA — read-only. | NA. | V — 32 view tests + full suite executed. | P — jsdom/route-level; no operator browser acceptance claimed. | V — §16.38 merge/qualification evidence. | V — isolated-integration authorization. | P — bounded non-production admission only. | V — bounded qualification recorded. | P — `/intelligence` splat remains a placeholder. | `frontend/src/features/intelligence/**`; `App.tsx`; §16.38; NP-18 records |
| 25 | IPD security master + instrument identity mapping (IPD P04/D05) | V — `src/identity/*` (security_master, mapping_store, governed_fixture_master, d05_*). | V — `AD-01..AD-18`; `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001`. | V — consumed by the IPD shell and engine adapters. | V — `SecurityMasterSurface.tsx` imports `src/identity/index.js`. | P — 2,250 canonical entities: 52 real + 2,198 synthetic (XV-9). | NA — build-time constant asset. | NA. | V — IPD `npm test` executed 2026-10-23: 875 tests / 874 pass / 1 skip / 0 fail. | VP — no cross-repository product E2E. | V — checksum/evidence on `main`. | V — act recorded. | V — inside the `program-v1.2.0` tag. | V — P04 qualification recorded. | P — library/offline scope only. | `src/identity/**`; `frontend/src/features/security-master/SecurityMasterSurface.tsx`; IPD 875-test run |
| 26 | IPD engine adapters + `CertifiedSectorEngineId` bridge (IPD WSD P11) | V — `src/engine_adapters/*` incl. `namespace_guard.ts`, `frozen_engines.ts`. | V — PA-selected bounded P11 library scope (§16.65). | V — in-process IPD library only; no IPD->IRR invocation. | NA — bounded scope requires no IPD HTTP service. | V — certified adapter outputs. | NA. | NA. | V — `tests/wsd_p11_engine_adapters.test.ts` in the executed 875-test run. | NA — bounded library acceptance only; product E2E not claimed. | V — §16.65 reconciliation + executed suite. | V — bounded acceptance disposition. | V — bounded library acceptance only. | V — for the bounded library claim. | V — for the bounded library scope. | `src/engine_adapters/**`; `tests/wsd_p11_engine_adapters.test.ts`; `IIPS_v3.0_P11_ROW26_BOUNDED_LIBRARY_ACCEPTANCE_PA_DISPOSITION_2026-10-20.md` |
| 27 | IPD offline shell (data plane + UI) | V — `frontend/src/app/App.tsx` with ~39 route entries; many `*Structural` surfaces. | V — CV-06/CV-07. | V — fixture masters + fail-closed `UnavailableSurface`. | V — routes present; server-coupled surfaces intentionally unavailable. | V — fixture masters. | NP — no durable sink required or provided for the shell. | NP. | V — IPD build + 875-test run executed this pass. | SOURCE-REPORTED — Windows-only visual acceptance (2026-09-23). | SOURCE-REPORTED — `windows-acceptance-evidence/`. | V — CV-07. | V — CV-06/CV-07. | V — structure-only qualification. | P — offline shell only. | `frontend/src/app/App.tsx`; `windows-acceptance-evidence/WINDOWS-FULL-SHELL-VISUAL-ACCEPTANCE-20260923.md` |
| 28 | Broker ingestion chain (IPD) | V — adapters, format detector, mapper, ingress, view model, `PortfolioStore`; durable boundary `src/persistence/brokerImportPersistence.ts`; `PortfolioWorkspace` + `BrokerImportModal`. | V — `G-2` §2 baseline to extend; §8 forbids reimplementation. | P — durable broker-import boundary has NO production consumer: only `tests/q1_broker_import_durability.test.ts` imports it (verified 2026-10-23); not wired into `src/ipc/dispatch.ts`. | P — IPD modal reachable from IRR at `/user-portfolios/import`; save path returns `503`/`WRITE_NOT_AUTHORIZED`. | P — `BLOCK-3L` composition limits; mixed real/synthetic master. | P — implementation exists; not admitted; writes refused before mutation. | P — candidate-level restart/duplicate/refusal evidence only; no host qualification (QE-4/5/6 unexecuted). | V — IPD executed this pass: 875 tests incl. bi03/04/05/08 + q1 durability. | EP — real-process broker import on the deployment host not performed. | V — `evidence/bi0*`, `evidence/cross-repository/*`. | V — G-2 architecture accepted. | NOT SATISFIED — no product acceptance for the durable path. | NOT SATISFIED — Gate 4 qualification absent. | P — fail-closed; not releasable as a durable owner-data path. | `src/ingress/**`, `src/persistence/brokerImportPersistence.ts`, `tests/bi0*.test.ts`; IPD run 2026-10-23 |
| 29 | Operator Drop (IPD) | V — `src/operator_drop/{index,parser}.ts`. | DEFERRED — `REG-06` product admission withheld. | V — UI + non-production operator identity bypass. | V — reachable in the offline shell. | V — operator-supplied drop files. | NA — no durable sink in scope. | NA. | V — `tests/non_production_operator_identity_bypass.test.ts` in the executed run. | SOURCE-REPORTED — offline operator flow. | V — `evidence/operator_drop/*`. | V — REG-06 deferral recorded. | DEFERRED — not accepted. | NA. | DEFERRED — not actionable without a REG-06 change. | `src/operator_drop/**`; `evidence/operator_drop/NON_PRODUCTION_SINGLE_OPERATOR_IDENTITY_BYPASS.md`; REG-06; CV-39 |
| 30 | User-portfolio read surfaces — UI + typed client (IRR) | V — `UserPortfolioList/Detail/States.tsx`; `src/api/*`; `/user-portfolios`, `/user-portfolios/:portfolioId`. | V — `G-2` UI-consumer implementation authorization; Q1-b ownership source designated (2026-10-22). | NI — no live ownership source: IPD binding table has zero rows, Gate A′ provisioning unreachable. | V — routes mounted; all 12 `/api/user-portfolios*` method pairs return `503` (live probe confirms). | BL — no binding => no owner; no data path exists to exercise. | NA — fence returns before any store access. | NA. | V — 129/129 fence/adapter/transport tests executed 2026-10-23; 12/12 `503` pairs. | EP — impossible until a source is provisioned; no data-backed run. | V — `CV-CORR-62`/§16.81, re-verified here. | V — G-2 + Q1-b designation; admits no lineage. | NOT SATISFIED — no functional acceptance. | VP — requires Gate A′ execution, IRR precondition, envelope-gap act, then QE-1/8/11. | P — ships fail-closed and honest; not usable. | `frontend/src/features/user-portfolios/**`; `server/user-portfolio/**`; live `503`; §16.81 |
| 31 | `G-2` §5 HTTP contract + port + `D-2` §8 translation boundary (IRR) | V — `userPortfolioContract.ts`, `userPortfolioPort.ts`, `userPortfolioBoundary.ts`, `translationBoundary.ts` + tests. | V — CV-10 (P-2 in-scope closure); G-2 §5. | V — dispatched from `executive-transport.ts:767`. | V — route dispatch present; `503` path verified live. | NA — contract only; no data reaches it. | NA. | NA. | V — contract/port/boundary/translation suites executed (129/129 block). | V — `503` path verified over real HTTP. | V — blobs pinned; on `main`. | V — CV-10. | V — in-scope acceptance. | V — in-scope qualification. | V — as a fail-closed contract surface. | `server/user-portfolio/userPortfolioContract.ts` (`e6b57bb8…`); `user-portfolio-transport.ts` (`51704c12…`) |
| 32 | G24 durable store + IRR HTTP adapter (off-`main` lineages) | V — branch-only: IRR `470cc698…` on `origin/arena/a2df3b85-…`; IPD tags `iips-pin-g24-6828155e`, `iips-pin-np04-2e11fa3b`. | AP — main admission prohibited (`D-1` §12; G3-D5 REFERENCE ONLY). Verified 2026-10-23: `6828155e…`, `c1b955b4…`, `2ded0e98…` are NOT ancestors of IPD `main`. | NI — no consumer on `main`. | NW — no route. | P — branch SQL/SQLite membership + lifecycle only. | V — branch store (not on `main`). | SOURCE-REPORTED — G24 live suite 84/84; not executed here. | SOURCE-REPORTED — branch not executed this session. | EP — no product path. | V — blob/reachability census re-executed. | AP — separate CV-52 admission decision not initiated. | NOT SATISFIED. | NOT SATISFIED. | BL — reference-only; 7 prerequisite steps enumerated (§16.81.8). | IPD tags above + IRR `origin/arena/a2df3b85-…`; ancestry re-checked 2026-10-23; §16.93.5 |
| 33 | Owner→G24 binding chain `P-2` → `P-4` → `P-6` → `P-8` (IRR + IPD) | P — `P-2` trust anchor complete; `P-4` not done, `P-6` not granted, `P-8` not done. | OOS — `H-18` scope correction (enterprise auth excluded). | NI. | NI. | NA. | NA. | NA. | V — `P-2` trust anchor tests; deposit blob `5f58c7b9…`. | NA. | V — §15.19 + Gate C records. | V — `P-2` in-scope closure only. | NOT SATISFIED — and not pursued. | OOS — path closed, retained as history. | OOS — nothing downstream waits on it. | `IIPS_v3.0_GATE_C_P2_SCOPE_CORRECTION_AND_F5R_DISPOSITION_2026-10-14.md`; CV-50 (terminal) |
| 34 | Fail-closed `503` fences — `/api/user-portfolios*`, `/api/reports*` (IRR) | V — `user-portfolio-transport.ts`, `reports-transport.ts`, `owner-context-unavailable.ts`. | V — protected; only a Gate 5 act naming route/method pairs can lift them. | V — mounted in the composed server. | V — live probes: `/api/user-portfolios` `503`, `/api/reports/context` `503`, `/api/broker-import/p1/revision` `503` on 2026-10-23. | NA — unavailability is the design. | NA. | NA. | V — `fenceUnchanged.test.ts` 26 tests + live HTTP; blobs byte-identical. | V — real HTTP, 12/12 pairs. | V — `98147054…`, `51704c12…`, `cb8db45d…`, `e6b57bb8…` re-hashed this pass. | V — F-4/F-5 + Gate 3 act §5.6. | V — correct current product behaviour. | V. | V — no release blocker; the fence IS the shipped behaviour. | `git hash-object` at `4740ba21`: `98147054…`/`51704c12…`/`cb8db45d…`/`e6b57bb8…`; live `503` probes |
| 35 | Reports domain on `main` (IRR) | NI — removed by the R4-B act; only the fence + its tests remain on `main` (verified: no `server/reports/` directory). | AP — REG-11 Option C deferral; needs an ownership source and contract shape decision. | NI. | NW — `/api/reports/*` -> `503`. | NA. | NA. | NA. | V — `reports-api.test.ts` + `reports-transport.test.ts` pass (4 tests). | V — fence behaviour verified over real HTTP. | V — `GC-D1`…`GC-D6`. | V — `GC-D1`…`GC-D6`. | NOT SATISFIED. | NOT SATISFIED. | BL — own disposition path (CV-21/CV-51). | `frontend/server/reports-transport.ts` (`98147054…`); REG-11; executed reports tests |
| 36 | Reports implementation lineage (branch-only) | V — 10 files under `frontend/server/reports/` exist on `origin/promotion/governed-reports-candidate` (`4906a6b`) and `6a8afbb`; absent from `main`. | AP — never ratified; `H-4`/`H-16` conflict unresolved (errata only). | NI. | NI. | P — file-directory tenant map (out of scope under `H-18`). | V — branch `reports/persistence.ts`. | SOURCE-REPORTED. | SOURCE-REPORTED — branches not executed this session. | EP. | V — tree census re-executed 2026-10-23. | AP. | NOT SATISFIED. | NOT SATISFIED. | OOS for the identity-strength part; BL for the rest. | `git ls-tree origin/promotion/governed-reports-candidate frontend/server/reports/`; `6a8afbb`; `D-2` §3.4/§4 |
| 37 | Reports UI + no-auth port (IRR) | NI — no `reports` feature directory and no `/reports` route (verified 2026-10-23). | AP. | NI. | NW. | NA. | NA. | NA. | NA — nothing to validate. | EP. | EM — no Reports UI exists on `main` or the D-3 tree. | V — §8.4 finding stands. | NOT SATISFIED. | NA. | NI. | Directory/route census 2026-10-23; §8.4; CV-51 |
| 38 | Class-C journal persistence service (IRR PF-1) | V — `persistence-service.ts` + writer/recoverer + restart proofs. | V — PF-1a -> Class C -> TD-2/TD-3/TD-7a. | V — watchlists, collaboration, settings. | V — used by all three owner services. | V — append-only NDJSON + rebuildable index; server-derived ids. | V — append-only journal under `IIPS_DATA_DIR`. | V — EXECUTED 2026-10-23: two real OS processes, Process B recovers Process A state, 2/2 cycles. | V — `persistence-service.test.ts` + restart proofs executed. | V — process-level recovery proven, not just unit tested. | V — on `main`; transcripts. | V — CV-04; CV-38 CLOSED. | V — CV-04. | V — qualified non-production. | V for non-production owner-scoped durability. | `server/persistence/{persistence-service,persistence-restart-proof,restart-proof-*}.*`; executed 2/2 on 2026-10-23 |
| 39 | Data-directory policy — TD-7a local, TD-7b production profile (IRR) | V — TD-7a via `IIPS_DATA_DIR` (default `<cwd>/.iips-data`). | TD-7b: DEFERRED (CV-24); no production profile authorized. | V. | V. | V — journal + carrier live under the data dir. | V — local filesystem. | V — restart proofs write/read under `IIPS_DATA_DIR`. | V — executed suite. | V — exercised by the restart proofs. | V — `CV-24` disposition recorded. | P — TD-7b open. | NA — non-production scope. | P — TD-7b stays out of non-production scope. | P — local profile only; production data-directory policy is not satisfiable (TD-7b absent). | `frontend/server/persistence/persistence-service.ts:109`; CV-24; executed restart proofs |
| 40 | Certified-analytics ↔ user-portfolio integration | NA — excluded by decision. | NOT AUTHORIZED — `G-2` §7 exclusion. | NA. | NA. | NA. | NA. | NA. | NA. | NA. | V — decision record. | V — `G-2` §7/§8. | NA. | NA. | OOS. | `G-2` §7/§8; `IIPS_v3.0_G2_DURABLE_USER_PORTFOLIO_IMPLEMENTATION_RECORD.md` §8.4 |
| 41 | Governed-universe widening for owner data (IRR) | NI — 13 governed rows only. | DEFERRED — PA Option C (2026-10-19): defer expansion pending defined prerequisites; not accepted, not rejected. | NI. | NI. | P — full D05 expansion not authorized; `REAL` label does not establish eligibility. | NA. | NA. | NA. | NA. | V — `404` evidence + disposition record on `main`. | V — CV-22 disposition recorded. | NOT SATISFIED (expansion deferred). | NA. | P — future expansion only after identity/eligibility contract, roster revision, IRR mapping and separate authority. | `IIPS_v3.0_CV22_OPTION_C_PA_DECISION_2026-10-19.md`; `src/identity/d05_broad_universe_data.ts` (IPD) |
| 42 | WorkflowRuntime (platform, historical-only) | V — `iips-platform/src/distributed/WorkflowRuntime.ts`. | V — platform scope only. | P — sole consumer is one platform regression test. | NW — no product route. | NA. | NA. | NA. | SOURCE-REPORTED — platform suites not re-run in this pass. | NA. | V — consumer census re-executed. | UR — no product disposition recorded. | NA. | NA. | NA — not a product surface. | `iips-platform/src/distributed/WorkflowRuntime.ts`; `tests/regression/program-v2.0-wp7-workflow.test.ts` |
| 43 | CSIP + v1.1 certification tracks (platform + cross-sector) | V — `CSIP_FINAL_READINESS_CERTIFICATE.md`, `CSIP_FREEZE_MANIFEST.json`, Track 1–7 certificates. | V — v1.1 program certification. | P — platform/regression level. | NA. | V — freeze manifest + baselines. | NA. | V — freeze regression baseline (source-reported). | SOURCE-REPORTED — certificates not re-executed this pass. | NA. | SOURCE-REPORTED. | V — certification gate records. | V — `PROGRAM_v1.1_FINAL_READINESS_CERTIFICATE.md`. | V — v1.1 certification. | NA — historical baseline. | `iips-platform/CSIP_FINAL_READINESS_CERTIFICATE.md`; `iips-cross-sector/CSIP_FREEZE_MANIFEST.json`; `program-v1.1-certification/*` |
| 44 | Retired auth/admin stack on unmerged branches (IRR) | V — branch-only. | OOS — `H-18` scope correction; must not be revived as a prerequisite. | NI. | NI. | NA. | NA. | NA. | P — branch suites, not run. | NA. | V — absence on `main` re-verified 2026-10-23 (`secured-executor.ts`, `admin-transport.ts`, `keycloakAdapter.ts`, `tenant-membership-store.ts` all absent). | V — `H-18`. | OOS. | NA. | OOS. | `IIPS_v3.0_H18_PRODUCT_SCOPE_SINGLE_USER_PERSONAL_USE.md`; file census 2026-10-23 |
| 45 | Package + ref durability of the IPD pin (IRR + IPD) | V — `iips-production-market-data` pinned `#2d9130e7…` in `package.json` + lock; builds from a clean clone (npm ci executed 2026-10-23). | V — `CV-25` complete: both annotated tags verified on the remote. | V — `npm ci` builds `dist/package`; three subpaths exported. | NA. | P — pin is 8 commits behind IPD `main` (documentation-only drift 2d9130e7..ddaaef98). | NA. | NA — no runtime state at risk; durability here is a ref-level property. | V — executed: `npm ci`, build and `brokerImportPackageConsumer.test.ts` (pin guard) pass. | NA. | V — both annotated tags and peeled targets verified on the remote this pass; guard test enforces the exact 40-hex pin + 3 subpaths. | V — CV-25 act + guard test. | V — package-reference durability criterion met (not a product acceptance). | NA — no product qualification asserted. | P — main pin durable; SECOND pin (`iips-broker-import` alias @ `70b24f02…`, 157 commits behind) feeds `build:broker-import` and is NOT covered by the guard. | `frontend/package.json`, `package-lock.json`, `tsconfig.broker-import.json`; `brokerImportPackageConsumer.test.ts`; tags `iips-pin-*` |
| 46 | IPD test-runner false green (IPD) | V — `scripts/run-tests.mjs` guard on IPD `main`. | V — IPD PR #9 merged the authorized runner/CI change. | V — CI runs the guard; fails closed on zero/stale/partial. | V — `npm test` executed 2026-10-23: 66 source suite files, 875 tests, exit 0 with a printed count. | NA. | NA. | NA. | V — guard rejects missing/partial/stale/zero-test runs; CI green at `ddaaef98…`. | NA. | V — executed run transcript this pass. | V — CV-35 COMPLETE. | V — zero-test false-green criterion met. | NA. | V — runner/CI reliability only. | `scripts/run-tests.mjs`; `.github/workflows/ci.yml`; executed `npm test` 875/874/1/0 |
| 47 | Operator runbook + server start path (IRR) | V — `docs/OPERATOR_RUNBOOK.md`; `server:dev` = `tsx server/executive-transport.ts`. | V — accepted by user direction 2026-10-17. | V — start path exercised this pass (server started on `127.0.0.1:8791` and answered 15 routes). | V — `npm run server:dev` documented and functional. | NA. | NA. | NA. | VP — THIS PASS FOUND DRIFT: runbook still states pin `2e11fa3b…` (actual `2d9130e7…`), 87 files/1,077 tests (actual 98/1,197), bundle 292.88 kB/84.18 kB (actual 1,590.96 kB/222.05 kB). | VP — no independent-reader run was produced or inferred. | V — runbook present; drift quantified here. | V — CV-30/CV-31 closed 2026-10-14. | ACCEPTED with follow-ups (2026-10-17); three figures now demonstrably stale. | NA. | P — usable but the documented expectations no longer match the head. | `docs/OPERATOR_RUNBOOK.md` §0/§8; `frontend/package.json`; executed start + 15-route probe; CV-30/CV-31 |
| 48 | Program documentation + tracker integrity (IRR + IPD) | V — tracker + IPD reconciliation records on `main`. | NA. | NA. | NA. | NA. | NA. | NA. | V — this pass executed independent re-derivation of the tracker's status claims. | NA. | V — XV-1/XV-3/XV-4; CV-33/34/36/37 closed. | V — CV-34 §5 backfill; IPD A4/A5. | SATISFIED for documentation reconciliation only. | NA. | V — but §17/§19 still carry two superseded persistence statements (see D-01). | `README.md`, `ROADMAP.md`, `RELEASES.md`; IPD `evidence/cross-repository/*`; §16.69; this report §C |
| 49 | v1.2.0 release state (IRR) | V — annotated tag `program-v1.2.0` -> `5decdca9…` (ancestor of `main`; re-verified 2026-10-23). | V — CV-11. | NA. | NA. | NA. | NA. | NA. | NA. | NA. | V — tag + GitHub Release verified live (`gh release list`: 2026-09-05). | V — CV-11. | V — accepted. | V. | V — published, non-production LTS. | tag `program-v1.2.0` -> `5decdca93e5d…`; tag `v3.0-phase12-certified` -> `7325aeda…`; `gh release list` |
| 50 | Gate C `P-2` establishment + amended one-artifact deposit (governance) | V — `evidence/integration/gate-c-p2-establishment-2026-10-14/{MANIFEST.md,p2-establishment-transcript.txt}`. | V — GC-P2 acts; §15.19–15.22. | NA. | NA. | V — one governed transcript. | V — deposit blob `5f58c7b9…`. | NA. | V — manifest + transcript verification. | NA. | V — on `main`. | V — `GC-P2-DEPOSIT-DISPOSITION-01`. | V — in-scope closure. | V. | V — no residual act. | `evidence/integration/gate-c-p2-establishment-2026-10-14/`; §§15.19–15.22; CV-10 |
| 51 | F5R disposition and F5 execution decision (governance) | V — disposition recorded. | V — `GC-P2-SCOPE-CORR-01` closed F5R as out of scope. | NA. | NA. | NA. | NA. | NA. | NA. | NA. | V — record text on `main`. | V — scope correction effective. | V. | V. | V — no residual act. | `IIPS_v3.0_GATE_C_P2_SCOPE_CORRECTION_AND_F5R_DISPOSITION_2026-10-14.md`; `..._FINAL_ACCEPTANCE_AND_F5_EXECUTION_DECISION_2026-10-14.md` |


---

*End of record. This document creates no authority, lifts no fence, admits no lineage, and renders no acceptance, qualification or release decision. Every status is bounded by the evidence anchor in its own row.*
