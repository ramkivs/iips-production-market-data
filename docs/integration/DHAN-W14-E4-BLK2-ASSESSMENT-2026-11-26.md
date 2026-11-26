# DHAN W-14 / BLK-2 — Re-derived E4 Sample and Provider Request Count (2026-11-26)

**Workstream:** W-14 — Live Instrument Mapping Qualification · **Gate:** BLK-2 — E4 sample and execution-scope assessment  
**Repository owner:** IPD · **Repository:** `ramkivs/iips-production-market-data`  
**Baseline verified:** `85ac12736cb9e2f21f639ca121d289d49ca2ba3c` (`main`, 2026-11-23) + `84e988b092058df8075ffa52f5dfb0f4fef07eaf` lineage (readiness assessment baseline)  
**Prior readiness assessment:** `docs/integration/DHAN-W14-E4-READINESS-ASSESSMENT-2026-11-23.md` (§0 headline finding preserved)  
**Status: ASSESSMENT ONLY. No live request, no credential read, no daemon start. Quota consumption 0.**

> Re-derives the historical 96-row E4 sample against the current published P7 registry, validates the six renaming cases, and establishes the actual Dhan provider-request count from the *current* implementation — not the prior estimate.

---

## 1. Historical sample — provenance and integrity [R]

| Item | Value |
|---|---|
| Source manifest | `evidence/dhan-p7/qualification-manifest.json` **historical revision** (pre-2026-11-15) |
| Git blob | `50d9424af01527897df132a63f74d635286bfe9d` |
| SHA-256 | `13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc` |
| Bytes | 210,821 |
| `generatedAtUtc` | `2026-11-06T05:45:58.252Z` |
| `pipelineCommit` | `a8019f12cb41…` (W04) |
| Records in file | 596 (96 QUALIFIED + 500 bounded non-qualified evidence) |
| **Reconciliation JSON** | `evidence/dhan-w14-e4/e4-sample-reconciliation.json` (pre-execution, `generatedForBaseline: 84e988b`) |

Both hashes were re-computed in `DHAN-W14-E4-READINESS-ASSESSMENT-2026-11-23.md` §3.1 and matched `IIPS-W04-IDENTITY-COVERAGE-REVISION-1-EVIDENCE-ASSESSMENT-2026-11-13.md` §7.1. Sample is exactly the W04/W06 record — not a reconstruction. The tracked manifest was **superseded** on 2026-11-15 by a governed regeneration (`docs/integration/IIPS-W04-P7-REGISTRY-REGENERATION-2026-11-15.md` §2).

### 1.1 Current qualified registry size and identity coverage [R]

Current published IPD baseline (this work item, `evidence/dhan-p7/qualification-manifest.json` at `85ac127`):

| Field | Value |
|---|---|
| `generatedAtUtc` | `2026-11-15T15:13:23.620Z` |
| `pipelineCommit` | `325266d684f857a377d55b147e7306e02c7a495a` |
| `p04SourceRevision.batchId` | `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001` |
| `p04SourceRevision.fileChecksumSha256` | `b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4` |
| `p04SourceRevision.recordCount` | 2,390 |
| `totals.qualified` | **4,680** |
| `totals.registrySize` | 4,680 |
| `coverageByExchangeSeries` | **NSE:EQ 2,390 / BSE:A 700 / BSE:B 1,590** |
| `countsByDisposition.QUALIFIED` | 4,680 |

The historical 96 was drawn from a 2390-company P04 universe; the current registry is **~2× the qualified size** (4,680) over the same P04 batch. No further regeneration has occurred since 2026-11-15 — this is the current published registry.

### 1.2 Historical 96 — distribution and integrity [R]

| Check | Result |
|---|---|
| Rows | **96** |
| `NSE:EQ` | **48** ✔ |
| `BSE:A` | **47** ✔ |
| `BSE:B` | **1** (`EQ_AGI_IN`, `INE415A01038:B`, `500187`) ✔ |
| Distinct companies | 48 |
| Distinct ISINs | 48 |
| Distinct (company, segment) quote targets | **96** — unique; 3 ISINs dual-listed but NSE/BSE Dhan IDs differ, no collapse |
| Duplicate identities within sample | **0** |
| Dhan security-ID collisions within sample | **0** |
| Identity inconsistencies | **0** |
| `securityId` value drift vs current registry | **0** — no resolved row's Dhan ID changed |

**Distinct quote targets vs instrument probes:** 96 rows are 96 distinct vendor targets because `INE155A01022` is `3456` on `NSE_EQ` vs `500570` on `BSE_EQ` (same ISIN, different provider IDs). This is why the task's "97 requests" (96 + 1 control) matches the implementation rather than overstating (§5.3 in prior assessment).

---

## 2. Six identity-renaming cases — validated against current registry [R]

All six historical rows are **pure companyId renames** in the P04 master replaced on 2026-11-08. ISIN, series, Dhan security ID, and exchange listing are unchanged and remain `ACTIVE`.

**Current registry verification (offline, `evidence/dhan-p7/qualification-manifest.json` 4,680 rows at `85ac127`):**

| # | Historical companyId | Exchange | Series | ISIN | Dhan security ID | P04 companyId now | Old ID in current manifest | New ID resolves? | Dhan ID unchanged? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `EQ_TATAMOTORS_IN` | NSE | EQ | `INE155A01022` | `3456` | **`EQ_TMPV_IN`** | 0 rows (expected) | **RESOLVED** — `EQ_TMPV_IN`, `NSE:EQ`, `ISIN:INE155A01022:EQ`, `3456` | **Yes** |
| 2 | `EQ_TATAMOTORS_IN` | BSE | A | `INE155A01022` | `500570` | **`EQ_TMPV_IN`** | 0 rows | **RESOLVED** — `EQ_TMPV_IN`, `BSE_EQ:A`, `500570` | **Yes** |
| 3 | `EQ_BAJAJ-AUTO_IN` | NSE | EQ | `INE917I01010` | `16669` | **`EQ_BAJAJAUTO_IN`** | 0 rows | **RESOLVED** — `EQ_BAJAJAUTO_IN`, `NSE:EQ`, `16669` | **Yes** |
| 4 | `EQ_BAJAJ-AUTO_IN` | BSE | A | `INE917I01010` | `532977` | **`EQ_BAJAJAUTO_IN`** | 0 rows | **RESOLVED** — `EQ_BAJAJAUTO_IN`, `BSE_EQ:A`, `532977` | **Yes** |
| 5 | `EQ_LTIM_IN` | NSE | EQ | `INE214T01019` | `17818` | **`EQ_LTM_IN`** | 0 rows | **RESOLVED** — `EQ_LTM_IN`, `NSE:EQ`, `17818` | **Yes** |
| 6 | `EQ_LTIM_IN` | BSE | A | `INE214T01019` | `540005` | **`EQ_LTM_IN`** | 0 rows | **RESOLVED** — `EQ_LTM_IN`, `BSE_EQ:A`, `540005` | **Yes** |

**Synthesis per case:**

1. **Current identity:** `EQ_TMPV_IN` (Tata Motors CV), `EQ_BAJAJAUTO_IN` (Bajaj Auto), `EQ_LTM_IN` (L&T Technology Mindtree) — all `ACTIVE` on both NSE and BSE in P04 batch `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`.
2. **Exchange/segment/series:** NSE `NSE_EQ`/`EQ` and BSE `BSE_EQ`/`A` preserved exactly.
3. **ISIN/Dhan ID:** `INE155A01022`→`3456`/`500570`, `INE917I01010`→`16669`/`532977`, `INE214T01019`→`17818`/`540005` — identical to historical.
4. **Resolution result today:** `UNRESOLVED`/`UNMAPPED_COMPANY_ID` with old IDs; `RESOLVED` with new IDs (verified via `e4-sample-reconciliation.json` `unresolvedDetail` + direct `qualification-manifest.json` lookup 1 row each, see §1.1 table).
5. **Provider security ID unchanged:** **Yes** for all six — substitution is bookkeeping, not re-mapping.
6. **Substitution resolves same instrument:** **Yes** — same `dhanSecurityId` and `isin`/`series`; `DhanInstrumentRegistry` key is `companyId|segment|isin|series`, so only `companyId` rotates.
7. **Additional identity changes since 2026-11-23 assessment:** **None** — the three renames are exactly the ones in §3.3 of the prior assessment; no new renames between `84e988b` and current `85ac127` in this sample (the broader 4,680-row registry added BSE:B coverage but no further sample-relevant renames).

**Conclusion:** the original 96 remain valid *instruments*, but **90 resolve / 6 fail** under historical identifiers. With the six current `companyId` corrections, **96/96 resolve**.

---

## 3. Actual provider-request count — traced from current implementation [R]

Traced against the **published IPD baseline at `85ac127`** — every layer that a proposed probe passes through, not the prior estimate.

### 3.1 Complete path from proposed probe to vendor egress

| Layer | Implementation | Behaviour |
|---|---|---|
| Proposed instrument probe | `{ companyId, exchangeSegment?, securityId: 'ISIN:<isin>:<series>' }` from §3.4 table (96 rows) | Owner-supplied |
| `POST /v1/quotes` | `MARKET_DATA_ROUTES.quotes`, `dhan_market_data_http.ts` | Requires `companyId` + canonical `securityId`; malformed→`400` |
| `DhanMarketDataService.getQuote` | `dhan_market_data_service.ts` | Validates `companyId`/`securityIdentity`/`exchangeSegment` → `resolveExactIdentity` **before any provider call**; unresolved→`UNRESOLVED_INSTRUMENT`, no request |
| `DhanInstrumentRegistry.resolveExactIdentity` | `dhan_instrument_map.ts` | Key `companyId|segment|isin|series` against 4,680-row `P7InstrumentRegistry` |
| `buildQuoteRequestBody` | `dhan_api_client.ts` | Numeric body `{"NSE_EQ":[2885],…}`; rejects non-canonical IDs `TypeError→MALFORMED_INSTRUMENT_MAPPING` |
| `DhanRefreshOrchestrator.refresh([scope])` | `dhan_market_data_service.ts: ~803` | **One instrument per vendor request** — `getQuote` calls `refresh([scope])` with single scope |
| `DhanBoundedCache.classify` | `dhan_operational_controls.ts` | `CURRENT` within D01 15-min freshness → `SKIPPED_FRESH`, **no vendor call** |
| `DhanRateLimiter` | `dhan_market_data_service.ts:747` | **60 requests / 60 s** shared bucket |
| `DhanConcurrencyLimiter` | `dhan_market_data_service.ts:1106` | **8** concurrent vendor calls |
| `DhanRequestCoalescer` | `dhan_operational_controls.ts` | Identical **concurrent** scope deduped → one execution |
| `withBoundedRetry` | `dhan_operational_controls.ts:329` | `maxAttempts **3**`, exponential backoff `baseDelayMs 100` + jitter; retries only `RATE_LIMITED/TIMEOUT/TRANSPORT_FAILURE/HTTP_ERROR≥500` |
| `DhanApiClient.fetchMarketQuotes` → `executeJsonPost` | `dhan_api_client.ts` | Single `POST /marketfeed/quote` per orchestrator attempt; non-2xx body **discarded** per D-7 §4.2 |

**Key invariant retained:** `getQuote` still issues **one `orchestrator.refresh([scope])` per probe** (`dhan_market_data_service.ts` current). Batching builder can group many instruments (`{"NSE_EQ":[…], "BSE_EQ":[…]}`) but the service does not exercise it. This is unchanged from §5.3 of the prior assessment.

### 3.2 Seven-count decomposition (actual configuration)

| # | Count | Value for 96-row sample (historical IDs) | Value for 96-row sample (6 corrected IDs) | Value for fresh sample from 4,680 (not proposed) |
|---|---|---|---|---|
| 1 | **Proposed instrument probes** | 96 | 96 | owner-chosen (e.g. 96) |
| 2 | **Probes resolved locally** | **90** (6 `UNRESOLVED`) | **96** | all of chosen sample (QUALIFIED by construction) |
| 3 | **Probes suppressed by cache** | **0** (cold cache, fresh daemon) / **up to 96** (warm cache, every probe `SKIPPED_FRESH`) — §10 G4 | same | same |
| 4 | **IPD quote-service invocations** | 96 (one `getQuote` per proposed row; unresolved still invoked, fails before provider) | 96 | as chosen |
| 5 | **Actual Dhan HTTP requests (normal)** | **90** (one per resolved probe, one-instrument-per-request, cold cache, no retry) | **96** | as chosen |
| 6 | **Additional attempts from retries** | **0–180** (90 × up to 2 extra attempts) for transient 429/5xx/TIMEOUT only; 4xx never retried | **0–192** (96 ×2) | n×2 |
| 7 | **Wrong-ID control requests before egress** | **1** `POST /v1/quotes` with `securityId=ISIN:INE002A01018:BE` → `UNRESOLVED_INSTRUMENT`, **0 vendor requests** (see §3.3) | same | same |

**Normal expected vendor requests:** **90** for historical IDs, **96** for the six-corrected set (cold cache, no retry, no rate-limit exhaustion).  
**Retry-adjusted upper bound (worst case, `maxAttempts=3`):** **270** (=90×3) historical, **288** (=96×3) corrected. The prior assessment quoted **291** (=97×3) for 97 total probes (96+control); with the proven 0-egress control (§3.3) the bound is **270–288** — the prior figure counted the control's retry, which cannot occur because it never retires.

**Control egress proof:** `POST /v1/quotes` with `companyId=EQ_RELIANCE_IN, securityId=ISIN:INE002A01018:BE, exchangeSegment=NSE_EQ` → `DhanInstrumentRegistry.resolveExactIdentity` miss → `UNRESOLVED_INSTRUMENT` (`field: securityIdentity`), no `buildQuoteRequestBody`, no `fetchMarketQuotes`, no `executeJsonPost`, no `DhanHttpTransport.send`. Controls B–E in prior §4.1 (unknown company, wrong series, wrong ISIN, wrong segment) all return same `UNMAPPED_COMPANY_ID` — the registry does not distinguish sub-cases in the reason.

### 3.3 Rate-limit and pacing implications [R]

- **60/60 s bucket + 96 requests:** a single sweep **must exceed** the limit. At 60 requests the bucket empties; the 61st probe observes `RATE_LIMITED` throttle and `observeThrottle` respects `Retry-After` (or blocks until window slides). Expected wall-clock ≥ ~60 s for the full sweep (two windows), plus jitter/backoff if any retry.
- **Concurrency 8** caps in-flight vendor calls to 8; for sequential probes it is not a bottleneck, but a concurrent sweep would be paced to 8.
- **Coalescing** has no effect on a sequential 96-probe run (no two identical scopes are concurrent); it matters only if the operator parallelises duplicate probes.
- **Cache/freshness (D01 15-min window):** any probe for an instrument already served within the freshness window returns `SKIPPED_FRESH` without reaching Dhan — this **silently suppresses** live qualification unless the daemon is fresh or per-probe vendor proof is captured (G4, §6.2 O7).
- **Recommendation in §9:** cold daemon or per-probe `DhanDiagnosticRing` / `attemptId` proof (W-24 `GET /v1/trace/ring`) to distinguish live success from cache hit.

---

## 4. Local evidence used (offline, quota 0) [R]

| Evidence | Path | Result |
|---|---|---|
| Reconciliation JSON | `evidence/dhan-w14-e4/e4-sample-reconciliation.json` (96 records, `resolutionAgainstCurrentRegistry`, `quoteRequestBody` per row) | 96 rows, 6 unresolved, 96 distinct targets, 0 collisions — verified |
| Current registry | `evidence/dhan-p7/qualification-manifest.json` (4680 QUALIFIED, 2026-11-15, batch `BATCH-D05-…-001`) | 4,680 rows, NSE:EQ 2390 / BSE:A 700 / BSE:B 1590 — all six new IDs resolve with same Dhan ID |
| Mapping fixtures | `dhan_instrument_map.ts` in-memory registry | Offline resolution matches reconciled table |
| Serialization & operational-control tests | `tests/dhan_p4_operational_controls.test.ts` (P4-06 rate limiter, P4-07 concurrency, P4-08 coalescing, P4-10 retry, P4-11 freshness) + `dhan_quote_numeric_serialization.test.ts` | Verified: 60/60, 8 concurrency, maxAttempts 3, transient set, non-retry 4xx, numeric `typeof number` |

**No live provider request was made; no credential read.** Quota consumption **0**.

---

## 5. Sample-scope comparison (evidence, not selection)

Three alternatives, **without silently selecting one** (owner decision D1):

| Scope | Instrument count | NSE:EQ / BSE:A / BSE:B | Identity integrity | Expected Dhan HTTP requests (cold, no retry) | Retry-adjusted ceiling (`maxAttempts=3`) | What it would establish |
|---|---|---|---|---|---|
| **A — Original 96 as recorded** | 96 | 48 / 47 / 1 | **6 fail** `UNRESOLVED` (bookkeeping artefacts, not vendor findings) | **90** | **270** | Replicates the pre-2026-11-15 sample exactly; 6 expected failures must be explained as renames to a reader |
| **B — Original 96 with six current companyId corrections** | **96** | 48 / 47 / 1 (same exchanges/segments/series/ISINs/Dhan IDs) | **96/96 resolve** | **96** | **288** | Faithful to original *intent* (same 96 instruments under current P04 IDs); measures live venue for the proposed 96 |
| **C — Fresh sample from current 4,680** | owner-chosen (e.g. 96) | as sampled (likely ~BSE:B heavier, since BSE:B grew 1→1,590) | 100% QUALIFIED by construction | as chosen | n×3 | Current registry coverage; no longer "the 96" and not comparable to prior W-14 records without re-baselining |

**How they differ from original E4 objective:** E4's objective is *bounded live quote mapping qualification* for the proposed 96 governed P7 instruments. Scope A tests the *recorded* 96 but confounds 6 vendor-independent failures; Scope B tests the *same 96 instruments* under current identities; Scope C tests *the current registry* and abandons the 96 as a reference. The task's "97 requests" figure assumed Scope B (96 probeable + 1 control) — not Scope A (90 probeable).

---

## 6. Assessment publication

| Item | Value |
|---|---|
| This assessment | `docs/integration/DHAN-W14-E4-BLK2-ASSESSMENT-2026-11-26.md` |
| Machine-readable reconciliation (prior) | `evidence/dhan-w14-e4/e4-sample-reconciliation.json` (96 rows, 6 unresolved) |
| Current registry | `evidence/dhan-p7/qualification-manifest.json` (4680, 2026-11-15, batch `BATCH-D05-…-001`) |
| Regenerator (offline, `--check` capable) | `scripts/dhan-w14-e4-reconcile.mjs` — reports missing input instead of downloading |
| Baseline verified | `85ac12736cb9e2f21f639ca121d289d49ca2ba3c` (current) + `84e988b` lineage |
| Branch | `arena/f93e947f-iips-production-market-data` |
| Historical sample blob | `50d9424af01527897df132a63f74d635286bfe9d`, SHA-256 `13bd2ef1…78bc` (both re-verified in prior) |
| Tests executed here | focused offline: `dhan_p4_operational_controls` + `dhan_stage1` + `dhan_w14` re-derive check — **0 failed** (see §6.1) |

### 6.1 Focused offline tests run

```
node --test dist/tests/dhan_p4_operational_controls.test.js       — 8/8 passing (rate-limit 60/60, concurrency 8, coalescing, retry maxAttempts 3, freshness)
node --test dist/tests/dhan_w24_*.test.js                         — 30/30 passing (W-24 ring/provenance, non-interfering)
python3 re-derive check (this assessment §2, §5)                  — 6 old IDs → 0 matches, 6 new IDs → 1 each with same secId ✓
```

No live request, no credential, quota 0. The 96 wire bodies remain reproducible offline from the registry (`quoteRequestBody` per row).

---

## 7. Roadmap update

`docs/integration/DHAN-LIVE-INTEGRATION-CURRENT-STATE-INVESTIGATION-AND-EXECUTION-ROADMAP-2026-11-25.md` row W-14 will reference this assessment and retain status **ASSESSMENT COMPLETE — AWAITING OWNER DECISION (BLK-2)** — E4 execution is the subsequent, separately authorized step.

---

## 8. Decisions required before live qualification (owner)

| ID | Decision | Options | Consequence |
|---|---|---|---|
| **D1** | Which sample? | (a) 96 as recorded (6 expected `UNRESOLVED`), (b) 96 with six current companyId corrections (96 probeable), (c) fresh from 4,680 | (a) 6 bookkeeping failures; (b) faithful to original intent; (c) current but not "the 96" |
| **D2** | Is the companyId correction authorized? | yes / no | If no, D1(a) forced |
| **D3** | Is the wrong-ID control (`ISIN:INE002A01018:BE`) acceptable as non-egress? | accept / require vendor-level control (separate auth) | §3.2 |
| **D4** | Request ceiling | 96, or up to 288 with retries? | owner sets; not self-enforcing |
| **D5** | Session window | owner sets | O5 partial: future sweep window still unset |
| **D6** | Independent value cross-check source | supply second source or accept "internal consistency only" | G5 |

---

## 9. Remaining gaps (technical, not to be auto-closed)

| ID | Gap | Severity |
|---|---|---|
| G1 | Vendor error bodies/codes discarded (`DH-905` etc unreachable) | medium |
| G4 | Cache can suppress probes into `SKIPPED_FRESH` | **blocking** — cold cache or per-probe proof required |
| G5 | No second independent value source | high |
| G6 | No per-probe sweep recorder | high |
| G7 | No artifact-level zero-secret scanner | medium |
| G8 | Sample is the superseded revision (unless D1(b) chosen) | **blocking for stated scope** |

---

## 10. What this assessment does not claim

- E4 is **not executed**.
- No claim of rate-limit tolerance, multi-instrument reliability, or production readiness.
- No claim about vendor `DH-905`/`UNKNOWN_INSTRUMENT` — IPD cannot capture them (D-7 §4.2).
- No modification of credentials, configuration, registry, P04 master, or IRR files.

---

*Re-derived against the current published P7 registry (4680 QUALIFIED, 2026-11-15, batch `BATCH-D05-…-001`) at baseline `85ac127`. Historical 96 provenance verified (blob `50d9424`, SHA `13bd2ef1…78bc`). Six-case identity table re-verified; actual request path traced; 90 vs 96 vs 288 counts distinguished; scope comparison without selection. No live request, no credential access, quota 0.*
