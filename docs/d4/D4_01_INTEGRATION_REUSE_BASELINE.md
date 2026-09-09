# D4 Part B/C — Definitive Integration/Reuse Baseline

**SPECIFICATION ONLY.** Authoritative INT wording preserved from
`IIPS_..._TRACKER_INTEGRATION_ALIGNED.xlsx`, sheet `IIPS Integration Baseline`, rows 2–19.
D2's reconstructed INT labels are NOT used. Dispositions are evidence-based per D3 and
authority-adjusted per G-A.

**Row count:** 18 original → **22 effective** (INT-011, INT-014, INT-015 split; INT-019 added for D05).

> **Rule applied:** the tracker's `REUSE UI / INTEGRATE DATA` treatment is **not permitted to
> conceal NEW or ADAPT work**. Where evidence contradicts the proposed treatment, the
> evidence-based disposition governs (AD-14).

---

## C.1 Platform / contract integration points

### INT-001 — Certified IIPS architecture / platform contracts

| Field | Value |
|---|---|
| **Authoritative requirement** | "New canonical data contracts must map to existing certified interfaces; no architecture rewrite." |
| **Tracker treatment** | REUSE / PRESERVE |
| **Existing capability** | Frozen platform contracts: `SectorPlugin`, `PluginIdentity`, `PluginManifest`, `ExecutionRequest{requestId, inputs}`, `ExecutionResult{state, snapshotRef, evidenceRef, metadata}`; `Container` DI; `RuntimeCoordinator` |
| **Primary evidence** | `iips-platform/src/plugin-loader/PluginContract.ts` (header: *"reimplemented from IES-005.1 sec.ts (frozen)"*); `src/di/Container.ts`; `src/runtime/RuntimeCoordinator.ts` |
| **Evidence status** | **VERIFIED** |
| **Final disposition** | **REUSE** |
| **Existing contract/touchpoint** | `ExecutionRequest.inputs` is the engine-facing boundary |
| **Required delta** | **None to the contract.** P01 canonical model must be expressible as `DataSnapshot<T>.fields` and reach engines via `ExecutionRequest.inputs` unchanged in shape |
| **Validation required** | Contract-conformance tests; no-diff check on `PluginContract.ts` |
| **Authority dependency** | None |
| **Phase/gate** | P01 · gate P00/P01 |

### INT-002 — Existing Engine / methodology execution

| Field | Value |
|---|---|
| **Authoritative requirement** | "Production data becomes an upstream governed input; existing methodology authority remains authoritative unless separately changed." |
| **Tracker treatment** | REUSE / ADAPT |
| **Existing capability** | **13 certified sector engines** (AD-8): banking, insurance, capital-markets, healthcare, hospitality, energy, utilities, consumer, industrials, technology, telecom, auto, materials — all `1.0.0` `FROZEN`, calibration `1.0.0` |
| **Primary evidence** | `iips-platform/src/sector-engines/*`; `src/integration/EngineRegistry.ts` (`CERTIFIED_ENGINES`); `docs/integration/IIPS_v3.0_E2E-030_CERTIFICATION.md` §12 *"CERTIFIED — 13-ENGINE E2E-030 DELTA"* @ `67e89aa` |
| **Evidence status** | **VERIFIED** (supersedes D3 "PARTIALLY VERIFIED") |
| **Final disposition** | **REUSE** (all 13) |
| **Existing contract/touchpoint** | `SectorPlugin.execute(ctx, ExecutionRequest)` |
| **Required delta** | **Zero engine change.** Data supplied upstream via `DataBoundExecutor`. Namespace + collision guard required at the merge (AD-16) |
| **Validation required** | Determinism per engine; oracle MATCH; provenance tests; **full revalidation gated on M-1 (AD-4)** |
| **Authority dependency** | **AD-4** (revalidation) · **AD-16 ADR** (Ramki/Sai) · methodology authority Ramki/Sai |
| **Phase/gate** | P11 · gate P11 |

### INT-003 — Existing evidence / provenance / replay mechanisms

| Field | Value |
|---|---|
| **Authoritative requirement** | "Production data must carry source, timestamp, freshness, lineage and reproducibility metadata through existing evidence mechanisms." |
| **Tracker treatment** | REUSE / EXTEND ONLY WHERE REQUIRED |
| **Existing capability** | `EvidencePipeline`; `SnapshotService` (`Snapshot`, `schemaVersion 'snapshot-1.0'`, `deepFreeze`); `SnapshotStore` (append-only, duplicate-ID rejection); `ReplayService` (`ReplayResult`) |
| **Primary evidence** | `src/framework/evidence/EvidencePipeline.ts`; `src/snapshot/SnapshotService.ts`; `src/snapshot/SnapshotStore.ts`; `src/replay/ReplayService.ts` |
| **Evidence status** | **PARTIALLY VERIFIED** — mechanisms exist; replay suites do not execute at HEAD (M-1); `ReplayService` returns literals (M-2) |
| **Final disposition** | **ADAPT** |
| **Existing contract/touchpoint** | `Snapshot.provenance: Readonly<Record<string,string>>` — the additive extension point |
| **Required delta** | Carry `provider` + `dataVersion` + `asOf` + contributing `DataSnapshot.snapshotId`(s) into engine-result lineage (Part 7). Additive; existing SNAPSHOT-only executions unchanged |
| **Validation required** | Lineage/provenance tests; PIT replay; deterministic serialization; backward-compat for SNAPSHOT-only |
| **Authority dependency** | **AD-3 ADR (Ramki/Sai)** · **AD-17 UNRESOLVED** (M-2) · AD-4 |
| **Phase/gate** | P11/P12 · gate P11/P15 |

### INT-004 — Existing G2 / DTO / product API contracts

| Field | Value |
|---|---|
| **Authoritative requirement** | "Expose new production-data capabilities through stable governed contracts; avoid UI coupling to providers." |
| **Tracker treatment** | REUSE / ADAPT |
| **Existing capability** | `EngineApiAdapter` (`EngineApiRequest`/`EngineApiResponse`, `apiVersion '1.0'`, structured `provenance{}`); product HTTP transports (`executive-`, `admin-`, `engine-`, `product-transport.ts`); 10 typed API clients |
| **Primary evidence** | `src/integration/EngineApiAdapter.ts`; `frontend/server/*.ts`; `frontend/src/api/*.ts` |
| **Evidence status** | **VERIFIED** |
| **Final disposition** | **EXTEND** |
| **Existing contract/touchpoint** | `apiVersion '1.0'` is the versioned extension point |
| **Required delta** | **"G2" retired (AD-12).** Add data DTOs, freshness/quality/completeness, screener + object-resolution contracts additively (Part 9) |
| **Validation required** | Schema compatibility; regression on existing endpoints; provider-neutrality (no provider identity in DTOs) |
| **Authority dependency** | AD-12 (resolved) |
| **Phase/gate** | P12 · gate P12 |

---

## C.2 UI integration points (AD-14 corrections applied)

### INT-005 — Dashboard (UI01)

| Field | Value |
|---|---|
| **Authoritative requirement** | "Existing Dashboard remains the product surface; production-grade values replace deterministic/non-production inputs through certified APIs." |
| **Tracker treatment** | REUSE UI / INTEGRATE DATA |
| **Existing capability** | `ExecutiveDashboard.tsx`, route `/executive`, client `api/executive.ts`, transport `GET /api/executive` |
| **Primary evidence** | `frontend/src/features/executive/ExecutiveDashboard.tsx`; `frontend/src/app/App.tsx:30` |
| **Evidence status** | **VERIFIED** |
| **Final disposition** | **REUSE** |
| **Required delta** | Transport/data-source only. **No component rebuild.** Replace literal provenance + hard-coded `confidence: 0.8`; populate real freshness |
| **Validation required** | Functional; provenance derived-not-literal; freshness; degraded states |
| **Authority dependency** | AD-3/AD-6 (lineage display) · AD-4 (blocked for certification) |
| **Phase/gate** | P13 · gate P13-P15 |

### INT-006 — Company Workspace (UI02)

| Field | Value |
|---|---|
| **Tracker treatment** | REUSE UI / INTEGRATE DATA |
| **Existing capability** | `CompanyIntelligence.tsx`, route `/research/company/:id`, `api/company.ts`, `GET /api/company/:id` |
| **Primary evidence** | `frontend/src/features/company/CompanyIntelligence.tsx`; `executive-transport.ts:639` |
| **Evidence status** | **PARTIALLY VERIFIED** — ⚠ endpoint is keyed by **sector**, not company |
| **Final disposition** | **REUSE** (component) + **ADAPT** (identity semantics) |
| **Required delta** | Component reusable. Endpoint must resolve **canonical security identity** via the P04 adapter. **Cardinality change** 1 holding/sector → N — see OI-08 |
| **Validation required** | Functional; lineage; PIT; identity resolution |
| **Authority dependency** | **AD-1** · OI-08 (cardinality) |
| **Phase/gate** | P04 + P13 |

### INT-007 — Portfolio (UI03)

| Field | Value |
|---|---|
| **Tracker treatment** | REUSE UI / INTEGRATE DATA |
| **Existing capability** | `PortfolioWorkspace.tsx`, routes `/portfolio`, `/portfolio/*`, `api/portfolio.ts` |
| **Evidence status** | **VERIFIED** |
| **Final disposition** | **REUSE** |
| **Required delta** | Transport/data-source only. Add freshness + corporate-action-adjusted values (D04) |
| **Validation required** | Functional; freshness; provenance; adjustment correctness |
| **Authority dependency** | AD-4 |
| **Phase/gate** | P13 |

### INT-008 — Research (UI04)

| Field | Value |
|---|---|
| **Tracker treatment** | REUSE UI / INTEGRATE DATA |
| **Existing capability** | Route `/research` renders `<FeaturePlaceholder surface="Research" />`; `/research/sector/:id` also placeholder. Children real: `/research/company/:id`, `/research/cross-sector`, `/research/engines` |
| **Primary evidence** | `frontend/src/app/App.tsx:34,36` |
| **Evidence status** | **CONTRADICTED** |
| **Final disposition** | **ADAPT** *(AD-14 correction — not REUSE)* |
| **Required delta** | Build the Research parent surface + Sector sub-surface; **preserve existing children unchanged** |
| **Validation required** | Functional; provenance; reproducibility; child-route regression |
| **Authority dependency** | AD-14 |
| **Phase/gate** | P13 |

### INT-009 — Screener (UI05)

| Field | Value |
|---|---|
| **Tracker treatment** | REUSE UI / INTEGRATE DATA |
| **Existing capability** | **NONE.** No route, component, API client or transport |
| **Primary evidence** | `grep -ri screener frontend/ iips-platform/` → **0 hits** |
| **Evidence status** | **NOT FOUND** (positive absence) |
| **Final disposition** | **NEW** *(AD-14 correction)* |
| **Required delta** | Governed product contract **certified before UI implementation (AD-9)**, then UI. Consumes D01/D02/D03/D05 across the universe |
| **Validation required** | Deterministic filters; freshness propagation; data-quality propagation; universe correctness |
| **Authority dependency** | **AD-9** (resolved: contract first) · AD-1 (universe identity) |
| **Phase/gate** | P12 (contract) → P13 (UI) |

### INT-010 — Decision Center (UI06)

| Field | Value |
|---|---|
| **Tracker treatment** | REUSE UI / INTEGRATE DATA |
| **Existing capability** | `DecisionMatrix.tsx`, `/intelligence/decision-matrix`, `api/decisionMatrix.ts`. Code comment: *"presentational scatter of CERTIFIED axes only"*, `matrixType: 'scatter'` |
| **Primary evidence** | `frontend/src/features/decision-matrix/DecisionMatrix.tsx`; `executive-transport.ts:295,316` |
| **Evidence status** | **PARTIALLY VERIFIED** — matrix exists; **no governed decision workflow** (no proposals/approvals/history) |
| **Final disposition** | **EXTEND** *(AD-14 correction)* |
| **Required delta** | Reuse matrix; add decisions, proposals, approvals, history, evidence linkage |
| **Validation required** | Functional; evidence; audit/provenance regression |
| **Authority dependency** | AD-14 |
| **Phase/gate** | P13 |

### INT-011a — Watchlists (UI07) — *SPLIT from INT-011*

| Field | Value |
|---|---|
| **Authoritative requirement (inherited)** | "Market/event changes and alert inputs consume validated canonical data." |
| **Existing capability** | **NONE.** `grep -i watchlist` → 0 hits |
| **Evidence status** | **NOT FOUND** (positive absence) |
| **Final disposition** | **NEW** *(AD-14)* |
| **Required delta** | Persistent lists, triggers, score-change detection; new contract + UI |
| **Validation required** | Persistence; trigger correctness; freshness |
| **Authority dependency** | AD-14 (split + NEW) |
| **Phase/gate** | P13 |

### INT-011b — Alerts (UI09) — *SPLIT from INT-011*

| Field | Value |
|---|---|
| **Existing capability** | **NONE.** Only ARIA `role="alert"` attributes in `ShellStates.tsx`/`StateComponents.tsx` — accessibility markup, **not** an alerts capability |
| **Evidence status** | **NOT FOUND** (positive absence) |
| **Final disposition** | **NEW** *(AD-14)* |
| **Required delta** | Rules, events, notifications, acknowledgement; new contract + UI |
| **Validation required** | Event/threshold; freshness; acknowledgement audit |
| **Authority dependency** | AD-14 |
| **Phase/gate** | **P10** + P13 *(distinct from UI07 — Alerts carries a P10 data dependency)* |

### INT-012 — Reports (UI08)

| Field | Value |
|---|---|
| **Tracker treatment** | REUSE UI / INTEGRATE DATA |
| **Existing capability** | No Reports UI. Platform type `PortfolioReport{reportId, reportType, portfolioId, payload}` exists |
| **Primary evidence** | `src/sector-engines/cross-sector/types.ts` |
| **Evidence status** | **PARTIALLY VERIFIED** |
| **Final disposition** | **EXTEND** *(AD-14 correction)* |
| **Required delta** | Reuse report data type; build templates + generation UI + **PIT reproducibility** |
| **Validation required** | Historical/PIT reproducibility; lineage; source/timestamp |
| **Authority dependency** | **AD-3** (PIT lineage) · AD-14 |
| **Phase/gate** | P08 + P13 |

### INT-013 — Collaboration (UI10)

| Field | Value |
|---|---|
| **Existing capability** | **NONE.** No comments/mentions/sharing/assignments/activity |
| **Evidence status** | **NOT FOUND** (positive absence) |
| **Final disposition** | **NEW** *(AD-14 correction)* |
| **Required delta** | Full capability; must reference **governed IIPS objects**, never raw provider records |
| **Validation required** | Object/reference integrity |
| **Authority dependency** | AD-14 |
| **Phase/gate** | P13 |

### INT-014a — Administration (UI11) — *SPLIT from INT-014*

| Field | Value |
|---|---|
| **Authoritative requirement (inherited)** | "Expose only approved operational/provider/entitlement controls through governed admin boundaries." |
| **Existing capability** | **9 components** — `AdminOverview`, `AdminData`, `AdminEngines`, `AdminIdentity`, `AdminOperations`, `AdminPlatform`, `AdminTenancy`, `AdminAudit`, `Administration`; route `/admin/*`; `admin-transport.ts`; 14 admin endpoints; `DataGovernanceRuntime` wired |
| **Primary evidence** | `frontend/src/features/admin/`; `frontend/server/admin-transport.ts` |
| **Evidence status** | **VERIFIED** — strongest UI evidence in the repository |
| **Final disposition** | **EXTEND** *(AD-14)* |
| **Required delta** | Add provider configuration, entitlement, and data-plane operational panels additively |
| **Validation required** | Authorization; tenant isolation; audit |
| **Authority dependency** | **Security/identity authority UNKNOWN** · AD-11 |
| **Phase/gate** | P03 + P16/P17 |

### INT-014b — Settings (UI12) — *SPLIT from INT-014*

| Field | Value |
|---|---|
| **Existing capability** | Partial — `AdminIdentity.tsx`, `core/session/session.ts` (role stub), `core/theme`, `core/tokens`. **No user settings surface** |
| **Primary evidence** | `docs/v3.0/PROGRAM_v3.0_G3_IDENTITY_TENANT_BOUNDARY.md` §5: authentication/session **Missing**, enforcement **Not wired** |
| **Evidence status** | **PARTIALLY VERIFIED** |
| **Final disposition** | **ADAPT** *(AD-14)* |
| **Required delta** | Data preferences + user configuration; depends on the unresolved G3 auth gap (M-5) |
| **Validation required** | Authorization; tenant scoping |
| **Authority dependency** | **Security/identity authority UNKNOWN — P03 BLOCKED** |
| **Phase/gate** | P03 + P13 |

### INT-015a — Global Search (UI13) — *SPLIT from INT-015*

| Field | Value |
|---|---|
| **Authoritative requirement (inherited)** | "Security master and governed product objects provide search/navigation targets." |
| **Existing capability** | **NONE.** No search route, component, index or API |
| **Evidence status** | **NOT FOUND** (positive absence) |
| **Final disposition** | **NEW** *(AD-14)* |
| **Required delta** | Cross-domain search + **object-resolution contract**; depends on P04 canonical identity |
| **Validation required** | Search identity; object resolution; tenant scoping |
| **Authority dependency** | **AD-1** (identity) · AD-14 |
| **Phase/gate** | **P04** + P13 |

### INT-015b — Command Palette / Quick Actions (UI14) — *SPLIT from INT-015*

| Field | Value |
|---|---|
| **Existing capability** | **NONE.** No palette, no `Cmd+K` handler |
| **Evidence status** | **NOT FOUND** (positive absence) |
| **Final disposition** | **NEW** *(AD-14)* |
| **Required delta** | Action orchestration over governed domains; depends on UI13 |
| **Validation required** | Action authorization; object resolution |
| **Authority dependency** | AD-14 |
| **Phase/gate** | P13 (after UI13) |

---

## C.3 Certification / reference / boundary integration points

### INT-016 — Existing E2E / certification suites

| Field | Value |
|---|---|
| **Authoritative requirement** | "New data-plane integration must preserve existing certified behavior while adding production-data qualification." |
| **Existing capability** | 506 platform tests; 186 frontend tests; E2E-025→030 certification artifacts |
| **Primary evidence** | Executed: platform **454 pass / 52 fail**; frontend **149 pass / 12 fail / 25 skipped**. Root cause M-1 (10-entry `ENGINE_FACTORY` vs 13-sector baseline), present at certified HEAD `67e89aa` |
| **Evidence status** | **CONTRADICTED at HEAD** |
| **Final disposition** | **ADAPT** |
| **Required delta** | Add data-plane suites. **Existing suites must be repaired by the existing-IIPS program first (AD-10)** |
| **Validation required** | Full regression + new data-plane suites |
| **Authority dependency** | **AD-4 REQUIRE REVALIDATION** · **AD-10 EXTERNAL** · AD-17 unresolved |
| **Phase/gate** | **P15 — HARD BLOCKED** |

### INT-017 — Existing target/reference screenshot

| Field | Value |
|---|---|
| **Authoritative requirement** | "Screenshot defines target product surface coverage; it does not authorize a visual-only rebuild." |
| **Existing capability** | `word/media/image1.png` (1,851,396 bytes) embedded in the new-program SPEC |
| **Evidence status** | **VERIFIED (as reference artifact)** |
| **Final disposition** | **REUSE (reference only)** |
| **Required delta** | None. Functional parity governs over pixel similarity |
| **Validation required** | Functional parity + accessibility/responsive/visual checks; record concessions |
| **Authority dependency** | None |
| **Phase/gate** | P14/P15 |

### INT-018 — Production activation boundary

| Field | Value |
|---|---|
| **Authoritative requirement** | "Production credentials, licensing, provider activation and live operation are separate from development certification." |
| **Tracker status** | `NOT AUTHORIZED YET` |
| **Existing capability** | **NONE** (correctly). `admin-transport.ts:174` comments its source *"deterministic test feed — NOT production market data"* |
| **Evidence status** | **VERIFIED (absence intended)** |
| **Final disposition** | **NEW** |
| **Required delta** | Licensing, credentials, connectivity, entitlement validation, controlled + reversible activation |
| **Validation required** | Licensing; secrets handling; connectivity; reconciliation; operational readiness |
| **Authority dependency** | **P16 production activation authority UNKNOWN — BLOCKED** |
| **Phase/gate** | P16 |

### INT-019 — Instrument / Security Master — *NEW ROW (AD-14)*

| Field | Value |
|---|---|
| **Rationale for addition** | D05 serves "All domains" and gates P04 → P05–P12, yet **no INT row existed**. D3 gap I-05; AD-14 authorizes the addition |
| **Requirement** | Establish authoritative canonical instrument identity, mappings, listings, exchanges, currencies and lifecycle state for the data plane; map to existing `companyId` through a governed adapter |
| **Existing capability** | **NONE.** Zero hits for `isin\|figi\|cusip\|ticker\|exchange\|listing\|securitymaster\|instrumentmaster`. Sole identifier `companyId: string`, values `` `${sector}-H1` ``; `GET /api/company/:id` keyed by **sector** |
| **Primary evidence** | `executive-transport.ts:170,307,478,639`; `cross-sector/types.ts:7` (`NormalizedHolding.companyId` = certified CSIP join key) |
| **Evidence status** | **NOT FOUND** (positive absence) |
| **Final disposition** | **NEW** (master) + **ADAPT** (adapter to `companyId`) |
| **Existing contract/touchpoint** | `NormalizedHolding.companyId` — **must remain untouched** |
| **Required delta** | Canonical security master + explicit, versioned, auditable identity-mapping adapter (Part 6) |
| **Validation required** | Uniqueness; mapping provenance; lifecycle; **CSIP input-shape non-regression** |
| **Authority dependency** | **AD-1 ADAPTER MODEL** (resolved) · OI-08 cardinality |
| **Phase/gate** | **P04** · gates P05–P12 |

---

## C.4 Summary matrix — 22 effective rows

| INT | Surface / capability | Evidence status | Disposition | Key authority dep | Phase |
|---|---|---|---|---|---|
| 001 | Platform contracts | VERIFIED | **REUSE** | — | P01 |
| 002 | 13 certified engines | VERIFIED | **REUSE** | AD-4, AD-16 | P11 |
| 003 | Evidence/snapshot/replay | PARTIALLY VERIFIED | **ADAPT** | AD-3 ADR, AD-17 | P11/P12 |
| 004 | Engine API / DTO / transports | VERIFIED | **EXTEND** | AD-12 | P12 |
| 005 | UI01 Dashboard | VERIFIED | **REUSE** | AD-4 | P13 |
| 006 | UI02 Company Workspace | PARTIALLY VERIFIED | **REUSE** + ADAPT identity | AD-1, OI-08 | P04+P13 |
| 007 | UI03 Portfolio | VERIFIED | **REUSE** | AD-4 | P13 |
| 008 | UI04 Research | **CONTRADICTED** | **ADAPT** | AD-14 | P13 |
| 009 | UI05 Screener | NOT FOUND | **NEW** | AD-9 | P12→P13 |
| 010 | UI06 Decision Center | PARTIALLY VERIFIED | **EXTEND** | AD-14 | P13 |
| 011a | UI07 Watchlists | NOT FOUND | **NEW** | AD-14 | P13 |
| 011b | UI09 Alerts | NOT FOUND | **NEW** | AD-14 | P10+P13 |
| 012 | UI08 Reports | PARTIALLY VERIFIED | **EXTEND** | AD-3 | P08+P13 |
| 013 | UI10 Collaboration | NOT FOUND | **NEW** | AD-14 | P13 |
| 014a | UI11 Administration | VERIFIED | **EXTEND** | sec. authority UNKNOWN | P03+P16/17 |
| 014b | UI12 Settings | PARTIALLY VERIFIED | **ADAPT** | **P03 BLOCKED** | P03+P13 |
| 015a | UI13 Global Search | NOT FOUND | **NEW** | AD-1 | P04+P13 |
| 015b | UI14 Command Palette | NOT FOUND | **NEW** | AD-14 | P13 |
| 016 | E2E / certification suites | **CONTRADICTED** | **ADAPT** | **AD-4, AD-10** | **P15 BLOCKED** |
| 017 | Reference screenshot | VERIFIED | **REUSE (ref)** | — | P14 |
| 018 | Production activation | VERIFIED (absence) | **NEW** | **P16 auth UNKNOWN** | P16 |
| 019 | **Security master (new row)** | NOT FOUND | **NEW** + ADAPT | **AD-1** | **P04** |

**Totals — REUSE 7 · ADAPT 4 · EXTEND 4 · NEW 7** *(NEW: UI05, UI07, UI09, UI10, UI13, UI14, INT-018/019 counted once each where applicable)*

**Zero UNKNOWN dispositions remain.** All D3 UNKNOWNs were resolved by primary evidence or
by G-A authority decision. No UNKNOWN was converted to NEW to unblock work: each NEW rests
on positive absence (zero grep hits across the full source tree) or on intended absence
(INT-018).
