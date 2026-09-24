# WUI-RS-05D-A — Research/Sector Visual Parity Implementation (status-colour system EXCLUDED)

| Item | Value |
|---|---|
| Starting SHA | `979c69a773f2f408e841c4dd2d331d4b45fe6133` (WUI-RS-05C; governing remote tip at start) |
| Authority | WUI-RS-05C report `docs/WUI_RS_05C_VISUAL_PARITY_FORENSIC_REPORT.md` |
| Visual authority reused | System A: `.app-shell` scoped tokens + `.app-surface*` classes in `frontend/src/index.css` (§PHASE-1A / §PHASE-1C) |
| Environment | Arena implementation only; no Windows or browser observation. Windows visual acceptance is a later, independent gate. |

## 1. Files changed

**Visual implementation (className/inline-style only).** No data, logic, route or testid change.
- `frontend/src/features/research/SectorIntelligence.tsx`
- `frontend/src/features/company/CompanyIntelligence.tsx`
- `frontend/src/components/company/CompanyHeader.tsx` (only consumer: CompanyIntelligence)
- `frontend/src/components/ai/AdvisoryDeferred.tsx` (only consumers: Company, Sector)
- `frontend/src/features/company/CompanyTrustChain.tsx` (shared with ExecutiveDashboard; see G3)

**Test (added; no existing test modified, skipped or weakened):**
- `tests/wui_rs_05d_a_visual_parity.test.ts` (12 tests)

**Not changed:**
- `frontend/src/index.css` (no new CSS rule or convention)
- all tokens and theme files
- `main.tsx`, `App.tsx`, `routes.ts`, `navigation.ts`, API clients
- server/transport code, `vite.config.ts`, `package.json`

## 2. 05C gaps addressed (reference reused)

| 05C gap | Change | Reference reused |
|---|---|---|
| **G1 Page container** (MATERIAL) | Both view roots take `className="app-surface"`. Every loader branch renders inside `<div className="app-surface">`: loading, error, unavailable, and the three D89 degraded guards. The original fail-closed lines are kept verbatim inside a local closure, so PU-24 still matches them. | `.app-surface` (24px 32px padding, 1200px max-width), as in `ResearchSurface.tsx:152` |
| **G3 Section headings** (MATERIAL) | All section `<h2>`s: Sector ×4, Company ×2, and CompanyTrustChain ×3 when rendered in Company. They take `className="app-surface__block app-surface__subtitle"`; the inline `fontSize:18` is removed. Heading level is unchanged, since tests read `h1`/`h3` and h2 stays h2. | `.app-surface__subtitle` (13px/600, uppercase, 0.04em, secondary, mb 8) + `.app-surface__block` (mt 24). Both are existing rules; `__block` is declared later, so its `margin-top:24px` applies over the subtitle's shorthand. The result is the reference block + subtitle spacing. |
| **G3 (shared component)** | `CompanyTrustChain` gains an optional `headingClassName` prop. Company passes the subtitle classes. ExecutiveDashboard passes nothing and renders the identical original `style="font-size:18px;margin-top:24px"` (asserted by VP-10). | — |
| **G4 Sector dropdown** (MATERIAL) | The partial dark override (`border`, `borderRadius`, `background: --color-surface-0`, no text colour) is removed from both selects. Only `padding: 4px 8px` remains. | The only existing IIPS select: `SecurityMasterSurface.tsx:156` (UA default + `padding: 4px 8px`) |
| **G5 Sector → Company link** (MATERIAL) | `style={{ color: 'var(--color-ink-secondary)' }}` on the existing `<Link>`. The UA underline is kept as link affordance: no new value, and nothing removed. | Sidebar `NavLink` ink token (`Sidebar.tsx`, inactive `--color-ink-secondary`) |
| **G6 Sector evidence summary** (MATERIAL) | `sector-supporting-scores` → `className="app-surface__meta"`. `sector-rules-applied` → `className="app-surface__note"`. Same elements, same rows, same values. Not converted to `MetricCard`, because metric-card counts are pinned. | `.app-surface__meta`, `.app-surface__note` (`ResearchSurface.tsx`, `IntelligenceSurface.tsx`) |
| **G7 Header block** (minor) | Sector `<header>` and `CompanyHeader` `<header>` → `app-surface__header`. Engine/calibration line and Company sub-label → `app-surface__meta`; their existing inline margins are retained. | `.app-surface__header`, `.app-surface__meta` |
| **G8 Title** (minor) | `<h1>` → `app-surface__title`; the inline 24px is removed. The existing inline `margin: 0` is retained so the title stays vertically aligned with its badges in the flex row. | `.app-surface__title` (20px/700), as in `EvidenceSurface.tsx:153` |
| **G9 Provenance footer** (minor) | `sector-provenance` / `company-provenance` → `className="app-surface__provenance"`; inline style removed. The element stays `<p>` and the testids are unchanged. | `.app-surface__provenance` |
| **G12 AI-deferred double border** (minor) | `AdvisoryDeferred` outer section: inline border/padding removed, now `className="app-surface__block"`. A single StateBox border remains. The heading "AI Explanation" takes `app-surface__subtitle`. Wording, testids and the deferred state are unchanged. | `.app-surface__block`. Reference surfaces render `UnavailableState` directly in the surface, e.g. `ResearchSurface.tsx:128-133`. |
| **G14 Radius literals** (minor) | Target-owned `borderRadius: 6` → `var(--radius-md)`: the pillars-unavailable box in both views. Values are identical. | `.app-shell --radius-md` |
| **Decision-row wrapping** (minor) | `flexWrap: 'wrap'` added to the Sector decision row and the `CompanyHeader` decision row. | Existing title-row pattern in the same files; `.app-surface__meta` flex-wrap |

## 3. 05C gaps deliberately deferred

| Gap | Reason |
|---|---|
| **G2 Status / authority / freshness / verdict / pillar colours** | **EXCLUDED by this gate's authority.** Platform-wide; needs a separate authority decision (WUI-RS-05D-B). **STATUS_COLOUR_IMPLEMENTATION=NOT_PERFORMED.** |
| G10 Sector replay `<ul>` | `.app-surface__note` (border-left, padding-left 10px) on a bulleted list would push the markers against the rule. There is no existing IIPS list treatment to reuse safely. Left unchanged; `ReplayLiteralDisplay` and AD-17 wording are untouched. |
| G11 Composite prominence | The only reference is `MetricCard`, which would change the pinned metric-card count. No class exists for inline numeric prominence. Left unchanged. |
| G13 Sector navigation highlighting | Requires a change to `navigation.ts` (navigation behaviour, not visual). Not authorised here. |
| G14 (shared) radius literal in CompanyTrustChain replay-equivalence box | Shared with ExecutiveDashboard. Left unchanged to keep Executive rendering byte-identical. |
| G15 `.table-scroll` missing rule | Shared latent gap in `DataTable` across all System A surfaces. Not Research/Sector-specific; it would need a new CSS rule. |

## 4. Status-colour exclusion (explicit)

- No `--color-status-*`, `--color-authority-*`, `--color-freshness-*` or `--elev-*` definition was added anywhere.
- `index.css` is unchanged, and `applyTheme` is still not invoked.
- The shell CSS isolation is unchanged.
- Badges, verdict, pillar-direction and confidence colour cues are untouched. VP-12 asserts this.
- **Note for WUI-RS-05D-B.** VP-12 is gate-scoped. If a status-colour implementation is later authorised, that gate must explicitly retire or amend VP-12 as part of its authority.

## 5. Functional semantics preserved

- **Data:** SNAPSHOT only; `asOf`/PIT refusal; certified and evidence values; API contracts and clients — all unchanged.
- **AI:** AI advisory is still deferred. The `AdvisoryDeferred` text and testids are unchanged.
- **Replay:** `reproduced`/`byteIdentical` are still NOT VERIFIED. `ReplayLiteralDisplay`, `Ad17Note` and the neutral replay-equivalence box are unchanged. AD-17/M-2 remain UNRESOLVED.
- **Unchanged areas:** authentication, providers, Research/Sector transport, Executive transport, server topology, Vite proxy, and the dev startup mechanism.
- **Parity counts:** testid key sets and counts, metric-card counts and table rows are unchanged; the existing parity suite passes unmodified.

## 6. Validation (Arena, Linux, Node v22.22.3, clean `dist`/`dist-frontend`)

| Check | Result |
|---|---|
| Targeted: `research_sector_parity`, `research_sector_ui_recovery`, `research_sector_primitives`, `research_sector_read_authorities`, `wui_rs_05d_a_visual_parity` | **101/101 pass**, 0 fail, 0 skipped, 0 todo |
| Full regression (`npm test`) | **673/673 pass**, 113 suites, 0 fail, 0 cancelled, 0 skipped, 0 todo. That is 661 before + 12 new; no existing test changed. |
| TypeScript (`npm run build:tsc`, `tsc --noEmit`) | **PASS** |
| Vite build | **PASS** (only the chunk-size warning that was already there) |
| Browser Node edge | built bundle: 0 `node:*` / `createRequire` / browser-external refs; 0 `computeCertifiedExecutive`/`computeCertifiedPlatform`; 0 `node:` imports and 0 `executive_transport` imports in `frontend/src` |

## 7. Durability

- **Commit:** `feat: align research sector visual parity`. It contains the six files in §1 plus this report.
- **Push:** this Arena session can push only to `arena/01a0d33d-iips-production-market-data`.
- **Governing branch:** the commit's parent is the governing tip `979c69a`, so `arena/01a0d1d3-iips-production-market-data` can take it by a plain fast-forward (operator step).
- **SHAs:** the final commit SHA, remote SHA and clean-worktree result are reported with the commit. This document cannot contain its own commit SHA.
