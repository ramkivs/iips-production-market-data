# P02 — EVIDENCE AND TRACEABILITY

Conforms to `docs/p00/P00_EVIDENCE_CONVENTIONS.md`: repository + path, line/section, **pinned
commit**, artifact identity. No evidence is invented; gaps are recorded as gaps.

---

## 1. Pinned commits and checksums

| Repository / artifact | Pin | Role |
|---|---|---|
| `iips-production-market-data` | `d29ad2fa4dac37180a1437eb2d29832372a6f205` | CHECKPOINT-01 recovery baseline |
| `iips-production-market-data` | `94ee5333c67f517577f2ce306133ff3893639575` | P00 gate acceptance |
| `iips-production-market-data` | `547de1bf411aeab19b186be43f7a4dcee0857ff5` | P01 package (ACCEPTED) |
| `iips-production-market-data` | `7c4614146af98b914c786ea8c1d25699c55d7ec9` | P01 gate acceptance |
| `iips-review-recovered` | `5decdca` | Existing-IIPS baseline — **read-only** |
| TRACKER `.xlsx` | `f0bd7b970c445f0a06e793256456231f` | Read-only |
| SPEC `.docx` | `7b7ea4f1acc35f3209123efd3fbd9b11` | Read-only |

## 2. Traceability matrix

| P02 artifact / section | Source evidence | Pin |
|---|---|---|
| Abstraction contract §2 boundary | `docs/d4/D4_04_INGRESS_CONTRACT_DELTA.md` §F.1, §F.4 (AD-2; adapters replaceable behind `MarketDataSource<T>`, NFR-06) | `d29ad2f` |
| Contract §3.2 acquisition obligations | `docs/d4/D4_04` §F.4 (acquisition, PIT, degraded-state, entitlement additive capabilities) | `d29ad2f` |
| Contract §3.3 / mapping §1 no-leakage | `docs/d4/D4_04` §F.7 rule 2 (NFR-06, INT-004); `docs/d4/D4_09_P12_CONTRACT_DELTA.md:60` | `d29ad2f` |
| Contract §4 determinism | `docs/d4/D4_04` §F.4 (deterministic snapshot construction), §F.7 rule 1 | `d29ad2f` |
| Contract §6 snapshot production | `docs/p01/P01_DATA_CONTRACT.md` §3.1, §9; `docs/d4/D4_06_SNAPSHOT_REPLAY_IDENTITY.md` §H.2 (AD-6) | `547de1b` / `d29ad2f` |
| Contract §6 S-4 contributing data | `docs/d5/ADR-02_REPLAY_IDENTITY_EXTENSION.md`; `docs/d4/D4_06` §H.3 | `d29ad2f` |
| Contract §7 OI-10 blocker | `docs/d4/D4_07_FIELD_NAMESPACE.md` §I.3; `docs/p00/P00_OPEN_ITEMS_REGISTER.md` OI-10 | `d29ad2f` |
| Capability model §1 domains | `docs/d4/D4_02_DATA_DOMAINS.md` §D.1 (D01–D10) | `d29ad2f` |
| Capability model §1 fields | `docs/p01/P01_FIELD_DICTIONARY.md` | `547de1b` |
| Capability model §4 PIT | `docs/p01/P01_DATA_CONTRACT.md` §10; `docs/d4/D4_04` §F.4 | `547de1b` / `d29ad2f` |
| Capability model §5 revisions/corp actions | `docs/d4/D4_02` §D.5, §D.8, §D.9 | `d29ad2f` |
| Capability model §7 rubric | TRACKER `Work Tracker!P02-03` (*"Provider evaluation rubric"*) | `f0bd7b97…` |
| Identity/versioning §1 | `docs/d4/D4_04` §F.2 (provider stable across adapter swaps; never leaked) | `d29ad2f` |
| Identity/versioning §2.1 six axes | `docs/p01/P01_VERSIONING_COMPATIBILITY.md` §1 (four axes) + P02 additions | `547de1b` |
| Identity/versioning §4 | `docs/d4/D4_06` §H.2 (dual-layer AD-6) | `d29ad2f` |
| Entitlement model | TRACKER `Work Tracker!P02-02` (*"Entitlement model"*, deps `P00-04,P02-01`, Governance); `docs/d4/D4_04` §F.4 (entitlement boundary) | `f0bd7b97…` / `d29ad2f` |
| Entitlement §4 AD-11 / M-6 | `docs/d4/D4_02` §D.10 (`isWithinRetention()` stub; must NOT be silently fixed) | `d29ad2f` |
| Entitlement §3 fail-closed | `docs/d4/D4_04` §F.4 (entitlement failure is an explicit classified state, not an empty success) | `d29ad2f` |
| Error taxonomy §2 / §4 | `docs/d4/D4_04` §F.4 (degraded-state semantics; NFR-04); `docs/p01/P01_VALIDATION_RULES.md` §7–8 | `d29ad2f` / `547de1b` |
| Error taxonomy §6 | `docs/p01/P01_VALIDATION_RULES.md` §1 (five stages) | `547de1b` |
| Mapping rules §2 | `docs/p01/P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1–6; `P01_VALIDATION_RULES.md` §4 | `547de1b` |
| Mapping rules §3 identity | `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md` §G (AD-1); `docs/p01/P01_IDENTITY_AND_LINEAGE.md` §1 | `d29ad2f` / `547de1b` |
| Mapping rules §4 namespace | `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md`; `docs/d4/D4_07` §I.2 | `d29ad2f` |
| Compatibility §3 | `docs/p01/P01_VERSIONING_COMPATIBILITY.md` §4–5 (BC/FC rules) | `547de1b` |
| Compatibility §5 substitution | `docs/d4/D4_04` §F.2 (`provider` stable across adapter swaps for lineage continuity) | `d29ad2f` |
| Observability §5 PB-4 | `docs/d4/D4_06` §H.6 item 4 (UI17 must not present literals as verified reproduction) | `d29ad2f` |
| Dependency register | `docs/p00/P00_OPEN_ITEMS_REGISTER.md`; `docs/d8/D8_STATUS.json`; `docs/p01/P01_DEPENDENCY_REGISTER.md` | `d29ad2f` / `547de1b` |
| Deferral justification | `docs/d4/D4_12_PHASE_SEQUENCE.md` §N.2 (P02 **SPEC-READY**; standing implementation prohibition) | `d29ad2f` |
| Gate name and rule | TRACKER `Phase Gates!P02` — *Provider abstraction/entitlement gate*; *"Explicit gate acceptance; no automatic promotion"* | `f0bd7b97…` |
| Authority state | `docs/p01/P01_GATE_ACCEPTANCE.md` §5 | `7c46141` |

## 3. Artifact-set reconciliation with the tracker

| Tracker P02 row | Deliverable | Covered by |
|---|---|---|
| `P02-01` Provider adapter interface | *Provider SPI/interface*; *Provider adapter contract* | `P02_PROVIDER_ABSTRACTION_CONTRACT.md`; `P02_PROVIDER_CAPABILITY_MODEL.md`; `P02_PROVIDER_MAPPING_RULES.md` (executable SPI **deferred — DEP-P02-08**) |
| `P02-02` Entitlement/licensing model | *Entitlement model*; *Entitlement matrix* | `P02_ENTITLEMENT_MODEL.md` (matrix structure §5; **necessarily empty — DEP-P02-10**) |
| `P02-03` Provider selection criteria | *Provider evaluation rubric* | `P02_PROVIDER_CAPABILITY_MODEL.md` §7 (no candidate evaluated — **DEP-P02-07**) |

**Deviation recorded:** the tracker names *"Contract test suite"* as the `P02-01` validation
method and *"two implementations can conform"* as its acceptance criterion. Both are executable
artifacts; P02 is **SPEC-READY** under the standing implementation prohibition
(`D4_12_PHASE_SEQUENCE.md` §N.2). They are recorded as **DEP-P02-08 / DEP-P02-09** and **not
produced**. No other deviation exists; the nine artifacts requested by the work order are a
superset of the three tracker deliverables.

## 4. Open-item impact matrix

| Item | State after P02 | Impact | Resolved by P02? |
|---|---|---|---|
| OI-10 | **`APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING`** | Literal keys / mechanical C1-C2 blocked (DEP-P02-01); everything else structural | **NO** |
| OI-08 | **OPEN** | Cardinality unconstrained | **NO** |
| OI-09 | **OPEN** | `identifierInputs[]` unconstrained; blocks identity comparison in selection | **NO** |
| AD-17 | **UNRESOLVED** | Adapter-determinism replay is a distinct concern; `ReplayService` untouched | **NO** |
| M-1 | **`OPEN_REVALIDATION_REQUIRED`** | E2E-030 NOT REVOKED / NOT RENEWED | **NO** |
| M-5 | **OPEN** | Entitlement must not presume a working auth substrate | **NO** |
| M-6 | **OPEN** | Retention controls unenforceable (DEP-P02-03) | **NO** |
| OI-05 | **OPEN** | D09 entitlement unfinalizable (DEP-P02-02) | **NO** |
| OI-06 / CD-01 / AD-9 / P10 coverage | **OPEN** | No P02 impact beyond citation pinning | **NO** |

## 5. Integrity and boundary verification

| Check | Result |
|---|---|
| `iips-review-recovered` modified | **NO** — read-only clone at `/tmp/iipsrev`, outside the workspace, clean at `5decdca` |
| Existing-IIPS source / tests / methodology / certification | **NO — none exists in this workspace** |
| 13 engines · scoring · calibration · taxonomy · Auto Option-A · Materials G1–G6 · Telecom D16 | **NO** |
| `LiveDataRuntime.ts` · `DataBoundExecutor` · `ReplayService` · E2E-030 · `PROGRAM_v1.1_REPLAY_BASELINE.json` | **NO** |
| `docs/d4/` `docs/d5/` `docs/d7/` `docs/d8/` | **NO — unchanged** |
| `docs/p00/` | **NO — unchanged** |
| **`docs/p01/` accepted package** | **NO — unchanged, all nine checksums match** |
| Tracker XLSX / SPEC DOCX | **NO — byte-unchanged** |
| Provider named, selected, contacted or implemented | **NO** |
| Acquisition performed | **NO** |
| **Credentials / secrets / keys / tokens / endpoints introduced** | **NO — scan clean** |
| Executable source produced (`.ts`/`.tsx`/`.js`) | **NO — none exists anywhere in the repository** |
| P03 / P04 / P05 implementation started | **NO** |
| `docs/p03` present | **NO** |
| Certification granted | **NO — `NONE_GRANTED`** |
| Production activation | **NO — `NOT_AUTHORIZED`** |
| New data domain invented | **NO — D01–D10 only** |

## 6. Artifact inventory and checksums

| # | Artifact | MD5 | Lines |
|---|---|---|---|
| 1 | `docs/p02/P02_COMPATIBILITY_AND_SUBSTITUTION.md` | `b826c4d6ec302b98395b7193d6c64523` | 140 |
| 2 | `docs/p02/P02_DEPENDENCY_REGISTER.md` | `5bee8cd9d630b2b2f644b25ab25eeda0` | 78 |
| 3 | `docs/p02/P02_ENTITLEMENT_MODEL.md` | `0cbb84002e84f6c58df3f85704e1e919` | 143 |
| 4 | `docs/p02/P02_ERROR_TAXONOMY.md` | `fcdde0c4274f4e9fd25f5cc2ff66eab4` | 143 |
| 5 | `docs/p02/P02_OBSERVABILITY_REQUIREMENTS.md` | `c19262a273069acbdf71c4e947a016fb` | 99 |
| 6 | `docs/p02/P02_PROVIDER_ABSTRACTION_CONTRACT.md` | `6e339d060fe6a717994201aca8a1f4f2` | 202 |
| 7 | `docs/p02/P02_PROVIDER_CAPABILITY_MODEL.md` | `b4dad33cb4072ed0dc573c0f4febdf3d` | 153 |
| 8 | `docs/p02/P02_PROVIDER_IDENTITY_VERSIONING.md` | `075f0b083d92ef2c52d80193a7277df1` | 100 |
| 9 | `docs/p02/P02_PROVIDER_MAPPING_RULES.md` | `b5fed5cbe7ef5f94930f8790a8dff24e` | 150 |
| 10 | `docs/p02/P02_EVIDENCE.md` | *(this file — self-referential)* | — |

## 7. Gate position

P02 is **NOT accepted** by this package.
Gate: **P02 — Provider abstraction/entitlement gate**.
Gate rule (TRACKER `Phase Gates!P02`): **"Explicit gate acceptance; no automatic promotion."**
