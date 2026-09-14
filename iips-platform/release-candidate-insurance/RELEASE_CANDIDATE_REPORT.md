# Insurance Engine — Release Candidate Report

**Release Candidate:** `insurance-engine-rc-1.0.0`
**Milestone:** IES-007 (WP-4)
**Date:** 2026-08-06

---

## 1. Summary

A release candidate package demonstrating the Insurance Engine satisfies the frozen IES-007 specification while reusing the Banking-validated platform unchanged.

## 2. Manifest

See `RELEASE_CANDIDATE_MANIFEST.json`: version `1.0.0`, framework `1.0`, methodology `IES-007 v1.0 (frozen)`, golden regression PASS, replay PASS, 48 tests, reuses `iips-platform` unchanged.

## 3. Contents

```
src/sector-engines/insurance/   metrics, scoring, calibration, decision, evidence, InsuranceEngine, frozen assets
tests/regression/               insurance acceptance + reuse + framework + golden dataset
reports-insurance/              golden regression + replay validation + fixture acceptance
IMPLEMENTATION_TRACEABILITY_MATRIX_IES007.md
```

## 4. Frozen spec conformance

- Reproduces all 5 frozen insurance expected outputs exactly.
- Replay deterministic.
- 8 validation fixtures accepted.
- Calibration isolated.
- Evidence traceable Metric→Band→Score→Pillar→Composite→Verdict.
- Reuses platform unchanged (WP-1/WP-2).

## 5. Repository separation

- `iips-engineering-standards` (frozen `ies-007-v1.0.0`) — untouched.
- `iips-platform` — implementation, consumes frozen assets read-only.

## 6. Status

**RELEASE CANDIDATE READY.** Subject to independent verification + final approval.
