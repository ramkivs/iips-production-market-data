# Snapshot-to-Live W04 — identity provisioning on the Windows host: completion and reconciliation

**Date:** 2026-11-14
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md)).
**Follows:** [provisioning record](IIPS-W04-IRR-IDENTITY-SOURCE-PROVISIONING-2026-11-13.md), [decision record D1 to D4](IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md), [approval enforcement](IIPS-W04-IDENTITY-PROVISIONING-APPROVAL-ENFORCEMENT-2026-11-13.md).
**Repositories read:** IPD `ramkivs/iips-production-market-data`, this branch (PR #157) and `main` `a624d06`. IRR `ramkivs/iips-review-recovered` at `main` `08411bcd6d782a601fe5c82cc9983d076831148d` and at the head of open PR #563, `d10afbb31573d999f4b331484fcb79c510df1304`.

**This record reconciles evidence. It ran nothing on the Windows host, changed no tool file and started no implementation.** The host results are those the operator reported on 2026-11-14. No terminal output, approval record or receipt was supplied to this record, and none is stored in the repository.

**W04 status: PARTIALLY COMPLETE, NOT ACCEPTED.** Identity-source provisioning on the host is complete. Identity coverage of the actual holdings is not measured.

## 0. Summary

| W04 dimension | Status | Label |
|---|---|---|
| Identity source generation | Complete | H; values equal the sandbox runs (R) |
| Approval by the single authority (decision D1) | Complete: record `W04-D1-20261114-01` | H |
| Approved digests equal the installed files | Pass | H |
| IRR loader validation | Pass, at IRR `08411bc` | H; same result in the sandbox (R) |
| IRR resolver validation over the roster | Pass, 2,388 of 2,388 by ISIN and by exchange and symbol | H; same result in the sandbox (R) |
| Installation in the runtime data directory | Complete | H |
| Running transport loads the identity sources | Pass | H; the reading of the probe is confirmed from source (R) |
| Identity coverage of the actual holdings | **Not measured** | U |
| Same-revision identity coverage acceptance | **Pending** | |
| W04 acceptance | **Not accepted** | |

What changed against the earlier records: the identity directory on the host is no longer absent, and the identities route no longer refuses with `identity-sources-unavailable`. The statements of the [root-cause record](IIPS-W04-IRR-IDENTITY-SOURCE-MISSING-ROOT-CAUSE-2026-11-13.md) describe the state before 2026-11-14.

What did not change: the counts for captured revision 1 (64 holdings, security identity populated on 1, `null` on 63) and everything that follows from them. The 63 are holdings without a stored security identity. They are not rejections by the IRR resolver, and none of them has been shown to be missing from the roster.

## 1. How to read this record

| Label | Meaning |
|---|---|
| **H** | Observed on the Windows host and reported by the operator in the handoff of 2026-11-14. Not re-read here. |
| **R** | Verified for this record from tracked repository content: by reading source, or by comparison with runs recorded in the sandbox. |
| **D** | Derived from **H** and **R**. Each derivation states its condition. |
| **U** | Not available: not reported, not observable from the repositories. |

## 2. The host evidence, as reported

### 2.1 Approval (H)

| Item | Value |
|---|---|
| Approval identifier | `W04-D1-20261114-01` |
| Status | `APPROVED` |
| Approver | `PROGRAM_AUTHORITY_RAMKI` |
| Approved at | `2026-11-14T04:57:48Z` |
| Review date | `2026-11-14T18:29:59Z` |
| SHA-256 of the record file | `bf5d6918e1245d65fe3e26406537585e28aa5ba6b2e055c79da5c9975177ad69` |
| `check-approval` | PASS, compared with the running tool, the staged files and the IRR commit of the accepted gate |
| IPD tool commit | `fff4829db5f8cd2863965e64e4650a58f48f82b7` |
| IRR commit of the accepted gate | `08411bcd6d782a601fe5c82cc9983d076831148d`, working tree clean |
| Scope | Local, single user, non-production; operator-supplied; not product-wide authoritative, not hosted, not multi-user, not commercial |

The record is kept on the host outside both checkouts. Its content is not published. The identifier, the times and the digest above are what the wrapper's sanitized output and the install receipt carry.

The approval accepts the twelve limitations by name (`CIN_NOT_EXPORTED`, `SECTOR_UNCLASSIFIED`, `BSE_LISTINGS_NOT_EXPORTED`, `CORPORATE_ACTIONS_EMPTY`, `NO_SYMBOL_HISTORY`, `ELIGIBLE_MEANS_ACTIVE_NSE_LISTING`, `SERIES_FROM_UNIVERSE_DEFINITION`, `SOURCE_AUTHORITY_CONDITIONAL`, `NON_EQ_SERIES_HOLDINGS_UNRESOLVED`, `NSE_SOURCE_FILE_WITHOUT_RETRIEVAL_RECEIPT`, `ROSTER_LARGER_THAN_IID_DESIGN_DEFAULT`, `HOLDINGS_COVERAGE_NOT_MEASURED`) and the two withheld records `IN9175A01010` and `INE175A01038` (`ISSUER_SHARED_ACROSS_ISINS`).

### 2.2 Generation, loader gate, installation, transport (H)

| Item | Host value | Equals the sandbox run at `3b92471` (R) |
|---|---|---|
| P04 batch and authorization | `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`, `AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001` | Yes |
| P04 records, checksum | 2,390; `b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4`, verified | Yes |
| P7 manifest SHA-256 (corroboration only) | `13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc` | Yes |
| Exported issuers / NSE listings / BSE listings / corporate actions | 2,388 / 2,388 / 0 / 0 | Yes |
| Withheld | 2 | Yes, the same two records |
| `eligible-roster.json` | `078e89cc1896d0f59e09e2ad05a12378e248cd81b97775ee7667b5f1e750e937`, 1,350,516 bytes | Yes |
| `listing-map.json` | `6a330123a2fea31e9e1dd54f01e5adbe13f9721f077a5a82a34ee7cd60bcf458`, 1,285,774 bytes | Yes |
| `corporate-actions.json` | `d6bc14d1b676260bb0f1c2280e62956d3f6a7e07b9b9265a73b49f821185ffcd`, 70 bytes | Yes |
| IRR loader | Accepted the three files; class `OPERATOR_SUPPLIED`; 2,388 issuers, 2,388 securities, 2,388 listings, 0 corporate actions | Yes |
| IRR resolver over the roster | 2,388 of 2,388 by ISIN; 2,388 of 2,388 by exchange and symbol; the same record each time | Yes |
| IRR roster version | `sha256:4baa4e596f84741018e03c08248faf89ff19a37b3d1877220d56dc27aafe7199` | Yes |
| IRR listing-map version | `sha256:b04416b290d1b6fe682717505f9ecd940e025ee6e0d6d1dc0f68f105604a0dca` | Yes |
| IRR corporate-action table version | `sha256:0b1d3cbfe52c62afbfabffe2a8ed66dd4a0812ca712f05e1ed9a58caa4b75819` | Yes |
| First installation attempt | Refused; nothing installed. The wrapper had selected an IRR checkout other than the one named in the approval | — |
| Second attempt, with the IRR checkout stated explicitly | Step 4: `PASS (INSTALLED)`; the three installed files have the approved digests and sizes | — |
| Receipt | Written by the tool. Its location was not reported | — |
| Wrapper rerun with the services running | Absent-portfolio probe: status 503, identity sources refused `false`, identity sources loaded `true`. `RESULT: PASS`. Exit code 0 | — |

The sandbox values are in [`review-run-3b92471.txt`](../../evidence/integration/w04-identity-single-approver-2026-11-14/review-run-3b92471.txt). The tool files at `fff4829` are identical to those at `3b92471` (R: no difference under `src`, `scripts`, `package.json`, `tsconfig.json`).

## 3. Findings of the reconciliation

**F1. Every value that can be reproduced agrees (R).** The host generated, byte for byte, the three files the sandbox generated from the tracked P04 master, and IRR's loader computed the same three source versions.

**F2. The 503 of the probe is not an identity-source failure (R).** In IRR `08411bc`, `handleHoldingIdentityRequest` loads the identity sources first and answers 503 `identity-sources-unavailable` if they do not load. Only then does it read the holdings; a portfolio that does not exist gives 503 `holdings-unavailable`. The wrapper reports "loaded" for exactly that second answer. The reported result therefore means: the running process loaded the files, and the probe portfolio does not exist.

**F3. The approval is the first real use of the approval path (H).** Two limits recorded in the enforcement record are now exercised on the host, as reported by the operator and not by a test: a successful `install` on the command line, and a refusal that left the host unchanged (the first attempt).

**F4. The IRR commit of the running transport is not reported (U).** The approval binds the IRR commit whose loader accepted the files, `08411bc`, in the checkout the operator named. The wrapper's default is the IRR checkout beside the install root (R), and the first attempt shows that this default checkout is at another commit (H). Which checkout the running services were started from, and at which commit, is not stated. The probe shows that the running process loads the files, whichever commit it is.

**F5. The probe does not show which roster version the transport serves (R).** Only a 200 answer of the identities route carries `directory.rosterVersion`. The comparison "serves the roster the gate accepted" is made by `verify-endpoint`, which runs only with a portfolio. It has not been run. Evidence item E-5 of the decision record is open.

**F6. The review date is today (H, R).** The record authorizes until `2026-11-14T18:29:59Z`. From then on the tool refuses `install`, and with it the wrapper, whose every run passes through the approval check, including a run with `-PortfolioId`. The installed files stay in place; the tool removes nothing. `verify-endpoint` itself needs no approval (R). The decision record describes the review date (Q-3) as the date after which the approval lapses unless renewed, because the roster ages. Whether use of the installed roster after that instant needs a renewed record is not answered by the tool and is for the principal to state.

**F7. Provisioning does not make holdings resolve on IRR `main` (R, D).** At `08411bc`, `toHoldingObservation` passes a holding's flat `isin` and `exchange` to the resolver and sets the series to `null`. A holding read from IPD has neither field; it carries the nested `securityIdentity` object (IPD `holdingFromRow`). The code that projects that object is in open IRR PR #563 (commit `7f3f7db`). Derived, on the condition that the running transport behaves as `08411bc`: all 64 holdings return `UNMATCHED` with reason `NO_IDENTIFIER_PROVIDED`, whatever the roster holds. This prediction is unchanged from the [endpoint assessment](IIPS-W04-IRR-IDENTITIES-ENDPOINT-REVISION-BINDING-ASSESSMENT-2026-11-13.md), section 9. It is not a host fact.

**F8. With PR #563, at most one holding of revision 1 can resolve (D).** Only one holding of the captured revision carries a security identity. The other 63 carry `null`, which was decided at import on the IPD side, and no roster content can resolve them. For the one, the result depends on whether its ISIN is among the 2,388 and on its series: a series other than `EQ` gives `AMBIGUOUS_LISTING` (decision record, section 5.3). The values of that identity were never supplied.

**F9. "Same revision" needs more than `-PortfolioId` (R).** The identities route reads the current portfolio state and names no revision. The wrapper's `-PortfolioId` form makes the one identities request. The binding to a revision is made by the four read-only requests of the endpoint assessment, section 8.

**F10. One difference between the handoff and the roadmap.** The handoff lists the W03 report inventory as unknown. The roadmap, updated 2026-11-13, records one operator-reported inventory run (2 persisted artifacts of 2 types, none reconciled to the captured revision). This record changes neither.

## 4. Acceptance evidence of decision D1

| # | Evidence (decision record, P-9) | State |
|---|---|---|
| E-1 | Approval record | Exists on the host (H). Not in the repository, by design |
| E-2 | Generation report, result `PASS`, same digests | Reported (H); digests equal (R) |
| E-3 | Loader gate against the IRR commit used | Reported (H): accepted, `OPERATOR_SUPPLIED`, 2,388 of 2,388 both ways, at `08411bc` |
| E-4 | Host installation | Reported (H): installed, digests equal. The result of `Test-IrrIdentitySources.ps1` was not reported (U) |
| E-5 | Identities route answers 200 at the stated holdings revision, with counts by state and reason | **Open.** Deferred by the operator |

D1 is approved. Provisioning is complete in the sense of E-1 to E-4. E-5 is the same observation as item E1 of the evidence assessment.

## 5. What W04 acceptance still requires

The roadmap text is unchanged: *"same-revision qualified/resolved, ambiguous, missing, expired/ineligible and unavailable counts with source and listing/series versions"*, accepted on *"reconciled rows and exact security→listing→issuer mapping; no symbol-only identity"*.

| Requirement | State | What supplies it |
|---|---|---|
| Counts by resolver state and reason for the holdings | Not observed | The identities route for the portfolio (E-5) |
| Same revision | Not observed | The four requests of the endpoint assessment, section 8 |
| IRR source versions as served | Roster, listing-map and corporate-action versions known from the gate (H). The version the transport serves is not observed | `directory.rosterVersion` of the 200 answer |
| IRR commit of the running transport | Not reported | The operator states it |
| IPD source versions of the running IPC service | Not observed | Item E2 of the evidence assessment |
| Exact security→listing→issuer mapping | Not established for any holding | IRR code that passes the security identity to the resolver (PR #563), then E-5. With that code the listing is chosen by a preference rule, because the holding stores no exchange (evidence assessment, R12) |
| The 63 holdings without a security identity | Counted as unavailable. Cause per holding unknown; the reason was not retained at import | Item E4 of the evidence assessment, if an import record was retained. Otherwise they stay unavailable |
| Identity threshold `θI` of the roadmap, section K | Not established | Set from the observed counts, as the roadmap prescribes |

A count of unresolved holdings is a valid W04 result. It completes the record of measured coverage; it does not by itself meet the acceptance text.

## 6. IRR after the loader, resolver and transport checks

- **No defect of the loader, the resolver or the route is evidenced.** They accepted, resolved and loaded what they were given, on the host and in the sandbox.
- **The checks did not exercise the path from a holding to the resolver.** They resolved roster entries, not holdings. The gap of F7 is in that path. It is the gap roadmap item W08 names ("IPD D114 object not explicitly consumed by IID mapper") and step 4 of the continuation order ("lossless D114 projection, in IRR only").
- **The nested D114 projection concern is still relevant, and it needs no new investigation in the repositories.** It is established from source and by probe (evidence assessment R8 to R12; decision record D3, which ran the checks of PR #563 on its head and on the merged tree, and the loader gate on both). What is missing is the IRR owner's disposition of PR #563 (D3-a, D3-b) and the observation on the host (E-5).
- **PR #563 also changes IRR's identity source validation.** The exported files pass the loader gate at `d10afbb` and on the merged tree (R, decision record D3). A host IRR that moves to that code gets another commit; the installed files stay, and a further run of the installing wrapper would need a record for the new commit.

## 7. Position in the roadmap

The dependency graph is unchanged: `W03 -> W04`, `W04 -> W05, W06, W08, W10, W20`.

| Step of the continuation order | State |
|---|---|
| 3. Identity source authority, provisioning and the endpoint failure | **Done** (H): approved, installed, loaded |
| 4. IRR loader validation and lossless D114 projection, in IRR only | Loader validation: passes for these files at `08411bc` (H, R) and at `d10afbb` (R). D114 projection: implemented in open PR #563, not on IRR `main`. **This is the next activity.** It is the IRR owner's decision; no agent merges it |
| 5. Same-revision identity coverage for all eligible holdings (W04) | Not started. The portfolio check is deferred by the operator. On IRR `main` its expected result is 64 unmatched for want of an identifier (F7), which is evidence but not coverage |
| 6. W05 financial coverage and rights; W07 | Needs W03 and W04. Its acceptance text requires reconciliation to W04, so its final outcome waits for per-holding issuer identity. The W05 qualification record is in open PR #563 |
| 7. W06 market observations and freshness | Needs W03 and W04. Its deliverable is per identity, with same-revision reconciliation; today one holding has a qualified security identity |

Why step 4 is next and not step 5: step 5 measured on IRR `main` cannot return an issuer for any holding, so it cannot produce the mapping W04 is accepted on. The order the roadmap already has (4 before 5) is the order the evidence supports. Step 5 can still be run first as a measurement; it would settle F4 and F5 and confirm or refute F7 on the host.

## 8. What is preserved, and what is not reopened

| Item | State (2026-11-14) |
|---|---|
| IPD `main` | `a624d06` |
| IPD PR #157 (this branch) | Open, not merged. The approved tool commit `fff4829` is in its history. Commits after it change documents only |
| IPD PR #156 (Windows vault provider and the newer script validator), #155, #151 | Open, untouched |
| IPD PR #158 (Dhan API assessment) | Open. Another workstream; not part of W01 to W20 |
| IRR `main` | `08411bc` |
| IRR PR #563 (identity projection, W05, W07, W10, W11) | Open, head `d10afbb`, no review, one CI run of 2026-11-13T04:16Z on `frontend/` only |
| IRR PR #562 | Open, untouched |
| IRR branch `arena/5570860c-iips-review-recovered` | Head `93578cfd`, the W03 reports collector, one commit ahead of `main`, no pull request |
| IRR PR #548 (W05 and W08 corrections) and #564 (capture utility) | Merged. Not duplicated |
| Host-side records | Approval record, install receipt, staging directory. Not in Git |

Not reopened: decision D1 and the questions U-1, U-2 and U-17; the provisioning tool and the approval check; the root cause of the former 503; W01 and W02; the merged W05 and W08 corrections; IID, IPD persistence, NP-04 and NP-06. The two withheld records stay excluded (D2). D4 is unchanged.

## 9. Not done by this record

- No operation on the Windows host, and no portfolio-specific check. The `-PortfolioId` run is deferred by the operator.
- No change to any local checkout of the operator. No fetch, pull, merge or rebase on the host.
- No implementation. No tool file changed; no IRR file changed; no pull request merged, closed or retargeted.
- The approval record and the receipt were not read and are not published.
- No authority label was changed. The roster is operator-supplied for local, single-user, non-production use. P01 rule ID-4 stands.
- Nothing about IID Stage 3, Dhan live integration, the IPO Screening Engine, NP-04 or NP-06.

## 10. Verification performed for this record

| Check | Result |
|---|---|
| Host digests, sizes, checksums, counts, IRR versions and limitation codes against `review-run-3b92471.txt` | Equal |
| `git diff 3b92471 fff4829 -- src scripts package.json tsconfig.json` | Empty |
| IRR `08411bc`, `frontend/server/investment/holding-identity-transport.ts` and `sources.ts` | Order of the two 503 answers and the fields `toHoldingObservation` reads, as stated in F2 and F7 |
| IPD `src/persistence/portfolio_store.ts`, `holdingFromRow` | No flat `isin`, no `exchange`; nested `securityIdentity` |
| IRR PR #563, file list and commits | `iips-platform/src/investment/identity/d114Projection.ts` and the changes to `sources.ts` are in commit `7f3f7db`; the pull request is open |
| Remote state of both repositories through the GitHub API | As in section 8 |
