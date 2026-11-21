# 6 — Documentation Discrepancy and Ambiguity Register

**Purpose:** the authoritative record of every conflicting, ambiguous or absent statement found in
the nine documents, and of how each relates to IPD.

**Standing rule for this document:** contradictions are **recorded, not reconciled**. Where two
statements conflict, both are quoted with their page citations, the resolvability is stated, and the
recommended handling is stated — but **no interpretation in this package depends on silently
preferring one over the other**.

Each entry carries: `ID`, `Severity`, `Area`, `Statement A`, `Statement B`, `Type`, `Resolvable?`,
`Uncertainty`, `IPD impact`, `Recommended handling`.

**Severity scale:** `BLOCKING` (prevents a correct implementation) · `HIGH` (would cause wrong
numbers or wrong behaviour) · `MEDIUM` (forces an assumption) · `LOW` (cosmetic / naming only).

---

## D-1 — Indicator naming: `STOCHASTIC` vs `STOCH`

| | |
|---|---|
| **Severity** | MEDIUM |
| **Area** | F — analytics |
| **Statement A** | `P1 p.7` (alert Indicator Name list): **`STOCHASTIC`** — "Stochastic Oscillator". The same list also carries `MACD_26`, `MACD_12`, `MACD_HIST`, `ATR_14`, `STOCHRSI_14`, `BB_UPPER`, `BB_LOWER`, `RSI_14`, `SMA_*`, `EMA_*`. |
| **Statement B** | `P1 p.9` (Market Analytics indicator list): **`STOCH`** — "Stochastic Oscillator, K: 9 / D: 6". `STOCHASTIC` does **not** appear on this list. |
| **Type** | Same indicator, two identifiers, in two lists inside the same document |
| **Resolvable?** | **No** — the document does not state that they are aliases, nor which one `/data/technical` accepts. `STOCHRSI_14` (Stochastic RSI) is a **different** oscillator, so it cannot serve as the bridge. |
| **Uncertainty** | A request naming `STOCHASTIC` might be rejected, silently ignored, or accepted; and the alert list's `MACD_26`/`MACD_12` have no analytics counterpart at all. |
| **IPD impact** | None today — no analytics call exists. Would become a hard blocker at the first `/data/technical` implementation. |
| **Recommended handling** | Treat the two identifiers as **distinct and unverified**. Do not normalise one to the other in code. Any future implementation must probe the accepted set against an entitled account and record the result as evidence. Until then, a `/data/technical` adapter must carry a **vendor-identifier → canonical-identifier map with an explicit `UNCERTAIN` state** for the unconfirmed ones. |

---

## D-2 — MACD has no single canonical identifier

| | |
|---|---|
| **Severity** | MEDIUM |
| **Area** | F — analytics |
| **Statement A** | `P1 p.7` (alert list): `MACD_26` "MACD long-term component", `MACD_12` "MACD short-term component", `MACD_HIST` "MACD histogram" — three separate identifiers. |
| **Statement B** | `P1 p.9` (analytics list): **`MACD_HIST` only** — "MACD histogram (MACD line minus Signal line), Fast: 12 / Slow: 26 / Signal: 9". `MACD_12` and `MACD_26` are absent. |
| **Type** | Identifier-set divergence between two lists in one document |
| **Resolvable?** | **Partially** — `MACD_HIST` is common to both lists, and its fixed parameters (12/26/9) are stated once. But the *values* of the MACD line and Signal line are not exposed as separate analytics identifiers, so a consumer that needs them has no documented route. |
| **Uncertainty** | Whether `/data/technical` returns the MACD line and Signal line at all is unstated. |
| **IPD impact** | None today. |
| **Recommended handling** | Use `MACD_HIST` only. Do not synthesise MACD/Signal series from `MACD_HIST`. Treat `MACD_12`/`MACD_26` as **alert-list-only** identifiers. |

---

## D-3 — Bid/ask labelled as the opposite of market convention

| | |
|---|---|
| **Severity** | **HIGH** |
| **Area** | E — depth |
| **Statement A** | `P6 p.4` and `P6 p.5`: the 20-level and 200-level depth packets carry Feed Response Codes **`41` for "Bid Data (Buy)"** and **`51` for "Ask Data (Sell)"**. The same pages additionally describe the content in prose as **"you will receive the bid (sell) and ask (buy) data packets separately"** (p.4 for 20-level, p.5 for 200-level) — i.e. the prose says bid↔**sell** and ask↔**buy**, while the table says Bid↔**Buy** and Ask↔**Sell**. |
| **Statement B** | `P5 p.6–7`: the live-feed 5-level depth packet is described with **`Bid Quantity`/`Ask Quantity`**, **`No. of Bid Orders`/`No. of Ask Orders`**, **`Bid Price`/`Ask Price`** — and `P5 p.5–6` for the Full packet lists **`Total Sell Quantity`** (26–29) and **`Total Buy Quantity`** (30–33) as **separate** fields, i.e. the vendor distinguishes buy-side and sell-side *totals* from bid and ask *levels*. |
| **Type** | **Label inversion**, and — within `P6` alone — an **internal** inconsistency between the table (p.4–5) and the prose (p.4–5) |
| **Resolvable?** | **No.** Market convention is that a **bid is a buy** order and an **ask is a sell** order; `P5` follows that convention. `P6`'s *table* follows it too (Bid↔Buy, Ask↔Sell) while `P6`'s *prose* inverts it. The vendor does not state which is authoritative. |
| **Uncertainty** | If a 20/200-level feed were implemented on the table's reading, the bid and ask sides would be **swapped** — a silent, high-impact inversion producing wrong spread, wrong imbalance and wrong liquidity metrics with **no error surfaced**. |
| **IPD impact** | Today: **none directly**, because no WebSocket depth exists. **Indirectly and materially**: IPD's REST path maps `depth.buy → bid` and `depth.sell → ask` (`dhan_normalizer.ts:132–133`), which follows `P5`'s convention. If the REST payload uses `P6`'s prose convention instead, **IPD's existing mapping is inverted** — and there is no documentation of the REST payload to check against. |
| **Recommended handling** | **Do not implement either depth product until the vendor confirms the side labelling in writing.** Record the label convention as a per-product attribute (`bidSideMeans: 'BUY' \| 'SELL' \| 'UNKNOWN'`), default it to `UNKNOWN`, and make the normaliser **fail closed** on `UNKNOWN` rather than guess. For the existing REST path, treat bid/ask as `UNCERTAIN` and label them so in any downstream use. This is gap **G-03** and **G-05**. |

---

## D-4 — `11` carries two meanings; `12` is absent from the depth document

| | |
|---|---|
| **Severity** | **HIGH** |
| **Area** | D/E — feed control |
| **Statement A** | `P1 p.3` (Feed Request Code): **`11` = Connect Feed**, **`12` = Disconnect Feed**. `P5 p.7` shows the disconnect JSON as `{"RequestCode" : 12}`, consistent with A. |
| **Statement B** | `P6 p.6`: **"Connect the feed — 41"** (JSON `{"RequestCode" : 41}`) and **"Disconnect the feed — 11"** (JSON `{"RequestCode" : 11}`). `P6` states explicitly that "Stopping a single instrument and closing the whole feed are two different operations, with two different request codes. They are not interchangeable." **Request code `12` is never mentioned in `P6`.** |
| **Type** | **Direct contradiction on the meaning of `11`**, plus a code (`41`) that is simultaneously a *request* code (connect, `P6 p.6`) and a *feed response* code (Bid Data, `P6 p.4`–`p.5`) |
| **Resolvable?** | **No.** `P1` is the annexure and says `11` = Connect; `P6` says `11` = Disconnect. Both cannot be true of the same product. A plausible reading is that the depth product uses a **different request-code namespace** than the live feed — but the documents never say so, and `23`/`25` **are** shared between the two products (P1 p.3 lists `23` Subscribe Full Market Depth and `25` Unsubscribe Full Market Depth; `P6 p.2`/`P6 p.6` use the same `23`/`25`). So the "separate namespace" theory is **not** supported either. |
| **Uncertainty** | Sending `11` on a depth socket could open a feed instead of closing one — i.e. **the opposite of the intended action** — with no error, and possibly leaving a subscribed feed running. |
| **IPD impact** | None today (no WebSocket). Would be a **Critical** implementation hazard at the first depth-feed work item. |
| **Recommended handling** | Treat the depth-product control codes as **`UNCERTAIN`** until the vendor confirms them. Require an explicit, tested mapping table per product, and assert the expected outcome (feed open / feed closed) rather than assuming the request was accepted. Recorded as gap **G-04**. |

---

## D-5 — Two different response-header layouts, never explicitly distinguished

| | |
|---|---|
| **Severity** | MEDIUM |
| **Area** | D/E — framing |
| **Statement A** | `P5 p.3`: the live feed's response header is **8 bytes** — byte 0 = Feed Response Code, bytes 1–2 = `int16` message length, byte 3 = Exchange Segment, bytes 4–7 = `int32` Security ID. |
| **Statement B** | `P6 p.3–4`: the depth feed's response header is **12 bytes** — bytes 0–1 = `int16` message length, byte 2 = Feed Response Code, byte 3 = Exchange Segment, bytes 4–7 = `int32` Security ID, bytes 8–11 = `uint32` message sequence (20-level) / "No of Rows" (200-level). |
| **Type** | Different products with different framings — **not a contradiction in itself**, but the documents never state that the two feeds are distinct protocols, and `P6 p.7` reuses the generic "code 50" disconnect description. |
| **Resolvable?** | The two layouts are fully specified and mutually consistent within their own documents. The **ambiguity** is the absence of an explicit statement that they are different protocols, which invites an implementation that assumes one parser. |
| **Uncertainty** | A parser built on `P5`'s layout would mis-parse every depth packet. Byte-order of the length field also differs in position (bytes 1–2 vs bytes 0–1) — a silent offset error. |
| **IPD impact** | None today. |
| **Recommended handling** | Any future feed implementation must have **separate, separately-tested binary decoders** per host, keyed by endpoint URL, with **no shared header struct**. A shared header would be the single most likely defect. |

---

## D-6 — Disconnect reason payload offset differs between the two feeds

| | |
|---|---|
| **Severity** | MEDIUM |
| **Area** | D/E — disconnect |
| **Statement A** | `P5 p.7`: live feed disconnect packet — 8-byte header, code `50`, **bytes 8–9 = `int16` disconnection message code**. |
| **Statement B** | `P6 p.7`: depth feed disconnect packet — 12-byte header, code `50`, **bytes 12–13 = `int16` disconnection message code**. |
| **Type** | Offset difference, consistent with D-5's different header sizes — but never stated as such |
| **Resolvable?** | **Yes, structurally** — 8 + 2 vs 12 + 2 is exactly what the two header sizes predict. Not a contradiction, but the documents do not make the link. |
| **Uncertainty** | The **meaning** of the reason code is unavailable: see D-7. |
| **IPD impact** | None today. |
| **Recommended handling** | Treat the offset as product-specific. **The reason code cannot be interpreted at all** until D-7 is closed — so a disconnect reason must be surfaced as an **opaque numeric code**, never mapped to a user-facing cause. |

---

## D-7 — The disconnection-message-code table is externalised and absent from the set

| | |
|---|---|
| **Severity** | **BLOCKING** (for any feed implementation) |
| **Area** | H — error taxonomy |
| **Statement A** | `P5 p.7`: "You can find detailed Disconnection message code description **here**." — a hyperlink. |
| **Statement B** | `P6 p.7`: identical sentence and hyperlink. |
| **Where it points** | The hyperlink resolves to an **annexure anchor** (`…/annexure#data-api-error`). **The Annexure in the published set (`P1`) contains no disconnection-message-code table** — P1 p.4–5 has the Feed Response Code table, the Trading API Error table and the Data API Error table, and nothing else. |
| **Type** | **Documentation gap** — a table the documents depend on is not in the published set |
| **Resolvable?** | **No, from the published set.** Resolvable only by a vendor clarification or by an entitled live observation. |
| **Uncertainty** | A disconnect reason code is an `int16` — up to 32,767 distinct meanings — none of which is interpretable from the set. |
| **IPD impact** | None today. Would make feed-failure diagnosis impossible: IPD could report "disconnected, reason 4213" and nothing more. |
| **Recommended handling** | Request the table from the vendor as a **clarification item** (gap **G-04**). In the meantime, expose the raw code and a **stable IPD-side classification limited to what is derivable**: `TRANSPORT_CLOSED_BY_PEER`, `HEARTBEAT_TIMEOUT`, `PROTOCOL_ERROR`, `CREDENTIAL_REJECTED`, `SOCKET_LIMIT_EXCEEDED` — the last of which is documented (`P5 p.7`, `P6 p.7`: ">5 websockets … disconnected with 805"). Everything else = `UNKNOWN_VENDOR_CODE`. **No invented code semantics.** |

---

## D-8 — `805` is used at two different layers

| | |
|---|---|
| **Severity** | MEDIUM |
| **Area** | G/H — limits & errors |
| **Statement A** | `P1 p.5` (Data API Error, REST): **`805` = "Too many requests or connections — further requests may result in blocking"**. |
| **Statement B** | `P5 p.7` and `P6 p.7` (WebSocket): "If more than 5 websockets are established, then the first socket will be disconnected with **805**". |
| **Type** | **Transport/application conflation** — one numeric code spans two transports with different remediations |
| **Resolvable?** | **Yes, structurally** — the meaning is transport-dependent, and both statements are individually clear. The confusion is that the same numeral appears in two tables with different semantics. |
| **Uncertainty** | Which table applies depends on the transport, which is known at the call site — so this is resolvable in code, but only if the code namespaces are separated. IPD's current single `HTTP_ERROR` fallback cannot distinguish "throttled" from "socket limit exceeded". |
| **IPD impact** | Today: `805` over REST is currently mapped to `HTTP_ERROR` (not 429, not 401) — **indistinguishable from any other server error**. |
| **Recommended handling** | Parse vendor codes and map them **per transport**: a REST `805` → throttled/blocked; a WebSocket `805` → socket-limit exceeded. Both should map to an IPD code that **distinguishes throttling from other errors**, because the remediation differs (back off vs close an extra socket). Gap **G-07**. |

---

## D-9 — Error code vs HTTP status semantics are never mapped

| | |
|---|---|
| **Severity** | **HIGH** |
| **Area** | H — error taxonomy |
| **Statement A** | `P1 p.4–5`: the Trading API Error table has columns **TYPE / CODE / MESSAGE**; the Data API Error table has columns **CODE / DESCRIPTION**. **Neither has an HTTP-status column.** |
| **Statement B** | Empirically, the W-06 probe returned **HTTP 401** with body `{"data":{"806":"Data APIs not Subscribed"},"status":"failed"}` — i.e. `806` (an *entitlement* condition, per `P1 p.5`) arrived with an HTTP status that means *unauthorised*. |
| **Type** | **Absent documented mapping + empirically conflicting signal** |
| **Resolvable?** | **No, from the set.** The set contains no status mapping for any code. |
| **Uncertainty** | `806`, `807`, `808`, `809`, `810` are all credential/entitlement conditions with distinct remediations (activate subscription vs refresh token vs fix client id). Under HTTP-status-only mapping they **collapse into one**. `811`–`814` are caller errors (bad expiry, bad date format, bad security id, bad request) — and a `814` reported as HTTP 401 would be catastrophically misdiagnosed as an auth problem. |
| **IPD impact** | **Material and already realised.** `mapHttpStatus` (`dhan_api_client.ts:311–325`) maps `401|403 → AUTHENTICATION_FAILURE`. W-06 reached the correct root cause (`806`, subscription inactive) only by reading the vendor's error body **out-of-band** — the code path does not do it. `dhan_dto.ts:62` declares `remarks?: unknown` and never reads it; no parser for `errorCode`/`errorType`/`data.code` exists in `src/providers/dhan/`. |
| **Recommended handling** | Parse the vendor error body and map **vendor code → canonical failure**, with the HTTP status as a **secondary** signal. The credential-reflection defence (never echo error bodies) must be **preserved**: extract the **code** and a **sanitised, non-reflective message**, never the raw body. Gap **G-06**, and this is the single highest-value fix in the register. |

---

## D-10 — The rate-limit error code `RL001` appears in no code table

| | |
|---|---|
| **Severity** | MEDIUM |
| **Area** | G/H |
| **Statement A** | `P8 p.1`: the rate-limit response body is `{"status":"failure","errorType":"RATE_LIMIT_ERROR","errorCode":"RL001","errorMessage":"Too many requests. Please retry after 1 second."}` — and the message body implies a **1-second** retry delay. |
| **Statement B** | `P1 p.4–5` — the only code tables in the set — contain **no `RL001`** and no `errorType` field. |
| **Type** | A **fifth** error vocabulary outside the annexure |
| **Resolvable?** | **Yes for the code** (`RL001` is unambiguous as "rate limited"). **Not** for the retry delay: the message says "retry after 1 second" but that is an **example message**, and the actual `Retry-After` value is not stated. |
| **Uncertainty** | The retry interval may vary by which limit was breached (the Option Chain limit is 3 s, the scrip cap is 8 s — `P8 p.1`). No `Retry-After` **header** is documented anywhere. |
| **IPD impact** | IPD cannot recognise a rate-limit rejection whose HTTP status is not `429` — it becomes `HTTP_ERROR`. `observeThrottle` exists (`dhan_operational_controls.ts:152`) but **has no production caller**; its only caller in the repository is the test (`tests/dhan_p4_operational_controls.test.ts:163`). |
| **Recommended handling** | Detect `RL001`/`RATE_LIMIT_ERROR` in the body; treat it as a throttle signal equivalent to `429`; and read a `Retry-After` header **if present** while treating the body's "retry after N second" as a **hint, not a contract**. |

---

## D-11 — Data API Error codes `802` and `803` do not exist

| | |
|---|---|
| **Severity** | LOW |
| **Area** | H |
| **Statement** | `P1 p.5` enumerates `800`, then `804`…`814`. **`802` and `803` are absent**, with no explanation. |
| **Type** | Gap in an enumeration |
| **Resolvable?** | **No.** Could be reserved, retired, or an omission. |
| **Uncertainty** | If `802`/`803` are live codes, a parser keyed on the documented set would treat them as unknown. |
| **IPD impact** | Minimal today — IPD parses no vendor codes at all. |
| **Recommended handling** | Any future code parser must **default unknown codes to a distinct "unrecognised vendor code" state** rather than folding them into a generic error, so that a newly-introduced `802` cannot be silently mis-handled. |

---

## D-12 — Feed Response Codes `41` and `51` are referenced but absent from the Annexure

| | |
|---|---|
| **Severity** | MEDIUM |
| **Area** | E/H |
| **Statement A** | `P6 p.4–5`: the depth packets carry Feed Response Code **`41`** (Bid Data) / **`51`** (Ask Data), annotated "(**see Annexure**)". |
| **Statement B** | `P1 p.4` — the Feed Response Code table — contains only `1`, `2`, `4`, `5`, `6`, `7`, `8`, `50`. **No `41`, no `51`.** |
| **Type** | Cross-reference that does not resolve |
| **Resolvable?** | **No, from the set.** |
| **Uncertainty** | A depth parser would have to hard-code `41`/`51` with no cross-checkable authority, and would have no way to detect a future change. |
| **IPD impact** | None today. |
| **Recommended handling** | If depth is ever implemented, hard-code with a **named constant + a test that pins it**, and record the absence of the annexure entry as the reason the value is unverified. |

---

## D-13 — Market Quote and Data API rate limits have different scopes and no stated relationship

| | |
|---|---|
| **Severity** | HIGH |
| **Area** | G |
| **Statement A** | `P8 p.1`: **"Data APIs — 5 req/sec, 100,000/day"**; **"Market Quote — 1 req/sec, 1,000 instruments/request"** with the daily column **blank**. |
| **Statement B** | `P4 p.1`: "**1 request per second across all market quote endpoints**" — i.e. the 1 req/s cap spans `/marketfeed/ltp`, `/marketfeed/ohlc` **and** `/marketfeed/quote` together. |
| **Type** | **Scope ambiguity**: it is unstated whether the market-quote endpoints are *also* subject to the 5 req/sec Data APIs cap, and whether the 100,000/day applies to them (daily column blank). |
| **Resolvable?** | **No.** The stricter reading (1 req/s governs the quote family, and the daily cap is unknown) is the safe one, but the set does not say so. |
| **Uncertainty** | Whether a client may burst quotes at 5/sec for periods, and what the effective daily ceiling is. The blank daily column could mean "no daily limit" or "not documented". |
| **IPD impact** | IPD's shared 60/min bucket = 1 req/s **average over a rolling minute** — it permits a burst of up to 60 quote requests, which the 1 req/s family cap forbids. Conversely, IPD's ceiling is *stricter* than the 5 req/sec Data APIs cap. And the historical path (`/charts/historical`) consumes the **same** bucket as quotes, so D02 traffic can starve D01 traffic. |
| **Recommended handling** | Adopt the **stricter documented limit** per family until the vendor states otherwise: 1 req/s for the market-quote family; 5 req/s for the data family; a **separate** budget for `/charts/*` (its limit is undocumented — treat as `UNCERTAIN`, default to the stricter of the two). A single global bucket must not be the long-term design. Gap **G-07**. |

---

## D-14 — No rate limit is documented for three documented endpoint families

| | |
|---|---|
| **Severity** | MEDIUM |
| **Area** | G |
| **Statement** | `P8` covers Order APIs, Data APIs, Market Quote and Option Chain. It states **no** limit for **`/charts/*`** (P2), **`/data/*`** (P7) or **`/instrument/*`** (P9), and **no** WebSocket limit beyond socket/instrument counts (P5 p.1–2). |
| **Type** | Documented-scope gap |
| **Resolvable?** | **No.** |
| **Uncertainty** | `/charts/historical` may fall under "Data APIs" (5 req/sec) or may be unlimited — **unknowable from the set**. Same for `/data/technical`. |
| **IPD impact** | IPD applies one 60/min bucket to all of them, which is neither provably sufficient nor provably excessive. |
| **Recommended handling** | **Assert no limit.** Where a limit is unknown, IPD must apply the **stricter** documented limit and mark the endpoint family `LIMIT_UNDOCUMENTED` so the assumption is visible in operations. A universal limit must **not** be asserted anywhere in IPD's documentation or code. |

---

## D-15 — "Data APIs" in the rate-limit table vs "Data API" in the error table are not defined as a scope

| | |
|---|---|
| **Severity** | MEDIUM |
| **Area** | G/H |
| **Statement A** | `P8 p.1` — category "**Data APIs**", 5 req/sec, 100,000/day. |
| **Statement B** | `P1 p.5` — category "**Data API Error**" (codes `800`–`814`); `P2`/`P7` are titled "**Data API** Historical Data" / "**Data API** Market Analytics"; `P4`/`P6` are titled "**Market Quote**" / "**Data API** Full Market Depth". |
| **Type** | **Scope-terminology ambiguity** — the phrase "Data API" is used as a category name in the rate-limit table and as a document/product prefix in five titles, including **"Data API Full Market Depth"** (P6), which is a *WebSocket product* and certainly not a 5 req/sec REST-style family. |
| **Resolvable?** | **No.** |
| **Uncertainty** | Whether "Data APIs 5 req/sec" covers `/data/technical`, `/data/companyinfo`, `/data/marketmovers` is genuinely unstated — these are titled "Data API" but are analytics endpoints. |
| **IPD impact** | Compounds D-13 and D-14: there is no reliable way to derive a per-endpoint budget from the published set. |
| **Recommended handling** | Build the endpoint-family table **explicitly** in IPD (one row per documented endpoint) with a `limitSource` field citing `P8 p.1` or `UNDOCUMENTED`. Do **not** infer membership from the word "Data API". |

---

## D-16 — The `SECURITY_ID` column is absent from the instrument-master dictionary

| | |
|---|---|
| **Severity** | **HIGH** |
| **Area** | A — instruments |
| **Statement A** | `P9 p.1–3` documents the **detailed** CSV's columns and `P9 p.3–4` the **compact** CSV's columns. **`SECURITY_ID` is not listed in either dictionary.** `P9 p.1` says only that the CSVs fetch "a CSV with Security IDs and other important details". |
| **Statement B** | The retained P7 snapshot (`evidence/dhan-p7/source/api-scrip-master-detailed.csv`) has **33 columns including `SECURITY_ID`** (plus 9 further columns P9 does not document: `SM_UPPER_LIMIT`, `SM_LOWER_LIMIT`, `SM_FREEZE_QTY`, `BUY_BO_*`, `BUY_CO_*`), while **all 23 columns P9 does document are present**. |
| **Type** | **Documentation narrower than the artifact** — the identity column on which the whole mapping depends is undocumented |
| **Resolvable?** | **Empirically yes** (the snapshot is direct evidence); **documentarily no** (the published set does not define it). The empirical resolution does **not** generalise: the CSV could change, and no checksum or version marker exists (see D-19). |
| **Uncertainty** | The column's *name* is now known from the artifact; its **stability** is not guaranteed, and its **semantics** (uniqueness scope, reuse after delisting, segment scoping) are undocumented. |
| **IPD impact** | IPD's identity model keys the provider instrument as `${exchangeSegment}:${dhanSecurityId}` (`dhan_instrument_map.ts:192`), so this column is load-bearing. |
| **Recommended handling** | Treat the artifact as **primary evidence for the current file**, and the PDF as **insufficient**. Any parser must **fail closed** on an unrecognised header rather than silently mapping a positional column. Add the missing columns to IPD's own documented snapshot record — a documentation task, not a contract change. |

---

## D-17 — Exchange-segment enumeration has unexplained gaps

| | |
|---|---|
| **Severity** | LOW |
| **Area** | A |
| **Statement** | `P1 p.1`: `IDX_I`=0, `NSE_EQ`=1, `NSE_FNO`=2, **`BSE_EQ`=4**, `MCX_COMM`=5, **`BSE_FNO`=8**. **3, 6 and 7 are absent.** |
| **Type** | Gap in an enumeration, no explanation |
| **Resolvable?** | **No.** |
| **Uncertainty** | Whether the omitted ids exist but are undocumented, or were retired. |
| **IPD impact** | IPD's registry supports only `NSE_EQ` and `BSE_EQ` (`dhan_identity_api.ts:32`: `segment = exchange === 'NSE' ? 'NSE_EQ' : 'BSE_EQ'`), so the gaps do not currently bite. |
| **Recommended handling** | Record the known ids; never synthesise a missing id. If IPD ever needs `NSE_FNO`/`MCX_COMM`, the id must come from the vendor, not from interpolation. |

---

## D-18 — The REST Full Quote depth structure is documented nowhere

| | |
|---|---|
| **Severity** | **HIGH** |
| **Area** | E — depth |
| **Statement A** | `P4 p.1`: `POST /marketfeed/quote` — "Get market depth data of instruments". **P4 documents no request body and no response body at all.** |
| **Statement B** | `P3 p.1–2` documents the response of a **different** endpoint (`/marketfeed/ohlc`): `last_price` + `ohlc{open,high,low,close}` — **with no volume, no depth and no timestamp**. So the one endpoint whose schema *is* published does not include depth, and the endpoint that *does* include depth has no published schema. |
| **Type** | **Documentation gap at the exact point IPD depends on** |
| **Resolvable?** | **No, from the set.** Resolvable only by vendor documentation or entitled live observation. |
| **Uncertainty** | Level count, side labelling, field names, units, ordering, and whether depth is present at all in the REST payload are all unstated. |
| **IPD impact** | **Direct.** `dhan_dto.ts:38–41` defines `depth{buy[], sell[]}` of `{quantity, orders, price}`; `dhan_normalizer.ts:50–54` takes `levels[0]` with **no ordering validation** and **no level-count validation**. If the real payload differs in shape or side convention, the **top-of-book** bid/ask are wrong — silently, since D01 does not require `bid`/`ask` to be positive. |
| **Recommended handling** | **Do not extend** the depth handling. Add (i) a level-count check, (ii) an ordering check, (iii) a "depth unavailable" state distinct from "depth present with price 0" — all as **fail-closed guards**, which do not require knowing the correct shape and are safe under either hypothesis. Separately, request the Quote response schema from the vendor. Gaps **G-05**, **G-14**. |

---

## D-19 — The instrument master has no update cadence, version marker or checksum

| | |
|---|---|
| **Severity** | **HIGH** |
| **Area** | A |
| **Statement** | `P9 p.1–4` documents the CSV URLs and columns. **No update frequency, no version, no checksum, no ETag, no "as of" statement appears anywhere.** |
| **Type** | Documentation gap with direct data-quality consequence |
| **Resolvable?** | **No, from the set.** |
| **Uncertainty** | IPD cannot know whether the master it holds is current, and cannot detect a silent upstream change (a column removed, a `SECURITY_ID` reassigned). |
| **IPD impact** | D05 requires `effectiveFrom`/`effectiveTo` — **effective dating**. Without a version marker, D05's temporal model is unconstructible from Dhan. The P7 qualification result (96 of 23,764) was derived from a **point-in-time snapshot** whose currency is unknown. |
| **Recommended handling** | IPD should record its **own** acquisition metadata (fetch timestamp, SHA-256 of the retrieved bytes) — a provider-neutral, internal measure, requiring no vendor support. This makes staleness *detectable* even though the vendor's cadence is unknown. Gaps **G-09**, **G-14**. |

---

## D-20 — Company Info metrics are typed `String` for numeric quantities

| | |
|---|---|
| **Severity** | MEDIUM |
| **Area** | F |
| **Statement** | `P1 p.10–13`: **every** Company Info field — `MARKET_CAP`, `EPS`, `EBITDA`, `BOOK_VALUE`, `PE_RATIO`, `PB_RATIO`, `DEBT_TO_EQUITY`, `ROE`, `ROCE`, `DIVIDEND_YIELD`, `FIFTY_TWO_WEEK_HIGH/LOW`, `PROMOTER_HOLDING`, `DII_HOLDING`, `FII_HOLDING`, `PUBLIC_HOLDING`, `REPORTING_PERIOD` — is declared **`String`**, with sample values such as `"36318.4"`, `"0.21"`, `"202603"`. |
| **Type** | Type-vocabulary weakness — numbers are strings |
| **Resolvable?** | **Yes** — the values are parseable as documented; but the **format** (thousands separators, currency prefixes, `-`, `NA`, empty string) is not specified. |
| **Uncertainty** | A value of `"1,234.5"`, `"₹36318.4"`, `"NA"` or `""` would all be plausible; only the bare-decimal sample is given. |
| **IPD impact** | None today (no Company Info call). Would become a **silent-corruption** risk at first use: a lenient `parseFloat` yields `NaN`, and a lenient `|| 0` yields a fabricated zero. |
| **Recommended handling** | Any future adapter must **parse strictly** — a strict numeric regex, explicit rejection of thousands separators and unit prefixes, and an explicit empty/NA/null state. Never coerce an unparseable value to `0`. This mirrors IPD's existing fail-closed discipline. |

---

## D-21 — Company Info's period semantics are "TTM" only, with no period anchor

| | |
|---|---|
| **Severity** | MEDIUM |
| **Area** | F/D03 |
| **Statement A** | `P1 p.10`: `EPS` — "based on the **trailing twelve months**"; `EBITDA` — "for the **trailing twelve months**, in ₹ crore". `DIVIDEND_YIELD` — "Annual dividend per share as a percentage of the current market price". |
| **Statement B** | `P1 p.9`: "Only the sections passed in the request are returned"; `P7 p.1`: "**All values are point-in-time as of the latest closed candle** for the requested timeframe." |
| **Type** | No period start/end, no filing date, no restatement index |
| **Resolvable?** | **No.** The values are as-of *some* TTM window ending at an unspecified point. |
| **Uncertainty** | Which TTM window; when it ended; whether it is restated; whether it is audited. **None of this is stated.** |
| **IPD impact** | D03 requires `periodStart`, `periodEnd`, `filingDate`, `restatementIndex`, `isAudited` — **all mandatory or semantically central**. Company Info can supply **none** of them. This is the structural proof that Company Info cannot populate D03 (§5.3). |
| **Recommended handling** | Company Info output must be carried as **context/evidence**, never as a `FundamentalStatementPayload`. It must be labelled with its **as-of semantics** ("TTM, as of latest closed candle, period anchor unknown") wherever it is used. **Explicitly not** a substitute for statements, cash flows, or dividend-sustainability evidence. |

---

## D-22 — Market Movers mixes instrument groups and ranking categories within one enum

| | |
|---|---|
| **Severity** | LOW |
| **Area** | F |
| **Statement A** | `P1 p.14`: "All values in a single request must belong to the same group (options, futures, or equity) — they **cannot be mixed**." The groups listed are `OPTIDX`, `OPTSTK`, `OPTFUT` (options), `FUTIDX`, `FUTSTK`, `FUTCOM` (futures), `EQUITY` (stocks). |
| **Statement B** | `P1 p.14` also lists `OPTFUT` (Options of Commodity Futures) as its own group value while `FUTCOM` (Futures of Commodity) is the commodity-futures group — so commodity instruments appear in **two** groups with different names, and the constraint "options, futures, or equity" names **three** groups for **seven** values. |
| **Type** | Internal inconsistency in an enumeration |
| **Resolvable?** | **Partially** — the constraint's intent is clear (don't mix asset classes), but the group taxonomy is stated loosely. |
| **Uncertainty** | Whether `OPTFUT` belongs to the "options" group (its label says options) while covering commodity futures — an ambiguity that would matter if a request mixed commodity options with equity. |
| **IPD impact** | None today. |
| **Recommended handling** | Any future implementation should carry the group constraint as **validated input**, and reject mixed-group requests **client-side** rather than relying on the vendor to reject them. |

---

## D-23 — Analytics timeframe vocabulary is narrower than IPD's candle vocabulary

| | |
|---|---|
| **Severity** | LOW |
| **Area** | F vs B |
| **Statement A** | `P1 p.8`: timeframes are `1` (1-minute), `5` (5-minute), `15` (15-minute), `D` (daily). **"D" is the default for positional analysis.** |
| **Statement B** | `P2 p.1` documents `/charts/intraday` as "minute timeframe" and `/charts/historical` as "daily timeframe", with **no** granularity list; IPD's own supported intervals are `1m, 5m, 15m, 1h, 1D` (`dhan_historical_dto.ts:24`) and canonical D02 adds `1w`, `1M`. |
| **Type** | Vocabulary mismatch across two documented surfaces, and an undocumented one |
| **Resolvable?** | **No.** `1h` (1-hour) appears in **neither** documented vocabulary — it exists only in IPD's own list. |
| **Uncertainty** | Whether Dhan supports 1-hour candles at all; whether `1w`/`1M` exist; the exact spelling of the daily value (`D` vs `1D`). |
| **IPD impact** | IPD's `1h` interval is **not vendor-grounded** — it is in IPD's own list, and `dhan_historical_dto.ts:19–24` says so explicitly ("Vendor interval vocabulary is PROVISIONAL"). Canonical D02's `1w` and `1M` have no Dhan path. |
| **Recommended handling** | Preserve IPD's existing provisional marking. Any interval IPD supports must be marked `PROVISIONAL` until observed against an entitled account. `1h` should be **treated as unsupported by Dhan** until evidenced — a candidate for removal from the supported list, but that is an implementation decision for a separately authorised work item, not for this assessment. |

---

## D-24 — Full-packet "Day Close" is post-market-close only, while the REST quote carries a session close

| | |
|---|---|
| **Severity** | LOW |
| **Area** | C/D |
| **Statement A** | `P5 p.6`: the Full packet's **"Day Close Value — only sent post market close"** (bytes 50–53). The Quote packet has the same field at bytes 38–41. |
| **Statement B** | `P5 p.4`: a **separate Prev Close Packet (code `6`)** carries "Previous day closing price" — because the Full packet's day-close field is unavailable intraday. |
| **Type** | Semantic ambiguity in "close" |
| **Resolvable?** | **Yes, for the feed** — the vendor separates them by packet and states the condition. |
| **Uncertainty** | Whether the REST `/marketfeed/quote` payload's `ohlc.close` is the *current session close* (as IPD assumes) or the *previous day's close*. IPD's normaliser already refuses to treat `ohlc.close` as `previousClose` (`dhan_normalizer.ts:101–110`) because "Dhan's ohlc.close is the CURRENT session close (≈ last_price), not the previous day's close" — an inference from the vendor's convention, **not from a published statement**. |
| **IPD impact** | IPD's `previousClose` derivation from `net_change` is the **correct and safe** choice, and its refusal to substitute `ohlc.close` is exactly right. But the underlying interpretation remains `UNCERTAIN` from documentation alone. |
| **Recommended handling** | Keep the current fail-closed behaviour. Record "REST `ohlc.close` = current session close" as an **inference** with its evidence (vendor convention + the feed's explicit prev-close packet), not as a documented fact. |

---

## D-25 — Disconnect request codes `41`/`11`/`25` collide with response codes `41`/`51`/`50`

| | |
|---|---|
| **Severity** | MEDIUM |
| **Area** | D/E |
| **Statement A** | `P6 p.6`: request codes `41` (connect feed), `25` (unsubscribe), `11` (disconnect feed) — and `P6 p.4–5`: **response** codes `41` (Bid Data) and `51` (Ask Data). |
| **Statement B** | `P1 p.3`: the Feed Request Code table and `P1 p.4` the Feed Response Code table are **separate tables with overlapping numerals** (`23`/`25` appear in the request table; `50` appears in the response table; `41`/`51` appear in neither annexure table). |
| **Type** | Namespace overlap between request and response code spaces |
| **Resolvable?** | **Yes, structurally** — request codes are outbound JSON, response codes are inbound binary; the direction disambiguates. But the documents do not state the separation, and `P6` uses `41` for two different purposes **within the same product** (request-to-connect vs response-for-bid-data). |
| **Uncertainty** | An implementation that reuses one numeric switch for request and response codes would misinterpret a bid-data packet as a connect command, or vice versa. |
| **IPD impact** | None today. |
| **Recommended handling** | Keep request codes and response codes in **separate, separately-named constant groups** with no shared numeric namespace, and add a test that asserts the two sets are treated independently. |

---

## D-26 — The `InstrumentCount` field is required for 20-level but omitted for 200-level

| | |
|---|---|
| **Severity** | LOW |
| **Area** | E |
| **Statement A** | `P6 p.2` (20-level): request parameters `RequestCode*`, **`InstrumentCount*`**, `InstrumentList.ExchangeSegment*`, `InstrumentList.SecurityId*` — and the example carries `"InstrumentCount" : 1`. |
| **Statement B** | `P6 p.2–3` (200-level): "In 200 level market depth, **only 1 instrument per connection** can be subscribed. The JSON payload needs to be sent **similar to** 20 level depth subscription" — the 200-level parameter table (p.3) lists `RequestCode*`, `ExchangeSegment*`, `SecurityId*` with **no `InstrumentCount`**, and its example omits it. |
| **Type** | Field-set divergence between two request shapes of the same RequestCode |
| **Resolvable?** | **Yes** — the documents are explicit: 200-level omits `InstrumentCount`, because only one instrument is allowed per connection. |
| **Uncertainty** | Whether the server *rejects* `InstrumentCount` on a 200-level request, or ignores it. Unstated. |
| **IPD impact** | None today. |
| **Recommended handling** | Encode the two request shapes as **distinct builders**, never as one builder with an optional field. |

---

## 6.27 Register summary

| ID | Subject | Severity | Resolvable from the set? |
|---|---|---|---|
| D-1 | `STOCHASTIC` vs `STOCH` | MEDIUM | No |
| D-2 | MACD identifier set | MEDIUM | Partially |
| D-3 | Bid/ask label inversion | **HIGH** | No |
| D-4 | `11` = Connect vs Disconnect | **HIGH** | No |
| D-5 | 8-byte vs 12-byte header | MEDIUM | Structurally |
| D-6 | Disconnect reason offset | MEDIUM | Structurally |
| D-7 | Disconnect code table absent | **BLOCKING** | No |
| D-8 | `805` at two layers | MEDIUM | Yes |
| D-9 | No HTTP-status ↔ code mapping | **HIGH** | No |
| D-10 | `RL001` outside the annexure | MEDIUM | Yes (code) |
| D-11 | `802`/`803` absent | LOW | No |
| D-12 | `41`/`51` absent from the annexure | MEDIUM | No |
| D-13 | Market Quote vs Data API limit scope | **HIGH** | No |
| D-14 | Three families with no documented limit | MEDIUM | No |
| D-15 | "Data API" scope ambiguity | MEDIUM | No |
| D-16 | `SECURITY_ID` undocumented | **HIGH** | Empirically only |
| D-17 | Segment id gaps | LOW | No |
| D-18 | REST depth structure undocumented | **HIGH** | No |
| D-19 | No master versioning | **HIGH** | No |
| D-20 | Company Info fields typed `String` | MEDIUM | Yes |
| D-21 | Company Info period semantics | MEDIUM | No |
| D-22 | Market Movers group taxonomy | LOW | Partially |
| D-23 | Timeframe vocabulary mismatch | LOW | No |
| D-24 | "close" semantics | LOW | Yes (feed) |
| D-25 | Request/response code namespace overlap | MEDIUM | Structurally |
| D-26 | `InstrumentCount` divergence | LOW | Yes |

**Counts: 26 discrepancies.** Blocking: 1. High: 7. Medium: 12. Low: 6.
**Resolvable from the published set alone: 10.** The remaining **16** require either a vendor
clarification or entitled live observation — which is why the Dependency Register (§10) lists
**16 clarification/observation items**, and why §12 treats "ask the vendor" as a first-class work
stream rather than an afterthought.
