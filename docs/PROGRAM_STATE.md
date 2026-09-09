# PROGRAM STATE — SESSION RECOVERY MANIFEST

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

---

## 7. D4 / D5 / D7 / D8 artifact locations

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

### Known documentation gaps (recorded, not defects)

CD-01 citation drift (`LiveDataRuntime.ts:76` in D4/D5 vs `:78` in the current clone — same
commit `5decdca`, same code, line offset only) · P10 thin D4 coverage · missing IES-016/017/020
readiness certificate files (**AD-8 stands: certified**) · `G:\IIPS\BACKUPS` inaccessible.

---

**This manifest records no new decision.**
