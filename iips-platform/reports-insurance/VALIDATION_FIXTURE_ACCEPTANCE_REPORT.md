# Insurance Engine — Validation Fixture Acceptance Report

**Milestone:** IES-007 (WP-4)
**Date:** 2026-08-06
**Basis:** Frozen `fixtures/insurance-validation-fixtures-1.0.0.json` (8 fixtures)

---

## Result

All 8 frozen insurance fixtures run deterministically and stay within expected outcome bounds.

| Fixture | Scenario | Verdict | Expected constraint | Conforms |
|---|---|---|---|---|
| FIX-I-01 | Healthy Life | Buy | Strong/positive | ✅ |
| FIX-I-02 | Combined Ratio >105% | Watch | Cap at Watch | ✅ |
| FIX-I-03 | Solvency Breach | Watch | Cap at Watch | ✅ |
| FIX-I-04 | Negative VNB | Accumulate | Growth penalized | ✅ |
| FIX-I-05 | Persistency Deterioration | Accumulate | Reduced | ✅ |
| FIX-I-06 | Missing Data | Accumulate | Deterministic, reduced confidence | ✅ |
| FIX-I-07 | Governance Failure | Avoid | Cap at Avoid | ✅ |
| FIX-I-08 | Catastrophic Claims | Watch | Reduced (combined ratio cap) | ✅ |

**Note:** FIX-I-03 solvency breach now correctly triggers the `solvency-breach` override → Watch (raw solvency ratio < 1.25 regulatory minimum). FIX-I-07 governance failure → Avoid.

## Acceptance

✅ **PASS** — all 8 fixtures accepted.
