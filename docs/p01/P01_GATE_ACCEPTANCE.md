# P01 — GATE ACCEPTANCE RECORD

> **Explicit acceptance act** required by the governing rule
> **"Explicit gate acceptance; no automatic promotion."**
> Acceptance is not inferred from the completion of the P01 work package; it is performed here.

---

## 1. Acceptance record

| Field | Value |
|---|---|
| **Gate** | **P01** |
| **Gate name** | **Canonical contract gate** |
| **Phase** | P01 — Data Contract (tracker: *Data Contract & Canonical Domain Model*) |
| **Result** | # **ACCEPTED** |
| **Work package accepted** | P01 canonical market-data contract package (9 artifacts, `docs/p01/`) |
| **P01 package commit** | `547de1bf411aeab19b186be43f7a4dcee0857ff5` |
| **Prior gate** | P00 — Scope/authority baseline — ACCEPTED (`94ee5333c67f517577f2ce306133ff3893639575`) |
| **Recovery baseline** | `d29ad2fa4dac37180a1437eb2d29832372a6f205` (CHECKPOINT-01) |
| **Acceptance authority** | A3 phase-gate acceptance authority — program-authority clearance established (`docs/d8/D8_AUTHORITY_RECONCILIATION.md` §0, §D) |
| **Acceptance type** | Explicit acceptance act (not automatic promotion) |
| **Prior state** | P01 SPECIFICATION COMPLETE — NOT ACCEPTED (1 of 18 gates accepted) |
| **Resulting state** | **P01 ACCEPTED — 2 of 18** · P02 becomes the next executable phase |

---

## 2. Acceptance basis

P01's gate intent — *"Define canonical schemas, identifiers, timestamps, units, currency"* — is
satisfied by the nine contract artifacts committed at `547de1b`. The declared minimum evidence
— *canonical contract spec; schema versioning; determinism rules* — is present:
`P01_DATA_CONTRACT.md` (canonical spec), `P01_VERSIONING_COMPATIBILITY.md` (four independent
version axes and change classification), and the determinism rules distributed across
`P01_DATA_CONTRACT.md` §8–9, `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §2/§6 and
`P01_IDENTITY_AND_LINEAGE.md` §3 (deterministic serialization, ordered contributing set,
stable numeric formatting).

The contract is provider-independent, internally consistent, and traceable to the governing
D4/D5/D7/D8/P00 decisions. Every boundary it touches but does not own — OI-08, OI-09, OI-10,
AD-17, M-1, M-5, M-6, OI-05, OI-06, CD-01 — is preserved unresolved and attributed to its
owning phase or authority.

---

## 3. Criteria verification (24 of 24 PASS)

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Canonical provider-independent contract complete | **PASS** | `P01_DATA_CONTRACT.md` §3 (16 envelope + 13 field slots); §1 states provider-independence; no vendor binding anywhere in the package |
| 2 | `CanonicalSnapshot` / `CanonicalField` internally consistent | **PASS** | §3 three-level model carried as the `T` of `DataSnapshot<T>` — not a parallel type; field slots reconciled across contract, dictionary and validation rules |
| 3 | Required / conditional / optional rules explicit | **PASS** | `P01_DATA_CONTRACT.md` §3.1–3.2 and `P01_FIELD_DICTIONARY.md` §1–2 give an explicit R/O/C marker with stated condition for every slot |
| 4 | Timestamp, currency, unit, precision semantics explicit | **PASS** | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1–2 (five distinct times, obligations per data class), §4 (CU-1…CU-7), §5 (UN-1…UN-7), §6 (NP-1…NP-6) |
| 5 | Null/missing semantics distinguish `NOT_PROVIDED`, `NULL_ASSERTED`, `WITHHELD` | **PASS** | `P01_VALIDATION_RULES.md` §4 — five-value `availability` enum; NL-4 forbids conflating assertion with silence; NL-5 requires `entitlementRef` for `WITHHELD` |
| 6 | Quality / freshness semantics explicit | **PASS** | `P01_DATA_CONTRACT.md` §11 (Q-1…Q-6); `P01_VALIDATION_RULES.md` §8; freshness inputs required here, thresholds deferred to P07 |
| 7 | Validation and rejection behaviour explicit | **PASS** | `P01_VALIDATION_RULES.md` §1 five stages, §2 ST-1…ST-12, §5 SM-1…SM-14, §6 RF-1…RF-9, §7 RJ-1…RJ-8 |
| 8 | Namespace mandatory and fail-closed | **PASS** | `P01_VALIDATION_RULES.md` §3 reproduces C1–C6; C5 aborts execution — no partial merge, precedence, coercion or warn-and-continue |
| 9 | **OI-10 remains OPEN; token not invented or resolved** | **PASS** | `<NS>` placeholder used throughout; `APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING` recorded in 4 places; `MD:<domain>.<field>` appears only as **NOT ADOPTED / ILLUSTRATIVE** |
| 10 | AD-1 identity boundary preserved; no security-master implementation | **PASS** | `P01_IDENTITY_AND_LINEAGE.md` §1 ID-1…ID-6; `mappedCompanyId` is an adapter **output** slot the data plane may not write (RF-3); master deferred to P04 |
| 11 | ADR-02 snapshot identity and contributing-data representation preserved | **PASS** | §2 SI-1…SI-4 (dual-layer, `data-*` never conflated with `SNAP_*`); §3 RI-1…RI-6 including additive-and-inert backward compatibility |
| 12 | AD-17 remains unresolved and untouched | **PASS** | `P01_IDENTITY_AND_LINEAGE.md` §3.1 items 2, 5, 6; `P01_DATA_CONTRACT.md` §6; no `ReplayService` artifact exists or was touched |
| 13 | PIT semantics explicit without implementing PIT storage | **PASS** | `P01_DATA_CONTRACT.md` §10 PIT-1…PIT-6 (PIT-6 defers storage to P08); DEP-P01-04 records the series-representation decision as a P08 storage matter |
| 14 | Versioning / compatibility semantics explicit | **PASS** | `P01_VERSIONING_COMPATIBILITY.md` §1 four axes, §3 change classification, §4 BC-1…BC-5, §5 FC-1…FC-4, §6 MG-1…MG-5 |
| 15 | All ten D4 domains covered; none invented | **PASS** | `P01_SCHEMA_CATALOG.md` — exactly one section per D01…D10; no D11+ token anywhere in the package |
| 16 | Deferred executables recorded as obligations, not implemented | **PASS** | `P01_VALIDATION_RULES.md` §9 + **DEP-P01-07**; deviation explained in `P01_EVIDENCE.md` §3 against `D4_12_PHASE_SEQUENCE.md:25` implementation prohibition |
| 17 | No provider / acquisition / normalization / DQ / master / PIT / replay / engine / API / UI / activation / certification work | **PASS** | No `.ts`/`.tsx`/`.js` file exists anywhere in the repository; no `docs/p02`; package is documentation only |
| 18 | No existing-IIPS source, methodology or certification artifact modified | **PASS** | `/tmp/iipsrev` clean at `5decdca`, outside the workspace; no engine, scoring, calibration or taxonomy artifact touched |
| 19 | Protected D4/D5/D7/D8/P00, tracker and SPEC unchanged | **PASS** | Tracker `f0bd7b97…`, SPEC `7b7ea4f1…`, `D4_07` `d1d506dc…`, `D4_12` `dddb4bfe…`, ADR-01 `0c8a3c46…`, ADR-02 `a7cc51cd…`, `D7_STATUS` `4279e049…`, `D8_STATUS` `e781a6d1…`, `P00_GATE_ACCEPTANCE` `0ea20312…`, `P00_GATE_MODEL` `77764e4f…` — all match |
| 20 | P01 evidence/checksums and repository integrity consistent | **PASS** | All eight checksums in `P01_EVIDENCE.md` §6 re-verified byte-for-byte; working tree clean at `547de1b` |
| 21 | No methodology decisions invented | **PASS** | 52 coded + 54 free-form engine keys declared frozen; `P01_DEPENDENCY_REGISTER.md` §4 item 2 reaffirms new metrics are Ramki/Sai authority, not this program |
| 22 | No certification granted | **PASS** | `NONE_GRANTED` carried in the package; no certification artifact produced |
| 23 | No production activation authorized | **PASS** | `NOT_AUTHORIZED` carried in the package |
| 24 | Traceability to D4–D8 / P00 intact | **PASS** | `P01_EVIDENCE.md` §2 — 26-row traceability matrix, every row pinned to a commit or checksum per `P00_EVIDENCE_CONVENTIONS.md` |

**Blockers: NONE.**

---

## 4. Evidence references

| Artifact | Role |
|---|---|
| `docs/p01/P01_DATA_CONTRACT.md` | Canonical contract; invariants; data-version, snapshot, PIT, quality rules |
| `docs/p01/P01_SCHEMA_CATALOG.md` | D01–D10 domain schemas |
| `docs/p01/P01_FIELD_DICTIONARY.md` | Field slots and attributes |
| `docs/p01/P01_IDENTITY_AND_LINEAGE.md` | AD-1 boundary, AD-6 dual identity, ADR-02 linkage, lineage block |
| `docs/p01/P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` | Time, mode, currency, unit, precision, adjustment, calendar |
| `docs/p01/P01_VERSIONING_COMPATIBILITY.md` | Four version axes; compatibility |
| `docs/p01/P01_VALIDATION_RULES.md` | Five validation stages; rejection behaviour |
| `docs/p01/P01_DEPENDENCY_REGISTER.md` | 11 inherited open items + 12 new dependencies |
| `docs/p01/P01_EVIDENCE.md` | Traceability, open-item impact, boundary verification, checksums |
| Commit `547de1bf411aeab19b186be43f7a4dcee0857ff5` | The accepted package |

---

## 5. Accepted state

| Field | Value |
|---|---|
| **P00** | **ACCEPTED** |
| **P01** | **ACCEPTED** |
| **P02 — Provider Abstraction** | **NEXT EXECUTABLE PHASE** — not started, not accepted |
| `program_status` | `AUTHORIZED_TO_PROCEED` |
| `certification_status` | **`NONE_GRANTED`** |
| `production_activation_status` | **`NOT_AUTHORIZED`** |
| `formal_gate_status` | **2 of 18 accepted (P00, P01)** — P02–P17 NOT ACCEPTED |
| **AD-17** | **UNRESOLVED** |
| **M-1** | **`OPEN_REVALIDATION_REQUIRED`** |
| **E2E-030** | **NOT REVOKED · NOT RENEWED** |
| **OI-08 / OI-09** | **OPEN** — blocking P04 |
| **OI-10** | **`APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING`** — blocking P05 / P06 / P11 |
| **M-5 / M-6 / OI-05 / OI-06 / CD-01** | **OPEN** |

---

## 6. What this acceptance does NOT mean

| # | P01 acceptance does **not** mean |
|---|---|
| 1 | The contract is implemented — it is a specification |
| 2 | The contract is certified |
| 3 | Any provider, adapter or acquisition exists |
| 4 | The security master exists (P04) |
| 5 | PIT storage or replay exists (P08) |
| 6 | Engines, APIs or UI consume market data |
| 7 | Production data is active or activation is authorized |
| 8 | The exact namespace token has been recorded (OI-10) |
| 9 | OI-08, OI-09, AD-17, M-1, M-5 or M-6 are resolved |
| 10 | Any other gate is accepted — **P02–P17 remain NOT ACCEPTED** |

Deferred contract tests and golden fixtures (**DEP-P01-07**) remain outstanding obligations
against later phases; accepting P01 does not discharge them.

---

## 7. Next

| Field | Value |
|---|---|
| **Next executable phase** | **P02 — Provider Abstraction** (gate: *Provider abstraction/entitlement gate*) |
| **Next action** | Prepare and execute the P02 work package |
| **Not performed here** | P02 execution |
