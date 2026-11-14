# Decision-ready scope and roadmap reconciliation

**For human review.** This report proposes decisions; it does not amend the roadmap or authorize implementation.

This report preserves the complete decision-ready assessment returned in the preceding task, with two focused corrections: the unrelated current-portfolio standing-authority reference has been removed, and the M1 authentication interpretation and proposed acceptance wording have been clarified. The assessment package is on IPD branch `docs/dhan-api-v2-comprehensive-assessment`; this report is published in the corresponding package path on the current IPD session branch. The package documents are referenced at their pinned branch commit below and are not copied or changed here.

## 1. Executive summary

The recommended scope is a **secure, read-only Dhan price-snapshot integration for identifiable cash-equity holdings**, with reliable freshness, partial-coverage disclosure and proportionate local operation. IIPS needs long-term historical analysis, but the evidence does not yet establish Dhan—or D114/PIT—as the appropriate historical provider for every use.

Five decisions remain before the assessed scope can be reconciled with the controlling roadmap:

| Decision | Recommended treatment |
|---|---|
| **A — W-24 / W-34** | Retain report-level provenance and source lineage; do not require full cross-service tracing unless separately justified. Formally resolve W-34’s existing W-24 dependency before claiming W-34 under changed criteria. |
| **B — M4 / core readiness** | Retain M4 unchanged as the full-menu milestone. Have the owner separately define and accept a narrower core portfolio-price capability on evidence; do not claim M4 without all its existing criteria. |
| **C — D-5 / W-13 / W-29** | Make absence of bid/ask representable and safe at the canonical boundary; do not require bid/ask availability or market depth for price consumption. Assess compatibility and governing authority before selecting a contract change. |
| **D — W-14 / W-28 / W-30** | Accept holdings into sourced valuation only under an explicit evidence policy that distinguishes constructed mappings, actual-holdings coverage and live qualification. Withhold unqualified holdings and disclose partial totals. Do not assume unlimited live requests. |
| **E — W-04 / D-7** | Retain secure provisioning, metadata validation, independent rotation and atomic recovery. Decide a minimal operator-output policy; do not expose locations or secret-derived information without a threat-modelled justification. |

**Key governance point:** the recommendations are not a substitute for the existing roadmap. In particular, W-34 formally depends on W-24, W-29 formally depends on W-13, and M4 includes the existing end-to-end trace criterion. None is silently removed by this report.

---

## 2. Confirmed scope baseline

For the present personal, long-term investment application:

### Core Dhan use

- Suitable cash-equity **price snapshots**, correctly identified and qualified.
- Exact security/instrument mapping and measured coverage of actual holdings.
- Secure server-side authentication, entitlement, bounded acquisition and safe error handling.
- Honest per-holding freshness, unavailable states and partial portfolio valuation.
- Provider-neutral consumer integration and proportionate local start/recovery.

The evidence does not yet establish which of Dhan Full Quote, LTP or OHLC is the best endpoint for that core. The choice must satisfy the actual consumer and canonical contract, not simply minimize endpoint size.

### Not prerequisites for the core

- Dhan-sourced history, although **historical analysis is an IIPS need**.
- Intraday intervals, WebSocket streaming, market-depth feeds, order execution, derivatives and option chain.
- Durable quote-cache persistence, a separate preflight or full cross-service tracing unless an additional need is established.

### Evidence references

- **R:** [Controlling Dhan Live Integration roadmap v1.1](https://github.com/ramkivs/iips-review-recovered/blob/08411bcd6d782a601fe5c82cc9983d076831148d/docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md), particularly §§5–10 and Appendix A.
- **A00–A12:** [Complete Dhan API v2 assessment package](https://github.com/ramkivs/iips-production-market-data/tree/551f5e898e3475f35b95295a0e2874a7fa17228f/docs/integration/dhan-api-v2-assessment-2026-11-13). References below use the document number and its internal section.
- Local code observations below are from the available IPD checkout at `a624d06`; they are not a claim about the currently deployed Windows host. The assessment package’s implementation baseline is later, `c260a822`. IRR code references are to the pinned `08411bcd` revision above.

---

## 3. Five-decision register

### Decision A — W-24 / W-34: report lineage without mandatory full tracing

| Field | Decision-ready content |
|---|---|
| **Roadmap references** | R §5/W-24, §6/W-34, §10.3/M4. |
| **Current assessment** | **W-24 OUT OF SCOPE** for the present need; **W-34 PARTIALLY IN SCOPE** for reports containing price-derived figures. |
| **Evidence** | W-24 specifies an IRR-created correlation ID propagated through IPD into provenance and a bounded local log ring. W-34 requires `asOf`, freshness, stale/suppressed-data treatment and traceability to an IPD observation, and lists W-24 as a prerequisite. A07 §8.5 stresses distinct quote, calculation and report times. |
| **Problem** | The report’s source-lineage need is justified, but the roadmap binds it to a broader cross-service tracing mechanism that has not been justified for this product. |
| **Choices** | **A1:** retain W-24 and its dependency in full. **A2:** formally permit W-34 to use a proven, simpler governed observation reference/lineage mechanism instead. **A3:** defer W-34 until a reporting use and the necessary lineage are established. |
| **Recommendation** | **A2, subject to evidence.** Require a report price figure to identify the qualified observation or durable evidence reference; retain source classification, observation/as-of time, freshness/quality, relevant calculation/report time and the portfolio revision or input context needed to interpret it. Stale, suppressed and unavailable inputs must be labelled or withheld under the selected policy. |
| **Existing mechanism evidence** | IPD’s `DataProvenanceDTO` carries `asOf`, `receivedAt`, `evaluatedAt`, `dataVersion`, `lineageHash` and quality; `EngineApiAdapter.createMarketDataDTO` computes a `lineageDigest`. These are **candidate building blocks**. A digest alone does not prove that the underlying observation is retained, retrievable, rights-cleared or bound to a report. End-to-end report persistence/readback has not been demonstrated by this review. |
| **Consequences** | A1 preserves the roadmap dependency but retains additional implementation and logging effort. A2 requires a **formal dependency/acceptance reconciliation** and proof that the simpler mechanism can support report readback and source attribution. A3 avoids premature work but defers price-derived report capability. None of A2 or A3 changes M4’s trace criterion. |
| **Human authority / unresolved dependencies** | The programme owner should decide the scope and formal roadmap treatment; repository owners retain their respective execution boundaries. Confirm report persistence/readback, source masking, data-retention/display rights and whether an observation reference can be retained under those rights. |

**Recommendation boundary:** no part of W-24’s full cross-service trace and log ring is established as necessary for W-34’s minimum report lineage. Basic sanitized operational diagnostics remain necessary, but that does not prove the existing W-24 work item is needed.

---

### Decision B — M4 and acceptance of core portfolio-price capability

| Field | Decision-ready content |
|---|---|
| **Roadmap references** | R §6/W-27–W-30; §8 evidence ladder; §10.1–10.3/M1, M2a, M2, M4, M5, M6. |
| **Current assessment** | **M4 remains the full-menu milestone and is deferred for present core scope.** W-30 and W-29 are **IN SCOPE**. |
| **Evidence** | M4 requires Status, Quotes, History and Freshness, D02 freshness, an IRR → IPD → Dhan trace ID and Windows start/health/stop/restart evidence. M2 qualifies a quote; M5 covers measured identity coverage and a shared quote boundary. Neither alone proves actual W-30 portfolio acceptance. |
| **Problem** | The existing framework has useful component milestones but no explicit complete acceptance statement for a narrower portfolio-price capability independent of optional Dhan History and full tracing. |
| **Choices** | **B1:** require existing M4 before any core acceptance. **B2:** retain M4 unchanged and separately accept a bounded core capability on explicit evidence. **B3:** defer all acceptance until the full programme is adopted. |
| **Recommendation** | **B2.** Keep M4’s wording, status and full-menu meaning unchanged. The owner may separately decide whether a clearly described core portfolio-price capability is acceptable. That acceptance is **not M4 achievement**. |
| **Recommended core evidence** | (1) Approved local credential/transport controls and Windows operating evidence; (2) truthful observed provider/entitlement state; (3) M2-level qualified quote evidence for the relevant path; (4) actual-holdings identity and mapping census with unresolved reasons; (5) per-holding qualification and price evidence under Decision D; (6) W-29 mixed-state and W-30 consumer evidence, including labelled partial totals, time alignment and manual fallback; (7) security, rate-limit, failure and recovery checks; and (8) an owner-approved coverage/materiality policy and evidence-based assessment of residual gaps. Synthetic, Windows and live evidence must retain their separate E0–E4 meanings. |
| **Consequences** | B1/B3 make optional History and the existing trace criterion gate the core. B2 permits a narrower claim, but cannot alter M4, bypass its criteria or imply that all four menu capabilities are operational. |
| **Human authority / unresolved dependencies** | The programme owner decides the scope and acceptance standard and accepts the bounded capability on evidence. Confirm actual-holdings data, entitlement, request authority, target-host operation and coverage thresholds. Authority applicable to this Dhan roadmap must be established from its own governing records; no authority is imported from another workstream. |

#### M1 authentication interpretation and proposed acceptance wording

The roadmap’s M1 definition (§10.1) says a real authenticated interaction **succeeds**, while W-06 verification and G-M1 (§9.2) also mention a typed authentication failure. These are different outcomes:

1. **Successful authentication:** evidence establishes that Dhan accepted the supplied authentication credentials for the observed interaction. Credential decryption or an HTTP response alone does not prove this.
2. **Correctly classified negative path:** an authentication or entitlement failure is recognized and reported safely and accurately. This tests negative-path handling; it is **not** successful authentication. No successful quote is required to demonstrate correct negative-path handling, and a synthetic negative test must not be described as a live observation.
3. **Successful quote acquisition:** an authorized vendor interaction returns a valid quote. A received/normalized quote (M2a) and an independently checked qualified quote (M2) remain distinct; authentication alone proves neither.

The recorded HTTP 401 with vendor code `806` ("Data APIs not subscribed") is an entitlement-failure observation. **It does not prove successful authentication, an active subscription, or usable quote access.** It is dated evidence, not a fresh account check.

**Proposed wording for human governance review, not an alteration to M1:**

> **M1 — successful authentication:** Claim M1 only when a separately authorized, real Dhan interaction provides evidence that Dhan accepted the supplied authentication credentials; record the observed outcome and evidence without exposing credentials or sensitive locations. Credential resolution, receipt of an HTTP response, and a typed authentication or entitlement failure do not satisfy M1. A successful quote is not required solely to verify negative-path classification, and negative-path verification must be recorded separately without claiming M1. Authentication success alone does not establish active entitlement for a particular data capability, a valid quote, M2a or M2. Any quote acquisition and qualification remain subject to their own authorization and evidence criteria.

Whether an available Dhan interaction can independently establish accepted credentials without a data response is unresolved; do not invent an endpoint or interpret `806` as that proof. The existing M1 wording and status remain unchanged pending formal governance approval.

---

### Decision C — D-5 / W-13 / W-29: canonical bid/ask boundary

| Field | Decision-ready content |
|---|---|
| **Roadmap references** | R §5/D-5, W-13; §6/W-29; §9.2/M2; Appendix A. |
| **Current assessment** | **W-13 PARTIALLY IN SCOPE; W-29 IN SCOPE.** Honest absence is required; bid/ask availability and market depth are not core product prerequisites. |
| **What the contract requires** | At local IPD `a624d06`, `src/contracts/d01_quotes.ts` declares `bid: number` and `ask: number` as required TypeScript fields. Its runtime validator checks the positive-bid/ask cross-field ordering but does **not** explicitly validate their presence or type. Thus TypeScript-required is not the same as robust runtime enforcement. `dhan_normalizer.ts:topOfBook` returns `0` for absent or invalid depth; the existing validator can accept those zero values. |
| **Known consumers and guards** | The Dhan normalizer constructs the fields; the D01 validator is used by the normalizer, ingress pipeline and D114 PIT loader. `tests/dhan_d3d_contract_drift.test.ts` pins the normalized D01 key set including `bid` and `ask`. In the inspected IPD checkout, `MarketDataDTO` and `EngineApiAdapter.createMarketDataDTO` do **not** project bid/ask, and the synthetic portfolio binding values holdings from `ltp`. At IRR `08411bcd`, `frontend/server/market-data/dhanMarketDataRoutes.ts` and `frontend/src/api/dhanMarketData.ts` declare numeric bid/ask in their quote views. This is not an exhaustive proof that no other consumer depends on them. |
| **Problem** | The current canonical path cannot truthfully communicate absent depth through its declared fields. Calling them optional is not proven backward-compatible, particularly with pinned key sets and IRR numeric views. |
| **Choices** | **C1:** retain the contract and fail closed when required bid/ask cannot be truthfully supplied. **C2:** under the applicable contract governance, introduce a compatible, explicit absence representation and update affected validators/consumers. **C3:** use a separately governed price-only contract/path if justified, while preserving existing D01 semantics. |
| **Recommendation** | **C2 as the preferred direction, subject to compatibility and authority review.** Establish an explicit absence state; ensure malformed present values fail validation; preserve true present values; and allow a qualified price to pass without depth **only after** the contract and consumers support it. Do not assume a particular `optional`, nullable or flag design is automatically compatible. |
| **Minimum W-13 acceptance boundary** | An absent book cannot become a real zero or be rendered as available; valid present bid/ask remains correctly handled; malformed present values fail safely; all affected contract and consumer paths are tested. No full-depth or live bid/ask availability requirement is implied. |
| **Consequences** | C1 avoids a contract change but may block otherwise useful prices. C2 requires coordinated IPD/IRR compatibility evidence and contract-drift updates. C3 may avoid altering D01 but risks a parallel contract and duplication. W-29’s existing W-13 dependency remains in force until formally reconciled. |
| **Human authority / unresolved dependencies** | The programme owner must decide the product/contract direction under the **applicable governing records**. A contract change requires the authority and compatibility process those records actually prescribe; this review does not establish that a separate human approval cycle is always required, nor does it infer authority to override protected contract boundaries. Verify the current IRR/IPD consumers and vendor quote semantics before execution. |

---

### Decision D — W-14 / W-28 / W-30: actual-holdings qualification

| Field | Decision-ready content |
|---|---|
| **Roadmap references** | R §5/W-12/W-14; §6/W-27/W-28/W-29/W-30; §10/M2/M5/M6. |
| **Current assessment** | **W-14 PARTIALLY IN SCOPE; W-28 and W-30 IN SCOPE.** |
| **Evidence** | W-27 constructs mappings reproducibly; W-28 measures exact mapping coverage of actual holdings; W-14 is the roadmap’s live mapping-qualification item and requires sample evidence plus qualification or withholding of newly added owner-relevant rows. W-30 requires a sourced price or explicit unavailable state for each holding. A02 §3.2 and A03 §4.2 describe the dated P7 mapping evidence. |
| **Problem** | Synthetic mapping success, a reproducible registry and a coverage count are different from a vendor-qualified identity. W-14’s sample wording and “every” owner-relevant added row need a proportionate, explicit policy, especially with a limited authorized request budget. |
| **Choices** | **D1:** require individual live vendor confirmation for every valued holding. **D2:** use a documented, risk-based policy combining exact independent source evidence, a bounded live qualification sample and per-holding eligibility rules, withholding anything that fails the policy. **D3:** value only individually observed holdings and leave all others unavailable until further authority/evidence exists. |
| **Recommendation** | **D2 as an owner decision, not as proof that the existing W-14 criteria are already satisfied.** Define the sample, independent cross-checks, source age/lifecycle rules and treatment of new or changed mappings. Require individual live evidence wherever the evidence or applicable roadmap acceptance demands it; otherwise document precisely what non-live evidence supports eligibility and its limitations. Do not extrapolate a sample into a claim that every instrument was individually observed. |
| **Per-holding evidence before qualified sourced valuation** | A persisted holding and quantity tied to the relevant portfolio revision; an exact, unambiguous security/listing identity; an eligible provider mapping supported by the approved evidence policy; a valid qualified observation for the intended instrument with source/as-of time and acceptable freshness; and a valuation calculation whose input and treatment are traceable. An HTTP response containing a price without adequate identity evidence is not by itself proof of the correct security. |
| **Portfolio acceptance** | Unmapped, ambiguous, unqualified, unavailable or stale-suppressed holdings remain explicitly unpriced or otherwise governed as degraded. A priced-subset total must state its denominator/coverage and time basis; no missing value is silently treated as zero or as a complete portfolio. Coverage/materiality thresholds must be evidence-based and chosen by the owner for the claim being made. |
| **Request budget** | The assessment records **one remaining authorized quote request** at its baseline. It cannot be presumed to prove all required identities, response conditions or independent cross-checks. Batching may reduce requests only if the selected endpoint, entitlement, response identity and authorization permit it; no such capability is assumed here. Further live observation requires appropriate future authority. |
| **Consequences** | D1 gives strong direct evidence but may be impractical with the budget. D2 can be proportionate but requires a formally accepted evidence policy and may need a roadmap acceptance reconciliation. D3 is safest where evidence is absent but may leave a largely unpriced portfolio. |
| **Human authority / unresolved dependencies** | Owner decision on qualification, coverage and acceptable residual risk; IPD/IRR owners retain implementation ownership. Outstanding: actual-holdings identity census, current master currency, independent source quality, vendor response semantics, entitlement and request authorization. |

---

### Decision E — W-04 / D-7: credential integrity and disclosure

| Field | Decision-ready content |
|---|---|
| **Roadmap references** | R §5/D-1, D-7, W-02–W-04; §9.4 credential evidence handling. |
| **Current assessment** | **W-04 IN SCOPE.** Credential integrity, secure provisioning, independent rotation and recovery remain necessary. |
| **Evidence** | W-04 requires interactive/stdin input, protected carriers, read-back before replacement, independent secret rotation, metadata, verification and interruption-safe replacement. It also prescribes a truncated fingerprint and envelope metadata output. D-7 prohibits secret values, `vault://` references, carrier paths and store metadata from which a sensitive local location can be derived. |
| **Problem** | Internal metadata validation is essential; operator output must be reconciled with D-7 and the threat model. A fingerprint may help distinguish rotations, but a secret-derived digest can create correlation or offline-guessing risk depending on the secret and construction. |
| **Choices** | **E1:** retain all W-04 output exactly as written after demonstrating D-7 compliance. **E2:** retain all integrity/rotation controls but disclose only the minimum approved non-locating status, with fingerprint or specific metadata only if justified and safe. **E3:** provide no operator output beyond success/failure, relying on a separate safe verification path. |
| **Recommendation** | **E2.** Validate schema version, secret identifier/provider binding, version, creation/rotation timestamps, token expiry and access/readability internally as applicable. Preserve round-trip verification, atomic replacement, old-carrier survival on failure and fail-closed outcomes. Operator output should default to non-locating status categories; disclose a particular version, timestamp or fingerprint only after deciding its operational need and threat-modelled safety. Never output the secret, reference, path or raw child-process output. |
| **Consequences** | E1 preserves W-04’s prescribed output if its safety is proven. E2 may require formal reconciliation with W-04’s existing output/acceptance wording; it does **not** weaken internal validation. E3 minimizes disclosure but can make rotation diagnosis harder. A fingerprint is not a substitute for read-back, integrity validation or successful vendor authentication. |
| **Human authority / unresolved dependencies** | Owner decision on the disclosure policy under D-1/D-7 and applicable security governance. Confirm the chosen backend, carrier format, threat model, permitted operator output and target-Windows evidence. No credential is needed for this decision-preparation exercise. |

---

## 4. Consolidated roadmap impact

The following preserves the latest assessment classifications. It is a **scope register**, not a change to the roadmap.

| Classification | Existing work items | Impact |
|---|---|---|
| **IN SCOPE** | **W-01, W-02, W-03, W-04, W-06, W-07, W-12, W-22, W-27, W-28, W-29, W-30, W-36, W-37** | Objectives remain justified. W-04’s output policy, W-06/M1 wording, and W-29/W-30 acceptance boundaries still require the decisions above; “in scope” does not mean accepted or complete. |
| **PARTIALLY IN SCOPE** | **W-08, W-09, W-10, W-11, W-13, W-14, W-17, W-18, W-32, W-33, W-34** | Necessary subrequirements remain; full diagnostic detail, intraday qualification or blanket historical/tracing dependencies may need formal reconsideration. |
| **CONDITIONAL** | **W-05, W-19, W-20, W-21, W-26, W-31, W-35, W-39** | Proceed only if the relevant backend cost, history source/use, freshness path or consumer need is established. |
| **DEFERRED** | **W-15, W-23, W-25, W-38** | Standalone quote picker, durable cache/state, adjustable thresholds and separate preflight are not presently established as necessary. |
| **OUT OF SCOPE** | **W-24** | Full cross-service tracing/log ring is not justified for the present need; basic diagnostics and report lineage remain required. |

**Inventory:** 38 items are represented: W-01–W-15 and W-17–W-39. **W-16 was never allocated.**

### Formal reconciliation points

| Existing reference | Decision implication |
|---|---|
| **W-34 → W-24; M4 trace criterion** | Decision A/B may recommend a narrower provenance mechanism, but the existing dependency and M4 criterion remain binding until formally changed. |
| **W-29 → W-13; D-5** | Decision C must resolve the canonical absence representation and compatibility. Optional depth availability must not be confused with correct missing-value handling. |
| **W-14, W-27, W-28, W-30; M2/M5** | Decision D must specify sample versus per-holding eligibility and partial-portfolio acceptance without overstating what E2 or E4 proves. |
| **W-04 and D-7** | Decision E must reconcile internal validation with prescribed operator output and disclosure restrictions. |
| **W-17–W-21, W-39; D-4; M3/M4** | Dhan history remains conditional. The present scope does not justify mandatory intraday qualification, but existing milestone wording is unchanged. |
| **W-32/W-33 → W-39** | Their quote-only use may not need a historical extension; any dependency change requires formal roadmap treatment. |

**M1** also needs interpretation of successful authentication versus typed-failure verification. No milestone status is changed or inferred here.

---

## 5. Historical-data decision boundary

Do **not** select a provider from the present evidence.

- **IIPS need:** long-term historical analysis can require multi-year depth, accurate identity, gaps and provenance, split/bonus treatment, and—where relevant—dividend/total-return methodology. Daily observations may be a useful base, but “daily” alone does not establish suitability.
- **Dhan candidate:** before integration is justified for a particular use, establish entitlement and rights; supported endpoint and interval semantics; required history depth; timestamps and gaps; adjustment/corporate-action treatment; fit with D02; and consumer need. A02 §3.3 and A04 §5.2 identify unresolved schema and `isAdjusted` issues.
- **D114/PIT candidate:** the repository contains dated historical-acquisition and PIT evidence and adjustment functions, but the prior review identified offline/non-production restrictions, rights questions and a count inconsistency in the dual-era report. Those artifacts do not prove complete, current, permitted per-holding coverage.
- **D-4:** if both sources are used, decide authority by use case and prohibit silent substitution or blending. No minute-level interval is made mandatory by this report.

---

## 6. External blockers and outstanding evidence

These remain independent of a decision to narrow scope:

1. **Entitlement:** A10 §11.2 records a historical `806 Data APIs not subscribed` response. This is not a current account check. Authentication, entitlement and a usable quote are distinct claims.
2. **Vendor semantics:** quote shape, timestamps, historical intervals and adjustments, rate-limit scope, error-code/status relationships, and instrument-ID currency/reuse remain unresolved in the supplied set. A05; A06; A10 §11.3.
3. **Rights:** storage, display and reuse terms must be established for the selected data and reports; a subscription alone does not settle them. A10 B-04.
4. **Actual-holdings evidence:** exact identity, registry coverage, mapping qualification, quantity and time alignment must be measured for the owner’s relevant portfolio.
5. **Operational evidence:** target-Windows store/launcher behaviour and safe recovery must be demonstrated at the appropriate evidence class. Synthetic success is not Windows or live-vendor qualification.
6. **Request authority:** the assessment’s recorded remaining authorized quote request has not been used here. Any future live request needs the applicable authorization and a defined evidence purpose.

---

## 7. Decisions for the owner and recommended next governance action

**Recommended next action:** the programme owner should review **A–E together**, record the selected product scope and evidence/acceptance policies, and direct the appropriate roadmap owner to reconcile any approved dependency or acceptance changes **in the controlling document under the applicable governance**. This is preferable to beginning implementation against contradictory assumptions about W-24/W-34, M4, D-5/W-13/W-29, W-14/W-30 and W-04/D-7.

The action should also identify which remaining facts can be established from existing internal evidence and which require the account holder, Dhan, a rights holder or target-host access. Applicable Dhan-specific governance and any protected boundaries must be established from their governing records; this report does not infer authority from another workstream or authorize third-party rights, cross-repository writes or live requests.

### Final distinction

- **Established assessment findings:** the present product is a personal long-term investment application; the roadmap contains 38 identified work items; the recorded evidence and conflicts above exist; synthetic and documented capability are not live entitlement.
- **Recommendations proposed here:** the choices A2, B2, C2, D2 and E2 and their proposed evidence boundaries.
- **Human-owner decisions:** product scope, formal roadmap reconciliation, acceptable coverage and residual risk, contract direction, disclosure policy and any future protected/live action. None has been made by this report.

No roadmap, status, dependency, acceptance criterion, repository, branch, commit or pull request was changed during the original assessment. No Dhan API call was made, no authorized request was consumed, and no credential or subscription action was performed. Publication of this corrected report is a separate documentation-only action; it does not authorize implementation or alter the IRR roadmap.

---

## 8. Dhan Live Integration: Evidence-Based Remaining Work Plan (14 November 2026)

### 8.1 Authority, decision and evidence boundaries

This section records a planning reconciliation, not an amendment to the controlling IRR roadmap, an acceptance decision, or authorization to implement or make a live request. It preserves the personal, single-user, long-term investment purpose of IIPS; it is not a trading-terminal plan. Sections 1–7 and decisions A–E remain unchanged. The subscription decision below is a later operator decision and supersedes any suggestion that the subscription choice itself needs to be reopened.

The operator has decided to proceed with the proposed **Dhan Data APIs subscription at ₹499 + GST per month**. Payment and activation remain under the operator's control; activation and current entitlement have not been verified in this review. Establish the actual terms and rights separately; the decision is not evidence of payment, activation, authentication or successful data access.

Sources and pins:

- **R:** [IRR roadmap v1.1, commit `08411bcd`](https://github.com/ramkivs/iips-review-recovered/blob/08411bcd6d782a601fe5c82cc9983d076831148d/docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md), especially §§5–10 and Appendix A. Its phase sequence, dependencies and milestone criteria remain controlling.
- **Assessment:** Sections 1–7 above and the [IPD assessment package at `551f5e8`](https://github.com/ramkivs/iips-production-market-data/tree/551f5e898e3475f35b95295a0e2874a7fa17228f/docs/integration/dhan-api-v2-assessment-2026-11-13). Its scope classifications and choices A–E are recommendations, not accepted roadmap changes.
- **Implementation evidence:** [IPD PR #156](https://github.com/ramkivs/iips-production-market-data/pull/156), observed OPEN and unmerged at head `a93278fb32fbfe31f01e0572950734cc836fb86f`. Despite its W-01/W-02 title, its history also contains W-03, W-04, D-6 and W-06 records. The assessment branch at `551f5e8` contains the cited Dhan records; it is not the same head as PR #156. Neither branch's content is proof that it is merged into IPD main or installed on the operator's Windows host.
- [W-02 Windows acceptance](https://github.com/ramkivs/iips-production-market-data/blob/551f5e898e3475f35b95295a0e2874a7fa17228f/docs/integration/DHAN-W02-WINDOWS-ACCEPTANCE-EVIDENCE-2026-11-12.md), [D-6 Windows rehearsal](https://github.com/ramkivs/iips-production-market-data/blob/551f5e898e3475f35b95295a0e2874a7fa17228f/docs/integration/DHAN-D6-WINDOWS-HOST-REHEARSAL-EVIDENCE-2026-11-12.md), [profile authentication reassessment](https://github.com/ramkivs/iips-production-market-data/blob/551f5e898e3475f35b95295a0e2874a7fa17228f/docs/integration/DHAN-W06-PROFILE-AUTHENTICATION-AND-ENTITLEMENT-REASSESSMENT-2026-11-13.md), and [W-06 `806` root-cause record](https://github.com/ramkivs/iips-production-market-data/blob/551f5e898e3475f35b95295a0e2874a7fa17228f/docs/integration/DHAN-W06-ROOT-CAUSE-806-DATA-API-SUBSCRIPTION-2026-11-13.md).

**Classification:** implemented means code is recorded on a specified branch; tested means the stated tests were reported; accepted means a recorded decision against specified criteria exists; merged means integrated into the relevant repository's mainline; operationally qualified means the appropriate target-host or real-vendor evidence has been demonstrated. These are not interchangeable. “Not evidenced complete” means not established by the inspected evidence, not a finding that no work exists on any other branch. E1/E2 synthetic or integrated evidence, E3 Windows evidence and E4 real-vendor evidence must not be conflated.

### 8.2 Completed activities excluded from rework

| Completed activity | Evidence and boundary |
|---|---|
| **D-6 procedure and rehearsal** | The procedure is documented and the Windows-host record says the exit criterion was satisfied with throwaway values. Real credential operation for W-06 remains separate. |
| **W-02 implementation and recorded acceptance** | The W-02 record reports **19/19 PASS** on the operator's Windows host and an explicit **ACCEPTED** decision, with synthetic secrets and E3/E1 evidence. It is not live Dhan qualification and remains unmerged in PR #156. Review whether later changes invalidate any acceptance evidence; do not repeat a valid test by default. |
| **W-01, W-03 and W-04 implementation and reported tests** | Their records report completed implementation and targeted tests on the PR lineage; W-04 reports 30/30 targeted tests and the later D-6 rehearsal exercised the utility with synthetic values on Windows. Integration and, where not evidenced, formal acceptance remain; do not reimplement completed functionality. |
| **W-06 investigation so far** | An independent operator-run profile interaction returned HTTP 200 and “Authentication Successful” for the credentials at that time. A separate quote interaction returned HTTP 401 with vendor code `806 Data APIs not subscribed`. Both are dated observations. The failure established an entitlement blocker at that time, not a successful quote. |

D-1's DPAPI user-scope and two-carrier convention is recorded and used by the implementation. D-2's read posture is recorded as the governing design; the W-04 record explicitly says W-05's session holder and bounded re-read are not implemented there. Confirm decision records and required signatures rather than inferring all Phase 0 acceptance from code.

### 8.3 Remaining inventory by phase

The roadmap has **38 allocated items: W-01–W-15 and W-17–W-39; W-16 was never allocated**. All are accounted for below, including implementation-complete items with integration or acceptance remaining. W-02's accepted implementation is not reopened; only integration and any evidence invalidated by later changes remain. In each row “pending” means completion was not established in the inspected evidence. The exact detailed criteria remain those in R. Repository owners implement and review their own boundaries; operator, external and governance needs are identified where material.

#### Phase 0 — decisions

| Decision | Completed evidence and remaining action |
|---|---|
| **D-1 · Select the Windows secret-store mechanism, admit its `SecretRef` provider, and fix the carrier specification** | DPAPI user scope, separate carriers and provider convention are recorded and implemented. Confirm the complete decision and required owner acceptance; retain owner-only access, atomicity and the at-rest-only limitation. No redesign is indicated. |
| **D-2 · Decide credential-read posture and the bounded re-read policy** | Read posture is specified. Confirm the governing record and acceptance of triggers, expiry/rejection distinction and latch; W-05 remains separate implementation. |
| **D-3 · Decide freshness semantics for market-closed periods** | Acceptance not evidenced. IPD/owner decide calendar and ageing, including worked holiday/reopening examples; required by W-22. |
| **D-4 · Decide D02 (Dhan) vs D114/PIT historical precedence** | Acceptance not evidenced. IPD and IRR decide source authority by use case and forbid silent blending or fallback; enables W-20 and historical consumption. |
| **D-5 · Decide the canonical representation of unavailable bid/ask** | Acceptance not evidenced. Contract owners select and record representation, validation and rendering; W-13 depends on it. |
| **D-6 · Record the Dhan token issuance and replacement procedure** | Documented and rehearsed with a throwaway value; no repetition required. Future real credential operation remains an operator action under W-06. |
| **D-7 · Define the provider state model, the meaning of "verify connection", and the diagnostics disclosure policy** | Adopted for IPD; IRR-side acceptance is explicitly outstanding. Obtain shared acceptance and resolve the W-04 disclosure interaction. Status reads observed state; it must not initiate a vendor request. |

#### Phase 1 — credential resolution and first authentication

| Item and exact roadmap title | Status; completed work | Remaining activity, dependencies and acceptance evidence |
|---|---|---|
| **W-01 · Admit a Windows `VaultProvider` and define the secret-path convention** | Implemented and tested on PR lineage; unmerged. | Review and integrate/publish existing change as appropriate, confirm acceptance of provider validation and unchanged existing behaviour. Depends on D-1. No reimplementation. |
| **W-02 · Implement the Windows DPAPI secret-store backend** | Implemented and explicitly accepted on recorded version; unmerged. | Integrate/publish accepted change as appropriate; assess later changes for effect on the Windows/test evidence and repeat only invalidated checks. Depends on W-01, D-1, D-2. |
| **W-03 · Add daemon backend selection and honest egress diagnostics** | Implemented and synthetically tested; unmerged. | Review/integrate and confirm acceptance of selectable backend, unknown-value refusal, honest readiness/egress and no secret or location disclosure. Depends on W-02 and D-7. |
| **W-04 · Credential provisioning and rotation utility** | Implemented and tested, with later synthetic Windows rehearsal; unmerged, formal programme acceptance not established. | Review/integrate and confirm independent rotation, verification and interruption-safe replacement. Resolve D-7/output-policy decision E without weakening internal controls. Depends on W-01, W-02, D-1. |
| **W-05 · Implement the credential read posture and bounded re-read from D-2** | Pending; ordinary credential resolution exists, but W-04 says it does not implement this item. | After D-2 and W-02, implement/test permitted re-read triggers, one retry and latch, expiry preflight, no loops and safe diagnostics. Not an M1 prerequisite. Assessment marks it conditional; roadmap remains unchanged. |
| **W-06 · Provision real credentials and prove first live authentication** | Open; historical independent profile authentication succeeded, while the data quote returned `806`; no parsed quote recorded. | Operator confirms subscription activation, then W-03/W-04/D-6 and current authorization govern a controlled interaction and sanitized evidence. See §8.4. W-05 is not required for M1. |

#### Phase 2 — Status truth

| Item and exact roadmap title | Status; completed work | Remaining activity, dependencies and acceptance evidence |
|---|---|---|
| **W-07 · Make `ServiceHealth` live-capable (additive, versioned)** | Pending; baseline health has literal connectivity and qualification values. | After D-7, IPD and IRR boundaries accept versioned D-7 values additively; contract-drift and unknown-value rejection tests pass. Joint contract governance. |
| **W-08 · Record observed provider state (last success/failure, latency, auth outcome)** | Pending; baseline lacks full observed-state reporting. | After W-07, add bounded state recorder and explicit limited verify action; test Status is observation-only and does not call the vendor. Assessment proposes proportionate scope, not a roadmap change. |
| **W-09 · Add `/v1/diagnostics`** | Pending; partial diagnostics exist. | After W-08 and D-7, deliver authenticated, sanitized category/readiness diagnostics and disclosure/failure tests. |
| **W-10 · IRR Status consumes IPD authority only** | Pending; existing IRR readiness inference is a second source. | After W-07, W-08 and D-7, consume IPD-observed state only, remove IRR Dhan configuration/pointers, and test truthful, non-disclosing output. IRR owner. |
| **W-11 · Reconcile configuration names, ports and environment documentation; add an IRR leak gate** | Pending; baseline names and ports conflict. | Reconcile cross-repository configuration and docs, add bundle leak gate and demonstrate documented setup for all four capabilities. No item prerequisite; live verification needs entitlement and authorization. |

#### Phase 3 — live quotes

| Item and exact roadmap title | Status; completed work | Remaining activity, dependencies and acceptance evidence |
|---|---|---|
| **W-12 · Qualify the Dhan quote request/response against the live vendor** | Blocked by W-06; parser/normalizer have synthetic evidence, not a recorded parsed live quote. | With entitlement and separately authorized requests, capture safe live evidence, normalize and cross-check payload, identity, timestamps and values. M2a requires a real quote normalized to D01; M2 requires qualification. |
| **W-13 · Represent unavailable bid/ask honestly** | Pending; baseline can normalize absence to zero. | After D-5, implement and test contract, normalization and rendering so absence cannot be mistaken for zero. W-12 is an edit-sequencing constraint, not a live-evidence prerequisite. Contract governance required. |
| **W-14 · Live qualification of instrument mappings** | Live acceptance blocked by W-06; exact-identity registry exists, but existing rows are not thereby live-qualified. | Cross-check an authorized sample and document mismatch signatures; qualify or withhold new rows. W-12 recommended first; W-27 required for added rows. Operator/request authority and decision D evidence policy apply. |
| **W-15 · Quotes screen: identity picker and honest field rendering** | Pending; identity search exists but entry is manual. | After W-11 and W-13, implement IRR picker and truthful fields; demonstrate selection and unresolved handling. Assessment recommends deferral, not a roadmap amendment. |

#### Phase 4 — historical qualification

The assessment treats Dhan history as conditional for the present product need; these items and M3/M4 remain in the roadmap until formally reconciled.

| Item and exact roadmap title | Status; completed work | Remaining activity, dependencies and acceptance evidence |
|---|---|---|
| **W-17 · Qualify the Dhan historical request/response** | Blocked by W-06; adapter and normalization have synthetic evidence, vendor wire semantics remain provisional. | With entitlement, rights and request authorization, verify live payload and D02 candle boundaries for each supported interval. |
| **W-18 · Reconcile the 1,825-day cap and define chunking/limits** | Blocked by W-17; request guard exists. | Establish observed limits; document and test chunking or explained prevalidated refusal for full-range requests. Vendor evidence required. |
| **W-19 · Wire D02 cache and D02 freshness evidence** | Blocked by W-17; cache exists but composed freshness is not wired. | Wire cache/orchestrator and expose real D02 freshness to IRR; test observation and failure paths. Assessment marks conditional. |
| **W-20 · Implement the D02 / D114-PIT precedence boundary** | Pending D-4; source components exist, accepted precedence is not established. | Enforce and label the chosen source with no silent substitution; test unavailable and non-authoritative cases. Joint governance; assessment marks conditional. |
| **W-21 · History screen: range affordance and truthful gaps** | Blocked by W-11 and W-18; screen exists. | IRR renders range, empty/partial results and gaps honestly; demonstrate partial coverage cannot be mistaken for full coverage. Assessment marks conditional. |

#### Phase 5 — freshness and diagnostics completion

| Item and exact roadmap title | Status; completed work | Remaining activity, dependencies and acceptance evidence |
|---|---|---|
| **W-22 · Session-aware freshness** | Pending D-3; D01 freshness exists without session awareness. | Implement accepted calendar/ageing rule and test after-hours, holidays and reopening against worked examples. |
| **W-23 · Persist cache and freshness state across restarts** | Blocked by W-08 and W-19; in-memory state exists. | Separately evidence restart, cold-cache restart and persistence; test corrupt/absent store degradation. Assessment recommends deferral; persistence is not an M4 prerequisite. |
| **W-24 · Traceable diagnostics across IRR → IPD → Dhan** | Blocked by W-08/W-09; end-to-end correlation is not established. | Implement correlation and bounded local log ring; demonstrate safe end-to-end failure tracing. Assessment recommends out of present core scope, but W-34's dependency and M4's trace criterion remain until formally changed. |
| **W-25 · Configurable freshness thresholds** | Pending; defaults exist. | Add visible validated configuration and tests preserving defaults. No prerequisite; assessment recommends deferral. |
| **W-26 · Close the transport-contract gap: `getFreshness` on the client** | Blocked by W-19; transport surfaces exist. | Deliver one freshness-client boundary and contract/consumer tests. Assessment marks conditional. |

#### Phase 6 — consumer adoption foundation

| Item and exact roadmap title | Status; completed work | Remaining activity, dependencies and acceptance evidence |
|---|---|---|
| **W-27 · Build the repeatable mapping expansion pipeline (construction; no live evidence)** | Pending; P04, scrip-master evidence and exact-identity registry are the baseline. | Build repeatable sourced construction, rejection/conflict reports and synthetic validation with no guessed/name-only identity. No live call or credential required. |
| **W-28 · Measure mapping coverage against the owner's real holdings** | Blocked by W-27; baseline mapping coverage is not an actual-holdings census. | With operator-approved holdings access, measure matches, gaps and reasons; produce reproducible coverage report. No live evidence required. |
| **W-29 · Shared IRR quote-consumption boundary** | Build blocked by W-11, W-13 and healthy identity path; transport components exist. | Build one shared quote boundary and mixed-state tests. Live acceptance needs M2. It does not depend on W-17, W-19 or Phase 4. |
| **W-39 · Historical-data consumption extension** | Blocked by W-29, W-19 and D-4/W-20; accepted shared extension not evidenced. | Deliver one labelled authoritative series or explicit unavailability; live acceptance additionally needs M3. Assessment marks conditional. |

#### Phase 7 — consumer integrations

R §6 Phase 7 names these items by consumer rather than standalone work-item headings. They are independently deliverable and do not gate a Dhan menu capability.

| ID and roadmap consumer title | Status; completed work | Remaining activity, dependencies and acceptance evidence |
|---|---|---|
| **W-30 · Personal Portfolio** | Pending; baseline prices are operator-entered. | After W-29/W-27/W-28, show sourced prices or explicit per-holding unavailable/unmapped state, as-of and worst freshness, plus labelled manual fallback. Owner holdings/coverage policy and live evidence required for live acceptance. |
| **W-31 · Watchlists** | Pending; names and membership exist. | After W-29, show price/change/freshness and mixed unresolved states; test bounded rate-aware batch fetch. Assessment marks conditional. |
| **W-32 · Company Intelligence / stock-level analysis** | Pending; identity/coverage observations exist. | After W-29 and W-39 under the current roadmap, show price and any history with provenance and coverage; represent absence honestly. Narrowing history dependency requires governance. |
| **W-33 · Valuation (IID)** | Pending; fixture prices exist. | After W-29/W-39/W-28, record canonical price provenance/as-of and block or degrade stale/unresolved verdicts; prove fixtures cannot be mistaken for live. Dependency change requires governance. |
| **W-34 · Reports / decision support** | Pending; accepted price reference not established. | After W-29 and W-24, refuse or label stale/suppressed figures and trace each price to an IPD observation. Simpler lineage is a proposal until formally accepted. |
| **W-35 · Broker Holdings** | Pending; preview intentionally has no market value. | After W-30, show sourced prices/freshness for committed holdings while preserving preview disclaimers. Assessment marks conditional. |

#### Phase 8 — Windows operational readiness

| Item and exact roadmap title | Status; completed work | Remaining activity, dependencies and acceptance evidence |
|---|---|---|
| **W-36 · Extend the existing IIPS launcher for the market-data daemon** | Pending; existing launcher and PR-branch W-03 selector are the baseline. | After W-03, W-11 and D-7, extend the existing start/validate/stop scripts, not a competing launcher. Demonstrate Windows start, health, stop, restart, duplicate refusal, unchanged existing services and sanitized logs (E3). Operator host access required. |
| **W-37 · Operator runbook: live Dhan operation and recovery** | Pending; D-6 procedure exists. | After W-09, W-11 and W-36, supply operation/recovery guidance; owner dry-run from the document includes a successful quote and simulated expiry recovery. Appropriate live authority and entitlement required. |
| **W-38 · Startup readiness preflight** | Blocked by W-09/W-11; individual baseline checks exist. | Deliver a safe local readiness command and demonstrate configured success and distinguishing broken configurations. Assessment recommends deferral. |

### 8.4 Immediate continuation: W-06 and protected request

**Single next activity:** continue Phase 1 **W-06**, beginning with operator-controlled subscription activation and confirmation. The operator's exact action is to complete payment/activation outside this task and confirm, through the account's subscription interface or other approved non-API evidence, that the intended account's Data APIs plan and relevant quote capability are active, including effective validity. Record only a sanitized confirmation; do not publish payment details, credentials or sensitive account details. Confirm relevant usage limits and storage/display/reuse rights separately. An account display supports an entitlement-status claim, not a claim that IPD obtained a quote.

Before any controlled interaction, confirm the intended implementation version and Windows user context; W-03/W-04 availability, D-6 procedure and secure backend readiness; current credential validity and expiry; loopback daemon and honest egress; safe evidence capture; permitted endpoint and instrument; and explicit operator authorization, request count and purpose. The previously observed token and subscription status are historical; do not assume present validity. Prevent unapproved retries or secondary probes from spending the request. No credential or sensitive location should be included in records.

**M1 and W-06: governing sources and interpretation.** R §10.1 defines M1 as one real authenticated interaction with Dhan that **succeeds** (E4). R §5 W-06 separately specifies the controlled daemon-based execution and evidence, including startup/selector/readiness, credential-resolution and request outcomes, HTTP status class, and checking captured output for secrets and locations. R §9.2 G-M1 and W-06 verification mention a structural success **or typed authentication failure**; a correctly classified failure is useful negative-path evidence but, under the proposed interpretation in §3 Decision B above, is not itself successful authentication under §10.1. The independent profile HTTP 200 is evidence of accepted credentials for that interaction at that time; whether it satisfies M1 and/or W-06's distinct execution/evidence requirements is for the responsible owner to assess. It must not be silently dismissed, nor automatically treated as formal milestone acceptance.

The W-06 `806` root-cause record asserts that a successful quote is necessary for M1. That assertion conflicts with R §10.1's authentication definition: **do not add a quote requirement to M1** without a governing change. No extra mandatory M1 criterion is imposed by this plan. Section 3's proposed wording, including separate authorization and safe recording, remains a proposal for governance review, not a change to M1. Authentication alone proves neither data entitlement nor a quote.

| Outcome | Evidence and limits |
|---|---|
| **Authentication** | Real evidence that Dhan accepted the credentials for the observed interaction; credential decryption, an HTTP response alone or typed `806` failure does not establish this. Apply the separate R W-06 evidence and disclosure requirements to W-06 execution. |
| **Data API entitlement** | Operator-confirmed active account plan for the relevant capability, with an authorized data-endpoint outcome where appropriate. A further `806` means that attempt remains refused; do not infer its precise cause or activation timing without evidence. |
| **Quote acquisition / M2a** | Real quote received and normalized to a canonical D01 envelope. HTTP success alone or an empty response is insufficient. |
| **Quote qualification / M2** | W-12 evidence cross-checking live payload, exact identity, timestamps, values and normalization. One qualified sample does not qualify every holding. |

**Remaining quote request:** the recorded remaining authorized quote request remains **unused**. Before it is used, subscription activation must be confirmed and the operator must provide explicit authorization for the actual endpoint, instrument, purpose and request count. The historical record does not establish that any particular future purpose has already been approved. Protect the request from accidental retries and additional probes; stop and seek renewed direction if prerequisites or authority are unclear. This plan does not authorize or consume it.

### 8.5 Blockers, decisions and execution sequence through M6

**Operator actions:** activate and confirm the chosen subscription; privately obtain/renew and provision credentials when authorized; approve Windows-host operation and appropriate actual-holdings access; explicitly authorize any live request. No purchase, activation, credential operation or vendor call is performed by this plan.

**External dependencies:** vendor activation and entitlement propagation; permitted endpoint behaviour and rate limits; storage, display and reuse rights; live quote/history semantics and independently checkable mapping/value evidence. Subscription alone does not settle all rights or prove a usable quote.

**Programme/repository-owner decisions:** confirm D-1/D-2 acceptance records, decide D-3/D-4/D-5 and obtain shared D-7 acceptance; determine M1/W-06 interpretation and the disposition/review of PR #156. Decide A–E in §3, including W-04 disclosure, W-13 contract, actual-holdings evidence and partial totals, report lineage, and whether to separately accept a narrower core capability. Preserve W-34 → W-24, W-29 → W-13, W-32/W-33 → W-39 and M4's trace criterion unless formally changed by the controlling owner. IRR remains responsible for its roadmap and consumers; IPD remains responsible for provider work. Local Git synchronization remains under the user's control.

**Roadmap order, subject to its permitted parallelism:**

1. **Phase 0 and 1:** close outstanding decision/acceptance gaps, review and integrate existing PR work as appropriate, operator activates the chosen subscription, and continue W-06 toward **M1**. W-05 is operational, not an M1 gate.
2. **Phase 2:** D-7 → W-07 → W-08 → W-09/W-10; W-11 has no item prerequisite. This work can proceed in parallel with Phase 1 where its own prerequisites permit.
3. **Phase 3:** W-06 → W-12 → **M2a**, then evidence-based **M2**; D-5 → W-13, with W-12 edit sequencing; W-14 qualifies mappings and W-15 remains allocated.
4. **Phase 4:** after W-06, W-17 → **M3a/M3** and W-18/W-19; D-4 → W-20; W-21 follows W-11/W-18. History is independent of Phase 3 but its present product use needs the owner's decision.
5. **Phase 5:** D-3 → W-22; W-08/W-19 → W-23; W-08/W-09 → W-24; W-25 and W-26 follow their own dependencies. **M4 remains full Status, Quotes, History and Freshness**, including existing trace and Windows evidence; persistence is not an M4 gate.
6. **Phase 6:** W-27 → W-28 can begin without live access; W-11/W-13 → W-29, with M2 for live acceptance. Measured coverage and the shared boundary support **M5**. W-39 additionally requires its history dependencies and M3 for live acceptance.
7. **Phase 7:** W-30–W-35 follow their individual dependencies and agreed exclusions toward **M6**; W-34 retains W-24. Consumers must represent stale, unresolved and partial data honestly.
8. **Phase 8:** W-36–W-38 proceed as their own dependencies permit, including E3 Windows operation/recovery evidence. Phase numbering does not prevent the parallel work explicitly permitted by R §4.

This section records historical evidence and a plan only. It does not change milestone status, certify current deployment or entitlement, authorize synchronization, or initiate implementation.
