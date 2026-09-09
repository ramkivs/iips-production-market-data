# P00 — DECISION LOG

**Record only. No decision below is re-litigated, reinterpreted or altered.**
Each entry preserves its original meaning and cites its source artifact.

---

## 1. G-A decisions (14) — recorded unchanged

Source: `docs/d4/D4_14_AUTHORITY_ADR_REGISTER.md` §P.1 (G-A Integration Baseline Authority Gate).

| # | ID | Decision (original meaning preserved) | Source artifact |
|---|---|---|---|
| 1 | **AD-15** | **ACCEPT** — the existing-IIPS repository (`iips-review-recovered`) is authoritative over D2's reconstructions | `docs/d4/D4_14_…md` §P.1 |
| 2 | **AD-4** | **REQUIRE REVALIDATION** of E2E-030 — **not revocation**. Cannot be relied upon by this program until M-1 is repaired and relevant suites re-run | `docs/d4/D4_14_…md` §P.1; `docs/d4/D4_11_CERTIFICATION_MATRIX.md` |
| 3 | **AD-10** | **EXISTING-IIPS PROGRAM** owns M-1 repair (Ramki/Sai) | `docs/d4/D4_14_…md` §P.1 |
| 4 | **AD-1** | **ADAPTER MODEL** — P04 canonical security master maps through an explicit governed adapter to existing `companyId`; certified CSIP boundary remains untouched | `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md` |
| 5 | **AD-3** | **INCLUDE** `dataVersion` + `asOf` in effective replay identity/lineage for market-data executions; provider identity remains linked; certified engine-layer changes require Ramki/Sai ADR | `docs/d4/D4_06_SNAPSHOT_REPLAY_IDENTITY.md` |
| 6 | **AD-6** | **EXPLICIT DUAL-LAYER MAPPING** — `data-*` = market-data input snapshot identity; `SNAP_*` = engine execution/result identity; explicit linkage mandatory | `docs/d4/D4_06_…md` §H.2 |
| 7 | **AD-2** | **AUTHORIZE** `MarketDataSource<T>`/`DataSnapshot<T>` as the mandatory and sole production market-data ingress; `DataBoundExecutor` the sole engine-binding path | `docs/d4/D4_04_INGRESS_CONTRACT_DELTA.md` |
| 8 | **AD-16** | **AUTHORIZE NAMESPACE + COLLISION DETECTION** — market-data fields must be namespaced; collision detection before merge; no silent overwrite. **Exact token NOT yet approved** | `docs/d4/D4_07_FIELD_NAMESPACE.md` |
| 9 | **AD-12** | **RETIRE G2** — use `EngineApiAdapter` + existing product transport contracts; do not invent G2 | `docs/d4/D4_09_P12_CONTRACT_DELTA.md` |
| 10 | **AD-9** | **GOVERNED SCREENER CONTRACT** must be governed/certified **before** UI05 implementation | `docs/d4/D4_09_…md` §K.2.3 |
| 11 | **AD-8** | **IES-016 / IES-017 / IES-020 ARE CERTIFIED** as part of the 13-engine E2E-030 delta; D3's contrary conclusion is superseded | `docs/d4/D4_08_ENGINE_INTEGRATION.md` |
| 12 | **AD-11** | **AUTHORIZE** `DataGovernanceRuntime.classify()` as the D09 governance mechanism; M-6 retention limitation remains | `docs/d4/D4_02_DATA_DOMAINS.md` |
| 13 | **AD-13** | **IN SCOPE** — five additional surfaces: CrossSectorIntelligence, EvidenceExplorer, ReplayExplorer, EngineRegistry, AiAdvisory | `docs/d4/D4_03_UI_BASELINE.md` |
| 14 | **AD-14** | **AUTHORIZE CORRECTIONS** — D4 may specify the tracker corrections; **the tracker has not been modified** | `docs/d4/D4_13_TRACKER_CORRECTIONS.md` |

**All 14 recorded unchanged. None re-litigated.**

---

## 2. ADR decisions

| ID | Decision | Status | Source artifact |
|---|---|---|---|
| **ADR-01** | Market-Data Field Namespace + Collision Guard | **APPROVED** (Sai/Ramki) | `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md`; `docs/d8/D8_AUTHORITY_RECONCILIATION.md` §B |
| **ADR-01-A1** | Exact namespace token | **APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING** — `MD:<domain>.<field>` remains an illustrative recommendation, **not** a final token | `docs/d5/ADR-01_…md` §C.1 lines 89/98/99/203; `docs/d8/D8_EVIDENCE_NOTES.md` EN-03 |
| **ADR-01-A2** | Fail-closed pre-merge collision detection in `DataBoundExecutor`, rules C1–C6 | **APPROVED** | `docs/d5/ADR-01_…md` §C.2 |
| **ADR-02** | Replay identity extension — additive `contributingData[]`; `data-*` and `SNAP_*` both preserved; inert when empty | **APPROVED** | `docs/d5/ADR-02_REPLAY_IDENTITY_EXTENSION.md` |
| **AD-17 / M-2** | ReplayService literal-return semantics | **UNRESOLVED** — explicitly **not** resolved by ADR-02 approval; existing-IIPS authority | `docs/d5/ADR-02_…md` §F; `docs/d8/D8_EVIDENCE_NOTES.md` EN-04 |

---

## 3. Program-authority decision of record

| Field | Content |
|---|---|
| **Decision** | *"consider this as decision approved by Sai/Ramki to move forward"* |
| **Interpreted as** | Sai/Ramki approval to proceed with the pending authority decisions and execution sequence |
| **Applies to** | ADR-01 (A1, A2), ADR-02, A1, A2, A3, A4 clearance, OI-10 authority hold |
| **Does NOT apply to** | AD-17 (never placed before Sai/Ramki) · M-1/AD-4 (existing-IIPS, AD-10) · M-5 · M-6 |
| **Does NOT confer** | Certification · gate acceptance · production activation · a namespace token string |
| **Recorded by** | `docs/d8/D8_AUTHORITY_RECONCILIATION.md` §0, `docs/d8/D8_EVIDENCE_NOTES.md` EN-01 |

---

## 4. D8 authorization state

| Field | Value | Source |
|---|---|---|
| `program_status` | **`AUTHORIZED_TO_PROCEED`** | `docs/d8/D8_STATUS.json` |
| `implementation_status` | **`AUTHORIZED_TO_PROCEED`** — executable now: **P00 only** | `docs/d8/D8_STATUS.json` |
| `certification_status` | **`NONE_GRANTED`** | `docs/d8/D8_STATUS.json` |
| `formal_gate_status` | **`NONE_ACCEPTED`** (0 of 18) | `docs/d8/D8_STATUS.json` |
| `production_activation_status` | **`NOT_AUTHORIZED`** | `docs/d8/D8_STATUS.json` |
| First work package | **WP-P00-01 — Governance Baseline Establishment** | `docs/d8/D8_FIRST_WORK_PACKAGE.md` |
| Phases still blocked | **P15, P16, P17** (M-1/AD-4) | `docs/d8/D8_AUTHORITY_RECONCILIATION.md` §E |

---

## 5. Decision-log rules going forward

1. Entries are **append-only**. Superseding a decision requires a new entry citing the prior one.
2. Every entry cites its source artifact.
3. No entry may alter the meaning of a G-A decision.
4. Authority approval is **never** recorded as certification or gate acceptance.
5. An open item is not resolved by being recorded.

---

## 6. D9 — P05 entry / explicit authorization decision (appended 2026-09-09)

> **Append-only entry per rule 1.** It **cites and supersedes as to current state** the §3
> program-authority decision of record and the §4 D8 authorization state — **both are left
> unedited above as the record of their own moment.** No entry above is altered, re-litigated or
> reinterpreted.

| Field | Content |
|---|---|
| **ID** | **D9-AUTH-P05-ENTRY** |
| **Decision** | **P05 — Market Data Acquisition & Ingestion is ENTERED / AUTHORIZED.** |
| **Authority** | **Sai/Ramki** — program owner of record (§3 convention: *"consider this as decision approved by Sai/Ramki to move forward"*). ⚠ No individual beyond the established authority of record is named or inferred; **A1–A4 remain `person_named: false`**; **A3 gate acceptor remains UNKNOWN** |
| **Decision date** | **2026-09-09** · recorded `2026-09-09T12:29:00Z` (Asia/Calcutta `17:59:00+0530`) |
| **Recorded against baseline** | **`efe33eae287d2181cfdd5a838b0d9e5112fcdad3`** — *"CHECKPOINT-03: post-P04 / OI-10 resolved / pre-P05 boundary"* (tree `a11ea8646b9025c2fe58ca7466bb910e7dc5fdef`) |
| **Applies to** | P05 **entry/authorization only**, within the exact scope of `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` §3 — **A-1** P05-01 local deterministic feed (full acquisition work) · **A-2** P05-02 specification/adapter-contract only · **A-3** P05-03 specification/adapter-contract only |
| **Preconditions** | **15 of 15 PASS** — `docs/d9/D9_EVIDENCE_NOTES.md` |
| **Source artifacts** | `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` · `docs/d9/D9_STATUS.json` · `docs/d9/D9_EVIDENCE_NOTES.md` |
| **Cites / supersedes as to current state** | §3 program-authority decision of record · §4 D8 authorization state (`implementation_status`: *"executable now: P00 only"*) · `docs/CHECKPOINT-03.md` §5.2/§6 P05 row · `docs/PROGRAM_STATE.md` §4 |
| **Does NOT apply to** | **AD-17 / M-2** · **M-1 / AD-4** (existing-IIPS, AD-10) · **M-5** · **M-6** · **OI-P04-01** · **OI-P04-02** |
| **Does NOT confer** *(rule 4)* | **Gate acceptance** — P05 acceptance remains a separate future gate requiring a **named A3 acceptor** · **certification** — **C1–C12 remain `NONE_GRANTED`** · **production activation** — remains **`NOT_AUTHORIZED`** · **provider selection** · **credentials** · resolution of any open item |
| **Open items NOT resolved** *(rule 5)* | **OI-P04-04** FIGI sourcing/licensing/coverage — **OPEN** · **OI-P04-03** tenant/region governance attribute set — **OPEN**, bounded by **IB-1…IB-5**; ⚠ no attribute invented, inferred or defaulted · **OI-D9-01** domain-segment label vocabulary — **OPEN, newly recorded**; ⚠ **no label invented**. **OI-08, OI-09, OI-10 and ADR-01 C1–C6 are unaltered** |
| **Not authorized by this entry** | P05-02 live provider execution · P05-03 licensed/deeper historical acquisition · **P05-04 ingestion-orchestration build-out** · per-record tenant/region governance application · inventing the governance attribute set · inventing domain-segment labels · `<NS>` → `MD:` rewriting of accepted P01/P02 records · any P06/P07/P08 work · any modification of the tracker XLSX or SPEC DOCX |
| **Recording integrity** | All edits **additive**; **0** historical or accepted records rewritten; `CHECKPOINT-03.md` unmodified; `docs/d8/D8_STATUS.json` unmodified (immutable historical — stale by design); **0** executable/implementation files created; **no `P05_GATE_ACCEPTANCE.md`**; existing-IIPS untouched; **not pushed** |

### 6.1 Resulting authority state (by addition; §4 above left unedited)

| Field | Value |
|---|---|
| `program_status` | **`AUTHORIZED_TO_PROCEED`** *(unchanged)* |
| `p05_entry_authorization_status` | **`AUTHORIZED`** *(was `NOT_AUTHORIZED`)* |
| `p05_acceptance_status` | **`NOT_ACCEPTED`** *(unchanged)* |
| `formal_gate_status` | **5 of 18 accepted — P00, P01, P02, P03, P04**; P05–P17 **NOT ACCEPTED** |
| `certification_status` | **`NONE_GRANTED`** *(unchanged)* |
| `production_activation_status` | **`NOT_AUTHORIZED`** *(unchanged)* |
| Current machine-readable state | **`docs/d9/D9_STATUS.json`** — extends `docs/d8/D8_STATUS.json`, does **not** supersede or edit it |

---

## 7. A3 — P05 gate-acceptor designation (appended 2026-09-10)

> **Append-only entry per rule 1.** It **cites and supersedes as to current state** the §6 D9
> entry's *Authority* row (*"A3 gate acceptor remains UNKNOWN"*) and
> `docs/p00/P00_AUTHORITY_REGISTER.md` §4 A3 row (*"Person named? **NO**"*) — **both are left
> unedited as the record of their own moment.** No entry above is altered, re-litigated or
> reinterpreted. **No new governance instrument, directory or register was created**: this
> designation is recorded in the existing authoritative decision log, which is the location its
> own §5 rules provide for a new decision.

| Field | Content |
|---|---|
| **ID** | **A3-P05-GATE-ACCEPTOR-DESIGNATION** |
| **Decision** | **The A3 phase-gate acceptance authority for the P05 gate is DESIGNATED as Ramakrishnan V. S. (Ramki).** |
| **Nature of the act** | ⚠ **Designation of the person authorized to *perform* the P05 gate-acceptance decision. It is NOT the acceptance itself.** No acceptance act has occurred and none is recorded here. |
| **Designated person** | **Ramakrishnan V. S. (Ramki)** — program owner of record (§3 convention: *"consider this as decision approved by Sai/Ramki to move forward"*) |
| **Role designated** | **A3 — Phase-Gate Acceptance Authority**, scoped by this entry to the **P05 Acquisition gate**. ⚠ This entry does **not** designate **A1**, **A2** or **A4**, and does **not** constitute a standing per-phase assignment for **P06–P17** |
| **Designation date** | **2026-09-10** |
| **Recorded against baseline** | **`78839091c7d199a9c69ee583fd9702b151a49158`** — *"P05-01 evidence currency repair: regenerate evidence against current shared fixtures"* (parent `4b37b17`) |
| **Effect on the A3 blocker** | The **person-level** blocker is **cleared**. `BD-P05-01-09`, `BD-P05-02-10` and `BD-P05-03-09` each recorded the A3 gate acceptor as **UNKNOWN** and named it *"the only person-level hard blocker"*. Those records are **left unedited as the record of their own moment** and are superseded as to current state by this entry |
| **Source artifacts** | This entry · `docs/PROGRAM_STATE.md` §8 row `8i` |
| **Cites / supersedes as to current state** | §6 *Authority* row · `docs/p00/P00_AUTHORITY_REGISTER.md` §4 A3 row · `docs/d9/D9_STATUS.json` `authority_of_record.a3_gate_acceptor: "UNKNOWN"` and `a1_a4_person_named: false` · `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md:227-228` · `docs/p05/P05_01_EVIDENCE.md:265` · `docs/p05/P05_01_OPEN_ITEMS.md:112` · `docs/p05/P05_02_EVIDENCE.md:266` · `docs/p05/P05_02_OPEN_ITEMS.md:83` · `docs/p05/P05_02_SPECIFICATION.md:449` · `docs/p05/P05_03_SPECIFICATION.md:231` · `docs/p05/P05_03_OPEN_ITEMS.md:39` |
| **Does NOT confer** *(rule 4)* | **P05 gate acceptance** — still requires a **separate explicit acceptance act** carrying the `P00_GATE_MODEL` minimum evidence · **certification** — **C1–C12 remain `NONE_GRANTED`** · **production activation** — **`NOT_AUTHORIZED`**, the **A4** control at **P16** only · **P05-04 authorization** — **D9 N-3 stands** |
| **Does NOT create** | **`P05_GATE_ACCEPTANCE.md`** — deliberately **NOT** created. It does not exist and must not exist until an acceptance act occurs |
| **Open items NOT resolved** *(rule 5)* | **OI-P04-04** OPEN · **OI-P04-03** OPEN · **DEP-P01-04** UNRESOLVED (a **P08** storage decision) · **BD-P05-03-01…08** and **BD-P05-03-10** OPEN · **M-1/AD-4** · **M-5** · **M-6** · **AD-17/M-2** · **DO-P04-1…5 / DO-1…DO-5** still deferred · **P16** licensing / credentials / entitlement |
| **Technical scope** | **NONE.** No methodology, contract, rule, canonical field key, lifecycle vocabulary, `snapshotId` composition, OI-08/OI-09/OI-10 decision, ADR-01 **C1–C6** rule or accepted **P00–P04** artifact is altered. **No `p05/src`, `p05/tests`, `p05/fixtures`, `p05/evidence`, `p05/evidence-p05-02` or `p05/evidence-p05-03` file is modified.** No provider selection, credential, network access or licensed-data work |
| **Recording integrity** | **2** files edited, both **additive**: this decision log (new §7 per rule 1) and `docs/PROGRAM_STATE.md` (new §8 row `8i`). **0** historical or accepted records rewritten |

### 7.1 Resulting authority state (by addition; §4 and §6.1 above left unedited)

| Field | Value |
|---|---|
| `program_status` | **`AUTHORIZED_TO_PROCEED`** *(unchanged)* |
| `p05_entry_authorization_status` | **`AUTHORIZED`** *(unchanged)* |
| `p05_acceptance_status` | **`NOT_ACCEPTED`** *(unchanged — a designation is not an acceptance)* |
| `a3_gate_acceptor` | **Ramakrishnan V. S. (Ramki)** *(was `UNKNOWN`)* |
| `a3_gate_acceptor_scope` | **`P05`** — P06–P17 acceptor assignment **not** made by this entry |
| `a1_person_named` / `a2_person_named` / `a4_person_named` | **`false`** *(unchanged — no other role designated or inferred)* |
| `p05_gate_acceptance_artifact_exists` | **`false`** *(unchanged)* |
| `formal_gate_status` | **5 of 18 accepted — P00, P01, P02, P03, P04**; P05–P17 **NOT ACCEPTED** *(unchanged)* |
| `certification_status` | **`NONE_GRANTED`** *(unchanged)* |
| `production_activation_status` | **`NOT_AUTHORIZED`** *(unchanged)* |
| `p05_04_status` | **`NOT_AUTHORIZED`** *(unchanged — D9 N-3)* |
| **What this designation now makes possible** | A **P05 acceptance-readiness assessment**, and thereafter an **explicit acceptance act** by the designated A3 acceptor. ⚠ **Neither is performed by this entry.** |
