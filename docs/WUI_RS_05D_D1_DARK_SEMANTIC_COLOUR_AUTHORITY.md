# WUI-RS-05D-D1: Dark Semantic Colour Authority Decision

**This is an authority record only. Nothing in the application is implemented by this gate.**

```
AUTHORITY_RECORD=WUI-RS-05D-D1
COLOUR_AUTHORITY_DECISION=AUTHORIZED (dark-runtime semantic palette; design/implementation under WUI-RS-05D-D2)
STATUS_COLOUR_IMPLEMENTATION_PERFORMED=NO
APPLICATION_SOURCE_CHANGED=NO
VP12_AMENDED=NO (authorized, not yet performed)
WINDOWS_VISUAL_VERIFICATION_PERFORMED=NO
PRODUCTION_AUTHORITY_GRANTED=NO
```

---

## 1. Governing baseline

| Item | Value |
|---|---|
| Governing branch | `arena/01a0d1d3-iips-production-market-data` |
| Governing HEAD at record time | `6301311dd675f5d84667c1fd2c400c2da1cb3b24` (WUI-RS-05D-C report) |
| Parent | `5711b9f8ec93e704e83e10410eca29c54dccd862` (WUI-RS-05D-B report) |
| main | `4d3e1cdca3a33da0ec3be8b336b17128108a502c`. This gate must leave it unchanged. |
| Decision source | Operator authority message "IIPS WUI-RS-05D-D1 — DARK SEMANTIC COLOUR AUTHORITY DECISION". This document records that decision verbatim in substance. |

## 2. Source authority (evidence this decision rests on)

| Source | Standing (per 05D-C) | Role in this decision |
|---|---|---|
| `docs/WUI_RS_05D_B_STATUS_COLOUR_AUTHORITY_ANALYSIS.md` (`5711b9f`) | Forensic record | Established that no semantic colour variable is defined at runtime (`REFERENCED_BUT_UNDEFINED`), and that `NO_ACTIVE_AUTHORITATIVE_STATUS_COLOUR_REFERENCE_FOUND`. |
| `docs/WUI_RS_05D_C_PLATFORM_COLOUR_AUTHORITY_RECONCILIATION.md` (`6301311`) | Forensic record, disposition **B** | Established the historical visual reference and the light-value lineage. Established that no token authority exists for the dark runtime. |
| E2E-018 captures (`2f1049d` on `origin/m1-ad4-repair`; product `7964fcc`; Windows/Edge; manifest `theme: light`) | Historical visual reference | **Semantic reference:** which meaning maps to which hue family. |
| Phase-2 specification `docs/v3.0/design-tokens-reference.md` / `design-system.md` (`7325aed`, `origin/m1-ad4-repair`) and frozen `frontend/src/core/tokens/index.ts` (blob `ff80280332`) | `AUTHORITATIVE_FROZEN` for light meaning and values | **Semantic/reference lineage only.** It is **not** the dark-runtime palette (Decision 3). |
| `frontend/src/core/theme/theme.ts` `DARK` map | `INACTIVE` / standing `UNKNOWN` | Not authoritative. D2 may evaluate it as a candidate input, and must validate it like any other value. |
| Phase 1A (`f13002e`) / Phase 1B (`144e8ed`) dark-shell and `:root`-boundary decisions | In force | Retained (Decision 1). |

## 3. Authority decision

The following is recorded as the **governing design authority for WUI-RS-05D-D**.

| # | Decision |
|---|---|
| D-1 | **The current dark IIPS shell is retained.** The Phase 1A/1B dark-shell decisions are not reversed. `applyTheme()` is **not** reactivated. |
| D-2 | **The historical IIPS semantic meanings are retained**, as demonstrated by E2E-018 (§4). |
| D-3 | **The historical light hex values are not directly authorized for the dark runtime.** The Phase-2 light specification is the semantic/reference lineage, not the final dark palette. |
| D-4 | **A dedicated dark-runtime semantic palette is authorized for design and implementation.** It must be derived to be accessible while preserving the established meanings. No new or arbitrary product semantics may be invented. |
| D-5 | **Accessibility is a hard requirement** (§6). |
| D-6 | **Snapshot contrast must be fixed** (§8). |
| D-7 | **Neutral must receive an explicit dark-runtime decision** (§7). |
| D-8 | **Watch stays warning/amber in the shared verdict and badge components** (§9). |
| D-9 | **Status stays text-semantic as well as colour-semantic.** Colour is never the sole carrier. |
| D-10 | **Scope:** the `.app-shell` token boundary only. There is no global theme engine and no new platform-wide theme architecture (§10). |
| D-11 | **Elevation and card shadows are out of scope** (§11). |
| D-12 | **VP-12 amendment is authorized**, limited in scope (§12). |
| D-13 | **Windows verification is mandatory after implementation** (§13). |
| D-14 | **Non-production only** (§14). |

## 4. Semantic meanings (retained, D-2)

These are meaning families. The hue family shown is the one demonstrated in E2E-018. The dark values themselves are to be derived under D2.

| Meaning family | Runtime variables in scope | E2E-018 hue family | Example consumers |
|---|---|---|---|
| Certified / Positive / Live | `--color-authority-certified`, `--color-status-positive`, `--color-freshness-live` | green | CertifiedBadge; DecisionBadge (Strong Buy/Buy); MetricCard `positive` (pillar ≥60); TrendIndicator up; FreshnessBadge `live` |
| Snapshot / Informational | `--color-freshness-snapshot`, `--color-status-informational`, `--color-authority-platform` | blue | FreshnessBadge `snapshot`; StatusBadge `informational`; PlatformBadge; ChartFoundations |
| Watch / Warning / Stale | `--color-status-warning`, `--color-freshness-stale` | amber | DecisionBadge (Watch); StatusBadge `warning` (override lists); FreshnessBadge `stale` |
| Negative / Critical / Unavailable | `--color-status-negative`, `--color-status-critical`, `--color-freshness-unavailable` | red | DecisionBadge (Avoid); MetricCard `negative` (pillar <40); selector-error span; FreshnessBadge `unavailable` |
| Neutral | `--color-status-neutral` | neutral grey | DecisionBadge (Accumulate/Hold); MetricCard `neutral` (pillar 40–59) |
| Authority / AI | `--color-authority-ai` | distinct, non-authoritative | AiBadge. It must stay visually distinct from Certified ("CERTIFIED ≠ AI ≠ PLATFORM"). |
| Freshness states | `--color-freshness-{live,snapshot,stale,unavailable,replay}` | as the families above | FreshnessBadge |

This gives **14** in-scope variables:

- 6 `--color-status-*`
- 3 `--color-authority-*`
- 5 `--color-freshness-*`

The existing verdict → status mapping in `DecisionComponents.tsx` (`VERDICT_STATUS`) is the platform semantic and is retained.

**Carried open item.** The meaning of `--color-freshness-replay` is inconsistent in the lineage:

- The Phase-2 specification says "informational".
- The frozen token file uses the neutral value.

This record does not resolve it. D2 must either keep the frozen token-file mapping, or record the deviation explicitly. Either way, D2 must disclose which it applied and why.

## 5. Dark-runtime requirement (D-1, D-3, D-4)

- The palette must be designed for the **actual active dark surfaces** of the retained shell (`frontend/src/index.css` `.app-shell`, lines 475-488 at the baseline):

  | Variable | Value |
  |---|---|
  | `--color-surface-0` | `#020617` |
  | `--color-surface-1` | `#0F172A` |
  | `--color-surface-2` | `#1E293B` |

  These are recorded facts about the retained shell, not new choices.
- **Badges and verdict badges render on `--color-surface-1`.** Metric values render on the card surface in use.
- The historical light values (e.g. `#1E7A46`, `#1F6FEB`, `#965C00`, `#B3261E`, `#5A6672`) must **not** be copied into the dark runtime as-is. 05D-C §7 shows each is below 4.5:1 on these surfaces.
- Every dark value D2 selects must be recorded with:
  - its meaning family;
  - its derivation rationale (hue family preserved from E2E-018);
  - its measured contrast against each applicable surface.

## 6. Accessibility requirement (D-5)

- **Target:** WCAG 2.x AA, **≥ 4.5:1**, for every implemented semantic foreground/background combination. This is the normal-text threshold, and badge text is 12px at weight 600, so it applies.
- Evaluate against the actual active dark surfaces in §5, including every background each consumer actually uses.
- No sub-AA normal-text status treatment may be introduced knowingly.
- D2 must include a deterministic contrast test in the repository's `node:test` suite. The test must read the implemented `.app-shell` values and assert ≥ 4.5:1 for each in-scope combination.

## 7. Neutral requirement (D-7)

- `#5A6672` must **not** be inherited merely because it exists in the historical tokens or in `theme.ts` `DARK`. Recorded contrast is 3.04:1 on `#0F172A` and 2.68:1 on the DARK `surface-1`.
- The dark neutral must be **explicitly selected**, recorded with its rationale, and validated to ≥ 4.5:1.
- It must stay distinguishable from both the default ink (`--color-ink`) and the AI authority treatment, so that the meanings "neutral verdict" and "AI explanation" are not visually merged. INFERENCE from D-2 and the "CERTIFIED ≠ AI ≠ PLATFORM" rule. D2 must document how it satisfies this.

## 8. Snapshot requirement (D-6)

- The historical light Snapshot deficiency is **not** carried into the dark runtime. That deficiency is `#1F6FEB` on `#F7F9FB` = 4.39:1 (05D-C §7).
- The dark `--color-freshness-snapshot` must be ≥ 4.5:1 on `#0F172A`, the badge background. It must also stay in the blue/informational family.

## 9. Watch semantic rule (D-8)

- In the shared verdict and badge components, **Watch = warning/amber**:
  - `DecisionBadge` Watch → `status-warning`;
  - `StatusBadge warning`;
  - `FreshnessBadge stale` is in the same family.
- The historical Executive-local donut fallback (Watch → `--color-accent`, blue; D114 branch `ExecutiveDashboard.tsx`) is **not** promoted to a platform meaning.
- If any Executive-local visualization needs a categorical colour map, it must be explicitly local and labelled as such. It must not redefine the shared semantic variables.
- FACT: the current HEAD `ExecutiveDashboard.tsx` has no donut, so no local map exists today.

## 10. Scope (D-9, D-10)

- **In scope for D2:**
  - Define the 14 semantic variables (§4) inside the existing `.app-shell { … }` token block in `frontend/src/index.css`. They must be scoped to `.app-shell` and never to `:root`.
  - Amend VP-12 (§12).
  - Add accessibility and resolution tests.
  - Write the D2 implementation report.
- **Out of scope:**
  - `applyTheme()` activation;
  - `:root` declarations;
  - a global theme engine or any new platform-wide theme architecture;
  - changes to `theme.ts` or `tokens/index.ts`;
  - changes to shared component logic, routes, API contracts or auth;
  - System B/Portfolio classes;
  - production or provider activation.
- **Text semantics:** the existing symbol + label pairs must be preserved unchanged. Examples: `✓ CERTIFIED RESULT`, `□ SNAPSHOT`, `! Watch`, `▲ STALE`, `✕ UNAVAILABLE`.
- **Expected affected surfaces:** Company, Sector, the Security Master header badge, and the Executive Dashboard when data renders. Research UI03, Intelligence and Evidence are latent: they render these components only when fed. Portfolio/System B, Screener and Sidebar are expected to be unaffected (05D-B §7).

## 11. Elevation exclusion (D-11)

`--elev-1`, `--elev-2` and `--elev-3`, and every card shadow, are **out of scope**. They remain undefined at runtime and must not be altered unless separately authorized.

## 12. VP-12 authorization (D-12)

- **Authorized:** amend `tests/wui_rs_05d_a_visual_parity.test.ts` VP-12 (lines 140-144 at the baseline). It currently asserts that `index.css` contains no `--color-status-`, `--color-authority-` or `--color-freshness-` definitions.
- **The amendment is limited to:**
  - permitting exactly the 14 authorized variables;
  - requiring that they are defined inside `.app-shell`.
- **The amendment must preserve:**
  - the assertion that no `--elev-` definition exists in `index.css` (D-11);
  - the assertion that `applyTheme(` is absent from `main.tsx` (D-1);
  - every other VP-01…VP-12 visual-parity safeguard.
- **Strengthening is permitted**, for example asserting no `:root` definition of these variables. Weakening or deletion of unrelated assertions is **not** permitted.
- **Not performed in D1.**

## 13. Windows verification requirement (D-13)

Windows verification is mandatory after the D2 implementation. It must be run on Windows with `npm.cmd` in Edge or Chrome. Arena cannot perform or claim it.

**Required surfaces:**

1. **Research / Sector Intelligence** (`/research/sector/:id`, e.g. Banking): Certified, Snapshot, the Watch verdict, pillar cues (positive/neutral/negative), override StatusBadges, and the selector-error state if reproducible.
2. **Research / Company Intelligence** (`/research/company/:id`).
3. **Security Master** (`/security-master`): the header Certified badge.
4. **Executive** (`/executive`), in the data-rendered state when available.
5. **Portfolio BI-07** (`/portfolio`): regression; it is expected to be unchanged.

**Method:**

- Compare against E2E-018 `sector-intelligence_banking.png` and `executive.png` for **semantic correspondence** (the same hue family per meaning). This is not pixel parity, because the theme context differs: light versus dark.
- Record the actual computed runtime colours (DevTools computed `color` / `border-color`) where observable.
- Record pass or fail per surface.

## 14. Non-production boundary (D-14)

This authority grants **no**:

- production activation;
- provider activation;
- Dhan entitlement;
- NSE authorization;
- production deployment authority.

It does not alter the standing semantics: AI advisory deferred; replay reproduced/byteIdentical NOT VERIFIED; AD-17/M-2 unresolved; PIT/asOf refused; SNAPSHOT; certified/evidence values; API contracts; auth.

## 15. D1 boundary compliance

| Constraint | Status |
|---|---|
| Application source, CSS, tokens, components modified | NO |
| VP-12 modified | NO |
| Colours implemented | NO |
| `applyTheme()` activated | NO |
| Production activation | NO |
| Windows visual verification claimed | NO |
| Files changed | this record only |

## 16. Next executable step

**WUI-RS-05D-D2: Dark semantic colour implementation**, under this authority:

1. Derive and record the 14-variable dark palette with per-combination contrast (§4–§8).
2. Define it in `.app-shell` only.
3. Amend VP-12 within §12 limits.
4. Add the deterministic contrast/resolution tests.
5. Run the full suite, `tsc` and `vite build`.
6. Write the D2 report.
7. Commit and push.
8. Hand off to operator Windows verification (§13).
