# IIPS V3 D05 — WAVE-3 EQ BUNDLE SOURCE VALIDATION RECORD (2026-11-07)

**Date:** 2026-11-07 · **Branch:** `arena/59e54963-iips-production-market-data` · **Audience:** Program Authority (PA) · **Status:** VALIDATION COMPLETE · **Readiness: DEPOSITION_BLOCKED — NOT deposition-ready.**

**Authority:** PA one-pass direction (2026-11-07) "D05 WAVE-3 — EQ UNIVERSE SOURCE ACQUISITION, VALIDATION & GOVERNED REPLACEMENT" over the published bundle: `evidence/D05-Wave3/D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip` (publication commit `c2b04f612b738031878df779ac1c2b5dbb1d39a5`). No deposition act, batchId, corpus re-pin or B-06 action is performed or authorized by this record.

**Non-claims.** Nothing is deposited, authenticated, re-pinned or promoted. Historical corpus, manifests, receipts and pinned artifacts are unchanged (§12). The bundle bytes are preserved unmodified; validation read them as supplied. The ACTIVE NSE CM universe remains Wave-2's two verified securities plus the governed broad-universe corpus (excluded from any replacement per Option B).

---

## 1. Published bundle integrity

| Check | Result |
|---|---|
| Publication commit on `origin/main` | `c2b04f612b738031878df779ac1c2b5dbb1d39a5` (single commit, `ADD D05 Wave-3 EQ source and evidence bundle`, adds only the zip; tree at `main` == that tree) ✓ |
| Local branch fast-forwarded to published commit | ✓ |
| ZIP SHA-256 | `6332B050132A160E89E5906D131E12535AC1105D4B781330FA63F0E0AF1D41F4` — **matches publication record** ✓ |
| Archive integrity (`unzip -t`) | No errors in 21 files ✓ |
| `SHA256SUMS.txt` verification (all listed entries) | **17/18 OK**; **1 MISSING — `01_source_material/MCA/company_master_data_2026-11-07.zip` (expected sha256 `d3853a0dc66a218836a5ee5bc7a3ac397f1c4a0963f44a880b9fccf9e92e440c`) is ABSENT from the archive.** The MCA raw registry is NOT in the bundle (see B1). |
| Latest versions per bundle README | taxonomy = `arena_taxonomy_submission(2)` ✓ (`02_latest…/arena_taxonomy_submission.csv`); tick = `arena_tick_size_evidence(1)` ✓; FV recon = `arena_mca_face_value_reconciliation(2)` ✓ (byte-identical to `03_prior_iterations/arena_mca_face_value_reconciliation_v1.csv` — same sha256 `7758718d…`); identity bridge = `arena_mca_identity_bridged(1)` ✓ (`02_latest…/arena_mca_identity_bridged.csv`). Earlier placeholder/template generations remain only in `03_prior_iterations/` and were not used. |
| File-level SHA-256 (all present files) | All match `SHA256SUMS.txt` ✓ (exit `0`) |
| NSE Industry Classification reference | `01_source_material/Taxonomy_Reference/NSE_Indices_Industry_Classification_2023-07.pdf`, 452,220 bytes, text layer machine-extractable (WinAnsi; spaces stripped for matching); used for hierarchy validation only |

**Bundle custody note.** The bundle is incomplete relative to its own manifest: the MCA raw master is missing. Nothing else about the bundle is unverifiable (all hashes chain), but the MCA ZIP absence is an explicit custody gap recorded here and in §11 (B1).

## 2. Working universe validation (2,390 NSE EQ)

| Fact | Value |
|---|---|
| Source | `01_source_material/NSE/EQUITY_L(1).csv` (sha256 `da7eb83c…`) — 2,630 rows |
| Series distribution | `EQ` 2,390 · `BE` 207 · `BZ` 33 |
| Working universe | **Exactly the 2,390 `EQ` rows** (BE/BZ excluded by direction; out of deposit intent) |
| ISIN validity (shape + Luhn, repo validator `d05_corpus_audit.ts`) | **2,390/2,390 valid** ✓ |
| ISIN uniqueness | 2,390 unique ✓ |
| Symbol uniqueness | 2,390 unique ✓ |
| Serialization | ASCII, comma-separated, header `SYMBOL,NAME OF COMPANY, SERIES, DATE OF LISTING, PAID UP VALUE, MARKET LOT, ISIN NUMBER, FACE VALUE` (leading space on `SERIES` tolerated by parser normalisation) ✓ |
| ISIN↔CFI identity | `ESVUFN` 2,371 · `ESVTFN` 12 · `ESNUFN` 2 · `ESVUPN` 2 · `ESRUFN` 2 · `ESVUFR` 1 (from MCA bridge, all depository-equity CFIs) — no corporate-action equity derivatives or preference shares in the EQ set beyond the depository CFI evidence shown |
| EQ ISINs present in depository reference `ISIN_DETAILS_05-Nov-2026.csv` | **2,390/2,390** ✓ (face-value cross-walk evidence complete) |

## 3. NSE / BSE / ISIN reconciliation

| Check | Result |
|---|---|
| BSE master used (cleaned) | `01_source_material/BSE/BSE_ACTIVE_EQUITY_CLEANED.csv` (sha256 `66362fc3…`, 5,137 rows; BOM present, CRLF tolerated by parser normalisation) |
| Cleaning ledger (vs original 5,139 rows) | Exactly 2 rows removed, both non-conforming: `523031 / ADSDIAG` (ISIN `-`), `531562 / PUSHPIN` (FV `NA`, ISIN `NA`). Bond/preference/`,' instrument rows retained elsewhere are equity-only filtered downstream; 5,131 Instrument=`Equity` rows retained. Cleaning was legitimate; original retained side-by-side ✓ |
| EQ ISINs matched in BSE cleaned | **2,290 / 2,390 (95.8%)** |
| EQ ISINs with NO BSE active-equity match | **100** — predominantly securities listed in the 2024–2026 cohort (e.g. `IRISDOREME`, `LEMERITE`, `GEEKAYWIRE`, `SAGARDEEP`). Full list in §11 (B2) |
| ISIN → multiple BSE scrip codes among EQ set | **0** ✓ (no identity conflicts) |
| Duplicate scrip codes / security ids | **0** ✓ |
| BSE face value used? | No — contract uses BSE for `bseSymbol`/`bseScripCode` only; no BSE face-value consumption required or introduced |
| Security identity changes | None performed; no renaming, re-mapping or inference applied anywhere in this work |

## 4. Taxonomy validation (latest supplied CSV)

**File used: `02_latest_prepared_candidates/arena_taxonomy_submission.csv`** (sha256 `976c5bb31b8ad89a…`, 2,390 rows × 7 cols: `isin, symbol, companyName, macroEconomicSector, sector, industry, basicIndustry`). Earlier placeholder/template (`03_prior_iterations/arena_taxonomy_submission_initial.csv`, `_EQ_template.csv`) were not used.

| Check | Result |
|---|---|
| Coverage vs EQ universe | **2,390 / 2,390 rows; all ISINs valid; all fields non-blank; unique ISIN per row** ✓ |
| Hierarchy internal consistency | `sector→macro` 13 pairs · `industry→sector` 15 pairs · `basicIndustry→industry` 17 pairs — **no child maps to two parents** ✓ |
| All names exist in supplied codebook (NSE Indices *Industry Classification Structure*, July 2023) | **40/40 needles found** (9 macroEconomic, 13 sector, 15 industry, 17 basic industry) ✓ — every hierarchy label used is a legal codebook node |
| **Company-wise accuracy at scale** | **FAIL.** 1,532 / 2,390 = **64.1% of rows collapse to `Capital Goods / Industrial Manufacturing / Industrial Products`**, including plain misassignments such as `INFY`, `TCS`, `WIPRO`, `LTM`, `RELIANCE`, `NTPC`, `LICI`, `HATHWAY`, `WSI` (all: Industrial Manufacturing). Plausible-looking assignments exist elsewhere (`HCLTECH`→IT Software; `IOC`/`ONGC`→Refineries & Marketing; `SBIN`/`CANBK`→Public Sector Bank; 38 private-sector-bank CINs) but are concentrated in a minority of the universe with no rule evidence. Financial-sector names predominantly default into Industrial/Capital Goods rather than Financial Services/Banks. |
| **Per-record provenance** | **None** — the taxonomy CSV carries no provenance column and no evidence of how each mapping was assigned (contrast the MCA bridge/FV files, which carry `provenance`). |
| Disposition | Coverage-based validation PASS; **accuracy/provenance validation FAIL** ⇒ the file is admissible as structural input but is **not admissible evidence of correct classification for a deposition**. Rework requires the operator/PA re-classify against an authoritative, named mapping (owner-licensed or official) — not manufacturable in-scope (no-invention rule). See §11 (B3). |

**Do not revert to prior taxonomy iterations.** The earlier Placeholder files were not used and remain untouched in `03_prior_iterations/`.

## 5. Tick-size route disposition

**File used: `02_latest_prepared_candidates/arena_tick_size_evidence.csv`** (sha256 `d94c5646…`, 2,390 rows × 8 cols; `isin, symbol, companyName, faceValue, tickSize, priceTierRule, governingReference, provenanceStatus`). All values: **`tickSize` = 0.05 for 2,390/2,390**; `priceTierRule` = "SEBI Price-Linked Tick Size Framework (Tier-based: 0.01 to 5.00 INR)" on every row.

| Route | Tool result |
|---|---|
| Provided as `--tick-rules` (recommended, strongest per-record binding) | **§8 run: verdict `DEPOSITION_BLOCKED` solely due to MCA/BSE gaps; tickSize reported `SOURCE_PROVIDED`** — `validRows 2390`, `coveredIsins 2390/2390`, missing `0`, conflicts `0`. All `0.05` values are valid members of the accepted CM cash tick set. ✓ |
| Provided as `--tick-size-uniform 0.05` (the act-bound uniform route you directed) | **verdict `DEPOSITION_BLOCKED`**; tickSize reported **`DERIVED`** with the note "uniform tickSize 0.05 bound by the Wave-3 deposition act… never a hidden default" — **mode `uniform` requires the act to bind it.** |

**Contractual gap for the uniform route (precise):** no deposition act exists yet to bind 0.05; R-7/D-9 admit uniform only via act binding. Additionally, uniform 0.05 is not universally the correct CM tick under the current **price-linked** framework (i.e. securities priced < ₹250 trade at ₹0.01; > ₹1,000 at ₹0.10/₹0.50/₹1.00/₹5.00 at the applicable tiers; ordinary employees band-membership review is monthly). The tick evidence's own `priceTierRule` text cites the tier framework, which conflicts with a flat 0.05 for out-of-band prices. This is an **act-time evidence decision**, not a data defect fixable in-sandbox: the act must either (a) bind uniform 0.05 **with an explicit deviation notice and rationale** (accepting reference-data precision loss), or (b) require a per-price-tier tick extract as-of the act date. **No new tick file is requested; the supplied file fully supports the rules route, and the uniform route is available only as an act-bound derivative.**

## 6. MCA identity bridge + face-value reconciliation (latest: `arena_mca_identity_bridged(1)` / `arena_mca_face_value_reconciliation(2)`)

| Check | Result |
|---|---|
| Bridge rows | 2,390 × 11 cols (`isin, symbol, companyName, issuerNameInDepository, cin, faceValue, paidUpValue, securityDescription, cfiCode, mcaIdentityStatus, provenance`), 2,390 unique ISINs ✓ |
| Identity status | `Verified via MCA Registry Master Match` 2,296 · `Unmatched / Format Validation Failed` **94** (symbols: `AAREYDRUGS, ABCIND, ADVANIHOTR, AMNPLST, ANDREWYU, ASIANTNE, BALMLAWRIE, BANCOINDIA, BANKBARODA, BERGEPAINT, BHAGCHEM, BIOFILCHEM, BLACKROSE, BOMDYEING, CANBK, CGVAK, CHAMBLFERT, CHEVIOT, CORALFINAC, DBCORP, DEEPAKFERT, DIAMINESQ, DSSL, FACT, FOODSIN, GILLANDERS, GNFC, GRAUWEIL, GROBTEA, HATHWAY, HGINFRA, HUDCO, IMFA, IMPAL, INDIANB, INDIANCARD, INDIANHUME, INDPRUD, INDTONER, INVENTURE, IOB, IWP, J&KBANK, JAYSREETEA, JYOTIRES, KAKATCEM, KAMATHOTEL, KARURVYSYA, KCP, KERNEX, KHAICHEM, KOVAI, KRITI, LAKSHMIMIL, LFIC, LICI, LT, M&M, M&MFIN, MAHABANK, MOTOGENFIN, NATIONALUM, NRBBEARING, ONGC, ORIENTPPR, PATINTLOG, PIGL, PNB, POCL, PSB, PUNJABCHEM, RATNAMANI, S&SPOWER, SANDUMA, SAPPL, SBIN, SDBL, SHREDIGCEM, SPIC, SUKHJITS, SUNFLAG, TAINWALCHM, TAJGVK, TANAA, TATAPOWER, TERAI, THACKER, TRIVENI, TUTIALKA, UCOBANK, UMIYA-MRO, WATERBASE, WHBRADY, WSI`). 18 of 94 listed in 2026; the remaining 76 span 1995–2025 — the failure is **not confined to recent listings**. |
| Provenance | Every row's provenance: `Official MCA Company Master Registry Cross-Walk` (i.e. a single upstream artifact: the expected `company_master_data_2026-11-07.zip`, sha256 `d3853a0d…`, **absent from bundle** — see B1) |
| CIN validity of resolved rows | 2,296/2,296 match `^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$` ✓; first letters all L (2,162) / U (134) ✓ |
| **One-to-many CIN** | Exactly one CIN appears twice: `L29120MH1986PLC042028` → `JISLDVREQS` (`IN9175A01010`) and `JISLJALEQS` (`INE175A01038`) — **two EQ lines (plain/DVR) of one legal company (Jain Irrigation Systems); identical normalized companyName.** One company, two securities — **not an identity collision.** Source-readiness tolerates this (CIN duplicates do not block; ISIN uniqueness is validated anyway). |
| **Genuine identity collisions** | **0** ✓ (all resolved CINs unique regex-valid; ambiguity bridges in the re-feed = 0, ambiguous name merges = 0 — tool output §8) |
| `companyName` versus NSE (exact-normalized) | **2,390/2,390 match** ✓ |
| Face-value reconciliation (2,390 rows; `Verified via Depository ISIN Cross-Walk`; provenance `Authoritative Cross-Walk (EQUITY_L & ISIN_DETAILS)`) | **Internally consistent with bridge FV: 0/2,390 mismatches; with NSE EQUITY_L `FACE VALUE`: 0/2,390 mismatches** ✓; all positive ✓; FV distribution: 10 → 1,156 · 1 → 510 · 2 → 480 · 5 → 235 · and one of ₹8/₹6/₹100/₹1000 plus single ₹3/₹4 values |
| MCA master provides `faceValue` evidence? | Yes — via the bridge's `faceValue` column, into the derived MCA input (§8). **No separate face-value dataset is requested** — the supplied reconciliation satisfies the face-value requirement for the money fields; the coverage gap remains the 94 ISIN→CIN links only |

**Unresolved root cause (evidence only).** The 94 rows are blank-`cin` by construction of the artifact — the cross-walk did not produce a registry match for those ISINs. The upstream MCA master bytes (`company_master_data_2026-11-07.zip`) are not in the bundle, so re-bridging in-sandbox is impossible and no printable match can be verified for any of the 94 without re-supply. Notably, many are seasoned large caps (SBI, ONGC, L&T, Bank of Baroda, Canara Bank, HUDCO, LICI, National Aluminium) — i.e. absence in this artifact is not absence from the registry in general; the failure mode of the cross-walk against the registry is not further diagnosable from supplied bytes alone.

## 7. Deposition-intended mechanics (derived inputs only — no invented evidence)

Working copies derived in `/tmp` for the validation run; **none committed**:
- `nse_eq.csv` — the 2,390 `EQ` rows of `EQUITY_L(1).csv`, header preserved (sha256 `1db45e4af54b723c…`). The tool measures against the NSE file; the filter records the EQ deposit intent explicitly.
- `mca_derived.csv` — 2,296 rows `isin,cin,companyName,faceValue` taken verbatim from the bridge (CIN present rows only); the 94 unresolved rows intentionally absent so tool gaps surface truthfully (sha256 `bd8246b7dd570f59…`).
- Taxonomy, BSE and tick inputs passed as-supplied (filenames §3–§5).
- `audits/` outputs are gitignored; this record is the committed evidence.

## 8. Actual readiness run results (merged PR #138 toolchain)

Two deterministic runs (same inputs, tick supplied twice both ways):

| Metric | `--tick-rules` run | `--tick-size-uniform 0.05` run |
|---|---|---|
| Verdict | **`DEPOSITION_BLOCKED`** (exit 4) | **`DEPOSITION_BLOCKED`** (exit 4) |
| Blocking reasons | `100 of 2390 NSE securities have no BSE listing match (bseSymbol/bseScripCode cannot be provisioned)`<br>`94 of 2390 NSE securities have no MCA linkage (cin/faceValue cannot be provisioned)` | identical to the left |
| Conflicts | **0** | 0 |
| tickSize | `SOURCE_PROVIDED` (rules; `validRows 2390`, `coveredIsins 2390/2390`, sha256 `d94c5646…`) | `DERIVED` (uniform 0.05; act binding not yet available — noted as required by tool docs) |
| All other MANDATORY coverage rows | `SOURCE_PROVIDED` | identical |
| Advisory | `currency` DERIVED (INR, stated by act); NSE↔MCA faceValue cross-check `2296 compared / 0 divergences` | identical |
| `unionIsins` | 5,237 · `isinsPresentInAll` 2,198 · NSE-without-taxonomy **0** · taxonomy unmapped **0** · MCA unmapped **0** (after ISIN bridge) | same |

**Deposition readiness: NOT READY** — precisely two contract blockers (B1, B2), plus a substantive quality gate inside the taxonomy input (B3) and one act-binding requirement for the uniform-tick route (B4). **192 unique securities (100 ∪ 94, overlap 2) have no complete evidence chain.** 2,198 securities are present in all four feeds — a coincidental numeric overlap with the historical exclusion count and **no relation is claimed**.

## 9. Records quarantined or rejected (by evidence gap — not by judgement)

| Bucket | Records | Deposition intent |
|---|---|---|
| No BSE link | 100 (list in §11 B2 sets) | Cannot provision `bseSymbol`/`bseScripCode` — fail closed |
| No MCA bridge | 94 (list §6) | Cannot provision `cin`; `face_value` equally blocked (values exist via FV reconciliation but the tool ties mandatory `faceValue` to the MCA input) |
| Overlap | 2 | Count once |
| **Fully evidenced** | **2,198** | Not deposition-authorized here — act (P3) still required; Option B gates apply (2,198 historical broad-universe records excluded; these 2,198 EQ are a different population by construction of the supplied source) |
| Identity collisions | 0 | n/a |
| Taxonomy misclassification | Unknown members of the 1,532-row default bucket (demonstrably includes INFY/TCS/WIPRO/LTM/RELIANCE/LICI/NTPC/HATHWAY/WSI) | Fail closed for deposition claims until PA directs classification rework or accepts deviation |
| ISIN validation failures | 0 | n/a |

No record was altered, re-labelled, re-mapped or excluded by code in this work — exclusions are evidence states, exactly as the tool reports them.

## 10. Acquisition-process correction applied in-scope (PR #138 contract tooling)

`scripts/acquisition/Acquire-D05-Sources.ps1` — see `scripts/acquisition/README.md`. Against the bundled tool:
1. **Removed** the NSE Indices classification PDF file picker (no PDF input exists in the implementation).
2. **Removed** the separate per-ISIN industry-mapping CSV picker (the single taxonomy CSV *is* the mapping; the bundled prompt could only fail downstream).
3. **Added** an explicit single-file taxonomy spec (`industry` + `sector` required non-blank, keyed `isin` or `cin`, `basicIndustry` optional).
4. MCA prompt tightened: **current as-of act date, licensed**, ISIN/SYMBOL bridge column strongly preferred; obsolete any reliance on stale/unverified mirrors.
5. Original bundle tool preserved byte-unchanged (provenance) — the corrected copy is the in-repo counterpart for future Wave-3 runs. Verifier logic unchanged (`Verify-D05-SourceDrop.ps1`).

**Correct acquisition contract (merged implementation — authoritative):** NSE master + BSE master + MCA master (cin+name+faceValue) + single taxonomy CSV + tick evidence (rules or act-bound uniform). Nothing else is requested.

## 11. Genuine external blockers (exact, with evidence)

| # | Blocker | Exact evidence | Owner / dependency |
|---|---|---|---|
| **B1** | MCA raw master missing from bundle + 94 blank-CIN rows | `SHA256SUMS.txt` lists `01_source_material/MCA/company_master_data_2026-11-07.zip` (`d3853a0d…`); file **absent**; bridge rows for 94 ISINs carry `cin:''`, `mcaIdentityStatus: 'Unmatched / Format Validation Failed'` | Operator re-supply (licensed, current as-of act date) or act enumerates exclusion of the 94 with reasons |
| **B2** | 100 NSE-EQ securities absent from BSE listings | EQ∩BSE cleaned = 2,290/2,390; missing list: `INE006Z01016 ARVEE`, `INE00IK01029 OSWALSEEDS`, `INE00KV01022 RAJMET`, `INE00LM01029 SONAMLTD`, `INE00PV01013 AHLADA`, `INE00U801010 PARIN`, `INE00Y801016 AKG`, `INE00Z501029 KRITIKA`, `INE01GN01025 IRISDOREME`, `INE01II01013 SILGO`, `INE01JE01028 MARINE`, `INE025A01027 CONSOFINVT`, `INE087Z01024 AAKASH`, `INE0G1L01025 LEMERITE`, `INE0J5601015 KRISHNADEF`, `INE0KNW01016 KNAGRI`, `INE0L2Y01011 ARHAM`, `INE0L4K01016 VITAL`, `INE0MEG01014 VIVIANA`, `INE0MGM01017 ANNAPURNA`, `INE116G01013 VARDHACRLC`, `INE118H01025 BSE`, `INE121N01019 THEJO`, `INE129Z01016 SINTERCOM`, `INE155Z01011 MACPOWER`, `INE188Y01031 VERTOZ`, `INE202Z01029 TSFINV`, `INE203Y01012 CRESTO`, `INE215F01023 WIPL`, `INE262Z01023 LATTEYS`, `INE263W01010 MAHESHWARI`, `INE283A01014 PRECOT`, `INE291W01037 GLOBAL`, `INE351Y01019 BETA`, `INE358U01012 ZOTA`, `INE365I01020 NBIFIN`, `INE382T01030 GVPTECH`, `INE395H01011 STEELCITY`, `INE412C01023 JMA`, `INE414B01021 ANTGRAPHIC`, `INE439T01012 NITIRAJ`, `INE451F01024 APOLSINHOT`, `INE458F01011 UNITEDTEA`, `INE481Z01011 UNIINFO`, `INE486Y01013 TOUCHWOOD`, `INE491V01019 CROWN`, `INE500X01013 LEXUS`, `INE506W01020 KRISHANA`, `INE511Y01018 MMP`, `INE514Y01020 MOKSH`, `INE520H01022 BEARDSELL`, `INE520Y01019 ICEMAKE`, `INE528A01020 GKWLIMITED`, `INE542Z01028 KAPSTON`, `INE543V01017 ACEINTEG`, `INE546V01010 EIFFL`, `INE548Z01017 LAGNAM`, `INE555Z01020 TARACHAND`, `INE558R01013 HECPROJECT`, `INE581X01021 GLOBE`, `INE593W01028 FOCUS`, `INE618N01022 BALAXI`, `INE646C01018 GROBTEA`, `INE669X01032 GEEKAYWIRE`, `INE688Y01022 DANGEE`, `INE691Z01023 GANGAFORGE`, `INE696V01013 JAIPURKURT`, `INE697V01011 PANSARI`, `INE715Y01031 SHRADHA`, `INE720A01015 KOTHARIPET`, `INE721Z01010 AARON`, `INE732S01012 SAKAR`, `INE736A01011 CDSL`, `INE737W01013 AKASH`, `INE738V01013 ARTNIRMAN`, `INE740V01019 AGROPHOS`, `INE748Z01013 SUMIT`, `INE756C01015 NDGL`, `INE782X01033 SERVOTECH`, `INE786W01010 RKEC`, `INE801L01010 AIROLAM`, `INE801V01019 LAXMICOT`, `INE802W01023 BOHRAIND`, `INE813V01022 MCL`, `INE819L01012 ELGIRUBCO`, `INE820Y01021 AJOONI`, `INE828O01033 MITCON`, `INE839G01010 JOCIL`, `INE850E01012 LFIC`, `INE862Y01015 BANKA`, `INE885F01015 MASKINVEST`, `INE900L01028 MBAPL`, `INE908V01012 LIBAS`, `INE933X01016 SHANTI`, `INE970N01027 SPCENET`, `INE972X01022 VAISHALI`, `INE974Z01015 PRITI`, `INE976T01013 SAGARDEEP`, `INE991I01015 ASPINWALL`, `INE997Y01027 MITTAL` | Operator re-verify against current BSE export (possibly these are NSE-only listings — status unchanged by this work), or act enumerates exclusion with reasons |
| **B3** | Taxonomy accuracy/provenance unproven at scale | 1,532/2,390 = 64.1% rows in `Industrial Manufacturing / Industrial Products` default bucket incl. clear misassignments (§4); no per-record provenance column; codebook membership valid (40/40) but assignment truth unverifiable | PA decision: commission re-classification from an authoritative named mapping, or disposition acceptable residual risk; cannot be remediated by tooling without inventing evidence |
| **B4** | Uniform ₹0.05 tick needs act binding + deviation notice (price-linked framework) | §5; R-7/D-9; tool reports uniform mode as `DERIVED` only when act binds it | Deposition act (P3) — or per-price-tier tick extract |
| **B5** | Custody/as-of dates unverifiable for NSE/BSE files | Filenames carry date only for depository (`05-Nov-2026`); no export/as-of attestation ships inside bundle bytes | Operator attestation of as-of/export dates in act host record |

**No other blockers identified.** NSE EQ coverage, ISIN identity, BSE conflicts, FV consistency, taxonomy structure, tick coverage, and all mandatory field coverage are validated above.

## 12. Historical protections verified (unchanged by this work)

`git status` touched list at commit time is limited to: this record, `scripts/acquisition/*`, one new test. Pinned artifacts re-verified by test (live sha256): corpus `7f53540b…6532e771` · W1 manifest `063288b3…329e09aa9` · W2 manifest `21a6b473…16753755` · W2 dynamic `2186087c…ce3b0c2c1` · Wave-3 receipt `a7cff9c6…6753a135` · acquisition attempt log `93c92ec4…0bc8b3bc` · runtime identity asset `6810c28e…48cf37d`. Bundle zip `6332B050…41F4` untouched. No corpus/manifest/receipt/attempt-log/pin edit; no governed-constant change; no batchId; no B-06 action; no reconciliation change; no IRR action.

## 13. Tests executed

- `node scripts/source_readiness.mjs` twice on derived inputs (both `--tick-rules` and `--tick-size-uniform 0.05`) → identical verdict `DEPOSITION_BLOCKED`, 2 blocking reasons, 0 conflicts (§8).
- `npm ci` + `npm run build:tsc` clean; full suite `npm test` (§14).
- New guard: `tests/d05_wave3_source_bundle_validation.test.ts` pins bundle sha256, pins, and the existence + key findings of this record; runs the live corpus/runtime-asset hash checks.
- Repo `isIsinCheckDigitValid` used for ISIN validation (not the inline copy used ad hoc in analysis).

## 14. Result

**D05 EQ replacement universe is NOT ready for deposition.** The supplied evidence validates structurally and deterministically and clears every field except the two genuine external gaps (B1: 94 MCA bridges; B2: 100 BSE matches), one evidential-quality gate (B3: taxonomy truth), and one act-binding requirement (B4). Everything else that can be established without new external artifacts has been established and recorded. Completion of B1–B4 is outside in-sandbox authority; all are operator/PA acts with explicit dependencies listed in §11.

*This record is evidence. It deposits nothing, authenticates nothing, and authorizes nothing beyond its stated scope.*
