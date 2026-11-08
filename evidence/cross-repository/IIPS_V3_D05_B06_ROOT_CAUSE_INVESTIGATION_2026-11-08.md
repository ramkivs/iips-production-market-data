# IIPS v3 / D05 — B-06 ROOT-CAUSE INVESTIGATION — 65 UNRESOLVED BROKER ROWS (2026-11-08)

**Parent**: PA instruction 2026-11-08 — *"B-06 — 65 UNRESOLVED ROWS: ROOT-CAUSE INVESTIGATION… DO NOT close B-06 and do not accept the 65 UNRESOLVED rows as residual exceptions at this stage."*
**Status after this document**: B-06 remains **OPEN**; the 65 rows are **NOT** closed, **NOT** reclassified as residual exceptions, **NOT** persisted.
**Scope**: root-cause analysis + diagnostic matrix + minimum corrective actions only. No evidence generation, no ingress re-execution, no persistence, no control changes.
**Repository of record**: this checkout (`ramkivs/iips-production-market-data`), committed directly on the session branch per standing publication protocol (commit → fast-forward main → remote verification).

---

## 1. Executive summary

**The 65 UNRESOLVED rows were not caused by insufficient evidence, by missing securities, or by a defect in the identity-resolution rules. They were caused by one structural fact about the observed broker surface: it contains no identifier that the governed resolution path can use. The only row-bound key in the DHAN_WEB_UI_SUMMARY_V1 surface is the broker's plain-English display name, and no plain-English display name in these rows equals a verbatim governed key or a governed effective-dated alias in either the NSE or BSE namespace.**

**The information required to resolve those rows already exists, in this repository.** The committed companion broker export (`evidence/operator_drop/wave2-2026-11-06/source.csv`, the B-04 Dhan holdings export, IRR PR #496 merge `0a0aac2bba517be933dae7a91a89af2943996b51`, repo SHA-256 `2dc1d1fba6e183cfa657652d0dab98daac570df6e3ef3adbbc8f2a397fcabd0d`) carries an ISIN for all 68 positions in the observed surface, joined 1:1 by exact normalized display name. **65 of the 68 ISIN-bearing positions resolve through the existing ISIN-first governed identity path against the authenticated universe. Three do not**, because those securities are **outside the authorized NSE CM EQ scope** of `AD-W1-AUTH-2026-01` / the 2026-11-08 replacement act, not because the rules failed.

Concretely:

- **62 of the 65 unresolved rows resolvable with zero new acquisition and zero architecture change**: exact ISIN (present in `wave2-2026-11-06/source.csv`) → authenticated `getGovernedAuthenticatedSecurityMaster()` exact-ISIN lookup → unique `EQ_*` canonical identity, verified experimentally in read-only fashion (§4, F-4). Demonstrated against the shipped authenticated master: 65/68 positions resolve by exact ISIN, the only failures being rows 44, 51, 63.
- **3 of the 65 rows cannot resolve under the authorized universe act**: row 44 `NATIONAL STOCK EXCHANGE OF INDIA` (INE721I01024 — BSE-only ACTIVE group A equity `544937`; NSE of India has no NSE CM EQ listing), row 51 `RADHIKA JEWELTECH` (INE583V01021 — NSE series **BE**, BSE group **T**/SME), row 63 `UNIVASTU` (INE562X01013 — NSE series **BE**, absent from BSE active-equity). All three correctly fail closed `UNMAPPED_IDENTIFIER`. Bringing them in requires a new governance decision (universe scope), not a technical fix.
- **The three currently-RESOLVED rows** (1 AGI GREENPAC, 21 GHCL, 40 KROSS) resolved only because their supplied identifiers (the display name, case-insensitively normalized as-exact-key) coincide with a verbatim governed key or a governed effective-dated alias. They are not evidence that the rest were "almost resolvable"; they are evidence of a namespace-equality accident the fail-closed path correctly exploits.
- **Zero rows** require corporate-action handling, fuzzy matching, name-similarity evidence, or a matching-implementation correction. **Zero** is the correct count for "existing evidence sufficient but matching implementation incomplete" **as a code defect** — the implementation already queries ISIN first whenever an ISIN is supplied; the broker surface simply never supplies one. The remaining work is (a) a PA decision to re-assess the 62 rows through the existing path with their ISIN supplied, and (b) a PA disposition for the three out-of-scope securities.

**B-06 must remain open.** The correct characterisation of the 65 rows is *resolved-by-design fail-closed on an identifier-free source surface, with the missing identifier present in a committed companion artifact* — not "residual exceptions".

## 2. Authority, scope and controls preserved

| Constraint (PA instruction 2026-11-08) | Status after this investigation |
|---|---|
| Do not close B-06 / no residual-exception disposition | Preserved — B-06 OPEN; this document contains no residual-exception language |
| Do not persist any of the 65 rows | Preserved — zero writes to any deposit, master, or persistence store; two read-only probes (master resolution in-memory, corpus join by ISIN) were executed for verification only |
| No weakening of identity controls; no fuzzy/name-similarity | Preserved — no alias added; no rule relaxed; no normalization changed; no test modified |
| The three successful resolutions stay untouched | Preserved — `identity-outcomes-authenticated-2026-11-08.json` (SHA `4712ebb2…`) unmodified; rows 1, 21, 40 records unchanged |
| No repeat of D05 acquisition / evidence generation | Preserved — no source files were fetched, downloaded, or re-generated; all new bytes read are in-repo (`/tmp` scratch only) |
| Eligibility stays `NOT_ASSERTED`; append-only docs | Preserved |
| UNLISTED-BSE never resolvable; missing evidence fails closed | Preserved — this report reaffirms, with the three scope exclusions cited by act |

## 3. Evidence examined (artifact of record)

| # | Artifact | SHA-256 / locator | Role in this investigation |
|---|---|---|---|
| E1 | Authenticated universe record (repo copy) | `b555fd28…` — `evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.json` | Membership + canonical-candidate test for all 68 ISINs |
| E2 | Authenticated replacement data (code of record) | `src/identity/d05_authenticated_universe_data.ts` | Exact-ISIN resolution probes; alias carries |
| E3 | Legacy Wave-1 data + governed practices | `src/identity/d05_broad_universe_data.ts`, `src/identity/governed_fixture_master.ts` | Baseline universe; AGI GREENPAC alias lineage (from Wave-1, carried forward) |
| E4 | Broad master prompt/structure pre-replacement | same as E3 | Comparison baseline for "three successes" |
| E5 | Governed resolution implementation | `frontend/src/features/portfolio/import/broker-identity-assessment.ts` | Lookup order (`ISIN` → `NSE_SYMBOL`/`BSE_SYMBOL` exact); refusal vocabulary |
| E6 | Authenticated reassessment outcomes (immutable) | `4712ebb2…` — `evidence/integration/ws-a-dhan-68-row/identity-outcomes-authenticated-2026-11-08.json` | Run-3 record; 3 RESOLVED / 65 UNRESOLVED; every row's lookups + `refusalCode` |
| E7 | Observed WS-A surface (UI reconstruction) | `bfd0496e…` — `rows.json`; `c44e3cdb…` — reconstructed CSV | Row source of the failures; fields `sourceIsin=null`, `sourceExchange=null` all 68 |
| E8 | Companion Dhan holdings export (B-04) | `2dc1d1fb…` — `evidence/operator_drop/wave2-2026-11-06/source.csv` | **ISIN source for all 68 positions**; quantities ground truth |
| E9 | BSE active-equity export (pinned) | bundle `evidence/D05-Wave3/D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip` → `01_source_material/BSE/BSE_ACTIVE_EQUITY_CLEANED.csv` (5,137 data rows) | BSE-side presence test (63/65 unresolved rows present) |
| E10 | NSE listing master (pinned) | same bundle → `01_source_material/NSE/EQUITY_L(1).csv` (2,630 rows) | NSE-side presence + series test (62 EQ, 2 BE, 1 absent) |
| E11 | MCA bridge (pinned, bridges independent of universe) | same bundle → `02_latest_prepared_candidates/arena_mca_identity_bridged.csv` (2,390 rows) | MCA class per row (verified / unmatched-but-act-bound / absent) |
| E12 | Deposit activation + PA decisions | `evidence/D05-Wave3/deposit-2026-11-08/pa_decisions.json`, `field_sources.csv` | BSE exclusions (100), MCA exemptions (27, INE266D01021 ∈ it), AIIL overlay, MCA-unlinked (58) exclusions |
| E13 | B-06 closure record (prior state) | `dd1587f7…` — `evidence/cross-repository/IIPS_V3_D05_B06_68ROW_REASSESSMENT_2026-11-08.md` | Prior "disposition" language under re-examination — superseded by this report |
| E14 | WS-A evidence record + 2026-11-08 addendum | `3e5fdc1c…` — `docs/integration/WS-A-DHAN-BROKER-IDENTITY-EVIDENCE-RECORD-2026-11-05.md` | Append-only chain |
| E15 | P8 rollback drill receipt | `evidence/cross-repository/IIPS_V3_D05_WAVE1_ROLLBACK_DRILL_2026-11-08.md` | Frozen-Wave-1 comparison for AGI GREENPAC alias history |

Digests abbreviated; full SHA-256 values retrievable via `sha256sum` on the named paths. All bundle files read in `/tmp` scratch only; bundle untouched.

## 4. What the evidence shows

**F-1 — The observed surface carries no resolvable identifier.** All 68 rows of `rows.json` have `sourceIsin: null` and `sourceExchange: null`; `sourceName` is the only supplied identifier; `rawDigitString` de-concatenation ambiguity affected rows 1, 38, 54 (values 25/2/258 candidates etc.) and does not affect identity.

**F-2 — The companion committed export carries ISINs for exactly these 68 positions**, joined by case-insensitive, whitespace-normalized display-name comparison; **ALL 68 rows joined 1:1, zero unmatched, zero duplicate ISINs, no name↔name ambiguity**. Quantity ground truth in the export agrees with the UI-reconstructed readings on 65/68 rows; on the three disagreement rows the export's unambiguous values (2 / 142 / 336) match the UI's documented alternative readings [2] (AGI), [142] (KM SUGAR MILLS) and [336] (SALASAR TECHNO ENGINEERING). The export is therefore the same 68 positions with strictly more information than the observed surface.

**F-3 — ISIN membership in the pinned source masters (all 68 ISINs):**
- NSE listing master (`EQUITY_L(1).csv`): **67/68 present**; 65 in series **EQ**, 2 (`INE583V01021` RADHIKAJWE, `INE562X01013` UNIVASTU) in series **BE**; row 44 (`INE721I01024` National Stock Exchange of India) **absent** (NSE has no own CM listing).
- BSE active-equity cleaned (2026-11-07): **66/68 present** (63 of the 65 unresolved rows + all 3 resolved rows: AGI 500187, GHCL 500171, KROSS 544253) — absent: row 24 GEEKAYWIRE (`INE669X01032`, NSE-only listing; ∈ the 100 act-bound BSE-exclusion set), row 63 UNIVASTU (`INE562X01013`).
- Both source masters agree row-by-row with the authenticated corpus on series/listing evidence (universe of record = NSE CM EQ approved per the 2026-11-08 replacement act).

**F-4 — Exact-ISIN governed resolution probe (read-only, against the shipped authenticated universe):** all 68 ISINs were submitted via `SecurityMaster.resolveCompanyId({identifierType:'ISIN', identifierValue})`. Result: **65/68 RESOLVED** with a unique `EQ_*` identity (including rows 1/EQ_AGI_IN, 21/EQ_GHCL_IN, 40/EQ_KROSS_IN); exactly 3 fail closed `UNMAPPED_IDENTIFIER`: `INE562X01013`, `INE583V01021`, `INE721I01024`. **This probe proves the 62 previously-unresolved in-scope rows are resolvable through the existing, unmodified established identity path.**

**F-5 — Why the pipeline did not resolve the 65 rows:** run 3 (`GOVERNED_AUTHENTICATED_MASTER_2026-11-08`) queried `NSE_SYMBOL:=sourceName` then `BSE_SYMBOL:=sourceName` (both `UNMAPPED_IDENTIFIER`) because `suppliedIsin=null` and `suppliedExchange=null` in every row. Under the UNSCOPED exact-key discipline this is the **correct, governed outcome**, not an implementation failure. No lookup was *attempted* against the ISIN namespace because the input contract never carried one.

**F-6 — Canonical identity candidates exist for all 62 in-scope rows** and are unique. The full per-row candidate table is in Appendix A. No row has more than one candidate; no row collides on another's canonical key (controls: 60 row-distinct NSE symbols / 62 distinct `EQ_*` — no reuse).

**F-7 — The four spot-checks are all the same root cause:** the exact canonical keys exist; the rows correspond to them one-to-one by ISIN; the broker supplied a plain-English display name; the pipeline correctly failed closed. See §5 for details per spot-check.

**F-8 — The prior B-06 closure record (E13) understated this; its spot-check pairings for rows 37 and 67 were wrong** (it associated row 37 with `INE0BJO01010 JIO PLATFORMS` correctly but opened a confusion with Jio Financial `INE758E01017` across rows; row 67 was paired against Waaree Energies `INE377N01017`/`WAAREEENER` rather than the correct `INE299N01021`/`WAAREERTL`). Neither Jio Financial (`INE758E01017`) nor Waaree Energies (`INE377N01017`) appears in the 68 positions. Those two records are superseded by this report and must not be propagated. SUZLON and IDFCFIRSTB pairings in the 2026-11-08 reassessment record are correct (same issuer, exact symbol key exists under `SUZLON`/`IDFCFIRSTB`) and are retained.

## 5. The four spot-checks — findings

| Check | Canonical key(s) | Whose keys | Observed row | Root cause of non-resolution | Defensible alias? |
|---|---|---|---|---|---|
| SUZLON (row 60) | NSE `SUZLON` (EQ), ISIN `INE040H01021`; BSE `532667` | Suzlon Energy Ltd | Broker supplied `SUZLON ENERGY`; exact `SUZLON` lookup missed | Display-name ≠ verbatim key; no ISIN supplied. Resolution exists via exact ISIN (F-4). Do **not** add `SUZLON ENERGY` alias — speculative; not needed | **No** |
| IDFCFIRSTB (row 29) | NSE `IDFCFIRSTB` (EQ), ISIN `INE092T01019`; BSE `539437` | IDFC First Bank Ltd | Broker supplied `IDFC FIRST BANK` | Same as above | **No** |
| WAAREEENER (row 67) | NSE `WAAREERTL` (EQ, note: **not** `WAAREEENER`); ISIN `INE299N01021`; BSE `534618` | Waaree Renewable Technologies Ltd | Broker supplied `WAAREE RENEWABLE TECHNOLOGIES` | Same as above; `WAAREEENER` is Waaree Energies Ltd (`INE377N01017`) — a different listed issuer, irrelevant to this row | **No** |
| JIOFIN (row 37) | NSE `JPL` (EQ, note: **not** `JIOFIN`); ISIN `INE0BJO01010`; BSE `545004` | Jio Platforms Ltd | Broker supplied `JIO PLATFORMS` | Same as above; `JIOFIN` is Jio Financial Services `INE758E01017` — a different listed issuer, irrelevant to this row | **No** |

All four pass the established exact-ISIN rule immediately. None requires even a governed alias; adding one would violate the alias-minimization principle and the PA's "no speculation" constraint.

## 6. Why the three rows resolved — vs the 65 that did not

| Field | Row 1 AGI GREENPAC (RESOLVED) | Row 21 GHCL (RESOLVED) | Row 40 KROSS (RESOLVED) | The 62 in-scope UNRESOLVED rows | The 3 out-of-scope UNRESOLVED rows |
|---|---|---|---|---|---|
| Supplied identifier | `AGI GREENPAC` | `GHCL` | `KROSS` | Plain-English display name (e.g. `ASK AUTOMOTIVE`) | Plain-English display name |
| Exchange / segment | none (UNSCOPED) | none (UNSCOPED) | none (UNSCOPED) | none (UNSCOPED) | none (UNSCOPED) |
| ISIN supplied? | no | no | no | no (present in E8 for every row) | no (present in E8) |
| Lookup outcome | `NSE_SYMBOL=AGI GREENPAC` → **RESOLVED** (governed effective-dated alias `2022-01-01T00:00:00Z` `EQ_AGI_IN`, carried through the replacement act verbatim) | `NSE_SYMBOL=GHCL` → **RESOLVED** (verbatim symbol equality) | `NSE_SYMBOL=KROSS` → **RESOLVED** (verbatim symbol equality) | `NSE_SYMBOL=name` → UNMAPPED (one), `BSE_SYMBOL=name` → UNMAPPED (one) — namespace-equality never occurred | same |
| ISIN would also resolve? | yes (`INE415A01038` → `EQ_AGI_IN`; identity consistent) | yes (`INE539A01019` → `EQ_GHCL_IN`) | yes (`INE0O6601022` → `EQ_KROSS_IN`) | **yes — 62 of 62 (F-4)** | **no — UNMAPPED_IDENTIFIER (correctly)** |
| Issue class | governed-alias hit (data held, exact match) | verbatim symbol hit (data held, exact match) | verbatim symbol hit (data held, exact match) | missing supplied ISIN — evidence exists, surface does not carry it | authorized universe scope exclusion — evidence insufficient BY DESIGN |

**Diagnosis of the gap** (carried into §8): the problem is **not** source-data completeness in the *governed universe* (all 62 securities are inside it), **not** the matching logic (implementation behaves as specified; fails closed), **not** normalization, **not** exchange scoping of the corpus. The gap is **(i) an identifier-free broker surface shape** (`DHAN_WEB_UI_SUMMARY_V1` has no ISIN/exchange fields) plus **(ii) the pipeline was fed that shape alone** — the companion export with the missing ISIN was committed in the same tree and never passed to ingress. Two sub-classes among the 65 remain: the three out-of-scope securities, which are a **scope** question, unresolvable inside the act.

## 7. Row-by-row diagnostic matrix (65 rows)

Field semantics (applies to every row unless noted):

1. **Row** = the row's `rowIndex` in `rows.json` (1..68 of the observed 68; rows 1, 21, 40 are the three RESOLVED and are excluded).
2. **Broker company name** = `sourceName` as observed (verbatim).
3. **Original broker symbol** — DHAN_WEB_UI_SUMMARY_V1 has **no separate symbol field**; the supplied identifier is the display name above and was used verbatim as `sourceIdentifier`.
4. **Exchange and segment, if available** — **not available** (`sourceExchange = null` for all 68 rows); where the row is listed below, the NSE **series** is from the NSE listing master (E10) and BSE **group** from the BSE active-equity export (E9), i.e. source-side, not broker-side.
5. **ISIN** — **not in the observed surface** (`sourceIsin = null` for all 68 rows); **available in committed repo evidence E8** for every row shown below.
6. **Dhan instrument identifier/token** — not present in E7 or E8 (no instrument-token or scrip-code column); the ISIN functions as the identity key.
7. **Canonical identity candidates, if any** — the exact `EQ_*` identity each ISIN maps to in the authenticated universe (E1/E2), unique per row, or "none in universe" for the three out-of-scope rows.
8. **Security in the authenticated D05 universe?** — yes for 62 rows (shown), no for rows 44, 51, 63.
9. **In BSE / NSE source evidence?** — NSE: shown with series (EQ/BE); BSE: shown with scrip/group (or "absent").
10. **Matching methods attempted** — always: `NSE_SYMBOL := name` (exact) → `BSE_SYMBOL := name` (exact). Both `UNMAPPED_IDENTIFIER` for all 65 rows (E6 run 3). The ISIN-first path was **not attempted** (no ISIN supplied by ingress input).
11. **Exact reason matching failed** — always: the supplied identifier is not an exact governed key or governed effective-dated alias in either namespace (data-controlled, fail-closed by design). The underlying missing field is the **broker-supplied ISIN**, which exists in committed evidence (E8); for rows 44, 51, 63 the missing piece is **authorization to include BE-series/BSE-exclusive securities in the universe** (governance), not evidence.
12. **Missing information available in existing artifact?** — rows 2–68 except 44/51/63: **yes** (E8; F-4 verifies end-to-end). Rows 44, 51, 63: partially (BSE evidence exists — 44/51 — but bringing them into scope requires a scope act; 63 has BSE evidence absent entirely).
13. **Minimum additional evidence needed** — rows 2–68 except 44/51/63: **none new**; a re-assessment ingress supplying the ISIN from E8 is sufficient (see §9-A). Rows 44/51/63: PA-approved scope disposition (see §9-C); broker attestation (contract note/CAS) may evidence the positions but is NOT sufficient to bring them into scope — that is a governance question.
14. **Resolvable without changing architecture?** — rows 2–68 except 44/51/63: **yes** (62 rows). Rows 44/51/63: **yes** only via a new authorized universe scope or explicit out-of-scope disposition; architecture is not the constraint.

Per-row table (verified live against E1–E11 on 2026-11-08):

| # | Broker company name | Symbol supplied | NSE (series) | BSE (scrip/grp) | ISIN (E8) | In CM EQ universe? | Canonical (exact-ISIN) | Category |
|---|---|---|---|---|---|---|---|---|
| 2 | ASK AUTOMOTIVE | ASK AUTOMOTIVE | ASKAUTOLTD (EQ) | 544022/B | INE491J01022 | YES | EQ_ASKAUTOLTD_IN | RC-1a |
| 3 | AJAX ENGINEERING | AJAX ENGINEERING | AJAXENGG (EQ) | 544356/B | INE274Y01021 | YES | EQ_AJAXENGG_IN | RC-1a |
| 4 | ARIHANT CAPITAL MARKETS | ARIHANT CAPITAL MARKETS | ARIHANTCAP (EQ) | 511605/B | INE420B01036 | YES | EQ_ARIHANTCAP_IN | RC-1a |
| 5 | ARKADE DEVELOPERS | ARKADE DEVELOPERS | ARKADE (EQ) | 544261/B | INE0QRL01017 | YES | EQ_ARKADE_IN | RC-1a |
| 6 | ARROW GREENTECH | ARROW GREENTECH | ARROWGREEN (EQ) | 516064/B | INE570D01018 | YES | EQ_ARROWGREEN_IN | RC-1a |
| 7 | ASHOKA BUILDCON | ASHOKA BUILDCON | ASHOKA (EQ) | 533271/A | INE442H01029 | YES | EQ_ASHOKA_IN | RC-1a |
| 8 | BANK OF BARODA | BANK OF BARODA | BANKBARODA (EQ) | 532134/A | INE028A01039 | YES | EQ_BANKBARODA_IN | RC-1a (MCA: unmatched in bridge candidate; act-bound B1 attribution in deposit — not an identity blocker) |
| 9 | BHARAT COKING COAL | BHARAT COKING COAL | BHARATCOAL (EQ) | 544678/B | INE05XR01022 | YES | EQ_BHARATCOAL_IN | RC-1a |
| 10 | BLUE JET HEALTHCARE | BLUE JET HEALTHCARE | BLUEJET (EQ) | 544009/A | INE0KBH01020 | YES | EQ_BLUEJET_IN | RC-1a |
| 11 | CANARA ROBECO ASSET MANAGEMENT COMPANY | CANARA ROBECO ASSET MANAGEMENT COMPANY | CRAMC (EQ) | 544580/B | INE218I01013 | YES | EQ_CRAMC_IN | RC-1a |
| 12 | CREDO BRANDS MARKETING (MUFTI) | CREDO BRANDS MARKETING (MUFTI) | MUFTI (EQ) | 544058/B | INE220Q01020 | YES | EQ_MUFTI_IN | RC-1a |
| 13 | DAM CAPITAL ADVISORS | DAM CAPITAL ADVISORS | DAMCAPITAL (EQ) | 544316/B | INE284H01025 | YES | EQ_DAMCAPITAL_IN | RC-1a |
| 14 | ECOS MOBILITY & HOSPITALITY | ECOS MOBILITY & HOSPITALITY | ECOSMOBLTY (EQ) | 544239/B | INE06HJ01020 | YES | EQ_ECOSMOBLTY_IN | RC-1a |
| 15 | EMS | EMS | EMSLIMITED (EQ) | 543983/B | INE0OV601013 | YES | EQ_EMSLIMITED_IN | RC-1a |
| 16 | EPACK PREFAB TECHNOLOGIES | EPACK PREFAB TECHNOLOGIES | EPACKPEB (EQ) | 544540/B | INE0MLS01022 | YES | EQ_EPACKPEB_IN | RC-1a |
| 17 | ELECON ENGINEERING COMPANY | ELECON ENGINEERING COMPANY | ELECON (EQ) | 505700/A | INE205B01031 | YES | EQ_ELECON_IN | RC-1a |
| 18 | EMAMI | EMAMI | EMAMILTD (EQ) | 531162/A | INE548C01032 | YES | EQ_EMAMILTD_IN | RC-1a |
| 19 | ENGINEERS INDIA | ENGINEERS INDIA | ENGINERSIN (EQ) | 532178/A | INE510A01028 | YES | EQ_ENGINERSIN_IN | RC-1a |
| 20 | FINEOTEX CHEMICAL | FINEOTEX CHEMICAL | FCL (EQ) | 533333/B | INE045J01034 | YES | EQ_FCL_IN | RC-1a |
| 22 | GMR POWER & URBAN INFRA | GMR POWER & URBAN INFRA | GMRP&UI (EQ) | 543490/A | INE0CU601026 | YES | EQ_GMRPUI_IN | RC-1a |
| 23 | GATEWAY DISTRIPARKS | GATEWAY DISTRIPARKS | GATEWAY (EQ) | 543489/B | INE079J01017 | YES | EQ_GATEWAY_IN | RC-1a |
| 24 | GEEKAY WIRES | GEEKAY WIRES | GEEKAYWIRE (EQ) | absent (NSE-only listing; ∈ 100 act-bound BSE exclusions) | INE669X01032 | YES | EQ_GEEKAYWIRE_IN | RC-1a |
| 25 | GENUS POWER INFRASTRUCTURES | GENUS POWER INFRASTRUCTURES | GENUSPOWER (EQ) | 530343/A | INE955D01029 | YES | EQ_GENUSPOWER_IN | RC-1a |
| 26 | GRAUER & WEIL | GRAUER & WEIL | GRAUWEIL (EQ) | 505710/B | INE266D01021 | YES | EQ_GRAUWEIL_IN | RC-1a (MCA: exempt-27 per `pa_decisions.json` — not an identity blocker) |
| 27 | GUJARAT PIPAVAV PORT | GUJARAT PIPAVAV PORT | GPPL (EQ) | 533248/A | INE517F01014 | YES | EQ_GPPL_IN | RC-1a |
| 28 | HIMADRI SPECIALITY CHEMICAL | HIMADRI SPECIALITY CHEMICAL | HSCL (EQ) | 500184/A | INE019C01026 | YES | EQ_HSCL_IN | RC-1a |
| 29 | IDFC FIRST BANK | IDFC FIRST BANK | IDFCFIRSTB (EQ) | 539437/A | INE092T01019 | YES | EQ_IDFCFIRSTB_IN | RC-1a |
| 30 | IIFL CAPITAL SERVICES | IIFL CAPITAL SERVICES | IIFLCAPS (EQ) | 542773/A | INE489L01022 | YES | EQ_IIFLCAPS_IN | RC-1a |
| 31 | INDRAPRASTHA MEDICAL CORPORATION | INDRAPRASTHA MEDICAL CORPORATION | INDRAMEDCO (EQ) | 532150/A | INE681B01017 | YES | EQ_INDRAMEDCO_IN | RC-1a |
| 32 | INTERNATIONAL CONVEYORS | INTERNATIONAL CONVEYORS | INTLCONV (EQ) | 509709/B | INE575C01027 | YES | EQ_INTLCONV_IN | RC-1a |
| 33 | INTERNATIONAL GEMOLOGICAL INSTITUTE | INTERNATIONAL GEMOLOGICAL INSTITUTE | IGIL (EQ) | 544311/A | INE0Q9301021 | YES | EQ_IGIL_IN | RC-1a |
| 34 | J KUMAR INFRAPROJECTS | J KUMAR INFRAPROJECTS | JKIL (EQ) | 532940/B | INE576I01022 | YES | EQ_JKIL_IN | RC-1a |
| 35 | JAI BALAJI INDUSTRIES | JAI BALAJI INDUSTRIES | JAIBALAJI (EQ) | 532976/A | INE091G01026 | YES | EQ_JAIBALAJI_IN | RC-1a |
| 36 | JAMNA AUTO INDUSTRIES | JAMNA AUTO INDUSTRIES | JAMNAAUTO (EQ) | 520051/A | INE039C01032 | YES | EQ_JAMNAAUTO_IN | RC-1a |
| 37 | JIO PLATFORMS | JIO PLATFORMS | JPL (EQ) | 545004/A | INE0BJO01010 | YES | EQ_JPL_IN | RC-1a |
| 38 | KM SUGAR MILLS | KM SUGAR MILLS | KMSUGAR (EQ) | 532673/B | INE157H01023 | YES | EQ_KMSUGAR_IN | RC-1a |
| 39 | KP ENERGY | KP ENERGY | KPEL (EQ) | 539686/B | INE127T01021 | YES | EQ_KPEL_IN | RC-1a |
| 41 | LANDMARK CARS | LANDMARK CARS | LANDMARK (EQ) | 543714/B | INE559R01029 | YES | EQ_LANDMARK_IN | RC-1a |
| 42 | MATRIMONY.COM | MATRIMONY.COM | MATRIMONY (EQ) | 540704/B | INE866R01028 | YES | EQ_MATRIMONY_IN | RC-1a |
| 43 | MONARCH NETWORTH CAPITAL | MONARCH NETWORTH CAPITAL | MONARCH (EQ) | 511551/B | INE903D01011 | YES | EQ_MONARCH_IN | RC-1a |
| 44 | NATIONAL STOCK EXCHANGE OF INDIA | NATIONAL STOCK EXCHANGE OF INDIA | absent | 544937/A (Equity, ACTIVE; BSE-only listing) | INE721I01024 | **NO** | none in universe | RC-1b |
| 45 | OSWAL PUMPS | OSWAL PUMPS | OSWALPUMPS (EQ) | 544418/B | INE0BYP01024 | YES | EQ_OSWALPUMPS_IN | RC-1a |
| 46 | PANAMA PETROCHEM | PANAMA PETROCHEM | PANAMAPET (EQ) | 524820/B | INE305C01029 | YES | EQ_PANAMAPET_IN | RC-1a |
| 47 | PARADEEP PHOSPHATES | PARADEEP PHOSPHATES | PARADEEP (EQ) | 543530/B | INE088F01024 | YES | EQ_PARADEEP_IN | RC-1a |
| 48 | PRECISION WIRES INDIA | PRECISION WIRES INDIA | PRECWIRE (EQ) | 523539/B | INE372C01037 | YES | EQ_PRECWIRE_IN | RC-1a |
| 49 | PREMIER POLYFILM | PREMIER POLYFILM | PREMIERPOL (EQ) | 514354/B | INE309M01020 | YES | EQ_PREMIERPOL_IN | RC-1a |
| 50 | PUDUMJEE PAPER PRODUCTS | PUDUMJEE PAPER PRODUCTS | PDMJEPAPER (EQ) | 539785/B | INE865T01018 | YES | EQ_PDMJEPAPER_IN | RC-1a |
| 51 | RADHIKA JEWELTECH | RADHIKA JEWELTECH | RADHIKAJWE (BE) | 540125/T (SME) | INE583V01021 | **NO** | none in universe | RC-1b |
| 52 | RAJOO ENGINEERS | RAJOO ENGINEERS | RAJOOENG (EQ) | 522257/B | INE535F01024 | YES | EQ_RAJOOENG_IN | RC-1a |
| 53 | RATEGAIN TRAVEL | RATEGAIN TRAVEL | RATEGAIN (EQ) | 543417/A | INE0CLI01024 | YES | EQ_RATEGAIN_IN | RC-1a |
| 54 | SALASAR TECHNO ENGINEERING | SALASAR TECHNO ENGINEERING | SALASAR (EQ) | 540642/B | INE170V01027 | YES | EQ_SALASAR_IN | RC-1a |
| 55 | SHAKTI PUMPS | SHAKTI PUMPS | SHAKTIPUMP (EQ) | 531431/A | INE908D01010 | YES | EQ_SHAKTIPUMP_IN | RC-1a |
| 56 | SHARDA MOTOR | SHARDA MOTOR | SHARDAMOTR (EQ) | 535602/B | INE597I01028 | YES | EQ_SHARDAMOTR_IN | RC-1a |
| 57 | SIGMA SOLVE | SIGMA SOLVE | SIGMA (EQ) | 543917/B | INE0A0S01028 | YES | EQ_SIGMA_IN | RC-1a |
| 58 | SIYARAM SILK MILLS | SIYARAM SILK MILLS | SIYSIL (EQ) | 503811/B | INE076B01028 | YES | EQ_SIYSIL_IN | RC-1a |
| 59 | STEELCAST | STEELCAST | STEELCAS (EQ) | 513517/B | INE124E01038 | YES | EQ_STEELCAS_IN | RC-1a |
| 60 | SUZLON ENERGY | SUZLON ENERGY | SUZLON (EQ) | 532667/A | INE040H01021 | YES | EQ_SUZLON_IN | RC-1a |
| 61 | THYROCARE TECHNOLOGIES | THYROCARE TECHNOLOGIES | THYROCARE (EQ) | 539871/A | INE594H01019 | YES | EQ_THYROCARE_IN | RC-1a |
| 62 | TITAGARH RAIL SYSTEMS | TITAGARH RAIL SYSTEMS | TITAGARH (EQ) | 532966/A | INE615H01020 | YES | EQ_TITAGARH_IN | RC-1a |
| 63 | UNIVASTU | UNIVASTU | UNIVASTU (BE) | absent | INE562X01013 | **NO** | none in universe | RC-1b |
| 64 | VARDHMAN SPECIAL STEELS | VARDHMAN SPECIAL STEELS | VSSL (EQ) | 534392/B | INE050M01012 | YES | EQ_VSSL_IN | RC-1a |
| 65 | VISHAL MEGA MART | VISHAL MEGA MART | VMM (EQ) | 544307/A | INE01EA01019 | YES | EQ_VMM_IN | RC-1a |
| 66 | VISHNU CHEMICALS | VISHNU CHEMICALS | VISHNU (EQ) | 516072/B | INE270I01022 | YES | EQ_VISHNU_IN | RC-1a |
| 67 | WAAREE RENEWABLE TECHNOLOGIES | WAAREE RENEWABLE TECHNOLOGIES | WAAREERTL (EQ) | 534618/A | INE299N01021 | YES | EQ_WAAREERTL_IN | RC-1a |
| 68 | WEBSOL ENERGY SYSTEM | WEBSOL ENERGY SYSTEM | WEBELSOLAR (EQ) | 517498/B | INE855C01023 | YES | EQ_WEBELSOLAR_IN | RC-1a |

**Field-9 recount for the 65 unresolved rows:** NSE listing master hits = **64** (62 EQ + 2 BE); NSE EQ = **62**; absent = 1 (row 44). BSE active-equity hits = **63** (all except **24** GEEKAYWIRE and **63** UNIVASTU). Authenticated CM EQ universe membership = **62**. MCA bridge (informational only): **60 Verified**, **2 Unmatched-but-act-bound** (rows 8 BANKBARODA, 26 GRAUWEIL — no identity consequence; 26 ∈ the 27 MCA-exempt act set), **3 absent** (rows 44, 51, 63). No field beyond these was needed or inferred.

**Field-11 machine-checkable attest**: run 3 of E6 shows for each of the 65 rows the lookups `{NSE_SYMBOL:=name → UNMAPPED_IDENTIFIER, BSE_SYMBOL:=name → UNMAPPED_IDENTIFIER}` with `suppliedIsin:null`, `suppliedExchange:null`, `refusalCode: NO_AUTHORITATIVE_IDENTIFIER_MATCH` — the generic class, which this report now decomposes precisely.

## 8. Root-cause categories (counts, mutually non-exclusive by construction)

| Code | Category | Rows | Count |
|---|---|---|---|
| RC-1 | **Missing broker ISIN in the observed surface** (structural; `DHAN_WEB_UI_SUMMARY_V1` emits no ISIN) — the proximate cause for 100% of the 65 | 2–68 (all unresolved) | **65** |
| RC-2 | **Missing exchange/segment scope in the observed surface** (same structural shape; no exchange column) — subsumption note: if ISIN is supplied, scope becomes unnecessary under the ISIN-first rule | all 65 | **65** |
| RC-3 | **Display name vs verbatim canonical symbol/alias discrepancy** (UNSCOPED exact-key trials fail) | all 65 (none equals a governed key/alias) | **65** |
| RC-6 | **Source evidence incomplete — observed artifact insufficient; the needed identifier exists in a separate committed broker export** | all 65 (E8) | **65** |
| RC-7 | **Security absent from the authenticated CM EQ universe scope** (not a master defect — exclusion classes: BE series; NSE-of-India BSE-only listing) | 44, 51, 63 | **3** |
| RC-1a | Subset of RC-1/RC-6: ISIN exists in E8 **and** is a member of the authenticated CM EQ universe; exact-ISIN resolution returns a unique `EQ_*` | all unresolved except 44, 51, 63 | **62** |
| RC-1b | Subset of RC-1/RC-6/RC-7: ISIN exists in E8; security outside the authorized universe act (row 44 BSE-exclusive; rows 51/63 NSE BE series) | 44, 51, 63 | **3** |
| RC-4 | Corporate-action / historical-identity issue | — | **0** |
| RC-5 | Source evidence incomplete (broker/universe-side field simply does not exist for lack of acquisition) | — (nothing new needed for RC-1a; for RC-1b the situation is a scope act, not evidence) | **0** |
| RC-8 | Existing evidence sufficient but matching implementation incomplete (code defect) | — (implementation performs ISIN-first correctly; no ISIN was ever supplied to it) | **0** |
| RC-9 | Other precisely identified cause | — | **0** |

**No fuzzy matching, no aliases, no name similarity were used or proposed anywhere in this investigation.**

## 9. Minimum corrective actions per category

**A. RC-1a — 62 rows (rows 2–43, 45–50, 52–62, 64–68 excluding rows 1/21/40 which resolved).**
Minimum corrective action is **data supply, not acquisition or logic change**: PA decision to authorize a **one-time ISIN-scoped companion re-assessment** of these 62 rows through the existing `GOVERNED_AUTHENTICATED_MASTER_2026-11-08` path (`resolveCompanyId` ISIN-first), using E8 as the identifier source and E7 as the position source, under the exact-identifier control. Requirements and non-goals:
- Use only the exact ISIN from E8; no name matching of any kind.
- Expected result: 62/62 RESOLVED with the same companyIds as Appendix A; rows 44/51/63 remain `UNMAPPED_IDENTIFIER` (fail-closed, as designed).
- **$0 persisted** until a separate persistence authorization exists — this authorization covers re-assessment evidence only.
- **No alias, no mapping, no normalization change.**
- Alternatively (or additionally), the broker may re-export the file in a format containing ISIN (exact fields needed: `ISIN`, `Qty`, `Avg. Buy Price`, `LTP`, optionally `Exchange`); the Dhan "Detailed Holdings" complete export — of which E8 appears to be the committed copy — is the canonical source.
- **Do not request broad new evidence exercises** — the information exists; this is a re-assessment with a complete identifier set, not an acquisition.
- Consistent with controls: no weakening, no fuzzy, success-rows untouched (AGI GREENPAC/GHCL/KROSS identical companyIds under both paths — safe).
- If this correction is enacted, the import's identity evidence must be regenerated and the WS-A record addendum appended (append-only), with runtime gate: **fail-closed remains the default**; `saveable=false` until persistence is separately authorized.

**B. RC-3 / RC-1 (proximate-name observation) — part of A; no separate action.** If the previous display-name evidence was expected to resolve such rows, the expectation was misspecified: exact-key namespaces do not index plain-English names. No new aliases are defensible here (SUZLON/IDFCFIRSTB/WAAREEENER/JIOFIN are not aliases — they are non-equal keys).

**C. RC-1b / RC-7 — 3 rows (44 `INE721I01024`, 51 `INE583V01021`, 63 `INE562X01013`).**
- These **cannot** be resolved under `AD-W1-AUTH-2026-01` as currently constituted. Each requires a **new governance decision**, not technical work:
  1. Row 44 — BSE-listed ACTIVE group A equity of the National Stock Exchange of India (scrip 544937). Inclusion requires a universe act covering BSE-exclusive listings (a class genuinely absent from CM EQ NSE master scope); absent such an act, the correct outcome is `UNMAPPED_IDENTIFIER` (fail-closed) — never forced inclusion. Broker-side attestation (contract note/CAS) would evidence the position but cannot override scope.
  2. Row 51 — NSE **BE** series + BSE group **T** (SME) listing of Radhika Jeweltech. Same class of decision (BE/SME scope act).
  3. Row 63 — NSE **BE** series; absent BSE active-equity. Same class of decision.
- Until/unless an act authorizes expansion, these rows must remain unresolved and must be reported to the holder as **out-of-universe positions**, with exact dispositions: (i) PA-authorized universe expansion act; or (ii) out-of-scope refusal with broker-source disposition reference. Either way: no eligibility claim, no ISIN pretension, no forced mapping.
- **Note for the record**: row 51/63 are BE-series (trade-to-trade). BE securities are exactly the class the CM EQ scope act excludes by series. This is working as designed, not a gap.

**D. RC-2 / RC-4 / RC-5 / RC-8 / RC-9** — none apply; no action.

**E. Verification protocol once authorized.**
1. Re-run the ingress with the ISIN-carrying surface; assert the run record shows `suppliedIsin` non-null for the 62 rows and `companyId` identical to Appendix A for each.
2. Assert rows 44/51/63 still fail closed — no ISIN substitution beyond exact match.
3. Assert rows 1/21/40 unchanged (companyIds, lookup paths).
4. Run the full identity test suite; retain: no new aliases, no eligibility assertions (`NOT_ASSERTED` stays).
5. Update this report with an append-only outcome addendum; only then decide B-06 closure **with PA sign-off**.

## 10. Revised B-06 status and next steps

- **B-06 remains OPEN.** The 2026-11-08 closure record (E13)'s language of "residual exceptions" is **withdrawn by this report**: the 65 rows are enumerated root-caused, of which **62 are mechanistically resolvable with committed evidence and zero control change**; the remaining 3 are scope exclusions. Neither class supports "residual exception" as a disposition.
- **No evidence re-generated, nothing persisted, no alias added, no control touched.** The three resolutions and the authenticated replacement are untouched.
- **Immediate next steps (PA decisions required, in order):**
  1. Accept this root-cause decomposition as the corrected record for the 65 rows.
  2. Authorize or decline **§9-A** (one-time ISIN-scoped re-assessment ingress for 62 rows; `$0` persisted; code of record unchanged).
  3. Decide **§9-C** for rows 44/51/63 (universe-scope act vs formal out-of-scope refusal).
  4. Only after (2) and (3) execute: re-evaluate B-06 closure with PA sign-off. **B-06 is not closable on the strength of this investigation alone.**
- Eligibility remains `NOT_ASSERTED` for every instrument named above; nothing here constitutes an investment, listing, or eligibility recommendation.

## 11. Provenance and references

- PA instruction: "B-06 — 65 UNRESOLVED ROWS: ROOT-CAUSE INVESTIGATION" (2026-11-08), conversation-authoritative.
- The authenticated universe, its deposit acts, `pa_decisions.json` and `field_sources.csv` live under `evidence/D05-Wave3/deposit-2026-11-08/` (P3/P6 acts).
- The companion Dhan export (E8, `2dc1d1fb…`) is the B-04 acquisition copy (IRR PR #496, merge `0a0aac2bba517be933dae7a91a89af2943996b51`; apex copy: `iips-review-recovered`); it is the same 68 positions re-proven by name-join (all 68) and quantity-join (65/68 with documented quantity disagreement class resolved via documented alternative readings).
- Appendix digests: source.csv `2dc1d1fb…` · reconstructed surface `c44e3cdb…` (used only for provenance) · rows.json `bfd0496e…` · outcomes (immutable) `4712ebb2…` · authenticated corpus repo copy `b555fd28…` · prior closure record `dd1587f7…`.
- This report is append-only from this version forward. Corrections to this document must be appended with date and authority; the 2026-11-08 B-06 reassessment record (E13) is superseded in part (§4-F8, §5) but retained as a historical artifact.

*Prepared by Agent Mode on 2026-11-08 for the PA. Evidence executed read-only against the authenticated replacement. Eligibility `NOT_ASSERTED` everywhere. UNLISTED-BSE never resolvable; fail-closed universal.*

---

## APPEND-ONLY OUTCOME ADDENDUM — §9-A executed / §9-C declined (2026-11-08, later same day)

Governing PA authorization 2026-11-08 (explicit B-06 acts): §9-A execution authorized as a one-time ISIN-scoped reassessment of the 62 in-scope rows using E8 as identifier source and E7 as position source; exact ISIN key only; no inference from display names; rows 44/51/63 remain fail-closed `UNMAPPED_IDENTIFIER`; universe retained at exactly 2,390; no persistence, no writes, no rule/alias/mapping/matching changes; B-06 remains OPEN pending PA review.

Executed and verified: the one-time reassessment resolved **65/68** positions (62 previously unresolved in-scope rows + the three previously resolved rows, identities preserved `EQ_AGI_IN`/`EQ_GHCL_IN`/`EQ_KROSS_IN`), with every Appendix A target matched exactly (62/62) and rows 44/51/63 remaining `UNMAPPED_IDENTIFIER`. Evidence: `evidence/integration/ws-a-dhan-68-row/identity-outcomes-reassessment-2026-11-08.json` (SHA-256 `e99989b9962a686d33df42b43746f9127929ebced9c0a99690a64e6270ae5c2e`). Verification performed against E7/E8/Appendix A of this report; zero persistence; `saveable=false`; eligibility `NOT_ASSERTED`. **B-06 is not closed.** This addendum does not modify any prior content of this report; it supersedes only the *withholding* finding insofar as §9-A is now executed — the investigation's conclusions themselves are unchanged and were confirmed, not amended.

## APPEND-ONLY POINTER — PA REVIEW DISPOSITION 2026-11-08 (documentation only)

The PA has reviewed the §9-A execution evidence and accepted it (with §9-C declination) on 2026-11-08; the dated disposition is recorded in the authoritative B-06 governance record (`IIPS_V3_D05_B06_68ROW_REASSESSMENT_2026-11-08.md`, "APPEND-ONLY ADDENDUM — PA REVIEW DISPOSITION"). B-06 remains OPEN; reassessment accepted is not closure; zero persistence; eligibility NOT_ASSERTED. Nothing in this investigation is amended; earlier findings are retained verbatim.
