# Dhan Live Integration — Comprehensive Current-State Investigation, Work-Item Reconciliation and Execution Roadmap

**Document ID:** `DHAN-LIVE-INVESTIGATION-2026-11-25`
**Date:** 2026-11-25
**Type:** Independent investigation and execution planning. **No source, configuration, test, launcher script or runtime data was modified by this investigation.** No live Dhan call was made and no credential was requested, read, generated or used.
> **Post-publication status note (added 2026-11-25, same day).** This document is preserved as the
> investigation it was — findings and reasoning stand. **One of its recommendations has since been
> executed:** the **D-5 follow-up** (row 11 below; **BLK-1**) was decided by the Programme Authority
> and implemented. An entirely zero-filled order book is an **ABSENT MARKET BOOK**, not a malformed
> response. Authority: **Addendum A, §7** of
> `docs/integration/D-5-BID-ASK-REPRESENTATION-AND-VALIDATION-DECISION-2026-11-21.md`. Implementation:
> `src/providers/dhan/dhan_normalizer.ts`. Regression: `D5-A0…D5-A10` in
> `tests/d5_bid_ask_representation.test.ts`, anchored to the retained D-18 raw capture. Full guarded
> suite: 2,200 tests, 0 failures. Rows 11, 5, and BLK-1 below are updated to reflect the closure;
> the narrative sections that describe it as open are left intact as the record of the finding.

**Controlling instrument:** IRR `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md`, blob `1e26ff545bc42e5967a0c15f1726da7959c13fcb`, v1.1 (38 work items, 7 decisions, 8 milestones, 9 phases).
**Mandatory investigation input:** IRR `docs/integration/DHAN-LIVE-MARKET-DATA-CURRENT-STATE-INVESTIGATION-2026-11-11.md`, blob `f2b28acfd38066c7b5ef407ca85ce10f811bbf40`.

**Evidence baselines pinned by this investigation**

| Repository | Baseline | How verified |
|---|---|---|
| IPD `ramkivs/iips-production-market-data` | **`85ac12736cb9e2f21f639ca121d289d49ca2ba3c`** (`main`, merge of PR #194, 2026-11-25T12:15:08Z) | `git fetch`; full clone, 665 commits, 186 heads, 8 tags |
| IRR `ramkivs/iips-review-recovered` | **`be8b85f5ff771772001bddb8a8ca2546a9bf21d2`** (`main`, merge of PR #651, 2026-11-24T20:48:03Z) | GitHub API (IRR is public; not present in this sandbox checkout) |

**Executed evidence obtained during this investigation (IPD, at `85ac127`)**

| Gate | Result |
|---|---|
| `npm ci --no-audit --no-fund` | completed, 33 packages |
| `npx tsc --noEmit` | **exit 0** |
| `npm run build` (tsc + vite + portfolio-ui + pit + dhan packages) | **exit 0** |
| `npm test` (guarded) | **2,189 tests · 2,175 passed · 0 failed · 14 skipped · exit 0** · `[test-guard] OK` |
| `node --test dist/tests/dhan_*.test.js` | **503 tests · 491 passed · 0 failed · 12 skipped** (62 suites) |
| `node --test dist/tests/dhan_w19_d02_freshness_cache.test.js` | 5/5 pass (W19-1 … W19-5) |
| `node --test dist/tests/w22_bse_bounded_calendar.test.js` | 8/8 pass |

---

## 1. Investigation coverage and repository state

### 1.1 Scope actually investigated

Both repositories were investigated in their entirety against the sixteen required axes:

| Axis | IPD `85ac127` | IRR `be8b85f` |
|---|---|---|
| Branch enumeration | ✅ 186 heads (186 total; 24 non-`arena/*` topical: `main`, `g3/*`, `gate-*`, `docs/dhan-api-v2-*`, `d114-*`, `np04-*`, `operator/*`, `windows-acceptance/*`, `work/*`, `local/*`, `gov03/*`, `ci/*`, `fix/*`, `m1-ad4-repair`, `p14-implementation-recovered`, `iu-6-*`, `artifact/*`) | ✅ >100 `arena/*` refs (session branches; all settlement on `main`) |
| Commit history | ✅ 665 commits, full graph | ✅ to `main` tip |
| Pull requests | ✅ **190 PRs** (#1–#194); **2 open** (#193, #171); 6× `CLOSED` | ✅ **3 open** (#604 draft, #566, +1); 20 Dhan-titled |
| Tags / releases | ✅ 8 tags; **no Dhan release** | ✅ none for Dhan |
| Implementation files | ✅ read directly | ✅ via records |
| Test suites & execution | ✅ **executed: 2,189 / 2,175 pass** | ⚠ not executed here; IRR reports 3,037 pass @ `2b61a50` |
| Integration evidence | ✅ read | ✅ read |
| Runtime verification | ✅ read (`evidence/`) | ✅ read (`evidence/`) |
| Owner attestations | ✅ read | ✅ read |
| Open review comments | ✅ #193, #171 | ✅ #566 (1 comment) |
| Cross-repo dependencies | ✅ pin `26855625` ↔ IPD `main` | ✅ |
| Governance / decision records | ✅ D-3, D-5, D-6, D-7, D-18 | ✅ D-4, D-7, W-24 |
| Roadmaps | ✅ `IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md` | ✅ controlling roadmap v1.1 |

### 1.2 Repository relationship and responsibilities

| | **IPD** — provider | **IRR** — consumer |
|---|---|---|
| Owns | Provider access, credentials, secret store, instrument mapping, normalization, canonical contracts, cache, freshness evaluation, provider diagnostics, Windows launcher | Presentation, screen routes, consumer boundaries, configuration documentation, runbook, governance records, browser leak gate |
| Work items owned | 22 | 16 |
| Coupling | Publishes the `iips-production-market-data` package | Pins it: `2685562522f1a2fd1d745a7857f771bf21453315`, guarded by `.ci/verify-ipd-pins.mjs` |

**Normative boundary (roadmap §6, reaffirmed by D-4.2):** "No work item in this roadmap introduces direct Dhan API access from IRR, and none may." **Verified intact** — IPD `src/providers/dhan/**` is the sole vendor-egress surface; IRR consumes through the authenticated loopback transport only.

### 1.3 ⚠️ Investigation hazard: two colliding W-series

IRR `main` carries **two independent `W-nn` numbering series**:

* **Roadmap series** — the controlling 38 items (`DHAN` context).
* **Portfolio/IID series** — IRR tracker `§16.NNN` lines in `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` (blob `a779360b…`, 4,422,661 bytes). IPD has the same hazard: its `IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md` uses `W03…W20` for **portfolio** items (§1.3 row `| W06 | P0 Market observations and freshness |`).

**Demonstrated false positives excluded from this report:**

| Apparent evidence | Actually |
|---|---|
| IRR PR **#645** "W17 user-facing modes: ACTUAL/REFERENCE/DEGRADED" | Portfolio-mode indicator. **Not** roadmap W-17 (historical wire qualification). |
| IRR PR **#609** "consolidate W-19 preservation regression evidence" | Portfolio regression bundle. **Not** roadmap W-19 (D02 cache). |
| IPD roadmap `W06 — Market observations and freshness` | Portfolio-series item. **Not** roadmap W-06 (first live authentication). |

**Consequence:** roadmap work-item status **cannot** be derived from PR titles in either repository. Every determination below was made from source inspection or from a record that names the roadmap ID explicitly. **This is itself a governance defect (BLK-9).**

---

## 2. Controlling documents and roadmap reconciliation

### 2.1 What the roadmap specifies

* **45 tracked units** = 7 decisions (D-1…D-7) + 38 work items (W-01…W-15, W-17…W-39; **W-16 was never allocated**).
* **8 milestones:** M1, M2a, M2, M3a, M3, M4, M5, M6.
* **Normative evidence ladder (§8):** E0 source → E1 unit/contract → E2 synthetic E2E → E3 local Windows operational → **E4 live Dhan qualification**. *Only E4 may be described as live qualification.*
* **Critical path (§10.2):** `D-1 → D-2 → W-01 → W-02 → W-03 → W-04 → [D-6] → W-06` → **M1**; then M2a/M2 (quotes) and M3a/M3 (history) in parallel; **M4** = M2 ∧ M3 ∧ W-05 ∧ W-07→W-08→W-10 ∧ W-11 ∧ W-19 ∧ W-21 ∧ W-22.

### 2.2 Material changes since the roadmap was written

| # | Change | Authoritative evidence |
|---|---|---|
| 1 | **D-3 ACCEPTED** (`SUFFICIENT WITH DISCLOSED LIMITATIONS`) **and W-22 ACCEPTED/CLOSED** | IPD `docs/integration/IPD-D3-MARKET-CLOSED-FRESHNESS-DECISION-BLOCKER-2026-11-19.md`, PR **#179** @ `8f00d7ae63e43e712a75bff2a5854fbdb4d63021` |
| 2 | **D-5 ACCEPTED** (explicit `null`, D01 schema `2.0.0`, supplied zero invalid) | IPD `D-5-BID-ASK-REPRESENTATION-AND-VALIDATION-DECISION-2026-11-21.md`, PR **#183** |
| 3 | **D-4 ACCEPTED** both repos (Option C, D-4.1–D-4.7) | IRR `DHAN-D4-OWNER-ACCEPTANCE-2026-11-23.md`; IPD `D-4-D02-D114-PIT-MIRROR-ACCEPTANCE-2026-11-23.md`, PR **#191** |
| 4 | **D-7 AMENDED** for W-24 (six owner decisions) — amendment **awaiting IRR acceptance** (U-3) | IPD `DHAN-D7-…-2026-11-12.md` §4.5–§4.10, PR **#186** |
| 5 | **W-07/W-08/W-09/W-10 implemented** | IPD PRs **#168, #169, #170, #172**; IRR PR **#569** |
| 6 | **W-19 implemented** (D02 cache + four-timestamp freshness) | IPD `dhan_market_data_service.ts`; test `dhan_w19_d02_freshness_cache.test.ts` 5/5 |
| 7 | **W-22 implemented** (bounded NSE/BSE calendar, session-aware evaluator) | IPD PR **#179**; `calendars/ipd-equity-2026.v2026-11-19.{1,2}.json`; `w22_bse_bounded_calendar.test.js` 8/8 |
| 8 | **W-27 implemented** (mapping expansion, 4,680 rows, byte-reproducible) | IPD PRs **#164, #189**; `evidence/dhan-p7/qualification-manifest.json`; `npm run dhan:w27-expand -- --check` |
| 9 | **W-36 implemented** (launcher daemon integration) | IPD `windows-setup/03-Start-IipsServers.ps1` `-StartMarketDataDaemon`, port 8791 guard, manifest row; `06-Stop-IipsServers.ps1` port array includes 8791 |
| 10 | **Quote E4 (M2a) executed** | IPD `DHAN-LIVE-RELIANCE-QUOTE-OPERATOR-ACCEPTANCE-2026-11-18.md` |
| 11 | **W-13 / W-15 / W-29 / W-39-boundary implemented in IRR** | IRR PRs #627, #641, #651 |
| 12 | **NEW: D-18 raw-depth capture** — reveals a depth-shape defect and a spec contradiction (see §2.4) | IPD PRs #187, #192, #194; `evidence/dhan-d18/` |

### 2.3 The central discrepancy: W-06 is **not** complete

This is the single most consequential finding of the investigation.

| Record | Claim | Verdict |
|---|---|---|
| IRR roadmap header (controlling) | "W-06 is **COMPLETE — OWNER ATTESTED**; no scan is claimed … no additional W-06 evidence is required", pointing at IPD commit `617fab0` | **Unsupported** |
| IRR W-14 investigation, §3.1 | "IPD publication gap … this session verified `617fab0` fetch **404** from IRR remote" | Consistent with the finding below |
| **This investigation at IPD `85ac127`** | `git cat-file -e 617fab0…` → **object does not exist**. `git log --all -- '*W06-FINAL-OWNER-ATTESTATION*'` → **empty across all 186 heads**. File **not present** on `main`. No document anywhere in IPD contains the phrase "owner attested". | **Definitive** |
| IPD's own current statement | "**W06 remains IN PROGRESS / NOT ACCEPTED.** Readiness is not measurement." — PR **#193**, open | **Contradicts IRR** |

**Established position:** the W-06 attestation record **does not exist in IPD at any reachable commit**. The roadmap's governing progression note therefore rests on an unverifiable artefact. W-06's *observable* substance does exist and is strong — a live authenticated Reliance quote at checkout `26855625` (HTTP 200, `EQ_RELIANCE_IN` resolved, `qualityState: GOOD`, `freshness: CURRENT`, lineage hash returned) — and IPD's own roadmap confirms "This satisfies milestone M1 (\"one real authenticated interaction with Dhan succeeds\")". **So M1 is substantively achieved; the acceptance *record* is the missing object.** Classification: W-06 **IMPLEMENTED**, evidence **PARTIAL**, acceptance **MISSING**, and IPD itself records the status as **in progress / not accepted**.

### 2.4 The `W17` label on IRR PR #645 and two further discrepancies

Beyond the W-series collision (§1.3):

| # | Discrepancy | Authoritative position |
|---|---|---|
| D-1 | IRR roadmap asserts W-06 COMPLETE; IPD holds no such record and states NOT ACCEPTED | **§2.3** — record MISSING; M1 substantively met; IPD status prevails |
| D-2 | IRR pin is `26855625`; IPD `main` is `85ac127`, and commit `9d5ffa4` changed the `1D` historical `toDate` to `+1 day` (exclusive upper bound) | **Pin drift is real and unresolved.** IRR history runs against a build whose daily boundary differs from IPD `main` |
| D-3 | Roadmap §1 says quotes are "end-to-end blocked"; M2a evidence now exists | **Superseded** — quotes are live-capable and one live quote has been accepted. *Qualification* (M2) is still absent |
| D-4 | W-14 E4 readiness (§0) says the 96-instrument sample is stale: 6 of 96 no longer resolve; registry now 4,680 rows over 2,390 companies | **Confirmed** — see W-14 row; sample must be re-derived before E4 |
| D-5 | D-18 depth captures labelled "market-closed" disagree: 2026-11-23 all-zero, 2026-11-25 populated at 13:45 IST | **Both real**; the 11-25 label is wrong for its contents (D-18 record §1) |
| D-6 | **Spec contradiction on zero depth** (see below) | **Open defect** |

**D-6 in detail — zero-filled depth is fatal, but the vendor returns it in normal operation.**

* D-5 approved decision #2: "Supplied zero — **Invalid**".
* D-18 record §1: the 23-Nov post-close capture is "**a populated 5×5 book of zeros**, not an absent block, a `null`, or an empty array."
* `src/providers/dhan/dhan_normalizer.ts` `topOfBook()`: a supplied price that is not finite-and-strictly-positive → `kind: 'invalid'`; the caller then returns `dhanFailure('MALFORMED_RESPONSE', …)`.

**Empirically confirmed by this investigation** (compiled `dist/`, D-5 code path, reconstructed wire shape per D-18):

```
ABSENT depth (empty arrays)                     => ok | bid: null  ask: null
ZERO-FILLED 5x5 (D-18 observed post-close)      => FAIL-CLOSED: MALFORMED_RESPONSE
```

**Meaning:** a quote taken while the market is closed — a perfectly normal, daily-occurring condition — fails closed as `MALFORMED_RESPONSE` instead of reporting unavailable depth. This directly obstructs **M2** (which requires "absent depth reported as unavailable") and **W-22's** session-aware premise (which exists precisely to make out-of-session data usable). It is not a test gap: all 503 Dhan tests pass because no test exercises a populated zero book.

---

## 3. Complete consolidated work-item status table

Classification key — **Implementation:** NOT STARTED · IN PROGRESS · PARTIAL · IMPLEMENTED · COMPLETE · BLOCKED · DEFERRED. **Evidence:** VERIFIED · PARTIAL · PENDING · MISSING · INSUFFICIENT · NOT REQUIRED. "VERIFIED" = independently reproduced in this investigation.

### Phase 0 — Decisions

| S.No. | Work ID | Work Item Description | Notes — exactly what is outstanding | PR No(s). | Implementation Status | Evidence Status | Owner | Dependency Workstream |
|---|---|---|---|---|---|---|---|---|
| 1 | **D-1** | Windows secret-store selection: DPAPI user scope, two carriers, owner-only DACL, versioned envelope, atomic rotation, provider admission | **No outstanding work.** Materialised in code, not merely decided: `dhan_dpapi_vault_backend.ts`, `dhan_dpapi_carrier.ts`, `dhan_dpapi_acl.ts`, `dhan_dpapi_process.ts`; two separate D-1 logical key paths named in the Stage-1 reconciliation note for the W-11/DPAPI restoration branch. | IPD #156 (CLOSED, superseded), #174, #188 | **COMPLETE** | VERIFIED (code + 503-test suite) | IPD / Program Authority | Enables W-01, W-02, W-04 |
| 2 | **D-2** | Credential read posture + bounded re-read, four permitted triggers, latch after rejected re-read | **Fully implemented as of 2026-11-25.** The resolver distinguishes `CREDENTIALS_EXPIRED` (local pre-flight, no vendor call) across 6 distinct paths, and the *bounded re-read/latch* half was delivered by **W-05** (`dhan_credential_session.ts`). The residual this row previously recorded is closed. | IPD #156, #174; W-05 record | **COMPLETE** | **VERIFIED** | IPD | D-1 → enabled W-02, W-05 |
| 3 | **D-3** | Freshness semantics for market-closed periods | **No outstanding work.** Owner accepted 2026-11-19 as **SUFFICIENT WITH DISCLOSED LIMITATIONS**; five-trading-day IID rule recorded as not reopened; bounded weekday/weekend + verified-holiday + Muhurat model accepted for NSE_EQ and BSE_EQ, 1–19 Nov 2026. Unsupported dates remain `UNKNOWN`/`UNAVAILABLE` by design. | IPD #179 | **COMPLETE** | VERIFIED | IPD / Program Authority | Enables W-22 (done) |
| 4 | **D-4** | D02 vs D114/PIT precedence (Option C, D-4.1–D-4.7) | Decision and both-repo acceptance complete. **Deferred implementation obligations are enumerated** and tracked under W-19 (done), W-20 (partial) and the D02 series digest / impossible-date guard. | IRR #627 (`8f893112`); IPD #176, #191 | **COMPLETE** | VERIFIED | IPD + IRR | Enables W-20, W-39 |
| 5 | **D-5** | Canonical representation of unavailable bid/ask | **Decision complete, implemented, and its one open defect is now closed.** `null` per side, D01 `2.0.0`, strict validation, bidirectional ordering. The D-6 collision (§2.4) — the "supplied zero is invalid" rule rejecting the vendor's populated zero book post-close — was **resolved 2026-11-25** by **Addendum A** (§7 of the D-5 record): an entirely zero-filled book on **both** sides is an **ABSENT MARKET BOOK** → `bid: null` / `ask: null`, quote valid. Individual malformed levels are still rejected. | IPD #183; D-5 Addendum A | **COMPLETE** | VERIFIED | IPD | Enables W-13 (done); **unblocks M2** |
| 6 | **D-6** | Dhan token issuance/replacement procedure | **No outstanding work.** Published and rehearsed: `DHAN-D6-OPERATOR-TOKEN-ACQUISITION-AND-REPLACEMENT-2026-11-12.md` + `DHAN-D6-WINDOWS-HOST-REHEARSAL-EVIDENCE-2026-11-12.md` + conformance test `dhan_d6_operator_procedure_conformance.test.ts`. Observed token expiry `2026-11-19T10:05:01.481Z`. | IPD #156 lineage | **COMPLETE** | VERIFIED | Operator + IPD docs | Enables W-06 |
| 7 | **D-7** | Provider state model (8 states), V1/V2 verify semantics, disclosure policy | **Core complete.** Amendment present (§4.5–§4.10, six W-24 owner decisions, §4.2.1 sole identifier exception, §4.10 substring clarification). **Outstanding: IRR acceptance of the amendment (IPD U-3)** — IPD states it "is awaiting IRR acceptance and is not accepted on IRR's behalf". | IPD #186; IRR #565/#569 | **COMPLETE** | PARTIAL | IPD + IRR | Enables W-03, W-07, W-08, W-09, W-10, W-24 |

### Phase 1 — Credential resolution unblock

| S.No. | Work ID | Work Item Description | Notes — exactly what is outstanding | PR No(s). | Implementation Status | Evidence Status | Owner | Dependency Workstream |
|---|---|---|---|---|---|---|---|---|
| 8 | **W-01** | Windows `VaultProvider` + two-key-path convention | **No outstanding work.** `WINDOWS_DPAPI` SecretRef admitted; `secret_ref.ts` extended; conformance test `dhan_w01_windows_vault_provider.test.ts` passing. Merged on `main` (not stranded on a candidate line as the earlier record stated). | IPD #156 (closed) → #174 | **COMPLETE** | VERIFIED | IPD | D-1 |
| 9 | **W-02** | Windows DPAPI `LocalHostVaultSecretBackend` (fail-closed, stdin/stdout child process, distinct scrubbed outcomes) | **No outstanding work.** Four modules + `DisabledWindowsHostVaultBackend` retained as default. Windows acceptance evidence published (`DHAN-W02-WINDOWS-ACCEPTANCE-EVIDENCE-2026-11-12.md`), ACL idempotency and cmdlet-independence records present. | IPD #156, #174, #188 | **COMPLETE** | VERIFIED (E1/E3) | IPD | W-01, D-1, D-2 |
| 10 | **W-03** | Daemon backend selection + honest egress diagnostics; remove key-path disclosure | **No outstanding work.** Selector implemented with unknown-value refusal; `describeDhanConfig` key-path disclosure removed per D-7; test `dhan_w03_backend_selection_and_diagnostics.test.ts` passing. | IPD #174 | **COMPLETE** | VERIFIED | IPD | W-02, D-7 |
| 11 | **W-04** | Credential provisioning/rotation utility | **No outstanding work.** `dhan_credential_store_utility.ts` + `dhan_credential_store_cli.ts`; `npm run dhan:credential`; test `dhan_w04_credential_store_utility.test.ts` passing. Fingerprint-only output per spec. | IPD #156 → #174 | **COMPLETE** | VERIFIED | IPD | W-01, W-02, D-1 |
| 12 | **W-05** | Credential read posture + bounded re-read, single 401/403 re-read, auth latch | **DONE 2026-11-25.** `DhanCredentialSessionHolder` owns the session; the four D-2 triggers are the only ones implemented and the enumeration is asserted closed; exactly one re-read follows 401/403 and the retry carries the replacement material; a second rejection latches with no third read or call; transients are provably not triggers; expired pre-flight makes no vendor call. 25 new cases, full suite 2,226 green. *Synthetic (E1/E3) — not live qualification.* | `DHAN-W05-CREDENTIAL-READ-POSTURE-BOUNDED-REREAD-AND-LATCH-2026-11-25.md` | **COMPLETE** | **VERIFIED (synthetic)** | IPD | D-2 ✔, W-02 ✔ → **unblocked M4** |
| 13 | **W-06** | Provision real credentials; prove first live authentication (**M1**) | **Outstanding: the acceptance record.** The artefact the roadmap cites (`617fab0`) **does not exist in IPD at any ref** (§2.3). Substantively, M1 is achieved: live authenticated Reliance quote at `26855625`, HTTP 200, `EQ_RELIANCE_IN` resolved, `qualityState: GOOD`, `freshness: CURRENT`. IPD's own roadmap treats this as satisfying M1, but IPD PR #193 states "**W06 remains IN PROGRESS / NOT ACCEPTED**". **Also open:** next live measurement targets 2026-11-26 and is blocked on NSE calendar coverage (PR #193). | IRR roadmap header; IPD #176, #193 | **IMPLEMENTED** | PARTIAL (operator-reported E4; no pub-lished zero-secret/zero-location grep) | Operator + IPD | W-03 ✔, W-04 ✔, D-6 ✔ |

### Phase 2 — Status truth

| S.No. | Work ID | Work Item Description | Notes — exactly what is outstanding | PR No(s). | Implementation Status | Evidence Status | Owner | Dependency Workstream |
|---|---|---|---|---|---|---|---|---|
| 14 | **W-07** | Live-capable `ServiceHealth` (additive, versioned) | **No outstanding work.** `contractVersion: 2`; `DhanLiveProviderConnectivity = 'NOT_CHECKED_PRE_ACCESS' \| 'CONNECTED_LIVE'`; `DhanProviderQualification = 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED' \| 'LIVE_QUALIFIED'`; unknown values rejected fail-closed. IRR mirror updated. **Verified in source at `85ac127`.** `providerQualification` remains the synthetic literal by design (raising it is a separate governed decision). | IPD **#168**; IRR pin `1ce6a829` | **COMPLETE** | VERIFIED | IPD | D-7 ✔ |
| 15 | **W-08** | Observed provider-state recorder + bounded verify probe | **No outstanding work.** `dhan_provider_state_recorder.ts`; `POST /v1/connection/verify`; test `dhan_w08_provider_state_recorder.test.ts` passing. Health read performs zero transport invocations per design. | IPD **#169**, **#172** | **COMPLETE** | VERIFIED | IPD | W-07 ✔ |
| 16 | **W-09** | `/v1/diagnostics` enforcing the D-7 MUST-NOT list | **No outstanding work.** Authenticated route; 401 on unauthenticated; test `dhan_w09_diagnostics_endpoint.test.ts` passing. | IPD **#170** | **COMPLETE** | VERIFIED | IPD | W-08 ✔, D-7 ✔ |
| 17 | **W-10** | IRR Status consumes IPD authority only; remove `secretRefPointers` | **No outstanding work.** Merged; post-merge CI run **44037855606** succeeded; full IRR suite 3,037 passed / 1 skipped / 207 files at `2b61a50`. | IRR **#569** | **COMPLETE** | VERIFIED (IRR-reported) | IRR | W-07 ✔, W-08 ✔, D-7 ✔ |
| 18 | **W-11** | Config/port/env reconciliation + IRR browser-output leak gate | **IRR scope closed.** 69 config tests; leak gate 3 fixture tests incl. injected-negative source maps; real build output passes (4 files scanned); injected `IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH` rejected with exit 1 without echoing. **Outstanding: (a) IPD's own version-specific configuration documentation — now published as `DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md` (PR #173), so this sub-item is closed; (b) the four-capability connected-daemon dry-run, which remains unperformed.** | IRR **#565**; IPD **#173** | **PARTIAL** | IRR: VERIFIED · IPD: VERIFIED (docs) · dry-run: MISSING | IRR + IPD | Enables W-15 ✔, W-21, W-29 ✔, W-36 ✔, W-37 |

### Phase 3 — Live quotes qualification

| S.No. | Work ID | Work Item Description | Notes — exactly what is outstanding | PR No(s). | Implementation Status | Evidence Status | Owner | Dependency Workstream |
|---|---|---|---|---|---|---|---|---|
| 19 | **W-12** | Qualify Dhan quote **and** historical request/response against the live vendor | **Quote leg: COMPLETE.** `buildQuoteRequestBody` emits JSON numbers; verified fixed at IPD `26855625` (PR #176); one live Reliance HTTP 200 on that commit; offline diagnostic record + regression test `dhan_quote_numeric_serialization.test.ts`. **Historical leg: entirely outstanding.** `securityId` still a **string**; `instrument: 'EQUITY'` hardcoded; **all five intervals routed to `/charts/historical`, `/charts/intraday` never called (IPD gap `G-12`)**; zero live historical calls ever executed; request shape `PROVISIONAL`. | IPD **#176**, #180 | **PARTIAL** | PARTIAL — quote E4 (operator-reported); historical `BLOCKED_ON_E4_SCHEMA_QUALIFICATION` | IPD | Enable M2, M3a |
| 20 | **W-13** | Represent unavailable bid/ask honestly | **No outstanding work on the representation.** Absent side → `null`, never `0`; malformed supplied price → rejected, never laundered to `null`; legacy `1.0.0` accepted. **Verified in source and by probe.** *Caveat: the supplied-zero branch is the D-6 defect, which is a D-5 consequence, not a W-13 regression.* | IPD **#183**; IRR #627/#641 | **COMPLETE** | VERIFIED | IPD + IRR | D-5 ✔ |
| 21 | **W-14** | Live qualification of instrument mappings against the vendor + stale-ID failure signature | **Nothing executed; technically ready but the sample is invalid.** E4 readiness assessment is complete and rigorous: 96-row manifest is the **superseded** pre-2026-11-15 revision (recoverable as blob `50d9424a…`, SHA-256 `13bd2ef1…`); **6 of 96 no longer resolve** (P04 renamed three companies 2026-11-08); 96 distinct vendor targets; `evidence/dhan-w14-e4/e4-sample-reconciliation.json` status = `READINESS_ASSESSMENT_ONLY — no live request performed`. **Outstanding: (1) owner choice among the three scopes in §9; (2) re-derived 97-request sample; (3) explicit bounded-execution authorisation; (4) the E4 run itself; (5) per-row evidence + wrong-ID control + mismatch signature.** | IPD **#190** | **NOT STARTED** (readiness complete) | MISSING | IPD | W-06 (partial); W-27 ✔ for new rows → **gates M2, M5, M6** |
| 22 | **W-15** | Quotes screen identity picker + honest field rendering | **No outstanding work.** `QUALIFIED` search-picker symmetry across `DhanQuotes.tsx` and `DhanHistorical.tsx`, locked exchange segments, shared canonical-identity module, no silent `NSE_EQ` defaulting. | IRR **#641** | **COMPLETE** | VERIFIED (IRR-reported) | IRR | W-11 ✔, W-13 ✔ |

### Phase 4 — Historical qualification

| S.No. | Work ID | Work Item Description | Notes — exactly what is outstanding | PR No(s). | Implementation Status | Evidence Status | Owner | Dependency Workstream |
|---|---|---|---|---|---|---|---|---|
| 23 | **W-17** | Qualify the Dhan historical request/response per interval | **Entirely outstanding.** Zero live `/charts/historical` calls; no `evidence/` directory for W-17. Unverified: string-vs-number `securityId`, `interval` vocabulary (`'1h'` absent from Dhan's documented enum), epoch units, IST-midnight vs UTC-midnight daily, adjustment signalling, `/charts/intraday` necessity. Evidence of *one* boundary only: commit `9d5ffa4` encodes Dhan's documented **exclusive upper bound** for `1D` (+1 day). **PR #645 "W17" is a different series — excluded.** | IPD `9d5ffa4` | **NOT STARTED** | MISSING | IPD | W-06 → enables M3a, W-18, W-19 |
| 24 | **W-18** | Reconcile the 1,825-day cap; chunking/limits | **Code present, qualification outstanding.** `DHAN_MAX_HISTORICAL_WINDOW_DAYS = 365 * 5` with a pre-validated rejection and a boundary test (`dhan_daily_request_boundary.test.ts`). **No pagination/chunking exists.** **Outstanding: establish the vendor's real per-request limit and maximum depth from observation; decide retain/raise/lower; implement bounded chunking only if required; document the effective limit from evidence.** | IPD `9d5ffa4` | **PARTIAL** | MISSING (limit never observed) | IPD | W-17 → enables M3, W-21 |
| 25 | **W-19** | Wire `DhanHistoricalCache`; make D02 freshness real | **No outstanding implementation work — and this corrects the earlier record.** `getHistorical` routes through `DhanHistoricalCache` keyed on the complete request identity (security + segment + interval + range + adjustment); only validated successes are cached; failures never overwrite a retained observation; a retained observation is served without a provider call. `getFreshness({domain:'D02_OHLCV'})` reports from retained IPD evidence only, with `evidenceSource: 'NO_OBSERVATION'` before any observation, the **four-timestamp model** (`marketTimestamp`, `providerResponseTimestamp`, `retrievalTimestamp`, `cacheTimestamp`), `refreshOutcome`, and `calendarMode`. **Never fabricates `SNAPSHOT`, never infers from a candle** — satisfying D-4.3. **Verified by execution: 5/5 (W19-1…W19-5).** Remaining: a *live* D02 observation to replace `NO_OBSERVATION` — that is W-17/M3, not W-19. | IPD #184/#185 (S1-D02 lineage) | **COMPLETE** | VERIFIED (E1/E2) · live observation PENDING | IPD | W-17 for live evidence → enables M4, W-26, W-39 |
| 26 | **W-20** | Implement the D-4 path: authority, provenance labels, no silent fallback | **IPD: no implementation.** Enforcement exists **only in IRR**: `historicalConsumptionBoundary.ts` enforces `EQUICORE_NSE_EOD \| DHAN_D02_OHLCV`, non-fallback/non-blending (D-4.2), canonical 3-tuple identity (D-4.6), `422` scope bounds (PA-DEC-01), fail-closed `HistoricalPriceEvidence` v1 with `responseDigest` + `X-Response-Digest`. **Outstanding IPD obligations recorded in IPD's own D-4 mirror acceptance:** D01/D02 boundary symmetry, D02 series digest, impossible-date guard in `validateDhanHistoricalRequest`. | IRR **#651**, #627, #643; IPD **#191** | **PARTIAL** | PARTIAL — IRR VERIFIED; IPD obligations MISSING | IPD + IRR | D-4 ✔ → enables W-39, W-32, W-33 |
| 27 | **W-21** | History screen: range affordance, truthful gaps, `coverageClaim`/`providerQualification` | **Partially delivered opportunistically.** Landed: D-4.4 unadjusted-price disclosure, strict calendar round-trip validation (impossible dates fail closed), explicit source selector, requested-vs-returned counts. **Outstanding: date picker constrained to the qualified limit (blocked on W-18 — the limit is still unobserved), explained empty ranges/non-trading days, `coverageClaim` rendered verbatim, "stop implying the series is complete".** | IRR #641, #651 | **PARTIAL** | PARTIAL | IRR | W-11 ✔, **W-18** |

### Phase 5 — Freshness and diagnostics completion

| S.No. | Work ID | Work Item Description | Notes — exactly what is outstanding | PR No(s). | Implementation Status | Evidence Status | Owner | Dependency Workstream |
|---|---|---|---|---|---|---|---|---|
| 28 | **W-22** | Session-aware freshness (governed local calendar, deterministic instants) | **No outstanding work.** `IPD-D3-…` records formal owner acceptance and closure at `8f00d7ae63e43e712a75bff2a5854fbdb4d63021`, snapshot `calendars/ipd-equity-2026.v2026-11-19.2.json` (SHA-256 `b7cc69dd…a650ff`), coverage 1–19 Nov 2026 for BSE_EQ and NSE_EQ. Implemented: offline calendar schema/validator, session-aware evaluator (`IIPS_TRADING_CALENDAR_PATH`), accumulated covered open-session seconds (900/1,800 s unchanged), closed-session retention never changes `asOf`, exceptional live dates count once, missing/UNKNOWN dates suppress the calculation, explicit-instant evaluation with no wall-clock default, `calendarMode: LEGACY_ELAPSED_UNQUALIFIED \| SESSION_CALENDAR_CONFIGURED \| NOT_APPLICABLE`. **Verified by execution: 8/8 BSE bounded-calendar tests.** Reported at acceptance: full suite 1,982 passed / 4 skipped (superseded by this investigation's 2,175/2,189). **Note: coverage is bounded to 1–19 Nov 2026 (+PR #193 extending NSE to 11-26, open); other dates remain UNKNOWN by design.** | IPD **#179**; **#193** (open) | **COMPLETE** | VERIFIED | IPD | D-3 ✔ |
| 29 | **W-23** | Persist cache/freshness/observed state; three separate acceptances | **Entirely outstanding.** No persistence store, no load-at-start, no storage port. All three acceptances (restart / cold-cache restart / persistence) unperformed; corrupt-store degradation untested; provider-package import isolation unproven. | — | **NOT STARTED** | MISSING | IPD | W-08 ✔, W-19 ✔ |
| 30 | **W-24** | Trace correlation IRR→IPD→Dhan + bounded log rings | **Design and policy approved; implementation not authorised.** D-7 amendment published (§4.5–§4.10): three opaque lowercase-UUIDv4 identifiers (`actionId`, `workId`, `attemptId`), never derived from payloads; allowlisted event fields; §4.2.1 sole identifier exception on §4.9 surfaces; §4.10 substring clarification; ring capacities 512 IRR / 1,024 IPD. M4 Dhan-leg interpretation **resolved 2026-11-21**: `actionId` must reach IPD and be associated with IPD's local egress-attempt record — not vendor acknowledgement; no header sent to Dhan. **Outstanding: (1) IRR acceptance of the amendment (IPD U-3); (2) implementation — IPD first (daemon, client, provenance, ring), then IRR (correlation + ring); (3) joined synthetic/security regression; (4) Windows acceptance.** IPD states explicitly: "W-24 remains open … implementation is **not authorized**". | IPD **#186**; IRR #565 lineage | **NOT STARTED** | MISSING | IPD + IRR | W-08 ✔, W-09 ✔, D-7 (IRR acceptance pending) → **blocks M4 trace criterion**, W-34 |
| 31 | **W-25** | Configurable freshness thresholds | **No outstanding work.** Resolver `src/quality/freshness_thresholds.ts` (`IIPS_FRESHNESS_THRESHOLD_SECONDS_<DOMAIN>` env + `DhanMarketDataServiceOptions.freshnessThresholds`, per-domain validation `INVALID_NUMBER`/`OUT_OF_RANGE`, bounds 1…604 800 intraday / 1…31 536 000 calendar, option > environment > default); `evaluateFreshness` resolves the threshold **once** per call (the three-way split at L61/L72/L106 and the unreachable `\|\| 3600` are gone) and remains the owner of AD-12 arithmetic; `ServiceDiagnostics.freshness` publishes the complete effective map plus override dispositions, validated fail-closed by `validateDhanDiagnosticsFreshness`; diagnostics `contractVersion` **1 → 2**; `D02_NOMINAL_THRESHOLD_SECONDS` retained unchanged as the compiled reference and no longer forced over the effective value. `DEFAULT_FRESHNESS_CONFIG` unchanged, proven value-by-value. **37/37** new tests; full suite **2 263 / 2 249 / 0 fail / 14 skipped**; package consumer PASS; `build:tsc` exit 0. | — | **COMPLETE** | VERIFIED | IPD | None (independent) |
| 32 | **W-26** | Add `getFreshness` to `MarketDataTransportClient`; delete IRR's duplicate guards | **Entirely outstanding.** The server exposes `GET /v1/freshness` (lines 398/409 of `dhan_market_data_http.ts`), but `MarketDataTransportClient` exposes only `getQuote`, `getHistorical`, `health`, `diagnostics`, `verifyConnection` — **no `getFreshness`**. IRR therefore still hand-rolls the loopback/token/timeout guard. | — | **NOT STARTED** | MISSING | IPD + IRR | W-19 ✔ |

### Phase 6 — Track 2 foundation

| S.No. | Work ID | Work Item Description | Notes — exactly what is outstanding | PR No(s). | Implementation Status | Evidence Status | Owner | Dependency Workstream |
|---|---|---|---|---|---|---|---|---|
| 33 | **W-27** | Repeatable mapping expansion pipeline (no live evidence) | **No outstanding work.** `dhan_mapping_expansion.ts` + `scripts/dhan-w27-expand.mjs` (`npm run dhan:w27-expand -- --check`); produces `evidence/dhan-p7/qualification-manifest.json` (**4,680 QUALIFIED** over 2,390 companies, SHA-256 `69a918f7…4769`, 4,726,767 bytes) plus `qualification-report.md`, `source-retrieval-manifest.json`, `retrieval-log.json`, `source-reconciliation-report.md`. **Byte-reproducibility is proven, closing the earlier parity gap:** "`npm run dhan:w27-expand -- --check` → *committed artifacts are byte-identical to a fresh run* (exit 0). Manifest SHA-256 `3c228b3c…b7285` both runs; also asserted in-test by re-building twice." Exact-identity only; proposed ≠ qualified; near-miss rejection tested (`dhan_p7_instrument_master.test.ts`). | IPD **#164**, **#189** | **COMPLETE** | VERIFIED | IPD | None → enables W-28, W-14 (new rows), W-30, W-33 |
| 34 | **W-28** | Measure coverage against the owner's real holdings, by exact identity | **Infrastructure complete; final number outstanding.** IRR `frontend/server/w28/coverageMeasurement.ts`, `registrySnapshot.ts`, `measureCoverageCli.ts` (`npm run w28:measure`), 21/21 synthetic tests covering all 11 required conditions; strict exact ISIN+exchange+series; proposed ≠ qualified; ambiguous stays unresolved; no name/symbol/fuzzy matching; privacy helpers (`maskIsin`, `sanitizeForPublication`). **Outstanding:** run on the authorised Windows host requiring `IIPS_G2_IPC_ENDPOINT` + `IIPS_G3_IPC_BINDING_PROVISIONED` (absent in this sandbox), and replace the blocker-form `evidence/w28-coverage-summary.json`. Note: 19,060 no-P04 rows are not individually retained, so misses degrade to `NO_QUALIFIED_MAPPING_EVIDENCE_LIMITED`. | IRR docs; manifest from IPD #164 | **IMPLEMENTED** | PARTIAL — `DHAN-W28-MEASUREMENT-2026-11-23.md` | IRR (measure) + IPD (registry) | W-27 ✔ → gates W-30, W-33 |
| 35 | **W-29** | Shared IRR quote-consumption boundary | **No outstanding build work.** `quoteConsumptionBoundary.ts` + 40 synthetic tests; closed outcome set `CURRENT·STALE·UNAVAILABLE·UNMAPPED·MALFORMED_IDENTITY`; bounded pool 4 (max 8); rate-limit stop with `notAttempted`; per-identity freshness join that can only worsen a verdict and never emits `LIVE`; quote route migrated; bundle gate extended with 10 prohibited symbols. **Outstanding: live acceptance, gated on M2.** | IRR (record `DHAN-W29-…-2026-11-23.md`) | **IMPLEMENTED** | VERIFIED (E2) · live PENDING | IRR | W-11 ✔, W-13 ✔ → enables W-30…W-35 |
| 36 | **W-39** | Historical-data consumption extension (labelled, authoritative, no blending) | **Boundary delivered ahead of schedule; acceptance outstanding.** `historicalConsumptionBoundary.ts` with explicit source selection; `historicalEvidence.ts` durable `HistoricalPriceEvidence` v1; fail-closed `artifact.ts` validation; `compareW15HistoricalEvidence` (`W16`) in `provenanceEnvelope.ts`; offline `NP-04` SQLite + route tests. **Outstanding: live D02 freshness requires a real historical observation (W-17); live acceptance at M3.** | IRR **#651** (§16.346) | **PARTIAL** | VERIFIED (E2) · live PENDING | IRR | W-29 ✔, W-19 ✔, W-20 (partial) → enables W-32, W-33 |

### Phase 7 — Consumer integrations (all IRR)

| S.No. | Work ID | Work Item Description | Notes — exactly what is outstanding | PR No(s). | Implementation Status | Evidence Status | Owner | Dependency Workstream |
|---|---|---|---|---|---|---|---|---|
| 37 | **W-30** | Personal Portfolio live valuation | **Entirely outstanding; still the most misleading consumer.** `averageBuyPrice`/`currentPrice` remain operator-entered stored fields driving "Total value" with no provenance. Adjacent enabling work exists (a portfolio-mode indicator distinguishing ACTUAL/REFERENCE/DEGRADED, PR #645) but no market-data consumption. Needs W-29 ✔, W-27 ✔, W-28 ✘. | — | **NOT STARTED** | MISSING | IRR | W-29 ✔, W-27 ✔, W-28 ✘ |
| 38 | **W-31** | Watchlists prices + freshness badges | **Entirely outstanding.** (PR #641's "W-31 batch watchlist fallback" is the *other* W-series — excluded.) | — | **NOT STARTED** | MISSING | IRR | W-29 ✔ |
| 39 | **W-32** | Company Intelligence price context | **Entirely outstanding.** | — | **NOT STARTED** | MISSING | IRR | W-29 ✔, W-39 (partial) |
| 40 | **W-33** | Valuation (IID) on canonical prices | **Adjacent work only.** `margin.ts` corporate-action/data-sufficiency refusal (`UNADJUSTED_PRICE_ACROSS_CORPORATE_ACTION`) retained; D-4.4 disclosure enforced. **Outstanding: canonical quote with explicit `asOf`; provenance recording; stale/unresolved blocking of the verdict; removal of fixture prices (`price: obs(2450)`, `priceAsOf: '2026-11-05'`).** | IRR D-4.4 lineage (§16.333) | **PARTIAL** | PARTIAL | IRR | W-29 ✔, W-39, W-28 ✘ |
| 41 | **W-34** | Reports/decision-support as-of + freshness gating | **Entirely outstanding.** Requires the W-24 trace id, which is not authorised. | — | **NOT STARTED** | MISSING | IRR | W-29 ✔, W-24 ✘ |
| 42 | **W-35** | Broker Holdings live alignment | **Entirely outstanding.** Preview correctly publishes no market value/weight; committed-holdings treatment outstanding. | — | **NOT STARTED** | MISSING | IRR | W-30 ✘ |

### Phase 8 — Windows operational readiness

| S.No. | Work ID | Work Item Description | Notes — exactly what is outstanding | PR No(s). | Implementation Status | Evidence Status | Owner | Dependency Workstream |
|---|---|---|---|---|---|---|---|---|
| 43 | **W-36** | Extend the existing IIPS launcher for the daemon | **Largely implemented — corrects the earlier "not started" position.** `03-Start-IipsServers.ps1` now carries `-StartMarketDataDaemon`, `$MarketDataPort = 8791`, `Assert-IipsPortFree` ownership guard, `Start-IipsService -Label 'ipd-market-data-daemon'` with `dist\src\providers\dhan\dhan_local_daemon.js`, manifest row (`ipd-market-data-daemon`), and an explicit skip message; `06-Stop-IipsServers.ps1` port array includes `8791` and `dhan_local_daemon.js` in its entrypoint list; `07-Prepare-DepthCapture.ps1` verifies daemon ownership and refuses to arm against an unmanaged daemon. **Outstanding: `04-Validate-BackendEndpoints.ps1` health checks; the complete E3 start → verify → stop → restart transcript covering all five services; the second-launch refusal evidence; the not-configured / not-running / unauthenticated / ready discrimination.** | IPD #187, #192 | **PARTIAL** | MISSING (E3 transcript) | IPD | W-03 ✔, W-11 ✔, D-7 ✔ |
| 44 | **W-37** | Operator runbook: live operation and recovery | **Partial.** `docs/OPERATOR_RUNBOOK.md` (IRR, 109,898 bytes) has W-11 §3.3a; IPD publishes `DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md`. **Outstanding: credential provisioning/rotation incl. interrupted-rotation recovery; launcher-integrated start/stop/verify; the symptom→cause table for `CREDENTIALS_UNAVAILABLE`, `CREDENTIALS_EXPIRED`, `AUTHENTICATION_FAILURE` + latched state, `RATE_LIMITED`, `UNRESOLVED_INSTRUMENT`, `TRANSPORT_FAILURE`, `TRANSPORT_NOT_CONFIGURED`, empty historical; the 24-hour token routine stating that expiry is recoverable only by re-provisioning.** | IPD #173 | **PARTIAL** | PARTIAL | IRR + IPD | W-09 ✔, W-11 ✔, W-36 (partial) |
| 45 | **W-38** | Startup readiness preflight | **Entirely outstanding.** No single "is this installation ready?" command; no five-broken-configuration discrimination test. | — | **NOT STARTED** | MISSING | IRR | W-09 ✔, W-11 ✔ |

### 3.1 Roll-up

| Classification | Units | Which |
|---|---|---|
| **COMPLETE** | **23** | D-1, D-2, D-3, D-4, D-5*, D-6, D-7*, W-01, W-02, W-03, W-04, **W-05**, W-07, W-08, W-09, W-10, W-13, W-15, W-19, W-22, **W-25**, W-27, W-29** |
| **IMPLEMENTED** (code in place; not formally accepted) | **3** | W-06, W-28, W-29 (E2-only) |
| **PARTIAL** | **8** | W-11, W-12, W-18, W-20, W-21, W-36, W-37, W-39, W-33 |
| **NOT STARTED** | **11** | W-14, W-17, W-23, W-24, W-26, W-30, W-31, W-32, W-34, W-35, W-38 |
| **BLOCKED** | **1** | W-30/W-33 chain blocked on W-28's host measurement — tracked under blockers |
| **DEFERRED** | **0** | Nothing was formally deferred; automated token acquisition is out of scope by D-6, not deferred |

\* D-5's depth defect was **closed on 2026-11-25** by Addendum A (§7 of the D-5 record); D-7 carries the pending IRR acceptance of its amendment, which does not reverse the decision itself.
\** W-29 is counted COMPLETE for its build scope with live acceptance pending at M2.

**Movement since the 2026-11-11 roadmap:** from 0 complete work items to **23 of 38 complete** (W-05 and W-25 closed 2026-11-25), plus 3 implemented. **M1 is substantively met.** Milestones M2a, M2, M3a, M3, M4, M5, M6 remain **unachieved** — M2a's evidence exists but is not accepted as an M2a record.

---

## 4. Work items that can proceed immediately

| S.No. | Work ID | Work Item | Repository / Owner | Readiness | Evidence Supporting Readiness | Work That Can Start Now | Dependencies |
|---|---|---|---|---|---|---|---|
| 1 | **W-05** | Read posture + bounded re-read/latch | IPD | **READY** | D-2 accepted; W-02 backend complete and green; the required assertions are fully specified (one re-read on 401/403, zero on success, second 401 latches, expired pre-flight issues no vendor call, latency assertion) | Session holder; four-trigger re-read; `authLatched`; latency proof | D-2 ✔, W-02 ✔ |
| 2 | **W-26** | `getFreshness` on the transport client | IPD + IRR | **READY** | `GET /v1/freshness` fully served (lines 398/409); the client's other methods establish the exact guard pattern to copy; W-19 evidence is now real so parity is testable | Add client method; parity test; delete IRR's duplicated guard | W-19 ✔ |
| 3 | **W-25** | Configurable thresholds | IPD | **COMPLETE** | Closed 2026-11-25 — [`DHAN-W25-CONFIGURABLE-FRESHNESS-THRESHOLDS-2026-11-25.md`](DHAN-W25-CONFIGURABLE-FRESHNESS-THRESHOLDS-2026-11-25.md). Independently executable as the worksheet stated; the lane ordering was scheduling, not a data dependency (reconciliation in §5 of that record) | Override source, validation, effective-value exposure — **all delivered** | None |
| 4 | **W-23** | Persistence (3 acceptances) | IPD | **READY** | W-08 ✔ and W-19 ✔ (both prerequisites now met); the three acceptances are separately specified | Storage port + restart / cold-cache / persistence acceptances + corrupt-store degradation | W-08 ✔, W-19 ✔ |
| 5 | **W-24** | Trace correlation + rings | IPD → IRR | **READY** *(one governance step first)* | D-7 amendment **published** with three-ID model, event field set, §4.2.1 exception, §4.10 substring clarification, ring capacities, and the resolved M4 interpretation | IPD daemon/client/provenance/ring, then IRR correlation + ring, then joined regression | W-08 ✔, W-09 ✔, D-7 amendment (IRR acceptance) |
| 6 | **W-36** | Launcher completion | IPD | **READY** | `-StartMarketDataDaemon`, 8791 guard, manifest row and `06-Stop` handling **already merged**; only `04-Validate` and the E3 transcript remain | Add `04-Validate-BackendEndpoints.ps1` health checks; produce E3 transcript | W-03 ✔, W-11 ✔ |
| 7 | **W-38** | Startup readiness preflight | IRR | **READY** | W-09 ✔ + W-11 ✔ (both prerequisites met); daemon now launcher-startable | Preflight command + five-broken-config discrimination test | W-09 ✔, W-11 ✔ |
| 8 | **W-37** | Operator runbook completion | IRR + IPD | **READY** | IPD ops doc published (PR #173); runbook exists | Symptom→cause table, rotation recovery, 24-hour token routine | W-09 ✔, W-11 ✔, W-36 (partial) |
| 9 | **W-28** | Final coverage number | IRR | **READY, host-gated** | `w28:measure` complete, 21/21 synthetic | Run on the authorised Windows host; replace the placeholder summary | W-27 ✔, host authorisation |
| 10 | **W-30 / W-31** | Portfolio & watchlist consumers | IRR | **READY (fixtures)** | W-29 is the sole market-data caller with a closed outcome set and per-identity freshness | Build both against synthetic fixtures | W-29 ✔; live acceptance needs M2 |
| 11 | **D-5 follow-up** | Resolve the zero-depth contradiction | IPD / PA | **✅ CLOSED — 2026-11-25** | Decided by the Programme Authority: an entirely zero-filled book is an **absent market book**, never malformed. Recorded as **Addendum A** to D-5 (§7); implemented in `dhan_normalizer.ts`; regression anchored to the retained D-18 raw capture | *(satisfied)* | D-5 ✔ |
| 12 | **D-7 follow-up** | IRR acceptance of the W-24 amendment | IRR / PA | **READY** | Amendment published; IPD U-3 records it as awaiting IRR | IRR acceptance record | D-7 ✔ |
| 13 | **W-14** | Live mapping qualification | IPD | **READY — authorisation + sample only** | Readiness assessment complete; B-W14-1 satisfied; no code change needed | Choose scope; re-derive the 97-request sample; execute E4 | W-06, W-27 ✔, owner authorisation ✘ |
| 14 | **W-17** | Historical wire qualification | IPD | **READY — authorisation only** | W-06 substantively met; egress opens; request builder verified | Five-interval live capture; epoch/midnight determination; `/charts/intraday` necessity test | W-06, owner authorisation ✘ |

**Genuinely executable today with zero external decisions: rows 1–8 and 11–12 (10 items).** Rows 9–10 are executable but host-gated. Rows 13–14 are **technically** executable and **governance**-blocked — they must not be reported as proceeding.

---

## 5. Blockers and blocker-removal priorities

| S.No. | Blocker ID / Description | Resolving Work ID | Repo / Owner | Affected Work Items | Resolution Required | Completion Evidence | Work Items Unlocked |
|---|---|---|---|---|---|---|---|
| 1 | **BLK-1 · ZERO-FILLED DEPTH IS FATAL** — the vendor returns a populated 5×5 book of zeros after close (D-18, verified); D-5 makes any supplied zero **invalid**; `topOfBook()` therefore returns `MALFORMED_RESPONSE` for a normal post-close quote. *Technical, with a decision component.* | **D-5 follow-up** → W-13 | IPD / PA | W-13, **M2**, W-21, W-22 benefit, W-30 | ~~Decide whether a wholly-zero book is *absent* (→ `null`) or *invalid*, then adjust `topOfBook()`/validator and add a zero-book fixture~~ **RESOLVED 2026-11-25** — decided **absent**; D-5 Addendum A, `dhan_normalizer.ts`, D5-A0…D5-A10 | ~~Decision record + regression test~~ **MET**: Addendum A (§7) + regression anchored to the retained D-18 raw capture; full suite 2,200 tests green | **M2**, W-30, W-21 |
| 2 | **BLK-2 · E4 EXECUTION AUTHORISATION + INVALID SAMPLE** — no bounded live window is authorised, **and** the 96-instrument sample is the superseded pre-2026-11-15 revision with 6/96 unresolvable. *Governance + evidence.* | **W-14**, **W-17** | IPD / Program Authority | W-14, W-17, W-12-hist, W-18, M2a, M2, M3a, M3 | Owner picks one of three scopes; re-derive the sample; issue a bounded authorisation (budget ≈97 requests, named baseline, reviewer) | Authorisation record + redacted per-row E4 evidence + zero-secret/location grep | **W-14 → M2 → M5 → M6**; **W-17 → M3a → M3 → M4**; W-18, W-21 |
| 3 | **BLK-3 · W-06 ACCEPTANCE RECORD MISSING** — `617fab0` exists at no IPD ref; IPD states W-06 is IN PROGRESS / NOT ACCEPTED while IRR asserts COMPLETE; no published zero-secret/zero-location grep. *Governance + evidence.* | **W-06** | IPD / Operator / PA | W-06, W-12, W-14, W-17, M1 formal, M2 | Publish the attestation on IPD `main` **or** withdraw the claim; publish the grep; reconcile the two repos' status | Record present on IPD `main` at a named SHA; both repos agree | Formal M1; W-12/W-14/W-17 acceptance |
| 4 | **BLK-4 · NO LIVE HISTORICAL CAPABILITY** — zero `/charts/historical` calls ever; string `securityId`; `instrument` hardcoded; all intervals on one endpoint (`/charts/intraday` never called, gap `G-12`); no observed limit. *Technical.* | **W-17** → **W-12-hist** → **W-18** | IPD | W-17, W-12, W-18, W-19-live, W-21, W-26, W-39, **M3**, **M4** | Live determination per interval; correct routing; establish the limit from observation | Per-interval observed shapes + corrected routing + documented effective limit | M3, M4, W-21, W-39 live |
| 5 | **BLK-5 · W-05 ABSENT** — no bounded re-read/latch; each quote would pay a vault read. *Technical.* | **W-05** | IPD | W-05, **M4** | ~~Session holder + latch~~ **RESOLVED 2026-11-25** | ~~One re-read on 401/403, zero on success, latch proven, latency assertion~~ **MET** — W05-01…W05-25 | M4 |
| 6 | **BLK-6 · W-24 NOT AUTHORISED** — D-7 amendment awaiting IRR acceptance (IPD U-3); implementation explicitly not authorised. *Governance.* | **D-7 follow-up** → **W-24** | IRR/PA then IPD+IRR | W-24, W-34, **M4 trace criterion** | IRR acceptance; then IPD-first implementation | IRR acceptance record; then one `actionId` visible across IRR log, IPD ring and D01 provenance | W-34, M4 |
| 7 | **BLK-7 · WINDOWS HOLDINGS CAPTURE UNAVAILABLE** — no `IIPS_G2_IPC_ENDPOINT` / `IIPS_G3_IPC_BINDING_PROVISIONED` outside the owner host. *Environment.* | **W-28** | IRR / Operator | W-28, W-30, W-33, **M5** | Run `w28:measure` on the authorised host | Measured coverage % + prioritised gap list; masked ISINs only | W-30, W-33, M5 |
| 8 | **BLK-8 · IPD/IRR PIN DRIFT** — IRR pinned `26855625`; IPD `main` is `85ac127`; `9d5ffa4` changed the `1D` `toDate` to the exclusive bound. *Technical / governance.* | **W-12-hist** + pin governance | IPD + IRR | W-12, W-17, W-18, W-21, W-39 | Decide the authoritative daily boundary; re-pin with `.ci/verify-ipd-pins.mjs` green | Pin-bump PR + per-interval historical regression fixture | W-17 acceptance, W-18, M3 |
| 9 | **BLK-9 · WORK-ITEM ID COLLISION ACROSS TWO W-SERIES** — IRR #645 "W17", #609 "W-19", IPD roadmap `W06` are all *different* series; roadmap status cannot be derived from titles. *Governance / traceability.* | Tracker governance | IRR + IPD | **All 38 W items** (status integrity) | Prefix roadmap IDs (`DHAN-W-xx`) or namespace the series; correct back-references | Tracker convention note + corrected references | Prevents false closure of W-17/W-19/W-06 |
| 10 | **BLK-10 · W-11 FOUR-CAPABILITY DRY-RUN UNPERFORMED** — the exit criterion has never been exercised end to end. *Evidence.* | **W-11** | IRR + IPD | W-11, W-21, W-37, M4 | Connected-daemon dry-run of Status/Quotes/History/Freshness | Dry-run transcript with all four capabilities | W-11 closure, M4 |
| 11 | **BLK-11 · CALENDAR COVERAGE BOUNDED TO 1–19 NOV 2026** — outside that window freshness fails closed as `MISSING_COVERAGE`; PR #193 extends NSE only to 2026-11-26 and is **open**. *Technical / data.* | **W-22 follow-on** (PR #193) | IPD | W-22 operational value, W-37, live acceptance | Merge/extend calendar coverage for the dates actually used | Published snapshot covering the live-test dates | Live E4 usability, W-37 |
| 12 | **BLK-12 · W-36 E3 TRANSCRIPT ABSENT** — launcher code merged but never evidenced as a full five-service cycle. *Evidence.* | **W-36** | IPD | W-36, W-37, W-38 | E3 start → verify → stop → restart run | Transcript + second-launch refusal + four-state discrimination | W-36, W-37, W-38 |

### Highest-impact blockers

1. **BLK-1 (zero-depth fatality) — highest.** It is the only blocker that is a genuine *product defect* rather than missing evidence, it was **not previously identified anywhere in either repository's records**, it was introduced *by* the D-5 fix, and it breaks M2 in ordinary daily operation (any post-close quote). It also silently undermines the value of W-22: the session-aware freshness work exists to make out-of-session data usable, and the depth rule makes those same quotes fail. Costs one decision and one small change.
2. **BLK-2 (E4 authorisation + invalid sample) — second.** Gates 7 work items and every live milestone. Note the sample must be **re-derived before the window is granted**, or the run will produce 6 bookkeeping `UNRESOLVED_INSTRUMENT` failures that are not vendor findings.
3. **BLK-3 (W-06 record missing) — third, and the most corrosive.** The programme's controlling roadmap asserts a milestone on an artefact that does not exist. Every downstream "COMPLETE" inherits the doubt. It is cheap to fix and expensive to leave.
4. **BLK-8 (pin drift)** — the most dangerous *silent* blocker: IRR's history screen runs against a build whose daily boundary differs from IPD `main`.

---

## 6. Recommended dependency-driven execution sequence

| Seq | Work ID | Work Item | Readiness | Why This Sequence | Blocker Removed / Work Unlocked | Prerequisite | Repo / Owner |
|---|---|---|---|---|---|---|---|
| **1** | **D-5 follow-up** | Resolve the zero-depth contradiction | NOW | Only *defect* blocker; one decision; unblocks M2 in normal operation | **BLK-1** → M2, W-21, W-30 | D-5 ✔ (verified) | IPD / PA |
| **2** | **D-7 follow-up** | IRR acceptance of the W-24 amendment | NOW | Pure governance; unblocks all W-24 work | BLK-6 (part) → W-24 | D-7 ✔ | IRR / PA |
| **3** | **W-05** | Read posture + bounded re-read | NOW | M4 conjunct; zero external dependencies | BLK-5 → M4 | D-2 ✔, W-02 ✔ | IPD |
| **4** | **W-26** | `getFreshness` on the client | NOW | Now testable because W-19 evidence is real | Divergence risk ↓ | W-19 ✔ | IPD + IRR |
| **5** | **W-25** | Configurable thresholds | **DONE** | Closed 2026-11-25; independent, as recorded | Divergence removed (single threshold resolution) | Effective values observable | IPD |
| **6** | **W-23** | Persistence (3 acceptances) | NOW | Both prerequisites met | Operational recovery | W-08 ✔, W-19 ✔ | IPD |
| **7** | **W-24 impl (IPD first)** | Daemon/client/provenance/ring | after 2 | Owner-approved IPD-first sequencing | M4 trace | D-7 amendment | IPD |
| **8** | **W-24 impl (IRR second)** | IRR correlation + ring | after 7 | Consumes the published IPD artefact | → W-34 | W-24 IPD | IRR |
| **9** | **W-36** | Launcher E3 + `04-Validate` | NOW | Code already merged; only evidence and one script remain | BLK-12 → W-37, W-38 | W-03 ✔, W-11 ✔ | IPD |
| **10** | **W-38** | Startup readiness preflight | after 9 | Needs a launcher-startable daemon | Diagnosability | W-09 ✔, W-11 ✔ | IRR |
| **11** | **W-37** | Operator runbook | after 9, 10 | Consumes W-04/W-36/W-09 | Operability closure | W-36 | IRR + IPD |
| **12** | **W-28** | Coverage number | after host auth | Independent of live; M5 conjunct | **BLK-7** → M5, W-30 | W-27 ✔ | IRR |
| **13** | **W-11 close** | Four-capability dry-run | after 4, 9, 11 | Now provable with a connected daemon | **BLK-10** → W-11 exit | W-19 ✔, W-36 ✔ | IRR + IPD |
| **14** | **W-06 fix** | Publish or withdraw the attestation; publish the grep | NOW (parallel) | Cleans the root of the programme's status claim | **BLK-3** → formal M1 | — | IPD / Operator |
| **15** | ⛔ **BLK-2 gate** | Owner authorises the E4 window **after** the sample is re-derived | **DECISION GATE** | Nothing live proceeds | Unlocks 16, 17, 18 | — | Program Authority |
| **16** | **W-14** | Live mapping qualification | after 15 | First E4 use; gates M2 and therefore M5/M6 | M2 prerequisite; stale-ID signature | W-06, W-27 ✔ | IPD |
| **17** | **W-17** | Historical wire qualification | after 15, **serialised after 16** | Independent of W-14 but shares the scarce E4 budget | **BLK-4** → M3a | W-06 | IPD |
| **18** | **W-12 close** | Historical builder + E4 schema | after 17 | Quote leg already done | BLK-8 (part) | W-17 | IPD |
| **19** | **W-18** | Limit/chunking reconciliation | after 18 | Needs observed depth | **M3** | W-17 ✔ | IPD |
| **20** | **M2 declare** | Qualified live quote | after 16 | Cross-checked values, identity, timestamps | **M2** → W-30 live, M5 | W-13 ✔, W-14 ✔, BLK-1 ✔ | IPD |
| **21** | **W-21** | History screen affordances | after 19 | Limit now known | M4 | W-18 ✔, W-11 ✔ | IRR |
| **22** | **M4** | Four capabilities operational | after 3,7,8,13,20,21,6 | Conjunctive gate | — | all M4 conjuncts | Both |
| **23** | **M5** | Track 2 foundation | after 12, 20 | Measured coverage + one boundary | — | M2 ∧ W-27 ∧ W-28 ∧ W-29 | Both |
| **24** | **W-30 / W-31** | Portfolio, Watchlists | after 23 (fixtures earlier) | Highest product value; W-30 actively misleading today | — | W-29 ✔, W-27 ✔, W-28 ✔ | IRR |
| **25** | **W-39 close** | Historical consumption | after 17, 19 | Live D02 freshness now real | — | W-29 ✔, W-19 ✔, W-20 | IRR |
| **26** | **W-32 / W-33** | Company Intelligence, Valuation | after 24, 25 | Both boundaries needed | — | W-29, W-39, W-28 | IRR |
| **27** | **M6** | Consumers adopted | after 24–26 | Per-consumer acceptance notes | — | M5, W-39 | IRR |
| **28** | **W-34 / W-35** | Reports, Broker Holdings | last | Lowest priority; W-35 after W-30 | — | W-29+W-24 / W-30 | IRR |

**Critical dependency chain:** `D-5 follow-up → M2` ∥ `D-7 → W-24 → M4 trace` ∥ `W-05 → M4` ∥ `[BLK-2 gate] → W-14 → M2 → M5 → W-30 → M6` ∥ `[BLK-2 gate] → W-17 → W-12 → W-18 → M3 → M4`.

**Multi-unlock items (prioritise):** **D-5 follow-up** (→ M2, W-21, W-30), **BLK-2 authorisation** (→ W-14, W-17, W-12, W-18, M2a, M2, M3a, M3, M5, M6), **W-24** (→ W-34, M4), **W-36** (→ W-37, W-38, W-11), **W-28** (→ W-30, W-33, M5).

**Two hard sequencing constraints:** (i) **W-14 and W-17 must not overlap** in the same E4 window — both draw on the live request budget and concurrent bursts risk `RATE_LIMITED`, corrupting each other's evidence; (ii) W-13 and the D-5 follow-up both edit `dhan_normalizer.ts`, so the decision must precede the edit.

---

## 7. Parallel execution opportunities

| Lane | Items | Repo | Contention |
|---|---|---|---|
| **A — IPD freshness/completion** | W-25 ✔ → W-26 → W-23 | IPD | W-23 touches the provider package boundary — keep clear of W-24's daemon change. **W-25 shipped first (2026-11-25)**: it moves the diagnostics contract to version 2, so doing it ahead of W-26/W-23 keeps the version bump out of their re-baselines |
| **B — IPD credentials/perf** | W-05 | IPD | Isolated |
| **C — IPD observability** | W-24 IPD half → (IRR half) | IPD → IRR | Coordinates with lane A on `dhan_market_data_service.ts` |
| **D — IPD ops** | W-36 → (W-38, W-37 in IRR) | IPD → IRR | Isolated from A/B/C |
| **E — Governance** | D-5 follow-up, D-7 follow-up, W-06 fix | Both / PA | Pure documentation |
| **F — IRR consumers** | W-30, W-31 against fixtures | IRR | Both consume W-29; safe in parallel |
| **G — IRR evidence** | W-28 (Windows host), W-11 dry-run | IRR | W-11 depends on lane D |
| **H — Live (blocked)** | W-14, then W-17 | IPD | **Serialise strictly** |

---

## 8. Overall execution assessment

### 8.1 Current overall position

| Metric | Count |
|---|---|
| Total tracked units (7 decisions + 38 work items) | **45** |
| **COMPLETE** | **21** |
| IMPLEMENTED (unaccepted) | **3** |
| PARTIAL | **9** |
| NOT STARTED | **13** |
| BLOCKED | **1** (W-30/W-33 on W-28) |
| DEFERRED | **0** |
| Evidence at the class the roadmap demands | **24 of 45** |
| Awaiting formal acceptance | **12** |
| Milestones achieved | **M1 substantively** (record missing — BLK-3). M2a evidence exists but is unaccepted. M2, M3a, M3, M4, M5, M6 **not achieved** |

**The decisive correction to the programme's self-image.** The roadmap's 2026-11-11 framing — "architecturally complete and operationally blocked", with credentials *necessary but not sufficient* — is now **obsolete in every clause**. Credentials are resolved, the store works, the daemon opens live egress, and a real authenticated vendor interaction has occurred. The current position is:

> **Operationally live-capable; substantially complete; blocked by one small defect, one authorisation decision, one invalid sample, one missing attestation, and a large but tractable evidence-and-acceptance debt.**

The work that remains is no longer architectural. Of 13 unstarted items, 9 are evidence/acceptance or independent low-risk work; only **W-17/W-18** (live historical) is genuinely substantial engineering.

### 8.2 Immediate execution opportunities
Ten items with zero external decisions: D-5 follow-up, D-7 follow-up, W-05 ✔, W-26, W-25 ✔, W-23, W-36, W-38, W-37, W-06 fix — plus W-28 and W-30/W-31 in host/fixture mode.

### 8.3 Highest-priority blocker
**BLK-1 — the zero-depth fatality.** It is a live product defect, newly discovered, invisible to all 503 passing Dhan tests, and it breaks M2 in everyday post-close operation.

### 8.4 Critical dependency chain
`D-5 follow-up → M2` is the shortest path to a *correct* live quote. `D-7 → W-24` and `W-05` are M4-only chains. `[authorisation] → W-14 → M2 → M5 → W-30 → M6` is the product-value chain. `[authorisation] → W-17 → W-12 → W-18 → M3 → M4` is the history chain. **M4 remains the true bottleneck**, being the conjunction of all of them.

### 8.5 Parallel execution
Eight lanes (§7), two mutation hot-spots (`dhan_market_data_service.ts`, `dhan_normalizer.ts`), one scarce shared resource (the E4 request budget).

### 8.6 Recommended next work item

> ### **D-5 follow-up · Decide whether a wholly-zero depth book is "absent" or "invalid", then make `topOfBook()` report `null`**
> **Repository:** IPD · **Owner:** IPD implementer; decision by the Program Authority

**Why first.** It is the only *defect-class* blocker on the board; it is newly discovered (§2.4) and therefore unowned; it costs one decision plus a small, localised change in `dhan_normalizer.ts`; and it unblocks **M2**, which gates M5 and all six consumers. It also restores the intended value of the just-completed W-22 work. Every other executable item can run in parallel, but none of them repairs a live correctness failure.

**Expected completion evidence:** (1) a D-5 addendum stating the rule for a populated-but-all-zero book; (2) `topOfBook()` returns `absent` for a wholly-zero side, so the quote yields `bid: null` / `ask: null` rather than `MALFORMED_RESPONSE`; (3) a malformed *single* level (e.g. `NaN`, negative, non-numeric) still fails closed; (4) a regression fixture built from the retained `evidence/dhan-d18/reliance-depth-20261123.json` shape; (5) full suite green with the test count rising from 2,189; (6) `providerQualification` unchanged.

**Caveat I will not fudge:** **W-14** remains the higher-priority item *on the roadmap*. It is not recommended *next* only because it cannot proceed — the sample is invalid and the window is unauthorised. Once BLK-2 is resolved, W-14 should run immediately and exclusively.

### 8.7 Completion pathway
1. **Now (8 lanes):** D-5 follow-up ✔ · D-7 follow-up · W-06 fix · W-05 ✔ · W-25 ✔ · W-26 · W-23 · W-36 → W-38 → W-37 · W-28 · W-30/W-31 fixtures.
2. **Then:** W-24 (IPD→IRR) · W-11 four-capability dry-run.
3. **Governance gate:** re-derive the 97-request sample, then authorise the bounded E4 window.
4. **Live:** W-14 → M2; then W-17 → W-12 → W-18 → M3.
5. **Integration:** W-21 · M4 · M5.
6. **Adoption:** W-39 → W-32/W-33 → M6 → W-34/W-35.
7. **Final reconciliation:** re-baseline the roadmap to **v1.2** with (a) 21 items marked complete, (b) the W-06 position corrected, (c) the `DHAN-W-xx` ID prefix (BLK-9), (d) W-19/W-22/W-27/W-36 removed from the open set, (e) D-3/D-5 accepted, (f) D-5's zero-depth rule, and (g) the pin-drift resolution.

---

## 9. Traceability register

| Determination | Repository | Branch / ref | File · PR · commit | Evidence |
|---|---|---|---|---|
| D-3 accepted; W-22 closed | IPD | `main` | `docs/integration/IPD-D3-MARKET-CLOSED-FRESHNESS-DECISION-BLOCKER-2026-11-19.md`; PR **#179** @ `8f00d7ae63e43e712a75bff2a5854fbdb4d63021` | + `w22_bse_bounded_calendar.test.js` **8/8** |
| D-5 accepted | IPD | `main` | `D-5-BID-ASK-REPRESENTATION-AND-VALIDATION-DECISION-2026-11-21.md`; PR **#183** | source `topOfBook()`, `d01_quotes.ts` |
| D-7 amended (W-24) | IPD | `main` | `DHAN-D7-PROVIDER-STATE-MODEL-AND-DIAGNOSTICS-POLICY-2026-11-12.md` §4.5–§4.10; PR **#186** | U-3 (IRR acceptance pending), U-4 (M4 resolved 2026-11-21) |
| D-4 both-repo acceptance | IPD + IRR | `main` | IPD `D-4-D02-D114-PIT-MIRROR-ACCEPTANCE-2026-11-23.md`, PR **#191**; IRR `DHAN-D4-OWNER-ACCEPTANCE-2026-11-23.md`, PR **#627** @ `8f893112` | — |
| W-01…W-04 complete | IPD | `main` | `dhan_dpapi_vault_backend.ts`, `_carrier`, `_acl`, `_process`, `dhan_credential_store_utility.ts`; PRs #156→#174→#188 | `dhan_w01…`, `dhan_w02…`, `dhan_w03…`, `dhan_w04…` tests passing |
| W-06 record missing | IPD | **all 186 heads** | `git cat-file -e 617fab0…` → absent; `git log --all -- '*W06-FINAL-OWNER-ATTESTATION*'` → empty | IPD PR **#193** body: "W06 remains IN PROGRESS / NOT ACCEPTED" |
| M1 substance | IPD | `26855625` | `DHAN-LIVE-RELIANCE-QUOTE-OPERATOR-ACCEPTANCE-2026-11-18.md` | HTTP 200, `EQ_RELIANCE_IN`, `GOOD`/`CURRENT` |
| W-07/W-08/W-09 | IPD | `main` | PRs **#168, #169, #170, #172**; `dhan_provider_state_recorder.ts` | `dhan_market_data_service.ts:98-99` widened unions |
| W-10 | IRR | `main` | PR **#569** @ `2b61a50a…` | CI run 44037855606; 3,037 tests |
| W-12 quote leg | IPD | `26855625` | PR **#176**; `DHAN-QUOTE-NUMERIC-SERIALIZATION-COMPLETION-RECORD-2026-11-18.md` | `dhan_quote_numeric_serialization.test.ts` |
| W-12 historical outstanding | IPD | `main` | `dhan_historical_dto.ts:182-184` (`securityId` string, `instrument:'EQUITY'`), `:42` (`/charts/historical` only) | no `evidence/` for W-17 |
| W-13 complete | IPD + IRR | `main` | `dhan_normalizer.ts:86-97,166-187` | **probe: absent → `null`** |
| **D-6 zero-depth defect** | IPD | `main` | `dhan_normalizer.ts:86-97` + `:169`; `evidence/dhan-d18/reliance-depth-20261123.json` | **probe: zero book → `MALFORMED_RESPONSE`** |
| W-14 readiness only | IPD | `main` | `DHAN-W14-E4-READINESS-ASSESSMENT-2026-11-23.md`; PR **#190**; `evidence/dhan-w14-e4/e4-sample-reconciliation.json` | `status: READINESS_ASSESSMENT_ONLY`; 6/96 unresolvable |
| W-18 partial | IPD | `main` | `dhan_historical_dto.ts:45` (`365*5`), `:104` | no chunking; limit unobserved |
| W-19 complete | IPD | `main` | `dhan_market_data_service.ts:861-886` (D02 four-timestamp), `:899-957` (cache-routed `getHistorical`) | `dhan_w19_d02_freshness_cache.test.js` **5/5** |
| W-20 partial | IRR / IPD | `main` | IRR `historicalConsumptionBoundary.ts`, `historicalEvidence.ts`; IPD obligations in PR **#191** | IRR PR **#651** @ `be8b85f` |
| W-22 complete | IPD | `main` | `calendars/ipd-equity-2026.v2026-11-19.{1,2}.json`; `dhan_local_daemon.ts:541` | SHA-256 `b7cc69dd…a650ff`; tests 8/8 |
| W-24 open/not authorised | IPD + IRR | `main` | D-7 §11, §12 U-3; `DHAN-W24-OWNER-DECISION-PROPOSAL-2026-11-21.md` | "implementation is **NOT AUTHORIZED**" |
| W-26 outstanding | IPD | `main` | `dhan_market_data_http.ts` client methods at 154/199/230/254/279; freshness only at 398/409 | no `getFreshness` on client |
| W-27 complete | IPD | `main` | `dhan_mapping_expansion.ts`; `scripts/dhan-w27-expand.mjs`; PRs **#164, #189** | `--check` byte-identical; SHA-256 `3c228b3c…` / manifest `69a918f7…` |
| W-29 implemented | IRR | `main` | `quoteConsumptionBoundary.ts` + 40 tests | record `DHAN-W29-…-2026-11-23.md` |
| W-36 partial | IPD | `main` | `windows-setup/03-Start-IipsServers.ps1:111,114,264,335-369,420,501`; `06-Stop-IipsServers.ps1:53,117`; `07-Prepare-DepthCapture.ps1:107,290-307`; PRs #187, #192 | no E3 transcript |
| Pin drift | IRR / IPD | `main` | IRR `frontend/package.json` = `26855625`; IPD `main` = `85ac127`; `9d5ffa4` | `DHAN-W12-HISTORICAL-REQUEST-VERIFICATION-2026-11-23.md` §3.1 |
| Executed gate | IPD | `85ac127` | `npm ci` · `tsc --noEmit` · `npm run build` · `npm test` · Dhan subset | **2,189/2,175/0 fail/14 skip**; **503/491/0 fail/12 skip** |

---

## 10. Limitations of this investigation

1. **IRR source was not executed here.** IRR is not present in this sandbox checkout; its determinations rest on its own published records (including a reported 3,037-test run at `2b61a50`) and on GitHub API inspection of `main` @ `be8b85f`. An IRR full-suite run at `be8b85f` would strengthen W-10/W-13/W-15/W-29/W-39.
2. **`npm ci` upgraded nothing but installed from the lockfile**; `package-lock.json` was not diffed against the pre-existing tree. The 2,189-test result is reproducible but is *not* the owner's Windows host and carries no vendor call.
3. **No live Dhan request** was made. Every E4 statement in this report is a reading of an existing record, at the class that record itself claims, not a new observation.
4. **Windows-only paths are unexercised here**: DPAPI round trips, DACL enforcement, the PowerShell launcher, and the `w28:measure` holdings capture. Their statuses rest on published records.
5. **W-06's substantive claim cannot be independently confirmed** — only its *record* is provably missing. The absence of a record is not evidence that no authentication occurred; IPD's own roadmap states M1 is satisfied.
6. **Zero-depth reconstruction.** BLK-1 was reproduced by constructing a wire payload matching the shape D-18 describes ("five buy and five sell levels, price/quantity/orders present, all zero"). The retained capture stores a *validated projection*, not the raw vendor body, so the reconstruction is faithful to the record but is not the raw bytes. It should be re-confirmed against a raw capture during the fix.

---

**End of investigation.** Planning and investigation only; no repository source, configuration, test, launcher script or runtime data was modified. Execution of any item above is a separate, bounded task.
