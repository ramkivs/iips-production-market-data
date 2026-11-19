# DHAN Quote Numeric Security-ID Serialization — Completion Record (2026-11-18)

**Outcome: COMPLETE (offline implementation, publication and verification).**
**Live Dhan vendor acceptance: NOT PERFORMED — awaiting separate operator authorization.**

This record documents the merge of PR #176 and the verification of the resulting
authoritative `main`. No vendor request, credential change, subscription change,
configuration change or daemon restart was performed in this work item.

---

## 1. Defect and correction

**Established discrepancy**

| Implementation | Request body | Vendor result |
| --- | --- | --- |
| Independent Python implementation | `{"NSE_EQ":[2885]}` — security ID is a JSON **number** | HTTP 200 |
| IPD implementation (pre-merge `main`) | `{"NSE_EQ":["2885"]}` — security ID was a JSON **string** | HTTP 400 |

**Correction:** `DhanApiClient.buildQuoteRequestBody` serializes security IDs as JSON
numbers at the vendor boundary, while the instrument registry continues to hold and
propagate identifiers as strings internally.

**Original fix:** `43ba034a452b7028ba8909919c127e4775f36b27` (`fix(dhan): serialize quote
security IDs as integers`, PR #167 lineage), ported onto the current `main` lineage by
`d9f3e63dd7e523a761e26c0be434e74a0a470901` (PR #176).

The forensic root-cause record `fbf84cfb7022351be33673badd0ff9a58770074c` is an IRR-side
commit and is not present in this repository's history; PR #176's commit message cites it.

---

## 2. Merge evidence

| Item | Value |
| --- | --- |
| Repository | `ramkivs/iips-production-market-data` |
| PR | #176 — *Serialize Dhan quote security IDs as numbers on the current main lineage* |
| Head branch | `arena/f65ab324-iips-production-market-data` |
| Head SHA (verified before merge) | `d9f3e63dd7e523a761e26c0be434e74a0a470901` |
| Base before merge | `bfd83216f738a8cb6ad893f57934a582902bbdac` (`main`) |
| CI before merge | `typecheck · build · test` — pass; executed-test-count — pass |
| Mergeable state before merge | `MERGEABLE` / `CLEAN` |
| **Merge commit** | **`2685562522f1a2fd1d745a7857f771bf21453315`** |
| Merge parents | `bfd83216f738a8cb6ad893f57934a582902bbdac` + `d9f3e63dd7e523a761e26c0be434e74a0a470901` |
| Merged at (UTC) | `2026-11-18T09:40:38Z` |
| Merge method | merge commit (`--merge`) |

`main` advanced `bfd8321 → 2685562`, a two-parent merge commit with no additional or
unrelated changes. `git ls-remote origin refs/heads/main` returned
`2685562522f1a2fd1d745a7857f771bf21453315` after the merge.

---

## 3. Authoritative `main` content

`src/providers/dhan/dhan_api_client.ts` on `2685562`:

```ts
public static buildQuoteRequestBody(instruments: readonly DhanQuoteRequestInstrument[]): string {
  const grouped: Partial<Record<DhanExchangeSegment, number[]>> = {};
  for (const instrument of instruments) {
    const id = instrument.dhanSecurityId;
    if (typeof id !== 'string' || !/^[1-9][0-9]*$/.test(id)) {
      throw new TypeError('Dhan quote security ID must be a positive decimal integer');
    }
    const numericId = Number(id);
    if (!Number.isSafeInteger(numericId)) {
      throw new TypeError('Dhan quote security ID exceeds the safe integer range');
    }
    const bucket = grouped[instrument.exchangeSegment] ?? (grouped[instrument.exchangeSegment] = []);
    if (!bucket.includes(numericId)) bucket.push(numericId);
  }
  return JSON.stringify(grouped);
}
```

Both call sites are guarded, so an invalid ID is rejected **before** vendor egress:

- `fetchMarketQuotes` → maps the throw to `MALFORMED_INSTRUMENT_MAPPING`;
- `probeOnce` → returns `NOT_ATTEMPTED_NOT_READY` with `failureCategory: 'MALFORMED_INSTRUMENT_MAPPING'` and performs no request.

Regression coverage: `tests/dhan_quote_numeric_serialization.test.ts` (69 lines) plus
converted fixtures and assertions across 13 further test files.

---

## 4. Verification against merged authoritative `main` (executed in this work item)

All commands were run at HEAD `2685562522f1a2fd1d745a7857f771bf21453315` with a clean
working tree.

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | **PASS** (exit 0) |
| Production build | `npm run build` | **PASS** (exit 0; tsc + vite + portfolio-ui + pit + dhan packages) |
| Targeted quote tests | `node --test dist/tests/{dhan_quote_numeric_serialization, dhan_d1_provider_foundation, dhan_p5_service_transport, dhan_p6_exact_identity, dhan_w10_connection_verify_endpoint, dhan_w06_first_request_evidence, dhan_d2_integration_qualification, dhan_w08_provider_state_recorder, dhan_w09_diagnostics_endpoint, dhan_stage1_admission}.test.js` | **103 tests, 103 passed, 0 failed** |
| Guarded suite | `npm test` | **1905 executed, 1901 passed, 4 skipped, 0 failed** |

The 4 skipped tests are pre-existing, platform-conditional suites (Windows DPAPI and
equivalent host-specific cases). They are unchanged by this merge and were reported as
4 skipped both by PR #176 CI and before the merge.

### Structural request-body evidence (compiled source)

```
1. Reliance single      : {"NSE_EQ":[2885]}
   matches spec exactly : true
   id typeof            : number
   number not string    : true
2. multi+dedupe+grouping: {"NSE_EQ":[2885,11536],"BSE_EQ":[500325]}
3. validation rejects non-canonical/unsafe IDs: OK
```

Validation rejects `''`, `'0'`, `'01'`, `'-1'`, `'1.5'`, `'1e3'`, `' 2885 '`,
`'SYNTH-1'` and `'9007199254740992'`; exchange-segment grouping and de-duplication are
preserved.

---

## 5. Not performed

| Item | Status |
| --- | --- |
| Live Dhan quote request | **NOT PERFORMED.** No vendor egress occurred in this work item. |
| Vendor acceptance of the corrected wire body | **UNPROVEN** — requires a controlled operator-authorized request. |
| Credential rotation / subscription change | Not performed. |
| Configuration change / daemon restart | Not performed. |
| IRR repository modification | Not performed. |

### Proposed controlled acceptance (awaiting operator authorization)

`POST /v1/connection/verify` is **not** suitable for Reliance acceptance: `verifyConnection`
probes the *first* active registry mapping (`EQ_ABB_IN`, `BSE_EQ`, `500002`), not Reliance.
The suitable single-request surface is `/v1/quotes`, which resolves
`EQ_RELIANCE_IN` + `ISIN:INE002A01018:EQ` → `2885` and emits one `{"NSE_EQ":[2885]}`.

```powershell
curl.exe -sS -X POST http://127.0.0.1:8791/v1/quotes `
  -H "Authorization: Bearer $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"companyId":"EQ_RELIANCE_IN","securityId":"ISIN:INE002A01018:EQ","exchangeSegment":"NSE_EQ"}'
```

Note: `executeJsonPost` returns on non-2xx **without parsing or retaining the vendor body**
(D-7 disclosure policy), so the acceptance evidence is the HTTP status and the separately
projected vendor status — not vendor error text.

---

## 6. Remaining acceptance requirement

1. Explicit operator authorization to issue the single controlled Reliance request above.
2. That request's measured result, recorded against this document as the vendor-acceptance
   step. Until then, the numeric serialization is verified **offline only**.
