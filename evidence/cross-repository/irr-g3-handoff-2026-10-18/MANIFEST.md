# IRR G3 Handoff — Manifest (corrected replacement, 2026-10-18)

Documentation-only registration of IPD Gate 3 G3-D0 and the G3-D1…D7 classification
in IRR (`ramkivs/iips-review-recovered`). Prepared in IPD
(`ramkivs/iips-production-market-data`). **Not applied to IRR by this package.
No implementation authority is granted or implied. Gate 3 is NOT GRANTED.**

## Baselines (independently resolved at preparation, 2026-10-18 UTC)

| Item | Value |
|---|---|
| Target IRR `main` (patch base — apply only at this exact SHA) | `82431e5b28ecc01a778e4f38427cbf294fa8eef5` (IRR PR #136 merge, 2026-10-18T15:29:29Z) |
| IPD authority baseline (decision source) | `9310b1a250221b3eb1a2d41566611e1206f61052` (IPD PR #22 merge, 2026-10-18T16:31:41Z) |
| IPD G3-D0 publication | PR #20 merge `8b65971f01862c66e24103ab2aeddcd84a43a05c`; receipt PR #21 merge `e76bb2ed57898da2e6c9fe503ea0c57fd88c3c8f` |
| Patch file | `irr-g3-d0-d1-d7-registration.patch` |
| Patch size | 93,634 bytes |
| Patch SHA-256 | `e3ab8cdafa366b847d696bfdb896ecc8fb6c67dad16bb080fcd1b8c5680d1f8c` |
| Expected diff | **6 files, 209 insertions, 9 deletions** (all Markdown) |

The IPD baseline above is the stable decision-publication reference. It is **not**
an implementation basis: any future Gate 3 act must pin the exact then-current
IPD `main` SHA at its own issue time. Later documentation-only IPD merges that
record this handoff do not change any decision cited here.

## Changed files (paths are IRR-repository-relative)

| # | File | Change | +/− | Resulting file SHA-256 (after patch) |
|---|---|---|---:|---|
| 1 | `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` | Banner; CV-20 row; §16.12 group/executed-rows (V1–V92); new §16.53 (`CV-CORR-36`, V89–V92); §19 row | +62/−5 | `9cb1414fe37e23bb76fbb1f35ce4730f021b1f987ff7a96489524fd331dd66f3` |
| 2 | `docs/integration/2026-10-18/BASELINE-AND-DECISION-PACKET-INDEX.md` | New PKG-02C row; PKG-02A/02B row notes | +3/−2 | `ffad9c44b8a73b5bea2a69b2364e0b8a64a666e8bb8c0fb4702cc35465f60b5e` |
| 3 | `docs/integration/2026-10-18/PKG-02A-CV20-DECISION-REQUEST-RECONCILIATION.md` | Dated addendum §13 (pointer) | +9/−1 | `13b4ff8797652d63c8d4559c4c12079f79a388fa0afc7ae64ad8ccf6a31b7c6f` |
| 4 | `docs/integration/2026-10-18/PKG-02B-CV20-OPTION-A-DESIGNATION-REGISTRATION.md` | Dated addendum §12 (pointer) | +10/−1 | `29dc4d2447d71ff075a8417197b88d37e1a33d3b836d7eb4e4510183be9893db` |
| 5 | `docs/integration/2026-10-18/PKG-02C-G3-D0-REGISTRATION.md` | **New** registration record | +116/−0 | `ae8bf32522c295aa810cdb82bab5f99a29c66b8173ab3c9a30c7d3b379526830` |
| 6 | `docs/integration/IIPS_v3.0_G2_IRR_DP1_IDENTITY_CREDENTIAL_TRUST_AMENDMENT_2026-10-16.md` | Dated addendum §12 (pointer; no clause amended) | +9/−0 | `bc366e01d1d580b31f48f54241b346ec0f014f8ddaa89d3f19d09fe19f11dbfa` |

Resulting-file hashes were computed on the validated tree (LF bytes). If a Windows
checkout materializes CRLF working-tree bytes, file hashes will differ while Git
blob content may still match — verify with `git diff` statistics first (see
`APPLY-ON-WINDOWS.md`).

## Relationship to the previous five-file package

The previous package was reported with ZIP SHA-256
`d2fcf5ebef40c64b63000a8e1b7f5ee468735cc7c9fbc5f34056d9002680282d`, patch SHA-256
`4c534a82fae1e32352c14d881473ee9cb6542281db6fb433eefa64c039a1ef3c`, 5 files,
101 insertions, 6 deletions. **That artifact was not available in this session's
workspace and was not found on either repository's `main`** (workspace search and
GitHub code search for `PKG-02C` returned no result); its reported hashes are
therefore task-supplied identifiers, not independently verified here, and its
contents were **not** inspected. This replacement was reconstructed from the
authoritative IPD records at `9310b1a…` against the verified IRR baseline above.
**Do not apply the old patch; it is superseded by this one.**

File-set change (one addition, no removals), with reason:

- **Added:** `PKG-02B-…-REGISTRATION.md` (file 4). PKG-02B §11 is the most recent
  IRR packet-level statement that the G3-D0 contradiction is open and that the
  Program Authority must answer “G3-D0 first”. Correcting the older PKG-02A
  without a matching dated pointer in PKG-02B would leave the latest packet
  internally stale; IRR PR #136 set the precedent of file-level dated addenda
  for both packets. The addition is a short pointer to PKG-02C/§16.53, not a
  duplicate decision record.
- All five previously reported files are retained; no file was removed.
- The larger diff (209 vs 101 insertions) is the G3-D1…D7 registration itself:
  the classification table, tracker §16.53 with V89–V92, and the PKG-02B
  pointer. A G3-D0-only patch prepared before IPD PR #22 could not contain the
  §13 classification or cite the PR #22 baseline/blob.

## Validation performed at preparation

1. Both remote `main` tips re-resolved (`git ls-remote` + GitHub API agree with
   the baselines above).
2. Patch applied with `git apply --check` and `git apply` to a **fresh clean
   clone checked out at `82431e5…`** — clean application; resulting tree is
   byte-identical to the build tree (`diff -r` excluding `.git`: no differences).
3. Complete resulting diff inspected; `git diff --check` passes (no whitespace
   errors); patch bytes are LF-only with no absolute paths.
4. Every changed path ends in `.md`; no path under `frontend/`, `src/`, or
   `iips-platform/`; no runtime, route, dependency, configuration, listener,
   CORS, persistence, or implementation change is present.
5. Content checked against IPD `evidence/cross-repository/`
   `IIPS_V3_G3_D0_DISPOSITION_2026-10-18.md` and
   `IIPS_V3_G3_IMPLEMENTATION_AUTHORITY_REQUEST_2026-10-18.md` §§11–13 at
   `9310b1a…`, including: G3-D5 recorded as **[A]** with the Program Authority
   confirmation expressly outstanding (no fabricated closure); G3-D7 recorded
   as an outstanding IRR-capacity decision with C8 **NOT MET**; no storage,
   write-slice, provisioning, or G-2 §3 question answered.

## Non-grants preserved

Registration only. No Gate 3 implementation authority; no durable write; no
`durable:true` claim (IPD stays `SESSION_ONLY`/`durable:false`); no IRR `503`
lift; no off-`main` promotion; no Windows Gate A′/Gate C execution (both **NOT
EXECUTED**); no qualification, admission, release, or production claim. IRR
PR #114 is untouched. Applying, committing, pushing, or merging this patch in
IRR remains a separate IRR-governed act.
