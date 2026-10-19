# IIPS v3.0 — IPD Provenance and Eligibility Program Authority Decision

| Field | Value |
|---|---|
| **Record type** | Program Authority decision — operative governance record (publishes approved semantic dispositions) |
| **Record identifier** | `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-PROGRAM-AUTHORITY-DECISION-2026-10-19-01` |
| **Decision authority** | **Program Authority (Ramki)** — IPD security-contract / qualification authority for `ramkivs/iips-production-market-data`; capacity identified in `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PRIME_WINDOWS_STORE_PROVISIONING_AUTHORITY_REQUEST_2026-10-17.md` §Decision-maker required, `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_BUILD_PREREQUISITE_ACCEPTANCE_REQUEST_2026-10-17.md` §Decision-maker required, `evidence/np04/IIPS_v3.0_D4_BROKER_PREVIEW_OWNER_ACCEPTANCE_RECORD_2026-10-18.md` (owner = sole user) |
| **Status** | **APPROVED BY PROGRAM AUTHORITY** |
| **Approval** | **Explicitly granted by the Program Authority.** The Program Authority's standing global and implicit one-pass authorization applies to routine, in-scope investigation, documentation, testing, committing, publication, remote verification, and corresponding tracker updates. This one-pass authorization is applicable to routine in-scope publication and verification of this already-approved decision. |
| **Date (publication)** | `2026-10-19` (Asia/Kolkata) — actual publication date, recorded via traceable Git commit and pull-request evidence (see §8) |
| **Repository** | `ramkivs/iips-production-market-data` (IPD) |
| **Authoritative baseline verified before publication** | `origin/main` at `02a5803145cf215083caf80f54ba1ac458e1682c` — Merge PR #26 `test(d05): characterize identity/eligibility integrity gaps; add PA decision request` (2026-10-19T16:45:49Z) |
| **Originating decision request** | `evidence/cross-repository/IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_AUTHORITY_DECISION_REQUEST_2026-10-19.md` — `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-DECISION-REQUEST-2026-10-19-01` |
| **Evidence review** | `evidence/cross-repository/IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_DECISION_REVIEW_2026-10-19.md` — `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-DECISION-REVIEW-2026-10-19-01` — evidence synthesis of Findings A–D, published with this decision as traceable provenance |
| **Existing work items touched** | `CV-22` (IRR — preserved as **OPTION C — DEFER EXPANSION PENDING DEFINED PREREQUISITES**, §5); internal gap labels `IPA-05`, `IPA-06`, `IPA-07`, `IPA-09`, `IPA-10`, `IPA-11`, `IPA-12` (assessment-local, not authoritative work items). **No new `CV-` identifier created.** |
| **Related IRR disposition** | IRR `CV-22` Option C — see §5; IRR 13-row governed sector-reference behaviour preserved |

> **Operative statement.** This record publishes the Program Authority's approved semantic dispositions C1–C7 for IPD provenance and eligibility. The approval settles the **semantic governance direction** described in §2–§4. **This decision does not itself grant production implementation authority** — no source, contract, schema, D05 data, manifest, configuration, UI08, historical-descriptor, AIIL, or consumer integration change is authorized by this record alone (see §6). **No additional approval is required to publish this already-approved decision or to complete its routine verification and tracker reconciliation** — the standing global and implicit one-pass authorization covers the documentation-only publication workflow.

---

## 1. Approval and publication mechanics

1. **Approval is explicit and already granted.** The Program Authority approved the C1–C7 dispositions described in §2. This record publishes that approval; it does not request it.
2. **No re-approval checkpoint is introduced.** The workflow proceeds through completion in one pass — publication, CI verification, commit/push, pull-request and merge, remote verification, and tracker reconciliation — without returning another draft instead of executing.
3. **No personal signature, identity credential, cryptographic attestation, or approval timestamp is invented.** Approval is recorded in the repository's established governance format: this dated record on `main`, with traceable evidence (starting `main` SHA, PR number, merge commit SHA, CI run, and post-merge `git ls-remote` verification in §8).
4. **Historical records are preserved.** The originating decision request and evidence review remain intact and linked above. No rewrite of history, force-push, or bypass of required checks is performed. An unmerged branch is not treated as authoritative.

---

## 2. Approved dispositions C1–C7

Each disposition is recorded individually. Scope is preserved exactly as approved; no disposition is broadened by inference.

### C1 — Record-origin classification

**Disposition: APPROVED — Prohibit unsupported `REAL` assertions.**

- IPD must not assert that a record is real-market, synthetic, or otherwise classified as `REAL` when it lacks authoritative evidence sufficient to support that assertion. Corpus inclusion, identifier-format validity (including ISIN structure/check digit), successful `companyId` resolution, and deposition authorization (manifest `recordCount`/`fileChecksumSha256`/`authorizationRef`) do **not** independently prove real-market status.
- Where evidence is insufficient to support a real-market classification, that condition must remain representable as **unresolved or unknown** under a future authorized implementation contract. The exact field name, property, enum value, type name, and presentation for that state are **not selected or frozen by this decision** — the decision confirms the semantic requirement; vocabulary selection requires a separate implementation contract.
- Current resolver behaviour that emits `REAL` as a literal for every record is **not validated by this decision** and is not carried forward as an approved assertion. Replacement semantics require separate implementation authority (§6).

**Scope preserved:** This disposition addresses whether a real-market classification may be asserted and that unknown must be representable. It does not name a schema, field, enum, or type, does not create a roster, and does not itself change resolver or UI08 behaviour.

### C2 — Classification evidence

**Disposition: APPROVED — Require independently verifiable, record-specific evidence tied to governed revision.**

- Each classification must be supported by **independently verifiable, record-specific evidence** tied to the relevant instrument identity, effective period where applicable, and governed corpus revision. Evidence must be attributable to a specific instrument identity (e.g., `companyId`/`ISIN` + effective dates where material) and to a specific governed corpus revision (manifest revision/checksum), not to an aggregate narrative.
- **Licensing and market-data entitlement** (commercial vendor entitlement, NSE or other redistribution rights) are kept **separate from real-market identity**. Entitlement does not prove that an instrument is real-market; identity does not prove entitlement.
- The reported `52/2,198` split (source-reported composition note in `BLOCK-3L-BROKER-CSV-FULL-RESOLUTION-AUDIT.md` and `IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md` §25) is **not** treated as authoritative record-level truth. It is a reported composition observation, not a per-record governed attestation. No roster or classification may be derived by inference from that aggregate statistic.
- The ISIN check digit / contract regex does not discriminate real from synthetic, and no D05 row field currently carries provenance or classification (§2.2 of the decision request). These facts are preserved.

**Scope preserved:** This disposition states the evidence standard that future `REAL` (or any origin classification) must meet. It names no approved evidence instance, creates no roster, and authorizes no re-deposition.

### C3 — Semantic separation

**Disposition: APPROVED — Keep provenance, record-origin classification, data quality, and consumer eligibility distinct.**

- **Provenance** (where a record came from and which governed revision was resolved), **record-origin classification** (what evidentiary class the record belongs to), **data quality** (how complete/current the descriptor is), and **consumer eligibility** (whether a consumer may use the record for a specific purpose) are **four distinct concepts**.
- An IPD producer assertion about the corpus (e.g., a provenance or classification field on a resolved record) must **not** become a universal consumer-admission decision. No `quality`, `sourceClassification`, `dataVersion`, or `lineageDigest` value may be reused as proof of eligibility. No producer classification silently admits a consumer.
- This separation follows from `PHASE2-EVIDENCE-PAYLOAD-FORENSIC-REPORT.md` §10.3 (governed attestation standard) and preserves the cross-repository consumer contract's distinct eligibility concerns.

**Scope preserved:** Distinctness is established as a semantic invariant. No schema, enum mapping, or consumer admission is introduced.

### C4 — Missing or unsupported descriptors

**Disposition: APPROVED — Prohibit silent substitution as source-confirmed fact.**

- When available evidence is insufficient, the system must **not** silently substitute values and represent them as source-confirmed facts.
- Missing, invalid, or unsupported descriptor values (including but not limited to `faceValue` / `currency` as characterized in `tests/d05_identity_eligibility_characterization.test.ts` CHAR-B-01/02/03) must **not** receive an unsupported `GOOD` assertion. The current resolver fallback (`faceValue ?? 1`, `currency ?? 'INR'`, hard-coded `GOOD`) is **not** approved as a factual representation.
- The **exact validation, representation, error, and presentation behaviour** for insufficient-evidence descriptors (e.g., unknown sentinel, typed rejection, quarantine, degraded quality with disclosure vs. silent default) remains subject to a **separate implementation contract**. This decision prohibits silent substitution; it does not select the replacement representation or wording.

**Scope preserved:** Prohibits silent default-as-fact with `GOOD`. Does not select a replacement value, quality literal, anomaly code, field name, or UI wording, and authorizes no resolver or contract change.

### C5 — Non-production display

**Disposition: APPROVED — Permit bounded non-production / offline-bootstrap display subject to honest disclosure and no unsupported `REAL` assertion.**

- Synthetic or incompletely classified records may be displayed in the **bounded non-production / offline-bootstrap** context (operator-drop / `OFFLINE_BOOTSTRAP` / `LOCAL_FIXTURE_AND_OFFLINE_DEV` operating mode as recorded in `src/identity/governed_fixture_master.ts` and `evidence/operator_drop/d05_security_master_manifest.json`), **subject to honest disclosure** and **without** an unsupported `REAL` assertion.
- No individual record classification may be inferred from the reported aggregate corpus composition. The `52/2,198` statistic does not label any specific row as `REAL` or `SYNTHETIC`.
- The **precise UI wording, labelling, badge, banner, and any UI08 changes** require **separate implementation authority**. Honest disclosure is approved as a semantic requirement; the exact text is not frozen here.

**Scope preserved:** Allows bounded non-production display with disclosure; does not authorize any UI08 change, label text, or operating-mode promotion.

### C6 — Producer and consumer responsibilities

**Disposition: APPROVED — Adopt producer-scoped IPD assertions with consumer-scoped eligibility and admission.**

- IPD publishes **producer-scoped** assertions about the corpus: what the corpus is, where the resolved record came from, which governed revision was resolved, and (when evidenced under C2) what origin class is attributable. IPD does **not** publish a universal consumer-admission decision.
- Each consumer capability (IRR portfolio, PIT, engine adapters, any future consumer) makes its **own** eligibility and admission decision within its own boundary and under its own authority. A record eligible for one consumer boundary may be ineligible for another (e.g., engine-scoring coverage, PIT `securityId` distinctness).
- Distinctions between **D05 company identity** (`companyId` `EQ_*_IN`), **IRR identity** (`canonicalSecurityId` / governed row identity), **PIT security identifiers** (`securityId` = `ISIN:<isin>:<series>` series-qualified), and **series-qualified market-data identity** are preserved. No namespace collapse or cross-boundary identity equivalence is introduced by this decision.

**Scope preserved:** Establishes responsibility split (producer vs. consumer). Does not define any consumer admission contract, roster, or identity mapping.

### C7 — Consumer-subset admission

**Disposition: APPROVED — Retain the strict evidence and authorization gate. No real-only subset admitted.**

- The **strict evidence and authorization gate** is retained: a real-only consumer subset requires the full chain set out in the IRR `CV-22` record (§3.1–3.5) — identity/eligibility contract, approved roster bound to an exact corpus revision and checksum, exact IRR identity mapping, explicit consumer acceptance criteria, and repository-specific implementation authority. **No element is waived.**
- **No real-only subset is admitted by this decision.** No roster is approved, no consumer is admitted, and no integration is activated.
- The proposed `CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` remains a proposal and its execution is **not made mandatory** by this decision.
- This disposition is separate from and in addition to C1–C6.

**Scope preserved:** Gate retained; no admission granted. Implementation scope for any future probe remains separately authorized.

---

## 3. Preservation of IRR CV-22 Option C

**Preserved disposition: `CV-22` remains `OPTION C — DEFER EXPANSION PENDING DEFINED PREREQUISITES`.**

- This decision **does not reopen, replace, narrow, or broaden** IRR `CV-22` Option C.
- The IRR decision record at `docs/integration/IIPS_v3.0_CV22_OPTION_C_PA_DECISION_2026-10-19.md` §3.1 (prerequisite 1: authoritative identity and eligibility contract; do not derive eligibility from a display label or resolver classification) remains the controlling IRR prerequisite, and that prerequisite remains **DEFERRED** — it is not satisfied by this IPD semantic decision.
- The IRR master tracker §16 entry for `CV-22` and any PKG-04 references are **not** retargeted to a different option by this record.
- The proposed `CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` is not made mandatory.

**Verification of non-interference:** At this record's preparation, IPD `origin/main` at `02a5803145cf215083caf80f54ba1ac458e1682c` and the IRR read-only inspection note in the decision request (`IRR main@ad008e45e64f15e895043bd2c554a7c93a4c2dc1`) both record `CV-22` as deferred. This IPD decision adds no IRR file and changes no IRR behaviour.

---

## 4. Preservation of IRR existing behaviour

- IRR's **existing 13-row governed sector-reference behaviour** is preserved. The 13 rows are sector references (sector names as `canonicalSecurityId` in the reference portfolio), not instrument identities. Existing `404 governed-row-not-found` behaviour for instruments not represented in that sector reference set is preserved.
- **No widening of the D05 universe** is performed or implied (no expansion of the 2,250-row `BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001` deposition beyond its governed scope).
- **No cross-repository integration** is initiated (no IRR adapter, route, or mapping is added or changed by this IPD decision).

These are preserved without relaxation; a future widening or integration would require its own authority acts in the owning repositories.

---

## 5. Additional approved integrity boundaries

These constraints are recorded as part of this decision and are operative in the same sense as C1–C7:

1. **Historical descriptors.** Effective-dated identity resolution (`IdentityMappingStore` `UTIBANK`→`EQ_AXISBANK_IN` with `effectiveFrom`/`effectiveTo` windows, as characterized in `CHAR-C-01` `[APPROVED INVARIANT]`) does **not** prove historical descriptor correctness. A historical `asOf` that correctly resolves a `companyId` may still return the **current snapshot** descriptor. Historical descriptor versioning (asOf-scoped descriptor / payload history) is a **separate capability** requiring its own scope decision and implementation authority; it is not authorized here. Until separately authorized, the system must not claim that a descriptor is historically correct merely because its identity mapping is time-aware.

2. **AIIL inconsistency.** The AIIL dual-BSE mapping inconsistency (manifest `RULING_3_DUAL_EFFECTIVE_DATED_MAPPING` vs. `d05_security_master_manifest.json` / `d05_browser_runtime_hydration_report.md` wording vs. corpus `EQ_AIIL_IN` `2015-01-01` with no `effectiveTo` and concurrent duplicate BSE `543989`/`539177` mappings, as characterized in `CHAR-D-01` `[OBSERVED INCONSISTENCY — UNRESOLVED]`) must **not be resolved by guessing which source is wrong**. Obtain **authoritative BSE listing-history evidence** before deciding whether to correct corpus effective dates or to revise manifest/report wording. **No AIIL data mutation** (corpus row edit, manifest `aiilRuling` rewrite, re-deposition, or mapping change) is authorized by this decision.

3. **D05 corpus.** **No** universe expansion, classification roster creation, schema change, manifest change, or re-deposition is authorized here. The governed corpus remains `src/identity/d05_broad_universe_data.ts` (2,250 entities) under `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001`, manifest `BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001` `fileChecksumSha256: 7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5`, `recordCount: 2250`. Any future corpus change requires a separate governed-data authority act with a new manifest and checksum.

4. **UI08 and resolver.** **No** production resolver, descriptor-default, quality, classification, or UI repair is authorized by semantic approval alone. The resolver's current literals (`sourceClassification: 'REAL'`, `quality: 'GOOD'`, `dataVersion: 'v1.0.0-sec-master'`, `replayConstraintApplied: false`, faceValue/currency fallback) and UI08's current `Source Classification` rendering remain as observed behaviour until a separate implementation act explicitly replaces them. Semantic approval (C1–C7) is not a blanket implementation act.

5. **Consumer integration.** **No** IRR, PIT, portfolio, or other consumer admission or integration is authorized by this decision. IRR `/api/user-portfolios*` remain outside this decision's scope; PIT `securityId` distinctness is preserved; no adapter or route is added.

6. **Qualification.** **Characterization-test results do not constitute product acceptance, qualification, consumer admission, or production readiness.** `tests/d05_identity_eligibility_characterization.test.ts` (8 tests: `CHAR-A-01/02`, `CHAR-B-01/02/03`, `CHAR-C-01/02`, `CHAR-D-01`) remain **observations of present behaviour** (marked `[OBSERVED DEFECT — UNRESOLVED]` / `[OBSERVED INCONSISTENCY — UNRESOLVED]` / `[APPROVED INVARIANT]` / `[OBSERVED — CONTROL]`), not an implicit acceptance contract. CI passing does not qualify any D05, resolver, or consumer capability for production.

---

## 6. Implementation-authority boundary

Approval of C1–C7 is approval of the **semantic governance direction**. It is **not** a blanket implementation act.

- **No production repair is implemented as part of this publication task.** No change to `src/transports/object_resolver.ts`, `src/contracts/d05_security_master.ts`, `src/identity/*`, `frontend/src/features/security-master/SecurityMasterSurface.tsx`, `src/ui/view_models/ui08_security_master_modal.ts`, or any other source/config/schema file is made in this record.
- **No D05 mutation** (data, schema, manifest, or re-deposition) is performed.
- **No UI08 or resolver repair** (default policy, quality literal, classification literal, historical descriptor behaviour, AIIL mapping) is performed.
- **No IRR / consumer integration** is performed.
- A **subsequent implementation act** may be prepared and progressed **only within the bounds of authority actually granted** by this decision. Such an act, under the standing global and implicit one-pass authorization for routine in-scope work, must identify: the applicable authoritative baseline commit SHA on `origin/main` (exact, not a floating label), the **permitted** changes (bounded file set), the **exclusions** (what is explicitly not authorized), the **required tests**, and the **acceptance evidence**. Implementation permission must not be inferred from this semantic approval.
- Routine **preparation of implementation planning and planning evidence** is in scope as documentation; **actual production changes** listed above remain blocked pending the required implementation authority.

---

## 7. Tracker / decision-register reconciliation

| Register | Action in this pass | Evidence |
|---|---|---|
| IPD decision register (`evidence/cross-repository/`) | This decision record added as operative entry; originating decision request and evidence review preserved and linked in header | Files: `IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_AUTHORITY_DECISION_REQUEST_2026-10-19.md`, `IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_DECISION_REVIEW_2026-10-19.md`, `IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_PROGRAM_AUTHORITY_DECISION_2026-10-19.md` |
| IPD authoritative tracker (capability inventory) | **No unrelated status rewritten.** The tracker `IIPS_v3.0_IPD_IRR_CAPABILITY_INVENTORY_AND_TRACKER_RECONCILIATION_2026-10-17.md` and any derived register entry are additive only: the provenance/eligibility rows may reference this decision; existing `CV-22` / capability rows are not re-graded from this decision. | Reconciliation §8.1 (tracker stale note) still applies; this record does not fabricate tracker implementation status |
| IRR `CV-22` | **Unchanged.** Preserved as Option C per §3; no IRR tracker mutation performed from IPD session | §3 verification note; §8 remote verification |

This reconciliation is additive and bounded: it records the approved and published decision without rewriting unrelated statuses or promoting any capability to implemented/qualified.

---

## 8. Verification, checks, and publication facts

*Post-merge remote verification is recorded here after the governance workflow completes. Pre-publication verification is recorded in the subsection below; post-merge verification will be updated via the standard post-merge remote-evidence reads.*

### 8.1 Pre-publication verification (recorded before PR)

| Check | Result |
|---|---|
| Remote `main` fetch | `git fetch origin main` → `origin/main` at `02a5803145cf215083caf80f54ba1ac458e1682c` (current at publication time; matches review baseline §0.1) |
| Decision request present on `main` | `git show origin/main:evidence/cross-repository/IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_AUTHORITY_DECISION_REQUEST_2026-10-19.md` — 268 lines, identifier `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-DECISION-REQUEST-2026-10-19-01` |
| Evidence review linked | `evidence/cross-repository/IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_DECISION_REVIEW_2026-10-19.md` — identifier `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-DECISION-REVIEW-2026-10-19-01`, 565 tests referenced |
| Baseline build/typecheck | `npx tsc --noEmit` — 0 errors (baseline) |
| Baseline tests | `npm test` (`node scripts/run-tests.mjs`, guarded) — **565 tests / 88 suites: 565 pass, 0 fail** (test-guard: not zero; build emitted) |
| Documentation change scope | Additive `evidence/cross-repository/*.md` only; no `src/`/`frontend/`/`tests/`/`evidence/operator_drop/` mutation in this commit (verified via `git diff --stat`) |

### 8.2 Post-publication verification (to be recorded after merge)

| Field | Value (filled after merge) |
|---|---|
| Publication PR | To be recorded: PR number, head SHA, base `main` SHA at PR creation |
| PR CI | To be recorded: `verify` job result, `executed test count` check |
| Merge commit / new `main` | To be recorded: `git ls-remote origin refs/heads/main` post-merge SHA |
| Post-merge `main` CI | To be recorded: `verify` job result on new `main` head |
| Decision record presence on `main` | To be recorded: `git show <new-main>:evidence/cross-repository/IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_PROGRAM_AUTHORITY_DECISION_2026-10-19.md` identifier verification |
| Review record presence on `main` | To be recorded: same for `…_DECISION_REVIEW_2026-10-19.md` (if published together) or arena-branch SHA linkage |

> **Note:** The standing one-pass authorization that permitted this publication covers the routine verification reads above. Post-merge remote verification will confirm that the decision record is present on authoritative `main`; the CI `executed test count` check confirms the documentation-only change did not degrade the build.

### 8.3 Scope and result

- **Documentation only.** No source, test, dependency, route, persistence, runtime, D05/manifest, UI08, or configuration file changed in the publication commit(s).
- **No Git ref other than the documentation PR branch and its merge to `main` moved** as part of the authorized publication.
- **IPD fences preserved:** portfolio persistence `SESSION_ONLY` / `durable: false`; no off-`main` promotion; no durable write.
- **IRR fences preserved:** `/api/user-portfolios*` HTTP `503`; no admission.
- **No qualification, admission, route activation, fence lift, or production release is claimed.**

---

## 9. Reference preservation

- Existing authoritative decisions and records are preserved: `IIPS_V3_G3_D0_DISPOSITION_2026-10-18.md` (G3-D0 resolved; re-author basis on `main`), `IIPS_V3_G2_IPD_IRR_PORTFOLIO_CONSUMER_CONTRACT_V1_2026-10-18.md` (consumer contract v1), `PHASE-F3-UI08-SECURITY-MASTER-FUNCTIONAL-AUTHORITY-ACT.md` / `PHASE2-EVIDENCE-PAYLOAD-FORENSIC-REPORT.md` §10.3 (forensic standard), and all `evidence/np04/` Gate A/B/C records.
- This decision does not amend any prior PA act beyond stating the C1–C7 semantics. Any future implementation act must explicitly name the baseline and may not rely on a floating `main` label.
- The decision request's blocked-work table (§4 of the request) remains accurate: actual production changes listed remain blocked pending the separate implementation authority described in §6.

---

*End of Program Authority decision. No implementation authority granted by this record alone.*

**Publication agent:** Arena Agent Mode — recording and publishing the Program Authority's approved dispositions under the standing global and implicit one-pass authorization for routine documentation, testing, committing, publication, and verification. No authority is rendered or inferred by the agent beyond the Program Authority's explicit approval recorded above.
