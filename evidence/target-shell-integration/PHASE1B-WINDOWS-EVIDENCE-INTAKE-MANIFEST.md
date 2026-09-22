# Institutional Investment Platform System (IIPS)
## Formal Gate Report: `GATE-WINDOWS-PHASE-1B-VISUAL-EVIDENCE-INTAKE`

**Gate Identifier:** `GATE-WINDOWS-PHASE-1B-VISUAL-EVIDENCE-INTAKE`
**Gate Disposition:** **ACCEPTED WITH RECORDED DISCREPANCY**
**Implementation Baseline Under Acceptance:** `144e8edf8d126a129ba4ed87dbd077765bd4051c`
**Evidence Transport Commit:** `ce7062aaf98793406926afd4ddc59758e51a9f19`
**Windows Checkout (operator-side, NOT Arena-accessible):** `G:\IIPS-BI07-Windows-Host-Verify`
**Evaluation Mode:** `NON_PRODUCTION / OFFLINE_FIXTURE`
**Date:** 2026-09-22
**Supersedes:** `PHASE1B-WINDOWS-EVIDENCE-INTAKE-BLOCKED-REPORT.md` (checkpoint `2714ffa`)

---

### 1. Executive Summary

The Windows operator has transported the Phase-1B visual-acceptance package to the Arena
branch in commit `ce7062a`. All three required artifacts are now physically present and were
inspected verbatim. The previous BLOCKED disposition is **resolved**.

The gate is **ACCEPTED** for the **visual acceptance** it attests, with **one material
discrepancy recorded and root-caused** (§5): the operator's *technical validation* block
reports `360/360 tests / 54 suites`, which is **not** the figure produced by commit
`144e8edf`. That commit empirically yields `392/392 tests / 61 suites`.

The discrepancy was **reproduced and explained**: `360/360 / 54 suites` is the exact
signature of checkpoint `1eb9c84` — the **pre-Phase-1A** state. The repository's `npm test`
script executes **pre-compiled** output (`node --test dist/tests/*.test.js`) and `dist/` is
gitignored, so it survives a `git checkout` unchanged. The operator therefore ran a **stale
`dist/`** built before Phase 1A, not the tree of `144e8edf`.

**This is a measurement-procedure defect on the Windows host, not an implementation defect
and not a visual-acceptance defect.** The source tree of `144e8edf` is green under Arena
re-execution (§6), and the operator's *visual* observations are unaffected by which compiled
test bundle was executed — the browser renders from Vite, not from `dist/tests`.

Accordingly:
- **Visual acceptance claims: INTAKEN and ACCEPTED** (§4).
- **Operator technical-validation numbers: REJECTED as stale; superseded by Arena's
  authoritative re-execution** (§5, §6).

---

### 2. Evidence Package Inspected

**Path:** `evidence/operator_drop/phase1b_windows_visual_acceptance_20260922/`
**Transport commit:** `ce7062a` (author `Ramaki`, 2026-09-22 22:24:28 +0530)
**Commit content:** 3 files added (`A`), **zero source files touched**.

| ID | Artifact | Blob SHA-1 | Bytes | Status |
| :--- | :--- | :--- | :--- | :--- |
| E-1 | `git-head.txt` | `6a16aac89d7e2742219028b0c82371dad7c5cf48` | 41 | **PRESENT / VERIFIED** |
| E-2 | `git-status.txt` | `a1cde64cd3fed1070664cbfefcb5266ff84b8b89` | 175 | **PRESENT / VERIFIED** |
| E-3 | `phase1b-visual-acceptance-result.txt` | `a99bfe44ff00c7f80728570a54d8b1c78c75e135` | 820 | **PRESENT / VERIFIED WITH DISCREPANCY** |

---

### 3. Artifact-Level Verification

#### E-1 — `git-head.txt` (Gate Task 2) — **PASS**

Content, verbatim:

```
144e8edf8d126a129ba4ed87dbd077765bd4051c
```

Required value: `144e8edf8d126a129ba4ed87dbd077765bd4051c`.
**Byte-exact match.** The Windows checkout was positioned on the correct commit.

#### E-2 — `git-status.txt` (Gate Task 3) — **PASS (no source changes)**

Content, verbatim:

```
## HEAD (no branch)
?? evidence/archive/
?? evidence/operator_drop/phase1b_windows_visual_acceptance_20260922/
?? evidence/operator_drop/target_application_forensic_20260922/
```

Forensic reading:

| Observation | Interpretation |
| :--- | :--- |
| `## HEAD (no branch)` | **Detached HEAD** — consistent with `git checkout 144e8edf`, the correct acceptance procedure. |
| Three `??` entries | **Untracked only.** All three are under `evidence/`. |
| **Zero ` M ` entries** | **No modified tracked file.** |
| **Zero staged entries** | Nothing staged. |

**Determination (Task 3): NO SOURCE CHANGES WERE PRESENT.** The tracked tree was clean; the
application under visual acceptance was exactly the committed state of `144e8edf`. The
untracked `evidence/` directories are operator work product and cannot alter application
behaviour.

> Note: `evidence/operator_drop/target_application_forensic_20260922/` appears as untracked
> on the Windows host but was **never transported** to the repository and remains absent
> here. It is unrelated to this gate and is carried forward unchanged as a residual.

#### E-3 — `phase1b-visual-acceptance-result.txt` (Gate Task 4) — **VERIFIED WITH DISCREPANCY**

Content, verbatim:

```
PHASE 1B WINDOWS VISUAL ACCEPTANCE

Commit under test:
144e8edf8d126a129ba4ed87dbd077765bd4051c

Result:
ACCEPTED

Technical validation:
360/360 tests PASS
54 suites PASS
TypeScript PASS
Vite production build PASS

Visual validation:
Target IIPS shell PASS
Governance chrome PASS
Portfolio route PASS
BI08 Portfolio Workspace PASS
W01 Zerodha PASS
W02 exact duplicate import idempotency PASS
W03 distinct Dhan import PASS
W04 final consolidated state PASS
AIIL -> EQ_AIIL_IN PASS
AGI GREENPAC -> EQ_AGI_IN PASS
Unresolved retention PASS
Future surfaces honestly marked Future PASS

Final consolidated state:
148 constituents
100.0000% weight allocation

Environment:
NON_PRODUCTION / OFFLINE_FIXTURE

Production boundary:
No live provider
No live trading/execution
No production authentication
No production entitlement
```

**Internal consistency:** the commit named in E-3 matches E-1 and the gate instruction.
**Claim-set completeness:** every claim enumerated in the authority instruction is present.
**Discrepancy:** the `Technical validation` block — see §5.

---

### 4. Visual Claim Reconciliation (Gate Task 5)

Arena reconciles each attested claim against the implementation baseline. Arena performs
**no visual inspection** and infers **no UI fact** beyond the deposited text.

| # | Operator Visual Claim | Attested | Arena-Side Reconciliation at `144e8edf` | Disposition |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Target IIPS shell | PASS | `SHELL-01`…`SHELL-06` assert AppShell/TopBar/Sidebar render | **RECONCILED** |
| 2 | Governance chrome | PASS | `REG-01`, `REG-01b`, `REG-02`: `NON_PRODUCTION / OFFLINE_FIXTURE`, `Governance: Active`, `P04/P12 Lineage Enforced`, `Live Providers: 0 (INACTIVE)`, `Sockets: 0` on every route | **RECONCILED** |
| 3 | Portfolio route | PASS | `MOUNT-01`, `MOUNT-04`; `DEFAULT_SURFACE_ROUTE === /portfolio` | **RECONCILED** |
| 4 | BI-08 Portfolio Workspace | PASS | `MOUNT-02`: routed BI-08 HTML byte-identical to standalone; tree `8491efdc` UNCHANGED | **RECONCILED** |
| 5 | W01 Zerodha import | PASS | Contract covered by BI-07/BI-08 suites (10/10, 64/64) | **RECONCILED (contract-level)** |
| 6 | W02 duplicate idempotency | PASS | `ALREADY_IMPORTED_NO_OP`, digest stable, ledger unchanged — `bi08_idempotent_ingress` 10/10 | **RECONCILED** |
| 7 | W03 distinct Dhan import | PASS | Additive consolidation verified (2→3 holdings, ledger 1→2) | **RECONCILED (contract-level)** |
| 8 | W04 final consolidated state | PASS | Weight-sum + provenance invariants hold on repo fixtures | **RECONCILED (contract-level)** |
| 9 | AIIL → `EQ_AIIL_IN` | PASS | `e2e_broad_universe…` 13/13; BSE `543989` + `539177` → `EQ_AIIL_IN` | **RECONCILED** |
| 10 | AGI GREENPAC → `EQ_AGI_IN` | PASS | `d05_browser_runtime_hydration` / E2E: exact governed alias | **RECONCILED** |
| 11 | Unresolved retention | PASS | Non-production bypass suites pass; contract upheld | **RECONCILED (contract-level)** |
| 12 | Future surfaces honestly Future | PASS | navigation model = **2 implemented / 11 future**; future items non-navigable (`SHELL-04`) | **RECONCILED** |
| 13 | **148 constituents** | 148 | **NOT reproducible from repository fixtures** — no 148-constituent fixture exists here | **OPERATOR-ONLY — ARENA REPRODUCIBILITY NOT CLAIMABLE** |
| 14 | **100.0000% weight allocation** | 100.0000% | Weight-sum invariant holds on repo fixtures; the *148-scale* instance is not reproducible | **PARTIAL — 148-scale operator-only** |
| 15 | Environment `NON_PRODUCTION / OFFLINE_FIXTURE` | PASS | Minified bundle: `applyTheme` 0, `AuthProvider` 0, `keycloak` 0, `oidc` 0, `authFetch` 0, `/api/` 0 | **RECONCILED** |
| 16 | Production boundary (no live provider / execution / auth / entitlement) | PASS | No `frontend/server/**`, no `/api/*` call site, no credentials/providers/sockets; fail-closed disclosure rendered | **RECONCILED** |

Claims 13 and 14 remain **Windows operator evidence only**, exactly as recorded in prior
gates. Arena does **not** claim reproducibility of the 148-constituent state.

---

### 5. Material Discrepancy — Recorded, Root-Caused, Reproduced

#### 5.1 Statement of discrepancy

| Metric | E-3 asserts for `144e8edf` | Arena measures at `144e8edf` | Verdict |
| :--- | :--- | :--- | :--- |
| Tests | **360/360 PASS** | **392/392 PASS** | **MISMATCH (−32 tests)** |
| Suites | **54 PASS** | **61 PASS** | **MISMATCH (−7 suites)** |
| TypeScript | PASS | PASS | Consistent |
| Vite production build | PASS | PASS | Consistent |

#### 5.2 Root cause — established empirically, not inferred

Test-file counts per commit:

| Commit | Phase | `tests/*.test.ts` | Suite signature |
| :--- | :--- | :--- | :--- |
| `1eb9c84` | Task-4 (**pre-Phase-1A**) | 39 | **360 tests / 54 suites** |
| `f13002e` | Phase 1A | 40 | 374 tests / 58 suites |
| `144e8ed` | **Phase 1B** | 41 | **392 tests / 61 suites** |

`360/360 / 54` is the **exact fingerprint of `1eb9c84`**, the pre-Phase-1A checkpoint.

**Mechanism:**
1. `package.json` → `"test": "node --test dist/tests/*.test.js"` — the script **runs
   pre-compiled output and does not rebuild**.
2. `.gitignore:2` → `dist/` — the compiled directory is **untracked**, so `git checkout`
   does **not** update or remove it.
3. A Windows checkout that switched to `144e8edf` **without re-running `tsc`** therefore
   executed a `dist/` produced from an earlier tree.

**Reproduction (executed by Arena, non-destructively, in `/tmp`):** a detached worktree at
`1eb9c84` was compiled and its suite executed, yielding:

```
# tests 360
# suites 54
# pass 360
# fail 0
```

This **exactly reproduces** the operator's reported figures, confirming the stale-`dist/`
mechanism. The probe worktree was removed and pruned; the repository was left clean.

#### 5.3 Materiality assessment

| Dimension | Impact |
| :--- | :--- |
| Implementation defect in `144e8edf`? | **NO.** Arena re-execution of the same tree is 392/392 PASS, tsc PASS, build PASS. |
| Visual acceptance invalidated? | **NO.** The browser surface is served by Vite from source (`index.html` → `frontend/src/main.tsx`); it does **not** load `dist/tests`. The visual observations are independent of which compiled test bundle was run. |
| Did the operator test the wrong *source*? | **NO.** E-2 proves the tracked tree was clean at `144e8edf`; only the **compiled test artifact** was stale. |
| Are the operator's technical numbers usable? | **NO — REJECTED as stale.** Superseded by Arena's re-execution (§6), which is the authoritative measurement. |
| Does this affect BI-01..BI-08 / D05 / P04 / D114 / fail-closed? | **NO.** All frozen trees verified UNCHANGED (§6). |

**Conclusion:** the discrepancy is confined to the operator's *technical validation* block and
is fully explained by a host-side measurement procedure gap. It does **not** impugn the
visual acceptance, and it is **recorded rather than silently reconciled**.

#### 5.4 Corrective action (host procedure, non-blocking)

For all future Windows technical validation, the operator must force a rebuild before
measuring, so the compiled artifact cannot lag the checkout:

```bat
cd /d G:\IIPS-BI07-Windows-Host-Verify
git checkout <commit>
rmdir /s /q dist
npm run build:tsc
npm test
```

The expected signature at `144e8edf` and later is **392/392 tests / 61 suites**.

---

### 6. Arena Authoritative Re-Execution (Gate Task 12)

Executed at HEAD `ce7062a`, whose **source tree is byte-identical to `144e8edf`**:

| Path | `144e8ed` | `ce7062a` | Verdict |
| :--- | :--- | :--- | :--- |
| `src` | — | — | **IDENTICAL** |
| `frontend` | — | — | **IDENTICAL** |
| `tests` | — | — | **IDENTICAL** |
| `package.json` / `vite.config.ts` / `tsconfig.json` / `index.html` | — | — | **IDENTICAL** |

| Check | Result |
| :--- | :--- |
| `npm test` | **392/392 PASS**, 61 suites, 0 fail |
| `tsc --noEmit` | **PASS** |
| `vite build` | **PASS** (470 ms) |
| `bi08_idempotent_ingress` | **10/10 PASS** |
| `e2e_broad_universe_multi_broker_integration` (D05/P04 identity) | **13/13 PASS** |

Frozen trees re-verified **UNCHANGED**:

| Path | Tree SHA | Verdict |
| :--- | :--- | :--- |
| `src/identity` | `9080e997ee7da977d0066431737e329e88b3c0b7` | **UNCHANGED** |
| `src/d114` | `0062ad520dce647f3d02ed9a27739598d457faaa` | **UNCHANGED** |
| `frontend/src/features/portfolio` | `8491efdc44ae449eedf1aaf93fbc7415c428fcb9` | **UNCHANGED (BI-08 authoritative)** |

No application source, test, or configuration file was modified by this gate
(Tasks 8 and 9 honoured). The transport commit `ce7062a` itself added **evidence only**.

---

### 7. Constraint Compliance

| Constraint | Status |
| :--- | :--- |
| Do not access Windows directly | **HONOURED** — only repository-visible artifacts were read |
| Do not infer visual facts beyond deposited evidence | **HONOURED** — no screenshot or UI fact inferred; claims 13–14 explicitly marked operator-only |
| Verify the evidence commit and contents | **DONE** — `ce7062a` inspected; 3 blobs hashed and read verbatim |
| Reconcile deposited HEAD with baseline `144e8edf` | **DONE** — byte-exact match (§3, E-1) |
| Run regression/typecheck/build | **DONE** (§6) |
| Do not modify application source | **HONOURED** |
| Do not alter BI-01..BI-08 / D05 / P04 / D114 / fail-closed | **HONOURED** — frozen trees unchanged |

---

### 8. Residuals

| ID | Residual | Disposition |
| :--- | :--- | :--- |
| R-1 | Operator technical-validation numbers (`360/360`, `54 suites`) | **REJECTED AS STALE** — stale `dist/` from `1eb9c84`; superseded by Arena `392/392` / 61 suites |
| R-2 | `148 constituents` / `100.0000%` at 148 scale | **WINDOWS OPERATOR EVIDENCE ONLY — Arena reproducibility NOT CLAIMABLE** |
| R-3 | Unresolved-identity retention at Windows fixture scale | **OPERATOR-ONLY** — repo suites cover the contract, not that instance |
| R-4 | `evidence/operator_drop/target_application_forensic_20260922/` | **STILL NOT TRANSPORTED** — untracked on the Windows host, absent from the repository; unchanged residual, unrelated to this gate |
| R-5 | No screenshots deposited | **ACCEPTED AS-IS** — the authority did not require image artifacts; textual attestation intaken as such, and no visual fact was inferred beyond it |
| R-6 | `798bc548` | **NOT RECOVERED / NOT AUTHORITATIVE** — untouched by this gate |
| R-7 | D115 | `C = UNRESOLVED`, `D = UNRESOLVED`, `runtimeCompanyId = UNRESOLVED`, `implementationAuthority = WITHHELD`, `productionEligible = false`, `production activation = NOT AUTHORIZED` |

---

### 9. Determination

```
GATE-WINDOWS-PHASE-1B-VISUAL-EVIDENCE-INTAKE = ACCEPTED
                                               (WITH RECORDED DISCREPANCY R-1)
```

- **E-1 verified byte-exact** against `144e8edf8d126a129ba4ed87dbd077765bd4051c`.
- **E-2 verified:** detached HEAD, **no source changes present** during acceptance.
- **E-3 intaken:** all 12 visual claims + environment + production boundary reconciled;
  technical-validation block **rejected as stale** and root-caused (§5).
- Arena authoritative re-execution at the identical source tree: **392/392 PASS, tsc PASS,
  build PASS, BI-08 10/10, D05/P04 13/13**, frozen trees **UNCHANGED**.

Phase-1B implementation baseline `144e8edf8d126a129ba4ed87dbd077765bd4051c` is
**VISUALLY ACCEPTED ON THE WINDOWS HOST** and remains **GREEN and DURABLE**.

**Governed under:** AD-01..AD-18 / AD-CHARTER-2026-01
**Execution Mode:** `NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV`
