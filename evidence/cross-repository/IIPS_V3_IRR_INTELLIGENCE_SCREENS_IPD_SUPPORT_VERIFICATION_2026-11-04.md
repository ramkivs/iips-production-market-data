# IIPS v3.0 — IRR intelligence screens: IPD backend support verification (2026-11-04)

> **STATUS: INVESTIGATION COMPLETE — IPD-A07 CLOSED FOR THE FOUR VERIFIED SCREENS.
> NO IPD UI IMPLEMENTATION REQUIRED; EXISTING IRR CAPABILITY CONFIRMED.**
>
> This is an investigation and disposition record only. It is **not** an authority act, not a gate
> movement, not an acceptance, and not a Program Authority decision. **No product code, package
> manifest, IPC contract, engine implementation, migration, test implementation, ref, tag or existing
> governance decision is changed by this record.** No IRR file was modified.

| Field | Value |
|---|---|
| Date | `2026-11-04` (UTC) |
| Repository (this record) | `ramkivs/iips-production-market-data` (IPD only) |
| Authoritative IPD baseline | `main@e1f94e9c4913f816848472e3d16875bdf7af14d6` |
| IRR baseline inspected (read-only) | `ramkivs/iips-review-recovered` `main@9e0a0415b76571fc4db1747b2da63c73fa0447d3` |
| Scope | Exactly four IRR screens — Company Intelligence, Sector Intelligence, Cross-Sector Intelligence, Decision Matrix — and their direct dependencies |
| Question answered | Are the four IRR screens adequately supported by IPD backend capabilities? If not, which IPD backend capability or integration contract is outstanding? |
| Mutation boundary | IPD documentation only. **No IRR file, ref, branch, PR, issue or comment was written.** No IPD source, package, script, test, migration, engine, IPC contract, ref or tag was changed |
| Environment | Arena Linux sandbox, Node 22, POSIX. **No native Windows execution; no browser execution** |

---

## 1. Scope, method and the distinction this record enforces

The four screens were traced end to end:

```
IRR screen → IRR api client → IRR service/API route → data source / engine → response → IRR presentation
```

and the corresponding IPD backend surface was inspected for a matching capability, contract and
transport. Component existence and unit-test presence were **not** treated as integration evidence:
the IRR transport was **actually booted** and the endpoints **actually probed**, and the IPD engine
library was **actually executed**.

Explicitly out of scope and **not** reopened: the six-package scoped investigation
(`IIPS_V3_IPD_SCOPED_WORKPACKAGE_REGISTER_2026-11-02.md`), the Direct P1 reconciliation, the
all-branch census, REG-06, B-1R, and the P01-02 / recovered-UI reconciliation. Those records are
cross-referenced in §10, not repeated.

---

## 2. Screen-by-screen integration matrix (the deliverable)

| Screen | IRR route → component | IRR data path (traced) | Required IPD backend capability | Existing IPD implementation | Contract / integration status | Test + acceptance evidence | Genuine missing functionality | Action / responsible repository |
|---|---|---|---|---|---|---|---|---|
| **Company Intelligence** | `/research/company/:id` → `CompanyIntelligence` (`frontend/src/app/App.tsx:51`) | `api/company.ts:25` → `GET /api/company/:id` → `frontend/server/executive-transport.ts:994` → `computeCertifiedCompany()` (`:519`) → `iips-platform/src/sector-engines/**` | **none** | n/a — no IPD capability is consumed | **No IPD contract exists or is required.** IRR-internal, same-origin, credential-free | `CompanyIntelligence.test.tsx` **6/6 pass**; live `GET /api/company/banking` → **HTTP 200** (`companyId: Banking-H1`) | **None** | **None. IRR owns and fully supplies this screen** |
| **Sector Intelligence** | `/research/sector/:id` → `SectorIntelligence` (`App.tsx:52`) | composes five governed reads — `api/company`, `api/evidence`, `api/replay`, `api/decisionMatrix`, `api/engines` (`SectorIntelligence.tsx:18-22`) → same transport | **none** | n/a | **No IPD contract exists or is required** | `SectorIntelligence.test.tsx` **12/12 pass**; all five upstream endpoints returned **HTTP 200** | **None** | **None. IRR owns and fully supplies this screen** |
| **Cross-Sector Intelligence** | `/research/cross-sector` → `CrossSectorIntelligence` (`App.tsx:53`) | `api/crossSector.ts:29` → `GET /api/cross-sector` → `executive-transport.ts:984` → `computeCertifiedCrossSector()` (`:485`) → `CrossSectorEngine` | **none** | n/a — `cross-sector` matches **0 files** under IPD `src/` | **No IPD contract exists or is required** | `CrossSectorIntelligence.test.tsx` **6/6 pass**; live `GET /api/cross-sector` → **HTTP 200**, 3,513 B | **None** | **None. IRR owns and fully supplies this screen** |
| **Decision Matrix** | `/intelligence/decision-matrix` → `DecisionMatrix` (`App.tsx:57`) | `api/decisionMatrix.ts:28` → `GET /api/decision-matrix` → `executive-transport.ts:979` → `computeCertifiedDecisionMatrix()` (`:370`) | **none** | n/a — `decision-matrix` matches **0 files** under IPD `src/` | **No IPD contract exists or is required** | `DecisionMatrix.test.tsx` **6/6 pass**; live `GET /api/decision-matrix` → **HTTP 200**, 2,192 B | **None** | **None. IRR owns and fully supplies this screen** |

**Matrix conclusion:** for all four screens the "required IPD backend capability" column is empty.
There is no *implemented-but-not-connected* IPD capability in these paths and no *genuinely missing*
IPD backend service or contract.

---

## 3. Execution evidence (performed in this pass — not inherited, not inferred)

### 3.1 IRR targeted automated tests — 30/30 pass

`npx vitest run` over the four screen suites at IRR `main@9e0a0415`:

| Suite | Result |
|---|---|
| `frontend/src/features/company/CompanyIntelligence.test.tsx` | **6 passed** |
| `frontend/src/features/sector/SectorIntelligence.test.tsx` | **12 passed** |
| `frontend/src/features/cross-sector/CrossSectorIntelligence.test.tsx` | **6 passed** |
| `frontend/src/features/decision-matrix/DecisionMatrix.test.tsx` | **6 passed** |
| **Total** | **Test Files 4 passed (4) · Tests 30 passed (30) · 0 failed** |

### 3.2 Live API probe — the transport was actually booted and called

IRR's own server entrypoint (`npm run server:dev` → `tsx server/executive-transport.ts`) was started;
it logged `Executive transport listening on 127.0.0.1:8787` and bound loopback-only per its existing
`EXEC_TRANSPORT_BIND_HOST = '127.0.0.1'` (`executive-transport.ts:718`). **The bind host, port, CORS
rule and write guard were not altered.** Probes were issued from inside the sandbox:

| Endpoint | Result | Payload shape observed |
|---|---|---|
| `GET /api/decision-matrix` | **HTTP 200**, 2,192 B | `matrixType`, `note`, `companies` (**13**), `universe`, `provenance` |
| `GET /api/cross-sector` | **HTTP 200**, 3,513 B | `portfolio`, `diversification`, `ranking` (**13**), `opportunity` (**10**), `correlation`, `decisions` (**13**), `provenance` |
| `GET /api/company/banking` | **HTTP 200**, 973 B | `companyId: Banking-H1`, `sector`, `decision`, `overrides`, `pillars`, `resolvedSubsegment`, `resolvedArchetype`, `calibrationVersion`, `inputs`, `evidence`, `provenance` |
| `GET /api/company/healthcare` | **HTTP 200** | second-sector confirmation |

Response `provenance` blocks, verbatim:

- `dataSource` = `"certified v2.0 platform (CSIP NormalizedHolding quality/valuation + certified engine outputs) over frozen v1.1 Replay Baseline inputs"` (decision-matrix) / `"certified v2.0 platform (CSIP cross-sector engine) over frozen v1.1 Replay Baseline inputs"` (cross-sector)
- `freshness` = `"SNAPSHOT"`
- `calibratedAt` = `"2026-08-09T00:00:00.000Z"`
- `transportSemantics` = `"1:1 mapping; transport transformation != decision transformation"`

The transport process was stopped after the probe.

### 3.3 IPD engine library tests — 32/32 pass

`npm ci` + `npm run build` (exit **0**), then `node --test` on the compiled suites at IPD
`main@e1f94e9`:

| Suite | Result |
|---|---|
| `tests/wsd_p11_engine_adapters.test.ts` | **8 pass / 0 fail** |
| `tests/wsc_p10_intelligence.test.ts` | **4 pass / 0 fail** |
| `tests/shell_intelligence_surface.test.ts` | **20 pass / 0 fail** |
| **Total** | **32 pass / 0 fail** |

---

## 4. Why IPD is genuinely absent from these paths (positive evidence, not absence of search)

### 4.1 IRR's engine tier is in-repo, not IPD

`frontend/server/executive-transport.ts` contains **0** references to
`iips-production-market-data` and **27** references to `../../iips-platform/src/…`. `iips-platform`
is a directory **inside the IRR repository** — 415 files in total, of which
`iips-platform/src/sector-engines/**` is 163 files across **14 engine directories** (`auto`,
`banking`, `capital-markets`, `consumer`, `cross-sector`, `energy`, `healthcare`, `hospitality`,
`industrials`, `insurance`, `materials`, `technology`, `telecom`, `utilities`).

### 4.2 IPD exposes no route by which it could supply them

| IPD surface | Finding |
|---|---|
| IPC operation set (`src/ipc/protocol.ts:21-41`) | A **closed** v1 set of seven operations — `portfolio.list`, `portfolio.get`, `portfolio.revisions`, `portfolio.create`, `portfolio.save`, `portfolio.reset`, `portfolio.delete` — plus reserved `portfolio.analytics`. **No company, sector, cross-sector or decision-matrix operation.** |
| Public exports (`package.json`) | `./portfolio-ui`, `./pit`, `./d114-non-production`, `./operator-drop`. **`engine_adapters` is not publicly exported.** |
| HTTP surface | IPD has **no HTTP server**; `src/ipc/endpoint.ts` is the only listener. |
| `src/engine_adapters/**` | `frozen_engines.ts` (103 L, P11-01 / AD-04 / AD-16 — `FrozenEngines.executeSectorEngine`), `sector_defaults.ts` (75 L, P11-03 / AD-12 — `GOVERNED_SECTOR_DEFAULTS`, 14 ids), plus `databound_executor`, `recalculation_dag`, `namespace_guard`. **In-process library only.** |
| `src/intelligence/**` | `news_engine.ts` (D06), `estimates_engine.ts` (D07), `macro_engine.ts` (D08), `altdata_engine.ts` (D09) — **data-domain engines (P10)**, not screen-level intelligence. |
| `cross-sector` / `decision-matrix` under `src/` | **0 files** for each. |

### 4.3 What IRR *does* consume from IPD (for contrast — none of it is these screens)

| IRR consumer | IPD subpath |
|---|---|
| `frontend/server/pit/ipdPitReadAdapter.ts:28-29`, `nonProductionPitStore.ts:24-25`, `nonProductionRuntimePitStore.ts:37-38` | `iips-production-market-data/pit`, `/d114-non-production` |
| `frontend/server/reports/persistence-port.ts` | pinned persistence reference |
| `frontend/server/user-portfolio/userPortfolioContract.ts:112-113` | lineage/contract |
| `frontend/src/api/brokerImport.ts:55`, `features/portfolio-import/BrokerImportSurface.tsx:28`, `irrPortfolioStorePortAdapter.ts:47` | `/portfolio-ui` |

Pins in IRR `frontend/package.json`: `iips-production-market-data@279d1eed…`,
`iips-np04-governed-persistence@2e11fa3b…`, `iips-broker-import@70b24f02…`.
**Company, sector, cross-sector and decision-matrix appear in none of these paths.**

### 4.4 The two engine taxonomies do not share a mapping

| Side | Identifiers |
|---|---|
| IRR (`iips-platform/src/sector-engines/`) | auto, banking, capital-markets, consumer, cross-sector, energy, healthcare, hospitality, industrials, insurance, materials, technology, telecom, utilities |
| IPD (`GOVERNED_SECTOR_DEFAULTS`) | `SECTOR_IT`, `SECTOR_BANKING`, `SECTOR_AUTO`, `SECTOR_PHARMA`, `SECTOR_FMCG`, `SECTOR_METALS`, `SECTOR_OIL_GAS`, `SECTOR_POWER`, `SECTOR_CEMENT`, `SECTOR_TELECOM`, `SECTOR_CONSUMER_DURABLES`, `SECTOR_CAPITAL_GOODS`, `SECTOR_CHEMICALS`, `CSIP_COMPOSITE` |

Strict identifier intersection: **1 of 14** (`banking`). Several further pairs plausibly correspond by
name (auto/automotive, telecom/telecommunications, IT/technology, metals/materials, oil-gas/energy,
power/utilities, pharma/healthcare, capital-goods/industrials, consumer-durables/consumer), but
**no authoritative mapping is recorded anywhere in either repository**. This is the concrete basis for
the standing finding that IPD/IRR engine equivalence is not established — see §7.

---

## 5. IPD-A07 — disposition: **CLOSED**

> ### `CLOSED — NO IPD UI IMPLEMENTATION REQUIRED; EXISTING IRR CAPABILITY CONFIRMED.`

**Recorded findings supporting the closure:**

1. **IRR owns the four user-facing screens and their existing intelligence implementation.** Company
   Intelligence, Sector Intelligence, Cross-Sector Intelligence and Decision Matrix are implemented,
   navigable and connected to their intended services **within IRR**, served by IRR-owned
   `frontend/server/executive-transport.ts` over IRR-owned `iips-platform/src/sector-engines/**`.
2. **No IPD dependency exists in their current data paths.** Verified by source trace (§4.1–§4.3), by
   execution (§3.1) and by live probe (§3.2).
3. **Duplicating these screens in IPD is not required, and transplanting historical UI components is
   not required.** The historical IPD refs that carry such components
   (`arena/01a0814b@da43051`, `arena/01a0cf86@ea70a8c4`, `arena/01a0d1d3@1c5f46ca`,
   `arena/01a0d33d@887ecce0`) are **not** a viable source in any case: their components are ~2× the
   size of IRR's authoritative versions and differ substantially
   (`CompanyIntelligence` 226 vs 105 L, 243 differing lines; `ReplayExplorer` 171 vs 110 L, 251;
   `DecisionMatrix` 234 vs 121 L, 195; `EvidenceExplorer` 125 vs 100 L, 95;
   `CrossSectorIntelligence` 211 vs 149 L, 80), and they import an API client tier
   (`api/company`, `api/evidence`, `api/replay`, `api/decisionMatrix`, `api/dataMode`,
   `components/state/DataModeUnavailable`) that is **absent from those branches and from IPD `main`**
   (`frontend/src/api` = 0 files on IPD `main`; `frontend/server` = 0 files on IPD `main` vs 122 in
   IRR). A port would not compile and would duplicate an accepted IRR capability.
4. **No IPD integration gap was established**, therefore no IPD implementation was performed. Nothing
   was created, ported or connected in this pass.

---

## 6. IPD P11 engines — in-process library capability, integration **not commissioned**

The IPD frozen sector scoring capability **remains an in-process library capability**. Its integration
with the four IRR screens **has not been commissioned**.

| Aspect | Status |
|---|---|
| Implementation | Present on `main`: `src/engine_adapters/frozen_engines.ts`, `sector_defaults.ts`, `databound_executor.ts`, `recalculation_dag.ts`, `namespace_guard.ts` |
| Tests | **32/32 pass** this pass (§3.3) |
| Public export | **Not exported** — `package.json` exposes only `./portfolio-ui`, `./pit`, `./d114-non-production`, `./operator-drop` |
| Transport | **None.** No HTTP surface; the IPC operation set is closed and portfolio-only |
| Commissioned consumer | **None.** No product consumer is commissioned for these screens |
| Governing record | `IPD_P11_BOUNDED_LIBRARY_SCOPE_AND_ROW26_RECONCILIATION_2026-10-20.md`: *"the existing in-process IPD library capability… A specific product consumer is **not commissioned**… **No HTTP transport is required**… The IRR repository has its own engine adapter and route; no IPD call was established"* |

This record **confirms** that characterization against current `main` and changes nothing about it. The
library stays as it is: implemented, tested, unexported, unwired, unconsumed.

---

## 7. P11 Row 26 `CertifiedSectorEngineId` bridge — **PROGRAM AUTHORITY DECISION PENDING**

The Row 26 `CertifiedSectorEngineId` **"bridge"** wording and its **E2E-pending** status are recorded
here as a **separate, still-open Program Authority decision**. This document does **not** close it.

| Point | Record |
|---|---|
| Status | **PROGRAM AUTHORITY DECISION PENDING — NOT DECIDED, NOT COMPLETE** |
| Why it stays open | `IPD_P11_BOUNDED_LIBRARY_SCOPE_AND_ROW26_RECONCILIATION_2026-10-20.md`: the Row 26 *"bridge"* label *"does not name a particular consumer, observable integration, transport, engine mapping, or acceptance test. An authorized interpretation is required before changing the Row 26 status or treating it as closed."* |
| Related open item | `IIPS_V3_DEC06_P11_MAIN_ADMISSION_DECISION_PACKAGE_2026-10-21.md` (`IIPS-V3-DEC06-P11-MAIN-ADMISSION-DECISION-PACKAGE-2026-10-21-01`) — status **`DECISION REQUIRED — NOT DECIDED`**; *"acceptance ≠ admission"* |
| **Engine equivalence** | **NOT INFERRED AND NOT CLAIMED.** No IPD/IRR engine equivalence is asserted by this record. Strict identifier intersection is 1 of 14 and no authoritative mapping exists (§4.4). The prior record's finding that equivalence *"is not presumed and is not established as an acceptance requirement"* stands unchanged |
| Owner | Program Authority (+ UI authorizing role). **Not** resolvable by either repository's engineering work |

The closure of IPD-A07 in §5 is a **scope** determination — *IPD need not build these screens* — and is
deliberately **not** an answer to the Row 26 bridge question, which is a different question about a
different artifact.

---

## 8. Scope of this closure, and one recorded residual

The IRR outstanding-action register defines `IPD-A07` (`docs/integration/reference-inventory-refresh-2026-11-02/IIPS_V3_OUTSTANDING_ACTION_REGISTER_2026-11-02.csv`, row `IPD-A07`)
over *"Recovered **executive/company/sector/reports/command-palette** UI trees"*, which is **broader**
than the four screens investigated here. The IPD-side record of the same action
(`IIPS_V3_IPD_P01-02_AND_RECOVERED_UI_RECONCILIATION_2026-11-02.md`, L326) scopes it to *"which of the
four"*, i.e. Company / Sector / Cross-Sector / Decision Matrix — the four verified in §2–§3.

The closure in §5 is therefore recorded **for the four verified screens**. The other families named in
the IRR CSV row were inspected only for existence, and are recorded here factually rather than closed
on unverified grounds:

| Family | IRR `main` | IPD `main` | Status |
|---|---|---|---|
| Company / Sector / Cross-Sector / Decision Matrix | implemented + tested + live-probed | not present, **not required** | **CLOSED (§5)** |
| Executive | `features/executive/ExecutiveDashboard.tsx`, `api/executive.ts` | `features/executive/ExecutiveSurface.tsx` **already admitted on `main`** | No IPD implementation outstanding; **not** re-verified by test/probe in this pass |
| Reports | `features/reports/ReportDetail.tsx`, `api/reports.ts` | `/reports` → `ReportsStructural` (honest fail-closed, `App.tsx:416`) | **Residual** — outside this pass's scope; no IPD requirement established |
| Command palette | **absent** | **absent** | Nothing to close — exists in neither repository |

**IRR-side follow-up (separate IRR work item, not performed here).** The authoritative `IPD-A07` row
itself lives in the **IRR** repository and still reads `SCOPE / ACCEPTANCE DECISION REQUIRED`. Per the
standing IPD-only workflow, changing that row is an **IRR-owned** change and is **not** made from this
IPD session. This IPD record is the evidence an IRR-side update would cite. No IRR file was modified.

---

## 9. Boundaries, limitations and non-duplication statement

**Boundaries respected:**

- **No IRR modification.** IRR `git status --porcelain --untracked-files=no` → **0** entries; HEAD
  unchanged at `9e0a0415`. IRR was read and executed, never written.
- **No IPD product code, engine, IPC contract, migration, manifest or governance decision changed.**
  This pass adds IPD documentation only.
- **No duplicate screens created in IPD.** IRR owns the user-facing experience; IPD supplies backend
  data and services. Nothing was transplanted from any historical branch.
- No ref, branch or tag was created, moved, reset or deleted in either repository.
- The transport's loopback-only bind, port, CORS rule and write guard were **not** altered for the
  probe.

**Limitations — stated, not glossed:**

1. The 30 IRR tests are **jsdom-level**, and the live probe exercised the HTTP / service / engine
   layers. **No real browser render was performed**, and no operator/browser acceptance is claimed.
2. Only the **four targeted** IRR suites were executed, not the full IRR suite.
3. IRR dependency installation required `npm ci --strict-ssl=false` because the sandbox's TLS
   interception rejects the `codeload.github.com` certificate chain. This is an **environment
   workaround only**; no lockfile, manifest or tracked file was changed.
4. **No native Windows execution** was performed. Nothing here is Windows-host or browser acceptance
   evidence, and the outstanding *"Windows visual acceptance"* owner action in the P01-02 record is
   unaffected.
5. Data returned by the probes is the certified **`SNAPSHOT`** reference baseline
   (`calibratedAt 2026-08-09`), not live market data. That is the screens' existing, accepted
   semantics — not a gap identified here.

---

## 10. Cross-references

| Record | Relationship |
|---|---|
| `IIPS_V3_IPD_SCOPED_WORKPACKAGE_REGISTER_2026-11-02.md` | Primary IPD progress register. **IPD-6** carried `IPD-A07` as its remaining action; see its **§0.2 dated addendum** for this closure |
| `IIPS_V3_IPD_P01-02_AND_RECOVERED_UI_RECONCILIATION_2026-11-02.md` | Defines `IPD-A07` (§6) and the four `OUTSIDE REGISTRY` surfaces. Its IPD-A07 row is **superseded by §5 of this record** for the four screens; its `DEP-P01-07` and *"Windows visual acceptance"* rows are unaffected |
| `IPD_P11_BOUNDED_LIBRARY_SCOPE_AND_ROW26_RECONCILIATION_2026-10-20.md` | Governing bounded-library scope and Row 26 reconciliation. **Confirmed unchanged** by this investigation |
| `IIPS_V3_DEC06_P11_MAIN_ADMISSION_DECISION_PACKAGE_2026-10-21.md` | `DEC-06` — **DECISION REQUIRED, NOT DECIDED**. Still pending; not touched |
| `IIPS_V3_CAPABILITY_MATRIX_51x17_RECONSTRUCTION_2026-10-23.md` (IPD) / IRR `…CAPABILITY_MATRIX_51x17_REASSESSED_2026-10-31.csv` | Rows 3, 4, 17, 24 assign these surfaces to **IRR** with IRR-side evidence anchors — consistent with §5 |
| IRR `docs/integration/reference-inventory-refresh-2026-11-02/IIPS_V3_OUTSTANDING_ACTION_REGISTER_2026-11-02.csv` | Authoritative `IPD-A07` row definition (IRR-owned; **not** modified — see §8) |
