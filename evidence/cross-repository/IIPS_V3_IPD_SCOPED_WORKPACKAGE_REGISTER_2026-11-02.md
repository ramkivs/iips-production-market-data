# IIPS v3.0 — IPD scoped work-package investigation and progress register (2026-11-02)

> **STATUS: SCOPED INVESTIGATION COMPLETE — NO AUTHORIZED PRODUCT-CODE GAP FOUND IN ANY OF THE SIX PACKAGES.**
> Investigation and disposition register only. This is not an authority act, not a gate movement,
> not a scope decision and not an acceptance. No product code, package, API, contract, migration,
> test implementation, authorization or gate status is changed by this record.
>
> **Superseding record for IPD-A07:** [`IIPS_V3_IRR_INTELLIGENCE_SCREENS_IPD_SUPPORT_VERIFICATION_2026-11-04.md`](./IIPS_V3_IRR_INTELLIGENCE_SCREENS_IPD_SUPPORT_VERIFICATION_2026-11-04.md)
> closes **IPD-A07** for the four IRR intelligence screens on executed evidence — see **§0.2** below. The P11 Row 26
> `CertifiedSectorEngineId` bridge remains a **Program Authority decision pending** and is **not** closed by it.
>
> **Companion document:** [`IIPS_V3_DIRECT_P1_STATUS_RECONCILIATION_2026-11-01.md`](./IIPS_V3_DIRECT_P1_STATUS_RECONCILIATION_2026-11-01.md)
> carries the **separate Direct P1 status and governance history** — what was provisioned on the
> Windows host, by whom, and what that does **not** mean. Read the two together: this register
> answers *"what is the scoped work-package state?"*; the companion answers *"what exactly was
> provisioned, and why are durable writes still gated?"*. They are consistent by construction; see
> its §8 for the explicit crosswalk.

| Field | Value |
|---|---|
| Date | `2026-11-02` (UTC) |
| Repository | `ramkivs/iips-production-market-data` (IPD only) |
| Authoritative IPD baseline | `main@56959fc33416ce53b142b39cbe4bd8a7ba5e077d`, tree `ee8b0d4f42d10e92b5811fcfffb5a80a9c09cc32` |
| Session branch | `operator/ipd-scoped-workpackage-register-20261102` |
| Scope | Exactly six work packages: IPD-1 … IPD-6. No end-to-end repository audit. |
| Mutation boundary | IPD documentation only. **No IRR file, ref, branch, PR, issue or comment was read for modification or written.** No IPD source, package, script, test, migration, ref or tag was changed. |
| Clone integrity | Verified **non-shallow** before any ancestry claim (`git rev-parse --is-shallow-repository` → `false`; 374 commits on `main`, root `e93b14aa58b4`; 913 commits across all refs; **117** `refs/remotes` + `refs/tags`, measured stably so it does not drift with session-local branches). The clone was shallow at turn start and was unshallowed first. |

## 0. Authoritative investigation source (IRR, read-only, not copied)

The consolidated investigation was read directly from IRR and is **not** reproduced or republished
in IPD.

| Field | Value |
|---|---|
| Repository | `ramkivs/iips-review-recovered` |
| Directory | `docs/integration/reference-inventory-refresh-2026-11-02/` |
| Publication | PR #432 — **MERGED** `2026-11-02T09:04:46Z` |
| Commit | `331e51459be592693395823a47b1a2d3fc4fe462` |
| Tree | `4f1e6592b3d57a8c850476b4a9ae68c81488693c` |
| Artifacts | 9 files, all read at that ref: reconciliation `IIPS_V3_REF_RECONCILIATION_2026-11-02.md`, consolidated capability register, outstanding action register, branch findings, refreshed/source inventory CSVs, remote-only refs, remote verification JSON, Prompt 82641 handoff |

Every IPD ref and commit cited by the IRR register was **independently re-resolved in IPD** and
matched exactly (see §2). The IRR action identifiers carried into this register are
**IPD-A01 … IPD-A07**; the IRR-side actions (IRR-A01 … IRR-A04, SHARED-A01) are IRR-owned and are
**not** actioned here.

Per the IRR handoff, the following prior investigations were **not** repeated: IPD PRs #5, #6, #42,
#56, #57, #88, #120, #121, #122; the 541-row PR census; Prompt 82641's project-wide E2E audit.

## 0.1 Dated addendum (2026-11-02, post-publication) — IPD-4 partly superseded by PR #124

**`main` advanced to `fb029f664618d4bce555b78a9576ef29e65c34d5` while this register was being
published** (PR #124, merged `2026-11-02T10:31:19Z`, integration commit `0c65c6900b3f5c4f216f7e668050dc7cb782ae1b`).
PR #124 published
`evidence/cross-repository/IIPS_V3_IPD_P01-02_AND_RECOVERED_UI_RECONCILIATION_2026-11-02.md`, which
**explicitly cites this register** and amends part of it. The amendment is recorded here as a dated
overlay; the original rows are retained as the record of what was verified at `main@56959fc3`.

**What changed, verified live this pass:**

| Claim | Verification |
|---|---|
| `docs/p01/` (10 accepted specification documents) is **now on `main`** | `git ls-tree fb029f66:docs/p01` → **10 files**; `git cat-file -e 56959fc3:docs/p01` → **absent**, so PR #124 added it |
| **P01-02 was ACCEPTED** by SAI (A3 acceptance act) | commit `a60ed703bb01feb0a8fb4aac867f203ee7e1e551`, 2026-09-28: *"P01-02 ACCEPTED BY SAI — A3 acceptance act recorded (DEP-P01-07 outstanding, non-blocking)"* |
| Shell **structure** was already restored | commit `6b8afda`, 2026-09-23: *"feat(shell): PHASE-5 OPTION A — offline full-shell restoration (donor structure, fail-closed)"* |
| Per-surface **functional** recovery is still absent | `CompanySurface.tsx`, `SectorSurface.tsx`, `CrossSectorSurface.tsx` all **ABSENT** at `fb029f66` |
| PR #124 examined a **different ref** than this register | this register's IPD-4 ref `arena/01a0e30c` → `e716bf1f`; PR #124's `arena/01a0ae80` → `b0fdd8d` |

**Consequences for this register — read these as governing:**

1. **IPD-4 is amended, not merely deferred.** This register inspected `arena/01a0e30c` (the P01-01
   declarative *canonical-id specification module*) and correctly recorded that **that ref's** commit
   disclaimed acceptance. But P01-02 was executed and **accepted by SAI** on the separate
   `arena/01a0ae80` family, and its accepted documentation package is **now on `main`**. The IPD-4
   phrase *"acceptance-blocked"* is therefore **too strong for P01-02** and is superseded: the
   specification is accepted and landed. What genuinely remains outstanding for P01-02 is
   **`DEP-P01-07`** (contract tests + executable time-semantics validation), recorded by PR #124 as
   **outstanding and non-blocking**.
2. **IPD-6's DEFER stands for the *functional* surfaces.** Company / sector / cross-sector /
   decision-matrix surfaces remain absent from `main`, so the per-surface scope/acceptance decision
   (IPD-A07) is still required. PR #124 records that the *structural* shell was restored earlier
   (`6b8afda`) — this register did not claim otherwise, since it assessed surfaces, not shell
   scaffolding.
3. **No other disposition changes.** IPD-1, IPD-2, IPD-3 and IPD-5 are unaffected: PR #124 touched
   none of the files they cite.

**Baseline note:** the register body below is stated against `main@56959fc3`, which was `main` at the
time of investigation and remains the PR #123 base. Where the body says "absent from `main`" for
`docs/p01/**`, that was true at `56959fc3` and is **no longer true** at `fb029f66` — see item 1.

## 0.2 Dated addendum (2026-11-04) — IPD-A07 CLOSED for the four intelligence screens

A scoped IRR-to-IPD integration investigation was performed on `2026-11-04` against
**IPD `main@e1f94e9c4913f816848472e3d16875bdf7af14d6`** and
**IRR `main@9e0a0415b76571fc4db1747b2da63c73fa0447d3`**, covering exactly four IRR screens —
**Company Intelligence, Sector Intelligence, Cross-Sector Intelligence and Decision Matrix** — and
their direct dependencies. Full record:
[`IIPS_V3_IRR_INTELLIGENCE_SCREENS_IPD_SUPPORT_VERIFICATION_2026-11-04.md`](./IIPS_V3_IRR_INTELLIGENCE_SCREENS_IPD_SUPPORT_VERIFICATION_2026-11-04.md).

**All four are implemented, navigable and connected to their intended services inside IRR**, served by
IRR-owned `frontend/server/executive-transport.ts` over IRR-owned `iips-platform/src/sector-engines/**`
(163 files, 14 engine directories, **in the IRR repository**). No IPD dependency exists in their data
paths. Evidence: IRR targeted suites **30/30 pass**; the transport was booted and the endpoints
**live-probed** — `/api/decision-matrix`, `/api/cross-sector`, `/api/company/banking`,
`/api/company/healthcare` all returned **HTTP 200** with fully populated certified `SNAPSHOT`
payloads; IPD engine library tests **32/32 pass**.

### IPD-A07 disposition

> ### `CLOSED — NO IPD UI IMPLEMENTATION REQUIRED; EXISTING IRR CAPABILITY CONFIRMED.`

1. **IRR owns the four user-facing screens and their existing intelligence implementation.** IPD
   supplies backend data and services; it does not own and does not need these surfaces.
2. **IPD's P11 engines remain an in-process library capability.** Their integration with these IRR
   screens **has not been commissioned**. They stay implemented, tested, **unexported**
   (`package.json` exposes only `./portfolio-ui`, `./pit`, `./d114-non-production`,
   `./operator-drop`), **unwired** (IPD has no HTTP surface; the IPC operation set is closed and
   portfolio-only) and **unconsumed**.
3. **Duplicating these screens in IPD is not required, and transplanting historical UI components is
   not required.** The historical refs carrying them (`arena/01a0814b@da43051`, `arena/01a0cf86@ea70a8c4`,
   `arena/01a0d1d3@1c5f46ca`, `arena/01a0d33d@887ecce0`) would not even compile in IPD: their
   components import an API client tier that is absent from those branches **and** from IPD `main`
   (`frontend/src/api` = 0 files; `frontend/server` = 0 files, vs 122 in IRR). A port would duplicate
   an accepted IRR capability.
4. **No IPD integration gap was established, so no IPD implementation was performed.** Nothing was
   created, ported or connected.

### What this addendum does NOT decide

**The P11 Row 26 `CertifiedSectorEngineId` bridge wording and its E2E-pending status remain a separate
PROGRAM AUTHORITY DECISION PENDING.** This addendum does not close it, does not mark it complete, and
**does not infer or claim any IPD/IRR engine equivalence** — strict identifier intersection between the
two engine taxonomies is **1 of 14** and no authoritative mapping exists in either repository. See §7
of the verification record, `IPD_P11_BOUNDED_LIBRARY_SCOPE_AND_ROW26_RECONCILIATION_2026-10-20.md` and
`IIPS_V3_DEC06_P11_MAIN_ADMISSION_DECISION_PACKAGE_2026-10-21.md` (`DECISION REQUIRED — NOT DECIDED`).

### Residual scope, recorded honestly

The IRR register defines `IPD-A07` over *"executive/company/sector/reports/command-palette"* — broader
than the four screens verified here. The closure is recorded **for the four verified screens**. Of the
remaining families: **Executive** already exists on IPD `main` as `features/executive/ExecutiveSurface.tsx`;
**Reports** is a residual outside this pass's scope (IPD `/reports` renders the honest fail-closed
`ReportsStructural`); **command palette** exists in **neither** repository. The authoritative `IPD-A07`
row itself lives in the **IRR** repository and still reads `SCOPE / ACCEPTANCE DECISION REQUIRED`;
updating it is an **IRR-owned** change and was **not** made from this IPD session.

## 0.3 Dated addendum (2026-11-04) — scope of the IPD `future` designation for Opportunities / Risks / Rankings

**Clarification only. No capability, route, constant, status value or routing behaviour is changed.**

IPD's `frontend/src/app/routes.ts` declares three route constants — `intelligenceOpportunities`
(`:53`), `intelligenceRisks` (`:54`), `intelligenceRankings` (`:55`) — and `App.tsx` binds **none** of
them, so those paths resolve through the `/intelligence/*` splat (`App.tsx:393`) to an honest
`FeaturePlaceholder`. `navigation.ts:139-141` marks all three `status: 'future'`.

**That designation is a statement about IPD's own frontend scope and nothing wider.**

| Fact | Evidence |
|---|---|
| Opportunities, Risks and Rankings are **fully implemented, tested and owned by IRR** | IRR `main@9e0a0415`: `frontend/src/features/intelligence/IntelligenceOpportunities.tsx` (107 L), `IntelligenceRisks.tsx` (109 L), `IntelligenceRankings.tsx` (108 L); bound at `App.tsx:59-61`; navigable via `navigation.ts:64-66` |
| Admitted under **NP-18** | IRR PR **#115** *"NP-18: isolate approved intelligence views for main"*, `merged=true`, `2026-10-16T08:37:20Z`, merge commit **`b6a11ec0ed21f69d7f155bb908c333e951c761b1`**; evidence `evidence/integration/np18-{admission,authority-determination,isolated-main,qualification,r3}/2026-10-16/` |
| Verified functional, not placeholder | Targeted suites **32/32 pass** (11 + 10 + 11); `App.test.tsx` **21/21** incl. *"no nav click lands on 'not yet built'"* — **53/53** total. Live probe `GET /api/cross-sector` → **HTTP 200**, `opportunity` (10 items), `ranking` (13 items), `correlation` + `portfolio` populated |
| Therefore | Their `future` status in IPD **must not** be read as future, unavailable or unimplemented across IIPS |

**Retained unchanged:** all three IPD route constants, the `/intelligence/*` splat routing, and the
`future` navigation status. No IPD implementation, no IRR duplication and no integration work is
introduced by this addendum.

**Source-comment corrections made alongside this addendum (comment text only — verified to leave the
compiled output code-identical):** `frontend/src/app/navigation.ts` previously stated that these three
have *"no routes, no implementation anywhere"*, which is **false at IIPS scope** and is corrected to
scope the statement to IPD. Equivalent scope clarifications were added to `routes.ts`, to the
`navigation.ts` module doc comment and to the `App.tsx` splat comment.

**Verification of the comment-only boundary:** `tsc` preserves comments (`removeComments` unset), so the
raw emitted JS differs; with comments stripped, `dist/frontend/src/app/{App,navigation,routes}.js` are
**byte-identical** before and after. `git diff` confirms **0** changed route constants, **0** changed
`status: 'future'` values and **0** changed `<Route path=` lines. Full suite re-run:
**1033 / 1032 pass / 0 fail / 1 skipped**.

Full evidence: §8.1 of
[`IIPS_V3_IRR_INTELLIGENCE_SCREENS_IPD_SUPPORT_VERIFICATION_2026-11-04.md`](./IIPS_V3_IRR_INTELLIGENCE_SCREENS_IPD_SUPPORT_VERIFICATION_2026-11-04.md).

## 1. Disposition summary

| Package | Capability | Current-main status | Disposition |
|---|---|---|---|
| **IPD-1** | Durable persistence: G24 / NP-04 / local application principal / IPC provider / durable + restart-proof user data | **PRESENT and strictly richer than every historical branch** | Capability **COMPLETE**; branch family **OBSOLETE (superseded)**; durable **write BLOCKED** on Gate 4/5 |
| **IPD-2** | Dhan D1/D2 provider foundation + qualification harness | BI-04 holdings **import adapter present**; no `src/providers/dhan/**` | Import adapter **COMPLETE**; live provider **BLOCKED** (no credentials, pre-access, qualification + native host outstanding) |
| **IPD-3** | D06/D07 data supply, backend/data dependencies, presentation wiring | Contracts, four engines, DTO transport, view model, surface and fixtures **present** | **DEFER** — payload question **closed by effective authority act** after a fail-closed forensic gate |
| **IPD-4** | P01-01 canonical identifier contract; P01-02 execution/acceptance | Canonical envelope/validation engine and time normalisation **present**; `src/identity/**` present (8 files) | Current-main contract **COMPLETE**; branch spec module **DEFER** (acceptance/certification not performed — owner decision) |
| **IPD-5** | D-PIT-WIRE-01 Windows scripts + operational documentation | **Absent**; referenced only by the convergence plan, which excludes it | **OBSOLETE / BLOCKED** — explicitly "excluded from all phases"; `src/d114/**` FROZEN; native Windows execution outstanding |
| **IPD-6** | Recovered executive / company / sector UI assets | Executive and research surfaces present; **no** company / sector / cross-sector / decision-matrix surfaces | **DEFER** — no governing record on `main` establishes these as authorized requirements |

**Overall: 0 of 6 packages has an authorized, Arena-implementable product-code gap.** Four are
authority-, access- or host-bound (IPD-2, IPD-3, IPD-4, IPD-6), one is excluded by a governing
record and frozen (IPD-5), and one is already complete on `main` with its write path correctly
gated (IPD-1). The justified IPD-owned deliverable of this pass is therefore this durable register,
not a product-code change.

## 2. Reference resolution (independently verified in IPD)

All twelve refs resolve, and each tip matches the commit cited by the IRR register. Eleven share
merge-base `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (2026-09-23, "Merge pull request #4");
`arena/01a0c440` has merge-base `eae2ff69`. **None is an ancestor of current `main`.**

| Ref | Tip | Merge-base |
|---|---|---|
| `arena/01a0e6d9-iips-production-market-data` | `c1b955b4` | `4d3e1cdc` |
| `arena/01a0f308-iips-production-market-data` | `6828155e` | `4d3e1cdc` |
| `np04-governed-persistence-windows` | `2e11fa3b` | `4d3e1cdc` |
| `gate-a/local-principal-enablement-2026-10-16` | `2ded0e98` | `4d3e1cdc` |
| `gate-b/local-principal-ipc-implementation` | `cec70802` | `4d3e1cdc` |
| `arena/01a0d943-iips-production-market-data` | `224fc543` | `4d3e1cdc` |
| `arena/01a0ddae-iips-production-market-data` | `8c87317a` | `4d3e1cdc` |
| `arena/01a0e30c-iips-production-market-data` | `e716bf1f` | `4d3e1cdc` |
| `arena/01a0c440-iips-production-market-data` | `42f91fad` | `eae2ff69` |
| `arena/01a0cf86-iips-production-market-data` | `ea70a8c4` | `4d3e1cdc` |
| `arena/01a0d1d3-iips-production-market-data` | `1c5f46ca` | `4d3e1cdc` |
| `arena/01a0d33d-iips-production-market-data` | `887ecce0` | `4d3e1cdc` |

Tags: `iips-pin-np04-2e11fa3b` peels to `2e11fa3b`; `iips-pin-g24-6828155e` peels to `6828155e`.
**Neither peeled commit is an ancestor of `main`.** The IRR claim that `arena/01a0e6d9` and
`arena/01a0f308` share an exact tree was **confirmed**: both trees are
`eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5`. They are one capability family, not two implementations.

## 3. Durable progress register

All fifteen required fields are recorded per package below.

### IPD-1 — Durable persistence (G24 / NP-04 / local application principal / IPC provider)

| Field | Value |
|---|---|
| **Capability** | G24; NP-04; local application principal; IPC provider; durable user-data persistence; restart-proof persistence behaviour |
| **Relevant references** | `arena/01a0e6d9@c1b955b4`; `arena/01a0f308@6828155e` (tree-identical to the former); `np04-governed-persistence-windows@2e11fa3b`; `gate-a/local-principal-enablement-2026-10-16@2ded0e98`; `gate-b/local-principal-ipc-implementation@cec70802`; tags `iips-pin-np04-2e11fa3b`, `iips-pin-g24-6828155e` |
| **Current-main status** | **PRESENT.** `src/persistence/portfolio_store.ts` (836 lines, 18 exports incl. `DurablePortfolioStore`, `RevisionEntry`, `PortfolioContribution`, `WriteNotAuthorizedError`, `evaluatePortSaveGuard`, `computeLineageHash`); `durablePortfolioStorePort.ts` (`readonly durability = 'DURABLE'`, write-gate boundary); `binding.ts` (`resolveActiveBinding`, `resolveActiveBindingInCurrentTransaction`, `inspectBindings`, `ActiveOwner`) + migration `003_local_principal_bindings` (`local_principal_bindings`, `local_principal_memberships`); `src/ipc/{endpoint,entrypoint,dispatch,protocol,brokerImportConsumer}.ts`; migrations 001–004; `migration_ledger.ts`, `audit.ts`, `provisioning.ts`, `directP1Provisioning.ts`, `gateAPrime{Provisioning,Validation}.ts` |
| **Historical findings** | A **pre-Gate-3** lineage (merge-base 2026-09-23). HTTP-based (`src/server/http-server.ts`, `authorization.ts`), with `src/app_identity/**` (5 files) and an `src/auth/**` OIDC/JWKS stack (5 files). Its `src/portfolio/durable-store.ts` is 611 lines / 5 exports (`DurablePortfolioStore`, `DurablePortfolioView`, `DurableSaveResult`, `OwnershipScope`, `SaveHoldingsRequest`) against `main`'s 836 lines / 18 exports of the **same class name**. Main is strictly richer on every operation (occurrence counts: `get` 12 v 1, `revisions` 15 v 1, `transaction` 17 v 5, `rollback` 1 v 0, `list` 7 v 5, `contributions` 13 v 13) |
| **Governing decision** | Gate 3 acceptance `IIPS-V3-G3-ACCEPTANCE-2026-10-22-01`; `evidence/np04/IIPS_v3.0_G2_GATE_V_EVIDENCE_RECONCILIATION_AND_PA_WAIVER_RECORD_2026-10-16.md` and the Gate A derivative-ref publication records; the frozen W-1 conjunction in `evaluatePortSaveGuard`. The `src/auth/**` OIDC stack is out of scope under IRR H-18 and is **not** an IPD requirement |
| **Confirmed gap** | **None for capability.** Durable **write** remains correctly gated: `evaluatePortSaveGuard()` → `authorized = false`, reasons `["W-1(3): Gate 4 qualification not accepted","W-1(4): Gate 5 admission not accepted"]` — **evaluated live this pass** against the compiled `main` build |
| **Disposition** | Current-main capability **COMPLETE**; branch family **OBSOLETE (superseded)**; durable write **BLOCKED** on Gate 4 / Gate 5 acceptance |
| **IRR dependency** | IRR holds a package pin to the NP-04 commit; **an IRR pin is not IPD-`main` admission**. IRR `arena/a2df3b85` G-2 adapter/restart-proof lineage is a separate **IRR-owned** decision (IRR-C06 / IRR-A03) and is not actioned here |
| **Implementation status** | No change required or made |
| **Tests** | Restart durability is covered against `DurablePortfolioStore`/`DurablePortfolioStorePort` by `tests/q1_broker_import_durability.test.ts` (21 restart-related assertions; explicitly "survives a store restart and a SEPARATE PROCESS restart", including a separate OS process re-reading the same store file). Plus `g3_write_gate`, `g3_durability_vocabulary`, `g3_portfolio_read_isolation`, `g3_binding_resolution`, `q1_ipc_read_contract_conformance` |
| **Execution evidence** | `npm ci` exit 0; `npm run build:tsc` exit 0; live `evaluatePortSaveGuard()` evaluation (above); full suite result in §5 |
| **PR / Commit** | This register only (see §6) |
| **Remaining action** | Gate 4 target-host qualification and Gate 5 admission (**not authorized**); native Windows provider startup and named-pipe smoke test on the designated host. **IPD-A01 gate-status reconfirmation is answered by this row: the branch family remains non-admitted and the pin remains consumer-only evidence.** The reason the write path stays gated — and the operator-reported provisioning that already happened behind it — is recorded in the **companion Direct P1 reconciliation** (§3, §5, §7) |

### IPD-2 — Dhan provider (D1/D2)

| Field | Value |
|---|---|
| **Capability** | Dhan D1/D2; provider foundation; provider qualification harness; provider readiness and integration |
| **Relevant references** | `arena/01a0d943@224fc543` (branch commits `74c9065`, `97f8e30`, `224fc54`) |
| **Current-main status** | BI-04 **holdings import** adapter present: `frontend/src/features/portfolio/import/adapters/dhan-holdings-adapter.ts` (governed `BI-04-AUTH-2026-01`, sourced from `ramkivs/finapp` WP-FB-IMPORT-BROKER-01 under Governed Reuse Handoff `b97b103`; execution mode `NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV`), plus `evidence/bi04/dhan-web-ui-summary-v1-schema.{json,md}`. **No `src/providers/dhan/**` and no `src/providers/` at all on `main`** |
| **Historical findings** | Branch adds 11 `src/providers/dhan/*` modules (`dhan_api_client`, `dhan_config`, `dhan_dto`, `dhan_failures`, `dhan_historical_adapter`, `dhan_historical_dto`, `dhan_instrument_map`, `dhan_instrument_mapping_integration`, `dhan_market_data_source`, `dhan_normalizer`, `index`), `src/providers/market_data_route.ts`, three qualification/demonstration test suites, fixtures, and a `frontend/src/features/dev/DhanD2DevSurface.tsx` development harness |
| **Governing decision** | The branch's **own** evidence: `evidence/dhan-d1/dhan-d1-provider-foundation-report.md` declares execution mode `PRE_ACCESS_NO_LIVE_CREDENTIALS` / `LOCAL_FIXTURE_AND_OFFLINE_DEV`, states "Real Dhan API credentials were **not available** for this gate. No real Dhan authentication was [performed]", and concludes results "prove **pre-access implementation correctness only** — not production readiness". Health is never `HEALTHY` pre-access by design |
| **Confirmed gap** | The live market-data provider is genuinely absent from `main` — but it is **not an authorized requirement** until provider access, scope and qualification are established. No governing record on `main` admits a Dhan market-data provider |
| **Disposition** | Import adapter **COMPLETE** (BI-04 scope); live provider **BLOCKED** on external credentials, an explicit scope/authority decision, designated qualification and native execution |
| **IRR dependency** | None identified for the provider. The broker-import consumer boundary is already on `main` and separately governed |
| **Implementation status** | No change made. Implementing a provider against absent credentials would produce synthetic-only evidence the branch itself disclaims |
| **Tests** | Branch-local `dhan_d1_provider_foundation`, `dhan_d2_integration_qualification`, `dhan_d2_ui_mock_demonstration` — **branch-local reports are not current-`main` acceptance**. Main's broker-import suites cover the admitted adapter path |
| **Execution evidence** | Static inspection and blob/tree comparison only. **No Dhan call was attempted; no credential was sought** |
| **PR / Commit** | This register only |
| **Remaining action** | **IPD-A02**: obtain approved provider access and an explicit scope/authority decision, then execute the designated qualification on the native host with dated logs; keep synthetic and live evidence separate. **No live-Dhan claim may be derived from synthetic fixtures** |

### IPD-3 — Data supply (D06/D07)

| Field | Value |
|---|---|
| **Capability** | D06/D07; backend and data dependencies; prospective presentation wiring; data-supply contracts and provider dependencies |
| **Relevant references** | `arena/01a0ddae@8c87317a` |
| **Current-main status** | **PRESENT.** `src/contracts/d06_news.ts`, `src/contracts/d07_estimates.ts`; `src/intelligence/{news_engine,estimates_engine,macro_engine,altdata_engine,index}.ts`; `src/transports/intelligence_dto.ts`; `src/ui/view_models/ui04_domain_intelligence.ts`; `frontend/src/features/intelligence/IntelligenceSurface.tsx`; fixtures `tests/fixtures/d06_fixtures.json` and `d07_fixtures.json`; tests `tests/wsc_p10_intelligence.test.ts`, `tests/shell_intelligence_surface.test.ts` |
| **Historical findings** | Branch adds `src/intelligence/d06_d07_build_time_wiring.ts`, two **prospective raw-response observation datasets** (`d06_prospective_nse_corporate_announcements_raw_response.json`, `d07_prospective_estimates_raw_response.json`) with their dataset modules, `src/ui/view_models/ui04_d06_d07_build_time_demo.ts`, `src/transports/engine_api_adapter.ts`, and edits to `contracts/{types,provenance}.ts`. The branch tip describes itself as **presentation-only build-time wiring**; **this path is absent from `main`** |
| **Governing decision** | **`phase1c-intel-deferred-completion-2026-09-22-001`** (`evidence/target-shell-integration/PHASE1C-INTELLIGENCE-DEFERRED-COMPLETION-AUTHORITY-RECORD.md`): RAMKI (Designating Authority) selected **Option B** following the **fail-closed** outcome of `GATE-PHASE-1C-INTELLIGENCE-PAYLOAD-FORENSIC`. The act "**closes the Intelligence payload question for the current convergence cycle**", records only, and selects **no** next product surface. Companion records: `PHASE1C-INTELLIGENCE-PAYLOAD-AUTHORITY-DESIGNATION.md`, `PHASE1C-INTELLIGENCE-PAYLOAD-FORENSIC-REPORT.md` |
| **Confirmed gap** | **None authorized.** The payload question is closed by an effective authority act; the branch's prospective wiring depends on unadmitted sources |
| **Disposition** | **DEFER** (closed by effective authority act). The branch wiring is **not admissible** without a new authority act and data-source admission |
| **IRR dependency** | IRR consumes intelligence DTOs through the existing transport contract on `main`; no new IRR change is identified or requested |
| **Implementation status** | No change made. Re-introducing build-time wiring would contradict an effective decision |
| **Tests** | Main's `wsc_p10_intelligence` and `shell_intelligence_surface` cover the admitted engines/surface |
| **Execution evidence** | Static inspection; authority record read at `main` |
| **PR / Commit** | This register only |
| **Remaining action** | **IPD-A03**: only if the owner reopens the question — a new authority act, source designation, licence/entitlement and provenance, dataset acceptance and an explicit release boundary. **No production-data or UI-readiness claim may be derived from build-time wiring** |

### IPD-4 — Canonical identifiers (P01-01 / P01-02)

| Field | Value |
|---|---|
| **Capability** | P01-01 canonical identifier contract; P01-02 execution and acceptance dependencies; validation, acceptance and certification |
| **Relevant references** | `arena/01a0e30c@e716bf1f` (branch-local authority commit `6b7552b`) |
| **Current-main status** | **PRESENT.** `src/contracts/envelope.ts` is headed "Canonical Envelope & Validation Engine (**P01-01** / P01-04)"; `src/normalization/time_normalizer.ts` is headed "Timestamp & Timezone Normalisation Engine (P06 / **P01-02**)"; `src/contracts/types.ts` validates the exact canonical `ISIN:<isin>:<series>` grammar (lines 88, 124); `src/identity/**` has **8** files including `mapping_store.ts` and `security_master.ts`; `src/contracts/d05_security_master.ts` present |
| **Historical findings** | Branch adds `src/contracts/canonical_id_specification.ts` — explicitly a **declarative specification module**, whose own header states "Reuse declarations (evidence-based; these are **NOT reimplementations**)" and that cross-provider mapping is "a **NORMATIVE REFERENCE** to `src/identity/mapping_store.ts` … this module **declares them and does not reimplement them**". It exports `CANONICAL_ID_SPECIFICATION_ID`, `CANONICAL_ID_SPECIFICATION_VERSION`, `CanonicalIdKind`, `CanonicalIdValidationCode`. Also `docs/P01-01-CANONICAL-ID-SPECIFICATION.md`, `tests/fixtures/p01_01_canonical_id_fixtures.json`, `tests/p01_01_canonical_identifiers.contract.test.ts`, and 21 `evidence/target-shell-integration/**` acts/records (P00-02, P01-WAVE1, WATCHLISTS-*). **`src/contracts/canonical_id_specification.ts` is absent from `main`** |
| **Governing decision** | Branch-local `P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md` and `P01-01-CANONICAL-IDENTIFIERS-EXECUTION-RECORD.md`. The branch's own commit states **acceptance/certification was not performed and P01-02 was not executed** |
| **Confirmed gap** | The current-`main` identifier contract is complete. The spec module's **acceptance/certification path is not done**, which is an owner decision — **not** a missing implementation. Note the spec's normative dependencies **do** exist on `main` (8 `src/identity/**` files versus the branch's 6), so it is **acceptance-blocked, not dependency-blocked** |
| **Disposition** | Current-main contract **COMPLETE**; branch spec module **DEFER** (acceptance/certification outstanding for **this ref**; owner decision required before adoption). **AMENDED by §0.1:** P01-02 was separately **accepted by SAI** (`a60ed703`) and its 10-document package is **now on `main`**; `DEP-P01-07` remains outstanding and non-blocking |
| **IRR dependency** | None identified |
| **Implementation status** | No change made. Adopting an uncertified normative contract would rewrite identifier semantics without acceptance, and the task forbids inferring P01-02 execution |
| **Tests** | Branch-local contract test is not current-`main` acceptance. Main's identifier/envelope behaviour is covered by the existing contract and PIT identity suites |
| **Execution evidence** | Static inspection; blob/tree comparison |
| **PR / Commit** | This register only |
| **Remaining action** | **IPD-A04**: owner decides whether the specification remains required; if yes, complete its distinct acceptance/certification route against current-`main` contract consumers before adoption. **Do not infer P01-02 execution; do not rewrite legacy identifiers** |

### IPD-5 — Windows operations (D-PIT-WIRE-01)

| Field | Value |
|---|---|
| **Capability** | D-PIT-WIRE-01; Windows scripts and operational documentation; host-execution prerequisites and evidence |
| **Relevant references** | `arena/01a0c440@42f91fad` (merge-base `eae2ff69`); D-PIT-WIRE-01 commits `8b10968`, `331dbed`, `b57098c`; three branch-side paths `scripts/windows/d-pit-wire-01/{README.md,prepare-corpus.ps1,verify-w0-w6.ps1}` |
| **Current-main status** | **Absent.** `scripts/windows/d-pit-wire-01/**` does not exist on `main`. `D-PIT-WIRE-01` appears on `main` in exactly one file — `docs/FULL_IIPS_BI08_CONVERGENCE_PLAN.md` — which **excludes** it |
| **Historical findings** | The convergence plan records that the ref tip `42f91fa` is a citation anchor whose last 11 commits touch **zero** `frontend/src` files, that `8b10968` (2026-09-21) is the content authority, and that these commits touch **PIT/legacy-NSE identity** |
| **Governing decision** | `docs/FULL_IIPS_BI08_CONVERGENCE_PLAN.md` on `main`: `src/d114/**` status is **FROZEN** on `main` and **EXCLUDE** for the convergence lineage; `origin/arena/01a0c440`'s D-PIT-WIRE-01 commits are "**excluded from all phases**"; `evidence/d114*` JSON "must remain untouched"; the Windows worktree `G:\IIPS-D114-Historical-Feasibility-Windows` "must not be used for any operation here" |
| **Confirmed gap** | **None authorized.** The work is explicitly excluded and its target area is frozen. Repository inspection is not execution in any case |
| **Disposition** | **OBSOLETE / BLOCKED** — excluded by a governing record on `main`; even if rescoped, acceptance requires native Windows execution |
| **IRR dependency** | None |
| **Implementation status** | No change made. Porting these scripts would modify a FROZEN area against an explicit exclusion |
| **Tests** | None applicable. **Script inspection and static analysis are not execution** |
| **Execution evidence** | Static inspection only. **No PowerShell/pwsh was executed; no Windows host was contacted** |
| **PR / Commit** | This register only |
| **Remaining action** | **IPD-A05**: owner decides whether the scripts remain in scope (which requires lifting the convergence-plan exclusion and the `src/d114/**` freeze); if so, run `prepare-corpus.ps1` and `verify-w0-w6.ps1` on the designated native Windows host and retain the unedited transcript, environment/version manifest, exit codes and corpus/verification hashes. **Linux, CI or synthetic IPC evidence is not Windows evidence** |

### IPD-6 — Recovered UI assets (executive / company / sector)

| Field | Value |
|---|---|
| **Capability** | Recovered executive UI assets; company UI assets; sector UI assets; IPD-owned frontend artifacts and their intended integration boundaries |
| **Relevant references** | `arena/01a0cf86@ea70a8c4` (executive; 10 branch-side `frontend/**` paths), `arena/01a0d1d3@1c5f46ca` (company/sector; 23), `arena/01a0d33d@887ecce0` (sector/cross-sector/decision; 34); `arena/01a0814b` family |
| **Current-main status** | **Partially present.** `frontend/src/features/` on `main` has `executive/ExecutiveSurface.tsx` (221 lines), `research/ResearchSurface.tsx`, `intelligence/IntelligenceSurface.tsx`, `evidence/EvidenceSurface.tsx`, `portfolio/**` (workspace, broker-import, three broker adapters), `screener/MultiFactorScreenerSurface.tsx`, `security-master/SecurityMasterSurface.tsx` — 50 frontend files total. Also `frontend/src/components/company/CompanyHeader.tsx`, `src/ui/view_models/ui05_sector_scoring_radar.ts`, `src/engine_adapters/sector_defaults.ts`. **Absent:** dedicated company, sector, cross-sector and decision-matrix surfaces, and every `frontend/server/*-transport.ts` / `*-dev-server.ts` |
| **Historical findings** | The three refs carry distinct `frontend/**` trees and branch-side transport/package changes: `executive-transport.ts`, `executive-dev-server.ts`, `research-sector-transport.ts`, `research-sector-dev-server.ts`, `api/{authFetch,company,crossSector,dataMode,decisionMatrix,evidence,executive,replay}.ts`, `features/company/CompanyTrustChain.tsx`, plus `app/App.tsx` and `app/navigation.ts` edits |
| **Governing decision** | **No recovery authority record exists on `main`** — a tree-wide search for recovery records returns only this task's own test file. Prior records describe recovery as branch-only, partially verified and non-production; **D115 implementation authority was not granted** and AI advisory was deferred. The IRR register records these as IPD-owned branch artifacts and requires a per-surface scope/acceptance decision (IPD-A07) |
| **Confirmed gap** | The surfaces are absent from `main`, **but no governing record establishes them as authorized requirements**. Per the standing rule, absence plus branch existence is not an authorized requirement |
| **Disposition** | **DEFER → CLOSED for the four intelligence screens (§0.2, 2026-11-04).** Originally **DEFER** — scope/acceptance decision required per surface, not IMPLEMENT; **confirmed by §0.1** that the functional surfaces remain absent at `fb029f66` with the shell *structure* restored earlier (`6b8afda`). The §0.2 investigation then established that these surfaces are **IRR-owned and fully supplied by IRR**, so **no IPD implementation is required** — `IPD-A07` is **CLOSED**. The DEFER history is retained, not erased |
| **IRR dependency** | These are **IPD-owned** artifacts even though they live under `frontend/**`. They must **not** be copied or moved into IRR; any desired IRR surface needs its own IRR decision and implementation. No IRR file was modified |
| **Implementation status** | No change made. A blanket port of three divergent UI trees would be a blind cherry-pick across unrelated acceptance states |
| **Tests** | Branch-local acceptance records are not current-`main` acceptance. Main's `shell_intelligence_surface` and related suites cover the admitted surfaces |
| **Execution evidence** | Static inspection; per-ref `frontend/**` path census |
| **PR / Commit** | This register only |
| **Remaining action** | **IPD-A07 — CLOSED (2026-11-04, see §0.2):** `CLOSED — NO IPD UI IMPLEMENTATION REQUIRED; EXISTING IRR CAPABILITY CONFIRMED.` The four screens (Company / Sector / Cross-Sector Intelligence, Decision Matrix) are implemented, tested (30/30) and live-verified (HTTP 200) inside IRR over IRR-owned services and engines; no IPD dependency exists in their data paths, so duplicating them in IPD or transplanting historical UI components is **not** required. **Still open and separate:** the P11 Row 26 `CertifiedSectorEngineId` bridge wording and E2E-pending status remain a **PROGRAM AUTHORITY DECISION PENDING** — not closed here, and **no IPD/IRR engine equivalence is inferred**. Evidence: `IIPS_V3_IRR_INTELLIGENCE_SCREENS_IPD_SUPPORT_VERIFICATION_2026-11-04.md` |

## 4. IRR consumer dependencies (identified, not modified)

| Package | IPD provider requirement | IRR consumer dependency | Integration contract / evidence |
|---|---|---|---|
| IPD-1 | Durable portfolio store + local-principal binding behind the Gate 3 IPC provider | IRR holds a package pin to the NP-04 commit; IRR `arena/a2df3b85` G-2 adapter/restart-proof lineage is a separate IRR decision | **An IRR pin is consumer evidence, not IPD-`main` admission.** Any future integration needs separate IRR-consumer and IPD-provider work items, each recording its own commit, pin, tests, ownership and acceptance (SHARED-A01) |
| IPD-2 | Broker-import adapter contract (already admitted, BI-04) | Existing broker-import consumer boundary on `main` | No new IRR change identified. A future live provider would need its own consumer contract before any IRR wiring |
| IPD-3 | Intelligence DTO transport (`src/transports/intelligence_dto.ts`) | IRR consumes intelligence DTOs through the existing contract | Unchanged; no new dependency created |
| IPD-4 / IPD-5 / IPD-6 | None admitted | None identified | No IRR dependency created or changed |

**No IRR file, ref, branch, PR, issue or comment was modified.** IRR was read only through the
published PR #432 artifacts at commit `331e5145`.

## 5. Testing and execution evidence

Environment: Arena Linux sandbox, Node via `npm ci` from the committed lockfile, IPD checkout at
`main@56959fc3` on branch `operator/ipd-scoped-workpackage-register-20261102`.

| Check | Command | Result |
|---|---|---|
| Clone integrity | `git rev-parse --is-shallow-repository` | `false` (after `git fetch --unshallow`; was `true` at turn start) |
| Dependency install | `npm ci` | **exit 0** |
| Type check | `npx tsc --noEmit` | **exit 0** |
| Build | `npm run build` / `npm run build:tsc` | **exit 0** |
| Live write-gate evaluation | compiled `evaluatePortSaveGuard()` | `authorized = false`; `W-1(3): Gate 4 qualification not accepted`; `W-1(4): Gate 5 admission not accepted` |
| Full suite | `npm test` | **1033 tests / 1032 pass / 0 fail / 1 skipped / 0 cancelled / 0 todo** — identical to the `56959fc3` baseline, **0 regressions** (the 1 skip is pre-existing) |
| Whitespace | `git diff --check`, `git diff --cached --check` | **clean (exit 0)**; 0 added lines with trailing whitespace |

**Limitations, stated explicitly:**

- **No native Windows execution was performed.** Nothing in this pass constitutes Windows
  verification. IPD-5's `prepare-corpus.ps1` / `verify-w0-w6.ps1` were **inspected, not run**;
  no PowerShell or pwsh was invoked and no Windows host was contacted.
- **No Dhan API call was attempted** and no credential was sought. No live-provider, freshness or
  provenance claim is made.
- **No durable portfolio write was performed or authorized**, and **Direct P1 provisioning was not
  repeated**. The write guard remains hard-false.
- Tests, CI and synthetic IPC on Linux are **not** evidence of Windows named-pipe behaviour.
- Branch-local test reports were **not** treated as current-`main` acceptance anywhere in this register.

## 6. Boundaries preserved

- **IPD only.** IRR was read-only via published artifacts; no IRR mutation of any kind.
- **Documentation only.** No source, package, API, contract, migration, script, test implementation,
  database or runtime change.
- **No ref mutation.** No branch reset, deletion, retarget, force-push or tag change. All twelve
  refs and both pin tags are untouched and were only read.
- **No blind cherry-pick or blanket merge.** No historical branch content was transplanted.
- **No production change**, no authorization change, no gate movement, no new prerequisite and no
  new governance decision.
- Historical records preserved: the branch-local P01, Dhan, D06/D07 and recovery records were read
  and cited, not rewritten or superseded.
- Not repeated: the 541-row PR inventory, the completed PR reconciliations (#5, #6, #42, #56, #57,
  #88, #120, #121, #122), or Prompt 82641's project-wide E2E audit.

## 7. Future-analysis instruction (binding)

**Before treating any of these six packages as a missing IPD capability, or recommending that a
historical branch be revived, ported or cherry-picked, consult this register.**

1. **IPD-1 is not missing.** `main`'s `DurablePortfolioStore` is the same class name as the branch's
   with a strictly richer contract. The branch family is superseded, and its OIDC/`src/auth` stack
   is out of scope. Do not re-land it. Durable writes stay gated until Gate 4 and Gate 5 are accepted.
2. **IPD-2's absence is access-bound, not an oversight.** The branch itself declares
   `PRE_ACCESS_NO_LIVE_CREDENTIALS` and disclaims production readiness.
3. **IPD-3 is closed by an effective authority act** (`phase1c-intel-deferred-completion-2026-09-22-001`)
   after a fail-closed forensic gate. Do not re-wire D06/D07 payloads without a new act.
4. **IPD-4's contract is already on `main`.** The branch module is a declarative spec that was never
   accepted or certified; it is acceptance-blocked, not dependency-blocked.
5. **IPD-5 is explicitly excluded** by `docs/FULL_IIPS_BI08_CONVERGENCE_PLAN.md`, and `src/d114/**`
   is FROZEN. Porting it would violate a governing record.
6. **IPD-6 has no governing record on `main`.** Absence plus branch existence is not an authorized
   requirement; a per-surface decision is required first.
7. **Ancestry claims require a non-shallow clone.** Verify `git rev-parse --is-shallow-repository`
   returns `false` before using `merge-base --is-ancestor`; on a shallow clone that command returns
   a false negative for genuine ancestors.

*End of the 2026-11-02 IPD scoped work-package investigation and progress register.*
