# GP-6 — E6 LINEAGE SERIALIZATION CONTRACT DESIGNATION ACT
# EXPLICIT RAMKI DESIGNATION / NO INFERENCE / NO IMPLEMENTATION / NO SOURCE MUTATION

Governing Standards   : AD-01..AD-18 / AD-CHARTER-2026-01
Act ID                : gp-6-e6-lineage-serialization-contract-2026-09-27-001
Governing Authority   : RAMKI
Recording Agent       : Arena (Arena.ai Agent Mode)
Act Type              : LINEAGE SERIALIZATION CONTRACT DESIGNATION ACT (governance only)
Recorded At           : 2026-09-27 (Asia/Calcutta)
Antecedent Checkpoint : a4142e9527d002fa715f73084948e08bf19a9cc6

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` — sole remote |
| Antecedent commit | `a4142e9527d002fa715f73084948e08bf19a9cc6` |
| Antecedent tree | `aa6bdca0aea65c7247f0e4b037e33e7dd70b2bb7` |
| `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — unmoved |
| Worktree at entry | CLEAN |
| E6 lineage algorithm act blob | `4045c50eb1ba2557368c05022da1a476fe3cdab9` — cryptographic designations intact |
| PV-24 lineage input act blob | `079943caa9cb87c37f7ae9f05990df24ad055801` |
| E6 vocabulary assignment act blob | `df89ae6879f7a094728619d6b3522170bf9b49bc` — 13/13 UNASSIGNED |
| `src/contracts/provenance.ts` blob | `459c77a430f00e5b20fa1f80cc1a3b780165444a` — byte-identical to authoritative `main` |
| `src/contracts` tree | `3a2b5c23ac3cd5783e21c4d531f6baffe14a2aeb` — byte-identical to authoritative `main` |
| `src/transports` tree | `b2369fa57b16c99878639cf645b15da2ef358a86` — byte-identical to authoritative `main` |

## 2. AUTHORITY BASIS

| Item | State |
| --- | --- |
| Governing authority | **RAMKI** |
| Authority act | E6 Remaining Serialization Authority Designation |
| Authority to record this artifact | **GRANTED BY RAMKI IN THIS ACT** |
| Designation values | **SUPPLIED VERBATIM BY RAMKI** — transcribed without alteration |
| Arena role | Recording agent only |
| Arena recommendation contributing to any value | **NONE** |
| Values derived from current implementation behaviour | **NONE** |

## 3. SCOPE

```text
SCOPE     = GLOBAL
AUTHORITY = RAMKI
```

## 4. ALREADY-ESTABLISHED CRYPTOGRAPHIC DESIGNATIONS (unchanged by this act)

| Decision | Designated value | Source |
| --- | --- | --- |
| `hash_algorithm` | SHA-256 / FIPS 180-4 | prior act `4045c50eb1ba2557368c05022da1a476fe3cdab9` — **NOT ALTERED** |
| `digest_encoding` | 64-character lowercase hexadecimal | prior act `4045c50eb1ba2557368c05022da1a476fe3cdab9` — **NOT ALTERED** |

## 5. DESIGNATION MATRIX — THE TEN SERIALIZATION DIMENSIONS

Supplied verbatim by RAMKI. `SCOPE = GLOBAL`, `AUTHORITY = RAMKI` for every row.

| # | Dimension | Authorized value |
| --- | --- | --- |
| 1 | `payload_serialization` | RFC 8785 JSON Canonicalization Scheme (JCS) applied to the JSON-compatible payload; unsupported/non-I-JSON values are rejected rather than implicitly coerced |
| 2 | `metadata_serialization` | Each metadata value is encoded as UTF-8 bytes and independently length-prefixed; metadata fields are serialized in the designated fixed field order |
| 3 | `field_ordering` | payload → sourceClassification → asOf → dataVersion → parentHash (parentHash included only when parent-hash chaining is designated and a parent hash is present) |
| 4 | `delimiter_strategy` | NONE — field boundaries are provided exclusively by the length-prefix framing; no delimiter byte/string is inserted |
| 5 | `length_prefix_strategy` | Unsigned 64-bit big-endian byte length immediately preceding every serialized component; payload bytes and each metadata value are independently framed |
| 6 | `key_canonicalization` | RFC 8785 JCS canonical object-property ordering; object keys are serialized according to JCS and are not dependent on JavaScript insertion order |
| 7 | `null_undefined_treatment` | JSON null is preserved as a canonical JSON value; undefined is not permitted in the canonical payload and causes serialization failure rather than omission or coercion |
| 8 | `unicode_normalization` | NONE — Unicode code points are not normalized before serialization; UTF-8 encoding represents the supplied Unicode scalar sequence exactly |
| 9 | `number_normalization` | RFC 8785 JCS number serialization; finite JSON numbers use JCS/ECMAScript-compatible canonical representation; NaN, Infinity, and non-I-JSON numeric values are rejected |
| 10 | `parent_hash_chaining_policy` | DISABLED — parentHash is excluded from the lineage hash input and no parent-hash chaining is performed |

```text
DIMENSIONS_DESIGNATED = 10
DIMENSIONS_REMAINING_NOT_DESIGNATED = 0
PLACEHOLDERS = 0
ARENA_SUPPLIED_VALUES = 0
```

## 6. RELATIONSHIP BETWEEN DIMENSION 3 AND DIMENSION 10 (recorded, not reconciled)

Dimension 3 includes `parentHash` in the field order **only when** parent-hash chaining is
designated and a parent hash is present. Dimension 10 designates chaining **DISABLED** and
excludes `parentHash` from the lineage hash input.

The condition in dimension 3 is therefore unsatisfied under dimension 10: `parentHash` is
never included in the lineage hash input under this designation. Both values are transcribed
exactly as supplied. **Arena performed no reconciliation and altered neither value.**

## 7. CONFORMANCE OF THE CURRENT IMPLEMENTATION (measured — OBSERVATION ONLY)

Measured in this execution by executing the authoritative implementation against the
designated contract. This section records a **gap**, not an instruction, and authorizes nothing.

| # | Dimension | Current implementation | Conformance |
| --- | --- | --- | --- |
| 1 | `payload_serialization` | `JSON.stringify` — not canonical; order-sensitive | **NOT CONFORMANT** |
| 2 | `metadata_serialization` | raw concatenation, no per-field framing | **NOT CONFORMANT** |
| 3 | `field_ordering` | positional order matches; `parentHash` appended when truthy | **PARTIAL** |
| 4 | `delimiter_strategy` | no delimiter **and** no framing — boundary shift collides | **NOT CONFORMANT** |
| 5 | `length_prefix_strategy` | absent | **NOT CONFORMANT** |
| 6 | `key_canonicalization` | JavaScript insertion order | **NOT CONFORMANT** |
| 7 | `null_undefined_treatment` | `null` retained; `undefined` silently dropped, not rejected | **PARTIAL** |
| 8 | `unicode_normalization` | no normalization; UTF-8 exact scalars | **CONFORMANT** |
| 9 | `number_normalization` | `NaN` / `Infinity` coerced to `null`, not rejected | **NOT CONFORMANT** |
| 10 | `parent_hash_chaining_policy` | truthiness-gated inclusion path present in code | **NOT CONFORMANT** |

```text
CONFORMANT = 1   PARTIAL = 2   NOT CONFORMANT = 7
```

**The existing implementation does not implement this designated contract.** No remediation,
migration, refactor or implementation is authorized by this act. Closing this gap requires a
separate RAMKI implementation authority that does not exist.

## 8. STRICT NON-INFERENCE

| Statement | State |
| --- | --- |
| All ten values originate from RAMKI authority | **YES** — supplied verbatim |
| Any value inferred by Arena | **NO** — 0 |
| Any value derived from current implementation behaviour | **NO** — 0 |
| Any value derived from best practice or security preference | **NO** — 0 |
| Any value defaulted, ranked or recommended | **NO** — 0 |
| Any observed behaviour promoted to a designation | **NO** — 0 |
| Any vocabulary member assigned | **NO** — 0 |

## 9. WHAT THIS ACT DOES NOT DO

| Statement |
| --- |
| `SERIALIZATION DESIGNATION` **!=** `SERIALIZATION IMPLEMENTATION` |
| No workspace lineage implementation created |
| No JCS library, dependency or canonicalizer added |
| No validator, schema, DTO or contract modification |
| No modification of `src/`, `src/contracts` or `src/transports` |
| No persistence, transport, API, UI or provider implementation |
| No vocabulary values assigned |
| No dataVersion semantics assigned |
| No ownership semantics assigned |
| No E5 or E10 authority created |
| No alteration of `hash_algorithm` or `digest_encoding` |
| No source, test, fixture or configuration file modified |

## 10. PRESERVED INDEPENDENT BLOCKERS (unchanged by this act)

| Element | State |
| --- | --- |
| E1 / E2 / E4 / E6 specification | **UNCHANGED** |
| E6 — provenance vocabulary assignment | **UNCHANGED** — 13/13 UNASSIGNED |
| PV-24 — lineage computation inputs | **UNCHANGED** — 8 DESIGNATED / 12 NOT DESIGNATED |
| E3 — ownership / identity | **BLOCKED** |
| E5 — envelope / schema / domain infrastructure | **BLOCKED** |
| E7 — persistence implementation | **NOT GRANTED** |
| E8 — numeric retention | **NOT DESIGNATED** |
| E9 — transport / serialization authority | **GP-3 NOT AUTHORIZED** |
| E10 — frozen contract infrastructure | Authority to modify **NOT CREATED** |
| `D115` | **WITHHELD / UNRESOLVED / NOT AUTHORIZED** |
| D115 production activation | **NOT AUTHORIZED** |
| `GP-3` | **NOT AUTHORIZED** |
| `GP-4` | **UNRESOLVED / BLOCKED** |
| `runtimeCompanyId` | **UNRESOLVED** |
| `GATE-Y` | **NOT SELECTED / UNINVESTIGATED** |
| `P-A` / `P-F` | **OUTSIDE GP-6** |
| Workspace lineage call sites P-B/P-C/P-D/P-E | **0 / 0 / 0 / 0** |

## 11. EXPLICIT NON-AUTHORIZATIONS

| Item | State after this act |
| --- | --- |
| `SERIALIZATION_IMPLEMENTATION` | **NOT AUTHORIZED** |
| `WORKSPACE_LINEAGE_IMPLEMENTATION` | **0** |
| `IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `SRC_CONTRACTS_MODIFICATION_AUTHORITY` | **NOT CREATED BY THIS RECORD** |
| `E1_CONTRACT_COMPLETION` | **NOT PERFORMED** |
| `E4_VALIDATOR_IMPLEMENTATION` | **NOT PERFORMED** |
| `E5_AUTHORITY` | **NOT CREATED** |
| `E10_AUTHORITY` | **NOT CREATED** |
| `DEPENDENCY_ADDITION` | **NOT AUTHORIZED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |
| `DATABASE_SELECTION` | **NOT MADE** |
| `ORM_SELECTION` | **NOT MADE** |
| `HOSTING_PROVIDER` | **NOT SELECTED** |
| `DEPLOYMENT` | **NOT AUTHORIZED** |
| `PRODUCTION_AUTHORITY` | **NOT GRANTED** |

## 12. SUPERSESSION

This act supersedes **only** the `NOT DESIGNATED` state of the ten serialization dimensions
recorded in the prior act `GP-6-E6-LINEAGE-ALGORITHM-SERIALIZATION-AUTHORITY-ACT.md`
(blob `4045c50eb1ba2557368c05022da1a476fe3cdab9`).

The prior act is **not modified**. Its two cryptographic designations (`hash_algorithm`,
`digest_encoding`) remain in force and unaltered. All other antecedent records remain in force
at the blobs recorded in section 1.

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

DIMENSIONS_DESIGNATED = 10
IMPLEMENTATION        = 0
```

```text
SERIALIZATION DESIGNATION   !=   SERIALIZATION IMPLEMENTATION
THE CURRENT IMPLEMENTATION DOES NOT CONFORM TO THIS CONTRACT.
NO IMPLEMENTATION OR REMEDIATION IS AUTHORIZED.
```
