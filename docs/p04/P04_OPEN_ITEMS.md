# P04 — OPEN ITEMS

> **Recording an item does not resolve it.** Items in §2 remain open.
> **None of these blocks P04 work-package preparation.**

---

## 1. Previously blocking items — NOW RESOLVED BY EXPLICIT AUTHORITY

| Item | Prior state | Current state | Basis |
|---|---|---|---|
| **OI-08** Identity cardinality 1 → N | **OPEN** — `blocks:[P04,P11]`; *"owner cleared, decision not made"* | ✅ **RESOLVED — 1:N** | Explicit program-authority decision |
| **OI-09** External identifier standard | **OPEN** — `blocks:[P04]`; *"no standard selected"* | ✅ **RESOLVED — FIGI / OpenFIGI authoritative** | Explicit program-authority decision |

**Resolved content, restated once for the record:**

- **OI-08 = 1:N.** One canonical company/entity identity may map to multiple securities/
  instruments/listings; each security/instrument has its own immutable canonical security ID;
  existing `companyId` remains the CSIP join key at the existing boundary and is not redefined,
  removed or retyped; the synthetic `${sector}-H1` model is not forced into the new master.
- **OI-09 = FIGI/OpenFIGI.** FIGI is the authoritative external security identifier standard;
  the program-internal canonical security ID remains distinct from FIGI; ISIN/CUSIP/SEDOL may be
  carried as additional non-authoritative identifiers; provider-native IDs and symbols are never
  canonical identity; mapping provenance, uniqueness, effective dating and fail-closed
  unresolved mappings are explicit.

| # | Rule |
|---|---|
| **R-1** | ⚠ **Neither item is a blocker anywhere in this package**, and neither is reopened, reinterpreted, downgraded or substituted |
| **R-2** | Historical artifacts recording them as OPEN (`docs/p00/P00_OPEN_ITEMS_REGISTER.md`, `docs/d8/D8_STATUS.json`, `docs/CHECKPOINT-02.md`, `docs/p01/*`, `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md`) are **accurate as of their own dates and are NOT edited.** Current state is recorded here, by addition |
| **R-3** | ⚠ **Resolving the identity-model decision is not resolving its downstream consequences** — see **OI-P04-02** |

---

## 2. Genuinely remaining P04 open items

### OI-P04-01 — Sector-taxonomy mapping conflicts

| Field | Content |
|---|---|
| Description | Canonical issuer sector classification must **map onto** the certified taxonomy (`IT → IES-015`, `Chemicals → IES-014`, `Realty → IES-015`), never redefine it. A **mismatch** requires an explicit, evidenced mapping decision |
| Source | `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md` §G.6, §G.9 |
| Owner | ⚠ **Methodology authority — Ramki/Sai.** Not decided by P04 |
| State | **OPEN — conditional** (arises only if a mismatch occurs) |
| Blocks preparation? | **NO** — the rule is specified (TX-1…TX-4); only conflict resolution needs authority |
| Blocks implementation? | Only for the specific conflicting classification |
| ⚠ Note | A silent reclassification would be a **methodology change** (SPEC ¶132/133) — prohibited |

### OI-P04-02 — 1:N downstream product-behaviour consequences

| Field | Content |
|---|---|
| Description | Real cardinality affects `/api/company/:id` semantics, portfolio holdings cardinality, **CSIP `holdings` counts (tests assert `holdings 10` / `holdings 13`)**, UI02 routing, UI13 search space — *"a product-behaviour change, not merely a data change"* |
| Source | `D4_05` §G.7 · `D8_STATUS.phase_readiness.P11.outstanding` includes `OI-08` |
| Owner | **P11 / P12 / P13** |
| State | **OPEN — downstream** |
| Blocks preparation? | **NO** |
| Blocks P04 implementation? | **NO** — P04 owns the identity model, not its consumption |
| ⚠ Note | **OI-08 is resolved as an identity decision. This is its consequence, not a reopening.** P04 does **not** modify, revalidate or waive any existing CSIP test (NR-10) |

### OI-P04-03 — Tenant / region governance attribute set

| Field | Content |
|---|---|
| Description | `D4_05` §G.9 records tenant/region governance attributes with security/identity authority historically **"UNKNOWN"**. D8 subsequently established **A1 clearance** (`PROGRAM_AUTHORITY_CLEARANCE_ESTABLISHED`, `person_named: false`), so the *authority* is cleared but the concrete attribute set is undefined |
| Source | `D4_05` §G.9 · `D8_STATUS.authority_status.A1` |
| Owner | **A1** — cleared, **no individual named or inferred** |
| State | **OPEN — content** |
| Blocks preparation? | **NO** — the mechanism is fixed (**AD-11** `classify()`/`canAccess()`, unchanged) |
| Blocks implementation? | Partially — the attribute enumeration is needed before governance can be applied per-record |

### OI-P04-04 — FIGI source availability, licensing and coverage

| Field | Content |
|---|---|
| Description | **FIGI is selected as the authoritative standard** (OI-09, resolved). Separately, **how FIGI values are obtained** — source, licensing, coverage gaps, refresh — is unspecified. ⚠ **Entitlement matrix remains EMPTY; no provider is selected** (INV-10) |
| Source | This package · INV-10 · `P02_ENTITLEMENT_MODEL` |
| Owner | **P05** Acquisition |
| State | **OPEN — downstream** |
| Blocks preparation? | **NO** |
| ⚠ Note | **This does not reopen OI-09.** The standard is decided; sourcing is a different question. Absent FIGI ⇒ explicit unresolved state, **never a fallback** (XI-6, V-X5) |

### OI-P04-05 — Executable validation of P04

| Field | Content |
|---|---|
| Description | `P04_VALIDATION_RULES.md` specifies requirements. TRACKER `P04-01/02/03` additionally require *"Golden mapping tests"*, *"Mapping reconciliation"*, *"Scenario tests"* and fixtures |
| Owner | Implementation phase + **P15** |
| State | **DEFERRED — NOT PASSED** |
| Blocks preparation? | **NO** |
| ⚠ Note | ⛔ **No test is executed, passed, waived or certified by this package** — see §3 |

---

## 3. Deferred obligations — carried, not discharged

| ID | Obligation | Deferred to | Status |
|---|---|---|---|
| **DO-P04-1** | Golden mapping tests (`P04-01`) | Implementation + P15 | **DEFERRED — NOT PASSED** |
| **DO-P04-2** | Mapping reconciliation evidence (`P04-02`) | Implementation + P15 | **DEFERRED — NOT PASSED** |
| **DO-P04-3** | Lifecycle scenario tests (`P04-03`) | Implementation + P15 | **DEFERRED — NOT PASSED** |
| **DO-P04-4** | Instrument / mapping / lifecycle fixtures | Implementation | **DEFERRED — NOT PRODUCED** |
| **DO-P04-5** | CSIP non-regression execution evidence | **P15** | **DEFERRED — NOT PASSED** |

⚠ Prior deferred obligations **DO-1 … DO-5** (P03) remain **DEFERRED — NOT PASSED**; P04 does not
discharge, satisfy or waive any of them.

---

## 4. Preserved unresolved — not P04's to resolve

| Item | State | Owner |
|---|---|---|
| **OI-10** exact namespace token | **OPEN** — `AUTHORITY_CLEARED_TOKEN_NOT_RECORDED` | Ramki/Sai — ⚠ **no token invented or inferred** |
| **AD-17 / M-2** replay literal returns | **UNRESOLVED** | EXISTING-IIPS |
| **M-1 / AD-4** E2E-030 revalidation | **`OPEN_REVALIDATION_REQUIRED`** — not revoked, not renewed | EXISTING-IIPS |
| **M-5** auth/session not wired | **OPEN** — C12 BLOCKED | EXISTING-IIPS |
| **M-6** retention stub | **OPEN** | EXISTING-IIPS |
| **OI-05 · OI-06 · CD-01 · AD-9** | **OPEN** | Various |
| **C1–C12** | **`NONE_GRANTED`** | A2 — cleared, not named |
