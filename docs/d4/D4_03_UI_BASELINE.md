# D4 Part E — 19-Surface UI Integration Baseline

**SPECIFICATION ONLY.** UI01–UI14 from the authoritative tracker with AD-14 corrections
applied; UI15–UI19 added per AD-13.

> **Governing principle (mandatory):** *Do not rebuild existing UI components unnecessarily.*
> Where a component already consumes a typed API client, the delta is
> **transport / data-source integration**, NOT UI recreation. Applied strictly below.

**Legend — AD-3/AD-6 column:** surface must display or carry market-data lineage
(`provider`/`dataVersion`/`asOf`/contributing `DataSnapshot` IDs).
**AD-4 column:** surface certification is blocked pending M-1 repair + revalidation (external).

---

## E.1 Master matrix

| UI | Surface | Current implementation | Existing API/transport | Current data source | Disposition | AD-3/6 | AD-4 |
|---|---|---|---|---|---|---|---|
| UI01 | Dashboard | `features/executive/ExecutiveDashboard.tsx`, `/executive` | `api/executive.ts` → `GET /api/executive` | 13-engine exec + CSIP; **literal provenance**, `confidence:0.8` hard-coded | **REUSE** | Yes | Yes |
| UI02 | Company Workspace | `features/company/CompanyIntelligence.tsx`, `/research/company/:id` | `api/company.ts` → `GET /api/company/:id` | ⚠ keyed by **sector**, not company | **REUSE** + ADAPT identity | Yes | Yes |
| UI03 | Portfolio | `features/portfolio/PortfolioWorkspace.tsx`, `/portfolio`, `/portfolio/*` | `api/portfolio.ts` → `GET /api/portfolio` | CSIP `NormalizedHolding` | **REUSE** | Yes | Yes |
| UI04 | Research | **Placeholder** `NotYetAuthorized` (`App.tsx:34`) | partial (children only) | children only | **ADAPT** | Yes | Yes |
| UI05 | Screener | **Absent** (0 hits) | none | none | **NEW** | Yes | Yes |
| UI06 | Decision Center | `features/decision-matrix/DecisionMatrix.tsx` — *"presentational scatter"* | `api/decisionMatrix.ts` | certified axes (quality, valuation) | **EXTEND** | Yes | Yes |
| UI07 | Watchlists | **Absent** (0 hits) | none | none | **NEW** | Yes | Yes |
| UI08 | Reports | **Absent** UI; `PortfolioReport` type exists | partial | — | **EXTEND** | Yes | Yes |
| UI09 | Alerts | **Absent** (only ARIA `role="alert"`) | none | none | **NEW** | Yes | Yes |
| UI10 | Collaboration | **Absent** | none | none | **NEW** | No | No |
| UI11 | Administration | **9 components**, `/admin/*` | `api/admin.ts` → 14 `/api/admin/*` endpoints | `admin-transport` + `DataGovernanceRuntime` | **EXTEND** | Yes | Partial |
| UI12 | Settings | Partial (`AdminIdentity`, `core/session`) | partial | session stub | **ADAPT** | No | No |
| UI13 | Global Search | **Absent** | none | none | **NEW** | Yes | Yes |
| UI14 | Command Palette | **Absent** | none | none | **NEW** | No | Yes |
| UI15 | CrossSectorIntelligence | `features/cross-sector/CrossSectorIntelligence.tsx`, `/research/cross-sector` | `api/crossSector.ts` → `GET /api/cross-sector` | certified CSIP engine | **REUSE** | Yes | Yes |
| UI16 | EvidenceExplorer | `features/evidence/EvidenceExplorer.tsx`, `/evidence/:id` | `api/evidence.ts` → `GET /api/evidence/:id` | `EvidencePipeline` | **EXTEND** | **Critical** | Yes |
| UI17 | ReplayExplorer | `features/replay/ReplayExplorer.tsx`, `/evidence/replay/:id` | `api/replay.ts` → `GET /api/replay/:id` | `ReplayService` | **EXTEND** | **Critical** | Yes |
| UI18 | EngineRegistry | `features/engines/EngineRegistry.tsx`, `/research/engines` | `api/engines.ts` → `GET /api/engines` | `CERTIFIED_ENGINES` (13) | **REUSE** | No | Yes |
| UI19 | AiAdvisory | `features/ai-advisory/AiAdvisory.tsx` | `api/aiAdvisory.ts` → `GET /api/ai-advisory/*` | advisory outputs | **ADAPT** | Yes | Yes |

**Totals — REUSE 5 · ADAPT 4 · EXTEND 4 · NEW 6**

---

## E.2 Per-surface integration delta

### UI01 Dashboard — REUSE

- **Integration delta:** transport/data-source only. **No component rebuild.**
- **Provenance/freshness:** replace literal `dataSource`/`freshness`/`calibratedAt` with derived values; replace hard-coded `confidence: 0.8` with real or explicit-null.
- **PIT:** not required (aggregation of current state); mode must be explicitly labelled.
- **Dependencies:** D01, D03, D05; P12 DTO delta.
- **Validation:** functional; provenance derived-not-literal; freshness; degraded states; **no invented business logic** (SPEC Tbl 0 r1).

### UI02 Company Workspace — REUSE (component) + ADAPT (identity)

- **Integration delta:** component reusable as-is. Endpoint must resolve **canonical security identity** via the P04 adapter instead of a sector key.
- **⚠ Cardinality:** today 1 synthetic holding per sector; real data implies N companies per sector — **OI-08**, product-behaviour change requiring authority.
- **PIT:** required (fundamentals as-of, estimate vintage).
- **Dependencies:** **P04/AD-1**, D01, D03, D06, D07.
- **Validation:** functional; lineage; PIT; identity resolution; adapter mapping provenance.

### UI03 Portfolio — REUSE

- **Integration delta:** transport/data-source only. Add corporate-action-adjusted valuations (D04).
- **PIT:** required for historical performance.
- **Dependencies:** D01, D04, D05.
- **Validation:** functional; freshness; provenance; adjustment correctness.

### UI04 Research — ADAPT

- **Integration delta:** build the Research parent + `/research/sector/:id`; **preserve existing children unchanged** (Company, Cross-Sector, Engines).
- **PIT:** required for research reproducibility.
- **Dependencies:** D03, D06, D07, D08.
- **Validation:** functional; provenance; reproducibility; **child-route regression**.

### UI05 Screener — NEW (contract first, AD-9)

- **Integration delta:** governed product contract **certified before UI implementation**, then UI.
- **Freshness/quality:** must propagate per-row `quality` and `completenessPct`; a stale/partial row must be visibly marked, never silently ranked as good.
- **PIT:** required for saved screens replayed at an as-of date.
- **Dependencies:** **AD-9**, D01, D02, D03, D05; P12 contract.
- **Validation:** deterministic filters; freshness propagation; DQ propagation; universe correctness.

### UI06 Decision Center — EXTEND

- **Integration delta:** reuse `DecisionMatrix` presentational scatter; add decisions, proposals, approvals, history, evidence linkage.
- **⚠ Classification:** current matrix is **PRESENTATIONAL over CERTIFIED axes** — it is not itself a certified decision workflow.
- **Dependencies:** UI16 evidence linkage; engine outputs.
- **Validation:** functional; evidence; audit/provenance regression; **no methodology change**.

### UI07 Watchlists — NEW

- **Integration delta:** persistent lists, triggers, score-change detection; new contract + UI.
- **Dependencies:** D01, D05; P12 contract.
- **Validation:** persistence; trigger correctness; freshness.

### UI08 Reports — EXTEND

- **Integration delta:** reuse `PortfolioReport{reportId, reportType, portfolioId, payload}`; build templates, generation, export UI.
- **PIT:** **mandatory** — "Point-in-time correctness is mandatory where applicable" (INT-012 Notes). A report regenerated for a past as-of must reproduce byte-identically.
- **Dependencies:** **AD-3** (lineage), D02, D04; P08.
- **Validation:** historical/PIT reproducibility; lineage; source/timestamp on every figure.

### UI09 Alerts — NEW

- **Integration delta:** rules, events, notifications, acknowledgement; new contract + UI.
- **Distinct from UI07:** carries a **P10** data dependency (news/events) in addition to P13.
- **Dependencies:** D01, D06; P10.
- **Validation:** event/threshold correctness; freshness; acknowledgement audit.

### UI10 Collaboration — NEW

- **Integration delta:** comments, mentions, shared research/watchlists, assignments, activity.
- **Rule:** must reference **governed IIPS objects/evidence**, never raw provider records (INT-013).
- **Dependencies:** UI02, UI04, UI07, UI16.
- **Validation:** object/reference integrity.

### UI11 Administration — EXTEND

- **Integration delta:** additive panels — provider configuration, entitlement management, data-plane operations, feed health. Reuse all 9 existing components.
- **Existing reusable:** `AdminData` already surfaces `DataGovernanceRuntime` classification (AD-11 mechanism).
- **⚠ Blocked:** security/identity authority **UNKNOWN**; G3 auth not wired (M-5).
- **Validation:** authorization; tenant isolation; audit.

### UI12 Settings — ADAPT

- **Integration delta:** data preferences + user configuration.
- **⚠ Blocked:** depends on the unresolved G3 authentication/session gap (M-5) and unknown security authority → **P03 blocked**.
- **Validation:** authorization; tenant scoping.

### UI13 Global Search — NEW

- **Integration delta:** cross-domain search + **object-resolution contract** (company, research, holdings, decisions, evidence, alerts, reports).
- **Rule:** no raw-provider search surface (INT-015 Notes).
- **Dependencies:** **P04/AD-1** canonical identity.
- **Validation:** search identity; object resolution; tenant scoping.

### UI14 Command Palette — NEW

- **Integration delta:** action orchestration over governed domains; depends on UI13 resolution.
- **Validation:** action authorization; object resolution.

### UI15 CrossSectorIntelligence — REUSE *(AD-13)*

- **Integration delta:** transport/data-source only. Certified CSIP engine output.
- **⚠ Constraint:** consumes `NormalizedHolding.companyId` — the **certified CSIP join key**. Identity must arrive via the P04 adapter; **CSIP input shape untouched**.
- **Validation:** CSIP non-regression; lineage.

### UI16 EvidenceExplorer — EXTEND *(AD-13)* — **AD-3 critical**

- **Integration delta:** must surface the **new market-data lineage**: contributing `DataSnapshot` IDs, `provider`, `dataVersion`, `asOf`, alongside existing engine evidence.
- **Why critical:** this is the primary surface at which AD-3 lineage becomes visible/auditable. Without the delta, market-data lineage exists in contract but is invisible to users.
- **Dependencies:** **AD-3 ADR**, Part 7 linkage.
- **Validation:** lineage completeness; provenance derived-not-literal.

### UI17 ReplayExplorer — EXTEND *(AD-13)* — **AD-3 critical**

- **Integration delta:** replay selection/display must disambiguate **data vintage**; a replay must state which `DataSnapshot` vintage it reproduces.
- **⚠ AD-17 UNRESOLVED:** `ReplayService.replay()` currently returns `reproduced: true, byteIdentical: true` as **hard-coded literals** without recomputation (M-2). This surface **displays** those literals. **Not resolved by this program.**
- **Dependencies:** **AD-3 ADR**, **AD-17**, Part 7.
- **Validation:** replay identity disambiguation; PIT; **must not present literal returns as verified reproduction**.

### UI18 EngineRegistry — REUSE *(AD-13)*

- **Integration delta:** minimal. Registry already reflects 13 certified engines.
- **⚠ AD-4:** displayed certification status must reflect revalidation state, not assert stale certification.
- **Validation:** registry accuracy; provenance display.

### UI19 AiAdvisory — ADAPT *(AD-13)*

- **Integration delta:** advisory outputs must be fed by governed data and carry provenance/freshness; must not present advisory inference as certified engine output.
- **Classification requirement:** advisory output is **SYNTHESIZED** (narrative generation, not a deterministic rule over certified inputs), not certified engine data — must be labelled as such (Part 10).
- **Validation:** provenance; classification integrity; no methodology implication.

---

## E.3 Rebuild-avoidance summary

| Category | Surfaces | Work type |
|---|---|---|
| **Transport/data-source integration only** (no UI rebuild) | UI01, UI03, UI15, UI18 | Swap data source; add provenance/freshness |
| **Component reusable, identity/semantics change** | UI02, UI19 | Adapter + labelling |
| **Additive extension to existing component** | UI06, UI08, UI11, UI16, UI17 | New panels/fields; preserve existing |
| **Partial build on existing scaffolding** | UI04, UI12 | Build parent/surface; preserve children |
| **Genuine new build** | UI05, UI07, UI09, UI10, UI13, UI14 | Contract + UI |

**13 of 19 surfaces require no new UI component.** This is the practical expression of
"reuse before rebuild" and is materially different from the original tracker, which implied
11 surfaces were straightforward data swaps when only 4 truly are.
