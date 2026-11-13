# 13 — Evidence-Based Conclusion and Readiness Assessment

**Purpose:** the final position, stated from the evidence, with no claim exceeding what the evidence
supports.

---

## 13.1 The conclusion

> **Dhan's documented API v2 surface is substantially larger than IPD's implemented surface, and the
> two barely overlap in coverage. IPD calls four vendor surfaces (two API endpoints and two CSV
> downloads) against the fourteen API/feed surfaces named in the set — and both of the API endpoints it
> calls have no published request/response schema. The binding constraints on
> progress are, in order: (1) vendor entitlement, currently `EXTERNAL_BLOCKER —
> DHAN_DATA_API_SUBSCRIPTION_INACTIVE`; (2) genuine gaps in the published documentation, sixteen of
> which cannot be closed by further reading; and (3) IPD's own internal identity coverage, where
> 23,644 of 23,764 candidate equities failed to correspond to IPD's own master. The implementation
> that exists is of good quality — contract-isolated, fail-closed, and tested — but it covers a small
> fraction of what is documented, and it cannot currently execute at all.**

**What this assessment did not find, and that is equally a finding:** no Dhan data reaches any
IIPS decision, report or user interface today. The "supporting evidence only, never an independent
decision authority" constraint is not merely a policy statement in this codebase — it is
**structurally enforced**, because no such path exists and the provider boundary is provider-neutral
by construction.

---

## 13.2 Readiness by dimension

| Dimension | Readiness | Evidence |
|---|---|---|
| **Provider implementation quality** | **Ready** | Contract isolation (`D3D-01`…`D3D-07`), systematic fail-closed behaviour, disciplined credential handling, provider-neutral boundary. 1,712 tests executed, 1,708 passed, 0 failed, 4 skipped at `c260a82`. |
| **Documented-surface coverage** | **Not ready** | 2 of the 14 named API/feed surfaces are called (plus 2 CSV downloads); both called endpoints have no published schema. Areas D, F `MISSING`; E effectively `MISSING`; A, B, C, G, H `PARTIALLY_IMPLEMENTED`. |
| **Runtime operability** | **Not ready** | `806` blocks every data call. One authorized quote request remains unconsumed. |
| **Wire-format confidence** | **Not ready** | The Quote response shape, `last_trade_time`'s format, `net_change`'s presence, `depth`'s shape, the historical response shape and the candle timestamp convention are **all undocumented**. |
| **Error diagnosability** | **Not ready** | `806` and `807`–`810` collapse into one code; the vendor's throttle signal is invisible; the disconnect-code table is absent. |
| **Canonical-contract fit (implemented scope)** | **Ready** | D01 and D02 fit without any contract change (§5.7). |
| **Canonical-contract fit (full documented scope)** | **Not ready, and cannot be** | D03 is unsatisfiable from Dhan; D05 is unsatisfiable from Dhan (no face value anywhere); D06's endpoint is undocumented. |
| **Instrument coverage** | **Not ready** | 96 of 23,764 qualified (P7); 23,644 rejected `REJECTED_NO_P04_CORRESPONDENCE`. **The gate is internal, not vendor-side.** |
| **Consumer readiness** | **Not ready** | No IIPS consumer can use Dhan data today. Detailed per consumer in §8. |
| **Rate-limit safety** | **Partially ready** | A tested limiter exists, but it is a single shared bucket, mis-aligned to the documented family limits, and its throttle signal is unwired. |
| **Security posture (current implementation)** | **Ready** | Credentials never stored on the instance, never logged, never echoed; loopback-only; constant-time comparison; NFR-06 provider masking. |
| **Security posture (future WebSocket work)** | **Constrained, not ready** | The vendor's URL-token pattern (S-12) would regress IPD's posture if adopted verbatim. |
| **Governance integrity of this package** | **Ready** | Documentation only; no implementation, runtime, contract, credential or W-06 change; one branch; independently verified artefact digests. |

---

## 13.3 The five findings, restated as conclusions

| # | Finding | Confidence | Basis |
|---|---|---|---|
| **C-1** | **IPD's implemented Dhan surface is three of fourteen documented surfaces**, covering the D01 and D02 domains only. | **High** | Complete enumeration of both sets (§2.3, §3.1); repository-wide grep; 49 pages read in full. |
| **C-2** | **Depth must never be conflated.** Four distinct products exist; IPD implements none of the three that are specified, and reads the one whose structure is undocumented. | **High** | `P4 p.1`; `P5 p.5–7`; `P6 p.1–6`. |
| **C-3** | **The error layer has at least five vocabularies and no documented HTTP-status mapping.** The consequence is not theoretical: `806` and `807`–`810` were observed as the same HTTP 401, and the correct root cause was reached only by reading the body out of band. | **High** | `P1 p.4–5`; `P8 p.1`; W-06 record; `dhan_api_client.ts:311–325`. |
| **C-4** | **The documentation is materially incomplete and sixteen discrepancies are unresolvable from the published set.** Five referenced tables/definitions do not exist anywhere in the nine documents. | **High** | §6 register; §2.3 "referenced but never defined". |
| **C-5** | **Dhan Company Information cannot support financial statements, cash flows, or dividend sustainability** — proven by the vendor's own field list, not inferred. | **High** | `P1 p.9–13`; D21; §5.3 against `src/contracts/d03_fundamentals.ts`. |

---

## 13.4 The three statements this assessment is prepared to defend

Each is falsifiable by a reader with the same artefacts.

**1.** *IPD does not currently consume Dhan market data in any decision, report or user interface.*
Falsified by: a consumer path from `src/providers/dhan/` into an IRR engine, report or UI component.
Verified by: repository-wide import search — the only consumers are the broker-import identity path,
the provider-neutral local route, and the fixture harness.

**2.** *Dhan cannot satisfy canonical D05 or D03.*
Falsified by: a Dhan source supplying `faceValue` or a statement/period/filing record.
Verified by: `P9 p.1–4` (no face-value column), the retained 33-column P7 snapshot (no face-value
column), and `P1 p.9–13` (no statement, period, filing, restatement or audit field).

**3.** *Six internal improvements are available today without entitlement or vendor clarification.*
Falsified by: any of them requiring a vendor answer.
Verified by: R-01…R-06 — all are internal, all use mechanisms IPD already owns, and R-02's guards are
safe under either hypothesis about the undocumented shape.

---

## 13.5 What a reader should be careful about

Stated explicitly, because over-claiming is the characteristic failure mode of an assessment of this
kind.

1. **Documentation is not entitlement.** Everything in §2 and §3 describes what Dhan *documents*. It
   does not establish that this account may call any of it. The vendor's own reference library says
   so: its presence "does not establish account entitlement, subscription status, live API
   availability, or successful production access."
2. **The assessment's own inferences are labelled.** Where the set is silent — the REST Quote shape,
   the `ohlc.close` semantics, the candle timestamp convention — the conclusion says so and names the
   inference. None of them is presented as documented.
3. **Contradictions are recorded, not resolved.** Sixteen of the twenty-six discrepancies remain open.
   Where this package's later sections depend on one, it is by *deferral* (the answer comes from the
   vendor), never by preference.
4. **The absence of a WebSocket implementation is not a defect.** IPD is a REST-and-poll provider by
   design. The finding is about *coverage and risk*, and about the fact that the best-documented
   product in the set is the least implemented.
5. **"Implementable" is not "implemented".** The recommendations in §12 are proposals requiring
   separate authorisation, and several of them are deliberately blocked on external answers.
6. **The gap count is not a score.** Twenty gaps across eight capability areas is a measure of the
   ratio between a large vendor surface and a narrow implemented slice — not a measure of IPD's
   engineering quality, which the test evidence rates highly.

---

## 13.6 Final readiness position

### Ready, today, under IPD's own authority
- Six internal hardening and observability improvements (R-01…R-06).
- The clarification request (R-07) — a message, not a programme.
- The documentation package itself, as the evidence base for both.

### Ready, today, under operator authority
- Data API subscription confirmation (R-08).
- Feed/depth entitlement confirmation (R-09).
- Data reuse, storage and display rights (R-10).

### Not ready — blocked
- Any Dhan data retrieval (B-01).
- Any depth or WebSocket capability (B-03 + Q-01…Q-05).
- Any analytics or intraday capability (Q-06…Q-09).
- D05 population from Dhan (G-02 — unachievable in principle, not merely blocked).
- Any IIPS consumer using Dhan data for anything (§8).

### Not ready — internal, and independent of Dhan
- Instrument coverage beyond 96 instruments (I-01 — P04 correspondence).
- D05 attributes and D03 fundamentals (I-02, I-03 — need non-Dhan sources).

---

## 13.7 Assessment boundary restated

This package:

- **changed no implementation file**, contract, test, credential, configuration or deployment;
- **made no Dhan API call** and **consumed no authorized request** (one remains unconsumed);
- **did not modify** any W-06 record, W-06 test or milestone status (M1 not achieved; M2a/M2/M3a/M3/M4
  not started);
- **did not grant implementation authority** — every §12 recommendation requires separate
  authorisation;
- **did not resolve** any documentation contradiction by preference, and recorded each of the 26 as
  open, with resolvability stated;
- **did not alter** the W-06 root cause `EXTERNAL_BLOCKER — DHAN_DATA_API_SUBSCRIPTION_INACTIVE`, which
  stands at `c260a82`;
- **did not touch** PR #156, which remains OPEN / MERGEABLE / UNMERGED.

**Baseline verified at `c260a8222661519c317183dc62c501d1b7a4cdae`:** `npx tsc` exit 0; `npm test` →
1712 executed, 1708 passed, 0 failed, 4 skipped (pre-existing skips).

---

## 13.8 The assessment in one paragraph

The nine documents describe a vendor platform roughly three times larger than the slice IPD has
implemented, and they do so with real gaps: four documented products for market depth rather than
one, five error vocabularies with no HTTP-status mapping, an historical endpoint documented as a
two-row table with no schema at all, and a Company Info API that offers trailing ratios where
statements were expected. IPD's own work is in good order — contract-isolated, fail-closed, tested,
provider-neutral, and holding a disciplined line that no vendor number has yet become an IIPS
decision. What blocks progress is therefore not the code but three things outside it: a subscription
that is not active, sixteen questions that only Dhan can answer, and an internal identity layer whose
correspondence rate — 96 of 23,764 — will remain the practical ceiling even after both external
blockers clear. The correct next step is unglamorous and specific: make the six internal fixes that
need nothing, ask the sixteen questions that cost nothing, and confirm the subscription that unlocks
everything else — in that order, and without spending the last authorized request on anything except
the re-qualification it was saved for.
