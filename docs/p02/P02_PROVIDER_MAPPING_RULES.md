# P02 — PROVIDER-TO-CANONICAL MAPPING RULES

**SPECIFICATION ONLY.** The **rules** of mapping are defined here; the **normalization
runtime** is P06 and **acquisition** is P05. No provider-specific mapping exists, because no
provider is selected.

---

## 1. The containment rule

| # | Rule |
|---|---|
| M-1 | **Provider-specific schemas, field names, symbols, enums, units, time conventions and error codes exist ONLY inside the adapter.** |
| M-2 | **The adapter's output boundary is the P01 canonical schema.** Nothing provider-shaped crosses it |
| M-3 | **No provider-specific field name may appear** in a canonical snapshot, a lineage record, an engine input, a DTO, a UI surface or an evidence artifact |
| M-4 | A provider field with no canonical counterpart is **dropped inside the adapter** and recorded as a `knownLimitation`. **It is never smuggled through** in a free-form bag, `extras` map, metadata blob or provenance string |
| M-5 | Conversely, a canonical slot the provider cannot supply is **not** emitted with a fabricated value — it is `NOT_PROVIDED` |
| M-6 | The mapping is **declared** — inspectable as data, not buried in imperative code |

---

## 2. Semantic-preservation obligations

The mapping must preserve, without loss and without silent alteration:

### 2.1 Timestamps

| # | Rule |
|---|---|
| T-1 | All five P01 times are preserved distinctly: `asOf`, `receivedAt`, `observationTime`, `effectiveTime`, `publicationTime`. **Collapsing any two is prohibited** |
| T-2 | A provider that supplies only one timestamp may populate **only** the slot it actually means. The others are **absent, not inferred** |
| T-3 | Conversion to ISO-8601 UTC is explicit; a provider's local-time value is converted using the **declared** venue/provider timezone, and the conversion is recorded |
| T-4 | Provider-declared precision is preserved up to the canonical declared precision; **truncation is a declared transformation**, never incidental |
| T-5 | `receivedAt` is stamped once at ingest — **never** taken from the provider payload |
| T-6 | A provider timestamp of ambiguous meaning is a `knownLimitation` and, if it cannot be assigned to a slot, an **E8 `CONTRACT_MAPPING_FAILURE`** |

### 2.2 Currency

| # | Rule |
|---|---|
| C-1 | Provider currency tokens are mapped to **ISO-4217**; unmappable tokens ⇒ **E8** |
| C-2 | A monetary value whose currency cannot be established is **E8** — **never defaulted**, never inferred from the venue |
| C-3 | Venue quotation currency may **inform a declared mapping** but is never a silent substitute |
| C-4 | **No implicit FX conversion.** Any conversion is explicit, produces a **new field**, never overwrites the source-currency field, and records rate, rate source and rate as-of |
| C-5 | Minor-unit conventions (pence, cents) are handled by an explicit declared **scale**, never by convention or magnitude inspection |

### 2.3 Units

| # | Rule |
|---|---|
| U-1 | Provider units map to the **declared, versioned canonical enumeration**; free-text units are never propagated |
| U-2 | An unmappable unit ⇒ **E8** |
| U-3 | Percent vs fraction is an **explicit declared** mapping per field. **Never inferred from magnitude** |
| U-4 | Reporting scale (units/thousands/millions/billions) is explicitly declared. **Never inferred from magnitude** |
| U-5 | Unit conversion is a declared transformation recorded in lineage |
| U-6 | A dimensionless canonical slot must never receive a unit; a dimensioned slot must never lack one |

### 2.4 Precision

| # | Rule |
|---|---|
| P-1 | Source precision is preserved; the adapter may not truncate to a display precision |
| P-2 | **No silent rounding.** Any rounding is a declared transformation recorded in lineage |
| P-3 | Every mapped `decimal` carries a declared `precision`; absence ⇒ **E8** |
| P-4 | Decimal semantics are exact for monetary and ratio values; representation that loses source fidelity is prohibited |
| P-5 | Canonical numeric formatting is stable — required for byte-stable snapshot identity |

### 2.5 Availability

| # | Rule |
|---|---|
| AV-1 | The five-value P01 enum is preserved exactly: `PRESENT`, `NULL_ASSERTED`, `NOT_APPLICABLE`, `NOT_PROVIDED`, `WITHHELD` |
| AV-2 | **A provider's explicit null maps to `NULL_ASSERTED`; provider silence maps to `NOT_PROVIDED`.** Conflating assertion with silence is prohibited |
| AV-3 | A provider sentinel (`-1`, `0`, `""`, `"N/A"`, `9999`) is mapped to the correct marker by **declared** rule — **never** passed through as a value |
| AV-4 | Entitlement suppression maps to `WITHHELD` with an `entitlementRef`, never to `NOT_PROVIDED` |
| AV-5 | A field inapplicable to the instrument maps to `NOT_APPLICABLE`, distinct from absence |

### 2.6 Quality

| # | Rule |
|---|---|
| Q-1 | `quality` is derived from the **actual** outcome; a provider's own quality claim is evidence, not the answer |
| Q-2 | `completenessPct` is computed against the **contracted request field set** |
| Q-3 | Field-level quality may only be equal to or worse than snapshot-level |
| Q-4 | **Quality is never improved by mapping.** Filling a gap with a derived or carried value is prohibited |
| Q-5 | A mapping failure is **E8**, not a quality downgrade |

### 2.7 Provenance and lineage

| # | Rule |
|---|---|
| L-1 | Every mapped field's `provenance` resolves into the snapshot's lineage block |
| L-2 | Lineage records `sourceRef`, `adapterId`, `adapterVersion`, `transformationChainRef`, `receivedAt`, `namespaceVersion`, and the conditional elements |
| L-3 | **Every declared transformation** (unit, currency, scale, rounding, timezone, sentinel substitution) appears in the transformation chain |
| L-4 | Lineage is reconstructible **from the record alone** — no provider round-trip |
| L-5 | Multi-source snapshots retain **per-source** attribution; flattening is prohibited |
| L-6 | Lineage carries **no** credential, endpoint or unredacted payload |

---

## 3. Identity mapping — strictly bounded

| # | Rule |
|---|---|
| I-1 | The adapter maps a provider-native symbol **to an identity request**, never to a canonical identity directly |
| I-2 | **Canonical identity resolution is P04.** The adapter consumes the result; it never performs, caches or approximates resolution |
| I-3 | `identityMappingVersion` is **passed through**, never originated by the adapter |
| I-4 | `mappedCompanyId` is written **only** by the P04 adapter — the data plane may not write it (P01 RF-3) |
| I-5 | **The AD-1 boundary is preserved:** the certified `NormalizedHolding.companyId` CSIP join key is untouched |
| I-6 | A provider symbol is **never** an identity, never a join key, never a fallback identity |
| I-7 | ⚠ **OI-09** (external identifier standard) is **OPEN** — which identifier kinds an adapter may accept as input is **not decided here** |
| I-8 | ⚠ **OI-08** (cardinality 1 → N) is **OPEN** — mapping does not constrain or presume cardinality |

---

## 4. Namespace application — ⚠ blocked on OI-10

| # | Rule |
|---|---|
| N-1 | The adapter applies the field namespace **at the canonical-mapping layer** — this is *where* it happens, and that is decided |
| N-2 | Every emitted canonical key carries the namespace (ADR-01 C1) |
| N-3 | The `<NS>` placeholder is used throughout; **the literal token is NOT chosen** |
| N-4 | **`MD:<domain>.<field>` is NOT adopted.** OI-10 remains `APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING` |
| N-5 | A namespaced canonical field is **never** merged into an engine input by name coincidence; engine-input mapping is an explicit declared transformation owned by **P11** |
| N-6 | ⚠ **BLOCKED (DEP-P02-01):** emitting literal canonical keys and mechanically executing C1/C2 partition checks cannot proceed until the token is recorded |

---

## 5. Mapping declaration requirements

Each mapping entry declares:

| # | Element |
|---|---|
| MD-1 | Canonical field slot (from `P01_FIELD_DICTIONARY.md`) |
| MD-2 | Provider-native source element (**internal to the adapter**) |
| MD-3 | Transformation chain, ordered |
| MD-4 | Unit / currency / scale / precision handling |
| MD-5 | Timestamp slot assignment |
| MD-6 | Sentinel and null handling → `availability` |
| MD-7 | `pitEligible` disposition |
| MD-8 | Known fidelity limitations |

| # | Rule |
|---|---|
| MR-1 | Mapping is a **pure, deterministic function** of the payload plus declared configuration |
| MR-2 | An undeclared mapping is **prohibited** — no heuristic, fuzzy or name-similarity matching |
| MR-3 | A mapping change is at least an `adapterVersion` MINOR change; an output-changing mapping change is MAJOR |
| MR-4 | Mapping declarations are reviewable **without reading code** |
| MR-5 | **Mapping execution is P06.** P02 defines only the rules the execution must obey |
