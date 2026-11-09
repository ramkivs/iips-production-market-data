# IRR Stage 3A — Authoritative Portfolio Holding Identity Source Assessment

**Status:** Investigation complete — read-only documentation proposal. No source/schema/migration/dependency/PR modified. IRR repo (`ramkivs/iips-review-recovered`, main `820e7efc`) verified unchanged; remote HEAD verified unchanged. IPD repo (`ramkivs/iips-production-market-data`) unchanged except this document.

**Decisional question:** What is the authoritative source and lifecycle for the exact security identity — ISIN, series, listing exchange, company identity, canonical form `ISIN:<isin>:<series>` — associated with every persisted portfolio holding, and can IRR currently capture/store it?

---

## Bottom line up front

IRR does **not** hold an authoritative security identity for portfolio holdings, and **cannot currently construct or persist the exact required identity `ISIN:<isin>:<series>`**, because the `series` component is never captured by any IRR surface and is absent from every known broker export variant.

- Company-level identity (`companyId`) is captured as an optional IPD lookup hint only and is deliberately **not** re-exposed through IRR's wire surface.
- Security-level identity (`ISIN:<isin>:<series>`) is **never materialised** anywhere in the IRR chain: `series` is hard-coded `null` in `toHoldingObservation` (`frontend/server/investment/sources.ts`), and no DTO — `G2HoldingInput`, `BrokerObservedHoldingInput`, the IPC wire holding, or the UI preview row — carries a `series` field.
- IPD migration `005_holding_security_identity.ts` stores `security_identity TEXT = ISIN:<isin>:<series>` on `portfolio_holdings`, but IRR supplies no `series`, so that column can never be populated from IRR today.
- IRR's standing rule: **IRR never resolves, ranks, infers, or bypasses security identity; that authority belongs to the IPD-owned governed security master.** IRR refuses to save any holding whose identity is unresolved (`refuseUnresolvedPortfolioWrite`, GC-D2/2F; W-1 → `WRITE_NOT_AUTHORIZED`).

**Recommendation:** Treat the **IPD-governed D05 security master (master `BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001`)** as the authoritative source for `series` and for the canonical `ISIN:<isin>:<series>` security identity; treat **Dhan `DHAN_DETAILED_HOLDINGS_V1` (11-column CSV with ISIN + Exchange)** as the necessary but **insufficient** operator-supplied input, since it carries ISIN + Exchange but **no series**. No IRR-only change can close this gap; the change belongs on the IPD ingestion side (capture `series`, populate `security_identity` from the governed master), gated on operator supply of the detailed export. All acceptance criteria below must be met before any write path is enabled.

---

## Method and strict limits

- Read-only investigation only. No IRR source, schema, migration, dependency pin, PR #515/#516/#143, or dependency modified. No live Dhan access, no Dhan credentials, no vendor network requests from IRR, no quote retrieval/valuation, no portfolio UI/persistence changes, no production access/deployment.
- IRR repo cloned read-only to `/home/user/iips-review-recovered` at main `820e7efc`; working tree clean; remote HEAD verified unchanged.
- Company-level `companyId` distinguished from security-level `ISIN:<isin>:<series>` throughout.
- `companyId` is an IPD company lookup hint at most; IRR never treats it as proof of security identity.

---

## Evidence inventory (exact file/schema/API references)

| # | IRR artifact | Role in holding identity | Key identity fields |
|---|---|---|---|
| A | `frontend/server/user-portfolio/userPortfolioContract.ts` | G-2 IRR↔IPD durable portfolio consumption contract v1 | `G2HoldingInput`: `symbol`, `companyId?`, `isin?`, `exchange?` ('NSE'\|'BSE'), quantities, prices, `active`, `sourceBroker`, `lineageDigest`, `rawIdentifier?`, `identityStatus?`, `resolutionDisposition?`; **NO `series`** |
| B | `frontend/server/user-portfolio/userPortfolioPort.ts` | IRR-side `UserPortfolioPort` (7 read/save lifecycle ops) | `saveHoldings`, `getPortfolio`, `listPortfolios`, `deletePortfolio`, etc.; save refuses unresolved |
| C | `frontend/server/user-portfolio/userPortfolioBoundary.ts` | IRR boundary; `saveHoldings` refuses unresolved writes unconditionally (GC-D2/2F) | `refuseUnresolvedPortfolioWrite()` → `WRITE_NOT_AUTHORIZED` / `REFUSED_UNRESOLVED_IDENTITY`; `savedRows` stays 0 |
| D | `frontend/server/user-portfolio/translationBoundary.ts` | `prepareUnresolvedHoldingEvidence`, `refuseUnresolvedPortfolioWrite`, caller-authority refusal | Per-row identity evidence; no series captured |
| E | `frontend/server/user-portfolio/ipcPortAdapter.ts` | IPC adapter; `toWireHolding` strips canonical identity before wire | Strips `companyId`, `identityStatus`, `resolutionDisposition`, `lineageDigest`, `rawIdentifier`, `weightPercentage`; sends `symbol`, `isin`, `exchange`, quantity, prices, `active`, `sourceBroker`; **NO `series`** |
| F | `frontend/server/investment/sources.ts` (`toHoldingObservation`) | IID-1 holding → identity observation (coverage view) | Explicitly `series: null`; `isin`, `exchange`, `companyIdHint`, `upstreamStatus`; **series never populated** |
| G | `frontend/server/investment/portfolioContext.ts` (`isMeasured`) | IID-4 disposition context | `isMeasured` requires `identityStatus !== 'UNRESOLVED'`; unresolved holdings → `unmeasuredWeightPct` |
| H | `frontend/server/broker-import/brokerImportBoundary.ts` | CAP-02 broker-import HTTP DTO validation | `BrokerObservedHoldingInput`: `symbol`, `isin?`, `exchange?`, quantities; **NO `series`**; refuses canonical identity keys inside holdings (W-6/C7) |
| I | `frontend/server/broker-import/brokerImportHttp.ts` | Broker-import HTTP route | W-1 refusal → 503 `WRITE_NOT_AUTHORIZED`; `REFUSED_UNRESOLVED_IDENTITY`/`REFUSED_STORE_GUARD` → 422; opaque `portfolioId` validation only |
| J | `frontend/src/api/brokerHoldingsPreview.ts` + `BrokerHoldingsPreview.tsx` | Browser preview of broker CSV (Dhan Detailed/Web UI, Zerodha, Groww) | Row exposes `isin`, `exchange`; **no series**; `canSave: false`, `persisted: false`; identity authority = IPD governed D05 master |
| K | `frontend/server/persistence/persistence-service.ts` | PF-1 filesystem journal authority | Consumer-neutral, not holdings-specific; no identity capture |
| L | IPD `src/persistence/migrations/005_holding_security_identity.ts` | Durable migration on IPD side | Adds `security_identity TEXT` (`ISIN:<isin>:<series>`, NULL = unresolved) to `portfolio_holdings`; additive; **no inference/backfill**; IRR supplies no `series` |

No identity **correction** or **enrichment** workflow exists anywhere in IRR. Searches for enrich/correct/amend identity found only refusal paths (`REFUSED_UNRESOLVED_IDENTITY`, `NO_AUTHORITATIVE_IDENTIFIER_MATCH`, P04 quarantine) and the whole-import save refusal.

---

## Findings per investigation point

### 1. Durable schema / migrations (IPD 005 adds `security_identity TEXT`)

IPD migration `005_holding_security_identity.ts` (path L) adds a single additive column:

```sql
security_identity TEXT  -- canonical form ISIN:<isin>:<series>; NULL = unresolved
```

on `portfolio_holdings`. It is explicitly **additive, no inference, no backfill**. IRR itself has no durable holding schema — G-2 assigns the durable store to IPD; IRR consumes via the consumption contract (A). IRR's `G2HoldingInput`/`G2HoldingView` carry `isin?`, `exchange?`, `companyId?` but **no `series`**, so IRR cannot populate `security_identity` from its own data. The column exists on the IPD side but is fed nothing usable by IRR today.

### 2. G-2 nullable identity handling

`G2HoldingInput`/`G2HoldingView` (A): `symbol` required; `companyId`, `isin`, `exchange` all optional/nullable; `identityStatus` and `resolutionDisposition` optional metadata. Nullable identity means an import can arrive with `symbol` only, no ISIN/exchange, and no way to form `ISIN:<isin>:<series>`. `companyId` is company-level and is an IPD lookup hint at most (F comment), never proof of security identity. There is **no field for series**, so even a fully-populated `isin`+`exchange` cannot be upgraded to the required security-level identity.

### 3. Broker import / detailed-holdings ingestion

`brokerImportBoundary.ts` (H) validates `BrokerObservedHoldingInput` with `symbol`, `isin?`, `exchange?` — **no `series`**. The browser preview (J) ingests Dhan CSV variants via `BrokerImportIngressOrchestrator` against the IPD governed master; per-row identity is assessed IPD-side and published as `identityAssessments`/`identitySummary`. IRR never resolves identity itself. `toWireHolding` (E) strips canonical identity (`companyId`, `identityStatus`, `resolutionDisposition`) before wire, so even what IPD resolves is not echoed back through IRR. No `security_identity`/`series` flows from IRR to IPD.

### 4. 68-row Dhan summary limitation

`DHAN_WEB_UI_SUMMARY_V1` — 8-column header `Name, Quantity, Avg Price, Last Traded, Investment, Current Value, P&L, P&L %` — omits **both ISIN and Exchange**. Per `B04-DHAN-68-ISIN-NSE-REASSESSMENT-2026-11-06.md`: 68 native rows, 1 resolved (AGI Greenpac via governed alias `EQ_AGI_IN`), 67 unresolved, `savedRows: 0`, `saveable: false`, ISIN index **UNTESTED** for the 67 unresolved rows. The summary variant cannot support ISIN-based identity at all because it omits ISIN and Exchange.

### 5. Do detailed broker exports contain ISIN / series / exchange?

`DHAN_DETAILED_HOLDINGS_V1` — 11-column header `Trading Symbol, ISIN, Exchange, Total Qty, DP Qty, Available Qty, Average Buy Price, Last Traded Price, Current Value, Profit / Loss, P&L %` (per `WS-A-DHAN-DETAILED-HOLDINGS-EXTERNAL-DEPENDENCY-2026-11-05.md` §1.1). It contains **ISIN + Exchange but NO `series` column**. The detailed export does not exist in either repo (BLOCKED-EXTERNAL; operator must supply). Even when supplied, it cannot yield `ISIN:<isin>:<series>` because `series` is absent. Zerodha/Groww variants are preview-supported but out of scope for the Dhan identity question; none are known to carry series.

### 6. Identity capture vs persistence vs reconstruction

- **Captured during import:** broker-observed `symbol`, `isin?`, `exchange?` (H, J); `companyId?` only if IPD supplies it (never re-exposed by IRR per E).
- **Persisted:** nothing durable on the IRR side (G-2 → IPD owns the durable store); `savedRows` always 0 (C, J).
- **Reconstructed:** never. IRR never resolves identity, never ranks candidates, never widens namespaces, never infers from company-name similarity (J header comment). `toWireHolding` strips canonical identity before wire (E). `security_identity` on IPD's `portfolio_holdings` can only be populated by IPD's governed master, and IRR supplies no `series` to feed it.

### 7. Multiple securities / listings per company

`exchange` ('NSE'\|'BSE') is the only listing disambiguator IRR carries, and it is optional. There is **no `series` field**, so multiple series of the same ISIN (e.g. different coupon/maturity tranches) cannot be distinguished at the security level. `companyId` (company-level) is distinct and cannot substitute for security-level `ISIN:<isin>:<series>`. Multi-security-per-company is therefore not supported at the exact required identity granularity.

### 8. Identity correction / enrichment workflows

**None exist.** Refusal-only behavior:
- `refuseUnresolvedPortfolioWrite()` (C) refuses all unresolved saves unconditionally; `WRITE_NOT_AUTHORIZED` outcome, `savedRows` 0.
- W-1 (I): `WRITE_NOT_AUTHORIZED` → 503 `{outcome, storeEffect:'NONE'}`; hard-false, no retry/rewrite admitted.
- P04 quarantine: unresolved rows quarantined with `NO_AUTHORITATIVE_IDENTIFIER_MATCH`; whole-import refusal masks per-row outcomes unless the pin publishes an assessment vector (J).
- `REFUSED_UNRESOLVED_IDENTITY` / `REFUSED_STORE_GUARD` → 422 (non-2xx 2F refusal).
There is no enrichment, no correction, no manual override, and no identity-change path that preserves quantities/cost basis/transactions/revisions — because no write path is admitted at all while identity is unresolved.

### 9. UI / server API exposure of exact identity

UI preview (J) exposes per row: `symbol`, `isin`, `exchange`, quantity, prices, `identityStatus`, refusal codes, lookups, `missingEvidence`. **No `series`, no `companyId`** (deliberately: "the canonical company identity the governed master resolved is deliberately NOT re-exposed"). `canSave: false`, `persisted: false`, `mode: 'NATIVE_BROKER_PREVIEW'`. Server-side `G2HoldingView` exposes `isin?`, `exchange?`, `companyId?`, `identityStatus?`, `resolutionDisposition?` but **no `series`**. The exact identity `ISIN:<isin>:<series>` is never exposed, never persisted by IRR, and never reconstructable client-side.

### 10. Identity changes without altering quantities / cost basis / transactions / revisions

Not applicable — no such path exists. W-1 hard-false (`WRITE_NOT_AUTHORIZED`, `storeEffect:'NONE'`) and GC-D2/2F refuse any unresolved save. Since identity can't be captured (`series` absent) and no write is admitted while unresolved, there is no mechanism to change identity independent of quantities/cost basis/transactions/revisions. Any future identity change must go through IPD's governed master and IPD's durable store, with IRR's save-refusal behavior unchanged.

---

## Sources and their identity character

| Source | Authoritative? | Broker-supplied? | Derived/inferred? | ISIN+series+exchange support |
|---|---|---|---|---|
| IPD governed D05 security master (master `BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001`, 2250 entities, checksum `7f53540b…`) | **Yes** — only authoritative identity source | No | No | **series available via master** (the source that can assign series) |
| Dhan `DHAN_DETAILED_HOLDINGS_V1` (operator-supplied) | No | Yes | No | ISIN + Exchange yes; **series NO**; does not exist (BLOCKED-EXTERNAL) |
| Dhan `DHAN_WEB_UI_SUMMARY_V1` (68-row) | No | Yes | No | ISIN + Exchange **omitted**; series NO; 67/68 unresolved |
| IRR `G2HoldingInput`/`G2HoldingView`/wire/UI preview | No (consumes only) | Partially (isin/exchange) | No | **series NO**; companyId company-level only |
| IPD migration 005 `security_identity` column | Storage target (IPD side) | No | No (additive, no inference) | Stores `ISIN:<isin>:<series>` but IRR supplies no `series` |

`companyId` (company-level) vs security-level `ISIN:<isin>:<series>`: distinct and never conflated. IRR never treats `companyId` as proof of security identity (F).

---

## Unresolved dependencies (blocking)

1. **`DHAN_DETAILED_HOLDINGS_V1` does not exist** in either repo (BLOCKED-EXTERNAL). Operator must supply the 11-column CSV with ISIN + Exchange. Even then it lacks `series`, so it is necessary but insufficient for `ISIN:<isin>:<series>`.
2. **A-5 → A-6 → A-7 sequence is strict and externally blocked:** `DHAN_DETAILED_HOLDINGS_V1` availability (A-5) → security master expansion/deposition act (A-6) → new master revision (A-7). Master `BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001` is UNCHANGED; 100% resolution only for entities already present.
3. **ISIN index for the 67 unresolved 68-row summary rows is UNTESTED** — the summary omits ISIN entirely, so the index cannot be applied without re-export.

> **CORRECTION-2026-11-09 (append-only; the text above is retained verbatim).** Two statements above
> are stale. (a) §4 cites `B04-DHAN-68-ISIN-NSE-REASSESSMENT-2026-11-06.md`, which **does not exist in
> this repository** (`git ls-files` returns nothing); the superseding records are
> `evidence/cross-repository/IIPS_V3_D05_B06_ROOT_CAUSE_INVESTIGATION_2026-11-08.md` and the §9-A
> reassessment evidence. (b) The ISIN index is **no longer untested**: under a one-time PA-authorized
> reassessment, exact-ISIN lookup resolved **65/68** against the authenticated master, with rows 44,
> 51 and 63 failing closed as out-of-universe. The **1/68** figures above and in §4 are correct
> measurements against the **Wave-1** master on the **name surface**; they are not current for the
> authenticated master, and they are not the same measurement as 65/68. Full reconciliation:
> `docs/integration/BROKER-IMPORT-IDENTITY-RECONCILIATION-AND-W1-ADMISSION-ASSESSMENT-2026-11-09.md`
> §1. No identity rule, alias or universe scope was changed by that reassessment.
4. **`series` capture:** no IRR surface or broker variant captures `series`; IPD ingestion must be extended to accept and store it.

Decision owner: **IPD platform identity team (D05 governed security master)** — IRR cannot unilaterally resolve identity (standing rule) and cannot supply `series`.

---

## Recommended path (proposal, not a change)

1. **Authoritative source:** IPD-governed D05 security master (`BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001` or its successor revision) assigns `series` and issues canonical `ISIN:<isin>:<series>` per security. IRR remains a pure consumer: never resolves, never infers, never bypasses.
2. **Operator input:** supply `DHAN_DETAILED_HOLDINGS_V1` (ISIN + Exchange) as the broker-observed input; treat the 68-row summary as insufficient (omits ISIN+Exchange; 67/68 unresolved).
3. **IPD-side ingestion change (out of IRR scope):** extend IPD holding ingestion to accept `series`, persist `security_identity = ISIN:<isin>:<series>` via migration 005's column (additive, no inference/backfill), and resolve conflicts against the governed master fail-closed. IRR must not be changed to infer or fabricate `series`.
4. **IRR behavior preserved:** `saveHoldings` continues to refuse unresolved writes (GC-D2/2F); `toWireHolding` continues to strip canonical identity; `companyId` remains company-level only; `canSave: false`/`persisted: false` in preview unchanged.
5. **No IRR source/schema/migration/dependency/PR changes** as part of this assessment.

---

## Acceptance criteria (gating any identity write path)

1. `series` is captured and stored as a distinct security-level field, separate from company-level `companyId`.
2. Every persisted holding can be assigned canonical `ISIN:<isin>:<series>` in `security_identity` (migration 005 column), populated only by the IPD-governed D05 master — never inferred or fabricated by IRR.
3. `DHAN_DETAILED_HOLDINGS_V1` (ISIN + Exchange) is operator-supplied and flows into IPD ingestion; the 68-row summary is not treated as sufficient for identity.
4. Multiple series of one ISIN are distinguishable; `exchange` disambiguates NSE/BSE listings where present.
5. IRR continues to refuse unresolved writes unconditionally (`WRITE_NOT_AUTHORIZED` / `REFUSED_UNRESOLVED_IDENTITY`, `savedRows: 0`); no enrichment/correction/write path is enabled until criteria 1–4 hold.
6. Identity changes (when later supported by IPD) proceed without altering quantities, cost basis, transactions, or portfolio revisions.

---

## Consequences if not addressed

- IRR cannot satisfy the exact required security identity `ISIN:<isin>:<series>` for any holding today, because `series` is never captured and neither Dhan variant supplies it.
- Migration 005's `security_identity` column remains permanently NULL for IRR-originated holdings (IRR supplies no `series`).
- All holdings remain unresolved at security level; `saveHoldings` refuses them; `savedRows` stays 0; the portfolio cannot be durably persisted from IRR until IPD supplies series via the governed master.

---

**Prepared for:** Gate 4 / PA decision record (consolidated paper `CONSOLIDATED-GATE4-HOLDINGS-IDENTITY-PA-DECISION-PAPER-2026-11-06.md`; D01–D06 pending; canonical portfolio repo = `ramkivs/iips-production-market-data`).

**Scope respected:** read-only documentation proposal. IRR remote main `820e7efc` verified unchanged; no IRR source, schema, migration, dependency pin, PR #515/#516/#143, live Dhan request, credential, quote/valuation, UI/persistence, or production change made.
