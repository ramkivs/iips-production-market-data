# IES-012 — Independent Verification Report (Clean Clone)

**Standard:** IES-012 — Utilities Sector Engine
**Milestone:** WP-4 — Independent Verification
**Date:** 2026-08-08
**Verifier:** Arena AI (independent, clean-clone, from committed repository state)

---

## 1. Method

A **fresh `git clone`** of the committed repository was created (`ut-verify/`) with no prior build state. Dependencies installed, then:

```text
./node_modules/.bin/tsc --noEmit
npx tsx --test src/**/*.test.ts tests/regression/*.test.ts
```

## 2. Results

| Check | Result |
|---|---|
| Fresh clean clone | ✅ |
| `tsc --noEmit` (strict) | ✅ clean (exit 0) |
| Full test suite | ✅ **180/180 PASS, 0 fail** |
| Prior sector-engine + CSIP regression | ✅ unchanged |
| Utilities golden regression (11/11 frozen outputs) | ✅ reproduced exactly |
| Utilities replay (identical) | ✅ |
| Utilities validation fixtures (11) | ✅ |
| Calibration hash integrity | ✅ |
| Evidence completeness | ✅ |
| Ontology registration (8/8) | ✅ |

## 3. Independent confirmation

The Utilities implementation reproduces the frozen IES-012 baseline **exactly** from a clean clone, with **zero platform/framework/engine/CSIP modifications** (all changes confined to `src/sector-engines/utilities/` + its regression tests).

## 4. Verdict

**INDEPENDENT VERIFICATION PASSED** — IES-012 Utilities implementation is verified against the frozen baseline and is a valid **production release candidate**.
