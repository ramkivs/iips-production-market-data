# GP-6 — E6 LINEAGE ALGORITHM / SERIALIZATION AUTHORITY ACT
# EXPLICIT RAMKI DESIGNATION / NO INFERENCE / NO SERIALIZATION SELECTION / NO IMPLEMENTATION

Governing Standards   : AD-01..AD-18 / AD-CHARTER-2026-01
Act ID                : gp-6-e6-lineage-algorithm-serialization-2026-09-27-001
Governing Authority   : RAMKI
Recording Agent       : Arena (Arena.ai Agent Mode)
Act Type              : LINEAGE CRYPTOGRAPHIC DESIGNATION AUTHORITY ACT (governance only)
Recorded At           : 2026-09-27 (Asia/Calcutta)
Antecedent Checkpoint : c2b7095e116cf1a2b5fc9523f8fcba22ab5ad55f

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

Every value below was re-derived from the repository and the authoritative remote in this
execution. No value was taken from any prompt, prior output, or memory.

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` — sole remote |
| Antecedent commit (PV-24) | `c2b7095e116cf1a2b5fc9523f8fcba22ab5ad55f` |
| Antecedent tree | `d513b3302b10be7a4f31d82ea211c1dd5c060530` |
| `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — unmoved |
| Worktree at entry | CLEAN |
| PV-24 act blob | `079943caa9cb87c37f7ae9f05990df24ad055801` |
| E6 vocabulary assignment act blob | `df89ae6879f7a094728619d6b3522170bf9b49bc` |
| E6 provenance specification blob | `f81ebdef499100f23dff9fd4d8f34e13fb9b97d0` |
| `src/contracts/provenance.ts` blob | `459c77a430f00e5b20fa1f80cc1a3b780165444a` — byte-identical to authoritative `main` |
| `src/contracts` tree | `3a2b5c23ac3cd5783e21c4d531f6baffe14a2aeb` — byte-identical to authoritative `main` |
| `src/transports` tree | `b2369fa57b16c99878639cf645b15da2ef358a86` — byte-identical to authoritative `main` |
| Lineage algorithm/serialization census | **NOT A REPOSITORY RECORD** — read-only gate created no file; its measurements were re-derived live in section 3 |

PV-24 was re-read from its committed blob and still carries, for all four domains:
`payload = DESIGNATED`, `asOf = DESIGNATED`, `sourceClassification = NOT DESIGNATED`,
`dataVersion = NOT DESIGNATED`, `parentHash = NOT DESIGNATED` (8 DESIGNATED / 12 NOT DESIGNATED).

## 2. AUTHORITY BASIS

| Item | State |
| --- | --- |
| Governing authority | **RAMKI** |
| Authority act | E6 Lineage Algorithm / Serialization Designation |
| Authority to record this artifact | **GRANTED BY RAMKI IN THIS ACT** |
| Designation values | **SUPPLIED VERBATIM BY RAMKI** |
| Arena role | Recording agent only |
| Arena recommendation contributing to these designations | **NONE** |

## 3. VERIFICATION PERFORMED IN THIS EXECUTION (evidence)

Recorded as **OBSERVATION / VERIFICATION ONLY**.

| Verification | Method | Result |
| --- | --- | --- |
| Digest function identity | `computeSha256` (`src/contracts/provenance.ts:31`) compared against Node `crypto.createHash('sha256')` over 6 independent vectors including empty, ASCII, 512-byte, Unicode and JSON inputs | **6 / 6 exact match** |
| Negative control | `computeSha256('abc') === ref('abd')` | **false** (matcher discriminates) |
| Digest width | measured | **64 hex characters / 256 bits** |
| Digest charset | measured | hexadecimal, **lowercase** |
| External dependency | `require(` = 0, `node:crypto` = 0 in `provenance.ts` | **zero-dependency** |
| Lineage composition site | `computeLineageHash` (`src/contracts/provenance.ts:117`) | present, unchanged |
| Workspace lineage call sites | P-B / P-C / P-D / P-E | **0 / 0 / 0 / 0** |

## 4. DESIGNATION SCOPE

```text
SCOPE = GLOBAL
```

## 5. DESIGNATION MATRIX

The 12 dispositions below were supplied verbatim by RAMKI and are transcribed without alteration.

| Decision | Disposition |
| --- | --- |
| `hash_algorithm` | **SHA-256 / FIPS 180-4** |
| `digest_encoding` | **64-character lowercase hexadecimal** |
| `payload_serialization` | **NOT DESIGNATED** |
| `metadata_serialization` | **NOT DESIGNATED** |
| `field_ordering` | **NOT DESIGNATED** |
| `delimiter_strategy` | **NOT DESIGNATED** |
| `length_prefix_strategy` | **NOT DESIGNATED** |
| `key_canonicalization` | **NOT DESIGNATED** |
| `null_undefined_treatment` | **NOT DESIGNATED** |
| `unicode_normalization` | **NOT DESIGNATED** |
| `number_normalization` | **NOT DESIGNATED** |
| `parent_hash_chaining_policy` | **NOT DESIGNATED** |

### 5.1 DESIGNATED — cryptographic contract

| Decision | Designated value |
| --- | --- |
| `hash_algorithm` | SHA-256 / FIPS 180-4 |
| `digest_encoding` | 64-character lowercase hexadecimal |

### 5.2 NOT DESIGNATED — remaining decisions

| Decision | Disposition |
| --- | --- |
| `payload_serialization` | NOT DESIGNATED |
| `metadata_serialization` | NOT DESIGNATED |
| `field_ordering` | NOT DESIGNATED |
| `delimiter_strategy` | NOT DESIGNATED |
| `length_prefix_strategy` | NOT DESIGNATED |
| `key_canonicalization` | NOT DESIGNATED |
| `null_undefined_treatment` | NOT DESIGNATED |
| `unicode_normalization` | NOT DESIGNATED |
| `number_normalization` | NOT DESIGNATED |
| `parent_hash_chaining_policy` | NOT DESIGNATED |

```text
CRYPTOGRAPHIC_DESIGNATIONS = 2
SERIALIZATION_DESIGNATIONS = 0
CHAINING_DESIGNATIONS      = 0
```

## 6. ENGINEERING BASIS (transcribed verbatim)

```text
The existing SHA-256 implementation was independently verified against
Node's crypto implementation and produces a fixed-width lowercase
256-bit hexadecimal digest. That algorithm and digest representation
are therefore explicitly designated as the lineage cryptographic
contract.

The existing serialization implementation is observed but is not
designated as the workspace serialization protocol because the forensic
census established insertion-order sensitivity and delimiter ambiguity.
No workspace serialization semantics are inferred from the existing
implementation.

The absence of a parentHash at all 31 observed call sites does not
constitute a chaining-policy designation. Chaining remains
NOT DESIGNATED.
```

## 7. NO SERIALIZATION LEAK — OBSERVATION IS NOT DESIGNATION

The following remain **reference evidence only** and are expressly **not** designated as
workspace semantics by this act:

| Observed mechanism | Status |
| --- | --- |
| `JSON.stringify` payload serialization | **OBSERVED — NOT DESIGNATED** |
| `parts.join('')` concatenation | **OBSERVED — NOT DESIGNATED** |
| Fixed positional field ordering | **OBSERVED — NOT DESIGNATED** |
| Property insertion-order sensitivity | **OBSERVED — NOT DESIGNATED** |
| Empty delimiter / absent field boundary | **OBSERVED — NOT DESIGNATED** |
| `undefined` key omission | **OBSERVED — NOT DESIGNATED** |
| `parentHash` truthiness gate | **OBSERVED — NOT DESIGNATED** |

## 8. STRICT NON-INFERENCE

| Statement | State |
| --- | --- |
| Designations originate from RAMKI authority | **YES** — supplied verbatim |
| Any designation inferred by Arena | **NO** — 0 |
| Any designation derived from existing implementation behaviour | **NO** — 0 |
| Any serialization protocol selected | **NO** — 0 |
| Any chaining policy selected | **NO** — 0 |
| Any vocabulary member assigned | **NO** — 0 |
| Recommendation recorded as a designation | **NO** — 0 |

Designating the hash algorithm and digest encoding does **not** authorize computing a lineage
digest for any workspace domain: with serialization, ordering, delimiter and canonicalization
all NOT DESIGNATED, no workspace lineage input string is defined.

## 9. WHAT THIS ACT DOES NOT DO

| Statement |
| --- |
| `ALGORITHM DESIGNATION` **!=** `LINEAGE IMPLEMENTATION` |
| No workspace lineage implementation created |
| No validator, schema, DTO or contract modification |
| No persistence, transport, API, UI or provider implementation |
| No vocabulary values assigned |
| No dataVersion semantics assigned |
| No ownership semantics assigned |
| No E5 or E10 authority created |
| No source, test, fixture or configuration file modified |

## 10. PRESERVED INDEPENDENT BLOCKERS (unchanged by this act)

| Element | State |
| --- | --- |
| E1 / E2 / E4 / E6 specification | **UNCHANGED** — referenced, not modified |
| E6 — provenance vocabulary assignment | **UNCHANGED** — all 13 values remain UNASSIGNED |
| PV-24 — lineage computation inputs | **UNCHANGED** — 8 DESIGNATED / 12 NOT DESIGNATED |
| E3 — ownership / identity | **BLOCKED** — D115 C/D UNRESOLVED, `runtimeCompanyId` UNRESOLVED, GP-4 BLOCKED |
| E5 — envelope / schema / domain infrastructure | **BLOCKED** |
| E7 — persistence implementation | **NOT GRANTED** |
| E8 — numeric retention | **NOT DESIGNATED** |
| E9 — transport / serialization | **GP-3 NOT AUTHORIZED**, transport authority NOT GRANTED |
| E10 — frozen contract infrastructure | Authority to modify **NOT CREATED** |
| `D115` | **WITHHELD / UNRESOLVED / NOT AUTHORIZED** — unchanged |
| D115 production activation | **NOT AUTHORIZED** — unchanged |
| `productionEligible` | **UNCHANGED** |
| `GP-3` | **NOT AUTHORIZED** — unchanged |
| `GP-4` | **UNRESOLVED / BLOCKED** — unchanged |
| `runtimeCompanyId` | **UNRESOLVED** — unchanged |
| `GATE-Y` | **NOT SELECTED / UNINVESTIGATED** — unchanged |
| `P-A` / `P-F` | **OUTSIDE GP-6** — unchanged |
| `GP-2` / `GP-5` / `GP-6` | **ESTABLISHED** — unchanged |

## 11. EXPLICIT NON-AUTHORIZATIONS

| Item | State after this act |
| --- | --- |
| `SERIALIZATION_DESIGNATION` | **NOT PERFORMED** |
| `CHAINING_DESIGNATION` | **NOT PERFORMED** |
| `WORKSPACE_LINEAGE_IMPLEMENTATION` | **0** |
| `IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `SRC_CONTRACTS_MODIFICATION_AUTHORITY` | **NOT CREATED BY THIS RECORD** |
| `E1_CONTRACT_COMPLETION` | **NOT PERFORMED** |
| `E4_VALIDATOR_IMPLEMENTATION` | **NOT PERFORMED** |
| `E5_AUTHORITY` | **NOT CREATED** |
| `E10_AUTHORITY` | **NOT CREATED** |
| `NUMERIC_RETENTION_PERIOD` | **NOT DESIGNATED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |
| `SERIALIZATION_PROTOCOL_SELECTION` | **NOT MADE** |
| `DATABASE_SELECTION` | **NOT MADE** |
| `ORM_SELECTION` | **NOT MADE** |
| `HOSTING_PROVIDER` | **NOT SELECTED** |
| `PROVIDER_SELECTION` | **NOT MADE** |
| `DEPLOYMENT` | **NOT AUTHORIZED** |
| `PRODUCTION_AUTHORITY` | **NOT GRANTED** |

## 12. SUPERSESSION

This act supersedes no prior record. All antecedent records remain in force, unmodified, at the
blobs recorded in section 1.

## 13. PRESERVATION

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

```text
E6_LINEAGE_ALGORITHM_AUTHORITY = ESTABLISHED

SCOPE = GLOBAL

hash_algorithm  = SHA-256 / FIPS 180-4
digest_encoding = 64-character lowercase hexadecimal

CRYPTOGRAPHIC_DESIGNATIONS = 2
SERIALIZATION_DESIGNATIONS = 0
CHAINING_DESIGNATIONS      = 0
IMPLEMENTATION             = 0
```

```text
ALGORITHM DESIGNATION   !=   LINEAGE IMPLEMENTATION
NO WORKSPACE LINEAGE DIGEST IS DEFINED OR AUTHORIZED.
```
