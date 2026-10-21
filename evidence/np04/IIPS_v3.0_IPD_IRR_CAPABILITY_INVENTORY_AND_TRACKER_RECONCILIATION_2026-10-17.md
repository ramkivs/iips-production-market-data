# IIPS v3.0 — COMPLETE IPD + IRR CAPABILITY INVENTORY AND AUTHORITATIVE TRACKER RECONCILIATION

> ## STATUS: **INVENTORY / RECONCILIATION ONLY — NO IMPLEMENTATION, NO AUTHORITY CHANGED**
> This artifact records a **verified, evidence-anchored inventory of the entire IIPS application across
> `ramkivs/iips-production-market-data` (IPD) and `ramkivs/iips-review-recovered` (IRR)**, reconciles
> the existing authoritative trackers against that evidence, and produces the full capability matrix,
> cross-repository integration matrix, and outstanding-work register.
>
> **Nothing was implemented, wired, admitted, qualified, released or merged.** Gate C execution
> authority exists for a seven-item read-only subset and **was not exercised**. The four Gate V waivers
> remain waivers, **not technical proof**. Production remains **NOT AUTHORIZED** in both repositories.

| Field | Value |
|---|---|
| **Artifact identifier** | `IIPS-V3-IPD-IRR-CAPABILITY-INVENTORY-AND-TRACKER-RECONCILIATION-2026-10-17-01` |
| **Artifact type** | Inventory / reconciliation record (additive; renders no authority) |
| **Repositories inspected** | IPD `ramkivs/iips-production-market-data`; IRR `ramkivs/iips-review-recovered` |
| **IPD ref inspected** | `refs/heads/main` @ `70b24f029842a7e9b7f615e4d9df7376fd4ff817`; session ref `refs/heads/arena/21c63aef-…` @ `7b08dee…`; `gate-a/local-principal-enablement-2026-10-16` @ `2ded0e98…`; `gate-b/local-principal-ipc-implementation` @ `cec7080…`; `np04-governed-persistence-windows` @ `2e11fa3b…`; plus 36 heads / 4 tags enumerated |
| **IRR ref inspected** | `refs/heads/main` @ `10584439f33dfa9192955c3f74879f20ccaf111e` (merge of PR #118); `gate-b/local-principal-ipc-implementation` @ `6c654be7…`; 128 heads enumerated |
| **Verification date (UTC / local)** | `2026-10-17T06:54:50Z` (authoritative GitHub API HTTP `Date`) / 2026-10-17 12:24 IST |
| **Scope** | Non-production, single-user, one personal laptop (H-18) |
| **Publication** | IPD evidence branch (PR #8, open, unmerged). IRR-side tracker update **prepared, not applied** — see §10.3 |

---

## 1. BASELINE (VERIFIED THIS PASS)

### 1.1 Repository and ref state

| Repository | Ref | Commit | Note |
|---|---|---|---|
| IPD | `main` | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` | Production branch; **no** `src/persistence`, `src/app_identity`, `src/portfolio`, `src/ipc`, `src/server` |
| IPD | `arena/21c63aef-…` (this workstream) | `7b08dee…` | Evidence branch behind PR #8 |
| IPD | `gate-a/local-principal-enablement-2026-10-16` | `2ded0e98…` | A-2/A-3 provisioning enablement (off-main) |
| IPD | `gate-b/local-principal-ipc-implementation` | `cec7080252183a6a5332efe351e61c254d342a2d`, tree `22a7438c…` | Gate B IPC implementation (15 files, **unmerged**) |
| IPD | `np04-governed-persistence-windows` | `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494` | **The pin IRR consumes**; exports `./pit`, `./d114-non-production`, `./persistence` |
| IRR | `main` | `10584439f33dfa9192955c3f74879f20ccaf111e` | Merge of PR #118 (DP-1 amendment) |
| IRR | `gate-b/local-principal-ipc-implementation` | `6c654be728ef0c90c69f7184f3a5e1625e71057d` | 8 files, 1 703 insertions, **no PR, unmerged** |
| IRR | open PRs | **#117** (docs/rendering, 8 files), **#114** (browser broker preview, non-production) | Neither merged |
| IRR | tags / release | `program-v1.2.0` (released 2026-09-05), `v3.0-phase12-certified` | Historical, non-production |

**Working trees:** IPD session tree clean at inspection start (`0` changes). IRR shallow clone at `/tmp` clean.

### 1.2 Authoritative trackers located

| Tracker | Repository | Path | State |
|---|---|---|---|
| **Program plan tracker** | IPD | `IIPS_Production_Market_Data_Intelligence_Program_v1.0_TRACKER_INTEGRATION_ALIGNED.xlsx` (12 sheets; "Work Tracker" = 59 rows `P00-01`…`P13-15`) | **All 59 rows read `NOT STARTED`**, including items whose capability is certified (`P13-05` screener, `P13-03` portfolio). **Stale**; see §8.1 |
| **Canonical program tracker** | IRR | `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` (2 558 lines, 721 KB) | Live; last entry **§16.38 NP-18 (`2026-10-16`)**. Contains **§18 = the same 17-column capability matrix** (51 rows) and **§16.4 = the `CV-01`…`CV-53` register**. **Does not yet contain** Gate A, Gate B, D-4, D-GC or the IRR Gate B branch |
| Program spec | IPD | `…SPEC_INTEGRATION_ALIGNED.docx` | Reference only; not a status record |

**No competing tracker was created.** This artifact is a **dated reconciliation record** linked from §8 to both trackers.

---

## 2. HOW TO READ THE MATRIX

**Status vocabulary** (kept deliberately separated by dimension):

`V` verified · `P` partial (precise gap stated) · `U` unknown / not established · `D` explicitly deferred · `F` failed (evidence of actual failure) · `NA` not applicable (reason stated).

**Dimension discipline.** Each cell judges **one** dimension and is never carried over from a neighbour. In particular: existence ≠ authority · authority ≠ implementation · implementation ≠ integration · integration ≠ runtime wiring · wiring ≠ usable data · passing tests ≠ E2E · acceptance ≠ persistence · green tests ≠ qualification · merged PR ≠ end-to-end completion.

**Owner column.** `IPD`, `IRR`, `JOINT`, or `EXTERNAL`. **Evidence Anchor** prefixes IPD paths with `ipd:`; unprefixed paths are IRR-relative.

---

## 3. FULL 17-COLUMN CAPABILITY MATRIX

| # | Capability (owner) | Existence | Authority | Integration | Wiring | Data | Persistence | Recovery | Validation | E2E | Evidence | Governance | Acceptance | Qualification | Release-readiness | Evidence Anchor |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | IPD application shell, routes, navigation (IPD) | V — `App.tsx`, 26+ donor route paths | V — Phase-1A / Phase-5 Option A acts | P — donor structure restored; API/auth-coupled routes render fail-closed | V — React Router mounted | P — only locally-composed surfaces carry data | NA — no state | NA | V — `shell_navigation_model`, `shell_offline_full_shell_restoration` | P — offline shell only | V — `ipd:evidence/target-shell-integration/OPTIONA-OFFLINE-FULL-SHELL-RESTORATION-RESULT.md` | V | V — shell restoration accepted | NA — UI | NON-PRODUCTION shell | `ipd:frontend/src/app/{App,routes,navigation}.tsx`; `ipd:tests/shell_*.test.ts` |
| 2 | IPD executive dashboard + certified DTO (IPD) | V — `ExecutiveSurface`, `ui02_executive_summary` | V | P — composed from local view models | V — `/executive` route | P — fixture/offline data | NA | NA | V — `shell_executive_surface` | P — offline | V — P13/P14/P15 cert reports | V | V — P13-CERT `CERTIFIED` | NA | NON-PRODUCTION | `ipd:src/ui/view_models/ui02_executive_summary.ts`; `ipd:evidence/p13/p13-certification-report.md` |
| 3 | IPD canonical contracts D01–D09 + envelope/provenance (IPD) | V — 13 files | V — AD-01…AD-18 | V — consumed by all IPD modules | V — library | V — typed schemas | NA | NA | V — `wsa_p01_contracts` | NA — library | V — IIPS tracker `P01-*` | V | V | NA | Foundation only | `ipd:src/contracts/**`; `ipd:src/index.ts` exports |
| 4 | IPD provider SPI + adapter contract (IPD) | V — `provider_spi.ts` | V | P — no live provider admitted | V — interface only | U — no live feed | NA | NA | V — `wsb_p02_spi` | NA | V | V | V | NA | NON-PRODUCTION | `ipd:src/spi/provider_spi.ts` |
| 5 | IPD security: secret refs, scanner (IPD) | V | V | V | V — library | NA | NA | NA | V — `wsa_p03_secret_ref`, `cross_cutting_security_and_governance` | NA | V | V | V | NA | NON-PRODUCTION | `ipd:src/security/**` |
| 6 | IPD identity / security master / mapping / quarantine (IPD) | V — 6 files; D05 broad universe 2 250 rows; governed fixture master | V — P04 acts | V — consumed by PIT + adapters | V — library + `SecurityMasterSurface` | V — governed fixture universe | NA — in-memory master | NA | V — `p04_governed_offline_security_master`, `wsa_p04_security_master` | P — surface only | V | V | V | NA | NON-PRODUCTION | `ipd:src/identity/**`; `ipd:tests/p04_governed_offline_security_master.test.ts` |
| 7 | IPD ingestion pipeline, dead-letter, operator drop (IPD) | V | V | V — `ingress/pipeline.ts` | V — library | V — deterministic fixtures | P — dead-letter in memory | U — restart behaviour untested | V — `wsb_operator_drop`, `wsb_p05_ingress_pipeline`, `bi08_idempotent_ingress` | NA | V | V | V | NA | NON-PRODUCTION | `ipd:src/ingress/**`, `ipd:src/operator_drop/**` |
| 8 | IPD normalization (time/unit/currency) (IPD) | V | V | V | V | V | NA | NA | V — `wsb_p06_normalization` | NA | V | V | V | NA | Library | `ipd:src/normalization/**` |
| 9 | IPD quality framework + anomaly + freshness (IPD) | V | V | V | V | V | NA | NA | V — `wsb_p07_quality_framework` | NA | V | V | V | NA | Library | `ipd:src/quality/**` |
| 10 | IPD PIT store + corporate actions (IPD) | V | V | V — **exported to IRR via `/pit`** | V — `PitReadService` | V | V — SQLite-backed store (pin) | P — restart proof not re-run here | V — `wsb_p08_pit_store` | P — consumed by IRR route | V | V | V | NA | **Foundation of the only live cross-repo data path** | `ipd:src/pit/**`; `ipd:src/pit/package.ts` @ `2e11fa3b` |
| 11 | IPD fundamentals + ratios + TTM + restatements (IPD) | V | V | P — no route consumes them | V — library | P — fixture statements | NA | NA | V — `wsc_p09_fundamentals` | NA | V | V | V | NA | NON-PRODUCTION | `ipd:src/fundamentals/**` |
| 12 | IPD intelligence engines (news/estimates/macro/altdata) (IPD) | V | V | P — no admitted consumer | V — library | P — fixture | NA | NA | V — `wsc_p10_intelligence` | NA | V | V | V | NA | NON-PRODUCTION | `ipd:src/intelligence/**` |
| 13 | IPD engine adapters: frozen engines, namespace guard, recalculation DAG (IPD) | V | V | P — no product route | V — library | V — deterministic inputs | NA | NA | V — `wsd_p11_engine_adapters` | NA | V | V | V | NA | NON-PRODUCTION | `ipd:src/engine_adapters/**` |
| 14 | IPD transports, DTOs and screener service (IPD) | V — 8 files | V | P — server-side services, no HTTP server on `main` | P — library only | V | NA | NA | V — `wsd_p12_product_transports` | NA | V | V | V | NA | NON-PRODUCTION | `ipd:src/transports/**` |
| 15 | IPD UI view models UI01–UI14 + registry governance (IPD) | V — 14 authorized view models | V | P — frontend renders 7 feature surfaces | V — `UIRegistry` | P | NA | NA | V — `shell_*` suites | P | V | V | V | NA | NON-PRODUCTION | `ipd:src/ui/ui_registry.ts`; `ipd:src/ui/view_models/**` |
| 16 | IPD E2E lineage verifier + evidence manifest (IPD) | V | V | V | V — library | V | NA | NA | V — used by certification runs | P — offline E2E only | V | V | V | NA | NON-PRODUCTION | `ipd:src/e2e/**` |
| 17 | IPD operations: SLO, telemetry, runbooks, release state machine, emergency controls (IPD) | V | V | P — not connected to a runtime service | V — library | NA | NA | NA | V — `shell_evidence_surface`, ops suites | NA | V | V | V | NA | NON-PRODUCTION | `ipd:src/operations/**` |
| 18 | IPD OQ / release-candidate manifests / kill switch (IPD) | V | V | P | V — library | NA | NA | NA | V — OQ suite runner tests | NA | V | V | V | NA | NON-PRODUCTION | `ipd:src/oq/**` |
| 19 | IPD D114 historical acquisition + unified adapter (IPD) | V — 8 files; legacy + CM bhavcopy parsers | V | V — loader → PIT | V — library + scripts | V — historical files | V — PIT rows | P | V — `wsh_d114_historical_feasibility` | P — offline replay | V — `evidence/d114/**` | V | V | NA | NON-PRODUCTION | `ipd:src/d114/**`; `ipd:evidence/d114/**` |
| 20 | IPD broker adapters + holdings import + idempotent ingress (IPD) | V — Zerodha/Dhan adapters, BI-03/04/05/08 | V — BI charters | V — modal → store port | V — `BrokerImportModal` | V — parsed holdings | P — in-memory `PortfolioStore` on `main` | U — restart loses state | V — `bi03/04/05/08`, `repeat_import_lifecycle` (26) | V — **browser-verified** (BI-07-CERT) | V — `ipd:evidence/bi07/bi07-final-certification.md`; `ipd:evidence/bi08/**` | V | **V — ACCEPTED / BROWSER VERIFIED** | NA | NON-PRODUCTION RC | `ipd:frontend/src/features/portfolio/import/**`; `ipd:tests/bi0*.test.ts` |
| 21 | IPD portfolio workspace + store port (async, DP-2 2F refusal) (IPD) | V | V — store-port act `np04-g2-portfolio-ui-store-port-…-001` | V | V — `/portfolio` | P — reference portfolio | P — depends on store | P | V — `bi07_portfolio_store_port` (14), `portfolio_ui_integration` (15) | V — browser lifecycle | V | V | V | NA | NON-PRODUCTION | `ipd:frontend/src/features/portfolio/portfolioStorePort.ts`; `ipd:evidence/np04/…STORE_PORT…` |
| 22 | IPD durable portfolio store (G24) (IPD) | **V — but only on `gate-a`/`gate-b` lineage** (`src/portfolio/**`) | V — G24 NP04 | P — no HTTP/IPC consumer on `main` | **P — no route; absent from `main`** | V — SQLite | V — `durable-store.ts`, repository, revisions, events | P — restart durability tested at store level (`g24_c_*`) | V — `g24_c_portfolio_durability` | P | V | V — off-main lineage, not promoted | V at store level | NA | **NOT RELEASABLE — off-main, unmerged** | `ipd:src/portfolio/**` @ `2ded0e98`/`cec7080`; `ipd:tests/g24_c_portfolio_durability.test.ts` |
| 23 | IPD principal / local binding / A-2 / A-3 audit (IPD) | V — `src/app_identity/**` @ `gate-b` | V — Gate A act (spent) | P | P — library | V — SQLite | V — `local_principal_bindings` migration 003 | P | V — Gate B suites + G24 fixtures | NA | V | V | V — Gate A provisioned/reconciled | NA | **NOT RELEASABLE — off-main** | `ipd:src/app_identity/**`; `ipd:evidence/np04/…GATE_A_EXECUTION_RECORD…` |
| 24 | IPD Gate B IPC endpoint (C1–C12) (IPD) | V — 15 files @ `cec7080` | **V — D-4 rendered ACCEPT** | **P — no consumer; unmerged branch** | **P — no runtime entry point; tests only** | V — read-only ops | NA — explicitly no writes | NA | V — Gate B suites **41/41** | **P — POSIX tests, not Windows E2E** | V — completion handoff `b21b367` | V — D-4 `ee6122e8…` | **V — implementation accepted as published** | **U — Gate C not executed** | **NOT RELEASABLE — unmerged, unqualified** | `ipd:src/ipc/**`; `ipd:evidence/np04/…GATE_B_COMPLETION_EVIDENCE_HANDOFF…` |
| 25 | IPD server transport + authorization (IPD) | V — `src/server/**` @ `gate-b` only | V — G24 | P | P | V | V | P | V — G24 suites | NA | V | V | V | NA | **NOT RELEASABLE — off-main** | `ipd:src/server/http-server.ts` (blob `17f9cb8a…`) |
| 26 | IPD test integrity: `npm test` false-green risk (IPD) | V — script `node --test dist/tests/*.test.js` | P — no authority to change | NA | NA | NA | NA | NA | **F — can report `0` tests and exit `0` without `dist/`** | NA | V — reproduced historically (`dist/` absent) | V | V | NA | Blocker for trust in IPD test claims | `ipd:package.json` `scripts.test`; IRR tracker `CV-35` |
| 27 | IRR application shell, routes, navigation (IRR) | V — 24 route constants / 26 mounted paths | V — Phase 3 acts | V | V — mounted | P — mixed | NA | NA | V — `App.test.tsx` | V — 13/13 live route probes (historical) | V | V | V | NA | **Non-production release state** | `frontend/src/app/{App,routes,navigation}.tsx` |
| 28 | IRR executive dashboard + certified DTO (IRR) | V | V | V | V — `/executive` | V — certified DTO | NA | NA | V — `executive-read.test.ts` | V | V | V | V — `CV-01` | V | **Non-production** | `frontend/server/executive-transport.ts`; `frontend/src/features/executive/**` |
| 29 | IRR portfolio workspace (reference portfolio) (IRR) | V | V | V | V — `/portfolio` | P — reference/`SNAPSHOT` only | P — reference analytics frozen | NA | V | V | V | V | V | NA | Non-production | `frontend/src/features/portfolio/**` |
| 30 | IRR user-portfolios UI (list/detail) (IRR) | V | V | V | V — routes mounted | **P — every call returns 503** | **NA — no data path** | NA | V — `UserPortfolio*` tests | **P — renders fail-closed** | V | V | V (`CV-53` scope) | NA — UI | Non-production | `frontend/src/features/user-portfolios/**` |
| 31 | IRR watchlists (durable) (IRR) | V | V | V | V — `/watchlists` | V | **V — Class-C append-only journal** | V — rebuildable index | V — `watchlists` suites | V | V | V | V — `CV-02` | V | Non-production | `frontend/server/watchlists/**`; `frontend/server/persistence/persistence-service.ts` |
| 32 | IRR collaboration (durable) (IRR) | V | V | V | V — `/collaboration` | V | V — same journal | V | V — `collaboration-*` suites | V | V | V | V | V | Non-production | `frontend/server/collaboration/**` |
| 33 | IRR settings (durable) (IRR) | V | V | V | V — `/settings` | V | V — same journal | V | V — `settings` suites | V | V | V | V | V | Non-production | `frontend/server/settings/**` |
| 34 | IRR research: company / cross-sector / engine registry (IRR) | V | V | V | V | P — 13 governed rows | NA | NA | V | P — `/research` root is a placeholder | V | V | V | NA | Non-production | `frontend/src/features/{company,cross-sector,engines}/**` |
| 35 | IRR screener (governed, POST-only) (IRR) | V | V | V | V — `/screener` | P — 13 derived members | NA | NA | V | V | V | V | V | V | Non-production | `frontend/server/screener/**`; `frontend/src/features/screener/**` |
| 36 | IRR intelligence: opportunities / risks / rankings / decision matrix (IRR) | V | V | V | V | P | NA | NA | V | V | V | V | V | NA | Non-production | `frontend/src/features/intelligence/**` |
| 37 | IRR AI advisory (read-only) (IRR) | V | V — Phase 13.2 | V | V — `/ai-advisory` | P — advisory only | NA | NA | V — `ai-advisory-transport.test.ts` | V — live certification test exists | V | V | V | NA | Non-production | `frontend/server/ai-advisory-transport.ts` |
| 38 | IRR evidence / explorer / replay (IRR) | V | V | V | V — `/evidence`, `/evidence/:id`, `/evidence/replay/:id` | V | NA | NA | V | V | V | V | V | NA | Non-production | `frontend/src/features/evidence/**` |
| 39 | IRR macro research (MoSPI, D89/D91) (IRR) | V | V — `CV-CORR-21`…`-23` | V | V — `/research/macro` | V — live MoSPI reads | P — no observation/cache layer | NA | V — `macro-transport.test.ts` (incl. L-3) | **V — NAS live P4 PASS + browser acceptance** | V — `CV-CORR-19/20/22` | V | V — `CV-53` accepted for D89 display | V | **V — live-source E2E ESTABLISHED (operator-transferred)** | `frontend/server/macro/**`; `evidence/integration/cv-53-d89-product-acceptance-2026-10-15/**` |
| 40 | IRR PIT read seam → IPD package (JOINT) | V — `ipdPitReadAdapter.ts` | V — IU-5A boundary | **V — real package dependency at pin `2e11fa3b`** | **V — `/api/pit/market-data` route** | V — IPD PIT store injected | V — IPD store | P | V — `pit-transport` tests | P — no UI feature for PIT | V | V | V | NA | **V — the only live IPD→IRR data path** | `frontend/server/pit/ipdPitReadAdapter.ts`; `frontend/package.json` pin; `ipd:src/pit/package.ts` |
| 41 | IRR user-portfolio port / translation boundary / 2F (IRR) | V — contract, port, boundary, translation | V — `G-2` §5, Option 2F | **P — port has no live adapter** | **P — HTTP returns 503 before the port** | NA | NA | NA | V — `option2F`, `translationBoundary`, `userPortfolioBoundary` tests | **P — fail-closed only** | V | V | V | NA | **NOT OPERATIONAL — by design** | `frontend/server/user-portfolio/{userPortfolioContract,userPortfolioPort,translationBoundary,userPortfolioBoundary}.ts`; `frontend/server/user-portfolio-transport.ts` |
| 42 | IRR Gate B local-principal IPC adapter (IRR) | **V — branch only** (`ipcClient`, `ipcPortAdapter`, `ownerContextFromBinding`, `firstPartySignal` + tests) | V — IRR D-4 rendered | **P — targets the IPD IPC endpoint that is unmerged** | **P — not on `main`, no PR** | NA | NA | NA | SOURCE-REPORTED — 8 files, suite reported 868/868 | **U — not executed here** | V — commit `6c654be7` | V — IRR D-4 | **B — branch-scoped** | **U** | **NOT RELEASABLE — unmerged, no PR** | `git: origin/gate-b/local-principal-ipc-implementation` @ `6c654be7`; 8 files / +1 703 |
| 43 | IRR owner-context carrier + 503 fence (IRR) | V | V — F-1/F-2/F-3 | V | V — all owner-scoped routes | NA | NA | NA | V — `owner-context-*` suites | V | V | V | V | NA | **V — fence is correct behaviour, not a defect** | `frontend/server/{owner-context-carrier,owner-context-resolver,owner-context-unavailable}.ts` |
| 44 | IRR platform (iips-platform engines, WorkflowRuntime, CSIP) (IRR) | V — 415 files | V — v1.1 certification | **P — WorkflowRuntime consumed only by one regression test** | **NW — no product route** | V — snapshots | NA | NA | SOURCE-REPORTED — platform suites not re-run | NA | V | V | V — `PROGRAM_v1.1_FINAL_READINESS_CERTIFICATE.md` | V | NA — historical baseline | `iips-platform/**`; `program-v1.1-certification/**` |
| 45 | IRR sector packs IES-010…020 + cross-sector (IRR) | V — 9 packs | V | P — engine registry only | P | V — sector fixtures | NA | NA | V — sector engine suites | NA | V | V | V | NA | Non-production | `ies-01*/**`; `iips-cross-sector/**` |
| 46 | IRR program release state `program-v1.2.0` (IRR) | V | V | NA | NA | NA | NA | NA | NA | NA | V — tag + GitHub Release (2026-09-05) | V | V — `CV-11` | V | **V — released, non-production** | tag `program-v1.2.0`; `RELEASES.md` |
| 47 | IRR browser broker preview (PR #114) (IRR) | V — branch | **P — non-production, unmerged** | P | P | P | NA | NA | SOURCE-REPORTED | P | V — PR #114 open | U | **U — not accepted** | **U** | **NOT RELEASABLE** | PR #114 (open) |
| 48 | IPD→IRR PIT contract & pin durability (JOINT) | V | **AP — no durable-ref/tag act** | V | V | V | V | P | V | P | V | V | V | NA | **P — reachable, not durable** (pin exists only as one branch head) | `frontend/package.json` + lockfile pin `2e11fa3b…`; IPD has 4 tags, **neither pin tagged** |
| 49 | IPD→IRR durable portfolio (G24) contract (JOINT) | V — contract constants (`G2_LINEAGE`, routes, header) | **P — G24 lineage never promoted** | **NI — first-party adapter removed** | **NI — HTTP 503** | NA | V — G24 store exists off-main | P | V — contract tests only | **NA — no path** | V | V | V | NA | **NOT OPERATIONAL** | `frontend/server/user-portfolio/userPortfolioContract.ts` (G2_LINEAGE @ `6828155e…`); `userPortfolioPort.ts` header |
| 50 | Governance: `L-IPC-1` C1–C12 + Gate A + Gate B D-4 + Gate C D-GC (JOINT) | V | V — contract accepted | NA | NA | NA | NA | NA | NA | NA | V — `cab04b6f…`, `ee6122e8…`, `91a952a2…`, `…DECISION_RENDERED…` | **V — rendered** | V | **Gate C: authority granted, NOT executed** | NA | `ipd:evidence/np04/**` (8 Gate B/C records) |
| 51 | Tracker / documentation integrity (JOINT) | P | NA | NA | NA | NA | NA | NA | NA | NA | V — IPD xlsx 59/59 `NOT STARTED`; IRR tracker last updated 2026-10-16 | V | V | NA | **P — stale** | This artifact; `CV-36`; IRR §16.38 |

**Row-level notes.** (a) Rows 22–25 are **off-`main`**: their `V` cells describe the branch object, **not** `main` state — each names its ref. (b) Row 42 is the mirror image on the IRR side and is **branch-scoped**. (c) Row 26 is the only **`F`** in the matrix: the IPD `test` script can report `0` tests and exit `0` — an established false-green mechanism, not a capability failure. (d) Row 41's 503 is **correct fail-closed behaviour**, so engineering cells read `V` and only "operational data" reads `P`. (e) Rows 48–49 are the two cross-repository boundaries; **both are P/NI**, for different reasons (durability vs admission).

---

## 4. DURABLE-PERSISTENCE LIFECYCLE — END-TO-END TRACE

Four workflows persist or would persist state. Each is traced through the thirteen required steps; **the exact stopping point is named**.

### 4.1 IRR watchlists / collaboration / settings (the only fully operational durable path)

| Step | Finding |
|---|---|
| 1 Entry point | `/watchlists`, `/collaboration`, `/settings` (mounted) |
| 2 Client contract | `frontend/src/api/{watchlists,collaboration,settings}.ts` |
| 3 Server transport | `frontend/server/{watchlists,collaboration,settings}/*-transport.ts` |
| 4 Principal/ownership | Owner-context carrier → `owner-context-7f3a91c2`; **not an `applicationUserId`** (materialisation only) |
| 5 Authorization | Owner-scoped handler; unauthenticated namespace returns 503 |
| 6 Domain/service | `*-service.ts` |
| 7 Persistence | `frontend/server/persistence/persistence-service.ts` — Class-C append-only NDJSON under `IIPS_DATA_DIR` |
| 8 Transaction/consistency | Append + rebuildable index; server-derived ids (TD-2/TD-3/TD-7a) |
| 9 Restart durability | **V — `CV-04` records the separate-process restart qualification**, plus on-disk observation. `CV-38` is an **additional, redundant test-only proof** parked off-`main` (adoption is a `CV-24` decision), **not** an unproven capability |
| 10 Recovery | Index rebuild from the journal |
| 11 Cross-repo | None |
| 12 Validation | `persistence-service.test.ts`, transport/service suites |
| 13 Qualification/release | `CV-04` complete; non-production |

**Stopping point:** none for the workflow. Residual items are non-capability: `CV-38` redundant test adoption, `TD-7b` production data-directory profile (deferred), `CV-42` CI (IRR side green) and `CV-22`/`CV-32` universe + PIT UI.

### 4.2 IRR user portfolios (fenced)

| Step | Finding |
|---|---|
| 1 Entry point | `/user-portfolios`, `/user-portfolios/:portfolioId` (mounted) |
| 2 Client contract | `frontend/src/api/userPortfolios.ts` |
| 3 Server transport | `frontend/server/user-portfolio-transport.ts` — validates route/method, then **fails closed** |
| 4 Principal/ownership | **ABSENT — no authorized non-authentication owner source** |
| 5 Authorization | `respondOwnerContextUnavailable()` → **HTTP 503** |
| 6 Domain/service | `userPortfolioPort.ts` (interface) — **never called** |
| 7 Persistence | **None reachable**; the first-party G24 HTTP adapter was **removed** |
| 8 Transaction | Contract states one upstream request = one `IMMEDIATE` transaction; **no caller exists** |
| 9 Restart | NA |
| 10 Recovery | NA |
| 11 Cross-repo | Contract constants pin IPD `6828155e…`; no call is made |
| 12 Validation | Contract/port/boundary/2F tests (V) |
| 13 Qualification | **Not qualified; not admitted** |

**Stopping point:** **step 4/5** — at the owner source. **Evidence required to close:** a PA-designated non-authentication ownership source, then a transport that supplies `G2Scope`, then an adapter implementing the port, then qualification, then admission. This is **`CV-20`-adjacent and unresolved**, not a defect.

### 4.3 IPD durable portfolio (G24) — implemented, off-`main`

| Step | Finding |
|---|---|
| 1 Entry point | **None on `main`** — no HTTP server, no route, no IPC consumer |
| 2 Client contract | G24 `parseSaveHoldingsBody` (server module) at `gate-b`/`gate-a` |
| 3 Server transport | `src/server/http-server.ts` (blob `17f9cb8a…`) — **off-`main`** |
| 4 Principal | `src/app_identity/**` — `applicationUserId` + exactly-one-ACTIVE membership + local binding |
| 5 Authorization | `src/server/authorization.ts` — unauthorized ≡ missing (`ResourceNotFoundError`) |
| 6 Domain | `DurablePortfolioStore` |
| 7 Persistence | SQLite (`better-sqlite3`), migration 001/002/003 |
| 8 Transaction | `immediateTransaction`; revision rows + events |
| 9 Restart | Store-level durability tested (`g24_c_*`); **end-to-end process restart not evidenced** |
| 10 Recovery | Revision/event reconstruction at store level |
| 11 Cross-repo | IRR contract *describes* this object; **no live call** |
| 12 Validation | `g24_c_portfolio_durability`, Gate B suites |
| 13 Qualification | **Gate C authority granted for a 7-item read-only subset; not executed** |

**Stopping point:** **step 1** — no runtime entry point, because the whole line is **unmerged** (`gate-a`/`gate-b` only). **Evidence required:** merge/promotion of the lineage under its own act, then Gate C execution, then acceptance, then admission.

### 4.4 IPD Gate B IPC endpoint — read-only by construction

| Step | Finding |
|---|---|
| 1 Entry point | **None packaged** — `startIpcEndpoint()` exists; only tests call it |
| 2 Client contract | v1 framing (4-byte BE length + JSON), 4 operations (incl. `portfolio.save`) |
| 3 Transport | Named pipe (Windows) / UNIX socket (POSIX) |
| 4 Principal | `resolveProvisionedPrincipal()` — exactly one ACTIVE binding |
| 5 Authorization | Four operations total; **no write path** — `portfolio.save` always answers `WRITE_NOT_AUTHORIZED` |
| 6 Domain | `UserPortfolioOperations` |
| 7 Persistence | **None — no write path exists in the code** |
| 8 Transaction | NA (reads only) |
| 9 Restart | Not evidenced |
| 10 Recovery | Stale-socket handling; bind-once fail-closed |
| 11 Cross-repo | IRR adapter exists **only on the IRR gate-b branch** |
| 12 Validation | 41/41 on POSIX |
| 13 Qualification | **Not executed** |

**Stopping point:** **step 1 + Windows realization**. **Evidence required:** a Windows harness run (Gate C), then acceptance; and separately, an admitted consumer.

---

## 5. CROSS-REPOSITORY INTEGRATION MATRIX

| # | Capability/flow | Provider repo and ref | Consumer repo and ref | Contract | Implementation | Runtime wiring | Data flow | Persistence/recovery implications | Validation/E2E evidence | Authority/admission | Current status | Exact remaining gap |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| I-1 | **PIT market-data read** | IPD `np04-governed-persistence-windows` @ `2e11fa3b…` (exports `./pit`) | IRR `main` @ `10584439…` | `PitReadPort` → `PitReadService` → `PointInTimeStore` | V — `ipdPitReadAdapter.ts` | **V — `/api/pit/market-data`** | V — JSON result + provenance projection | Store injected; IRR never constructs/seeds it | V — transport tests; no UI feature | V — IU-5A boundary | **LIVE** | Pin is a branch head only (**no tag/durable ref**) |
| I-2 | **D114 non-production PIT population** | IPD `2e11fa3b…` (`./d114-non-production`) | IRR `main` | `populateNonProductionD114Pit` | V — `nonProductionRuntimePitStore.ts` | P — used by runtime PIT store selection | V — fixture/demo rows | Non-production store only | SOURCE-REPORTED | V — non-production | **LIVE (non-production)** | No qualification of the populated dataset |
| I-3 | **Durable user portfolio** | IPD G24 lineage @ `6828155e…` (never promoted) | IRR `main` | `G2_LINEAGE` constants, routes, header, SQLite profile | **NI — first-party adapter removed** | **NI — 503 before the port** | **None** | Would persist in G24 SQLite | Contract tests only | **NOT ADMITTED** | **NOT CONNECTED** | Owner source + adapter + admission; and an IPD object on a durable ref |
| I-4 | **Gate B local-principal IPC** | IPD `gate-b` @ `cec7080` | IRR `gate-b` @ `6c654be7` | v1 framing + 4 read ops | **Both sides implemented** | **NW — neither side deployed; IPD has no entry point; IRR branch has no PR** | **None** | Read-only; no writes | 41/41 (IPD, POSIX); IRR suite reported | **D-4 both sides rendered** | **IMPLEMENTED, NOT CONNECTED** | Merge/promotion of both branches + Windows qualification |
| I-5 | **Certified analytics ↔ user portfolios** | IRR | IRR | Explicitly excluded by `G-2` §7 | **NA** | **NA** | NA | NA | NA | **Excluded** | **OUT OF SCOPE** | None — exclusion stands |
| I-6 | **Broker holdings (IPD) ↔ IRR portfolio UI** | IPD `main` (BI-07/08) | IRR `main` | None | P — independent implementations | **NI** | **None** | IPD is in-memory on `main`; IRR has its own reference store | Both tested **separately** | **None** | **NOT INTEGRATED** | No shared contract; no admission requested |
| I-7 | **Reports ownership** | IPD G24 | IRR reports transport | `REG-11` Option C | NI — removed by R4-B | NI — `/api/reports*` → 503 | None | NA | Fence tests V | **DEFERRED (Option C)** | **NOT CONNECTED** | Own disposition act (`R1`/`R2`/`R3`/`F-7`) |
| I-8 | **Governance artefacts** | IPD `evidence/np04/**` | IRR `docs/integration/**` + tracker | Referenced, not imported | V — cited by digest | NA | NA | NA | Read-only citations | V | **RECORDED** | IRR tracker does not yet carry Gate A/B/C sections |
| I-9 | **Cross-repo pin durability** | IPD branch heads `2e11fa3b`, `6828155e` | IRR dependency + contract | git dependency by SHA | V | V | V | A force-push/unreachable ref would break builds | `npm ci` proven | **AP — no tag act** | **P — fragile** | Tag/durable ref act (`CV-25`) |

**Independently-existing but unconsumed:** I-3, I-4, I-6, I-7. **Connected and live:** I-1, I-2. **Excluded by decision:** I-5.

---

## 6. OUTSTANDING-WORK REGISTER (DEDUPLICATED)

Existing identifiers preserved (`CV-*` from the IRR §16.4 register; `XV-*` cross-repository). New items are `INV-*`. **No item is closed by this inventory.**

| Work ID | Capability | Repo/owner | Current state | Exact gap | Blocking dependency | Required next action | Required authority | Completion evidence | Tracker ref |
|---|---|---|---|---|---|---|---|---|---|
| `CV-20` | I-3 / row 41 | JOINT | Open, decision required | No authorized non-authentication ownership source | **Governance/authority** | PA designates or declines an owner source | PA act | Designated source + transport supplies `G2Scope` | IRR §16.4; §16.5 |
| `CV-21` | I-7 Reports | IRR | Blocked (`REG-11` Option C) | No `R1` owner source, `R2` contract, `R3` admission, `F-7` qualification | **Governance** | Own disposition act | PA act | Reports act + acceptance | IRR §16.4, §11 |
| `CV-22` | Rows 34/35 durable surfaces | IRR | **DECISION REQUIRED** | Only 13 reference rows addressable; `POST /api/watchlists/:id/items` → `404 governed-row-not-found` for real securities | **PA decision** | Decide governed-universe scope (resolvable on IPD `main` D05 per `G-2` §2) | PA act | Widened universe + tests | IRR §16.4.2; `XV-9` |
| `CV-23` | Gate A (`src/persistence` convergence) necessity | JOINT | **DECISION REQUIRED** | Its only consumer edge was removed by `CV-09` | **PA decision** | Decide whether Gate A is still required | PA act | Recorded disposition | IRR §16.4.2 |
| `CV-24` | Small standing undecideds | IRR | **DECISION REQUIRED** | `F6_INVENTORY_AUTHORIZED` undecided; `TD-7b` production data-dir profile deferred; restart-proof adoption bundled here | **PA decision** | Decide each | PA act | Recorded dispositions | IRR §16.4.2 |
| `CV-25` | I-9 pin durability | JOINT | Open | Pin reachable only as a branch head; no tag | **Decision** | Tag/durable-ref act | PA act | Tag + verified `npm ci` | IRR §16.4; §18 row 45 |
| `CV-30`/`CV-31` | Operator runbook / `npm run` start path | IRR | **COMPLETE 2026-10-14** | — | — | — | — | `docs/OPERATOR_RUNBOOK.md`; `server:dev` script | IRR §16.4.1/§16.4.3, §16.16 |
| `CV-32` | PIT seam has no UI (row 40) | IRR | **OPEN** | `/api/pit/market-data` and `src/api/pit.ts` exist; no feature consumes them | **`CV-22`** | Mount a bounded PIT panel **or** record the seam API-only | PA display decision | PIT UI or recorded disposition | IRR §16.4.3, §16.38 |
| `CV-35` | Row 26 IPD false-green runner | IPD | **Open — actual defect** | `npm test` can report `0` tests, exit `0` | **Authority to change `package.json`** | Admit a bounded runner fix | Separate IPD act | Script fails on empty test set | IRR §16.4; `ipd:package.json` |
| `CV-36` | Row 51 IPD xlsx tracker | IPD | **Open — stale** | 59/59 `NOT STARTED` against certified evidence | Documentation authority | Reconcile (see §8.1) | Existing doc authority | Dates/statuses corrected | IRR §16.4 |
| `CV-38` | Additional recovery proof (row 31) | IRR | **OPEN** | A *test-only* restart proof sits on `arena/a2df3b85@6f521f9` (7 ahead / 149 behind). **The capability's restart qualification is already recorded under `CV-04`** — redundant evidence, not a missing capability | **`CV-24` decision** | Adopt as docs+test PR **or** record permanent non-adoption | PA act | Adoption or recorded decision | IRR §16.4.3, §16.38 |
| `CV-39` | Row 20 broker-ingestion persistence | IPD | **Deferred** | IPD broker `PortfolioStore` is in-memory on `main`; missing part is durable persistence, not admission | Deferred by decision | — | — | — | IRR §16.4 |
| `CV-41` | Nav honesty | IRR | **OPEN** | `/research` and `/intelligence` (plus children) render `FeatureNotImplemented` | Implementation | Build or relabel | Implementation act | Nav matches surfaces | IRR §16.4.3 |
| `CV-42` | CI coverage | JOINT | **OPEN — narrowed to the IPD half** | **IRR `.github/workflows/ci.yml` exists and ran green (recorded `cefb2dd`); IPD has no workflow** | IPD infra decision (`§20` Stage 3) | Create the IPD workflow under its own act | IPD infra act | Green IPD CI run | IRR §16.4.3, §16.18 |
| `CV-40` | NP-12 `A6-IMPL-10` producer convergence | IRR | **DEFERRED (Option B)** | Screener runs on the accepted adapter, not a converged producer | PA accepts Option B permanently or commissions convergence | Disposition | PA act | Recorded acceptance | IRR §16.4.3 |
| `CV-43` | `D115` runtime | IRR | **OPEN** | `d115-runtime.ts` referenced only by its own test | **Decision** | Retain-unwired / retire / fold | PA act | Recorded | IRR §16.4.3, §16.38 |
| `CV-50` | `P-4 → P-6 → P-8` chain | JOINT | **TERMINAL — scope-closed** | Exists only to bind the owner to G24 through a verified OIDC credential, incompatible with the accepted scope | — | none — retained record | — | — | IRR §16.4.4 |
| `CV-51` | Reports UI | IRR | **Blocked (active)** | No Reports UI | `CV-21` | After `CV-21` | PA act | UI + admission | IRR §16.4 |
| `CV-52` | Reports lineage | IRR | **Blocked (active)** | Branch-only lineage, `H-4`/`H-16` conflict | **Governance errata** | PA errata | PA act | Errata + disposition | IRR §16.4 |
| `CV-53` | Macro D89/D91 display | IRR | **COMPLETE/ACCEPTED — display contract** | No gap within accepted scope | — | — | — | `CV-CORR-15/22` | IRR §16.4.1, §16.27, §16.34 |
| `INV-01` | Row 24 IPD Gate B | IPD | **Implemented, unmerged, unqualified** | 15 files on `gate-b`; no Windows run; no admission | **Qualification** | Execute Gate C 7-item subset on Windows | **Granted** (`D-GC`) | Gate C evidence + acceptance act | This artifact; `ipd:evidence/np04/…DECISION_RENDERED…` |
| `INV-02` | Row 42 IRR Gate B adapter | IRR | **Branch-only, no PR** | 8 files at `6c654be7`; not on `main`; unconnected to an IPD endpoint | **Integration + merge authority** | Open a PR and obtain merge act, after IPD endpoint exists | IRR act | Merged on IRR `main` + connected run | This artifact |
| `INV-03` | I-4 connectivity | JOINT | **Not connected** | Both sides implemented, neither deployed; IPD has no entry point | `INV-01`, `INV-02` | End-to-end Windows run | Qualification + merge acts | Cross-repo E2E evidence | This artifact |
| `INV-04` | Row 22/23/25 promotion | IPD | **Off-`main`** | G24/identity/server lineage never promoted | **Merge authority** | Promotion act | PA act | `main` carries the lineage | `ipd:evidence/np04/**` |
| `INV-05` | Gate C Q5–Q8 | IPD | **Deferred** | Write-dependent items blocked on Gate E | **Gate E** | Gate E act | PA act | Write policy + qualification | `ipd:evidence/np04/…PROCEDURE…` §3 |
| `INV-06` | Gate C G-7 (Q8 meaning) | IPD | **Unresolved** | "Stop both processes" undefined | **Decision** | PA defines or permanently defers Q8 | PA act | Recorded definition | `ipd:evidence/np04/…DECISION_RENDERED…` §5.7 |
| `INV-07` | IRR tracker staleness | IRR | **Open** | Tracker ends at §16.38; no Gate A/B/C sections | Documentation authority (IRR) | Apply prepared addendum (§10.3) | IRR doc act | Tracker updated + verified | This artifact |
| `INV-08` | Row 47 PR #114 | IRR | Open PR | Browser broker preview unmerged | Merge authority | Review/merge or close | PA act | PR resolved | PR #114 |
| `INV-09` | Row 33 V-6 / waivers | IPD | **Recorded, not proof** | 4 waivers; V-6 send half NOT TESTED | **Decision** | Confirm out-of-scope (done in D-GC-D) | PA act (done) | Recorded | `ipd:evidence/np04/…` |
| `INV-10` | Row 51 IPD markdown trackers | IPD | **Absent** | No capability matrix markdown in IPD | Documentation | This artifact supplies it | Existing doc authority | This artifact | This artifact |
| `INV-11` | Row 20 E2E durability | IPD | P | Browser E2E verified for BI-07/08; **not** across restart | Implementation | Restart test | IPD act | Restart evidence | `ipd:evidence/bi07/**` |
| `INV-12` | Row 39 macro live E2E | IRR | **V** | Live-source established on operator Windows | — | — | — | `CV-CORR-19` | IRR §16.31 |

**Classification summary.** **Actual defect/failure: 1** (`CV-35`). **Missing evidence: 2** (`INV-03`, `INV-11`). **Incomplete implementation: 4** (`CV-41`, `CV-43`, `INV-01`, `INV-02`). **Integration/wiring gap: 5** (`I-3`, `I-4`, `I-6`, `I-7`, `INV-03`). **Governance/authority/external: 8** (`CV-20`, `CV-21`, `CV-22`, `CV-23`, `CV-24`, `CV-25`, `INV-04`, `CV-42`). **Deferred: 6** (`CV-39`, `CV-40`, `INV-05`, `INV-06`, `TD-7b`, `CV-24`-bundled restart adoption). **Documentation staleness: 5** (`CV-32`, `CV-36`, `CV-38`, `INV-07`, `INV-10`). **Terminal: 1** (`CV-50`). No item is closed, downgraded, or upgraded by this inventory.

---

## 7. GOVERNANCE AND AUTHORITY ASSESSMENT

### 7.1 What exists versus what is authorized

| Object | Exists | Authorized | Note |
|---|---|---|---|
| IPD `main` data plane (contracts, PIT, quality, ingestion, identity) | V | V | Non-production |
| IPD BI-07/08 broker import + browser lifecycle | V | V | **Accepted / browser verified** |
| IPD G24 durable portfolio + identity + server | V — `gate-a`/`gate-b` | **V — Gate A/B acts** | **Never promoted to `main`** |
| IPD Gate B IPC implementation | V — `cec7080` | **V — D-4 ACCEPT** | **Unmerged; unqualified** |
| Gate C execution (7 read-only items) | Procedure + act | **GRANTED — NOT EXERCISED** | `D-GC` rendered 2026-10-17 |
| Gate C Q5–Q8 | Deferred | **NOT AUTHORIZED** | Requires Gate E |
| Gate D route admission | — | **NOT GRANTED** | IRR 503 fence stands |
| Gate E write policy | — | **NOT GRANTED** | Blocks Q5–Q8 |
| P-6 / P-8 | — | **NOT GRANTED** | — |
| Production | — | **NOT AUTHORIZED (both repos)** | — |
| IRR durable user portfolio | Port + contract | **NOT AUTHORIZED to operate** | 503 |
| IRR Gate B adapter | V — branch | **IRR D-4 rendered** | No PR, unmerged |
| Merges | — | **PR #8, #117, #114 all open** | No merge authority exercised |

### 7.2 Decisions pending or withheld

1. **`CV-20`** — the non-authentication ownership source (blocks the entire IRR user-portfolio line).
2. **`CV-25`** — pin durability (tag/durable ref) for `2e11fa3b` / `6828155e`.
3. **`INV-04`** — promotion of the G24 lineage to IPD `main`.
4. **`INV-02`** — IRR Gate B branch merge (needs a PR first).
5. **`CV-21`/`CV-51`/`CV-52`** — Reports (`REG-11` Option C stands; `H-4`/`H-16` errata).
6. **`CV-22`/`CV-23`/`CV-24`** — universe scope, Gate A necessity, `F6`/`TD-7b`.
7. **`INV-06`** — Q8 process definition.
8. **Gate C Q5–Q8** — Gate E.

### 7.3 Qualification and release restrictions

- **No item in either repository is "qualified" in the formal sense** except where an acceptance record explicitly says so (`CV-53` display contract; BI-07/BI-08; P13–P17 certifications; `program-v1.1`).
- Gate C authority exists for Q1–Q4, Q9–Q11 and **has not been exercised**; its eventual result must read `PARTIAL — Q5–Q8 DEFERRED`.
- **Production is not authorized in either repository.** All releases are non-production.

### 7.4 Explicitly deferred work

`CV-39` (IPD in-memory store), `CV-24 TD-7b`, `INV-05` (Gate C Q5–Q8), `INV-06` (Q8 meaning), `CV-21` (Reports Option C), and the whole `P-4 → P-6 → P-8` chain (closed as out of scope under `GC-P2-SCOPE-CORR-01`).

---

## 8. TRACKER RECONCILIATION

### 8.1 IPD xlsx tracker (59 rows, all `NOT STARTED`)

**Finding.** The workbook is a **program-plan** artefact. Its `Status` column reads `NOT STARTED` for **59/59** rows, including `P13-03` (portfolio), `P13-05` (screener), `P04` (security master) and `P08` (PIT) — all of which have certified implementations and evidence on IPD `main`.

**Disposition.** The workbook is **preserved byte-unchanged** as the historical plan (binary artefact; rewriting 59 status cells would be a destructive edit with no auditable diff). Its staleness is **recorded here and in `CV-36`**, and this artifact is the **dated status record** for those rows.

**Mapping established** (plan row → actual capability → evidence): `P01-*`→rows 3; `P02-*`→4; `P03-*`→5; `P04-*`→6; `P05-*`→7; `P06-*`→8; `P07-*`→9; `P08-*`→10; `P09-*`→11; `P10-*`→12; `P11-*`→13; `P12-*`→14; `P13-01…15`→rows 1, 2, 21, 34, 35, 36, 31, 33, 37, 32, 27, 33, 26, 45, 2.

### 8.2 IRR canonical tracker

**Finding.** `IIPS_V3_E2E_MASTER_TRACKER_…_2026-10-13.md` is the live canonical tracker. Its last section is **§16.38 (NP-18, 2026-10-16)**. It contains **§18 (17-column matrix, 51 rows)** and **§16.4 (`CV-01`…`CV-53`)**.

**Gap.** It does **not** carry: Gate A provisioning, Gate B implementation (IPD or IRR), D-4 (either side), the Gate C readiness assessment, the Gate C procedure, or the **rendered `D-GC` act**. Its §18 rows 30–34 predate the D-4/Gate C rendering.

**Disposition.** **Not edited in this task** — see §10.3 for the exact reason and the prepared addendum.

### 8.3 Status corrections established by evidence

| Tracker claim | Evidence | Corrected status |
|---|---|---|
| IPD xlsx `P13-05` NOT STARTED | `ipd:evidence/p13` `CERTIFIED`; `MultiFactorScreenerSurface` | **Implemented / certified** |
| IPD xlsx `P13-03` NOT STARTED | store port + workspace + 29 tests | **Implemented (non-production)** |
| IRR §18 rows 30–34 "portfolio decision pending" | D-4 rendered; Gate C authority granted | **Authority granted for 7-item read-only qualification; execution not started** |
| "IRR PR #117 open and unmerged" (transferred) | Verified | **Correct — 8 docs files, open** |
| Transferred "IRR implementation commit `6c654be7`" | Verified | **Correct — but it is on a branch with NO PR**, not in #117 |
| Transferred "IRR 868/868 ×2" | Not re-run | **SOURCE-REPORTED** — not independently verified |

---

## 9. RELEASE-READINESS ASSESSMENT

| Layer | Status | Basis |
|---|---|---|
| IPD data plane (offline, `main`) | **Verified, non-production** | 19 modules + suites + P13–P17 certifications |
| IPD broker import / portfolio UI (`main`) | **Accepted, browser-verified, non-production** | BI-07-CERT; BI-08 charter |
| IRR application (`main`) | **Verified, non-production released `v1.2.0`** | 27 routes; macro live E2E; durability journal |
| IPD durable portfolio line | **Not releasable** — off-`main` | Exists only on `gate-a`/`gate-b` |
| IPD Gate B IPC | **Not releasable** — unmerged, unqualified | 41/41 POSIX only |
| IRR Gate B adapter | **Not releasable** — branch, no PR | 8 files |
| Cross-repo durable portfolio | **Not operational** — 503 by design | No owner source |
| Cross-repo PIT | **Operational (non-production)** | Pin `2e11fa3b` |
| Production | **NOT AUTHORIZED** | Both repositories |

**End-to-end readiness.** The **single-owner workbench is usable today** on IRR `main` (executive, portfolio reference, research, screener, intelligence, evidence, watchlists/collaboration/settings, macro) with the IPD PIT seam live. It is **not** a portfolio-of-record system: the durable user-portfolio path is fenced at 503, the IPD durable lineage is unmerged, and the Gate B IPC has no admitted consumer.

**Actual blockers:** `CV-20` (owner source), `INV-04` (lineage promotion), `INV-01`/`INV-02` (qualification and merge), `CV-25` (pin durability). **Missing evidence:** `INV-03` (cross-repo E2E), `INV-11` (IPD restart E2E). **Infrastructure:** `CV-42` (IPD CI only).

---

## 10. PUBLICATION, VALIDATION AND LIMITATIONS

### 10.1 Validation performed

| Check | Result |
|---|---|
| Both repositories inspected read-only | **V** — IPD 36 heads / 4 tags; IRR 128 heads / 2 tags |
| Matrix column count and order | **V — 17 columns** exactly as specified |
| Every row has an Evidence Anchor | **V** — all 51 rows |
| Integration matrix rows | **9 boundaries**, each naming provider ref and consumer ref |
| Register deduplicated | **V** — 32 rows: 20 existing `CV-*` items (IDs and semantics matched to IRR §16.4.1–§16.4.4) + 12 `INV-*` |
| No status upgrade without evidence | **V** — branch-scoped rows labelled `branch-scoped`; transferred IRR facts labelled `SOURCE-REPORTED` |
| No implementation/test change | **V** — add-only documentation commit |
| Gate C not started | **V** — no endpoint, no probe, no fixture |

### 10.2 Publication

This artifact is published additively to `refs/heads/arena/21c63aef-iips-production-market-data` (PR #8, open, unmerged). Commit/blob identities are recorded in the final report and in §11's remote verification.

### 10.3 IRR-side tracker update — NOT APPLIED (precise blocker)

**Blocker.** The IRR tracker lives on IRR `main`. Changing it requires (a) an IRR-side branch and PR, and (b) an IRR merge authorization — the established pattern (`PR #118` was merged only after *"request explicit merge authorization"*). **No IRR act exists for this inventory**, and this session's standing instruction is to push only to the IPD session branch. Applying it unilaterally would violate the repository boundary that every prior act has preserved.

**Prepared addendum** (ready to apply under an IRR documentation act, as a new §16.39):

> **§16.39 — Complete capability inventory and tracker reconciliation (`INV-CORR-01`), 2026-10-17.** Read-only cross-repository inventory at IPD `70b24f0` / `2ded0e98` / `cec7080` / `2e11fa3b` and IRR `10584439` / `6c654be7`. New facts reconciled: **Gate A provisioned** (IPD `2ded0e98`); **Gate B implemented** on IPD `cec7080` (15 files, 41/41 POSIX) and on IRR `6c654be7` (8 files, **no PR**); **D-4 rendered ACCEPT** both sides; **Gate C readiness assessment + procedure published** (IPD `b28bdc9`, `34fcafc`); **`D-GC` rendered 2026-10-17** — seven-item read-only execution authority (Q1–Q4, Q9–Q11), **Q5–Q8 deferred**, **not executed**. Register impact: `CV-35/36/38/41/42/43/51/52` unchanged; **new `INV-01`…`INV-12`**; row 48 (pin durability) and row 45 unchanged. **No decision rendered; no fence lifted; no merge claimed.**

### 10.4 Inspection limitations

| Limitation | Consequence |
|---|---|
| **IRR test suites were not executed** | "868/868", "770 tests", "13/13 route probes" remain **source-reported**, not re-verified. Confidence: high for code presence, lower for current pass state |
| **IPD test suites were not re-run** | Gate B `41/41` and `823/823` are from the recorded 2026-10-17 run on `cec7080`, not re-executed here |
| **No browser/UI run** | E2E cells cite existing acceptance records, not a fresh run |
| **IRR inspected at a shallow clone** (`--filter=blob:none`, `main` + gate-b; **128 heads**, 2 tags) | Some branch-only lineages (`a2df3b85`, reports branches, revoked auth stack) were reviewed **by ref listing and tracker record**, not full trees |
| **IPD 36 heads** | Only `main`, `gate-a`, `gate-b`, `np04-…`, and the session branch were read in tree; the other 31 `arena/*` heads were enumerated but not diffed |
| **Windows qualification environment absent** | No Gate C item could be executed even if authorized |
| **xlsx not rewritten** | Plan tracker remains stale (documented, `CV-36`) |
| **IRR tracker not edited** | §10.3 blocker |

---

## ADDENDUM A1 — 2026-10-19: IPD provenance & eligibility decision (C1–C7) and Security Master integrity convergence

> Additive dated entry. Sections 1–10 above are preserved unchanged as the 2026-10-17 record.
> No existing row status is re-graded by this addendum except where §A1.2 cites new merged
> evidence. IPD-only: **no IRR record or tracker was modified** (IRR is read-only context).

### A1.1 Decision reference (reconciliation of the published C1–C7 decision)

| Field | Value |
|---|---|
| Operative decision | `evidence/cross-repository/IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_PROGRAM_AUTHORITY_DECISION_2026-10-19.md` — `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-PROGRAM-AUTHORITY-DECISION-2026-10-19-01` — **APPROVED BY PROGRAM AUTHORITY**, C1–C7 all present |
| Provenance chain | Request `…-DECISION-REQUEST-2026-10-19-01` (PR #26, merge `02a5803`); review `…-DECISION-REVIEW-2026-10-19-01` and decision (PR #27) |
| Publication | PR #27 **MERGED** 2026-10-19T17:59:08Z → `main` `77f843217593dfd0b33a106f27bafb432aa0b82d`; PR CI run `39298654094` SUCCESS; post-merge `main` CI run `39298753519` SUCCESS, **565/565** executed |
| Implementation act | `evidence/cross-repository/IIPS_V3_IPD_SECURITY_MASTER_INTEGRITY_IMPLEMENTATION_ACT_2026-10-19.md` — `IIPS-V3-IPD-SECURITY-MASTER-INTEGRITY-IMPLEMENTATION-ACT-2026-10-19-01` |

### A1.2 Security Master integrity findings register

| Finding | Capability row | State | Evidence | Note |
|---|---|---|---|---|
| **B1** unsupported `REAL`/`GOOD` classification (CHAR-A-01/02) | Row 6 (identity / security master) | **CORRECTED** | SMI-01, SMI-02, SMI-09, SMI-10, SMI-12; CHAR-A-01/02 revised | Origin `UNKNOWN` / `UNCLASSIFIED`; quality derived; provenance bound to corpus revision |
| **B2** `faceValue ?? 1` / `currency ?? INR` (CHAR-B-01/03) | Row 6 | **CORRECTED** | SMI-03…SMI-05, SMI-10, SMI-11; CHAR-B-01/03 revised | Missing/invalid → `null` + status + `PARTIAL`; reference fixture gap disclosed |
| **B3** historical descriptor returned as current (CHAR-C-02) | Row 6 | **CORRECTED — disclosure semantics**; versioning **not implemented** | SMI-06, SMI-07, SMI-11; CHAR-C-02 revised | UTIBANK@2005 → `OUTSIDE_RECORD_EFFECTIVE_WINDOW`, `PARTIAL`; no historical accuracy claimed (decision §5.1) |
| **B4** AIIL `RULING_3` vs. concurrent scrip codes (CHAR-D-01) | Row 6 | **UNRESOLVED — authoritative evidence insufficient** | SMI-08 guard; CHAR-D-01 unchanged | Requires BSE listing history for `539177`/`543989` (ISIN `INE206F01022`); no data mutation (decision §5.2) |
| Per-record real-market classification / roster | Row 6 | **UNRESOLVED — evidence insufficient** | C2 | 52/2,198 not treated as per-record truth |
| `CV-22` (IRR) | Rows 34/35 | **Unchanged — OPTION C: DEFER EXPANSION PENDING DEFINED PREREQUISITES** (IRR `main@ad008e45`, read-only) | IRR decision record (read-only) | Supersedes this tracker's 2026-10-17 "DECISION REQUIRED" wording *as a reference only*; IRR's own tracker is not edited from IPD. 13-row sector reference + `404 governed-row-not-found` preserved |

Statuses of all other rows (`CV-20`, `CV-23`…`CV-53`, `INV-01`…`INV-12`) are **unchanged** by this addendum.

### A1.3 Boundaries recorded

Single-user personal-use scope unchanged; no auth/RBAC/persistence/service/API added; no IPD-to-IRR write; CV-22 Option C preserved; D05 corpus/manifest byte-identical (SHA-256 `7f53540b…a2b74b5`, 2,250 records); no consumer admission; `CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` not made mandatory. Proposed IRR handoff is documented in the implementation act §8 only.

### A1.4 Publication and remote verification of the implementation

Recorded after merge from authoritative remote reads (`git ls-remote`, GitHub checks API, `git show origin/main:<path>`):

| Check | Result |
|---|---|
| Implementation PR | **#28** `fix(d05): evidence-based Security Master provenance, descriptor & temporal semantics (C1–C7, B1–B4)` — head `4491ad272ece2c4f05397765c06360a1fbbf623a`, base `main@77f8432` |
| PR CI | run `39301865120` `typecheck · build · test` **SUCCESS**; `executed test count` **SUCCESS — 577 tests executed, 577 passed, 0 failed** |
| Merge | **MERGED** 2026-10-19T18:22:50Z (merge commit, no history rewrite, no check bypass) → `main` = `bdc3caa9172eb8957efd07c06f09db0718d36e17` (parents `77f8432` + `4491ad2`) |
| Post-merge `main` CI | run `39302286871` (push, `bdc3caa`) **SUCCESS**; `executed test count` **577 / 577, 0 failed** |
| Merged files on `main` | All 12 changed paths present on `bdc3caa` with blobs identical to PR head `4491ad2` (resolver `b570f273…`, UI08 builder `895d5a27…`, `security_master.ts` `60030e0c…`, `governed_fixture_master.ts` `7dac59a8…`, `types.ts` `47a40c7f…`, `SecurityMasterSurface.tsx` `072dc58b…`, SMI suite `85a3d93e…`, CHAR suite `a45eb7ad…`, P12 `97770a64…`, SM `d5c87d84…`, implementation act `f2fa7341…`, this tracker `60826937…`) |
| Resolver on `main` | `'REAL'` literal occurrences in `src/transports/object_resolver.ts`: **0** |
| D05 governed data on `main` | `git diff 77f8432 bdc3caa -- src/identity/d05_broad_universe_data.ts evidence/operator_drop/` → **empty**; deposited JSON SHA-256 `7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5` (= manifest) |
| IRR | No write performed; IRR `main` read-only reference `ad008e45…` |

**Status after verification:** B1, B2, B3 (disclosure semantics) — **completed and remotely verified on `main@bdc3caa`**. B4 and per-record origin classification — **unresolved, authoritative evidence insufficient**. Historical descriptor versioning — **not authorized / not implemented**. CV-22 — **unchanged, Option C**. This A1.4 entry is itself published by a follow-up documentation PR; its presence on `main` is verified by the post-merge read reported in that PR's closure.

*End of inventory.*

---

## ADDENDUM A2 — 2026-10-19: AIIL identity reconciliation and provenance/quality follow-up

> Additive follow-up to A1.2/A1.4. Those sections remain an accurate record of the earlier implementation state, when B4 had not yet been supported by exchange filings. This addendum records the subsequent evidence-backed runtime correction and Workstream B audit. No unrelated capability-row status is re-graded.

### A2.1 Follow-up evidence and decision

| Field | Result |
|---|---|
| Initial remote baseline | `origin/main` and `git ls-remote` both verified at `29b8351873866eeaafd9b22616458cb60af12e50` before investigation (PR #29). |
| External evidence dossier | `evidence/cross-repository/IIPS_V3_IPD_AIIL_IDENTITY_AND_PROVENANCE_FOLLOWUP_2026-10-19.md`; BSE-hosted issuer/exchange filings and current BSE security details are linked there. |
| AIIL source history | Original wrong association entered with the D05 deposit at `407d9c7`; no independent `RULING_3` decision record or linked listing-history evidence exists in the fetched IPD history. |
| Identity finding | BSE `543989` identifies Sai Silks (Kalamandir), ISIN `INE438K01021`; BSE/issuer records pair Authum ISIN `INE206F01022` with BSE `539177`. The prior “543989 current / 539177 historical” assertion is unsupported and the `543989`→Authum runtime association is incorrect. |
| Runtime correction | PR #30 adds `IPD-AIIL-BSE-SCRIP-CORRECTION-2026-10-19-001`: runtime Authum projection keeps `539177`, excludes `543989`, and fails closed for the Sai Silks code/ISIN/symbol because Sai Silks is not in D05. |
| D05 source | Deposited JSON, generated TS mirror and manifest remain unchanged and byte-identical. No extra issuer, new manifest/checksum, listing-specific date, or `effectiveTo` was added. |
| `539177` end date | No authoritative `effectiveTo`/cessation date established. The latest BSE filing reviewed (2026-10-10) still uses `539177`/`AIIL`; no end date is inferred. Exact original BSE listing date remains unknown; evidence establishes the code/issuer relationship by the FY 2015–16 BSE annual report. |
| Ruling semantics | No standalone governing `RULING_3` text was found. The as-deposited manifest label is retained as historical metadata, not treated as an authoritative ruling. |

### A2.2 Follow-up findings register

| Finding | Capability area | Current disposition | Evidence / note |
|---|---|---|---|
| **B4 — AIIL scrip association** | Row 6 / D05 identity | **Runtime mapping corrected; listing-date semantics partially unresolved** | PR #30 runtime overlay excludes `543989` from Authum. `539177` remains and is not described as historical. No unsupported listing start/end date was introduced. Source D05 and manifest are preserved. |
| **C1/C2/C3 — remaining `REAL` assertions** | Lineage, UI view models and broker provenance | **Corrected in audited paths** | `lineage_verifier`, UI07/UI09, and broker-import/portfolio hash metadata no longer stamp unsupported `REAL`; the `REAL` type member remains available for future evidence-backed use. |
| **Quality and missing-value assertions** | UI06/UI07/UI09/UI10/UI13, transport, envelope, D03 comparison inputs, portfolio import | **Corrected in scoped paths** | Good is derived/rolled up, or omitted quality fails to `UNAVAILABLE`; UI09 missing comparison values remain null/partial, UI07 missing factors do not become `1.0`, and empty UI paths do not assert `GOOD`. Other validation/freshness-derived `GOOD` controls are retained. |
| Per-record real-market classification / eligibility roster | Row 6 / C2/C7 | **Unresolved — authoritative per-record evidence still insufficient** | This follow-up does not create an origin roster or consumer-admission decision. |
| `CV-22` (IRR) | Rows 34/35 | **Unchanged — OPTION C: DEFER EXPANSION PENDING DEFINED PREREQUISITES** | No IRR write. Existing 13-row governed sector-reference behavior and `404 governed-row-not-found` remain unchanged. |

### A2.3 Validation and preserved boundaries

| Check | Result |
|---|---|
| Focused Workstreams A–C regressions | **164/164 passed** |
| Full guarded test suite | **584/584 passed, 0 failed across 90 suites** |
| Typecheck | `npx tsc --noEmit` — **0 errors** |
| Build | `npm run build` (TypeScript + Vite) — **SUCCESS**; existing Vite >500 kB chunk advisory only |
| Frontend checks | Vite production bundle, shell security-master/UI06 route, P13 view-model and portfolio UI tests passed |
| D05 corpus/manifest | JSON, TS mirror and manifest diff from baseline — **empty**; the new mapping overlay is runtime-only |
| Personal-use architecture | Single-user/session-only behavior preserved; no auth/RBAC/persistence/service/consumer integration added |
| IRR | **No writes** of any kind |

### A2.4 Publication and remote verification of the implementation

| Check | Result |
|---|---|
| Implementation PR | **#30** `fix(ipd): reconcile AIIL identity and provenance quality`, head `2bf4def8567a7c2225a51138d0e7416f0e006b13`, base `main@29b8351` |
| PR CI | run `39310571312` `typecheck · build · test` **SUCCESS**; executed-test-count check `118258956115` reports **584/584, 0 failed** |
| Merge | **MERGED** 2026-10-19T19:24:10Z → `main` = `63b8beecc395ada7246c6dbab80fa9a45394c7c2` |
| Post-merge `main` CI | run `39310683617` **SUCCESS**; executed-test-count check `118259419195` reports **584/584, 0 failed** |
| Remote `main` ref | `git fetch origin main` and `git ls-remote origin refs/heads/main` both returned `63b8beecc395ada7246c6dbab80fa9a45394c7c2` after merge |
| Merged files | All 44 changed paths in PR #30 are blob-identical on `main@63b8bee` to PR head `2bf4def` (`git diff --exit-code 2bf4def 63b8bee -- <changed paths>` empty) |
| D05 source integrity | `git diff 29b8351 63b8bee -- src/identity/d05_broad_universe_data.ts evidence/operator_drop/d05_security_master_broad_universe.json evidence/operator_drop/d05_security_master_manifest.json` — **empty** |

**Tracker reconciliation:** this addendum is additive. Historical A1 findings and all unrelated row statuses are preserved; current B4, Workstream B and boundary statuses are recorded above. The tracker addendum itself is published through the current IPD follow-up documentation workflow; final `main` presence is verified in the completion report.

*End of addendum A2.*

---

## ADDENDUM A3 — 2026-10-19: IPD dependency security audit and compatible remediation

> Additive audit reconciliation only; historical A1/A2 and unrelated capability statuses are preserved. **Partial remediation — two moderate npm package findings remain unresolved.** A passing build/test suite is not vulnerability closure.

### A3.1 Baseline and advisory register

Verified `git fetch origin main`, HEAD and `origin/main` at `a5c3069abac17cf572dce012729d823fcb04fd50` (PR #31); initial worktree clean. Audit date: **2026-10-19 UTC**, Node **22.22.3**, npm **10.9.8**; CI uses Node 22 and lockfile-v3 `npm ci`. Current baseline audit repeats **2 moderate, 1 high** package findings. These are three distinct GHSA identifiers: two advisories on `react-router`, its affected `react-router-dom` parent, and one source-map advisory; npm's package count is not an advisory-ID count.

| Identifier / severity | Installed dependency path | Current disposition / rationale |
|---|---|---|
| `GHSA-68fv-2mgg-jv7q` / `CVE-2026-93749`, **high** | IPD → `vite@8.3.0` → `postcss@8.5.28` → `source-map-js@1.2.1` | **Remediated to 1.2.2**, first patched version (`>=1.0.0 <1.2.2` affected). Indexed-source-map offsets can cause event-loop denial of service. Build/dev tooling path is reachable when processing hostile CSS maps; no browser runtime inclusion or market-data-to-source-map path found. Compatible with PostCSS's existing `^1.2.1` constraint. |
| `GHSA-wrjc-x8rr-h8h6` / `CVE-2026-53669`, **moderate** | IPD → direct `react-router-dom@6.30.6` → transitive `react-router@6.30.6` | **Unresolved installed vulnerability.** Backslash open-redirect bypass affects `>=6.0.0 <7.18.0`; first patched 7.18.0. Actual app navigation uses checked-in internal NavLink paths and fixed `/portfolio` fallback; no attacker-derived navigation target identified. Runtime dependency remains affected; not called fixed/unconditionally safe. |
| `GHSA-337j-9hxr-rhxg` / `CVE-2026-53666`, **moderate** | Same runtime Router path | **Not applicable to current declarative execution mode, but unresolved in installed versions/audit.** SSR hydration constructor injection affects `>=6.4.0 <7.18.0`; first patched 7.18.0. App uses `createRoot` + `BrowserRouter`/`Routes`, no Framework/Data Mode manual SSR hydration error path. |

**Smallest supported change:** only `package-lock.json` source-map-js version, resolved tarball and integrity change; `package.json`, all other package entries, application sources, tests, frontend, CI and deposited data remain unchanged. Used targeted `npm update source-map-js --package-lock-only --ignore-scripts --no-audit --no-fund`, followed by clean `npm ci`. No force, override, fork, suppression or broad upgrade.

**Router blocker:** latest published v6 is already installed (`6.30.6`); its parent pins the child exactly. npm proposes breaking `react-router-dom@7.18.4`. No compatible v6 backport exists at inspection. Overriding the exact child to v7 or changing only `@remix-run/router` is not a supported fix. Smallest remaining action: consume a vendor v6 backport if published, otherwise separately scope/validate the supported paired v7 migration (patched floor 7.18.0). Reassess before introducing untrusted navigation targets or SSR. **Do not mark all advisories resolved.**

### A3.2 Validation and evidence

Dossier: [`evidence/dependency-security/2026-10-19/README.md`](../dependency-security/2026-10-19/README.md). Contains raw machine/human audit results, GitHub advisory snapshots, before/after installed trees and exact one-package lockfile delta, replayable focused tests and full verification output (large repetitive application logs compressed losslessly).

| Check | Result |
|---|---|
| Reproducible install | `npm ci --no-audit --no-fund` **exit 0** |
| Post-remediation full audit | **2 moderate, 0 high, 0 critical**, exit **1**; two Router package findings remain, both GHSA IDs retained |
| Supplementary runtime-only audit | Same **2 moderate**, exit **1** — not used to filter the authoritative full audit |
| Source-map / PostCSS focused regression | **7/7 pass**; initial 6/7 evidence-test fixture default-parameter error corrected and retained transparently |
| Focused application / frontend / integration suite | **319/319 pass**, 43 suites; D05, shell, BI07/BI08, broad-universe multi-broker, P13 UI |
| Full guarded suite | **584/584 pass**, 90 suites, 0 failures/skips/cancellations |
| Typecheck / build | `npx tsc --noEmit` **0 errors**; `npm run build` **success**, existing >500 kB chunk warning only |
| Frontend smoke | SPA/deep-link entries and JS/CSS assets HTTP **200**; no source-map-js/PostCSS browser bundle sources; no real-browser automation claimed |
| Data / boundaries | D05 JSON, generated TS and manifest; all Security Master source/test corrections; CV-22 Option C; 13-row IRR / fail-closed consumer behavior **unchanged**. No IRR access/write; no new architecture or consumer scope. Single-user personal-use application preserved. |

### A3.3 Publication evidence

This entry is published with the lockfile correction through the normal IPD PR workflow on `arena/7b2e212f-iips-production-market-data`. Commit, exact-head CI, merge, post-merge CI and remote file/blob/tracker verification will be recorded additively **after** they complete. No future check result or clean-audit status is inferred here.

*End of addendum A3 (initial audit record).*

### A3.4 Completed implementation publication and remote verification — 2026-10-19

| Check | Verified result |
|---|---|
| Implementation commit / PR | `8499ab3c963944aec7f74b2d3872c1ade9a0839d`; [IPD PR #32](https://github.com/ramkivs/iips-production-market-data/pull/32) |
| PR CI | [run `39313285152`](https://github.com/ramkivs/iips-production-market-data/actions/runs/39313285152) **SUCCESS**; exact-head executed-test-count check `118268435200`: **584/584, 0 failed** |
| Normal merge | **MERGED** 2026-10-19T19:43:58Z → `main@fc67340fce44a0cb21bf75cfaf1c5bf5b57ca9d2`; `MERGEABLE` / `CLEAN` with both checks successful before merge; no bypass/history rewrite |
| Post-merge main CI | [run `39313422498`](https://github.com/ramkivs/iips-production-market-data/actions/runs/39313422498) **SUCCESS**; exact-merge executed-test-count check `118268887625`: **584/584, 0 failed**; install/typecheck/build/guarded tests all successful |
| Authoritative remote verification | `git fetch origin main` and `git ls-remote origin refs/heads/main` both returned `fc67340fce44a0cb21bf75cfaf1c5bf5b57ca9d2` |
| Merged files / tracker | All **29 changed paths** blob-identical to verified PR head, including lockfile and tracker. GitHub contents API independently confirms remote tracker blob `0febab93564c47ed1b34502726aa5cf200521732`. Full evidence in `evidence/dependency-security/2026-10-19/post-merge-verification.json`. |
| Repeat against implementation merge | Same session branch fast-forwarded to merge; clean `npm ci` **exit 0**, focused source-map/PostCSS **7/7 pass**; complete post-merge machine/human audits **exit 1**, **2 moderate / 0 high / 0 critical** |
| Preserved integrity | Diff from initial `a5c3069` remains empty for application source/tests/frontend/CI and D05 deposit/mirror/manifest. No IRR access or writes; CV-22 Option C / 13-row consumer behavior unchanged. |

**Reconciled status:** high source-map-js advisory **REMEDIATED**; moderate Router advisories **UNRESOLVED INSTALLED VULNERABILITIES** (no compatible v6 patch), with reachability limitations recorded in A3.1. No unrelated tracker status changes. This A3.4 post-merge evidence entry is itself published through the same normal IPD follow-up documentation workflow; its final remote-main presence and CI are verified in the completion report, rather than asserting a future self-referential merge result.

---

## ADDENDUM A4 — 2026-10-21: Row 48 / `CV-36` workbook historical-snapshot reconciliation, and bounded P11 status verification (`DEC-06`)

**Status of this addendum:** additive documentation reconciliation only. It renders **no** Program Authority decision, grants no authority, admits no capability, lifts no fence, and changes no operational eligibility. It is published on IPD `main` through the normal IPD PR workflow; its own merge and post-merge verification are recorded in the completion report rather than asserted here.

**Verification basis for this addendum.** IPD `main` = `3d44e0a123f2495f3b88ce0ab8b47fbc5bf072db` (PR #33 merge; exact-head checks `typecheck · build · test` **success** and `executed test count` **success — 584 tests executed, 0 failed**). IRR `main` = `8d2fc9852cc4df62c0fd7683016fe7e6480de0d8` (PR #170 merge, 2026-10-21T15:24:30Z) — read only; **no IRR path was read-modified or written**.

### A4.1 What the historical snapshot is, exactly

| Item | Verified value |
|---|---|
| Artifact | `IIPS_Production_Market_Data_Intelligence_Program_v1.0_TRACKER_INTEGRATION_ALIGNED.xlsx` (IPD repository root) |
| Blob at `main` | **`6f4abdbceda1e75f12ea22cc0855a87d591f961c`** |
| Size | `39,365` bytes |
| Structure (read from the archive, not from prose) | **12 worksheets**: `Program Overview`, `IIPS Integration Baseline`, `Integration Decisions`, `Phase Roadmap`, `Work Tracker`, `Dependency Matrix`, `UI Coverage`, `Data Domains`, `Phase Gates`, `Status Legend`, `Parallel Execution`, `Git & Workspace`; plus 9 `FilterDatabase` defined names |
| Change history | **One** commit touches this path on `main` — it has not been revised since the program baseline. It is therefore a **frozen planning snapshot**, not a live tracker. |
| Disposition | **Preserved byte-unchanged.** Rewriting 59 status cells inside a binary planning artifact would destroy the historical record and substitute an unverifiable "current" workbook. That substitution is explicitly not performed here. |

**Consequence.** Any status asserted by the workbook is **historical planning intent at program baseline**, and must never be cited as present-day implementation, validation, acceptance, qualification, admission or release evidence.

### A4.2 What the authoritative trackers actually are

| Layer | Authoritative artifact | Ref | Present state |
|---|---|---|---|
| Cross-repository capability register (51 rows) + decision register (`CV-*`, `XV-*`) | IRR `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` | IRR `main` @ `8d2fc985` | Current: §16.67 (`CV-CORR-50`, 2026-10-21) re-derived all 51 rows from live evidence and restated counts (`16` complete/accepted, `11` active outstanding, `35` register items); §16.68 (`CV-CORR-51`, 2026-10-21) records the Group B receipt |
| IPD-side evidence and reconciliation record | **This document** (`evidence/np04/…RECONCILIATION_2026-10-17.md`), §1–§10 and addenda A1–A4 | IPD `main` | Current through this addendum |
| IPD-side bounded P11 scope record | `evidence/cross-repository/IPD_P11_BOUNDED_LIBRARY_SCOPE_AND_ROW26_RECONCILIATION_2026-10-20.md` | **Commit `3eaec0edd4f89a806b301d647499ca860c2a1172` only — NOT on IPD `main`** | See A4.4 |
| IPD program-plan workbook | The `.xlsx` described in A4.1 | IPD `main` | **Historical snapshot — superseded for status purposes by the rows above** |

**Repository-boundary note.** `CV-36` and Matrix **row 48** are register items whose rows live in the **IRR** master tracker. This addendum can and does establish the IPD-side facts; it **cannot** move the IRR row's status. Any IRR-side text change is a separate IRR-authorised follow-up and was **not** attempted from this IPD task.

### A4.3 `CV-36` / row 48 — what is reconciled and what is not

**Reconciled by this addendum (IPD side):**

1. The workbook is identified precisely (A4.1) and **declared a historical planning snapshot**, not current authority.
2. The workbook is **preserved byte-unchanged**; no cell was edited, and no replacement "current" workbook was created.
3. The live authoritative trackers are **named with refs and blobs** (A4.2), so the historical/current distinction is explicit at the point of use.
4. The specific workbook-versus-evidence contradictions already enumerated in §8.3 of this document stand and are **not** revised (e.g. `P13-05` `NOT STARTED` against `evidence/p13` `CERTIFIED`; `P13-03` `NOT STARTED` against an implemented store port).

**Not reconciled, and why — recorded as an explicit residual rather than silently closed:**

- The `CV-36` closure condition is "every P-phase row's status cites a commit/evidence path; P14–P17 rows exist or are explicitly marked out of tracker scope". Satisfying that condition by rewriting the workbook is exactly the substitution prohibited above; satisfying it by declaring the workbook historical requires the **IRR register row** to carry that declaration. That row is IRR-owned.
- Therefore **`CV-36` cannot be marked complete from an IPD-only pass.** Its accurate status after this addendum is: *IPD-side facts established and the historical/current distinction made explicit; the register-level status transition remains IRR-owned.*

### A4.4 `DEC-06` — bounded P11 acceptance and the admission/publication boundary

**Verified acceptance (established and published — not recreated here).**

| Element | Verified state |
|---|---|
| Governing record | IRR tracker §16.65 (`CV-CORR-48`, 2026-10-20) — Program Authority selected **bounded in-process IPD P11 library acceptance** |
| Publication of that record | IRR **PR #164** — **MERGED** 2026-10-20T17:42:53Z; §16.65 is present in the IRR tracker at `main` |
| Scope of the acceptance | The existing in-process IPD **library** capability only — `DataBoundExecutor`, namespace guard, governed defaults, frozen sector engines, recalculation DAG — including the documented momentum-propagation and effective input-to-output lineage fixes. **Row 26 E2E is `NA` for this bounded scope only.** |
| Restrictions expressly preserved | P11-02 recalculation/replay/snapshot/ownership unresolved; `CSIP_COMPOSITE` dispatch semantics undefined; `mode` / `governedIntelligenceInputs` semantics unresolved; UI05 compatibility unclaimed; IPD/IRR mapping and engine equivalence unverified; broader P15 provider-to-score claims bounded to their own historical tests. No blanket P11/P15 acceptance, certification or product-E2E completion. |

**The IPD-side record of that scope is NOT on `main`.** Verified: `git compare main...3eaec0e` → **ahead 2, behind 0** (fast-forwardable). The two commits are:

| Commit | Content | Nature |
|---|---|---|
| `b6e622432cb0ca3e5452c4194bc683c496a688fc` | "Fix P11 momentum propagation and scoring lineage" — modifies `src/engine_adapters/databound_executor.ts`, `src/engine_adapters/sector_defaults.ts`, `tests/wsd_p11_engine_adapters.test.ts` | **Implementation (source + test)** |
| `3eaec0edd4f89a806b301d647499ca860c2a1172` | Adds `evidence/cross-repository/IPD_P11_BOUNDED_LIBRARY_SCOPE_AND_ROW26_RECONCILIATION_2026-10-20.md` (+67); annotates inventory row 13 | **Documentation** |

**Boundary determination — publication not performed in this pass.**

1. Publishing `b6e6224` would place **new engine source code on IPD `main`**. That is IPD **main admission of an implementation change**, not evidence publication. §16.65.4 records that the applicable standing-authorization ceiling covers governance-record preparation, branch publication for review and read-only verification, and **"does not by itself authorize or prove main admission"**; main admission is "a distinct, separately authorized and verifiable act".
2. Publishing only `3eaec0e` is documentation and would pass no source gate — but it would land a record on `main` that cites a remediation commit whose code is **not** on `main`. Publishing that half alone risks being read as implied admission, which the task prohibits. It was therefore **not** published.
3. Acceptance is **already established and already published** on the authoritative register (IRR, PR #164). It does **not** depend on the IPD record reaching `main`. No acceptance record was recreated.
4. No admission decision for the IPD lineage was found in any inspected record. One therefore **has not been made**, and none is invented here.

**Recommended next step (for the Program Authority; not performed, not pre-judged).** Issue one bounded IPD main-admission decision covering `b6e6224` + `3eaec0e` as a single unit, stating: the named commits; that the change is confined to `src/engine_adapters/**` and `tests/wsd_p11_engine_adapters.test.ts`; the required exact-head CI evidence; the bounded library scope per IRR §16.65; and that admission of this remediation establishes **no** product-consumer integration, no Row 26 E2E, no IPD/IRR equivalence, no Gate 3/4/5 movement and no operational eligibility change. Until that act exists, the lineage remains **off-`main`**.

### A4.5 Preserved boundaries confirmed by this pass

- `SESSION_ONLY` / `durable:false` and the 29-key caller-identity guard unchanged; no `frontend/` path touched.
- Gate 3 remains **not accepted**; IPD PR #34 remains **open and unmerged**; no Gate 3 manifest path was added, removed or modified by this addendum.
- `503` fences, `G-2` §7/§8 exclusions, `CV-22` Option C, `CV-40` Option B deferral, row 14/16 Option A closures and every recorded deferral are unchanged.
- No IRR mutation of any kind was performed by this pass.

*End of Addendum A4.*

---

## ADDENDUM A5 — 2026-10-21 (second pass): refreshed `DEC-06` state, correction of the A4.4 fast-forward finding, exact-head CI evidence, and issue-closure status

**Status of this addendum:** additive documentation reconciliation only. It renders **no** Program Authority decision, grants no authority, admits no capability, lifts no fence and changes no operational eligibility. It supersedes nothing in A4 except the single factual finding identified in A5.1.

**Verification basis.** IPD `main` = `a6ad4a9dc8c9ba9b1a4c392888c7a42f2e1b3893` (PR #35 merge). IRR `main` = `8d2fc9852cc4df62c0fd7683016fe7e6480de0d8` — read only; **no IRR path was created, modified or deleted**.

### A5.1 Correction to A4.4 — the candidate is no longer fast-forwardable

A4.4 recorded `git compare main...3eaec0e` → *ahead 2, behind 0* (**fast-forwardable**). **That finding was accurate when written and is now stale.** `main` has since advanced two commits — `0980bd8` (the Group B reconciliation that added A4 itself) and `a6ad4a9` (PR #35 merge) — and `0980bd8` **touched the same inventory file** that `3eaec0e` annotates.

| Property | A4.4 (as recorded) | Refreshed (this addendum) |
|---|---|---|
| Ancestry | ahead 2, behind 0 | **diverged** — ahead 2, behind 2; merge base `3d44e0a` |
| Admission mechanism | fast-forward available | **merge commit required** (or rebase, which changes the commit IDs) |
| Overlapping file | none | `evidence/np04/…RECONCILIATION_2026-10-17.md` |
| Merge conflicts | n/a | **none** — `ort` auto-merge; A4 and the row-13 annotation both retained |
| Check runs on the two commits | none | **none before this pass**; see A5.2 |

The substantive A4.4 determination is **unchanged and re-confirmed**: no PA main-admission decision for this lineage exists, so it remains off `main`.

### A5.2 Exact-head CI evidence now exists

A2/A4 recorded that "tests pass" rested on local execution with no check runs attached. That gap is now closed for the candidate. A review-only PR was opened — **IPD PR #36, explicitly labelled NOT FOR MERGE** — to obtain an exact-head CI record:

| Item | Verified value |
|---|---|
| CI run | `39629785765` — **success** (`pull_request`, head `3eaec0e`) |
| Published count check | `executed test count` — **success**, check id `119324882624`: *586 tests executed — 586 passed, 0 failed* |
| Mergeability | `MERGEABLE`, `mergeStateStatus` **`CLEAN`** |
| GitHub merge preview | `0046adb1ea97eb6d3727c093757c85d93e9a9384`, tree `26dec9ac01515635cc15eb9cfa812435ff0f7f65` |

Local runs in this pass, on the **tree identical to GitHub's merge preview**: `main` 584/584; candidate 586/586; merged integration 586/586; focused P11 suite 8/8; `tsc --noEmit` clean and `npm run build` ok in all three. POSIX execution remains **non-qualifying** for the Windows host.

### A5.3 `DEC-06` decision package published

The complete admission decision package is now a durable artifact:

- `evidence/cross-repository/IIPS_V3_DEC06_P11_MAIN_ADMISSION_DECISION_PACKAGE_2026-10-21.md`
- Package ID `IIPS-V3-DEC06-P11-MAIN-ADMISSION-DECISION-PACKAGE-2026-10-21-01`; status **DECISION REQUIRED — NOT DECIDED**.

It carries the nine elements A4.4 recommended but did not assemble: exact commit IDs and parent chain; precise source/test/documentation scope with blob identities at `main`, candidate and merge tree; a **reproduced** statement of the defect (the P11 momentum factor is provably inert at 50/100 on `main`, because `SectorDefaultInjector`'s whitelist omits `momentum` before `FrozenEngines` applies `inputs.momentum ?? 0`); the validation evidence **and its limitations**; the acceptance-versus-admission boundary with IRR §16.65 quoted; dependencies and preserved fences; the exact decision requested as `D-06` with four options; the consequences of each; and the prohibited actions until the decision exists.

**The `D-06` question:** admit lineage `b6e622432cb0ca3e5452c4194bc683c496a688fc` → `3eaec0edd4f89a806b301d647499ca860c2a1172` to IPD `main` — **ADMIT / ADMIT WITH CONDITIONS / REJECT / DEFER**. No option has been selected by any agent.

### A5.4 Issues #16 and #17 — status re-verified, closure still not executable

Both issues remained **OPEN with zero comments** at refresh. The prior pass's `403` was re-tested **once** and reproduced, now with the precise required-scope header captured:

- `POST /repos/ramkivs/iips-production-market-data/issues/17/comments` → **HTTP 403** `Resource not accessible by integration`
- `POST /repos/…/issues/16/comments` → **HTTP 403**, `X-Accepted-Github-Permissions: issues=write; pull_requests=write`

The governing token holds repository `contents: write` (branch push and PR creation succeed; PR #36 was created successfully) but **not `issues: write`**. Per the no-blind-retry rule, no further attempts were made. **No issue comment was posted and no issue was closed in this pass.** The closure notes at `evidence/cross-repository/IPD_ISSUES_16_17_CLOSURE_NOTES_2026-10-21.md` remain the durable, evidence-backed basis for an operator with issue-write scope.

### A5.5 Preserved boundaries confirmed by this pass

- `SESSION_ONLY` / `durable:false` and the 29-key caller-identity guard unchanged; no `frontend/` path touched.
- Gate 3 remains **not accepted**; IPD PR #34 remains open and unmerged; the Gate 3 lineage is independent of `D-06`.
- All `503` fences, `G-2` §7/§8 exclusions, `CV-22` Option C, `CV-40` Option B deferral and every recorded deferral are unchanged.
- No IRR mutation of any kind; IRR inspected read-only.
- No source code was changed by this pass. PR #36 remains open, unmerged and explicitly marked not for merge.

*End of Addendum A5.*
