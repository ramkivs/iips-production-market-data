# O-3 Act B — Provider Selection: NSE (National Stock Exchange of India)

## Identity

| Field | Value |
|---|---|
| **Record type** | Provider selection authority act |
| **Open item** | O-3 — Provider selection |
| **Act** | Act B — Provider selection (continuation of deferred act) |
| **Date** | 2026-09-12 |
| **Selecting authority** | **Program Authority** (designated A-role, Act A `8db3537`) |
| **Provider selected** | **National Stock Exchange of India (NSE)** |
| **Scope** | **All IIPS domains D01–D10** (with dimension-level coverage assessment below) |

## Provider identity

**National Stock Exchange of India Limited (NSE)** — India's largest stock exchange by
trading volume, operating the NSE CM (Cash Market / Equity), NSE FO (Futures & Options),
and NSE CDS (Currency Derivatives) segments.

NSE data is accessed through:
- **NSE Internet Data Feed (IDF)** — formal exchange data feed product
- **Authorized data vendors** (GFDL/DotEx, TrueData, etc.) — licensed redistributors
- **NSE published data** — bhavcopy files, corporate filings, market statistics

### Distinction from other acquisition mechanisms

| Mechanism | Classification |
|---|---|
| **NSE direct** (exchange data feed, IDF, authorized vendor) | **This selection** |
| Kite Connect (Zerodha broker API) | **NOT selected** — broker redistribution, not exchange-direct |
| Upstox API | **NOT selected** — broker redistribution |
| Unofficial NSE scrapers/libraries | **NOT selected** — unauthorized access |
| Bloomberg/Refinitiv (global vendors covering NSE) | **NOT selected** — third-party redistribution |

## OI-09 status

✅ **RESOLVED — FIGI / OpenFIGI authoritative** (P04 gate acceptance §3). The P02-03 rubric
SR-4 prerequisite is satisfied. Identity inputs are comparable.

## P02-03 Rubric evaluation — 13 dimensions

### 1. Coverage (D01–D10)

| Domain | NSE Coverage | Evidence |
|---|---|---|
| **D01** Market prices/quotes | ✅ **COVERED** — NSE CM, NSE FO, NSE CDS real-time L1 via authorized vendors | GFDL, TrueData product documentation; NSE IDF |
| **D02** Historical OHLCV | ✅ **COVERED** — bhavcopy daily files, historical intraday via vendors | NSE daily reports; vendor historical APIs |
| **D03** Fundamentals | ⚠ **PARTIAL** — corporate financials, shareholding patterns via NSE filings | NSE corporate info pages; limited standardized data |
| **D04** Corporate actions | ✅ **COVERED** — corporate announcements, ex-dates, adjustment factors | NSE corporate announcements feed |
| **D05** Instrument/security master | ✅ **COVERED** — listing info, symbol details, instrument metadata, lifecycle events | NSE listing/filing data |
| **D06** News/events | ⚠ **PARTIAL** — exchange announcements/filings only; not general market news | NSE corporate filings |
| **D07** Analyst estimates/consensus | ❌ **NOT COVERED** — NSE does not provide analyst estimates | No NSE product |
| **D08** Macroeconomic data | ❌ **NOT COVERED** — NSE does not provide macro data (RBI, government statistics) | No NSE product |
| **D09** Alternative data | ❌ **NOT COVERED** — NSE does not provide alternative data | No NSE product |
| **D10** Exchange/reference metadata | ✅ **COVERED** — market status, turnover, trading statistics, circulars | NSE published data |

**Assessment:** NSE covers **6 of 10** domains fully or partially (D01, D02, D03-partial, D04, D05, D06-partial, D10). **3 domains NOT covered** (D07, D08, D09). Coverage is limited to **Indian securities listed on NSE**.

### 2. Granularity & history

| Aspect | Evidence |
|---|---|
| Tick-level data | Available via authorized vendors (L1 at 1-second frequency; raw tick stream available) |
| Daily granularity | Bhavcopy files (end-of-day OHLCV) |
| Intraday granularity | 1-minute and other intervals via vendor APIs |
| Historical range | Multi-year history available via vendors; exact range depends on vendor agreement |

**Assessment:** **COVERED** for Indian equity/derivatives. Granularity and range are vendor-dependent.

### 3. PIT fidelity

**UNKNOWN.** NSE data products are point-in-time for current data but do not document
explicit PIT (point-in-time) fidelity — i.e., the ability to reconstruct what data looked
like at a specific past instant, with restatement tracking and vintage-aware snapshots.
Bhavcopy files are daily snapshots, not PIT-versioned.

### 4. Revision fidelity

**UNKNOWN.** NSE does not document explicit revision-tracking or vintage-aware data.
Corrections to historical data are not versioned. No restatement/vintage capability
declaration is available.

### 5. Corporate actions

| Aspect | Evidence |
|---|---|
| Corporate announcements | NSE publishes all exchange filings |
| Ex-dates | Published for dividends, bonus shares, stock splits, buybacks, rights issues |
| Adjustment factors | Available for price adjustments |
| Calendar feed | Available via authorized vendors |

**Assessment:** **COVERED** for NSE-listed securities.

### 6. Identity inputs (FIGI/OpenFIGI)

**PARTIAL — evidence limited.** NSE primarily uses:
- **NSE symbols** (exchange-specific tickers)
- **ISIN** (International Securities Identification Number) — widely used for Indian securities
- **Scrip codes** (numeric identifiers)

Whether NSE data feeds include **FIGI** (Financial Instrument Global Identifier) is not
confirmed by available evidence. FIGI mapping would need to be performed separately via
OpenFIGI. NSE ISIN data provides a reliable join key for FIGI mapping.

### 7. Determinism

**UNKNOWN.** Whether NSE data feeds provide explicit determinism guarantees (identical
inputs → identical outputs across executions) is not documented in available evidence.
Exchange-direct feeds are typically deterministic by nature but no formal declaration exists.

### 8. Quality attribution

**UNKNOWN.** NSE does not provide explicit quality/completenessPct metadata with its data.
Quality is implicit (exchange data is authoritative for NSE-listed securities) but not
explicitly attributed per the P01 quality vocabulary.

### 9. Latency / freshness

| Aspect | Evidence |
|---|---|
| Real-time (authorized vendor) | ~1 second (L1 frequency) |
| Exchange-direct feed | Lower latency (multicast/TCP; exact latency not publicly specified) |
| Delayed data | 15-minute delayed available via some vendors |
| End-of-day | Bhavcopy published after market close |

**Assessment:** **COVERED** — latency characteristics are partially documented.

### 10. Licensing / entitlement

| Aspect | Evidence |
|---|---|
| Licensing model | Formal data vending agreement with NSE required |
| Access model | Authorized vendor (GFDL/DotEx, TrueData) or direct exchange agreement |
| Per-user fees | Applicable (e.g., ₹360/user/month for NSE CM/FO; first 300 users waived) |
| Redistribution | Requires separate redistribution agreement with NSE |
| Annual cost (real-time) | ~₹20 lakh/year per exchange segment (publicly cited) |

**Assessment:** **COVERED** — licensing model is documented but commercial terms require
formal negotiation.

### 11. Limitations

| Limitation | Evidence |
|---|---|
| Geographic scope | Indian market only (NSE-listed securities) |
| Domain gaps | D07 (analyst estimates), D08 (macro), D09 (alt data) NOT covered |
| No global coverage | Non-Indian securities not available |
| Vendor dependency | Real-time data requires authorized vendor or direct exchange agreement |
| Regulatory constraints | SEBI data distribution regulations apply |

**Assessment:** **COVERED** — limitations are well-documented.

### 12. Cost

**UNKNOWN — DEP-P02-06.** While some pricing information is publicly available (~₹20
lakh/year per exchange segment for real-time; per-user fees), the full commercial
structure (volume discounts, enterprise agreements, multi-segment bundles) is not
publicly documented and requires formal negotiation with NSE. No commercial authority
exists in this program. Per SR-2, this dimension is NOT scored as satisfactory.

### 13. Fallback suitability

**PARTIAL.** For Indian equity securities:
- **BSE (Bombay Stock Exchange)** serves as a natural fallback for dual-listed securities
- NSE and BSE have overlapping listings for major Indian companies
- However, NSE data is authoritative for NSE-listed instruments

For non-Indian securities: NSE is not applicable, so fallback is irrelevant.

**Assessment:** **PARTIAL** — BSE fallback exists for dual-listed Indian securities.

## Rubric summary

| # | Dimension | Status |
|---|---|---|
| 1 | Coverage (D01-D10) | ⚠ PARTIAL — 7 of 10 domains covered (D07/D08/D09 NOT covered) |
| 2 | Granularity & history | ✅ COVERED |
| 3 | PIT fidelity | UNKNOWN |
| 4 | Revision fidelity | UNKNOWN |
| 5 | Corporate actions | ✅ COVERED |
| 6 | Identity inputs (FIGI) | ⚠ PARTIAL — ISIN available; FIGI mapping needed |
| 7 | Determinism | UNKNOWN |
| 8 | Quality attribution | UNKNOWN |
| 9 | Latency / freshness | ✅ COVERED |
| 10 | Licensing / entitlement | ✅ COVERED (formal agreement required) |
| 11 | Limitations | ✅ COVERED (well-documented) |
| 12 | Cost | UNKNOWN (DEP-P02-06) |
| 13 | Fallback suitability | ⚠ PARTIAL (BSE for dual-listed Indian securities) |

**4 dimensions COVERED, 3 PARTIAL, 5 UNKNOWN, 1 UNKNOWN (cost).**

Per SR-2, UNKNOWN dimensions are not scored as satisfactory. The selection is valid
as a provider-selection authority act but the rubric evaluation is incomplete.

## Residual conditions

| Condition | Impact on O-3 |
|---|---|
| 5 UNKNOWN dimensions | Rubric evaluation incomplete; does not prevent selection but records gaps |
| Cost UNKNOWN (DEP-P02-06) | Commercial terms require formal negotiation |
| D07/D08/D09 not covered | P07-03 scope for these domains requires additional provider(s) |
| FIGI mapping needed | OI-09 resolved; mapping implementation is P07-03 work |
| NSE licensing required | Formal data vending agreement must be executed before live integration |
| Indian market only | Non-Indian securities require additional provider(s) |

None of these conditions prevent the provider-selection authority act from completing.
They are recorded as implementation constraints for P07-03 and downstream phases.

## Selection decision

The **Program Authority** hereby selects **National Stock Exchange of India (NSE)** as
the data provider for P07-03 provider reconciliation, with scope **all IIPS domains
D01–D10** (noting that NSE coverage is partial — 7 of 10 domains).

This selection:
- ✅ Satisfies the P07-03 entry criterion *"Providers selected"*
- ✅ Uses the P02-03 rubric for evaluation (13 dimensions assessed)
- ✅ Records UNKNOWN for unevidenced dimensions (SR-2 compliance)
- ✅ Is provider-neutral in the policy sense (no provider-specific behavior in P07-03 policy)
- ⚠ Does NOT cover D07/D08/D09 (additional providers may be needed)
- ⚠ Does NOT authorize live integration, credential provisioning, or execution

## Gate distinction

This act establishes **provider selection only**. It does NOT:

- ⛔ Implement P07-03
- ⛔ Authorize live provider integration or execution
- ⛔ Provision credentials or entitlements
- ⛔ Grant P07 overall acceptance
- ⛔ Certify P07
- ⛔ Authorize production activation
- ⛔ Modify P01, P07-01, P07-02, or P07-04

## Authoritative state after this act

| Item | State |
|---|---|
| O-3 A-role | ✅ DESIGNATED — Program Authority (Act A, `8db3537`) |
| O-3 provider selection | ✅ **RESOLVED — NSE selected** (this act) |
| OI-09 | ✅ RESOLVED — FIGI/OpenFIGI |
| O-2 resolution policy | ✅ RESOLVED (Act C, `2006814`) |
| P07-03 entry criterion *"Providers selected"* | ✅ **SATISFIED** |
| P07-03 implementation | ⛔ **NOT IMPLEMENTED** |
| P07 overall acceptance | ⛔ **NOT ESTABLISHED** |
| P07 certification | ⛔ **NONE GRANTED** |
| Production activation | ⛔ **NOT AUTHORIZED** |
| Act 6 | 🔴 **OPEN — NO OWNER ASSIGNED** |
| P01 | unchanged, MUST NOT be modified |

## Next act

With O-2 resolved and O-3 resolved, **P07-03's entry criterion is satisfied** and its
exit-criterion blocker (O-2/DC-7) is resolved. P07-03 implementation may now be
considered under the existing P07 implementation authorization (`c91690b`).

The next act is: **P07-03 implementation** — subject to Program Authority authorization
to begin implementation work.
