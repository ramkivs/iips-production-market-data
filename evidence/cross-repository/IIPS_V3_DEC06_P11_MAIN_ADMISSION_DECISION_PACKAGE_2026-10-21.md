# IIPS v3.0 — `DEC-06`: IPD P11 remediation — **main-admission decision package**

| Field | Value |
|---|---|
| **Package ID** | `IIPS-V3-DEC06-P11-MAIN-ADMISSION-DECISION-PACKAGE-2026-10-21-01` |
| **Status** | **DECISION REQUIRED — NOT DECIDED.** This document prepares a decision. It renders none, grants nothing, and admits no code. |
| **Register item** | `DEC-06` (IPD-side bounded P11 status verification and the admission/publication boundary; IPD reconciliation addendum A4.4) |
| **Decision authority** | **Program Authority (Ramki)** acting in the **IPD** capacity. No other actor can settle it. |
| **Owning repository** | **IPD** (`ramkivs/iips-production-market-data`) — the only repository this package changes. IRR was read **only**. |
| **Refreshed baseline (this pass)** | IPD `main` = `a6ad4a9dc8c9ba9b1a4c392888c7a42f2e1b3893`; IRR `main` = `8d2fc9852cc4df62c0fd7683016fe7e6480de0d8` (read-only) |
| **Candidate tip** | `3eaec0edd4f89a806b301d647499ca860c2a1172` on `arena/21bc6f5f-iips-production-market-data` |
| **Review vehicle** | IPD **PR #36 — OPEN, explicitly NOT FOR MERGE** (`MERGEABLE` / `CLEAN`) |
| **Production status** | `NON_PRODUCTION`. Admission of this lineage changes **no** operational eligibility. |

> **Explicit non-decision statement.** Nothing here admits, merges, certifies, qualifies, releases or productionizes anything. The candidate remains **off `main`**. The prohibited action is stated normatively in §9. This package exists so that the PA decision is made on evidence rather than on an inference from green CI, successful tests, or an existing bounded acceptance.

---

## 1. The finding in one paragraph

A real, reproducible defect exists on IPD `main` today: the canonical momentum input (`D01_QUOTES.pctChange`) **never reaches the frozen scoring engine**, so the P11 momentum factor — weighted 15% of the composite score — is **permanently inert at exactly 50/100 for every company and every input**. Commit `b6e6224` fixes this and binds lineage to effective inputs. The fix is validated, conflict-free, and passes the full suite in the exact tree GitHub would create. **However, no Program Authority decision authorizing IPD `main` admission of `b6e6224` + `3eaec0e` exists.** The bounded P11 library acceptance (IRR §16.65) accepts a *capability claim* and expressly does **not** constitute main admission. Admission is therefore **not performed** and is **not permissible** without the decision requested in §7.

---

## 2. Exact candidate commits and parent chain

```
3d44e0a123f2495f3b88ce0ab8b47fbc5bf072db   ← merge base: IPD main at candidate creation (PR #33 merge)
   └── b6e622432cb0ca3e5452c4194bc683c496a688fc   "Fix P11 momentum propagation and scoring lineage"      [implementation]
          └── 3eaec0edd4f89a806b301d647499ca860c2a1172   "Record bounded P11 library scope and Row 26 gap"   [documentation]
```

| Property | Value |
|---|---|
| Branch | `arena/21bc6f5f-iips-production-market-data` (remote head verified = `3eaec0edd4f89a806b301d647499ca860c2a1172`) |
| Author / date | `ramkivs`, 2026-10-20T16:26:05Z (`b6e6224`); 2026-10-20T16:38:28Z (`3eaec0e`) |
| Unit | **2 commits.** They are a single admission unit: `3eaec0e` documents the scope of the behaviour `b6e6224` changes. |
| CI on either commit (before this pass) | **zero check runs** on both `b6e6224` and `3eaec0e` |
| Ancestry vs `main` | **neither is an ancestor of `main`** |
| Fast-forwardable? | **NO — changed since the previous pass** (see §2.1) |

### 2.1 Material state change since the previous pass

The prior record (A4.4) stated `git compare main...3eaec0e` → *ahead 2, behind 0* (fast-forwardable). **That is no longer true.** `main` advanced two commits after the merge base:

| `main` commit | Content | Overlap with the candidate |
|---|---|---|
| `0980bd89a01207b96487c38bb50a97c4f764bbdd` | Group B IPD reconciliation — adds A4 to the np04 tracker, adds the issue closure notes | **touches the same file** `3eaec0e` annotates |
| `a6ad4a9dc8c9ba9b1a4c392888c7a42f2e1b3893` | PR #35 merge | none |

**Consequence.** Admission can no longer be a fast-forward. It requires a merge commit (or a rebase onto `main`, which would produce different commit IDs and therefore a *different* candidate than the one this package authorises). The overlap is **conflict-free**: `git merge` (`ort` strategy) auto-merges, retaining both the A4 addendum from `main` and the row-13 annotation from the candidate. Verified in the merge result: A4 present, row-13 annotation present, inventory line count unchanged at 657.

**GitHub's own merge preview** of PR #36 is `0046adb1ea97eb6d3727c093757c85d93e9a9384` (parents `a6ad4a9` + `3eaec0e`), tree `26dec9ac01515635cc15eb9cfa812435ff0f7f65`. **That tree is byte-identical to the tree validated locally in §5**, so the local validation covers exactly what admission would land.

---

## 3. Precise scope — source and documentation

### 3.1 Source code (2 files, `+23 / −2`)

| File | `main` blob | Candidate blob | Change |
|---|---|---|---|
| `src/engine_adapters/databound_executor.ts` | `4905a094cf046137535608ff6f8f1d25cdf0d0ee` | `a22b33630377e58125f4ea72a7384c01a72c2e7a` | momentum no longer coerced with `?? 0` at resolution (+6/−1); lineage hash now binds effective inputs and identity (+11/−1) |
| `src/engine_adapters/sector_defaults.ts` | `d0351f679cfb3a8adc071cd326b3dcf736a5533b` | `66a2debc4baea7753f17653caedfbb0b749da1cf` | explicit momentum passthrough + disclosed neutral fallback (+9/−0) |

### 3.2 Tests (1 file, `+56 / −0`)

| File | `main` blob | Candidate blob | Change |
|---|---|---|---|
| `tests/wsd_p11_engine_adapters.test.ts` | `6478c78a61fda0872a81e2d5107658b557f2b353` | `afc5eb3a4647028d48507739c96b98e753af61dd` | two new cases: `P11-01` momentum propagation; `P11-03` effective-input/output lineage binding |

### 3.3 Documentation (2 files, `+69 / −1`)

| File | Nature |
|---|---|
| `evidence/cross-repository/IPD_P11_BOUNDED_LIBRARY_SCOPE_AND_ROW26_RECONCILIATION_2026-10-20.md` (new, blob `384cf6a63f2c10867cdb02a2eb58e13c157cf87f`) | The IPD-side record of the bounded library scope, the Row 26 gap, and the outstanding authority question |
| `evidence/np04/…TRACKER_RECONCILIATION_2026-10-17.md` (row 13 annotation only) | P11-01/P11-03 test identification; bounded-scope qualifiers |

### 3.4 Everything outside the scope — verified untouched

No change to: `frontend/**`, `src/persistence/**`, `src/ipc/**`, `src/pit/**`, `src/contracts/provenance.ts`, `package.json`, `package-lock.json`, `.github/workflows/**`, any fence, route, transport, dependency, migration, schema or CI configuration. Total diff `5 files, +145 −3`.

---

## 4. The defect and requirement addressed

### 4.1 Behaviour currently on `main` (reproduced in this pass)

`SectorDefaultInjector.injectDefaults()` builds its `resolvedInputs` object from a fixed whitelist — `pe`, `pb`, `roe`, `roce`, `operatingMargin`, `beta`. **`momentum` is not in that whitelist.** Any momentum value the executor resolved is therefore silently discarded before scoring. `FrozenEngines.executeSectorEngine()` then evaluates `const momentum = inputs.momentum ?? 0`, so the factor is computed from a constant zero.

Because `momentumScore = clamp(50 + momentum × 2)`, a constant zero yields a constant **50.00**; and since momentum carries **15%** of the composite, the factor contributes a fixed 7.5 points to every score, discriminating nothing.

**Observed on `main` at `a6ad4a9`** (executed this pass, `SECTOR_IT`, all other inputs fixed):

| Momentum input | `momentumScore` | `normalizedScore` | `fallbackFields` |
|---|---|---|---|
| absent | 50 | 65 | `[beta]` |
| explicit `0` | 50 | 65 | `[beta]` |
| `+10` | **50** | **65** | `[beta]` |
| `−10` | **50** | **65** | `[beta]` |
| `NaN` | 50 | 65 | `[beta]` |

Every case is identical. A strongly positive and a strongly negative momentum are **indistinguishable** from missing data, and the absence is **never disclosed** — `momentum` never appears in `fallbackFields`, so `qualityState` does not reflect it.

### 4.2 Behaviour after the candidate (same harness, identical inputs)

| Momentum input | `momentumScore` | `normalizedScore` | `fallbackFields` |
|---|---|---|---|
| absent | 50 | 65 | `[beta, momentum]` |
| explicit `0` | 50 | 65 | `[beta]` |
| `+10` | **70** | **68** | `[beta]` |
| `−10` | **30** | **62** | `[beta]` |
| `NaN` | 50 | 65 | `[beta, momentum]` |
| `Infinity` | 50 | 65 | `[beta, momentum]` |

Momentum now reaches scoring, discriminates the result, and — critically — a **substituted** momentum is disclosed as a governed fallback, while an **explicit** zero is distinguished from a **missing** value. `NaN`/`Infinity` are additionally hardened to the disclosed fallback rather than propagating into the composite.

### 4.3 Second defect — lineage bound to output only

On `main`, `computeLineageHash(scoringResult, {...})` hashes **only the derived output**. The effective post-fallback inputs, the engine identity/version and the as-of context are not part of the binding. The candidate hashes `{companyId, engineId, versionVector, asOf, effectiveScoringInputs, output}`, so the digest identifies *which inputs produced which output* rather than merely *which output*. Volatile values (`requestId`, `executionId`, wall-clock) remain excluded, and a regression test asserts that two runs differing only by `requestId` produce the same hash while a material input change produces a different one.

### 4.4 Requirement addressed

The bounded P11 library claim — governed sector default fallback with disclosure (P11-03 / `AD-12`), namespace guard (C1–C6), and deterministic frozen scoring. The fix restores an intended-but-inert scoring input and makes the governed-fallback disclosure truthful. **No new requirement is invented.**

---

## 5. Test and validation evidence

### 5.1 Executed in this pass (POSIX, Node 22.22.3, `npm ci` from the committed lockfile)

| Target | `tsc --noEmit` | `npm run build` | Guarded test run |
|---|---|---|---|
| `main` @ `a6ad4a9` (baseline) | clean | ok | **584 executed, 584 pass, 0 fail** |
| candidate @ `3eaec0e` | clean | ok | **586 executed, 586 pass, 0 fail** |
| **merged integration** @ `26dec9ac` (GitHub's PR #36 merge tree) | clean | ok | **586 executed, 586 pass, 0 fail** |

Delta `584 → 586` is exactly the two added cases. The focused P11 suite executes **8/8 pass** in the merged tree. Zero-test false-green is blocked by the repository's CV-35 guard, which fails a run reporting no executed tests.

### 5.2 Exact-head CI evidence (new in this pass — previously nonexistent)

| Item | Value |
|---|---|
| Workflow | `CI` — `typecheck · build · test` |
| Run | **`39629785765`** — `success` |
| Event / head | `pull_request` / `3eaec0edd4f89a806b301d647499ca860c2a1172` |
| Published count check | **`executed test count`** — `success`, check id `119324882624`: *"586 tests executed — 586 passed, 0 failed. Head: `3eaec0e…`"* |
| Mergeability | PR #36 `MERGEABLE`, `mergeStateStatus` **`CLEAN`** |

This closes the previously recorded gap ("no GitHub check runs were attached to the remediation commit").

### 5.3 Limitations — stated, not glossed

1. **POSIX execution is non-qualifying for the Windows host.** By the program's existing records, Linux CI and local runs establish nothing about the Windows deployment host.
2. **Unit-level evidence only.** These are library-level unit/integration tests. There is **no** product-consumer test, no HTTP transport, no IPD→IRR invocation and no engine-equivalence test — none exists to run, and none is claimed.
3. **Coverage is behavioural, not exhaustive.** The suite proves the momentum factor now discriminates and that the lineage digest is input-sensitive for the exercised cases. It does not prove every `momentum` consumer, nor reconstruct a full P15 provider-to-score chain.
4. **The two new tests were authored together with the fix** in the same commit, so they are not independent acceptance tests. Their independence rests on the PA's review, not on the authoring process.
5. **`fallbackFields`/`qualityState` semantics beyond momentum** are unchanged and untested by this candidate.

---

## 6. Relationship to the existing P11 acceptance — and why it is not admission

| Aspect | Established state |
|---|---|
| Governing record | IRR tracker **§16.65** (`CV-CORR-48`), blob `f62452bf239983c8946bc39eddde76d844aa76f4` at IRR `main@8d2fc985` |
| Companion PA act | IRR `docs/integration/IIPS_v3.0_P11_ROW26_BOUNDED_LIBRARY_ACCEPTANCE_PA_DISPOSITION_2026-10-20.md`, blob `86700486fd8e1ab95c6ff0c53c7fd010c5e9321a` |
| Published via | IRR **PR #164 — MERGED** 2026-10-20T17:42:53Z, merge `99b90d0391f81b9104d012aa1572262c4b297fd3`, PR-head check run `39468200367` pass |
| What it accepts | The existing **in-process IPD library capability**, explicitly "including the documented momentum propagation and effective input-to-output lineage fixes". Row 26 E2E set to **`NA` for this bounded scope only**. |
| What it says about this lineage | "The IPD remediation and inventory annotation **remain on IPD task branch** `arena/21bc6f5f-…` (tip `3eaec0e`), **not IPD `main`** (`3d44e0a`). Their publication location is **not misrepresented as main admission**." |
| Standing-authorization ceiling | §16.65.4: covers governance-record preparation, branch publication for review and read-only verification; it "**does not by itself authorize or prove main admission**". |
| Independent search result | **No** PA decision authorising IPD `main` admission of `b6e6224` / `3eaec0e` was found in any inspected IPD or IRR record. |

**Therefore: acceptance ≠ admission.** The bounded acceptance settles *what the capability claim is* and *how far it reaches*. It deliberately does not settle *whether this code may enter `main`*. Treating a green CI run, an accepted claim, or a mergeable PR as that decision would be exactly the inference the governance records prohibit.

### 6.1 Documentation-accuracy check (and why it is not a blocker)

`3eaec0e`'s record is dated 2026-10-20 and states the Row 26 authority question is **pending**; IRR §16.65 subsequently **resolved** that question for IRR Row 26. The record also names IRR `37e82b75` as the revision inspected; IRR `main` is now `8d2fc985`.

This is **temporal staleness in a correctly dated historical record, not a misstatement.** IRR §16.65.2 addressed it explicitly at acceptance time: the inventory note "that Row 26 authority was pending **accurately describes the state when that dated record was prepared**", and the decision "resolves that pending question **for IRR Row 26 only**; it does not rewrite the IPD inventory". The implementation description in the record was re-checked against the code in this pass and is **accurate**.

**Residual, for the PA to weigh:** if admitted unchanged, `main` will carry a row-13 cell and a §3/§5 statement phrased in the present tense as "pending" that §16.65 has since decided, and §6's "published on the IPD task branch only" will become literally false. Irreproachable remedy is a fresh dated annotation after admission; it is **not** performed here, because amending the candidate would change its commit IDs and thus the identity of the thing being authorised.

---

## 7. The decision requested

> **D-06:** Does the Program Authority admit commit lineage **`b6e622432cb0ca3e5452c4194bc683c496a688fc` → `3eaec0edd4f89a806b301d647499ca860c2a1172`** (as a single 2-commit unit, merged with a merge commit on top of `main@a6ad4a9…`, yielding merge `0046adb1…` / tree `26dec9ac…`) to IPD `main`?

**Options — exactly one may be selected:**

| Option | Meaning |
|---|---|
| **A — ADMIT** | Authorise the merge of PR #36 (or an equivalent merge commit with the same parents/tree). `main` gains the P11 remediation. |
| **B — ADMIT WITH CONDITIONS** | Authorise admission subject to named conditions (e.g. a post-admission dated annotation reconciling row 13 and §3/§5/§6 to §16.65; or a required re-review of the two new tests). |
| **C — REJECT** | The lineage is not admitted. The defect documented in §4 stays live on `main` and the P11 momentum factor remains inert. |
| **D — DEFER** | State what must be established first, and by whom. |

**Required in the PA act itself:** the named commit IDs; that the merge must produce tree `26dec9ac…`; that the scope is confined to `src/engine_adapters/**` and `tests/wsd_p11_engine_adapters.test.ts` plus the two evidence files; and that admission establishes **no** product-consumer integration, no Row 26 E2E, no IPD/IRR equivalence, no Gate 3/4/5 movement, no qualification, and **no operational eligibility change**.

---

## 8. Consequences of each option

| | Option A (admit) | Option B (conditional) | Option C (reject) | Option D (defer) |
|---|---|---|---|---|
| `main` P11 momentum factor | becomes live and discriminating | becomes live after conditions | stays inert at 50 | stays inert at 50 |
| Governed-fallback disclosure | truthful (missing ≠ explicit 0) | truthful | remains silent/incorrect | remains silent/incorrect |
| Lineage binding | binds inputs+identity+output | same | output-only | output-only |
| Regression exposure | new source enters `main`; mitigated by 586/586 + clean typecheck/build on the exact merge tree | as A, gated | none from this change | none |
| Candidate status | consumed; branch may be closed | consumed after conditions | lineage is dead; a *new* remediation would be required to fix a real defect | lineage is held; risk it rots further as `main` advances |
| Governance effect | admission recorded | admission recorded with conditions | a known defect is knowingly retained | no change |
| Reversibility | revert of one merge commit (different tree) | as A | — | — |

**Honest risk note for Option C/D:** rejecting or deferring does **not** preserve a neutral status quo. It preserves a state in which a documented, reproducible scoring defect remains live, in which a 15%-weighted factor is provably constant, and in which the governed-fallback disclosure is wrong. That is a real cost of inaction, and it should be weighed rather than assumed to be the safe choice.

**Honest risk note for Option A:** this admits *new engine source* to `main` on the strength of library-level unit evidence authored alongside the fix, with POSIX-only execution. If the PA requires independent test authorship or Windows-host evidence before any `src/engine_adapters/**` admission, Option B/D is the correct choice — and that requirement should be stated, not implied.

---

## 9. Exact action prohibited until the decision is established

Until a PA act under §7 exists and unambiguously covers these exact commits:

1. **PR #36 must not be merged.** It is explicitly a review vehicle. Merging it *is* main admission.
2. **No equivalent merge, cherry-pick, rebase-and-push, or direct commit** of `b6e6224` or `3eaec0e` (or their content) to `main` may be performed by any agent.
3. **No documentation-only landfall on `main` may imply the implementation was admitted** — in particular, `3eaec0e` must not be published alone, because `main` would then cite a remediation commit whose code is absent from `main`.
4. **No representation** may be made that the momentum defect is fixed on `main`, that P11 is complete, or that admission occurred.
5. **No re-derivation of the candidate** (rebase onto a newer `main`) may be substituted for the authorised lineage without re-issuing this package, since that changes the commit IDs.

---

## 10. Dependencies, unresolved matters and preserved boundaries

**Resolved by this pass:** exact ancestry and divergence; conflict-free integration; exact-head CI; blob identities at `main`, candidate and merge tree; the P11 acceptance's admission boundary; documentation temporal accuracy.

**Unresolved — carried forward, not waived (§16.65.3):** P11-02 recalculation/replay/snapshot/ownership responsibility; `CSIP_COMPOSITE` executor dispatch semantics; `mode` / `governedIntelligenceInputs` semantics; potential UI05 compatibility; IPD/IRR taxonomy mapping and engine equivalence; broader P15 provider-to-score and golden-digest claims.

**Adjacent but independent:** Gate 3 (`CV-39`) remains **BLOCKED / NOT ACCEPTED**; IPD PR #34 remains open and unmerged; the Gate 3 candidate is a different lineage and is unaffected by this package. IRR Row 26 requires no change from this package.

**Preserved and verified unchanged:** `SESSION_ONLY` / `durable: false`; the 29-key caller-identity guard; all `503` owner-context fences; `G-2` §7/§8 exclusions; `CV-22` Option C; `CV-40` Option B deferral; Row 26 / §16.65. **No IRR file was created, modified or deleted by this pass.**

---

## 11. Verification index (this pass)

| # | Check | Result |
|---|---|---|
| W1 | IPD `main` refreshed from remote | `a6ad4a9dc8c9ba9b1a4c392888c7a42f2e1b3893` |
| W2 | `b6e6224` / `3eaec0e` resolved to full SHAs | `b6e622432cb0ca3e5452c4194bc683c496a688fc` / `3eaec0edd4f89a806b301d647499ca860c2a1172` |
| W3 | Ancestry vs `main` | neither is an ancestor; merge base `3d44e0a` |
| W4 | Fast-forwardable? | **NO** — `main` ahead 2, candidate ahead 2 (diverged) |
| W5 | Merge conflicts | **none** — `ort` auto-merge, 1 overlapping file, both sides preserved |
| W6 | GitHub PR #36 merge preview | `0046adb1ea97eb6d3727c093757c85d93e9a9384`, tree `26dec9ac01515635cc15eb9cfa812435ff0f7f65` |
| W7 | Local validation tree = GitHub merge tree | **identical** (`26dec9ac`) |
| W8 | `main` baseline tests | 584 pass / 0 fail |
| W9 | Candidate tests | 586 pass / 0 fail |
| W10 | Merged-integration tests | 586 pass / 0 fail; P11 suite 8/8 |
| W11 | Exact-head CI on candidate | run `39629785765` success; count check `119324882624` = 586/586 |
| W12 | Prior check-run state | **0** check runs on both commits before this pass |
| W13 | Defect reproduced on `main` | momentum `+10` and `−10` both → score 50, norm 65 — inert |
| W14 | Fix effect reproduced | `+10` → 70 / norm 68; `−10` → 30 / norm 62 |
| W15 | P11 acceptance admission boundary | §16.65 + PA disposition: explicitly **not** main admission |
| W16 | Search for a PA admission decision | **none found** |
| W17 | IRR mutation | **none** — read-only |
| W18 | Issue #16 / #17 write capability | `403`; `X-Accepted-Github-Permissions: issues=write` (absent) |

---

*Prepared by Arena Agent Mode in the IPD capacity. No authority is rendered, granted, inferred or fabricated by this document; Options A–D are the Program Authority's alone.*
