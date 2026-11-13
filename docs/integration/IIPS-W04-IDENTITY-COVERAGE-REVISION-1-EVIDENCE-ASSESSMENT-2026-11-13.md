# Snapshot-to-Live W04 — Identity coverage of captured portfolio revision 1: evidence assessment

**Date:** 2026-11-13
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md))
**Subject:** the one captured portfolio revision (revision 1, 64 holdings) recorded in the [Dependency 1 disposition](IIPS-W11-DEP1-CAPTURE-EVIDENCE-DISPOSITION-2026-11-13.md)
**Repositories read:** IPD `ramkivs/iips-production-market-data` at `main` `a624d06`; IRR `ramkivs/iips-review-recovered` at `main` `08411bc` and at the head of open PR #563, `d10afbb`

**W04 status: PARTIALLY COMPLETE. Not accepted.** The coverage counts for revision 1 are recorded. The issuer mapping of the one qualified identity and the source versions actually loaded on the host are not established. W04, W08 and W11 remain not accepted.

This assessment was made from the two repositories only. Nothing on the Windows host was read, the capture file was not seen, and no identity was inferred from a symbol, a company name or an approximate match.

## 1. How to read this record

Every statement below carries one of four labels.

| Label | Meaning |
|---|---|
| **H** | Observed on the Windows host and reported by the operator. Not re-read here. Subject to review. |
| **R** | Verified in this assessment from tracked repository content, by reading source or by running unmodified application code on tracked files. |
| **D** | Derived by reasoning from **H** and **R**. Each derivation states the condition it depends on. |
| **U** | Unavailable: not retained, not observable from the repositories, or not supplied. |

## 2. Answers to the eight questions

| # | Question | Answer | Label |
|---|---|---|---|
| 1 | Can W04 establish identity coverage for the exact captured revision? | In part. The security-level counts are established: 1 qualified, 63 explicitly unresolved, 64 in total. The split of the 63 by reason, the issuer mapping and the loaded source versions are not. | H, U |
| 2 | Does the one populated `securityIdentity` map to an issuer through the actual IRR resolver? | Not established. On IRR `main`, the build the host reported, the resolver never receives the `securityIdentity` object and cannot return an issuer for a persisted holding. The code that passes the object to the resolver is in open PR #563. With that code the result still depends on identity files that exist only on the host. | R, U |
| 3 | Is that mapping supported by canonical identity evidence? | No issuer mapping exists to support. On the IPD side, the governed path builds a qualified identity from the P04 security master and the P7 vendor master, and marks it `NON_AUTHORITATIVE`. Whether this holding's identity came from that path with the tracked sources is not confirmed. | R, D, U |
| 4 | Which identity registry and source versions are in the authoritative repositories? | IPD: P04 batch `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001` (2,390 entities) and the P7 manifest with SHA-256 `13bd2ef1…78bc` (96 mappings, 48 ISINs, of which 45 qualify). IRR: no runtime identity source is tracked. Section 7. | R |
| 5 | Can any of the 63 be classified further from existing evidence? | No holding can be classified. The set of possible causes can be narrowed, under stated conditions, to two. An existing host record that may hold the import-time ISIN and exchange of each row is identified in section 6.4. | D, U |
| 6 | Why can the original unresolved reasons not be recovered from revision 1? | The reason is computed and then discarded before the row is written. The stored row has no ISIN, exchange, series or reason column. The digests that are stored commit to the import inputs but cannot be reversed. Section 6.3. | R |
| 7 | Does W04 permit recording qualified coverage of one holding and unavailable coverage of 63? | Yes, as a record of measured coverage. The W04 deliverable names "unavailable" as a count, and the roadmap states that achievable coverage is measured, not fabricated. The record alone does not meet the W04 acceptance criteria. Section 8. | R |
| 8 | Could that one issuer support the issuer-level qualification that W11 needs? | Not on present evidence. It would need an issuer mapping from the IRR resolver, the W08 code on IRR `main`, and qualifying financial evidence for that same issuer. None of the three is evidenced. Section 9. | R, U |

## 3. The W04 requirement

Roadmap text, unchanged:

> **Deliverable:** same-revision qualified/resolved, ambiguous, missing, expired/ineligible and unavailable counts with source and listing/series versions. **Acceptance/evidence:** reconciled rows and exact security→listing→issuer mapping; no symbol-only identity. **Blocker:** W03 actual data/access and appropriate source use.

| Requirement | Position for revision 1 | Label |
|---|---|---|
| Same-revision counts | Recorded in section 4. Qualified 1, unavailable 63. | H |
| Ambiguous, missing, expired/ineligible counts | Not determinable. The reason was not retained. | U |
| Reconciled rows | 1 + 63 = 64, equal to the holding count of the capture. No row is absent or malformed. | H |
| Source and listing/series versions | Tracked versions recorded in section 7. The versions the running services loaded are not observable. | R, U |
| Exact security→listing→issuer mapping | Not established for the one qualified holding. The stored row keeps the security and the IPD company but not the exchange, and no IRR issuer result exists. | R, U |
| No symbol-only identity | Met by this record: the 63 are counted as unavailable and none is identified by symbol. See also finding R5. | R |
| Predecessor W03 | The host capture and the host Reports inventory both exist, operator-reported and subject to review. W03 is not accepted. Section 11. | H |

## 4. Coverage record for revision 1

Host values are those reported by the operator for capture SHA-256 `c5dd51f5…eda3`. The capture is local-only and is not published.

| Measure | Count | Label |
|---|---|---|
| Holdings in revision 1 | 64 | H |
| `identityStatus = RESOLVED` | 64 | H |
| `resolutionDisposition = CANONICAL_P04` | 64 | H |
| `securityIdentity` populated (qualified at security level) | **1** | H |
| `securityIdentity` explicitly `null` (unresolved at security level) | **63** | H |
| `securityIdentity` absent / malformed | 0 / 0 | H |

W04 counts:

| W04 category | Count | Label | Note |
|---|---|---|---|
| Qualified security identity | 1 | H | IPD D114 object present. Values not supplied to this assessment. |
| Resolved to an issuer by the IRR resolver | not observed | U | Section 5.2. |
| Ambiguous | not determinable | U | Reason not retained. |
| Missing | not determinable | U | Reason not retained. |
| Expired / ineligible | not determinable | U | Reason not retained. |
| Unavailable | 63 | H | Explicitly unresolved upstream; cause unknown. |
| **Total** | **64** | H | Reconciles to the capture. |

`RESOLVED` and `CANONICAL_P04` on all 64 are company-level results. They are not security identity and are not counted as such (R4, R5).

## 5. The one populated identity

### 5.1 IPD side

- **R1.** A holding's `securityIdentity` is the D114 object `{ securityId: "ISIN:<isin>:<series>", isin, series, isinAuthority }`. On a read, a stored value that does not match that grammar makes the read fail; it is never repaired (`src/persistence/portfolio_store.ts`, `src/contracts/types.ts`).
- **R2.** `isinAuthority` is always `NON_AUTHORITATIVE`. The qualification service describes its result as "a conditionally qualified identity, not independently issuer-verified identity". The P7 manifest states that the series comes from the vendor master and that P04 does not carry series independently.
- **R3.** In the IPC server, the broker-import operation `portfolio.importBroker` first appears at commit `adc6cac` (2026-11-10). At that commit the server already composes the governed P04 master and P7 registry (`ed67f15`, 2026-11-09). No commit on `main` exposes broker import over IPC with the earlier fallback that built the identity from broker-supplied ISIN and series.
- **R4.** `CANONICAL_P04` is written by one function only, the company-level gate in `src/persistence/brokerImportPersistence.ts`. Its only caller that can create revision 1 is `persistBrokerImport`; the v2 snapshot path requires an existing revision.
- **R5.** The company-level gate resolves a row from exchange and symbol alone. For every listing in the tracked P04 master it returns `RESOLVED` with or without an ISIN (2,390 NSE and 2,290 BSE listings, both ways). A row with a symbol and no exchange is refused. So `RESOLVED` / `CANONICAL_P04` does not show that a row carried an ISIN.
- **R6.** The IPC payload check requires a non-blank symbol on every holding (`src/ipc/dispatch.ts`).
- **R7.** With the governed dependencies, a row gets a non-null identity only if it carries an ISIN and an exchange and `qualifyHoldingSecurityIdentity` returns `QUALIFIED`. An empty registry yields no populated identity at all (probe: 0 of 2,390).

Derived, on the condition that revision 1 was written by the IPC import operation of a build that behaves as the reviewed source (**D**, condition C1):

- The row of the one populated identity carried an ISIN and an exchange at import.
- P04 resolved that ISIN to the company stored on the holding and had an ACTIVE listing on that exchange.
- The registry loaded at import was not empty and held exactly one mapping for that company, segment and ISIN. "Empty registry at import time", listed as a possible cause in the Dependency 1 disposition, is excluded under C1.

Derived, on the further condition that the tracked sources of section 7 were the ones loaded (**D**, condition C2):

- The ISIN is one of the 45 that qualify, and the series is `EQ` for an NSE row or `A` / `B` for a BSE row.

Neither condition is established. The build that wrote revision 1 was not observed (**U**). The values of the identity were not supplied (**U**), so membership in the 45 was not checked.

What the stored row keeps is the security (`ISIN:<isin>:<series>`) and the IPD company. It does not keep the exchange. The IPD mapping security→listing→company therefore existed at import and is stored only as security→company.

### 5.2 IRR side

- **R8.** IRR resolves a holding to an issuer with `resolveIdentity`, reached for holdings through `toHoldingObservation` and `resolveHoldingIdentities`. On IRR `main` (`08411bc`), `toHoldingObservation` reads the flat fields `isin` and `exchange` only. `G2HoldingView` has no `securityIdentity` field.
- **R9.** IPD's read projection of a stored holding has no flat `isin` and no `exchange` (`holdingFromRow`). The store has no such columns.
- **R10.** Probe on IRR `main` with a synthetic holding shaped as in R9, against the tracked synthetic identity fixture: state `UNMATCHED`, reason `NO_IDENTIFIER_PROVIDED`, no issuer. The result is the same whether `securityIdentity` is populated or `null`.
- **R11.** At the head of open PR #563 (`d10afbb`), `projectD114SecurityIdentity` passes the object's ISIN and series to the resolver. The same probe then returns `RESOLVED` with an issuer, a security and a listing for the populated holding, and `UNMATCHED` for the `null` one.
- **R12.** Because the holding has no exchange, the listing in R11 is chosen among the security's active listings of that series by a preference rule. It is not the listing of the exchange on which the holding was observed.
- **R13.** IRR reads its identity sources from `<IIPS_DATA_DIR>/investment/identity/` (`eligible-roster.json`, `listing-map.json`, `corporate-actions.json`). That directory is git-ignored and is absent by default. The version of each file is the SHA-256 of its canonical content. An ISIN that is not in the roster is `UNMATCHED / ISIN_NOT_IN_ROSTER`; missing files give HTTP 503.
- **R14.** IRR treats the IPD `companyId` as a hint only. The resolver never accepts it as proof of an issuer.

Conclusion for question 2 (**D**, on the condition that the host IRR runs `08411bc` as reported): on the host build the IRR resolver does not map the populated identity to an issuer, and returns the same unmatched result for all 64 holdings. This is the gap that roadmap item W08 names. It has not been observed on the host (**U**).

Conclusion for question 3: there is no issuer mapping whose evidence could be assessed. Whether one would exist with PR #563 depends on the host roster and listing map, whose content and digests are unavailable (**U**).

## 6. The 63 unresolved holdings

### 6.1 What is established

- **H.** 63 holdings carry `securityIdentity = null`.
- **R.** `null` is the store's explicit "unresolved" fact. It is never reconstructed from a symbol, a company name, an ISIN alone or a listing alone.
- **U.** The cause for each holding, and the split of the 63 by cause.

### 6.2 What can be narrowed, and under which conditions

Unmodified application code was run over every entity of the tracked P04 master (probe, section 12).

| Input | Result |
|---|---|
| Every P04 ISIN on every exchange where P04 lists it (4,680 pairs) | `QUALIFIED` 90 (45 ISINs on each exchange); `MISSING_P7_MAPPING` 4,590. No other reason occurs. |
| The 48 registry ISINs | 45 qualify. 3 return `MISSING_P7_MAPPING`, because the company in the P7 manifest differs from the company P04 now gives for the ISIN. The manifest dates from 2026-11-06; the P04 master was replaced on 2026-11-08. |
| Rows with exchange and symbol, no ISIN | Company-level `RESOLVED`; `securityIdentity` `null` in every case. |

Under conditions C1 and C2 of section 5.1 (**D**): a `null` on a holding of revision 1 has exactly one of two causes.

1. The imported row carried no ISIN. No reason is computed in this case.
2. The row carried an ISIN that is not one of the 45, and qualification returned `MISSING_P7_MAPPING`.

Under the same conditions the other typed reasons are not reachable for a row that passed the company gate: invalid ISIN syntax, missing P04 correspondence, conflicting ISIN, inactive or missing listing, ambiguous provider mapping, missing series evidence and stale source evidence.

Limits of this narrowing:

- It is conditional. C1 and C2 are not established.
- It classifies no holding. Which of the two cases applies to any holding, and how the 63 divide between them, is unknown.
- It does not make the 48-ISIN registry the explanation for the 63. Case 1 does not involve the registry at all, and the number of holdings in each case is unknown. The registry stays a possible contributing factor.

### 6.3 Why the original reasons cannot be recovered

- **R15.** `mapBrokerImportHoldings` calls the qualification, keeps the identity when the result is `QUALIFIED`, and otherwise keeps `null`. The typed reason and its detail are not returned, stored or logged.
- **R16.** The holding row has these columns: key, symbol, company, quantity, prices, value, weight, active flag, source broker, lineage digest, identity status, resolution disposition, security identity. There is no ISIN, exchange, series or reason outside `security_identity`.
- **R17.** No audit event is written for a broker import. The diagnostic journal records refused protocol frames only.
- **R18.** The revision's provenance digest is a SHA-256 over the import request, including each row's symbol, ISIN and exchange. The contribution record keeps the file name, the content digest of the raw input, the import instant and that provenance digest. These values can confirm a candidate input. They cannot be reversed to produce one.
- **R19.** The sources loaded at import are not recorded with the revision. The server holds the security-master batch and the registry mapping count in memory and neither prints nor serves them.

A reason computed today would be a new measurement against today's sources. It would not be the reason at import.

### 6.4 Existing evidence examined

| Evidence | Finding | Use |
|---|---|---|
| IPD open PR #155 (`0b2815a`): Stage 2 identity boundary investigation | Records the earlier host result "0 observed / 64 unavailable" for W04 and the flat-field gap of R8. Its content agrees with R8–R10. | Corroborates R8. Not evidence for this capture. |
| IRR Stage 2 record (2026-11-10) | W04 actual coverage: "Unknown". W08 acceptance depends on W04. | Superseded for the counts by section 4. |
| IPD `evidence/integration/ws-a-dhan-68-row/` | A tracked record of a 68-row import surface observed on 2026-11-05 in which ISIN and exchange were blank and nothing was saved. | **Not used.** No link to revision 1 is established and none is inferred. |
| IRR broker-import evidence journal (`frontend/server/broker-import/brokerImportEvidenceStore.ts`) | IRR can retain, per import, a host-local record with each row's symbol, ISIN or explicit absence, exchange or explicit absence, identity status and refusal code, together with the content digest. Retention is indefinite; deletion is an explicit owner action. A read-only route returns one record by its import id. | Possible host evidence. Whether a record exists for the import that produced revision 1 is unknown (**U**). Section 10, item E4. |

## 7. Registry and source versions

### 7.1 IPD, as tracked

| Source | Version | Label |
|---|---|---|
| P04 security master (company identity) | Batch `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`; file checksum `b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4`; 2,390 records; authorization `AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001`; mode `OFFLINE_BOOTSTRAP` | R |
| P04 content | 2,390 entities, 2,390 distinct ISINs; listings NSE 2,390 and BSE 2,290, all `ACTIVE`; no entity has an end date | R |
| P04 file | `src/identity/d05_authenticated_universe_data.ts`, Git blob `b8f0ec8da046b66768f265f649476a819de67b65`. It is a source module compiled into the build output, so a running service uses the copy in its build. | R |
| P7 qualification manifest (series evidence) | `evidence/dhan-p7/qualification-manifest.json`; SHA-256 `13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc`; 210,821 bytes; Git blob `50d9424af01527897df132a63f74d635286bfe9d`; generated `2026-11-06T05:45:58.252Z` at pipeline commit `a8019f12cb41f69b911f425d2f557edfa18cb1d6`. Read from disk when the server starts. | R |
| P7 vendor inputs | `api-scrip-master-detailed.csv`, retrieved `2026-11-06T05:27:53Z`, SHA-256 `6F19FEB4…A010D`; `api-scrip-master.csv`, retrieved `2026-11-06T05:29:23Z`, SHA-256 `4366E41B…CDDD`; 217,104 rows each | R |
| P7 registry as loaded | 96 mappings, 48 ISINs, 48 companies; `NSE_EQ:EQ` 48, `BSE_EQ:A` 47, `BSE_EQ:B` 1; all active; all `DHAN_INSTRUMENT_MASTER`; one `lastVerifiedAt`, `2026-11-06T05:27:53Z` | R |
| Qualifying set | **45 ISINs** qualify against the tracked P04 master, on each of NSE and BSE. 3 registry ISINs do not (section 6.2). | R |
| Commits | `main` `a624d06`, the host-reported checkout `1fded9d` and this branch carry identical blobs for the P04 data, the master loader, the listing corrections and the P7 manifest. The registry loader function is byte-identical at `main` and `1fded9d`. | R |

These are facts about commits. Which sources the running service loaded when it wrote revision 1, and when it served the capture, is not observable (**U**, R19).

### 7.2 IRR, as tracked

| Source | Position | Label |
|---|---|---|
| Runtime identity files | Not tracked. Read from `<IIPS_DATA_DIR>/investment/identity/`, which is git-ignored and absent by default. | R |
| Tracked roster files | 8: seven inside real-issuer evidence packs and one synthetic test fixture. They are not the runtime source. | R |
| Real ISINs in tracked rosters | 5, each in a real-issuer evidence pack. 1 of the 5 is among the 45 qualifying ISINs of section 7.1. | R |
| Roster, listing-map and corporate-action versions on the host | Unavailable. | U |
| Resolver code | `main` `08411bc` does not consume the D114 object. PR #563 (`d10afbb`, open, mergeable) does. | R |

## 8. Question 7: what W04 permits

The W04 deliverable lists "unavailable" among the counts it asks for. The roadmap's scope decision GD-1 states that "exact achievable coverage is measured, not fabricated". Recording "qualified 1, unavailable 63" for revision 1 is therefore a valid W04 record. It reconciles to the 64 holdings and names no holding by symbol.

It is not W04 acceptance. Three acceptance items are still open:

1. the exact security→listing→issuer mapping for the qualified holding;
2. the source and listing/series versions as loaded, not only as tracked;
3. review of the host evidence, which is still `HOST_CAPTURE_SUBJECT_TO_REVIEW`.

## 9. Question 8: use of the one issuer for W11

W11 depends on W08, W09 and W10. For one holding to carry a W11 acceptance run, all of the following must hold for the same issuer.

| Need | Position | Label |
|---|---|---|
| IRR resolver returns `RESOLVED` with an issuer, and the holding is assessable | Not possible on IRR `main` (R10). Possible with PR #563 only if the host roster and listing map contain the ISIN. | R, U |
| W08 code on IRR `main` | PR #563 is open, not merged. | R |
| Listing separately evidenced, as W08 requires | The holding has no exchange, so the listing would come from a preference rule (R12). | R |
| Qualifying financial evidence for that issuer | In PR #563, only the Banking engine has no structural blocker; the Technology engine has 7 required inputs with no authorized source. IRR tracks actual evidence packs for 5 real ISINs; the only one among the 45 is in the Technology sector. No actual Banking dataset is tracked. | R |
| Issuer and security present in the IRR dataset on the host | Unknown. | U |

This table describes the repositories. It does not say which issuer the holding is; that was not supplied and is not inferred.

Result: one issuer could in principle carry W11, because the roadmap measures achievable coverage. On present evidence it cannot. The identity half is unproven, and the financial half is not met by any tracked actual dataset.

## 10. Additional Windows-host evidence required

All items are read-only. Publish counts, digests and yes/no answers only. Publish no symbol, ISIN, company, value, path or endpoint name. Do not modify revision 1.

| # | Evidence | How | Publish | Closes |
|---|---|---|---|---|
| E1 | IRR resolver outcome for the holdings of revision 1 | One `GET /api/investment/portfolio/<portfolioId>/identities` against the running IRR server. Confirm the portfolio is at revision 1 immediately before and after, with the existing capture utility. | HTTP status. If 200: the count, the count per `state` and per `reason`, and `directory.rosterVersion`, `rosterDigest`, `rosterDataClass`. If 503: the `error` code and each issue's `file` and `code`. The IRR checkout commit. | Question 2; IRR source versions |
| E2 | IPD source versions of the checkout the IPC service was started from | In that checkout: the commit, whether the working tree is clean, the SHA-256 of `evidence/dhan-p7/qualification-manifest.json`, and whether the build output is newer than the last source change. | Commit; clean yes/no; whether the SHA-256 equals `13bd2ef1…78bc`; build current yes/no. Label as checkout facts, not running-process facts. | Condition C2, in part |
| E3 | Properties of the one populated identity | Read the object in the local capture. Compare its ISIN, series and the holding's company with the tracked P7 manifest by hand or with a local search. | `isinAuthority` value; series; whether an exact entry for that company, ISIN and series is in the manifest (yes/no); from E1, the resolver state for that holding. | Question 3; condition C2 for this holding |
| E4 | Import-time inputs, if retained | Check whether the IRR broker-import evidence journal holds a record whose `contentDigest` equals the `contentDigest` of the contribution in the capture. The read-only route `GET /api/broker-import/<portfolioId>/evidence/<importId>` returns one record; IRR derives the import id from the broker, the content digest and the read instant (`computeImportId`). Accept a record on exact digest equality only, never on a timestamp or a file name. | Record found yes/no. If yes: rows in the record; rows with an ISIN; rows with an explicit absence of ISIN; rows with an exchange; whether the row count equals 64. | Split of the 63 between the two cases of section 6.2 |

Notes:

- E1 on the reported build is expected to return `UNMATCHED` for all 64, or 503 if the identity files are absent. Either result is evidence. Neither is a defect of the capture.
- E4 is possible only if that import was retained. If no record matches, the split stays unavailable and no other source is to be substituted. A count from E4 describes the import inputs. It does not change revision 1 and does not give any holding a security identity.
- Recovering the typed reason per row is not requested. It would be a new measurement against current sources (section 6.3).
- No collector that reduces E1, E3 or E4 to a sanitized summary exists. If the operator prefers one, it is a small read-only utility of the same kind as the W03 collector and needs its own authorization.

## 11. Predecessor W03

The operator has run the W03 Reports inventory collector on the host (run `w03-reports-inventory-20261113T110350Z-96f8995a`, outcome `INVENTORY_COLLECTED`, eligibility `HOST_INVENTORY_SUBJECT_TO_REVIEW`). The [W03 status record](IIPS-W03-REPORTS-INVENTORY-STATUS-2026-11-13.md) is updated with that result in its section 9. Both halves of W03 now have host evidence. Both are operator-reported and subject to review, and W03 is not accepted.

W04 uses the portfolio half only. No report is linked to revision 1 by this assessment; the inventory itself reports zero artifacts reconciled to the captured revision.

## 12. Verification performed

All in a Linux sandbox, on repository content only.

| Check | Result |
|---|---|
| IPD `npm run build:tsc` | exit 0 |
| IPD `npm test` at this branch | 1,487 executed, 1,486 passed, 1 skipped, 0 failed |
| IPD source probe, `evidence/integration/w04-identity-coverage-2026-11-13/ipd-identity-source-probe.mjs` | exit 0; output identical on two runs; stored beside the script |
| IRR resolver probe, `irr-resolver-probe.ts` in the same folder, at IRR `08411bc` and `d10afbb` | results R10 and R11; output stored beside the script |
| IRR identity suites at `08411bc` | platform `tests/investment/identity-*.test.ts`: 104 passed, 0 failed. Frontend holding-identity, coverage-transport and capture suites: 6 files, 165 passed, 0 failed. |
| IRR D114 projection suite at `d10afbb` (PR #563) | 6 passed, 0 failed |
| Blob comparison of the identity sources at IPD `main`, `1fded9d` and this branch | identical |

The probes read tracked files and a synthetic fixture. They read no portfolio, capture, database or host state, and they print no ISIN, symbol or company.

## 13. Status and next roadmap activity

**W04: PARTIALLY COMPLETE.**

| Part | State |
|---|---|
| Coverage counts for revision 1 | Recorded: qualified 1, unavailable 63, total 64. Subject to review. |
| Tracked registry and source versions | Recorded. |
| Repository analysis of both resolvers | Complete. |
| Issuer mapping of the qualified identity | Open. Needs E1 and E3. |
| Source versions as loaded on the host | Open. Needs E1 and E2; the IPD running-service version is not observable without the build-identity change described in the Dependency 1 disposition. |
| Split of the 63 | Unavailable unless E4 finds a retained record. |
| Acceptance | Not given. Not claimed. |

Next activity, in roadmap order:

1. **W04, host step.** The operator collects E1, E2 and E3, and E4 if a record exists, and a reviewer reads them with the sanitized capture and inventory summaries. This completes the W04 record. It is the next activity.
2. After W04, the dependency graph opens W05, W06, W08 and W10. W05 and W06 are the next P0 items. W08 is the item that closes the gap found in section 5.2; its code is in IRR PR #563, which the IRR owner has not merged.
3. W11 stays blocked on W08, W09 and W10 and on qualifying financial evidence.

## 14. Not examined

- The capture file, the sanitized summaries and anything else on the Windows host.
- The values of the one populated identity.
- Which build wrote revision 1 and which sources it had loaded.
- The identity files in the host's IRR data directory.
- Whether the IRR evidence journal holds a record for the import that produced revision 1.
- IRR behaviour beyond the identity path: W09 consumption and the W10 and W11 code were read only as far as section 9 states.
