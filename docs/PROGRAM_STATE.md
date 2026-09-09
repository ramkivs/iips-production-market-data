# PROGRAM STATE — SESSION RECOVERY MANIFEST

> **▶ CURRENT AUTHORITY ACT: D9 — P05 ENTRY / EXPLICIT AUTHORIZATION**
> (`docs/d9/D9_P05_ENTRY_AUTHORIZATION.md`, recorded **2026-09-09** against baseline
> `efe33eae287d2181cfdd5a838b0d9e5112fcdad3`). **P05 — Market Data Acquisition & Ingestion is
> ENTERED / AUTHORIZED**, within the exact scope of D9 §3. Supersedes CHECKPOINT-03 **as to P05
> entry/authorization state only**; CHECKPOINT-03 remains authoritative and unedited for
> everything else. ⚠ **P05 ACCEPTANCE = NOT_ACCEPTED · CERTIFICATION = `NONE_GRANTED` ·
> PRODUCTION ACTIVATION = `NOT_AUTHORIZED`** — none of these is conferred by D9.
>
> **CURRENT CHECKPOINT: CHECKPOINT-03 — Post-P04 / OI-10 Resolved / Pre-P05 Boundary**
> (`docs/CHECKPOINT-03.md`, source acceptance commit
> `faf1317eccaf77dbdab2a520899802043c851cca`). Supersedes CHECKPOINT-02 as to current state;
> CHECKPOINT-02 remains an immutable historical record.
>
> **CHECKPOINT-02 — P03 Accepted Program-State Preservation** (`docs/CHECKPOINT-02.md`,
> source acceptance commit `7b8fa9d` — ⚠ **pin not independently establishable**, see
> `docs/INCIDENT-01_HISTORY_LOSS.md`). Supersedes **CHECKPOINT-01 — Pre-P01 Program Continuity
> Baseline** (`d29ad2f`), which remains an immutable historical record.
>
> This is a **recovery / index artifact only**. It introduces **no new decision, no new
> methodology, and no new authority**. Every statement below is a pointer to, or a restatement
> of, an existing committed artifact.

---

## 1. Program identity

| Field | Value |
|---|---|
| **Program** | IIPS Production Market Data Intelligence Program v1.0 |
| **Repository** | `iips-production-market-data` (new program) |
| **Existing-IIPS evidence repository** | `iips-review-recovered` — **read-only dependency**, authoritative per AD-15 |
| **Nature** | Production market-data plane feeding the existing certified IIPS intelligence platform |

---

## 2. Current state

# **D8 COMPLETE — EXECUTION AUTHORIZED**

| Field | Value |
|---|---|
| `program_status` | **`AUTHORIZED_TO_PROCEED`** |
| `implementation_status` | **`AUTHORIZED_TO_PROCEED`** — currently executable: **P00 only** |
| `certification_status` | **`NONE_GRANTED`** |
| `formal_gate_status` | **5 of 18 accepted — P00, P01, P02, P03, P04 ACCEPTED**; P05–P17 NOT ACCEPTED |
| `production_activation_status` | **`NOT_AUTHORIZED`** |

---

## 3. Latest completed work package

**WP-P00-01 — Governance Baseline Establishment** (Phase P00 — Governance)
Status: **COMPLETE — READY FOR P00 GATE**

## 4. Current gate

**P05 — Acquisition gate** — **NOT_STARTED · NOT_ACCEPTED · NOT_AUTHORIZED**
✅ **Entry preconditions MET** (P02 accepted · P04 accepted · OI-10 token `MD:` recorded — `docs/CHECKPOINT-03.md` §5.1).
⚠ **Preconditions MET is NOT authorization.** An explicit **P05 entry/authorization act** is still required.
⚠ Independent of OI-10 and still open: **OI-P04-04** FIGI sourcing/licensing/coverage · no provider selected · entitlement matrix EMPTY.
Accepted gates: **P00 — Scope/authority baseline** (`docs/p00/P00_GATE_ACCEPTANCE.md`) ·
**P01 — Canonical contract gate** (`docs/p01/P01_GATE_ACCEPTANCE.md`) ·
**P02 — Provider abstraction/entitlement gate** (`docs/p02/P02_GATE_ACCEPTANCE.md`) ·
**P03 — Security gate** (`docs/p03/P03_GATE_ACCEPTANCE.md`) ·
**P04 — Identity/master gate** (`docs/p04/P04_GATE_ACCEPTANCE.md`)

> ### ⚠ SUPERSEDED AS TO CURRENT STATE by **D9** — the three lines above are **left unedited as
> ### the record of their own moment** and were correct when written.
>
> **P05 — Acquisition gate** — **ENTRY/AUTHORIZATION = AUTHORIZED · ACCEPTANCE = NOT_ACCEPTED**
> The explicit **P05 entry/authorization act has now been performed** and is recorded at
> `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` (**2026-09-09**, authority **Sai/Ramki**, baseline
> `efe33ea`). **All 15 preconditions PASS** (`docs/d9/D9_EVIDENCE_NOTES.md`).
>
> **Authorized scope (exact, not expanded by implication):** **P05-01** local deterministic feed —
> full acquisition work (specification · adapter conformance · fixture · provenance/`asOf`/version ·
> deterministic replay/idempotency · negative/error contract) · **P05-02** and **P05-03**
> **specification and adapter-contract work only**.
> **NOT authorized:** P05-02 live provider execution (provider selection · entitlement ·
> credentials · connectivity · P16 authority) · P05-03 licensed/deeper historical (**OI-P04-04**) ·
> P05-04 build-out · per-record tenant/region governance (**OI-P04-03**, **IB-1…IB-5**).
> ⚠ Still open and **not** resolved by D9: **OI-P04-04** FIGI sourcing/licensing/coverage · no
> provider selected · entitlement matrix EMPTY · **OI-P04-03** governance attribute set ·
> **OI-D9-01** domain-segment label vocabulary.

## 5. P00 status

# **ACCEPTED**

Explicit acceptance act recorded against checkpoint `d29ad2fa4dac37180a1437eb2d29832372a6f205`.
20 of 20 acceptance criteria passed. Covers **P00 only**.

## 6. P01 status

# **ACCEPTED**

Explicit acceptance act recorded against package commit `547de1bf411aeab19b186be43f7a4dcee0857ff5`.
24 of 24 acceptance criteria passed. Covers **P01 only**.

Nine artifacts under `docs/p01/`. Contract-definition only: no provider, acquisition,
normalization, quality, security-master, PIT-storage, replay, engine, API or UI implementation;
no executable source. OI-08/OI-09/OI-10, AD-17, M-1, M-5, M-6 all preserved unresolved.

**Next step:** **P04 entry assessment** — CHECKPOINT-02 created (`docs/CHECKPOINT-02.md`).
P04 is **not** authorized.

## 6a. P02 status

# **ACCEPTED**

Explicit acceptance act recorded against package commit `2dd43cd0585cce056de69c9878ae138146fb23f5`.
34 of 34 acceptance criteria passed. Covers **P02 only**.

Ten artifacts under `docs/p02/`. Abstraction-boundary definition only: no provider named,
selected or implemented; no credentials or secrets; no acquisition, normalization, DQ,
security-master, PIT, replay, engine, API or UI work; no executable source. OI-10 blocks literal
canonical key emission (DEP-P02-01). All inherited open items preserved unresolved.

---


## 6b. P03 status

# **ACCEPTED**

Explicit acceptance act recorded in `docs/p03/P03_GATE_ACCEPTANCE.md` against authoritative
checkpoint `d99c557fe2af158a02474b37cc2c02809dc058bc`. Final re-review: **19 PASS · 0 FAIL · 0
blockers**. Covers **P03 specification only**.

Fourteen artifacts under `docs/p03/` (13 reviewed + the acceptance record). Security/authorization
**design only**: no implementation, no source, no configuration, no policy, no test, no secret,
no credential, no vendor selected.

⚠ **M-5 remains OPEN (existing-IIPS) and is not repaired** — authentication is specifiable but
not satisfiable; **C12 remains BLOCKED**; **DO-1…DO-5 remain deferred and NOT passed**.
OI-08/OI-09/OI-10, AD-17, M-1, M-6 all preserved unresolved. P04 remains the canonical
security-identity owner.

## 6c. P04 status

# **ACCEPTED**

Explicit **A3** acceptance act recorded in `docs/p04/P04_GATE_ACCEPTANCE.md` against work-package
commit `6ec3b288c8deeee317a63341297bd33b9a090f4f`. Formal gate review: **61 PASS · 0 FAIL · 2
non-blocking observations**. Covers **P04 specification only**.

Thirteen artifacts under `docs/p04/` (12 reviewed + the acceptance record). Identity/master
**design only**: no implementation, no source, no schema, no migration, no configuration, no
provider selected.

✅ **OI-08 RESOLVED — 1:N** identity cardinality; each security/instrument has its own immutable
canonical security ID; `companyId` remains the CSIP join key, unchanged.
✅ **OI-09 RESOLVED — FIGI / OpenFIGI** authoritative external identifier; the canonical security
ID remains distinct from FIGI; ISIN/CUSIP/SEDOL non-authoritative.

⚠ **OI-P04-03 (tenant/region governance attribute set) remains OPEN** — owner **A1**, not named.
It does **not** invalidate contract acceptance, but **bounds implementation**: per-record
governance application must remain bounded until the A1 decision is recorded
(`P04_GATE_ACCEPTANCE.md` §4.2, IB-1…IB-5). **It is not decided here.**

⚠ OI-P04-01/02/04/05 open; **AD-17, M-1, M-5, M-6 preserved unresolved**;
**DO-P04-1…DO-P04-5 deferred and NOT passed**. **P05 is not authorized.**
⚠ **Superseded as to OI-10:** the token was subsequently **RESOLVED = `MD:`** — see §6d and
`docs/CHECKPOINT-03.md` §3. P05's entry preconditions are now **MET**, which is **not**
authorization.

## 6d. OI-10 status — RESOLVED

# **RESOLVED**

| Field | Value |
|---|---|
| **Exact namespace token** | **`MD:`** |
| **Canonical field-key form** | **`MD:<domain>.<field>`** |
| **Prior status** | `APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING` |
| **Recording artifact** | `docs/CHECKPOINT-03.md` §3 |
| **Design basis** | `docs/d4/D4_07_FIELD_NAMESPACE.md` §I.2 — adopts the existing recommendation; **no new token, no design change** |
| **Competing token** | **NONE** — none was ever proposed or recorded |
| **Collision rules C1–C6** | **UNCHANGED** (`docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md` §C.2) |
| **Blocked phases released** | P05, P06, P11 — **from the OI-10 blocker only** |

⚠ **Does NOT mean:** P05/P06/P11 authorized · collision guard implemented (`DataBoundExecutor`
**untouched**) · `namespaceVersion` first value set · accepted P01/P02 `<NS>` keys rewritten
(**they are NOT edited**) · certification C1/C2 satisfied · OI-P04-04 or provider/entitlement
affected.

> ⚠ **As to P05 only, the first clause above is now superseded by §6e below** — P05 **entry** is
> authorized. **P06 and P11 remain unauthorized**, and every other clause above stands unchanged.

---

## 6e. P05 status — ENTRY / AUTHORIZATION = AUTHORIZED (D9)

# **ENTRY AUTHORIZED · ACCEPTANCE NOT_ACCEPTED**

| Field | Value |
|---|---|
| **Authority act** | **D9 — P05 Entry / Explicit Authorization** (`docs/d9/D9_P05_ENTRY_AUTHORIZATION.md`) |
| **Authority of record** | **Sai/Ramki** — program owner of record. ⚠ A1–A4 remain cleared, not person-assigned (`person_named:false`); **A3 gate acceptor UNKNOWN** |
| **Decision date** | **2026-09-09** · recorded `2026-09-09T12:29:00Z` (IST `17:59:00+0530`) |
| **Baseline** | `efe33eae287d2181cfdd5a838b0d9e5112fcdad3` — *CHECKPOINT-03* (tree `a11ea864…`) |
| **Preconditions** | **15 of 15 PASS** — `docs/d9/D9_EVIDENCE_NOTES.md` |
| `p05_entry_authorization` | **`AUTHORIZED`** (prior state `NOT_AUTHORIZED`) |
| `p05_acceptance` | **`NOT_ACCEPTED`** — no `P05_GATE_ACCEPTANCE.md` exists; **5 of 18** gates accepted |
| `p05_implementation` | **`AUTHORIZED_WITHIN_SCOPE_ONLY`** — D9 §3 |
| **Authorized** | **A-1** P05-01 local deterministic feed (full acquisition work) · **A-2** P05-02 spec/adapter-contract only · **A-3** P05-03 spec/adapter-contract only |
| **NOT authorized** | P05-02 live provider execution · P05-03 licensed/deeper historical · **P05-04 build-out** · per-record tenant/region governance · inventing the governance attribute set · inventing domain-segment labels · `<NS>`→`MD:` rewriting of accepted P01/P02 records |
| `certification_status` | **`NONE_GRANTED`** — unchanged |
| `production_activation_status` | **`NOT_AUTHORIZED`** — unchanged |
| **Open, NOT resolved by D9** | **OI-P04-04** (FIGI sourcing/licensing/coverage) · **OI-P04-03** (governance attribute set, IB-1…IB-5) · **OI-D9-01** (domain-segment label vocabulary) · provider selection NONE MADE · entitlement matrix EMPTY |
| **Carried forward unchanged** | Token `MD:` · form `MD:<domain>.<field>` · **C1–C6 UNCHANGED** · OI-08 1:N · OI-09 FIGI/OpenFIGI · `snapshotId` `data-${provider}-${dataVersion}-${asOf}` · `identityMappingVersion` in lineage · `SNAP_*` distinct · six lineage axes · MIC venue identity · effective-dated lifecycle · sole ingress `MarketDataSource<T>`→`DataSnapshot<T>` · E1–E8 · **AD-17 firewall** · existing-IIPS read-only · **DO-P04-1…5 / DO-1…5 still DEFERRED — NOT PASSED** |

⚠ **These states are distinct and are not collapsed.** Entering P05 is not passing it. P05
acceptance remains a **separate future gate** requiring the D9 §8 evidence package and **an
explicit acceptance act by a named A3 gate acceptor** — *no automatic promotion*.

---

## 7. D4 / D5 / D7 / D8 / D9 artifact locations

### `docs/d4/` — specification baseline (16 files, corrected by D4-B)
`D4_00_EXECUTIVE_SUMMARY` · `D4_01_INTEGRATION_REUSE_BASELINE` · `D4_02_DATA_DOMAINS` ·
`D4_03_UI_BASELINE` · `D4_04_INGRESS_CONTRACT_DELTA` · `D4_05_SECURITY_MASTER_ADAPTER` ·
`D4_06_SNAPSHOT_REPLAY_IDENTITY` · `D4_07_FIELD_NAMESPACE` · `D4_08_ENGINE_INTEGRATION` ·
`D4_09_P12_CONTRACT_DELTA` · `D4_10_P13_UI_DELTA` · `D4_11_CERTIFICATION_MATRIX` ·
`D4_12_PHASE_SEQUENCE` · `D4_13_TRACKER_CORRECTIONS` · `D4_14_AUTHORITY_ADR_REGISTER` ·
`D4_15_ACCEPTANCE_READINESS`

### `docs/d5/` — ADR packages and authority escalations (7 files)
`ADR-01_NAMESPACE_COLLISION_GUARD` · `ADR-02_REPLAY_IDENTITY_EXTENSION` ·
`E-01_SECURITY_IDENTITY_AUTHORITY` · `E-02_GATE_ACCEPTOR_AUTHORITY` · `D5_REGISTER` ·
`D5_DEPENDENCY_MAP` · `D5_HANDOFF`

### `docs/d7/` — authority-hold handoff (6 files)
`D7_AUTHORITY_DECISION_SHEET` · `D7_AUTHORITY_ROLE_ASSIGNMENT` · `D7_BLOCKER_MATRIX` ·
`D7_EXTERNAL_HANDOFF` · `D7_STATUS.json` · `D7_EVIDENCE_NOTES`

### `docs/d8/` — authority reconciliation and execution authorization (5 files)
`D8_AUTHORITY_RECONCILIATION` · `D8_EXECUTION_AUTHORIZATION` · `D8_STATUS.json` ·
`D8_FIRST_WORK_PACKAGE` · `D8_EVIDENCE_NOTES`

### `docs/d9/` — P05 entry / explicit authorization (3 files)
`D9_P05_ENTRY_AUTHORIZATION` · `D9_STATUS.json` · `D9_EVIDENCE_NOTES`

### `docs/p05/` — P05-01 execution record (3 files)
`P05_01_SPECIFICATION` · `P05_01_EVIDENCE` · `P05_01_OPEN_ITEMS`
⚠ **There is no `P05_GATE_ACCEPTANCE.md`** — P05 is entered, **not** accepted.

### `docs/p05/` — P05-02 execution record (3 more files; ⚠ supersedes the count above **by addition** — the block above is left unedited)
`P05_02_SPECIFICATION` · `P05_02_EVIDENCE` · `P05_02_OPEN_ITEMS` — created under D9 §3 **A-2**
(specification / adapter-contract only). `docs/p05/` now holds **6 files**.
⚠ **There is still no `P05_GATE_ACCEPTANCE.md`.**

### `p05/` — P05-01 implementation and evidence (executable, 35 files)
The program's **first executable surface**, created under D9 §3 **A-1** only.
`src/` (8 modules) · `tests/` (8 suites, **118 tests**) · `fixtures/` (3) · `evidence/` (13) ·
`scripts/generate-evidence.js` · `package.json` (**zero dependencies**).
⚠ Local deterministic feed only — **no live provider, no credentials, no network.**
⚠ `p05/src/replay.js` is **not** the existing-IIPS `ReplayService`; **AD-17 remains UNRESOLVED**.

### `p05/` — P05-02 adapter-contract additions (⚠ supersedes the counts above **by addition** — the block above is left unedited)
Added under D9 §3 **A-2** — **specification / adapter-contract only**:
`src/liveAdapterContract.js` (**LA-1…LA-31**) · `tests/mockLiveAdapter.js` (offline **synthetic test
double**, `mocklive`) · `tests/adapter-contract.test.js` (**74 contract-validation tests**) ·
`fixtures/adapter-contract-fixtures.json` · `evidence-p05-02/` (**13 files**) ·
`scripts/generate-p05-02-evidence.js` · `package.json` + `evidence:p05-02`.
`p05/` now holds **41 tracked files**; the suite is **192 tests**.
⚠ **Still zero dependencies, zero network, zero credentials.** `mocklive` is **NOT** a
provider-register issuance — `provider-register.json` is **unmodified** with exactly **1** identity.
⚠ These tests are **CONTRACT VALIDATION**, **not** provider evidence and **not** integration tests.

*Note: D6 (authority reconciliation, result "NO AUTHORITY CHANGE") produced no artifacts by
design — it was a read-only run. Its conclusion is carried forward in `docs/d8/`.*

## 8. P00 artifact locations

### `docs/p00/` — governance baseline + gate acceptance (7 files)
`P00_PROGRAM_CHARTER` · `P00_AUTHORITY_REGISTER` · `P00_DECISION_LOG` · `P00_GATE_MODEL` ·
`P00_EVIDENCE_CONVENTIONS` · `P00_OPEN_ITEMS_REGISTER` · `P00_GATE_ACCEPTANCE`

### `docs/p01/` — data contract + gate acceptance (10 files)

`P01_DATA_CONTRACT` · `P01_SCHEMA_CATALOG` · `P01_FIELD_DICTIONARY` · `P01_IDENTITY_AND_LINEAGE` ·
`P01_TIMESTAMP_CURRENCY_UNIT_RULES` · `P01_VERSIONING_COMPATIBILITY` · `P01_VALIDATION_RULES` ·
`P01_DEPENDENCY_REGISTER` · `P01_EVIDENCE` · `P01_GATE_ACCEPTANCE`

### `docs/p03/` — secrets/security specification + gate acceptance (14 files, ACCEPTED)

`P03_SCOPE_AND_BOUNDARY` · `P03_SECURITY_AUTH_CONTRACT` · `P03_AUTHENTICATION_MODEL` ·
`P03_TENANT_ISOLATION` · `P03_SECRET_CONFIGURATION_REQUIREMENTS` · `P03_PROVIDER_ACCESS_SECURITY` ·
`P03_AUDIT_AND_OBSERVABILITY` · `P03_FAILURE_AND_DEGRADED_MODE` · `P03_LINEAGE_AND_VERSION_IMPACT` ·
`P03_DEPENDENCY_REGISTER` · `P03_ACCEPTANCE_CRITERIA` · `P03_OPEN_ITEMS` · `P03_EVIDENCE` ·
`P03_GATE_ACCEPTANCE`

### `docs/p04/` — instrument/security master + gate acceptance (13 files, ACCEPTED)

### `docs/p02/` — provider abstraction + gate acceptance (11 files, ACCEPTED)

`P02_PROVIDER_ABSTRACTION_CONTRACT` · `P02_PROVIDER_CAPABILITY_MODEL` ·
`P02_PROVIDER_IDENTITY_VERSIONING` · `P02_ENTITLEMENT_MODEL` · `P02_ERROR_TAXONOMY` ·
`P02_PROVIDER_MAPPING_RULES` · `P02_COMPATIBILITY_AND_SUBSTITUTION` ·
`P02_OBSERVABILITY_REQUIREMENTS` · `P02_DEPENDENCY_REGISTER` · `P02_EVIDENCE` · `P02_GATE_ACCEPTANCE`

---

## 9. Invariant — 13 certified engines (AD-8)

IES-006 Banking · IES-007 Insurance · IES-008 Capital Markets · IES-009 Healthcare ·
IES-010 Hospitality · IES-011 Energy · IES-012 Utilities · IES-013 Consumer ·
IES-014 Industrials · IES-015 Technology · **IES-016 Telecom** · **IES-017 Automobile** ·
**IES-020 Materials & Metals**

Frozen methodologies preserved verbatim: **Telecom D16 M1–M15** · **Auto Option-A**
left-to-right accumulation (no `sum()`, triple `44ba/ea22/c8ed`) · **Materials G1–G6** (`5813…`).
No engine may be treated as uncertified because a readiness-certificate file is not locatable.

## 10. Invariant — 19 UI surfaces (AD-13)

UI01 Dashboard · UI02 Company Workspace · UI03 Portfolio · UI04 Research · UI05 Screener ·
UI06 Decision Center · UI07 Watchlists · UI08 Reports · UI09 Alerts · UI10 Collaboration ·
UI11 Administration · UI12 Settings · UI13 Global Search · UI14 Command Palette ·
UI15 CrossSectorIntelligence · UI16 EvidenceExplorer · UI17 ReplayExplorer ·
UI18 EngineRegistry · UI19 AiAdvisory

## 11. Invariant — sole production market-data ingress (AD-2)

```
MarketDataSource<T> → DataSnapshot<T> → DataBoundRequest
                    → DataBoundExecutor → ExecutionRequest.inputs → 13 certified engines
```
`DataSnapshot<T>` immutable · `DataBoundExecutor` the sole engine-binding path ·
provider adapters behind `MarketDataSource<T>` · **no second ingress contract.**

## 12. Invariant — P04 adapter identity model (AD-1)

```
canonical security master → governed identity mapping (explicit · versioned · auditable · evidenced)
                          → existing companyId → certified CSIP (NormalizedHolding — UNTOUCHED)
```
P04 is **not** a product-wide identity authority. Unmapped identities fail explicitly.

## 13. Invariant — G2 retired (AD-12)

No G2 layer, interface, module or DTO family. Product-plane basis: `EngineApiAdapter`,
`EngineApiRequest`/`EngineApiResponse`, existing product transports, typed frontend API clients.

---

## 14–16. Status invariants

| # | Field | Value |
|---|---|---|
| 14 | Certification | **`NONE_GRANTED`** |
| 15 | Formal gates | **5 of 18 accepted (P00, P01, P02, P03, P04)** — P05–P17 NOT ACCEPTED |
| 16 | Production activation | **`NOT_AUTHORIZED`** |

## 17–24. Open items

| # | Item | Status | Owner | Blocks |
|---|---|---|---|---|
| 17 | **AD-17 / M-2** ReplayService literal returns | **UNRESOLVED** — not resolved by ADR-02 approval | Existing-IIPS | UI17 replay reporting |
| 18 | **M-1** | **`OPEN_REVALIDATION_REQUIRED`** — not fixed, not certified, not revoked | Existing-IIPS (AD-10) | P15, P16, P17 |
| 19 | **E2E-030** | **NOT REVOKED · NOT RENEWED** — AD-4 = revalidation required, not revocation | Existing-IIPS | — |
| 20 | **OI-08** identity cardinality 1→N | ✅ **RESOLVED — 1:N** by explicit program authority (`docs/p04/P04_GATE_ACCEPTANCE.md` §3) | New program | ⚠ downstream consequences remain: P11, P12, P13 (OI-P04-02) |
| 21 | **OI-09** external identifier standard | ✅ **RESOLVED — FIGI / OpenFIGI authoritative** (`docs/p04/P04_GATE_ACCEPTANCE.md` §3) | New program | ⚠ sourcing/licensing remains: P05 (OI-P04-04) |
| 22 | **OI-10** exact namespace token | ✅ **RESOLVED — token `MD:` · form `MD:<domain>.<field>`** (`docs/CHECKPOINT-03.md` §3) | ADR-01 authority (`person_named:false`) | ⚠ blocker released for P05/P06/P11; **implementation still unauthorized**; literal-key rewrite is P05/P06 work |
| 23 | **M-5** authentication/session | **OPEN** | Existing-IIPS | P03 limitation |
| 24 | **M-6** retention enforcement | **OPEN** | Existing-IIPS | C10, P17 |
| 24a | **OI-D9-01** `MD:<domain>.<field>` domain-segment label vocabulary | **OPEN — newly recorded by D9** (no prior authoritative item bore this ID). Five labels exemplified (`price`, `ohlcv`, `valuation`, `fundamentals`, `estimates`) against the ten-domain baseline; **D04, D05, D06, D08, D09, D10 have none**. ⚠ **No label invented, inferred or defaulted.** Token and form are settled — **OI-10 is NOT reopened**; this is a vocabulary decision | Ramki/Sai | ⚠ Does **not** block P05 entry or **P05-01**; blocks only work that must mint a new domain-segment label (`docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` §6) |
| 24b | **P05 entry/authorization** | ✅ **AUTHORIZED by D9** (2026-09-09, Sai/Ramki, baseline `efe33ea`) — within D9 §3 scope only | Program authority | ⚠ **P05 acceptance is a separate future gate**; **A3 gate acceptor UNKNOWN**; no automatic promotion |
| 24b-1 | ⚠ **CORRECTS row 24a by addition — row 24a is left UNEDITED as the record of its own moment.** **OI-D9-01 = RESOLVED BY EVIDENCE — no gap exists.** The P05-01 execution parsed the **accepted** `docs/p01/P01_FIELD_DICTIONARY.md` §3–§12 (`P01_GATE_ACCEPTANCE.md`:16 `**ACCEPTED**`) directly and found a domain segment for **all ten** domains: D01 `price`+`valuation` · D02 `ohlcv` · D03 `fundamentals` · D04 `corpaction` · D05 `identity` · D06 `news` · D07 `estimates` · D08 `macro` · D09 `alt` · D10 `venue` — **11 distinct segments**. ⚠ Row 24a's premise was wrong because it counted **literal `MD:` strings**; the dictionary predates the OI-10 recording and uses the **`<NS>` placeholder**, which `CHECKPOINT-03` §3.3(5)/rule 14 binds to `MD:` for new work (*"a substitution, not a redesign"*, §10). **No vocabulary invented or altered. OI-10 NOT reopened — token `MD:` and form `MD:<domain>.<field>` preserved exactly.** Mechanically enforced by `p05/tests/namespace.test.js`. ⚠ Closes **OI-D9-01 only** — **OI-P04-04 and OI-P04-03 remain OPEN** (`docs/p05/P05_01_OPEN_ITEMS.md` §2) |
| 24b-2 | **P05-01 — local deterministic market feed** | ✅ **IMPLEMENTED / EVIDENCED** (D9 §3 A-1, baseline `efe33ea`) | — | **118/118 tests PASS**; evidence byte-reproducible; 0 duplicates on replay; 0 dependencies; no network. ⚠ **P05 ACCEPTANCE = NOT_ACCEPTED**; **no `P05_GATE_ACCEPTANCE.md`**; **A3 gate acceptor UNKNOWN** (`docs/p05/P05_01_EVIDENCE.md`) |
| 24b-3 | **P05-02 — LIVE market adapter: SPECIFICATION / ADAPTER-CONTRACT ONLY** (D9 §3 **A-2**) | ✅ **SPECIFICATION + ADAPTER-CONTRACT COMPLETE** · ⚠ **LIVE EXECUTION NOT AUTHORIZED** | — | Contract `P05-02-LIVE-MARKET-DATA-ADAPTER-CONTRACT` **v1.0**, rules **LA-1…LA-31**, implemented in `p05/src/liveAdapterContract.js`. **192/192 tests PASS** (118 P05-01 + **74 new** contract-validation tests). Evidence `p05/evidence-p05-02/` (13 files, byte-identical across 3 regenerations). ⚠ **CLASSIFICATION = CONTRACT VALIDATION ONLY** — **NOT** provider evidence, **NOT** integration tests, and it does **NOT** establish that *"authenticated ingestion works"*. All three tracker P05-02 columns (**Exit Criteria** / **Test-Validation** / **Evidence**) remain **UNMET** (`BD-P05-02-01…03`). ⚠ **No provider selected, named, contacted or bound** · **no credentials provisioned** · **entitlement matrix still EMPTY** · **0 vendor names** · **0 secret hits over 18 files** · **0 network imports** · **0 dependencies**. Canonical model **NOT forked** (`forked: false` — P05-01 surfaces imported verbatim); the P05-01 feed is explicitly **not** a live adapter and **cannot** satisfy P05-02. ⚠ **OI-P04-04 and OI-P04-03 remain OPEN and were NOT resolved**; **no tenant/region attribute, provider entitlement value or licensing-coverage claim invented**. **C1–C6 unchanged**; OI-08/OI-09/OI-10 unaltered; `docs/p01\|p02\|p04\|d5` and both binary baselines **unmodified**; **P05-04 NOT started**; **P06/P07/P08 untouched**. ⚠ **P05 ACCEPTANCE still NOT_ACCEPTED** (no `P05_GATE_ACCEPTANCE.md`; still **5 of 18**); **CERTIFICATION `NONE_GRANTED`**; **ACTIVATION `NOT_AUTHORIZED`**; **A3 gate acceptor UNKNOWN**. One P05-01 test file's **scan scope** was adjusted and is disclosed in full at `docs/p05/P05_02_OPEN_ITEMS.md` §5 — **no assertion weakened or deleted** (`docs/p05/P05_02_SPECIFICATION.md` · `P05_02_EVIDENCE.md` · `P05_02_OPEN_ITEMS.md`) |

### ⚠ OI-10 — critical recovery note — ⚠ SUPERSEDED, see the note immediately following

> ⚠ **SUPERSEDED AS TO CURRENT STATE by `docs/CHECKPOINT-03.md` §3 and §6d above.** The
> paragraph below is **left unedited as the record of its own moment** and was correct when
> written. **OI-10 is now RESOLVED; the exact token `MD:` has been RECORDED by explicit
> program authority — it was recorded, NOT invented, and it adopts the pre-existing D4_07
> recommendation.** The prohibition below on *inventing* a token remains in force for all
> other tokens and all future work; what is now closed is the recording action itself.

**Do NOT convert `MD:<domain>.<field>` into a final approved token.** It remains an
**illustrative recommendation only** (`docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md` lines
89, 98, 99, 203). The Sai/Ramki approval cleared the *authority hold*; it did not state a token
string. Recording the exact token is a **documentation/recording action — not permission to
invent one.**

---

## 25. Existing-IIPS boundary

`iips-review-recovered` is a **read-only dependency** (AD-15 authoritative). The new program
**may depend on** existing-IIPS artifacts **without modifying them**.

**Must NOT be modified:** `iips-review-recovered` (any file) · existing-IIPS source and tests ·
any of the 13 engines · scoring / calibration / taxonomy · Auto Option-A · Materials G1–G6 ·
Telecom D16 · `LiveDataRuntime.ts` · `DataBoundExecutor` · `ReplayService` · E2E-030
certification artifacts · `PROGRAM_v1.1_REPLAY_BASELINE.json` · any existing-IIPS
methodology/certification artifact.

**Existing-IIPS responsibilities (not this program's):** M-1 repair/revalidation ·
AD-17 resolution · M-5 · M-6 · existing-IIPS methodology and certification changes.

## 26. Explicit rule — methodology and certification

> **No existing-IIPS methodology or certification artifact is to be modified by this program.**

ADR-01 (touching `DataBoundExecutor`) and ADR-02 (replay identity) are approved **in
principle** but are **P05/P06/P11** and **P08** work respectively, each subject to its own
evidence and gate. They are not licence to modify existing-IIPS ahead of those phases.

## 27. Explicit rule — gate promotion

> ### **"Explicit gate acceptance; no automatic promotion."**

No phase is promoted by technical completion, authority clearance, or elapsed time. Every gate
requires an explicit acceptance act with its minimum evidence. **A3 clearance permits the
acceptance process; it pre-accepts nothing.**

---

## 28. Checkpoint purpose and recovery instructions

**Purpose.** Preserve the complete D4–D8 authority/execution history plus the WP-P00-01
governance baseline in the repository, so a future Arena session can recover full program state
**without** the current session or conversation history.

### Recovery procedure

1. **Read this file first** — it is the index.
2. **Read `docs/d8/D8_STATUS.json`** — the machine-readable authoritative state (program status,
   ADR status, authority roles, open items, per-phase readiness, remaining blockers, invariants).
3. **Read `docs/p00/P00_AUTHORITY_REGISTER.md`** — the four authority dimensions and the OI-10
   constraint.
4. **Read `docs/p00/P00_GATE_MODEL.md`** — all 18 gates; confirm none is accepted.
5. **Read `docs/p00/P00_OPEN_ITEMS_REGISTER.md`** — what is open and what it blocks.
6. **Consult `docs/d4/`** for specification detail; `docs/d5/` for the ADR packages;
   `docs/d7/` for the authority-hold record; `docs/d8/` for the reconciliation that authorized
   execution.
6a. ⚠ **Then read `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` and `docs/d9/D9_STATUS.json`** — the
    **current** P05 entry/authorization state. ⚠ **Steps 2 and 4 above are stale as to current
    state and are left unedited as the record of their own moment**: `D8_STATUS.json` still reads
    `formal_gate_status: NONE_ACCEPTED (0 of 18)` and *"executable now: P00 only"* **by design** —
    it is an immutable historical record. **Current state: 5 of 18 gates accepted (P00–P04), and
    P05 is ENTRY/AUTHORIZED within the D9 §3 scope.** Corrections are recorded by addition in
    `docs/d9/`, never by editing D8.

### Recovery rules

| # | Rule |
|---|---|
| 1 | **D4, D5 and D7 are immutable historical records.** Corrections go in new artifacts that cite the original — never by editing history |
| 2 | Do not re-litigate the 14 G-A decisions or alter any D4 disposition |
| 3 | Do not apply the AD-14 tracker corrections — specified in `docs/d4/D4_13_TRACKER_CORRECTIONS.md`, **not authorized to apply** |
| 4 | Do not modify the tracker XLSX or SPEC DOCX |
| 5 | Do not invent authority, evidence, dates or the namespace token |
| 6 | Evidence must follow `docs/p00/P00_EVIDENCE_CONVENTIONS.md` — including **pinned commits** |
| 7 | Authority approval is never certification, never gate acceptance, never production activation |
| 8 | **P00, P01, P02 and P03 gates are ACCEPTED.** P03 acceptance is **specification only**: ⚠ **M-5 remains OPEN (existing-IIPS)**, **C12 remains BLOCKED**, **DO-1…DO-5 remain deferred**. The D4/D5/D7 *"P03 BLOCKED — AUTHORITY"* language is **superseded by D8**. **CHECKPOINT-02 is created** (`docs/CHECKPOINT-02.md`, source commit `7b8fa9d`). Next: a **P04 entry assessment** — P04 is **not** authorized, and **OI-08 / OI-09 remain OPEN**. |
| 8a | ⚠ **SUPERSEDES row 8 as to current state — row 8 is left unedited as the record of its own moment.** The **P04 entry assessment was performed** and returned `P04 ENTRY BLOCKED — CONTENT DECISION`; **OI-08 and OI-09 were then RESOLVED by explicit program authority** (1:N · FIGI/OpenFIGI); the P04 work package was prepared (`6ec3b288c8deeee317a63341297bd33b9a090f4f`) and the **P04 gate is ACCEPTED** (`docs/p04/P04_GATE_ACCEPTANCE.md`) — **5 of 18**. ⚠ **OI-P04-03 remains OPEN and bounds implementation.** Next: **P05 is NOT authorized** — it requires the exact namespace token (**OI-10**, unrecorded). Git-history provenance qualification: `docs/INCIDENT-01_HISTORY_LOSS.md` |
| 8b | ⚠ **SUPERSEDES rows 8 and 8a as to current state — both are left unedited as the record of their own moment.** **CHECKPOINT-03** (`docs/CHECKPOINT-03.md`) was taken after P04 acceptance (`faf1317eccaf77dbdab2a520899802043c851cca`). **OI-10 is RESOLVED — exact token `MD:`, canonical form `MD:<domain>.<field>`; C1–C6 unchanged.** **P05 entry preconditions are MET** — ⚠ **which is NOT authorization**: P05 remains **NOT_STARTED / NOT_ACCEPTED / NOT_AUTHORIZED** and requires an explicit entry/authorization act. ⚠ **OI-P04-04 (FIGI sourcing/licensing/coverage), provider selection and the empty entitlement matrix are NOT resolved by OI-10.** P06/P07 not promoted; **P08 not started** (AD-17 firewall preserved); P14 unchanged; P15 still BLOCKED on M-1. Certification **NONE_GRANTED**; activation **NOT_AUTHORIZED** |

| 8c | ⚠ **SUPERSEDES rows 8, 8a and 8b as to current state — all three are left unedited as the record of their own moment.** **D9 — P05 ENTRY / EXPLICIT AUTHORIZATION** was recorded **2026-09-09** by **Sai/Ramki** against baseline `efe33eae287d2181cfdd5a838b0d9e5112fcdad3` (`docs/d9/D9_P05_ENTRY_AUTHORIZATION.md`). **All 15 preconditions PASS.** **P05 is now ENTRY/AUTHORIZED** within the exact D9 §3 scope — **P05-01** local deterministic feed (full acquisition work) plus **specification/adapter-contract work only** for **P05-02** and **P05-03**. ⚠ **NOT authorized:** P05-02 live provider execution · P05-03 licensed/deeper historical · **P05-04 build-out** · per-record tenant/region governance. ⚠ **P05 ACCEPTANCE = NOT_ACCEPTED** (no `P05_GATE_ACCEPTANCE.md`; still **5 of 18**); **CERTIFICATION = `NONE_GRANTED`**; **ACTIVATION = `NOT_AUTHORIZED`**. **OI-P04-04 and OI-P04-03 remain OPEN and were NOT resolved**; no provider selected; entitlement matrix EMPTY; no credentials provisioned. New open item **OI-D9-01** (domain-segment label vocabulary) — **no label invented**. **C1–C6 unchanged**; OI-08/OI-09/OI-10 unaltered; accepted P01/P02 `<NS>` records **not** rewritten; **P06/P07 not promoted; P08 not started** (AD-17 firewall preserved); P15 still BLOCKED on M-1; existing-IIPS untouched; **no executable/implementation artifact created**; **not pushed** |
| 8d | ⚠ **SUPERSEDES rows 8, 8a, 8b and 8c as to current state — all four are left unedited as the record of their own moment.** **P05-02 — LIVE market adapter SPECIFICATION / ADAPTER-CONTRACT** was completed **2026-09-09** under **D9 §3 A-2** (specification and adapter-contract work only) on baseline `bf66c99cec1f7e43ae4dbc3ab5e77c23a27b014d`. Contract **`P05-02-LIVE-MARKET-DATA-ADAPTER-CONTRACT` v1.0** (rules **LA-1…LA-31**) with an executable conformance surface (`p05/src/liveAdapterContract.js`) and an offline **synthetic test double** (`mocklive`). **192/192 tests PASS** (118 P05-01 + **74 new**). Evidence `p05/evidence-p05-02/` — **13 files, byte-identical across 3 regenerations**. ⚠ **CLASSIFICATION = CONTRACT VALIDATION ONLY**: **NOT** provider evidence, **NOT** integration tests, and it does **NOT** establish that *"authenticated ingestion works"* — all three tracker P05-02 columns remain **UNMET**. ⚠ **NOT authorized and NOT performed:** P05-02 live provider execution (**D9 N-1**) · **P05-04** (**N-3**) · per-record tenant/region governance (**N-4**). ⚠ **No provider selected, named, contacted or bound**; **no credentials provisioned**; **entitlement matrix still EMPTY**; **0 vendor names**; **0 secret hits over 18 files**; **0 network imports**; **0 dependencies**; `provider-register.json` **unmodified**. **Canonical model NOT forked** — the P05-01 envelope/namespace/identity/provenance/validation/error surfaces are imported verbatim, and the P05-01 feed is explicitly **not** a live adapter. ⚠ **OI-P04-04 and OI-P04-03 remain OPEN and were NOT resolved**; **no tenant/region attribute, provider entitlement value or licensing-coverage claim invented**. **C1–C6 unchanged**; OI-08/OI-09/OI-10 unaltered; `docs/p01\|p02\|p04\|d5`, `CHECKPOINT-02/03` and both binary baselines **unmodified**; **P06/P07 not promoted; P08 not started**. ⚠ One P05-01 test file's **lexical scan scope** was adjusted so it keeps asserting its original claim about the P05-01 modules while stronger **behavioural** assertions cover the new module — **no assertion weakened or deleted**; disclosed in full at `docs/p05/P05_02_OPEN_ITEMS.md` §5. ⚠ **P05 ACCEPTANCE = NOT_ACCEPTED** (no `P05_GATE_ACCEPTANCE.md`; still **5 of 18**); **CERTIFICATION = `NONE_GRANTED`**; **ACTIVATION = `NOT_AUTHORIZED`**; **A3 gate acceptor still UNKNOWN**. **New bounded dependencies BD-P05-02-01…10 recorded, none resolved** — including **BD-02** (provider selection / entitlement / credentials / **P16** authority), which did **not** previously exist as a repository identifier and is recorded under the tasking label with an explicit mapping to **DEP-P02-07** / **DEP-P02-06** / **INV-10**. **Not pushed** |
| 8e | ⚠ **INCIDENT-02 — SECOND SANDBOX RE-CLONE / HISTORY LOSS** (recorded `docs/INCIDENT-02_SANDBOX_RECLONE.md`; **supersedes nothing** — rows 8, 8a–8d stand). The workspace was **re-cloned from `origin` between turns**: HEAD reset to `eae2ff6` with **2 tracked files**, and **three commits are permanently unavailable as objects** — `cdc40dc` (P05-02), `bf66c99` (P05-01), `31c2655` (**D9 P05 entry authorization**). None was ever pushed; no dangling copies exist. **Per rule O-4 no substitute hash is invented** — those pins are now **unverifiable** and are pinned **by artifact**. **CONTENT LOSS = ZERO**: the working tree survived intact (102 `docs/` + 53 `p05/` + 2 binaries = **157**, exactly the lost tip's file count), verified by a whole-tree sha256 digest `921f7f46…` taken **identically before and after** every recovery step. The accepted baseline **was recoverable**: `efe33ea` (CHECKPOINT-03) still exists on the remote as `arena/01a0814b-…`, so a **read-only fetch** restored `eae2ff6 → 9a26ac7 → 6ec3b28 → faf1317 → efe33ea`; that branch was **not** pushed to. Restored with `git reset --mixed efe33ea` (moves pointer + index only, never rewrites working-tree files) plus **one RESTORE commit** — deliberately one, because splitting it would still yield different hashes while falsely implying the D9 act and the two work packages were re-performed. **No authority act was re-performed.** Verified after restore: **192/192 tests PASS** (the 4 failures seen immediately after the re-clone were **NOT** content failures — `existing-iips-boundary.test.js` shells out to `git diff efe33ea HEAD`, and the baseline was missing); all accepted artifacts and both binaries **byte-identical to `efe33ea`** (0 differing files); only the 2 governance ledgers differ, additively. ⚠ **INCIDENT-01's recorded mitigation DID NOT HOLD** — `origin/main` contains **only the 2 binaries**, no `docs/` at all, so the accepted state is **not** under remote protection, and the standing *"do not push"* instruction — which INCIDENT-01 L-1 already named as the proximate exposure — **has now fired twice**. **Recommendation to program authority: either authorize pushing this branch, or accept that every authorization act including D9 must be re-recorded after each recreation.** This is an **authority decision, not one made here**. **Program state UNCHANGED**: P05 = AUTHORIZED / NOT_ACCEPTED (**5 of 18**) · no `P05_GATE_ACCEPTANCE.md` · CERTIFICATION `NONE_GRANTED` · ACTIVATION `NOT_AUTHORIZED` · OI-P04-04 / OI-P04-03 **OPEN** · C1–C6 unchanged · P06/P07/P08 untouched · A3 acceptor **UNKNOWN**. **Not pushed** |
| 8f | ⚠ **SUPERSEDES rows 8 and 8a–8e as to current state — all five are left unedited as the record of their own moment.** **P05-02-B — LIFECYCLE-STATE COVERAGE COMPLETION** was executed **2026-09-09** under **D9 §3 A-2** (specification / adapter-contract scope only). It closes **BD-P05-02-07** and **nothing else**: lifecycle fixture coverage went **2 of 5 → 5 of 5** by adding `suspended` (→ `CS-LOCAL-0006`), `merged` (→ `CS-LOCAL-0007`) and `superseded` (→ `CS-LOCAL-0008`) plus the two **successor** identities **LC-4** requires (`CS-LOCAL-0009`, `CS-LOCAL-0010`), and adapter-contract test group **Q/1…Q/8** exercising **LC-1…LC-6**, **ADP-7**, **MC-2/MC-4** and **D-1/ST-2/ST-3**. Suite **192 → 200**, all passing; evidence byte-identical across regenerations. **No `p05/src/` file was modified** and **no existing test was modified** — the `MC-1` issuer-count assertion was respected by giving the new fixture its own issuer `CI-LOCAL-KAPPA`. `LIFECYCLE_STATES` is **UNCHANGED**. Accepted P04 artifacts: **0 differing** from `efe33ea`. **OI-08/OI-09/OI-10 unchanged · ADR-01 C1–C6 unchanged · `MD:` token unchanged · no provider selected · 0 credentials · 0 network surface · existing-IIPS untouched.** ⚠ **This closed a fixture/test gap ONLY** — the provider-dependent tracker exit criteria remain **UNMET** (**BD-P05-02-01/02/03**), and **BD-P05-02-05** remains **OPEN**. ⚠ **P05 ACCEPTANCE = `NOT_ACCEPTED` · CERTIFICATION = `NONE_GRANTED` · PRODUCTION ACTIVATION = `NOT_AUTHORIZED` · P05-04 `NOT AUTHORIZED` · P06/P07/P08 `NOT STARTED` · still 5 of 18 gates · no `P05_GATE_ACCEPTANCE.md`.** Evidence: `docs/p05/P05_02_EVIDENCE.md` §15 · `docs/p05/P05_02_OPEN_ITEMS.md` §6.1 | Program owner (Sai/Ramki) via D9 §3 A-2 | 2026-09-09 |
| 8g | ⚠ **SUPERSEDES rows 8 and 8a–8f as to current state — all six are left unedited as the record of their own moment.** **P05-03-A — HISTORICAL OHLCV INGESTION CONTRACT** was executed **2026-09-09** under **D9 §3 A-3** (*“Specification and adapter-contract only — historical OHLCV ingestion contract, reproducibility and load/reconcile requirements”*). It adds contract **`P05-03-HISTORICAL-OHLCV-INGESTION-CONTRACT` v1.0** with **35 rules `HA-1…HA-35`** (`p05/src/historicalAdapterContract.js`), **28** contract tests, **13** evidence artifacts and the `P05_03_{SPECIFICATION,EVIDENCE,OPEN_ITEMS}.md` trio. Suite **200 → 228**, all passing; evidence byte-identical across regenerations. **No canonical surface was forked** (`forked: false`), **no error class added** (E1–E8 reused), **`snapshotId` composition unchanged**, **lifecycle vocabulary unchanged**. ⚠ **`DEP-P01-04` remains UNRESOLVED** — the P05-01 one-bar-per-snapshot precedent is **reused** but does **not** pre-empt the P08 series-structure decision; no series storage, PIT storage or PIT query was built. ⚠ **`1D` remains the only `barInterval` value** — the enum is not enumerated by any accepted artifact, so no interval was invented (**D9 N-6**). ⚠ **No adjusted series and no adjustment engine** (**RC-5**, P08). **Accepted P01/P02/P04 artifacts: 0 differing from `efe33ea` · OI-08/09/10 unchanged · ADR-01 C1–C6 unchanged · `MD:` unchanged · no provider selected · 0 credentials · 0 network surface · existing-IIPS untouched.** ⚠ **This unit closed NOTHING provider-dependent** — the tracker exit criterion *“Historical load reproducible”* and evidence *“Historical sample”* both remain **UNMET** (**D9 N-2** / **OI-P04-04**); evidence class is **`CONTRACT_VALIDATION`**, never provider evidence. Ten items recorded open as **BD-P05-03-01…10**, including **DEP-P01-04**, the unenumerated `barInterval`, the `sessionRef` catalog/dictionary discrepancy, and a newly observed **A-23 secret-scanner blind spot**. ⚠ **Two disclosures:** one existing boundary test was **scoped, not weakened** (the contract-module retry carve-out extended to the P05-03 module, with the identical behavioural assertions applied and re-asserted in HA/19; **no P05-01 assertion altered**), and two long keys were shortened to satisfy that scanner (**the P05-01 scanner was NOT modified**). ⚠ **P05 ACCEPTANCE = `NOT_ACCEPTED` · CERTIFICATION = `NONE_GRANTED` · PRODUCTION ACTIVATION = `NOT_AUTHORIZED` · P05-04 `NOT AUTHORIZED` · P06/P07/P08 `NOT STARTED` · still 5 of 18 gates · no `P05_GATE_ACCEPTANCE.md`.** Evidence: `docs/p05/P05_03_EVIDENCE.md` · `docs/p05/P05_03_OPEN_ITEMS.md` | Program owner (Sai/Ramki) via D9 §3 A-3 | 2026-09-09 |
| 8h | ⚠ **SUPERSEDES NOTHING as to program state — rows 8 and 8a–8g all stand unchanged. Evidence-maintenance correction only: no phase status, gate, authority decision or open item moves.** **P05-01 EVIDENCE CURRENCY REPAIR** was executed **2026-09-09** as the narrowly scoped corrective action identified by the **PRE-A3 / PRE-P05-ACCEPTANCE CHECKPOINT** (checkpoint §12-A, taken at `4b37b17`). That checkpoint found that `p05/evidence/` no longer matched a fresh `npm run evidence`: **P05-02-B had legitimately expanded the *shared* `p05/fixtures/identity-fixtures.json` from 6 → 11 securities and 5 → 10 mappings**, but the P05-01 evidence set was never regenerated, so `01-fixture-manifest.json` still manifested the P05-01-era corpus and row `24b-2`'s present-tense *"evidence byte-reproducible"* was momentarily inaccurate. **Resolution — the P05-01 evidence was REGENERATED against the current authoritative fixtures; the generator itself was NOT modified** (it was already deterministic by construction: fixed run stamp, no `Date.now` / `Math.random` / `process.env`). Exactly **3 of 13** files changed and **purely additively** — `00-INDEX.json` (2 digests) · `01-fixture-manifest.json` (+5 securities, +5 mappings) · `09-namespace-identity.json` (+2 issuer groups, +2 company groups); **0 entries removed or altered**; the other **10 files byte-identical**; all 12 index digests self-consistent. Determinism re-proved: **3 isolated generations → identical digest `1af92f6a2a78a59ffd4705da186332000ad25049b478043d16da9ad9e381cb22`**, and the regenerated repository evidence matches it byte-for-byte. **No P05-01 implementation semantic changed** — no rule, canonical field key, error class, `snapshotId` composition, lifecycle vocabulary or `MD:` token moved; **OI-08 / MC-1 1:N is now evidenced by 3 issuer groups and 3 company groups instead of 2 and 1** (strengthened, not altered). No P05-01 document asserts a fixture count, so **no historical P05-01 claim was edited**; row `24b-2` is accurate again as written. Suite **228/228**; accepted P01–P04 and CHECKPOINT artifacts **byte-identical to `efe33ea`**; **P05-02-B and P05-03-A untouched**. **P05 remains AUTHORIZED / NOT_ACCEPTED · A3 gate acceptor still UNKNOWN · certification `NONE_GRANTED` · production activation `NOT_AUTHORIZED` · P05-04 NOT AUTHORIZED.** |
| 8i | ⚠ **SUPERSEDES rows 8 and 8a–8h ONLY as to the A3 gate-acceptor field — all eight are left unedited as the record of their own moment. No phase status, gate, certification or activation state moves.** **A3 P05 GATE-ACCEPTOR DESIGNATION** was recorded **2026-09-10** against baseline `78839091c7d199a9c69ee583fd9702b151a49158` in **`docs/p00/P00_DECISION_LOG.md` §7** (append-only, per that log's own rule 1 — no new governance instrument, directory or register was created). **A3 phase-gate acceptance authority for the P05 gate = Ramakrishnan V. S. (Ramki)**, program owner of record. ⚠ **This is a DESIGNATION of the person authorized to *perform* the P05 gate-acceptance decision — it is NOT the acceptance.** No acceptance act has occurred; **`P05_GATE_ACCEPTANCE.md` deliberately does NOT exist**; **P05 remains `AUTHORIZED / NOT_ACCEPTED`**, still **5 of 18** gates accepted; **certification `NONE_GRANTED`**; **production activation `NOT_AUTHORIZED`**; **P05-04 `NOT_AUTHORIZED`** (D9 N-3). Superseded as to current state — **all left unedited as the record of their own moment**: the *"A3 gate acceptor UNKNOWN"* statement in the §4 D9 block above · `docs/p00/P00_AUTHORITY_REGISTER.md` §4 (`Person named? NO`) · `docs/d9/D9_STATUS.json` (`a3_gate_acceptor: "UNKNOWN"`) · **BD-P05-01-09 · BD-P05-02-10 · BD-P05-03-09**. ⚠ **No other role is designated or inferred — A1, A2 and A4 remain `person_named: false`, and no P06–P17 acceptor is assigned.** **Zero technical change**: no methodology, contract, rule, canonical field key, lifecycle vocabulary, `snapshotId` composition, OI-08/OI-09/OI-10 decision, ADR-01 **C1–C6** rule or accepted **P00–P04** artifact altered; **no `p05/src`, `p05/tests`, `p05/fixtures` or `p05/evidence*` file modified**; no provider, credential, network or licensed-data work. **Remaining P05 acceptance blockers stand** — **OI-P04-04** · **OI-P04-03** · **DEP-P01-04** (P08) · **P05-04** authorization · **P16** licensing / credentials / entitlement · tracker **P05-02** *"Authenticated ingestion works"* and **P05-03** *"Historical load reproducible"* exit criteria · **BD-P05-03-01…08, 10**. **Next act: P05 acceptance-readiness assessment — NOT performed here.** |

### Known documentation gaps (recorded, not defects)

CD-01 citation drift (`LiveDataRuntime.ts:76` in D4/D5 vs `:78` in the current clone — same
commit `5decdca`, same code, line offset only) · P10 thin D4 coverage · missing IES-016/017/020
readiness certificate files (**AD-8 stands: certified**) · `G:\IIPS\BACKUPS` inaccessible.

---

**This manifest records no new decision.** ⚠ **Clarified by addition (D9, 2026-09-09):** this
manifest remains a **recovery / index artifact only** — it introduces no decision of its own. The
**P05 entry/authorization decision it now points to is recorded in `docs/d9/`, not here.** Every
statement above is a pointer to, or a restatement of, an existing committed artifact.
