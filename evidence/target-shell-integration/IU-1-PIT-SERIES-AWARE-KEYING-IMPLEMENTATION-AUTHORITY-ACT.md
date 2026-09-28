# IU-1 — PIT SERIES-AWARE KEYING — IMPLEMENTATION AUTHORITY ACT

## IPD-INTERNAL — GOVERNANCE-ONLY

**Act identifier:** `iu-1-pit-series-aware-keying-implementation-2026-09-28-001`
**Authority:** RAMKI — "IIPS — IU-1 IMPLEMENTATION AUTHORITY ACT" (2026-09-28)
**Originating basis:** the completed mandatory two-sided **IRR ↔ IPD reconciliation**
(IRR = application/platform side; IPD = market-data/PIT side), reconciled against the
IU-2 implementation already committed under
`evidence/target-shell-integration/IU-2-D114-SERIES-AWARE-SECURITY-IDENTITY-IMPLEMENTATION-AUTHORITY-ACT.md`
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Act Type:** IMPLEMENTATION AUTHORITY ACT for the **subsequent implementation gate only**.
This act is **not** an implementation, **not** a certification, **not** a certification-scope
determination, **not** an acceptance act, **not** a production authorization, **not** an
integration authorization, and **not** a new authority designation.

---

## 1. TARGET

**Workstream:** IU-1 — IPD-internal PIT series-aware keying
**Capability delta:** make the existing IPD point-in-time model distinguish securities by the
**already-established series-aware D114 identity**, so that multiple security series sharing an
ISIN / company representation cannot collapse into a single PIT identity.

**Current state (verified at act time, HEAD `cb5376bd058d44f363e39fb4fff5e0e85668c5a2`):**

| Surface | File | State |
|---|---|---|
| PIT store + `PITQuery` | `src/pit/pit_store.ts` (107 L, blob `9c17b4647b9b`) | key = `` `${companyId}:${domain}` `` at **L26** (`append`), **L52** (`queryAsOf`), **L81** (`queryRange`); `PITQuery` at **L11** = `{ companyId, domain, asOf }` — **no series** |
| Canonical envelope | `src/contracts/envelope.ts` (128 L, blob `88f4efd0be8f`) | `CanonicalEnvelope<T>` at L11; `companyId` at L15/L26/L36/L80 — **no `securityId`** |
| PIT ingestion loader | `src/d114/pit_ingestion_loader.ts` (528 L, blob `571fe22287bd`) | imports `PointInTimeStore, PITQuery` at L9; envelope construction at L299–365 (`sigD01`/`sigD02`, `envelopeId`, `companyId`) |
| Lineage verifier | `src/e2e/lineage_verifier.ts` (290 L, blob `9b0ef58a3819`) | imports `PointInTimeStore` at L10; `pitStore.append(ingressEnvelope)` at L134; `pitStore.queryAsOf({ companyId: resolvedCompanyId, … })` at L135–136 |

**IU-2 is complete and is the precondition.** `D114SecurityIdentity` and
`buildD114SecurityIdentity` / `isD114SecurityIdentity` exist in `src/contracts/types.ts`
(commit `cb5376bd058d44f363e39fb4fff5e0e85668c5a2`, parent `3dbf4f1004a59228d86cf501c7c6f05d64ac6cd4`),
and `securityIdentity` is populated at the four D114 normalization seams. IU-1 **reuses** that
capability; it does **not** repeat IU-2 parser work.

---

## 2. REQUIRED IMPLEMENTATION (the authorized delta, and nothing more)

### IU-1-A — Series-aware PIT keying

Extend the existing PIT identity/keying in `src/pit/pit_store.ts` **only as necessary** so that
PIT records are distinguished by the series-aware D114 identity rather than by
`companyId` + `domain` alone.

The three identified sites — `append` (L26), `queryAsOf` (L52), `queryRange` (L81) — are the
authorized key/query surface. Reuse `D114SecurityIdentity` and `securityIdentity.securityId`
from IU-2.

### IU-1-B — PIT query contract

Extend `PITQuery` (`src/pit/pit_store.ts` L11) **only as necessary** to carry the series-aware
security identity required for deterministic PIT lookup. Existing fields and semantics are
preserved unless a narrowly necessary additive change is required.

### IU-1-C — Canonical envelope

Make the **minimum** change in `src/contracts/envelope.ts` required to preserve the series-aware
identity through the PIT boundary — identified by the reconciliation as promotion of `securityId`
onto `CanonicalEnvelope`.

### IU-1-D — PIT ingestion loader

Make the **minimum downstream adjustment** in `src/d114/pit_ingestion_loader.ts` required to
preserve and supply the new series-aware identity into PIT.

### IU-1-E — Lineage verifier

Make the **minimum adjustment** in `src/e2e/lineage_verifier.ts` required to preserve/verify the
new series-aware identity through the existing lineage path.

---

## 3. SERIES-AWARE / MULTI-SERIES REQUIREMENT

The implementation must support the already-proven semantic requirement:

```text
same ISIN + different series  =  different PIT identities
```

For example:

```text
ISIN:INE665A01038:BL
ISIN:INE665A01038:EQ
```

must remain distinct.

The following must **never** happen:

* selecting the first series arbitrarily;
* defaulting to `EQ`;
* collapsing series;
* using a bare ambiguous alias;
* silently converting a missing series into a default.

**Ambiguous identity must fail closed.**

---

## 4. BOUNDED IMPLEMENTATION SURFACE (complete and closed)

| Surface | File |
|---|---|
| PIT store + `PITQuery` | `src/pit/pit_store.ts` |
| Canonical envelope | `src/contracts/envelope.ts` |
| PIT ingestion loader | `src/d114/pit_ingestion_loader.ts` |
| Lineage verifier | `src/e2e/lineage_verifier.ts` |
| (reused, not modified) IU-2 identity contract | `src/contracts/types.ts` |

The exact files were confirmed present in the authoritative repository at act time (§1).
Minimally required associated tests are permitted under the same convention used by IU-2.

**No other file is inside the authorized surface.** Any file not listed above requires a separate
authority act. Authority must **not** be inferred from the donor implementation.

---

## 5. EXISTING PIT SEMANTICS THAT MUST BE PRESERVED

The implementation is an **identity/keying extension, not a PIT rewrite**. It must not regress:

* append behaviour;
* as-of querying;
* range querying;
* historical ordering;
* idempotency;
* replay behaviour;
* future-leakage protection;
* provenance;
* gap handling;
* existing D114 ingestion semantics.

Do **not** redesign the PIT store, replace the P08 store architecture, or introduce a new
persistence technology.

---

## 6. DONOR D-PIT-WIRE-01 — REFERENCE / EVIDENCE ONLY

The donor branch `42f91fad` and its D-PIT-WIRE-01 implementation (`d114AdmissionBridge.ts`,
`pitVintageProvider.ts`, `companyPitTransport.ts`, `p08PitStore.ts`) are:

```text
REFERENCE / EVIDENCE ONLY
```

They are **not** authoritative. Do **not** merge, cherry-pick, wholesale-copy, replace current IPD
code with donor code, import donor transport wiring, import donor UI, or import donor route
semantics. The donor's proven design may be used to understand the intended series-aware PIT
behaviour; its implementation must be reconciled against the current authoritative IPD code.

---

## 7. IRR — INVESTIGATED AND EXPLICITLY PRESERVED AS UNCHANGED

The two-sided reconciliation established that **IRR contains no PIT capability** (0 files
containing standalone `PIT`, `PointInTime`, `pitStore`, `pit_store`, `Vintage`; 0 references to
`MarketQuotePayload`, `OHLCVCandle`, `securityId`, `securityIdentity`, `D114`, `ISIN`, or
`CanonicalEnvelope`). IRR's only `asOf` is `DataSourceMeta.asOf` — a live-data snapshot/version
marker, categorically distinct from PIT.

**Therefore the current IU-1 boundary does not cross into IRR.** This act does **not** authorize:

* any change to IRR / `iips-review-recovered`;
* an IRR PIT consumer;
* modification of the IRR `/api/company/:id` route or `CompanyData`;
* modification of IRR `asOf` or live-data snapshot semantics;
* modification of the IRR frontend;
* IRR PIT transport.

The absence of PIT in IRR does **not** create an IRR implementation requirement.

---

## 8. EXPLICITLY OUT OF SCOPE

### PIT transport

No `companyPitTransport.ts`, no `/api/company/:id` PIT route, no PIT transport wiring. The donor
has this capability; it remains outside IU-1. The route collision between IRR and donor transport
remains an independent unresolved boundary.

### AG-5

No resolution of the IRR ↔ IPD `companyId` value-space reconciliation. AG-5 remains separately
tracked as **BLOCKED — EVIDENCE REQUIRED** and is not silently resolved by this act.

### D-7 / D-8 / D-9 / D-10

No resolution or implementation of Portfolio authority (D-7), Security Universe authority (D-8),
market-data tenancy/ownership (D-9), or Watchlists authority (D-10).

### Persistence

No change to persistence architecture, the IRR journal, PMD persistence technology, or relational
persistence.

### Production

No modification of Dhan production, NSE production, credentials, production access, production
tenant, or provider activation.

### OIDC / Operator Drop

No modification or activation of OIDC, Keycloak, or Operator Drop.

### UI

No implementation or modification of PIT UI. The donor UI remains reference evidence only.

---

## 9. THIS GATE DOES NOT IMPLEMENT

**No implementation was performed by this act.** No source, test, PIT, contract, or lineage file
was created, modified, or deleted. Verified at act time: `src/pit/pit_store.ts`,
`src/contracts/envelope.ts`, `src/d114/pit_ingestion_loader.ts`, and
`src/e2e/lineage_verifier.ts` are all **identical to `main`**; `src/` and `tests/` are unchanged
from the IU-2 implementation commit.

---

## 10. REQUIRED ACCEPTANCE (for the subsequent implementation gate)

* Multi-series proof: `ISIN:<isin>:BL` and `ISIN:<isin>:EQ` yield distinct PIT identities and are
  not collapsed.
* Fail-closed on ambiguity: bare/ambiguous alias never selects a series arbitrarily and never
  defaults to `EQ`.
* Missing series never silently converted to a default.
* Existing PIT behaviour preserved: append, `queryAsOf`, `queryRange`, historical ordering,
  idempotency, replay, future-leakage protection, provenance, gap handling.
* Existing D114 ingestion semantics preserved; no IU-2 parser work repeated.
* Additive tests only — no existing test weakened or deleted.
* Full-suite regression with no unrelated test modified to force a pass.
* Scope-integrity guards: PIT transport not added, `/api/company/:id` untouched, IRR untouched,
  `CanonicalEnvelope` redesign not performed, donor not merged.
* One implementation commit + push + LOCAL == REMOTE.

---

**Act recorded BEFORE any source change.**

**Repository / Branch at act time:** `ramkivs/iips-production-market-data` /
`arena/01a0e6d9-iips-production-market-data`
**Baseline HEAD at act time:** `cb5376bd058d44f363e39fb4fff5e0e85668c5a2`
**Recorded At (local, Asia/Calcutta):** 2026-09-28
**Recording Agent:** Arena — recording agent only.
