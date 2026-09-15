# D85 — UI12 → PORTFOLIO DATA-MODE PROPAGATION

**Act ID:** `D85 — UI12 → Portfolio data-mode propagation`
**Authorization:** **ACCEPT**, bounded **A–E** scope.
**Implementation status:** **COMPLETE.**
**Browser/runtime qualification:** **NOT CLAIMED.**
**Type:** Bounded correction of a truthfulness defect at the `/api/portfolio` boundary.
Not acceptance, not certification, not production activation.
**Branch:** `arena/01a0814b-iips-production-market-data`
**HEAD at time of record:** **`33b46105b154877da1e7ac9ef96f27232fa1d904`** (D84-Q)
**Remote HEAD:** **`33b46105b154877da1e7ac9ef96f27232fa1d904`** — identical.

> **⚠ DURABILITY.** The implementation described here is **UNCOMMITTED AND UNPUSHED** at the time
> of writing. This record documents work present in the sandbox working tree only. It becomes
> durable únicamente when a separate commit/push authority is exercised.

---

## 1. THE DEFECT CORRECTED

UI12 (D80) persists `defaultDataMode = LIVE | SNAPSHOT | PIT` through the authenticated
`/api/settings` boundary, and `GET /api/settings` returns the principal's effective preference.

**`/api/portfolio` never read it.** `computeCertifiedPortfolio()` takes **no arguments** and always
computes from `PROGRAM_v1.1_REPLAY_BASELINE.json` through the fixed deterministic certified
runtime, labelling the result `freshness: 'SNAPSHOT'` (`executive-transport.ts`:351-352). The
route handler referenced settings **zero times**.

**Consequence:** selecting LIVE produced no change. The user received frozen baseline data with no
indication their request had not been honoured.

**This is a TRUTHFULNESS defect, not a missing feature** — the same class as L-3 (hardcoded values
attributed to a runtime service) and the "embedded in UI01" surface claims. The correction
converts a **silent no-op** into an **explicit governed statement**.

---

## 2. CONTRACT AS IMPLEMENTED (A–E)

| Mode | Behaviour |
|---|---|
| **SNAPSHOT** | The **existing certified baseline computation and provenance are preserved**. `computeCertifiedPortfolio()` is invoked **unchanged**. **The only mode that returns Portfolio data.** Also the governed default for any principal who has never saved a preference — so prior behaviour is exactly preserved. |
| **LIVE** | Governed **`LIVE_UNAVAILABLE`** degraded state citing an **explicit R-2 dependency**. **NO fallback to SNAPSHOT. NO substituted or fabricated provider data.** |
| **PIT** | Governed **`PIT_UNAVAILABLE`** degraded state, **because PIT capability is not wired to transport**. `p08/src/pitStorageModel.js` exports `PIT_CAPABILITY` and `createPitStore()` but has **zero transport consumers**; **p08 was NOT wired** (D85 §3). |

**Mode resolution:** read from the **authenticated principal's persisted UI12 preference** via the
**existing `readPreferences` seam** in `settings-service.ts`. Settings logic is **reused, never
duplicated**. **No client-supplied mode parameter is accepted** — the resolver's signature is
`(tenantId, ownerUserId, store?)`, with tenant and owner both server-derived from the principal.

**Authentication, authorization, tenant and owner boundaries are UNCHANGED** — the existing
`authorizeRead` → `resolvePrincipalTenant` / `resolvePrincipalOwner` path is reused as-is. No new
RBAC model, no new executor, `readSurfaceFor` not extended.

---

## 3. FILES CHANGED (3)

| File | Change |
|---|---|
| `frontend/server/portfolio/portfolio-data-mode.ts` | **NEW** — 115 lines: mode resolution + degraded-response builder |
| `frontend/server/portfolio/portfolio-data-mode.test.ts` | **NEW** — 216 lines, 24 tests |
| `frontend/server/executive-transport.ts` | **+12 / −1** — the single `/api/portfolio` dispatch seam |

**The entire application-source change is one dispatch line plus explanatory comments.**

---

## 4. PROOF — SNAPSHOT BEHAVIOUR PRESERVED

- The complete transport diff touches **only** the dispatch line. **`computeCertifiedPortfolio`,
  its holdings derivation and its provenance are untouched.**
- Tests assert **object identity** (`expect(out).toBe(SNAPSHOT_PAYLOAD)`) — the payload is passed
  through, not rebuilt.
- The certified computation is invoked **exactly once** for SNAPSHOT.
- `provenance.freshness === 'SNAPSHOT'` and the `frozen v1.1 Replay Baseline inputs` dataSource are
  preserved.
- A principal with no saved preference resolves to **SNAPSHOT**.

## 5. PROOF — LIVE/PIT CANNOT SILENTLY FALL BACK

- **`computeSnapshot()` appears exactly once in the module**, at `portfolio-data-mode.ts`:113,
  guarded by `if (mode === 'SNAPSHOT')`. **There is no second call site, so no fallback path
  exists in source.**
- Tests assert `computeCalls === 0` for both LIVE and PIT.
- The degraded payload carries `dataAvailable: false`, `holdings: []`, and
  `provenance.freshness: 'UNAVAILABLE'` — **never `SNAPSHOT`**.
- No baseline values (`Banking`, `BUY`, `0.25`) appear in the degraded payload.
- `transportSemantics` states plainly that the request is **"NOT silently served from the frozen
  v1.1 Replay Baseline, and no provider value is substituted or fabricated."**

> **Test-design note, recorded for honesty.** An initial assertion required the LIVE payload not to
> contain the string *"Replay Baseline"*. It **failed** — because the disclosure sentence
> legitimately **names** the baseline in order to state it was **not** used. **The test was
> corrected, not the product**: it now asserts the absence of baseline **data** plus the presence
> of the explicit negation. Banning the phrase would have forbidden the very disclosure that makes
> clause B honest.

---

## 6. TESTS AND FLOORS — FRESHLY OBSERVED

| Suite | Floor | **Observed** |
|---|---|---|
| **D85 tests** | — | **24 / 24 PASS** |
| **Frontend full** | ≥965 / 0 | **989 passed / 0 failed**, 32 skipped (70 files) |
| **P12 full** | ≥154 / 0 | **154 pass / 0 fail** |
| **P13 full** | ≥86 / 0 | **86 pass / 0 fail** |
| App `tsc --noEmit` | clean | **clean, exit 0** |
| Server `tsc --noEmit -p tsconfig.server.json` | clean | **clean, exit 0** |

Frontend **965 → 989** (+24). Coverage spans all seven D85 §7 criteria: SNAPSHOT returns existing
data · LIVE `LIVE_UNAVAILABLE` with no substitution · PIT `PIT_UNAVAILABLE` with no substitution ·
mode from the persisted preference (including **across a restart**, read from the journal) ·
tenant isolation · owner scoping · no client-supplied mode path.

---

## 7. SCOPE AUDIT — 0 CHANGES EACH

`p05` · `p06` · `p07` · `p08` · `p09` · `p10` · `p11` · `p12` · `p13` · `p14` · `iips-platform` ·
`docs/` (prior records) · **`PersistenceService`** · **`settings-service.ts`** · **P12/P13
certified contracts** · **replay / AD-17 paths** (`ReplayService.ts`, `p12-transport.ts`,
`components/evidence`, `features/replay`).

**Replay hardcodes intact** — both `reproduced: true` sites still present in
`executive-transport.ts`. **AD-17 / M-2 untouched and UNRESOLVED.**

**Not done:** R-2 provider ingestion · credentials · p08 PIT wiring · RBAC/executor change ·
gate reopening or re-certification · production activation.

---

## 8. STOP CONDITIONS

**NONE ENCOUNTERED.** No step required R-2 ingestion, M-5/G3 changes, certified-contract
modification, or scope expansion.

---

## 9. STATUS

| Item | Status |
|---|---|
| **D85 implementation** | **COMPLETE** (uncommitted/unpushed at time of record) |
| **Browser/runtime qualification** | **NOT CLAIMED** |
| **R-2** | **OPEN — externally blocked**; now **explicitly surfaced** to the user rather than silently masked |
| **PIT capability** | Exists in p08; **NOT wired to transport** — deliberate |
| P14 qualification | **INCOMPLETE** (R-7 pending Windows evidence) · P15 UI certification **NONE** |
| R-4 · R-7 | **OPEN** · R-5/C12 **BLOCKED** · M-5 **OPEN** |
| P11 dormant residue | **OPEN-DORMANT** · **AD-17 / M-2 UNRESOLVED** |
| P13 | ACCEPTED, NOT CERTIFIED · P15 **ACCEPTED — certification NONE** · P16 **CERTIFIED / CLOSED** |
| **Production authorization** | **NOT GRANTED** |
| Next free D-number | **D86** |
