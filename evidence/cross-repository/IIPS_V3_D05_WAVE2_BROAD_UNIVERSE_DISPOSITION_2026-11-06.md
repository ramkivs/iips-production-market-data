# IIPS V3 — D05 Wave-2 Security Master Disposition — 2026-11-06

**Governing authorization:** `AUTH-D05-WAVE2-BROAD-UNIVERSE-EXPANSION-2026-11-06-01` — Program Authority task of 2026-11-06 ("Execute the bounded Wave-2 Security Master expansion for the 67 unresolved NSE holdings identified in the completed B-04 assessment").
**Scope authorized:** the exact 67 NSE ISINs recorded `UNRESOLVED` in the B-04 assessment; the single RESOLVED scope row (`INE415A01038` — AGI Greenpac) is excluded. NSE exchange designation only. No unrelated security, universe widening, eligibility/provenance rule change, or new identifier methodology.
**Baseline (not re-opened):** `BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001` — 2,250 records, SHA-256 `7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5`, `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001`.

## 1. Input evidence (read-only)

| Artifact | Location | SHA-256 / reference |
|---|---|---|
| B-04 source export (68 rows) | verbatim copy: `evidence/operator_drop/wave2-2026-11-06/source.csv` | `2dc1d1fba6e183cfa657652d0dab98daac570df6e3ef3adbbc8f2a397fcabd0d` |
| B-04 assessment (row-level) | verbatim copy: `evidence/operator_drop/wave2-2026-11-06/assessment.json` | `3211fbc607b29632e77ffbb9ef88eb9c9e594ea392a48cac813ad74f155d23e4`; IRR repository `ramkivs/iips-review-recovered`, PR **#496**, merge `0a0aac2bba517be933dae7a91a89af2943996b51`, path `evidence/integration/b04-dhan-isin-nse-2026-11-06/` |
| Governing corpus deposition | `evidence/operator_drop/d05_security_master_broad_universe.json` | `7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5` (2,250 records) — **unchanged** |
| Machine-readable disposition | `evidence/operator_drop/wave2-2026-11-06/disposition-2026-11-06.json` | `2186087ce3b0c2c1c2cd7f3d3b51898a3e0e71eda40b918372c00f5c8fe8814d` |
| Human-readable disposition table | `evidence/operator_drop/wave2-2026-11-06/disposition-2026-11-06.md` | `47c6791ccd990ac3cb3a6e06cb197461618221055ef907f59ac2cfb50e191277` |
| Wave-2 disposition revision manifest | `evidence/operator_drop/d05_security_master_wave2_disposition_manifest.json` | `BATCH-D05-TIER2-BROAD-UNIVERSE-WAVE2-DISPOSITION-2026-11-06-001` |

The B-04 source is a broker-platform (Dhan) export reconciled by the owner against the Dhan Demat holdings statement as of 2026-11-06; B-04 itself records it as **not independently broker-authenticated** and lacking any exchange-side evidence. It contains, verbatim per row, only: `Scrip Name`, `ISIN Code`, and numeric price/quantity fields. It carries **no NSE/BSE symbol, no CIN, no lot size, no tick size, no face value, no industry/sector and no ACTIVE-listing evidence**, and no exchange column (`NSE` designation is the assessment's operational designation).

## 2. Eligibility application (existing rules, unchanged)

Checks executed for all 67 rows, programmatically, against both the source and the governed corpus:

| Check | Result |
|---|---|
| ISO 6166 structural format | 67/67 PASS |
| ISO 6166 check digit (Luhn) | 67/67 PASS |
| Uniqueness within the 67 scope rows | 67/67 distinct |
| Presence in governed corpus (ISIN exact match) | **0/67** present |
| B-04 quarantine identifiers | 67/67 carried verbatim into the disposition artifact |
| Corpus collision or mapping conflict | none (no ISIN, symbol or companyId overlap) |
| Mandatory governed-record fields obtainable from authoritative evidence | **NOT obtainable** — see §3 |

## 3. Decision — zero incorporation; all 67 remain UNRESOLVED

The existing eligibility and provenance rules are applied without weakening:

- the contract (`validateInstrumentMaster`, `src/contracts/d05_security_master.ts`) mandates **at least one exchange symbol** (code `IDENTITY_AMBIGUITY`), a positive integer `lotSize`, a positive `tickSize`, plus mandatory companyName/industry/sector/listingStatus/faceValue/currency/effectiveFrom and a usable `companyId`;
- the governed deposition process (`AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001`) deposits **full** records — the 2,250-record baseline carries symbol/CIN/sector/face/lot/tick for every record;
- the B-04 source supplies **none** of the mandatory, absent fields above; it supplies no value that can yield them without invention;
- manufacturing NSE symbols, CINs, sectors or trading parameters is explicitly prohibited by the authorization's boundary conditions; fuzzy name matching and bulk widening are prohibited on the program side (IPD/IRR reconciliation §25; PA decision 2026-10-19 §5);
- an ISIN checksum is not an origin or eligibility discriminator (noted in the 2026-10-19 PA decision review, `d05_security_master_data.ts: all 2,250 ISINs pass contract regex + ISO 6166 check digit`).

**Outcome: ADDED 0 · ALREADY_PRESENT 0 · INELIGIBLE 0 · UNRESOLVED 67.** The eligible portion of the authorized scope is **zero**, and is reported as such — not padded. All 67 B-04 quarantine identities are retained (`disposition-2026-11-06.json → rows[].b04NewQuarantineId`); no UNRESOLVED identifier was forced into the master.

## 4. New immutable revision (disposition-only)

`BATCH-D05-TIER2-BROAD-UNIVERSE-WAVE2-DISPOSITION-2026-11-06-001` — published as `evidence/operator_drop/d05_security_master_wave2_disposition_manifest.json`. It is deliberately a **disposition revision, not a re-deposition**:

- `kind = DISPOSITION_ONLY__NO_DEPOSITION__CORPUS_BYTE_IDENTICAL`;
- `fileChecksumSha256 = 7f53540b…74b5` (the corpus is byte-identical; Wave-1 stays operative, verifiable, and byte-comparable);
- `priorManifest`, `priorRevisionBatchId`, `previous checksum` and `recordCount: 2250` are recorded; the prior manifest file `evidence/operator_drop/d05_security_master_manifest.json` is untouched (concretely asserted by test W2-D-03);
- `incorporated: 0`, `unresolved: 67`;
- `authorizationRef = AUTH-D05-WAVE2-BROAD-UNIVERSE-EXPANSION-2026-11-06-01` (cites the Wave-2 task, never the Wave-1 act);
- `source` block pins the B-04 copies and their hashes; `dispositionReportSha256`/`dispositionTableSha256` pin the disposition artifacts; `claimBoundaries` records DEPOSITION_DID_NOT_OCCUR / CORPUS_BYTE_IDENTICAL / NO_REAL_CLASSIFICATION / NO_SYMBOL_ASSERTION / SOURCE_NOT_EXCHANGE_EVIDENCE / NO_OPERATIONAL_WRITE / WAVE1_PRESERVED.

No runtime identity source changed; no resolver, contract, quarantine or hydration behaviour changed; no existing test or pin was modified. New tests only: `tests/d05_wave2_broad_universe_disposition.test.ts` (W2-D-01 … W2-D-09), which pin: corpus byte-identity, runtime master count/revision, prior manifest integrity, source copy hashes, per-row disposition semantics against the B-04 assessment copy, honest summary, disposition-manifest claim boundaries, and **wave2-residual refusal** — governed resolution still fails closed with `UNMAPPED_IDENTIFIER` for every one of the 67.

## 5. What was NOT done / NOT authorized

No re-deposition, no schema change, no manifest change to the Wave-1 artifacts, no classification, no symbol assignment, no corpus widening, no reconciliation v1/v2/W-1 change, no B-01/B-02/B-04 or PR #129–#132 reopening, no operational DB access/write/activation, no broker-authenticity claim, no portfolio/holdings move, no claim that any of the 67 is tradable/eligible for institutional use, no claim of production readiness or Gate 4/5 passage.

## 6. Publication

Committed to `arena/beded813-iips-production-market-data` against `main@749d42067edc86e74d2cf35deb4562c4549687a0`; submitted as one pull request against `main`. Head CI, the merge commit, merged-main CI and the independent clean-clone readback are recorded in the PR/merge record and the final PA receipt for this task; this document contains no post-merge facts and claims no outcome that has not occurred.
