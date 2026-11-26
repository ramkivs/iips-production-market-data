# W-06 BLK-3 — IRR Handoff (IPD disposition published, IRR header patch staged)

**Date:** 2026-11-26
**Type:** Cross-repository handoff. No source code, credential or live call was modified to produce this record.
**Controlling blocker:** BLK-3 — W-06 acceptance record missing (IPD publication / scan-grep requirement)
**IPD publication:** `ramkivs/iips-production-market-data` `main` `c31b7f9ab6fa636e65e955bf75d7bb34da46085c` — PR #201 `arena/f93e947f-iips-production-market-data` `7c9d25e074d09cca330036849902b339616031c0`
**IRR target:** `ramkivs/iips-review-recovered` `main` `e631cabc0eba32a5e85fc54b5c43ef07ac30b4f6`
**Handoff reason:** A local IRR fix commit `239f631a447bd807b7664e099b5fa0d91d723d5a` was prepared against IRR `main` but cannot be pushed from this IPD session (sandbox token scope is `ramkivs/iips-production-market-data` only; `403 Resource not accessible` on `iips-review-recovered`). This handoff preserves the exact patch so IRR can apply it independently.

---

## 1. IPD disposition — summary

IPD published `docs/integration/DHAN-W06-BLK3-ATTESTATION-GREP-DISPOSITION-2026-11-26.md` (358 lines, blob `42f8748c0dcc8610398b3080e6e2315e9d0db144` on IPD `main` `c31b7f9`):

- **Attestation `617fab0bf88bb6c899ba6a0b7716ffb77c024d87`** — 39 lines, blob `70ecc748f381f22bff9ebddf82a8da4c432813c9`, parent `af4460eeab9bb0544e009322526a5498df0d5909`, tree `834fcd6bb9b3cbe8f23f01ed561f7511eddf0238` — orphan/dangling (exists via `gh api commits/617fab0`; `404` on `main` Contents API at `d0b258a`; `git branch --contains 617fab0` → 0 of 186 heads). The record claims `W-06 COMPLETE — OWNER ATTESTED` while explicitly waiving the disclosure-scan that W-06/M1 require (`This record does not claim that a separately retained disclosure-scan report exists or that a scan was performed`).
- **Disposition:** **WITHDRAWN as a formal W-06 closure; RETAINED as a historical owner-reported operational observation.** The HTTP 200 one-interactive success at `26855625` (D01 `EQ_RELIANCE_IN` `ISIN:INE002A01018:EQ` `NSE_EQ` `GOOD`/`CURRENT`) is consistent with the independent operator acceptance `2685562522f1a2fd1d745a7857f771bf21453315` already on `main`.
- **Grep published at `d0b258a` (reproducible):** patterns `vault://`, `H:\IIPS\runtime` (`H:/IIPS/runtime`), `dhan-secrets`, carrier file names, `eyJ` — zero matches in all MUST-NOT locations (diagnostics, health payloads, evidence responses). Only governed constants (`src/security/secret_ref.ts` `vault://dhan/...`, `src/providers/dhan/dhan_dpapi_carrier.ts` `DPAPI_CANONICAL_CARRIER_DIRECTORY`, and the daemon guard `dhan_local_daemon.ts:167 detail.includes('vault://')`) remain — correct behaviour. Historical 13 Nov daemon console not retained is openly stated as the formal M1 limitation.
- **BLK-3 RESOLVED 2026-11-26** — record present on IPD `main` at a named SHA, grep published, both repos can agree. `M1 substantively achieved, formally pending owner confirmation; M2a observed; M2 not achieved.`
- **Roadmap updated:** `docs/integration/IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md` lead now records `BLK-3 RESOLVED` with the same SHAs.

Verification (on IPD `main`):

```sh
gh api repos/ramkivs/iips-production-market-data/contents/docs%2Fintegration%2FDHAN-W06-BLK3-ATTESTATION-GREP-DISPOSITION-2026-11-26.md --jq '{sha,html_url}'
# → sha 42f8748c0dcc8610398b3080e6e2315e9d0db144
gh api repos/ramkivs/iips-production-market-data/commits/c31b7f9 --jq '{sha,parents: [.parents[].sha]}'
```

---

## 2. IRR work required

On IRR `main` `e631cabc`, `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` line 10 (revision v1.1, commit `1e26ff545bc42e5967a0c15f1726da7959c13fcb`, history `9e957ad`→`a624d06`→`1aee57f`) asserts:

> W-06 is **COMPLETE — OWNER ATTESTED** — superseded by `617fab0` — no scan, no repeat execution required.

This header is the **controlling BLK-3 claim**; it contradicts the preserved 2026-11-15 assessment (`docs/integration/DHAN-W06-ROADMAP-PROGRESSION-ASSESSMENT-2026-11-15.md` `eea3a93e9a3ce3a8ab2a1b2909cfcec3292d9e3f` — 82 lines — correctly recorded as `W-06 PARTIALLY COMPLETE` pending disclosure scan, M1 reported but formal pending, M2a observed, M2 not achieved) and the IPD disposition above.

**Required change:** Replace that single header line to preserve `eea3a93` as historical, record the orphan provenance/404, the withdrawal, the IPD disposition reference (`c31b7f9`/PR #201/branch `7c9d25e`/grep at `d0b258a`), and the reconciled statuses (`M1 substantively achieved, formally pending; M2a observed; M2 not achieved; BLK-3 RESOLVED 2026-11-26`). Milestone definitions, ownership and dependencies are unchanged. The historical assessment file is **untouched**.

---

## 3. Exact patch (staged local commit `239f631a`)

A patch was staged at `/tmp/irr` on top of IRR `main` `e631cabc` and tested to apply cleanly. The sandbox cannot push it; this handoff is the transfer mechanism.

### 3.1 Patch file (git format-patch — apply with `git am` or `git apply`)

Save as `0001-fix-dhan-W-06-BLK-3-reconcile-roadmap-header-to-IPD-.patch` in an IRR checkout at `e631cabc`:

```patch
From 239f631a447bd807b7664e099b5fa0d91d723d5a Mon Sep 17 00:00:00 2001
From: arena-agent <arena-agent@arena.ai>
Date: Thu, 26 Nov 2026 07:06:54 +0000
Subject: [PATCH] =?UTF-8?q?fix(dhan):=20W-06=20BLK-3=20=E2=80=94=20reconci?=
 =?UTF-8?q?le=20roadmap=20header=20to=20IPD=20disposition=20(617fab0=20wit?=
 =?UTF-8?q?hdrawn,=20BLK-3=20resolved,=20grep=20published)?=
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit

- Preserve 2026-11-15 W-06 assessment eea3a93 as historical pre-attestation position (W-06 PARTIALLY COMPLETE pending scan).
- Record that 617fab0 (70ecc74 blob, orphan, 404 on main) claimed COMPLETE while waiving required scan and is withdrawn as formal W-06 closure by IPD DHAN-W06-BLK3-ATTESTATION-GREP-DISPOSITION-2026-11-26.md (IPD main c31b7f9, PR #201, branch 7c9d25e, grep at d0b258a).
- Update reconciliation to M1 substantively achieved (26855625 HTTP 200 D01), M1 formally pending owner confirmation of published grep, M2a observed, M2 not achieved, BLK-3 RESOLVED 2026-11-26.
- No source/test change; historical assessment untouched.
---
 .../DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md  | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)

diff --git a/docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md b/docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md
index d77b871e..56b38093 100644
--- a/docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md
+++ b/docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md
@@ -7,7 +7,7 @@
 **Baseline:** `docs/integration/DHAN-LIVE-MARKET-DATA-CURRENT-STATE-INVESTIGATION-2026-11-11.md` (IRR `9e957ad`, IPD `main` `a624d06`, consumed pin `1aee57f`).
 **Operating model:** personal, single-user, local Windows application. No multi-user, tenancy, cloud or enterprise infrastructure is introduced.
 
-**Current status reconciliation:** The [2026-11-15 W-06 assessment](DHAN-W06-ROADMAP-PROGRESSION-ASSESSMENT-2026-11-15.md) is historical: its partial disposition and scan-attestation blocker are superseded by the [IPD final owner attestation at `617fab0`](https://github.com/ramkivs/iips-production-market-data/blob/617fab0bf88bb6c899ba6a0b7716ffb77c024d87/docs/integration/DHAN-W06-FINAL-OWNER-ATTESTATION.md). W-06 is **COMPLETE — OWNER ATTESTED**; no scan is claimed, and no repeat execution or additional W-06 evidence is required. The owner attests M1/M2a events; this is not independent observation or automatic M2 qualification. W-11 is **PARTIAL**, as recorded in [its execution and acceptance record](DHAN-W11-IRR-EXECUTION-2026-11-15.md). The historical baseline statements below describe the investigation date, not current operational status. Milestone definitions, ownership and dependencies are unchanged.
+**Current status reconciliation (updated 2026-11-26, BLK-3 resolved):** The [2026-11-15 W-06 assessment](DHAN-W06-ROADMAP-PROGRESSION-ASSESSMENT-2026-11-15.md) `eea3a93e9a3ce3a8ab2a1b2909cfcec3292d9e3f` remains **preserved as the historical pre-attestation position** (`W-06 PARTIALLY COMPLETE` pending disclosure scan, M1 reported but formal pending, M2a observed, M2 not achieved). The [IPD final owner attestation at `617fab0`](https://github.com/ramkivs/iips-production-market-data/blob/617fab0bf88bb6c899ba6a0b7716ffb77c024d87/docs/integration/DHAN-W06-FINAL-OWNER-ATTESTATION.md) (39 lines, blob `70ecc748f381f22bff9ebddf82a8da4c432813c9`, parent `af4460ee`, tree `834fcd6`, orphan/dangling — 404 on `main` Contents API at `d0b258a`) claimed `W-06 COMPLETE — OWNER ATTESTED` while explicitly waiving the scan that W-06/M1 require. That claim is **withdrawn as a formal W-06 closure** by [IPD BLK-3 attestation/grep disposition `DHAN-W06-BLK3-ATTESTATION-GREP-DISPOSITION-2026-11-26.md`](https://github.com/ramkivs/iips-production-market-data/blob/c31b7f9ab6fa636e65e955bf75d7bb34da46085c/docs/integration/DHAN-W06-BLK3-ATTESTATION-GREP-DISPOSITION-2026-11-26.md) (IPD `main` `c31b7f9`, PR #201, branch `arena/f93e947f-iips-production-market-data` `7c9d25e`). The IPD record reproduces the exact attestation content/provenance, publishes the **reproducible zero-secret/zero-location grep at `d0b258a`** (patterns `vault://`, `H:\\IIPS\\runtime`, `dhan-secrets`, carrier file names, `eyJ` — zero matches in all MUST-NOT locations; only governed constant definitions and docs describing the `vault://` pointer format remain; historical 13 Nov daemon console not retained is openly stated), and records **BLK-3 RESOLVED 2026-11-26** (record present on IPD `main` at a named SHA, grep published, both repos can agree). **M1: substantively achieved** (one real authenticated interaction succeeded at `26855625` — HTTP 200 D01 `EQ_RELIANCE_IN` `ISIN:INE002A01018:EQ` `NSE_EQ`, `GOOD`/`CURRENT`), **M1 formally: pending owner confirmation of that published grep** (no new vendor request); **M2a: observed, operator-reported** (`26855625` envelope, not independently verified); **M2: not achieved** (requires W-12/W-13/W-14). W-11 is **PARTIAL**, as recorded in [its execution and acceptance record](DHAN-W11-IRR-EXECUTION-2026-11-15.md). The historical baseline statements below describe the investigation date, not current operational status. Milestone definitions, ownership and dependencies are unchanged.
 
 **Scale of this roadmap:** **9 phases** (Phase 0 through Phase 8), **7 decision records** (D-1…D-7), **38 work items** (W-01…W-15, W-17…W-39; the identifier W-16 was never allocated), **8 milestones** (M1, M2a, M2, M3a, M3, M4, M5, M6).
 
-- 
2.39.5
```

### 3.2 Manual apply (single-line replacement, no other file touched)

In `ramkivs/iips-review-recovered` at `e631cabc`:

1. Open `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md`.
2. Replace the paragraph beginning `**Current status reconciliation:** The [2026-11-15 W-06 assessment]...` (line 10, `d77b871e`) with the `**Current status reconciliation (updated 2026-11-26, BLK-3 resolved):** ...` paragraph exactly as shown above (one line, same indentation, same trailing ` W-11 is...`).
3. Commit message:

   ```
   fix(dhan): W-06 BLK-3 — reconcile roadmap header to IPD disposition (617fab0 withdrawn, BLK-3 resolved, grep published)
   ```

   Body as in the patch header. No source/test change; historical assessment `eea3a93` untouched.

### 3.3 Verification after apply

```sh
# IRR roadmap header now references IPD disposition
grep -n "BLK-3 resolved" docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md
# → **Current status reconciliation (updated 2026-11-26, BLK-3 resolved):**

# IPD disposition is fetchable on IPD main
gh api repos/ramkivs/iips-production-market-data/contents/docs%2Fintegration%2FDHAN-W06-BLK3-ATTESTATION-GREP-DISPOSITION-2026-11-26.md --jq .sha
# → 42f8748c0dcc8610398b3080e6e2315e9d0db144 at main c31b7f9

# No source/test diff
git diff --stat origin/main..HEAD
# → 1 file changed, 1 insertion(+), 1 deletion(-)
```

---

## 4. Why this cannot be pushed from the IPD session

The sandbox GitHub App installation for this session is scoped to `ramkivs/iips-production-market-data`. Attempts to push the local IRR commit `239f631a` to `ramkivs/iips-review-recovered` fail:

```
remote: Permission to ramkivs/iips-review-recovered.git denied to ramkivs.
fatal: unable to access 'https://github.com/ramkivs/iips-review-recovered/': The requested URL returned error: 403
pull request create failed: GraphQL: Resource not accessible by integration (createPullRequest)
```

The patch content is identical to the staged commit; applying it in an IRR-authorized session produces the same tree (`56b38093` on the roadmap file). The local commit hash `239f631a` is not a transferable artefact — only this handoff file and the IPD disposition at `c31b7f9` are authoritative.

---

## 5. Disposition table (both repos after IRR applies)

| Blocker | Status | Evidence |
|---|---|---|
| BLK-3 | **RESOLVED 2026-11-26** | IPD `DHAN-W06-BLK3-ATTESTATION-GREP-DISPOSITION-2026-11-26.md` at `main` `c31b7f9` (PR #201 `7c9d25e`); IRR header reconciled via this handoff |
| M1 | Substantively achieved (`26855625` HTTP 200 D01), formally pending owner confirmation of the published grep | IPD disposition §7 |
| M2a | Observed, operator-reported (`26855625` envelope, not independently verified) | IPD disposition §7, assessment `eea3a93` preserved |
| M2 | Not achieved (requires W-12/W-13/W-14) | Roadmap dependencies unchanged |

---

## 6. References

- IPD disposition: `https://github.com/ramkivs/iips-production-market-data/blob/c31b7f9ab6fa636e65e955bf75d7bb34da46085c/docs/integration/DHAN-W06-BLK3-ATTESTATION-GREP-DISPOSITION-2026-11-26.md`
- IPD PR #201: `https://github.com/ramkivs/iips-production-market-data/pull/201` (merged `c31b7f9`, CI `typecheck·build·test` SUCCESS `2m37s` + `executed test count` SUCCESS)
- IRR roadmap before: `https://github.com/ramkivs/iips-review-recovered/blob/e631cabc0eba32a5e85fc54b5c43ef07ac30b4f6/docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` (SHA `d77b871e3ddd2f574dd0246d92d6de7df646acd6`)
- IRR assessment preserved: `https://github.com/ramkivs/iips-review-recovered/blob/e631cabc0eba32a5e85fc54b5c43ef07ac30b4f6/docs/integration/DHAN-W06-ROADMAP-PROGRESSION-ASSESSMENT-2026-11-15.md` (`eea3a93e9a3ce3a8ab2a1b2909cfcec3292d9e3f`)
- Patch source: `/tmp/irr` clone at `e631cabc` → `/tmp/0001-fix-dhan-W-06-BLK-3-reconcile-roadmap-header-to-IPD-.patch` (34 lines, staged but unpushed `239f631a`)
