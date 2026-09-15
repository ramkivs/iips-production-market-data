# D84-Q — P14 BROWSER/RESPONSIVE + FUNCTIONAL-PARITY QUALIFICATION INSTRUMENT

**Act ID:** `D84-Q — P14 UI qualification instrument (READ-ONLY)`
**Authority:** **D84-R1 decision A** — qualification only; **no implementation authorization**.
**Baseline commit:** **`f399c07a4a8abb99ab99e351a66bb2a0e9231a46`** (D83), tree clean, local == remote.
**Numbering:** filed as **D84-Q** to avoid colliding with the historical **D84** audit label.
D80–D83 labels unchanged.

> **STATUS — BINDING.** **P14 qualification is INCOMPLETE** until Windows/browser evidence is
> supplied. **P15 UI certification: NONE. No production authorization.** Nothing in this document
> asserts a browser observation.

---

## 0. WHY THIS EXISTS

`PHASE_14_GATE_ACCEPTANCE.md` records, in its own words: `runtimeBrowserTested: false`,
`responsiveTested: false`, *"Runtime browser testing NOT PERFORMED"*, *"Runtime responsive testing
NOT PERFORMED"*, INT-017 screenshot *"REFERENCE ONLY"*. P14 accepted **view-model-agnostic
accessibility metadata** and bounded runtime work out. This is therefore an **acknowledged
outstanding obligation**, not a gate reopening.

The baseline has also changed materially: `WINDOWS_UI_VERIFICATION.md` records **UI08, UI10, UI12
as "NOT PRESENT — no source components"**. All three now exist (D82/D83/D80), plus UI07 (D81).
**The old P14 record must not be reused as the baseline.**

---

## A. P14 QUALIFICATION MATRIX — UI01–UI14

Evidence column: **R** = repo/server evidence (Arena can establish) · **W** = Windows/browser
observation (**only the user can establish**) · **R+W** = both required.

### UI01 — Dashboard · `/executive` · `ExecutiveDashboard.tsx`
- **Requirement:** governed domain aggregation; no invented business logic.
- **Backend:** `/api/executive` (+ `/api/evidence/`, `/api/replay/`). **Source: certified v2.0 CSIP
  over the frozen v1.1 replay baseline — NOT live provider data.**
- **Interaction tests:** T1 sector filter toggle (L151-155) · T2 **movers → Company Workspace** ·
  T3 decision-distribution acts on real results.
- **⚠ REPO-ESTABLISHED FINDING:** the component contains **zero `<Link>`, zero `useNavigate`** and
  exactly **one** interactive control (a sector-filter `<button>`). The section titled
  *"Decision Distribution"* (L137) renders lists (`decision-list`, `risk-list`,
  `top-opportunity`), **not a navigable movers control**.
- **Conditions:** T1 **PASS** only if the filter changes rendered rows (W). **T2 FAIL** — no
  navigation target exists (**R, already determined**). T3 **PARTIAL** — distribution is displayed
  from governed results but is **not actionable**.
- **Parity:** *"movers navigate to real Company Workspace"* → **FAIL (R)**.
  *"score distribution acts on real holdings"* → **PARTIAL (R+W)**.
- **Dependencies:** R-2 (values are baseline-derived, not live).

### UI02 — Company Workspace · `/research/company/:id` · `CompanyIntelligence.tsx`
- **Requirement:** overview, financials, valuation, scorecard, risks, news, notes, evidence.
- **Backend:** `/api/company/:id`, `/api/evidence/`, `/api/replay/`, decision-matrix. Certified
  v2.0-derived.
- **Tests:** T1 route resolves for a governed id · T2 evidence link opens real evidence ·
  T3 replay values render **as REPORTED, NOT VERIFIED** · T4 absent tabs enumerated.
- **Conditions:** **PARTIAL expected** — overview/scorecard/evidence present; **financials,
  valuation, news, notes tabs NOT IMPLEMENTED (R)**. T3 **must PASS** the AD-17 wording check
  (R+W). Promotion to FULL is **prohibited** without the missing tabs.
- **Dependencies:** R-2 (financials/news need provider data) · **AD-17/M-2**.

### UI03 — Portfolio · `/portfolio` · `PortfolioWorkspace.tsx`
- **Requirement:** holdings, allocation, performance, risk, transactions, analytics.
- **Backend:** `/api/portfolio` (+ evidence, replay). Certified v2.0-derived.
- **Conditions:** **PARTIAL** — holdings/allocation present; **transactions and performance
  history NOT IMPLEMENTED (R)**. **Dependencies:** R-2.

### UI04 — Research · `/research` + 5 children · `ResearchHub.tsx`
- **Backend:** `fetchDecisionMatrixData`; children: sector, events, cross-sector,
  `/api/macro` (**MoSPI — the one genuinely live, non-baseline source**).
- **Tests:** T1 hub lists research objects · T2 **research opens an actual research object with
  provenance** · T3 macro shows LIVE freshness and real `retrievedAt`.
- **Conditions:** T2 **PASS** requires a rendered provenance block on the opened object (R+W).
  **PARTIAL overall** — **no research library and no taxonomy (R)**.

### UI05 — Screener · `/screener` (legacy) + `/screener/governed`
- **⚠ TWO SURFACES, QUALIFY SEPARATELY.**
  - `/screener` legacy: composes `fetchDecisionMatrixData` — **certified v2.0-derived, NOT P12**.
  - `/screener/governed`: **genuine C6** via `api/p12Screener` → **`POST /api/screener/execute`**
    and **`POST /api/screener/saved`** (R-confirmed).
- **Tests:** T1 filters/sort execute server-side under C6 · T2 **saved screens persist across a
  restart** (D75) · T3 degraded rows labelled.
- **Conditions:** governed screener **PASS-eligible**; legacy screener **must NOT be counted as
  the C6 surface**. T2 PASS requires re-login/restart persistence (W).
- **Dependencies:** R-2 (universe is baseline-derived).

### UI06 — Decision Center · `/intelligence/decision-matrix`
- **Conditions:** **PARTIAL** — matrix renders; **proposals, approvals and history NOT
  IMPLEMENTED (R)**. Parity *"decisions open governed workflow"* → **FAIL/PARTIAL (R)**: no
  workflow surface exists. `/intelligence/*` falls through to `FeaturePlaceholder` (L82).

### UI07 — Watchlists · `/watchlists` · **D81 — qualify the NEW surface**
- **Backend:** `/api/watchlists` (+ `/items`), journal-persisted, governed rows from the P12
  universe.
- **Tests:** T1 create/delete list · T2 add security by **id only** (values server-resolved) ·
  T3 triggers evaluate deterministically · T4 **baseline-vs-current delta** · T5 persistence
  across restart · T6 unknown security → 404.
- **Conditions:** T1–T3, T5, T6 **PASS-eligible** (46 repo tests). **T4 must be read as
  baseline-vs-current, NOT a time series** — against the frozen baseline **delta = 0 is the
  correct result**, not a failure. Do not classify "no movement" as FAIL.
- **Dependencies:** **R-2** — real score movement requires live data.

### UI08 — Reports · `/reports` · **D82 — qualify the NEW surface**
- **Backend:** `/api/reports`; content from platform `ReportingEngine.build()`; five certified
  templates.
- **⚠ THREE DISTINCT PIT CRITERIA — classify separately (mandated):**
  1. **Stored pinned-vintage byte identity** → **PASS-eligible** (hash-verified on every read; R+W).
  2. **Same-vintage deterministic regeneration** → **PASS-eligible** (engine is pure; R+W).
  3. **Arbitrary historical-as-of regeneration** → **BLOCKED (R-2). MUST NOT be recorded PASS.**
- **Tests:** T1 generate from each template · T2 re-open byte-identical · T3 invented type → 400 ·
  T4 client payload ignored · T5 limitation text rendered.

### UI09 — Alerts · `NotificationDrawer.tsx` (overlay, no route)
- **Backend:** `/api/notifications` + `POST /{id}/read`.
- **R-confirmed:** `notification-deep-link` (L108) and mark-read (L115) exist.
- **Tests:** T1 **alert opens actual alert/evidence via the deep link** · T2 mark-read is
  idempotent and durable.
- **Conditions:** T1 **PASS-eligible (R+W)**. Overall **PARTIAL** — **no rules engine, no event
  model, mark-all-read DEFERRED (R)**. INT-011b requires **P10** (news/events) — **DEFERRED**.

### UI10 — Collaboration · `/collaboration` · **D83 — qualify the NEW surface**
- **Tests:** T1 thread on a governed object · T2 comment · T3 **mention resolves to a tenant
  member; unknown handle → 404** · T4 assignment · T5 activity log · T6 **NS-5 pinned vintage
  shown on thread and every comment** · T7 **vintage-mismatch disclosure** · T8 governed-reference
  integrity (unresolvable → 404).
- **Conditions:** all **PASS-eligible** (49 repo tests). **T6/T7 are the NS-5 criteria and must be
  verified explicitly.** **Do NOT infer object-level ACL or cross-user sharing semantics** — none
  exists by design (M-5 out of scope); sharing is **by reference inside a thread only**.

### UI11 — Administration · `/admin/*` (8 panels)
- **Conditions:** **FULL-eligible**; admin-role only. Provider/admin config only where authorized.

### UI12 — Settings · `/settings` · **D80 — qualify the NEW surface**
- **Tests:** T1 viewer reads own preferences · T2 **viewer cannot save (403)** · T3 analyst saves ·
  T4 persistence across restart · T5 invalid value → 422, not coerced · T6 theme applies.
- **Conditions:** all **PASS-eligible** (31 repo tests).

### UI13 — Global Search · `/search` · `GovernedSearch.tsx`
- **Backend:** **genuine C7** via `api/p12Search` → **`GET /api/search`** and **`GET /api/resolve`**
  (R-confirmed).
- **Conditions:** **PARTIAL** — real C7 resolution, but INT-015a requires search across
  *company, research, holdings, decisions, evidence, alerts, reports*; **only company/security
  identities are searchable (R)**.

### UI14 — Command Palette · Ctrl/Cmd+K · `CommandPalette.tsx`
- **Backend:** `fetchDecisionMatrixData` (certified v2.0-derived).
- **Conditions:** **PARTIAL** — navigation works; **no create/review actions against governed
  domains (R)**.

---

## B. REPO-SIDE EVIDENCE MATRIX (established by Arena at `f399c07`)

| Fact | Evidence |
|---|---|
| Routes for UI01–UI14 exist | `App.tsx` L63-95 (enumerated above) |
| **UI01 has no navigation** | 0 `<Link>` / 0 `useNavigate`; 1 `<button>` (L151-155) |
| UI05 governed screener is real C6 | `p12Screener.ts` → `/api/screener/execute`, `/api/screener/saved` |
| UI13 is real C7 | `p12Search.ts` → `/api/search`, `/api/resolve` |
| UI09 deep link exists | `NotificationDrawer.tsx` L108 |
| UI07/08/10/12 backends exist | `/api/watchlists`, `/api/reports`, `/api/collaboration`, `/api/settings` |
| Test floors | frontend **965/0**, P12 **154/0**, P13 **86/0**, app+server `tsc` clean |
| Replay hardcodes still present | `executive-transport.ts` — 2× `reproduced: true` |
| **No live provider data anywhere** | `/api/macro` is the only non-baseline live source |

**Arena establishes (A) presence in repo and (B) presence on the authoritative branch. It does
NOT establish (C) the commit a local runtime executes.**

---

## C. WINDOWS/BROWSER EXECUTABLE CHECKLIST — copy/paste

### STEP 0 — R-7 ANCHOR (do this FIRST; nothing else counts without it)

```powershell
# Run in the repo directory ON THE WINDOWS MACHINE THAT SERVES THE APP
git rev-parse HEAD
git status --short
git branch --show-current
```
**Record all three verbatim.** **REQUIRED: `git rev-parse HEAD` == `f399c07a4a8abb99ab99e351a66bb2a0e9231a46`**
and `git status --short` empty. If either differs, **STOP** — you are qualifying a different
commit, and every result below would be void.

```powershell
# Prove the BROWSER is serving THAT commit, not a stale build
cd frontend
npm ci
npm run build
npm run dev          # note the port
# In the browser devtools Network tab, hard-reload (Ctrl+F5) and confirm fresh assets (200, not 304/disk cache)
```
**Evidence to capture:** the three git outputs + a screenshot of the running app with devtools
Network showing a hard reload.

### STEP 1 — Authenticated launch
Sign in via Keycloak as **viewer**, then **analyst**, then **admin** (each role separately).
Record: sign-in succeeds; the shell renders; the nav shows **Executive, Portfolio, Research,
Intelligence, Evidence, Administration, Collaboration, Reports, Watchlists, Settings**.
*Admin is expected to appear for admin only.*

### STEP 2 — Route access (all 14)
Visit each and record HTTP/render outcome + a screenshot:
`/executive` · `/research/company/Banking` · `/portfolio` · `/research` · `/screener` **and**
`/screener/governed` · `/intelligence/decision-matrix` · `/watchlists` · `/reports` ·
notifications drawer (bell) · `/admin/overview` · `/settings` · `/search` · Ctrl+K palette ·
`/collaboration`.

### STEP 3 — Required interactions
1. **UI01:** click a sector in Decision Distribution → does the view filter? **Attempt to click a
   mover/company → record whether ANY navigation occurs.** *(Repo predicts: none.)*
2. **UI02:** open a company; confirm evidence link opens real evidence; **read the replay text
   aloud — it must say REPORTED / NOT VERIFIED and must NOT claim verified replay or byte identity.**
3. **UI05 governed:** apply a filter + sort → confirm rows change; **save a screen, restart the
   server, reload → confirm it is still there.**
4. **UI07:** create a list, add `Banking` **by id**, add a trigger, confirm baseline/current/delta
   render; restart → still present.
5. **UI08:** generate each of the 5 templates; re-open one and confirm identical content + hash;
   confirm the **historical-as-of UNAVAILABLE** text is visible.
6. **UI09:** click a notification **deep link** → confirm it opens the real target; mark read.
7. **UI10:** open a thread on `company:Banking`; comment; **mention a real user (expect success)
   and a fake handle (expect rejection)**; assign; confirm **pinned vintage** on thread + comment.
8. **UI12:** as **viewer** attempt save → **expect refusal**; as analyst save → reload → persisted.
9. **UI13:** search a known company → confirm a real result; search nonsense → confirm no
   fabricated row.
10. **UI14:** Ctrl+K → navigate; **attempt a create/review action → record absence.**

### STEP 4 — Responsive (screenshot each)
Widths **1920 · 1440 · 1280 · 1024 · 768 · 480 · 375**. Record per surface: horizontal scroll?
clipped/overlapping content? nav usable? tables readable or scrollable? controls reachable?

### STEP 5 — Accessibility (runtime)
Keyboard-only traversal of every surface (Tab/Shift-Tab/Enter/Esc); visible focus ring; drawers
and palette closable with **Esc** and returning focus; screen-reader announcement of
`role="status"` / `role="alert"` regions; axe DevTools scan per surface — record violations by
severity. Contrast check on badges/disclosures.

### STEP 6 — Screenshot functional parity
For **each** INT-017 reference element: is it present, and **does it act on real governed data**?
Record **PASS only if the interaction works**; *"looks similar"* is **explicitly insufficient**.

### STEP 7 — Evidence capture
For every item: **PASS / FAIL / PARTIAL / BLOCKED / DEFERRED** + screenshot + any console/network
error. For FAIL/PARTIAL add the exact observed behaviour. Save under
`docs/evidence/p14-windows/<date>/`.

---

## D. DEPENDENCY / BLOCKER REGISTER

| Dep | Status | Blocks |
|---|---|---|
| **R-7** | **OPEN** | **Everything runtime.** Only Step 0 closes it. Arena cannot. |
| **R-2** | **OPEN, externally blocked** (no procurement authority — D81-B) | Live values; UI01 movers data; UI02 financials/news; UI07 real score movement; **UI08 historical-as-of**; UI04 research library |
| **M-5 / G3** | **OPEN** | Object-level ACL / cross-user sharing (UI10) — **deliberately not built** |
| **R-5 / C12** | **BLOCKED** (security authority unknown) | Any security certification claim |
| **AD-17 / M-2** | **UNRESOLVED** (gate P15) | Replay values are **REPORTED, NOT VERIFIED** — this wording must survive qualification |
| **P10** | Not wired (0 consumers) | UI09 events/rules; UI04 news |
| **UI01 navigation** | **Absent in repo** | Movers parity criterion |

---

## E. EXACT EVIDENCE REQUIRED TO CLOSE R-7

1. `git rev-parse HEAD` on the **serving** Windows machine == **`f399c07a4a8abb99ab99e351a66bb2a0e9231a46`**.
2. `git status --short` — empty.
3. `git branch --show-current` — `arena/01a0814b-iips-production-market-data`.
4. A screenshot of the **running application** with devtools showing a **hard reload** (fresh
   assets), proving the browser serves that build and not a cached one.

**Until all four exist, R-7 remains OPEN and P14 qualification remains INCOMPLETE.**

---

## F. PRELIMINARY CLASSIFICATION — REPOSITORY EVIDENCE ONLY

**Every runtime aspect below is `UNVERIFIED (R-7)`.** These are repo-establishable determinations only.

| UI | Preliminary | Basis (repo) |
|---|---|---|
| UI01 | **PARTIAL** · movers parity **FAIL** | 0 links / 0 navigate |
| UI02 | **PARTIAL** | financials, valuation, news, notes absent |
| UI03 | **PARTIAL** | transactions, performance absent |
| UI04 | **PARTIAL** | no library, no taxonomy |
| UI05 | **PARTIAL** | governed C6 real; legacy screener is v2.0-derived |
| UI06 | **PARTIAL** | no proposals/approvals/history |
| **UI07** | **PASS-eligible** | D81 — 46 tests |
| **UI08** | **PASS-eligible** (1,2) · **BLOCKED** (3 historical as-of) | D82 — 43 tests |
| UI09 | **PARTIAL** | deep link real; no rules/events |
| **UI10** | **PASS-eligible** | D83 — 49 tests |
| UI11 | **FULL-eligible** | 8 admin panels |
| **UI12** | **PASS-eligible** | D80 — 31 tests |
| UI13 | **PARTIAL** | C7 real; single domain only |
| UI14 | **PARTIAL** | navigation only |

**"PASS-eligible" is NOT a pass.** It means repository evidence supports the criterion and only
Windows observation remains. **No surface is classified FULL/PASS in this document.**

---

## G. FINAL STATUS

| Item | Status |
|---|---|
| **P14 qualification** | **INCOMPLETE — pending Windows/browser evidence (R-7)** |
| **P15 UI certification** | **NONE** |
| P13 | ACCEPTED, **NOT CERTIFIED** · P14 ACCEPTED (bounded) · P16 CERTIFIED/CLOSED |
| P15 | **ACCEPTED — certification NONE** |
| R-2 · R-4 · R-7 | **OPEN** · R-5/C12 **BLOCKED** · M-5 **OPEN** |
| P11 dormant residue | **OPEN-DORMANT** · **AD-17 / M-2 UNRESOLVED** |
| **Production authorization** | **NOT GRANTED** |
| Code modified by this act | **NONE** — read-only |

**No Windows/browser result is claimed anywhere in this record.**


---

### Addendum D98 (2026-09-15) — R-2 Acceptance & Qualification Alignment
Per D97 and D98 Program Adjudications:
- **R-2 Engineering Status:** **CLOSED — IMPLEMENTED / TESTED / READY**.
- **UI Qualification Outcome:** The R-2 Windows UI Acceptance suite (`frontend/src/test/r2-ui-acceptance.test.tsx`) executed with 7/7 PASS.
- **Data Mode Verification:** SNAPSHOT mode is verified deterministic; LIVE mode is verified fail-closed (`LIVE_UNAVAILABLE` with active gate notice) when unentitled.
- **Historical Regeneration:** Confirmed as a downstream data-activation dependency.
