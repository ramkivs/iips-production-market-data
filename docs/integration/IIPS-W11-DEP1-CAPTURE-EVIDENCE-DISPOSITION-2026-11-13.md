# Snapshot-to-Live W11 Dependency 1 — capture evidence review and disposition

**Date:** 2026-11-13
**Workstream:** Snapshot-to-Live only (single-user, locally hosted Windows laptop application for personal use).
**Governing plan:** [`IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md`](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md) (this repository).
**Supersedes in fact:** [`IIPS-W11-DEP1-ACTUAL-OWNER-BOUND-PORTFOLIO-EVIDENCE-2026-11-13.md`](IIPS-W11-DEP1-ACTUAL-OWNER-BOUND-PORTFOLIO-EVIDENCE-2026-11-13.md), which recorded `BLOCKED` because no Windows host was reachable. A host capture has since been run by the operator.

## 1. Outcome

**PARTIALLY COMPLETED.**

- The Dependency 1 read (one actual owner-bound persisted portfolio revision, read through protocol v1) is **technically satisfied and awaits formal review**. `evidenceEligibility` stays `HOST_CAPTURE_SUBJECT_TO_REVIEW`. This record does not change it and is not an acceptance.
- **W11 is not accepted.** Dependency 2 (identity coverage for the captured revision) and Dependency 3 (qualifying actual financial evidence for at least one issuer) are not satisfied. The W10 and W11 implementation is not on IRR `main`.
- None of the four recorded limitations could be closed by an authorized, safe code change in this pass. Each is classified in section 5 with its minimum next action.
- This pass changes documentation only. No source file, test, contract, gate or evidence criterion was changed in either repository.

**Reviewer limits.** This review was carried out from a Linux sandbox with no access to the Windows host. The actual sanitized summary file was not available to the reviewer: every host value in section 2 is as reported by the operator and was not re-read from the file. The exact capture was not requested, received or inspected, and must stay local to the host.

## 2. Evidence, by kind

### A. Observed on the Windows host (reported by the operator, not re-read here)

| Item | Value |
|---|---|
| Summary schema | `iips.w11-dep1.owner-bound-portfolio-capture.summary/v1` |
| Result | `CONSISTENT_CAPTURE`, process exit 0, one attempt |
| Read sequence | `portfolio.list`, `portfolio.get`, `portfolio.revisions`, `portfolio.get` (protocol `v` = 1, read operations only) |
| Portfolio | one broker-import portfolio, revision 1, 64 holdings, 1 history entry, provenance digest present |
| Consistency | 10 checks and 4 observations passed |
| Consumer observation window | `2026-11-13T07:43:24.537Z` to `2026-11-13T07:43:24.553Z` (clock of the consumer) |
| IPD-reported stored instant | `2026-11-11T17:05:50.682Z` (reported by IPD; a different clock and a different fact from the row above) |
| Exact-capture SHA-256 | `c5dd51f51025e3e17e3b798164c6b8078fa5487392d8f0dfd96be9bb7c79eda3` (recomputed on the host; matches) |
| `evidenceEligibility` | `HOST_CAPTURE_SUBJECT_TO_REVIEW` |
| `ownerContext` | `source = IPD_A2_BINDING`, `irrLocalPreconditionAffirmed = true`, `bindingIdentifiedByResponse = false` |
| `peerAuthenticity` | `NOT_ATTESTED` |
| `build.ipdBuildOnWire` | `NOT_AVAILABLE` |
| `build.ipdHostObserved` | source `RUNNING_PROCESS_COMMAND_LINE`; IPD checkout commit `1fded9d3fb75df99e9c008176ecc6407645ceb70` |
| `build.irr` | checkout `08411bcd6d782a601fe5c82cc9983d076831148d`, clean |
| Identity counts | `securityIdentity` object present 1, null 63, absent 0, malformed 0; `identityStatus = RESOLVED` 64; `resolutionDisposition = CANONICAL_P04` 64 |
| Read-only | no write operation sent; no database access by the utility |

The host entrypoint path, runtime detail and endpoint name are deliberately not recorded here.

### B. Independently verified in this review (from the remotes, 2026-11-13)

| # | Fact | How verified |
|---|---|---|
| B1 | IRR `main` is `08411bcd…`, the merge of PR #564. Its tree is identical to the reviewed utility commit (tree `859589790be8679d0d48cc48d642f6ea682c259b`). The IRR checkout the host reported is therefore the merged utility. | `gh pr view`, `git rev-parse <commit>^{tree}`, `git diff --stat` (empty) |
| B2 | IRR `main` check run `Typecheck · Test · Build` for `08411bcd…`: completed, success. | `gh api …/check-runs` |
| B3 | Commit `1fded9d…` exists in IPD, on the branch of **open** PR #156. It is not on IPD `main`; `main` (`a624d06…`) is its ancestor; it is 29 commits ahead, all in the DHAN Windows credential series. | `gh api`, `git merge-base --is-ancestor`, `git log` |
| B4 | Between IPD `main` and `1fded9d…` nothing differs under `src/ipc`, `src/persistence`, `src/contracts`, `src/identity` or `evidence/dhan-p7`. In the import closure of the IPC entrypoint (60 files on `main`, 64 at `1fded9d…`) 55 files are identical and 9 differ, all under `src/providers/dhan` and `src/security`. The registry loader `loadGovernedP7InstrumentRegistry` lies outside every changed hunk. | `git diff --name-only`, import-closure walk, hunk inspection |
| B5 | Protocol v1 as implemented on IPD `main` carries no owner, binding, endpoint or build identifier on any response, and refuses unexpected request envelope keys. This matches accepted consumer contract v1 (OC-1, OC-6, C6). | source read of `src/ipc/{protocol,dispatch,endpoint,entrypoint}.ts`; contract §§ OC, V |
| B6 | On IPD `main`, an owner read succeeds only if exactly one ACTIVE binding with exactly one ACTIVE membership exists at resolution; zero or more than one fails closed. | source read of `src/persistence/binding.ts` |
| B7 | On IPD `main`, `identityStatus = RESOLVED` with `resolutionDisposition = CANONICAL_P04` is stamped on every holding whose **company** was resolved; `securityIdentity` is produced by a separate P04→P7 qualification and stays `null` when that does not qualify. The holding is still persisted, and the reason is not stored. The persisted holding row keeps no ISIN, exchange or series outside `securityIdentity`. | source read of `src/persistence/{brokerImportPersistence,portfolio_store}.ts` |
| B8 | The tracked P7 qualification manifest holds 96 qualified mappings over **48 distinct ISINs** (`BSE:A` 47, `BSE:B` 1, `NSE:EQ` 48). 23,644 equity candidates were rejected as `REJECTED_NO_P04_CORRESPONDENCE`. | parse of `evidence/dhan-p7/qualification-manifest.json` |
| B9 | IPD `main` baseline: `npm run build:tsc` exit 0; `npm test` 1487 executed, 1486 passed, 1 skipped, 0 failed. The suites that pin B5–B7 are in that run. | executed in the review sandbox (Linux, Node 22) |
| B10 | IRR PR #563 (W10 and W11 implementation) is **OPEN**, not merged; head `d10afbb31573d999f4b331484fcb79c510df1304`; mergeable, merge state clean; checks successful. A trial merge with IRR `main` has no conflict. | `gh pr view`, `git merge-tree --write-tree` |
| B11 | At that head the W10 and W11 suites pass (81 tests, 0 failed). The W10 mapping declares 13 engines and 192 inputs; 115 are required; 62 required inputs have no authorized source. Banking is the only engine with no blocked required input (8 required, 0 blocked). | `tsx --test` on the three `w10*`/`w11*` suites; count over `TRACKED_ENGINE_PROFILES` |

| B12 | The IPD read-consistency fix `29caac3134ec1fb12e4d822c31a806d782cc3e1b` ("Keep portfolio read projections on a consistent SQLite snapshot") is now an ancestor of IPD `main`, and therefore of `1fded9d…`. The IRR Stage 2 record lists it as not merged; that entry is out of date. | `git merge-base --is-ancestor`, `gh api …/compare` |
| B13 | The IPC server start-up line prints the endpoint only. The security-master revision and registry mapping count it composed are held in process and are not printed or served. | source read of `src/ipc/entrypoint.ts` |

B3 and B4 describe a **commit**. They say nothing about which build was running: see limitation 3.

### C. Operator-attested only

- Every value in section A, until the sanitized summary is read by a reviewer.
- `irrLocalPreconditionAffirmed = true`: the operator affirms the IRR-side local precondition. This is an affirmation, not an attestation by the service.
- That the process observed on the host was the IPD IPC server, and that it was started from the checkout whose commit is recorded.

### D. Outstanding

1. Reviewer sight of the sanitized summary (`w11-dep1-capture-summary.json` and `.md`). Only the sanitized summary may be shared; the exact capture may not.
2. Peer authenticity evidence (limitation 2).
3. Binding of the running IPD build to a commit (limitation 3).
4. W03 report-inventory half (IRR report reads, artifact types and linkage). The capture covers only the portfolio half.
5. W04 identity coverage evidence for the captured revision, with source and listing/series versions.
6. Qualifying actual financial evidence for at least one issuer.
7. Merge of IRR PR #563.

### E. Formal acceptance

**None.** No reviewer other than the capturing operator has accepted the capture. `HOST_CAPTURE_SUBJECT_TO_REVIEW` is unchanged. W03, W04, W08, W11 and the product remain not accepted. Exit 0 is not acceptance.

## 3. What the capture does and does not establish

Established, subject to review:

- A protocol v1 peer returned one portfolio at revision 1 with 64 holdings, and the four sequential reads agreed with each other on every checked field.
- The exact capture file has the recorded digest.

Not established, and not to be inferred:

- **Atomicity.** The reads were sequential. Agreement between them is sequential consistency only. A write that occurred and was reverted between reads would not be detected.
- **Which binding served the reads.** By contract, no response identifies it.
- **That the peer was the IPD server.** A successful pipe connection and a host process observation are not peer authentication.
- **Which IPD build answered.** A checkout commit is not the running build.
- **Security identity.** `RESOLVED` / `CANONICAL_P04` on 64 holdings is company-level resolution. 63 holdings have `securityIdentity = null` and are explicitly unresolved.
- **How revision 1 was written.** Not examined in this review.

## 4. Dependency 1 disposition

| Aspect | Disposition | Class |
|---|---|---|
| Capture result | `CONSISTENT_CAPTURE`, one attempt, read-only | Technically satisfied, awaiting formal review |
| Integrity | Exact-capture SHA-256 recorded; host recompute matches (operator-attested) | Technically satisfied, awaiting formal review |
| Eligibility | `HOST_CAPTURE_SUBJECT_TO_REVIEW`, unchanged | Awaiting formal review |
| Owner-binding | Derived by IPD from its A-2 binding; not identified by any response; operator affirmation only | Blocked by governance (contract v1 OC-6, C6) |
| Peer authenticity | `NOT_ATTESTED` | Requires Windows-host operator evidence |
| Build provenance | `NOT_AVAILABLE` on the wire; host-observed checkout commit is on an unmerged branch | Requires authorized implementation (contract minor version) |
| Identity coverage | 1 populated, 63 explicitly unresolved, of 64 | Not a Dependency 1 defect; it is the Dependency 2 measurement (section 6) |

## 5. The four limitations

### 5.1 Owner-binding attestation — blocked by governance

- **Fact.** `bindingIdentifiedByResponse = false` is the contract working as accepted. Consumer contract v1 (Program Authority accepted, 2026-10-18) states that no owner context crosses the wire (OC-1), that IPD derives the owner per request from the single ACTIVE A-2 binding (OC-2), and that responses never disclose `applicationUserId`, `tenantId` or `endpointId` (OC-6); L-IPC-1 C6 forbids disclosing anything about owners or bindings.
- **What narrows it.** By B6, a successful read means exactly one ACTIVE binding existed, so in a single-user store "which binding" has one possible answer. That inference holds only if the running build behaves as the reviewed source (limitation 3) and the peer was IPD (limitation 2).
- **Why no change was made.** Any response field that identifies or commits to a binding contradicts OC-6 and C6. Changing that is a contract revision that needs Program Authority acceptance before it is effective (V-1). It cannot be self-authorized, and an operator affirmation cannot be relabelled as attestation.
- **Minimum future change (not authorized here).** One of:
  1. Accept the limitation for this single-user application, by an explicit recorded decision of the principal, relying on B6 together with closure of limitations 2 and 3.
  2. A contract revision admitting an opaque, non-identifying binding commitment on read results, with an IPD-side operator diagnostic that prints the same commitment for comparison. Needs Program Authority acceptance; IPD-owned.

### 5.2 Peer authenticity — requires Windows-host operator evidence

- **Fact.** The pipe is created with the platform default DACL; the application records `enforcedByApplication: false`. The effective DACL is unverified Gate 4 host evidence.
- **Scope.** Certificates, identity providers and remote authentication are out of scope for a local single-user application and are not proposed.
- **Minimum next action (operator, on the host, no code change).** In one session, while the capture is taken, record without publishing the endpoint name or paths: (a) the pipe exists with exactly one server instance; (b) the owning process of that pipe instance is the IPD process whose command line was observed; (c) that process and the capture process run as the same interactive user; (d) the pipe's effective DACL grants no access to other non-administrative principals. Publish only pass/fail per item. This is operator evidence of the local peer, not cryptographic attestation, and must be labelled as such.

### 5.3 IPD build provenance — requires authorized implementation

- **Fact.** Protocol v1 has no build identity on any response and `src/ipc/entrypoint.ts` has none in process. The host-observed value is the Git commit of a checkout, read from a process command line over compiled output. It does not bind the running code to that commit.
- **Additional finding.** The observed commit `1fded9d…` is on unmerged PR #156, not on IPD `main`. By B4 the IPC, persistence, contract and identity sources are identical to `main` at that commit, so the difference is confined to DHAN credential code. This is a statement about the commit only.
- **Why no change was made.** A new optional result field or a new read operation is a **minor** contract version (V-1, V-4), and every version needs Program Authority acceptance before it is effective. Implementing it first would be self-granted authority.
- **Minimum future change (IPD-owned, not authorized here).**
  1. At build time, stamp a build identity into the compiled output: source commit, dirty flag and a digest over the emitted files. It must be generated by the build, not read from environment or configuration at run time.
  2. Expose it through a new parameterless read operation (contract minor version). A v1 consumer that does not call it is unaffected, and `v` stays 1 (V-2).
  3. The IRR utility records the returned value as `ipdBuildOnWire`. That is an IRR change of a few lines, made after the contract version is accepted.
- **Interim operator evidence (weaker, no code change).** Compare a digest of the compiled output the observed process was started from with a clean build of the recorded commit on the same host, and confirm the files were not modified after the process started. This binds on-disk artifacts, not the running process, and stays operator-attested.

### 5.4 Security identity coverage — Dependency 2, not satisfied

- **Fact.** 1 of 64 holdings carries a `securityIdentity`; 63 are `null`, which the store defines as explicitly unresolved and never reconstructs.
- **Not a capture defect.** The utility reported what the service returned. By B7 the 64 `RESOLVED` values describe company resolution and are independent of `securityIdentity`.
- **Cause: not established.** The reason for a null is not persisted and not on the wire. The code admits several: no ISIN or no exchange on the imported row; no P7 mapping for the ISIN (the tracked registry covers 48 ISINs, B8); inactive or missing listing; ambiguous provider mapping; stale source evidence; or an empty registry at import time. Which applied to the 63 cannot be determined from published evidence, and this record does not guess.
- **Not recoverable from the store.** By B7 an unresolved holding row keeps no ISIN, exchange or series. The identity of the 63 cannot be recomputed for revision 1 from persisted data without deriving it from symbol or name, which is forbidden. Their identity can only come from a later governed import that produces a new revision. That is outside this task and is not proposed here.
- **What W11 requires.** The roadmap requires W04 before W08 and W10, and W08, W09, W10 before W11. W04 asks for same-revision qualified, ambiguous, missing, expired/ineligible and unavailable counts with source and listing/series versions, reconciled rows, an exact security→listing→issuer mapping and no symbol-only identity.
- **Does existing W04 evidence cover revision 1?** No. The only W04 material is open IPD PR #155 (records 0 observed, 64 unavailable, and a consumer that reads flat fields rather than the nested object) and the IRR Stage 2 record (W04 "Unknown"). Neither is for this capture. The capture itself supplies part of W04 for revision 1: qualified 1, unavailable 63. It does not supply the reason split or the source versions.
- **Can issuer-level execution qualify?** Only for a holding with a populated `securityIdentity` that the IRR resolver maps to an issuer. That is at most one holding in this revision. The roadmap measures achievable coverage rather than requiring full coverage, so one issuer could in principle carry the W11 acceptance run, but only if that same issuer also has qualifying financial evidence (section 6, Dependency 3). Whether it does is unknown and cannot be published per holding.
- **Class.** Requires Windows-host operator evidence (W04 measurement); the unrecoverable reason split is an architectural limitation of revision 1.

## 6. W11 acceptance matrix

| Requirement | Current evidence | Status | Remaining action |
|---|---|---|---|
| Dep 1: actual owner-bound persisted portfolio read | Host capture, revision 1, 64 holdings, digest recorded (operator-reported) | Technically satisfied, awaiting formal review | Reviewer reads the sanitized summary; principal records disposition of limitations 5.1–5.3 |
| Dep 2: W04 identity coverage for the captured revision | Capture counts only: 1 qualified, 63 unavailable; no reason split, no source versions; no W04 record for this revision | **Not satisfied** | Complete W03, then W04 for revision 1 (section 7) |
| Dep 3: qualifying actual financial evidence for at least one issuer | None qualifies. 62 of 115 required engine inputs have no authorized source; only Banking has no structural blocker, and only with the closing-balance ROA/ROE deviation enabled | **Not satisfied** | Methodology decision on the unmapped inputs, or an actual Banking issuer dataset, for an issuer that also has a populated identity |
| W08 security-to-issuer bridge | Not claimed in the IRR Stage 2 record | Not satisfied | Follows W04 |
| W09 revision-aware consumer | IRR Stage 2 record: no IRR-side gap, acceptance not claimed pending an IPD fix. That fix is now on IPD `main` (B12). No record claims W09 acceptance | Not accepted | IRR owner re-states W09 against IPD `main`. Separately, nothing on IRR `main` builds the W11 `PortfolioRevisionEvidence` (`readSource`, `observedAt`, `ownerBindingRef`) from an actual read |
| W10 mapping and W11 execution code | IRR PR #563, open, checks successful, suites pass at head (B10, B11) | Implemented, **not merged** | IRR owner merges PR #563 |
| W11 acceptance criteria (actual issuer input lineage, bounded reproducible output, missing/partial refusal, unchanged golden regressions) | Synthetic and fixture tests only | **Not accepted** | Run on actual evidence once Dep 1–3 hold for one issuer |

## 7. Exact next roadmap activity

In roadmap order, without skipping:

1. **Review step for Dependency 1.** A reviewer reads the sanitized summary and confirms section A. The principal records a decision on limitations 5.1–5.3 (accept for this single-user application, or require the stated evidence or change).
2. **W03, remaining half.** Sanitized report inventory on the host: artifact types, linkage and read times, reconciled to revision 1. The portfolio half is covered by the capture.
3. **W04 for revision 1.** Record: qualified 1; unavailable 63, with the reason split stated as not retained; the source versions, taken from the tracked files of the checkout the service was started from (security-master batch, P7 manifest digest and generation time), labelled as checkout facts because the running service does not report them (B13); and, for the one qualified holding, whether the IRR resolver maps it to an issuer (count only). Publish counts, never rows.
4. Only then W08 and the W11 acceptance run, which also need Dependency 3 and PR #563 on IRR `main`.

W04 is the next activity that is not a review step. It is host-operator work; no repository change is needed to perform it.

## 8. Blockers

| # | Missing capability or evidence | Repository / component | Kind | Minimum next action |
|---|---|---|---|---|
| 1 | Reviewer sight of the sanitized summary | Host | Operator | Share the two sanitized summary files only |
| 2 | Binding identification on responses | IPD IPC contract v1 (OC-6, C6) | Governance | Principal decision: accept, or open a contract revision |
| 3 | Peer authenticity | Host named pipe | Operator | The four host checks in 5.2 |
| 4 | Running-build identity | IPD build and IPC; then IRR utility | Code, after governance | Contract minor version accepted, then the change in 5.3 |
| 5 | W03 report inventory | Host, IRR report reads | Operator | Sanitized inventory reconciled to revision 1 |
| 6 | W04 coverage for revision 1 | Host; IPD identity owner; IRR resolver | Operator | The W04 record in section 7. Source versions of the running service are not observable (B13); they share the build-identity change in 5.3 |
| 7 | Identity for 63 holdings | IPD persisted revision 1 | Architectural | Not recoverable for revision 1; a later governed import is a separate decision |
| 8 | Qualifying financial evidence | IRR financial data and W10 mapping | Governance and data | Methodology decision, or an actual Banking dataset |
| 9 | W10/W11 code on `main` | IRR PR #563 | Code (publication) | IRR owner merges |

## 9. Not examined

- The actual sanitized summary file and the exact capture.
- Anything on the Windows host, including the pipe DACL, the running process and its compiled output.
- By which path revision 1 was written, and with which registry state.
- Which of the possible reasons applied to each unresolved holding.
- W09 behaviour on IRR `main` beyond the points stated in section 6.
- Whether the tracked identity sources at `1fded9d…` were the ones loaded by the running service.

## 10. Commands run for this review

IPD, branch at `main` plus documentation:

```
npm run build:tsc        # exit 0
npm test                 # 1487 executed, 1486 passed, 1 skipped, 0 failed, exit 0
```

IRR, PR #563 head `d10afbb…`, directory `iips-platform`:

```
npm ci
npx tsx --test tests/investment/w10IssuerEngineMapping.test.ts tests/investment/w10IssuerEngineQualification.test.ts tests/investment/w11IssuerEngineExecution.test.ts
                         # 81 tests, 81 passed, 0 failed, exit 0
git merge-tree --write-tree origin/main pr/563    # exit 0, no conflict
```

No test was added or changed. No command was run on the Windows host by the reviewer.
