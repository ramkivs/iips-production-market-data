# P01 — DEPENDENCY AND DEFERRED-DECISION REGISTER

Decisions the contract **touches** but must **not** make. Recording an item does **not**
resolve it.

---

## 1. Inherited open items — impact on the P01 contract

| Item | State (unchanged) | How it touches the contract | Resolved here? | Owner |
|---|---|---|---|---|
| **OI-08** — identity cardinality 1 → N | **OPEN** | `identity` slot is defined without constraining cardinality; N-per-sector is a product-behaviour change | **NO** | P04 |
| **OI-09** — external identifier standard | **OPEN** | `externalIdentifiers[]` slot exists; no standard is assumed authoritative | **NO** | P04 |
| **OI-10** — exact namespace token | **`APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING`** | Every canonical key is expressed as `<NS>`+segments; the token is **not chosen**; `MD:<domain>.<field>` **NOT adopted** | **NO** | ADR-01 authority |
| **AD-17** — `ReplayService` literal-return semantics (M-2) | **UNRESOLVED** | ADR-02 fields are represented; recomputation-verification is an independent concern | **NO** | Existing-IIPS authority |
| **M-1** — E2E-030 revalidation | **`OPEN_REVALIDATION_REQUIRED`** | Blocks validation (not specification) of the contract delta; E2E-030 **NOT REVOKED, NOT RENEWED** | **NO** | External |
| **M-5** — authentication/session | **OPEN** | Bears on entitlement/tenant boundary slots (P03) | **NO** | Existing-IIPS authority |
| **M-6** — retention not enforced | **OPEN** | D09/D06 record `retentionDays`; recording is **not** enforcement | **NO** | Existing-IIPS authority |
| **OI-05** — alt-data applicability | **OPEN** | D09 is conditional-by-applicability; criteria undefined | **NO** | P10 |
| **OI-06** — replace/supplement/re-source displayed financials | **OPEN** | D03 mapping exists; product disposition is an authority question | **NO** | Authority |
| **CD-01** — line-citation drift (`LiveDataRuntime.ts:76` vs `:78`) | **OPEN** | P01 pins commits per P00 evidence conventions | **NO** | Citation-cleanup run |
| **AD-9**, **P10 coverage** | **OPEN** | Carried from `D8_STATUS.json`; no P01 impact recorded | **NO** | Later phases |

## 2. New P01-raised dependencies

| ID | Dependency | Why it arises | Deferred to | Blocking P01 gate? |
|---|---|---|---|---|
| **DEP-P01-01** | Canonical-key literal form cannot be finalized | OI-10 token unrecorded | ADR-01 authority | **No** — contract is structurally complete without it |
| **DEP-P01-02** | Identity cardinality unconstrained in the contract | OI-08 | P04 | No |
| **DEP-P01-03** | External identifier set unconstrained | OI-09 | P04 | No |
| **DEP-P01-04** | Series representation: `DataSnapshot.asOf` is a **scalar**, not a series. Whether a D02 series is an ordered set of snapshots or a bounded series inside `T` is a **storage-model** decision | D02 requires series delivery | **P08** | No — either satisfies the contract |
| **DEP-P01-05** | Freshness **thresholds** undefined | Contract supplies inputs only | **P07** | No |
| **DEP-P01-06** | Provider→canonical field mappings undefined | Provider-independence is required | **P06** | No — mapping is per-provider by design |
| **DEP-P01-07** | Contract tests and golden fixtures specified but **not produced** | Implementation prohibited in P01 (`D4_12` line 25) | P05/P06 execution + P15 | No — recorded as an obligation |
| **DEP-P01-08** | Byte-identity re-demonstration of certified baselines cannot be run | M-1 / AD-4 — suites do not execute | External + P15 | No — specification proceeds, validation cannot |
| **DEP-P01-09** | `identityMappingVersion` value space undefined | Produced by the P04 adapter | **P04** | No — slot defined |
| **DEP-P01-10** | Entitlement/tenant slot semantics partially undefined | P03 + M-5 | **P03** | No |
| **DEP-P01-11** | Adjustment engine semantics beyond the contract slots | D02/D04 | **P08** | No |
| **DEP-P01-12** | Engine-input mapping declarations (namespaced → frozen engine keys) | Must be explicit and evidenced | **P11** | No — the *prohibition* on name-coincidence merging is fixed here |

## 3. Downstream consumers of the P01 contract (per tracker `Work Tracker` dependencies)

| Consumer | Tracker dependency on P01 |
|---|---|
| **P02** provider adapter interface | `P01-01`, `P01-05` |
| **P03** tenant/access controls | `P01-05` |
| **P04** instrument master | `P01`, P02, P03 |
| **P06** normalization pipeline | `P01`, P04, P05 |
| **P07** freshness/staleness | `P01-02` |
| **P08** PIT storage model | `P01-02`, P06-01 |
| **P09** fundamental normalization | `P01-03` |
| **P10** alt-data governance | `P01-05` |
| **P11** evidence lineage | `P01-05` |
| **P12** live/snapshot/PIT API semantics | `P01-04` |

## 4. Prohibitions reaffirmed

| # | Prohibition |
|---|---|
| 1 | No second market-data ingress contract (**G2 retired**; AD-2) |
| 2 | No new engine metric key — methodology authority is **Ramki/Sai**, not this program |
| 3 | No modification of existing-IIPS, the 13 engines, scoring/calibration/taxonomy, Auto Option-A, Materials G1–G6, Telecom D16, `LiveDataRuntime.ts`, `DataBoundExecutor`, `ReplayService`, E2E-030 or `PROGRAM_v1.1_REPLAY_BASELINE.json` |
| 4 | No AD-14 tracker corrections applied |
| 5 | No new domain beyond D01–D10 |
| 6 | No invented authority, name, date, certification or evidence. **UNKNOWN over guessing** |
