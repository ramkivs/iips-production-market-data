# P01 — EVIDENCE AND TRACEABILITY

Conforms to `docs/p00/P00_EVIDENCE_CONVENTIONS.md`: repository + path, line/section, **pinned
commit**, artifact identity. No evidence is invented; gaps are recorded as gaps.

---

## 1. Pinned commits

| Repository | Commit | Role |
|---|---|---|
| `iips-production-market-data` | `d29ad2fa4dac37180a1437eb2d29832372a6f205` | CHECKPOINT-01 — recovery baseline for D4–D8 + P00 |
| `iips-production-market-data` | `94ee5333c67f517577f2ce306133ff3893639575` | P00 gate acceptance |
| `iips-review-recovered` | `5decdca` | Existing-IIPS baseline — **read-only, not modified** |
| TRACKER checksum | `f0bd7b970c445f0a06e793256456231f` | `...TRACKER_INTEGRATION_ALIGNED.xlsx` — read-only |
| SPEC checksum | `7b7ea4f1acc35f3209123efd3fbd9b11` | `...SPEC_INTEGRATION_ALIGNED.docx` — read-only |

## 2. Traceability matrix — P01 artifact → source evidence

| P01 artifact / section | Source evidence | Pinned at |
|---|---|---|
| Contract §2 INV-1 (sole ingress) | `docs/d4/D4_04_INGRESS_CONTRACT_DELTA.md` §F.1 (AD-2) | `d29ad2f` |
| Contract §3.1 envelope fields | `docs/d4/D4_04_INGRESS_CONTRACT_DELTA.md` §F.2–F.3 (`receivedAt`, `mode`, `lineage`, `schemaVersion` additive) | `d29ad2f` |
| Contract §3.1 `snapshotId` format | `docs/d4/D4_06_SNAPSHOT_REPLAY_IDENTITY.md` §H.2 (AD-6) | `d29ad2f` |
| Contract §4 namespace / OI-10 | `docs/d4/D4_07_FIELD_NAMESPACE.md` §I.2, §I.3; `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md` | `d29ad2f` |
| Contract §5 identity boundary | `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md` §G.1–G.2 (AD-1) | `d29ad2f` |
| Contract §6 replay representation | `docs/d5/ADR-02_REPLAY_IDENTITY_EXTENSION.md`; `docs/d4/D4_06` §H.3–H.4 | `d29ad2f` |
| Contract §6 AD-17 non-resolution | `docs/d4/D4_06_SNAPSHOT_REPLAY_IDENTITY.md` §H.6 | `d29ad2f` |
| Contract §8 data-version rules | `docs/d4/D4_04` §F.2 (`dataVersion` — "a source change MUST produce a new dataVersion") | `d29ad2f` |
| Contract §10 PIT rules | `docs/d4/D4_04` §F.4; `docs/d4/D4_06` §H.4; `docs/d4/D4_02` §D.3 | `d29ad2f` |
| Contract §11 quality rules | `docs/d4/D4_04` §F.2, §F.7 (NFR-04 / NFR-09) | `d29ad2f` |
| Schema catalog D01–D10 | `docs/d4/D4_02_DATA_DOMAINS.md` §D.1–D.12 | `d29ad2f` |
| Schema catalog — cross-domain rules | `docs/d4/D4_02_DATA_DOMAINS.md` §D.12 (7 rules) | `d29ad2f` |
| Field dictionary — collision-critical valuation keys | `docs/d4/D4_07_FIELD_NAMESPACE.md` §I.1 (52 coded / 54 free-form; `peRatio`, `evEbitda`, `evRevenue`, `fcfYield`) | `d29ad2f` |
| Field dictionary — frozen engine keys | `docs/d4/D4_02` §D.4; `docs/d4/D4_07` §I.1 | `d29ad2f` |
| Identity & lineage §1 | `docs/d4/D4_05` §G.1–G.2 | `d29ad2f` |
| Identity & lineage §3 linkage | `docs/d4/D4_06` §H.3 | `d29ad2f` |
| Identity & lineage §4 lineage block | `docs/d4/D4_04` §F.2 (lineage requirements, NFR-01/NFR-07) | `d29ad2f` |
| Time/currency/unit §3 modes | `docs/d4/D4_02` §D.12 rule 5 (SPEC ¶17); tracker `Work Tracker!P01-04` | `d29ad2f` / `f0bd7b97…` |
| Time/currency/unit §7 adjustment | `docs/d4/D4_02` §D.5 (adjustment factors evidence-bearing) | `d29ad2f` |
| Time/currency/unit §8 calendars | `docs/d4/D4_02` §D.11 (historically accurate calendars for PIT) | `d29ad2f` |
| Versioning §7 certified components | `docs/d4/D4_04` §F.8; `docs/d4/D4_07` §I.2.7 | `d29ad2f` |
| Versioning §8 VV-2 (M-1) | `docs/d4/D4_06` §H.5; `docs/d8/D8_STATUS.json` | `d29ad2f` |
| Validation §3 C1–C6 | `docs/d4/D4_07_FIELD_NAMESPACE.md` §I.2.4; `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md` | `d29ad2f` |
| Validation §7 rejection semantics | `docs/d4/D4_07` §I.2.5 (prohibited behaviours) | `d29ad2f` |
| Dependency register — open items | `docs/p00/P00_OPEN_ITEMS_REGISTER.md`; `docs/d8/D8_STATUS.json` | `d29ad2f` |
| Scope §1.2 / no code | `docs/d4/D4_12_PHASE_SEQUENCE.md:25` ("⚠ Standing prohibition: **implementation prohibited**") | `d29ad2f` |
| Artifact-set justification | TRACKER `Work Tracker` rows `P01-01`…`P01-05`; `Phase Roadmap!P01` | `f0bd7b97…` |
| Authority state | `docs/p00/P00_AUTHORITY_REGISTER.md`; `docs/p00/P00_GATE_ACCEPTANCE.md` | `94ee533` |

## 3. Artifact-set reconciliation

The prompt's requested artifact set was checked against the authoritative P01 definition.

| Tracker P01 row | Deliverable named in tracker | Covered by |
|---|---|---|
| `P01-01` Canonical identifiers | "Canonical ID specification" | `P01_IDENTITY_AND_LINEAGE.md` §1, `P01_FIELD_DICTIONARY.md` §7 |
| `P01-02` Timestamp/as-of semantics | "Time semantics specification" | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1–3 |
| `P01-03` Units/currency/adjustment | "Measurement contract" | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §4–7 |
| `P01-04` LIVE/SNAPSHOT/PIT modes | "Operating mode contract" | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §3, `P01_DATA_CONTRACT.md` §9–10 |
| `P01-05` Provenance schema | "Provenance contract" | `P01_IDENTITY_AND_LINEAGE.md` §4–5 |

**Deviation recorded:** the tracker also names *"ID contract + fixtures"*, *"Measurement
fixtures"* and *"Contract tests"* as gate artifacts. These are **executable/implementation
artifacts**; `D4_12_PHASE_SEQUENCE.md:25` places P01 under the standing prohibition
"implementation prohibited". They are therefore **specified as obligations** in
`P01_VALIDATION_RULES.md` §9 and registered as **DEP-P01-07**, and **not produced**. No other
deviation from the D4/tracker-defined set exists; the nine documents requested by the work
order are a superset of the five tracker deliverables.

## 4. Open-item impact matrix

| Item | State after P01 | Contract impact | Resolved by P01? |
|---|---|---|---|
| OI-08 | **OPEN** | Identity cardinality left unconstrained | **NO** |
| OI-09 | **OPEN** | `externalIdentifiers[]` slot only; no standard adopted | **NO** |
| OI-10 | **`APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING`** | All keys use the `<NS>` placeholder; token not chosen | **NO** |
| AD-17 | **UNRESOLVED** | ADR-02 fields represented; recomputation untouched | **NO** |
| M-1 | **`OPEN_REVALIDATION_REQUIRED`** | Blocks validation, not specification; E2E-030 NOT REVOKED / NOT RENEWED | **NO** |
| M-5 | **OPEN** | Entitlement/tenant slots deferred to P03 | **NO** |
| M-6 | **OPEN** | `retentionDays` recorded; **not** enforced | **NO** |
| OI-05 | **OPEN** | D09 conditional | **NO** |
| OI-06 | **OPEN** | D03 product disposition | **NO** |
| CD-01 | **OPEN** | Commit-pinning applied throughout P01 | **NO** |

## 5. Boundary verification

| Check | Result |
|---|---|
| `iips-review-recovered` modified | **NO** — read-only clone at `/tmp/iipsrev`, outside the workspace, clean at `5decdca` |
| Any existing-IIPS source or test modified | **NO** — none exists in this workspace |
| Any of the 13 engines modified | **NO** |
| Scoring / calibration / taxonomy modified | **NO** |
| Auto Option-A, Materials G1–G6, Telecom D16 | **NO** |
| `LiveDataRuntime.ts`, `DataBoundExecutor`, `ReplayService` | **NO** |
| Existing certification artifacts, E2E-030, `PROGRAM_v1.1_REPLAY_BASELINE.json` | **NO** |
| `docs/d4/`, `docs/d5/`, `docs/d7/`, `docs/d8/` | **NO — unchanged** |
| Tracker XLSX / SPEC DOCX | **NO — byte-unchanged** |
| P00 artifacts | **NO — unchanged** (including `P00_GATE_ACCEPTANCE.md`) |
| Provider / source implementation started | **NO — none** |
| Executable source produced (`.ts` / `.tsx` / `.js`) | **NO — none** |
| P02/P03/P04/P05 implementation started | **NO** |
| Certification granted | **NO — `NONE_GRANTED`** |
| Production activation | **NO — `NOT_AUTHORIZED`** |

## 6. Artifact inventory and checksums

| # | Artifact | MD5 | Lines |
|---|---|---|---|
| 1 | `docs/p01/P01_DATA_CONTRACT.md` | `94f30f639566f3ec6fb4dc5b4f4ba04c` | 281 |
| 2 | `docs/p01/P01_DEPENDENCY_REGISTER.md` | `5c55f16603cd358f07c9d4fe85ec8d3c` | 65 |
| 3 | `docs/p01/P01_FIELD_DICTIONARY.md` | `913b387b7ad209f71995ae8e5c0a5d36` | 216 |
| 4 | `docs/p01/P01_IDENTITY_AND_LINEAGE.md` | `312c580e7f1a648d039c3f57a1b3c75c` | 158 |
| 5 | `docs/p01/P01_SCHEMA_CATALOG.md` | `c504b252e7886d7da62a82bab45d992a` | 170 |
| 6 | `docs/p01/P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` | `e21312123c2f1800ccd09856181c034b` | 110 |
| 7 | `docs/p01/P01_VALIDATION_RULES.md` | `a2cfb5fed18c5ac699e27f8a47cff684` | 148 |
| 8 | `docs/p01/P01_VERSIONING_COMPATIBILITY.md` | `4c7ebd67a32802560be0a08f834b8f21` | 100 |
| 9 | `docs/p01/P01_EVIDENCE.md` | *(this file — checksum omitted, self-referential)* | — |

## 7. Gate position

P01 is **NOT accepted** by this package. Governing rule: **"Explicit gate acceptance; no
automatic promotion."**
