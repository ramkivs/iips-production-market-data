# Capital Markets Engine — Release Candidate Report

**Release Candidate:** `capital-markets-engine-rc-1.0.0`
**Milestone:** IES-008 (WP-4)
**Date:** 2026-08-06

---

## 1. Summary

A release candidate demonstrating the Capital Markets Engine satisfies the frozen IES-008 specification while reusing the platform unchanged.

## 2. Manifest

See `RELEASE_CANDIDATE_MANIFEST.json`: version `1.0.0`, methodology `IES-008 v1.0 (frozen)`, golden regression PASS, replay PASS, 61 tests, reuses `iips-platform` unchanged.

## 3. Contents

- `src/sector-engines/capital-markets/` (metrics, scoring, calibration, decision, evidence, engine, frozen assets)
- `tests/regression/` (acceptance + reuse + framework + 3-sector)
- `reports-capital-markets/` (golden regression, replay, fixture acceptance)
- `IMPLEMENTATION_TRACEABILITY_MATRIX_IES008.md` + `IMPLEMENTATION_REUSE_REPORT_IES008.md`

## 4. Frozen spec conformance

- Reproduces all 6 frozen expected outputs exactly.
- Replay deterministic.
- 8 validation fixtures accepted.
- Calibration isolated.
- Evidence traceable Metric→Band→Score→Pillar→Composite→Verdict.
- Reuses platform unchanged.

## 5. Repository separation

- `iips-engineering-standards` (frozen `ies-008-v1.0.0`) — untouched.
- `iips-platform` — implementation, consumes frozen assets read-only.

## 6. Status

**RELEASE CANDIDATE READY.** Subject to independent verification + final approval.
