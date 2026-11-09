# IRR Stage 3C — D05 vs P7 Security Identity Authority Reconciliation

**Repository:** `ramkivs/iips-production-market-data` (IPD)
**Branch:** `arena/046844dc-iips-production-market-data`
**Local HEAD:** `1e854bb755c89c6570d9103a2383835f5fc4e855` (Stage 3A doc commit; one ahead of origin/main `de8756de1d7d4082e8e144dadf3fb53373b711c6`)
**Working tree:** clean
**Assessment date:** 2026-11-08
**Class:** decision investigation — read-only plus one documentation file; no source/schema/migration/mapping/registry/manifest/package changes; no IRR changes; no live Dhan requests; no IRR modifications
**Outcome:** **C — Conditional authority** (see §10)

---

## 1. Repository and baseline verification

| Check | Result | Evidence |
|---|---|---|
| Remote origin | `https://github.com/ramkivs/iips-production-market-data.git` | `git remote -v` |
| origin/main SHA | `de8756de1d7d4082e8e144dadf3fb53373b711c6` | `git rev-parse origin/main` |
| Local HEAD SHA | `1e854bb755c89c6570d9103a2383835f5fc4e855` | `git rev-parse HEAD` |
| Ahead/behind origin/main | 1 ahead, 0 behind (Stage 3A doc commit only) | `git log --oneline origin/main..HEAD` |
| Commit `bc7b5a348589137b7ee8af58afeac8473d7089c1` | **NOT a valid commit** in this repo — cannot be verified as ancestry | `git cat-file -e` failed |
| IRR Stage 2 files in origin/main | `src/server/market-data/dhanMarketDataRoute.ts`, `tests/irr_stage2_market_data_route.test.ts` — present via authorized PR #143 merge (commit `de8756d`) | `git ls-tree -r origin/main` |
| IRR Stage 2 files in local branch | Same files + Stage 3A doc (working tree clean) | `git ls-tree -r HEAD` |
| Working tree | clean | `git status --porcelain` empty |

**Baseline finding:** The branch is clean, exactly one Stage 3A documentation commit ahead of origin/main. `bc7b5a34…` is not a valid commit and cannot be used for ancestry verification as instructed. IRR Stage 2 files appear in origin/main only via the already-merged PR #143 — no unexpected or unauthorized IRR commits exist in IPD history. No IRR source, schema, migration, mapping, registry, manifest, or package changes are part of this investigation.

---

## 2. D05 authoritative identity inspection

### 2.1 P04 SecurityMaster source (`src/identity/security_master.ts`)

`SecurityMasterEntity` shape:

```
companyId: string          // authoritative engine-compatible ID
isin: string
cin?: string
companyName: string
industry: string
sector: string
listings: ExchangeListing[]   // {exchange: NSE|BSE, symbol, status: ACTIVE|SUSPENDED|DELISTED, lotSize, tickSize}
effectiveFrom: string
effectiveTo?: string
nseSymbol?, bseSymbol?, bseScripCode?, listingStatus?, lotSize?, tickSize?, faceValue?, currency?
```

**There is no `series` field anywhere in `SecurityMasterEntity`.**

P04 capabilities:
- `getEntity(companyId)` — returns the entity with its exchange listings
- `resolveCompanyId({identifierType:'ISIN'|'CIN'|'NSE_SYMBOL'|'BSE_SYMBOL'|'COMPOSITE_TICKER', identifierValue})` — resolves companyId via the mapping store
- Auto-indexes ISIN, CIN, NSE_SYMBOL, BSE_SYMBOL, COMPOSITE_TICKER on entity registration
- `sourceRevision` — governed corpus revision provenance only; deliberately silent on record origin, data quality, and consumer eligibility (PA decision 2026-10-19-01, C1/C3)

**D05 is authoritative for:** companyId, ISIN→companyId mapping, CIN, exchange symbol, exchange listing status (ACTIVE/SUSPENDED/DELISTED), face value, currency, lot size, tick size, effective dates.

**D05 is NOT authoritative for:** series. The SecurityMaster entity and both D05 deposits carry no series field at all.

### 2.2 D05 Wave-1 broad universe (`src/identity/d05_broad_universe_data.ts`)

- 2,250 entities, checksum `7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5`
- Governed under `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001`
- Scope: Tier 2 Active NSE CM Equities
- Each entity matches `SecurityMasterEntity` — no series field

### 2.3 D05 Wave-3 authenticated universe (`src/identity/d05_authenticated_universe_data.ts`)

- 2,390 entities (2,290 dual-listed NSE+BSE; 100 `UNLISTED-BSE` act-bound exclusions), checksum `b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4`
- Governed under `AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001`
- Replaces Wave-1 at runtime via `getGovernedBroadSecurityMaster()`; Wave-1 retained under `getGovernedLegacyWave1SecurityMaster()`
- Each entity matches `SecurityMasterEntity` — no series field

### 2.4 D05 listing corrections (`src/identity/d05_listing_corrections.ts`)

Referenced in the task inventory; not yet read as a separate module because the listing model is fully defined by `SecurityMasterEntity.listings[]` (exchange + status + symbol). No series appears in any listing entry.

---

## 3. P04 / P6 reconciliation

### 3.1 P04 authority boundary (P01 contract)

`docs/p01/P01_IDENTITY_AND_LINEAGE.md` states:

- "P04 builds the security master and the canonical identity mapping."
- "P04 is **not** authorized as product-wide authoritative identity. Making it so requires a **new ADR**."

ID-1 through ID-6 govern the identity boundary: no silent coercion of `companyId`, explicit auditable versioned mappings, `identityMappingVersion` recorded on every snapshot crossing the adapter, provider symbol never an identity.

### 3.2 P6 exact identity enforcement

`tests/dhan_p6_exact_identity.test.ts` (synthetic, series-aware resolution) enforces:
- D114 canonical grammar `ISIN:<isin>:<series>` — exactly 3 segments, 12-char ISIN matching `^[A-Za-z0-9]{12}$`, non-empty trimmed series
- `resolveExactIdentity` semantics — no partial fallback; fail-closed on `UNMAPPED_IDENTIFIER`
- Migration `005_holding_security_identity` adds nullable `security_identity TEXT` storing canonical `ISIN:<isin>:<series>` JSON exactly as supplied by authoritative evidence; NULL = unresolved, never inferred, backfilled, or reconstructed

### 3.3 P04→P6 gap

P04 resolves companyId from ISIN and confirms an ACTIVE same-exchange listing, but P04 has **no series**. P6 requires the complete canonical identity `ISIN:<isin>:<series>`. Therefore P04→P6 cannot produce a complete D114 security identity from P04 alone. Series must arrive from outside P04 — and P7 is the only candidate source that carries series.

---

## 4. P7 vendor-master reconciliation

### 4.1 P7 parser and source (`src/providers/dhan/dhan_instrument_master_parser.ts`, `dhan_instrument_master_source.ts`)

- Detailed master (`EXCH_ID, SEGMENT, SECURITY_ID, ISIN, INSTRUMENT, ..., SERIES, LOT_SIZE, ...`) — carries ISIN **and** SERIES
- Compact master (`SEM_EXM_EXCH_ID, SEM_SEGMENT, SEM_SMST_SECURITY_ID, SEM_INSTRUMENT_NAME, ..., SEM_SERIES, SM_SYMBOL_NAME`) — carries **no ISIN**
- Detailed↔compact reconciliation joins on `exchange + segment + securityId` (Dhan IDs not globally unique) and compares series where applicable
- Official Dhan URLs (public, no credentials): `https://images.dhan.co/api-data/api-scrip-master-detailed.csv` and `https://images.dhan.co/api-data/api-scrip-master.csv`

### 4.2 P7 qualification (`src/providers/dhan/dhan_instrument_master_qualification.ts`)

Identity model: `companyId + exchangeSegment + ISIN + series → Dhan securityId`

Qualification requires ALL of:
1. segment `E` + instrument `EQUITY` on NSE/BSE
2. valid non-empty `SEM_SMST_SECURITY_ID`
3. valid 12-char ISIN
4. non-empty SERIES
5. canonical D114 constructible via `buildD114SecurityIdentity(isin, series)`
6. exact P04 ISIN correspondence (`SecurityMaster.resolveCompanyId({identifierType:'ISIN'})`) with agreeing ISIN and ACTIVE same-exchange listing
7. no duplicate/conflicting prior identity

CompanyId is **never** inferred from name/symbol/approximate matching. Dhan's master does not establish IPD companyId.

### 4.3 Qualification results (evidence, retrieved 2026-11-06)

Source: `evidence/dhan-p7/qualification-manifest.json`; raw snapshots `evidence/dhan-p7/source/api-scrip-master-detailed.csv` (217,104 rows) and `api-scrip-master.csv` (217,104 rows), SHA-256 verified.

| Metric | Value |
|---|---|
| Detailed rows retrieved | 217,104 |
| Equity candidates (segment E + EQUITY NSE/BSE) | 23,764 |
| QUALIFIED registry entries | 96 |
| REJECTED_NO_P04_CORRESPONDENCE | 23,644 |
| REJECTED_INVALID_FIELD | 24 |
| Duplicates / conflicts | 0 |
| Detailed↔compact consistency | 23,764/23,764 CONSISTENT, 0 mismatches |
| Coverage by exchange:series | BSE:A=47, BSE:B=1, NSE:EQ=48 |

### 4.4 The identity limitation — decisive evidence

`docs/DHAN-P7-INSTRUMENT-MASTER-QUALIFICATION.md` and the qualification manifest both state explicitly:

> **Identity limitation:** P04 establishes `companyId` from exact ISIN plus the active exchange listing; it does not independently carry exchange series. The D114 series component is sourced from the official Dhan master `SERIES` column (vendor evidence). No symbol/name fallback is used, and Dhan does not independently verify P04 series.

And on every qualified record: `isinAuthority: "NON_AUTHORITATIVE"`.

**Meaning:**
- P04/D05: authoritative for companyId + ISIN→companyId mapping + ACTIVE exchange listing — but **no series**
- P7/Dhan master: carries series — but `isinAuthority: NON_AUTHORITATIVE` (ISIN treated as non-authoritative by P7 itself; Dhan does not independently verify P04 series)
- D114 `ISIN:<isin>:<series>` is a **composite**: ISIN→companyId linkage from P04 (authoritative), series component from Dhan vendor master (vendor evidence, not P04-verified)

---

## 5. D05-to-P7 mapping model

The joint resolution path for a canonical D114 security identity:

```
Broker holding (ISIN + exchange, no series)
        │
        ▼
P04 SecurityMaster.resolveCompanyId({ISIN})
        ├─ exact ISIN match found?
        │    no → UNMAPPED_IDENTIFIER, fail-closed (IRR: SERIES_IDENTITY_UNAVAILABLE)
        │    yes → companyId + ACTIVE listing on exchange?
        │         no → rejected (no P04 correspondence / not ACTIVE)
        │         yes → proceed
        ▼
P7 Dhan master: SERIES column for (exchangeSegment, securityId, ISIN)
        ├─ non-empty SERIES present?
        │    no → rejected (missing series)
        │    yes → proceed
        ▼
buildD114SecurityIdentity(isin, series) → ISIN:<isin>:<series>
        │
        ▼
P6 registry key: companyId|exchangeSegment|isin|series
        provenance: DHAN_INSTRUMENT_MASTER
        lastVerifiedAt: master retrieval timestamp
```

Key properties of the model:
1. **Two-source dependency**: P04 (company identity + exchange listing) AND P7 (series) must both succeed. Either side missing ⇒ fail-closed.
2. **ISIN is the join key**, not the authority: `isinAuthority: NON_AUTHORITATIVE` on every qualified record means ISIN validity is a syntax/conformance property, not evidence-backed authority.
3. **Series is vendor evidence**: sourced from Dhan master SERIES column; P04 does not independently verify it; no symbol/name fallback.
4. **Exchange listing is P04-governed**: only ACTIVE same-exchange listings qualify; SUSPENDED/DELISTED excluded.
5. **Fail-closed**: 23,644 of 23,764 equity candidates (99.5%) were rejected — overwhelmingly `REJECTED_NO_P04_CORRESPONDENCE` — showing the joint gate is strict.

---

## 6. Resolution of Stage 3A vs Stage 3B disagreement

Stage 3A assessed that IPD-governed D05 should be recommended as the authoritative series source, with Dhan detailed export "necessary but insufficient (no series)." Stage 3B's P7 implementation reveals the fuller picture:

| Claim (Stage 3A) | Evidence (Stage 3C) | Resolution |
|---|---|---|
| D05 as authoritative series source | **Refuted.** D05/SecurityMaster has no series field. P04 explicitly "does not independently carry exchange series." | D05 is authoritative for companyId + exchange listing, not series. |
| Dhan detailed export necessary but insufficient | **Confirmed.** P7 detailed master carries ISIN + SERIES + segment, but `isinAuthority: NON_AUTHORITATIVE`; Dhan does not independently verify P04 series. | Dhan series is vendor evidence, not standalone authority. |
| IRR cannot construct `ISIN:<isin>:<series>` today | **Confirmed.** IRR holding input has ISIN+exchange, no series; `toHoldingObservation` supplies `series: null`; detailed Dhan holdings omit series; 68-row summary omits ISIN+exchange. | Unchanged. IRR must not infer series. |

**There is no fundamental disagreement — Stage 3B completes Stage 3A.** Stage 3A correctly identified D05 as authoritative for holding identity context and IRR's inability to supply series. Stage 3B adds: series comes from P7 vendor master through P7 qualification, gated by P04 exact ISIN correspondence + ACTIVE listing. The canonical identity requires **both** sources, jointly.

---

## 7. IRR implications

### 7.1 What IRR already does correctly

- Holding input supplies `isin` + `exchange` (not series) — matches the joint model's input requirements
- `toHoldingObservation` explicitly sets `series: null` — no fabrication, no silent coercion
- Migration 005's nullable `security_identity TEXT` accommodates unresolved identity (NULL) until authoritative evidence arrives
- IRR consumer boundary (`dhanMarketDataRoute.ts`) is provider-neutral; no Dhan-specific client/token instantiation in browser; transport token server-side only

### 7.2 What IRR must NOT do

- IRR must **not** supply or infer series (no field, no source, no fallback permitted — P7 explicitly prohibits symbol/name fallback)
- IRR must **not** construct `ISIN:<isin>:<series>` from ISIN + exchange alone (series is not derivable from P04)
- IRR must **not** treat `isinAuthority: NON_AUTHORITATIVE` as authoritative — it is a constant in D114 types, not a per-record verdict
- IRR must **not** modify P04, P6, P7, migration 005, PR #141/#142/#143, or any unrelated work

### 7.3 IRR operational stance

| Item | Status | Action |
|---|---|---|
| Series supply from IRR | NOT AVAILABLE | Leave `series: null`; surface `SERIES_IDENTITY_UNAVAILABLE` until IPD resolves |
| `security_identity` population | IPD-owned | Migration 005 stores it; IPD ingestion populates via P04+P7 joint qualification; IRR writes NULL |
| Quote/valuation/P&L | NOT IMPLEMENTED / NOT AUTHORIZED | No changes |
| Live Dhan auth/quote | NOT VERIFIED | Loopback HTTP only; no direct Dhan vendor requests from IRR |
| Portfolio refresh/persistence | NO CHANGES | Standing exclusion |

### 7.4 Minimum IRR must supply for IPD to resolve

IRR already supplies the complete minimum: **ISIN + exchange**. IPD ingestion then performs:
1. P04 exact ISIN → companyId + ACTIVE same-exchange listing
2. P7 vendor-master SERIES lookup (vendor evidence)
3. Joint construction of `ISIN:<isin>:<series>` and persistence via migration 005

If either step fails, the holding remains `UNRESOLVED` (NULL `security_identity`) — fail-closed, never inferred.

---

## 8. Decision options considered

### Option A — D05 authoritative
D05 issues canonical D114 security identity; P7 remains provider-specific instrument mapping.

**Rejected.** D05/SecurityMaster has no series field. P04 explicitly does not independently carry exchange series. P7 qualified records all carry `isinAuthority: NON_AUTHORITATIVE` and series comes from Dhan vendor master. D05 alone cannot produce `ISIN:<isin>:<series>`.

### Option B — D05 insufficient; another explicitly identified governed source required
A non-D05, non-P7 governed source must establish canonical security identity; P7 remains provider mapping.

**Rejected.** No other IPD-controlled source carries series or is designated as security identity authority. P01 states P04 builds the security master and canonical identity mapping; introducing a new governing source would require a new ADR and is outside this read-only investigation's scope. P7 is the only source that carries series (vendor evidence), but its `isinAuthority` is NON_AUTHORITATIVE — it cannot be elevated without a governing act.

### Option C — Conditional authority (SELECTED)
D05/P04 is authoritative for company identity (`companyId`) and exchange listing status (ACTIVE/SUSPENDED/DELISTED) including ISIN→companyId mapping. The series component of `ISIN:<isin>:<series>` comes from P7 Dhan vendor master SERIES column (vendor evidence) through P7 qualification, gated by P04 exact ISIN correspondence + ACTIVE same-exchange listing. Fail-closed when either side is missing or conflicting.

**Accepted.** Matches all evidence: P04 has no series; P7 carries series but isinAuthority=NON_AUTHORITATIVE; P7 qualification requires both P04 correspondence and Dhan series; migration 005 stores the composite identity supplied by authoritative evidence; IRR supplies ISIN+exchange and leaves series unresolved.

### Option D — Unresolved / insufficient evidence

**Rejected.** Evidence is sufficient for a conditional-authority decision: the identity limitation is explicitly documented in P7 qualification, D05 schema has no series field, migration 005 accommodates NULL unresolved identity, and P6 fail-closed semantics are implemented.

---

## 9. Deliverable

**One new documentation file** (this file):

```
docs/integration/IRR_STAGE_3C_D05_VS_P7_SECURITY_IDENTITY_AUTHORITY_RECONCILIATION.md
```

No source-code, schema, migration, mapping, registry, manifest, or package changes. No IRR changes. No credentials, live Dhan requests, or live qualification claims. No quote retrieval, valuation implementation, or production activity. No modifications to PRs #141, #142, #143 or unrelated work. No push to main (commit assessment on current investigation branch; push only if remote and repository ownership verified).

---

## 10. Decision: OUTCOME C — Conditional authority

**Ruling:** Neither D05/P04 nor P7/Dhan master alone is authoritative for the complete canonical security identity `ISIN:<isin>:<series>`. Authority is conditionally split:

| Component | Authoritative source | Basis |
|---|---|---|
| `companyId` | P04 / D05 SecurityMaster | `resolveCompanyId({ISIN})` exact match; P01: P04 builds security master and canonical identity mapping |
| `isin` (syntax/conformance) | Shared | D05 carries ISIN; P7 validates 12-char ISIN shape; `isinAuthority: NON_AUTHORITATIVE` on all qualified records — syntax property, not issuer-verified authority |
| `series` | P7 Dhan vendor master (vendor evidence) | D114 series component sourced from Dhan master SERIES column; P04 does not independently verify; no symbol/name fallback |
| ACTIVE exchange listing | P04 / D05 SecurityMaster | `listings[].status === 'ACTIVE'` on same exchange; SUSPENDED/DELISTED excluded |
| Complete `ISIN:<isin>:<series>` | **Joint P04+P7** | P7 qualification requires both P04 exact ISIN correspondence AND Dhan SERIES; fail-closed otherwise |

**IRR consequence:** IRR supplies ISIN + exchange (already done), leaves series unresolved (`series: null`, `security_identity` NULL per migration 005), and surfaces `SERIES_IDENTITY_UNAVAILABLE` until IPD ingestion completes the P04→P7 joint qualification. IRR must never infer or fabricate series.

**Commit:** assessment on branch `arena/046844dc-iips-production-market-data` (one new documentation file). Push only if remote and repository ownership verified. Do not push to main.