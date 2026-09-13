# P04 — GOVERNED IDENTITY ADAPTER CONTRACT

**SPECIFICATION ONLY.** Authority: **AD-1 ADAPTER MODEL** (`docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md` §G.3).
Incorporates **OI-08 = 1:N** and **OI-09 = FIGI/OpenFIGI**.

---

## 1. The adapter — structure preserved verbatim from AD-1

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

---

## 2. Mandatory adapter properties

All eight properties from `D4_05` §G.3, carried forward and made specific where a decision now exists:

| Property | Requirement |
|---|---|
| **ADP-1 Explicit** | Every mapping is a **stored, inspectable record**. **No inference, no string munging, no convention-based derivation** |
| **ADP-2 No silent coercion** | An unmapped canonical identity **must fail explicitly**. It must **never** be silently coerced into a `companyId`-shaped string — see §6 |
| **ADP-3 Auditable** | Every mapping create/update/retire is **audit-logged with actor, timestamp and reason** |
| **ADP-4 Versioned** | The mapping set is versioned; an execution records **which mapping version it used** — `identityMappingVersion`, `P04_LINEAGE_AND_VERSION_IMPACT.md` |
| **ADP-5 Evidenced** | Mapping version **participates in execution lineage**, so a replay resolves identity the same way |
| **ADP-6 Bidirectional** | canonical → `companyId` for engine/CSIP input; `companyId` → canonical for UI resolution and drill-through — see §4 |
| **ADP-7 Time-aware** | Mappings are **effective-dated**; a PIT query resolves identity **as of** its as-of boundary |
| **ADP-8 Cardinality-explicit** | The mapping **states its cardinality rule explicitly**. ⚠ **That rule is now 1:N** (OI-08) — §4 |

---

## 3. Provider neutrality — no provider-ID promotion, no shape leakage

| # | Rule | Basis |
|---|---|---|
| **PN-1** | The identity mapping is **provider-neutral**. Provider-native shapes stay **inside** P02 adapters and never reach the master | `P02_PROVIDER_ABSTRACTION_CONTRACT` · NFR-06 |
| **PN-2** | ⚠ **No silent provider-ID promotion.** A provider-native ID or symbol is **never** promoted to canonical identity, authoritative identifier, or join key | `P01` ID-6 · **XI-4** |
| **PN-3** | The internal `provider` token is **stable, immutable, never a vendor name**, and **never exposed in product DTOs or UI** (PI-1…PI-6). It is recorded as the *asserting source* of an identity, never as the identity | `P02_PROVIDER_IDENTITY_VERSIONING` §1 |
| **PN-4** | A provider symbol may be recorded as `localSymbol` on a **listing** and as an **alias** with effective dates — both **explicitly non-authoritative** | LS-2 |
| **PN-5** | Two providers asserting the same instrument produce **one** canonical security ID with **per-source attribution** (PI-8) — never two canonical identities, never a silent merge |
| **PN-6** | **FIGI is not a provider ID.** It is an external standard identifier (XI-1); resolving it through any provider does not make the provider's own ID authoritative |

---

## 4. Cardinality rule — 1:N (OI-08, authorized)

| # | Rule |
|---|---|
| **MC-1** | **The adapter's cardinality rule is 1:N**: one canonical company/entity identity may map to **multiple** securities/instruments/listings |
| **MC-2** | Direction **canonical → `companyId`**: **many** canonical security IDs may resolve to **one** `companyId`. This is an **N:1 projection** onto the certified boundary and is **expected**, not an error |
| **MC-3** | Direction **`companyId` → canonical**: resolution returns a **set** (zero, one or many), never a scalar assumed to be unique. Consumers must handle the set |
| **MC-4** | ⚠ **The N:1 projection must never be used to invent, merge or collapse canonical identities.** Two instruments sharing a `companyId` remain **two distinct securities** with distinct canonical IDs (CD-2) |
| **MC-5** | Each mapping record is **effective-dated** (ADP-7); cardinality is evaluated **within** an effective-date window, never across all time |
| **MC-6** | ⚠ **`${sector}-H1` is not modelled as an entity.** Existing synthetic values are valid **mapping targets** only, per `D4_05` §G.5 step 3 (CD-4) |
| **MC-7** | A `companyId` with **no** canonical mapping is an **explicit unresolved state** (§6), never a default or fallback |

---

## 5. Mapping record — required attributes

Per `D4_05` §G.3, unchanged:

canonical security ID · canonical issuer ID · target `companyId` · **mapping version** ·
effective from / to · **mapping method** (how derived) · source/provider · **confidence** ·
approval/authority reference · **audit reference**

| # | Provenance rule |
|---|---|
| **MP-1** | Every mapping is traceable to **source, method, version and approval** (`D4_05` §G.8) |
| **MP-2** | `mappingMethod` must be an explicit enumerated value — e.g. authoritative-identifier match, registry assertion, manual approval. ⚠ **"inferred from symbol" is NOT a permitted method** (ADP-1) |
| **MP-3** | Provenance is **immutable**: a correction produces a **new** effective-dated record; history is never overwritten (parallels AV-5) |
| **MP-4** | Where a mapping derives from an external identifier, the **identifier type and its authority flag** are recorded — so a FIGI-based mapping is distinguishable from an ISIN-based one (XI-3) |
| **MP-5** | `confidence` never substitutes for approval. A low-confidence mapping is **not** silently used; it is unresolved until approved |

---

## 6. Unresolved / unmapped behaviour — FAIL-CLOSED

| # | Rule |
|---|---|
| **FC-1** | ⚠ **An unmapped canonical identity MUST fail explicitly.** No silent coercion, no placeholder, no synthesised `companyId`, no empty string, no `null` join key (ADP-2) |
| **FC-2** | **An unresolved FIGI is an explicit unresolved state** — never a fallback to ISIN/CUSIP/SEDOL as authoritative, never a fallback to a provider symbol (XI-6, PN-2) |
| **FC-3** | Failure is **deterministic and repeatable**: the same unresolved input always produces the same explicit failure |
| **FC-4** | The failure **names the unresolved element** — which identity, which direction, which as-of date — so it is diagnosable without guessing |
| **FC-5** | ⚠ **Fail-closed is not degradation.** An unresolved identity is **not** reported as data quality, staleness or provider unavailability |
| **FC-6** | **P02 error-taxonomy discipline (INV-6): E1–E8 is UNCHANGED — no class is added, removed or reclassified by P04.** An identity-resolution failure is a **P04-internal** fail-closed condition; where it must be expressed at the provider boundary it maps to an existing class **without redefining it**. Only **E1** is quality-bearing, and identity failure is **not E1** |
| **FC-7** | A fail-closed identity outcome is **audit-logged** (ADP-3) and **never** written into a snapshot as though it were data |

---

## 7. Security, tenancy and audit — P03 invariants preserved

| # | Rule | Basis |
|---|---|---|
| **SEC-1** | The adapter sits **behind** the P03 fail-closed gate chain **G1–G7**; identity resolution occurs only after gates pass. **The chain, its order and its outcomes are unchanged** | `P03_SECURITY_AUTH_CONTRACT` |
| **SEC-2** | **IS-2** — no cross-tenant data access: identity records and mappings are tenant-scoped where governance classification requires | `P03_TENANT_ISOLATION` |
| **SEC-3** | **IS-3** — no cross-tenant lineage contamination: a mapping audit record must never expose another tenant's identity, entitlement or dataset reference | ibid. |
| **SEC-4** | Tenant/region/governance attributes are classified through **AD-11 `DataGovernanceRuntime.classify()` / `canAccess()`**; P04 introduces **no new** governance mechanism | `D4_05` §G.2 |
| **SEC-5** | Audit records for mapping mutations follow **P03 audit requirements**; P04 adds no new audit channel and grants no retention relief (**M-6 remains OPEN, existing-IIPS**) | `P03_AUDIT_AND_OBSERVABILITY` |

---

## 8. Prohibited

| # | Prohibited |
|---|---|
| PR-1 | Passing canonical IDs **directly** into CSIP (`D4_05` §G.4) |
| PR-2 | Changing `companyId` type or semantics at the CSIP boundary |
| PR-3 | Adding identity fields to `NormalizedHolding` |
| PR-4 | Deriving `companyId` by string construction from any canonical ID |
| PR-5 | Promoting a provider ID/symbol to identity (PN-2) |
| PR-6 | Treating FIGI as the canonical internal ID (CS-3) |
| PR-7 | Silent merge of two canonical identities on identifier collision (U-7) |
| PR-8 | Any of PR-1…PR-3 would modify a **certified contract and require a NEW ADR** |
