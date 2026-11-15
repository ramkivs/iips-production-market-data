# IIPS W04 — Broker import security-identity qualification: root cause and prevention (2026-11-15)

**W04 status: PARTIALLY COMPLETE — NOT ACCEPTED.** This record does not change that.

**Subject:** `DHAN_PORTFOLIO` revision 1 stores a `securityIdentity` object on 1 of 64 holdings and `null` on 63, while all 64 carry `identityStatus: RESOLVED`.

**Scope of this change:** the import now keeps what the security-identity step decided for every holding, and why. Nothing else changes. No identity is assigned, no holding of revision 1 is touched, the registry and the master are not changed, and the import still accepts the same files.

## 1. Answer

| Question | Answer | Standing |
|---|---|---|
| Why does a holding with a resolved company have no security identity? | The import runs two separate steps. The company gate resolves the company from P04 and writes `RESOLVED`. The security step needs a P7 registry mapping for the ISIN and exchange. Without one it stores `null` and continues. | Established from source |
| Why 63 of 64? | Most likely `MISSING_P7_MAPPING`: the tracked P7 manifest covers 48 ISINs, and the tracked P04 master resolves 2,390 companies. | **Unproven for revision 1** |
| Why was this not visible? | The typed reason was computed and dropped. It was not returned, stored or logged, and no audit event existed for a broker import. | Established from source |
| Can it recur silently? | Not after this change is in the running build. Every import returns counts by typed reason and writes one audit record per committed revision. | Established by test |
| Is revision 1 repaired? | No. That is not in scope and needs an owner decision. | — |

The cause of revision 1 stays unproven because no artefact records the reason computed at that import, and which build served it was not observed. Section 6 gives the one host run that would settle whether the reviewed sources are sufficient to explain it.

## 2. Evidence, by category

The four categories are kept apart. A statement appears in one category only.

### 2.1 Host evidence (reported by the Principal; not observed in this session)

- Revision 1 is one committed import: `INITIAL`, source `DHAN`, `SAVED_NEW_BATCH`.
- 64 rows: 63 with ISIN and NSE, 1 with ISIN and BSE.
- `securityIdentity` object on 1 holding (an NSE row); `null` on 63 (62 NSE, 1 BSE).
- The lineage utility returned `REPRODUCED_ALL`, 19 checks pass.
- IRR host checkout `08411bc`. IPD host checkout `1fded9d`. IRR pins the IPD packages to `1aee57f`.
- Not observed: which build the server process ran, its working directory, and which manifest file it loaded.

### 2.2 Source evidence (read at `b0388a2`, before this change)

| Fact | Place |
|---|---|
| The company gate writes `identityStatus: 'RESOLVED'` and `CANONICAL_P04` with the `companyId`. One unresolved row refuses the whole import. | `src/persistence/brokerImportPersistence.ts:62-77`, `:239` |
| The security step runs only when the row has an ISIN and an exchange and both sources are composed. | same file `:137` |
| A qualified result is stored. An unresolved result leaves `null`; its `reason` and `details` are not kept. | same file `:143-146` |
| `MISSING_P7_MAPPING` is returned when the registry has no mapping for the company, exchange segment and ISIN. | `src/providers/dhan/dhan_security_identity_service.ts:225`, `:249` |
| The registry is filled from `QUALIFIED` records of the P7 manifest. The loader looks in the working directory first, then beside its code. If it finds no file it returns an empty registry without an error. | `src/providers/dhan/dhan_local_daemon.ts:154-193` |
| The stored column is the JSON of the identity or `NULL`. | `src/persistence/portfolio_store.ts:1308` |
| The tracked manifest states its own coverage: generated `2026-11-06T05:45:58Z`; 23,764 equity candidates; 96 qualified; 23,644 `REJECTED_NO_P04_CORRESPONDENCE`. | `evidence/dhan-p7/qualification-manifest.json` |
| The 14 identity-deciding source files, `tsconfig.json`, the frontend mapper and Dhan adapter, and the P7 manifest are blob-identical at the pin `1aee57f`, the host commit `1fded9d` and `b0388a2`. | Git blob ids; listed in `SOURCE_BLOBS` of the diagnostic |
| IRR's result validators check known members only. An added optional member is accepted. | IRR `frontend/src/api/brokerImportStage4.ts` at `08411bc` (read-only) |
| The request IRR sends carries `symbol`, `isin`, `exchange` and no series. | same file, `prepareBrokerImport` |

### 2.3 Reproduced in the sandbox (new measurements; none is a record of revision 1)

| Measurement | Result |
|---|---|
| Tracked manifest: byte-order mark, SHA-256 | none; `13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc` |
| Built loader, from the repository directory and from another directory | 96 mappings both times |
| Every ACTIVE listing of the tracked master (4,680 ISIN and exchange pairs, 2,390 companies), tracked registry | company gate `RESOLVED` 4,680; `QUALIFIED` 90 (45 NSE, 45 BSE); `MISSING_P7_MAPPING` 4,590 (2,345 NSE, 2,245 BSE); no other reason |
| The same measurement on a build of the host commit `1fded9d` | identical counts |
| Synthetic 64-row import, 1 mapped and 63 unmapped | 1 identity, 63 `null`, every one `MISSING_P7_MAPPING` (test case 11) |
| Empty registry | 0 identities (test case 3) |

No real CSV, capture or portfolio store was read. All rows are issuer facts of the tracked master with invented quantities and prices.

### 2.4 Inference (unproven)

**Hypothesis:** all 63 holdings of revision 1 were `MISSING_P7_MAPPING`.

It holds if both conditions hold:

- **C1.** The build that served the import behaves as the reviewed sources do.
- **C2.** It loaded the tracked master and the tracked manifest.

What supports it: the stored shape (identities on a small minority) matches the reproduced coverage of 90 in 4,680. One identity on the host excludes an empty registry, if C1 holds.

What it does not explain by itself: whether the 1 qualified holding is one of the 48 manifest ISINs, and whether all 63 others are outside it. The diagnostic of section 6 measures exactly that.

Other reasons the code can return (`INACTIVE_OR_MISSING_LISTING`, `MISSING_SERIES_EVIDENCE`, `AMBIGUOUS_PROVIDER_MAPPING` and others) did not occur for any ACTIVE listing of the tracked master. They are not excluded for revision 1.

## 3. What changed

Identity decisions are unchanged. The change is additive.

| File | Change |
|---|---|
| `src/persistence/brokerImportPersistence.ts` | `mapBrokerImportHoldingsWithQualification` returns the holdings and, in the same order, the outcome for each. `mapBrokerImportHoldings` now returns its holdings. `persistBrokerImport` returns a summary and writes the record. New: `describeBrokerImportQualificationSources`, `countBrokerImportQualification`, `BROKER_IMPORT_UNQUALIFIED_HOLDINGS_WIRE_LIMIT`. |
| `src/contracts/broker_import_ipc.ts` | One optional member on `BrokerImportSuccess`: `securityIdentityQualification`. Five types. Type-only. |
| `src/persistence/portfolio_store.ts` | `recordBrokerImportQualification`, `brokerImportQualificationRecords`, the audit event name `BROKER_IMPORT_SECURITY_IDENTITY_QUALIFICATION`. |
| `src/persistence/durablePortfolioStorePort.ts` | The same two methods. The write is behind the existing write authorization. |
| `src/ui/portfolio_ui_package.ts` | Type-only re-export of the five types. |
| `tests/broker_import_security_identity_qualification.test.ts` | New: 25 tests. |

### 3.1 Per holding

`symbol`, `lineageDigest`, `companyId`, `securityIdentityStatus`, `qualificationAttempted`, `reason`, `details`, `securityId`, and the identifiers as the row carried them: `observedIsin`, `observedExchange`, `observedSeries`.

| `securityIdentityStatus` | Meaning |
|---|---|
| `QUALIFIED` | The master and the registry qualified the identity. It is stored. |
| `BROKER_SUPPLIED_UNQUALIFIED` | No qualification ran. The identity was built from the ISIN and series the broker supplied. This is the existing fallback. |
| `UNRESOLVED` | No identity is stored. `reason` is always set. |

Reasons: the eleven of `qualifyHoldingSecurityIdentity`, plus `MISSING_EXCHANGE` and `IDENTITY_SOURCES_NOT_COMPOSED` for a row the service is never called for.

### 3.2 Returned to the caller

`securityIdentityQualification` on a successful result:

| Member | Content |
|---|---|
| `appliesTo` | `COMMITTED_REVISION`, or `SUBMITTED_ROWS_NO_REVISION_WRITTEN` for a no-op. In the second case the counts describe the submitted rows against the sources loaded now. They say nothing about what an earlier import stored. |
| `holdings`, `companyIdentityResolved` | Counts. They are equal, because one unresolved company refuses the whole import. |
| `securityIdentityQualified`, `securityIdentityBrokerSuppliedUnqualified`, `securityIdentityUnresolved` | Counts per status. |
| `unresolvedByReason` | Count per typed reason. |
| `unqualifiedHoldings`, `unqualifiedHoldingsTruncated` | Symbol, status and reason of every holding that is not qualified; at most 512 entries. The counts are always complete. |
| `sources` | Master batch id and checksum, registry mapping count, registry digest. |
| `durableRecord` | See below. |

| `durableRecord` | Meaning |
|---|---|
| `RECORDED` | The record was written with the revision. |
| `NOT_RECORDED_NO_REVISION` | The import wrote no revision (`ALREADY_IMPORTED_NO_OP`). |
| `NOT_SUPPORTED_BY_WRITER` | The writer has no record surface. The outcome is still returned. |

### 3.3 Durable record

One hash-chained audit event per committed revision, written inside the import transaction. If the record cannot be written the import is rolled back. Read it with `brokerImportQualificationRecords(owner, portfolioId)`.

No table and no migration were added. `HoldingInput` and the holdings row are unchanged, so content digests and reconciliation are unchanged.

### 3.4 Not changed

- What `identityStatus: RESOLVED` means, and the read contract.
- Which imports are accepted or refused.
- The required members of the wire result.
- The P7 registry, the manifest and the P04 master.
- Revision 1 and every stored holding.
- `persistHoldingsSnapshotV2`: it has no caller in `src` outside its tests and is composed without identity sources. It still uses the plain mapper.
- `deriveV1IntendedEvidence` and `deriveV2IntendedEvidence`: they derive evidence for reconciliation and persist nothing.

## 4. Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | exit 0 |
| `npm test` | 1,663 executed, 1,662 passed, 0 failed, 1 skipped (before: 1,638 / 1,637 / 1) |
| New test file | 25 of 25 |
| `node scripts/verify-public-package.mjs` | exit 0, typecheck `PASS`, no forbidden hit |
| Diagnostic self-test | 24 of 24 |

### 4.1 The new tests

| Case | What it shows |
|---|---|
| 1 | Fully qualified: stored, counted, recorded. |
| 2, 3 | Company resolved, security unresolved: stored as before; `MISSING_P7_MAPPING` returned and recorded. Empty registry: every holding unresolved, and the result says so. |
| 4 | A listing P04 does not hold is refused by the company gate with no store effect. Synthetic mappings reach the other typed reasons. |
| 5 | Malformed ISIN: refused by the gate. A row without an ISIN: `MISSING_ISIN`, qualification not attempted. |
| 6 | Case and padding of the ISIN do not change the identity. The exchange is never defaulted. |
| 7 | Two candidate series are never chosen between: `AMBIGUOUS_PROVIDER_MAPPING`. |
| 8 | After a mapping correction the same row qualifies, but re-importing the same file is a no-op and the stored identity stays `null`. |
| 9 | Digests, lineage and row identifiers are kept verbatim. |
| 10 | The record agrees with the stored holdings; the audit chain verifies; another owner's record is not returned. |
| 11 | 64-row shape: 1 qualified, 63 unresolved, a reason for each. A failed record write rolls the import back. |
| IPC | Over a real socket through the shipped entrypoint, the result frame carries the outcome and `durableRecord: 'RECORDED'`. |
| Equivalence | For all 4,680 ACTIVE listings of the tracked master, and for edge rows and five source combinations, the holdings handed to the store are identical to those of the mapper before the change, in the same order. |

## 5. Limits

- **The change is not on the host.** IRR pins IPD to `1aee57f`. The host gets this change only after it is merged and IRR pins a commit that contains it. IRR was not changed.
- **IRR does not show the outcome yet.** It accepts the new member and ignores it. Showing the counts after an import is an IRR change.
- **Earlier imports have no record.** Revision 1 has none and cannot get one.
- **A re-import of the same file re-qualifies nothing.** It is `ALREADY_IMPORTED_NO_OP` (test case 8). A corrected registry reaches stored holdings only through a new governed import or an owner-approved repair.
- **Coverage is the underlying gap.** With the tracked manifest, 90 of 4,680 listing pairs qualify. Until the registry is re-qualified against the current master, most imported holdings will be reported as `MISSING_P7_MAPPING`. They will be reported, not hidden.

## 6. Host diagnostic (prepared, not run)

`evidence/integration/w04-broker-import-qualification-diagnostic-2026-11-15/w04-broker-import-qualification-diagnostic.mjs`

SHA-256 `629572186a6f91fec510f1b34f4ab961772fd911e6140c815250a417d3de2088`

It is read-only and prints counts, digests and typed values only. The run command and the meaning of each result are in the `README.md` beside it.

| Result on the host | What follows |
|---|---|
| `REPRODUCES_STORED_STATE` with 1 `QUALIFIED` and 63 `MISSING_P7_MAPPING` | The sources of the host checkout are sufficient to explain revision 1. The hypothesis is supported. It is still not a record of the import. |
| `REPRODUCES_STORED_STATE` with another reason | The stored shape is explained, by a different reason than expected. |
| `DIFFERS_FROM_STORED_STATE` | The sources in force at the import were not those of the checkout. C1 or C2 is false. |

It cannot show which build the server process ran. If the server may have run the package inside IRR's `node_modules`, run it a second time with `--ipd-root` at that package.

Known properties:

- The CSV reading is a reduced port of the Dhan adapter and mapper grouping: symbol, ISIN and exchange. It does not apply the mapper's exclusions (non-positive quantity or price, value threshold). For the recorded CSV, 64 rows gave 64 holdings, so no row was excluded.
- It pairs capture holdings with CSV holdings by symbol and stops if symbols are not distinct.
- It accepts two versions of `brokerImportPersistence.ts`: the one at the three reviewed commits, and the one of this change.
- The company gate is asked as of a fixed instant, `2026-11-13T00:00:00.000Z`. The qualification does not depend on it.

## 7. Recommendation: import or reject

This is a recommendation. The policy is the boundary owner's decision and is not changed here.

**Keep importing; do not reject on an unresolved security identity yet.**

- The stored state is truthful. `null` says no security identity was qualified. The defect was that the reason was dropped, and that is what this change fixes.
- Rejecting now would refuse almost every real import. With the tracked registry 90 of 4,680 listing pairs qualify.
- A rejection rule becomes reasonable after the registry is re-qualified against the current master. At that point an unresolved holding is an exception and not the normal case.

If the owner wants a stricter rule earlier, the outcome returned by this change is what such a rule would read. No further change to the mapper is needed.

## 8. Authority

The roadmap (B07) excludes Broker Import unless the boundary owner permits it or gives a revised instruction. The PRIORITY 0 request names Broker Import and allows a narrowly scoped, evidence-supported preventive change. This change was made on that reading: additive and diagnostic only.

Left as owner decisions:

1. Re-qualification of the P7 registry against the current master.
2. Whether `identityStatus: RESOLVED` should be shown when the security identity is `null`.
3. Whether an import with unresolved security identities is rejected.
4. What happens to revision 1: a new governed import, an approved repair, or no change.
5. Re-pinning IPD in IRR, and showing the outcome in IRR.
