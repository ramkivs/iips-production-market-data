# IIPS v3.0 — CAP-03 Program Authority Decision Packet DQ-1 … DQ-7

> ## STATUS: **PROPOSED — NOT EFFECTIVE — NO PROGRAM AUTHORITY DECISION IS RENDERED**
>
> This is a decision-ready record. It selects no contract option, renders no act, adopts no manifest,
> approves no host, PR, pin, provisioning, QE item, result or fence lift, and authorizes no
> implementation. Every recommendation is a recommendation to the Program Authority, not a decision.
>
> **Non-production scope only.** Nothing here establishes production eligibility, a production
> `durable:true` claim, or `TD-7b`. The durable-write conjunction W-1, `WRITE_NOT_AUTHORIZED`,
> `SESSION_ONLY` / `durable:false`, every HTTP `503` fence and G24 reference-only status remain in force.

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-CAP03-PA-DECISION-PACKET-DQ1-DQ7-2026-10-24-01` (census before this record: `0` in IPD and IRR) |
| **Record type** | Decision-preparation packet / PA decision request. Not an authority act, implementation act, adoption act, qualification result, acceptance, admission, or provisioning receipt |
| **Prepared** | `2026-10-24` (UTC) |
| **Prepared by** | Arena Agent Mode under the standing preparation/investigation/publication authorization (F-3 §1.2 as construed by DEC-06 R-1/R-2/R-3/R-9). The decider for every item is **Ramki — Program Authority** |
| **Locus** | `ramkivs/iips-production-market-data` (IPD), the repository designated for the IPD implementation, qualification and decision artifacts. IRR was inspected read-only; **0 IRR mutations** |
| **IPD pre-mutation baseline** | `refs/heads/main` = `1864f908b26322071a866cc3a3dab074faa536fd`; tree = `4a28a3b819e00fe999079727d3cdf8a1d8fb5155`; full history (`--is-shallow-repository = false`); clean tracked worktree |
| **IRR read-only baseline** | `refs/heads/main` = `4d14780f0db66a891f552926ee2badaf56acfa2d`; tree = `742ac4d4c8817bab9aa2cbeaac138d9a72c2934e`; full-history bare clone |
| **Session branch** | `arena/e3526bec-iips-production-market-data`, based exactly on the IPD baseline above. No merged session branch is reused; neither open PR head is a base |
| **Decision status** | **All seven questions remain open.** No rendered DQ act exists on either authoritative `main` |
| **Execution consequence** | Track B implementation, freeze and PR/#42/Reports/D115 dispositions are **STOPPED** at this record. Track C host execution is **STOPPED** on the unavailable designated host, absent final pins/H-12 adoption/provisioning authority in a confirmed order. The readiness packet records the exact boundary |

---

## 1. Step 0 — independent re-verification before any mutation

### 1.1 Repository coordinates, ancestry and CI

| Item | IPD | IRR |
|---|---|---|
| Full history | `false` for shallow after `git fetch --unshallow`; **291** commits reachable | full bare clone; **661** commits reachable |
| `main` commit | `1864f908b26322071a866cc3a3dab074faa536fd` | `4d14780f0db66a891f552926ee2badaf56acfa2d` |
| `main` tree | `4a28a3b819e00fe999079727d3cdf8a1d8fb5155` | `742ac4d4c8817bab9aa2cbeaac138d9a72c2934e` |
| Latest `main` push CI | run `40069710927` — **success**; `typecheck · build · test` job `120800318218` all steps success; `executed test count` check success | run `39999128417` — **success**; `Typecheck · Test · Build` job `120570317955` all steps success |
| Open PRs | **#42 only** — `Gate 3: act-conformant IPC candidate with connection-slot release`, **DRAFT / OPEN / UNMERGED**, head `afa430900c3e928773bd35a3718bf3d6c94ccff5`, merge state `DIRTY / CONFLICTING`, 22 files `+5,137/−0` | **#204 only** — `Gate 4/H-12 dependency and DR/GOV execution report`, OPEN, head `dee114ae6be70cdb04dbdc3940819ab212c669aa`, `MERGEABLE / CLEAN`, one root-level documentation file `+174/−0` |
| PR head vs `main` | `afa43090…` is **not** an ancestor of `main`; `main` is **not** an ancestor of the PR head | `dee114ae…` is **not** an ancestor of `main`; `main` is **not** an ancestor of the PR head |
| Use in this pass | **not fetched as a base, not built on, not merged, not closed** | **read-only; not merged, not built on, not closed** |
| Session branch ancestry | session branch == baseline commit; `main` is an ancestor | no session branch created; IRR is read-only |

A stale or shallow ancestry was not used for any conclusion. The G24 reference-only objects were checked
on full history: `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` (tag `iips-pin-g24-6828155e^{}`),
`c1b955b427486dbce6d6a159a448065b9db45dc9` (`arena/01a0e6d9-…`) and
`2ded0e981407b38c73bdea164153f53856aa7217` (Gate A lineage) are **not** ancestors of IPD `main`; IRR
`470cc698924ebecf8ce51cf7291b48f3fc1c7da7` and `5eba01b6e818a261230725761b7797b68782e883` are **not**
ancestors of IRR `main`. G24 remains **REFERENCE ONLY**: no fetch as a base, merge, cherry-pick, port,
promotion, re-pin, tag movement or reuse.

### 1.2 A1 — PR #80 / #81 publication-receipt pair

The substantive PR #80 record and the after-merge PR #81 receipt already exist on authoritative `main`.
No additive receipt was missing and **nothing was published for A1**; it was verified and skipped.

| Fact | Verified value |
|---|---|
| PR #80 | MERGED `2026-10-24T06:15:53Z`; head `f9ec0c5fd4c689360264b4f7a8b85fdf823d4374`; merge `d8568b0ebe2bec2a7a2f38ed758e1f877f861704`; merge tree `fcf7cb85ad7f53c20d5cfd8721bfecf7fc13a129` |
| PR #80 checks | head run `40069388650` — both checks SUCCESS; post-merge run `40069514698` — both checks SUCCESS; **897 executed / 896 passed / 0 failed** on `d8568b0e…` |
| PR #81 | MERGED `2026-10-24T06:18:52Z`; head `e6b050a48d6ea4c6fabd276c2ce84140183b4c44`; merge `1864f908b26322071a866cc3a3dab074faa536fd`; one changed path (`+78/−0`, tracker append only) |
| PR #81 checks | head run `40069632035` — both SUCCESS; post-merge run `40069710927` — both SUCCESS |
| S1 determination read-back | `evidence/cross-repository/IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md`, remote blob `b7746b5ed955abcf689ec57ca4a0748c0241ed09`, **35,936 B** |
| Tracker read-back | `evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md`, remote blob at `main` **`e131d428491b78346b63af9483747ab809f09cdb`**, **104,742 B**; local blob equal |

**A1 result:** complete. The receipt chain is `PR #80 substantive → PR #81 receipt`, green at both exact
heads and both post-merge pushes, with remote Contents-API read-back. A1 establishes publication only;
it is not provisioning, H-12 adoption, Gate 4 qualification, acceptance, admission or write authority.

### 1.3 Fence and contract-anchor re-hash

All four recorded anchors resolve **byte-identically** at IRR `main`; no fence was edited or "fixed".

| IRR path | Recorded Git blob | Remote blob at `main` | Raw SHA-256 | Bytes | Match |
|---|---|---|---|---|---|
| `frontend/server/user-portfolio-transport.ts` | `51704c12a467cd2f718a030b5036bc55c9afa73f` | `51704c12a467cd2f718a030b5036bc55c9afa73f` | `515acaae95cdf1d41c72ca040fbbc855ccb28da16a6b2122c1c1ad2225573bb0` | 2,716 | **true** |
| `frontend/server/owner-context-unavailable.ts` | `cb8db45d668d28cee7e0a52721001d579a872733` | `cb8db45d668d28cee7e0a52721001d579a872733` | `57e397d44e2a1e2e2c0d5a456a1ad419d5a5728e4a76aaa73bf71d10a164a913` | 684 | **true** |
| `frontend/server/user-portfolio/userPortfolioContract.ts` | `e6b57bb8a021d8eb4b9b7572d12affc7de66be0b` | `e6b57bb8a021d8eb4b9b7572d12affc7de66be0b` | `15568224c49f09bb5728831e0e9c7faeee58687b9299470e0c9bd8f8f0a12d4e` | 31,585 | **true** |
| `frontend/server/reports-transport.ts` | `981470541812a64c733309f1debec75455d85bee` | `981470541812a64c733309f1debec75455d85bee` | `3601c49be344443fe769bf6a22ad35b55644e9bbaef62cd6b2a9039234d6f5b6` | 2,763 | **true** |

No mismatch existed, so no STOP on fence integrity was triggered. A future rendered act may name a change;
this packet does not.

### 1.4 Package pins and manifests

The two IRR dependency references match the recorded assessment. Neither is floating; both commits are
fully reachable ancestors of IPD `main`.

| Role | Pinned commit | Tree | Ancestor of IPD `main` | Current guard |
|---|---|---|---|---|
| Primary `iips-production-market-data` | `2d9130e76bb0dc89daeefabaf297e27bdaa84250` | `4658699180ef161aae3c1b33d3946e918d6fb9b2` | **yes** | exact 40-hex pin + subpaths in `brokerImportPackageConsumer.test.ts` |
| Alias `iips-broker-import` | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` | `cc0f0117822850f9046e9a51bd05c1d45f80cd57` | **yes** | **no dedicated pin guard**; it feeds `build:broker-import` and every pre-hook |

IRR manifest blobs at `main`: `frontend/package.json` `6274537a81e1496189e629c7e8f371f80144dfec`;
`frontend/package-lock.json` `05ade78c40ac40626c678f3531266049a0e83555`; package-consumer guard
`frontend/server/broker-import/brokerImportPackageConsumer.test.ts` `1af0294fe483d652329791bcbb7814ed88cf3c2d`.
No package file was changed or re-pinned in this pass; no silent pin change occurred.

### 1.5 No rendered DQ act exists

Both authorities are still at the assessment's reference tips. There is no effective DQ-1…DQ-7 act in
either repository, no new H-12 adoption, no provisioning store, no QE execution and no report of either.
Open PRs #42/#204 are not acts and are not treated as decisions. Track B and Track C therefore stop at
the authority boundary recorded here.

---

## 2. Authoritative register mapping — G / I / Q / A

The assessment's shorthand is reconciled to the effective records rather than carried forward as labels
without meaning. In this packet:

| Label | Meaning | What closes it |
|---|---|---|
| **G** | Governance / authority: a rendered, merged, green, remotely read-back PA decision is required | exact act text on `main`; no implementation substitutes for it |
| **I** | Implementation / integration: code, tests or documentation under an already-rendered bounded act | merged PR + green exact-head and post-merge CI + remote blob read-back |
| **Q** | Qualification / execution: evidence must be produced on the designated host at designated pins with raw capture | immutable execution receipt; Linux/CI/fixtures never substitute |
| **A** | Acceptance / admission: a separate PA acceptance or admission act over produced evidence | criterion-by-criterion act naming run, pins and digests; never inferred from Q or green CI |

### 2.1 CAP03-P01 … P12

| Anchor | Current authoritative state | Label | Next condition / why the old split is not reused |
|---|---|---|---|
| **P01 = DR-1** | **CLOSED as authority.** Gate A′ successor act effective; bounded entrypoint published | G/I — complete | The capability-matrix statement "PROPOSED — NOT EFFECTIVE" is a preserved point-in-time 2026-10-23 line, not current state |
| **P02** identity values | **CLOSED.** Effective S1 determination + binding commit + PR #80/#81 receipts | G/I — complete | Values are not re-opened, restated, copied or inferred in this packet |
| **P03** entrypoint/validator/tests | **COMPLETE.** Bounded file set published; focused suite green | I — complete | Do not allocate a duplicate implementation item |
| **P04** P-1 provisioning execution | **NOT EXECUTED.** Authority effective; identity-value blocker discharged; host/store absent | **Q** (not G) | Needs DQ-4/5-confirmed order, reachable host, PA-designated non-existent absolute store, V-A2 receipt |
| **P05 = DR-2** | **UNRESOLVED** — 7 absent fields + 3 renames; adapter honestly refuses | **G → I** | DQ-1 render; then exact implementation manifest; no Gate 5 read pair while open |
| **P06 = DR-3** | **UNRESOLVED** — `durability`/`durable` absent on detail | **G → A** | DQ-2 render; final emitting/claim decision remains with P10 acceptance |
| **P07 = DR-4r** | IPD schema half **CLOSED** (migration `004`); consumer half **UNRESOLVED** | **G → I** | DQ-3 render; mapping-or-scope-out; QE-6 scope fixed |
| **P08** Gate 4 / freeze | Gate 4 act **EFFECTIVE**, Limb A merged, but final QE pins not designated; H-12 **NOT ADOPTED**; R2 stale | **G + Q, partial** | DQ-4/5 + rendered freeze manifests + separate adoption; old "no effective Gate 4 act" and "NOT AUTHORIZED" text is superseded |
| **P09** QE-1…QE-11 | **0 executed / 0 pass / 0 fail / 11 blocked** | **Q** | Execution only after pinned freeze, adopted H-12, P-1 receipt, host preflight |
| **P10** result acceptance | Not rendered; nothing to accept | **A** | Separate acceptance after QE, criterion by criterion |
| **P11 = CV-52** Gate 5 | Not granted / not initiated | **A** | Separate admission naming accepted commits and route/method pairs |
| **P12** fence lift | Not authorized | **I** | Only after P11, exactly the admitted pairs; unadmitted pairs remain `503` |

**DR family reconciliation.** DR-1 is discharged by the effective successor act plus S1 binding; DR-2 =
P05; DR-3 = P06; DR-4r = P07 with its schema half already closed. No DR item is dropped or duplicated.

### 2.2 O-01 … O-12

| Anchor | Mapping | Current treatment |
|---|---|---|
| **O-01** CAP-03 owner-data read path | umbrella over P04–P12 | not separate work; P04/P05/P06/P07/P08/P09/P10/P11/P12 carry it |
| **O-02** Gate 4 host qualification | P08/P09 + DQ-4/DQ-5 | Gate 4 is **AUTHORIZED — NOT STARTED**, not unauthorized; 0/11 |
| **O-03** durable broker-import boundary | separate W-1/U6 write-slice chain | not a DR-2 read-contract item; no write may be enabled here |
| **O-04** D115 boundary | DQ-7 (second question) / CV-43 | retain-unwired / retire / fold are PA choices; no consumer exists |
| **O-05** Reports | DQ-7 (first question) / CV-21, CV-51 | independent of CAP-03; fence `98147054…` stays |
| **O-06** G24 / CV-52 admission | P11 | G24 remains reference-only; no lineage promotion |
| **O-07** TD-7a / TD-7b / F6 | DQ-7 (F6 part) **plus a hard split** | F6 inventory authorization is a discrete PA question; **TD-7b is production and out of this non-production packet** |
| **O-08** dual IPD package pin | DQ-6 (second question) | primary guarded; alias unguarded; no silent re-pin |
| **O-09** runbook drift | routine IRR documentation follow-up | not a PA decision and not implemented here; no IPD artifact substitutes for an IRR edit |
| **O-10** PR #204 closure | routine IRR administrative disposition | PR #204 is superseded, not a merge candidate; left open and untouched this pass |
| **O-11** D05 widening | CV-22 deferred by Option C | not reopened; 13-row universe preserved |
| **O-12** no-path rows | rows 8, 14, 16, 21, 23, 29, 33, 40, 41, 44, 51; row 34 as-is | **all remain closed/deferred/OOS**; row 34 remains correct `503` behaviour, not work |

### 2.3 CV anchors and the two material relabellings

| Anchor | Classification | Note |
|---|---|---|
| **CV-21** Reports disposition | **G — DQ-7** | independent gate; no longer treated as a by-product of portfolio work |
| **CV-43** D115 runtime without consumer | **G — DQ-7** | no authorized completion path today; universal Company-identity authority is barred by D-2 |
| **CV-51** Reports functional enablement | **I/Q/A downstream of CV-21** | not separately startable; do not duplicate as a new DQ |
| **CV-52** portfolio/persistence lineage admission | **A — P11 / Gate 5** | **not a Reports item**; G24 stays reference-only |
| **CV-24 / F6 / TD-7b** | split | F6 is DQ-7; `TD-7b` remains deferred production policy and is **not** authorized or claimed |

**Relabelling record (authoritative record followed):**

1. **P04 moves from G to Q.** The successor act and the S1 determination supply the authority and values.
   What remains is an executed host receipt, not another identity decision.
2. **P08/O-02 no longer say Gate 4 is unauthorized.** The effective Gate 4 act exists and Gate 4 is
   `AUTHORIZED — NOT STARTED`. What remains is freeze/sequencing, H-12 adoption and host execution.
3. **P07/DR-4 is not "no columns exist".** Migration `004` is effective; only the CAP-03 consumer policy
   remains open.
4. **O-07 splits F6 from TD-7b.** Conflating them would import a production data-directory decision into
   non-production work and is prohibited here.
5. **CV-52 is not Reports.** It remains Gate 5 portfolio admission; Reports is CV-21/CV-51 only.

---

## 3. Decision sequence and the stop boundary

The work is separable but not order-free. The recommended dependency order is:

1. **PA renders DQ-1, DQ-2 and DQ-3** (they may be one instrument with separable answers, or three).
2. **PA renders DQ-4 and DQ-5** only once the selected DQ-1…DQ-3 implementation surface is known; DQ-4
   designates the final freeze point, and DQ-5 confirms host/operator/store.
3. **Implementation (Track B1)** exactly per rendered manifests → typecheck/build/full test/package
   consumer/focused regressions → PR → exact-head CI → `--merge` → remote read-back.
4. **Freeze (Track B3)**: designate final IPD QE pin and IRR consumer pin verbatim; regenerate H-12 under
   amended §8; publish as **CANDIDATE**; do not adopt.
5. **Track B4** only for a rendered disposition of PR #42 / Reports / D115.
6. **Track C** only with a real host, store and operator; preflight → host test → PA adoption → single P-1
   → QE, in the DQ-4-confirmed order.
7. **Acceptance and admission** remain separate P10/P11 acts. C3 is unreachable until then.

**Stop condition reached by this pass.** No DQ act has been rendered, so B1/B3/B4 cannot start; the
designated host is unavailable, so C1 cannot start. This packet and the readiness packet are the furthest
authorized products. They do not consume or reserve any future authority.

---

## 4. DQ-1 — DR-2: G2 read-contract closure

### 4.1 Question

Which v1 provider/consumer change closes the frozen G2 read-envelope gap without fabricating a value:
the seven absent fields (`weightSumPercentage`, `provenanceDigest`, `isSaved` on summary; `isSaved` on
view; `totalMarketValue`, `provenanceDigest`, `holdingsCount` on revision entry), the three renames
(`holdingsCount → totalHoldingsCount` on summary/view; `committedAt → createdAt` on revisions), the
`isSaved` lifecycle, and the adapter mapping authorization?

### 4.2 Evidence

- IRR `userPortfolioContract.ts` blob `e6b57bb8…` requires the fields; IRR `ipcPortAdapter.ts` blob
  `7881185e2975139db6d0574a07ddccf829b08eb6` records the gap in `V1_TO_G2_ENVELOPE_GAP` and refuses
  with `UPSTREAM_UNAVAILABLE` rather than fabricating.
- IPD already stores every value needed at the current revision: `portfolio_revisions` carries
  `total_market_value`, `weight_sum_percentage`, `holdings_count`, `provenance_digest`, `operation`,
  `content_digest` and `created_at` (migration `001` blob `f594a182…`, unchanged).
- IPD `PortfolioSummary` deliberately omits three values in its list projection; `PortfolioDetail`
  carries `weightSumPercentage` and `provenanceDigest`; `RevisionEntry` carries `committedAt` but omits
  the other three.
- `isSaved` has no current provider field. It must be defined by the act; it may not be inferred from
  `revision > 0` or merely from a non-empty holding list (both were expressly rejected in the prior DR-2
  analysis).

### 4.3 Options

| Option | Decision | Consequences | Recommended? |
|---|---|---|---|
| **A** | Add the seven values to v1 provider results from the existing revision row; expressly authorize the three IRR renames; keep the frozen G2 type names and every other frozen interface unchanged; define `isSaved` on the current revision's operation | No schema/migration change; no duplicate G2-named provider fields; IPD and IRR conformance tests become executable; `e6b57bb8…` remains byte-identical; full read mapping becomes possible once a binding exists | **Yes** |
| **B** | Add duplicate G2-named fields IPD-side (`totalHoldingsCount`, `createdAt`, etc.) alongside the v1 names | Two names for one value; larger wire shape; consumers can diverge; contract ambiguity survives | No |
| **C** | Replace the frozen G2 family with a new consumer contract | Largest blast radius; re-opens unrelated Reports/G24-era types; requires its own migration/acceptance chain; no evidence it is necessary | No |
| **D** | Leave unresolved and keep refusal | Honest today, but Gate 5 cannot admit any read pair and QE-1/3/4/5 read-backs cannot be consumed | No |

### 4.4 Recommended field semantics (Option A, if and only if rendered)

These are proposed mappings for the act to adopt verbatim or amend. They are not effective.

| G2 field / shape | Proposed source and rule |
|---|---|
| summary/view `totalHoldingsCount` | exact rename of v1 `holdingsCount`; no recomputation |
| revision `holdingsCount` | current `portfolio_revisions.holdings_count` for that revision |
| revision `totalMarketValue` | `portfolio_revisions.total_market_value` for that revision |
| revision `provenanceDigest` | `portfolio_revisions.provenance_digest` for that revision |
| revision `createdAt` | exact rename of v1 `committedAt`, stored as `portfolio_revisions.created_at` |
| summary `weightSumPercentage` | current revision's `weight_sum_percentage`; no re-derivation from floating-point UI weights |
| summary `provenanceDigest` | current revision's `provenance_digest`; empty string is a **stored fact** for an empty INITIAL revision, not a fabricated G2 value |
| summary/view `isSaved` | **current-revision materialized-state rule (recommended):** `true` iff the current revision operation is `MERGE` or `REPLACE`; `false` for `INITIAL` and `RESET`; tombstoned/missing/foreign remains `RESOURCE_UNAVAILABLE` with no field emitted. Never inferred from revision number or non-empty holdings. PA may choose an alternative "ever-saved" rule, but must state it explicitly; the adapter may not choose for itself |
| absent/null | every field above is non-nullable on the wire for an available portfolio. A missing/null/non-finite provider value is a contract-envelope violation → refusal, never a default |
| historical revisions | historical list entries carry that revision's stored values; `isSaved` is not added to `G2RevisionEntry` because the frozen type does not require it |
| `durability` / `durable` | **not part of DQ-1**; no value is added or changed. DQ-2 governs them |

### 4.5 Proposed implementation manifest if Option A is rendered

| Repository | Path | Change |
|---|---|---|
| IPD | `src/persistence/portfolio_store.ts` | project the current revision's `weight_sum_percentage`, `provenance_digest` and operation into summary/detail; expose revision total value, provenance and count; define `isSaved` only per the act |
| IPD | `tests/q1_ipc_read_contract_conformance.test.ts` | assert all ten shape requirements, `INITIAL`/`MERGE`/`REPLACE`/`RESET`/tombstone `isSaved` cases, historical revision values, empty INITIAL provenance as stored, and refusal on absent/null/malformed values |
| IRR | `frontend/server/user-portfolio/ipcPortAdapter.ts` | remove the unconditional envelope-gap refusal; map only the ten authorized fields; keep every caller-authority and failure mapping unchanged |
| IRR | `frontend/server/user-portfolio/ipcPortAdapter.test.ts` | assert exact mapping, no fabricated/default values, `UPSTREAM_UNAVAILABLE` on any missing field, and unchanged refusal vocabulary |

No new source file is required, so the freeze `dist/**` count remains measurable at `1,140` unless the
rendered act says otherwise. If both DQ-1 and DQ-3 are approved, the two IRR files are shared: the acts
must land as one coordinated change or as explicitly sequenced increments, never as duplicate work.

### 4.6 Non-grants

No `durable` value, write enablement, binding, profile, route admission, fence lift, G24 reuse or
contract replacement is authorized by DQ-1. A rendered DQ-1 act is implementation authority only for the
manifest it names.

---

## 5. DQ-2 — DR-3: `durability` / `durable` on `PortfolioDetail`

### 5.1 Question

What may `portfolio.get` say about durability before Gate 4 result acceptance: keep both fields absent,
introduce a different non-claiming vocabulary, or defer to the acceptance act and then emit measured
values?

### 5.2 Evidence

- Contract v1 §6 lists both fields; IPD `PortfolioDetail` omits both; the conformance suite asserts their
  absence. A full-conformance claim is therefore currently limited to ten of twelve detail fields.
- `DurablePortfolioStorePort` declaring `durability:'DURABLE'` is a capability declaration, not a
  per-operation commit measurement and not a wire value.
- Gate 4 act Q10 permits recording **measured** values in a named run at a named commit and prohibits a
  product `durable:true` claim before acceptance. Gate E W-11 applies the same boundary.
- A SQLite-backed store makes `durable:false` a **false statement about the store**, and no lawful
  positive value exists before measurement/acceptance.

### 5.3 Options

| Option | Decision | Consequences | Recommended? |
|---|---|---|---|
| **A** | Keep both fields absent now; record the conformance claim as "ten of twelve detail fields"; defer any emitting/claim decision to P10 result acceptance; no `durable:true` anywhere before it | Honest interim posture; no code or contract risk; QE-4 remains a measurement under the fixed non-claim sentence | **Yes, interim** |
| **B** | Introduce a third non-claiming literal or nullable field through a contract minor revision | Requires changing both sides and every consumer assumption; still cannot claim durability; scope growth without evidence | No |
| **C** | Emit `durable:true` / `'DURABLE'` now because the store is SQLite | Prohibited: capability is not commit evidence; no acceptance exists; would create an unauthorized product claim | **Not available** |
| **D** | Emit `durable:false` now because the UI adapter is session-only | Prohibited as a statement about a durable store; conflates the session UI with the Gate 3 store and would be false | **Not available** |

### 5.4 Recommended act language

If Option A is rendered, the act should state: no provider or consumer field is added; every conformance
record using this surface is limited to ten of twelve detail fields until a further act; QE-4 records the
measured result with the Gate 4 fixed non-claim sentence; no `durable:true` product claim, production
eligibility or `TD-7b` implication exists; the final disposition is reserved to P10 and cannot be supplied
by DQ-2 itself.

### 5.5 Manifest

No implementation change under Option A. Any Option B or later emitting act requires a separately
rendered exact manifest and cannot inherit this packet's recommendation.

---

## 6. DQ-3 — DR-4r: `G2Contribution` consumer compatibility and scope

### 6.1 Question

How should the CAP-03 consumer handle the frozen `G2Contribution` shape, which requires non-null
`sourceBroker`, `fileName`, `contentDigest`, `lineageDigest`, `importedAt`, `holdingsCount` and
`totalMarketValue`, when IPD's effective migration `004` projection exposes the five provenance fields as
**nullable** historical facts and does not store `holdingsCount`/`totalMarketValue` as contribution
columns?

### 6.2 Evidence

- IPD schema half is **CLOSED**: migration `004_portfolio_contribution_provenance` blob `6bad5a50…`
  adds six nullable provenance columns; historical rows remain `NULL`; broker-import writers supply the
  six on new rows; the read projection returns them as nullable plus `amount`, `semantics`,
  `contributionId`, `contributedAt`, `createdAt`.
- `amount` is currently written as the import's total market value, but no act fixes that as the G2
  `totalMarketValue` source. `holdingsCount` is not stored on a contribution row and cannot be inferred
  safely from the current portfolio revision or from a timestamp join.
- Any non-null default, backfill, zero or omission would be fabrication. The current adapter correctly
  refuses rather than guessing.
- QE-6 (lineage identity after restart and after REPLACE/RESET) has no defined consumer scope until this
  question is decided.

### 6.3 Options

| Option | Decision | Consequences | Recommended? |
|---|---|---|---|
| **A** | **Fail-closed consumer scope:** map an empty contribution list truthfully; if any contribution exists, refuse `portfolio.get` with `UPSTREAM_UNAVAILABLE` until its full G2 shape is provably available. Do not add a schema column, backfill, default or infer counts. QE-6 remains a **limitation for contributed portfolios**, never a pass | No migration or `dist` change; no fabrication; full `portfolio.get` is limited to zero-contribution portfolios, so Gate 5 must not claim contributed-read support; QE-6 cannot be counted as PASS | **Yes for current non-production scope** |
| **B** | **Full mapping via a new additive contribution linkage** (e.g. nullable stored count/value/revision fields) with historical NULL rows refused; new rows populated atomically | Restores full contribution mapping later, but adds files/migrations, raises the freeze `dist/**` count above `1,140`, requires a fresh freeze designation and separate schema act; not implementable under the current fixed freeze arithmetic without PA re-designation | Only with an explicit freeze re-designation |
| **C** | **Scope contributions out of Gate 5 by contract revision** with an explicit omitted/unsupported marker, never a silent empty array | Requires changes to both consumer contract and scope; avoids refusal but narrows the admitted read; must be stated in Gate 5 and QE-6 | Alternative, not recommended now |
| **D** | Infer `holdingsCount`/`totalMarketValue`, default NULL to zero/empty, or backfill history | **Prohibited** — fabricated values and invented lineage | **Not available** |

### 6.4 Recommended act language and manifest

Under Option A: no IPD source or schema change is required; the IRR adapter/test enforce refusal when a
non-empty contributions array cannot satisfy every required G2 field, map only a genuinely empty array,
and document that QE-6 is scoped to component lineage and is a limitation for contributed-read mapping.
Exact files: `frontend/server/user-portfolio/ipcPortAdapter.ts` and
`frontend/server/user-portfolio/ipcPortAdapter.test.ts`, coordinated with DQ-1. No migration, no new
source file, no `dist` count change. The existing nullable IPD projection and migration `004` remain
untouched.

If the PA instead requires full contributed-read mapping, Option B or C must be rendered as its own act
with a new freeze point; it cannot be smuggled into DQ-1.

---

## 7. DQ-4 — freeze and H-12 sequencing

### 7.1 Question

Which order does the PA adopt among: final pin/freeze designation, H-12 candidate generation and
validation, native-Windows canonical `npm test`, the separate H-12 adoption act, the single P-1
provisioning execution, and QE-1…QE-11 — and which effective act text is amended if the chosen order
departs from the current Gate 4 S1→S2→S2a→S3→S4 chain?

### 7.2 Evidence and conflict

- Effective Gate 4 act: S1 provisioning → S2 Limb A/canonical Windows test → S2a H-12 regeneration and
  separate adoption → S3 host preflight → S4 QE. The S1 identity blocker is now discharged but P-1 is
  **not executed**.
- Effective Gate A′ act §8 defines its own read-only preflight and requires a **single** execution whose
  authority is consumed on success **or** failure. A re-attempt needs a fresh PA act.
- H-12 R2 is measurably stale after the S1 binding commit: three post-G3 entries and ten `dist` files
  changed. It is **NOT ADOPTED** and cannot be used.
- The amended §8 arithmetic is fixed: **32 mandatory IPD + 1 conditional helper + 24 IRR = 56 core**;
  **7** post-G3 entries separate; **1,140** `dist/**` from a fresh build; **empty** deposit set at
  candidate time.
- No final IPD QE pin can exist before the selected DR implementations are merged. No final IRR consumer
  pin can be designated before any selected IRR consumer change is merged.
- The proposition that a host canonical test could run before the irreversible P-1 is **not** effective
  text today; adopting it requires an express amendment, not an inference from this packet.

### 7.3 Options

| Option | Sequence after DQ-1…DQ-3 are implemented and merged | Amendment / consequence | Recommended? |
|---|---|---|---|
| **A** | Designate final pins → regenerate/validate H-12 candidate → host read-only preflight → native-Windows canonical `npm test` → **separate H-12 adoption act** → single P-1 → QE | Requires express amendment of Gate 4 S1/S2/S2a ordering; places the irreversible P-1 after repository/test/adoption evidence while keeping all QE after provisioning. Strongest protection against consuming P-1 on a disproven freeze | **Yes** |
| **B** | Designate final pins → candidate → preflight → canonical test → P-1 → adoption → QE | Also requires amendment; adoption occurs after one-shot execution, so a candidate failure discovered at adoption leaves a provisioned store under an unadopted manifest | No |
| **C** | Preserve current text exactly: P-1 → canonical test → candidate/regeneration → adoption → final preflight → QE | No amendment, but consumes the single P-1 before the host canonical test and before a candidate exists at the final execution commit; any test/candidate failure cannot be recovered without a fresh PA act | No for this pass |
| **D** | Defer freeze/H-12/host entirely | No technical progress; CAP-03 cannot qualify or be admitted | Valid only as an explicit PA deferral |

### 7.4 Freeze constraints that bind any option

- The final IPD pin and IRR consumer pin must be recorded **verbatim** as commit + tree before any host
  action. No future SHA is guessed here.
- Any non-documentary drift after designation is a **STOP** requiring PA re-designation.
- Candidate validation must verify per entry commit/tree/path/blob SHA-1/raw SHA-256/byte length/line
  endings; absent entries recorded as absent; any mismatch stops.
- H-12 adoption is a **separate** act. Publication of a candidate, a green CI run, or this packet does not
  adopt it.
- The candidate's `dist/**` set must be freshly built and independently verified. If a selected DR act
  changes the count from `1,140`, the PA must designate a new count and this packet's arithmetic cannot be
  reused.
- QE cannot begin until provisioning and adoption are complete in the chosen order.

---

## 8. DQ-5 — host, operator and store confirmation

### 8.1 Question

Does the PA confirm `desktop-no0nhtp` / the non-elevated operator account as the execution host, and what
**exact absolute P-1 store path**, IPC endpoint/local-state configuration and operator identity govern the
single run?

### 8.2 Evidence

- Effective Gate 4 and Gate A′ acts designate `desktop-no0nhtp`, Windows 11 Home Single Language, the
  non-elevated operator account, `win32`, Node `>=22.13.0 <23`, and flag-free `node:sqlite`. No runtime
  installation/switch is authorized.
- From this Linux sandbox, `ping desktop-no0nhtp` returns `Name or service not known`. The sandbox is
  Linux / Node `v22.22.3`; it is **not** the host and cannot produce any host evidence.
- No P-1 store path has ever been selected; no store file exists anywhere in the repository; no endpoint
  is designated; `IIPS_G3_IPC_BINDING_PROVISIONED` is unset and must not be enabled as a workaround.
- The PA act can **designate** a host; only the operator's raw preflight can **prove** the host state.

### 8.3 Options

| Option | Decision | Consequences | Recommended? |
|---|---|---|---|
| **A** | Confirm the existing host/operator and render the exact store path, endpoint/local-state configuration and operator identity; require fresh raw preflight before use | Proceeds only when the host becomes reachable; no runtime change; one execution preserved | **Yes, conditional on the PA naming every value** |
| **B** | Designate a different real host/operator/store by express amendment | Requires complete new host facts and a new preflight; old authority cannot be stretched to a different host | Alternative |
| **C** | Defer host execution; readiness only | No provisioning/QE; CAP-03 stays blocked at P04/P09 | Valid fallback |

**The PA must supply, and this packet does not propose:** the exact absolute store path; confirmation of
host edition/account; the IPC endpoint or local-state directory; the raw-evidence capture location outside
every worktree; and confirmation that no runtime installation will occur. A placeholder, relative path,
temporary fixture path or synchronized folder is not acceptable execution input.

### 8.4 Non-grants

Host designation is not technical proof. No QE item, provisioning, adoption, endpoint service, write,
`IIPS_G3_IPC_BINDING_PROVISIONED` flag, H-12 promotion or production claim follows from DQ-5.

---

## 9. DQ-6 — PR #42 disposition and dual package pin

### 9.1 First question: PR #42

**Evidence.** PR #42 is a draft, `DIRTY/CONFLICTING`, head `afa43090…`, 22 files `+5,137/−0`. Its head is
not an ancestor of `main`; `main` is not an ancestor of its head. It duplicates the Gate 3 surface that was
subsequently accepted through PR #41 and successor acts. A green check on its old head is not authority.

| Option | Decision | Consequences | Recommended? |
|---|---|---|---|
| **A** | Close PR #42 as **superseded and unmerged**, recording that its branch is not a basis for any work | Administrative only; no code/fence/pin change; removes an apparent merge candidate | **Yes** |
| **B** | Leave open with an explicit "not a candidate / do not merge" annotation | Preserves the branch but leaves recurring ambiguity; no technical progress | Acceptable fallback |
| **C** | Merge or rebase it as-is | **Prohibited** — conflicting, outside an effective act, duplicates accepted work | **Not available** |
| **D** | Build a new candidate from its head | **Prohibited** as a base; any future change must start from current `main` under a fresh act | **Not available** |

No PR #42 action is executed by this packet. The rendered disposition must be merged and read back before
Track B4 acts.

### 9.2 Second question: the dual IPD pin

**Evidence.** The primary dependency is exactly pinned and guarded at `2d9130e7…`. The alias
`iips-broker-import` is exactly pinned at `70b24f02…` but has no dedicated guard; it feeds
`build:broker-import` and all pre-hooks. Both are full-history ancestors of IPD `main`; this is a
reproducibility/consistency gap, not a reachability failure. The alias is the admitted DB-C1 preview basis,
so moving it silently would change an admitted preview.

| Option | Decision | Consequences | Recommended? |
|---|---|---|---|
| **A** | **Guard both existing pins independently** in the package-consumer test; no package move | No dependency change; preserves DB-C1 basis; makes the second pin reviewable and prevents accidental drift. Changes IRR test only (plus evidence record) | **Yes** |
| **B** | Re-pin the alias to the primary pin or a newly designated IPD commit | Large dependency movement for the admitted preview; needs full diff/qualification and a new preview acceptance; cannot be smuggled in as hygiene | Only after separate qualification |
| **C** | Retire the alias and the DB-C1 preview | Product-scope change requiring its own disposition; not a dependency-hygiene substitute | No for this pass |
| **D** | Leave the alias unguarded | Recurring silent-drift risk; no evidence that it is intentional | No |

**Proposed Option A manifest if rendered:** IRR
`frontend/server/broker-import/brokerImportPackageConsumer.test.ts` — add a second expected 40-hex
constant and lockfile/`package.json` assertion for the alias; keep both pre-hooks untouched; assert three
subpaths and guard both pins separately; evidence record in IRR. No `frontend/package.json` or lockfile
change. Verify no IPD source change. If the PA selects B/C, the act must name its own full manifest and
fresh qualification.

### 9.3 Administrative O-09/O-10

The runbook drift (O-09) and PR #204 closure (O-10) are routine IRR documentation/administrative items,
not PA decisions in this packet. They were not edited from IPD; no IPD record is a substitute for an IRR
edit. PR #204 remains open and unmerged; neither PR #204 nor PR #42 is a base for any branch.

---

## 10. DQ-7 — Reports / D115 / F6

These are separable. None is a dependency of the identity/binding/P-1 path, and none authorizes a UI,
route, fence lift, identity authority or user-data inventory.

### 10.1 Reports — CV-21 / CV-51

| Option | Decision | Consequences | Recommended? |
|---|---|---|---|
| **A** | Retain the current `REG-11` Option C deferral with a dated reason; no Reports code/UI/route work; fence `98147054…` stays | CV-21/CV-51 remain deferred/blocked, not complete; no scope expansion | **Yes** |
| **B** | Record Reports out of the v1 product surface set, retaining the fence as appropriate | Closure by disposition; no build; must be reflected in tracker and docs | Alternative |
| **C** | Commission bounded first-party Reports design | New scope; requires R1 ownership source, R2 contract shape, then separate R3 admission and F-7 qualification incl. restart durability; branch-only tests never authorize merge | Not recommended now |
| **D** | Merge/port a branch lineage (`4906a6b`, `6a8afbb`) | **Prohibited** as evidence of authority | **Not available** |

No Reports path currently exists on IRR `main`; `4906a6b` is an ancestor of `main`, `6a8afbb` is not. No
IPD persistence or Reports implementation is to be copied into IRR.

### 10.2 D115 — CV-43

`frontend/server/d115-runtime.ts` blob `d9b546c941b17b3c4a34b68724bf89e6da821f91` and its test
`51bd4f68203e53163c41830d9a966a01bb1d2f4d` exist on IRR `main`; the only non-test reference is none.
The runtime has no consumer and D-2 keeps identity authority domain-scoped.

| Option | Decision | Consequences | Recommended? |
|---|---|---|---|
| **A** | Record **retain-unwired / non-product** with a dated disposition; no route, no consumer, no identity authority, no code change | Resolves the open disposition without pretending integration exists; D115 C/D remain unresolved for product use | **Yes** |
| **B** | Retire the runtime and test through its own bounded act | Removes speculative code; requires exact manifest and qualification; more work than the current need | Alternative |
| **C** | Fold into a specific domain-scoped consumer/route | New product scope; requires an ownership source, contract, identity authority and admission; cannot be inferred from the existing file | Not recommended now |
| **D** | Revive universal Company identity/tenant administration | **Prohibited** by D-2/H-18 and outside this non-production scope | **Not available** |

### 10.3 F6 inventory — and the TD-7b hard exclusion

`F6_INVENTORY_AUTHORIZED` remains **UNDECIDED**. It concerns inventory/inspection of owner data or runtime
journals; it is not the same question as `TD-7b`. `TD-7a` local data-directory behaviour is established;
`TD-7b` is a **production** data-directory/deployment profile and is **not authorized, not requested and
not claimable** in this packet.

| Option | Decision | Consequences | Recommended? |
|---|---|---|---|
| **A** | Leave F6 **UNDECIDED**; perform no inventory, inspection, listing, scan or access to user data/journals; keep TD-7b deferred and out of scope | No user-data exposure; CAP-03 path is independent; no evidence is manufactured | **Yes** |
| **B** | Render a later bounded non-production F6 inventory act naming exact directory, operator, read-only fields, redaction, retention and publication boundary | Would require a separate act and operator execution; no migration, deletion, reassignment or production decision; cannot be inferred from this packet | Alternative only |
| **C** | Treat F6 as a CAP-03/qualification prerequisite | **Not supported** by the authoritative records; would add a blocker without a decision | No |
| **D** | Authorize TD-7b or production data-directory work here | **Prohibited** — production scope and expressly excluded | **Not available** |

No F6 inventory was performed. No user data, runtime journal, owner carrier or store was read.

---

## 11. Decision sheet — separable PA answers requested

The PA may render one instrument or several. Each answer is independent; none is inferred from another.

| Item | PA answer required | If not rendered |
|---|---|---|
| **DQ-1 / DR-2** | Option A/B/C/D; if A, confirm or amend the field semantics, especially the `isSaved` lifecycle | CAP-03 reads remain refused; no implementation |
| **DQ-2 / DR-3** | Option A/B; C/D are not available; confirm ten-of-twelve interim claim and no `durable:true` | Full-conformance claim remains unavailable; no code |
| **DQ-3 / DR-4r** | Option A/B/C; if B/C, name the separate schema/contract act and new freeze implications | `portfolio.get` mapping and QE-6 scope remain undefined |
| **DQ-4** | Option A/B/C/D; if A/B/C, state the exact amended Gate 4 ordering and final pin designation rule | No freeze, candidate, host run or QE |
| **DQ-5** | Option A/B/C; if A/B, name host, operator, exact absolute store, endpoint/local-state and raw-evidence location | No P-1 and no QE |
| **DQ-6** | PR #42: A/B; dual pin: A/B/C. C/D unavailable where marked | PR #42 remains open; alias remains unguarded |
| **DQ-7** | Reports: A/B/C; D115: A/B/C; F6: A/B/C | Reports/D115/F6 remain open/deferred; no related work |

A "defer" answer must itself be rendered if it is to move a register status; commentary in this packet
does not.

---

## 12. What this packet does and does not establish

**Establishes:** the current coordinates, receipt and fence integrity; the authoritative label mapping;
the decision-ready options, evidence, recommendations, consequences and implementation manifests for
DQ-1…DQ-7; the exact boundary at which Track B and Track C stop.

**Does not establish:** any PA determination; any implementation, freeze, pin, H-12 adoption, provisioning,
store/row/binding, host preflight, QE result, acceptance, admission, write, fence lift, production
eligibility, `durable:true` or `TD-7b`. No identity value is restated, copied, derived or selected here.
No IRR file, branch, commit, issue, comment or PR was created or modified.

*End of `IIPS-V3-CAP03-PA-DECISION-PACKET-DQ1-DQ7-2026-10-24-01`. PROPOSED — NOT EFFECTIVE.*
