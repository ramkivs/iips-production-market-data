# WUI-RS-05C — Research/Sector Visual Parity Forensic Report

**What this is.** A read-only forensic analysis done in Arena. It uses source evidence only.
**Baseline analysed.** `f504c81c8eca5b49178e070902581c7c90bb9ed4`. Its application tree is identical to the functional baseline `42f1d9aa997bc8cd816f85b2965f8321d13398df`; the only later additions are the evidence and reconciliation docs.
**Target surfaces.** `/research/sector/:id` (`SectorIntelligence`) and `/research/company/:id` (`CompanyIntelligence`).
**Not done.** No rendering, screenshot, or Windows/browser observation was performed. Every conclusion comes from source files.
**Evidence limit.** Where the rendered result depends on browser (UA) defaults that the repository does not control, this is stated explicitly.

---

## 1. Executive summary

The repository contains **three distinct visual implementations**. They do not share a token source:

| System | Where defined | Used by |
|---|---|---|
| **A. Scoped shell surface system** (`.app-shell` tokens + `.app-surface*` classes) | `frontend/src/index.css` §PHASE-1A / §PHASE-1C | Six established shell-routed surfaces: Research UI03, Intelligence, Evidence, Executive (UI surface), Multi-Factor Screener, Security Master. Plus shared components (`MetricCard`, `MetricGroup`, `DataTable`, badges, state boxes). |
| **B. BI-07 utility-class system** (hand-authored Tailwind-parity classes, `.iips-*`) | `frontend/src/index.css` §1–§8 | BI-07 Portfolio Workspace, BrokerImportModal, shell governance header/footer (`App.tsx`) |
| **C. Donor inline-style pattern** (`style={{…}}` + `var(--…)`) | inline in components | **Company Intelligence, Sector Intelligence**, CompanyTrustChain, and ExecutiveDashboard (`/executive`, also a donor recovery) |

**The visual authority for the two target surfaces is System A.** They are shell-routed children of the Research family. Their nearest sibling, Research UI03 at `/research`, is a System A surface. They already consume System A's shared components.

System B is the certified BI-07 portfolio system. It is recorded but deliberately **not** proposed as a reference for Research/Sector, because the repository shows no shared implementation or token between B and A.

The recovered Research/Sector surfaces use System A's shared **components**, but **not** System A's **page structure or typography classes**. Six **material** gaps were identified:

1. **No `.app-surface` container.** Both surfaces, and their loading/error/unavailable states, render directly inside `.app-main`, which has no padding. Content therefore has **0 page padding** and **no max-width**. Every System A reference has `24px 32px` padding and a `1200px` max-width.
2. **Undefined semantic colour tokens.** `--color-status-*`, `--color-authority-*`, `--color-freshness-*` and `--elev-*` are referenced but never defined at runtime. `.app-shell` defines only ink, surface, border, focus, accent and radius. `applyTheme()` is deliberately never invoked (`main.tsx`). As a result, the Certified, Freshness, Decision and Status badges, `MetricCard` direction colours and `ConfidenceIndicator` lose their colour and border. **This is platform-wide:** the System A reference surfaces' `FreshnessBadge`/`CertifiedBadge` are equally affected. There is therefore **no resolved in-repo dark reference value** for these tokens inside the shell.
3. **Section heading hierarchy.** Target sections use inline `<h2 style={{fontSize:18}}>`, a mixed-case UA-bold heading. The reference uses `.app-surface__block` + `.app-surface__subtitle`: 13px/600, uppercase, 0.04em tracking, secondary ink.
4. **Sector selector.** The `<select>` sets a dark background (`--color-surface-0`) but no text colour. The only other IIPS select (Security Master) is left entirely at UA default. Legibility risk; the rendered result is UNKNOWN.
5. **Sector → Company link.** It has no link styling. No `a` rule exists in the stylesheet: the global `a` reset was deliberately excluded. It therefore takes the UA default link colour on a `#020617` canvas. The rendered result is UNKNOWN.
6. **Sector "Governed Evidence Summary".** Supporting scores and rules render as bare `<div>` text lines, with no IIPS component or class treatment.

Minor gaps: header block treatment, title size (24 vs 20px), provenance footer, replay list, composite prominence, nested AI-deferred box, and the active nav child for non-Banking sectors.

**Constraints on any later implementation (WUI-RS-05D).** E2E-018 structural parity tests pin testId key counts (43/40), metric-card counts and table-row counts. Visual parity must therefore be achieved through **existing classes and tokens**, not by adding testid-bearing components. All functional semantics must stay untouched: AD-17 NOT VERIFIED treatment, AI deferred, SNAPSHOT/`asOf` refusal.

---

## 2. Current Research/Sector visual state (source)

| Element | Sector (`features/research/SectorIntelligence.tsx`) | Company (`features/company/CompanyIntelligence.tsx`, `CompanyTrustChain.tsx`, `components/company/CompanyHeader.tsx`) |
|---|---|---|
| Root | `<section aria-label>`; no class | `<section aria-label>`; no class |
| Title | `<h1 style={{fontSize:24, margin:0}}>` + CertifiedBadge + FreshnessBadge (flex, gap 12, wrap) | Same, via `CompanyHeader`; adds sector name in `--color-ink-secondary` |
| Meta line | `<p>` 13px secondary: engine + calibration | `subLabel` `<p>` 13px secondary |
| Decision row | flex gap 16 (no wrap): `DecisionBadge`, `Composite: n` span, confidence span | Same in `CompanyHeader` |
| Selector | `<label 13px>` + `<select padding 4px 8px, border 1px var(--color-border), radius 4, bg var(--color-surface-0)>` | Same |
| Section headings | `<h2 style={{fontSize:18, marginTop:24}}>` ×5 | Same ×5 (incl. `CompanyTrustChain`) |
| Metrics | `MetricGroup` / `MetricCard` (shared) | Same |
| Tables | `DataTable` (shared) | Same |
| Evidence | `<p>` recommendation, `DataTable` key metrics, `<div>` lines for supporting scores and rules | `MetricGroup` + `EvidenceRecordCard` + `SnapshotMetadataPanel` + `ProvenanceChain` |
| Replay | `<ul>` (snapshot, difference, attribution) + `ReplayLiteralDisplay` (AD-17) | `ReplaySummary` + neutral bordered box "Reported byteIdentical … NOT VERIFIED" + `Ad17Note` |
| AI | `AdvisoryDeferred` (bordered section containing `UnavailableState` box) | Same |
| Provenance | `<p>` 12px secondary, marginTop 16 | Same |
| States | bare `LoadingState` / `ErrorState` / `UnavailableState` / `DataModeUnavailable` | Same |

Both surfaces are mounted in `App.tsx` as `<Route path={ROUTES.researchSector|researchCompany} element={<…/>}/>` inside `ShellLayout` → `AppShell` → `<main className="app-main">` with **no wrapper**.

---

## 3. Established IIPS visual reference authority

**Primary authority: System A.** It is recorded in `frontend/src/index.css` under "IIPS PHASE-1A — FULL-IIPS APPLICATION SHELL (scoped)" and "IIPS PHASE-1C — INTELLIGENCE SURFACE (scoped, append-only)".

- **Tokens.** Scoped to `.app-shell`, never `:root`:
  - `--color-ink #E2E8F0`, `--color-ink-secondary #94A3B8`, `--color-ink-muted #64748B`
  - `--color-surface-0 #020617`, `--color-surface-1 #0F172A`, `--color-surface-2 #1E293B`
  - `--color-border #1E293B`, `--color-focus #2DD4BF`, `--color-accent #0D9488`
  - `--radius-sm 4px`, `--radius-md 6px`, `--radius-lg 10px`
- **Surface classes:** `.app-surface`, `__header`, `__title`, `__subtitle`, `__meta`, `__block`, `__note`, `__provenance`.
- **Shell:** `.app-shell` grid (240px / 1fr; 56px topbar), `.app-nav`, `.app-main`, responsive collapse below 960px.
- **Placeholder:** `.app-placeholder*`, used by `UnavailableSurface` and `FeaturePlaceholder`.

**Secondary (recovered, not active): `core/tokens/index.ts` + `core/theme/theme.ts`.** This holds the full semantic token set: status, authority, freshness, elevation, and LIGHT/DARK palettes. `main.tsx` records that `applyTheme('light')` is **intentionally never invoked** (CSS-boundary mitigation). Its values are therefore **not** runtime authority. They are the only in-repo source for the missing semantic families (§6).

**Not proposed as Research/Sector reference: System B (BI-07).** It is certified BI-07 visual parity for the Portfolio workspace. index.css states the Phase-1A shell tokens were scoped specifically to avoid regressing it. The repository shows no shared implementation between B and A, so normalizing the two is out of scope (Visual Authority Rule).

**Not a reference: ExecutiveDashboard (`/executive`).** It is a donor recovery with the same inline pattern (C) as the targets. It shares their gaps and cannot serve as an authority.

---

## 4. Reference component inventory

| REFERENCE_SURFACE | REFERENCE_COMPONENT | REFERENCE_FILE | REFERENCE_STYLE_OR_TOKEN | REFERENCE_USAGE | TARGET_COMPONENT | TARGET_FILE |
|---|---|---|---|---|---|---|
| Research UI03 `/research` | `ResearchSurface` root | `features/research/ResearchSurface.tsx:152` | `.app-surface` (padding 24px 32px; max-width 1200px; color ink) | `<section className="app-surface">` | Sector / Company root `<section>` | `SectorIntelligence.tsx:73`, `CompanyIntelligence.tsx:70` |
| Research UI03, Evidence, Intelligence, Executive UI, Security Master, Screener | Surface header | `ResearchSurface.tsx:153`, `EvidenceSurface.tsx:152`, `IntelligenceSurface.tsx:114` | `.app-surface__header` (border-bottom 1px border; pb 12; mb 16) | `<header className="app-surface__header">` | Sector `<header>`; `CompanyHeader` | `SectorIntelligence.tsx:74`, `components/company/CompanyHeader.tsx` |
| Evidence `/evidence` (h1), Research UI03 (h2) | Surface title | `EvidenceSurface.tsx:153`, `ResearchSurface.tsx:154` | `.app-surface__title` (20px/700, mb 8, ink) | `<h1 className="app-surface__title">` | Sector `<h1>`, CompanyHeader `<h1>` | `SectorIntelligence.tsx:76`, `CompanyHeader.tsx` |
| Research UI03, Intelligence, Evidence, Executive UI | Meta row | `ResearchSurface.tsx:157`, `IntelligenceSurface.tsx:118` | `.app-surface__meta` (flex wrap, gap 12, 12px, secondary) containing `FreshnessBadge` | badge row under title | Title row badges + engine/calibration line | `SectorIntelligence.tsx:75-82`, `CompanyHeader.tsx` |
| Research UI03, Intelligence, Executive UI | Section block + subtitle | `ResearchSurface.tsx:180-181`, `IntelligenceSurface.tsx:147-148` | `.app-surface__block` (mt 24) + `.app-surface__subtitle` (13px/600, uppercase, 0.04em, secondary, mb 8) | `<section className="app-surface__block"><h3 className="app-surface__subtitle">` | inline `<h2 fontSize 18>` section headings | `SectorIntelligence.tsx:121,135,160,187`; `CompanyIntelligence.tsx:119,133`; `CompanyTrustChain.tsx:26,34,48` |
| Research UI03, Intelligence, Evidence, Executive UI | Note / disclosure | `ResearchSurface.tsx:197,205`; `IntelligenceSurface.tsx:133` | `.app-surface__note` (12px, lh 1.6, secondary, border-left 2px, pl 10) | AD-17 notes, reasons | Sector rules/supporting lines; replay attribution `<li>` | `SectorIntelligence.tsx:174-184,214` |
| Research UI03, Intelligence, Evidence, Executive UI | Provenance footer | `ResearchSurface.tsx:210`, `IntelligenceSurface.tsx:181`, `EvidenceSurface.tsx:182` | `.app-surface__provenance` (mt 28, pt 12, border-top, 11px mono, muted, flex wrap gap 8) | `<footer className="app-surface__provenance">` | provenance `<p>` | `SectorIntelligence.tsx:239`, `CompanyIntelligence.tsx:151` |
| All System A surfaces | `MetricGroup` / `MetricCard` | `components/data/DataComponents.tsx` | group h3 13px uppercase secondary; grid auto-fill minmax(150px,1fr) gap 12; card border 1px border, radius 6, pad 12, surface-1, value 20px/600 | metrics | same components (already reused) | both targets |
| Research UI03, Intelligence, Executive UI | `DataTable` | `components/data/DataComponents.tsx` | 13px, th pad 8/600/border-bottom, td pad 8 | tabular data | same component (already reused) | both targets |
| Research UI03, Intelligence, Evidence, Executive UI | `FreshnessBadge` | `components/ui/Badges.tsx` | inline badge 12px/600, pad 2px 8px, radius 4, 1px border `--color-freshness-*` (undefined, §6) | freshness | same component | both targets |
| Evidence, Executive UI, Research UI03, Screener | `UnavailableState` / `EmptyState` / `StaleDataState` inside `.app-surface` | `components/state/StateComponents.tsx` | StateBox: border 1px, radius 6, pad 16, surface-1 | honest states | same components, rendered **without** `.app-surface` | both targets (loader branches) |
| Structural routes | `UnavailableSurface` / `FeaturePlaceholder` | `app/UnavailableSurface.tsx`, `app/FeaturePlaceholder.tsx` | `.app-placeholder`, `.app-placeholder__badge` (11px/700 uppercase, surface-2, ink-secondary) | unavailable / deferred **surfaces** | `AdvisoryDeferred` (deferred **panel**) | `components/ai/AdvisoryDeferred.tsx` |
| Shell | `Sidebar` NavLink | `app/Sidebar.tsx` | active: ink / surface-2 / 600; inactive: ink-secondary; child 13px pad 4px 12px | navigation | route-state for `/research/sector/:id` | `app/navigation.ts:120-121` |
| Security Master | `<select>` | `features/security-master/SecurityMasterSurface.tsx:156` | UA default + `padding: 4px 8px` only | only other IIPS select | sector `<select>` | `SectorIntelligence.tsx:105`, `CompanyIntelligence.tsx:94` |

---

## 5. Typography analysis

| Aspect | Reference (System A) | Research/Sector | Status |
|---|---|---|---|
| Font family | Inherited `html, body`: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` | Inherited (same) | MATCH |
| Font source | System stack; no web-font import in repo | Same | MATCH |
| Numeric font | `.font-mono`/`.tabular-nums` exist but are unused by System A shared components; `MetricCard` value uses body font 20px/600 | `MetricCard` (same); header composite is body text 16px (UA default) | MATCH (cards) / MINOR_GAP (header composite prominence) |
| Page title | `.app-surface__title` 20px/700, mb 8 | inline 24px, UA-bold, margin 0 | MINOR_GAP |
| Section heading | `.app-surface__subtitle` 13px/600, uppercase, letter-spacing 0.04em, `--color-ink-secondary` | inline `<h2>` 18px, UA bold, mixed case, ink, UA margin-bottom | MATERIAL_GAP |
| Group heading | `MetricGroup` h3 13px uppercase 0.04em secondary | same component | MATCH |
| Body / meta | `.app-surface__meta` 12px secondary; `.app-surface__note` 12px lh 1.6 | 13px secondary (meta line); body lines unstyled (UA 16px) | MINOR_GAP |
| Caption / provenance | `.app-surface__provenance` 11px monospace muted | 12px body font, secondary | MINOR_GAP |
| Line height | set only on `.app-surface__note` (1.6) and `.app-placeholder__body` (1.6) | not set (UA `normal`) | MINOR_GAP |
| Letter spacing | uppercase subtitles 0.04em; body none | none | MATCH (body) / covered by heading row |

## 6. Color analysis

| Aspect | Reference value/token | Research/Sector | Status |
|---|---|---|---|
| Page background | `.app-shell` `--color-surface-0 #020617` (grid background) | inherited | MATCH |
| Panel/card background | `--color-surface-1 #0F172A` (`MetricCard`, StateBox) | same components; pillars-unavailable box uses the same token | MATCH |
| Primary foreground | `--color-ink #E2E8F0` (inherited from `.app-shell`) | inherited | MATCH |
| Secondary foreground | `--color-ink-secondary #94A3B8` | used via inline `var()` | MATCH |
| Muted foreground | `--color-ink-muted #64748B` (provenance) | not used (provenance uses secondary) | MINOR_GAP |
| Accent | `--color-accent #0D9488`, `--color-focus #2DD4BF` | not used | MATCH (no accent element expected) |
| Positive / warning / error / informational | `--color-status-*` **UNDEFINED at runtime in the shell**. Defined only in un-invoked `theme.ts` (DARK: positive `#4CBB7A`, negative/critical `#E86A60`, warning `#D89B3F`, informational `#6BA6F5`) | `DecisionBadge`, `StatusBadge` (overrides), `MetricCard direction`, `ConfidenceIndicator`, selector-error text all reference them | MATERIAL_GAP (platform-wide; reference surfaces also lack resolved values) |
| Certified / authority | `--color-authority-certified` UNDEFINED (DARK `#4CBB7A`) | `CertifiedBadge` | MATERIAL_GAP (platform-wide) |
| Snapshot / freshness | `--color-freshness-snapshot` UNDEFINED (DARK `#6BA6F5`) | `FreshnessBadge` | MATERIAL_GAP (platform-wide) |
| Unavailable / deferred | StateBox neutral (border + surface-1, no status colour); `.app-placeholder__badge` surface-2 / ink-secondary | `UnavailableState` (same) inside `AdvisoryDeferred` | MATCH (component) |
| Not verified (AD-17) | Deliberately **not colour-coded** (`CompanyTrustChain.tsx`, `ReplayLiteralDisplay`) | same | MATCH (must be preserved) |
| Link colour | No IIPS link colour rule (global `a` reset excluded); NavLink uses ink / ink-secondary | UA default link colour on `#020617` | MATERIAL_GAP (rendered colour UNKNOWN) |

**Consequence of undefined tokens (CSS semantics, not observed).** `color: var(--undefined)` falls back to the inherited colour, so it inherits ink. `border: 1px solid var(--undefined)` is invalid at computed-value time and resets to the initial value, so there is no border. Badges therefore render as ink-coloured text with a symbol on `--color-surface-1`. Directional and verdict colour are not conveyed by colour. The symbols (▲ ! ✓ □) and labels still carry the meaning, per the tokens' "non-color-only" rule.

## 7. Layout / alignment analysis

| Aspect | Reference | Research/Sector | Status |
|---|---|---|---|
| Shell grid | `.app-shell` 240px sidebar / 1fr content; 56px topbar | same shell | MATCH |
| Page padding | `.app-surface` 24px 32px | **0** (`.app-main` has no padding; no wrapper) | MATERIAL_GAP |
| Content max-width | `.app-surface` 1200px | **none** (full content column) | MATERIAL_GAP |
| Grid structure | `MetricGroup` auto-fill minmax(150px,1fr) | same | MATCH |
| Header alignment | `__header` block with bottom rule; `__meta` row | flex rows, no rule | MINOR_GAP |
| Text / numeric alignment | `DataTable` left-aligned; `MetricTable` right-aligned values (not used by references) | `DataTable` left-aligned | MATCH |
| Section alignment | `.app-surface__block` stacked | stacked `<h2>` + content | MATCH (structure) |

## 8. Spacing / density analysis

| Aspect | Reference | Research/Sector | Status |
|---|---|---|---|
| Section spacing | `.app-surface__block` margin-top 24 | `<h2>` margin-top 24 | MATCH |
| Heading-to-content | subtitle mb 8 | UA h2 margin-bottom (≈0.83em ≈ 15px at 18px) | MINOR_GAP |
| Header spacing | `__header` pb 12, mb 16 | header mb 20; selector mt 16 | MINOR_GAP |
| Card padding / inter-card | `MetricCard` pad 12; gap 12 | same | MATCH |
| Table spacing | `DataTable` cell pad 8 | same | MATCH |
| Label-to-value | `MetricCard` label 12px above value 20px | same; header "Composite: n" inline | MATCH / MINOR_GAP |
| Provenance spacing | mt 28, pt 12, border-top | mt 16, no rule | MINOR_GAP |
| Density / hierarchy | 3 levels: title 20 → subtitle 13 uppercase → body 12–13 | 3 levels: title 24 → h2 18 → body 13–16 (heavier mid-level; five 18px headings per page) | MATERIAL_GAP (via heading row) |
| Metadata density | meta row 12px, flex-wrap | Sector evidence summary: unstructured text lines | MATERIAL_GAP (Sector only) |

## 9. Component / surface analysis

| Component | Existing IIPS reference | Research/Sector | Status |
|---|---|---|---|
| Cards | `MetricCard`, StateBox | reused | MATCH |
| Panels | `.app-surface__note`; `EvidencePanel` (unused by references) | inline bordered divs (pillars-unavailable, replay-equivalence), same tokens as StateBox | MATCH (tokens) |
| Headers | `.app-surface__header` / `__title` / `__meta` | inline flex header; `CompanyHeader` | MINOR_GAP |
| Badges | `Badges.tsx` / `DecisionBadge` | reused | MATCH (component); colour → §6 |
| Tabs | none on either side | none | MATCH (N/A) |
| Selectors | Security Master select: UA default + padding | partial override: dark bg, no text colour | MATERIAL_GAP |
| Buttons | none on targets | none | MATCH (N/A) |
| Links | no in-surface link reference; Sidebar NavLink colours | UA default `<Link>` | MATERIAL_GAP |
| Tables | `DataTable` | reused | MATCH |
| Metric blocks | `MetricGroup`/`MetricCard` | reused | MATCH |
| Status indicators | `StatusBadge`, `ConfidenceIndicator` | Sector uses a text confidence span; Company uses text | MINOR_GAP (text only, consistent with the unresolved-token state) |

## 10. Border / radius / elevation analysis

| Aspect | Reference | Research/Sector | Status |
|---|---|---|---|
| Border width / colour | 1px `--color-border #1E293B` | same (inline `var`) | MATCH |
| Radius | `--radius-md 6px` (cards); `--radius-sm 4px` (badges) | literal 6 / 4 | MINOR_GAP (literals rather than tokens; values equal) |
| Dividers | `__header` border-bottom; `__provenance` border-top; `__note` border-left 2px | none | MINOR_GAP |
| Shadow / elevation | System A cards: none; `--elev-*` UNDEFINED (used only by `DecisionCard`/`EvidenceCard`/drawer, not on targets) | none | MATCH |

## 11. State-treatment analysis

| State | Reference treatment | Research/Sector | Status |
|---|---|---|---|
| Loading | StateBox inside `.app-surface` (e.g., references render states inside the surface container) | bare `LoadingState` in `.app-main` (0 padding) | MATERIAL_GAP (container only; component MATCH) |
| Error | StateBox `role="alert"` | bare `ErrorState` | MATERIAL_GAP (container) |
| Unavailable | `UnavailableState` inside `.app-surface` | bare `UnavailableState`; pillars-unavailable inline box (same tokens) | MATERIAL_GAP (container) / MATCH (box) |
| Deferred (AI) | No in-page deferred reference; `.app-placeholder__badge` is the surface-level pattern | `AdvisoryDeferred`: bordered section (no bg) containing a StateBox, so a nested double border | MINOR_GAP |
| Success / certified | `CertifiedBadge` | same | MATCH (component; colour → §6) |
| Snapshot | `FreshnessBadge snapshot` in `.app-surface__meta` | `FreshnessBadge` in title row | MINOR_GAP (placement) |
| Warning | `StatusBadge warning` | overrides list | MATCH (component; colour → §6) |
| Not verified | neutral, not colour-coded, `Ad17Note` | same (`ReplayLiteralDisplay`, trust-chain box) | MATCH (must not change) |
| Degraded data mode | `DataModeUnavailable` (D89, shared) | same | MATCH |

## 12. Navigation / shell analysis

| Aspect | Reference | Research/Sector | Status |
|---|---|---|---|
| Sidebar / topbar | `AppShell`, `Sidebar`, `TopBar` (shared) | same shell | MATCH |
| Active navigation | NavLink active: ink / surface-2 / 600 | parent "Research" active (prefix match). Child links are fixed to `/research/{company,sector}/Banking`, so after selecting any other sector the child row is **not** active | MINOR_GAP |
| Nav status | `partial` badge (11px, border, muted) | Company / Sector marked `partial` | MATCH |
| Breadcrumbs | none anywhere in IIPS | none | MATCH (N/A) |
| Page title (document) | static `index.html` `<title>` for all routes | same | MATCH |
| Tenant / role | TopBar `Tenant:` / `Role:` (display-only `ANONYMOUS_SESSION`) | same | MATCH |
| Governance header/footer | `App.tsx` (System B classes) on every route | same | MATCH |

## 13. Responsive-pattern analysis (source only)

| Aspect | Reference | Research/Sector | Status |
|---|---|---|---|
| Shell collapse | `.app-shell` ≤959px → single column; nav horizontal scroll | same | MATCH |
| Surface padding at narrow widths | `.app-surface` fixed 24px 32px (no breakpoint rule) | 0 at all widths | MATERIAL_GAP (via container) |
| Card stacking | `MetricGroup` auto-fill (reflows) | same | MATCH |
| Header wrapping | `.app-surface__meta` flex-wrap | title row wraps; **decision row has no `flexWrap`** | MINOR_GAP |
| Tables | `DataTable` wraps in `.table-scroll`, **but no `.table-scroll` rule exists in index.css** (shared) | same component | MATCH (shared latent overflow gap) |
| Long strings | `.app-surface__provenance` flex-wrap; `.iips-hash-full` break-all (System B) | attribution / provenance in `<p>`/`<li>`, normal wrapping | MATCH |

---

## 14. Detailed parity gap matrix

| # | Category | Reference Surface | Reference Component/File | Existing IIPS Value/Pattern | Research/Sector Value/Pattern | Status | Recommended Reuse |
|---|---|---|---|---|---|---|---|
| G1 | Layout: page container | Research UI03, Intelligence, Evidence, Executive UI, Screener, Security Master | `.app-surface` — `index.css` §PHASE-1C | padding 24px 32px; max-width 1200px | none (0 padding, unbounded width) — both surfaces + state branches | MATERIAL_GAP | Add `className="app-surface"` to the existing root `<section>` of each view and wrap the loader state branches the same way |
| G2 | Color: semantic status/authority/freshness | (platform-wide) | `core/tokens/index.ts`, `core/theme/theme.ts` (DARK), not invoked | only defined in un-invoked theme; `.app-shell` scope lacks them | badges, verdicts, directions, confidence, selector error: no colour/border | MATERIAL_GAP | **Requires authority decision.** Reuse the existing `theme.ts` DARK values for *only* the missing semantic families, scoped to `.app-shell` (never `:root`, never `applyTheme`). Surface/ink tokens stay as scoped. This affects all System A surfaces, not only Research/Sector. |
| G3 | Typography: section headings | Research UI03, Intelligence, Executive UI | `.app-surface__block` + `.app-surface__subtitle` | 13px/600 uppercase 0.04em secondary, mb 8; block mt 24 | inline `<h2>` 18px UA-bold | MATERIAL_GAP | Apply `app-surface__subtitle` to existing headings, grouping each section in `app-surface__block`. Keep heading level; no new testids. |
| G4 | Component: selector | Security Master | `SecurityMasterSurface.tsx:156` | UA default + `padding: 4px 8px` | dark bg, no text colour | MATERIAL_GAP (rendered legibility UNKNOWN) | Either match Security Master (drop the partial background override) or complete it with the existing `--color-ink`. Decision required; no new token. |
| G5 | Component: link | Shell | `Sidebar.tsx` NavLink | ink-secondary / ink; no underline | UA default link colour | MATERIAL_GAP (rendered colour UNKNOWN) | Reuse the existing ink/focus tokens (`--color-ink-secondary` / `--color-focus`). No new colour. |
| G6 | Density: Sector evidence summary | Research UI03 / Intelligence | `.app-surface__note`, `.app-surface__meta`, `DataTable` | structured notes/meta rows | bare `<div>` lines for supporting scores and rules | MATERIAL_GAP | Apply `app-surface__note`/`app-surface__meta` classes to the existing `sector-supporting-scores` / `sector-rules-applied` elements. **Do not** convert to `MetricCard` (changes pinned metric-card counts). |
| G7 | Header block | Research UI03, Evidence | `.app-surface__header` / `__meta` | bottom rule, pb 12, mb 16; meta 12px flex-wrap | inline flex, mb 20, no rule | MINOR_GAP | Apply `app-surface__header` to Sector `<header>` and `CompanyHeader` `<header>`; badges/meta line into `app-surface__meta` |
| G8 | Title | Evidence (`h1`) | `.app-surface__title` | 20px/700 | 24px | MINOR_GAP | Apply `app-surface__title` to the existing `<h1>` |
| G9 | Provenance footer | Research UI03, Intelligence, Evidence | `.app-surface__provenance` | 11px mono muted, border-top, mt 28 | `<p>` 12px secondary, mt 16 | MINOR_GAP | Apply `app-surface__provenance` to existing `sector-provenance` / `company-provenance` elements (element type change `p`→`footer` optional; keep testid) |
| G10 | Replay list (Sector) | Research UI03 | `.app-surface__note` | note treatment | unstyled `<ul>` | MINOR_GAP | Class-only treatment; `ReplayLiteralDisplay` and AD-17 wording unchanged |
| G11 | Composite prominence | Executive UI | `MetricCard` in `MetricGroup "Composite Score"` | 20px/600 card | inline text span | MINOR_GAP | Class/typography only on the existing `sector-composite`/`company-composite` span. **Not** `MetricCard` (pinned counts). |
| G12 | AI deferred panel | Structural surfaces | `.app-placeholder__badge`; StateBox | single bordered state | bordered section wrapping a bordered StateBox | MINOR_GAP | Keep `AdvisoryDeferred` semantics; optionally drop the outer border so a single StateBox border remains. Wording unchanged. |
| G13 | Active nav child | Shell | `Sidebar.tsx` / `navigation.ts` | active by path | child active only for `Banking` | MINOR_GAP | Out of visual scope unless authorised (`navigation.ts` change); record only |
| G14 | Radius literals | Shell tokens | `.app-shell --radius-md/--radius-sm` | tokens | literal 6/4 | MINOR_GAP | Optional: `var(--radius-md)` / `var(--radius-sm)`. Values are identical. |
| G15 | Table overflow | (shared) | `DataTable` `.table-scroll` | class referenced, no CSS rule | same | MATCH (shared latent gap) | Not Research/Sector-specific; record only |
| G16 | Font family / source | all | `index.css` `html, body` | system stack | inherited | MATCH | — |
| G17 | Cards / tables / metric groups | all System A | `DataComponents.tsx` | shared | reused | MATCH | — |
| G18 | Not-verified treatment | Company trust chain / AD-17 | `Ad17Disclosure.tsx` | neutral, not colour-coded | same | MATCH | **Must remain unchanged** |
| G19 | Windows rendered appearance | — | — | — | — | UNKNOWN — SOURCE EVIDENCE NOT FOUND | Later Windows visual gate |
| G20 | Designed visual reference (mock/capture) for Company/Sector | — | none tracked in repo (no image assets; E2E-018 evidence is structural counts only) | — | — | UNKNOWN — SOURCE EVIDENCE NOT FOUND | Use System A as authority (this report) |

## 15. Component reuse matrix

| Target Component | Target File | Existing IIPS Reference | Gap | Reuse Strategy | Implementation Needed |
|---|---|---|---|---|---|
| Page shell | `SectorIntelligence.tsx:73`, `CompanyIntelligence.tsx:70` (+ loader state returns) | `.app-surface` (`ResearchSurface.tsx:152`) | G1 | Add existing class to existing root; wrap state returns in the same container | YES (className only) |
| Page title | `SectorIntelligence.tsx:76`, `components/company/CompanyHeader.tsx` | `.app-surface__title` (`EvidenceSurface.tsx:153`) | G8 | Class replaces inline size | YES (className) |
| Status/certification banner | Sector header row; `CompanyHeader` | `.app-surface__meta` + `FreshnessBadge` (`ResearchSurface.tsx:157-159`) | G7 (+G2 colours) | Move existing badges/meta line into `app-surface__meta`; token resolution per G2 decision | YES (className); G2 needs authority |
| Metric/composite display | `sector-composite` span; `company-composite` span; `DecisionBadge` | `MetricCard` value typography (reference only) | G11 (+G2) | Typography via existing classes/tokens; no new metric-card | YES (minor) |
| Pillar cards | `MetricGroup`/`MetricCard` in both views | same shared components | none (direction colour → G2) | Already reused | NO (G2 only) |
| Sector selector | `SectorIntelligence.tsx:105`, `CompanyIntelligence.tsx:94` | Security Master select | G4 | Align with Security Master or complete with `--color-ink` | YES (decision) |
| Evidence summary | Sector `sector-recommendation`, `sector-supporting-scores`, `sector-rules-applied`; Company `EvidenceRecordCard` | `.app-surface__note` / `__meta`; `DataTable` | G6 (Sector); Company MATCH (card tokens) | Class treatment on existing elements; no component swap | YES (Sector) |
| Replay verification | Sector `sector-replay-summary`; Company `CompanyTrustChain` | `ReplayLiteralDisplay` / `ReplaySummary` / `Ad17Note` (AD-17 approved) | G10 (Sector list only) | Class on list only; AD-17 components untouched | YES (minor) / NO for AD-17 parts |
| AI deferred panel | `components/ai/AdvisoryDeferred.tsx` | StateBox / `.app-placeholder__badge` | G12 | Optional single-border treatment; text and semantics frozen | OPTIONAL |
| Footer/provenance area | `sector-provenance`, `company-provenance` | `.app-surface__provenance` | G9 | Existing class on existing element | YES (className) |
| Navigation context | `app/navigation.ts:120-121`, `app/Sidebar.tsx` | NavLink active pattern | G13 | Record only; changing it is a navigation change, not visual | NO (unless separately authorised) |
| Section headings | inline `<h2>` in both views + `CompanyTrustChain` | `.app-surface__block` + `__subtitle` | G3 | Existing classes on existing headings | YES (className) |
| Sector → Company link | `SectorIntelligence.tsx:229` | Sidebar NavLink token usage | G5 | Existing ink/focus tokens | YES (decision) |

## 16. Unknowns / evidence limitations

1. **No rendering was performed.** All statuses come from source. No screenshot, pixel, computed-style, contrast or Windows observation exists for this analysis.
2. **UA-dependent results (G4, G5, and UA h1/h2 margins/weights).** The repository does not set these. The expected behaviour follows standard browser defaults, but the actual Windows Chrome/Edge rendering is UNKNOWN. No `color-scheme` is declared.
3. **Font resolution on Windows.** The stack is deterministic, and on Windows it is expected to resolve to Segoe UI. Actual resolution is not verified.
4. **No designed reference exists.** No mock-up, image asset or pixel capture is tracked for Company/Sector (G20). E2E-018 evidence is **structural** (testId key counts, table rows, metric cards), not visual.
5. **G2 is platform-wide and has no resolved in-shell value.** The only dark values live in the recovered, deliberately un-invoked `theme.ts`. Adopting them is an authority decision, not a mechanical reuse.
6. **E2E-018 pinned counts.** `tests/research_sector_parity.test.ts` pins testId key scalars (Company 43 / Sector 40), metric-card counts and table-row counts. Any 05D change that adds or removes testid-bearing elements would break parity. Class and token changes do not.

## 17. Recommended visual implementation sequence for WUI-RS-05D

Each step is className-only unless stated. Existing classes and tokens only. No new colours, fonts, spacing or components. No testid additions or removals.

1. **Container (G1).** `.app-surface` on both view roots and loader state branches. Highest impact, lowest risk.
2. **Header (G7, G8).** `app-surface__header` / `__title` / `__meta` on the Sector header and `CompanyHeader`.
3. **Section hierarchy (G3, G6, G10).** `app-surface__block` / `__subtitle` / `__note` on existing headings and Sector summary elements.
4. **Provenance footer (G9).**
5. **Selector and link (G4, G5).** Operator decision between the two reuse options in §14.
6. **Semantic tokens (G2).** **Separate authority decision required.** It affects every System A surface, and it touches the Phase-1A CSS-boundary mitigation.
7. **Optional (G11, G12, G14).**
8. **Validation.** Existing Research/Sector UI, parity, primitives and read-authority suites unchanged and passing. Full regression, tsc and Vite build. Bundle node-edge check. Then a **separate Windows visual acceptance gate**.

**Frozen through all steps:**
- AI advisory stays deferred by authority (`AdvisoryDeferred` wording and semantics).
- Replay `reproduced`/`byteIdentical` stay NOT VERIFIED and neutral (never colour-coded).
- AD-17 / M-2 stay UNRESOLVED.
- SNAPSHOT only; `asOf`/PIT refused.
- No provider activation and no production claim.

---

## 18–20. Statements

VISUAL_PARITY_IMPLEMENTATION_NOT_PERFORMED=YES

WINDOWS_VISUAL_ACCEPTANCE_NOT_PERFORMED=YES

NO_APPLICATION_SOURCE_CHANGED=YES
