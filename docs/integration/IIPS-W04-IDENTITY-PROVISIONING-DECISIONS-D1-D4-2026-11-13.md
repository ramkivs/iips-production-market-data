# Snapshot-to-Live W04 — identity provisioning decisions D1 to D4: findings and governance proposal

**Date:** 2026-11-13
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md)). Follows the [provisioning record](IIPS-W04-IRR-IDENTITY-SOURCE-PROVISIONING-2026-11-13.md), whose section 12 lists decisions D1 to D4.
**Repositories:** IPD `ramkivs/iips-production-market-data`, this branch (PR #157), provisioning tool at commit `b0d7908b999a458306e9786d3feafa71267e61c4`. IRR `ramkivs/iips-review-recovered` read and run unmodified at `main` `08411bcd6d782a601fe5c82cc9983d076831148d` and at the head of open PR #563, `d10afbb31573d999f4b331484fcb79c510df1304`.

**This record is an investigation and a proposal. It is not an approval.** It approves nothing, declares nothing authoritative, and changes no rule. P01 rule ID-4 is untouched. No IRR file was changed, no pull request was merged, closed or retargeted, nothing was installed on the Windows host, and no record was fabricated or inferred into any dataset.

**W04 status is unchanged: PARTIALLY COMPLETE and NOT ACCEPTED.**

**Exit condition.** W04 identity provisioning stays blocked until D1 is approved by the required authority. That IRR's loader accepts the files is not proof that the data has authority.

## 0. Summary

| | Question | Finding | State |
|---|---|---|---|
| D1 | May the P04 export be used as IRR's eligible roster? | No existing instrument authorizes it. A bounded use can be approved without making P04 authoritative. The proposal is in section 2.3. Every field the export takes from the master equals the tracked NSE listing file for all 2,390 records. The master's CIN and sector fields are not fit for any consumer. | **Awaiting approval. Provisioning blocked.** |
| D2 | What are the two withheld Jain Irrigation records? | One company with two listed share classes: ordinary shares and differential-voting-rights (DVR) shares. The master gives them two different CINs, and neither is the CIN the company publishes. The exporter as built cannot admit either. | **Both stay excluded.** A decision is needed to change that. |
| D3 | Is IRR PR #563 ready to merge? | It merges cleanly, and every check run here passes on the head and on the merged tree. Its title and description name one of six bundled work items, it has no review, and its CI run predates current `main` and covers `frontend/` only. | **Not merged.** The IRR owner decides. |
| D4 | Where could CIN, sector, BSE listings, corporate actions and symbol history come from? | No dataset in either repository is fit as it stands. Candidate official sources exist for each. None was downloaded. Three need a decision before any data is useful. | **No data sourced.** |

Two findings were not expected when D1 to D4 were written. Both matter for what the host will show:

1. **A holding identified with a BSE group as its series does not resolve in IRR.** IRR's series list is closed and has no BSE group. An observation that carries the ISIN and the series `A` is answered `AMBIGUOUS_LISTING`, with the export as it stands and also with a BSE listing added (section 5.3).
2. **Nothing in the tool enforces the block on provisioning.** The `install` step and the Windows wrapper run without an approval. Today the block is a rule in this record, not a check in code (section 2.3, item P-9).

   **Later record (2026-11-13).** Finding 2 described the tool at `b0d7908`. The check has since been built: `install` and the wrapper refuse without an approval record that authorizes exactly the staged files. See [approval enforcement](IIPS-W04-IDENTITY-PROVISIONING-APPROVAL-ENFORCEMENT-2026-11-13.md). That change approves nothing; D1 is still not approved.

## 1. How to read this record

| Label | Meaning |
|---|---|
| **R** | Verified here: by reading a tracked file, by measuring tracked files, or by running unmodified repository code. |
| **D** | Derived by reasoning from **R**. The condition is stated. |
| **H** | Reported by the operator from the Windows host. Not verified here. |
| **W** | From the public web. "Fetched" means the page was read. "Snippet" means only a search-result excerpt was seen; the page was not read and nothing was downloaded. |
| **U** | Not established. |

Each of sections 2 to 5 is split into established facts, unresolved questions, and decisions that need approval.

Evidence files are in [`evidence/integration/w04-identity-provisioning-decisions-2026-11-13/`](../../evidence/integration/w04-identity-provisioning-decisions-2026-11-13/README.md). Tests `IDF-01` to `IDF-07` and `IIX-53` to `IIX-56` pin the measured facts (section 7).

**Sources that could not be consulted.**

- The MCA company master file. The Wave-3 bundle's checksum list names `01_source_material/MCA/company_master_data_2026-11-07.zip`, but the file is not in the archive (R). No CIN in this record was checked against a registry.
- The PA directive `IIPS-PA-DIRECTIVE-2026-11-08-FINAL-RECONCILIATION-AND-GOVERNED-REPLACEMENT`. It is cited in ten tracked files; no directive document is tracked (R).
- IPD commit `d29ad2fa…`, which `docs/p01/P01_EVIDENCE.md` pins as the source of the D4 and D5 documents. It cannot be fetched. Those documents and the P04 specification package were read from branch `origin/arena/01a0c86d-iips-production-market-data` (head `3695d95`, 2026-09-22), which is **not merged into `main`** (R).
- IRR branch-protection rules (API 403).
- The Windows host and the 64 holdings.

## 2. D1 — use of the P04 export as IRR's eligible roster

### 2.1 Established facts: what the authority instruments say

| # | Instrument | What it says | Label |
|---|---|---|---|
| A-1 | `docs/p01/P01_IDENTITY_AND_LINEAGE.md`, rule ID-4 (on `main`) | "P04 is not authorized as product-wide authoritative identity. Making it so requires a new ADR". | R |
| A-2 | P04 specification package, `P04_SCOPE_AND_BOUNDARY.md` X-1, X-6 (off-`main` branch) | Repeats ID-4 as exclusion X-1. Assigns corporate actions to phase P08. Records ISIN as an "additional non-authoritative" identifier; the selected external standard is FIGI. The master carries no FIGI. Sector taxonomy must map onto the certified taxonomy, and a silent reclassification is a methodology change (OI-P04-01, owner Ramki/Sai). | R |
| A-3 | Program Authority decision `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-PROGRAM-AUTHORITY-DECISION-2026-10-19-01` (on `main`; "Program Authority (Ramki)"; a dated record without a signature) | C5: bounded non-production and offline-bootstrap display is permitted with honest disclosure. C6: IPD makes producer-scoped assertions; each consumer decides its own eligibility. C7: no real-only subset is admitted. Section 5 authorizes no consumer integration. Section 6: the decision grants no implementation authority by itself. | R |
| A-4 | P04 batch manifest `…authenticated_universe_2026-11-08.manifest.json` | Batch `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`, 2,390 records, mode `OFFLINE_BOOTSTRAP`, authorization `AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001`. Six residual limitations, among them: registry match "not establishable inside this repository"; taxonomy accepted "for this one-time replacement only; downstream consumers must not re-derive semantics from it". | R |
| A-5 | Replacement execution record 2026-11-08 | Approval is recorded as given by the PA. CINs are "not registry-verified". Deposit commit `44040ca`, PR #139, merged to `main` by `ramkivs` on 2026-11-08. | R |
| A-6 | `src/transports/object_resolver.ts` | IPD publishes consumer eligibility as `NOT_ASSERTED`. | R |
| A-7 | IRR, CV-22 Option C decision 2026-10-19, section 3 | No expansion beyond the 13-row sector reference is authorized until five items are defined and approved: (1) authoritative identity and eligibility contract; (2) approved roster and corpus revision with checksum, effective period and provenance; (3) exact mapping to the IRR identity; (4) explicit consumer acceptance criteria; (5) implementation authority. | R |
| A-8 | IRR, Investment Intelligence design 2026-11-05 | Identity is resolved against an IRR-curated eligible roster, which is IRR-owned. D05 and `companyId` are a lookup hint only. Within this scope "Program Authority" is replaced by "the operator (the single user)" and "approved roster" by "eligible roster (an operator-maintained data file)". | R |
| A-9 | IRR Stage 2 record 2026-11-10 | Roster class `OPERATOR_SUPPLIED` means operator attestation, not independent verification. | R |
| A-10 | Stage 3C reconciliation (IPD) | `companyId` and active listing come from P04; `series` comes from the P7 Dhan master; ISIN is `NON_AUTHORITATIVE`; IRR must never infer a series. | R |
| A-11 | Stage 3D and 4C (IPD) | Gates G-01 to G-06 are owned by the Program Authority and are open. "Investigation findings are not authorization". | R |
| A-12 | Local personal-use decisions 2026-11-08 and 2026-11-09; Stage 5A audit | The product is a personal, single-user, local application. Institutional gates are out of scope for that use and are not marked waived. | R |
| A-13 | Role A1 (identity authority), `D5_REGISTER.md`, `PROGRAM_STATE.md` (off-`main` branch) | A1 is cleared as a role but assigned to no person. The authority of record is written "Sai/Ramki". | R |

**What follows from these (D).**

- No instrument authorizes the P04 master as an identity source for IRR. A-3 permits bounded offline-bootstrap display inside IPD and leaves each consumer's eligibility to the consumer.
- A-1 and A-2 forbid one specific thing: treating P04 as product-wide authoritative identity without a new ADR. A use that is narrower than that, and says so, does not need the ADR. It still needs an explicit approval, because A-3 section 5 and A-11 say findings and semantics are not authorization.
- On the IRR side, A-8 and A-9 provide the vehicle for a narrow use: an operator-maintained roster of class `OPERATOR_SUPPLIED`.
- Whether A-7's five prerequisites also bind that vehicle is not stated in any record read (U-1).

### 2.2 Established facts: what the master carries

All counts are in `identity-source-measurements.json` (R).

**The fields the export uses.** The export takes from each master record its ISIN, company name, NSE symbol and NSE date of listing, and requires its listing status to be `ACTIVE`. It takes the series `EQ` from the batch's universe definition.

| Check against the NSE listing file in the bundle (`EQUITY_L(1).csv`, 2,630 rows; EQ 2,390, BE 207, BZ 33) | Result |
|---|---|
| Master records present with series `EQ` and the same symbol | 2,390 of 2,390 |
| Same company name | 2,390 of 2,390 |
| Same date of listing | 2,390 of 2,390 |
| EQ rows of the file that are absent from the master | 0 |

So for these fields the master is a faithful copy of that file, and the authority of the export is the authority of that file. The file has no status column: it expresses an active listing only by a row's presence. About the file itself:

- The bundle describes it as "original source files supplied during this work" (R).
- The Option B replacement plan of 2026-11-07 requires "bytes from the publisher or an act-authorized operator pull", with "sha256 + retrieval receipt + as-of date". The checksum is recorded (`da7eb83c…`). **No retrieval receipt for this file was found in the repository** (R, by search).
- The latest date of listing in the file is 2026-11-06. The file therefore reflects the NSE list on or shortly after that date (D). It ages from then: new listings, delistings, symbol changes and moves between series are not in it.

**The fields the export does not use, and why they must not be used.**

| Field | Measurement | Conclusion |
|---|---|---|
| `cin` | 2,298 well-formed values, of which **2,291 carry state code `MH`**, across 6 state codes. The bundle's bridge file of 2026-11-07 has 2,296 values across 32 state codes, 673 `MH`. The two agree on **0 of 2,232** records where both have a value. Against the reassessment's derived file the master agrees on **9 of 2,241**. For the five issuers IRR tracks with a sourced CIN, the master agrees on 0 and the bundle bridge on 4. | The reassessment record of 2026-11-08 states that the filed submission had "silently wholesale-rewritten all CINs" and rescinded it. The master carries that rewritten generation (R). It is not usable as an issuer key by any consumer. Which generation is right cannot be shown here: no registry file is tracked. |
| `sector`, `industry` | 17 sectors; **1,496 of 2,390** records are `Capital Goods`. Of 44 records with "Bank" in the name, 30 are `Capital Goods` and 1 is `Financial Services`. The reassessment's own taxonomy file states on every row that it is "not an independently published NSE basic-industry attribution", and it agrees with the master on 959 of 2,390. | Not a classification of the companies. The manifest already forbids consumers to derive meaning from it. |
| `bseScripCode`, `bseSymbol` | Equal to an exact ISIN join with the bundle's BSE export for all 2,290 dual-listed records. 100 records are marked `UNLISTED-BSE`. | The codes match their source. They are not exported, because the source has no listing date and no series (section 5.3). |
| `tickSize`, `lotSize`, `faceValue` | Tick is uniformly 0.05 under a disclosed limitation. | Not exported. |

The master has no `series` field. The measurement above confirms series `EQ` for every record.

### 2.3 The proposal

This is the text put forward for approval. It is a proposal by the investigating agent. It has no force until the required authority approves it.

**P-1. Subject.** The three files produced by mapping `IPD-IRR-IDENTITY-EXPORT-MAPPING-1` from P04 batch `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`, master checksum `b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4`:

| File | SHA-256 |
|---|---|
| `eligible-roster.json` | `078e89cc1896d0f59e09e2ad05a12378e248cd81b97775ee7667b5f1e750e937` |
| `listing-map.json` | `6a330123a2fea31e9e1dd54f01e5adbe13f9721f077a5a82a34ee7cd60bcf458` |
| `corporate-actions.json` | `d6bc14d1b676260bb0f1c2280e62956d3f6a7e07b9b9265a73b49f821185ffcd` |

An approval covers these bytes only. A different master batch, mapping version or digest is a different subject and needs its own approval.

**P-2. Permitted use.** The files may be installed on the operator's own machine as IRR's identity sources, for one purpose: to resolve the operator's own holdings to an issuer, a security and an NSE listing, so that IRR's investment views can report which holdings are identified and which are not. The use is local, single-user and non-production, under the local personal-use decisions (A-12).

**P-3. Standing of the data.** The roster is an operator-supplied roster of IRR class `OPERATOR_SUPPLIED`: the operator attests to it; nobody has verified it independently. The source stays labelled `OFFLINE_BOOTSTRAP`. IPD continues to publish consumer eligibility as `NOT_ASSERTED`.

**P-4. What is not permitted.** Any use beyond P-2. In particular:

- P04 is not made product-wide authoritative identity. ID-4 and X-1 stand. No ADR is made or implied.
- No other consumer, no distribution, no production use.
- No statement that the roster is registry-verified, exchange-certified, complete or current.
- No use of the master's CIN, sector, industry, BSE, tick, lot or face-value fields by IRR, through this export or any other route.
- No label `REAL` and no upgrade of any provenance or quality label on the strength of this approval.

**P-5. Scope of records.** 2,388 securities of the NSE series-EQ universe as listed on about 2026-11-06, each exported as one issuer keyed by its equity ISIN, one security and one NSE listing. Two records are withheld (D2). There are no BSE listings, no corporate actions and no symbol history.

**P-6. Limitations accepted with the approval.** The eight limitation codes the export reports: `CIN_NOT_EXPORTED`, `SECTOR_UNCLASSIFIED`, `BSE_LISTINGS_NOT_EXPORTED`, `CORPORATE_ACTIONS_EMPTY`, `NO_SYMBOL_HISTORY`, `ELIGIBLE_MEANS_ACTIVE_NSE_LISTING`, `SERIES_FROM_UNIVERSE_DEFINITION`, `SOURCE_AUTHORITY_CONDITIONAL`. To these the approver should add two that this investigation found:

- A holding whose identity carries a series other than `EQ` will not resolve (section 5.3).
- The NSE file has no retrieval receipt (section 2.2).

**P-7. Additional qualification proposed before the host run.**

| # | Qualification | Why | Exists today? |
|---|---|---|---|
| Q-1 | Coverage of the operator's actual holdings: run `generate` with `--required-isins` on the host and report the covered and uncovered counts. | The approval should be given knowing how many of the 64 holdings the roster can cover. | The option exists. It has not been run on the host. |
| Q-2 | A dated copy of the official NSE list, obtained by the operator from the publisher, compared with the 2,388 exported records for ISIN, symbol and series. | Supplies the missing retrieval receipt and measures how far the roster has aged. | No comparison step exists. The sandbox cannot reach NSE. The alternative is to accept the gap explicitly under P-6. |
| Q-3 | A review date after which the approval lapses unless renewed. | The roster ages. A delisted or suspended security stays `ELIGIBLE` in it until the roster is replaced. A holding that is missing from it fails visibly; a holding that is stale in it does not. | The approver sets the date. |

**P-8. Approval authority.** The Program Authority, who is recorded as Ramki in the decision of 2026-10-19 (A-3) and who is also the operator and the repository owner. The approval has two sides, and one record can carry both:

- as IPD Program Authority: permitting this bounded export of the P04 master (producer side, C5);
- as the IRR operator: attesting the roster as `OPERATOR_SUPPLIED` and accepting it for the use of P-2 (consumer side, C6 and A-8).

Role A1 is not assigned to a person (A-13). Whether the authority of record "Sai/Ramki" requires both names is not settled by any record read (U-2).

**P-9. Acceptance evidence.** D1 is approved when item E-1 exists. W04 provisioning is complete when E-1 to E-5 exist and agree.

| # | Evidence | Content |
|---|---|---|
| E-1 | Approval record | A dated record on IPD `main`, in the approver's own words, that names: the batch and master checksum; the mapping version; the three digests of P-1; the IPD commit of the tool; the IRR commit it is to run against; the permitted use (P-2); the limitations accepted (P-6); the withheld count; the review date (Q-3); the answer to U-1; and the disposition of Q-1 and Q-2. A template is in section 2.6. |
| E-2 | Generation report | `provisioning-report.json` with result `PASS` and the same three digests. |
| E-3 | Loader gate | The gate record of `validate` against the IRR commit that runs on the host: accepted, roster class `OPERATOR_SUPPLIED`, 2,388 of 2,388 resolved both ways. |
| E-4 | Host installation | Output of the Windows wrapper: three files installed with the same digests, the location of the copy of any previous files, and the result of `Test-IrrIdentitySources.ps1`. |
| E-5 | Host resolution | The identities route answers 200 at the stated holdings revision, with counts by state and by reason. Counts only. A count of unresolved holdings is a valid result. |

E-3 shows that IRR can read the files. E-1 is the only item that gives them standing.

**Enforcement.** At `b0d7908` the tool did not check for E-1: `install` and the Windows wrapper ran without it (R). This record proposed that `install` should require the approval record and refuse when its digests do not match the staged files.

**Later record (2026-11-13): the check is built.** On the instruction of the repository owner, `install` and the Windows wrapper now refuse unless an approval record authorizes exactly the three staged files, their generation and the gated IRR commit, for the scope of P-2 and P-4, with the limitations of P-6 and the withheld records accepted, by the required authorities, before its review date. The record is a JSON document; its schema, the fixed policy, the procedure and the tests are in [approval enforcement](IIPS-W04-IDENTITY-PROVISIONING-APPROVAL-ENFORCEMENT-2026-11-13.md). Three points of that record bear on this one:

- The check represents U-1, U-2 and U-17 without answering them. It requires both named authorities while U-2 is open, and it requires the approval record to state the answers to U-1 and U-17.
- It differs from E-1 in one item: the IPD commit of the tool is not bound, because the record must be published on `main` after the tool commit it would name. The digests, the mapping version and the generation inputs are bound instead.
- Building the check is not an approval of D1, and the instruction to build it is not recorded here as one. **No approval record exists.**

### 2.4 Unresolved questions

| # | Question |
|---|---|
| U-1 | Do the five prerequisites of IRR's CV-22 Option C decision (A-7) apply to an operator-supplied roster under the Investment Intelligence design (A-8), or does that design's substitution of "the operator" for "Program Authority" replace them? No record states it. If they apply, their state is: (1) a contract exists as IRR's file schema and IPD mapping 1, but not as an "authoritative" contract; (2) batch, checksums and provenance exist, an effective period does not; (3) the mapping is documented and tested; (4) acceptance criteria are proposed here in P-9; (5) implementation authority would be E-1. |
| U-2 | Is one approver sufficient, given "Sai/Ramki" as the authority of record? |
| U-3 | How many of the operator's 64 holdings does the roster cover, and how many carry a series other than `EQ`? (H: 64 holdings at revision 1, security identity populated on 1.) |
| U-4 | Which CIN generation is correct. Not needed for the proposal, which exports no CIN. |
| U-5 | Whether the P04 package on the unmerged branch, which records its gate as accepted, is the specification of record. ID-4 on `main` is sufficient for this proposal either way. |
| U-17 | (Added 2026-11-13 with the approval enforcement; numbered after U-16 of section 5.6.) Does the item "Q-2, Roster content" of IRR's Investment Intelligence design refinement of 2026-11-05 govern a roster exported from P04? That item describes the roster as an operator-maintained file seeded from holdings and watchlist, capped at 200, ISIN required. The proposed roster has 2,388 issuers and is seeded from the P04 master. IRR's loader enforces no cap (R). No record says whether the item is a rule for every roster or a description of the expected one. |

### 2.5 Decisions that need approval

| # | Decision | Authority |
|---|---|---|
| D1-a | Approve, amend or reject the proposal P-1 to P-9. | Program Authority |
| D1-b | Answer U-1, U-2 and U-17. | Program Authority |
| D1-c | Require Q-1, Q-2 and Q-3 before the host run, or accept the gaps explicitly. | Program Authority |
| D1-d | Whether `install` is to enforce E-1 in code. **Later record (2026-11-13):** built on the instruction of the repository owner (section 2.3, "Enforcement"). What remains for the authority is to confirm or change the six choices listed in section 10 of the approval-enforcement record. | Program Authority |

### 2.6 Template for the approval record

This is a form, not an approval. It has effect only when the approver completes it and publishes it on `main`.

**Later record (2026-11-13).** The form the tool reads is the JSON document [`w04-identity-approval/IRR-IDENTITY-APPROVAL-RECORD-TEMPLATE.json`](w04-identity-approval/IRR-IDENTITY-APPROVAL-RECORD-TEMPLATE.json), which is blank. The text form below is kept as the list of what the approver decides; the tool does not read it. Two of its lines no longer describe a choice the tool offers: the tool accepts the decision `APPROVED` only (an amended use needs a changed policy), and enforcement in code is no longer optional.

```
W04 IDENTITY PROVISIONING — APPROVAL OF BOUNDED USE (D1)
Approver and capacity:
Date:
Decision:            APPROVED / APPROVED WITH AMENDMENTS / REJECTED
Subject:             batch BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001
                     master sha256 b555fd28…17d4c4, mapping IPD-IRR-IDENTITY-EXPORT-MAPPING-1
                     eligible-roster.json    078e89cc…e937
                     listing-map.json        6a330123…f458
                     corporate-actions.json  d6bc14d1…ffcd
IPD commit of the tool:
IRR commit to run against:
Permitted use:       as P-2 of the decision record of 2026-11-13 / amended as follows:
Not permitted:       as P-4 / amended as follows:
Limitations accepted: the eight export codes; series other than EQ unresolved; no retrieval
                     receipt for the NSE file (or: Q-2 required)
Withheld records:    2 (decision D2: )
CV-22 Option C prerequisites (U-1): apply / do not apply, because:
Second approver (U-2): required / not required
Qualification:       Q-1 required / waived;  Q-2 required / waived;  review date (Q-3):
Enforcement in code (D1-d): yes / no
```

## 3. D2 — the two withheld Jain Irrigation records

### 3.1 Established facts

| | Ordinary share | DVR share | Label |
|---|---|---|---|
| ISIN | `INE175A01038` | `IN9175A01010` | R |
| NSE symbol, series, date of listing (bundle NSE file) | `JISLJALEQS`, `EQ`, 13-AUG-2001 | `JISLDVREQS`, `EQ`, 30-NOV-2011 | R |
| BSE code, security name, group (bundle BSE export) | 500219, "Jain Irrigation Systems Ltd", A | 570004, "Jain Irrigation Systems Ltd_DVR", B | R |
| Depository description, FISN, CFI | "…EQ NEW F.V. RS.2/-", "SH VTG", `ESVUFN` | "…EQ NEW NPP RS.2/-", "SH VTG PP", `ESVUFN` | R |
| Face value | 2 | 2 | R |
| CIN in the P04 master | `L71907MH2002PLC659496` | `L77330MH1991PLC949716` | R |
| CIN in the bundle bridge and in the reassessment's derived file | `L29120MH1986PLC042028` | `L29120MH1986PLC042028` | R |

- **The company publishes the CIN `L29120MH1986PLC042028`** on its website and on the letterhead of its letter to BSE and NSE of 26 July 2025, signed by its Company Secretary (W, fetched). That letter's reference line reads "Code No. 500219 (BSE) & JISLJALEQS (NSE) for Ordinary Equity Shares; Code No. 570004 (BSE) & JISLDVREQS (NSE) for DVR Equity Shares".
- The link from each ISIN to its share class is therefore established in two steps: ISIN to symbol and code by the tracked NSE and BSE files (R), symbol and code to share class by the issuer's letter (W, fetched). **One legal entity, two listed equity share classes.**
- The master is wrong about this issuer in two ways: it gives one company two CINs, and neither is the CIN the company publishes (R against W). This is the rewritten CIN generation of section 2.2.
- These are the only two records the export withholds (R, test `IIX-53`). Exactly one company name has two EQ rows in the NSE file, and exactly one depository issuer name carries two master ISINs (R, measurement).
- **The exporter as built cannot admit either security.** A supplement that gives both ISINs the one CIN is refused with `SUPPLEMENT_CIN_CLAIMED_TWICE`. A supplement that names one ISIN is refused with `SUPPLEMENT_ISIN_NOT_EXPORTED`, because a withheld record cannot be supplemented (R, tests `IIX-54`, `IIX-55`; transcript `d2-supplement-refusals.txt`).
- **IRR's loader would accept the faithful representation.** One issuer keyed by that CIN with two securities of type `EQUITY` and two NSE listings loads, and IRR's resolver resolves each ISIN to its own security and to the one issuer. Typing the DVR share as `OTHER` is refused (`ASSESSABLE_NON_EQUITY`). IRR has no instrument type for DVR shares. Same result at IRR `main`, at the PR #563 head and on the merged tree (R, `irr-two-security-issuer-probe.json`).

### 3.2 Unresolved questions

| # | Question |
|---|---|
| U-6 | Does the operator hold either security? If not, the exclusion has no effect on the host. (Host fact.) |
| U-7 | The terms of the DVR shares. Secondary sources give one vote per ten DVR shares and disagree on the dividend (W, snippets). The depository file gives both ISINs the same CFI code, with "voting" in the third position (R). Not verified against an issuer document. |
| U-8 | The first NSE listing date of the ordinary share. The bundle's NSE file says 13-AUG-2001; a third-party page says 08-FEB-1995 (W, snippet; the page could not be fetched). |
| U-9 | What IRR's assessment engines do with one issuer that has two assessable equity securities, for example per-share figures and the issuer's weight in a portfolio. The loader and resolver were tested; the engines were not. |
| U-10 | Registry confirmation of the CIN. The issuer's own publication is strong evidence; it is not a registry extract. |

### 3.3 Decisions that need approval

| Option | What it means | What it needs |
|---|---|---|
| A. Keep both excluded | The current state. If the operator holds either, it is reported `ISIN_NOT_IN_ROSTER`, visibly. | Nothing. |
| B. Admit both under one issuer keyed by the published CIN | The faithful representation. | (1) An approved supplement with the CIN and its source. (2) A new mapping version in IPD: one CIN on several ISINs allowed when the supplement declares them one issuer, and withheld records made supplementable. (3) An answer to U-9. (4) A decision on how the DVR share is typed in IRR. (5) A new approval under P-1, because the digests change. |
| C. Admit the ordinary share only | The DVR share stays excluded. | Items 1, 2 and 5 of option B. |

**Recommendation of this record:** option A until U-6 is answered. If the operator holds neither security, no change is worth its cost. No option is taken here.

## 4. D3 — merge readiness of IRR PR #563

### 4.1 Established facts

| Item | Value | Label |
|---|---|---|
| State | Open, not a draft, base `main`, head `d10afbb31573d999f4b331484fcb79c510df1304` | R |
| Title | "Snapshot-to-Live W07: Financial limitation resolution (L-038, L-039, L-040 preservation) & XBRL ingestion fixes" | R |
| Content | 6 commits, 49 files, +11,444 / −97: identity (`7f3f7db`), W05, W07, W10 (two commits), W11. The description mentions identity once and W11 not at all. | R |
| Review | None. No review decision. | R |
| Mergeability | GitHub reports `MERGEABLE`, `CLEAN`. A local merge with `main` `08411bc` has no conflict (tree `7e554318…`). | R |
| CI | One check, "Typecheck · Test · Build", success at 2026-11-13T04:16:34Z. The merge commit that is now `main`, `08411bc`, is dated 07:07:13Z, after that run. The workflow is triggered by `frontend/**` and `.ci/**` and runs in `frontend/` only. | R |
| Checks run here, merged tree | `iips-platform`: typecheck 0, `npm test` 678 of 678, `test:iid` 913 of 913. `frontend`: three typechecks 0, vitest 2,929 passed and 1 skipped with 0 failed, `tsc -b` 0, `vite build` 0. | R |
| Checks run here, PR head | `iips-platform`: typecheck 0, 678 of 678, 913 of 913. | R |
| IPD loader gate | PASS at `08411bc`, at `d10afbb` and on the merged tree. | R |
| Separability | The identity commit `7f3f7db` merges onto `main` alone without conflict. The merged tree also merges with the other open pull request, #562, without conflict. | R |
| Relevance to W04 | Without the identity commit, IRR passes no ISIN and no exchange from a holding to its resolver, so no holding resolves whatever the roster holds (provisioning record, section 7). | R |

The transcript is `irr-pr563-merge-checks.txt`. The `iips-platform` checks are not run by any IRR workflow; they were run here by hand. A first pass reported two failures that were caused by a missing `node_modules` directory and disappeared after `npm ci`; they are not code failures.

**Assessment (D).** The change is technically ready: it merges cleanly and every check that exists passes on the result. It is not ready as a governed change, for four reasons that are facts about the pull request and not about its code:

1. The title and description name one work item of six. A merge would put W05, W10, W11 and the identity change on `main` under a W07 heading.
2. There is no review.
3. The recorded CI run is for a base that `main` has since left, and it does not run the platform tests that cover most of the change.
4. Merging is not acceptance of any work item. W04, W05, W07, W10 and W11 each keep their own acceptance evidence.

### 4.2 Unresolved questions

| # | Question |
|---|---|
| U-11 | Whether IRR `main` requires a review or an up-to-date CI run by rule. |
| U-12 | Behaviour on Windows and against the operator's holdings. Not run. |
| U-13 | Whether the owner wants the six items on `main` as one merge or separately. |

### 4.3 Decisions that need approval

| # | Decision | Authority |
|---|---|---|
| D3-a | Merge as it stands, after correcting the title and description to name all six items; or split, with the identity commit first. | IRR owner |
| D3-b | Whether to re-run CI on current `main` before merging, and whether the platform checks listed above are accepted as run by hand. | IRR owner |

**This record does not merge the pull request and does not recommend that an agent merge it.**

## 5. D4 — sources for the attributes the export lacks

No data was downloaded. The sandbox cannot reach any of the publishers. Every candidate below is identified from the web and must be confirmed by the operator before use; the publishers' terms of use were not read.

### 5.1 Issuer identity (CIN)

| | |
|---|---|
| **Held in IPD** | Three CIN generations (section 2.2): the master's, which is rewritten; the bundle bridge of 2026-11-07 (2,296 values), described as registry-derived; the reassessment's derived file (2,305 values: the 2,296 carried plus 9 statutory attributions). The registry file the bridge was matched against is not in the repository. |
| **Held in IRR** | Five issuers with a sourced CIN in the tracked real-issuer evidence packs. |
| **Candidate official source** | Ministry of Corporate Affairs company master data: a bulk dataset on the Open Government Data platform, and the MCA portal's company master, which needs a signed-in account (W, snippets). Owner: MCA. Coverage: all registered companies. |
| **Freshness** | The bulk dataset is a snapshot. A CIN changes when a company lists, delists, converts or moves its registered office to another state. |
| **Provenance of what is held** | The bridge was built by matching names. The depository file in the bundle has no CIN column, and the NSE and BSE files have none either (R). So nothing tracked links an ISIN to a CIN except a name match. |
| **Missing dependency** | A source that states ISIN and CIN together. Without one, every bridge is a name match, which is inference. Issuer filings carry both (as the Jain letter does) but one company at a time. Statutory corporations have no CIN, so a CIN-keyed roster needs a rule for them. |
| **Decision** | Whether a name-matched bridge is acceptable at all, and if so with what review. Until then the issuer key stays the equity ISIN. |

### 5.2 Sector classification

| | |
|---|---|
| **Held in IPD** | The master's taxonomy and the reassessment's taxonomy. Both are systematic assignments, and the second says so on every row. Neither is usable (section 2.2). The bundle holds the NSE Indices classification document of July 2023, which describes the structure and maps no security. |
| **Held in IRR** | The 13-row sector reference, the boundary accepted by CV-22 Option C. The export sets every issuer to `UNCLASSIFIED`. |
| **Candidate official sources** | NSE index constituent lists, for example `ind_nifty500list.csv`, with columns Company Name, Industry, Symbol, Series, ISIN Code (W, snippet of the NSE archive). Owner: NSE Indices. Coverage: index members only, so 500 securities for that list, not 2,388. BSE's "List of Security" download carries an industry column (W, snippet). Coverage: BSE-listed securities, so not the 100 NSE-only records. |
| **Freshness** | Constituent lists change at index reviews. The classification structure was aligned between NSE and BSE with effect from 31 March 2022 (W, snippet). |
| **Missing dependency** | (1) Coverage of the whole roster from one publisher. (2) A mapping from the publisher's classification to the sectors IRR's engines are certified for. The P04 package assigns that mapping to the methodology authority and calls a silent reclassification a methodology change (A-2). How IRR's engines consume the roster's sector was not examined. |
| **Decision** | The publisher, and the mapping to engine sectors. The second is a methodology decision, not a data task. |

### 5.3 BSE listings

| | |
|---|---|
| **Held in IPD** | The bundle's BSE export: 5,137 rows; 2,290 join the master by ISIN, one row each, all active, group A 700 and group B 1,590. Columns: code, issuer name, security id, security name, status, group, face value, ISIN, instrument. **No listing date and no series.** The P7 Dhan manifest: 596 records, of which 500 BSE with no series, 47 BSE `A`, 1 BSE `B`, 48 NSE `EQ`. |
| **Held in IRR** | Four BSE listings in tracked evidence packs, each written with series `EQ` and the numeric code as symbol. |
| **Candidate official source** | BSE "List of Security" (W, snippet): code, group, face value, ISIN, industry; a manual form download. Owner: BSE. |
| **Missing dependencies** | (1) A listing date: IRR's listing map requires `effectiveFrom`, and the BSE export has none. (2) **A series vocabulary.** IRR's series list is closed: `EQ`, `BE`, `BZ`, `N1`, `W1`, `SM`, `IT`, `MT`. BSE groups are not in it. |

**What IRR does with a BSE series today** (R, `irr-bse-series-probe.json`, identical at IRR `main`, the PR #563 head and the merged tree):

| Case | Result |
|---|---|
| A BSE listing with series `A` in the listing map | Loader refuses the whole set: `INVALID_LISTING_SERIES`. |
| A BSE listing with series `EQ` in the listing map | Loader accepts. |
| Export as it stands; observation with ISIN and series `A` | `AMBIGUOUS_LISTING`: the security is listed, but not in the series the observation names. |
| NSE `EQ` and BSE `EQ` listings; observation with ISIN and series `A` | `AMBIGUOUS_LISTING`, with or without the BSE symbol. |
| NSE `EQ` and BSE `EQ` listings; observation with ISIN, series `EQ` and the BSE symbol | Resolved to the BSE listing. |

IPD's qualified identity takes its series from the P7 Dhan master (A-10), where a BSE holding carries a group such as `A`, or no series. IPD builds the identity from the explicit series token and infers nothing (`buildD114SecurityIdentity`); IRR passes the token to its resolver as it is, in upper case. **So a BSE-held position with a qualified identity resolves to `AMBIGUOUS_LISTING` in IRR, and adding BSE listings to the roster does not change that** unless they are written as `EQ`, which is the inference A-10 forbids to IRR. This is a disagreement between the two repositories' models, not a missing dataset (D).

| | |
|---|---|
| **Decision** | How a BSE listing's series is represented across the two repositories: extend IRR's series list, map BSE groups to a neutral token by an explicit rule, or leave BSE holdings unresolved and reported. Owners: IRR for its identity model, IPD for the D114 series. Until it is made, sourcing BSE listing data has no effect. |

### 5.4 Corporate actions

| | |
|---|---|
| **Held in IPD** | None. The P04 package assigns corporate actions to phase P08 (A-2). |
| **Held in IRR** | A corporate-action table schema with a closed set of action types, including split, bonus, merger, demerger and symbol change. The tracked tables hold 0 actions. |
| **Candidate official source** | NSE's corporate-actions page with a CSV download by company, purpose and period (W, snippet of the NSE page). Owner: NSE. BSE publishes its own. |
| **Missing dependency** | A parser from the publisher's free-text "purpose" to IRR's action types and ratios; a start date for history; a rule for actions that change the ISIN. None exists. |
| **Decision** | Whether W04 needs corporate actions at all for resolving current holdings as of today. An empty table is valid and disclosed. This looks like P08 work, not a W04 blocker. |

### 5.5 Symbol history

| | |
|---|---|
| **Held in IPD** | The current NSE symbol and the date of listing. The listing map dates each current symbol from the listing date, which is wrong for any security that was renamed. |
| **Held in IRR** | A `SYMBOL_CHANGE` action type and dated listing windows. No data. |
| **Candidate official source** | NSE's symbol-change and name-change files, `symbolchange.csv` and `namechange.csv` (W, third-party snippets only; not confirmed on an NSE page). Owner: NSE. |
| **Missing dependency** | Confirmation of the files and their layout. No BSE equivalent was identified. |
| **Decision** | As for corporate actions. For resolving today's holdings by ISIN the gap has no effect; it matters for a holding identified only by an old symbol, and for any historical date. |

### 5.6 Unresolved questions

| # | Question |
|---|---|
| U-14 | The publishers' terms for storing and using each file in a personal application. Not read. |
| U-15 | Whether each candidate file exists at the stated location with the stated layout. Only search excerpts were seen. |
| U-16 | Which of the five attributes IRR's assessment actually needs before a holding can be assessed, as distinct from identified. |

### 5.7 Decisions that need approval

| # | Decision | Authority |
|---|---|---|
| D4-a | Whether a name-matched ISIN-to-CIN bridge is acceptable, or the issuer key stays the equity ISIN. | Program Authority |
| D4-b | The sector publisher and the mapping to engine sectors. | Methodology authority (Ramki/Sai, per A-2) |
| D4-c | The representation of a BSE series across IPD and IRR. | IRR owner and IPD owner |
| D4-d | Whether corporate actions and symbol history are W04 scope or P08 scope. | Program Authority |

## 6. Status and exit condition

- **W04: PARTIALLY COMPLETE, NOT ACCEPTED.**
- **Provisioning is blocked until D1 is approved** by the Program Authority in a record that meets E-1. The Windows wrapper is not to be run for installation before that. At `b0d7908` the tool did not enforce this; it now does (section 2.3, "Enforcement"). The wrapper's `-ReviewOnly` mode installs nothing; whether it is run on the host before D1 is approved is for the owner to say.
- Loader acceptance (E-3) is evidence that IRR can read the files. It is not evidence that the data has authority, and it is not an approval.
- The two Jain Irrigation records stay excluded.
- IRR PR #563 is open and unmerged. W03, W08 and W11 are not accepted.
- Order of what comes next: D1-a to D1-d; then D3; then the host run and E-2 to E-5. D2 and D4 do not block the host run.

## 7. Tests and evidence

| Tests | File | What they pin |
|---|---|---|
| `IDF-01` to `IDF-07` | `tests/w04_identity_source_facts.test.ts` | The measurements of section 2.2: the master's CIN and sector fields against the reassessment files, the BSE codes, and that no master CIN reaches the export. |
| `IIX-53` to `IIX-56` | `tests/irr_identity_source_export.test.ts` | Section 3.1: the two withheld records, the two refusals, and that neither security reaches the export. |

A test of this kind shows that two tracked files differ, or that the exporter refuses. It does not show which file is right.

Repository checks at this change are recorded in the evidence README.

## 8. Not examined, not shown

- The Windows host, the 64 holdings and their series.
- Any registry. No CIN was verified against MCA.
- Any publisher's file. No candidate source of section 5 was downloaded or opened.
- IRR's assessment engines: how they use sector, and how they treat one issuer with two equity securities.
- IRR PR #563 on Windows, in a browser, or in the composed server.
- The P04 package's standing as specification of record.
