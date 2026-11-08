# IIPS V3 D05 Wave-3 — Derived EQ Replacement Artifacts (2026-11-08)

**Derivation, recovery and one-time replacement — NOT a re-acquisition.**
Prepared under the Project Authority (PA) directive of 2026-11-08 (“Challenge to Blanket Evidence Rejection / One-Time Governed Replacement”). This ledger is reproduced mechanically by `scripts/derive_d05_wave3_artifacts.py`; every output checksum below is recomputed by the script and recorded in `manifest.json`.

## 1. What this derivation is, and is not

These derived artifacts **restore, correct and isolate** evidence positions from the 2026-11-07 governed bundle and the (rejected) 2026-11-08 submitted files. They do **not** create new source truth:

- No registry re-verification was performed. Registry-derived values are **carried** from the 2026-11-07 bundle bridge, labelled as carried evidence.
- Values with no in-bundle basis are **left empty**, never invented.
- PA attribution classes (statutory / exemption / alias) are carried as **governed attribution references**, explicitly **not** as MCA CINs, and require PA act enumeration to become effective.
- `minimumTickSizeINR` is carried as a **proposal** for PA-act binding (uniform 0.05, deviation notice required); no determination is claimed and the artifact is explicitly marked `PENDING PA ACT BINDING`.
- The deposition verdict **remains `DEPOSITION_BLOCKED`** after this derivation (see §7).

## 2. Inputs (read-only)

| Input | SHA-256 |
|---|---|
| `evidence/D05-Wave3/D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip` | `6332b050132a160e89e5906d131e12535ac1105d4b781330fa63f0e0af1d41f4` |
| `…/01_source_material/NSE/EQUITY_L(1).csv` (EQ series filter = 2,390 rows) | `da7eb83cf21156cca3a8bcc5b94ea55f825ff7348e02c89abc51658788361fa5` |
| `…/01_source_material/BSE/BSE_ACTIVE_EQUITY_CLEANED.csv` | `66362fc392c820656ebfb0ab960da8d920a643e980bd3895c93418ae6c9a9947` |
| `…/02_latest_prepared_candidates/arena_mca_identity_bridged.csv` (prior bridge; 2,296 genuine CINs; 94 blank) | (inside bundle) |
| `/tmp/d05-new/arena_*.csv` — the 2026-11-08 submitted files | submitted MCA sha256 `9eed0a51…`, BSE `4535dda0…`, Taxonomy `3edfb98e…`, Tick `22610d9a…` (see reconciliation record) |

The **2026-11-08 submitted files are inputs to dispositions only** (which of the 94 previously-blank rows were re-tokened by the filer). No submitted value was carried forward into the derived artifacts except: (a) the 9 statute-series CINs and (b) the 27 EXEMPT/ALIAS attribution tokens — both **rescinded as registry evidence** and re-presented as what they are: **governed attributions requiring PA act enumeration**.

## 3. Universe

2,390 NSE CM cash-market **EQ** securities. Series BE (207) and BZ (33) are out of scope and were never read in.

## 4. Outputs (all 2,390 rows)

| Output | SHA-256 | Rows |
|---|---|---|
| `arena_mca_identity_bridged.derived.csv` | 9e081614a6f2b0ef131cc611d0cb6db0ee4e09de8aaa558c81f56270fdf8531a | 2390 |
| `arena_bse_identity_bridged.derived.csv` | 39a4fb59aaeb6bd4339d9ef376f31be0efdce2a1ec90b973f2ddde1536a9e46f | 2390 |
| `arena_taxonomy_submission.derived.csv` | f8d4beefa21db201cdecb08cd84c253ca6db2d139b880dc3875e2440dd47020e | 2390 |
| `arena_tick_size_evidence.derived.csv` | f5116021fa485e5184be8f1837904206496c385fa5ae40250d28199cbfec1d84 | 2390 |
| `manifest.json` | (generated per run; see file) | — |

### 4.1 B1 — MCA identity bridge (corrected)

Dispositions of the 94 previously-blank securities:

| Class | Count | Symbols |
|---|---|---|
| Rescinded as fabricated (“Verified via MCA Registry Master Match” in the submitted file; no prior evidence) | **58** | AAREYDRUGS, ABCIND, ADVANIHOTR, AMNPLST, ASIANTNE, BALMLAWRIE, BANKBARODA, BHAGCHEM, BIOFILCHEM, CANBK, CGVAK, CORALFINAC, DIAMINESQ, DSSL, FOODSIN, GNFC, HATHWAY, HUDCO, IMFA, IMPAL, INDIANCARD, INDIANHUME, INDPRUD, INDTONER, INVENTURE, J&KBANK, JAYSREETEA, JYOTIRES, KAKATCEM, KARURVYSYA, KCP, KHAICHEM, KOVAI, LAKSHMIMIL, LFIC, LT, M&M, M&MFIN, MAHABANK, MOTOGENFIN, ONGC, ORIENTPPR, PIGL, POCL, PUNJABCHEM, RATNAMANI, SANDUMA, SAPPL, SDBL, SUKHJITS, TAJGVK, TANAA, TATAPOWER, THACKER, TRIVENI, TUTIALKA, WATERBASE, WHBRADY |
| Governed statutory/GOI attribution (act-enumerated; **not** in-bundle registry matches) | **9** | FACT (L24129KL1943GOI000163), INDIANB (L65190TN1907GOI001143), IOB (L65100TN1937GOI001296), LICI (L66010MH1956GOI010483), NATIONALUM (L27209OR1981GOI000920), PNB (L65192DL1894GOI000511), PSB (L66019DL1908GOI002727), SBIN (L65190MH1955GOI010182), UCOBANK (L65190WB1943GOI015099) |
| Governed exemption/alias attribution (tokens retained, labelled “NOT an MCA CIN”) | **27** | ANDREWYU, BANCOINDIA, BERGEPAINT, BLACKROSE, BOMDYEING, CHAMBLFERT, CHEVIOT, DBCORP, DEEPAKFERT, GILLANDERS, GRAUWEIL, GROBTEA, HGINFRA, IWP, KAMATHOTEL, KERNEX, KRITI, NRBBEARING, PATINTLOG, S&SPOWER, SHREDIGCEM, SPIC, SUNFLAG, TAINWALCHM, TERAI, UMIYA-MRO, WSI (21 EXEMPT + BERGEPAINT, BOMDYEING, CHAMBLFERT, DEEPAKFERT, NRBBEARING, SPIC) |
| Previously-genuine rows re-labelled by the filer — genuine CIN restored (incl. Jain plain/DVR share class pair L29120MH1986PLC042028; 6 EXEMPT-token + 1 ALIAS-token re-labels; remaining 2,290 unchanged) | **2,296** | |
| **Format-valid CINs in derived file** | **2,305** (2,296 + 9 statute series) | |

`faceValue`, `paidUpValue`, `securityDescription`, `cfiCode`, `issuerNameInDepository` are **carried** from the prior bundle bridge for all 2,390 rows (the bundle carries faceValue even for the 94 previously-unmatched rows; nothing is invented).

### 4.2 B2 — BSE identity bridge (corrected)

Rule: exact `ISIN → Security Code` join against the bundle BSE active-equity export (2,290 / 2,390 EQ ISINs present; unique codes; **zero duplicate scrip assignments**; company-name concordance: 2,245 exact-normalised, 30 root-prefix, 15 phrasing variants (“The …”, “and”/“&”) — no semantic mismatches).

| Class | Count | Meaning |
|---|---|---|
| Dual-listed, real 6-digit scrip (exact join) | **2,290** | BSE status SOURCE_PROVIDED (subject to act binding source precedence) |
| GOVERNED NSE-exclusive (ISIN **absent** from BSE active-equity export as of 2026-11-07; scrip intentionally EMPTY) | **100** | AAKASH, AARON, ACEINTEG, AGROPHOS, AHLADA, AIROLAM, AJOONI, AKASH, AKG, ANNAPURNA, ANTGRAPHIC, APOLSINHOT, ARHAM, ARTNIRMAN, ARVEE, ASPINWALL, BALAXI, BANKA, BEARDSELL, BETA, BOHRAIND, BSE, CDSL, CONSOFINVT, CRESTO, CROWN, DANGEE, EIFFL, ELGIRUBCO, FOCUS, GANGAFORGE, GEEKAYWIRE, GKWLIMITED, GLOBAL, GLOBE, GROBTEA, GVPTECH, HECPROJECT, ICEMAKE, IRISDOREME, JAIPURKURT, JMA, JOCIL, KAPSTON, KNAGRI, KOTHARIPET, KRISHANA, KRISHNADEF, KRITIKA, LAGNAM, LATTEYS, LAXMICOT, LEMERITE, LEXUS, LFIC, LIBAS, MACPOWER, MAHESHWARI, MARINE, MASKINVEST, MBAPL, MCL, MITCON, MITTAL, MMP, MOKSH, NBIFIN, NDGL, NITIRAJ, OSWALSEEDS, PANSARI, PARIN, PRECOT, PRITI, RAJMET, RKEC, SAGARDEEP, SAKAR, SERVOTECH, SHANTI, SHRADHA, SILGO, SINTERCOM, SONAMLTD, SPCENET, STEELCITY, SUMIT, TARACHAND, THEJO, TOUCHWOOD, TSFINV, UNIINFO, UNITEDTEA, VAISHALI, VARDHACRLC, VERTOZ, VITAL, VIVIANA, WIPL, ZOTA |

**Rescinded:** the submitted file’s ramp-like synthetic scrip series (2,278/2,295 ≈ `500000 + rowIdx`), all `UNLISTED-BSE` placeholder tokens, and the misclassification of 89 evident dual-listees as “NSE-exclusive”. Exclusion is a **governance classification requiring PA-rule acceptance (D-3)** — not authority to delete or fabricate; the absence fact (“ISIN absent from the 2026-11-07 active-equity export”) is a positive, checkable input.

### 4.3 B3 — Taxonomy submission (corrected)

- **Base = the 2026-11-07 bundle-prepared candidate** `02_latest_prepared_candidates/arena_taxonomy_submission.csv` (sha256 `976c5bb31b8ad89ab99fffc6b0cefa250fd317804d5227b39ff5cd39fac60989`; 2,390 rows; 1,532 of 2,390 rows (≈64%) carry the default “Industrial Manufacturing / Industrial Products” template — that templating is disclosed, **not** laundered through this file’s header). The **rejected 2026-11-08 submission’s labels are not carried**; B3 derives independently from the bundle candidate, applies 68 codebook-valid corrections, and discloses the classification basis.
- 2,322 rows carry `correctionApplied=no` — industry labels of the bundle candidate are retained as **transparent systematic classification** — `classificationBasis = “PA-governed systematic classification (one-time Wave-3 replacement act); not an independently published NSE basic-industry attribution”` added to **every** row, plus `correctionApplied` yes/no.
- **68 rows passed the deliberate correction/confirmation pass** (all marked `correctionApplied=yes`); **37 actually change values vs the 2026-11-07 candidate base; 31 are intentional re-affirmations** produced by the split rules (e.g. confirmed-Public banks). Exact value-changed set: ASIANPAINT, BAJAJ-AUTO, BAJAJFINSV, BANKA, BANKINDIA, BRITANNIA, CENTRALBK, COFORGE, CRAMC, DMART, FEDFINA, GAJA, HDFCAMC, HDFCLIFE, HEROMOTOCO, HINDUNILVR, ICICIAMC, ICICIGI, IDBI, INDBANK, J&KBANK, MAHABANK, MARUTI, NAM-INDIA, NESTLEIND, PNB, PSB, RECLTD, SBICARD, SBILIFE, SOUTHBANK, STARHEALTH, TATACONSUM, TITAN, UCOBANK, UNIONBANK, UTIAMC). All edits are codebook-leaf-valid only (July-2023 NSE Indices Industry Classification, `en-IN`): banks split public-sector 13 (incl. IDBI) / private-sector 28 (incl. FINOPB payments bank and J&K Bank, which is privately promoted per RBI classification); scheduled small-finance banks (AUBANK, CAPITALSFB, EQUITASBNK, ESAFSFB, JSFB, SURYODAY, UJJIVANSFB, UTKARSHBNK) already private-sector in the candidate base — confirmed, not re-guessed; FEDFINA (NBFC) and INDBANK (Financial Institution) were corrected out of Banks; **BANKA** (sanitation business) reassigned to the default Industrials bucket pending act-time verification; life insurers (HDFCLIFE, SBILIFE); general insurers (ICICIGI, STARHEALTH); six AMCs (CRAMC, GAJA, HDFCAMC, ICICIAMC, NAM-INDIA, UTIAMC) → Asset Management Company; DMART → Speciality Retail; TITAN → Gems, Jewellery And Watches; ASIANPAINT → Paints; MARUTI → Passenger Cars & Utility Vehicles; HEROMOTOCO, BAJAJ-AUTO → 2/3 Wheelers; HINDUNILVR → Personal Care (Personal Products); NESTLEIND, BRITANNIA → Packaged Foods; TATACONSUM → Diversified FMCG; COFORGE → Computers - Software & Consulting; RECLTD, SBICARD → NBFC; BAJAJFINSV → Holding Company.
- No label outside the supplied codebook was invented; uncertain/diversified names keep the base systematic bucket with `correctionApplied=no` and are disclosed as **PA-accepted residual systematic uncertainty**, not as NSE attributions. The residual default-bucket share after correction is **1,513 / 2,390 rows (63.3%)** and stays disclosed, not hidden by an audit-friendly re-numbering.

### 4.4 B4 — Tick-size evidence (corrected)

- `referenceClosingPriceINR` **EMPTY for all 2,390** rows (2026-11-08 submitted prices were fabricated — implausible magnitudes, circular arithmetic, absent source).
- `minimumTickSizeINR` = uniform `0.05` with `determinationBasis = “PA ACT-BOUND UNIFORM (one-time, pending PA signature)”`; `determinationMonth = “NOT DETERMINED — pending PA act (determination date = act date)”`; status `PENDING PA ACT BINDING`.
- The price-linked determination per NSE/CMTR/67133 (eff. 2025-04-15) and NSE/CMTR/62174 was **NOT attempted** — the in-bundle inputs cannot establish it. The uniform route is the PA-authorised one-time replacement (D-9), recorded with the mandatory **deviation notice** versus the prevailing price-linked regime.
- This tool chain never defaults tickSize; DEPOSITION_READY is impossible without an act binding (`--tick-size-uniform 0.05` flag at deposit time).

## 5. Tool rerun on corrected inputs

`source_readiness.mjs` on the derived inputs yields **DEPOSITION_BLOCKED** (exit 4), conflicts 0, with exactly these material gaps:

- 85 of 2,390 have no MCA linkage (2,305 format-valid CINs: 2,296 carried + 9 statute series; 27 attribution tokens excluded by CIN shape rule; 58 empty);
- 100 of 2,390 have no BSE listing match (scrip intentionally EMPTY);
- tickSize not supplied;
- `isinsPresentInAll` = 2,207; NSE without BSE: 100; NSE without MCA: 85; NSE without taxonomy: 0.

Tool-blindness disclosures: the tool cannot express a PA-accepted NSE-exclusive or act-enumerated attribution; these stay BLOCKED at tool level even after PA act signature; the tool is a necessary structural check, not a substitute for the act. (One genuine defect was fixed in passing — the BSE scrip-code synonym `bssescripcode` → `bsescripcode`, a fail-closed correction after which placeholder tokens remain rejected; see docs §6 addendum.)

## 6. PA decision mapping (prepared, NOT self-executed)

| Decision | Subject | Minimum correction/decision attached to |
|---|---|---|
| **D-3** | Accept the 100 absent-from-BSE ISINs as **governed NSE-exclusives** under a documented PA rule (active-equity-export absence as of 2026-11-07 + act-bound listing-as-of date), with deviation notice | arena_bse_identity_bridged.derived.csv rows with `exchangeClassification=NSE-Exclusive` |
| **D-4** | Act-enumerate the **9 statutory/GOI** attributions as governed resolutions (name statute + act); act-enumerate the **27 exemption/alias** tokens as governed references; decide disposition of the **58 unevidenced** rows (re-supply registry extract, act-enumerated attribution with named basis, or exclusion of those securities from this replacement) | arena_mca_identity_bridged.derived.csv |
| **D-9** | Bind **uniform 0.05** one-time tickSize in the act; record deviation notice vs price-linked framework; set determinationMonth = act date | arena_tick_size_evidence.derived.csv |
| **Taxonomy policy** | Accept the systematic-classification basis with named corrections; keep residual systematic bucket limitation in the act; name the `classificationBasis` column | arena_taxonomy_submission.derived.csv |
| **B5** | Reviewers to supply custody / as-of / act language (act must bind: source precedence incl. dual-listed provenance, NSE-exclusive rule, attribution classes, tick binding, determination date) | deferred — option B plan §9 |

## 7. Statement of verdict

**DEPOSITION_BLOCKED stands.** Nothing is deposited; nothing is re-pinned; the corpus pins (`7f53540b…` corpus, `6810c28e…` runtime), the bundle (`6332B050…`), the historical Wave-1/2 evidence, the reconciliation v1/v2 records, and the `recordCount !== 2250` guard are untouched. Option B P0–P9 remains gated on PA execution of the decisions above. If the PA signs D-3, D-4, D-9 and the taxonomy-policy acceptance in a deposition act, a re-run of the structural checks + governed deposition act + reviewed merge may proceed. Until then this directory is a corrected *candidate* — recoverable, reviewable, and deliberately short of any claim of fitness to deposit.
