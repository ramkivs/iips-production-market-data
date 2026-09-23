# Institutional Investment Platform System (IIPS)
# Phase 4 — Research × UI03 Binding Design Record (READ-ONLY DESIGN WORK)

**Authority Act:** `phase4-research-identity-designation-2026-09-23-001` (RAMKI, Option A,
identity = `UI03_FUNDAMENTAL_ANALYSIS`)
**Scope:** READ-ONLY DESIGN ONLY. **This record confers NO implementation authority** — no
route change, navigation change, component, test, or payload is authorized by it.
**Base Checkpoint:** `bc6d8ae5cf07a21f7436bac04076a215187473f3`
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
**Recorded At (local, Asia/Calcutta):** 2026-09-23

---

## 1. THE BINDING CONTRACT (what a future implementation authority would execute)

| Element | Design |
| --- | --- |
| Route | `/research` — single route, **zero child routes** (unchanged path constant; `ROUTES.research` already exists — **no route-table change required**) |
| Surface identity | `UI03_FUNDAMENTAL_ANALYSIS` — one of the 14 registered `UISurfaceId` literals |
| Bound asset | `UI03FundamentalAnalysisBuilder.build()` — existing, local, pure, synchronous, offline; exercised by 2 suites (`wse_surfaces_ui01_ui14`, `wse_p13_ui_integration`) |
| Pattern | The established presentation-only fail-closed Path-L pattern, as executed for UI04→`/intelligence` (1C), UI11→`/evidence` (2), UI02→`/executive` (3) |
| Component shape (when authorized) | `ResearchSurface` bound to the builder via a pure `useMemo`; reuse of `MetricCard`/`MetricGroup`/`DataTable`, `FreshnessBadge`, `EmptyState`/`StaleDataState`/`UnavailableState`; scoped `.app-surface*` styling only (no CSS concatenation) |
| Mount change (when authorized) | `App.tsx`: `ROUTES.research` swaps `FeaturePlaceholder surface="Research"` → the real surface; `navigation.ts`: Research `future` → `partial` |
| Tests (when authorized) | A mirror of the Executive suite shape: identity-verbatim rendering from a harness payload; fail-closed on absent/partial input; no-leak assertion; prohibition source-scan (no `computeLineageHash`/`Math.random`/`Date.now`/`fetch(`/auth/`/api/`); shell-integration + non-regression for the four existing surfaces; NAV-02d-style partial assertion with `mustBeFuture` 8 → 7 |

## 2. THE INPUT CONTRACT (why the surface fails closed today)

`UI03FundamentalAnalysisBuilder.build()` requires — none optional:

- **`fundamentals: FundamentalsDTO`** — `companyId`, `scope` (`CONSOLIDATED`/…), `fiscalYear`,
  `quarter?`, `periodType`, **`ratios: FinancialRatioMetrics`** (peRatio, pbRatio, evToEbitda,
  roe, roce, debtToEquity, operatingMargin, netProfitMargin, splitAdjustedEps,
  qualityState, calculationNotes), optional-but-structural `ttmStatement` /
  `incomeStatement` / `balanceSheet` / `cashFlow` blocks, `quality: QualityState`, and a full
  **`provenance: ExecutiveProvenance`** (sourceClassification, asOf, evaluatedAt,
  dataVersion, **lineageDigest**, quality, replayConstraintApplied).
- **`companyName: string`**.
- Optional PIT-vintage parameters the builder supports: `filingDate`, `periodEndDate`,
  `restatementIndex` (rendered as `pinnedVintage` on the view model).

**Gate finding R-1 stands: ZERO governed `FundamentalsDTO` payloads exist anywhere in the
repository** (current tree or JSON artifacts). Therefore, when implemented under this
pattern, the mounted `/research` route renders its governed unavailable state
**unconditionally** — exactly the Executive Option-A material consequence, for the same
reason, disclosed in advance this time.

The view model additionally carries `balanceSheetIdentityValid` (the builder verifies the
assets = liabilities + net-worth identity) and `pinnedVintage` — both are values **surfaced
verbatim**, never computed client-side from raw data (P13-03 contract: *"normalized ratios
without client calculation"*).

## 3. WHAT THE SURFACE WOULD RENDER (when a governed payload eventually exists)

From `UI03FundamentalAnalysisViewModel`: governed D05 identity (companyName + companyId,
never fabricated), quality indicator (worst-case `UNAVAILABLE > PARTIAL > STALE > GOOD` is
single-input here — the DTO's own `quality`), pinned report vintage (filingDate /
periodEndDate / restatementIndex), the ratios record verbatim, TTM statements
(revenue/ebitda/netIncome/operatingCashFlow/quartersCount), and the balance-sheet identity
verdict — each traceable to the supplied `ExecutiveProvenance` (sourceClassification,
dataVersion, lineageDigest **displayed verbatim, never generated**), with the AD-17 replay
constraint rendered verbatim when present.

## 4. PROHIBITIONS THAT BIND ANY FUTURE IMPLEMENTATION (carried from the act + standing constraints)

1. **No synthetic `FundamentalsDTO`** — fabricated ratios/TTM/balance-sheet blocks would
   present a complete, confident, fictional fundamentals view; a forged `lineageDigest`
   would be indistinguishable from a real one downstream.
2. **No fixture promotion** — the existing UI03 test harnesses (in
   `wse_surfaces_ui01_ui14` / `wse_p13_ui_integration`) are *test constructions*, and they
   carry the **ungoverned `companyId: 'INFY'`** form; they are not product data and must
   never be wired to the route.
3. **No lineage generation** — `computeLineageHash`/`computeSha256`/`createHash` unreachable
   from the surface; no SHA-256-shaped literal; no value-invention primitives
   (`Math.random`/`Date.now`/`new Date`).
4. **No API/server/auth/network/credentials** — no `api/*`, no `authFetch`, no OIDC/
   Keycloak, no `frontend/server/**`, no production ingestion.
5. **No route-table change** — `ROUTES.research` exists; no child routes; no restoration of
   the six pruned historical Research routes.
6. **No D115 authorization** — the governed identity binding for a real payload (R-6) may
   implicate D115, which remains WITHHELD.
7. **Macro stays excluded** — UI13 / MacroContext / `/api/macro` remain out of scope absent
   D91/D88 relief.

## 5. GAPS THIS DESIGN CANNOT CLOSE (deliberately unresolved)

| Ref | Gap | Owner |
| --- | --- | --- |
| **R-1** | Governed offline `FundamentalsDTO` source (with real statements/ratios + full provenance) | Future authority |
| **R-5** | Authorizing act for the fundamentals domain (none exists; only D05 identity act repo-wide) | Future authority |
| **R-6** | Governed D05 identity binding for fundamentals records (`EQ_INFY_IN` form; may implicate D115) | Future authority |
| — | Implementation authority for the binding in §1 | Future authority (this record is design-only) |

## 6. NEXT EXECUTABLE GATE (provided automatically per the act)

**Decision required: disposition of the UI03↔`/research` binding design.** Options (NOT
interchangeable):

- **(i) AUTHORIZE UI03 PRESENTATION-ONLY PATH-L CONVERGENCE** — implementation of §1 under
  the established fail-closed pattern: `ResearchSurface` component, `App.tsx` mount swap,
  navigation `future` → `partial`, mirror test suite; surface renders its governed
  unavailable state until R-1 exists. (The Executive Option-A pattern, with the
  single-mandatory-input simplicity of the Evidence pattern.)
- **(ii) COMMISSION THE FUNDAMENTALS PAYLOAD SPECIFICATION** — R-1 + R-5 + R-6 requirements/
  contract specification only (no implementation, no identity fabrication).
- **(iii) DEFER** — keep this designation + design record as the standing state; Research
  remains `future` in navigation until a further act.

**Standing disclosure:** D115 C/D = WITHHELD / UNRESOLVED / NOT AUTHORIZED · D91/D88 macro
governance standing, no relief · `productionEligible` false · external live sockets 0 ·
implementation authority NOT GRANTED by this record · Windows visual acceptance NOT claimed
by Arena.

---

**End of Design Record — `phase4-research-identity-designation-2026-09-23-001` §3 authorizes
this record and nothing further.**
