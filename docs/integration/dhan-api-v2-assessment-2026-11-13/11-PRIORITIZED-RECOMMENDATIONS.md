# 12 — Prioritized Recommendations

> **Authority statement — read first.**
> These are **recommendations only**. Nothing in this document authorises implementation, a vendor
> request, a contract change, a credential change, a deployment, or any change to W-06 status. Each
> item requires **separate, explicit authorisation** before any work begins. A recommendation is not
> a decision; where a recommendation implies a choice that only the principal can make, the choice is
> stated as a **decision required**, not as a plan.

---

## 12.1 How the priorities were derived

The ordering is **not** "biggest gap first". It is:

1. **Can it proceed without external input?** (internal-only work first — it is the only work that can
   start now and is the only work that improves correctness regardless of the vendor's answers.)
2. **Does it improve correctness of what already exists?** (guards against silent wrongness.)
3. **Does it unblock the most downstream capability per unit of effort?**
4. **Does it reduce a risk that is silent rather than loud?**

Two consequences worth stating plainly:

- **Six gaps can be closed on IPD's own authority, with no entitlement and no clarification.** They
  come first because they are the only work available today and because two of them (G-05, G-06) guard
  against *silently wrong* data.
- **The two external blockers (entitlement, clarification) are Critical but are not engineering
  work.** They are *requests to be made*, not code to be written — and the clarification request can
  be raised **immediately and in parallel**, at no cost.

---

## 12.2 Tier 0 — Do now, on IPD's own authority

**Authorisation needed:** internal engineering approval only. **No vendor dependency. No contract change.**
**Rationale:** these are the only items that can start today, and each improves correctness or
operability regardless of what Dhan eventually answers.

### R-01 — Parse the vendor error code, and keep the HTTP status as a separate signal
**Closes:** G-06 · **Priority: 1** · **Effort: small** · **Risk: low**

IPD already receives the body and already has the vocabulary (`dhan_failures.ts:17–42`); it simply
never reads the body. Add a parser that extracts the **code** — never the raw body — and maps it to
an existing `DhanFailureCode`, keeping the HTTP status as an independent transport fact.

| Vendor code | IPD failure | Rationale |
|---|---|---|
| `806` | entitlement-specific (new distinct code, e.g. `PROVIDER_ENTITLEMENT_INACTIVE`) | distinct from credentials — **the W-06 root cause** |
| `807`, `808`, `809`, `810` | credential-specific (`CREDENTIALS_EXPIRED` / `CREDENTIALS_UNAVAILABLE`) | distinct from entitlement |
| `804` | batch too large | caller fix |
| `811`–`813`, `814`, `DH-905` | caller input error | caller fix |
| `800`, `DH-908` | transient — retryable | policy-relevant |
| `805`, `DH-904`, `RL001`, `errorType: RATE_LIMIT_ERROR` | throttle — **not** retryable aggressively | drives backoff |
| `DH-902`, `DH-903` | entitlement / segment activation | different owner again |
| `DH-906`, `DH-907` | order / data error | caller fix |
| `DH-909` | transient network | retryable |
| `DH-910`, unknown, `802`/`803` | unrecognised vendor code — a **distinct** state | never folded into a generic error |

**Constraints:** the credential-reflection defence (`dhan_api_client.ts:307–310`) must be preserved —
extract the code and a *sanitised* message, never the raw body. The code **augments** the HTTP status;
it does not replace it.

**Validation:** a table-driven test over the full documented code set; a test that `806` and `807`
produce **different** IPD codes; a test that the raw body never appears in any message; a test that an
unknown code produces the unrecognised state; a regression test that the existing HTTP-status mapping
is unchanged.

**Why first:** it is the cheapest high-value fix in the package, it needs no entitlement, and it
removes the exact failure mode that made W-06 require an out-of-band body read.

---

### R-02 — Guard depth semantics: "unavailable" ≠ "price 0"
**Closes:** G-05 (partially — the guards; the side convention awaits Q-04) · **Priority: 2** · **Effort: small**

1. Introduce an explicit **depth-unavailable** state, distinct from `bid = 0`/`ask = 0`.
2. Add a **monotonicity** check across levels (bids descending, asks ascending).
3. Add a **depth level-count** check against the expected depth for the product.
4. Add a **side-convention attribute** (`bidSideMeans: 'BUY' | 'SELL' | 'UNKNOWN'`), defaulting to
   `UNKNOWN`, with the normaliser **failing closed** on `UNKNOWN`.

Items 1–3 are safe under **either** hypothesis about the undocumented REST shape, so they can be
built before Q-03/Q-04 are answered. Item 4 makes the uncertainty *explicit in the data model*
rather than implicit in an assumption.

**Validation:** empty depth ⇒ unavailable (not `0`); descending bids accepted; non-monotonic book
rejected as a **data-quality anomaly**, not a transport failure; unexpected level count rejected;
`UNKNOWN` side convention rejected.

**Note:** this does **not** make IPD's current depth correct — it makes it *safe*. Correctness still
requires Q-03 and Q-04.

---

### R-03 — Partition the rate limiter by endpoint family, and wire the throttle signal
**Closes:** G-07 · **Priority: 3** · **Effort: medium** · **Risk: medium (a tested contract changes)**

Replace the single 60/min bucket with a per-family budget table:

| Family | Budget | Source |
|---|---|---|
| Market quote (`/marketfeed/*`) | **1 req/sec** | `P8 p.1`, `P4 p.1` |
| Data APIs (`/data/*`) | **5 req/sec** | `P8 p.1` |
| `/charts/*` | **stricter of the two** (1 req/sec) until Q-12 is answered | `LIMIT_UNDOCUMENTED` |
| `/instrument/*` + CSVs | **stricter of the two** | `LIMIT_UNDOCUMENTED` |

Each row carries a `limitSource` field: a `P8 p.1` citation **or** `UNDOCUMENTED`. A
`LIMIT_UNDOCUMENTED` family must never be described as "the Dhan rate limit".

Also: **wire `observeThrottle`** (`dhan_operational_controls.ts:152`) to the vendor's throttle signal
parsed by R-01, so `Retry-After`/backoff actually happens.

**Risk to manage:** the 60/min bucket is asserted by `tests/dhan_p4_operational_controls.test.ts`;
partitioning it changes a **tested contract** and changes existing throughput behaviour under load.
Measure before and after; do not assume.

**Validation:** per-family budget tests; the quote family cannot exceed 1 req/s; history cannot
starve quotes; `LIMIT_UNDOCUMENTED` families apply the stricter limit; a vendor throttle signal blocks
the window.

---

### R-04 — Record instrument-master provenance and detect change
**Closes:** G-09 · **Priority: 4** · **Effort: small**

On every fetch, record the **retrieval timestamp and the SHA-256 of the retrieved bytes**, and
maintain a **version ledger** so an upstream master change becomes a detectable event rather than
silent drift into the identity registry. Make the parser **fail closed** on an unrecognised header
rather than mapping a positional column.

**Why it is IPD-side and free:** the vendor publishes no checksum (Q-13), but IPD can still detect
*change*. The scrip master is the identity authority for every Dhan-derived value, so silent drift
here propagates everywhere.

**Validation:** digest + timestamp recorded; a changed master raises a **change event**; the parser
rejects an unrecognised header.

---

### R-05 — Add operational hardening: retry classification, circuit breaker, timeouts
**Closes:** G-15 · **Priority: 5** · **Effort: medium**

- A **retry policy keyed to the vendor code** (transient vs permanent), dependent on R-01.
- A **circuit breaker** that opens on sustained failure — today a sustained `806` generates a request
  per attempt indefinitely.
- An explicit **timeout** on the vendor call.
- Bounded backoff, and **no aggressive retry of a throttle**.

**Why it is bundled with R-01:** retry policy must key on the *parsed code*, not on the status —
otherwise a throttled call is retried exactly as hard as a transient one, which is how a throttle
becomes a block.

**Validation:** a retry-classification table test; circuit-breaker open/half-open tests; a test that
a throttled request is not retried aggressively.

---

### R-06 — Preserve the contract-drift guard on any future expansion
**Closes:** regression risk on I-04 · **Priority: 6** · **Effort: near-zero**

Any new Dhan surface (depth, WebSocket, analytics) **must** be accompanied by an export-map update,
or `tests/dhan_d3d_contract_drift.test.ts` `D3D-04`/`D3D-05` will fail.

**Why it is a recommendation rather than an observation:** the export map is the mechanism that keeps
vendor DTOs out of the canonical contracts. It is the single most valuable thing in the Dhan
implementation, and it is also the thing most likely to be "quickly adjusted" when someone adds a
surface.

**Validation:** `D3D-01`…`D3D-07` continue to pass; the new surface is visible in the export map and
invisible in the canonical key sets.

---

## 12.3 Tier 1 — External actions (requests, not code)

**Authorisation needed:** operator/vendor engagement. **These are requests to be made; no
engineering is implied until the answers arrive.**

### R-07 — Raise the sixteen-question clarification request (Q-01…Q-16)
**Closes:** G-14, and unblocks G-03, G-04, G-08, G-10, G-12, G-13, G-16, G-17, G-18, G-20
**Priority: 1 (external)** · **Effort: low** · **Cost: one message**

The full list is at **§11.3**, ordered by the gap each question blocks and written so that each is
**answerable**. Sixteen numbered, page-cited questions are actionable; "the docs are incomplete" is
not.

**Why first among external actions:** it costs nothing but a reply, it runs in **parallel** with the
entitlement action, and it is the only thing that makes the *entire* documented surface implementable
with known semantics. Sixteen of the twenty-six discrepancies in §6 are unresolvable without it.

**Also requested within Q-16:** whether the WebSocket credential can be supplied by header or
subprotocol rather than in the URL query string (S-12). If yes, IPD can avoid regressing its
credential posture; if no, the constraint must be recorded before any feed work begins.

---

### R-08 — Request confirmation of the Data API subscription
**Closes:** G-01 · **Priority: 1 (external)** · **Owner: operator**

A commercial/account action with Dhan. **This package does not request, initiate or infer it.**

**Validation:** after confirmation, a **single** authorized request returns a data payload (not an
error), with the response shape recorded as evidence. That observation closes DQ-1, DQ-2 and DQ-3 at
once.

**Discipline to preserve:** the **one** remaining authorized quote request must be spent on that
purposeful re-qualification — not on exploratory probing. And no claim of resolution may be made
from an IPD code change alone.

---

### R-09 — Confirm feed/depth entitlement separately from Data API entitlement
**Closes:** the precondition for G-03 and G-04 · **Priority: 2 (external)** · **Owner: operator**

The published set documents the live feed and both depth products but says nothing about their
subscription status. **B-01's resolution does not imply feed entitlement.** These must be confirmed
as separate questions with the vendor.

---

### R-10 — Establish data reuse, storage and display rights
**Closes:** the precondition for any Dhan value being **persisted** into an IIPS report · **Priority: 2 (external)** · **Owner: operator**

Nothing in the nine documents addresses redistribution, storage or display rights. This bears directly
on the Reports/NP-06 consumer (§8.5), which by design persists IIPS-owned artefacts that *cite* source
values. Entitlement answers "may I call it"; rights answer "may I keep it and show it".

**Note:** this is also the point at which NFR-06 provider masking becomes operationally relevant —
a report that cites a vendor value must decide, explicitly and under governance, how the source is
identified at the consumer boundary (§8.1 R-6).

---

## 12.4 Tier 2 — Implementation, only after the corresponding Tier-1 answer exists

**Each item below is blocked on a named external answer.** Implementing before the answer arrives is
what produces rework on guessed schemas.

### R-11 — Implement the historical adapter against the documented schema
**Blocked on:** Q-06, Q-07, Q-08-partial · **Closes:** G-08, G-12 · **Prerequisite:** R-08

Confirm the request/response schema, the candle timestamp convention (start vs end), the interval
vocabulary, and the adjustment policy. Then decide honestly how `isAdjusted` is populated.

**Decision required (principal):** D02's `isAdjusted` is a **mandatory boolean** that no Dhan
documentation can ground. Options: (a) populate it from a confirmed vendor flag; (b) **change the
contract to a tri-state** — a canonical contract change, requiring separate authorisation, and
**not proposed here**; (c) refuse D02 output while the policy is unknown. Option (c) is the
fail-closed default and is the only one available without new information.

**Also decide:** whether `1h` — present in IPD's list but in **neither** documented vocabulary — is
retained as `PROVISIONAL` or retired. That is an implementation decision for a separately authorised
work item.

---

### R-12 — Implement a batched LTP/OHLC adapter
**Blocked on:** Q-03 (the LTP schema is undocumented) · **Closes:** G-11, G-19 · **Prerequisite:** R-08, R-03

The OHLC endpoint has a **published** schema (`P3 p.1–2`); the LTP endpoint does not. The adapter
must carry the 1,000-instrument cap and the 1 req/sec family limit.

**Constraint:** the OHLC response has **no volume and no timestamp**, so it **cannot** satisfy D01
(which requires `volume` and `last_trade_time`). It is a snapshot, not a quote substitute — and must
not be presented as one.

**Also:** the documented request form is **integer** security-ID arrays (`P3 p.1`), whereas IPD emits
JSON strings (DQ-14). The documented form should be used for this endpoint.

---

### R-13 — Implement depth as a per-product capability, if it is wanted at all
**Blocked on:** Q-03, Q-04, Q-05 · **Closes:** G-03 · **Prerequisite:** R-09, R-11

**Decision required (principal):** which depth product, if any, IPD wants — because the four products
differ in transport, level count, per-connection instrument cap, packet size and side convention.

**Hard precondition:** **do not implement the 20/200-level products until Q-04 confirms the side
convention.** A wrong reading inverts bid and ask **silently** — the highest-consequence risk in this
package, because it corrupts spread and imbalance with no error surfaced.

If the REST top-of-book is retained, it must be labelled as an **undocumented** structure — never as
"20-level depth" or "market depth" unqualified.

---

### R-14 — Implement the WebSocket feeds, if they are wanted at all
**Blocked on:** Q-01, Q-02, Q-05, Q-16 · **Closes:** G-04 · **Prerequisite:** R-09

Separate decoders per host (8-byte vs 12-byte headers — a shared header struct would be the single
most likely defect), little-endian parsing, heartbeat monitoring against the 40-second close rule,
reconnect with backoff, subscription lifecycle, and a freshness verdict that reports `UNAVAILABLE`
while disconnected.

**Constraint:** the credential must **not** go into the URL query string if an alternative exists
(S-12). IPD's current posture keeps credentials out of URLs for the REST path; following the
vendor's documented URL form verbatim would regress it.

**Scope discipline:** this is the largest item in the package and it must not start before R-09 and
Q-01/Q-02/Q-05 are answered.

---

### R-15 — Implement market analytics as supporting context only
**Blocked on:** Q-08, Q-09 · **Closes:** G-10, G-16 · **Prerequisite:** R-08

Each analytics output must carry an explicit **as-of label** ("TTM / point-in-time as of the latest
closed candle"), strict numeric parsing with an explicit unknown state that is **never** coerced to
`0`, per-field unit normalisation into IPD's base units, and a documented vendor-identifier →
canonical-identifier map with an `UNCERTAIN` state for the unconfirmed identifiers (`STOCHASTIC` vs
`STOCH`; `MACD_12`/`MACD_26`/`MACD_HIST`).

**Constraint:** the output must **not** be emitted as a `FundamentalStatementPayload`. D03 cannot be
satisfied by Dhan (§5.3), and emitting analytics in a statement shape would be the precise category
error the standing caution names.

**Decision required (principal):** where these values live. D03 is the wrong home; a separate,
clearly-typed context payload is a **design decision** for a separately authorised work item, and is
**not** proposed here.

---

### R-16 — Address D05 and D03 through non-Dhan sources
**Blocked on:** Q-14 (to confirm absence) · **Closes:** G-02 · **Owner: IPD, not Dhan**

Face value, industry, sector, listing status and effective dating must come from a source other than
Dhan. In parallel, the P04 identity-correspondence gate (23,644 of 23,764 rejected) is the real
constraint on coverage.

**Constraint:** do **not** satisfy D05 by weakening it. A canonical contract change requires separate
authorisation, and a Dhan-shaped D05 would import the vendor's gaps into IPD's identity layer.

---

### R-17 — Segment and capability scope decisions
**Blocked on:** Q-12, Q-15 · **Closes:** G-13, G-17, G-18, G-20 · **Owner: principal + IRR**

Whether derivatives, commodities, news and Option Chain are in scope at all. Note that expanding D01's
and D05's `exchange` enum is a **canonical contract change**, and that NP-04/NP-06 and the engines
live in the **IRR repository** — so these decisions cross repositories and must be taken there, with
IRR's input.

---

## 12.5 Tier 3 — Explicitly out of scope

Stated to prevent scope creep. Each of these was considered and **rejected** for this package:

| # | Not recommended | Why |
|---|---|---|
| O-01 | **Any change to a canonical contract** | No Dhan payload requires one (§5.7). The `isAdjusted` tri-state (R-11) and the `exchange` enum (R-17) are **decisions for the principal**, flagged, not proposed. |
| O-02 | **Implementing anything against an undocumented schema** | Sixteen discrepancies are unresolvable from the set; implementing on a guess produces rework on guessed contracts (R-03, R-10). |
| O-03 | **Using the live feed or depth to fix freshness** | Sub-minute freshness is not required by any roadmap row; the D01 threshold (15 min) is reachable by polling once entitled. The feed is the highest-cost, highest-risk item in the package. |
| O-04 | **Treating Company Info as a fundamentals source** | D03 is unsatisfiable from Dhan (§5.3); the standing caution is confirmed by the vendor's own field list. |
| O-05 | **Rebuilding the provider stack** | It is complete for its declared scope and passes 1,712 tests. The gaps are in **coverage** and **wire-signal parsing**, not in architecture. |
| O-06 | **Consuming the remaining authorized quote request for exploration** | It must be spent on a single purposeful re-qualification after entitlement is confirmed (R-08). |
| O-07 | **Adding a second provider to hedge the Dhan blocker** | A sound architectural instinct, but a separate programme with its own authority. Note the boundary is already provider-neutral, so the option remains open. |
| O-08 | **Any change to W-06 status, milestone state or the W-06 records** | Unchanged and out of scope. M1 not achieved; M2a/M2/M3a/M3/M4 not started. |
| O-09 | **Resolving a documented contradiction by preference** | Sixteen remain unresolved (§6). Where an implementation needs one, the answer comes from the vendor (Q-01…Q-16), not from this package's judgement. |
| O-10 | **Any change to PR #156** | It remains OPEN / MERGEABLE / UNMERGED. |

---

## 12.6 Sequencing summary

```
NOW (Tier 0 — IPD's own authority, no entitlement, no clarification)
  R-01 vendor-code parsing  →  R-02 depth guards  →  R-03 family budgets
  →  R-04 master provenance  →  R-05 hardening  →  R-06 export-map discipline
  (each independently shippable; R-01 unblocks R-03 and R-05 properly)

IN PARALLEL (Tier 1 — requests to make, not code)
  R-07 Q-01…Q-16 clarification request      [unblocks R-11…R-15]
  R-08 Data API subscription confirmation   [unblocks R-11, R-12, R-15]
  R-09 feed/depth entitlement confirmation  [unblocks R-13, R-14]
  R-10 reuse/storage/display rights        [unblocks persistence in Reports]

AFTER THE ANSWERS (Tier 2)
  R-11 historical  →  R-12 LTP/OHLC  →  R-13 depth  →  R-14 WebSocket  →  R-15 analytics
  R-16 D05/D03 non-Dhan sources  →  R-17 scope decisions (with IRR)

NEVER (out of scope)
  contract changes · schema guesses · feed-first · Dhan-as-fundamentals · stack rebuild
  exploratory quote consumption · W-06 changes · contradiction-by-preference · PR #156 changes
```

**One-line summary:** *do the six internal hardening items now because they need nothing and protect
against silent wrongness; ask the vendor sixteen specific questions and confirm the subscription in
parallel because they cost nothing and unlock everything else; and implement only against answers.*
