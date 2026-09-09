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
