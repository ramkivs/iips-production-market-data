# P04 — GATE ACCEPTANCE RECORD

> **Explicit acceptance act** required by the governing rule
> **"Explicit gate acceptance; no automatic promotion."** (TRACKER `Phase Gates!P04`)
> Acceptance is not inferred from work-package completion, from a passing review, or from
> authority clearance; it is performed here.

---

## 1. Acceptance record

| Field | Value |
|---|---|
| **Gate** | **P04** |
| **Gate name** | **Identity/master gate** |
| **Phase** | P04 — Instrument / Security Master |
| **Result** | # **ACCEPTED** |
| **Work package accepted** | P04 instrument/security master specification package — **12 artifacts**, `docs/p04/` |
| **Work-package commit** | **`6ec3b288c8deeee317a63341297bd33b9a090f4f`** |
| **Parent / restoration baseline** | `9a26ac70058a4410ed99905f0aa3d3a18e87ba17` — ⚠ a **restoration/provenance commit**, **not** the original CHECKPOINT-02 (`0a7bb929…`, permanently unavailable; see `docs/INCIDENT-01_HISTORY_LOSS.md`) |
| **Prior gates** | P00 ACCEPTED · P01 ACCEPTED · P02 ACCEPTED · P03 ACCEPTED — **all remain accepted** |
| **Acceptance authority** | **A3 — Phase-Gate Acceptance Authority**; `PROGRAM_AUTHORITY_CLEARANCE_ESTABLISHED`, **`person_named: false`** (`docs/d8/D8_STATUS.json` `authority_status.A3`). ⚠ **No individual is named or inferred** |
| **Acceptance type** | **Explicit A3 acceptance act** (not automatic promotion) |
| **Prior state** | **P04 WORK PACKAGE READY FOR GATE ACCEPTANCE** — 4 of 18 accepted |
| **Resulting state** | **P04 ACCEPTED — 5 of 18** |

⚠ **A3 clearance permits the acceptance *process*; it does not pre-accept any gate.**
This record is the acceptance act itself.

⚠ **O-4 discipline.** Prior-gate commit pins recorded in P00–P03 artifacts reference the eight
commits lost to the sandbox re-clone and **no longer resolve**. Per `INCIDENT-01` §5 they are
historically accurate, presently unresolvable, and **deliberately not edited**. This record
therefore pins prior gates by **artifact**, not by dead hash, and invents no commit.

---

## 2. Acceptance basis

P04's gate intent — *"Establish authoritative instrument identity, mappings, listings, exchanges,
currencies and lifecycle state"* (SPEC ¶40; TRACKER *Phase Gates*!P04) — is satisfied **as
specification** by the 12 artifacts under `docs/p04/`.

The declared minimum evidence (`docs/p00/P00_GATE_MODEL.md`:38) is present:

| Required evidence | Where satisfied |
|---|---|
| **Mapping records** | `P04_IDENTITY_ADAPTER_CONTRACT.md` §5 — canonical IDs, target `companyId`, mapping version, effective dates, method, source, confidence, approval, audit reference |
| **Versioning** | `P04_LINEAGE_AND_VERSION_IMPACT.md` §2 — `identityMappingVersion` (IM-1…IM-8); six axes, **no seventh** |
| **Audit log** | `P04_IDENTITY_ADAPTER_CONTRACT.md` ADP-3, SEC-5; `P04_VALIDATION_RULES.md` §9 (V-A1…V-A5) |
| **OI-08 + OI-09 decided** | ✅ **Both RESOLVED by explicit program authority** — §3 |
| **CSIP non-regression** | `P04_CSIP_NON_REGRESSION.md` — CG-1…CG-5, CP-1…CP-3, NR-1…NR-10 |

**Formal gate review result: 61 of 61 acceptance criteria PASS · 0 FAIL · 2 non-blocking
observations**, assessed against `P04_ACCEPTANCE_CRITERIA.md` §§A–N.

---

## 3. Authorized content decisions — RESOLVED

| Item | State | Decision as authorized |
|---|---|---|
| **OI-08** identity cardinality | ✅ **RESOLVED** | **1:N.** One canonical company/entity identity may map to multiple securities/instruments/listings; each security/instrument has its **own immutable canonical security ID**; existing `companyId` **remains the CSIP join key** at the existing boundary, **not redefined, removed or retyped**; the synthetic `${sector}-H1` model is **not forced** into the new security master |
| **OI-09** external identifier standard | ✅ **RESOLVED** | **FIGI / OpenFIGI is the authoritative external security identifier standard.** The program-internal canonical security ID **remains distinct from FIGI**; ISIN/CUSIP/SEDOL may be represented as additional **non-authoritative** identifiers; provider-native IDs and symbols are **never** canonical identity; mapping provenance, uniqueness, effective dating and **fail-closed** unresolved mappings are explicit |

Specified in: OI-08 → CD-1…CD-7, MC-1…MC-7, U-9, NR-1…NR-5 · OI-09 → XI-1…XI-8, U-7, FC-2,
V-X1…V-X7. **Neither is represented as a blocker in any P04 artifact.**

⚠ Historical artifacts recording them as OPEN (`P00_OPEN_ITEMS_REGISTER.md`, `D8_STATUS.json`,
`CHECKPOINT-02.md`, `P01_*`, `D4_05`) are **accurate as of their own dates and are NOT edited.**
Correction is by **addition and citation**, never by editing accepted records.

---

## 4. ⚠ ACCEPTANCE BOUNDARY — OI-P04-03 REMAINS OPEN

| Field | Value |
|---|---|
| **Item** | **OI-P04-03 — tenant / region governance attribute set** |
| **State** | ⚠ **OPEN — CONTENT DECISION** |
| **Owner** | **A1 — Security/Identity Authority**; clearance established, **`person_named: false`**. ⚠ **No individual named or inferred** |
| **Effect on this acceptance** | ⚠ **DOES NOT INVALIDATE P04 CONTRACT ACCEPTANCE** |
| **Effect on implementation** | ⚠ **CONSTRAINS IT — see the boundary below** |

### 4.1 Why acceptance is valid while this item is open

Established by the formal review from the acceptance criteria themselves, **not by a new rule**:

| # | Finding |
|---|---|
| **BD-1** | **No acceptance criterion requires the governance attribute set to be defined.** Only **B-4** and **K-3** touch governance. **B-4** requires the attribute *slot* be required — satisfied by `P04_CANONICAL_SECURITY_MODEL.md` §2.2 (*"Tenant / region / governance — Required where applicable — Per `DataGovernanceRuntime` classification (AD-11)"*). **K-3** requires the **AD-11 mechanism be unchanged** — satisfied by SEC-4 |
| **BD-2** | **L-5** requires remaining items be *"recorded; those needing authority marked explicitly, **not decided**"*. OI-P04-03 is recorded with owner A1, state OPEN — content, and **is not decided**. **L-5 is satisfied by the item being open and marked, not by resolving it** |
| **BD-3** | The item's own recorded disposition: *"Blocks preparation? **NO** — the mechanism is fixed (AD-11 `classify()`/`canAccess()`, unchanged)"* |
| **BD-4** | P04 accepts a **contract/specification**. The governance **mechanism** is fixed and unchanged; only the concrete **attribute enumeration** is undefined — a value, not a structure |

### 4.2 ⚠ Implementation boundary imposed by this acceptance

| # | Boundary |
|---|---|
| **IB-1** | ⚠ **Implementation involving per-record tenant/region governance application must remain BOUNDED until the A1 content decision is recorded.** The attribute set is undefined; applying governance per record would require inventing it |
| **IB-2** | ⚠ **This acceptance does NOT authorize inventing, inferring or defaulting the attribute set.** Recording an open item is not resolving it |
| **IB-3** | The **AD-11 mechanism** (`DataGovernanceRuntime.classify()` / `canAccess()`) is **unchanged and must remain so**; no new governance mechanism is authorized |
| **IB-4** | This boundary is **recorded, not decided.** ⚠ **The A1 content decision is NOT taken here, and this record must not be read as taking it** |
| **IB-5** | ⚠ The review's disclosed ambiguity — the criteria are silent on whether implementation may commence with the attribute set undefined — is **resolved conservatively by IB-1 (bounding), not by an authority decision.** Lifting IB-1 requires an explicit A1 act |

---

## 5. Scope accepted

**Accepted as specification only:** the canonical security/instrument model with an immutable,
opaque, program-internal canonical security ID · the issuer/company entity and the **1:N**
issuer→instrument relationship · canonical listing identity · **MIC-based** exchange/venue
reference (D10) and bidirectional issuer↔instrument↔listing↔venue traversal · **FIGI/OpenFIGI**
as authoritative external identifier with non-authoritative ISIN/CUSIP/SEDOL · the governed
identity adapter (ADP-1…ADP-8) with explicit, provenance-bearing, versioned, effective-dated,
**fail-closed** mappings · provider neutrality (PN-1…PN-6) · lifecycle states and effective
dating · `identityMappingVersion` semantics and lineage impact · CSIP non-regression ·
validation requirements · dependency register, open items, acceptance criteria and evidence.

---

## 6. Scope exclusions — explicitly preserved

| # | Excluded — **NOT authorized by this acceptance** |
|---|---|
| 1 | **Production implementation** — no code, schema, DDL, migration or configuration |
| 2 | **Certification** — `NONE_GRANTED`; C12 remains BLOCKED |
| 3 | **Production activation** — `NOT_AUTHORIZED` |
| 4 | **Existing-IIPS modification** — untouched |
| 5 | Resolution of **M-1 / M-5 / M-6** |
| 6 | Resolution of **AD-17** |
| 7 | Resolution of **OI-10** — ⚠ no namespace token invented or inferred |
| 8 | Resolution of **OI-P04-01** (taxonomy conflicts — Ramki/Sai methodology authority) |
| 9 | Resolution of **OI-P04-02** (1:N downstream product behaviour — P11/P12/P13) |
| 10 | Resolution of **OI-P04-03** (⚠ see §4 — OPEN, implementation-bounded) |
| 11 | Resolution of **OI-P04-04** (FIGI sourcing/licensing — P05) |
| 12 | Resolution of **OI-P04-05** (executable validation) |
| 13 | **P05–P17** work of any kind; **no other gate is accepted** |

---

## 7. Open-item and authority state — preserved exactly

| Item | State | Owner |
|---|---|---|
| **OI-08** | ✅ **RESOLVED — 1:N** | Program authority |
| **OI-09** | ✅ **RESOLVED — FIGI/OpenFIGI** | Program authority |
| **OI-P04-01** taxonomy conflicts | **OPEN — conditional** | Ramki/Sai methodology |
| **OI-P04-02** 1:N downstream | **OPEN — downstream** | P11 / P12 / P13 |
| **OI-P04-03** governance attributes | ⚠ **OPEN — implementation-bounded (§4)** | **A1**, not named |
| **OI-P04-04** FIGI sourcing | **OPEN — downstream** | P05 |
| **OI-P04-05** executable validation | **DEFERRED — NOT PASSED** | Implementation + P15 |
| **OI-10** namespace token | **OPEN** — token **not recorded, not invented** | Ramki/Sai |
| **AD-17 / M-2** | **UNRESOLVED** | Existing-IIPS |
| **M-1 / AD-4** | **`OPEN_REVALIDATION_REQUIRED`** — E2E-030 **not revoked, not renewed** | Existing-IIPS |
| **M-5** | **OPEN** — C12 BLOCKED | Existing-IIPS |
| **M-6** | **OPEN** | Existing-IIPS |
| **OI-05 · OI-06 · CD-01 · AD-9** | **OPEN** | Various |
| **A1 / A2 / A3 / A4** | Clearance established, **`person_named: false`** | — |

⚠ **Nothing above is resolved, repaired, waived or reclassified by this acceptance.**

---

## 8. Deferred implementation obligations — NOT satisfied

**DO-P04-1** golden mapping tests · **DO-P04-2** mapping reconciliation evidence ·
**DO-P04-3** lifecycle scenario tests · **DO-P04-4** fixtures · **DO-P04-5** CSIP non-regression
execution evidence — all **DEFERRED — NOT PASSED**.

Prior **DO-1 … DO-5** (P03) also remain **DEFERRED — NOT PASSED**.

⚠ **No obligation is marked passed, satisfied or waived by this acceptance.**

---

## 9. What this acceptance does NOT mean

| # | It does **not** mean |
|---|---|
| 1 | That P04 is implemented — **no implementation was performed** |
| 2 | That any certification is granted — **`NONE_GRANTED`**; no certification evidence created |
| 3 | That production activation is authorized — **`NOT_AUTHORIZED`** |
| 4 | That existing-IIPS methodology, scoring, calibration, taxonomy, engine contracts or certification state changed — **none did** |
| 5 | That the certified CSIP contract was altered — `NormalizedHolding` and `companyId` are **untouched**; **no CSIP revalidation is triggered** |
| 6 | That **OI-P04-03** is decided — ⚠ **it is OPEN and bounds implementation (§4)** |
| 7 | That OI-10, AD-17, M-1, M-5, M-6, OI-P04-01/02/04/05 are resolved |
| 8 | That P05 may begin — **P05 requires P02 + P04 complete *and* the exact namespace token recorded** (`D8_EXECUTION_AUTHORIZATION` §4). ⚠ **OI-10 is not recorded** |
| 9 | That any other gate is accepted — **P05–P17 remain NOT ACCEPTED** |
| 10 | That any individual holds A1, A2, A3 or A4 |

---

## 10. Resulting program state

| Field | Value |
|---|---|
| `formal_gate_status` | **5 of 18 accepted — P00, P01, P02, P03, P04** · P05–P17 **NOT ACCEPTED** |
| **P04** | **✅ ACCEPTED** — specification only |
| `certification_status` | **`NONE_GRANTED`** — C12 BLOCKED on M-5 |
| `production_activation_status` | **`NOT_AUTHORIZED`** |
| `program_status` / `implementation_status` | `AUTHORIZED_TO_PROCEED` |
| Existing-IIPS | **UNCHANGED** |
| Implementation performed | **NONE** |

---

## 11. Next

| Field | Value |
|---|---|
| **Following phase** | **P05 — Acquisition gate** |
| ⚠ **P05 authorization** | **P05 is NOT authorized by this act.** Its precondition is *"P02 + P04 complete **and exact namespace token recorded**"* — **OI-10 remains unrecorded** |
| ⚠ **P04 implementation** | Bounded by **IB-1…IB-5** (§4.2) pending the A1 decision on OI-P04-03 |
| **Not performed here** | P04 implementation · certification · production activation · push · any P05+ work |

---

## 12. Documentation debt carried forward — recorded, NOT corrected here

| Artifact | Content | Disposition |
|---|---|---|
| `docs/p02/P02_GATE_ACCEPTANCE.md` §5, §7 | P03 `BLOCKED — AUTHORITY` | ⚠ **Historical acceptance record — NOT rewritten** |
| `docs/d4/D4_12_PHASE_SEQUENCE.md`:27, :28 · `docs/d5/E-01`:11 · `docs/d7/D7_AUTHORITY_ROLE_ASSIGNMENT.md`:84 | A1 UNKNOWN; P03/P04 blocked; *"Prohibited to start"* | **Immutable historical records — superseded by D8, never edited** |
| `docs/d8/D8_STATUS.json` `A3.gates_accepted: 0`; `OI-08`/`OI-09` OPEN | Historical values | **Immutable — accurate as of D8 (CHECKPOINT-02 rule AU-4)** |
| `docs/p01/P01_FIELD_DICTIONARY.md` §7 · `docs/d4/D4_05` §G.2 | *"no standard is assumed authoritative"* | ⚠ **Accurate when written; superseded by OI-09. NOT edited** — reconciled by citation in `P04_CANONICAL_SECURITY_MODEL.md` §5.2 |
| `docs/p00/P00_OPEN_ITEMS_REGISTER.md` OI-08/OI-09 | Recorded OPEN | **Historical — NOT edited**; current state is §3 here |

---

**P04 — Identity/master gate — is ACCEPTED. 5 of 18 gates accepted.**
**OI-P04-03 remains OPEN and bounds implementation. P05–P17 remain NOT ACCEPTED.**
**Certification `NONE_GRANTED`. Production activation `NOT_AUTHORIZED`.**
