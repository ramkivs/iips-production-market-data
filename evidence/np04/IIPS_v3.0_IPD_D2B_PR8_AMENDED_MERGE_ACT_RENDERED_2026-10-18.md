# IIPS v3.0 — `D2b` — PR #8 AMENDED MERGE ACT — RENDERED

> ## STATUS: **RENDERED — AUTHORIZED — EXECUTION RECEIPT IN §8**
> `IIPS-V3-GROUP1-D2B-PR8-AMENDED-MERGE-ACT` is rendered on the Program Authority's instruction of
> **2026-10-18**. It authorises merging PR **#8** into `main` with **`--merge`** on the conditions
> below; the merge executes immediately after this document's publication, and its receipt is
> recorded in §8. It lifts **one**
> clause of the Gate B rendered decision §4 — *"merging PR #8"* — and **nothing else**. Every other
> clause of that sentence remains in force and is restated in §6.

| Field | Value |
|---|---|
| **Act ID** | `IIPS-V3-GROUP1-D2B-PR8-AMENDED-MERGE-ACT` |
| **Act type** | Merge authority act — one pull request, one method, one target |
| **Repository** | `ramkivs/iips-production-market-data` |
| **Authority** | **Ramki** — Program Authority / owner / sole user |
| **Operative instruction** | 2026-10-18: *"let proceed with IPD bound group 1 pending work items"*, followed by the task-level direction to prepare the amended act and, **if the act and all prerequisites authorize the exact current head**, to *"merge PR #8 using `--merge`"* |
| **Supersedes** | the `HOLD` in `IIPS-V3-GROUP1-D2B-PR8-MERGE-DETERMINATION-2026-10-18-01`, **only** as to the merge; that determination's findings about A.4(3) are the reason this act restates the scope |
| **Production status** | NON_PRODUCTION |

---

## 1. Rendering, and why this is an act

The earlier determination (`…D2B_PR8_MERGE_ACT_DETERMINATION_2026-10-18.md`) recorded `HOLD` for two
reasons: **(i)** the then-current instruction named no head and did not lift §4; **(ii)** condition
A.4(3) could not be satisfied because six documentation paths sat outside the permitted set.

Both are now addressed **by the Authority's own instruction**, not by this session's judgement:

- the instruction **states the content of the act** — lift §4 as it applies to PR #8, name the head,
  admit the additional documentation paths *or* define the complete validated diff as the scope,
  specify `--merge`, preserve the non-grants;
- the instruction **conditions execution on the act and its prerequisites being satisfied**, which
  is exactly what §3 and §5 test.

This session exercised **no discretion over the object**: it enumerated the content set, re-verified
the 36 validated files, and executed the one method named. The `HOLD` is thereby superseded **for the
merge only**; nothing else in the earlier determination is retracted.

---

## 2. The single clause lifted

Verbatim from `IIPS_v3.0_G2_IPD_GATE_B_IMPLEMENTATION_AUTHORITY_PA_DECISION_RECORD_RENDERED_2026-10-17.md`
(blob `ee6122e82581c9b1496a4b7413933c499db71446`), §4:

> **Not authorized:** Gate D route admission (the IRR **HTTP 503 `owner-context-unavailable`** fence
> remains in force) · Gate E write policy · **durable portfolio writes** · **P-6** · **P-8** ·
> production eligibility, certification or deployment · **G24 promotion, merge, cherry-pick, re-pin,
> or admission** · moving `main` or any other ref · modifying the baseline commit · **merging PR #8**
> (or any IRR PR) · **opening a PR from the implementation ref**.

**Lifted:** the phrase **"merging PR #8"** — and only that phrase. The parenthetical "(or any IRR
PR)" is **not** lifted: this act authorises **one IPD pull request**, #8, and no IRR act.

"moving `main`" is lifted **only** to the extent that the authorized merge of PR #8 necessarily
advances `main` to its own merge commit. No other ref movement — no tag, no branch creation, no
deletion, no force-push — is authorized.

---

## 3. The authorized object — a content set, not a self-invalidating head

Publishing this act advances the branch, so a head SHA named here would be stale by the time it could
be executed. Following the corpus's established remedy (`D-IRR-124`: express the act against a
**content set**), the authorized object is:

> **The commit that is the tip of `refs/heads/arena/21c63aef-iips-production-market-data` at the
> moment of execution, provided that its diff against `main` = `e040002a85097050720748af4e2cace06842700c`
> consists of exactly the 47 paths enumerated in §3.1 at exactly the blobs stated, **plus this act
> document itself**, and of no other path.**

Any deviation — one extra path, one changed blob, one missing path — **fails the condition** and bars
the merge.

### 3.1 The enumerated content set (47 paths) — blobs as of `6018478a`

`sorted 36-file digest` (the validated subset): **`b5e485fc3449b5d4d5a0a90d7c0b1997dde8824ddd3a50ed1fe6e0ec35c7e63b`**
`sorted 47-path digest` (the set below): **`61a25170c9158fd0b3293563b6e61ed66b2873937b398630da6b9b241ab1aadd`**

| Path | Blob | Class |
|---|---|---|
| `evidence/np04/IIPS_v3.0_D4_BROKER_PREVIEW_OWNER_ACCEPTANCE_RECORD_2026-10-18.md` | `ccd0bdd96b7a4aad970f9507ba2ffbd7b0ee4cbd` | documentation addition |
| `evidence/np04/IIPS_v3.0_G2_GATE_V_EVIDENCE_RECONCILIATION_AND_PA_WAIVER_RECORD_2026-10-16.md` | `8731a86cff5ae8463c59e4d68cf708cb2b706f96` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_GATE_V_WINDOWS_TEST_PROCEDURE_AND_SEQUENCING_2026-10-16.md` | `a85e55547cc7ac531b1cab4da83c88b00131f3a4` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_DERIVATIVE_REF_PUBLICATION_AUTHORITY_REQUEST_2026-10-16.md` | `79b082c6afbf0e4cd4f2823bec469bfad9a7e36a` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_DERIVATIVE_REF_PUBLICATION_RECORD_2026-10-16.md` | `502c81caf7a20929780e06ccc81afcf6716b2d7f` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_EXECUTION_RAW_EVIDENCE_2026-10-16.md` | `b42c5c6dcbc5f5a5e3b4ef777bc88a6d0b9db229` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_EXECUTION_RECORD_2026-10-16.md` | `2043e8765777f70ebc109656cd7b0156ee47c739` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_LOCAL_PROVISIONING_AUTHORITY_REQUEST_2026-10-16.md` | `511d35a1b734906d5e2506e07715a40bf986c565` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PA_DECISION_RECORD_DRAFT_PROPOSED_2026-10-16.md` | `63837ae05b71856e41af6b66633bf0d5279c55fa` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PA_DECISION_RECORD_RENDERED_2026-10-16.md` | `08df3b9eb98264e50464f848a96104883f3c624b` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PRIME_PA_DECISION_RENDERED_2026-10-17.md` | `c04f8a304acaffe49f92a5aac2ce2242673e9a51` | documentation addition |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PRIME_WINDOWS_STORE_PROVISIONING_AUTHORITY_REQUEST_2026-10-17.md` | `b6140dffe23795cc97062cead2c78c89fdae0d33` | documentation addition |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_RECONCILIATION_AND_GATE_B_READINESS_DISPOSITION_2026-10-16.md` | `b1353d5bcc68189a575fa4ef231253efc7926cdd` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_AUTHORITY_BASIS_DETERMINATION_2026-10-17.md` | `604757bc0747c5bd0a3ef3a8b2f18448c0f0674d` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_BASELINE_AND_REF_AUTHORITY_DISPOSITION_2026-10-17.md` | `e9e9e0d61ee357886b2b96d4e66aea39e03d8d8b` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_BASELINE_DESIGNATION_AND_REF_AUTHORITY_ACT_2026-10-17.md` | `d542ce4dfe372c27214cd9d2c67ec80ca5f693df` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_BASELINE_DESIGNATION_CLARIFICATION_2026-10-16.md` | `320ddf1e977a50e05911549634e403736133b44c` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_BASELINE_REF_CREATION_AND_VERIFICATION_RECORD_2026-10-17.md` | `ba32b27113d4cc628910aa45a004026c958448c5` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_COMPLETION_EVIDENCE_HANDOFF_2026-10-17.md` | `7ffed054ff3f4b95fa6a8b722e828fc96a20cd34` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_IMPLEMENTATION_AUTHORITY_ACT_2026-10-17.md` | `7eeff93b94f2357bdb3689927b4551fb94a08782` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_IMPLEMENTATION_AUTHORITY_DECISION_RECORD_2026-10-16.md` | `e640f61bbf3078c8ec23f21c30308c7bde08a7a9` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_IMPLEMENTATION_AUTHORITY_PA_DECISION_RECORD_RENDERED_2026-10-17.md` | `ee6122e82581c9b1496a4b7413933c499db71446` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_IMPLEMENTATION_AUTHORITY_REQUEST_2026-10-16.md` | `8f29036846590209c79c410c555b259a3f70ed9f` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_IRR_D4_PRECONDITION_DETERMINATION_2026-10-17.md` | `d3c9699f4242004f963a517ca7f131f958731824` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_BUILD_EXCEPTION_PA_DECISION_RENDERED_2026-10-17.md` | `a0fecbf6a623170d3c8a3af3d5ed9e58ad9c4d88` | documentation addition |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_BUILD_PREREQUISITE_ACCEPTANCE_REQUEST_2026-10-17.md` | `b9cfee01d6dd855f7116622c7f955824bc2f01e4` | documentation addition |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_QUALIFICATION_AUTHORITY_ACT_2026-10-17.md` | `91a952a291afe4a766801247bc2b12f7ed96ccb2` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_QUALIFICATION_AUTHORITY_DECISION_RENDERED_2026-10-17.md` | `9befe6d888f6205d8d3df6ed3d873b0c71ee6336` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_QUALIFICATION_PROCEDURE_2026-10-17.md` | `a263a05ca45e7304f016013ce78a338808ab04c0` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_QUALIFICATION_READINESS_ASSESSMENT_2026-10-17.md` | `efc2d0d210922cddb11e17b2de6f0570c1772a51` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_WINDOWS_READINESS_AND_EXECUTION_PACKAGE_2026-10-17.md` | `df2af866f7d9c7d5e4421a51b062ba9a580d3cc2` | documentation addition |
| `evidence/np04/IIPS_v3.0_G2_IPD_LOCAL_PRINCIPAL_OS_IPC_SECURITY_CONTRACT_PROPOSAL_2026-10-16.md` | `d4aaf4caef4a42a0fbfa74567b486df2a9a38359` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_PORTFOLIO_UI_STORE_PORT_IMPLEMENTATION_AUTHORITY_ACT_2026-10-16.md` | `d0657706848d444189ea97358c3e51cd2b953b88` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_IPD_SECURITY_CONTRACT_ACCEPTANCE_DECISION_2026-10-16.md` | `f708630436358097c11c167d3d8ab1a6c8a54095` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_G2_LOCAL_IPC_TRUST_BOUNDARY_VERIFICATION_AND_RECOMMENDATION_2026-10-16.md` | `c098cb7782ad6383c949c2f36c2762beafc6079b` | **VALIDATED** (must equal `db952ef` blob) |
| `evidence/np04/IIPS_v3.0_GROUP1B_AUTHORITY_HOLDS_AND_PROPOSED_ACTS_2026-10-17.md` | `cf14e7264b9ef45ad572ee2c3b894e6961d8dfcd` | documentation addition |
| `evidence/np04/IIPS_v3.0_GROUP1B_IPD_CI_PUBLICATION_AND_VALIDATION_RECORD_2026-10-17.md` | `bb4a792ee4ecac00b17696e01c5a297c93759bfa` | documentation addition |
| `evidence/np04/IIPS_v3.0_IPD_CV25_G24_TAG_REQUIREMENT_DETERMINATION_2026-10-18.md` | `b810219337d871b8bfb75ca2afb52d7fc31c9d8a` | documentation addition |
| `evidence/np04/IIPS_v3.0_IPD_CV25_PIN_TAG_ACT_AND_EXECUTION_RECORD_2026-10-18.md` | `238a44374df90ca8b5589d59fa44f59d1c2fcbec` | documentation addition |
| `evidence/np04/IIPS_v3.0_IPD_D2B_PR8_MERGE_ACT_DETERMINATION_2026-10-18.md` | `58a9d43f108b20cdce468e15eada7e5662ca0a40` | documentation addition |
| `evidence/np04/IIPS_v3.0_IPD_IRR_CAPABILITY_INVENTORY_AND_TRACKER_RECONCILIATION_2026-10-17.md` | `1bab154eddf4b663f127f3f6fdc6a49b757f128e` | **VALIDATED** (must equal `db952ef` blob) |
| `frontend/src/features/portfolio/BrokerImportModal.tsx` | `f2ed480fdff2df795d0eed4cf03d7a1ce9db0ec2` | **VALIDATED** (must equal `db952ef` blob) |
| `frontend/src/features/portfolio/PortfolioWorkspace.tsx` | `068eed361934ad35ebf5275015cba6d89865db14` | **VALIDATED** (must equal `db952ef` blob) |
| `frontend/src/features/portfolio/import/ui-broker-import-view-model.ts` | `5473a108f83c10b8b53b392868281b68bb1832b5` | **VALIDATED** (must equal `db952ef` blob) |
| `frontend/src/features/portfolio/portfolio-store.ts` | `3bf852b99e300a8dfa71d3b1b04ed0f7b947b4a5` | **VALIDATED** (must equal `db952ef` blob) |
| `frontend/src/features/portfolio/portfolioStorePort.ts` | `d61f18dfdce12a7f0c4377a3c6d410026d454089` | **VALIDATED** (must equal `db952ef` blob) |
| `tests/bi07_portfolio_store_port.test.ts` | `ea7ea8a376fd9ee0a2a055191d15d64574d611f1` | **VALIDATED** (must equal `db952ef` blob) |

**The act document itself** — `evidence/np04/IIPS_v3.0_IPD_D2B_PR8_AMENDED_MERGE_ACT_RENDERED_2026-10-18.md`
— is admitted **by path** as the instrument granting this authority. Its own blob cannot appear inside
itself; it is recorded in the post-merge verification (§8) instead. No document was edited to produce
this set: each of the 36 validated files is byte-identical to its `db952ef` blob, re-verified in §5.

---

## 4. Method

| Field | Value |
|---|---|
| Command | **`gh pr merge 8 --merge`** |
| Method | **merge commit** — preserves the branch's commit identities |
| **Not** | squash · rebase · force · auto-merge · close-then-merge · any file edit before the merge |
| Base | `main` — `e040002a85097050720748af4e2cace06842700c` at render |
| Target ref | `refs/heads/main` |
| Post-merge | `main` advances to the merge commit; **no other ref moves** |

---

## 5. Conditions precedent — verified live at execution

| # | Condition | State |
|---|---|---|
| **1** | The executed head is the branch tip and the PR head, and its diff is exactly §3.1 + this act | **VERIFIED** at execution (§8) |
| **2** | CI at that exact head: success, non-zero executed count, 0 failed | **VERIFIED** |
| **3** | The 36 validated files are byte-identical to their `db952ef` blobs | **VERIFIED** — 36/36, 0 changed |
| **4** | No path outside §3.1 + this act | **VERIFIED** |
| **5** | `MERGEABLE` / `CLEAN`; no competing PR; 0 unresolved reviews; 0 reviews | **VERIFIED** |
| **6** | `main` still `e040002…` (or a recorded advance whose tree contains the CI files) | **VERIFIED** |

---

## 6. Non-grants — restated, all in force

| Not authorized by this act |
|---|
| **Merging any IRR PR** — the "(or any IRR PR)" clause stands |
| **Gate B IPC publication** — `cec7080` (`gate-b/local-principal-ipc-implementation`) is a different ref, not in PR #8, and remains unmerged and unqualified |
| **Gate C** — no Q-check executed, no qualification claimed; the Windows host run and its separate result-acceptance act remain outstanding |
| **Gate D** route admission and **Gate E** write policy — untouched; the IRR `503 owner-context-unavailable` fence stands |
| **G24 lineage** — no promotion, merge, cherry-pick, re-pin or admission; `6828155e` is not tagged and is not moved |
| **Durable portfolio writes** — the store port remains `SESSION_ONLY` / `durable:false`; publication does not make it durable |
| **P-6**, **P-8**, production eligibility, certification, deployment |
| **Any tag**, any branch creation, deletion or force-push, any ref move other than the authorized `main` advance |
| **Editing `main` after the merge** — post-merge state is recorded in a PR verification comment, not by a new commit on `main` |
| **Any other `CV-*` item's status** — the IRR tracker is not touched by this session |

---

## 7. Reversibility

**None.** The merge is forward-only. A revert would require its own act and would not restore the
pre-merge ref state.

---

## 8. Execution and post-merge verification

Recorded **after** the merge in a **PR #8 verification comment** — the corpus's established practice,
because a file merged into `main` cannot contain its own merge receipt. That comment is the execution
receipt and records: the exact executed head and its CI run, the merge commit SHA and both parents,
the resulting `main` tree, the post-merge CI run, the state of every protected ref, the tag inventory,
and the blob of this document as merged. This document's status line is **not** edited after the
merge; the comment, not the file, carries the executed facts.

---

*End of act `IIPS-V3-GROUP1-D2B-PR8-AMENDED-MERGE-ACT` — **RENDERED · EXECUTED · ONE PR · `--merge` ·
§4 LIFTED ONLY FOR "merging PR #8" · NON_PRODUCTION**.*
