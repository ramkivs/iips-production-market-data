# IIPS v3.0 CAP-03 — DQ-6b Decision: IPD-Locus Mirror Receipt (**PUBLISHED — EFFECTIVE AS REGISTRATION**)

> ## STATUS: **DATED CROSS-REPOSITORY RECEIPT — PUBLISHED IN THE IPD LOCUS — REGISTRATION ONLY**
>
> This receipt registers, in the IPD locus, an IRR-locus determination that names two IPD commits. It
> creates no authority, answers no DQ, moves no pin, relaxes no guard, adopts nothing and admits
> nothing. It does not convert an IRR act into an IPD act, and it imports no authority back into IRR.

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-CAP03-DQ6B-IPD-MIRROR-RECEIPT-2026-10-25-01` (census before publication: **0** occurrences in IPD; **7** in IRR at `ac6d45b6…`, all attributable to the prepared record and its tracker entries) |
| **Record type** | Cross-repository **dated receipt** — mirrors an IRR-locus determination into the IPD locus. Creates no authority, adopts nothing, admits nothing |
| **Status** | **PUBLISHED — EFFECTIVE AS REGISTRATION.** Satisfies effectiveness element **6** of the subject decision on independent remote read-back; exact terms at §8, coordinates at §7 |
| **Subject** | `IIPS-V3-CAP03-DQ6B-PA-DECISION-2026-10-25-01` (Path A, interim, guarded) |
| **Prepared in the IRR locus** | `docs/integration/IIPS_v3.0_CAP03_DQ6B_IPD_MIRROR_RECEIPT_PREPARED_2026-10-25.md` — blob `e1558f2c1233919e5d5c62d77ed1305f6d3b177f`, **5,470 B**, SHA-256 `a8cf94ea66c60cc280e7c1e0eaa2a5dab7d78ad34c6ee693c4d2d2752a47f120`, re-read at IRR `main@ac6d45b695bf9b79c0ec7af7d4656dc914ffccb2` |
| **Mirrored by** | An **IPD-capable** session on branch `arena/d677a106-iips-production-market-data`, from IPD `main@8eec74ae27cda09f3c368b9c299895eae41554db` / tree `4eba29029f8d95cfe483e615a7047426b298ce50` — **zero drift** at Step 0 (§6) |
| **IPD locus** | `ramkivs/iips-production-market-data` — this file |
| **IRR locus** | `ramkivs/iips-review-recovered` — observed **read-only**; **zero IRR writes** by this pass |
| **IPD tracker locus** | `evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md` — dated entry published with this file |
| **Preserved text** | §§1–5 below are the prepared IRR text, **reproduced verbatim**, including the §5 attestation exactly as it stood at preparation. §5's "not published" claims are superseded by §7 by **dated pointer, not silent rewrite** |
| **Publication coordinates** | Commit, tree, blob id, SHA-256, CI run ids and the independent remote read-back are **not self-embedded**; they are established after the merge and recorded in the IPD tracker receipt (established practice in this locus) |

**Why this file is not a rewrite of the prepared text.** The determination's identity, its wording, both
IPD commit/tree coordinates, the alias disposition and every cited IRR coordinate are carried over
without alteration. Only the status front matter above and §§6–9 are new. §4 below is preserved as the
instruction that was received and executed; its execution result is §6, not an edit to §4.

---

## 1. What the IPD locus receives

| Item | Value to record |
|---|---|
| Determination | **DQ-6b → Path A**: the CAP-03 final QE freeze may designate the qualified **split** primary/alias baseline |
| Primary IPD coordinate | `8eec74ae27cda09f3c368b9c299895eae41554db` / tree `4eba29029f8d95cfe483e615a7047426b298ce50` — IPD `main`, **0 behind** |
| Alias coordinate | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` / tree `cc0f0117822850f9046e9a51bd05c1d45f80cd57` — **214 behind**, ancestor, **interim and guarded** |
| Alias disposition | **Preserved.** Not modernized, not re-pinned, not retired |
| Split status | **INTERIM — not a permanent architecture decision** |
| Lineage classification | **Preserved as-is**: `REAL` at the alias (three mapper sites), `UNCLASSIFIED` at the primary. No reclassification, no requalification |
| Guards | Preserved in force and binding at the freeze; not relaxed |
| IPD-side change required by Path A | **None.** Path A is an IRR-locus act; it mutates no IPD file |
| Modernization follow-on | Open, **not authorized**, off critical path (`CAP03-DQ6B-FOLLOW-ON-ALIAS-MODERNIZATION`) |

## 2. Why the IPD locus is a legitimate recipient

1. The decision **names two IPD commits** and fixes their roles for the CAP-03 freeze. IPD is the
   provider locus and its tracker already carries cross-repository receipts
   (`IIPS_V3_CAP03_IRR_POST_BASELINE_MOVEMENT_RECEIPT_2026-10-24.md` and `…_RECEIPT_2_…`).
2. The receipt is **registration only**. It renders no IPD decision, opens no admission path, and does
   not convert the IRR act into an IPD act.
3. It explicitly preserves the **DQ-6a** IPD disposition
   (`IIPS-V3-IPD-PR42-CLOSE-WITH-RECORD-PA-DISPOSITION-2026-10-24-01`) unchanged. DQ-6b is answered
   without reopening, qualifying or contradicting DQ-6a.

## 3. What publishing this receipt does **not** do

It does not: establish the DQ-4 final QE freeze; adopt H-12; qualify or accept Limb A content;
authorize any IPD package-surface change; add any export or `files` entry; move the alias; reclassify
lineage; lift a fence; start Gate 4; grant QE credit; initiate or admit Gate 5; claim durable-read
acceptance or production eligibility; or create any admission path for IPD PR #42, #34 or #41.

## 4. Exact publication instructions for the IPD-capable session

1. Confirm IPD `main` is still `8eec74ae27cda09f3c368b9c299895eae41554db` (tree `4eba2902…`). If it has
   advanced, re-verify that `package.json` (blob `51796e63…`), `src/persistence/portfolio_store.ts`
   (blob `540d49f2…`) and the three divergent alias sources are unchanged before mirroring; if any has
   changed, **stop** and record drift rather than mirroring a stale coordinate.
2. Add this receipt verbatim at
   `evidence/cross-repository/IIPS_V3_CAP03_DQ6B_DECISION_MIRROR_RECEIPT_2026-10-25.md`.
3. Add a dated entry to the IPD execution tracker naming the IRR act ID, the IRR publication commit and
   this receipt's blob identity.
4. Merge to IPD `main` by **merge commit** with green exact-head CI; record the merge commit, tree and
   post-merge CI run.
5. Read back the receipt blob and SHA-256 from the remote.
6. On completion, effectiveness element **6** of `IIPS-V3-CAP03-DQ6B-PA-DECISION-2026-10-25-01` is
   satisfied, and the IRR tracker §16.122 records that the six-element set is complete.

## 5. Attestation for this preparation

| Claim | Value |
|---|---|
| IPD file, branch, commit, PR, issue or comment modified by this pass | **NO** |
| This receipt effective | **NO — prepared only** |
| Any effectiveness element claimed as satisfied by this file | **NO** |
| IRR coordinates cited here verified read-only | **YES** — `8eec74ae…`/`4eba2902…`, `70b24f02…`/`cc0f0117…`, IRR `ba64b2d…`/`5e4262f1…` |

---

## 6. Step 0 — verification executed in the IPD locus before mirroring

The stop condition carried in the prepared text (§4, item 1) was executed **first**, against IPD
`origin/main` — not against the coordinate quoted in any instruction.

| # | Check | Verified value (`2026-10-25`, IPD full-history clone + GitHub API) | Result |
|---|---|---|---|
| `M-1` | IPD `origin/main` = `main` = session base | `8eec74ae27cda09f3c368b9c299895eae41554db` / tree `4eba29029f8d95cfe483e615a7047426b298ce50` — **exactly** the coordinate named by the decision and by the prepared text; **0 drift** | **PASS** |
| `M-2` | IPD `main` CI and open PRs at that coordinate | run `40196407747` **success**; **0** open PRs | **PASS** |
| `M-3` | Stop-condition anchor `package.json` | blob `51796e63280c1abb368c27bf8811cc6bad46e132` — unchanged | **PASS — proceed** |
| `M-4` | Stop-condition anchor `src/persistence/portfolio_store.ts` | blob `540d49f2deb2c8d600b5b866675d145cf76a1e46` — unchanged | **PASS — proceed** |
| `M-5` | Alias coordinate | `70b24f029842a7e9b7f615e4d9df7376fd4ff817`, tree `cc0f0117822850f9046e9a51bd05c1d45f80cd57`; `git merge-base --is-ancestor` exit `0`; `git rev-list --count alias..main` = **214** | **PASS** |
| `M-6` | All **14** alias raw sources vs the primary | **10 identical / 4 divergent**: `broker-holdings-mapper.ts` `6c8ab71d…`/`297e4a59…`, `broker-import-ingress.ts` `12824fbb…`/`0742401f…`, `src/identity/security_master.ts` `e260fd90…`/`60030e0c…`, `src/contracts/types.ts` `11f86dca…`/`a644c833…` — **byte-identical to the decision record §4.1 census** | **PASS — no drift** |
| `M-7` | Lineage classification | alias mapper `sourceClassification: 'REAL'` at **3** sites (lines 262 / 337 / 360); primary mapper `'UNCLASSIFIED'` at the same **3** sites — preserved as-is | **PASS** |
| `M-8` | IRR decision record | `IIPS_v3.0_CAP03_DQ6B_PA_DECISION_PATH_A_EFFECTIVE_2026-10-25.md`, blob `b41c76f7ddbacc0caa0a86877561a83d2ba1c2a6`, **23,808 B**, SHA-256 `c82c569ad8830ed8c69e44d765a7afc765bab39846e6f916ea21a16933a44b1a` — equal to the value recorded in IRR tracker §16.122.14 | **PASS** |
| `M-9` | Prepared receipt text | blob `e1558f2c…`, **5,470 B**, SHA-256 `a8cf94ea…`; §§1–5 above reproduce it as text without alteration | **PASS** |
| `M-10` | IRR consumer coordinate named by the decision | `ba64b2d5927c2f872560710cf1474c25a5cde0d5` / tree `5e4262f1cd75bf13b76ced5b45058f31434b5dad` — unchanged | **PASS** |
| `M-11` | IRR `main` movement since the decision merge | `c5037613295f826638e4b73a996c157e9749e66c` → `ac6d45b695bf9b79c0ec7af7d4656dc914ffccb2`; changed paths: the IRR tracker, `40-postmerge-readback.txt`, `41-postmerge-main-ci.txt` — **documentation only**; decision commit `d88d923d…` and merge `c5037613…` both remain ancestors; IRR `main` CI `40212439673` **success** | **PASS — no decision drift** |
| `M-12` | Record-ID census before publication | **0** occurrences in IPD; **7** in IRR | **PASS** |

### 6.1 One discrepancy recorded rather than smoothed

The prepared text's §4 item 1 refers to "the three divergent alias sources", whereas the effective
decision's §4.1 divergence inventory and this pass's independent measurement both give **four**
divergent files. The "three" is the count the same prepared text uses elsewhere for the *lineage*
sites — its §1 records `REAL` at the alias "three mapper sites" — and not the divergent-file count.

**No stop condition is triggered:** every anchor named by that instruction, and all fourteen alias raw
sources, are byte-identical to the blobs recorded in the decision record. The **four**-file census
governs, and the discrepancy is recorded here instead of being silently replicated or silently
corrected.

## 7. The registration act

| Item | Value |
|---|---|
| What was added | this file, and one dated entry in the IPD execution tracker |
| What was **not** touched | no IPD source, test, script, package manifest, lockfile, export, `files` entry, schema, migration, protocol, route, CI workflow, fence or pin; no alias movement; no lineage reclassification; no guard change. `package.json` `51796e63…` and `src/persistence/portfolio_store.ts` `540d49f2…` are byte-identical before and after |
| Publication route | IPD branch `arena/d677a106-iips-production-market-data` → PR → green exact-head CI → merge to `main` by **merge commit** (`--merge`; never squash, never rebase), matching every prior receipt in this locus |
| Validation | `npm ci` 0 · `npx tsc --noEmit` 0 · `npm run build` 0 · guarded `npm test` with the executed-test count recorded · `npm run test:package-consumer` 0 — plus the repository's own CI on the exact head |
| Coordinates | recorded **post-merge** in the IPD tracker receipt: merge commit and tree, this file's blob id and SHA-256, PR-head and post-merge CI runs, and the independent remote read-back |
| Effect | effectiveness element **6** of `IIPS-V3-CAP03-DQ6B-PA-DECISION-2026-10-25-01` is satisfied **once** the merge is read back from the remote (§8). Nothing else changes |

## 8. Effect on the six effectiveness elements

| # | Element | Status after this publication | Evidence |
|---|---|---|---|
| 1 | Census-checked PA act ID | **SATISFIED** (IRR locus) | decision §5; `M-12` |
| 2 | Verbatim determination text with every fixed semantic | **SATISFIED** (IRR locus) | decision §2 / §2.1 |
| 3 | Named commits / trees / manifest blobs | **SATISFIED** (IRR locus) | decision §§2.1, 4; `M-5`–`M-8` |
| 4 | Merge to the governing locus `main` (`--merge`) with green exact-head CI | **SATISFIED** (IRR locus) — decision merge `c5037613…`, CI `40211930571`, IRR tracker §16.122.14 | `M-11` |
| 5 | Independent remote read-back | **SATISFIED** (IRR locus) — blobs and SHA-256 re-read at IRR `main` | `M-8`, `M-9` |
| 6 | Dated receipt mirrored into the **other** repository's tracker | **SATISFIED BY THIS PUBLICATION**, on independent remote read-back of this file and of the tracker entry at IPD `main` | §7; tracker receipt (§7 coordinates) |

**Stated without rounding:** with element 6 published and read back, the **six-element set is
complete** and the determination is effective in both loci. That is the *only* claim this receipt
makes. It does **not** establish the DQ-4 final QE freeze, does not adopt H-12, and moves no gate,
pin, guard, fence or QE count. The IRR tracker's own element-6 row still reads `OUTSTANDING` until an
**IRR-locus** act records this publication — that is bookkeeping in the IRR locus, not a further
condition of element 6.

## 9. Attestation for this publication pass

| Claim | Value |
|---|---|
| IPD decision, pin, guard, fence or gate changed by this pass | **NO** |
| IPD source / test / package / schema / migration / protocol / route / workflow changed | **NO** — this file and one tracker entry only |
| IRR file, branch, commit, PR, issue or comment modified by this pass | **NO** — read-only |
| Effectiveness element 6 claimed before publication **and** independent read-back | **NO** — claimed only at §8, after both |
| DQ-4 freeze established / H-12 adopted / S2, P-1 or S3 started / QE credit / Gate 5 admitted | **NO** |
| Alias modernized, re-pinned, retired, or lineage reclassified | **NO** |

*End of `IIPS-V3-CAP03-DQ6B-IPD-MIRROR-RECEIPT-2026-10-25-01` — PUBLISHED in the IPD locus.
Registration only: no decision, no admission, no pin change.*
