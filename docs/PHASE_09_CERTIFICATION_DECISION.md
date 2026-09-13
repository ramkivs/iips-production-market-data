# P09 Certification — A2 Decision Record

## Identity

| Field | Value |
|---|---|
| **Record type** | A2 certification scoping and decision (one inseparable act) |
| **Phase** | P09 — Fundamentals gate |
| **Decision** | **A — CERTIFY (C3, C4, C8, C11 within P09 D03 scope)** |
| **Date** | 2026-09-12 |
| **A2 authority** | **Sai** — designated A2 (commit `2d28e42`) |
| **Baseline** | `e77d1280c56b38f1bad2bfa51bf60018f6fca143` (P09 acceptance) |

---

## Certification Scope

| Requirement | Definition | Scope |
|---|---|---|
| **C3** | Snapshot immutability + contributingData lineage | AD-3/AD-6 replay identity extension |
| **C4** | Extended replay identity (data vintage) | AD-3 |
| **C8** | Provenance / quality / freshness derivation | Replaces literals; NFR-03/04/09 |
| **C11** | PIT reproducibility (reports, saved screens) | UI08/UI05 |

### C-Numbers NOT applicable to P09

| C-number | Reason not applicable |
|---|---|
| C1 | Market-data ingress path — P11 scope (engine integration) |
| C2 | Namespace + collision guard — P11 scope (namespace guard certification) |
| C5 | Security master + P04 identity adapter — P04 scope |
| C6 | Screener contract — P12 scope |
| C7 | Object-resolution / search contract — P12/P13 scope (UI13/UI14) |
| C9 | DataGovernanceRuntime.classify() — separate governance concern |
| C10 | Retention enforcement — BLOCKED (existing-IIPS M-6) |
| C12 | Data-plane security/tenant enforcement — BLOCKED (M-5, security authority unknown) |

---

## C3 Evaluation — CERTIFIED within P09 D03 scope

### Criterion

C3 requires certification of **snapshot immutability and contributingData lineage** for the D03 Fundamentals domain.

### Evidence

| Check | Result |
|---|---|
| Snapshot immutability (deepFreeze) | ✅ **25 freeze operations** across P09 modules (`fundamentalsModel.js`: 13, `fundamentalsPitModel.js`: 12) |
| Complete lineage block (FL-1) | ✅ **All 6 required fields**: `sourceRef`, `adapterId`, `adapterVersion`, `transformationChainRef`, `receivedAt`, `namespaceVersion` |
| Lineage completeness verification | ✅ `verifyLineageComplete()` — 3 tests PASS |
| Lineage immutability (FL-5) | ✅ `lineageDigest()` — deterministic SHA-256 digest; 2 tests PASS |
| Lineage digest determinism | ✅ Same lineage → same digest; different lineage → different digest |
| Frozen snapshot output | ✅ `buildFundamentalsSnapshot()` returns `deepFreeze`-d result (SN-1, ST-10) |
| PIT store immutability | ✅ `structuredClone` + `deepFreeze` on admit; no mutation path |

### Finding

P09 builds **frozen, immutable** D03 fundamentals snapshots with **complete lineage blocks**. Every snapshot is deep-frozen at construction. Lineage is verified complete at build time and digestible for immutability verification. The PIT store clones and freezes on admit, ensuring no mutation path exists.

### Verdict

**✅ CERTIFIED** — C3 (snapshot immutability + contributingData lineage) is established within P09 D03 scope.

---

## C4 Evaluation — CERTIFIED within P09 D03 scope

### Criterion

C4 requires certification of **extended replay identity and data vintage** for the D03 Fundamentals domain.

### Evidence

| Check | Result |
|---|---|
| Restatement group key (RP-1) | ✅ Deterministic: `provider:identityKey:fiscalPeriod:statementType` |
| Data vintage enforcement (RP-2) | ✅ PIT-3 compliance: new `dataVersion` required for restatements; same `dataVersion` rejected |
| Restatement sequence validation | ✅ `validateRestatementSequence()` — 3 tests PASS (proper sequencing, RP-1 rejection, RP-2 rejection) |
| Monotonic restatementSeq | ✅ `restatementSeq` must be strictly greater than all existing in group |
| snapshotId composition | ✅ Reuses P05 `buildSnapshotId()`: `data-${provider}-${dataVersion}-${asOf}` |
| PIT store vintage tracking | ✅ `createFundamentalsPitStore()` tracks snapshots by `snapshotId`; no overwrite path |

### Finding

P09 enforces **data vintage identity** through deterministic restatement group keys (RP-1), mandatory new `dataVersion` for restatements (RP-2 / PIT-3), and monotonic `restatementSeq`. The `snapshotId` composition from P05 ensures byte-stable identity. The PIT store has no overwrite path.

### Verdict

**✅ CERTIFIED** — C4 (extended replay identity / data vintage) is established within P09 D03 scope.

---

## C8 Evaluation — CERTIFIED within P09 D03 scope

### Criterion

C8 requires certification of **provenance, quality, and freshness derivation** for the D03 Fundamentals domain.

### Evidence

| Check | Result |
|---|---|
| Provenance (FL-1) | ✅ Every field carries a `provenance` reference (required by `buildField`) |
| Quality preservation (INV-7) | ✅ Quality propagated from input; never overwritten or coerced |
| Publication time (PT-2) | ✅ REQUIRED for every fundamentals data field |
| Effective time (PT-2) | ✅ REQUIRED for every fundamentals data field |
| Publication ≠ effective (PT-1) | ✅ Both times carried as DISTINCT slots; collapsing prohibited (PIT-4) |
| Reporting lag (PT-5) | ✅ `reportingLagMs`, `reportingLagDays` computed; first-class datum |
| Negative lag flagged (PT-4) | ✅ `negativeLagFlagged: true` when publication precedes effective; not rejected |
| Temporal classification | ✅ `RETROSPECTIVE`, `SAME_DAY`, `PROSPECTIVE` — 3 tests PASS |
| Lag distribution | ✅ `computeReportingLagDistribution()` — min/max/mean; 3 tests PASS |
| Publication/effective distinct assertion | ✅ `assertPublicationEffectiveDistinct()` — 4 tests PASS |

### Finding

P09 **derives** provenance, quality, and freshness rather than asserting literals. Provenance is carried through the lineage block (FL-1). Quality is preserved from input without coercion (INV-7). Publication and effective times are both required, distinct, and never collapsed (PIT-4). The reporting lag is computed as a first-class datum, not an error. Forward-looking guidance (negative lag) is flagged but not rejected.

### Verdict

**✅ CERTIFIED** — C8 (provenance / quality / freshness derivation) is established within P09 D03 scope.

---

## C11 Evaluation — CERTIFIED within P09 D03 scope

### Criterion

C11 requires certification of **PIT reproducibility** for the D03 Fundamentals domain.

### Evidence

| Check | Result |
|---|---|
| PIT mandatory (FM-6) | ✅ `pitBoundary` required for all fundamentals snapshots; mode forced to `'PIT'` |
| PIT-eligible fields | ✅ All fundamentals fields set `pitEligible: true` |
| PIT boundary query (RP-5) | ✅ `queryLatestRestatement()` — returns latest restatement knowable at boundary |
| Query determinism (PIT-2) | ✅ Same `pitBoundary` + same `groupKey` → same result (no wall clock, no randomness) |
| Knowability filter | ✅ `publicationTime ≤ pitBoundary` — only knowable restatements returned |
| Query tests | ✅ 3 tests PASS: latest knowable, initial when restatement not yet knowable, not found when none knowable |
| PIT store admit | ✅ `structuredClone` + `deepFreeze` ensures stored snapshot is immutable copy |
| Restatement group tracking | ✅ `restatementGroupKeys()`, `restatementGroup()` — deterministic group access |

### Finding

P09 implements **reproducible PIT queries** for D03 fundamentals. PIT mode is mandatory (FM-6). All fields are PIT-eligible. The `queryLatestRestatement()` function deterministically returns the latest restatement knowable at a given `pitBoundary`, filtering by `publicationTime ≤ pitBoundary`. No wall clock or randomness is used. The PIT store ensures stored snapshots are immutable copies.

### Verdict

**✅ CERTIFIED** — C11 (PIT reproducibility) is established within P09 D03 scope.

---

## Decision Summary

| Requirement | Verdict | Evidence |
|---|---|---|
| **C3** — Snapshot immutability + lineage | ✅ **CERTIFIED** | deepFreeze (25 ops), FL-1 complete lineage, FL-5 lineageDigest, 97/97 tests |
| **C4** — Extended replay identity | ✅ **CERTIFIED** | RP-1 deterministic keys, RP-2 dataVersion enforcement, RP-5 repeatable queries, 97/97 tests |
| **C8** — Provenance/quality/freshness | ✅ **CERTIFIED** | FL-1 provenance, INV-7 no coercion, PT-1–PT-5 pub/eff time, 97/97 tests |
| **C11** — PIT reproducibility | ✅ **CERTIFIED** | FM-6 PIT mandatory, RP-5 PIT queries, pitEligible: true, 97/97 tests |

---

## Scope Limitation

This certification is **scoped to P09 D03 Fundamentals only**. It does NOT:

- ⛔ Certify C3, C4, C8, or C11 for any other domain (D01, D02, D04–D10)
- ⛔ Certify P08's C3, C4, C11 requirements (P08 certification remains a separate act)
- ⛔ Certify P07's C7 requirement (P07 C7 remains NOT ESTABLISHED)
- ⛔ Grant production activation (remains **NOT AUTHORIZED**)
- ⛔ Authorize P10 (remains **NOT AUTHORIZED / NOT STARTED**)
- ⛔ Resolve AG-1, AG-2, PIT durable persistence, documentation debt, or D4_12 naming discrepancy

### Cross-phase contribution

P09's D03 certification **contributes evidence** that may be referenced by future certification evaluations:
- P08 certification (C3, C4, C11) — when evaluated, may reference P09's D03 PIT evidence
- P07 certification retry (C7) — unchanged; P09 does not address C7

---

## Authority Boundaries

This certification:

- ✅ Establishes C3, C4, C8, C11 within P09 D03 scope
- ✅ Follows the P07 precedent (scoping + evaluation as one inseparable act)
- ✅ Is recorded by the designated A2 authority (Sai)
- ⛔ Does NOT constitute production activation
- ⛔ Does NOT authorize P10 or any downstream phase
- ⛔ Does NOT certify any other phase or domain
- ⛔ Does NOT modify implementation or accepted artifacts

---

## Precedent Alignment

| Phase | C-numbers required | Decision | Date |
|---|---|---|---|
| P07 | C7, C8 | **WITHHELD** (C7 not established; C8 certified within P07 scope) | 2026-09-12 |
| P08 | C3, C4, C11 | **NOT YET EVALUATED** | — |
| **P09** | **C3, C4, C8, C11** | **✅ CERTIFIED** (within D03 scope) | **2026-09-12** |

---

## Post-Certification Authority State

| Item | Pre-certification | Post-certification |
|---|---|---|
| P09 | ✅ ACCEPTED | ✅ ACCEPTED |
| **P09 certification** | ⛔ NONE GRANTED | ✅ **CERTIFIED (C3, C4, C8, C11 within D03 scope)** |
| P08 certification | ⛔ NOT EVALUATED | ⛔ NOT EVALUATED |
| P07 certification | ⚠ WITHHELD | ⚠ WITHHELD |
| C7 | ⛔ NOT CERTIFIED | ⛔ NOT CERTIFIED |
| C3/C4/C11 (overall) | ⛔ NOT CERTIFIED | ⚠ CERTIFIED within P09 D03 scope only |
| C8 (overall) | ⚠ CERTIFIED within P07 scope | ✅ CERTIFIED within P07 + P09 scope |
| Production activation | ⛔ NOT AUTHORIZED | ⛔ NOT AUTHORIZED |
| P10 | ⛔ NOT AUTHORIZED | ⛔ NOT AUTHORIZED |

---

**P09 D03 FUNDAMENTALS CERTIFICATION = CERTIFIED (C3, C4, C8, C11).**

**A2 authority: Sai.**

**Date: 2026-09-12.**
