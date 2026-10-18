# Apply on Windows — IRR G3 handoff (corrected replacement, 2026-10-18)

Apply `irr-g3-d0-d1-d7-registration.patch` to an IRR checkout of
`ramkivs/iips-review-recovered`. See `MANIFEST.md` (same folder/ZIP) for
baselines and hashes. **This handoff grants nothing by itself; committing or
merging it in IRR is a separate IRR-governed decision.**

> Protect your existing local IRR branch: do **not** reset, rebase, or apply
> onto it. Work on a brand-new branch cut from the verified `origin/main`
> below, review there, and leave your existing branch untouched.

## 1. Verify the baseline before touching anything (PowerShell, in your IRR clone)

```powershell
git fetch origin
git rev-parse origin/main
# MUST print: 82431e5b28ecc01a778e4f38427cbf294fa8eef5
git status
```

If `origin/main` prints anything else, **STOP**. The patch was built for that
exact commit only. Do not force-apply it to a newer `main` — ask for the
handoff to be re-reconciled against the new tip first.

Verify the patch bytes you downloaded:

```powershell
Get-FileHash .\irr-g3-d0-d1-d7-registration.patch -Algorithm SHA256
# MUST print: E3AB8CDAFB366B847D696BFDB896ECC8FB6C67DAD16BB080FCD1B8C5680D1F8C
```

## 2. Cut a new branch and apply

```powershell
git switch -c docs/g3-d0-registration-2026-10-18 origin/main
git apply --check .\irr-g3-d0-d1-d7-registration.patch
git apply .\irr-g3-d0-d1-d7-registration.patch
```

`git apply --check` must produce no output (success). If either command errors,
STOP and report the exact message; do not use `--reject`, `--3way`, or manual
patching to force it.

## 3. Verify the result matches the manifest

```powershell
git add -A
git diff --cached --stat
# MUST show: 6 files changed, 209 insertions(+), 9 deletions(-)
git diff --cached --check
# MUST produce no output (no whitespace errors)
git diff --cached --name-only
# MUST list exactly the 6 Markdown files in MANIFEST.md — nothing else
```

Then read the full diff before committing:

```powershell
git diff --cached
```

Confirm with your own eyes: documentation only; G3-D0 registered as resolved;
G3-D2…D7 still outstanding (G3-D5 confirmation **not** claimed; G3-D7/C8 still
open); fences unchanged; no file under `frontend\`, `src\`, or `iips-platform\`.

Line endings: the patch is LF-only. If `git diff --cached --stat` shows
whole-file churn far beyond 209/9, your clone is likely converting line
endings (`git config core.autocrlf`). STOP, do not commit the churn; run
`git config core.autocrlf false` in this clone, discard the branch, and redo
steps 2–3.

## 4. Commit locally (publication is a separate IRR act)

```powershell
git commit -m "docs(g3): register G3-D0 resolution and G3-D1-D7 classification (PKG-02C; tracker 16.53 / CV-CORR-36) - Gate 3 NOT GRANTED"
git log --oneline -2
git status
```

Stop here unless you separately decide, under IRR governance, to push the
branch and open a PR. Any push/PR/merge must go through IRR CI and your own
review. Do not merge it into, or onto, your pre-existing local branch without
reviewing the branch diff first (`git diff origin/main..HEAD`).

## Expected outcome and non-outcomes

- In: tracker §16.53, `PKG-02C-G3-D0-REGISTRATION.md`, and dated pointer
  addenda (PKG-02A §13, PKG-02B §12, DP-1 amendment §12, packet index).
- Still true afterwards: IRR `/api/user-portfolios*` returns HTTP 503; IPD is
  `SESSION_ONLY`/`durable:false`; **Gate 3 NOT GRANTED**; next step remains
  your Program Authority response beginning with G3-D2 (storage technology).
- Not done by this patch: any code, test, route, CORS/listener, dependency,
  provisioning, persistence, Windows Gate A′/Gate C, qualification, admission,
  or production step. IRR PR #114 is untouched.
