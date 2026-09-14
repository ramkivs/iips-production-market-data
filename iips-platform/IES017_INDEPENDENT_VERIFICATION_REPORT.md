# IES-017 — Independent Verification Report

**Standard:** IES-017 — Automobile Sector Engine
**Engine:** `sector.automobile`
**Executed:** 2026-09-02T17:48:05.4353267Z – 2026-09-02T17:48:09.5817815Z (UTC)
**Executed against:** `phase13-next` @ `ff1c90e48f65c6ca22e0f87d9d0ebfd3c927ca36`
**Authority:** DEC-A2-A1-TIER3-TEST-EXECUTION-AUTHORITY (execution) · DEC-A2-A1-TIER3-EXECUTION-EVIDENCE-AND-IV-REFRESH (evidence record; amend-in-place authority for this report) · DEC-A2-A1-EVIDENCE-ARTIFACT-CREATION-AUTHORITY section 3.3 (amend-only path authority) · DEC-D28-FENCE-RELIEF-AUTHORIZATION (fence-4 relief, historical) · DEC-D25-TIER3-EVIDENTIARY-STANDARD · DEC-D30-EXECUTION-LINEAGE-AND-ISSUANCE-AUTHORITY
**Executor:** `desktop-no0nhtp\user` — `DESKTOP-NO0NHTP`
**Verifier/reconciler:** `user` — role-separated, not organizationally independent

---

## 1. Independence model — read this first

This verification is **role-separated, not organizationally independent**.

It was performed under the same engineering role that produced the implementation. No
external organization, certification body, third-party auditor, or independent reviewer
was engaged, and none is claimed. Per DEC-D25-TIER3-EVIDENTIARY-STANDARD and the
D7-TIER3-INDEPENDENCE determination, the independence available at Tier-3 is separation
of the verifying activity from the authoring activity within one role, supported by
mechanical re-execution against frozen reference assets.

Anything here that could read as third-party assurance should instead be read as:
*the frozen oracle was re-executed and the implementation agreed with it.*

## 2. What was verified, and how

The command below was actually executed for this report. The numbers in section 3 are
the values it returned, not expectations.

Execution took place in `G:\IIPS\phase13-next-authority\iips-platform` on `phase13-next` @
`ff1c90e48f65c6ca22e0f87d9d0ebfd3c927ca36` under DEC-A2-A1-TIER3-TEST-EXECUTION-AUTHORITY,
in the worktree state that authority defines (four protected calibration modifications and
six untracked Tier-2 test files, none of which is one of the twelve files below). It was not
a fresh clone; no clean-clone claim is made.

Exact command (twelve explicit paths, no globs, `--no-install` honoured, nothing installed):

```
npx --no-install tsx --test tests/regression/telecommunications-acceptance.test.ts tests/regression/telecommunications-framework-integration.test.ts tests/regression/telecommunications-reuse-verification.test.ts tests/regression/telecommunications-wp4-validation.test.ts tests/regression/automobile-acceptance.test.ts tests/regression/automobile-framework-integration.test.ts tests/regression/automobile-reuse-verification.test.ts tests/regression/automobile-wp4-validation.test.ts tests/regression/materials-metals-acceptance.test.ts tests/regression/materials-metals-framework-integration.test.ts tests/regression/materials-metals-reuse-verification.test.ts tests/regression/materials-metals-wp4-validation.test.ts
```

The IES-017 share of that execution is the four regression kinds below. The SHA-256 values
are those pinned in DEC-A2-A1-TIER3-EXECUTION-EVIDENCE-AND-IV-REFRESH section 1.4 and were identical
before and after execution.

| # | Kind | File | Subtests | SHA-256 |
|---|---|---|:-:|---|
| 1 | acceptance | `tests/regression/automobile-acceptance.test.ts` | 13 | `35d8f133beb6df7a90ee06bbd272d52ed8f3690c95acdb545b2dabcd79bb0a87` |
| 2 | framework-integration | `tests/regression/automobile-framework-integration.test.ts` | 7 | `188b8a281609ee2bc3a7515c75773fb0b7dc8d8956527f93fd7b9aeebd2480a4` |
| 3 | reuse-verification | `tests/regression/automobile-reuse-verification.test.ts` | 4 | `c52b2ad6cc7d75c0ffb389c3d3cbc4771774bf0d11416eec7fa663ad127b62bc` |
| 4 | wp4-validation | `tests/regression/automobile-wp4-validation.test.ts` | 5 | `b3f8e695e5103ed16e3ee63142edc56650dd893daf66e0f2e477e72954f2effc` |

The other eight files in the same command are the corresponding four kinds for IES-016 and IES-020;
they ran in the same process and are reported in their own reports. Their pinned identities:

| Standard | Kind | File | Subtests | SHA-256 |
|---|---|---|:-:|---|
| IES-016 | acceptance | `tests/regression/telecommunications-acceptance.test.ts` | 13 | `2bf45b69cf58fd89c86cc8559bcb0801a37e2b2ca76acbe62808864d5de8ebf1` |
| IES-016 | framework-integration | `tests/regression/telecommunications-framework-integration.test.ts` | 7 | `ded96a3929bfd583ab1099c28b28979c2a9a471432e920ea0b1951c9a07a3b61` |
| IES-016 | reuse-verification | `tests/regression/telecommunications-reuse-verification.test.ts` | 4 | `d8ec7b9411b72dad08aea162eada516f6ea07dc6e61728748ea604bbd49852a1` |
| IES-016 | wp4-validation | `tests/regression/telecommunications-wp4-validation.test.ts` | 5 | `60aa5d1e5c796bc7eaf4599d46000c5359f298e2591b8e646e1ebfa8042a4fc1` |
| IES-020 | acceptance | `tests/regression/materials-metals-acceptance.test.ts` | 13 | `705e459d4af95e943a2d06e4aadebf2b89401b9fc0f7ffe07ac0c1cd1a097757` |
| IES-020 | framework-integration | `tests/regression/materials-metals-framework-integration.test.ts` | 7 | `7cc13c1c178c33e715495d002c7fbec4ede493fe6fbb72467f4e8ecb85367bd9` |
| IES-020 | reuse-verification | `tests/regression/materials-metals-reuse-verification.test.ts` | 4 | `d360930970dbce9cd85bc67b40cb408a1060c3a974a3ebcddf0f5847e5857a14` |
| IES-020 | wp4-validation | `tests/regression/materials-metals-wp4-validation.test.ts` | 5 | `7daa7da3afbc6fe408ae15f63fc311ec6daff63977698bbd2ccc4f8a648307be` |

**Not executed under the current authority:** `npx tsc --noEmit` and `npm test` were NOT
executed. DEC-A2-A1-TIER3-TEST-EXECUTION-AUTHORITY prohibits both; this report makes no current
typecheck claim and no current whole-platform suite claim.

### 2.1 Historical execution of 2026-08-30 — history only, not current evidence

The previous version of this report recorded an execution at 2026-08-30T18:02:53.309Z against
`phase13-next` @ `357b34dac1bd5cb555f38b2f9fa4cfa786fd65f9` (the parent of D28 commit `33838ac`;
the six D28 files were uncommitted at that instant). It reported `tsc --noEmit` PASS, IES-017
new regression tests 11/11, all six new Tier-3 regression tests 33/33, the complete Tier-3
suite 87/87 and `npm test` 606/606. Those figures are retained here as history only; they are
not current evidence for `ff1c90e` and were not re-run.

The framework-integration and reuse-verification files were materialized under D28 fence-4
relief as the kinds missing for IES-017 under the D5-S1 four-kind requirement; they were
verified by SHA-256 against the authoritative payload before the 2026-08-30 run and have not
been rewritten since (blob-identical from `33838ac` to `ff1c90e`).

## 3. Actual observed results

| Item | Value |
|---|---|
| IES-017 (4 files) | 29 subtests, 29 pass |
| Complete execution (12 files, three standards) | 87 subtests, 87 pass |
| Failed / cancelled / skipped / todo | 0 / 0 / 0 / 0 |
| Process exit code | 0 |
| Node / npm / tsx | `v24.14.0` / `11.9.0` / `v4.23.9` (tsx resolved locally under `--no-install`) |
| UTC window | `2026-09-02T17:48:05.4353267Z` – `2026-09-02T17:48:09.5817815Z` |
| `git status --porcelain=v1 --untracked-files=all` | identical before and after (the ten authorized baseline entries) |
| Index (`git diff --cached --name-only`) | empty before and after |
| HEAD | `ff1c90e48f65c6ca22e0f87d9d0ebfd3c927ca36` before and after |
| 22 relevant file hashes (12 Tier-3 tests, 4 protected calibrations, 6 untracked Tier-2 tests) | unchanged before and after |

Golden-reference anchor reproduced by these tests: **AB-001 → composite 71.3, verdict "Buy"**,
taken from the frozen `automobile-expected-outputs-1.0.0.json` oracle rather than asserted
independently of it.

No test was marked PASS that did not run. No unavailable test was converted into a PASS.

The complete console transcript (TAP output, stdout and stderr) is retained outside the
repository under the evidence custody of the executor and verifier/reconciler. It is not
committed, and no transcript file exists in the product repository.

## 4. Frozen-artifact provenance

`IES-017_FREEZE_MANIFEST.json` at `ff1c90e` carries twelve `documentHashes` entries plus a
`hashNormalization` note. The two entries added by the Tier-3 manifest refresh
(`architectureReview`, `authorityReview`) are SHA-256 digests of the repository LF blob
representation of the named files; the ten historical entries retain their CRLF-rendering
convention and were not recomputed. The earlier "10 verified / 0 bad" re-verification figure
belonged to the 2026-08-30 run and is not a current verification claim. **No artifact re-hash
was performed by the 2026-09-02 execution**; this report makes no current claim of
manifest-to-artifact agreement.

`releaseTag` is `null`. Per DEC-D31-MAINTAINER-ISSUANCE-AND-RELEASETAG-RESOLUTION a
releaseTag is not mandatory for Tier-3 A1 evidence; it is deferred, and **no Git tag was
created** by this work.

## 5. What was NOT verified — stated plainly

- **No organizational independence.** See section 1.
- **Architecture review: a document exists; no organisational review.** `IES-017_ARCHITECTURE_REVIEW.md`
  now exists, created under DEC-D36-TIER3-DOCUMENTATION-PARITY-AUTHORITY (commit `0a8e287`).
  It is new documentation, self-labelled as not recovered historical evidence, and it is not
  an organisational or third-party architecture review. The earlier statement that no such
  file exists was true at `357b34da` and is corrected here. Its content was not verified by
  this report.
- **Engineering-document set: documents exist; content not verified.** The
  `docs/IES-017_01_README.md` .. `docs/IES-017_19_REFERENCE_DATA_SOURCES.md` set now exists, created
  under the same D36 authority and commit. It is new documentation, not recovered evidence.
  The earlier statement that no D01..D19 set exists is corrected here. Its content was not
  verified by this report.
- **Evidence maturity is unchanged.** This report does not promote IES-017 from A2 to
  A1. That promotion is a separate authority gate and was not exercised. The integration
  verification matrix was not modified. D7-TIER3-PARITY and D7-TIER3-INDEPENDENCE remain open.
- **Pre-existing certificate assertions were not corrected.** The readiness certificate
  carries a pre-existing `M1–M15 ACCEPTED` assertion that neither D28 nor the current
  authority authorizes amending. It remains as found; this report neither endorses nor
  verifies it.
- **No typecheck, no whole-platform suite, no artifact re-hash under the current authority.**
  See sections 2 and 4.
- **IES-020 aluminium placement** and other known open items were out of scope.

## 6. Conclusion

Under the role-separated independence model in section 1, and on the evidence of the
2026-09-02 execution recorded above, the IES-017 engine implementation on `phase13-next` @
`ff1c90e48f65c6ca22e0f87d9d0ebfd3c927ca36` reproduces its frozen expected outputs, integrates
through the shared framework services without platform change, coexists with the other
sector engines and CSIP, and is replay-deterministic. These results support the D5-S1
four-kind regression limb of DEC-D25-TIER3-EVIDENTIARY-STANDARD; no other limb is claimed.
They do **not** establish organizational independence, do **not** close D7-TIER3-PARITY or
D7-TIER3-INDEPENDENCE, do **not** amend any matrix, manifest or certificate, and do **not**
constitute an A2 → A1 promotion.
