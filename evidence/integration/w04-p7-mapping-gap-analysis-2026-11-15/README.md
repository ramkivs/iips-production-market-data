# W04: P7 mapping gap analysis for the 64 DHAN holdings (2026-11-15)

**W04 status: PARTIALLY COMPLETE — NOT ACCEPTED.** Historical cause of revision 1: **UNPROVEN**.

This directory holds a read-only diagnostic and the findings it rests on. Nothing here changes
the registry, the source masters, a holding or an identity. The correction named in section 5
is a recommendation only. It is not implemented.

| File | Content |
|---|---|
| `w04-p7-mapping-gap-diagnostic.mjs` | The diagnostic. Read-only. Sanitized output. |
| `p7-mapping-gap-diagnostic-selftest.mjs` | Self-test on synthetic rows (29 checks). |
| `sample-output-synthetic.txt` | Output of one run on seven synthetic rows. |

## 1. Question

The qualification diagnostic of 2026-11-15, run by the Principal on the Windows host, reported:
64 holdings, company-level resolution 64 of 64, 1 QUALIFIED and 63 `MISSING_P7_MAPPING`
(62 NSE, 1 BSE), against a P7 registry of 96 mappings on 48 ISINs. Why one and not the others?

## 2. The path, as read in the sources

1. **Source.** `evidence/dhan-p7/source/api-scrip-master-detailed.csv`: the official Dhan
   instrument master retrieved on 2026-11-06 (217,104 rows; SHA-256 `6f19feb4…a010d`).
2. **Generation.** `scripts/dhan-p7-qualify.mjs` calls `qualifyInstrumentMaster(source, P04 master)`.
   A row qualifies when it is cash equity on NSE or BSE, has a provider id, a valid ISIN and a
   series, its ISIN resolves exactly to a P04 company, and that company has an ACTIVE listing on
   the row's exchange. There is no name or symbol matching. The P04 master is the one compiled
   into the code at the time of the run.
3. **Registry.** `evidence/dhan-p7/qualification-manifest.json` keeps the QUALIFIED records. The
   server loads only those. The manifest does not record which P04 master it was generated
   against, and nothing compares the two when the registry is loaded.
4. **Runtime.** `qualifyHoldingSecurityIdentity` resolves the holding's ISIN to a P04 company,
   requires an ACTIVE listing on the holding's exchange, then looks the registry up by
   company id, exchange segment and ISIN. No entry gives `MISSING_P7_MAPPING`.

## 3. Findings measured in the sandbox

These are facts of the tracked sources. They do not depend on any holding.

| Fact | Value |
|---|---|
| Commit that committed the tracked manifest | `f2bb47d`, 2026-11-06 |
| P04 master at that commit | batch `BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001`, 2,250 records |
| ISINs of that master that occur among the Dhan cash-equity rows | 48 of 2,250 |
| Re-run of the generator at `f2bb47d` | 96 QUALIFIED; equal to the tracked registry in every member |
| P04 master replaced | commit `60cad83`, 2026-11-08: batch `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`, 2,390 records |
| ISINs the two masters share | 48 |
| Manifest regenerated after the replacement | no (last change `f2bb47d`) |
| Generator and parser sources at `f2bb47d`, `1fded9d` and `a6abac7` | identical blobs |
| Re-run of the unchanged generator, same source, master of today (in memory) | 4,680 QUALIFIED: `NSE:EQ` 2,390, `BSE:A` 700, `BSE:B` 1,590; 0 ambiguous, 0 duplicate, 0 conflicting |
| ACTIVE P04 listing pairs that qualify at runtime, tracked registry | 90 of 4,680 (45 NSE, 45 BSE) |
| ACTIVE P04 listing pairs that qualify at runtime, re-run registry | 4,680 of 4,680 |
| Tracked mappings whose company id the master of today renamed | 6 (3 ISINs, NSE and BSE each) |

The tracked registry is therefore the answer to "which Dhan rows match the 2,250-record master
of 2026-09-22", and the runtime asks it about the 2,390-record master of 2026-11-08.

## 4. What the host run adds

The original 64-row CSV is not in the repository and was not found in the sandbox. The table
with one row per holding therefore comes from a run on the host. The diagnostic prints, per
holding (labels `H01`…; the order is by a hash and does not follow the file):

| Column | Meaning |
|---|---|
| `exchange` | NSE or BSE, as the import derives it. |
| `gate` | Company-level gate: `RESOLVED`, `UNMAPPED`, `AMBIGUOUS`. |
| `now` | Qualification with the tracked registry: `QUALIFIED` or `UNRESOLVED:<typed reason>`. |
| `p04Isin`, `p04ActiveListing` | The master of today has the ISIN; it has an ACTIVE listing on the exchange. |
| `registryIsin`, `registryExchanges` | The ISIN is in the tracked registry; on which exchanges. |
| `exchangeMatch` | The registry has the ISIN on the holding's exchange. |
| `companyIdAgrees` | That entry carries the company id of the master of today. |
| `lookupMatches`, `registrySeries` | Entries the runtime lookup finds; their series. |
| `notLoadedRecords` | Manifest records for the ISIN that are not QUALIFIED (excluded by status). |
| `sourceRows`, `sourceSeries` | Cash-equity rows of the retained Dhan master for the ISIN on the exchange; their series. |
| `sourceRowsOtherExchange`, `sourceRowsNotCashEquity` | Other rows of the retained master for the ISIN. |
| `rerunDisposition`, `rerunSeries` | What the unchanged generator decides for those rows against the master of today. |
| `afterRerun` | Qualification with that in-memory registry. Nothing is stored. |
| `category` | One of the closed list below. |

| Category | Class |
|---|---|
| `QUALIFIED_BY_EXACT_MAPPING` | qualified today |
| `REGISTRY_NOT_REGENERATED__ISIN_ABSENT` | registry-generation defect: stale input |
| `REGISTRY_NOT_REGENERATED__COMPANY_ID_CHANGED` | registry-generation defect: stale input |
| `REGISTRY_NOT_REGENERATED__OTHER` | registry-generation defect: stale input |
| `SOURCE_MAPPING_MISSING` | missing source mapping |
| `GENERATION_RULE_REJECTS_SOURCE_ROW` | the generator rejects an existing source row; read `rerunDisposition` |
| `QUALIFICATION_RULE_REJECTS_REGENERATED_MAPPING` | the runtime rejects a regenerated mapping; read `afterRerun` |
| `NOT_A_P7_MAPPING_GAP` | the typed reason today is not `MISSING_P7_MAPPING` |

It also re-derives section 3 on the host: the legacy re-run must equal the tracked registry, and
the re-run against the master of today must give the counts above.

### Run

Requirements: Node 22.13.0 or later; a built checkout (`dist` present); about 1 GB of memory
and 20 seconds. Run it under the permission model so that Node itself refuses any write:

```
node --permission --allow-fs-read=* w04-p7-mapping-gap-diagnostic.mjs --csv <original CSV> --ipd-root <IPD checkout>
```

| Exit | `RESULT:` | Meaning |
|---|---|---|
| 0 | `ANALYSED` | Every holding was classified and every check passed. |
| 1 | `ANALYSED_WITH_FAILED_CHECKS` | Holdings were classified, but a check failed (for example the counts differ from the baseline). |
| 2 | `INCONCLUSIVE` | Stopped with a `[STOP] <code>` line. No holding was classified. |

Stops include `CSV_SHA256_NOT_EXPECTED`, `SOURCE_MASTER_NOT_FOUND`,
`SOURCE_MASTER_SHA256_NOT_EXPECTED`, `MANIFEST_NOT_FOUND`, `COMPILED_MODULE_NOT_FOUND` and
`COMPILED_MODULES_NOT_SELF_CONTAINED`.

The output holds labels, counts, digests of whole files, yes/no answers, NSE/BSE, series codes
and values from closed lists. It holds no symbol, ISIN, company id, provider id, path, file
name, quantity, price or value.

### Limits

- It measures the checkout as it is now. It does not show what the server did at the time of
  the import; that remains UNPROVEN.
- The in-memory re-run is evidence about the generator and the source. It is not a registry,
  and qualifying against it assigns nothing.
- The retained source is the snapshot of 2026-11-06. Whether it is still current is a separate
  question (Stage 3D, open decisions G-02 and G-03).
- Labels are stable for one CSV. They are not comparable between different CSV files.

## 5. Conclusion and recommendation (not implemented)

Subject to the host run for the per-holding table: the cause is a **registry-generation
defect**. The registry was generated against the earlier P04 master and was not regenerated
when that master was replaced. The measurements show no missing source mapping (the retained
Dhan master has a row for every ACTIVE listing of the master of today) and no qualification-rule
defect (the unchanged rules qualify all of them).

Smallest governed correction: regenerate `evidence/dhan-p7/qualification-manifest.json` with the
unchanged `scripts/dhan-p7-qualify.mjs` from the retained snapshot against the P04 master of
today, under review, with the generation counts recorded. No rule changes. No identity is
guessed: every mapping is an exact ISIN join. Existing holdings are not touched by it.

To prevent a repeat: record the P04 source revision in the manifest and refuse, or report, a
registry whose revision differs from the master the runtime uses.

Not decided here: whether the snapshot of 2026-11-06 is fresh enough, and whether the vendor
series is an acceptable series source (Stage 3D, G-02 and G-03). Those are owner decisions.
