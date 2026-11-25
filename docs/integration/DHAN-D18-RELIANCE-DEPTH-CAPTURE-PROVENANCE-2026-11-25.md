# D-18 — Reliance depth capture: operator-confirmed provenance record

- **Date:** 2026-11-25
- **Branch:** `arena/2c0f06ee-iips-production-market-data`, head `e2ada40`
- **Scope:** documentation and evidence preservation only. No implementation, contract, normalisation, DTO or provider change.
- **Live request performed by this record:** **no.** No vendor request was issued. Nothing here was obtained by re-querying Dhan.
- **Runtime evidence modified:** **no.** Both capture files were copied byte-for-byte; their SHA-256 digests are unchanged.
- **Why this record exists:** the D-18 capture was executed on the Windows host, so the evidence exists as files the repository could not previously account for. The operator has now confirmed who ran it and when. This record preserves that confirmation and, critically, keeps it separate from what the files themselves prove.

---

## 1. The two captures, and why they must not be merged

Two files were supplied. They are **not** the same capture, and the earlier session assumed they were because both carried the same label.

| | **23 November 2026** | **25 November 2026** |
|---|---|---|
| Retained as | `evidence/dhan-d18/reliance-depth-20261123.json` | `evidence/dhan-d18/reliance-depth-20261125.json` |
| Original name | `reliance-depth.json` | `reliance-depth.txt` (valid JSON, preserved as-is) |
| `capturedAtUtc` | `2026-11-23T10:01:24.819Z` | `2026-11-25T08:15:15.655Z` |
| Local (IST) | **15:31:24** Monday | **13:45:15** Wednesday |
| Depth values | **all ten levels `0 / 0 / 0`** | populated, 1368.90–1369.50 |
| Label as written | "one market-closed quote" | "one market-closed quote" |

The 25 November file is a **market-hours** capture. Its label is wrong for its own contents. It is retained here for exactly one reason: so that a later reader cannot mistake it for the 23 November evidence. **It does not answer D-18.**

Apart from the timestamp and the numeric values the two files are structurally identical — same schema version 2 shape, same key order, same all-`present` field states. **That is itself evidence:** an all-zero depth is a **populated 5×5 book of zeros**, not an absent block, a `null`, or an empty array.

## 2. Operator-confirmed facts versus independently verified metadata

These are deliberately separated. The first list is testimony; the second is what the bytes support. Neither is treated as stronger than it is.

### 2.1 Operator-confirmed (testimony — not independently verifiable from the repository)

- `reliance-depth.json` was **personally executed by the operator** on **23 November 2026**.
- Execution occurred at **approximately 15:31 IST**, **one minute after regular NSE equity trading closed at 15:30 IST**.
- The captured response contained **five buy and five sell levels**, with **price, quantity and orders explicitly present and all values zero**.
- The capture label says *"one market-closed quote"*.
- The separate 25 November capture is a **different, market-hours capture** and **must not be conflated** with the 23 November evidence.

The first three items are corroborated by — but not proven by — the file: `capturedAtUtc` reads `10:01:24.819Z`, which is **15:31:24 IST**, consistent with the stated time to within 24 seconds. Consistency is not independent confirmation of authorship.

### 2.2 Independently verified from the files

- `capturedAtUtc`, `httpStatus: 200`, `responseStatus: "success"`.
- `requestedSecurityIds: ["2885"]`, `instrumentsInResponse: 1`, segment `NSE_EQ`, `securityId: "2885"`.
- `depthState: "object"`; `buy.state: "array"`, `count: 5`; `sell.state: "array"`, `count: 5`.
- Every one of the 30 level fields (5 levels × 2 sides × price/quantity/orders) has `state: "present"`.
- Every one of those 30 values is `0`.
- `captureSchemaVersion: 2`, matching `DHAN_DEPTH_CAPTURE` schema v2.
- Both files are LF-only and byte-identical to what was supplied (SHA-256 in `evidence/dhan-d18/manifest.json`).

Note which field is *not* claimed: `requestedSecurityIds` is genuinely populated by the implementation (`dhan_depth_capture.ts:219`), so `["2885"]` is real evidence rather than the "reserved, never populated" case the activation document §5.1 header describes.

### 2.3 What the files cannot establish

- **Which build produced the capture.** There is no running-process-to-revision binding. An identical schema and shape is consistent with the recorded feature but does not prove the executing binary contained it.
- **That the response came from the vendor rather than an IPD layer.** No request identifier, correlation id or response digest is recorded.
- **Whether closing-auction or post-close processes had completed.** See §3.
- **Anything about the request that produced it beyond the security id**, because request bodies are not persisted.

## 3. Classification: post-regular-market-close

The observation is classified **`POST_REGULAR_SESSION_CLOSE`**, and no more than that.

- NSE equity **regular trading closed at 15:30 IST**; the capture is timestamped **15:31:24 IST**, one minute and twenty-four seconds later.
- 15:30–15:35 IST is the **closing auction session (CAS)**. The transition window runs 15:35–15:50, with post-close from 15:50. These times are recorded in this repository from official NSE sources in [`IPD-D3-MARKET-CLOSED-FRESHNESS-DECISION-BLOCKER-2026-11-19.md`](IPD-D3-MARKET-CLOSED-FRESHNESS-DECISION-BLOCKER-2026-11-19.md) §"sources", and the D-3 memo cautions specifically against treating any single time as a daily-price availability guarantee.
- Therefore the capture is **after regular trading but inside the closing-auction window**. It is **not** established as after the entire NSE closing process, and this record makes no such claim.

One clarification, because it affects how this evidence is read. The same D-3 memo records that **Phase 1 CAS is limited to cash securities that have derivatives**; Reliance qualifies, so a CAS session plausibly applies. IPD's own calendar (`calendars/ipd-equity-2026.v2026-11-19.2.json`) models the exchange-wide interval as a single `09:15–15:35` block rather than separating a 15:30 regular close, so it does not resolve this point either. The memo states it is a summary and not a substitute for the detailed circulars. The classification above is therefore driven by the operator's account of the 15:30 close and the D-3 memo's official-source times, and is deliberately stated no more strongly than that.

Also worth recording without over-reading it: IPD's calendar has **no row for 2026-11-23** — its continuous coverage ends 2026-11-19 — and its `outsideCoverage` policy is explicit that unsupported dates are UNKNOWN with no weekday inference. So the calendar neither confirms nor denies that 23 November was a trading day. Monday 23 November 2026 is a weekday and not among the recorded 2026 closure dates, but this record does not assert a session existed on the strength of that.

## 4. What this proves, and what it does not

### 4.1 Proven — this is the answer D-18 was built to obtain

D-18's stated purpose was to determine, from evidence rather than inference, what the depth block contains **when the market is not in continuous trading** — specifically whether the vendor sends `0`, `null`, an empty array, or omits the key.

**On 23 November, one minute after the regular close, the vendor sent a fully populated 5-level book per side with every price, quantity and order present and equal to `0`.**

That resolves the *shape* of the market-closed case:

| D-18 §5.2 hypothesised input | Observed on 23 November |
|---|---|
| `0` | **Yes — this is the case.** All 30 values, all `present` |
| `null` / key absent | No |
| `buy: []` empty array | No — `count: 5` |
| `depth` absent | No — `depthState: "object"` |

### 4.2 Not proven by this observation

- **Side labelling.** Every value is zero on both sides, so this capture carries **no** information about which array is bid and which is ask. D-3, DQ-8 and OR-10 remain untouched by it.
- **Level ordering and count validation.** Zeros cannot reveal an ordering convention, and no validation was added. **DQ-7** remains open.
- **Complete documentation of the schema.** One instrument, one instant, in-hours-adjacent only. Q-03 additionally covers volume, `last_trade_time` and `net_change` field semantics, which this capture does not address.
- **That the vendor is *always* like this.** A single post-close capture is one observation, not a guarantee.

## 5. Consequence for D-5 / DQ-5 — and a live defect it exposes

This is the part of the record with operational weight, and it is **not** an acceptance claim.

**DQ-5** ("`bid`/`ask` may be silently `0`") is confirmed at the vendor end: the vendor does supply `0`, not `null`. **D-5** (approved 2026-11-21) governs IPD's response: a supplied zero is invalid, and absence must be `null`. So the two are consistent with each other and this capture corroborates DQ-5's premise.

But executing IPD's current normaliser against the captured 23 November shape produces a **failure, not a quote**:

```
all-zero 5x5 (the 23 Nov shape)
  -> FAILURE MALFORMED_RESPONSE: Dhan depth bid price must be a finite, strictly positive
     number when supplied (got 0); use an absent side for unavailable depth

populated (the 25 Nov shape) -> ok  bid=1368.9  ask=1369.1   quality=GOOD
depth absent entirely        -> ok  bid=null  ask=null       quality=GOOD
```

This was produced by running the repository's own `dhan_normalizer` locally against synthetic input shaped from the capture. **No vendor request was made.**

The consequence, stated carefully:

- Under D-5's approved rule, a **supplied `0`** must be rejected — and it is (`MALFORMED_RESPONSE`). That is the rule working as specified.
- But combined with this evidence, the effect is that **every post-regular-close quote for a security whose depth blocks come back all-zero would fail closed at normalisation**, producing no envelope at all, rather than an envelope with `bid: null, ask: null`.
- An **absent** depth block does yield `null`/`null` and a valid quote. The difference between "side absent" and "side present with zeros" is therefore not equivalent in practice, and this capture shows the vendor uses the *present-with-zeros* form post-close.

I want to be precise about what I am **not** saying. I am **not** claiming this breaks live operation: the 23 November capture came from a build I cannot identify, the D-5 change post-dates it, and I have not observed a post-close quote through the current daemon. What is established is that **the captured real shape and the current fail-closed rule intersect to produce a rejected quote**, and nobody has yet observed which behaviour occurs live. That deserves its own investigation and is outside this record's authority.

## 6. Effect on D-18 and related items — no statuses changed

No work item is marked resolved, complete, accepted or unlocked by this record.

| Item | Where it lives | Status after this record |
|---|---|---|
| **D-18** — REST depth structure undocumented (HIGH) | `05-DOCUMENTATION-DISCREPANCY-AND-AMBIGUITY-REGISTER.md:289` | **Unchanged / still open.** The *market-closed shape* sub-question now has direct evidence (§4.1). The finding as registered — schema undocumented, ordering and level count unvalidated — is not closed by one capture. |
| **Q-03** — request/response schema of `POST /marketfeed/quote` | `10-DEPENDENCY-AND-EXTERNAL-BLOCKER-REGISTER.md:84` | **Unchanged / still open.** Blocks G-05, G-08, DQ-1…DQ-5. The depth *shape* is now observed; volume/`last_trade_time`/`net_change` semantics are not. |
| **DQ-5** — bid/ask may be silently `0` (HIGH) | `08-SECURITY-RELIABILITY-DATA-QUALITY-CONSIDERATIONS.md:71` | **Corroborated at the vendor end**; governed by approved D-5. Not newly "accepted" here. §5 raises a follow-on question about the interaction. |
| **DQ-7** — book ordering and level count unvalidated (HIGH) | same file, `:73` | **Unchanged / open.** Zeros reveal no ordering. |
| **DQ-8** — bid/ask side convention unverifiable (HIGH) | same file, `:74` | **Unchanged / open.** All-zero book carries no side information. |
| **OR-10** — depth side labelling could invert bid/ask (HIGH) | `06-OPERATIONAL-LIMITS-AND-ERROR-TAXONOMY.md:294` | **Unchanged / open.** Depends on D-3, D-18. |
| **D-3** — bid/ask label inversion (HIGH) | `05-…:437` | **Unchanged.** Owner-accepted for **W-22 scope only**; the REST depth label is not established here. |

**D-18's own activation record** (`DHAN-D18-RAW-DEPTH-CAPTURE-ACTIVATION-2026-11-20.md`) still states "Live request performed: **no**" and "Awaiting operator execution". That is now **factually superseded for this capture**. The record is left textually unchanged here because rewriting a build/activation record is beyond this instruction's scope; this document is the authoritative provenance counterpart and §7 lists the supersession as an outstanding documentation action.

## 7. Outstanding items

1. ~~**D-18 activation record supersession.**~~ **RESOLVED in this publication.** The activation record's header claimed the capture "has never run against the vendor, in this session or any other". That was corrected in the same change set by adding a §0 that records the operator-confirmed execution, preserves the superseded statement verbatim as historical context, and states the `POST_REGULAR_SESSION_CLOSE` classification. The build record and test evidence below §0 are unaltered.
2. **True post-close or market-closed capture.** The 23 November capture is post-*regular-close* but inside the CAS window. A capture after 15:50 IST, or on a non-trading day, would settle the whole-session question and would also test whether the all-zero form persists.
3. **Correct the 25 November label** before any future run, so a file cannot again describe itself inaccurately.
4. **The §5 interaction** — supplied-zero depth causing `MALFORMED_RESPONSE` — needs its own scoped investigation. It is not authorised by this record.
5. **Runtime binding.** Without a running-process-to-revision binding and a request identifier, no capture can be tied to a build or to a vendor response. This is the same gap recorded in the E4 readiness assessment.
6. **`requestedSecurityIds` documentation.** The activation record's §5.1 annotation ("reserved; not populated by this call site") contradicts the implementation, which populates it. The annotation is now also noted as inaccurate in the activation record's §0.5 rather than silently edited, so the original §5.1 text still reads as written.

## 8. File manifest

| File | Change |
|---|---|
| `evidence/dhan-d18/reliance-depth-20261123.json` | **New.** Byte-identical copy of the operator's `reliance-depth.json`. SHA-256 `3fb343db…b93b68e`. |
| `evidence/dhan-d18/reliance-depth-20261125.json` | **New.** Byte-identical copy of the operator's `reliance-depth.txt`. SHA-256 `6c53e973…a6bb6e`. |
| `evidence/dhan-d18/manifest.json` | **New.** Integrity digests, per-file operator-confirmed vs independently-verified facts, classifications, and explicit non-claims. |
| `docs/integration/DHAN-D18-RELIANCE-DEPTH-CAPTURE-PROVENANCE-2026-11-25.md` | **New.** This record. |
| `docs/integration/DHAN-D18-RAW-DEPTH-CAPTURE-ACTIVATION-2026-11-20.md` | **Modified, additive §0 + header correction.** Records the operator execution and supersedes the "never run against the vendor" header claim; the superseded line is preserved verbatim in §0.1. Build record, procedure and test evidence below §0 unchanged. |
| `docs/integration/dhan-api-v2-assessment-2026-11-13/05-DOCUMENTATION-DISCREPANCY-AND-AMBIGUITY-REGISTER.md` | **Modified, +1 row.** An "Evidence to date" row under D-18 pointing here. No status text altered; D-18 remains OPEN. |

No other file is touched. No implementation, contract, test, script, credential or runtime artefact is modified. The originals supplied by the operator remain unaltered outside the repository and are not overwritten.
