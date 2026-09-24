# IIPS Platform — Implementation Releases

**Repository:** `iips-platform`
**Date:** 2026-08-06

---

## banking-engine v1.0.0 — PRODUCTION RELEASE

**Release date:** 2026-08-06
**Promoted from:** `banking-engine-rc-1.0.0`
**Gate:** Independent Verification Review — PASS (reproducible from clean clone)
### What's included
- Runtime foundation (WP-1)
- Framework services (WP-2)
- Banking Engine (WP-3) — metrics, scoring, calibration, decision, evidence
- Validation & replay (WP-4) — golden dataset regression (5/5), replay determinism, 7 validation fixtures
- Release candidate + reports + traceability matrix

### Verification evidence
- `tsc --noEmit --strict` → clean
- 35/35 tests pass
- All 5 frozen banking outputs reproduced exactly from a clean git clone

### Depends on (frozen)
- IES-005 / IES-005.1 (platform contracts)
- IES-006 v1.0 (frozen banking methodology + reference assets)

### Tags
- `banking-engine-v1.0.0` (production)
- `v1.0.0` (specification freeze)

---

## insurance-engine v1.0.0 — PRODUCTION RELEASE

**Release date:** 2026-08-06
**Promoted from:** `insurance-engine-rc-1.0.0`
**Gate:** Independent Verification Review — PASS (reproducible from clean clone)

### What's included
- Insurance Engine (`sector.insurance`): metrics (IM-001…IM-008), scoring, calibration, decision, evidence
- Reuses the Banking-validated platform unchanged (runtime, framework, contracts, replay, evidence, validation, governance)
- Multi-sector coexistence: Banking + Insurance through the same runtime/framework

### Verification evidence
- `tsc --noEmit --strict` → clean
- 48/48 tests pass
- All 5 frozen Insurance outputs reproduced exactly from a clean git clone
- 8 validation fixtures accepted

### Depends on (frozen)
- IES-005 / IES-005.1 (platform contracts)
- IES-007 v1.0 (frozen insurance methodology + reference assets)

### Tags
- `insurance-engine-v1.0.0` (production)
- `ies-007-v1.0.0` (specification freeze)

---

## Release history

| Engine | Version | Tag | Status |
|---|---|---|---|
| Banking | 1.0.0 | `banking-engine-v1.0.0` | ✅ Released |
| Insurance | 1.0.0 | `insurance-engine-v1.0.0` | ✅ Released |
| Capital Markets | 1.0.0 | `capital-markets-engine-v1.0.0` | ✅ Released |
| Healthcare | 1.0.0 | `healthcare-engine-v1.0.0` | ✅ Released |

## Next

- Future sectors (Capital Markets, Healthcare, etc.) reuse the same platform + lifecycle
- Insurance/Banking v1.1/v2.0 via versioned methodology changes
