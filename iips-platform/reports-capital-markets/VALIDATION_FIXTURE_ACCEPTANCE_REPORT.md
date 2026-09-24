# Capital Markets Engine — Validation Fixture Acceptance Report

**Milestone:** IES-008 (WP-4)
**Date:** 2026-08-06
**Basis:** Frozen `fixtures/capital-markets-validation-fixtures-1.0.0.json` (8 fixtures)

---

## Result

All 8 frozen capital-markets fixtures run deterministically and stay within expected outcome bounds.

| Fixture | Scenario | Verdict | Expected constraint | Conforms |
|---|---|---|---|---|
| FIX-CM-01 | Healthy Asset Manager | Strong Buy | Strong/positive | ✅ |
| FIX-CM-02 | Severe AUM Outflow | Accumulate | Reduced (override) | ✅ |
| FIX-CM-03 | Cost Blowout | Watch | Cap at Watch | ✅ |
| FIX-CM-04 | Regulatory Breach | Avoid | Cap at Avoid | ✅ |
| FIX-CM-05 | Fee Compression | Accumulate | Tempered | ✅ |
| FIX-CM-06 | Missing Data | Accumulate | Deterministic, reduced confidence | ✅ |
| FIX-CM-07 | Governance Failure | Avoid | Cap at Avoid | ✅ |
| FIX-CM-08 | Market Cycle Stress | Accumulate | Reduced | ✅ |

**Note:** Added the `severe-aum-outflow` override (AUM growth < -5% → Accumulate) so FIX-CM-02 now correctly reduces.

## Acceptance

✅ **PASS** — all 8 fixtures accepted.
