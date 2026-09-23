# BI-08 → MASTER IIPS INTEGRATION FINAL RECONCILIATION

**Gate:** Read-only reconciliation (authority: RAMKI message of 2026-09-23)
**Branch:** `arena/01a0c960-iips-production-market-data` · **Base:** `aef26c6254179d32f89a5329b51aecbbaa7b383a`
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
**NO implementation performed. NO source/test/config/navigation/route changes.**

---

## 0. SESSION-INTEGRITY NOTE (recorded before analysis)

The sandbox had been **silently re-cloned** between sessions (third documented occurrence):
HEAD resolved to `94f519b` (main), the session lineage was locally absent, `dist/` was
missing (`npm test` → 0/0), and the worktree showed 27 dirty/untracked entries. **Not data
loss.** The documented recovery was executed verbatim: full-refspec fetch (+`--unshallow`)
→ byte-comparison of worktree files against `aef26c6` blobs (all identical; zero files
missing) → **mixed** reset to `aef26c6` → `npm ci` → `npm run build:tsc`. Baseline
re-verified BEFORE analysis: **501/501 tests · 77 suites · 0 failures · LOCAL == REMOTE ·
CLEAN · main = `94f519bf`.** No panic-commit was made; no history was rewritten.

## 1. ORIGINAL OBJECTIVE (Q1 — from authoritative evidence, not the recent inventory)

Source: `docs/FULL_IIPS_BI08_CONVERGENCE_PLAN.md`
(`PLAN-IIPS-FULLAPP-BI08-CONVERGENCE-2026-09-22`), the governed plan that defined the work:

> Convergence to ONE IIPS application, explicitly NOT "copy 97 .tsx files onto main":
> 1. **Port the shell** (genuinely portable, presentation-only);
> 2. **Port the presentation kit** (11 of 15 base components API-pure);
> 3. **Mount BI Portfolio into the shell — additive, zero BI risk;**
> 4. Re-source each remaining surface individually — **deferred and gated** (this became
>    the optional Phases 1C/2/3/4, never part of BI-08 integration itself).

- **Required integration surface:** exactly ONE — the BI-08 PortfolioWorkspace at `/portfolio`
  inside the recovered Master IIPS shell.
- **Required boundaries:** BI-08 authoritative and untouched (tree frozen `8491efdc`); no
  `frontend/server/**`; no OIDC/Keycloak/`useAuth`; no `/api` proxy; no providers/sockets/
  credentials; D114 untouched; G-034 not executed; production fail-closed.
- **Explicit exclusions:** historical API-coupled surfaces (33/34 server-coupled), the
  server/live tier, `798bc548` recovery, provider activation. Later surface expansion,
  D115, and Dhan Level-1 were never BI-08 criteria (see §10).

## 2. ORIGINAL ACCEPTANCE CRITERIA (plan §19, verbatim)

- **Per phase:** full suite green · tsc PASS · vite PASS · worktree clean · local == remote ·
  0 providers/sockets/credentials · BI-08 AC-01..08 green · `src/identity/**`, `src/d114/**`,
  `tests/**` unmodified unless declared.
- **Final convergence:** one app, one build, one test command; full governed navigation;
  Portfolio authoritative for BI; all 14 BI-08 invariants; D05 SHA-256 unchanged; AIIL/AGI
  resolution intact; production fail-closed; **Windows target-screen parity + 82+66=148**;
  no `frontend/server/**`, no OIDC, no `/api` proxy; D114 untouched; G-034 not executed.

## 3. MASTER IIPS TARGET (Q2)

The **full-IIPS application shell** — `AppShell` (TopBar + Sidebar + outlet), governed
`navigation.ts` with the honest `implemented|partial|future` status contract, `routes.ts`,
`SessionContext` (inert by design), and the presentation kit — recovered from the pinned
full-IIPS donor baseline (Phase 1A). The target integration point: the router outlet at
`/portfolio`. Pre-existing Master functionality BI-08 was to coexist with: the shell chrome,
governed navigation, and honestly-badged placeholder surfaces. **None of the later-discovered
historical features (search, admin, overlays, decision matrix, etc.) were dependencies of
this integration.**

## 4. BI-08 COMPONENT LINEAGE (Q3)

`94f519bf` = **merge of PR #1** (`arena/01a0b8e8` → main; parents `eae2ff6` + `005f732`),
bringing the completed BI-07/BI-08 implementation lineage (incl. `e8a4fae` BI-07 host
integration) into main. Verified intact today: `frontend/src/features/portfolio` tree hash
**`8491efdc` UNCHANGED**; PortfolioWorkspace + store + adapters + broker-import contracts +
Dhan statement parsing all present; historical (API-coupled) PortfolioWorkspace **never
imported**.

## 5. INTEGRATION POINT (Q4)

`144e8ed` — **Phase 1B: mount full-IIPS shell with BI-08 PortfolioWorkspace at `/portfolio`.**
Mount chain: `main.tsx → BrowserRouter → SessionProvider → App → AppShell → /portfolio →
CURRENT BI-08 PortfolioWorkspace`. 5 files changed (`main.tsx`, `App.tsx`, `index.css`
append-only, `vite.config.ts` dev-only, +18-assertion mount test). Verified exclusions
(minified bundle): `applyTheme` 0, `AuthProvider` 0, keycloak 0, oidc 0, `authFetch` 0,
`/api/` 0. **"BI-08 exists in repository" ≠ "BI-08 is integrated" — the integration is the
Phase-1B mount, and it is real:** `DEFAULT_SURFACE_ROUTE = ROUTES.portfolio`, the shell wraps
the workspace, no duplicate competing shell exists, no detached BI-08 app remains.

## 6. ACCEPTANCE EVIDENCE (Q5 — reconciled, with provenance classification)

| Evidence | Class | Result |
| --- | --- | --- |
| Phase-1B Arena technical (at `144e8ed`) | **Arena-reproduced** | 392/392 tests · 61 suites · tsc PASS · vite PASS |
| Phase-1B shell integration tests | Arena-reproduced | 18 mount assertions green (now grown with phase additions) |
| BI-08 implementation Windows technical — **W01** Zerodha first import (82, SAVED_NEW_BATCH) | **Operator evidence** (`G:\IIPS-BI07-Windows-Host-Verify`, baseline `d1a813c`) | PASS |
| **W02** exact duplicate re-import | Operator evidence | PASS — `ALREADY_IMPORTED_NO_OP`; market-value Δ 0.00; holdings Δ 0; quantity Δ 0; provenance digest INVARIANT (AC-01) |
| **W03** distinct Dhan Web-UI summary CSV | Operator evidence | PASS — `MERGED_INTO_EXISTING`; 66 incoming → **148 consolidated**; ₹982,769.63; weights 100.0000%; ledger 2 |
| **W04** final visual acceptance | Operator evidence | PASS — 148 constituents; ₹982,769.63; 100.0000%; COMMITTED (Atomic) |
| **AIIL** mapping (BSE `543989` current / `539177` historical → `EQ_AIIL_IN`) | Operator evidence + **Arena-coded** (`e2e` Phase 5) | PASS both |
| **AGI GREENPAC** exact-alias mapping (→ `EQ_AGI_IN`, no fuzzy) | Operator evidence + Arena-coded (`e2e` Phase 2C/6) | PASS both |
| **Unresolved retention** (fail-closed handling) | Operator evidence + Arena-coded | PASS both |
| Phase-1B **Windows visual acceptance** (12 claims: target shell, governance chrome, portfolio route, BI-08 workspace, W01–W04, AIIL, AGI, unresolved retention, honest Future badges) | **Operator evidence** (deposit `ce7062a`) | **ACCEPTED** |
| Evidence intake gate | Arena forensic | `2714ffa` BLOCKED → `ce7062a` deposit → **`4096276` ACCEPTED** (see §7) |

**Windows evidence is operator evidence.** Arena did not and cannot independently reproduce
the Windows host observations; Arena verified the artifacts forensically (byte-exact
git-head match to `144e8ed`; clean git-status; internally consistent claims) and reproduced
the technical suite independently. This classification is recorded, not elided.

**Recorded discrepancy (R-1), root-caused and closed:** the operator's E-3 claimed 360/360 ·
54 suites; Arena measured 392/392 · 61 on the identical tree. Root cause: **stale
precompiled `dist/`** (the `npm test` script does not rebuild; `dist/` is gitignored and
survives checkout). Reproduced by Arena on a detached `1eb9c84` worktree (exactly 360/54).
The operator's technical numbers were **rejected as stale and superseded**; visual
observations were unaffected (Vite serves from source, never `dist/tests`). Materiality:
NOT an implementation defect, NOT a visual-acceptance defect.

## 7. EXACT ACCEPTED INTEGRATION CHECKPOINT (Q6)

> **Implementation baseline: `144e8edf8d126a129ba4ed87dbd077765bd4051c`**
> **Evidence transport: `ce7062aaf98793406926afd4ddc59758e51a9f19`** (evidence-only; source
> tree byte-identical to `144e8ed`)
> **ACCEPTANCE CLOSURE: `409627608ae5df0a1eb1951a64edc58a49f6df6b`** —
> `GATE-WINDOWS-PHASE-1B-VISUAL-EVIDENCE-INTAKE = ACCEPTED (with recorded discrepancy)`
> **Branch:** `arena/01a0c960-iips-production-market-data` — all four lineage commits
> (`f13002e`, `144e8ed`, `ce7062a`, `4096276`) verified **pushed** (ancestors of `aef26c6`
> on origin). LOCAL == REMOTE ✓ · worktree CLEAN ✓.

**`94f519bf` is NOT the final answer** — it is the *repo-level* integration of the BI-08
implementation lineage into main (PR #1), and it **preceded** the shell work: the Master
IIPS shell did not exist in main; it was recovered in Phase 1A (`f13002e`) and BI-08 was
mounted in Phase 1B. The accepted integration state is therefore `144e8ed` (implementation)
sealed by `4096276` (acceptance). No history was rewritten, reset, cherry-picked, or
force-pushed.

**Structural observation (recorded, not counted against completion):** the accepted
integration state lives on the pushed arena branch; `main` remains at `94f519b` and has not
received the shell recovery + mounting via PR. The original per-phase criteria required
commit+push (satisfied). A main merge via normal GitHub PR is a **separate disposition**
explicitly anticipated by the standing constraints; per those constraints Arena neither
treats the unmerged branch as diminishing the accepted integration nor calls the
application "merged" to main.

## 8. CURRENT VERIFICATION (Q8 — nothing modified)

| Check | Result |
| --- | --- |
| Full suite (fresh rebuild after re-clone recovery) | **501/501 · 77 suites · 0 failures** |
| BI-08 functional suites (bi03/bi04/bi05/bi07×4/bi08/e2e/p04/shell_mount) | **163/163 · 12 suites · 0 failures** |
| `/portfolio` route + `DEFAULT_SURFACE_ROUTE` | ✓ mounted; shell wraps workspace |
| `frontend/src/features/portfolio` tree | ✓ frozen `8491efdc` |
| Frozen trees identity/D114/ui | ✓ `9080e997` / `0062ad52` / `1597ed06` |
| D05 broad-universe data | ✓ unchanged since deposit (`407d9c7`, single commit in history) |
| Duplicate/no-op behaviour (W02 coded equivalent) | ✓ `bi07_repeat_import_lifecycle` + `bi08_idempotent_ingress` green |
| Dhan statement workflow (fixture-level parsing/merge) | ✓ `e2e` Phase 2C green |
| AIIL / AGI / unresolved handling | ✓ `e2e` Phases 5/6 green |
| Minified bundle boundary audit | ✓ `authFetch`/`oidc`/`keycloak`/`/api/`/`frontend/server`/`XMLHttpRequest`/`EventSource`/`Bearer` ALL absent; single `fetch(` = Vite polyfill; PortfolioWorkspace + BI-07 host marker present |

## 9. POST-INTEGRATION WORK CLASSIFICATION (Q7 — every post-`94f519b` commit)

| Commits | Work | Class |
| --- | --- | --- |
| `d8f1fb2`, `a34b6c4`, `2561dd2`, `1eb9c84` | baseline forensic, convergence plan, authorization prep | **D** (forensic/planning; preparatory to A) |
| `f13002e` | Phase 1A shell recovery | **A — required for integration** |
| `144e8ed` | Phase 1B BI-08 mounting | **A — required for integration** |
| `2714ffa`, `ce7062a`, `4096276` | Windows visual acceptance deposit + intake | **B — acceptance/evidence hardening** |
| `881371e`, `848d8f9`, `a647213`, `bc3fb80` | Phase 1C Intelligence | **C — optional surface convergence** |
| `1026a76`, `8dfd8ec`, `f9101be` | Phase 2 Evidence | **C** |
| `5ef8960`, `c7faf1f` | Phase 3 Executive | **C** |
| `bc6d8ae`, `f755575`, `ad2205a` | Phase 4 Research/UI03 | **C** |
| `aef26c6` | historical/current convergence inventory | **D — historical forensic/reconciliation** |
| — | D115 | **no work ever performed — deferred throughout** |
| — | Dhan Level-1 provider | **no work ever performed — deferred throughout** |

**No post-`94f519b` work is unfinished BI-08 integration.** Phases 1C–4 and the inventory
were separately authority-gated product-convergence and forensic work, each with its own
durability checkpoints, and each preserved the BI-08 integration state (frozen tree
re-verified every phase).

## 10. D115 / DHAN SEPARATION (Q9)

- **D115** = DEFERRED (WITHHELD / UNRESOLVED / NOT AUTHORIZED). Not now and not ever part
  of the BI-08 acceptance criteria — the criteria *prohibit* the identity/credential
  territory D115 governs (0 credentials, fail-closed, G-034 not executed). No D115 work
  was performed, reopened, or implied by this reconciliation.
- **Dhan Level-1** (production provider activation) = DEFERRED pending credentials,
  entitlement, environment and provider prerequisites. **Distinct from W03:** the W03 Dhan
  evidence is BI-08 *fixture-level statement CSV parsing and merge* — offline, governed,
  no provider, no credentials — and is fully satisfied. Missing production Dhan
  credentials are NOT a failure of the original integration.

## 11. HISTORICAL SCREENSHOT SEPARATION (Q10)

The operator-supplied historical screenshots (and the certified E2E-018 captures) are
**HISTORICAL PRODUCT REFERENCE** evidence only. They were never acceptance criteria for
BI-08 integration — the sole screen-parity criterion was the Phase-1B Windows visual
acceptance (12 claims, accepted at `4096276`).
`IIPS-HISTORICAL-CURRENT-CONVERGENCE-INVENTORY.md` is **preserved unmodified** (byte-verified
identical to `aef26c6` during recovery). It does not redefine BI-08 success criteria. No
factual correction was required by this reconciliation.

## 12. FINAL DETERMINATION (Q11)

> # **A — BI-08 → MASTER IIPS INTEGRATION COMPLETE**

Every original acceptance criterion (§2) is satisfied with evidence (§6, §8): one app, one
build, one test command; full governed navigation; Portfolio authoritative for BI (frozen,
never replaced); BI-08 invariants green; D05 unchanged; AIIL/AGI intact; production
fail-closed (bundle-verified); Windows target-screen parity + 82+66=148 (operator evidence,
forensically verified and accepted at `4096276`); no server/OIDC/api; D114 untouched; G-034
not executed. No item explicitly required by the original objective is missing. **This gate
now STOPS.** Per the authority instruction, no next workstream is automatically opened;
the next workstream will be separately selected.

---

## BI-08 INTEGRATION STATUS CARD

```
OBJECTIVE                   = Integrate completed BI-08 portfolio functionality into the
                             existing Master IIPS platform — SATISFIED (plan §1/§15)
STATUS                      = COMPLETE (classification A)
ACCEPTED COMMIT             = implementation 144e8edf8d126a129ba4ed87dbd077765bd4051c;
                             acceptance closure 409627608ae5df0a1eb1951a64edc58a49f6df6b
                             (repo-level BI-08→main integration earlier: 94f519bf, PR #1)
MASTER IIPS                 = full-IIPS shell recovered (f13002e) and mounted (144e8ed);
                             honest governed navigation; production fail-closed
BI-08                       = INTACT — authoritative; tree frozen 8491efdc;
                             163/163 functional tests green; never replaced
WINDOWS ACCEPTANCE          = OPERATOR EVIDENCE (not Arena-reproduced): W01 82 · W02 no-op
                             Δ0/digest INVARIANT · W03 66→148 ₹982,769.63 · W04 148 ·
                             Phase-1B visual 12/12 claims — accepted at 4096276;
                             R-1 stale-dist discrepancy root-caused and superseded
ARENA ACCEPTANCE            = 501/501 tests · 77 suites · tsc PASS · vite PASS (current);
                             392/392 · 61 at the integration baseline
LOCAL == REMOTE             = YES (aef26c6, verified after re-clone recovery)
WORKTREE                    = CLEAN
D115                        = DEFERRED — WITHHELD / UNRESOLVED / NOT AUTHORIZED
DHAN                        = Level-1 production provider DEFERRED (W03 fixture-level Dhan
                             CSV import is BI-08 scope and PASSES; provider activation
                             was never BI-08 scope)
HISTORICAL SURFACE
EXPANSION                   = post-integration class C/D work (Phases 1C/2/3/4 + inventory);
                             preserved; NOT unfinished BI-08 integration
```

**Standing disclosure:** D115 = DEFERRED / WITHHELD / NOT AUTHORIZED · Dhan Level-1 =
DEFERRED · `productionEligible` = false · external live sockets = 0 · G-034 not executed ·
D91/D88 macro standing unchanged · Windows visual acceptance never claimed as
Arena-reproduced · no implementation authorized or performed by this reconciliation.

**End of reconciliation — classification A — gate STOPPED.**
