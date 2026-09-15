# D89 — GLOBAL UI12 DATA-MODE PROPAGATION

**Act ID:** `D89 — global UI12 data-mode propagation`
**Authority:** **D88 = A** — account-wide UI12 semantics, bounded **D54 §97 exception**, explicit
**Macro exemption**. Correct-by-addition: **D85, D86 and D88 records are NOT edited.**
**Base:** `3c14914` (D86-Q) · **Browser/runtime qualification: NOT CLAIMED.**

---

## 1. WHAT CHANGED

UI12 "Default data mode" now propagates to **all applicable market-data surfaces**, not Portfolio
alone. A single shared server seam resolves the authenticated principal's persisted preference and
applies one identical contract everywhere.

| Route family | Surface | Status |
|---|---|---|
| `/api/executive` | Executive | **mode-aware** |
| `/api/decision-matrix` | Decision Matrix (+ Research Hub, legacy Screener, Evidence Hub) | **mode-aware** |
| `/api/cross-sector` | Cross-Sector | **mode-aware** |
| `/api/company/:id` | Company / Sector | **mode-aware** |
| `/api/evidence/:id` | Evidence | **mode-aware** |
| `/api/replay/:id` | Replay | **mode-aware** |
| `/api/portfolio` | Portfolio | already mode-aware (D85), unchanged |
| **`/api/macro`** | Macro | **EXEMPT — see §4** |

---

## 2. D54 §97 COMPLIANCE — THE GATE, PROVEN

The exception permits adding mode branches **only** while existing SNAPSHOT behaviour stays
byte-identical. This was proven **before** the remaining routes were wired, and is pinned by test:

> **For all 7 certified computations** — Executive, Portfolio, Decision Matrix, Cross-Sector,
> Company, Evidence, Replay — `JSON.stringify(forMode(name,'SNAPSHOT',fn))` **=== **
> `JSON.stringify(fn())`.

Additionally asserted: SNAPSHOT returns **the certified object itself**, never a rewrapped copy
(`toBe` identity). The seam never reshapes, annotates or re-serialises a certified payload.

**LIVE/PIT are branches that previously had no behaviour**, so no existing certified response is
altered. The exception is therefore used at its narrowest reading.

---

## 3. THE CONTRACT (identical on every surface)

- **SNAPSHOT** → certified computation invoked **UNCHANGED**, returned verbatim. Also the governed
  default when no preference is saved **and** when no owner resolves — so pre-D89 behaviour is
  preserved by default and **no owner is ever invented**.
- **LIVE** → governed `LIVE_UNAVAILABLE`, citing **R-2**. **Never falls back, never substitutes.**
- **PIT** → governed `PIT_UNAVAILABLE`. **No PIT capability was wired** (`p08` imports in
  `frontend/server`: **0**).

Mode is resolved **server-side** via the existing `readPreferences` — settings logic **reused, not
duplicated**. **No client/query/body-supplied mode authority exists** anywhere in the seam.

---

## 4. MACRO EXEMPTION — VISIBLE, NOT SILENT

`/api/macro` is **deliberately not routed** through the seam. WP-MACRO-03 requires
**"LIVE, never SNAPSHOT"** — a source-governance rule, not a preference default. Honouring a
SNAPSHOT preference there would violate the contract.

Pinned by test: the macro dispatch block contains `handleMacroReadRequest` and **does not** contain
`dispatchForPrincipal`; the payload retains `dataSource: 'MoSPI National Statistical Office'` with
`freshness: 'LIVE'`. `frontend/server/macro`, `api/macro.ts` and `MacroContext.tsx`: **0 changes**.

⚠ **Outstanding:** D88 also requires the Macro **UI to disclose** its LIVE-only governance so the
exemption is visible to the user. `MacroContext.tsx` already renders *"freshness LIVE"* and a
source line, but **does not yet state that it is exempt from the UI12 preference**. That
disclosure is **NOT implemented in this act** and remains **OPEN** — recorded rather than
quietly treated as satisfied.

---

## 5. CONSUMER SAFETY (the D86 lesson, generalised)

Every React consumer was treated as unsafe against a degraded payload. Shared helpers were added
rather than nine bespoke checks:

- `src/api/dataMode.ts` — `isDegraded()` narrowing on the `dataAvailable: false` discriminant.
- `src/components/state/DataModeUnavailable.tsx` — renders the server's `reason`, `dependency`
  and `transportSemantics` **verbatim**, reusing the existing `UnavailableState`.

Guards inserted **before any SNAPSHOT-shape dereference** in: `ExecutiveDashboard`,
`CrossSectorIntelligence`, `DecisionMatrix`, `CompanyIntelligence`, `SectorIntelligence` (the last
two guard **all three** of their mode-aware sources). **No zeroed or placeholder values are ever
rendered** — an empty data shell would be a functional pass and a governance failure.

---

## 6. TESTS AND FLOORS

| Suite | Floor | **Observed** |
|---|---|---|
| **D89 tests** | — | **38 / 38** |
| **Frontend full** | ≥995 / 0 | **1033 passed / 0 failed**, 32 skipped |
| **P12** | ≥154 / 0 | **154 / 0** |
| **P13** | ≥86 / 0 | **86 / 0** |
| app / server `tsc` | clean | **clean / clean** |

**Mutation-proof:** replacing the dispatch with a silent SNAPSHOT fallback fails **16 of 38**
tests; restoring passes 38/38. The suite detects the exact defect the contract forbids.

---

## 7. SCOPE AUDIT — 0 CHANGES EACH

`p05`–`p14` · `iips-platform` · prior `docs/` records · **macro (server, api, UI)** ·
replay/AD-17 paths. **Replay hardcodes intact (2).** No provider/R-2 implementation, no PIT
wiring, no certified calculation change, no RBAC/auth change, no gate reopening, **no production
activation**.

**No STOP condition encountered:** SNAPSHOT never differed; no certified contract required change
beyond the added branch; Macro was never forced toward SNAPSHOT.

---

## 8. STATUS

| Item | Status |
|---|---|
| **Phase 1 — 6 frozen route families** | **COMPLETE** |
| **Phase 2 — P12 additive routes** (`/api/screener/execute`, `/api/search`) | **NOT DONE — deferred to a follow-up act** |
| **Phase 3 — Macro disclosure** | **NOT DONE — OPEN** (exemption implemented; UI disclosure outstanding) |
| Consequence of A | A LIVE preference now yields `LIVE_UNAVAILABLE` across the product, and PIT yields `PIT_UNAVAILABLE` everywhere — truthful, and the intended effect until R-2 lands |
| R-2 · R-4 · R-7 | **OPEN** · R-5/C12 **BLOCKED** · M-5 **OPEN** |
| AD-17 / M-2 | **UNRESOLVED** · P14 **INCOMPLETE** · P15 UI certification **NONE** |
| **Production authorization** | **NOT GRANTED** |


---

### Addendum D98 (2026-09-15) — R-2 Status Reconciliation
Per D97 and D98 Program Adjudications:
- **R-2 Engineering Status:** **CLOSED — IMPLEMENTED / TESTED / READY**.
- **Global Data Mode Integration:** The global propagation of SNAPSHOT (deterministic) and LIVE (fail-closed degraded) modes is verified end-to-end with the canonical market data store and TopBar freshness badge.
