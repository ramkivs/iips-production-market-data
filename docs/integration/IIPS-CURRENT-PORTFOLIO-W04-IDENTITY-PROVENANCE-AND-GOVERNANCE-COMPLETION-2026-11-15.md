# W04 — Identity provenance, corporate-action coverage, eligible-scope pre-registration and identifier-supply dependency

**Date:** 15 November 2026. **Type:** read-only evidence assessment and governance record. Not a qualification, not an admission, not a Program Authority act, not an implementation, not a data change.
**Roadmap authority:** `docs/integration/IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md` (work item **W04**, and the W20 coverage methodology in section K).
**Scope:** discharge the five evidence/governance items left open by the prior W04 assessment — source/version provenance; the corporate-action coverage result; pre-registration of the eligible scope `E`; the identifier-supply dependency; and the updated W04 acceptance basis.

**Prior W04 assessment:** `docs/integration/IIPS-CURRENT-PORTFOLIO-W04-P04-D114-IDENTITY-SEMANTICS-AND-COVERAGE-ACCEPTANCE-BASIS-2026-11-14.md` (published at `c1b1ed8`). Its semantic findings — that P04 and D114 are distinct, compatible identity layers, and that `THETA_I = NOT YET ESTABLISHED` — are **carried forward unchanged**. This document adds evidence and governance findings; it does not reopen the semantic reconciliation.

**Outcome in one line:** three of the five open items are now **substantially discharged from repository evidence** — the source/version provenance chain is reconstructed and reproducible, the corporate-action zero is **characterised** (an extract-content fact with a proven nil effect on the census, but an **unknown cause**), and the identifier-supply dependency has an **evidenced owner** and a localized root cause; but the eligible-scope rule `E` **cannot be pre-registered from the supplied evidence** and is recorded as an unresolved decision requiring Principal authority, so **W04 remains PARTIALLY COMPLETE** and **`THETA_I` remains NOT YET ESTABLISHED**.

---

## 1. Repositories and exact commits inspected

| Repository | Commit | Inspection mode |
|---|---|---|
| `ramkivs/iips-production-market-data` (IPD) | `c1b1ed80d65d351d19e8b692e0a3a921aae9af8c` (authoritative branch `arena/84d1e063-iips-production-market-data`) | Read-only, via a fresh single-branch clone at `/tmp/w04c`. The principal's own local checkout was **not** synchronized, switched, checked out, pulled, merged, rebased or reset. |
| `ramkivs/iips-review-recovered` (IRR) | `08411bcd6d782a601fe5c82cc9983d076831148d` (`main`) | Read-only, via the existing clone at `/tmp/irr-clone`. |

Remote state at inspection: IPD `main` = `a624d06f66c376f03a29571cb24c3f0f77f0c24d`; IPD authoritative branch remote head = `c1b1ed80d65d351d19e8b692e0a3a921aae9af8c`. IRR PR #563 remains **OPEN and unmerged** at head `87658602966cfedf98fa59a627807d160808f645`.

**No cross-repository write was made to IRR. No PR was merged. No portfolio data was mutated, re-cut or re-captured. No identifier was manufactured, inferred or enriched. No source file was created, substituted or edited. No W05–W20 work was started. No IRR code, contract, configuration or data was modified.**

---

## 2. Source and version provenance

### 2.1 What "the source" consists of — the identity-source layer is IRR-owned and operator-supplied

The W04 census resolves against **two separate master layers**, each with its own provenance. Neither is produced by IPD.

**Layer A — P04 / D05 Instrument-Security Master (IPD-owned, in-repo, fully versioned).**

This is the master the P04 issuer resolver uses. It is a *complete, governed, checksummed in-repository asset*, and its provenance is fully disclosed:

| Attribute | Value | Source |
|---|---|---|
| Domain | `D05_SECURITY_MASTER` — "Instrument / Security Master Canonical Contract" | `src/contracts/d05_security_master.ts:7` |
| Governing authority | `AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001` | `evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.manifest.json` |
| Canonical dataset asset | `src/identity/d05_authenticated_universe_data.ts` | IPD repository |
| **Master version / content checksum** | `sha256:b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4` | manifest `fileChecksumSha256`; asserted identically in the dataset asset header |
| **Record count** | **2,390** canonical entities | manifest `recordCount`; independently recounted from the JSON asset |
| Batch / deposition | `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`, kind `REPLACEMENT_DEPOSITION` | manifest |
| Deposition timestamp | `2026-11-08T04:56:19Z` | manifest `droppedAt` |
| Operator | `OPERATOR_ADMIN_GOVERNED_01` | manifest `operatorId` |
| Operating mode | `OFFLINE_BOOTSTRAP` | manifest |
| Selected tier | `TIER_2_ACTIVE_NSE_CM` | manifest |
| **Universe source of record** | "NSE CM EQ tier (`EQUITY_L(1).csv`, `series=EQ`, **2,390 rows**) as pinned in the Wave-3 EQ bundle" | manifest `universeSource.source` |
| Universe source bundle member | `01_source_material/NSE/EQUITY_L(1).csv`, member SHA-256 `da7eb83cf21156cca3a8bcc5b94ea55f825ff7348e02c89abc51658788361fa5` | manifest `universeSource` |
| Universe as-of | `2026-11-08` (one-time replacement act) | manifest `universeSource.asOf` |
| Governing input bundle | Wave-3 EQ bundle, SHA-256 `6332b050132a160e89e5906d131e12535ac1105d4b781330fa63f0e0af1d41f4` | manifest `inputs[0]` |
| Residual limitations | 8 disclosed items (MCA registry-match authenticity, taxonomy systematic-classification claim, uniform 0.05 tick regime, 100 NSE-exclusion dispositions, 58 blank-CIN exceptions, BSE export pinning/staleness, …) | manifest `residualLimitations` |

The 2,390 entities were independently recounted from `evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.json`: 2,390 unique `companyId`, 2,390 unique `isin`; listings per entity = {2: 2,290, 1: 100}; listing status by exchange = {NSE `ACTIVE`: 2,390, BSE `ACTIVE`: 2,290}. The 100 single-listing entities are the act-bound "UNLISTED-BSE governed exclusion" dispositions described in the manifest, **not** an assertion of permanent exclusivity.

**Independent verification of this provenance by the repository's own governed audit CLI.** `node scripts/d05_corpus_audit.mjs --corpus evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.json` (read-only; writes only to an output directory) independently confirms:

| Audit output | Value | Agreement |
|---|---|---|
| `input.sha256` | `b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4` | ✅ equals the manifest `fileChecksumSha256`, and equals the `sha256sum` of the deposit file |
| `input.recordCount` / `counts.records` | **2,390** | ✅ equals the manifest `recordCount` |
| `counts.distinctCompanyIds` / `distinctIsins` / `distinctNseSymbols` | 2,390 each | ✅ matches the manual recount |
| `distributions.listingStatus` | `ACTIVE`: 2,390 | ✅ |
| `CHECK-ISIN-SHAPE`, `CHECK-ISIN-LUHN` | PASS | ✅ all non-blank ISINs are ISO 6166 conformant |
| `CHECK-LISTINGS`, `CHECK-POSITIVITY`, `CHECK-EFFECTIVE-DATES` | PASS | ✅ |
| `CHECK-FIELD-COMPLETENESS`, `CHECK-UNIQUENESS` | **FAIL** | ⚠️ 60 CRITICAL + 34 WARNING findings — **all 60 criticals are the manifest's own disclosed exceptions**: 58 × `FIELD_MISSING` on `cin` (the disclosed 58 blank-CIN records) and 2 × the `UNLISTED-BSE` governed-exclusion marker appearing 100 times (the disclosed 100 NSE-exclusion records). **No new findings.** |

**One governance caveat that must travel with this version claim.** The same audit records the master's per-record origin classification as **`UNCLASSIFIED` for every one of the 2,390 records**, on PA decision `2026-10-19-01` C1–C3:

> *"Origin classification is UNCLASSIFIED for every record (PA decision 2026-10-19-01, C1–C3). A generator marker identifies algorithmically generated series; it is not an authenticity verdict either way, and 52 marker-free records are not issuer-verified. **ISIN checksum validity is a syntax property, not evidence.**"*

Consequently the D05 version `sha256:b555fd28…` is a **provenance-and-reproducibility claim** — a governed, checksummed, act-bound deposit with exact contents — and **not** a per-record authenticity attestation. The audit's 0 marker-bearing records mean "no algorithmic-series marker was found", which is expressly **not** an authenticity verdict in either direction. This is recorded here so the version claim is not over-read; it does not weaken the W04 census, whose rows are matched on supplied identifiers rather than on per-record origin classification.

**Layer B — D114 / IRR identity sources (IRR-owned, host-supplied, digest-versioned).**

| Attribute | Value | Source |
|---|---|---|
| Governing authority | None in repository. The files are read from a host directory and are classified `OPERATOR_SUPPLIED` by a **label heuristic** (see §2.4) | IRR `iips-platform/src/investment/identity/sources.ts:542-544` |
| Physical location | `${IIPS_DATA_DIR}/investment/identity/` | IRR `sources.ts:549-570` |
| File names (exact, exhaustive) | `eligible-roster.json`, `listing-map.json`, `corporate-actions.json` | IRR `sources.ts:550-570` |
| **Version identity mechanism** | Canonical-JSON SHA-256 content digest, emitted as `sha256:<hex>` | IRR `sources.ts:524-537`; `iips-platform/src/investment/fundamentals/canonical.ts:56-59` |
| Version fields | `rosterVersion` / `rosterDigest`, `listingMapVersion` / `listingMapDigest`, `corporateActionTableVersion` / `corporateActionTableDigest` | IRR `sources.ts:524-537` |
| **Roster version observed** | `sha256:4baa4e…` (truncated in the host evidence; full value not carried by the supplied record) | prior W04 assessment §5.2 |
| **Roster shape observed** | 2,388 issuers / 2,388 securities / 2,388 listings | prior W04 assessment §5.2 |
| **Listing-map version observed** | **NOT SUPPLIED** in the host evidence | prior W04 assessment §8 (W04-03) |
| **Corporate-action-table version observed** | **NOT SUPPLIED** in the host evidence | prior W04 assessment §8 (W04-03) |
| Corporate-action record count observed | **0** | prior W04 assessment §5.2 |

### 2.2 The version-disclosure gap is now **explained**, not merely recorded as missing

The prior assessment recorded the listing-map and corporate-action-table versions as undisclosed (W04-03). The mechanism behind that gap is now established:

**The IRR identity-coverage report publishes exactly five identity-source fields and no more.** IRR `iips-platform/src/investment/identity/coverage.ts:228-234` builds the `identitySources` block with `rosterVersion`, `listingMapVersion`, `corporateActionTableVersion`, `rosterLabel` and `rosterDataClass`. The census host read returned HTTP success with 64 rows, and the prior assessment recorded the **roster** version and classification from that block — which is consistent with the report carrying the listing-map and corporate-action versions in the *same* block.

**Therefore the listing-map and corporate-action-table versions were available in the served coverage report but were not carried into the published census record.** This is a **record-completeness gap in the W04 evidence capture**, not a source-side omission and not an unavailability of the data. The values are recoverable by re-reading the identity coverage endpoint for the same revision; they are simply absent from the artifact this assessment inherits.

This matters for closure: the fix for W04-03 is a **re-read of an endpoint that already serves the values**, not a new extract, not a new source holder, and not a code change. That is a materially lighter dependency than previously recorded.

**Independent corroboration that the report carries these fields** — the published IRR identity-coverage evidence for a *different* revision (IID-1, as-of 2026-11-05) prints all three versions together with the label and the data class:

```
rosterVersion: sha256:3d9dc6dbdd555a512340e8e69daa3314bb3ffb8645956ce18607e301e1428704
listingMapVersion: sha256:5800969c40aea76071cc1e28ac80709d77c9872058a1195e0265f4db7ed1d864
corporateActionTableVersion: sha256:3d37cc4d15a225900b8a3443b29d2a3d8be8f2effd425f3dd0835bbc3be8f242
rosterLabel: SYNTHETIC IID-1 reference roster (fixture; not real companies)
rosterDataClass: SYNTHETIC_FIXTURE
```

IRR `evidence/iid/IID-1-IDENTITY-COVERAGE-2026-11-05/coverage-summary.txt`.

**Explicit scope caution:** the digests above are from a **different, synthetic IID-1 fixture revision** and are recorded here only as *proof that the coverage report publishes all three version fields*. They are **not** the versions of the observed W04 revision and must not be substituted for them.

### 2.3 Can the 64-row census be tied to exact source and listing/series versions?

**Partially — and the tie is now stated precisely rather than asserted.**

| Question | Answer | Basis |
|---|---|---|
| Is the census tied to an exact **roster** version? | **Yes.** `sha256:4baa4e…`, class `OPERATOR_SUPPLIED`, 2,388/2,388/2,388. | prior W04 assessment §5.2; IRR coverage report field |
| Is the census tied to an exact **listing/series** version? | **No.** The `listingMapVersion` digest was not carried into the published record. | §2.2 |
| Is the census tied to an exact **security-master** version? | **Yes.** `sha256:b555fd28…`, 2,390 records, act `AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001`. | §2.1 Layer A |
| Is the census tied to an exact **issuer-master** version? | **Not applicable as a separate artifact.** | See §2.5 |
| Is the census tied to an exact **P07/Dhan instrument master** version? | **Yes, for the P04 path.** | §2.6 |

### 2.4 Governance weakness in `rosterDataClass` — stated, and *not* used to strengthen any conclusion

`OPERATOR_SUPPLIED` is **not** an attestation of source authority. IRR derives it as a fallback from a regex over a **free-text label the operator controls**:

```ts
rosterDataClass:
  texts.dataClass ??
  (/synthetic/i.test(roster.rosterLabel) ? 'SYNTHETIC_FIXTURE' : 'OPERATOR_SUPPLIED'),
```

IRR `iips-platform/src/investment/identity/sources.ts:542-544`. `rosterLabel` itself defaults to the string `'unnamed roster'` when absent (`sources.ts:293`).

Consequently a roster labelled anything not containing "synthetic" is classified `OPERATOR_SUPPLIED` **by default, with no verification of who supplied it or from what authority**. The classification is a *label-shaped proxy for a provenance claim*.

This is recorded as a **governance limitation on the evidence**, and it is used in this document only to **bound** claims — the W04 census relies on the roster's *content digest* for reproducibility, not on `OPERATOR_SUPPLIED` as proof of authority. No conclusion in this document is strengthened by that classification.

The same pattern appears in the financial-coverage disclosure path (`coverage.ts:106-111`), where `datasetClass` is likewise derived by regex over provider/licence text.

### 2.5 "Issuer master" — there is no separate issuer-master artifact; the issuer level lives inside the D05 master

The task asks for an "issuer-master version". Repository evidence establishes that **no separate issuer-master artifact exists**:

- The D05 contract is titled *"Instrument / Security Master Canonical Contract"* and its entity carries `companyId`, `isin`, `cin`, `companyName`, `listings[]` — the issuer identity attributes (`cin`, `companyName`) and the listing attributes are **fields of the same 2,390-record master**, not a second dataset (`src/contracts/d05_security_master.ts:11-39`).
- The manifest's `fieldBindings` confirms the issuer-level derivations are **act-bound to the same deposit**: `companyId` = *"D-4 (i) `EQ_<TOKEN>_IN` derivation from NSE listing master SYMBOL (uppercase alnum only); zero collisions"*; `cin` = *"arena_mca_identity_bridged.csv (published latest; verbatim, including blanks/exemptions/aliases; classes never misrepresented)"*.
- IRR's three-level identity model keeps issuer, security and listing as **distinct levels within one coordinated source set** (`iips-platform/src/investment/identity/types.ts:5-7` — *"Three identity levels, never conflated."*), not as three independently versioned datasets.

**Therefore the correct provenance statement is:** the issuer level is versioned by the **same** D05 master checksum `sha256:b555fd28…` (2,390 records), with its issuer-level fields governed by the same act and the same deposition timestamp. Recording a separate "issuer-master version" would misrepresent the architecture.

### 2.6 The P07/Dhan instrument master — the second P04 input, and the issuer-resolution root

P04 issuer resolution does not come from the IRR roster; it comes from the P07 Dhan instrument master resolved against the D05 master. Its provenance is fully recorded:

| Attribute | Value | Source |
|---|---|---|
| Artifact | Dhan public instrument-master CSV (`api-scrip-master-detailed.csv`, `api-scrip-master.csv`) | `evidence/dhan-p7/source-retrieval-manifest.json` |
| **Retrieval method** | "Official Dhan public instrument-master CSV" | manifest `retrievalMethod` |
| **Retrieved at (manifest)** | `2026-11-06T05:29:24.0292214Z` | manifest `retrievedAtUtc` |
| **Retrieved at (detailed file)** | `2026-11-06T05:27:53.7922492Z` | manifest `files[0].retrievedAtUtc` |
| **Retrieved at (base file)** | `2026-11-06T05:29:23.9190078Z` | manifest `files[1].retrievedAtUtc` |
| `api-scrip-master-detailed.csv` | SHA-256 `6F19FEB4ABD513843EAF2F139A27F17CCB660233F95AD385D11AA92C322A010D`, 36,992,630 B, **217,104 data rows** | manifest `files[0]` |
| `api-scrip-master.csv` | SHA-256 `4366E41B115B00B7A84225D3506A3DBB6EF483CB3BA4D32AD5F23D72E9EDCDDD`, 27,400,991 B, **217,104 data rows** | manifest `files[1]` |
| Source URLs | `https://images.dhan.co/api-data/api-scrip-master-detailed.csv`; `https://images.dhan.co/api-data/api-scrip-master.csv` | manifest `files[*].sourceUrl` |
| Publication as-of | **2026-11-06** (retrieval date; the vendor publishes no independent as-of field in the manifest) | manifest — **no publisher as-of is published; this is a stated limitation, not an inference** |

This is the **only** layer in the W04 chain that carries a *publication-side* timestamp.

**How the two layers combine (precise statement, verified in code).** The P04 resolver resolves a broker observation against the **governed D05 master** — `createGovernedBrokerObservationResolver` takes `getGovernedBroadSecurityMaster()` and hard-fails unless the master revision has `recordCount === 2390`, a 64-hex checksum and the exact authorization reference (`src/identity/broker_observation_resolver.ts:26-46`). The observation it resolves carries `symbol`, optional `isin` and optional `exchange` (`broker_observation_resolver.ts:7-11`).

The **P07 Dhan instrument master is the other governed input to the same identity chain**, and the repository records its role explicitly: `scripts/dhan-p7-qualify.mjs` *"verifies their SHA-256 against `source-retrieval-manifest.json`, parses detailed + compact masters … reconciles them, qualifies equity candidates against the authoritative governed P04 SecurityMaster"*. The service header states the chain directly: *"IRR holding input (ISIN + exchange) → P04 exact company correspondence + ACTIVE exchange listing → P7 vendor-master series evidence + qualification → D114 canonical identity (ISIN:\<isin\>:\<series\>)"* (`src/providers/dhan/dhan_security_identity_service.ts:8-12`). The **eight** qualification checks are spelled out at `dhan_security_identity_service.ts:101-109`: (1) ISIN present and syntactically valid (12-char D114 grammar); (2) **exact P04 ISIN correspondence** (`resolveCompanyId`); (3) P04 entity ISIN agrees with the input ISIN, no conflict; (4) **ACTIVE P04 listing on the specified exchange**; (5) **the P7 registry has an unambiguous mapping for (companyId, segment, ISIN)**; (6) the P7 mapping carries a canonical D114 `securityId` (series evidence); (7) the P7 mapping ISIN agrees with the input ISIN, no conflict; (8) source evidence is usable (`lastVerifiedAt` present on master rows). The header also states the boundary plainly: *"IRR is never modified: IRR supplies ISIN + exchange only; series resolution and canonical identity construction are IPD-owned"* (line 22-23), and that `isinAuthority` is preserved as **NON_AUTHORITATIVE** on every qualified identity (lines 17-20).

So the governed chain is: **P07 Dhan instrument master (ISIN/exchange/segment registry, versioned by digest) + P04/D05 security master (issuer `companyId` and listings, versioned by digest) → D114 qualified security identity.** The P07 digests are a **provenance fact about the identifier supply** that participates in qualification; they are not a separate runtime join performed by the P04 resolver.

### 2.7 The 2,388 vs 2,390 relationship — established, and explicitly **not** equated

The roster observed in the census has 2,388 issuers / 2,388 securities / 2,388 listings. The IPD D05 master has 2,390 entities. These are **different artifacts answering different questions**, and no repository artifact reconciles the two counts. The manifest's own figures show the numbers are drawn from **different underlying row populations**:

> *"lotSize: NSE listing master MARKET LOT (verbatim: **2,387 rows** at 1, MODTHREAD 50, PRUDMOULI 100, TECILCHEM 50)"*

and the universe source:

> *"NSE CM EQ tier (`EQUITY_L(1).csv`, `series=EQ`, **2,390 rows**)"*

The IPD master is an **instrument/security master** (2,390 rows); the IRR roster is a **three-level identity roster** (2,388 issuers / 2,388 securities / 2,388 listings). The manifest itself already cites a **2,387-row** listing-master population for a single field, a **2,390-row** EQ universe, and a **2,388**-row corpus — so no two of these populations are the same set.

**Therefore the 2,388 and 2,390 figures are not equated, and no reconciliation is claimed.** A difference of 2 between a 2,390-row instrument universe and a 2,388-issuer identity roster is **not** evidence of any particular two missing records; **no repository artifact enumerates which records differ**, and none is inferred here. The exact reconciliation is listed as absent evidence in §2.8 (it would come with the roster's provenance statement).

### 2.8 Where the 64-row census can and cannot be tied to exact source versions

**Cannot be tied (absent evidence, named precisely):**

| Absent item | Precise statement of absence | Who can supply it | How |
|---|---|---|---|
| **Full roster version digest** | The published census carries a **truncated** digest (`sha256:4baa4e…`), not the full 64-hex value. | Host operator / IRR identity owner | Re-read the identity coverage endpoint for the same revision; the field is already published (§2.2). |
| **Listing-map version digest** | Not carried into the published census record at all, though the served report carries it. | Host operator / IRR identity owner | Same re-read. **No new extract required.** |
| **Corporate-action-table version digest** | Not carried into the published census record at all, though the served report carries it. | Host operator / IRR identity owner | Same re-read. **No new extract required.** |
| **Identity-source as-of / publication timestamps** | IRR publishes `asOf` and `generatedAt` on the coverage report (`coverage.ts:90-95`), but the census record did not carry them. | Host operator / IRR identity owner | Same re-read. |
| **Roster `rosterLabel` as published for this revision** | The census recorded the *class* (`OPERATOR_SUPPLIED`) but not the *label*, which is the field that actually determines the class (§2.4). | Host operator / IRR identity owner | Same re-read. |
| **Roster source authority / provenance of record** | **No artifact anywhere in either repository names who authored the 2,388-row roster or from what authority it was derived.** There is no roster build script, no roster generator, and no roster manifest in IRR — the file is read from the host and validated. | **Not established by evidence.** Would require the user/host operator or the roster supplier. | Cannot be manufactured; must be supplied by whoever produced the file. |

**Can be tied (established above):**

| Item | Version / provenance | Effective or retrieval time |
|---|---|---|
| D05 security master (and embedded issuer level) | `sha256:b555fd28…`, 2,390 records, act `AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001` | Deposited `2026-11-08T04:56:19Z`; universe as-of `2026-11-08` |
| P07 Dhan instrument master | `6F19FEB4…` (detailed) / `4366E41B…` (base), 217,104 rows | Retrieved `2026-11-06T05:27–05:29Z`; no publisher as-of published |

### 2.9 Independent governing constraint on roster authority (IRR)

The IRR repository contains a **standing governance constraint that bears directly on this item** and is quoted here because it defines what an acceptable roster is:

> *"**Approved roster and corpus revision** — specify the exact eligible roster, its authority, D05 corpus/version and content checksum, effective period, provenance, and treatment of omissions, corrections, and stale entries. A changing dataset is not an approved roster."*
>
> *"**Authoritative identity and eligibility contract** — identify the governed identity levels and eligible/ineligible/unresolved states; state what source is authoritative and how exact identifiers and effective dates are interpreted. Do not derive eligibility from a display label or resolver classification."*
>
> — IRR `docs/integration/IIPS_v3.0_CV22_OPTION_C_PA_DECISION_2026-10-19.md:40-46`

This decision **defers** D05 expansion ("OPTION C — DEFER EXPANSION PENDING DEFINED PREREQUISITES") and grants no cross-repository implementation authority. Its prerequisites 1 and 2 are **not** met by the present evidence: the roster's authority is unnamed and the eligible-scope contract is unestablished.

**Direct consequence:** the W04 eligible-scope rule (§4) cannot be derived from the IRR resolver's states or from the coverage report's labels, because the CV-22 decision explicitly forbids exactly that ("Do not derive eligibility from a display label or resolver classification"). This independently corroborates the conclusion in §4.

---

## 3. The corporate-action coverage result

### 3.1 What is established — the zero is a fact about an **extract**, not about the world

**Established, from repository evidence:**

1. **The corporate-action file is operator-supplied and read from the host.** It is `${IIPS_DATA_DIR}/investment/identity/corporate-actions.json`, one of exactly three identity source files (IRR `sources.ts:549-570`). Its version is a canonical-content SHA-256 digest (`sources.ts:524-537`).

2. **The observed zero is the content of the supplied extract.** The census record shows 0 corporate-action records for the observed revision (prior W04 assessment §5.2).

3. **Every operator-supplied corporate-actions file found in IRR evidence contains zero actions.** The only file with actions is the **synthetic test fixture** `iips-platform/tests/investment/fixtures/identity/corporate-actions.json`, which contains **9** actions. The sole operator-supplied example with a real issuer — `evidence/real-issuer/REL-1-INFOSYS-2026-11-06/identity/corporate-actions.json` — contains **0** actions, alongside a 1-issuer/1-security roster and 2 listing-map entries.

4. **The zero therefore reflects the supplied extract.** It is a fact about a file's contents. It is **not** evidence that no corporate actions occurred in the market, in the covered universe, or in the roster's own history.

### 3.2 What corporate actions actually affect — and why the 1/64 result does not depend on them

**Corporate actions are not consulted in primary identity resolution.** They are consumed only for **successor reconciliation** of MERGER/DEMERGER events:

- IRR `iips-platform/src/investment/identity/coverage.ts:198-207` — successor reconciliation covers issuers seen in observations **and** issuers with merger/demerger events in the corporate-action table.
- IRR `iips-platform/src/investment/identity/corporateActions.ts:221-255` — the MERGER/DEMERGER reconciliation semantics.
- IRR `iips-platform/src/investment/identity/resolver.ts` — the primary ISIN/series/exchange resolution path does not read the corporate-action table.

**Therefore:**

- The observed **1/64 primary D114 result does not depend on corporate-action records at all.** The 63 unresolved rows carry `NO_IDENTIFIER_PROVIDED` because no security identifier was supplied — not because a corporate action was missing from the table. A complete corporate-action table would not have changed the 1/64 figure.
- The zero has **no effect on the W04 census counts** and therefore **does not qualify or disqualify** the W04 reconciliation result.
- What the zero *does* affect is **downstream successor completeness**: without corporate-action history, a MERGER/DEMERGER successor chain cannot be reconciled from the roster, and a reused symbol or changed series cannot be disambiguated by corporate-action evidence. That capability is currently **unproven**, and its absence is a **latent** limitation that will surface only when a row needs successor reasoning.

### 3.3 Which of the five candidate explanations the evidence supports

The task required determining whether the zero means: (a) the source does not provide them; (b) the extract intentionally excludes them; (c) they exist elsewhere but were omitted; (d) the source does not support relevant categories; or (e) the reason is unknown.

| Candidate | Verdict | Basis |
|---|---|---|
| (a) The source does not provide them | **Not established.** | The file is present, schema-valid and digest-versioned; it provides **zero records**, which is not the same as not providing the capability. |
| (b) The extract intentionally excludes them | **Not established.** | No repository artifact states an exclusion intent, a filter, or an empty-by-design declaration for the observed revision. |
| (c) They exist elsewhere but were omitted | **Not established, and not excluded.** | No repository artifact records corporate actions for this universe in any other location. The absence of such an artifact is **not** evidence that none exist. |
| (d) The source does not support relevant categories | **Contradicted by the schema.** | The corporate-action record type supports a category set including MERGER and DEMERGER — i.e. the source **does** support the relevant categories. IRR `fundamentals/types.ts` action types; `corporateActions.ts:221-255` consumes MERGER/DEMERGER. |
| (e) The reason is unknown | **CORRECT — this is the disposition.** | No artifact in either repository states why the observed extract contains zero actions. |

**Disposition: (e), the reason is unknown.** The evidence establishes *that* the extract is empty and *what* the emptiness affects (§3.2), but not *why* it is empty.

### 3.4 Impact on W04 qualification and downstream work

| Item | Impact |
|---|---|
| **W04 census counts (1 / 0 / 63 / 0 / 0)** | **No impact.** Primary resolution does not consult corporate actions. |
| **W04 acceptance** | **No impact** on the census or the reconciliation. The prior assessment's W04-04 finding ("the corporate-action table's zero-record state is unexplained") is now **explained in its mechanism** (an extract-content fact with a documented, non-blocking effect) while remaining **unexplained in its cause**. W04-04's *closure* condition is therefore **narrowed**, not waived — see §7. |
| **θI** | **No impact.** θI is blocked by the missing eligible population `E`, not by corporate actions. |
| **W08 / W10 (successor and issuer→engine mapping)** | **Material impact.** Successor reconciliation completeness is unproven. Any issuer whose listing changed via merger/demerger may be unreachable by primary resolution alone. This is a **downstream** limitation to be carried, not a W04 defect. |
| **Ambiguity diagnosis** | **Material impact.** A reused symbol or series change cannot currently be disambiguated from corporate-action evidence; such rows would be diagnosed from the roster and listing map alone. |

### 3.5 What must not be concluded

- **Zero records is not proof that no corporate actions occurred.** It is not evidence about the market, the universe, or the roster's history.
- **Zero records is not a defect in the loader or the resolver.** Both behave correctly on a valid, empty, schema-conformant file.
- **No corporate-action record was manufactured, substituted or reconstructed** in this assessment, and none may be.
- The REL-1 Infosys operator example (a real, 1-issuer/0-action extract) **was not** substituted for the observed source, and its digests **were not** presented as the observed revision's.

### 3.6 What would close the corporate-action question

Closure requires evidence from the party that supplied the extract, or from a governed source, that states **why** the extract contains zero corporate actions for the observed revision — for example an attestation that the supplier's corporate-action feed was empty/not-applicable as-of the extract date, or a governed source providing the action history.

This is a **single, narrow, factual question**: *"Was the corporate-action feed for this roster empty because no relevant events exist in the covered period, because the supplier's feed did not carry them, or because the extract was scoped to exclude them?"* It is recorded in §6 as a dependency for the principal to authorize or arrange. **No source holder has been contacted, and no confirmation is claimed.**

---

## 4. Pre-registration of the eligible scope `E`

### 4.1 Determination — the rule **cannot** be pre-registered from the available evidence

**Recorded as an unresolved decision requiring Principal authority. Not invented, and not designed retrospectively to improve 1/64.**

The prior assessment recorded this as **W04-01** and described it as requiring no external access. That assessment is **corrected here**: pre-registering the rule *itself* requires no external access, but **establishing the eligible population `|E|` for the observed revision requires a fact that the supplied evidence does not contain** — namely, whether any of the 64 captured rows is a **non-active (closed/inactive) position**, and what the approved analysis scope is.

### 4.2 What the roadmap requires, verbatim

> *"**Complete holding census:** disclose total holdings, eligible, excluded, unresolved identity and withheld counts. Total = eligible + excluded, with each row assigned once. Unresolved and withheld are separately disclosed overlapping reason categories, not added to that partition. For **every** excluded or uncovered holding record the reason, its treatment and supporting evidence; authorized reports use non-identifying row tokens or sanitized aggregation. **Exclusion is permitted only for an objectively documented, applicable scope rule established independently of coverage outcome** (for example inactive rows if the approved analysis is active positions only); missing identity, financials, price or output is **not** an exclusion rule. **Unknown eligibility blocks a complete census** rather than being silently excluded."*
>
> — `docs/integration/IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md:249`

Two requirements are decisive and are both **unmet** by the available evidence:

1. The rule must be **"established independently of coverage outcome"**. Any rule whose definition is chosen because it yields a particular `|E|` — or a particular θI — is prohibited. Since the only coverage outcome in evidence is 1/64, and any `|E|` < 64 excludes exactly the 63 unresolved rows, **every candidate rule that improves the ratio is disqualified by construction**.
2. **"Unknown eligibility blocks a complete census"** — it does not permit assuming eligibility either way.

### 4.3 The candidate rules that repository evidence *does* support, and why each is incomplete

| Candidate rule | Evidence for it | Why it cannot be adopted alone |
|---|---|---|
| **Exclude rows where `active === false`** | The roadmap names this pattern: *"(for example inactive rows if the approved analysis is active positions only)"*. `active` is a persisted, typed boolean on the holding (`src/persistence/portfolio_store.ts:87`, `1106`, `1376-1377`) and is carried across the G24 wire into IRR's `G2HoldingView` (`frontend/server/user-portfolio/userPortfolioContract.ts:264-281`) and into the IRR identity observation (`frontend/server/investment/sources.ts:50`). | The roadmap's example is **conditional on the approved analysis being active-positions-only** — that approval is the missing authority. And the **`active` distribution across the 64 captured rows is not recorded** in any evidence supplied to this assessment, so `|E|` cannot be computed even if the rule were approved. Note also that IRR carries `active` **only as a passthrough field** and never uses it for identity eligibility — its only `active`-related identity reason is `DUPLICATE_ACTIVE_SYMBOL`, which refers to an *active issuer listing*, not to a holding's active flag (`iips-platform/src/investment/identity/types.ts:65`). The flag is therefore available as a scope signal but **carries no established eligibility semantics in either repository**. |
| **Include only D114-`RESOLVED` rows** | — | **Expressly prohibited.** "missing identity … is **not** an exclusion rule." This rule would be exactly the retrospective design the roadmap forbids, and would reproduce 1/64 as a threshold. |
| **Include only rows in the approved D05 corpus** | The CV-22 decision names "D05 corpus/version and content checksum" as an approved-roster component. | The CV-22 decision **defers** D05 expansion and grants no authority; the "current 13-row IRR sector-reference behavior is the accepted boundary for this work item" (CV-22 §3). It cannot be read as authority for W04 eligibility. |
| **Include all 64 rows, excluding none** | Simple; consistent with "each row assigned once". | If any of the 64 rows is inactive, this would exclude nothing and include a closed position, potentially violating the approved analysis scope. It also silently treats "unknown eligibility" as "eligible", which the roadmap's "unknown eligibility blocks a complete census" language cuts against. |
| **Derive eligibility from IRR's `ELIGIBLE` issuer status** | The roster carries a per-issuer `status` field; IRR `coverage.ts:206` filters `issuer.status === 'ELIGIBLE'`. | **Expressly prohibited by CV-22**: "Do not derive eligibility from a display label or resolver classification." This is precisely a resolver classification. IRR's own type documentation agrees: the upstream status is *"carried for reconciliation, **not for authority**"* (`iips-platform/src/investment/identity/types.ts:103`). |

### 4.4 Pre-registered **draft** rule, offered for Principal approval — not approved, not applied

**To avoid presenting the absence of a rule as the absence of work, the following is drafted. It is offered as a proposal for the Principal's decision. It is not adopted, not applied to the census, and no `|E|` is computed from it.**

**Proposed W04 eligible-scope rule (DRAFT — requires Principal approval; applied to no result):**

1. **Population.** The population is the **entire persisted owner-scoped portfolio revision** captured in the W03 census (portfolio `DHAN_PORTFOLIO`, revision **1**, **64 holdings**), captured in one persisted revision with identical before/after snapshots. The scope rule is fixed against this revision and is not re-cut between revisions.
2. **Inclusion.** A row is **eligible** iff its persisted `active` flag is `true` **and** the approved analysis scope is active positions only. Every eligible row is then classified on identity, and its identity disposition is recorded but **never** used to include or exclude it.
3. **Exclusion — the only permitted basis.** A row is **excluded** iff `active === false`, i.e. the position is closed/inactive. Each excluded row is recorded with its reason ("inactive position, excluded under the approved active-positions-only scope"), its treatment, and supporting evidence. **No other exclusion basis is permitted.**
4. **Prohibited exclusions (enumerated).** Missing, unresolved, ambiguous, expired or ineligible **identity**; missing financial data; missing price; and missing output are **not** exclusion bases. Rows with those conditions are **eligible and uncovered**.
5. **Missing, unresolved, ambiguous, expired/ineligible identities.** All are **eligible and uncovered**, each with its own disposition and reason. Ambiguity is never resolved by preferring one candidate; expiry is never resolved by substituting the current listing; an unresolved row is never re-attempted against a different identifier source without recording that attempt.
6. **Unavailable records.** A row whose record could not be read at all is **eligible and unavailable**, disclosed separately, and **never** counted as excluded.
7. **Partition.** `|T| = |E| + |X|` where `|T| = 64`. Unresolved and withheld are separately disclosed **overlapping** reason categories and are **not** added into the partition.
8. **Evidence required to classify each holding.** For each of the 64 rows: the persisted `active` value; the identity disposition (qualified / ambiguous / missing / expired-or-ineligible / unavailable); the reason code; and the D05/P07/IRR source versions in force. Row tokens, not personal identifiers.
9. **Where eligibility is decided.** At the **W03 capture boundary, before any identity or financial evaluation** — on the persisted revision, on the `active` flag alone. It is not decided during or after identity resolution, and it is not re-decided when coverage results arrive. This is what "established independently of coverage outcome" requires.
10. **θI is not defined by this rule.** The rule fixes a denominator; the threshold comes from §K of the roadmap and from downstream method evidence (W05–W14) that does not yet exist.

**What the Principal must supply to make this rule operative:**

| # | Required decision / fact | Why it is required |
|---|---|---|
| **A1** | **Is the approved analysis scope active positions only?** | This is the roadmap's own conditional, and the rule cannot proceed without it. If the answer is "all captured rows", exclusion basis (3) collapses and `|E| = 64` subject to the identity being carried as uncovered. |
| **A2** | **The `active` distribution over the 64 captured rows.** | Without it `|E|` is not computable, and the roadmap's "unknown eligibility blocks a complete census" applies. This is a **host-read fact**, obtainable from the already-persisted revision without any new external access. |
| **A3** | Confirmation that the scope rule is **approved independently of** the coverage outcome, and a record of that approval. | The roadmap requires the rule to be "established independently of coverage outcome"; the record is what demonstrates that. |

**Note on A2.** If the 64 rows are all `active === true`, then `|E| = 64` and the identity numerator is 1/64 — the same figure as before, with no rule chosen to produce it. That possibility is a reason the rule must be fixed **before** the distribution is read, and it is another reason the rule must be approved (A1) rather than derived. **This assessment did not read the `active` distribution**, because reading it before the rule is approved would itself be the retrospective design the roadmap prohibits. That is a deliberate omission, and it is recorded here so the omission is not mistaken for an oversight.

### 4.5 Why `E` cannot be asserted today

`E` remains **undefined** — not "0", not "1", not "64", and not "63". The prior assessment's statement stands unchanged: *"|E| (the eligible set) is **not** established by this census."*

---

## 5. The identifier-supply gap

### 5.1 The gap, stated precisely

| Fact | Value | Source |
|---|---|---|
| Holdings in the captured revision | **64** | prior W04 assessment §5.2 |
| D114-qualified security identity | **1** | prior W04 assessment §5.2 |
| Unresolved | **63**, all with `NO_IDENTIFIER_PROVIDED` | prior W04 assessment §5.2, §3.6 |
| Ambiguous | 0 | prior W04 assessment §5.2 |
| Expired / ineligible | 0 | prior W04 assessment §5.2 |
| Unavailable | 0 | prior W04 assessment §5.2 |
| P04 issuer status | 64 `RESOLVED` / `CANONICAL_P04`; all 64 carry a `companyId` | prior W04 assessment §5.2, §5.3 |
| Series supplied for the 63 | **none** | prior W04 assessment §3.2 |

The 63 rows fail at the **first** step of D114 qualification: the observation carries no ISIN, hence no security, hence no listing, hence no issuer. The IRR resolver's own reason code for exactly this is `NO_IDENTIFIER_PROVIDED` (`resolver.ts:398-404`).

### 5.2 Evidence supporting inference from issuer-level `companyId` — **none exists**, and none is sought

The prior assessment established that no repository artifact supports promoting a `companyId`-only row to a qualified security identity, and that IRR treats `companyId` as a **conflict indicator only**, never an identifier source (`types.ts:86-96`; `resolver.ts:255-273`). The D114 contract has a **no-inference builder** (`src/contracts/types.ts`).

Re-confirmed against the current IRR head: `companyIdHint` is used solely to detect conflict, and the resolver's issuer always comes from a security (`resolver.ts:157-181`). **No identifier was inferred, and none may be.**

### 5.3 P04 / D114 separation — unchanged and re-verified

P04 resolves the **issuer**; D114 resolves the **tradable security + listing + issuer**. P04 `RESOLVED` is not D114 success. The two are compatible and must continue to be reported separately, exactly as the prior assessment established. The W03→W04 separation in the roadmap (RA-04: *"Actual coverage and bridge"*) and CL-03 (*"Split measurement from compatible identity bridge"*) continue to hold.

### 5.4 The source holder and the responsible data owner — **established**

The prior assessment left this open. Repository evidence in IRR establishes it:

> *"| D1 | Identity files (roster, listing map, corporate actions) | Issuer/holding identity for all three capabilities | Absent by default; **valid when the governed fixture set is installed** | `<IIPS_DATA_DIR>/investment/identity/{eligible-roster,listing-map,corporate-actions}.json` **from the authoritative issuer source** | **IRR (loader)** | **User host** | **Authoritative issuer data** | **5** | Loader executed: `IDENTITY_SOURCES_VALID`; HTTP coverage no longer reports identity failure |"*
>
> — IRR `docs/integration/IID-P6A-RUNTIME-DEPENDENCY-ASSESSMENT-2026-11-09.md:52`

Read against its own key — *"**(5)** user-host provisioning required"* — this states, in IRR's own governance record:

| Dimension | Established value |
|---|---|
| **Repo owner** | IRR (the loader) |
| **Execution owner** | **User host** |
| **External dependency** | **Authoritative issuer data** |
| **Classification** | **(5)** — user-host provisioning required |
| **Loader behaviour when absent** | Bounded failure — `IDENTITY_SOURCES_MISSING` / `IDENTITY_SOURCE_MISSING` (IRR `docs/integration/IID-IDENTITY-AND-INVESTMENT-COVERAGE-SEPARATION-2026-11-10.md:23`) |

**The responsible party for supplying the identity sources is therefore the user host, drawing from an "authoritative issuer source" that the repository does not name.** The **authoritative issuer source itself is not named anywhere in either repository** — that is the precise gap, and it is the party the principal would need to approach.

### 5.5 What closure actually requires

| Option | Assessment |
|---|---|
| **Existing documentation** | **Not sufficient.** No in-repository document names the authoritative issuer source or supplies an identifier-bearing export for these 63 rows. |
| **Authorized source-holder response** | **Plausible and indicated** for the corporate-action question (§3.6) and for roster authority (§2.8). It is **not** the minimal route for the identifier gap itself. |
| **An additional extract** | **This is the identified route.** The gap is in the **holding observation**: the broker/portfolio record must carry the security identifier (ISIN) and exchange, and separately a `series`. IPD's P07/Dhan path already carries ISIN + exchange for the *instrument master*; the **holding view** projection is where the identifier is lost. |
| **An upstream export-contract change** | **This is the precise technical root.** IRR's `G2HoldingView` describes optional `isin`/exchange but **not** `securityIdentity` (`frontend/server/user-portfolio/userPortfolioContract.ts:264-281`, per the consolidated audit), and the IID adapter reads only the listed ISIN/exchange fields, setting `series: null` and treating `companyId` only as a hint (`frontend/server/investment/sources.ts:42-76`). The consolidated audit already records this as an **implementation requirement**: *"determine an authorized, lossless identity projection from the exact IPD representation into IID, with exchange/issuer evidence separately resolved; do not reconstruct from symbol or claim the existing IID mapper consumes the extra field."* |
| **Another evidenced action** | The IRR PR #563 D114 bridge (already implemented and tested, **open and unmerged**) delivers the projection and read-path tests. It is **already-completed IRR-side work**; it is not a W04 implementation and is not duplicated here. |

**Root-cause statement (the useful form of the finding):** the 63-row gap is **not** a resolver defect and **not** a roster defect. It is a **projection gap in the upstream holding-record contract** — the security identifier was never carried into the holding observation, so the D114 resolver had nothing to resolve. The remedy is therefore on the **export/projection** side, not the resolution side.

### 5.6 Boundary

**No source holder was contacted. No portfolio data was transmitted. No credentials were requested. No confirmation by any external party is claimed.** The ownership finding in §5.4 is drawn from IRR's own published dependency assessment, not from any communication. Arranging any external response is recorded as a dependency for the principal to authorize.

---

## 6. Consolidated dependency register (W04 remaining)

| ID | Item | Evidence status | Owner (per evidence) | Required action | Blocks |
|---|---|---|---|---|---|
| **W04-01** | Pre-register the eligible-scope rule `E`; compute `|E|`, `|X|` and every excluded row's reason and treatment | **Draft rule written (§4.4); NOT approved; `|E|` not computed** | **Principal / IPD** | Approve scope (A1) and record the approval (A3) | θI denominator |
| **W04-01a** | The `active` distribution over the 64 captured rows | **Not read — deliberately, pending A1/A3** | Host operator | Read from the already-persisted revision (no new external access) | `|E|` |
| **W04-02** | Per-row security identifier (ISIN) and exchange, plus a separately evidenced `series`, for the 63 rows | Gap confirmed; root cause localized to the upstream holding-record projection (§5.5) | **User host** (execution owner) / authoritative issuer source (unnamed) | Extend the holding-record export/projection to carry the security identifier; merge IRR PR #563 (already complete, open) | Identity numerator |
| **W04-03** | Record roster, listing-map and corporate-action-table versions and digests for the observed revision | **Mechanism established: the coverage report publishes all three (§2.2). The census record simply did not carry them.** | Host operator / IRR identity owner | **Re-read the identity coverage endpoint for the same revision.** No new extract, no new source holder, no code change | Reproducibility of the census |
| **W04-04** | Explain the **zero corporate-action records** | **Mechanism and impact established (§3.2, §3.3): extract-content fact; does not affect primary resolution; leaves successor reconciliation unproven.** **Cause remains unknown.** | Identity-source supplier (unnamed) | A factual statement of why the feed is empty for this revision | Successor completeness (W08/W10); ambiguity diagnosis |
| **W04-04a** | Name the **authoritative issuer source** and the **roster authority/provenance of record** for the 2,388-row roster | **Not established.** `OPERATOR_SUPPLIED` is a label heuristic, not an attestation (§2.4) | User host / roster supplier | A provenance statement naming the authority and as-of period | Roster authority under CV-22 prerequisites 1–2 |
| **W04-05** | W05 financial coverage and source rights for the same revision | Not started | IRR financial data / operator | — | θF, θM |
| **W04-06** | W06 quote coverage and freshness for the same revision | Not started | IPD freshness / IRR consumer | — | θM, θA |
| **W04-07** | W10–W14 method-specific inputs, engine outcomes and the consequences of omission | Not started | IRR methodology / engines | — | θI, θF, θA justification |
| **W04-08** | Merge IRR PR #563 (D114 adapter + tests; already complete) | Open, unmerged | IRR | Merge in the owning repository | Nothing for W04's findings |
| **W04-09** | Whether a coverage surface should display P04 issuer status alongside D114 security status | Open — presentation only | IRR presentation / IPD | — | Presentation only, not this census |

**No code defect was found.** W04-08 is a merge of already-completed, already-tested IRR work — not an implementation this assessment requires.

---

## 7. Updated W04 acceptance basis

### **W04 — PARTIALLY COMPLETE**

### 7.1 The roadmap's W04 specification

> *"**Deliverable:** same-revision qualified/resolved, ambiguous, missing, expired/ineligible and unavailable counts with source and listing/series versions. **Acceptance/evidence:** reconciled rows and exact security→listing→issuer mapping; no symbol-only identity. **Blocker:** W03 actual data/access and appropriate source use."*

### 7.2 Element-by-element status

| W04 element | Status | Basis |
|---|---|---|
| Same-revision qualified/resolved, ambiguous, missing, expired/ineligible, unavailable counts | ✅ **Delivered** | Prior assessment §5.2 — 1 / 0 / 63 / 0 / 0, reconciled to 64. |
| Reconciled rows | ✅ **Delivered** | Prior assessment §5.2 — each row assigned exactly one disposition; `|T| = |E| + |X|` verified. |
| Exact security→listing→issuer mapping | ✅ **Delivered for the 1 qualified row**; the 63 have no security-level evidence to map | Prior assessment §5.3, §5.4. |
| No symbol-only identity | ✅ **Verified** | Prior assessment §3.5, §5.4 — reproduced empirically; no row resolved from a symbol; `companyId` never promoted. |
| **Source versions** | ⚠️ **Partially delivered — materially advanced** | §2.1, §2.8 — security-master version **fully established** (`sha256:b555fd28…`, 2,390 records, act, deposition time, universe source + member hash); P07 master version **fully established** (both digests, 217,104 rows, retrieval timestamps); roster version **partially** (truncated digest). Listing-map and corporate-action versions **still not carried in the record** — but now known to be **published by the served endpoint** (§2.2), so closure is a re-read, not a new source. |
| **Listing/series versions** | ⚠️ **Partially delivered** | Same position as above. Series is a required component of the canonical `listingId` (`exchange:symbol:series:instrumentType`), so the **listing-map version governs the series**; obtaining it is the same re-read. |
| **Corporate-action coverage explained** | ⚠️ **Mechanism and impact delivered; cause not** | §3 — zero is an extract-content fact; does not affect primary resolution or the census; leaves successor reconciliation unproven; cause unknown (disposition (e)). |
| **Eligible-scope rule pre-registered** | ❌ **Not complete — draft written, not approved** | §4 — draft rule at §4.4 with three required Principal decisions (A1, A2, A3); `|E|` not computed; rule not applied to any result. |
| **Identifier-supply dependency** | ✅ **Delivered (dependency recorded, owner identified)** | §5 — gap confirmed, root cause localized to the upstream holding-record projection, execution owner established as **user host** from IRR's own dependency assessment. |
| **θI** | ❌ **NOT ESTABLISHED** — and correctly so | §8. |

### 7.3 Why **not COMPLETE**

W04's acceptance evidence explicitly requires the counts **"with source and listing/series versions"**. Two required elements are therefore not fully discharged:

1. **The listing/series version is still absent from the record** (W04-03), even though it is now known to be obtainable by re-reading an endpoint that already serves it. A census without the versions that produced it is not reproducible — the specific failure mode the roadmap's W19 preservation discipline exists to prevent.
2. **The eligible-scope rule `E` is not pre-registered** (W04-01). Without it there is no denominator, so the roadmap's §K threshold-setting cannot begin, and §K.2's "unknown eligibility blocks a complete census" condition applies.

### 7.4 Why **not BLOCKED**

Every substantive W04 element that the available evidence can discharge **has** been discharged:

- The **full source/version provenance chain is now reconstructed** for the security master, the issuer level, the P07 instrument master and the roster mechanism — reproducibly, from repository artifacts, with exact digests, counts, acts, hashes and timestamps.
- The **corporate-action result is characterised**: mechanism, effect, impact and the exact residual (unknown cause) are all established, and the effect on the census is proven to be nil.
- The **identifier-supply dependency is recorded with an evidenced owner** and a localized root cause.
- The **eligible-scope rule is drafted** to the point where only three decisions — all within the principal's authority — remain.

The remaining items are **a record-completeness re-read** and **a decision plus a host-read fact**. None is an external dependency on an unidentified party. **The work is incomplete in a narrow, disclosable way, not stuck.**

### 7.5 Exact closure conditions for W04 → COMPLETE

W04 may be declared COMPLETE when **all** of the following are evidenced:

| # | Closure condition | Where it comes from | Nature |
|---|---|---|---|
| **C1** | The **full** roster version digest, the **listing-map** version digest and the **corporate-action-table** version digest for the observed revision, plus the report's `asOf`/`generatedAt` and the published `rosterLabel`, are recorded alongside the census. | W04-03; §2.2, §2.8 | **Host re-read** of the identity coverage endpoint for the same persisted revision. No new extract, no source holder, no code. |
| **C2** | The eligible-scope rule is **approved by the Principal**, with the approval **recorded and dated**, and stated to have been established **independently of coverage outcome**. | W04-01; roadmap §K.2; CV-22 prerequisite 1 | **Decision** (A1, A3). |
| **C3** | The `active` distribution over the 64 captured rows is read **after** C2, and `|E|`, `|X|` and every excluded row's reason, treatment and supporting evidence are published. | W04-01a; roadmap §K.2 | **Host read** of the already-persisted revision (A2). |
| **C4** | The corporate-action zero's **cause** is stated by the identity-source supplier, **or** the residual is formally accepted by the Principal as a disclosed limitation with its downstream consequence (successor reconciliation unproven) carried into W08/W10. | W04-04; §3.4, §3.6 | **External factual answer**, or an explicit **acceptance decision**. |
| **C5** | The **authoritative issuer source** and the **roster authority/provenance of record** are named, or formally recorded as unknown with the consequence stated. | W04-04a; §2.4, §2.8; CV-22 prerequisite 2 | **Provenance statement** from the user host / roster supplier, or an explicit disclosure. |
| **C6** | Downstream threshold-setting evidence for θI is supplied. | W04-07; roadmap §K | **External** — W05, W06, W10–W14. |

**C1, C2 and C3 are within reach without any external party.** C4 and C5 need an external factual answer or an explicit acceptance decision. C6 is the roadmap's own downstream sequence.

### 7.6 Scope discipline — what this pass did **not** do

- **No W05–W20 work was started.** W05, W06, W07, W08, W10–W14, W17–W20 remain untouched; no downstream evidence was produced, requested or assumed.
- **No PR was merged** — IRR PR #563 remains open and unmerged; IPD PR #156 and PR #158 remain untouched.
- **No portfolio data was altered**, re-cut, re-captured or re-scoped. The 64 persisted holdings are exactly as captured.
- **No identifier was manufactured, inferred or enriched**, and no `companyId`-based promotion was performed or contemplated.
- **No corporate-action record was created, substituted or reconstructed.**
- **No eligibility was asserted** and no threshold was derived from 1/64.
- **No source holder was contacted** and no external confirmation is claimed.
- **No code, contract, configuration, credential, deployment or runtime change** was made in either repository.

---

## 8. θI — determination unchanged

### **`THETA_I = NOT YET ESTABLISHED`**

Unchanged from the prior assessment, and now resting on a **more precisely stated** basis:

| Requirement | Present? | Basis |
|---|---|---|
| A defined eligible population `|E|` | ❌ | §4.5 — `E` undefined; the scope rule is drafted but unapproved (C2), and the `active` distribution is deliberately unread pending approval (C3). |
| Downstream threshold-setting evidence | ❌ | W04-07; roadmap §K. W05, W06, W10–W14 are not started. |
| A defensible numerator basis | ⚠️ Partial | The reconciliation machinery is verified and reproducible; the numerator is bounded by the identifier-supply gap (§5). |

**`1/64` must not be published as a coverage threshold, and `1/|E|` must not be substituted for it.** The §K threshold-setting process requires the eligible population first and the downstream method evidence second; neither exists. Retaining `NOT YET ESTABLISHED` is the correct outcome, and it is now supported by named, closable conditions rather than by an open-ended deferral.

---

## 9. Exact next actions

In roadmap order, and **without** starting W05 or later implementation:

1. **C1 — re-read and record the identity coverage endpoint for the same persisted revision** (host operator). This closes the listing/series version and completes the census's reproducibility. It requires no external party and no new extract. *Do this first: it is the cheapest and it unblocks the census.*
2. **C2 — the Principal approves the eligible-scope rule** (§4.4) and records the approval with a statement that it was established independently of coverage outcome. *This must precede any read of the `active` distribution.*
3. **C3 — read the `active` distribution from the already-persisted revision** and publish `|E|`, `|X|` and per-row exclusion reasons. *After C2 only.*
4. **C4/C5 — decide** whether to seek a factual statement from the identity-source supplier on the corporate-action zero and the roster authority, or to formally accept both as disclosed limitations. *This is the principal's call on external contact; no contact has been made.*
5. **W04-08 — merge IRR PR #563** in the owning repository, if and when the IRR owner chooses. It is completed, tested work; it is not a W04 implementation and is not duplicated here.
6. **W04-02 — raise the identifier-supply requirement** as an **upstream export/projection contract change** (the root cause), not as a resolver defect: the holding record must carry the security identifier and exchange, and separately a `series`.
7. **Do not** start W05 or later implementation in this pass, and **do not** merge any PR.

**What must not happen next:** the census must not be re-cut with the 63 rows excluded to improve a ratio; P04 `RESOLVED` must not be presented as D114 identity success; `1/64` must not be published as a threshold; the scope rule must not be tuned after the `active` distribution is known; and the two surfaces must not be made to display the same status in order to make the discrepancy disappear.

---

## 10. Assessment boundary

This document records a read-only evidence assessment and governance record. It does not claim W04 acceptance, does not establish θI, does not claim W20 readiness, and does not grant implementation authority. It makes no Dhan API call and no host access. It changes no code, contract, configuration, credential, portfolio record or persisted holding in either repository. It writes no roster, listing map, corporate-action file, security master or issuer master. It derives no identifier. It approves no eligibility policy. It contacts no external party and claims no external confirmation.

---

## Appendix A — Files and sources inspected

**IPD (`c1b1ed8`)**
- `docs/integration/IIPS-CURRENT-PORTFOLIO-W04-P04-D114-IDENTITY-SEMANTICS-AND-COVERAGE-ACCEPTANCE-BASIS-2026-11-14.md` — the prior W04 assessment this document completes.
- `docs/integration/IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md` — W04 specification; §K.2 census and threshold methodology (line 249); W03–W20 dependency graph; §B readiness table; §I blocker register.
- `evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.manifest.json` — the D05 master provenance of record (§2.1).
- `evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.json` — the D05 master payload, independently recounted (2,390).
- `src/identity/d05_authenticated_universe_data.ts` — the canonical dataset asset header (checksum, scope, authority).
- `src/contracts/d05_security_master.ts` — the D05 contract; issuer and listing fields; `effectiveFrom`/`effectiveTo`.
- `src/identity/broker_observation_resolver.ts` — the P04 issuer resolver; `recordCount === 2390`, 64-hex checksum and authorization-reference preconditions.
- `src/contracts/types.ts` — the `D114SecurityIdentity` grammar and the no-inference builder.
- `src/persistence/portfolio_store.ts` — the persisted holding shape; `active: boolean` (line 87, 1106, 1376-1377); null nested security identity.
- `evidence/dhan-p7/source-retrieval-manifest.json` — the P07 instrument-master provenance of record (§2.6).
- `src/providers/dhan/dhan_security_identity_service.ts:8-23, 101-109` — the P07 → P04 → D114 qualification chain and its eight checks (§2.6).
- `scripts/dhan-p7-qualify.mjs` — the offline P07 qualification runner that verifies the P07 digests against the retrieval manifest and qualifies candidates against the P04 master (§2.6).
- `docs/integration/IIPS-CONSOLIDATED-SNAPSHOT-TO-CURRENT-ARCHITECTURAL-AUDIT.md` — the recorded implementation requirement for a lossless identity projection (§5.5).

**IRR (`08411bc`, read-only)**
- `iips-platform/src/investment/identity/sources.ts:101-299` — roster validation; `rosterLabel` default; issuer-key basis.
- `iips-platform/src/investment/identity/sources.ts:524-570` — canonical digest versioning; `IDENTITY_FILE_NAMES`; `rosterDataClass` derivation.
- `iips-platform/src/investment/identity/coverage.ts:90-95, 185-245` — coverage report fields; `identitySources`; successor reconciliation; `ELIGIBLE` issuer filter.
- `iips-platform/src/investment/identity/corporateActions.ts:221-255` — MERGER/DEMERGER successor reconciliation.
- `iips-platform/src/investment/identity/resolver.ts` — primary resolution; `companyIdHint` as conflict indicator only; `NO_IDENTIFIER_PROVIDED`.
- `iips-platform/src/investment/identity/types.ts:5-7, 29-96` — the three identity levels; state and reason vocabularies.
- `iips-platform/src/investment/fundamentals/canonical.ts:56-59` — the canonical digest algorithm (`digestOf` → `sha256:<hex>`).
- `frontend/server/investment/sources.ts:42-76` — `toHoldingObservation`; `series: null`; `companyId` as hint.
- `frontend/server/user-portfolio/userPortfolioContract.ts:264-281` — `G2HoldingView`; optional `isin`/exchange, no `securityIdentity`.
- `evidence/iid/IID-1-IDENTITY-COVERAGE-2026-11-05/coverage-summary.txt` — proof that the coverage report publishes all three source versions (§2.2).
- `evidence/real-issuer/REL-1-INFOSYS-2026-11-06/identity/` — a real operator-supplied identity triple (1 issuer, 1 security, 2 listings, **0** corporate actions).
- `iips-platform/tests/investment/fixtures/identity/corporate-actions.json` — the synthetic fixture with 9 actions (contrast only).
- `docs/integration/IID-P6A-RUNTIME-DEPENDENCY-ASSESSMENT-2026-11-09.md:52` — the dependency ownership matrix row D1 (§5.4).
- `docs/integration/IID-IDENTITY-AND-INVESTMENT-COVERAGE-SEPARATION-2026-11-10.md:23` — bounded identity-source failure.
- `docs/integration/IIPS_v3.0_CV22_OPTION_C_PA_DECISION_2026-10-19.md:40-46` — the approved-roster and identity/eligibility-contract prerequisites (§2.9, §4.3).

## Appendix B — Checks executed and results

| Check | Command | Result |
|---|---|---|
| TypeScript compile | `npx tsc` | ✅ **exit 0**, no errors |
| Repository test suite | `npm test` | ✅ **1712 executed / 1708 passed / 4 skipped / 0 failed**, exit 0 — identical to the pre-change baseline; the test guard (`CV-35`) reports `OK` |
| Package builds (portfolio-ui, pit, dhan) | `npm install` (prepare step) | ✅ all three `tsc` package builds succeeded |
| **D05 governed corpus audit** | `node scripts/d05_corpus_audit.mjs --corpus evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.json --output-dir /tmp/w04-audit` | ✅ **exit 0**; `records=2390 critical=60 warning=34`; audit `input.sha256` = `b555fd28…` = manifest `fileChecksumSha256` = `sha256sum` of the deposit file; all 60 criticals are the manifest's own disclosed exceptions (§2.1) |
| Manual recount of the D05 deposit | direct JSON parse | ✅ 2,390 entities; 2,390 distinct `companyId`; 2,390 distinct `isin`; listings per entity {2: 2,290, 1: 100}; NSE `ACTIVE` 2,390 / BSE `ACTIVE` 2,290 |
| IRR line-reference verification | direct file reads at `08411bc` | ✅ every IRR path and line range cited in this document was opened and confirmed |

The audit was run with `--output-dir /tmp/w04-audit`, **outside the repository**, so no artifact was added to Git. The audit tool is read-only with respect to deposits, manifests and the corpus.

**No test, fixture, corpus, deposit or manifest was modified.** The only repository changes in this pass are the three documentation files.

## Appendix C — What was deliberately not done, and why

| Not done | Reason |
|---|---|
| Reading the `active` distribution of the 64 rows | Reading it before the scope rule is approved would be exactly the retrospective design the roadmap forbids (§4.4). |
| Applying any candidate eligibility rule to the census | No rule is approved; applying one would assert a denominator that has no authority (§4.5). |
| Naming the authoritative issuer source | No repository artifact names it. Naming one would be inference (§5.4). |
| Using the REL-1 Infosys identity triple or its digests as the observed source | Different scope; substitution would be a false provenance claim (§3.5). |
| Using the IID-1 synthetic coverage digests as the observed revision's versions | Different, synthetic revision; used only as proof that the report publishes the fields (§2.2). |
| Creating, substituting or reconstructing a corporate-action record | Manufacture of evidence is prohibited; the zero is a fact to be explained, not corrected (§3.5). |
| Treating `OPERATOR_SUPPLIED` as proof of roster authority | It is a label heuristic (§2.4). |
| Merging IRR PR #563 | Merge of completed IRR-side work; outside this pass and outside W04's authority. |
| Starting W05–W20 | Out of scope by instruction and by roadmap sequence. |
| Contacting any source holder | Requires the principal's authorization; no confirmation is claimed (§5.6). |
| Reading the `active` distribution to compute θI | θI additionally needs W05–W14 evidence that does not exist (§8). |
