# D4 Part G — Security Master (P04) + `companyId` Adapter Specification

**SPECIFICATION ONLY — NO IMPLEMENTATION.**
**Authority:** AD-1 **ADAPTER MODEL**.

> **AD-1 as recorded:** P04 builds the canonical security master. Canonical identity maps
> through an explicit governed adapter to the existing `companyId`. **The certified CSIP
> boundary is NOT modified.** P04 is **not** authorized as product-wide authoritative identity;
> any future attempt to make it so requires a **new ADR**.

---

## G.1 Evidence baseline

| Finding | Evidence |
|---|---|
| No security master, instrument, listing or exchange model | `grep -i "isin\|figi\|cusip\|ticker\|exchange\|listing\|securitymaster\|instrumentmaster"` across all `.ts`/`.tsx` → **0 hits** |
| Sole identifier is a bare string | `companyId: string` — `cross-sector/types.ts:7`, `api/company.ts:10`, `api/portfolio.ts:9`, `api/executive.ts:28`, `api/decisionMatrix.ts:10` |
| **Values are sector labels, not entity IDs** | `` `${s.sector}-H1` `` — `executive-transport.ts:170,307,478`; observed `Technology-H1`, `Banking-H1`, `A-H1` |
| **The company endpoint is keyed by sector** | `executive-transport.ts:639` — `/api/company/${sector}` |
| `companyId` is the certified CSIP join key | `NormalizedHolding.companyId` consumed by `OntologyMapper`, `RankingEngine`, `OpportunityEngine`, `CrossSectorEvidence` |

**Consequence:** there is **no legacy company-identity space to migrate**. The existing value
is a synthetic placeholder. This makes the adapter simpler than a classic identifier
migration — and makes the cardinality change (G.7) the real risk.

---

## G.2 Canonical security/instrument model (data-plane authoritative)

Specified as required attributes. **No external identifier standard is assumed authoritative** —
the SPEC does not authorize one, so standard selection is an open decision (**OI-09**).

### Instrument / security entity

| Attribute | Requirement | Notes |
|---|---|---|
| Canonical security ID | **Required, immutable, unique** | Program-internal. Never a provider ID, never a vendor symbol |
| Instrument type | Required | Equity, depositary receipt, fund, index, etc. |
| Primary listing reference | Required where applicable | → listing entity |
| Currency | Required | Trading/quotation currency |
| Lifecycle status | Required | Active, suspended, delisted, merged, superseded |
| Effective dates | Required | `validFrom` / `validTo` — every attribute is time-bounded |
| Aliases | Required | Prior symbols, prior identifiers, with effective dates |
| Source / provider | Required | Which provider asserted this identity |
| Mapping provenance | Required | How the record was derived/reconciled |
| Tenant / region / governance | Required where applicable | Per `DataGovernanceRuntime` classification |

### Issuer / company entity

| Attribute | Requirement |
|---|---|
| Canonical issuer ID | Required, immutable, unique |
| Issuer↔instrument relationship | Required, cardinality-aware (one issuer → many instruments) |
| Sector classification | Required — **must reconcile with existing engine sector taxonomy** (see G.6) |
| Lifecycle + effective dates | Required |

### Listing entity

| Attribute | Requirement |
|---|---|
| Canonical listing ID | Required |
| Instrument reference | Required |
| Exchange/venue reference | Required (→ D10) |
| Local ticker/symbol | Required — **explicitly NOT an authoritative identifier** |
| Trading currency, status, effective dates | Required |

### External identifiers

| Attribute | Requirement |
|---|---|
| Identifier set | ISIN / FIGI / CUSIP / vendor IDs **as approved** |
| Per-identifier attributes | Type, value, source, effective dates, confidence |
| **Authority** | ⚠ **No standard is assumed authoritative.** SPEC does not authorize one → **OI-09**, requires a decision |

### Uniqueness constraints

1. Canonical security ID unique and immutable for life.
2. (identifier-type, value) unique **within an effective-date window** — identifiers are reissued over time, so uniqueness is time-bounded.
3. (venue, local symbol) unique within an effective-date window.
4. Reuse of a retired symbol by a different instrument must **not** collide — a violation is a hard error, never silent reassignment.

---

## G.3 The governed identity adapter

```
canonical security identity   (data-plane authoritative)
            │
            ▼
   governed identity mapping   ← explicit · versioned · auditable · evidenced
            │
            ▼
      existing companyId       (certified-boundary authoritative, UNCHANGED)
            │
            ▼
   certified CSIP / engines    (NormalizedHolding.companyId — UNTOUCHED)
```

### Mandatory adapter properties

| Property | Requirement |
|---|---|
| **Explicit** | Every mapping is a stored, inspectable record. **No inference, no string munging, no convention-based derivation** |
| **No silent coercion** | An unmapped canonical identity **must fail explicitly**. It must never be silently coerced into a `companyId`-shaped string |
| **Auditable** | Every mapping create/update/retire is audit-logged with actor, timestamp, reason |
| **Versioned** | The mapping set is versioned; an execution records which mapping version it used |
| **Evidenced** | Mapping version participates in execution lineage (Part 7), so a replay resolves identity the same way |
| **Bidirectional** | canonical → `companyId` for engine/CSIP input; `companyId` → canonical for UI resolution and drill-through |
| **Time-aware** | Mappings are effective-dated; a PIT query resolves identity **as of** its as-of boundary |
| **Cardinality-explicit** | Today 1 `companyId` per sector. Real data implies many instruments per sector → the mapping must state its cardinality rule explicitly (**OI-08**) |

### Mapping record — required attributes

canonical security ID · canonical issuer ID · target `companyId` · mapping version ·
effective from/to · mapping method (how derived) · source/provider · confidence ·
approval/authority reference · audit reference

---

## G.4 CSIP boundary preservation

**Untouched, verbatim:**

```ts
export interface NormalizedHolding {
  readonly companyId: string;   // ← certified join key, UNCHANGED
  readonly sector: string;
  readonly conviction: number;
  // ... unchanged
}
```

**Guarantees:**

1. `NormalizedHolding` shape unchanged — no field added, removed or retyped.
2. `companyId` remains a plain `string` at the CSIP boundary.
3. CSIP receives `companyId` values **produced by the adapter**, semantically consistent with today's.
4. `OntologyMapper`, `RankingEngine`, `OpportunityEngine`, `CrossSectorEvidence` unchanged.
5. **No CSIP revalidation is triggered by the identity model itself** — this is the core benefit of AD-1's adapter choice over making P04 authoritative.

**Prohibited:** changing `companyId` type/semantics at the CSIP boundary; passing canonical
IDs directly into CSIP; adding identity fields to `NormalizedHolding`. Each would modify a
certified contract and require a new ADR.

---

## G.5 Migration / adapter strategy

**No data migration is required.** Existing `companyId` values are synthetic
(`` `${sector}-H1` ``), not production data.

| Step | Nature |
|---|---|
| 1 | Establish canonical master (**NEW**, P04) |
| 2 | Establish governed mapping (**NEW**, P04) |
| 3 | Preserve existing synthetic `companyId` values as valid mapping targets during transition |
| 4 | Route market data → engines with `companyId` supplied by the adapter |
| 5 | Resolve UI identity (UI02, UI13) through the adapter |
| 6 | **No cutover event** — additive; existing behaviour intact until data is wired |

**Rollback:** removing the adapter reverts to existing synthetic identity. No certified
artifact is mutated, so rollback is clean.

---

## G.6 Sector taxonomy reconciliation

Existing sector taxonomy is **certified and frozen**: `IT → IES-015 Technology`,
`Chemicals → IES-014 Industrials`, `Realty/Real Estate → IES-015 Technology`, enforced by
`assertNotTaxonomyResolved → 422` (`EngineRegistry.ts:42-49`).

**Rule:** canonical issuer sector classification must **map onto** the existing certified
taxonomy. It must **not** redefine it. Any mismatch is an explicit mapping decision with
evidence — **never a silent reclassification**, which would be a methodology change
(SPEC ¶132/133, Ramki/Sai authority).

---

## G.7 ⚠ Cardinality change — OI-08

Today: **one synthetic holding per sector** (13 holdings), `/api/company/:id` keyed by sector.
With real data: **many companies per sector**.

This affects: `/api/company/:id` semantics · portfolio holdings cardinality ·
CSIP `holdings` count (tests assert `holdings 10` / `holdings 13`) · UI02 routing ·
UI13 search result space.

**This is a product-behaviour change, not merely a data change.** It is recorded as
**OI-08** and requires explicit authority. It is **not** assumed or decided here.

---

## G.8 Validation requirements

| Area | Validation |
|---|---|
| Uniqueness | Canonical ID uniqueness/immutability; time-bounded identifier uniqueness; symbol-reuse non-collision |
| Mapping provenance | Every mapping traceable to source, method, version, approval |
| Lifecycle | Delisting, merger, symbol change, supersession correctness |
| PIT identity | As-of identity resolution correct at historical boundaries |
| **CSIP non-regression** | `NormalizedHolding` shape unchanged; CSIP outputs unchanged for equivalent inputs |
| Fail-closed | Unmapped identity raises an explicit error; **no silent coercion** |
| Taxonomy | Canonical sector maps to certified taxonomy without redefinition |
| Audit | Every mapping mutation audit-logged |

## G.9 Authority dependencies

| Item | Status |
|---|---|
| AD-1 adapter model | **RESOLVED — authorized** |
| P04 as product-wide authoritative identity | **NOT authorized** — new ADR required |
| External identifier standard (ISIN/FIGI/…) | **OI-09 — OPEN** |
| Cardinality change | **OI-08 — OPEN** |
| Sector taxonomy mapping conflicts | Methodology authority **Ramki/Sai** |
| Tenant/region governance attributes | Security/identity authority **UNKNOWN** |
