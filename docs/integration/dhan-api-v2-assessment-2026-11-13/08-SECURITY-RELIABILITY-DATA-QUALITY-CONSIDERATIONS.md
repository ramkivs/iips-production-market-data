# 9 — Security, Reliability and Data-Quality Considerations

**Purpose:** the security, reliability and data-quality properties that follow from the documented
Dhan surface and from IPD's existing implementation, with severity and evidence for each.

**Three distinct lenses are kept separate:** **SEC** (security), **REL** (reliability/availability),
**DQ** (data quality/correctness).

---

## 9.1 Security (SEC)

### 9.1.1 What IPD already does well — and must not regress

| # | Control | Evidence | Assessment |
|---|---|---|---|
| S-1 | **Credentials resolved per request, never stored on the instance** | `dhan_api_client.ts:14–20` | Correct. A long-lived WebSocket would be a *different* risk model (a credential held for the socket's lifetime) — relevant to any future feed work. |
| S-2 | **Vendor error bodies never echoed** | `dhan_api_client.ts:307–310` ("Error bodies are never echoed back, preventing credential reflection") | **Correct and load-bearing.** Note this is exactly the control that makes gap **G-06** non-trivial: the fix must extract a *code* and a *sanitised* message without reintroducing reflection. |
| S-3 | **Transport token separate from vendor credentials** | `dhan_market_data_http.ts:21–24` (`IIPS_MARKET_DATA_TRANSPORT_TOKEN` ≠ Dhan credentials) | Correct. Preserves the zero-plaintext boundary. |
| S-4 | **Constant-time token comparison** | `dhan_market_data_http.ts` (`timingSafeEqual`) | Correct. |
| S-5 | **Loopback-only binding + host guard** | `dhan_market_data_http.ts:171–176` (`LOOPBACK_HOSTS`, `isLoopbackTransportHost`) | Correct — prevents the local market-data surface from being exposed. |
| S-6 | **Request-body cap 16 KiB; POST-only except health** | `dhan_market_data_http.ts` (`MARKET_DATA_MAX_REQUEST_BYTES`, route table) | Correct. |
| S-7 | **Fail closed on missing transport token — the server refuses to start** | `dhan_market_data_http.ts` | Correct. |
| S-8 | **No production egress without authorisation** | `isDhanProductionEnvironment` (`dhan_config.ts`); `PRODUCTION_NOT_AUTHORIZED` failure code | Correct, and directly relevant to §10. |
| S-9 | **NFR-06 Provider Masking Enforcement** | `sanitizeProvenanceForConsumer` (`src/contracts/provenance.ts`) — "vendor-specific internal names or network locations are masked into strictly governed source classifications" | Correct. **Note the tension with §8.5:** a report that must *cite* a Dhan value must do so at the source-classification level, or through an explicit governed decision. This package does not assume the latter. |
| S-10 | **Provider-neutral consumer boundary** | `src/server/market-data/dhanMarketDataRoute.ts:20–32` — IRR never reads `IIPS_DHAN_*`, never resolves a Dhan `SecretRef`, never constructs a Dhan client | Correct. |
| S-11 | **Browser-bundle exclusion** | `dhanMarketDataRoute.ts` — the constructor fails if a browser `window` global is present | Correct. |

### 9.1.2 Security considerations arising from the Dhan surface

| # | Consideration | Severity | Evidence | Assessment |
|---|---|---|---|---|
| S-12 | **Access token in the WebSocket URL query string** | **HIGH** | `P5 p.1` (`?version=2&token=…&clientId=…&authType=2`); `P6 p.1` (same for both depth URLs) | The token appears in the **URL**, which commonly lands in proxy logs, CDN logs, and any client-side log. IPD's design keeps credentials out of URLs for the REST path; a WebSocket path must **not** simply copy the vendor's URL form. A header- or subprotocol-based credential, where the platform supports it, is preferable; failing that, the URL must never be logged. **This is a design constraint for any future feed work, recorded now.** |
| S-13 | **`authType=2` is a fixed, unrotatable literal in the documented URL** | MEDIUM | `P5 p.1`, `P6 p.1` | A single static auth mode offers no per-connection rotation. Combined with S-12, a token rotation invalidates in-flight sockets — an operational and security trade-off to resolve before any feed exists. |
| S-14 | **Token lifetime is not documented** | MEDIUM | `P1 p.5` gives `807` "Access token is expired" but **no** lifetime, refresh mechanism, or rotation procedure | IPD cannot schedule rotation, nor reason about the blast radius of an expiry mid-session. Must be asked (gap **G-15**). |
| S-15 | **Credential and entitlement failures share one HTTP status** | **HIGH** | D-9; `806` and `807`–`810` both observed as 401 | Operationally this means an **entitlement** failure is indistinguishable from a **credential** failure inside IPD — the two have completely different owners (vendor account management vs secret rotation). Must be separated (gap **G-06**). |
| S-16 | **No vendor-side IP allowlist, per-endpoint scoping or scope model is documented** | MEDIUM | absent from all nine documents | IPD cannot verify that the credential it holds is scoped to read-only market data. **Read-only intent is currently an IPD-side convention, not a vendor-enforced guarantee.** Worth confirming with the vendor. |
| S-17 | **Instrument master is served from a CDN-style host (`images.dhan.co`), not the API host** | MEDIUM | `dhan_instrument_master_source.ts:22–23` | A **different trust boundary** and a different failure/compromise domain from `api.dhan.co`. The master file's content becomes IPD's identity authority, so its integrity matters disproportionately: see DQ-6. |
| S-18 | **The CSV is fetched over plain HTTPS with no checksum verification against a published digest** | **HIGH** | `P9` states no checksum; `dhan_instrument_master_source.ts` performs no digest check | IPD **can** fix this unilaterally: record the SHA-256 of the retrieved bytes at fetch time (§9.3, DQ-6). It **cannot** detect an upstream silent change without a vendor-published digest — a clarification item. |

---

## 9.2 Reliability (REL)

| # | Consideration | Severity | Evidence |
|---|---|---|---|
| REL-1 | **The only implemented data path is blocked** | **BLOCKING** | `806` — `P1 p.5`; W-06 record at `c260a82` |
| REL-2 | **A single REST snapshot call is the only price source** | HIGH | `dhan_api_client.ts:96` — one endpoint, one request per instrument per quote |
| REL-3 | **No retry policy is visible in the provider path** | HIGH | No retry/backoff around the vendor call is present in `dhan_api_client.ts`/`dhan_market_data_service.ts`; the *ability* to throttle exists (`observeThrottle`) but is unwired, and vendor throttle signals are unparsed. A transient `800` (Internal Server Error) is therefore indistinguishable from a permanent error. |
| REL-4 | **No circuit breaker** | MEDIUM | Nothing in `src/providers/dhan/` opens or closes on sustained failure. A sustained `806`/auth failure would generate a request per attempt indefinitely. |
| REL-5 | **No timeout policy is visible on the vendor call** | MEDIUM | `dhan_market_data_http.ts` bounds the **local** transport request; the vendor call's timeout handling is not evident in the provider path. `TIMEOUT` exists as a failure code, but the timeout that produces it is not evident from the provider files. |
| REL-6 | **The shared limiter couples unrelated families** | HIGH | `dhan_market_data_service.ts:114` — one 60/min bucket for quotes, history and any future endpoint. Historical back-fills can exhaust the budget needed for quotes, producing quote starvation with no obvious cause. |
| REL-7 | **The historical path can fail on data conditions, not only transport** | MEDIUM | `dhan_historical_adapter.ts` — ragged arrays, duplicate and out-of-order candles fail closed. This is *correct* behaviour, but it means a single anomalous vendor row fails a whole request rather than being isolated. |
| REL-8 | **No circuit/fallback for a stale quote** | MEDIUM | `dhan_freshness_status.ts` computes `verdict` (`GOOD`/`STALE`/`UNAVAILABLE`/`UNKNOWN`) and `cacheState`; the D01 freshness threshold is 15 minutes (`src/quality/freshness_evaluator.ts:16`) and D02 is 24 hours (`:17`). A stale quote must be suppressed (`STALE_DATA_SUPPRESSED`) rather than served — the mechanism exists. |
| REL-9 | **WebSocket would introduce a long-lived connection and an idle-connection failure mode** | MEDIUM | `P5 p.3` — server pings every 10 s and closes if unanswered for 40 s | Any future feed implementation needs a heartbeat monitor, a reconnect policy with **backoff**, and a rule for what happens to the freshness verdict while disconnected. None of this exists. |
| REL-10 | **Rate-limit burst risk** | HIGH | D-13; the 60/min rolling bucket permits a burst that the documented 1 req/s family cap forbids |
| REL-11 | **Availability of the analytics/company endpoints is entirely uncharacterised** | MEDIUM | `P7` documents no SLA, rate limit or availability statement for `/data/*` |
| REL-12 | **The instrument master has no documented refresh cadence** | HIGH | D-19; `P9` states no update frequency. IPD's refresh strategy is therefore unverifiable against the vendor's publication cycle. |
| REL-13 | **The local daemon's health endpoint never implies live connectivity** | LOW (positive) | `dhanMarketDataRoute.ts` — `daemonAvailable` distinguishes "answered" from "live provider qualified" |

---

## 9.3 Data quality (DQ)

| # | Consideration | Severity | Evidence |
|---|---|---|---|
| DQ-1 | **The REST Quote response shape is undocumented** | **HIGH** | `P4 p.1` names the endpoint and nothing else. `dhan_dto.ts:44–56` assumes 13 field names, only 4 of which (`last_price`, `ohlc.*`, `volume`) have any counterpart in the published set (via `P3`, for a *different* endpoint). |
| DQ-2 | **Required-quote-field set may be wrong** | HIGH | `dhan_dto.ts:73` requires `last_price`, `ohlc`, `volume`, `last_trade_time`. If the real payload uses different names, the parser rejects valid responses (`MISSING_REQUIRED_FIELD`) — a loud failure, which is the right kind of wrong — or, if `volume`/`last_trade_time` are absent from the payload, the whole quote path fails while the data is fine. |
| DQ-3 | **`last_trade_time` format is assumed, not documented** | HIGH | `dhan_dto.ts:225–268` enforces `DD/MM/YYYY HH:mm:ss` and a real-calendar check, converting to UTC. The format appears in **no** published document. If the vendor sends ISO-8601, every quote fails. Conversely, if it sends something else, the same. **This is the single most likely point of failure in the implemented path**, and it is invisible until entitlement exists. |
| DQ-4 | **`net_change` is required for `previousClose`** | HIGH | `dhan_normalizer.ts:101–110` — IPD refuses to proceed without it, and refuses `ohlc.close` as a substitute. Correct behaviour. But `net_change` is undocumented, and `dhan_dto.ts:133` treats it as **optional** in the DTO while the normaliser treats it as **mandatory** — an internal inconsistency in the assumption set. |
| DQ-5 | **`bid`/`ask` may be silently `0`** | **HIGH** | `dhan_normalizer.ts:50–54` returns `0` for a missing or non-positive level; `src/contracts/d01_quotes.ts` does **not** require `bid`/`ask` to be positive (unlike `ltp`, `open`, `high`, `low`, `previousClose`, which it does) ⇒ a depth-less quote yields a **valid** envelope with `bid = 0`, `ask = 0`. Downstream, `0` reads as "no bid/no ask" rather than "depth unavailable". |
| DQ-6 | **Instrument-master integrity and staleness are untracked** | **HIGH** | `P9` — no version, checksum, or cadence; `dhan_instrument_master_source.ts` records no digest. The master is the **identity authority**; a silent upstream change is undetectable. |
| DQ-7 | **Book ordering and depth level count are not validated** | HIGH | `dhan_normalizer.ts:50–54` — `levels[0]` is taken with no monotonicity check and no expected-level-count check. An inverted or truncated book yields wrong top-of-book with **no error**. |
| DQ-8 | **Bid/ask side convention is unverifiable for the REST payload** | **HIGH** | D-3, D-18 |
| DQ-9 | **Company Info values are `String`-typed and unit-ambiguous** | HIGH | `P1 p.10–13` — `MARKET_CAP` "in Rs Cr.", `EBITDA` "in ₹ crore", `BOOK_VALUE` "in ₹", percentages without a stated unit. A naive numeric parse mixes crore and rupee magnitudes by 10⁷. |
| DQ-10 | **Company Info has no period anchor** | HIGH | D-21 |
| DQ-11 | **`isAdjusted` cannot be grounded** | HIGH | `d02_ohlcv.ts:24` makes it mandatory; no adjustment policy is documented anywhere |
| DQ-12 | **Historical timestamps are assumed epoch-seconds-at-candle-start** | MEDIUM | `dhan_historical_dto.ts:31–33`, `dhan_historical_adapter.ts`. If the vendor sends candle-**end** timestamps, every candle is mislabelled by one interval — a systematic, silent error. |
| DQ-13 | **Historical interval vocabulary is IPD's own** | MEDIUM | `dhan_historical_dto.ts:19–24` — explicitly "PROVISIONAL (published docs only, not live-qualified)". `1h` appears in neither documented vocabulary. |
| DQ-14 | **`securityId` is transmitted as a JSON string; the vendor examples use integer arrays** | MEDIUM | IPD emits strings; `P3 p.1` and `P5 p.2`/`P6 p.2` show integer security IDs. Already recorded as a tolerated deviation in the W-06 request-conformance document. If the vendor is strict about types, `814 Invalid Request` may result. |
| DQ-15 | **P7 qualification coverage is 96 of 23,764** | MEDIUM | `evidence/dhan-p7/qualification-report.md`. 23,644 rejected `REJECTED_NO_P04_CORRESPONDENCE`; 24 `REJECTED_INVALID_FIELD`. Even with entitlement, Dhan data would cover a small fraction of the equity universe. |
| DQ-16 | **Freshness thresholds are IPD's own and generic** | LOW | `src/quality/freshness_evaluator.ts:15–25` — D01 15 min, D02 24 h, D05 30 d. Dhan documents no freshness guarantee, so IPD's thresholds are assumptions; they are reasonable but unverifiable. |
| DQ-17 | **No provenance of "as-of" for the instrument master** | MEDIUM | A `P7` snapshot has a fetch time but no upstream "as of" — so a stale master cannot be distinguished from a current one |

---

## 9.4 Risk concentration

| Lens | Highest | Concentration |
|---|---|---|
| **Security** | S-12 (token in WebSocket URL), S-15 (entitlement ≠ credential), S-18 (unverified master integrity) | All three are **future-facing** except S-15, which is live today and already caused the W-06 misdiagnosis risk |
| **Reliability** | REL-1 (blocked), REL-2/REL-6/REL-10 (single path, coupled budget, burst risk) | Concentrated in the orchestrator, where it is also **most fixable** |
| **Data quality** | DQ-3 (`last_trade_time` format), DQ-1/DQ-2 (Quote shape), DQ-5/DQ-7 (depth semantics), DQ-9/DQ-10 (Company Info typing and period) | Concentrated in the normaliser, where fail-closed guards are **already the house style** |

---

## 9.5 What this means practically

1. **Most of the implemented path's correctness rests on four undocumented assumptions** — the Quote
   response field names, `last_trade_time`'s format, `net_change`'s presence, and `depth`'s shape.
   All four are currently unverifiable. They are cheap to make *robust* (strict parsing, explicit
   absence states) but not cheap to make *correct* (that needs entitlement or vendor documentation).
2. **The two most valuable hardening steps require no entitlement at all**:
   - **G-06** — parse the vendor error code so `806` ≠ `807`; and
   - **G-05** — distinguish "depth unavailable" from "price 0", and validate book ordering and level count.
   Both are pure fail-closed guards in code IPD already owns, and both are protected by the existing
   test discipline.
3. **The security posture of the *current* implementation is sound** and should be treated as a
   constraint on future work, not a starting point to improve. The WebSocket URL credential form
   (S-12) is the one place where following the vendor's documented pattern would **degrade** IPD's
   posture.
4. **Data quality and reliability failures are mostly *loud*, not silent** — IPD fails closed on
   missing fields, ragged arrays, duplicate candles and invalid timestamps. The exceptions worth
   guarding are exactly the ones that are silent by construction: `bid`/`ask = 0` (DQ-5), book
   ordering (DQ-7), depth side convention (DQ-8), and string-typed numeric fields (DQ-9).
