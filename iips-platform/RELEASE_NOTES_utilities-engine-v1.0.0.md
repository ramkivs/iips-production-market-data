# Release Notes — Utilities Engine v1.0.0 (Platform/Implementation Repository)

**Tag:** `utilities-engine-v1.0.0`
**Release date:** 2026-08-08
**Status:** Production release (promoted from `utilities-engine-rc-1.0.0` after independent verification)

---

## Major capabilities

- **Utilities Engine** (`sector.utilities`): regulated-return metric library (rate base growth, allowed ROE, FFO/Debt, O&M efficiency, demand growth, reliability/SAIDI, transition capex, EBITDA margin, leverage, ROE), D15 band→score→pillar→composite scoring (round-half-to-even), regulated-vs-merchant + segment calibration (5 segments, 3 regulatory postures), decision engine + overrides (adverse rate case, regulatory lag, capex overrun, stranded asset, leverage breach, governance) + precedence, evidence — implements `SectorPlugin`.
- **Ontology registration** — 8-dimension metadata for CSIP with **zero CSIP change**.
- **Reuses the platform unchanged** — 0 platform/framework/engine modifications.
- **Eight-plugin coexistence:** 6 sector engines + CSIP + Utilities.
- Grounded in Regulated Infrastructure Common Principles (reusable).

## Frozen specification version

- IES-012 v1.0 (frozen) + IES-005 / IES-005.1 contracts
- Consumes frozen Utilities reference assets read-only

## Compatibility

- Sector-neutral platform reused — no platform change
- Coexists with the six released engines + CSIP
- CSIP ontology compatible (zero change)

## Known limitations

- Calibration thresholds are segment/regulatory dependent.
- Regulatory economics handled via calibration (regulated vs merchant) + overrides.

## Verification

- `tsc --noEmit --strict` clean
- **180/180 tests pass**
- All 11 frozen Utilities outputs reproduced exactly from a clean git clone
- 11 validation fixtures accepted (incl. adverse rate case, regulatory lag, capex overrun, stranded asset, leverage → Watch)
- Independent clean-clone verification passed

## Roadmap

- Utilities v1.1/v2.0 via versioned methodology changes
- Program v1.1: Consumer (IES-013), then further sectors
