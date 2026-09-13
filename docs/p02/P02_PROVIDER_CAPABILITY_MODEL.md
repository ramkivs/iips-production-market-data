# P02 — PROVIDER CAPABILITY MODEL

**SPECIFICATION ONLY.** Satisfies tracker `P02-01` (adapter contract) and supports `P02-03`
(selection criteria). **No provider is evaluated, named or selected.**

> **Governing principle:** capability is **declared, explicit and machine-checkable**.
> A capability that is not declared **does not exist**. Silence is never permission.

---

## 1. The capability declaration

Every adapter publishes a declaration, versioned with the adapter, containing:

| # | Element | Req. | Content |
|---|---|---|---|
| C-1 | `providerId` | R | Stable internal provider identity |
| C-2 | `adapterId` / `adapterVersion` | R | Adapter identity and version |
| C-3 | `providerSchemaVersion` | R | Provider protocol/schema version targeted |
| C-4 | `canonicalSchemaVersions[]` | R | P01 canonical schema versions emitted |
| C-5 | `namespaceVersion` | R | Namespace scheme version applied (⚠ token pending OI-10) |
| C-6 | `domains[]` | R | Subset of **D01–D10** only. No domain outside the D4 inventory |
| C-7 | `fields[]` per domain | R | Canonical field slots supported, per `P01_FIELD_DICTIONARY.md` |
| C-8 | `granularities[]` per domain | R | Supported frequency/interval set |
| C-9 | `historicalRanges[]` per domain | R | Earliest supported point and any gaps, effective-dated |
| C-10 | `modes[]` per domain | R | Which of LIVE / SNAPSHOT / PIT are supported |
| C-11 | `pitCapability` | C | Where PIT is claimed — §4 |
| C-12 | `revisionCapability` | C | Restatement/vintage support — §5 |
| C-13 | `corporateActionCapability` | C | D04 support — §5 |
| C-14 | `identifierInputs[]` | R | Which identity inputs the adapter accepts (⚠ constrained by OI-09) |
| C-15 | `entitlementRequirements[]` | R | Entitlements required, by domain/dataset |
| C-16 | `rateLimits` | R | Declared limits, or explicitly `UNKNOWN` |
| C-17 | `knownLimitations[]` | R | First-class, enumerated. An empty list is an assertion, not a default |
| C-18 | `deterministicReplayable` | R | Whether identical requests yield identical payloads |

### 1.1 Declaration rules

| # | Rule |
|---|---|
| CD-1 | The declaration is **static and I/O-free** — inspectable without contacting the provider |
| CD-2 | The declaration is **versioned with the adapter**; a capability change is an adapter version change |
| CD-3 | Any element may be `UNKNOWN`. **`UNKNOWN` is preferable to guessing** and is never treated as supported |
| CD-4 | Capability is declared in **canonical** terms (canonical field slots, canonical modes) — **never** in provider-native vocabulary |
| CD-5 | A declaration that claims a canonical field the P01 dictionary does not define is **invalid** |
| CD-6 | Declared ≠ entitled. Capability and entitlement are **independent gates**; both must pass |

---

## 2. Capability evaluation — the request gate

Evaluated **before** any provider call:

| # | Check | On failure |
|---|---|---|
| CE-1 | Requested domain ∈ `domains[]` | `UNSUPPORTED_CAPABILITY` |
| CE-2 | Every requested field ∈ `fields[]` for that domain | `UNSUPPORTED_CAPABILITY`, naming each unsupported field |
| CE-3 | Requested mode ∈ `modes[]` | `UNSUPPORTED_CAPABILITY` |
| CE-4 | Requested granularity ∈ `granularities[]` | `UNSUPPORTED_CAPABILITY` |
| CE-5 | Requested range ⊆ `historicalRanges[]` | `UNSUPPORTED_CAPABILITY` |
| CE-6 | PIT request ⇒ `pitCapability` present and sufficient | `UNSUPPORTED_CAPABILITY` |
| CE-7 | Identity input kind ∈ `identifierInputs[]` | `UNSUPPORTED_CAPABILITY` |
| CE-8 | Entitlement satisfied | `ENTITLEMENT_FAILURE` (§ error taxonomy) |

### 2.1 Unsupported-capability behaviour — **fail closed**

| # | Rule |
|---|---|
| UC-1 | An unsupported request **fails explicitly**. It is never partially served |
| UC-2 | **Prohibited:** silent narrowing of the field set · substituting a nearer granularity · substituting a nearer as-of · falling back to a different mode · returning an empty success · returning a cached or stale value |
| UC-3 | The failure names **precisely** what was unsupported (domain, field, mode, granularity, range) |
| UC-4 | `UNSUPPORTED_CAPABILITY` is a **contract condition, not a data condition** — it is a rejection, never `quality: 'partial'` |
| UC-5 | Fallback to another provider is an **orchestration decision above the adapter** (P05/P07), never an adapter-internal substitution |

---

## 3. Capability and the canonical contract

| # | Rule |
|---|---|
| CC-1 | A supported field must be emitted with **full** P01 attribution: `dataType`, `unit`/`currency`, `precision`, times, `availability`, `provenance`, `pitEligible` |
| CC-2 | An adapter may **not** claim a field it cannot attribute completely |
| CC-3 | A field the provider supports but the adapter cannot map deterministically is **not** a capability — it is a `knownLimitation` |
| CC-4 | Where the provider supplies a field the canonical dictionary does not define, it is **dropped inside the adapter** and recorded as a limitation. **It never crosses the boundary** |
| CC-5 | `completenessPct` is computed against the **contracted request field set**, not against what the provider happened to return |

---

## 4. PIT capability

| # | Rule |
|---|---|
| PC-1 | A PIT claim must state: earliest PIT boundary, boundary granularity, and whether **publication time** and **effective time** are separately preserved |
| PC-2 | A provider that returns only latest-known values **has no PIT capability**, however deep its history. Depth ≠ point-in-time |
| PC-3 | A PIT claim requires **repeatability**: same boundary ⇒ same result ⇒ same snapshot identity |
| PC-4 | A PIT claim requires that a later correction does **not** retroactively alter a past boundary result |
| PC-5 | Only `pitEligible` canonical fields may be claimed under PIT |
| PC-6 | PIT **storage** is P08. P02 declares only the provider-side capability |

## 5. Revision and corporate-action capability

| # | Rule |
|---|---|
| RC-1 | A revision claim must state whether **vintages are addressable** or only the latest revision is retrievable |
| RC-2 | Restatement-bearing domains (D03, D07, D08) without vintage addressability are declared `revisionCapability: LATEST_ONLY` — a **limitation**, not a PIT capability |
| RC-3 | A corporate-action claim (D04) must state supported action types, whether effective dating is complete, and whether adjustment factors are supplied |
| RC-4 | Adjustment factors, where supplied, are **evidence-bearing** and never silently applied |
| RC-5 | The adjustment **engine** is P08 |

## 6. Capability gaps as first-class content

| Gap kind | Representation |
|---|---|
| Domain not covered | Absent from `domains[]` |
| Field not covered | Absent from `fields[]` |
| Partial history | Bounded/gapped `historicalRanges[]` |
| Depth without PIT | `pitCapability` absent + `knownLimitation` |
| Latest-only revisions | `revisionCapability: LATEST_ONLY` |
| Unknown rate limits | `rateLimits: UNKNOWN` |
| Non-deterministic payloads | `deterministicReplayable: false` + limitation |

**A gap is never expressed as a lower `quality` value.** Quality describes delivered data;
capability describes what may be requested at all.

---

## 7. Provider selection criteria (tracker `P02-03`) — rubric only

Tracker `P02-03` calls for a *"Provider evaluation rubric"* enabling candidates to be compared.
The rubric dimensions are defined; **no candidate is evaluated, scored, ranked or selected**,
and no vendor is named anywhere in this program.

| Dimension | Basis |
|---|---|
| **Coverage** | Declared `domains[]` / `fields[]` against the D01–D10 requirement set |
| **Granularity & history** | `granularities[]`, `historicalRanges[]` |
| **PIT fidelity** | `pitCapability` per §4 — the discriminating dimension for D02/D03/D07/D08 |
| **Revision fidelity** | `revisionCapability` per §5 |
| **Corporate actions** | `corporateActionCapability` |
| **Identity inputs** | `identifierInputs[]` — ⚠ constrained by **OI-09**, unresolved |
| **Determinism** | `deterministicReplayable` |
| **Quality attribution** | Ability to support honest `quality` / `completenessPct` |
| **Latency / freshness** | Inputs to P07 thresholds (thresholds are **not** set here) |
| **Licensing / entitlement** | `entitlementRequirements[]`; environment eligibility |
| **Limitations** | `knownLimitations[]` |
| **Cost** | ⚠ **UNKNOWN — no commercial authority exists in this program.** Recorded as DEP-P02-06 |
| **Fallback suitability** | Substitutability per `P02_COMPATIBILITY_AND_SUBSTITUTION.md` |

| # | Rubric rule |
|---|---|
| SR-1 | The rubric compares **declarations**, not marketing claims |
| SR-2 | An `UNKNOWN` dimension is never scored as satisfactory |
| SR-3 | **Selection is an authority act, not a technical one.** No selection authority is recorded — DEP-P02-07 |
| SR-4 | Selection cannot complete while **OI-09** (identifier standard) is open, since identity inputs are un-comparable |
