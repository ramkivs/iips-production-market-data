# IES-017 — Automobile Sector Engine v1.0.0 — Release Notes

**Engine:** `sector.automobile` · **sectorFamily:** `Automobile`
**Contract:** D17 v1.0 (M1–M15 ACCEPTED).

## What was delivered

- Full sector engine per the certified Technology/Telecommunications template: metrics, scoring, calibration, decision, evidence, ontology.
- 12-metric input contract (AB-001…AB-012) + 7 override flags; 5 subsegments; 6 archetypes.
- 6-pillar → composite scoring with round-half-to-even; verdict mapping + min-rank overrides (leverage-breach auto-rule).
- 13/13 frozen expected outputs reproduced byte-exactly; deterministic replay.
- Mechanical integration: both ENGINE_FACTORY registries (runtime + admin), replay-baseline 12th sector entry, SECTOR_DIR, admin auto-registration (11 → 12), governed transport/API auto-extension, ontology registration (zero CSIP change).

## Data authority

- Calibration/golden/expected-outputs/replay/validation fixtures are the accepted D17 certification artifacts (SHA256-verified byte-exact materialization).
- No fabricated confidence: governed output is `null → "unavailable"` for Automobile (G5 Option-A analog).
- Synthetic deterministic reference providers (IES-015/016 convention); not real-company claims.

## Scope boundary

No frontend feature changes; no navigation changes; no CSIP algorithm changes; no platform/framework changes; no auth/RBAC/quota/audit changes; no changes to existing certified engines.
