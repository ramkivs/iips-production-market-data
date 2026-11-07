# IIPS V3 D05 — WAVE-3 EQ — PUBLISHED EVIDENCE RECONCILIATION & CONVERGENCE REPORT (2026-11-08)

**Date:** 2026-11-08 · **Branch:** `arena/59e54963-iips-production-market-data` · **PR:** #139 (OPEN — no merge authority exercised) · **Audience:** Program Authority (PA), IPD
**Supersedes (in evidence status, not in history):** the four artifact files supplied under the consolidated publication `evidence/D05-Wave3/arena_D05_evidence.zip`

**Continuation authority:** PA instruction 2026-11-08 — "D05 WAVE-3 — EQ Universe Source Acquisition, Validation & Governed Replacement — Continuation, Evidence Reconciliation and Completion".

> **Verdict in one line.** The newly published four-file evidence bundle is **structurally complete and cross-file consistent, but its source content is fabricated: it is rejected in full as deposition evidence. D05 remains `DEPOSITION_BLOCKED` and NOT ready. No deposit, act, re-pin, corpus revision or B-06 action is performed or authorized.**

---

## 0. Publication integrity (verified)

| Check | Result |
|---|---|
| Publication commit `e962e8788d3cd2b6792c3a3258c2b0e7e71fdad3` on `origin/main` (parent `c2b04f6`) | ✓ fetched; locally merged into the working branch (merge commit `9c7e03e…`) |
| `evidence/D05-Wave3/arena_D05_evidence.zip` SHA-256 | `c86230451ec35f6fd5aa91d20a31db9de7f38e109ea3afedb9ceffaecc1014ee` — **matches the published record exactly** ✓ |
| Archive integrity | `unzip -t` clean; 4 files, no extras |
| Per-file SHA-256 | `arena_mca_identity_bridged.csv` `9eed0a51…8f5e2d1446ea6b84b48bd8649` · `arena_bse_identity_bridged.csv` `4535dda0…f758569d9c7593f1e159f85` · `arena_taxonomy_submission.csv` `3edfb98e…e5c707496d39961042aef9f5137836` · `arena_tick_size_evidence.csv` `22610d9a…25ccc6e07c1` |
| Record counts | 2,390 data rows in each of the four CSVs; header + 2,390 rows everywhere |
| ISIN coverage | Every file covers exactly the 2,390 NSE CM `EQ` securities (ISIN set = NSE `EQUITY_L` ∩ series EQ); no missing, no extras, ISIN/symbol/name triples unique per file; **all four files carry identical row order** — identical to the EQ-filtered NSE master order (`sym[0]=20MICRONS … sym[-1]=ZYDUSWELL`) |
| BE/BZ exclusion | 2,390 EQ only; no BE/BZ rows anywhere ✓ |

The original bundle `D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip` remains in the repo unmodified (sha256 `6332B050…41F4` pinned by test), as does the MCA custody gap documented there (`company_master_data_2026-11-07.zip` absent) — the new consolidated zip does not contain it either.

**Forensic observation (material):** the four artifacts are not four independent source cross-walks; they are one base table (NSE EQ order, identical `(isin, symbol, companyName)` triples in the same order) with per-source columns appended. This single observation already disqualifies the set as four-source evidentiary supply.

---

## 1. Layered verdicts (per the five required lenses)

| Lens | Verdict | Evidence anchor |
|---|---|---|
| 1. Structural completeness | **PASS** | 2,390 rows × 4 files; unique ISINs; consistent schemas; zero missing values; no duplicate identities (scrip numerics unique) |
| 2. Identity correctness | **FAIL** | B2: 89/94 "NSE-exclusive" claims contradict the bundle's BSE master (89 of the exclusions are ISIN-present with scrip codes listed, e.g. AUROPHARMA, PNB, FEDERALBNK, JKCEMENT, NLCINDIA); 95 claimed-dual ISINs are exactly the cohort absent from the BSE master/moved to exclusivity; 5 claimed-exclusive also absent (AKASH, CRESTO, JMA, MAHESHWARI, NBIFIN). B1: 2,347 CINs rewritten vs the prior bridge (0 unchanged), Jain Irrigation plain/DVR split into two unrelated legal-entity CINs |
| 3. Regulatory correctness | **FAIL / UNVERIFIED** | B4: reference prices impossible for the universe's anchors (MRF ₹742.52 vs reality ≈ ₹1.0–1.3 lakh; PAGEIND ₹150.45 vs ≈ ₹40k; SHREECEM ₹479.19 vs ≈ ₹25k; TCS ₹225.57 vs ≈ ₹3k+; HDFCBANK ₹128.55 vs ≈ ₹1k); determination month April 2026 with no exchange file/checksum and no binding to a governed as-of date; B3: 34 of 95 hierarchy labels are not nodes of the supplied July-2023 NSE Indices codebook (valid only 62/95: Macro 11/12, Sector 17/21, Industry 15/30, Basic 19/32) |
| 4. Source authenticity | **FAIL (all four artifacts)** | B1: 2,349/2,356 CINs registered in "MH" state code, 100% registrant class "L", all 2,296 prior genuine CINs replaced (e.g., RELIANCE real `L17110MH1973PLC019786` → fabricated `L98282MH2007PLC417555`; INFY real `L85110KA1981PLC013115` → fabricated `L95749MH2005PLC484203` with state KA→MH); B2: scrip codes form an effectively monotonic ramp (2,278/2,295 increasing steps; min 500001, max 543583) with only 12 exact matches vs the BSE master — all 12 mega-caps (BANKINDIA 532149, BHARTIARTL, CENTRALBK, HDFCBANK, ICICIBANK, INFY, ITC, LICI, LT, RELIANCE, SBIN, TCS); 2,189/2,296 claimed scrips differ from the master for ISIN-present securities; 95 claimed-dual ISINs absent from the master altogether; B4: no source file or checksum for reference prices; B3: no per-record provenance column in the submitted artifact (prior generations did carry provenance) |
| 5. Governed acceptance | **INELIGIBLE** | Every element required to bind these numbers into a governed act (registry authenticity, exchange authenticity, named taxonomy source, as-of attestation, act binding for uniform route — N/A since price-linked now directed but prices fabricated) is missing or falsified. Acceptance would be manufacturing a pass |

---

## 2. Requirement-by-requirement findings

### B1 — MCA Identity Reconciliation — **FAIL (source authenticity); NOT deposition-admissible**

Claimed profile (verified structurally): 2,347 "Verified via MCA Registry Master Match" + 27 "Governed Corporate Registry Exemption / Legacy Structure" (`EXEMPT-STRUCT-*` tokens) + 7 "Verified via Corporate Registry Alias Match" (`ALIAS-MATCH-*` tokens) + 9 statutory attributions (2 GOI undertakings [FACT `L24129KL1943GOI000163`, NATIONALUM `L27209OR1981GOI000920`], 4× Banking Companies Acquisition Act 1970 [INDIANB `L65190TN1907GOI001143`, IOB `L65100TN1937GOI001296`, PNB `L65192DL1894GOI000511`, UCOBANK `L65190WB1943GOI015099`], 1× Banking Companies Acquisition Act 1980 [PSB `L66019DL1908GOI002727`], 1× LIC Act 1956 [LICI `L66010MH1956GOI010483`], 1× SBI Act 1955 [SBIN `L65190MH1955GOI010182`]).

Findings:
1. **34 exemption/alias references are explicitly distinguished from actual CINs** (token form, non-CIN pattern) ✓ — this requirement is satisfied structurally. Their provenance strings are categorical ("Statutory / Legacy Structural Exemption Attribution under Audit Governance Framework" / "Official Corporate Registry Alias Cross-Walk Reconciliation") with **no per-record instrument, order number, date, issuing authority or attachment** ⇒ **not "adequate individual provenance"**. None of the 34 has a named statutory/registry basis beyond the generic label; e.g. `EXEMPT-STRUCT-AGROPHOS` does not state how Agro Phos (agrochemicals) is a "legacy structure" outside the registry.
2. **The 9 GOI attributions are plausible CINs and name their statutes in `mcaIdentityStatus`**, including format-valid GOI registrations that consistent with commonly published identifiers for SBIN, PNB, UCO Bank, Indian Bank, IOB, PSB, LIC, FACT and NALCO. These 9 are **conditionally acceptable as registry-exempt attributions only by act, pending PA attestation** — no registry artifact, as-of date, or extract checksum supports them in-bundle. They must not be upgraded to "registry verified" silently.
3. **The 2,347 "master matches" are fabricated.** All 2,296 CINs present in the previous (genuine, ISIN-bridged) submission were replaced without explanation; 0 unchanged. Statistical signature: 100% registrant class `L`; **2,349 of 2,356 CINs carry state code `MH`** (Maharashtra) — real registry distribution spreads across MH/TN/DL/GJ/KA/RJ/UP/WB/KL/etc.; incorporation years arbitrary; several substitutions are impossible (state KA→MH for INFY; INFY `L85110KA1981PLC013115`→`L95749MH2005PLC484203`). Jain Irrigation's plain/DVR pair (one legal company, two EQ ISINs) — previously one shared CIN, evidence-consistent — is now split into two unrelated purported legal entities (`L97077MH1988PLC262943`, `L89066MH2003PLC945412`) with no corporate-action evidence.
4. Previously-blank 94 are now classified: 51 "master matches" (fabricated — §3), 27 EXEMPT + 7 ALIAS + 9 GOI. The raw MCA registry ZIP ("current as-of act date, licensed") is **still absent** from the publication. No re-bridging is possible in-sandbox, and no new registry request may be manufactured from public sources.
5. **Provenance column exists (unlike the prior taxonomy) but every value is a generic category label** — none cites document ids, checksums, as-of timestamps or sign-offs.

**B1 disposition:** identity triple consistency PASS; structural coverage PASS (2,390/2,390); token-type separation PASS; **individual provenance FAIL (34 rows); source authenticity FAIL (2,347 rows); conditional-acceptance only for the 9 GOI rows (act required). Not deposition-admissible.**

### B2 — BSE Identity Reconciliation — **FAIL (source authenticity); placeholders rejected**

Claimed profile (verified): 2,296 "Dual-Listed / Active BSE Listing" with 6-digit numerics (2,296 unique, 0 duplicates) + 94 "NSE-Exclusive Scrip (Governed Exclusion)" with scrip `UNLISTED-BSE` + status "Governed Exchange Exclusivity Attribution (NSE-Exclusive)" and provenance "Official BSE Scrip Master Registry Cross-Walk & Exchange Exclusivity Schedule".

Findings:
1. **The 2,296 numeric scrip codes are a synthetic sequential ramp**, not exchange data: strictly increasing across 2,278 of 2,295 adjacent pairs; in 32 rows exactly `500000 + file_row_index`; min 500001 → max 543583.
2. **Only 12 scrip codes match the bundle's BSE master**: BANKINDIA `532149`, BHARTIARTL, CENTRALBK, HDFCBANK, ICICIBANK, INFY, ITC, LICI, LT, RELIANCE, SBIN, TCS — all mega-caps — the canonical fingerprint of human-seeded guesses rather than a registry join.
3. **2,189 of 2,296 (95.3%) claimed scrips differ from the master for ISIN-present securities** (e.g., ABB claim `500021` vs master `500002`; 20MICRONS claim `500001` vs master `533022`); **95 claimed-dual ISINs are exactly the cohort absent from the BSE master** (set identical to the 100-security missing cohort minus the 5 moved to "exclusive").
4. **89 of the 94 claimed NSE-exclusives are ISIN-present in the BSE master with real scrip codes** (AUROPHARMA, PNB `532461`-class listings, FEDERALBNK, JKCEMENT, JSFB, NLCINDIA, POONAWALLA, JAMNAAUTO, DMART, HCL-INSYS, AUROPHARMA, …). Only 5 claimed exclusions (AKASH `INE737W01013`, CRESTO `INE203Y01012`, JMA `INE412C01023`, MAHESHWARI `INE263W01010`, NBIFIN `INE365I01020`) are absent from the master.
5. The 94 "NSE-Exclusive" rows carry a **generic placeholder `UNLISTED-BSE` as `bseScripCode`** — explicitly prohibited by the governing direction ("do not introduce generic placeholder scrip codes or blanket active-listing assertions"). Exclusive classification is itself unproven: no irreversible exclusivity schedule, statute, or BSE notice is cited; the bundled BSE master contradicts 89 of them.
6. **AWL/BANKINDIA collision correction is preserved structurally**: `AWL` INE699H01024→`543583`, `BANCOINDIA` INE213C01025→`500261`, `BANKINDIA` INE084A01016→`532149`; zero duplicate numerics. (This is the only verifiable correctness island in the file.)
7. ISIN→scrip identity does not correspond to any supplied source. The BSE exclusivity schedule and any authority to mark 94 seasoned dual-listed securities "NSE-exclusive" is absent.

**B2 disposition:** structural uniqueness PASS; identity correspondence FAIL (2,284/2,296 dual claims and 89/94 exclusivity claims contradicted by the bundle master); placeholder policy FAIL; prior AWL/BANKINDIA correction preserved. **Not deposition-admissible. The claimed "2,296 dual-listed + 94 governed NSE-exclusive" disposition has no evidentiary basis and contradicts the supplied BSE master.**

### B3 — NSE Taxonomy — **FAIL (company-wise accuracy, provenance, codebook conformance)**

Verified against the supplied July-2023 NSE Indices Industry Classification codebook (extracted via operand-stripped text parse of `NSE_Indices_Industry_Classification_2023-07.pdf`; the earlier 2026-11-07 "40/40 needles" extraction was defective — superseded by the method below; corrected counts are stated here):

| Level | Names used | Codebook-valid | Non-codebook labels (examples) |
|---|---|---|---|
| macroEconomicSector | 12 | 11 | `Automobile & Auto Components` (codebook: `AutomobileandAutoComponents`) |
| sector | 21 | 17 | `Agricultural Food & Products` (`…&otherProducts`), `Containers & Packaging` (absent), `Diversified Consumer Goods` (absent), `Textiles, Apparel & Luxury Goods` (`Textiles&Apparels`) |
| industry | 30 | 15 | `Auto Ancillaries`, `Alcoholic Beverages`, `Construction - Infrastructure`, `Financial - Insurance`, `Logistics & Transportation`, … |
| basicIndustry | 32 | 19 | `Diversified Industrial Products & Technology`, `Airline Software & Technology Services`, `Gas Storage & Terminals`, `Logistics Services`, `Paper & Packaging Products`, `Processed Foods`, `Infrastructure Development`, `Life / Health Insurance`, … |

A structural/codebook FAIL on **34 of 95 distinct labels**. Further:
- **The 8 previously-flagged securities were genuinely re-examined, not assumed** (3MINDIA→`Diversified Industrial Products & Technology`; ABBOTINDIA→Pharmaceuticals; AAVAS→Housing Finance Company; ABSLAMC→Asset Management Company; AEGISLOG→Logistics Services; AEGISVOPAK→Gas Storage & Terminals; ACCELYA→Airline Software & Technology Services — all individually plausible and appear to be honest hand-fixes; ACCURACY→Logistics Services plausible). The release notes' named cohort appears corrected.
- **The systemic failure persists at scale:** 1,339/2,390 (**56.0%**) of rows still collapse to `Capital Goods → Industrial Manufacturing → Industrial Products` — including life/health insurers and AMCs (HDFCLIFE, SBILIFE, ICICIGI, HDFCAMC, BAJAJFINSV), retail REITs/NBFCs (RECLTD), FMCG majors (HINDUNILVR, BRITANNIA, TITAN, ASIANPAINT, DMART, HEROMOTOCO), and IT names (COFORGE). The four mega-bank buckets classify **all 36 banks (incl. HDFCBANK, ICICIBANK, all private-sector banks) as `Public Sector Bank`** — there is no private-sector leaf used anywhere. Financial-sector cores (insurers, AMCs, finance companies misassigned to Industrials) are systemic.
- **Same four flagged large-caps** remain classified outside reality: RELIANCE→`Refineries & Marketing` (now defensible), LICI→`Life / Health Insurance` (plausible). The submission is **not consistently wrong everywhere** — the hand-fixed subset is fine; the template remainder is not.
- **Zero provenance column** remains in the submitted taxonomy; assignment method, source instrument and sign-off are unstated. Previously "669/2,390 rows changed vs prior submission; 1,721 unchanged"; `Industrial Products` count moved 1,532→1,339 — cosmetic-scale corrections applied to an unverifiable template, not a reclassification.
- Hierarchy *shape* (no child→multiple parents) holds; coverage is complete; ISIN set matches the EQ universe.

**B3 disposition:** coverage PASS; hierarchy consistency PASS; codebook conformance FAIL (62/95 labels valid); **company-wise accuracy FAIL at scale; provenance ABSENT. NOT deposition-admissible. The named eight are partially remediated; the universe is not.**

### B4 — Tick-Size Evidence — **FAIL (fabricated reference prices; unattested determination)**

Mandated validation targets (NSE/CMTR/67133 & NSE/CMTR/62174; determination April 2026):

| Check | Result |
|---|---|
| Schema & coverage | 2,390/2,390 rows; `isin, symbol, companyName, referenceClosingPriceINR, minimumTickSizeINR, priceTierApplicability, regulatoryFramework, determinationMonth, tickSizeComplianceStatus, provenance`; unique ISINs ✓ |
| Internal tier consistency | **0/2,390 tier/price mismatches** — band boundaries (`Below ₹250` / `₹250–₹1,000` / `> ₹1,000–₹5,000` / `> ₹5,000–₹10,000` / `> ₹10,000–₹20,000`) contain all prices; tick values ∈ {0.01, 0.05, 0.10, 0.50, 1.00} (all in the tool's accepted union incl. 5.00, unused since no security ≥ ₹20,000); framework text cites both circulars; determination month = April 2026 ✓ **(as a computation, it is internally coherent)** |
| **Reference closing prices** | **Impossible for anchors:** MRF ₹742.52 (real ≈ ₹1.0–1.3 lakh for years), PAGEIND ₹150.45 (≈ ₹40k), SHREECEM ₹479.19 (≈ ₹25k), TCS ₹225.57 (≈ ₹3k+), HDFCBANK ₹128.55 (≈ ₹1k), ABB ₹354.61 (≈ ₹5–8k). The top of the price distribution is dominated by `IVP`, `RAMCOSYS`, `ACE`, `CORALFINAC`, `HAPPYFORGE` at ≈ ₹19k — while the universe's true mega-priced names are absent from the high tiers. **No security ≥ ₹20,000 although MRF/Honeywell Automation/3M India demonstrably exceed ₹100,000 in reality.** The price series is not an exchange closing-price series |
| Determination/as-of alignment | Determination month April 2026; **no exchange file name, URL, export timestamp, SHA-256, or as-of date for the price input**; act (P0/P3) not executed; current date 2026-11-08 — the determination is seven months stale relative to any realistic act date and cannot be bound to the governed D05 as-of without the missing artifact |
| Authenticity of `tickSizeComplianceStatus` / provenance | Categorical assertions ("Price-Linked Tier Verified & Bound"; "Monthly Exchange Closing Price Tier Determination & Statutory Tick Size Schedule") — no cited document id, checksum, or signing authority |

**B4 disposition:** internal arithmetic PASS; the price-linked regime direction itself is sound and conforms to the revised CM regime (effective 2025-04-15); **source authenticity FAIL (prices fabricated); determinacy FAIL (no as-of attestation, no reconciliation to NSE CM reference-price file). NOT deposition-admissible. Do not "recalculate in place" — the bound input artifact is absent.**

### B5 — Acquisition execution, custody, as-of attestation & deposition governance — **OPEN / BLOCKED (PA + operator)**

(Labeling convention carried from the 2026-11-07 validation record §11: B5 = custody/as-of attestation + governance prerequisites.)

1. No operator acquisition act has been executed; nothing has landed in `evidence/operator_drop/` for this pass; **the four CSVs are the only inputs** and they fail validation (§1–§4).
2. No as-of date is bound by any act (D-1 open); no custody log; no signing authorities (D-13 open).
3. The execution-stage guard `broker_observation_resolver.ts` hard `recordCount === 2250` remains untouched — **correctly**, per the established execution-stage requirement. It is the single most important fail-closed protection before P6; it must not be weakened prematurely.
4. `DEPOSITION_BLOCKED` stands in both previously run routes; with the hardened validator re-run on the submitted artifacts (this pass): verdict `DEPOSITION_BLOCKED`, conflicts=0, blocking reasons exactly **(34 MCA linkage, 94 BSE listing match)** — see §4. (A tool cannot see authenticity; it correctly fails closed on the placeholders/tokens.)
5. P3 (deposition act), the `D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION` re-pin, hydration verification, rollback drill (P8) and B-06 reassessment (P9) remain **not started**; Option B and the Wave-1 pin (`7f53540b…`), W1/W2 manifests, receipts and attempt logs remain byte-identical (re-pinned by tests; §5).

---

## 3. Cross-artifact reconciliation (single EQ-universe triple)

| Check | Result |
|---|---|
| ISIN set parity across the 4 submitted CSVs | **Equal** — the 2,390-security EQ set; unique per file |
| `(isin, symbol, companyName)` triple parity | **Identical across all four files** |
| Row order parity | **Identical across all four files and identical to EQ-filtered NSE `EQUITY_L(1).csv` order** — one template lineage |
| ISIN vs NSE EQ extract | All 2,390 match on SYMBOL↔ISIN (shape+Luhn); name matches normalized-exact vs NSE (as before, 100%) |
| MCA↔BSE column parity | `cin`, `isin`, `symbol`, `companyName`, `mcaIdentityStatus`, `provenance` identical column-wise in `mca`/`bse` bridge files (bse extends with 4 BSE columns) |
| Placeholder/tokens inventory | `UNLISTED-BSE` ×94 (bseScripCode) — placeholder class; `EXEMPT-STRUCT-*` ×27 + `ALIAS-MATCH-*` ×7 (cin) — token class; both correctly fail closed under the hardened validator (never identity claims) |
| Duplicate / collision identities | Numeric scrips unique ✓; CINs unique across rows ✓ (the Jain split is an authenticity defect, not a duplicate); ISINs unique ✓ |
| Completeness of blocking population | 94 BSE-unmatched + 34 MCA-unmatched (union 128; overlap in "both" would double-count — union = 94+34 = **128 distinct ISINs failing closed** under the hardened contract) |
| Reconciliation to prior bundle | 95 previously-missing ISINs were all labeled "dual-listed" with ramp scrips; 5 moved into "exclusive"; 89 "exclusives" are ISIN-present in the BSE master; previous MCA genuine CINs 2,296/2,296 rewritten; prior taxonomy 1,721 labels unchanged (Industrial Products 1,339); tick regime declaration (uniform 0.05) superseded by price-linked determination (this task's direction) but executed with fabricated parameters |
| Overlap with the historical 2,198 generated-marker population | Any overlap is **irrelevant to admission** (Option B: no lineage carry-over); none of these artifacts constitute admissible evidence for any record |

---

## 4. Actual execution results under the corrected contract (this pass)

Hardened validator (`src/audit/source_readiness.ts`, fail-closed addendum): **`scrip_code` must match `^[0-9]{6}$`; placeholders are not identity claims** (MCA side already enforced `^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$`). Re-run on inputs derived from the submitted evidence (EQ-filtered NSE; MCA = 2,356 format-valid CIN rows joined with the carried face-value cross-walk (advisory); BSE = as submitted incl. the 94 tokens; taxonomy = as submitted; tick = `--tick-rules` over as-submitted prices):

| Metric | Result |
|---|---|
| Verdict | **`DEPOSITION_BLOCKED`** (exit 4) |
| blockingReasons | `34 of 2390 NSE securities have no MCA linkage (cin/faceValue cannot be provisioned)`<br>`94 of 2390 NSE securities have no BSE listing match (bseSymbol/bseScripCode cannot be provisioned)` |
| Conflicts | **0** |
| isinsPresentInAll / unionIsins | 2,263 / 2,390 |
| tickSize | `SOURCE_PROVIDED` by formula (2,390/2,390 covered by rules file; values in accepted band set) — **NOT admissible: prices fabricated** |
| faceValue (advisory NSE↔MCA) | 2,356 compared / 0 divergences |
| Taxonomy/BSE/MCA headerStatus | OK (structural); validator cannot (and does not) certify truth |

`audits/source-readiness-2026-11-08-submitted/` holds the artifacts (gitignored; summarized above).

Tooling honesty note: the tool validates structure and internal consistency; it is intentionally blind to registry/exchange authenticity. The forensic findings in §1–§3 are therefore **additional and independent**; neither layer rescues the bundle.

---

## 5. Convergence status matrix (mandated fields)

| Field | Workstream / requirement ID | Current status | Previous status | Actual verification finding (this pass) | Outstanding requirement | Dependency / prerequisite | Accountable owner | Execution owner | Required decision / authorization | Blocking? | Required completion evidence | Repository / branch / commit / artifact | Recommended next action | Completion criteria |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Published evidence ingestion | A-0 bundle | VERIFIED-RECEIVED | n/a | zip sha256 == published (`c86230…14ee`); prior bundle pins re-verified (17/18 then; MCA zip still absent); Wave-1/2 pins re-verified by test | none | — | IPD/PA | IPD | none (received) | No | this record §0 | `evidence/D05-Wave3/arena_D05_evidence.zip` @ main `e962e87` | retain as archived submission, not as admissible evidence | recorded+pinned |
| MCA identity (B1) | B1 | **BLOCKED — evidence rejected** | 2026-11-07: 94 blank-CIN unresolved, 2,296 genuine bridge CINs admissible | 2,296 prior genuine CINs ALL rewritten; 0/2,296 unchanged; 99.8% "MH"-registered; 34 tokens well-formed but provenance generic; 9 GOI rows plausible, unattested | genuine registry re-supply (licensed MCA master, current as-of act date) OR act enumerates per-row exemptions with statutory basis + individual provenance; plain/DVR pair split must be reconciled | new authentic MCA artifact; PA act | PA | operator/IPD | PA act binding dispositions (exemptions/attributions) + re-supply | **Yes** | pinned authentic MCA extract sha256; per-record instrument/order ids for the 34; act-bound exemption list | `arena_D05_evidence.zip!arena_mca_identity_bridged.csv` (rejected); `IIPS_V3_D05_WAVE3_EQ_EVIDENCE_RECONCILIATION_2026-11-08.md` | obtain authentic MCA registry extract; re-bridge (ISIN/available columns) | DEPOSITION_READY gate pass attributable to registry, not templates |
| BSE identity (B2) | B2 | **BLOCKED — evidence rejected** | 2026-11-07: 100 missing vs BSE master; 0 scrip conflicts; 201 shared Jain pair | ramp scrips (2,278/2,295 increasing; 32 exact `500000+idx`); only 12 mega-cap matches; 89/94 exclusivity claims contradicted; 95 "dual" ISINs absent from master (== prior missing set minus 5); `UNLISTED-BSE` placeholders | authentic BSE scrip/ISIN master (current as-of) OR act-enumerate exclusions with authority; exclusivity notices per security | new authentic BSE artifact; PA act | PA | operator | PA act | **Yes** | pinned authentic BSE extract sha256; exclusivity schedule w/ authority per record | rejected CSV (sha `4535dda0…`) | obtain current BSE export; re-run | tool pass attributable to exchange master |
| NSE taxonomy (B3) | B3 | **BLOCKED — evidence rejected** | 2026-11-07: 64.1% default bucket; no provenance | 56.0% still in `Industrial Products`; all 36 banks classified `Public Sector Bank` (no private leaf), insurers/AMCs→Industrials; 62/95 labels valid in July-2023 codebook; correct hand-fixes visible for the named 8 (3MINDIA, ABBOTINDIA, AAVAS, ABSLAMC, AEGISLOG, AEGISVOPAK, ACCELYA, ACCURACY); **zero provenance** | authoritative reclassification (named taxonomy + per-record mapping with evidence) or PA-accepted deviation with residual-risk statement | authentic artifact / PA act | PA | operator+PA | PA decision | **Yes** | sha256 of re-derived taxonomy with per-record basis | rejected CSV (sha `3edfb98e…`) | PA elects re-classification mandate or deviation | taxonomy deposit whose rows are individually defensible |
| Tick-size (B4) | B4 | **BLOCKED — evidence rejected** | 2026-11-07: uniform 0.05 (route needs act bind) | internal tier arithmetic consistent; **prices impossible** (MRF ₹742.52; PAGEIND ₹150.45; SHREECEM ₹479.19; TCS ₹225.57; HDFCBANK ₹128.55); no exchange file/checksum; determination April 2026 ≠ act as-of; `tickSizeComplianceStatus` categorical | authentic as-of NSE CM tick-price determination (closure list + prices + checksum) OR act binds a uniform route with deviation notice | authentic artifact; PA act | PA | operator | PA act (D-9) | **Yes** | pinned extract (sha256, as-of date); act binding | rejected CSV (sha `22610d9a…`) | obtain authentic tick extract or bind act-uniform | tier-bound evidence as of act date |
| Acquisition / custody / as-of (B5) | B5 | **NOT STARTED (external)** | 2026-11-07: bundle missing MCA master; unattested | unchanged; new zip adds no MCA master, no custody log, no as-of attestation | operator acquisition event + custody log + as-of dates + PA sign-off (D-1, D-13) | P0/P1 authorization | PA | operator | PA act | **Yes** | custody receipt; as-of attestation; pinned bytes in `evidence/operator_drop/wave4-*/` | — | PA authorizes acquisition charter; operator executes | pinned, attested sources |
| Cross-artifact coherence | X-1 | PASS-structural / FAIL-authenticity | PASS | §3 above — single template lineage evidenced | independent sourcing per workstream | authentic artifacts | IPD | IPD | — | No (but fatal) | forensic log (§3) | this record | re-supply from four independent sources | four artifacts from disjoint genuine files |
| Validator hardening (BSE placeholder) | V-1 | **IMPLEMENTED** | n/a | `source_readiness.ts`: `SCRIP_CODE_BSE_REGEX=^[0-9]{6}$`; tokens now fail closed (validRows drop → coverage gap → blocking); behavior tests added | — | — | IPD | IPD | — | No | diff + tests | `src/audit/source_readiness.ts` | done | merged |
| Readiness gates | P2 | BLOCKED | BLOCKED | `DEPOSITION_BLOCKED` (hardened): 34 MCA + 94 BSE; conflicts 0; union 2,263/2,390 | B1, B2, B3, B4, B5 closure + DEPOSITION_READY | all above | PA | IPD | PA sign-off of READY report | Yes | committed READY report (md/csv/json) countersigned | `audits/source-readiness-2026-11-08-submitted/` | re-run after authentic re-supply | READY verdict countersigned |
| Wave-3 Option B / deposition (P3–P9) | G-* | **NOT STARTED** | n/a | — | P3 act; new revision; re-pin; P7 verification; P8 rollback; P9 B-06 | P2 READY | PA | IPD+operator | PA act (P3, D-7, D-8, D-9, D-13) | Yes | signed act; P5–P9 evidence chain | — | after P2 | P6/P7 merge with all pins moved (§8 list) |
| broker_observation_resolver guard | G-R | **PRESERVED (untouched)** | preserved | `recordCount === 2250` hard guard intact in `src/identity/broker_observation_resolver.ts` (verified in working tree) | re-pin only at P6/P7 with full §8 re-pin PR | P6 | PA/IPD | IPD | P6 act | Yes (at stage) | P6/P7 merge; suite green | repo | leave untouched; re-pin at execution | P6 commit |
| Historical pins | H-1 | **PRESERVED** | preserved | corpus `7f53540b…`, runtime asset `6810c28e…`, W1/W2 manifests, Wave-3 receipt, attempt log — byte-identical (conformance tests) | — | — | IPD | IPD | none | No | test output (this pass: 1168 executed / 1167 pass) | tests | none | tests green |
| D-4 stable identity binding | D-4 | NOT STARTED | n/a | pre-req for P3 | rule (i) reuse `EQ_<TOKEN>_IN` vs legacy where ISIN/symbol match | P3 | PA | IPD | PA decision D-4 | Yes | D-4 binding in act | — | decide at P0 sign-off | act records rule(i) |
| Documentation | DOC | UPDATED | partial | this record + in-repo validator docs note | convergence report delivered | — | IPD | IPD | — | No | PR #139 head | PR #139 | PA review | PA disposition of PR #139 |

**Completed / conditionally accepted / blocked / not started — explicit split:**
- **Completed (verified):** publication integrity; EQ derivation; per-file/cross-file structural analysis; hardened validator + behavior tests; full suite green; convergence report; Option B semantics preserved; Waves 1–2 + bundle pins preserved; AWL/BANKINDIA correction preserved (structurally); Named-8 (B3) partially remediated by submitter.
- **Conditionally accepted:** the 9 GOI statutory attributions — pending PA attestation; the 2,296 prior genuine MCA CINs **remain the best-available CIN evidence** but are not present in this submission (superseded status must be act-noted); face-value reconciliation 2,390/2,390 internal consistency (advisory layer only).
- **Blocked (evidence):** B1 (registry), B2 (exchange dual listing + exclusivity), B3 (taxonomy truth), B4 (reference prices), B5 (custody/as-of), P2 gate → therefore P3–P9 **NOT STARTED**.
- **Not started / out of scope:** deposition, act execution, B-06, production, IRR, reconciliation v1/v2, corpus/manifest/receipt changes.

---

## 6. Governance & deposition prerequisites restated (not waived)

1. PA act (P0/P3) binding: effective date & as-of (D-1), series whitelist (D-2, EQ-only), BSE linkage policy with exclusions enumerated in writing (D-3), companyId rule (D-4(i)), EQ_AIIL_IN disposition (D-5), D-6 AIIL overlay retirement, D-7 constant naming, D-8 batchId/act refs, D-9 tick route, D-10 B-06 sequencing (P9 only), D-11–D-15.
2. Authentic acquisitions pinned with custody: NSE (current), BSE (current, ISIN↔scrip), MCA (current, licensed), taxonomy (authoritative, named), tick (as-of circular + reference prices file) — all with sha256, as-of dates, and attestation chain.
3. `DEPOSITION_READY` on the merged bundle → P3 acts → P5 replacement artifacts (new revision constant, new runtime asset — never in-place edit) → P6 re-pin PR (full §8 blast-radius list incl. resolver guard, browser copy, 23 test-pin references) → P7 verification → P8 rollback drill → P9 B-06.
4. No admission, no reuse, no silent carry-over of any of the 2,198 generated-marker records; 52-record revalidation rule stands.
5. Historical instruments untouched: reconciliation v1/v2, Wave-1/2 pins, IRR, production.

---

## 7. Tests executed this pass

- `npm ci` clean; `npm run build:tsc` clean (after reinstall).
- `npm test`: **1,168 executed — 1,167 pass — 0 fail — 1 pre-existing skip** (includes 2 new validator fail-closed behavior tests and the new `tests/d05_wave3_evidence_reconciliation.test.ts` conformance suite pinning the publication hash, the verdict and the preserved pins).
- `node scripts/source_readiness.mjs` on submitted-evidence-derived inputs: verdict `DEPOSITION_BLOCKED`, conflicts 0 (§4).
- Forensic/analytic verification reproduced in §1–§3 (scrip-ramp, CIN statistics, tier consistency, codebook extraction, set overlaps vs BSE master and vs the historical 100-missing cohort).
- Pin integrity: corpus `7f53540b…74b5`, runtime asset `6810c28e…`, bundle `6332B050…41F4` (all enforced in `tests/d05_wave3_source_bundle_validation.test.ts`); new tests pin this pass's publication (`arena_D05_evidence.zip` hash `c86230…14ee`) and this record's existence/invariants.

## 8. Artifacts & references

- Record: this file; prior validation record `evidence/cross-repository/IIPS_V3_D05_WAVE3_EQ_SOURCE_VALIDATION_2026-11-07.md` (history, unchanged).
- Submitted (rejected) evidence: `evidence/D05-Wave3/arena_D05_evidence.zip` (main `e962e87`, sha `c86230…14ee`).
- Merged main into initiative branch: `9c7e03e…` (fast-track of publication into the work line).
- Code change: `src/audit/source_readiness.ts` (placeholder-scrip enforcement), `tests/source_readiness.test.ts` (2 new fail-closed tests), `tests/d05_wave3_evidence_reconciliation.test.ts` (new conformance), plus convergence doc.
- PR #139 (OPEN, MERGEABLE prior to this push; files: record + acquisition tooling + tests). No merge executed.
- `audits/source-readiness-2026-11-08-submitted/` (gitignored).

## 9. Precise reasons deposition is impossible today (contractual)

1. B1: no admissible MCA linkage for 34 securities (tokens) + registry authenticity rejected for the rest; CIN fields not provisionable from admissible evidence.
2. B2: no admissible BSE link: 94 placeholders (not identity claims) + demonstrated fabrication of the remaining codes.
3. B3: no per-record defensible industry/sector evidence (templates + non-codebook labels + zero provenance).
4. B4: no admissible tick binding (fabricated reference prices; unattested determination month).
5. B5: no acquisition act, custody log, as-of attestation, signing authorities; D-1/D-3/D-9/D-13 open.
6. Governance gates unchanged: Option B stands; resolver guard at 2250; Option B requires full re-pin PR at P6; B-06 frozen to P9; production out of scope.
7. The submitted bundle therefore **fails closed** — which is the designed outcome, not an inconvenience.

**Nothing deposited. Nothing authenticated. Nothing re-pinned. Nothing in production.**

*This record is evidence. It authorizes no execution.*
