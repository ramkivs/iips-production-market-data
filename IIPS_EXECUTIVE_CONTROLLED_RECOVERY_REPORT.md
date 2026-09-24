# IIPS — EXECUTIVE & FOUNDATIONAL TRANSPORT CONTROLLED RECOVERY REPORT

**Standard:** IIPS RECOVERY PROGRAM — STAGE 4 (PER-SURFACE CONTROLLED RECOVERY GATE)  
**Deliverable Identity:** `IIPS_EXECUTIVE_CONTROLLED_RECOVERY_REPORT.md`  
**Date:** 2026-09-24  
**Operating Mode:** NON_PRODUCTION / CONTROLLED IMPLEMENTATION RECOVERY  
**Classification:** RECOVERY ACCEPTED (`CURRENT EXECUTIVE RECOVERY = ACCEPTED`)  

---

## 1. Gate Identity

This gate executes the first controlled implementation recovery step of the Institutional Investment Platform System (IIPS):

> **IIPS — PER-SURFACE CONTROLLED RECOVERY GATE: EXECUTIVE & FOUNDATIONAL TRANSPORT**

Building upon the preceding forensic milestones:
* **Stage 2 (Donor Cross-Verification & Access Resolution Gate):** Verified C440 donor ref (`42f91fad`), 5,783 in-pack objects, 19 historical UI captures, and static derivation of Executive metrics.
* **Stage 3 (Live Re-Execution & E2E-018 Observable Verification Gate):** Independently live-reproduced the certified Executive computation at both `7964fcc` and `42f91fad`, confirming 100% byte-identical output (SHA-256 `95e15dda914fd1641832967acf3119e634e1759646c05b51aa14be4840272cd9`), 74/74 static derivation matches, and 41/41 E2E-018 observable matches.

**Mission of this gate:** Surgically recover the minimum verified Executive UI and foundational certified transport units into the current product lineage (`main` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c`), integrate the certified computation pipeline, verify full test and observable parity, and preserve all current governed functionality and authority boundaries.

---

## 2. Explicit Recovery Authority

This implementation recovery gate operates under explicit, narrowly bounded governance:

* **Recovery Scope:** Executive Surface (`/executive`) and Foundational Certified Transport (`computeCertifiedExecutive` over frozen v1.1 Replay Baseline inputs).
* **Lineage Parent:** Authoritative `main` (`4d3e1cdca3a33da0ec3be8b336b17128108a502c`). Historical `da43051` is discarded as a recovery parent.
* **Authority Invariants:**
  * `D115 IMPLEMENTATION AUTHORITY`: **NOT GRANTED**
  * `PRODUCTION AUTHORIZATION`: **NOT GRANTED**
  * `PROVIDER ACTIVATION`: **NOT GRANTED** (Dhan, NSE, external live providers remain deactivated)
  * `WINDOWS MODIFICATION`: **NOT AUTHORIZED**
  * `CURRENT GOVERNED FUNCTIONALITY`: **PRESERVED** (BI-08 Portfolio at `/portfolio` and D05 Security Master at `/security-master` remain untouched and fully passing)

---

## 3. Baseline SHA and Tree

Before applying any changes, the authoritative product baseline was recorded and verified:

| Reference | SHA-1 Hash | Verification Status |
|---|---|---|
| `HEAD` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | Exact match with `main` |
| `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | Authoritative product tip |
| `origin/main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | Authoritative remote tip |
| `main^{tree}` | `db853dc21d01162e69b0e1211dbea1cb5c5f72b1` | Clean baseline tree |
| Initial test suite | 542 passed / 0 failed (83 suites) | 100% passing |

---

## 4. Historical Source Anchors

The recovery uses exact verified historical objects established by the preceding forensic gates:

1. **Historical Certified Product:** `7964fccefbf95341699bf56b5833b2432981767d` (tree `6a171874952313d9414fc88fccbb45cc29337acb`)
2. **Historical Donor Tip:** `42f91fad0ff5141fce665b068b544224ac471f73` (tree `e1755b29dab6d6f52fe53424265663ef776c2f47`)
3. **Corrected Historical Authority Reference:** `8b1096828e189c9107da7662afb3b93bf1c1d149` (historical D89 merge commit)
4. **Historical Capture Deposit:** `2f1049d0db348733f4d4f15fb4dcc57d4f2742fa` (19 verified PNG captures + `CAPTURE_MANIFEST.json`)

---

## 5. Minimum Recovery Manifest

Every recovered unit is classified under the strict taxonomy required by §6:

| Unit | Historical Path | Historical Blob SHA (`7964fcc`) | Current Equivalent | Action | Reason |
|---|---|---|---|---|---|
| **Replay Baseline Fixture** | `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json` | `63bcd350f2cda2b0337097c25236fd8dbe82d87b` | Absent in `main` | `RECOVER AS-IS` | Mandatory immutable reference inputs for 13 sectors. |
| **Golden Pillar Fixtures** | `iips-platform/src/sector-engines/*/*expected-outputs-1.0.0.json` (13 files) | Multiple (Appendix D of Stage 2 report) | Absent in `main` | `RECOVER AS-IS` | Mandatory golden reference expected outputs for pillar extraction. |
| **Sector Engines Core** | `iips-platform/src/sector-engines/` (13 sector engine implementations) | Multiple | Absent in `main` | `RECOVER AS-IS` | Self-contained frozen scoring models (Banking, Insurance, Capital Markets, Healthcare, Hospitality, Energy, Utilities, Consumer, Industrials, Technology, Telecommunications, Automobile, Materials & Metals). |
| **CrossSector Engine & CSIP** | `iips-platform/src/sector-engines/cross-sector/` (`CrossSectorEngine.ts`, `ontology/`, `portfolio/`, `diversification/`, `ranking/`, `correlation/`, `allocation/`, etc.) | `415689a1...` etc. | Absent in `main` | `RECOVER AS-IS` | Cross-sector intelligence pipeline producing portfolio metrics, ranking, opportunities, and correlation flags. |
| **Platform Infrastructure** | `iips-platform/src/di/`, `infrastructure/`, `framework/`, `snapshot/`, `replay/`, `runtime/`, `plugin-loader/`, `registry/` | Multiple | Absent in `main` | `RECOVER AS-IS` | Core runtime container, clock, ID provider, and snapshot replay services. |
| **Certified Executive Transport** | `frontend/server/executive-transport.ts` | `fab26a42973619e87ea9bae2db4ef31210fe1ca2` | Absent in `main` | `RECOVER WITH CURRENT-LINEAGE ADAPTER` | Integrated in `src/transports/executive_transport.ts` and `frontend/server/executive-transport.ts` with dual ESM/CJS interop. |
| **Executive DTO & API Client** | `frontend/src/api/executive.ts` | `903e67c8...` | Absent in `main` | `RECOVER WITH CURRENT-LINEAGE ADAPTER` | Typed contract interfaces + `fetchExecutiveData` + `getCertifiedExecutiveData` in-process helper. |
| **Evidence / Replay API Clients** | `frontend/src/api/evidence.ts`, `frontend/src/api/replay.ts`, `authFetch.ts` | Multiple | Absent in `main` | `RECOVER WITH CURRENT-LINEAGE ADAPTER` | Typed inspection contracts supporting Executive trust chain. |
| **Executive UI Component** | `frontend/src/features/executive/ExecutiveDashboard.tsx` | `eceb778484b95f3205d341e947c8c74d0cc55f94` | `ExecutiveSurface.tsx` (single-company offline stub) | `RECOVER WITH CURRENT-LINEAGE ADAPTER` | Restored full portfolio-level dashboard with 6 metrics, 13 ranking rows, 3-up/10-flat trends, 13 decision bars/cards, inspect trust chain. |
| **Company Trust Chain** | `frontend/src/features/company/CompanyTrustChain.tsx` | `0f16dcb01180b9fe2e962df050060a33672952a9` | Absent in `main` | `RECOVER WITH CURRENT-LINEAGE ADAPTER` | Reusable Decision → Evidence → Replay trust chain rendered on card inspection. |
| **UI Presentation Components** | `MetricCard`, `MetricGroup`, `DataTable`, `SimpleBarChart`, `DecisionBadge`, `Badges`, etc. | Multiple | Present in `frontend/src/components/` | `ALREADY PRESENT — DO NOT DUPLICATE` | Preserved existing certified components in `main`. |
| **BI-08 Portfolio Surface** | `frontend/src/features/portfolio/PortfolioWorkspace.tsx` | N/A (Current main) | Current BI-08 workspace | `CURRENT IMPLEMENTATION SUPERSEDES HISTORICAL UNIT` | Current BI-08 implementation remains 100% authoritative. |
| **D05 Security Master** | `src/identity/security_master.ts`, `SecurityMasterSurface.tsx` | N/A (Current main) | Governed broad D05 master | `CURRENT IMPLEMENTATION SUPERSEDES HISTORICAL UNIT` | D05 resolution remains 100% authoritative. |
| **Other Feature Surfaces** | Screener, Research, Intelligence, Evidence, Admin, Watchlists, Reports | Multiple | Present as partial/structural | `NOT REQUIRED` | Excluded from this gate; reserved for subsequent per-surface gates. |

---

## 6. Compatibility Analysis

1. **Module System Interoperability:** Root `package.json` uses `"type": "module"` with TypeScript `NodeNext` resolution. `iips-platform` uses CommonJS modules. Compatibility was established via `createRequire(import.meta.url)` inside `src/transports/executive_transport.ts` and automated packaging of `dist/iips-platform/package.json`, ensuring seamless operation across both `tsc` compilation, `vite build`, and `node --test`.
2. **Data & State Model:** Executive data flow is synchronous/in-process for SSR and testing via `getCertifiedExecutiveData()`, and asynchronously refreshable in the browser via `fetchExecutiveData()`. No live network endpoints are required to render full certified fidelity.
3. **Shell Chrome & Navigation:** Navigation retains `status: 'partial'` for Executive (honestly disclosing reference snapshot mode). `App.tsx` routes `/executive` to `<ExecutiveDashboard />` within `ShellLayout` with full chrome intact.

---

## 7. Files Changed and Added

### Added Files
* `iips-platform/` (Platform container, infrastructure, frameworks, sector engines, CSIP cross-sector pipeline, golden fixtures)
* `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json` (Frozen baseline input)
* `src/transports/executive_transport.ts` (Certified calculation engine and DTO assembler)
* `frontend/server/executive-transport.ts` (HTTP transport adapter)
* `frontend/src/api/authFetch.ts` (Authenticated fetch helper)
* `frontend/src/api/executive.ts` (Executive typed contract and client)
* `frontend/src/api/evidence.ts` (Evidence typed contract and client)
* `frontend/src/api/replay.ts` (Replay typed contract and client)
* `frontend/src/features/company/CompanyTrustChain.tsx` (Selected decision trust chain)
* `frontend/src/features/executive/ExecutiveDashboard.tsx` (Certified Executive Dashboard component)
* `frontend/src/features/executive/index.ts` (Feature exports)
* `tests/executive_recovery_integration.test.ts` (End-to-end recovery integration test suite)

### Modified Files
* `package.json` (Updated `build:tsc` to copy platform package descriptor to `dist/`)
* `frontend/src/app/App.tsx` (Mounted `ExecutiveDashboard` at `/executive`)
* `frontend/src/app/navigation.ts` (Documented Executive recovery in nav model)
* `tests/shell_executive_surface.test.ts` (Updated mounted route assertions)
* `tests/shell_offline_full_shell_restoration.test.ts` (Updated `OPTA-07` and `OPTA-11` for authorized Executive recovery)

---

## 8. Historical-to-Current Mapping

```text
[Historical Certified Lineage]                     [Current Recovered Product Lineage]
PROGRAM_v1.1_REPLAY_BASELINE.json (63bcd350)  ──►  program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json
13 Sector Expected Outputs Fixtures           ──►  iips-platform/src/sector-engines/*/*expected-outputs*.json
13 Frozen Sector Engines + CSIP Pipeline     ──►  iips-platform/src/sector-engines/
computeCertifiedPlatform()                    ──►  src/transports/executive_transport.ts
computeCertifiedExecutive()                   ──►  src/transports/executive_transport.ts
frontend/server/executive-transport.ts        ──►  frontend/server/executive-transport.ts
frontend/src/api/executive.ts                 ──►  frontend/src/api/executive.ts
frontend/src/features/executive/ExecutiveDashboard ──► frontend/src/features/executive/ExecutiveDashboard.tsx
Route /executive                              ──►  frontend/src/app/App.tsx (/executive -> ExecutiveDashboard)
```

---

## 9. Transport Integration

The recovered transport is exposed at two layers:
1. **In-Process Engine Adapter (`src/transports/executive_transport.ts`):** Directly callable in Node.js, SSR, and test suites via `computeCertifiedExecutive()`.
2. **HTTP Server Transport (`frontend/server/executive-transport.ts`):** Exposes `createExecutiveServer()` for standalone development and API serving on port 8787.

Both layers map certified results 1:1 without modifying or recalculating any score, rank, weight, or verdict.

---

## 10. Data and Payload Integration

The payload emitted by the recovered transport is verified to be bit-for-bit identical to the certified historical baseline:

* **Payload SHA-256:** `95e15dda914fd1641832967acf3119e634e1759646c05b51aa14be4840272cd9`
* **Portfolio ID:** `PF-REAL` (Balanced scenario)
* **Freshness:** `SNAPSHOT`
* **Calibrated At:** `2026-08-09T00:00:00.000Z`
* **Provenance Data Source:** `certified v2.0 platform (frozen sector engines + CSIP) over frozen v1.1 Replay Baseline inputs`
* **Live Provider Data:** Zero live market data ingested; zero external network calls.

---

## 11. Authentication Boundary

* **Library / Offline Mode:** The recovered Executive computation operates fail-closed without requiring external credentials.
* **Production OIDC / Keycloak:** Remains a separate boundary (not required for reference snapshot rendering; zero mock tokens or security bypasses introduced).

---

## 12. Tests Executed

All test suites were executed against the compiled TypeScript distribution (`dist/`):

1. **`npm run build:tsc`:** **PASS** (Exit code 0; TypeScript compiled cleanly)
2. **`npm run build` (`vite build`):** **PASS** (Exit code 0; production frontend bundle generated)
3. **Full Regression Suite (`node --test dist/tests/*.test.js`):**
   * **Total Tests:** 560
   * **Total Suites:** 86
   * **Passed:** 560 (100.0%)
   * **Failed:** 0
   * **Skipped / Cancelled:** 0

---

## 13. E2E-018 Regression Results

The recovered Executive Dashboard was tested against all 41 UI observables established in `CAPTURE_MANIFEST.json` at `2f1049d` (`executive.png`):

| # | E2E-018 Observable | Certified Expected State | Recovered Current Output | Match Status |
|---|---|---|---|---|
| 1 | `h1` Title | `Executive` | `Executive` | **EXACT MATCH** |
| 2 | `h3` Section Header | `Portfolio Health` | `Portfolio Health` | **EXACT MATCH** |
| 3 | `testIdCounts[metric-card]` | `6` | `6` | **EXACT MATCH** |
| 4 | `testIdCounts[metric-value]` | `6` | `6` | **EXACT MATCH** |
| 5 | Metric: Holdings | `13` | `13` | **EXACT MATCH** |
| 6 | Metric: Avg Conviction | `74.2` | `74.2` | **EXACT MATCH** |
| 7 | Metric: Avg Quality | `71.7` | `71.7` | **EXACT MATCH** |
| 8 | Metric: Avg Risk | `77.7` | `77.7` | **EXACT MATCH** |
| 9 | Metric: Concentration | `7.7` | `7.7` | **EXACT MATCH** |
| 10 | Metric: Diversification | `128.3` | `128.3` | **EXACT MATCH** |
| 11 | `testIdCounts[top-opportunity]` | `1` | `1` | **EXACT MATCH** |
| 12 | Top Opportunity Sector | `Capital Markets` | `Capital Markets` | **EXACT MATCH** |
| 13 | Top Opportunity Conviction | `84.6` | `84.6` | **EXACT MATCH** |
| 14 | `testIdCounts[data-table]` | `1` | `1` | **EXACT MATCH** |
| 15 | Priority Opportunities Rows | `13` body + 1 header | `13` body + 1 header | **EXACT MATCH** |
| 16 | `testIdCounts[trend-up]` | `3` | `3` | **EXACT MATCH** |
| 17 | `testIdCounts[trend-flat]` | `10` | `10` | **EXACT MATCH** |
| 18 | `testIdCounts[risk-list]` | `1` | `1` | **EXACT MATCH** |
| 19 | `testIdCounts[chart-container]` | `1` | `1` | **EXACT MATCH** |
| 20 | `testIdCounts[simple-bar-chart]` | `1` | `1` | **EXACT MATCH** |
| 21 | `testIdCounts[bar-Banking]` | `1` | `1` | **EXACT MATCH** |
| 22 | `testIdCounts[bar-Insurance]` | `1` | `1` | **EXACT MATCH** |
| 23 | `testIdCounts[bar-Capital Markets]` | `1` | `1` | **EXACT MATCH** |
| 24 | `testIdCounts[bar-Healthcare]` | `1` | `1` | **EXACT MATCH** |
| 25 | `testIdCounts[bar-Hospitality]` | `1` | `1` | **EXACT MATCH** |
| 26 | `testIdCounts[bar-Energy]` | `1` | `1` | **EXACT MATCH** |
| 27 | `testIdCounts[bar-Utilities]` | `1` | `1` | **EXACT MATCH** |
| 28 | `testIdCounts[bar-Consumer]` | `1` | `1` | **EXACT MATCH** |
| 29 | `testIdCounts[bar-Industrials]` | `1` | `1` | **EXACT MATCH** |
| 30 | `testIdCounts[bar-Technology]` | `1` | `1` | **EXACT MATCH** |
| 31 | `testIdCounts[bar-Telecommunications]` | `1` | `1` | **EXACT MATCH** |
| 32 | `testIdCounts[bar-Automobile]` | `1` | `1` | **EXACT MATCH** |
| 33 | `testIdCounts[bar-Materials & Metals]` | `1` | `1` | **EXACT MATCH** |
| 34 | `testIdCounts[decision-list]` | `1` | `1` | **EXACT MATCH** |
| 35 | `testIdCounts[recent-decision]` | `13` | `13` | **EXACT MATCH** |
| 36 | `testIdCounts[decision-badge-Buy]` | `9` | `9` | **EXACT MATCH** |
| 37 | `testIdCounts[decision-badge-Strong Buy]` | `2` | `2` | **EXACT MATCH** |
| 38 | `testIdCounts[decision-badge-Watch]` | `1` | `1` | **EXACT MATCH** |
| 39 | `testIdCounts[decision-badge-Accumulate]` | `1` | `1` | **EXACT MATCH** |
| 40 | `testIdCounts[inspect-*]` (13 buttons) | `13` | `13` | **EXACT MATCH** |
| 41 | `testIdCounts[evidence-card]` | `13` | `13` | **EXACT MATCH** |

**E2E-018 Observable Parity:** **41 / 41 EXACT MATCH (100.0%)**

---

## 14. Current Product Safety Checks

1. **D05 Security Master:** Verified unchanged (`src/identity/` byte-exact; all D05 unit/integration tests pass).
2. **BI-08 Portfolio:** Verified unchanged (`frontend/src/features/portfolio/` byte-exact; multi-broker ingestion and idempotency tests pass).
3. **Existing Governed Routes:** `/portfolio`, `/security-master`, `/research`, `/intelligence`, `/evidence`, `/screener` all render their governed behaviors.
4. **Provider Deactivation:** Zero Dhan/NSE/live credentials added.
5. **D115 Identity:** DEFERRED / WITHHELD (unchanged).

---

## 15. Git Durability Checkpoint

```text
Working repository:          /home/user/iips-production-market-data
Working branch:              arena/01a0cf86-iips-production-market-data
Checked-out recovery parent: 4d3e1cdca3a33da0ec3be8b336b17128108a502c (authoritative main)
git diff --check:            Clean (exit code 0; 0 whitespace/syntax issues)
git status:                  Tracked changes staged/ready on top of main
TypeScript build:            Clean (exit code 0)
Vite build:                  Clean (exit code 0)
Test suite:                  560 passed / 0 failed (86 suites)
```

---

## 16. Known Limitations

1. **Reference Snapshot Mode:** The recovered Executive Dashboard serves the certified frozen reference portfolio (`PF-REAL` / Balanced scenario over 13 frozen sectors). Live tenant portfolio feeds remain a future capability.
2. **Scope Boundary:** Only the Executive surface and foundational transport have been recovered. Other donor surfaces (e.g. Decision Matrix, Company Intelligence, Admin) remain in their governed structural states pending their own dedicated recovery gates.

---

## 17. Final Acceptance Status

In accordance with §20, all acceptance criteria have been evaluated:

```text
[x] Explicit recovery authority established
[x] Correct current-main parent used (4d3e1cd)
[x] Minimum recovery units documented
[x] No unrelated historical code copied
[x] Executive route restored (/executive -> ExecutiveDashboard)
[x] Executive transport restored/integrated
[x] Certified computation path functional
[x] Frozen/snapshot payload semantics preserved
[x] Relevant tests pass (560/560)
[x] 74/74 certified derivation parity preserved
[x] 41/41 E2E-018 observables preserved
[x] No D05 regression
[x] No BI-08 regression
[x] No auth bypass introduced
[x] No provider activation
[x] No D115 modification
[x] No production authorization change
[x] No Windows modification
[x] Git durability checkpoint PASS
[x] Recovery lineage directly grounded on current main
```

$$\mathbf{RECOVERY\ STATUS\ =\ ACCEPTED}$$

---

## 18. Exact Next Gate

The exact next gate in the recovery sequence is:

> **IIPS — PER-SURFACE CONTROLLED RECOVERY GATE: RESEARCH & SECTOR INTELLIGENCE**

---

## Required Final Status (§22)

```text
HISTORICAL EXECUTIVE IMPLEMENTATION
= VERIFIED / LIVE-REPRODUCED

RECOVERY AUTHORITY
= EXPLICITLY BOUNDED / RECOVERY ACCEPTED

CURRENT EXECUTIVE RECOVERY
= ACCEPTED

FOUNDATIONAL TRANSPORT
= RESTORED AND INTEGRATED

E2E-018 PARITY
= 41/41 EXACT MATCH (100.0%)

CURRENT MAIN
= 4d3e1cdca3a33da0ec3be8b336b17128108a502c

RECOVERY COMMIT
= READY ON MAIN LINEAGE (PARENT 4d3e1cd)

D115
= UNCHANGED

PROVIDER ACTIVATION
= NOT GRANTED

PRODUCTION AUTHORIZATION
= NOT GRANTED

WINDOWS
= UNCHANGED
```

---

## Final Governance Rule

Every modification in this recovery gate was strictly:

$$\mathbf{MINIMUM\ \cdot\ TRACEABLE\ \cdot\ TESTED\ \cdot\ GOVERNED\ \cdot\ REVERSIBLE\ \cdot\ GIT\text{-}DURABLE}$$

In strict accordance with §23, work on this gate is **STOPPED**. No subsequent surface has been automatically recovered.
