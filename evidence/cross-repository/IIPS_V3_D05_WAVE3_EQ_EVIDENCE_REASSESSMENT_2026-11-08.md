# D05 Wave-3 EQ — One-Time Governed Evidence Reassessment & Decision Table (2026-11-08)

- **Status:** Record only. **No deposition occurs. No corpus is re-rendered. No pins are re-pinned. No act is signed. PR #139 remains OPEN and is NOT merged.**
- **Verdict:** **DEPOSITION_BLOCKED stands.** Unchanged from the 2026-11-08 reconciliation, re-stated here after correction of every in-scope defect that could be corrected without external re-acquisition: MCA linkage fails for 85 / 2,390, BSE listing match fails for 100 / 2,390, and no tick-size evidence is act-bound. Tool verdict (fail-closed rerun): `DEPOSITION_BLOCKED`, `conflicts=0`.
- **Supersedes (in framing only):** `IIPS_V3_D05_WAVE3_EQ_EVIDENCE_RECONCILIATION_2026-11-08.md`. That record remains the unedited chronicle of what was submitted and what was found. Nothing in it is retracted or “fixed” retroactively; findings are re-classified below under the PA’s A–E acceptance taxonomy. Append-only; it is not edited.
- **Authority:** PA directive of 2026-11-08 — “Apply proportional evidence standards; only genuine, material factual or governance blockers may prevent progress”; one-time proportional assessment authorised; generated ≠ fabricated; A–D are not offences; act-enumerated attributions may be PA-accepted; PA conclusions are prepared here, **signed nowhere**.
- **Scope kept:** 2,390 NSE EQ securities only; BE (207) / BZ (33) out; no production or DB actions; no corpus re-render; historical Wave-1/2 evidence and pins (`7f53540b…` corpus EQV `d05_security_master_broad_universe.json`, runtime `6810c28e…`, whitepaper bundle `6332B050…`) untouched; `recordCount !== 2250` guard intact; no IRR consumption; Option B (P0–P9) unexecuted.
- **Branch / PR:** `arena/59e54963-iips-production-market-data`, PR #139 (OPEN, unmerged).

---

## 1. A–E acceptance taxonomy (PA directive, abridged)

- **A — Direct source evidence.** e.g. bundle NSE listing master extract; BSE active-equity export exact joins.
- **B — Systematically derived.** e.g. EQ-series filtering, ISIN exact joins, faceValue carried, reject-to-default taxonomy templating fully labelled.
- **C — Governed identity or statutory attribution.** e.g. act-enumerated statutory series (GOI), named exemption/alias references, governed NSE-exclusive classification. **Not registry evidence; not to be misrepresented as such; act enumeration required.**
- **D — PA-accepted residual limitation.** e.g. systematic (non-published) industry classification retained with named basis; carried registry evidence as-of its own extraction date.
- **E — Fabricated or factually contradictory.** Invented CINs/scrips/prices; provenance claims the inputs cannot support. **E is always rejected; unsupported ≠ generated.**

Generated artefacts are not inherently invalid: each artifact was re-derived from named inputs, rules and dispositions (see `derived/DERIVATION.md` and `manifest.json`, both committed alongside this record).

## 2. Inputs and provenance (all read-only; nothing re-acquired)

| Input | SHA-256 |
|---|---|
| `evidence/D05-Wave3/arena_D05_evidence.zip` (submitted, kept byte-identical) | `c86230451ec35f6fd5aa91d20a31db9de7f38e109ea3afedb9ceffaecc1014ee` |
| Bundle `…_2026-11-07.zip` | `6332b050132a160e89e5906d131e12535ac1105d4b781330fa63f0e0af1d41f4` |
| Bundle NSE EQ extract (EQ-series filter application documented in DERIVATION §2) | `da7eb83c…` |
| Bundle BSE active-equity export (exact-join substrate) | `66362fc3…` |
| Bundle prior MCA bridge (2,296 genuine CINs; Jain entity share-class pair L29120MH1986PLC042028; 94 blanks with faceValue) | (inside bundle; 2,296 restored) |
| Bundle taxonomy prepared candidate (sha256 `976c5bb3…`; 1,532/2,390 default-template rows) | (inside bundle) |
| 2026-11-08 submitted files (inputs to dispositions only) | MCA `9eed0a51…` · BSE `4535dda0…` · Taxonomy `3edfb98e…` · Tick `22610d9a…` |

No downloads were performed; no mirrors are treated as truth; all checks are reproducible from committed bytes.

## 3. Blocker register — exact records, exact defects, exact classes

### B1 — MCA identity linkage (2,390 records)

| Item class | Count | Class | Finding / handling |
|---|---|---|---|
| Restored prior registry bridge (Jain pair shares entity CIN — legitimate, same legal entity) | 2,296 | A (carried) / B | Filed submission had silently wholesale-rewritten all CINs (2,349/2,356 MH-state values; 100% `L`; 0 unchanged vs prior genuine). **Rescinded; restored.** |
| Statutory/GOI series CINs (ACT-ENUMERABLE: FACT, INDIANB, IOB, LICI, NATIONALUM, PNB, PSB, SBIN, UCOBANK; L…GOI000163 etc.) | 9 | **C** | Statute-enumerated attributions. Not in-bundle registry artifacts; not verifiable from the bundle; not invented either — the director’s labels say “governed statutory attribution — act-enumerated”, never “MCA registry match”. Require act enumeration (D-4a). |
| EXEMPT/ALIAS attribution tokens (ANDREWYU, BANCOINDIA, BERGEPAINT, BLACKROSE, BOMDYEING, CHAMBLFERT, CHEVIOT, DBCORP, DEEPAKFERT, GILLANDERS, GRAUWEIL, GROBTEA, HGINFRA, IWP, KAMATHOTEL, KERNEX, KRITI, NRBBEARING, PATINTLOG, S&SPOWER, SHREDIGCEM, SPIC, SUNFLAG, TAINWALCHM, TERAI, UMIYA-MRO, WSI) | 27 | **C** | Instruments not supplied; tokens retained as governed attribution references, never as CINs. Require act enumeration (D-4b). |
| “Verified via MCA Registry Master Match” claims with **no** prior or in-bundle evidence, filed in the submission | 58 | **E (fabricated claim — claim rescinded, values blanked)** | AAREYDRUGS, ABCIND, ADVANIHOTR, AMNPLST, ASIANTNE, BALMLAWRIE, BANKBARODA, BHAGCHEM, BIOFILCHEM, CANBK, CGVAK, CORALFINAC, DIAMINESQ, DSSL, FOODSIN, GNFC, HATHWAY, HUDCO, IMFA, IMPAL, INDIANCARD, INDIANHUME, INDPRUD, INDTONER, INVENTURE, J&KBANK, JAYSREETEA, JYOTIRES, KAKATCEM, KARURVYSYA, KCP, KHAICHEM, KOVAI, LAKSHMIMIL, LFIC, LT, M&M, M&MFIN, MAHABANK, MOTOGENFIN, ONGC, ORIENTPPR, PIGL, POCL, PUNJABCHEM, RATNAMANI, SANDUMA, SAPPL, SDBL, SUKHJITS, TAJGVK, TANAA, TATAPOWER, THACKER, TRIVENI, TUTIALKA, WATERBASE, WHBRADY. **cin left intentionally empty.** Minimum fix: re-supply sized registry extract OR act attribution (D-4c). |

Format-valid CINs in the derived bridge: **2,305** (2,296 carried + 9 statute). The tool refuses the 27 tokens (CIN shape) and excludes the 58 blanks — expected, disclosed as tool-blindness for C-classes, not as absence of relief once an act enumerates them.

**Class of blocker:** the 58 are the only B1 rows that are **genuine blockers**; 36 (9+27) are **governance decisions (C)**; 2,296 are **accepted with carried residual limitation (D)** pending act-time verification policy. No fictitious CIN is required per security by this assessment.

### B2 — BSE listing match (2,390 records)

| Item class | Count | Class | Finding / handling |
|---|---|---|---|
| Exact ISIN → Security Code join vs BSE active-equity export (6-digit; unique; zero duplicate scrip assignments; name-concordance 2,245 exact-normalised / 30 root-prefix / 15 phrasing variants; 0 semantic mismatches) | 2,290 | **A / B** | Submitted scrips were mostly a synthetic ramp (`500000 + rowIdx`, n≈2,295). All rescinded; derived file carries the real join codes only (derived-file sentinels: AWL INE699H01024→543458, BANCOINDIA INE213C01025→500039, BANKINDIA INE084A01016→532149). |
| GOVERNED NSE-exclusives — ISINs absent from the BSE active-equity export as of 2026-11-07 | 100 | **C (pending act)** | AAKASH, AARON, ACEINTEG, AGROPHOS, AHLADA, AIROLAM, AJOONI, AKASH, AKG, ANNAPURNA, ANTGRAPHIC, APOLSINHOT, ARHAM, ARTNIRMAN, ARVEE, ASPINWALL, BALAXI, BANKA, BEARDSELL, BETA, BOHRAIND, BSE, CDSL, CONSOFINVT, CRESTO, CROWN, DANGEE, EIFFL, ELGIRUBCO, FOCUS, GANGAFORGE, GEEKAYWIRE, GKWLIMITED, GLOBAL, GLOBE, GROBTEA, GVPTECH, HECPROJECT, ICEMAKE, IRISDOREME, JAIPURKURT, JMA, JOCIL, KAPSTON, KNAGRI, KOTHARIPET, KRISHANA, KRISHNADEF, KRITIKA, LAGNAM, LATTEYS, LAXMICOT, LEMERITE, LEXUS, LFIC, LIBAS, MACPOWER, MAHESHWARI, MARINE, MASKINVEST, MBAPL, MCL, MITCON, MITTAL, MMP, MOKSH, NBIFIN, NDGL, NITIRAJ, OSWALSEEDS, PANSARI, PARIN, PRECOT, PRITI, RAJMET, RKEC, SAGARDEEP, SAKAR, SERVOTECH, SHANTI, SHRADHA, SILGO, SINTERCOM, SONAMLTD, SPCENET, STEELCITY, SUMIT, TARACHAND, THEJO, TOUCHWOOD, TSFINV, UNIINFO, UNITEDTEA, VAISHALI, VARDHACRLC, VERTOZ, VITAL, VIVIANA, WIPL, ZOTA. `bseScripCode` intentionally EMPTY. Reconciliation vs the 2026-11-08 claim state: of 94 claimed exclusives, 89 are present in the active-equity export with real scrips (claim contradicted; reclassified dual-listed), 5 remain absent; separately, 95 securities claimed as dual-listees have no active-equity-export row → total exact-join absences = 100. **No numerics invented.** Activation requires D-3 (act binds the exclusion rule + its as-of date). |

**Class of blocker:** without D-3, 100 rows are unresolved for the deposit; the 2,290 joins are **accepted with PA-governed derivation (B)**, not re-acquired.

### B3 — Taxonomy classification (2,390 records)

- Base = bundle-prepared candidate `976c5bb3…` (1,532/2,390 default-template rows; disclosed, not laundered). The submitted taxonomy’s provenance failed (identical structural signature; undisclosed template re-tokening) and is **not** carried.
- **68 rows re-examined by the correction/confirmation rules (37 actually re-valued vs the candidate base; 31 intentional re-affirmations)** (codebook-leaf-valid, July-2023 `en-IN` NSE Indices Industry Classification):
  - **Bank classification re-derived (41 derived-output rows)** — Public (13, includes IDBI): BANKBARODA, BANKINDIA, CANBK, CENTRALBK, IDBI, INDIANB, IOB, MAHABANK, PNB, PSB, SBIN, UCOBANK, UNIONBANK; Private (28): J&KBANK, AUBANK, AXISBANK, BANDHANBNK, CAPITALSFB, CSBBANK, CUB, DCBBANK, DHANBANK, EQUITASBNK, ESAFSFB, FEDERALBNK, FINOPB (payments bank), HDFCBANK, ICICIBANK, IDFCFIRSTB, INDUSINDBK, JSFB, KARURVYSYA, KOTAKBANK, KTKBANK, RBLBANK, SOUTHBANK, SURYODAY, TMB, UJJIVANSFB, UTKARSHBNK, YESBANK.
  - **Not banks, corrected elsewhere (3):** BANKA → Industrial Products (default; act-time verification); FEDFINA → NBFC; INDBANK → Financial Institution.
  - **Insurance (4):** HDFCLIFE, SBILIFE → Life Insurance; ICICIGI, STARHEALTH → General Insurance.
  - **AMCs (6):** CRAMC, GAJA, HDFCAMC, ICICIAMC, NAM-INDIA, UTIAMC → Asset Management Company.
  - **Consumer/other majors (14):** DMART → Speciality Retail; TITAN → Gems, Jewellery And Watches; ASIANPAINT → Paints; MARUTI → Passenger Cars & Utility Vehicles; HEROMOTOCO, BAJAJ-AUTO → 2/3 Wheelers; HINDUNILVR → Personal Care; NESTLEIND, BRITANNIA → Packaged Foods; TATACONSUM → Diversified FMCG; COFORGE → Computers - Software & Consulting (was “Passenger Cars & Utility Vehicles” in the candidate!); RECLTD, SBICARD → NBFC; BAJAJFINSV → Holding Company.
- Every row now carries `classificationBasis = “PA-governed systematic classification (one-time Wave-3 replacement act); not an independently published NSE basic-industry attribution”` and `correctionApplied yes/no` (68 yes / 2,322 no). **1,513 / 2,390 rows (63.3%) remain in the default systematic bucket — this residual uncertainty is expressly PA-accept-worthy, recorded, not hidden.**
- Category: systematic derivation (B) + **PA-accepted residual limitation (D)** + 68 narrowly scoped corrections (see decision table, bucket 4). No wholesale rejection; no invention of “verified” NSE attributions; no claim the NSE publishes this derivation.

### B4 — Tick size (2,390 records)

- Submitted `referenceClosingPriceINR` values (rupee amounts up to ₹19,701.16, tiers assigned by row index from the submitted ramp) are **fabricated inputs**: a near-uniform ramp cannot be a per-security closing price distribution — true CM equity closings are discontinuous and idiosyncratic — and the tier test was implemented over the wrong universe. **All 2,390 reference prices blanked.**
- The Circulars (NSE/CMTR/67133 eff. 2025-04-15; NSE/CMTR/62174) are acknowledged but **cannot be applied price-linked here** — the price input does not exist honestly. The assessment instead prepares the PA-authorised one-time alternative: **uniform 0.05 with mandatory deviation notice** (D-9). Tick-size is **NEVER defaulted by this artifact evaluation**; the tool treats it as absent.
- Category: inputs E (fabricated) → **isolated**; route = **C — PA act binding**, `determinationMonth = NOT DETERMINED — pending PA act`, status `PENDING PA ACT BINDING`. **No recurring monthly acquisition is demanded for this one-time replacement.**

### B5 — Custody / as-of / act (all records)

- No act exists. No custody initiation was obtained, none is asserted. The submitted files’ `as-of` assertions are meaningless as provenance (derived from nothing independently checkable). The Wave-3 deposition act must bind: source precedence; the NSE-exclusive rule with its as-of date; the statutory/exemption/alias attributions (D-4); the tick binding (D-9, deviation notice); the taxonomy policy acceptance with its residual-uncertainty statement; and the carried-as-of policy for the 2026-11-07 bridge evidence. Option B P0–P9 remains **unexecuted and gated**.

## 4. Revised B1–B5 decision table (the five PA outcomes)

| # | Artifact · scope | PA bucket | Basis / condition |
|---|---|---|---|
| 1 | — (no artifact is wholesale-acceptable as submitted) | **(1) accepted as submitted** | None of the four files. Only the zip container’s role as a frozen submitted-record object is preserved byte-wise. |
| 2a | B2 — 2,290 exact-join scrips | **(2) accepted with PA-governed derivation** | Derivation = exact ISIN join to bundle BSE active-equity export; PA act binds source precedence + report as-of. |
| 2b | B3 — taxonomy with classificationBasis column (all rows); 68-row correction/confirmation pass (37 re-valued) | **(2)** | PA-governed systematic classification, one-time; not NSE-published. |
| 2c | B1 — 2,296 registry-carried CINs (Jain pair L29120MH1986PLC042028 shared, as same legal entity) | **(2)/(3)** | Derived from the bundle’s bridge artifact (not re-verified this pass); accepts with the standing limitation **D** (as-of-date carried evidence). |
| 2d | B4 — uniform 0.05 with deviation notice | **(2)** | Only once the PA binds D-9 in the act; pending that, bucket (5) for the tick field. |
| 3a | B1 — faceValue/paidUpValue/securityDescription/cfiCode carried for all 2,390 | **(3) accepted with explicit residual limitation** | As-of extraction date; act must state source precedence; never re-verified here. |
| 3b | B1 — 9 statutory/GOI CINs as attribute of act enumeration | **(3) → by D-4a action (2)** | Unverifiable in-bundle; statute-enumerable; PA acceptance converts them into lawful attribution rows, never “registry matches”. |
| 3c | B1 — 27 exemption/alias tokens | **(3) → by D-4b action (2)** | Same conversion path. |
| 3d | B3 — 1,513 / 2,390 rows in the default systematic bucket (63.3%) | **(3)** | Named residual systematic uncertainty; PA policy acceptance; optional future tightening outside this pass. |
| 3e | B3 — dynamic SMIDs whose “uncertain bucket” cannot be honestly closed from in-bundle data | **(3)** | Recorded transparently; no wholesale verifier pass was demanded or performed. |
| 3f | B2 — 100 NSE-exclusives | **(3) → by D-3 action (2)** | Absence fact documented; exclusivity classification is a PA rule decision, not a fact this derivation can mint. |
| 4a | B1 — restored genuine CINs overwriting the submission’s wholesale rewrite | **(4) narrowly scoped factual correction** | 2,290 cells restored; list in DERIVATION §4.1. |
| 4b | B2 — ramp scrips rescinded; 89 contradicted/94 claimed-exclusive rows and 5 absent reclassified; UNLISTED-BSE rescinded | **(4)** | Exact joins only; no manufactured verifications. |
| 4c | B3 — codebook-valid leaf re-valuations (37 actual; list §3 B3; 31 intentional re-affirmations) | **(4)** | Visible, reviewable, reversible. |
| 4d | B4 — fabricated referenceClosingPriceINR blanked for 2,390 rows | **(4)** | Isolation of genuinely unavailable input, per B4 instruction. |
| 5a | **58 MCA rows without any evidence** (ONGC, LT, M&M, M&MFIN, BANKBARODA, CANBK, …) | **(5) genuine blocker — not resolvable by governance alone** | Minimum resolution: (i) re-supply (once, act-passported) a sized MCA extract covering these 58; or (ii) act-enumerated named-basis attributions; or (iii) exclude these 58 securities from this replacement universe. No PA decision may make a CIN appear. |
| 5b | B5 — custody / as-of / act signature | **(5) governance blocker** | Not obtainable by this assessment; D-3/D-4/D-9 and act drafting are owner-bound PA actions. |
| 5c | B4 — price-linked CM tick determination (per NSE/CMTR/67133 eff. 2025-04-15) | **(5) genuinely unavailable input** | Deliberately not attempted; PA may bind the uniform alternative instead (D-9). |

**Per-item “accepted with explicit residual limitation” (the PA-signed set, if executed):** rows 2c/2d*, 3a–3f, each subject to the limitation text in DERIVATION.md §6 and its named decision. *2d converts to (2) upon D-9 signature. **No item is to be described as “verified” without the act language carrying the limitation.**

## 5. Prepared PA decisions (NOT executed; effective only via signed act)

**D-3 — NSE-exclusive rule (file: arena_bse_identity_bridged.derived.csv).**
Binding text skeleton: *“The 100 securities listed in DERIVATION.md §4.2 lacking a scrip in the BSE active-equity export as of 2026-11-07 are admitted to this replacement as governed NSE-exclusives, on the basis that (i) the export identifies active BSE equity listings as of that date; (ii) their absence from it is the positive ground of exclusion; (iii) the act binds that as-of date. No rupee/scrip identifier is created. If any admitted ISIN is later evidenced as listed on BSE, the act’s exclusion ground fails for that ISIN and the file is to be re-executed for that ISIN alone.”*
Consequences: tool remains BLOCKED (it does not model exclusivity); deposit act must enumerate the 100 ISINs; nothing else changes.

**D-4 — Identity attributions (file: arena_mca_identity_bridged.derived.csv).**
- (a) *Statutory/GOI (9):* *“L…GOI… series CINs for FACT, INDIANB, IOB, LICI, NATIONALUM, PNB, PSB, SBIN, UCOBANK are admitted as governed statutory attributions under the named statutes (LIC Act 1956; SBI Act 1955; Banking Companies (Acquisition and Transfer of Undertakings) Acts 1970/1980; plus FACT/NATIONALUM GOI-undertaking status). These are not represented as in-bundle registry cross-walk outputs.”*
- (b) *Exemption/alias (27):* *“ANDREWYU, BANCOINDIA, BERGEPAINT, BLACKROSE, BOMDYEING, CHAMBLFERT, CHEVIOT, DBCORP, DEEPAKFERT, GILLANDERS, GRAUWEIL, GROBTEA, HGINFRA, IWP, KAMATHOTEL, KERNEX, KRITI, NRBBEARING, PATINTLOG, S&SPOWER, SHREDIGCEM, SPIC, SUNFLAG, TAINWALCHM, TERAI, UMIYA-MRO, WSI are admitted as governed attribution references (exempt / alias instruments); identifiers are not MCA CINs by construction; substrate instruments to be exhibited to the PA-favoured registry inspection within the act’s evidence annex, or the rows revert to 58-style blocker status.”*
- (c) *58 unevidenced:* *“The 58 securities listed in DERIVATION.md §4.1 (58 for B1) shall be (i) admitted upon receipt of sized registry evidence in a one-time re-supply; or (ii) act-attributed with named issuer-specific juridical basis; or (iii) excluded from the replacement with an act-recorded enumeration and a coverage notice. They remain blockers otherwise.”*
Consequences of skipping (c): deposition cannot lawfully purport to carry these 58 issuers. **PA directive does not make a CIN appear; it permits an honest exclusion or an honest attribution.**

**D-9 — Uniform 0.05 tick binding (file: arena_tick_size_evidence.derived.csv).**
Skeleton: *“For this one-time Wave-3 EQ replacement only, the minimum tick size is bound at ₹0.05 per share for every admitted security, replacing the price-linked determination under NSE/CMTR/67133 (eff. 15-Apr-2025) for the deposit’s purpose, with deviation notice: prices are unavailable from in-bundle inputs; a uniform tick is a simplification with regulatory consequences to be analysed at re-render; the determination date is the act date; determinationMonth is NOT DETERMINED otherwise; this binding does not alter exchange CM tick rules.”* PA must sign. Tool chain still requires `--tick-size-uniform 0.05` at deposit time; this artifact is not that deposit.

**Taxonomy policy acceptance (file: arena_taxonomy_submission.derived.csv).**
Skeleton: *“The one-time PA-governed systematic classification basis is accepted for this replacement; the 68 named corrections are confirmed; the 1,513-row residual default bucket and the classificationBasis column are recorded in the deposit act; no claim is made that NSE publishes this derivation; SMID uncertain names are accepted with residual uncertainty, to be tightened in any future governed refresh.”*

**B5 — Custody / act drafting (none of the files).**
Preparer: PA/designated counsel. Items to bind: source precedence; carried-as-of policy; NSE-exclusive rule + as-of; D-4 enumeration annexes; D-9 deviation notice; taxonomy policy acceptance; §2250/2250-adjacent universe immutability; Wave-1/2 carve-outs. **No execution is possible from this assessment.**

## 6. Readiness re-run (fail-closed tool, corrected inputs)

Command: `source_readiness.mjs --nse /tmp/d05-derived/nse_eq.csv --bse evidence/D05-Wave3/derived/arena_bse_identity_bridged.derived.csv --mca evidence/D05-Wave3/derived/arena_mca_identity_bridged.derived.csv --taxonomy evidence/D05-Wave3/derived/arena_taxonomy_submission.derived.csv --output-dir audits/source-readiness-2026-11-08-corrected` → **`DEPOSITION_BLOCKED`, exit 4, conflicts=0**, reasons exactly:
- 85 of 2,390 NSE securities have no MCA linkage (cin/faceValue cannot be provisioned);
- 100 of 2,390 NSE securities have no BSE listing match;
- tickSize — no tick-size evidence supplied.

Sub-confirmations: MCA valid rows 2,305 / 2,390; BSE valid rows 2,290 / 2,390; taxonomy OK; isinsPresentInAll = 2,207; rank: faceValue SOURCE_PROVIDED (0 divergences, advisory); tick absent.

**Tool-blindness disclosure:** the tool cannot express “PA-accepted NSE-exclusive” or “act-enumerated attribution”; a signed act does NOT flip this tool to READY by itself; any future READY requires purpose-built governed exclusions profiles or the act(s) themselves. A genuine tool defect was corrected en route: the BSE `scrip_code` synonym `bssescripcode` (typo, 4×s) → `bsescripcode`; the fix is fail-closed (placeholders remain rejected; 6-digit regex unchanged), disclosed in docs §6 addendum, covered by conformance test.

## 7. What this pass changed in the repository (all additive; submitted zip and prior records untouched)

- NEW `scripts/derive_d05_wave3_artifacts.py` (deterministic generator; reproduces every derived sha256).
- NEW `evidence/D05-Wave3/derived/{arena_mca_identity_bridged.derived.csv, arena_bse_identity_bridged.derived.csv, arena_taxonomy_submission.derived.csv, arena_tick_size_evidence.derived.csv, manifest.json, DERIVATION.md}`.
- PATCH `src/audit/source_readiness.ts` — one-character-class synonym fix (`bssescripcode` → `bsescripcode`); fail-closed preserved.
- NEW `tests/d05_wave3_evidence_reassessment.test.ts` (10 checks: pins, invariants, Jain share-class CIN, sentinel exclusions, PENDING tick binding). Suite after this pass: **1,178 executed / 1,177 passed / 0 failed / 1 pre-existing skip**.
- NEW this record; docs §6 addendum updated; `audits/source-readiness-2026-11-08-corrected/` (gitignored) holds the tool output.

## 8. Verdict and prohibitions

**DEPOSITION_BLOCKED stands.** Not blocked by blanket rejection of generated evidence — every in-scope correction legitimately available without external re-acquisition was applied (58→cin blank; 100 NSE-exclusives documented; ramp scrips and prices rescinded; 68 corrections; carried evidence restored; labels disclosed). It remains blocked by: (i) 58 rows with no identity evidence at all; (ii) 100 exclusives awaiting act binding of the exclusion rule; (iii) tick-size awaiting act binding; (iv) the act itself and Wave-3 P0–P9 unexecuted; (v) custody never initiated. Any claim of deposition-readiness, “completion”, or merged-corpus availability is false until the PA signs D-3/D-4/D-9 with the act and the governed P0–P9 sequence completes — after which this table is re-derived, not edited.

**Not authorised here, expressly:** merging PR #139; altering production scope; re-pinning corpus/runtime/bundle pins; modifying Wave-1/2 evidence; DEO/DB actions; IRR consumption; representing derived artifacts as published NSE attributions; representing attribution tokens as MCA CINs; silencing this limitation set.

*Prepared 2026-11-08 under PA directive of the same date. Sign nothing until D-3/D-4/D-9 + taxonomy policy + B5 are acted on.*
