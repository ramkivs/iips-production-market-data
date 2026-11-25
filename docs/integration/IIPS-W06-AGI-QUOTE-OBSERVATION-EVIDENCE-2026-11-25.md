# W06 — Successful AGI Quote Observation: Evidence Record (2026-11-25)

**Work item:** W06 — Market observations and freshness (IIPS Snapshot-to-Live).
**Repository:** `ramkivs/iips-production-market-data` (IPD — the authoritative repository for this evidence).
**Record baseline:** `836dbcf3b17280d5a684288e0f78f06c99a5af71` (merge of PR #190, `main`).
**Classification:** **OPERATOR-SUPPLIED LIVE EVIDENCE, TRANSCRIBED AND OFFLINE-VERIFIED BY IPD. ONE SUCCESSFUL QUOTE OBSERVATION RECORDED.**
**W06 status after this record: IN PROGRESS — NOT COMPLETE, NOT ACCEPTED.** See §6.
**Disposition: ONE SUCCESSFUL QUOTE OBSERVATION RECORDED. THE SEPARATE FRESHNESS OBSERVATION IS STILL REQUIRED.** See §5.
**Verification: 24/24 offline checks PASS** — `node evidence/integration/w06-agi-quote-observation-2026-11-25/verify-w06-agi-evidence.mjs`.

> **This record does not claim IPD executed the request.** The operator executed it on the Windows
> checkout. IPD did not contact the vendor, did not read a credential, did not run on the host and did
> not observe the daemon. The terminal output in §3 is transcribed exactly as supplied, and §4 is an
> **offline consistency check of that transcription against this repository's own code** — not an
> independent observation of the host.

---

## 1. Objective and boundaries

Record the successful AGI Greenpac (`EQ_AGI_IN`) quote observation as W06 evidence, preserve the
complete response, update the W06 tracker, and state precisely what remains before W06 can be closed.

**Boundaries observed while producing this record**

- **The quote request was not repeated.** No vendor call, no daemon start, no credential read and no
  host access occurred. The single successful request is recorded from the supplied output only.
- **No Windows-host operation was performed, and none is claimed.** Everything produced here ran on
  Linux in the sandbox, on tracked repository files.
- **No evidence or timestamp was fabricated.** Every instant in this record is either transcribed from
  the supplied output or measured locally on the sandbox and labelled as such.
- **No portfolio capture or private holding detail is published.** §7 explains the one place where the
  temptation to infer such a link exists, and why it is refused.
- **No unrelated workstream is changed.** Only the W06 record, its evidence directory and the W06
  status line of the existing roadmap are touched.

---

## 2. What this evidence is a claim *about*

A single canonical `D01_QUOTES` envelope for one NSE-listed security. It is **one** observation.

| Axis | State after this record | Basis |
|---|---|---|
| A quote request succeeded | **YES — exactly one, HTTP 200** | §3, §4 |
| The identity is a governed mapping | **YES** — the tracked P7 registry holds exactly one QUALIFIED NSE row for it | §4 V22–V23 |
| Bid/ask were actually supplied | **YES** — `639.55` / `640`, positive, `ask >= bid`, accepted by the D01 2.0.0 validator | §4 V10–V11 |
| Provenance and lineage are intact | **YES** — lineage hash recomputes exactly from the payload | §4 V13–V14 |
| A **separate freshness observation** was made | **NO** — not performed, not supplied, not inferred | §5 |
| Per-holding eligible quote coverage was measured | **NO** — coverage remains 0 of 64 measured | §6.2 |
| Multi-instrument or sustained operation was shown | **NO** — one instrument, one request | §6.2 |
| `providerQualification` should change | **NO** — unchanged in code, and not raised by this record | §6.4 |

---

## 3. The original terminal output (complete, unaltered)

Reproduced exactly as supplied. Nothing is elided, reordered, re-serialized or added. The same three
lines are stored byte-for-byte at
[`evidence/integration/w06-agi-quote-observation-2026-11-25/operator-terminal-output.txt`](../../evidence/integration/w06-agi-quote-observation-2026-11-25/operator-terminal-output.txt)
(SHA-256 `e11287abe464653a444ae9045be9e0fa51915dc4b9f0d2e014060704e46dc371`, 897 bytes), with the
response line alone at
[`agi-quote-envelope.json`](../../evidence/integration/w06-agi-quote-observation-2026-11-25/agi-quote-envelope.json)
(SHA-256 `7658684fe71be35d49077685d44078411fa0a0aad16053dfb28774c37666c98b`, 839 bytes).

```text
Sending exactly one AGI quote request...
HTTP Status: 200
{"ok":true,"envelope":{"envelopeId":"env-d01-f464ef3b8313b9cd","domain":"D01_QUOTES","mode":"SNAPSHOT","companyId":"EQ_AGI_IN","payload":{"companyId":"EQ_AGI_IN","symbol":"AGI GREENPAC LIMITED","exchange":"NSE","currency":"INR","bid":639.55,"ask":640,"ltp":640,"open":655.5,"high":664,"low":635,"close":649.1,"previousClose":649.1,"volume":30388,"change":-9.1,"pctChange":-1.4,"vwap":645.98},"provenance":{"sourceClassification":"CANONICAL_MARKET_DATA","vendorTier":"TIER_2_COMMERCIAL","asOf":"2026-11-25T08:57:35.000Z","receivedAt":"2026-11-25T08:58:04.774Z","evaluatedAt":"2026-11-25T08:58:04.774Z","dataVersion":"v1.0.0-d01-provider-foundation","lineageHash":"f464ef3b8313b9cd6777e1627a2df8de7b9f7efe269fb02ff816dfebbac047d3","qualityState":"GOOD"},"timestamp":"2026-11-25T08:58:04.774Z","schemaVersion":"2.0.0"},"freshness":"CURRENT"}
```

### 3.1 Every field preserved, with what each one is

| Field | Value | What it records |
|---|---|---|
| Request count | **exactly one** | The prompt line states one request; nothing in the output suggests a retry, a loop or a follow-up |
| HTTP status (local IPD endpoint) | `200` | The daemon answered successfully; this is the **daemon's** status, not the vendor's |
| `envelopeId` | `env-d01-f464ef3b8313b9cd` | Derived as `env-d01-` + first 16 hex of `lineageHash` — verified (§4 V14) |
| `domain` / `mode` | `D01_QUOTES` / `SNAPSHOT` | A quote in snapshot mode; **not** `LIVE` |
| `companyId` | `EQ_AGI_IN` | The requested company identity, echoed in envelope and payload |
| `payload.symbol` | `AGI GREENPAC LIMITED` | Canonical symbol as held by the governed registry row |
| `payload.exchange` / `currency` | `NSE` / `INR` | NSE cash equity, rupee-denominated |
| `payload.bid` / `ask` | `639.55` / `640` | **Supplied, positive top-of-book** — the D-5 shape, not `0` and not `null` |
| `payload.ltp` / `close` / `previousClose` | `640` / `649.1` / `649.1` | Last traded price, current-session close, and the derived previous close |
| `payload.open` / `high` / `low` | `655.5` / `664` / `635` | Session range |
| `payload.volume` | `30388` | Traded quantity, integer shares |
| `payload.change` / `pctChange` | `-9.1` / `-1.4` | Day change and percentage change, derived from the vendor net change |
| `payload.vwap` | `645.98` | Volume-weighted average price, present only when the source supplies it |
| `provenance.sourceClassification` | `CANONICAL_MARKET_DATA` | Governed source classification (vendor identity masked, NFR-06) |
| `provenance.vendorTier` | `TIER_2_COMMERCIAL` | The masked commercial tier — no vendor name is published |
| `provenance.asOf` | `2026-11-25T08:57:35.000Z` | **Vendor-declared** market instant (= 14:27:35 IST) |
| `provenance.receivedAt` | `2026-11-25T08:58:04.774Z` | When IPD received the vendor response (= 14:28:04.774 IST) |
| `provenance.evaluatedAt` | `2026-11-25T08:58:04.774Z` | When quality was evaluated; equal to `receivedAt` |
| `provenance.dataVersion` | `v1.0.0-d01-provider-foundation` | The foundation data version constant, unchanged |
| `provenance.lineageHash` | `f464ef3b8313b9cd6777e1627a2df8de7b9f7efe269fb02ff816dfebbac047d3` | SHA-256 over payload + classification + `asOf` + `dataVersion` — **recomputed and matched** (§4 V13) |
| `provenance.qualityState` | `GOOD` | Quality as evaluated at `evaluatedAt` — a statement about **this envelope**, see §5.3 |
| `envelope.timestamp` | `2026-11-25T08:58:04.774Z` | Envelope creation instant, equal to `receivedAt` |
| `schemaVersion` | `2.0.0` | The D01 schema version in force after D-5 (approved 2026-11-21) |
| `freshness` | `CURRENT` | The transport-level field on this response — see §5.2 for exactly what it is and is not |

### 3.2 What the output does **not** contain — stated, not glossed

These absences are load-bearing, so they are recorded rather than passed over:

- **No route, URL, port or client** appear. The transport path the request took is not in the evidence.
- **No vendor HTTP status.** `HTTP Status: 200` is the local daemon's status. (The daemon reports a
  vendor status separately, as `vendorHttpStatus`, only on failure; a success carries none.)
- **No `ServiceHealth`, `providerQualification` or `liveProviderConnectivity`** field. Nothing here
  speaks to provider qualification.
- **No freshness-status document.** No `cacheState`, `verdict`, `timestamps`, `timestampStates`,
  `ageSeconds`, `lastRefresh` or `calendarVersion`. This is the crux of §5.
- **No credential, expiry or session information**, and none is inferred.
- **No wall-clock record of when the operator ran the command**, beyond the instants inside the
  response itself.

---

## 4. Verification of the record (performed offline, in this sandbox)

Two independent things were checked: that the transcribed bytes are stable, and that the transcription
is internally consistent with **this repository's code at `836dbcf`**. The verifier is
[`verify-w06-agi-evidence.mjs`](../../evidence/integration/w06-agi-quote-observation-2026-11-25/verify-w06-agi-evidence.mjs);
its recorded output is
[`verification-output.txt`](../../evidence/integration/w06-agi-quote-observation-2026-11-25/verification-output.txt).

```text
PASS  V01  the recorded transcript is byte-identical to the bytes this verifier was written against
PASS  V02  the recorded response line is byte-identical to its own recorded copy
PASS  V03  the transcript declares exactly one request
PASS  V04  the recorded HTTP status is 200
PASS  V05  the response line parses as JSON
PASS  V06  ok is true and an envelope is present
PASS  V07  domain is D01_QUOTES and mode is SNAPSHOT
PASS  V08  companyId is EQ_AGI_IN in both envelope and payload
PASS  V09  exchange is NSE, currency is INR, symbol is AGI GREENPAC LIMITED
PASS  V10  bid/ask are supplied positive prices (D-5 shape), not zero and not null
PASS  V11  the payload passes the canonical D01 validator at this commit
PASS  V12  the emitted schemaVersion equals the D01 schema version at this commit
PASS  V13  the reported lineageHash is the hash of this exact payload/asOf/dataVersion
PASS  V14  the envelopeId is env-d01- plus the first 16 hex of the lineage hash
PASS  V15  provenance instants are declared and the vendor asOf precedes receipt
PASS  V16  evaluatedAt equals receivedAt and the envelope timestamp equals receivedAt
PASS  V17  vendorTier is the masked commercial tier and dataVersion is unchanged from the foundation constant
PASS  V18  qualityState GOOD is what the evaluator produces at the recorded evaluation instant
PASS  V19  the envelope freshness CURRENT agrees with elapsed age under the 900 s D01 window
PASS  V20  the recorded response contains no /v1/freshness evidence (no cacheState, verdict, timestamps block)
PASS  V21  the D114 identity in the registry for this quote is ISIN:INE415A01038:EQ and validates
PASS  V22  the tracked P7 registry holds exactly one QUALIFIED NSE row for EQ_AGI_IN/INE415A01038/EQ
PASS  V23  that registry row matches the quote: symbol, exchange and numeric vendor id 1412
PASS  V24  the published calendar .2 has NO NSE row for the observation date, so a session-aware D01 read of this quote would fail MISSING_COVERAGE

24/24 checks passed.
```

**Result: 24 of 24 checks PASS** at `836dbcf3b17280d5a684288e0f78f06c99a5af71`, exit code 0.

### 4.1 What each verification class actually proves

| Class | Checks | What it proves | What it cannot prove |
|---|---|---|---|
| Byte integrity | V01–V02 | The record has not drifted since it was written; the standalone JSON equals line 3 of the transcript | That the operator's terminal said this — that rests on the supply of the output |
| Shape and identity | V03–V10, V21–V23 | The response is a valid canonical envelope for a **governed, registry-qualified** NSE identity | That the vendor returned these prices |
| Contract conformance | V11–V12 | The payload passes the same validator the daemon applies, and `2.0.0` is the schema version in force | That the daemon instance ran this commit |
| Provenance integrity | V13–V17 | The lineage hash recomputes **exactly**; the envelope ID derives from it; the instants are well-formed and ordered | That the instants were honestly captured — they are the vendor's and IPD's own claims |
| Quality consistency | V18–V19 | `GOOD` and `CURRENT` are what the evaluator produces for a 29.774 s elapsed age under the 900 s D01 window | A calendar-qualified session verdict (§5.4) |
| Non-claim discipline | V20, V24 | The freshness-status evidence is **absent** from this response, and the calendar cannot cover the observation date | — |

A recomputation of the lineage hash by hand, independent of the verifier, was also run and matched:
`sha256(JSON(payload) + "CANONICAL_MARKET_DATA" + "2026-11-25T08:57:35.000Z" + "v1.0.0-d01-provider-foundation")`
= `f464ef3b8313b9cd6777e1627a2df8de7b9f7efe269fb02ff816dfebbac047d3`.

---

## 5. The successful quote observation and the freshness observation are **separate**, and only the first exists

This is the distinction the record must not blur. It is the single most likely way this evidence could
be over-read.

### 5.1 They are different documents from different routes

| | **Quote observation** (this record) | **Freshness observation** (not performed) |
|---|---|---|
| Production surface | `POST /v1/quotes` | `GET /v1/freshness` |
| What it returns | A canonical `D01_QUOTES` envelope — prices, provenance, lineage | A `FreshnessStatus` document — `cacheState`, `verdict`, `ageSeconds`, `timestampEvidence`, `timestamps`, `lastRefresh`, `calendarMode`, `calendarAssessment` |
| Cost | **Spends a vendor request** | Read-only; never refreshes, never calls the provider, never touches LRU order |
| In this evidence | Present in full (§3) | **Absent.** V20 asserts its fields are not present |

### 5.2 `freshness: CURRENT` in the response is an envelope field, not the freshness observation

The `"freshness":"CURRENT"` value is set by the quote transport from the same freshness evaluation
that produced `qualityState`, and it states one thing: at `evaluatedAt`, the vendor `asOf` was within
the D01 window (29.774 s elapsed, 900 s threshold — V18/V19). It is a property of **this envelope**.

It is **not** `FreshnessStatus`. It carries no `cacheState`, no `verdict`, no `eligibleForUse`, no
`suppressExecution`, no `timestampEvidence`, no four-timestamp evidence block, no `lastRefresh` history
and no calendar assessment. A `GET /v1/freshness` read would be a **second, separate** capture, and it
is the one W06's acceptance text actually names.

### 5.3 `qualityState: GOOD` is equally narrow

`GOOD` is this vendor/DTO's quality at that instant. It is **not** a statement that the security is
tradable, that NSE was open, that the price is an official close, or that the instrument passed a
wider qualification. This observation is a single NSE cash-equity quote taken on a day the published
calendar does not cover (V24), so no session-qualified claim can be attached to it.

### 5.4 A caution for whoever performs the freshness step

`GET /v1/freshness` is evaluated at **read time**, and D01 quality is a function of age. For this
observation the recorded instants give this timeline (computed from the recorded `asOf`, not from any
new observation):

| Read-time window | Age since `asOf` | Legacy elapsed verdict |
|---|---|---|
| up to `2026-11-25T09:12:35.000Z` | ≤ 900 s | `GOOD` |
| up to `2026-11-25T09:27:35.000Z` | ≤ 1,800 s | `STALE` (concession active, still eligible) |
| after `2026-11-25T09:27:35.000Z` | > 1,800 s | `UNAVAILABLE`, execution suppressed |

That table is an **arithmetic property of the recorded timestamp**, not a prediction and not a claim
that any read occurred. Its consequence is practical: a `UNAVAILABLE` later read is the evaluator
behaving correctly on an aged observation, not a contradiction of this record — and it is not an
invitation to re-quote. Separately, and for a different reason, a session-aware read of this
observation **fails closed today**: the published calendar `.2` has no NSE row for `2026-11-25`, so
the evaluator reports `MISSING_COVERAGE` and `UNAVAILABLE` regardless of age (V24). That coverage gap
must be closed by publishing a new reviewed calendar version (never by broadening runtime defaults)
if a session-qualified verdict is wanted.

---

## 6. W06 tracker update and what remains

### 6.1 What this record changes

| Tracker element | Before | After |
|---|---|---|
| Live D01 observations accepted | 1 (`EQ_RELIANCE_IN`, 2026-11-18) | **2** — the Reliance observation plus this `EQ_AGI_IN` observation |
| Instruments with any accepted live quote | 1 (`EQ_RELIANCE_IN`) | **2** (`EQ_RELIANCE_IN`, `EQ_AGI_IN`) |
| Bid/ask field-shape evidence | **none** — the Reliance snapshot carried `bid: 0, ask: 0` | **one observation with supplied positive bid/ask** — `639.55` / `640`, D-5 conformance confirmed by the contract validator |
| Successful multi-instrument evidence | none | **still none** — two separate single-instrument, single-request acceptances are not a multi-instrument sweep |
| Freshness observation | none | **still none** |
| Per-holding eligible quote coverage (of 64) | 0 measured | **0 measured — unchanged** |
| W06 status | IN PROGRESS, NOT ACCEPTED | **IN PROGRESS, NOT ACCEPTED** |

The roadmap's W06 status line is updated to reference this record; it is not upgraded to a completed
or accepted state, because the acceptance criteria are not yet satisfied.

### 6.2 W06 acceptance criteria, restated, and their state

R1, R2 and R7 are the roadmap W06 entry's own **Deliverable** text; R3–R6 are its **Acceptance/evidence**
text; the last three rows are bounds that entry already imposed. Nothing is added to the definition here.

| # | Acceptance requirement (W06's own text) | State | Evidence today |
|---|---|---|---|
| R1 | Per-identity **source / as-of / received / evaluated** | **PARTIAL** — the four fields exist for one observation | §3.1. One of 64 holdings; §7 explains why it is not attributed to a holding |
| R2 | Per-identity **verdict / eligibility** | **NOT MET** — an envelope carries no `verdict`/`eligibleForUse` | §5.1. Requires the separate `GET /v1/freshness` read |
| R3 | **Same-revision reconciliation** | **NOT MET** | Zero holdings of revision 1 have a measured quote. Needs a per-holding quote sweep against stored identities |
| R4 | **Stale / unknown / unavailable handling** | **PARTIAL — mechanized, not observed** | 36/36 existing freshness HTTP/D02/transport tests pass at this commit (synthetic). No live stale/unknown case has been captured |
| R5 | **No candle-derived freshness** | **SATISFIED (structural)** | D02 freshness is `NOT_AVAILABLE`/`UNKNOWN` with `evidenceSource: NO_OBSERVATION`; no candle is ever promoted to a freshness instant |
| R6 | **No claim that a cache hit proves live connectivity** | **SATISFIED (discipline)** | This record claims no connectivity from any cache state; the envelope `freshness` field is bounded in §5.2 |
| R7 | **Aggregate coverage** | **NOT MET** | 0 of 64 measured; the denominator is 64 holdings of revision 1, the qualified-quote numerator is unmeasured |
| — | Bound already recorded: 1 of 64 identity coverage | **UNCHANGED** | Cannot reach 64 in this workstream; needs a later import writing a new revision ([reconciliation](IIPS-W06-BROKER-IMPORT-HOLDING-IDENTITY-RECONCILIATION-2026-11-18.md) §6) |
| — | Bound already recorded: θI not established | **UNCHANGED** | This record sets no threshold |
| — | Bound already recorded: θM / θI / θF / θA belong to W20 | **UNCHANGED** | W06 measures; it does not gate |

**Nothing in this record moves R2, R3, R4 (observed), R7, the identity-coverage bound or any
threshold.** W06 is therefore **not complete and not accepted**, and this record does not recommend
otherwise.

### 6.3 Confirmed progress, stated minimally

W06 gains a **second** accepted live D01 observation and the **first** evidence in the programme that
the D-5 bid/ask representation produces a real, supplied, positive top-of-book on a real quote. Before
this record, the only live quote carried `bid: 0, ask: 0`, which is exactly the shape D-5 was ratified
to eliminate. That is a genuine, if narrow, gain in D01 field-shape evidence.

What it does **not** do: it does not widen instrument coverage in any controlled sense (one instrument,
chosen per acceptance rather than per sample design, is not a sample), it does not touch freshness status,
and it does not quantify per-holding coverage.

### 6.4 What deliberately did not change in code

- `providerQualification` remains `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED`. Raising it requires wider
  instrument coverage plus D01 field-shape and rate-limit qualification — a separate governed decision.
- No refresh endpoint, scheduler, timer or automatic refresh is introduced, and none is implied.
- No implementation file is modified by this work item. The change set is documentation plus an
  evidence directory.

---

## 7. What this evidence must **not** be attributed to (private-holding discipline)

`EQ_AGI_IN` resolves to a governed P04 company and its identity is a QUALIFIED row of the tracked P7
registry (§4 V22–V23). That is all this record establishes about identity.

**It is not established, and is deliberately not claimed, that `EQ_AGI_IN` is a holding of any
portfolio revision.** Two facts make that attribution both tempting and unsupportable:

1. The tracked W04 lineage reproduction records **exactly one** holding of revision 1 with a stored
   security identity, and that holding's ISIN, symbol and issuer are **not in this repository** —
   W04 recorded them as "reported for the one qualified holding, not shown"
   ([reconciliation](IIPS-W06-BROKER-IMPORT-HOLDING-IDENTITY-RECONCILIATION-2026-11-18.md) §3).
2. `AGI GREENPAC` is a documented governed alias in the identity fixtures and appears in historical
   resolution audits. Neither fact links it to revision 1.

Asserting "the one identified holding is AGI Greenpac, and it now has a quote" would be precisely the
symbol-based inference W04's criteria forbid, and would publish a private holding to justify a
convenient count. **This record refuses that.** Coverage therefore remains **0 of 64 measured**, and
whether any holding is covered is an open question for the operator, not an inference for IPD.

---

## 8. Exact next operator action to complete W06

W06 needs a **freshness observation**, then a **per-holding coverage pass**. They are listed in the
order that retires the cheapest missing criterion first. Step 1 does **not** spend a vendor request;
steps 2 onwards do, and need their own authorization.

### Step 1 (next action) — capture the separate freshness observation for this quote

**Purpose:** retire R2 and move R4 from "mechanized" to "observed", without spending a vendor request.

**Verified command** — the shape below is the route contract asserted by
[`tests/ipd_p5_freshness_http.test.ts`](../../tests/ipd_p5_freshness_http.test.ts) (36/36 passing at
`836dbcf`) and documented in [W-11 §`GET /v1/freshness`](DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md)
and [`docs/IPD-P5-FRESHNESS-HTTP.md`](../../docs/IPD-P5-FRESHNESS-HTTP.md). All four query parameters are
required exactly once; `securityId` must be URL-encoded.

```powershell
# Windows PowerShell, in the session that holds the transport token.
$q = 'domain=D01_QUOTES' +
     '&companyId=EQ_AGI_IN' +
     '&exchangeSegment=NSE_EQ' +
     '&securityId=' + [uri]::EscapeDataString('ISIN:INE415A01038:EQ')
$f = Invoke-RestMethod -Uri "http://127.0.0.1:8791/v1/freshness?$q" `
     -Headers @{ Authorization = "Bearer $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN" }
$f | ConvertTo-Json -Depth 8
```

**Prerequisites — all must hold, and each has a failure mode that is not a W06 finding:**

| # | Prerequisite | If it does not hold |
|---|---|---|
| P1 | The **same daemon process** that served the quote is still running. Its observation cache and `lastRefresh` history are in-memory only. | After a restart the quote cache is empty: the read returns `cacheState: MISS`, `verdict: UNKNOWN`, `lastRefresh.outcome: UNKNOWN`. That is a correct answer to a different question, not a failure to record. |
| P2 | `IIPS_MARKET_DATA_TRANSPORT_TOKEN` is set in that session. | The daemon answers `401 UNAUTHENTICATED`. Set the token and re-read; do not re-quote. |
| P3 | The read happens promptly after the quote. | Age thresholds: `GOOD` ≤ 900 s, `STALE` ≤ 1,800 s, `UNAVAILABLE` beyond (§5.4). Read inside 15 minutes for a `GOOD` verdict; inside 30 for a usable `STALE`. |
| P4 | Do **not** set `IIPS_TRADING_CALENDAR_PATH` for this read. | A session-aware read of this observation fails closed with `calendarIssue: MISSING_COVERAGE` / `UNAVAILABLE` because `.2` has no NSE row for `2026-11-25` (V24). Without a calendar the response is honestly labelled `LEGACY_ELAPSED_UNQUALIFIED` / `NOT_CONFIGURED`. Either is recordable; conflating them is not. |
| P5 | Zero further quote requests. | `POST /v1/quotes` would refresh or re-spend the vendor request. Do not call it. |

**Capture, verbatim, into one block:** the exact command, the full JSON response, the wall-clock time
of the read, whether a calendar was configured, and the daemon's start time or PID. The read is
read-only and may be repeated if a field is unreadable — repeating a **read** is not repeating the
quote.

**Interpretation key — decidable in advance, so no interpretation happens after the fact:**

| Observed | Meaning | What it satisfies |
|---|---|---|
| `cacheState: CURRENT`, `timestampEvidence: VALID`, `verdict: GOOD`, `eligibleForUse: true` | The retained observation is independently reported fresh by the status surface | R2 met for this instrument; R4 gains an observed `GOOD` case |
| `cacheState: STALE`, `verdict: STALE`, `staleConcessionActive: true`, `eligibleForUse: true` | Aged but usable | R2 met; R4 gains an observed `STALE` case |
| `cacheState: UNAVAILABLE`, `suppressExecution: true` | Beyond twice the threshold | R4 gains an observed `UNAVAILABLE` case; R2 for the *current* instant is `UNAVAILABLE`, which is a legitimate verdict |
| `calendarIssue: MISSING_COVERAGE` with a calendar configured | Calendar coverage, not freshness, is missing | Record it as such; it is the `.2` gap, and closing it is a calendar publication task |
| `cacheState: MISS` / `verdict: UNKNOWN` | Wrong process, or a restart (P1) | Not a W06 result; fix P1 and re-read |

### Step 2 — per-holding coverage against the stored revision (separately authorized)

**Purpose:** retire R3 and R7 and start measuring aggregate coverage.

**Precondition:** the per-holding identities of revision 1 that are actually stored. There is only
**one** today, and its identity is not in this repository (§7) — so this step cannot even be specified
per row from committed material, and IPD will not guess it. The operator holds it, or a later import
writes more (the PR #163 dependency already recorded).

**Prerequisites:** a running daemon with the governed P7 registry loaded; a transport token; the stored
identity `ISIN:<isin>:<series>` plus `companyId` and `exchangeSegment` for each holding to be measured;
an explicit, pre-declared cap on the number of vendor requests and a reason for that number, written
**before** the run; and separate authorization for the vendor spend. Prefer `GET /v1/freshness` reads
first: they spend nothing and will honestly report `MISS` where no observation exists.

**Do not** run an unbounded sweep. W-14's 97-request E4 qualification is a different, separately
authorized work item with unresolved scope questions of its own; W06 coverage measurement must not
merge into it.

### Step 3 — record and close

Append the outputs to a new evidence directory and a new record; update the W06 tracker again. W06 may
be proposed for acceptance only when R1–R7 each have evidence or an explicit, disclosed limitation —
and not before.

---

## 9. Reproduction boundary

**Do not repeat the AGI quote request** to "confirm" this record, and do not re-run any acceptance
script for it. The observation is complete as supplied; the offline verifier in §4 exists precisely so
that no further vendor request is needed to check the transcription. A future, separately authorized
observation needs its own authorization and its own record.

**This record performed no Windows operation.** Every command actually run to produce it was a local
`node`, `npm` or file inspection in the sandbox, against tracked files at `836dbcf`.

---

## 10. Related records

- [W06 broker import and holding identity reconciliation](IIPS-W06-BROKER-IMPORT-HOLDING-IDENTITY-RECONCILIATION-2026-11-18.md) — the 1-of-64 identity starting point and §6's separation of identity and quote coverage
- [DHAN live Reliance quote — operator acceptance](DHAN-LIVE-RELIANCE-QUOTE-OPERATOR-ACCEPTANCE-2026-11-18.md) — the first accepted live observation (`bid: 0, ask: 0`)
- [D-5 bid/ask representation and validation decision](D-5-BID-ASK-REPRESENTATION-AND-VALIDATION-DECISION-2026-11-21.md) — why `639.55`/`640` is materially different from `0`/`0`
- [IPD P5 — read-only freshness status](../../docs/IPD-P5-FRESHNESS-HTTP.md) — the surface the next step needs
- [W-11 daemon configuration and operations](DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md) — route table, calendar activation and its fail-closed behaviour
- [IIPS execution roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md) — W06 status, updated by this record
- [DHAN W-14 / E4 readiness assessment](DHAN-W14-E4-READINESS-ASSESSMENT-2026-11-23.md) — the separately governed multi-instrument qualification this record does not touch
