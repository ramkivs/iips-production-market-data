# Program v1.1 — Track 8: Architecture Conformance Audit

**Program:** IIPS Engineering Standards — Program v1.1
**Milestone:** Program v1.1 Final Certification — Track 8 (Architecture Conformance Audit)
**Document type:** CERTIFICATION REPORT (verification-only — forensic architecture comparison)
**Version:** 1.0
**Date:** 2026-08-09
**Predecessor:** Track 7 — CI/CD Certification (Approved)
**Status:** **CERTIFIED** (classifications issued) — awaiting approval before Track 9 (LTS Baseline)

---

## 1. Audit question

> **Across all 10 released sector engines, does the architecture conform to the common v1.1 pattern — or has it accumulated pattern drift?**

Track 8 performs a **forensic comparison** across all 10 engines against 10 invariants, and **classifies every deviation** (rather than normalizing it).

## 2. Classification scheme

| Symbol | Classification | Meaning |
|---|---|---|
| 🟢 | **Conformant** | Common v1.1 architectural pattern |
| 🟡 | **Accepted Legacy** | Historical deviation, harmless and frozen |
| 🟠 | **v2.0 Remediation Candidate** | Valid architectural debt; must not be changed in v1.1 |
| 🔴 | **Blocking Non-Conformance** | Violates a v1.1 architectural invariant |

## 3. Invariant × engine matrix (10 × 10)

| # | Invariant | All 10 engines | Classification |
|---|---|---|---|
| 1 | Common execution pipeline (SectorPlugin: execute/onRegister/onInitialize) | ✅ conform | 🟢 |
| 2 | Platform/framework reuse (plugin contract + runtime/evidence/DI) | ✅ conform | 🟢 |
| 3 | Sector methodology isolation (separate metrics/scoring/calibration/decision/evidence modules) | ✅ conform | 🟢 |
| 4 | Calibration isolation (frozen calibration profile, not inline scoring) | ✅ conform | 🟢 |
| 5 | Evidence standardization (evidence module reuses shared `EvidencePipeline`) | ✅ conform | 🟢 |
| 6 | Replay determinism (snapshot via shared `runtime.recordSnapshot`) | ✅ conform | 🟢 |
| 7 | Ontology registration consistency | ⚠️ **6 publish / 4 legacy** | 🟡/🟠 |
| 8 | Frozen-oracle consumption (frozen golden/expected reference assets shipped) | ✅ conform (1 layout variant) | 🟢/🟡 |
| 9 | No sector-specific branching in platform (sector logic confined to `sector-engines/`) | ✅ conform | 🟢 |
| 10 | No platform/framework/CSIP specialization (audit changed no platform file) | ✅ conform | 🟢 |

## 4. Deviations adjudicated (explicitly, not normalized)

### Deviation 1 — Ontology exposure inconsistency (from Track 2 / Track 6)
- **Fact:** 6 newer engines (Hospitality, Energy, Utilities, Consumer, Industrials, Technology) publish execution-metadata ontology (8-dim UIO); the 4 v1.0 engines (Banking, Insurance, Capital Markets, Healthcare) do not, relying on CSIP's declarative `OntologyMapper`.
- **Classification:** 🟡 **Accepted Legacy** (for the 4 v1.0 engines — frozen/immutable, harmless) + 🟠 **v2.0 Remediation Candidate** (unify engine-published ontology as the single registration mechanism in v2.0).
- **v1.1 impact:** none — CSIP is sector-neutral and consumes all 10 (Track 6).

### Deviation 2 — CSIP `engineVersions` evidence staleness (from Track 6)
- **Fact:** `CrossSectorEvidence.sectorContribution.engineVersions` is hardcoded to the 4 v1.0 engines only (frozen `csip-v1.0.0`), not the 6 newer engines.
- **Classification:** 🟠 **v2.0 Remediation Candidate** — valid architectural debt (stale metadata), must not be changed in v1.1 (CSIP frozen). Sector versions remain identifiable in source engine outputs.

### Deviation 3 — Calibration-version exposure (from Track 3)
- **Fact:** only Technology exposes `calibrationVersion` in execution metadata; the other 9 carry it in evidence provenance.
- **Classification:** 🟡 **Accepted Legacy** (functional binding certified) + 🟠 **v2.0 Remediation Candidate** (expose calibration version uniformly in execution metadata in v2.0).

### Deviation 4 — Banking frozen-asset layout (storage, not architectural)
- **Fact:** Banking keeps its frozen reference assets under `frozen-assets/`; the other 9 keep them at the sector root. All are consumed as frozen oracles.
- **Classification:** 🟡 **Accepted Legacy** — harmless layout variant; no architectural impact.

## 5. Audit verdict

**CERTIFIED — no 🔴 Blocking Non-Conformance.** All 10 engines conform to the common v1.1 architectural invariants (execution pipeline, platform/framework reuse, methodology/calibration isolation, evidence standardization, replay determinism, frozen-oracle consumption, no sector branching, no platform/CSIP specialization). The four deviations are classified 🟡 Accepted Legacy and/or 🟠 v2.0 Remediation Candidate — none requires change in v1.1.

**Track 8 answer to the open question:** the historical metadata variation (ontology/calibration exposure) represents **acceptable legacy evolution** in v1.1, and is flagged as **🟠 v2.0 remediation candidate** — to be unified only in v2.0, never in the frozen v1.1 baseline.

## 6. Evidence

- Audit suite `tests/regression/program-v1.1-track8-architecture-audit.test.ts` (10 certifications, source inspection across all 10 engines).
- `tsc --noEmit` (strict) → clean.
- Full platform suite: **325/325 PASS** (315 prior + 10 Track-8).
- `git status`: only the Track-8 audit test added; **no platform/framework/engine/CSIP file modified**.

## 7. Program lifecycle status

| Stage | Status |
|---|---|
| Gate 0 — Certification Scope | ✅ Approved |
| Track 1 — Platform Certification | ✅ Approved |
| Track 2 — Cross-Sector Certification | ✅ Approved |
| Track 3 — Complete Replay Certification | ✅ Approved |
| Track 4 — Performance Certification | ✅ Approved |
| Track 5 — Observability Certification | ✅ Approved |
| Track 6 — CSIP Certification | ✅ Approved |
| Track 7 — CI/CD Certification | ✅ Approved |
| **Track 8 — Architecture Conformance Audit** | **▶ CERTIFIED — 325/325, no blocking non-conformance, 4 deviations classified** |
| Track 9 — LTS Baseline | Pending |
| Final Program Readiness Certificate | Pending |
| **Program v1.1.0 Release / LTS** | Pending |

**STOP — awaiting approval of Track 8 before Track 9 (LTS Baseline: freeze the v1.1 APIs/contracts, establish the v1.1.0 LTS baseline, and define the v2.0 MAY-change vs MUST-preserve boundary).**
