# WUI-RS-05D-D2: Dark Semantic Colour Implementation

This gate implemented the dark semantic colours and qualified them with automated accessibility tests. Windows visual verification was not performed.

```
STATUS_COLOUR_IMPLEMENTED=YES (14 variables, .app-shell only)
APPLY_THEME_ACTIVATED=NO
ROOT_DECLARATIONS_ADDED=NO
ELEVATION_CHANGED=NO
HISTORICAL_LIGHT_VALUES_COPIED=NO
MIN_CONTRAST_ACHIEVED=4.64:1 (all 42 value/surface pairs ≥ 4.5:1)
FULL_SUITE=685/685 PASS (114 suites, 0 fail, 0 skipped)
TSC=PASS  VITE_BUILD=PASS
WINDOWS_VISUAL_VERIFICATION_PERFORMED=NO
PRODUCTION_AUTHORITY=NONE
```

Labels used below: **FACT** means verifiable in the repository or by arithmetic. **INFERENCE** means a reasoned choice, with the reasoning stated.

---

## 1. Governing baseline

| Item | Value |
|---|---|
| Branch | `arena/01a0d1d3-iips-production-market-data` (operator-advanced to `9c215b4`; confirmed with `ls-remote`) |
| Baseline | `9c215b4456a39692ff10bca25e9ac3d53554c7d3` (D1 authority record) |
| Baseline parent | `6301311dd675f5d84667c1fd2c400c2da1cb3b24` |
| main | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (unchanged) |
| Worktree at baseline | clean |

## 2. D1 authority reference

`docs/WUI_RS_05D_D1_DARK_SEMANTIC_COLOUR_AUTHORITY.md` (`9c215b4`) governs this gate. D2 implements D-1 to D-13 and nothing more:

| D1 decision | What D2 did |
|---|---|
| D-1 dark shell retained | Values added to the existing `.app-shell` token block. `applyTheme()` stays un-invoked (DS-03, VP-12). |
| D-2 meanings retained | The family mapping in D1 §4 is implemented one-for-one. Each family shares one value (DS-12). |
| D-3 light hex values not used | None of the 6 historical light values appears (DS-10). |
| D-4 dedicated dark palette | See §3 and §4. |
| D-5 AA ≥ 4.5:1 | Minimum achieved is 4.64:1 (§5, DS-06). |
| D-6 Snapshot fixed | `#6BA6F5` gives 5.85–8.07:1. The hue is blue (DS-07). |
| D-7 explicit neutral | `#8A97A3` (§7, DS-11). |
| D-8 Watch = amber | `DecisionBadge` Watch → `--color-status-warning` `#D89B3F` (DS-08). |
| D-9 text-semantic | Symbol and label retained for every badge (DS-09). No component was changed. |
| D-10 `.app-shell` only | Only one rule defines the variables. There are no `:root` declarations and no other stylesheet defines them (DS-02). |
| D-11 elevation excluded | `--elev-*` is still undefined (DS-04, VP-12). |
| D-12 VP-12 amended within scope | See §8. |
| D-13 Windows verification | Handed off; see §13. |

## 3. The 14 selected values

These values are implemented in `frontend/src/index.css`, inside the `.app-shell` token block.

| Meaning family | Variable | Selected value |
|---|---|---|
| Certified / Positive / Live | `--color-authority-certified` | `#4CBB7A` |
| | `--color-status-positive` | `#4CBB7A` |
| | `--color-freshness-live` | `#4CBB7A` |
| Snapshot / Informational | `--color-freshness-snapshot` | `#6BA6F5` |
| | `--color-status-informational` | `#6BA6F5` |
| | `--color-authority-platform` | `#6BA6F5` |
| Watch / Warning / Stale | `--color-status-warning` | `#D89B3F` |
| | `--color-freshness-stale` | `#D89B3F` |
| Negative / Critical / Unavailable | `--color-status-negative` | `#E86A60` |
| | `--color-status-critical` | `#E86A60` |
| | `--color-freshness-unavailable` | `#E86A60` |
| Neutral | `--color-status-neutral` | `#8A97A3` |
| Authority / AI | `--color-authority-ai` | `#B4C1CD` |
| Freshness: Replay | `--color-freshness-replay` | `#B4C1CD` |

## 4. Source and derivation of each value

**Derivation rule (INFERENCE, applied uniformly).** D1 forbids inventing values, so every colour is taken from a value that already exists in the repository and was written for a dark rendering of these same semantic tokens. Each one was then validated against the actual shell surfaces.

- The only such in-repo source is `frontend/src/core/theme/theme.ts`, in the `DARK` map. It carries the header comment "Dark palette resolves the same semantic tokens with adequate contrast". 05D-C classified it as INACTIVE with standing UNKNOWN. D1 §2 allows D2 to evaluate it as a candidate if the values are validated like any other.
- The `DARK` map is used **as a value source only**. It is not activated and not imported, and `theme.ts` is unchanged.
- Where a `DARK` value fails the requirement, it is **not** used. This applies to neutral (§7).

| Value | Exact source | Hue family preserved from E2E-018 (FACT: 05D-C §5) | Reason for selection |
|---|---|---|---|
| `#4CBB7A` | `theme.ts` DARK: `--color-status-positive`, `--color-authority-certified`, `--color-freshness-live` | green (hue 145°) | Green family; lowest ratio is 6.06:1 |
| `#6BA6F5` | `theme.ts` DARK: `--color-status-informational`, `--color-authority-platform`, `--color-freshness-snapshot` | blue (hue 214°) | Keeps Snapshot blue and fixes the historical 4.39:1 deficit |
| `#D89B3F` | `theme.ts` DARK: `--color-status-warning`, `--color-freshness-stale` | amber (hue 36°) | Keeps Watch amber; lowest ratio is 6.05:1 |
| `#E86A60` | `theme.ts` DARK: `--color-status-negative`, `--color-status-critical`, `--color-freshness-unavailable` | red (hue 4°) | Red family; lowest ratio is 4.64:1, which passes but is the tightest pair (see §12) |
| `#B4C1CD` | `theme.ts` DARK: `--color-authority-ai`, `--color-freshness-replay` | neutral / non-authoritative grey | Keeps AI visually separate from Certified and Platform, as in the spec ("CERTIFIED ≠ AI ≠ PLATFORM") |
| `#8A97A3` | `theme.ts` DARK: `--color-ink-muted` (not a status token); see §7 | grey | `DARK` leaves `status-neutral` at `#5A6672`, which fails (3.04:1 on `#0F172A`), so it was rejected. Selection explained in §7. |

## 5. Contrast matrix

WCAG 2.x contrast ratios against the actual shell surfaces (`index.css` `.app-shell`). Badges and verdict badges render on `--color-surface-1`, and so do metric cards (`MetricCard`). All three surfaces are validated for every value, as required.

| Value (families) | on `#020617` (surface-0) | on `#0F172A` (surface-1, badge/card background) | on `#1E293B` (surface-2) | Result |
|---|---|---|---|---|
| `#4CBB7A` certified/positive/live | 8.35 | 7.39 | 6.06 | PASS |
| `#6BA6F5` snapshot/informational/platform | 8.07 | 7.14 | 5.85 | PASS |
| `#D89B3F` warning/stale (Watch) | 8.34 | 7.38 | 6.05 | PASS |
| `#E86A60` negative/critical/unavailable | 6.40 | 5.66 | **4.64** | PASS (minimum) |
| `#8A97A3` neutral | 6.76 | 5.98 | 4.90 | PASS |
| `#B4C1CD` AI/replay | 11.00 | 9.73 | 7.98 | PASS |

All 14 variables × 3 surfaces = 42 checks, all ≥ 4.5:1. DS-06 recomputes every one from the CSS file at test time.

- **Non-text uses.** `--color-status-informational` is also used as a bar fill (`ChartFoundations`) and a tab underline (`InteractionComponents`). Both need 3:1 for non-text contrast; this is met by the text-level ratios above.
- **Comparison with the historical light values on `#0F172A`** (05D-C §7): `#1E7A46` 3.34, `#B3261E` 2.73, `#5A6672` 3.04, `#965C00` 3.25, `#1F6FEB` 3.85. All fail. DS-10 asserts that these values fail and that none is used.

## 6. Replay reconciliation

**Evidence (FACT):**

| Source | Replay treatment |
|---|---|
| `docs/v3.0/design-tokens-reference.md` §4 (Phase-2 spec, `7325aed`) | "`freshness-replay` (REPLAY, **informational**)" |
| `docs/v3.0/design-system.md` §9 (same commit) | "`freshness-replay` → REPLAY". No family is assigned. |
| `frontend/src/core/tokens/index.ts`: Phase-3 codification, present from the first codified version at `7325aed`, unchanged by the Phase-13 A1/A5 hardening (`29a92a7`), and frozen as blob `ff80280332` in every lineage | `replay: '#5A6672'`, i.e. the **neutral** value |
| `theme.ts` DARK (every lineage) | `#B4C1CD`, a grey that equals DARK `authority-ai` |
| E2E-018 captures (manifest `testIdCounts`) | **No `freshness-replay` badge was ever captured.** Only `freshness-snapshot`, `badge-certified`, `badge-ai` and `badge-platform` appear. No rendered visual evidence exists. |

**Finding: the authority is ambiguous.**

- The specification says informational.
- Both codified implementations, the light and the dark map, say grey/neutral.
- No governance act resolves the conflict.
- No capture demonstrates either treatment.

This ambiguity is kept on record here. It is not claimed to be resolved.

**Treatment applied (INFERENCE, as the least semantically committal existing option):** grey `#B4C1CD`.

1. It is what every codified implementation actually shipped, in both themes. Choosing blue would promote a specification sentence that was never implemented.
2. Grey commits to no status meaning. Blue would make REPLAY look the same as SNAPSHOT/Informational/Platform, which asserts a meaning the codified system never rendered.
3. It is the existing `DARK` value, so no value is invented.

- Contrast is 7.98–11.00:1.
- The value is shared with AI, as in `DARK`. Replay and AI still stay distinct through their symbols and labels (`↻ REPLAY` vs `✦ AI EXPLANATION`), per D-9.
- **Runtime exposure today (FACT):** `FreshnessBadge state="replay"` is reachable only in Research UI03, Intelligence and Evidence. Those routes mount without props, so it is not rendered at runtime today.
- **Future change:** if a later authority adopts "informational", it is a one-line change: set `--color-freshness-replay` to `#6BA6F5`.

## 7. Neutral reconciliation

- **Rejected: `#5A6672`,** the historical light value that `DARK` also inherits without overriding. It gives 3.44 / 3.04 / 2.49:1, so it fails on every surface, and D1 §7 forbids inheriting it.
- **Selected: `#8A97A3`**, which is `theme.ts` DARK `--color-ink-muted`.

**Lineage (FACT):** in the frozen light system, neutral `#5A6672` and muted ink `#5C6875` are almost the same colour. Their contrast ratio against each other is 1.03:1. Historically, then, neutral occupied the muted-ink tier. `#8A97A3` is the value that the same repository's dark map assigns to that tier. The Phase-13 `theme.test.ts` (on `origin/m1-ad4-repair`) already asserted that this value meets AA on the dark surface. Selecting it moves the historical relationship into the dark shell without inventing a value.

**Contrast:** 6.76 / 5.98 / 4.90:1.

**Distinctness required by D1 §7 (DS-11):**

| Compared with | Ratio (luminance contrast) | Other differences |
|---|---|---|
| Ordinary text, `--color-ink` `#E2E8F0` | 2.42:1 | clearly darker tier |
| AI, `--color-authority-ai` `#B4C1CD` | 1.63:1 | AI badge is labelled `✦ AI EXPLANATION`; neutral appears as `• Hold` / `• Accumulate` verdicts and neutral pillar values |
| Shell `--color-ink-secondary` `#94A3B8` | 1.16:1 | not required by D1; disclosed in §12 |

The other in-repo candidate was the shell's `--color-ink-secondary` `#94A3B8` (5.71–7.87:1). It was not chosen because it is less distinct from AI (1.40:1) and from ink (2.08:1).

No new semantic category was created. Neutral stays grey: saturation ≈ 0.12, asserted to be below 0.3.

## 8. VP-12 amendment

`tests/wui_rs_05d_a_visual_parity.test.ts` VP-12 was amended exactly within D1 §12.

| Aspect | Before (05D-A) | After (D2) |
|---|---|---|
| status/authority/freshness variables | must be absent | **exactly** the 14 authorized names, each once. Any additional name or duplicate fails. |
| Location | n/a | every rule that declares them must have the selector `.app-shell`. This also rejects `:root`. |
| `--elev-*` | must be absent | **still must be absent** (retained) |
| `applyTheme(` in `main.tsx` | must be absent | **still must be absent** (retained) |
| VP-01…VP-11 | unchanged | unchanged |

The file header comment gained a note describing the amendment. No assertion was deleted or relaxed beyond the 14 authorized variables.

**Mutation check (performed and reverted):**

- Setting neutral back to `#5A6672` caused 3 failures (DS-06, DS-10, DS-11).
- Appending `:root { --color-status-positive…; --elev-1… }` caused 3 failures (VP-12, DS-02, DS-04).
- `index.css` was restored byte-for-byte afterwards.

## 9. Automated accessibility tests

The new file `tests/wui_rs_05d_d2_dark_semantic_colour.test.ts` contains 12 tests in `node:test`. It reads the real `index.css` at test time.

| Test | Asserts | Requirement number(s) |
|---|---|---|
| DS-01 | All 14 defined in the `.app-shell` token block; no unauthorized semantic names | 1 |
| DS-02 | Defined only in `.app-shell`; none at `:root`; each defined exactly once; no other `.css` under `frontend/src` defines them | 1, 2 |
| DS-03 | `applyTheme` absent from `main.tsx`; `applyTheme(` absent from `App.tsx` | 3 |
| DS-04 | No `--elev-*` definitions | 4 |
| DS-05 | Surfaces equal `#020617` / `#0F172A` / `#1E293B`; WCAG arithmetic self-check (21:1; `#1F6FEB`/white = 4.63) | 5 |
| DS-06 | 14 × 3 pairs ≥ 4.5:1 | 6 |
| DS-07 | Snapshot / informational / platform: hue 190–250°, saturation ≥ 0.4 | 7 |
| DS-08 | Warning: hue 25–55° (amber). Stale = warning. Rendered `DecisionBadge` Watch uses `--color-status-warning` and not accent or informational. `StatusBadge` warning also uses it. | 8 |
| DS-09 | Rendered badges keep symbol + label: ✓ CERTIFIED RESULT, ✦ AI EXPLANATION, ◇ PLATFORM, □ SNAPSHOT, ● LIVE, ▲ STALE, ✕ UNAVAILABLE, ↻ REPLAY, ! Watch, ▼ Avoid, ▲ Buy, • Hold | 9 |
| DS-10 | None of `#1E7A46 #B3261E #5A6672 #965C00 #B26A00 #1F6FEB` is used, and each of them is shown to fail on `#0F172A` | 10 |
| DS-11 | Neutral ≠ `#5A6672`, ≠ ink, ≠ AI; grey; ≥ 1.5:1 from ink and from AI | D1 §7 |
| DS-12 | One value per meaning family; replay = AI (the grey lineage); positive is green; negative is red | D1 §4 |

## 10. Full qualification results

Everything below ran in the Arena sandbox (Linux). The scripts are the repository's npm scripts, which contain no Unix-only syntax in the parts this gate touches. On Windows, run the same scripts with `npm.cmd`.

| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc` | **PASS** (exit 0, no diagnostics) |
| Targeted WUI visual/token | `node --test dist/tests/wui_rs_05d_d2_dark_semantic_colour.test.js dist/tests/wui_rs_05d_a_visual_parity.test.js` | **24/24 pass**, 4 suites, 0 fail, 0 skipped |
| Full suite | `npm test` (`node --test dist/tests/*.test.js`) | **685 tests, 114 suites, 685 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo** (baseline 673 + 12 new DS tests) |
| Vite production build | `npx vite build` | **PASS** (built in ~0.5 s) |

**Bundle details:**

- Output: `dist-frontend/assets/index-*.css` (14,637 B) and `index-*.js` (1,493 kB; gzip 189.8 kB). There is a pre-existing warning that a chunk exceeds 500 kB; it is unchanged.
- The emitted CSS contains the new values (e.g. `--color-status-neutral:#8a97a3`).
- The JS bundle has no `node:` imports and no `8788` or `127.0.0.1` references. The only textual match for "node:" is a React-internal object key (`{node:n,offset:…}`).

## 11. Changed files

| File | Change |
|---|---|
| `frontend/src/index.css` | +20 lines: 14 variables plus a comment, inside the existing `.app-shell` token block. Nothing else changed. |
| `tests/wui_rs_05d_a_visual_parity.test.ts` | VP-12 amended within D1 §12, plus a header note |
| `tests/wui_rs_05d_d2_dark_semantic_colour.test.ts` | new, 12 tests |
| `docs/WUI_RS_05D_D2_DARK_SEMANTIC_COLOUR_IMPLEMENTATION.md` | this report |

**Not changed:** components, layout, spacing, typography, navigation, cards, shadows, semantic text, data, API behaviour, `theme.ts`, `tokens/index.ts`, `main.tsx`, `package.json`, `vite.config.ts`, and System B.

## 12. Known limitations

1. **`#E86A60` on `#1E293B` = 4.64:1.** It passes, but has the least headroom. No current consumer renders negative, critical or unavailable text on `surface-2`: badges and cards use `surface-1`, at 5.66:1.
2. **Close greys:**
   - Neutral `#8A97A3` vs AI `#B4C1CD` is 1.63:1.
   - Neutral vs the shell's secondary text `#94A3B8` is 1.16:1.
   - Distinctness therefore also relies on the labels and symbols required by D-9.
   - `AiBadge` has no routed consumer today (05D-B §2), so AI and neutral are not rendered side by side at present.
3. **Replay ambiguity remains open in governance (§6).** The grey treatment is a disclosed interim choice, not an authority ruling.
4. **Value source standing.** `theme.ts` DARK is used as a value source under D1 §2. It has not been elevated to authority; the authority for these values is D1 plus the validation in this report.
5. **Rendering is not observed.** The computed colours and appearance were not seen in a browser. This needs the D3 Windows check.
6. **Executive and latent surfaces.** Executive shows these colours only once data renders. Research UI03, Intelligence and Evidence render them only when given data.

## 13. Windows verification handoff (D3)

Arena performed no Windows or browser observation.

**Run on Windows:**
```
git fetch origin arena/01a0d1d3-iips-production-market-data
git checkout <D2 commit>
npm.cmd ci
npm.cmd run dev:research-sector      (terminal 1; authority on 127.0.0.1:8788)
npm.cmd run dev                      (terminal 2; Vite 5173 with dev /api proxy)
```

**Verify in Edge or Chrome. Record DevTools computed `color` and `border-color` for each item.**

| Surface | Items | Expected computed value |
|---|---|---|
| `/research/sector/Banking` | ✓ CERTIFIED RESULT; □ SNAPSHOT; ! Watch verdict; pillar values (≥60 positive / 40–59 neutral / <40 negative); override badges; selector error (if reproducible) | `rgb(76, 187, 122)`, `rgb(107, 166, 245)`, `rgb(216, 155, 63)`, `rgb(76, 187, 122)` / `rgb(138, 151, 163)` / `rgb(232, 106, 96)`, `rgb(216, 155, 63)`, `rgb(232, 106, 96)` |
| `/research/company/:id` | Certified, Snapshot, verdict, pillars | as above |
| `/security-master` | header ✓ CERTIFIED RESULT | `rgb(76, 187, 122)` |
| `/executive` (data-rendered, if available) | Certified, Snapshot, verdicts, trend, Diversification (positive), top-opportunity border | families as above |
| `/portfolio` (BI-07) | regression | **unchanged** |

**Compare against E2E-018** `sector-intelligence_banking.png` and `executive.png` for **semantic correspondence**: the same hue family per meaning (green / blue / amber / red / grey). This is not pixel parity, because those captures are light-theme and the current shell is dark.

**Record per surface:** PASS or FAIL, computed values, and a screenshot.
