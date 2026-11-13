# Snapshot-to-Live W04 — provisioning the IRR identity sources from the IPD P04 security master

**Date:** 2026-11-13
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md)); follows the [root-cause record](IIPS-W04-IRR-IDENTITY-SOURCE-MISSING-ROOT-CAUSE-2026-11-13.md), whose host diagnostic returned `IDENTITY_DIRECTORY_ABSENT` (0 of 3 files).
**Repositories:** IPD `ramkivs/iips-production-market-data`, this branch (PR #157). IRR `ramkivs/iips-review-recovered` was run unmodified at `main` `08411bcd6d782a601fe5c82cc9983d076831148d` and at the head of open PR #563, `d10afbb31573d999f4b331484fcb79c510df1304`. No IRR file was changed.

**What this adds.** A tool that derives IRR's three identity files from the governed IPD P04 security master, has IRR's own loader and resolver accept them, and installs them into the IRR data directory. It is deterministic, repeatable and fail-closed.

**Result in the sandbox.** From the tracked P04 master of 2,390 records the tool exports **2,388 issuers, 2,388 securities and 2,388 NSE listings**, withholds **2 records**, and exports **0 corporate actions**. IRR's loader accepts the files at both IRR commits, IRR's readiness check reports `IDENTITY_SOURCES_VALID`, and IRR's real server answers the identities route **200** from them where it answered 503 before, without a restart.

**What it does not do.** Three things limit what the host will show after provisioning:

1. **On IRR `main` no holding resolves, whatever the roster holds.** `main` passes no ISIN and no exchange from a holding to its resolver. The host will show 200 with 64 holdings `UNMATCHED / NO_IDENTIFIER_PROVIDED`. Resolution needs IRR PR #563 and holdings that carry a qualified identity (section 7).
2. **The roster is narrower than a full identity source.** No CIN, no sector, no BSE listing, no corporate action, no symbol history (section 8).
3. **The source has conditional authority.** P04 is a one-time `OFFLINE_BOOTSTRAP` deposition, and IPD's own rule ID-4 says P04 is not authorized as product-wide authoritative identity. Using this export as IRR's eligible roster is an owner decision that this record does not make (section 3, decision D1).

**Nothing was run on the Windows host.** The PowerShell wrapper was parsed, not executed: no PowerShell runtime is reachable from the sandbox.

**W04 status is unchanged: PARTIALLY COMPLETE and NOT ACCEPTED.**

## 1. How to read this record

| Label | Meaning |
|---|---|
| **R** | Verified here: by reading tracked source, by running the repositories' tests, or by running unmodified IRR code on the files this tool produced. |
| **D** | Derived by reasoning from **R**. The condition it depends on is stated. |
| **H** | Reported by the operator from the Windows host. Not verified here. |
| **U** | Not observable from the repositories. |

Evidence files are in [`evidence/integration/w04-identity-source-provisioning-2026-11-13/`](../../evidence/integration/w04-identity-source-provisioning-2026-11-13/README.md).

## 2. What was built

| File | Role |
|---|---|
| `src/identity/irr_identity_source_export.ts` | The export. A pure function of its inputs: no clock, no environment, no file access. Returns the three files and a report, or a report only. |
| `src/identity/irr_identity_provisioning.ts` | Staging, the decision on IRR's loader answer, installation, receipts, and the reduction of an endpoint answer to counts. |
| `scripts/irr-identity-loader-gate.mts` | Run by the IRR checkout's own TypeScript runner. Imports IRR's `loadIdentitySourcesFromDir` and `resolveIdentity` and prints one JSON document of counts and digests. |
| `scripts/provision-irr-identity-sources.mjs` | Command line: `generate`, `validate`, `install`, `verify-endpoint`. Later: also `review` and `check-approval`. |
| `scripts/Invoke-IrrIdentityProvisioning.ps1` | Windows wrapper that runs the steps with the launcher's directory conventions and sanitized output. |
| `tests/irr_identity_source_export.test.ts`, `tests/irr_identity_provisioning.test.ts` | 91 tests. |
| `src/identity/irr_identity_approval.ts`, `tests/irr_identity_approval.test.ts` (later record, 2026-11-13) | The governance approval check that `install` now requires, and its 44 tests. See [approval enforcement](IIPS-W04-IDENTITY-PROVISIONING-APPROVAL-ENFORCEMENT-2026-11-13.md). |

The owning repository is IPD, because the source data and its governance are IPD's. IRR remains the owner of the schema, the loader and the resolver, and the tool treats IRR's loader as the acceptance gate rather than re-implementing it.

The generated identity files are not committed. They are reproducible from tracked inputs, and their SHA-256 digests are pinned by test `IIX-04`.

## 3. Source and authority

| Input | Use | Standing |
|---|---|---|
| P04 security master, batch `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`, 2,390 records, checksum `b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4` | The only source of exported data | Governed deposition under `AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001`, operating mode `OFFLINE_BOOTSTRAP` (**R**) |
| P7 qualification manifest, SHA-256 `13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc` | Corroboration only: detects a series contradiction. Contributes no exported value. The files are byte-identical with and without it (test `IIX-07`). | Vendor evidence, 48 ISINs (**R**) |
| Issuer-key supplement (optional, none used) | Lets an operator key named issuers by a sourced CIN | Operator-supplied; refused unless every entry is structurally valid, unique and cites a source |
| Corporate actions | None | No dataset exists in either repository (**R**) |

The export checks the master against its declared record count and checksum and refuses on a mismatch.

**Why P04 and nothing else.** It is the only governed security master either repository holds. IRR's tracked identity sets are a synthetic fixture and seven single-issuer evidence packs (root-cause record §4). No data was downloaded, and no record was authored by hand.

**Authority, stated plainly (R).**

- `docs/p01/P01_IDENTITY_AND_LINEAGE.md` ID-4: "P04 is **not** authorized as product-wide authoritative identity. Making it so requires a **new ADR**."
- The corpus manifest lists its own residual limitations. The first is that registry authenticity of the CIN field "is not establishable inside this repository".
- IRR's readiness check asks for the files "from the authoritative issuer source" and says "Do not copy test fixtures and do not author identity data by hand" (`frontend/server/investment/runtimeReadiness.ts` l.168). The export is neither a fixture nor hand-authored. Whether P04 is that authoritative source is not defined in IRR.

This tool does not widen P04's authority. Every report it writes carries limitation `SOURCE_AUTHORITY_CONDITIONAL`, and IRR records the installed roster as `OPERATOR_SUPPLIED`.

> **Decision D1 (owner).** Accept or reject the P04 export as the IRR eligible roster for the personal-portfolio host. Accepting it for product-wide use requires the ADR that ID-4 names.

## 4. Mapping `IPD-IRR-IDENTITY-EXPORT-MAPPING-1`

Only fields that the deposition binds to the NSE listing master are exported.

| P04 | IRR | Note |
|---|---|---|
| `isin` | security `IN:ISIN:<isin>`; issuer `equityIsin` | Check digit verified |
| `companyName` | issuer `legalName` | Display only. IRR never matches on names. |
| NSE listing `symbol` | listing `IN:NSE:<symbol>:EQ:EQUITY` | |
| Universe definition | listing `series` `EQ` | P04 has no series field. See below. |
| `effectiveFrom` | listing `effectiveFrom` (date part) | NSE date of listing |
| `listingStatus` `ACTIVE` | issuer `ELIGIBLE`, security `ASSESSABLE`, open listing window | |
| — | issuer `issuerId` `IN:EQISIN:<isin>`, `cin` `null`, `issuerKeyBasis` `EQUITY_ISIN` | IRR's own grammar for an issuer without a confirmed CIN |
| — | issuer `sector` `UNCLASSIFIED`, `subSegment` `null` | The value IRR's loader assigns when no sector is supplied (`sources.ts` l.191) |
| — | `corporate-actions.json` `actions: []` | Byte-identical to the file in IRR's tracked `REL-1-INFOSYS` set (**R**) |

**Series.** P04 records carry no series. The exporter states series EQ only for a batch whose manifest establishes the universe as the NSE capital-market list filtered to series EQ (`selectedTier` `TIER_2_ACTIVE_NSE_CM`; `universeSource`: "series=EQ, 2,390 rows"). Any other batch is refused with `MASTER_UNIVERSE_BASIS_UNKNOWN` (test `IIX-22`). The series is therefore as old as the deposition, 2026-11-08.

**Not exported, and why (R, measured on the tracked corpus).**

| P04 field | Measurement | Reason |
|---|---|---|
| `cin` | Present on 2,332 records; 2,298 have the CIN shape; 2,291 of those carry state code `MH`; 34 are non-CIN tokens. For Infosys the corpus value is `L86033MH2008PLC368891`; the CIN in IRR's tracked evidence is `L85110KA1981PLC013115`. IRR's tracked real-issuer sets name 5 distinct issuers, each with a CIN; all 5 are in the corpus, and the corpus CIN differs from IRR's in 5 of 5. | A CIN has no check digit, and IRR treats the roster as the confirmation of a CIN. An unverified CIN would be accepted as an issuer key. |
| `sector`, `industry` | 1,496 records carry sector "Capital Goods" and 1,495 industry "Industrial Products"; the manifest calls the taxonomy a systematic-classification claim from which consumers "must not re-derive semantics" | Different vocabulary from IRR's, with a disclosed limitation |
| BSE listing | 2,290 records carry a scrip code; none carries a BSE listing date or series | A BSE group (`A`, `B`) is not a series the IRR listing identifier accepts |

The CIN measurement is a finding about the tracked corpus in its own right. It was not investigated further here.

## 5. Fail-closed rules

| Situation | Behaviour |
|---|---|
| Master count or checksum does not match its revision; unknown batch; malformed P7 manifest; invalid supplement | `REFUSED`. No file. |
| A master record has missing or conflicting identity data | The record is **withheld** and listed with its reasons. It is never repaired. In a conflict between two records, both are withheld. |
| Withheld records exist | `INCOMPLETE`. No file, until the operator states the withheld count **exactly** (`--accept-withheld <n>`). A larger or smaller number is not accepted. |
| A list of required ISINs is given and some are not covered | `INCOMPLETE`, until the uncovered count is stated exactly. An uncovered ISIN is never added to the roster. |
| The export did not pass | `stage` removes any identity files staged earlier, so a refused run leaves nothing installable. |
| IRR's loader was not run, refused the files, or was run on other bytes | `install` refuses (`GATE_NOT_RUN`, `GATE_REFUSED`, `GATE_STALE`, `STAGED_FILES_ALTERED`). The decision is recomputed from the recorded loader output; an edited "accepted" flag is not believed. |
| The data directory does not exist | `install` refuses (`DATA_DIR_ABSENT`). The tool does not create it. |
| The identity directory already holds different files | `install` refuses (`TARGET_HAS_OTHER_FILES`). With `--replace` the existing files are first copied into the staging directory and verified. |

Withheld-record reasons: `ISIN_INVALID`, `ISIN_NOT_INDIAN`, `ISIN_DUPLICATE`, `ISSUER_SHARED_ACROSS_ISINS`, `ENTITY_NOT_ACTIVE`, `LEGAL_NAME_MISSING`, `NSE_LISTING_MISSING`, `NSE_LISTING_INCONSISTENT`, `NSE_LISTING_NOT_ACTIVE`, `NSE_SYMBOL_NOT_REPRESENTABLE`, `NSE_SYMBOL_DUPLICATE`, `LISTING_DATE_INVALID`, `P7_NSE_SERIES_CONFLICT`.

**Installation.** The three files are written to a sibling directory, verified against the staged digests, and made live by renaming directories, so the server never reads a half-written set. Between the two renames of a replacement there is a moment in which the identity directory does not exist; a request in that moment gets the same 503 as before provisioning. If the process is killed in that moment, the previous files remain in `.identity-outgoing-<hex>` beside the identity directory and in the staging backup. An interruption before the swap leaves the previous state exactly as it was (test `IIP-27`).

**Determinism.** Records are ordered by identifier and serialised with a fixed key order and LF line endings. Two runs gave byte-identical files and report (test `IIX-04`, and the two evidence runs). The export report holds no clock value of its own.

## 6. Measured export (R)

| | Count |
|---|---|
| Master records | 2,390 |
| Exported | **2,388** |
| Withheld | **2** |
| Issuers | 2,388 (keyed by CIN 0, by equity ISIN 2,388) |
| Securities | 2,388 |
| NSE listings | 2,388 of 2,390 |
| BSE listings | 0 of 2,290 |
| Corporate actions | 0 |
| P7 corroboration | 48 distinct ISINs, all in the master, all NSE series EQ, 0 contradictions |

**Withheld records.** Both are Jain Irrigation Systems: `INE175A01038` (`JISLJALEQS`) and `IN9175A01010` (`JISLDVREQS`, differential voting rights). Reason `ISSUER_SHARED_ACROSS_ISINS`: one legal entity has two equity securities, and without a verified CIN the export has no issuer-level key that binds them. Exporting them would present one issuer as two.

| File | SHA-256 | Bytes |
|---|---|---|
| `eligible-roster.json` | `078e89cc1896d0f59e09e2ad05a12378e248cd81b97775ee7667b5f1e750e937` | 1,350,516 |
| `listing-map.json` | `6a330123a2fea31e9e1dd54f01e5adbe13f9721f077a5a82a34ee7cd60bcf458` | 1,285,774 |
| `corporate-actions.json` | `d6bc14d1b676260bb0f1c2280e62956d3f6a7e07b9b9265a73b49f821185ffcd` | 70 |
| `provisioning-report.json` | `7b7cf322176f38717f7dfb7b968d5dc20a341046011eb0dc55176537b0ef3a36` | 8,026 |

A host run that prints these three identity-file digests used the same master and the same mapping.

**Coverage of the actual portfolio is not known (U).** The 64 holdings are host data. By the operator's report, 63 of them carry no security identity at all (**H**), so there is no ISIN list to compare with the roster. The tool can measure coverage of a list of ISINs supplied on the host (`--required-isins`), reporting counts only.

## 7. Validation with IRR's own code (R)

All runs used the files of section 6. Transcripts: `tool-run-08411bc.txt`, `tool-run-d10afbb.txt`, `tool-run-replace-08411bc.txt`, `endpoint-probe-*.txt`.

| Check | IRR `main` `08411bc` | IRR PR #563 `d10afbb` |
|---|---|---|
| IRR loader on the staged files | Accepted, `OPERATOR_SUPPLIED`, 2,388 / 2,388 / 2,388 / 0 | Same |
| IRR resolver, every exported security by ISIN | 2,388 of 2,388 resolve to the same record | Same |
| IRR resolver, every exported listing by exchange and symbol | 2,388 of 2,388 | Same |
| IRR roster version | `sha256:4baa4e596f84741018e03c08248faf89ff19a37b3d1877220d56dc27aafe7199` | Same |
| IRR readiness CLI on the installed directory | `identity-files`: `IDENTITY_SOURCES_VALID`, no action required | Same |
| IRR composed server, identities route before installation | 503 `identity-sources-unavailable` | 503 |
| Same server process after installation, no restart | **200**, `OPERATOR_SUPPLIED`, the gated roster version | Not runnable: this commit predates IRR's synthetic IPC peer, so the server has no holdings to read |
| Replacement of an existing set (IRR's tracked `REL-1-INFOSYS` set) | Refused without `--replace`; with it, replaced and the previous files kept | — |

PR #563 adds a `MISSING_REQUIRED_ARRAY` rule that refuses one of IRR's own tracked sets. The export passes it.

**What a holding needs in order to resolve.** IRR's real route handler was given probe holdings carrying the identifiers of one exported record. These are probe inputs, not portfolio data.

| Holding as IRR receives it | `main` | PR #563 |
|---|---|---|
| No ISIN, no exchange, `securityIdentity` null (an unqualified holding) | `UNMATCHED / NO_IDENTIFIER_PROVIDED` | Same |
| `securityIdentity` `ISIN:<isin>:EQ`, no flat ISIN (a holding qualified on NSE) | `UNMATCHED / NO_IDENTIFIER_PROVIDED` | **`RESOLVED`** by ISIN |
| `securityIdentity` `ISIN:<isin>:A` (a holding qualified on BSE) | `UNMATCHED / NO_IDENTIFIER_PROVIDED` | `AMBIGUOUS_LISTING` |
| Flat ISIN only | `RESOLVED` | `RESOLVED` |
| Flat ISIN, NSE, the exported symbol | `RESOLVED` | `RESOLVED` |
| Flat ISIN, observed on BSE | `AMBIGUOUS_LISTING` | `AMBIGUOUS_LISTING` |
| Exported NSE symbol on NSE, no ISIN | `RESOLVED` by exchange and symbol | Same |
| ISIN of a withheld record | `UNMATCHED / ISIN_NOT_IN_ROSTER` | Same |

Consequences for the host (**D**, from this table and the operator's report of 1 populated and 63 null security identities):

- At IRR `08411bc` the endpoint will answer 200 and all 64 holdings will be `UNMATCHED / NO_IDENTIFIER_PROVIDED`. This is the IRR projection gap already recorded in the [identities-endpoint assessment](IIPS-W04-IRR-IDENTITIES-ENDPOINT-REVISION-BINDING-ASSESSMENT-2026-11-13.md), not a defect of the roster.
- With PR #563, at most the 1 holding with a populated identity can resolve, and only if it was qualified on NSE in series EQ and its ISIN is among the 2,388.
- The other 63 need a qualified security identity from IPD first. The P7 registry covers 48 ISINs.
- A holding qualified on BSE cannot resolve against this roster.

## 8. Limitations and the data that would remove them

Each is stated in every `provisioning-report.json`.

| Code | Effect | Missing dataset | Fields required |
|---|---|---|---|
| `SOURCE_AUTHORITY_CONDITIONAL` | The roster rests on a one-time `OFFLINE_BOOTSTRAP` deposition that is not product-wide authority (section 3) | — (decision D1) | — |
| `SERIES_FROM_UNIVERSE_DEFINITION` | A security moved out of series EQ since 2026-11-08 is still exported as EQ | Current NSE listing master, re-deposited under a governed act | `isin`, `symbol`, `series`, `asOf` |
| `CIN_NOT_EXPORTED` | Issuers are keyed by equity ISIN. An issuer with two equity ISINs cannot be exported (the 2 withheld records). | Registry-verified CIN per equity ISIN | `isin`, `cin`, `sourceRef` |
| `SECTOR_UNCLASSIFIED` | The roster supplies no sector. IRR's valuation method selection is keyed by sector (`assessment/methods.ts`); the sector must come from elsewhere. | Governed sector classification in IRR's sector vocabulary | `isin`, `sector`, `subSegment`, `sourceRef` |
| `BSE_LISTINGS_NOT_EXPORTED` | A holding observed on BSE does not resolve to a listing | BSE listing master, and an IRR decision on how a BSE group maps to a listing series | `isin`, `scripCode`, `group`, `listingDate`, `status` |
| `CORPORATE_ACTIONS_EMPTY` | No split, bonus, merger or delisting is known to IRR. Empty means none recorded, not none occurred. | Exchange corporate-action register | `actionId`, `type`, `effectiveDate`, `isin`, `adjustmentFactor`, `factorBasis`, `successors`, `sourceRef` |
| `NO_SYMBOL_HISTORY` | A former symbol is not in the map; for a past date a listing can carry a symbol not yet in use then | NSE symbol-change history | `isin`, `symbol`, `series`, `effectiveFrom`, `effectiveTo`, `sourceRef` |
| `ELIGIBLE_MEANS_ACTIVE_NSE_LISTING` | `ELIGIBLE` and `ASSESSABLE` mean only "an ACTIVE NSE series-EQ listing in the P04 master". They are not an eligibility or data-quality judgement. | — | — |

How far the roster's `sector` reaches into IRR's assessment was not traced end to end.

## 9. Command reference

```
node scripts/provision-irr-identity-sources.mjs generate --staging <dir>
     [--accept-withheld <n>] [--required-isins <file>] [--accept-uncovered <n>] [--list-uncovered]
     [--p7 <manifest> | --no-p7] [--issuer-key-supplement <json>]
node scripts/provision-irr-identity-sources.mjs validate --staging <dir> --irr-root <IRR checkout> [--as-of YYYY-MM-DD]
node scripts/provision-irr-identity-sources.mjs review --staging <dir> [the options of generate] [--irr-root <IRR checkout>] [--as-of YYYY-MM-DD]
node scripts/provision-irr-identity-sources.mjs check-approval --approval <record.json> [--staging <dir>]
node scripts/provision-irr-identity-sources.mjs install --staging <dir> --data-dir <IIPS_DATA_DIR> --approval <record.json> [--replace]
node scripts/provision-irr-identity-sources.mjs verify-endpoint --staging <dir> --portfolio-id <id> [--base-url http://127.0.0.1:8787]
```

**Later record (2026-11-13).** `install` requires `--approval`: a governance approval record for exactly the staged files. `review` generates and validates the proposed files and reports their digests without installing. `check-approval` is read-only. No command creates an approval. The contract is in [approval enforcement](IIPS-W04-IDENTITY-PROVISIONING-APPROVAL-ENFORCEMENT-2026-11-13.md).

| Exit code | Meaning |
|---|---|
| 0 | The step passed |
| 2 | `generate` refused an input |
| 3 | `generate` is incomplete: an acknowledgement is required |
| 4 | IRR's loader gate did not accept the staged files |
| 5 | `install` refused for a reason other than the approval |
| 6 | The endpoint did not answer from the gated roster |
| 7 | `install`, `check-approval`: the approval record is missing or does not authorize the staged files. Nothing was installed or changed |
| 64 | Usage error, or a missing or stale build |

The tool needs the IPD checkout built (`npm ci`, `npm run build:tsc`) and refuses a stale build. `validate` needs an IRR checkout with its frontend packages installed, and records that checkout's commit.

Staging directory: `identity/` (the three files), `provisioning-report.json`, `irr-loader-gate.json`, `review-for-approval.json` (written by `review`), `install-receipt.json`, `endpoint-check.json`, and `replaced-<tag>/` after a replacement. None of them holds portfolio data. `--required-isins` takes a text file of one ISIN per line; the list is read, counted, and never written anywhere. `--list-uncovered` prints the uncovered ISINs to the console only.

`verify-endpoint` accepts a loopback `http` address only. Its `PASS` means the endpoint answers 200 from the roster the gate accepted. It is not a statement that holdings resolved; the counts say that.

## 10. Windows procedure

**Status of this procedure:** derived from the launcher conventions in `windows-setup/03-Start-IipsServers.ps1` and from the sandbox runs. Not executed on Windows.

**Step 3 cannot be run today.** Installation requires a governance approval record for exactly the generated files, and none exists: decision D1 is not approved ([decision record](IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md)). Without `-ApprovalRecordPath` the wrapper reports `NOT RUN` before any step ([approval enforcement](IIPS-W04-IDENTITY-PROVISIONING-APPROVAL-ENFORCEMENT-2026-11-13.md)).

The tool runs from its own checkout, so the checkouts the services run from are not touched.

```powershell
# 1. A separate checkout of this branch, built.
git clone --branch arena/5570860c-iips-production-market-data --single-branch https://github.com/ramkivs/iips-production-market-data.git H:\IIPS\tools\ipd-identity-provisioning
Set-Location H:\IIPS\tools\ipd-identity-provisioning
npm.cmd ci
npm.cmd run build:tsc

# 2. Review only. Installs nothing and does not touch the identity directory.
#    First run, expected: RESULT: INCOMPLETE, 2 withheld, exit code 3 (no identity file written).
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-IrrIdentityProvisioning.ps1 -ReviewOnly
$LASTEXITCODE
#    Second run, stating the withheld count. Expected: the three digests of section 6,
#    RESULT: PASS (REVIEW ONLY), NOTHING WAS INSTALLED, exit code 0.
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-IrrIdentityProvisioning.ps1 -ReviewOnly -AcceptWithheld 2
$LASTEXITCODE

# 3. Provisioning run. ONLY with the approval record of the required authorities for the digests
#    step 2 printed. Without -ApprovalRecordPath: RESULT: NOT RUN, exit code 2.
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-IrrIdentityProvisioning.ps1 -AcceptWithheld 2 -ApprovalRecordPath <path of the approval record>
$LASTEXITCODE
```

Defaults: install root `H:\IIPS`, IRR checkout `<InstallRoot>\iips-review-recovered`, data directory `<InstallRoot>\runtime\iips-data`, staging `<InstallRoot>\runtime\identity-provisioning`, transport `127.0.0.1:8787`. Each has a parameter.

Step 3 ends with `RESULT: PASS` only if the approval record authorizes exactly the generated files, IRR's loader accepted the staged files, the files were installed, and the running transport no longer reports its identity sources unavailable. Compare the three digests it prints with section 6: equal digests mean the host used the same master and mapping as the sandbox. The services stay running throughout.

| Wrapper exit code | Meaning |
|---|---|
| 0 | Installed, and the running transport loads the files. With `-ReviewOnly`: generated and accepted by IRR's loader, nothing installed |
| 1 | A step refused. The reason is printed. A refused approval record is this code. |
| 2 | A precondition is not met, or no approval record was given. Nothing was changed. |
| 3 | An acknowledgement is required, or the files are installed but the transport did not answer |

Then, as the independent check, run the read-only diagnostic of the root-cause record, `Test-IrrIdentitySources.ps1`. Expected: `RESULT: PASS`.

To see how the holdings fare, repeat step 3 with `-PortfolioId <id>`. The output is counts only. Expected at IRR `08411bc`: 64 holdings, all `UNMATCHED`, reason `NO_IDENTIFIER_PROVIDED` (section 7).

**Report back** the console output of steps 2 and 3 as printed, and the exit codes. The output carries no path, no portfolio identifier and no holding.

**To undo:** remove `H:\IIPS\runtime\iips-data\investment\identity`. The endpoint returns to the 503 it gave before. No other state is changed by the tool.

**Without the wrapper.** The commands of section 9 do the same work, with `node.exe`, `--staging H:\IIPS\runtime\identity-provisioning`, `--irr-root H:\IIPS\iips-review-recovered` and `--data-dir H:\IIPS\runtime\iips-data`. Their output includes paths. `install` is refused without `--approval` there too: the check is in the library, not in the wrapper.

**Wrapper checks.** Tree-sitter PowerShell grammar: 0 error nodes. The `windows-setup` structural validator (from PR #156): 29 rules pass, 3 fail. (Re-run after the approval change of 2026-11-13: the same result with the validator of PR #156 at `c260a82`, and 23 pass, 3 fail with the older validator on this branch.) The three are the rules that require the shared library `Iips-Common.ps1` (`-NoPause`, `Write-IipsFinalStatus`, the shared Node toolchain). The wrapper is standalone on purpose, as `Test-IrrIdentitySources.ps1` is: the library differs between `main` and PR #156.

## 11. Tests

| Check | Result |
|---|---|
| `tests/irr_identity_source_export.test.ts` | 53 tests, 53 passed: generation from the tracked master, determinism and pinned digests, input integrity, 11 kinds of missing data, 5 kinds of conflicting mapping, the issuer-key supplement, incomplete coverage and exact acknowledgement, the check of produced files |
| `tests/irr_identity_provisioning.test.ts` | 38 tests, 38 passed: staging, 16 ways the gate refuses, installation paths (first install, idempotence, absent data root, stale or refused gate, altered files, replacement with backup, interruption), endpoint summary, the command line |
| IPD `npm test` on this branch | 1,578 executed, 1,577 passed, 1 skipped (as before this change), 0 failed |
| Later record (2026-11-13), approval enforcement | `tests/irr_identity_approval.test.ts`: 44 tests, 44 passed. The 38 provisioning tests still pass; they now install under a test approval policy, and `IIP-42` and `IIP-43` changed ([approval enforcement](IIPS-W04-IDENTITY-PROVISIONING-APPROVAL-ENFORCEMENT-2026-11-13.md), section 9). IPD `npm test`: 1,634 executed, 1,633 passed, 1 skipped, 0 failed |
| IPD `npx tsc --noEmit` | Clean |
| IRR loader, resolver, readiness CLI and server on the produced files | Section 7 |

To test missing and conflicting data, which the tracked master does not contain, the tests alter one field of a real master record in memory. Those records exist only inside the test.

The IPD tests cannot run IRR's loader. Where they need "the answer IRR gave", they construct a document of the same shape. That tests IPD's decision logic only; IRR's acceptance is shown by section 7, and on the host by the `validate` step.

## 12. Decisions required

| | Decision | Owner |
|---|---|---|
| D1 | Whether the P04 export is accepted as the IRR eligible roster, given ID-4 and `OFFLINE_BOOTSTRAP` (section 3) | Repository owner |
| D2 | Whether the 2 withheld Jain Irrigation records are acceptable as absent, or a sourced CIN is to be supplied for them (this needs a mapping change: the supplement currently refuses one CIN for two ISINs) | Repository owner |
| D3 | Whether IRR PR #563 is merged. Without it no holding resolves through the D114 identity. | IRR owner |
| D4 | Which of the missing datasets of section 8 are to be sourced, and from where | Repository owner |

**Later record (2026-11-13).** The four decisions are investigated in [identity provisioning decisions D1 to D4](IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md), which also names the approving authority for each. It contains a proposal for D1 and approves nothing. **Provisioning stays blocked until D1 is approved; the Windows procedure of section 10 is not to be run before that.**

## 13. Status and next activity

- **W04: PARTIALLY COMPLETE, NOT ACCEPTED.** This change makes the identities endpoint operable. It does not produce host identity evidence, and it does not make holdings resolve.
- Next: decision D1; then the Windows procedure of section 10 and its reported output; then W04 host items E1–E4.
- W03, W08 and W11 are not accepted. IRR PR #563 is unmerged.

## 14. Not examined, not shown

- The Windows host. Nothing in this record was run there.
- The PowerShell wrapper in a PowerShell runtime.
- The 64 actual holdings and their coverage by the roster.
- The identities route of IRR's composed server at PR #563 (no synthetic peer at that commit). The route handler was exercised there directly.
- Whether the P04 corpus's CIN values can be reconciled with a registry.
- How IRR's assessment engines consume the roster's `sector`.
- Behaviour of the directory swap under a concurrent request on Windows. The rename is retried for up to one second if a file is held open.
