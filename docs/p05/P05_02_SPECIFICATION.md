# P05-02 — LIVE MARKET-DATA ADAPTER SPECIFICATION AND ADAPTER CONTRACT

**Phase:** P05 — Market Data Acquisition & Ingestion · **Work item:** `P05-02` — *LIVE market adapter*
**Authorization:** `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` §3 **A-2** — commit `31c26553554f021928a4f9e4f41b6ee90cdfa453`
**Baseline:** P05-01 implemented and evidenced at `bf66c99cec1f7e43ae4dbc3ab5e77c23a27b014d`
**Contract:** `P05-02-LIVE-MARKET-DATA-ADAPTER-CONTRACT` **v1.0** · rule prefix **`LA-`** (LA-1…LA-31)
**Executable surface:** `p05/src/liveAdapterContract.js` · validated by `p05/tests/adapter-contract.test.js`
**Evidence:** `p05/evidence-p05-02/` (13 files) · `docs/p05/P05_02_EVIDENCE.md`
**Open items:** `docs/p05/P05_02_OPEN_ITEMS.md`

> ## ⚠ STATUS — READ BEFORE QUOTING ANYTHING BELOW
>
> | Statement | Value |
> |---|---|
> | **P05** | **AUTHORIZED / NOT_ACCEPTED** (no `P05_GATE_ACCEPTANCE.md` exists) |
> | **P05-01** | IMPLEMENTED / EVIDENCED |
> | **P05-02** | **SPECIFICATION + ADAPTER-CONTRACT COMPLETE** · **LIVE EXECUTION NOT AUTHORIZED** |
> | **P05-03** | Specification only authorized — not started |
> | **P05-04** | **NOT AUTHORIZED** (D9 N-3) |
> | **Certification** | `NONE_GRANTED` |
> | **Production activation** | `NOT_AUTHORIZED` |
>
> **No provider is selected, named, contacted or bound. No credential is provisioned. No live
> ingestion is performed. Nothing here claims that "authenticated ingestion works".**

---

## 1. What D9 A-2 authorizes, and the four-layer distinction

D9 §3 **A-2** authorizes, verbatim: *"**Specification and adapter-contract only** — contract shape,
conformance rules, entitlement/secret **requirements**, error taxonomy mapping, observability
requirements. ⚠ **No live provider execution**."*

Four distinct layers are engaged by the words "adapter work". **Only the first two are authorized.**
This distinction is asserted in code as `AUTHORIZATION_MATRIX` (LA-29) and is not a matter of
interpretation.

| # | Layer | What it is | Authorized? | Authority |
|---|---|---|---|---|
| **1** | **ADAPTER SPECIFICATION** | This document — the provider-neutral specification of what a live market-data adapter must satisfy | ✅ **YES** | D9 A-2 |
| **2** | **ADAPTER CONTRACT** | The executable conformance surface (`p05/src/liveAdapterContract.js`) plus offline contract-validation tests | ✅ **YES** | D9 A-2 |
| **3** | **PROVIDER-SPECIFIC CONFIGURATION** | A real provider identity, endpoint binding, wire-schema binding, entitlement values, ISO-4217 vocabulary, credentials | ❌ **NO** | D9 **N-1** — provider selection **NONE MADE**; entitlement matrix **EMPTY** (INV-10); credentials **NONE**; P16 authority not held |
| **4** | **LIVE PROVIDER EXECUTION** | Contacting a provider, authenticating, ingesting live quotes/prices | ❌ **NO** | D9 **N-1** — *"⚠ No live provider execution"* |

### 1.1 Consequence for the tracker

`Work Tracker!P05-02` requires:

| Tracker column | Required value | Satisfied by this work? |
|---|---|---|
| **Exit Criteria** | *"Authenticated ingestion works"* | ❌ **NO** — requires layer 4 |
| **Test / Validation** | *"Integration tests"* | ❌ **NO** — requires a provider |
| **Evidence** | *"Provider evidence"* | ❌ **NO** — requires a provider |

**These three remain UNMET and are recorded as `BD-P05-02-01…03`.** The tracker does **not** treat a
local contract test as an integration test, so per the governing instruction this work is classified
**CONTRACT VALIDATION ONLY** throughout. No P05-02 exit criterion is claimed.

---

## 2. Method — reuse, not redesign

### 2.1 What was read before anything was written

The contract below is derived from the accepted artifacts, not from a new model:

| Source | What was taken from it |
|---|---|
| `docs/p02/P02_PROVIDER_ABSTRACTION_CONTRACT.md` | Boundary rules **B-1…B-6**; adapter obligations **A-1…A-25**; determinism **D-1…D-6**; entitlement summary **E-1…E-6**; snapshot/lineage **S-1…S-9** |
| `docs/p02/P02_PROVIDER_CAPABILITY_MODEL.md` | Declaration elements **C-1…C-18**; declaration rules **CD-1…CD-6**; request gate **CE-1…CE-8**; fail-closed **UC-1…UC-5** |
| `docs/p02/P02_PROVIDER_MAPPING_RULES.md` | Containment **M-1…M-6**; timestamps **T-1…T-6**; currency **C-1…C-5**; units **U-1…U-6**; identity **I-1…I-8**; namespace **N-1…N-6**; mapping declaration **MD-1…MD-8**, **MR-1…MR-5** |
| `docs/p02/P02_ENTITLEMENT_MODEL.md` | Dimensions **EN-1…EN-12**; environment **EE-1…EE-4**; evaluation **EV-1…EV-8**; representation **RD-1…RD-3**; matrix **EM-1…EM-4**; secrets **SP-1…SP-6** |
| `docs/p02/P02_ERROR_TAXONOMY.md` | **E1–E8**, dispositions, failure-record content **F-1…F-11** |
| `docs/p02/P02_OBSERVABILITY_REQUIREMENTS.md` | Attempt record **R-1…R-15**; linkage **SL-1…SL-4**; derivable metrics **M-1…M-9**; redaction **RD-1…RD-6**; product boundary **PB-1…PB-5** |
| `docs/p02/P02_PROVIDER_IDENTITY_VERSIONING.md` | **PI-1…PI-8**, **AV-1…AV-6**, **VX-1…VX-4**, **SM-1…SM-4**, **SI-1…SI-5**, **PG-1…PG-5** |
| `docs/p02/P02_COMPATIBILITY_AND_SUBSTITUTION.md` | **CT-1…CT-3**, **CR-1…CR-3**, **IC-1…IC-5**, **PS-1…PS-10**, **SN-1…SN-5** |
| `docs/p04/P04_IDENTITY_ADAPTER_CONTRACT.md` | **ADP-1…ADP-8**, **PN-1…PN-6**, **MC-1…MC-7**, **MP-1…MP-5**, **FC-1…FC-7**, **SEC-1…SEC-5** |
| `docs/p04/P04_LIFECYCLE_AND_EFFECTIVE_DATING.md` | Five lifecycle states; **LC-1…LC-6** |
| `docs/p04/P04_EXCHANGE_VENUE_REFERENCE.md` | **VN-1…VN-5**; required venue attributes |
| `docs/p01/P01_FIELD_DICTIONARY.md` | Envelope slots (§1); per-field slots (§2); D01 (§3); D10 (§12); **FD-1…FD-6** |
| `docs/p01/P01_VALIDATION_RULES.md` | **S1–S4** stages (ST/NL/SM/RF/RJ) |
| `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md` | **C1–C6** — **UNCHANGED** |
| `docs/CHECKPOINT-03.md` §3 | **OI-10** — token `MD:`, form `MD:<domain>.<field>` |
| `p05/src/*.js` (P05-01) | The canonical envelope, namespace, identity, validation, error, serialization and replay surfaces — **imported, never re-implemented** |

### 2.2 ⚠ Label disambiguation — a real hazard in this corpus

Several accepted documents reuse the same short labels for different rules. Every citation in this
specification therefore names its owning document. The collisions that actually matter here:

| Label | Owner A | Owner B | Owner C |
|---|---|---|---|
| `M-1…M-6` | `P02_PROVIDER_MAPPING_RULES` (containment) | `P02_OBSERVABILITY` (derivable metrics) | **Program-level** M-1 / M-5 / M-6 (existing-IIPS) |
| `RD-1…RD-6` | `P02_ENTITLEMENT_MODEL` (representation of a denial) | `P02_OBSERVABILITY` (redaction) | — |
| `C-1…C-18` | `P02_PROVIDER_CAPABILITY_MODEL` (declaration elements) | `P02_PROVIDER_MAPPING_RULES` **C-1…C-5** (currency) | `ADR-01` **C1–C6** (collision guard, no hyphen) |
| `S-1…S-9` | `P02_PROVIDER_ABSTRACTION_CONTRACT` (snapshot/lineage) | `P01_VALIDATION_RULES` **S1–S4** (stages, no hyphen) | `P02_COMPATIBILITY` **SN-1…SN-5** |
| `N-1…N-10` | `P02_PROVIDER_MAPPING_RULES` (namespace) | D9 §3.1 **N-1…N-7** (not authorized) | — |

**The `LA-` prefix was verified unused** across `docs/` and `p05/` before adoption, so no rule in
this package collides with an existing one.

---

## 3. The contract

### A. Provider adapter boundary

| # | Rule | Authority |
|---|---|---|
| **LA-2** | Two provider kinds exist: `LOCAL_FIXTURE` and `LIVE`. The live surface is required **only** for `LIVE`. A `LOCAL_FIXTURE` adapter is permanently out of scope for P05-02 and **cannot** satisfy it. | D9 A-2 / N-1 |
| **LA-3** | `snapshot(request)` is the **sole public ingress** (`MarketDataSource<T>`). The phases below are the adapter's **internal** decomposition, **not** a second ingress contract. | P02 **B-4**, AD-2 |
| **LA-17** | An adapter's surface is checked structurally. `requirePhases: true` demands each phase be individually callable (harness-driven validation); `requirePhases: false` demands only the sole ingress, because LA-3 permits **inline** factoring — which is how P05-01 is built. | P02 B-3, B-4 |

The boundary itself is unchanged from P02 §2: provider-native shapes exist **only** inside the
adapter (**B-1**); the output boundary is the P01 canonical contract (**B-2**); adapters are
replaceable behind `MarketDataSource<T>` (**B-3**); no second ingress (**B-4**); an adapter never
reaches an engine, DTO or UI (**B-5**); provider-native identifiers are never canonical identity
(**B-6**).

**The phase decomposition (LA-3, LA-4):**

| Order | Phase | Operation | Live only | Performs I/O | Failure class |
|---|---|---|---|---|---|
| 1 | declare | `declare()` | — | no | — |
| 2 | preflight | `preflight()` | — | no | **E6** |
| 3 | entitlement | `checkEntitlement()` | ✅ | no | **E3** |
| 4 | authenticate | `authenticate()` | ✅ | **yes** | **E2** |
| 5 | fetch | `fetch()` | ✅ | **yes** | **E1 / E4 / E5 / E7** |
| 6 | normalize | `normalize()` | — | no | **E5** |
| 7 | map | `map()` | — | no | **E8** |
| 8 | validate | `validate()` | — | no | **RJ** (P01 S1–S4) |
| 9 | emit | `emit()` | — | no | — |

**LA-4 — the gate order is capability → entitlement → authentication → acquisition.** This
*reproduces the existing* `CLASSIFICATION_GATE_ORDER` (`E6 → E3 → E2 → E1`) rather than inventing an
order, and honours **EV-1** (entitlement is evaluated before acquisition). Authentication is not
acquisition, so evaluating entitlement against the governed register *before* authenticating is both
permitted and preferable: default-deny on the governance record means an unentitled request never
reaches a provider at all.

### B. Provider-native input isolation

| # | Rule | Authority |
|---|---|---|
| **LA-18** | Any occurrence of declared provider-native vocabulary in a canonical snapshot, lineage block, evidence record or contract-level error record is a **hard violation**. Detection is over the **canonical JSON serialization**, so nested lineage and provenance strings are covered, not just top-level keys. | A-19, **M-3**, **M-4**, RD-3…RD-5 |
| — | A native field with no canonical counterpart is **dropped inside the adapter** and recorded as a `knownLimitation`. It is never smuggled through a free-form bag, `extras` map, metadata blob or **provenance string**. | **M-4** |
| — | Elements the adapter does not consume are **recorded as ignored** (`R-15`); silent discard is prohibited. | **IC-4** |

### C. Canonical output boundary

| # | Rule | Authority |
|---|---|---|
| **LA-27** | The canonical output boundary **is** the P05-01 surface, re-exported unchanged (`buildSnapshot`, `validateSnapshot`, `buildKey`, `assertC1…assertC4`, `assertCollisionGuard`, `canonicalJson`, `canonicalDigest`, `failureRecord`, `ClassifiedFailure`, `ErrorClass`, `DISPOSITION`). `forked: false` is asserted. **Nothing is re-implemented and no competing envelope exists.** | P02 B-2, **SN-4** |
| — | The adapter produces an **immutable, versioned** `DataSnapshot<T>` — the sole product of the boundary. | **S-1**, A-16, A-22 |
| — | `snapshotId` = `data-${provider}-${dataVersion}-${asOf}` — **format frozen**. | **S-2**, **SI-1**, AD-6 |
| — | `data-*` is **never** conflated with engine-layer `SNAP_*`. | **S-3**, **SI-2** |
| **Absence semantics** | Three distinct states, never conflated: value present → `PRESENT`; explicit null → `NULL_ASSERTED`; key absent → `NOT_PROVIDED`; unentitled → `WITHHELD` with an `entitlementRef`. | **NL-1**, **NL-4**, **NL-5**, **RD-1**, A-20 |

### D. schema / version capture — the six axes

| Axis | Versions | Owner | Recorded at |
|---|---|---|---|
| `dataVersion` | Content vintage from the provider | provider / adapter-derived | envelope + `snapshotId` |
| `adapterVersion` | The code that mapped it | this program | **lineage** (**SI-4**: never in `snapshotId`; **SI-5**: mandatory in lineage) |
| `providerSchemaVersion` | The provider's wire schema | provider | attempt record `R-3` |
| `schemaVersion` | The canonical P01 schema | P01 | envelope |
| `namespaceVersion` | The namespace scheme | ADR-01 | envelope + lineage |
| `identityMappingVersion` | The AD-1 mapping | **P04** | envelope + lineage (**VX-4**: passed through, never originated) |

**None may be substituted for another (VX-1…VX-4).** The compatibility triple (**CT-1…CT-3**) is
declared, never negotiated at runtime (**CR-1**), recorded on every snapshot (**CR-2**), and its
failure is a rejection, never a best-effort degradation (**CR-3**).

> ⚠ **Honest note.** Independence means *separately populated slots with separate owners* — **not**
> that the literal strings happen to differ. In the contract-validation run `adapterVersion` and
> `namespaceVersion` are both `"1.0"`. That is a numbering coincidence, not a conflation. Independence
> is proven by showing that an `adapterVersion` bump moves **only** `adapterVersion`, and — per
> **SI-4** — leaves `snapshotId` unchanged.

### E. Provenance

Every field carries a `provenance` **reference into the snapshot lineage block** (**RF-7**), so the
link is mechanically checkable. The lineage block is complete on every snapshot (**S-5**, **RF-6**):
`sourceRef`, `adapterId`, `adapterVersion`, `transformationChainRef`, `receivedAt`,
`namespaceVersion`, plus conditional `identityMappingVersion` (**L-9**) and `fieldProvenance`.
Provider identity is **never flattened away in lineage** (**S-7**, **PI-7**), and **never reaches a
product DTO or UI** (**PI-6**, **PB-2**).

### F. `receivedAt` / `asOf` handling

| # | Rule | Authority |
|---|---|---|
| — | `asOf` is the market-data time; `receivedAt` is the ingest time. All five P01 times are preserved distinctly — collapsing any two is prohibited. | **T-1** |
| **LA-25** | `receivedAt` is taken from the request and **never recomputed** by the adapter or the runner. The runner reads no clock. | **D-4**, **TS-6** |
| — | A provider that supplies only one timestamp populates **only** the slot it actually means; the others are **absent, not inferred**. | **T-2** |
| — | `receivedAt` is **never** taken from the provider payload. | **T-5** |
| — | A timestamp of ambiguous meaning that cannot be assigned to a slot is **E8**. | **T-6** |

### G. Identity resolution and mapping

| # | Rule | Authority |
|---|---|---|
| — | The adapter maps a provider-native symbol **to an identity request**, never to a canonical identity directly. Resolution is **P04**; the adapter consumes the result and never performs, caches or approximates it. | **I-1**, **I-2** |
| — | `identityMappingVersion` is **passed through**, never originated. `mappedCompanyId` is written **only** by the P04 adapter. The AD-1 boundary and the certified `NormalizedHolding.companyId` CSIP join key are untouched. | **I-3**, **I-4**, **I-5**, **VX-4** |
| — | A provider symbol is **never** an identity, never a join key, never a fallback identity. | **I-6**, **PN-2**, ID-6 |
| — | Cardinality is **1:N** (**OI-08 RESOLVED**). `canonical → companyId` is an **N:1 projection** and is expected, not an error. It must never be used to invent, merge or collapse canonical identities. | **MC-1…MC-4** |
| — | An unmapped canonical identity **FAILS CLOSED**: no coercion, no placeholder, no synthesised `companyId`, no empty string, no `null` join key. The failure is deterministic, names the unresolved element, is **not** a quality state, and is **not E1**. | **FC-1…FC-7** |
| — | **E1–E8 is UNCHANGED** — no class is added, removed or reclassified. Only **E1** is quality-bearing; identity failure is **not E1**. | **FC-6**, INV-6 |

### H. Namespace enforcement

**OI-10 is RESOLVED and is used exactly as recorded** — token **`MD:`**, form **`MD:<domain>.<field>`**
(`docs/CHECKPOINT-03.md` §3). Every emitted key carries the namespace (**C1**, **FD-1**); no
`companyInputs` key may carry it (**C2**); the intersection must be empty (**C3**); pairwise
contributing-snapshot intersections must be empty (**C4**); any violation **aborts** (**C5**); merge
order is canonical (**C6**). **C1–C6 are UNCHANGED.** Domain segments come from the accepted
dictionary — **none is invented** (D9 **N-6**). Accepted P01/P02 `<NS>` records were **not** rewritten
(D9 **N-7**).

### I. Venue representation

Venue identity is **MIC-based** (**VN-1**). A venue is **reference data, not an instrument**
(**VN-2**). **Operating MIC and segment MIC are never interchangeable** (**VN-3**) — the
contract-validation fixtures exercise both (`XSYN` `OPERATING_MIC`, `XSYNSG1` `SEGMENT_MIC`). Venue
identity is program-internal-stable and **effective-dated** (**VN-4**).

> **A provider's venue/exchange code is never venue identity** (**VN-5**, **PN-4**). It may be
> recorded as a non-authoritative alias. Consequently `MD:price.venueRef` is taken from the
> **P04-resolved venue reference**, never from the provider payload — and this is tested by making
> the two disagree.

### J. Lifecycle representation

The enumeration is the five values fixed by `D4_05` §G.2 and `P01_FIELD_DICTIONARY` §7 — `active`,
`suspended`, `delisted`, `merged`, `superseded` — **none added**. Lifecycle state is
**effective-dated** (**LC-1**); a transition **never mutates the canonical security ID** (**LC-2**);
identities are **never deleted** (**LC-3**); `merged`/`superseded` require a successor reference
(**LC-4**); transitions are audit-logged (**LC-5**); and a state is **never inferred from absence of
data** (**LC-6**) — missing provider data is not a delisting.

> ⚠ **Honest coverage statement.** The vocabulary is carried and validated, but the P05-01 fixtures
> exercise only **2 of the 5** states (`active`, `delisted`). `suspended`, `merged` and `superseded`
> are **unexercised**. This is recorded as **BD-P05-02-07** and is **not** claimed as complete.

### K. Error classification

**E1–E8 is UNCHANGED** (**FC-6** / INV-6). Dispositions are exactly as accepted:

| Class | Label | Kind | Produces snapshot | Retryable |
|---|---|---|---|---|
| **E1** | `PROVIDER_UNAVAILABLE` | **Data condition** | ✅ **the only one** (`quality: 'unavailable'`, empty fields per **ST-9**) | no |
| **E2** | `AUTHENTICATION_FAILURE` | Rejection | no | no |
| **E3** | `ENTITLEMENT_FAILURE` | Rejection | no | no |
| **E4** | `TRANSIENT_FAILURE` | Rejection | no | **yes** |
| **E5** | `MALFORMED_RESPONSE` | Rejection | no | no |
| **E6** | `UNSUPPORTED_CAPABILITY` | Rejection (**pre-flight**) | no | no |
| **E7** | `RATE_LIMIT_FAILURE` | Rejection | no | **yes** |
| **E8** | `CONTRACT_MAPPING_FAILURE` | Rejection | no | no |

**E5 is evaluated before E8** (**A-13**, CL-6): a payload violating the declared provider wire schema
is malformed; a well-formed payload that cannot be mapped is a mapping failure. **E6 is pre-flight** —
no provider call occurs (**A-10**). **E3 is a contract condition, not a data condition**, so it is
never `quality: 'unavailable'` (**RD-3**). Ambiguous failures are classified by the earliest gate
(**CL-7** / `CLASSIFICATION_GATE_ORDER`). Every rejection produces a complete **F-1…F-11** record.

> ⚠ **Required vs optional wire elements is a real distinction.** An **absent OPTIONAL** element is
> provider **silence** → `NOT_PROVIDED` — a *data* condition. An **absent REQUIRED** element is a
> schema violation → **E5** — a *contract* condition (**IC-5**). Modelling silence as E5 would
> conflate the two, which `P02_ERROR_TAXONOMY` §2 forbids.

### L. Retry / error semantics — **contract level only**

**LA-28.** The contract states **which** classes may be retried and **what a retry must not do**. It
implements **no** scheduling, backoff, checkpointing or idempotent re-delivery — those are **P05-04**,
which **D9 does NOT authorize (N-3)**.

| Statement | Content |
|---|---|
| Retryable classes | **E4**, **E7** only |
| Retry-prohibited | **E2, E3, E5, E6, E8** (**ES-4** — retrying a deterministic failure is prohibited) |
| E4 / E7 escalation | May degrade to **E1** under policy, and any escalation **must be recorded** (**R-11**, MQ **M-6**) — never silent |
| Snapshot immutability | A retry must not mutate an already-emitted snapshot (**A-22**); a correction is a **new `dataVersion`** |
| Idempotency | Identical `(provider, dataVersion, asOf)` must yield the identical `snapshotId` (**D-1**) |
| **Owner of execution** | **P05-04 — NOT AUTHORIZED (D9 N-3)** |

### M. Entitlement / authentication contract surface

| # | Rule | Authority |
|---|---|---|
| **LA-6**, **LA-22** | Outcomes are `ENTITLED / DENIED / EXPIRED / UNKNOWN / PARTIAL`. **Default deny** — absent, expired, `UNKNOWN` or unevaluable **denies**. | **EV-3** |
| — | A denial is **fail-closed**: no data, no partial data, no cached substitute, no degraded approximation. It is an **explicit classified state**, never an empty success. | **EV-4**, **EV-5** |
| — | Entitlement is **never inferred from a successful provider response**. | **EV-7** |
| — | `ENTITLED` without an `entitlementRef` denies — a decision must be **evidence-bearing**. | **EV-6** |
| — | `PARTIAL` yields the entitled fields **plus explicit `WITHHELD` markers** carrying an `entitlementRef`; `completenessPct` is reduced. This is **not** silent narrowing. | **EV-8**, **RD-1**, **RD-2**, **NL-5** |
| — | **`WITHHELD` is never conflated with `NOT_PROVIDED`.** Suppression and silence are different facts, and are counted separately (**MQ M-5**). | **RD-1** |
| **LA-5** | Authentication outcomes are `AUTHENTICATED / FAILED / NOT_REQUIRED`. **A `LIVE` adapter may not report `NOT_REQUIRED`** — a live source establishes identity or fails **E2**. `NOT_REQUIRED` is legal only for `LOCAL_FIXTURE`. | E2 |
| — | The entitlement matrix is **EMPTY** (**EM-2**), which means **nothing is entitled** (**EM-4**). Populating it requires provider selection (no authority recorded) and licensing (**P16**) — **EM-3**. | **EM-1…EM-4** |

### N. Credential / secrets-flow contract surface

| # | Rule | Authority |
|---|---|---|
| **LA-21** | The data plane may know only: `credentialRef` (opaque), `kind` (from a declared vocabulary), `storageClass`, `scopes`, `rotationPolicy`. **The credential value is never a parameter and never appears in the output.** `valuePresent: false` and `endpointPresent: false` are asserted, and `status: 'REQUIREMENT_ONLY'`. | **SP-5** |
| — | Credentials and secrets are **P03**. P05-02 defines only *that* an entitlement decision occurs and *how its outcome is represented*. | **E-1** |
| — | No credential, key, token, secret, endpoint, hostname or account identifier in any declaration, contract artifact, fixture, log, evidence record or observability output. | **SP-1…SP-4**, **A-23**, **SM-4**, **RD-1**, **RD-2** |
| **LA-20** | The secret boundary is checked **two ways**: the P05-01 regex scanner **plus** a **structural walk** over keys and values. A `*Ref` / `*Requirement` key is a reference and is permitted; a bare credential-shaped value key is not. | see below |
| **LA-19** | The contract module itself imports no transport or process-spawning module, reads no wall clock, no random source and no ambient state, and contains no key material. | A-23 |

> ⚠ **BD-P05-02-06 — a measured blind spot, recorded rather than worked around.** The P05-01 regex
> scanner detects credential material in **source-assignment** form (`key = "value"`) but **not** in
> **serialized-JSON** form (`{"key":"value"}`), because a quote sits between the key and the colon and
> a regex over text cannot see structure. **LA-20's structural walk does detect it.** The two checks
> are complementary; neither alone is sufficient. Repairing the P05-01 scanner is out of P05-02 scope.

### O. Freshness metadata

**LA-10, LA-23.** An adapter reports freshness **inputs** — `asOf`, `receivedAt`, venue session
reference, completeness basis — and the derived age. It sets **no threshold, no verdict and no SLO**.
Thresholds are **P07** (**MQ-1**, **MQ-2**); alerting is **P17**. A **negative age** (an `asOf` in the
future relative to ingest) is **reported, not silently corrected or judged**. An adapter that computes
"fresh"/"stale" from its own threshold is non-conforming.

### P. Provider abstraction

The adapter is the **only** place provider-native content may exist (**B-1**); consumers depend on the
canonical schema, never on which provider produced a snapshot (**PS-1**, **PS-2**); substitution is
**not** invisible to lineage and must not be (**PS-3**); historical snapshots are **never** rewritten
(**PS-4**); substitution changes future snapshot identities and therefore effective replay identity,
which is correct (**PS-5**, **PS-6**); a capability shortfall is a **scope reduction, not a
substitution** (**PS-7**); entitlements **do not transfer** between providers (**PS-8**); values may
legitimately differ and any equivalence claim would need **P07** reconciliation (**PS-9**); and
**silent substitution is prohibited** (**PS-10**).

**LA-14.** Neither substitution nor failover is adapter-internal behaviour. Substitution is owned by
**program governance**; failover by **P07/P17**. The operative test (**SN-1…SN-5**): if substituting
a provider would force a change above the adapter boundary, the abstraction has been violated.

### Q. Deterministic normalization

| # | Rule | Authority |
|---|---|---|
| — | Identical `(provider, dataVersion, asOf)` ⇒ identical `snapshotId`. | **D-1** |
| — | Identical payload + adapter version + `schemaVersion` ⇒ **byte-identical** canonical snapshot. | **D-2** |
| — | Mapping is a **pure function** of payload plus declared configuration — no wall-clock, random or ambient input beyond the single recorded `receivedAt`. | **D-3**, **MR-1** |
| — | Ordering of fields and of contributing snapshots is **canonical and specified**, never implementation-incidental. | **D-5**, **C6** |
| — | An **undeclared** mapping is prohibited — no heuristic, fuzzy or name-similarity matching. Mappings are reviewable **without reading code**. | **MR-2**, **MR-4** |
| — | No silent unit, currency, precision or timezone conversion; any conversion is explicit, declared and recorded in lineage. | **A-21**, **U-5**, **C-4** |
| — | Percent-vs-fraction and reporting scale are **explicitly declared**, never inferred from magnitude. | **U-3**, **U-4** |

> ⚠ **LA-31 / BD-P05-02-05 — an honest gap.** **U-1** requires a **declared, versioned** currency
> enumeration and **C-1** makes an unmappable token **E8**. A `/^[A-Z]{3}$/` **shape** test is **not**
> ISO-4217 **membership**: a shape-valid but non-existent code such as `XYZ` passes a shape check and
> would be silently admitted. Full membership validation requires the ISO-4217 vocabulary as
> **provider-specific configuration** — layer 3, which **D9 A-2 does not authorize**. The local double
> therefore declares `localDoubleImplements: 'SHAPE_ONLY'`, the gap is recorded, and it is **not
> faked**. A genuinely unmappable token (`US$`) **is** correctly rejected as **E8**.

### R. Provider-native field leakage prevention

Covered by **LA-18** (§B). Two leak paths are exercised, because they are caught by *different* guards:

| Leak path | Caught by | Result |
|---|---|---|
| A bare provider-native **field key** | **ADR-01 C1 / C5** — the namespace partition **aborts** the execution | Rejected. **RD-4** is also satisfied: the contract-level record reports a **count**, not the offending native key |
| A native token smuggled into a **provenance string** with every key correctly namespaced | **LA-18** only — **C1…C4 pass** | **Detected** by the native-vocabulary scan. This is exactly the case **M-4** prohibits and **RD-4** forbids |

### S. Observability / evidence requirements

Every attempt produces the record required by `P02_OBSERVABILITY_REQUIREMENTS` §2.1 (**R-1…R-15**) and
§2.2 (**SL-1…SL-4**), including capability-gate and entitlement-gate outcomes, the attempt count and
terminal disposition, `quality` / `completenessPct`, **counts by `availability` marker** (so
`WITHHELD` and `NOT_PROVIDED` stay distinct), the transformation-chain reference, and **elements
ignored under additive forward-compatibility**. Redaction is **absolute** (**RD-1…RD-6**): no
credential, no endpoint, no unredacted payload, no provider-native error string, no vendor name.
Records are **internal governed artifacts, not product DTOs** (**PB-1…PB-3**), and **UI17 must not
present `reproduced` / `byteIdentical` as verified reproduction** while **AD-17** remains unresolved
(**PB-4**).

---

## 4. Provider boundary — what was NOT done

| Prohibited action | Performed? |
|---|---|
| Select a real provider | ❌ **NO** — selection remains **NONE MADE** |
| Name a provider / vendor | ❌ **NO** — asserted by test across all P05-02 artifacts |
| Contact a provider / call a live endpoint | ❌ **NO** — the pipeline runs with `fetch` made to throw |
| Provision credentials / add API keys | ❌ **NO** — `REQUIREMENT_ONLY`, `valuePresent: false` |
| Add vendor SDKs | ❌ **NO** — `dependencies: {}`, `devDependencies: {}`, no lockfile, no `node_modules` |
| Add provider-specific secrets | ❌ **NO** — 0 secret hits |
| Claim authenticated ingestion works | ❌ **NO** — `establishesAuthenticatedIngestionWorks: false` |
| Claim provider integration tests pass | ❌ **NO** — classified **CONTRACT VALIDATION** |
| Produce provider evidence | ❌ **NO** — `isProviderEvidence: false` |

The contract defines abstract operations (`declare`, `preflight`, `checkEntitlement`, `authenticate`,
`fetch`, `normalize`, `map`, `validate`, `emit`) and **binds none of them to a commercial provider**.
The only "provider" that ever runs is `mocklive` — a **synthetic test double**, explicitly
`_status: "SYNTHETIC_TEST_DOUBLE"`, `_registeredInProviderRegister: false`, and **not** an issuance
from `p05/fixtures/provider-register.json` (**PG-1** governs real sources; that register is
**unmodified** and still holds exactly one identity, `localfix`).

**If a provider is required to make further progress, the dependency is recorded OPEN under BD-02 /
P16** — see `docs/p05/P05_02_OPEN_ITEMS.md` `BD-P05-02-01`.

---

## 5. P05-01 integration and compatibility

| Property | Result |
|---|---|
| Canonical model forked | ❌ **NO** — `forked: false`; the P05-01 modules are imported verbatim |
| Sole ingress | ✅ Both expose `snapshot(request)` (P02 **B-4** / AD-2) |
| Result envelope | ✅ Identical — `{ ok, snapshot, quality, completenessPct }` / `{ ok: false, failure, record }` |
| `DataSnapshot<T>` slot set | ✅ Identical (**SN-4**) |
| `snapshotId` format | ✅ Both match the frozen `data-${provider}-${dataVersion}-${asOf}` pattern |
| `namespaceVersion` | ✅ Identical (`1.0`) |
| `identityMappingVersion` | ✅ Identical — both resolve through the **same** `identity-fixtures.json` register |
| Substitutable behind `MarketDataSource<T>` | ✅ (**B-3**, **PS-1**) |
| Distinct provider identity | ✅ `localfix` vs `mocklive` — a different source **is** a different identity (**PS-3**) |

**⚠ What is deliberately NOT claimed:** the P05-01 local feed is **not** a live adapter. It declares
`providerKind: 'LOCAL_FIXTURE'`, `liveConnectivity: false`, `credentialsRequired: false`,
`entitlementRequired: false`, and implements **none** of `authenticate` / `checkEntitlement` /
`fetch`. Per **LA-2** it is permanently out of scope for P05-02 and **cannot** satisfy it. Its phases
are factored **inline** inside `snapshot()`, which **LA-3** permits; its adherence to the mandated
order is established by the P05-01 tests, not by harness introspection.

**Where P05-01 exposed an unresolved broader-gate dependency, it is preserved, not solved:**
`OI-P04-03` (tenant/region) and `OI-P04-04` (FIGI sourcing/licensing/coverage) are carried into this
package verbatim as `knownLimitations` and as open items. **No tenant or region attribute was
invented** (D9 **N-4**, **N-5** / **IB-2**), **no FIGI sourcing or licensing claim was made**, and
**no provider entitlement value was invented**.

---

## 6. Gate position

P05-02 is **NOT accepted** by this document, and **no separate P05-01 or P05-02 gate exists**.
`Phase Gates!P05` defines **one** acquisition gate spanning P05-01…P05-04, with the promotion rule
**"Explicit gate acceptance; no automatic promotion."**

| | |
|---|---|
| **P05** | **AUTHORIZED / NOT_ACCEPTED** — still **5 of 18** gates accepted |
| `P05_GATE_ACCEPTANCE.md` | **DOES NOT EXIST** and was **not** created |
| **Certification** | `NONE_GRANTED` |
| **Production activation** | `NOT_AUTHORIZED` |
| **P06 / P07 / P08** | **NOT STARTED / NOT PROMOTED** (AD-17 firewall preserved) |
| **A3 gate acceptor** | **UNKNOWN** — the only person-level hard blocker |
