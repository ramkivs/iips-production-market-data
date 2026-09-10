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

---

## 8. D10 — P05-04 authorization + P06 entry / explicit authorization + P06 A3 designation + `DataBoundExecutor` C1–C6 execution (appended 2026-09-10)

> **Append-only entry per §5 rule 1.** It **cites and supersedes as to current state only**:
> §6 **D9** row **N-3** (*"P05-04 ingestion orchestration build-out … requires a further explicit
> act"*) · §6 *Open items NOT resolved* · §7 *Role designated* and §7.1 `a3_gate_acceptor_scope`
> (**`P05`**) — **all of which are left unedited as the record of their own moment.** No entry
> above is altered, re-litigated or reinterpreted. **No new governance instrument, directory or
> register was created**: this authorization is recorded in the existing authoritative decision
> log, which is the location §5 rules provide for a new decision. **No `docs/p06/` directory,
> artifact or acceptance record is created by this entry.**

| Field | Content |
|---|---|
| **ID** | **D10-P05-04-AUTHORIZATION + D10-P06-ENTRY-AUTHORIZATION + A3-P06-GATE-ACCEPTOR-DESIGNATION + ADR-01-A2-EXECUTION-AUTHORIZATION** |
| **Authority** | **Ramki** — program owner of record (§3 convention: *"consider this as decision approved by Sai/Ramki to move forward"*). ⚠ No individual beyond the established authority of record is named or inferred |
| **Recorded against baseline** | **`19713d8b32abae3292a7b0208cd826fc1464f42b`** — *"P05 GATE ACCEPTED: Acquisition gate (6 of 18) — explicit A3 act"* (parent `cdc6844`) |
| **Prior state** | **P05 ACCEPTED (6 of 18)** · **P05-04 `NOT_AUTHORIZED`** (D9 **N-3**) · **P06 NOT AUTHORIZED** (D9 §5 exclusion **5**; `P05_GATE_ACCEPTANCE.md` **NA-8**) · **P06 A3 acceptor NOT DESIGNATED** (§7.1 `a3_gate_acceptor_scope` = `P05`) |

### 8.1 Decisions taken by this act

| # | Decision | Scope and limit |
|---|---|---|
| **D10-1** | # **P05-04 — ingestion orchestration — is AUTHORIZED.** | Scheduling · retry **execution** · idempotent checkpointing · the tracker *Work Tracker*!P05-04 exit criterion *"Replay does not duplicate data"* with *failure/replay tests* and *run logs*. ⚠ This is the *"further explicit act"* D9 **N-3** required. ⚠ **It does NOT retroactively create P05-04 completion evidence** — `P05_GATE_ACCEPTANCE.md` **R-13/R-14** (*"NO COMPLETION EVIDENCE"*) remain **historically true and unedited**, and **C-4 remains `NO EVIDENCE EXISTS`** until the work is performed and evidenced |
| **D10-2** | # **P06 ENTRY is AUTHORIZED.** | ⚠ **Scope = `P06-01`, `P06-02`, `P06-03` ONLY** — normalization pipeline · raw/canonical separation · deduplication/idempotency. **No other P06 work item exists in the accepted tracker and none is invented.** ⚠ Entry/authorization **only** — see **D10-6** |
| **D10-3** | # **A3 phase-gate acceptance authority for the P06 gate is DESIGNATED as Ramakrishnan V. S. (Ramki).** | ⚠ **Scoped to the P06 gate only.** It does **not** extend the §7 P05 designation, does **not** designate **A1**, **A2** or **A4**, and does **not** constitute a standing per-phase assignment for **P07–P17**. ⚠ **Designation ≠ acceptance** — no P06 acceptance act has occurred and none is recorded here. ⚠ **No prior explicit P06 designation was discovered** in the accepted corpus at the time of this act; no different person is invented |
| **D10-4** | # **Execution of the C1–C6 fail-closed collision guard in the existing certified `DataBoundExecutor` is AUTHORIZED**, within the existing ADR-01 / D8 boundary. | **Authority basis: `docs/d8/D8_AUTHORITY_RECONCILIATION.md`:35 — *"`ADR-01-A2` collision guard … **APPROVED — fail-closed** … Rules C1–C6 **as written in ADR-01; no variation authorized**"*, and §B:69 — *"**Authority hold: CLEARED.** ADR-01 is approved by Sai/Ramki"*, together with `docs/p00/P00_AUTHORITY_REGISTER.md`:27 — *"Namespace + collision guard **authorized for execution in P05/P06/P11**"*, and ADR-01 §H — *"**NAMED AUTHORITY REQUIRED — Ramki / Sai**"*. ⚠ **The C1–C6 design is preserved EXACTLY as written in ADR-01 §C.2 — C1 namespace partition · C2 reverse partition · C3 intersection · C4 cross-snapshot · C5 fail-closed abort · C6 deterministic merge order — and the §C.3 error semantics. NO METHODOLOGY VARIATION IS AUTHORIZED** (D8:35 *"no variation authorized"*) |
| **D10-5** | ⚠ **ADR-01 authority reconciliation — by citation, not by edit.** `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md`:4, :16, :200 and :207 still read **`PENDING RAMKI/SAI ADR`** and *"**Blocks:** P05 Acquisition, **P06 Normalization**, P11 Engine Integration."* ⚠ **Those are historical records of the ADR's own moment and are LEFT UNEDITED.** The **controlling current authority is D8** (`D8_AUTHORITY_RECONCILIATION.md`:33/:35/§B:69). This act relies on D8 and **does not rewrite ADR-01** |
| **D10-6** | # ⚠ **P06 AUTHORIZATION IS NOT P06 ACCEPTANCE.** | *"Explicit gate acceptance; no automatic promotion."* (`P00_GATE_MODEL.md`:4). P06 acceptance remains a **separate future act** by the designated A3 acceptor, carrying the `P00_GATE_MODEL.md`:42 minimum evidence — ***"Token recorded; C1–C6 collision guard evidence; 13-engine oracle byte-identity."*** ⚠ **No `P06_GATE_ACCEPTANCE.md` is created by this entry, and it must not exist until an acceptance act occurs** |

### 8.2 ⚠ Explicitly NOT authorized, NOT granted and NOT resolved by this act

| # | Not authorized / not granted | Preserved authority |
|---|---|---|
| **1** | ⚠ **P05-02 live provider execution** — **`NOT_AUTHORIZED`** | D9 **N-1** |
| **2** | ⚠ **Licensed / deeper historical data acquisition** — **`NOT_AUTHORIZED`** | D9 **N-2** |
| **3** | ⚠ **Provider selection, entitlement grant, credentials, connectivity** — none selected, granted, provisioned or implied | INV-10 (entitlement matrix **EMPTY**); P03 accepted as **specification only** |
| **4** | ⚠ **Production activation** — **`NOT_AUTHORIZED`** | **A4** control, exercised at **P16 only**; P15 **BLOCKED** on **M-1/AD-4** |
| **5** | ⚠ **Track B → `origin/main` merge** — **`NOT AUTHORIZED`** | ⚠ **No accepted artifact authorizes it.** `INCIDENT-02_SANDBOX_RECLONE.md`:163 **L-1** records that the INCIDENT-01 mitigation **did not hold**; `:166` **L-4** is a **recommendation to program authority, not an authorization**. `origin/main` remains `eae2ff6937b257883433348560ae92f5485629e5` |
| **6** | ⚠ **Any certification** — **`NONE_GRANTED`**. **Authority authorization is never certification** | §5 rule **4**; `P00_GATE_MODEL.md`:65; **C1–C12** remain future acts; **A2** remains `person_named: false` |
| **7** | ⚠ **P06 gate acceptance** — **NOT ACCEPTED**; still **6 of 18** | §5 rule 4; **D10-6** |
| **8** | ⚠ **P07, P08 or any P09–P17 entry or promotion** | D9 §5 exclusion **5** remains binding for those phases |
| **9** | ⚠ **Existing-IIPS modification outside the approved ADR-01 boundary** — `ReplayService`, `LiveDataRuntime.ts`, methodology, scoring, calibration, taxonomy, `NormalizedHolding`/`companyId`, CSIP | D8 §1.2; D9 §4 constraints **12–15**; **AD-17 remains UNRESOLVED** |
| **10** | ⚠ **Resolution of OI-P04-03, OI-P04-04, DEP-P01-04, OI-D9-01, M-1/AD-4, M-5, M-6, AD-17/M-2, DO-P04-1…5 / DO-1…DO-5** | §5 rule 5 — an open item is not resolved by being recorded |
| **11** | ⚠ **Any variation of C1–C6, or any precedence / "last wins" / coercion / silent-overwrite behaviour** | ADR-01 §C.2 **C5 fail-closed**, §C.3 *"Prohibited"*; D8:35 *"no variation authorized"* |
| **12** | ⚠ **Any P06 implementation artifact, evidence file or fixture** — **none is created by this entry** | This is an **authorization/entry act only** |

### 8.3 Resulting authority state (by addition; §4, §6.1 and §7.1 above left unedited)

| Field | Value |
|---|---|
| `program_status` | **`AUTHORIZED_TO_PROCEED`** *(unchanged)* |
| `p05_acceptance_status` | **`ACCEPTED`** — by `docs/p05/P05_GATE_ACCEPTANCE.md` *(unchanged by this act)* |
| `p05_04_status` | **`AUTHORIZED`** *(was `NOT_AUTHORIZED` — D9 N-3)* — **no completion evidence yet** |
| `p06_entry_authorization_status` | **`AUTHORIZED`** *(was `NOT_AUTHORIZED`)* — scope **P06-01 / P06-02 / P06-03** only |
| `p06_acceptance_status` | **`NOT_ACCEPTED`** — **no `P06_GATE_ACCEPTANCE.md` exists or is created** |
| `a3_gate_acceptor` | **Ramakrishnan V. S. (Ramki)** *(unchanged as to person)* |
| `a3_gate_acceptor_scope` | **`P05, P06`** *(was `P05`)* — ⚠ **P07–P17 acceptor assignment NOT made by this entry** |
| `a1_person_named` / `a2_person_named` / `a4_person_named` | **`false`** *(unchanged — no other role designated or inferred)* |
| `adr_01_a2_execution` | **`AUTHORIZED`** — C1–C6 in `DataBoundExecutor`, **as written, no variation** |
| `certification_status` | **`NONE_GRANTED`** *(unchanged — C12 BLOCKED on M-5)* |
| `production_activation_status` | **`NOT_AUTHORIZED`** *(unchanged — A4 at P16 only)* |
| `track_b_to_main_merge` | **`NOT_AUTHORIZED`** *(unchanged)* |
| `formal_gate_status` | **6 of 18 accepted — P00, P01, P02, P03, P04, P05** *(unchanged — this act accepts no gate)* |
| **What this act now makes possible** | P05-04 implementation and evidence · P06-01/P06-02/P06-03 specification and implementation within the boundaries above · production of the ADR-01 §G evidence (**13-engine oracle byte-identity**, fail-closed negatives, determinism) · and thereafter a **separate explicit P06 acceptance act**. ⚠ **None of these is performed by this entry** |
| **Technical scope** | **NONE.** No methodology, contract, rule, canonical field key, lifecycle vocabulary, `snapshotId` composition, OI-08/OI-09/OI-10 decision, ADR-01 **C1–C6** rule or accepted **P00–P05** artifact is altered. **No `p05/src`, `p05/tests`, `p05/fixtures` or `p05/evidence*` behaviour is changed. No `docs/p06/` artifact is created. No implementation is performed** |
| **Recording integrity** | Files edited by this act: this decision log (new §8 per rule 1) · `docs/PROGRAM_STATE.md` (additive current-state) · `docs/p00/P00_GATE_MODEL.md` (**current-state ledger cell only** — the stale P06 *"Impl. permitted now?"* value; gate intent, minimum evidence and the six acceptance requirements untouched) · the governance guard in `p05/tests`. **0** historical or accepted records rewritten |
