# D4 Part L — P13 UI Data-Integration Delta (19 Surfaces)

**SPECIFICATION ONLY — NO IMPLEMENTATION.** Authority: AD-13 (UI15–UI19 in scope).

---

## L.1 Provenance classification vocabulary

| Class | Definition | Certified? |
|---|---|---|
| **REAL** | Sourced from a governed external market-data provider via `MarketDataSource`/`DataSnapshot`, with real `asOf`/`dataVersion` | Requires **new** data-plane certification |
| **CERTIFIED ENGINE** | Produced by one of the 13 certified sector engines or CSIP | **YES** (AD-8; AD-4 revalidation pending) |
| **CERTIFIED PRODUCT** | Produced by a certified product-plane mechanism | Only where a certification artifact exists |
| **DERIVED** | Computed in the product plane from REAL or CERTIFIED inputs by a deterministic, specified rule | Requires product-plane certification |
| **SYNTHESIZED** | Generated/fabricated in the product plane (fixtures, heuristics, narrative generation) | **NO** |
| **PRESENTATIONAL** | Layout, labels, formatting, static copy; no data semantics | N/A |

**Rule (user constraint):** a product-plane presentational or synthesized mechanism is **not**
certified merely because the UI exposes a field with a matching name. Hard-coded
confidence/provenance/freshness literals are **SYNTHESIZED**, never REAL lineage.

**Measured examples in the existing tree:**

| Value | Location | Class |
|---|---|---|
| `confidence: 0.8` | `executive-transport.ts:174` | **SYNTHESIZED** |
| `dataSource`, `freshness`, `calibratedAt`, `transportSemantics` | `admin-transport.ts:382,390,423` | **SYNTHESIZED** (literal) |
| `reproduced: true`, `byteIdentical: true` | `ReplayService` (M-2 / AD-17) | **SYNTHESIZED** — ⚠ unresolved |
| Engine `composite`, `verdict`, `state` | 13 engines | **CERTIFIED ENGINE** |
| Ranking / opportunity / ontology outputs | CSIP | **CERTIFIED ENGINE** |
| AI advisory narrative | `/api/ai-advisory/*` | **SYNTHESIZED** |

---

## L.2 Per-surface data-integration delta

Disposition column repeats Part E (Part 2) for traceability.

| UI | Surface | Disp. | REAL data required | CERTIFIED ENGINE | CERT. PRODUCT | SYNTHESIZED (today) | PRESENTATIONAL | Key delta |
|---|---|---|---|---|---|---|---|---|
| UI01 | Dashboard | REUSE | Portfolio valuation, price/return context (D01) | Composites, verdicts, CSIP rankings | — | `confidence 0.8`, provenance literals | KPI chrome, layout | Replace literal provenance with derived; add quality/asOf badges |
| UI02 | Company Workspace | REUSE cmp · ADAPT identity | Quotes, valuation, corporate actions, fundamentals | Engine composite + pillars | — | — | Tabs, charts chrome | `/api/company/:id` re-keyed from sector to canonical security ID (**OI-08**) |
| UI03 | Portfolio | REUSE | Prices for MV/weights/returns (D01) | `PortfolioReport`, CSIP | — | — | Charts | Holdings priced from D01; per-holding quality |
| UI04 | Research | ADAPT | Market data in research context | Engine outputs | — | — | Editor chrome | Attach data vintage to research artifacts |
| UI05 | Screener | **NEW** | Universe + all screenable fields | Optional engine columns | — | — | Table chrome | **AD-9: governed contract certified BEFORE UI** |
| UI06 | Decision Center | EXTEND | Valuation inputs feeding decision cells | Decision cells (certified axes) | — | — | Grid / scatter chrome | Cell-level provenance + as-of |
| UI07 | Watchlists | **NEW** | Quotes, changes, alerts context | — | — | — | List chrome | New persistence + streaming/quality contract |
| UI08 | Reports | EXTEND | Data used in report body | Engine results | Report templates | — | Layout | **PIT reproducibility**: report must pin `dataVersion`/`asOf` |
| UI09 | Alerts | **NEW** | Trigger evaluation data | — | — | — | Toasts | Deterministic evaluation; no alerts on `unavailable` data |
| UI10 | Collaboration | **NEW** | Referenced data snapshots | — | — | — | Threads | Comments must pin the vintage they reference |
| UI11 | Administration | EXTEND | Provider/feed health, entitlement | — | Governance classification (AD-11) | Literal admin provenance | Panels | Real feed health replaces literals |
| UI12 | Settings | ADAPT | Data-plane event / preference payloads | — | — | — | Settings chrome | Data-source events and preferences added |
| UI13 | Global Search | **NEW** | Security/issuer resolution | — | — | — | Search chrome | Consumes K.2.4 resolution contract |
| UI14 | Command Palette | **NEW** | Same resolution contract | — | — | — | Palette | Shares UI13 contract; no second resolver |
| UI15 | CrossSectorIntelligence | REUSE | Cross-sector inputs shown as data-sourced | Certified CSIP engine outputs | — | — | Cross-sector chrome | Mark which inputs came from snapshots; ⚠ **OI-08** cardinality |
| UI16 | EvidenceExplorer | EXTEND | Snapshot lineage | Evidence chain | — | — | Tree | Show contributing snapshot IDs (Part 7) |
| UI17 | ReplayExplorer | EXTEND | Data vintage of replay | Replay engine outputs | — | ⚠ `reproduced`/`byteIdentical` literals (**AD-17/M-2**) | Diff view | Must show data vintage; must **not** assert verified reproduction |
| UI18 | EngineRegistry | REUSE | Engine/feed status and staleness | Registry of 13 certified engines | — | — | Registry chrome | ⚠ **AD-4**: displayed certification status must reflect revalidation state |
| UI19 | AiAdvisory | ADAPT | Data grounding the narrative | Engine inputs to narrative | — | **Narrative text** | Chat chrome | Must label output SYNTHESIZED and pin grounding vintage |

---

## L.3 Cross-surface UI rules

| # | Rule |
|---|---|
| U1 | **No fabricated provenance.** A surface must not display `dataSource`/`freshness`/`confidence` unless derived from real lineage. |
| U2 | **Degradation is visible.** `stale`, `partial`, `unavailable` must be visually distinct and never rendered as normal. |
| U3 | **No silent mixing.** LIVE and SNAPSHOT/PIT data must not be blended in one view without an explicit mode indicator (SPEC ¶17). |
| U4 | **Worst-case aggregation.** An aggregate inherits the worst quality of its contributors. |
| U5 | **Class labelling.** SYNTHESIZED content (AI advisory, generated narrative) must be labelled as such. |
| U6 | **Single resolver.** UI13/UI14/UI02 use one object-resolution contract. |
| U7 | **No client-side entitlement.** Visibility filtering is server-enforced. |
| U8 | **As-of everywhere.** Every data-bearing surface displays the effective as-of. |
| U9 | **No component rebuild without cause.** 13/19 surfaces need no new component — integrate transport/data-source instead (user constraint). |
| U10 | **No concealment.** "REUSE UI / INTEGRATE DATA" never hides NEW or ADAPT work; the NEW/ADAPT column in Part E governs. |

---

## L.4 Classification totals

| Class | Surfaces where present |
|---|---|
| REAL required | 18 of 19 (all but pure presentational chrome) |
| CERTIFIED ENGINE consumed | 9 (UI01,02,03,04,05,06,08,15,19) |
| CERTIFIED PRODUCT | 2 (UI08 templates, UI11 governance classification) |
| SYNTHESIZED present today | 5 (UI01, UI11, UI17, UI19, + admin panels) |
| ⚠ SYNTHESIZED that is currently **mislabelled as verified** | 2 (UI01 provenance/confidence; UI17 replay reproduction — **AD-17/M-2 unresolved**) |
