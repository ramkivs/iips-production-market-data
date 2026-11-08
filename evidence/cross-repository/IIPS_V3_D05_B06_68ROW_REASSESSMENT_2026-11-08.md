| 2 | ASK AUTOMOTIVE | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 3 | AJAX ENGINEERING | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 4 | ARIHANT CAPITAL MARKETS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 5 | ARKADE DEVELOPERS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 6 | ARROW GREENTECH | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 7 | ASHOKA BUILDCON | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 8 | BANK OF BARODA | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 9 | BHARAT COKING COAL | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 10 | BLUE JET HEALTHCARE | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 11 | CANARA ROBECO ASSET MANAGEMENT COMPANY | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 12 | CREDO BRANDS MARKETING (MUFTI) | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 13 | DAM CAPITAL ADVISORS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 14 | ECOS MOBILITY & HOSPITALITY | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 15 | EMS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 16 | EPACK PREFAB TECHNOLOGIES | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 17 | ELECON ENGINEERING COMPANY | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 18 | EMAMI | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 19 | ENGINEERS INDIA | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 20 | FINEOTEX CHEMICAL | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 22 | GMR POWER & URBAN INFRA | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 23 | GATEWAY DISTRIPARKS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 24 | GEEKAY WIRES | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 25 | GENUS POWER INFRASTRUCTURES | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 26 | GRAUER & WEIL | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 27 | GUJARAT PIPAVAV PORT | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 28 | HIMADRI SPECIALITY CHEMICAL | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 29 | IDFC FIRST BANK | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 30 | IIFL CAPITAL SERVICES | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 31 | INDRAPRASTHA MEDICAL CORPORATION | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 32 | INTERNATIONAL CONVEYORS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 33 | INTERNATIONAL GEMOLOGICAL INSTITUTE | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 34 | J KUMAR INFRAPROJECTS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 35 | JAI BALAJI INDUSTRIES | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 36 | JAMNA AUTO INDUSTRIES | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 37 | JIO PLATFORMS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 38 | KM SUGAR MILLS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 39 | KP ENERGY | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 41 | LANDMARK CARS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 42 | MATRIMONY.COM | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 43 | MONARCH NETWORTH CAPITAL | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 44 | NATIONAL STOCK EXCHANGE OF INDIA | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 45 | OSWAL PUMPS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 46 | PANAMA PETROCHEM | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 47 | PARADEEP PHOSPHATES | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 48 | PRECISION WIRES INDIA | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 49 | PREMIER POLYFILM | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 50 | PUDUMJEE PAPER PRODUCTS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 51 | RADHIKA JEWELTECH | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 52 | RAJOO ENGINEERS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 53 | RATEGAIN TRAVEL | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 54 | SALASAR TECHNO ENGINEERING | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 55 | SHAKTI PUMPS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 56 | SHARDA MOTOR | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 57 | SIGMA SOLVE | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 58 | SIYARAM SILK MILLS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 59 | STEELCAST | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 60 | SUZLON ENERGY | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 61 | THYROCARE TECHNOLOGIES | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 62 | TITAGARH RAIL SYSTEMS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 63 | UNIVASTU | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 64 | VARDHMAN SPECIAL STEELS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 65 | VISHAL MEGA MART | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 66 | VISHNU CHEMICALS | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 67 | WAAREE RENEWABLE TECHNOLOGIES | NO_AUTHORITATIVE_IDENTIFIER_MATCH |
| 68 | WEBSOL ENERGY SYSTEM | NO_AUTHORITATIVE_IDENTIFIER_MATCH |d; not closed by authorisation)

Every one of the 65 residuals shares one class: `UNSCOPED_NAME_OR_SYMBOL`, refusal `NO_AUTHORITATIVE_IDENTIFIER_MATCH`, missing evidence = "the broker file supplies neither an ISIN nor an exchange, and the supplied name/symbol is not an exact governed mapping key or governed alias; the ISIN (preferred) or an exchange-scoped trading symbol must be supplied by the broker export."

| Row | Supplied identifier | Refusal code |
|---|---|---|

Remediation (external to this repository): re-export the holdings from DHAN **Detailed**/exchange-scoped formats (ISIN column, or `Exchange` = NSE/BSE + trading symbol), or supply ISINs for these positions. Spot verification — exact NSE symbols under which these issuers ARE carried by the authenticated universe (note: this lookup used the canonical symbol key, never the display name; no mapping was created):

| Display name in file | Exact governed listing (verified) |
|---|---|
| SUZLON ENERGY | `SUZLON` → `EQ_SUZLON_IN` (INE040H01021) |
| IDFC FIRST BANK | `IDFCFIRSTB` → `EQ_IDFCFIRSTB_IN` (INE092T01019) |
| WAAREE RENEWABLE TECHNOLOGIES | `WAAREEENER` → `EQ_WAAREEENER_IN` (INE377N01017) |
| JIO PLATFORMS | `JIOFIN` → `EQ_JIOFIN_IN` (INE758E01017) |
| HIMADRI SPECIALITY CHEMICAL | not present under the obvious key in the authenticated universe either (not guessed, not mapped) — the ISIN is required |

This is a documentary mapping of already-governed facts for remediation planning only; **no identity resolution was widened**, and no row above was "resolved" by it.

## 4. Disposition and closure

- **WS-A refusal holds** under DP-2 Option-2F: the import is REJECTED (`stageReached=NORMALIZE`), zero records persisted, the saveability flag is false. Nothing about the replacement authorises saving these 65 rows.
- **P9 executed; B-06 closed by this record subject to PA acknowledgement.** The 68 rows were assessed in full under the replacement revision; 3 admitted (via exact governed identifiers), 65 quarantined with explicit reasons; residuals are filed above with the exact missing evidence class and remediation.
- The 65 residual rows are **not** auto-closable: closing them requires broker-supplied ISINs/exchange-scoped symbols (a broker-side contract matter) or a new PA-authorised evidence pass. They remain visible, refused and quantifiable here — never silently tolerated.
- If either admits later evidence, the import is re-assessed through the unchanged pipeline; the Wave-1 outcome record is retained verbatim alongside this one.

## 5. PA sign-off

This record was produced under your instruction of 2026-11-08 ("Proceed with the authorized post-merge P9 activities… Execute B-06 only at its governed P9 stage, preserving its existing controls."). It documents execution; the **closure effective date is your acknowledgement of this record (or a superseding PA instruction)**. Your authority to sign B-06 closed was expressly delegated for this scope by that instruction; no wider sign-off is conveyed.

## 6. Stated limits

- The original 68-row bytes were never retained; identity conclusions rest on the reconstructed verbatim-name surface (identity-independent of the numeric decompositions).
- Deposit CIN/descriptor facts are record-keeping facts, not independently verified (B1 discipline); every record deposits `UNCLASSIFIED`; eligibility stays `NOT_ASSERTED`.
- No production action, operational write, or promotion was performed; P9 cannot authorise them. Wave-1 evidence is bit-identical (P8 receipt).
- Quarantine-id strings in the JSON are freshly generated per run; the *log structure* is deterministic, values are per-execution identities by design.

---

## APPEND-ONLY ADDENDUM — residual-exception framing superseded (2026-11-08, later same day)

This record's 2026-11-08 interpretation of the 65 UNRESOLVED rows as residual exceptions is **superseded** by `evidence/cross-repository/IIPS_V3_D05_B06_ROOT_CAUSE_INVESTIGATION_2026-11-08.md` (root cause: identifier-free observed surface; 62 of 65 rows resolve via exact ISIN present in the committed B-04 companion export; 3 rows are scope exclusions) and by the PA authorization 2026-11-08 executing §9-A (one-time ISIN-scoped reassessment). Result under execution: 65/68 RESOLVED via exact ISIN (62 previously unresolved in-scope rows per Appendix A; rows 1/21/40 preserved); rows 44/51/63 remain `UNMAPPED_IDENTIFIER` (§9-C declined; universe retained at 2,390 NSE CM EQ securities; no aliases/exceptions/alternative mappings); `saveable=false`; zero persisted. **B-06 remains OPEN pending PA review.** This record is retained verbatim otherwise; corrections here are additive only.

---

## APPEND-ONLY ADDENDUM — PA REVIEW DISPOSITION (2026-11-08, later same day)

Governing act: PA decision 2026-11-08 — review and disposition of the §9-A execution evidence. Documentation-only, append-only. No application code, identity processing, persistence, or operational activation occurred in this pass.

Recorded decisions (verbatim-preserving, this record is append-only):

1. **§9-A reassessment: ACCEPTED AND COMPLETE.** All 62 in-scope positions resolved using exact ISIN against `GOVERNED_AUTHENTICATED_MASTER_2026-11-08` (evidence: `evidence/integration/ws-a-dhan-68-row/identity-outcomes-reassessment-2026-11-08.json`, SHA-256 `e99989b9962a686d33df42b43746f9127929ebced9c0a99690a64e6270ae5c2e`; per-row outcomes verified row-by-row against investigation Appendix A, 62/62). The three previously resolved canonical identities are preserved (`EQ_AGI_IN`, `EQ_GHCL_IN`, `EQ_KROSS_IN`).
2. **§9-C disposition: ACCEPTED.** Universe expansion declined. Rows 44 (National Stock Exchange of India), 51 (Radhika Jeweltech) and 63 (Univastu) remain UNRESOLVED and excluded under the unchanged authorized 2,390 NSE CM EQ security universe. No aliases, no eligibility bypass exceptions, no alternative identity mappings were created. Fail-closed behaviour preserved.
3. **Evidence and controls: ACCEPTED.** E7/E8 provenance and the 68/68 exact normalized display-name join are retained; quantity discrepancies on rows 1/38/54 are explicitly disclosed; `persistedRows=0`; `saveable=false`; `importDisposition=REJECTED`; `eligibility=NOT_ASSERTED`; no identity-rule, alias, normalization, mapping or persistence-control change is authorized.
4. **Execution and publication: ACCEPTED.** The PA accepts the reported validation (1184 tests executed / 1183 passed / 1 pre-existing windows-conditional skip / exit 0), the Appendix A reconciliation (62/62) and the remote artifact verification. Execution commit `80ad6d346901c936f1fb3ee98e692ec72851a309`; verified `origin/main` = `80ad6d346901c936f1fb3ee98e692ec72851a309` (published 2026-11-08).
5. **B-06: REMAINS OPEN.** This PA review accepts the reassessment, not B-06 closure. B-06 must not be marked complete, closed or production-accepted by any artifact derived from this decision. No persistence authorization is granted.

Cross-references (all append-only): `IIPS_V3_D05_B06_ROOT_CAUSE_INVESTIGATION_2026-11-08.md` (root cause record); WS-A evidence record addenda 2026-11-08 (B and C); `identity-outcomes-reassessment-2026-11-08.json` (per-row outcomes). Earlier records are preserved unchanged; the 2026-11-08 residual-exception interpretation is formally withdrawn as recorded in the investigation report and the prior addendum to this file.
