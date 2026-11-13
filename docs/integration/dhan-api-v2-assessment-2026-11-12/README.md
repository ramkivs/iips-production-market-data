# Dhan API v2 — Comprehensive Capability Assessment (IPD)

**Status:** ASSESSMENT ONLY — no implementation authority conferred.
**Assessment date:** 2026-11-12
**Subject repository:** `ramkivs/iips-production-market-data`
**Subject commit (baseline):** `c260a8222661519c317183dc62c501d1b7a4cdae`
**Reference document set:** branch `docs/dhan-api-v2-reference-library`, commit
`27c75cfb842ac971b4178c0e9c162946bac62983`, directory `docs/vendor/dhan/api-v2/2026-11-13/`.
**Collection date of the reference set:** 13 November 2026 (per that directory's `README.md`).

---

## Scope and authority

This package assesses **nine officially supplied Dhan API v2 reference PDFs** against the existing
IIPS Production Market Data (IPD) implementation, its canonical contracts, and its roadmap position.

It is **documentation only**. It does not change code, runtime behaviour, canonical contracts,
persistence, credentials, configuration or deployments. It makes **no Dhan API call of any kind**.
It does not alter W-06 status, does not consume the one remaining authorized quote request, and
confers **no implementation authority**. Every recommendation here is a proposal for a future,
separately authorized decision.

**Documented capability is not account entitlement.** Nothing in this package establishes that any
account is subscribed to any Dhan product, that any endpoint is reachable, or that production access
exists. See §10 (`10-DEPENDENCY-AND-EXTERNAL-BLOCKER-REGISTER.md`).

---

## Published evidence set (nine documents, 49 pages)

| ID | File | Pages | Primary scope |
|---|---|---|---|
| P1 | `Dhan_DHAN_ANNEX.pdf` | 15 | Enumerations, feed codes, error tables, analytics/company enums |
| P2 | `Dhan_Historical_Data.pdf` | 2 | Historical candle endpoints |
| P3 | `Dhan_Data_API_OHLC.pdf` | 3 | OHLC snapshot endpoint + response schema |
| P4 | `Dhan_Market_Quote.pdf` | 2 | LTP / OHLC / Quote endpoint index |
| P5 | `Dhan_Live_Market_Feed.pdf` | 8 | WebSocket live feed binary packets |
| P6 | `Dhan_MARKET_DEPTH.pdf` | 8 | WebSocket 20-level and 200-level depth |
| P7 | `Dhan_MARKET_ANALYTICS.pdf` | 3 | Technical / company-info / market-movers index |
| P8 | `Dhan_Rate_Limits.pdf` | 3 | Consolidated rate-limit table |
| P9 | `Dhan_Instruments_Guide.pdf` | 5 | Instrument master CSV + column dictionary |

All nine PDFs were read **in full**, including tables, byte-offset packet structures and enumerations.
All nine SHA-256 digests were independently recomputed and match the published `SHA256SUMS.txt`
(see §2 for the digests).

---

## The thirteen deliverables

| # | Document | Question it answers |
|---|---|---|
| 1 | [`00-EXECUTIVE-ASSESSMENT.md`](00-EXECUTIVE-ASSESSMENT.md) | What is the overall verdict, and the five findings that drive it? |
| 2 | [`01-NINE-DOCUMENT-COVERAGE-AND-EVIDENCE-REGISTER.md`](01-NINE-DOCUMENT-COVERAGE-AND-EVIDENCE-REGISTER.md) | What exactly does each document contain, and where is the evidence? |
| 3 | [`02-DHAN-API-CAPABILITY-MATRIX.md`](02-DHAN-API-CAPABILITY-MATRIX.md) | Which capabilities are documented, in what depth (A–H)? |
| 4 | [`03-EXISTING-IPD-IMPLEMENTATION-MAPPING.md`](03-EXISTING-IPD-IMPLEMENTATION-MAPPING.md) | What does IPD actually implement, with file/symbol/test evidence? |
| 5 | [`04-CANONICAL-CONTRACT-COMPATIBILITY-ASSESSMENT.md`](04-CANONICAL-CONTRACT-COMPATIBILITY-ASSESSMENT.md) | Does Dhan's data fit D01/D02/D03/D05/D06 unchanged? |
| 6 | [`05-DOCUMENTATION-DISCREPANCY-AND-AMBIGUITY-REGISTER.md`](05-DOCUMENTATION-DISCREPANCY-AND-AMBIGUITY-REGISTER.md) | Where do the documents contradict themselves or each other? |
| 7 | [`06-OPERATIONAL-LIMITS-AND-ERROR-TAXONOMY.md`](06-OPERATIONAL-LIMITS-AND-ERROR-TAXONOMY.md) | What are the real limits, and how many error vocabularies exist? |
| 8 | [`07-IIPS-CONSUMER-CAPABILITY-MAPPING.md`](07-IIPS-CONSUMER-CAPABILITY-MAPPING.md) | What can each IIPS consumer actually rely on? |
| 9 | [`08-SECURITY-RELIABILITY-DATA-QUALITY-CONSIDERATIONS.md`](08-SECURITY-RELIABILITY-DATA-QUALITY-CONSIDERATIONS.md) | What security, reliability and data-quality risks exist? |
| 10 | [`09-IMPLEMENTATION-GAP-REGISTER.md`](09-IMPLEMENTATION-GAP-REGISTER.md) | What is missing, at what severity, with what validation criteria? |
| 11 | [`10-DEPENDENCY-AND-EXTERNAL-BLOCKER-REGISTER.md`](10-DEPENDENCY-AND-EXTERNAL-BLOCKER-REGISTER.md) | What is blocked externally, and by whom? |
| 12 | [`11-PRIORITIZED-RECOMMENDATIONS.md`](11-PRIORITIZED-RECOMMENDATIONS.md) | What should be done, in what order, and what is out of scope? |
| 13 | [`12-EVIDENCE-BASED-CONCLUSION-AND-READINESS-ASSESSMENT.md`](12-EVIDENCE-BASED-CONCLUSION-AND-READINESS-ASSESSMENT.md) | Is IPD ready, and for what precisely? |

---

## Classification vocabulary used throughout

Every material claim carries one of these, plus an evidence citation:

| Classification | Meaning |
|---|---|
| `DOCUMENTED` | Stated in one of the nine PDFs (filename + page cited) |
| `IMPLEMENTED` | Present in IPD with file/symbol evidence **and** test coverage |
| `PARTIALLY_IMPLEMENTED` | Some real code exists; a material part of the capability is absent |
| `MISSING` | No implementation evidence |
| `UNCERTAIN` | Evidence is absent, contradictory, or externalised outside the published set |
| `EXTERNALLY_BLOCKED` | Progress requires an action outside this repository's authority |

`DOCUMENTED` and `IMPLEMENTED` are **independent axes**. A documented capability is very often
`MISSING` in IPD, and a few IPD behaviours are `IMPLEMENTED` without being `DOCUMENTED`.

---

## Evidence discipline

- **Vendor citations** are `P<n> p.<page>`. Page numbers are 1-based within each PDF.
- **Code citations** are `path:symbol` and, where useful, `path:line`.
- **Test citations** are the test file plus case ID (e.g. `W06C-12`, `D3D-01`).
- Where a document **delegates** a table to a URL that is not in the published set (e.g. "disconnection
  message code description *here*"), that is recorded as `UNCERTAIN` — not filled in from memory,
  not silently reconciled.
- Contradictions are **recorded, not resolved**. §6 is the register; no interpretation in this package
  depends on silently preferring one conflicting statement over another.

---

## Baseline integrity statements

| Assertion | Value |
|---|---|
| Assessment baseline commit | `c260a8222661519c317183dc62c501d1b7a4cdae` |
| TypeScript build at baseline (`npx tsc`) | exit 0 |
| Full test suite at baseline (`npm test`) | 1712 executed, 1708 passed, 0 failed, 4 skipped |
| Implementation files changed by this package | **none** (documentation only) |
| Dhan API calls made by this package | **none** |
| W-06 root cause | unchanged: `EXTERNAL_BLOCKER — DHAN_DATA_API_SUBSCRIPTION_INACTIVE` |
| Remaining authorized quote requests | **1, unconsumed** |
| PR #156 | unchanged; must remain OPEN / MERGEABLE / UNMERGED |

The 4 skipped tests are pre-existing skips at baseline, unrelated to this package.
