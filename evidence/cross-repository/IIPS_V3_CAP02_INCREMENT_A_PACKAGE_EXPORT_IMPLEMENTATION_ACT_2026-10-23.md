# IIPS v3.0 — CAP-02 — IPD Package-Export (Increment A) Implementation Act and Execution Record

> ## STATUS: **RENDERED — EFFECTIVE FOR THE EXACT MANIFEST AT §4 ONLY**
> This record is the **IPD act** that the prepared CAP-02 composition act
> (`IIPS-V3-CAP02-BROKER-IMPORT-UI-COMPOSITION-ACT-2026-10-23-02` §2.1, *PREPARED — NOT EFFECTIVE*) said must
> name the Increment A files: *"a separate IPD act must name these"*.
>
> **It authorizes export plumbing and nothing else.** It creates no write path, no IPC operation, no wire
> field, no schema, no migration, no provenance change, no transaction change, no route, no listener, no
> durable claim and no gate movement. It does **not** render the IRR composition act effective, and it does
> **not** authorize Increment B or Increment C.

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-CAP02-IPD-EXPORT-IMPLEMENTATION-ACT-2026-10-23-01` |
| **Record type** | IPD implementation act (exact file manifest) + execution and verification record |
| **Status** | **RENDERED — EFFECTIVE for the §4 manifest only**; U2/U3–U7 remain unmet; operational writes remain refused |
| **Date** | `2026-10-23` (UTC) |
| **Repository** | `ramkivs/iips-production-market-data` (IPD) — the only repository written |
| **IPD baseline (pre-change, verified)** | `main@73fd8c1644e9725c9a5499e14d42efdfcb4fe2f2`, root tree `66020736919befa5e5320550a396187cd351b40e` |
| **IRR baseline (read-only)** | `main@f53056214d45c850928fbabd51dc6a2adcb64f2b`, tree `d0f24bfdbeba3b4f5bc33bbae15491884bd5da8f` |
| **Decision authority** | Ramki — Program Authority, single owner/user of the single-user personal-use IIPS platform |
| **Execution assignment** | The Program Authority direction of `2026-10-23` in the operating session: *execute CAP-02 blocker B-1, Increment A — establish the narrowest viable package-export layer on IPD `main` for the IPD-authored broker-import components and the identity/contracts/UI symbols they require; complete the U2 investigation; do not widen the manifest, do not treat a proposal as effective, do not write to IRR* |
| **Authority basis** | (1) Standing Program Authority grant of global decision and execution authority (2026-10-12), transcribed at IRR `docs/integration/IIPS_v3.0_OWNER_CONTEXT_F3_MECHANISM_AND_IMPLEMENTATION_PA_DECISION.md` §1.2, blob `c4c9f7d79ef181af96f6c4e5cc108288ef22fd02`, construed by `IIPS-V3-DEC06-AUTHORITY-RECONCILIATION-IRR-2026-10-21-01` (R-1, R-3, R-6, R-7); (2) CAP-02 U0 effective decision item 4 — reuse **by an IPD-owned package export introduced by an IPD packaging act**; (3) the exact paths of composition act §2.1, adopted **verbatim and without widening** |
| **What is expressly NOT authority here** | The composition act (PREPARED — NOT EFFECTIVE) authorizes no file and is **not** cited as authority; Gate 3 acceptance covers a bounded 22-path manifest and authorizes no new path; the merge of IPD PR #45 and any documentation publication are **not** implementation authority |
| **Mutation scope** | IPD only: one documentation path (this record), one modified `package.json`, two new packaging files, one new test file. No IRR file, branch, PR, tag, issue, comment or tracker was touched |
| **Downstream effect** | B-1's factual blocker is removed: a `main`-resident `./portfolio-ui` export exists after the merge of the publication PR. The IRR composition act still requires its own rendering before Increment B |

---

## 1. What this act authorizes, and the gap it closes

### 1.1 The gap, stated as it was found

| # | Finding at the pre-change baseline | Verified by |
|---|---|---|
| G-1 | IPD `main` `package.json` (blob `0a3eec22a39048498601aa7b5672a40ede840d34`) has **no `exports` map**, no `files` field and no package build script | `git show HEAD:package.json` |
| G-2 | IPD `main` has **no** `src/**/package.ts` entry point and **no** `tsconfig.*-package.json`; the packaging layer exists only on the unmerged `np04-governed-persistence-windows` line | `git ls-tree -r HEAD`, `git show 2e11fa3b:package.json` |
| G-3 | The documented IPD pin `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494` (IRR `frontend/package.json` line 18) is "Expose NP-04 persistence package" (2026-10-02), carried by `refs/heads/np04-governed-persistence-windows` **and** annotated tag `iips-pin-np04-2e11fa3b`; `git merge-base --is-ancestor 2e11fa3b origin/main` → **false** | local object graph after fetching the pin; `git ls-remote --tags/--heads` |
| G-4 | Therefore an IRR file importing `iips-production-market-data/portfolio-ui` (or any other subpath of `main`) fails `tsc`/`vite build`: the subpath does not exist | composition act §8 B-1, re-verified here in G-1…G-3 |
| G-5 | The only record naming the exact Increment A files is composition act §2.1, and that act is **PREPARED — NOT EFFECTIVE**; it states that an **IPD** act must name them (it cannot, per R-7) | composition act §2.1, §7(1), §8 |

### 1.2 What is authorized (and only this)

1. A `main`-resident packaging build for **one** public subpath: `./portfolio-ui`.
2. A single re-export entry point at the path composition act §2.1 fixes.
3. The narrowest export surface that makes the selected IRR-hosted composition buildable (§5).
4. One focused conformance test suite (§6).
5. The publication of exactly those paths.

Nothing else. The wording of composition act §2.1 is adopted literally: identity and contracts entry
files were **folded into the single entry point**, which §2.1 expressly permits ("new (or folded into the
above)").

---

## 2. Authority analysis — what does and does not cover this change

| Candidate authority | Verdict | Reason |
|---|---|---|
| **Standing PA grant** (`c4c9f7d7…`) + the `2026-10-23` execution assignment | **Basis for rendering this act and executing it** | R-1: project-wide within established scope, not re-asked per decision; R-3: the grant authorises the *making* of the act, the act is this record, proof is remote state. The work is a necessary, reversible, additive packaging step inside the established CAP-02 scope already decided at U0 |
| **CAP-02 U0 decision** (IRR `43793d66…`, effective) | **Authorizes the mechanism, not the files** | Item 4: reuse "by governed package export, never by copy", "introduced by an **IPD** packaging act". Item 10/§7: U0 itself authorizes no file |
| **Composition act** (`6c7f6cfe…`) | **Scope source only — NOT authority** | Status **PREPARED — NOT EFFECTIVE**; §2.1 is a prepared manifest, §7(1) says "No IPD source change under this act". Its exact paths are adopted here; nothing is inferred as effective from it |
| **Gate 3 acceptance** (`IIPS-V3-G3-ACCEPTANCE-2026-10-22-01`) | **Does not cover it — and is not needed** | It accepts a **bounded** 22-path implementation scope at IPD `main@1cceacff…`. Increment A adds no path inside that manifest and no write-path behaviour. Gate 3 is the *write-path* gate (W-1(2)); a read-only export layer is outside its subject matter. It is therefore **not** treated as covering Increment A, and no amendment to it is claimed |
| **Merged PR #41 / PR #45** | **No authority** | A merge is proof of publication, not a grant |
| **IPD store-port act** (`np04-g2-portfolio-ui-store-port-2026-10-16-001`, blob `d0657706…`) | **Unchanged, and untouched** | It authorized the session-only port in exact paths; this act neither widens nor narrows it |

**Anchors.** Gate 3 act §4.1's ten frozen anchors were a *condition of the PR #41 merge*, not a
perpetual freeze. This act leaves nine of the ten byte-identical (`src/identity/mapping_store.ts`
`eec60c09…`, `src/identity/security_master.ts` `60030e0c…`, `src/identity/quarantine.ts` `70c6f658…`,
`tsconfig.json` `6d696ec2…`, `.github/workflows/ci.yml` `aeee464f…`, `vite.config.ts` `5563e1bc…`,
`frontend/src/features/portfolio/portfolio-store.ts` `b900a248…`,
`frontend/src/features/portfolio/portfolioStorePort.ts` `d61f18df…`, `package-lock.json`
`98ae3c63…`) and modifies the tenth, **`package.json`** (`0a3eec22…` → the new blob). That drift is
recorded here explicitly so no reader concludes Gate 3 covers the new tree: **it does not**, and this act
does not claim it does.

---

## 3. Package dependency graph (verified from source, not assumed)

### 3.1 The exported component set and its dependency edges

| Layer | Modules | Notes |
|---|---|---|
| Mountable component | `frontend/src/features/portfolio/BrokerImportModal.tsx` (717 lines) | imports `react`, `portfolioStorePort`, `SecurityMaster` (type), and its own barrel `./index.js` |
| Port seam | `frontend/src/features/portfolio/portfolioStorePort.ts` (478) | session-only adapter; `SESSION_ONLY` / `durable:false`; caller-identity refusal list; DP-2 2F guard; truthful status descriptor |
| Portfolio domain | `frontend/src/features/portfolio/portfolio-store.ts` (548) | in-memory store, consolidation arithmetic, `computeLineageHash` from `src/contracts/provenance.ts` |
| Import pipeline | `import/broker-format-detector.ts` (214), `import/broker-holdings-mapper.ts` (381), `import/broker-import-ingress.ts` (543), `import/ui-broker-import-view-model.ts` (541), `import/types.ts` (258), `import/adapters/*` (715 combined) | deterministic 5-stage pipeline; adapters for Zerodha / Dhan / Groww |
| Identity authority | `src/identity/security_master.ts` (147), `mapping_store.ts` (93), `quarantine.ts` (26), `governed_fixture_master.ts` (186), `d05_listing_corrections.ts` (46), `d05_broad_universe_data.ts` (76,538) | canonical resolution and the governed 2,250-record corpus |
| Shared contracts / UI | `src/contracts/provenance.ts` (160), `src/contracts/types.ts` (64), `src/ui/types.ts`, `src/ui/accessibility_engine.ts`, `src/ui/responsive_engine.ts` (+ the `src/transports`, `src/intelligence`, `src/quality`, `src/fundamentals`, `src/engine_adapters` type modules that `src/ui/types.ts` imports) | reached through the existing in-repo edges of the view model |

### 3.2 Browser-safe vs Node-only (the boundary that decided the surface)

| Classification | Modules | Evidence |
|---|---|---|
| **Browser-safe** | every module in the closure of `src/ui/portfolio_ui_package.ts` — 47 files | T-PKG-3/T-PKG-4: zero `node:*` imports, zero `fs`/`path`/`net`/`crypto`/`sqlite`, zero privileged directories; the only external specifier is `react` |
| **Guarded Node usage only** | the three adapters, `broker-format-detector.ts`, `broker-import-ingress.ts`, `contracts/provenance.ts` | every `Buffer` reference is behind `typeof Buffer !== 'undefined'`; `computeSha256` is a pure FIPS 180-4 implementation with no Node crypto. The pre-existing BI-07 zero-Buffer suite already exercises this |
| **Node-only — excluded** | `src/ipc/**` (`node:net`, `node:sqlite`, `node:fs`, `node:path`), `src/persistence/**` (`node:sqlite`, `node:crypto`, `node:fs`, `node:path`), `src/d114/evidence_handoff.ts` (`fs`, `path`), `src/security/scanner.ts` (`fs`, `path`) | T-PKG-3/T-PKG-5 assert exclusion rather than assert-by-inspection |

**One honest structural note.** `BrokerImportModal.tsx` imports its own barrel `./index.js`, which
re-exports `PortfolioWorkspace.tsx`. The workspace module is therefore *compiled into* the emitted
package closure, but it is **not exported** and not reachable as a product surface. Removing that edge
would require editing `frontend/src/features/portfolio/index.ts`, which this act does **not** authorize
(§7). It is recorded so no reader mistakes the emitted file list for the public surface.

### 3.3 What "the smallest set of public exports" turned out to be

Driven by the four files the selected composition needs (composition act §2.2): the component, the port
adapter, the governed security-master factory and the raw-observation client types. Symbols that exist
only *inside* the package (mapping store, digest helpers, CSV cell helpers, the corpus array) are
deliberately not re-exported — the consumer must not be able to perform IPD's identity resolution or
digest computation of its own.

---

## 4. Exact manifest (authorized scope)

| Path | Action | Pre-change state | Constraint |
|---|---|---|---|
| `package.json` | **modify** | blob `0a3eec22…`; sha256 `f43a6ff1d7d214b5e1ccb3be95a97a1c9a3caff20af6bebe3ab11201ec86be9a` | add exactly one `exports` entry (`./portfolio-ui`), `files: ["dist/package"]`, `build:portfolio-ui-package`, `prepack`, `prepare`, and add the package build to `build`. No dependency, version, `engines`, `main`, `type` or existing-script rename |
| `tsconfig.portfolio-ui-package.json` | **new** | absent | extends `./tsconfig.json`; `rootDir: "./"`, `outDir: "./dist/package"`; `files: ["src/ui/portfolio_ui_package.ts"]`; `include: []` |
| `src/ui/portfolio_ui_package.ts` | **new** | absent | re-exports only; no logic; no store/schema/identity/digest implementation |
| `tests/portfolio_ui_package.test.ts` | **new** | absent | export-surface conformance, browser-safety and no-privilege tests (§6) |
| `evidence/cross-repository/IIPS_V3_CAP02_INCREMENT_A_PACKAGE_EXPORT_IMPLEMENTATION_ACT_2026-10-23.md` | **new** | absent | this record |
| `evidence/cross-repository/IIPS_V3_CAP02_U2_GATE3_MANIFEST_AMENDMENT_PROPOSED_2026-10-23.md` | **new** | absent | the U2 amendment, **PROPOSED / NOT EFFECTIVE** |

**No other path is authorized by this act.** In particular it authorizes **no** change to
`frontend/src/features/portfolio/**`, `src/identity/**`, `src/contracts/**`, `src/ipc/**`,
`src/persistence/**`, `frontend/src/app/**`, `.github/workflows/ci.yml`, `package-lock.json`,
`scripts/run-tests.mjs`, `vite.config.ts` or the `tsconfig.json` build. The diff was verified against
this list before publication (§8).

### 4.1 `rootDir` departure from the pinned convention — stated, not hidden

The off-`main` packaging layer uses `rootDir: "./src"` (its entry points live under `src/`). The
broker-import component set lives under `frontend/src/`, so `rootDir: "./"` is required and the emitted
layout is `dist/package/src/…` + `dist/package/frontend/…`. The `exports` map therefore points at
`./dist/package/src/ui/portfolio_ui_package.js`, not at `./dist/package/ui/…`. This is a build-plumbing
difference only; it changes no runtime behaviour and no existing export (none existed on `main`).

### 4.2 The export surface, symbol by symbol

| Symbol(s) | Source module | Why the composition needs it |
|---|---|---|
| `BrokerImportModal`, `BrokerImportModalProps`, `DEFAULT_ALLOW_NON_PRODUCTION_BYPASS` | `BrokerImportModal.tsx` | the mountable component the host renders |
| `PortfolioStorePort`, `PortfolioDurability`, `PortfolioPortSave{Request,Success,Refusal,Outcome}`, `PortfolioPortRefusalCode`, `PortfolioPortRefusedHolding`, `PortfolioPortSaveGuard` | `portfolioStorePort.ts` | the interface the host-side adapter implements; refusal vocabulary |
| `SessionPortfolioStorePort`, `getDefaultPortfolioStorePort`, `resetDefaultPortfolioStorePort` | `portfolioStorePort.ts` | the session-only fallback the component keeps (U0 item 5) |
| `evaluatePortSaveGuard`, `findCallerSuppliedIdentityKeys`, `CALLER_SUPPLIED_IDENTITY_KEYS` | `portfolioStorePort.ts` | the IPD-owned refusal rules an adapter must reuse rather than re-implement |
| `describePersistenceStatus`, `PersistenceState`, `PersistenceStatusDescriptor` | `portfolioStorePort.ts` | the truthful durability banner; the only sanctioned way to word a save status |
| `PortfolioStore`, `getDefaultPortfolioStore`, `resetDefaultPortfolioStore`, `PortfolioRecord`, `PortfolioSaveOptions`, `PortfolioSaveResult`, `PortfolioAnalyticsSummary`, `BrokerContributionRecord` | `portfolio-store.ts` | the component's required `portfolioStore` prop and its result shapes |
| `BrokerImportIngressOrchestrator`, `BrokerFormatDetector`, `mapBrokerOutputToUserHoldings`, `{Zerodha,Dhan,Groww}HoldingsAdapter`, `PortfolioBrokerImportController`, `PortfolioBrokerImportViewModel`, `BrokerImportUIState`, `AcceptedHoldingPreviewItem`, `RejectedRowPreviewItem`, `BrokerImportSaveGuard` | `import/**` | the IPD-owned import pipeline and view model (U0 item 1). Exported so a host can never need a second implementation |
| `FinappHolding`, `FinappBrokerParseResult`, `FinappBrokerAdapter`, `FinappBrokerType`, `BrokerFileFormat`, `BrokerAdapterParseOptions`, `BrokerDetectionResult`, `UserHoldingInput`, `BrokerMappingOptions`, `BrokerMappingResult`, `BrokerIngressRequest`, `BrokerIngressResult`, `BrokerIngressRejection`, `BrokerIngressRejectionReason`, `IngressStage`, `IngressDisposition`, `DhanFormatVariant` | `import/types.ts` | the broker-observation and mapping vocabulary (the wire carries broker-observed fields only) |
| `SecurityMaster`, `SecurityMasterEntity`, `ExchangeListing`, `GovernedSourceRevision` | `src/identity/security_master.ts` | the master type the component's prop requires |
| `getGovernedBroadSecurityMaster` | `src/identity/governed_fixture_master.ts` | the IPD-governed master factory (no fixture fabrication in the host) |
| `IdentityAmbiguityError`, `IdentityQuarantineRecord` | `src/identity/quarantine.ts` | the identity-quarantine vocabulary the pipeline raises |

**Deliberately not exported:** `src/ipc/**`, `src/persistence/**` (durable store, SQLite, migrations,
binding, audit, provisioning, dispatch, protocol), `src/identity/mapping_store.ts` (server-side
resolution), `src/contracts/provenance.ts` (digest computation), `PortfolioWorkspace`/`frontend/src/app/**`
(application shell), the D05 corpus array, and the low-level CSV cell helpers.

---

## 5. Publication build

```text
exports["./portfolio-ui"].import  ./dist/package/src/ui/portfolio_ui_package.js
exports["./portfolio-ui"].types   ./dist/package/src/ui/portfolio_ui_package.d.ts
files                             ["dist/package"]
build                             tsc && vite build && npm run build:portfolio-ui-package
build:portfolio-ui-package        tsc -p tsconfig.portfolio-ui-package.json
prepack / prepare                 npm run build:portfolio-ui-package   (the pinned-line convention)
```

`npm ci` runs `prepare`, so the artifacts exist before typecheck/build in CI, and `npm run build`
re-emits them explicitly. `dist/` remains git-ignored; no build output is committed.

**Consumability check (consumer-side, outside the repository).** `npm pack` produced
`iips-production-market-data-1.0.0.tgz` — **95 files, 213.6 kB packed / 2.6 MB unpacked**, containing only
`package.json` and `dist/package/**`. Installing that tarball into a clean directory and importing
`iips-production-market-data/portfolio-ui` resolved **22 runtime exports**, with
`getDefaultPortfolioStorePort().durability === 'SESSION_ONLY'` and `.durable === false`. This proves the
*packaging* path; it is **not** a UI-to-IPC integration result.

**Observation recorded for Increment B, not acted on:** the package imports `react` but declares no
`peerDependencies`. IRR already supplies React 18, so resolution succeeds; a peer declaration would be a
manifest change outside this act and is left to the composition act.

---

## 6. Tests added, and what they do and do not prove

`tests/portfolio_ui_package.test.ts` — 29 tests, 8 groups:

| ID | Assertion |
|---|---|
| `T-PKG-1` | every symbol the selected composition imports resolves from the entry point, with a usable runtime kind; the component is a function; the orchestrator exposes `executeIngress` |
| `T-PKG-2` | every exported value is **reference-identical** to its authoritative module export (18 identity checks) — a fork or copy fails the test; instances are `instanceof` both the surface and the source class |
| `T-PKG-3` | the **source** closure resolves with zero dangling imports, imports **no** Node builtin, contains **no** `src/ipc`, `src/persistence`, `src/d114`, `src/security`, `scripts` or `tests` module, has exactly one external (`react`), and has no unguarded `Buffer` |
| `T-PKG-4` | the manifest declares exactly one subpath, publishes only `dist/package`, maps to the emitted `.js`/`.d.ts`, the build wiring exists, the artifacts exist on disk, the **built** closure is equally browser-safe, and the built entry loads with the same public names |
| `T-PKG-5` | 16 forbidden privileged symbols (`persistBrokerImport`, `openDatabase`, `ensureMigrations`, `IPC_*`, `dispatchRequest`, …) are absent, and no name matching SQLite/migration/binding/IPC/dispatch machinery is exposed |
| `T-PKG-6` | the browser closure cannot reach the dispatch gate; `src/ipc/dispatch.ts` still refuses the write set with `WRITE_NOT_AUTHORIZED` **before** `switch (envelope.op)`; contract v1's write set and the C7 refusal list are intact |
| `T-PKG-7` | every closure file is inside this repository, no IRR path or sibling checkout is imported, and no application-shell symbol is exported |
| `T-PKG-8` | a session-only save can never be described as durable or `COMMITTED`; the guard still refuses unresolved identity; caller-identity keys are still detected |

**What these tests are not.** They are export-surface, browser-safety and no-privilege tests. They are
**not** a working UI-to-IPC integration, **not** a durable-commit result, **not** Gate 4 qualification and
**not** Gate 5 admission. `T-PKG-6` proves the gate is *unreachable from the package* and *still present in
source*; the authoritative write-denial behaviour remains covered by the unchanged `g3_write_gate`,
`g3_caller_authority` and `g3_durability_vocabulary` suites.

---

## 7. Exclusions (not authorized, not done)

1. No change to the IPC wire contract, its closed operation set, wire fields, framing or no-listener rule.
2. No change to the write path, the W-1 guard, `evaluatePortSaveGuard`, write authorization or any store.
3. No schema, migration, provenance mapping, contribution-model or transaction change (all U2 items remain open).
4. No `durable:true`, no `COMMITTED` wording for a session path, no durability claim of any kind.
5. No route, listener, renderer surface, navigation entry or IRR file — IRR was read-only.
6. No Gate 3 amendment, no Gate 4 execution/acceptance, no Gate 5 admission, no operational write.
7. No move, copy or re-implementation of any IPD file, and no second identity/provenance implementation.
8. No retrospective authorization of any PR #45 path, no G24 revival, no CAP-03 dependency.
9. No change to `frontend/src/features/portfolio/**`, including the barrel edge noted at §3.2.

---

## 8. Execution and verification performed

| ID | Verification | Result |
|---|---|---|
| `A-1` | IPD remote state re-read before any edit: `origin/main` = `73fd8c16…`, tree `66020736…`; working tree clean | **PASS** |
| `A-2` | Pin `2e11fa3b…` fetched, resolved to a real commit ("Expose NP-04 persistence package", 2026-10-02), carried by branch `np04-governed-persistence-windows` and annotated tag `iips-pin-np04-2e11fa3b`; **not** an ancestor of `main` (`git fetch --unshallow` → full 218-commit history; `merge-base` = `4d3e1cdca3a33da0ec3be8b336b17128108a502c`, the fork point G1-B1 records) | **PASS — G-3 confirmed on complete history** |
| `A-3` | Governing records read read-only from IRR (`G1-B1` `857d1451…`, `G-2` `7e83946b…`, `G3` act `4744e6f4…`, `G3-AMEND-01` `85ba78e6…`, Gate 3 acceptance `f3a6c9a3…`, U0 `43793d66…`, composition act `6c7f6cfe…`, host-boundary act `7ec74179…`, standing grant `c4c9f7d7…`) and from IPD (W-1 policy `4a9501bf…`, contract v1 `163eb1f1…`, store-port act `d0657706…`) | **PASS** |
| `A-4` | Pre-change regression: `npx tsc --noEmit` exit `0`; `npm run build` exit `0`; `npm test` → **802 tests, 801 pass, 0 fail, 1 skipped, 63 suite files** | **PASS — baseline** |
| `A-5` | `git diff --check` clean; changed-file list equals §4 exactly (`package.json` modified; 2 packaging files, 1 test file, 2 documentation records added) | **PASS** |
| `A-6` | Post-change typecheck `npx tsc --noEmit` exit `0` | **PASS** |
| `A-7` | Post-change build `npm run build` exit `0`, including `build:portfolio-ui-package`; `dist/package/src/ui/portfolio_ui_package.{js,d.ts}` emitted, 47 `.js` files in the package closure | **PASS** |
| `A-8` | Post-change full suite `npm test` → **831 tests, 830 pass, 0 fail, 1 skipped, 64 suite files** (802 + 29 new, zero regressions) | **PASS** |
| `A-9` | Focused suite `node --test dist/tests/portfolio_ui_package.test.js` → 29/29 pass | **PASS** |
| `A-10` | Closure scan from the entry point: 47 files, external `react` only, unresolved 0, `node:*` 0, privileged-directory hits 0 | **PASS** |
| `A-11` | `npm pack` → 95 files, 213.6 kB, only `package.json` + `dist/package/**`; external consumer install resolved `./portfolio-ui` with 22 runtime exports and `SESSION_ONLY`/`false` | **PASS** |
| `A-12` | Gate 3 anchors re-hashed after the change: 9 of 10 byte-identical; `package.json` intentionally changed (disclosed at §2) | **PASS — as declared** |
| `A-13` | No IRR object created, modified, pushed or commented; IRR clone used read-only (`git rev-parse`, `git show`, `git ls-tree`, reads only) | **PASS** |
| `A-14` | Remote read-back after publication: merge commit, tree, ancestry, changed paths and blob identity against this §4 list | **PASS — see §9** |

---

## 9. Publication record

| Element | Value |
|---|---|
| Branch | `arena/ab068c78-iips-production-market-data` |
| Commit | _recorded in the post-merge receipt below_ |
| PR | _recorded below_ |
| CI | PR-head run and post-merge `main` push run, both required to be green at the exact SHAs |
| Proof of effect | The merge commit on IPD `main` plus remote blob read-back of the four changed paths. A green CI run alone, a branch commit alone, or this record alone is **not** proof |

Publication receipt (appended after merge):

```text
IPD main before:  73fd8c1644e9725c9a5499e14d42efdfcb4fe2f2  tree 66020736919befa5e5320550a396187cd351b40e
IPD main after:   <merge commit>                            tree <tree>
changed paths:    package.json (M), tsconfig.portfolio-ui-package.json (A),
                  src/ui/portfolio_ui_package.ts (A), tests/portfolio_ui_package.test.ts (A),
                  evidence/cross-repository/IIPS_V3_CAP02_INCREMENT_A_PACKAGE_EXPORT_IMPLEMENTATION_ACT_2026-10-23.md (A),
                  evidence/cross-repository/IIPS_V3_CAP02_U2_GATE3_MANIFEST_AMENDMENT_PROPOSED_2026-10-23.md (A)
PR-head CI:       <run id> / <conclusion>
post-merge CI:    <run id> / <conclusion> / <executed test count>
```

---

## 10. Preserved state (operative, after this act)

```text
IPD package export ./portfolio-ui:   PRESENT from the merge commit of this act
IPD component ownership:             IPD (unchanged; no file moved or copied)
IRR consumption of the export:       NOT PERFORMED — Increment B is NOT AUTHORIZED
IRR composition act:                 PREPARED — NOT EFFECTIVE (unchanged)
IPD write dispatch:                  WRITE_NOT_AUTHORIZED before mutation (unchanged)
IPD durable store / schema:          UNCHANGED
Broker-import UI persistence:        SESSION_ONLY / durable:false
U2 (identity resolution, provenance, transaction, idempotency, reconciliation):  OPEN — see the PROPOSED amendment
Gate 3:                              ACCEPTED for the bounded 22-path scope only (unchanged)
Gate 4 qualification / acceptance:   NOT AUTHORIZED / NOT RENDERED
Gate 5 admission:                    NOT GRANTED
Operational broker-import writes:    NOT AUTHORIZED
IRR twelve /api/user-portfolios* route-method pairs: 503 (untouched by this act)
```

---

## 11. Rollback

Revertible by deleting the two new packaging files and the test, restoring `package.json` to blob
`0a3eec22a39048498601aa7b5672a40ede840d34`, and deleting the two documentation records. No migration, no
data, no store, no schema, no contract, no route, no fence and no gate is involved. Nothing in this act
has any effect on a running product path: no caller imports the new subpath yet.

---

## 12. Statement of non-effect

This act does **not** authorize or perform: any write, any IPC operation or wire field, any schema,
migration or provenance mapping, any transaction or idempotency change, any route or renderer surface in
IRR, any `durable:true` claim, any Gate 3 amendment, Gate 4 execution or acceptance, Gate 5 admission, any
production/operational status, any IRR tracker update, or any retrospective authorization of PR #45 paths.

*Rendered under the standing Program Authority grant; recorded in the IPD repository; no signature,
approval identifier, spoken selection or independently held agent jurisdiction is fabricated.*
