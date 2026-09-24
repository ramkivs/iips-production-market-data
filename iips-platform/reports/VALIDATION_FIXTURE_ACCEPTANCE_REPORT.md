# Banking Engine — Validation Fixture Acceptance Report

**Milestone:** IES-006.2A (WP-4)
**Date:** 2026-08-06
**Basis:** Frozen `fixtures/banking-validation-fixtures-1.0.0.json` (7 fixtures)

---

## Result

All 7 frozen validation fixtures run deterministically and stay within the expected outcome bounds.

| Fixture | Scenario | Verdict | Expected constraint | Conforms |
|---|---|---|---|---|
| FIX-01 | Negative Earnings | Watch | Not exceed Watch | ✅ |
| FIX-02 | Rapid GNPA Deterioration | Hold | Not exceed Watch | ✅ |
| FIX-03 | Capital Adequacy Breach | Watch | CAP at Watch | ✅ |
| FIX-04 | Missing Data | Accumulate | Deterministic, reduced confidence | ✅ |
| FIX-05 | Conflicting Indicators | Hold | Moderated recommendation | ✅ |
| FIX-06 | Exceptional Treasury Gains | Accumulate | Tempered recommendation | ✅ |
| FIX-07 | Governance Failure | Avoid | CAP at Avoid (override) | ✅ |

**Note:** FIX-03 (capital breach) triggers the `capital-adequacy-breach` override → Watch. FIX-07 (governance failure) triggers the `governance-failure` override → Avoid. FIX-01/02 stay within their caps.

## Acceptance

✅ **PASS** — all 7 fixtures accepted.
