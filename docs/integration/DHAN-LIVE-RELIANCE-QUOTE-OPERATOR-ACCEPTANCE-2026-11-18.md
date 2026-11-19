# DHAN Live Reliance Quote — Windows Operator Acceptance Record (2026-11-18)

**Acceptance classification: DHAN LIVE RELIANCE QUOTE — OPERATOR ACCEPTANCE: PASS.**
**Scope: exactly one successful live Reliance quote through the local Windows IPD daemon.**

**This record is operator-reported evidence transcribed and published by IPD. Arena did not execute
the vendor request, did not access the Windows host, and did not observe the daemon directly.** The
terminal output in §4 and §5 is reproduced exactly as supplied by the operator.

---

## 1. Objective and boundaries

Record the operator-executed live Reliance quote acceptance on the Windows local IPD checkout, and
update the DHAN live-integration status accordingly.

**What this evidence establishes**

- One live authenticated Reliance quote was retrieved through the local IPD daemon.
- The vendor answered HTTP 200 for the request the IPD daemon constructed.
- Instrument resolution succeeded for `EQ_RELIANCE_IN`.
- A canonical `D01_QUOTES` envelope was produced with `qualityState: GOOD` and `freshness: CURRENT`.

**What this evidence does NOT establish** — do not extend it further

- Multi-instrument reliability, sustained or repeated operation, rate-limit behaviour over time.
- Production readiness. Production remains out of scope and fails closed (`PRODUCTION_NOT_AUTHORIZED`).
- Vendor DTO field-shape qualification across all D01 fields, or D02 historical qualification.
- That `providerQualification` in `ServiceHealth` should change by itself; see §7.
- Credential validity beyond the 2026-11-19T10:05:01.481Z expiry shown in §3.

---

## 2. Environment

| Item | Value |
| --- | --- |
| Repository | `ramkivs/iips-production-market-data` |
| Local checkout | `H:/IIPS/iips-production-market-data` |
| **Verified commit** | **`2685562522f1a2fd1d745a7857f771bf21453315`** |
| Commit subject | Merge pull request #176 from `ramkivs/arena/f65ab324-iips-production-market-data` |
| Platform | Windows, local single-user non-production workstation |
| Endpoint surface | Local IPD daemon, loopback `127.0.0.1` |
| Vendor endpoint | `https://api.dhan.co/v2/marketfeed/quote` (IPD server-side transport only) |

The checkout commit `2685562` is the merge of PR #176, which introduced numeric security-ID
serialization ([completion record](DHAN-QUOTE-NUMERIC-SERIALIZATION-COMPLETION-RECORD-2026-11-18.md)).
The accepted request therefore ran the corrected wire-body path.

---

## 3. Credential verification (operator-executed)

Actual output, reproduced exactly:

```text
> iips-production-market-data@1.0.0 dhan:credential
> node dist/src/providers/dhan/dhan_credential_store_cli.js verify

[ipd-dhan-credential] verify: platformAdmissible=yes locationAdmissible=yes
  client-id    : PRESENT_OK (present=yes readable=yes aclOwnerOnly=yes schemaValid=yes expired=no version=v1)
  access-token : PRESENT_OK (present=yes readable=yes aclOwnerOnly=yes schemaValid=yes expired=no version=v1 expiresAtUtc=2026-11-19T10:05:01.481Z)
```

**Result: PASS.** Both carriers present, readable, owner-only ACL, schema-valid, unexpired. No
secret value is disclosed by this output. Access-token expiry `2026-11-19T10:05:01.481Z` governs the
validity window of all evidence in this record.

---

## 4. Live daemon execution

The operator executed the Windows acceptance script, which performed, in order:

1. Authoritative checkout verification.
2. Transport-token loading.
3. Dhan credential configuration.
4. IPD TypeScript rebuild.
5. Dhan credential verification (§3).
6. Daemon port availability check.
7. Rebuilt IPD daemon startup.
8. Authenticated daemon health verification.
9. **One** live Reliance quote request.

Exactly one vendor quote request was issued. The acceptance script itself is operator-side and is not
tracked in this repository; this section records its declared sequence as reported.

---

## 5. Live Reliance quote result (operator-executed)

Actual terminal output, reproduced exactly as supplied:

```text
=== 9. ONE LIVE RELIANCE QUOTE REQUEST ===
HTTP STATUS: 200
QUOTE RESPONSE:
{"ok":true,"envelope":{"envelopeId":"env-d01-b3392cf3ea65effd","domain":"D01_QUOTES","mode":"SNAPSHOT","companyId":"EQ_RELIANCE_IN","payload":{"companyId":"EQ_RELIANCE_IN","symbol":"RELIANCE INDUSTRIES LTD","exchange":"NSE","currency":"INR","bid":0,"ask":0,"ltp":1363,"open":1370,"high":1376.5,"low":1354,"close":1363,"previousClose":1363,"volume":18226036,"change":0,"pctChange":0,"vwap":1363.17},"provenance":{"sourceClassification":"CANONICAL_MARKET_DATA","vendorTier":"TIER_2_COMMERCIAL","asOf":"2026-11-18T09:58:48.000Z","receivedAt":"2026-11-18T10:10:53.425Z","evaluatedAt":"2026-11-18T10:10:53.425Z","dataVersion":"v1.0.0-d01-provider-foundation","lineageHash":"b3392cf3ea65effde44d8eeffe400b0621f4368da1cf335633a7e8cd6efc2ecc","qualityState":"GOOD"},"timestamp":"2026-11-18T10:10:53.425Z","schemaVersion":"1.0.0"},"freshness":"CURRENT"}
```

### 5.1 Key fields

| Field | Value |
| --- | --- |
| HTTP status (local IPD endpoint) | `200` |
| `companyId` | `EQ_RELIANCE_IN` |
| `symbol` | `RELIANCE INDUSTRIES LTD` |
| `exchange` / `currency` | `NSE` / `INR` |
| `ltp` / `close` / `previousClose` | `1363` / `1363` / `1363` |
| `open` / `high` / `low` | `1370` / `1376.5` / `1354` |
| `volume` | `18226036` |
| `vwap` | `1363.17` |
| `asOf` (vendor) | `2026-11-18T09:58:48.000Z` |
| `receivedAt` = `evaluatedAt` | `2026-11-18T10:10:53.425Z` |
| `dataVersion` | `v1.0.0-d01-provider-foundation` |
| `lineageHash` | `b3392cf3ea65effde44d8eeffe400b0621f4368da1cf335633a7e8cd6efc2ecc` |
| `qualityState` | `GOOD` |
| `freshness` | `CURRENT` |
| `schemaVersion` | `1.0.0` |

### 5.2 Offline structural cross-check (performed by IPD, no vendor call)

The transcribed response was checked against the implementation at `2685562`. These are consistency
checks on the transcription, not independent observation of the host.

| Check | Source of truth | Result |
| --- | --- | --- |
| `envelopeId` = `env-d01-` + first 16 hex chars of `lineageHash` | `src/providers/dhan/dhan_normalizer.ts:191` | `env-d01-` + `b3392cf3ea65effd` — **consistent** |
| `dataVersion` constant | `src/providers/dhan/dhan_normalizer.ts:23` (`DHAN_CANONICAL_DATA_VERSION`) | exact match — **consistent** |
| `freshness: CURRENT` | `src/quality/freshness_evaluator.ts:16` — D01 window 15 min | asOf→evaluated = 12 min 05 s < 15 min — **consistent** |
| Envelope shape and `schemaVersion` | canonical `D01_QUOTES` contract | **consistent** |

---

## 6. Acceptance assessment

**DHAN LIVE RELIANCE QUOTE — OPERATOR ACCEPTANCE: PASS.**

Against the recorded criteria:

| Criterion | Result |
| --- | --- |
| HTTP 200 from the local IPD quote endpoint | PASS |
| Live Reliance quote retrieved | PASS |
| Instrument resolution for `EQ_RELIANCE_IN` | PASS |
| NSE quote data returned | PASS |
| Canonical market-data envelope produced | PASS |
| `qualityState: GOOD` | PASS |
| `freshness: CURRENT` | PASS |
| Provenance and lineage hash returned | PASS |

This is **one** successful live Reliance quote. The acceptance is bounded by §1 and does not extend
to multi-instrument reliability, sustained operation, or production readiness.

**Observation, not a defect claim:** `bid` and `ask` are `0`, and `change`/`pctChange` are `0` while
`ltp` equals `close` and `previousClose`. The quote is consistent with a market snapshot outside the
continuous trading session for the vendor `asOf` (`2026-11-18T09:58:48Z`, i.e. `15:28:48 IST`). No
conclusion is drawn here about vendor depth entitlement or field-shape qualification; that remains a
D01 field-shape qualification item (§7).

---

## 7. Status changes and what deliberately did not change

### 7.1 Updated

- **M1 — "one real authenticated interaction with Dhan succeeds": SATISFIED** by this evidence
  (previously `NOT ACHIEVED`, see [W-06 investigation](DHAN-W06-AUTHENTICATION-FAILURE-INVESTIGATION-2026-11-13.md) §12
  and [first-request evidence](DHAN-W06-FIRST-AUTHENTICATED-REQUEST-EVIDENCE-2026-11-12.md) §13).
- **Live Reliance D01 quote acceptance: PASS**, operator-executed, one request.
- **Roadmap W06:** a live Reliance D01 quote observation now exists; see the roadmap status section.

### 7.2 Deliberately unchanged

- **`providerQualification` stays `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED` in code.** No implementation
  change is made by this documentation-only work item. Changing that declarative provider
  qualification is a separate governed decision with its own evidence bar (D01 field-shape and
  rate-limit qualification, wider instrument coverage), and the `ServiceHealth` contract is
  explicitly additive and conservative (see `DHAN-W07-HEALTH-CONTRACT-HANDOFF.md` §"No premature live
  claims").
- **`liveProviderConnectivity`** likewise remains a recorder-derived observation, not a claim this
  record writes into the health contract.
- No credential, subscription, configuration or vendor-request change is made or authorized here.
  The access token in §3 expires `2026-11-19T10:05:01.481Z`; re-verification is required after that.
- No production claim. Production remains excluded and fails closed.

---

## 8. Reproduction boundary

The operator has already executed this acceptance. **Do not repeat the vendor request** to "confirm"
this record, and do not re-run the acceptance script under this work item. The evidence is complete
as supplied.

If a future, separately authorized acceptance is required (for example wider instrument coverage or
D01 field-shape qualification), it needs its own authorization and its own record. Note for that work:
`POST /v1/connection/verify` probes the *first* active registry mapping, which is **not** Reliance
(see [completion record](DHAN-QUOTE-NUMERIC-SERIALIZATION-COMPLETION-RECORD-2026-11-18.md) §5);
`POST /v1/quotes` with `EQ_RELIANCE_IN` + `ISIN:INE002A01018:EQ` is the Reliance-specific surface.

---

## 9. Related records

- [Numeric security-ID serialization — completion record](DHAN-QUOTE-NUMERIC-SERIALIZATION-COMPLETION-RECORD-2026-11-18.md) — the correction this acceptance exercised
- [W-06 authentication failure investigation](DHAN-W06-AUTHENTICATION-FAILURE-INVESTIGATION-2026-11-13.md) — the earlier `AUTHENTICATION_FAILURE`
- [W-06 first authenticated request evidence](DHAN-W06-FIRST-AUTHENTICATED-REQUEST-EVIDENCE-2026-11-12.md)
- [W-06 two-request authentication attempt (blocked)](DHAN-W06-TWO-REQUEST-AUTHENTICATION-EVIDENCE-2026-11-13.md)
- [Stage 1 credential and transport admission](DHAN-STAGE1-CREDENTIAL-AND-TRANSPORT-ADMISSION-2026-11-08.md) — `NOT_LIVE_VERIFIED` status historically recorded there
- [W-11 daemon configuration and operations](DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md)
- [IIPS execution roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md) — W06 status
