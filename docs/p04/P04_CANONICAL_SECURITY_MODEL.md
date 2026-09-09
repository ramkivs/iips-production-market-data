# P04 — CANONICAL SECURITY MODEL

**SPECIFICATION ONLY.** Authority: **AD-1 ADAPTER MODEL** · **OI-08 RESOLVED (1:N)** · **OI-09 RESOLVED (FIGI/OpenFIGI)**
Derived from `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md` §G.2 and `docs/p01/P01_FIELD_DICTIONARY.md` §7.

> **No implementation.** No schema, DDL, migration or code is produced by this artifact.

---

## 1. Identity planes — restated, not re-decided

| Plane | Authoritative identifier | Owner |
|---|---|---|
| **Data plane** (this program) | Canonical security / issuer / listing IDs | **P04** |
| **Certified engine / CSIP boundary** | `companyId` — `NormalizedHolding.companyId` | **EXISTING-IIPS — UNTOUCHED** |

Crossing between planes happens **only** through the governed adapter
(`P04_IDENTITY_ADAPTER_CONTRACT.md`). P04 is **not** authorized as product-wide identity;
making it so requires a **new ADR** (`D4_05` §G.9).

---

## 2. Instrument / security entity

### 2.1 Canonical security ID — the program-internal anchor

| # | Rule |
|---|---|
| **CS-1** | Every security/instrument has a **canonical security ID**: **required, immutable, unique, program-internal** |
| **CS-2** | It is **never** a provider ID, **never** a vendor symbol, **never** a local ticker (`D4_05` §G.2) |
| **CS-3** | ⚠ It is **never a FIGI**. FIGI is an *external* identifier (§5); the canonical ID is **distinct from it** by authorized decision (**OI-09**) |
| **CS-4** | It is **never** a `companyId`, and never derived from one. `${sector}-H1` values are **not** valid canonical security IDs (**OI-08**) |
| **CS-5** | It is **immutable for life** — a lifecycle event never mutates it (see `P04_LIFECYCLE_AND_EFFECTIVE_DATING.md`) |
| **CS-6** | It is **opaque**: no semantic content may be parsed from it. No string munging, no convention-based derivation |

### 2.2 Required attributes

Per `D4_05` §G.2, carried forward unchanged and aligned to `P01_FIELD_DICTIONARY.md` §7:

| Attribute | Requirement | P01 slot | Notes |
|---|---|---|---|
| Canonical security ID | **Required, immutable, unique** | `<NS>identity.canonicalSecurityId` | §2.1 |
| Instrument type | Required | `<NS>identity.instrumentType` | Equity, depositary receipt, fund, index, etc. |
| Primary listing reference | Required where applicable | `<NS>identity.listingRef` | → §4, D10 |
| Currency | Required | — | Trading/quotation currency; P01 currency rules apply |
| Lifecycle status | Required | `<NS>identity.lifecycleStatus` | `active` \| `suspended` \| `delisted` \| `merged` \| `superseded` |
| Effective dates | Required | `<NS>identity.validFrom` / `.validTo` | **Every attribute is time-bounded** |
| Aliases | Required | — | Prior symbols/identifiers **with effective dates** |
| Source / provider | Required | — | Which provider **asserted** this identity (internal `provider` token, never surfaced) |
| Mapping provenance | Required | — | How the record was derived/reconciled — `P04_IDENTITY_ADAPTER_CONTRACT.md` §5 |
| Tenant / region / governance | Required where applicable | — | Per `DataGovernanceRuntime` classification (AD-11) |

**Slot discipline.** P01 defined these as *contract slots only* — *"the master is P04"*
(`P01_FIELD_DICTIONARY.md` §7 heading). P04 fills them; it **adds no new axis** and renames nothing.

---

## 3. Issuer / company / entity — and the 1:N relationship (OI-08)

### 3.1 Issuer entity

| Attribute | Requirement | P01 slot |
|---|---|---|
| Canonical issuer ID | Required, immutable, unique | `<NS>identity.canonicalIssuerId` |
| Issuer ↔ instrument relationship | Required, **cardinality-aware** | — |
| Sector classification | Required — **must reconcile with the existing certified taxonomy** | — |
| Lifecycle + effective dates | Required | — |

⚠ **Sector rule** (`D4_05` §G.6, unchanged): canonical issuer sector classification must **map
onto** the existing certified taxonomy and **must not redefine it**. Any mismatch is an explicit
mapping decision **with evidence — never a silent reclassification**, which would be a
methodology change under Ramki/Sai authority. Recorded as open item **OI-P04-01**.

### 3.2 OI-08 — authorized cardinality: **1:N**

| # | Rule (authorized) |
|---|---|
| **CD-1** | **One canonical company/entity identity MAY map to MULTIPLE securities / instruments / listings.** The relationship is **1:N**, not 1:1 |
| **CD-2** | **Each security/instrument has its own immutable canonical security ID** (CS-1). N securities under one issuer means **N distinct canonical security IDs** |
| **CD-3** | The **existing `companyId` remains the CSIP join key at the existing boundary** — see `P04_CSIP_NON_REGRESSION.md`. It is **not** redefined, removed or retyped |
| **CD-4** | ⚠ **The current synthetic `${sector}-H1` model is NOT forced into the new security master.** Sector labels are not entity identities. The master models real issuers and instruments; the synthetic values survive only as **adapter mapping targets** during transition (`D4_05` §G.5 step 3) |
| **CD-5** | The 1:N relationship is **effective-dated** — an instrument's issuer may change through corporate events (merger, spin-off). Issuer attribution is resolved **as of** a date |
| **CD-6** | 1:N applies equally along issuer → instrument, instrument → listing (§4) and issuer → listing (transitively) |
| **CD-7** | The adapter must state its cardinality rule **explicitly** (`D4_05` §G.3 "cardinality-explicit"); with OI-08 resolved, that rule is **1:N** and is stated in `P04_IDENTITY_ADAPTER_CONTRACT.md` §4 |

**Consequence recorded, not resolved here:** N-per-sector is a **product-behaviour change**
affecting `/api/company/:id` semantics, portfolio holdings cardinality, CSIP `holdings` counts
(tests assert `holdings 10` / `holdings 13`), UI02 routing and UI13 search space
(`D4_05` §G.7). P04 specifies the **identity model**; the downstream consumption changes belong
to **P11/P12/P13** and are carried as dependencies, not solved here.

---

## 4. Listing entity

| Attribute | Requirement |
|---|---|
| Canonical listing ID | Required, immutable, unique |
| Instrument reference | Required → §2 |
| Exchange/venue reference | Required → **D10**, `P04_EXCHANGE_VENUE_REFERENCE.md` |
| Local ticker / symbol | Required — ⚠ **explicitly NOT an authoritative identifier** |
| Trading currency | Required |
| Status | Required |
| Effective dates | Required |

| # | Rule |
|---|---|
| **LS-1** | One instrument may have **many listings** (multi-venue, dual-listed) — **1:N**, consistent with CD-1 |
| **LS-2** | `localSymbol` is **never** identity (`P01_IDENTITY_AND_LINEAGE` ID-6: *"A provider symbol is never an identity"*) |
| **LS-3** | Exactly **one primary listing** may be designated per instrument per effective-date window; primacy is effective-dated, not permanent |

---

## 5. External identifiers — OI-09 RESOLVED: FIGI / OpenFIGI

### 5.1 The authoritative standard

| # | Rule (authorized) |
|---|---|
| **XI-1** | **FIGI / OpenFIGI is the authoritative external security identifier standard for P04** |
| **XI-2** | ⚠ **The program-internal canonical security ID remains DISTINCT from FIGI.** FIGI is recorded *as an attribute of* a security; it **does not become** the canonical ID, and the canonical ID is **never** derived from it (CS-3) |
| **XI-3** | **ISIN / CUSIP / SEDOL** — and other identifiers — **MAY be represented as additional NON-AUTHORITATIVE identifiers where available.** They are carried for interoperability, reconciliation and display; **none is authoritative** |
| **XI-4** | ⚠ **Provider-native IDs and provider symbols are NEVER canonical identity** and are never promoted to authoritative status — see `P04_IDENTITY_ADAPTER_CONTRACT.md` §3 |
| **XI-5** | **Mapping provenance, uniqueness, effective dating and fail-closed unresolved mappings must be explicit** — §6, `P04_LIFECYCLE_AND_EFFECTIVE_DATING.md` §3, `P04_IDENTITY_ADAPTER_CONTRACT.md` §6 |
| **XI-6** | Absence of a FIGI does **not** license substituting another standard as authoritative. An unresolved FIGI is an **explicit unresolved state**, never a silent fallback |

### 5.2 Identifier record — required attributes

| Attribute | Requirement |
|---|---|
| Identifier **type** | Required — `FIGI` (**authoritative**) \| `ISIN` \| `CUSIP` \| `SEDOL` \| other approved (**non-authoritative**) |
| Value | Required |
| **Authority flag** | Required — exactly one type is authoritative, and it is **`FIGI`** |
| Source | Required — which provider/registry asserted it |
| Effective dates | Required — `validFrom` / `validTo` |
| Confidence | Required |

P01 slot: `<NS>identity.externalIdentifiers[]` (`P01_FIELD_DICTIONARY.md` §7).

> **Historical note, not a contradiction.** `P01_FIELD_DICTIONARY.md` §7 annotates that slot
> *"⚠ OI-09 — no standard is assumed authoritative"*, and `D4_05` §G.2 says the same. Those
> statements were **accurate when written** — OI-09 was open. **OI-09 is now RESOLVED by explicit
> program authority in favour of FIGI/OpenFIGI.** Per the standing rule, those accepted
> historical artifacts are **NOT edited**; this artifact records the current authoritative state
> alongside them.

### 5.3 FIGI granularity

| # | Rule |
|---|---|
| **XI-7** | OpenFIGI distinguishes share-class, composite and venue-level identifiers. Each FIGI recorded **must carry its granularity**, and a FIGI of one granularity is **never** treated as equivalent to another |
| **XI-8** | Venue-level FIGIs attach to **listings** (§4); share-class/composite FIGIs attach to **instruments** (§2). Attaching one at the wrong level is a validation failure (`P04_VALIDATION_RULES.md` §3) |

---

## 6. Uniqueness constraints

Carried forward verbatim in substance from `D4_05` §G.2, extended for the resolved decisions:

| # | Constraint |
|---|---|
| **U-1** | Canonical security ID **unique and immutable for life** |
| **U-2** | **(identifier-type, value) unique within an effective-date window** — identifiers are reissued over time, so uniqueness is **time-bounded**, never absolute |
| **U-3** | **(venue, local symbol) unique within an effective-date window** |
| **U-4** | **Reuse of a retired symbol by a different instrument must NOT collide** — a violation is a **hard error**, never silent reassignment |
| **U-5** | Canonical issuer ID unique and immutable for life |
| **U-6** | Canonical listing ID unique and immutable for life |
| **U-7** | **(FIGI, granularity) unique within an effective-date window.** Because FIGI is authoritative (XI-1), a duplicate authoritative identifier is a **hard error**, never a merge heuristic |
| **U-8** | Per instrument per effective-date window, **at most one primary listing** (LS-3) |
| **U-9** | ⚠ **1:N does not weaken uniqueness.** Many instruments per issuer is expected (CD-1); many issuers per instrument is **not**, within one effective-date window |

---

## 7. What this artifact does not do

| # | Exclusion |
|---|---|
| N-1 | No storage model, schema, DDL, index or migration |
| N-2 | No provider selected; no OpenFIGI integration, endpoint, credential or licence implied (entitlement matrix remains **EMPTY**, INV-10) |
| N-3 | No corporate-action adjustment logic — **P08** |
| N-4 | No change to `companyId` semantics — `P04_CSIP_NON_REGRESSION.md` |
| N-5 | No new version axis — **six axes, no seventh** (INV-3) |
| N-6 | No certification, no activation |
