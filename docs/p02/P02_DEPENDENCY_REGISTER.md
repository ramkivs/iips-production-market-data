# P02 — DEPENDENCY AND OPEN-ITEM REGISTER

Recording an item does **not** resolve it.

---

## 1. Inherited open items — disposition in P02

| Item | State (unchanged) | How it touches P02 | Resolved here? | Owner |
|---|---|---|---|---|
| **OI-10** — exact namespace token | **`APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING`** | Adapters must apply the namespace; the literal token is unavailable, so literal key emission and mechanical C1/C2 checking are blocked. `MD:<domain>.<field>` **NOT adopted** | **NO** | ADR-01 authority |
| **OI-08** — identity cardinality 1 → N | **OPEN** | Mapping does not presume or constrain cardinality | **NO** | **P04** |
| **OI-09** — external identifier standard | **OPEN** | `identifierInputs[]` cannot be constrained; provider comparison on identity is not possible | **NO** | **P04** |
| **AD-17** — `ReplayService` literal returns (M-2) | **UNRESOLVED** | Adapter-determinism replay of retained payloads is a **different** concern; `ReplayService` untouched | **NO** | Existing-IIPS authority |
| **M-1** — E2E-030 revalidation | **`OPEN_REVALIDATION_REQUIRED`** | Blocks validation, not specification. E2E-030 **NOT REVOKED, NOT RENEWED** | **NO** | External |
| **M-5** — authentication/session not wired | **OPEN** | Entitlement design must not presume a working auth substrate | **NO** | Existing-IIPS authority |
| **M-6** — retention not enforced | **OPEN** | Retention-based entitlement controls are currently unenforceable | **NO** | Existing-IIPS authority |
| **OI-05** — alt-data applicability | **OPEN** | D09 entitlement cannot be finalized | **NO** | P10 |
| **OI-06** — displayed-financials disposition | **OPEN** | No P02 impact recorded | **NO** | Authority |
| **CD-01** — citation drift | **OPEN** | P02 pins commits per P00 conventions | **NO** | Cleanup run |
| **AD-9**, **P10 coverage** | **OPEN** | No P02 impact recorded | **NO** | Later phases |
| **A1 security/identity authority** | **UNKNOWN** | P03 is `BLOCKED — AUTHORITY`; P02 stays clear of secrets entirely | **NO** | Authority |

## 2. P02-raised dependencies

| ID | Dependency | Why it arises | Deferred to | Blocks P02 gate? |
|---|---|---|---|---|
| **DEP-P02-01** | Literal canonical key emission and mechanical C1/C2 partition checking | **OI-10** token unrecorded | ADR-01 authority; consumed by P05/P06 | **No** — all namespace-dependent elements specified structurally |
| **DEP-P02-02** | D09 entitlement scope cannot be finalized | **OI-05** applicability criteria undefined | P10 | No |
| **DEP-P02-03** | Retention-based entitlement controls are **unenforceable today** | **M-6** stub | Existing-IIPS authority | No — recorded as a limitation |
| **DEP-P02-04** | Provider-identity register does not exist | Operational artifact | **P05** | No — required content and rules defined |
| **DEP-P02-05** | Licence-mandated vendor attribution *display* | Conflicts in principle with NFR-06 non-exposure | **P12 / P13** | No — recorded, not decided |
| **DEP-P02-06** | Cost dimension of the selection rubric is **UNKNOWN** | No commercial authority exists in this program | Authority / P16 | No — `UNKNOWN` recorded, not guessed |
| **DEP-P02-07** | **No provider-selection authority is recorded** | Selection is an authority act; no A-role is assigned to it | Authority | No — P02 defines the rubric, not the choice |
| **DEP-P02-08** | Executable provider SPI/interface (tracker `P02-01` deliverable *"Provider SPI/interface"*) | Standing implementation prohibition | P05 | No — recorded as obligation |
| **DEP-P02-09** | Contract test suite and conformance fixtures (tracker `P02-01` *"Contract test suite"*) | Implementation prohibition + **OI-10** for literal keys | P05 + P15 | No — recorded as obligation |
| **DEP-P02-10** | Populated entitlement matrix | No provider selected, no licence exists | P16 | No — **empty is the correct state** |
| **DEP-P02-11** | Retry/failover orchestration policy | Sits **above** the adapter | P05 / P07 / P17 | No |
| **DEP-P02-12** | Freshness thresholds and reconciliation policy | Contract supplies inputs only | **P07** | No |
| **DEP-P02-13** | `identityMappingVersion` value space | Produced by the P04 adapter | **P04** | No — pass-through defined |
| **DEP-P02-14** | Credential storage, service identity, tenant enforcement | Explicitly out of scope | **P03** | No |

## 3. Deferred executable obligations (tracker reconciliation)

| Tracker row | Deliverable | Disposition |
|---|---|---|
| `P02-01` | *Provider SPI/interface* | Specified as normative obligations in `P02_PROVIDER_ABSTRACTION_CONTRACT.md` §3; executable artifact **deferred — DEP-P02-08** |
| `P02-01` | *Contract test suite* ("two implementations can conform") | **Deferred — DEP-P02-09** |
| `P02-02` | *Entitlement model / matrix* | Model **delivered**; matrix structure delivered, **necessarily empty — DEP-P02-10** |
| `P02-03` | *Provider evaluation rubric* | Rubric **delivered**; no candidate evaluated or selected — **DEP-P02-07** |

**Justification for deferral:** the program has produced no executable source in any phase; the
D4 standing prohibition (`D4_12_PHASE_SEQUENCE.md`) governs implementation, and P02's tracker
readiness is **SPEC-READY**. Deferral is recorded, not silent.

## 4. Downstream consumers of P02

| Consumer | Tracker dependency |
|---|---|
| **P03-01** credential/secrets handling | `P02-01` |
| **P04-01** instrument master | `P01, P02, P03` |
| **P05-01** local deterministic feed | `P02-01, P04-01` |
| **P05-02** live market adapter | `P02-01, P02-02, P03-01, P04-02` |
| **P07-03** provider reconciliation | `P02-03, P07-01` |
| **P10-01** news/events ingestion | `P02, P04, P06, P07` |

## 5. Prohibitions reaffirmed

| # | Prohibition |
|---|---|
| 1 | No provider named, selected, contacted or implemented |
| 2 | **No credential, secret, key, token, endpoint or account** in any artifact |
| 3 | No acquisition, normalization, DQ, security-master, PIT, replay, engine, API, UI, certification or activation work |
| 4 | No second ingress contract (**G2 retired**; AD-2) |
| 5 | No existing-IIPS change; no repair of M-1, M-5 or M-6; no `ReplayService` change; **AD-17 not resolved** |
| 6 | No methodology decision; no new engine metric key |
| 7 | No new data domain beyond D01–D10 |
| 8 | No invented authority, name, date, certification or evidence. **UNKNOWN over guessing** |
