# IIPS v3.0 — `DEC-06`: IPD P11 remediation — **`D-06` main-admission act**

| Field | Value |
|---|---|
| **Act ID** | `IIPS-V3-DEC06-P11-MAIN-ADMISSION-ACT-2026-10-21-01` |
| **Decision** | **`D-06` — `ADMIT`** |
| **Status** | **EFFECTIVE ON PUBLICATION — admission NOT YET EXECUTED by this record.** This act authorizes and admits the named lineage. It is published **before** the merge (condition C-1). At the moment of this record's publication the candidate commits are **still not ancestors of IPD `main`**, and the candidate source code is **not present on `main`**. Admission is proven only by the remote ancestry and blob checks of C-6, recorded in the C-7 addendum. |
| **Register item** | `DEC-06` (IPD-side bounded P11 status verification and the admission/publication boundary; IPD reconciliation addendum A4.4) |
| **Authority (IRR, read-only)** | `IIPS-V3-DEC06-AUTHORITY-RECONCILIATION-IRR-2026-10-21-01` — IRR tracker **§16.70** (`CV-CORR-53`, `CHG-2026-10-21-04`) plus companion record `docs/integration/2026-10-21/DEC-06-PA-STANDING-AUTHORIZATION-AND-P11-MAIN-ADMISSION-AUTHORITY-RECONCILIATION-2026-10-21.md`; published by IRR **PR #173 → `bf14a7c4`** and receipt **PR #174 → IRR `main@d89b785c6e7f91a0330d51f2d86b1efe8428ed18`**. §16.70.7.1 establishes the default disposition **ADMIT** and states **no further PA approval is required**; §16.70.7.3 names this act as the exact next authorized action. |
| **Owning repository** | **IPD** (`ramkivs/iips-production-market-data`) — the only repository mutated. **IRR was read only** (condition C-9). |
| **Baseline at act authoring** | IPD `main` = `15465e45adfc1dd58fba17e80365b729599aef6b` (PR #37 merge, 2026-10-21T15:57:34Z) |
| **Review vehicle (not the admission mechanism)** | IPD **PR #36** — OPEN, `MERGEABLE`/`CLEAN`, `mergedAt: null`, explicitly marked *REVIEW ONLY — DO NOT MERGE*. It **must not** be merged as the mechanism (prohibition 1, §16.70.8). |
| **Production status** | `NON_PRODUCTION`. This admission changes **no** operational eligibility. |

> **What this record is.** The explicit IPD-side `D-06` disposition required by condition **C-1**: the admission decision recorded **in IPD**, as its own act, **before** the merge, and **not** inferred from the IRR reconciliation, from green CI, from mergeability, or from the earlier bounded acceptance.
>
> **What this record is not.** It is **not** proof that admission has occurred. It does not itself move any ref, and it makes no claim that the momentum defect is fixed on `main`. It additionally claims **no** new human signature and **no** independently held agent jurisdiction beyond the standing grant as construed in §16.70.4–§16.70.7.

---

## 1. Scope of the admission — exact five-path lineage

**Merge base:** `3d44e0a123f2495f3b88ce0ab8b47fbc5bf072db` (IPD `main` at candidate creation).
**Candidate branch:** `arena/21bc6f5f-iips-production-market-data` (remote head `3eaec0e…`).

```
3d44e0a123f2495f3b88ce0ab8b47fbc5bf072db   ← merge base
   └── b6e622432cb0ca3e5452c4194bc683c496a688fc   "Fix P11 momentum propagation and scoring lineage"   [source + test]
          └── 3eaec0edd4f89a806b301d647499ca860c2a1172   "Record bounded P11 library scope and Row 26 gap"   [documentation]
```

**Admitted lineage — exact commit IDs (both admitted as one coherent unit):**

| Role | Commit |
|---|---|
| Source-code commit | **`b6e622432cb0ca3e5452c4194bc683c496a688fc`** |
| Documentation commit | **`3eaec0edd4f89a806b301d647499ca860c2a1172`** |

**Content identity — the five blobs at `3eaec0e`.** These blob identities, not the commit-message text, are what admission is verified against (C-2, C-6):

| # | Path | Candidate blob @ `3eaec0e` | `main@15465e45` blob | Change |
|---|---|---|---|---|
| 1 | `src/engine_adapters/databound_executor.ts` | **`a22b33630377e58125f4ea72a7384c01a72c2e7a`** | `4905a094cf046137535608ff6f8f1d25cdf0d0ee` | modified |
| 2 | `src/engine_adapters/sector_defaults.ts` | **`66a2debc4baea7753f17653caedfbb0b749da1cf`** | `d0351f679cfb3a8adc071cd326b3dcf736a5533b` | modified |
| 3 | `tests/wsd_p11_engine_adapters.test.ts` | **`afc5eb3a4647028d48507739c96b98e753af61dd`** | `6478c78a61fda0872a81e2d5107658b557f2b353` | modified |
| 4 | `evidence/cross-repository/IPD_P11_BOUNDED_LIBRARY_SCOPE_AND_ROW26_RECONCILIATION_2026-10-20.md` | **`384cf6a63f2c10867cdb02a2eb58e13c157cf87f`** | **absent** | added |
| 5 | `evidence/np04/IIPS_v3.0_IPD_IRR_CAPABILITY_INVENTORY_AND_TRACKER_RECONCILIATION_2026-10-17.md` | **`735fde8ffbbc9b0bb914f4fb9fc878b0139ce560`** | `65c80a04e4ddd2d4c43434643aa7fda2b166301b` | modified (row-13 annotation only) |

**Aggregate:** 5 paths, **+145 / −3**. Every path outside these five is untouched by the candidate.

**Verified before publication of this act (2026-10-21):** all five candidate blobs resolve exactly as recorded in IRR §16.70.6; neither `b6e6224` nor `3eaec0e` is an ancestor of `main@15465e45`; IPD PR #36 is OPEN with `mergedAt: null`.

---

## 2. The authorized purpose and the behaviour admitted

**Authorized purpose.** Admit the already-PA-accepted bounded P11 library remediation to IPD `main`, so that the recorded defect ceases to exist on the authoritative branch. The content is already accepted in substance by IRR §16.65 (the bounded in-process IPD P11 library acceptance), which expressly includes "the documented momentum propagation and effective input-to-output lineage fixes". This act supplies the **implementation-publication** decision that the acceptance expressly did not supply.

**Behaviour admitted — two defects, both on `main` today:**

| Defect | Behaviour on `main` before this admission | Behaviour after |
|---|---|---|
| **Canonical momentum never reaches the frozen scoring engine** | The canonical momentum input (`D01_QUOTES.pctChange`) never reaches the executor, so the P11 momentum factor — weighted 15% of the composite score — is permanently inert at exactly **50/100** for every company and every input. | Momentum reaches the factor; the regression asserts positive and negative momentum change the score, and that absent momentum takes a zero/neutral fallback. |
| **Lineage bound to output only** | The lineage digest does not bind the *effective inputs*, so two materially different input sets can present the same lineage assertion. | Lineage binds effective inputs, output, engine/version/company and as-of metadata; the regression checks material input sensitivity, deterministic hash stability, and recomputes the binding. |

**Nothing else is admitted.** The change is confined to `src/engine_adapters/**` and one test file, plus the two evidence paths.

---

## 3. Mandatory conditions of execution — C-1 through C-9

All nine are mandatory. None is an approval round; each is an evidence obligation.

| # | Condition (as fixed by IRR §16.70.7.2) | How this execution satisfies it |
|---|---|---|
| **C-1** | The `D-06` act is recorded **in IPD**, before the merge, as its own explicit act — not inferred from the IRR record, green CI or mergeability. | **This record**, published on IPD `main` through the normal PR workflow **before** the source-code merge. |
| **C-2** | The act names the two commits, their content identity by the five blobs, and the five-path scope; and states the prohibitions of §16.70.8. | §1 (commits, five blobs, five-path scope) and §6 (prohibitions) of this record. |
| **C-3** | The merge is a **merge commit** on then-current `main` — no squash, rebase, cherry-pick, fast-forward-only constraint, or direct commit. | The candidate lineage is merged with `--no-ff` onto then-current `main` and the result lands through a PR **merge commit**. PR #36 is **not** the mechanism. |
| **C-4** | The merge tree is **re-derived** at execution time; the full IPD suite and the focused P11 suite are executed against that exact tree, with results recorded with the tree hash. `26dec9ac…` is **not** quoted as the expected tree. | The definitive tree is re-derived after this act merges (which advances `main`). Validation is executed on that exact tree; the tree hash, commands, exit codes, counts and skips are recorded in the C-7 addendum. |
| **C-5** | Both sides of the overlapping inventory file survive; line count and the presence of main's A4/A5 addenda **and** the candidate's row-13 annotation are asserted. | Asserted post-merge: `ADDENDUM A4` present, `ADDENDUM A5` present, row-13 annotation present, and the file's line count recorded. |
| **C-6** | Verification is remote, not asserted: merge commit + `mergedAt`, then `git merge-base --is-ancestor 3eaec0e origin/main` **and** blob equality for all five paths at remote `main`. | Executed against fetched remote refs after the merge, and recorded in the C-7 addendum. |
| **C-7** | A **post-admission dated addendum** in IPD reconciles the §16.70.6 residuals additively, without rewriting dated records or changing the admitted commit IDs. | Addendum **A6** appended to the inventory record, reconciling the A4/A4.4/A5.1 and candidate-record §67 statements with the now-completed admission. |
| **C-8** | Nothing in §16.70.8 is claimed: no product E2E, consumer integration, IPD/IRR equivalence, qualification, Gate 3/4/5 movement, Row 26 change, or operational-eligibility change. | §7 of this record states each exclusion affirmatively. |
| **C-9** | The execution remains IPD-only; IRR is not mutated to accommodate it. | IRR was read only (`/tmp` scratch clone); no IRR ref, file or issue was modified. |

### 3.1 Merge-tree identity — stated precisely, not over-claimed

The earlier decision package's coordinates (`0046adb1…` / tree `26dec9ac…`) were computed against `a6ad4a9…` and are **stale as coordinates**. `26dec9ac…` is **not** quoted here as the expected tree.

A pre-act dry-run merge of `3eaec0e` onto the act-authoring baseline `main@15465e45` produced a **clean, conflict-free** merge over exactly the five paths, yielding tree **`56ac4796b7b68bd8c6081e136b5d3101e02ef77d`** with the inventory file at **722 lines** and both A4/A5 plus the row-13 annotation intact. That is an **independent reproduction of the IRR §16.70.6 preview** and is recorded as the *pre-act* check only.

**That tree will not be the admitted tree.** Publishing this act advances `main`, so per **C-4** the definitive merge tree must be re-derived against the post-act `main`, and validation must run on that re-derived tree. The definitive tree SHA is recorded in Addendum **A6**, not here.

---

## 4. Validation and evidence requirements

Admission is not complete, and must not be reported complete, until all of the following exist:

| Requirement | Standard |
|---|---|
| Pre-act baseline | Full IPD suite executed on the act-authoring `main`, with counts recorded. Historical figure `584` is **not** a substitute for a fresh run. |
| Exact integration tree | `npx tsc --noEmit`, `npm run build` and the full guarded `npm test` executed on the **re-derived** merge tree, with the tree SHA recorded alongside the results. |
| Focused P11 suite | `tests/wsd_p11_engine_adapters.test.ts` executed against the same tree, result recorded separately. |
| Count reconciliation | Executed total, passes, failures and **skips** recorded explicitly; the zero-test false-green guard (CV-35) must report a non-zero executed count. |
| CI | Exact-head PR CI and post-merge `main` CI results recorded by run id, including the published `executed test count` check. |
| Remote proof (C-6) | `mergedAt` + merge commit; `merge-base --is-ancestor 3eaec0e origin/main`; blob equality for all five paths at remote `main`. |

Historical candidate results (`584` baseline / `586` candidate lineage) are **not** valid substitutes and are not relied upon for the admitted tree.

---

## 5. Disclosed limitations — stated, not glossed

1. **The two new tests were authored alongside the fix, in the same commit.** They are therefore **not independent acceptance tests**. Their independence rests on PA review, not on the authoring process. This limitation is carried forward, not resolved, by admission.
2. **Execution is POSIX-only.** All validation runs and the hosted CI run `ubuntu-latest`. This establishes **nothing** about the Windows deployment host, and no Windows, browser, localhost or operator acceptance is claimed.
3. **Unit/library level only.** No product-consumer test, no HTTP transport, no IPD→IRR invocation and no engine-equivalence test exists to run, and none is claimed.
4. **Behavioural, not exhaustive.** The suite shows the momentum factor now discriminates and the lineage digest is input-sensitive **for the exercised cases**. It does not prove every `momentum` consumer, nor reconstruct a full P15 provider-to-score chain.
5. **Admission is not qualification.** A merge commit on `main` plus green Linux CI is **not** Gate 4 qualification, not a Gate 4 result acceptance, and not a Gate 5 admission.

---

## 6. Relationship to the earlier P11 bounded acceptance — acceptance ≠ admission

| Aspect | Established state |
|---|---|
| Governing acceptance | IRR tracker **§16.65** (`CV-CORR-48`, 2026-10-20): the PA selected **bounded in-process IPD P11 library acceptance**, expressly including these momentum and lineage fixes. Row 26 E2E set to **`NA` for that bounded scope only**. |
| Published via | IRR **PR #164 — MERGED** 2026-10-20T17:42:53Z. |
| What acceptance settles | *What the capability claim is* and *how far it reaches*. |
| What acceptance did **not** settle | *Whether this code may enter `main`.* §16.65 expressly recorded that the remediation and inventory annotation "remain on IPD task branch `arena/21bc6f5f-…` (tip `3eaec0e`), **not IPD `main`**". |
| What this act adds | The separate **implementation-admission** decision, now authorised by IRR §16.70.7.1/§16.70.7.3 under the standing grant. |
| What remains unchanged by this act | Every restriction, partial finding and open item of IRR **§16.65.3** — see §7 below. |

Treating the bounded acceptance, a green CI run, or a mergeable PR as the admission decision would be exactly the inference the governance records prohibit. That is why this act exists as a separate instrument.

---

## 7. Scope exclusions and prohibitions (C-8, C-9; §16.70.8)

**Preserved prohibitions:**

1. **PR #36 is not the admission mechanism.** It remains an unmerged review vehicle and must not be merged.
2. **`3eaec0e` must not be published alone.** The documentation commit enters only together with `b6e6224`.
3. **No representation that admission has occurred** before the C-6 remote proof, and no representation that the momentum defect is fixed on `main` before the merge lands.
4. **No re-derivation of the candidate** that changes either admitted commit ID. No squash, no rebase, no cherry-pick, no direct commit to `main`, no substituted implementation.
5. **No scope expansion:** no product consumer, no HTTP service, no IPD/IRR mapping or engine equivalence, no Row 26 E2E change, no Gate 3 / Gate 4 / Gate 5 movement, no fence or eligibility-policy change.

**Explicitly not established by this admission (C-8):**

- No product-consumer integration and **no broader E2E claim**; Row 26 E2E stays `NA` for the bounded library scope only and **is not changed** by this act.
- **No IPD/IRR equivalence** — neither taxonomy identity nor engine equivalence.
- No certification, no release, and **no operational-eligibility change**. `NON_PRODUCTION` remains the status.
- **Gate 3 remains BLOCKED / NOT ACCEPTED**; Gate 4 remains NOT EXECUTED; Gate 5 admission NOT GRANTED.
- The protected `503` owner-context fence, `SESSION_ONLY` / `durable:false`, the 29-key caller-identity guard and every recorded deferral are untouched.
- The open items of IRR **§16.65.3** remain open: `P11-02` recalculation/replay/snapshot/ownership; `CSIP_COMPOSITE` executor-dispatch semantics; `mode` / `governedIntelligenceInputs` semantics; UI05 compatibility; IPD/IRR mapping and engine equivalence; broader P15 lineage and golden-digest claims.
- The existing P11 bounded-acceptance record is **not** modified.
- Other implementation branches, unrelated defects, and IRRs records are out of scope.

---

## 8. Effect of this act

This act makes the admission decision and authorises the merge on C-3…C-6. It **creates no source change, moves no ref, and proves no admission by itself**. The admission becomes a fact only when, on the then-current `main`:

- a merge commit exists whose ancestry includes `3eaec0e`;
- all five blobs at remote `main` equal the candidate blobs in §1; and
- the C-7 addendum records the tree, the validation results and those proofs.

*End of the `D-06` main-admission act. Admission status at publication: **AUTHORIZED — NOT YET EXECUTED**.*
