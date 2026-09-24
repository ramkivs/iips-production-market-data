# IIPS — DONOR CROSS-VERIFICATION & ACCESS-RESOLUTION FORENSIC REPORT

**Gate:** New-Arena independent forensic cross-verification & donor-object access resolution (read-only)
**Session date:** 2026-09-23 → 2026-09-24 (UTC; operator timezone Asia/Calcutta)
**Mode:** NON_PRODUCTION · FORENSIC / READ-ONLY · IMPLEMENTATION AUTHORITY **NOT GRANTED** · D115 AUTHORITY **NOT GRANTED** · PRODUCTION **NOT AUTHORIZED** · PROVIDERS **NOT ACTIVATED**
**Session branch (this Arena session):** `arena/01a0cf86-iips-production-market-data` at `da4305149bd5495789f893f530edb2526d08bb5b` (worktree clean at gate start and at gate end)
**Supplied artifact under independent test:** *IIPS — FUNCTIONAL IMPLEMENTATION RECOVERY / LINEAGE FORENSIC REPORT* (previous Arena session, uncommitted in any advertised ref; tested here as evidence, not as truth)

---

## 1. Executive finding

**Outcome Branch A occurred in this session.** Contrary to both prior sessions' experience (TLS `gnutls_handshake` failure), the configured remote **responded successfully** to a read-only advertisement at 2026-09-23T18:31:38Z, advertised the documented donor ref, and subsequently served full-depth object packs for every advertised branch and tag. The donor-object access question is therefore **resolved by direct object reacquisition**, not by operator deposition. No operator bundle is required for the objects documented in this gate (a contingency procedure is nevertheless specified and dry-run in §16).

Principal results, each stated only where object-level evidence was produced in this session:

1. **Donor ref verified live:** `refs/heads/arena/01a0c440-iips-production-market-data` = `42f91fad0ff5141fce665b068b544224ac471f73` (commit, `docs(d115): record blocked identity reconciliation`, 2026-09-22T09:31:11Z), exactly as the supplied artifact documented.
2. **All five required anchors verified as extant Git objects** with exact full SHAs, types, sizes, trees, parents, re-hash integrity, and ref-ancestry (§5). The one anchor the artifact printed with a wrong 8th hex digit (`8b109681`) resolves to commit `8b1096828e189c9107da7662afb3b93bf1c1d149` — the string `8b109681` matches **zero** objects of any type in the complete advertised object set (5,783 objects).
3. **The supplied artifact's central conclusions are CONFIRMED with stronger evidence than it possessed:** the historical full application existed (mature routed React app + API client tier + HTTP server tier + auth tier + 182 `.test.ts/.tsx` files + committed Windows/Edge captures + certified checkpoints), and the current partial/unavailable product is a **controlled cross-lineage convergence** (deliberate non-porting of the API/server/auth tier at `f13002e4eada9f24ee8aee854f66e2c6f07b1470` and `6b8afda47fdc1309f9566764d3d7bfc8a87e2c01`), not a proven deletion. Across the full 460-commit, two-root advertised history there are **zero** `D` (delete) and **zero** `R` (rename) events under `frontend/src/features`, `frontend/src/api`, `frontend/server`, `frontend/src/core/auth`; and **zero** of the 94 main-lineage commits ever contained those donor paths.
4. **The artifact's Executive payload question is now substantially answered.** The populated capture values (Holdings 13; 74.2; 71.7; 77.7; 7.7; 128.3; Capital Markets 84.6; 13-row opportunity table) are **exactly reproducible by static derivation** from two committed, frozen objects — `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json` (blob `63bcd350f2cda2b0337097c25236fd8dbe82d87b`, identical @ 7964fcc, @ 2f1049d, @ 42f91fad and present in the local checkout via HEAD) and the 13 golden `*-expected-outputs-1.0.0.json` fixtures (identical blobs @ 7964fcc and @ 42f91fad) — through the committed certified pipeline (`OntologyMapper` → `PortfolioIntelligence` → `DiversificationAnalyzer` → `RankingEngine`), whose source is byte-identical between capture-time and donor-tip. The same fixtures reproduce all 13 rows of the Capital Markets capture and all 9 visible rows of the Screener capture (§9). A full runtime re-execution was not performed in this gate (dependencies not installed; execution was not authorized) and remains the one residual step for a later, separately-authorized gate.
5. **Newly discovered third lineage (not in the supplied artifact):** a TARGET-UI convergence line on tag `refs/tags/p14-r7-65b78f7` (`65b78f7723700dc9334801429382d1ebcf7c4737`) and `refs/heads/windows/d114-stage5-banking-replay-observation`, branched from `da43051` on 2026-09-20, whose `ExecutiveDashboard.tsx` (blobs `d1481ae26c25e532d34edfe8443c59ae8415e6f7` / `f6cbe39f599a4ca189e58169bcc13402ba5ddb8b`) is the **only historical implementation containing the label set of the operator-described screenshot** (Active Positions, IIPS Average Score, IIPS Score Distribution, Watchlist Highlights, Quick Actions, Recent Research & Insights, Upcoming Events, Recent Companies, "Good morning, Alex") — all as **composition-only** projections of the existing certified payloads (`/api/decision-matrix`, `/api/watchlists`, `/api/notifications`, `/api/executive`), plus one hardcoded persona greeting and one `'Moderate'` band fallback. The reference image for that convergence is `word/media/image1.png` (INT-017, sha256 `35eefbc01b6ae625621f771c472eea0d04f9da421ddde7c08cbadc308134ce22`) embedded in the v1.0 SPEC docx (blob `3329b3115894082dc949f0dcbfa16c061c3cd815`, byte-identical at `eae2ff6` and current main) — a fictional mockup, formally rejected as non-governing by `3b23f2760ee289f7647af42eb9e7e3b0c98207af` (2026-09-14), whose descendants include both `da43051` and the p14-r7 tag. This resolves §14 and materially amends the artifact's "Quick Actions / Watchlist Highlights / Active Positions = UNPROVEN" rows: **composition implementations exist in the p14-r7/windows-d114 lineages; they were never in the c440 donor family nor in the certified 7964fcc lineage, and their authority records are not present in any advertised ref.**
6. **The previous session's "shallow clone cannot do archaeology" finding is confirmed and sharpened:** the working clone is shallow (roots `4d3e1cd` + `da43051`); a controlled experiment (§4.6) shows that even a successful fetch into that store would have yielded only 16 of 194 c440 commits and false-negative ancestry results. All archaeology in this gate was therefore performed in a **separate, disposable, full-depth scratch store** (`/tmp/iips-forensic/store.git`, outside the repository), which is also why the working repository's `.git` is bit-identical to its pre-gate fingerprint (§16).

**Corrections to the supplied artifact (all now evidenced, §6.3):** (i) `8b109681` → `8b1096828e189c9107da7662afb3b93bf1c1d149`; (ii) "182 frontend tests" → 182 `*.test.(ts|tsx)` across `frontend/` (49 `frontend/src` + 34 `frontend/server` + 99 elsewhere under `frontend/`); (iii) "26 routes" is only true including `/callback` (25 with `path=`); (iv) the artifact's own claim of an F-8/F-9 overlay on the checked-out worktree **did not hold in this session** — this session's checkout is the full-app family at `da43051` with a **clean** worktree (the 7-file overlay was already committed upstream as `f7cd994f6ebc02f24472783e9567593d2bfce4f5`); (v) the capture set's Executive capture corresponds to the **7964fcc-era** `ExecutiveDashboard` (no Watchlist Highlights / Quick Actions widgets — their testIds are absent from the manifest observables), while the supplied screenshot description corresponds to the later **p14-r7** composition variant; the artifact partially conflated these two UI states; (vi) `7964fcc`/`2f1049d` live on a **disjoint root** (`7325aeda8c9881ebdf2b96f64323998f1c46ba26`, m1-ad4-repair family) sharing no commit with c440/main — the artifact's single-lineage diagram understates this; content-level linkage is by byte-identical `frontend/src` trees (`87d5a07576fe3ae419846262d832a2a9eaa59b24`) and identical platform/baseline blobs, not by ancestry; (vii) the replay/evidence `dataSource` provenance strings at capture time over-claimed runtime pipeline execution and were later corrected by the donor's own L-3/D79 amendments to "transport fixture constants"; (viii) the baseline file's header text says "10 released sector engines" while carrying 13 sector entries — the manifest caption "thirteen engines" matches the file content, the header text is stale.

**Nothing was implemented, restored, ported, merged, cherry-picked, reset, rebased, or pushed.** D115, providers, production authorization, Windows, and the authoritative main lineage are unchanged (§17).

---

## 2. Current repository state at gate start (recorded before any remote access)

Working repository `/home/user/iips-production-market-data`:

| Item | Observed value |
|---|---|
| `pwd` | `/home/user/iips-production-market-data` |
| `git status --short --branch` | `## arena/01a0cf86-iips-production-market-data` — **0 modified/untracked entries (clean)** |
| HEAD | `da4305149bd5495789f893f530edb2526d08bb5b` — `D89: global UI12 data-mode propagation — 6 frozen route families (Phase 1)` (full-app family; **not** the F-8/F-9 checkout the artifact described) |
| HEAD tree | `f06b94bafcda46a5106b3886db7d07bf2f517918` |
| `main` / `origin/main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (tree `db853dc21d01162e69b0e1211dbea1cb5c5f72b1`) — matches the artifact's "current authoritative main" claim |
| shallow | `true`; roots exactly `4d3e1cdca3a33da0ec3be8b336b17128108a502c` and `da4305149bd5495789f893f530edb2526d08bb5b` |
| `git show-ref` | 4 refs: session branch, `main`, `origin/HEAD`, `origin/main` |
| `git rev-list --all --count` | 2 (artifact's claim reproduced at gate start) |
| fetch refspec | `+refs/heads/main:refs/remotes/origin/main` (unchanged throughout; never modified) |
| `remote.origin.url` | `https://github.com/ramkivs/iips-production-market-data.git` |
| tags | none local |
| HEAD's declared (missing) parent | `3c1491424e384fcd77151b7ca9c3efa5779de738` (`D86-Q`) — **ABSENT** locally; `main`'s parents `78c95d03311a4893bf513adbeff43fe0d06c7883` / `f7cd994f6ebc02f24472783e9567593d2bfce4f5` also **ABSENT** locally |
| config sha256 (pre) | `35a7d9d2fb3fbbbbb288a47f899a2da33d5bc6c91fb2dc41a463aeadb1947cf8` (byte-identical post-gate) |

**Worktree is NOT the stale F-8/F-9 overlay.** The artifact's description applied to *its* session's checkout; this session's sandbox was provisioned from `da43051` (the session-branch parent), whose tree is a full-app tree (1,111 files: `frontend/` 197, `iips-platform/`, `p05…p14`, `d114/`, 19 feature dirs, `frontend/src/api/` 22, `frontend/server/` 58, `frontend/src/core/auth/` 8, 76 frontend test files). Consequently the local object store already contained the donor-family blobs reachable from `da43051` (e.g. `ExecutiveDashboard.tsx` blob `5c4637af3600097d1ea5a7eef8e78955024d73a8`, `api/executive.ts` blob `ae934b89ba6fb0d7551b0d0dda4d347350cb4cf4`, `authFetch.ts` blob `a64db79e03d8985bc799568dc144ec1b314daad3`, baseline `63bcd350f2cda2b0337097c25236fd8dbe82d87b`) — 1,116 of the 1,170 distinct blobs of the donor tip tree were locally present **before any fetch**. But the five required anchor commits, all capture objects, and the whole pre-`da43051` history were **NOT** locally present (`git cat-file -e` negative for all five anchors).

**Session-branch safety note (new finding):** `da43051` is an ancestor of the donor tip but **not** of `main` (merge-base(`da43051`, `main`) = `eae2ff6`); `da43051..42f91fad` = 15 commits and `main` is 92 commits ahead of the same base. Any future PR from this session branch would therefore carry the pre-convergence full-app family into main's history **without** main's 92 convergence commits. This report makes no commit and leaves the branch untouched.

## 3. Remote access — timeline and classification

| Time (UTC) | Operation | Result |
|---|---|---|
| 18:31:38 | `git ls-remote origin refs/heads/arena/01a0c440-…` (attempt 1 of a bounded 3) | **exit 0** — `42f91fad0ff5141fce665b068b544224ac471f73 refs/heads/arena/01a0c440-iips-production-market-data`. **No TLS failure.** |
| 18:31:45 | full advertisement `git ls-remote origin` | **exit 0**, 29 refs (20 heads incl. c440 and m1-ad4-repair, 4 tags, 4 pull refs). sha256 of listing `a2cd34ec18e97846599fbd8c183579ca7c4ce6bbd83b5ff0ac0544038451a9c3` (Appendix A). |
| 18:40:31 | one-off full-depth fetch `c440` → `refs/forensic/iips/c440` (scratch store) | exit 0; 2,520 objects, 8.20 MiB; fetched tip SHA == advertised SHA. |
| 18:45:33 | one-off fetch `main` + `m1-ad4-repair` → `refs/forensic/iips/*` | exit 0; store 4,896 objects. |
| 18:57:21 | one-off fetch `refs/heads/*` + `refs/tags/*` → `refs/forensic/iips/all/*` | exit 0; 24 new refs; final store **5,783 objects / 460 commits / 2 roots**; `git fsck --full` exit 0. |
| 19:29:23 | bounded single by-SHA probe for `798bc5488fed641921978443a3e3d641ad1b51fb` | exit 128 (GitHub smart-HTTP requires auth for unreachable SHAs); object **NOT** in any advertised history → classified NOT PRESENT IN ADVERTISED HISTORY (the artifact's "unrecovered separate state" remains unlocatable; its content-loss narrative in `docs/INCIDENT-03_EXISTING_IIPS_COMMIT_LOSS.md` is consistent with this). |
| 22:17:17 / 22:55:47 / 00:56:52 (+1d) | late-session probes: `git ls-remote origin …`, `gh auth status`, anonymous `curl` | `ls-remote`/`gh` now fail with `could not read Username` / "token no longer valid"; anonymous REST and anonymous smart-http return **401 even for unrelated public repositories** → classification: **the session's injected GitHub credentials expired mid-gate and the egress proxy requires (invalid) credentials; the gate's reacquisition completed before expiry.** The earlier failures' TLS text and the later 401 text share one root cause class (proxy/credential path), not donor-repository state. |

**Classification:** REMOTE ACCESS = **AVAILABLE at gate execution** (Branch A). The artifact's and previous session's `REMOTE EXISTENCE UNVERIFIED` / TLS-blocked status is superseded for this session by direct evidence; it remains an accurate description of *their* environments. Donor existence and object availability are now **VERIFIED**.

## 4. Reacquisition method and integrity

1. **Isolation by design.** No fetch, ref, or config change was ever applied to the working repository. All fetches targeted a throwaway bare store `/tmp/iips-forensic/store.git` (`git init --bare`; refs under `refs/forensic/iips/…`), using one-off command-line refspecs only. Rationale (and validation): copying the working `.git` and fetching the same ref into it yields only **16/194** c440 commits and **false-negative** `merge-base`/ancestor results (shallow grafts at `da43051` prune the shared history) — §4.6 experiment. Archaeology on the shallow store is therefore unsound; all lineage claims in this report are computed in the full-depth store.
2. **Fetch commands (verbatim intent):** `git fetch --no-tags --no-write-fetch-head <url> '+refs/heads/arena/01a0c440-iips-production-market-data:refs/forensic/iips/c440'`, then `+refs/heads/main:refs/forensic/iips/main +refs/heads/m1-ad4-repair:refs/forensic/iips/m1-ad4-repair`, then `+refs/heads/*:refs/forensic/iips/all/heads/* +refs/tags/*:refs/forensic/iips/all/tags/*`. No `--depth`, no `--shallow-since`; no TLS or credential flags; `GIT_TERMINAL_PROMPT=0`.
3. **Integrity:** `git fsck --full --no-dangling` exit 0 on the final store (2026-09-23T20:21:11Z); every cited commit and blob re-resolves uniquely (every 12-char prefix cited herein matches exactly one object in the 5,783-object set); all five anchor commits re-hash to their stated IDs (`git cat-file` pipeline); fetched tip SHAs equal advertised SHAs; all 24 head/tag refs hold exactly the advertised values.
4. **Forensic ref set (27 refs)** retained in the scratch store, including `refs/forensic/iips/c440` = `42f91fad…`, `refs/forensic/iips/m1-ad4-repair` = `ad41b4d48299b7a58d3f2f44ae8ef8e11462f294`, `refs/forensic/iips/main` = `4d3e1cd…`, plus all `all/heads/*` and `all/tags/*`. The store persists at `/tmp/iips-forensic/store.git` for operator re-inspection (outside the repository; not part of any deliverable tree).
5. **Bundle dry-run (§16):** a contingency bundle of the three principal forensic refs round-trips through `git bundle verify`, a fresh bare receive, `git show-ref`, `git cat-file` on all five anchors, and `git fsck --full` (exit 0) — procedure validated; **no deposition is required** because Branch A occurred.

## 5. SHA identity matrix (required anchors)

| Documented role | Documented (artifact) form | Full SHA (this gate) | Type / size | Exists? | Tree | Parent(s) | Reachable from `42f91fad` (c440) | From `ad41b4d` (m1) | From `4d3e1cd` (main) | From `7964fcc` |
|---|---|---|---|---|---|---|---|---|---|---|
| Donor ref tip | `42f91fad0ff5141fce665b068b544224ac471f73` | same | commit / 381 | YES | `e1755b29dab6d6f52fe53424265663ef776c2f47` | `9c34f7c32d123442d6a4d91d0e5a8087da526cf4` | YES | NO | NO | NO |
| Content authority | `8b109681` (**wrong digit**) | `8b1096828e189c9107da7662afb3b93bf1c1d149` | commit / 3382 | YES | `bbbc9c6017d30e3780a0c17ba1926c1db5d9caaf` | `69812e1f918fb783f657b5c5000c8688a5d29c33` | YES | NO | NO | NO |
| Certified product | `7964fcc` | `7964fccefbf95341699bf56b5833b2432981767d` | commit / 302 | YES | `6a171874952313d9414fc88fccbb45cc29337acb` | `f8aa038e78373113858459c8136ba888cae6520c` | NO | YES | NO | YES |
| Capture deposit | `2f1049d` | `2f1049d0db348733f4d4f15fb4dcc57d4f2742fa` | commit / 293 | YES | `c0044fa148fa4bbf736733479aa718a4e4e26edc` | `7964fccefbf95341699bf56b5833b2432981767d` | NO | YES | NO | NO |
| Divergence point | `eae2ff6` | `eae2ff6937b257883433348560ae92f5485629e5` | commit / 271 | YES | `db0ed1f142afefa3d63f7f756335939a51c58b30` | `e93b14aa58b4719f7d89c79fb0942781a393c17f` | YES | NO | YES | NO |

Object-integrity re-hash: PASS for all five (and for every cited commit/blob in Appendix B–F). `8b109681` has **zero** prefix matches among 5,783 objects; `8b10968` matches exactly one object. Supporting anchors and their ref-ancestry are tabulated in Appendix F (47 commits).

**Tree measurements at the anchors (this gate, `ls-tree -r`):**

| Tree @ | files | `.tsx` | `*.test.(ts|tsx)` (frontend/) | `frontend/src/api/` | `frontend/server/` | `core/auth/` | feature dirs |
|---|---|---|---|---|---|---|---|
| `42f91fad` | 1,177 | 97 | 182 (49 src + 34 server) | 23 (20 modules + 3 tests) | 71 | 8 | 19 |
| `8b109682` | 1,162 | 97 | 182 | 23 | 70 | 8 | 19 |
| `da43051` (this checkout) | 1,111 | 94 | 174 | 22 | 58 | 8 | 19 |
| `7964fcc` | 1,088 | 78 | 143 (39 src + 14 server) | 15 | 28 | 8 | 14 |
| `2f1049d` | 1,108 | 78 | 143 | 15 | 28 | 8 | 14 |
| `4d3e1cd` (main) | 319 | 28 | 0 frontend | 0 | 0 | 0 (kit-only `core/`) | 7 |

Artifact's "1,177 files / 97 TSX / 182 frontend tests / 22 API modules / 71 server files / 19 feature dirs" is **CONFIRMED** modulo the test-counting nuance in §6.3.

## 6. Independent cross-verification of the supplied artifact

Per-claim classification. **CONFIRMED** = reproduced from objects this session; **PARTIALLY CONFIRMED** = core true, detail amended; **NOT REPRODUCIBLE** = depends on state not present here; **CONTRADICTED** = affirmatively different.

| # | Artifact claim | Classification | This session's evidence |
|---|---|---|---|
| A1 | Donor family `origin/arena/01a0c440…` exists with tip `42f91fad…` | CONFIRMED | live advertisement + fetch; tip commit inspected |
| A2 | Mature routed React app: 1,177 files / 97 tsx / 26 routes / 19 feature dirs / 22 API modules / 71 server files | PARTIALLY CONFIRMED | all counts reproduced (§5 table); routes = 25 `path=` + `/callback` = 26 route elements; "22 API modules" = 20 non-test modules (+3 test files) |
| A3 | Historical tests (182 frontend) | PARTIALLY CONFIRMED | 182 `*.test.(ts\|tsx)` under `frontend/` (49 src + 34 server + 99 other frontend); no counting rule yields 182 for `frontend/src` alone; the artifact's number is the frontend-total |
| A4 | Dependency chain feature → api → authFetch → /api/* → vite proxy → server → providers/auth | CONFIRMED | `authFetch.ts` blob `a64db79e…` (Bearer via `oidcClient.getAccessToken`); `vite.config.ts` blob `8b36e4f6…` proxies `/api → http://localhost:8787`; transport route table + `authorizeRead` inspected; main.tsx boots `AuthProvider` (Keycloak OIDC/PKCE) |
| A5 | Certified product `7964fcc` + capture deposit `2f1049d` (19 PNG + manifest) | CONFIRMED | both fetched; diff `7964fcc..2f1049d` = exactly 20 adds (19 PNG + `CAPTURE_MANIFEST.json`); manifest `productCommit` field == `7964fccefbf95341699bf56b5833b2432981767d` |
| A6 | 19 captures are byte-exact Windows/Edge DevTools captures, real Keycloak session | CONFIRMED | all 19 recomputed sha256 == manifest sha256 == byte counts (Appendix C); manifest `keycloak` block (issuer `localhost:8080/realms/iips`, PKCE S256, user admin-a, session ids), `browser` Edge 151, `os` Windows 11; executive.png visually inspected this session (values §9) |
| A7 | Executive capture populated values (13 / 74.2 / 71.7 / 77.7 / 7.7 / 128.3 / 84.6 / table / badges / chart) | CONFIRMED | pixels independently read this session; every value statically derived from committed frozen inputs through committed certified code (§9) |
| A8 | Divergence at `eae2ff6`; 192 full-app-only vs 56 then-main-only; never reconverged | PARTIALLY CONFIRMED | `merge-base(c440, main@4d3e1cd)` = `eae2ff6`; left/right vs `94f519b` = 192/56; vs `4d3e1cd` = 192/92; no commit in any advertised history contains both a donor product path and the BI-08 marker set |
| A9 | Convergence commits f13002e / 144e8edf / 881371e / f9101be / c7faf1f / ad2205a / 27e2173 / 6b8afda / 28a6ed / 4f8db9d / c3d61a1 / 78c95d0 / 373f0c0 / f7cd994 with the described effects | CONFIRMED | all resolve; all are ancestors of `4d3e1cd`; messages + diffstats inspected: `f13002e` recovers 23 shell/presentation files with documented deliberate omissions of the three API-coupled overlays; `6b8afda` restores 26 donor route paths with `UnavailableSurface` factories and a 15-test offline guard |
| A10 | Current tree has no `frontend/src/api`, no `frontend/server`, no `frontend/src/core/auth`; current surfaces fail-closed | CONFIRMED | `ls-tree` on `4d3e1cd`: all three ABSENT; `App.tsx` blob `36ffe2c7…` mounts `ExecutiveSurface/ResearchSurface/IntelligenceSurface/EvidenceSurface/MultiFactorScreenerSurface` **with no props**; `SecurityMasterSurface`/`PortfolioWorkspace` receive governed singletons; OPTA-01…OPTA-12 contract tests present |
| A11 | Current partiality = controlled non-porting + uncommissioned payloads, not deletion | CONFIRMED | zero `D`/`R` events under donor product paths across all 460 commits (incl. `-m` merge diffs); zero main-lineage trees ever contained donor paths; `f13002e`/`6b8afda` commit bodies state the exclusions as authority decisions |
| A12 | Watchlists/Collaboration/Reports/Settings absent at capture time; added later in donor line | CONFIRMED | nav @7964fcc has none of the four; dirs ABSENT @7964fcc; first-introduction commits `9e05008` (Watchlists, 2026-09-15), `d4047e8` (palette 08-22), `6f7ab8a` (workflow 08-17) — m1-line only |
| A13 | Opportunities/Risks/Rankings future-only | CONFIRMED | nav `status:'future'` at every tip incl. 7964fcc and main; no route elements or components for them in any advertised history; placeholder-route tests only |
| A14 | Quick Actions / Active Positions / IIPS Average Score / Watchlist Highlights / IIPS Score Distribution = zero repository evidence (UNPROVEN) | PARTIALLY CONFIRMED → **amended** | zero evidence in c440/m1/main lineages (artifact correct within its searched boundary); but full-history search (§14) found the TARGET-UI implementations on `p14-r7` / `windows/d114-stage5` (composition-only, authority records absent from advertised history) |
| A15 | `798bc548` unrecovered, not in lineage | CONFIRMED | by-SHA probe rejected (401/128 path); absent from all advertised trees; not an ancestor of any fetched ref |
| A16 | Sandbox shallow/restricted clone; only 2 commits visible | CONFIRMED at gate start; **sharpened** | §2 and §4.6 (shallow fetch yields 16/194 commits + false-negative ancestry) |
| A17 | Checked-out worktree = stale F-8/F-9 overlay over stale parent metadata; commit unsafe | **CONTRADICTED in this session** | this checkout = `da43051` full-app family, worktree clean; overlay already committed as `f7cd994` on main. The *durability* conclusion (no forensic commit from this checkout) still holds for a different reason: committing here would parent on `da43051` (pre-convergence) and misrepresent main's lineage (§16) |
| A18 | Remote donor existence UNVERIFIED (TLS) | **SUPERSEDED** | Branch A in this session (§3); their statement remains true of their environment |
| A19 | Payload provenance for Executive values "partially established; provider/persisted dataset not located" | PARTIALLY CONFIRMED → **advanced** | no committed payload contains the aggregate literals (§9.6); but §9 identifies the exact generation mechanism (frozen baseline + golden fixtures + certified CSIP pipeline), i.e. provenance is now **established as derived-computation over committed frozen inputs**, with the caveat that a live re-execution was not performed here |
| A20 | Historical auth tier = Keycloak OIDC/PKCE; D115 blocked | CONFIRMED | `core/auth/*` blobs inspected; D115 doc @ tip blob `a76580b0…` ("D115 IDENTITY RESOLUTION = BLOCKED", no custodian designated) |

### 6.1 Lineage topology (this gate's finding, sharper than the artifact)

```
root A  7325aeda 2026-08-12 (m1/Phase-12 certified line)
        └─ 7964fcc (2026-09-03, certified E2E-018) ─ 2f1049d (captures) ─ … ─ ad41b4d (m1 tip)
root B  e93b14aa 2026-09-08 (program v1.0 baseline)
        ├─ eae2ff6 (2026-09-08, divergence)
        │   ├─ m1-merge side … (8e8b4ab/f9ec75c transplant m1's frontend tree into root B, 09-13)
        │   │    └─ 4b37e5b 2026-09-14 (UI-PROVENANCE-01: frontend/ authority; 147 files; tree 2f194109693e == ad41b4d's frontend)
        │   │         ├─ da43051 (D89, this checkout; 09-15) ─ p14-r7 tag / windows-d114-stage5 (09-20 TARGET-UI)
        │   │         └─ 8b109682 (09-21) ─ 42f91fad (09-22)  [= c440 donor tip]
        │   └─ BI line: 94f519b (09-22) ─ f13002e/144e8edf/…/6b8afda/… ─ 78c95d0 ─ f7cd994 ─ 4d3e1cd (main, PR #4)
```
Disjointness proofs: `merge-base(c440, m1)` = NONE; `merge-base(m1, main)` = NONE; `frontend/src` tree at `4b37e5b` == `frontend/src` tree at `7964fcc` == `87d5a07576fe3ae419846262d832a2a9eaa59b24`; `iips-platform` tree `c9d5220455fb14dc7a1daec453e56c26d886f3ee` identical at `1dc7c53`, `ad41b4d`, `42f91fad` and **present in this checkout** via `da43051`.

### 6.2 Claims not reproducible in the current clone *without* the scratch store

Every claim requiring pre-`da43051` history, the capture objects, or cross-line merge-bases is NOT REPRODUCIBLE in the working repository (its store holds 1,732 objects / 2 commits). They are reproducible in the scratch store; the working repo was deliberately left shallow and unmodified.

### 6.3 Corrections register

1. `8b109681` → `8b1096828e189c9107da7662afb3b93bf1c1d149` (transposition; 0 objects match the printed form).
2. "182 frontend tests" → 182 `*.test.(ts|tsx)` across `frontend/` (breakdown §5).
3. "26 routes" → 25 `path=` route elements + 1 `index` (incl. `/callback`).
4. Worktree description (F-8/F-9 overlay, stale) → contradicted here (§2, A17).
5. Executive capture ↔ screenshot description: the capture (7964fcc-era UI) shows Portfolio Health + Priority Opportunities + risks + chart, with **no** Watchlist-Highlights/Quick-Actions testIds in its manifest observables; the supplied screenshot description matches the p14-r7 composition variant (§14). The artifact's §4.2 conflates the two; its pixel-level statements about the capture are nevertheless accurate.
6. m1/c440 disjointness and the 09-13 transplant commits (`8e8b4ab`, `f9ec75c`) are not in the artifact; added here.
7. Replay/Evidence `dataSource` strings at 7964fcc over-claimed runtime pipeline execution; donor's own D79/L-3 amendments (tip) correct them to "transport fixture constants"; values unchanged. The capture manifest's `runtimeNotes` likewise disclose hardcoded replay attestations.
8. Baseline file header says "10 released sector engines" but carries 13 sectors; the manifest's "thirteen engines" caption matches content; engine source files at tip = 13 (+3 additive lines each vs 7964fcc for lineage propagation, non-scoring).

## 7. Donor object verification — reachability summary

| Object | c440 | m1-ad4-repair | main | p14-r7 tag | windows/d114-stage5 |
|---|---|---|---|---|---|
| `42f91fad0f…` | YES (tip) | – | – | – | – |
| `8b1096828e…` | YES | – | – | – | – |
| `7964fccefb…` | – | YES | – | – | – |
| `2f1049d0db…` | – | YES | – | – | – |
| `eae2ff6937…` | YES | – | YES | YES | YES |
| `da4305149b…` (this HEAD) | YES (ancestor) | – | NO | YES (parent line) | YES |

`8b109682`..`42f91fad` adds 10 commits, **0** touching `frontend/src` (PIT/D115/windows-evidence work only) — the artifact's "content authority vs ref anchor" split is CONFIRMED. Donor tip's only `frontend/src` delta vs this checkout = 7 files (`api/company.ts`, `api/dataMode.ts`, `CompanyIntelligence.tsx`, +PIT panels/tests).

## 8. Historical functional product state (object-level)

Surfaces, routes, and closure classes are in Appendix B (114 files) and §8-table below; per-surface dependency chains verified by import closure (all resolved; 0 unresolved specifiers):

| Surface | Component (blob @ tip) | API modules | Server handler | Capture | Status |
|---|---|---|---|---|---|
| Executive | `ExecutiveDashboard.tsx` `5c4637af…` | executive/evidence/replay (+dataMode) | `executive-transport.ts` `/api/executive` | executive.png | PROVEN (capture + derivation) |
| Research–Company | `CompanyIntelligence.tsx` `23cb1af6…` + `CompanyTrustChain.tsx` | company/decisionMatrix/evidence/replay (+aiAdvisory, dataMode) | `/api/company/:id` (+ai-advisory) | 13 company PNGs | PROVEN (13/13 capture rows derived) |
| Research–Sector | `SectorIntelligence.tsx` `4f724d0d…` (dir `features/research/`, **never** `features/sector/`) | company/decisionMatrix/evidence/replay | `/api/company/:id` reuse | sector-intelligence_banking.png | PROVEN |
| Research–Events | `ResearchEvents.tsx` `d64f58a1…` | decisionMatrix/evidence/replay | as above | none | PROVEN impl; capture absent |
| Research–Cross-Sector | `CrossSectorIntelligence.tsx` `e811c57d…` | crossSector/evidence/replay | `/api/cross-sector` | cross-sector-intelligence.png | PROVEN |
| Intelligence–Decision Matrix | `DecisionMatrix.tsx` `c3b6e947…` | decisionMatrix/evidence/replay | `/api/decision-matrix` | decision-matrix.png | PROVEN |
| Evidence | `EvidenceHub.tsx` `fa85f2d9…` / `EvidenceExplorer.tsx` `9f5927ff…` / `ReplayExplorer.tsx` `1dfc2855…` | evidence/replay/decisionMatrix | `/api/evidence/:id`, `/api/replay/:id` | D114-stage5 replay observations (windows line) | PROVEN impl; replay provenance self-disclosed as fixture constants |
| Screener | `Screener.tsx` `915238ac…` (capture-era) | decisionMatrix (+executive) | `/api/decision-matrix` universe | screener.png | PROVEN (9/9 rows derived + 4 expected exclusions) |
| Screener–Governed (P12) | `GovernedScreener.tsx` `048c8d21…` | p12Screener | `p12-transport.ts` | – | PROVEN impl (post-capture) |
| Watchlists | `Watchlists.tsx` `eae01a06…` | watchlists | `watchlists-transport.ts` (universe = decision-matrix payload) | – | PROVEN impl (post-capture) |
| Administration (8 tabs) | `Administration.tsx` `60c97217…` + 8 children | admin | `admin-transport.ts` | admin-engines.png | PROVEN; AUTH-BLOCKED for live use (authorizeRead) |
| Shell/overlays | `AppShell/TopBar/Sidebar` `e05b823f/…`, `CommandPalette.tsx` `55ccd0d9…` | decisionMatrix (palette) | – | – | PROVEN |
| Portfolio (donor side) | `PortfolioWorkspace.tsx` `3d09c975…` | portfolio/evidence/replay | `/api/portfolio` | – | PROVEN impl; superseded by BI-08 in main |

UI-closure classes vs current main (Appendix B): identical-in-main 3–7 per surface (presentation kit), adapted 0–3, **absent 4–14 per surface**; every surface's api/auth/dataMode imports are absent from main. Server closure of `executive-transport.ts` = 183 files (127 iips-platform, 32 server, 24 d114/p08/p12/p13) + 14 runtime-read data files; the certified-computation sub-closure = 114 iips-platform files, **0 present in main**, non-relative imports = `node:crypto` only, env/network/fs hits = 0.

## 9. Executive payload forensics — the data-generation mechanism (advanced beyond the artifact)

Chain (all objects committed; blobs identical at `7964fcc` and `42f91fad` unless noted): `PROGRAM_v1.1_REPLAY_BASELINE.json` (`63bcd350…`) → engines' frozen golden `*-expected-outputs-1.0.0.json` (13 files, Appendix D) → `computeCertifiedPlatform`/`computeCertifiedExecutive` in `executive-transport.ts` (`fab26a42…` @7964fcc; `e6360974…` @tip; computation body byte-identical, incl. at `da43051` `e9c90c16…` and p14-r7) → `OntologyMapper.map` (composite→conviction, qualityScore→quality, riskScore→risk) → `PortfolioIntelligence.compute` (r1 round-half-to-even) → `DiversificationAnalyzer` (band; flags) → `RankingEngine`/`OpportunityEngine` (topN) → DTO → `ExecutiveDashboard` (`eceb7784…` capture-time).

**Static derivation (this session, Python port of the committed formulas) vs capture pixels:** Holdings 13 = 13; Avg Conviction 74.2 (Σ 964.1/13 = 74.1615 → r1); Avg Quality 71.7 (932.6/13); Avg Risk 77.7 (1010.5/13); Concentration 7.7 (r1(100/13)); Diversification 128.3 (r1(100−7.7+36)); Top opportunity Capital Markets 84.6; all 13 Priority-Opportunities rows == golden composites; trend pattern (3 up / 10 flat) == `index < 3 ? up : flat`. **Capital Markets capture** (visually inspected): composite 84.6, verdict Strong Buy, confidence 80%, pillars 90/82.5/78/82.5/90, inputs CM-001…CM-008 == baseline values. **Screener capture**: 9 of 13 rows shown = exactly the 9 sectors with non-null valuation; every displayed (composite, quality, valuation) triple matches the derivation (Appendix E). Decision-badge multiset in executive.png (Buy 9, Strong Buy 2, Watch 1, Accumulate 1) == golden verdicts. `chart-container` bars == 13 golden composites.

**Classification of each screenshot value:** Holdings/74.2/71.7/77.7/7.7/128.3/84.6/13-row table = **DERIVABLE FROM HISTORICAL DATA (committed frozen inputs + committed certified code)**; not literal payloads (no committed file contains the aggregate literals; the only `128.3`/`71.7` hits in all history are a forensic doc and unrelated NSE BhavCopy prices in D115 evidence). Badges/labels = capture-time UI; "CERTIFIED RESULT" rendered by `CertifiedBadge` (blob `80eebe2f…`, identical at 7964fcc/tip/main). Residual: **runtime re-execution not performed in this gate** (not authorized; node_modules absent) — values are established by static derivation + visual correlation, classifiable as *certified-snapshot computation over frozen v1.1 Replay Baseline inputs*, i.e. neither live production data nor fabricated data.

**p14-r7 composition variant (§14):** Active Positions = `portfolio.holdings`; IIPS Average Score = `portfolio.avgConviction`; Risk Exposure = `diversification.band` with `'Moderate'` fallback; IIPS Score Distribution = verdict-histogram of `/api/decision-matrix` universe; Watchlist Highlights = `/api/watchlists` rows (governed rows' own `baseline` prices); Alerts Requiring Attention = `/api/notifications` unread; Quick Actions = `visibleNav(role)` implemented entries; Total Portfolio Value = hardcoded "Unavailable" (Decision D-A); "Good morning, Alex" = hardcoded persona from the SPEC mockup.

## 10. Capture → route → component → API → server → payload correlation (E2E-018 set)

| Capture | Route | Component | APIs | Server endpoint | Payload source |
|---|---|---|---|---|---|
| executive.png | /executive | ExecutiveDashboard `eceb7784…` | executive/evidence/replay | /api/executive (+evidence/replay) | certified CSIP over frozen baseline (§9) |
| company-*.png ×13 | /research/company/:id | CompanyIntelligence | company/evidence/replay | /api/company/:id | golden fixtures per sector (inputs + pillars verbatim on pixels) |
| sector-intelligence_banking.png | /research/sector/Banking | SectorIntelligence | company/… | /api/company/Banking | golden banking fixture |
| cross-sector-intelligence.png | /research/cross-sector | CrossSectorIntelligence | crossSector/… | /api/cross-sector | CSIP outputs |
| decision-matrix.png | /intelligence/decision-matrix | DecisionMatrix | decisionMatrix | /api/decision-matrix | engineDetails (quality/valuation axes) |
| screener.png | /screener | Screener `915238ac…` | decisionMatrix | /api/decision-matrix | same universe, S-filters |
| admin-engines.png | /admin/engines | AdminEngines | admin | /api/admin/* | engine registry (certified artifacts) |

Manifest self-consistency: `matrixSha256` == recomputed sha256 of parity-matrix blob `b175e8cf…`; `productParent` == `7964fcc` parent; `authorityRecordBlob` `8553ad9e…` and `governanceCommit` `e75858d2…` = **NOT PRESENT** in advertised history (Windows-local governance records not pushed — consistent with PHASE1B intake-blocked records in main).

## 11. Auth / identity / D115 / provider dependencies (documented, not resolved)

- Client boot: Keycloak OIDC/PKCE (`AuthProvider.tsx` `cef3818f…`, `oidcClient.ts` `638fa3b5…`); every product fetch via `authFetch` Bearer.
- Server: `authorizeRead` → `admin-transport.guardRead` (401 when no IdP configured — fail-closed); tenant/owner derived from authenticated principal only.
- D115: tip doc `a76580b0…` = BLOCKED; no custodian; NSE deferred; no designation made. `runtimeCompanyId` / `implementationAuthority`: **0 source files** at donor tip **and** in current main (docs-only tokens: 15/8 md files in main).
- Providers: historical runtime network surface = MoSPI (`api.mospi.gov.in`, macro only) + `nsearchives.nseindia.com` references confined to `d114/` feasibility tooling and PIT fixture manifests (`provider: NSE_D114`, corpus `FIXTURE_CSV`); zero dhan/zerodha/groww/kite/upstox in historical runtime source. Current main: none active. **No provider activated in this gate.**

## 12. Required 16-function matrix (evidence of this gate)

| Function | Historical source verified (exact blob @ tip) | API verified | Server verified | Payload located | Provider | Auth dep | Current equivalent (main) | Recovery disposition |
|---|---|---|---|---|---|---|---|---|
| Executive | `5c4637af…` (+p14-r7 `d1481ae2…` variant) | executive/evidence/replay | /api/executive | DERIVED (§9) | frozen engines/CSIP | Keycloak + principal | UI02 company-level, unmounted inputs (`77b203c4…`) | RECOVER; decide granularity first |
| Portfolio | `3d09c975…` (HTTP) | portfolio | /api/portfolio | certified | — | Keycloak | BI-08 `82cd8a9a…` (implemented) | NO RECOVERY (current governs) |
| Research–Company | `23cb1af6…` | company/… | /api/company/:id | golden fixtures | — | Keycloak | structural `UnavailableSurface` | RECOVER, DO NOT REBUILD |
| Research–Sector | `4f724d0d…` (path `features/research/`) | company/… | /api/company/:id | golden fixtures | — | Keycloak | structural | RECOVER |
| Research–Events | `d64f58a1…` | decisionMatrix/evidence/replay | via transport | partial | — | Keycloak | structural | RECOVER |
| Research–Cross-Sector | `e811c57d…` | crossSector/… | /api/cross-sector | CSIP | — | Keycloak | structural | RECOVER |
| Intelligence–Decision Matrix | `c3b6e947…` | decisionMatrix | /api/decision-matrix | engineDetails | — | Keycloak | UI04 partial (`35289ddd…`) | RECOVER |
| Intelligence–Opportunities | none (future) | — | — | — | — | — | future placeholder | NEW CONSTRUCTION only if authorized |
| Intelligence–Risks | none (future) | — | — | — | — | — | future placeholder | NEW CONSTRUCTION only if authorized |
| Intelligence–Rankings | none (future) | — | — | — | — | — | future placeholder | NEW CONSTRUCTION only if authorized |
| Evidence | `fa85f2d9…/9f5927ff…/1dfc2855…` | evidence/replay | /api/evidence/:id,/api/replay/:id | fixture constants (self-disclosed) | — | Keycloak | UI11 (`6e83f0a8…`) | RECOVER + provenance commission |
| Screener | `915238ac…` / `048c8d21…` | decisionMatrix / p12Screener | /api/decision-matrix, p12-transport | certified universe | — | Keycloak | UI06 (`ba7fffb9…`) no candidates | RECOVER historical UI; commission universe separately |
| Watchlists | `eae01a06…` | watchlists | watchlists-transport | decision-matrix universe | — | Keycloak | structural | RECOVER |
| Quick Actions | c440/m1: NONE; p14-r7: composition `d1481ae2…` | visibleNav/notifications | none new | none | — | session role (display) | none | NOT a c440 recovery; p14-r7 composition exists but its authority records are absent from advertised history |
| Administration | `60c97217…` + 8 children | admin | admin-transport | registry | — | Keycloak + D115 | 8 authorization-required routes | RECOVER only behind D115/identity authority |
| Security Master | current-lineage only | — | — | D05 (2,250 records; sha `7f53540b…` recomputed MATCH) | governed local | none | `5aeca1e0…` implemented | NO RECOVERY / NO REBUILD |

## 13. Lineage vs deletion determination

**CONFIRMED at the strongest available resolution:** (a) 0 deletion and 0 rename events under all donor product paths across every advertised commit including merge-first-parent diffs; (b) 0/94 main-lineage trees ever contained those paths; (c) convergence commits' own bodies document deliberate exclusion; (d) current `UnavailableSurface`/structural factories and OPTA contract tests enforce the boundary. The current state is **ISOLATION / NON-PORTING / CONTRACT DRIFT** (historical `ExecutiveProvenance` = dataSource/freshness/calibratedAt/transportSemantics vs current = sourceClassification/lineageDigest/quality/…; historical Screener universe = certified matrix vs current UI06 = pe/pb/roe fundamentals), **not REMOVAL**. `3b23f27` (Target-Product rejection, 09-14) is an ancestor of both `da43051` and the p14-r7 tag — the TARGET-UI work proceeded *after* the screenshot was formally classified non-governing (composition-only scope per commit bodies).

## 14. Full-history resolution of the screenshot-only labels

All-history pickaxe + tip-tree scans: labels first appear at `53819b9/49befad/75617a1/0d619b1/8b92c51` (2026-09-20, TARGET-UI phases on the p14-r7 line, parented at `da43051`), culminating in blobs `d1481ae2…` (tag) / `f6cbe39f…` (windows/d114-stage5, which also adds a Decision Distribution panel and D114 stage-5 replay observation docs `2b4b0bd7…`, `66a9828a…`, `49754c13…`). Distinct ExecutiveDashboard blob census across all 460 commits: 17 blobs; only the four 2026-09-20 TARGET-UI blobs score 9/9 on the label set; capture-era blob `eceb7784…` and donor-tip blob `5c4637af…` score 4/9. The p14-r7 variant keeps the certified computation byte-identical (`computeCertifiedPlatform` == 7964fcc) and its delta from `da43051` touches 6 files, zero api/server/auth/platform files. **Implication for the artifact:** "Quick Actions unproven" and "Watchlist Highlights linkage unproven" hold for the c440/m1/main lineages the artifact searched; across the full advertised history the labels have located, governed-composition implementations whose *authority records are absent* (no TGT act file in any advertised tree) — classification: IMPLEMENTATION LOCATED, AUTHORITY UNVERIFIED, NOT a certified-capture-era feature, NOT a c440 recovery target.

## 15. Minimum recovery units and compatibility (evidence-only)

Per-surface absent-from-main counts (import closures, Appendix B): Executive 9, Company 14, Sector 12, Events 7, Cross-Sector 10, Decision Matrix 12, Evidence 9, Screener 5, GovernedScreener 5, Watchlists 4, Administration 13 — each closure's missing set is the **minimum recovery unit** (component + its api/auth/dataMode imports); the presentation kit (identical blobs) already exists in main. Server/platform closures are whole-tier units (114-file certified computation; 183-file transport closure) — not file-level ports. Contract-incompatibilities blocking direct recovery: `ExecutiveProvenance` shape split, UI06 fundamentals-vs-matrix universe split, Keycloak/principal session model vs current D115-deferred identity, NodeNext `.js` import-specifier adaptation already applied to the recovered kit (`f13002e`). **No bridge designed; no port executed.**

## 16. Git durability, safety, and contingency

- **Working repository invariants (pre vs post gate):** `.git/config` sha256 `35a7d9d2fb3fbbbbb288a47f899a2da33d5bc6c91fb2dc41a463aeadb1947cf8` — byte-identical; `git show-ref` identical; `.git/shallow` identical; `in-pack` 1732 unchanged; `refs/forensic/*` = 0; `remote.origin.fetch` = `+refs/heads/main:refs/remotes/origin/main`; HEAD `da43051…`, main/origin/main `4d3e1cd…`; `git status --porcelain` = 0 before this report's creation.
- **No commit is created.** Rationale: (1) the gate mandates forensic-only output; (2) this checkout parents on pre-convergence `da43051`; a report commit here would fabricate lineage relative to main exactly as the previous gate warned (different mechanism, same hazard); (3) remote durability is currently impossible anyway (session token expired §3). The report file will therefore appear as an **untracked** artifact in the session worktree (not ignored by `.gitignore`), which is the honest disposition.
- **Contingency (Branch-B) operator procedure — validated by dry-run, NOT required now:** on any network-capable clone of this repository: `git fetch origin '+refs/heads/arena/01a0c440-iips-production-market-data:refs/forensic/iips/c440' '+refs/heads/m1-ad4-repair:refs/forensic/iips/m1-ad4-repair' '+refs/heads/main:refs/forensic/iips/main'`; `git bundle create iips-forensic-triad.bundle refs/forensic/iips/c440 refs/forensic/iips/m1-ad4-repair refs/forensic/iips/main`; prove with `git bundle verify`, receiver-side `git fetch`, `git show-ref`, `git cat-file -t` on the five anchors, `git fsck --full`, and `sha256sum` of the bundle. Dry-run result (scratch→scratch, bundle created, verified, received, then deleted): `git bundle verify` reported "The bundle records a complete history"; receiver `show-ref` held all three refs; all five anchors typed `commit` post-receive; receiver `git fsck --full` exit 0; bundle size 11,709,617 bytes. Negative control: a c440-only bundle lacks `7964fcc`/`2f1049d` — the triad is the minimum sufficient set. **A c440-only bundle must never be treated as sufficient.**
- Scratch forensic store remains at `/tmp/iips-forensic/store.git` (27 forensic refs; 5,783 objects; fsck-clean) for operator re-inspection; `/tmp` is ephemeral — the bundle procedure above is the durable path if needed later.

## 17. Non-findings and unchanged boundaries

- NOT FOUND in any advertised object: `798bc548…`; the TGT/TARGET-UI authority act files; `DEC-E2E-018` governance record and `E2E-018-STAGE-A-CAPTURE-GATE-R7.ps1`; any persisted Executive aggregate payload; any `features/sector/` path; Opportunities/Risks/Rankings components or routes; donor components in any main tree.
- UNCHANGED: D115 designation (no source token exists to change), provider activation (none), production authorization (none), Windows state (not touched; Windows-origin records remain operator attestations), `main`/`origin/main`, session branch, worktree, fetch refspec, TLS settings (never disabled), credentials (none introduced; the platform's expired token is not something this gate can or should repair).
- IMPLEMENTATION EXECUTED: **NO.** No port, adapter, payload, route, UI, auth, or provider change anywhere.

## 18. Required final answers

**Q1 — Does the supplied artifact remain independently supported?** YES — 18 of 20 claim groups CONFIRMED, 2 PARTIALLY CONFIRMED with registered amendments (§6.3), 1 claim (worktree state) CONTRADICTED for this session only, 1 (remote status) SUPERSEDED by Branch A.

**Q2 — Is the historical c440 donor ref currently verified?** YES — advertised at `42f91fad0ff5141fce665b068b544224ac471f73` and reacquired full-depth at gate time (2026-09-23T18:31–18:58Z). Late-session probes show the *session credential path* has since degraded (401/credential-prompt); the verification above stands on completed fetches with fsck-clean integrity.

**Q3 — Are the exact historical objects currently verified?** YES — all five anchors plus 114-file feature/server/platform manifest, 19 captures + manifest (byte-exact), golden fixtures, and the TARGET-UI variant; full SHAs in §5 and Appendices B–F.

**Q4 — Can the historical functional implementation currently be recovered from available Git objects?** The OBJECTS are now locally held (scratch store) and sufficient to restore source in a later, separately-authorized gate; recovery of *behavior* additionally requires (a) dependency installation + re-execution to close the one residual (runtime confirmation of §9), and (b) the unchanged identity/payload/authority gates. In this gate: evidence only.

**Q5 — Minimum deposition requirement?** NOT REQUIRED (Branch A). Contingency procedure validated and specified in §16 (triad bundle), in case the remote later becomes unreachable again.

**Q6 — Has anything changed D115 / implementation authority / provider authorization / production authorization?** **NO.**

---

## Appendices (generated by script from the verified object store; no SHA transcribed by hand)

### Appendix A — Remote advertisement (2026-09-23T18:31:45Z, sha256 a2cd34ec18e97846599fbd8c183579ca7c4ce6bbd83b5ff0ac0544038451a9c3)

```text
4d3e1cdca3a33da0ec3be8b336b17128108a502c HEAD
da4305149bd5495789f893f530edb2526d08bb5b refs/heads/arena/01a0814b-iips-production-market-data
b02acb1023e8aa9c96fa0ac0c6f70c9a432abec4 refs/heads/arena/01a0853c-iips-production-market-data
3c084bb0ef463fd765a4bb8a29b7a2ed68b1a99d refs/heads/arena/01a0853d
b56a608b2a4b2e3524d1a82f12cf13eaeff35bb2 refs/heads/arena/01a0853d-iips-production-market-data
ea0014087822ce31a96c8527180ad85ce5411b35 refs/heads/arena/01a0a438-iips-production-market-data
7eb52dce0fc5fd7b48fe9ea4864288c061931cf1 refs/heads/arena/01a0a4a1-iips-production-market-data
b0fdd8d5a8c21f90bc5baf17d810f05024b661ce refs/heads/arena/01a0ae80-iips-production-market-data
005f73248d9c0219608f859eddeeeb063ad280f7 refs/heads/arena/01a0b8e8-iips-production-market-data
97527eadae5c4aa9704daa7a382010d0872db8b5 refs/heads/arena/01a0bdb5-iips-production-market-data
42f91fad0ff5141fce665b068b544224ac471f73 refs/heads/arena/01a0c440-iips-production-market-data
3695d9598f5ebe189d2c80e4d08454bdf09766ee refs/heads/arena/01a0c86d-iips-production-market-data
c3d61a15863bf53497a20cbe95cfef3c5498d61e refs/heads/arena/01a0c960-iips-production-market-data
f7cd994f6ebc02f24472783e9567593d2bfce4f5 refs/heads/arena/01a0ce79-iips-production-market-data
4a95cd9b13d3863f1287cbc0fbee40e4b0e5bc6d refs/heads/d114-legacy-windows-evidence
1d57d0bea322f60b98e47edd39ac4e72c00f979a refs/heads/d114-windows-evidence
ad41b4d48299b7a58d3f2f44ae8ef8e11462f294 refs/heads/m1-ad4-repair
4d3e1cdca3a33da0ec3be8b336b17128108a502c refs/heads/main
9e45ac2fe88147591ad2cd8373b2311a7b0534d3 refs/heads/p14-implementation-recovered
b217f7abbf11fca951fb2b261a80442d982e451b refs/heads/windows-acceptance/full-shell-20260923
d771e6a28514a6c529742d318dd9f3f08ed205f6 refs/heads/windows/d114-stage5-banking-replay-observation
005f73248d9c0219608f859eddeeeb063ad280f7 refs/pull/1/head
b217f7abbf11fca951fb2b261a80442d982e451b refs/pull/2/head
c3d61a15863bf53497a20cbe95cfef3c5498d61e refs/pull/3/head
f7cd994f6ebc02f24472783e9567593d2bfce4f5 refs/pull/4/head
65b78f7723700dc9334801429382d1ebcf7c4737 refs/tags/p14-r7-65b78f7
cb969b6729843fe46c974c54a56eac25ea3a086a refs/tags/portfolio-option-a-cb969b6
b46b4f42c3cf57333832ccc7f3e5bcd1e4de4cdd refs/tags/post-cleanup-baseline-b46b4f4
caf73ba43fe26ee4fb1987442152f6b93f78f71c refs/tags/temporary-cleanup-caf73ba
```

### Appendix B — Feature/API/server/platform file manifest (114 files; blobs @ 7964fcc and @ 42f91fad; introduction/last-change; main status)

| # | Path | Blob @ 7964fcc (capture-time) | Blob @ 42f91fad (donor tip) | Bytes @ tip | First introduced (all advertised history) | Introduced on c440 lineage | Last change on c440 | In current main (4d3e1cd) |
|---|---|---|---|---|---|---|---|---|
| 1 | `frontend/src/features/executive/ExecutiveDashboard.tsx` | `eceb778484b95f3205d341e947c8c74d0cc55f94` | `5c4637af3600097d1ea5a7eef8e78955024d73a8` | 10413 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | da43051 2026-09-15 | ABSENT |
| 2 | `frontend/src/features/executive/ExecutiveDashboard.test.tsx` | `dea477efc48d60cf89fc45d6b82c7bd685eb6f24` | `0ffc38e7a89f5cc94353ccda0eda56c0ef1bc86a` | 10965 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 5e4779d 2026-09-14 | ABSENT |
| 3 | `frontend/src/features/company/CompanyIntelligence.tsx` | `570471632871bfba230ebe0e69ec9d17a7a2d91c` | `23cb1af6c2299428640eff443c64e60df6b03913` | 9938 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 8b10968 2026-09-21 | ABSENT |
| 4 | `frontend/src/features/company/CompanyIntelligence.test.tsx` | `d0a6e106766544b9d3b66f7816c3e588b7bb2b7a` | `14b284b8ac1bad99193244a0758897e8fea618d6` | 23141 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 5e4779d 2026-09-14 | ABSENT |
| 5 | `frontend/src/features/company/CompanyIntelligencePit.test.tsx` | `ABSENT` | `4d23925f57cc5ac174a02cad5efa70a171e19299` | 4330 | `8b1096828e189c9107da7662afb3b93bf1c1d149` 2026-09-21 | 8b10968 2026-09-21 | 8b10968 2026-09-21 | ABSENT |
| 6 | `frontend/src/features/company/CompanyTrustChain.tsx` | `0f16dcb01180b9fe2e962df050060a33672952a9` | `18d59e26785c07c6a3e42a6e148ce92e733599ed` | 5349 | `3850b1812412801baeaaf7aea7cab0f5f30e6461` 2026-08-18 | 4b37e5b 2026-09-14 | 5e4779d 2026-09-14 | ABSENT |
| 7 | `frontend/src/features/company/CompanyTrustChain.test.tsx` | `a9dd4a92730617bb239b217b2ee3bb9e1b1f362f` | `a95d5e684f1683d2e202928228a75992839533a6` | 6304 | `3850b1812412801baeaaf7aea7cab0f5f30e6461` 2026-08-18 | 4b37e5b 2026-09-14 | 5e4779d 2026-09-14 | ABSENT |
| 8 | `frontend/src/features/research/SectorIntelligence.tsx` | `858f1f89fe81e58ffb266bf84c878ee2ced9dc96` | `4f724d0da0ddd0278483caf83cd7030b9c4257bd` | 12916 | `468bb0647cf6d332406776d05d44d8617f762fa8` 2026-08-21 | 4b37e5b 2026-09-14 | da43051 2026-09-15 | ABSENT |
| 9 | `frontend/src/features/research/SectorIntelligence.test.tsx` | `5e96a75f0c5e1cc967a8ab5012673f51ca85a802` | `33048d739ad086deb704db799ce64780f3dd9269` | 16631 | `468bb0647cf6d332406776d05d44d8617f762fa8` 2026-08-21 | 4b37e5b 2026-09-14 | 5e4779d 2026-09-14 | ABSENT |
| 10 | `frontend/src/features/research/ResearchEvents.tsx` | `d64f58a1adee96dd3cdf9e6d7688e01a17963859` | `d64f58a1adee96dd3cdf9e6d7688e01a17963859` | 9725 | `60c513631d81f88ffa6e707de67ad8c60b126b16` 2026-08-21 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 11 | `frontend/src/features/research/ResearchEvents.test.tsx` | `aef89c6f2852dbb69df9f1a240d69883a67d264e` | `aef89c6f2852dbb69df9f1a240d69883a67d264e` | 12437 | `60c513631d81f88ffa6e707de67ad8c60b126b16` 2026-08-21 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 12 | `frontend/src/features/research/ResearchHub.tsx` | `0cd5491cac6872b2aef1382ac812bf8e2946d389` | `0cd5491cac6872b2aef1382ac812bf8e2946d389` | 3799 | `a76e802e81348fe560e02c82da61f38ac2e9097f` 2026-08-19 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 13 | `frontend/src/features/cross-sector/CrossSectorIntelligence.tsx` | `4c770dd7cfe6cbd15e78feefb768192749d73749` | `e811c57d86ed65f51809d53096c20e1adacba89f` | 11439 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | da43051 2026-09-15 | ABSENT |
| 14 | `frontend/src/features/cross-sector/CrossSectorIntelligence.test.tsx` | `b09774548091b76b216dc0cbdda7acd28aa670b9` | `1f049d20de4fa0b2e93a68e77648eb0978dafec2` | 11997 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 5e4779d 2026-09-14 | ABSENT |
| 15 | `frontend/src/features/decision-matrix/DecisionMatrix.tsx` | `bb96a540f9a648aa9d594c09e33cd29b8556eadd` | `c3b6e947188c340f4e226d1135e2e6f0aa9e0e18` | 9700 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | da43051 2026-09-15 | ABSENT |
| 16 | `frontend/src/features/decision-matrix/DecisionMatrix.test.tsx` | `033f42e5167bb451e5e874e575a966cc32a11031` | `adc6194e6d071422373ff9c2a1c0d713b8ef4818` | 16029 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 5e4779d 2026-09-14 | ABSENT |
| 17 | `frontend/src/features/intelligence/IntelligenceHub.tsx` | `25e215a40503108bb5821e92fd5f1582e9715cb1` | `25e215a40503108bb5821e92fd5f1582e9715cb1` | 5847 | `5706ec57970a61238cccfb50c2a022c51b68f110` 2026-08-19 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 18 | `frontend/src/features/evidence/EvidenceHub.tsx` | `fa85f2d941f1b627a7c33d0d91f317e089d224c7` | `fa85f2d941f1b627a7c33d0d91f317e089d224c7` | 3900 | `52debaa9176142f7aa90b21fc51360d4aa41504e` 2026-08-19 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 19 | `frontend/src/features/evidence/EvidenceHub.test.tsx` | `2e8219b6edab0d360fd11cf69b706a0d74d46da2` | `2e8219b6edab0d360fd11cf69b706a0d74d46da2` | 6119 | `52debaa9176142f7aa90b21fc51360d4aa41504e` 2026-08-19 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 20 | `frontend/src/features/evidence/EvidenceExplorer.tsx` | `9f5927ff35846c7a0bc702fb525bc5ba8f410008` | `9f5927ff35846c7a0bc702fb525bc5ba8f410008` | 4654 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 21 | `frontend/src/features/evidence/EvidenceExplorer.test.tsx` | `f1210e669bb5b0527db9f7bb11dc9e627d01322a` | `fb7e2a87140c1fee26a134c9cd007df89fe49ab6` | 6528 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | b56a608 2026-09-14 | ABSENT |
| 22 | `frontend/src/features/replay/ReplayExplorer.tsx` | `98755f7c5ab388403a51f13329f98127264a71f5` | `1dfc285503c55745a704a82e669132867825e163` | 7399 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | f649e2d 2026-09-14 | ABSENT |
| 23 | `frontend/src/features/replay/ReplayExplorer.test.tsx` | `9e88f3141fce1007a41565a6675c54cf7e45c2c7` | `01d5164315b614eec24b10c5133fc760cbd46453` | 7598 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 9e4c2e1 2026-09-14 | ABSENT |
| 24 | `frontend/src/features/screener/Screener.tsx` | `915238acec41e15232f8b20ec064828e8c291a32` | `915238acec41e15232f8b20ec064828e8c291a32` | 9987 | `50c07b96e5d1450a7de057de207e1fe3cd45a98e` 2026-08-21 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 25 | `frontend/src/features/screener/Screener.test.tsx` | `004fb2386439b1608c34eb751980f7cc1edf693b` | `004fb2386439b1608c34eb751980f7cc1edf693b` | 9406 | `50c07b96e5d1450a7de057de207e1fe3cd45a98e` 2026-08-21 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 26 | `frontend/src/features/screener/GovernedScreener.tsx` | `ABSENT` | `048c8d21970dc2655a403404d9a61590d8207392` | 9001 | `cfe33536573cc118870ba728d1088e020c20476f` 2026-09-14 | cfe3353 2026-09-14 | cfe3353 2026-09-14 | ABSENT |
| 27 | `frontend/src/features/screener/GovernedScreener.test.tsx` | `ABSENT` | `87ea8ff55e11ccf322ceb610a3f446fb9b9f403c` | 5880 | `cfe33536573cc118870ba728d1088e020c20476f` 2026-09-14 | cfe3353 2026-09-14 | cfe3353 2026-09-14 | ABSENT |
| 28 | `frontend/src/features/watchlists/Watchlists.tsx` | `ABSENT` | `eae01a06d34bcf7876cb1755eb98f24acebe3696` | 8866 | `9e0500889d76cb2561b75f3e0e4017a121ca419f` 2026-09-15 | 9e05008 2026-09-15 | 9e05008 2026-09-15 | ABSENT |
| 29 | `frontend/src/features/watchlists/Watchlists.test.tsx` | `ABSENT` | `5dd4cfd18c970ae6daaf2b4bcb49eb43237c0c8f` | 6484 | `9e0500889d76cb2561b75f3e0e4017a121ca419f` 2026-09-15 | 9e05008 2026-09-15 | 9e05008 2026-09-15 | ABSENT |
| 30 | `frontend/src/features/admin/Administration.tsx` | `60c97217759fac61aaf53d105a76e505078f2bbc` | `60c97217759fac61aaf53d105a76e505078f2bbc` | 4167 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 31 | `frontend/src/features/admin/Administration.test.tsx` | `2af5cd498825d2fb89ce344b7256f8cc248e8c3c` | `2af5cd498825d2fb89ce344b7256f8cc248e8c3c` | 11946 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 32 | `frontend/src/features/admin/AdminOverview.tsx` | `b6c959562a944bc743efbf9c07ba73c41d93f977` | `b6c959562a944bc743efbf9c07ba73c41d93f977` | 2668 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 33 | `frontend/src/features/admin/AdminIdentity.tsx` | `f1f6edcafe52f22a82a0ff43737929014890c087` | `f1f6edcafe52f22a82a0ff43737929014890c087` | 3007 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 34 | `frontend/src/features/admin/AdminTenancy.tsx` | `476f5ab4fa9fc9f016ff90f86f3d8381a9b933dd` | `476f5ab4fa9fc9f016ff90f86f3d8381a9b933dd` | 2769 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 35 | `frontend/src/features/admin/AdminEngines.tsx` | `ba18153cf0efe49e028c0a6097711f4ef24d762c` | `ba18153cf0efe49e028c0a6097711f4ef24d762c` | 3426 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 36 | `frontend/src/features/admin/AdminPlatform.tsx` | `6ad68287777e358db28e2985523c62275ca72286` | `6ad68287777e358db28e2985523c62275ca72286` | 4471 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 37 | `frontend/src/features/admin/AdminAudit.tsx` | `9ac0a5e53974b2efe38f54ddbf2c765b73a4d8f2` | `9ac0a5e53974b2efe38f54ddbf2c765b73a4d8f2` | 2693 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 38 | `frontend/src/features/admin/AdminData.tsx` | `490c4aacdbfef39b70c87f8a583bbf8cc3f0c9d4` | `490c4aacdbfef39b70c87f8a583bbf8cc3f0c9d4` | 10825 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 39 | `frontend/src/features/admin/AdminOperations.tsx` | `c9b8a2a8bc52ac37d546fbdc41d95aa823a4182f` | `c9b8a2a8bc52ac37d546fbdc41d95aa823a4182f` | 3636 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 40 | `frontend/src/features/admin/AdminOperations.test.tsx` | `451cd63d767abdd8a28c8d200bb1a85f50dba6ec` | `451cd63d767abdd8a28c8d200bb1a85f50dba6ec` | 3229 | `6f7ab8ac250cdf549295ea89d792f8dcd719be21` 2026-08-17 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 41 | `frontend/src/features/portfolio/PortfolioWorkspace.tsx` | `6f83e124424e0b3a5c1a83e6ebbfbd2ed46aa06a` | `3d09c975f4649bfb8c285c392b21e513a3227246` | 12112 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 8e6ef29 2026-09-15 | ADAPTED |
| 42 | `frontend/src/features/shell/CommandPalette.tsx` | `92539c32eb110f218317b7aac9dc5726929961e1` | `55ccd0d9cc324c8938d8a12f1ed577ea6a60cf28` | 9504 | `d4047e83b205ffeba1e1a4181967601323d4b939` 2026-08-22 | 4b37e5b 2026-09-14 | cfe3353 2026-09-14 | ABSENT |
| 43 | `frontend/src/app/App.tsx` | `15e638ed5b6f9448fcbb4b787783acd252fe0094` | `1e6dde580d214e1a00acef195d0507a1b5a89134` | 7003 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | f399c07 2026-09-15 | ADAPTED |
| 44 | `frontend/src/app/navigation.ts` | `03fcf14d7db9f3dc1c75c8a08efec54d4ee2d4c2` | `f72e3809f6ea4ab05eb1af946e967593d52b471c` | 7338 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | f399c07 2026-09-15 | ADAPTED |
| 45 | `frontend/src/app/AppShell.tsx` | `e05b823faf9ed5de8dea81d39f808fa1861a753b` | `e05b823faf9ed5de8dea81d39f808fa1861a753b` | 2745 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ADAPTED |
| 46 | `frontend/src/main.tsx` | `2367d065b17ff8ecbca54217715cfba52bca7477` | `2367d065b17ff8ecbca54217715cfba52bca7477` | 709 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ADAPTED |
| 47 | `frontend/src/api/executive.ts` | `ae934b89ba6fb0d7551b0d0dda4d347350cb4cf4` | `ae934b89ba6fb0d7551b0d0dda4d347350cb4cf4` | 2136 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 48 | `frontend/src/api/evidence.ts` | `8ea7c864519e9974ca5f7ac57b80b709e767d704` | `8ea7c864519e9974ca5f7ac57b80b709e767d704` | 2042 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 49 | `frontend/src/api/replay.ts` | `56e236dfbca653d804ae95a6ff32901bc3eeeb98` | `56e236dfbca653d804ae95a6ff32901bc3eeeb98` | 1442 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 50 | `frontend/src/api/dataMode.ts` | `ABSENT` | `d45b544afd6dc6de4fd1d4fa80ec292f3e0b40f0` | 5152 | `da4305149bd5495789f893f530edb2526d08bb5b` 2026-09-15 | da43051 2026-09-15 | 8b10968 2026-09-21 | ABSENT |
| 51 | `frontend/src/api/company.ts` | `1235c20eca0da67f8c40d2ea2e9a1710cd85928f` | `04c4ba4c8c23b5a310ef686a3c59264c32b26f2d` | 2854 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 8b10968 2026-09-21 | ABSENT |
| 52 | `frontend/src/api/crossSector.ts` | `d03631ad1d095b1474a9787613c15cb5303813f6` | `d03631ad1d095b1474a9787613c15cb5303813f6` | 1598 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 53 | `frontend/src/api/decisionMatrix.ts` | `311e86c084592cee0212ba788624f27e44186bf7` | `311e86c084592cee0212ba788624f27e44186bf7` | 1302 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 54 | `frontend/src/api/p12Screener.ts` | `ABSENT` | `ce3007c663da9f20e5be9d38ae62307fc9273a3a` | 6379 | `cfe33536573cc118870ba728d1088e020c20476f` 2026-09-14 | cfe3353 2026-09-14 | cfe3353 2026-09-14 | ABSENT |
| 55 | `frontend/src/api/watchlists.ts` | `ABSENT` | `18a68ca121685ceda62578c3754f9d7329765d14` | 4419 | `9e0500889d76cb2561b75f3e0e4017a121ca419f` 2026-09-15 | 9e05008 2026-09-15 | 9e05008 2026-09-15 | ABSENT |
| 56 | `frontend/src/api/admin.ts` | `3deb4de1cbbb27a992eb7b184f3eeb1c1ab7e58c` | `3deb4de1cbbb27a992eb7b184f3eeb1c1ab7e58c` | 8802 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 57 | `frontend/src/api/portfolio.ts` | `9829c328091d8e5636afefa0c84ad346ff51458a` | `46009de07dbe586a497ad0cd5d4cca00b3970911` | 3843 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 8e6ef29 2026-09-15 | ABSENT |
| 58 | `frontend/src/api/authFetch.ts` | `a64db79e03d8985bc799568dc144ec1b314daad3` | `a64db79e03d8985bc799568dc144ec1b314daad3` | 1229 | `7f6b27d5e28ce3ec96b2b8c7fd00faecbd2445aa` 2026-08-17 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 59 | `frontend/src/api/authFetch.test.ts` | `311609e724fa0c9f3feeb0a9551f94b32283a998` | `311609e724fa0c9f3feeb0a9551f94b32283a998` | 2395 | `7f6b27d5e28ce3ec96b2b8c7fd00faecbd2445aa` 2026-08-17 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 60 | `frontend/src/api/readClients.test.ts` | `2eb95837e6d57d7e1d110bb2564a3642c721942a` | `2eb95837e6d57d7e1d110bb2564a3642c721942a` | 2452 | `87f8b59dfb55d2b91155e7628777b3280352fd31` 2026-08-18 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 61 | `frontend/src/core/auth/AuthProvider.tsx` | `cef3818f2b52b71c30326ef208539098db08ac82` | `cef3818f2b52b71c30326ef208539098db08ac82` | 6448 | `7f6b27d5e28ce3ec96b2b8c7fd00faecbd2445aa` 2026-08-17 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 62 | `frontend/src/core/auth/oidcClient.ts` | `638fa3b5ada9ce4e99dede7feaaf06f50b271671` | `638fa3b5ada9ce4e99dede7feaaf06f50b271671` | 14101 | `7f6b27d5e28ce3ec96b2b8c7fd00faecbd2445aa` 2026-08-17 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 63 | `frontend/src/core/auth/keycloakAdapter.ts` | `d7aefbb0ae45cd2f70068f2a28bbc0a10cccc0bc` | `d7aefbb0ae45cd2f70068f2a28bbc0a10cccc0bc` | 3730 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 64 | `frontend/src/core/auth/authContract.ts` | `a9052d894c82b997ce94639c4d318bfa9c2dcc20` | `a9052d894c82b997ce94639c4d318bfa9c2dcc20` | 1667 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 65 | `frontend/server/executive-transport.ts` | `fab26a42973619e87ea9bae2db4ef31210fe1ca2` | `e6360974e447a0d5ab20ca37b6018c345e98009f` | 56726 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 8b10968 2026-09-21 | ABSENT |
| 66 | `frontend/server/admin-transport.ts` | `a32d485ae4502ac84507ddcd2ea695bd61136bc3` | `8866dbe81b0f8140584dd0c72531cf30bf66ea64` | 44379 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | ecfa59f 2026-09-15 | ABSENT |
| 67 | `frontend/server/admin-transport.test.ts` | `06f5d5bf0c77ec90254865046612f90a76983faa` | `06f5d5bf0c77ec90254865046612f90a76983faa` | 12772 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 68 | `frontend/server/read-guard.test.ts` | `6c74c5f3fd8f108fa45b1f41261a738776702bd3` | `6c74c5f3fd8f108fa45b1f41261a738776702bd3` | 3231 | `87f8b59dfb55d2b91155e7628777b3280352fd31` 2026-08-18 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 69 | `frontend/server/secured-executor.ts` | `f85692ddd0bea3e1d5c58463fa198e50d1a8fc56` | `f85692ddd0bea3e1d5c58463fa198e50d1a8fc56` | 4718 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 70 | `frontend/server/live/real-oidc-verifier.ts` | `4a937ce81c82a3bf114755dedd2dd124310d88d8` | `4a937ce81c82a3bf114755dedd2dd124310d88d8` | 3989 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 71 | `frontend/server/data-mode/data-mode.ts` | `ABSENT` | `904e9ead9554ade262189ca5b91f5fe179df0bcf` | 16586 | `da4305149bd5495789f893f530edb2526d08bb5b` 2026-09-15 | da43051 2026-09-15 | 8b10968 2026-09-21 | ABSENT |
| 72 | `frontend/server/persistence/persistence-service.ts` | `ca735d5d8e2a11bdcf2c1c3a9b9fc42fb30abbaf` | `ca735d5d8e2a11bdcf2c1c3a9b9fc42fb30abbaf` | 11886 | `9c003ce6a6b80f79c710d76b1c4219bc52b2e425` 2026-08-22 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 73 | `frontend/server/directory/roster-directory.ts` | `fea1799c4b619f10146dd7ace1bfa42ed75b8119` | `fea1799c4b619f10146dd7ace1bfa42ed75b8119` | 6137 | `9ed4fb2e1f2fb741fa1c99e7426fa9725159920b` 2026-08-22 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 74 | `frontend/server/directory/idp-sync.ts` | `dd81a14db9e497a727676579ee7a15b3bc3966e5` | `dd81a14db9e497a727676579ee7a15b3bc3966e5` | 8238 | `9ed4fb2e1f2fb741fa1c99e7426fa9725159920b` 2026-08-22 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 75 | `frontend/server/secrets/secret-authority.ts` | `62eeb38abdb4dd1d72eb2f50d9ada64fb6ada257` | `62eeb38abdb4dd1d72eb2f50d9ada64fb6ada257` | 9407 | `3e7c7e3b0828d9ad2a91c123010c470491762f19` 2026-08-22 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 76 | `frontend/server/macro/mospi-source.ts` | `5ccef665e82e7bcaacf0d70a504a9f22dd3e18e9` | `5ccef665e82e7bcaacf0d70a504a9f22dd3e18e9` | 23942 | `0cc00f2e09982f81819fcc5172d5acf3a8378380` 2026-08-21 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 77 | `frontend/vite.config.ts` | `8b36e4f62176577de6ad96a36a760d03512cbf63` | `8b36e4f62176577de6ad96a36a760d03512cbf63` | 649 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 78 | `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json` | `63bcd350f2cda2b0337097c25236fd8dbe82d87b` | `63bcd350f2cda2b0337097c25236fd8dbe82d87b` | 10680 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | b923dd5 2026-09-14 | b923dd5 2026-09-14 | ABSENT |
| 79 | `iips-platform/src/sector-engines/cross-sector/CrossSectorEngine.ts` | `415689a1f5f6c7c915126ff9cce9cc43ddc8dd34` | `415689a1f5f6c7c915126ff9cce9cc43ddc8dd34` | 4097 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 1dc7c53 2026-09-14 | 1dc7c53 2026-09-14 | ABSENT |
| 80 | `iips-platform/src/sector-engines/cross-sector/portfolio/PortfolioIntelligence.ts` | `361e2dcecafd5c2f6884229ca58c76e9dd8f5e28` | `361e2dcecafd5c2f6884229ca58c76e9dd8f5e28` | 2336 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 1dc7c53 2026-09-14 | 1dc7c53 2026-09-14 | ABSENT |
| 81 | `iips-platform/src/sector-engines/cross-sector/opportunity/OpportunityEngine.ts` | `31f9458b5018912dc2d81fbd03c3df38de17357b` | `31f9458b5018912dc2d81fbd03c3df38de17357b` | 917 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 1dc7c53 2026-09-14 | 1dc7c53 2026-09-14 | ABSENT |
| 82 | `iips-platform/src/sector-engines/cross-sector/ranking/RankingEngine.ts` | `ed2c869858b5606e4d3b11077aa64dc787838583` | `ed2c869858b5606e4d3b11077aa64dc787838583` | 805 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 1dc7c53 2026-09-14 | 1dc7c53 2026-09-14 | ABSENT |
| 83 | `iips-platform/src/sector-engines/cross-sector/ontology/OntologyMapper.ts` | `ea0f6acfe0ca9e8fbeb04392a2861881cadaa937` | `ea0f6acfe0ca9e8fbeb04392a2861881cadaa937` | 3035 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 1dc7c53 2026-09-14 | 1dc7c53 2026-09-14 | ABSENT |
| 84 | `frontend/src/components/state/DataModeUnavailable.tsx` | `ABSENT` | `b264ace76b11dd04747d674b68a2421009304551` | 1729 | `da4305149bd5495789f893f530edb2526d08bb5b` 2026-09-15 | da43051 2026-09-15 | da43051 2026-09-15 | ABSENT |
| 85 | `frontend/src/components/ai/AiExplanation.tsx` | `df8bb2b9a5c7ed6c6db20b233e9369d285589421` | `df8bb2b9a5c7ed6c6db20b233e9369d285589421` | 4830 | `e5d59981c10578db0bf7a5b656acccb9450f45e0` 2026-08-27 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 86 | `frontend/src/components/provenance/P12Provenance.tsx` | `ABSENT` | `06864afd02d4d5c2c8a0a9219208d1089ec54aaa` | 7291 | `cfe33536573cc118870ba728d1088e020c20476f` 2026-09-14 | cfe3353 2026-09-14 | cfe3353 2026-09-14 | ABSENT |
| 87 | `frontend/src/components/state/PitVintagePanel.tsx` | `ABSENT` | `0ca0e8773855209b03b649555c9f56f7e20cbec7` | 5076 | `67f749c7e74d370a98d5a4b696fec6f1009ddcf0` 2026-09-21 | 67f749c 2026-09-21 | 8b10968 2026-09-21 | ABSENT |
| 88 | `frontend/src/api/aiAdvisory.ts` | `2258e54c179e505f816611dfe300ed174d8739b9` | `2258e54c179e505f816611dfe300ed174d8739b9` | 3518 | `e5d59981c10578db0bf7a5b656acccb9450f45e0` 2026-08-27 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 89 | `frontend/src/api/notifications.ts` | `3960212fd0f19ed5eea1b2f5a5ab6f778e43993d` | `3960212fd0f19ed5eea1b2f5a5ab6f778e43993d` | 2676 | `0e063d39cf3eba44a6859283f90a59c463195eee` 2026-08-24 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 90 | `frontend/src/features/research/MacroContext.tsx` | `f73867730aa0b57480e80b16cfb281a58198cb87` | `f73867730aa0b57480e80b16cfb281a58198cb87` | 6828 | `50cfd4fb7dac6eeb13a76b9cfa3e82fa7d8f2981` 2026-08-21 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 91 | `frontend/src/features/admin/WorkflowDefinitionPanel.tsx` | `3e128b0e48a30436950b64a876bffc971b7f3674` | `3e128b0e48a30436950b64a876bffc971b7f3674` | 4638 | `6f7ab8ac250cdf549295ea89d792f8dcd719be21` 2026-08-17 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 92 | `frontend/server/p12-transport.ts` | `ABSENT` | `4c1b7014444414a2f84390c60640a5e756fcc9dc` | 22925 | `cfe33536573cc118870ba728d1088e020c20476f` 2026-09-14 | cfe3353 2026-09-14 | f649e2d 2026-09-14 | ABSENT |
| 93 | `frontend/server/p12-request-handler.ts` | `ABSENT` | `6fa466897c1ff0960ec68706784bf0676c67c892` | 12746 | `cfe33536573cc118870ba728d1088e020c20476f` 2026-09-14 | cfe3353 2026-09-14 | 93ff7b5 2026-09-14 | ABSENT |
| 94 | `frontend/server/p12-universe.ts` | `ABSENT` | `ff5f6786541960c5488dabfb1c65ba85e97ef8d6` | 6647 | `cfe33536573cc118870ba728d1088e020c20476f` 2026-09-14 | cfe3353 2026-09-14 | cfe3353 2026-09-14 | ABSENT |
| 95 | `frontend/server/watchlists/watchlists-service.ts` | `ABSENT` | `a2d32e33730745a4f0211aba65c4d8396878796b` | 15484 | `9e0500889d76cb2561b75f3e0e4017a121ca419f` 2026-09-15 | 9e05008 2026-09-15 | 9e05008 2026-09-15 | ABSENT |
| 96 | `frontend/server/watchlists/watchlists-transport.ts` | `ABSENT` | `1bdeba2e7c5272dd53c3d93d7b8e53e5bd8a51a0` | 10249 | `9e0500889d76cb2561b75f3e0e4017a121ca419f` 2026-09-15 | 9e05008 2026-09-15 | 9e05008 2026-09-15 | ABSENT |
| 97 | `frontend/server/persistence/saved-screens-store.ts` | `ABSENT` | `f4fd943d0daa44e05daff8a4ddb869bc3aabff34` | 5164 | `93ff7b55e7c5d1db427a069150552ef84d1ff34c` 2026-09-14 | 93ff7b5 2026-09-14 | 93ff7b5 2026-09-14 | ABSENT |
| 98 | `frontend/server/pit/companyPitTransport.ts` | `ABSENT` | `4c1af54bc42e230d68beb4c7085812b6e668221c` | 3670 | `8b1096828e189c9107da7662afb3b93bf1c1d149` 2026-09-21 | 8b10968 2026-09-21 | 8b10968 2026-09-21 | ABSENT |
| 99 | `frontend/server/pit/d114AdmissionBridge.ts` | `ABSENT` | `4c9d0f019a783049a50e541d95d852d23f323ac4` | 13241 | `67f749c7e74d370a98d5a4b696fec6f1009ddcf0` 2026-09-21 | 67f749c 2026-09-21 | 331dbed 2026-09-21 | ABSENT |
| 100 | `frontend/server/pit/pitVintageProvider.ts` | `ABSENT` | `17f9bfdd012e4fe6f4ed5fb63bf02e54532232a6` | 31314 | `67f749c7e74d370a98d5a4b696fec6f1009ddcf0` 2026-09-21 | 67f749c 2026-09-21 | 331dbed 2026-09-21 | ABSENT |
| 101 | `frontend/server/pit/p08PitStore.ts` | `ABSENT` | `e764ad6b29ff181a45f62ac14d35e8d5ee1d1ff5` | 818 | `67f749c7e74d370a98d5a4b696fec6f1009ddcf0` 2026-09-21 | 67f749c 2026-09-21 | 67f749c 2026-09-21 | ABSENT |
| 102 | `frontend/server/pit/fixtures/corpus/pit-corpus-manifest.json` | `ABSENT` | `f3af563b4cae0655dc2aab2cc29afe460fb5b201` | 1425 | `67f749c7e74d370a98d5a4b696fec6f1009ddcf0` 2026-09-21 | 67f749c 2026-09-21 | 8b10968 2026-09-21 | ABSENT |
| 103 | `frontend/server/portfolio/portfolio-data-mode.ts` | `ABSENT` | `a0a6b4b67a61721a6829c12d30244a959242cd22` | 6110 | `3a7f79430e6a8387a70657dd182b565c24b3b95a` 2026-09-15 | 3a7f794 2026-09-15 | 3a7f794 2026-09-15 | ABSENT |
| 104 | `frontend/server/ai-advisory-transport.ts` | `e257814e3eb2dc591a55e955cd4855b7776af38a` | `e257814e3eb2dc591a55e955cd4855b7776af38a` | 9244 | `e5d59981c10578db0bf7a5b656acccb9450f45e0` 2026-08-27 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 105 | `frontend/server/notifications/notification-service.ts` | `7890b00ecc9b1315964dd3c7af589fda290ea661` | `7890b00ecc9b1315964dd3c7af589fda290ea661` | 12441 | `0e063d39cf3eba44a6859283f90a59c463195eee` 2026-08-24 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ABSENT |
| 106 | `frontend/src/core/session/SessionContext.tsx` | `d3ce08ea3dd744a419f17f3a2c29f52cfcbfca9d` | `d3ce08ea3dd744a419f17f3a2c29f52cfcbfca9d` | 793 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | ADAPTED |
| 107 | `frontend/src/core/session/session.ts` | `f119f7fc1568b74e6f2d421246004bea4c7992cb` | `f119f7fc1568b74e6f2d421246004bea4c7992cb` | 1121 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | IDENTICAL |
| 108 | `frontend/src/components/ui/Badges.tsx` | `80eebe2fff49169ad2bddaf6b4f57bd7774bd786` | `80eebe2fff49169ad2bddaf6b4f57bd7774bd786` | 3279 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | IDENTICAL |
| 109 | `frontend/src/components/data/DataComponents.tsx` | `5124c91713ac8236dae6cebd7d818190a218e507` | `5124c91713ac8236dae6cebd7d818190a218e507` | 4700 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 4b37e5b 2026-09-14 | IDENTICAL |
| 110 | `frontend/src/components/state/StateComponents.tsx` | `a359daa85148780ef5ff28e0bfc3068010615b27` | `cd227f96a434c5a5c214c058afab8e9f5592e858` | 3484 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 2a5b1b3 2026-09-14 | IDENTICAL |
| 111 | `frontend/package.json` | `0e380068c82c4949734744e0681322adf5f32cf3` | `217d3a8bfb8038232894c96f44cf12b886e09428` | 1084 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 4b37e5b 2026-09-14 | 8b10968 2026-09-21 | ABSENT |
| 112 | `iips-platform/src/sector-engines/cross-sector/diversification/DiversificationAnalyzer.ts` | `2001d76dc68da20cc3236870be4548376367f5d2` | `2001d76dc68da20cc3236870be4548376367f5d2` | 1779 | `7325aeda8c9881ebdf2b96f64323998f1c46ba26` 2026-08-12 | 1dc7c53 2026-09-14 | 1dc7c53 2026-09-14 | ABSENT |
| 113 | `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md` | `ABSENT` | `a76580b0e82695d0907924378b2d5035808c7812` | 29107 | `a08c1c6cc51183aa58374061920cf80699656415` 2026-09-22 | 42f91fa 2026-09-22 | 42f91fa 2026-09-22 | ABSENT |
| 114 | `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` | `ABSENT` | `05bc29d1817e6699af023614589e62aa2da22c63` | 23108 | `9a26ac70058a4410ed99905f0aa3d3a18e87ba17` 2026-09-09 | 9a26ac7 2026-09-09 | 9a26ac7 2026-09-09 | ABSENT |

### Appendix C — E2E-018 capture objects (blob + manifest sha256 + recomputed sha256 + bytes)

| # | Capture file | Route | Blob @ 2f1049d | Manifest SHA-256 (= recomputed) | Bytes | Captured (UTC) |
|---|---|---|---|---|---|---|
| 1 | `admin-engines.png` | `/admin/engines` | `d58e94a360b7eab88c09e98e0c99af2a0f995c56` | `4f411752258fefcdaa050aedaf91206cadca19533fbb8526a598002a963c07ac` (MATCH) | 110352 | 2026-09-03T16:42:21Z |
| 2 | `executive.png` | `/executive` | `7745cff35c134467debbfba0bc6c945519f30ea1` | `6a3f10433bac366e01801b5dd6612e01cf0ec21b420f1f80fcbfee1afe914db7` (MATCH) | 74111 | 2026-09-03T16:42:23Z |
| 3 | `company-intelligence_banking.png` | `/research/company/Banking` | `a01dcd2dabb9d2d7a500b8ff61e77289463af018` | `0e3b9ab200a2e0da8f7ec6f5506915c9a68ffdca2ed94b81ba61bf3d5514c395` (MATCH) | 78110 | 2026-09-03T16:42:26Z |
| 4 | `company-intelligence_insurance.png` | `/research/company/Insurance` | `d89eff744ca3f73f10c0d489f1535a24c02f966c` | `e4f333660ed0aab469d013e2ed35ff9ef97b2c2337b1721ec7e3489401d01bad` (MATCH) | 73903 | 2026-09-03T16:42:29Z |
| 5 | `company-intelligence_capital-markets.png` | `/research/company/Capital%20Markets` | `02b552f5de04b45da39c98f7e0fce8f9829b7752` | `c197b3c1cd4103e726205b6368173fc01bc545eb4a010b5a04122c0440c04c78` (MATCH) | 80974 | 2026-09-03T16:42:32Z |
| 6 | `company-intelligence_healthcare.png` | `/research/company/Healthcare` | `75eb9855f943930c48fbc58e50bcd1fd77d8930f` | `e0affe009a34df2716a2cc5bd09527d210fd89cc063a559e34c9a92540a11d20` (MATCH) | 80298 | 2026-09-03T16:42:35Z |
| 7 | `company-intelligence_hospitality.png` | `/research/company/Hospitality` | `db92b1159972225a2861d7d2b6ab9ce3565ff771` | `0d2a01ba9193e99ba916c8f31841dd25d08a7d2f32366d9dfb1d244716f60751` (MATCH) | 73060 | 2026-09-03T16:42:38Z |
| 8 | `company-intelligence_energy.png` | `/research/company/Energy` | `15e0715c193d4c90401455d6adccb23eb0233e19` | `c08bbd39732acdc1991edc6355b5f43dbc8c14acb0d8ac9749aff3aa7f390dd0` (MATCH) | 72470 | 2026-09-03T16:42:41Z |
| 9 | `company-intelligence_utilities.png` | `/research/company/Utilities` | `97b5175303d86e055c1bfdc772fb10f7b943c642` | `6d4a9268a2ab326633b4ccd89663d025d07d0de8c0c7750a403083ac3694aed2` (MATCH) | 72811 | 2026-09-03T16:42:44Z |
| 10 | `company-intelligence_consumer.png` | `/research/company/Consumer` | `db32b184e03c4d50f85043c3f17f1038d526300c` | `e8c17dbf21329e454282ff2a25afd1d542b99336f6575aeeeceb3bec0de17d97` (MATCH) | 73968 | 2026-09-03T16:42:48Z |
| 11 | `company-intelligence_industrials.png` | `/research/company/Industrials` | `87185c1b76e711062c72a3346680b42f87f3558f` | `d2aee2418b65bb6fd78938c024456bfe2e5f116107e8782de029cc21361cbcd1` (MATCH) | 71569 | 2026-09-03T16:42:51Z |
| 12 | `company-intelligence_technology.png` | `/research/company/Technology` | `b767ce27591753e05599019098c39afa05908a0f` | `885069236301b18753b7f5a8b339d754ff226d515560b71dd07745878377727b` (MATCH) | 74420 | 2026-09-03T16:42:54Z |
| 13 | `company-intelligence_telecommunications.png` | `/research/company/Telecommunications` | `10cde0a837d00e75335925d9b46b6a9e71a3f4fd` | `63f0ea2271c822acab062e68254a8024d9c4b95afaf8031a5f41c19e0ad79a50` (MATCH) | 74125 | 2026-09-03T16:42:57Z |
| 14 | `company-intelligence_automobile.png` | `/research/company/Automobile` | `dfc1988fb92ff3f068fdc1c154c70877d3d9d37c` | `17c2e6ae90bbdee2cbcc3a62e3e6d21fde7e493cb3ddc4ecbd6fb9f3967d02a5` (MATCH) | 73257 | 2026-09-03T16:42:59Z |
| 15 | `company-intelligence_materials-metals.png` | `/research/company/Materials%20%26%20Metals` | `5d8be3a2745e77be869aa5430db42c991f94eae7` | `4d266aad964fbff63dde230d7f72e4938a24afa6e80d13843ad1aa89449239dc` (MATCH) | 77644 | 2026-09-03T16:43:03Z |
| 16 | `sector-intelligence_banking.png` | `/research/sector/Banking` | `dfd4c446bd1483f7b9850314aed7f0d5a5e76b67` | `c2b069025aa9cd7190a58c5933b8070b51532ee23e72afe41e574ea075555640` (MATCH) | 73936 | 2026-09-03T16:43:06Z |
| 17 | `cross-sector-intelligence.png` | `/research/cross-sector` | `b8756d0c188061a4e4538d925ae3cf51531e63aa` | `e24197ef595a90b8370cede12b522f667e4b9f00ce18b2cdb985e03569d74359` (MATCH) | 87888 | 2026-09-03T16:43:09Z |
| 18 | `decision-matrix.png` | `/intelligence/decision-matrix` | `d561c6c2e3a664198077aa4b5e61a8773549096d` | `9af08901614a768785c3f065d76d101918ec0bd6cb8007b2bed20dcfd8dd600e` (MATCH) | 75478 | 2026-09-03T16:43:11Z |
| 19 | `screener.png` | `/screener` | `ca7c249b9a97dabd3c356eb11b597eb0bca20d7f` | `6988245d16a5d41e78531e3efbb23a1810f27b7d3641931409b078f541f7582c` (MATCH) | 88455 | 2026-09-03T16:43:13Z |
| — | `CAPTURE_MANIFEST.json` | — | `006690137d19c3fcb9f82892455a29127afc6ad4` | (manifest itself; sha256 27ed15244dcfebf72bb2b786b86eabf1fade8cd994a0d27a1e3aee080c296d52) | 135789 | 2026-09-03T16:42:14Z–16:43:15Z |

### Appendix D — Golden fixtures and Executive derivation inputs

| Sector | Golden fixture path (identical blob @ 7964fcc and @ 42f91fad) | Blob | Composite → conviction | Quality key = value | Risk key = value | Verdict |
|---|---|---|---|---|---|---|
| Banking | `iips-platform/src/sector-engines/banking/frozen-assets/banking-expected-outputs-1.0.0.json` | `9f776937ac5949b0462cc5eb8fb7cbe04fa979d7` | 47.1 | `asset-quality` = 15.0 | `capital-strength` = 70.0 | Watch |
| Insurance | `iips-platform/src/sector-engines/insurance/insurance-expected-outputs-1.0.0.json` | `4d3fcd96df6151fca99707773d26ba22babe6a7c` | 72.3 | `underwriting` = 72.2 | `solvency` = 75 | Buy |
| Capital Markets | `iips-platform/src/sector-engines/capital-markets/capital-markets-expected-outputs-1.0.0.json` | `354d02028578b64dff0a076be95aeef602ca3161` | 84.6 | `earnings-quality` = 90 | `earnings-quality` = 90 | Strong Buy |
| Healthcare | `iips-platform/src/sector-engines/healthcare/healthcare-expected-outputs-1.0.0.json` | `8071d2dd5a1ca0459773df1bb1339d9e587528ad` | 75.5 | `revenue-quality` = 40 | `clinical-quality` = 90 | Buy |
| Hospitality | `iips-platform/src/sector-engines/hospitality/hospitality-expected-outputs-1.0.0.json` | `c88c2fdc38db554b0e1373b55920ee3aad6f4ffe` | 79.0 | `occupancy` = 75 | `capitalRisk` = 79.5 | Buy |
| Energy | `iips-platform/src/sector-engines/energy/energy-expected-outputs-1.0.0.json` | `be22ae30904e9e2326bdc2b7086d3435f0b4f077` | 66.9 | `quality` = 75.0 | `risk` = 75.0 | Accumulate |
| Utilities | `iips-platform/src/sector-engines/utilities/utilities-expected-outputs-1.0.0.json` | `b59566a99dc9a68cc9dd8f7505a06034a07a2f40` | 74.1 | `quality` = 79.5 | `risk` = 75.0 | Buy |
| Consumer | `iips-platform/src/sector-engines/consumer/consumer-expected-outputs-1.0.0.json` | `994c5fb6ffdb5baf8147ddc8e14a602c20ca9dde` | 79.5 | `quality` = 90.0 | `risk` = 75.0 | Buy |
| Industrials | `iips-platform/src/sector-engines/industrials/industrials-expected-outputs-1.0.0.json` | `d85ae658db50c20bea97774582f90103c3790192` | 77.2 | `quality` = 75.0 | `risk` = 75.0 | Buy |
| Technology | `iips-platform/src/sector-engines/technology/technology-expected-outputs-1.0.0.json` | `fd5246744306ce054f10460442359892bb84a5dc` | 76.3 | `quality` = 85.5 | `risk` = 75.0 | Buy |
| Telecommunications | `iips-platform/src/sector-engines/telecommunications/telecommunications-expected-outputs-1.0.0.json` | `0d45ffc44df6d61a6f95dac15a12cb6f88be3155` | 77.8 | `quality` = 80.2 | `risk` = 75.0 | Buy |
| Automobile | `iips-platform/src/sector-engines/automobile/automobile-expected-outputs-1.0.0.json` | `b9982d744d92d592714dcc5b1e8599bed63752f2` | 71.3 | `quality` = 65.2 | `risk` = 75.0 | Buy |
| Materials & Metals | `iips-platform/src/sector-engines/materials-metals/materials-metals-expected-outputs-1.0.0.json` | `3e67cb6f01fdc7a2459d6f4376e54cfa4b89cf2e` | 82.5 | `quality` = 90.0 | `risk` = 81.0 | Strong Buy |
| **Σ / 13** | | | Σ=964.1 → mean 74.1615 → **74.2** | Σ=932.6 → mean 71.7385 → **71.7** | Σ=1010.5 → mean 77.7308 → **77.7** | |

Concentration = max sector exposure = r1(1/13 × 100) = **7.7**; Diversification = r1(max(0, 100 − 7.7 + (13 − 1) × 3)) = **128.3**; Holdings = **13** (one reference holding per frozen engine, ids `${sector}-H1`, portfolioId `PF-REAL`, scenario `Balanced`).

### Appendix E — Screener capture row reconciliation

| Sector | Derived composite | Derived quality (key) | Derived valuation | Row in `screener.png` | Result |
|---|---|---|---|---|---|
| Banking | 47.1 | 15.0 (`asset-quality`) | 50.0 | 47.1 / 15 / 50 | MATCH |
| Insurance | 72.3 | 72.2 (`underwriting`) | null | not shown | EXPECTED EXCLUSION (valuation null; 'Include unavailable' off) |
| Capital Markets | 84.6 | 90 (`earnings-quality`) | null | not shown | EXPECTED EXCLUSION (valuation null; 'Include unavailable' off) |
| Healthcare | 75.5 | 40 (`revenue-quality`) | null | not shown | EXPECTED EXCLUSION (valuation null; 'Include unavailable' off) |
| Hospitality | 79.0 | 75 (`occupancy`) | null | not shown | EXPECTED EXCLUSION (valuation null; 'Include unavailable' off) |
| Energy | 66.9 | 75.0 (`quality`) | 30 | 66.9 / 75 / 30 | MATCH |
| Utilities | 74.1 | 79.5 (`quality`) | 30 | 74.1 / 79.5 / 30 | MATCH |
| Consumer | 79.5 | 90.0 (`quality`) | 30 | 79.5 / 90 / 30 | MATCH |
| Industrials | 77.2 | 75.0 (`quality`) | 60.0 | 77.2 / 75 / 60 | MATCH |
| Technology | 76.3 | 85.5 (`quality`) | 60.0 | 76.3 / 85.5 / 60 | MATCH |
| Telecommunications | 77.8 | 80.2 (`quality`) | 75.0 | 77.8 / 80.2 / 75 | MATCH |
| Automobile | 71.3 | 65.2 (`quality`) | 75.0 | 71.3 / 65.2 / 75 | MATCH |
| Materials & Metals | 82.5 | 90.0 (`quality`) | 75.0 | 82.5 / 90 / 75 | MATCH |

### Appendix F — Commit index (47 commits; ancestry per lineage)

| Commit (full SHA) | Author date | In c440 ancestry | In m1-ad4-repair ancestry | In main ancestry | Subject |
|---|---|---|---|---|---|
| `42f91fad0ff5141fce665b068b544224ac471f73` | 2026-09-22T09:31:11+00:00 | Y | N | N | docs(d115): record blocked identity reconciliation |
| `8b1096828e189c9107da7662afb3b93bf1c1d149` | 2026-09-21T15:20:38+00:00 | Y | N | N | fix(pit): complete governed D114 handoff, gap refusal, executable Company path and Windows readiness |
| `7964fccefbf95341699bf56b5833b2432981767d` | 2026-09-03T12:53:56+05:30 | N | Y | N | E2E-017/E2E-018: add Engine Master Matrix and Screenshot-to-Certified-Product Parity Matrix |
| `2f1049d0db348733f4d4f15fb4dcc57d4f2742fa` | 2026-09-03T23:36:51+05:30 | N | Y | N | E2E-018: add Stage A screenshot capture artifacts (19 PNG + CAPTURE_MANIFEST.json) |
| `eae2ff6937b257883433348560ae92f5485629e5` | 2026-09-08T19:09:38+05:30 | Y | N | Y | chore: align program baseline with IIPS integration boundary |
| `e93b14aa58b4719f7d89c79fb0942781a393c17f` | 2026-09-08T18:24:34+05:30 | Y | N | Y | chore: establish IIPS production market data program v1.0 baseline |
| `7325aeda8c9881ebdf2b96f64323998f1c46ba26` | 2026-08-12T16:19:54+05:30 | N | Y | N | chore: establish durable Phase 12 certified baseline |
| `f8aa038e78373113858459c8136ba888cae6520c` | 2026-09-03T01:11:46+05:30 | N | Y | N | A2-A1: add Tier-3 final-readiness certificates |
| `ad41b4d48299b7a58d3f2f44ae8ef8e11462f294` | 2026-09-13T16:53:36+00:00 | N | Y | N | P15 Closure Report (E-12): Consolidate on accepted implementation branch |
| `9c34f7c32d123442d6a4d91d0e5a8087da526cf4` | 2026-09-22T10:18:16+05:30 | Y | N | N | D-PIT-WIRE-01 Windows acceptance evidence |
| `69812e1f918fb783f657b5c5000c8688a5d29c33` | 2026-09-21T14:38:25+00:00 | Y | N | N | docs(d-pit-wire-01): implementation evidence — T1-T5 results, T4 pre-existing P09 guard disposition, Windows a |
| `4b37e5b3fec81e06464a91ea524808d28c21acdf` | 2026-09-14T05:28:34+00:00 | Y | N | N | UI Source Provenance: Establish frontend/ baseline authority |
| `1dc7c53db9320fe5221fcafce0c33585bfbb33d4` | 2026-09-14T06:34:20+00:00 | Y | N | N | IIPS Platform Source Provenance (WIN-UI-IIPS-PLATFORM-PROVENANCE-01) |
| `b923dd55e5faac706a221b660b3bcca3c8c3cd5e` | 2026-09-14T07:00:09+00:00 | Y | N | N | WIN-UI-REPLAY-BASELINE-PROVENANCE-01: Establish provenance for Program v1.1 replay baseline |
| `3b23f2760ee289f7647af42eb9e7e3b0c98207af` | 2026-09-14T09:46:23+00:00 | Y | N | N | WIN-UI-TARGET-PARITY-ADJUDICATION-01: Reject Target Product screenshot as non-governing |
| `cfe33536573cc118870ba728d1088e020c20476f` | 2026-09-14T13:05:37+00:00 | Y | N | N | P13-B: implement P12 governed transport binding (P13-B-01..09) under D54 |
| `9e0500889d76cb2561b75f3e0e4017a121ca419f` | 2026-09-15T01:51:48+00:00 | Y | N | N | D81: UI07 Watchlists recovery - persistent lists, triggers, baseline deltas |
| `da4305149bd5495789f893f530edb2526d08bb5b` | 2026-09-15T07:27:16+00:00 | Y | N | N | D89: global UI12 data-mode propagation — 6 frozen route families (Phase 1) |
| `3c1491424e384fcd77151b7ca9c3efa5779de738` | 2026-09-15T06:45:09+00:00 | Y | N | N | D86-Q: R-7 browser qualification result — Portfolio data-mode paths PASS (bounded) |
| `67f749c7e74d370a98d5a4b696fec6f1009ddcf0` | 2026-09-21T14:36:51+00:00 | Y | N | N | feat(pit): governed PIT transport wiring — seam hook, provider, D114 admission bridge, /api/company/:id (D-PIT |
| `53819b98cb8370eb7b955f359eccd0caf4fe4540` | 2026-09-20T07:45:55+00:00 | N | N | N | TARGET UI: implement executive dashboard convergence |
| `49befadaa822d05161edad22842d6a7102986100` | 2026-09-20T07:57:59+00:00 | N | N | N | TARGET UI: implement watchlist highlights convergence |
| `75617a1552cc849b78e53b33187caa73d18b61cc` | 2026-09-20T08:04:26+00:00 | N | N | N | TARGET UI: implement alerts requiring attention convergence |
| `0d619b1708680379335b224f2df0d87a6b89f8fa` | 2026-09-20T08:13:29+00:00 | N | N | N | TARGET UI: implement quick actions convergence |
| `8b92c516b90d73827a4dee16e0ccbd8b666ba51d` | 2026-09-20T08:23:44+00:00 | N | N | N | TARGET UI: implement domain previews convergence |
| `f5742eb3adc49dd17510b4b60be056bf609f6313` | 2026-09-20T13:20:07+00:00 | N | N | N | feat(p14-r7): implement INT-017 target visual convergence across 4 bounded shell files |
| `65b78f7723700dc9334801429382d1ebcf7c4737` | 2026-09-20T17:13:06+00:00 | N | N | N | feat(p14-r7): converge desktop analytical presentation |
| `d771e6a28514a6c529742d318dd9f3f08ed205f6` | 2026-09-20T23:13:26+05:30 | N | N | N | D114 Stage5 record remaining replay UI observations |
| `94f519bfb707b27dc97ace999697bb98cbcb4b50` | 2026-09-22T12:50:06+00:00 | N | N | Y | Merge pull request #1 from arena/01a0b8e8-iips-production-market-data |
| `f13002e4eada9f24ee8aee854f66e2c6f07b1470` | 2026-09-22T16:08:42+00:00 | N | N | Y | feat(phase1a): recover full-IIPS application shell (scaffold, not yet mounted) |
| `144e8edf8d126a129ba4ed87dbd077765bd4051c` | 2026-09-22T16:33:29+00:00 | N | N | Y | feat(phase1b): mount full-IIPS shell with BI-08 PortfolioWorkspace at /portfolio |
| `881371e1b286315ac984a3c3d421bdec08493fc7` | 2026-09-22T17:25:56+00:00 | N | N | Y | PHASE 1C: Intelligence surface via PATH L (local offline view-model) |
| `f9101be99d364592bfcbd9d9ea3aa389716782f2` | 2026-09-22T18:18:49+00:00 | N | N | Y | PHASE 2: Evidence presentation-only surface via PATH L (OPTION B authorized) |
| `c7faf1f0f6ca6ee85f4274ea915bbe3c4f5c9afd` | 2026-09-22T18:49:19+00:00 | N | N | Y | PHASE 3: Executive presentation-only surface via PATH L (OPTION A authorized) |
| `ad2205a76f944666ea40a85d6db43f9a89e3e8b1` | 2026-09-22T19:35:14+00:00 | N | N | Y | PHASE 4: Research (UI03) presentation-only surface via PATH L (OPTION A authorized) |
| `27e21737e879241951fedc938772bee932379450` | 2026-09-23T07:27:09+00:00 | N | N | Y | chore(governance): PHASE-5 OPTION A authority act — offline full-shell restoration (act precedes implementatio |
| `6b8afda47fdc1309f9566764d3d7bfc8a87e2c01` | 2026-09-23T07:50:03+00:00 | N | N | Y | feat(shell): PHASE-5 OPTION A — offline full-shell restoration (donor structure, fail-closed) |
| `28a6ed28308ac4eab0c06f8ae72b009c974dd7db` | 2026-09-23T07:53:26+00:00 | N | N | Y | chore(governance): OPTION A final result — offline full-shell restoration COMPLETE (structure restored, fail-c |
| `4f8db9dc299f5372dda9cb782bb2e3e07871a5df` | 2026-09-23T10:11:11+00:00 | N | N | Y | chore(governance): F-3 authority act — UI08 Security Master functional implementation (act precedes source) |
| `c3d61a15863bf53497a20cbe95cfef3c5498d61e` | 2026-09-23T10:27:06+00:00 | N | N | Y | IIPS — Implement UI08 Security Master functional surface |
| `78c95d03311a4893bf513adbeff43fe0d06c7883` | 2026-09-23T11:20:55+00:00 | N | N | Y | Merge pull request #3 from ramkivs/arena/01a0c960-iips-production-market-data |
| `373f0c0d5a74412201b7ef4ebe72637b17e31a83` | 2026-09-23T15:33:41+00:00 | N | N | Y | chore(governance): record re-materialized F-8 UI06 authority act |
| `f7cd994f6ebc02f24472783e9567593d2bfce4f5` | 2026-09-23T16:55:08+00:00 | N | N | Y | feat(shell): restore UI06 multifactor screener surface |
| `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | 2026-09-23T17:13:40+00:00 | N | N | Y | Merge pull request #4 from ramkivs/arena/01a0ce79-iips-production-market-data |
| `a34b6c491bbec134cbb516b84717d8fac13fd985` | 2026-09-22T14:17:52+00:00 | N | N | Y | docs(forensic): full-IIPS baseline analysis — PLAUIBLE, LINEAGE INCOMPLETE |
| `aef26c6254179d32f89a5329b51aecbbaa7b383a` | 2026-09-22T20:03:36+00:00 | N | N | Y | chore(governance): IIPS historical -> current UISurface FULL CONVERGENCE INVENTORY = classification B (read-on |
| `11e851ff5a16fc7d54baad5c58bb6fb0bd3d08ea` | 2026-09-19T10:35:47+05:30 | N | N | N | D115 preserve HDFC Life 15-Sep EOD evidence |

---

FORENSIC CROSS-VERIFICATION & ACCESS-RESOLUTION GATE — STATUS
DONOR REMOTE ACCESS: AVAILABLE (BRANCH A) AT GATE EXECUTION; SESSION CREDENTIAL PATH DEGRADED LATE-SESSION (401/credential-prompt) — REACQUISITION ALREADY COMPLETE
DONOR REF: VERIFIED — 42f91fad0ff5141fce665b068b544224ac471f73
CONTENT AUTHORITY: VERIFIED — 8b1096828e189c9107da7662afb3b93bf1c1d149 (artifact's "8b109681" form matches zero objects)
CERTIFIED PRODUCT: VERIFIED — 7964fccefbf95341699bf56b5833b2432981767d (disjoint root 7325aeda8c9881ebdf2b96f64323998f1c46ba26)
CAPTURE DEPOSIT: VERIFIED — 2f1049d0db348733f4d4f15fb4dcc57d4f2742fa (19/19 captures byte-exact)
DIVERGENCE POINT: VERIFIED — eae2ff6937b257883433348560ae92f5485629e5
EXECUTIVE PAYLOAD PROVENANCE: ESTABLISHED AS DERIVED COMPUTATION OVER COMMITTED FROZEN INPUTS (runtime re-execution residual deferred)
HISTORICAL IMPLEMENTATION: PROVEN (stronger basis than artifact)
CURRENT PARTIALITY CAUSE: CONTROLLED CROSS-LINEAGE NON-PORTING + CONTRACT DRIFT — PROVEN; DELETION DISPROVEN
TARGET-UI/p14-r7 THIRD LINEAGE: LOCATED AND CHARACTERIZED (composition-only; authority records absent from advertised history)
OPERATOR DEPOSITION: NOT REQUIRED (contingency procedure dry-run validated)
D115: UNCHANGED · PROVIDERS: NOT ACTIVATED · PRODUCTION: NOT AUTHORIZED · WINDOWS: UNTOUCHED · MAIN/SESSION BRANCH: UNTOUCHED · COMMITS CREATED: NONE
NEXT AUTHORIZED GATE (separate authority required): read-only re-execution gate — install frontend/iips-platform dev dependencies in a disposable worktree, execute `computeCertifiedPlatform`/`computeCertifiedExecutive` at `7964fcc` and at `42f91fad`, and diff outputs against the §9 derivation and the E2E-018 observables; then, only under explicit authority, a per-surface recovery gate using Appendix B minimum units.
