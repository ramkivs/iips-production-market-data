# DHAN W-14 / E4 — Bounded Live Quote Mapping Qualification: Pre-Execution Technical Readiness Assessment (2026-11-23)

**Workstream:** W-14 — Live Instrument Mapping Qualification · **Capability:** E4 — Bounded Live Quote Mapping Qualification
**Repository owner:** IPD · **Repository:** `ramkivs/iips-production-market-data`
**Baseline verified:** `84e988b092058df8075ffa52f5dfb0f4fef07eaf` (`main`)
**Status: READINESS ASSESSMENT ONLY. E4 NOT EXECUTED. No E4 sweep request was made, no credential read and no daemon started by this work item.**
**Operator-held evidence for O1–O5 was supplied for the 22–23 November sessions and is incorporated in §6.2 — see §6.2.1 for the evidence register, §6.2.2 for the per-item classification under the three-way distinction, and §6.2.4 for what is genuinely still required.**

> This document prepares E4. The 97-request live qualification is a **subsequent, separately authorized**
> execution step and is not performed, simulated or anticipated here. Everything below is either
> repository-verifiable fact (labelled **[R]**) or an explicit statement that operator or provider-side
> evidence is still required (labelled **[O]**).

---

## 0. Headline finding — read this before the scope is approved

**The proposed 96-instrument sample is not the current registry.** It is the pre-2026-11-15 P7 revision.

| Fact | Evidence |
| --- | --- |
| The tracked `evidence/dhan-p7/qualification-manifest.json` today holds **4,680** QUALIFIED rows over 2,390 companies | SHA-256 `69a918f7…4769`, 4,726,767 bytes |
| The 96-row manifest was **superseded** on 2026-11-15 by a governed regeneration | `docs/integration/IIPS-W04-P7-REGISTRY-REGENERATION-2026-11-15.md` §2 |
| The 96-row revision is **recoverable and hash-verifiable** as Git blob `50d9424af01527897df132a63f74d635286bfe9d` | SHA-256 `13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc`, 210,821 bytes — **both digests re-computed and matched in this work item** |
| **6 of the 96 no longer resolve** against the current registry | §3.3 |
| The 96 maps to **96 distinct vendor quote targets** — 3 ISINs are dual-listed, but the two exchanges carry *different* Dhan security IDs, so nothing deduplicates | §3.2 |

Two consequences, both requiring an owner decision before execution:

1. **Sample validity.** Executing against the 96 as-recorded would produce 6 guaranteed
   `UNRESOLVED_INSTRUMENT` failures that are *bookkeeping artefacts*, not vendor findings, because the
   P04 master renamed three companies on 2026-11-08. §3.3 gives the corrected identifiers.
2. **Scope options.** §9 sets out three defensible scopes. This assessment does **not** choose one; the
   choice is an owner decision because it changes what E4 can claim.

---

## 1. Scope as proposed, and what was verified

| Proposed | Verified |
| --- | --- |
| 96 governed P7 instruments | **CONFIRMED** — 96 QUALIFIED rows, 48 companies, 48 ISINs |
| NSE:EQ 48 / BSE:A 47 / BSE:B 1 | **CONFIRMED exactly** |
| One wrong-ID control | **DEFINED** (§4) — but see the design constraint in §4.4 |
| 97 total quote requests | **CONFIRMED as a row count** — 96 distinct vendor targets + 1 control (§3.2, §5.3) |

---

## 2. Current status of E4 prerequisites

| Prerequisite | Status | Basis |
| --- | --- | --- |
| Numeric security-ID serialization | **VERIFIED** | `docs/integration/DHAN-W12-PR176-SERIALIZATION-VERIFICATION-2026-11-23.md`; builder byte-identical at `2685562` and `84e988b` |
| Wire body for the sample | **VERIFIED offline** — every row's body computed (§3 table, column `quoteRequestBody`) | executed, not read |
| One live Reliance quote | **PASS, operator-executed, 1 request, HTTP 200** on 2026-11-18 | `DHAN-LIVE-RELIANCE-QUOTE-OPERATOR-ACCEPTANCE-2026-11-18.md` |
| M1 "one real authenticated interaction" | **SATISFIED** | same record §7.1 |
| Multi-instrument live qualification | **NOT ESTABLISHED** — the single Reliance quote is not multi-instrument evidence | §1 of that record explicitly bounds it |
| Rate-limit behaviour at 97 requests | **NOT ESTABLISHED** — never observed against the vendor | §6 |
| Credential verification | **PASS at verification time** — `PRESENT_OK`, readable, schema-valid, `aclOwnerOnly=yes`, `expired=no`, verified 2026-11-23 09:54 UTC | §6.2 O4 |
| Credential *current* validity for a future sweep | **UNVERIFIED at the time of any later execution** — the 2026-11-23 token expires `2026-11-23T14:55:08.861Z`; daily rotation is normal and prior-token expiry is not current-credential failure | §6.2 O4 |
| Authenticated daemon health access | **PASS** — authenticated `GET /v1/health` returned HTTP 200 on 2026-11-22 after the startup authentication-header correction, commit `0bb5072` | §6.2 O3 |
| Managed daemon startup | **EVIDENCED** — daemon-only restart PID `13768` (2026-11-22) and managed startup PID `16732` (2026-11-23), PID manifest recorded | §6.2 O1 |
| Runtime endpoint and vendor egress mode | **EVIDENCED** — bound `127.0.0.1:8791`; daemon stderr `vendorEgress=IPD_SERVER_HTTPS` | §6.2 O2 |
| Checkout revisions used | **EVIDENCED** — HEAD `c7c726b` → `cbb116d` (clean tree) on 2026-11-22; both strictly downstream of the PR #176 numeric-serialization merge | §6.2 O1 |
| Running-process ↔ checkout binding | **NOT CAPTURED** — no transcript ties the running daemon to a build SHA, and health `buildCommit`/`dataVersion` were not recorded | §6.2 O1(c) |
| Live runtime at baseline `84e988b` | **NOT ESTABLISHED** — no recorded session ties a running process to `84e988b`; the accepted Reliance run was `2685562` | §6.1 |
| D02 historical | Out of scope and unqualified | PR #176 verification §5 |

---

## 3. The P7 sample, reconciled

### 3.1 Provenance of the sample

| Item | Value |
| --- | --- |
| Source manifest | `qualification-manifest.json`, **historical revision** |
| Git blob | `50d9424af01527897df132a63f74d635286bfe9d` |
| SHA-256 | `13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc` |
| Bytes | 210,821 |
| `generatedAtUtc` | `2026-11-06T05:45:58.252Z` |
| `pipelineCommit` | `a8019f12cb41…` |
| Records in file | 596 (96 QUALIFIED + 500 bounded non-qualified evidence) |

Both the Git blob hash and the SHA-256 were recomputed from the retrieved bytes and matched the values
published in `docs/integration/IIPS-W04-IDENTITY-COVERAGE-REVISION-1-EVIDENCE-ASSESSMENT-2026-11-13.md` §7.1.
The sample is therefore exactly the one the W04/W06 records describe — not a reconstruction.

**Machine-readable reconciliation:** `evidence/dhan-w14-e4/e4-sample-reconciliation.json`.

### 3.2 Distribution and integrity **[R]**

| Check | Result |
| --- | --- |
| Rows | **96** |
| `NSE:EQ` | **48** ✔ matches proposal |
| `BSE:A` | **47** ✔ matches proposal |
| `BSE:B` | **1** ✔ matches proposal |
| Distinct companies | 48 |
| Distinct ISINs | 48 |
| **Distinct (company, segment) quote targets** | **96** — unique; 3 ISINs are dual-listed but their NSE and BSE Dhan security IDs differ, so no two rows collapse |
| Duplicate identities within the sample | **0** |
| Dhan security-ID collisions within the sample | **0** |
| Identity inconsistencies (same identity, different provider ID) | **0** |
| `securityId` value drift vs today's registry | **0** — no resolved row's Dhan ID changed |

Three ISINs are dual-listed and occupy both an `NSE_EQ` and a `BSE_EQ` slot. That does **not** collapse
the count: the NSE and BSE listings carry different Dhan security IDs (for example `INE155A01022` is
`3456` on `NSE_EQ` and `500570` on `BSE_EQ`), so all 96 rows are distinct vendor quote targets and each
requires its own request. The proposed "97 requests" therefore matches the implementation exactly —
see §5.3 for why that is a budget concern rather than a rounding convenience.

### 3.3 The 6 rows that no longer resolve **[R]**

These are **not** vendor failures. The P04 master was replaced on 2026-11-08 and three companies were
renamed; the manifest predates that replacement. The registry is keyed on `companyId`, so the old IDs
no longer resolve, even though the *ISIN, series and Dhan security ID are all unchanged and correct*.

| Recorded companyId | Exchange | Series | ISIN | Dhan security ID | P04 companyId now | Resolution today |
| --- | --- | --- | --- | --- | --- | --- |
| `EQ_TATAMOTORS_IN` | NSE | EQ | `INE155A01022` | `3456` | `EQ_TMPV_IN` | `UNRESOLVED` / `UNMAPPED_COMPANY_ID` |
| `EQ_TATAMOTORS_IN` | BSE | A | `INE155A01022` | `500570` | `EQ_TMPV_IN` | `UNRESOLVED` / `UNMAPPED_COMPANY_ID` |
| `EQ_BAJAJ-AUTO_IN` | NSE | EQ | `INE917I01010` | `16669` | `EQ_BAJAJAUTO_IN` | `UNRESOLVED` / `UNMAPPED_COMPANY_ID` |
| `EQ_BAJAJ-AUTO_IN` | BSE | A | `INE917I01010` | `532977` | `EQ_BAJAJAUTO_IN` | `UNRESOLVED` / `UNMAPPED_COMPANY_ID` |
| `EQ_LTIM_IN` | NSE | EQ | `INE214T01019` | `17818` | `EQ_LTM_IN` | `UNRESOLVED` / `UNMAPPED_COMPANY_ID` |
| `EQ_LTIM_IN` | BSE | A | `INE214T01019` | `540005` | `EQ_LTM_IN` | `UNRESOLVED` / `UNMAPPED_COMPANY_ID` |

All three ISINs carry **ACTIVE** listings on both NSE and BSE in the current P04 master, so each issue is
purely the company-ID rename. Substituting the current companyId with the same ISIN, series and provider
ID resolves all six (verified: each returns `RESOLVED` with the recorded `dhanSecurityId`).

**This correction must not be applied silently.** It is an owner-visible change to the probe set and is
listed as decision D2 in §9.

### 3.4 Complete sample table **[R]**

Every row below was resolved against the registry the daemon actually loads at `84e988b`
(`loadGovernedP7InstrumentRegistry()`, 4,680 mappings) — not against the historical manifest.

Columns: **resolves now** is the runtime exact-identity result today; **P04 companyId now** shows the
current master's company for that ISIN, bolded where it differs from the recorded ID.

| # | companyId (as recorded) | exch | segment | series | Dhan security ID | canonical identity | resolves now | P04 companyId now |
|---|---|---|---|---|---|---|---|---|
| 1 | `EQ_BEL_IN` | BSE | BSE_EQ | A | `500049` | `ISIN:INE263A01024:A` | RESOLVED | EQ_BEL_IN |
| 2 | `EQ_CIPLA_IN` | BSE | BSE_EQ | A | `500087` | `ISIN:INE059A01026:A` | RESOLVED | EQ_CIPLA_IN |
| 3 | `EQ_SBIN_IN` | BSE | BSE_EQ | A | `500112` | `ISIN:INE062A01020:A` | RESOLVED | EQ_SBIN_IN |
| 4 | `EQ_TITAN_IN` | BSE | BSE_EQ | A | `500114` | `ISIN:INE280A01028:A` | RESOLVED | EQ_TITAN_IN |
| 5 | `EQ_HDFCBANK_IN` | BSE | BSE_EQ | A | `500180` | `ISIN:INE040A01034:A` | RESOLVED | EQ_HDFCBANK_IN |
| 6 | `EQ_HEROMOTOCO_IN` | BSE | BSE_EQ | A | `500182` | `ISIN:INE158A01026:A` | RESOLVED | EQ_HEROMOTOCO_IN |
| 7 | `EQ_AGI_IN` | BSE | BSE_EQ | B | `500187` | `ISIN:INE415A01038:B` | RESOLVED | EQ_AGI_IN |
| 8 | `EQ_INFY_IN` | BSE | BSE_EQ | A | `500209` | `ISIN:INE009A01021:A` | RESOLVED | EQ_INFY_IN |
| 9 | `EQ_JSWSTEEL_IN` | BSE | BSE_EQ | A | `500228` | `ISIN:INE019A01038:A` | RESOLVED | EQ_JSWSTEEL_IN |
| 10 | `EQ_TRENT_IN` | BSE | BSE_EQ | A | `500251` | `ISIN:INE849A01020:A` | RESOLVED | EQ_TRENT_IN |
| 11 | `EQ_GRASIM_IN` | BSE | BSE_EQ | A | `500300` | `ISIN:INE047A01021:A` | RESOLVED | EQ_GRASIM_IN |
| 12 | `EQ_ONGC_IN` | BSE | BSE_EQ | A | `500312` | `ISIN:INE213A01029:A` | RESOLVED | EQ_ONGC_IN |
| 13 | `EQ_RELIANCE_IN` | BSE | BSE_EQ | A | `500325` | `ISIN:INE002A01018:A` | RESOLVED | EQ_RELIANCE_IN |
| 14 | `EQ_HINDALCO_IN` | BSE | BSE_EQ | A | `500440` | `ISIN:INE038A01020:A` | RESOLVED | EQ_HINDALCO_IN |
| 15 | `EQ_TATASTEEL_IN` | BSE | BSE_EQ | A | `500470` | `ISIN:INE081A01020:A` | RESOLVED | EQ_TATASTEEL_IN |
| 16 | `EQ_LT_IN` | BSE | BSE_EQ | A | `500510` | `ISIN:INE018A01030:A` | RESOLVED | EQ_LT_IN |
| 17 | `EQ_BPCL_IN` | BSE | BSE_EQ | A | `500547` | `ISIN:INE029A01011:A` | RESOLVED | EQ_BPCL_IN |
| 18 | `EQ_TATAMOTORS_IN` | BSE | BSE_EQ | A | `500570` | `ISIN:INE155A01022:A` | **UNRESOLVED** (UNMAPPED_COMPANY_ID) | **EQ_TMPV_IN** |
| 19 | `EQ_HINDUNILVR_IN` | BSE | BSE_EQ | A | `500696` | `ISIN:INE030A01027:A` | RESOLVED | EQ_HINDUNILVR_IN |
| 20 | `EQ_NESTLEIND_IN` | BSE | BSE_EQ | A | `500790` | `ISIN:INE239A01024:A` | RESOLVED | EQ_NESTLEIND_IN |
| 21 | `EQ_TATACONSUM_IN` | BSE | BSE_EQ | A | `500800` | `ISIN:INE192A01025:A` | RESOLVED | EQ_TATACONSUM_IN |
| 22 | `EQ_ASIANPAINT_IN` | BSE | BSE_EQ | A | `500820` | `ISIN:INE021A01026:A` | RESOLVED | EQ_ASIANPAINT_IN |
| 23 | `EQ_BRITANNIA_IN` | BSE | BSE_EQ | A | `500825` | `ISIN:INE216A01030:A` | RESOLVED | EQ_BRITANNIA_IN |
| 24 | `EQ_ITC_IN` | BSE | BSE_EQ | A | `500875` | `ISIN:INE154A01025:A` | RESOLVED | EQ_ITC_IN |
| 25 | `EQ_EICHERMOT_IN` | BSE | BSE_EQ | A | `505200` | `ISIN:INE066A01021:A` | RESOLVED | EQ_EICHERMOT_IN |
| 26 | `EQ_WIPRO_IN` | BSE | BSE_EQ | A | `507685` | `ISIN:INE075A01022:A` | RESOLVED | EQ_WIPRO_IN |
| 27 | `EQ_APOLLOHOSP_IN` | BSE | BSE_EQ | A | `508869` | `ISIN:INE437A01024:A` | RESOLVED | EQ_APOLLOHOSP_IN |
| 28 | `EQ_ADANIENT_IN` | BSE | BSE_EQ | A | `512599` | `ISIN:INE423A01024:A` | RESOLVED | EQ_ADANIENT_IN |
| 29 | `EQ_SUNPHARMA_IN` | BSE | BSE_EQ | A | `524715` | `ISIN:INE044A01036:A` | RESOLVED | EQ_SUNPHARMA_IN |
| 30 | `EQ_ICICIBANK_IN` | BSE | BSE_EQ | A | `532174` | `ISIN:INE090A01021:A` | RESOLVED | EQ_ICICIBANK_IN |
| 31 | `EQ_INDUSINDBK_IN` | BSE | BSE_EQ | A | `532187` | `ISIN:INE095A01012:A` | RESOLVED | EQ_INDUSINDBK_IN |
| 32 | `EQ_AXISBANK_IN` | BSE | BSE_EQ | A | `532215` | `ISIN:INE238A01034:A` | RESOLVED | EQ_AXISBANK_IN |
| 33 | `EQ_BHARTIARTL_IN` | BSE | BSE_EQ | A | `532454` | `ISIN:INE397D01024:A` | RESOLVED | EQ_BHARTIARTL_IN |
| 34 | `EQ_DIVISLAB_IN` | BSE | BSE_EQ | A | `532488` | `ISIN:INE361B01024:A` | RESOLVED | EQ_DIVISLAB_IN |
| 35 | `EQ_MARUTI_IN` | BSE | BSE_EQ | A | `532500` | `ISIN:INE585B01010:A` | RESOLVED | EQ_MARUTI_IN |
| 36 | `EQ_ULTRACEMCO_IN` | BSE | BSE_EQ | A | `532538` | `ISIN:INE481G01011:A` | RESOLVED | EQ_ULTRACEMCO_IN |
| 37 | `EQ_TCS_IN` | BSE | BSE_EQ | A | `532540` | `ISIN:INE467B01029:A` | RESOLVED | EQ_TCS_IN |
| 38 | `EQ_NTPC_IN` | BSE | BSE_EQ | A | `532555` | `ISIN:INE733E01010:A` | RESOLVED | EQ_NTPC_IN |
| 39 | `EQ_TECHM_IN` | BSE | BSE_EQ | A | `532755` | `ISIN:INE669C01036:A` | RESOLVED | EQ_TECHM_IN |
| 40 | `EQ_POWERGRID_IN` | BSE | BSE_EQ | A | `532898` | `ISIN:INE752E01010:A` | RESOLVED | EQ_POWERGRID_IN |
| 41 | `EQ_ADANIPORTS_IN` | BSE | BSE_EQ | A | `532921` | `ISIN:INE742F01042:A` | RESOLVED | EQ_ADANIPORTS_IN |
| 42 | `EQ_BAJAJ-AUTO_IN` | BSE | BSE_EQ | A | `532977` | `ISIN:INE917I01010:A` | **UNRESOLVED** (UNMAPPED_COMPANY_ID) | **EQ_BAJAJAUTO_IN** |
| 43 | `EQ_BAJAJFINSV_IN` | BSE | BSE_EQ | A | `532978` | `ISIN:INE918I01026:A` | RESOLVED | EQ_BAJAJFINSV_IN |
| 44 | `EQ_COALINDIA_IN` | BSE | BSE_EQ | A | `533278` | `ISIN:INE522F01014:A` | RESOLVED | EQ_COALINDIA_IN |
| 45 | `EQ_AIIL_IN` | BSE | BSE_EQ | A | `539177` | `ISIN:INE206F01022:A` | RESOLVED | EQ_AIIL_IN |
| 46 | `EQ_LTIM_IN` | BSE | BSE_EQ | A | `540005` | `ISIN:INE214T01019:A` | **UNRESOLVED** (UNMAPPED_COMPANY_ID) | **EQ_LTM_IN** |
| 47 | `EQ_SBILIFE_IN` | BSE | BSE_EQ | A | `540719` | `ISIN:INE123W01016:A` | RESOLVED | EQ_SBILIFE_IN |
| 48 | `EQ_HDFCLIFE_IN` | BSE | BSE_EQ | A | `540777` | `ISIN:INE795G01014:A` | RESOLVED | EQ_HDFCLIFE_IN |
| 49 | `EQ_BHARTIARTL_IN` | NSE | NSE_EQ | EQ | `10604` | `ISIN:INE397D01024:EQ` | RESOLVED | EQ_BHARTIARTL_IN |
| 50 | `EQ_DIVISLAB_IN` | NSE | NSE_EQ | EQ | `10940` | `ISIN:INE361B01024:EQ` | RESOLVED | EQ_DIVISLAB_IN |
| 51 | `EQ_MARUTI_IN` | NSE | NSE_EQ | EQ | `10999` | `ISIN:INE585B01010:EQ` | RESOLVED | EQ_MARUTI_IN |
| 52 | `EQ_LT_IN` | NSE | NSE_EQ | EQ | `11483` | `ISIN:INE018A01030:EQ` | RESOLVED | EQ_LT_IN |
| 53 | `EQ_ULTRACEMCO_IN` | NSE | NSE_EQ | EQ | `11532` | `ISIN:INE481G01011:EQ` | RESOLVED | EQ_ULTRACEMCO_IN |
| 54 | `EQ_TCS_IN` | NSE | NSE_EQ | EQ | `11536` | `ISIN:INE467B01029:EQ` | RESOLVED | EQ_TCS_IN |
| 55 | `EQ_NTPC_IN` | NSE | NSE_EQ | EQ | `11630` | `ISIN:INE733E01010:EQ` | RESOLVED | EQ_NTPC_IN |
| 56 | `EQ_JSWSTEEL_IN` | NSE | NSE_EQ | EQ | `11723` | `ISIN:INE019A01038:EQ` | RESOLVED | EQ_JSWSTEEL_IN |
| 57 | `EQ_GRASIM_IN` | NSE | NSE_EQ | EQ | `1232` | `ISIN:INE047A01021:EQ` | RESOLVED | EQ_GRASIM_IN |
| 58 | `EQ_HDFCBANK_IN` | NSE | NSE_EQ | EQ | `1333` | `ISIN:INE040A01034:EQ` | RESOLVED | EQ_HDFCBANK_IN |
| 59 | `EQ_HEROMOTOCO_IN` | NSE | NSE_EQ | EQ | `1348` | `ISIN:INE158A01026:EQ` | RESOLVED | EQ_HEROMOTOCO_IN |
| 60 | `EQ_TECHM_IN` | NSE | NSE_EQ | EQ | `13538` | `ISIN:INE669C01036:EQ` | RESOLVED | EQ_TECHM_IN |
| 61 | `EQ_HINDALCO_IN` | NSE | NSE_EQ | EQ | `1363` | `ISIN:INE038A01020:EQ` | RESOLVED | EQ_HINDALCO_IN |
| 62 | `EQ_HINDUNILVR_IN` | NSE | NSE_EQ | EQ | `1394` | `ISIN:INE030A01027:EQ` | RESOLVED | EQ_HINDUNILVR_IN |
| 63 | `EQ_AGI_IN` | NSE | NSE_EQ | EQ | `1412` | `ISIN:INE415A01038:EQ` | RESOLVED | EQ_AGI_IN |
| 64 | `EQ_POWERGRID_IN` | NSE | NSE_EQ | EQ | `14977` | `ISIN:INE752E01010:EQ` | RESOLVED | EQ_POWERGRID_IN |
| 65 | `EQ_ADANIPORTS_IN` | NSE | NSE_EQ | EQ | `15083` | `ISIN:INE742F01042:EQ` | RESOLVED | EQ_ADANIPORTS_IN |
| 66 | `EQ_APOLLOHOSP_IN` | NSE | NSE_EQ | EQ | `157` | `ISIN:INE437A01024:EQ` | RESOLVED | EQ_APOLLOHOSP_IN |
| 67 | `EQ_INFY_IN` | NSE | NSE_EQ | EQ | `1594` | `ISIN:INE009A01021:EQ` | RESOLVED | EQ_INFY_IN |
| 68 | `EQ_ITC_IN` | NSE | NSE_EQ | EQ | `1660` | `ISIN:INE154A01025:EQ` | RESOLVED | EQ_ITC_IN |
| 69 | `EQ_BAJAJ-AUTO_IN` | NSE | NSE_EQ | EQ | `16669` | `ISIN:INE917I01010:EQ` | **UNRESOLVED** (UNMAPPED_COMPANY_ID) | **EQ_BAJAJAUTO_IN** |
| 70 | `EQ_BAJAJFINSV_IN` | NSE | NSE_EQ | EQ | `16675` | `ISIN:INE918I01026:EQ` | RESOLVED | EQ_BAJAJFINSV_IN |
| 71 | `EQ_LTIM_IN` | NSE | NSE_EQ | EQ | `17818` | `ISIN:INE214T01019:EQ` | **UNRESOLVED** (UNMAPPED_COMPANY_ID) | **EQ_LTM_IN** |
| 72 | `EQ_NESTLEIND_IN` | NSE | NSE_EQ | EQ | `17963` | `ISIN:INE239A01024:EQ` | RESOLVED | EQ_NESTLEIND_IN |
| 73 | `EQ_TRENT_IN` | NSE | NSE_EQ | EQ | `1964` | `ISIN:INE849A01020:EQ` | RESOLVED | EQ_TRENT_IN |
| 74 | `EQ_COALINDIA_IN` | NSE | NSE_EQ | EQ | `20374` | `ISIN:INE522F01014:EQ` | RESOLVED | EQ_COALINDIA_IN |
| 75 | `EQ_SBILIFE_IN` | NSE | NSE_EQ | EQ | `21808` | `ISIN:INE123W01016:EQ` | RESOLVED | EQ_SBILIFE_IN |
| 76 | `EQ_AIIL_IN` | NSE | NSE_EQ | EQ | `23553` | `ISIN:INE206F01022:EQ` | RESOLVED | EQ_AIIL_IN |
| 77 | `EQ_ASIANPAINT_IN` | NSE | NSE_EQ | EQ | `236` | `ISIN:INE021A01026:EQ` | RESOLVED | EQ_ASIANPAINT_IN |
| 78 | `EQ_ONGC_IN` | NSE | NSE_EQ | EQ | `2475` | `ISIN:INE213A01029:EQ` | RESOLVED | EQ_ONGC_IN |
| 79 | `EQ_ADANIENT_IN` | NSE | NSE_EQ | EQ | `25` | `ISIN:INE423A01024:EQ` | RESOLVED | EQ_ADANIENT_IN |
| 80 | `EQ_RELIANCE_IN` | NSE | NSE_EQ | EQ | `2885` | `ISIN:INE002A01018:EQ` | RESOLVED | EQ_RELIANCE_IN |
| 81 | `EQ_SBIN_IN` | NSE | NSE_EQ | EQ | `3045` | `ISIN:INE062A01020:EQ` | RESOLVED | EQ_SBIN_IN |
| 82 | `EQ_SUNPHARMA_IN` | NSE | NSE_EQ | EQ | `3351` | `ISIN:INE044A01036:EQ` | RESOLVED | EQ_SUNPHARMA_IN |
| 83 | `EQ_TATACONSUM_IN` | NSE | NSE_EQ | EQ | `3432` | `ISIN:INE192A01025:EQ` | RESOLVED | EQ_TATACONSUM_IN |
| 84 | `EQ_TATAMOTORS_IN` | NSE | NSE_EQ | EQ | `3456` | `ISIN:INE155A01022:EQ` | **UNRESOLVED** (UNMAPPED_COMPANY_ID) | **EQ_TMPV_IN** |
| 85 | `EQ_TATASTEEL_IN` | NSE | NSE_EQ | EQ | `3499` | `ISIN:INE081A01020:EQ` | RESOLVED | EQ_TATASTEEL_IN |
| 86 | `EQ_TITAN_IN` | NSE | NSE_EQ | EQ | `3506` | `ISIN:INE280A01028:EQ` | RESOLVED | EQ_TITAN_IN |
| 87 | `EQ_WIPRO_IN` | NSE | NSE_EQ | EQ | `3787` | `ISIN:INE075A01022:EQ` | RESOLVED | EQ_WIPRO_IN |
| 88 | `EQ_BEL_IN` | NSE | NSE_EQ | EQ | `383` | `ISIN:INE263A01024:EQ` | RESOLVED | EQ_BEL_IN |
| 89 | `EQ_HDFCLIFE_IN` | NSE | NSE_EQ | EQ | `467` | `ISIN:INE795G01014:EQ` | RESOLVED | EQ_HDFCLIFE_IN |
| 90 | `EQ_ICICIBANK_IN` | NSE | NSE_EQ | EQ | `4963` | `ISIN:INE090A01021:EQ` | RESOLVED | EQ_ICICIBANK_IN |
| 91 | `EQ_INDUSINDBK_IN` | NSE | NSE_EQ | EQ | `5258` | `ISIN:INE095A01012:EQ` | RESOLVED | EQ_INDUSINDBK_IN |
| 92 | `EQ_BPCL_IN` | NSE | NSE_EQ | EQ | `526` | `ISIN:INE029A01011:EQ` | RESOLVED | EQ_BPCL_IN |
| 93 | `EQ_BRITANNIA_IN` | NSE | NSE_EQ | EQ | `547` | `ISIN:INE216A01030:EQ` | RESOLVED | EQ_BRITANNIA_IN |
| 94 | `EQ_AXISBANK_IN` | NSE | NSE_EQ | EQ | `5900` | `ISIN:INE238A01034:EQ` | RESOLVED | EQ_AXISBANK_IN |
| 95 | `EQ_CIPLA_IN` | NSE | NSE_EQ | EQ | `694` | `ISIN:INE059A01026:EQ` | RESOLVED | EQ_CIPLA_IN |
| 96 | `EQ_EICHERMOT_IN` | NSE | NSE_EQ | EQ | `910` | `ISIN:INE066A01021:EQ` | RESOLVED | EQ_EICHERMOT_IN |

---

## 4. The wrong-ID control

### 4.1 Design constraint that must be accepted first **[R]**

The natural control — "send a plausible but wrong Dhan security ID" — **cannot be constructed through
the governed surface.** Every path into a vendor request resolves `(companyId, exchangeSegment, ISIN,
series)` to a provider ID from the registry first:

| Stage | Behaviour |
| --- | --- |
| `POST /v1/quotes` | requires `companyId` + canonical `securityId` (`ISIN:<isin>:<series>`); malformed → `400 MALFORMED_REQUEST` |
| `DhanMarketDataService.getQuote` | resolves exact identity **before any provider call**; unresolved → no request |
| `resolveExactIdentity` | registry lookup by `(companyId, segment, isin, series)`; miss → `UNRESOLVED_INSTRUMENT` |
| `buildQuoteRequestBody` | rejects non-canonical/unsafe IDs with `TypeError` → `MALFORMED_INSTRUMENT_MAPPING`; no request |

The provider ID is **never caller-supplied**. A wrong ID can therefore only enter by *corrupting the
registry*, which is out of scope for an operator acceptance.

**Executed confirmation** (against the built code at `84e988b`):

```text
CONTROL-A: Reliance ISIN+EQ, correct company        -> RESOLVED secId=2885
CONTROL-B: unknown company                          -> UNRESOLVED UNMAPPED_COMPANY_ID
CONTROL-C: Reliance ISIN wrong series (EQ->BE)      -> UNRESOLVED UNMAPPED_COMPANY_ID
CONTROL-D: Reliance company+EQ but different real ISIN -> UNRESOLVED UNMAPPED_COMPANY_ID
CONTROL-E: Reliance on wrong segment (NSE->BSE)     -> UNRESOLVED UNMAPPED_COMPANY_ID
```

Note that controls B–E all return the same coarse reason `UNMAPPED_COMPANY_ID`; the registry does not
distinguish "unknown company" from "wrong series for a known company" in the resolution reason.

### 4.2 Recommended control and its actual meaning

**Control input:** `companyId=EQ_RELIANCE_IN`, `securityId=ISIN:INE002A01018:BE`, `exchangeSegment=NSE_EQ`.

| Property | Value |
| --- | --- |
| Expected request-path behaviour | **Fail closed before vendor egress.** No HTTP request to Dhan. |
| IPD surface status | `502` with failure code `UNRESOLVED_INSTRUMENT`, `field: securityIdentity` |
| Vendor HTTP status | **none — nothing was sent** |
| What it proves | The governed boundary refuses to fabricate or guess a provider ID, and refuses to substitute a different series of the same company |
| What it does **not** prove | Anything about the vendor's own error taxonomy — see §4.4 |

### 4.3 Classification of the four requested failure classes

| Class | Reachable from the governed surface? | Where it would appear |
| --- | --- | --- |
| `UNRESOLVED_INSTRUMENT` | **Yes** — §4.2 control, and the 6 stale rows in §3.3 | IPD `502`, `failure.code=UNRESOLVED_INSTRUMENT`, no vendor call |
| HTTP 400 / `DH-905` | **Not by a wrong ID.** A 400 is `mapHttpStatus` → `HTTP_ERROR` with `httpStatus: 400`; the vendor's *body* (and therefore `DH-905`) is **discarded** | `HTTP_ERROR` + numeric status only |
| HTTP 404 / `UNKNOWN_INSTRUMENT` | **Not reachable by a wrong ID** under the assumption that the vendor returns a per-item error inside a 200 | `INSTRUMENT_NOT_IN_RESPONSE` (`selectDhanQuote`) if the block/item is absent |
| Wrong security-ID echo / identity mismatch | **Partially detected.** The response is indexed by the *requested* ID (`data[segment][securityId]`); a response item echoing a *different* ID is simply not found → `INSTRUMENT_NOT_IN_RESPONSE` | `INSTRUMENT_NOT_IN_RESPONSE` |

Three findings follow, and all three are **gaps relative to the E4 objective**, recorded in §10:

- **G1 — vendor error taxonomy is not retained.** `executeJsonPost` returns on non-2xx without parsing
  or retaining the body (D-7 disclosure policy). So `DH-905`, `UNKNOWN_INSTRUMENT` and any vendor
  message cannot be captured as evidence. E4 can record the *numeric* status and IPD's category, not
  the vendor's code.
- **G2 — echo mismatch is indistinguishable from absence.** A response that returns a *different*
  instrument's data is reported as `INSTRUMENT_NOT_IN_RESPONSE`, exactly as if nothing were returned.
  There is no "returned the wrong instrument" classification.
- **G3 — no cross-check that the returned quote belongs to the requested instrument.** §5.5 proposes a
  value cross-check that compensates for this at the evidence layer (it cannot fix the code).

### 4.4 If the objective is genuinely to test vendor wrong-ID handling

Then the control must be issued **outside** the governed surface (e.g. a direct authenticated call to
the vendor with a hand-built body). That is **not** IPD's governed path, does not exercise IPD's
implementation, and would need its own authorization and its own disclosure review. It is **not
recommended** and is **not** proposed here. The owner must accept §4.2 as the control's meaning.

---

## 5. Assessment of the IPD quote execution path

Each finding is stated with what actually implements it and what test covers it.

### 5.1 Endpoint and routing **[R]**

| Layer | Implementation |
| --- | --- |
| Vendor endpoint | `POST /marketfeed/quote` — `DHAN_MARKET_QUOTE_PATH`, `dhan_api_client.ts:113` |
| Daemon route | `POST /v1/quotes` — `MARKET_DATA_ROUTES.quotes`, `dhan_market_data_http.ts:67` |
| Request contract | `{ companyId, securityId: 'ISIN:<isin>:<series>', exchangeSegment? }` |
| Bind policy | loopback-only enforced in the `listen` wrapper; a non-loopback host throws (`dhan_market_data_http.ts:~590`) |
| Transport auth | bearer `IIPS_MARKET_DATA_TRANSPORT_TOKEN` on the loopback surface |

### 5.2 Numeric serialization **[R]**

`buildQuoteRequestBody` converts the stored string to a JSON number at the vendor boundary only; the
registry keeps strings. Proven link to the vendor's HTTP 200 in
`DHAN-W12-PR176-SERIALIZATION-VERIFICATION-2026-11-23.md` §6. Covered by
`tests/dhan_quote_numeric_serialization.test.ts` (3 tests, numeric `typeof` asserted).

### 5.3 Batching **[R]**

**One instrument per vendor request.** `getQuote` calls `orchestrator.refresh([scope])` with a single
scope (`dhan_market_data_service.ts:803`), so 96 distinct instruments means **96 vendor requests**, not
one batched request — which is why the "97 requests" figure in the task matches the implementation rather
than overstating it. The builder *can* accept many instruments (`{"NSE_EQ":[2885,11536],"BSE_EQ":[500325]}`)
and groups/dedupes correctly, but the service does not currently exercise that path.

**Consequence for E4:** the probe count and the vendor-request count are the same number, which makes the
rate-limit budget in §5.4 directly material.

### 5.4 Rate limiting, concurrency, retry, pacing **[R]**

| Control | Default | Source |
| --- | --- | --- |
| Rate limiter | **60 requests / 60 s** shared bucket, per service instance | `dhan_market_data_service.ts:724` |
| On throttle | `observeThrottle` honours `Retry-After`; blocked until then | `dhan_operational_controls.ts:234` |
| Concurrency | **8** in flight | `dhan_market_data_service.ts:725` |
| Coalescing | identical scope in flight is de-duplicated | `DhanRequestCoalescer` |
| Retry | bounded, `maxAttempts` **3**, exponential backoff + jitter | `dhan_operational_controls.ts:328` |
| Retried classes | `RATE_LIMITED`, `TIMEOUT`, `TRANSPORT_FAILURE`, `HTTP_ERROR` **≥ 500** | `isTransientFailure` |
| **Never retried** | `UNRESOLVED_INSTRUMENT`, `AUTHENTICATION_FAILURE`, `HTTP_ERROR` 4xx | asserted in P4-10 |
| Cache | 256-entry LRU; `CURRENT` within the D01 15-min freshness window → `SKIPPED_FRESH`, **no vendor call** | `DhanBoundedCache.classify` |

**Two material consequences for a 97-probe run:**

1. **Retry multiplies vendor requests.** A 4xx is never retried (good), but a 429 or 5xx can turn one
   probe into up to 3 vendor requests. **The 97-request budget is a best case, not a bound.** The worst
   case at `maxAttempts: 3` is 291 vendor requests.
2. **Caching can silently suppress probes.** If the daemon has served a recent quote for an instrument,
   a subsequent E4 probe returns `SKIPPED_FRESH` **without contacting the vendor**, and the evidence
   would then describe a cache hit, not a live qualification. E4 must start from a **cold cache** (fresh
   daemon) or each probe must be shown to have caused a vendor request. This is G4 in §10 and is a
   hard prerequisite in §7.

All four controls are covered by `tests/dhan_p4_operational_controls.test.ts` (P4-06 rate limiter,
P4-07 concurrency, P4-08 coalescing, P4-10 retry, P4-11 freshness).

### 5.5 Response normalization and the canonical envelope **[R]**

`selectDhanQuote` indexes the vendor payload by segment and the *requested* security ID; absence is
explicit `INSTRUMENT_NOT_IN_RESPONSE`, never a default. Normalization produces the canonical
`D01_QUOTES` envelope with `lineageHash`, `asOf`, `receivedAt`, `evaluatedAt`, `qualityState`,
`freshness`, `dataVersion` (`dhan_normalizer.ts`). Structural consistency of a real envelope was
independently re-derived in the Reliance acceptance §5.2.

**Value cross-check for E4 (§5.5 of the requirement).** The envelope alone does not prove the vendor
returned *that* instrument's data (G3). The proposed independent check is:

- the **`symbol`** in the envelope, compared against the P04 listing's symbol for that company/exchange;
- **`ltp`/`close`/`previousClose`/`volume`** compared against a second, separately-sourced observation
  of the same instrument (a recorded session snapshot), not against another IPD call;
- the **`asOf`** placed inside the recorded session window rather than merely "recent".

Without a second independent source, E4 can assert *internal consistency*, not *correct-instrument
correctness*. **No such second source is currently retained in this repository** — this is G5.

### 5.6 Diagnostics and evidence capture **[R]**

| Mechanism | Availability |
| --- | --- |
| `GET /v1/health`, `GET /v1/diagnostics` | counters, state vocabulary, latency, mapping count — **counts only** per D-7 §4.1 |
| Provider state recorder | last failure **category**, last-success timestamp, latency |
| D-18 depth capture (one-shot) | writes the raw `depth` block for **one explicitly configured instrument** (segment + Dhan security ID via `IIPS_DHAN_DEPTH_CAPTURE_SEGMENT` / `IIPS_DHAN_DEPTH_CAPTURE_SECURITY_ID`) to a path set by `IIPS_DHAN_DEPTH_CAPTURE_PATH`; temporary, observational; fails safe without valid target config |
| Request bodies | **not persisted**; the numeric body is asserted only in tests |
| Vendor response bodies (non-2xx) | **discarded by policy** |

**Gap G6:** there is **no per-probe evidence recorder** that captures (redacted request, HTTP status,
envelope, classification) for a 97-request sweep. One-shot depth capture exists for one explicitly configured instrument at a time (configurable; no code change required).
Producing E4 evidence today would mean 96 manual operator captures or a new writer.

---

## 6. Repository-verifiable facts vs operator-controlled facts

### 6.1 Verifiable in this repository **[R]**

| # | Fact | Evidence |
| --- | --- | --- |
| R1 | Numeric serialization present and correct at `84e988b` | PR #176 verification §2–§3 |
| R2 | Wire body computed for all 90 resolving instruments | `evidence/dhan-w14-e4/e4-sample-reconciliation.json` (`quoteRequestBody`) |
| R3 | 90/96 resolve; 6 fail on a company-ID rename, not on vendor data | §3.3 |
| R4 | All 96 ISINs are `ACTIVE` in P04 on their recorded exchange | P04 master; `listings[].status` |
| R5 | Wrong series / wrong company / wrong segment all fail closed before egress | §4.1 executed |
| R6 | A 4xx is never retried; 429/5xx up to 3 attempts | P4-10 |
| R7 | Rate limit 60/60 s, concurrency 8, cache 15-min | §5.4 |
| R8 | Vendor error bodies are not retained | `executeJsonPost`, D-7 §4.2 |
| R9 | Envelope carries `lineageHash`, `asOf`, `qualityState`, `freshness` | `dhan_normalizer.ts` |
| R10 | Loopback-only binding is enforced | `dhan_market_data_http.ts` listen wrapper |
| R10b | An authenticated `GET /v1/health` has returned HTTP 200 on the operator's host | operator evidence OP-3/OP-5, 2026-11-22, commit `0bb5072` (§6.2.1) |
| R10c | The daemon's startup line format accounts for the reported `listening on … vendorEgress=…` fragment | `formatDaemonStartupLine`, `dhan_local_daemon.ts`; `getVendorEgressMode()` (§6.2.1) |
| R11 | Targeted suites green at `84e988b`: 38 tests (numeric, P4 controls, D-7 conformance, offline 400 diagnostic, stage-1 wiring) — 0 failed, 0 skipped | this work item |

### 6.2 Operator-controlled evidence **[O]**

**None of the following can be established from source inspection or synthetic tests, and none may be
presented as live-runtime readiness.** What *is* available is recorded operator evidence for five of the
eight items, spanning the 22–23 November sessions. It is classified below rather than being requested again.

> **Scope note.** This section concerns **readiness evidence only**. It is not a decision to execute the
> E4 sweep, and nothing here authorises one. Sweep execution remains a **separate authorisation** (D1–D6,
> §9) and is tracked independently of the O-item classifications below.

> **Three-way distinction used throughout.** Every item is classified on three separate questions, and
> the three answers are never merged:
> **(a) satisfied historically** — the requirement is met by a recorded event;
> **(b) not captured in the historical transcript** — the event happened but a specific field is absent;
> **(c) must come from the current running process** — only a fresh capture can establish it.
> An item can be (a) satisfied *and* still need (c) for a different field. Only (b) implies missing record
> content; only (c) implies a future capture, and (c) is never phrased as a repeat of an (a) check.

#### 6.2.1 Evidence register (operator-supplied, 22–23 November 2026)

This evidence is **operator-held**. It is not present as a file in this repository — no 22- or
23-November managed-startup or session record is tracked here (verified: nothing under `docs/` or
`evidence/` mentions the PIDs `13768`/`16732`, the 09:54 UTC verification, the `8791` bind or the
`2026-11-23T14:55:08.861Z` expiry). It is recorded here as **operator-reported**, on the same basis as the
2026-11-18 Reliance acceptance record, with the provenance limit that the underlying terminal output is
not reproduced verbatim.

| Ref | Event as reported | When | Recorded artefacts |
| --- | --- | --- | --- |
| **OP-1** | Windows checkout confirmed at `H:\IIPS\iips-production-market-data`; `git rev-parse HEAD` returned `c7c726bc446a239c3f37c010a1f3b60cfc57b15b` | 2026-11-22 | HEAD SHA |
| **OP-2** | After fast-forward, HEAD returned `cbb116d2a221b82a704b4b96cf17efe0560e2498`; working tree clean | 2026-11-22 | HEAD SHA; clean-tree result |
| **OP-3** | Daemon-only restart succeeded; replacement PID `13768`; bound to `127.0.0.1:8791`; authenticated `/v1/health` returned **HTTP 200** | 2026-11-22 | PID; bind address; HTTP 200 |
| **OP-4** | Daemon stderr reported `listening on http://127.0.0.1:8791 … vendorEgress=IPD_SERVER_HTTPS` | 2026-11-22 | startup log line |
| **OP-5** | Authenticated `GET /v1/health` returned **HTTP 200** after the startup authentication-header correction, commit `0bb5072` | 2026-11-22 | HTTP 200 result |
| **OP-6** | Managed market-data daemon startup succeeded | 2026-11-23 | PID `16732`; PID manifest |
| **OP-7** | DPAPI credential verification: client ID and access token `PRESENT_OK`, readable, schema-valid, `aclOwnerOnly=yes`, `expired=no`; expiry `2026-11-23T14:55:08.861Z` | 2026-11-23 09:54 UTC | verification result |
| **OP-8** | Two live Dhan requests made | 2026-11-23 | operator confirmation only — no timestamps, session window or vendor `asOf` value preserved |

**Offline corroboration of the cited SHAs** (repository-side, no operator input):

| SHA | Verified in this repository | Lineage |
| --- | --- | --- |
| `c7c726bc446a239c3f37c010a1f3b60cfc57b15b` | `2026-11-20T17:45:17Z`, "Merge pull request #182…" | +46 ahead of the PR #176 merge `2685562`, `behind_by: 0` — so it **includes** the numeric-serialization fix |
| `cbb116d2a221b82a704b4b96cf17efe0560e2498` | `2026-11-22T04:06:17Z`, "Merge pull request #186…" | +67 ahead of `2685562`, `behind_by: 0`; and an ancestor of `84e988b` (+10, `behind_by: 0`) |
| `0bb5072df82ed6f44a2cb175ff5a79278c9183e8` | `2026-11-22T20:35:47Z`, "fix(windows-setup): authenticate the market-data health probe…" | the authentication-header correction referenced by OP-5 |

**Structural corroboration of OP-4.** The reported stderr fragment matches the daemon's own startup-line
format exactly — `formatDaemonStartupLine` (`src/providers/dhan/dhan_local_daemon.ts`) emits
`` `[ipd-market-data-daemon] listening on ${baseUrl} (… vendorEgress=${vendorEgressMode} …)` ``. The
`vendorEgress=IPD_SERVER_HTTPS` token is `DhanVendorEgressMode`'s value for `vendorEgressMode`, produced by
`getVendorEgressMode()` when the transport is `DhanServerHttpsTransport`. This is consistency with the
implementation, **not** independent observation of the host.

#### 6.2.2 Per-item classification

Each row answers **(a) satisfied historically / (b) not captured / (c) needs the current process**
separately. "Complete" means *the field E4 needs is preserved in the record* — not that the check was not run.

| # | Requirement | (a) Satisfied historically | (b) Not captured in the transcript | (c) Must come from the current running process | Classification |
| --- | --- | --- | --- | --- | --- |
| **O1** | Running daemon version | **OP-1/OP-2** checkout HEAD `c7c726b` → `cbb116d`, clean tree; **OP-3** daemon-only restart PID `13768` succeeded; **OP-6** managed startup PID `16732` | The **running-process-to-checkout binding**: which SHA the daemon binary was built from, and `/v1/health` `buildCommit` / `dataVersion` | `HEAD` + `/v1/health` `buildCommit`/`dataVersion` **from one running process** | **PARTIAL** |
| **O2** | Actual endpoint and configuration | **OP-3** bound `127.0.0.1:8791`; **OP-4** stderr `vendorEgress=IPD_SERVER_HTTPS`; **OP-3/OP-5** authenticated `/v1/health` HTTP 200 | The full `/v1/diagnostics` response; the `IIPS_DHAN_DEPTH_CAPTURE_PATH` value | `/v1/diagnostics` from the running process (also confirms the depth-capture env) | **PARTIAL** — endpoint **and** vendor egress mode are **evidenced** |
| **O3** | Transport token usability | **OP-3 / OP-5** authenticated `GET /v1/health` HTTP 200, 2026-11-22, after `0bb5072` | — | Not required for the check itself. A future session re-confirms token usability at sweep time | **PASS** (for that recorded check) |
| **O4** | Dhan credential readiness | **OP-7** `PRESENT_OK`, `aclOwnerOnly=yes`, `expired=no`, 2026-11-23 09:54 UTC | — | Current validity at sweep time; the verified token expires `2026-11-23T14:55:08.861Z` (daily rotation is normal and this expiry is **not** evidence of current failure) | **PASS at verification time** |
| **O5** | Market-session execution window | **OP-8** two live Dhan requests on 2026-11-23, operator-confirmed | Exact request timestamps, exchange-session window, vendor `asOf` | — (the historical window cannot be reconstructed after the fact) | **PARTIAL** |
| **O6** | Request budget and execution controls | none | — | Owner authorisation; not a host capture | **OUTSTANDING** |
| **O7** | Cold-cache proof | none | — | A fresh daemon for the sweep, or per-probe proof a vendor request occurred (§5.4) | **OUTSTANDING** |
| **O8** | Per-probe capture | none | — | The request/status/envelope records (§5.6, G6) | **OUTSTANDING** |

**Reading O2 correctly.** The endpoint (`127.0.0.1:8791`) and the vendor egress mode
(`IPD_SERVER_HTTPS`) are **evidenced**, not merely assumed. What is absent is the full `/v1/diagnostics`
response and the depth-capture environment value. O2 must therefore **not** be described as wholly
unevidenced: two of its three fields are (a)-satisfied.

**Reading O1 correctly.** Three startup events and two checkout revisions are evidenced. The gap is
specific and single: nothing in the transcripts ties the *running process* to the *checkout revision it was
built from*, nor records the health `buildCommit`/`dataVersion`. Note that both revisions are strictly
downstream of the PR #176 merge, so whichever was running carried the numeric serialization.

#### 6.2.3 Corrections applied across revisions of this document

Recorded so earlier text cannot be cited by mistake.

| Was | Why it was wrong | Now |
| --- | --- | --- |
| O1–O5 presented as a blanket of outstanding work | Recorded operator evidence exists for all five | Classified individually, §6.2.2 |
| O3 listed as if unperformed | Authenticated `GET /v1/health` HTTP 200 **already exists** (2026-11-22, `0bb5072`) | **PASS** |
| O4 described as `EXPIRED`, tying `2026-11-19T10:05:01.481Z` to credential *failure* | That expiry belongs to a **previous, rotated token**; a successful verification exists for 2026-11-23 09:54 UTC | **PASS at verification time** |
| O1/O2 presented flatly as outstanding | Managed startup (PID `16732`), an earlier daemon restart (PID `13768`), two checkout revisions, the `127.0.0.1:8791` bind **and** `vendorEgress=IPD_SERVER_HTTPS` are all evidenced | **PARTIAL**; O2's endpoint and egress fields are explicitly credited |
| O5 silent on live activity | Two live Dhan requests are operator-confirmed for 2026-11-23 | **PARTIAL** |
| "Eight operator items stand between this assessment and a defensible run" (§8) | Overstated: O3/O4 pass, O1/O2/O5 partial, only O6–O8 outstanding | §8 restated |

#### 6.2.4 What is genuinely still required

Split by the three-way distinction, so that nothing already evidenced is requested again.

**(c) Must be captured from the current running process — one transcript closes O1(c) and O2(c):**

- `HEAD` in the running checkout, the `/v1/health` `buildCommit` and `dataVersion`, the bound port, the
  full `/v1/diagnostics`, and whether `IIPS_DHAN_DEPTH_CAPTURE_PATH` is set — all **from the same live
  process**. This is a *currency* capture for the sweep, not a repeat of OP-1…OP-6, which already
  establish that startup, binding and egress mode work.

**(b) Not captured in the historical transcript — cannot be recovered after the fact:**

- **O5** — timestamps and vendor `asOf` for the two 2026-11-23 requests. The requests are confirmed to
  have happened; their placement inside an exchange session is not evidenced, and it cannot be
  reconstructed. A future session-verified request supplies it.

**(a) Not satisfied by anything — genuinely outstanding:**

- **O6** — authorised vendor-request ceiling (an owner decision, D4, not a host capture).
- **O7** — cold-cache proof.
- **O8** — per-probe capture.

---

## 7. E4 evidence specification (per probe)

For each of the **96 distinct instruments** (plus the control), the following must be captured. Items
marked **[gap]** need work in §10 before the sweep is executable.

| # | Evidence item | Source today | Status |
| --- | --- | --- | --- |
| E1 | **Redacted request** — method, path, `{companyId, exchangeSegment, securityId}` and the numeric wire body; headers reduced to names, never values | operator capture; body reproducible offline from the registry | **[gap]** no persisting recorder |
| E2 | **HTTP response** — IPD status, IPD failure code, and the vendor numeric status where surfaced | `sendError` body; diagnostics counters | partially available; vendor body unavailable by policy (G1) |
| E3 | **Daemon envelope** — full canonical `D01_QUOTES` envelope incl. `lineageHash`, `asOf`, `receivedAt`, `evaluatedAt`, `qualityState`, `freshness`, `dataVersion` | `POST /v1/quotes` 200 body | available |
| E4 | **Mapping disposition** — `RESOLVED` + `dhanSecurityId`, or `UNRESOLVED` + reason | offline pre-computation is already done (§3.4) | **available now** |
| E5 | **Independent value cross-check** — symbol match + second-source LTP/volume + `asOf` inside session | **no second source retained** | **[gap] G5** |
| E6 | **Failure classification** — one of `UNRESOLVED_INSTRUMENT` / `INSTRUMENT_NOT_IN_RESPONSE` / `HTTP_ERROR(4xx)` / `RATE_LIMITED` / `TIMEOUT` / `TRANSPORT_FAILURE` | `failure.code` | available, but vendor codes unreachable (G1) |

### 7.1 Zero-secret verification requirement (D-7)

D-7 §4.2 governs **every** surface and prohibits, in any form: secret values and **any prefix or
substring**; `vault://` references; carrier file names, paths or directories; secret-store metadata;
raw child-process output (byte count only); DPAPI ciphertext or any encoding; environment dumps and
exception messages that embed paths; credential material in argv, temp files or shell history.

D-7 §4.1's MAY list is **exhaustive** — anything not on it is prohibited. For E4 artifacts this means:

| Permitted in E4 evidence | Prohibited in E4 evidence |
| --- | --- |
| Counters, latency, failure **categories**, provider state names, `qualifiedMappingsLoaded` count | `Authorization` header value, bearer token, any prefix/substring |
| Endpoint host/port (loopback) | credential path, carrier file name, DPAPI blob |
| `lineageHash`, `asOf`, `qualityState`, `freshness`, numeric probe values | raw stderr/stdout from the credential tool (byte count only) |
| The **numeric** Dhan security ID and the wire body (business identifiers, not secrets) | vendor error bodies where D-7 policy discards them |

**Verification method for E4:** a mechanical scan of every captured artifact for (a) the transport token
substring, (b) the access-token substring, (c) the client-id substring, (d) `vault://`, (e) any path
fragment of the carrier directory — with a **negative control** proving the scanner fires on a seeded
canary. The scanner must be run by a tool that is itself given only a boolean/offset result, never the
secret. This must be **executed and evidenced**, not asserted. Covered by
`tests/dhan_d7_state_and_disclosure_conformance.test.ts` for the policy surface (8 tests, green), but
**no artifact-level scanner exists yet** — G7.

### 7.2 Existing mechanisms vs gaps

| Need | Existing mechanism | Gap |
| --- | --- | --- |
| Per-probe request/status/envelope | `POST /v1/quotes` response; `GET /v1/diagnostics` counters | **G6** — no sweep recorder |
| Vendor numeric status | `VENDOR_STATUS_BEARING_CODES` → `httpStatus` alongside IPD code | G1 — vendor body/code discarded |
| Depth/raw body for one instrument | D-18 one-shot capture | single instrument only |
| Disclosure conformance | D-7 conformance suite | **G7** — no artifact scanner |
| Offline body reproducibility | registry + `buildQuoteRequestBody` | none — already proven |

---

## 8. Readiness verdict

**Not ready to execute E4 — but not because O1–O5 are unmet.** Operator evidence exists for all five:
O3 and O4 **pass** as recorded, and O1, O2 and O5 are **partial** with specific fields absent from the
record (§6.2.2). The blockers are elsewhere.

What actually stands between this assessment and a defensible run differs by category:

| Category | Items | Position |
| --- | --- | --- |
| Operator readiness evidence | O3, O4 | **PASS** — recorded; not to be re-requested |
| Operator readiness evidence | O1, O2, O5 | **PARTIAL** — startup (2 PIDs), two checkout revisions, the `127.0.0.1:8791` bind, `vendorEgress=IPD_SERVER_HTTPS` and two live requests are **evidenced**; the running-process↔SHA binding, `/v1/diagnostics`, the depth-capture env and request timestamps are not |
| Operator readiness evidence | O6, O7, O8 | **OUTSTANDING** — no evidence recorded |
| Repository gaps | G1–G8 | see §10 |

**Blocking, and not resolvable by code:**

- **O7 — cache suppression.** Without a cold cache or per-probe request proof, a "successful" sweep could
  be a cache demonstration. This would make the whole E4 result unsound while appearing green.
- **O6 — request budget.** 97 requests is a best case; retries can triple it (§5.4). The ceiling is an
  owner authorisation, not a code property, and it must be set before the first probe.

**Blocking for the stated scope:** the sample is the superseded registry (§0, §3.3). The owner must
choose a scope in §9 before probes are issued.

**Explicitly *not* blocking:** O3 and O4. Both have recorded successful evidence. The 2026-11-23
credential verification passed at 09:54 UTC; its `2026-11-23T14:55:08.861Z` expiry is a forward-validity
boundary for a *future* sweep, not a current failure. A credential re-verification is required before any
sweep runs, but on the ordinary basis that token expiry must bound every capture — **not** because the
recorded evidence shows a failure.

---

## 9. Decisions required from the owner before execution

| ID | Decision | Options | Consequence |
| --- | --- | --- | --- |
| **D1** | Which sample? | (a) 96 as recorded, accepting 6 expected `UNRESOLVED_INSTRUMENT`; (b) 96 with the three companyIds corrected per §3.3 (90 probeable + 6 same instruments under current IDs = **96 probeable**); (c) a fresh sample drawn from the current 4,680-row registry | (a) produces 6 bookkeeping failures; (b) is faithful to the original intent; (c) is current but is no longer "the 96" |
| **D2** | Is the company-ID correction authorized? | yes / no | If no, D1(a) is forced and 6 failures are unexplainable to a reader who does not know about the rename |
| **D3** | Is the wrong-ID control §4.2 acceptable, given it never reaches the vendor? | accept / require vendor-level control (separate authorization) | §4.4 |
| **D4** | Request ceiling — 96, 97, or up to 291 with retries? | owner sets | §5.4; the budget is not self-enforcing |
| **D5** | Session window for execution | owner sets | O5 is **PARTIAL** (§6.2.2): two live requests are confirmed for 2026-11-23 but their timestamps and vendor `asOf` were not captured and cannot be reconstructed, so the *sweep* window is still unset |
| **D6** | Independent value cross-check source | supply a second source, or accept "internal consistency only" | G5 |

---

## 10. Outstanding technical gaps

| ID | Gap | Severity for E4 | Remedy |
| --- | --- | --- | --- |
| G1 | Vendor error bodies/codes discarded; `DH-905`, `UNKNOWN_INSTRUMENT` unreachable as evidence | medium — E4 can classify by numeric status only | would need a D-7 amendment; **not** proposed here |
| G2 | Wrong-instrument echo is indistinguishable from absence | medium | evidence-layer compensation (E5) |
| G3 | No proof the returned quote belongs to the requested instrument | **high** | requires G5 |
| G4 | Cache can suppress probes into `SKIPPED_FRESH` | **blocking** | cold-cache run or per-probe request proof (O7) |
| G5 | No second independent value source retained | **high** | owner supplies (D6) |
| G6 | No per-probe evidence recorder for a sweep | high | small writer or 96 operator captures |
| G7 | No artifact-level zero-secret scanner | medium | small scanner + seeded canary |
| G8 | Sample is the superseded registry | **blocking for stated scope** | D1/D2 |

---

## 11. Publication

| Item | Value |
| --- | --- |
| This assessment | `docs/integration/DHAN-W14-E4-READINESS-ASSESSMENT-2026-11-23.md` |
| Machine-readable reconciliation | `evidence/dhan-w14-e4/e4-sample-reconciliation.json` |
| Regenerator (offline, `--check` capable) | `scripts/dhan-w14-e4-reconcile.mjs` — reports the exact missing input instead of downloading the historical blob |
| Baseline verified | `84e988b092058df8075ffa52f5dfb0f4fef07eaf` |
| Branch | `arena/2c0f06ee-iips-production-market-data` |
| PR | #190 (open) — this document is added to the same PR |
| Historical sample blob | `50d9424af01527897df132a63f74d635286bfe9d`, SHA-256 `13bd2ef1…78bc`, both re-verified |
| Tests executed here | 38 targeted tests (numeric serialization, P4 operational controls, D-7 conformance, offline 400 diagnostic, stage-1 wiring) — **0 failed, 0 skipped** |

---

## 12. What this document does not claim

- It does **not** claim E4 is executed, partially executed, or scheduled.
- It does **not** claim live runtime readiness at `84e988b` — the only live evidence predates it.
- It does **not** claim vendor rate-limit tolerance, multi-instrument reliability or production readiness.
- It does **not** claim the vendor returns `DH-905` or `UNKNOWN_INSTRUMENT` — those are unverified
  names supplied with the task; §4.3 records that IPD cannot capture them.
- It does **not** modify credentials, configuration, the registry, the P04 master or any IRR file.

---

## 13. Related records

- [PR #176 numeric serialization verification and IRR handoff](DHAN-W12-PR176-SERIALIZATION-VERIFICATION-2026-11-23.md)
- [Live Reliance quote — operator acceptance](DHAN-LIVE-RELIANCE-QUOTE-OPERATOR-ACCEPTANCE-2026-11-18.md)
- [Numeric security-ID serialization — completion record](DHAN-QUOTE-NUMERIC-SERIALIZATION-COMPLETION-RECORD-2026-11-18.md)
- [P7 registry regeneration 2026-11-15](IIPS-W04-P7-REGISTRY-REGENERATION-2026-11-15.md) — superseded the 96-row manifest
- [W04 identity coverage revision 1](IIPS-W04-IDENTITY-COVERAGE-REVISION-1-EVIDENCE-ASSESSMENT-2026-11-13.md) — source of the 96/48/47/1 figures
- [D-7 provider state model and disclosure policy](DHAN-D7-PROVIDER-STATE-MODEL-AND-DIAGNOSTICS-POLICY-2026-11-12.md)
- [W-06 authentication failure investigation](DHAN-W06-AUTHENTICATION-FAILURE-INVESTIGATION-2026-11-13.md)
- [W-11 daemon configuration and operations](DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md)

---

*Readiness assessment only. No E4 sweep request, no credential access and no daemon start were performed by this work item. Operator-held session evidence for O1–O5 (2026-11-22/23) is incorporated and classified in §6.2 on an operator-reported basis; its underlying terminal output is not reproduced here, and the cited SHAs were independently verified against the repository. No production claim.*
