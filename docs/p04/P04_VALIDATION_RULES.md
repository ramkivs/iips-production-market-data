# P04 — VALIDATION RULES

**SPECIFICATION ONLY — these are requirements, not implemented tests.**
Structure follows the eight validation areas of `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md` §G.8.

> ⚠ **No test is executed, passed, waived or certified by this artifact.** Executable validation
> is a deferred implementation obligation (`P04_OPEN_ITEMS.md` §3).

---

## 1. Coverage against `D4_05` §G.8

| G.8 area | Section here |
|---|---|
| Uniqueness | §2 |
| Mapping provenance | §5 |
| Lifecycle | §4 |
| PIT identity | §4.1 |
| **CSIP non-regression** | §6 |
| Fail-closed | §7 |
| Taxonomy | §8 |
| Audit | §9 |

Plus **§3 — identifier authority (FIGI)**, required by the resolved **OI-09**.

---

## 2. Uniqueness

| Rule | Requirement | Violation |
|---|---|---|
| **V-U1** | Canonical security ID unique and immutable for life (U-1, CS-5) | Hard error |
| **V-U2** | (identifier-type, value) unique **within an effective-date window** (U-2) | Hard error |
| **V-U3** | (venue, local symbol) unique within an effective-date window (U-3) | Hard error |
| **V-U4** | ⚠ **Symbol reuse by a different instrument must not collide** (U-4) — **never silent reassignment** | Hard error |
| **V-U5** | Canonical issuer ID and canonical listing ID unique/immutable (U-5, U-6) | Hard error |
| **V-U6** | **(FIGI, granularity) unique within an effective-date window** (U-7) — ⚠ a duplicate **authoritative** identifier is a hard error, **never a merge heuristic** | Hard error |
| **V-U7** | At most one primary listing per instrument per window (U-8, LS-3) | Hard error |
| **V-U8** | ⚠ **1:N must not be used to relax uniqueness** (U-9): many instruments per issuer is valid; many issuers per instrument **within one window** is not | Hard error |

---

## 3. Identifier authority — OI-09 (FIGI)

| Rule | Requirement | Violation |
|---|---|---|
| **V-X1** | Exactly **one** identifier type is authoritative, and it is **`FIGI`** (XI-1) | Hard error |
| **V-X2** | ⚠ **Canonical security ID ≠ FIGI** (CS-3). A record whose canonical ID equals or is derived from its FIGI is invalid | Hard error |
| **V-X3** | ISIN / CUSIP / SEDOL present ⇒ flagged **non-authoritative** (XI-3) | Hard error |
| **V-X4** | ⚠ **No provider ID or provider symbol carries authoritative status** (XI-4, PN-2) | Hard error |
| **V-X5** | Missing FIGI ⇒ **explicit unresolved state**; ⚠ **must not** fall back to another standard as authoritative (XI-6) | Fail-closed (§7) |
| **V-X6** | Every identifier carries type, value, authority flag, source, effective dates, confidence (§5.2) | Hard error |
| **V-X7** | FIGI **granularity** recorded; venue-level FIGIs on listings, composite/share-class on instruments (XI-7, XI-8) | Hard error |

---

## 4. Lifecycle

| Rule | Requirement | Violation |
|---|---|---|
| **V-L1** | `lifecycleStatus` ∈ {`active`,`suspended`,`delisted`,`merged`,`superseded`} — **no sixth value** | Hard error |
| **V-L2** | ⚠ **No transition mutates the canonical security ID** (LC-2) | Hard error |
| **V-L3** | `merged` / `superseded` ⇒ successor reference present (LC-4) | Hard error |
| **V-L4** | Identity records never deleted (LC-3) | Hard error |
| **V-L5** | ⚠ **State never inferred from absent data** (LC-6) — missing provider data is **not** a delisting | Hard error |
| **V-L6** | Delisting, merger, symbol change and supersession correctness (`D4_05` §G.8) | Scenario validation |
| **V-L7** | Effective-date windows **non-overlapping** per (entity, attribute) (ED-2) | Hard error |
| **V-L8** | Open-ended `validTo` represented **explicitly**, never as a missing field (ED-3) | Hard error |
| **V-L9** | Corrections **additive**; history never rewritten (ED-5, MP-3) | Hard error |

### 4.1 PIT identity

| Rule | Requirement |
|---|---|
| **V-P1** | **As-of identity resolution correct at historical boundaries** (`D4_05` §G.8) — uses the window containing the as-of instant, never the latest (ED-4) |
| **V-P2** | Deterministic and repeatable for a given (identity, as-of, `identityMappingVersion`) (RP-1, RP-2) |
| **V-P3** | 1:N issuer attribution resolved as-of (CD-5, ED-6) |
| **V-P4** | ⚠ **Not replay verification.** V-P1…V-P3 are **not** evidence of byte-identical reproduction — **AD-17 remains UNRESOLVED** (AF-3) |

---

## 5. Mapping provenance

| Rule | Requirement |
|---|---|
| **V-M1** | **Every mapping traceable to source, method, version and approval** (`D4_05` §G.8, MP-1) |
| **V-M2** | `mappingMethod` is an explicit enumerated value; ⚠ **"inferred from symbol" is not permitted** (MP-2, ADP-1) |
| **V-M3** | Identifier-derived mappings record identifier **type and authority flag** (MP-4) |
| **V-M4** | ⚠ **`confidence` never substitutes for approval** (MP-5) |
| **V-M5** | Mapping version recorded on every execution that used it (ADP-4, IM-1) |
| **V-M6** | ⚠ Mapping-version change on **any** content/cardinality/authority change (IM-6) — silent behavioural change is a violation |

---

## 6. CSIP non-regression

| Rule | Requirement | Violation |
|---|---|---|
| **V-C1** | `NormalizedHolding` shape unchanged — **no field added, removed or retyped** (CG-1) | ⛔ Certified-contract breach — **new ADR required** |
| **V-C2** | `companyId` remains a plain `string` at the CSIP boundary (CG-2) | ⛔ Same |
| **V-C3** | ⚠ **Canonical IDs never passed directly into CSIP** (CP-2) | ⛔ Same |
| **V-C4** | ⚠ **`companyId` never used as, aliased to, or reintroduced as a security identity** (NR-4, CS-4) | ⛔ Same |
| **V-C5** | `companyId` never derived by string construction from a canonical ID (PR-4, ADP-1) | Hard error |
| **V-C6** | **CSIP outputs unchanged for equivalent inputs** (`D4_05` §G.8) | ⛔ Regression |
| **V-C7** | ⚠ **`${sector}-H1` never modelled as an entity** in the master (CD-4, NR-5) | Hard error |
| **V-C8** | `OntologyMapper`, `RankingEngine`, `OpportunityEngine`, `CrossSectorEvidence` unchanged (CG-4) | ⛔ Certified breach |

---

## 7. Fail-closed

| Rule | Requirement |
|---|---|
| **V-F1** | ⚠ **Unmapped identity raises an explicit error; NO silent coercion** (`D4_05` §G.8, FC-1) |
| **V-F2** | No placeholder, synthesised, empty-string or null `companyId` is ever produced (FC-1) |
| **V-F3** | Failure **deterministic and repeatable** (FC-3) |
| **V-F4** | Failure **names the unresolved element** — identity, direction, as-of (FC-4) |
| **V-F5** | ⚠ **Unresolved identity is NOT reported as data quality, staleness or provider unavailability** (FC-5) |
| **V-F6** | ⚠ **P02 error taxonomy E1–E8 unchanged** — no class added, removed or reclassified; only E1 is quality-bearing, and identity failure is **not E1** (FC-6, INV-6) |
| **V-F7** | `companyId` with no canonical mapping ⇒ explicit unresolved state, never a default (MC-7) |
| **V-F8** | Dangling listing→venue or instrument→issuer reference ⇒ hard error, **never a created placeholder** (BD-7) |

---

## 8. Taxonomy

| Rule | Requirement |
|---|---|
| **V-T1** | **Canonical sector maps to the certified taxonomy without redefinition** (`D4_05` §G.8, TX-1/TX-2) |
| **V-T2** | ⚠ **No silent reclassification** — a mismatch is an explicit, evidenced mapping decision (TX-3) |
| **V-T3** | `assertNotTaxonomyResolved → 422` behaviour unchanged (`EngineRegistry.ts:42-49`, existing-IIPS) |
| **V-T4** | ⚠ A taxonomy **conflict** requires **Ramki/Sai methodology authority** — P04 **identifies, does not decide** (TX-4, **OI-P04-01**) |

---

## 9. Audit

| Rule | Requirement |
|---|---|
| **V-A1** | **Every mapping mutation audit-logged** (`D4_05` §G.8, ADP-3) with **actor, timestamp, reason** |
| **V-A2** | Lifecycle transitions audit-logged (LC-5) |
| **V-A3** | Fail-closed outcomes audit-logged, and **never written into a snapshot as data** (FC-7) |
| **V-A4** | ⚠ **IS-3** — audit records never expose another tenant's identity, entitlement or dataset reference (SEC-3) |
| **V-A5** | P04 adds **no new audit channel** and grants **no retention relief** — **M-6 remains OPEN** (existing-IIPS) (SEC-5) |

---

## 10. Security gating

| Rule | Requirement |
|---|---|
| **V-S1** | Identity resolution occurs only **after** the P03 gate chain **G1–G7**; ⚠ **order and outcomes unchanged** (SEC-1) |
| **V-S2** | **IS-2** tenant data isolation for identity records and mappings (SEC-2) |
| **V-S3** | Governance classification via **AD-11 `DataGovernanceRuntime.classify()` / `canAccess()`**; ⚠ **no new mechanism** (SEC-4) |
