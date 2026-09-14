# IES-016 — Final Readiness Certificate (Tier-3, Role-Separated Evidence)

**Standard:** IES-016 — Telecommunications Sector Engine
**Engine:** `sector.telecommunications`
**Evidence maturity:** A2 (unchanged)
**Issued:** 2026-09-03
**Issuer:** IIPS Engineering Standards Maintainer (A2 Tier-3 readiness gate)
**Status:** FINAL-READINESS EVIDENCE COMPLETE UNDER ROLE-SEPARATED VERIFICATION — NOT AN A1 PROMOTION
**Authority:** DEC-A2-A1-EVIDENCE-ARTIFACT-CREATION-AUTHORITY section 3.4 (`809ebf9c`) · DEC-A2-A1-TIER3-FINAL-READINESS-ISSUANCE-AND-CONTENT-AUTHORITY (`037c9ba1`) · DEC-A2-A1-TIER3-EXECUTION-EVIDENCE-AND-IV-REFRESH (`9da79251`) · DEC-A2-A1-TIER3-TEST-EXECUTION-AUTHORITY (`3dbc5bc5`) · DEC-D25-TIER3-EVIDENTIARY-STANDARD · DEC-D31-MAINTAINER-ISSUANCE-AND-RELEASETAG-RESOLUTION · DEC-D35-MAINTAINER-ISSUANCE-PERFORMED
**Product baseline:** `phase13-next` @ `245be839e71975f79b675c861bdf3b3ea423722c`

---

## 1. Independence model — read this first

This certificate records **role-separated, not organizationally independent** evidence, per the
verification model of DEC-D15-VERIFICATION-METHODOLOGY section 4.3:

1. **Verifier identity.** The verification evidence was produced and reconciled by the parties named
   below, acting in separated roles within the same engineering function.
2. **Meaning of "independent".** In this programme "independent" denotes role separation plus
   clean-workspace reproducibility. **Clean-workspace (clean-clone) reproducibility was NOT exercised**
   for the evidence in this certificate: the execution took place in the authorized dirty worktree
   described in section 3.
3. **Not claimed.** No organizational, external, third-party or accredited independence is claimed.
   No external organization, certification body, third-party auditor or independent reviewer was engaged.

**Executor:** `desktop-no0nhtp\user` — `DESKTOP-NO0NHTP`
**Verifier/reconciler:** `user` — role-separated, not organizationally independent

## 2. Evidence basis — pinned

All product artifacts are pinned at `phase13-next` `245be839e71975f79b675c861bdf3b3ea423722c`;
governance records are pinned at their `arena/01a03e3b-iips-review-recovered` commits. The four
regression files below are the IES-016 share of a single twelve-file execution (section 3).

| Evidence | Path | Commit | SHA-256 |
|---|---|---|---|
| Independent-verification report (refreshed, current) | `iips-platform/IES016_INDEPENDENT_VERIFICATION_REPORT.md` | `245be839` | `ee449dbb6cc19885ac84763134252a6d94dd6a38ad2b3e1b1cb1048fa02e5695` |
| Freeze manifest (refreshed; `status` FROZEN; `releaseTag` null) | `ies-016-telecommunications/IES-016_FREEZE_MANIFEST.json` | `245be839` | `3d2b53835efdb8df21d4cb1dc67e4e535833954c8921653a0c5de16f4086e69f` |
| Regression test (acceptance, 13 subtests) | `iips-platform/tests/regression/telecommunications-acceptance.test.ts` | `245be839` | `2bf45b69cf58fd89c86cc8559bcb0801a37e2b2ca76acbe62808864d5de8ebf1` |
| Regression test (framework-integration, 7 subtests) | `iips-platform/tests/regression/telecommunications-framework-integration.test.ts` | `245be839` | `ded96a3929bfd583ab1099c28b28979c2a9a471432e920ea0b1951c9a07a3b61` |
| Regression test (reuse-verification, 4 subtests) | `iips-platform/tests/regression/telecommunications-reuse-verification.test.ts` | `245be839` | `d8ec7b9411b72dad08aea162eada516f6ea07dc6e61728748ea604bbd49852a1` |
| Regression test (wp4-validation, 5 subtests) | `iips-platform/tests/regression/telecommunications-wp4-validation.test.ts` | `245be839` | `60aa5d1e5c796bc7eaf4599d46000c5359f298e2591b8e646e1ebfa8042a4fc1` |
| Execution-evidence record (87/87 at `ff1c90e`) | `governance/iips/DEC-A2-A1-TIER3-EXECUTION-EVIDENCE-AND-IV-REFRESH.md` | `9da79251` | `639b87cba1256a007015deb94c540bc8e4bb5dd527a83f9bf99a668a2460157e` |
| Issuance and content authority for this certificate | `governance/iips/DEC-A2-A1-TIER3-FINAL-READINESS-ISSUANCE-AND-CONTENT-AUTHORITY.md` | `037c9ba1` | `e7839aeaaa5a1c31a2d5f6e8e16469e970ce086c732999002c15357ec8f032d2` |
| Implementation-readiness certificate — evidence only — not the final-readiness instrument | `ies-016-telecommunications/IES-016_IMPLEMENTATION_READINESS_CERTIFICATE.md` | `245be839` | `1c2a85630c7991d241346eab10ea0e0c5068e8a8d6689db868927f71768e6b01` |
| D36 documentation set — new documentation, self-labelled, not recovered review evidence | `ies-016-telecommunications/docs/IES-016_01_README.md` .. `ies-016-telecommunications/docs/IES-016_19_REFERENCE_DATA_SOURCES.md`, `ies-016-telecommunications/IES-016_ARCHITECTURE_REVIEW.md`, `ies-016-telecommunications/D16_AUTHORITY_REVIEW.md` | `0a8e287` | per manifest `documentHashes` (`architectureReview`, `authorityReview`) |

Notes on the last two rows. The implementation-readiness certificate carries the D35 issuance
fields (`Issued` 2026-08-29, `Issuer` IIPS Engineering Standards Maintainer, `Status` AUTHORIZED) and a
pre-existing `M1–M15 ACCEPTED` template assertion recorded as an open defect by
DEC-D25-TIER3-EVIDENTIARY-STANDARD section 9; it is cited as evidence of the maintainer's implementation
authorization only and is neither endorsed nor verified here. The D36 documentation set was created at
`0a8e287` under DEC-D36-TIER3-DOCUMENTATION-PARITY-AUTHORITY as new documentation; it is not recovered
historical evidence and it is not a performed review.

## 3. Execution provenance

Executed under DEC-A2-A1-TIER3-TEST-EXECUTION-AUTHORITY in `G:\IIPS\phase13-next-authority\iips-platform`
on `phase13-next` @ `ff1c90e48f65c6ca22e0f87d9d0ebfd3c927ca36` (the parent of `245be839`; the twelve test
files and all source they exercise are blob-identical between the two commits).

Exact command (twelve explicit paths, no globs, `--no-install` honoured, nothing installed):

```
npx --no-install tsx --test tests/regression/telecommunications-acceptance.test.ts tests/regression/telecommunications-framework-integration.test.ts tests/regression/telecommunications-reuse-verification.test.ts tests/regression/telecommunications-wp4-validation.test.ts tests/regression/automobile-acceptance.test.ts tests/regression/automobile-framework-integration.test.ts tests/regression/automobile-reuse-verification.test.ts tests/regression/automobile-wp4-validation.test.ts tests/regression/materials-metals-acceptance.test.ts tests/regression/materials-metals-framework-integration.test.ts tests/regression/materials-metals-reuse-verification.test.ts tests/regression/materials-metals-wp4-validation.test.ts
```

| Item | Value |
|---|---|
| UTC window | `2026-09-02T17:48:05.4353267Z` – `2026-09-02T17:48:09.5817815Z` |
| Node / npm / tsx | `v24.14.0` / `11.9.0` / `v4.23.9` |
| IES-016 (4 files) | 29 subtests, 29 pass |
| Complete execution (12 files, three standards) | 87 subtests, 87 pass |
| Failed / cancelled / skipped / todo | 0 / 0 / 0 / 0 |
| Process exit code | 0 |
| Worktree condition | authorized dirty worktree: four protected calibration files modified, six untracked Tier-2 test files present; none is one of the twelve executed files; **not a fresh clone** |
| `git status --porcelain=v1 --untracked-files=all` | identical before and after (the ten authorized baseline entries) |
| Index / HEAD | index empty before and after; HEAD `ff1c90e` unchanged |
| Twenty-two relevant file hashes (12 Tier-3 tests, 4 protected calibrations, 6 Tier-2 tests) | unchanged before and after |
| Transcript | retained outside the repository under evidence custody; not committed; no transcript file exists in the repository |

**Not executed and not current under any authority in this chain:** `npx tsc --noEmit`; `npm test`;
any artifact re-hash against the freeze manifest; any clean-clone execution. None of these is claimed.

## 4. Tier-3 readiness checklist

Rows are limited to what is actually established at `245be839`.

| # | Item | Standing |
|---|---|---|
| 1 | Frozen reference assets present; freeze manifest `status` FROZEN (`approver` IIPS Engineering Standards Maintainer, `freezeDate` 2026-08-29, per DEC-D35) | ESTABLISHED |
| 2 | Golden-reference anchor reproduced by the acceptance test: **TC-001 → composite 77.8, verdict "Buy"**, taken from the frozen `telecommunications-expected-outputs-1.0.0.json` oracle rather than asserted independently of it | ESTABLISHED |
| 3 | Four regression kinds present and passing (acceptance 13, framework-integration 7, reuse-verification 4, wp4-validation 5) | ESTABLISHED (29/29) |
| 4 | Replay determinism, to the extent established by the acceptance test | ESTABLISHED (acceptance test only) |
| 5 | No platform, framework, other-engine or CSIP change by the Tier-3 evidence work | ESTABLISHED |
| 6 | `releaseTag` | `null`, deferred per DEC-D31 (not mandatory for Tier-3); no Git tag exists or is created |
| 7 | Clean-clone verification | NOT PERFORMED |
| 8 | Typecheck (`tsc --noEmit`) under the current authority | NOT PERFORMED |
| 9 | Whole-platform suite (`npm test`) under the current authority | NOT PERFORMED |
| 10 | Artifact re-hash against the freeze manifest | NOT PERFORMED |

Rows 7 to 10 are listed so that their absence is explicit; none is presented as satisfied.

## 5. Limitations and D7 disclosures — stated plainly

- **`D7-TIER3-INDEPENDENCE` — OPEN.** No organizational independence exists or is claimed; the
  independence available is role separation only (section 1).
- **`D7-TIER3-PARITY` — OPEN.** `IES-016_ARCHITECTURE_REVIEW.md` is a D36 header-only stub, not a
  performed architecture review. The nineteen-document `docs/` set is new, unreviewed documentation created
  under D36. Neither has been re-evaluated against the A1 parity standard, and this certificate does not do so.
- **No clean-clone verification** exists for this engine.
- **Historical material remains historical.** The 2026-08-30 execution at `357b34da` (its typecheck,
  whole-platform-suite and manifest re-verification figures, recorded in the independent-verification
  report section 2.1) is history only and is not current evidence for `245be839`.
- **`M1–M15 ACCEPTED` template defect.** The implementation-readiness certificate's assertion is an open
  template defect (DEC-D25 section 9); it is neither endorsed nor verified by this certificate.
- **Known open items.** The IES-020 aluminium-placement item (`DEC-D25-TIER3-EVIDENTIARY-STANDARD` section 9) remains OPEN programme-wide; it is not an IES-016 item and was out of scope for the evidence above.

## 6. Non-promotion statement

- IES-016 **remains A2**; its evidence maturity is unchanged by this certificate.
- This certificate **does not constitute an A2 → A1 promotion**.
- The Integration Verification Matrix (`cada0451400409b0fe9ff0d62309b756c7b45e43`, seven A1 / seven A2)
  **remains unchanged**.
- **No release is made, no Git tag is created, and no promotion is performed.**
- No certification beyond the creation of this evidence artifact is implied, and no authority beyond
  that creation is exercised.
- `D7-TIER3-PARITY` and `D7-TIER3-INDEPENDENCE` are **not closed** by this certificate.

This certificate records that the Tier-3 final-readiness evidence gap defined by
DEC-A2-A1-CLOSURE-STRATEGY section 5 has been filled for IES-016 under a role-separated model, on the
pinned evidence above. It is a Tier-3 evidence artifact; it is not an A1 instrument and does not by
itself satisfy the A1 definition of DEC-D5-EVIDENCE-MATURITY section 2.
