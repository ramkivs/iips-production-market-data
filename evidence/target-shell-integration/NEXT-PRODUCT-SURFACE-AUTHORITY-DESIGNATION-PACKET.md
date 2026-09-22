# Institutional Investment Platform System (IIPS)
# GATE-NEXT-PRODUCT-SURFACE-AUTHORITY-DESIGNATION — Authority Selection Packet

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Gate ID:** `GATE-NEXT-PRODUCT-SURFACE-AUTHORITY-DESIGNATION`
**Act Type:** AUTHORITY SELECTION / DESIGNATION PREPARATION (non-executable)
**Recording Agent:** Arena (packet preparation only — **no selection made, no ranking, no recommendation**)
**Authority Holder:** RAMKI
**Recorded At (local, Asia/Calcutta):** 2026-09-22
**Antecedent Checkpoint:** `bc3fb80a3e9cc7ecc4b562580ae9390628526bfa`
**Implementation Authority:** **NOT GRANTED FOR ANY SURFACE**

---

## 0. BASELINE INTEGRITY VERIFICATION (required before recording)

A **sandbox re-clone was detected and recovered** at the start of this act. This is the
previously documented failure mode, not data loss.

| Diagnostic | Finding |
| --- | --- |
| Symptom | HEAD resolved to `94f519b` (main); session files appeared dirty/untracked; `bc3fb80`, `a647213`, `848d8f9`, `881371e`, `4096276` all reported MISSING |
| `git reflog` | **2 entries only** (`clone`, `checkout main → arena/...`) — the re-clone tell |
| Refspec | `+refs/heads/main:refs/remotes/origin/main` (main-only) — the root cause |
| `git ls-remote` | arena branch = `bc3fb80a3e9cc7ecc4b562580ae9390628526bfa` — **all work safe on origin** |
| Recovery | full-refspec fetch → **byte-for-byte verification (130/130 files IDENTICAL, 0 differ, 0 absent)** → **mixed** `git reset` |
| `node_modules` / `dist` | lost in re-clone; restored via `npm ci` (33 packages) + `npm run build:tsc` |

**Post-recovery verified baseline:**

| Check | Result |
| --- | --- |
| HEAD | `bc3fb80a3e9cc7ecc4b562580ae9390628526bfa` ✓ matches stated checkpoint |
| LOCAL == REMOTE | ✓ |
| Worktree | CLEAN ✓ |
| Regression | **413/413 tests, 65 suites, 0 failures** ✓ |
| `src/identity` | `9080e997` ✓ FROZEN |
| `src/d114` | `0062ad52` ✓ FROZEN |
| `frontend/src/features/portfolio` | `8491efdc` ✓ FROZEN (BI-08 authoritative) |
| `src/ui` | `1597ed06` ✓ FROZEN |
| Intelligence Path-L surface | PRESENT ✓ FROZEN |
| Intelligence nav status | `partial` ✓ unchanged |

---

## 1. THE GOVERNING LESSON FROM PHASE 1C

`GATE-PHASE-1C-INTELLIGENCE-PAYLOAD-FORENSIC` (`a647213`) established a distinction that
applies to **every** candidate below:

> **A tested Path-L view-model does not imply a governed payload exists to feed it.**

Intelligence had a fully tested local builder (`ui04_domain_intelligence`) and still failed
closed, because the repository contains intelligence-*shaped* test fixtures but **no governed
intelligence data**, and no authorizing act covering that domain.

The repository contains **exactly one** data-authorizing act:
`AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` (D05 security master only).

Each candidate below is therefore reported on **two independent axes**: *presentation
capability* (does a Path-L binding target exist?) and *governed payload availability* (is
there authorized data to render?).

---

## 2. CANDIDATE 1 — EXECUTIVE

### 2.1 Existing Path-L capability
| Attribute | Finding |
| --- | --- |
| Asset | `src/ui/view_models/ui02_executive_summary.ts` — **PRESENT** |
| Builder | `UI02ExecutiveSummaryBuilder.build(...)` |
| Test coverage | Referenced by **6 suites** (`wse_surfaces_ui01_ui14`, `wse_p13_ui_integration`, `wse_durability_cp_w4`, `wsf_durability_cp_w5`, `wsf_p17_operations_telemetry`, `e2e_broad_universe_multi_broker_integration`) — the most heavily tested of the three |
| Presentation components | All 13 recovered in Phase 1A; no new components required |

### 2.2 Known payload / governance limitation
`UI02ExecutiveSummaryBuilder.build()` requires **three** payloads simultaneously:

```
build({ marketData: MarketDataDTO,
        engineScore: EngineScoreOutput,
        intelligence: IntelligenceDTO,     // ← proven ABSENT by gate a647213
        companyName, rank?, viewportWidth? })
```

- **`IntelligenceDTO`** — governed payload **proven absent** by the completed forensic gate.
  Executive therefore **inherits the unresolved Intelligence data dependency in full**.
- **`MarketDataDTO`** — the only `ltp`-bearing artifacts are
  `tests/fixtures/d01_fixtures.json` and `tests/fixtures/operator_drop_fixtures.json`. Both
  exhibit the identical disqualifying pattern found in Phase 1C: `validQuotes` **plus
  `invalidQuotes`** (negative-test harness), and `companyId: "INFY"` — an exchange symbol,
  **not** the governed D05 `companyId` `EQ_INFY_IN`.
- **`EngineScoreOutput`** — defined in `src/engine_adapters/`; governed payload availability
  **not established** by this act.
- Builder rolls up **worst-case quality across all three inputs**, so the weakest input
  governs the entire surface's quality state.

### 2.3 Route / dependency implications
- Route `ROUTES.executive` exists; single flat route; no child routes. No dead-link exposure.
- Path-H alternative (NOT authorized): `api/executive` + `api/evidence` + `api/replay` +
  `api/dataMode`, **3 endpoints** — the highest Path-H cost of any surface.

### 2.4 Frozen-boundary implications
- Binding is **read-only consumption** of `src/ui` (frozen tree `1597ed06`) — no modification
  required, same pattern as the accepted Intelligence implementation.
- No BI-01..BI-08, D05/P04, PortfolioWorkspace, or D114 contact.
- Would add a new `frontend/src/features/executive/` directory + one `App.tsx` route line.

### 2.5 Should a read-only forensic gate precede implementation?
**Yes — materially wider than Intelligence's.** Three payload domains require adjudication
(market data, engine score, intelligence), one of which is **already known to fail closed**.
A presentation-only Executive surface could be built without a gate, but it would render an
empty state for the same reason Intelligence does, and would then require the same `partial`
honesty determination.

---

## 3. CANDIDATE 2 — EVIDENCE

### 3.1 Existing Path-L capability
| Attribute | Finding |
| --- | --- |
| Asset | `src/ui/view_models/ui11_provenance_auditor.ts` — **PRESENT** |
| Builder | `UI11ProvenanceAuditorBuilder.build(...)` |
| Test coverage | `tests/wse_surfaces_ui01_ui14.test.ts` (1 suite) |
| Presentation components | All 13 recovered in Phase 1A |

### 3.2 Known payload / governance limitation
`UI11ProvenanceAuditorBuilder.build()` requires the **narrowest** input of the three:

```
build({ provenance: ExecutiveProvenance,
        companyId, companyName,
        vendorTier?, versionVector?, tenantId?, correlationId?, viewportWidth? })
```

- **No DTO aggregate required** — no `IntelligenceDTO`, no `MarketDataDTO`, no
  `EngineScoreOutput`. It consumes **provenance itself**.
- **Distinguishing factual observation (adjudication deferred to a forensic gate):** the
  repository contains genuine, governed provenance-bearing artifacts under `evidence/` —
  e.g. `evidence/d114/sha256-manifest.json` carries **real SHA-256 digests over real files**
  (sample: `2513d6007efb47cd89023421d302e203819545e3002476576d4f8f8c9135bde9` for a named
  BhavCopy archive), plus certification reports across p13..p17 and D114 integrity and
  reconciliation reports.
- **This is NOT a finding that a governed Evidence payload exists.** Whether those governance
  artifacts may be consumed as *product* provenance — and whether `ExecutiveProvenance`
  (`sourceClassification`, `asOf`, `evaluatedAt`, `dataVersion`, `lineageDigest`, `quality`,
  `replayConstraintApplied`) can be populated from them **without a transformation that
  itself requires authority** — is precisely the question a forensic gate must adjudicate.
  It is recorded here as a factual difference in starting position, not as an outcome.
- `src/transports/engine_api_adapter.ts` contains `computeLineageHash(...)`, i.e. lineage
  digests are **derived locally**, not fetched. Governance status of derived-for-display
  provenance is **unadjudicated**.

### 3.3 Route / dependency implications
- Route `ROUTES.evidence` exists; single flat route; no child routes.
- The Phase-1C-2 packet noted Evidence as *"needs first parameterised route"* under Path H.
  Under **Path L** with a flat landing route, no parameterised routing is required; a
  per-entity deep-link would be a **separate** future decision.
- Path-H alternative (NOT authorized): `api/decisionMatrix` + `api/evidence`.

### 3.4 Frozen-boundary implications
- Read-only consumption of `src/ui` (frozen `1597ed06`).
- **Reading** `evidence/**` — currently governance records, never a product data source.
  Any such use would be a **new consumption pattern** requiring explicit adjudication.
- No BI-01..BI-08, D05/P04, PortfolioWorkspace, or D114 contact.

### 3.5 Should a read-only forensic gate precede implementation?
**Yes.** Narrower in scope than Executive's (one input domain, not three), but it must settle
a genuinely novel governance question: whether repository governance evidence may serve as
product-surface provenance, and under what authority.

---

## 4. CANDIDATE 3 — RESEARCH

### 4.1 Existing Path-L capability
| Attribute | Finding |
| --- | --- |
| Direct asset | **NONE.** No `research`/`decision-matrix` view-model exists in `src/ui/view_models/` (all 14 enumerated; none corresponds to a Research hub) |
| Adjacent assets | `ui03_fundamental_analysis`, `ui05_sector_scoring_radar`, `ui06_multifactor_screener`, `ui12_estimates_distribution` exist and are tested — **but these are DISTINCT product surfaces, not a Research hub** |

> **Scope warning:** binding the adjacent UI03/05/06/12 builders to `/research` would
> constitute **implicitly selecting additional product surfaces**, which the standing
> constraints prohibit. Research cannot be implemented via Path L without either (a) a
> designation that explicitly names which surface(s) `/research` shall present, or (b) new
> construction with no existing tested binding target.

### 4.2 Known payload / governance limitation
- No Path-L binding target ⇒ **the payload question cannot even be posed** until the
  surface's identity is defined by designation.
- Historical Path-H dependency: `frontend/src/api/decisionMatrix.ts` (**NOT authorized**).

### 4.3 Route / dependency implications — the largest of the three
- Current shell: `research: '/research'`, `status: 'future'`, **no child routes declared**
  (verified: zero `research/` child paths in the current shell).
- The **historical** Research hub had **four child components**:
  `ResearchHub.tsx`, `ResearchEvents.tsx`, `SectorIntelligence.tsx`, `MacroContext.tsx`.
  Phase 1A pruned these child routes ⇒ importing the historical hub would reintroduce
  **dead links** unless each child is either implemented or removed.
- **Adverse governance interaction:** the historical `MacroContext.tsx` child is the exact
  component governed by **D91 / authority D88** as **LIVE-only and explicitly exempt from
  SNAPSHOT fallback**. A Research surface including Macro would collide with standing macro
  governance, independent of any payload question.

### 4.4 Frozen-boundary implications
- No frozen tree is contacted by analysis.
- Implementation would require **new** presentation construction and a **navigation contract
  decision** about child routes — the first such decision since the Phase-1A pruning.

### 4.5 Should a read-only forensic gate precede implementation?
**Yes — and necessarily broader than the other two.** Per the gate instruction, Research
*"requires additional forensic analysis before implementation."* That analysis must settle
surface identity, child-route/dead-link contract, and the D91 macro interaction **before**
any payload question becomes meaningful.

---

## 5. COMPARATIVE FACT TABLE (factual only — NOT a ranking)

| Dimension | EXECUTIVE | EVIDENCE | RESEARCH |
| --- | --- | --- | --- |
| Path-L asset exists | Yes (`ui02`) | Yes (`ui11`) | **No** |
| Test suites referencing asset | 6 | 1 | n/a |
| Required payload inputs | **3** (`MarketDataDTO`, `EngineScoreOutput`, `IntelligenceDTO`) | **1** (`ExecutiveProvenance`) | undefined until surface identity designated |
| Known-absent payload inherited | **Yes** — `IntelligenceDTO` (gate `a647213`) | No | n/a |
| Child-route / dead-link exposure | None | None | **Yes** (4 historical children pruned in 1A) |
| Adverse standing governance | Inherits Intelligence fail-closed | None identified | **D91 macro LIVE-only** (if Macro in scope) |
| Frozen-tree modification required | None | None | None |
| Forensic gate recommended first | Yes | Yes | Yes (broadest) |

*The table orders candidates as presented in the gate instruction. No ordering, preference,
or ranking is implied.*

---

## 6. WHAT THIS PACKET DOES NOT DO

- Does **NOT** select a surface — selection is reserved to RAMKI.
- Does **NOT** rank or recommend any candidate.
- Does **NOT** infer or anticipate the authority holder's selection.
- Does **NOT** implement any surface.
- Does **NOT** modify source, tests, navigation, or configuration.
- Does **NOT** reopen API / server / authentication.
- Does **NOT** grant implementation authority for any candidate.
- Does **NOT** alter the Intelligence Path-L implementation or its `partial` status.

---

## 7. RETAINED GOVERNANCE INVARIANTS

| Invariant | State |
| --- | --- |
| Operating mode | `NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV` |
| Intelligence | `PARTIAL / PRESENTATIONAL ONLY / DEFERRED DATA COMPLETION` (frozen) |
| Full product convergence | CONTINUE |
| BI-01..BI-08 | FROZEN / BI-08 AUTHORITATIVE |
| D05/P04 identity | FROZEN |
| PortfolioWorkspace | FROZEN |
| D114 | FROZEN |
| Production fail-closed boundary | FROZEN |
| Overlays (CommandPalette / NotificationDrawer / NotesDrawer) | DEFERRED |
| Auth seam | DEFERRED |
| D115 C / D | WITHHELD / UNRESOLVED / NOT AUTHORIZED |
| `runtimeCompanyId` | UNRESOLVED |
| `implementationAuthority` | **NOT GRANTED FOR THE NEXT SURFACE** |
| `productionEligible` | false |
| External live sockets | 0 |
| Windows visual acceptance | NOT CLAIMED BY ARENA |

---

## 8. AUTHORITY DESIGNATION CHOICES PRESENTED

RAMKI to select **exactly one**:

- **EXECUTIVE** — Path-L asset `ui02_executive_summary`
- **EVIDENCE** — Path-L asset `ui11_provenance_auditor`
- **RESEARCH** — no direct Path-L asset; requires additional forensic analysis

Upon selection, the next executable action is the corresponding **read-only pre-flight /
implementation authorization gate** for that surface. No implementation may begin before it.

---

**End of Authority Selection Packet. STOPPED. No surface selected by Arena.**
