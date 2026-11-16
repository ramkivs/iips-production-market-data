# Snapshot-to-Live W04 — evidence reconciliation and acceptance assessment

**Date:** 2026-11-16
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md))
**Type:** record only. It consolidates evidence that already exists. It ran nothing on the Windows host, read no database, imported nothing, assigned no identity, changed no tool file and wrote nothing to IRR.
**Repositories read:** IPD `ramkivs/iips-production-market-data` at `main` `75db511d2d322d39d76c66b603adaf780913ef1f`; PR #166 head `742adba6b9964706a5e8cd901d4f2a3c1332f00a`; PR #156 head `a93278fb32fbfe31f01e0572950734cc836fb86f`; PR #163 head `3a656c2c4bf7181c04e360c64227003c7b577090` (not changed); branch `arena/c32aea42-iips-production-market-data` at `8132c5b6bba0051cbac95dab060096f2983e7396`. IRR `ramkivs/iips-review-recovered` through the GitHub API only, at `main` `064195397dfdb32bf0f34a461b02fd6b9f9a8df0`.
**Evidence folder of this record:** [`evidence/integration/w04-evidence-reconciliation-2026-11-16/`](../../evidence/integration/w04-evidence-reconciliation-2026-11-16/README.md)
**Second pass, 2026-11-16:** made against IPD `main` `d80d77345bed965c2a7e660ef272fd53a234d0a7` and the same heads of PR #156, PR #163, branch `arena/c32aea42-…` and IRR `main` as above, all read again. It resolves the difference in the D02 document (section 3.3.1), carries the inventory archive to `main` unchanged (section 3.3), and assesses the roadmap criteria (sections 8.3 to 8.5). It ran nothing on the host and repeated no verification.

**Result.** W04 is **measured: 1 of 64 holdings of revision 1 has a stored security identity, 63 have none.** Identity coverage is **not complete** and is not claimed. **The W04 acceptance criteria of the roadmap are met as measured**, with three recorded limits that do not prevent it (section 8.3). Acceptance as measured, 1 of 64 with 63 unresolved, is recommended. The statement of acceptance is the Principal's, and this record does not write it for him (section 10).

## 0. Summary

| W04 dimension | State | Grade of the evidence |
|---|---|---|
| Registry readiness | Ready. P7 registry published with 4,680 qualified mappings; all 64 original holdings are members | Registry: R. Membership of the 64: H, summary only |
| Installation and verification | Complete on 2026-11-14. IRR loader and resolver: 2,388 of 2,388 by ISIN and by exchange and symbol | H; every reproducible value equals the sandbox run (R) |
| Actual identity coverage | **1 of 64 stored; 63 explicitly unresolved** | HO, from two separate host outputs held in the repository |
| IRR integration | Merged on IRR `main` at `0641953`: a stored identity now reaches the IRR resolver | R for the merge and its checks. The host run of that code: U |
| Evidence completeness | Incomplete in named places (section 7) | — |
| W04 acceptance | Roadmap criteria met as measured. Acceptance as measured recommended: 1 of 64, 63 unresolved | Section 8 |

## 1. How to read this record

| Label | Meaning |
|---|---|
| **H** | Reported by the Principal from the Windows host as a summary. The output itself is not in the repository. Not verified here. |
| **HO** | Host output held in the repository. The Principal produced it on the host. This record checked the file's digests and its internal consistency and read the figures from it. The host was not accessed. It is stronger than H and it is still host evidence, not independent verification. |
| **R** | Verified for this record from tracked repository content or from the GitHub API. |
| **D** | Derived from the above. Each derivation states its condition. |
| **U** | Not available. |

## 2. What was reconciled

| Source | State on 2026-11-16 | W04 content | Treatment |
|---|---|---|---|
| IPD `main` `75db511` | — | W04 roadmap entry of 2026-11-15, 13 W04 records, the E4 host output, the P7 registry | Base of this record |
| IPD `main` `d80d773` (second pass) | PR #170 merged 2026-11-16T19:37:46Z | None. Eight files of Dhan provider code and tests | Merged into this branch. No file in common with this record |
| PR #166, head `742adba` | Open | Roadmap block for the superseding approval `W04-D1-20261115-01` | Kept as written; a later record is added under it (section 3.6) |
| PR #156, head `a93278f` | Open, 36 commits ahead of its base, 39 behind `main` | Its last two commits only: two W04 documents and one roadmap line. The other 34 commits are Dhan provider work | The two documents are carried with a note; the roadmap line is not carried (section 6) |
| PR #163, head `3a656c2` | Open | Import qualification | **Not changed** |
| Branch `arena/c32aea42-…`, head `8132c5b` | No pull request | The read-only database inventory of 2026-11-16 | Counts recorded here. The archive is carried to `main` unchanged (section 3.3). The D02 document of that branch is not carried; it is corrected by section 3.3.1 |
| IRR `main` `0641953` | Merged 2026-11-16T19:03:51Z | Identity projection | Recorded (section 3.5) |
| IRR PR #566, head `92eda04` | Open | Supersession record for the approval | Referenced; not changed |

## 3. The evidence of record

### 3.1 Installation and loader verification, 2026-11-14

Record: [host completion and reconciliation](IIPS-W04-IDENTITY-PROVISIONING-HOST-COMPLETION-RECONCILIATION-2026-11-14.md). Nothing in it is changed.

| Item | Value | Label |
|---|---|---|
| Approval used | `W04-D1-20261114-01`, approved `2026-11-14T04:57:48Z`, record SHA-256 `bf5d6918e1245d65fe3e26406537585e28aa5ba6b2e055c79da5c9975177ad69` | H |
| Installed files | `eligible-roster.json` `078e89cc1896d0f59e09e2ad05a12378e248cd81b97775ee7667b5f1e750e937`; `listing-map.json` `6a330123a2fea31e9e1dd54f01e5adbe13f9721f077a5a82a34ee7cd60bcf458`; `corporate-actions.json` `d6bc14d1b676260bb0f1c2280e62956d3f6a7e07b9b9265a73b49f821185ffcd` | H; equal to the sandbox generation (R) |
| Content | 2,388 issuers, 2,388 securities, 2,388 listings (all NSE, series EQ), 0 corporate actions; 2 records withheld | H; R |
| IRR loader, at `08411bc` | Accepted, class `OPERATOR_SUPPLIED`, 0 issues | H; R |
| IRR resolver over the roster | **2,388 of 2,388 by ISIN; 2,388 of 2,388 by exchange and symbol** | H; R |
| Source versions computed by the loader | roster `sha256:4baa4e596f84741018e03c08248faf89ff19a37b3d1877220d56dc27aafe7199`; listing map `sha256:b04416b290d1b6fe682717505f9ecd940e025ee6e0d6d1dc0f68f105604a0dca`; corporate-action table `sha256:0b1d3cbfe52c62afbfabffe2a8ed66dd4a0812ca712f05e1ed9a58caa4b75819` | H; R |
| Running transport loads the files | Probe result PASS | H |

The R of this table is the sandbox gate receipt on `main`, [`irr-loader-gate-08411bc.json`](../../evidence/integration/w04-identity-source-provisioning-2026-11-13/irr-loader-gate-08411bc.json). The host terminal output, the approval record and the install receipt are not in the repository (section 7).

### 3.2 Registry verification of the 64 holdings, 2026-11-15

Records: [registry regeneration](IIPS-W04-P7-REGISTRY-REGENERATION-2026-11-15.md), [host verification](IIPS-W04-P7-PUBLISHED-MANIFEST-HOST-VERIFICATION-2026-11-15.md). Nothing in them is changed.

| Item | Value | Label |
|---|---|---|
| Published P7 manifest | SHA-256 `69a918f78791114e8fb036ddfd2a2005facdddf785a7496bc28f541fd4964769`, 4,680 qualified mappings, pipeline commit `325266d684f857a377d55b147e7306e02c7a495a`, on `main` since PR #164 | R |
| Host result | `ALL_64_MATCH_PUBLISHED_MANIFEST`, exit code 0; 15 checks passed, 0 failed, 0 warnings; nothing unresolved | H |
| Result JSON SHA-256 | `da36143a2c2e5b5c026729e53782c39b9b29b8471df2e123f89c2f79fb657326` | H. The JSON is not held, so the digest was not recomputed |

This shows that each of the 64 original holdings is an exact member of the registry as published. It assigned no identity and changed no stored holding. It is a Principal-supplied summary: the complete host output is not in the repository.

### 3.3 Portfolio inventory, 2026-11-16

The Principal ran the read-only D02 D5/D16 inventory on the host database and published its archive on branch `arena/c32aea42-iips-production-market-data`. The run was made for the D02 ownership work. Its figures for `DHAN_PORTFOLIO` are W04 evidence. The archive is now also on `main`, unchanged: [archive](../../evidence/d02-inventory-2026-11-16/windows-host/d02-d5-d16-inventory-20261116T143819255Z-96672044.zip).

| Item | Value | Label |
|---|---|---|
| Archive | `evidence/d02-inventory-2026-11-16/windows-host/d02-d5-d16-inventory-20261116T143819255Z-96672044.zip`, 27,601 bytes, SHA-256 `813183b382a26d0b6affeeaee04d44b0ea0057bea140a83221b460d8720da1b3`, Git blob `36364ca514f2c126f97017abcd371bdeb752b2fd`, added by commit `cd6c0bb8e711e18e4b7f4fba5fdba3b5303c1307` | R |
| Integrity of the archive | 17 entries; the 16 entries other than the manifest equal the archive's own `sha256s.txt` | R |
| Run | `2026-11-16T14:38:20Z`, disposition `INVENTORY_COMPLETE_READ_ONLY_VERIFIED`, exit code 0; 21 of 21 statements executed; `PRAGMA query_only` = 1 inside the snapshot | HO |
| Database before and after | SHA-256 `6d683b3b897f09156fd51bd7ba6e5cfc3a69f734a00da9f12c103da720b70673` both times; no sidecar file; file time `2026-11-12T10:45:20.439Z` unchanged | HO |
| `DHAN_PORTFOLIO` | `ACTIVE`, current revision **1**, one revision, operation `INITIAL`, 64 holdings declared and 64 present | HO |
| Holdings of revision 1 | **64, all active** | HO |
| Stored security identity | **populated on 1, `NULL` on 63** | HO |
| `identity_status` / `resolution_disposition` | `RESOLVED` / `CANONICAL_P04` on all 64. These are company-level fields, not security identity | HO |

The counts are reproduced from the archive by [`extract_w04_inventory_counts.py`](../../evidence/integration/w04-evidence-reconciliation-2026-11-16/extract_w04_inventory_counts.py); its output is [`portfolio-inventory-counts-2026-11-16.json`](../../evidence/integration/w04-evidence-reconciliation-2026-11-16/portfolio-inventory-counts-2026-11-16.json).

**Same import as the earlier records (R).** The content digest of the portfolio's one contribution in the archive is `a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107`, the import-content digest of the original CSV in the [E4 record](IIPS-W04-E4-ORIGINAL-CSV-LINEAGE-REPRODUCTION-UTILITY-PREPARED-2026-11-14.md). The provenance digest of revision 1 in the archive equals the one the PR #156 census names. The inventory, the E4 run and the census therefore describe the same revision.

**No write since 2026-11-12 (D).** The file time of the database is `2026-11-12T10:45:20.439Z`. On the condition that the file time is a true record of the last write, none of the host steps of 14, 15 and 16 November wrote to the database, and the stored holdings are those the capture recorded on 2026-11-13 describes. The counts agree: 64, 1 and 63 in the capture, in the E4 output and in the inventory.

**The archive is carried to `main` unchanged (R).** The first pass of this record left the archive on its branch, because its result file states `LOCAL_PRINCIPAL_REVIEW_REQUIRED_BEFORE_EXTERNAL_SHARING`. On 2026-11-16 the Principal stated that the archive is intentional test data and is not to be sanitized or removed. That is the review the notice asks for. The archive is therefore copied to `main` at the path it has on its branch, as the same Git blob `36364ca514f2c126f97017abcd371bdeb752b2fd`, so that the W04 measurement no longer rests on a branch without a pull request. No byte of it was changed. The copy on branch `arena/c32aea42-…` is untouched.

### 3.3.1 Correction to the D02 reconciliation document

The document `docs/integration/IPD-D02-D5-D16-LIVE-EVIDENCE-RECONCILIATION-2026-11-16.md` describes the archive of section 3.3. It exists only on branch `arena/c32aea42-…`, written by commit `8132c5b6bba0051cbac95dab060096f2983e7396` (17,702 bytes, SHA-256 `d4993aefa2beaaa89c605c46db4a3c9efdbf9e63ff2fd8adba513e09ae84e38d`). For `DHAN_PORTFOLIO` it differs from the archive in three values, all on its line 80.

| Field | The document, line 80 | The archive | Statement of the archive |
|---|---|---|---|
| `portfolio_name` | `Dhan Broker Holdings` | `DHAN_PORTFOLIO` | Q06 |
| `total_market_value` of revision 1 | `3353794.55` | `468500.4000000001` | Q07 |
| `weight_sum_percentage` of revision 1 | `100.01` | `100.00000000000003` | Q07 |

**The values of the archive are authoritative (R).** The archive is the output of the host run. Its SHA-256 and its 16 manifest entries were checked. The document is a narrative written after the run. The stored name of the portfolio is the same text as its identifier.

**Why they differ (R, to the extent the repository shows).** The three values of the document were not taken from the archive, and they have no other source:

- None of the three occurs in any of the 17 entries of the archive.
- A search of the whole history of this repository, all fetched branches included, finds the two numbers in one commit only, `8132c5b`, and in one file only, the document. That commit wrote the document in a single step. The same search finds the name there and in the header comment of one test file, where it is the title of a workstream.
- The other files of the D02 evidence on that branch (the evidence README, the status JSON, the decision package and the tracker) do not carry them.
- The two numbers are not the values of another portfolio or revision of the database. The archive holds 13 revision totals; none equals `3353794.55`, and no sum of them does.
- A code search of IRR `main` does not find the market value. It finds the words "Dhan Broker Holdings" in earlier records as the title of the import workstream. They are not a stored portfolio name.

The cause is an authoring error in the narrative: the three values were written without a source. The commit names an automated agent session as co-author. How the two numbers were arrived at cannot be recovered from the repository, and this record does not guess.

**What line 80 has right.** Every other value on it equals the archive: the creation time, revision 1, `INITIAL`, broker `DHAN`, 64 active holdings, 1 populated and 63 `NULL` security identities, `RESOLVED`, `CANONICAL_P04`, and one `SAVED_NEW_BATCH` contribution.

**Two further points from the same comparison.**

1. Line 59 of the document gives "Total tables: 13". The archive shows 10 tables and 7 indexes. 13 is the number of revisions.
2. Line 81 gives `amount = 500` for the one contribution of the portfolio named `TEST`. The archive holds no contribution amount, because statement Q09 does not select that column. The archive neither supports nor contradicts the figure. 500 is the total market value of revision 2 of that portfolio.

The comparison covered line 80 in full and these two points. It is not an audit of the whole D02 document.

**Effect.** None on W04: the revision, the holding count and the 1 and 63 are equal in both. None was found on the D02 dispositions of the document: it states that a portfolio name is never treated as ownership evidence, and no disposition in it uses the market value, the weight sum, the table count or the amount.

**How it is corrected.** This section is the correction of record on `main`. The document itself is on a branch that this work cannot write, so it is not edited; a comment carrying this correction is attached to commit `8132c5b` on GitHub. When the D02 branch is next worked on, lines 59, 80 and 81 are to be corrected there from the archive. The archive and the test data are not changed.

The comparison is reproduced by [`compare_d02_document_with_archive.py`](../../evidence/integration/w04-evidence-reconciliation-2026-11-16/compare_d02_document_with_archive.py); its output is [`d02-document-archive-comparison-2026-11-16.json`](../../evidence/integration/w04-evidence-reconciliation-2026-11-16/d02-document-archive-comparison-2026-11-16.json).

### 3.4 Import lineage (E4), 2026-11-14

Record: [E4 lineage reproduction](IIPS-W04-E4-ORIGINAL-CSV-LINEAGE-REPRODUCTION-UTILITY-PREPARED-2026-11-14.md), sections 12 to 15. Nothing in it is changed.

- `REPRODUCED_ALL`, exit code 0: 64 of 64 stored lineage digests reproduced from the original CSV and the capture; the whole-import digest reproduced (HO: the complete sanitized output is on `main`, [`w04-e4-csv-lineage-output.txt`](../../evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/host-run-2026-11-14/w04-e4-csv-lineage-output.txt), SHA-256 `518d76c31fef9351175d179839322165432977dd04f9c69b6accd217597860de`).
- **All 63 holdings without an identity had an ISIN and an exchange in the committed input** (NSE 62, BSE 1): class C.
- Class C states what the import contained. It is not a cause. On two conditions that are not established on the host, the cause is a missing P7 registry mapping at the time of the import. The typed reason was not kept and cannot be recovered. The Broker Import evidence journal was not found on the host.

### 3.5 IRR integration merge

Read through the GitHub API on 2026-11-16; readback in [`irr-merge-readback-2026-11-16.json`](../../evidence/integration/w04-evidence-reconciliation-2026-11-16/irr-merge-readback-2026-11-16.json). All R.

| Item | Value |
|---|---|
| Merge commit | `064195397dfdb32bf0f34a461b02fd6b9f9a8df0`, IRR PR #568, merged `2026-11-16T19:03:51Z` |
| On IRR `main` | Yes: it was the head of `main` when read |
| Parents | `fa4e298791be8a0f68ffa7521736539bcce722bd` (`main`), `7f53974e44c4ee89d4d253758b15bf15ac3a5a25` (branch) |
| Checks on the merge commit | `Typecheck · Test · Build`: success. `Python compile · source/evidence/tracker validation`: success |
| What it carries for W04 | Commit `7f3f7db`: a holding's stored D114 `securityIdentity` is projected into the resolver input. Commit `8765860`: a test that carries a persisted holding over the real read path into the resolver input. Both are ancestors of the merge |
| IRR PR #563 | Superseded by #568; shown as merged at `2026-11-16T19:03:53Z` |
| Gated commit `08411bc` | An ancestor of the merge, 26 commits behind it |

**The loader gate and the merged code (R, D).** The gate of section 3.1 ran at `08411bc`. Between `08411bc` and the merge, IRR's identity loader and resolver sources changed. `main` also holds a sandbox gate receipt at `d10afbb`, [`irr-loader-gate-d10afbb.json`](../../evidence/integration/w04-identity-source-provisioning-2026-11-13/irr-loader-gate-d10afbb.json): the same three files, accepted, 2,388 of 2,388 both ways, the same three source versions. Between `d10afbb` and the merge no file under `iips-platform/src/investment/identity/` changed, nor the two transport files. So the loader and resolver sources of IRR `main` are the ones that receipt was run against. That receipt records an IRR working tree that was not clean; the gate was not re-run at `0641953`.

**What the merge does not show.** It does not show which IRR commit the host runs, and no run of the merged code against revision 1 is in the repository (U). The pull request states, with a test, that a stored `NULL` identity stays unresolved and that nothing is inferred from the symbol. The merge alone therefore cannot raise the count above 1.

### 3.6 Approvals and authorization

| Record | State | Use |
|---|---|---|
| `W04-D1-20261114-01` | Used for the installation of 2026-11-14. Review date `2026-11-14T18:29:59Z`, passed | Historical. Unchanged |
| `W04-D1-20261115-01` | Approved `2026-11-15T19:37:36Z`, record SHA-256 `70d49544845120755adff9b5f39bc0de216c6a983fa0dbbdcd613ab9b26b440d`. Review deadline `2026-11-16T18:29:59Z`, **passed with no installation under it** | **Historical. Unchanged.** The roadmap block of PR #166 is kept as written |
| Standing personal-application authorization | Roadmap, section "Authority and operating model": Ramki is the PERSONAL APPLICATION PRINCIPAL and single decision authority for this local, single-user, non-production application; routine in-scope work needs no repeated approval | The authority under which this record is made. No production governance is assumed |

**No new approval is needed for W04 as measured (R, D).** The superseding approval was needed because a provisioning run staged against the published manifest is refused with `GENERATION_MISMATCH`. The three IRR files do not depend on that manifest: with the regenerated manifest the export produces the same three files, with the same digests as those installed on 2026-11-14 ([regeneration record](IIPS-W04-P7-REGISTRY-REGENERATION-2026-11-15.md), section 3, test IIX-04), and IRR reads those three files only. A new installation would therefore write the bytes that are already installed. On the condition that the installed files are unchanged since 2026-11-14, nothing remains to install, and the lapse of the approval leaves the host identity sources as verified. The earlier roadmap sentence "W04 is not accepted while it is open" referred to that dependency; it is closed by this finding, not by a new approval and not by an installation.

A later import, repair or re-provisioning is separate work. It is not part of this record.

## 4. Identity census of revision 1

Portfolio `DHAN_PORTFOLIO`, revision 1, one import, 64 holdings.

| W04 category | Count | Basis | Label |
|---|---:|---|---|
| Qualified security identity (stored D114 object) | **1** | Inventory of 2026-11-16; capture of 2026-11-13; E4 output | HO |
| Ambiguous | 0 | PR #156 census, from an identities-route read reported to that session | H |
| Missing / unresolved (no stored security identity) | **63** | Inventory; capture; E4 output. Resolver reason `NO_IDENTIFIER_PROVIDED`: reported in the PR #156 census, and the outcome the IRR source gives for a `NULL` identity | HO; H; D |
| Expired / ineligible | 0 | PR #156 census | H |
| Unavailable (source could not be read) | 0 | PR #156 census: the route answered with 64 rows and the three sources loaded | H |
| **Total** | **64** | Declared and actual holding counts agree; 64 of 64 lineage digests reproduced | HO |

Reading notes:

- The [assessment of 2026-11-13](IIPS-W04-IDENTITY-COVERAGE-REVISION-1-EVIDENCE-ASSESSMENT-2026-11-13.md) counted the 63 as "unavailable" because the reason for the missing identity was not retained. The PR #156 census counts them as "missing". Both describe the same 63 rows. This record uses "missing / unresolved" for the rows and keeps "unavailable" for a source that could not be read.
- The zeros rest on the PR #156 census alone. Its route response is not in the repository (section 7, item 4).
- `RESOLVED` and `CANONICAL_P04` on all 64 are company-level results. They are not counted as security identity.
- **The 63 are unresolved. No identity is inferred for them from a symbol, a company or the registry membership of section 3.2.**

Source versions for the census:

| Source | Version | Label |
|---|---|---|
| P04 security master | batch `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`, 2,390 records, SHA-256 `b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4` | R |
| P7 registry tracked at the time of the import | manifest `13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc`, 96 mappings | R. Which registry the host loaded at import: U |
| P7 registry published now | manifest `69a918f7…4769`, 4,680 mappings | R |
| IRR roster, listing map, corporate-action table, as installed | The three versions of section 3.1 | H; R |
| The same three, as served when the census was read | Roster reported as `sha256:4baa4e…`, which agrees with the installed version. **Listing-map and corporate-action versions: not captured** | H; U |

IRR computes each version from the content of the file. On the condition that the installed files were not changed between the installation and the read, the served listing-map and corporate-action versions are `sha256:b04416b2…0dca` and `sha256:0b1d3cbf…5819` (D). That is a derivation, not an observation.

## 5. The PR #156 census, and the statements that later evidence replaces

PR #156 holds two W04 documents, written on 2026-11-14, when IPD `main` was `a624d06` and IRR `main` was `08411bc`, before PRs #157 and #160 to #165 were merged:

- [identity semantics and coverage acceptance basis](IIPS-CURRENT-PORTFOLIO-W04-P04-D114-IDENTITY-SEMANTICS-AND-COVERAGE-ACCEPTANCE-BASIS-2026-11-14.md) ("the basis document");
- [identity provenance and governance completion](IIPS-CURRENT-PORTFOLIO-W04-IDENTITY-PROVENANCE-AND-GOVERNANCE-COMPLETION-2026-11-15.md) ("the provenance document"; it carries the date 15 November, its commit is dated `2026-11-14T09:25:40Z`).

**Carried forward unchanged.** The separation of the two identity layers: the P04 status is a company-level result and the D114 object is the security-level fact (basis document, sections 2 to 4). The category counts 1 / 0 / 63 / 0 / 0 (section 5.2). The rule that `1/64` is a measurement and not a threshold, and `THETA_I = NOT YET ESTABLISHED` (section 7). The finding that corporate actions are not consulted in primary resolution (provenance document, section 3.2). The draft eligible-scope rule, as a draft (section 4.4).

**Replaced.** The documents are kept as written; the table states what now stands.

| # | Statement in the PR #156 documents | Standing | What the evidence shows |
|---|---|---|---|
| 1 | The broker export supplied no usable security identifier for the 63 rows; the gap is an identifier-supply gap; the remedy is an export with ISIN and exchange columns (basis 4.3, 5.4, 6, 7.5, W04-02; provenance 5) | **Superseded** | All 64 rows had an ISIN and an exchange in the committed input; 64 of 64 lineage digests reproduce from the original CSV (section 3.4). The identifiers were supplied. The identity was not stored at import. The series is never supplied by the broker or by IRR; it comes from the P7 registry |
| 2 | "What is missing is source data, not code" (basis 7.5) | **Superseded** | The cause of the 63 is unproven. The hypothesis on record is a missing P7 mapping in the registry of that time (96 mappings). All 64 are members of the registry published on 2026-11-15 (section 3.2). No new source file is needed for them |
| 3 | The roster digest is known only in truncated form (provenance 2.1, 2.8) | **Superseded** | Full value on `main`: `sha256:4baa4e59…7199` (section 3.1) |
| 4 | The listing-map and corporate-action versions can be obtained only by re-reading the endpoint; closure condition C1 is a host re-read (provenance 2.2, 7.5) | **Narrowed** | The versions of the installed files are on `main` (section 3.1). Only the response of the route at the time of the read is absent (section 4) |
| 5 | No artifact names who authored the roster; there is no generator; the authoritative issuer source is unnamed (provenance 2.1, 2.8, 5.4, C5) | **Superseded** | The three files are generated by IPD's provisioning tool from the P04 master named in section 4. The roster is operator-supplied and not authoritative, by its own limitation `SOURCE_AUTHORITY_CONDITIONAL` ([provisioning record](IIPS-W04-IRR-IDENTITY-SOURCE-PROVISIONING-2026-11-13.md), [decision record](IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md)) |
| 6 | 2,388 and 2,390 are not reconciled (provenance 2.7) | **Superseded** | 2,390 master records less 2 withheld records of one two-class issuer gives 2,388 ([host completion record](IIPS-W04-IDENTITY-PROVISIONING-HOST-COMPLETION-RECONCILIATION-2026-11-14.md), sections 2.1 and 2.2) |
| 7 | The cause of the zero corporate actions is unknown (provenance 3.3, C4) | **Superseded** | The export writes an empty table. Limitation `CORPORATE_ACTIONS_EMPTY`: none recorded, not none occurred. Accepted by name in approval `W04-D1-20261114-01` |
| 8 | IRR PR #563 is open and unmerged (both documents; W04-08) | **Superseded** | Merged on IRR `main` through PR #568 (section 3.5) |
| 9 | The `active` distribution of the 64 rows was deliberately not read (provenance 4.4, A2) | **Superseded as a fact** | The inventory shows 64 of 64 active (section 3.3). "Active positions only" and "all captured rows" give the same 64 rows, so the choice of rule cannot change the count for this revision. The rule itself is still not stated by the Principal, and θI is still not established |
| 10 | "`\|T\| = \|E\| + \|X\|` verified" (basis 9) | **Corrected** | The same document states that `E` is not established. Only `\|T\| = 64 = 1 + 63` is verified |
| 11 | The census rests on "the actual host evidence supplied for this task" (basis 5.1) | **Graded** | H. The route response was supplied to that session and is not in the repository. One point is open: at IRR `08411bc` the transport passes no stored identity to the resolver, so a result of 1 resolved requires a transport that already had the projection. The document does not state the IRR commit of the transport |
| 12 | Closure conditions C2, C3 and C6: the eligible scope and θI gate W04 (provenance 7.5) | **Not adopted** | The roadmap asks W04 for counts with versions. The eligible scope and θI are inputs of section K and W20. They stay open there |

The roadmap line of PR #156 ("PARTIALLY COMPLETE — census reconciled …") is not carried. The roadmap entry of this record replaces it.

## 6. Conflicts between the pull requests

| Conflict | Resolution |
|---|---|
| PR #156 and PR #166 both change the W04 roadmap entry | One entry, on the branch of PR #166, built on `main`. The approval block of PR #166 is kept as history. The status line of PR #156 is replaced |
| `main` said the IRR resolver outcome "has not been observed"; PR #156 reports a route read with 64 rows | Both kept, graded: reported (H), response not in the repository (section 5, row 11) |
| `main` counted 63 "unavailable"; PR #156 counted 63 "missing" | Same rows; one vocabulary (section 4) |
| PR #156 explains the 63 by missing identifiers; `main` (E4) shows the identifiers were present | E4 stands (section 5, rows 1 and 2) |
| PR #166 says "host installation pending" | No installation is needed for the measured state (section 3.6). The block is kept; a later record is added under it |
| The two W04 documents exist only on PR #156 | Carried to this branch byte for byte, then given a note at the top that points here. Digests of the originals are in the evidence folder |
| The inventory exists only on a branch without a pull request | Referenced by commit, blob and SHA-256; counts copied |

PR #156 stays open: its other 34 commits are Dhan provider work that this record does not judge. PR #163 is unchanged. IRR is unchanged.

## 7. Evidence that is not available

None of these is requested by this record. They are named so that no reader takes a summary for an output.

| # | Not in the repository | Affects |
|---|---|---|
| 1 | 2026-11-14: the terminal output of the installation, the approval record `W04-D1-20261114-01`, the install receipt, the result of `Test-IrrIdentitySources.ps1`, the IRR commit of the running transport, and a `verify-endpoint` run | Section 3.1 is H, supported by R for every reproducible value |
| 2 | 2026-11-15: the output file of the registry verification, its 64 row lines, its nine condition lines, the result JSON, the utility digest line and the time of the run | Section 3.2 is H |
| 3 | The capture file of 2026-11-13. It is local to the host by design | Counts are corroborated by sections 3.3 and 3.4 |
| 4 | The identities-route response behind the PR #156 census: the 64 rows, the counts by state and reason, **the listing-map and corporate-action table versions it served**, the full roster version, its `asOf` and `generatedAt`, the roster label, and the IRR commit of the transport | The zeros of section 4; the served versions |
| 5 | The security identity, listing and issuer of the one qualified holding. They were never supplied to a record | The exact mapping for that holding is reported, not shown |
| 6 | The Broker Import evidence journal (not found on the host) and the typed reason at import (never kept) | The cause of the 63 |
| 7 | Which IPD build and which P7 registry the host loaded at the import | The cause of the 63 |
| 8 | The approval record `W04-D1-20261115-01`. It is on the host; only its digest is published. IRR PR #566, which holds its supersession record, is open | Section 3.6 |
| 9 | Closed in the second pass: the inventory archive is now on `main`, carried unchanged | Section 3.3 |

## 8. Acceptance assessment

### 8.1 What the roadmap asks of W04

> **Deliverable:** same-revision qualified/resolved, ambiguous, missing, expired/ineligible and unavailable counts with source and listing/series versions. **Acceptance/evidence:** reconciled rows and exact security→listing→issuer mapping; no symbol-only identity. **Blocker:** W03 actual data/access and appropriate source use.

Decision GD-1 of the same roadmap: "exact achievable coverage is measured, not fabricated." The coverage threshold θI is defined in section K for W20, not for W04.

**W04 does not require 64 of 64.** It requires the count to be measured, reconciled and versioned, and it forbids identity by symbol alone. A measured 1 of 64 with 63 explicitly unresolved is a valid W04 result. A claim of 64 of 64 would not be.

### 8.2 The five dimensions

| Dimension | Finding |
|---|---|
| Registry readiness | **Met.** The registry holds 4,680 mappings on `main` (R). All 64 holdings are members (H). Readiness is not coverage: no stored holding gained an identity |
| Installation and verification | **Met.** Installed and verified on 2026-11-14, 2,388 of 2,388 (H; R for the values). A re-installation would write the same bytes (section 3.6) |
| Actual identity coverage | **Measured: 1 of 64. Not complete.** 63 holdings are unresolved (HO). Their cause is unproven |
| IRR integration | **Met in the repository.** The projection is on IRR `main` with passing checks (R). Its run on the host against revision 1 is not in the repository (U) |
| Evidence completeness | **Incomplete, in the places of section 7.** The measurement itself is supported by two host outputs held in the repository |

### 8.3 The roadmap criteria

| Criterion | Position |
|---|---|
| Same-revision counts in the five categories | **Met.** 1 / 0 / 63 / 0 / 0. The 1 and the 63 are HO. The three zeros are H |
| Reconciled rows | **Met.** 1 + 63 = 64; declared and actual counts agree; 64 of 64 lineage digests reproduced |
| Source and listing/series versions | **Met for the installed sources** (R). The versions served at the read were not captured (limit 1) |
| Exact security→listing→issuer mapping | **Reported for the one qualified holding, not shown** (limit 2). For the 63 no mapping exists, and that is the measured result |
| No symbol-only identity | **Met.** No identity was assigned, repaired or inferred, in any record |
| Predecessor W03 | The revision and the holding count W04 depends on are now also supported by the inventory archive. The W03 status is not changed by this record |

Limits that an acceptance as measured would carry:

1. The listing-map and corporate-action versions served at the time of the census read were not captured. The versions of the installed files are known.
2. The resolver outcome and the issuer mapping of the one qualified holding are operator-reported. The values are not in the repository.
3. The installation of 2026-11-14 and the registry verification of 2026-11-15 are operator-reported summaries. Their outputs are not in the repository.

**Do the limits prevent acceptance as measured? No.** Each limit lowers the grade of one piece of supporting evidence. None of them touches the measured count, which rests on two host outputs held on `main` (sections 3.3 and 3.4). The roadmap provides for exactly this case. Its operating model says that the listed tests and readback are objective closure evidence and "do not impose a separate human sign-off", that checks are to be independent "where feasible", and that limitations are to be documented "when independent check is infeasible". Removing any of the three limits needs output from the host. Host work and the repetition of completed verification are outside this work, so an independent check is not feasible here, and the limits are documented instead.

### 8.4 Confirmation of the five points, second pass

| Point | Finding | Evidence, and where it is |
|---|---|---|
| Installation and registry verification | **Present.** Installation complete on 2026-11-14 with 2,388 of 2,388 both ways; registry verification of 2026-11-15 `ALL_64_MATCH_PUBLISHED_MANIFEST` | Operator-reported records on `main` (sections 3.1 and 3.2). The three installed file digests are reproduced by test IIX-04 on every run of the suite; the registry and its 4,680 mappings are on `main` |
| Import lineage for all 64 holdings | **Present: 64 of 64 reproduced** (`REPRODUCED_ALL`) | Host output on `main` (section 3.4). Its import-content digest equals the contribution digest in the archive |
| Revision 1 and coverage of 1 of 64 | **Present: revision 1, 64 active holdings, identity on 1, none on 63** | Host output, now on `main` (section 3.3), re-extracted in this pass with an equal result |
| IRR integration on merged `main` | **Present.** `064195397dfdb32bf0f34a461b02fd6b9f9a8df0` is still the head of IRR `main`, read again in this pass | GitHub API (section 3.5) |
| Remaining limitations | The three limits of section 8.3 and the unavailable items of section 7, rows 1 to 8 | **They do not prevent acceptance as measured** (paragraph above) |

No requirement of 64 of 64 is applied. The roadmap does not set one for W04.

### 8.5 Determination

**The W04 acceptance criteria of the roadmap are met as measured: 1 of 64, with 63 holdings explicitly unresolved.** The deliverable (same-revision counts in five categories, with source versions) is delivered. The acceptance evidence (reconciled rows, no symbol-only identity) is in the repository. The exact mapping of the one qualified holding is reported and not shown, which is limit 2. The predecessor W03 supplies the revision and the holding count, and both are now host output on `main`.

**Recommendation: accept W04 as measured.** Disposition: 1 of 64 measured, 63 unresolved. No further evidence, host step or approval is needed for it.

Such an acceptance means: the measurement is complete and is the W04 result. It does not mean any of the following, and this record claims none of them:

- that 64 holdings are identified, or that identity coverage is complete;
- that `1/64` is a threshold; θI stays not established and W20 stays not accepted;
- that the 63 are resolved, or that their cause is known;
- that operator-reported evidence was independently verified.

**Consequence for later items.** With one stored identity, W08, W10, W11 and W13 can use at most one holding of revision 1. Raising the count needs the identities of the 63 to be stored, which is a new qualification of the holdings on import. That is future import work with its own prerequisite (PR #163). It is not a reason to repeat any W04 host step.

## 9. What this record did not do

No host operation. No installation, provisioning or re-provisioning. No database read or change. No statement import. No identity check repeated. No approval written, renewed or replaced. No file of the provisioning tool, the approval check or the P7 utilities changed. No IRR write. PR #163 not changed. No holding identifier, quantity or price reproduced. One revision total and one weight sum of the test data are stated in section 3.3.1, because they are the subject of the correction. The archive was copied; it was not opened for change, sanitized or removed.

## 10. For the Principal

Nothing further is needed from the Principal for the W04 evidence, for its publication or for the work that follows. No host step, no approval and no file is requested.

One thing is his and is not written here for him: the statement of acceptance. This record recommends it (section 8.5). Until he states it, the roadmap reads "criteria met as measured, acceptance recommended". When he states it, one line of the roadmap changes to "accepted as measured".

Closed in the second pass:

- The handling of the inventory archive. The Principal stated on 2026-11-16 that it is intentional test data, not to be sanitized or removed. It is on `main` unchanged.
- The difference in the D02 document (section 3.3.1).

## 11. Validation of this record

| Check | Result |
|---|---|
| Archive SHA-256 and its 16 manifest entries | Equal |
| Counts extracted from the archive | 64 rows, 64 active, 1 populated, 63 `NULL` |
| Extract script on a file that is not the archive | Refused, exit code 3 |
| The two carried documents against PR #156 head `a93278f` | Byte-identical before the note was added; digests in the evidence folder |
| IRR merge, its pull request, its checks and its ancestry | Read from the API; readback in the evidence folder |
| Relative links of this record, of the roadmap and of the evidence folder | All resolve |
| Test IIX-04, with the published manifest: the export gives the three digests installed on 2026-11-14 (section 3.6) | Pass |
| Full test suite on this branch after the merge of `main` `75db511` (build, then `npm test`) | 1,669 tests: 1,668 passed, 0 failed, 1 skipped |

Second pass:

| Check | Result |
|---|---|
| Archive on `main` against the archive on branch `arena/c32aea42-…` | Same Git blob `36364ca514f2c126f97017abcd371bdeb752b2fd`, same SHA-256, 27,601 bytes |
| Counts extracted again, from the archive on `main` | Equal to the committed extract |
| Comparison of the D02 document with the archive | 3 values of line 80 and 1 table count differ; 9 values agree; 1 figure is not in the archive |
| Comparison script on another archive, and on another document | Refused, exit codes 3 and 4 |
| History search for the three differing values | The two numbers: commit `8132c5b` only, the document only |
| IRR `main`, read again | `064195397dfdb32bf0f34a461b02fd6b9f9a8df0`, unchanged |
| Heads of PR #156, PR #163 and branch `arena/c32aea42-…`, read again | `a93278f`, `3a656c2`, `8132c5b`: unchanged, and not written by this work |
| Relative links of this record, of the roadmap and of the evidence folder | All resolve |
| Full test suite after the merge of `main` `d80d773` (build, then `npm test`); test IIX-04 included | 1,677 tests: 1,676 passed, 0 failed, 1 skipped |

The change is documentation, two read-only evidence scripts and one evidence archive copied unchanged. No source, test, tool or workflow file is changed by it.
