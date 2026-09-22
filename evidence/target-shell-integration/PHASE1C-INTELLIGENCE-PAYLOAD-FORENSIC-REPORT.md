# Institutional Investment Platform System (IIPS)
# GATE-PHASE-1C-INTELLIGENCE-PAYLOAD-FORENSIC — Read-Only Forensic + Design Determination

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Gate ID:** `GATE-PHASE-1C-INTELLIGENCE-PAYLOAD-FORENSIC`
**Authority Record:** `848d8f9f92e58722182e731ac1fd47f782eba781` (RAMKI, OPTION A)
**Implementation Authority:** **NOT GRANTED**
**Gate Type:** READ-ONLY FORENSIC + DESIGN (non-implementation)
**Executed At (local, Asia/Calcutta):** 2026-09-22
**Baseline HEAD:** `848d8f9f92e58722182e731ac1fd47f782eba781`

---

## FINAL CLASSIFICATION

> # **B. NO GOVERNED OFFLINE PAYLOAD SOURCE FOUND — FAIL CLOSED**

The repository contains **no artifact that can legitimately serve as a governed offline
`IntelligenceDTO` source**. Structurally compatible data exists; **governed** data does not.
The gate fails closed, as required.

---

## 1. REPOSITORY INTEGRITY (REQ-9)

| Check | Pre-work | Post-work |
| --- | --- | --- |
| HEAD | `848d8f9f…a781` | `848d8f9f…a781` |
| Root tree | `063ee26917eaa4bc563316e2cc3ced07dcd0ff9e` | `063ee26917eaa4bc563316e2cc3ced07dcd0ff9e` **IDENTICAL** |
| Worktree | CLEAN | CLEAN |
| `src/identity` | `9080e997` | `9080e997` |
| `src/d114` | `0062ad52` | `0062ad52` |
| `frontend/src/features/portfolio` | `8491efdc` | `8491efdc` |
| `src/ui` | `1597ed06` | `1597ed06` |
| Test suite | 413/413, 65 suites, 0 failures | 413/413, 65 suites, 0 failures |

**Zero source, test, or configuration modifications.** The root tree hash is byte-identical
before and after, which proves no file in the repository changed during this gate.

---

## 2. THE TARGET CONTRACT (REQ-3)

`src/transports/intelligence_dto.ts` (P12 / D06..D09):

```
IntelligenceDTO {
  companyId:   string                                 // REQUIRED
  news:        FilteredNewsResult                     // REQUIRED (engine OUTPUT, not raw records)
  estimates?:  AggregatedConsensusResult | null        // optional
  macro?:      MacroQueryResult[] | null               // optional
  altData?:    CompositeAlternativeSignal | null       // optional
  quality:     QualityState                            // REQUIRED
  provenance:  ExecutiveProvenance                     // REQUIRED
}
```

**Decisive structural fact:** the DTO's required `news` field is `FilteredNewsResult` — an
**engine output**, not a raw record array. It carries `totalAvailable`, `filteredCount`,
`dominantSentiment`, `averageSentimentScore`, `qualityState`. Raw records cannot populate it
directly; they must pass through `NewsEngine.ingestNews()` + `queryNews({asOf, ...})`.

`ExecutiveProvenance` (required) demands:

| Field | Requirement |
| --- | --- |
| `sourceClassification` | governed `SourceClassification` enum |
| `asOf`, `evaluatedAt` | ISO-8601 UTC |
| `dataVersion` | governed version string |
| `lineageDigest` | **Cryptographic SHA-256 hash** |
| `quality` | governed `QualityState` |
| `replayConstraintApplied` | boolean (AD-17) |

---

## 3. CANDIDATE INVENTORY AND ADJUDICATION (REQ-1, REQ-2, REQ-4)

Investigation was **not** limited to filenames containing "IntelligenceDTO". Method: semantic
sweep of all 47 non-package data files; repo-wide grep for domain markers (`headline`,
`sentimentScore`, `consensusMean`, `analystCount`, `datasetName`, `seriesId`); and a
`git rev-list --all --objects` sweep of **all history on all refs** for non-TypeScript
intelligence artifacts.

### C-1 — `tests/fixtures/d06..d09_fixtures.json` (strongest candidate)

| Attribute | Finding |
| --- | --- |
| Paths | `tests/fixtures/d0{6,7,8,9}_fixtures.json` |
| Blobs | `4353902c…`, `85850bff…`, `cadb2cc7…`, `71ae0326…` |
| Commit provenance | `94f519b` (merge PR #1) — no earlier lineage |
| Originating gate | WSA / P01 contract validation |
| Sole consumer | `tests/wsa_p01_contracts.test.ts` (lines 35–38) |
| Classification | **TEST FIXTURE** |
| Governed? | **NO** |

**Why it fails — five independent grounds, each sufficient:**

1. **Contains deliberately invalid data.** Each file ships an `invalidNews` /
   `invalidEstimates` / `invalidMacro` / `invalidAltData` array of intentionally malformed
   records (`sentimentScore: 5.0`, `publishedAt: "INVALID_DATE"`, `confidenceScore: 2.5`).
   This is a **negative-test harness construct**, not a data distribution. Its purpose is to
   prove validators reject bad input.
2. **No provenance whatsoever.** Governance-field scan: d06 `NONE`, d07 `['asOf']` only,
   d08 `NONE`, d09 `NONE`. No `lineageDigest`, no `sourceClassification`, no `dataVersion`,
   no `evaluatedAt`. `ExecutiveProvenance` **cannot be populated** from these files; every
   provenance value would have to be invented.
3. **Identity is not governed.** Fixtures use `companyId: "INFY"`. The governed D05 identity
   for that entity is **`EQ_INFY_IN`**. `INFY` appears in `src/identity/` only as an
   **exchange symbol** (`{ exchange: 'NSE', symbol: 'INFY' }`), never as a `companyId`
   (verified: 0 files contain `companyId: 'INFY'`). Using it would violate historical
   boundary **NE-2** — *"Entity linking to D05 canonical identity — never provider-native
   symbols."*
4. **Wrong shape for the required field.** These are raw records; the DTO requires
   `FilteredNewsResult` (engine output). Bridging requires engine execution plus synthesis of
   the aggregate statistics — transformation that itself requires authority (see §6).
5. **Test compatibility ≠ governance authorization** (explicitly excluded by REQ-4).

### C-2 — `src/intelligence/*_engine.ts` (news / estimates / macro / altdata)

Engines are **in-memory stores requiring injection**: `NewsEngine` holds
`private newsStore: NewsEventPayload[] = []` and is populated only via `ingestNews(item)`.
There is **no persistent governed source, no embedded dataset, no loader**. The engines are
transformation machinery, not a data source. **Not a payload source.**

### C-3 — D05 / P04 governed artifacts

`evidence/operator_drop/d05_security_master_broad_universe.json`,
`d05_security_master_manifest.json`, `tests/fixtures/d05_fixtures.json`,
`operator_drop_fixtures.json`, `src/identity/governed_fixture_master.ts`.

Scanned for every intelligence marker: **`NONE` in all files.** D05 is a **security master** —
identity, ISIN, CIN, listings, sector. It contains **zero** news, estimates, macro, or
alt-data content. Genuinely governed, but **categorically the wrong domain**.

### C-4 — `evidence/**` (37 JSON artifacts)

All are **governance records**: certification reports, manifests, integrity/reconciliation
reports, authority decisions, SHA-256 manifests. None carries intelligence-domain payload
data. **Reports about work, not market data.**

### C-5 — Historical `frontend/server/macro/mospi-source.ts` — **OUTSIDE PATH L**

Historical tree `7a4b0cb4…` contains a **live HTTP client** targeting
`https://api.mospi.gov.in` and `https://mcp.mospi.gov.in`, with `freshness: 'LIVE'`.
Requires network + `frontend/server/**`. **Explicitly outside the authorized boundary** and
outside Path L. Classified OUTSIDE per REQ-5.

### C-6 — Historical `p10/src/*Model.js` (D06–D09 canonical models)

Contain canonical field contracts and **zero literal records** (verified: 0 literal
`headline` values). Their own stated boundaries are dispositive:

- **NE-5** — *"News content is typically licence-restricted → classification + entitlement."*
- **NE-6** — *"No live provider execution. LOCAL_FIXTURE only."*
- **NE-1** — *"Governance classification REQUIRED (AD-11) before admission."*

**Models, not data.**

### C-7 — `docs/v3.0/e2e-018-screenshots/company-intelligence_*.png`

PNG screenshots. Not machine-readable payload. **Not a data source.**

---

## 4. DATA AUTHORITY CLASSIFICATION (REQ-4)

| Classification | Present in repository? | Instance |
| --- | --- | --- |
| Governed payload | **NO** | — |
| Governed source data | **NO** (for intelligence domain) | D05 exists but is identity-domain only |
| Test fixture | YES | C-1 `d06..d09_fixtures.json` |
| Synthetic fixture | YES | C-1 `invalid*` arrays (deliberately malformed) |
| Example/demo data | NO | — |
| Derived view-model | YES | `ui04_domain_intelligence.ts` (consumer, not source) |
| Merely structurally compatible | YES | C-1 `valid*` arrays |

The only intelligence-shaped data in the repository lands in the bottom row: **structurally
compatible, not governed**.

---

## 5. DEPENDENCY BOUNDARY (REQ-5)

Had a governed payload existed as static on-disk data, consumption **could** have remained
within Path L (zero fetch / authFetch / API / OIDC / Keycloak / frontend-server / network /
credentials), following the established D05 precedent: *"Browser runtime uses build-time
imported canonical D05 dataset with zero dynamic Node fs/path dependencies."*

**Boundary note for any future gate:** `fs.readFileSync` is **not browser-safe**. A future
governed payload must be a **build-time TypeScript import** (the D05 pattern), not a runtime
file read. This is a design constraint, not an authorization.

C-5 (`mospi-source.ts`) is the sole candidate requiring prohibited dependencies and is
classified **OUTSIDE** the boundary.

---

## 6. EXISTING GOVERNANCE — THE MISSING AUTHORITY (REQ-6)

Exhaustive search for authorizing acts (`AUTH-*-ACT-*`) across `src/`, `docs/`, `evidence/`
returned **exactly one**:

```
AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001
```

This act authorizes the **D05 broad-universe security master only**. Search for any act
naming INTELLIGENCE, NEWS, ESTIMATES, MACRO, or ALTDATA returned **zero results**.

The D05 precedent establishes exactly what a governed offline dataset looks like in this
repository — a named authorizing act in the file header, an explicit execution mode, and a
fail-closed policy stating *"Under NO circumstances are identifiers fabricated or inferred."*

**No equivalent exists for the intelligence domain. The authority is absent, not merely
undocumented.** Per REQ-6, no authority was invented.

Additionally, **D91** (`docs/D91_MACRO_LIVE_ONLY_EXEMPTION_DISCLOSURE.md`, authority
**D88 = A**) is directly adverse for the macro sub-domain: macro data is governed
**LIVE-only**, explicitly **exempt** from SNAPSHOT, *"disallowing fallback to SNAPSHOT
baseline data."* An offline macro payload would **contradict standing macro governance**.

---

## 7. WHY A SYNTHETIC PAYLOAD CANNOT SUBSTITUTE (REQ-7)

1. **Expressly prohibited** by the gate: no fabricated or synthesized intelligence data; no
   synthetic payload presented as governed production intelligence.
2. **`lineageDigest` requires a cryptographic SHA-256 over a real lineage.** A hash computed
   over invented content is a **forged provenance claim** — worse than an empty state,
   because it is indistinguishable from a real one downstream.
3. **`sourceClassification` would be a false attestation.** Marking invented records
   `GOVERNED_EXCHANGE_DISCLOSURE` would make the UI render a **CERTIFIED** badge over
   fabricated content — the precise failure the honest-navigation contract prevents.
4. **NE-5 licence restriction.** Real news content is licence-restricted; inventing
   substitutes launders an entitlement gap rather than resolving it.
5. **D115 is WITHHELD.** Minting a `companyId` binding to carry a payload would be a
   backdoor around D115 C/D.

The current honest empty state is **strictly superior** to a fabricated payload.

---

## 8. MINIMUM DESIGN — NOT AUTHORIZED, RECORDED FOR THE NEXT GATE (REQ-7)

No valid governed payload exists, so **no implementation design is proposed**. Recorded only
as the shape a *future* authorized gate would need — **this is not an implementation plan and
confers no authority**:

1. **An authorizing act** for governed offline intelligence data, modelled on
   `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001`.
2. **Genuinely governed source records** with real provenance, for the three domains not
   blocked by D91 (news / estimates / alt-data). Macro requires separate relief from D91.
3. **Governed D05 identity binding** (`EQ_INFY_IN` form, never `INFY`) — which may implicate
   D115 and therefore requires its own authority.
4. **Build-time TypeScript import** (D05 pattern), never runtime `fs`.
5. A real **`lineageDigest`** computed over the actual governed source.

---

## 9. EXACT MISSING ARTIFACT / AUTHORITY

| # | Missing item |
| --- | --- |
| **M-1** | **A governed offline intelligence dataset** — no artifact in the repository (current tree or any historical ref) contains governed news / estimates / macro / alt-data records with provenance. |
| **M-2** | **An authorizing act** for governed offline intelligence data. Only `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` exists; it does not extend to D06–D09. |
| **M-3** | **Governed provenance metadata** — `lineageDigest` (SHA-256), `sourceClassification`, `dataVersion`, `evaluatedAt`. Cannot be derived from any existing artifact. |
| **M-4** | **Governed D05 identity binding** for intelligence records (`EQ_INFY_IN`, not `INFY`); may implicate D115, which is WITHHELD. |
| **M-5** | **Relief from D91** (authority D88) for macro specifically, which is governed LIVE-only and exempt from SNAPSHOT. |

---

## 10. RETAINED GOVERNANCE INVARIANTS

| Invariant | State |
| --- | --- |
| Gate outcome | **B — FAIL CLOSED** |
| Intelligence surface | `PARTIAL / PRESENTATIONAL ONLY / NO GOVERNED OFFLINE PAYLOAD` (unchanged) |
| Implementation authority | NOT GRANTED |
| BI-01..BI-08 | UNCHANGED / BI-08 AUTHORITATIVE |
| D05/P04 identity | UNCHANGED |
| PortfolioWorkspace | UNCHANGED |
| D114 | UNCHANGED |
| D115 C / D | UNRESOLVED / WITHHELD / NOT AUTHORIZED |
| `runtimeCompanyId` | UNRESOLVED |
| `productionEligible` | false |
| External live sockets | 0 |
| Windows visual acceptance | NOT CLAIMED BY ARENA |

---

## 11. EXACT NEXT AUTHORITY ACTION REQUIRED

The gate fails closed. Intelligence remains `PARTIAL`. RAMKI may:

- **(i)** Issue an authority act commissioning a **governed offline intelligence dataset**
  (resolving M-1..M-4, and M-5 if macro is in scope) — noting the data must be genuinely
  governed and sourced, which is an **external supply question**, not a code question; **or**
- **(ii)** **Accept `PARTIAL` as the terminal state** for Intelligence under Path L and
  designate the next product surface; **or**
- **(iii)** Authorize a different construction path for Intelligence — which would require
  lifting the API/server/auth prohibition and is **not** recommended by this report.

**No implementation may proceed under the current authority.**

---

**End of Forensic Determination. Gate STOPPED. No implementation performed.**
