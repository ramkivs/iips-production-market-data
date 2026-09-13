# P04 — ACCEPTANCE CRITERIA

> ⚠ **This artifact DEFINES the criteria a future P04 gate review would assess.**
> **It does NOT accept the P04 gate.** No criterion below is marked satisfied by its own
> definition. **P04 is NOT ACCEPTED**; formal gate status remains **4 of 18**.
> Acceptance requires a separate explicit act by **A3** — *"no automatic promotion"*.

**Gate:** Identity/master gate.
**Minimum evidence** (`docs/p00/P00_GATE_MODEL.md`:38): *"Mapping records; versioning; audit log;
OI-08 + OI-09 decided; CSIP non-regression"* — plus TRACKER *Phase Gates*!P04:
*"Phase-specific tests + artifacts + lineage/evidence + concessions where applicable"*.

---

## A. Scope and boundary

| # | Criterion |
|---|---|
| A-1 | P04 purpose matches SPEC ¶40 / TRACKER *Phase Roadmap*!P04 |
| A-2 | Relationships to P01, P02, P03, P05, P08 and existing-IIPS each stated |
| A-3 | Exclusions explicit — P05, P06, P07, P08, P11, P12, P13, certification, activation |
| A-4 | **P04 is not made a product-wide identity authority** (ID-4; new ADR required) |

## B. Canonical identity

| # | Criterion |
|---|---|
| B-1 | Canonical security ID **required, immutable, unique, program-internal, opaque** |
| B-2 | ⚠ **Never** a provider ID, vendor symbol, local ticker, FIGI or `companyId` |
| B-3 | Issuer and listing entities defined with required attributes |
| B-4 | Instrument type, currency, lifecycle status, effective dates, aliases, source, provenance, governance all required |

## C. OI-08 — cardinality (RESOLVED: 1:N)

| # | Criterion |
|---|---|
| C-1 | **1:N** company/entity → securities/instruments/listings stated explicitly |
| C-2 | Each security/instrument has **its own immutable canonical security ID** |
| C-3 | `companyId` remains the CSIP join key — **not redefined, removed or retyped** |
| C-4 | ⚠ **`${sector}-H1` not forced into the master**; synthetic values are mapping targets only |
| C-5 | Adapter cardinality rule stated explicitly as 1:N; N:1 projection to `companyId` handled |
| C-6 | Cardinality effective-dated; uniqueness **not** weakened by 1:N |
| C-7 | ⚠ Downstream product-behaviour consequences **recorded, not silently absorbed** |

## D. OI-09 — identifier standard (RESOLVED: FIGI)

| # | Criterion |
|---|---|
| D-1 | **FIGI / OpenFIGI** recorded as the authoritative external identifier standard |
| D-2 | ⚠ **Canonical security ID remains distinct from FIGI** |
| D-3 | ISIN / CUSIP / SEDOL representable as **non-authoritative** identifiers |
| D-4 | ⚠ **Provider-native IDs and symbols never canonical identity** |
| D-5 | Mapping provenance, uniqueness, effective dating, **fail-closed** unresolved mappings all explicit |
| D-6 | Missing FIGI ⇒ explicit unresolved state, **never a fallback** |
| D-7 | FIGI granularity recorded; venue-level on listings, composite/share-class on instruments |

## E. Adapter

| # | Criterion |
|---|---|
| E-1 | All eight AD-1 properties specified: explicit, no silent coercion, auditable, versioned, evidenced, bidirectional, time-aware, cardinality-explicit |
| E-2 | Mapping record attributes complete (incl. approval and audit references) |
| E-3 | ⚠ **No inference, no string munging, no convention-based derivation** |
| E-4 | Bidirectional resolution specified in both directions, set-valued where 1:N applies |
| E-5 | Provider neutrality: no provider-ID promotion, no provider-native shape leakage |

## F. Lifecycle and effective dating

| # | Criterion |
|---|---|
| F-1 | Five lifecycle states — **no sixth** |
| F-2 | ⚠ **No transition mutates the canonical security ID**; records never deleted |
| F-3 | Effective dating universal; windows non-overlapping; corrections additive |
| F-4 | PIT identity resolves **as-of**, not latest |
| F-5 | Delisting, merger, symbol change, supersession, symbol reuse, identifier reissue all handled |
| F-6 | ⚠ Identity reproducibility **distinguished from replay verification** (AD-17) |

## G. Exchange / venue

| # | Criterion |
|---|---|
| GV-1 | **MIC-based** venue identity; operating vs segment MIC distinguished |
| GV-2 | Venue is **reference data, not an instrument** |
| GV-3 | Bidirectional issuer ↔ instrument ↔ listing ↔ venue, all effective-dated |
| GV-4 | Dangling references are hard errors, never placeholders |

## H. CSIP non-regression

| # | Criterion |
|---|---|
| H-1 | `NormalizedHolding` shape unchanged; `companyId` a plain `string` |
| H-2 | ⚠ Canonical IDs **never** passed directly into CSIP |
| H-3 | ⚠ **`companyId` never reintroduced as a security identity** |
| H-4 | Four named CSIP consumers unchanged; **no CSIP revalidation triggered** |
| H-5 | Taxonomy **mapped onto, never redefined**; conflicts escalated to methodology authority |
| H-6 | ⚠ **No existing CSIP test modified, revalidated or waived** |

## I. Lineage and versioning

| # | Criterion |
|---|---|
| I-1 | ⚠ **Six version axes — no seventh** |
| I-2 | `identityMappingVersion` semantics specified; immutable once released; changes on any content/cardinality/authority change |
| I-3 | ⚠ `snapshotId` format **unchanged**; mapping version in **lineage, not `snapshotId`** |
| I-4 | ⚠ `data-*` **never conflated** with engine `SNAP_*` |
| I-5 | ADR-02 `contributingData` unchanged; replay identity unaffected |
| I-6 | ⚠ **AD-17 preserved as UNRESOLVED**; no workaround implied |

## J. Validation and fail-closed

| # | Criterion |
|---|---|
| J-1 | All eight `D4_05` §G.8 areas covered, plus identifier authority |
| J-2 | ⚠ **Unmapped identity fails explicitly — no silent coercion** |
| J-3 | Failures deterministic, named, audit-logged |
| J-4 | ⚠ **P02 error taxonomy E1–E8 unchanged**; identity failure is not E1 and not quality-bearing |
| J-5 | Uniqueness rules time-bounded; symbol reuse non-collision enforced |

## K. Security, tenancy, audit

| # | Criterion |
|---|---|
| K-1 | P03 gate chain **G1–G7** order and outcomes unchanged |
| K-2 | **IS-2** and **IS-3** preserved for identity records, mappings and audit |
| K-3 | **AD-11** governance mechanism unchanged; no new mechanism |
| K-4 | Every mapping mutation audit-logged with actor, timestamp, reason |

## L. Open-item discipline

| # | Criterion |
|---|---|
| L-1 | **OI-08 and OI-09 represented as RESOLVED**, never as blockers |
| L-2 | ⚠ Historical artifacts recording them as OPEN **not edited** |
| L-3 | **OI-10 not decided**; ⚠ **no namespace token invented or inferred** |
| L-4 | **AD-17, M-1, M-5, M-6 preserved unresolved**; E2E-030 not revoked, not renewed |
| L-5 | Remaining items OI-P04-01…05 recorded; those needing authority marked explicitly, **not decided** |
| L-6 | **DO-1…DO-5 and DO-P04-1…5 remain DEFERRED — NOT PASSED** |

## M. Non-goals honoured

| # | Criterion |
|---|---|
| NG-1 | **No production code, schema, DDL, migration or configuration** |
| NG-2 | **Existing-IIPS unmodified** |
| NG-3 | **No scoring/calibration/methodology change** |
| NG-4 | **Certified CSIP contract not altered — silently or otherwise** |
| NG-5 | **No acquisition/provider integration; no provider selected; entitlement matrix EMPTY** |
| NG-6 | **No PIT storage; no P08 work** |
| NG-7 | ⚠ **No certification granted or implied; no certification evidence created** |
| NG-8 | ⚠ **No production activation** |
| NG-9 | ⚠ **No P04 gate acceptance record created** |

## N. Evidence

| # | Criterion |
|---|---|
| N-1 | Complete artifact inventory with deterministic checksums |
| N-2 | ⚠ **Non-circular self-integrity method** for the evidence artifact |
| N-3 | Internal cross-references reconciled; no dangling identifiers |
| N-4 | **OI-08 / OI-09 incorporation demonstrated** with locations |
| N-5 | Exact baseline HEAD recorded |
| N-6 | ⚠ **Package preparation distinguished from implementation, certification and activation** |
| N-7 | Traceability to D4/D8, P00–P03, TRACKER and SPEC, per `P00_EVIDENCE_CONVENTIONS.md` |

---

## Status of this artifact

| Field | Value |
|---|---|
| Criteria **defined** | ✅ |
| Criteria **assessed** | ❌ **NOT PERFORMED** |
| P04 gate | **NOT ACCEPTED** |
| Formal gates | **4 of 18** |
| Certification | **`NONE_GRANTED`** |
| Activation | **`NOT_AUTHORIZED`** |
