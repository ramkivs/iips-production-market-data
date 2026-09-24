# WUI-RS-05D-C — Existing Platform Colour Authority Reconciliation (FORENSIC-ONLY)

```
STATUS_COLOUR_IMPLEMENTATION_PERFORMED=NO
WINDOWS_VISUAL_VERIFICATION_PERFORMED=NO
APPLICATION_SOURCE_CHANGED=NO
SCREENSHOT_HEX_SAMPLING_PERFORMED=NO
GOVERNANCE_DISPOSITION=B — EXISTING VISUAL REFERENCE FOUND, TOKEN AUTHORITY NOT YET ESTABLISHED
```

Evidence labels:

- **FACT**: a file or blob at a cited commit, a recorded manifest field, or arithmetic.
- **INFERENCE**: reasoning from facts. It is never authority.
- **UNRESOLVED**: the repository does not answer the question.

Candidate-source classifications, used exactly: `AUTHORITATIVE_ACTIVE`, `AUTHORITATIVE_FROZEN`, `HISTORICAL_NONAUTHORITATIVE`, `INACTIVE`, `COMPONENT_LOCAL`, `UNKNOWN`.

---

## 1. Baseline

| Item | Value |
|---|---|
| Governing branch | `arena/01a0d1d3-iips-production-market-data` |
| Start HEAD | `5711b9f8ec93e704e83e10410eca29c54dccd862` (05D-B report) |
| Start parent | `26befd40194be5eeccf780a795321fd33d417dfe` |
| main | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (unchanged) |
| Worktree at start | clean |
| Refs inspected | all 24 `origin/*` branches (fetched read-only), including `origin/windows/d114-stage5-banking-replay-observation` and `origin/m1-ad4-repair` |
| Files changed by this gate | this report only |

## 2. Screenshot evidence description

**Operator-supplied screenshot** ("Screenshot 2026-09-20 232052.png"):

- It was viewed in the conversation. It was **not** present in the sandbox: `/home/user/uploads/` does not exist. It is therefore not committed here.
- Pixels were **not** sampled, and no hex value is derived from it.

The screenshot visibly shows the following.

**Shell:**

- **Theme:** a **light** shell. White/very light surfaces, dark ink.
- **Top bar:** "IIPS Platform"; `Global Search ⌘K`; Notifications; Notes; "Tenant: tenant-A Role: admin"; Sign out.
- **Sidebar:** Executive selected (blue fill); `PARTIAL` chips in an amber outline; `FUTURE` chips in a grey outline.

**Executive page header:**

- "Good morning, Alex"; `+ Add Widget`; `Customize`.
- `✓ CERTIFIED RESULT` in a green outline. `□ SNAPSHOT` in a blue outline.

**KPI strip:**

| Card | Label colour | Value treatment |
|---|---|---|
| Total Portfolio Value | "Decision D-A" in amber | "Unavailable" in muted ink |
| Active Positions | "Tracked" in blue | `13` with "+2" in green |
| IIPS Average Score | "Conviction" in blue | `74.2` with "▲ Certified" in green |
| Risk Exposure | "CSIP" in amber | "High" |
| Alerts Requiring Action | "Unread" in red | `0` |

**Lower sections:**

- **Portfolio Health:** six metrics. Diversification `128.3` is in green.
- **Priority Opportunities:** a Top-opportunity box with a green border.
- **IIPS Score Distribution:** a donut with a legend: Watch 1, Buy 9, Strong Buy 2, Accumulate 1. The markers are blue or green.
- **Also shown:** Watchlist Highlights and Quick Actions.
- **Status meaning:** always paired with text, symbol or label (✓, □, ▲, labels).

**Repository-held visual evidence found during this gate.** These are E2E-018 certified captures, committed at `2f1049d` on `origin/m1-ad4-repair` and viewed read-only.

- **FACT:** `CAPTURE_MANIFEST.json` records:
  - `productCommit 7964fcce…`, `productBranch phase13-next`;
  - Windows 11, Microsoft Edge 151, viewport 1440×900;
  - `"theme": "light"`;
  - `authMode real-keycloak-oidc-pkce`.
- **FACT:** The current lineage has already verified these captures. `IIPS_DONOR_CROSS_VERIFICATION_AND_ACCESS_RESOLUTION_REPORT.md` (in HEAD) §A6 and Appendix C record: all 19 sha256 values MATCH.
- **`executive.png` (`/executive`):**
  - `✓ CERTIFIED RESULT` green outline; `□ SNAPSHOT` blue outline;
  - Diversification `128.3` green; Top-opportunity box green border;
  - `Partial` / `Future` nav chips.
- **`sector-intelligence_banking.png` (`/research/sector/Banking`, the same surface as current Research/Sector):**
  - `✓ CERTIFIED RESULT` green; `□ SNAPSHOT` blue; `! Watch` verdict badge amber;
  - pillar cues: `15` red, `45.5` neutral grey, `75` and `70` green, `50` neutral grey.
- **FACT:** The manifest `observables` record structure only (h1, h3s, testIdCounts, rows). They contain **no computed colour values**.

## 3. Current runtime findings (Task A, HEAD `5711b9f`)

This confirms 05D-B; nothing has changed since.

| Semantic | Component (shared/local) | Property referenced | Defined at HEAD runtime? | Source value present | Reachable in browser |
|---|---|---|---|---|---|
| CERTIFIED RESULT | `CertifiedBadge`, Badges.tsx:41 (shared) | `--color-authority-certified` | **No** | only in inactive tokens/theme | badge renders; colour unresolved |
| SNAPSHOT / LIVE / STALE / UNAVAILABLE / REPLAY | `FreshnessBadge`, Badges.tsx:52-61 (shared) | `--color-freshness-*` | **No** | inactive only | as above |
| Strong Buy / Buy | `DecisionBadge`, DecisionComponents.tsx:10-22 (shared) | `--color-status-positive` | **No** | inactive only | as above |
| Accumulate / Hold | same | `--color-status-neutral` | **No** | inactive only | as above |
| Watch | same | `--color-status-warning` | **No** | inactive only | as above |
| Avoid | same | `--color-status-negative` | **No** | inactive only | as above |
| Risk states | `RiskIndicator` (shared, not routed) | `--color-status-${x}` | **No** | inactive only | not rendered by any route |
| Attention / error | selector-error span, CompanyIntelligence.tsx:84 / SectorIntelligence.tsx:95 (local); `StatusBadge critical` | `--color-status-critical` | **No** | inactive only | span renders; colour unresolved |
| AI / Platform authority | `AiBadge` / `PlatformBadge` (shared) | `--color-authority-ai/platform` | **No** | inactive only | no feature consumer |
| Positive/negative metric | `MetricCard direction`, DataComponents.tsx:14 (shared); `TrendIndicator` :66 | `--color-status-${direction}` | **No** | inactive only | colour unresolved |
| Sidebar status chip | local, `app/Sidebar.tsx` | defined neutral tokens | Yes | `.app-shell` | Yes, but not a status colour |

The only runtime token block is `.app-shell` in `frontend/src/index.css:475-488`, which is dark and slate/teal. `applyTheme` is not invoked (VP-12).

**FACT:** Any Windows run of HEAD therefore **cannot** reproduce the screenshot's semantic colours.

## 4. Historical lineage (Task B)

### 4.1 Commit and branch lineage

| Commit | Date | Ref(s) | Ancestor of HEAD? | Relevance |
|---|---|---|---|---|
| `7325aed` | 2026-08-12 | `m1-ad4-repair` | No | "Phase 12 certified baseline". Contains **`docs/v3.0/design-tokens-reference.md`** (Phase 2 spec, dated 2026-08-09), `design-system.md`, `experience-constitution.md`, `design-principles.md`. First codified tokens: warning `#B26A00`. |
| `29a92a7` | 2026-08-16 | `m1-ad4-repair` | No | "Phase 13-Hardening Wave A (A1/A5)". Warning/stale `#B26A00→#965C00`, ink-muted `→#5C6875`, `--color-accent` added. Adds `theme.test.ts`: WCAG AA on white and surface-1 for LIGHT, and DARK ink-muted and warning on the DARK surface. |
| `7964fcc` | 2026-09-03 | `m1-ad4-repair` (unrelated history: no merge-base with HEAD or D114) | No | E2E-018 **certified product commit**. `main.tsx` calls `applyTheme('light')`. |
| `2f1049d` | 2026-09-03 | `m1-ad4-repair` | No | E2E-018 captures (19 PNG + manifest, `theme: light`) |
| `4b37e5b` | 2026-09-14 | `arena/01a0814b` et al. | No | **UI-PROVENANCE-01**: "Authoritative current IIPS UI source: `frontend/`". Same token/theme blobs. `applyTheme('light')` active. |
| `3b23f27` | 2026-09-14 | `arena/01a0814b` et al. | No | **WIN-UI-TARGET-PARITY-ADJUDICATION-01**: "Target Product screenshot classified as non-governing … Future Target Product adoption requires separate authority act". |
| `53819b9…c899211`, tip `d771e6a` | 2026-09-20 (tip 23:13 IST) | `windows/d114-stage5-banking-replay-observation` only; not in main | No (merge-base `eae2ff6`, 2026-09-08; 192 commits outside HEAD) | "TARGET UI: … executive dashboard / watchlist highlights / alerts / quick actions convergence", "P14-R7 INT-017 target visual convergence". **Every Executive string in the operator screenshot exists here** ("Good morning", "Add Widget", "Alerts Requiring", "Watchlist Highlights", "IIPS Score Distribution", "Quick Actions", "Risk Exposure"). `main.tsx` calls `applyTheme('light')`. |
| `f13002e` / `144e8ed` | 2026-09-22 | HEAD, main | **Yes** | Phase 1A ported tokens/theme but scoped only a dark-aligned neutral subset into `.app-shell`. Phase 1B removed `applyTheme('light')` as a global-theme vector. |
| `ea70a8c` | 2026-09-24 | HEAD | Yes | Stage-4 Executive recovery. Current `ExecutiveDashboard.tsx` is a reduced recovery (no KPI strip, "Good morning", donut, watchlist, quick actions). |

**Content-level identity (FACT, `git rev-parse <commit>:<path>`):**

| File | 7964fcc | 4b37e5b | D114 tip | HEAD |
|---|---|---|---|---|
| `core/tokens/index.ts` | `ff80280332` | `ff80280332` | `ff80280332` | `ff80280332` |
| `core/theme/theme.ts` | `92061264c5` | `92061264c5` | `92061264c5` | `ccfad0a4d1` (only the import path `'../tokens'`→`'../tokens/index.js'` differs) |
| `components/ui/Badges.tsx` | `80eebe2fff` | `80eebe2fff` | `80eebe2fff` | `80eebe2fff` |
| `components/decision/DecisionComponents.tsx` | `9b9679c2c5` | — | `9b9679c2c5` | `9b9679c2c5` |
| `components/data/DataComponents.tsx` | `5124c91713` | — | `5124c91713` | `5124c91713` |
| `main.tsx` calls `applyTheme('light')` | yes | yes | yes | **no** |

**FACT:** The colour system in both the E2E-018 captures and the operator screenshot is produced by **byte-identical** token and shared-component files to those in HEAD. The single runtime difference is theme activation plus the light shell.

**Named documents searched across all refs** (`git log --all -S`): "Dashboard Grammar", "Information Visualization Principles", "Workspace DNA", "Confidence Visualization Standards", "visual token".

- **FACT:** None of them has any occurrence in any ref. They are not found.
- The only design-authority documents are the four `docs/v3.0/*` specs at `7325aed`.

### 4.2 Phase 2 specification content

The following is FACT, from `docs/v3.0/design-tokens-reference.md` and `design-system.md` at `7325aed`.

- **Status of the spec:** "Phase 2 — implementation-ready spec … the concrete token values to be codified at Phase 3".
- **Semantic status (light):** positive `#1E7A46`, negative `#B3261E`, neutral `#5A6672`, warning `#B26A00` (later corrected to `#965C00` by 29a92a7), critical `#B3261E`, informational `#1F6FEB`.
- **Authority tokens:** certified = "CERTIFIED RESULT — solid, primary, labeled"; ai = "dashed/outline … non-authoritative"; platform = "informational, muted".
- **Freshness tokens:** stale → warning; unavailable → critical; replay → informational.
- **Theme strategy (§17):** "Default: light (institutional); dark optional. Contrast guaranteed in both."
- **Non-colour-only rule:** status is never encoded by colour alone.

**Discrepancies between the spec and the code (FACT):**

- The spec says `freshness-replay` is "informational". The token file sets replay = `#5A6672`, which is the neutral value, not informational `#1F6FEB`.
- The spec gives no concrete dark values. The DARK map exists only in theme.ts, and no capture renders it (the manifest records `theme: light`).

### 4.3 Candidate-source classification

| Candidate | Classification | Basis |
|---|---|---|
| `.app-shell` token block (index.css:475-488), neutral subset only | `AUTHORITATIVE_ACTIVE` (neutral ink/surface/border/focus/accent) | running shell. Defines no status values. |
| Phase 2 spec `docs/v3.0/design-tokens-reference.md` + `design-system.md` (7325aed) | `AUTHORITATIVE_FROZEN` for **light-theme semantic meaning and values** | spec of record. Codified in Phase 3, AA-corrected in Phase 13. **Not present in HEAD/main**; exists only on `m1-ad4-repair`. |
| `core/tokens/index.ts` LIGHT values (blob `ff80280332`) | `AUTHORITATIVE_FROZEN` (light) at the source level; `INACTIVE` at HEAD runtime | self-declared "FROZEN from Phase 2". Identical in every lineage. Rendered in certified E2E-018 captures. |
| theme.ts `DARK` overrides | `INACTIVE`; standing **`UNKNOWN`** | no spec values, no capture, no adoption act. `status-neutral` not overridden (sub-AA, §7). |
| E2E-018 captures (2f1049d / product 7964fcc) | `HISTORICAL_NONAUTHORITATIVE` as token authority; valid **historical visual reference** of the light rendering | machine-manifested and sha-verified. The certified product lineage is unrelated to HEAD history. The E2E-018 matrix itself declares "an honest absence register, not evidence of parity". |
| Operator screenshot / D114 TARGET-UI Executive (`ExecutiveDashboard.tsx` `f6cbe39f59`) | `HISTORICAL_NONAUTHORITATIVE` | branch not in main or HEAD. `IIPS_DONOR_CROSS_VERIFICATION…` (HEAD) records the "TGT/TARGET-UI authority act files" as NOT FOUND. Precedent `3b23f27` classifies a Target Product screenshot as non-governing. |
| D114 donut `verdictColors` with hex fallbacks `#22c55e` / `#f59e0b` / `#ef4444` (Buy/Hold/Sell); unmapped verdicts → `var(--color-accent)` | `COMPONENT_LOCAL` | local map. Contradicts the shared DecisionBadge mapping (§5). |
| D114 `global.css` `.nav-status-partial` → `--color-status-warning` | `COMPONENT_LOCAL` (consumes the frozen token) | not present in HEAD |
| System B emerald/amber/rose/teal utilities | `AUTHORITATIVE_ACTIVE` for BI-07 Portfolio only; not a status-semantic source | 05D-B §3.3 |
| "Dashboard Grammar", "Workspace DNA", etc. | `UNKNOWN` (no artefact) | no occurrence in any ref |

## 5. Screenshot-to-source reconciliation (Task C)

Confidence scale:

- **HIGH** means the source chain is blob-identical AND the value is the active `applyTheme('light')` resolution in that lineage.
- **MEDIUM** means the source is established but the pixel correspondence is only visual.
- **NOT ESTABLISHED** means there is no source value.

| Visual treatment | Screenshot evidence | Candidate source | Runtime active? (HEAD / D114 / 7964fcc) | Authority classification | Exact value/source | Confidence |
|---|---|---|---|---|---|---|
| CERTIFIED RESULT | green ✓ outline badge | `CertifiedBadge` → `--color-authority-certified` | No / Yes / Yes | AUTHORITATIVE_FROZEN (light); INACTIVE at HEAD | `#1E7A46`, tokens/index.ts:40 | HIGH |
| SNAPSHOT | blue □ outline badge | `FreshnessBadge` → `--color-freshness-snapshot` | No / Yes / Yes | AUTHORITATIVE_FROZEN (light); INACTIVE at HEAD | `#1F6FEB`, tokens/index.ts:48 | HIGH |
| LIVE / STALE / UNAVAILABLE / REPLAY | not shown | `FreshnessBadge` | No / Yes / Yes | AUTHORITATIVE_FROZEN (light) | `#1E7A46` / `#965C00` / `#B3261E` / `#5A6672` | source-only (not visible) |
| "Tracked", "Conviction" labels | blue text | D114 ExecutiveDashboard.tsx:560, :575 → `--color-accent` (**not** a status token) | No / Yes / n.a. | COMPONENT_LOCAL usage of a frozen primitive | `#1F6FEB` (accent), tokens/index.ts:24 | HIGH (source) |
| "+2", "▲ Certified" | green | D114 :564, :579 → `--color-status-positive` | No / Yes / n.a. | AUTHORITATIVE_FROZEN token, COMPONENT_LOCAL usage | `#1E7A46` | HIGH (source) |
| Risk Exposure "CSIP", "Decision D-A" labels | amber | D114 :590, :546 → `--color-status-warning` | No / Yes / n.a. | frozen token, local usage | `#965C00` | HIGH (source) |
| "Unread" / Critical | red | D114 :606, :613 → `--color-status-negative` | No / Yes / n.a. | frozen token, local usage | `#B3261E` | HIGH (source) |
| Diversification 128.3 | green | `MetricCard direction="positive"` → `--color-status-positive` | HEAD: component present, token undefined / Yes / Yes | AUTHORITATIVE_FROZEN (light) | `#1E7A46` | HIGH |
| Top-opportunity border | green | `--color-status-positive` (HEAD ExecutiveDashboard.tsx:118; D114 :648) | No / Yes / Yes | AUTHORITATIVE_FROZEN (light) | `#1E7A46` | HIGH |
| PARTIAL nav chip | amber outline | D114 global.css:206-210 → `--color-status-warning` | No (HEAD chip uses neutral tokens) / Yes / — | COMPONENT_LOCAL usage of a frozen token | `#965C00` | HIGH (source) |
| Donut: Buy marker | green | D114 `verdictColors.Buy` = `var(--color-status-positive, #22c55e)` | No / Yes / — | COMPONENT_LOCAL | resolves to `#1E7A46` when the theme is applied. The fallback `#22c55e` is unused then. | HIGH (source) |
| Donut: **Watch**, Strong Buy, Accumulate markers | blue/green dots (Watch blue) | not in `verdictColors`, so → `var(--color-accent)` | No / Yes / — | COMPONENT_LOCAL | `#1F6FEB` per source. **Watch here is NOT the status-warning treatment.** | HIGH (source); per-dot pixel identity for Strong Buy not asserted |
| Watch verdict badge (Research/Sector) | not in operator screenshot; amber `! Watch` in E2E-018 `sector-intelligence_banking.png` | `DecisionBadge` → `--color-status-warning` | No / Yes / Yes | AUTHORITATIVE_FROZEN (light) | `#965C00` | HIGH |
| Pillar cues (Research/Sector) | E2E-018 sector capture: red/neutral/green | `MetricCard direction` thresholds 60/40 | No / Yes / Yes | AUTHORITATIVE_FROZEN (light) | `#1E7A46` / `#5A6672` / `#B3261E` | HIGH |
| AI / Platform authority | not shown | `AiBadge` / `PlatformBadge` | No / — / — | AUTHORITATIVE_FROZEN (light) | `#5A6672` / `#1F6FEB` | source-only |
| Light surfaces and ink | white/light panels | theme LIGHT surface/ink | No (HEAD shell is dark slate) / Yes / Yes | AUTHORITATIVE_FROZEN (light), superseded at HEAD by Phase 1A `.app-shell` dark values | `#FFFFFF`, `#F7F9FB`, `#0B1B2B` … | HIGH |
| Any colour **not** traceable to source | — | — | — | — | **NOT ESTABLISHED.** No screenshot sampling performed. | — |

**Semantic conflict found (FACT).** The same verdict has two treatments in the D114/screenshot lineage:

- The shared `DecisionBadge` maps Watch → warning (amber) and Hold → neutral.
- The component-local donut maps Hold → warning, Watch → accent (blue), and Strong Buy/Accumulate → accent.

The screenshot's blue "Watch" therefore reflects a local fallback. It is not a platform status semantic.

## 6. 05D-B reconciliation (Task D)

The 05D-B report is **not overwritten**. It is reconciled here.

| 05D-B finding | Holds? | Reconciliation |
|---|---|---|
| `REFERENCE_SURFACE=NONE` (defined in 05D-B §5 as an **active runtime** reference at HEAD) | **Holds for the active HEAD runtime.** | No route in the current application renders any status semantic through a defined value (§3). |
| No reference surface at all | **Superseded (incomplete).** | 05D-B did not examine non-ancestor lineages. A **historical** reference surface exists: E2E-018 `sector-intelligence_banking.png` and `executive.png` (Windows/Edge, `theme: light`, sha-verified in HEAD docs). It renders exactly the Research/Sector semantics: Certified, Snapshot, Watch, pillar cues. The operator screenshot (D114 lineage) is a second, non-governing historical reference for Executive. |
| §5 "Windows acceptance evidence contains no badge-colour observation" | **Incomplete.** | True of the evidence files in HEAD. False for E2E-018, which shows badge colours in pixels, though with no recorded colour values. |
| LIGHT values = AUTHORITATIVE_INACTIVE | **Strengthened.** | Now traced to the Phase 2 spec of record, the Phase 13 AA correction and certified light rendering. In this gate's vocabulary: `AUTHORITATIVE_FROZEN` (light) and `INACTIVE` at HEAD. |
| DARK values = EXISTING_BUT_NONAUTHORITATIVE | **Holds.** | No spec value, no capture, no adoption act anywhere in 24 refs. |
| No doc declares a status palette | **Superseded.** | `docs/v3.0/design-tokens-reference.md` declares it (light), but only on `m1-ad4-repair`, not in HEAD/main. |
| `NO_ACTIVE_AUTHORITATIVE_STATUS_COLOUR_REFERENCE_FOUND` | **Holds** (active). | — |

**What the screenshot establishes:**

- The IIPS platform historically rendered status semantics with a coherent light-theme palette: green certified/positive, blue snapshot/informational, amber warning, red negative/critical.
- Meaning is paired with text.
- The palette is produced by token and shared-component files that are byte-identical to HEAD.

**What it does NOT establish:**

- Exact hex values. These come only from source.
- Governing standing: the D114 TARGET-UI acts are not found, and 3b23f27 is a non-governing precedent.
- Any dark-theme values.
- Authority to reactivate the light theme against the Phase 1A/1B decisions.
- That the current dark `.app-shell` runtime should carry these values.
- The donut's verdict colours as platform semantics.

## 7. Accessibility findings (Task F)

Source values only; WCAG 2.x contrast ratios; normal text threshold 4.5:1. The badge text is 12px at weight 600, so the normal-text threshold applies.

| Source value (role) | on `#FFFFFF` | on LIGHT surface-1 `#F7F9FB` (badge bg) | on LIGHT surface-2 `#EDF1F5` | on HEAD shell s0 `#020617` | on HEAD shell s1 `#0F172A` (badge bg) | on HEAD shell s2 `#1E293B` |
|---|---|---|---|---|---|---|
| `#1E7A46` positive/certified/live | 5.35 | 5.07 | 4.71 | 3.77 | 3.34 | 2.74 |
| `#B3261E` negative/critical/unavailable | 6.54 | 6.19 | 5.76 | 3.09 | 2.73 | 2.24 |
| `#5A6672` neutral/ai/replay | 5.87 | 5.56 | 5.17 | 3.44 | 3.04 | 2.49 |
| `#965C00` warning/stale (Watch) | 5.49 | 5.20 | 4.83 | 3.68 | 3.25 | 2.67 |
| `#1F6FEB` informational/platform/**snapshot**/accent | 4.63 | **4.39** | **4.08** | 4.35 | 3.85 | 3.16 |

**Existing accessibility conflicts (FACT):**

1. **SNAPSHOT badge in the historical light rendering.** `#1F6FEB` text on the badge background `--color-surface-1` `#F7F9FB` is **4.39:1**, below AA. The Phase 13 `theme.test.ts` tested accent only as a fill under white text, not snapshot text on surface-1. The same applies to the "Tracked"/"Conviction" labels if they sit on surface-1.
2. **Frozen LIGHT values on the current dark shell.** All five values are below 4.5:1 on every HEAD shell surface.
3. **DARK `status-neutral`.** It is not overridden and stays `#5A6672`: 2.97:1 on DARK s0 `#0B1B2B`, 2.68:1 on DARK s1, 3.04:1 on HEAD s1.

   The other DARK values pass on HEAD s1: `#4CBB7A` 7.39, `#E86A60` 5.66, `#D89B3F` 7.38, `#6BA6F5` 7.14, `#B4C1CD` 9.73. On HEAD s2, `#E86A60` is 4.64, which is marginal. These values have no authority (§4.3).
4. **D114 donut hex fallbacks** on white: `#22c55e` 2.28, `#f59e0b` 2.15, `#ef4444` 3.76. They apply only when the tokens are undefined. They are component-local.

## 8. Architectural scope and blast radius (Task E)

| Question | Finding |
|---|---|
| 1. Platform-wide? | **Yes, by design** (FACT). The spec and tokens are platform semantic tokens, consumed by shared primitives: Badges, DecisionBadge, MetricCard, TrendIndicator, RiskIndicator. |
| 2. Executive-only? | **No.** The Executive-specific parts (KPI labels, donut, nav chips) are component-local usages in the non-governing D114 lineage. |
| 3. Shared-component based? | **Yes.** Every Research/Sector semantic flows through shared primitives that are byte-identical to the certified lineage. **No shared-component change is needed** to express the palette; only token provisioning is needed. |
| 4. Research/Sector-compatible? | **Yes, visually evidenced.** The E2E-018 sector capture shows the exact current Research/Sector semantics in this palette, in light theme. |
| 5. Historically isolated? | The **light rendering** is historically isolated from HEAD: it is in non-ancestor lineages, and Phase 1B removed it. The **token files** are not isolated; they are in HEAD. |

**What adopting the historical authority would require (analysis only; not implemented):**

| Mechanism | Needs `applyTheme()` reactivation? | Changes Phase 1B decision? | Platform-wide CSS vars? | Changes shared components? |
|---|---|---|---|---|
| (i) Reactivate `applyTheme('light')` | Yes | **Yes**: reverses 144e8ed and the `:root` boundary (index.css:466, 612, 636) | Yes, at `:root` | No |
| (ii) Scope frozen LIGHT status/authority/freshness values into `.app-shell` | No | No for the `:root` rule. Extends the Phase 1A token subset. | Yes, shell-scoped | No |
| (iii) Scope other (e.g. DARK) values into `.app-shell` | No | No | Yes, shell-scoped | No. **Needs a new authority act for the values.** |
| (iv) Light shell (full theme parity with the captures) | Yes, or an equivalent | Yes. Also reverses the Phase 1A dark alignment and BI-07 coherence. | Yes | No |

**Blast radius** (unchanged from 05D-B §7):

- **Affected:** Company, Sector, Security Master (Certified badge) and the Executive Dashboard when it has data.
- **Latent:** Research UI03, Intelligence and Evidence (mounted without props).
- **Not affected:** Portfolio/System B, Screener, Sidebar.
- **Test:** VP-12 (`tests/wui_rs_05d_a_visual_parity.test.ts:140-144`) would fail by design under (i)–(iv).

## 9. Governance disposition (Task G)

> ## **B. EXISTING VISUAL REFERENCE FOUND, TOKEN AUTHORITY NOT YET ESTABLISHED**

**Why B and not A:**

- An authoritative colour system exists: the Phase 2 spec → frozen `tokens/index.ts` → certified light rendering.
- But it is authoritative **for the light theme**, which the current governed lineage deliberately does not run.
- For the **current runtime** (the dark `.app-shell` adopted by Phase 1A; `applyTheme` removed by Phase 1B), no token authority exists:
  - the frozen LIGHT values fail AA on it;
  - the DARK values have no spec, capture or adoption act;
  - the spec of record is not present in HEAD/main.
- Declaring A would convert inference into authority.

**Why B and not C/D:** The visual reference is not merely historical imagery. Its source chain is byte-identical to the shared components and tokens in HEAD, and it covers the exact Research/Sector surface.

| Question | Answer |
|---|---|
| May status-colour implementation proceed? | **No.** Not without an authority act. |
| Is a new authority decision still required? | **Yes.** It must decide: (a) the theme context: keep the dark shell, or reverse Phase 1A/1B to light; (b) the value source for the dark context: adopt theme.ts DARK with a ruling on `status-neutral`, or commission new dark values; (c) whether to bring `docs/v3.0/design-tokens-reference.md` / `design-system.md` into the governed lineage as the spec of record; (d) the treatment of the SNAPSHOT/informational 4.39:1 light conflict; (e) whether elevation is in scope. |
| Does VP-12 require amendment? | **Yes**, under any implementation. It must be amended explicitly by the authorizing act, never weakened silently. |
| Required implementation scope if authorized | **Preferred-by-architecture, not selected:** a token provisioning in `frontend/src/index.css` `.app-shell` for `--color-status-*` (6), `--color-authority-*` (3) and `--color-freshness-*` (5), optionally `--elev-1/3`. Plus the VP-12 amendment and new resolution/contrast tests. **No shared-component, route, contract or `applyTheme` change** unless the act selects mechanism (i) or (iv). |
| Required Windows visual verification scope | See §11. |

## 10. Explicit implementation authorization requirement

No colour may be implemented until a recorded authority act names **all** of the following:

- the mechanism ((i)–(iv), §8);
- the exact value table per token;
- the theme context;
- the VP-12 amendment text;
- the accessibility acceptance criteria (AA 4.5:1 on the actual shell surfaces `#020617` / `#0F172A` / `#1E293B`, or on the light surfaces if the theme is reversed).

Operator screenshots, including the one supplied here, cannot substitute for that act. This follows precedent `3b23f27`.

## 11. Windows verification requirements

- Performed in this gate: **NO**. Arena has no Windows access. No observation is claimed.
- **After an authorized implementation**, on Windows (`npm.cmd`, Edge/Chrome):
  - `/research/sector/:id` (Banking: Watch, Certified, Snapshot, pillar cues 15/45.5/75/70/50, override StatusBadges, selector error);
  - `/research/company/:id`;
  - `/security-master` header badge;
  - `/executive` when data renders;
  - `/portfolio` (BI-07) regression, which must be unchanged.
- Compare side by side against E2E-018 `sector-intelligence_banking.png` / `executive.png` for **semantic** correspondence (hue family per semantic). This is not pixel parity if the theme context differs.
- Record computed colours from DevTools. Screenshots alone are insufficient.

## 12. Unresolved

- **U-1:** Why Phase 1A omitted the status/authority/freshness families. There is still no record (carried over from 05D-B).
- **U-2:** The governing standing of the D114 TARGET-UI Executive redesign. Authority act files are not found in any ref.
- **U-3:** The origin of the operator screenshot build. The strings and the time (tip 23:13 IST vs screenshot 23:20:52, same day) are consistent with `d771e6a`; this is **INFERENCE**, not attested.
- **U-4:** The dark-theme status palette. No authoritative source exists.
- **U-5:** The spec/code discrepancy for `freshness-replay` (informational in the spec vs neutral value in the code).
- **U-6:** The convergence inventory (`evidence/target-shell-integration/IIPS-HISTORICAL-CURRENT-CONVERGENCE-INVENTORY.md`, in main) records Active Positions, Risk Exposure, Alerts Requiring Action, IIPS Score Distribution, Watchlist Highlights and Quick Actions as "ZERO repo evidence". These strings **do** exist on `origin/windows/d114-stage5-banking-replay-observation` (e.g. `53819b9`, `49befad`, `75617a1`, `0d619b1`). Recorded here as a correction by addition; that document is not modified.
