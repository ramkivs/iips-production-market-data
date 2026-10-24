# CAP-03 — IRR Post-Baseline Movement Receipt (second observation)

> ## STATUS: **DATED CROSS-REPOSITORY RECEIPT — DOCUMENTATION ONLY — NO DECISION, NO MUTATION OF IRR**
>
> This receipt extends `IIPS_V3_CAP03_IRR_POST_BASELINE_MOVEMENT_RECEIPT_2026-10-24.md` (receipt `-01`,
> published via PR #84) with a later observed IRR coordinate. It creates no authority, changes no DQ
> answer, adopts nothing, and does not make an IRR record from IPD or an IPD record from IRR. IRR remains
> read-only to this session.

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-CAP03-IRR-POST-BASELINE-MOVEMENT-RECEIPT-2026-10-24-02` (0 prior hits in IPD full-text grep and IRR GitHub code search before allocation) |
| **Record type** | Cross-repository dated receipt. Not an authority act, qualification result, acceptance or admission |
| **Prepared** | `2026-10-24` (UTC), during a one-pass IPD re-verification session on branch `arena/e5901db8-iips-production-market-data` |
| **IPD locus** | `ramkivs/iips-production-market-data` |
| **IRR locus observed read-only** | `ramkivs/iips-review-recovered` (no IRR tool, file, branch, PR, issue or comment touched) |
| **Reason** | IRR `main` advanced again after the `-01` receipt's snapshot (`a5e72dc4…`); this receipt records the new tip so the `-01` receipt's snapshot is not mistaken for current |

---

## 1. Step 0 — verified IPD coordinates before authoring this receipt

| Item | Measured value |
|---|---|
| IPD `main` / `origin/main` / session branch HEAD | all equal: `1b8eea4de3cb60f60550e0172d8fe9b4cc629f84`, tree `78d40cddac3e0c4580f1c0a8c4da79661bd05d71` — **no drift from the reference coordinate supplied for this pass** |
| IPD `main` CI | run `40073000043` (push, merge of PR #85) — **success** |
| Working tree | clean; no uncommitted changes prior to this receipt |
| PR #42 | **unchanged**: `OPEN`, `DRAFT`, head `afa430900c3e928773bd35a3718bf3d6c94ccff5`, `mergeStateStatus=DIRTY`, `mergeable=CONFLICTING` — re-verified this pass, not merged, not used as a base |
| Package pins | primary `2d9130e7…` and alias `70b24f02…` re-verified as full-history ancestors of IPD `main` (`git merge-base --is-ancestor`, exit `0` for both) |
| G24 reference-only commits | `6828155e…/c1b955b4…/2ded0e98…` still **absent from the IPD object database** (never fetched/merged); IRR-side `470cc698…/5eba01b6…` re-verified **`diverged`** from IRR `main` (not ancestors) |
| Fence/contract anchors (read-only, IRR `main`) | `51704c12…`, `cb8db45d668d28cee7e0a52721001d579a872733`, `e6b57bb8a021d8eb4b9b7572d12affc7de66be0b`, `981470541812a64c733309f1debec75455d85bee` — all **byte-identical** to every prior receipt |
| Package manifests (read-only, IRR `main`) | `frontend/package.json` `6274537a…`, `frontend/package-lock.json` `05ade78c…` — **unchanged** |
| Local validation on the unmodified IPD tree | `npm ci` exit `0`; `npx tsc --noEmit` exit `0`; `npm run build` exit `0` (**1,140** `dist/**` files); `npm test` — **897 executed / 896 passed / 0 failed / 1 skipped**, `[test-guard] OK`; `npm run test:package-consumer` — `"result":"PASS"`, shasum `cc2aa70186b8fd7bc7255452ac8d8b00d094f53e`, `"durability":"SESSION_ONLY"`, `"durable":false` — **identical to the figures already published in the DQ/host-readiness pass; zero drift** |
| Designated host `desktop-no0nhtp` | `getent hosts` / `ping` → **`Name or service not known`** — unreachable, unchanged |

No mutation to any protected artifact, pin, fence or guard was made or is made by this receipt.

---

## 2. IRR coordinates: `-01` receipt snapshot vs. current observation

| Item | `-01` receipt snapshot (PR #84, as later re-observed) | Current observation (this receipt) |
|---|---|---|
| IRR `main` commit | `a5e72dc4d7b1e76ad19e591f427ef3b58d6f9ac8` | **`991d8c1b0f8debc753b2932b2584019c91b5e507`** |
| IRR `main` tree | `49aab1feda71278e259e9f9bd7f997b46588871e` | **`ed5d5b58ef01d9b74eeb2a0bb559947c4080c92b`** |
| Ancestry | — | `a5e72dc4…` **is an ancestor** of `991d8c1b…`; regular merges; no force-push, no rewrite (`git compare` `status: ahead`, `ahead_by: 10`) |
| IRR `main` CI at new tip | — | run `40074232008` — **success** |
| Open IRR PRs | `[]` | **`[]`** — unchanged |
| Changed paths, `a5e72dc4… → 991d8c1b…` | — | **exactly two**: `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` and a **new** file `docs/integration/IIPS_v3.0_CAP03_PA_DECISION_PACKET_DQ1-DQ7_PROPOSED_2026-10-24.md` (IRR-authored, `328` lines added, filename itself labelled `PROPOSED`) |

This is again documentation-only drift. **No source, test, script, package, lockfile, CI workflow, route,
fence or consumer-contract path changed.**

---

## 3. External publications accounting for the movement

All of the following were performed outside this IPD session. This receipt asserts only what the IRR/GitHub
records and remote objects show.

| Event | Verified value |
|---|---|
| IRR PR **#236** | `docs(runbook): record PR #235 publication receipt (§16.96.4, CHG-2026-10-24-04)`; merged `2026-10-24T07:09:21Z` as `92b65c59b5dd92fb53aa38c6fd63f25e3e0b8df5`; tracker-only, `+15/−0` |
| IRR PR **#237** | `docs(cap03): publish PA decision packet DQ-1..DQ-7 as PROPOSED - NOT EFFECTIVE (§16.97, CV-CORR-80)`; merged `2026-10-24T07:15:14Z` as `9c2dd176ee14520c0fd2e3e9ba113e7d46f088db`; adds the new `docs/integration/...DQ1-DQ7_PROPOSED...` file (`328` lines) plus a tracker append (`+52/−1`) |
| IRR PR **#238** | `docs(cap03): record PR #237 publication receipt (§16.97.4, CHG-2026-10-24-06)`; merged `2026-10-24T07:18:24Z` as `7c27220fa078912c0e1d6990067b6041f52a939b`; tracker-only, `+15/−0` |
| IRR PR **#239** | `docs(cap03): register IPD PRs #82-85 and correct same-day receipt assertions (§16.98, CV-CORR-81)`; merged `2026-10-24T07:23:54Z` as `a99a1a16d508a0bab3c51373a33af7c83731439d`; tracker-only, `+63/−2` |
| IRR PR **#240** | `docs(cap03): record PR #239 publication receipt (§16.98.6, CHG-2026-10-24-08)`; merged `2026-10-24T07:27:53Z` as `991d8c1b0f8debc753b2932b2584019c91b5e507` (= new IRR `main`); tracker-only, `+16/−0` |

PR #239's title indicates IRR's own register was updated to reflect **this IPD repository's** PRs #82–#85
(the DQ packet, host-readiness packet and the `-01` movement receipt). That is IRR recording IPD facts in
its own locus; it is not an instruction to, or a record created by, IPD, and this receipt does not treat it
as one.

---

## 4. Effect on the DQ packet, the host-readiness packet and current blockers

1. **No rendered DQ-1…DQ-7 act exists anywhere** at the new IRR tip. IRR PR #237 published its own mirror
   document explicitly filenamed and labelled `PROPOSED - NOT EFFECTIVE` (`CV-CORR-80`); it is a
   counterpart record, not a Program Authority decision, and does not supply the Track B/C entry condition.
2. **The effective IPD DQ packet and host-readiness packet are unmodified** (`f96492c1…`, `9d9c5970…`,
   per PR #82's read-back) and remain the authoritative preparation record in this locus. This receipt does
   not edit, supersede, or restate their content.
3. **No IRR↔IPD equivalence, identity-value selection, or provisioning** is made by this receipt. The
   existing IPD-owned S1 determination (PR #80/#81) remains the sole authority for those three values.
4. **No final IRR consumer pin changes.** `4740ba21…` remains the Gate 4 consumer pin named by the
   effective amendment act; the new tip (`991d8c1b…`) is an observation for drift accounting only.
5. **Host readiness is unchanged.** `desktop-no0nhtp` remains unreachable; no store/endpoint/final
   pin/adopted `H-12` exists; QE remains **0/11**; Track C did not start.
6. **PR #42 is unchanged** — still `OPEN`/`DRAFT`/`DIRTY`/`CONFLICTING` at head `afa43090…`; DQ-6's
   Option A/B/C/D analysis (close as superseded / leave annotated / merge — prohibited / rebase as a new
   base — prohibited) remains the only recorded disposition path, and no option has been selected by any
   Program Authority act.
7. **W-1 is unchanged.** `evaluatePortSaveGuard()` is re-verified hard-false this pass with the same two
   reasons (`W-1(3)`, `W-1(4)`); `SESSION_ONLY` / `durable:false` are re-verified unchanged by direct test
   execution (§1 above), not by inference.

---

## 5. Attestation

| Claim | Value |
|---|---|
| IRR file, branch, commit, PR, issue or comment modified by this IPD pass | **NO** |
| IRR main movement authored/approved by this pass | **NO — external publications #236/#237/#238/#239/#240** |
| New DQ act or PA decision present at the new IRR tip | **NO — IRR's own mirror document is explicitly labelled `PROPOSED - NOT EFFECTIVE`** |
| Fence/package/consumer path changed by the movement | **NO — tracker and one new IRR-authored doc only** |
| PR #42 merged, rebased, or used as a base | **NO — re-verified `DRAFT`/`DIRTY`/`CONFLICTING`, unchanged head** |
| H-12 adopted, Gate 4/5 advanced, W-1 changed, or any write enabled | **NO** |
| IPD `main`/`origin/main`/session-branch coordinate drift since the reference coordinate | **NO — all equal to `1b8eea4…`** |
| Qualification, acceptance, admission, write, production eligibility, `durable:true` or `TD-7b` claimed | **NO** |

*End of `IIPS-V3-CAP03-IRR-POST-BASELINE-MOVEMENT-RECEIPT-2026-10-24-02`.*
