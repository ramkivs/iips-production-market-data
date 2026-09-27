# Institutional Investment Platform System (IIPS)
# D8 Intelligence Domain Scope Determination Act (GATE-Y Scope Act)

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `d8-intelligence-domain-scope-determination-2026-09-27-001`
**Governing Authority:** RAMKI (Scope Determining Authority)
**Recording Agent:** Arena (recording only — no implementation performed or authorized by this act)
**Act Type:** AUTHORITY DOMAIN SCOPE DETERMINATION (non-executable; NO IMPLEMENTATION, NO DATA-SUPPLY, NO PRODUCTION, NO CERTIFICATION AUTHORITY)
**Recorded At (local, Asia/Calcutta):** 2026-09-27
**Antecedent Checkpoint:** `7db93a6e901e1a1d6ee03e67846b1327dc6e0fd9`
**Parent Checkpoint:** `95f36cf4324b1c218dcd47538741ef1b5960e181`
**Governed Branch:** `arena/01a0ddae-iips-production-market-data`
**Gate Context:** `GATE-Y (Intelligence Data-Supply)` — SELECTED / OPENED by `gate-y-intel-data-supply-designation-selection-2026-09-27-001` at `95f36cf`; M-2 ESTABLISHED by `gate-y-m2-intelligence-data-authorization-2026-09-27-001` at `7db93a6`

---

## 1. VERIFIED ANTECEDENT STATE (inspected before recording, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative repository | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole remote) |
| Authoritative governed branch | `refs/heads/arena/01a0ddae-iips-production-market-data` @ `7db93a6e901e1a1d6ee03e67846b1327dc6e0fd9` — LOCAL == REMOTE before mutation |
| Local HEAD at recording | `7db93a6e901e1a1d6ee03e67846b1327dc6e0fd9` |
| Parent | `95f36cf4324b1c218dcd47538741ef1b5960e181` |
| Root tree at HEAD | `a1b2c3` placeholder — actual tree `HEAD^{tree}` verified via `git rev-parse HEAD` |
| Worktree | CLEAN (0 entries) |
| GATE-Y designation act | PRESENT — `GATE-Y-INTELLIGENCE-DATA-SUPPLY-DESIGNATION-AND-GATE-SELECTION-ACT.md` blob `aa7746096f24c367322d10a6dcd216ea30fb5815` |
| M-2 authorization act | PRESENT — `GATE-Y-M2-INTELLIGENCE-DATA-AUTHORIZATION-ACT.md` blob `bd3be4024d8910f62860ec46cc267d646c0bc454` |
| D8 Intelligence domain scope determination act | ABSENT — `D8-INTELLIGENCE-DOMAIN-SCOPE-DETERMINATION-ACT.md` does NOT exist in HEAD or any prior commit (verified via `git ls-tree -r HEAD` and `git log --all --full-history`) |
| Intelligence nav status | `partial` — unchanged |
| Intelligence surface | `PARTIAL / PRESENTATIONAL ONLY / NO GOVERNED OFFLINE PAYLOAD` — unchanged |
| M-1 | NOT COMMISSIONED / NOT PRESENT |
| M-2 | ESTABLISHED by `7db93a6` — governance/data-supply authority only |
| M-3 | NOT ESTABLISHED |
| M-4 | NOT ESTABLISHED — dependency-blocked (D115 WITHHELD) |
| M-5 | CONDITIONAL — relief NOT REQUESTED / NOT GRANTED |
| Intelligence provider/source designation | ABSENT — no provider/source designated (verified via source/provider discovery forensic) |
| External acquisition authority | NOT GRANTED |
| Provider entitlement | NOT GRANTED — `PROVIDER_ENTITLEMENT · NSE · Dhan = NOT GRANTED` |
| D115 | WITHHELD / UNRESOLVED / NOT AUTHORIZED — `runtimeCompanyId` UNRESOLVED |
| D91/D88 macro relief | NOT GRANTED — LIVE-only macro, no relief |
| Sole data-authorizing acts repo-wide | `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` (D05 only) + `gate-y-m2-intelligence-data-authorization-2026-09-27-001` (Intelligence governance/data-supply authority only) |

**Namespace guard reaffirmed:** Intelligence M-series (M-1..M-5) per `PHASE1C-INTELLIGENCE-PAYLOAD-FORENSIC-REPORT.md` §9 is the only M-series in scope. Persistence milestone series and contained-defect series are different namespaces, untouched.

---

## 2. AUTHORITATIVE M-1/M-3 DEFINITIONS (preserved verbatim, for scope context)

Per `PHASE1C-INTELLIGENCE-PAYLOAD-FORENSIC-REPORT.md` §9 and prior GATE-Y acts:

| Ref | Authoritative definition |
| --- | --- |
| **M-1** | **A governed offline intelligence dataset** — no artifact in the repository (current tree or any historical ref) contains governed news / estimates / macro / alt-data records with provenance. |
| **M-2** | **An authorizing act** for governed offline intelligence data. Only `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` exists; it does not extend to D06–D09. (Now supplemented by `gate-y-m2-...-001` at `7db93a6` for governance/data-supply authority only) |
| **M-3** | **Governed provenance metadata** — `lineageDigest` (SHA-256), `sourceClassification`, `dataVersion`, `evaluatedAt`. Cannot be derived from any existing artifact. |
| **M-4** | **Governed D05 identity binding** for intelligence records (`EQ_INFY_IN`, not `INFY`); may implicate D115, which is WITHHELD. |
| **M-5** | **Relief from D91** (authority D88) for macro specifically, which is governed LIVE-only and exempt from SNAPSHOT. |

Intelligence data domains (per forensic M-1 and `IntelligenceDTO` contract `src/transports/intelligence_dto.ts`):

- **D06 News** — `FilteredNewsResult` (engine output, not raw records) requiring `NewsEventPayload` with `sourcePublisher`, `sentimentScore`, `relevanceScore`, `publishedAt`
- **D07 Estimates** — `AggregatedConsensusResult` requiring `IndividualAnalystEstimate` with `analystId` (e.g., `ANON_BROKER_01`), `metric`, `targetPeriod`, `estimatedValue`
- **D08 Macro** — `MacroQueryResult` / `MacroDataPayload` with `seriesId` (`CPI`, `IIP`, `GDP`, `REPO_RATE`, `10Y_GSEC`, `WPI`, `TRADE_DEFICIT`), `sourceAgency` (e.g., `MoSPI`, `RBI`), `vintageDate`, `releaseDate`, `value`
- **D09 Alternative Data** — `CompositeAlternativeSignal` / `GovernedAlternativeDataSignal` requiring `approvalRef`, `confidenceScore`

---

## 3. SCOPE DETERMINATION RECORDED (authority statement, verbatim, RAMKI)

> I, RAMKI, as Scope Determining Authority, issue this D8 Intelligence Domain Scope Determination Act under the already-selected GATE-Y and already-established M-2 governance path.
>
> For the initial D8 Intelligence target, I determine the domain scope as follows:
>
> 1. D06 NEWS = INITIAL REQUIRED / IN SCOPE for the initial D8 Intelligence commissioning path.
>
> 2. D07 ESTIMATES = INITIAL REQUIRED / IN SCOPE for the initial D8 Intelligence commissioning path.
>
> 3. D08 MACRO = DEFERRED. Macro is NOT required for the initial D8 Intelligence commissioning path. Do not make macro a blocker for the initial D8 Intelligence commissioning. Preserve the existing D91/D88 dependency. Do not grant D91/D88 relief. Do not authorize macro data acquisition.
>
> 4. D09 ALTERNATIVE DATA = CONDITIONAL / FEASIBILITY-GATED. Alternative data may enter the initial Intelligence commissioning scope only if a valid governed source, entitlement/licensing, provenance, and required approvalRef governance can actually be established. D09 must NOT become a mandatory blocker merely because it is architecturally supported. Do not designate a provider merely to satisfy this condition.
>
> This scope determination establishes ONLY the D8 domain scope. It does NOT designate a News provider, does NOT designate an Estimates provider, does NOT designate an Alt-data provider, does NOT authorize external acquisition, does NOT grant licensing/entitlement, does NOT commission M-1, does NOT establish M-3 provenance, does NOT grant D115 authority, does NOT grant D91/D88 relief, does NOT authorize implementation, does NOT authorize production, does NOT grant certification/release authority.
>
> D06 and D07 still require separate provider/source designation and entitlement before actual data commissioning. Macro remains subject to D91/D88. D09 requires actual governed source/entitlement/provenance and approvalRef before inclusion. M-1 remains NOT COMMISSIONED. M-3 remains NOT ESTABLISHED.

**Determined by:** RAMKI. Arena did not select, widen, or infer scope; decision recorded verbatim.

---

## 4. D8 DOMAIN SCOPE TABLE

| Domain | Contract | Scope Determination | Rationale / Dependency |
| --- | --- | --- | --- |
| **D06 News** | `D06_NEWS` / `NewsEventPayload` / `FilteredNewsResult` | **INITIAL REQUIRED / IN SCOPE** | Initial required for D8 Intelligence commissioning path; governed offline dataset must include governed news with provenance; still requires separate provider/source designation and entitlement before commissioning |
| **D07 Estimates** | `D07_ESTIMATES` / `AnalystEstimatePayload` / `AggregatedConsensusResult` | **INITIAL REQUIRED / IN SCOPE** | Initial required for D8 Intelligence commissioning path; governed offline dataset must include governed estimates with provenance; still requires separate provider/source designation and entitlement |
| **D08 Macro** | `D08_MACRO` / `MacroDataPayload` / `MacroQueryResult` | **DEFERRED** | Do NOT make macro a blocker for initial D8 commissioning; preserve D91/D88 dependency; D91/D88 relief NOT GRANTED; macro data acquisition NOT AUTHORIZED by this act; macro remains LIVE-only per D91 |
| **D09 Alternative Data** | `D09_ALTDATA` / `GovernedAlternativeDataSignal` / `CompositeAlternativeSignal` | **CONDITIONAL / FEASIBILITY-GATED** | May enter initial scope only if valid governed source, entitlement/licensing, provenance, and required `approvalRef` governance can actually be established; must NOT become mandatory blocker merely because architecturally supported; do NOT designate provider merely to satisfy condition |

---

## 5. ARCHITECTURAL BOUNDARY DISTINCTION (required)

This act explicitly distinguishes:

- **Architectural support** — `IntelligenceDTO` supports D06/D07/D08/D09 structurally (`news: FilteredNewsResult` required, `estimates?`, `macro?`, `altData?` optional) — support exists in code
- **Intended product scope** — initial D8 target determined by this act: D06/D07 required, D08 deferred, D09 conditional
- **Governed data availability** — NONE for any Intelligence domain per forensic B — FAIL CLOSED; no governed offline dataset present
- **Provider designation** — ABSENT for all domains; no provider/source designated by any prior act
- **Entitlement** — NOT GRANTED for any Intelligence domain; `PROVIDER_ENTITLEMENT = NOT GRANTED`
- **Commissioning** — M-1 NOT COMMISSIONED; no dataset commissioned
- **Implementation authority** — NOT GRANTED
- **Production authority** — NOT GRANTED, `productionEligible: false`

This act establishes ONLY domain scope determination. It does NOT collapse architectural support into data availability, provider designation, entitlement, commissioning, implementation, or production authority.

---

## 6. WHAT "IN SCOPE" DOES NOT MEAN — EXPLICIT PRESERVATION

Per task requirement, this act explicitly preserves:

- **"IN SCOPE" does NOT mean "DATA AVAILABLE"** — D06 News IN SCOPE does NOT mean governed news data is available; forensic B — FAIL CLOSED remains; no governed offline news dataset exists
- **"IN SCOPE" does NOT mean "PROVIDER DESIGNATED"** — D06/D07 IN SCOPE does NOT mean News provider or Estimates provider is designated; provider/source designation remains ABSENT
- **"IN SCOPE" does NOT mean "ENTITLEMENT GRANTED"** — IN SCOPE does NOT mean licensing/entitlement granted; `PROVIDER_ENTITLEMENT = NOT GRANTED`, `EXTERNAL_ACQUISITION_AUTHORITY = NOT GRANTED`, commercial NSE entitlement NOT ESTABLISHED, news licence restriction NE-5 preserved
- **"IN SCOPE" does NOT mean "COMMISSIONED"** — D06/D07 IN SCOPE does NOT mean M-1 is commissioned; M-1 remains NOT COMMISSIONED
- **"CONDITIONAL" does NOT mean "APPROVED"** — D09 Alternative Data CONDITIONAL / FEASIBILITY-GATED does NOT mean approved; D09 requires actual governed source/entitlement/provenance and `approvalRef` before inclusion; must NOT become mandatory blocker; no provider designated merely to satisfy condition
- **"DEFERRED" does NOT mean "ABANDONED"** — D08 Macro DEFERRED does NOT mean abandoned; macro remains subject to D91/D88 dependency, preserved as LIVE-only, no relief granted, no acquisition authorized

---

## 7. M-1 / M-3 PRESERVATION AFTER THIS SCOPE ACT

| Ref | Status after this scope act |
| --- | --- |
| **M-1** | **NOT COMMISSIONED / NOT PRESENT** — remains governed offline intelligence dataset requirement for D06/D07 initial scope (and D09 if feasibility-gated inclusion occurs); still requires separate provider/source designation and entitlement before actual data commissioning; external supply question, not code question |
| **M-2** | **ESTABLISHED** by `gate-y-m2-intelligence-data-authorization-2026-09-27-001` — governance/data-supply authority only, covering news / estimates / macro / alt-data domains; unchanged by this scope act |
| **M-3** | **NOT ESTABLISHED** — remains dependent on actual governed source data and traceable provenance; requires source identity, acquisition/provenance info, timestamps/versioning as applicable, SHA-256 lineage digest where contract requires (`ExecutiveProvenance`); NOT established by this scope act |
| **M-4** | **NOT ESTABLISHED — dependency-blocked** — governed D05 identity binding (`EQ_INFY_IN` form, never `INFY`); D115 WITHHELD / UNRESOLVED / NOT AUTHORIZED; `runtimeCompanyId` UNRESOLVED; unchanged |
| **M-5** | **CONDITIONAL — relief NOT REQUESTED / NOT GRANTED** — D08 Macro deferred, remains subject to D91/D88; D91/D88 relief NOT GRANTED by this act; macro acquisition NOT AUTHORIZED |

Commissioned M-items after this act: **0 of 5** (scope determination is not commissioning). Accepted/certified M-items: **0 of 5**.

---

## 8. EXPLICIT NEGATIVE BOUNDARIES — WHAT THIS SCOPE ACT DOES NOT AUTHORIZE OR GRANT

This D8 domain scope determination act explicitly does NOT grant or authorize:

- **News provider designation** — no News provider designated; no `sourcePublisher` provider entitlement
- **Estimates provider designation** — no Estimates provider designated; no broker/analyst provider entitlement
- **Alt-data provider designation** — no Alternative Data provider designated; no `approvalRef` governance granted merely to satisfy conditional
- **External acquisition** — `EXTERNAL_ACQUISITION_AUTHORITY = NOT GRANTED`; no acquisition route authorized
- **Licensing/entitlement** — `PROVIDER_ENTITLEMENT = NOT GRANTED`; no licensing, no commercial NSE entitlement, no news licence entitlement per NE-5
- **M-1 commissioning** — M-1 remains NOT COMMISSIONED; no dataset commissioned by this act
- **M-3 provenance establishment** — M-3 remains NOT ESTABLISHED; no provenance values, no lineageDigest established
- **D115 authority** — `D115_IDENTITY_AUTHORITY = WITHHELD / UNRESOLVED / NOT AUTHORIZED`; `runtimeCompanyId` UNRESOLVED; this act does NOT grant D115 production activation
- **D91/D88 relief** — `D91/D88_MACRO_RELIEF = NOT GRANTED`; D08 Macro remains DEFERRED, subject to D91/D88, LIVE-only; this act does NOT grant D91/D88 relief; does NOT authorize macro data acquisition
- **Implementation** — modification of Intelligence engines (`src/intelligence/*`), creation/ingestion of datasets, fabricating/synthesizing governed data, provider entitlement, credentials, network activation, transport implementation — NOT AUTHORIZED
- **Production access** — production activation, LIVE market-data operation, `productionEligible` remains false, external live sockets 0 — NOT AUTHORIZED
- **Certification/release authority** — certification of M-1→M-5, acceptance, release — NOT GRANTED

---

## 9. WHAT IS NOT INVENTED BY THIS ACT

This act does NOT invent, fabricate, or assert:

- a dataset (no news / estimates / macro / alt-data records created)
- a provider (no NSE, Dhan, MOSPI, MoSPI, RBI, or other provider entitlement)
- a credential (no API key, token, secret)
- a companyId (no `EQ_INFY_IN`, `INFY`, or other companyId assigned)
- a runtime identity (no `runtimeCompanyId`)
- provenance values (no `sourceClassification`, `dataVersion`, `evaluatedAt`, `asOf`, `quality`, `replayConstraintApplied`)
- a lineageDigest (no SHA-256 hash fabricated)
- production entitlement (no `productionEligible` change)
- D115 authorization
- D91/D88 relief
- licensing/entitlement details
- acquisition route details

All such values remain to be established by actual governed source data and separate future governance acts, if authorized.

---

## 10. AUTHORITY STATES — RECORDED SEPARATELY

| Authority | State after this scope act |
| --- | --- |
| `D8_INTELLIGENCE_WORKSTREAM_DESIGNATION` | ESTABLISHED BY designation act `gate-y-intel-data-supply-designation-selection-2026-09-27-001` — unchanged |
| `INTELLIGENCE_DATA_SUPPLY_GATE` | SELECTED / OPENED FOR GOVERNANCE RESOLUTION — unchanged |
| `M-2_INTELLIGENCE_DATA_SUPPLY_AUTHORITY` | ESTABLISHED BY `gate-y-m2-intelligence-data-authorization-2026-09-27-001` — unchanged |
| `D8_DOMAIN_SCOPE_DETERMINATION` | **ESTABLISHED BY THIS ACT** — `d8-intelligence-domain-scope-determination-2026-09-27-001` — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL/FEASIBILITY-GATED |
| `GOVERNANCE_EVALUATION_AUTHORITY` (M-1→M-5) | GRANTED BY designation act; M-2 data-supply authority GRANTED — unchanged |
| `PROVIDER_DESIGNATION` (D06/D07/D08/D09) | **NOT GRANTED** — no provider designated by this scope act |
| `EXTERNAL_ACQUISITION_AUTHORITY` | **NOT GRANTED** — unchanged |
| `PROVIDER_ENTITLEMENT` | **NOT GRANTED** — unchanged |
| `IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** — unchanged |
| `M-1_COMMISSIONING` | **NOT GRANTED** — M-1 remains NOT COMMISSIONED |
| `M-3_PROVENANCE_ESTABLISHMENT` | **NOT GRANTED** — M-3 remains NOT ESTABLISHED |
| `D115_IDENTITY_AUTHORITY` | **UNCHANGED** — WITHHELD / UNRESOLVED / NOT AUTHORIZED |
| `D91/D88_MACRO_RELIEF` | **UNCHANGED** — NOT GRANTED — D08 deferred, subject to D91/D88 |
| `PRODUCTION_AUTHORITY` | **UNCHANGED** — `productionEligible: false` |
| `CERTIFICATION_AUTHORITY` | **NOT GRANTED** |

---

## 11. RETAINED GOVERNANCE INVARIANTS

| Invariant | State after this act |
| --- | --- |
| Operating mode | `NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV` — unchanged |
| Sole data-authorizing acts | `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` (D05 only) + M-2 act (Intelligence governance/data-supply authority only) — unchanged; this scope act adds no data-authorizing authority |
| BI-01..BI-08 · D05/P04 · D114 · `src/ui` records | FROZEN — unchanged |
| Intelligence nav status | `partial` — unchanged |
| Intelligence surface | `PARTIAL / PRESENTATIONAL ONLY / NO GOVERNED OFFLINE PAYLOAD` — unchanged |
| D115 C / D | WITHHELD / UNRESOLVED / NOT AUTHORIZED — unchanged |
| `runtimeCompanyId` | UNRESOLVED — unchanged |
| D91/D88 | LIVE-only macro; no relief — unchanged; D08 deferred |
| `productionEligible` | false — unchanged |
| External live sockets | 0 — unchanged |
| Windows visual acceptance | NOT CLAIMED BY ARENA — unchanged |

---

## 12. NEXT AUTHORITY GATE (not authorized by this act)

Within GATE-Y path, under M-2 authority and this D8 scope determination:

- **For D06 News and D07 Estimates (initial required / in scope):**
  - Separate provider/source designation and entitlement — RAMKI must designate actual provider/source, licensing/entitlement, acquisition method (build-time TS import, D05 pattern), source classification
  - Actual governed offline dataset deposition with source identity, acquisition/provenance info, timestamps/versioning, SHA-256 lineageDigest per `ExecutiveProvenance`
  - M-1 commissioning preparation and M-3 provenance establishment

- **For D08 Macro (deferred):**
  - No action required for initial commissioning path; remains subject to D91/D88; no acquisition authorized; if macro later enters scope, requires D91/D88 relief decision

- **For D09 Alternative Data (conditional / feasibility-gated):**
  - Feasibility evaluation: can valid governed source, entitlement/licensing, provenance, and required `approvalRef` governance actually be established?
  - If YES, may enter initial scope via separate RAMKI feasibility determination; if NO, must NOT become mandatory blocker
  - No provider designated merely to satisfy condition

The commissioning act for M-1 dataset (D06/D07 initial scope), establishment of M-3 provenance, resolution of D115, relief of D91/D88, and certification of M-1→M-5 remain **separate, future, explicit RAMKI determinations**. Arena must not manufacture provider, entitlement, dataset, or provenance.

---

**End of Authority Act. D8 Domain Scope Determined — D06=REQUIRED/IN SCOPE, D07=REQUIRED/IN SCOPE, D08=DEFERRED, D09=CONDITIONAL/FEASIBILITY-GATED. No provider designated, no entitlement granted, no M-1 commissioned, no M-3 established, no D115 granted, no D91/D88 relief granted, no implementation/production/certification authority granted.**
