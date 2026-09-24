# WUI-RS-05D-B — Status-Colour Authority Analysis (READ-ONLY)

| Field | Value |
|---|---|
| Gate | WUI-RS-05D-B |
| Type | Forensic, read-only authority analysis. Report only. |
| START_SHA | `26befd40194be5eeccf780a795321fd33d417dfe` (WUI-RS-05D-A) |
| main | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (unchanged) |
| Files changed by this gate | this report only |

```
STATUS_COLOUR_IMPLEMENTATION_PERFORMED=NO
WINDOWS_VISUAL_VERIFICATION_PERFORMED=NO
APPLICATION_SOURCE_CHANGED=NO
COLOUR_AUTHORITY_DECISION=NOT_YET_AUTHORIZED
```

Evidence labels used throughout:

- **FACT**: directly observable in the repository at START_SHA (file and line cited), or a deterministic consequence of the CSS specification or arithmetic.
- **INFERENCE**: a reasoned reading of facts. It is not authority.
- **UNRESOLVED**: the repository does not answer the question.

Classification labels, used exactly: `AUTHORITATIVE_ACTIVE`, `AUTHORITATIVE_INACTIVE`, `EXISTING_BUT_NONAUTHORITATIVE`, `REFERENCED_BUT_UNDEFINED`, `UNKNOWN`.

No Windows or browser observation was made or is claimed. Arena has no Windows access. Every rendered-colour statement below comes from source plus the CSS specification, not from observation.

---

## 1. Executive summary

1. **FACT:** No status, authority, freshness or elevation custom property is defined anywhere in the running application. The only runtime token block is `.app-shell { … }` at `frontend/src/index.css:475-488`. It defines ink, surface, border, focus, accent and `radius-sm/md/lg` only. `index.css` has no `:root` token declarations (lines 463-473, 612 and 636 state this as a boundary rule).
2. **FACT:** Components reference 16 distinct undefined properties: 6 `--color-status-*`, 3 `--color-authority-*`, 5 `--color-freshness-*`, `--elev-1` and `--elev-3`. `--elev-2` and `--radius-xl` also exist only in the inactive theme, and no component consumes them. See §3.
3. **FACT:** Values for these properties exist in exactly two places, both inactive:
   - `frontend/src/core/tokens/index.ts`: the "FROZEN from Phase 2" light palette;
   - `frontend/src/core/theme/theme.ts`: the `LIGHT` map and a `DARK` override map.
   `applyTheme()` (theme.ts:106) is never invoked by application code. Phase 1B deliberately removed it: the commit 144e8ed message says *"core/theme/theme.ts is retained but NEVER INVOKED"*. VP-12 pins that absence (`tests/wui_rs_05d_a_visual_parity.test.ts:140-144`).
4. **FACT:** When the Phase-1A shell imported the semantic tokens it needed, it did **not** use the theme.ts `DARK` values. It used Tailwind-slate/teal values aligned to the certified BI-07 dark workspace. For example, `--color-surface-1` is `#0F172A` in the shell, where `DARK` has `#122437` and `LIGHT` has `#F7F9FB`. The shell radius scale (4/6/10 px) also differs from the token scale (2/4/6/8 px).
5. **FACT:** System B (Portfolio, BrokerImport, App chrome) uses active hand-authored utility colours: emerald, amber, rose and teal. These classes are not bound to status semantics. For example, `text-amber-400` also colours plain symbol text (PortfolioWorkspace:299, BrokerImportModal:411).
6. **Conclusion:**

   ```
   NO_ACTIVE_AUTHORITATIVE_STATUS_COLOUR_REFERENCE_FOUND
   ```

   No surface in the running IIPS application renders Certified, Snapshot, Watch, warning, critical/error, informational or pillar-direction semantics through a defined, authoritative colour value. The frozen token values are authoritative in name and meaning, but they are a light-theme palette that was deliberately not activated. The dark overrides have no recorded adoption decision. A governance or design decision is required before any implementation (§12).

---

## 2. Semantic inventory

This covers the status semantics that appear on the Research Company and Sector surfaces (the 05C badges) and on the shared components they use.

| # | Semantic (UI meaning) | Rendered by | Token referenced | Surface(s) rendering it at runtime today |
|---|---|---|---|---|
| S1 | CERTIFIED RESULT | `CertifiedBadge` (Badges.tsx:41-42) | `--color-authority-certified` | Company (via CompanyHeader:26), Sector (:77), Security Master (:143, always rendered), Executive Dashboard (data-dependent) |
| S2 | SNAPSHOT freshness | `FreshnessBadge state="snapshot"` (Badges.tsx:52-61) | `--color-freshness-snapshot` | Company (CompanyHeader:27), Sector (:78), Executive Dashboard (data-dependent) |
| S3 | LIVE / STALE / UNAVAILABLE / REPLAY freshness | `FreshnessBadge` | `--color-freshness-live/stale/unavailable/replay` | Only `live` is reachable from Company/Sector (`freshness === 'SNAPSHOT' ? 'snapshot' : 'live'`). `replay` is reachable on Research, Intelligence and Evidence only when fed a view model (§7). |
| S4 | Verdict: Strong Buy / Buy | `DecisionBadge` → `positive` (DecisionComponents.tsx:10-22) | `--color-status-positive` | Company (CompanyHeader:31), Sector (:84), Executive Dashboard |
| S5 | Verdict: Accumulate / Hold | `DecisionBadge` → `neutral` | `--color-status-neutral` | as S4 |
| S6 | Verdict: **Watch** | `DecisionBadge` → `warning` | `--color-status-warning` | as S4 |
| S7 | Verdict: Avoid | `DecisionBadge` → `negative` | `--color-status-negative` | as S4 |
| S8 | Override / warning list items | `StatusBadge status="warning"` (Badges.tsx:64-72) | `--color-status-warning` | Company (:113), Sector (:154), when overrides exist |
| S9 | Selector error ("error") | inline `<span data-testid="sector-selector-error">` | `--color-status-critical` | Company (:84), Sector (:95) |
| S10 | Pillar cues (≥60 positive, ≥40 neutral, else negative) | `MetricCard direction=` (DataComponents.tsx:14) | `--color-status-positive/neutral/negative` | Company (:123), Sector (:125) |
| S11 | Informational (tabs, chart bars) | InteractionComponents:40, ChartFoundations:37, StatusBadge `informational` | `--color-status-informational` | ChartFoundations via Executive Dashboard only. InteractionComponents has no routed consumer. |
| S12 | Trend / risk / confidence indicators | `TrendIndicator` (DataComponents:66), `RiskIndicator` (:61), `ConfidenceIndicator` (:41) | `--color-status-${x}` | TrendIndicator: Executive Dashboard only. Risk and Confidence: no routed consumer. |
| S13 | AI EXPLANATION / PLATFORM | `AiBadge`, `PlatformBadge` | `--color-authority-ai/platform` | none (no feature consumer) |
| S14 | Deferred / unavailable / "NOT VERIFIED" (AI advisory deferred, replay byteIdentical NOT VERIFIED, AD-17/M-2 unresolved, PIT/asOf refused) | StateComponents / plain text | defined neutral tokens only (`--color-ink*`, `--color-surface-*`, `--color-border`) | Company, Sector. These carry **no** status colour by design. |
| S15 | Elevation of cards and drawers | DecisionCard (`--elev-1`), EvidenceCard (`--elev-1`), EvidenceDrawer / Interaction (`--elev-3`) | `--elev-1`, `--elev-3` | EvidenceCard via Executive Dashboard only |
| S16 | Top-opportunity highlight | ExecutiveDashboard.tsx:118 border | `--color-status-positive` | Executive Dashboard (data-dependent) |
| S17 | Sidebar nav status chip | local badge in `app/Sidebar.tsx` | defined tokens only | all shell routes. **Not affected.** |

**FACT:** Research Company and Sector use S1, S2, S3 (`live` branch), S4–S10 and S14.

---

## 3. Definition inventory

### 3.1 Runtime definitions (the running application)

**FACT:** `frontend/src/index.css:475-488`, scoped to `.app-shell` and never `:root`:

| Token | Runtime value |
|---|---|
| `--color-ink` | `#E2E8F0` |
| `--color-ink-secondary` | `#94A3B8` |
| `--color-ink-muted` | `#64748B` |
| `--color-surface-0` | `#020617` |
| `--color-surface-1` | `#0F172A` |
| `--color-surface-2` | `#1E293B` |
| `--color-border` | `#1E293B` |
| `--color-focus` | `#2DD4BF` |
| `--color-accent` | `#0D9488` |
| `--radius-sm / md / lg` | `4px / 6px / 10px` |

The source comment (index.css:473) reads: *"Dark-aligned so the shell chrome is visually coherent with the certified BI-07 dark workspace."*

**No other custom property is defined at runtime.**

### 3.2 Inactive source definitions

**FACT:** `frontend/src/core/tokens/index.ts` has the header *"Semantic design tokens (FROZEN from Phase 2) … Components MUST consume semantic tokens, never invent raw visual values … Authority / freshness / status are meaning-bearing semantic tokens (non-color-only)."* Its primitives are commented *"light, institutional"*.

**FACT:** `frontend/src/core/theme/theme.ts` has the header *"Resolves the frozen semantic tokens into CSS variables for light (default) and dark. Both themes resolve the SAME semantic tokens (contrast AA guaranteed in both)."* `LIGHT` equals the token values. `DARK` is `{...LIGHT, overrides}`.

| Token | tokens/index.ts = theme `LIGHT` | theme `DARK` | Runtime |
|---|---|---|---|
| `--color-status-positive` | `#1E7A46` | `#4CBB7A` | **undefined** |
| `--color-status-negative` | `#B3261E` | `#E86A60` | **undefined** |
| `--color-status-neutral` | `#5A6672` | `#5A6672` (not overridden; inherits LIGHT) | **undefined** |
| `--color-status-warning` | `#965C00` | `#D89B3F` | **undefined** |
| `--color-status-critical` | `#B3261E` | `#E86A60` | **undefined** |
| `--color-status-informational` | `#1F6FEB` | `#6BA6F5` | **undefined** |
| `--color-authority-certified` | `#1E7A46` | `#4CBB7A` | **undefined** |
| `--color-authority-ai` | `#5A6672` | `#B4C1CD` | **undefined** |
| `--color-authority-platform` | `#1F6FEB` | `#6BA6F5` | **undefined** |
| `--color-freshness-live` | `#1E7A46` | `#4CBB7A` | **undefined** |
| `--color-freshness-snapshot` | `#1F6FEB` | `#6BA6F5` | **undefined** |
| `--color-freshness-stale` | `#965C00` | `#D89B3F` | **undefined** |
| `--color-freshness-unavailable` | `#B3261E` | `#E86A60` | **undefined** |
| `--color-freshness-replay` | `#5A6672` | `#B4C1CD` | **undefined** |
| `--elev-1` | `0 1px 2px rgba(11,27,43,0.08)` | same (inherited) | **undefined** |
| `--elev-2` | `0 2px 8px rgba(11,27,43,0.12)` | same | **undefined** (no consumer) |
| `--elev-3` | `0 8px 24px rgba(11,27,43,0.18)` | same | **undefined** |
| `--radius-xl` | `8px` | same | **undefined** (no consumer found) |
| `--radius-sm/md/lg` | `2/4/6px` | same | **defined differently**: `4/6/10px` |
| surface/ink/border/focus/accent | light values (e.g. `surface1 #F7F9FB`) | dark values (e.g. `surface-1 #122437`; `focus`/`accent` not overridden, `#1F6FEB`) | **defined differently** (slate/teal, §3.1) |

### 3.3 System B active colours (Portfolio lineage)

**FACT:** These are hand-authored utility classes in `index.css`; Tailwind is not installed (PHASE1_AUTHORIZATION_PREPARATION.md §E.4). `index.css:6` declares the palette as Slate Canvas `#020617`, panels `#0f172a`/`#020617`, and Institutional Teal `#0d9488`/`#0f766e`.

- Most frequent in use: `text-amber-400` ×12, `text-teal-400` ×10, `text-teal-300` ×8, `bg-emerald-400` ×6.
- Rough usage: emerald for saved/governance, amber for unsaved/rejections (and also plain symbol text), rose for reasons/errors.

**FACT:** No System B file references any `var(--color-status|authority|freshness-*)` property.

---

## 4. Active vs inactive

| Question | Answer | Label |
|---|---|---|
| Is any status/authority/freshness/elev property defined at runtime? | No (§3.1). | FACT |
| Is `applyTheme` invoked? | No. Its only references are its definition and VP-12. Phase 1B removed `applyTheme('light')` because it *"wrote historical tokens to :root — the exact global-theme vector the CSS mitigation exists to prevent"* (commit 144e8ed). | FACT |
| Is `core/tokens/index.ts` imported at runtime? | Only by `theme.ts`, which no runtime module calls. The token values never reach the DOM. | FACT |
| What does an undefined `var()` with no fallback do? | The declaration is *invalid at computed-value time*, so the property behaves as `unset`. For `color`, which inherits, the element takes its parent's colour: shell ink `#E2E8F0` or the nearest ancestor colour. For the `border: 1px solid var(--x)` shorthand, the longhands reset to initial, so `border-style: none` and no border is drawn. For `box-shadow: var(--elev-n)`, there is no shadow. | FACT (CSS Custom Properties spec). Not observed on Windows. |
| Result for Research Company/Sector badges | Rendered with symbol + label, in inherited ink colour, with no semantic border. Meaning is still conveyed by symbol and label, per the tokens file's "non-color-only" rule. | INFERENCE from the two facts above. Not visually verified. |
| Would a root-level `applyTheme(mode)` reach the shell? | It writes inline style properties on `document.documentElement`. Inside `.app-shell`, the 12 properties the shell defines would still resolve to the shell values, because the nearer declaration on `.app-shell` wins over inheritance from `:root`. The undefined families (status/authority/freshness/elev/radius-xl) would inherit into **every** subtree, including System B/Portfolio, but no System B file consumes them. | FACT (cascade/inheritance) + FACT (grep) |

---

## 5. Active reference records

The brief asks for an existing, running surface that renders each status semantic with a defined, authoritative colour.

| Candidate | Result |
|---|---|
| Research Company / Sector (System A) | References only undefined properties. **Not a reference.** |
| Security Master, Executive Dashboard, Research UI03, Intelligence, Evidence (System A) | Same shared components, same undefined properties. **Not a reference.** |
| Sidebar local status chip | Uses defined neutral tokens only; it does not express positive/warning/critical/certified/snapshot. **Not a status-colour reference.** |
| Portfolio / BrokerImport / App chrome (System B) | Active and certified (BI-07), but its utility colours are not bound to the Certified/Snapshot/verdict/pillar semantics and are reused for non-status text (§3.3). Deriving a status mapping from them would be an inference. **Not a status-semantic reference.** |
| Windows acceptance evidence | `windows-acceptance-evidence/WINDOWS-FULL-SHELL-VISUAL-ACCEPTANCE-20260923.md` and the 05B evidence contain no badge-colour observation. **Not a reference.** |

```
REFERENCE_SURFACE=NONE
ROUTE=NONE
COMPONENT=NONE
FILE=NONE
TOKEN/CLASS=NONE
STATUS_SEMANTIC=ALL (S1–S13, S15–S16)
ACTUAL_VALUE=NONE (undefined at runtime)
ACTIVE_RUNTIME_PATH=NONE

NO_ACTIVE_AUTHORITATIVE_STATUS_COLOUR_REFERENCE_FOUND
```

---

## 6. Inactive theme analysis

| Item | Finding | Label |
|---|---|---|
| Exact files | `frontend/src/core/tokens/index.ts` (values); `frontend/src/core/theme/theme.ts` (`ThemeVars`, `LIGHT`, `DARK`, `themeVariables`, `applyTheme` at line 106) | FACT |
| Provenance | Ported in Phase 1A (f13002e, "scaffold, not yet mounted"; theme.ts listed PORT-MODIFIED, blob `92061264c5`; tokens PORT, blob `ff80280332`, per FULL_IIPS_BI08_CONVERGENCE_FILE_MATRIX.md:252-253). Phase 1B (144e8ed) retained theme.ts but never invokes it. | FACT |
| Semantics | The token names and meanings are declared by the tokens file as "FROZEN" and constitution-critical ("CERTIFIED != AI != PLATFORM"; "non-color-only: always paired with icon + label"). | FACT |
| Consumed by anything active? | No. Components reference the property names, but no active code defines them. | FACT |
| Theme of the frozen values | Light. The primitives are commented "light, institutional", and the contrast notes in the file say "on white". | FACT |
| Contrast of frozen LIGHT values on the shell badge background `#0F172A` (computed, WCAG 2.x) | positive/certified/live `#1E7A46` = 3.34:1; negative/critical/unavailable `#B3261E` = 2.73:1; neutral/ai/replay `#5A6672` = 3.04:1; warning/stale `#965C00` = 3.25:1; informational/platform/snapshot `#1F6FEB` = 3.85:1. All are **below 4.5:1** for normal text. | FACT (arithmetic) |
| Contrast of DARK values on `#0F172A` | `#4CBB7A` 7.39:1; `#E86A60` 5.66:1; `#D89B3F` 7.38:1; `#6BA6F5` 7.14:1; `#B4C1CD` 9.73:1. **But `status-neutral` is not overridden in DARK** and stays `#5A6672`: 3.04:1 on `#0F172A`, and 2.68:1 even on DARK's own `surface-1` `#122437`. This contradicts theme.ts's own "contrast AA guaranteed in both" header for that token. | FACT (arithmetic) |
| Is DARK demonstrably the intended platform dark palette? | **No evidence.** Phase 1A imported semantic tokens into `.app-shell` and chose BI-07 slate/teal values instead of DARK for every token it imported: surfaces, ink, border, focus, accent and radius. No document, commit or test adopts DARK's status/authority/freshness values. | FACT (divergence); INFERENCE that DARK was not treated as authoritative |
| Did the governing plan intend the token layer to be provisioned? | Yes, in general. PHASE1_AUTHORIZATION_PREPARATION.md §E.4 mitigation: *"import only `core/tokens/index.ts` (CSS custom properties) and the `.app-*` layout rules … Scope shell rules under `.app-shell`."* The file matrix §12.2 says pure components are *"compatible after token provisioning = 11/15"*. | FACT |
| Why were status/authority/freshness omitted from the Phase-1A token block? | Not recorded in any commit message, document or test found. | **UNRESOLVED** |
| Effect of activating `applyTheme('light')` | Writes the light palette to `:root`. Inside `.app-shell`, surface/ink stay slate (shell override), so the status colours would be light-theme values on dark surfaces (sub-AA, row above). This directly reverses the Phase 1B decision and VP-12. | FACT (cascade) + FACT (contrast) |
| Effect of activating `applyTheme('dark')` | Same `:root` vector. Inside the shell, status/authority/freshness take the DARK values, neutral stays `#5A6672` (sub-AA), and `--elev-*` gets light-tuned shadows on a dark canvas. It reverses the Phase 1B decision and VP-12. | FACT |

---

## 7. Blast radius

Runtime-rendering status reflects current `App.tsx` routing (lines 335-413).

| Surface / route | Affected by defining the token families? | Detail |
|---|---|---|
| Research Company `/research/company/:id` (CompanyIntelligence + CompanyHeader) | **Yes** | S1, S2, S4–S10 |
| Research Sector `/research/sector/:id` (SectorIntelligence) | **Yes** | S1, S2, S4–S10 |
| Security Master `/security-master` | **Yes** | `CertifiedBadge` in the header is always rendered (SecurityMasterSurface.tsx:143) |
| Executive `/executive` (**ExecutiveDashboard**) | **Yes, when data renders** | CertifiedBadge, FreshnessBadge, DecisionBadge, TrendIndicator, MetricCard `direction="positive"`, top-opportunity border (:118), ChartFoundations (informational), EvidenceCard (`--elev-1`). Under the dev topology `/api/executive` is not proxied, so the route shows its error state. |
| `ExecutiveSurface` | **Not routed.** Imported in App.tsx:87 but not mounted on any route. Rendered only by `tests/shell_executive_surface.test.ts`. | Correction: the 05C report counted it among the System A reference surfaces. |
| Research UI03 `/research`, Intelligence `/intelligence`, Evidence `/evidence` | **Latent** | They contain FreshnessBadge / CertifiedBadge, but the routes mount with no props, so `vm === null` and the unavailable branch renders. No badges render at runtime today. |
| Multi-Factor Screener | No | no status-token consumer |
| Portfolio / BrokerImport / App chrome (System B) | No | no `var(--color-status…)` consumer. `.app-shell`-scoped definitions would be in scope but unused. |
| Sidebar | No | local chip uses defined tokens |

**Components:** Badges.tsx (Certified/Ai/Platform/Freshness/Status), DecisionComponents.tsx (DecisionBadge, Confidence, Risk, pillar direction, DecisionCard elev), DataComponents.tsx (MetricCard, TrendIndicator), EvidenceComponents.tsx, InteractionComponents.tsx, ChartFoundations.tsx, plus the inline spans in CompanyIntelligence.tsx:84 and SectorIntelligence.tsx:95 and ExecutiveDashboard.tsx:118. **Shared:** CompanyHeader/CompanyTrustChain are also rendered by the Executive Dashboard, so any change is platform-visible, not Research-only.

**CSS / tokens:** `frontend/src/index.css` (`.app-shell` token block) and/or `core/theme/theme.ts` + `main.tsx` (activation options).

**Tests:**
- `tests/wui_rs_05d_a_visual_parity.test.ts` VP-12 (lines 140-144) asserts the absence of `--color-status-`, `--color-authority-`, `--color-freshness-` and `--elev-` in `index.css`, and the absence of `applyTheme(` in `main.tsx`. Any implementation must amend or retire VP-12 under explicit authorization. It must not be weakened silently.
- No other test references these properties.
- Contrast tests (`wse_p14_accessibility_responsive`, `wse_durability_cp_w4`, `wsf_durability_cp_w5`, `wsf_p15_e2e_lineage`) exercise AccessibilityEngine with hard-coded hex values and do not read UI tokens.

**Parity constraints:**
- BI-07 certified parity (System B) is not touched by `.app-shell`-scoped status tokens.
- 05D-A parity tests pin structure, text and `var()` names, not resolved colours. Only VP-12 is colour-authority-related.

---

## 8. Classification

| Semantic | Current Definition | Definition File | Active? | Consumers | Existing Active Reference | Authority Status |
|---|---|---|---|---|---|---|
| Certified (`--color-authority-certified`) | none at runtime; LIGHT `#1E7A46`, DARK `#4CBB7A` | tokens/index.ts:40; theme.ts DARK | No | CertifiedBadge → Company, Sector, Security Master, Exec Dashboard, (Intelligence latent) | none | runtime: **REFERENCED_BUT_UNDEFINED** · LIGHT value: **AUTHORITATIVE_INACTIVE** · DARK value: **EXISTING_BUT_NONAUTHORITATIVE** |
| Snapshot (`--color-freshness-snapshot`) | none; LIGHT `#1F6FEB`, DARK `#6BA6F5` | tokens/index.ts:48; theme.ts DARK | No | FreshnessBadge → Company, Sector, Exec Dashboard, (Research/Intelligence/Evidence latent) | none | REFERENCED_BUT_UNDEFINED · LIGHT AUTHORITATIVE_INACTIVE · DARK EXISTING_BUT_NONAUTHORITATIVE |
| Live / Stale / Unavailable / Replay freshness | none; LIGHT `#1E7A46`/`#965C00`/`#B3261E`/`#5A6672`, DARK `#4CBB7A`/`#D89B3F`/`#E86A60`/`#B4C1CD` | tokens/index.ts:47-52; theme.ts DARK | No | FreshnessBadge | none | REFERENCED_BUT_UNDEFINED · LIGHT AUTHORITATIVE_INACTIVE · DARK EXISTING_BUT_NONAUTHORITATIVE |
| Watch verdict (`--color-status-warning`) | none; LIGHT `#965C00`, DARK `#D89B3F` | tokens/index.ts:33; theme.ts DARK | No | DecisionBadge, StatusBadge(warning), ConfidenceIndicator | none | REFERENCED_BUT_UNDEFINED · LIGHT AUTHORITATIVE_INACTIVE · DARK EXISTING_BUT_NONAUTHORITATIVE |
| Positive (Buy / pillar ≥60 / trend up) | none; LIGHT `#1E7A46`, DARK `#4CBB7A` | tokens/index.ts:29 | No | DecisionBadge, MetricCard, TrendIndicator, Exec :118 | none | REFERENCED_BUT_UNDEFINED · LIGHT AUTHORITATIVE_INACTIVE · DARK EXISTING_BUT_NONAUTHORITATIVE |
| Neutral (Hold/Accumulate / pillar 40–59) | none; LIGHT = DARK `#5A6672` | tokens/index.ts:31 | No | DecisionBadge, MetricCard, StatusBadge | none | REFERENCED_BUT_UNDEFINED · LIGHT AUTHORITATIVE_INACTIVE · DARK (inherited, sub-AA on dark) EXISTING_BUT_NONAUTHORITATIVE |
| Negative (Avoid / pillar <40) | none; LIGHT `#B3261E`, DARK `#E86A60` | tokens/index.ts:30 | No | DecisionBadge, MetricCard, TrendIndicator | none | REFERENCED_BUT_UNDEFINED · LIGHT AUTHORITATIVE_INACTIVE · DARK EXISTING_BUT_NONAUTHORITATIVE |
| Critical / error (selector error) | none; LIGHT `#B3261E`, DARK `#E86A60` | tokens/index.ts:34 | No | CompanyIntelligence:84, SectorIntelligence:95, StatusBadge | none | REFERENCED_BUT_UNDEFINED · LIGHT AUTHORITATIVE_INACTIVE · DARK EXISTING_BUT_NONAUTHORITATIVE |
| Informational | none; LIGHT `#1F6FEB`, DARK `#6BA6F5` | tokens/index.ts:35 | No | ChartFoundations (Exec), InteractionComponents (unrouted), StatusBadge | none | REFERENCED_BUT_UNDEFINED · LIGHT AUTHORITATIVE_INACTIVE · DARK EXISTING_BUT_NONAUTHORITATIVE |
| AI / Platform authority | none; LIGHT `#5A6672`/`#1F6FEB`, DARK `#B4C1CD`/`#6BA6F5` | tokens/index.ts:41-42 | No | AiBadge, PlatformBadge (no feature consumer) | none | REFERENCED_BUT_UNDEFINED · LIGHT AUTHORITATIVE_INACTIVE · DARK EXISTING_BUT_NONAUTHORITATIVE |
| Elevation `--elev-1/3` | none; light-tuned shadows | tokens/index.ts:69 | No | DecisionCard, EvidenceCard, EvidenceDrawer, Interaction | none | REFERENCED_BUT_UNDEFINED · source value AUTHORITATIVE_INACTIVE (light) |
| Deferred / unavailable / NOT VERIFIED states | defined neutral ink/surface/border tokens | index.css:475-488 | Yes | StateComponents, Company, Sector | the running shell | **AUTHORITATIVE_ACTIVE** (neutral treatment; no status colour by design) |
| Neutral ink/surface/border/focus/accent | slate/teal values | index.css:475-488 | Yes | all System A components | the running shell | **AUTHORITATIVE_ACTIVE** |
| System B emerald/amber/rose/teal utilities | utility classes | index.css (System B section) | Yes | Portfolio, BrokerImport, App chrome | BI-07 (Portfolio) | AUTHORITATIVE_ACTIVE for System B visuals · **EXISTING_BUT_NONAUTHORITATIVE** as a source for System A status semantics |
| Pillar cue colour mapping thresholds (60/40) | component logic | Company :123, Sector :125 | Yes (logic) / No (colour) | MetricCard | none | colour: REFERENCED_BUT_UNDEFINED |

Rationale for the split value classifications:

- **LIGHT → AUTHORITATIVE_INACTIVE.** FACT: the file declares itself the frozen semantic token authority. FACT: its activation vector was deliberately excluded.
- **DARK → EXISTING_BUT_NONAUTHORITATIVE.** FACT: it has no adoption record. FACT: Phase 1A chose different dark values for every token it provisioned. FACT: `status-neutral` fails its own AA claim.

No semantic is classified `UNKNOWN`. The only open question, *why the families were omitted in 1A*, is recorded under §11.

---

## 9. Options

These are repository-supported options only. **None is selected.**

**OPTION A: Scope the frozen LIGHT values into `.app-shell`**

- **FILES:** `frontend/src/index.css` (token block); `tests/wui_rs_05d_a_visual_parity.test.ts` (VP-12 amendment).
- **SEMANTICS:** All 14 colour tokens resolve to tokens/index.ts values.
- **BLAST_RADIUS:** Company, Sector, Security Master, Executive Dashboard (+ latent Research/Intelligence/Evidence).
- **BENEFITS:** Uses the only file declared authoritative ("FROZEN"). Follows the §E.4 mitigation wording ("import only core/tokens/index.ts"). No `:root` vector.
- **RISKS:** The values are light-theme, and all of them are below 4.5:1 on the dark shell surfaces (§6), which would be an accessibility regression.
- **PARITY_IMPACT:** System B none; System A badges gain colour and borders.
- **TEST_IMPACT:** VP-12 amended; new resolution tests.
- **WINDOWS_VERIFICATION_REQUIRED:** YES.

**OPTION B: Scope the theme.ts DARK values into `.app-shell` (no `applyTheme`)**

- **FILES:** `index.css`; VP-12.
- **SEMANTICS:** As defined in DARK, with `status-neutral` inheriting `#5A6672`.
- **BLAST_RADIUS:** as A.
- **BENEFITS:** The values exist in the repo and were written for a dark theme. They pass AA on `#0F172A` except neutral. No `:root` vector.
- **RISKS:** No adoption record. Phase 1A bypassed DARK for every other token, so mixing DARK status values with slate surfaces is an unratified combination. Neutral is sub-AA. Needs an explicit decision to adopt DARK as authority.
- **PARITY_IMPACT:** as A.
- **TEST_IMPACT:** as A.
- **WINDOWS_VERIFICATION_REQUIRED:** YES.

**OPTION C: Activate the theme (`applyTheme('light'|'dark')` in `main.tsx`)**

- **FILES:** `main.tsx`; VP-12; possibly the shell tests pinning "applyTheme 0".
- **SEMANTICS:** As LIGHT or DARK. Shell-defined tokens remain shell values inside `.app-shell`.
- **BLAST_RADIUS:** Every subtree, including `:root`/System B inheritance (unused today).
- **BENEFITS:** Uses existing infrastructure unchanged.
- **RISKS:** Directly reverses the recorded Phase 1B decision (commit 144e8ed) and the CSS boundary rule "no `:root` token declarations" (index.css:466, 612, 636). Carries the LIGHT contrast issue or the DARK neutral issue.
- **PARITY_IMPACT:** Potential global-theme vector against BI-07.
- **TEST_IMPACT:** VP-12 and Phase 1B assertions change.
- **WINDOWS_VERIFICATION_REQUIRED:** YES.

**OPTION D: Research/Sector-local scoped variables**

- **FILES:** `index.css` (a selector scoped to the research surface); VP-12.
- **SEMANTICS:** Values must still come from A or B. The repository offers no third source.
- **BLAST_RADIUS:** Company and Sector only.
- **BENEFITS:** Narrowest blast radius.
- **RISKS:** The same shared badges would stay uncoloured on Security Master and the Executive Dashboard, creating a platform-level inconsistency. Duplicates token authority. Does not resolve the value-authority question.
- **PARITY_IMPACT:** Research-only.
- **TEST_IMPACT:** VP-12 amended.
- **WINDOWS_VERIFICATION_REQUIRED:** YES.

**OPTION E: Status quo (no status colour)**

- **FILES:** none.
- **SEMANTICS:** Meaning is conveyed by symbol + label (the tokens file's "non-color-only" rule). Colour is inherited ink.
- **BLAST_RADIUS:** none.
- **BENEFITS:** No invented or unratified values. No regression risk. VP-12 stays valid.
- **RISKS:** Gap G2 remains. Borders on badges are not drawn (§4). Visual divergence from the donor intent.
- **PARITY_IMPACT:** none.
- **TEST_IMPACT:** none.
- **WINDOWS_VERIFICATION_REQUIRED:** NO (unchanged).

---

## 10. Risks

1. **Treating plausibility as authority.** The DARK values *look* suitable. Adopting them without a recorded decision would convert an inference into authority. This violates the 05D-B constraints.
2. **Accessibility regression.** The frozen LIGHT values are sub-AA on the dark shell (FACT, §6). DARK `status-neutral` is sub-AA (FACT).
3. **Governance reversal.** Theme activation undoes a recorded Phase 1B boundary decision.
4. **Shared-component coupling.** Badges are shared across Research, Security Master and the Executive Dashboard, so a "Research-only" colour change is not Research-only unless Option D is chosen.
5. **Test pinning.** VP-12 would fail by design under A–D. It must be amended under explicit authorization, not weakened.
6. **Unverified rendering.** All rendered-state statements in this report are spec-derived. No Windows or browser observation exists.

## 11. Unresolved

- **U-1:** Why Phase 1A imported the neutral token subset into `.app-shell` but omitted the status/authority/freshness/elevation families. There is no commit, document or test rationale.
- **U-2:** Whether the platform's intended dark status palette is theme.ts DARK, a BI-07-aligned derivation (emerald/amber/rose/teal), or something else. No artefact decides it.
- **U-3:** Whether `status-neutral` should be overridden for dark, since DARK leaves it at `#5A6672`.
- **U-4:** Whether elevation shadows (light-tuned rgba) are wanted on the dark canvas.
- **U-5:** Actual rendered appearance on Windows/Chrome/Edge of the current (undefined) state. Not observed.

## 12. Required authority decision

The repository contains **no active authoritative status-colour reference**. Implementation (a WUI-RS-05D-C) is therefore **not** unblocked by evidence alone. A governance/design decision must first state:

1. **Value source:**
   - (A) frozen LIGHT, accepting or waiving sub-AA on dark;
   - (B) theme.ts DARK, ratified as platform dark authority, with a ruling on `status-neutral`;
   - (C) theme activation, explicitly reversing Phase 1B;
   - (D) Research-local scope with a named value source;
   - (E) status quo.
2. **Scope:** platform-wide `.app-shell` versus Research-only.
3. **Elevation:** include `--elev-*` or exclude it.
4. **Test governance:** authorization to amend VP-12 (`tests/wui_rs_05d_a_visual_parity.test.ts:140-144`).
5. **Verification:** a Windows visual acceptance gate for every affected route listed in §7.

Until that decision is recorded: `COLOUR_AUTHORITY_DECISION=NOT_YET_AUTHORIZED`.

## 13. Windows verification

- Performed in this gate: **NO** (`WINDOWS_VISUAL_VERIFICATION_PERFORMED=NO`). Arena cannot access Windows.
- Required after any implementation under Options A–D, on Windows with `npm.cmd`:
  - Research Company and Sector (Certified, Snapshot, verdict incl. Watch, pillar cues, overrides, selector error);
  - Security Master header Certified badge;
  - Executive Dashboard (when data renders);
  - Portfolio (BI-07) regression check: expected unchanged.
- Recommended now, optional and read-only: a Windows capture of the current badges on `/research/sector/:id` and `/security-master`, to record the baseline undefined-token appearance (inherited ink, no badge border) as evidence for U-5.
