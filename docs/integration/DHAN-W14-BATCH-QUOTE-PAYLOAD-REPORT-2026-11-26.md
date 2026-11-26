# W-14 — 96-Instrument Batch Quote Payload (Scope B) — Evidence Report (2026-11-26)

**Workstream:** W-14 Live Instrument Mapping Qualification · **Gate:** E4 payload construction (Scope B)  
**Repository:** `ramkivs/iips-production-market-data` · **Branch:** `arena/f93e947f-iips-production-market-data`  
**Baseline:** `85ac12736cb9e2f21f639ca121d289d49ca2ba3c` (`main`, 2026-11-25) + BLK-2 assessment `DHAN-W14-E4-BLK2-ASSESSMENT-2026-11-26.md`  
**No live Dhan request, no credential read, no secret in artifact. Quota consumption 0.**

---

## 1. Approved Scope B sample (reconstructed)

Source: `evidence/dhan-w14-e4/e4-sample-reconciliation.json` (96 records, blob `50d9424af01527897df132a63f74d635286bfe9d`) applied with BLK-2 corrections. Each record preserves companyId, ISIN, exchange, exchangeSegment, series, Dhan securityId. Dhan securityIds are kept as strings in the P7 registry and emitted as JSON numbers at the vendor boundary — canonical identities and `securityIdentity` values unchanged.

| # | Original companyId | Corrected companyId | Exchanges | ISIN | NSE Dhan ID | BSE Dhan ID |
|---|---|---|---|---|---|---|
| 1 | `EQ_TATAMOTORS_IN` | `EQ_TMPV_IN` | NSE+BSE | `INE155A01022` | `3456` | `500570` |
| 2 | `EQ_BAJAJ-AUTO_IN` | `EQ_BAJAJAUTO_IN` | NSE+BSE | `INE917I01010` | `16669` | `532977` |
| 3 | `EQ_LTIM_IN` | `EQ_LTM_IN` | NSE+BSE | `INE214T01019` | `17818` | `540005` |

Both NSE and BSE rows retained for each; Dhan IDs unchanged by the rename. All six rows verified against `evidence/dhan-p7/qualification-manifest.json` (`2026-11-15T15:13:23.620Z`, batch `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`, 4,680 QUALIFIED).

**Counts**

| Dimension | Value |
|---|---|
| Total approved instruments (Scope B) | **96** |
| By exchange segment (`POST /marketfeed/quote` keys) | **NSE_EQ 48 / BSE_EQ 48** |
| By P7 series | EQ 48 / A 47 / B 1 (`EQ_AGI_IN` `INE415A01038:B` `500187` under `BSE_EQ`) |
| Distinct companies | 48 |
| Distinct ISINs | 48 |
| Distinct (segment, securityId) quote targets | 96 (unique, no collisions) |
| Dual-listed ISINs (NSE+BSE) | 48 — every ISIN appears once per segment with different Dhan IDs, no collapse |
| Identity corrections applied | 6 rows (3 companies × 2 listings) |

---

## 2. Deterministic payload

**Artifact:** `evidence/dhan-w14-e4/w14-scope-b-batch-payload.json`

```json
{
  "BSE_EQ": [500049, 500087, 500112, 500114, 500180, 500182, 500187, 500209, 500228, 500251, 500300, 500312, 500325, 500440, 500470, 500510, 500547, 500570, 500696, 500790, 500800, 500820, 500825, 500875, 505200, 507685, 508869, 512599, 524715, 532174, 532187, 532215, 532454, 532488, 532500, 532538, 532540, 532555, 532755, 532898, 532921, 532977, 532978, 533278, 539177, 540005, 540719, 540777],
  "NSE_EQ": [25, 157, 236, 383, 467, 526, 547, 694, 910, 1232, 1333, 1348, 1363, 1394, 1412, 1594, 1660, 1964, 2475, 2885, 3045, 3351, 3432, 3456, 3499, 3506, 3787, 4963, 5258, 5900, 10604, 10940, 10999, 11483, 11532, 11536, 11630, 11723, 13538, 14977, 15083, 16669, 16675, 17818, 17963, 20374, 21808, 23553]
}
```

- Keys are Dhan exchange segments; values are **JSON numbers** (not strings) as the vendor API expects.
- Each segment array is sorted ascending for reproducibility; key order is `BSE_EQ` then `NSE_EQ`.
- No credentials, client IDs, tokens, or headers included.
- Reproducible via `node scripts/dhan-w14-build-scope-b-payload.mjs` (reads the two source manifests, verifies P7 mapping, writes both artifacts; exits 1 on mismatch).

**Hashes**

| Representation | SHA-256 |
|---|---|
| Minified payload (`JSON.stringify(payload)`) | `09e39c1327e1a04fcbc52c10c05d32fc715abdfe61dff73e164c94a239e805f2` |
| Pretty file bytes (`w14-scope-b-batch-payload.json` on disk) | `f7bbccc467d44a00ec483867fe5269edfc3490df770dddac2c3df20910b68c9e` |

The minified hash is stored in the reconciliation manifest (`payload.payloadSha256`) and checked in-test.

---

## 3. Reconciliation manifest

**Artifact:** `evidence/dhan-w14-e4/w14-scope-b-reconciliation-manifest.json`

Machine-readable index connecting each payload entry to its approved sample record. For every instrument:

- `companyId` (corrected) + `originalCompanyId` + `identityCorrected`
- `isin` + `exchange` + `exchangeSegment` + `series` + `canonicalSecurityIdentity` (`ISIN:<isin>:<series>`)
- `dhanSecurityId` + `payloadSegment` + `inPayload: true` + `p7LineNumber` (provenance into `qualification-manifest.json`)

Answers "which company / ISIN / segment / original record / corrected? / in payload?" for any securityId. Includes `payload.payloadSha256` for payload↔manifest agreement check.

---

## 4. Payload builder (reusable)

**Module:** `src/providers/dhan/dhan_batch_quote_payload.ts`

Pure, deterministic, no I/O:

- `buildDhanBatchQuotePayload(instruments)` — groups by `exchangeSegment`, deduplicates within segment, sorts for reproducibility, returns `{ BSE_EQ?: number[], NSE_EQ?: number[] }`.
- `buildDhanBatchQuoteRequestBody(instruments)` — `JSON.stringify` of the above; numeric IDs only.
- `validatePayloadMatchesInstruments(payloadJson, instruments)` — checks segment keys, IDs, numeric type; used by tests and pre-flight.
- `reconcileDhanBatchQuoteResponse(requested, response)` — reports `missing` / `unexpected` / `duplicate` / `invalid`, with `matched`/`ok` summary; zero/unavailable market values are **not** reconciliation failures (only presence/identity is checked).
- Validates `dhanSecurityId` is a positive safe integer string; rejects `NSE_FO` or other unsupported segments; rejects duplicates (`segment:ID` collision); rejects empty input.

The builder reuses the same numeric serialization as `DhanApiClient.buildQuoteRequestBody` (interchangeability verified in-test); the client method remains the transport-layer counterpart.

---

## 5. Automated validation

**Tests (offline, deterministic):**

| File | Suite | Result |
|---|---|---|
| `tests/dhan_w14_batch_payload.test.ts` | Scope B 96 validation (12 tests) | **12/12 pass** |
| `tests/dhan_w14_batch_response_reconciliation.test.ts` | Synthetic response reconciliation (11 tests) | **11/11 pass** |
| Total new |  | **23/23 pass** |

What is validated (strict, fails on one deviation):

- Exactly 96 records; 96 unique `(segment, securityId)`; no duplicates; no missing approved entries; no extra entries (checked against both `e4-sample-reconciliation.json` and P7 manifest).
- Correct `exchangeSegment` assignment, including `EQ_AGI_IN` `BSE:B` `500187` under `BSE_EQ`.
- Correct P7 mapping for all 96 (companyId + segment + ISIN + series + Dhan ID matches a `QUALIFIED` P7 row; `p7LineNumber` captured).
- All six renames: TMPV 3456/500570, BAJAJAUTO 16669/532977, LTM 17818/540005; original IDs absent from manifest; Dhan IDs unchanged.
- Dual-listed preservation: all 48 ISINs appear in both `NSE_EQ` and `BSE_EQ` with distinct securityIds.
- Payload ↔ manifest agreement: `JSON.stringify(buildDhanBatchQuotePayload(...))` equals the committed artifact; hashes match; payload JSON has numeric IDs only, correct segment keys, no secrets.
- Synthetic response fixtures: all 96 returned → ok; 1/multiple missing → `MISSING_INSTRUMENT`; unexpected → `UNEXPECTED_INSTRUMENT`; request duplicate → `DUPLICATE_RESPONSE_IDENTITY`; partial (one segment) → 48 missing; wrong segment → missing+unexpected; invalid structure → `INVALID_RESPONSE_STRUCTURE`; zero/filled-book values (including D-5 zero book) → not failures.

Run: `npm run build:tsc && node --test dist/tests/dhan_w14_batch_payload.test.js dist/tests/dhan_w14_batch_response_reconciliation.test.js`

---

## 6. Batch request boundary — current IPD implementation

**Inspected:** `src/providers/dhan/dhan_api_client.ts` `buildQuoteRequestBody` + `fetchMarketQuotes`, `src/providers/dhan/dhan_market_data_service.ts` `getQuote` + `DhanRefreshOrchestrator`, `src/providers/dhan/dhan_market_data_source.ts`.

| Layer | Can it handle 96-instrument batch? | Detail |
|---|---|---|
| **Constructing one 96-instrument payload** | **Yes** — builder above + `DhanApiClient.buildQuoteRequestBody` produce the grouped JSON; 96 can be represented correctly and deterministically. |
| **Sending one HTTP request containing that payload** | **Yes at client, No at service** — `DhanApiClient.fetchMarketQuotes(instruments[])` accepts an array of instruments, builds one grouped body, and sends **one** `POST /marketfeed/quote`. `DhanMarketDataService.getQuote` and the `DhanRefreshOrchestrator` currently process **one instrument per vendor request** (`orchestrator.refresh([scope])` single-scope). There is no service-layer batch path that would send the 96-instrument grouped payload in one request while retaining per-instrument cache/rate-limit/coalescing semantics. |
| **Receiving and reconciling responses for all 96** | **Yes (offline verified)** — `reconcileDhanBatchQuoteResponse` covers full/partial/missing/unexpected/duplicate/invalid per §6; `parseDhanMarketQuoteResponse` validates required fields; zero-book (D-5) handled. Live response shape remains provisional until Dhan observation. |

**Gap before live batch:** a small, focused service-layer batch path is required to submit the 96-grouped payload in one HTTP request (e.g. `fetchBatchQuotes` / `getBatchQuotes`) with explicit per-instrument response reconciliation and diagnostic recording. This is intentionally out of scope for this payload-building step; the current payload and reconciler are sufficient to verify the request construction without redesign of quote orchestration.

**What is not claimed:** no live Dhan call was made; rate-limit tolerance for 96, vendor error codes `DH-905` etc, and live response field coverage remain to be proved in the live batch qualification gate.

---

## 7. Remaining work before first live batch quote

1. **Owner approval** of Scope B (this payload) as the live-qualification sample.
2. **Batch service path** — implement `POST /marketfeed/quote` single-request batch submission that preserves governance (exact-identity resolution, cache/freshness, rate-limit, retry `maxAttempts 3`, per-probe `DhanDiagnosticRing` provenance), then test against synthetic and live.
3. **Bounded execution authorization** — session window, request ceiling (96 expected, retry ceiling 288), reviewer.
4. **Live sweep** — `POST /marketfeed/quote` with this payload; per-row evidence (vendor response, latency, `observedState`), wrong-ID control, mismatch signature; verify `BSE:B` handling live.
5. **Second source** for independent value cross-check (G5) and per-probe sweep recorder (G6) remain open from BLK-2.

---

## 8. Files created or changed

| Path | Purpose |
|---|---|
| `src/providers/dhan/dhan_batch_quote_payload.ts` | Reusable batch payload builder + synthetic response reconciler |
| `scripts/dhan-w14-build-scope-b-payload.mjs` | Deterministic generator (no network) for payload + manifest |
| `evidence/dhan-w14-e4/w14-scope-b-batch-payload.json` | **96-instrument Dhan request JSON** (BSE_EQ 48, NSE_EQ 48) |
| `evidence/dhan-w14-e4/w14-scope-b-reconciliation-manifest.json` | Instrument→payload manifest (96 entries, P7 line numbers, hashes) |
| `tests/dhan_w14_batch_payload.test.ts` | Strict 96 validation (12 tests) |
| `tests/dhan_w14_batch_response_reconciliation.test.ts` | Synthetic batch response fixtures (11 tests) |
| `docs/integration/DHAN-W14-BATCH-QUOTE-PAYLOAD-REPORT-2026-11-26.md` | This report |
| Updated | `docs/integration/DHAN-LIVE-INTEGRATION-CURRENT-STATE-INVESTIGATION-AND-EXECUTION-ROADMAP-2026-11-25.md` (W-14 row) |

Reproducibility: `node scripts/dhan-w14-build-scope-b-payload.mjs` rewrites both artifacts and reports SHA256 mismatches; `npm run build:tsc` + `node --test dist/tests/dhan_w14_batch_*.test.js` verifies without live calls.

---

*Payload built from approved Scope B (BLK-2 corrected, 48 companies / 48 ISINs / 96 quote targets) against P7 registry 2026-11-15 batch `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`. No live request, quota 0.*
