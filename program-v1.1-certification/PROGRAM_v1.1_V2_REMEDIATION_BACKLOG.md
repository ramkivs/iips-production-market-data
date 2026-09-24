# Program v1.1 — v2.0 Remediation Backlog

**Program:** IIPS Engineering Standards — Program v1.1 → v2.0
**Document type:** V2.0 ARCHITECTURAL BACKLOG — the accepted legacy deviations from Track 8, recorded for v2.0 (never fixed in the frozen v1.1 baseline)
**Version:** 1.0
**Date:** 2026-08-09
**Source:** Track 8 — Architecture Conformance Audit (classifications)

---

## Purpose

Track 8 classified the historical deviations as 🟡 Accepted Legacy and/or 🟠 v2.0 Remediation Candidate. This backlog records each as an explicit **v2.0 work item** so the v1.1 baseline is not contaminated and v2.0 has a precise remediation list. **None of these is changed in v1.1.**

## Backlog

| ID | Deviation | Classification | v2.0 remediation | Priority |
|---|---|---|---|---|
| **v2.0-R1** | Ontology exposure inconsistency — 4 v1.0 engines (Banking, Insurance, Capital Markets, Healthcare) do not publish execution-metadata ontology; 6 newer engines do | 🟡 Accepted Legacy (v1.0 engines frozen) + 🟠 v2.0 | Unify engine-published ontology as the single registration mechanism; backfill ontology metadata for all engines in v2.0 | High |
| **v2.0-R2** | CSIP `engineVersions` evidence staleness — `CrossSectorEvidence.sectorContribution.engineVersions` hardcoded to the 4 v1.0 engines only | 🟠 v2.0 | Make CSIP evidence enumerate all consumed engine versions (dynamic, not hardcoded) | Medium |
| **v2.0-R3** | Calibration-version exposure — only Technology exposes `calibrationVersion` in execution metadata; the other 9 carry it in evidence provenance | 🟡 Accepted Legacy (functional binding) + 🟠 v2.0 | Expose calibration version uniformly in execution metadata across all engines in v2.0 | Medium |
| **v2.0-R4** | Banking frozen-asset layout — Banking keeps reference assets under `frozen-assets/`; others at sector root | 🟡 Accepted Legacy (harmless) | Standardize frozen-asset layout across engines in v2.0 | Low |

## Governance

- All 4 items are **explicitly excluded from v1.1** (frozen baseline; no engine/CSIP modification during certification).
- Each is a controlled, versioned v2.0 work item subject to the v2.0 MUST-PRESERVE constraints (determinism, replay, oracle, evidence, CSIP neutrality, plugin contract, methodology isolation — per `PROGRAM_v1.1_LTS_BASELINE.md`).

## Status

**BACKLOG RECORDED — COMPLETE.** Consumed by Program v2.0 planning (see `ies-000-template/PLATFORM_v2.0_PLANNING.md`).
