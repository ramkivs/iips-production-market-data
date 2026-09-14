# Banking Engine — Release Candidate Report

**Release Candidate:** `banking-engine-rc-1.0.0`
**Milestone:** IES-006.2A (WP-4)
**Date:** 2026-08-06

---

## 1. Summary

A single release candidate package demonstrating that the Banking Engine implementation satisfies the frozen IES-006 specification.

## 2. Manifest

See `RELEASE_CANDIDATE_MANIFEST.json`:
- Version `1.0.0`, framework `1.0`, methodology `IES-006 v1.0 (frozen)`
- Golden dataset regression: **PASS**
- Replay determinism: **PASS**
- Tests: **35/35**

## 3. Contents (implementation)

```
src/
  infrastructure/   Clock, IdProvider, deepFreeze
  di/               Container
  plugin-loader/    PluginContract, PluginLoader
  registry/         RegistryManager
  snapshot/         SnapshotService, SnapshotStore
  replay/           ReplayService
  runtime/          RuntimeCoordinator
  framework/        evidence, manifest, transport, diagnostics, qualification, activation
  sector-engines/banking/  metrics, scoring, calibration, decision, evidence, BankingEngine, frozen-assets
tests/regression/   permanent regression suite (incl. banking acceptance)
reports/            golden-dataset regression + replay validation reports
```

## 4. Frozen specification conformance

- Reproduces all 5 golden-bank expected outputs exactly.
- Replay deterministic (identical evidence + verdicts).
- 7 validation fixtures accepted.
- Calibration isolated (behavior driven by profile, not code).
- Evidence traceable Metric→Band→Score→Pillar→Composite→Verdict.

## 5. Repository separation

- `iips-engineering-standards` (the truth, frozen tag `v1.0.0`) — untouched.
- `iips-platform` — implementation, consumes frozen assets read-only.

## 6. Status

**RELEASE CANDIDATE READY.** Subject to final implementation readiness approval.
