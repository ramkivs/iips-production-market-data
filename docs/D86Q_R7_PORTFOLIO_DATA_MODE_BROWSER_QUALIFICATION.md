# D86-Q — R-7 BROWSER QUALIFICATION: PORTFOLIO DATA-MODE PATHS

**Act ID:** `D86-Q — Windows browser qualification result, D85/D86 data-mode paths`
**Convention:** follows **D84-Q** (`docs/D84Q_P14_UI_QUALIFICATION_INSTRUMENT.md`) and the
`WINDOWS_UI_VERIFICATION.md` evidence pattern.
**Qualified commit:** **`8e6ef2964392d085203e9b14fc85a7c4416796a0`** (D86).
**Type:** Qualification **result record**, by addition. Not acceptance, not certification,
not production activation.

> **SCOPE — BINDING.** This records a **bounded** browser qualification of the **D85 Portfolio
> data-mode propagation paths only**. It does **NOT** complete P14, does **NOT** close R-7
> globally, and asserts **NO P15 UI certification** and **NO production authorization**.

---

## 1. RESULT — AS ATTESTED BY THE OPERATOR

Qualification was executed on the Windows machine serving the application. Arena cannot execute
a Windows/browser runtime; the results below are **operator-attested** and recorded as supplied.

| Path | Result | Detail |
|---|---|---|
| **SNAPSHOT** | **PASS** | Certified v2.0 over the frozen v1.1 Replay Baseline rendered. |
| **LIVE** | **PASS** | Governed **`LIVE_UNAVAILABLE`** rendered. **No SNAPSHOT fallback, no fabricated, substituted or placeholder data.** **R-2 dependency disclosed.** |
| **PIT** | **PASS** | Governed **`PIT_UNAVAILABLE`** rendered. **No SNAPSHOT fallback, no fabricated, substituted or placeholder data.** PIT dependency disclosed. |
| **D85 blank-page / `PortfolioWorkspace` crash** | **CLOSED by D86** | The `portfolio.holdings` dereference on a degraded response no longer occurs. |

**Browser/runtime qualification: PASS for these D85 mode-propagation paths.**

---

## 2. WHAT THIS CONFIRMS

The D86 defect analysis is confirmed in a real runtime, not only by source inspection:

- The **D85 server contract behaves as specified in a browser** — LIVE and PIT return governed
  degraded states and **never** silently serve baseline data.
- The **D86 client guard works** — `isPortfolioUnavailable(data)` narrows before any
  SNAPSHOT-only dereference, so the governed state renders instead of throwing.
- **SNAPSHOT is unaffected**, confirming D85/D86 preserved the certified path.
- **The disclosure survives to the screen.** The R-2 dependency is visible to the user, which was
  the entire point of D85: converting a silent no-op into an explicit governed statement. Had the
  surface rendered an empty portfolio shell, this would have been a functional pass and a
  governance failure.

---

## 3. ⚠ TWO LIMITATIONS RECORDED, NOT GLOSSED

**(a) The qualified commit differs from the D84-Q anchor.**
`D84Q` §E names **`f399c07…`** as the R-7 anchor. This qualification ran against
**`8e6ef296…`** (D86), a **descendant** of `f399c07` that additionally contains D85
(`3a7f794`) and D86 (`8e6ef296`). That is **correct and necessary** — the D85/D86 paths do not
exist at `f399c07` and could not have been qualified there. The D84-Q anchor is **not amended**;
this record supersedes it **for these paths only**.

**(b) Evidence artefacts are attested, not archived.**
`D84Q` §C Step 7 specifies capture under `docs/evidence/p14-windows/<date>/` (git output,
screenshots, console/network). **No such artefacts are present in the repository.** This record
therefore documents an **operator attestation**, not an Arena-verified artefact set. Arena
established (A) presence in repo and (B) presence on the authoritative branch; **(C) the commit a
local runtime executes remains operator-attested**. If artefact-grade evidence is required, the
screenshots and `git rev-parse HEAD` output should be committed under that path in a later act.

---

## 4. R-7 AND P14 STATUS — PARTIAL, NOT CLOSED

| Item | Status |
|---|---|
| **R-7 — Portfolio data-mode paths (SNAPSHOT/LIVE/PIT)** | **SATISFIED (attested)** at `8e6ef296` |
| **R-7 — globally** | **OPEN** — UI01–UI14 route access, interactions, viewport/responsive, accessibility and screenshot-parity checks in `D84Q` §C Steps 1–6 are **not** covered by this act |
| **P14 qualification** | **INCOMPLETE** |
| **UI03 Portfolio overall** | **PARTIAL, unchanged** — `D84Q` records transactions and performance history as NOT IMPLEMENTED; this act qualifies the **data-mode paths only** and does **not** promote UI03 |
| **UI01 movers-navigation** | **FAIL, unchanged** (repo-side finding, `D84Q` §A/§F) |
| **P15 UI certification** | **NONE** |
| **Production authorization** | **NOT GRANTED** |

---

## 5. PRESERVED — VERIFIED AT `8e6ef296`

- **D85 server contract UNCHANGED** — `portfolio-data-mode.ts` and `executive-transport.ts`
  untouched by D86 (0 changes).
- **D86 is client-only** — 3 files: `api/portfolio.ts`, `PortfolioWorkspace.tsx`, and its test.
- **No provider / R-2 implementation. No PIT wiring** (`p08` has zero transport imports).
- **No replay / AD-17 / M-2 changes** — both `reproduced: true` hardcodes intact;
  AD-17/M-2 remain **UNRESOLVED**.
- **No gate reopened. No re-certification. No production activation.**
- **Historical D85 and D86 records are NOT altered** — this is correction/extension **by
  addition**, per the standing convention.

---

## 6. STATUS

| Item | Status |
|---|---|
| D85 Portfolio data-mode propagation | **COMPLETE + browser-qualified (bounded, attested)** |
| D86 consumer fix | **COMPLETE + browser-qualified (bounded, attested)** |
| Original blank-page crash | **CLOSED** |
| R-2 | **OPEN — externally blocked**; now explicitly disclosed to the user in the browser |
| PIT capability | Exists in `p08`; **NOT wired** — deliberate |
| R-7 | **PARTIAL** (these paths only) · **R-4 OPEN** · R-5/C12 **BLOCKED** · M-5 **OPEN** |
| P14 | **INCOMPLETE** · P15 UI certification **NONE** · P16 **CERTIFIED / CLOSED** |
| **Production authorization** | **NOT GRANTED** |
| Next free D-number | **D87** |
