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
