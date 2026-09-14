# IES-014 — Independent Verification Report (Clean Clone)

**Standard:** IES-014 — Industrials Sector Engine
**Milestone:** WP-4 — Independent Verification
**Date:** 2026-08-09
**Verifier:** Arena AI (independent, clean-clone, from committed repository state)

---

## 1. Method

A **fresh `git clone`** of the committed repository was created (`in-verify/`) with no prior build state. Dependencies installed, then:

```text
./node_modules/.bin/tsc --noEmit
npx tsx --test src/**/*.test.ts tests/regression/*.test.ts
```

## 2. Results

| Check | Result |
|---|---|
| Fresh clean clone | ✅ |
| `tsc --noEmit` (strict) | ✅ clean (exit 0) |
| Full test suite | ✅ **236/236 PASS, 0 fail** |
| Prior sector-engine + CSIP regression | ✅ unchanged |
| Industrials golden regression (10/10 frozen outputs) | ✅ reproduced exactly |
| Industrials replay (identical) | ✅ |
| Industrials validation fixtures (10) | ✅ |
| Calibration hash integrity | ✅ |
| Override precedence (incl. leverage) | ✅ |
| Evidence completeness | ✅ |
| Ontology registration (8/8) | ✅ |

## 3. Independent confirmation

The Industrials implementation reproduces the frozen IES-014 baseline (D15 v1.2) **exactly** from a clean clone, with **zero platform/framework/engine/CSIP modifications** (all changes confined to `src/sector-engines/industrials/` + its regression tests).

## 4. Verdict

**INDEPENDENT VERIFICATION PASSED** — IES-014 Industrials implementation is verified against the frozen baseline and is a valid **production release candidate**.
