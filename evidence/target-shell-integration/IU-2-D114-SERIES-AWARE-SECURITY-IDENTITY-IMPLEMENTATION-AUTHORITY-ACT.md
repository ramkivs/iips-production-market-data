# IU-2 — D114 SERIES-AWARE SECURITY IDENTITY INTEGRATION — IMPLEMENTATION AUTHORITY ACT

**Act identifier:** `iu-2-d114-series-aware-security-identity-implementation-2026-09-28-001`
**Authority:** RAMKI — "IIPS — IU-2 IMPLEMENTATION AUTHORITY ACT" (2026-09-28)
**Originating basis:** read-only D114 reconciliation and the IU boundary matrix established
during the prior read-only gates; GP-6 three-state model
(**authority to designate** / **authority to author contract content** / **authority to implement**)
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Act Type:** IMPLEMENTATION AUTHORITY ACT for the **subsequent implementation gate only**.
This act is **not** an implementation, **not** a certification, **not** a certification-scope
determination, **not** an acceptance act, **not** a production authorization, **not** an
integration authorization, and **not** a new authority designation.

---

## 1. TARGET

**Workstream:** IU-2 — D114 Series-Aware Security Identity Integration
**Capability delta:** the **missing series-aware security-identity integration** layered onto the
**existing** D114 historical capability already present in the authoritative repository. IU-2 does
**not** rebuild D114, does **not** reopen it, and does **not** invalidate it.

**Existing D114 capability explicitly preserved (not reopened, replaced, duplicated, or invalidated):**

| Existing surface | Path |
|---|---|
| Legacy Bhavcopy parser | `src/d114/legacy_bhavcopy_parser.ts` |
| CM-UDiFF parser | `src/d114/cm_udiff_parser.ts` |
| Unified historical adapter | `src/d114/unified_historical_adapter.ts` |
| Historical feasibility capability | `src/d114/historical_feasibility_runner.ts` |
| Stage-5 PIT foundation / idempotent ingress | `src/d114/pit_ingestion_loader.ts` |
| Evidence reconciliation / handoff | `src/d114/evidence_reconciler.ts`, `src/d114/evidence_handoff.ts` |
| D01/D02 canonical contracts | `src/contracts/d01_quotes.ts`, `src/contracts/d02_ohlcv.ts` |

---

## 2. D114 IDENTITY CONTRACT (authorized content; exact grammar preserved)

```text
securityId   = ISIN:<isin>:<series>
series       = mandatory
isinAuthority = NON_AUTHORITATIVE
```

The D114 security identity is a **series-aware security identity**. It is a **distinct concept**
and must remain distinct from:

* human / user identity;
* tenant identity;
* owner identity;
* `companyId` (the security-master / resource key);
* security-master identity;
* D115 identity authority.

**`companyId` must NOT be repurposed, overloaded, renamed, or re-derived as the D114 series-aware
security identity.** The additive `securityIdentity` field is a **separate, parallel** identity.

---

## 3. REQUIRED IMPLEMENTATION (the authorized delta, and nothing more)

### IU-2-A — D114 Security Identity contract

Implement `D114SecurityIdentity` carrying the exact grammar in §2, together with the minimal
construction and validation capability required by the existing architecture:

```text
buildD114SecurityIdentity(...)
isD114SecurityIdentity(...)
```

(or repository-equivalent construction/validation functions).

Requirements:

* ISIN **and** series are both required;
* the exact D114 identity grammar is preserved (`ISIN:<isin>:<series>`);
* malformed or missing required series data is **rejected fail-closed**;
* no unrelated identity redesign;
* existing D114 raw-data semantics already present in the authoritative repository are reused
  (ISIN `length === 12` structural validation at `cm_udiff_parser.ts:229` and
  `legacy_bhavcopy_parser.ts:148` is the established ISIN check and is **not** replaced).

### IU-2-B — Additive D01/D02 contract extension

Add `securityIdentity` **additively** to the relevant D01/D02 canonical contracts:

| Contract | File | Current state (verified at act time) |
|---|---|---|
| `MarketQuotePayload` | `src/contracts/d01_quotes.ts` | no `securityIdentity` field |
| `OHLCVCandle` | `src/contracts/d02_ohlcv.ts` | no `securityIdentity` field |

The addition must be **optional at the type level** so existing producers and consumers remain
source-compatible, and must be **populated at the authorized normalization seams** (§4).

Do **not** remove existing fields. Do **not** redefine existing identity semantics. Do **not**
redesign D01/D02. Do **not** change unrelated contract behaviour.

### IU-2-C — Parser / normalization propagation (the four existing normalization points)

Populate `securityIdentity` from the **already-validated** raw fields at **exactly these four
normalization points**, verified present in the authoritative repository at act time:

| # | File | Line | Function | Raw fields available |
|---|---|---|---|---|
| 1 | `src/d114/cm_udiff_parser.ts` | 264 | `toCanonicalQuote(CmUdiffRawRecord): MarketQuotePayload` | `ISIN`, `SctySrs` |
| 2 | `src/d114/cm_udiff_parser.ts` | 291 | `toCanonicalOHLCV(CmUdiffRawRecord): OHLCVCandle` | `ISIN`, `SctySrs` |
| 3 | `src/d114/legacy_bhavcopy_parser.ts` | 176 | `toCanonicalQuote(LegacyBhavcopyRawRecord): MarketQuotePayload` | `ISIN`, `SERIES` |
| 4 | `src/d114/legacy_bhavcopy_parser.ts` | 203 | `toCanonicalOHLCV(LegacyBhavcopyRawRecord): OHLCVCandle` | `ISIN`, `SERIES` |

The shared canonical type surface for the new identity type is `src/contracts/types.ts`
(currently holding `DataDomain` = `D01_QUOTES` … `D09_ALTDATA`). Note and preserve the known,
**pre-existing** open item that `DataDomain` omits D10 — this act does **not** authorize resolving
that omission.

The propagation must be **additive and minimal**. No broad parser rewrite is authorized.

---

## 4. BOUNDED IMPLEMENTATION SURFACE (complete and closed)

| Surface | File(s) |
|---|---|
| D114 identity type + constructors/validators | `src/contracts/types.ts` (or a new module re-exported from `src/contracts/index.ts`) |
| D01 additive extension | `src/contracts/d01_quotes.ts` |
| D02 additive extension | `src/contracts/d02_ohlcv.ts` |
| CM-UDiFF normalization seams | `src/d114/cm_udiff_parser.ts` (L264, L291) |
| Legacy Bhavcopy normalization seams | `src/d114/legacy_bhavcopy_parser.ts` (L176, L203) |

**No other file is inside the authorized surface.** Any file not listed above requires a separate
authority act.

---

## 5. EXPLICITLY PERMITTED (and nothing more)

* New `D114SecurityIdentity` type and its construction/validation helpers.
* Additive optional `securityIdentity` field on `MarketQuotePayload` and `OHLCVCandle`.
* Population of `securityIdentity` at the four normalization points in §3-C, from the
  already-validated `ISIN` + `SctySrs` / `SERIES` raw values.
* Tests that cover the new identity type, the additive fields, and the four seams — **additive
  tests only**; existing tests must not be deleted or weakened.
* Export of the new type through the existing `src/contracts/index.ts` / `src/d114/index.ts`
  barrel convention if the implementation places it there.

---

## 6. EXPLICITLY PROHIBITED

### PIT (outside IU-2)

No PIT key migration. No PIT schema change. No PIT storage redesign. No PIT identity redesign.
The existing PIT implementation remains **unchanged** — in particular the PIT signature sites at
`src/d114/pit_ingestion_loader.ts:299` (`D01:${companyId}:…`) and `:351` (`D02:${companyId}:…`)
must not be altered. PIT integration belongs to the subsequent **IU-1** / separately authorized
scope. Promotion of `securityId` onto `CanonicalEnvelope`
(`src/contracts/envelope.ts`) is **not** authorized here.

### Unresolved authority decisions

No resolution or implementation of **D-7** (Portfolio authority), **D-8** (Security Universe
authority), **D-9** (market-data tenancy/ownership/shared scope), or **D-10** (remaining Watchlists
authority decisions).

### Persistence

No persistence architecture changes. No IRR journal migration. No PMD store modification. No
relational persistence introduction.

### Identity / tenancy

No D115, tenant resolution, owner resolution, `companyId` ownership redesign, production tenant
authority, or human-identity implementation.

### Watchlists

No donor/server Watchlists integration. The established SG-1 browser-`localStorage` decision
remains untouched.

### Providers / production

No Dhan or NSE production changes. No provider credential changes. No production access,
authorization, or tenant configuration changes.

### OIDC / Operator Drop

No OIDC, Keycloak, Operator Drop, or production authentication modification or activation.

### Broad integration

No integration of Cockpit, IIPS, donor repositories, Windows workspaces, or any other repository.

---

## 7. DONOR / WINDOWS WORKSPACE STATUS

The previously reviewed Windows qualification workspace and the PMD-internal donor branch are:

```text
REFERENCE / EVIDENCE ONLY
```

Their later series-aware implementation may be consulted as a **technical reference** during the
subsequent implementation gate. They are **not authoritative**. Do not merge them, cherry-pick
them, wholesale-copy them, treat their branch or commit as authoritative, or overwrite the
authoritative repository with them.

**The authoritative repository (`ramkivs/iips-production-market-data`, branch
`arena/01a0e6d9-iips-production-market-data`) remains the source of truth.**

---

## 8. AUTHORITY BOUNDARY

**IU-2 only, bounded to §4.** This act grants authority to **implement** (the third GP-6 state).
It does **not** designate contracts and does **not** author contract content; the D114 identity
grammar in §2 is recorded as the **already-established** contract from the prior read-only
reconciliation, not newly authored here.

No authority is granted to activate any other surface, dataset, provider, runtime, or workstream.
All standing exclusions (PIT/IU-1, D-7, D-8, D-9, D-10, persistence, identity/tenancy, Watchlists,
Dhan, NSE, OIDC/Operator Drop, production, broad integration) remain in force.

**This act authorizes the subsequent IU-2 IMPLEMENTATION gate only.** It grants no production
authority and no authority for D-7/D-8/D-9/D-10.

---

## 9. THIS GATE DOES NOT IMPLEMENT

**No implementation was performed by this act.** No source, contract, parser, test, or PIT file
was created, modified, or deleted. `D114SecurityIdentity` does not yet exist in
`src/`; `securityIdentity` does not yet exist on D01/D02. Verified at act time: **0** references to
`D114SecurityIdentity` in `src/`, and `src/`, `tests/`, and `frontend/src/` trees are unchanged
from `main`.

---

## 10. REQUIRED ACCEPTANCE (for the subsequent implementation gate)

* Additive-only contract extension: D01/D02 remain source-compatible for existing consumers.
* Fail-closed behaviour: missing/malformed series rejected; malformed ISIN rejected.
* Exact D114 grammar preserved: `ISIN:<isin>:<series>`.
* `companyId` demonstrably **not** repurposed as the D114 identity.
* Additive tests for the identity type, the additive fields, and all four normalization seams.
* Full-suite regression with no existing test deleted or weakened.
* Comment-stripped boundary scan of the implementation delta (zero executable activation signals).
* Negative guards: PIT key unchanged, `CanonicalEnvelope` unchanged, `companyId` not repurposed,
  donor/Windows workspace not merged, no provider/OIDC/production activation.
* One implementation commit + push + LOCAL == REMOTE.

---

**Act recorded BEFORE any source change.**

**Repository / Branch at act time:** `ramkivs/iips-production-market-data` /
`arena/01a0e6d9-iips-production-market-data`
**Baseline HEAD at act time:** `a60ed703bb01feb0a8fb4aac867f203ee7e1e551`
**Recorded At (local, Asia/Calcutta):** 2026-09-28
**Recording Agent:** Arena — recording agent only.
