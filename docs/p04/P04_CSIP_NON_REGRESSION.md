# P04 — CSIP NON-REGRESSION BOUNDARY

**SPECIFICATION ONLY.** Source of the guarantees: `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md` §G.4.
**This is the artifact that protects the certified boundary. Nothing in P04 may weaken it.**

---

## 1. The certified contract — quoted, untouched

From `D4_05` §G.4, reproduced verbatim as the frozen reference:

```ts
export interface NormalizedHolding {
  readonly companyId: string;   // ← certified join key, UNCHANGED
  readonly sector: string;
  readonly conviction: number;
  // ... unchanged
}
```

`NormalizedHolding.companyId` is the **certified CSIP join key**
(`iips-review-recovered` `cross-sector/types.ts:7`), consumed by `OntologyMapper`,
`RankingEngine`, `OpportunityEngine` and `CrossSectorEvidence`.

⚠ **This program does not modify `iips-review-recovered`.** The interface above is cited as
**read-only evidence**, not restated for amendment.

---

## 2. Guarantees — carried forward unchanged

| # | Guarantee (`D4_05` §G.4) |
|---|---|
| **CG-1** | `NormalizedHolding` shape unchanged — **no field added, removed or retyped** |
| **CG-2** | `companyId` remains a **plain `string`** at the CSIP boundary |
| **CG-3** | CSIP receives `companyId` values **produced by the adapter**, semantically consistent with today's |
| **CG-4** | `OntologyMapper`, `RankingEngine`, `OpportunityEngine`, `CrossSectorEvidence` **unchanged** |
| **CG-5** | ⚠ **No CSIP revalidation is triggered by the identity model itself** — *"the core benefit of AD-1's adapter choice over making P04 authoritative"* |

---

## 3. Prohibited — unchanged

| # | Prohibited (`D4_05` §G.4) |
|---|---|
| **CP-1** | Changing `companyId` **type or semantics** at the CSIP boundary |
| **CP-2** | Passing **canonical IDs directly** into CSIP |
| **CP-3** | Adding **identity fields** to `NormalizedHolding` |

> *"Each would modify a certified contract and require a new ADR."*

---

## 4. OI-08 (1:N) at the certified boundary — the critical reading

The authorized 1:N decision changes the **data plane**. It must not leak through the adapter.

| # | Rule |
|---|---|
| **NR-1** | ⚠ **`companyId` remains the CSIP join key at the existing boundary** — as stated in the authorized decision itself. **It is NOT redefined, NOT removed, NOT retyped** |
| **NR-2** | 1:N lives **entirely on the data-plane side** of the adapter. What crosses into CSIP is still a plain `string` `companyId` (CG-2) |
| **NR-3** | Many canonical securities projecting to one `companyId` is the **N:1 projection** (MC-2) — expected, and invisible to CSIP's contract |
| **NR-4** | ⚠ **`companyId` is NEVER reintroduced as a security identity.** It is a certified join key on the engine side; the security identity is the canonical security ID (**CS-4**). The two are never equated, aliased or substituted |
| **NR-5** | ⚠ **The synthetic `${sector}-H1` model is NOT propagated into the master** (**CD-4**). Existing synthetic values remain valid **mapping targets** during transition (`D4_05` §G.5 step 3) — targets, never entities |
| **NR-6** | **No data migration** is performed or required — existing values are synthetic placeholders, so this is an adapter problem, not a migration (`P01` ID-5) |
| **NR-7** | **Rollback is clean**: removing the adapter reverts to existing synthetic identity; no certified artifact is mutated (`D4_05` §G.5) |

### 4.1 ⚠ Downstream consequence — recorded, NOT resolved by P04

`D4_05` §G.7 records that real cardinality affects `/api/company/:id` semantics, portfolio
holdings cardinality, **CSIP `holdings` count (tests assert `holdings 10` / `holdings 13`)**,
UI02 routing and UI13 search space — *"a product-behaviour change, not merely a data change"*.

| # | Rule |
|---|---|
| **NR-8** | **OI-08 is RESOLVED as an identity-model decision (1:N).** Its **downstream product-behaviour consequences are NOT resolved by P04** and are **not** silently absorbed |
| **NR-9** | Those consequences belong to **P11** (engine integration; `D8_STATUS` lists OI-08 among P11's outstanding items), **P12** (APIs) and **P13** (UI02/UI13). Carried in `P04_DEPENDENCY_REGISTER.md` and `P04_OPEN_ITEMS.md` as **OI-P04-02** |
| **NR-10** | ⚠ **P04 does not modify, revalidate, waive or reinterpret any existing CSIP test.** The `holdings 10` / `holdings 13` assertions are **existing-IIPS artifacts**; P04 records the impact and touches nothing |

---

## 5. Sector taxonomy — map onto, never redefine

Per `D4_05` §G.6: the existing taxonomy is **certified and frozen** — `IT → IES-015 Technology`,
`Chemicals → IES-014 Industrials`, `Realty/Real Estate → IES-015 Technology` — enforced by
`assertNotTaxonomyResolved → 422` (`EngineRegistry.ts:42-49`).

| # | Rule |
|---|---|
| **TX-1** | Canonical issuer sector classification **must map onto** the certified taxonomy |
| **TX-2** | ⚠ It **must NOT redefine** it |
| **TX-3** | Any mismatch is an **explicit mapping decision with evidence — never a silent reclassification**, which would be a **methodology change** (SPEC ¶132/133, Ramki/Sai authority) |
| **TX-4** | P04 **identifies** this authority requirement and **does not exercise it** — open item **OI-P04-01** |

---

## 6. Frozen methodologies — untouched

**Auto Option-A · Materials G1–G6 · Telecom D16** (`D8_STATUS.invariants.frozen_methodologies_preserved`)
are **not modified, referenced as mutable, or reinterpreted** by P04. Scoring and calibration are
untouched. **13 engines · 19 UI surfaces** unchanged (INV-9).

---

## 7. Certification posture

| Field | Value |
|---|---|
| Certification | **`NONE_GRANTED`** — P04 creates **no** certification evidence and implies none |
| C12 | Remains **BLOCKED** on **M-5** (existing-IIPS) |
| CSIP revalidation | **NOT triggered** by the identity model (CG-5) |
| E2E-030 | **Not revoked, not renewed** — M-1 `OPEN_REVALIDATION_REQUIRED`, existing-IIPS |
| Activation | **`NOT_AUTHORIZED`** |
