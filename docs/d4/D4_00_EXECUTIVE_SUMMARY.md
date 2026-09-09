# D4 — Integration/Reuse Baseline + Contract Delta Specification

**Document type:** SPECIFICATION ONLY — NOT AN IMPLEMENTATION AUTHORIZATION
**Program:** IIPS Production Market Data & Intelligence Ingestion Program v1.0
**Repository:** `iips-production-market-data` @ `eae2ff6` (branch `arena/01a0814b-iips-production-market-data`)
**Existing-IIPS evidence baseline:** `ramkivs/iips-review-recovered` @ `5decdca` (authoritative per AD-15; READ-ONLY, NOT MODIFIED)
**Authority baseline:** G-A Integration Baseline Authority Gate (PARTIALLY COMPLETE)
**Evidence baseline:** D1 → D2 → D3 reconciliation
**Date:** 2026-09-08

> **Status:** This package is a specification. It does not authorize implementation, does not
> certify anything, does not accept any phase gate, and does not modify the existing IIPS
> product. Formal phase acceptance remains impossible because gate acceptors are UNKNOWN.

---

## A. D4 Executive Summary

### A.1 What D4 establishes

D4 converts the G-A authority decisions into an implementable — but **not yet implemented** —
contract specification. It answers, at contract level:

> *How exactly does the new production data plane deliver governed market and intelligence
> data into the existing certified IIPS product, without changing the certified engine
> methodology, without creating a second ingress, and without silently altering identity,
> lineage or certification?*

The answer, in one line:

> **Market data enters through the existing `MarketDataSource<T>` → `DataSnapshot<T>` →
> `DataBoundRequest` → `DataBoundExecutor` boundary; canonical instrument identity maps to
> the certified `companyId` through an explicit governed adapter; and data vintage
> (`provider` + `dataVersion` + `asOf`) is carried into replay lineage through an explicit
> dual-layer snapshot linkage.**

### A.2 The five decisive specification findings

**1 — The ingress contract already exists and is sufficient in shape.**
`iips-platform/src/distributed/LiveDataRuntime.ts` already defines `DataSourceMeta`,
`DataSnapshot<T>`, `MarketDataSource<T>`, `DataBoundRequest` and `DataBoundExecutor`, and
already encodes the program's governing invariant verbatim. The required delta is
**additive and small**: lineage fields, PIT/as-of acquisition semantics, degraded-state
semantics, provider adapters, and production wiring. **No new ingress type is introduced.**
(Part 4.)

**2 — The field-collision risk is materially worse than D3 estimated, and it is quantified here.**
D3 assumed engine inputs were uniformly coded (`BM-*`, `IM-*`, `CM-*`). Direct inspection of
`PROGRAM_v1.1_REPLAY_BASELINE.json` shows the input namespace is **split**:

| Input key style | Count | Engines |
|---|---|---|
| Coded (`BM-`, `IM-`, `CM-`, `HC-`, `TL-`, `AU-`, `MM-`) | **52 keys** | 7 engines |
| **Free-form camelCase** | **54 keys** | **6 engines** (Hospitality, Energy, Utilities, Consumer, Industrials, Technology) |

Thirteen free-form keys are already shared across multiple engines — `id` (6), `ebitdaMargin` (6),
`debtEbitda` (6), `revenueGrowth` (5), `fcfYield` (4), `segment` (3), `peRatio` (2), `evEbitda` (2),
`roic`, `roce`, `subsegment`, `archetype`, `businessModel`.

Critically, several free-form keys are **price-derived valuation metrics** — `peRatio`,
`evEbitda`, `evRevenue`, `fcfYield` — precisely the fields a market-data plane will supply.
Under the current flat merge (`{ ...data.fields, ...companyInputs }`) a market-data `peRatio`
would be **silently overwritten** by `companyInputs`, with no error and no lineage record.
This is a direct NFR-04 violation and it is **live today**, not hypothetical. It is the single
strongest justification for AD-16. (Parts 5, 8.)

**3 — `companyId` is not an entity identifier at all; it is a sector label.**
Every observed value is `` `${sector}-H1` `` (`Technology-H1`, `Banking-H1`), and
`GET /api/company/:id` is **keyed by sector, not by company**
(`executive-transport.ts:639`). The existing product therefore has **no company-level
identity** whatsoever — one synthetic holding per sector. This makes the AD-1 adapter both
simpler and more necessary than expected: there is no legacy identifier space to reconcile,
only a synthetic placeholder to map through. It also means real multi-company data is a
**cardinality change** (1 holding/sector → N holdings/sector), which is a product-behaviour
change requiring explicit authority. (Part 6, Open Issue OI-08.)

**4 — The product plane already has the right provenance vocabulary, but populates it with literals.**
`ExecutiveProvenance` already declares
`freshness: 'LIVE' | 'SNAPSHOT' | 'STALE' | 'UNAVAILABLE' | 'REPLAY'` — an exact match for
NFR-03/NFR-09 requirements. But `dataSource`, `freshness` and `calibratedAt` are populated
with **hand-written string literals** (`admin-transport.ts:382,390,423`), `confidence` is
hard-coded `0.8` (`executive-transport.ts:174`), and golden pillars are read from frozen
expected-output files rather than computed. The DTO shape is reusable; the **values are not
lineage**. P13 must replace literals with derived provenance — that is EXTEND work, not REUSE. (Parts 10, 11.)

**5 — All 13 engines are the certified target scope, but none can be relied upon until M-1 is repaired.**
AD-8 supersedes D3: IES-016/017/020 are certified via the additive 13-engine E2E-030 delta.
AD-4 nonetheless requires revalidation of the whole set, because the replay and
constitutional-guard suites do not execute at HEAD. **M-1 is external to this program (AD-10).**
Every engine, every certification and every P15 activity inherits this dependency. (Parts 8, 11.)

### A.3 Scope, corrected

| Dimension | Original tracker | D4 specification | Basis |
|---|---|---|---|
| INT rows | 18 | **22** (3 splits + 1 D05 row) | AD-14 |
| UI surfaces | 14 | **19** | AD-13 |
| UI dispositions | 11 × "REUSE UI / INTEGRATE DATA" | 3 REUSE · 3 ADAPT · 4 EXTEND · 6 NEW · 3 REUSE(+5 new surfaces) | AD-14 / D3 |
| Certified engines | unstated | **13** | AD-8 |
| Ingress contracts | unstated | **exactly 1** (existing) | AD-2 |
| "G2" | P12-02 deliverable | **retired** | AD-12 |

### A.4 What remains unresolved (visibly, by design)

Nothing below has been assumed away or silently converted into a decision:

- **UNKNOWN:** security/identity authority · new-program certification authority ·
  P00–P17 gate acceptors · P16 production activation authority
- **PENDING Ramki/Sai ADR:** AD-3 (snapshot/replay identity extension) · AD-16
  (`DataBoundExecutor` namespace + collision)
- **UNRESOLVED:** AD-17 (`ReplayService` literal-return semantics vs NFR-02)
- **EXTERNAL:** M-1 repair + E2E revalidation (existing-IIPS program)
- **DOCUMENTATION GAP:** missing `IES016/017/020_FINAL_READINESS_CERTIFICATE.md` files
- **HISTORICAL EVIDENCE GAP:** `G:\IIPS\BACKUPS` (SHA-256 `23b4b402…`, ~1,700 entries)

### A.5 Consequence for sequencing

- **Specification-ready now:** P00, P01, P02, P04, P05, P06, P07, P08, P09, P10, P11, P12, P13, P14
- **Implementation-ready after ADRs:** P01, P04, P05, P11 (AD-3 + AD-16 sign-off)
- **Blocked on authority:** P03 (security/identity), P16 (activation)
- **Blocked externally:** P15 (M-1 + revalidation)
- **Formal acceptance of ANY phase:** **blocked** — gate acceptors UNKNOWN

---

## Package contents

| File | Part(s) | Content |
|---|---|---|
| `D4_00_EXECUTIVE_SUMMARY.md` | A | This document |
| `D4_01_INTEGRATION_REUSE_BASELINE.md` | B, C | Definitive INT-001…INT-018 + splits + D05 row |
| `D4_02_DATA_DOMAINS.md` | D | D01–D10 disposition and integration model |
| `D4_03_UI_BASELINE.md` | E | UI01–UI19 integration matrix |
| `D4_04_INGRESS_CONTRACT_DELTA.md` | F | Canonical `DataSnapshot<T>` ingress contract delta |
| `D4_05_SECURITY_MASTER_ADAPTER.md` | G | P04 security master + `companyId` adapter |
| `D4_06_SNAPSHOT_REPLAY_IDENTITY.md` | H | AD-3 + AD-6 dual-layer lineage linkage |
| `D4_07_FIELD_NAMESPACE.md` | I | AD-16 namespace + collision specification |
| `D4_08_ENGINE_INTEGRATION.md` | J | 13-engine integration specification |
| `D4_09_P12_CONTRACT_DELTA.md` | K | P12 API/DTO delta (G2 retired) |
| `D4_10_P13_UI_DELTA.md` | L | P13 UI data-integration delta |
| `D4_11_CERTIFICATION_MATRIX.md` | M | Certification/revalidation impact matrix |
| `D4_12_PHASE_SEQUENCE.md` | N | P00–P17 dependency sequence |
| `D4_13_TRACKER_CORRECTIONS.md` | O | Tracker correction specification (NOT applied) |
| `D4_14_AUTHORITY_ADR_REGISTER.md` | P, Q | ADR/authority register + open issues |
| `D4_15_ACCEPTANCE_READINESS.md` | R | D4 acceptance-readiness checklist + integrity report |

---

## Mandatory design principles — conformance statement

| Principle | Conformance |
|---|---|
| Reuse before rebuild | 7 REUSE + 4 ADAPT + 4 EXTEND vs 4 NEW at INT level |
| Conform to existing frozen contracts | All deltas additive to existing types |
| No second market-data ingress | Exactly one ingress path specified (Part 4) |
| Immutable versioned DataSnapshot boundary | Preserved; `Object.freeze` retained |
| No mutable live state consumed by engines | Enforced via `DataBoundExecutor` sole path |
| Preserve certified CSIP boundary | `NormalizedHolding` untouched (Part 6) |
| Canonical identity maps explicitly to companyId | Governed adapter, versioned + evidenced |
| No silent field collision/coercion | Explicit fail-closed collision rule (Part 5) |
| Data vintage participates in replay lineage | AD-3 linkage specified (Part 7) |
| Distinguish input vs result snapshot IDs | `data-*` vs `SNAP_*` preserved (Part 7) |
| No synthesized value masquerading as provenance | Literals classified + flagged (Part 10) |
| No methodology changes | Zero engine/scoring/calibration/taxonomy change |
| No certification claims | None made |
| No existing-IIPS repair | M-1/M-2/M-6 untouched |
| No silent scope reduction | Scope increased and recorded (A.3) |
| 13-engine certified target scope | Part 8 |
| 19 UI surfaces in scope | Part 3 |
| Unresolved authority visibly unresolved | Part 14 |
