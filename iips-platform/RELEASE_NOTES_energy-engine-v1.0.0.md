# Release Notes — Energy Engine v1.0.0 (Platform/Implementation Repository)

**Tag:** `energy-engine-v1.0.0`
**Release date:** 2026-08-08
**Status:** Production release (promoted from `energy-engine-rc-1.0.0` after independent verification)

---

## Major capabilities

- **Energy Engine** (`sector.energy`): commodity/volume metric library (production growth, lifting cost, reserve replacement, reserve life, realized price, transition mix, EBITDA margin, leverage, ROCE, FCF yield), D15 band→score→pillar→composite scoring (round-half-to-even), segment + commodity-exposure calibration (6 segments, 5 exposure classes), decision engine + overrides (price collapse, cost blowout, reserve write-down, leverage breach, stranded asset, governance) + precedence, evidence — implements `SectorPlugin`.
- **Ontology registration** — 8-dimension metadata for CSIP with **zero CSIP change**.
- **Reuses the platform unchanged** — 0 platform/framework/engine modifications.
- **Seven-plugin coexistence:** Banking + Insurance + Capital Markets + Healthcare + Hospitality + CSIP + Energy.
- Grounded in Resource Sector Common Principles (reusable).

## Frozen specification version

- IES-011 v1.0 (frozen) + IES-005 / IES-005.1 contracts
- Consumes frozen Energy reference assets read-only

## Compatibility

- Sector-neutral platform reused — no platform change
- Coexists with the five released engines + CSIP
- CSIP ontology compatible (zero change)

## Known limitations

- Absolute calibration thresholds are segment-dependent.
- Commodity-price cyclicality handled via calibration + mid-cycle valuation normalization.

## Verification

- `tsc --noEmit --strict` clean
- **152/152 tests pass**
- All 9 frozen Energy outputs reproduced exactly from a clean git clone
- 9 validation fixtures accepted (incl. price collapse → Watch, reserve write-down → Watch, stranded asset → Watch)
- Independent clean-clone verification passed

## Roadmap

- Energy v1.1/v2.0 via versioned methodology changes
- Program v1.1: Utilities (IES-012), then further sectors
