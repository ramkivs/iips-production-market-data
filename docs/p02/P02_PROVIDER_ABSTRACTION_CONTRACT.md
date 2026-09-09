# P02 — PROVIDER ABSTRACTION CONTRACT

**Phase:** P02 — Provider Abstraction (tracker: *Provider Abstraction & Entitlement Model*)
**Status:** SPECIFICATION — **NOT ACCEPTED.** P02 gate acceptance is a separate explicit act.
**Depends on:** P01 — ACCEPTED (`547de1b` package, `7c46141` acceptance)
**Certification:** `NONE_GRANTED` · **Production activation:** `NOT_AUTHORIZED`

> **"Provider abstraction" does not mean production provider integration.**
> No provider is selected, named, credentialed, contacted or implemented in P02.

---

## 1. Scope and non-scope

### 1.1 In scope

The **boundary** between external market-data providers and the canonical P01 contract: the
adapter interface, provider identity, capability declaration, entitlement boundary, error
taxonomy, mapping rules, adapter versioning, snapshot-production semantics, substitution
semantics, deferred test obligations and observability requirements.

### 1.2 Out of scope — deferred with owning phase

| Excluded | Owner |
|---|---|
| Credentials, secrets, service identity, tenant controls | **P03** |
| Security master, canonical identity resolution | **P04** |
| Acquisition / ingestion runtime, local deterministic feed, live adapter | **P05** |
| Normalization runtime | **P06** |
| Data-quality / freshness / reconciliation runtime | **P07** |
| PIT storage, corporate-action adjustment, replay | **P08** |
| Engine integration | **P11** |
| APIs / DTOs | **P12** · UI **P13** |
| Certification **P15** · Activation **P16** · Operations **P17** |

**No executable source code is produced.** The program has produced none to date; the tracker's
P02 deliverables *"Provider SPI/interface"* and *"Contract test suite"* are implementation
artifacts and are recorded as deferred obligations (`P02_DEPENDENCY_REGISTER.md` DEP-P02-08/09),
not silently implemented. **No credentials or secrets are introduced anywhere.**

---

## 2. The abstraction boundary

```
external provider (unnamed, unselected)
      │   provider-native protocol, schema, symbols, units, times
      ▼
╔══════════════════════════════════════════════════════════╗
║  PROVIDER ADAPTER            ← P02 defines this boundary  ║
║  · provider-native shapes live ONLY inside here           ║
║  · capability declaration · entitlement check             ║
║  · error classification · canonical mapping               ║
╚══════════════════════════════════════════════════════════╝
      │   P01 CanonicalSnapshot — provider-independent
      ▼
MarketDataSource<T>            ← the sole ingress abstraction (AD-2, NFR-06)
      │  .snapshot(...)
      ▼
DataSnapshot<T>                ← IMMUTABLE, VERSIONED
      │  identity = data-${provider}-${dataVersion}-${asOf}
      ▼
… downstream phases (P05–P12) — NOT built here
```

| # | Boundary rule |
|---|---|
| **B-1** | The adapter is the **only** place provider-native schemas, symbols, units, time conventions or error codes may exist |
| **B-2** | The adapter's **output boundary is the P01 canonical contract** — nothing less complete, nothing provider-shaped |
| **B-3** | Adapters are **replaceable behind `MarketDataSource<T>`** (NFR-06). No consumer may depend on which adapter produced a snapshot |
| **B-4** | **No second ingress contract** may be created (AD-2; **G2 retired**). The adapter feeds `MarketDataSource<T>`; it does not bypass it |
| **B-5** | An adapter **never** reaches an engine, DTO or UI directly |
| **B-6** | Provider-native identifiers are **never** canonical identity (identity resolution is P04) |

---

## 3. Adapter interface — normative obligations

Expressed as obligations of the adapter role, **not** as source code.

### 3.1 Declaration obligations (static, no I/O)

| # | Obligation |
|---|---|
| A-1 | Declare a stable **internal provider identity** (`P02_PROVIDER_IDENTITY_VERSIONING.md` §1) |
| A-2 | Declare **adapter identity and version** |
| A-3 | Declare the **provider schema/protocol version** it targets |
| A-4 | Declare the **canonical `schemaVersion`** range it emits |
| A-5 | Declare the **namespace version** it applies (⚠ token pending OI-10 — §7) |
| A-6 | Publish a **capability declaration** (`P02_PROVIDER_CAPABILITY_MODEL.md`) |
| A-7 | Declare its **entitlement requirements** |
| A-8 | Declare **known limitations** explicitly, as first-class content, not as omissions |

### 3.2 Acquisition obligations (behavioural)

| # | Obligation |
|---|---|
| A-9 | Accept a **capability-scoped request**: domain, identity reference, field set, mode (LIVE/SNAPSHOT/PIT), as-of or PIT boundary, granularity, range |
| A-10 | **Verify the request against its declared capability before any provider call.** An unsupported request fails as `UNSUPPORTED_CAPABILITY` — it is never silently narrowed, substituted or best-effort served |
| A-11 | **Verify entitlement before acquisition** (§5). Entitlement failure is an explicit classified state, never an empty success |
| A-12 | Perform acquisition (**implemented in P05, not here**) |
| A-13 | **Validate the provider response** against the declared provider schema before mapping |
| A-14 | Map provider-native → canonical per `P02_PROVIDER_MAPPING_RULES.md` |
| A-15 | Apply the field namespace (⚠ blocked on OI-10 for literal keys — §7) |
| A-16 | Construct an **immutable, versioned** `DataSnapshot<T>` carrying the full P01 canonical contract |
| A-17 | Classify any failure per `P02_ERROR_TAXONOMY.md` and propagate it — **never coerce** |
| A-18 | Emit the observability/audit record required by `P02_OBSERVABILITY_REQUIREMENTS.md` |

### 3.3 Prohibitions

| # | Prohibition |
|---|---|
| A-19 | **No provider-native field name, symbol, error code or enum may cross the boundary** |
| A-20 | **No default, placeholder, zero, empty string or carried-forward value** may substitute for absent data |
| A-21 | **No silent unit, currency, precision or timezone conversion.** Any conversion is explicit, declared and recorded in lineage |
| A-22 | **No mutation** of a constructed snapshot. Corrections produce a new `dataVersion` |
| A-23 | **No credential, token, key, secret or endpoint URL** may appear in an adapter declaration, contract artifact, fixture, log or evidence record |
| A-24 | **No mode inference.** The requested mode is honoured exactly or the request fails |
| A-25 | An adapter may not degrade a **contract violation** into a quality state |

---

## 4. Determinism

| # | Rule |
|---|---|
| D-1 | Identical `(provider, dataVersion, asOf)` ⇒ identical `snapshotId` |
| D-2 | Identical provider payload + identical adapter version + identical `schemaVersion` ⇒ **identical canonical snapshot**, byte-for-byte under the P01 deterministic-serialization rules |
| D-3 | Mapping is a **pure function** of the provider payload plus declared configuration; no wall-clock, random or ambient input beyond the single recorded `receivedAt` |
| D-4 | `receivedAt` is stamped **once** at the ingest boundary and never recomputed or back-filled |
| D-5 | Ordering — of fields, of contributing snapshots — is canonical and specified, never implementation-incidental |
| D-6 | Asynchronous acquisition must resolve to the **same deterministic snapshot shape** as synchronous construction |

---

## 5. Entitlement boundary (summary; full text in `P02_ENTITLEMENT_MODEL.md`)

| # | Rule |
|---|---|
| E-1 | **Credentials and secrets are P03.** P02 defines only *that* an entitlement decision occurs and *how its outcome is represented* |
| E-2 | Entitlement is evaluated **before** acquisition |
| E-3 | Entitlement failure is **fail-closed**: no data, no partial data, no cached substitute |
| E-4 | An unentitled field is `WITHHELD` with an `entitlementRef` — never `NOT_PROVIDED`, never absent |
| E-5 | Licence-restricted content (D06, D09) additionally requires governance classification (AD-11) |
| E-6 | ⚠ **M-5** (existing-IIPS authentication/session not wired) is **recorded, not repaired** |

---

## 6. Snapshot production and lineage

| # | Rule |
|---|---|
| S-1 | The adapter produces an **immutable, versioned** `DataSnapshot<T>` — the sole product of the boundary |
| S-2 | `snapshotId` = `data-${provider}-${dataVersion}-${asOf}` — **format frozen** (AD-6) |
| S-3 | `data-*` is **never** conflated with engine-layer `SNAP_*`. They identify different things |
| S-4 | The adapter populates every ADR-02 `contributingData` element: `dataSnapshotId`, `provider`, `dataVersion`, `asOf`, `receivedAt`, `mode`, `quality`, `completenessPct`, `lineage` |
| S-5 | The adapter populates the P01 lineage block: `sourceRef`, `adapterId`, `adapterVersion`, `transformationChainRef`, `receivedAt`, `namespaceVersion`, plus conditional `datasetVersion`, `entitlementRef`, `governanceClassification`, `adjustmentBasisRef` |
| S-6 | `identityMappingVersion` is **passed through** from P04, never fabricated by the adapter |
| S-7 | **Provider identity is never flattened away in lineage**, even though it is never exposed in product DTOs |
| S-8 | **No replay is implemented.** `ReplayService` is untouched; **AD-17 remains UNRESOLVED** |
| S-9 | An execution with no contributing market-data snapshot remains byte-identical to today (inherited additive-and-inert requirement) |

---

## 7. ⚠ OI-10 dependency — recorded, not resolved

**OI-10 remains `APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING`.** The exact namespace token is
**not invented here**, and **`MD:<domain>.<field>` is NOT adopted.**

| Operation | P02 status |
|---|---|
| Declaring *that* an adapter applies the namespace (A-15) | **Specifiable — done** |
| Declaring *that* `namespaceVersion` is emitted and participates in identity | **Specifiable — done** |
| Mapping rules expressed against `<NS>` placeholders | **Specifiable — done** |
| Emitting **literal canonical keys** | **BLOCKED — DEP-P02-01** |
| Executing C1/C2 partition checks mechanically | **BLOCKED — DEP-P02-01** |
| Producing conformance fixtures with literal keys | **BLOCKED — DEP-P02-09** |

**This blocks P05/P06/P11 execution as already recorded; it does not block the P02
specification**, because every namespace-dependent element is expressed structurally.

---

## 8. Boundaries reaffirmed

| # | Reaffirmed |
|---|---|
| 1 | No provider selected, named, contacted or implemented |
| 2 | No credentials, secrets or endpoints introduced |
| 3 | No acquisition performed |
| 4 | No P03/P04/P05 implementation |
| 5 | No existing-IIPS change; no engine, scoring, calibration, taxonomy or certification change |
| 6 | **M-1** `OPEN_REVALIDATION_REQUIRED`; E2E-030 NOT REVOKED / NOT RENEWED |
| 7 | **AD-17** UNRESOLVED; `ReplayService` untouched |
| 8 | **OI-08 / OI-09** open, owned by P04 |
| 9 | **M-5 / M-6 / OI-05 / OI-06 / CD-01** open |
| 10 | No methodology decision; no new engine metric key |

## 9. Gate position

P02 is **NOT accepted** by this document. Gate: **P02 — Provider abstraction/entitlement gate**.
Gate rule (tracker `Phase Gates!P02`): **"Explicit gate acceptance; no automatic promotion."**
