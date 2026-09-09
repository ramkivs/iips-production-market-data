# P00 — PROGRAM CHARTER

| Field | Value |
|---|---|
| **Work package** | WP-P00-01 — Governance Baseline Establishment |
| **Phase** | P00 — Governance |
| **Gate** | Scope/authority baseline — **NOT ACCEPTED** |
| **Authority basis** | Sai/Ramki approval of record, via `docs/d8/D8_EXECUTION_AUTHORIZATION.md` |
| **Type** | Governance / documentation. **No production market-data code.** |

---

## 1. Program scope

The IIPS Production Market Data Intelligence Program establishes a governed production
market-data plane that feeds the existing, certified IIPS intelligence platform with real
market data — **without modifying the certified engine, methodology or certification layers.**

The program is a **data plane and integration program**, not an intelligence-methodology
program.

---

## 2. Objectives

| # | Objective |
|---|---|
| O1 | Establish a canonical, provider-neutral market-data contract (P01) |
| O2 | Establish provider abstraction with explicit entitlement boundaries (P02) |
| O3 | Establish security, identity and tenancy for the data plane (P03) |
| O4 | Establish a canonical security master mapped by governed adapter to existing identity (P04) |
| O5 | Acquire, normalize and quality-gate market data deterministically (P05–P07) |
| O6 | Support historical and point-in-time semantics with reproducible replay (P08) |
| O7 | Deliver fundamentals, intelligence and event data domains (P09–P10) |
| O8 | Integrate governed data into the 13 certified engines **without changing them** (P11) |
| O9 | Expose governed data through certified APIs and existing product transports (P12) |
| O10 | Integrate 19 UI surfaces onto governed data with truthful provenance (P13–P14) |
| O11 | Certify provider-to-UI lineage end to end (P15) |
| O12 | Activate and operate production under explicit authority (P16–P17) |

---

## 3. In scope

- Canonical market-data contracts, schemas, identifiers, timestamps, units, currency.
- Provider adapters behind a provider-neutral boundary.
- Acquisition, normalization, quality classification, PIT/historical semantics.
- Security master and governed identity mapping (**adapter model**, §7).
- Data-plane governance, classification, lineage, evidence.
- Integration of governed data into existing certified engines via the approved ingress.
- Product API/DTO extension and UI data integration across 19 surfaces.
- New-program certification of the data plane and its integration path.

## 4. Out of scope

- Any change to the 13 certified engines' methodology, scoring, calibration or taxonomy.
- Any repair of existing-IIPS defects (M-1, M-2/AD-17, M-5, M-6).
- Any change to existing-IIPS certification artifacts.
- Any second market-data ingress contract.
- Any "G2" layer (retired — §9).
- Production activation absent explicit downstream authority.

---

## 5. Invariant — 13 certified engines

The certified target scope is **13 engines**, per G-A **AD-8**:

| IES | Engine | IES | Engine |
|---|---|---|---|
| IES-006 | Banking | IES-013 | Consumer |
| IES-007 | Insurance | IES-014 | Industrials |
| IES-008 | Capital Markets | IES-015 | Technology |
| IES-009 | Healthcare | IES-016 | Telecommunications |
| IES-010 | Hospitality | IES-017 | Automobile |
| IES-011 | Energy | IES-020 | Materials & Metals |
| IES-012 | Utilities | | |

**No engine may be treated as uncertified because an individual readiness-certificate file is
not locatable.** AD-8 governs. **No silent scope reduction is permitted.**

**Frozen methodologies preserved verbatim:** Telecom **D16 M1–M15** · Automobile **Option-A
left-to-right accumulation** (no `sum()`; triple `44ba/ea22/c8ed`) · Materials **G1–G6**
(`5813…`).

---

## 6. Invariant — 19 UI surfaces

All 19 remain in scope (AD-13 added UI15–UI19). **No silent scope reduction.**

| | | | |
|---|---|---|---|
| UI01 Dashboard | UI06 Decision Center | UI11 Administration | UI16 EvidenceExplorer |
| UI02 Company Workspace | UI07 Watchlists | UI12 Settings | UI17 ReplayExplorer |
| UI03 Portfolio | UI08 Reports | UI13 Global Search | UI18 EngineRegistry |
| UI04 Research | UI09 Alerts | UI14 Command Palette | UI19 AiAdvisory |
| UI05 Screener | UI10 Collaboration | UI15 CrossSectorIntelligence | |

---

## 7. Invariant — sole production market-data ingress

Per G-A **AD-2**, the **sole and mandatory** production market-data ingress boundary is:

```
MarketDataSource<T>  →  DataSnapshot<T>  →  DataBoundRequest
                     →  DataBoundExecutor  →  ExecutionRequest.inputs  →  13 certified engines
```

- `DataBoundExecutor` is the **sole engine-binding path**.
- `DataSnapshot<T>` is **immutable**.
- Provider adapters sit **behind** `MarketDataSource<T>`; provider identity is never exposed in
  product DTOs.
- **No second ingress contract may be created.**

---

## 8. Invariant — P04 adapter identity model

Per G-A **AD-1**:

```
canonical security master
        ↓  governed identity mapping — explicit · versioned · auditable · evidenced
existing companyId
        ↓
certified CSIP  (NormalizedHolding.companyId — UNTOUCHED)
```

- The certified CSIP boundary is **not modified**; `companyId` remains a plain `string`.
- P04 is **not** made a product-wide identity authority.
- Unmapped identities **fail explicitly**; no silent coercion.

---

## 9. Invariant — G2 retired

Per G-A **AD-12**, "G2" is retired. There is no G2 layer, interface, module or DTO family
("G2" has zero occurrences in the existing IIPS repository). The product-plane basis is
`EngineApiAdapter`, `EngineApiRequest`/`EngineApiResponse`, the existing product transports and
the typed frontend API clients.

---

## 10. Relationship to existing-IIPS artifacts

The existing-IIPS repository (`iips-review-recovered`, **AD-15 authoritative**) is a
**read-only dependency**.

| Interaction | Permitted? |
|---|---|
| Read and cite existing-IIPS artifacts as evidence | **YES** |
| Depend on existing-IIPS contracts and certified engines | **YES** |
| Extend the product plane additively (non-breaking) | **YES**, under approved ADRs |
| Modify existing-IIPS source, tests, methodology or certification | **NO** |
| Repair existing-IIPS defects | **NO** — existing-IIPS responsibility (AD-10) |

---

## 11. Explicit prohibition — existing-IIPS methodology and certification

> **This program must not modify existing-IIPS methodology or certification artifacts.**

Specifically prohibited: `iips-review-recovered` (any file) · existing-IIPS source and tests ·
any engine implementation · scoring, calibration or taxonomy artifacts · Auto Option-A ·
Materials G1–G6 · Telecom D16 · `LiveDataRuntime.ts` / `DataBoundExecutor` ·
`ReplayService` · existing certification artifacts · the E2E-030 certification document ·
`PROGRAM_v1.1_REPLAY_BASELINE.json`.

ADR-01 (collision guard, touching `DataBoundExecutor`) and ADR-02 (replay identity extension)
are **approved in principle** but are **P05/P06/P11 and P08 work respectively** — they are not
executed in P00 and remain subject to their own evidence and gates.

**Existing-IIPS defects remain open and unrepaired by this program:** M-1 · M-2/AD-17 · M-5 ·
M-6. **E2E-030 is NOT revoked and NOT renewed**; AD-4 requires revalidation.

---

## 12. Traceability

`docs/d4/D4_00`–`D4_15` (specification baseline, corrected by D4-B) ·
`docs/d5/` (ADR-01, ADR-02, E-01, E-02, register, dependency map) ·
`docs/d7/` (authority-hold record) · `docs/d8/` (authority reconciliation and authorization).
