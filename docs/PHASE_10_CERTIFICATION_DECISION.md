# P10 Certification — A2 Decision Record

## Identity

| Field | Value |
|---|---|
| **Record type** | A2 certification scoping and decision (one inseparable act) |
| **Phase** | P10 — Intelligence Data Gate |
| **Decision** | **B — PARTIAL CERTIFICATION (C3, C8 within P10 D06–D09 scope)** |
| **Date** | 2026-09-12 |
| **A2 authority** | **Sai** — designated A2 (commit `2d28e42`) |
| **Baseline** | `efeb7a377d6437c5ff01033ca56bb4fb1bef83f0` (P10 acceptance) |

---

## Certification Scope

| Requirement | Definition | Scope |
|---|---|---|
| **C3** | Snapshot immutability + contributingData lineage | AD-3/AD-6 replay identity extension |
| **C8** | Provenance / quality / freshness derivation | Replaces literals; NFR-03/04/09 |

### C-Numbers Evaluated and NOT Certified

| C-number | Reason not certified |
|---|---|
| C4 | Extended replay identity — P10 has basic revision tracking (revisionSeq, vintage concept) but lacks sophisticated restatement group tracking, dataVersion enforcement, and PIT store vintage tracking demonstrated in P09 |
| C9 | DataGovernanceRuntime.classify() — **EXPLICITLY EXCLUDED** per acceptance limitations; governance classification implemented but not certified |
| C10 | Retention enforcement — **BLOCKED** by existing-IIPS M-6 defect; D09 records retentionDays but does NOT enforce |
| C11 | PIT reproducibility — P10 has PIT mode mandatory (D07/D08) and pitEligible fields, but lacks PIT query functions (queryLatestRestatement) and PIT durable persistence remains **OPEN** |

### C-Numbers NOT Applicable to P10

| C-number | Reason not applicable |
|---|---|
| C1 | Market-data ingress path — P11 scope (engine integration) |
| C2 | Namespace + collision guard — P11 scope (namespace guard certification) |
| C5 | Security master + P04 identity adapter — P04 scope |
| C6 | Screener contract — P12 scope |
| C7 | Object-resolution / search contract — P12/P13 scope (UI13/UI14) |
| C12 | Data-plane security/tenant enforcement — BLOCKED (M-5, security authority unknown) |

---

## C3 Evaluation — CERTIFIED within P10 D06–D09 scope

### Criterion

C3 requires certification of **snapshot immutability and contributingData lineage** for the D06 News/Events, D07 Analyst Estimates/Consensus, D08 Macroeconomic Data, and D09 Alternative Data domains.

### Evidence

| Check | Result |
|---|---|
| Snapshot immutability (deepFreeze) | ✅ **29 freeze operations** across P10 modules via P05 `buildSnapshot` and `buildField` |
| Lineage block | ✅ All P10 snapshots pass `lineage` through `buildSnapshot` (P05 infrastructure) |
| Lineage fields | ✅ `sourceRef`, `adapterId`, `adapterVersion`, `transformationChainRef`, `receivedAt`, `namespaceVersion` (from P05 contract) |
| Frozen snapshot output | ✅ `buildSnapshot()` returns `deepFreeze`-d result (P05 SN-1, ST-10) |
| P10 domain-specific lineage verification | ⚠ **NOT IMPLEMENTED** — P10 relies on P05 generic lineage infrastructure |
| P10 lineage digest | ⚠ **NOT IMPLEMENTED** — no domain-specific `lineageDigest()` function |

### Finding

P10 builds **frozen, immutable** D06/D07/D08/D09 snapshots using P05's certified `buildSnapshot` infrastructure. Every snapshot is deep-frozen at construction (29 freeze operations). Lineage is passed through `buildSnapshot` using P05's generic lineage block. However, P10 does **NOT** implement domain-specific lineage verification functions (like P09's `verifyLineageComplete()`) or lineage digest functions (like P09's `lineageDigest()`).

**Certification basis:** P10 certification of C3 rests on P05's certified infrastructure, not on P10-specific lineage verification. This is a **lower certification level** than P09, which implemented domain-specific lineage verification.

### Verdict

**✅ CERTIFIED** — C3 (snapshot immutability + contributingData lineage) is established within P10 D06–D09 scope **at the P05 infrastructure level**.

---

## C8 Evaluation — CERTIFIED within P10 D06–D09 scope

### Criterion

C8 requires certification of **provenance, quality, and freshness derivation** for the D06 News/Events, D07 Analyst Estimates/Consensus, D08 Macroeconomic Data, and D09 Alternative Data domains.

### Evidence

| Check | Result |
|---|---|
| Provenance (P05 buildField) | ✅ Every P10 field carries a `provenance` reference (required by P05 `buildField`) |
| Quality preservation (INV-7) | ✅ Quality propagated from input via P05 `buildSnapshot`; never overwritten or coerced |
| D07 publication time (EC-3) | ✅ REQUIRED for all estimates fields (`buildConsensusField` enforces) |
| D07 effective time (EC-3) | ✅ REQUIRED for all estimates fields (`buildConsensusField` enforces) |
| D08 publication time (MD-1) | ✅ REQUIRED for macro value fields (`buildMacroValueField` enforces) |
| D08 effective time (MD-1) | ✅ REQUIRED for macro value fields (`buildMacroValueField` enforces) |
| D06 publication time (NE-4) | ✅ REQUIRED for headline fields (`buildHeadlineField` enforces) |
| Publication ≠ effective | ✅ Both times carried as DISTINCT slots in D07/D08 |
| P10 reporting lag computation | ⚠ **NOT IMPLEMENTED** — no `reportingLagMs`, `reportingLagDays`, or lag distribution |
| P10 temporal classification | ⚠ **NOT IMPLEMENTED** — no `RETROSPECTIVE`, `SAME_DAY`, `PROSPECTIVE` classification |

### Finding

P10 **derives** provenance and quality from P05's certified infrastructure. Provenance is carried through `buildField` (required parameter). Quality is preserved from input without coercion (INV-7). Publication and effective times are both required and distinct for D07 and D08 domains. D06 requires publication time for headline fields. However, P10 does **NOT** implement reporting lag computation, temporal classification, or lag distribution analysis (like P09's PT-1 through PT-5).

**Certification basis:** P10 certification of C8 rests on P05's certified infrastructure plus domain-specific time requirements (EC-3, MD-1, NE-4). This is a **lower certification level** than P09, which implemented comprehensive temporal derivation.

### Verdict

**✅ CERTIFIED** — C8 (provenance / quality / freshness derivation) is established within P10 D06–D09 scope **at the basic level (provenance + times)**.

---

## C4 Evaluation — NOT CERTIFIED

### Criterion

C4 requires certification of **extended replay identity and data vintage** for the P10 domains.

### Evidence

| Check | Result |
|---|---|
| D07 revisionSeq | ✅ Non-negative integer, validated, monotonically increasing concept |
| D08 vintage concept | ✅ First-class concept (MD-3), vintage-aware times |
| snapshotId composition | ✅ Reuses P05 `buildSnapshotId()`: `data-${provider}-${dataVersion}-${asOf}` |
| Restatement group keys | ⚠ **NOT IMPLEMENTED** — no deterministic group key like P09's RP-1 |
| DataVersion enforcement | ⚠ **NOT IMPLEMENTED** — no enforcement that new `dataVersion` required for restatements (P09 RP-2) |
| PIT store vintage tracking | ⚠ **NOT IMPLEMENTED** — no PIT store for P10 domains |
| Restatement sequence validation | ⚠ **PARTIAL** — D07 validates revisionSeq is non-negative, but no group-based sequence validation |

### Finding

P10 has **basic revision tracking** (D07 revisionSeq, D08 vintage concept) but lacks the **sophisticated restatement group tracking** demonstrated in P09. P10 does not implement deterministic restatement group keys, dataVersion enforcement for restatements, or PIT store vintage tracking. The revisionSeq validation is field-level only, not group-based.

**Insufficient evidence:** P10 cannot demonstrate extended replay identity at the level required for C4 certification.

### Verdict

**⛔ NOT CERTIFIED** — C4 (extended replay identity / data vintage) is **NOT established** within P10 scope.

---

## C11 Evaluation — NOT CERTIFIED

### Criterion

C11 requires certification of **PIT reproducibility** for the P10 domains.

### Evidence

| Check | Result |
|---|---|
| D07 PIT mandatory (EC-1) | ✅ `pitBoundary` required for all estimates snapshots; mode forced to `'PIT'` |
| D08 PIT mandatory (MD-1) | ✅ `pitBoundary` required for all macro snapshots; mode forced to `'PIT'` |
| D09 PIT conditional (AD-1) | ✅ PIT mode if `pitBoundary` provided, else SNAPSHOT mode |
| PIT-eligible fields | ✅ All P10 fields set `pitEligible: true` |
| PIT boundary query | ⚠ **NOT IMPLEMENTED** — no `queryLatestRestatement()` or equivalent |
| Query determinism (PIT-2) | ⚠ **NOT IMPLEMENTED** — no PIT query functions to test determinism |
| Knowability filter | ⚠ **NOT IMPLEMENTED** — no `publicationTime ≤ pitBoundary` filtering |
| PIT durable persistence | ⚠ **OPEN** — P10 produces PIT snapshots in memory but does not persist them |

### Finding

P10 implements **PIT mode enforcement** for D07 and D08 domains (mandatory) and D09 (conditional). All P10 fields are PIT-eligible. However, P10 does **NOT** implement PIT query functions, knowability filtering, or PIT reproducibility verification. PIT durable persistence remains **OPEN** — P10 produces PIT snapshots in memory but does not persist them to disk.

**Insufficient evidence:** Without PIT query functions and with durable persistence OPEN, P10 cannot demonstrate PIT reproducibility.

### Verdict

**⛔ NOT CERTIFIED** — C11 (PIT reproducibility) is **NOT established** within P10 scope.

---

## C9 Evaluation — NOT CERTIFIED (Explicitly Excluded)

### Criterion

C9 requires certification of **DataGovernanceRuntime.classify()** for governance classification.

### Evidence

| Check | Result |
|---|---|
| D06 governance classification (NE-1) | ✅ Implemented — closed set `['public', 'internal', 'confidential', 'restricted']` |
| D09 governance classification (AD-4) | ✅ Implemented — same closed set as D06 |
| Classification enforcement | ✅ Closed set validation in `buildClassificationField` and `buildAltClassificationField` |
| C9 certification | ⛔ **EXPLICITLY EXCLUDED** per P10 acceptance limitations |

### Finding

P10 implements governance classification for D06 and D09 domains using a closed set of classifications (AD-11). However, C9 certification is **explicitly excluded** per the P10 acceptance limitations and the authoritative instruction for this certification act.

### Verdict

**⛔ NOT CERTIFIED** — C9 (governance classification) is **explicitly excluded** from P10 certification scope.

---

## C10 Evaluation — NOT CERTIFIED (Blocked)

### Criterion

C10 requires certification of **retention enforcement**.

### Evidence

| Check | Result |
|---|---|
| D09 retentionDays field | ✅ Implemented — non-negative integer validation |
| Retention enforcement | ⛔ **NOT IMPLEMENTED** — existing-IIPS M-6 defect (`isWithinRetention()` is a stub) |
| Retention enforcement claim | ✅ Explicitly recorded as `RETENTION_ENFORCEMENT_CLAIM.enforced = false` |

### Finding

P10 records `retentionDays` for D09 alternative data but does **NOT** enforce retention. The existing-IIPS M-6 defect (`isWithinRetention()` returns `data.retentionDays >= 0`) remains unresolved. P10 explicitly records that retention enforcement is NOT claimed.

**Blocked:** C10 cannot be certified due to existing-IIPS M-6 defect.

### Verdict

**⛔ NOT CERTIFIED** — C10 (retention enforcement) is **BLOCKED** by existing-IIPS M-6.

---

## Decision Summary

| Requirement | Verdict | Evidence |
|---|---|---|
| **C3** — Snapshot immutability + lineage | ✅ **CERTIFIED** | deepFreeze (29 ops), P05 lineage infrastructure, 67/67 tests |
| **C8** — Provenance/quality/freshness | ✅ **CERTIFIED** | P05 provenance, EC-3/MD-1/NE-4 time requirements, 67/67 tests |
| C4 — Extended replay identity | ⛔ **NOT CERTIFIED** | Basic revision tracking present, sophisticated restatement tracking absent |
| C9 — Governance classification | ⛔ **NOT CERTIFIED** | Explicitly excluded per acceptance limitations |
| C10 — Retention enforcement | ⛔ **NOT CERTIFIED** | Blocked by existing-IIPS M-6 |
| C11 — PIT reproducibility | ⛔ **NOT CERTIFIED** | PIT mode enforced, but PIT queries absent and durable persistence OPEN |

---

## Scope Limitation

This certification is **scoped to P10 D06–D09 at the P05 infrastructure level**. It does NOT:

- ⛔ Certify C3 or C8 at the domain-specific level (no P10-specific lineage verification or temporal derivation)
- ⛔ Certify C4, C9, C10, or C11 for any P10 domain
- ⛔ Broaden P09 certification beyond D03 scope
- ⛔ Certify P08's C3, C4, C11 requirements (P08 certification remains a separate act)
- ⛔ Grant production activation (remains **NOT AUTHORIZED**)
- ⛔ Authorize P11 (remains **NOT AUTHORIZED / NOT STARTED**)
- ⛔ Resolve OI-05, M-6, C9, PIT durable persistence, AG-1, AG-2, or documentation debt

### Certification level comparison

| Phase | C3 level | C8 level | C11 level |
|---|---|---|---|
| P09 D03 | Domain-specific (lineage verification + digest) | Comprehensive (times + lag + classification) | Full (PIT queries + reproducibility) |
| **P10 D06–D09** | **P05 infrastructure only** | **Basic (provenance + times)** | **NOT CERTIFIED** |

P10 certification is at a **lower level** than P09 certification due to reliance on P05 generic infrastructure rather than domain-specific implementations.

---

## Authority Boundaries

This certification:

- ✅ Establishes C3 and C8 within P10 D06–D09 scope at the P05 infrastructure level
- ✅ Follows the P09 precedent (scoping + evaluation as one inseparable act)
- ✅ Is recorded by the designated A2 authority (Sai)
- ⛔ Does NOT constitute production activation
- ⛔ Does NOT authorize P11 or any downstream phase
- ⛔ Does NOT certify C4, C9, C10, or C11 for P10
- ⛔ Does NOT broaden P09 certification beyond D03 scope
- ⛔ Does NOT modify implementation or accepted artifacts

---

## Precedent Alignment

| Phase | C-numbers required | Decision | Date |
|---|---|---|---|
| P07 | C7, C8 | **WITHHELD** (C7 not established; C8 certified within P07 scope) | 2026-09-12 |
| P08 | C3, C4, C11 | **NOT YET EVALUATED** | — |
| P09 | C3, C4, C8, C11 | **✅ CERTIFIED** (within D03 scope, domain-specific level) | 2026-09-12 |
| **P10** | **C3, C4, C8, C9, C10, C11** | **✅ PARTIAL CERTIFICATION** (C3, C8 within D06–D09 scope, P05 infrastructure level) | **2026-09-12** |

---

## Post-Certification Authority State

| Item | Pre-certification | Post-certification |
|---|---|---|
| P10 | ✅ ACCEPTED | ✅ ACCEPTED |
| **P10 certification** | ⛔ NONE GRANTED | ✅ **PARTIAL CERTIFICATION (C3, C8 within D06–D09 scope, P05 infrastructure level)** |
| P09 certification | ✅ CERTIFIED (D03 only) | ✅ CERTIFIED (D03 only, **NOT broadened**) |
| P08 certification | ⛔ NOT EVALUATED | ⛔ NOT EVALUATED |
| P07 certification | ⚠ WITHHELD | ⚠ WITHHELD |
| C3 (overall) | ⚠ CERTIFIED within P09 D03 scope | ✅ CERTIFIED within P09 D03 + P10 D06–D09 scope |
| C4 (overall) | ⚠ CERTIFIED within P09 D03 scope | ⚠ CERTIFIED within P09 D03 scope only |
| C8 (overall) | ✅ CERTIFIED within P07 + P09 scope | ✅ CERTIFIED within P07 + P09 + P10 scope |
| C9 (overall) | ⛔ NOT CERTIFIED | ⛔ NOT CERTIFIED |
| C10 (overall) | ⛔ NOT CERTIFIED | ⛔ NOT CERTIFIED |
| C11 (overall) | ⚠ CERTIFIED within P09 D03 scope | ⚠ CERTIFIED within P09 D03 scope only |
| Production activation | ⛔ NOT AUTHORIZED | ⛔ NOT AUTHORIZED |
| P11 | ⛔ NOT AUTHORIZED | ⛔ NOT AUTHORIZED |

---

## Deferred Conditions

The following conditions remain OPEN and are NOT resolved by this certification act:

1. **OI-05** — D09 applicability criteria undefined; fail-closed in implementation
2. **M-6** — Retention enforcement NOT implemented; blocks C10
3. **C9** — Governance classification NOT certified (explicitly excluded)
4. **PIT durable persistence** — OPEN; blocks C11
5. **AG-1 / AG-2** — OPEN (P08 scope)
6. **Documentation debt** — OUTSTANDING
7. **P09 boundary-test maintenance debt** — OUTSTANDING (non-blocking)

---

**P10 D06–D09 CERTIFICATION = PARTIAL CERTIFICATION (C3, C8 at P05 infrastructure level).**

**C4, C9, C10, C11 = NOT CERTIFIED.**

**A2 authority: Sai.**

**Date: 2026-09-12.**

**Commit:** 43ca5d7874fa6cff5315b54e803e696e67a35240
